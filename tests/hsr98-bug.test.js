const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

console.log('--- Testing HSR 98 bug report context ---');

const ROOT = path.join(__dirname, '..');
const noop = () => {};
function makeCanvas(w = 300, h = 150) {
  const cv = { width: w, height: h, style: {}, className: '', addEventListener: noop, getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 480 }), toBlob: cb => cb(new Blob(['PNGDATA'], { type: 'image/png' })), toDataURL: () => 'data:image/jpeg;base64,AA==' };
  const grad = () => ({ addColorStop: noop });
  const ctx = new Proxy({
    canvas: cv, globalAlpha: 1, font: '10px x', fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, imageSmoothingEnabled: true,
    measureText: s => ({ width: String(s).length * 6 }), createPattern: () => ({}), createLinearGradient: grad, createRadialGradient: grad,
    getImageData: (x, y, gw, gh) => ({ data: new Uint8ClampedArray(Math.max(1, gw * gh) * 4), width: gw, height: gh }),
    createImageData: (gw, gh) => ({ data: new Uint8ClampedArray(gw * gh * 4), width: gw, height: gh })
  }, { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => { t[k] = v; return true; } });
  cv.getContext = () => ctx;
  return cv;
}
const store = new Map();
const notes = [];
Object.assign(globalThis, {
  document: { createElement: () => makeCanvas() },
  localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
  requestAnimationFrame: () => 1
});

