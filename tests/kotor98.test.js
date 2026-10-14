const assert = require('node:assert/strict');
const path = require('path');
const DIR = path.join(__dirname, '../js/apps/kotor98');
const FILES = ['kt-core', 'kt-data', 'kt-rules', 'kt-dialog', 'kt-maps', 'kt-game', 'kt-combat', 'kt-pazaak', 'kt-swoop', 'kt-story-upper', 'kt-story-lower', 'kt-story-under', 'kt-story-end'];
let K;
for (const f of FILES) K = require(path.join(DIR, f + '.js'));

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();
const VERBOSE = process.argv.includes('-v');

const SPEAKERS = new Set(['self', 'narr', 'player'].concat(K.PARTY_IDS).concat(Object.keys(K.NPCS)).concat(['davik', 'calo']));

for (const [id, a] of Object.entries(K.AREAS)) {
  const w = a.rows[0].length;
  a.rows.forEach((r, i) => ok(r.length === w, 'row width ' + id + ' row ' + i + ' = ' + r.length + ' != ' + w));
  for (const r of a.rows) for (const ch of r) ok(K.TILES[ch] || (a.marks && a.marks[ch]), 'tile/mark ' + id + ' "' + ch + '"');
  for (const [ch, m] of Object.entries(a.marks || {})) {
    ok(a.rows.some(r => r.includes(ch)), 'mark used ' + id + ' ' + ch);
    ok(['npc', 'foe', 'box', 'exit', 'door', 'trig', 'use', 'mine', 'spot'].includes(m.t), 'mark type ' + id + ' ' + ch);
    if (m.t === 'npc') ok(K.NPCS[m.id], 'npc def ' + m.id);
    if (m.t === 'foe') ok(K.TEMPLATES[m.tpl], 'foe tpl ' + m.tpl);
    if (m.t === 'exit') {
      ok(K.AREAS[m.to], 'exit target ' + id + ' -> ' + m.to);
      ok(K.AREAS[m.to].rows.some(r => r.includes(m.at)), 'exit arrive mark ' + m.to + ':' + m.at);
    }
    if (m.t === 'box') for (const [it] of m.loot || []) ok(K.ITEMS[it], 'loot item ' + it);
    if (m.t === 'use') ok(K.DIALOGS[m.dlg], 'use dialog ' + m.dlg);
    if (m.t === 'trig') ok(K.SCRIPTS[m.run], 'trig script ' + m.run);
    for (const c of (m.req || []).concat(m.unless || [])) ok(K.validCond(c), 'mark cond ' + c);
    if (m.key) ok(K.ITEMS[m.key], 'door key ' + m.key);
  }
  if (a.onEnter) ok(K.SCRIPTS[a.onEnter], 'onEnter ' + a.onEnter);
  ok(K.THEMES[a.theme], 'theme ' + id);
  const h = a.rows.length;
  const walk = (x, z) => {
    if (x < 0 || z < 0 || x >= w || z >= h) return false;
    const ch = a.rows[z][x];
    const m = a.marks && a.marks[ch];
    if (m) return m.t !== 'exit' && m.t !== 'box' && m.t !== 'use';
    return !!(K.TILES[ch] && K.TILES[ch].walk);
  };
  const seen = new Uint8Array(w * h);
  const q = [];
  for (const [ch, m] of Object.entries(a.marks || {})) {
    if (m.t !== 'exit' && m.t !== 'spot') continue;
    for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) if (a.rows[z][x] === ch) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (walk(x + dx, z + dz) && !seen[(z + dz) * w + x + dx]) { seen[(z + dz) * w + x + dx] = 1; q.push([x + dx, z + dz]); }
  }
  while (q.length) {
    const [x, z] = q.pop();
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (walk(nx, nz) && !seen[nz * w + nx]) { seen[nz * w + nx] = 1; q.push([nx, nz]); }
    }
  }
  for (let z = 0; z < h; z++) for (let x = 0; x < w; x++) {
    const ch = a.rows[z][x];
    const m = a.marks && a.marks[ch];
    if (!m || m.t === 'door') continue;
    const reach = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1], [2, 0], [-2, 0], [0, 2], [0, -2]].some(([dx, dz]) => { const nx = x + dx, nz = z + dz; return nx >= 0 && nz >= 0 && nx < w && nz < h && seen[nz * w + nx]; });
    ok(reach, 'reachable ' + id + ' ' + ch + ' at ' + x + ',' + z);
  }
}

