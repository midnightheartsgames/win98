const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Stage 1 Programs (QBasic 1.1, Nokia Monitor Tester, CDex 0.14, Wintune 97) ---');

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
    return { play: () => Promise.resolve(), pause() {}, load() {} };
  },
  AudioContext: function() {
    return {
      currentTime: 0,
      sampleRate: 44100,
      state: 'running',
      resume: () => Promise.resolve(),
      close: () => Promise.resolve(),
      createOscillator: () => ({
        type: 'square',
        frequency: { value: 440, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
        start() {},
        stop() {}
      }),
      createGain: () => ({
        gain: { value: 0.1, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
        connect() {}
      }),
      createBuffer: (ch, len) => ({
        getChannelData: () => new Float32Array(len)
      }),
      createBufferSource: () => ({
        buffer: null,
        connect() {},
        start() {},
        stop() {}
      }),
      createBiquadFilter: () => ({
        type: 'bandpass',
        frequency: { value: 1000 },
        Q: { value: 1 },
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
loadScript('js/apps/qbasic.js');
loadScript('js/apps/mon-test.js');
loadScript('js/apps/cdex.js');
loadScript('js/apps/wintune.js');

assert.ok(mockCtx.window.Icons.qbasic, 'qbasic icon should be registered');
assert.ok(mockCtx.window.Icons['file-bas'], 'file-bas icon should be registered');
assert.ok(mockCtx.window.Icons['mon-test'], 'mon-test icon should be registered');
assert.ok(mockCtx.window.Icons.cdex, 'cdex icon should be registered');
assert.ok(mockCtx.window.Icons.wintune, 'wintune icon should be registered');
console.log('PASS 1. Stage 1 SVG icons registered');

const vfs = mockCtx.window.vfs;
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'Windows', 'QBASIC.EXE']), 'C:\\WINDOWS\\QBASIC.EXE should exist');
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'HOMEWORK.BAS']), 'HOMEWORK.BAS should exist in My Documents');
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'STARFIELD.BAS']), 'STARFIELD.BAS should exist in My Documents');
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'MANDEL.BAS']), 'MANDEL.BAS should exist in My Documents');

assert.ok(vfs.resolvePath(['My Computer', 'D:', 'soft_u', 'wintn975_616.exe']), 'D:\\soft_u\\wintn975_616.exe should exist on CD');
assert.ok(vfs.resolvePath(['My Computer', 'D:', 'soft_u', 'clibench.exe']), 'D:\\soft_u\\clibench.exe should exist on CD');
assert.ok(vfs.resolvePath(['My Computer', 'D:', 'soft_u', 'mon_test.exe']), 'D:\\soft_u\\mon_test.exe should exist on CD');
assert.ok(vfs.resolvePath(['My Computer', 'D:', 'winamp', 'cdex014.exe']), 'D:\\winamp\\cdex014.exe should exist on CD');
console.log('PASS 2. VFS executables and sample .BAS files present');

const qb = mockCtx.window.appQBasic;
assert.ok(qb, 'window.appQBasic should exist');
qb.open('HOMEWORK.BAS');
assert.ok(mockWinManager.windows.has('app_qbasic'), 'QBasic window should open');
assert.equal(qb.currentFileName, 'HOMEWORK.BAS', 'QBasic should track HOMEWORK.BAS filename');

const extracted = qb.extractBasicFromText('Notes:\n10 CLS\n20 PRINT "HELLO"\n30 END\nFooter');
assert.equal(extracted, '10 CLS\n20 PRINT "HELLO"\n30 END', 'QBasic should extract numbered BASIC lines from homework.txt');
console.log('PASS 3. Microslop QBasic 1.1 opens and extracts BASIC listings');

const mon = mockCtx.window.appMonTest;
assert.ok(mon, 'window.appMonTest should exist');
mon.open();
assert.ok(mockWinManager.windows.has('win-mon-test'), 'Nokia Monitor Tester window should open');
mon.openPattern('convergence');
assert.equal(mon.activePattern.id, 'convergence', 'Monitor Tester should switch to convergence pattern');
const prevDegauss = mon.osd.degaussCount;
mon.triggerDegauss();
assert.equal(mon.osd.degaussCount, prevDegauss + 1, 'Monitor Tester Degauss should increment degaussCount');
mon.closePattern();
assert.equal(mon.activePattern, null, 'Monitor Tester should return to menu on closePattern');
console.log('PASS 4. Nokia Monitor Tester patterns, OSD calibration, and Degauss verified');

const cdex = mockCtx.window.appCDex;
assert.ok(cdex, 'window.appCDex should exist');
cdex.open();
assert.ok(mockWinManager.windows.has('win-cdex'), 'CDex window should open');
const activeDisc = cdex.getActiveDisc();
assert.ok(activeDisc && activeDisc.data.tracks.length === 5, 'CDex should detect 5 tracks on Igromania Mixed-Mode CD');

const wavUri = cdex.synthesizeTrackWav(activeDisc.data.tracks[1]);
assert.ok(wavUri.startsWith('data:audio/wav;base64,'), 'CDex should synthesize a valid 8000 Hz 8-bit PCM WAV data URI');
const musicPath = cdex.ensureMusicFolder();
const musicNode = vfs.resolvePath(musicPath);
assert.ok(musicNode && musicNode.children, 'CDex should ensure C:\\My Documents\\Моя музыка exists');
console.log('PASS 5. CDex 0.14 Audio CD Ripper & WAV generation verified');

const wt = mockCtx.window.appWintune;
assert.ok(wt, 'window.appWintune should exist');
wt.open('wintune');
assert.ok(mockWinManager.windows.has('win-wintune'), 'Wintune 97 window should open');

mockCtx.window.biosEngine.settings.chipset.cpuHostClock = '100 MHz';
mockCtx.window.biosEngine.settings.chipset.cpuMultiplier = '4.5x';
mockCtx.window.biosEngine.settings.chipset.sdramCasLatency = '3';
const stockHw = wt.readHardwareTelemetry();
assert.equal(stockHw.mhz, 450, 'Stock CPU clock should be 450 MHz');

mockCtx.window.biosEngine.settings.chipset.cpuHostClock = '112 MHz';
mockCtx.window.biosEngine.settings.chipset.cpuMultiplier = '5.0x';
mockCtx.window.biosEngine.settings.chipset.sdramCasLatency = '2';
const ocHw = wt.readHardwareTelemetry();
assert.equal(ocHw.mhz, 560, 'Overclocked CPU clock should be 560 MHz');
assert.ok(ocHw.scores.cpuInt > stockHw.scores.cpuInt, 'Overclocked CPU Dhrystone should exceed stock score');
assert.ok(ocHw.scores.cpuFpu > stockHw.scores.cpuFpu, 'Overclocked FPU Whetstone should exceed stock score');

wt.open('clibench');
assert.equal(wt.variant, 'clibench', 'AppWintune should switch to CliBench MK II mode');
console.log('PASS 6. Wintune 97 & CliBench MK II BIOS-reactive benchmarks verified');

console.log('\n========================================');
console.log('ALL STAGE 1 TESTS PASSED!');
console.log('========================================\n');
