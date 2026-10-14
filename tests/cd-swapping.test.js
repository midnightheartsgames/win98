const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing CD-ROM Swapping and Office Games 98 Disc in VFS ---');

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
      clearRect() {},
      beginPath() {},
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
    querySelector() { return createMockElement('div'); },
    querySelectorAll() { return []; }
  };
}

const mockDocument = {
  createElement: (t) => createMockElement(t),
  getElementById: (id) => createMockElement('div', id),
  addEventListener: () => {},
  removeEventListener: () => {}
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

vm.createContext(mockCtx);

const i18nCode = fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8');
const iconsCode = fs.readFileSync(path.join(__dirname, '../js/icons.js'), 'utf8');
const fsCode = fs.readFileSync(path.join(__dirname, '../js/filesystem.js'), 'utf8');

vm.runInContext(i18nCode + '; window.i18n = new I18nManager();', mockCtx);
vm.runInContext(iconsCode + '; window.Icons = Icons;', mockCtx);
vm.runInContext(fsCode, mockCtx);

const vfs = mockCtx.window.vfs;

assert.equal(vfs.isCdRomInserted(), true);
assert.equal(vfs.cdRomState.discId, 'igromania_09_1998');
let dDrive = vfs.resolvePath(['My Computer', 'D:']);
assert.ok(dDrive);
assert.ok(dDrive.children['igroman.exe']);
console.log('PASS 1. Initial disc is Igromania and is inserted');

vfs.insertCdRom('D:', 'office_games_98');
assert.equal(vfs.isCdRomInserted(), true);
assert.equal(vfs.cdRomState.discId, 'office_games_98');
dDrive = vfs.resolvePath(['My Computer', 'D:']);
assert.ok(dDrive);
assert.equal(dDrive.name, 'Офисные игры ’98 (D:)');
assert.ok(dDrive.children['LAUNCHER.EXE']);
assert.ok(dDrive.children['AUTORUN.INF']);
assert.ok(dDrive.children['README.TXT']);
assert.ok(dDrive.children['GAMES']);
console.log('PASS 2. Inserted Office Games 98 CD successfully');

const games = dDrive.children['GAMES'].children;
assert.ok(games['SNAKE3D']);
assert.ok(games['SNAKE3D'].children['SNAKE3D.EXE']);
assert.ok(games['ARKANOID']);
assert.ok(games['ARKANOID'].children['ARKANOID.EXE']);
assert.ok(games['PLATFORM']);
assert.ok(games['PLATFORM'].children['OFFICERUN.EXE']);
assert.ok(games['SHOOTER']);
assert.ok(games['SHOOTER'].children['MOORHUNT.EXE']);
assert.ok(games['MATCH3']);
assert.ok(games['MATCH3'].children['GEMS98.EXE']);
assert.ok(games['LINES98']);
assert.ok(games['LINES98'].children['LINES98.EXE']);
assert.ok(games['TETRIS']);
assert.ok(games['TETRIS'].children['TETRIS.EXE']);
assert.ok(games['CHAIRS']);
assert.ok(games['CHAIRS'].children['CHAIRS.EXE']);
console.log('PASS 3. All 8 office games exist on D:\\GAMES\\');

vfs.ejectCdRom('D:');
assert.equal(vfs.isCdRomInserted(), false);
assert.equal(vfs.cdRomState.discId, null);
dDrive = vfs.resolvePath(['My Computer', 'D:']);
assert.equal(Object.keys(dDrive.children).length, 0);
console.log('PASS 4. Ejecting CD clears drive D:');

vfs.insertCdRom('D:', 'office_games_98');
vm.runInContext('window.vfs = new VirtualFileSystem();', mockCtx);
const vfsReboot = mockCtx.window.vfs;
assert.equal(vfsReboot.isCdRomInserted(), true);
assert.equal(vfsReboot.cdRomState.discId, 'office_games_98');
const rebootDDrive = vfsReboot.resolvePath(['My Computer', 'D:']);
assert.ok(rebootDDrive.children['LAUNCHER.EXE']);
console.log('PASS 5. CD-ROM state persists across restarts');

vfsReboot.insertCdRom('D:', 'igromania_09_1998');
assert.equal(vfsReboot.cdRomState.discId, 'igromania_09_1998');
const igroDDrive = vfsReboot.resolvePath(['My Computer', 'D:']);
assert.ok(igroDDrive.children['igroman.exe']);
console.log('PASS 6. Switching back to Igromania works properly');

console.log('========================================');
console.log('ALL CD SWAPPING TESTS PASSED!');
console.log('========================================');
