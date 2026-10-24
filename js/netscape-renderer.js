const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { snapshotExpression } = require('./netscape-snapshot');

const BROWSER_CANDIDATES = [
  process.env.NETSCAPE_BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  path.join(os.homedir(), 'AppData/Local/Google/Chrome/Application/chrome.exe'),
  path.join(os.homedir(), 'AppData/Local/Chromium/Application/chrome.exe'),
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/microsoft-edge',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Chromium.app/Contents/MacOS/Chromium'
].filter(Boolean);

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0 Safari/537.36';

const VIEWPORT = { width: 1024, height: 768 };

const BLOCKED_URLS = [
  '*.mp4*', '*.webm*', '*.m3u8*', '*.mpd*', '*.mp3*', '*.ogg*', '*.woff2*', '*.woff*', '*.ttf*', '*.otf*', '*.eot*',
  '*googlevideo.com*', '*doubleclick.net*', '*googlesyndication.com*', '*googleadservices.com*',
  '*google-analytics.com*', '*googletagmanager.com*', '*mc.yandex.ru*', '*an.yandex.ru*', '*yandex.ru/ads*',
  '*facebook.net*', '*connect.facebook.com*', '*hotjar*', '*criteo*', '*adfox*', '*scorecardresearch*',
  '*://localhost*', '*://127.*', '*://0.0.0.0*', '*://10.*', '*://192.168.*', '*://169.254.*', '*://[::1]*',
  ...Array.from({ length: 16 }, (_, i) => '*://172.' + (16 + i) + '.*')
];

const MAX_CONCURRENT = 2;
const IDLE_SHUTDOWN_MS = 5 * 60 * 1000;
const DEFAULT_TIMEOUT_MS = 25000;

function findBrowser() {
  return BROWSER_CANDIDATES.find((p) => {
    try {
      return fs.statSync(p).isFile();
    } catch (e) {
      return false;
    }
  }) || null;
}

function electronModule() {
  if (!process.versions.electron) return null;
  try {
    const electron = require('electron');
    return electron && electron.app && (electron.WebContentsView || electron.BrowserWindow) ? electron : null;
  } catch (e) {
    return null;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function abortError() {
  const err = new Error('Загрузка отменена');
  err.aborted = true;
  return err;
}

class CdpConnection {
  constructor(wsUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Set();
    this.closed = false;
    this.ready = new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = () => reject(new Error('Нет связи с движком отрисовки'));
      this.ws.onclose = () => {
        this.closed = true;
        this.pending.forEach(({ reject: fail }) => fail(new Error('Движок отрисовки закрыл соединение')));
        this.pending.clear();
      };
      this.ws.onmessage = (ev) => this.onMessage(ev.data);
    });
  }

  onMessage(raw) {
    let msg;
    try {
      msg = JSON.parse(typeof raw === 'string' ? raw : raw.toString());
    } catch (e) {
      return;
    }
    if (msg.id && this.pending.has(msg.id)) {
      const { resolve, reject } = this.pending.get(msg.id);
      this.pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
      return;
    }
    if (msg.method) this.listeners.forEach((fn) => fn(msg));
  }

  send(method, params = {}, sessionId) {
    if (this.closed) return Promise.reject(new Error('Движок отрисовки недоступен'));
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
    });
  }

  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  close() {
    try {
      this.ws.close();
    } catch (e) {}
  }
}

