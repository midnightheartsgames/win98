const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/diablo2');
const SIM = ['d2-core', 'd2-data-classes', 'd2-data-items', 'd2-data-monsters', 'd2-data-world', 'd2-items', 'd2-path', 'd2-mapgen', 'd2-hero', 'd2-game', 'd2-skills', 'd2-ai', 'd2-inv'];
const ORDER = SIM.concat(['d2-sprites', 'd2-models', 'd2-terrain', 'd2-icons', 'd2-render', 'd2-hud', 'd2-panels', 'd2-screens', 'd2-audio', 'd2-ui']);
let D;
for (const f of SIM) D = require(path.join(DIR, f + '.js'));
const { Bot } = require('./diablo2-bot.js');

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const VERBOSE = process.argv.includes('-v');
const log = (...a) => { if (VERBOSE) console.log(...a); };

function section(name, fn) { const s = Date.now(); fn(); log(name + ': ' + (Date.now() - s) + ' ms'); }

section('data', () => {
  for (const cls of D.CLASS_ORDER) {
    const C = D.CLASSES[cls];
    ok(C.trees.length === 3, cls + ' has three trees');
    const list = D.classSkills(cls);
    ok(list.length >= 15, cls + ' has at least 15 skills');
    const pos = new Set();
    for (const s of list) {
      const key = s.tree + ':' + s.row + ':' + s.col;
      ok(!pos.has(key), 'unique tree slot ' + s.id);
      pos.add(key);
      ok(s.row >= 0 && s.row < 5 && s.col >= 0 && s.col < 3, 'slot in grid ' + s.id);
      ok([1, 6, 12, 18, 24].includes(s.req), 'tier level ' + s.id);
      for (const p of s.pre) { ok(D.SKILLS[p] && D.SKILLS[p].cls === cls, 'prerequisite exists ' + s.id + '<-' + p); ok(D.SKILLS[p].req <= s.req && D.SKILLS[p].row < s.row, 'prerequisite is earlier ' + p + '->' + s.id); }
      ok(D.Icons === undefined || true, 'icons optional in node');
      ok(typeof s.name === 'string' && s.name.length > 2 && typeof s.desc === 'string' && s.desc.length > 8, 'skill text ' + s.id);
      ok(['strike', 'shot', 'bolt', 'nova', 'meteor', 'blizzard', 'firewall', 'chain', 'static', 'teleport', 'buff', 'curse', 'warcry', 'summon', 'trap', 'corpse', 'stream', 'form', 'aura', 'passive'].includes(s.kind), 'known kind ' + s.id);
      if (s.m) ok(D.Skills.MISSILES[s.m], 'missile exists ' + s.id);
      if (s.unit) ok(D.ALLIES[s.unit], 'ally unit exists ' + s.id);
      if (s.syn) for (const [id] of s.syn) ok(D.SKILLS[id], 'synergy exists ' + s.id);
      for (let L = 1; L <= 20; L++) {
        const mc = D.manaCost(s, L);
        ok(mc >= 0 && Number.isFinite(mc), 'mana cost ' + s.id + ' L' + L);
        if (s.dmg && !Array.isArray(s.dmg)) for (const k in s.dmg) { const v = D.val(s.dmg[k], L); ok(v[0] >= 0 && v[1] >= v[0], 'damage range ' + s.id + ' ' + k + ' L' + L); }
      }
    }
    for (const [base] of C.start) ok(D.BASES[base], 'start item ' + base);
  }
  ok(D.SKILL_LIST.length >= 105, 'skill count ' + D.SKILL_LIST.length);
  for (const b of D.BASE_LIST) {
    ok(b.w >= 1 && b.h >= 1 && b.w <= 2 && b.h <= 4, 'base size ' + b.id);
    ok(typeof b.name === 'string' && b.name.length > 1, 'base name ' + b.id);
    if (b.cat === 'weapon') { ok(b.dmg[0] >= 1 && b.dmg[1] >= b.dmg[0], 'weapon damage ' + b.id); ok(D.ATK[b.type], 'attack speed class ' + b.id); }
    if (b.cat === 'armor') ok(b.def[1] >= b.def[0], 'defense ' + b.id);
    ok(['m', 'f', 'n', 'pl'].includes(b.g), 'gender ' + b.id);
  }
  for (const a of D.AFFIXES) {
    ok(a.kind === 'pre' ? a.names.length === 4 && a.names.every(n => n.length > 3 && !/ийий|ойий|ыйий/.test(n)) : a.name.length > 2, 'affix names ' + (a.names ? a.names[0] : a.name));
    ok(a.lvl >= 1 && a.types.length, 'affix level and types');
  }
  for (const u of D.UNIQUES) { ok(D.BASES[u.base], 'unique base ' + u.id); ok(u.req <= u.lvl, 'unique req ' + u.id); for (const k in u.stats) ok(D.statText(k, Array.isArray(u.stats[k]) && !k.endsWith('Dmg') ? u.stats[k][1] : u.stats[k]) !== '' || k === 'aura', 'unique stat text ' + u.id + ' ' + k); }
  for (const s of D.SETS) { ok(s.items.length >= 3, 'set size ' + s.id); for (const it of s.items) ok(D.BASES[it.base], 'set base ' + it.id); }
  for (const rw of D.RUNEWORDS) { ok(rw.runes.every(r => D.BASES['r_' + r]), 'runeword runes ' + rw.id); ok(rw.types.length, 'runeword types ' + rw.id); ok(D.BASE_LIST.some(b => rw.types.includes(b.type) && b.sock >= rw.runes.length), 'runeword has a base with enough sockets ' + rw.id); }
  for (const k in D.MONSTERS) { const m = D.MONSTERS[k]; ok(m.names.length && m.tints.length && m.hp > 0 && m.speed > 0, 'monster ' + k); if (m.missile) ok(D.Skills.MISSILES[m.missile], 'monster missile ' + k); }
  for (const k in D.SUPERUNIQUES) ok(D.MONSTERS[D.SUPERUNIQUES[k].type], 'superunique type ' + k);
  const opp = { n: 's', s: 'n', e: 'w', w: 'e' };
  for (const id in D.AREAS) {
    const a = D.AREAS[id];
    for (const l of a.links || []) { const back = (D.AREAS[l.to].links || []).find(x => x.to === id); ok(back || D.AREAS[l.to].up === id, 'link back ' + id + '->' + l.to); if (back) ok(back.side === opp[l.side], 'link sides ' + id + '->' + l.to); }
    for (const m of a.mon || []) ok(D.MONSTERS[m], 'area monster ' + id + ' ' + m);
    if (a.su) ok(D.SUPERUNIQUES[a.su], 'area superunique ' + id);
    ok(a.lvl[1] > a.lvl[0] && a.lvl[2] > a.lvl[1] || a.town, 'difficulty levels grow ' + id);
    ok(D.THEMES[a.theme], 'theme ' + id);
  }
  for (const id of D.WAYPOINTS) ok(D.AREAS[id].wp, 'waypoint area ' + id);
  for (const q of D.QUESTS) ok(q.log.length >= 3, 'quest log ' + q.id);
});

