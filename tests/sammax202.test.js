const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const BASE_DIR = path.join(ROOT, 'js/apps/sammax');
const DIR = path.join(ROOT, 'js/apps/sammax202');
const BASE = ['sm-core', 'sm-paint', 'sm-font', 'sm-sprites', 'sm-sprites2', 'sm-icons', 'sm-bg', 'sm-bg2', 'sm-bg3', 'sm-engine', 'sm-render', 'sm-closeups', 'sm-drive', 'sm-audio', 'sm-ui'];
const SHARED = ['sammax102/sc-sprites', 'sammax103/mm-sprites', 'sammax104/al-sprites', 'sammax105/rt-sprites', 'sammax106/bm-sprites', 'sammax106/bm-props', 'sammax201/is-sprites', 'sammax201/is-props'];
const ORDER = ['mb-story', 'mb-sprites', 'mb-props', 'mb-icons', 'mb-bg', 'mb-bg2', 'mb-closeups', 'mb-games', 'mb-room-office', 'mb-room-street', 'mb-room-sybil', 'mb-room-bosco', 'mb-room-stinky', 'mb-room-beach', 'mb-room-fountain', 'mb-room-cavern', 'mb-room-volcano', 'mb-room-triangle'];

let S;
for (const f of BASE) S = require(path.join(BASE_DIR, f + '.js'));
for (const f of SHARED) S = require(path.join(ROOT, 'js/apps', f + '.js'));
for (const f of ORDER) S = require(path.join(DIR, f + '.js'));

const E = S.EP202;
const REAL_NAMES = new RegExp(['Micro' + 'soft', 'Win' + 'dows'].join('|'));
const ROOM_LIST = ['office', 'street', 'sybil', 'bosco', 'stinky', 'beach', 'fountain', 'cavern', 'volcano', 'triangle'];
const ITEMS = ['max', 'gun', 'sandwich', 'suntea', 'youthwater', 'seismic', 'rattle', 'prophecy', 'flower', 'pedrokey', 'spatula'];

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function game(seed) {
  const g = new S.Game({ seed, ep: E });
  g.textSpeed = 20;
  E.startNewGame(g);
  return g;
}

function idle(g, max) {
  let n = 0;
  while ((g.busy || (g.fade > 0.001 && !g.ended)) && n < (max || 20000)) { g.update(1 / 30); n++; }
  for (let i = 0; i < 3; i++) g.update(1 / 30);
  while (g.busy && n < (max || 20000)) { g.update(1 / 30); n++; }
  ok(n < (max || 20000), 'game became idle in ' + g.roomId + ' after: ' + g.log.slice(-2).join(' | '));
  ok(!g.log.some(l => l.startsWith('script error')), 'no script errors: ' + g.log.filter(l => l.startsWith('script error')).join(' | '));
  return n;
}

function act(g, verb, target, item) {
  idle(g);
  const r = g.perform(verb, target, item);
  ok(r, `perform ${verb} ${target} ${item || ''} in ${g.roomId} busy=${g.busy} dlg=${g.dialog && g.dialog.id}`);
  idle(g, 60000);
}

function choose(g, id) {
  idle(g);
  ok(g.dialog, 'dialog open for ' + id + ' in ' + g.roomId);
  ok(g.optionIds().includes(id), 'option ' + id + ' in ' + (g.dialog && g.dialog.id) + ': ' + (g.dialog ? g.optionIds().join(',') : ''));
  g.choose(id);
  idle(g, 60000);
}

function close(g) {
  for (let i = 0; i < 4 && g.dialog && g.optionIds().includes('bye'); i++) choose(g, 'bye');
  ok(!g.dialog, 'dialog closed in ' + g.roomId);
}

function talk(g, who, opts) {
  act(g, 'talk', who);
  for (const o of opts) choose(g, o);
  close(g);
}

{
  ok(E.id === '202', 'episode id is 202');
  ok(E.TITLE_MUSIC === 'title22', 'title music');
  ok(E.CREDITS_MUSIC === 'credits22', 'credits music');
  ok(ROOM_LIST.every(id => E.ROOMS[id]), 'all 10 rooms exist');
  ok(ITEMS.every(id => E.ITEMS[id]), 'all episode items exist');
  ok(E.TITLE && E.TITLE.items.length === 5, 'title screen menu items');
  ok(Array.isArray(E.CREDITS) && E.CREDITS.length > 5, 'credits entries exist');

  const themes = ['title22', 'beach22', 'fountain22', 'cavern22', 'volcano22', 'triangle22', 'diner22', 'sybil22', 'finale22', 'credits22'];
  for (const th of themes) ok(S.THEMES[th], 'theme ' + th);

  const colors = ['bernie22', 'billy22', 'mort22', 'pedro22', 'spatula22', 'bjimmy22', 'mary22', 'lincoln22', 'sybil22', 'bosco22', 'stinky22', 'gstinky22'];
  for (const c of colors) ok(S.COLORS[c], 'color ' + c);

  const SL = String.fromCharCode(47);
  const LINE = SL + SL, BLOCK = SL + '*';
  const EMDASH = String.fromCharCode(8212), ENDASH = String.fromCharCode(8211);
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/sammax202/' + f).concat(['js/apps/sammax202-app.js', 'tests/sammax202.test.js']);
  for (const f of files) {
    const src = read(f);
    ok(!src.includes(LINE) && !src.includes(BLOCK), f + ' has no comments');
    ok(!src.includes(EMDASH), 'no em-dashes in ' + f);
    ok(!src.includes(ENDASH), 'no en-dashes in ' + f);
    ok(!REAL_NAMES.test(src), 'no forbidden names in ' + f);
  }
  ok(!read('sammax202.html').includes('<!' + '--'), 'page has no comments');
}

