const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Stage 2 Programs (CD Player, System Monitor, HyperTerminal, Clipboard Viewer) ---');

const storage = new Map();
const mockLocalStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};

function createMockElement(tag = 'div', id = '') {
  const el = {
    tagName: tag.toUpperCase(),
    id,
    dataset: {},
    style: {},
    disabled: false,
    checked: false,
    value: '',
    textContent: '',
    _innerHTML: '',
    clientWidth: 640,
    clientHeight: 480,
    width: 640,
    height: 480,
    children: [],
    classList: {
      _set: new Set(),
      add(...cls) { cls.forEach(c => this._set.add(c)); },
      remove(...cls) { cls.forEach(c => this._set.delete(c)); },
      toggle(c, force) {
        if (force === undefined) {
          if (this._set.has(c)) { this._set.delete(c); return false; }
          this._set.add(c); return true;
        }
        if (force) this._set.add(c); else this._set.delete(c);
        return !!force;
      },
      contains(c) { return this._set.has(c); }
    },
    appendChild(c) {
      this.children.push(c);
      c.parentNode = this;
      return c;
    },
    remove() {},
    focus() {},
    select() {},
    setSelectionRange() {},
    scrollIntoView() {},
    closest() { return null; },
    addEventListener(evt, fn) {
      this._listeners = this._listeners || {};
      this._listeners[evt] = this._listeners[evt] || [];
      this._listeners[evt].push(fn);
    },
    removeEventListener() {},
    dispatchEvent() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 480 }),
    toDataURL: () => 'data:image/bmp;base64,mock',
    getContext: () => ({
      fillStyle: '#000',
      strokeStyle: '#fff',
      lineWidth: 1,
      font: '12px monospace',
      textAlign: 'left',
      textBaseline: 'top',
      fillRect() {},
      strokeRect() {},
      clearRect() {},
      beginPath() {},
      closePath() {},
      arc() {},
      ellipse() {},
      fill() {},
      moveTo() {},
      lineTo() {},
      bezierCurveTo() {},
      stroke() {},
      fillText() {},
      strokeText() {},
      save() {},
      restore() {},
      translate() {},
      rotate() {},
      scale() {},
      setLineDash() {},
      measureText: (txt) => ({ width: String(txt || '').length * 8 }),
      createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
      putImageData() {},
      createLinearGradient: () => ({ addColorStop() {} }),
      createRadialGradient: () => ({ addColorStop() {} })
    }),
    querySelector(sel) {
      if (!this._qCache) this._qCache = {};
      if (!this._qCache[sel]) {
        const child = createMockElement('div', sel);
        this._qCache[sel] = child;
      }
      return this._qCache[sel];
    },
    querySelectorAll() {
      return [];
    }
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return this._innerHTML; },
    set(v) {
      this._innerHTML = String(v);
      this._qCache = {};
    }
  });
  return el;
}

const mockElements = {
  'desktop': createMockElement('main', 'desktop'),
  'desktop-icons': createMockElement('div', 'desktop-icons'),
  'crt-overlay': createMockElement('div', 'crt-overlay'),
  'windows-container': createMockElement('div', 'windows-container')
};

const mockDocument = {
  body: createMockElement('body'),
  documentElement: createMockElement('html'),
  fullscreenElement: null,
  createElement: (t) => createMockElement(t),
  getElementById: (id) => {
    if (!mockElements[id]) mockElements[id] = createMockElement('div', id);
    return mockElements[id];
  },
  querySelector: (sel) => {
    if (sel === '#crt-overlay') return mockElements['crt-overlay'];
    if (sel === '#desktop') return mockElements['desktop'];
    return createMockElement('div', sel);
  },
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  exitFullscreen: () => Promise.resolve()
};