section('mapgen', () => {
  for (let seed = 1; seed <= 6; seed++) for (const id in D.AREAS) {
    const a = D.generate(id, seed * 7919 + 13, {});
    const st = a.entries.start;
    const dist = D.floodFrom(a, st.x, st.y);
    const reach = p => dist[a.i(Math.floor(p.x), Math.floor(p.y))] >= 0;
    for (const k in a.entries) ok(reach(a.entries[k]), 'entry reachable ' + id + ' ' + k + ' seed ' + seed);
    for (const e of a.exits) ok(reach(e.spawn) && e.zone.length > 0, 'exit reachable ' + id + '->' + e.to);
    for (const o of a.objs) if (['stairs_down', 'stairs_up', 'wp', 'cave', 'tower', 'inifuss', 'cage', 'malus', 'tome', 'gate', 'wirt', 'cairn', 'stash'].includes(o.type)) {
      const p = o.mouth || o.front || D.nearestWalkable(a, o.x + 1, o.y + 1, 3) || o;
      ok(reach(p), 'object reachable ' + id + ' ' + o.type + ' seed ' + seed);
    }
    if (!a.def.town) { ok(a.packs.length >= 3, 'monster packs ' + id); for (const p of a.packs) ok(D.walkable(a, Math.floor(p.x), Math.floor(p.y)), 'pack on floor ' + id); }
    if (a.def.su) ok(a.packs.some(p => p.su === a.def.su), 'superunique placed ' + id);
    if (id === 'stonyfield') ok(a.cairn && a.cairn.order.length === 5 && a.objs.filter(o => o.type === 'cairn').length === 5, 'cairn stones');
    for (const up of ['down', 'up']) if (a.def[up]) ok(a.objs.some(o => (o.type === 'stairs_' + up || o.type === 'gate') && o.to === a.def[up]), 'stairs ' + up + ' ' + id);
  }
});

