const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Store Purchases & CD Demo Installation (HL98, Neon Racer, AVP, NHL 98) ---');

// Mock localStorage
const storage = new Map();
const mockLocalStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};

function createMockElement(tag = 'div', id = '') {
  return {
    tagName: tag.toUpperCase(),
    id,
    dataset: {},
    style: {},
    disabled: false,
    textContent: '',
    clientWidth: 800,
    clientHeight: 572,
    children: [],
    classList: {
      add() {},
      remove() {},
      contains() { return false; }
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
      beginPath() {},
      closePath() {},
      arc() {},
      fill() {},
      moveTo() {},
      lineTo() {},
      bezierCurveTo() {},
      stroke() {},
      fillText() {},
      createLinearGradient: () => ({ addColorStop() {} }),
      createRadialGradient: () => ({ addColorStop() {} })
    }),
    toDataURL: () => 'data:image/bmp;base64,mock',
    querySelector() {
      return createMockElement('div');
    },
    querySelectorAll() {
      return [];
    }
  };
}

const desktopEl = createMockElement('main', 'desktop');
const desktopIconsEl = createMockElement('div', 'desktop-icons');
const selectionBoxEl = createMockElement('div', 'selection-box');
const contextMenuEl = createMockElement('div', 'context-menu');
desktopEl.appendChild(desktopIconsEl);
desktopEl.appendChild(selectionBoxEl);

const mockElements = {
  'desktop': desktopEl,
  'desktop-icons': desktopIconsEl,
  'selection-box': selectionBoxEl,
  'context-menu': contextMenuEl
};

const mockDocument = {
  createElement: (t) => createMockElement(t),
  getElementById: (id) => mockElements[id] || createMockElement('div', id),
  addEventListener: () => {},
  removeEventListener: () => {}
};

const mockWinManager = {
  windows: new Map(),
  createWindow(opts) {
    const el = createMockElement('div', opts.id);
    const win = { id: opts.id, opts, element: el };
    this.windows.set(opts.id, win);
    return win;
  },
  closeWindow(id) {
    this.windows.delete(id);
  },
  openDialog() {}
};

const windowListeners = new Map();
const mockCtx = {
  window: {},
  document: mockDocument,
  localStorage: mockLocalStorage,
  console,
  innerWidth: 800,
  innerHeight: 600,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  setInterval: () => ({}),
  clearInterval: () => {},
  addEventListener: (evt, fn) => {
    if (!windowListeners.has(evt)) windowListeners.set(evt, []);
    windowListeners.get(evt).push(fn);
  },
  removeEventListener: () => {}
};
mockCtx.window = mockCtx;
mockCtx.window.document = mockDocument;
mockCtx.window.localStorage = mockLocalStorage;
mockCtx.window.winManager = mockWinManager;

vm.createContext(mockCtx);

// Load core scripts
const i18nCode = fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8');
const iconsCode = fs.readFileSync(path.join(__dirname, '../js/icons.js'), 'utf8');
const fsCode = fs.readFileSync(path.join(__dirname, '../js/filesystem.js'), 'utf8');
const gmCode = fs.readFileSync(path.join(__dirname, '../js/game-manager.js'), 'utf8');
const desktopCode = fs.readFileSync(path.join(__dirname, '../js/desktop.js'), 'utf8');

vm.runInContext(i18nCode + '; window.i18n = new I18nManager();', mockCtx);
vm.runInContext(iconsCode + '; window.Icons = Icons;', mockCtx);
vm.runInContext(fsCode, mockCtx);
vm.runInContext(gmCode, mockCtx);
vm.runInContext(desktopCode, mockCtx);

const vfs = mockCtx.window.vfs;
const gm = mockCtx.window.gameManager;
const desktop = mockCtx.window.desktop;
const i18n = mockCtx.window.i18n;

// TEST 1: Initial state - paid games, avp, and hockey are NOT installed by default
assert.strictEqual(gm.isInstalled('half-life'), false, 'Half-Life must not be installed initially');
assert.strictEqual(gm.isInstalled('neon-racer'), false, 'Midnight Glide must not be installed initially');
assert.strictEqual(gm.isInstalled('avp'), false, 'AVP must not be installed initially');
assert.strictEqual(gm.isInstalled('hockey'), false, 'NHL 98 must not be installed initially');
console.log('PASS 1. Half-life, Midnight Glide, AVP, and NHL 98 are NOT installed initially');

// TEST 2: Initial desktop icons do NOT contain paid games, AVP, hockey, digicharat, or kinomania
const initialIcons = desktop.computeCurrentIcons();
const initialIconIds = initialIcons.map(i => i.id);
const initialTitles = initialIcons.map(i => i.title);

assert.ok(!initialIconIds.includes('half-life'), 'Desktop must not have half-life icon initially');
assert.ok(!initialIconIds.includes('neon-racer'), 'Desktop must not have neon-racer icon initially');
assert.ok(!initialIconIds.includes('avp'), 'Desktop must not have avp icon initially');
assert.ok(!initialIconIds.includes('hockey'), 'Desktop must not have hockey icon initially');
assert.ok(!initialIconIds.includes('digicharat'), 'Desktop must not have digicharat icon initially');
assert.ok(!initialTitles.some(t => t && t.includes('Киномания')), 'Desktop must not have Kinomania icon initially');

// Check filesystem desktop folder
const desktopFolder = vfs.resolvePath(['My Computer', 'C:', 'Windows', 'Desktop']);
const desktopFileNames = desktopFolder && desktopFolder.children ? Object.keys(desktopFolder.children) : [];
assert.ok(!desktopFileNames.includes('Киномания 98.url'), 'Desktop VFS must not have Kinomania 98.url');
console.log('PASS 2. Desktop icons cleanly omit uninstalled games, AVP, Di Gi Charat, and Kinomania');

