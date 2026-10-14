const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Office Games 98 Launcher (Stage 2) ---');

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
    textContent: '',
    innerHTML: '',
    clientWidth: 800,
    clientHeight: 572,
    children: [],
    classList: {
      tokens: new Set(),
      add(c) { this.tokens.add(c); },
      remove(c) { this.tokens.delete(c); },
      contains(c) { return this.tokens.has(c); },
      toggle(c, force) {
        if (force === true) this.tokens.add(c);
        else if (force === false) this.tokens.delete(c);
        else if (this.tokens.has(c)) this.tokens.delete(c);
        else this.tokens.add(c);
      }
    },
    appendChild(c) {
      this.children.push(c);
      c.parentNode = this;
      return c;
    },
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
    getContext: () => ({
      fillRect() {},
      strokeRect() {},
      clearRect() {},
      beginPath() {},
      arc() {},
      fill() {},
      moveTo() {},
      lineTo() {},
      bezierCurveTo() {},
      stroke() {},
      fillText() {},
      closePath() {},
      setLineDash() {},
      ellipse() {},
      createLinearGradient: () => ({ addColorStop() {} }),
      createRadialGradient: () => ({ addColorStop() {} })
    }),
    toDataURL: () => 'data:image/bmp;base64,mock',
    querySelector(sel) {
      if (sel.startsWith('#')) {
        const targetId = sel.slice(1);
        const search = (node) => {
          if (node.id === targetId) return node;
          for (const child of node.children) {
            const found = search(child);
            if (found) return found;
          }
          return null;
        };
        return search(this) || createMockElement('div', targetId);
      }
      return createMockElement('div');
    },
    querySelectorAll(sel) {
      const results = [];
      const search = (node) => {
        if (sel.startsWith('.') && node.classList && node.classList.contains(sel.slice(1))) {
          results.push(node);
        }
        for (const child of node.children) {
          search(child);
        }
      };
      search(this);
      return results;
    }
  };
  return el;
}

const mockDocument = {
  createElement: (t) => createMockElement(t),
  getElementById: (id) => createMockElement('div', id),
  addEventListener: () => {},
  removeEventListener: () => {}
};

const mockWinManager = {
  windows: new Map(),
  createWindow(opts) {
    const body = createMockElement('div', 'win_body');
    const win = {
      id: opts.id,
      title: opts.title,
      icon: opts.icon,
      body,
      element: createMockElement('div', opts.id)
    };
    this.windows.set(opts.id, win);
    return win;
  },
  bringToTop() {},
  openDialog() {}
};

const mockCtx = {
  console,
  setTimeout: () => {},
  clearTimeout: () => {},
  setInterval: () => ({}),
  clearInterval: () => {},
  addEventListener: () => {},
  removeEventListener: () => {}
};
mockCtx.window = mockCtx;
mockCtx.window.document = mockDocument;
mockCtx.window.localStorage = mockLocalStorage;
mockCtx.window.winManager = mockWinManager;

vm.createContext(mockCtx);

const i18nCode = fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8');
const iconsCode = fs.readFileSync(path.join(__dirname, '../js/icons.js'), 'utf8');
const fsCode = fs.readFileSync(path.join(__dirname, '../js/filesystem.js'), 'utf8');
const launcherCode = fs.readFileSync(path.join(__dirname, '../js/apps/officegames/office-launcher.js'), 'utf8');

vm.runInContext(i18nCode + '; window.i18n = new I18nManager();', mockCtx);
vm.runInContext(iconsCode + '; window.Icons = Icons;', mockCtx);
vm.runInContext(fsCode, mockCtx);
vm.runInContext(launcherCode, mockCtx);

assert.ok(mockCtx.window.OfficeGamesRegistry);
assert.equal(mockCtx.window.OfficeGamesRegistry.length, 8);
const expectedGameIds = ['snake3d', 'arkanoid', 'rush', 'hunt', 'gems', 'lines98', 'tetris', 'chairs'];
expectedGameIds.forEach((id, idx) => {
  assert.equal(mockCtx.window.OfficeGamesRegistry[idx].id, id);
  assert.ok(mockCtx.window.OfficeGamesRegistry[idx].title);
  assert.ok(mockCtx.window.OfficeGamesRegistry[idx].exePath);
  assert.ok(mockCtx.window.OfficeGamesRegistry[idx].desc);
  assert.ok(mockCtx.window.OfficeGamesRegistry[idx].controls);
});
console.log('PASS 1. OfficeGamesRegistry contains all games with required properties');

assert.ok(mockCtx.window.appOfficeLauncher);
mockCtx.window.appOfficeLauncher.open();
assert.ok(mockWinManager.windows.has('app_office_launcher'));
const win = mockWinManager.windows.get('app_office_launcher');
assert.ok(win.body);
console.log('PASS 2. AppOfficeLauncher window successfully created and opened');

const launcher = mockCtx.window.appOfficeLauncher;
launcher.selectGame('gems');
assert.equal(launcher.selectedGameId, 'gems');
launcher.selectGame('arkanoid');
assert.equal(launcher.selectedGameId, 'arkanoid');
console.log('PASS 3. Game selection switching functions properly');

const vfs = mockCtx.window.vfs;
const arkanoidGame = mockCtx.window.OfficeGamesRegistry.find(g => g.id === 'arkanoid');
launcher.createDesktopShortcut(arkanoidGame);
const desktopItems = vfs.getDesktopItems();
const shortcut = desktopItems.find(it => it.name === 'Офисный Арканоид.lnk');
assert.ok(shortcut);
assert.equal(shortcut.app, 'og_arkanoid');
console.log('PASS 4. Desktop shortcut creation saves shortcut to Desktop in VFS');

console.log('========================================');
console.log('ALL OFFICE LAUNCHER TESTS PASSED!');
console.log('========================================');