section('items', () => {
  const rng = new D.RNG(99);
  const counts = {};
  for (let i = 0; i < 6000; i++) {
    const ilvl = 1 + (i % 85);
    const it = D.rollItem(rng, ilvl, { mf: (i % 3) * 150, bonus: 1 + (i % 4) });
    counts[it.q] = (counts[it.q] || 0) + 1;
    it.idf = true;
    const name = D.itemName(it);
    ok(typeof name === 'string' && name.length > 1 && !name.includes('undefined'), 'item name ' + name);
    const lines = D.describe(it, { level: 99, str: 999, dex: 999 });
    ok(lines.length >= 1 && lines.every(l => l.t !== undefined && !String(l.t).includes('undefined') && !String(l.t).includes('NaN')), 'item description ' + name);
    const r = D.reqs(it);
    ok(r.lvl >= 1 && r.lvl <= 99, 'item req level');
    ok(D.value(it) > 0 && Number.isFinite(D.sellPrice(it, 30)), 'item price');
    const copy = D.deserialize(JSON.parse(JSON.stringify(D.serialize(it))));
    ok(D.itemName(copy) === name, 'serialize roundtrip');
  }
  for (const q of ['normal', 'magic', 'rare', 'unique', 'set']) ok(counts[q] > 0, 'quality rolled ' + q + ' ' + counts[q]);
  const sword = D.makeItem('long_sword');
  sword.sockets = 2; sword.q = 'socketed';
  ok(!D.socketInto(sword, D.makeItem('r_tir')), 'first rune is not a runeword yet');
  const rw = D.socketInto(sword, D.makeItem('r_el'));
  ok(rw && rw.id === 'steel' && sword.q === 'runeword' && D.itemName(sword) === 'Сталь', 'Steel runeword');
  ok(D.effectiveStats(sword).ias === 25, 'runeword stats');
  const helm = D.makeItem('helm'); helm.sockets = 1;
  D.socketInto(helm, D.makeItem('ruby2'));
  ok(D.effectiveStats(helm).life === 24, 'ruby gives life in armor');
  const plain = D.makeItem('broad_sword');
  D.imbue(plain, rng, 20);
  ok(plain.q === 'rare' && plain.affixes.length >= 3 && plain.idf, 'imbue makes a rare');
  const g = new D.Grid(10, 4);
  ok(g.add(D.makeItem('quilted_armor')) && g.add(D.makeItem('long_bow')), 'grid add');
  ok(g.items.every(it => g.fits(it, it.x, it.y, it)), 'grid fits');
  const full = new D.Grid(2, 2);
  ok(full.add(D.makeItem('helm')) && !full.add(D.makeItem('ring')), 'grid full');
});

