const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const ENTERTAINMENT = ['Neko 98', 'Сапер', 'Солитер (FreeCell)', 'ICQ 98a', 'WinAmp 98', 'Пасьянс «Косынка»', '3D Pinball', 'Безмятежность'];
const PROGRAMS = ['WinRAR 2.x', 'Paint', 'Блокнот', 'WordPad', 'Калькулятор', 'Outlook Express'];
const DESKTOP_ORDER = ['my-computer', 'my-documents', 'recycle-bin', 'network', 'dialup', 'ie', 'netscape', 'msbackup', 'cdrom_igromania', 'desktop_file_Развлечение', 'desktop_file_Программы'];

function mockElement(id = '') {
  return {
    id,
    dataset: {},
    style: {},
    innerHTML: '',
    clientWidth: 1024,
    clientHeight: 1000,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(c) { return c; },
    addEventListener() {},
    removeEventListener() {},
    contains() { return false; },
    querySelector() { return mockElement(); },
    querySelectorAll() { return []; },
    getContext() { return new Proxy({}, { get: () => () => ({ addColorStop() {} }) }); },
    toDataURL() { return 'data:image/bmp;base64,mock'; }
  };
}

function boot(saved = {}) {
  const storage = new Map(Object.entries(saved));
  const elements = new Map();
  const ctx = {
    console,
    localStorage: {
      getItem: k => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: k => storage.delete(k)
    },
    innerWidth: 1024,
    innerHeight: 1028,
    setTimeout: () => 0,
    clearTimeout() {},
    setInterval: () => 1,
    clearInterval() {},
    addEventListener() {},
    removeEventListener() {},
    document: {
      activeElement: null,
      createElement: () => mockElement(),
      getElementById: id => {
        if (!elements.has(id)) elements.set(id, mockElement(id));
        return elements.get(id);
      },
      addEventListener() {},
      removeEventListener() {},
      body: mockElement('body')
    }
  };
  ctx.window = ctx;
  ctx.winManager = { openDialog() {} };
  vm.createContext(ctx);
  vm.runInContext(read('js/i18n.js') + '; window.i18n = new I18nManager();', ctx);
  vm.runInContext(read('js/icons.js') + '; window.Icons = Icons;', ctx);
  vm.runInContext(read('js/filesystem.js'), ctx);
  vm.runInContext(read('js/game-manager.js'), ctx);
  vm.runInContext(read('js/desktop.js'), ctx);
  return { ctx, storage, desktop: ctx.desktop, vfs: ctx.vfs, gm: ctx.gameManager };
}

const plain = value => JSON.parse(JSON.stringify(value));

function shortcutNames(vfs, folder) {
  return plain(Object.keys(vfs.resolvePath(['Desktop', folder]).children));
}

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`  ok - ${name}`);
}

console.log('--- Desktop folders ---');

test('a new system has the column from the design with the two folders under it', () => {
  const { desktop } = boot();
  assert.deepEqual(plain(desktop.icons.map(i => i.id)), DESKTOP_ORDER);
  desktop.icons.forEach((item, row) => {
    assert.deepEqual(plain(desktop.iconPositions[item.id]), { x: 10, y: 10 + row * 76 }, `${item.id} is in row ${row} of the first column`);
  });
});

test('Развлечение and Программы hold the moved programs as shortcuts', () => {
  const { vfs } = boot();
  assert.deepEqual(shortcutNames(vfs, 'Развлечение').sort(), [...ENTERTAINMENT].sort());
  assert.deepEqual(shortcutNames(vfs, 'Программы').sort(), [...PROGRAMS].sort());
  for (const folder of ['Развлечение', 'Программы']) {
    assert.equal(vfs.resolvePath(['Desktop', folder]).type, 'folder');
    for (const node of Object.values(vfs.resolvePath(['Desktop', folder]).children)) {
      assert.equal(node.isShortcut, true, `${node.name} shows the shortcut arrow`);
    }
  }
});

test('every action of a folder shortcut exists in the Start menu actions', () => {
  const { vfs } = boot();
  const taskbar = read('js/taskbar.js');
  for (const folder of ['Развлечение', 'Программы']) {
    for (const node of Object.values(vfs.resolvePath(['Desktop', folder]).children)) {
      if (node.app === 'neko') continue;
      const action = node.content.replace('action:', '');
      assert.ok(taskbar.includes(`case '${action}':`), `case '${action}' exists`);
    }
  }
});

test('a save with the old desktop gets the folders once and keeps its games in place', () => {
  const positions = { minesweeper: { x: 400, y: 400 }, 'my-computer': { x: 500, y: 300 }, doom: { x: 88, y: 10 } };
  const { desktop, vfs, storage } = boot({ win98_desktop_icon_positions: JSON.stringify(positions) });
  assert.deepEqual(plain(desktop.iconPositions['my-computer']), { x: 10, y: 10 }, 'system icons return to the new layout');
  assert.ok(!desktop.iconPositions.minesweeper, 'moved icons free their cells');
  assert.deepEqual(plain(desktop.iconPositions.doom), { x: 88, y: 10 }, 'game positions stay');
  assert.ok(vfs.resolvePath(['Desktop', 'Развлечение']));

  vfs.deleteItem(['Desktop'], 'Развлечение', false);
  const again = boot(Object.fromEntries(storage));
  assert.ok(!again.vfs.resolvePath(['Desktop', 'Развлечение']), 'a folder the player deleted does not come back');
  assert.deepEqual(plain(again.desktop.iconPositions['my-computer']), { x: 10, y: 10 });
});

test('a folder from the Recycle Bin comes back with its shortcuts', () => {
  const { vfs } = boot();
  vfs.deleteItem(['Desktop'], 'Программы', true);
  assert.ok(!vfs.resolvePath(['Desktop', 'Программы']));
  assert.equal(vfs.restoreRecycleBinItem('Программы').success, true);
  assert.deepEqual(shortcutNames(vfs, 'Программы').sort(), [...PROGRAMS].sort());
  assert.equal(vfs.resolvePath(['Desktop', 'Программы', 'Paint']).isShortcut, true);
});

test('a shortcut pasted on the desktop still starts its program', () => {
  const { desktop, vfs, ctx } = boot();
  const paint = vfs.list(['Desktop', 'Программы']).find(i => i.name === 'Paint');
  desktop.placeVfsCopy(['Desktop'], paint);
  const links = [];
  ctx.taskbar = { openStartMenuLink: link => links.push(link) };
  desktop.renderIcons();
  const icon = desktop.icons.find(i => i.id === 'desktop_file_Paint');
  assert.equal(desktop.isShortcut(icon), true);
  icon.action();
  assert.equal(links[0].ref, 'action:paint');
});

test('the WinAmp shortcut depends on the installed state', () => {
  const { vfs, gm } = boot();
  assert.equal(vfs.resolvePath(['Desktop', 'Развлечение', 'WinAmp 98']).requiresInstalled, 'winamp');
  assert.equal(gm.isInstalled('winamp'), true);
  assert.match(read('js/apps/explorer.js'), /isInstalled\(it\.requiresInstalled\)/);
});

test('installed programs still get their own desktop icons', () => {
  const { desktop, gm } = boot();
  gm.state.installed.push('doom');
  assert.ok(desktop.computeCurrentIcons().some(i => i.id === 'doom'));
  assert.ok(!desktop.computeCurrentIcons().some(i => i.id === 'winamp' || i.id === 'neko'));
});

console.log(`\nAll ${passed} desktop folder tests passed.`);