const html = fs.readFileSync(path.join(ROOT, 'hsr98.html'), 'utf8');
const files = [...html.matchAll(/<script src="(js\/apps\/hsr98\/[^"]+)"><\/script>/g)].map(m => m[1]);
assert.deepEqual(files.slice(-2), ['js/apps/hsr98/hsr-bug.js', 'js/apps/hsr98/hsr-ui-bug.js'], 'the bug report files load after every other HSR script');
assert.ok(html.includes('<script src="js/bugreport-core.js"></script><script src="js/bugreport-shot.js"></script>') && html.indexOf('js/bugreport-core.js') < html.indexOf('js/apps/'), 'hsr98.html loads the report core before the game');
assert.ok(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').includes('<script src="js/apps/hsr98/hsr-bug.js"></script>'), 'the system loads hsr-bug.js too');
{
  const touch = fs.readFileSync(path.join(ROOT, 'tools', 'hsr98-standalone', 'touch.js'), 'utf8');
  assert.ok(touch.includes("F9: 'F9'") && touch.includes("key('F9', 'F9', 'Баг'"), 'the touch panel has the bug key');
  assert.match(fs.readFileSync(path.join(ROOT, 'tools', 'hsr98-standalone', 'android', 'AndroidManifest.xml'), 'utf8'), /android\.permission\.INTERNET/, 'the APK may use the network');
  assert.match(fs.readFileSync(path.join(ROOT, 'tools', 'hsr98-apk.cjs'), 'utf8'), /version === 'dev' \? gameVersion\(\) : version/, 'the APK version comes from Hsr98.VERSION or the release number');
  assert.match(fs.readFileSync(path.join(ROOT, 'tools', 'hsr98-standalone.cjs'), 'utf8'), /window\.Win98Build=/, 'standalone builds carry the commit');
}
require(path.join(ROOT, 'js', 'bugreport-core.js'));
const coreNote = globalThis.BugTrace.note;
globalThis.BugTrace.note = (msg, data) => { notes.push(msg + (data ? ' ' + JSON.stringify(data) : '')); return coreNote(msg, data); };
for (const f of files) require(path.join(ROOT, f));
const H = globalThis.Hsr98;

const root = { classList: { add: noop }, set innerHTML(v) { this.html = v; }, appendChild: noop, addEventListener: noop, removeEventListener: noop, focus: noop };
const ui = new H.UI(root, { onExit: noop });
ui.running = false;
const frame = (n = 1) => { for (let i = 0; i < n; i++) { ui.update(0.05); ui.render(); ui.frame(performance.now()); } };
ui.running = false;
frame();

const title = ui.bugInfo();
assert.equal(title.summary, 'Honkai: Star Rail 98 > титульный экран');
assert.deepEqual([title.state.mode, title.state.version, title.state.edition], ['title', H.VERSION, 'system']);
assert.equal(ui.bugSave(), null, 'nothing to save on the title screen');
console.log('✓ title screen');

ui.newGame();
frame(10);
const field = ui.bugInfo();
const g = ui.game;
assert.equal(field.state.mode, 'field');
assert.equal(field.state.map, g.map.id);
assert.equal(field.state.mapName, g.map.def.name);
assert.deepEqual(field.state.pos.slice(0, 2), [g.player.x, g.player.y]);
assert.ok(field.summary.startsWith('Honkai: Star Rail 98 > ' + g.map.def.name + ' (x ' + g.player.x + ', y ' + g.player.y + ')'), field.summary);
assert.deepEqual(field.state.party.map(p => p.id), g.state.party);
assert.equal(field.state.money.credits, g.state.credits);
assert.equal(field.state.cheats, false);
assert.ok(Array.isArray(field.state.near));
assert.ok(notes.includes('hsr script opening'), 'story scripts are traced');
assert.ok(notes.includes('hsr mode field'), 'mode changes are traced');
if (g.script) {
  assert.equal(field.state.script.name, g.script.name);
  assert.match(field.summary, /, сценка /);
}
JSON.stringify(field);
console.log('✓ field: map, position, party, money, script');

g.script = null;
const b = g.startBattle({ enemies: ['reaver:3', 'reaver:3'], lvl: 3 });
assert.ok(b);
const fight = ui.bugInfo().state.battle;
assert.deepEqual([fight.wave, fight.waves, fight.allies.length, fight.enemies.length, fight.enemies[0].id], [1, 1, g.state.party.length, 2, 'reaver']);
assert.ok(fight.enemies[0].hp > 0 && fight.enemies[0].maxHp >= fight.enemies[0].hp);
assert.match(ui.bugInfo().summary, /, бой .*: волна 1\/1, раунд \d+/);
assert.ok(notes.some(n => n.startsWith('hsr battle start')), 'battles are traced');
g.battle = null;
g.battleCtx = null;
g.events.length = 0;
console.log('✓ battle: wave, round, allies, enemies');

ui.openDebug();
const dbg = ui.bugInfo();
assert.equal(dbg.state.screens[dbg.state.screens.length - 1], 'openDebug', 'screens are named after the method that opened them');
assert.equal(dbg.state.cheats, true, 'F8 marks the save');
assert.match(dbg.summary, /экран openDebug \[F7\/F8\]$/);
ui.screens = [];
const jadeBefore = g.state.jade;
ui.debugJade();
assert.ok(g.state.jade > jadeBefore && g.state.dbgUsed === 2, 'F7 counts as a cheat too');
console.log('✓ screen names and F7/F8 mark');

assert.equal(ui.bugInfo().state.lab, undefined, 'a save without test heroes has no lab line');
ui.labGrant(10);
assert.ok(g.state.dbgUsed === 3 && g.state.inv.items.lpass === 10, 'granting secret passes counts as a cheat');
ui.labGrant(7);
assert.equal(g.state.dbgUsed, 3, 'a refused grant is not a cheat');
g.addChar('theherta', 10);
const labInfo = ui.bugInfo();
assert.deepEqual(labInfo.state.lab, ['theherta'], 'the report lists test heroes in the save');
assert.match(labInfo.summary, /\[закрытый тест: theherta\]$/);
delete g.state.roster.theherta;
delete g.state.inv.items.lpass;
g.state.dbgUsed = 2;
console.log('✓ secret warp: grant mark and test heroes');

const live = ui.bugSave();
assert.ok(live.state && live.summary && live.summary.where);
assert.equal(live.state.dbgUsed, 2, 'the cheat mark is saved with the game');
const map0 = g.map.id;
const pos0 = [g.player.x, g.player.y];
const ui2 = new H.UI(root, { onExit: noop });
ui2.running = false;
assert.equal(ui2.bugLoad(live), true);
assert.deepEqual([ui2.mode, ui2.game.map.id, ui2.game.player.x, ui2.game.player.y], ['field', map0, ...pos0], 'the live state reloads at the same place');
assert.equal(ui2.bugLoad(null), false);
console.log('✓ live state save and load');

(async () => {
  const posts = [];
  let mode = 'online';
  globalThis.fetch = async (url, opts) => {
    if (mode === 'offline') throw new TypeError('fetch failed');
    if (opts && opts.method === 'POST') {
      posts.push({ url, body: JSON.parse(opts.body) });
      return { ok: true, status: 200, json: async () => ({ ok: true, id: JSON.parse(opts.body).report.id }) };
    }
    if (String(url).includes('/status?ids=')) {
      const ids = new URL(url).searchParams.get('ids').split(',');
      return { ok: true, status: 200, json: async () => ({ ok: true, items: Object.fromEntries(ids.map(id => [id, { status: 'fixed', fixedIn: '1.7', note: 'Поправлено' }])) }) };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };
  const wait = () => new Promise(r => setTimeout(r, 30));
  const press = code => ui.keydown({ code, repeat: false, preventDefault: noop });

  press('F9');
  const scr = ui.top();
  assert.ok(scr && scr.bugReport && scr.pause, 'F9 opens the report screen, which pauses the game');
  press('F9');
  assert.equal(ui.screens.filter(s => s.bugReport).length, 1, 'a second F9 does not open another screen');
  frame(2);
  const d = scr.draft;
  assert.equal(d.info.summary, ui.bugInfo().summary.replace(/, экран openBugReport/, ''), 'the place is taken before the screen opens');
  assert.ok(d.live && d.live.state, 'the live state is taken at F9');
  press('ArrowDown'); press('ArrowDown');
  press('ArrowRight');
  assert.equal(d.kind, 1, 'right arrow changes the type');
  press('KeyQ');
  assert.equal(d.kind, 0, 'Q goes back');
  scr.sel = 5;
  press('Enter');
  assert.equal(posts.length, 0, 'Send is disabled without a title');
  d.title = 'Пропал диалог';
  d.text = 'После боя чёрный экран';
  press('Enter');
  for (let i = 0; i < 20 && !d.done; i++) await wait();
  assert.ok(d.done && !d.done.queued, 'the report is sent');
  const sent = posts[0].body;
  assert.equal(posts[0].url, 'https://pennygachi.men/api/bugs');
  assert.deepEqual([sent.report.source, sent.report.user.title, sent.report.user.kind, sent.report.where.app], ['hsr98', 'Пропал диалог', 'bug', 'hsr98']);
  assert.equal(sent.report.apps.hsr98.state.map, g.map.id);
  assert.deepEqual(Object.keys(sent.files).sort(), ['save.json.gz', 'shot.png']);
  const zlib = require('node:zlib');
  const archive = JSON.parse(zlib.gunzipSync(Buffer.from(sent.files['save.json.gz'], 'base64')).toString('utf8'));
  assert.deepEqual(archive.components, ['game_hsr98']);
  assert.ok(archive.live.hsr98.state && Object.keys(archive.data.ls).every(k => k.startsWith('hsr98.')), 'the save holds the live state and only HSR keys');
  assert.deepEqual(sent.report.attach.live, ['hsr98']);
  const list = JSON.parse(store.get('sr98.bugs.sent'));
  assert.deepEqual([list[0].id, list[0].status, list[0].title], [d.done.id, 'received', 'Пропал диалог'], 'outside the system the list is sr98.bugs.sent');
  frame(1);
  press('Enter');
  assert.ok(!ui.top() || !ui.top().bugReport, 'Enter closes the done screen');
  console.log('✓ F9 screen: fields, send, save with live state, my reports list');

  press('F9');
  const d2 = ui.top().draft;
  d2.title = 'Без связи';
  mode = 'offline';
  ui.top().sel = 5;
  press('Enter');
  for (let i = 0; i < 20 && d2.busy !== false; i++) await wait();
  await wait();
  assert.ok(!d2.done && d2.statusBad && /fetch failed/.test(d2.status), 'without IndexedDB a failed send shows the reason');
  press('Escape');
  mode = 'online';

  ui.openBugList();
  for (let i = 0; i < 20; i++) await wait();
  frame(1);
  const after = JSON.parse(store.get('sr98.bugs.sent'));
  assert.deepEqual([after[0].status, after[0].fixedIn, after[0].note], ['fixed', '1.7', 'Поправлено'], 'my reports pull statuses from the server');
  assert.equal(ui.bugUnseen(), 0, 'the selected report is marked as seen');
  press('Escape');
  console.log('✓ offline message and statuses');

  ui.bugFileName = 'BR-261027-AAAA.bugreport.json';
  ui.fileSaved(true);
  assert.equal(ui.toasts[ui.toasts.length - 1].text, 'Отчёт сохранён в файл BR-261027-AAAA.bugreport.json');
  ui.fileSaved(true);
  assert.notEqual(ui.toasts[ui.toasts.length - 1].text, 'Отчёт сохранён в файл BR-261027-AAAA.bugreport.json', 'save transfer keeps its own message');
  console.log('✓ file saved message');

  ui.screens = [];
  assert.equal(ui.openBugCrash({ msg: 'TypeError: boom', src: 'js/apps/hsr98/hsr-ui.js:1:1' }), true);
  assert.ok(ui.top().bugCrash && ui.top().pause, 'a crash opens the game-styled crash screen');
  assert.equal(ui.openBugCrash({ msg: 'again' }), false, 'no second crash screen on top');
  const realField = ui.drawField;
  let drawn = 0;
  const crashDraw = ui.top().draw;
  ui.top().draw = function (c) { drawn++; return crashDraw.call(this, c); };
  ui.drawField = () => { throw new Error('field broke'); };
  assert.throws(() => ui.render(), /field broke/);
  assert.equal(drawn, 1, 'the crash screen is still drawn when the game screen throws');
  ui.drawField = realField;
  press('Enter');
  const crashDraft = ui.top().draft;
  assert.deepEqual([ui.top().bugReport, crashDraft.kind, crashDraft.title], [true, 1, 'Сбой: TypeError: boom'], 'Send report opens the report with the crash filled in');
  press('Escape');
  assert.equal(ui.openBugCrash({ msg: 'later' }), false, 'one crash screen per two minutes');
  ui.bugCrashAt = 0;
  ui.openBugCrash({ msg: 'third' });
  ui.top().sel = 2;
  press('Enter');
  assert.equal(store.get('sr98.bugs.crashMute'), 'true');
  ui.bugCrashAt = 0;
  assert.equal(ui.openBugCrash({ msg: 'muted' }), false, 'Never show again is remembered');
  console.log('✓ crash screen: render guard, report preset, throttle, mute');

  console.log('HSR 98 bug context tests passed.');
})().catch(err => {
  console.error(err);
  process.exit(1);
});