for (const [id, n] of Object.entries(K.NPCS)) {
  if (n.dlg) ok(K.DIALOGS[n.dlg], 'npc dialog ' + id + ' ' + n.dlg);
  if (n.tpl) ok(K.TEMPLATES[n.tpl], 'npc tpl ' + id);
  if (n.m) ok(K.MODELS[n.m], 'npc model ' + id + ' ' + n.m);
  if (n.joins) ok(K.PARTY_IDS.includes(n.joins), 'joins ' + id);
}
for (const [id, t] of Object.entries(K.TEMPLATES)) {
  if (id === 'player') continue;
  for (const s of Object.values(t.equip || {})) ok(K.ITEMS[s], 'tpl equip ' + id + ' ' + s);
  for (const [it] of t.loot || []) ok(K.ITEMS[it], 'tpl loot ' + id + ' ' + it);
  for (const f of t.feats || []) ok(K.FEATS[f], 'tpl feat ' + id + ' ' + f);
  for (const p of t.powers || []) ok(K.POWERS[p], 'tpl power ' + id + ' ' + p);
  ok(K.MODELS[t.m || 'citizen_m'], 'tpl model ' + id);
  ok(K.CLASSES[t.cls], 'tpl class ' + id);
}
for (const [id, s] of Object.entries(K.SHOPS)) for (const it of Object.keys(s.stock)) ok(K.ITEMS[it], 'shop item ' + id + ' ' + it);
for (const o of Object.values(K.PAZAAK_OPP)) { for (const c of o.deck) ok(K.ITEMS[c] && K.ITEMS[c].card, 'pazaak card ' + c); if (o.after) ok(K.DIALOGS[o.after], 'pazaak after ' + o.after); }

for (const [id, d] of Object.entries(K.DIALOGS)) {
  ok(d.starts.length > 0, 'dialog starts ' + id);
  const refs = [];
  for (const s of d.starts) { ok(d.nodes[s.node], 'start node ' + id + '.' + s.node); refs.push(...s.conds.map(c => ['c', c]), ...s.acts.map(a => ['a', a])); }
  for (const n of Object.values(d.nodes)) {
    ok(SPEAKERS.has(n.who) || K.TEMPLATES[n.who], 'speaker ' + id + '.' + n.id + ' ' + n.who);
    ok(n.text.length > 0, 'node text ' + id + '.' + n.id);
    if (n.cont) ok(n.cont === 'END' || d.nodes[n.cont], 'cont ' + id + '.' + n.id + ' -> ' + n.cont);
    refs.push(...n.acts.map(a => ['a', a]), ...(n.contActs || []).map(a => ['a', a]));
    for (const r of n.replies) {
      ok(r.target === 'END' || d.nodes[r.target], 'reply target ' + id + '.' + n.id + ' -> ' + r.target);
      if (r.check) { ok(d.nodes[r.check.fail] || r.check.fail === 'END', 'check fail ' + id + '.' + r.check.fail); ok(K.SKILL_NAMES[r.check.skill], 'check skill ' + r.check.skill); }
      ok(r.text.length > 0, 'reply text ' + id + '.' + n.id);
      refs.push(...r.conds.map(c => ['c', c]), ...r.acts.map(a => ['a', a]));
    }
  }
  for (const [k, v] of refs) {
    ok(k === 'c' ? K.validCond(v) : K.validAct(v), 'syntax ' + id + ' ' + v);
    const p = v.replace(/^!/, '').split(':');
    if (['give', 'take', 'has'].includes(p[0])) ok(K.ITEMS[p[1]], 'item ref ' + id + ' ' + v);
    if (p[0] === 'q') { const m = v.replace(/^!/, '').match(/^q:([a-z0-9_]+)(?:>=|<=|=|<|>)(\d+)$/); ok(K.QUESTS[m[1]] && (k === 'c' || K.QUESTS[m[1]].s[m[2]]), 'quest ref ' + id + ' ' + v); }
    if (p[0] === 'join' || p[0] === 'party' && p[1] || p[0] === 'joined') ok(K.PARTY_IDS.includes(p[1]), 'party ref ' + id + ' ' + v);
    if (p[0] === 'shop') ok(K.SHOPS[p[1]], 'shop ref ' + v);
    if (p[0] === 'pazaak') ok(K.PAZAAK_OPP[p[1]], 'pazaak ref ' + v);
    if (p[0] === 'duel') ok(K.TEMPLATES[p[1]], 'duel ref ' + v);
    if (p[0] === 'run' || p[0] === 'now') ok(K.SCRIPTS[p[1]], 'script ref ' + id + ' ' + v);
    if (p[0] === 'goto') ok(K.AREAS[p[1]], 'goto ref ' + v);
  }
}

