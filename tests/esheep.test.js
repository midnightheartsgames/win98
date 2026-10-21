const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing eSheep 98 (Sheep.exe) & SoftStore 98 Freeware Download ---');

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
    className: '',
    dataset: {},
    style: {
      setProperty(k, v) { this[k] = v; }
    },
    disabled: false,
    checked: false,
    value: '',
    textContent: '',
    _innerHTML: '',
    clientWidth: 1024,
    clientHeight: 740,
    offsetWidth: 1024,
    offsetHeight: 740,
    children: [],
    listeners: {},
    classList: {
      _set: new Set(),
      add(...cls) { cls.forEach(c => this._set.add(c)); },
      remove(...cls) { cls.forEach(c => this._set.delete(c)); },
      toggle(c, force) {
        if (force === undefined) {
          if (this._set.has(c)) this._set.delete(c);
          else this._set.add(c);
        } else if (force) {
          this._set.add(c);
        } else {
          this._set.delete(c);
        }
      },
      contains(c) { return this._set.has(c); }
    },
    appendChild(c) {
      if (c && typeof c === 'object') {
        this.children.push(c);
        c.parentNode = this;
        if (c.id) mockElements[c.id] = c;
      }
      return c;
    },
    removeChild(c) {
      const idx = this.children.indexOf(c);
      if (idx >= 0) this.children.splice(idx, 1);
      if (c && c.id && mockElements[c.id] === c) delete mockElements[c.id];
      return c;
    },
    insertBefore(c, ref) {
      if (c && typeof c === 'object') {
        const idx = this.children.indexOf(ref);
        if (idx >= 0) this.children.splice(idx, 0, c);
        else this.children.push(c);
        c.parentNode = this;
        if (c.id) mockElements[c.id] = c;
      }
      return c;
    },
    remove() {
      if (this.parentNode && Array.isArray(this.parentNode.children)) {
        const idx = this.parentNode.children.indexOf(this);
        if (idx >= 0) this.parentNode.children.splice(idx, 1);
      }
      if (this.id && mockElements[this.id] === this) {
        delete mockElements[this.id];
      }
    },
    addEventListener(evt, fn) {
      if (!this.listeners[evt]) this.listeners[evt] = [];
      this.listeners[evt].push(fn);
    },
    removeEventListener(evt, fn) {
      if (!this.listeners[evt]) return;
      this.listeners[evt] = this.listeners[evt].filter(f => f !== fn);
    },
    dispatchEvent(evt) {
      const list = this.listeners[evt.type] || [];
      list.forEach(fn => fn(evt));
    },
    getBoundingClientRect() {
      return { left: 100, top: 100, right: 500, bottom: 400, width: 400, height: 300 };
    },
    getContext: () => ({
      clearRect() {},
      fillRect() {},
      strokeRect() {},
      beginPath() {},
      closePath() {},
      arc() {},
      ellipse() {},
      fill() {},
      moveTo() {},
      lineTo() {},
      bezierCurveTo() {},
      quadraticCurveTo() {},
      stroke() {},
      fillText() {},
      strokeText() {},
      drawImage() {},
      save() {},
      restore() {},
      translate() {},
      scale() {},
      rotate() {},
      createLinearGradient: () => ({ addColorStop() {} }),
      createRadialGradient: () => ({ addColorStop() {} })
    }),
    toDataURL: () => 'data:image/bmp;base64,mock',
    querySelector(sel) {
      if (sel.startsWith('#')) {
        const targetId = sel.slice(1);
        const found = findById(this, targetId);
        if (found) return found;
      }
      return createMockElement('div');
    },
    querySelectorAll() {
      return [];
    }
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return this._innerHTML; },
    set(val) {
      this._innerHTML = String(val);
      const idRegex = /id=["']([^"']+)["']/g;
      let match;
      while ((match = idRegex.exec(this._innerHTML)) !== null) {
        const subId = match[1];
        if (!mockElements[subId]) {
          const child = createMockElement('div', subId);
          this.appendChild(child);
        }
      }
    }
  });
  return el;
}

