const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js', 'apps', 'falloutzp');
const SIM = ['zp-core', 'zp-geo', 'zp-map', 'zp-mesh', 'zp-town', 'zp-phys', 'zp-nav', 'zp-rules', 'zp-items', 'zp-actor', 'zp-game', 'zp-combat', 'zp-actors', 'zp-ai', 'zp-play', 'zp-objects', 'zp-interiors', 'zp-dialogue', 'zp-quests', 'zp-save', 'zp-pieces', 'zp-sites', 'zp-places', 'zp-people', 'zp-rooms', 'zp-dlg', 'zp-story'];
for (const f of SIM) require(path.join(DIR, f + '.js'));
const Z = globalThis.FalloutZP;

let passed = 0;
const only = process.argv[2] || null;
function test(name, fn) {
  if (only && !name.includes(only)) return;
  const t0 = Date.now();
  fn();
  passed++;
  console.log(`  ok - ${name} (${Date.now() - t0} ms)`);
}

const MAP = new Z.WorldMap();
const TOWN = new Z.Town(MAP);

function newGame(seed) {
  const g = new Z.Game({ map: MAP, town: TOWN, seed: seed || 11 });
  g.newGame({ name: 'Тест' });
  g.godMode = true;
  return g;
}
function step(g, sec) { for (let i = 0; i < Math.round(sec * 20); i++) g.update(0.05, null); }
function goExt(g, x, z) {
  if (!g.cell.exterior) g.enterCell('ext', null);
  const p = g.player;
  p.x = x; p.z = z; p.y = g.ext.cw.groundAt(x, z, 300); p.vx = p.vz = 0;
}
function talk(g, npc, ...choices) {
  const a = g.findActor(npc);
  assert.ok(a, 'npc ' + npc);
  if (a.cell !== g.cell.id) g.enterCell(a.cell, 'A');
  const d = new Z.Dialogue(g, a.dlg, a).start();
  for (const c of choices) {
    if (d.ended) break;
    const i = d.options.findIndex(o => o.text.includes(c));
    assert.ok(i >= 0, `${npc}: no option "${c}" in ${d.node && d.node.id}: ${d.options.map(o => o.text).join(' | ')}`);
    d.choose(i);
  }
  return d;
}
function killKey(g, key) {
  for (const c of g.cells.values()) for (const a of c.actors) if (a.spawnKey === key && !a.dead) { a.applyDamage(99999, {}); g.handleDeath(a, { src: g.player }); }
}
function killNpc(g, id) { const a = g.findActor(id); a.applyDamage(99999, {}); g.handleDeath(a, { src: g.player }); }

