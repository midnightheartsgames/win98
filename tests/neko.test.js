const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Neko 98 (NEKO.EXE) Sprite Engine, Basket Window & Clippy Interactions ---');

const storage = new Map();
const mockLocalStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};

const mockElements = {};

function createMockElement(tag = 'div', id = '') {
  const el = {
    tagName: tag.toUpperCase(),
    id,
    className: '',
    title: '',
    dataset: {},
    style: {
      setProperty(k, v) { this[k] = v; },
      removeProperty(k) { delete this[k]; }
    },
    disabled: false,
    checked: false,
    value: '',
    textContent: '',
    _innerHTML: '',
    width: 32,
    height: 32,
    clientWidth: 1024,
    clientHeight: 740,
    offsetWidth: 72,
    offsetHeight: 72,
    children: [],
    listeners: {},
    attributes: {},
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
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k] || null; },
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
      if (this._rect) return this._rect;
      return { left: 820, top: 540, right: 892, bottom: 612, width: 72, height: 72 };
    },
    getContext: () => ({
      imageSmoothingEnabled: false,
      fillStyle: '#000',
      strokeStyle: '#000',
      lineWidth: 1,
      font: '11px Tahoma',
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
      measureText: (text) => ({ width: String(text).length * 5 }),
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
    querySelector(sel) {
      if (sel.startsWith('#')) {
        const targetId = sel.slice(1);
        const found = findById(this, targetId);
        if (found) return found;
      }
      return createMockElement('div');
    },
    querySelectorAll(sel) {
      if (sel === '[data-neko-coat]') {
        return ['white', 'ginger', 'calico', 'black', 'siamese', 'scribble'].map(id => {
          const btn = createMockElement('button');
          btn.dataset.nekoCoat = id;
          return btn;
        });
      }
      if (sel === '[data-neko-mode]') {
        return ['chase', 'runaway', 'wander', 'clippy'].map(id => {
          const btn = createMockElement('button');
          btn.dataset.nekoMode = id;
          return btn;
        });
      }
      if (sel === '[data-neko-toy]') {
        return ['yarn', 'paper_ball', 'fish'].map(id => {
          const btn = createMockElement('button');
          btn.dataset.nekoToy = id;
          return btn;
        });
      }
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

const desktopEl = createMockElement('main', 'desktop');
const taskbarTrayEl = createMockElement('div', 'taskbar-tray');
const trayClockEl = createMockElement('div', 'tray-clock');
const clippyCharEl = createMockElement('div', 'clippy-char');
clippyCharEl._rect = { left: 800, top: 520, right: 872, bottom: 592, width: 72, height: 72 };
taskbarTrayEl.appendChild(trayClockEl);
desktopEl.appendChild(clippyCharEl);

mockElements['desktop'] = desktopEl;
mockElements['taskbar-tray'] = taskbarTrayEl;
mockElements['tray-clock'] = trayClockEl;
mockElements['clippy-char'] = clippyCharEl;

const docListeners = {};

const mockDocument = {
  body: desktopEl,
  documentElement: createMockElement('html'),
  createElement: (t) => createMockElement(t),
  getElementById: (id) => mockElements[id] || null,
  querySelector: (sel) => {
    if (sel === '#taskbar-tray' || sel === '.taskbar-tray') return taskbarTrayEl;
    if (sel === '#tray-clock' || sel === '.tray-clock') return trayClockEl;
    if (sel.startsWith('#')) return mockElements[sel.slice(1)] || null;
    return null;
  },
  querySelectorAll: () => [],
  addEventListener(evt, fn) {
    if (!docListeners[evt]) docListeners[evt] = [];
    docListeners[evt].push(fn);
  },
  removeEventListener(evt, fn) {
    if (!docListeners[evt]) return;
    docListeners[evt] = docListeners[evt].filter(f => f !== fn);
  }
};

const mockWinManager = {
  windows: new Map(),
  activeWindowId: null,
  hasWindow(id) {
    return this.windows.has(id);
  },
  createWindow(opts) {
    const winEl = createMockElement('div', opts.id);
    winEl.innerHTML = opts.content || '';
    const winObj = {
      id: opts.id,
      title: opts.title,
      icon: opts.icon,
      element: winEl,
      isMinimized: false,
      onClose: opts.onClose
    };
    this.windows.set(opts.id, winObj);
    this.activeWindowId = opts.id;
    return winObj;
  },
  closeWindow(id) {
    const w = this.windows.get(id);
    if (w) {
      if (typeof w.onClose === 'function') w.onClose();
      this.windows.delete(id);
    }
  },
  bringToTop(id) {
    this.activeWindowId = id;
  },
  restoreWindow(id) {
    const w = this.windows.get(id);
    if (w) w.isMinimized = false;
  },
  openDialog(opts) {
    this.lastDialog = opts;
  }
};

const spokenLines = [];

const mockClippy = {
  visible: true,
  state: 'idle',
  annoyance: 'normal',
  charEl: clippyCharEl,
  pupilL: createMockElement('g'),
  pupilR: createMockElement('g'),
  browL: createMockElement('g'),
  browR: createMockElement('g'),
  lastAnim: null,
  isRunning: () => true,
  balloonOpen: () => false,
  wakeUp() { this.state = 'idle'; },
  animate(name) { this.lastAnim = name; },
  sound() {},
  setAccessory() {},
  speak(text, actions = [], mood = '📎', duration = 8000) {
    spokenLines.push({ text, actions, mood, duration });
  },
  pointEyesAt(x, y) {
    this.lastEyeTarget = { x, y };
  }
};

const sandbox = {
  window: null,
  document: mockDocument,
  localStorage: mockLocalStorage,
  innerWidth: 1024,
  innerHeight: 740,
  performance: { now: () => Date.now() },
  requestAnimationFrame: () => 1,
  cancelAnimationFrame: () => {},
  setInterval: () => 1,
  clearInterval: () => {},
  setTimeout: (fn) => { fn(); return 1; },
  clearTimeout: () => {},
  Math,
  Date,
  JSON,
  Set,
  Map,
  Array,
  Object,
  String,
  Number,
  Boolean,
  RegExp,
  parseInt,
  parseFloat,
  isNaN,
  encodeURIComponent,
  console,
  Icons: { neko: '<svg class="px-dual"></svg>', clawd: '<svg class="px-dual clawd"></svg>', folder: '<svg></svg>' },
  winManager: mockWinManager,
  contextMenu: {
    show() {},
    hide() {}
  },
  i18n: {
    currentLang: 'ru',
    getLanguage: () => 'ru',
    onChange: () => {},
    t: (k) => k
  },
  appClippy: mockClippy,
  soundSys: {
    init() {},
    muted: false,
    masterVolume: 0.8,
    ctx: null,
    playClick() {}
  }
};
sandbox.window = sandbox;

vm.createContext(sandbox);

const loadScript = (relPath) => {
  const full = path.join(__dirname, '..', relPath);
  const code = fs.readFileSync(full, 'utf8');
  vm.runInContext(code, sandbox, { filename: relPath });
};

loadScript('js/apps/clippy-help.js');
loadScript('js/apps/clippy-tips.js');
loadScript('js/apps/clippy-talk.js');
loadScript('js/apps/clippy-system.js');
loadScript('js/apps/neko.js');
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'js/desktop.js'), 'utf8').replace(/^window\.(contextMenu|desktop) = new \w+\(\);$/gm, ''),
  sandbox,
  { filename: 'js/desktop.js' }
);

