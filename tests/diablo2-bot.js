const path = require('path');
const ROOT = path.join(__dirname, '..');
const ORDER = ['d2-core', 'd2-data-classes', 'd2-data-items', 'd2-data-monsters', 'd2-data-world', 'd2-items', 'd2-path', 'd2-mapgen', 'd2-hero', 'd2-game', 'd2-skills', 'd2-ai', 'd2-inv'];
let D;
for (const f of ORDER) D = require(path.join(ROOT, 'js/apps/diablo2', f + '.js'));

const BUILDS = {
  amazon: { left: ['jab', 'power_strike', 'charged_strike'], right: [], skills: ['jab', 'jab', 'critical_strike', 'power_strike', 'power_strike', 'dodge', 'jab', 'power_strike', 'power_strike', 'penetrate', 'charged_strike', 'charged_strike', 'charged_strike', 'charged_strike', 'lightning_fury'], stats: { str: 0.25, dex: 0.35, vit: 0.4 } },
  assassin: { left: ['tiger_strike', 'dragon_talon'], right: ['fire_blast'], skills: ['claw_mastery', 'tiger_strike', 'fire_blast', 'fire_blast', 'burst_of_speed', 'fire_blast', 'fire_blast', 'fire_blast', 'fire_blast', 'shock_web', 'fire_blast', 'fire_blast', 'fire_blast', 'charged_bolt_sentry', 'charged_bolt_sentry'], stats: { str: 0.2, dex: 0.3, vit: 0.5 } },
  necromancer: { left: [], right: ['teeth', 'bone_spear'], skills: ['teeth', 'raise_skeleton', 'teeth', 'raise_skeleton', 'bone_armor', 'teeth', 'raise_skeleton', 'corpse_explosion', 'teeth', 'raise_skeleton', 'teeth', 'raise_skeleton', 'amplify_damage', 'bone_spear', 'bone_spear', 'bone_spear', 'bone_spear'], stats: { vit: 0.7, ene: 0.3 }, summon: 'raise_skeleton' },
  barbarian: { left: ['bash', 'double_swing', 'leap_attack'], right: ['howl'], skills: ['bash', 'axe_mastery', 'bash', 'howl', 'axe_mastery', 'double_swing', 'bash', 'axe_mastery', 'bash', 'axe_mastery', 'shout', 'bash', 'stun', 'axe_mastery', 'iron_skin', 'bash', 'leap_attack'], stats: { str: 0.35, dex: 0.15, vit: 0.5 } },
  paladin: { left: ['zeal', 'sacrifice'], right: ['might'], skills: ['sacrifice', 'might', 'sacrifice', 'might', 'sacrifice', 'holy_bolt', 'might', 'sacrifice', 'defiance', 'might', 'sacrifice', 'zeal', 'zeal', 'zeal', 'zeal', 'holy_fire'], stats: { str: 0.35, dex: 0.15, vit: 0.5 } },
  sorceress: { left: [], right: ['fire_bolt', 'fire_ball'], skills: ['fire_bolt', 'frozen_armor', 'fire_bolt', 'fire_bolt', 'fire_bolt', 'fire_bolt', 'fire_bolt', 'fire_bolt', 'fire_bolt', 'fire_bolt', 'static_field', 'fire_bolt', 'fire_ball', 'fire_ball', 'fire_ball', 'fire_ball'], stats: { vit: 0.75, ene: 0.25 } },
  druid: { left: ['fury'], right: ['firestorm', 'molten_boulder'], skills: ['firestorm', 'raven', 'firestorm', 'firestorm', 'firestorm', 'firestorm', 'oak_sage', 'firestorm', 'firestorm', 'firestorm', 'firestorm', 'firestorm', 'molten_boulder', 'molten_boulder', 'molten_boulder'], stats: { vit: 0.7, ene: 0.15, str: 0.15 } }
};

const ROUTE = ['bloodmoor', 'den', 'coldplains', 'burial', 'stonyfield', 'darkwood', 'blackmarsh', 'tower1', 'tower2', 'tamoe', 'barracks', 'jail', 'cathedral', 'catacombs1', 'catacombs2', 'lair'];