function playMain(route) {
  const g = newGame();
  const p = g.player;
  p.sheet.stats.str = 7;
  p.sheet.books.speech = 60;
  talk(g, 'doctor', 'Спасибо, доктор', 'медкомиссию');
  step(g, 1);
  assert.equal(g.stage('mq01'), 20);
  talk(g, 'doctor', 'Тимофею');
  talk(g, 'timofey', 'Что ты видел', 'Карпенко');
  talk(g, 'karpenko', 'разберусь с Гирей');
  assert.equal(g.stage('mq02'), 10);
  talk(g, 'girya', 'Кто заплатил', 'Тот, кто тебе заплатил');
  assert.ok(g.quests.mq02.done);
  talk(g, 'aristarkh', 'Спасибо');
  assert.equal(g.stage('mq03'), 30);
  g.enterCell('intourist', 'A');
  talk(g, 'montana', 'Схватить за воротник');
  assert.equal(g.stage('mq03'), 40);
  goExt(g, -300, -334);
  step(g, 1);
  assert.ok(g.flags.kppTalked, 'checkpoint stops the courier');
  p.give('talon', 200);
  talk(g, 'dub', 'договориться', 'Заплатить');
  assert.ok(g.flags.bridgeOK);
  goExt(g, -470, -244);
  step(g, 1);
  assert.equal(g.stage('mq03'), 50);
  talk(g, 'sirko', 'Я ищу человека', 'Как доказать вину');
  assert.equal(g.stage('mq04'), 20);
  if (route === 'trial') talk(g, 'sirko', 'Предъявить', 'Обратиться к Раде');
  else if (route === 'duel') {
    talk(g, 'firma', 'Ты украл', 'поединок');
    assert.equal(g.stage('mq04'), 40);
    killNpc(g, 'nechuy');
  } else talk(g, 'firma', 'О чём хочешь', 'Согласен');
  step(g, 1);
  assert.ok(p.has('perfokarta'), 'card in hands');
  assert.equal(g.stage('mq05'), 10);
  assert.ok(g.flags.plannerPass);
  talk(g, 'planner', route === 'p' ? 'А люди' : 'Нет');
  assert.equal(g.stage('mq05'), 20);
  if (route === 'k' || route === 'trial' || route === 'duel') {
    talk(g, 'savchenko', 'Отдаю');
    killKey(g, 'sichpost');
    step(g, 1);
    assert.equal(g.stage('mq06k'), 20);
    talk(g, 'savchenko', 'К мосту');
  } else if (route === 's') {
    talk(g, 'sirko', 'Отдаю');
    g.enterCell('komendatura', 'A');
    g.flags.unlocked_kpz2 = true;
    step(g, 1);
    assert.equal(g.stage('mq06s'), 20);
    talk(g, 'sirko', 'На мост');
  } else if (route === 'p') {
    talk(g, 'planner', 'Вставить');
    goExt(g, -300, -334);
    g.activate({ obj: g.ext.objects.find(o => o.id === 'substation') });
  } else if (route === 'i') {
    talk(g, 'timofey', 'Сделаем это сами');
    g.enterCell('bunker', 'A');
    const arch = g.cell.objects.find(o => o.id === 'bunker_archive');
    for (const e of arch.inv.slice()) g.takeFromObject(arch, e);
    step(g, 1);
    assert.equal(g.stage('mq06i'), 20);
    talk(g, 'timofey', 'Теперь пойдёшь', 'Пошли');
    const tim = g.findActor('timofey');
    assert.ok(tim.companion);
    goExt(g, -300, -334);
    for (const c of g.cells.values()) { const k = c.actors.indexOf(tim); if (k >= 0 && c !== g.ext) { c.actors.splice(k, 1); g.ext.actors.push(tim); } }
    tim.x = p.x + 1; tim.z = p.z;
    g.activate({ obj: g.ext.objects.find(o => o.id === 'substation') });
  }
  assert.equal(g.stage('mq07'), 10);
  goExt(g, -384, -290);
  step(g, 1);
  assert.ok(g.flags.battleOn, 'bridge battle starts');
  assert.ok(g.ext.actors.some(a => a.spawnKey === 'battle' && !a.dead));
  step(g, 6);
  killKey(g, 'battle');
  step(g, 5);
  assert.equal(g.stage('mq07'), 20);
  assert.ok(Z.endingSlides(g).length >= 3);
  return g;
}

test('real map, sites and terrain edits', () => {
  assert.equal(MAP.x0, -1152);
  assert.ok(TOWN.pieces.length > 400, 'site pieces ' + TOWN.pieces.length);
  assert.ok(TOWN.siteStats.removed >= 5);
  const sich = Z.SITES.find(s => s.id === 'sich');
  const c = Z.siteToWorld(sich, 0, 0);
  assert.ok(Math.abs(MAP.groundH(c[0], c[1]) - 21) < 0.3, 'Sich hilltop is levelled');
  const bayda = Z.SITES.find(s => s.id === 'bayda');
  assert.ok(MAP.groundH(bayda.at[0], bayda.at[1]) > 2, 'Bayda island rises from the river');
  for (const id of ['komendatura', 'intourist', 'orbita', 'pochtamt', 'oblispolkom', 'tyuz', 'circus', 'hospital', 'zalk3', 'lager', 'kolkhoz']) assert.ok(TOWN.entrances.some(e => e.to === id), 'entrance ' + id);
  assert.ok(Z.LOCATIONS.length >= 30);
  const g = new Z.Game({ map: MAP, town: TOWN, seed: 3 });
  for (const l of Z.LOCATIONS) assert.ok(Z.pointInPoly(l.x, l.z, g.playArea) || l.id === 'dam', 'location inside the play area: ' + l.id);
});