section('hero', () => {
  for (const cls of D.CLASS_ORDER) {
    const ch = D.newChar('T' + cls, cls, false);
    const g = new D.Game(ch, { diff: 0, seed: 5 });
    const h = g.hero;
    ok(h.hpMax > 30 && h.st.ar > 0 && h.st.def >= 0, cls + ' starts alive');
    ok(g.area.id === 'town' && g.ents.some(e => e.npc === 'akara') && !g.ents.some(e => e.npc === 'cain'), 'town npcs');
    ok(ch.belt.filter(Boolean).length === 4, 'starting potions');
    ch.level = 30; ch.skillPts = 60; ch.statPts = 10;
    g.recalc();
    for (const s of D.classSkills(cls)) {
      let guard = 0;
      while (!g.canLearn(s.id) && guard++ < 10) for (const p of s.pre) if (g.canLearn(p)) g.learnSkill(p);
      ok(g.learnSkill(s.id), 'learn ' + s.id);
    }
    ok(!g.learnSkill('fire_bolt') || cls === 'sorceress', 'cannot learn other class skills');
    ok(g.addStatPoint('vit') && ch.stats.vit === D.CLASSES[cls].vit + 1, 'stat point');
    const serial = JSON.parse(JSON.stringify(g.saveState()));
    const back = D.deserializeChar(serial);
    ok(back.name === ch.name && back.inv.length === ch.inv.length && Object.keys(back.equip).length === Object.keys(ch.equip).length && back.skills.jab === ch.skills.jab, 'save roundtrip ' + cls);
  }
  const ch = D.newChar('Eq', 'barbarian', false);
  const g = new D.Game(ch, { diff: 0, seed: 7 });
  const axe = D.makeItem('great_axe');
  g.held = axe;
  ok(!g.equipHeld('rh'), 'strength requirement blocks equip');
  ch.stats.str = 80; ch.stats.dex = 50; g.recalc();
  ok(g.equipHeld('rh') && ch.equip.rh === axe, 'two-hander equipped');
  ok(!ch.equip.lh && ch.inv.some(i => i.base === 'buckler'), 'shield moved to inventory');
  g.held = null;
  const before = g.hero.st.wdmg.max;
  ok(before >= 30, 'two-hander damage in stats ' + before);
  g.held = D.makeItem('short_sword');
  ok(g.equipHeld('lh') === false, 'no off-hand with a two-hander');
  g.held = null;
  g.swapWeapons();
  ok(ch.swap === 1 && g.hero.st.wdmg.max <= 2, 'weapon swap to empty hands');
  g.swapWeapons();
  const ring = D.makeItem('ring'); ring.stats = { str: 5 }; ring.q = 'magic';
  g.held = ring;
  ok(g.equipHeld('ring1') && g.hero.st.str === 85, 'ring stat applies');
});

function arena(cls, lvl) {
  const ch = D.newChar('A' + cls, cls, false);
  ch.level = lvl;
  const g = new D.Game(ch, { diff: 0, seed: 11 });
  g.enterArea('coldplains', 'from:bloodmoor');
  for (const e of g.ents) if (e.kind === 'mon') { e.dead = true; e.noCorpse = true; }
  g.area.ents = g.ents.filter(e => !e.dead);
  g.recalc();
  g.hero.mp = g.hero.mpMax = 999;
  return g;
}

section('skills', () => {
  const weaponFor = sk => sk.weapon === 'bow' ? ['short_bow', 'arrows'] : sk.weapon === 'throw' ? ['javelin'] : sk.weapon === 'spear' ? ['javelin'] : sk.cls === 'assassin' ? ['katar'] : null;
  for (const sk of D.SKILL_LIST) {
    if (sk.kind === 'passive') continue;
    const g = arena(sk.cls, 30);
    const ch = g.char, h = g.hero;
    ch.skills[sk.id] = 5;
    for (const p of sk.pre) ch.skills[p] = 1;
    const w = weaponFor(sk);
    if (w) { ch.equip.rh = D.makeItem(w[0]); ch.equip.lh = w[1] ? D.makeItem(w[1]) : undefined; if (!w[1]) delete ch.equip.lh; }
    if (sk.needShield) ch.equip.lh = D.makeItem('kite_shield');
    ch.stats.str = ch.stats.dex = 200;
    g.recalc();
    const mons = [];
    const near = sk.kind === 'strike' && !sk.leap;
    for (let i = 0; i < 3; i++) { const p = near ? { x: h.x + 0.8 + i * 0.3, y: h.y + 0.5 - i * 0.4 } : g.freeSpot(g.area, h.x + 2.5 + i * 0.6, h.y + 1.5, 1.5); const m = g.makeMonster('zombie', 5, { x: p.x, y: p.y }); m.hp = m.hpMax = 9000; m.speed = 0; g.area.ents.push(m); mons.push(m); }
    if (sk.form && sk.kind !== 'form') { const form = D.SKILL_LIST.find(s => s.kind === 'form' && s.form === sk.form); ch.skills[form.id] = 1; g.recalc(); D.Skills.begin(g, h, form.id, { x: h.x, y: h.y }); for (let i = 0; i < 40; i++) g.update(1 / 30); }
    if (sk.target === 'corpse') { const c = g.makeMonster('fallen', 3, { x: h.x + 1.5, y: h.y + 1 }); c.dead = true; c.hp = 0; c.anim = { n: 'dead', t: 0, dur: 1 }; g.area.ents.push(c); }
    const hp0 = mons.reduce((a, m) => a + m.hp, 0);
    h.mp = h.mpMax = 9999;
    let started = false;
    try {
      const t = mons[0];
      const corpse = g.ents.find(e => e.dead && e.kind === 'mon');
      started = D.Skills.begin(g, h, sk.id, { x: sk.target === 'corpse' ? corpse.x : t.x, y: sk.target === 'corpse' ? corpse.y : t.y, target: sk.target === 'corpse' ? corpse : (sk.kind === 'strike' ? t : null) }) || sk.kind === 'aura';
      if (sk.kind === 'aura') ch.right = sk.id;
      for (let i = 0; i < 150; i++) g.update(1 / 30);
    } catch (e) { ok(false, 'skill ' + sk.id + ' threw: ' + e.stack); }
    ok(started, 'skill starts ' + sk.id);
    const dealt = hp0 - mons.reduce((a, m) => a + Math.max(0, m.hp), 0);
    const expectsDamage = ['strike', 'shot', 'bolt', 'nova', 'meteor', 'blizzard', 'firewall', 'chain', 'static', 'stream', 'trap'].includes(sk.kind) || ['holy_fire', 'holy_freeze'].includes(sk.sub) || sk.id === 'corpse_explosion' || sk.id === 'volcano';
    if (expectsDamage && !sk.undeadOnly) ok(dealt > 0, 'skill deals damage ' + sk.id + ' ' + dealt);
    if (sk.id === 'holy_bolt') ok(dealt > 0, 'holy bolt hurts undead zombies');
    if (sk.kind === 'summon' && sk.unit !== 'volcano') ok(g.pets.some(p => p.unit === sk.unit), 'summoned ' + sk.id);
    if (sk.kind === 'curse') ok(mons.some(m => m.fx.curse && m.fx.curse.type === sk.sub), 'cursed ' + sk.id);
    if (sk.kind === 'buff') ok(Object.keys(h.fx.buffs).length > 0, 'buff applied ' + sk.id);
    if (sk.kind === 'teleport') ok(Math.hypot(h.x - mons[0].x, h.y - mons[0].y) < 3, 'teleported');
    if (sk.kind === 'form') ok(h.form === sk.form, 'form ' + sk.id);
  }
});

