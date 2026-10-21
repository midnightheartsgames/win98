(function (K) {
  'use strict';
  const { clamp, lerp, wrapA, angTo, rng, fmtTime, gold } = K;
  const D = K.DATA, IT = D.ITEMS, B = K.Body;
  const DT = 1 / 60;
  const LIMB_MAX = { head: 30, torso: 100, armL: 34, armR: 34, legL: 40, legR: 40 };
  const ARMOR_SLOT = { head: 'head', torso: 'torso', armL: 'arms', armR: 'arms', legL: 'legs', legR: 'legs' };
  const SIDE_OF = { armL: 'L', armR: 'R', legL: 'L', legR: 'R' };
  const REP_HOSTILE = -30;

  function itemName(id) { return IT[id] ? IT[id].name : id; }

  class Game {
    constructor(opts = {}) {
      this.opts = opts;
      this.seed = opts.seed == null ? 1998 : opts.seed;
      this.R = rng(this.seed * 13 + 7);
      this.world = opts.world || new K.World(this.seed);
      this.actors = []; this.byId = new Map(); this.nextId = 1;
      this.pieces = []; this.projectiles = []; this.stuck = []; this.drops = []; this.decals = []; this.events = []; this.log = [];
      this.wagons = []; this.squads = []; this.time = 8 * 60; this.tick = 0;
      this.pf = opts.faction || 'elf';
      this.rep = { emp: -60, elf: -60, evil: -60, folk: 10 };
      this.rep[this.pf] = 40;
      if (this.pf === 'emp') this.rep.folk = 25;
      if (this.pf === 'evil') this.rep.folk = -5;
      this.pools = { emp: 60, elf: 50, evil: 45 };
      this.stats = { kills: 0, robbed: 0, limbsLost: 0, limbsCut: 0, eyes: 0, pros: 0, deaths: 0, gold: 0, raidsRepelled: 0, houses: 0 };
      this.flags = {}; this.haggle = {}; this.shopMood = {};
      this.reprimands = 0; this.wageDay = -1;
      this.input = { fwd: 0, strafe: 0, yaw: 0, pitch: 0 };
      this.cell = new Map();
      if (opts.save) { this.restore(opts.save); return; }
      this.makePlayer(opts.name);
      K.AI.populate(this);
      if (K.Quests) K.Quests.init(this);
      this.updateCells();
    }

    msg(text, color) { this.log.push({ text, color: color || '#e8e0c8', t: this.time }); if (this.log.length > 60) this.log.shift(); this.emit('msg', { text, color }); }
    emit(type, data) { this.events.push(Object.assign({ type }, data || {})); if (this.events.length > 400) this.events.splice(0, 100); if (K.Quests && this.quest) K.Quests.on(this, type, data || {}); }
    clock() { return fmtTime(this.time); }
    isNight() { const h = (this.time / 60) % 24; return h < 5.5 || h > 21; }
    daylight() { const h = (this.time / 60) % 24; return clamp(Math.sin((h - 5.5) / 16 * Math.PI) * 1.4, 0, 1); }

    makePlayer(name) {
      const st = D.STARTS[this.pf];
      const kind = this.pf === 'elf' ? 'warden' : this.pf === 'emp' ? 'guard' : 'villain';
      const sp = this.startSpot();
      const p = this.spawn(kind, sp.x, sp.z, { player: true, noGear: true, name: name || (this.pf === 'evil' ? 'Злой' : 'Безымянный') });
      p.title = st.title;
      p.inv = st.inv.map(([id, n]) => ({ id, n }));
      p.equip = Object.assign({ main: null, off: null, ranged: null, head: null, torso: null, arms: null, legs: null }, st.equip);
      for (const k in p.equip) if (p.equip[k] && !this.has(p, p.equip[k])) this.give(p, p.equip[k], 1, true);
      p.gold = st.gold; p.skills = Object.assign({}, st.skills); p.skillXp = {};
      p.pros = Object.assign({}, st.pros || {});
      p.fac = this.pf; p.maxHp = 100; p.hp = 100;
      p.yaw = sp.yaw || 0;
      this.player = p;
      this.input.yaw = p.yaw;
      if (this.pf === 'evil') { p.colors.shirt = 0x1a1820; p.colors.pants = 0x101014; p.colors.cloak = 0x3a1010; p.beard = true; p.colors.hair = 0x2a2a2a; this.flags.unnamed = !name || name === 'Злой'; }
      return p;
    }
    startSpot() {
      const s = this.world.spots;
      if (this.pf === 'elf') return { x: s.elder.x, z: s.elder.z + 2.3, yaw: 0 };
      if (this.pf === 'emp') return { x: s.commander.x, z: s.commander.z + 2.3, yaw: 0 };
      return { x: s.wartable.x - 1.7, z: s.wartable.z, yaw: Math.PI / 2 };
    }

    spawn(kind, x, z, opts = {}) {
      const T = D.KINDS[kind], R = this.R;
      const a = {
        id: this.nextId++, kind, fac: opts.fac || T.fac, name: opts.name || T.name || (T.names ? R.pick(D.NAMES[T.names]) : T.title), title: T.title, role: opts.role || T.role,
        x, y: 0, z, vx: 0, vy: 0, vz: 0, yaw: opts.yaw || R() * 6.28, onGround: true,
        hp: T.hp, maxHp: T.hp, dead: false, player: !!opts.player,
        limbs: {}, eyes: { L: 'ok', R: 'ok' }, pros: Object.assign({}, T.pros || {}), chair: false,
        bleed: 0, stumps: [], stamina: 100, inv: [], gold: T.gold ? R.int(T.gold[0], T.gold[1]) : 0,
        equip: { main: null, off: null, ranged: null, head: null, torso: null, arms: null, legs: null }, drawn: false, slot: 'melee', torch: false,
        skills: { melee: T.skill || 20, archery: T.skill || 20, block: (T.skill || 20) * 0.8, athletics: 30, trade: 20, stealth: 20 },
        atk: null, cd: 0, block: 0, draw: 0, reload: 0, loaded: true, action: null,
        anim: { phase: R() * 6, speed: 0 }, hostile: new Set(), tags: new Set(opts.tags || []), aware: new Map(),
        home: opts.home || null, quad: !!T.body && T.body !== 'human', kindBody: T.body || 'human',
        scale: T.elf ? 1.04 : T.female ? 0.95 : 1, female: !!T.female, elf: !!T.elf, beard: !!T.beard || (!T.female && !T.elf && R() < 0.35), crown: !!T.crown,
        colors: { skin: T.elf ? R.pick(D.ELF_SKIN) : R.pick(D.SKIN), hair: T.hair != null ? T.hair : T.elf ? R.pick(D.ELF_HAIR) : R.pick(D.HAIR), shirt: T.shirt ? R.pick(T.shirt) : 0x8a6a4a, pants: T.pants ? R.pick(T.pants) : 0x3a2a1a, cloak: T.cloak || null },
        disguised: !!T.disguised, shop: T.shop || null, ai: { state: 'idle', t: 0 }, ammoMax: T.ammo || 0, deadT: 0
      };
      for (const p in LIMB_MAX) a.limbs[p] = { hp: LIMB_MAX[p] * (T.hp / 100), max: LIMB_MAX[p] * (T.hp / 100), state: 'ok', cut: null };
      if (a.quad) { a.scale = kind === 'cow' ? 0.95 + R() * 0.15 : 0.9 + R() * 0.2; a.colors.shirt = kind === 'cow' ? R.pick([0xf0ece0, 0x8a5a3a, 0x3a2a20, 0xd8c8b0]) : R.pick([0x6a6a6a, 0x5a4a3a, 0x8a8070]); a.colors.pants = kind === 'cow' ? R.pick([0x2a2a2a, 0xffffff, 0x8a5a3a]) : 0x3a3a3a; }
      if (!opts.noGear && T.gear) {
        for (const slot in T.gear) {
          const id = R.pick(T.gear[slot]); if (!id) continue;
          if (slot === 'off' && a.equip.main && IT[a.equip.main].hand === 2) continue;
          this.give(a, id, 1, true); a.equip[slot] = id;
        }
        if (a.equip.ranged) this.give(a, 'arrows', a.ammoMax || 15, true);
      }
      if (!opts.noGear && T.prosChance && R() < T.prosChance) {
        const pick = R.pick(['legL', 'legR', 'armL', 'eyeL', 'eyeR', 'legR']);
        if (pick === 'eyeL' || pick === 'eyeR') { a.eyes[pick[3]] = 'lost'; a.pros[pick] = 'glasseye'; }
        else { a.limbs[pick].state = 'lost'; a.limbs[pick].cut = R() < 0.5 ? 'lower' : 'upper'; a.pros[pick] = pick.startsWith('leg') ? (R() < 0.8 ? 'pegleg' : 'ironleg') : (R() < 0.7 ? 'hook' : 'woodarm'); if (pick === 'armL') { a.equip.off = null; } }
      }
      for (const k of ['armL', 'armR', 'legL', 'legR']) if (a.pros[k] && a.limbs[k].state !== 'lost') { a.limbs[k].state = 'lost'; a.limbs[k].cut = 'lower'; }
      for (const k of ['eyeL', 'eyeR']) if (a.pros[k]) a.eyes[k[3]] = 'lost';
      if (!opts.noGear && T.role !== 'service' && T.role !== 'civ' && R() < 0.5) this.give(a, 'bandage', 1, true);
      if (!opts.noGear && R() < 0.15) this.give(a, R.pick(['bread', 'cheese', 'ring', 'herbs']), 1, true);
      a.y = this.world.groundAt(x, z) ;
      if (opts.y != null) a.y = opts.y;
      this.actors.push(a); this.byId.set(a.id, a);
      if (!opts.player && opts.role) a.role = opts.role;
      Object.assign(a.ai, opts.ai || {});
      return a;
    }
    remove(a) { const i = this.actors.indexOf(a); if (i >= 0) this.actors.splice(i, 1); this.byId.delete(a.id); a.removed = true; }

    has(a, id, n) { const s = a.inv.find(i => i.id === id); return s ? (n ? s.n >= n : s.n) : 0; }
    count(a, id) { const s = a.inv.find(i => i.id === id); return s ? s.n : 0; }
    give(a, id, n, quiet) {
      if (!IT[id]) return;
      n = n || 1;
      const s = a.inv.find(i => i.id === id);
      if (s) s.n += n; else a.inv.push({ id, n });
      if (!quiet && a.player) this.msg('Получено: ' + itemName(id) + (n > 1 ? ' ×' + n : ''), '#c8e0a0');
    }
    take(a, id, n) {
      n = n || 1;
      const s = a.inv.find(i => i.id === id); if (!s || s.n < n) return false;
      s.n -= n;
      if (s.n <= 0) { a.inv.splice(a.inv.indexOf(s), 1); for (const k in a.equip) if (a.equip[k] === id) a.equip[k] = null; if (a.torch && id === 'torch') a.torch = false; }
      return true;
    }
    addGold(a, n) { a.gold += n; if (a.player && n > 0) this.stats.gold += n; }

    armUse(a, side) {
      const p = 'arm' + side, l = a.limbs[p];
      if (l.state === 'ok') return 'full';
      if (l.state === 'broken') return 'broken';
      const pr = a.pros[p];
      if (pr === 'ironarm') return 'full';
      if (pr === 'woodarm') return 'weak';
      if (pr === 'hook') return 'hook';
      return 'none';
    }
    legUse(a, side) {
      const l = a.limbs['leg' + side];
      if (l.state === 'ok') return 1;
      if (l.state === 'broken') return 0.55;
      const pr = a.pros['leg' + side];
      if (pr === 'ironleg') return 0.96;
      if (pr === 'pegleg') return 0.62;
      return 0;
    }
    sees(a, side) { if (a.eyes[side] === 'ok') return true; return a.pros['eye' + side] === 'crystaleye'; }
    blind(a) { return !this.sees(a, 'L') && !this.sees(a, 'R'); }
    mobility(a) {
      if (a.quad) return { mode: 'walk', walk: 1.6, run: a.kind === 'wolf' ? 8.5 : 3.2, sprint: a.kind === 'wolf' ? 9.5 : 4.5, jump: a.kind === 'wolf' ? 5 : 0, sprintOK: true, peg: null };
      const l = this.legUse(a, 'L'), r = this.legUse(a, 'R');
      if (a.chair) return { mode: 'chair', walk: 1.6, run: 3.6, sprint: 3.6, jump: 0, sprintOK: false, peg: null };
      if (l === 0 || r === 0) return { mode: 'crawl', walk: 0.6, run: 0.9, sprint: 0.9, jump: 0, sprintOK: false, peg: null };
      const m = Math.min(l, r);
      const peg = a.pros.legL === 'pegleg' ? 'L' : a.pros.legR === 'pegleg' ? 'R' : a.limbs.legL.state === 'broken' ? 'L' : a.limbs.legR.state === 'broken' ? 'R' : null;
      const ath = (1 + (a.skills.athletics - 30) / 400) * (a.hp < a.maxHp * 0.35 ? 0.78 : 1);
      return { mode: 'walk', walk: 1.8, run: (m >= 0.9 ? 5.0 : m >= 0.6 ? 3.4 : 3.0) * ath, sprint: (m >= 0.95 ? 7.4 : m >= 0.9 ? 6.6 : 3.4) * ath, jump: m >= 0.9 ? 5.6 : m >= 0.6 ? 4.0 : 2.8, sprintOK: m >= 0.9, peg };
    }

    weaponOf(a) {
      if (a.quad) return { id: 'bite', name: 'Укус', kind: 'swing', dmg: a.kind === 'wolf' ? 11 : 6, time: 0.7, reach: a.kind === 'wolf' ? 1.3 : 1.5, cut: a.kind === 'wolf' ? 0.35 : 0, len: 0 };
      const R = this.armUse(a, 'R'), L = this.armUse(a, 'L');
      const mainSide = R === 'full' ? 'R' : L === 'full' ? 'L' : (R === 'weak' ? 'R' : L === 'weak' ? 'L' : null);
      a.leftMain = mainSide === 'L';
      if (a.slot === 'ranged' && a.equip.ranged) {
        const w = IT[a.equip.ranged];
        if (w.kind === 'bow' && R !== 'none' && L !== 'none' && R !== 'broken' && L !== 'broken' && (R === 'full' || L === 'full')) return w;
        if (w.kind === 'xbow' && mainSide && (R !== 'none' || L !== 'none')) return w;
      }
      if (a.equip.main && mainSide) {
        const w = IT[a.equip.main], use = mainSide === 'R' ? R : L, other = mainSide === 'R' ? L : R;
        if (w.hand === 2 && use === 'full' && (other === 'full' || other === 'weak')) return w;
        if (w.hand === 1 && (use === 'full' || (use === 'weak' && a.equip.main === 'knife'))) return w;
      }
      if (R === 'hook' || L === 'hook') return IT.hook_hit;
      if (R === 'full' || L === 'full' || R === 'weak' || L === 'weak') return IT.fists;
      if (this.legUse(a, 'R') > 0.5 && !a.chair) return { id: 'kick', name: 'Пинок', kind: 'kick', dmg: 7, time: 0.7, reach: 1.1, cut: 0, len: 0 };
      return null;
    }
    shieldOf(a) {
      if (!a.equip.off) return null;
      const w = this.weaponOf(a);
      if (w && w.hand === 2) return null;
      const L = this.armUse(a, a.leftMain ? 'R' : 'L');
      if (L === 'full' || L === 'weak' || L === 'hook') return IT[a.equip.off];
      return null;
    }
    armor(a, part) {
      const slot = ARMOR_SLOT[part]; let ar = 0;
      if (slot && a.equip[slot]) ar += IT[a.equip[slot]].ar || 0;
      if (part.startsWith('arm') && a.pros[part] === 'ironarm') ar += 2;
      if (part === 'torso' && a.kind === 'villain') ar += 1;
      return ar;
    }

    updateCells() {
      this.cell.clear();
      for (const a of this.actors) {
        const k = Math.floor((a.x + 600) / 16) * 1000 + Math.floor((a.z + 600) / 16);
        let l = this.cell.get(k); if (!l) this.cell.set(k, l = []); l.push(a);
      }
    }
    near(x, z, r, out, filter) {
      out = out || []; out.length = 0;
      const x0 = Math.floor((x - r + 600) / 16), x1 = Math.floor((x + r + 600) / 16), z0 = Math.floor((z - r + 600) / 16), z1 = Math.floor((z + r + 600) / 16);
      const r2 = r * r;
      for (let i = x0; i <= x1; i++) for (let j = z0; j <= z1; j++) {
        const l = this.cell.get(i * 1000 + j); if (!l) continue;
        for (const a of l) { const dx = a.x - x, dz = a.z - z; if (dx * dx + dz * dz <= r2 && (!filter || filter(a))) out.push(a); }
      }
      return out;
    }

    memberOf(a) { return a.player ? this.pf : a.fac; }
    hostile(a, b) {
      if (a === b || a.dead || b.dead) return false;
      if (a.hostile.has(b.id) || b.hostile.has(a.id)) return true;
      if ((a.disguised && !a.revealed) || (b.disguised && !b.revealed)) return false;
      if (a.arrested || b.arrested) return false;
      if (a.fac === 'wild' || b.fac === 'wild') return a.fac !== b.fac && !(a.kind === 'cow' || b.kind === 'cow');
      if (a.kind === 'cow' || b.kind === 'cow') return false;
      if (b.player) return this.hostileToPlayer(a);
      if (a.player) return this.hostileToPlayer(b);
      return D.RELATIONS[a.fac][b.fac] < 0;
    }
    hostileToPlayer(a) {
      if (a.dead || a.player) return false;
      if (a.hostile.has(this.player.id)) return true;
      if (a.fac === 'wild') return true;
      if (a.kind === 'cow') return false;
      if (a.fac === this.pf) return this.rep[a.fac] <= REP_HOSTILE || !!this.flags.outlaw;
      if (a.fac === 'folk') return this.rep.folk <= REP_HOSTILE && (a.role === 'soldier');
      if (D.RELATIONS[a.fac][this.pf] < 0) return this.recognized(a);
      return this.rep[a.fac] <= REP_HOSTILE;
    }
    recognized(a) {
      const aw = a.aware.get(this.player.id);
      return !!(aw && aw.known);
    }
    friendly(a, b) { return !this.hostile(a, b) && (this.memberOf(a) === this.memberOf(b)); }

    step(dt) {
      dt = dt || DT;
      this.tick++;
      this.time += dt;
      const p = this.player;
      if (this.tick % 15 === 0) this.updateCells();
      this.controlPlayer(p, dt);
      const far2 = 170 * 170;
      for (let i = 0; i < this.actors.length; i++) {
        const a = this.actors[i];
        if (a.dead) { this.updateCorpse(a, dt); continue; }
        const d2 = (a.x - p.x) * (a.x - p.x) + (a.z - p.z) * (a.z - p.z);
        const lod = d2 > far2 ? 4 : 1;
        if (!a.player && ((this.tick + a.id) % lod) !== 0) continue;
        const ldt = dt * lod;
        if (!a.player) K.AI.think(this, a, ldt);
        this.moveActor(a, ldt);
        this.combatActor(a, ldt);
        this.bodyActor(a, ldt);
        a.far = lod > 1;
      }
      for (const a of this.actors) if (a.dead && a.removeMe) this.remove(a);
      this.stepProjectiles(dt);
      this.stepPieces(dt);
      this.stepFires(dt);
      for (const w of this.wagons) K.AI.wagon(this, w, dt);
      if (this.tick % 30 === 0) K.AI.director(this, dt * 30);
      if (K.Quests && this.tick % 10 === 0) K.Quests.update(this, dt * 10);
      if (this.tick % 600 === 0) this.cleanup();
      this.dailies();
      if (this.tick % 60 === 0) this.discover();
    }

    discover() {
      const p = this.player, seen = this.flags.seen || (this.flags.seen = {});
      for (const id in this.world.places) { const P = this.world.places[id]; if (!seen[id] && Math.hypot(P.x - p.x, P.z - p.z) < P.r + 30) { seen[id] = true; if (this.tick > 120) this.msg('Открыто место: ' + P.name + '.', '#c0d8ff'); } }
    }
    canTravel() {
      const p = this.player;
      if (p.bleed > 0) return 'bleed';
      if (this.near(p.x, p.z, 50, []).some(a => !a.dead && this.hostile(a, p) && (a.aware.get(p.id) || {}).known && !a.quad)) return 'enemies';
      if (this.near(p.x, p.z, 25, []).some(a => !a.dead && a.kind === 'wolf')) return 'enemies';
      return 'ok';
    }
    travelTime(id) { const P = this.world.places[id], p = this.player; return Math.round(Math.hypot(P.x - p.x, P.z - p.z) / (this.mobility(p).mode === 'walk' ? 70 : 25)); }
    fastTravel(id) {
      const ok = this.canTravel(); if (ok !== 'ok') return ok;
      const P = this.world.places[id], p = this.player, mins = this.travelTime(id);
      const n = this.world.nodes[id] || [P.x, P.z + P.r * 0.6];
      const at = K.AI.freeNear(this.world, n[0] + 3, n[1] + 3);
      for (const a of this.army()) { a.x = at[0] + (this.R() - 0.5) * 6; a.z = at[1] + (this.R() - 0.5) * 6; a.y = this.world.groundAt(a.x, a.z); }
      for (const a of this.actors) if (!a.dead && a.ai && a.ai.follow === p.id) { a.x = at[0] + (this.R() - 0.5) * 5; a.z = at[1] + (this.R() - 0.5) * 5; a.y = this.world.groundAt(a.x, a.z); }
      p.x = at[0]; p.z = at[1]; p.y = this.world.groundAt(p.x, p.z); p.vx = p.vz = p.vy = 0;
      this.passTime(mins, false);
      this.updateCells();
      this.msg('Вы добрались до места: ' + P.name + ' (' + mins + ' мин в пути).', '#c0d8ff');
      return 'ok';
    }

    dailies() {
      const day = Math.floor(this.time / 1440);
      if (day !== this.lastDay) {
        if (this.lastDay != null) {
          for (const k in this.pools) this.pools[k] = Math.min(100, this.pools[k] + 6);
          this.haggle = {}; this.shopMood = {};
          if (this.pf === 'evil' && !this.player.dead) { this.addGold(this.player, 40); this.msg('Горные деревни прислали дань: 40 золотых.', '#e0c070'); }
          for (const id in this.world.burn) { const b = this.world.burn[id]; if (b.state === 'ruin' && this.time - b.t > 2 * 1440) { b.state = 'ok'; this.emit('rebuilt', { id }); } }
        }
        this.lastDay = day;
      }
    }

    controlPlayer(p, dt) {
      if (p.dead) return;
      const inp = this.input;
      p.yaw = inp.yaw;
      p.pitch = clamp(inp.pitch || 0, -1.2, 1.2);
      const m = this.mobility(p);
      const f = clamp(inp.fwd || 0, -1, 1), s = clamp(inp.strafe || 0, -1, 1);
      const len = Math.hypot(f, s);
      const busy = p.action && p.action.lock;
      let sp = 0;
      if (len > 0.01 && !busy) {
        const sprint = inp.run && m.sprintOK && p.stamina > 5 && f > 0.2;
        sp = sprint ? m.sprint : inp.walk ? m.walk : m.run;
        if (inp.crouch && m.mode === 'walk') sp = Math.min(sp, 1.9);
        if (p.atk) sp *= 0.6;
        if (p.block > 0.3) sp *= 0.55;
        if (p.draw > 0.1) sp *= 0.5;
        if (sprint) { p.stamina = Math.max(0, p.stamina - 14 * dt); this.xp(p, 'athletics', dt * 0.4); }
      }
      const fx = Math.sin(p.yaw), fz = -Math.cos(p.yaw), rx = Math.cos(p.yaw), rz = Math.sin(p.yaw);
      const nx = len > 0.01 ? (fx * f + rx * s) / Math.max(1, len) : 0, nz = len > 0.01 ? (fz * f + rz * s) / Math.max(1, len) : 0;
      p.want = { x: nx * sp, z: nz * sp };
      p.crouch = !!inp.crouch && m.mode === 'walk';
      if (inp.jump) { inp.jump = false; if (p.onGround && m.jump > 0 && !busy && p.stamina > 8) { p.vy = m.jump; p.onGround = false; p.stamina -= 8; this.xp(p, 'athletics', 0.6); this.emit('sfx', { s: 'jump', x: p.x, z: p.z }); } }
      p.wantBlock = !!inp.block && p.slot === 'melee';
      p.wantAttack = !!inp.attack;
      p.aim = clamp((p.pitch || 0) / 0.55, -1, 1);
      if (inp.use) { inp.use = false; this.interact(p); }
      if (inp.bandage) { inp.bandage = false; this.useBandage(p); }
      if (inp.potion) { inp.potion = false; this.usePotion(p); }
      if (inp.sheathe) { inp.sheathe = false; p.drawn = !p.drawn; this.emit('sfx', { s: p.drawn ? 'draw' : 'sheathe', x: p.x, z: p.z }); }
      if (inp.slot) { const sl = inp.slot; inp.slot = null; this.selectSlot(p, sl); }
    }
    selectSlot(p, sl) {
      if (sl === 1) { p.slot = 'melee'; p.drawn = true; }
      if (sl === 2) { if (p.equip.ranged) { p.slot = 'ranged'; p.drawn = true; } else this.msg('Нет лука или арбалета.', '#e0a080'); }
      if (sl === 3) {
        if (p.torch) p.torch = false;
        else if (this.has(p, 'torch')) { p.torch = true; if (p.equip.off) this.msg('Факел в левой руке, щит за спиной.', '#e0d0a0'); }
        else this.msg('Нет факела.', '#e0a080');
      }
    }

    moveActor(a, dt) {
      const W = this.world, m = this.mobility(a);
      const want = a.want || { x: 0, z: 0 };
      const acc = a.onGround ? 14 : 3;
      let tx = want.x, tz = want.z;
      if (m.mode === 'chair' && (Math.abs(tx) + Math.abs(tz)) > 0.1) {
        const n = W.normal(a.x, a.z), up = -(n[0] * tx + n[2] * tz) / (Math.hypot(tx, tz) || 1);
        const k = up > 0.12 ? 0.35 : up > 0.05 ? 0.7 : up < -0.1 ? 1.25 : 1;
        tx *= k; tz *= k;
      }
      const wy = this.world.height(a.x, a.z);
      const inWater = wy < K.WORLD.WATER_Y - 0.6 && a.y < K.WORLD.WATER_Y - 0.4;
      if (inWater) { tx *= 0.45; tz *= 0.45; }
      a.vx += clamp(tx - a.vx, -acc * dt, acc * dt);
      a.vz += clamp(tz - a.vz, -acc * dt, acc * dt);
      const ox = a.x, oz = a.z;
      a.x += a.vx * dt; a.z += a.vz * dt;
      a.vy -= 15 * dt;
      a.y += a.vy * dt;
      const r = a.quad ? (a.kind === 'cow' ? 0.6 : 0.35) : m.mode === 'crawl' ? 0.32 : 0.33;
      const hgt = m.mode === 'crawl' ? 0.6 : m.mode === 'chair' ? 1.4 : a.crouch ? 1.2 : 1.75;
      const hit = W.pushOut(a, r, hgt);
      if (a.quad || !a.player) this.pushWagons(a, r);
      const fl = W.floorAt(a.x, a.z, a.y, a.onGround ? 0.65 : 0.35);
      if (a.onGround) {
        const n = W.normal(a.x, a.z);
        const steep = n[1] < 0.62 && fl <= this.world.height(a.x, a.z) + 0.05;
        if (steep) {
          const climb = (fl - a.y);
          if (climb > 0.02) { a.x = lerp(ox, a.x, 0.25); a.z = lerp(oz, a.z, 0.25); a.vx += n[0] * 2 * dt * 10; a.vz += n[2] * 2 * dt * 10; }
        }
      }
      const fl2 = W.floorAt(a.x, a.z, a.y, a.onGround ? 0.65 : 0.35);
      if (a.y <= fl2 + 0.001 || (a.onGround && a.y - fl2 < 0.45 && a.vy <= 0)) {
        if (!a.onGround && a.vy < -11) this.fallDamage(a, -a.vy);
        a.y = fl2; a.vy = 0; a.onGround = true;
      } else a.onGround = false;
      if (inWater) { const sy = K.WORLD.WATER_Y - 1.25; if (a.y < sy) { a.y = sy; a.vy = Math.max(0, a.vy); a.onGround = true; } }
      a.inWater = inWater;
      const ceil = W.ceilingAt(a.x, a.z, a.y);
      if (a.y + hgt > ceil && a.vy > 0) { a.vy = 0; }
      const spd = Math.hypot(a.vx, a.vz);
      const an = a.anim;
      an.speed = spd / (a.quad ? 2.2 : 4.2);
      an.phase += spd * dt * (a.quad ? 3.4 : m.mode === 'crawl' ? 6 : 2.6) / Math.max(0.7, a.scale);
      an.air = !a.onGround && !inWater;
      an.mode = a.chairSeat ? 'chair' : m.mode === 'crawl' ? 'crawl' : m.mode === 'chair' ? 'chair' : null;
      an.peg = m.peg; an.crouch = lerp(an.crouch || 0, a.crouch ? 1 : 0, Math.min(1, dt * 10));
      if (spd > 0.2 && !a.player) {
        const want = Math.atan2(a.vx, -a.vz);
        if (!a.faceT) a.yaw += clamp(wrapA(want - a.yaw), -6 * dt, 6 * dt);
      }
      if (a.faceT) { const ft = a.faceT; a.yaw += clamp(wrapA(angTo(a.x, a.z, ft.x, ft.z) - a.yaw), -7 * dt, 7 * dt); }
      a.stuck = hit && spd < 0.3 && Math.hypot(want.x, want.z) > 0.5;
      if (spd > 0.5 && a.onGround && (this.tick + a.id) % Math.round(20 / Math.max(0.6, an.speed)) === 0) this.emit('step', { x: a.x, z: a.z, id: a.id, m: m.mode });
    }
    fallDamage(a, v) {
      const d = (v - 11) * 9;
      if (d <= 0) return;
      const leg = this.R() < 0.5 ? 'legL' : 'legR';
      this.damagePart(a, null, leg, false, d, { cut: 0, kind: 'fall' });
      if (a.player) this.msg('Неудачно приземлились.', '#e0a080');
    }
    pushWagons(a, r) {
      for (const w of this.wagons) {
        if (w.gone) continue;
        const dx = a.x - w.x, dz = a.z - w.z; if (dx * dx + dz * dz > 16) continue;
        const c = Math.cos(w.yaw), s = Math.sin(w.yaw);
        let lx = dx * c + dz * s, lz = -dx * s + dz * c;
        const ex = 1.1 + r, ez = 2.1 + r;
        if (Math.abs(lx) < ex && Math.abs(lz) < ez) {
          if (ex - Math.abs(lx) < ez - Math.abs(lz)) lx = Math.sign(lx || 1) * ex; else lz = Math.sign(lz || 1) * ez;
          a.x = w.x + lx * c - lz * s; a.z = w.z + lx * s + lz * c;
        }
      }
    }

    bodyActor(a, dt) {
      if (a.stagger > 0) a.stagger = Math.max(0, a.stagger - dt);
      a.anim.stagger = a.stagger || 0;
      if (!a.atk && !a.wantAttack) a.stamina = Math.min(100, a.stamina + (a.block > 0.2 ? 4 : 16) * dt);
      if (a.bleed > 0) {
        a.hp -= a.bleed * dt;
        a.bleedT = (a.bleedT || 0) + dt;
        if (a.bleedT > 0.5) { a.bleedT = 0; this.decal(a.x + (this.R() - 0.5) * 0.6, a.z + (this.R() - 0.5) * 0.6, 0.18 + this.R() * 0.2, 'drip'); }
        if (a.hp <= 0) { this.kill(a, a.lastHitBy ? this.byId.get(a.lastHitBy) : null, 'bleed'); return; }
      }
      if (a.action) {
        a.action.t += dt;
        if (a.action.t >= a.action.dur) { const act = a.action; a.action = null; act.done && act.done(); }
      }
      if (a.dist2p == null || this.tick % 4 === 0) {
        const p = this.player; a.dist2p = (a.x - p.x) * (a.x - p.x) + (a.z - p.z) * (a.z - p.z);
      }
      if (a.player || a.dist2p < 130 * 130) this.computePose(a);
      else a.joints = null;
    }
    computePose(a) {
      if (!a.joints) a.joints = new Float32Array((a.quad ? B.QNJ : B.NJ) * 3);
      const an = a.anim, w = a.drawn ? this.weaponOf(a) : null;
      an.armed = !!(a.drawn && w && w.len > 0);
      an.wlook = w ? (w.look || null) : null;
      an.twoHand = !!(w && w.hand === 2 && a.drawn);
      an.leftMain = !!a.leftMain;
      an.block = a.block;
      an.aim = a.aim || 0; an.pitch = a.pitch || 0;
      an.mode = an.mode || null;
      if (a.drawn && w && (w.kind === 'bow' || w.kind === 'xbow') && !an.mode) { an.mode = w.kind; an.draw = a.draw; }
      an.atk = a.atk ? { kind: a.atk.kind, t: a.atk.t } : null;
      an.torch = a.torch;
      a.offLook = this.shieldOf(a) && (!a.torch) ? 'shield' : null;
      a.pose = a.quad ? B.quadPose(a, a.joints) : B.pose(a, a.joints, (x, z) => this.world.floorAt(x, z, a.y + 0.5, 0.8));
    }

    combatActor(a, dt) {
      if (a.cd > 0) a.cd -= dt;
      if (a.reload > 0) { a.reload -= dt; if (a.reload <= 0) { a.loaded = true; this.emit('sfx', { s: 'reload', x: a.x, z: a.z }); } }
      const w = this.weaponOf(a);
      const busy = (a.action && a.action.lock) || a.stagger > 0.15;
      const shield = this.shieldOf(a);
      const blockWant = a.wantBlock && a.drawn && !a.atk && !busy && w && w.kind !== 'bow' && w.kind !== 'xbow' && w.kind !== 'kick' && a.stamina > 3;
      a.block = clamp(a.block + (blockWant ? 6 : -6) * dt, 0, 1);
      a.blocking = a.block > 0.6 ? (shield ? 'shield' : 'weapon') : null;
      if (!w) { a.atk = null; return; }
      if (a.atk) {
        const at = a.atk;
        at.t += dt / at.dur;
        if (at.melee) this.sweep(a, at);
        if (at.t >= 1) { a.atk = null; a.cd = 0.08; }
        return;
      }
      if (!a.drawn) { if (a.wantAttack && a.player && !busy) { a.drawn = true; a.cd = 0.25; } a.draw = 0; return; }
      if (w.kind === 'bow') {
        if (a.wantAttack && !busy && this.has(a, 'arrows')) { a.draw = Math.min(1, a.draw + dt / 0.9); if (a.draw > 0.95) a.stamina = Math.max(0, a.stamina - 3 * dt); }
        else if (a.draw > 0.12) { this.shoot(a, w, a.draw); a.draw = 0; a.cd = w.time; }
        else a.draw = Math.max(0, a.draw - dt * 3);
        return;
      }
      if (w.kind === 'xbow') {
        a.draw = 1;
        if (a.wantAttack && !busy && a.loaded && a.cd <= 0 && this.has(a, 'arrows')) { this.shoot(a, w, 1); a.loaded = false; a.reload = w.time * (a.leftMain ? 1.3 : 1); a.cd = 0.3; }
        return;
      }
      a.draw = 0;
      if (a.wantAttack && a.cd <= 0 && !busy && a.stamina > 4) this.startMelee(a, w);
    }
    startMelee(a, w) {
      let dur = w.time * (1 - (a.skills.melee - 30) / 500);
      if (a.leftMain) dur *= 1.18;
      if (a.leftMain ? this.armUse(a, 'L') === 'weak' : this.armUse(a, 'R') === 'weak') dur *= 1.2;
      if (a.stamina < 25) dur *= 1.25;
      if (this.mobility(a).mode === 'crawl') dur *= 1.3;
      const kind = w.kind === 'bow' || w.kind === 'xbow' ? 'swing' : w.kind;
      a.atk = { kind: a.quad ? 'swing' : kind, t: 0, dur: dur * 1.15, w, hit: new Set(), melee: true, prev: null, aim: a.aim || 0 };
      a.stamina = Math.max(0, a.stamina - (6 + w.dmg * 0.35));
      this.emit('sfx', { s: w.id === 'kick' || w.id === 'fists' ? 'whoosh_s' : w.dmg > 25 ? 'whoosh_h' : 'whoosh', x: a.x, z: a.z });
    }
    bladeOf(a, at) {
      if (a.quad) {
        const j = a.joints; if (!j) return null;
        const h = [j[B.Q.head * 3], j[B.Q.head * 3 + 1], j[B.Q.head * 3 + 2]];
        const f = [Math.sin(a.yaw), 0, -Math.cos(a.yaw)];
        return [h, [h[0] + f[0] * 0.5, h[1] - 0.05, h[2] + f[2] * 0.5]];
      }
      if (!a.joints || !a.pose) return null;
      if (at.kind === 'kick') {
        const j = a.joints, ft = B.J.ftR * 3, kn = B.J.knR * 3;
        return [[j[kn], j[kn + 1], j[kn + 2]], [j[ft], j[ft + 1], j[ft + 2]]];
      }
      const h = a.pose.whand, d = a.pose.wdir;
      if (!h) return null;
      const len = Math.max(0.12, at.w.len || 0) * 1.05;
      const dir = d || [Math.sin(a.yaw), 0, -Math.cos(a.yaw)];
      const base = at.w.len > 0.5 ? 0.08 : 0;
      return [[h[0] + dir[0] * base, h[1] + dir[1] * base, h[2] + dir[2] * base], [h[0] + dir[0] * len, h[1] + dir[1] * len, h[2] + dir[2] * len]];
    }
    sweep(a, at) {
      this.computePose(a);
      const bl = this.bladeOf(a, at);
      if (!bl) return;
      const kind = a.quad ? 'swing' : at.kind;
      const win = (B.ATK[kind] || B.ATK.swing).win;
      const prev = at.prev; at.prev = bl;
      if (at.t < win[0] || at.t > win[1] + 0.04 || !prev) return;
      const reach = (at.w.reach || 1.5) + 1.6;
      const cand = this.near(a.x, a.z, reach, this._cand || (this._cand = []));
      let hitSomeone = false;
      for (const t of cand) {
        if (t === a || t.dead || at.hit.has(t.id)) continue;
        if (!a.player && !this.hostile(a, t) && !(a.ai && a.ai.target === t.id)) continue;
        if (!t.joints) this.computePose(t);
        if (!t.joints) continue;
        const caps = B.capsules(t, t.joints);
        const rad = (B.ATK[kind] || B.ATK.swing).blade;
        let h = B.sweepHit(caps, bl[0], bl[1], rad) || B.sweepHit(caps, prev[1], bl[1], rad) || B.sweepHit(caps, prev[0], bl[0], rad * 0.6);
        if (!h) continue;
        at.hit.add(t.id);
        hitSomeone = true;
        const dir = [t.x - a.x, 0, t.z - a.z]; const dl = Math.hypot(dir[0], dir[2]) || 1; dir[0] /= dl; dir[2] /= dl;
        const pt = [lerp(h.cap.a[0], h.cap.b[0], h.t), lerp(h.cap.a[1], h.cap.b[1], h.t), lerp(h.cap.a[2], h.cap.b[2], h.t)];
        this.hit(a, t, h.cap.part, h.cap.lower, at.w, kind, dir, pt);
        if (at.w.hand !== 2 && at.w.dmg < 25) break;
      }
      if (!hitSomeone && at.t > win[0] + (win[1] - win[0]) * 0.5 && !at.gateDone) {
        const g = this.gateNear(a, (at.w.reach || 1.5) + 1.0);
        if (g) { at.gateDone = true; this.damageGate(g, at.w.dmg * (at.w.kind === 'chop' ? 1.4 : 1), a); }
      }
    }
    gateNear(a, r) {
      const W = this.world, fx = Math.sin(a.yaw), fz = -Math.cos(a.yaw);
      for (const c of W.colliders) {
        if (!c.gate) continue;
        const g = W.gates[c.gate]; if (!g || !g.closed || g.hp <= 0) continue;
        const px = a.x + fx * r * 0.7, pz = a.z + fz * r * 0.7;
        const dx = px - c.x, dz = pz - c.z, lx = dx * c.c + dz * c.s, lz = -dx * c.s + dz * c.c;
        if (Math.abs(lx) < c.hw + 0.8 && Math.abs(lz) < c.hd + 0.8) return g;
      }
      return null;
    }
    damageGate(g, dmg, by) {
      g.hp = Math.max(0, g.hp - dmg);
      this.emit('sfx', { s: 'wood', x: by.x, z: by.z });
      this.emit('gatehit', { id: g.id, hp: g.hp });
      if (g.hp <= 0) {
        this.world.rebuildNavColliders();
        this.emit('gatebroken', { id: g.id });
        this.msg(g.name + ' разбиты!', '#ffd080');
      }
    }

    hit(att, tgt, part, lower, w, kind, dir, pt) {
      const R = this.R;
      if (tgt.kind === 'cow' && att) { tgt.hostile.add(att.id); }
      tgt.lastHitBy = att ? att.id : null;
      if (att) this.aggro(att, tgt);
      const facing = att ? Math.abs(wrapA(angTo(tgt.x, tgt.z, att.x, att.z) - tgt.yaw)) : 3;
      let dmg = w.dmg * (0.85 + R() * 0.3);
      if (att) dmg *= 1 + ((att.skills[kind === 'arrow' ? 'archery' : 'melee'] || 30) - 30) / 220;
      if (att && att.stamina < 15) dmg *= 0.75;
      let cut = w.cut || 0;
      if (tgt.blocking && facing < 1.25 && kind !== 'arrow' && att) {
        const sh = this.shieldOf(tgt), bk = tgt.blocking === 'shield' && sh ? sh.block : 0.5;
        const cost = dmg * (tgt.blocking === 'shield' ? 0.8 : 1.4);
        tgt.stamina -= cost;
        this.xp(tgt, 'block', 1.2);
        if (tgt.stamina > 0) {
          this.emit('hit', { x: pt[0], y: pt[1], z: pt[2], block: tgt.blocking, id: tgt.id });
          this.emit('sfx', { s: tgt.blocking === 'shield' ? 'shield' : 'clang', x: tgt.x, z: tgt.z });
          dmg *= 1 - bk; cut = 0;
          if (att.atk && tgt.blocking === 'shield') { att.stagger = 0.35; att.atk = null; att.cd = 0.4; }
          if (dmg < 3) return;
        } else { tgt.stamina = 0; tgt.block = 0; tgt.stagger = 0.6; this.emit('sfx', { s: 'clang', x: tgt.x, z: tgt.z }); }
      }
      if (kind === 'arrow' && tgt.blocking === 'shield' && facing < 0.9 && (part === 'torso' || part === 'armL' || part === 'head') && R() < 0.75) {
        this.emit('sfx', { s: 'shield', x: tgt.x, z: tgt.z }); this.emit('hit', { x: pt[0], y: pt[1], z: pt[2], block: 'shield', id: tgt.id }); return;
      }
      if (att && att.player) this.xp(att, kind === 'arrow' ? 'archery' : 'melee', 1.0);
      this.damagePart(tgt, att, part, lower, dmg, { cut, kind, dir, pt, w });
      if (tgt.dead) return;
      if (dmg > 11 && !tgt.quad) { tgt.stagger = Math.max(tgt.stagger || 0, 0.25 + Math.min(0.4, dmg / 80)); if (tgt.atk && dmg > 15) { tgt.atk = null; tgt.cd = 0.3; } }
      if (dir) { const k = Math.min(4, dmg / 8) * (tgt.quad ? 0.4 : 1); tgt.vx += dir[0] * k; tgt.vz += dir[2] * k; }
    }

    damagePart(t, att, part, lower, dmg, o) {
      const R = this.R;
      if (t.dead) return;
      if (t.quad && part !== 'head') part = 'torso';
      const L = t.limbs[part];
      const ar = this.armor(t, part);
      dmg = Math.max(1, dmg - ar * 1.2);
      let cut = (o.cut || 0) * Math.max(0, 1 - ar * 0.09);
      const kind = o.kind;
      const pt = o.pt || [t.x, t.y + 1, t.z];
      const ev = { x: pt[0], y: pt[1], z: pt[2], id: t.id, part, dmg: Math.round(dmg), sever: null, eye: null, pros: null };
      if (L && L.state === 'lost' && t.pros[part] && (lower || L.cut === 'upper' || part.startsWith('leg'))) {
        const pr = t.pros[part];
        t.hp -= dmg * 0.25;
        if ((pr === 'pegleg' || pr === 'woodarm' || pr === 'hook') && cut > 0.5 && R() < 0.35) {
          delete t.pros[part];
          this.dropItem(pr, pt[0], pt[2]);
          if (t.player) this.msg('Вам выбили протез: ' + itemName(pr) + '!', '#ff8060');
          if (t.chair && false) t.chair = false;
          ev.pros = pr;
          if (part === 'armR' || part === 'armL') this.loseGrip(t, part);
        }
        this.emit('sfx', { s: pr.startsWith('iron') ? 'clang' : 'wood', x: t.x, z: t.z });
        this.emit('hit', ev);
        if (t.hp <= 0) this.kill(t, att, 'wound');
        return;
      }
      if (part === 'head') {
        t.hp -= dmg * 1.35; L.hp -= dmg;
        if ((kind === 'thrust' || kind === 'arrow') && !t.quad && R() < (kind === 'arrow' ? 0.3 : 0.2) && L.hp < L.max * 0.85) {
          const local = this.localSide(t, pt);
          const side = local > 0 ? 'R' : 'L';
          const eye = t.eyes[side] === 'ok' ? side : (t.eyes[side === 'R' ? 'L' : 'R'] === 'ok' ? (side === 'R' ? 'L' : 'R') : null);
          if (eye && (t.equip.head !== 'blackhelm' || R() < 0.4)) {
            t.eyes[eye] = 'lost'; ev.eye = eye;
            if (t.player) { this.stats.eyes++; this.msg(eye === 'R' ? 'Вам выкололи правый глаз!' : 'Вам выкололи левый глаз!', '#ff6040'); }
            else if (att && att.player) this.msg(t.name + ' лишился глаза.', '#e0c080');
          }
        }
        if (L.hp <= 0 && cut >= 0.9 && R() < cut * 0.42 && !t.quad) {
          ev.sever = 'head';
          this.emit('hit', ev);
          this.sever(t, 'head', 'upper', o.dir);
          this.kill(t, att, 'head');
          return;
        }
      } else if (part === 'torso') {
        t.hp -= dmg;
      } else {
        L.hp -= dmg; t.hp -= dmg * 0.5;
        if (L.hp <= 0 && L.state !== 'lost') {
          const over = -L.hp / L.max;
          const chance = Math.min(0.88, cut * 0.55 + over * 0.45 * (cut > 0.2 ? 1 : 0));
          if (cut > 0.3 && R() < chance) {
            const c = lower ? 'lower' : 'upper';
            ev.sever = part;
            this.sever(t, part, c, o.dir);
            this.emit('hit', ev);
            if (t.hp <= 0) this.kill(t, att, 'wound');
            return;
          } else if (L.state === 'ok') {
            L.state = 'broken'; L.hp = 0; ev.broken = part;
            if (part.startsWith('arm')) this.loseGrip(t, part);
            if (t.player) this.msg('Сломана ' + D.PARTS[part].toLowerCase() + '.', '#ff9060');
          }
        }
      }
      this.emit('hit', ev);
      this.decal(pt[0], pt[2], 0.25 + Math.min(0.5, dmg / 40), 'blood');
      if (t.player && dmg > 2) this.emit('hurt', { dmg, part });
      if (t.hp <= 0) this.kill(t, att, part === 'head' ? 'head' : 'wound');
    }
    localSide(t, pt) { const dx = pt[0] - t.x, dz = pt[2] - t.z; return dx * Math.cos(t.yaw) + dz * Math.sin(t.yaw); }
    loseGrip(t, part) {
      const side = part === 'armR' ? 'R' : 'L';
      const mainSideWas = t.leftMain ? 'L' : 'R';
      if (side === mainSideWas && t.equip.main && t.slot === 'melee') {
        const id = t.equip.main;
        if (!t.player) { this.take(t, id); this.dropItem(id, t.x + (this.R() - 0.5), t.z + (this.R() - 0.5)); }
        else this.msg('Оружие выпало из руки. Возьмите его другой рукой, если она цела.', '#ff9060');
      }
      if (side !== mainSideWas && t.equip.off && !t.player) { const id = t.equip.off; this.take(t, id); this.dropItem(id, t.x, t.z); }
      t.atk = null;
    }
    sever(t, part, cut, dir) {
      const L = t.limbs[part];
      L.state = 'lost'; L.cut = part === 'head' ? 'upper' : cut; L.hp = 0;
      if (!t.joints) this.computePose(t);
      const v = dir ? [dir[0] * 3 + (this.R() - 0.5) * 2, 2.5 + this.R() * 2, dir[2] * 3 + (this.R() - 0.5) * 2] : [0, 2, 0];
      if (t.joints && !t.quad) {
        const rag = B.limbPiece(t.joints, part, cut, v);
        this.pieces.push({ rag, part, cut, look: this.lookOf(t), t: 0, x: t.x, z: t.z, owner: t.id, pros: null });
        if (this.pieces.length > 60) this.pieces.shift();
      }
      if (part !== 'head') {
        t.bleed += cut === 'upper' ? 1.25 : 0.85;
        t.stumps.push({ part, bandaged: false });
        if (t.player) { this.stats.limbsLost++; this.msg('Вам отрубили ' + D.PART_GEN[part] + '! Кровь хлещет: перевяжите рану (B).', '#ff4030'); }
        if (part.startsWith('arm')) this.loseGrip(t, part);
        if (part.startsWith('leg') && t.player) this.msg('Без ноги можно только ползти. Нужна коляска или протез.', '#ff9060');
      }
      const by = t.lastHitBy ? this.byId.get(t.lastHitBy) : null;
      if (by && by.player) this.stats.limbsCut++;
      for (let i = 0; i < 6; i++) this.decal(t.x + (this.R() - 0.5) * 1.6, t.z + (this.R() - 0.5) * 1.6, 0.2 + this.R() * 0.35, 'blood');
      this.emit('sever', { id: t.id, part, cut, x: t.x, y: t.y + 1.2, z: t.z });
      this.emit('sfx', { s: 'sever', x: t.x, z: t.z });
      if (!t.player && !t.quad && part !== 'head') this.emit('sfx', { s: t.female ? 'scream_f' : 'scream', x: t.x, z: t.z });
    }
    lookOf(t) { return { colors: t.colors, equip: Object.assign({}, t.equip), elf: t.elf, female: t.female, scale: t.scale, pros: Object.assign({}, t.pros), beard: t.beard, crown: t.crown, kind: t.kind }; }

    aggro(att, tgt) {
      if (!att || att === tgt) return;
      const wasHostile = this.hostile(att, tgt);
      if (!tgt.player) tgt.hostile.add(att.id);
      if (!att.player && !tgt.player) att.hostile.add(tgt.id);
      if (att.player && !tgt.player) {
        const aw = tgt.aware.get(att.id) || {}; aw.known = true; aw.s = 1; tgt.aware.set(att.id, aw);
        if (!wasHostile && tgt.kind !== 'cow') this.crime(tgt, 'attack');
        if (tgt.kind === 'cow') this.crime(tgt, 'cow');
        this.alertAllies(tgt, att, 25);
      }
      if (tgt.player && !att.player) { const aw = att.aware.get(tgt.id) || {}; aw.known = true; aw.s = 1; att.aware.set(tgt.id, aw); }
    }
    alertAllies(victim, att, r) {
      const list = this.near(victim.x, victim.z, r, []);
      for (const b of list) {
        if (b === victim || b.dead || b.player || b.quad) continue;
        if (b.fac === victim.fac || (victim.fac === 'folk' && b.role === 'soldier' && b.fac === 'folk')) {
          b.hostile.add(att.id);
          if (att.player) { const aw = b.aware.get(att.id) || {}; aw.known = true; aw.s = 1; b.aware.set(att.id, aw); }
        }
      }
    }
    crime(victim, what) {
      const f = victim.fac;
      if (f === 'wild') return;
      const hostileFac = D.RELATIONS[f][this.pf] < 0 && f !== this.pf;
      if (what === 'attack') {
        if (f === this.pf) { this.rep[f] -= 20; this.msg('Вы напали на своего. Свои вам этого не простят.', '#ff8060'); this.breach('ally'); }
        else if (!hostileFac) { this.rep[f] -= 12; if (f === 'folk') this.breach('folk'); }
      }
      if (what === 'kill') {
        if (f === this.pf) this.rep[f] -= 30;
        else if (!hostileFac) this.rep[f] -= 18;
        else this.rep[f] -= 2;
        if (victim.role === 'civ' || victim.role === 'merchant' || victim.role === 'service') this.rep.folk -= f === 'folk' ? 0 : 6;
      }
      if (what === 'rob') { this.rep[f] -= f === this.pf ? 25 : 10; if (f === 'emp') this.breach('rob'); this.rep.folk -= 4; }
      if (what === 'cow') { this.rep.folk -= 6; }
      for (const k in this.rep) this.rep[k] = clamp(this.rep[k], -100, 100);
    }
    breach(kind) { if (K.Quests) K.Quests.breach(this, kind); }

    kill(t, att, cause) {
      if (t.dead) return;
      t.dead = true; t.hp = 0; t.atk = null; t.block = 0; t.deadT = 0; t.cause = cause;
      if (!t.joints) this.computePose(t);
      const v = [t.vx * 0.6, 1.2, t.vz * 0.6];
      if (att && !att.dead) { const dx = t.x - att.x, dz = t.z - att.z, d = Math.hypot(dx, dz) || 1; v[0] += dx / d * 2.2; v[2] += dz / d * 2.2; }
      if (t.joints) {
        t.rag = new B.Ragdoll(t.joints, t.quad ? B.QNJ : B.NJ, t.quad ? B.QRAG_LINKS : B.RAG_LINKS, v, { rad: t.quad ? 0.18 : 0.07 });
        if (!t.quad) {
          const lost = [];
          for (const p of ['armL', 'armR', 'legL', 'legR', 'head']) {
            const l = t.limbs[p];
            if (l.state === 'lost' && !t.pros[p]) lost.push(...B.LIMB_JOINTS[p][l.cut === 'upper' ? 'upper' : 'lower'].slice(p === 'head' ? 1 : 1));
          }
          if (lost.length) t.rag.remove(lost);
          t.rag.kick(B.J.chest, v[0] * 1.5, 0.5, v[2] * 1.5);
        }
      }
      if (t.atk) t.atk = null;
      if (!t.player && t.equip.main && this.R() < 0.6 && !t.quad) { const id = t.equip.main; this.take(t, id); this.dropItem(id, t.x + (this.R() - 0.5) * 1.5, t.z + (this.R() - 0.5) * 1.5); }
      this.emit('death', { id: t.id, kind: t.kind, fac: t.fac, by: att ? att.id : null, cause, x: t.x, z: t.z, tags: [...t.tags] });
      this.emit('sfx', { s: t.quad ? (t.kind === 'cow' ? 'moo_die' : 'yelp') : t.female ? 'die_f' : 'die', x: t.x, z: t.z });
      if (t.player) { this.stats.deaths++; this.msg(cause === 'bleed' ? 'Вы истекли кровью.' : cause === 'head' ? 'Вам отрубили голову.' : 'Вы погибли.', '#ff4030'); return; }
      if (att && att.player) {
        this.stats.kills++;
        this.crime(t, 'kill');
        if (t.kind === 'cow') this.msg('Корова пала. Развилки этого не забудут.', '#e0a080');
      }
    }
    updateCorpse(a, dt) {
      a.deadT += dt;
      if (a.rag && !a.rag.asleep) {
        const W = this.world;
        a.rag.step(dt, (x, z, y) => W.floorAt(x, z, y, 0.3));
        if (!a.rag.asleep) { const c = a.rag.center(); a.x = c[0]; a.z = c[2]; a.y = c[1]; }
      }
    }

    dropItem(id, x, z, n) {
      const y = this.world.groundAt(x, z);
      this.drops.push({ id, n: n || 1, x, y, z, t: 0, yaw: this.R() * 6.28 });
      if (this.drops.length > 120) this.drops.shift();
    }
    decal(x, z, r, kind) {
      const y = this.world.groundAt(x, z);
      this.decals.push({ x, y, z, r, kind, t: this.time, rot: this.R() * 6.28 });
      if (this.decals.length > 220) this.decals.shift();
    }

    shoot(a, w, power) {
      if (!this.take(a, 'arrows')) return;
      if (!a.joints) this.computePose(a);
      const pitch = a.pitch || 0;
      let yaw = a.yaw, pt = pitch;
      if (a.aimAt) { yaw = a.aimAt.yaw; pt = a.aimAt.pitch; }
      const skill = a.skills.archery || 20;
      let spread = (w.kind === 'xbow' ? 0.018 : 0.03) * (1.6 - skill / 100) * (a.player ? 0.5 : 1);
      if (!this.sees(a, 'L') || !this.sees(a, 'R')) spread *= a.player ? 1 : 1.8;
      if (a.vx * a.vx + a.vz * a.vz > 4) spread *= 1.8;
      yaw += (this.R() - 0.5) * spread * 2; pt += (this.R() - 0.5) * spread * 2;
      const speed = w.kind === 'xbow' ? 72 : (28 + 44 * power) * (w.id === 'elfbow' ? 1.15 : 1);
      const cp = Math.cos(pt);
      const ox = a.x, oy = a.y + 1.45 * a.scale, oz = a.z;
      const dx = Math.sin(yaw) * cp, dy = Math.sin(pt), dz = -Math.cos(yaw) * cp;
      const off = 0.4;
      this.projectiles.push({ x: ox + dx * off, y: oy + dy * off, z: oz + dz * off, vx: dx * speed, vy: dy * speed, vz: dz * speed, owner: a.id, dmg: w.dmg * (w.kind === 'xbow' ? 1 : 0.35 + 0.65 * power), kind: w.kind === 'xbow' ? 'bolt' : 'arrow', life: 6 });
      this.emit('sfx', { s: w.kind === 'xbow' ? 'xbow' : 'bow', x: a.x, z: a.z });
      if (a.player) this.xp(a, 'archery', 0.3);
    }
    stepProjectiles(dt) {
      const W = this.world;
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.life -= dt;
        const p0 = [p.x, p.y, p.z];
        p.vy -= 9.8 * dt * (p.kind === 'bolt' ? 0.7 : 1);
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        const p1 = [p.x, p.y, p.z];
        let done = false;
        const cand = this.near(p.x, p.z, 4, this._pc || (this._pc = []));
        let best = null, bt = 2, bh = null;
        for (const t of cand) {
          if (t.id === p.owner || t.dead) continue;
          if (!t.joints) this.computePose(t);
          if (!t.joints) continue;
          const h = B.sweepHit(B.capsules(t, t.joints), p0, p1, 0.03);
          if (h && h.s < bt) { bt = h.s; best = t; bh = h; }
        }
        if (best) {
          const own = this.byId.get(p.owner);
          const sp = Math.hypot(p.vx, p.vy, p.vz) || 1;
          const pt = [lerp(p0[0], p1[0], bt), lerp(p0[1], p1[1], bt), lerp(p0[2], p1[2], bt)];
          this.hit(own || null, best, bh.cap.part, bh.cap.lower, { dmg: p.dmg, cut: p.kind === 'bolt' ? 0.15 : 0.1, reach: 0 }, 'arrow', [p.vx / sp, 0, p.vz / sp], pt);
          this.emit('sfx', { s: 'arrowhit', x: p.x, z: p.z });
          done = true;
        }
        if (!done) {
          const fl = W.floorAt(p.x, p.z, p.y, 0);
          if (p.y < fl) { this.stickArrow(p, fl); done = true; }
          else if (p.y < W.height(p.x, p.z) + 12) {
            const cl = W.nearColliders(p.x, p.z, 0.3, this._pcl || (this._pcl = []));
            for (const c of cl) {
              if (c.roof || !W.colliderOn(c)) continue;
              const top = W.colTop(c, p.x, p.z);
              if (top != null && p.y < top && p.y > c.y0) { this.stickArrow(p, p.y); done = true; if (c.gate) this.damageGate(W.gates[c.gate], p.dmg * 0.2, { x: p.x, z: p.z }); break; }
            }
            if (!done) {
              const tl = W.nearTrees(p.x, p.z, 1.2, this._ptl || (this._ptl = []));
              for (const ti of tl) { const dx = p.x - W.tx[ti], dz = p.z - W.tz[ti]; if (dx * dx + dz * dz < W.tr[ti] * W.tr[ti] * 1.4 && p.y < W.ty[ti] + W.th[ti] * 0.55) { this.stickArrow(p, p.y); done = true; break; } }
            }
          }
        }
        if (done || p.life <= 0 || Math.abs(p.x) > 600 || Math.abs(p.z) > 600) this.projectiles.splice(i, 1);
      }
    }
    stickArrow(p, y) {
      this.stuck.push({ x: p.x, y, z: p.z, vx: p.vx, vy: p.vy, vz: p.vz, kind: p.kind, t: this.time });
      if (this.stuck.length > 80) this.stuck.shift();
      this.emit('sfx', { s: 'thunk', x: p.x, z: p.z });
    }
    stepPieces(dt) {
      const W = this.world;
      for (const pc of this.pieces) {
        pc.t += dt;
        if (!pc.rag.asleep) pc.rag.step(dt, (x, z, y) => W.floorAt(x, z, y, 0.3));
      }
    }
    stepFires(dt) {
      const W = this.world;
      for (const id in W.burn) {
        const b = W.burn[id];
        if (b.state !== 'fire') continue;
        b.fire += dt;
        if (this.tick % 30 === 0) {
          for (const a of this.near(b.x, b.z, 5, [])) if (!a.dead && a.y < W.height(b.x, b.z) + 8) this.damagePart(a, b.by ? this.byId.get(b.by) : null, 'torso', false, 4, { kind: 'fire' });
        }
        if (b.fire > 75) { b.state = 'ruin'; b.t = this.time; this.emit('burned', { id }); }
      }
    }
    ignite(id, by) {
      const b = this.world.burn[id];
      if (!b || b.state !== 'ok') return false;
      b.state = 'fire'; b.fire = 0; b.by = by ? by.id : null; b.t = this.time;
      this.emit('ignite', { id, by: by ? by.id : null });
      if (by && by.player) { this.stats.houses++; if (this.pf === 'elf') this.rep.elf -= 25; }
      return true;
    }

    cleanup() {
      const p = this.player;
      const corpses = this.actors.filter(a => a.dead && !a.player);
      if (corpses.length > 45) {
        corpses.sort((a, b) => b.deadT - a.deadT);
        for (const c of corpses.slice(0, corpses.length - 45)) if (Math.hypot(c.x - p.x, c.z - p.z) > 60) c.removeMe = true;
      }
      for (const a of this.actors) if (a.dead && a.deadT > 1440 * 2 && Math.hypot(a.x - p.x, a.z - p.z) > 80) a.removeMe = true;
      for (const a of this.actors) if (a.dead && a.removeMe) this.remove(a);
      this.pieces = this.pieces.filter(pc => pc.t < 1440 * 3 || Math.hypot(pc.rag.p[0] - p.x, pc.rag.p[2] - p.z) < 60);
      this.wagons = this.wagons.filter(w => !w.gone);
      this.decals = this.decals.filter(d => this.time - d.t < 1440 * 2);
    }

    xp(a, skill, n) {
      if (!a.player) return;
      a.skillXp = a.skillXp || {};
      a.skillXp[skill] = (a.skillXp[skill] || 0) + n;
      const lv = a.skills[skill], need = 8 + lv * 0.5;
      if (a.skillXp[skill] >= need && lv < 100) {
        a.skillXp[skill] -= need; a.skills[skill] = lv + 1;
        this.msg('Навык «' + D.SKILLS[skill] + '» вырос до ' + (lv + 1) + '.', '#a0d0ff');
      }
    }

    useBandage(a) {
      const st = a.stumps.find(s => !s.bandaged);
      if (!st) { if (a.player) this.msg(a.bleed > 0 ? 'Нечего перевязывать.' : 'Кровь не идёт.', '#c0c0c0'); return false; }
      if (!this.has(a, 'bandage')) { if (a.player) this.msg('Нет бинтов! Ищите лекаря или зелье.', '#ff8060'); return false; }
      if (a.action) return false;
      a.action = { kind: 'bandage', t: 0, dur: 2.6, lock: true, done: () => {
        if (a.dead || !this.take(a, 'bandage')) return;
        st.bandaged = true;
        a.bleed = Math.max(0, a.bleed - (st.part && this.limbCutUpper(a, st.part) ? 1.25 : 0.85));
        if (a.stumps.every(s => s.bandaged)) a.bleed = 0;
        if (a.player) this.msg('Рана перевязана.', '#c8e0a0');
        this.emit('sfx', { s: 'cloth', x: a.x, z: a.z });
      } };
      return true;
    }
    limbCutUpper(a, part) { return a.limbs[part] && a.limbs[part].cut === 'upper'; }
    usePotion(a) {
      const id = this.has(a, 'potion') ? 'potion' : this.has(a, 'herbs') ? 'herbs' : null;
      if (!id) { if (a.player) this.msg('Нет зелий.', '#e0a080'); return false; }
      if (a.action) return false;
      a.action = { kind: 'drink', t: 0, dur: 1.2, lock: false, done: () => {
        if (a.dead || !this.take(a, id)) return;
        a.hp = Math.min(a.maxHp, a.hp + IT[id].heal);
        if (id === 'potion') { a.bleed = 0; a.stumps.forEach(s => s.bandaged = true); }
        else a.bleed = Math.max(0, a.bleed - 0.4);
        for (const p in a.limbs) a.limbs[p].hp = Math.min(a.limbs[p].max, a.limbs[p].hp + IT[id].heal * 0.5);
        if (a.player) this.msg(IT[id].name + ': полегчало.', '#c8e0a0');
        this.emit('sfx', { s: 'drink', x: a.x, z: a.z });
      } };
      return true;
    }
    eat(a, id) {
      if (!this.take(a, id)) return;
      a.hp = Math.min(a.maxHp, a.hp + IT[id].heal);
      this.msg('Вы съели: ' + IT[id].name + '.', '#c8e0a0');
    }

    healFull(a, opts = {}) {
      a.hp = a.maxHp; a.bleed = 0; a.stumps.forEach(s => s.bandaged = true);
      for (const p in a.limbs) { const l = a.limbs[p]; if (l.state !== 'lost') { l.state = 'ok'; l.hp = l.max; } }
      if (opts.eyes) {}
    }

    fitPros(a, id, byMaster) {
      const it = IT[id];
      if (!it || it.type !== 'pros') return 'not';
      if (!this.has(a, id)) return 'noitem';
      if (!it.self && !byMaster) return 'master';
      if (it.part === 'chair') {
        if (this.legUse(a, 'L') > 0 && this.legUse(a, 'R') > 0 && !a.chair) return 'legs';
        a.chair = !a.chair;
        this.msg(a.chair ? 'Вы сели в коляску.' : 'Вы встали с коляски.', '#c8e0a0');
        return 'ok';
      }
      let slot = null;
      if (it.part === 'eye') { slot = a.eyes.R === 'lost' && !a.pros.eyeR ? 'eyeR' : a.eyes.L === 'lost' && !a.pros.eyeL ? 'eyeL' : null; if (!slot) slot = a.eyes.R === 'lost' && a.pros.eyeR !== 'crystaleye' && id === 'crystaleye' ? 'eyeR' : a.eyes.L === 'lost' && a.pros.eyeL !== 'crystaleye' && id === 'crystaleye' ? 'eyeL' : null; }
      else for (const p of it.part === 'arm' ? ['armR', 'armL'] : ['legR', 'legL']) {
        const l = a.limbs[p];
        if (l.state === 'lost' && (!a.pros[p] || IT[a.pros[p]].tier < it.tier)) { slot = p; break; }
      }
      if (!slot) return 'noslot';
      if (slot.startsWith('arm') || slot.startsWith('leg')) {
        const st = a.stumps.find(s => s.part === slot && !s.bandaged);
        if (st) return 'bleeding';
      }
      if (a.pros[slot]) this.give(a, a.pros[slot], 1, true);
      this.take(a, id);
      a.pros[slot] = id;
      if (slot.startsWith('eye')) {} else if (slot.startsWith('leg') && this.legUse(a, 'L') > 0 && this.legUse(a, 'R') > 0) a.chair = false;
      if (a.player) { this.stats.pros++; this.msg('Протез установлен: ' + it.name + '.', '#c8e0a0'); }
      this.emit('pros', { id, slot });
      return 'ok';
    }

    passTime(mins, rest) {
      const a = this.player;
      const steps = Math.ceil(mins / 30);
      for (let i = 0; i < steps; i++) {
        const m = Math.min(30, mins - i * 30);
        this.time += m;
        if (rest) {
          a.hp = Math.min(a.maxHp, a.hp + m / 6);
          for (const p in a.limbs) { const l = a.limbs[p]; if (l.state !== 'lost') l.hp = Math.min(l.max, l.hp + m / 8); }
          a.restT = (a.restT || 0) + m;
          if (a.restT >= 480) { for (const p in a.limbs) if (a.limbs[p].state === 'broken') { a.limbs[p].state = 'ok'; this.msg(D.PARTS[p] + ' срослась.', '#c8e0a0'); } a.restT = 0; }
        }
        a.stamina = 100;
        if (a.bleed > 0) { a.hp -= a.bleed * m; if (a.hp <= 0) { this.kill(a, null, 'bleed'); return; } }
        for (let k = 0; k < 6; k++) K.AI.director(this, m / 6);
        if (K.Quests) K.Quests.update(this, m);
        this.dailies();
        for (const w of this.wagons) K.AI.wagonSkip(this, w, m);
      }
      for (const b of this.actors) if (!b.player && !b.dead) K.AI.resetPos(this, b);
      this.updateCells();
    }

    canRest() {
      const p = this.player;
      return !this.near(p.x, p.z, 40, []).some(a => !a.dead && this.hostile(a, p) && (a.aware.get(p.id) || {}).known);
    }

    interactTarget(a) {
      const W = this.world, fx = Math.sin(a.yaw), fz = -Math.cos(a.yaw);
      let best = null, bs = Infinity;
      const consider = (obj, x, y, z, kind, label) => {
        const dx = x - a.x, dz = z - a.z, d = Math.hypot(dx, dz);
        if (d > 2.8 || Math.abs((y || a.y) - a.y) > 2.4) return;
        const dot = d > 0.3 ? (dx * fx + dz * fz) / d : 1;
        if (dot < 0.2) return;
        const s = d * (1.6 - dot);
        if (s < bs) { bs = s; best = { obj, kind, label }; }
      };
      for (const b of this.near(a.x, a.z, 3.5, [])) {
        if (b === a) continue;
        if (b.dead) consider(b, b.x, b.y, b.z, 'corpse', 'Обыскать: ' + (b.quad ? b.title : b.name));
        else if (!b.quad) consider(b, b.x, b.y, b.z, 'talk', (this.hostile(a, b) ? '' : 'Говорить: ') + b.name + (b.title && b.name !== b.title ? ' (' + b.title + ')' : ''));
      }
      for (const c of W.containers) consider(c, c.x, c.y, c.z, 'container', 'Открыть: ' + c.name);
      for (const u of W.uses) consider(u, u.x, u.y, u.z, 'use', this.useLabel(u));
      for (const w of this.wagons) if (!w.gone) consider(w, w.x - Math.sin(w.yaw) * 1.8, w.y, w.z + Math.cos(w.yaw) * 1.8, 'wagon', w.robbed ? 'Корован (разграблен)' : 'Обыскать корован');
      for (const d of this.drops) consider(d, d.x, d.y, d.z, 'drop', 'Поднять: ' + itemName(d.id) + (d.n > 1 ? ' ×' + d.n : ''));
      for (const s of this.stuck) if (this.time - s.t < 600) consider(s, s.x, s.y, s.z, 'arrow', 'Подобрать стрелу');
      for (const pc of this.pieces) { const p = pc.rag.p; consider(pc, p[3] || p[0], p[4] || p[1], p[5] || p[2], 'piece', pc.part === 'head' ? 'Голова' : 'Отрубленная ' + (pc.part.startsWith('arm') ? 'рука' : 'нога')); }
      if (a.torch) for (const id in W.burn) { const b = W.burn[id]; if (b.state === 'ok') { const d = Math.hypot(b.x - a.x, b.z - a.z); if (d < 6 && d < bs + 3) { best = { obj: b, kind: 'burn', label: 'Поджечь: ' + b.name }; bs = d; } } }
      return best;
    }
    useLabel(u) {
      if (u.kind === 'bed') return u.bed === 'house' ? (this.flags.house ? 'Спать в своём доме' : 'Чужая кровать') : u.bed === 'inn' ? 'Кровать в трактире' : 'Лечь спать';
      if (u.kind === 'chronicle') return 'Камень Летописи';
      if (u.kind === 'wartable') return 'Военный стол';
      if (u.kind === 'well') return 'Колодец';
      if (u.kind === 'fire') return 'Костёр';
      return u.kind;
    }
    interact(a) {
      const t = this.interactTarget(a);
      if (!t) return null;
      this.emit('interact', { kind: t.kind, obj: t.obj });
      if (t.kind === 'drop') {
        this.give(a, t.obj.id, t.obj.n);
        this.drops.splice(this.drops.indexOf(t.obj), 1);
        this.emit('sfx', { s: 'pickup', x: a.x, z: a.z });
      } else if (t.kind === 'arrow') {
        this.stuck.splice(this.stuck.indexOf(t.obj), 1);
        if (this.R() < 0.7) this.give(a, 'arrows', 1); else this.msg('Стрела сломалась.', '#c0c0c0');
      } else if (t.kind === 'burn') {
        if (this.ignite(t.obj.id, a)) { this.take(a, 'torch'); if (!this.has(a, 'torch')) a.torch = false; this.msg('Огонь пошёл по брёвнам.', '#ffb060'); }
      } else if (t.kind === 'piece') {
        this.msg(t.obj.owner === a.id ? 'Ваша собственная ' + (t.obj.part.startsWith('arm') ? 'рука' : t.obj.part === 'head' ? 'голова' : 'нога') + '. Пришить её никто не умеет.' : 'Чья-то ' + t.label.split(' ').pop().toLowerCase() + '.', '#c0b0a0');
      }
      return t;
    }

    loot(src, id, n, toPlayer) {
      const p = this.player;
      const inv = src.inv || src.items;
      if (id === 'gold') {
        const g = src.gold || 0; if (!g) return;
        src.gold = 0; this.addGold(p, g); this.msg('Взято золота: ' + g + '.', '#e0c070');
        this.onTake(src);
        return;
      }
      if (src.items) {
        const s = src.items.find(x => x[0] === id); if (!s) return;
        const k = Math.min(n || s[1], s[1]); s[1] -= k; if (s[1] <= 0) src.items.splice(src.items.indexOf(s), 1);
        this.give(p, id, k);
        this.onTake(src);
        return;
      }
      if (id.startsWith('pros:')) {
        const slot = id.slice(5), pr = src.pros[slot]; if (!pr) return;
        delete src.pros[slot]; this.give(p, pr, 1);
        this.msg('Вы сняли с тела протез: ' + itemName(pr) + '.', '#c8b090');
        return;
      }
      const s = inv.find(x => x.id === id); if (!s) return;
      const k = Math.min(n || s.n, s.n);
      this.take(src, id, k);
      this.give(p, id, k);
      this.onTake(src);
    }
    onTake(src) {
      if (src.id && typeof src.id === 'string' && src.fac && src.fac !== 'player' && src.fac !== this.pf && !src.wagon) {
        const p = this.player;
        for (const b of this.near(p.x, p.z, 11, [])) {
          if (b.dead || b.player || b.fac !== src.fac || b.quad) continue;
          if (!this.world.sightClear(b.x, b.y + 1.6, b.z, p.x, p.y + 1.2, p.z)) continue;
          b.hostile.add(p.id); b.aware.set(p.id, { known: true, s: 1 });
          if (!src.caught) { src.caught = true; this.msg(b.name + ' видит, как вы роетесь в сундуке!', '#ff8060'); this.crime(b, 'attack'); }
        }
      }
      if (src.wagon && !src.wagon.robbed) {
        const w = src.wagon; w.robbed = true; this.stats.robbed++;
        this.crime({ fac: w.fac, role: 'merchant' }, 'rob');
        this.emit('rob', { id: w.id, fac: w.fac, kind: w.kind });
        this.msg('Вы грабите корован!', '#ffd080');
      }
      if (src.id && typeof src.id === 'string' && src.fac && src.fac !== 'player' && src.fac !== this.pf && !src.stolen) {
        src.stolen = true;
        this.emit('steal', { id: src.id, fac: src.fac });
      }
      if (src.fac === this.pf && src.fac !== 'player' && typeof src.id === 'string' && !src.warned) { src.warned = true; }
    }
    lootList(src) {
      const out = [];
      if (src.gold) out.push({ id: 'gold', name: gold(src.gold), n: src.gold });
      if (src.items) for (const [id, n] of src.items) out.push({ id, name: itemName(id), n });
      else for (const s of src.inv || []) out.push({ id: s.id, name: itemName(s.id), n: s.n });
      if (src.pros && src.dead) for (const slot in src.pros) if (src.pros[slot]) out.push({ id: 'pros:' + slot, name: itemName(src.pros[slot]) + ' (протез)', n: 1 });
      return out;
    }

    shopOwner(shopId) { return this.actors.find(a => a.shop === shopId && !a.dead); }
    priceMod(shopId) {
      const S = D.SHOPS[shopId], owner = D.KINDS[S.owner];
      let m = 1;
      const fac = owner ? owner.fac : 'folk';
      const rep = this.rep[fac] || 0;
      m *= 1.15 - clamp(rep, -50, 100) / 400;
      m *= 1 - (this.player.skills.trade - 15) / 400;
      if (this.haggle[shopId] === 'ok') m *= 1 - (this.haggleCut || 0.15);
      if (this.haggle[shopId] === 'fail') m *= 1.1;
      return m;
    }
    buyPrice(shopId, id) {
      const S = D.SHOPS[shopId], it = IT[id];
      let p = it.price * this.priceMod(shopId);
      if (S.member && S.member === this.pf) { if (S.memberDiscount) p *= S.memberDiscount; if (S.prosDiscount && it.type === 'pros') p *= S.prosDiscount; }
      if (this.pf === 'emp' && it.type === 'pros' && this.reprimands === 0 && this.rep.emp > 0) p *= 0.5;
      return Math.max(1, Math.round(p));
    }
    sellPrice(shopId, id) {
      const it = IT[id];
      const m = it.type === 'goods' ? 0.6 : 0.42;
      return Math.max(0, Math.floor(it.price * m / Math.max(0.7, this.priceMod(shopId))));
    }
    shopBuys(shopId, id) {
      const S = D.SHOPS[shopId], it = IT[id];
      if (!it || it.type === 'quest' || it.hidden || !it.price) return false;
      if (S.buys === 'all') return true;
      if (S.buys === 'gear') return ['weapon', 'shield', 'armor', 'ammo', 'goods'].includes(it.type) || (it.type === 'pros' && shopId === 'forge');
      return Array.isArray(S.buys) && S.buys.includes(id);
    }
    buy(shopId, id) {
      const p = this.player, price = this.buyPrice(shopId, id);
      if (p.gold < price) return 'gold';
      p.gold -= price;
      this.give(p, id, id === 'arrows' ? 10 : 1, true);
      this.emit('buy', { shop: shopId, id, price });
      this.emit('sfx', { s: 'coins', x: p.x, z: p.z });
      return 'ok';
    }
    sell(shopId, id) {
      const p = this.player;
      if (!this.shopBuys(shopId, id)) return 'no';
      const n = id === 'arrows' ? Math.min(10, this.count(p, id)) : 1;
      if (!this.take(p, id, n)) return 'no';
      const pr = this.sellPrice(shopId, id) * n;
      this.addGold(p, pr);
      this.emit('sfx', { s: 'coins', x: p.x, z: p.z });
      return 'ok';
    }
    tryHaggle(shopId) {
      if (this.haggle[shopId]) return this.haggle[shopId];
      const p = this.player, S = D.SHOPS[shopId], owner = D.KINDS[S.owner];
      const chance = 0.3 + (p.skills.trade - 15) / 120 + (this.rep[owner ? owner.fac : 'folk'] || 0) / 400;
      const ok = this.R() < clamp(chance, 0.08, 0.92);
      this.haggle[shopId] = ok ? 'ok' : 'fail';
      this.haggleCut = 0.1 + this.R() * 0.15;
      this.xp(p, 'trade', ok ? 2.5 : 1);
      return this.haggle[shopId];
    }
    healCost(shopId) {
      const p = this.player, S = D.SHOPS[shopId];
      if (S.freeHeal && this.pf === 'elf') return 0;
      let c = 20;
      for (const k in p.limbs) if (p.limbs[k].state === 'broken') c += 18;
      if (p.bleed > 0) c += 20;
      c += Math.round((p.maxHp - p.hp) * 0.3);
      if (S.member === this.pf) c = Math.round(c * 0.5);
      return Math.round(c * this.priceMod(shopId));
    }
    serviceHeal(shopId) {
      const p = this.player, c = this.healCost(shopId);
      if (p.gold < c) return 'gold';
      p.gold -= c; this.healFull(p); this.passTime(60, false);
      this.msg(c ? 'Вас вылечили за ' + c + ' зол.' : 'Вас вылечили даром: свои своих не бросают.', '#c8e0a0');
      return 'ok';
    }
    serviceFit(shopId, id) {
      const p = this.player, fee = shopId === 'pros' ? 30 : 15;
      if (p.gold < fee) return 'gold';
      const r = this.fitPros(p, id, true);
      if (r === 'ok') { p.gold -= fee; this.passTime(120, false); }
      return r;
    }
    serviceRoom() {
      const p = this.player;
      if (p.gold < 5) return 'gold';
      if (!this.canRest()) return 'danger';
      p.gold -= 5; this.passTime(480, true);
      this.msg('Вы проспали ночь в трактире.', '#c8e0a0');
      return 'ok';
    }
    buyHouse() {
      const p = this.player, price = 1500;
      if (this.flags.house) return 'have';
      if (p.gold < price) return 'gold';
      p.gold -= price; this.flags.house = true;
      const c = this.world.containers.find(x => x.id === 'house_chest'); if (c) c.fac = 'player';
      this.msg('Теперь у вас есть дом в Развилках! Кровать и сундук ваши.', '#ffd080');
      this.emit('house', {});
      return 'ok';
    }
    sleepAt(u) {
      if (u.bed === 'house' && !this.flags.house) return 'notyours';
      if (u.bed === 'inn') return 'inn';
      if (u.bed === 'barracks' && this.pf !== 'emp') return 'notyours';
      if (u.bed === 'fort' && this.pf !== 'evil') return 'notyours';
      if (u.bed === 'elfhome' && this.pf !== 'elf') return 'notyours';
      if (!this.canRest()) return 'danger';
      this.passTime(480, true);
      this.msg('Вы выспались.', '#c8e0a0');
      return 'ok';
    }
    recruit() {
      const p = this.player, price = 60;
      if (this.pf !== 'evil') return 'no';
      if (p.gold < price) return 'gold';
      p.gold -= price;
      const s = this.world.spots.fort_yard;
      const r = this.spawn(this.R() < 0.25 ? 'evilxbow' : 'recruit', s.x + (this.R() - 0.5) * 6, s.z + (this.R() - 0.5) * 6, { role: 'soldier', home: 'fort', tags: ['army'] });
      r.ai.follow = p.id; r.ai.order = 'follow'; r.tags.add('army'); r.fac = 'evil';
      this.emit('recruit', { id: r.id });
      this.msg(r.name + ' вступил в ваше войско.', '#d0c0ff');
      return 'ok';
    }
    army() { return this.actors.filter(a => !a.dead && a.tags.has('army')); }

    serA(a) {
      return {
        id: a.id, kind: a.kind, fac: a.fac, name: a.name, title: a.title, role: a.role, x: +a.x.toFixed(2), y: +a.y.toFixed(2), z: +a.z.toFixed(2), yaw: +a.yaw.toFixed(3),
        hp: a.hp, maxHp: a.maxHp, limbs: a.limbs, eyes: a.eyes, pros: a.pros, chair: a.chair, bleed: a.bleed, stumps: a.stumps, stamina: a.stamina,
        inv: a.inv, gold: a.gold, equip: a.equip, drawn: a.drawn, slot: a.slot, torch: a.torch, skills: a.skills, skillXp: a.skillXp, hostile: [...a.hostile], tags: [...a.tags],
        home: a.home, scale: a.scale, female: a.female, elf: a.elf, beard: a.beard, crown: a.crown, colors: a.colors, disguised: a.disguised, shop: a.shop, ai: K.AI.serAI(a), dead: a.dead, deadT: a.deadT,
        aware: [...a.aware].filter(([, v]) => v.known).map(([k]) => k), joints: a.dead && a.rag ? Array.from(a.rag.p).map(v => +v.toFixed(2)) : null, ragOn: a.dead && a.rag ? Array.from(a.rag.on) : null, quad: a.quad, kindBody: a.kindBody, ammoMax: a.ammoMax
      };
    }
    serialize() {
      const W = this.world;
      return {
        v: 1, seed: this.seed, time: this.time, pf: this.pf, rep: this.rep, pools: this.pools, stats: this.stats, flags: this.flags, reprimands: this.reprimands, wageDay: this.wageDay, nextId: this.nextId, lastDay: this.lastDay,
        player: this.serA(this.player),
        actors: this.actors.filter(a => !a.player).map(a => this.serA(a)),
        burn: W.burn, gates: W.gates,
        containers: W.containers.map(c => ({ id: c.id, items: c.items, gold: c.gold, fac: c.fac, stolen: c.stolen })),
        drops: this.drops, stuck: this.stuck.slice(-30), decals: this.decals.slice(-80),
        wagons: this.wagons.filter(w => !w.gone).map(w => K.AI.serWagon(w)), squads: this.squads.map(s => K.AI.serSquad(s)), director: this.director,
        quest: this.quest ? JSON.parse(JSON.stringify(this.quest)) : null,
        pieces: this.pieces.slice(-20).map(pc => ({ p: Array.from(pc.rag.p).map(v => +v.toFixed(2)), ids: pc.rag.ids, part: pc.part, cut: pc.cut, look: pc.look, owner: pc.owner }))
      };
    }
    restoreActor(s) {
      const a = this.spawn(s.kind, s.x, s.z, { noGear: true, name: s.name, player: s.id === (this._pid || -1) });
      this.byId.delete(a.id);
      Object.assign(a, {
        id: s.id, fac: s.fac, title: s.title, role: s.role, x: s.x, y: s.y, z: s.z, yaw: s.yaw, hp: s.hp, maxHp: s.maxHp, limbs: s.limbs, eyes: s.eyes, pros: s.pros || {}, chair: !!s.chair,
        bleed: s.bleed, stumps: s.stumps || [], stamina: s.stamina, inv: s.inv, gold: s.gold, equip: s.equip, drawn: s.drawn, slot: s.slot || 'melee', torch: !!s.torch, skills: s.skills, skillXp: s.skillXp || {},
        hostile: new Set(s.hostile || []), tags: new Set(s.tags || []), home: s.home, scale: s.scale, female: s.female, elf: s.elf, beard: s.beard, crown: s.crown, colors: s.colors, disguised: s.disguised, shop: s.shop,
        dead: !!s.dead, deadT: s.deadT || 0, quad: s.quad, kindBody: s.kindBody, ammoMax: s.ammoMax || 0
      });
      for (const k of s.aware || []) a.aware.set(k, { known: true, s: 1 });
      this.byId.set(a.id, a);
      K.AI.deserAI(this, a, s.ai || {});
      if (a.dead && s.joints) {
        const nj = a.quad ? B.QNJ : B.NJ;
        a.rag = new B.Ragdoll(Float32Array.from(s.joints), nj, a.quad ? B.QRAG_LINKS : B.RAG_LINKS, null, { rad: 0.07 });
        if (s.ragOn) { const off = []; s.ragOn.forEach((v, j) => { if (!v) off.push(j); }); if (off.length) a.rag.remove(off); }
        a.rag.asleep = true;
        a.joints = Float32Array.from(s.joints);
      }
      return a;
    }
    restore(s) {
      this.time = s.time; this.pf = s.pf; this.rep = s.rep; this.pools = s.pools; this.stats = s.stats; this.flags = s.flags || {}; this.reprimands = s.reprimands || 0; this.wageDay = s.wageDay != null ? s.wageDay : -1; this.lastDay = s.lastDay;
      this._pid = s.player.id;
      this.player = this.restoreActor(s.player);
      this.player.player = true;
      for (const x of s.actors) this.restoreActor(x);
      this.nextId = Math.max(s.nextId, ...this.actors.map(a => a.id + 1));
      const W = this.world;
      for (const id in s.burn) if (W.burn[id]) Object.assign(W.burn[id], s.burn[id]);
      for (const id in s.gates) if (W.gates[id]) Object.assign(W.gates[id], s.gates[id]);
      W.rebuildNavColliders();
      for (const c of s.containers || []) { const w = W.containers.find(x => x.id === c.id); if (w) Object.assign(w, c); }
      this.drops = s.drops || []; this.stuck = s.stuck || []; this.decals = s.decals || [];
      this.director = s.director || null;
      this.quest = s.quest || null;
      this.wagons = (s.wagons || []).map(w => K.AI.deserWagon(this, w)).filter(Boolean);
      this.squads = (s.squads || []).map(q => K.AI.deserSquad(this, q)).filter(Boolean);
      for (const pc of s.pieces || []) {
        const n = pc.ids.length, links = []; for (let k = 0; k < n - 1; k++) links.push([k, k + 1]);
        const rag = new B.Ragdoll(Float32Array.from(pc.p), n, links, null, { rad: 0.06 }); rag.ids = pc.ids; rag.asleep = true;
        this.pieces.push({ rag, part: pc.part, cut: pc.cut, look: pc.look, owner: pc.owner, t: 0 });
      }
      this.input.yaw = this.player.yaw;
      this.updateCells();
      if (K.Quests) K.Quests.restored(this);
    }
  }

  Game.DT = DT;
  Game.deserialize = (data, opts) => new Game(Object.assign({}, opts || {}, { seed: data.seed, faction: data.pf, save: data }));
  K.Game = Game;
  K.itemName = itemName;
})(globalThis.Korovany = globalThis.Korovany || {});