test('bridge decks are walkable on both tiers', () => {
  const g = newGame();
  const mid = [(-310 - 459) / 2, (-329 - 250) / 2];
  const up = g.ext.cw.groundAt(mid[0], mid[1], 40), low = g.ext.cw.groundAt(mid[0], mid[1], 13);
  assert.ok(up > 16 && up < 20, 'upper deck ' + up);
  assert.ok(low > 10 && low < 13, 'lower deck ' + low);
  assert.ok(MAP.groundH(mid[0], mid[1]) < -5, 'river under the bridge');
});

test('interiors build with exits, npcs and valid references', () => {
  const g = newGame();
  for (const [id, def] of Object.entries(Z.INTERIORS)) {
    const rows = def.map;
    assert.ok(rows.every(r => r.length === rows[0].length), 'ragged map ' + id);
    const cell = g.cells.get(id) || g.loadCell(id);
    assert.ok(cell.objects.some(o => o.T.door && o.to), 'exit in ' + id);
    for (const o of cell.objects) if (o.to && o.to !== 'ext') assert.ok(Z.INTERIORS[o.to], 'door target ' + o.to);
    for (const n of def.npcs || []) assert.ok(cell.actors.some(a => a.npcId === n.id), 'npc ' + n.id + ' in ' + id);
    assert.ok(cell.marks.A, 'entry mark in ' + id);
  }
  for (const d of Z.SITE_DOORS) assert.ok(g.ext.marks['door_' + d.to], 'return mark ' + d.to);
});

test('dialogues, items, notes and terminals resolve', () => {
  const g = newGame();
  assert.deepEqual(g.validateDialogues(), []);
  const bad = [];
  for (const [tid, t] of Object.entries(Z.DIALOGUES)) for (const [nid, n] of Object.entries(t.nodes)) {
    for (const a of n.acts.concat(...n.opts.map(o => o.acts))) for (const part of a.split(';')) {
      const w = part.trim().split(/\s+/);
      if ((w[0] === 'give' || w[0] === 'take') && !Z.item(w[1])) bad.push(tid + ':' + nid + ' item ' + w[1]);
      if (w[0] === 'q' && !Z.QUESTS[w[1]]) bad.push(tid + ':' + nid + ' quest ' + w[1]);
      if (w[0] === 'note' && !Z.NOTES[w[1]]) bad.push(tid + ':' + nid + ' note ' + w[1]);
      if (w[0] === 'script' && !Z.SCRIPTS[w[1]]) bad.push(tid + ':' + nid + ' script ' + w[1]);
    }
  }
  for (const [id, d] of Object.entries(Z.NPCS)) {
    if (d.dlg && !Z.DIALOGUES[d.dlg]) bad.push('dialogue of ' + id);
    for (const s of (d.vendor && d.vendor.stock) || []) if (!Z.item(s[0])) bad.push('vendor ' + id + ' ' + s[0]);
    const home = d.site || Object.values(Z.INTERIORS).some(r => (r.npcs || []).some(n => n.id === id));
    if (!home) bad.push('npc without home ' + id);
  }
  for (const r of Object.values(Z.INTERIORS)) for (const o of r.objects || []) {
    if (o.note && !Z.NOTES[o.note]) bad.push('note ' + o.note);
    if (o.term && !Z.TERMINALS[o.term]) bad.push('terminal ' + o.term);
    if (Array.isArray(o.loot)) for (const l of o.loot) if (!Z.item(l[0])) bad.push('loot ' + l[0]);
  }
  for (const q of Object.values(Z.QUESTS)) assert.ok(Object.values(q.stages).some(s => s.done), 'quest has an end: ' + q.title);
  assert.deepEqual(bad, []);
});

test('new game wakes the courier in the medical post', () => {
  const g = newGame();
  assert.equal(g.cell.id, 'medpunkt');
  assert.equal(g.stage('mq01'), 10);
  assert.ok(g.cell.actors.some(a => a.npcId === 'doctor'));
  assert.ok(g.ext.actors.some(a => a.npcId === 'timofey' && !g.hostileToPlayer(a)));
  assert.ok(g.ext.actors.filter(a => a.cdef && a.cdef.beast).length > 20, 'wildlife populates the map');
});

