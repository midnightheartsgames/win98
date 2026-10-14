/**
 * Netscape 6 — движок рендеринга JS-сайтов
 * -----------------------------------------------------------
 * Современные сайты (YouTube, SPA на React/Vue и т.п.) отдают
 * почти пустой HTML и собирают страницу JavaScript'ом. Для них
 * шлюз поднимает headless Edge/Chrome, открывает страницу,
 * ждёт, пока она «дорисуется», и забирает готовый DOM.
 *
 * Работает через Chrome DevTools Protocol по WebSocket
 * (global WebSocket из Node 22+), без сторонних пакетов.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BROWSER_CANDIDATES = [
  process.env.NETSCAPE_BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  path.join(os.homedir(), 'AppData/Local/Google/Chrome/Application/chrome.exe'),
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
].filter(Boolean);

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// Тяжёлое и бесполезное для Web 1.0 не качаем вовсе
const BLOCKED_URLS = [
  '*.mp4*', '*.webm*', '*.m3u8*', '*.woff*', '*.ttf*', '*.otf*',
  '*googlevideo.com*', '*doubleclick.net*', '*googlesyndication.com*',
  '*google-analytics.com*', '*googletagmanager.com*', '*mc.yandex.ru*',
  '*facebook.net*', '*hotjar*'
];

const MAX_CONCURRENT = 2;
const IDLE_SHUTDOWN_MS = 5 * 60 * 1000;

function findBrowser() {
  return BROWSER_CANDIDATES.find((p) => {
    try {
      return fs.statSync(p).isFile();
    } catch (e) {
      return false;
    }
  }) || null;
}

/* ------------------------------------------------------------------ */
/* Минимальный CDP-клиент                                              */
/* ------------------------------------------------------------------ */

class CdpConnection {
  constructor(wsUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Set();
    this.ready = new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(new Error('CDP: ошибка WebSocket'));
      this.ws.onclose = () => {
        this.closed = true;
        this.pending.forEach(({ reject: rej }) => rej(new Error('CDP: соединение закрыто')));
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
    if (this.closed) return Promise.reject(new Error('CDP: соединение закрыто'));
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

/* ------------------------------------------------------------------ */
/* Жизненный цикл браузера                                             */
/* ------------------------------------------------------------------ */

let browserProc = null;
let connection = null;
let launching = null;
let active = 0;
const queue = [];
let idleTimer = null;

function launchBrowser() {
  if (connection && !connection.closed) return Promise.resolve(connection);
  if (launching) return launching;

  const exe = findBrowser();
  if (!exe) return Promise.reject(new Error('Не найден Edge/Chrome для рендеринга'));

  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'netscape6-'));

  launching = new Promise((resolve, reject) => {
    const proc = spawn(exe, [
      '--headless=new',
      '--remote-debugging-port=0',
      '--user-data-dir=' + profileDir,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-gpu',
      '--mute-audio',
      '--autoplay-policy=user-gesture-required',
      '--window-size=1024,768',
      'about:blank'
    ], { stdio: ['ignore', 'ignore', 'pipe'] });

    const timer = setTimeout(() => reject(new Error('Браузер не запустился')), 15000);
    let stderr = '';

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      const m = /DevTools listening on (ws:\/\/\S+)/.exec(stderr);
      if (m && !connection) {
        clearTimeout(timer);
        const conn = new CdpConnection(m[1]);
        conn.ready.then(() => {
          connection = conn;
          resolve(conn);
        }, reject);
      }
    });

    proc.on('exit', () => {
      browserProc = null;
      connection = null;
      try {
        fs.rmSync(profileDir, { recursive: true, force: true });
      } catch (e) {}
    });
    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    browserProc = proc;
  }).finally(() => {
    launching = null;
  });

  return launching;
}

function shutdown() {
  if (connection) connection.close();
  if (browserProc) {
    try {
      browserProc.kill();
    } catch (e) {}
  }
  connection = null;
  browserProc = null;
}

function scheduleIdleShutdown() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (active === 0) shutdown();
  }, IDLE_SHUTDOWN_MS);
  if (idleTimer.unref) idleTimer.unref();
}

process.on('exit', shutdown);
['SIGINT', 'SIGTERM'].forEach((sig) =>
  process.on(sig, () => {
    shutdown();
    process.exit(0);
  })
);

/* ------------------------------------------------------------------ */
/* Рендеринг одной страницы                                            */
/* ------------------------------------------------------------------ */

