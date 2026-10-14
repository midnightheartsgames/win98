const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const DIR = path.join(__dirname, '../js/apps/dao98');
const BROWSER = new Set(['da-tex', 'da-models', 'da-props', 'da-gl', 'da-icons', 'da-audio', 'da-ui', 'da-ui-book', 'da-ui-front']);
const ORDER = ['da-core', 'da-data', 'da-rules', 'da-dialog', 'da-world', 'da-game', 'da-combat', 'da-story-common'];
const stories = fs.readdirSync(DIR).filter(f => f.startsWith('da-story-') && f !== 'da-story-common.js').map(f => f.replace('.js', '')).sort();
let D;
for (const f of ORDER.concat(stories)) { if (!BROWSER.has(f)) D = require(path.join(DIR, f + '.js')); }

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();
const VERBOSE = process.argv.includes('-v');
const log = (...a) => { if (VERBOSE) console.log(...a); };

const src = fs.readdirSync(DIR).map(f => fs.readFileSync(path.join(DIR, f), 'utf8')).join('\n') + fs.readFileSync(path.join(__dirname, '../css/apps/dao98.css'), 'utf8');
ok(!/(^|[^:'"`\\])\/\/(?![^\n]*['"`])/m.test(src.replace(/https?:\/\/[^\s'"`]+/g, '')), 'no line comments in dao98 sources');
ok(!/\/\*[\s\S]*?\*\//.test(src), 'no block comments in dao98 sources');

const SPEAKERS = id => id === 'narr' || id === 'pc' || !!D.NPCS[id] || !!D.COMPANIONS[id] || !!D.TEMPLATES[id];
const scriptsUsed = new Set();
const checkAct = p => {
  const a = p.args;
  switch (p.name) {
    case 'give': case 'take': return D.ITEMS[a[0]] ? null : 'item ' + a[0];
    case 'quest': { const q = D.QUESTS[a[0]]; if (!q) return 'quest ' + a[0]; return q.stages[a[1]] ? null : 'quest stage ' + a[0] + ':' + a[1]; }
    case 'codex': return D.CODEX[a[0]] ? null : 'codex ' + a[0];
    case 'join': case 'leave': return D.COMPANIONS[a[0]] ? null : 'companion ' + a[0];
    case 'ap': return D.COMPANIONS[a[0]] && !isNaN(+a[1]) ? null : 'approval ' + a.join(':');
    case 'run': case 'do': scriptsUsed.add(a[0]); return D.SCRIPTS[a[0]] ? null : 'script ' + a[0];
    case 'shop': return D.SHOPS[a[0]] ? null : 'shop ' + a[0];
    case 'goto': return D.AREAS[a[0]] ? null : 'area ' + a[0];
    case 'remove': case 'follow': case 'unfollow': return D.NPCS[a[0]] ? null : 'npc ' + a[0];
    case 'learn': return D.AB[a[0]] ? null : 'ability ' + a[0];
    default: return null;
  }
};
const checkCond = c => {
  const [k, v] = c.name.split('.');
  if (v === undefined) return null;
  if (k === 'quest') return D.QUESTS[v] ? null : 'cond quest ' + v;
  if (k === 'item') return D.ITEMS[v] ? null : 'cond item ' + v;
  if (k === 'party' || k === 'has' || k === 'ap') return D.COMPANIONS[v] ? null : 'cond companion ' + v;
  if (k === 'skill') return D.SKILLS[v] ? null : 'cond skill ' + v;
  return null;
};
for (const [id, dlg] of Object.entries(D.DIALOGS)) {
  const errs = D.validateDialog(dlg, { speakers: SPEAKERS, checkAct, checkCond });
  ok(!errs.length, 'dialog ' + id + ': ' + errs.join('; '));
}
{
  const g = new D.Game({ headless: true, seed: 1 });
  const voiced = new Set();
  for (const dlg of Object.values(D.DIALOGS)) for (const n of Object.values(dlg.nodes)) for (const l of n.lines) voiced.add(l.sp);
  for (const sp of voiced) { const v = g.speakerVoice(sp); ok(v.narr || ((v.sex === 'm' || v.sex === 'f') && typeof v.race === 'string' && v.key === sp), 'voice profile ' + sp); }
  ok(g.speakerVoice('narr').narr && g.speakerName('narr') === '', 'narrator voice');
  ok(g.speakerVoice('morrigan').sex === 'f' && g.speakerVoice('mother').sex === 'f' && g.speakerVoice('sten').race === 'qunari' && g.speakerVoice('dog').race === 'beast', 'speaker voice profiles');
  ok(g.speakerName('duncan') === D.NPCS.duncan.name && g.speakerName('alistair') === D.COMPANIONS.alistair.name, 'speaker names');
}

const dlgUsed = new Set();
for (const n of Object.values(D.NPCS)) if (n.dlg) { dlgUsed.add(n.dlg); ok(D.DIALOGS[n.dlg], 'npc dlg ' + n.id + ' -> ' + n.dlg); }
for (const c of Object.values(D.COMPANIONS)) if (c.dlg) { dlgUsed.add(c.dlg); ok(D.DIALOGS[c.dlg], 'companion dlg ' + c.dlg); }
for (const [k, c] of Object.entries(D.COMPANIONS)) {
  for (const s of Object.values(c.equip || {})) ok(D.ITEMS[s], 'companion item ' + k + ' ' + s);
  for (const a of c.ab || []) ok(D.AB[a], 'companion ability ' + k + ' ' + a);
}
for (const [id, t] of Object.entries(D.TEMPLATES)) {
  for (const s of Object.values(t.equip || {})) ok(D.ITEMS[s], 'template item ' + id + ' ' + s);
  for (const a of t.ab || []) ok(D.AB[a], 'template ability ' + id + ' ' + a);
  ok(D.LOOT[t.loot || 'none'], 'template loot ' + id);
}
for (const rows of Object.values(D.LOOT)) for (const r of rows) ok(r[1] === 'money' || D.LOOT_POOLS[r[1]] || D.ITEMS[r[1]], 'loot entry ' + r[1]);
for (const pool of Object.values(D.LOOT_POOLS)) for (const i of pool) ok(D.ITEMS[i], 'pool item ' + i);
for (const s of Object.values(D.SHOPS)) for (const [i] of s.items) ok(D.ITEMS[i], 'shop item ' + i);
for (const r of D.RECIPES) { ok(D.ITEMS[r.out], 'recipe out ' + r.id); for (const [i] of r.need) ok(D.ITEMS[i], 'recipe need ' + i); }
for (const l of Object.values(D.LINES)) for (const a of l.list) ok(D.AB[a], 'line ability ' + a);
for (const [id, o] of Object.entries(D.ORIGINS)) { if (process.env.DA_PARTIAL && !D.ORIGIN_SETUP[id]) continue; ok(D.AREAS[o.start[0]], 'origin area ' + id); ok(D.layout(o.start[0]).spots[o.start[1]], 'origin spot ' + id); ok(D.ORIGIN_SETUP[id], 'origin setup ' + id); ok(D.ORIGIN_INTRO[id], 'origin intro ' + id); }
for (const [id, q] of Object.entries(D.QUESTS)) { ok(q.stages[q.done], 'quest done stage ' + id); }

for (const [id, a] of Object.entries(D.AREAS)) {
  const L = D.layout(id);
  ok(L.nav && L.w === a.w, 'layout ' + id);
  ok(Object.keys(L.spots).length, 'spots ' + id);
  ok(D.THEMES[typeof a.theme === 'function' ? a.theme({ flag: () => 0, cond: () => false }) : a.theme], 'theme ' + id);
  if (a.onEnter) ok(D.SCRIPTS[a.onEnter], 'onEnter ' + id);
  if (a.onKill) ok(D.SCRIPTS[a.onKill], 'onKill ' + id);
  const walk = new Uint8Array(L.w * L.h);
  for (let i = 0; i < walk.length; i++) walk[i] = L.nav.walk[i] || L.nav.small[i];
  for (const o of L.objects) if (o.t === 'door') walk[o.cz * L.w + o.cx] = 1;
  for (const o of L.objects) {
    const where = id + ' ' + o.t + ' ' + (o.id || o.tpl || o.kind);
    ok(o.x >= 0 && o.z >= 0 && o.x <= L.w && o.z <= L.h, 'in bounds ' + where);
    if (o.t === 'npc') ok(D.NPCS[o.id], 'npc def ' + where);
    if (o.t === 'npc' && o.dlg) { dlgUsed.add(o.dlg); ok(D.DIALOGS[o.dlg], 'npc obj dlg ' + where); }
    if (o.t === 'foe') { ok(D.TEMPLATES[o.tpl], 'foe tpl ' + where); if (o.dlg) { dlgUsed.add(o.dlg); ok(D.DIALOGS[o.dlg], 'foe dlg ' + where); } }
    if (o.t === 'box') { for (const [i] of o.loot || []) ok(D.ITEMS[i], 'box item ' + where + ' ' + i); if (o.table) ok(D.LOOT[o.table], 'box table ' + where); if (o.run) ok(D.SCRIPTS[o.run], 'box run ' + where); }
    if (o.t === 'exit') { if (o.to) { ok(D.AREAS[o.to], 'exit target ' + where); ok(D.layout(o.to).spots[o.at], 'exit arrive ' + where + ' -> ' + o.to + ':' + o.at); } else ok(o.run || o.map, 'exit action ' + where); if (o.run) ok(D.SCRIPTS[o.run], 'exit run ' + where); }
    if (o.t === 'use') { ok(o.dlg ? D.DIALOGS[o.dlg] : D.SCRIPTS[o.run], 'use action ' + where); if (o.dlg) dlgUsed.add(o.dlg); }
    if (o.t === 'trig') { ok(o.dlg ? D.DIALOGS[o.dlg] : D.SCRIPTS[o.run], 'trig action ' + where); if (o.dlg) dlgUsed.add(o.dlg); }
    if (o.t === 'door' && o.key) ok(D.ITEMS[o.key], 'door key ' + where);
    if (o.t === 'prop') ok(D.PROPS[o.kind], 'prop ' + where);
    for (const c of [].concat(o.if || [], o.unless || [])) for (const part of c.split('|')) ok(!checkCond(D.parseCond(part)), 'obj cond ' + where + ' ' + c);
  }
  const seen = new Uint8Array(L.w * L.h);
  const q = [];
  for (const s of Object.values(L.spots)) {
    const p = D.nearestWalkable(L.nav, s.x, s.z, 4);
    if (!p) continue;
    const i = Math.floor(p[1]) * L.w + Math.floor(p[0]);
    if (!seen[i]) { seen[i] = 1; q.push(i); }
  }
  while (q.length) {
    const i = q.pop(), x = i % L.w, z = (i / L.w) | 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (nx < 0 || nz < 0 || nx >= L.w || nz >= L.h) continue;
      const ni = nz * L.w + nx;
      if (walk[ni] && !seen[ni]) { seen[ni] = 1; q.push(ni); }
    }
  }
  const near = (x, z, r) => { for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { const cx = Math.floor(x) + dx, cz = Math.floor(z) + dz; if (cx >= 0 && cz >= 0 && cx < L.w && cz < L.h && seen[cz * L.w + cx]) return true; } return false; };
  for (const o of L.objects) {
    if (!['npc', 'box', 'exit', 'use', 'foe'].includes(o.t)) continue;
    if (o.t === 'foe' && o.ally) continue;
    ok(near(o.x, o.z, o.t === 'npc' ? 2 : 2), 'reachable ' + id + ' ' + o.t + ' ' + (o.id || o.tpl) + ' at ' + o.x + ',' + o.z);
  }
}
for (const [id, s] of Object.entries(D.SCRIPTS)) ok(typeof s === 'function', 'script fn ' + id);

class Bot {
  constructor(opt) {
    this.g = new D.Game({ headless: true, auto: true, seed: opt.seed || 1, difficulty: opt.difficulty || 'normal' });
    this.opt = opt;
    this.plan = [];
    this.time = 0;
    this.trace = [];
  }
  start() {
    const o = this.opt;
    const skills = o.cls === 'rogue' ? { coercion: 1, stealing: 1 } : { coercion: 1 };
    const ab = o.cls === 'mage' ? ['heal', 'winters_grasp'] : o.cls === 'rogue' ? ['dirty_fighting'] : ['shield_bash'];
    const alloc = o.cls === 'mage' ? { mag: 3, wil: 1, cun: 1 } : o.cls === 'rogue' ? { dex: 2, cun: 3 } : { str: 3, cun: 2 };
    this.g.newGame({ origin: o.origin, race: o.race, cls: o.cls, sex: o.sex || 'm', name: 'Бот', alloc, skills, abilities: ab });
    D.autoLevel(this.g.pc);
  }
  step(dt) {
    const g = this.g;
    if (g.mode === 'dead') throw new Error('party died in ' + g.areaId + ' party=' + g.party.map(c => c.key + ':L' + c.lvl + ':' + c.stats.hpMax).join(',') + ' foes=' + g.ents.filter(e => e.faction === 'hostile' && !e.dead && e.aware).map(e => e.key + '(' + e.group + '):' + Math.round(e.hp)).join(',') + ' ' + this.trace.slice(-3).join(' | '));
    if (g.mode === 'end') return;
    if (g.dialog) { this.answer(); return; }
    if (g.loot) g.takeAll();
    if (g.shop) g.closeShop();
    if (g.mode === 'map') { const d = g.travel.dests.find(x => x.open); g.travelTo(d.id); return; }
    for (const c of g.party) { if (c.points.attr || c.points.talent || c.points.skill) { D.autoLevel(c); c.tactics = D.defaultTactics(c); } }
    if (g.combat) for (const c of g.party) if (c.hp < c.stats.hpMax * 0.35 && !(c.cds.item > 0)) { const id = g.bestItem('poultice'); if (id) g.useItem(c, id); }
    g.update(dt);
    this.time += dt;
  }
  answer() {
    const g = this.g;
    let guard = 0;
    while (g.dialog && guard++ < 200) {
      if (g.moreLines()) { g.advance(); continue; }
      const reps = g.replies();
      if (!reps.length) { g.advance(); continue; }
      let pick = 0;
      const want = this.plan.find(p => reps.some(r => r.text.includes(p)));
      if (want) { pick = reps.findIndex(r => r.text.includes(want)); this.plan.splice(this.plan.indexOf(want), 1); }
      else {
        const nonEnd = reps.findIndex(r => r.to !== 'end' && !r.check && !r.once);
        const onceQ = reps.findIndex(r => r.once && !r.check);
        pick = nonEnd >= 0 ? nonEnd : onceQ >= 0 ? onceQ : 0;
      }
      this.trace.push(g.dialog.id + '/' + g.dialog.node + ' -> ' + reps[pick].text.slice(0, 30));
      g.choose(pick);
    }
    if (guard >= 200) throw new Error('dialog loop ' + (g.dialog && g.dialog.id));
  }
  dbg(what) { if (process.env.DA_DEBUG) console.log('BOT', what, this.g.areaId, this.g.leader.x.toFixed(1), this.g.leader.z.toFixed(1)); }
  run(sec) { for (let t = 0; t < sec; t += 0.1) this.step(0.1); }
  until(fn, max, what) {
    for (let t = 0; t < (max || 300); t += 0.1) { if (fn()) return true; this.step(0.1); }
    throw new Error('timeout: ' + what + ' in ' + this.g.areaId + ' at ' + this.g.leader.x.toFixed(1) + ',' + this.g.leader.z.toFixed(1) + ' mode=' + this.g.mode + ' ' + this.trace.slice(-2).join(' | '));
  }
  fight(max) { this.until(() => !this.g.combat && !this.g.dialog && !this.g.coros.some(c => !c.done && c.until), max || 400, 'combat end'); }
  say(...p) { this.plan.push(...p); return this; }
  talk(id, ...p) {
    this.dbg('talk ' + id);
    const g = this.g;
    this.plan.push(...p);
    const e = g.ents.find(x => x.key === id && !x.gone && !x.dead);
    if (!e) throw new Error('no npc ' + id + ' in ' + g.areaId);
    let opened = false;
    this.until(() => {
      if (g.dialog) { opened = true; return true; }
      if (!g.leader.order && !g.combat) g.cmdInteract(g.leader, e);
      return false;
    }, 200, 'talk ' + id);
    this.answer();
    this.run(0.3);
    return opened;
  }
  use(id) {
    this.dbg('use ' + id);
    const g = this.g;
    const o = g.obj(id);
    if (!o) throw new Error('no obj ' + id + ' in ' + g.areaId);
    const area = g.areaId, serial = g.areaSerial;
    let issued = false;
    this.until(() => {
      if (g.areaSerial !== serial || g.dialog || g.loot || g.mode === 'end') return true;
      if (o.t === 'door' && o.open) return true;
      if (g.combat) { issued = false; return false; }
      if (!issued) { g.cmdInteract(g.leader, o); issued = true; return false; }
      return !g.leader.order;
    }, 200, 'use ' + id);
    if (g.areaSerial === serial && !g.dialog && !g.loot && D.dist(g.leader.x, g.leader.z, o.x, o.z) > 3.2) throw new Error('could not reach ' + id + ' in ' + area);
    this.answer();
    if (g.loot) g.takeAll();
    this.run(0.3);
    return area;
  }
  goTo(x, z) {
    this.dbg('goTo ' + x);
    const g = this.g;
    const serial = g.areaSerial;
    this.until(() => {
      if (g.areaSerial !== serial || D.dist(g.leader.x, g.leader.z, x, z) < 2) return true;
      if (!g.leader.order && !g.combat && !g.dialog) g.cmdMove(g.leader, x, z);
      return false;
    }, 300, 'goto ' + x + ',' + z);
  }
  exit(id) { const s = this.g.areaSerial; this.use(id); this.until(() => this.g.areaSerial !== s || this.g.mode === 'end', 60, 'exit ' + id); this.run(0.5); }
  killGroup(g_) {
    this.dbg('killGroup ' + g_);
    const g = this.g;
    this.until(() => {
      const left = g.ents.filter(e => e.group === g_ && !e.dead && !e.down);
      if (!left.length && !g.combat) return true;
      if (!g.combat && left.length) { const t = left[0]; if (t.faction !== 'hostile') g.fightGroup(g_); else g.cmdAttack(g.leader, t); }
      return false;
    }, 600, 'kill ' + g_);
    this.fight();
    this.rest();
  }
  gear() {
    const g = this.g;
    const score = (c, it, slot) => {
      if (!it) return -1;
      if (it.type === 'weapon' && slot === 'main') { const cur = D.ITEMS[c.equip.main]; if (cur && (!!cur.bow !== !!it.bow || !!cur.staff !== !!it.staff || cur.hands !== it.hands)) return -1; return it.dmg * 10 / it.spd; }
      if (it.type === 'shield') return it.def + it.mdef * 0.3;
      if (it.type === 'armor') return (it.arm || 0) * 10 - (it.fat || 0) * (c.cls === 'mage' ? 3 : 0.5) + (it.mods ? Object.values(it.mods).reduce((a, b) => a + b, 0) * 3 : 0);
      if (it.type === 'accessory') return Object.values(it.mods || {}).reduce((a, b) => a + b, 0);
      return -1;
    };
    for (const c of g.party) {
      if (c.look.kind && c.look.kind !== 'humanoid') continue;
      for (const slot of ['main', 'off', 'head', 'chest', 'gloves', 'boots', 'amulet', 'belt', 'ring1', 'ring2']) {
        if (slot === 'off' && !(c.equip.off && D.ITEMS[c.equip.off].type === 'shield')) continue;
        let best = null, bs = score(c, D.ITEMS[c.equip[slot]], slot);
        for (const e of g.inv) {
          const it = D.ITEMS[e.id];
          if (!D.slotFits(slot, it) || D.canEquip(c, slot, e.id)) continue;
          if (slot === 'off' && it.type !== 'shield') continue;
          const sc = score(c, it, slot);
          if (sc > bs + 0.01) { bs = sc; best = e.id; }
        }
        if (best) g.equipFromInv(c, slot, best);
      }
    }
  }
  rest() {
    this.gear();
    const g = this.g;
    for (let t = 0; t < 15 && !g.combat && g.party.some(c => c.hp < c.stats.hpMax * 0.9); t += 0.5) this.run(0.5);
  }
}

const OSTAGAR = b => {
  const g = b.g;
  ok(g.areaId === 'ostagar', 'arrived at ostagar');
  b.run(1);
  ok(g.flag('ost_arrived'), 'ostagar arrival dialog');
  b.run(5);
  b.talk('kennel_master');
  b.talk('ost_alistair');
  b.talk('duncan');
  ok(g.party.some(c => c.key === 'alistair') && g.party.length === 4, 'wilds party ' + g.party.map(c => c.key));
  b.talk('ost_prisoner');
  b.talk('cage_guard', 'Держи серебро');
  b.talk('ost_prisoner');
  b.exit('to_wilds') ;
};
const WILDS = b => {
  const g = b.g;
  ok(g.areaId === 'wilds', 'in wilds');
  b.talk('wilds_scout');
  for (const grp of ['w_wolves', 'w_gen1', 'w_gen2', 'w_gen3']) b.killGroup(grp);
  if (g.quests.ost_dog) b.use('mabari_flower');
  b.use('scout_bodies');
  b.use('deserter_cache');
  b.killGroup('w_gen4');
  ok(g.count('darkspawn_blood') >= 3, 'blood vials ' + g.count('darkspawn_blood'));
  b.use('treaty_chest');
  b.run(2);
  b.talk('flemeth');
  ok(g.count('treaties') === 1, 'treaties');
  b.talk('wilds_scout');
  b.exit('to_ostagar');
};
const JOINING = b => {
  const g = b.g;
  if (g.count('mabari_flower')) b.talk('kennel_master');
  b.talk('duncan');
  b.until(() => g.flag('ost_joined') && !g.dialog && g.mode === 'play', 60, 'joining');
  b.run(2);
  ok(g.count('amulet_warden') === 1, 'warden amulet');
  b.until(() => g.quests.ost_main >= 5, 30, 'wake');
  b.goTo(79, 16);
  b.until(() => g.areaId === 'ishal_yard', 60, 'battle start');
};
const TOWER = b => {
  const g = b.g;
  b.run(1);
  ok(g.party.length === 4, 'tower party ' + g.party.map(c => c.key));
  b.killGroup('iy_main');
  b.exit('ishal_door');
  b.killGroup('if_hall');
  b.use('if_d3');
  b.killGroup('if_barracks');
  b.use('if_d2');
  b.killGroup('if_lab');
  b.use('if_d4');
  b.killGroup('if_alpha');
  b.exit('to_top');
  b.use('it_supplies');
  for (const c of g.party) if (c.injuries.length && g.count('injury_kit')) g.useItem(c, 'injury_kit');
  b.killGroup('it_ogre');
  b.use('beacon');
  b.until(() => g.areaId === 'flemeth_hut', 60, 'hut');
  b.run(2);
  b.talk('flemeth');
  ok(g.party.some(c => c.key === 'morrigan') && g.party.some(c => c.key === 'alistair'), 'morrigan and alistair joined');
  b.exit('hut_leave');
  b.until(() => g.areaId === 'road_camp', 30, 'road');
  b.fight();
  b.run(3);
  b.exit('road_on');
};
const LOTHERING = b => {
  const g = b.g;
  ok(g.areaId === 'lothering', 'lothering ' + g.areaId);
  b.run(1);
  b.talk('bandit_leader', 'Нападаем');
  b.fight();
  b.talk('lot_chanter');
  b.killGroup('lot_bcamp');
  b.killGroup('lot_beasts');
  b.talk('lot_chanter');
  b.talk('sten_npc', 'Мы можем тебя освободить');
  b.exit('to_chantry');
  if (g.count('poultice_lesser') < 3) g.give('poultice_lesser', 3);
  b.talk('lot_sister');
  b.talk('lot_sister', 'Вот, возьмите');
  b.talk('lot_mother', 'Что с кунари', 'Серые Стражи могут призвать');
  ok(g.count('cell_key') === 1, 'sten key');
  b.exit('chantry_out');
  b.talk('sten_npc', 'Ты свободен');
  ok(g.roster.sten, 'sten recruited');
  b.exit('to_tavern');
  b.until(() => g.combat || g.flag('tavern_fought'), 30, 'tavern fight');
  b.fight();
  b.run(2);
  ok(g.roster.leliana, 'leliana recruited');
  b.exit('tavern_out');
  b.use('to_north');
  b.until(() => g.mode === 'end', 60, 'chapter end');
};

const ORIGIN_RUNS = {
  hn: b => {
    const g = b.g;
    b.run(1);
    b.talk('bryce');
    b.talk('nan');
    b.use('d_larder');
    b.goTo(76, 31);
    b.until(() => g.roster.dog, 120, 'dog');
    b.talk('fergus');
    b.talk('mother');
    b.until(() => g.flag('hn_night') && g.mode === 'play' && !g.dialog, 60, 'night');
    b.run(1);
    ok(g.party.some(c => c.key === 'eleanor'), 'mother joined');
    for (const grp of ['hn_c1', 'hn_c2']) b.killGroup(grp);
    b.goTo(8, 31);
    for (const grp of ['hn_hall', 'hn_c4', 'hn_c5']) b.killGroup(grp);
    b.use('d_vault');
    b.use('vault_chest');
    ok(g.count('cousland_sword') + (g.pc.equip.main === 'cousland_sword' ? 1 : 0) >= 1, 'family sword; area=' + g.areaId + ' inv=' + g.inv.map(e => e.id).join(',') + ' vault=' + JSON.stringify(g.stateFor('highever').boxes));
    b.killGroup('hn_c6');
    b.use('d_larder');
    b.goTo(76, 34);
    b.until(() => g.areaId === 'ostagar', 120, 'ostagar');
  }
};

ORIGIN_RUNS.mage = b => {
  const g = b.g;
  b.run(1);
  ok(g.quests.mg_harrowing === 1, 'harrowing started');
  b.killGroup('fa_wisps');
  b.talk('mouse');
  ok(g.flag('mg_mouse'), 'mouse form learned');
  b.killGroup('fa_wolves');
  b.use('fade_pool');
  b.talk('valor', 'Сразимся');
  b.fight();
  b.run(2);
  ok(g.pc.equip.main === 'valor_staff', 'valor staff');
  g.setMouse(true);
  b.goTo(33.5, 26);
  g.setMouse(false);
  b.killGroup('fa_rage');
  b.until(() => g.areaId === 'circle' && g.mode === 'play', 60, 'wake in circle');
  b.run(1);
  ok(g.pc.equip.main === 'staff1', 'fade staff gone');
  b.talk('irving');
  b.talk('jowan_npc');
  b.use('irving_desk');
  b.talk('owain');
  ok(g.count('rod_of_fire') === 1, 'rod of fire');
  b.talk('jowan_npc');
  ok(g.party.some(c => c.key === 'jowan'), 'jowan joined');
  b.exit('to_vault');
  for (const grp of ['cv_a', 'cv_b', 'cv_c']) b.killGroup(grp);
  b.use('phylactery_shelf');
  b.run(2);
  b.exit('vault_up');
  b.until(() => g.areaId === 'ostagar', 120, 'mage to ostagar');
};

ORIGIN_RUNS.ce = b => {
  const g = b.g;
  b.run(1);
  ok(g.quests.ce_wedding === 1, 'ce started');
  b.talk('shianni');
  b.talk('soris_npc');
  b.run(6);
  b.talk(g.pc.sex === 'f' ? 'nelaros_npc' : 'nesiara');
  b.goTo(42, 22);
  b.until(() => g.flag('ce_vaughan_met') && !g.dialog && g.mode === 'play', 60, 'vaughan scene');
  b.run(1);
  b.talk('valendrian');
  b.until(() => g.flag('ce_armed') && g.mode === 'play' && !g.dialog, 60, 'armed');
  ok(g.party.some(c => c.key === 'soris'), 'soris joined');
  b.talk('alarith');
  b.exit('to_estate');
  b.talk('ce_servant', 'Помоги нам пройти');
  b.killGroup('es_corr');
  b.killGroup('es_barracks');
  b.use('es_barracks_chest');
  ok(g.count('vaughan_key') === 1, 'vaughan key');
  b.killGroup('es_dining');
  b.killGroup('es_upper');
  b.use('es_vdoor');
  b.talk('vaughan', 'Ты умрёшь');
  b.fight();
  b.until(() => g.quests.ce_rescue >= 4 && !g.dialog, 60, 'rescued');
  b.exit('estate_out');
  b.until(() => g.areaId === 'ostagar', 120, 'ce to ostagar');
};

ORIGIN_RUNS.de = b => {
  const g = b.g;
  b.run(1);
  b.until(() => !g.dialog && g.flag('de_humans_done'), 30, 'humans');
  ok(g.party.some(c => c.key === 'tamlen'), 'tamlen joined');
  b.run(4);
  b.killGroup('dr_wolves');
  b.killGroup('dr_spiders');
  b.exit('to_ruins');
  b.killGroup('er_skel');
  b.killGroup('er_spider');
  b.use('eluvian');
  b.until(() => g.areaId === 'dalish_camp' && g.flag('de_return') && !g.dialog && g.mode === 'play', 60, 'camp wake');
  ok(g.party.some(c => c.key === 'merrill'), 'merrill joined');
  b.talk('ilen');
  b.talk('paivel');
  b.exit('camp_to_ruins');
  b.killGroup('er_ds1');
  b.killGroup('er_ds2');
  b.use('eluvian_b');
  b.until(() => g.areaId === 'ostagar', 120, 'de to ostagar');
};

ORIGIN_RUNS.dn = b => {
  const g = b.g;
  b.run(1);
  ok(g.party.some(c => c.key === 'gorim'), 'gorim joined');
  b.exit('to_proving');
  b.talk('proving_master');
  b.until(() => g.quests.dn_main >= 2 && !g.combat && !g.dialog, 400, 'proving');
  b.run(2);
  ok(g.party.some(c => c.key === 'gorim'), 'gorim back after proving');
  b.exit('proving_out_dn');
  b.talk('endrin');
  b.talk('bhelen');
  b.exit('to_thaig');
  for (const grp of ['th_ds1', 'th_stalk', 'th_spider', 'th_ds2']) b.killGroup(grp);
  b.use('shield_pedestal');
  b.goTo(12, 30);
  b.until(() => g.areaId === 'deep_exile' && g.mode === 'play', 120, 'exile');
  b.use('ex_pack');
  b.killGroup('ex_ds');
  b.killGroup('ex_ds2');
  b.until(() => g.areaId === 'ostagar', 120, 'dn to ostagar');
};
ORIGIN_RUNS.dc = b => {
  const g = b.g;
  b.run(1);
  ok(g.party.some(c => c.key === 'leske'), 'leske joined');
  b.talk('beraht_npc');
  b.exit('to_proving_dc');
  b.talk('proving_master', 'Кивнуть');
  b.until(() => g.areaId === 'beraht_hideout' && g.mode === 'play', 400, 'hideout');
  b.killGroup('bh_a');
  b.killGroup('bh_b');
  b.use('bh_office');
  b.killGroup('bh_boss');
  b.until(() => g.areaId === 'ostagar', 120, 'dc to ostagar');
};

const combos = [];
const want = process.env.DA_ORIGIN ? process.env.DA_ORIGIN.split(',') : Object.keys(ORIGIN_RUNS);
const seeds = process.env.DA_SEED ? process.env.DA_SEED.split(',').map(Number) : [1];
const clsFor = { hn: ['warrior', 'rogue'], mage: ['mage'], ce: ['rogue', 'warrior'], de: ['rogue', 'warrior'], dn: ['warrior', 'rogue'], dc: ['rogue', 'warrior'] };
const raceFor = { hn: 'human', mage: 'elf', ce: 'elf', de: 'elf', dn: 'dwarf', dc: 'dwarf' };
for (const o of want) for (const seed of seeds) for (const cls of (process.env.DA_CLS ? [process.env.DA_CLS] : clsFor[o].slice(0, 1))) combos.push({ origin: o, cls, race: raceFor[o], seed, sex: process.env.DA_SEX || 'm' });
const full = !process.env.DA_ORIGIN_ONLY;
for (const c of combos) {
  if (!ORIGIN_RUNS[c.origin]) continue;
  const b = new Bot(c);
  const t = Date.now();
  b.start();
  try {
    ORIGIN_RUNS[c.origin](b);
    if (full) { OSTAGAR(b); WILDS(b); JOINING(b); TOWER(b); LOTHERING(b); }
  } catch (e) {
    console.log('FAIL', JSON.stringify(c), 'area', b.g.areaId, 'lvl', b.g.pc.lvl);
    console.log(b.trace.slice(-8).join('\n'));
    throw e;
  }
  ok(!full || b.g.mode === 'end', 'finished ' + JSON.stringify(c));
  console.log('run', c.origin, c.cls, 'seed', c.seed, 'lvl', b.g.pc.lvl, 'kills', b.g.stats.kills, 'deaths', b.g.stats.deaths, 'game', Math.round(b.time) + 's', 'real', (Date.now() - t) + 'ms', 'party', b.g.party.map(x => x.key + ':' + x.lvl).join(','));
}

console.log(`dao98: ${checks} checks passed in ${Date.now() - t0} ms`);