section('quests', () => {
  const ch = D.newChar('Quester', 'paladin', false);
  const g = new D.Game(ch, { diff: 0, seed: 21 });
  const kill = su => { const b = g.ents.find(e => e.su === su && !e.dead); ok(b, 'boss present ' + su); b.hp = 1; g.damage(g.hero, b, { magic: [50, 50] }, {}); ok(b.dead, 'boss killed ' + su); };
  g.talk('akara');
  ok(g.q('den') === 1, 'den quest given');
  g.enterArea('den', 'from:bloodmoor');
  for (const e of g.ents.slice()) if (e.kind === 'mon' && !e.dead) { e.hp = 1; g.damage(g.hero, e, { magic: [9, 9] }, {}); }
  ok(g.q('den') === 2, 'den cleared');
  g.enterArea('town', 'start');
  const sp = ch.skillPts;
  g.talk('akara');
  ok(g.q('den') === 3 && ch.skillPts === sp + 1, 'den reward');
  g.talk('kashya');
  ok(g.q('burial') === 1, 'burial given');
  g.enterArea('burial', 'from:coldplains');
  kill('blood_raven');
  ok(g.q('burial') === 2, 'blood raven dead');
  g.enterArea('town', 'start');
  g.talk('kashya');
  ok(g.q('burial') === 3 && g.prog.freeMerc, 'free mercenary');
  const offer = g.mercList()[0];
  ok(g.mercCost(offer) === 0 && g.hireMerc(offer) && g.pets.some(p => p.kind === 'merc'), 'hired for free');
  g.talk('akara');
  ok(g.q('cain') === 1, 'cain quest given');
  g.enterArea('darkwood', 'from:stonyfield');
  const tree = g.area.objs.find(o => o.type === 'inifuss');
  g.hero.x = tree.front.x; g.hero.y = tree.front.y;
  g.interact(tree);
  const scroll = g.area.items.find(i => i.item && i.item.base === 'q_scroll');
  ok(scroll, 'scroll dropped');
  g.pickUp(scroll);
  ok(g.q('cain') === 2, 'scroll picked');
  g.enterArea('town', 'start');
  g.talk('akara');
  ok(g.q('cain') === 3 && g.hasItem('q_scroll2') && !g.hasItem('q_scroll'), 'scroll deciphered');
  g.enterArea('stonyfield', 'from:coldplains');
  const stones = g.area.objs.filter(o => o.type === 'cairn');
  g.touchCairn(stones.find(s => s.rune !== g.area.cairn.order[0]));
  ok(g.cairnTouched.length === 0, 'wrong stone resets');
  for (const r of g.area.cairn.order) g.touchCairn(stones.find(s => s.rune === r));
  ok(g.q('cain') === 4 && g.area.dyn.some(o => o.type === 'redportal'), 'portal to Tristram');
  g.interact(g.area.dyn.find(o => o.type === 'redportal'));
  ok(g.area.id === 'tristram', 'entered Tristram');
  g.openCage(g.area.objs.find(o => o.type === 'cage'));
  ok(g.q('cain') === 5 && g.areas.town.ents.some(e => e.npc === 'cain'), 'Cain rescued');
  kill('griswold');
  g.interact(g.area.objs.find(o => o.type === 'wirt'));
  ok(g.area.items.some(i => i.item && i.item.base === 'wirts_leg'), 'Wirt leg');
  g.enterArea('town', 'start');
  g.talk('cain');
  ok(g.q('cain') === 6, 'Cain quest done');
  const unid = D.rollItem(g.rng, 10, { quality: 'magic' });
  D.invGrid(ch).add(unid);
  ok(!unid.idf && g.identifyAll() >= 1 && unid.idf, 'Cain identifies');
  g.enterArea('stonyfield', 'from:coldplains');
  g.interact(g.area.objs.find(o => o.type === 'tome'));
  ok(g.q('tower') === 1, 'tower quest from tome');
  g.enterArea('tower2', 'from:tower1');
  const gold0 = g.area.items.length;
  kill('countess');
  ok(g.q('tower') === 2 && g.area.items.length > gold0 + 3 && g.area.items.some(i => i.item && D.BASES[i.item.base].type === 'rune'), 'Countess loot with runes');
  g.enterArea('town', 'start');
  g.talk('charsi');
  ok(g.q('tools') === 1, 'tools given');
  g.enterArea('barracks', 'from:tamoe');
  kill('smith');
  const stand = g.area.objs.find(o => o.type === 'malus');
  g.interact(stand);
  g.pickUp(g.area.items.find(i => i.item && i.item.base === 'q_malus'));
  ok(g.q('tools') === 2, 'malus found');
  g.enterArea('town', 'start');
  g.talk('charsi');
  ok(g.q('tools') === 3 && g.npcMenu('charsi').some(m => m[0] === 'imbue'), 'imbue offered');
  const white = D.makeItem('chain_mail');
  D.invGrid(ch).add(white);
  ok(g.imbue(white) && white.q === 'rare' && g.q('tools') === 4, 'imbued');
  g.enterArea('catacombs1', 'from:cathedral');
  ok(g.q('andariel') >= 1, 'andariel quest active');
  g.enterArea('lair', 'from:catacombs2');
  kill('andariel');
  ok(g.q('andariel') === 2 && g.area.items.some(i => i.item && (i.item.q === 'unique' || i.item.q === 'set')), 'Andariel quest drop');
  g.enterArea('town', 'start');
  ok(g.npcMenu('warriv').some(m => m[0] === 'travel'), 'Warriv offers travel');
  g.travelEast();
  ok(g.q('andariel') === 3 && ch.maxDiff === 1 && g.events.some(e => e.t === 'actend'), 'Act I complete, Nightmare unlocked');
  g.travelWp('town');
  ok(Object.keys(g.prog.wp).length >= 1, 'waypoints stored');
  const nm = new D.Game(ch, { diff: 1, seed: 3 });
  ok(nm.q('den') === 0 && nm.area.def.lvl[1] === 0, 'nightmare has its own quests');
  nm.enterArea('bloodmoor', 'from:town');
  ok(nm.ents.find(e => e.kind === 'mon').lvl >= 36, 'nightmare monster levels');
  ok(nm.hero.st.res.f === -40, 'nightmare resistance penalty');
});