function findById(root, id) {
  if (root.id === id) return root;
  for (const c of root.children || []) {
    const f = findById(c, id);
    if (f) return f;
  }
  return null;
}

const mockElements = {};
const desktopEl = createMockElement('main', 'desktop');
const desktopIconsEl = createMockElement('div', 'desktop-icons');
const selectionBoxEl = createMockElement('div', 'selection-box');
const contextMenuEl = createMockElement('div', 'context-menu');
const taskbarTrayEl = createMockElement('div', 'taskbar-tray');
const trayClockEl = createMockElement('div', 'tray-clock');
taskbarTrayEl.appendChild(trayClockEl);
desktopEl.appendChild(desktopIconsEl);
desktopEl.appendChild(selectionBoxEl);

mockElements['desktop'] = desktopEl;
mockElements['desktop-icons'] = desktopIconsEl;
mockElements['selection-box'] = selectionBoxEl;
mockElements['context-menu'] = contextMenuEl;
mockElements['taskbar-tray'] = taskbarTrayEl;
mockElements['tray-clock'] = trayClockEl;

const mockDocument = {
  body: desktopEl,
  createElement: (t) => createMockElement(t),
  getElementById: (id) => mockElements[id] || null,
  querySelector: (sel) => {
    if (sel === '#taskbar-tray' || sel === '.taskbar-tray') return taskbarTrayEl;
    if (sel === '#tray-clock' || sel === '.tray-clock') return trayClockEl;
    if (sel.startsWith('#')) return mockElements[sel.slice(1)] || null;
    return null;
  },
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {}
};

const mockWinManager = {
  windows: new Map(),
  activeWindowId: null,
  lastDialog: null,
  createWindow(opts) {
    const el = createMockElement('div', opts.id);
    if (typeof opts.content === 'string') {
      el.innerHTML = opts.content;
    } else if (opts.content && typeof opts.content === 'object') {
      el.appendChild(opts.content);
    }
    const win = {
      id: opts.id,
      opts,
      element: el,
      title: opts.title,
      minimized: false
    };
    this.windows.set(opts.id, win);
    this.activeWindowId = opts.id;
    return win;
  },
  closeWindow(id) {
    const win = this.windows.get(id);
    if (win && win.opts && typeof win.opts.onClose === 'function') {
      win.opts.onClose();
    }
    this.windows.delete(id);
  },
  bringToTop(id) {
    this.activeWindowId = id;
  },
  focusWindow(id) {
    this.activeWindowId = id;
  },
  hasWindow(id) {
    return this.windows.has(id);
  },
  getWindowTitle(id) {
    const w = this.windows.get(id);
    return w ? w.title : '';
  },
  openDialog(opts) {
    this.lastDialog = opts;
  }
};

class MockImage {
  constructor() {
    this.complete = true;
    this.naturalWidth = 640;
    this.naturalHeight = 440;
  }
  set src(val) {
    this._src = val;
    if (typeof this.onload === 'function') this.onload();
  }
  get src() {
    return this._src;
  }
}

let pendingIntervals = [];
const mockCtx = {
  window: {},
  document: mockDocument,
  localStorage: mockLocalStorage,
  Image: MockImage,
  performance: { now: () => Date.now() },
  requestAnimationFrame: () => 1,
  cancelAnimationFrame: () => {},
  AudioContext: undefined,
  webkitAudioContext: undefined,
  console,
  innerWidth: 1024,
  innerHeight: 768,
  setTimeout: (fn, ms = 0) => {
    if ((Number(ms) || 0) <= 1200) fn();
    return 1;
  },
  clearTimeout: () => {},
  setInterval: (fn) => {
    pendingIntervals.push(fn);
    return pendingIntervals.length;
  },
  clearInterval: () => {},
  addEventListener: () => {},
  removeEventListener: () => {}
};
mockCtx.window = mockCtx;
mockCtx.window.document = mockDocument;
mockCtx.window.localStorage = mockLocalStorage;
mockCtx.window.winManager = mockWinManager;
mockCtx.window.Image = MockImage;

vm.createContext(mockCtx);

