const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing the Win 98 network shell ---');

const ROOT = path.join(__dirname, '..');
const noop = () => {};
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function element() {
  const kids = [], attrs = {};
  return {
    children: kids, style: {}, dataset: {}, title: '', innerHTML: '', textContent: '', value: '', className: '', disabled: false, readOnly: false, checked: true, listeners: {},
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    appendChild(c) { kids.push(c); return c; },
    insertBefore(c) { kids.push(c); return c; },
    remove() { this.removed = true; },
    setAttribute(k, v) { attrs[k] = v; },
    getAttribute(k) { return attrs[k]; },
    addEventListener(t, fn) { this.listeners[t] = fn; },
    removeEventListener: noop,
    querySelector(sel) { const box = this.named || (this.named = {}); return box[sel] || (box[sel] = element()); },
    querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 480 })
  };
}

function makeWorld(stored) {
  const store = new Map(Object.entries(stored || {})), listeners = {}, sockets = [], dialogs = [], windows = new Map(), timers = [], warnings = [];
  class FakeSocket {
    constructor(url) { this.url = url; this.readyState = 0; this.sent = []; sockets.push(this); }
    send(text) { this.sent.push(JSON.parse(text)); }
    close() { this.readyState = 3; }
    open() { this.readyState = 1; this.onopen(); }
    hear(m) { this.onmessage({ data: JSON.stringify(m) }); }
    drop() { this.readyState = 3; this.onclose({ code: 1006 }); }
  }
  const sandbox = {
    console: { log: noop, warn: (...args) => warnings.push(args.join(' ')), error: console.error }, Math, JSON, Date, Object, Array, String, Number, Set, Map, Promise, RegExp, Error, parseInt, encodeURIComponent, decodeURIComponent,
    performance: { now: () => Date.now() },
    setTimeout: (fn, ms) => { const t = { fn, at: world.clock + (ms || 0) }; timers.push(t); return t; },
    clearTimeout: t => { const i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); },
    setInterval: () => ({ unref: noop }), clearInterval: noop,
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    document: { createElement: () => element(), getElementById: () => null, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], body: element() },
    addEventListener: (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); },
    removeEventListener: noop,
    dispatchEvent: e => (listeners[e.type] || []).forEach(fn => fn(e)),
    CustomEvent: class { constructor(type, o) { this.type = type; this.detail = (o || {}).detail; } },
    crypto: { getRandomValues: a => { for (let i = 0; i < a.length; i++) a[i] = (i * 37 + 11) % 256; return a; } },
    WebSocket: FakeSocket,
    Icons: { hsr98: '<svg/>' },
    winManager: {
      windows,
      openDialog(o) { dialogs.push(o); return o; },
      createWindow(o) { const win = { id: o.id, element: element(), titleElement: element(), o }; win.close = () => windows.delete(o.id); windows.set(o.id, win); return win; },
      bringToTop: noop, restoreWindow: noop
    }
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  const ctx = vm.createContext(sandbox);
  const world = { sandbox, ctx, store, sockets, dialogs, windows, listeners, timers, warnings, clock: 0 };
  world.load = f => vm.runInContext(read(f), ctx, { filename: f });
  world.tick = ms => {
    for (let left = ms; left > 0; left -= 100) {
      world.clock += 100;
      for (const t of timers.slice().sort((a, b) => a.at - b.at)) {
        if (t.at > world.clock || !timers.includes(t)) continue;
        timers.splice(timers.indexOf(t), 1);
        t.fn();
      }
    }
  };
  world.load('js/i18n.js');
  world.load('js/net98.js');
  world.load('js/net98-shell.js');
  return world;
}

const friend = (uid, name, o) => Object.assign({ uid, name, gender: 'f', tl: 40, avatar: null, on: true, status: { c: 'express' }, ago: 0, fav: false, sign: '', show: [], merits: [], expr: true }, o);
const snapshot = list => ({ op: 'friends', list, in: [], out: [], blocks: [], recent: [], settings: { reqs: 'all', guests: 'friends' }, max: 100, favMax: 3 });

