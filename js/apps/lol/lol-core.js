/**
 * League of Legends 98 — game simulation (no DOM). Fixed 30 Hz step. Units (champions, minions, turrets,
 * inhibitors, nexus, jungle monsters, pets, traps, wards), orders, basic attacks, projectiles, damage and crowd
 * control, items and shop, summoner spells, gold and experience, minion waves, jungle camps and buffs,
 * turret rules, fog of war with brush and stealth, recall, fountain, respawn and victory. Emits events for UI/audio.
 */
(function (L) {
  'use strict';
  const D = L.DATA;
  const { DT, MAP, XP_TABLE, CHAMPS, ITEMS, SPELLS, MINIONS, TOWER, TOWER_HP, MONSTERS } = D;
  const VIS_CELL = 200, VIS_N = MAP / VIS_CELL;
  const HASH = 400, HASH_N = Math.ceil(MAP / HASH);
  const CC_TYPES = new Set(['stun', 'root', 'silence', 'disarm', 'poly', 'knockup', 'blind', 'slow']);

  function RNG(seed) { let s = seed >>> 0 || 1; return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // ------------------------------------------------------------------ team setup
  const ROLE_ORDER = ['top', 'jungle', 'mid', 'adc', 'support'];
  function autoTeams(opts, rng) {
    // opts: { champ, role, team, spells, name } for the human (champ may be null for spectating)
    const pool = D.CHAMP_ORDER.slice(), slots = [];
    const take = id => { const i = pool.indexOf(id); if (i >= 0) pool.splice(i, 1); return id; };
    const human = opts.champ ? { champ: take(opts.champ), team: opts.team || 0, role: null, bot: false, name: opts.name || 'Summoner', spells: opts.spells || ['flash', 'heal'] } : null;
    const teams = [[], []];
    if (human) teams[human.team].push(human);
    // fill each team's remaining roles by affinity
    for (let t = 0; t < 2; t++) {
      const roles = ROLE_ORDER.slice();
      if (human && human.team === t) {
        const want = opts.role && opts.role !== 'any' ? opts.role : (CHAMPS[human.champ].roles.find(r => roles.includes(r)) || roles[0]);
        human.role = want; roles.splice(roles.indexOf(want), 1);
      }
      while (teams[t].length < 5) {
        let best = null, bs = -1;
        for (const r of roles) for (const id of pool) {
          const aff = CHAMPS[id].roles.indexOf(r); const sc = (aff < 0 ? 0 : aff === 0 ? 10 : 6) + rng() * 3;
          if (sc > bs) { bs = sc; best = [r, id]; }
        }
        roles.splice(roles.indexOf(best[0]), 1); take(best[1]);
        teams[t].push({ champ: best[1], team: t, role: best[0], bot: true });
      }
    }
    const names = D.BOT_NAMES.slice();
    for (let t = 0; t < 2; t++) for (const s of teams[t]) {
      if (s.bot) {
        s.name = names.splice(Math.floor(rng() * names.length), 1)[0];
        s.spells = s.role === 'jungle' ? ['flash', 'smite'] : s.role === 'support' ? ['flash', 'exhaust'] : s.role === 'adc' ? ['flash', 'heal'] : s.role === 'mid' ? ['flash', 'ignite'] : ['flash', rng() < 0.5 ? 'ignite' : 'ghost'];
      }
      slots.push(s);
    }
    return slots;
  }

  // ------------------------------------------------------------------ game
  class Game {
    constructor(opts = {}) {
      this.opts = opts;
      this.rng = RNG(opts.seed || 1);
      this.diff = opts.diff == null ? 1 : opts.diff;
      this.map = new L.Map();
      this.time = 0; this.tickN = 0; this.nextId = 0;
      this.units = []; this.champs = []; this.projectiles = []; this.timers = []; this.events = [];
      this.hash = new Array(HASH_N * HASH_N); for (let i = 0; i < this.hash.length; i++) this.hash[i] = [];
      this.vis = [new Uint8Array(VIS_N * VIS_N), new Uint8Array(VIS_N * VIS_N)];
      this.teamStats = [{ kills: 0, towers: 0, dragons: 0, barons: 0 }, { kills: 0, towers: 0, dragons: 0, barons: 0 }];
      this.dragonStacks = [0, 0];
      this.firstBlood = false; this.winner = -1; this.waveN = 0; this.nextWave = 30; this.announced = {};
      this.surrenderT = 0;
      this.buildStructures();
      this.camps = this.map.camps.map(c => ({ def: c, alive: [], respawnAt: c.first }));
      const slots = opts.slots || autoTeams(opts.human || { champ: 'jinx', team: 0 }, this.rng);
      for (const s of slots) this.addChampion(s);
      this.player = this.champs.find(c => !c.bot) || null;
      this.updateVision();
      this.emit({ type: 'announce', key: 'welcome' });
    }
    emit(e) { this.events.push(e); }
    sfx(name, x, y, extra) { this.events.push(Object.assign({ type: 'sfx', name, x, y }, extra)); }
    fx(kind, props) { this.events.push(Object.assign({ type: 'fx', kind }, props)); }
    later(t, fn) { this.timers.push({ at: this.time + t, fn }); }

    // ---------------------------------------------------------------- units
    mkUnit(kind, team, x, y, p = {}) {
      const u = Object.assign({
        id: ++this.nextId, kind, team, x, y, px: x, py: y, r: 50, hp: 100, maxHp: 100, mp: 0, maxMp: 0, dead: false,
        st: { ad: 0, ap: 0, armor: 0, mr: 0, as: 0.625, range: 125, ms: 325, crit: 0, critMul: 2, ls: 0, sv: 0, cdr: 0, mpen: 0, hpReg: 0, mpReg: 0, ten: 0 },
        status: [], shields: [], atkCd: 0, windup: 0, target: null, face: 1, vis: [team === 0, team === 1], hitBy: {}, z: 0,
        anim: { walk: 0, atk: 0, cast: 0, moving: false }, born: this.time, lastDmgT: -99, lastChampDmgT: -99, k: {}, passives: {}
      }, p);
      this.units.push(u);
      return u;
    }
    buildStructures() {
      this.structs = [];
      for (const s of this.map.structs) {
        let u;
        if (s.kind === 'tower') {
          const hp = TOWER_HP[s.tier];
          u = this.mkUnit('tower', s.team, s.p[0], s.p[1], { r: TOWER.r, hp, maxHp: hp, lane: s.lane, tier: s.tier, heat: 0, lastTarget: null });
          Object.assign(u.st, { ad: TOWER.ad, armor: TOWER.armor, mr: TOWER.mr, as: TOWER.as, range: TOWER.range, ms: 0 });
        } else if (s.kind === 'inhib') {
          u = this.mkUnit('inhib', s.team, s.p[0], s.p[1], { r: 110, hp: 3500, maxHp: 3500, lane: s.lane, respawnAt: 0 });
          Object.assign(u.st, { armor: 20, mr: 20, ms: 0 });
        } else {
          u = this.mkUnit('nexus', s.team, s.p[0], s.p[1], { r: 170, hp: 5000, maxHp: 5000, lane: 'mid' });
          Object.assign(u.st, { armor: 0, mr: 0, ms: 0 });
        }
        u.structure = true; u.vis = [true, true];
        this.structs.push(u);
      }
    }
    addChampion(s) {
      const def = CHAMPS[s.champ], f = this.map.fountain[s.team];
      const ang = (this.champs.filter(c => c.team === s.team).length) * 1.1;
      const c = this.mkUnit('champ', s.team, f[0] + Math.cos(ang) * 200 * (s.team ? -1 : 1), f[1] - Math.sin(ang) * 200 * (s.team ? -1 : 1), {
        cid: s.champ, def, name: s.name, bot: !!s.bot, role: s.role, r: 65 * (def.scale > 1.1 ? 1.15 : 1),
        level: 1, xp: 0, gold: 475, goldEarned: 475, items: [null, null, null, null, null, null], ranks: [0, 0, 0, 0], cds: [0, 0, 0, 0], charges: 0, chargeT: 0,
        spells: (s.spells || ['flash', 'heal']).slice(0, 2), spellCds: [0, 0], kills: 0, deaths: 0, assists: 0, cs: 0, spree: 0, deathStreak: 0,
        multi: { n: 0, t: -99 }, respawnT: 0, order: null, path: null, dmgToChamps: 0, k: {}, buys: [], lastSpellT: -99, reviveReadyT: 0, spellshieldT: 0
      });
      c.hp = c.maxHp = def.stats.hp; c.mp = c.maxMp = def.stats.mp;
      this.champs.push(c);
      this.recalc(c); c.hp = c.maxHp; c.mp = c.maxMp;
      this.skillPoint(c, true);
      if (L.KITS && L.KITS[c.cid] && L.KITS[c.cid].init) L.KITS[c.cid].init(this, c);
      return c;
    }
    alive(u) { return u && !u.dead; }
    isStructureVulnerable(u) {
      if (!u.structure) return true;
      const same = this.structs.filter(s => s.team === u.team);
      const dead = (kind, lane, tier) => same.some(s => s.kind === kind && s.lane === lane && (!tier || s.tier === tier) && s.dead);
      if (u.kind === 'tower') {
        if (u.tier === 'outer') return true;
        if (u.tier === 'inner') return dead('tower', u.lane, 'outer');
        if (u.tier === 'inhib') return dead('tower', u.lane, 'inner');
        if (u.tier === 'nexus') return same.some(s => s.kind === 'inhib' && s.dead);
      }
      if (u.kind === 'inhib') return dead('tower', u.lane, 'inhib');
      if (u.kind === 'nexus') return same.filter(s => s.kind === 'tower' && s.tier === 'nexus').every(s => s.dead);
      return true;
    }
    targetable(u, byTeam) {
      if (!u || u.dead || u.kind === 'trap') return false;
      if (this.has(u, 'untargetable') || this.has(u, 'stasis')) return false;
      if (u.team !== byTeam && !u.vis[byTeam]) return false;
      if (u.structure && u.team !== byTeam && !this.isStructureVulnerable(u)) return false;
      return true;
    }
    owner(u) { return u ? (u.kind === 'champ' ? u : u.ownerRef || null) : null; }

    // ---------------------------------------------------------------- statuses
    has(u, type) { for (const s of u.status) if (s.type === type) return s; return null; }
    tagged(u, tag) { for (const s of u.status) if (s.tag === tag) return s; return null; }
    addStatus(u, s) {
      if (u.dead) return null;
      if (CC_TYPES.has(s.type) && s.type !== 'knockup') {
        if (this.has(u, 'ccImmune') || (s.type === 'slow' && this.has(u, 'slowImmune'))) return null;
        const ten = u.kind === 'champ' ? u.st.ten : 0; if (ten) s.t *= (1 - ten);
      }
      if (s.type === 'knockup' && this.has(u, 'ccImmune')) return null;
      if (s.tag) { const old = this.tagged(u, s.tag); if (old) { Object.assign(old, s); old.t = Math.max(old.t, s.t); return old; } }
      s.max = s.t; u.status.push(s);
      if (['stun', 'knockup', 'poly', 'silence', 'root'].includes(s.type)) { this.interruptRecall(u); if (u.k.channel && s.type !== 'root') this.endChannel(u); }
      if (s.type === 'stun' || s.type === 'knockup' || s.type === 'poly') u.windup = 0;
      return s;
    }
    cc(u, type, t, src, extra) { return this.addStatus(u, Object.assign({ type, t, src }, extra)); }
    slow(u, amt, t, src, tag) { return this.addStatus(u, { type: 'slow', amt, t, src, tag }); }
    buff(u, tag, t, stats, extra) { return this.addStatus(u, Object.assign({ type: 'buff', tag, t, stats }, extra)); }
    removeStatus(u, pred) { u.status = u.status.filter(s => !pred(s)); }
    cleanse(u) { this.removeStatus(u, s => CC_TYPES.has(s.type) || s.type === 'knockup'); }
    canMove(u) { return !u.dash && !u.status.some(s => s.type === 'stun' || s.type === 'root' || s.type === 'knockup' || s.type === 'stasis' || s.type === 'channel'); }
    canAct(u) { return !u.dash && !u.status.some(s => s.type === 'stun' || s.type === 'knockup' || s.type === 'stasis'); }
    canAttack(u) { return this.canAct(u) && !u.status.some(s => s.type === 'disarm' || s.type === 'poly' || s.type === 'noAttack' || s.type === 'channel'); }
    canCast(u) { return this.canAct(u) && !u.status.some(s => s.type === 'silence' || s.type === 'poly' || s.type === 'channel'); }
    shield(u, amt, t, tag) { if (tag) { const o = u.shields.find(s => s.tag === tag); if (o) { o.amt = Math.max(o.amt, amt); o.t = t; return; } } u.shields.push({ amt, t, tag, max: amt }); }
    shieldTotal(u) { let s = 0; for (const x of u.shields) s += x.amt; return s; }
    heal(u, amt, src) {
      if (u.dead) return 0;
      if (this.has(u, 'grievous')) amt *= 0.5;
      const h = Math.min(amt, u.maxHp - u.hp); u.hp += h;
      if (h > 1 && src && src.kind === 'champ') this.emit({ type: 'dmg', x: u.x, y: u.y, amt: Math.round(h), dtype: 'heal', tgt: u.id });
      return h;
    }

    // ---------------------------------------------------------------- stats
    recalc(c) {
      const d = c.def.stats, g = c.level - 1, st = c.st;
      const add = { ad: 0, ap: 0, hp: 0, mp: 0, armor: 0, mr: 0, asp: 0, crit: 0, ls: 0, msFlat: 0, msPct: 0, hpReg: 0, mpReg: 0, cdr: 0, mpen: 0, ten: 0, sv: 0 };
      let apMul = 1, critMul = 2;
      const pass = c.passives = {};
      for (const it of c.items) {
        if (!it) continue; const def = ITEMS[it.id];
        if (def.stats) for (const k in def.stats) add[k] += def.stats[k];
        if (def.passive) pass[def.passive] = true;
      }
      if (pass.deathcap) apMul += 0.3;
      if (pass.ie) critMul = 2.5;
      for (const s of c.status) if (s.type === 'buff' && s.stats) for (const k in s.stats) add[k] = (add[k] || 0) + s.stats[k];
      const dr = this.dragonStacks[c.team];
      c.bonusAd = add.ad;
      st.ad = (d.ad + d.adG * g + add.ad) * (1 + dr * 0.05);
      c.baseAd = d.ad + d.adG * g;
      c.bonusAd = st.ad - c.baseAd;
      st.armor = d.armor + d.armorG * g + add.armor;
      st.mr = d.mr + d.mrG * g + add.mr;
      st.as = Math.min(2.5, d.as * (1 + (d.asG * g) / 100 + add.asp));
      st.crit = Math.min(1, add.crit); st.critMul = critMul;
      st.ls = add.ls; st.sv = add.sv; st.cdr = Math.min(0.4, add.cdr); st.mpen = add.mpen; st.ten = Math.min(0.7, add.ten);
      st.hpReg = d.hpReg + d.hpRegG * g + add.hpReg; st.mpReg = d.mpReg + d.mpRegG * g + add.mpReg;
      st.range = d.range;
      const maxHp = d.hp + d.hpG * g + add.hp, maxMp = c.def.manaless ? 0 : d.mp + d.mpG * g + add.mp;
      if (c.maxHp && maxHp > c.maxHp && !c.dead) c.hp += maxHp - c.maxHp;
      if (c.maxMp && maxMp > c.maxMp && !c.dead) c.mp += maxMp - c.maxMp;
      c.maxHp = maxHp; c.maxMp = maxMp; c.hp = Math.min(c.hp, maxHp); c.mp = Math.min(c.mp, maxMp);
      let ap = (add.ap + (pass.archangel ? maxMp * 0.03 : 0)) * (1 + dr * 0.05);
      st.ap = ap * apMul;
      // movement: flat, then percent, strongest slow only
      let slow = 0; for (const s of c.status) if (s.type === 'slow' && s.amt > slow) slow = s.amt;
      if (this.has(c, 'poly')) slow = Math.max(slow, 0.6);
      if (this.has(c, 'slowImmune')) slow = 0;
      st.ms = Math.max(110, (d.ms + add.msFlat) * (1 + add.msPct) * (1 - slow));
      const kit = L.KITS && L.KITS[c.cid]; if (kit && kit.stats) kit.stats(this, c, st);
      // attack speed slows (Malphite E, Frozen Heart aura)
      let asSlow = 0; for (const s of c.status) if (s.type === 'asSlow' && s.amt > asSlow) asSlow = s.amt;
      if (asSlow) st.as = Math.max(0.2, st.as * (1 - asSlow));
    }
    recalcSimple(u) {
      let slow = 0; for (const s of u.status) if (s.type === 'slow' && s.amt > slow) slow = s.amt;
      if (this.has(u, 'poly')) slow = Math.max(slow, 0.6);
      u.st.ms = u.baseMs * (1 - slow);
      let asSlow = 0; for (const s of u.status) if (s.type === 'asSlow' && s.amt > asSlow) asSlow = s.amt;
      u.st.as = u.baseAs * (1 - asSlow);
      let ad = u.baseAd; for (const s of u.status) if (s.type === 'buff' && s.stats && s.stats.ad) ad += s.stats.ad;
      u.st.ad = ad;
    }

    // ---------------------------------------------------------------- spatial
    rehash() {
      for (const b of this.hash) b.length = 0;
      for (const u of this.units) {
        if (u.dead) continue;
        const i = clamp(Math.floor(u.x / HASH), 0, HASH_N - 1), j = clamp(Math.floor(u.y / HASH), 0, HASH_N - 1);
        this.hash[j * HASH_N + i].push(u);
      }
    }
    near(x, y, r, fn) {
      const out = [], i0 = clamp(Math.floor((x - r) / HASH), 0, HASH_N - 1), i1 = clamp(Math.floor((x + r) / HASH), 0, HASH_N - 1);
      const j0 = clamp(Math.floor((y - r) / HASH), 0, HASH_N - 1), j1 = clamp(Math.floor((y + r) / HASH), 0, HASH_N - 1);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) for (const u of this.hash[j * HASH_N + i]) {
        if (u.dead) continue; const d = Math.hypot(u.x - x, u.y - y) - u.r * 0.5;
        if (d <= r && (!fn || fn(u))) out.push(u);
      }
      return out;
    }
    // enemies of `team` inside a circle that area spells may hit (no structures, wards or traps)
    enemiesIn(x, y, r, team, champsOnly) {
      return this.near(x, y, r, u => u.team !== team && !u.structure && u.kind !== 'ward' && u.kind !== 'trap' && !this.has(u, 'untargetable') && !this.has(u, 'stasis') && (!champsOnly || u.kind === 'champ'));
    }
    alliesIn(x, y, r, team, champsOnly = true) { return this.near(x, y, r, u => u.team === team && (champsOnly ? u.kind === 'champ' : !u.structure && u.kind !== 'ward' && u.kind !== 'trap')); }

    // ---------------------------------------------------------------- orders (UI and AI)
    order(c, o) {
      if (c.dead || !o) return;
      if (o.type === 'move' || o.type === 'attackMove') {
        if (o.type === 'move' && c.k.channel) this.endChannel(c);
        this.interruptRecall(c);
        c.order = o; c.path = null; c.target = null;
      } else if (o.type === 'attack') {
        if (!o.unit || o.unit.team === c.team) return;
        this.interruptRecall(c); if (c.k.channel) this.endChannel(c);
        c.order = o; c.path = null; c.target = o.unit;
      } else if (o.type === 'stop') { c.order = null; c.path = null; c.target = null; c.windup = 0; }
    }
    interruptRecall(u) { const r = this.has(u, 'recall'); if (r) { this.removeStatus(u, s => s === r); this.emit({ type: 'recallEnd', unit: u.id, done: false }); } }
    recall(c) {
      if (c.dead || this.has(c, 'recall') || !this.canCast(c)) return false;
      c.order = null; c.path = null; c.target = null; c.windup = 0;
      this.addStatus(c, { type: 'recall', t: this.tagged(c, 'baron') ? 4 : 8 });
      this.sfx('recall', c.x, c.y);
      return true;
    }
    endChannel(c) { if (c.k.channel) { const ch = c.k.channel; c.k.channel = null; this.removeStatus(c, s => s.type === 'channel'); if (ch.onEnd) ch.onEnd(); } }

    // ---------------------------------------------------------------- abilities
    abilityCost(c, slot) { const a = c.def.abilities[slot], r = c.ranks[slot]; return r ? a.cost[r - 1] : 0; }
    castCheck(c, slot, tgt) {
      const a = c.def.abilities[slot], r = c.ranks[slot];
      if (c.dead) return 'dead';
      if (!r) return 'unlearned';
      if (a.target === 'passive') return 'passive';
      if (c.cid === 'teemo' && slot === 3) { if (c.charges < 1) return 'cooldown'; }
      else if (c.cds[slot] > 0) return 'cooldown';
      if (!this.canCast(c)) return 'cc';
      if (c.mp < this.abilityCost(c, slot)) return 'mana';
      if (a.target === 'enemy' || a.target === 'ally' || a.target === 'unit') {
        const u = tgt && tgt.unit;
        if (!u || u.dead || u.structure || u.kind === 'ward' || u.kind === 'trap') return 'target';
        if (a.target === 'enemy' && (u.team === c.team || !this.targetable(u, c.team))) return 'target';
        if (a.target === 'ally' && (u.team !== c.team || u.kind !== 'champ')) return 'target';
        if (a.target === 'unit' && u.team !== c.team && !this.targetable(u, c.team)) return 'target';
        if (a.target === 'unit' && u.team === c.team && u.kind !== 'champ') return 'target';
      }
      if ((a.target === 'point' || a.target === 'dir') && (!tgt || tgt.x == null)) return 'target';
      return null;
    }
    // queue a cast: walks into range for targeted/point abilities, casts instantly otherwise
    cast(c, slot, tgt) {
      const err = this.castCheck(c, slot, tgt);
      if (err) return err;
      const a = c.def.abilities[slot];
      const needsRange = a.target === 'enemy' || a.target === 'unit' || (a.target === 'ally' && tgt.unit !== c) || (a.target === 'point' && a.range < 3000 && !(c.cid === 'malphite' && slot === 3));
      if (needsRange) {
        const tx = tgt.unit ? tgt.unit.x : tgt.x, ty = tgt.unit ? tgt.unit.y : tgt.y;
        const d = Math.hypot(tx - c.x, ty - c.y) - (tgt.unit ? tgt.unit.r * 0.5 : 0);
        if (d > a.range + 10) { this.interruptRecall(c); c.order = { type: 'cast', slot, tgt }; c.path = null; return null; }
      }
      return this.doCast(c, slot, tgt);
    }
    doCast(c, slot, tgt) {
      const a = c.def.abilities[slot], r = c.ranks[slot], kit = L.KITS[c.cid];
      if (a.target === 'point' && tgt.x != null && c.cid !== 'ashe') {
        // clamp point targets to range
        const dx = tgt.x - c.x, dy = tgt.y - c.y, d = Math.hypot(dx, dy);
        if (d > a.range) tgt = { x: c.x + dx / d * a.range, y: c.y + dy / d * a.range, unit: tgt.unit };
      }
      this.interruptRecall(c);
      if (!this.inTick) this.rehash(); // casts from the UI between ticks see fresh positions
      const ok = kit.cast[slot](this, c, r, tgt);
      if (ok === false) return 'target';
      c.mp -= this.abilityCost(c, slot);
      if (!(c.cid === 'teemo' && slot === 3)) c.cds[slot] = a.cd[r - 1] * (1 - c.st.cdr);
      else c.charges--;
      c.lastSpellT = this.time; c.anim.cast = 0.35;
      if (tgt && tgt.x != null) c.face = tgt.x >= c.x ? 1 : -1; else if (tgt && tgt.unit) c.face = tgt.unit.x >= c.x ? 1 : -1;
      if (c.passives.spellblade1 || c.passives.spellblade2 || c.passives.lich) { if ((c.k.sbCd || 0) <= this.time) c.k.spellblade = this.time + 10; }
      if (kit.afterCast) kit.afterCast(this, c, slot);
      if (c.order && c.order.type === 'cast') c.order = c.order.resume || null;
      this.emit({ type: 'cast', unit: c.id, slot, cid: c.cid });
      return null;
    }
    skillPoint(c, auto) {
      const spent = c.ranks.reduce((a, b) => a + b, 0);
      c.points = c.level - spent;
      if (auto && c.bot) while (c.points > 0) { if (!this.autoLevel(c)) break; }
    }
    canLevel(c, slot) {
      if (c.points <= 0) return false;
      const r = c.ranks[slot];
      if (slot === 3) return r < 3 && c.level >= 6 + r * 5;
      return r < 5 && r < Math.ceil(c.level / 2);
    }
    levelAbility(c, slot) {
      if (!this.canLevel(c, slot)) return false;
      c.ranks[slot]++; c.points--;
      if (c.cid === 'teemo' && slot === 3 && c.ranks[3] === 1) { c.charges = 1; c.chargeT = 0; }
      this.emit({ type: 'skill', unit: c.id, slot });
      return true;
    }
    autoLevel(c) {
      const order = c.def.skill;
      const want = order[c.ranks.reduce((a, b) => a + b, 0)];
      if (want != null && this.canLevel(c, want)) return this.levelAbility(c, want);
      for (const s of [3, 0, 1, 2]) if (this.canLevel(c, s)) return this.levelAbility(c, s);
      return false;
    }

    // ---------------------------------------------------------------- summoner spells
    spellCheck(c, idx, tgt) {
      const id = c.spells[idx], sp = SPELLS[id];
      if (c.dead) return 'dead';
      if (c.spellCds[idx] > 0) return 'cooldown';
      if (!this.canAct(c) && id !== 'heal' && id !== 'barrier') return 'cc';
      if (sp.target === 'enemy') {
        const u = tgt && tgt.unit; if (!u || u.team === c.team || !this.targetable(u, c.team) || u.structure) return 'target';
        if (id === 'smite' && u.kind === 'champ') return 'target';
        if ((id === 'ignite' || id === 'exhaust') && u.kind !== 'champ') return 'target';
        if (dist(c, u) > sp.range + u.r) return 'range';
      }
      if (sp.target === 'point' && (!tgt || tgt.x == null)) return 'target';
      return null;
    }
    useSpell(c, idx, tgt) {
      const err = this.spellCheck(c, idx, tgt); if (err) return err;
      const id = c.spells[idx], sp = SPELLS[id];
      this.interruptRecall(c);
      if (!this.inTick) this.rehash();
      switch (id) {
        case 'flash': {
          const dx = tgt.x - c.x, dy = tgt.y - c.y, d = Math.hypot(dx, dy) || 1, s = Math.min(d, sp.range);
          let [nx, ny] = [c.x + dx / d * s, c.y + dy / d * s];
          if (!this.map.walkable(nx, ny)) [nx, ny] = this.map.nearestWalkable(nx, ny);
          this.fx('flash', { x: c.x, y: c.y }); c.x = c.px = nx; c.y = c.py = ny; this.fx('flash', { x: nx, y: ny });
          c.path = null; if (c.order && c.order.type === 'move') c.order = null;
          break;
        }
        case 'heal': {
          const amt = 90 + 15 * c.level; this.heal(c, amt, c); this.buff(c, 'healMs', 1, { msPct: 0.3 });
          const al = this.alliesIn(c.x, c.y, 700, c.team).filter(a => a !== c).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (al) { this.heal(al, amt, c); this.buff(al, 'healMs', 1, { msPct: 0.3 }); this.fx('heal', { x: al.x, y: al.y }); }
          this.fx('heal', { x: c.x, y: c.y }); break;
        }
        case 'ignite': this.addStatus(tgt.unit, { type: 'dot', tag: 'ignite', t: 5, dps: (50 + 20 * c.level) / 5, dtype: 'true', src: c }); this.addStatus(tgt.unit, { type: 'grievous', tag: 'grievous', t: 5 }); this.fx('ignite', { unit: tgt.unit.id }); break;
        case 'ghost': this.buff(c, 'ghost', 10, { msPct: 0.3 }); this.addStatus(c, { type: 'ghost', t: 10, tag: 'ghostC' }); break;
        case 'exhaust': this.slow(tgt.unit, 0.3, 2.5, c, 'exhaust'); this.addStatus(tgt.unit, { type: 'weak', tag: 'weak', t: 2.5, amt: 0.4 }); this.fx('exhaust', { unit: tgt.unit.id }); break;
        case 'barrier': this.shield(c, 115 + 20 * c.level, 2, 'barrier'); this.fx('barrier', { x: c.x, y: c.y }); break;
        case 'smite': this.damage(c, tgt.unit, 390 + 20 * c.level, 'true', { smite: true }); this.fx('smite', { x: tgt.unit.x, y: tgt.unit.y }); break;
      }
      c.spellCds[idx] = sp.cd;
      this.sfx('spell_' + id, c.x, c.y);
      return null;
    }

    // ---------------------------------------------------------------- items & shop
    inShop(c) { const f = this.map.fountain[c.team]; return c.dead || Math.hypot(c.x - f[0], c.y - f[1]) < 1300; }
    // components already owned that an item would consume (recursive), and the price to pay
    buyPlan(c, id) {
      const owned = c.items.map((it, i) => it ? { id: it.id, i } : null).filter(Boolean);
      const used = [];
      const want = (iid) => {
        const k = owned.findIndex(o => o.id === iid && !used.includes(o.i));
        if (k >= 0) { used.push(owned[k].i); return ITEMS[iid].cost; }
        let saved = 0; for (const f of ITEMS[iid].from || []) saved += want(f);
        return saved;
      };
      let saved = 0; for (const f of ITEMS[id].from || []) saved += want(f);
      return { price: ITEMS[id].cost - saved, used };
    }
    canBuy(c, id) {
      const def = ITEMS[id]; if (!def) return 'unknown';
      if (!this.inShop(c)) return 'shop';
      if (def.stack) { const st = c.items.find(it => it && it.id === id); if (st && st.n < def.stack && c.gold >= def.cost) return null; }
      const plan = this.buyPlan(c, id);
      if (c.gold < plan.price) return 'gold';
      if (def.boots && c.items.some(it => it && ITEMS[it.id].boots && !plan.used.includes(c.items.indexOf(it)))) return 'boots';
      const free = c.items.filter(x => !x).length + plan.used.length;
      if (free < 1) return 'full';
      return null;
    }
    buy(c, id) {
      const err = this.canBuy(c, id); if (err) return err;
      const def = ITEMS[id];
      if (def.stack) { const st = c.items.find(it => it && it.id === id); if (st && st.n < def.stack) { st.n++; c.gold -= def.cost; c.buys.push({ id, slot: c.items.indexOf(st), undo: [] }); this.sfx('buy'); return null; } }
      const plan = this.buyPlan(c, id);
      const removed = plan.used.map(i => ({ i, it: c.items[i] }));
      for (const i of plan.used) c.items[i] = null;
      const slot = c.items.indexOf(null);
      c.items[slot] = { id, n: 1, cd: 0 };
      c.gold -= plan.price;
      c.buys.push({ id, slot, price: plan.price, undo: removed });
      this.recalc(c);
      this.sfx('buy', c.x, c.y, { unit: c.id });
      return null;
    }
    sell(c, slot) {
      const it = c.items[slot]; if (!it || !this.inShop(c)) return 'shop';
      const def = ITEMS[it.id];
      c.gold += Math.floor(def.cost * 0.7) * (def.stack ? 1 : 1);
      if (def.stack && it.n > 1) it.n--; else c.items[slot] = null;
      c.buys = [];
      this.recalc(c); this.sfx('sell', c.x, c.y);
      return null;
    }
    undoBuy(c) {
      const b = c.buys.pop(); if (!b || !this.inShop(c)) return false;
      const it = c.items[b.slot];
      if (ITEMS[b.id].stack && it && it.n > 1) { it.n--; c.gold += ITEMS[b.id].cost; return true; }
      c.items[b.slot] = null; for (const r of b.undo) c.items[r.i] = r.it;
      c.gold += b.price != null ? b.price : ITEMS[b.id].cost;
      this.recalc(c); return true;
    }
    useItem(c, slot, tgt) {
      const it = c.items[slot]; if (!it || c.dead) return 'none';
      const def = ITEMS[it.id]; if (!def.use && !def.active) return 'none';
      if (it.cd > 0) return 'cooldown';
      const consume = () => { if (--it.n <= 0) c.items[slot] = null; };
      if (def.use === 'hpPot') { if (this.tagged(c, 'hpPot')) return 'active'; this.addStatus(c, { type: 'regen', tag: 'hpPot', t: 15, hp: 10 }); consume(); this.sfx('potion', c.x, c.y); return null; }
      if (def.use === 'manaPot') { if (this.tagged(c, 'manaPot')) return 'active'; this.addStatus(c, { type: 'regen', tag: 'manaPot', t: 15, mp: 100 / 15 }); consume(); this.sfx('potion', c.x, c.y); return null; }
      if (def.use === 'ward' || def.use === 'visionWard') {
        if (!tgt || tgt.x == null) return 'target';
        let x = tgt.x, y = tgt.y; const d = Math.hypot(x - c.x, y - c.y); if (d > 600) { x = c.x + (x - c.x) / d * 600; y = c.y + (y - c.y) / d * 600; }
        if (!this.map.walkable(x, y)) [x, y] = this.map.nearestWalkable(x, y);
        this.spawnWard(c, x, y, def.use === 'visionWard'); consume(); return null;
      }
      if (def.active === 'stasis') {
        if (!this.canAct(c) && !this.has(c, 'knockup')) return 'cc';
        this.addStatus(c, { type: 'stasis', t: 2.5 }); this.interruptRecall(c); c.windup = 0; it.cd = def.activeCd; this.sfx('stasis', c.x, c.y); return null;
      }
      return 'none';
    }
    spawnWard(c, x, y, pink) {
      const mine = this.units.filter(u => u.kind === 'ward' && !u.dead && u.ownerRef === c && u.pink === pink);
      if (mine.length >= 3) this.killUnit(mine[0], null);
      const w = this.mkUnit('ward', c.team, x, y, { r: 25, hp: 3, maxHp: 3, ownerRef: c, pink, life: 180, sight: 1100, trueR: 1000 });
      w.st.ms = 0; w.stealth = !pink;
      this.sfx('ward', x, y);
      return w;
    }

    // ---------------------------------------------------------------- gold / xp / kills
    giveGold(c, n, show) {
      if (!c || c.kind !== 'champ' || n <= 0) return;
      c.gold += n; c.goldEarned += n;
      if (show) this.emit({ type: 'gold', unit: c.id, x: show.x, y: show.y, amt: Math.round(n) });
    }
    giveXp(c, n) {
      if (c.level >= 18) return;
      c.xp += n;
      while (c.level < 18 && c.xp >= XP_TABLE[c.level]) {
        c.level++;
        this.recalc(c);
        this.skillPoint(c, true);
        this.emit({ type: 'levelup', unit: c.id, level: c.level });
      }
    }
    // XP for the enemies of the dead unit inside 1400 range (shared)
    shareXp(dead, xp, killer) {
      const champs = this.champs.filter(c => !c.dead && c.team !== dead.team && Math.hypot(c.x - dead.x, c.y - dead.y) < 1400);
      if (killer && killer.kind === 'champ' && !champs.includes(killer) && !killer.dead) champs.push(killer);
      if (!champs.length) return;
      const total = xp * (1 + 0.3 * (champs.length - 1));
      for (const c of champs) this.giveXp(c, total / champs.length);
    }
    killUnit(u, src) {
      if (u.dead) return;
      u.dead = true; u.deathT = this.time; u.hp = 0; u.windup = 0; u.dash = null;
      const k = this.owner(src);
      if (u.kind === 'champ') return this.champDied(u, src);
      if (u.kind === 'minion') {
        this.shareXp(u, u.xpVal, k);
        if (k && k.team !== u.team) { this.giveGold(k, u.goldVal, u); k.cs++; }
        this.sfx('minion_die', u.x, u.y);
      } else if (u.kind === 'monster') {
        if (k && k.team !== u.team) {
          this.giveGold(k, u.goldVal, u); this.giveXp(k, u.xpVal); k.cs++;
          const md = MONSTERS[u.mtype];
          if (md.buff) { this.giveBuff(k, md.buff); }
          if (u.mtype === 'dragon') { this.dragonStacks[k.team]++; this.teamStats[k.team].dragons++; for (const c of this.champs) if (c.team === k.team) { this.giveGold(c, md.teamGold, c === k ? u : null); this.recalc(c); } this.emit({ type: 'announce', key: 'dragon', team: k.team }); }
          if (u.mtype === 'baron') { this.teamStats[k.team].barons++; for (const c of this.champs) if (c.team === k.team) { this.giveGold(c, md.teamGold, c === k ? u : null); if (!c.dead) this.buff(c, 'baron', 180, { ad: 40, ap: 40, hpReg: 6, mpReg: 3 }); } this.emit({ type: 'announce', key: 'baron', team: k.team }); }
        }
        this.sfx(u.mtype === 'dragon' || u.mtype === 'baron' ? 'boss_die' : 'monster_die', u.x, u.y);
      } else if (u.kind === 'tower') {
        const team = 1 - u.team; this.teamStats[team].towers++;
        for (const c of this.champs) if (c.team === team) { this.giveGold(c, 150, null); if (!c.dead && Math.hypot(c.x - u.x, c.y - u.y) < 1500) { this.giveGold(c, 100, c.bot ? null : u); this.giveXp(c, 100); } }
        this.emit({ type: 'announce', key: 'tower', team: u.team, x: u.x, y: u.y });
        this.fx('collapse', { x: u.x, y: u.y, r: 200 }); this.sfx('tower_die', u.x, u.y);
        for (const c of this.champs) if (c.team === team && c.cid === 'jinx' && !c.dead && Math.hypot(c.x - u.x, c.y - u.y) < 1500) L.KITS.jinx.excited(this, c);
      } else if (u.kind === 'inhib') {
        u.respawnAt = this.time + 300;
        for (const c of this.champs) if (c.team !== u.team) this.giveGold(c, 50, null);
        this.emit({ type: 'announce', key: 'inhib', team: u.team, x: u.x, y: u.y });
        this.fx('collapse', { x: u.x, y: u.y, r: 160 }); this.sfx('tower_die', u.x, u.y);
      } else if (u.kind === 'nexus') {
        this.fx('collapse', { x: u.x, y: u.y, r: 400 }); this.sfx('nexus_die', u.x, u.y);
        this.winner = 1 - u.team; this.endT = this.time;
        this.emit({ type: 'end', winner: this.winner });
      } else if (u.kind === 'ward') {
        if (k && k.team !== u.team) this.giveGold(k, 25, u);
        this.sfx('ward_die', u.x, u.y);
      } else if (u.kind === 'pet') {
        this.fx('poof', { x: u.x, y: u.y });
      }
    }
    giveBuff(c, buff) {
      if (buff === 'blue') this.buff(c, 'blueBuff', 150, { cdr: 0.1, mpReg: 5 }, { buffIcon: 'blue' });
      else this.buff(c, 'redBuff', 150, { hpReg: 2 }, { buffIcon: 'red' });
      this.sfx('buff', c.x, c.y);
    }
    champDied(v, src) {
      const k = this.owner(src);
      v.deaths++; v.deathStreak++; v.windup = 0; v.order = null; v.path = null; v.target = null; v.dash = null;
      if (v.k.channel) this.endChannel(v);
      // passing jungle buffs to the killer
      const buffs = v.status.filter(s => s.tag === 'blueBuff' || s.tag === 'redBuff');
      // guardian angel
      const ga = v.passives && v.passives.revive && v.reviveReadyT <= this.time;
      v.status = []; v.shields = [];
      const recent = Object.keys(v.hitBy).map(Number).filter(id => this.time - v.hitBy[id] < 10).map(id => this.units.find(u => u.id === id)).filter(u => u && u.kind === 'champ' && u.team !== v.team);
      let killer = k && k.team !== v.team && k.kind === 'champ' ? k : null;
      if (!killer && recent.length) killer = recent.sort((a, b) => v.hitBy[b.id] - v.hitBy[a.id])[0];
      const assists = recent.filter(u => u !== killer);
      let bounty = 300;
      if (v.spree >= 2) bounty += Math.min(500, (v.spree - 1) * 100);
      if (v.deathStreak > 1) bounty = Math.max(bounty * Math.pow(0.8, v.deathStreak - 1), 100);
      const shutdown = v.spree >= 3;
      if (killer) {
        if (!this.firstBlood) { this.firstBlood = true; bounty += 100; this.emit({ type: 'announce', key: 'firstBlood', killer: killer.id, victim: v.id }); }
        killer.kills++; killer.spree++; killer.deathStreak = 0; this.teamStats[killer.team].kills++;
        if (this.time - killer.multi.t < 10) killer.multi.n++; else killer.multi.n = 1; killer.multi.t = this.time;
        this.giveGold(killer, bounty, v);
        for (const a of assists) { a.assists++; this.giveGold(a, bounty * 0.5 / assists.length, v); }
        for (const b of buffs) if (!killer.dead) this.buff(killer, b.tag, 90, b.stats, { buffIcon: b.buffIcon });
        const kit = L.KITS[killer.cid]; if (kit && kit.onTakedown) kit.onTakedown(this, killer, v);
        for (const a of assists) { const ak = L.KITS[a.cid]; if (ak && ak.onTakedown) ak.onTakedown(this, a, v); }
      } else this.teamStats[1 - v.team].kills++;
      for (const c of this.champs) if (c.cid === 'jinx' && c.team !== v.team && !c.dead && this.time - (v.hitBy[c.id] || -99) < 3) L.KITS.jinx.excited(this, c);
      const xp = 90 + 45 * v.level;
      this.shareXp(v, xp, killer);
      v.spree = 0;
      const gameMin = this.time / 60;
      v.respawnT = ga ? 4 : Math.round((6 + v.level * 2.4) * (1 + Math.max(0, gameMin - 15) * 0.02));
      v.reviving = !!ga; if (ga) v.reviveReadyT = this.time + 300;
      v.hitBy = {};
      this.emit({ type: 'kill', killer: killer ? killer.id : (src ? src.id : 0), victim: v.id, assists: assists.map(a => a.id), shutdown, multi: killer ? killer.multi.n : 0, spree: killer ? killer.spree : 0, executed: !killer });
      const ace = this.champs.filter(c => c.team === v.team).every(c => c.dead);
      if (ace && killer) this.emit({ type: 'announce', key: 'ace', team: v.team });
      this.sfx('champ_die', v.x, v.y);
    }
    respawn(c) {
      c.dead = false;
      if (c.reviving) { c.hp = c.maxHp * 0.3; c.mp = c.maxMp * 0.3; c.reviving = false; this.fx('revive', { x: c.x, y: c.y }); this.sfx('revive', c.x, c.y); return; }
      const f = this.map.fountain[c.team];
      c.x = c.px = f[0] + (c.team ? -1 : 1) * 150; c.y = c.py = f[1] + (c.team ? 1 : -1) * 150;
      this.recalc(c); c.hp = c.maxHp; c.mp = c.maxMp;
      this.emit({ type: 'respawn', unit: c.id });
    }

    // ---------------------------------------------------------------- damage
    damage(src, tgt, amount, type, opt = {}) {
      if (!tgt || tgt.dead || amount <= 0) return 0;
      if (this.has(tgt, 'stasis') || tgt.invuln) return 0;
      if (tgt.structure && !this.isStructureVulnerable(tgt)) return 0;
      if (tgt.kind === 'ward') { if (opt.attack) { tgt.hp -= 1; if (tgt.hp <= 0) this.killUnit(tgt, src); } return 0; }
      if (tgt.kind === 'monster' && tgt.resetting) return 0;
      const owner = this.owner(src);
      if (opt.spell && tgt.kind === 'champ' && owner && owner.team !== tgt.team && tgt.passives && tgt.passives.spellshield && tgt.spellshieldT <= this.time) {
        tgt.spellshieldT = this.time + 45; this.fx('spellshield', { unit: tgt.id }); this.sfx('spellshield', tgt.x, tgt.y); return 0;
      }
      if (src) { const w = this.has(src, 'weak'); if (w) amount *= 1 - w.amt; }
      if (type === 'phys') {
        let arm = tgt.st.armor; const mult = arm >= 0 ? 100 / (100 + arm) : 2 - 100 / (100 - arm);
        amount *= mult;
        if (opt.attack && tgt.passives && tgt.passives.tabi) amount *= 0.9;
      } else if (type === 'magic') {
        let mr = tgt.st.mr; const pen = src && src.kind === 'champ' ? src.st.mpen : 0;
        if (mr > 0) mr = Math.max(0, mr - pen);
        for (const s of tgt.status) if (s.type === 'mrShred') mr -= s.amt;
        amount *= mr >= 0 ? 100 / (100 + mr) : 2 - 100 / (100 - mr);
      }
      for (const s of tgt.status) if (s.type === 'dr') amount *= 1 - s.amt;
      if (tgt.structure && tgt.kind !== 'nexus' && src && src.kind === 'champ') {
        const minions = this.near(tgt.x, tgt.y, 1000, u => u.kind === 'minion' && u.team !== tgt.team).length;
        if (!minions) amount *= 0.34;
      }
      // shields absorb
      let rem = amount;
      for (const sh of tgt.shields) { const a = Math.min(sh.amt, rem); sh.amt -= a; rem -= a; if (rem <= 0) break; }
      tgt.shields = tgt.shields.filter(s => s.amt > 0.5);
      tgt.hp -= rem;
      tgt.lastDmgT = this.time;
      if (owner && owner.kind === 'champ') {
        if (tgt.team !== owner.team) tgt.hitBy[owner.id] = this.time;
        if (tgt.kind === 'champ') { owner.dmgToChamps += amount; tgt.lastChampDmgT = this.time; if (owner !== src && src.kind === 'tower'); }
        if (opt.attack && owner.st.ls && src === owner) this.heal(owner, amount * owner.st.ls);
        if (opt.spell && owner.st.sv) this.heal(owner, amount * owner.st.sv * (opt.aoe ? 0.33 : 1));
        if (tgt.kind === 'champ' && tgt.team !== owner.team) { owner.aggroT = this.time; owner.aggroOn = tgt; }
        if (opt.spell && owner.passives && owner.passives.rylai && tgt.kind !== 'tower' && !tgt.structure) this.slow(tgt, 0.15, 1.5, owner, 'rylai');
      }
      if (src && src.kind === 'tower' && tgt.kind === 'champ') tgt.lastChampDmgT = this.time;
      if (tgt.kind === 'champ' && src && (src.kind === 'champ' || src.kind === 'tower' || src.kind === 'pet')) { this.interruptRecall(tgt); tgt.k.lastHardDmg = this.time; }
      else if (tgt.kind === 'champ') this.interruptRecall(tgt);
      if (tgt.kind === 'monster' && owner) this.monsterAggro(tgt, owner);
      if (amount >= 1) this.emit({ type: 'dmg', x: tgt.x, y: tgt.y, amt: Math.round(amount), dtype: type, crit: !!opt.crit, tgt: tgt.id, src: owner ? owner.id : 0 });
      if (tgt.hp <= 0) {
        if (tgt.kind === 'champ' && L.KITS[tgt.cid] && L.KITS[tgt.cid].preventDeath && L.KITS[tgt.cid].preventDeath(this, tgt)) return amount;
        this.killUnit(tgt, src);
      }
      return amount;
    }
    // spell damage helper: applies Ryze splash etc through kits
    spellDmg(c, t, amt, type = 'magic', opt = {}) { return this.damage(c, t, amt, type, Object.assign({ spell: true }, opt)); }

    // ---------------------------------------------------------------- basic attacks
    attackRange(u, t) { return u.st.range + u.r * 0.5 + (t ? t.r * 0.5 : 0); }
    startAttack(u, t) {
      if (u.atkCd > 0 || u.windup > 0) return false;
      u.windup = Math.max(0.08, (u.kind === 'tower' ? 0.1 : 0.3) / u.st.as); u.atkTarget = t; u.anim.atk = u.windup + 0.2;
      u.face = t.x >= u.x ? 1 : -1;
      u.atkCd = 1 / u.st.as;
      if (u.stealth && u.kind === 'champ') this.breakStealth(u);
      return true;
    }
    breakStealth(u) { const s = this.tagged(u, 'camo'); if (s) { this.removeStatus(u, x => x === s); if (L.KITS[u.cid] && L.KITS[u.cid].onUnstealth) L.KITS[u.cid].onUnstealth(this, u); } }
    releaseAttack(u) {
      const t = u.atkTarget; u.windup = 0;
      if (!t || t.dead) return;
      if (u.kind === 'champ' && this.has(u, 'blind')) { this.emit({ type: 'dmg', x: t.x, y: t.y, amt: 0, dtype: 'miss', tgt: t.id }); return; }
      if (u.kind === 'champ' && this.brushOf(u)) this.addStatus(u, { type: 'brushReveal', tag: 'atkReveal', t: 1.2 });
      const ranged = u.kind === 'champ' ? u.def.ranged : (u.kind === 'minion' ? !!MINIONS[u.mtype].proj : u.kind === 'tower' || (u.kind === 'monster' && MONSTERS[u.mtype].ranged));
      if (!ranged) { this.attackHit(u, t); this.sfx(u.kind === 'champ' ? 'hit_' + (u.def.sfx || 'melee') : 'hit_small', t.x, t.y, { src: u.id }); return; }
      const speed = u.kind === 'champ' ? (u.def.proj ? u.def.proj.speed : 1500) : u.kind === 'tower' ? 1200 : u.kind === 'minion' ? MINIONS[u.mtype].proj : 1100;
      const look = u.kind === 'champ' ? (u.k.rocket ? 'rocket' : 'bolt') : u.kind === 'tower' ? 'tower' : u.kind === 'minion' ? (u.mtype === 'siege' ? 'cannon' : 'caster') : 'monster';
      this.projectiles.push({ kind: 'homing', src: u, team: u.team, x: u.x, y: u.y - 40, target: t, speed, look, color: u.kind === 'champ' && u.def.proj ? u.def.proj.color : null, crit: u.kind === 'champ' && this.rng() < u.st.crit, onHit: (p) => this.attackHit(u, t, p.crit) });
      this.sfx(u.kind === 'champ' ? 'shot_' + u.cid : u.kind === 'tower' ? 'tower_shot' : 'shot_small', u.x, u.y, { src: u.id });
    }
    attackHit(u, t, crit) {
      if (t.dead) return;
      if (u.kind === 'tower') return this.towerHit(u, t);
      let dmg = u.st.ad;
      if (u.kind === 'champ') {
        if (crit === undefined) crit = this.rng() < u.st.crit;
        if (crit) dmg *= u.st.critMul;
        const kit = L.KITS[u.cid];
        if (kit.attackMod) dmg = kit.attackMod(this, u, t, dmg);
      } else if (u.kind === 'minion' && t.kind === 'minion') dmg *= 1;
      if (u.kind === 'minion' && t.kind === 'champ') dmg *= 0.6;
      if (u.kind === 'monster' && t.kind === 'champ' && t.level) dmg *= 1 + t.level * 0.02;
      if (u.kind === 'champ' && t.kind === 'monster') dmg *= u.spells.includes('smite') ? 1.35 : 1.1;
      const dealt = this.damage(u, t, dmg, 'phys', { attack: true, crit });
      if (u.kind === 'champ') this.onHitEffects(u, t, dealt, crit);
      // thorns & molten shield
      if (t.kind === 'champ' && !t.dead && u.kind !== 'tower') {
        if (t.passives.thorns) this.damage(t, u, dmg * 0.3, 'magic', {});
        const ms = this.tagged(t, 'moltenShield'); if (ms) this.damage(t, u, ms.ret, 'magic', { spell: true });
      }
      if (u.kind === 'champ' && t.kind === 'champ') { u.aggroT = this.time; u.aggroOn = t; }
    }
    onHitEffects(u, t, dealt, crit) {
      const kit = L.KITS[u.cid];
      const p = u.passives;
      if (u.k.spellblade && u.k.spellblade > this.time && !t.structure) {
        u.k.spellblade = 0; u.k.sbCd = this.time + 1.5;
        if (p.spellblade2) this.damage(u, t, u.baseAd * 1.5, 'phys', {});
        else if (p.spellblade1) this.damage(u, t, u.baseAd, 'phys', {});
        if (p.lich) this.damage(u, t, u.st.ap * 0.75 + u.baseAd * 0.5, 'magic', {});
        this.fx('spark', { x: t.x, y: t.y, color: '#80c0ff' });
      }
      if (!t.structure) {
        if (p.icy2) this.slow(t, 0.4, 1.5, u, 'icy'); else if (p.icy || p.spellblade2) this.slow(t, u.def.ranged ? 0.15 : 0.25, 1.5, u, 'icy');
        const red = this.tagged(u, 'redBuff');
        if (red) { this.slow(t, u.def.ranged ? 0.05 : 0.1, 3, u, 'redSlow'); this.addStatus(t, { type: 'dot', tag: 'redBurn' + u.team, t: 3, dps: (10 + 2 * u.level) / 3, dtype: 'true', src: u }); }
      }
      if (kit.onHit) kit.onHit(this, u, t, dealt, crit);
    }
    towerHit(tw, t) {
      let dmg;
      if (t.kind === 'minion') dmg = t.maxHp * MINIONS[t.mtype].towerPct;
      else if (t.kind === 'champ') {
        if (tw.lastTarget === t) tw.heat = Math.min(tw.heat + 1, 3); else tw.heat = 0;
        dmg = (tw.st.ad + TOWER.adG * (this.time / 60)) * (1 + tw.heat * 0.4);
      } else dmg = tw.st.ad * 1.5;
      tw.lastTarget = t;
      if (t.kind === 'minion') this.damage(tw, t, dmg, 'true', { attack: true });
      else this.damage(tw, t, dmg, 'phys', { attack: true });
    }

    // ---------------------------------------------------------------- projectiles
    homing(src, target, p) { this.projectiles.push(Object.assign({ kind: 'homing', src, team: src.team, x: src.x, y: src.y - 40, target, speed: 1200 }, p)); }
    // line skillshot: dir unit vector from caster; onHit(u) returns true to stop
    skillshot(src, x, y, dx, dy, p) {
      const d = Math.hypot(dx, dy) || 1;
      const s = Object.assign({ kind: 'line', src, team: src.team, x, y, sx: x, sy: y, dx: dx / d, dy: dy / d, speed: 1200, range: 1000, width: 60, traveled: 0, hit: new Set(), champsOnly: false }, p);
      this.projectiles.push(s); return s;
    }
    lob(src, tx, ty, p) { this.projectiles.push(Object.assign({ kind: 'lob', src, team: src.team, x: src.x, y: src.y, sx: src.x, sy: src.y, tx, ty, speed: 1000, t: 0 }, p)); }
    updateProjectiles() {
      const keep = [];
      for (const p of this.projectiles) {
        if (p.delay > 0) { p.delay -= DT; keep.push(p); continue; }
        if (p.kind === 'homing') {
          const t = p.target;
          if (!t || (t.dead && !p.keepOnDeath)) continue;
          const dx = t.x - p.x, dy = (t.y - 30) - p.y, d = Math.hypot(dx, dy), step = p.speed * DT;
          if (d <= step + 10) { if (!t.dead) p.onHit(p); continue; }
          p.x += dx / d * step; p.y += dy / d * step; p.ang = Math.atan2(dy, dx); keep.push(p);
        } else if (p.kind === 'line') {
          if (p.accel) p.speed = Math.min(p.maxSpeed || 1e9, p.speed + p.accel * DT);
          const step = p.speed * DT; let stop = false;
          const n = Math.max(1, Math.ceil(step / 40));
          for (let i = 0; i < n && !stop; i++) {
            p.x += p.dx * step / n; p.y += p.dy * step / n; p.traveled += step / n;
            const cand = this.near(p.x, p.y, p.width + 80, u => u.team !== p.team && !u.structure && u.kind !== 'ward' && u.kind !== 'trap' && !p.hit.has(u.id) && (!p.champsOnly || u.kind === 'champ') && !this.has(u, 'untargetable') && !this.has(u, 'stasis'));
            cand.sort((a, b) => Math.hypot(a.x - p.sx, a.y - p.sy) - Math.hypot(b.x - p.sx, b.y - p.sy));
            for (const u of cand) {
              if (Math.hypot(u.x - p.x, u.y - p.y) > p.width + u.r) continue;
              p.hit.add(u.id);
              if (p.onHit(u, p)) { stop = true; break; }
            }
            if (p.traveled >= p.range || p.x < 0 || p.y < 0 || p.x > MAP || p.y > MAP) stop = true;
          }
          if (stop) { if (p.onEnd) p.onEnd(p); continue; }
          keep.push(p);
        } else if (p.kind === 'lob') {
          const total = Math.hypot(p.tx - p.sx, p.ty - p.sy) || 1; p.t += p.speed * DT / total;
          if (p.t >= 1) { p.onArrive(p); continue; }
          p.x = p.sx + (p.tx - p.sx) * p.t; p.y = p.sy + (p.ty - p.sy) * p.t; keep.push(p);
        }
      }
      this.projectiles = keep;
    }

    // ---------------------------------------------------------------- movement
    dash(u, tx, ty, speed, opt = {}) {
      u.dash = Object.assign({ tx, ty, speed }, opt); u.windup = 0; u.path = null; this.interruptRecall(u);
    }
    moveToward(u, tx, ty, stopDist = 0) {
      const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy);
      if (d <= stopDist + 1) { u.anim.moving = false; return true; }
      const step = Math.min(d - stopDist, u.st.ms * DT);
      this.tryMove(u, dx / d * step, dy / d * step);
      u.face = dx >= 0 ? 1 : -1; u.anim.moving = true;
      return false;
    }
    tryMove(u, mx, my) {
      const m = this.map, nx = u.x + mx, ny = u.y + my;
      if (m.walkable(nx, ny)) { u.x = nx; u.y = ny; return true; }
      if (m.walkable(nx, u.y)) { u.x = nx; return true; }
      if (m.walkable(u.x, ny)) { u.y = ny; return true; }
      return false;
    }
    // champions follow A* paths toward a destination
    walkTo(c, tx, ty, stopDist = 0) {
      if (!c.path || !c.pathGoal || Math.hypot(c.pathGoal[0] - tx, c.pathGoal[1] - ty) > 250 || this.time - c.pathT > 2.5) {
        c.path = this.map.findPath(c.x, c.y, tx, ty); c.pathGoal = [tx, ty]; c.pathT = this.time; c.stuck = 0;
      }
      while (c.path.length > 1 && Math.hypot(c.path[0][0] - c.x, c.path[0][1] - c.y) < 40) c.path.shift();
      const wp = c.path[0]; const last = c.path.length === 1;
      if (last) { wp[0] = tx; wp[1] = ty; }
      const ox = c.x, oy = c.y;
      const done = this.moveToward(c, wp[0], wp[1], last ? stopDist : 0);
      if (!done && Math.hypot(c.x - ox, c.y - oy) < c.st.ms * DT * 0.2) {
        if (last && Math.hypot(tx - c.x, ty - c.y) < stopDist + 160 && c.stuck > 4) return true; // blocked right next to the goal (e.g. by a building)
        if (++c.stuck > 8) { c.path = null; c.stuck = 0; }
      }
      if (done && !last) { c.path.shift(); return false; }
      return done && last;
    }
    separate() {
      for (const a of this.units) {
        if (a.dead || a.structure || a.kind === 'ward' || a.kind === 'trap' || a.dash || !a.st.ms) continue;
        const ghostA = !!this.has(a, 'ghost');
        for (const o of this.near(a.x, a.y, a.r + 190)) {
          if (o === a || o.kind === 'ward' || o.kind === 'trap' || o.dash) continue;
          if (!o.structure && (o.id < a.id || ghostA || !o.st.ms || this.has(o, 'ghost'))) continue;
          const dx = a.x - o.x, dy = a.y - o.y, d = Math.hypot(dx, dy) || 0.01;
          const min = o.structure ? a.r * 0.6 + o.r : (a.r + o.r) * 0.7;
          if (d >= min) continue;
          const push = min - d, ux = dx / d, uy = dy / d;
          if (o.structure) {
            // slide around buildings in a fixed rotational direction per unit
            const side = a.id % 2 ? 1 : -1, tx = -uy * side, ty = ux * side, sl = Math.min(push, 10);
            this.tryMove(a, ux * push + tx * sl, uy * push + ty * sl); continue;
          }
          const wa = a.kind === 'champ' ? 0.3 : a.kind === 'monster' ? 0.2 : 0.5, wo = o.kind === 'champ' ? 0.3 : o.kind === 'monster' ? 0.2 : 0.5;
          const k = Math.min(push, 12) / (wa + wo);
          this.tryMove(a, ux * k * wa, uy * k * wa);
          this.tryMove(o, -ux * k * wo, -uy * k * wo);
        }
      }
    }

    // ---------------------------------------------------------------- per-unit updates
    updateStatuses(u) {
      let keep = false;
      for (const s of u.status) {
        s.t -= DT;
        if (s.type === 'dot' && s.t > -DT * 0.5) this.damage(s.src, u, s.dps * DT, s.dtype || 'magic', { dot: true, spell: s.spell });
        if (s.type === 'regen') { if (s.hp) this.heal(u, s.hp * DT); if (s.mp) u.mp = Math.min(u.maxMp, u.mp + s.mp * DT); }
        if (s.tick) s.tick(s);
        if (u.dead) return;
        if (s.t <= 0) keep = true;
      }
      if (keep) {
        const ended = u.status.filter(s => s.t <= 0);
        u.status = u.status.filter(s => s.t > 0);
        for (const s of ended) {
          if (s.type === 'recall' && !u.dead) this.finishRecall(u);
          if (s.onEnd) s.onEnd(s);
          if (s.type === 'channel' && u.k.channel) this.endChannel(u);
        }
      }
      if (u.shields.length) { for (const s of u.shields) s.t -= DT; u.shields = u.shields.filter(s => s.t > 0 && s.amt > 0.5); }
      const ku = this.has(u, 'knockup'); u.z = ku ? Math.sin(Math.PI * (1 - ku.t / ku.max)) * 60 : Math.max(0, u.z - 10);
    }
    finishRecall(c) {
      const f = this.map.fountain[c.team];
      this.fx('recall', { x: c.x, y: c.y });
      c.x = c.px = f[0] + (c.team ? -1 : 1) * 120; c.y = c.py = f[1] + (c.team ? 1 : -1) * 120;
      c.order = null; c.path = null;
      this.emit({ type: 'recallEnd', unit: c.id, done: true });
    }
    updateChampion(c) {
      if (c.dead) {
        c.respawnT -= DT; if (c.respawnT <= 0) this.respawn(c);
        return;
      }
      for (let i = 0; i < 4; i++) if (c.cds[i] > 0) c.cds[i] = Math.max(0, c.cds[i] - DT);
      for (let i = 0; i < 2; i++) if (c.spellCds[i] > 0) c.spellCds[i] = Math.max(0, c.spellCds[i] - DT);
      for (const it of c.items) if (it && it.cd > 0) it.cd -= DT;
      if (c.atkCd > 0) c.atkCd -= DT;
      c.anim.cast = Math.max(0, c.anim.cast - DT); c.anim.atk = Math.max(0, c.anim.atk - DT);
      // regen
      const f = this.map.fountain[c.team], ef = this.map.fountain[1 - c.team];
      let hr = c.st.hpReg, mr = c.st.mpReg;
      if (Math.hypot(c.x - f[0], c.y - f[1]) < 1000) { hr += c.maxHp * 0.12; mr += c.maxMp * 0.12; }
      c.hp = Math.min(c.maxHp, c.hp + hr * DT); c.mp = Math.min(c.maxMp, c.mp + mr * DT);
      if (Math.hypot(c.x - ef[0], c.y - ef[1]) < 1100 && !c.dead) { if (this.tickN % 6 === 0) { this.damage(null, c, 400, 'true', {}); this.fx('laser', { x: ef[0], y: ef[1], tx: c.x, ty: c.y }); } if (c.dead) return; }
      // item auras
      if (c.passives.sunfire && this.tickN % 15 === 0) for (const e of this.enemiesIn(c.x, c.y, 400, c.team)) this.damage(c, e, 15, 'magic', { aoe: true });
      if (c.passives.frozenHeart && this.tickN % 15 === 0) for (const e of this.enemiesIn(c.x, c.y, 700, c.team, true)) this.addStatus(e, { type: 'asSlow', tag: 'fh', amt: 0.2, t: 0.6 });
      const kit = L.KITS[c.cid]; if (kit.tick) kit.tick(this, c);
      if (c.cid === 'teemo' && c.ranks[3] > 0) {
        const maxC = c.def.abilities[3].v.charges[c.ranks[3] - 1];
        if (c.charges < maxC) { c.chargeT += DT; const need = c.def.abilities[3].v.rech[c.ranks[3] - 1] * (1 - c.st.cdr); if (c.chargeT >= need) { c.charges++; c.chargeT = 0; } } else c.chargeT = 0;
      }
      this.recalc(c);
      if (c.dead) return;
      // dash
      if (c.dash) { this.updateDash(c); return; }
      if (this.has(c, 'stasis') || this.has(c, 'recall')) { c.anim.moving = false; return; }
      if (c.windup > 0) {
        if (!this.canAttack(c) || !c.atkTarget || c.atkTarget.dead) c.windup = 0;
        else { c.windup -= DT; if (c.windup <= 0) this.releaseAttack(c); c.anim.moving = false; return; }
      }
      this.executeOrder(c);
    }
    updateDash(u) {
      const d = u.dash, dx = d.tx - u.x, dy = d.ty - u.y, dd = Math.hypot(dx, dy), step = d.speed * DT;
      if (d.follow && d.follow.dead) { u.dash = null; return; }
      if (d.follow) { d.tx = d.follow.x; d.ty = d.follow.y; }
      u.anim.moving = true; if (Math.abs(dx) > 1) u.face = dx >= 0 ? 1 : -1;
      if (dd <= step + (d.stopDist || 0)) {
        if (!d.follow) { if (this.map.walkable(d.tx, d.ty)) { u.x = d.tx; u.y = d.ty; } }
        u.dash = null; if (d.onEnd) d.onEnd(); return;
      }
      const nx = u.x + dx / dd * step, ny = u.y + dy / dd * step;
      if (!this.map.walkable(nx, ny) && !d.passWalls) { u.dash = null; if (d.onEnd) d.onEnd(true); return; }
      u.x = nx; u.y = ny;
      if (d.onStep) d.onStep();
    }
    executeOrder(c) {
      const o = c.order;
      c.anim.moving = false;
      if (!o) {
        // idle: auto-acquire nearby enemies (like LoL's auto attack)
        if (c.bot || !this.canAttack(c) || c.k.noAutoAcquire) return;
        if (c.target && this.validAttackTarget(c, c.target) && dist(c, c.target) < this.attackRange(c, c.target) + 50) return this.attackUnit(c, c.target, true);
        const t = this.autoTarget(c, this.attackRange(c) + 50);
        if (t) { c.target = t; this.attackUnit(c, t, true); }
        return;
      }
      if (o.type === 'move') {
        if (!this.canMove(c)) return;
        if (this.walkTo(c, o.x, o.y)) { c.order = null; c.path = null; }
        return;
      }
      if (o.type === 'attackMove') {
        const t = (c.target && this.validAttackTarget(c, c.target)) ? c.target : this.autoTarget(c, Math.max(this.attackRange(c) + 150, 500), o.x, o.y);
        if (t) { c.target = t; return this.attackUnit(c, t, false); }
        if (!this.canMove(c)) return;
        if (this.walkTo(c, o.x, o.y)) { c.order = null; c.path = null; }
        return;
      }
      if (o.type === 'attack') {
        if (!this.validAttackTarget(c, o.unit)) { c.order = null; c.target = null; return; }
        return this.attackUnit(c, o.unit, false);
      }
      if (o.type === 'cast') {
        const a = c.def.abilities[o.slot], t = o.tgt;
        if (this.castCheck(c, o.slot, t)) { c.order = null; return; }
        const tx = t.unit ? t.unit.x : t.x, ty = t.unit ? t.unit.y : t.y;
        const d = Math.hypot(tx - c.x, ty - c.y) - (t.unit ? t.unit.r * 0.5 : 0);
        if (d <= a.range) { const r = this.doCast(c, o.slot, t); if (r) c.order = null; else if (c.order === o) c.order = null; return; }
        if (!this.canMove(c)) return;
        this.walkTo(c, tx, ty);
      }
    }
    validAttackTarget(c, t) { return t && !t.dead && t.team !== c.team && this.targetable(t, c.team) && t.kind !== 'trap'; }
    attackUnit(c, t, idle) {
      const inR = dist(c, t) <= this.attackRange(c, t);
      if (inR) {
        c.path = null; c.face = t.x >= c.x ? 1 : -1;
        if (this.canAttack(c) && c.atkCd <= 0) this.startAttack(c, t);
        return;
      }
      if (idle || !this.canMove(c)) return;
      this.walkTo(c, t.x, t.y, this.attackRange(c, t) - 20);
    }
    autoTarget(c, range, x = c.x, y = c.y) {
      let best = null, bd = 1e9;
      for (const u of this.near(x, y, range)) {
        if (!this.validAttackTarget(c, u) || u.kind === 'monster' && !u.aggro) continue;
        if (u.kind === 'ward' && !u.vis[c.team]) continue;
        const d = Math.hypot(u.x - x, u.y - y) + (u.kind === 'champ' ? 0 : u.structure ? 50 : 20);
        if (d < bd) { bd = d; best = u; }
      }
      return best;
    }

    // ---------------------------------------------------------------- minions
    spawnWave() {
      this.waveN++;
      const n = this.waveN, scale = Math.floor(this.time / 90);
      for (const team of [0, 1]) for (const lane of ['top', 'mid', 'bot']) {
        const path = this.map.lanePath(lane, team);
        const inhib = this.structs.find(s => s.kind === 'inhib' && s.team !== team && s.lane === lane);
        const rows = [];
        if (inhib && inhib.dead) rows.push([760, 'super', -80], [760, 'super', 80]);
        rows.push([620, 'melee', -110], [620, 'melee', 0], [620, 'melee', 110]);
        if (n % 3 === 0) rows.push([500, 'siege', 0]);
        rows.push([390, 'caster', -110], [390, 'caster', 0], [390, 'caster', 110]);
        rows.forEach(([sd, mt, lat]) => {
          const d = MINIONS[mt];
          const s = this.map.pointAt(path, sd), s2 = this.map.pointAt(path, sd + 10), dl = Math.hypot(s2[0] - s[0], s2[1] - s[1]) || 1;
          const nx = -(s2[1] - s[1]) / dl, ny = (s2[0] - s[0]) / dl;
          const m = this.mkUnit('minion', team, s[0] + nx * lat + (this.rng() - 0.5) * 20, s[1] + ny * lat + (this.rng() - 0.5) * 20, {
            mtype: mt, r: d.r, lane, path, hp: d.hp + d.hpG * scale, goldVal: d.gold + (mt === 'siege' ? scale : scale * 0.5), xpVal: d.xp,
            baseMs: d.ms, baseAs: d.as, baseAd: d.ad + d.adG * scale
          });
          m.maxHp = m.hp; Object.assign(m.st, { ad: m.baseAd, as: d.as, range: d.range, armor: d.armor, mr: d.mr, ms: d.ms });
        });
      }
    }
    updateMinion(m) {
      if (m.atkCd > 0) m.atkCd -= DT;
      m.anim.atk = Math.max(0, m.anim.atk - DT);
      this.recalcSimple(m);
      if (m.dash) return this.updateDash(m);
      if (!this.canAct(m)) return;
      if (m.windup > 0) { if (!m.atkTarget || m.atkTarget.dead || !this.canAttack(m)) m.windup = 0; else { m.windup -= DT; if (m.windup <= 0) this.releaseAttack(m); return; } }
      // re-evaluate target periodically
      if (!m.target || m.target.dead || !this.targetable(m.target, m.team) || (this.tickN + m.id) % 15 === 0) m.target = this.minionTarget(m);
      const t = m.target;
      if (t) {
        const ar = this.attackRange(m, t);
        if (dist(m, t) <= ar) { m.anim.moving = false; if (this.canAttack(m) && m.atkCd <= 0) this.startAttack(m, t); return; }
        if (!this.canMove(m)) return;
        this.moveToward(m, t.x, t.y, ar - 15); return;
      }
      if (!this.canMove(m)) return;
      const pr = this.map.project(m.path, m.x, m.y);
      const goal = this.map.pointAt(m.path, pr.s + 350);
      this.moveToward(m, goal[0], goal[1]);
    }
    minionTarget(m) {
      const range = 700;
      let best = null, bs = 1e9;
      // call for help: enemy champions hitting allied champions nearby
      for (const u of this.near(m.x, m.y, range)) {
        if (u.team === m.team || u.team === 2 || !this.targetable(u, m.team) || u.kind === 'ward' || u.kind === 'trap') continue;
        const d = dist(m, u);
        let pr;
        if (u.kind === 'champ') pr = (u.aggroT > this.time - 1.5 && u.aggroOn && u.aggroOn.team === m.team) ? 0 : 3;
        else if (u.kind === 'minion' || u.kind === 'pet') pr = 1;
        else if (u.structure) pr = 2;
        else continue;
        const sc = pr * 10000 + d;
        if (sc < bs) { bs = sc; best = u; }
      }
      // keep chasing the current target if still close to the lane
      if (m.target && !m.target.dead && best !== m.target && this.targetable(m.target, m.team) && dist(m, m.target) < range && bs >= 10000) {
        const cur = m.target; if (cur.kind === 'minion' || cur.kind === 'pet') return cur;
      }
      return best;
    }

    // ---------------------------------------------------------------- towers
    updateTower(tw) {
      if (tw.atkCd > 0) tw.atkCd -= DT;
      if (tw.windup > 0) { tw.windup -= DT; if (tw.windup <= 0) this.releaseAttack(tw); return; }
      const R = tw.st.range + 40;
      let t = tw.target;
      const valid = u => u && !u.dead && u.team !== tw.team && u.team !== 2 && this.targetable(u, tw.team) && dist(tw, u) <= R + u.r * 0.5 && u.kind !== 'ward' && u.kind !== 'trap';
      // champion hitting an allied champion under the tower takes priority
      const aggro = this.near(tw.x, tw.y, R, u => u.kind === 'champ' && valid(u) && u.aggroT > this.time - 1.2 && u.aggroOn && u.aggroOn.team === tw.team && !u.aggroOn.dead && dist(tw, u.aggroOn) <= R + 200);
      if (aggro.length) t = aggro[0];
      else if (!valid(t)) {
        t = null; let bd = 1e9;
        for (const u of this.near(tw.x, tw.y, R)) {
          if (!valid(u)) continue;
          const d = dist(tw, u) + (u.kind === 'champ' ? 5000 : u.kind === 'pet' ? 0 : 0);
          if (d < bd) { bd = d; t = u; }
        }
      }
      if (t !== tw.target) { tw.target = t; if (t && t.kind === 'champ' && !t.bot) this.emit({ type: 'towerAggro', unit: t.id }); }
      if (t && tw.atkCd <= 0) this.startAttack(tw, t);
    }

    // ---------------------------------------------------------------- monsters
    spawnCamp(camp) {
      const c = camp.def; camp.alive = [];
      const lvl = Math.min(12, 1 + Math.floor(this.time / 150));
      for (const [mt, ox, oy] of c.mobs) {
        const d = MONSTERS[mt];
        const hp = d.hp * (1 + (lvl - 1) * 0.12);
        const m = this.mkUnit('monster', 2, c.p[0] + ox, c.p[1] + oy, { mtype: mt, r: d.r, hp, maxHp: hp, home: [c.p[0] + ox, c.p[1] + oy], camp, goldVal: d.gold * (1 + (lvl - 1) * 0.04), xpVal: d.xp * (1 + (lvl - 1) * 0.1), baseMs: 350, baseAs: d.as, baseAd: d.ad * (1 + (lvl - 1) * 0.1) });
        Object.assign(m.st, { ad: m.baseAd, as: d.as, range: d.ranged ? 450 : 150, armor: d.armor, mr: d.mr, ms: 350 });
        m.face = -1; m.vis = [false, false];
        camp.alive.push(m);
      }
      if (c.side === 2 && this.time > 5) this.emit({ type: 'announce', key: c.id === 'dragon' ? 'dragonSpawn' : 'baronSpawn' });
    }
    monsterAggro(m, champ) {
      if (m.dead || m.resetting) return;
      for (const o of m.camp.alive) if (!o.dead && !o.resetting) { if (!o.aggro) o.aggro = champ; o.aggroT = this.time; }
      if (!m.aggro || m.aggro.dead) m.aggro = champ;
    }
    updateMonster(m) {
      if (m.atkCd > 0) m.atkCd -= DT;
      m.anim.atk = Math.max(0, m.anim.atk - DT);
      this.recalcSimple(m);
      if (m.dash) return this.updateDash(m);
      const dh = Math.hypot(m.x - m.home[0], m.y - m.home[1]);
      if (m.resetting) {
        if (this.moveToward(m, m.home[0], m.home[1])) { m.resetting = false; m.face = -1; }
        m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.3 * DT); return;
      }
      if (!this.canAct(m)) return;
      const t = m.aggro;
      if (!t) { if (m.hp < m.maxHp) m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.05 * DT); return; }
      const leash = m.mtype === 'baron' || m.mtype === 'dragon' ? 900 : 750;
      if (t.dead || dh > leash || this.time - (m.aggroT || 0) > 6 && dist(m, t) > this.attackRange(m, t) + 100 || this.has(t, 'stasis')) {
        // pick another nearby attacker or reset
        const other = this.champs.find(c => !c.dead && m.hitBy[c.id] > this.time - 3 && Math.hypot(c.x - m.home[0], c.y - m.home[1]) < leash);
        if (other && other !== t) { m.aggro = other; return; }
        m.aggro = null; m.resetting = true; m.windup = 0; m.hitBy = {}; return;
      }
      if (m.windup > 0) { m.windup -= DT; if (m.windup <= 0) this.releaseAttack(m); return; }
      const ar = this.attackRange(m, t);
      if (dist(m, t) <= ar) { if (m.atkCd <= 0) this.startAttack(m, t); }
      else if (this.canMove(m)) this.moveToward(m, t.x, t.y, ar - 10);
    }

    // ---------------------------------------------------------------- pets & traps & wards
    updatePet(p) {
      p.life -= DT; if (p.life <= 0 || !p.ownerRef || p.ownerRef.dead) { this.killUnit(p, null); return; }
      if (p.atkCd > 0) p.atkCd -= DT;
      this.recalcSimple(p);
      if (p.aura && this.tickN % 6 === 0) for (const e of this.enemiesIn(p.x, p.y, 350, p.team)) this.damage(p, e, p.aura * 0.2, 'magic', { spell: true, aoe: true });
      if (!this.canAct(p)) return;
      if (p.windup > 0) { p.windup -= DT; if (p.windup <= 0) this.releaseAttack(p); return; }
      const o = p.ownerRef;
      let t = p.target;
      const ot = o.atkTarget && !o.atkTarget.dead && o.atkTarget.team !== p.team && this.time - (o.k.lastAtkT || -9) < 2 ? o.atkTarget : (o.aggroOn && o.aggroT > this.time - 2 ? o.aggroOn : null);
      if (ot && this.targetable(ot, p.team)) t = ot;
      if (!t || t.dead || !this.targetable(t, p.team) || dist(p, t) > 1200) {
        t = null; let bd = 700;
        for (const u of this.near(p.x, p.y, 700)) if (u.team !== p.team && this.targetable(u, p.team) && !u.structure && u.kind !== 'ward' && u.kind !== 'trap' && (u.team !== 2 || u.aggro)) { const d = dist(p, u) - (u.kind === 'champ' ? 200 : 0); if (d < bd) { bd = d; t = u; } }
      }
      p.target = t;
      if (t) {
        const ar = this.attackRange(p, t);
        if (dist(p, t) <= ar) { if (p.atkCd <= 0) this.startAttack(p, t); }
        else if (this.canMove(p)) this.moveToward(p, t.x, t.y, ar - 10);
      } else if (dist(p, o) > 250 && this.canMove(p)) this.moveToward(p, o.x, o.y, 200);
    }
    updateTrap(t) {
      t.life -= DT; if (t.life <= 0) { t.dead = true; return; }
      if (t.armT > 0) { t.armT -= DT; return; }
      const hit = this.near(t.x, t.y, t.trigger, u => u.team !== t.team && (t.champsOnly ? u.kind === 'champ' : (u.kind === 'champ' || u.kind === 'minion' || u.kind === 'monster' || u.kind === 'pet')) && !this.has(u, 'untargetable'))[0];
      if (hit) { t.dead = true; t.onTrigger(hit, t); }
    }

    // ---------------------------------------------------------------- vision
    brushOf(u) { return this.map.brushAt(u.x, u.y); }
    updateVision() {
      for (let team = 0; team < 2; team++) {
        const v = this.vis[team]; v.fill(0);
        const brushSeen = new Set(), trueSight = [];
        for (const u of this.units) {
          if (u.dead || u.team !== team) continue;
          let r = u.kind === 'champ' ? 1250 : u.kind === 'minion' ? 900 : u.structure ? 1200 : u.kind === 'ward' ? u.sight : u.kind === 'pet' ? 800 : u.kind === 'trap' ? 0 : 0;
          if (u.kind === 'nexus' || u.kind === 'inhib') r = 900;
          if (u.sightR) r = u.sightR;
          if (!r) continue;
          this.stamp(v, u.x, u.y, r);
          const b = this.brushOf(u); if (b) brushSeen.add(b);
          if (u.pink) trueSight.push(u);
        }
        for (const z of this.revealZones || []) if (z.team === team) { this.stamp(v, z.x, z.y, z.r); if (z.trueSight) trueSight.push(z); }
        const f = this.map.fountain[team]; this.stamp(v, f[0], f[1], 1400);
        for (const u of this.units) {
          if (u.dead) continue;
          if (u.team === team) { u.vis[team] = true; continue; }
          if (u.structure) { u.vis[team] = true; continue; }
          if (this.has(u, 'reveal')) { u.vis[team] = true; continue; }
          let seen = !!v[this.visIdx(u.x, u.y)];
          const b = this.brushOf(u);
          if (seen && b && !brushSeen.has(b) && !this.has(u, 'brushReveal')) seen = false;
          if (seen && (u.stealth || this.tagged(u, 'camo'))) seen = trueSight.some(w => Math.hypot(w.x - u.x, w.y - u.y) < w.trueR);
          u.vis[team] = seen;
        }
      }
    }
    visIdx(x, y) { const i = clamp(Math.floor(x / VIS_CELL), 0, VIS_N - 1), j = clamp(Math.floor(y / VIS_CELL), 0, VIS_N - 1); return j * VIS_N + i; }
    stamp(v, x, y, r) {
      const i0 = Math.max(0, Math.floor((x - r) / VIS_CELL)), i1 = Math.min(VIS_N - 1, Math.floor((x + r) / VIS_CELL));
      const j0 = Math.max(0, Math.floor((y - r) / VIS_CELL)), j1 = Math.min(VIS_N - 1, Math.floor((y + r) / VIS_CELL));
      const r2 = r * r;
      for (let j = j0; j <= j1; j++) { const cy = (j + 0.5) * VIS_CELL - y; for (let i = i0; i <= i1; i++) { const cx = (i + 0.5) * VIS_CELL - x; if (cx * cx + cy * cy <= r2) v[j * VIS_N + i] = 1; } }
    }
    revealArea(team, x, y, r, t, trueSight) { this.revealZones = this.revealZones || []; this.revealZones.push({ team, x, y, r, t, trueSight, trueR: r }); }

    // ---------------------------------------------------------------- main step
    tick() {
      if (this.winner >= 0) { this.time += DT; this.tickN++; return; }
      this.time += DT; this.tickN++; this.inTick = true;
      const T = this.time;
      if (!this.announced.m30 && T >= 0.5) { this.announced.m30 = true; this.emit({ type: 'announce', key: 'minions30' }); }
      if (T >= this.nextWave) { if (!this.announced.spawn) { this.announced.spawn = true; this.emit({ type: 'announce', key: 'minionsSpawned' }); } this.spawnWave(); this.nextWave += 30; }
      if (T > 30 && this.tickN % 3 === 0) for (const c of this.champs) { c.gold += 2.3 * DT * 3; c.goldEarned += 2.3 * DT * 3; }
      for (const camp of this.camps) {
        if (camp.alive.length && camp.alive.every(m => m.dead)) { camp.alive = []; camp.respawnAt = T + camp.def.respawn; }
        if (!camp.alive.length && T >= camp.respawnAt) this.spawnCamp(camp);
      }
      for (const s of this.structs) if (s.kind === 'inhib' && s.dead && T >= s.respawnAt) { s.dead = false; s.hp = s.maxHp; this.emit({ type: 'announce', key: 'inhibRespawn', team: s.team }); }
      if (this.revealZones) { for (const z of this.revealZones) z.t -= DT; this.revealZones = this.revealZones.filter(z => z.t > 0); }
      // timers
      if (this.timers.length) { const due = this.timers.filter(t => t.at <= T); if (due.length) { this.timers = this.timers.filter(t => t.at > T); for (const t of due) t.fn(); } }
      this.rehash();
      if (L.AI) for (const c of this.champs) if (c.bot) L.AI.update(this, c);
      for (const u of this.units) { u.px = u.x; u.py = u.y; }
      for (let i = 0; i < this.units.length; i++) {
        const u = this.units[i]; if (u.dead && u.kind !== 'champ') continue;
        if (!u.dead) this.updateStatuses(u);
        if (u.dead && u.kind !== 'champ') continue;
        switch (u.kind) {
          case 'champ': this.updateChampion(u); break;
          case 'minion': this.updateMinion(u); break;
          case 'tower': this.updateTower(u); break;
          case 'monster': this.updateMonster(u); break;
          case 'pet': this.updatePet(u); break;
          case 'trap': this.updateTrap(u); break;
          case 'ward': u.life -= DT; if (u.life <= 0) u.dead = true; break;
        }
      }
      this.rehash();
      this.separate();
      this.updateProjectiles();
      if (this.tickN % 3 === 0) this.updateVision();
      // prune dead non-persistent units
      if (this.tickN % 30 === 0) this.units = this.units.filter(u => !u.dead || u.kind === 'champ' || u.structure || (u.kind === 'monster' && T - u.deathT < 3) || (T - u.deathT < 2));
      // nexus regen / structure bookkeeping
      if (this.tickN % 30 === 0) for (const s of this.structs) if (s.kind === 'nexus' && !s.dead && s.hp < s.maxHp) s.hp = Math.min(s.maxHp, s.hp + 5);
      this.inTick = false;
    }
    // --------------------------------------------------------------- chat commands (cheats for testing)
    command(c, text) {
      const [cmd, arg] = text.trim().split(/\s+/);
      if (cmd === '/gold') { this.giveGold(c, Math.min(100000, +arg || 1000)); return true; }
      if (cmd === '/level') { const need = XP_TABLE[Math.min(17, c.level)] - c.xp; if (need > 0) this.giveXp(c, need); return true; }
      if (cmd === '/max') { this.giveXp(c, 20000); return true; }
      if (cmd === '/win') { const nx = this.structs.find(s => s.kind === 'nexus' && s.team !== c.team); this.killUnit(nx, c); return true; }
      return false;
    }
  }

  L.Game = Game; L.RNG = RNG; L.autoTeams = autoTeams; L.ROLE_ORDER = ROLE_ORDER; L.dist = dist; L.clamp = clamp;
  L.VIS = { VIS_CELL, VIS_N };
  if (typeof module !== 'undefined') module.exports = L;
})(globalThis.LoL98 = globalThis.LoL98 || {});