test('main quest: Komendatura route', () => { playMain('k'); });
test('main quest: Sich route', () => { playMain('s'); });
test('main quest: Planner route', () => { playMain('p'); });
test('main quest: independent route with Timofey', () => { playMain('i'); });
test('main quest: trial before the Rada', () => { playMain('trial'); });
test('main quest: duel by Cossack law', () => { playMain('duel'); });

test('checkpoint alarm when crossing without permission', () => {
  const g = newGame();
  goExt(g, -296, -335);
  g.flags.kppTalked = true;
  g.player.x = -322; g.player.z = -322; g.player.y = g.ext.cw.groundAt(-322, -322, 40);
  step(g, 1);
  assert.ok(g.flags.kppAlarm);
  assert.ok(g.ext.actors.some(a => a.faction === 'komendatura' && a.hostile));
});

test('side quests can be completed', () => {
  const g = newGame();
  const p = g.player;
  p.sheet.books.repair = 60; p.sheet.books.speech = 60;
  g.flags.chargenDone = true;
  talk(g, 'bulbenko', 'Убью');
  killKey(g, 'queen'); step(g, 1);
  talk(g, 'bulbenko');
  assert.ok(g.quests.sq_harvest.done);
  talk(g, 'panas', 'Что за Царь-сом', 'Убью');
  killKey(g, 'somking'); step(g, 1);
  p.give('whisker', 1);
  talk(g, 'panas');
  assert.ok(g.quests.sq_somking.done);
  talk(g, 'aristarkh', 'Есть работа', 'Доставлю');
  talk(g, 'doctor', 'Письмо');
  talk(g, 'pisar', 'Пожалуйста');
  talk(g, 'panas', 'Рад помочь');
  talk(g, 'aristarkh', 'Служу почте');
  assert.ok(g.quests.sq_letters.done);
  talk(g, 'levitan', 'Я достану лампы');
  p.give('tube', 3);
  talk(g, 'levitan', 'Иду');
  g.enterCell('orbita', 'A');
  g.activate({ obj: g.cell.objects.find(o => o.id === 'orbita_switch') });
  assert.ok(g.quests.sq_mayak.done);
  assert.ok(Z.radioLines(g, 'mayak', true).length >= 2);
  talk(g, 'protasov', 'Чем помочь', 'Принесу');
  p.give('filter', 10);
  talk(g, 'protasov', 'Берегите себя');
  assert.ok(g.quests.sq_redwater.done);
  talk(g, 'nomerok', 'Почему не выйти', 'Давай я починю');
  assert.ok(g.quests.sq_queue.done);
  talk(g, 'vozhatyi', 'Всегда готов');
  p.give('tie', 3);
  talk(g, 'vozhatyi', 'Служу');
  assert.ok(g.quests.sq_zarnitsa.done);
  talk(g, 'kuzmich', 'Я выгоню', 'Сделаю');
  killKey(g, 'zalkferal');
  talk(g, 'kuzmich', 'Достану');
  p.give('naryad', 1);
  talk(g, 'kuzmich', 'Удачи');
  assert.ok(g.quests.sq_norm.done);
  assert.ok(p.has('rivet'));
  talk(g, 'savchenko', 'Мне нужен пропуск', 'Сделаю');
  g.loadCell('tyuz');
  killKey(g, 'tyuzhobot'); step(g, 1);
  talk(g, 'savchenko', 'Служу трудовому народу');
  assert.ok(p.has('propusk'));
  talk(g, 'keeper', 'Есть работа', 'Поищу');
  goExt(g, 136, 637);
  p.give('lopatka', 1);
  g.activate({ obj: g.ext.objects.find(o => o.id === 'kurgan_dig') });
  assert.ok(p.has('pectoral'));
  talk(g, 'keeper', 'Отдаю');
  assert.ok(g.quests.sq_gold.done);
  talk(g, 'yarina', 'Почему ты не в Сечи', 'Я могу помочь', 'Посмотрим');
  talk(g, 'yarina', 'Пойдём со мной', 'Договорились');
  assert.ok(g.findActor('yarina').companion);
  g.enterCell('sich_kosh', 'A');
  const y = g.findActor('yarina');
  for (const c of g.cells.values()) { const k = c.actors.indexOf(y); if (k >= 0 && c !== g.cell) { c.actors.splice(k, 1); g.cell.actors.push(y); } }
  talk(g, 'sirko', 'Она убила Царь-сома');
  assert.ok(g.quests.sq_yarina.done);
});