function online(w, list) {
  const n = w.sandbox.Net98;
  n.setConsent(true);
  const sock = w.sockets[w.sockets.length - 1];
  sock.open();
  sock.hear({ op: 'me', uid: n.uid(), table: null });
  sock.hear(snapshot(list || []));
  return sock;
}

function check(title, fn) {
  fn();
  console.log('✓ ' + title);
}

check('the network node is not stored', () => {
  const w = makeWorld();
  w.load('js/filesystem.js');
  const vfs = w.sandbox.vfs, node = vfs.root.children['Network Neighborhood'];
  assert.equal(node.dynamic, true);
  assert.equal(typeof vfs.getDefaultNetworkTree, 'undefined', 'the invented tree is gone');
  vfs.ensureIntegrity();
  vfs.ensureIntegrity();
  assert.deepEqual(w.warnings.filter(t => t.includes('ensureIntegrity')), [], 'the system runs this check more than once at every boot');
  assert.equal(vfs.root.children['Network Neighborhood'], node);
  online(w, [friend('711111111', 'Kaia')]);
  assert.ok(vfs.resolvePath(['Network Neighborhood', 'KAIA']), 'a friend is reachable by path');
  vfs.saveToStorage();
  const saved = w.store.get('win98_vfs_data');
  assert.ok(!saved.includes('KAIA') && !saved.includes('711111111'), 'no foreign names in the stored VFS');
  const stored = JSON.parse(saved).children['Network Neighborhood'];
  assert.deepEqual(Object.keys(stored).sort(), ['dynamic', 'icon', 'name', 'type']);
  const again = makeWorld({ win98_vfs_data: saved });
  again.load('js/filesystem.js');
  assert.deepEqual(Object.keys(again.sandbox.vfs.root.children['Network Neighborhood'].children), ['Подключить Эфирную связь'], 'a reload rebuilds it from the link');
  assert.ok(!vfs.list(['Network Neighborhood']).some(i => /FILESERVER|MISHA-PC/.test(i.key)));
  assert.ok(vfs.getDesktopItems().every(i => i.key !== 'Network Neighborhood'));
  assert.ok(vfs.list([]).length >= 0);
});

check('an old install keeps the files of the player, and only those', () => {
  const lanFile = () => {
    const src = read('js/filesystem.js');
    return /OLD_NETWORK_FILES = \{/.test(src);
  };
  assert.ok(lanFile());
  const w0 = makeWorld();
  w0.load('js/filesystem.js');
  const tree = JSON.parse(JSON.stringify(w0.sandbox.vfs.root));
  tree.children['Network Neighborhood'] = {
    type: 'special', name: 'Network Neighborhood', icon: 'network',
    children: {
      'Entire Network': { type: 'folder', name: 'Entire Network', children: { WORKGROUP: { type: 'folder', name: 'WORKGROUP', children: {} } } },
      'ADMIN-PC': { type: 'folder', name: 'ADMIN-PC', children: { SharedDocs: { type: 'folder', name: 'SharedDocs', children: { 'mine.txt': { type: 'file', name: 'mine.txt', content: 'my text' }, 'LAN_PARTY_98.TXT': { type: 'file', name: 'LAN_PARTY_98.TXT', content: 'I edited this' } } } } },
      FILESERVER: { type: 'folder', name: 'FILESERVER', children: { 'HP LaserJet 4L': { type: 'printer', name: 'HP LaserJet 4L' }, Public: { type: 'folder', name: 'Public', children: { 'My stuff': { type: 'folder', name: 'My stuff', children: { 'a.txt': { type: 'file', name: 'a.txt', content: 'a' } } } } } } },
      'MY-OWN-PC': { type: 'folder', name: 'MY-OWN-PC', children: {} }
    }
  };
  const w = makeWorld({ win98_vfs_data: JSON.stringify(tree) });
  w.load('js/filesystem.js');
  const vfs = w.sandbox.vfs, moved = vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'Старое сетевое окружение']);
  assert.ok(moved, 'the folder is there');
  assert.deepEqual(Object.keys(moved.children).sort(), ['LAN_PARTY_98.TXT', 'MY-OWN-PC', 'My stuff', 'mine.txt'], 'own and edited files move, known ones go');
  assert.equal(moved.children['mine.txt'].content, 'my text');
  assert.equal(moved.children['My stuff'].children['a.txt'].content, 'a');
  assert.ok(!vfs.resolvePath(['Network Neighborhood', 'FILESERVER']), 'no invented computers');
  const saved = w.store.get('win98_vfs_data');
  assert.equal(JSON.parse(saved).children['Network Neighborhood'].dynamic, true, 'the move is remembered');
  const w2 = makeWorld({ win98_vfs_data: saved });
  w2.load('js/filesystem.js');
  assert.deepEqual(Object.keys(w2.sandbox.vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'Старое сетевое окружение']).children).sort(), ['LAN_PARTY_98.TXT', 'MY-OWN-PC', 'My stuff', 'mine.txt'], 'and it runs once');
  const clean = JSON.parse(JSON.stringify(w0.sandbox.vfs.root));
  clean.children['Network Neighborhood'] = { type: 'special', name: 'Network Neighborhood', icon: 'network', children: { 'ADMIN-PC': { type: 'folder', name: 'ADMIN-PC', children: { SharedDocs: { type: 'folder', name: 'SharedDocs', children: {} } } } } };
  const w3 = makeWorld({ win98_vfs_data: JSON.stringify(clean) });
  w3.load('js/filesystem.js');
  assert.equal(w3.sandbox.vfs.resolvePath(['My Computer', 'C:', 'My Documents', 'Старое сетевое окружение']), null, 'nothing of the player, no folder');
});