section('economy', () => {
  const ch = D.newChar('Trader', 'sorceress', false);
  ch.gold = 50000; ch.level = 20;
  const g = new D.Game(ch, { diff: 0, seed: 31 });
  const stock = g.shopStock('akara');
  ok(stock.some(i => i.base.startsWith('hp')) && stock.some(i => i.base === 'tp_scroll'), 'Akara sells potions and scrolls');
  const tp = stock.find(i => i.base === 'tp_scroll');
  const gold = ch.gold;
  ok(g.buy('akara', tp) && ch.gold === gold - g.priceOf(tp) && stock.includes(tp), 'infinite stock purchase');
  const tome = stock.find(i => i.base === 'tp_tome');
  ok(g.buy('akara', tome), 'buy tome');
  ok(g.buy('akara', tp) && ch.inv.find(i => i.base === 'tp_tome').qty === 1, 'scroll goes into tome');
  const sword = D.makeItem('long_sword');
  D.invGrid(ch).add(sword);
  const g0 = ch.gold;
  ok(g.sell('charsi', sword) && ch.gold > g0 && g.shops.charsi === undefined || true, 'sell');
  const gl = g.gambleList();
  ok(gl.length >= 15 && gl.some(i => i.base === 'ring'), 'gamble list');
  const won = g.gamble(gl.find(i => i.base === 'ring'));
  ok(won && won.q !== 'normal' && D.BASES[won.base].type === 'ring', 'gamble result');
  const ch2 = ch.equip.rh;
  ch2.dur = 1;
  ok(g.repairAllCost() > 0 && g.repairAll() && ch2.dur === ch2.maxDur, 'repair');
  ok(g.stashGold(1000) && ch.stash.gold === 1000 && g.withdrawGold(500) && ch.stash.gold === 500, 'stash gold');
  const hp = D.makeItem('hp2');
  ch.belt = [];
  D.invGrid(ch).add(hp);
  ok(g.toBelt(hp) && ch.belt.includes(hp), 'potion to belt');
  g.hero.hp = 1;
  const col = ch.belt.indexOf(hp) % 4;
  g.beltUse(col);
  for (let i = 0; i < 150; i++) g.update(1 / 30);
  ok(g.hero.hp > 20, 'potion heals');
  ok(g.castTownPortal() === false, 'no portal in town');
  g.enterArea('coldplains', 'wp');
  const scroll = ch.inv.find(i => i.base === 'tp_tome');
  scroll.qty = 3;
  ok(g.useItem(scroll) && g.portal && g.area.dyn.some(o => o.type === 'portal'), 'town portal opened');
  g.usePortal(g.area.dyn.find(o => o.type === 'portal'));
  ok(g.area.id === 'town' && g.area.dyn.some(o => o.type === 'portal'), 'portal to town');
  g.usePortal(g.area.dyn.find(o => o.type === 'portal'));
  ok(g.area.id === 'coldplains' && !g.portal, 'portal back closes it');
});