{
  const g = game();
  const ren = new S.Renderer();
  for (const id of ROOM_LIST) {
    g.setRoom(id);
    const rm = g.room;
    ok(rm.w >= 320 && rm.h >= 200, 'valid bounds for ' + id);
    ok(Array.isArray(rm.walk) && rm.walk.length > 0, 'walk polygons for ' + id);
    ok(Array.isArray(rm.start) && rm.start.length === 2, 'start pos for ' + id);
    ren.render(g);
  }
}

{
  const g = game();
  idle(g);
  ok(g.roomId === 'office', 'game starts in office');
  ok(g.f.introDone, 'intro completed');
  ok(g.f.portalSeen, 'portal seen on street');
  ok(g.has('max') && g.has('gun'), 'inventory starts with max and gun');

  act(g, 'use', 'closet');
  ok(g.f.closetOpen, 'closet opened');
  const pastItems = ['mrbear', 'preshead', 'capgun', 'mglove', 'jar', 'keyex', 'leocloset'];
  for (const item of pastItems) {
    ok(g.hotspots().some(h => h.id === item), 'past case item ' + item + ' in closet');
    act(g, 'look', item);
  }
  act(g, 'use', 'closetin');
  ok(!g.f.closetOpen, 'closet closed');
}

{
  const g = game();
  idle(g);

  act(g, 'use', 'edoor');
  ok(g.roomId === 'street', 'exited to street');

  act(g, 'use', 'portal');
  choose(g, 'beach');
  ok(g.roomId === 'beach', 'warped to easter island beach');

  talk(g, 'mort', ['prophecy']);
  ok(g.f.prophecyGot, 'received prophecy stone from mortimer');
  ok(g.has('prophecy'), 'prophecy in inventory');

  act(g, 'use', 'flower');
  ok(g.has('flower'), 'picked up hibiscus flower');

  act(g, 'use', 'portal');
  choose(g, 'street');
  ok(g.roomId === 'street', 'returned to street');

  act(g, 'use', 'sybildoor');
  ok(g.roomId === 'sybil', 'entered sybil dating agency');
  talk(g, 'lincoln', ['flower']);
  ok(g.f.lincolnDate, 'sybil and lincoln arranged tropical date');
  act(g, 'use', 'door');
  ok(g.roomId === 'street', 'back to street');

  act(g, 'use', 'portal');
  choose(g, 'beach');
  ok(g.roomId === 'beach', 'back to beach');
  talk(g, 'bernie', ['happy']);
  ok(g.f.bernieHappy, 'bernie cheered up by lovers and dried tears');

  act(g, 'use', 'portal');
  choose(g, 'street');
  ok(g.roomId === 'street', 'back to street');

  act(g, 'use', 'stinkydoor');
  ok(g.roomId === 'stinky', 'entered stinky diner');
  talk(g, 'stinky', ['sandwich']);
  ok(g.has('sandwich'), 'got granite sandwich');
  act(g, 'use', 'suntea');
  ok(g.has('suntea'), 'took sun tea');
  act(g, 'use', 'door');
  ok(g.roomId === 'street', 'back to street');

  act(g, 'use', 'boscodoor');
  ok(g.roomId === 'bosco', 'entered bosco store');
  talk(g, 'bosco', ['trade']);
  ok(g.f.seismicGot, 'traded sandwich for seismic inverter');
  ok(g.has('seismic'), 'seismic inverter in inventory');
  act(g, 'use', 'door');
  ok(g.roomId === 'street', 'back to street');

  act(g, 'use', 'portal');
  choose(g, 'beach');
  ok(g.roomId === 'beach', 'back to beach');

  act(g, 'use', 'fountain');
  ok(g.roomId === 'fountain', 'entered fountain of youth grotto');
  act(g, 'use', 'pool');
  ok(g.has('youthwater'), 'scooped youth water');
  talk(g, 'jimmy', ['tea']);
  ok(g.f.rattleGot, 'traded tea for golden rattle');
  ok(g.has('rattle'), 'rattle in inventory');
  act(g, 'use', 'exit');
  ok(g.roomId === 'beach', 'returned to beach');

  act(g, 'use', 'cave');
  ok(g.roomId === 'cavern', 'entered under-island cavern');
  act(g, 'use', 'feet');
  ok(g.f.tickleDone, 'tickled giant moai feet');
  act(g, 'use', 'exit');
  ok(g.roomId === 'beach', 'returned to beach');
  talk(g, 'billy', ['serious']);
  ok(g.f.billySerious, 'billy stopped laughing and turned serious');

  act(g, 'use', 'portal');
  choose(g, 'street');
  ok(g.roomId === 'street', 'back to street');
  act(g, 'use', 'stinkydoor');
  ok(g.roomId === 'stinky', 'entered stinky diner');
  talk(g, 'gstinky', ['water']);
  ok(g.f.gstinkyYoung, 'grandpa stinky rejuvenated');
  act(g, 'use', 'door');
  ok(g.roomId === 'street', 'back to street');

  act(g, 'use', 'portal');
  choose(g, 'triangle');
  ok(g.roomId === 'triangle', 'entered bermuda triangle');
  talk(g, 'pedro', ['rattle']);
  ok(g.f.pedroDone, 'pedro mariachi tuned portal with rattle');
  ok(g.f.volcanoReady, 'volcano entrance opened');
  ok(g.f.volcanoKnown, 'volcano destination discovered');

  act(g, 'use', 'portal');
  choose(g, 'volcano');
  ok(g.roomId === 'volcano', 'entered bellavista volcano crater');
  talk(g, 'altar', ['divert']);
  ok(g.f.lavaDiverted, 'lava flow diverted to ocean');
  talk(g, 'altar', ['capture']);
  ok(g.f.spatulaCaptured, 'mr spatula defeated and captured');
  ok(g.f.gameWon, 'game won');
  ok(g.roomId === 'office', 'returned to office for epilogue');
  ok(g.f.closetOpen, 'closet opened in epilogue');
  ok(g.hotspots().some(h => h.id === 'spatulacloset'), 'mr spatula placed on shelf');
}