function itemScore(it) {
  const b = D.BASES[it.base];
  if (!b) return 0;
  if (b.cat === 'weapon') { const d = D.weaponDamage(it); return (d.min + d.max) * (b.hands === 2 ? 0.8 : 1) + Object.keys(it.stats).length * 2; }
  if (b.cat === 'armor') return D.armorDefense(it) + Object.keys(it.stats).length * 4;
  if (b.cat === 'jewel') return 10 + Object.keys(it.stats).length * 5;
  return 0;
}

class Bot {
  constructor(cls, o) {
    o = o || {};
    this.cls = cls;
    this.b = BUILDS[cls];
    this.ch = D.newChar('Bot' + cls, cls, false);
    this.g = new D.Game(this.ch, { diff: o.diff || 0, seed: o.seed || 1234 });
    this.skillIdx = 0;
    this.deaths = 0;
    this.log = [];
    this.errors = [];
    this.time = 0;
  }

  step(n) {
    const g = this.g;
    for (let i = 0; i < n; i++) {
      try { g.update(1 / 20); } catch (e) { this.errors.push(e.stack); throw e; }
      this.time += 1 / 20;
      for (const ev of g.events.splice(0)) {
        if (ev.t === 'herodeath') this.deaths++;
        if (ev.t === 'lvlup') this.log.push('lvl ' + ev.lvl + ' @' + g.area.id);
      }
      if (g.hero.dead && g.hero.deathT > 1) { g.respawn(); g.retrieveCorpse(true); return 'died'; }
    }
    return null;
  }

  alloc() {
    const ch = this.ch, g = this.g;
    while (ch.statPts > 0) {
      const st = this.b.stats;
      let best = 'vit', bd = -1e9;
      const tot = Object.values(ch.stats).reduce((a, b) => a + b, 0);
      for (const k in st) { const want = st[k] * tot, have = ch.stats[k]; if (want - have > bd) { bd = want - have; best = k; } }
      for (const it of D.eqItems(ch).map(x => x[1])) { const r = D.reqs(it); if (ch.stats.str + (g.hero.st.sums.str || 0) < r.str) best = 'str'; }
      g.addStatPoint(best);
    }
    let guard = 0;
    while (ch.skillPts > 0 && guard++ < 50) {
      const list = this.b.skills;
      let learned = false;
      for (let k = 0; k < list.length && !learned; k++) {
        const id = list[(this.skillIdx + k) % list.length];
        if (g.canLearn(id)) { g.learnSkill(id); learned = true; this.skillIdx = (this.skillIdx + k + 1) % list.length; }
      }
      if (!learned) break;
    }
    const pick = (arr, side) => { for (let i = arr.length - 1; i >= 0; i--) if (D.skillLevel(g.hero, arr[i]) > 0) return arr[i]; return side === 'left' ? 'attack' : null; };
    ch.left = pick(this.b.left, 'left');
    const r = pick(this.b.right, 'right');
    ch.right = r || 'attack';
  }

  upgrade() {
    const g = this.g, ch = this.ch;
    for (const it of ch.inv.slice()) {
      const b = D.BASES[it.base];
      if (!(b.cat === 'weapon' || b.cat === 'armor' || b.cat === 'jewel')) continue;
      it.idf = true;
      if (!g.reqsMet(it)) continue;
      const slots = b.type === 'ring' ? ['ring1', 'ring2'] : b.cat === 'weapon' ? ['rh'] : D.SLOTS.filter(s => D.slotAccepts(s, b) && s !== 'rh2' && s !== 'lh2' && !(s === 'lh' && b.cat === 'weapon'));
      for (const s of slots) {
        if (!D.canEquip(ch, it, s)) continue;
        if (b.cat === 'weapon' && this.cls === 'sorceress' && b.type !== 'staff' && b.type !== 'orb') continue;
        if (b.cat === 'weapon' && this.cls === 'amazon' && b.type !== 'javelin' && b.type !== 'spear') continue;
        if (b.cat === 'weapon' && this.cls === 'assassin' && b.type !== 'claw') continue;
        if (b.cat === 'weapon' && (this.cls === 'paladin' || this.cls === 'barbarian') && (b.type === 'javelin' || b.throwable)) continue;
        if (b.cat === 'weapon' && b.hands === 2 && ch.equip.lh && D.BASES[ch.equip.lh.base].type === 'shield' && this.cls !== 'sorceress') continue;
        const cur = ch.equip[s];
        if (!cur || itemScore(it) > itemScore(cur) * 1.1) {
          D.invGrid(ch).remove(it);
          g.held = it;
          if (!g.equipHeld(s)) { D.invGrid(ch).add(it); g.held = null; break; }
          if (g.held) { if (!D.invGrid(ch).add(g.held)) g.dropHeld(); g.held = null; }
          break;
        }
      }
    }
  }

