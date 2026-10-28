const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const { createBugHandler, ID_PATTERN, FILE_NAMES } = require('../js/bugreport-local');

console.log('--- Testing bug reports (core + local receiver) ---');

delete process.env.WIN98_BUGS_DIR;

function startServer(root) {
  const handle = createBugHandler(root);
  const server = http.createServer((req, res) => {
    if (handle(req, res)) return;
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function loadCore(port) {
  const listeners = {};
  const printed = [];
  const fakeConsole = {
    log: (...a) => printed.push(['log', a]),
    info: (...a) => printed.push(['info', a]),
    warn: (...a) => printed.push(['warn', a]),
    error: (...a) => printed.push(['error', a])
  };
  const winEl = { id: 'app_notepad', style: { zIndex: '12' }, getBoundingClientRect: () => ({ left: 10, top: 20, width: 300, height: 200 }) };
  const winManager = {
    activeWindowId: 'app_notepad',
    windows: new Map([['app_notepad', { id: 'app_notepad', title: 'Блокнот - list.txt', element: winEl, isMinimized: false, isMaximized: true }]]),
    createWindow(opts) { const w = { id: opts.id, title: opts.title, element: { id: opts.id, style: {} } }; this.windows.set(opts.id, w); this.bringToTop(opts.id); return w; },
    closeWindow(id) { this.windows.delete(id); },
    minimizeWindow() {},
    toggleMaximize() {},
    bringToTop(id) { this.activeWindowId = id; }
  };
  const storage = new Map([['hsr98.save.1', 'x'.repeat(1024)]]);
  const ctx = {
    console: fakeConsole,
    Error, TypeError, Uint8Array, ArrayBuffer, Promise, JSON, Date, Map, Math, Object, Array, String, Number,
    btoa, crypto: globalThis.crypto,
    location: { protocol: 'http:', origin: 'http://127.0.0.1:' + port },
    navigator: { userAgent: 'Mozilla/5.0 Test', language: 'ru-RU' },
    screen: { width: 1920, height: 1080 },
    innerWidth: 1280, innerHeight: 960, devicePixelRatio: 1,
    performance: { memory: { usedJSHeapSize: 300 * 1048576 } },
    localStorage: { get length() { return storage.size; }, key: i => [...storage.keys()][i], getItem: k => storage.get(k) },
    document: { createElement: () => ({ getContext: () => null }) },
    i18n: { getLanguage: () => 'ru' },
    winManager,
    addEventListener: (type, fn) => { (listeners[type] = listeners[type] || []).push(fn); },
    dispatchEvent: e => { (listeners[e.type] || []).forEach(fn => fn(e)); return true; },
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
    fetch: (url, opts) => fetch(/^https?:/.test(url) ? url : 'http://127.0.0.1:' + port + '/' + String(url).replace(/^\//, ''), opts)
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'bugreport-core.js'), 'utf8'), ctx, { filename: 'bugreport-core.js' });
  const fire = (type, event) => (listeners[type] || []).forEach(fn => fn(event));
  return { ctx, fire, printed, winManager };
}

const field = (tagName, type) => ({ tagName, type, closest: () => null });

(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'win98-bugs-'));
  fs.mkdirSync(path.join(root, 'bugreports'));
  const server = await startServer(root);
  const port = server.address().port;
  const base = 'http://127.0.0.1:' + port;

  try {
    const { ctx, fire, printed, winManager } = loadCore(port);
    const { BugReport, BugTrace } = ctx;
    const crashes = [];
    ctx.addEventListener('bugreport-crash', e => crashes.push(JSON.parse(JSON.stringify(e.detail))));

    for (let i = 0; i < 50; i++) assert.match(BugReport.newId(new Date(2026, 9, 27)), /^BR-261027-[0-9A-HJKMNP-TV-Z]{4}$/);
    assert.ok(ID_PATTERN.test(BugReport.newId()), 'client ids match the server pattern');
    console.log('✓ report ids');

    ctx.console.error('boom', { a: 1, b: 2 });
    ctx.console.log('plain', [1, 2, 3]);
    assert.equal(printed.length, 2, 'original console methods still print');
    for (let i = 0; i < 3; i++) fire('error', { target: ctx, message: 'TypeError: x is undefined', filename: base + '/js/apps/hsr98/hsr-cine.js', lineno: 211, colno: 17, error: { stack: 'TypeError: x is undefined\n  at play' } });
    fire('error', { target: { tagName: 'IMG', src: base + '/content/missing.png' } });
    fire('unhandledrejection', { reason: new Error('lost promise') });
    assert.deepEqual(crashes.map(c => [c.msg, !!c.caught]), [['TypeError: x is undefined', false], ['Unhandled rejection: lost promise', false]], 'uncaught errors signal a crash once');
    console.log('✓ console, errors and missing files are traced');

    fire('keydown', { key: 'a', code: 'KeyA', target: field('INPUT', 'text') });
    fire('keydown', { key: 'b', code: 'KeyB', target: field('INPUT', 'text') });
    fire('keydown', { key: 's', code: 'KeyS', target: field('INPUT', 'password') });
    fire('keydown', { key: 'Enter', code: 'Enter', target: field('TEXTAREA') });
    fire('keydown', { key: 'Control', code: 'ControlLeft', ctrlKey: true, target: field('BODY') });
    fire('keydown', { key: 'F10', code: 'F10', ctrlKey: true, target: field('BODY') });
    fire('keydown', { key: 'F10', code: 'F10', repeat: true, target: field('BODY') });
    fire('pointerdown', { target: { tagName: 'BUTTON', className: 'win-btn primary', textContent: '  Сохранить  ', closest: sel => (sel === '.win-window' ? null : { tagName: 'BUTTON', textContent: '  Сохранить  ' }) }, clientX: 40.4, clientY: 50.6 });
    fire('pointerdown', { target: { tagName: 'TEXTAREA', closest: () => null }, clientX: 1, clientY: 1 });
    BugTrace.hookShell();
    BugTrace.hookShell();
    winManager.createWindow({ id: 'app_ie', title: 'Internet Explorer' });
    winManager.bringToTop('app_ie');
    winManager.bringToTop('app_ie');
    winManager.closeWindow('app_ie');
    winManager.bringToTop('app_notepad');
    BugTrace.note('battle end: win', { mode: 'battle' });

    const plainCopy = value => JSON.parse(JSON.stringify(value));
    const report = plainCopy(await BugReport.build({ user: { title: '  Пропал диалог  ', text: 'после боя', kind: 'nonsense', repeat: 'always' }, apps: { demo: { ok: 1 } } }));
    assert.equal(report.format, 'win98-bugreport');
    assert.equal(report.v, 1);
    assert.match(report.id, ID_PATTERN);
    assert.equal(report.source, 'win98');
    assert.equal(report.channel, 'browser-dev', 'a page served with a local receiver is the dev channel');
    assert.equal(report.build.dev, true);
    assert.ok(!report.build.commit || /^[0-9a-f]{7,}$/.test(report.build.commit), 'dev build info comes from git when the root is a repo');
    assert.deepEqual(report.user, { title: 'Пропал диалог', text: 'после боя', kind: 'bug', repeat: 'always', contact: '' });
    assert.deepEqual(report.where, { summary: 'Блокнот - list.txt', window: 'app_notepad', app: 'app_notepad' });
    assert.equal(report.system.lang, 'ru');
    assert.equal(report.system.heapMB, 300);
    assert.equal(report.system.storageKB, 2);
    assert.deepEqual(report.windows.map(w => [w.id, w.active, w.max, w.rect]), [['app_notepad', true, true, [10, 20, 300, 200]]]);
    assert.deepEqual(report.apps, { demo: { ok: 1 } });

    assert.equal(report.errors.length, 2);
    assert.deepEqual([report.errors[0].msg, report.errors[0].src, report.errors[0].count], ['TypeError: x is undefined', 'js/apps/hsr98/hsr-cine.js:211:17', 3]);
    assert.equal(report.errors[1].msg, 'Unhandled rejection: lost promise');
    assert.deepEqual(report.missing.map(m => [m.tag, m.url]), [['img', 'content/missing.png']]);
    assert.deepEqual(report.log.map(l => [l.level, l.msg]), [['error', 'boom {a, b}'], ['log', 'plain [Array(3)]']]);

    const trail = report.trail.map(e => [e.type, e.code || e.el || e.win || e.msg]);
    assert.deepEqual(trail, [
      ['typing', 'app_notepad'],
      ['key', 'Enter'],
      ['key', 'Ctrl+F10'],
      ['click', 'button.win-btn.primary "Сохранить"'],
      ['click', 'textarea'],
      ['open', 'app_ie'],
      ['close', 'app_ie'],
      ['focus', 'app_notepad'],
      ['app', 'battle end: win']
    ]);
    assert.ok(report.trail.every(e => !('at' in e)), 'internal timestamps are dropped');
    assert.ok(!JSON.stringify(report.trail).includes('KeyA') && !JSON.stringify(report.trail).includes('KeyS'), 'typed characters never reach the report');
    assert.deepEqual([report.trail[3].win, report.trail[3].x, report.trail[3].y], ['', 40, 51], 'clicks outside windows are not given to the active window');
    assert.equal(report.trail[8].mode, 'battle');
    for (let i = 0; i < 4; i++) ctx.console.error(new Error('frame loop broke'));
    assert.equal(crashes.length, 3, 'an error caught and logged three times counts as a crash once');
    assert.deepEqual([crashes[2].msg, crashes[2].caught, crashes[2].count], ['Error: frame loop broke', true, 3]);
    console.log('✓ report content, trail without typed text');

    const packed = await BugReport.pack(report, { 'shot.png': new Uint8Array([1, 2, 3]), 'save.json.gz': null });
    assert.deepEqual(Object.keys(packed.files), ['shot.png']);
    assert.equal(packed.files['shot.png'], 'AQID');
    assert.equal(packed.format, 'win98-bugreport-file');

    const sent = plainCopy(await BugReport.send(report, { 'shot.png': new Uint8Array([137, 80, 78, 71]) }));
    assert.deepEqual(sent, { id: report.id, local: true });
    const dir = path.join(root, 'bugreports', report.id);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'report.json'), 'utf8')), report);
    assert.deepEqual([...fs.readFileSync(path.join(dir, 'shot.png'))], [137, 80, 78, 71]);
    await assert.rejects(BugReport.send(report, {}), err => err.status === 409 && err.message === 'duplicate id');
    const repro = await (await fetch(base + '/api/bugs/repro/' + report.id)).json();
    assert.deepEqual([repro.ok, repro.report.id, repro.report.where.window, repro.save], [true, report.id, 'app_notepad', null]);
    fs.writeFileSync(path.join(dir, 'save.json.gz'), Buffer.from([31, 139, 8]));
    assert.equal((await (await fetch(base + '/api/bugs/repro/' + report.id)).json()).save, Buffer.from([31, 139, 8]).toString('base64'));
    assert.equal((await fetch(base + '/api/bugs/repro/BR-261027-ZZZZ')).status, 404);
    assert.equal((await fetch(base + '/api/bugs/repro/..%2F..%2Fpackage.json')).status, 404);
    console.log('✓ send() stores the report in bugreports/<id>/, repro data is served back');

    const post = body => fetch(base + '/api/bugs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) }).then(async r => [r.status, await r.json()]);
    const good = id => ({ format: 'win98-bugreport-file', v: 1, report: { format: 'win98-bugreport', v: 1, id }, files: {} });
    assert.deepEqual(await post('{oops'), [400, { ok: false, error: 'bad json' }]);
    assert.deepEqual(await post(good('BR-261027-ILOU')), [400, { ok: false, error: 'bad report id' }]);
    assert.deepEqual(await post(good('../../etc')), [400, { ok: false, error: 'bad report id' }]);
    assert.deepEqual(await post({ ...good('BR-261027-AAAA'), files: { 'evil.html': 'AA==' } }), [400, { ok: false, error: 'unexpected file evil.html' }]);
    assert.deepEqual(await post({ ...good('BR-261027-AAAA'), files: { 'shot.png': '<script>' } }), [400, { ok: false, error: 'bad file data shot.png' }]);
    assert.deepEqual(await post({ ...good('BR-261027-AAAA'), report: { format: 'other', v: 1, id: 'BR-261027-AAAA' } }), [400, { ok: false, error: 'bad report format' }]);
    assert.equal((await post('x'.repeat(11 * 1024 * 1024).replace(/^x/, '{')))[0], 413);
    assert.deepEqual(await post(good('BR-261027-AAAA')), [200, { ok: true, id: 'BR-261027-AAAA', local: true }]);
    assert.ok(fs.existsSync(path.join(root, 'bugreports', 'BR-261027-AAAA', 'report.json')));
    console.log('✓ receiver validates input');

    const ping = await fetch(base + '/api/bugs/ping');
    assert.equal(ping.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await ping.json(), { ok: true, v: 1, local: true });
    assert.deepEqual(await (await fetch(base + '/build.json')).json(), { dev: true, version: 'dev' }, 'non-git root gives dev build info only');
    fs.writeFileSync(path.join(root, 'build.json'), '{}');
    assert.equal((await fetch(base + '/build.json')).status, 404, 'a real build.json is left to the static server');
    console.log('✓ ping and build.json');
  } finally {
    server.close();
  }

  const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'win98-nobugs-'));
  const plain = await startServer(bare);
  try {
    const r = await fetch('http://127.0.0.1:' + plain.address().port + '/api/bugs/ping');
    assert.equal(r.status, 404, 'without bugreports/ the local receiver is off');
    const { ctx } = loadCore(plain.address().port);
    assert.equal(await ctx.BugReport.hasLocalSink(), false);
    assert.equal((await ctx.BugReport.build({})).channel, 'browser');
    console.log('✓ players\' builds have no local receiver');
  } finally {
    plain.close();
  }

  const repoBuild = createBugHandler(path.join(__dirname, '..'));
  const repoServer = await new Promise(resolve => { const s = http.createServer((req, res) => { if (!repoBuild(req, res)) { res.writeHead(404); res.end(); } }); s.listen(0, '127.0.0.1', () => resolve(s)); });
  try {
    const info = await (await fetch('http://127.0.0.1:' + repoServer.address().port + '/build.json')).json();
    if (!fs.existsSync(path.join(__dirname, '..', 'build.json'))) {
      assert.match(info.commit, /^[0-9a-f]{7,}$/);
      assert.match(info.date, /^\d{4}-\d{2}-\d{2}$/);
    }
    console.log('✓ build.json from git in the repo');
  } finally {
    repoServer.close();
  }

  {
    const storage = new Map();
    const listeners = [];
    const classes = new Set(['open']);
    const win = {
      addEventListener: t => listeners.push(t),
      localStorage: { getItem: k => (storage.has(k) ? storage.get(k) : null), setItem: (k, v) => storage.set(k, String(v)), get length() { return storage.size; }, key: i => [...storage.keys()][i] },
      i18n: { getLanguage: () => 'ru' },
      gameManager: { catalog: { mc98_demo: { title: 'Minecraft 98 Demo', cdDemo: true }, hsr98: { title: 'Honkai: Star Rail 98', steam: true } }, isInstalled: id => id === 'hsr98' },
      appExplorer: { currentPath: ['My Computer', 'C:', 'WINDOWS'] },
      appIE: { currentUrl: 'http://www.search98.com' },
      taskbar: { startMenu: { classList: { contains: c => classes.has(c) } } },
      document: { pointerLockElement: null, fullscreenElement: null, getElementById: () => null },
      winManager: { activeWindowId: '', windows: new Map([
        ['app_explorer', { id: 'app_explorer', title: 'WINDOWS', element: { querySelectorAll: () => [] } }],
        ['app_mc98', { id: 'app_mc98', title: 'Minecraft 98 Demo', element: { querySelectorAll: () => [{ width: 800, height: 600 }, { width: 0, height: 0 }] } }],
        ['app_hsr98', { id: 'app_hsr98', title: 'Honkai: Star Rail 98', element: { querySelectorAll: () => [] } }]
      ]) }
    };
    const bctx = Object.assign({ console, JSON, Date, Map, Set, Array, Object, String, Number, Math, setTimeout, Icons: {} }, win);
    bctx.window = bctx;
    vm.createContext(bctx);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'apps', 'backup-catalog.js'), 'utf8'), bctx, { filename: 'backup-catalog.js' });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'apps', 'bugreport-where.js'), 'utf8'), bctx, { filename: 'bugreport-where.js' });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'apps', 'bugreport.js'), 'utf8'), bctx, { filename: 'bugreport.js' });
    const where = bctx.BugWhere;
    const app = bctx.appBugReport;

    const key = (k, mods) => Object.assign({ key: k, repeat: false, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false }, mods || {});
    assert.equal(app.hotkeyAction(key('F10'), '', false), 'open');
    assert.equal(app.hotkeyAction(key('F10'), 'app_ie', false), 'open');
    assert.equal(app.hotkeyAction(key('F10'), 'app_fallout', false), null, 'Fallout keeps its F10');
    assert.equal(app.hotkeyAction(key('F10'), 'app_anotherwar', false), null, 'Another War keeps its F10');
    assert.equal(app.hotkeyAction(key('F10', { ctrlKey: true }), 'app_fallout', false), 'open', 'Ctrl+F10 works everywhere');
    assert.equal(app.hotkeyAction(key('F10', { ctrlKey: true }), '', true), null, 'nothing during POST, BIOS Setup or boot');
    assert.equal(app.hotkeyAction(key('F10', { shiftKey: true }), '', false), null);
    assert.equal(app.hotkeyAction(key('F10', { repeat: true }), '', false), null);
    assert.equal(app.hotkeyAction(key('F9'), '', false), null);
    assert.ok(listeners.includes('keydown'), 'the hotkey listener is installed');
    console.log('✓ F10 / Ctrl+F10 rules');

    const plain = v => JSON.parse(JSON.stringify(v));
    assert.deepEqual(plain(where.describe('')), { summary: 'Рабочий стол, открыто меню «Пуск»', window: '', app: 'desktop', details: { startMenu: true } });
    classes.clear();
    assert.equal(where.describe('').summary, 'Рабочий стол');
    assert.deepEqual(plain(where.describe('app_explorer')), { summary: 'Проводник: My Computer\\C:\\WINDOWS', window: 'app_explorer', app: 'app_explorer', details: { path: 'My Computer\\C:\\WINDOWS' } });
    const mc = plain(where.describe('app_mc98'));
    assert.equal(mc.app, 'mc98_demo');
    assert.deepEqual(mc.details.game, { id: 'mc98_demo', base: 'mc98', title: 'Minecraft 98 Demo', installed: false, source: 'cd' });
    assert.deepEqual(mc.details.canvases, [[800, 600]]);
    bctx.hsrui = { mode: 'field', screens: [{ name: 'menu' }] };
    assert.equal(where.describe('app_hsr98').summary, 'Honkai: Star Rail 98 > field > menu');
    bctx.hsrui.bugInfo = () => ({ summary: 'HSR > Ярило-VI', details: { map: 'belobog' }, state: { tl: 30 } });
    const hsr = plain(where.describe('app_hsr98'));
    assert.deepEqual([hsr.summary, hsr.app, hsr.details.map, hsr.state.tl, hsr.details.game.source], ['HSR > Ярило-VI', 'hsr98', 'belobog', 30, 'steam']);
    assert.equal(where.saveComponent('app_mc98').id, 'game_mc98');
    assert.equal(where.saveComponent('app_hsr98').id, 'game_hsr98');
    assert.equal(where.saveComponent('app_explorer'), null, 'system windows have no save data');
    console.log('✓ where adapters and save components');

    assert.deepEqual(plain(app.readSent()), []);
    app.writeSent([{ id: 'BR-261027-AAAA', status: 'fixed', seen: 'received', fixedIn: '1.7' }, { id: 'BR-261027-BBBB', status: 'local', seen: 'local' }]);
    assert.equal(app.unseenCount(), 1);
    assert.equal(app.statusText({ status: 'fixed', fixedIn: '1.7' }), 'Исправлен в версии 1.7');
    assert.equal(app.statusText({ status: 'duplicate' }), 'Уже известен');
    assert.equal(app.statusText({ status: 'received' }), 'Получен');
    storage.set('win98.bugs.sent', '{broken');
    assert.deepEqual(plain(app.readSent()), [], 'a broken list does not break the window');
    app.writeSent(Array.from({ length: 70 }, (v, i) => ({ id: 'x' + i })));
    assert.equal(app.readSent().length, 50, 'the list keeps the last 50 reports');
    console.log('✓ my reports list');

    const dialogs = [];
    let muteNext = false;
    bctx.winManager.openDialog = o => { dialogs.push(o); return { element: { querySelector: () => ({ checked: muteNext }) } }; };
    assert.equal(app.programOf('js/apps/hsr98/hsr-ui.js:10:1').id, 'app_hsr98');
    assert.equal(app.programOf('js/apps/mc98-app.js:3:1').id, 'app_mc98');
    assert.deepEqual(plain(app.programOf('js/window-manager.js:1:1')), { key: 'shell', id: '', name: 'Оболочка Win 98' });
    assert.equal(app.onCrash({ msg: 'TypeError: x', src: 'js/apps/hsr98/hsr-ui.js:10:1' }), true);
    assert.equal(dialogs[0].title, 'Honkai: Star Rail 98');
    assert.deepEqual(plain(dialogs[0].buttons.map(b => b.text)), ['Отправить отчёт...', 'Закрыть программу', 'Продолжить'], 'Esc picks the last button, which is Continue');
    assert.match(dialogs[0].message, /выполнила недопустимую операцию/);
    assert.match(dialogs[0].message, /TypeError: x<br>js\/apps\/hsr98\/hsr-ui\.js:10:1/);
    assert.equal(app.onCrash({ msg: 'TypeError: y', src: 'js/apps/hsr98/hsr-ui.js:12:1' }), false, 'one window per program in two minutes');
    assert.equal(app.onCrash({ msg: 'boom', src: 'js/apps/bugreport.js:1:1' }), false, 'errors of the report itself never open the window');
    muteNext = true;
    assert.equal(app.onCrash({ msg: 'boom', src: 'js/apps/mc98/mc-render.js:1:1' }), true);
    dialogs[1].buttons[dialogs[1].buttons.length - 1].onClick();
    assert.deepEqual(JSON.parse(storage.get('win98.bugs.crashMute')), ['mc98']);
    app.crashShown.clear();
    assert.equal(app.onCrash({ msg: 'boom', src: 'js/apps/mc98/mc-render.js:1:1' }), false, 'a muted program stays quiet');
    assert.equal(app.onCrash({ msg: 'boom', src: 'js/window-manager.js:1:1' }), true);
    assert.equal(app.onCrash({ msg: 'boom', src: 'js/apps/explorer.js:1:1' }), false, 'at most three windows per session');
    console.log('✓ illegal operation window: program, throttle, mute, session cap');
  }

  {
    const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    const taskbar = read('js/taskbar.js');
    assert.match(taskbar, /data-action="bugreport"/);
    assert.match(taskbar, /data-action="bugreport-list"/);
    assert.match(taskbar, /case 'bugreport-list':\s*\r?\n\s*if \(window\.appBugReport\) window\.appBugReport\.openList\(\);/);
    const dialogs = read('js/apps/dialogs.js');
    assert.match(dialogs, /cmd === 'bugreport' \|\| cmd === 'bugreport\.exe'/);
    assert.match(dialogs, /glyph\('bugreport'\)/, 'help lists the tool');
    assert.match(dialogs, /Ctrl\+F10/);
    assert.match(read('js/apps/clippy-system.js'), /onAppCrashed\(name\)/, 'Clippy has a crash line');
    assert.match(read('js/apps/bugreport.js'), /window\.clippySystem\.onAppCrashed\(prog\.name\)/, 'the crash window calls Clippy through clippySystem');
    assert.match(read('js/apps/bugreport.js'), /window\.clippySystem\.onAppCrashed\(prog\.name\)/, 'the crash window calls Clippy through clippySystem');
    assert.equal((read('js/filesystem.js').match(/'BUGREPORT\.EXE'/g) || []).length, 5, 'C:\\WINDOWS\\BUGREPORT.EXE for new and old profiles');
    assert.match(read('js/apps/explorer.js'), /item\.name === 'BUGREPORT\.EXE'/);
    assert.match(read('js/icons.js'), /'bugreport': px\(/);
    const indexHtml = read('index.html');
    assert.ok(indexHtml.indexOf('js/apps/bugreport-where.js') < indexHtml.indexOf('js/apps/bugreport.js') && indexHtml.includes('css/apps/bugreport.css'));
    console.log('✓ Start menu, Run, C:\\WINDOWS, help, icon');
  }

  const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const firstScript = index.match(/<script src="([^"]+)"/)[1];
  assert.equal(firstScript, 'js/bugreport-core.js', 'the tracer loads before every other script');
  assert.ok(index.indexOf('js/bugreport-shot.js') > index.indexOf('js/bugreport-core.js'), 'index.html loads the shot module');
  const preload = fs.readFileSync(path.join(__dirname, '..', 'electron', 'preload.js'), 'utf8');
  const main = fs.readFileSync(path.join(__dirname, '..', 'electron', 'main.js'), 'utf8');
  assert.match(preload, /exposeInMainWorld\('win98Native'/);
  assert.match(preload, /invoke\('win98:capture'\)/);
  assert.match(main, /ipcMain\.handle\('win98:capture'/);
  assert.match(main, /isAppUrl\(event\.senderFrame\.url, origin\)/, 'only app pages may capture');
  assert.equal((main.match(/preload: PRELOAD_PATH/g) || []).length, 2, 'main window and app popups get the preload');
  const shot = fs.readFileSync(path.join(__dirname, '..', 'js', 'bugreport-shot.js'), 'utf8');
  for (const name of ['shot', 'shot-marked', 'shot-window']) for (const ext of ['png', 'jpg']) assert.ok(FILE_NAMES.has(name + '.' + ext), name + '.' + ext + ' is accepted');
  assert.match(shot, /requestAnimationFrame/, 'canvases are read inside a frame');
  assert.match(fs.readFileSync(path.join(__dirname, '..', '.gitignore'), 'utf8'), /^bugreports\/$/m);
  assert.ok(require('../tools/release.cjs').EXE_EXCLUDED.some(re => re.test('/bugreports/BR-261027-AAAA/report.json')), 'reports stay out of the exe');
  console.log('✓ wiring');

  console.log('Bug report tests passed.');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