check('what the folder shows: no consent, no link, friends, tables', () => {
  const w = makeWorld();
  w.load('js/filesystem.js');
  const S = w.sandbox.Net98Shell, n = w.sandbox.Net98;
  assert.equal(w.sockets.length, 0);
  assert.deepEqual(Object.keys(S.children()), ['Подключить Эфирную связь'], 'without consent: one icon');
  assert.equal(w.sockets.length, 0, 'the folder opens no socket');
  assert.equal(S.children()['Подключить Эфирную связь'].netAct, 'connect');
  n.account().consent = true;
  n.state = 'offline';
  const off = S.children();
  assert.deepEqual(Object.keys(off), ['ADMIN-PC', 'Сеть недоступна'], 'no link: my computer and the message');
  assert.match(off['Сеть недоступна'].comment, /Удалённый доступ/);
  assert.match(S.note(), /Сеть недоступна/);
  n.state = 'off';
  n.account().consent = false;
  w.store.set('win98_net_compname', 'my <b>pc</b>');
  const sock = online(w, [
    friend('711111111', 'Kaia', { status: { c: 'hd', w: 7 } }),
    friend('722222222', 'Kaia', { status: { c: 'battle' } }),
    friend('733333333', '<img src=x onerror=alert(1)>', { status: { c: '<script>' } }),
    friend('744444444', 'Off Line', { on: false })
  ]);
  sock.hear({ op: 'tables', list: [
    { code: 'KXQ7', host: 'Kaia', hostUid: '711111111', diff: 'hard', seats: 2, sim: 'x', ver: '1.7' },
    { code: 'A"B<', host: 'Bad', hostUid: '9', diff: 'easy', seats: 1, sim: 'x', ver: '1.7' },
    { code: 'ZZZ9', host: 'Finn & "Co" <b>', hostUid: '9', diff: 'easy', seats: 1, sim: 'x', ver: '1.7' }
  ] });
  const kids = S.children();
  const keys = Object.keys(kids);
  assert.ok(keys.includes('MY-B-PC-B'), 'my computer has a clean name: ' + keys.join());
  assert.match(kids['MY-B-PC-B'].comment, /UID 7\d{8}\. Этот компьютер/);
  const mine = kids['MY-B-PC-B'].children;
  assert.deepEqual(Object.keys(mine), ['Мой профиль', 'Друзья', 'Как добавить друзей.txt']);
  assert.ok(mine['Как добавить друзей.txt'].content.includes(n.uid()), 'the text holds my UID');
  assert.ok(keys.includes('KAIA'), 'a friend is a computer');
  assert.equal(kids.KAIA.comment, 'UID 711111111. Рубеж Экспресса, волна 7');
  assert.ok(keys.includes('KAIA-722222222'), 'one name twice gets the UID');
  assert.ok(!keys.some(k => k.includes('OFF')), 'someone offline is not seen');
  const evil = keys.find(k => k.includes('IMG'));
  assert.ok(evil && /^[0-9A-ZА-ЯЁ_-]+$/.test(evil), 'a name cannot carry markup: ' + evil);
  assert.ok(!kids[evil].comment.includes('<'), 'nor a status');
  assert.deepEqual(Object.keys(kids.KAIA.children), ['Профиль', 'Экспресс', 'Рубеж'], 'a friend at a table has the shortcut');
  assert.deepEqual(Object.keys(kids['KAIA-722222222'].children), ['Профиль', 'Экспресс']);
  const tables = kids['Столы Рубежа'].children;
  assert.deepEqual(Object.keys(tables), ['Стол KXQ7 (KAIA)', 'Стол ZZZ9 (FINN-CO-B)'], 'a broken code is dropped');
  assert.equal(tables['Стол KXQ7 (KAIA)'].comment, 'Хозяин: Kaia. Сложность: Тяжёлая. Мест занято: 2 из 4.');
  assert.ok(!tables['Стол ZZZ9 (FINN-CO-B)'].comment.includes('<b>') && tables['Стол ZZZ9 (FINN-CO-B)'].comment.includes('&lt;b&gt;'), 'a foreign name is escaped');
  w.sandbox.i18n.setLanguage && w.sandbox.i18n.setLanguage('en');
  if (w.sandbox.i18n.getLanguage() === 'en') {
    const en = S.children();
    assert.ok(Object.keys(en).includes('Frontier Tables'), 'the shell speaks English');
    assert.equal(en.KAIA.comment, 'UID 711111111. Express Frontier, wave 7');
    w.sandbox.i18n.setLanguage('ru');
  }
  const printA = S.fingerprint();
  sock.hear({ op: 'presence', uid: '711111111', on: false, status: null, ago: 5 });
  assert.notEqual(S.fingerprint(), printA, 'a friend leaving changes the folder');
  assert.ok(!JSON.stringify(S.children()).includes('UID 711111111'), 'and the computer disappears');
  assert.match(S.children().KAIA.comment, /722222222/, 'the other one takes the plain name');
});