const chromium = {
  proc: null,
  connection: null,
  launching: null,
  profileDir: null,

  launch() {
    if (this.connection && !this.connection.closed) return Promise.resolve(this.connection);
    if (this.launching) return this.launching;
    const exe = findBrowser();
    if (!exe) return Promise.reject(new Error('Не найден Edge или Chrome для отрисовки страниц'));

    this.profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'netscape6-'));
    const profileDir = this.profileDir;

    this.launching = new Promise((resolve, reject) => {
      const proc = spawn(exe, [
        '--headless=new',
        '--remote-debugging-port=0',
        '--user-data-dir=' + profileDir,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--disable-gpu',
        '--disable-sync',
        '--disable-background-networking',
        '--mute-audio',
        '--hide-scrollbars',
        '--autoplay-policy=user-gesture-required',
        '--window-size=' + VIEWPORT.width + ',' + VIEWPORT.height,
        'about:blank'
      ], { stdio: ['ignore', 'ignore', 'pipe'] });

      const timer = setTimeout(() => reject(new Error('Движок отрисовки не запустился')), 15000);
      let stderr = '';

      proc.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
        const m = /DevTools listening on (ws:\/\/\S+)/.exec(stderr);
        if (m && !this.connection) {
          clearTimeout(timer);
          const conn = new CdpConnection(m[1]);
          this.connection = conn;
          conn.ready.then(() => {
            conn.send('Browser.setDownloadBehavior', { behavior: 'deny' }).catch(() => {});
            resolve(conn);
          }, reject);
        }
      });

      proc.on('exit', () => {
        this.proc = null;
        this.connection = null;
        try {
          fs.rmSync(profileDir, { recursive: true, force: true });
        } catch (e) {}
      });
      proc.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      this.proc = proc;
    }).finally(() => {
      this.launching = null;
    });

    return this.launching;
  },

  async openTab() {
    const conn = await this.launch();
    const { targetId } = await conn.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await conn.send('Target.attachToTarget', { targetId, flatten: true });
    return {
      send: (method, params) => conn.send(method, params || {}, sessionId),
      on: (fn) => conn.on((msg) => {
        if (msg.sessionId === sessionId) fn(msg.method, msg.params || {});
      }),
      close: () => {
        conn.send('Target.closeTarget', { targetId }).catch(() => {});
      }
    };
  },

  shutdown() {
    if (this.connection) this.connection.close();
    if (this.proc) {
      try {
        this.proc.kill();
      } catch (e) {}
    }
    this.connection = null;
    this.proc = null;
  }
};

const electronEngine = {
  sessionReady: false,

  async openTab() {
    const electron = electronModule();
    await electron.app.whenReady();
    const webPreferences = {
      partition: 'netscape6',
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      offscreen: false
    };
    let view = null;
    let win = null;
    if (electron.WebContentsView) {
      view = new electron.WebContentsView({ webPreferences });
    } else {
      win = new electron.BrowserWindow({ show: false, width: VIEWPORT.width, height: VIEWPORT.height, webPreferences });
    }
    const wc = view ? view.webContents : win.webContents;
    if (!this.sessionReady) {
      this.sessionReady = true;
      wc.session.on('will-download', (event, item) => item.cancel());
    }
    wc.setAudioMuted(true);
    wc.setWindowOpenHandler(() => ({ action: 'deny' }));
    await wc.loadURL('about:blank');
    const dbg = wc.debugger;
    dbg.attach('1.3');
    const listeners = new Set();
    dbg.on('message', (event, method, params) => listeners.forEach((fn) => fn(method, params || {})));
    const holder = view || win;
    return {
      holder,
      send: (method, params) => dbg.sendCommand(method, params || {}),
      on: (fn) => {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
      close: () => {
        try {
          dbg.detach();
        } catch (e) {}
        try {
          if (holder === win) win.destroy();
          else holder.webContents.close();
        } catch (e) {}
      }
    };
  },

  shutdown() {}
};

function engine() {
  return electronModule() ? electronEngine : chromium;
}

async function waitFor(check, until, signal, step = 120) {
  while (!check() && Date.now() < until) {
    if (signal && signal.aborted) throw abortError();
    await delay(step);
  }
}

async function evaluate(tab, expression) {
  let r;
  for (let attempt = 0; ; attempt++) {
    try {
      r = await tab.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: false });
      break;
    } catch (e) {
      if (attempt >= 12 || !/no target|context|not found/i.test(e.message)) throw e;
      await delay(250);
    }
  }
  if (r.exceptionDetails) throw new Error('Ошибка сценария отрисовки: ' + (r.exceptionDetails.text || ''));
  return r.result ? r.result.value : undefined;
}