for (const cls of K.PLAYER_CLASSES) {
  K.TEMPLATES.tmp = { n: 'T', cls, lvl: 1, attrs: K.defaultAttrs(cls), equip: { r: 'blaster_pistol', body: 'combat_suit' }, m: 'player_m', feats: K.defaultFeats(cls), skills: K.defaultSkills(cls), party: true };
  const c = K.makeCreature('tmp', { faction: 'party' });
  K.levelTo(c, 8);
  ok(c.level === 8 && c.maxHp > 30, 'level up ' + cls + ' hp ' + c.maxHp);
  ok(K.defense(c) >= 12 && K.defense(c) < 30, 'defense ' + cls);
  const rng = new K.RNG(5);
  const foe = K.makeCreature('sith_trooper');
  let hits = 0;
  for (let i = 0; i < 400; i++) { const r = K.rollAttack(rng, c, foe, 'r', null, {}); if (r.hit) { hits++; ok(r.dmg >= 1, 'dmg >= 1'); } }
  ok(hits > 150 && hits < 390, 'hit rate ' + cls + ' ' + hits);
}
delete K.TEMPLATES.tmp;
ok(!K.canEquip(K.makeCreature('t3'), K.ITEMS.blaster_pistol, 'r').ok, 'droid cannot use pistol');
ok(!K.canEquip(K.makeCreature('carth'), K.ITEMS.bastila_saber, 'r').ok, 'saber jedi only');
ok(K.canEquip(K.makeCreature('zaalbar'), K.ITEMS.bowcaster, 'r').ok, 'wookiee bowcaster');

{
  let wins = 0;
  for (let s = 1; s <= 30; s++) {
    const p = new K.Pazaak({ rng: new K.RNG(s), playerSide: ['card_p1', 'card_p2', 'card_p3', 'card_m1', 'card_m2', 'card_m3', 'card_p4', 'card_m4', 'card_f1', 'card_f2'], opp: K.PAZAAK_OPP.lena, wager: 50, oppId: 'lena' });
    let n = 0;
    while (p.phase !== 'end' && n++ < 800) {
      if (p.phase === 'setEnd') { p.nextSet(); continue; }
      if (p.turn === 'opp') { p.aiTurn(); continue; }
      const sd = p.side.player;
      const opp = p.side.opp;
      let played = false;
      for (let i = 0; i < p.hands.player.length && !played; i++) {
        const c = p.hands.player[i];
        for (const sg of c.kind === '±' ? [1, -1] : [1]) {
          const v = c.kind === '±' ? c.v * sg : c.v;
          const t = sd.total + v;
          if (t <= 20 && (t >= 19 || sd.total > 20)) { p.playCard('player', i, sg); played = true; break; }
        }
      }
      if (p.phase !== 'turn') continue;
      if (sd.total > 20) p.endTurn('player');
      else if (sd.total >= 18 || (opp.stood && sd.total > opp.total)) p.stand('player');
      else p.endTurn('player');
    }
    ok(p.phase === 'end' && p.winner, 'pazaak finishes');
    if (p.winner === 'player') wins++;
  }
  ok(wins >= 6 && wins <= 26, 'pazaak balance ' + wins + '/30');
  const times = [];
  for (let s = 1; s <= 8; s++) {
    const w = new K.Swoop({ seed: s });
    let n = 0;
    while (!w.finished && n++ < 6000) { const a = w.autopilot(); if (a.shift) w.shift(); w.update(1 / 30, a); }
    ok(w.finished, 'swoop finishes');
    times.push(w.time);
  }
  ok(Math.max(...times) < 25, 'swoop autopilot beats rival: ' + times.map(t => t.toFixed(1)).join(','));
}