const mockWinManager = {
  windows: new Map(),
  createWindow(opts) {
    const el = createMockElement('div', opts.id);
    if (typeof opts.content === 'string') {
      el.innerHTML = opts.content;
    } else if (opts.content) {
      el.appendChild(opts.content);
    }
    const winObj = { id: opts.id, opts, element: el, isMinimized: false };
    this.windows.set(opts.id, winObj);
    return winObj;
  },
  closeWindow(id) {
    const win = this.windows.get(id);
    if (win && win.opts && typeof win.opts.onClose === 'function') {
      win.opts.onClose();
    }
    this.windows.delete(id);
  },
  restoreWindow() {},
  bringToTop() {},
  setTitle(id, title) {
    const win = this.windows.get(id);
    if (win) win.opts.title = title;
  },
  focusWindow() {},
  openDialog(opts) {
    this.lastDialog = opts;
  }
};

const mockCtx = {
  window: null,
  document: mockDocument,
  localStorage: mockLocalStorage,
  console,
  performance: { now: () => Date.now() },
  btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
  atob: (b64) => Buffer.from(b64, 'base64').toString('binary'),
  requestAnimationFrame: () => 1,
  cancelAnimationFrame: () => {},
  setTimeout: (fn) => { fn(); return 1; },
  clearTimeout: () => {},
  setInterval: () => 1,
  clearInterval: () => {},
  Audio: function() {
    return { loop: false, play: () => Promise.resolve(), pause() {}, load() {} };
  },
  AudioContext: function() {
    return {
      currentTime: 0,
      sampleRate: 44100,
      state: 'running',
      resume: () => Promise.resolve(),
      close: () => Promise.resolve(),
      createOscillator: () => ({
        type: 'sine',
        frequency: { value: 440, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
        start() {},
        stop() {}
      }),
      createGain: () => ({
        gain: { value: 0.1, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
        connect() {}
      }),
      destination: {}
    };
  },
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Float32Array,
  ArrayBuffer,
  DataView,
  Math,
  Date,
  Number,
  String,
  Boolean,
  Object,
  Array,
  RegExp,
  Map,
  Set,
  Promise,
  JSON,
  parseInt,
  parseFloat,
  isNaN,
  isFinite
};
mockCtx.window = mockCtx;
mockCtx.window.winManager = mockWinManager;
mockCtx.winManager = mockWinManager;

vm.createContext(mockCtx);

function loadScript(relPath, suffix = '') {
  const full = path.join(__dirname, '..', relPath);
  const code = fs.readFileSync(full, 'utf8') + suffix;
  vm.runInContext(code, mockCtx, { filename: relPath });
}

loadScript('js/i18n.js', '; window.i18n = new I18nManager();');
loadScript('js/icons.js', '; window.Icons = Icons;');
loadScript('js/filesystem.js');
loadScript('js/bios.js');
loadScript('js/apps/cdplayer.js');
loadScript('js/apps/sysmon.js');
loadScript('js/apps/hypertrm.js');
loadScript('js/apps/clipbrd.js');

assert.ok(mockCtx.window.Icons.cdplayer, 'cdplayer icon should be registered');
assert.ok(mockCtx.window.Icons.sysmon, 'sysmon icon should be registered');
assert.ok(mockCtx.window.Icons.hypertrm, 'hypertrm icon should be registered');
assert.ok(mockCtx.window.Icons['file-ht'], 'file-ht icon should be registered');
assert.ok(mockCtx.window.Icons.clipbrd, 'clipbrd icon should be registered');
assert.ok(mockCtx.window.Icons['file-clp'], 'file-clp icon should be registered');
console.log('PASS 1. Stage 2 SVG icons registered');

const vfs = mockCtx.window.vfs;
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'WINDOWS', 'CDPLAYER.EXE']), 'C:\\WINDOWS\\CDPLAYER.EXE should exist');
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'WINDOWS', 'SYSMON.EXE']), 'C:\\WINDOWS\\SYSMON.EXE should exist');
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'WINDOWS', 'HYPERTRM.EXE']), 'C:\\WINDOWS\\HYPERTRM.EXE should exist');
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'WINDOWS', 'CLIPBRD.EXE']), 'C:\\WINDOWS\\CLIPBRD.EXE should exist');
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'NightOwl_BBS.ht']), 'NightOwl_BBS.ht should exist in My Documents');
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'DemosGate_Fido.ht']), 'DemosGate_Fido.ht should exist in My Documents');
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'SECRET_CLIP.CLP']), 'SECRET_CLIP.CLP should exist in My Documents');
console.log('PASS 2. Stage 2 VFS executables and sample .ht / .clp files present');