const i18nCode = fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8');
const iconsCode = fs.readFileSync(path.join(__dirname, '../js/icons.js'), 'utf8');
const fsCode = fs.readFileSync(path.join(__dirname, '../js/filesystem.js'), 'utf8');
const gmCode = fs.readFileSync(path.join(__dirname, '../js/game-manager.js'), 'utf8');
const desktopCode = fs.readFileSync(path.join(__dirname, '../js/desktop.js'), 'utf8');
const ieCode = fs.readFileSync(path.join(__dirname, '../js/apps/ie.js'), 'utf8');
const esheepCode = fs.readFileSync(path.join(__dirname, '../js/apps/esheep.js'), 'utf8');

vm.runInContext(i18nCode + '; window.i18n = new I18nManager();', mockCtx);
vm.runInContext(iconsCode + '; window.Icons = Icons;', mockCtx);
vm.runInContext(fsCode, mockCtx);
vm.runInContext(gmCode, mockCtx);
vm.runInContext(desktopCode, mockCtx);
vm.runInContext(ieCode, mockCtx);
vm.runInContext(esheepCode, mockCtx);

const vfs = mockCtx.window.vfs;
const gm = mockCtx.window.gameManager;
const desktop = mockCtx.window.desktop;
const appIE = mockCtx.window.appIE;
const appESheep = mockCtx.window.appESheep;
const Icons = mockCtx.window.Icons;

const spritePath = path.join(__dirname, '../content/esheep/sprites.png');
assert.ok(fs.existsSync(spritePath), 'content/esheep/sprites.png must exist');
const spriteStat = fs.statSync(spritePath);
assert.ok(spriteStat.size > 10000, 'sprites.png should be a valid non-empty sprite sheet');
console.log('PASS 1. Sprite sheet content/esheep/sprites.png exists and is valid');

assert.ok(typeof Icons['esheep'] === 'string' && Icons['esheep'].includes('<svg'), 'Icons["esheep"] SVG icon must exist');
assert.ok(Icons['esheep'].includes('px-dual'), 'Icons["esheep"] must include dual 32x32 and 16x16 layers');
assert.ok(mockCtx.window.getIcon('esheep', 32).includes('<svg'), 'window.getIcon("esheep", 32) must work');
console.log('PASS 2. Icons["esheep"] returns valid 32x32 and 16x16 dual SVG icon');

assert.strictEqual(gm.isInstalled('esheep'), false, 'eSheep must not be installed initially');
assert.strictEqual(gm.isDownloaded('esheep'), false, 'eSheep must not be downloaded initially');
const initialDesktopIcons = desktop.computeCurrentIcons().map(i => i.id);
assert.ok(!initialDesktopIcons.includes('esheep'), 'Desktop must not show esheep icon before installation');
const esheepCatalog = gm.catalog['esheep'];
assert.ok(esheepCatalog, 'GameManager catalog must include esheep');
assert.strictEqual(esheepCatalog.isApp, true);
assert.strictEqual(esheepCatalog.price, 0);
assert.strictEqual(esheepCatalog.priceDisplay, 'FREEWARE');
assert.strictEqual(esheepCatalog.setupExe, 'Setup_eSheep.exe');
assert.strictEqual(esheepCatalog.targetExe, 'SHEEP.EXE');
assert.strictEqual(esheepCatalog.folder, 'eSheep');
console.log('PASS 3. GameManager catalog has esheep configured as uninstalled FREEWARE app');

const softStoreHtml = appIE.renderSoftStore();
assert.ok(softStoreHtml.includes('eSheep 98'), 'SoftStore 98 must list eSheep 98');
assert.ok(softStoreHtml.includes('Бесплатно'), 'SoftStore 98 must show eSheep 98 as Бесплатно');
assert.ok(softStoreHtml.includes('data-soft-download="esheep"'), 'SoftStore 98 must provide direct download button without credit card payment');