const g = new K.Game({ seed: +(process.env.KT_SEED || 11), autoLeader: true, autoLevel: true, headless: true });
g.newGame({ cls: process.env.KT_CLS || 'soldier', name: 'Тест' });
const DT = 0.05;
let simTime = 0;
function step(n) { for (let i = 0; i < n; i++) { g.update(DT); simTime += DT; g.drain(); } }
function fail(msg) {
  console.log('FAIL: ' + msg);
  console.log('area=' + g.area.id + ' mode=' + g.mode + ' main=' + g.quests.main + ' combat=' + g.combat);
  console.log('party: ' + g.partyCreatures().map(c => c.name + ' ' + c.hp + '/' + c.maxHp + ' @' + c.x.toFixed(1) + ',' + c.z.toFixed(1) + (c.dead ? ' DEAD' : '')).join('; '));
  if (g.dialog) console.log('dialog ' + g.dialog.id + '.' + g.dialog.node.id + ': ' + g.dialog.replies.map(r => r.text).join(' | '));
  console.log(g.log.slice(-25).map(l => '  ' + l.text).join('\n'));
  throw new Error(msg);
}
function dialog(prefs) {
  prefs = (prefs || []).slice();
  let guard = 0;
  while (g.dialog && guard++ < 60) {
    const rs = g.dialog.replies;
    let i = 0;
    if (rs.length > 1) {
      i = 0;
      for (let k = 0; k < prefs.length; k++) {
        const j = rs.findIndex(r => r.text.includes(prefs[k]));
        if (j >= 0) { i = j; prefs.splice(0, k + 1); break; }
      }
    }
    g.choose(i);
    g.drain();
  }
  if (g.mode === 'shop') g.closeShop();
}
function waitFor(pred, sec, what) {
  const n = Math.ceil(sec / DT);
  for (let i = 0; i < n; i++) {
    if (pred()) return true;
    if (g.mode === 'dialog' && !what.includes('dialog')) dialog();
    step(1);
  }
  if (!pred()) fail('timeout: ' + what);
}
function talk(npcId, prefs) {
  for (let tries = 0; tries < 4; tries++) {
    const c = g.npc(npcId);
    if (!c) fail('no npc ' + npcId);
    g.interact(c);
    waitFor(() => g.mode === 'dialog', 90, 'dialog with ' + npcId);
    const own = g.dialog.owner;
    if (own && own.npcId === npcId || own && own.pid && K.NPCS[npcId] && K.NPCS[npcId].joins === own.pid) { dialog(prefs); return; }
    dialog();
  }
  fail('could not talk to ' + npcId);
}
function obj(pred, what) {
  const o = g.objects.find(pred);
  if (!o) fail('no object ' + what);
  return o;
}
function approach(o, done, what) {
  for (let tries = 0; tries < 6 && !done(); tries++) {
    g.interact(o);
    for (let i = 0; i < 2400 && !done(); i++) {
      step(1);
      if (done()) break;
      if (g.mode === 'dialog' && !(g.dialog.owner === o)) dialog();
      if (g.combat) { fightFoes(c => c.aggro, 'ambush near ' + what); break; }
      if (!g.leader.interact && !g.leader.path) break;
    }
  }
  if (!done()) fail('could not reach ' + what);
}
function lootBox(pred, what) {
  const o = obj(pred, what);
  approach(o, () => g.mode === 'loot', what);
  g.takeLoot();
  g.closeLoot();
}
function use(pred, what, prefs) {
  const o = obj(pred, what);
  approach(o, () => g.mode === 'dialog' && g.dialog.owner === o, what);
  dialog(prefs);
}
function go(to) {
  clearArea(28);
  const o = obj(x => x.type === 'exit' && x.def.to === to, 'exit to ' + to);
  for (let tries = 0; tries < 5 && g.area.id !== to; tries++) {
    g.interact(o);
    for (let i = 0; i < 2400 && g.area.id !== to; i++) {
      step(1);
      if (g.mode === 'dialog') dialog();
      if (g.combat) { fightFoes(c => c.aggro, 'ambush on way to ' + to); break; }
      if (!g.leader.interact && !g.leader.path && !g.pendingTravel) break;
    }
  }
  if (g.area.id !== to) fail('travel to ' + to);
  step(2);
  if (g.mode === 'dialog') dialog();
  ok(true, 'travel ' + to);
}
function heal() {
  for (let i = 0; i < 5 && g.combat; i++) step(40);
  if (g.canRest()) { g.rest(); return; }
  for (let i = 0; i < 90 && !g.combat && g.partyCreatures().some(c => c.hp < c.maxHp * 0.9); i++) step(20);
}
function fightFoes(pred, what, maxSec) {
  let t = 0;
  while (t < (maxSec || 240)) {
    if (g.mode === 'dialog') dialog();
    if (g.mode === 'loot') g.closeLoot();
    if (g.mode === 'shop') g.closeShop();
    const foes = g.creatures.filter(c => !c.dead && c.faction === 'hostile' && pred(c));
    if (!foes.length) break;
    if (!g.combat) {
      if (g.partyCreatures().some(c => c.hp < c.maxHp * 0.7)) heal();
      const L = g.leader;
      foes.sort((a, b) => K.dist(a.x, a.z, L.x, L.z) - K.dist(b.x, b.z, L.x, L.z));
      g.cmdMove(foes[0].x, foes[0].z);
    }
    step(10);
    t += 0.5;
    if (g.mode === 'gameover') fail('party died fighting ' + what);
  }
  if (g.creatures.some(c => !c.dead && c.faction === 'hostile' && pred(c))) fail('could not defeat ' + what);
  waitFor(() => !g.combat, 60, 'combat end ' + what);
  loot(o => K.dist(o.x, o.z, g.leader.x, g.leader.z) < 16);
  heal();
  ok(true, 'defeated ' + what);
}
function clearArea(radius) {
  const L = g.leader;
  if (g.creatures.some(c => !c.dead && c.faction === 'hostile' && c.aggro)) fightFoes(c => c.aggro, 'aggro foes');
}
function loot(pred) {
  for (const o of g.objects.filter(o => o.type === 'corpse' && (!pred || pred(o)))) {
    g.interact(o);
    for (let i = 0; i < 600 && g.mode !== 'loot'; i++) { step(1); if (g.mode === 'dialog') dialog(); if (!g.leader.interact && !g.leader.path) break; }
    if (g.mode !== 'loot') continue;
    g.takeLoot();
    g.closeLoot();
  }
}
function stage(n, what) { ok((g.quests.main || 0) >= n, 'main stage ' + n + ' ' + what + ' (got ' + g.quests.main + ')'); if (VERBOSE) console.log('stage', g.quests.main, what, 'lvl', g.player.level, 'xp', g.xp, 'cr', g.credits, 't', simTime.toFixed(0)); }