check('events: the shell hears changes of the link', () => {
  const w = makeWorld();
  let heard = 0;
  w.sandbox.addEventListener('net98-changed', () => { heard++; });
  const sock = online(w, []);
  const after = heard;
  assert.ok(after >= 2, 'online and the friend list');
  sock.hear({ op: 'row', row: friend('711111111', 'Kaia') });
  sock.hear({ op: 'tables', list: [] });
  assert.equal(heard, after + 2);
  sock.hear({ op: 't', n: 5 });
  assert.equal(heard, after + 2, 'turns of a game stay quiet');
  sock.drop();
  assert.equal(heard, after + 3);
  assert.ok(w.sandbox.Net98.bytesSent > 0 && w.sandbox.Net98.bytesRecv > 0, 'real bytes are counted');
});

check('shortcuts: the game first, Steam when it is not installed', () => {
  const w = makeWorld();
  const S = w.sandbox.Net98Shell, calls = [];
  online(w, [friend('711111111', 'Kaia')]);
  let installed = false;
  const ui = {
    mode: 'field', game: { state: { flags: { express_intro: true } } },
    latestSlot: () => 'auto', loadGame: () => true,
    openProfile: () => calls.push('profile'), openFriends: t => calls.push('friends' + t), openFriendProfile: r => calls.push('card' + r.uid), visitGo: r => calls.push('visit' + r.uid), netInviteAccept: i => calls.push('table' + i.code)
  };
  w.sandbox.gameManager = { isInstalled: id => { calls.push('asked ' + id); return installed; }, showInSteam: id => calls.push('steam ' + id) };
  w.sandbox.appHsr98 = { ui: null, open() { calls.push('open'); this.ui = ui; } };
  S.run({ netAct: 'friends' });
  assert.deepEqual(calls.splice(0), ['asked hsr98', 'steam hsr98'], 'not installed: Steam');
  installed = true;
  S.run({ netAct: 'friends' });
  assert.deepEqual(calls.splice(0), ['asked hsr98', 'open', 'friends0']);
  S.run({ netAct: 'myProfile' });
  assert.equal(calls.splice(0).pop(), 'profile');
  S.run({ netAct: 'friendProfile', uid: '711111111' });
  assert.equal(calls.splice(0).pop(), 'card711111111');
  S.run({ netAct: 'visit', uid: '711111111' });
  assert.equal(calls.splice(0).pop(), 'visit711111111');
  S.run({ netAct: 'visit', uid: '799999999' });
  assert.deepEqual(calls.splice(0), [], 'a friend who is gone: nothing');
  S.run({ netAct: 'table', code: 'KXQ7', sim: 'x' });
  assert.equal(calls.splice(0).pop(), 'tableKXQ7');
  w.sandbox.Hsr98 = { HD: { SIM: 'y' } };
  S.run({ netAct: 'table', code: 'KXQ7', sim: 'x' });
  assert.deepEqual(calls.splice(0), [], 'another version does not start');
  assert.match(w.dialogs.pop().message, /другая версия/);
  ui.mode = 'title';
  ui.loadGame = () => false;
  S.run({ netAct: 'friends' });
  assert.equal(calls.splice(0).includes('friends0'), false, 'no save, no screen');
  assert.match(w.dialogs.pop().message, /Сначала начните/);
  ui.loadGame = slot => { calls.push('load ' + slot); ui.mode = 'field'; return true; };
  S.run({ netAct: 'friends' });
  assert.deepEqual(calls.splice(0), ['asked hsr98', 'open', 'load auto', 'friends0'], 'from the title the last save loads');
});

