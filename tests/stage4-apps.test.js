const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Stage 4 Programs (mIRC 98, FastTracker 98, Acrobat Reader 3.01, ACDSee 32 v2.23) ---');

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
    readOnly: false,
    value: '',
    textContent: '',
    _innerHTML: '',
    scrollTop: 0,
    scrollHeight: 200,
    clientWidth: 680,
    clientHeight: 470,
    width: 380,
    height: 78,
    children: [],
    classList: {
      _set: new Set(['active']),
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
    insertAdjacentHTML() {},
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
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 680, height: 470 }),
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
    mockElements[opts.id] = el;
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
  encodeURIComponent,
  decodeURIComponent,
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
loadScript('js/apps/mirc.js');
loadScript('js/apps/fasttracker.js');
loadScript('js/apps/acrobat.js');
loadScript('js/apps/acdsee.js');

assert.ok(mockCtx.window.Icons.mirc, 'mirc icon should be registered');
assert.ok(mockCtx.window.Icons.fasttracker, 'fasttracker icon should be registered');
assert.ok(mockCtx.window.Icons['file-xm'], 'file-xm icon should be registered');
assert.ok(mockCtx.window.Icons.acrobat, 'acrobat icon should be registered');
assert.ok(mockCtx.window.Icons['file-pdf'], 'file-pdf icon should be registered');
assert.ok(mockCtx.window.Icons.acdsee, 'acdsee icon should be registered');
console.log('PASS 1. Stage 4 SVG icons registered');

const vfs = mockCtx.window.vfs;
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'WINDOWS', 'MIRC32.EXE']), 'C:\\WINDOWS\\MIRC32.EXE should exist');
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'WINDOWS', 'FT2.EXE']), 'C:\\WINDOWS\\FT2.EXE should exist');
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'WINDOWS', 'AR32E301.EXE']), 'C:\\WINDOWS\\AR32E301.EXE should exist');
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'WINDOWS', 'ACDC3223.EXE']), 'C:\\WINDOWS\\ACDC3223.EXE should exist');
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'Program Files', 'Accessories', 'MIRC32.EXE']), 'MIRC32.EXE should exist in Accessories');
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'Моя музыка', 'FUTURE_CREW.XM']), 'FUTURE_CREW.XM should exist in My Music');
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'Моя музыка', 'ENLIGHT98.XM']), 'ENLIGHT98.XM should exist in My Music');
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'VOODOO2_SPEC.PDF']), 'VOODOO2_SPEC.PDF should exist in My Documents');
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'WIN98SE_RESKIT.PDF']), 'WIN98SE_RESKIT.PDF should exist in My Documents');
assert.ok(vfs.resolvePath(['My Computer', 'D:', 'soft_int', 'mirc32.exe']), 'D:\\soft_int\\mirc32.exe should exist on Igromania CD');
assert.ok(vfs.resolvePath(['My Computer', 'D:', 'soft_u', 'ft2.exe']), 'D:\\soft_u\\ft2.exe should exist on Igromania CD');
assert.ok(vfs.resolvePath(['My Computer', 'D:', 'soft_u', 'acdc3223.exe']), 'D:\\soft_u\\acdc3223.exe should exist on Igromania CD');
assert.ok(vfs.resolvePath(['My Computer', 'D:', 'bc3k', 'ar32e301.exe']), 'D:\\bc3k\\ar32e301.exe should exist on Igromania CD');
assert.ok(vfs.resolvePath(['My Computer', 'D:', 'bc3k', 'BC3000AD_MANUAL.PDF']), 'D:\\bc3k\\BC3000AD_MANUAL.PDF should exist on Igromania CD');
console.log('PASS 2. Stage 4 VFS executables, .XM modules, and .PDF manuals present');

const mirc = mockCtx.window.appMIRC;
assert.ok(mirc, 'window.appMIRC should exist');
mirc.open();
assert.ok(mockWinManager.windows.has('win-mirc'), 'mIRC 98 window should open');
mirc.executeCommand('/join #demoscene');
assert.equal(mirc.activeTab, '#demoscene', 'mIRC should join and switch to #demoscene');
mirc.executeCommand('/nick Demoscener98');
assert.equal(mirc.nick, 'Demoscener98', 'mIRC should update nickname via /nick');
const beforeLines = mirc.tabs['#demoscene'].lines.length;
mirc.executeCommand('/slap Freeman_HL');
assert.ok(mirc.tabs['#demoscene'].lines.length > beforeLines, 'mIRC /slap should post trout action to channel');
mirc.postJoke();
assert.ok(mirc.tabs['#demoscene'].lines.some(l => l.nick === '@VernerBot'), 'mIRC !анекдот should trigger @VernerBot');
mirc.close();
assert.equal(mockWinManager.windows.has('win-mirc'), false, 'mIRC window should close cleanly');
console.log('PASS 3. mIRC 98 (mirc32.exe) channels, commands, and bots verified');