// TEST 3: Catalog verification
const hlEntry = gm.catalog['half-life'];
assert.ok(hlEntry, 'Catalog must contain half-life');
assert.strictEqual(hlEntry.title, 'Half-Life 98');
assert.strictEqual(hlEntry.price, 34.99);

const racerEntry = gm.catalog['neon-racer'];
assert.ok(racerEntry, 'Catalog must contain neon-racer');
assert.strictEqual(racerEntry.title, 'Midnight Glide');
assert.strictEqual(racerEntry.price, 19.99);

const avpEntry = gm.catalog['avp'];
assert.ok(avpEntry, 'Catalog must contain avp');
assert.strictEqual(avpEntry.title, 'Антивирус Касперского AVP');
assert.strictEqual(avpEntry.price, 24.99);
assert.strictEqual(avpEntry.isApp, true);

const hockeyEntry = gm.catalog['hockey'];
assert.ok(hockeyEntry, 'Catalog must contain hockey');
assert.strictEqual(hockeyEntry.title, 'NHL 98');
assert.strictEqual(hockeyEntry.priceDisplay, 'DEMO');
assert.strictEqual(hockeyEntry.setupExe, 'nhl98demo.exe');
console.log('PASS 3. GameManager catalog configured correctly with titles and pricing');

// TEST 4: D: drive has nhl98demo.exe
const nhlDemo = vfs.resolvePath(['My Computer', 'D:', 'demo', 'nhl98demo.exe']);
assert.ok(nhlDemo, 'D:\\demo\\nhl98demo.exe must exist in CD tree');
assert.strictEqual(nhlDemo.app, 'setup');
assert.strictEqual(nhlDemo.gameId, 'hockey');
console.log('PASS 4. D:\\demo\\nhl98demo.exe exists and is configured as installer for hockey');

// TEST 5: Purchase and install Half-Life 98
assert.strictEqual(gm.isPurchased('half-life'), false);
const buyHlResult = gm.purchaseGame('half-life');
assert.strictEqual(buyHlResult, true);
assert.strictEqual(gm.isPurchased('half-life'), true);
gm.finishInstallation('half-life', 'C:\\Games\\HalfLife');
assert.strictEqual(gm.isInstalled('half-life'), true);

const iconsAfterHl = desktop.computeCurrentIcons();
assert.ok(iconsAfterHl.some(i => i.id === 'half-life'), 'Desktop must contain half-life after installation');
const hlExe = vfs.resolvePath(['My Computer', 'C:', 'Games', 'HalfLife', 'HL.EXE']);
assert.ok(hlExe, 'C:\\Games\\HalfLife\\HL.EXE must exist');
console.log('PASS 5. Half-Life purchased and installed successfully, appears on Desktop and in VFS');

// TEST 6: Purchase and install Midnight Glide (neon-racer)
const buyRacerResult = gm.purchaseGame('neon-racer');
assert.strictEqual(buyRacerResult, true);
gm.finishInstallation('neon-racer', 'C:\\Games\\MidnightGlide');
assert.strictEqual(gm.isInstalled('neon-racer'), true);

const iconsAfterRacer = desktop.computeCurrentIcons();
assert.ok(iconsAfterRacer.some(i => i.id === 'neon-racer'), 'Desktop must contain neon-racer after installation');
const glideExe = vfs.resolvePath(['My Computer', 'C:', 'Games', 'MidnightGlide', 'GLIDE.EXE']);
assert.ok(glideExe, 'C:\\Games\\MidnightGlide\\GLIDE.EXE must exist');
console.log('PASS 6. Midnight Glide purchased and installed successfully');

// TEST 7: Purchase and install Kaspersky AVP
const buyAvpResult = gm.purchaseGame('avp');
assert.strictEqual(buyAvpResult, true);
gm.finishInstallation('avp', 'C:\\Program Files\\AVP');
assert.strictEqual(gm.isInstalled('avp'), true);

const iconsAfterAvp = desktop.computeCurrentIcons();
assert.ok(iconsAfterAvp.some(i => i.id === 'avp'), 'Desktop must contain avp after installation');
const avpExe = vfs.resolvePath(['My Computer', 'C:', 'Program Files', 'AVP', 'AVP.EXE']);
assert.ok(avpExe, 'C:\\Program Files\\AVP\\AVP.EXE must exist');
console.log('PASS 7. Kaspersky AVP purchased and installed successfully in Program Files');

// TEST 8: Install NHL 98 from Igromania CD
gm.finishInstallation('hockey', 'C:\\Games\\NHL98');
assert.strictEqual(gm.isInstalled('hockey'), true);

const iconsAfterNhl = desktop.computeCurrentIcons();
const nhlIcon = iconsAfterNhl.find(i => i.id === 'hockey');
assert.ok(nhlIcon, 'Desktop must contain hockey icon after installation');
assert.strictEqual(nhlIcon.title, 'NHL 98', 'Icon title must be NHL 98');
const nhlExe = vfs.resolvePath(['My Computer', 'C:', 'Games', 'NHL98', 'NHL98.EXE']);
assert.ok(nhlExe, 'C:\\Games\\NHL98\\NHL98.EXE must exist');
console.log('PASS 8. NHL 98 installed from Igromania CD successfully as NHL 98');

// TEST 9: Localization verification
i18n.setLanguage('ru');
assert.strictEqual(i18n.t('app.hockey'), 'NHL 98');
i18n.setLanguage('en');
assert.strictEqual(i18n.t('app.hockey'), 'NHL 98');
console.log('PASS 9. Localization for app.hockey returns NHL 98 in both RU and EN');

console.log('\n========================================');
console.log('ALL STORE AND CD INSTALLATION TESTS PASSED!');
console.log('========================================\n');