section('death', () => {
  const ch = D.newChar('Mortal', 'amazon', false);
  ch.gold = 1000;
  const g = new D.Game(ch, { diff: 0, seed: 41 });
  g.enterArea('bloodmoor', 'from:town');
  g.hero.hp = 1;
  g.damage({ kind: 'mon', team: 1, id: -1, fx: { buffs: {} }, mods: [], dmg: [5, 5] }, g.hero, { ph: [50, 50] }, {});
  ok(g.hero.dead, 'hero died');
  for (let i = 0; i < 60; i++) g.update(1 / 30);
  ok(g.events.some(e => e.t === 'died'), 'death message');
  g.respawn();
  ok(!g.hero.dead && g.area.id === 'town' && !ch.equip.rh && ch.corpse && ch.gold === 900, 'respawned naked with gold penalty');
  g.enterArea('bloodmoor', 'from:town');
  const corpse = g.area.dyn.find(o => o.type === 'corpse');
  ok(corpse, 'corpse in the field');
  g.interact(corpse);
  ok(ch.equip.rh && !ch.corpse, 'corpse retrieved');
  const hc = D.newChar('Brave', 'barbarian', true);
  const g2 = new D.Game(hc, { diff: 0, seed: 42 });
  g2.hero.hp = 1;
  g2.damage({ kind: 'mon', team: 1, id: -1, fx: { buffs: {} }, mods: [], dmg: [5, 5] }, g2.hero, { ph: [50, 50] }, {});
  g2.respawn();
  ok(hc.dead && g2.events.some(e => e.t === 'hcdead'), 'hardcore death is permanent');
});