const cdp = mockCtx.window.appCDPlayer;
assert.ok(cdp, 'window.appCDPlayer should exist');
cdp.open();
assert.ok(mockWinManager.windows.has('win-cdplayer'), 'CD Player window should open');
cdp.play();
assert.equal(cdp.state, 'playing', 'CD Player should enter playing state');
cdp.setTimeMode('track_rem');
assert.equal(cdp.timeMode, 'track_rem', 'CD Player should switch time display mode');
cdp.nextTrack();
assert.equal(cdp.currentQueuePos, 1, 'CD Player should advance to next track');
cdp.stop();
assert.equal(cdp.state, 'stopped', 'CD Player should stop cleanly');
console.log('PASS 3. CD Player (cdplayer.exe) playback, time modes, and playlist verified');

const sm = mockCtx.window.appSysMon;
assert.ok(sm, 'window.appSysMon should exist');
sm.open();
assert.ok(mockWinManager.windows.has('win-sysmon'), 'System Monitor window should open');
sm.addSensor('kernel_threads');
assert.ok(sm.activeSensorIds.includes('kernel_threads'), 'System Monitor should add kernel_threads sensor');
sm.setChartMode('bar');
assert.equal(sm.chartMode, 'bar', 'System Monitor should switch to bar chart mode');
const cpuVal = sm.computeLiveMetric('kernel_cpu');
assert.ok(cpuVal >= 2 && cpuVal <= 100, 'System Monitor should compute live CPU metric');
console.log('PASS 4. System Monitor (sysmon.exe) live metrics and chart modes verified');

const ht = mockCtx.window.appHyperTerminal;
assert.ok(ht, 'window.appHyperTerminal should exist');
ht.open('demosgate');
assert.ok(mockWinManager.windows.has('win-hypertrm'), 'HyperTerminal window should open');
assert.equal(ht.activeStationId, 'demosgate', 'HyperTerminal should connect to Demos Gate BBS');
assert.equal(ht.connected, true, 'HyperTerminal should be connected after dialing');
ht.processTerminalCommand('2');
assert.equal(ht.screenState, 'files', 'HyperTerminal should navigate to BBS file area');
ht.writeDownloadedFileToVfs(ht.stations.demosgate.files[0]);
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'Downloads', 'DEMO98.BAS']), 'ZMODEM download should save DEMO98.BAS to C:\\My Documents\\Downloads');
console.log('PASS 5. HyperTerminal (hypertrm.exe) BBS navigation & ZMODEM download verified');

const clp = mockCtx.window.appClipboardViewer;
assert.ok(clp, 'window.appClipboardViewer should exist');
clp.open();
assert.ok(mockWinManager.windows.has('win-clipbrd'), 'Clipboard Viewer window should open');
clp.setText('Тестовая строка Win 98', 'Блокнот');
assert.equal(clp.state.format, 'CF_TEXT', 'Clipboard Viewer should store CF_TEXT');
const snapCanvas = clp.captureScreenSnapshot(false);
assert.equal(clp.state.format, 'CF_DIB', 'Print Screen should store CF_DIB bitmap in clipboard');
assert.ok(snapCanvas && snapCanvas.width === 480, 'Snapshot canvas should be created');
clp.saveCurrentToClp();
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'BUFFER98.CLP']), 'Clipboard Viewer should save BUFFER98.CLP to My Documents');
console.log('PASS 6. Clipboard Viewer (clipbrd.exe) formats, Print Screen, and .CLP saving verified');

console.log('\n========================================');
console.log('ALL STAGE 2 TESTS PASSED!');
console.log('========================================\n');