const detailHtml = appIE.renderSoftStore('http://www.softstore98.com/product?id=esheep');
assert.ok(detailHtml.includes('Fuji Television / Tatsutoshi Nomura'), 'SoftStore 98 product detail page must show eSheep 98 developer');
assert.ok(detailHtml.includes('340 KB'), 'SoftStore 98 product detail page must show eSheep 98 specs');
assert.ok(detailHtml.includes('data-soft-download="esheep"'), 'Detail page must allow direct free download');
console.log('PASS 4. http://www.softstore98.com lists eSheep 98 for free with direct download');

pendingIntervals = [];
gm.startDownload('esheep');
for (const fn of pendingIntervals) {
  for (let i = 0; i < 12; i++) fn();
}
assert.strictEqual(gm.isDownloaded('esheep'), true, 'esheep must be marked downloaded');
assert.strictEqual(gm.isPurchased('esheep'), true, 'esheep must be marked purchased');
const dlFile = vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'Downloads', 'Setup_eSheep.exe']);
assert.ok(dlFile, 'Setup_eSheep.exe must be saved in C:\\My Documents\\Downloads');
assert.strictEqual(dlFile.gameId, 'esheep');

gm.finishInstallation('esheep');
assert.strictEqual(gm.isInstalled('esheep'), true, 'esheep must be marked installed after finishInstallation');
const sheepExe = vfs.resolvePath(['My Computer', 'C:', 'Program Files', 'eSheep', 'SHEEP.EXE']);
const sheepReadme = vfs.resolvePath(['My Computer', 'C:', 'Program Files', 'eSheep', 'README.TXT']);
assert.ok(sheepExe, 'C:\\Program Files\\eSheep\\SHEEP.EXE must exist after installation');
assert.ok(sheepReadme, 'C:\\Program Files\\eSheep\\README.TXT must exist after installation');
assert.ok(sheepReadme.content.includes('Microslop Win 98'), 'README.TXT must follow Microslop Win 98 naming');
const postInstallIcons = desktop.computeCurrentIcons().map(i => i.id);
assert.ok(postInstallIcons.includes('esheep'), 'Desktop must include esheep icon after installation');
console.log('PASS 5. Downloading Setup_eSheep.exe and installing creates SHEEP.EXE, README.TXT, and Desktop icon');

appESheep.open();
assert.strictEqual(appESheep.isRunning(), true, 'appESheep must be running after open()');
assert.strictEqual(appESheep.sheepList.length, 1, 'Launching eSheep must spawn 1 sheep initially');

const firstSheep = appESheep.sheepList[0];
assert.strictEqual(firstSheep.anim, 'fall', 'Newly spawned sheep starts falling from sky');

firstSheep.y = 700;
appESheep.updateSheep(firstSheep, 50, []);
assert.strictEqual(firstSheep.surfaceId, 'taskbar', 'Sheep lands on taskbar ground');

const behaviorStates = [
  'walk', 'rotate', 'run_begin', 'run', 'run_end', 'jump', 'boing',
  'sleep1', 'sleep2', 'sleep3', 'sleep4', 'pee', 'eat_daisy',
  'cartwheel', 'handstand_spin', 'barrel_roll', 'sneeze', 'bleat',
  'graze', 'stretch', 'cry', 'waddle', 'wag_tail', 'climb_up', 'ceiling_walk', 'climb_down'
];
for (const st of behaviorStates) {
  appESheep.setAnim(firstSheep, st);
  appESheep.updateSheep(firstSheep, 200, []);
}
appESheep.render();
console.log('PASS 6. Sheep spawns, lands on taskbar, and executes all classic animation states');

appESheep.pokeSheep(firstSheep);
assert.ok(['sync', 'kill'].includes(firstSheep.anim), 'Poking sheep triggers surprised reaction');

appESheep.spawnSheep();
assert.strictEqual(appESheep.sheepList.length, 2, 'Second sheep added to flock');

for (const sceneKind of ['meteor_bath', 'black_sheep', 'ufo_alien']) {
  appESheep.startSpecialScene(firstSheep, sceneKind);
  assert.strictEqual(firstSheep.anim, sceneKind, `Special scene ${sceneKind} started`);
  appESheep.updateSpecialScene(firstSheep, 100);
  appESheep.render();
}
console.log('PASS 7. Multi-sheep flock, poke reactions, and special scenes (meteor_bath, black_sheep, ufo_alien) work');