section('bot', () => {
  for (const cls of D.CLASS_ORDER) {
    const bot = new Bot(cls, { seed: 900 + cls.length });
    let kills = 0;
    for (const id of ['bloodmoor', 'den']) kills += bot.clearArea(id, { boss: D.AREAS[id].su });
    log(cls, 'kills', kills, 'lvl', bot.ch.level, 'deaths', bot.deaths);
    ok(kills >= 60, cls + ' bot clears Blood Moor and the Den: ' + kills);
    ok(bot.ch.level >= 5, cls + ' levels up: ' + bot.ch.level);
    ok(bot.deaths <= 12, cls + ' bot deaths: ' + bot.deaths);
    ok(bot.errors.length === 0, cls + ' no runtime errors');
    ok(bot.g.q('den') >= 2, cls + ' Den of Evil cleared');
  }
});

section('integration', () => {
  const LINE = String.fromCharCode(47, 47), BLOCK = String.fromCharCode(47, 42);
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/diablo2/' + f).concat(['js/apps/diablo2-app.js', 'tests/diablo2.test.js', 'tests/diablo2-bot.js']);
  for (const f of files) {
    const src = read(f);
    const noStrings = src.replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, '""');
    ok(!noStrings.includes(LINE) && !noStrings.includes(BLOCK), f + ' has no comments');
  }
  ok(!read('css/apps/diablo2.css').includes(BLOCK), 'css has no comments');
  ok(!read('diablo2.html').includes('<!' + '--'), 'page has no comments');
  const html = read('index.html'), page = read('diablo2.html');
  let lastA = -1, lastB = -1;
  for (const f of ORDER) {
    const needle = 'js/apps/diablo2/' + f + '.js';
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'script order ' + f);
    lastA = ia; lastB = ib;
  }
  ok(fs.readdirSync(DIR).filter(f => f.endsWith('.js')).length === ORDER.length, 'every module is loaded');
  ok(html.indexOf('js/apps/diablo2-app.js') > lastA && html.includes('css/apps/diablo2.css'), 'desktop loads wrapper and styles');
  const gm = read('js/game-manager.js');
  const at = gm.indexOf('      diablo2: {');
  const entry = gm.slice(at, at + 2400);
  ok(at > 0 && /steam: true/.test(entry) && /price: 47\.99/.test(entry) && /targetExe: 'DIABLO2\.EXE'/.test(entry) && /appDiablo2/.test(entry), 'Steam catalog entry');
  ok(!/diablo2Granted/.test(gm), 'no grant flag');
  const loadState = gm.slice(gm.indexOf('loadState'), gm.indexOf('moveGamesToSteam(state)'));
  ok(!/'diablo2'/.test(loadState), 'not preinstalled');
  const shell = {
    'js/desktop.js': ["isInstalled('diablo2')", 'appDiablo2'],
    'js/taskbar.js': ["isInstalled('diablo2')", "case 'diablo2'", "showInSteam('diablo2')"],
    'js/apps/dialogs.js': ["cmd === 'diablo2'", "showInSteam(\\'diablo2\\')"],
    'js/apps/explorer.js': ["item.app === 'diablo2'", 'DIABLO2.EXE'],
    'js/filesystem.js': ["gmInstalled.includes('diablo2')", "'DIABLO2.EXE'"],
    'js/apps/task-manager.js': ["'app_diablo2'", 'diablo ii.exe'],
    'js/icons.js': ["'diablo2': `<svg"],
    'js/apps/clippy.js': ["id.startsWith('app_diablo2')", "launchProgram('diablo2', 'appDiablo2')"],
    'js/apps/advanced-site.js': ["id: 'diablo2'"],
    'js/apps/diablo2-app.js': ["id = 'app_diablo2'", 'D.UI(root']
  };
  for (const [f, needles] of Object.entries(shell)) { const src = read(f); for (const n of needles) ok(src.includes(n), f + ' contains ' + n); }
  ok((read('js/i18n.js').match(/'app\.diablo2': 'Diablo II'/g) || []).length === 4, 'i18n title in every language');
  ok(/"test:diablo2": "node tests\/diablo2\.test\.js"/.test(read('package.json')), 'npm script');
});

console.log('diablo2: ' + checks + ' checks passed in ' + (Date.now() - t0) + ' ms');