check('the tray: invitations while the game is closed, and the desktop status', () => {
  const w = makeWorld();
  const S = w.sandbox.Net98Shell, n = w.sandbox.Net98, tray = element();
  w.sandbox.taskbar = { trayEl: tray, clockEl: element() };
  const sock = online(w, []);
  S.tick();
  assert.deepEqual(sock.sent.filter(m => m.op === 'status').pop(), { op: 'status', s: { c: 'desk' } }, 'friends see the desktop');
  const count = sock.sent.filter(m => m.op === 'status').length;
  S.tick();
  assert.equal(sock.sent.filter(m => m.op === 'status').length, count, 'once');
  assert.equal(tray.children.length, 0);
  sock.hear({ op: 'invite', from: '711111111', name: 'Kaia', avatar: null, gender: 'f', kind: 'table', code: 'KXQ7', diff: 'normal' });
  assert.equal(tray.children.length, 1, 'an invitation shows in the tray');
  const icon = tray.children[0];
  assert.equal(icon.title, 'Kaia зовёт: Рубеж Экспресса');
  const calls = [];
  w.sandbox.gameManager = { isInstalled: () => true, showInSteam: noop };
  w.sandbox.appHsr98 = { ui: null, open() { this.ui = { mode: 'field', game: {}, netInviteAccept: i => calls.push(i.code) }; } };
  icon.listeners.click();
  assert.deepEqual(calls, ['KXQ7'], 'a click opens the game on the table');
  assert.ok(icon.removed);
  w.sandbox.appHsr98.ui = {};
  n.invites = [{ at: Date.now(), kind: 'visit', from: '7', name: 'Mio' }];
  S.tick();
  assert.equal(tray.children.length, 1, 'with the game open the game shows it');
  w.sandbox.appHsr98.ui = null;
  S.tick();
  assert.equal(tray.children[1].title, 'Mio зовёт в гости');
  n.invites = [];
  S.tick();
  assert.ok(tray.children[1].removed, 'a late invitation goes');
  assert.deepEqual(sock.sent.filter(m => m.op === 'status').pop(), { op: 'status', s: { c: 'desk' } });
});