const ft2 = mockCtx.window.appFastTracker;
assert.ok(ft2, 'window.appFastTracker should exist');
ft2.open('FUTURE_CREW.XM');
assert.ok(mockWinManager.windows.has('win-fasttracker'), 'FastTracker 98 window should open');
assert.equal(ft2.currentModule, 'FUTURE_CREW.XM', 'FastTracker should load FUTURE_CREW.XM');
ft2.selectCell(4, 1);
ft2.triggerNoteInput('E-4');
assert.equal(ft2.pattern[4][1].note, 'E-4', 'FastTracker should record E-4 into pattern row 04 channel 2');
ft2.toggleChannelMute(2);
assert.equal(ft2.channelMuted[2], true, 'FastTracker should mute channel 3');
ft2.toggleChannelMute(2);
const exportedWav = ft2.exportWavToVfs();
assert.equal(exportedWav, 'FUTURE_CREW_FT2.WAV', 'FastTracker should export FUTURE_CREW_FT2.WAV');
assert.ok(vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'Моя музыка', 'FUTURE_CREW_FT2.WAV']), 'Exported WAV should be saved in C:\\My Documents\\Моя музыка');
ft2.close();
console.log('PASS 4. FastTracker 98 (ft2.exe) pattern editing, channels, and .WAV export verified');

const acro = mockCtx.window.appAcrobat;
assert.ok(acro, 'window.appAcrobat should exist');
acro.open('VOODOO2_SPEC.PDF');
assert.ok(mockWinManager.windows.has('win-acrobat'), 'Acrobat Reader 3.01 window should open');
assert.equal(acro.currentDocKey, 'VOODOO2_SPEC.PDF', 'Acrobat Reader should open VOODOO2_SPEC.PDF');
acro.nextPage();
assert.equal(acro.currentPage, 1, 'Acrobat Reader should advance to page 2');
acro.setSidebarMode('thumbs');
assert.equal(acro.sidebarMode, 'thumbs', 'Acrobat Reader should switch to thumbnails sidebar');
acro.changeZoom(15);
assert.equal(acro.zoom, 115, 'Acrobat Reader should zoom in to 115%');
const highlighted = acro.highlightSearch('<p>Ускоритель 3Dfx Voodoo2 SLI</p>');
assert.equal(highlighted, '<p>Ускоритель 3Dfx Voodoo2 SLI</p>');
acro.setSearchQuery('Voodoo2');
assert.ok(acro.highlightSearch('<p>Ускоритель 3Dfx Voodoo2 SLI</p>').includes('acrobat-highlight'), 'Acrobat Reader should highlight search terms');
acro.close();
console.log('PASS 5. Adobe Acrobat Reader 3.01 (ar32e301.exe) PDF documents, bookmarks, zoom, and search verified');

const acd = mockCtx.window.appACDSee;
assert.ok(acd, 'window.appACDSee should exist');
acd.open();
assert.ok(mockWinManager.windows.has('win-acdsee'), 'ACDSee 32 window should open');
acd.selectFolder('igromania-art');
assert.equal(acd.currentFolder, 'igromania-art', 'ACDSee should switch to D:\\ARTWORK_98 folder');
assert.ok(acd.getCurrentImages().length >= 4, 'ACDSee should list Igromania artwork images');
acd.openImageInViewer(1);
assert.equal(acd.viewMode, 'viewer', 'ACDSee should switch to full viewer mode');
assert.equal(acd.selectedIndex, 1, 'ACDSee should select image index 1');
acd.rotateImage();
assert.equal(acd.viewerRotation, 90, 'ACDSee should rotate image by 90 degrees');
acd.setAsWallpaper();
assert.ok(mockElements['desktop'].style.backgroundImage.includes('data:image/svg+xml'), 'ACDSee should apply selected image as desktop wallpaper');
acd.close();
console.log('PASS 6. ACDSee 32 v2.23 (acdc3223.exe) folders, view modes, rotation, and wallpaper verified');

const stage4Files = [
  'css/apps/mirc.css',
  'js/apps/mirc.js',
  'css/apps/fasttracker.css',
  'js/apps/fasttracker.js',
  'css/apps/acrobat.css',
  'js/apps/acrobat.js',
  'css/apps/acdsee.css',
  'js/apps/acdsee.js'
];

for (const rel of stage4Files) {
  const src = fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  assert.equal(/\/\*[\s\S]*?\*\//.test(src), false, `${rel} must not contain block comments`);
  assert.equal(/^\s*\/\//m.test(src), false, `${rel} must not contain line comments`);
  assert.equal(/\bMicrosoft\b/i.test(src), false, `${rel} must use Microslop instead of Forbidden M-word`);
}
console.log('PASS 7. Zero-comment and Microslop/Win naming policy verified across all Stage 4 files');

console.log('\n========================================');
console.log('ALL STAGE 4 TESTS PASSED!');
console.log('========================================\n');
