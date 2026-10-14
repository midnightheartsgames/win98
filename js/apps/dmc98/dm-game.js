(function (S) {
  'use strict';
  const { clamp, lerp, wrapAng } = S;
  const D = S.DATA, PL = D.PLAYER;
  const DT = 1 / 60;
  const PI = Math.PI;

  function defaultSave() {
    return { orbs: 0, souls: 0, items: { vitalS: 2, vitalL: 0, devilStar: 0, holyWater: 0, goldOrb: 0 }, bought: {}, skills: {}, skillCount: 0, blue: 0, frags: 0, purple: 0, dt: false, took: {} };
  }

  class Game {
    constructor(o = {}) {
      this.o = o;
      this.mi = o.mission || 0; this.M = S.MISSIONS[this.mi];
      this.diffIx = o.diff == null ? 1 : o.diff; this.diff = D.DIFF[this.diffIx];
      this.save = Object.assign(defaultSave(), JSON.parse(JSON.stringify(o.save || {})));
      this.save.items = Object.assign(defaultSave().items, this.save.items); this.save.took = this.save.took || {};
      this.rng = S.RNG(o.seed || 1);
      this.events = []; this.msgs = [];
      this.flags = {}; this.areaState = {};
      this.stats = { time: 0, style: 0, orbs: 0, items: 0, deaths: 0, dmg: 0, kills: 0 };
      this.style = { sp: 0, rank: 0, hist: [], flash: 0, last: '' };
      this.t = 0; this.hitstop = 0; this.shake = 0; this.slowmo = 0;
      this.tokens = new Set();
      this.player = S.newPlayer(this);
      this.state = 'play';
      this.hooks = (S.HOOKS && S.HOOKS[this.M.id]) || {};
      this.enterArea(this.M.start[0], this.M.start[1], true);
      const intro = () => { this.flags.introDone = true; this.ev({ t: 'missionCard' }); this.hook('introEnd'); };
      if (!o.skipIntro && this.M.intro) this.startCut(this.M.intro, intro); else intro();
    }
    get maxHp() { return PL.hp + this.save.blue * 10 + Math.floor(this.save.frags / 4) * 10; }
    get dtMax() { return (PL.dtBars + this.save.purple) * PL.dtBar; }
    has(skill) { return !!this.save.skills[skill]; }
    hook(name, ...a) { const f = this.hooks[name]; if (f) f(this, ...a); }
    ev(o) { this.events.push(o); return o; }
    sfx(s, x, y, z, v = 1) { this.ev({ t: 'sfx', s, x, y, z, v }); }
    msg(text, dur = 3.5, kind = 'info') { this.msgs.push({ text, t: dur, kind }); if (this.msgs.length > 4) this.msgs.shift(); }

    aState(id) { return this.areaState[id] || (this.areaState[id] = { fights: {}, breaks: {}, orbs: {}, items: {}, hints: {} }); }
    enterArea(id, spawnId, first) {
      const def = S.area(id);
      this.areaId = id; this.def = def; this.W = new S.World(def); this.env = def.env;
      const as = this.aState(id);
      this.foes = []; this.shots = []; this.pickups = []; this.objs = []; this.fight = null; this.boss = null; this.hazT = 0; this.woodsHint = null; this.extraFights = [];
      this.sealed = false; this.tokens.clear();
      for (const b of def.breakables) { const k = `${b.x},${b.z}`; if (!as.breaks[k]) this.objs.push({ kind: 'break', b, key: k, x: b.x, y: b.y, z: b.z, hp: 1, r: 0.6 }); }
      def.orbs.forEach((o, i) => { if (!as.orbs[i]) this.objs.push({ kind: 'cluster', i, x: o.x, y: o.y, z: o.z, n: o.n, r: 0.8 }); });
      for (const it of def.items) if (!as.items[it.id] && !this.save.took[it.id] && !this.flags[it.id]) this.objs.push({ kind: 'item', id: it.id, x: it.x, y: it.y, z: it.z, key: it.key, r: 1 });
      for (const s of def.statues) this.objs.push({ kind: 'statue', x: s.x, y: s.y, z: s.z, face: s.face, r: 1 });
      for (const g of def.grips) this.objs.push({ kind: 'grip', x: g.x, y: g.y, z: g.z });
      for (const s of def.switches) this.objs.push({ kind: 'switch', id: s.id, flag: s.flag, x: s.x, y: s.y, z: s.z, r: 0.8, on: !this.flags[s.flag] });
      this.barriers = def.barriers.map(b => { const box = { x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1, y0: -1, y1: 8, on: !this.flags[b.flag], bar: b }; this.W.dyn.push(box); return box; });
      this.seals = def.doors.map(d => { const fx = Math.sin(d.face), fz = Math.cos(d.face), side = Math.abs(fx) > 0.5; const box = side ? { x0: d.x - 0.5, x1: d.x + 0.5, z0: d.z - d.w / 2, z1: d.z + d.w / 2 } : { x0: d.x - d.w / 2, x1: d.x + d.w / 2, z0: d.z - 0.5, z1: d.z + 0.5 }; Object.assign(box, { y0: d.y - 1, y1: d.y + 8, on: false, door: d }); this.W.dyn.push(box); return box; });
      for (const sp of def.special) S.initSpecial(this, sp);
      const p = this.player;
      let sp = def.spawns[spawnId];
      const door = def.doors.find(d => d.id === spawnId);
      if (door) sp = { x: door.x + Math.sin(door.face) * 2.4, y: door.y, z: door.z + Math.cos(door.face) * 2.4, face: door.face };
      if (!sp) sp = def.spawns.start || { x: 0, y: 0, z: 0, face: 0 };
      p.x = sp.x; p.z = sp.z; p.y = Math.max(sp.y || 0, this.W.groundAt(sp.x, sp.z, 0.3, (sp.y || 0) + 1)); p.face = sp.face; p.vx = p.vy = p.vz = 0;
      p.ground = true; p.st = 'move'; p.move = null; p.lock = null; p.doorCool = 0.8; p.safe = [p.x, p.y, p.z];
      this.check = { area: id, spawn: spawnId };
      this.ev({ t: 'area', id });
      if (!first) this.hook('enter', id);
      this.hook('area_' + id);
    }

    startCut(id, onEnd) {
      const c = S.CUTS && S.CUTS[id];
      if (!c || this.o.noCuts) { if (onEnd) onEnd(); return; }
      this.cut = S.cutRuntime(this, c, onEnd);
      this.state = 'cut';
      this.ev({ t: 'cut', id });
    }
    endCut() {
      const c = this.cut; if (!c) return;
      this.cut = null; if (this.state === 'cut') this.state = 'play';
      this.ev({ t: 'cutEnd' });
      if (c.onEnd) c.onEnd();
    }

    startFight(id) {
      const f = this.def.fights.find(q => q.id === id) || (this.extraFights || []).find(q => q.id === id); if (!f || this.aState(this.areaId).fights[id] || this.fight) return;
      this.flags['started_' + id] = true;
      this.fight = { def: f, wave: -1, wait: 0.2, pend: null };
      if (f.seal !== false) this.setSeal(true, f.zone);
      this.ev({ t: 'music', m: 'battle' });
    }
    setSeal(on, zone) {
      this.sealed = on;
      for (const s of this.seals) {
        const d = s.door;
        s.on = on && (!zone || (d.x >= zone[0] - 2 && d.x <= zone[2] + 2 && d.z >= zone[1] - 2 && d.z <= zone[3] + 2));
      }
      if (on) this.sfx('seal'); else this.sfx('unseal');
    }
    updateFight() {
      const F = this.fight; if (!F) return;
      const alive = this.foes.filter(e => !e.dead && !e.boss && !e.minion).length;
      if (F.pend) return;
      if (alive > 0) return;
      F.wait -= DT; if (F.wait > 0) return;
      const def = F.def;
      if (F.wave + 1 >= def.waves.length) {
        this.aState(this.areaId).fights[def.id] = true; this.fight = null;
        if (this.sealed) this.setSeal(false);
        this.ev({ t: 'music', m: 'explore' });
        this.hook('fight_' + def.id);
        return;
      }
      F.wave++;
      const cut = def.introCut && def.introCut[F.wave];
      const spawn = () => { for (const w of def.waves[F.wave]) S.spawnFoe(this, w.type, w.x, w.z, w); F.wait = 0.9; F.pend = null; };
      if (cut && !this.flags['seen_' + cut]) { this.flags['seen_' + cut] = true; F.pend = true; this.startCut(cut, spawn); }
      else spawn();
    }

    tryDoors() {
      const p = this.player; if (p.doorCool > 0 || !p.ground || p.st !== 'move') return;
      for (const d of this.def.doors) {
        const fx = Math.sin(d.face), fz = Math.cos(d.face), dx = p.x - d.x, dz = p.z - d.z;
        const along = Math.abs(dx * fz - dz * fx), perp = dx * fx + dz * fz;
        if (along > d.w / 2 || perp > 1 || perp < -1.2 || Math.abs(p.y - d.y) > 1.5) continue;
        const into = -(p.vx * fx + p.vz * fz);
        if (into <= 0.5) continue;
        if (this.sealed && this.seals.find(s => s.door === d && s.on)) { this.hintMsg('Демоническая печать. Сначала победите врагов.'); return; }
        if (d.need && !this.flags[d.need]) { this.hintMsg(d.lockMsg || 'Заперто.'); return; }
        if (d.woods) { S.woodsDoor(this, d); return; }
        if (!d.to) { this.hintMsg(d.lockMsg || 'Заперто.'); return; }
        this.goDoor(d.to);
        return;
      }
    }
    hintMsg(text) { if (this.lastHint === text && this.t - this.lastHintT < 3) return; this.lastHint = text; this.lastHintT = this.t; this.msg(text, 3); }
    goDoor(to, fx = 'door') {
      const [area, door] = to.split(':');
      this.transition = { t: 0, area, door, fx };
      this.player.st = 'door'; this.player.vx = this.player.vz = 0;
      this.sfx(fx === 'door' ? 'door' : 'whoosh');
    }

    pickupOrb(o) {
      const p = this.player;
      if (o.kind === 'red') { const v = Math.round(o.v); this.save.orbs += v; this.stats.orbs += v; this.sfx('orb', o.x, o.y, o.z, 0.7); }
      else if (o.kind === 'green') { p.hp = Math.min(this.maxHp, p.hp + o.v); this.sfx('heal'); }
      else if (o.kind === 'white') { if (this.save.dt) p.dt = Math.min(this.dtMax, p.dt + o.v); this.sfx('orbw'); }
      this.ev({ t: 'orbget', kind: o.kind });
    }
    dropOrbs(x, y, z, n, kind = 'red', v = 1) {
      const count = Math.min(14, Math.max(1, Math.round(n / (kind === 'red' ? 3 : 1))));
      const each = kind === 'red' ? n / count : v;
      for (let i = 0; i < count; i++) {
        const a = this.rng() * PI * 2, s = 2 + this.rng() * 3;
        this.pickups.push({ kind, v: each, x, y: y + 0.8, z, vx: Math.sin(a) * s, vy: 4 + this.rng() * 4, vz: Math.cos(a) * s, t: 0 });
      }
    }
    updatePickups() {
      const p = this.player;
      for (const o of this.pickups) {
        o.t += DT;
        const dx = p.x - o.x, dy = p.y + 1 - o.y, dz = p.z - o.z, d = Math.hypot(dx, dy, dz);
        if (o.t > 0.45 && (d < 5 || o.t > 6)) { const s = Math.min(24, 8 + o.t * 6) / (d || 1); o.x += dx * s * DT; o.y += dy * s * DT; o.z += dz * s * DT; }
        else {
          o.vy -= 18 * DT; o.x += o.vx * DT; o.y += o.vy * DT; o.z += o.vz * DT; o.vx *= 0.97; o.vz *= 0.97;
          const g = this.W.groundAt(o.x, o.z, 0.1, o.y + 0.5) + 0.3; if (o.y < g) { o.y = g; o.vy = Math.abs(o.vy) * 0.4; }
        }
        if (d < 0.9 && o.t > 0.3) { o.got = true; this.pickupOrb(o); }
      }
      this.pickups = this.pickups.filter(o => !o.got);
    }

    styleHit(key, pts, air) {
      const S0 = this.style, R = D.RANKS;
      const same = S0.hist.filter(k => k === key).length;
      let v = pts / (1 + 0.7 * same) * (air ? 1.2 : 1);
      if (this.player.dtOn) v *= 1.1;
      S0.hist.push(key); if (S0.hist.length > 6) S0.hist.shift();
      S0.sp = Math.min(D.STYLE_MAX, S0.sp + v);
      S0.idle = 0;
      this.stats.style += v * R[S0.rank].mul;
      this.updateRank();
    }
    updateRank() {
      const S0 = this.style, R = D.RANKS; let r = 0;
      for (let i = 0; i < R.length; i++) if (S0.sp >= R[i].need) r = i;
      if (r > S0.rank) { this.ev({ t: 'rank', r }); S0.flash = 1; }
      S0.rank = r;
    }
    styleHurt() {
      const S0 = this.style, R = D.RANKS;
      S0.sp = S0.rank >= 2 ? R[S0.rank - 2].need : 0; S0.hist.length = 0; this.updateRank();
    }
    updateStyle() {
      const S0 = this.style, R = D.RANKS;
      const active = this.foes.some(e => !e.dead && !e.spawnT);
      S0.idle = (S0.idle || 0) + DT;
      const dec = R[S0.rank].decay * (active ? 1 : 3) * (S0.idle > 1.2 ? 1 : 0.35);
      S0.sp = Math.max(0, S0.sp - dec * DT);
      S0.flash = Math.max(0, S0.flash - DT * 2);
      this.updateRank();
    }

    useItem(id) {
      const p = this.player, it = D.ITEMS[id];
      if (!it || !this.save.items[id] || p.dead || this.cut) return false;
      if (id === 'vitalS' || id === 'vitalL') { if (p.hp >= this.maxHp) return false; p.hp = id === 'vitalS' ? Math.min(this.maxHp, p.hp + 35) : this.maxHp; this.sfx('heal'); }
      else if (id === 'devilStar') { if (!this.save.dt) return false; p.dt = this.dtMax; this.sfx('orbw'); }
      else if (id === 'holyWater') { for (const e of this.foes) if (!e.dead) S.hitFoe(this, e, { dmg: 160, stun: 1.2, kb: 3, knock: !e.boss, key: 'holy', raw: true }); this.ev({ t: 'flash', c: [1, 1, 0.9], a: 0.9 }); this.sfx('holy'); }
      else return false;
      this.save.items[id]--; this.stats.items++;
      this.msg(it.name, 1.5);
      return true;
    }

    hurtPlayer(dmg, from, o = {}) { S.hurtPlayer(this, dmg, from, o); }

    die() {
      const p = this.player;
      if (this.save.items.goldOrb > 0) {
        this.save.items.goldOrb--; this.stats.items++; p.hp = this.maxHp; p.st = 'move'; p.dead = false; p.invul = 2;
        this.ev({ t: 'flash', c: [1, 0.85, 0.3], a: 1 }); this.sfx('revive'); this.msg('Золотая сфера: воскрешение!', 2.5);
        return;
      }
      p.dead = true; p.st = 'dead'; p.mt = 0; this.state = 'dead'; this.deadT = 0;
      this.sfx('death'); this.ev({ t: 'music', m: 'none' });
    }
    continueGame() {
      this.stats.deaths++;
      const p = this.player; p.hp = this.maxHp; p.dead = false; p.dt = Math.max(p.dt, 0); p.dtOn = false; p.invul = 1;
      if (this.fight) this.fight = null;
      this.state = 'play';
      this.style.sp = 0; this.updateRank();
      this.flags.retry = true;
      this.enterArea(this.check.area, this.check.spawn);
      this.ev({ t: 'music', m: this.env.music || 'explore' });
    }

    grade() {
      const par = this.M.par, s = this.stats;
      const g = (v, par, inv) => { const k = inv ? par / Math.max(1, v) : v / Math.max(1, par); return k >= 1 ? 4 : k >= 0.75 ? 3 : k >= 0.5 ? 2 : k >= 0.3 ? 1 : 0; };
      const gt = g(s.time, par.time, true), gs = g(s.style, par.style), go = g(s.orbs, par.orbs);
      let avg = (gt + gs + go) / 3 - s.deaths * 0.7 - Math.min(1, s.items * 0.2);
      let r = avg >= 3.7 ? 4 : avg >= 2.8 ? 3 : avg >= 1.9 ? 2 : avg >= 1 ? 1 : 0;
      if (gt === 4 && gs === 4 && go === 4 && !s.deaths && !s.items) r = s.dmg < 40 ? 6 : 5;
      return { time: gt, style: gs, orbs: go, rank: r };
    }
    clearMission() {
      if (this.cleared) return;
      this.cleared = true; this.state = 'clear';
      const g = this.grade(), souls = D.GRADE_SOULS[g.rank] + (this.bossSouls || 0), bonus = D.GRADE_ORBS[g.rank];
      this.save.souls += souls; this.save.orbs += bonus;
      this.result = Object.assign({ souls, bonus }, g, { stats: Object.assign({}, this.stats) });
      this.ev({ t: 'clear' });
    }

    tick(inp = {}) {
      if (this.events.length > 400) this.events.length = 0;
      const p = this.player;
      for (const m of this.msgs) m.t -= DT; this.msgs = this.msgs.filter(m => m.t > 0);
      if (this.state === 'clear') return;
      if (this.cut) { S.updateCut(this, inp); return; }
      if (this.transition) {
        const T = this.transition; T.t += DT;
        if (T.t >= 0.45 && !T.done) { T.done = true; this.enterArea(T.area, T.door); }
        if (T.t >= 0.9) this.transition = null;
        return;
      }
      if (this.state === 'dead') { this.deadT += DT; S.updatePlayer(this, {}); return; }
      this.t += DT; this.stats.time += DT;
      if (inp.item) this.useItem(inp.item);
      if (this.hitstop > 0) { this.hitstop -= DT; S.bufferInput(this, inp); return; }
      S.updatePlayer(this, inp);
      for (const e of this.foes) S.updateFoe(this, e);
      this.foes = this.foes.filter(e => !e.gone);
      S.updateShots(this);
      this.updatePickups();
      S.updateObjects(this, inp);
      this.updateFight();
      S.updateTriggers(this);
      this.tryDoors();
      this.updateStyle();
      this.shake = Math.max(0, this.shake - DT * 2.5);
    }
  }

  S.Game = Game; S.GAME = { DT }; S.defaultSave = defaultSave;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Dmc98 = globalThis.Dmc98 || {});
