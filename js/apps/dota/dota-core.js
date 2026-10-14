(function (D) {
  'use strict';
  const DD = D.DATA;
  const { DT, MAP, HEROES, HERO_ORDER, ITEMS, CREEPS, TOWERS, TOWER_RANGE, BARRACKS, ANCIENT_HP, NEUTRALS, CAMP_TYPES, ROSHAN, RUNES, POWER_RUNES, ATTR, XP_TABLE, MAX_LEVEL, NO_POINT, TALENT_LEVELS, RESPAWN } = DD;
  const HASH = 256, HN = Math.ceil(MAP / HASH);
  const SN = D.Map.SN, SLOT = D.Map.SLOT;
  function RNG(seed) { let s = seed >>> 0 || 1; return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
  const armorMul = (a) => 1 - (0.06 * a) / (1 + 0.06 * Math.abs(a));
  const LANES = ['top', 'mid', 'bot'];
  const STAT_KEYS = ['str', 'agi', 'int', 'all', 'dmg', 'as', 'armor', 'hp', 'mp', 'hpr', 'mpr', 'ms', 'msPct', 'evasion', 'mr', 'lifesteal', 'castRange', 'range'];

  function autoTeams(opts, rng) {
    const pool = HERO_ORDER.slice(), teams = [[], []];
    const take = id => { const i = pool.indexOf(id); if (i >= 0) pool.splice(i, 1); return id; };
    let human = null;
    if (opts.hero) { human = { hero: take(opts.hero), team: opts.team || 0, bot: false, name: opts.name || 'Player' }; teams[human.team].push(human); }
    const shuffled = pool.slice().sort(() => rng() - 0.5);
    for (const h of shuffled) {
      const t = teams[0].length < 5 && (teams[1].length >= 5 || teams[0].length <= teams[1].length) ? 0 : 1;
      teams[t].push({ hero: take(h), team: t, bot: true });
    }
    const names = DD.BOT_NAMES.slice();
    const slots = [];
    for (let t = 0; t < 2; t++) {
      assignRoles(teams[t]);
      for (const s of teams[t]) { if (s.bot) s.name = names.splice(Math.floor(rng() * names.length), 1)[0] + ' [BOT]'; slots.push(s); }
    }
    return slots;
  }
  function assignRoles(team) {
    const want = ['carry', 'mid', 'off', 'support', 'support'], pos = ['safe', 'mid', 'off', 'off', 'safe'];
    const free = team.slice(); const out = [];
    for (let p = 0; p < 5; p++) {
      let best = null, bs = -1;
      for (const s of free) { const r = HEROES[s.hero].roles, i = r.indexOf(want[p]); const sc = i < 0 ? 0 : 10 - i * 3; if (sc > bs) { bs = sc; best = s; } }
      free.splice(free.indexOf(best), 1); best.pos = p + 1; best.laneRole = pos[p]; out.push(best);
    }
    return out;
  }
  const laneFor = (team, role) => role === 'mid' ? 'mid' : role === 'safe' ? (team ? 'top' : 'bot') : (team ? 'bot' : 'top');

  class Game {
    constructor(opts = {}) {
      this.opts = opts;
      this.rng = RNG(opts.seed || 1);
      this.diff = opts.diff == null ? 1 : opts.diff;
      this.cheats = !!opts.cheats;
      this.map = opts.map || new D.Map();
      this.time = -(opts.pregame != null ? opts.pregame : DD.PREGAME); this.tickN = 0; this.nextId = 0;
      this.units = []; this.heroes = []; this.projectiles = []; this.timers = []; this.events = []; this.drops = []; this.runes = []; this.areas = [];
      this.hash = new Array(HN * HN); for (let i = 0; i < this.hash.length; i++) this.hash[i] = [];
      this.vis = [new Uint8Array(SN * SN), new Uint8Array(SN * SN)];
      this.teamStats = [{ kills: 0, towers: 0, rax: 0, roshans: 0 }, { kills: 0, towers: 0, rax: 0, roshans: 0 }];
      this.glyphCd = [-1e9, -1e9]; this.scanCd = [-1e9, -1e9]; this.scans = [];
      this.nwHistory = []; this.winner = -1; this.firstBlood = false; this.waveN = 0; this.nextWave = 0;
      this.roshanN = 0; this.roshanAt = 0; this.roshan = null; this.aegisHolder = null;
      this.stock = { ward_obs: [2, 2], ward_sentry: [3, 3] }; this.stockT = { ward_obs: [0, 0], ward_sentry: [0, 0] };
      this.nextPowerRune = 120; this.nextBounty = 0; this.announced = {};
      this.treeRegrow = [];
      this.raxDead = [{ top: {}, mid: {}, bot: {} }, { top: {}, mid: {}, bot: {} }];
      this.buildStructures();
      this.camps = this.map.camps.map(c => ({ def: c, units: [], nextCheck: 60 }));
      const slots = opts.slots || autoTeams(opts.human || { hero: 'techies', team: 0 }, this.rng);
      for (const s of slots) this.addHero(s);
      this.player = this.heroes.find(h => !h.bot) || null;
      this.updateVision();
      this.emit({ type: 'announce', key: 'welcome' });
    }
    emit(e) { this.events.push(e); }
    sfx(name, x, y, extra) { this.events.push(Object.assign({ type: 'sfx', name, x, y }, extra)); }
    fx(kind, props) { this.events.push(Object.assign({ type: 'fx', kind }, props)); }
    float(u, text, color, big) { this.events.push({ type: 'float', x: u.x, y: u.y, text, color, big, team: u.team, owner: u.owner || u.id }); }
    msg(key, extra) { this.events.push(Object.assign({ type: 'msg', key }, extra)); }
    later(t, fn) { this.timers.push({ at: this.time + t, fn }); }
    isNight() { return this.time >= 0 && Math.floor(this.time / DD.DAY_LEN) % 2 === 1; }
    get L() { return this.opts.lang || 'ru'; }

    mkUnit(kind, team, x, y, p = {}) {
      const u = Object.assign({
        id: ++this.nextId, kind, team, x, y, px: x, py: y, r: 24, hp: 100, maxHp: 100, mp: 0, maxMp: 0, dead: false, face: team === 1 ? Math.PI * 0.75 : -Math.PI * 0.25,
        base: { dmg: [10, 10], armor: 0, ms: 300, range: 100, bat: 1.7, ap: 0.4, hpr: 0, mpr: 0, mr: 0, as: 100, vision: [800, 800], turn: 0.6 },
        st: { dmgMin: 10, dmgMax: 10, dmgBase: 10, armor: 0, as: 100, bat: 1.7, range: 100, ms: 300, hpr: 0, mpr: 0, mr: 0, evasion: 0, lifesteal: 0, castRange: 0 },
        status: [], order: null, path: null, pathT: 0, atk: null, atkCd: 0, cast: null, channel: null, target: null,
        vis: [team === 0, team === 1], anim: { walk: 0, atkT: -9, castT: -9, moving: false }, born: this.time, dmgFrom: {}, lastHitBy: null, stuckT: 0, z: 0
      }, p);
      this.units.push(u);
      return u;
    }
    buildStructures() {
      this.structs = [];
      for (const s of this.map.structs) {
        let u;
        if (s.kind === 'tower') {
          const T = TOWERS[s.tier];
          u = this.mkUnit('tower', s.team, s.p[0], s.p[1], { r: 70, hp: T.hp, maxHp: T.hp, lane: s.lane, tier: s.tier, def: s, bdPool: 0 });
          Object.assign(u.base, { dmg: T.dmg, armor: T.armor, ms: 0, range: TOWER_RANGE, bat: DD.TOWER_BAT, ap: DD.TOWER_AP, proj: 750, vision: [1900, 800], mr: 0 });
        } else if (s.kind === 'rax') {
          const B = BARRACKS[s.type];
          u = this.mkUnit('rax', s.team, s.p[0], s.p[1], { r: 110, hp: B.hp, maxHp: B.hp, lane: s.lane, raxType: s.type, def: s });
          Object.assign(u.base, { armor: B.armor, ms: 0, range: 0, vision: [900, 900], hpr: 5 });
        } else if (s.kind === 'ancient') {
          u = this.mkUnit('ancient', s.team, s.p[0], s.p[1], { r: 200, hp: ANCIENT_HP, maxHp: ANCIENT_HP, def: s });
          Object.assign(u.base, { armor: 13, ms: 0, range: 0, vision: [900, 900], hpr: 3 });
        } else {
          u = this.mkUnit('fountain', s.team, s.p[0], s.p[1], { r: 110, hp: 1e9, maxHp: 1e9, def: s, invulnerable: true });
          Object.assign(u.base, { dmg: [260, 280], armor: 99, ms: 0, range: 1200, bat: 0.15, ap: 0, proj: 1500, vision: [1800, 1800] });
        }
        u.structure = true; u.vis = [true, true];
        this.recalc(u); u.hp = u.maxHp;
        this.structs.push(u);
      }
    }
    addHero(s) {
      const def = HEROES[s.hero], f = this.map.fountain[s.team];
      const n = this.heroes.filter(h => h.team === s.team).length, ang = n * 1.25 + 0.3;
      const off = s.team ? -1 : 1;
      const h = this.mkUnit('hero', s.team, f[0] + Math.cos(ang) * 260 * off, f[1] - Math.sin(ang) * 260 * off, {
        hid: s.hero, def, name: s.name, bot: !!s.bot, pos: s.pos || 3, laneRole: s.laneRole || 'mid', lane: laneFor(s.team, s.laneRole || 'mid'),
        r: def.melee ? 26 : 24, level: 1, xp: 0, gold: 0, rgold: 0, ugold: DD.START_GOLD, items: [null, null, null, null, null, null], backpack: [null, null, null], stash: [null, null, null, null, null, null],
        tp: { charges: 1, cd: 0 }, ranks: [0, 0, 0, 0, 0, 0], cds: [0, 0, 0, 0, 0, 0], charges: [0, 0, 0, 0, 0, 0], chargeT: [0, 0, 0, 0, 0, 0], points: 0, talents: [-1, -1, -1, -1],
        kills: 0, deaths: 0, assists: 0, lh: 0, dn: 0, streak: 0, heroDmg: 0, goldEarned: DD.START_GOLD, respawnT: 0, buybackCd: 0, secretQueue: [], k: {}, flesh: 0, fingerKills: 0,
        treads: 'str', lastHeroDmgT: -99, lastDmgT: -99, courier: null, spawnX: 0, spawnY: 0, deathT: -99
      });
      h.spawnX = h.x; h.spawnY = h.y;
      Object.assign(h.base, { dmg: def.dmg, armor: def.armor, ms: def.ms, range: def.range, bat: def.bat, ap: def.ap, proj: def.proj || 0, hpr: def.hpr, mpr: 0, vision: [1800, 800], turn: def.turn });
      h.tp.charges = 1;
      this.heroes.push(h);
      this.recalc(h); h.hp = h.maxHp; h.mp = h.maxMp;
      this.gainPoint(h);
      const sh = def.abilities.map(a => a.charges || 0); h.charges = sh.concat([0]);
      const c = this.mkUnit('courier', s.team, f[0] + 120 * off, f[1] - 120 * off, { r: 14, hp: 75, maxHp: 75, owner: h.id, ownerU: h, state: 'idle', carry: [], respawnT: 0 });
      Object.assign(c.base, { ms: 290, armor: 0, range: 0, vision: [500, 500] }); this.recalc(c); c.hp = c.maxHp;
      h.courier = c;
      if (D.KITS && D.KITS[h.hid] && D.KITS[h.hid].init) D.KITS[h.hid].init(this, h);
      return h;
    }
    alive(u) { return u && !u.dead; }
    enemies(a, b) { return a.team !== b.team && b.team !== undefined; }
    heroesOf(team) { return this.heroes.filter(h => h.team === team); }
    unitById(id) { return this.units.find(u => u.id === id); }

    rehash() {
      for (const b of this.hash) b.length = 0;
      for (const u of this.units) {
        if (u.dead) continue;
        const cx = clamp(Math.floor(u.x / HASH), 0, HN - 1), cy = clamp(Math.floor(u.y / HASH), 0, HN - 1);
        this.hash[cy * HN + cx].push(u);
      }
    }
    unitsIn(x, y, r, fn) {
      const out = [], x0 = clamp(Math.floor((x - r - 200) / HASH), 0, HN - 1), x1 = clamp(Math.floor((x + r + 200) / HASH), 0, HN - 1), y0 = clamp(Math.floor((y - r - 200) / HASH), 0, HN - 1), y1 = clamp(Math.floor((y + r + 200) / HASH), 0, HN - 1);
      for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) for (const u of this.hash[cy * HN + cx]) {
        if (u.dead) continue; const d = Math.hypot(u.x - x, u.y - y);
        if (d <= r + (u.structure ? u.r : 0) && (!fn || fn(u))) out.push(u);
      }
      return out;
    }
    enemiesIn(team, x, y, r, o = {}) {
      return this.unitsIn(x, y, r, u => u.team !== team && !this.isInvuln(u) && (o.structures || !u.structure) && (o.wards || !this.isWardLike(u)) && u.kind !== 'courier' && (!o.heroesOnly || u.kind === 'hero') && (o.anyVis || this.canSee(team, u)) && (!o.noImmune || !this.isImmune(u)));
    }
    alliesIn(team, x, y, r, o = {}) { return this.unitsIn(x, y, r, u => u.team === team && !u.structure && !this.isWardLike(u) && u.kind !== 'courier' && (!o.heroesOnly || u.kind === 'hero')); }
    isWardLike(u) { return u.kind === 'ward' || u.kind === 'mine' || u.kind === 'sign' || u.kind === 'hward'; }
    canSee(team, u) { return team === 2 || u.team === team || !!u.vis[team]; }

    addStatus(u, s) {
      if (u.dead) return null;
      if (s.tag) { const old = u.status.find(x => x.tag === s.tag && (!s.src || x.src === s.src || s.unique)); if (old) { Object.assign(old, s); old.t = Math.max(old.t, s.t); return old; } }
      if (this.isImmune(u) && s.debuff && !s.pierce) return null;
      const st = Object.assign({ t: 1 }, s); st.dur = st.t; u.status.push(st);
      if (st.stun || st.hex || st.cyclone || st.bh) this.interrupt(u, !!(st.stun || st.cyclone || st.bh));
      return st;
    }
    removeStatus(u, tag) { u.status = u.status.filter(s => s.tag !== tag); }
    has(u, flag) { for (const s of u.status) if (s[flag]) return s; return null; }
    stun(u, t, src) { if (this.isInvuln(u)) return; this.addStatus(u, { tag: 'stun_' + (src ? src.id : 0), stun: true, t, debuff: true, src: src && src.id, fxStun: true }); }
    isStunned(u) { for (const s of u.status) if (s.stun || s.cyclone || s.bh) return true; return false; }
    isImmune(u) { for (const s of u.status) if (s.immune) return true; return false; }
    isInvuln(u) { if (u.invulnerable || u.dead) return true; for (const s of u.status) if (s.invuln || s.cyclone) return true; if (u.structure && u.glyphT > this.time) return true; return u.structure && !this.vulnOf(u); }
    vulnOf(u) { if (this._vulnN !== this.tickN) { this._vulnN = this.tickN; this._vuln = new Map(); } let v = this._vuln.get(u.id); if (v === undefined) { v = this.structureVulnerable(u); this._vuln.set(u.id, v); } return v; }
    isSilenced(u) { for (const s of u.status) if (s.silence || s.hex) return true; return false; }
    isDisarmed(u) { for (const s of u.status) if (s.disarm || s.hex || s.frozen) return true; return false; }
    isRooted(u) { for (const s of u.status) if (s.root || s.frozen) return true; return false; }
    isInvisible(u) { if (u.kind === 'ward' || u.kind === 'mine') return !u.revealed; for (const s of u.status) if (s.invis && s.fadeAt <= this.time) return true; return false; }
    dispel(u, strong) { u.status = u.status.filter(s => !s.debuff || (s.undispellable || (s.stun && !strong))); }

    structureVulnerable(u) {
      if (u.kind === 'fountain') return false;
      const same = this.structs.filter(s => s.team === u.team);
      const deadT = (lane, tier) => same.some(s => s.kind === 'tower' && s.lane === lane && s.tier === tier && s.dead);
      if (u.kind === 'tower') {
        if (u.tier === 1) return true;
        if (u.tier <= 3) return deadT(u.lane, u.tier - 1);
        return LANES.some(l => deadT(l, 3));
      }
      if (u.kind === 'rax') return deadT(u.lane, 3);
      if (u.kind === 'ancient') return same.filter(s => s.kind === 'tower' && s.tier === 4).every(s => s.dead);
      return true;
    }

    itemStats(h, acc) {
      let bootsMs = 0;
      for (const it of h.items) {
        if (!it) continue; const d = ITEMS[it.id]; if (!d.st) continue;
        for (const k in d.st) { if (k === 'ms') { if (d.boots) bootsMs = Math.max(bootsMs, d.st.ms); else acc.ms += d.st.ms; continue; } acc[k] = (acc[k] || 0) + d.st[k]; }
        if (d.treads) acc[h.treads] += d.treads;
        if (d.tranquil && this.time - Math.max(h.lastDmgT, h.lastAtkT || -99) < 13) { acc.hpr -= d.st.hpr; bootsMs = Math.min(bootsMs, 45); }
      }
      acc.ms += bootsMs;
    }
    talentStats(h, acc) {
      h.def.talents.forEach((pair, i) => { const c = h.talents[i]; if (c < 0) return; const t = pair[c]; if (t.s) acc[t.s] = (acc[t.s] || 0) + t.v; });
    }
    recalc(u) {
      const B = u.base, st = u.st;
      const acc = { str: 0, agi: 0, int: 0, all: 0, dmg: 0, as: 0, armor: 0, hp: 0, mp: 0, hpr: 0, mpr: 0, ms: 0, msPct: 0, evasion: 0, mr: 0, lifesteal: 0, castRange: 0, range: 0, dmgPct: 0, asPct: 0, slow: 0, msAbs: 0, mrBonus: 0 };
      let evMul = 1, mrMul = 1, slowMax = 0;
      if (u.kind === 'hero') { this.itemStats(u, acc); this.talentStats(u, acc); const kit = D.KITS[u.hid]; if (kit && kit.stats) kit.stats(this, u, acc); }
      for (const s of u.status) {
        if (s.as) acc.as += s.as; if (s.armor) acc.armor += s.armor; if (s.ms) acc.msPct += s.ms; if (s.msFlat) acc.ms += s.msFlat; if (s.dmg) acc.dmg += s.dmg; if (s.dmgPct) acc.dmgPct += s.dmgPct;
        if (s.hpr) acc.hpr += s.hpr; if (s.mpr) acc.mpr += s.mpr; if (s.str) acc.str += s.str; if (s.slow) slowMax = Math.max(slowMax, s.slow); if (s.asSlow) acc.as -= s.asSlow;
        if (s.mr) mrMul *= 1 - s.mr / 100; if (s.evasion) evMul *= 1 - s.evasion / 100; if (s.msAbs) acc.msAbs = Math.max(acc.msAbs, s.msAbs); if (s.lifesteal) acc.lifesteal += s.lifesteal;
      }
      if (u.aura) { acc.armor += u.aura.armor || 0; acc.as += u.aura.as || 0; acc.mpr += u.aura.mpr || 0; }
      if (u.kind === 'hero') {
        const d = u.def, L = u.level - 1;
        const str = d.str[0] + d.str[1] * L + acc.str + acc.all, agi = d.agi[0] + d.agi[1] * L + acc.agi + acc.all, int = d.int[0] + d.int[1] * L + acc.int + acc.all;
        u.str = str + (u.flesh || 0); u.agi = agi; u.int = int;
        const prim = d.attr === 'str' ? u.str : d.attr === 'agi' ? agi : int;
        const hpFrac = u.maxHp > 0 ? u.hp / u.maxHp : 1, mpFrac = u.maxMp > 0 ? u.mp / u.maxMp : 1;
        u.maxHp = ATTR.baseHp + u.str * ATTR.hpPerStr + acc.hp; u.maxMp = ATTR.baseMp + int * ATTR.mpPerInt + acc.mp;
        if (!u.dead) { u.hp = clamp(hpFrac * u.maxHp, 0, u.maxHp); u.mp = clamp(mpFrac * u.maxMp, 0, u.maxMp); }
        const baseDmg = (B.dmg[0] + B.dmg[1]) / 2 + prim;
        st.dmgBase = baseDmg; st.dmgMin = B.dmg[0] + prim; st.dmgMax = B.dmg[1] + prim;
        st.dmgBonus = acc.dmg + baseDmg * acc.dmgPct / 100;
        st.armor = B.armor + agi * ATTR.armorPerAgi + acc.armor;
        st.as = clamp(100 + agi * ATTR.asPerAgi + acc.as, 20, 700);
        st.hpr = B.hpr + u.str * ATTR.hprPerStr + acc.hpr; st.mpr = int * ATTR.mprPerInt + acc.mpr;
        st.mr = 1 - (1 - ATTR.baseMr / 100) * (1 - int * ATTR.mrPerInt / 100) * (1 - acc.mr / 100) * mrMul;
        st.range = B.range + (d.melee ? 0 : acc.range);
        st.castRange = acc.castRange;
      } else {
        st.dmgMin = B.dmg[0]; st.dmgMax = B.dmg[1]; st.dmgBase = (B.dmg[0] + B.dmg[1]) / 2; st.dmgBonus = acc.dmg + st.dmgBase * acc.dmgPct / 100;
        st.armor = B.armor + acc.armor; st.as = clamp(100 + acc.as, 20, 700); st.hpr = B.hpr + acc.hpr; st.mpr = B.mpr + acc.mpr;
        st.mr = 1 - (1 - (B.mr || 0) / 100) * mrMul; st.range = B.range;
        if (u.maxHpBonus != null) {  }
      }
      st.evasion = 1 - (1 - acc.evasion / 100) * evMul;
      st.lifesteal = acc.lifesteal;
      st.bat = B.bat; st.ap = B.ap;
      let ms = (B.ms + acc.ms) * (1 + acc.msPct / 100) * (1 - slowMax / 100);
      if (acc.msAbs) ms = acc.msAbs;
      st.ms = B.ms ? clamp(ms, 100, acc.msAbs ? 550 : 550) : 0;
      if (u.kind === 'hero' && this.has(u, 'hex')) st.ms = 140;
    }

    gainPoint(h) { if (h.level <= 25 && !NO_POINT.has(h.level) || h.level > 25) h.points++; }
    giveXp(h, amt) {
      if (h.illusion || h.dead && amt <= 0) return;
      if (this.diff === 3 && h.bot) amt *= 1.25;
      h.xp += amt;
      while (h.level < MAX_LEVEL && h.xp >= XP_TABLE[h.level]) {
        h.level++; this.gainPoint(h); this.recalc(h);
        this.emit({ type: 'levelup', unit: h.id, level: h.level }); this.sfx('levelup', h.x, h.y, { unit: h.id });
      }
    }
    giveGold(h, amt, reliable, src) {
      if (!h || h.kind !== 'hero' || h.illusion) return;
      if (this.diff === 3 && h.bot && amt > 0) amt *= 1.25;
      amt = Math.round(amt);
      if (reliable) h.rgold += amt; else h.ugold += amt;
      h.goldEarned += Math.max(0, amt);
      if (src && amt > 0) this.events.push({ type: 'gold', unit: h.id, x: src.x, y: src.y, amt });
    }
    goldOf(h) { return Math.floor(h.rgold + h.ugold); }
    spendGold(h, amt) { const fromU = Math.min(h.ugold, amt); h.ugold -= fromU; h.rgold -= amt - fromU; }
    netWorth(h) {
      let s = this.goldOf(h);
      for (const arr of [h.items, h.backpack, h.stash]) for (const it of arr) if (it) s += ITEMS[it.id].cost * (ITEMS[it.id].charges ? Math.max(1, it.charges || 1) / ITEMS[it.id].charges : 1);
      if (h.courier) for (const it of h.courier.carry) s += ITEMS[it.id].cost;
      return Math.round(s);
    }
    buybackCost(h) { return Math.round(200 + this.netWorth(h) / 12); }
    heroBounty(v) { return 110 + v.level * 8 + (v.streak >= 3 ? Math.min(10, v.streak - 2) * 60 : 0); }

    ability(h, slot) { if (slot < 4) return h.def.abilities[slot]; if (h.def.extra) return h.def.extra[slot - 4] || null; return slot === 4 ? h.def.scepter || null : null; }
    rank(h, slot) {
      if (slot < 4) return h.ranks[slot];
      const ab = this.ability(h, slot); if (!ab) return 0;
      if (h.def.extra) return ab.needs == null || h.ranks[ab.needs] > 0 ? 1 : 0;
      return this.hasScepter(h) ? 1 : 0;
    }
    extraSlots(h) { const n = h.def.extra ? h.def.extra.length : h.def.scepter ? 1 : 0; const out = []; for (let i = 0; i < n; i++) if (this.rank(h, 4 + i)) out.push(4 + i); return out; }
    av(h, slot, key) {
      const ab = this.ability(h, slot); const r = Math.max(1, this.rank(h, slot)) - 1;
      let v = ab.v[key] ? ab.v[key][Math.min(r, ab.v[key].length - 1)] : 0;
      if (h.def && h.def.talents) h.def.talents.forEach((pair, i) => { const c = h.talents[i]; if (c >= 0 && pair[c].ab === slot && pair[c].k === key) v += pair[c].v; });
      return v;
    }
    abCd(h, slot) {
      const ab = this.ability(h, slot), r = Math.max(1, this.rank(h, slot)) - 1; let cd = ab.cd[Math.min(r, ab.cd.length - 1)];
      h.def.talents.forEach((pair, i) => { const c = h.talents[i]; if (c >= 0 && pair[c].ab === slot && pair[c].k === 'cd') cd += pair[c].v; });
      if (this.has(h, 'arcane')) cd *= 0.7;
      return Math.max(0, cd);
    }
    abMana(h, slot) { const ab = this.ability(h, slot), r = Math.max(1, this.rank(h, slot)) - 1; let m = ab.mana[Math.min(r, ab.mana.length - 1)] || 0; if (this.has(h, 'arcane')) m *= 0.7; return m; }
    abRange(h, slot) { const ab = this.ability(h, slot); const r = ab.range || 0; if (h.hid === 'sniper' && slot === 3) return [3000, 3500, 4000][Math.max(0, h.ranks[3] - 1)] + (h.st.castRange || 0); if (h.hid === 'pudge' && slot === 0) return this.av(h, 0, 'len'); if (h.hid === 'techies' && slot === 3 && this.hasScepter(h)) return 700 + (h.st.castRange || 0); return r ? r + (h.st.castRange || 0) : 0; }
    hasScepter(h) { return !!(h.items && h.items.some(it => it && ITEMS[it.id].scepter)) || !!h.blessing; }
    hasShard(h) { return !!h.shard; }
    canLearn(h, slot) {
      if (h.points <= 0 || slot > 3) return false;
      const ab = h.def.abilities[slot], r = h.ranks[slot];
      if (ab.ult) return r < 3 && h.level >= [6, 12, 18][r];
      return r < 4 && h.level >= r * 2 + 1;
    }
    levelAbility(h, slot) {
      if (!this.canLearn(h, slot)) return false;
      h.ranks[slot]++; h.points--; this.sfx('learn', h.x, h.y, { unit: h.id, local: true });
      const ab = h.def.abilities[slot]; if (ab.charges && h.ranks[slot] === 1) h.charges[slot] = ab.charges;
      if (D.KITS[h.hid] && D.KITS[h.hid].onLearn) D.KITS[h.hid].onLearn(this, h, slot);
      return true;
    }
    canTalent(h, tier) { return h.points > 0 && h.talents[tier] < 0 && h.level >= TALENT_LEVELS[tier]; }
    learnTalent(h, tier, choice) {
      if (!this.canTalent(h, tier)) return false;
      h.talents[tier] = choice; h.points--; this.recalc(h); this.sfx('learn', h.x, h.y, { unit: h.id, local: true });
      return true;
    }

    order(u, o) {
      if (!u || u.dead) return false;
      if (u.channel && o.type !== 'queue') this.stopChannel(u, true);
      if (o.type === 'stop') { u.order = null; u.path = null; u.atk = null; u.cast = null; return true; }
      if (o.type === 'hold') { u.order = { type: 'hold' }; u.path = null; u.cast = null; return true; }
      if (o.type === 'cast') {
        const ok = this.checkCast(u, o.slot, o); if (!ok) return false;
        const ab = this.ability(u, o.slot);
        if (ab.tgt === 'toggle') { this.doCast(u, o.slot, o); return true; }
        if (ab.tgt === 'none' && !ab.cp) { this.doCast(u, o.slot, o); return true; }
      }
      if (o.type === 'item') {
        const ok = this.checkItem(u, o.slot, o); if (!ok) return false;
        const it = this.itemIn(u, o.slot), d = ITEMS[it.id];
        if (!d.range || o.instant || d.active === 'blink') { if (this.useItem(u, o.slot, o)) return true; return false; }
      }
      u.order = o; u.path = null; u.pathT = 0; u.stuckT = 0;
      if (o.type !== 'attack' || !u.atk || u.atk.target !== o.target) u.atk = null;
      u.cast = null;
      return true;
    }
    fail(u, key) { if (!u.bot) this.events.push({ type: 'error', unit: u.id, key }); return false; }
    checkCast(h, slot, o) {
      if (h.kind !== 'hero') return false;
      const ab = this.ability(h, slot); if (!ab) return false;
      const r = this.rank(h, slot); if (!r || ab.tgt === 'passive') return false;
      if (this.isSilenced(h) || this.isStunned(h)) return this.fail(h, 'silenced');
      if (ab.charges) { if (h.charges[slot] <= 0 || h.cds[slot] > 0) return this.fail(h, 'cooldown'); }
      else if (h.cds[slot] > 0) return this.fail(h, 'cooldown');
      if (h.mp < this.abMana(h, slot)) return this.fail(h, 'notEnoughMana');
      if (ab.tgt === 'unit') { const t = o.target; if (!t || t.dead || t.team === h.team || this.isInvuln(t) || !this.canSee(h.team, t) || t.structure || this.isWardLike(t) && !(t.kind === 'mine')) return this.fail(h, 'invalid'); if (this.isImmune(t) && !(h.hid === 'enigma' && slot === 3) && !(h.hid === 'axe' && slot === 3)) return this.fail(h, 'invalid'); }
      if (ab.tgt === 'creep') { const t = o.target; const self = t === h && this.hasShard(h); if (!t || t.dead || (!self && (t.kind !== 'creep' && t.kind !== 'neutral' || t.ancient)) || this.isInvuln(t)) return this.fail(h, 'invalid'); }
      if (ab.tgt === 'ally') { const t = o.target; if (!t || t.dead || t.team !== h.team) return this.fail(h, 'invalid'); }
      if (ab.tgt === 'point' && (o.x == null || o.y == null)) { if (!o.target) return false; o.x = o.target.x; o.y = o.target.y; }
      if (ab.tgt === 'point' && ab.placed && !this.map.walkable(o.x, o.y)) [o.x, o.y] = this.map.nearestWalkable(o.x, o.y, 400);
      return true;
    }
    doCast(h, slot, o) {
      const ab = this.ability(h, slot);
      const kit = D.KITS[h.hid];
      if (ab.tgt !== 'toggle') {
        h.mp -= this.abMana(h, slot);
        if (ab.charges) { h.charges[slot]--; h.cds[slot] = ab.cd[Math.max(0, this.rank(h, slot) - 1)]; if (h.chargeT[slot] <= 0) h.chargeT[slot] = ab.chargeT; }
        else h.cds[slot] = this.abCd(h, slot);
      }
      h.anim.castT = this.time; h.lastCastT = this.time;
      if (ab.tgt !== 'toggle' && ab.tgt !== 'passive') {
        for (const e of this.heroes) if (e.team !== h.team && !e.dead && dist(e, h) < 1200) this.stickCharge(e);
        if (h.hid === 'lina' && h.ranks[2] > 0) this.fierySoul(h);
        if (this.isInvisible(h) || this.has(h, 'invis')) this.breakInvis(h);
      }
      kit.cast[slot](this, h, o, ab);
      if (ab.channel && h.channel) { h.channel.slot = slot; }
      this.emit({ type: 'cast', unit: h.id, slot, key: ab.key, x: o.x, y: o.y, target: o.target && o.target.id });
    }
    fierySoul(h) {
      const st = h.status.find(s => s.tag === 'fiery_soul'); const max = this.av(h, 2, 'stacks');
      const n = Math.min(max, (st ? st.n : 0) + 1), as = this.av(h, 2, 'as'), ms = this.av(h, 2, 'ms');
      this.addStatus(h, { tag: 'fiery_soul', t: this.av(h, 2, 'dur'), n, as: as * n, ms: ms * n, buff: true });
    }
    channelStart(h, dur, tick, end, o = {}) { h.channel = Object.assign({ t: 0, dur, tick, end }, o); h.order = null; h.path = null; }
    stopChannel(h, interrupted) { const c = h.channel; if (!c) return; h.channel = null; if (c.end) c.end(interrupted); }
    interrupt(u, hard) { u.atk = null; u.cast = null; if (u.channel) this.stopChannel(u, true); if (hard && u.tpCh) { u.tpCh = null; this.emit({ type: 'tpCancel', unit: u.id }); } }

    itemIn(h, slot) { return slot === 'tp' ? (h.tp.charges > 0 ? { id: 'tp', charges: h.tp.charges, cd: h.tp.cd } : null) : h.items[slot]; }
    hasItem(h, id) { return h.items.some(it => it && it.id === id); }
    findItem(h, id) { return h.items.findIndex(it => it && it.id === id); }
    nearShop(h) { const s = this.map.shop[h.team]; return Math.hypot(h.x - s[0], h.y - s[1]) < 1300 || Math.hypot(h.x - this.map.fountain[h.team][0], h.y - this.map.fountain[h.team][1]) < 1300; }
    nearSecret(u) { return this.map.secret.some(s => Math.hypot(u.x - s[0], u.y - s[1]) < 600); }
    stockLeft(h, id) { return this.stock[id] ? this.stock[id][h.team] : 99; }
    buyPlan(h, id) {
      const pool = [];
      const addPool = (arr, where) => arr.forEach((it, i) => { if (it && !it.used) pool.push({ it, where, i }); });
      addPool(h.items, 'items'); addPool(h.backpack, 'backpack'); addPool(h.stash, 'stash');
      const used = [];
      const need = (iid) => {
        const k = pool.findIndex(p => p.it.id === iid && !used.includes(p));
        if (k >= 0 && iid !== id) { used.push(pool[k]); return 0; }
        const d = ITEMS[iid]; if (!d.from) return d.cost;
        let c = d.recipe; for (const f of d.from) c += need(f); return c;
      };
      const d = ITEMS[id]; let cost = d.recipe != null && d.from ? d.recipe : d.cost; if (d.from) for (const f of d.from) cost += need(f);
      return { cost, used };
    }
    missingSecret(h, id, used) {
      const out = []; const u2 = used.map(p => p.it);
      const walk = (iid, top) => {
        if (!top) { const k = u2.findIndex(it => it.id === iid); if (k >= 0) { u2.splice(k, 1); return; } }
        const d = ITEMS[iid]; if (!d.from) { if (d.secret) out.push(iid); return; }
        for (const f of d.from) walk(f, false);
      };
      walk(id, true); return out;
    }
    buy(h, id) {
      const d = ITEMS[id]; if (!d || d.cat === 'drop' || h.illusion) return false;
      if (d.after && this.time < d.after) return this.fail(h, 'shardLocked');
      if (d.shard && h.shard) return this.fail(h, 'invalid');
      if (this.stock[id] && this.stock[id][h.team] <= 0) return this.fail(h, 'invalid');
      const plan = this.buyPlan(h, id);
      if (this.goldOf(h) < plan.cost) return this.fail(h, 'notEnoughGold');
      const secretNeed = this.missingSecret(h, id, plan.used);
      const atSecret = this.nearSecret(h) || (h.courier && !h.courier.dead && this.nearSecret(h.courier));
      const atShop = this.nearShop(h) && !h.dead;
      this.spendGold(h, plan.cost);
      if (this.stock[id]) this.stock[id][h.team]--;
      for (const p of plan.used) { h[p.where][p.i] = null; }
      if (d.shard) { h.shard = true; this.sfx('buy', h.x, h.y, { unit: h.id, local: true }); this.emit({ type: 'buy', unit: h.id, item: id }); return true; }
      const item = { id, charges: d.charges || 0, cd: 0, boughtT: this.time };
      if (d.stick) item.charges = 0; if (d.bottle) item.charges = 3;
      if (id === 'tp') { if (atShop) { h.tp.charges++; } else { this.toStash(h, item); } this.afterBuy(h, id); return true; }
      if (secretNeed.length && !atSecret) {
        h.secretQueue.push(item); this.courierSecret(h);
      } else if (atShop || (atSecret && this.nearSecret(h))) {
        if (!this.toInventory(h, item)) this.toStash(h, item);
      } else this.toStash(h, item);
      this.afterBuy(h, id);
      return true;
    }
    afterBuy(h, id) { this.sfx('buy', h.x, h.y, { unit: h.id, local: true }); this.emit({ type: 'buy', unit: h.id, item: id }); if (h.k) h.k.lastBuy = this.time; }
    stackInto(arr, item) {
      const d = ITEMS[item.id]; if (!d.charges || d.bottle || d.stick) return false;
      const ex = arr.find(it => it && it.id === item.id); if (!ex) return false; ex.charges += item.charges; return true;
    }
    toInventory(h, item) {
      if (item.id === 'tp') { h.tp.charges += Math.max(1, item.charges); return true; }
      if (this.stackInto(h.items, item) || this.stackInto(h.backpack, item)) return true;
      let i = h.items.indexOf(null); if (i >= 0) { h.items[i] = item; this.recalc(h); return true; }
      i = h.backpack.indexOf(null); if (i >= 0) { h.backpack[i] = item; return true; }
      return false;
    }
    toStash(h, item) {
      if (this.stackInto(h.stash, item)) return true;
      const i = h.stash.indexOf(null); if (i >= 0) { h.stash[i] = item; return true; }
      const f = this.map.fountain[h.team]; this.drops.push({ item, x: f[0] + 150, y: f[1] - 150 }); return false;
    }
    sell(h, where, i, force) {
      const arr = h[where]; const it = arr && arr[i]; if (!it) return false; const d = ITEMS[it.id]; if (d.noSell) return false;
      if (!force && !this.nearShop(h) && where !== 'stash') return this.fail(h, 'noShop');
      const full = this.time - (it.boughtT || -99) < 10; let v = Math.floor(d.cost * (full ? 1 : 0.5));
      if (d.charges && !d.bottle && !d.stick) v = Math.floor(v * (it.charges || 0) / d.charges);
      arr[i] = null; this.giveGold(h, v, false); this.recalc(h); this.sfx('sell', h.x, h.y, { unit: h.id, local: true });
      return true;
    }
    swapItems(h, a, ai, b, bi) {
      const A = h[a], B = h[b]; if (!A || !B) return; const t = A[ai]; A[ai] = B[bi]; B[bi] = t; this.recalc(h);
    }
    stickCharge(h) { for (const it of h.items) if (it && ITEMS[it.id].stick) it.charges = Math.min(ITEMS[it.id].stick, it.charges + 1); }
    checkItem(h, slot, o) {
      if (h.kind !== 'hero' || h.dead) return false;
      const it = this.itemIn(h, slot); if (!it) return false; const d = ITEMS[it.id]; if (!d.active) return false;
      if (this.isStunned(h) || this.has(h, 'hex')) return this.fail(h, 'silenced');
      if (slot === 'tp' ? h.tp.cd > 0 : it.cd > 0) return this.fail(h, 'cooldown');
      if (d.mana && h.mp < d.mana) return this.fail(h, 'notEnoughMana');
      if (this.has(h, 'madness') && d.active !== 'madness') {  }
      return true;
    }
    useItem(h, slot, o) {
      const it = this.itemIn(h, slot), d = ITEMS[it.id], A = d.active, f = this.map.fountain[h.team];
      const setCd = (c) => { if (slot === 'tp') h.tp.cd = c; else it.cd = c; };
      const consume = () => { if (slot === 'tp') { h.tp.charges--; return; } it.charges--; if (it.charges <= 0 && !d.stick && !d.bottle) { h.items[slot] = null; this.recalc(h); } };
      const tgt = o.target, tx = o.x != null ? o.x : tgt ? tgt.x : h.x, ty = o.y != null ? o.y : tgt ? tgt.y : h.y;
      const enemyOk = (t) => t && !t.dead && t.team !== h.team && !this.isInvuln(t) && this.canSee(h.team, t) && !t.structure;
      switch (A) {
        case 'tango': {
          const tree = o.tree || this.map.nearestTree(h.x, h.y, 300); if (!tree) return this.fail(h, 'invalid');
          this.destroyTree(tree); this.addStatus(h, { tag: 'tango', t: 16, hpr: 7, buff: true }); consume(); this.sfx('eat', h.x, h.y); break;
        }
        case 'salve': this.addStatus(h, { tag: 'salve', t: 10, hpr: 40, buff: true, breakOnHeroDmg: true }); consume(); this.sfx('potion', h.x, h.y); break;
        case 'clarity': this.addStatus(h, { tag: 'clarity', t: 25, mpr: 6, buff: true, breakOnHeroDmg: true }); consume(); this.sfx('potion', h.x, h.y); break;
        case 'faerie': this.heal(h, 85); consume(); this.sfx('potion', h.x, h.y); break;
        case 'mango': h.mp = Math.min(h.maxMp, h.mp + 100); consume(); this.sfx('potion', h.x, h.y); break;
        case 'cheese': this.heal(h, 2500); h.mp = Math.min(h.maxMp, h.mp + 1500); h.items[slot] = null; this.sfx('potion', h.x, h.y); break;
        case 'bottle': if (it.charges <= 0) return this.fail(h, 'invalid'); it.charges--; this.addStatus(h, { tag: 'bottle', t: 2.5, hpr: 44, mpr: 24, buff: true }); setCd(0.5); this.sfx('potion', h.x, h.y); break;
        case 'stick': { if (it.charges <= 0) return this.fail(h, 'invalid'); const v = it.charges * 15; this.heal(h, v); h.mp = Math.min(h.maxMp, h.mp + v); it.charges = 0; setCd(d.cd); this.sfx('wand', h.x, h.y); break; }
        case 'soul_ring': h.hp = Math.max(1, h.hp - 170); h.mp = Math.min(h.maxMp + 170, h.mp + 170); setCd(d.cd); this.sfx('soul_ring', h.x, h.y); break;
        case 'phase': this.addStatus(h, { tag: 'phase', t: 3, ms: 20, phased: true, buff: true }); setCd(d.cd); this.sfx('phase', h.x, h.y); break;
        case 'treads': h.treads = h.treads === 'str' ? 'agi' : h.treads === 'agi' ? 'int' : 'str'; this.recalc(h); break;
        case 'arcane': for (const a of this.alliesIn(h.team, h.x, h.y, 1200, { heroesOnly: true })) a.mp = Math.min(a.maxMp, a.mp + 175); setCd(d.cd); this.fx('ring', { x: h.x, y: h.y, r: 1200, color: '#60a0ff' }); this.sfx('arcane', h.x, h.y); break;
        case 'mek': if (h.mp < 100) return this.fail(h, 'notEnoughMana'); h.mp -= 100; for (const a of this.alliesIn(h.team, h.x, h.y, 1200)) this.heal(a, 275); setCd(d.cd); this.fx('ring', { x: h.x, y: h.y, r: 1200, color: '#80ff80' }); this.sfx('heal', h.x, h.y); break;
        case 'midas': {
          if (!tgt || tgt.dead || !(tgt.kind === 'creep' || tgt.kind === 'neutral') || tgt.ancient || tgt.kind === 'roshan') return this.fail(h, 'invalid');
          if (dist(h, tgt) > d.range + 100) return this.goUse(h, slot, o, d.range);
          this.giveGold(h, 160, true, tgt); this.giveXp(h, (tgt.xp || 50) * 2.1); tgt.noBounty = true; this.kill(tgt, h); setCd(d.cd); this.sfx('midas', tgt.x, tgt.y); break;
        }
        case 'force': {
          const t = tgt && !tgt.dead ? tgt : h; if (t !== h && dist(h, t) > d.range + 100) return this.goUse(h, slot, o, d.range);
          if (t.team !== h.team && this.isImmune(t)) return this.fail(h, 'invalid');
          h.mp -= d.mana; this.push(t, t.face, 600, 0.4); setCd(d.cd); this.sfx('force', t.x, t.y); break;
        }
        case 'glimmer': { const t = tgt && tgt.team === h.team && !tgt.dead ? tgt : h; if (dist(h, t) > d.range + 100) return this.goUse(h, slot, o, d.range); h.mp -= d.mana; this.addStatus(t, { tag: 'glimmer', t: 5, invis: true, fadeAt: this.time + 0.6, mr: 45, buff: true }); setCd(d.cd); this.sfx('glimmer', t.x, t.y); break; }
        case 'euls': {
          const t = tgt && !tgt.dead ? tgt : h; if (t !== h && t.team === h.team) return this.fail(h, 'invalid');
          if (t !== h && (!enemyOk(t) || this.isImmune(t))) return this.fail(h, 'invalid');
          if (dist(h, t) > d.range + 100) return this.goUse(h, slot, o, d.range);
          h.mp -= d.mana; if (t === h) this.dispel(h); this.addStatus(t, { tag: 'cyclone', t: 2.5, cyclone: true, debuff: t !== h }); this.interrupt(t, true);
          if (t !== h) this.later(2.5, () => { if (!t.dead) this.dmg(h, t, 50, 'mag', { item: 'euls' }); });
          setCd(d.cd); this.sfx('euls', t.x, t.y); break;
        }
        case 'dagon': { if (!enemyOk(tgt) || this.isImmune(tgt)) return this.fail(h, 'invalid'); if (dist(h, tgt) > d.range + 100) return this.goUse(h, slot, o, d.range); h.mp -= d.mana; this.dmg(h, tgt, 400, 'mag', { item: 'dagon' }); this.fx('beam', { x: h.x, y: h.y, x2: tgt.x, y2: tgt.y, color: '#ff4040' }); setCd(d.cd); this.sfx('dagon', tgt.x, tgt.y); break; }
        case 'hex': { if (!enemyOk(tgt) || this.isImmune(tgt)) return this.fail(h, 'invalid'); if (dist(h, tgt) > d.range + 100) return this.goUse(h, slot, o, d.range); h.mp -= d.mana; this.hex(tgt, 3.5, h); setCd(d.cd); break; }
        case 'abyssal': { if (!enemyOk(tgt)) return this.fail(h, 'invalid'); if (dist(h, tgt) > d.range + 150) return this.goUse(h, slot, o, d.range); h.mp -= d.mana; this.addStatus(tgt, { tag: 'abyssal', stun: true, t: 2, debuff: true, pierce: true }); this.interrupt(tgt, true); setCd(d.cd); this.sfx('bash', tgt.x, tgt.y); break; }
        case 'blink': {
          if (h.lastHeroDmgT > this.time - 3) return this.fail(h, 'cooldown');
          if (this.isRooted(h)) return this.fail(h, 'invalid');
          let dx = tx - h.x, dy = ty - h.y; const l = Math.hypot(dx, dy); const m = l > 1200 ? 960 : l; if (l > 0) { dx /= l; dy /= l; }
          const [nx, ny] = this.map.nearestWalkable(h.x + dx * m, h.y + dy * m, 400);
          this.fx('blink', { x: h.x, y: h.y }); this.teleport(h, nx, ny); this.fx('blink', { x: nx, y: ny }); setCd(d.cd); this.sfx('blink', nx, ny); h.order = null; break;
        }
        case 'bkb': this.dispel(h, false); this.addStatus(h, { tag: 'bkb', t: 9, immune: true, buff: true, mr: 100 }); setCd(d.cd); this.sfx('bkb', h.x, h.y); break;
        case 'blade_mail': h.mp -= d.mana; this.addStatus(h, { tag: 'blade_mail', t: 4.5, returnPct: 85, buff: true }); setCd(d.cd); this.sfx('blade_mail', h.x, h.y); break;
        case 'shadow': h.mp -= d.mana; this.addStatus(h, { tag: 'shadow', t: 14, invis: true, fadeAt: this.time + 0.3, msPctB: 20, ms: 20, shadowHit: 175, buff: true }); setCd(d.cd); this.sfx('invis', h.x, h.y); break;
        case 'madness': this.addStatus(h, { tag: 'madness', t: 6, as: 110, msFlat: 30, armor: -8, silence: true, buff: true }); setCd(d.cd); this.sfx('madness', h.x, h.y); break;
        case 'manta': h.mp -= d.mana; this.dispel(h); this.makeIllusions(h, 2, 20, 0.33, 3.5); setCd(d.cd); this.sfx('manta', h.x, h.y); break;
        case 'refresher': { h.mp -= d.mana; h.cds = h.cds.map(() => 0); for (const x of h.items) if (x && x !== it) x.cd = 0; h.tp.cd = 0; setCd(d.cd); this.fx('ring', { x: h.x, y: h.y, r: 200, color: '#40ff80' }); this.sfx('refresher', h.x, h.y); break; }
        case 'dust': { for (const e of this.unitsIn(h.x, h.y, 1050, u => u.team !== h.team)) this.addStatus(e, { tag: 'dust', t: 12, reveal: true, slow: 20, debuff: true }); this.scans.push({ team: h.team, x: h.x, y: h.y, r: 1050, until: this.time + 12, trueSight: true }); consume(); setCd(d.cd); this.sfx('dust', h.x, h.y); break; }
        case 'ward_obs': case 'ward_sentry': {
          if (Math.hypot(tx - h.x, ty - h.y) > d.range + 50) return this.goUse(h, slot, o, d.range);
          if (!this.map.walkable(tx, ty)) return this.fail(h, 'invalid');
          this.placeWard(h, A === 'ward_obs' ? 'obs' : 'sentry', tx, ty); consume(); this.sfx('ward', tx, ty); break;
        }
        case 'chop': { const tree = o.tree || this.map.nearestTree(tx, ty, 200); if (!tree) return this.fail(h, 'invalid'); if (Math.hypot(tree.x - h.x, tree.y - h.y) > 400) return this.goUse(h, slot, Object.assign({}, o, { tree }), 350); this.destroyTree(tree); setCd(d.cd); this.sfx('chop', tree.x, tree.y); break; }
        case 'tp': {
          const dest = this.tpDest(h, tx, ty); if (!dest) return this.fail(h, 'invalid');
          h.tpCh = { t: 0, dur: 3, x: dest[0], y: dest[1] }; h.order = null; h.path = null; consume(); setCd(80);
          this.emit({ type: 'tp', unit: h.id, x: dest[0], y: dest[1], team: h.team }); this.sfx('tp', h.x, h.y); break;
        }
        default: return false;
      }
      if (h.hid === 'lina' && A !== 'treads') {  }
      if (A !== 'treads' && A !== 'tp') for (const e of this.heroes) if (e.team !== h.team && !e.dead && dist(e, h) < 1200 && ['blink', 'bkb', 'manta', 'euls', 'dagon', 'hex', 'force', 'mek', 'shadow', 'refresher', 'blade_mail', 'abyssal'].includes(A)) this.stickCharge(e);
      this.emit({ type: 'item', unit: h.id, item: it.id });
      return true;
    }
    goUse(h, slot, o, range) { h.order = Object.assign({}, o, { type: 'item', slot, range }); h.path = null; return true; }
    tpDest(h, x, y) {
      let best = null, bd = 1e9;
      for (const s of this.structs) if (s.team === h.team && !s.dead && (s.kind === 'tower' || s.kind === 'fountain' || s.kind === 'ancient' || s.kind === 'rax')) { const d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = s; } }
      if (!best) return null;
      const dx = x - best.x, dy = y - best.y, l = Math.hypot(dx, dy) || 1, off = Math.min(l, 350);
      return this.map.nearestWalkable(best.x + dx / l * off, best.y + dy / l * off, 500);
    }
    placeWard(h, type, x, y) {
      const w = this.mkUnit('ward', h.team, x, y, { wardType: type, r: 12, hp: type === 'obs' ? 2 : 2, maxHp: 2, owner: h.id, expires: this.time + (type === 'obs' ? 360 : 420) });
      Object.assign(w.base, { ms: 0, range: 0, vision: type === 'obs' ? [1600, 1000] : [150, 150], armor: 0 }); this.recalc(w); w.hp = w.maxHp; w.wardHits = true;
      return w;
    }
    makeIllusions(h, n, dur, outMul, inMul) {
      const out = [];
      for (let i = 0; i < n; i++) {
        const a = this.rng() * Math.PI * 2, [x, y] = this.map.nearestWalkable(h.x + Math.cos(a) * 120, h.y + Math.sin(a) * 120, 300);
        const il = this.mkUnit('hero', h.team, x, y, {
          hid: h.hid, def: h.def, name: h.name, illusion: true, owner: h.id, ownerU: h, expires: this.time + dur, outMul, inMul, bot: true, level: h.level, xp: 0, gold: 0, rgold: 0, ugold: 0,
          items: h.items.map(it => it ? { id: it.id, charges: 0, cd: 99 } : null), backpack: [null, null, null], stash: [], tp: { charges: 0, cd: 0 }, ranks: h.ranks.slice(), cds: [99, 99, 99, 99, 99, 99], charges: [0, 0, 0, 0, 0, 0], chargeT: [0, 0, 0, 0, 0, 0], talents: h.talents.slice(),
          kills: 0, deaths: 0, assists: 0, lh: 0, dn: 0, streak: 0, points: 0, k: {}, secretQueue: [], treads: h.treads, flesh: h.flesh, r: h.r
        });
        Object.assign(il.base, h.base); this.recalc(il); il.hp = h.hp / h.maxHp * il.maxHp; il.mp = h.mp;
        il.face = h.face; il.order = h.order && h.order.type === 'attack' ? { type: 'attack', target: h.order.target } : null; out.push(il);
        this.fx('blink', { x, y, color: '#8080ff' });
      }
      return out;
    }

    heal(u, amt) { if (u.dead || amt <= 0) return 0; const b = u.hp; u.hp = Math.min(u.maxHp, u.hp + amt); const d = u.hp - b; if (d >= 20 && u.kind === 'hero') this.float(u, '+' + Math.round(d), '#40ff40'); return d; }
    dmg(src, tgt, amt, type, o = {}) {
      if (!tgt || tgt.dead || amt <= 0) return 0;
      if (this.isInvuln(tgt) && !o.hpRemoval) return 0;
      if ((type === 'mag' || type === 'comp') && this.isImmune(tgt) && !o.pierce) return 0;
      if (type === 'phys' && this.has(tgt, 'ethereal')) return 0;
      const owner = src && src.ownerU && src.kind !== 'hero' ? src.ownerU : src;
      let v = amt;
      if (tgt.wardHits) { if (!o.attack) return 0; v = 1; tgt.hp -= 1; if (tgt.hp <= 0) this.kill(tgt, src, o); return 1; }
      if (type === 'phys') v *= armorMul(tgt.st.armor);
      else if (type === 'mag') v *= 1 - tgt.st.mr;
      else if (type === 'comp') v *= armorMul(tgt.st.armor) * (1 - tgt.st.mr);
      if (tgt.inMul && src) v *= tgt.inMul;
      if (src && src.illusion && src.outMul) v *= o.attack ? src.outMul : 0;
      if (tgt.structure && src) {
        if (o.attack && (src.kind === 'hero') && !src.illusion) {
          if (tgt.kind !== 'fountain' && !this.unitsIn(tgt.x, tgt.y, 900, u => u.kind === 'creep' && u.team !== tgt.team).length) { v *= 0.75; tgt.bdPool = (tgt.bdPool || 0) + v; }
        }
        if (src.siege && o.attack) v *= 2.5;
        if (!o.attack && !o.bld) v *= 0.5;
        if (tgt.kind === 'tower' && src.kind === 'creep' && !src.siege && o.attack) v *= 0.5;
      }
      if (src && src.kind === 'hero' && tgt.kind === 'hero' && !src.illusion) { const amp = src.spellAmp || 0; if (!o.attack && amp) v *= 1 + amp / 100; }
      const bm = tgt.status.find(s => s.returnPct);
      if (bm && src && !src.dead && src.team !== tgt.team && !o.reflected && src.kind !== 'tower') this.dmg(tgt, src, v * bm.returnPct / 100, 'pure', { reflected: true, item: 'blade_mail' });
      if (o.nonLethal && v >= tgt.hp) v = Math.max(0, tgt.hp - 1);
      v = Math.max(0, v);
      if (v > 0 && tgt.status.length) for (const sh of tgt.status) if (sh.shield > 0) { const a = Math.min(sh.shield, v); sh.shield -= a; v -= a; if (sh.shield <= 0) sh.t = 0; if (v <= 0) break; }
      tgt.hp -= v;
      if (src) {
        tgt.lastDmgT = this.time;
        if (owner && owner.kind === 'hero') {
          tgt.dmgFrom[owner.id] = this.time;
          if (tgt.kind === 'hero' && owner.team !== tgt.team) { tgt.lastHeroDmgT = this.time; if (!owner.illusion) owner.heroDmg += v; }
        }
        if (src.kind === 'hero') { src.lastAtkT = o.attack ? this.time : src.lastAtkT; }
        if (tgt.kind === 'hero' && owner && owner.team !== tgt.team && owner.kind === 'hero') for (const s of tgt.status) if (s.breakOnHeroDmg) s.t = 0;
        if (tgt.kind === 'tower' || tgt.kind === 'rax' || tgt.kind === 'ancient') tgt.lastHitByTeam = src.team;
        if ((tgt.kind === 'neutral' || tgt.kind === 'roshan') && src.team !== 2) this.neutralAggro(tgt, src.kind === 'hero' || src.kind === 'eidolon' || src.kind === 'creep' ? src : owner || src);
      }
      if (v >= 1 && (o.attack ? (owner && owner.kind === 'hero' && !owner.bot) || (tgt.kind === 'hero' && !tgt.bot) : true)) {
        if (!o.quiet && (v >= 5 || !o.attack)) this.events.push({ type: 'dmg', x: tgt.x, y: tgt.y, amt: Math.round(v), kind: type, crit: o.crit, src: owner && owner.id, tgt: tgt.id });
      }
      if (tgt.hp <= 0) this.kill(tgt, src, o);
      return v;
    }
    push(u, ang, distance, dur) {
      if (u.structure || u.dead) return;
      this.interrupt(u, false);
      const sx = u.x, sy = u.y; let ex = sx + Math.cos(ang) * distance, ey = sy + Math.sin(ang) * distance;
      u.pushFx = { sx, sy, ex, ey, t: 0, dur };
      this.addStatus(u, { tag: 'pushed', t: dur, pushed: true });
    }
    teleport(u, x, y) { u.x = u.px = x; u.y = u.py = y; u.path = null; u.atk = null; this.projectiles.forEach(p => { if (p.target === u && p.dodge) p.lost = true; }); }
    hex(u, t, src) { if (this.isImmune(u)) return; this.addStatus(u, { tag: 'hex', hex: true, t, debuff: true, src: src && src.id }); this.interrupt(u, false); this.fx('hex', { x: u.x, y: u.y }); this.sfx('hex', u.x, u.y); }
    breakInvis(u) { u.status = u.status.filter(s => !(s.invis && !s.keepOnAttack)); }

    kill(u, src, o = {}) {
      if (u.dead) return;
      if (u.kind === 'hero' && !u.illusion && u.hasAegisOn) {  }
      u.hp = 0; u.dead = true; u.deathT = this.time; u.order = null; u.path = null; u.atk = null; u.cast = null;
      if (u.channel) this.stopChannel(u, true); u.tpCh = null;
      const killer = src ? (src.kind !== 'hero' && src.ownerU ? src.ownerU : src) : null;
      const kh = killer && killer.kind === 'hero' ? (killer.illusion ? killer.ownerU : killer) : null;
      if (src && src.status && src.status.some(s => s.hunger)) src.status = src.status.filter(s => !s.hunger);
      for (const s of u.status) if (s.endOnDeath && s.onEnd) { s.onEnd(this, u, s); }
      this.emit({ type: 'death', unit: u.id, kind: u.kind, x: u.x, y: u.y, team: u.team, killer: kh && kh.id });
      if (u.kind === 'hero' && !u.illusion) return this.heroDeath(u, killer, kh, o);
      if (u.illusion) { this.fx('poof', { x: u.x, y: u.y }); this.removeLater(u, 0.1); return; }
      if (u.structure) return this.structureDeath(u, kh, killer);
      if (u.kind === 'roshan') return this.roshanDeath(u, kh);
      if (u.kind === 'courier') { u.respawnT = this.time + 60; if (kh) { this.giveGold(kh, 150, true, u); this.msg('courierDead', { team: u.team }); } for (const it of u.carry) this.toStash(u.ownerU, it); u.carry = []; return; }
      if (u.kind === 'ward' || u.kind === 'mine' || u.kind === 'sign' || u.kind === 'hward') { if (kh && u.kind === 'ward' && u.team !== kh.team) this.giveGold(kh, u.wardType === 'obs' ? 50 : 25, true, u); this.removeLater(u, 0.5); return; }
      const denied = killer && killer.team === u.team;
      const xp = u.xp || 0;
      if (xp && !u.summon) {
        const xpTeam = u.team === 2 ? (killer ? killer.team : -1) : 1 - u.team;
        const recv = this.heroes.filter(h => !h.dead && !h.illusion && h.team === xpTeam && Math.hypot(h.x - u.x, h.y - u.y) < 1500);
        const amt = denied ? xp * 0.5 : xp;
        if (recv.length) for (const h of recv) this.giveXp(h, amt / recv.length);
      }
      if (kh && !u.noBounty) {
        if (denied) { kh.dn++; this.events.push({ type: 'deny', x: u.x, y: u.y, unit: kh.id }); }
        else if (u.gold) {
          let g = u.gold[0] + Math.floor(this.rng() * (u.gold[1] - u.gold[0] + 1));
          this.giveGold(kh, g, false, u); kh.lh++;
        }
      }
      if (u.camp) { u.camp.units = u.camp.units.filter(x => x !== u); }
      if (u.onDeath) u.onDeath(this, u, killer);
      this.removeLater(u, u.kind === 'eidolon' ? 0.3 : 1.8);
    }
    removeLater(u, t) { u.removeAt = this.time + t; }
    heroDeath(h, killer, kh, o) {
      const L = h.level;
      const ai = h.items.findIndex(it => it && it.id === 'aegis');
      if (ai >= 0) {
        h.items[ai] = null; this.aegisHolder = null;
        h.respawnT = this.time + 5; h.aegisRevive = { x: h.x, y: h.y };
        this.msg('aegisReborn', { unit: h.id });
      } else {
        h.respawnT = this.time + RESPAWN[L - 1] * (this.opts.fastRespawn ? 0.3 : 1) * (o.suicide ? 0.5 : 1); h.aegisRevive = null;
        const loss = Math.min(h.ugold, Math.round(30 + this.netWorth(h) / 40)); h.ugold -= loss;
      }
      h.deaths++; const prevStreak = h.streak; h.streak = 0;
      for (let i = 0; i < 6; i++) { const it = h.items[i]; if (it && ITEMS[it.id].dropOnDeath && !(kh && kh.team === h.team)) { h.items[i] = null; this.drops.push({ item: it, x: h.x + (this.rng() - 0.5) * 80, y: h.y + (this.rng() - 0.5) * 80 }); } }
      this.recalc(h);
      if (kh && kh.team !== h.team) {
        this.teamStats[kh.team].kills++;
        kh.kills++; kh.streak++;
        const bounty = this.heroBounty(Object.assign({}, h, { streak: prevStreak })) + (this.firstBlood ? 0 : 150);
        this.giveGold(kh, bounty, true, h);
        const helpers = this.heroes.filter(a => a.team === kh.team && a !== kh && !a.dead && !a.illusion && ((h.dmgFrom[a.id] || -99) > this.time - 18 || Math.hypot(a.x - h.x, a.y - h.y) < 1300));
        for (const a of helpers) { a.assists++; this.giveGold(a, (60 + L * 6) / Math.max(1, helpers.length) * 1.5, true, h); }
        const xpShare = [kh, ...helpers].filter(a => Math.hypot(a.x - h.x, a.y - h.y) < 1500 || a === kh);
        const xpAmt = 100 + h.xp * 0.12;
        for (const a of xpShare) this.giveXp(a, xpAmt / xpShare.length);
        this.emit({ type: 'kill', killer: kh.id, victim: h.id, first: !this.firstBlood, streak: kh.streak, gold: bounty });
        if (!this.firstBlood) { this.firstBlood = true; this.emit({ type: 'announce', key: 'firstBlood' }); }
        else if (kh.streak >= 3) this.emit({ type: 'announce', key: 'streak' + Math.min(10, kh.streak), unit: kh.id });
        if (prevStreak >= 3) this.emit({ type: 'announce', key: 'ended', unit: kh.id, victim: h.id });
        kh.multi = kh.multi && this.time - kh.multi.t < 18 ? { n: kh.multi.n + 1, t: this.time } : { n: 1, t: this.time };
        if (kh.multi.n >= 2) this.emit({ type: 'announce', key: 'multi' + Math.min(5, kh.multi.n), unit: kh.id });
      } else {
        const near = this.heroes.filter(a => a.team !== h.team && !a.dead && !a.illusion && Math.hypot(a.x - h.x, a.y - h.y) < 1300);
        const byEnemy = killer && killer.team !== h.team && killer.team !== 2;
        if (byEnemy) { this.teamStats[1 - h.team].kills++; for (const a of near) { this.giveGold(a, this.heroBounty(h) / Math.max(1, near.length), true, h); this.giveXp(a, (100 + h.xp * 0.12) / near.length); } }
        this.emit({ type: 'kill', killer: killer ? killer.id : 0, victim: h.id, deny: killer && killer.team === h.team, neutral: !byEnemy });
      }
      for (const p of this.heroes) if (p.hid === 'pudge' && p.team !== h.team && !p.dead && p.ranks[2] > 0 && Math.hypot(p.x - h.x, p.y - h.y) < this.av(p, 2, 'radius') + 200) { p.flesh += this.av(p, 2, 'str'); this.recalc(p); }
      if (kh && kh.hid === 'lion' && o.ability === 'finger_of_death') kh.fingerKills++;
      this.sfx('hero_die', h.x, h.y);
    }
    structureDeath(u, kh, killer) {
      this.map.setFootprint(u.def, 0); this._vulnN = -1;
      const enemyTeam = 1 - u.team;
      const denied = killer && killer.team === u.team;
      this.sfx('building_die', u.x, u.y); this.fx('explosion', { x: u.x, y: u.y, big: true });
      if (u.kind === 'tower') {
        const T = TOWERS[u.tier];
        this.teamStats[enemyTeam].towers++;
        for (const h of this.heroes) if (h.team === enemyTeam && !h.illusion) this.giveGold(h, denied ? T.team / 2 : T.team, true);
        if (kh && !denied) { this.giveGold(kh, T.bounty, false, u); }
        if (u.tier === 1) this.glyphCd[u.team] = 0;
        this.msg('towerFell', { team: u.team, tier: u.tier, lane: u.lane, denied });
        this.emit({ type: 'announce', key: denied ? 'towerDenied' : u.team === 0 ? 'radiantTower' : 'direTower' });
      } else if (u.kind === 'rax') {
        const B = BARRACKS[u.raxType];
        this.teamStats[enemyTeam].rax++;
        for (const h of this.heroes) if (h.team === enemyTeam && !h.illusion) this.giveGold(h, B.team, true);
        this.raxDead[u.team][u.lane][u.raxType] = true;
        this.msg('raxFell', { team: u.team, lane: u.lane, raxType: u.raxType });
        this.emit({ type: 'announce', key: 'rax' });
      } else if (u.kind === 'ancient') {
        this.winner = enemyTeam;
        this.emit({ type: 'victory', team: enemyTeam });
      }
    }
    roshanDeath(u, kh) {
      this.roshan = null; this.roshanN++; const team = kh ? kh.team : 0;
      this.teamStats[team].roshans++;
      if (kh) { this.giveGold(kh, 200, true, u); for (const h of this.heroes) if (h.team === team && !h.illusion) this.giveGold(h, 135, true); }
      for (const h of this.heroes) if (h.team === team && !h.dead && Math.hypot(h.x - u.x, h.y - u.y) < 1500) this.giveXp(h, ROSHAN.xp / 2);
      this.drops.push({ item: { id: 'aegis', charges: 0, cd: 0 }, x: u.x, y: u.y });
      if (this.roshanN >= 2) this.drops.push({ item: { id: 'cheese', charges: 1, cd: 0 }, x: u.x + 60, y: u.y + 40 });
      this.roshanAt = this.time + ROSHAN.respawn[0] + this.rng() * (ROSHAN.respawn[1] - ROSHAN.respawn[0]);
      this.msg('roshanKilled', { team });
      this.emit({ type: 'announce', key: 'roshan', team });
      this.removeLater(u, 3);
    }

    spawnWaves() {
      this.waveN++;
      const min = this.time / 60;
      const nMelee = 3 + (min >= 15 ? 1 : 0) + (min >= 30 ? 1 : 0) + (min >= 45 ? 1 : 0), nRanged = 1 + (min >= 30 ? 1 : 0);
      const siege = this.waveN % 5 === 4;
      for (let team = 0; team < 2; team++) for (const lane of LANES) {
        const enemy = 1 - team, rd = this.raxDead[enemy];
        const allDead = LANES.every(l => rd[l].melee && rd[l].ranged);
        const mt = allDead ? 'melee_mega' : rd[lane].melee ? 'melee_super' : 'melee', rt = allDead ? 'ranged_mega' : rd[lane].ranged ? 'ranged_super' : 'ranged';
        const list = []; for (let i = 0; i < nMelee; i++) list.push(mt); for (let i = 0; i < nRanged; i++) list.push(rt); if (siege) list.push('siege');
        list.forEach((type, i) => this.spawnCreep(type, team, lane, i));
      }
    }
    spawnCreep(type, team, lane, i) {
      const C = CREEPS[type], path = this.map.lanes[lane];
      const pts = team === 0 ? path.map(p => p.slice()) : path.slice().reverse().map(p => p.slice());
      const s = pts[0], n = pts[1], dx = n[0] - s[0], dy = n[1] - s[1], l = Math.hypot(dx, dy) || 1;
      const fwd = Math.floor(i / 3) * 70, side = ((i % 3) - 1) * 45;
      const [x, y] = this.map.nearestWalkable(s[0] + dx / l * fwd - dy / l * side, s[1] + dy / l * fwd + dx / l * side, 300);
      const grow = Math.floor(Math.max(0, this.time) / 450);
      const u = this.mkUnit('creep', team, x, y, { creepType: type, lane, pts, wp: 1, r: C.r, hp: C.hp + grow * 12, maxHp: C.hp + grow * 12, gold: C.gold, xp: C.xp, siege: !!C.siege, mp: C.mp || 0, maxMp: C.mp || 0 });
      Object.assign(u.base, { dmg: [C.dmg[0] + grow, C.dmg[1] + grow], armor: C.armor, ms: C.ms, range: C.range, bat: C.bat, ap: C.ap, proj: C.proj || 0, mr: C.mr, vision: [750, 750], turn: 0.5 });
      this.recalc(u); u.hp = u.maxHp;
      return u;
    }
    spawnCamp(camp) {
      const types = CAMP_TYPES[camp.def.type], p = camp.def.p;
      types.forEach((t, i) => {
        const N = NEUTRALS[t], a = i / types.length * Math.PI * 2;
        const [x, y] = this.map.nearestWalkable(p[0] + Math.cos(a) * 90, p[1] + Math.sin(a) * 90, 300);
        const u = this.mkUnit('neutral', 2, x, y, { ntype: t, camp, home: [x, y], r: N.r, hp: N.hp, maxHp: N.hp, gold: N.gold, xp: N.xp, ancient: !!N.ancient, stomp: N.stomp, stompCd: 5 });
        Object.assign(u.base, { dmg: N.dmg, armor: N.armor, ms: N.ms, range: N.range, bat: N.bat, ap: 0.4, proj: N.proj || 0, vision: [800, 800], turn: 0.5, mr: 0, hpr: 1 });
        u.vis = [false, false];
        this.recalc(u); u.hp = u.maxHp;
        camp.units.push(u);
      });
    }
    spawnRoshan() {
      const [x, y] = this.map.roshan, R = ROSHAN, min = Math.max(0, this.time / 60);
      const u = this.mkUnit('roshan', 2, x, y, { r: R.r, hp: R.hp + R.hpPerMin * min, maxHp: R.hp + R.hpPerMin * min, gold: null, xp: 0, home: [x, y], ancient: true, slamCd: 13 });
      Object.assign(u.base, { dmg: [R.dmg[0] + R.dmgPerMin * min, R.dmg[1] + R.dmgPerMin * min], armor: R.armor + min * 0.375, ms: R.ms, range: R.range, bat: R.bat, ap: 0.6, mr: R.mr, vision: [1000, 1000], turn: 0.4, hpr: 20 });
      u.vis = [false, false]; this.recalc(u); u.hp = u.maxHp; this.roshan = u;
    }
    spawnRunes() {
      const t = Math.round(this.time);
      if (t >= this.nextPowerRune) {
        this.runes = this.runes.filter(r => r.kind === 'bounty');
        if (this.nextPowerRune < 360) { for (const p of this.map.powerRunes) this.runes.push({ kind: 'water', x: p[0], y: p[1], t: this.time }); this.nextPowerRune += 120; }
        else {
          const p = this.map.powerRunes[Math.floor(this.rng() * 2)];
          const kind = POWER_RUNES[Math.floor(this.rng() * POWER_RUNES.length)];
          this.runes.push({ kind, x: p[0], y: p[1], t: this.time }); this.nextPowerRune += 120;
        }
        this.emit({ type: 'runes' });
      }
      if (t >= this.nextBounty) {
        this.runes = this.runes.filter(r => r.kind !== 'bounty');
        for (const p of this.map.bountyRunes) this.runes.push({ kind: 'bounty', x: p[0], y: p[1], t: this.time });
        this.nextBounty += 180;
      }
    }
    pickupRune(h, r) {
      this.runes.splice(this.runes.indexOf(r), 1);
      const bottle = h.items.find(it => it && it.id === 'bottle'); if (bottle) bottle.charges = 3;
      const R = RUNES[r.kind];
      switch (r.kind) {
        case 'bounty': { const g = 36 + 9 * Math.floor(Math.max(0, this.time) / 300); for (const a of this.heroes) if (a.team === h.team && !a.illusion) this.giveGold(a, a === h ? g : g, false, a === h ? h : null); break; }
        case 'water': this.heal(h, 100); h.mp = Math.min(h.maxMp, h.mp + 80); break;
        case 'dd': this.addStatus(h, { tag: 'rune_dd', t: R.dur, dmgPct: 100, buff: true, rune: 'dd' }); break;
        case 'haste': this.addStatus(h, { tag: 'rune_haste', t: R.dur, msAbs: 550, buff: true, rune: 'haste' }); break;
        case 'invis': this.addStatus(h, { tag: 'rune_invis', t: R.dur, invis: true, fadeAt: this.time + 2, buff: true, rune: 'invis' }); break;
        case 'regen': this.addStatus(h, { tag: 'rune_regen', t: R.dur, regenPct: 6, buff: true, rune: 'regen', breakOnHeroDmg: true }); break;
        case 'arcane': this.addStatus(h, { tag: 'arcane', arcane: true, t: R.dur, buff: true, rune: 'arcane' }); break;
        case 'illusion': this.makeIllusions(h, 2, R.dur, h.def.melee ? 0.35 : 0.35, 3); break;
      }
      this.emit({ type: 'rune', unit: h.id, kind: r.kind }); this.sfx('rune', h.x, h.y);
      if (r.kind !== 'bounty' && r.kind !== 'water') this.msg('runeTaken', { unit: h.id, rune: r.kind });
    }

    glyph(team) {
      if (this.glyphCd[team] > this.time) return false;
      this.glyphCd[team] = this.time + 300;
      for (const s of this.structs) if (s.team === team && !s.dead) s.glyphT = this.time + 5;
      for (const c of this.units) if (c.kind === 'creep' && c.team === team && !c.dead) this.addStatus(c, { tag: 'glyph', t: 5, invuln: true });
      this.msg('glyphUsed', { team }); this.sfx('glyph', 0, 0, { global: true, team });
      return true;
    }
    scan(team, x, y) {
      if (this.scanCd[team] > this.time || this.time < 0) return false;
      this.scanCd[team] = this.time + 210;
      const found = this.heroes.some(h => h.team !== team && !h.dead && Math.hypot(h.x - x, h.y - y) < 900);
      this.scans.push({ team, x, y, r: 900, until: this.time + 8, found, scan: true });
      this.emit({ type: 'scan', team, x, y, found });
      return true;
    }
    buyback(h) {
      if (!h.dead || h.buybackCd > this.time || h.aegisRevive) return false;
      const c = this.buybackCost(h); if (this.goldOf(h) < c) return this.fail(h, 'notEnoughGold');
      this.spendGold(h, c); h.buybackCd = this.time + DD.BUYBACK_CD; this.respawn(h);
      this.emit({ type: 'buyback', unit: h.id }); return true;
    }
    respawn(h) {
      const f = this.map.fountain[h.team], rv = h.aegisRevive;
      h.dead = false; h.status = []; this.recalc(h); h.hp = h.maxHp; h.mp = h.maxMp;
      if (rv) { h.x = h.px = rv.x; h.y = h.py = rv.y; h.aegisRevive = null; this.fx('revive', { x: h.x, y: h.y }); }
      else { const [x, y] = this.map.nearestWalkable(f[0] + (h.team ? -1 : 1) * 250, f[1] - (h.team ? -1 : 1) * 250); h.x = h.px = x; h.y = h.py = y; }
      h.order = null; h.path = null; h.atk = null; h.respawnT = 0; h.dmgFrom = {};
      this.emit({ type: 'respawn', unit: h.id }); this.sfx('respawn', h.x, h.y, { unit: h.id });
    }
    pickupDrop(h, d) {
      if (d.item.id === 'aegis') { if (this.aegisHolder) return false; this.aegisHolder = h; d.item.expires = this.time + 300; this.msg('aegisTaken', { unit: h.id }); this.emit({ type: 'announce', key: 'aegis', unit: h.id }); }
      if (!this.toInventory(h, d.item)) return this.fail(h, 'inventoryFull');
      this.drops.splice(this.drops.indexOf(d), 1); this.recalc(h); this.sfx('pickup', h.x, h.y);
      return true;
    }
    destroyTree(t) {
      if (!t || !t.alive || t.perm) return;
      t.alive = false; t.regrowAt = this.time + 300; this.treeRegrow.push(t);
      this.emit({ type: 'tree', id: t.id, x: t.x, y: t.y });
    }
    regrowTrees() {
      if (!this.treeRegrow.length) return;
      for (let i = this.treeRegrow.length - 1; i >= 0; i--) {
        const t = this.treeRegrow[i]; if (this.time < t.regrowAt) continue;
        if (this.unitsIn(t.x, t.y, 100, u => !u.structure && !this.isWardLike(u)).length) { t.regrowAt = this.time + 5; continue; }
        t.alive = true; this.treeRegrow.splice(i, 1); this.emit({ type: 'treeGrow', id: t.id });
      }
    }

    courierDeliver(h) {
      const c = h.courier; if (!c || c.dead || h.illusion) return false;
      c.state = 'deliver'; c.path = null; return true;
    }
    courierSecret(h) { const c = h.courier; if (!c || c.dead) return; if (c.state === 'idle' || c.state === 'home') { c.state = 'secret'; c.path = null; } else c.wantSecret = true; }
    courierHome(h) { const c = h.courier; if (!c || c.dead) return; for (const it of c.carry) this.toStash(h, it); c.carry = []; c.state = 'home'; c.path = null; }
    tickCourier(c) {
      const h = c.ownerU, f = this.map.fountain[c.team];
      if (c.dead) { if (this.time >= c.respawnT) { c.dead = false; c.hp = c.maxHp; c.x = c.px = f[0]; c.y = c.py = f[1]; c.state = 'idle'; c.removeAt = null; } return; }
      c.flying = this.time >= 180; c.base.ms = c.flying ? 430 : 290; if (c.flying) { c.maxHp = 150; c.base.vision = [500, 500]; }
      this.recalc(c);
      let goal = null;
      const secret = this.map.secret.reduce((a, s) => Math.hypot(s[0] - c.x, s[1] - c.y) < Math.hypot(a[0] - c.x, a[1] - c.y) ? s : a, this.map.secret[c.team]);
      if (c.state === 'secret') {
        goal = secret;
        if (Math.hypot(c.x - secret[0], c.y - secret[1]) < 250) { while (h.secretQueue.length) c.carry.push(h.secretQueue.shift()); c.state = 'deliver'; }
      }
      if (c.state === 'deliver') {
        if (!c.carry.length && h.stash.some(x => x)) {
          goal = f;
          if (Math.hypot(c.x - f[0], c.y - f[1]) < 400) { for (let i = 0; i < 6; i++) if (h.stash[i]) { c.carry.push(h.stash[i]); h.stash[i] = null; } }
        } else if (c.carry.length) {
          if (h.dead) goal = f; else goal = [h.x, h.y];
          if (!h.dead && Math.hypot(c.x - h.x, c.y - h.y) < 180) {
            const left = [];
            for (const it of c.carry) if (!this.toInventory(h, it)) left.push(it);
            c.carry = left; this.recalc(h); this.sfx('deliver', h.x, h.y, { unit: h.id, local: true });
            if (!left.length) { c.state = c.wantSecret || h.secretQueue.length ? 'secret' : 'home'; c.wantSecret = false; }
            else { c.state = 'home'; h.k.invFull = this.time; this.fail(h, 'inventoryFull'); }
          }
        } else { c.state = h.secretQueue.length ? 'secret' : 'home'; }
      }
      if (c.state === 'home') { goal = f; if (Math.hypot(c.x - f[0], c.y - f[1]) < 300) { c.state = 'idle'; for (const it of c.carry) this.toStash(h, it); c.carry = []; } }
      if (c.state === 'idle' && h.secretQueue.length) c.state = 'secret';
      if (!goal) { c.anim.moving = false; return; }
      this.moveToward(c, goal[0], goal[1], 60, c.flying);
    }

    moveToward(u, tx, ty, stopDist = 20, flying = false) {
      const d = Math.hypot(tx - u.x, ty - u.y); if (d <= stopDist) { u.anim.moving = false; return true; }
      if (!flying && !this.map.walkable(u.x, u.y)) { const [nx, ny] = this.map.nearestWalkable(u.x, u.y, 400); u.x = nx; u.y = ny; }
      if (this.isRooted(u) || this.isStunned(u) || u.st.ms <= 0) { u.anim.moving = false; return false; }
      let wx = tx, wy = ty;
      if (!flying) {
        const pathMode = u.kind === 'hero' || u.kind === 'courier' || (u.pathUntil || 0) > this.time;
        if (pathMode) {
          const g = u.pathGoal, moved = !g || Math.hypot(g[0] - tx, g[1] - ty) > Math.max(100, d * 0.15);
          if (!u.path || !u.path.length || moved) {
            u.path = this.map.findPath(u.x, u.y, tx, ty, u.kind === 'hero' || u.kind === 'courier' ? 24000 : 3000) || [[tx, ty]]; u.pathGoal = [tx, ty];
          }
          while (u.path.length > 1 && Math.hypot(u.path[0][0] - u.x, u.path[0][1] - u.y) < 36) u.path.shift();
          wx = u.path[0][0]; wy = u.path[0][1];
          if (u.path.length === 1 && Math.hypot(wx - tx, wy - ty) > 5 && Math.hypot(wx - u.x, wy - u.y) < 36) { u.anim.moving = false; return true; }
        } else u.path = null;
      }
      const ang = Math.atan2(wy - u.y, wx - u.x);
      const turned = this.turnTo(u, ang);
      if (!turned && Math.abs(angDiff(u.face, ang)) > 1.2) { u.anim.moving = false; return false; }
      const step = Math.min(u.st.ms * DT, Math.hypot(wx - u.x, wy - u.y));
      const nx = u.x + Math.cos(ang) * step, ny = u.y + Math.sin(ang) * step;
      let movedOk = true;
      if (flying || this.map.walkable(nx, ny)) { u.x = nx; u.y = ny; }
      else if (this.map.walkable(nx, u.y) && Math.abs(nx - u.x) > step * 0.3) u.x = nx;
      else if (this.map.walkable(u.x, ny) && Math.abs(ny - u.y) > step * 0.3) u.y = ny;
      else movedOk = false;
      if (!movedOk) {
        u.stuckT += DT;
        if (u.stuckT > (u.kind === 'hero' ? 0.3 : 1)) { u.stuckT = 0; u.path = null; u.pathGoal = null; if (u.kind !== 'hero') u.pathUntil = this.time + 3; }
      } else u.stuckT = Math.max(0, u.stuckT - DT);
      u.anim.moving = true; u.anim.walk += step;
      return false;
    }
    turnTo(u, ang) {
      const d = angDiff(u.face, ang), rate = (u.base.turn || 0.6) / 0.03 * DT;
      if (Math.abs(d) <= rate) { u.face = ang; return true; }
      u.face += Math.sign(d) * rate; return Math.abs(d) - rate < 0.2;
    }
    separate() {
      for (const bucket of this.hash) {
        for (let i = 0; i < bucket.length; i++) {
          const a = bucket[i]; if (a.structure || a.dead || this.isWardLike(a) || a.kind === 'courier' && a.flying) continue;
          for (let j = i + 1; j < bucket.length; j++) {
            const b = bucket[j]; if (b.structure || b.dead || this.isWardLike(b) || b.kind === 'courier' && b.flying) continue;
            if (this.has(a, 'phased') || this.has(b, 'phased')) continue;
            const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = (a.r + b.r) * 0.8;
            if (d >= m || d < 0.01) continue;
            const push = (m - d) * 0.25, nx = dx / d, ny = dy / d;
            const wa = a.kind === 'hero' && b.kind !== 'hero' ? 0.2 : 0.5, wb = 1 - wa;
            const ax = a.x - nx * push * wb * 2, ay = a.y - ny * push * wb * 2, bx = b.x + nx * push * wa * 2, by = b.y + ny * push * wa * 2;
            if (!this.isStunned(a) && this.map.walkable(ax, ay)) { a.x = ax; a.y = ay; }
            if (!this.isStunned(b) && this.map.walkable(bx, by)) { b.x = bx; b.y = by; }
          }
        }
      }
    }

    canAttack(u, t) {
      if (!t || t.dead || t === u) return false;
      if (this.isInvuln(t) && !(t.structure && this.structureVulnerable(t) === false && false)) return false;
      if (!this.canSee(u.team, t)) return false;
      if (t.kind === 'courier' && t.team === u.team) return false;
      if (t.team === u.team) return this.canDeny(u, t);
      return true;
    }
    canDeny(u, t) {
      if (u.kind !== 'hero' && u.kind !== 'eidolon') return false;
      if (t.kind === 'creep') return t.hp < t.maxHp * 0.5;
      if (t.kind === 'hero') return !!this.status_denyable(t);
      if (t.kind === 'tower') return t.hp < t.maxHp * 0.1;
      if (t.kind === 'ward') return true;
      return false;
    }
    status_denyable(t) { return t.status.some(s => s.denyable) && t.hp < t.maxHp * 0.25; }
    attackInterval(u) { return u.st.bat / (u.st.as / 100); }
    attackPoint(u) { return u.st.ap / (u.st.as / 100); }
    atkRange(u, t) { return u.st.range + u.r + (t ? t.r : 0) + (u.kind === 'hero' && !u.def.melee && u.hid === 'sniper' ? this.av(u, 2, 'range') * (u.ranks[2] ? 1 : 0) : 0); }
    doAttack(u, t) {
      if (!this.canAttack(u, t)) { u.atk = null; return false; }
      if (this.isDisarmed(u)) { u.atk = null; u.anim.moving = false; return true; }
      const range = this.atkRange(u, t), d = Math.hypot(t.x - u.x, t.y - u.y);
      if (u.atk && u.atk.target === t) {
        this.turnTo(u, Math.atan2(t.y - u.y, t.x - u.x));
        u.atk.t += DT; u.anim.moving = false;
        if (u.atk.t >= u.atk.ap) { this.launchAttack(u, t); u.atk = null; }
        return true;
      }
      if (d > range + (u.atkCd > 0 ? 0 : 0)) {
        if (u.st.ms <= 0) return false;
        this.moveToward(u, t.x, t.y, range * 0.92); return true;
      }
      u.anim.moving = false;
      const turned = this.turnTo(u, Math.atan2(t.y - u.y, t.x - u.x));
      if (turned && u.atkCd <= 0) { u.atk = { target: t, t: 0, ap: this.attackPoint(u) }; u.anim.atkT = this.time; u.atkCd = this.attackInterval(u); if (u.atk.ap <= 0) { this.launchAttack(u, t); u.atk = null; } }
      return true;
    }
    launchAttack(u, t) {
      u.lastAtkT = this.time;
      if (u.kind === 'hero') { u.lastAtkTarget = t; if (this.has(u, 'invis')) { const sh = u.status.find(s => s.shadowHit); u.k.shadowBonus = sh ? sh.shadowHit : 0; this.breakInvis(u); } }
      const uphill = this.map.heightAt(u.x, u.y) < this.map.heightAt(t.x, t.y);
      const trueStrike = u.kind === 'hero' && u.items && u.items.some(it => it && ITEMS[it.id].trueStrike);
      const info = { uphill, trueStrike };
      if (u.base.proj) {
        this.projectiles.push({ kind: 'attack', src: u, target: t, x: u.x, y: u.y, z: 40, speed: u.base.proj, dodge: true, info, hid: u.hid || u.kind, team: u.team, creepType: u.creepType || u.ntype });
        this.sfx(u.kind === 'hero' ? 'shot_' + u.hid : u.kind === 'tower' ? 'tower_shot' : 'shot_small', u.x, u.y);
      } else this.attackLands(u, t, info);
      if (u.kind === 'hero' && t.kind === 'hero' && t.team !== u.team) this.drawAggro(u, t);
    }
    drawAggro(u, victim) {
      for (const c of this.unitsIn(u.x, u.y, 800, x => (x.kind === 'creep' || x.kind === 'tower') && x.team === victim.team)) {
        if (c.kind === 'tower' && Math.hypot(u.x - c.x, u.y - c.y) > TOWER_RANGE + 100) continue;
        if (c.kind === 'creep' && (c.aggroCd || 0) > this.time) continue;
        c.forced = { target: u, until: this.time + (c.kind === 'tower' ? 3 : 2) }; if (c.kind === 'creep') c.aggroCd = this.time + 2.3;
      }
    }
    attackLands(u, t, info = {}) {
      if (t.dead || u.dead && !u.proj) return;
      const isHero = u.kind === 'hero';
      if (!info.trueStrike) {
        if (info.uphill && this.rng() < 0.25) { this.events.push({ type: 'miss', x: t.x, y: t.y, src: u.id }); return; }
        if (t.st.evasion > 0 && this.rng() < t.st.evasion) { this.events.push({ type: 'miss', x: t.x, y: t.y, src: u.id }); return; }
      }
      let dmg = u.st.dmgMin + this.rng() * (u.st.dmgMax - u.st.dmgMin) + (u.st.dmgBonus || 0);
      if (u.kind === 'eidolon') dmg = u.st.dmgMin;
      let crit = 0, bonusMag = 0, bonusPure = 0;
      if (isHero) {
        const kit = D.KITS[u.hid];
        if (kit && kit.onAttack) { const r = kit.onAttack(this, u, t, dmg); if (r) { if (r.crit) crit = Math.max(crit, r.crit); if (r.bonus) dmg += r.bonus; } }
        for (const it of u.items) {
          if (!it) continue; const d = ITEMS[it.id];
          if (d.crit && this.rng() < d.crit[0] / 100) crit = Math.max(crit, d.crit[1]);
          if (d.pierce && this.rng() < d.pierce[0] / 100) bonusMag += d.pierce[1];
          if (d.quell && (t.kind === 'creep' || t.kind === 'neutral')) dmg += u.def.melee ? d.quell : d.quell / 2;
        }
        if (u.k.shadowBonus) { dmg += u.k.shadowBonus; u.k.shadowBonus = 0; }
        if (!t.structure) {
          const bash = u.items.map(it => it && ITEMS[it.id].bash).find(b => b);
          if (bash && (u.bashCd || 0) <= this.time && this.rng() < (u.def.melee ? bash[0] : 10) / 100) { u.bashCd = this.time + 2.3; bonusMag += bash[2]; this.stun(t, bash[1], u); this.sfx('bash', t.x, t.y); }
        }
      }
      if (crit) dmg *= crit / 100;
      const dealt = this.dmg(u, t, dmg, 'phys', { attack: true, crit: !!crit });
      if (bonusMag) this.dmg(u, t, bonusMag, 'mag', { attack: true, quiet: true });
      if (bonusPure) this.dmg(u, t, bonusPure, 'pure', { attack: true, quiet: true });
      if (crit) this.float(t, Math.round(dealt) + '!', '#ff3030', true);
      if (!u.base.proj) this.sfx(u.kind === 'hero' ? 'hit_' + (u.hid || 'melee') : 'hit_small', t.x, t.y);
      else this.sfx('hit_small', t.x, t.y);
      if (isHero) {
        if (u.st.lifesteal && !t.structure && dealt > 0) this.heal(u, dealt * u.st.lifesteal / 100);
        let corrupt = 0; for (const it of u.items) if (it && ITEMS[it.id].corrupt) corrupt = Math.max(corrupt, ITEMS[it.id].corrupt);
        if (corrupt && !t.structure) this.addStatus(t, { tag: 'corrupt', t: 7, armor: -corrupt, debuff: true, unique: true });
        let cleave = 0; for (const it of u.items) if (it && ITEMS[it.id].cleave) cleave = Math.max(cleave, ITEMS[it.id].cleave);
        if (u.hid === 'sven' && u.ranks[1]) cleave += this.av(u, 1, 'cleave');
        if (cleave && u.def.melee && !t.structure && !u.illusion) for (const e of this.unitsIn(t.x, t.y, 360, x => x !== t && x.team !== u.team && !x.structure && !this.isWardLike(x) && x.kind !== 'courier' && !this.isInvuln(x))) this.dmg(u, e, dmg * cleave / 100, 'pure', { quiet: true, cleave: true });
        const ch = u.items.map(it => it && ITEMS[it.id].chain).filter(Boolean).sort((a, b) => b[1] - a[1])[0];
        if (ch && !t.structure && (u.chainCd || 0) <= this.time && this.rng() < ch[0] / 100) { u.chainCd = this.time + 0.2; this.chainLightning(u, t, ch[1], ch[2]); }
        if (u.hid === 'enigma' || true) { const kit = D.KITS[u.hid]; if (kit && kit.afterAttack) kit.afterAttack(this, u, t, dealt); }
      }
      if (u.kind === 'eidolon' && u.onHitSplit) u.onHitSplit(this, u);
      if (t.kind === 'hero' && !t.dead) { const kit = D.KITS[t.hid]; if (kit && kit.onAttacked) kit.onAttacked(this, t, u); }
    }
    chainLightning(src, first, dmg, n) {
      const hit = new Set([first]); let cur = first;
      this.dmg(src, first, dmg, 'mag', { item: 'chain' });
      this.fx('lightning', { x: src.x, y: src.y, x2: first.x, y2: first.y });
      for (let i = 1; i < n; i++) {
        const nx = this.unitsIn(cur.x, cur.y, 650, e => e.team !== src.team && !hit.has(e) && !e.structure && !this.isWardLike(e) && e.kind !== 'courier' && !this.isInvuln(e) && this.canSee(src.team, e))[0];
        if (!nx) break; hit.add(nx); this.fx('lightning', { x: cur.x, y: cur.y, x2: nx.x, y2: nx.y }); this.dmg(src, nx, dmg, 'mag', { item: 'chain' }); cur = nx;
      }
      this.sfx('chain', first.x, first.y);
    }
    projectile(p) { this.projectiles.push(Object.assign({ x: 0, y: 0, z: 50, speed: 900 }, p)); }
    tickProjectiles() {
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.px = p.x; p.py = p.y;
        if (p.target) {
          const t = p.target; if (!p.lost) { p.tx = t.x; p.ty = t.y; }
          const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy), step = p.speed * DT;
          if (d <= step + 10) {
            this.projectiles.splice(i, 1);
            if (p.lost || t.dead) continue;
            if (p.kind === 'attack') this.attackLands(p.src, t, p.info);
            else if (p.onHit) p.onHit(t, p);
            continue;
          }
          p.x += dx / d * step; p.y += dy / d * step; p.ang = Math.atan2(dy, dx);
        } else {
          const step = p.speed * DT; p.x += Math.cos(p.ang) * step; p.y += Math.sin(p.ang) * step; p.travel = (p.travel || 0) + step;
          if (p.onStep) p.onStep(p);
          if (p.dead || p.travel >= p.len) { this.projectiles.splice(i, 1); if (!p.dead && p.onEnd) p.onEnd(p); }
        }
      }
    }

    tickStatus(u) {
      let changed = false;
      for (let i = u.status.length - 1; i >= 0; i--) {
        const s = u.status[i];
        if (s.dps && !u.dead) { const src = s.src ? this.unitById(s.src) : null; this.dmg(src || null, u, s.dps * DT, s.dtype || 'mag', { dot: true, quiet: true, nonLethal: s.nonLethal, pierce: s.pierce }); }
        if (s.regenPct) { u.hp = Math.min(u.maxHp, u.hp + u.maxHp * s.regenPct / 100 * DT); u.mp = Math.min(u.maxMp, u.mp + u.maxMp * s.regenPct / 100 * DT); if (u.hp >= u.maxHp && u.mp >= u.maxMp) s.t = 0; }
        if (s.tick) s.tick(this, u, s);
        s.t -= DT;
        if (s.t <= 0) { u.status.splice(i, 1); changed = true; if (s.onEnd) s.onEnd(this, u, s); }
      }
      return changed;
    }
    regen(u) {
      if (u.dead) return;
      let hpr = u.st.hpr;
      if (u.kind === 'hero') {
        if (u.items.some(it => it && ITEMS[it.id].heart) && this.time - u.lastHeroDmgT > 5) hpr += u.maxHp * 0.016;
      }
      if (hpr) u.hp = Math.min(u.maxHp, u.hp + hpr * DT);
      if (u.maxMp) u.mp = Math.min(u.maxMp, u.mp + u.st.mpr * DT);
      if (u.bdPool > 0 && !this.unitsIn(u.x, u.y, 900, e => e.team !== u.team && (e.kind === 'creep')).length) { const r = Math.min(u.bdPool, 90 * DT); u.hp = Math.min(u.maxHp, u.hp + r); u.bdPool -= r; }
    }
    tickHeroTimers(h) {
      for (let s = 0; s < 6; s++) {
        if (h.cds[s] > 0) h.cds[s] = Math.max(0, h.cds[s] - DT);
        const ab = this.ability(h, s);
        if (ab && ab.charges && h.ranks[s] > 0) {
          const max = ab.charges + (h.hid === 'sniper' && this.hasShard(h) ? 1 : 0);
          if (h.charges[s] < max) { h.chargeT[s] -= DT; if (h.chargeT[s] <= 0) { h.charges[s]++; h.chargeT[s] = h.charges[s] < max ? ab.chargeT : 0; } }
        }
      }
      for (const it of h.items) if (it && it.cd > 0) it.cd = Math.max(0, it.cd - DT);
      for (const it of h.backpack) if (it && it.cd > 0) it.cd = Math.max(0, it.cd - DT);
      if (h.tp.cd > 0) h.tp.cd = Math.max(0, h.tp.cd - DT);
      const ag = h.items.find(it => it && it.id === 'aegis'); if (ag && this.time > ag.expires) { h.items[h.items.indexOf(ag)] = null; this.aegisHolder = null; this.heal(h, h.maxHp); this.emit({ type: 'announce', key: 'aegisExpired' }); }
      if (h.dead) return;
      const f = this.map.fountain[h.team];
      if (Math.hypot(h.x - f[0], h.y - f[1]) < 700) {
        h.hp = Math.min(h.maxHp, h.hp + (h.maxHp * 0.05 + 15) * DT); h.mp = Math.min(h.maxMp, h.mp + (h.maxMp * 0.06 + 10) * DT);
        for (const it of h.items) if (it && it.id === 'bottle' && it.charges < 3 && (h.k.bottleT || 0) <= this.time) { it.charges++; h.k.bottleT = this.time + 0.5; }
      }
      if (this.nearShop(h) && h.stash.some(x => x)) { for (let i = 0; i < 6; i++) if (h.stash[i] && this.toInventory(h, h.stash[i])) h.stash[i] = null; this.recalc(h); }
      if (this.nearSecret(h) && h.secretQueue.length) { while (h.secretQueue.length) { const it = h.secretQueue.shift(); if (!this.toInventory(h, it)) this.toStash(h, it); } this.recalc(h); }
      if (h.tpCh) {
        if (this.isStunned(h) || this.has(h, 'hex')) { h.tpCh = null; this.emit({ type: 'tpCancel', unit: h.id }); }
        else { h.tpCh.t += DT; if (h.tpCh.t >= h.tpCh.dur) { const tp = h.tpCh; h.tpCh = null; this.teleport(h, tp.x, tp.y); this.sfx('tp_end', tp.x, tp.y); this.emit({ type: 'tpDone', unit: h.id }); } }
      }
    }
    auras() {
      for (const u of this.units) if (u.aura) u.aura = null;
      const add = (u, k, v) => { if (!u.aura) u.aura = {}; u.aura[k] = Math.max(u.aura[k] || 0, v); };
      const addNeg = (u, k, v) => { if (!u.aura) u.aura = {}; u.aura[k] = Math.min(u.aura[k] || 0, v); };
      for (const h of this.heroes) {
        if (h.dead) continue;
        if (h.hid === 'crystal_maiden' && h.ranks[2] && !h.illusion) { const v = this.av(h, 2, 'mpr'); for (const a of this.heroes) if (a.team === h.team && !a.dead) add(a, 'mpr', a === h ? v * this.av(h, 2, 'self') : v); }
        for (const it of h.items) {
          if (!it) continue; const d = ITEMS[it.id];
          if (d.aura === 'assault') {
            for (const a of this.unitsIn(h.x, h.y, 900, x => !x.dead && x.kind !== 'courier' && !this.isWardLike(x))) {
              if (a.team === h.team) { add(a, 'armor', 5); add(a, 'as', 30); } else if (a.team !== 2 || true) addNeg(a, 'armor', -5);
            }
          }
          if (d.aura === 'radiance' && !h.illusion && (this.tickN % 15 === 0)) {
            for (const e of this.unitsIn(h.x, h.y, 700, x => x.team !== h.team && !x.structure && !this.isWardLike(x) && x.kind !== 'courier' && !this.isInvuln(x))) this.dmg(h, e, 30, 'mag', { quiet: true, item: 'radiance' });
          }
        }
      }
    }

    tickUnit(u) {
      if (u.kind === 'courier') return this.tickCourier(u);
      if (u.dead) {
        if (u.kind === 'hero' && !u.illusion) { this.tickHeroTimers(u); if (u.respawnT && this.time >= u.respawnT) this.respawn(u); }
        return;
      }
      if (u.expires && this.time >= u.expires) { if (u.kind === 'hero' && u.illusion) { this.kill(u, null); } else { this.kill(u, null); } return; }
      if (u.pushFx) {
        const p = u.pushFx; p.t += DT; const k = Math.min(1, p.t / p.dur);
        const nx = p.sx + (p.ex - p.sx) * k, ny = p.sy + (p.ey - p.sy) * k;
        if (this.map.walkable(nx, ny) || p.free) { u.x = nx; u.y = ny; } else p.t = p.dur;
        u.z = p.arc ? Math.sin(Math.PI * k) * p.arc : 0;
        if (p.t >= p.dur) { u.pushFx = null; u.z = 0; if (!this.map.walkable(u.x, u.y)) { const [x, y] = this.map.nearestWalkable(u.x, u.y); u.x = x; u.y = y; } if (p.onEnd) p.onEnd(); }
        return;
      }
      if (u.atkCd > 0) u.atkCd -= DT;
      if (u.kind === 'hero') this.tickHeroTimers(u);
      if (u.structure) return this.tickStructure(u);
      if (this.isWardLike(u)) { if (u.tick) u.tick(this, u); return; }
      if (this.isStunned(u)) { u.anim.moving = false; if (u.channel && !u.channel.bhSelf) this.stopChannel(u, true); return; }
      if (u.channel) { const c = u.channel; c.t += DT; if (c.tick) c.tick(DT, c); if (u.channel === c && c.t >= c.dur) this.stopChannel(u, false); if (!c.move) { u.anim.moving = false; return; } }
      if (u.tpCh) { u.anim.moving = false; return; }
      if (u.status.some(s => s.busy)) { u.anim.moving = false; return; }
      const taunt = u.status.find(s => s.taunt);
      if (taunt) { const src = this.unitById(taunt.src); if (src && !src.dead) { if (!this.doAttack(u, src)) this.moveToward(u, src.x, src.y, 100); return; } }
      if (u.kind === 'hero') return this.tickHero(u);
      if (u.kind === 'creep') return this.tickCreep(u);
      if (u.kind === 'neutral' || u.kind === 'roshan') return this.tickNeutral(u);
      if (u.kind === 'eidolon' || u.kind === 'summon') return this.tickSummon(u);
    }
    tickHero(h) {
      if (h.illusion && !h.order) { const own = h.ownerU; const t = own && own.order && own.order.type === 'attack' ? own.order.target : this.acquire(h, 800); if (t) h.order = { type: 'attack', target: t }; else if (own && !own.dead && dist(own, h) > 400) { this.moveToward(h, own.x, own.y, 200); return; } }
      const o = h.order;
      if (h.cast) {
        const c = h.cast; c.t += DT; h.anim.moving = false;
        if (c.face != null) this.turnTo(h, c.face);
        if (c.t >= c.cp) { h.cast = null; if (this.checkCast(h, c.slot, c.o)) this.doCast(h, c.slot, c.o); h.order = h.order === c.order ? (c.o.target && c.o.target.team !== h.team && this.ability(h, c.slot).tgt === 'unit' && !h.channel ? { type: 'attack', target: c.o.target } : null) : h.order; }
        return;
      }
      if (!o) { this.idleAttack(h); return; }
      switch (o.type) {
        case 'move': { if (this.moveToward(h, o.x, o.y, 16)) h.order = null; break; }
        case 'attack': { if (!this.doAttack(h, o.target)) h.order = null; break; }
        case 'amove': { const t = h.atk ? h.atk.target : this.acquire(h, 800); if (t && this.doAttack(h, t)) break; if (this.moveToward(h, o.x, o.y, 30)) h.order = null; break; }
        case 'hold': { const t = this.acquire(h, 0, true); if (t) this.doAttack(h, t); else h.anim.moving = false; break; }
        case 'follow': { if (!o.target || o.target.dead) { h.order = null; break; } this.moveToward(h, o.target.x, o.target.y, 150); break; }
        case 'pickup': {
          const r = o.rune, d = o.drop;
          const tx = r ? r.x : d ? d.x : h.x, ty = r ? r.y : d ? d.y : h.y;
          if ((r && !this.runes.includes(r)) || (d && !this.drops.includes(d))) { h.order = null; break; }
          if (Math.hypot(tx - h.x, ty - h.y) < 150) { if (r) this.pickupRune(h, r); else this.pickupDrop(h, d); h.order = null; } else this.moveToward(h, tx, ty, 100);
          break;
        }
        case 'cast': {
          const ab = this.ability(h, o.slot);
          if (!this.checkCast(h, o.slot, o)) { h.order = null; break; }
          const range = this.abRange(h, o.slot);
          const tx = o.target && ab.tgt !== 'point' ? o.target.x : o.x, ty = o.target && ab.tgt !== 'point' ? o.target.y : o.y;
          if (ab.tgt === 'point' && o.target && ab.tgt === 'point') {  }
          const d = tx == null ? 0 : Math.hypot(tx - h.x, ty - h.y);
          if (range && d > range + (o.target ? o.target.r : 0) + 10) { if (this.isRooted(h)) { h.order = null; break; } if (this.moveToward(h, tx, ty, range * 0.95)) { h.order = null; this.fail(h, 'outOfRange'); } break; }
          const face = tx != null && d > 1 ? Math.atan2(ty - h.y, tx - h.x) : h.face;
          if (tx != null && d > 1 && range && !this.turnTo(h, face)) { h.anim.moving = false; break; }
          h.anim.moving = false;
          h.cast = { slot: o.slot, o, t: 0, cp: ab.cp || 0, face, order: o }; h.anim.castT = this.time;
          { const kit = D.KITS[h.hid]; if (kit.onCastStart && ab.cp) kit.onCastStart(this, h, o.slot, o); }
          if (!ab.cp) { h.cast = null; this.doCast(h, o.slot, o); if (h.order === o) h.order = null; }
          break;
        }
        case 'item': {
          const it = this.itemIn(h, o.slot); if (!it) { h.order = null; break; }
          const d = ITEMS[it.id], range = o.range || d.range || 0;
          const tx = o.tree ? o.tree.x : o.target ? o.target.x : o.x, ty = o.tree ? o.tree.y : o.target ? o.target.y : o.y;
          if (tx != null && range && Math.hypot(tx - h.x, ty - h.y) > range + 20) { if (this.moveToward(h, tx, ty, range * 0.85)) { h.order = null; this.fail(h, 'outOfRange'); } break; }
          h.order = null; const oo = Object.assign({}, o); delete oo.range; oo.instant = true; this.useItem(h, o.slot, oo); break;
        }
        case 'tree': {
          if (Math.hypot(o.tree.x - h.x, o.tree.y - h.y) > 250) { this.moveToward(h, o.tree.x, o.tree.y, 200); break; }
          h.order = null; break;
        }
      }
    }
    idleAttack(h) {
      h.anim.moving = false;
      if (h.bot || this.isInvisible(h) || this.has(h, 'invis')) return;
      if (h.k.noAutoAttack) return;
      const t = this.acquire(h, 0, true);
      if (t) { h.order = { type: 'attack', target: t, auto: true }; }
    }
    acquire(u, extra = 0, inRange = false) {
      const r = u.st.range + (extra || 0) + 80;
      let best = null, bs = 1e9;
      for (const e of this.unitsIn(u.x, u.y, r + 60, x => x.team !== u.team && this.canAttack(u, x) && !this.isWardLike(x) && x.kind !== 'courier' && x.kind !== 'fountain')) {
        if (e.team === 2 && !(e.aggroTeam === u.team)) { if (u.kind !== 'hero' || inRange) continue; }
        const d = Math.hypot(e.x - u.x, e.y - u.y) - e.r;
        if (inRange && d > this.atkRange(u, e) + 20) continue;
        const sc = d + (e.kind === 'hero' ? 150 : 0) + (e.structure ? 300 : 0);
        if (sc < bs) { bs = sc; best = e; }
      }
      return best;
    }
    tickCreep(c) {
      if (c.forced && (this.time > c.forced.until || c.forced.target.dead || !this.canAttack(c, c.forced.target))) c.forced = null;
      let t = c.forced ? c.forced.target : null;
      if (!t && c.target && this.canAttack(c, c.target) && c.target.team !== c.team && dist(c, c.target) < 900) t = c.target;
      if (!t || !(c.retargetT > this.time)) {
        c.retargetT = this.time + 0.5;
        let best = null, bs = 1e9;
        for (const e of this.unitsIn(c.x, c.y, 550, x => x.team !== c.team && x.team !== 2 && this.canAttack(c, x) && !this.isWardLike(x) && x.kind !== 'courier')) {
          const d = Math.hypot(e.x - c.x, e.y - c.y);
          const pri = e.kind === 'creep' || e.kind === 'eidolon' ? 0 : e.kind === 'hero' ? 300 : e.structure ? 150 : 100;
          if (d + pri < bs) { bs = d + pri; best = e; }
        }
        if (!c.forced) t = best || t;
        c.target = t;
      }
      if (t && this.doAttack(c, t)) return;
      const wp = c.pts[c.wp];
      if (!wp) {
        if (!c.obj || c.obj.dead || !(c.objT > this.time)) {
          c.objT = this.time + 1.5; let best = null, bs = 1e9;
          for (const s of this.structs) { if (s.team === c.team || s.dead || s.kind === 'fountain') continue; const sc = Math.hypot(s.x - c.x, s.y - c.y) + (this.isInvuln(s) ? 4000 : 0); if (sc < bs) { bs = sc; best = s; } }
          c.obj = best;
        }
        const o = c.obj; if (!o) return;
        if (this.canAttack(c, o)) this.doAttack(c, o); else this.moveToward(c, o.x, o.y, o.r + 140);
        return;
      }
      if (this.moveToward(c, wp[0], wp[1], 80)) c.wp++;
      else if (Math.hypot(wp[0] - c.x, wp[1] - c.y) < 200) c.wp++;
    }
    tickNeutral(n) {
      const home = n.home;
      const leash = n.kind === 'roshan' ? 700 : 900;
      if (n.kind === 'roshan') {
        n.slamCd -= DT;
        if (!n.aggro) { const t = this.unitsIn(home[0], home[1], 420, x => x.team !== 2 && (x.kind === 'hero' || x.kind === 'eidolon') && !this.isInvuln(x) && !x.dead)[0]; if (t) { n.aggro = t; n.aggroT = this.time; } }
        if (n.aggro && n.slamCd <= 0 && dist(n, n.aggro) < 300) { n.slamCd = 13; for (const e of this.unitsIn(n.x, n.y, 350, x => x.team !== 2 && !x.structure && !this.isWardLike(x))) { this.dmg(n, e, 70 + Math.max(0, this.time / 60) * 4, 'mag'); this.addStatus(e, { tag: 'slam', t: 2, slow: 50, debuff: true }); } this.fx('ring', { x: n.x, y: n.y, r: 350, color: '#c08040' }); this.sfx('slam', n.x, n.y); }
      }
      if (n.stomp) { n.stompCd -= DT; if (n.aggro && n.stompCd <= 0 && dist(n, n.aggro) < 220) { n.stompCd = 12; for (const e of this.unitsIn(n.x, n.y, 250, x => x.team !== 2 && !x.structure && !this.isWardLike(x))) { this.stun(e, 1, n); this.dmg(n, e, 50, 'mag'); } this.fx('ring', { x: n.x, y: n.y, r: 250, color: '#c0a060' }); this.sfx('slam', n.x, n.y); } }
      const t = n.aggro;
      if (t && (t.dead || Math.hypot(t.x - home[0], t.y - home[1]) > leash || !this.canAttack(n, t) || this.time - Math.max(n.aggroT || 0, n.lastDmgT) > 5)) { n.aggro = null; n.returning = true; }
      if (n.aggro && this.doAttack(n, n.aggro)) return;
      if (Math.hypot(n.x - home[0], n.y - home[1]) > 40) { this.moveToward(n, home[0], home[1], 30); if (n.returning) n.hp = Math.min(n.maxHp, n.hp + n.maxHp * 0.1 * DT); }
      else { n.returning = false; n.anim.moving = false; }
    }
    neutralAggro(n, src) {
      if (!src || src.team === 2) return;
      const pack = n.camp ? n.camp.units : [n];
      for (const m of pack) if (!m.dead && (!m.aggro || m.aggro.dead)) { m.aggro = src.kind === 'courier' ? null : src; m.aggroT = this.time; }
    }
    tickSummon(s) {
      if (s.tick) s.tick(this, s);
      if (s.channel) return;
      const own = s.ownerU;
      const o = s.order;
      if (o && o.type === 'attack' && this.doAttack(s, o.target)) return;
      if (o && o.type === 'move') { if (this.moveToward(s, o.x, o.y, 30)) s.order = null; return; }
      if (o && o.type === 'amove') { const t = this.acquire(s, 600); if (t && this.doAttack(s, t)) return; if (this.moveToward(s, o.x, o.y, 60)) s.order = null; return; }
      const t = this.acquire(s, 500);
      if (t && (!own || own.dead || dist(t, own) < 1200)) { this.doAttack(s, t); return; }
      if (own && !own.dead && dist(s, own) > 300) this.moveToward(s, own.x, own.y, 200); else s.anim.moving = false;
    }
    tickStructure(s) {
      if (s.kind === 'tower' || s.kind === 'fountain') {
        const range = s.base.range + s.r;
        let t = null;
        if (s.forced && s.forced.until > this.time && !s.forced.target.dead && Math.hypot(s.forced.target.x - s.x, s.forced.target.y - s.y) <= range + s.forced.target.r && this.canAttack(s, s.forced.target)) t = s.forced.target;
        if (!t && s.target && !s.target.dead && s.target.team !== s.team && this.canAttack(s, s.target) && Math.hypot(s.target.x - s.x, s.target.y - s.y) <= range + s.target.r) t = s.target;
        if (!t) {
          let best = null, bs = 1e9;
          for (const e of this.unitsIn(s.x, s.y, range + 40, x => x.team !== s.team && x.team !== 2 && this.canAttack(s, x) && x.kind !== 'courier' && !this.isWardLike(x))) {
            const d = Math.hypot(e.x - s.x, e.y - s.y) + (e.kind === 'hero' ? 400 : 0);
            if (d < bs) { bs = d; best = e; }
          }
          t = best; s.target = t;
        }
        if (s.kind === 'fountain' && !t) { const c = this.unitsIn(s.x, s.y, range, x => x.team !== s.team && x.kind === 'courier' && !x.dead)[0]; if (c) t = c; }
        if (t) {
          if (s.atk) { s.atk.t += DT; if (s.atk.t >= s.atk.ap) { this.launchAttack(s, s.atk.target); s.atk = null; } }
          else if (s.atkCd <= 0) { s.atk = { target: t, t: 0, ap: s.base.ap }; s.atkCd = this.attackInterval(s); s.anim.atkT = this.time; }
        } else s.atk = null;
      }
      this.regen(s);
    }

    updateVision() {
      const night = this.isNight();
      for (let t = 0; t < 2; t++) this.vis[t].fill(0);
      for (const u of this.units) {
        if (u.dead || u.team > 1) continue;
        const v = u.base.vision; const r = night ? v[1] : v[0];
        if (!r) continue;
        this.map.castVision(this.vis[u.team], u.x, u.y, r, u.kind === 'courier' && u.flying || u.flyVision);
      }
      for (const s of this.scans) if (s.until > this.time && s.trueSight) this.map.castVision(this.vis[s.team], s.x, s.y, s.r, true);
      for (const a of this.areas) if (a.vision && a.team < 2 && (!a.start || this.time >= a.start)) this.map.castVision(this.vis[a.team], a.x, a.y, a.vision, true);
      this.scans = this.scans.filter(s => s.until > this.time);
      const ts = [[], []];
      for (const u of this.units) {
        if (u.dead || u.team > 1) continue;
        if (u.kind === 'ward' && u.wardType === 'sentry') ts[u.team].push([u.x, u.y, 900]);
        if (u.kind === 'fountain') ts[u.team].push([u.x, u.y, 1200]);
        if (u.kind === 'hero' && !u.illusion && u.items.some(it => it && it.id === 'gem')) ts[u.team].push([u.x, u.y, 900]);
      }
      for (const s of this.scans) if (s.trueSight) ts[s.team].push([s.x, s.y, s.r]);
      this.trueSight = ts;
      for (const u of this.units) {
        if (u.dead) continue;
        if (u.structure) { u.vis[0] = u.vis[1] = true; continue; }
        const si = clamp(Math.floor(u.y / SLOT), 0, SN - 1) * SN + clamp(Math.floor(u.x / SLOT), 0, SN - 1);
        for (let t = 0; t < 2; t++) {
          if (u.team === t) { u.vis[t] = true; continue; }
          let seen = this.vis[t][si] === 1 || u.status.some(s => s.reveal);
          if (seen && this.isInvisible(u)) {
            seen = ts[t].some(p => Math.hypot(p[0] - u.x, p[1] - u.y) <= p[2]) || u.status.some(s => s.reveal);
          }
          u.vis[t] = seen;
        }
      }
    }
    slotVisible(team, x, y) { const si = clamp(Math.floor(y / SLOT), 0, SN - 1) * SN + clamp(Math.floor(x / SLOT), 0, SN - 1); return this.vis[team][si] === 1; }

    tick() {
      if (this.winner >= 0) { this.time += DT; this.tickN++; return; }
      const prevT = this.time;
      this.time += DT; this.tickN++;
      for (const u of this.units) { u.px = u.x; u.py = u.y; }
      if (this.timers.length) { const due = this.timers.filter(t => t.at <= this.time); this.timers = this.timers.filter(t => t.at > this.time); for (const t of due) t.fn(); }
      if (prevT < 0 && this.time >= 0) { this.emit({ type: 'announce', key: 'horn' }); this.sfx('horn', 0, 0, { global: true }); this.nextWave = 0; }
      if (this.time >= 0 && this.time >= this.nextWave) { this.spawnWaves(); this.nextWave += 30; }
      if (this.time >= 0) this.spawnRunes();
      if (this.time >= 0) for (const h of this.heroes) if (!h.illusion) h.ugold += DD.GOLD_PER_SEC * DT * (this.diff === 3 && h.bot ? 1.25 : 1);
      if (this.time >= 60) for (const c of this.camps) if (this.time >= c.nextCheck) {
        c.nextCheck = Math.floor(this.time / 60) * 60 + 60;
        if (!c.units.some(u => !u.dead) && !this.unitsIn(c.def.p[0], c.def.p[1], 380, u => u.team !== 2 && !u.structure && u.kind !== 'courier').length) { c.units = []; this.spawnCamp(c); }
      }
      if (this.time >= 0 && !this.roshan && this.time >= this.roshanAt) this.spawnRoshan();
      for (const id in this.stock) { const it = ITEMS[id]; const [, max, per] = it.stock; for (let t = 0; t < 2; t++) { if (this.stock[id][t] < max) { this.stockT[id][t] += DT; if (this.stockT[id][t] >= per) { this.stockT[id][t] = 0; this.stock[id][t]++; } } else this.stockT[id][t] = 0; } }
      this.rehash();
      this.auras();
      for (const u of this.units) { if (!u.dead) { this.tickStatus(u); this.recalc(u); this.regen(u); } }
      if (D.AI && this.tickN % 3 === 0) D.AI.think(this);
      for (const u of this.units) this.tickUnit(u);
      this.tickProjectiles();
      this.tickAreas();
      this.separate();
      if (this.tickN % 3 === 0) this.updateVision();
      if (this.tickN % 30 === 0) this.regrowTrees();
      if (this.tickN % 15 === 0) {
        this.units = this.units.filter(u => !(u.dead && u.removeAt != null && this.time >= u.removeAt && u.kind !== 'hero' && u.kind !== 'courier' || u.dead && u.illusion && u.removeAt != null && this.time >= u.removeAt));
        for (const c of this.camps) c.units = c.units.filter(u => !u.dead);
      }
      if (this.tickN % 300 === 0) this.recordNw();
    }
    tickAreas() {
      for (let i = this.areas.length - 1; i >= 0; i--) {
        const a = this.areas[i];
        if (a.tick) a.tick(this, a);
        if (this.time >= a.until) { this.areas.splice(i, 1); if (a.onEnd) a.onEnd(a); }
      }
    }
    recordNw() {
      const nw = [0, 0]; for (const h of this.heroes) if (!h.illusion) nw[h.team] += this.netWorth(h);
      this.nwHistory.push({ t: this.time, d: nw[0] - nw[1], r: nw[0], dd: nw[1] });
    }

    chat(h, text) {
      text = String(text).trim(); if (!text) return;
      if (text[0] === '-' && this.cheats && h) {
        const [cmd, arg] = text.slice(1).split(/\s+/); const n = parseInt(arg, 10);
        switch (cmd) {
          case 'gold': this.giveGold(h, isNaN(n) ? 5000 : n, true); break;
          case 'lvlup': { const k = isNaN(n) ? 1 : n; for (let i = 0; i < k && h.level < MAX_LEVEL; i++) this.giveXp(h, XP_TABLE[h.level] - h.xp); break; }
          case 'refresh': h.cds = h.cds.map(() => 0); for (const it of h.items) if (it) it.cd = 0; h.tp.cd = 0; h.hp = h.maxHp; h.mp = h.maxMp; break;
          case 'wtf': this.wtf = true; break;
          case 'unwtf': this.wtf = false; break;
          case 'respawn': if (h.dead) this.respawn(h); break;
          case 'startgame': if (this.time < 0) this.time = -0.05; break;
          case 'kill': if (!h.dead) this.kill(h, null); break;
          case 'win': this.winner = h.team; this.emit({ type: 'victory', team: h.team }); break;
          default: return;
        }
        this.emit({ type: 'chat', from: 'Cheat', text, team: h.team, sys: true });
        return;
      }
      this.emit({ type: 'chat', from: h ? h.name : '?', hero: h && h.hid, text, team: h ? h.team : 0 });
    }
  }
  const _tick = Game.prototype.tick;
  Game.prototype.tick = function () {
    _tick.call(this);
    if (this.wtf) for (const h of this.heroes) { h.mp = h.maxMp; h.cds = h.cds.map(() => 0); for (const it of h.items) if (it) it.cd = 0; }
  };

  D.Game = Game; D.RNG = RNG; D.autoTeams = autoTeams; D.assignRoles = assignRoles; D.laneFor = laneFor; D.dist = dist; D.clamp = clamp; D.angDiff = angDiff; D.armorMul = armorMul; D.LANES = LANES;
  D.KITS = D.KITS || {};
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Dota98 = globalThis.Dota98 || {});