// Выполняется внутри отрисованной страницы: чистим DOM и делаем
// все ссылки/картинки абсолютными, пока браузер ещё знает base URL.
const SNAPSHOT_SCRIPT = `(() => {
  const d = document;
  d.querySelectorAll('img').forEach((img) => {
    const src = img.currentSrc || img.src;
    if (src && !src.startsWith('data:')) img.setAttribute('src', src);
    img.removeAttribute('srcset');
  });
  d.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', a.href));
  // Фоновые картинки-превью (часто у видео/карточек) -> <img>
  d.querySelectorAll('[style*="background-image"]').forEach((el) => {
    const m = /url\\(["']?([^"')]+)["']?\\)/.exec(el.style.backgroundImage || '');
    if (m && !el.querySelector('img') && el.offsetWidth > 60) {
      const img = d.createElement('img');
      img.src = new URL(m[1], location.href).href;
      el.prepend(img);
    }
  });
  // Невидимое не нужно
  d.querySelectorAll('script,style,noscript,template,svg,link,iframe,video,audio,canvas').forEach((n) => n.remove());
  d.querySelectorAll('[hidden],[aria-hidden="true"]').forEach((n) => {
    if (!n.querySelector('a,img')) n.remove();
  });
  const title = d.title;
  const metas = {};
  d.querySelectorAll('meta[property],meta[name]').forEach((m) => {
    metas[(m.getAttribute('property') || m.getAttribute('name')).toLowerCase()] = m.content;
  });
  return JSON.stringify({
    url: location.href,
    title,
    metas,
    html: '<html><head><title>' + title.replace(/</g, '&lt;') + '</title></head>' +
          d.body.outerHTML + '</html>',
    textLength: (d.body.innerText || '').length
  });
})()`;

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function renderOnce(url, { timeoutMs = 20000 } = {}) {
  const conn = await launchBrowser();
  const { targetId } = await conn.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await conn.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (method, params) => conn.send(method, params, sessionId);

  let loaded = false;
  const off = conn.on((msg) => {
    if (msg.sessionId === sessionId && msg.method === 'Page.loadEventFired') loaded = true;
  });

  const deadline = Date.now() + timeoutMs;
  try {
    await send('Page.enable');
    await send('Network.enable');
    await send('Network.setUserAgentOverride', {
      userAgent: DESKTOP_UA,
      acceptLanguage: 'ru-RU,ru;q=0.9,en;q=0.8'
    });
    await send('Network.setBlockedURLs', { urls: BLOCKED_URLS });
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1024, height: 768, deviceScaleFactor: 1, mobile: false
    });

    const nav = await send('Page.navigate', { url });
    if (nav.errorText) throw new Error('Сайт недоступен: ' + nav.errorText);

    // 1) ждём load (но не дольше половины бюджета)
    const loadDeadline = Math.min(deadline, Date.now() + timeoutMs / 2);
    while (!loaded && Date.now() < loadDeadline) await delay(150);

    // 2) прокручиваем, чтобы подгрузились ленивые блоки,
    //    и ждём, пока объём текста перестанет расти
    let lastLen = -1;
    let stable = 0;
    for (let i = 0; i < 16 && Date.now() < deadline; i++) {
      const r = await send('Runtime.evaluate', {
        expression:
          'window.scrollBy(0, 900); (document.body && document.body.innerText || "").length',
        returnByValue: true
      });
      const len = (r.result && r.result.value) || 0;
      stable = len === lastLen && len > 0 ? stable + 1 : 0;
      if (stable >= 2) break;
      lastLen = len;
      await delay(450);
    }

    const snap = await send('Runtime.evaluate', {
      expression: SNAPSHOT_SCRIPT,
      returnByValue: true
    });
    if (!snap.result || typeof snap.result.value !== 'string') {
      throw new Error('Не удалось прочитать страницу');
    }
    return JSON.parse(snap.result.value);
  } finally {
    off();
    conn.send('Target.closeTarget', { targetId }).catch(() => {});
  }
}

/**
 * Рендерит страницу в headless-браузере. Не больше MAX_CONCURRENT
 * вкладок одновременно, остальные ждут в очереди.
 */
function render(url, options) {
  return new Promise((resolve, reject) => {
    const job = async () => {
      active++;
      clearTimeout(idleTimer);
      try {
        resolve(await renderOnce(url, options));
      } catch (e) {
        // Браузер мог умереть — в следующий раз перезапустим
        if (connection && connection.closed) connection = null;
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
  return !!findBrowser();
}

module.exports = { render, isAvailable, shutdown };