waitFor(() => g.mode === 'dialog' || g.flags.carth_intro, 5, 'intro dialog');
dialog(['Кто ты', 'Что случилось', 'Где сейчас', 'Значит, идём', 'Идём вместе']);
ok(g.roster.carth && g.active.includes('carth'), 'carth joined');
lootBox(o => o.type === 'box' && o.key.startsWith('l@'), 'apartment locker');
ok(g.countItem('combat_suit') === 1, 'got suit');
g.equip(g.player, 'combat_suit', 'body');
ok(g.player.equip.body === 'combat_suit', 'equipped suit');
g.cmdMove(20.5, 4.5);
waitFor(() => g.mode === 'dialog', 60, 'raid dialog');
dialog(['Эти люди']);
fightFoes(c => c.group === 'raid', 'raid');
ok(g.flags.raid_done && g.quests.duros === 20, 'raid quest');
talk('duros_1', ['Спасибо']);
lootBox(o => o.type === 'box' && o.key.startsWith('c@'), 'rodian locker');
go('upper_city');
talk('zelka', ['Кто такие ракгулы', 'Я поищу']);
ok(g.quests.serum === 10, 'serum quest');
go('upper_cantina');
talk('ajuur', ['Я хочу драться', 'Марл']);
waitFor(() => g.area.id === 'duel_ring', 5, 'duel ring');
waitFor(() => g.area.id === 'upper_cantina', 120, 'duel finished');
dialog(['Пока хватит', 'Позже']);
ok(g.flags.duel_last_win !== undefined, 'duel vs Marl resolved');
go('upper_city');
function shopBuy(list) { for (const [id, n] of list) for (let i = 0; i < n; i++) g.buy(id); g.closeShop(); }
g.openShop('kebla');
shopBuy([['medpac', 5], ['frag', 2]]);
ok(g.countItem('medpac') >= 5, 'bought medpacs');
go('lower_city');
stage(20, 'lower city');
g.cmdMove(14.5, 8.5);
waitFor(() => g.mode === 'dialog', 30, 'dialog vulkar toll');
dialog(['Попробуй']);
fightFoes(c => c.group === 'lower_gang', 'vulkar gang');
go('javyar');
g.cmdMove(12.5, 12.5);
waitFor(() => g.flags.calo_scene_done, 40, 'calo scene');
step(60);
go('lower_city');
go('bek_base');
talk('gadon', ['ищу девушку', 'Помоги', 'Как попасть', 'Я достану']);
stage(30, 'gadon');
go('lower_city');
go('javyar');
talk('mission', ['Покажешь', 'Договорились']);
ok(g.active.includes('mission'), 'mission in party');
stage(40, 'mission');
go('lower_city');
go('undercity');
stage(50, 'undercity');
talk('rukil', ['Земля', 'Я найду']);
lootBox(o => o.type === 'box' && o.key.startsWith('k@'), 'scout corpse');
ok(g.quests.serum === 20, 'serum found');
lootBox(o => o.type === 'box' && o.key.startsWith('j@'), 'journal 1');
go('sewers');
stage(55, 'sewers');
fightFoes(c => c.group === 'gam' || c.group === 'sw1', 'gamorreans', 400);
ok(g.flags.gam_dead, 'gamorreans dead');
use(o => o.type === 'use' && o.def.dlg === 'cell_console', 'cell console', ['Открыть']);
talk('zaalbar_cell', ['Добро пожаловать']);
stage(60, 'zaalbar');
lootBox(o => o.type === 'box' && o.key.startsWith('j@'), 'journal 2');
lootBox(o => o.type === 'box' && o.key.startsWith('c@'), 'vulkar corpse');
ok(g.countItem('remains') === 1, 'remains');
if (!g.countItem('frag')) g.addItem('frag', 1);
use(o => o.type === 'use' && o.def.dlg === 'bait_spot', 'bait', ['Спрятать']);
waitFor(() => g.flags.rancor_dead, 40, 'rancor dead');
go('vulkar_base');
stage(70, 'vulkar base');
fightFoes(c => c.group === 'sec', 'security', 400);
loot();
ok(g.countItem('garage_pass'), 'garage pass');
use(o => o.type === 'use' && o.def.dlg === 'vulkar_terminal', 'vulkar terminal', []);
fightFoes(c => c.group === 'garage', 'garage', 500);
loot();
ok(g.countItem('accelerator'), 'accelerator');
stage(80, 'accelerator');
lootBox(o => o.type === 'box' && o.key.startsWith('j@'), 'journal 3');
go('lower_city');
ok(g.flags.vulkar_door_open, 'vulkar door flag');
go('bek_base');
talk('gadon', ['Я выиграю']);
stage(90, 'racer');
go('lower_city');
go('swoop');
talk('swoop_official', ['Я готов']);
ok(g.mode === 'swoop' && g.swoop, 'swoop mode');
while (!g.swoop.finished) { const a = g.swoop.autopilot(); if (a.shift) g.swoop.shift(); g.swoop.update(1 / 30, a); }
g.endSwoop();
dialog();
ok(g.flags.swoop_won, 'swoop won');
ok(g.roster.bastila && g.active.includes('bastila'), 'bastila joined');
fightFoes(c => c.group === 'brejik', 'brejik', 400);
waitFor(() => g.mode === 'dialog' || g.quests.main >= 100, 10, 'bastila dialog');
dialog();
stage(100, 'bastila');
go('lower_city');
go('javyar');
talk('canderous', ['Слушаю', 'Как попасть', 'Договорились']);
stage(110, 'canderous deal');
go('lower_city');
go('upper_city');
if (VERBOSE) console.log('credits before T3', g.credits);
ok(g.credits >= 1500, 'enough credits for T3: ' + g.credits);
talk('droid_merchant', ['Мне нужен дроид', 'Беру за 1500']);
ok(g.roster.t3 && g.active.includes('t3'), 't3 joined');
stage(120, 't3');
g.setActive(['t3', 'bastila']);
go('sith_base');
fightFoes(() => true, 'sith base', 900);
loot();
ok(g.countItem('launch_codes'), 'launch codes');
stage(130, 'codes');
go('upper_city');
go('lower_city');
go('javyar');
talk('canderous', ['Веди']);
stage(140, 'canderous joined');
ok(g.active.includes('canderous'), 'canderous active');
g.setActive(['canderous', 't3']);
go('lower_city');
go('davik_estate');
g.cmdMove(30.5, 29.5);
waitFor(() => g.flags.davik_tour, 60, 'davik tour');
dialog();
stage(150, 'tour');
use(o => o.type === 'use' && o.def.dlg === 'davik_terminal', 'davik terminal', ['Т3']);
stage(160, 'hangar code');
g.setActive(['canderous', 'bastila']);
const hangarDoor = g.doors.find(d => d.keyItem === 'hangar_code');
g.interact(Object.assign({ x: hangarDoor.x + 0.5, z: hangarDoor.z + 1.5 }, { type: 'door' }));
g.useDoor(hangarDoor);
ok(hangarDoor.open, 'hangar open');
g.cmdMove(30.5, 14.5);
waitFor(() => g.flags.davik_confronted, 60, 'confront');
dialog();
fightFoes(() => true, 'davik', 600);
waitFor(() => g.flags.hawk_ready || g.mode === 'dialog', 30, 'bombardment');
dialog();
ok(g.flags.hawk_ready, 'hawk ready');
use(o => o.type === 'use' && o.def.dlg === 'hawk_ramp', 'hawk ramp', ['На борт']);
ok(g.mode === 'ending', 'ending mode');
stage(200, 'ending');

const save = JSON.parse(JSON.stringify(g.serialize()));
const g2 = new K.Game({ seed: 2, headless: true });
g2.deserialize(save);
ok(g2.area.id === g.area.id && g2.player.level === g.player.level && g2.xp === g.xp && g2.inv.length === g.inv.length, 'save roundtrip');
ok(Object.keys(g2.roster).length === 7, 'full party in save');

console.log('kotor98: ' + checks + ' checks passed in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's; final level ' + g.player.level + ', xp ' + g.xp + ', credits ' + g.credits + ', sim ' + (simTime / 60).toFixed(1) + ' min, kills ' + g.stats.kills + ', party downs ' + g.stats.deaths);