const neko = sandbox.window.appNeko;
assert.ok(neko, 'window.appNeko should be initialized');

const expectedFrames = [
  'sit_1', 'sit_2', 'sit_blink', 'alert_1', 'alert_2',
  'run_s_1', 'run_s_2', 'run_n_1', 'run_n_2',
  'run_e_1', 'run_e_2', 'run_se_1', 'run_se_2',
  'run_ne_1', 'run_ne_2',
  'scratch_n_1', 'scratch_n_2', 'scratch_s_1', 'scratch_s_2',
  'scratch_e_1', 'scratch_e_2',
  'wash_1', 'wash_2', 'itch_1', 'itch_2',
  'yawn_1', 'yawn_2', 'sleep_1', 'sleep_2',
  'drag_1', 'drag_2', 'purr_1', 'purr_2',
  'pounce_1', 'pounce_2', 'eat_1', 'eat_2'
];

for (const frameKey of expectedFrames) {
  assert.ok(Array.isArray(neko.compiledFrames[frameKey]), `Frame ${frameKey} should be pre-compiled`);
  assert.ok(neko.compiledFrames[frameKey].length > 20, `Frame ${frameKey} should have pixel run-length spans`);
}
console.log(`  ok - all ${expectedFrames.length} 32x32 pixel-art frames compiled`);

const coats = neko.getCoats();
const coatKeys = ['white', 'ginger', 'calico', 'black', 'siamese', 'scribble'];
const testCtx = createMockElement('canvas').getContext('2d');
for (const coatId of coatKeys) {
  assert.ok(coats[coatId], `Coat ${coatId} should exist`);
  for (const frameKey of expectedFrames) {
    neko.drawCatFrame(testCtx, frameKey, 16, 16, 32, false, coats[coatId]);
    neko.drawCatFrame(testCtx, frameKey, 16, 16, 32, true, coats[coatId]);
  }
}
console.log('  ok - all 6 coats (including Scribble SCRIBBLE.ACT homage) render across all frames & flips');