mockWinManager.closeWindow('app_esheep_props');
assert.strictEqual(mockWinManager.hasWindow('app_esheep_props'), false);
const trayIconEl = mockDocument.getElementById('tray-esheep-icon');
assert.ok(trayIconEl, 'Tray icon #tray-esheep-icon must exist while eSheep is running');
trayIconEl.dispatchEvent({ type: 'contextmenu', preventDefault() {}, stopPropagation() {} });
assert.ok(mockWinManager.hasWindow('app_esheep_props'), 'Right-clicking (ПКМ) #tray-esheep-icon must open eSheep Properties window');
const propsWin = mockWinManager.windows.get('app_esheep_props');
assert.strictEqual(propsWin.opts.width, 438, 'Settings window width must be 438px');
assert.strictEqual(propsWin.opts.height, 424, 'Settings window height must be 424px so footer buttons are not clipped');

appESheep.openContextMenu(200, 200, firstSheep);
assert.strictEqual(contextMenuEl.style.display, 'block', 'Sheep right-click context menu must be displayed via window.contextMenu');

appESheep.openAbout();
assert.ok(mockWinManager.hasWindow('app_esheep_about'), 'About eSheep 98 dialog window opens');

const procs = appESheep.processList();
assert.strictEqual(procs.length, 1);
assert.strictEqual(procs[0].imageName, 'sheep.exe');
assert.strictEqual(procs[0].isESheep, true);

gm.uninstallGame('esheep');
assert.strictEqual(appESheep.isRunning(), false, 'Uninstalling eSheep stops active sheep');
assert.strictEqual(appESheep.sheepList.length, 0, 'Flock is cleared on stop');
console.log('PASS 8. Tray RMB settings open, context menu, About dialog, Task Manager process reporting, and clean uninstall verified');

const clippyCode = fs.readFileSync(path.join(__dirname, '../js/apps/clippy.js'), 'utf8');
const clippyTalkCode = fs.readFileSync(path.join(__dirname, '../js/apps/clippy-talk.js'), 'utf8');
const clippyHelpCode = fs.readFileSync(path.join(__dirname, '../js/apps/clippy-help.js'), 'utf8');
const clippyTipsCode = fs.readFileSync(path.join(__dirname, '../js/apps/clippy-tips.js'), 'utf8');
const clippySystemCode = fs.readFileSync(path.join(__dirname, '../js/apps/clippy-system.js'), 'utf8');

vm.runInContext(clippyCode, mockCtx);
vm.runInContext(clippyTalkCode, mockCtx);
vm.runInContext(clippyHelpCode, mockCtx);
vm.runInContext(clippyTipsCode, mockCtx);
vm.runInContext(clippySystemCode, mockCtx);

const appClippy = mockCtx.window.appClippy;
const clippySystem = mockCtx.window.clippySystem;
const clippyHelp = mockCtx.window.clippyHelp;
const clippyTalk = mockCtx.window.clippyTalk;
const clippyTips = mockCtx.window.clippyTips;

let lastSpoken = null;
appClippy.visible = true;
appClippy.annoyance = 'normal';
appClippy.charEl = createMockElement('div', 'clippy-char');
appClippy.charEl.getBoundingClientRect = () => ({ left: 860, top: 640, right: 940, bottom: 720, width: 80, height: 80 });
appClippy.balloonOpen = () => false;
appClippy.speak = (text, actions = [], mood = '') => {
  lastSpoken = { text, actions, mood };
};

clippySystem.watchGames();
gm.finishInstallation('esheep');
assert.ok(lastSpoken && lastSpoken.text.includes('eSheep 98'), 'Clippy congratulates user when eSheep 98 is installed');

appESheep.start(1);
const s1 = appESheep.sheepList[0];
s1.x = 870;
s1.y = 660;
s1.anim = 'walk';
lastSpoken = null;
clippySystem.esheepSeen = false;
clippySystem.checkESheep();
assert.ok(lastSpoken && lastSpoken.text.includes('Sheep.exe'), 'Clippy greets sheep when it walks close to him');
assert.strictEqual(lastSpoken.actions.length, 3, 'Proximity greeting includes 3 interactive actions');