test('arena rounds pay out and end with the glove', () => {
  const g = newGame();
  const p = g.player;
  talk(g, 'gosha', 'Я в деле', 'На манеж');
  for (let r = 1; r <= 3; r++) {
    if (r > 1) talk(g, 'gosha', r === 2 ? 'Да' : 'Начинай');
    assert.equal(g.flags.arenaRound, r);
    killKey(g, 'arena' + r);
    step(g, 1);
  }
  assert.ok(g.quests.sq_circus.done);
  assert.ok(p.has('sambo'));
});

test('save and load keep quests, companions and the world', () => {
  const g = newGame();
  talk(g, 'yarina', 'Почему ты не в Сечи', 'Пойдёшь со мной', 'Договорились');
  const y = g.findActor('yarina');
  g.enterCell('selmag', 'A');
  for (const c of g.cells.values()) { const k = c.actors.indexOf(y); if (k >= 0 && c !== g.cell) { c.actors.splice(k, 1); g.cell.actors.push(y); y.cell = g.cell.id; } }
  g.flags.testFlag = 42;
  const s = JSON.parse(JSON.stringify(g.serialize()));
  const g2 = new Z.Game({ map: MAP, town: TOWN, seed: 11 });
  g2.restore(s);
  assert.equal(g2.cell.id, 'selmag');
  assert.equal(g2.flags.testFlag, 42);
  const y2 = g2.findActor('yarina');
  assert.ok(y2 && y2.companion && y2.dlg === 'yarina', 'companion keeps her dialogue after load');
  assert.equal(g2.cells.get('bar_grusha') ? g2.cells.get('bar_grusha').actors.filter(a => a.npcId === 'yarina').length : 0, 0);
  assert.equal(g2.stage('mq01'), 10);
});

test('combat: the courier fights off a swarm of kolorads', () => {
  const g = newGame();
  goExt(g, 470, 176);
  const p = g.player;
  p.give('obrez'); p.equipEntry(p.find('obrez')); p.find('obrez').loaded = 2; p.give('a12', 60);
  const foes = [];
  for (let i = 0; i < 3; i++) foes.push(g.spawnCreature('kolorad', p.x + 10 + i * 2, p.z - 6, { wander: 2 }));
  for (let t = 0; t < 900 && foes.some(f => !f.dead); t++) {
    const f = foes.filter(x => !x.dead).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
    const dx = f.x - p.x, dz = f.z - p.z;
    const eye = g.eyeOf(p);
    const inp = { move: [0, 0], yaw: Math.atan2(dx, -dz), pitch: Math.atan2(f.y + 0.4 - eye[1], Math.hypot(dx, dz)), fire: Math.hypot(dx, dz) < 20, firePressed: true };
    g.update(0.05, inp);
    if (p.equip.weapon && p.equip.weapon.loaded === 0 && !(p.reloading > 0)) g.reload(p);
  }
  assert.ok(foes.every(f => f.dead), 'all kolorads dead');
});

test('F7 debug tools: talons, experience, teleport and clock', () => {
  const g = newGame();
  const p = g.player;
  const t0 = p.count('talon');
  p.give('talon', 1000);
  assert.equal(p.count('talon'), t0 + 1000);
  const lv = p.sheet.level;
  g.debugXP(Z.xpFor(lv + 1) - p.sheet.xp);
  assert.equal(p.sheet.level, lv + 1);
  assert.ok(p.sheet.pendingSkill > 0);
  const sich = g.locations.find(l => l.id === 'sich') || g.locations[0];
  g.debugTeleport(sich.x, sich.z);
  assert.ok(g.cell.exterior);
  assert.ok(Math.hypot(p.x - sich.x, p.z - sich.z) < 0.01);
  assert.ok(Number.isFinite(p.y));
  assert.ok(sich.found);
  const day = Math.floor(g.time / 1440);
  g.debugSetClock(19 * 60);
  assert.equal(Z.fmtTime(g.time), '19:00');
  assert.equal(Math.floor(g.time / 1440), day);
  g.debugSetClock(5 * 60 + 30);
  assert.equal(Z.fmtTime(g.time), '05:30');
  g.debugAdvance(1440);
  assert.equal(Math.floor(g.time / 1440), day + 1);
});