assert.equal(neko.enabled, false, 'Neko should start disabled by default');
assert.equal(neko.processList().length, 0, 'No neko.exe process when disabled');

neko.start();
assert.equal(neko.enabled, true, 'neko.start() should enable Neko');
assert.equal(neko.processList().length, 1, 'neko.exe should appear in processList when running');
assert.equal(neko.processList()[0].imageName, 'neko.exe');
assert.equal(neko.processList()[0].isNeko, true);
assert.ok(mockElements['tray-neko-icon'], 'System tray icon #tray-neko-icon should be mounted');
console.log('  ok - start/stop lifecycle, tray icon, and neko.exe Task Manager process');

neko.openBasket();
assert.ok(mockWinManager.windows.has('app_neko_basket'), 'openBasket() should open app_neko_basket window');
const basketWin = mockWinManager.windows.get('app_neko_basket');
assert.ok(basketWin.element.innerHTML.includes('neko-basket-hearth'), 'Basket window should contain wicker hearth preview stage');
assert.ok(basketWin.element.innerHTML.includes('neko-collar-plaque'), 'Basket window should contain engraved brass collar plaque');
assert.ok(basketWin.element.innerHTML.includes('data-neko-coat="scribble"'), 'Basket window should include Scribble coat option');
console.log('  ok - Корзинка Neko 98 window layout and controls');

spokenLines.length = 0;
neko.playWithClippy('paper');
assert.ok(neko.prop && neko.prop.kind === 'paper_ball', 'playWithClippy("paper") should spawn a paper_ball prop');
assert.ok(spokenLines.length >= 1, 'Clippy should announce tossing the crumpled draft ball');

const ball = neko.prop;
ball.cooldown = 0;
neko.x = ball.x;
neko.y = ball.y;
neko.updateProp();
assert.equal(ball.bats, 1, 'First pounce should bat the paper ball');

ball.cooldown = 0;
neko.x = ball.x;
neko.y = ball.y;
neko.updateProp();
assert.equal(ball.returningToClippy, true, 'Second pounce should bat the paper ball back toward Clippy');

spokenLines.length = 0;
ball.x = 836;
ball.y = 556;
ball.vx = 0;
ball.vy = 0;
neko.updateProp();
assert.equal(neko.prop, null, 'Paper ball should be caught by Clippy');
assert.ok(spokenLines.some(s => s.text.includes('отбил скомканный черновик')), 'Clippy should celebrate Neko batting the paper ball back');
console.log('  ok - Clippy crumpled paper ball rally (toss -> pounce -> bat back to Clippy)');

spokenLines.length = 0;
neko.x = 836;
neko.y = 556;
const dropped = neko.checkDroppedOnClippy();
assert.equal(dropped, true, 'checkDroppedOnClippy should return true when dropped near Clippy');
assert.equal(neko.state, 'purring', 'Dropping Neko onto Clippy should make Neko purr');
assert.ok(spokenLines.some(s => s.text.includes('прямо мне на макушку')), 'Clippy should react when Neko is dropped onto him');

spokenLines.length = 0;
neko.x = 840;
neko.y = 560;
const droppedNear = sandbox.window.clippySystem.checkDroppedNearNeko();
assert.equal(droppedNear, true, 'checkDroppedNearNeko should detect Neko nearby');
assert.ok(spokenLines.some(s => s.text.includes('Переехали поближе к коту')), 'Clippy should greet Neko when dragged near him');

spokenLines.length = 0;
neko.setCoat('scribble');
assert.ok(spokenLines.some(s => s.text.includes('SCRIBBLE.ACT')), 'Clippy should recognize Scribble coat');
console.log('  ok - drag-and-drop interactions and Scribble coat recognition');

const icqReply = sandbox.window.clippySystem.icqReply('Как там котик Neko?');
assert.ok(icqReply.includes('Neko'), 'Clippy ICQ reply should mention Neko');

const helpHits = sandbox.window.clippyHelp.search('котик неко корзинка');
assert.ok(helpHits.some(h => h.entry.id === 'neko'), 'Clippy Help should find Neko entry');
assert.ok(sandbox.window.clippyTips.catalog['neko-pet'], 'Clippy Tips should include neko-pet tip');
assert.ok(sandbox.window.clippyTalk.nodes.nekoColleague, 'Clippy Talk should include nekoColleague node');
console.log('  ok - Clippy Help, Tips, Talk nodes, and ICQ integration');

const baseIcons = sandbox.window.Desktop.prototype.getBaseIcons.call({ systemIcon: (k) => k });
const nekoIcon = baseIcons.find(i => i.id === 'neko');
assert.ok(nekoIcon, 'Neko 98 should be on the desktop by default');
assert.equal(nekoIcon.title, 'Neko 98');
assert.equal(nekoIcon.icon, 'neko', 'Desktop icon should show the cat while the coat is a cat');
console.log('  ok - Neko 98 desktop icon is present by default');