{
  const g = game();
  idle(g);
  act(g, 'use', 'edoor');
  act(g, 'use', 'portal');
  choose(g, 'beach');
  talk(g, 'mort', ['prophecy']);
  ok(g.canSave(), 'can save state');
  const state = JSON.parse(JSON.stringify(g.saveState()));

  const h = new S.Game({ seed: state.seed, ep: E });
  E.newGame(h);
  h.loadState(state);
  idle(h);
  ok(h.roomId === 'beach', 'reload restored room');
  ok(h.f.prophecyGot, 'reload restored prophecy flag');
  ok(h.has('prophecy'), 'reload restored inventory item');
  ok(h.actors.sam.room === 'beach', 'reload restored sam location');
  ok(h.actors.max.room === 'beach', 'reload restored max location');
}

{
  const gm = read('js/game-manager.js');
  ok(gm.includes("id: 'sammax202'"), 'catalog entry in game-manager');
  ok(gm.includes("steam: true"), 'marked as steam game');
  ok(!/sammax202Granted/.test(gm), 'no grant flag in game-manager');

  const shell = {
    'js/desktop.js': ["isInstalled('sammax202')", 'appSamMax202'],
    'js/taskbar.js': ["isInstalled('sammax202')", "case 'sammax202'", "showInSteam('sammax202')"],
    'js/apps/dialogs.js': ["cmd === 'sammax202'", "showInSteam(\\'sammax202\\')"],
    'js/apps/explorer.js': ["item.app === 'sammax202'", 'SAMMAX22.EXE'],
    'js/filesystem.js': ["'sammax202'", "'SAMMAX22.EXE'"],
    'js/apps/task-manager.js': ["'app_sammax202'", 'sammax22.exe'],
    'js/icons.js': ["'sammax202': `<svg"],
    'js/apps/clippy.js': ["id.startsWith('app_sammax202')", "launchProgram('sammax202', 'appSamMax202')"],
    'js/apps/steam.js': ["game: 'sammax202'"],
    'js/apps/advanced-site.js': ["id: 'sammax202'"],
    'js/apps/sammax202-app.js': ["id = 'app_sammax202'", 'ep: S.EP202']
  };
  for (const [f, needles] of Object.entries(shell)) {
    const src = read(f);
    for (const n of needles) ok(src.includes(n), `${f} contains ${n}`);
  }

  for (const n of [1, 2]) {
    const p = path.join(ROOT, 'content/steam/sammax202-' + n + '.jpg');
    ok(fs.existsSync(p), 'steam shot ' + n + ' exists');
    const buf = fs.readFileSync(p);
    ok(buf.length > 5000, 'steam shot ' + n + ' has valid size');
  }
  ok(fs.existsSync(path.join(ROOT, 'SAM-MAX-202.md')), 'episode document exists');
  ok(read('package.json').includes('"test:sammax202": "node tests/sammax202.test.js"'), 'package script registered');
}

console.log(`sammax202: ${checks} checks passed in ${Date.now() - t0} ms`);
