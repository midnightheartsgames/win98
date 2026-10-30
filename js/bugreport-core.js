(function (root) {
  if (root.BugTrace) return;

  const START = Date.now();
  const REMOTE = 'https://pennygachi.men/api/bugs';
  const ID_CHARS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const KINDS = ['bug', 'crash', 'visual', 'text', 'sound', 'balance', 'idea'];
  const REPEATS = ['always', 'sometimes', 'once', 'unknown'];
  const TRAIL_AGE = 5 * 60 * 1000;
  const OUTBOX_DB = 'win98_bugs';
  const QUEUE_DAYS = 14;

  const logRing = [];
  const trailRing = [];
  const errors = new Map();
  const missing = new Map();
  const frames = [];
  let buildPromise = null;
  let localSinkPromise = null;
  let glRenderer;
  let flushing = false;
  let signalling = false;

  const seconds = () => Math.round((Date.now() - START) / 100) / 10;
  const clip = (text, max) => {
    const s = String(text == null ? '' : text);
    return s.length > max ? s.slice(0, max) + '…' : s;
  };
  const push = (ring, item, max) => {
    ring.push(item);
    if (ring.length > max) ring.splice(0, ring.length - max);
  };
  const shortUrl = url => {
    const s = String(url || '');
    const origin = root.location && root.location.origin;
    return origin && s.startsWith(origin + '/') ? s.slice(origin.length + 1) : s;
  };

  function describe(value) {
    if (value instanceof Error) return value.stack || value.name + ': ' + value.message;
    if (value === null || typeof value !== 'object') return String(value);
    if (Array.isArray(value)) return '[Array(' + value.length + ')]';
    if (value.nodeType) return '<' + String(value.nodeName).toLowerCase() + '>';
    const keys = Object.keys(value);
    return '{' + keys.slice(0, 8).join(', ') + (keys.length > 8 ? ', …' : '') + '}';
  }

  function wrapConsole(level) {
    const original = console[level];
    if (typeof original !== 'function') return;
    console[level] = function (...args) {
      push(logRing, { t: seconds(), level, msg: clip(args.map(describe).join(' '), 500) }, level === 'log' || level === 'info' ? 400 : 200);
      if (level === 'error') {
        const err = args.find(a => a instanceof Error);
        if (err) addError(err.name + ': ' + err.message, srcOfStack(err.stack), err.stack, true);
      }
      return original.apply(this, args);
    };
  }

  function srcOfStack(stack) {
    const m = /\(?((?:https?|file):[^\s()]+?):(\d+):(\d+)\)?/.exec(String(stack || ''));
    return m ? shortUrl(m[1]) + ':' + m[2] + ':' + m[3] : '';
  }

  function signalCrash(entry) {
    if (signalling || typeof root.dispatchEvent !== 'function' || typeof root.CustomEvent !== 'function') return;
    signalling = true;
    try {
      root.dispatchEvent(new root.CustomEvent('bugreport-crash', { detail: Object.assign({}, entry) }));
    } catch (err) {
    } finally {
      signalling = false;
    }
  }

  function addError(msg, src, stack, caught) {
    const key = msg + '|' + src;
    const known = errors.get(key);
    if (known) {
      known.count++;
      known.t = seconds();
      if (known.caught && known.count === 3) signalCrash(known);
      return;
    }
    const entry = { t: seconds(), msg: clip(msg, 300), src, stack: clip(stack || '', 2000), count: 1 };
    if (caught) entry.caught = true;
    errors.set(key, entry);
    if (errors.size > 50) errors.delete(errors.keys().next().value);
    if (!caught) signalCrash(entry);
  }

  function addMissing(el) {
    const url = shortUrl(el.currentSrc || el.src || el.href || '');
    if (!url) return;
    const known = missing.get(url);
    if (known) known.count++;
    else missing.set(url, { t: seconds(), tag: String(el.tagName).toLowerCase(), url: clip(url, 300), count: 1 });
    if (missing.size > 50) missing.delete(missing.keys().next().value);
  }

  function onError(e) {
    const el = e.target;
    if (el && el !== root && el.tagName) {
      addMissing(el);
      return;
    }
    const src = e.filename ? shortUrl(e.filename) + ':' + e.lineno + ':' + e.colno : '';
    addError(e.message || 'Error', src, e.error && e.error.stack);
  }

  function onRejection(e) {
    const reason = e.reason;
    addError('Unhandled rejection: ' + (reason && reason.message ? reason.message : describe(reason)), '', reason && reason.stack);
  }

  function activeWindow() {
    const wm = root.winManager;
    return wm && wm.activeWindowId ? wm.activeWindowId : '';
  }

  function windowOf(node) {
    const el = node && node.closest ? node.closest('.win-window') : null;
    return el ? el.id : activeWindow();
  }

  function clickedWindow(node) {
    const el = node && node.closest ? node.closest('.win-window') : null;
    return el ? el.id : '';
  }

  function isTextField(t) {
    if (!t || !t.tagName) return false;
    if (t.isContentEditable || t.tagName === 'TEXTAREA') return true;
    if (t.tagName !== 'INPUT') return false;
    return !/^(button|submit|reset|checkbox|radio|range|file|color|image)$/i.test(t.type || '');
  }

  function note(type, data) {
    push(trailRing, Object.assign({ t: seconds(), at: Date.now(), type }, data), 150);
  }

  function onKey(e) {
    if (e.repeat || ['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
    const t = e.target;
    if (t && t.type === 'password') return;
    const win = windowOf(t);
    if (isTextField(t) && !e.ctrlKey && !e.altKey && !e.metaKey && String(e.key).length === 1) {
      const last = trailRing[trailRing.length - 1];
      if (last && last.type === 'typing' && last.win === win) {
        last.t = seconds();
        last.at = Date.now();
      } else note('typing', { win });
      return;
    }
    const mods = (e.ctrlKey ? 'Ctrl+' : '') + (e.altKey ? 'Alt+' : '') + (e.shiftKey ? 'Shift+' : '') + (e.metaKey ? 'Meta+' : '');
    note('key', { code: mods + (e.code || e.key), win });
  }

  function describeElement(el) {
    if (!el || !el.tagName) return '';
    let s = String(el.tagName).toLowerCase();
    if (el.id) s += '#' + el.id;
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2) : [];
    if (cls.length) s += '.' + cls.join('.');
    const labelled = el.closest ? el.closest('button, a, label, li, [role="button"], [role="menuitem"], .desktop-icon, .win-menu-item') : null;
    if (labelled && !isTextField(labelled)) {
      const text = String(labelled.textContent || '').replace(/\s+/g, ' ').trim();
      if (text) s += ' "' + clip(text, 30) + '"';
    }
    return s;
  }

  function onPointer(e) {
    if (isTextField(e.target)) {
      note('click', { win: clickedWindow(e.target), el: String(e.target.tagName).toLowerCase() });
      return;
    }
    note('click', { win: clickedWindow(e.target), el: describeElement(e.target), x: Math.round(e.clientX), y: Math.round(e.clientY) });
  }

  function wrapMethod(obj, name, after) {
    const original = obj[name];
    if (typeof original !== 'function' || original.bugTraced) return;
    const wrapped = function (...args) {
      const before = obj.activeWindowId;
      const result = original.apply(this, args);
      try { after(args, result, before); } catch (err) {}
      return result;
    };
    wrapped.bugTraced = true;
    obj[name] = wrapped;
  }

  function hookShell() {
    const wm = root.winManager;
    if (!wm) return;
    wrapMethod(wm, 'createWindow', (args, win) => {
      const last = trailRing[trailRing.length - 1];
      if (last && last.type === 'focus' && win && last.win === win.id) trailRing.pop();
      note('open', { win: win && win.id, title: clip(win && win.title, 60) });
    });
    wrapMethod(wm, 'closeWindow', args => note('close', { win: args[0] }));
    wrapMethod(wm, 'minimizeWindow', args => note('minimize', { win: args[0] }));
    wrapMethod(wm, 'toggleMaximize', args => note('maximize', { win: args[0] }));
    wrapMethod(wm, 'bringToTop', (args, r, before) => {
      if (before !== wm.activeWindowId) note('focus', { win: args[0] });
    });
  }

  function tick(ts) {
    frames.push(ts);
    while (frames.length > 1 && ts - frames[0] > 2000) frames.shift();
    root.requestAnimationFrame(tick);
  }

  function fps() {
    if (frames.length < 2) return null;
    const span = frames[frames.length - 1] - frames[0];
    return span > 0 ? Math.round((frames.length - 1) * 1000 / span) : null;
  }

  function heapMB() {
    const mem = root.performance && root.performance.memory;
    return mem ? Math.round(mem.usedJSHeapSize / 1048576) : null;
  }

  function storageKB() {
    try {
      const ls = root.localStorage;
      let chars = 0;
      for (let i = 0; i < ls.length; i++) {
        const key = ls.key(i);
        chars += key.length + (ls.getItem(key) || '').length;
      }
      return Math.round(chars * 2 / 1024);
    } catch (err) {
      return null;
    }
  }

  function webglRenderer() {
    if (glRenderer !== undefined) return glRenderer;
    glRenderer = null;
    try {
      const gl = root.document.createElement('canvas').getContext('webgl');
      if (gl) {
        const info = gl.getExtension('WEBGL_debug_renderer_info');
        glRenderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
        const lose = gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
      }
    } catch (err) {}
    return glRenderer;
  }

  function newId(date) {
    const d = date || new Date();
    const p = n => String(n).padStart(2, '0');
    const bytes = new Uint8Array(4);
    if (root.crypto && root.crypto.getRandomValues) root.crypto.getRandomValues(bytes);
    else for (let i = 0; i < 4; i++) bytes[i] = Math.floor(Math.random() * 256);
    const code = Array.from(bytes, b => ID_CHARS[b % 32]).join('');
    return 'BR-' + p(d.getFullYear() % 100) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + code;
  }

  function hasLocalSink() {
    if (!localSinkPromise) {
      const http = root.location && /^https?:$/.test(root.location.protocol);
      localSinkPromise = !http || typeof root.fetch !== 'function'
        ? Promise.resolve(false)
        : root.fetch('/api/bugs/ping', { cache: 'no-store' })
          .then(r => (r.ok ? r.json() : null))
          .then(j => !!(j && j.local))
          .catch(() => false);
    }
    return localSinkPromise;
  }

  function buildInfo() {
    if (!buildPromise) {
      const http = root.location && /^https?:$/.test(root.location.protocol);
      buildPromise = root.Win98Build ? Promise.resolve(root.Win98Build) : !http || typeof root.fetch !== 'function'
        ? Promise.resolve({})
        : root.fetch('build.json', { cache: 'no-store' })
          .then(r => (r.ok ? r.json() : {}))
          .catch(() => ({}));
    }
    return buildPromise.then(info => {
      const out = Object.assign({}, info);
      if (root.Hsr98 && root.Hsr98.VERSION) out.hsr = root.Hsr98.VERSION;
      return out;
    });
  }

  function channel(local) {
    if (root.Hsr98Standalone) return 'sr98-' + root.Hsr98Standalone;
    if (root.Parohod98 && typeof root.Parohod98 === 'object' && root.Parohod98.edition) return 'parohod98-' + root.Parohod98.edition;
    if (root.Parohod98) return 'parohod98-apk';
    const ua = (root.navigator && root.navigator.userAgent) || '';
    if (/Electron\//.test(ua)) return 'exe';
    return local ? 'browser-dev' : 'browser';
  }

  function system() {
    const nav = root.navigator || {};
    const scr = root.screen || {};
    return {
      ua: nav.userAgent || '',
      lang: root.i18n && root.i18n.getLanguage ? root.i18n.getLanguage() : nav.language || '',
      viewport: [root.innerWidth || 0, root.innerHeight || 0],
      screen: [scr.width || 0, scr.height || 0],
      dpr: root.devicePixelRatio || 1,
      uptime: seconds(),
      fps: fps(),
      heapMB: heapMB(),
      storageKB: storageKB(),
      gl: webglRenderer()
    };
  }

  function windows() {
    const wm = root.winManager;
    if (!wm || !wm.windows) return [];
    const list = [];
    wm.windows.forEach(w => {
      const el = w.element;
      const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      list.push({
        id: w.id,
        title: clip(w.title, 80),
        active: wm.activeWindowId === w.id,
        min: !!w.isMinimized,
        max: !!w.isMaximized,
        z: el ? Number(el.style.zIndex) || 0 : 0,
        rect: r ? [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] : null
      });
    });
    return list.sort((a, b) => b.z - a.z);
  }

  function defaultWhere() {
    const wm = root.winManager;
    const id = activeWindow();
    const win = id && wm.windows.get(id);
    if (!win) return { summary: 'Рабочий стол', window: '', app: '' };
    return { summary: clip(win.title, 200), window: id, app: id };
  }

  function userPart(user) {
    const u = user || {};
    return {
      title: clip(u.title, 200).trim(),
      text: clip(u.text, 4000).trim(),
      kind: KINDS.includes(u.kind) ? u.kind : 'bug',
      repeat: REPEATS.includes(u.repeat) ? u.repeat : 'unknown',
      contact: clip(u.contact, 200).trim()
    };
  }

  async function build(input) {
    const opts = input || {};
    const now = new Date();
    const local = await hasLocalSink();
    const cutoff = Date.now() - TRAIL_AGE;
    return {
      format: 'win98-bugreport',
      v: 1,
      id: opts.id || newId(now),
      created: now.toISOString(),
      source: opts.source || 'win98',
      channel: channel(local),
      build: Object.assign(await buildInfo(), local ? { dev: true } : {}),
      user: userPart(opts.user),
      where: opts.where || defaultWhere(),
      system: system(),
      windows: windows(),
      apps: opts.apps || {},
      errors: Array.from(errors.values()),
      missing: Array.from(missing.values()),
      log: logRing.slice(),
      trail: trailRing.filter(e => e.at >= cutoff).map(e => {
        const copy = Object.assign({}, e);
        delete copy.at;
        return copy;
      }),
      attach: { shot: null, marked: null, save: null, marks: [] }
    };
  }

  async function toBase64(value) {
    if (typeof value === 'string') return value;
    let bytes;
    if (value instanceof Uint8Array) bytes = value;
    else if (value instanceof ArrayBuffer) bytes = new Uint8Array(value);
    else bytes = new Uint8Array(await value.arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return root.btoa(bin);
  }

  async function pack(report, files) {
    const out = {};
    for (const [name, value] of Object.entries(files || {})) {
      if (value != null) out[name] = await toBase64(value);
    }
    return { format: 'win98-bugreport-file', v: 1, report, files: out };
  }

  async function postBody(body) {
    const local = await hasLocalSink();
    const url = local ? '/api/bugs' : REMOTE;
    const res = await root.fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    let data = {};
    try { data = await res.json(); } catch (err) {}
    if (!res.ok || !data.ok) {
      const err = new Error(data.error || 'HTTP ' + res.status);
      err.status = res.status;
      throw err;
    }
    return { id: data.id, local: !!data.local };
  }

  async function send(report, files) {
    const res = await postBody(JSON.stringify(await pack(report, files)));
    return { id: res.id || report.id, local: res.local };
  }

  function shouldQueue(err) {
    return !err.status || err.status >= 500;
  }

  function openOutbox() {
    return new Promise((resolve, reject) => {
      const req = root.indexedDB.open(OUTBOX_DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore('outbox', { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function outbox(mode, fn) {
    const db = await openOutbox();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('outbox', mode);
        const result = fn(tx.objectStore('outbox'));
        tx.oncomplete = () => resolve(result && 'result' in result ? result.result : undefined);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  }

  async function queue(report, files) {
    const body = JSON.stringify(await pack(report, files));
    await outbox('readwrite', store => store.put({ id: report.id, at: Date.now(), body, tries: 0 }));
    return report.id;
  }

  async function queued() {
    if (!root.indexedDB) return [];
    const items = await outbox('readonly', store => store.getAll());
    return (items || []).map(i => i.id);
  }

  function announce(type, detail) {
    if (typeof root.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') root.dispatchEvent(new root.CustomEvent(type, { detail }));
  }

  async function flushQueue() {
    if (flushing || !root.indexedDB) return 0;
    flushing = true;
    let sent = 0;
    try {
      const items = (await outbox('readonly', store => store.getAll())) || [];
      items.sort((a, b) => a.at - b.at);
      for (const item of items) {
        if (Date.now() - item.at > QUEUE_DAYS * 86400000) {
          await outbox('readwrite', store => store.delete(item.id));
          announce('bugreport-dropped', { id: item.id });
          continue;
        }
        try {
          const res = await postBody(item.body);
          await outbox('readwrite', store => store.delete(item.id));
          announce('bugreport-sent', { id: item.id, local: res.local });
          sent++;
        } catch (err) {
          if (err.status === 409) {
            await outbox('readwrite', store => store.delete(item.id));
            announce('bugreport-sent', { id: item.id, local: false });
          } else if (shouldQueue(err)) {
            await outbox('readwrite', store => store.put(Object.assign(item, { tries: item.tries + 1 })));
            break;
          } else {
            await outbox('readwrite', store => store.delete(item.id));
            announce('bugreport-rejected', { id: item.id, error: err.message });
          }
        }
        await new Promise(r => root.setTimeout(r, 5000));
      }
    } finally {
      flushing = false;
    }
    return sent;
  }

  async function statuses(ids) {
    const list = (ids || []).filter(id => /^BR-\d{6}-[0-9A-HJKMNP-TV-Z]{4}$/.test(id)).slice(0, 50);
    if (!list.length) return {};
    const res = await root.fetch(REMOTE + '/status?ids=' + list.join(','), { cache: 'no-store' });
    let data = {};
    try { data = await res.json(); } catch (err) {}
    if (!res.ok || !data.ok) throw new Error(data.error || 'HTTP ' + res.status);
    return data.items || {};
  }

  ['log', 'info', 'warn', 'error'].forEach(wrapConsole);
  if (typeof root.addEventListener === 'function') {
    root.addEventListener('error', onError, true);
    root.addEventListener('unhandledrejection', onRejection);
    root.addEventListener('keydown', onKey, true);
    root.addEventListener('pointerdown', onPointer, true);
    root.addEventListener('DOMContentLoaded', hookShell);
    root.addEventListener('load', hookShell);
  }
  if (typeof root.requestAnimationFrame === 'function') root.requestAnimationFrame(tick);
  if (root.indexedDB && typeof root.setTimeout === 'function') root.setTimeout(() => flushQueue().catch(() => {}), 15000);

  root.BugTrace = {
    note: (msg, data) => note('app', Object.assign({ msg: clip(msg, 200) }, data || {})),
    hookShell
  };
  root.BugReport = { REMOTE, KINDS, REPEATS, newId, build, pack, send, queue, queued, flushQueue, shouldQueue, statuses, hasLocalSink, buildInfo };
})(typeof window !== 'undefined' ? window : globalThis);