for (const frameKey of expectedFrames) {
  assert.ok(Array.isArray(neko.clawdFrames[frameKey]) && neko.clawdFrames[frameKey].length > 10, `Clawd frame ${frameKey} should be compiled`);
  neko.drawCatFrame(testCtx, frameKey, 16, 16, 32, false, coats.clawd);
  neko.drawCatFrame(testCtx, frameKey, 16, 16, 32, true, coats.clawd);
}
assert.ok(!neko.getVisibleCoatIds().includes('clawd'), 'Clawd should stay hidden until the secret word is typed');
assert.equal(neko.setCoat('clawd'), false, 'Locked Clawd coat cannot be selected directly');
console.log('  ok - Clawd frames compile and the coat is hidden before unlock');

const pressKeys = (keys) => keys.forEach(k => docListeners.keydown.forEach(fn => fn(typeof k === 'string' ? { code: `Key${k}`, key: k.toLowerCase() } : k)));

mockWinManager.activeWindowId = 'app_desktop_other';
pressKeys(['C', 'L', 'A', 'U', 'D', 'E']);
assert.equal(neko.settings.coat, 'scribble', 'Secret word should be ignored when the basket window is not active');

mockWinManager.activeWindowId = 'app_neko_basket';
pressKeys(['C', 'L', 'A', 'X', 'U', 'D', 'E']);
assert.equal(neko.settings.coat, 'scribble', 'A wrong letter should reset the secret word');

spokenLines.length = 0;
pressKeys(['C', 'L', 'A', 'U', 'D', { code: 'KeyE', key: 'у' }]);
assert.equal(neko.settings.coat, 'clawd', 'Typing C L A U D E in the basket should turn Neko into Clawd (any keyboard layout)');
assert.equal(neko.settings.clawdUnlocked, true, 'Clawd should become unlocked');
assert.equal(neko.settings.prevCoat, 'scribble', 'Previous coat should be remembered');
assert.ok(neko.getVisibleCoatIds().includes('clawd'), 'Clawd swatch should appear in the basket after unlock');
assert.equal(mockElements['tray-neko-icon'].dataset.icon, 'clawd', 'Tray icon should switch to Clawd');
assert.equal(sandbox.window.Desktop.prototype.getBaseIcons.call({ systemIcon: (k) => k }).find(i => i.id === 'neko').icon, 'clawd', 'Desktop icon should show Clawd');
assert.ok(spokenLines.some(s => s.text.includes('<strong>Clawd</strong>') && s.text.includes('Claude')), 'Clippy should recognise Clawd on the first meeting');
assert.ok(sandbox.window.clippyTalk.hasFlag('metClawd'), 'Clippy should remember meeting Clawd');
assert.ok(neko.getStateLabel().length > 0);

neko.think();
assert.equal(neko.state, 'washing', 'think() should put Clawd into the thinking pose');
neko.render();

spokenLines.length = 0;
neko.x = 836;
neko.y = 556;
neko.checkDroppedOnClippy();
assert.ok(spokenLines.some(s => s.text.includes('Clawd у меня на макушке')), 'Clippy should have a Clawd line when Clawd is dropped on him');

spokenLines.length = 0;
sandbox.window.clippySystem.nekoSeen = true;
sandbox.window.clippySystem.checkNeko();
assert.ok(spokenLines.some(s => s.text.includes('Коллега! Clawd')), 'Clippy should greet Clawd separately from the cat');

const talkNode = sandbox.window.clippyTalk.nodes.clawdColleague;
assert.ok(talkNode && talkNode.text.includes('Claude'), 'Clippy Talk should include clawdColleague node');
console.log('  ok - C L A U D E in the basket turns Neko into Clawd, Clippy reacts');

spokenLines.length = 0;
pressKeys(['C', 'L', 'A', 'U', 'D', 'E']);
assert.equal(neko.settings.coat, 'scribble', 'Typing the word again should bring the cat back');
assert.equal(mockElements['tray-neko-icon'].dataset.icon, 'neko');
assert.ok(spokenLines.some(s => s.text.includes('Котик вернулся')), 'Clippy should react when the cat comes back');
assert.equal(neko.setCoat('clawd'), true, 'Unlocked Clawd can be picked from the basket');
spokenLines.length = 0;
neko.setCoat('white');
console.log('  ok - typing CLAUDE again restores the previous coat');

neko.stop();
assert.equal(neko.enabled, false, 'neko.stop() should disable Neko');

console.log('--- All Neko 98 tests passed! ---');
