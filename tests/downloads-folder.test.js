const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Downloads Folder & Installer Destination ---');

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

// Custom interval simulator to step dialup download simulation synchronously
let activeTimers = [];
function mockSetInterval(fn) {
  const timer = { fn, active: true };
  activeTimers.push(timer);
  return timer;
}
function mockClearInterval(t) {
  if (t) t.active = false;
}
function stepTimers(count = 15) {
  for (let c = 0; c < count; c++) {
    for (const t of [...activeTimers]) {
      if (t.active) t.fn();
    }
  }
}

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
  setInterval: mockSetInterval,
  clearInterval: mockClearInterval,
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

// Load scripts
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
const Icons = mockCtx.window.Icons;

// Test 1: Downloads folder exists in C:\My Documents
const downloadsFolder = vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'Downloads']);
assert.ok(downloadsFolder, 'C:\\My Documents\\Downloads must exist');
assert.strictEqual(downloadsFolder.type, 'folder');
assert.strictEqual(downloadsFolder.icon, 'folder-downloads');
console.log('PASS 1. Downloads folder successfully initialized in C:\\My Documents');

// Test 2: Case-insensitive path resolution
const lowerResolved = vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'downloads']);
assert.ok(lowerResolved, 'resolvePath should resolve lowercase downloads folder');
assert.strictEqual(lowerResolved, downloadsFolder);
console.log('PASS 2. Case-insensitive path resolution verified');

// Test 3: folder-downloads SVG icon is registered in Icons
assert.ok(Icons['folder-downloads'], 'Icons["folder-downloads"] must be defined');
assert.ok(Icons['folder-downloads'].includes('<svg'), 'Icons["folder-downloads"] must contain SVG markup');
console.log('PASS 3. folder-downloads icon properly defined');

// Test 4: i18n translations for Downloads folder
assert.strictEqual(mockCtx.window.i18n.t('app.myDownloads'), 'Загрузки');
mockCtx.window.i18n.setLanguage('en');
assert.strictEqual(mockCtx.window.i18n.t('app.myDownloads'), 'Downloads');
mockCtx.window.i18n.setLanguage('ru');
console.log('PASS 4. i18n translations verified for RU and EN');

// Test 5: Game download goes to Downloads folder, NOT desktop
gm.state.downloaded = [];
gm.startDownload('wolf3d');
stepTimers(15);

assert.ok(gm.state.downloaded.includes('wolf3d'), 'wolf3d must be marked as downloaded');

// Verify installer in C:\My Documents\Downloads
const wolfInstaller = downloadsFolder.children['Setup_Wolf3D.exe'];
assert.ok(wolfInstaller, 'Setup_Wolf3D.exe must exist in C:\\My Documents\\Downloads');
assert.strictEqual(wolfInstaller.type, 'executable');
assert.strictEqual(wolfInstaller.app, 'setup');
assert.strictEqual(wolfInstaller.gameId, 'wolf3d');

// Verify installer NOT in root of My Documents
const myDocs = vfs.resolvePath(['My Computer', 'C:', 'My Documents']);
assert.strictEqual(myDocs.children['Setup_Wolf3D.exe'], undefined, 'Setup_Wolf3D.exe must NOT be in My Documents root');
console.log('PASS 5. Game installer correctly saved to C:\\My Documents\\Downloads');

// Test 6: Desktop icons MUST NOT contain installer
const currentIcons = desktop.computeCurrentIcons();
const hasInstallerOnDesktop = currentIcons.some(i => i.id === 'installer_wolf3d' || i.isInstaller);
assert.strictEqual(hasInstallerOnDesktop, false, 'Desktop must NOT contain downloaded installer icons');
console.log('PASS 6. Desktop icon list does NOT contain installer icons');

// Test 7: Installed game shortcut appears on desktop AFTER installation
gm.finishInstallation('wolf3d');
assert.ok(gm.isInstalled('wolf3d'), 'wolf3d must be installed');
const iconsAfterInstall = desktop.computeCurrentIcons();
const hasGameOnDesktop = iconsAfterInstall.some(i => i.id === 'wolf3d');
assert.strictEqual(hasGameOnDesktop, true, 'Desktop MUST contain installed game shortcut');
console.log('PASS 7. Installed game shortcut appears on Desktop');

// Test 8: Program/App download (videoplayer) goes to Downloads folder
gm.startDownload('videoplayer');
stepTimers(15);
const playerInstaller = downloadsFolder.children['Setup_MediaPlayer.exe'];
assert.ok(playerInstaller, 'Setup_MediaPlayer.exe must exist in C:\\My Documents\\Downloads');
assert.strictEqual(playerInstaller.gameId, 'videoplayer');
console.log('PASS 8. Program installer (Setup_MediaPlayer.exe) saved to C:\\My Documents\\Downloads');

// Test 9: Legacy migration in ensureIntegrity()
// Put a fake installer in My Documents root
myDocs.children['Setup_Legacy.exe'] = {
  type: 'executable',
  name: 'Setup_Legacy.exe',
  icon: 'setup-installer',
  app: 'setup'
};
vfs.ensureIntegrity();
assert.strictEqual(myDocs.children['Setup_Legacy.exe'], undefined, 'Setup_Legacy.exe should be removed from My Docs root');
assert.ok(downloadsFolder.children['Setup_Legacy.exe'], 'Setup_Legacy.exe should be migrated to Downloads folder');
console.log('PASS 9. Legacy installer migration in ensureIntegrity() verified');

console.log('\n========================================');
console.log('ALL 9 DOWNLOADS FOLDER TESTS PASSED!');
console.log('========================================');