test('every item has its own icon', () => {
  require(path.join(DIR, 'zp-icons.js'));
  const missing = Object.keys(Z.ITEMS).filter(id => !Z.ITEMS[id].hidden && Z.iconKey(id) === 'unknown');
  assert.deepEqual(missing, []);
});

test('hands, weapon holds and first/third person weapon animation', () => {
  for (const f of ['zp-tex', 'zp-tex2', 'zp-shaders', 'zp-render', 'zp-build', 'zp-scene', 'zp-rig', 'zp-models', 'zp-anim', 'zp-guns', 'zp-wield']) require(path.join(DIR, f + '.js'));
  const finite = arr => arr.every(v => Number.isFinite(v));
  const built = Z.Models.human(Z.randomLook(Z.rng(4), { sex: 'm' }));
  assert.ok(built.def.n <= 32);
  for (const b of ['lfing', 'ltip', 'lthumb', 'rfing', 'rtip', 'rthumb']) assert.ok(built.def.index[b] !== undefined, b);
  for (let i = 0; i < built.mesh.n; i++) assert.ok(built.mesh.mat[i * 4 + 3] < built.def.n && built.mesh.mat[i * 4 + 1] < built.def.n);
  const rig1 = new Z.RigDef([{ name: 'root', pos: [0, 0, 0] }]);
  const span = pose => { const mb = new Z.SkinBuilder(rig1); Z.buildHand(mb, { side: 1, pose }); assert.ok(finite(mb.pos) && finite(mb.nrm)); let lo = Infinity; for (let i = 1; i < mb.pos.length; i += 3) lo = Math.min(lo, mb.pos[i]); return -lo; };
  assert.ok(span(Z.HAND_POSES.fist) < span(Z.HAND_POSES.open) - 0.05, 'fist curls the fingers');
  assert.ok(span(Z.handWrap(0.03)) > span(Z.handWrap(0.013)), 'thicker handles open the hand');

  const weapons = Object.keys(Z.ITEMS).filter(id => Z.ITEMS[id].cat === 'weapon');
  for (const id of weapons) assert.ok(Z.HOLD_DATA[Z.ITEMS[id].model || id], 'hold data for ' + id);
  const vm = { st: { bob: 0.7, swayX: 0, swayY: 0, kick: 0.5, ads: 0, run: 0, air: 0, land: 0, breath: 0 }, scene: {} };
  const look = { skin: [200, 160, 130], top: 'shirt' };
  for (const id of weapons) {
    const d = Z.ITEMS[id];
    const states = [{}, { ads: 1 }, { k: 0.3, dir: 1 }, { k: 0.5, dir: -1 }, { swing: 0.5, punchSide: 1 }, { throwT: 0.5 }, { quick: { model: 'f1', u: 0.4 } }, { cycle: 0.5 }, { empty: true }];
    if (d.mag) for (const u of [0.05, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95]) states.push({ reload: u, rounds: 5 });
    for (const extra of states) {
      vm.st.ads = extra.ads || 0;
      const st = Object.assign({ wid: id, k: 1, dir: 1, move: 0.5, speed: 2, reload: 0, swing: 0, throwT: 0, look }, extra);
      const out = Z.ViewModel.prototype.build.call(vm, st);
      assert.ok(out.mb.n > 0 && finite(out.mb.pos) && finite(out.muzzle), id + ' ' + JSON.stringify(extra));
      if (!Object.keys(extra).length) {
        const w = vm.hands.r.wrist;
        assert.ok(w[2] < -0.1 && Math.abs(w[0] / w[2]) < 1 && Math.abs(w[1] / w[2]) < 0.9, id + ' right hand on screen');
      }
    }
  }

  const still = { st: { bob: 0, swayX: 0, swayY: 0, kick: 0, ads: 1, run: 0, air: 0, land: 0, breath: 0 }, scene: {} };
  for (const id of weapons) {
    const kind = Z.wieldKind(Z.ITEMS[id]);
    if (kind !== 'rifle' && kind !== 'pistol') continue;
    const out = Z.ViewModel.prototype.build.call(still, { wid: id, k: 1, dir: 1, move: 0, speed: 0, reload: 0, swing: 0, throwT: 0, ads: 1, look });
    assert.ok(Math.abs(out.muzzle[0]) < 0.004 && Math.abs(out.muzzle[1]) < 0.08 && out.muzzle[2] < -0.25, id + ' sights line up with the view axis ' + out.muzzle.map(v => v.toFixed(3)));
  }

  const reach = (P, side, f, sc) => {
    const B = P.boneMat(side > 0 ? 'rhand' : 'lhand'), w = Z.M4.transform(B, 0, 0.015, 0);
    return Math.hypot(w[0] - f.wrist[0], w[1] - f.wrist[1], w[2] - f.wrist[2]) / sc;
  };
  for (const id of weapons) {
    for (const aimK of [0, 1]) {
      const a = { x: 0, y: 0, z: 0, yaw: 0.7, anim: { phase: 0, fire: 0, swing: 0, reload: 0, throwT: 0 }, look: { sex: 'm' }, equip: { weapon: { id, loaded: 3 } } };
      const P = new Z.Pose(Z.HUMAN_RIG), ctx = { wid: id, wk: 1, aimK, scale: 1, speed: 0 };
      Z.Anim.human(P, a, 0, ctx);
      const kind = Z.wieldKind(Z.ITEMS[id]);
      if (kind !== 'unarmed') assert.ok(ctx.gunM && finite(Array.from(ctx.gunM)), id + ' gun matrix');
      if (ctx.gripR) assert.ok(reach(P, 1, ctx.gripR, 1) < 0.025, id + ' right hand reaches the grip ' + reach(P, 1, ctx.gripR, 1).toFixed(3));
      if (ctx.gripL) assert.ok(reach(P, -1, ctx.gripL, 1) < 0.025, id + ' left hand reaches the support ' + reach(P, -1, ctx.gripL, 1).toFixed(3));
      assert.ok(finite(Array.from(P.world)), id + ' pose');
    }
    const a = { x: 0, y: 0, z: 0, yaw: 0, anim: { phase: 1, fire: 0, swing: 0, reload: 0.5, throwT: 0 }, look: { sex: 'f' }, equip: { weapon: { id, loaded: 0 } } };
    for (const wk of [0, 0.3, 0.7, 1]) {
      const P = new Z.Pose(Z.HUMAN_RIG), ctx = { wid: id, wk, aimK: 0.5, scale: 1.1, speed: 1.5 };
      Z.Anim.human(P, a, 0, ctx);
      assert.ok(finite(Array.from(P.world)) && (!ctx.gunM || finite(Array.from(ctx.gunM))), id + ' draw ' + wk);
    }
  }

  const g = newGame(5), p = g.player;
  const akm = p.give('akm', 1), pm = p.give('pm', 1);
  akm.loaded = 30; pm.loaded = 8;
  p.equipEntry(akm); p.holstered = false; p.cool = 0;
  g.playerActions({ fire: false });
  p.equipEntry(pm);
  g.playerActions({ fire: true, firePressed: true });
  assert.equal(pm.loaded, 8, 'weapon swap takes time');
  assert.ok(p.cool >= Z.SWAP_COOL - 0.05);
  p.cool = 0;
  g.playerActions({ fire: true, firePressed: true });
  assert.equal(pm.loaded, 7);
  p.holstered = true; p.cool = 0;
  g.playerActions({ fire: true, firePressed: true });
  assert.equal(p.holstered, false);
  assert.equal(pm.loaded, 7, 'drawing does not fire');
  p.holstered = true;
  g.playerActions({ aimPressed: true });
  assert.equal(p.holstered, false, 'aiming draws the weapon');
});