  townTrip() {
    const g = this.g, ch = this.ch;
    const back = g.area.id;
    const pos = { x: g.hero.x, y: g.hero.y };
    g.enterArea('town', 'start');
    g.hero.hp = g.hero.hpMax; g.hero.mp = g.hero.mpMax; g.hero.fx.poison = null;
    for (const it of ch.inv.slice()) {
      const b = D.BASES[it.base];
      if (b.cat === 'weapon' || b.cat === 'armor' || b.cat === 'jewel' || b.cat === 'charm' || b.type === 'gem') g.sell('charsi', it);
    }
    this.upgrade();
    g.repairAll();
    const tier = ch.level < 8 ? 2 : ch.level < 20 ? 3 : 4;
    const stock = g.shopStock('akara');
    const hp = stock.find(i => i.base === 'hp' + Math.min(tier, 3)) || stock.find(i => i.base === 'hp2') || stock.find(i => i.base === 'hp1');
    const mp = stock.find(i => i.base === 'mp' + Math.min(tier, 3)) || stock.find(i => i.base === 'mp1');
    const rows = D.beltRows(ch);
    let guard = 0;
    while (ch.belt.filter(Boolean).length < rows * 4 && guard++ < 20) {
      const caster = this.cls === 'sorceress' || this.cls === 'necromancer' || this.cls === 'druid';
      const want = caster && ch.belt.filter(x => x && D.BASES[x.base].type === 'mpot').length < rows * 2 ? mp : hp;
      if (!g.buy('akara', want, true)) break;
    }
    if (!ch.merc && ch.gold > 400 && ch.level >= 3) { const offers = g.mercList(); if (offers[0]) g.hireMerc(offers[0]); }
    if (ch.merc && ch.merc.dead) g.reviveMerc();
    if (back !== 'town') g.enterArea(back, pos);
  }