check('the modem: the real provider, its fields, consent, dialing and a silent server', () => {
  const w = makeWorld();
  w.load('js/apps/dialup.js');
  const D = w.sandbox.appDialUp, n = w.sandbox.Net98;
  assert.equal(D.providers.length, 5);
  assert.equal(D.providers[0].id, 'mtu', 'the old ones stay first');
  assert.equal(D.provider().id, 'mtu', 'without consent the old default');
  const ether = D.providers[4];
  assert.deepEqual([ether.id, ether.phone, ether.real], ['ether', '098-0098', true]);
  assert.match(ether.name, /pennygachi\.men/);

  D.open();
  const win = w.windows.get('app_dialup');
  assert.ok(win);
  const field = id => win.element.querySelector(id);
  assert.equal(field('#dialup-user-input').value, 'alexey_98');
  D.selectEther();
  assert.equal(field('#dialup-user-input').value, n.uid(), 'the user name is the UID');
  assert.equal(field('#dialup-user-input').readOnly, true);
  assert.equal(field('#dialup-pass-input').value, '', 'the secret never reaches the field');
  assert.equal(field('#dialup-pass-input').disabled, true);
  assert.equal(field('#dialup-phone-input').value, '098-0098');
  assert.equal(field('#dialup-phone-input').readOnly, true);
  field('#dialup-provider-select').listeners.change({ target: { value: '1' } });
  assert.equal(field('#dialup-user-input').value, 'alexey_98');
  assert.equal(field('#dialup-pass-input').disabled, false);
  assert.ok(!JSON.stringify(field('#dialup-pass-input').value).includes(n.account().secret));
  D.selectEther();

  field('#btn-dialup-connect').listeners.click();
  assert.equal(w.sockets.length, 0, 'no socket before consent');
  const consent = w.dialogs.pop();
  assert.equal(consent.buttons[1].primary, true, 'the default answer is «not now»');
  const game = read('js/apps/hsr98/hsr-ui-net.js'), lines = game.slice(game.indexOf('const CONSENT = ['), game.indexOf('];', game.indexOf('const CONSENT = ['))).match(/'[^']+'/g).map(s => s.slice(1, -1));
  assert.equal(consent.message, lines.join('<br><br>'), 'the consent text is the same as in the game');
  assert.equal(w.sandbox.i18n.t('net98.agree'), 'Подключиться');
  assert.equal(n.hasConsent(), false);
  consent.buttons[0].onClick();
  assert.equal(n.hasConsent(), true);
  assert.equal(w.sockets.length, 1, 'consent starts the link');
  assert.equal(D.state, 'dialing');
  w.tick(2600);
  assert.equal(D.state, 'dialing', 'the server is silent: still waiting');
  assert.notEqual(w.windows.has('app_dialup_status'), true);
  w.tick(9000);
  w.tick(2000);
  assert.equal(D.state, 'disconnected', 'after 10 s it gives up');
  assert.match(field('#dialup-status-msg').textContent, /Линия занята/);
  assert.equal(field('#btn-dialup-connect').disabled, false, 'and allows another try');
  assert.equal(w.windows.has('app_dialup_status'), false, 'no connection is reported');

  field('#btn-dialup-connect').listeners.click();
  const sock = w.sockets[w.sockets.length - 1];
  sock.open();
  sock.hear({ op: 'me', uid: n.uid(), table: null });
  sock.hear(snapshot([friend('711111111', 'Kaia'), friend('722222222', 'Mio', { on: false })]));
  n.rtt = 84;
  w.tick(2600);
  assert.equal(D.state, 'connected', 'a real answer connects');
  w.tick(1000);
  const status = w.windows.get('app_dialup_status');
  assert.ok(status, 'the status window opens');
  const html = status.o.content.innerHTML;
  assert.ok(html.includes('на связи, 84 мс') && html.includes(n.uid()) && html.includes('btn-dialup-network'), 'real numbers and the network button');
  assert.ok(!/бит\/с/.test(html), 'no invented speed');
  D.updateStatusDom();
  assert.equal(status.element.querySelector('#dialup-stat-friends').textContent, '1', 'friends online');
  const calls = [];
  w.sandbox.appExplorer = { open: p => calls.push(p.join()) };
  status.element.querySelector('#btn-dialup-network').listeners.click();
  assert.deepEqual(calls, ['Network Neighborhood']);
  assert.match(D.trayTitle(D.provider()), /на связи, 84 мс/);

  const sockN = w.sockets.length;
  status.element.querySelector('#btn-dialup-disconnect').listeners.click();
  assert.equal(w.sandbox.isOnline, false);
  assert.equal(n.state, 'modem', 'the modem switches the link off');
  assert.equal(sock.readyState, 3);
  assert.equal(w.sockets.length, sockN);
  D.finishConnection();
  assert.equal(w.sockets.length, sockN + 1, 'and back on');

  n.disconnect('off');
  w.sandbox.isOnline = false;
  D.isOnline = false;
  D.open();
  const win2 = w.windows.get('app_dialup');
  D.startDialingProcess(win2);
  assert.equal(w.sandbox.isOnline, true, 'dialing lifts the switch for the try');
  w.tick(2600);
  w.tick(10500);
  assert.equal(w.sandbox.isOnline, false, 'a failed try puts it back');
  assert.equal(n.state, 'modem');
});