test('Igromania CD demo entry follows the distribution rules', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'game-manager.js'), 'utf8');
  const m = /\n      falloutzp_demo: \{([\s\S]*?)\n      \},/.exec(src.replace(/\r\n/g, '\n'));
  assert.ok(m, 'catalog entry');
  const body = m[1];
  assert.match(body, /cdDemo: true/);
  assert.doesNotMatch(body, /steam: true/);
  assert.match(body, /title: 'Fallout: Запорожье Demo'/);
  assert.match(body, /genre: '[^']+'/);
  const tags = JSON.parse(body.match(/tags: (\[[^\]]*\])/)[1].replace(/'/g, '"'));
  assert.ok(tags.length >= 3 && tags.length <= 5 && tags.every(t => t.length <= 24));
  const shots = JSON.parse(body.match(/shots: (\[[^\]]*\])/)[1].replace(/'/g, '"'));
  assert.ok(shots.length >= 2 && shots.every(t => t.length <= 32));
  for (let i = 1; i <= 2; i++) {
    const f = path.join(ROOT, 'content', 'igromania', 'demos', `falloutzp_demo-${i}.jpg`);
    assert.ok(fs.existsSync(f), 'screenshot ' + i);
    const b = fs.readFileSync(f);
    let k = 2, size = null;
    while (k < b.length && !size) { const mk = b[k + 1]; if (mk >= 0xc0 && mk <= 0xc2) size = [b.readUInt16BE(k + 7), b.readUInt16BE(k + 5)]; k += 2 + b.readUInt16BE(k + 2); }
    assert.deepEqual(size, [640, 480]);
  }
  const state = src.slice(src.indexOf('loadState()'), src.indexOf('loadState()') + 800);
  assert.ok(!/falloutzp/.test(state), 'not preinstalled');
  assert.ok(!/falloutzpGranted/.test(src));
  const recipes = require(path.join(ROOT, 'tools', 'steam-shots-recipes.cjs'));
  assert.ok(recipes.falloutzp_demo && recipes.falloutzp_demo.shots.length === 2);
});