  nearestMon() {
    const g = this.g, h = g.hero;
    let best = null, bd = 1e9;
    for (const e of g.ents) {
      if (e.kind !== 'mon' || e.dead) continue;
      const d = Math.hypot(e.x - h.x, e.y - h.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  fight(m, maxT) {
    const g = this.g, h = g.hero;
    let t = 0;
    while (!m.dead && t < maxT) {
      if (h.dead) { const r0 = this.step(30); if (r0 === 'died') return 'died'; continue; }
      if (h.hp < h.hpMax * 0.45) { let used = false; for (let c = 0; c < 4 && !used; c++) { const it = this.ch.belt[c]; if (it && D.BASES[it.base].type !== 'mpot') used = g.beltUse(c); } if (!used && h.hp < h.hpMax * 0.3 && !h.pots.length) { this.townTrip(); this.retreats = (this.retreats || 0) + 1; return 'retreat'; } }
      if (h.mp < h.mpMax * 0.2) { for (let c = 0; c < 4; c++) { const it = this.ch.belt[c]; if (it && D.BASES[it.base].type === 'mpot') { g.beltUse(c); break; } } }
      if (this.b.summon && D.skillLevel(h, this.b.summon) && !h.act && g.pets.filter(p => !p.dead && p.unit === 'skeleton').length < D.raiseMax(D.skillLevel(h, this.b.summon))) {
        const corpse = g.corpseNear(h.x, h.y, 10);
        if (corpse && h.mp > 15) { this.ch.right = this.b.summon; g.cmdSkill('right', corpse.x, corpse.y, corpse, false); this.step(12); t += 0.6; this.alloc(); continue; }
      }
      if (!h.act) {
        const useRight = this.ch.right !== 'attack' && D.SKILLS[this.ch.right] && ['bolt', 'nova', 'chain', 'meteor', 'blizzard', 'shot', 'curse'].includes(D.SKILLS[this.ch.right].kind) && h.mp > D.manaCost(D.SKILLS[this.ch.right], D.skillLevel(h, this.ch.right)) * 2;
        if (useRight) g.cmdSkill('right', m.x, m.y, m, true, true);
        else g.cmdSkill('left', m.x, m.y, m, true);
      }
      const r = this.step(4);
      t += 0.2;
      if (r === 'died') return 'died';
    }
    return m.dead ? 'kill' : 'timeout';
  }

  pickup() {
    const g = this.g, h = g.hero;
    for (const gi of g.area.items.slice()) {
      if (Math.hypot(gi.x - h.x, gi.y - h.y) > 9) continue;
      if (!gi.gold) {
        const b = D.BASES[gi.item.base];
        if (b.type === 'quest' || b.id === 'q_malus' || b.type === 'hpot' || b.type === 'mpot' || b.type === 'rpot' || b.cat === 'weapon' || b.cat === 'armor' || b.cat === 'jewel' || b.type === 'scroll' || b.type === 'gem' || b.type === 'rune' || b.cat === 'charm') { h.x = gi.x; h.y = gi.y; g.pickUp(gi); }
      } else { h.x = gi.x; h.y = gi.y; g.pickUp(gi); }
    }
  }

  clearArea(id, o) {
    o = o || {};
    const g = this.g;
    if (g.area.id !== id) g.enterArea(id, o.entry || 'start');
    let kills = 0, guard = 0;
    while (guard++ < 600) {
      this.alloc();
      this.upgrade();
      const potions = this.ch.belt.filter(it => it && D.BASES[it.base].type !== 'mpot').length;
      if (potions < 3 && kills - (this.tripAt === undefined ? -99 : this.tripAt) >= 6) { this.tripAt = kills; this.townTrip(); }
      let m = this.nearestMon();
      if (o.boss) { const b = g.ents.find(e => e.su === o.boss && !e.dead); if (b && (!m || Math.hypot(m.x - g.hero.x, m.y - g.hero.y) > 12)) m = b; }
      if (!m) break;
      const h = g.hero;
      if (Math.hypot(m.x - h.x, m.y - h.y) > 8) {
        const a = Math.atan2(h.y - m.y, h.x - m.x);
        const p = D.nearestWalkable(g.area, m.x + Math.cos(a) * 6, m.y + Math.sin(a) * 6, 4) || D.nearestWalkable(g.area, m.x, m.y, 4);
        if (p) { h.x = p.x; h.y = p.y; }
        for (const pet of g.pets) if (!pet.dead) { const s = g.freeSpot(g.area, h.x, h.y, 2); if (s) { pet.x = s.x; pet.y = s.y; } }
      }
      const r = this.fight(m, 60);
      if (r === 'kill') kills++;
      if (r === 'died') { g.enterArea(id, 'start'); }
      if (r === 'timeout') { m.dead = true; m.hp = 0; m.noCorpse = true; }
      this.pickup();
      if (o.boss && g.ents.every(e => e.su !== o.boss || e.dead) && o.stopAfterBoss) break;
    }
    return kills;
  }
}

module.exports = { D, Bot, BUILDS, ROUTE, itemScore };

if (require.main === module) {
  const classes = process.argv[2] ? process.argv[2].split(',') : Object.keys(BUILDS);
  const upto = process.argv[3] || 'lair';
  for (const cls of classes) {
    const bot = new Bot(cls, { seed: 777 });
    const t0 = Date.now();
    const rows = [];
    for (const id of ROUTE) {
      const ta = Date.now();
      const k = bot.clearArea(id, { boss: D.AREAS[id].su });
      rows.push(id + ':' + k + '/L' + bot.ch.level + '/d' + bot.deaths);
      if (process.argv.includes('-p')) console.log('  ', cls, id, 'kills', k, 'lvl', bot.ch.level, 'deaths', bot.deaths, (Date.now() - ta) + 'ms', 'q', JSON.stringify(bot.g.prog.q));
      if (id === upto) break;
    }
    console.log(cls.padEnd(12), 'lvl', bot.ch.level, 'deaths', bot.deaths, 'gold', bot.ch.gold, 'time', Math.round(bot.time) + 's', (Date.now() - t0) + 'ms');
    console.log('   ', rows.join(' '));
  }
}