check('the modem: other providers keep the link and say so; consent selects the real one', () => {
  const stored = { 'net98.account': JSON.stringify({ uid: '712345678', secret: 'ABCDEFGHJKMNPQRS', consent: true, auto: false, confirmed: true }) };
  const w = makeWorld(stored);
  w.load('js/apps/dialup.js');
  const D = w.sandbox.appDialUp, n = w.sandbox.Net98;
  assert.equal(D.provider().id, 'ether', 'after consent the modem starts on the real provider');
  D.selectedProviderIndex = 0;
  n.state = 'online';
  n.rtt = 90;
  D.openStatus();
  const html = w.windows.get('app_dialup_status').o.content.innerHTML;
  assert.ok(html.includes('бит/с') && html.includes('Эфирная связь:') && html.includes('на связи, 90 мс'), 'its own speed and the real line');
  assert.ok(!html.includes('btn-dialup-network'));
  n.state = 'offline';
  assert.equal(D.etherLine(), 'нет связи');
  const w2 = makeWorld();
  w2.load('js/apps/dialup.js');
  assert.equal(w2.sandbox.appDialUp.etherLine(), 'выключена');
});

check('texts: the invented network is gone', () => {
  for (const f of ['js/apps/dialogs.js', 'js/apps/clippy-system.js', 'js/desktop.js', 'js/i18n.js', 'js/filesystem.js']) {
    const text = read(f).replace(/const OLD_NETWORK_FILES = .*\n/, '');
    assert.ok(!/FILESERVER|MISHA-PC|LAN_PARTY|retro computers/.test(text), f);
  }
  assert.ok(/Гений.*шахмат/.test(read('js/apps/clippy-system.js')), 'the chess joke stays');
  const html = read('index.html');
  assert.ok(html.indexOf('js/net98.js') < html.indexOf('js/net98-shell.js') && html.indexOf('js/filesystem.js') < html.indexOf('js/net98-shell.js'), 'scripts in order');
  for (const f of ['js/net98-shell.js', 'js/apps/dialup.js', 'js/net98.js']) {
    const code = read(f);
    assert.ok(!/^\s*\/\//m.test(code) && !/\/\*/.test(code), f + ' has no comments');
  }
});

console.log('All network shell tests passed');
process.exit(0);