async function renderOnce(url, options) {
  const javascript = options.javascript !== false;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const signal = options.signal;
  const tab = await engine().openTab();

  let loaded = false;
  let mainFrame = null;
  let status = 0;
  let mimeType = '';
  const off = tab.on((method, params) => {
    if (method === 'Page.loadEventFired') loaded = true;
    if (method === 'Network.responseReceived' && params.type === 'Document' && (!mainFrame || params.frameId === mainFrame) && !status) {
      status = params.response.status;
      mimeType = params.response.mimeType || '';
    }
  });

  const deadline = Date.now() + timeoutMs;
  try {
    await tab.send('Page.enable');
    await tab.send('Network.enable');
    await tab.send('Network.setUserAgentOverride', { userAgent: DESKTOP_UA, acceptLanguage: 'ru-RU,ru;q=0.9,en;q=0.8' });
    await tab.send('Network.setBlockedURLs', { urls: BLOCKED_URLS });
    await tab.send('Emulation.setDeviceMetricsOverride', { width: VIEWPORT.width, height: VIEWPORT.height, deviceScaleFactor: 1, mobile: false });
    if (!javascript) await tab.send('Emulation.setScriptExecutionDisabled', { value: true });

    const nav = await tab.send('Page.navigate', { url });
    mainFrame = nav.frameId || null;
    if (nav.errorText) throw new Error('Сайт недоступен (' + nav.errorText + ')');

    await waitFor(() => loaded, Math.min(deadline, Date.now() + timeoutMs * 0.55), signal);

    if (javascript) {
      let lastLen = -1;
      let stable = 0;
      for (let i = 0; i < 8 && Date.now() < deadline - 2500; i++) {
        if (signal && signal.aborted) throw abortError();
        const len = await evaluate(tab, 'window.scrollBy(0, Math.round(window.innerHeight * 1.2)); (document.body && document.body.innerText || "").length') || 0;
        stable = len === lastLen && len > 0 ? stable + 1 : 0;
        if (stable >= 2) break;
        lastLen = len;
        await delay(400);
      }
      await evaluate(tab, 'window.scrollTo(0, 0); 0');
      await delay(350);
    } else {
      await evaluate(tab, 'window.scrollTo(0, 0); 0');
    }

    if (signal && signal.aborted) throw abortError();
    const raw = await evaluate(tab, snapshotExpression({ maxNodes: 20000, javascript }));
    if (typeof raw !== 'string') throw new Error('Не удалось прочитать страницу');
    const snap = JSON.parse(raw);
    snap.status = status;
    snap.mimeType = mimeType;
    snap.javascript = javascript;
    return snap;
  } finally {
    off();
    tab.close();
  }
}

let active = 0;
const queue = [];
let idleTimer = null;

function scheduleIdleShutdown() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (active === 0) chromium.shutdown();
  }, IDLE_SHUTDOWN_MS);
  if (idleTimer.unref) idleTimer.unref();
}

function render(url, options = {}) {
  return new Promise((resolve, reject) => {
    const job = async () => {
      active++;
      clearTimeout(idleTimer);
      try {
        if (options.signal && options.signal.aborted) throw abortError();
        resolve(await renderOnce(url, options));
      } catch (e) {
        if (chromium.connection && chromium.connection.closed) chromium.connection = null;
        reject(e);
      } finally {
        active--;
        if (queue.length) queue.shift()();
        else scheduleIdleShutdown();
      }
    };
    if (active < MAX_CONCURRENT) job();
    else queue.push(job);
  });
}

function isAvailable() {
  return !!electronModule() || !!findBrowser();
}

function engineName() {
  if (electronModule()) return 'electron';
  return findBrowser() ? 'chromium' : null;
}

function shutdown() {
  chromium.shutdown();
}

process.on('exit', shutdown);
['SIGINT', 'SIGTERM'].forEach((sig) => process.once(sig, () => {
  shutdown();
  process.exit(0);
}));

module.exports = { render, isAvailable, engineName, shutdown, VIEWPORT };