function findComment(src, css) {
  const BS = String.fromCharCode(92);
  let i = 0, q = null;
  const prevSig = k => { let j = k - 1; while (j >= 0 && ' \t\r\n'.includes(src[j])) j--; return j >= 0 ? src[j] : ''; };
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (q) {
      if (c === BS) { i += 2; continue; }
      if (c === q) q = null;
      i++;
      continue;
    }
    if (!css && (c === '"' || c === "'" || c === '`')) { q = c; i++; continue; }
    if (c === '/' && n === '*') return i;
    if (!css && c === '/' && n === '/') return i;
    if (!css && c === '/' && ('(,=:[!&|?{};+-*%<>~^'.includes(prevSig(i)) || src.slice(Math.max(0, i - 8), i).trimEnd().endsWith('return'))) {
      i++;
      let cls = false;
      while (i < src.length && src[i] !== '\n') {
        const d = src[i];
        if (d === BS) { i += 2; continue; }
        if (d === '[') cls = true;
        else if (d === ']') cls = false;
        else if (d === '/' && !cls) break;
        i++;
      }
      i++;
      continue;
    }
    i++;
  }
  return -1;
}

test('source files contain no comments', () => {
  const files = fs.readdirSync(DIR).map(f => path.join(DIR, f)).concat([path.join(ROOT, 'js', 'apps', 'falloutzp-app.js'), path.join(ROOT, 'tools', 'falloutzp-shots.cjs'), path.join(ROOT, 'tools', 'zp-import.cjs'), path.join(ROOT, 'css', 'apps', 'falloutzp.css'), __filename]).filter(f => fs.existsSync(f));
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const at = findComment(src, f.endsWith('.css'));
    assert.equal(at, -1, `comment in ${path.basename(f)} at line ${src.slice(0, Math.max(0, at)).split('\n').length}`);
  }
});

test('game texts use Microslop and Win names', () => {
  const files = fs.readdirSync(DIR).filter(f => f !== 'zp-geo.js').map(f => path.join(DIR, f)).concat([path.join(ROOT, 'FALLOUT-ZP.md')]);
  const bad = new RegExp('Micro' + 'soft|MICRO' + 'SOFT|\\bWin' + 'dows\\b|\\bWIN' + 'DOWS\\b');
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    assert.ok(!bad.test(src), 'forbidden name in ' + path.basename(f));
  }
});

console.log(`${passed} tests passed`);