lastSpoken = null;
s1.anim = 'sleep1';
clippySystem.esheepNap = false;
clippySystem.checkESheep();
assert.ok(lastSpoken && lastSpoken.text.includes('Zzz'), 'Clippy whispers when sheep falls asleep beside him');

lastSpoken = null;
s1.anim = 'ceiling_walk';
clippySystem.esheepCeiling = false;
clippySystem.checkESheep();
assert.ok(lastSpoken && lastSpoken.text.includes('вниз головой'), 'Clippy reacts when sheep walks upside down on the ceiling');

lastSpoken = null;
s1.x = 875;
s1.y = 655;
const dropped = appESheep.checkDroppedOnClippy(s1);
assert.strictEqual(dropped, true, 'Dropping sheep onto Clippy is detected');
assert.ok(lastSpoken && lastSpoken.actions.length === 3, 'Clippy reacts with interactive choices when sheep is dropped onto him');

clippySystem.esheepEventTimes = {};
lastSpoken = null;
appESheep.startSpecialScene(s1, 'meteor_bath');
assert.ok(lastSpoken && lastSpoken.text.includes('метеорит'), 'Clippy reacts to meteor_bath scene');

clippySystem.esheepEventTimes = {};
lastSpoken = null;
appESheep.startSpecialScene(s1, 'ufo_alien');
assert.ok(lastSpoken && lastSpoken.text.includes('xfiles98.ru'), 'Clippy reacts to ufo_alien scene and mentions xfiles98.ru');

clippySystem.esheepEventTimes = {};
lastSpoken = null;
appESheep.startSpecialScene(s1, 'black_sheep');
assert.ok(lastSpoken && lastSpoken.text.includes('чёрная овечка'), 'Clippy reacts to black_sheep scene');

clippySystem.esheepEventTimes = {};
lastSpoken = null;
appESheep.setAnim(s1, 'pee');
assert.ok(lastSpoken && lastSpoken.text.includes('CLIPPIT.ACS'), 'Clippy reacts to pee animation');

clippySystem.esheepEventTimes = {};
clippySystem.esheepCrowdSeen = false;
lastSpoken = null;
appESheep.setFlockSize(5);
assert.ok(lastSpoken && lastSpoken.text.includes('отара'), 'Clippy reacts when flock reaches 5+ sheep');

lastSpoken = null;
appClippy.onWindowOpened('app_esheep_props', 'Свойства: eSheep 98');
assert.ok(lastSpoken && lastSpoken.text.includes('Свойства: eSheep 98'), 'Clippy reacts when eSheep Properties window opens');

lastSpoken = null;
appClippy.onNavigateIE('http://www.softstore98.com/product?id=esheep', 'softstore', 'SoftStore 98');
assert.ok(lastSpoken && lastSpoken.text.includes('eSheep 98'), 'Clippy reacts to eSheep product page on SoftStore 98');

const helpHits = clippyHelp.search('как выпустить овечку на рабочий стол');
assert.ok(helpHits.length > 0 && helpHits[0].entry.id === 'esheep', 'F1 Help finds esheep entry');

const icqMsg = clippySystem.icqReply('Что за овечка бегает по экрану?');
assert.ok(icqMsg.includes('Овечка По'), 'Clippy replies about eSheep in ICQ');

const talkTree = clippyTalk.nodes;
assert.ok(talkTree.esheepColleague, 'ClippyTalk includes esheepColleague node');
assert.ok(talkTree.petsSheep, 'ClippyTalk includes petsSheep node');
assert.ok(clippyTips.catalog['softstore-esheep'], 'ClippyTips catalog includes softstore-esheep');
console.log('PASS 9. Clippy ↔ eSheep 98 interactions (proximity, nap, ceiling, drop, scenes, windows, SoftStore, F1 Help, ICQ, Talk) verified');

console.log('=== ALL ESHEEP 98 TESTS PASSED ===');
