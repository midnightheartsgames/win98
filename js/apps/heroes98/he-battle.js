(function (H) {
  'use strict';
  const BT = H.BATTLE;
  const NB = [[[1, 0], [-1, 0], [0, -1], [-1, -1], [0, 1], [-1, 1]], [[1, 0], [-1, 0], [1, -1], [0, -1], [1, 1], [0, 1]]];
  const U = s => H.UNITS[s.unit];
  const F = s => H.FACTIONS[U(s).faction] || {};
  const inside = (c, r) => c >= 0 && r >= 0 && c < BT.cols && r < BT.rows;
  const idx = (c, r) => r * BT.cols + c;

  const Hex = {
    inside,
    idx,
    near: (c, r) => NB[r & 1].map(d => [c + d[0], r + d[1]]).filter(p => inside(p[0], p[1])),
    dist(c1, r1, c2, r2) {
      const dx = c1 - (r1 - (r1 & 1)) / 2 - (c2 - (r2 - (r2 & 1)) / 2), dz = r1 - r2;
      return Math.max(Math.abs(dx), Math.abs(dz), Math.abs(dx + dz));
    }
  };

  const cellsAt = (s, c, r) => (U(s).big ? [[c, r], [c + (s.side ? 1 : -1), r]] : [[c, r]]);
  const cells = s => cellsAt(s, s.c, s.r);
  const alive = B => B.stacks.filter(s => s.count > 0);
  const hpOf = s => Math.max(1, Math.round(U(s).hp * (1 + s.hpPct)));
  const total = s => (s.count > 0 ? (s.count - 1) * hpOf(s) + s.hp : 0);
  const fxs = (s, k) => s.fx.reduce((t, e) => t + (typeof e[k] === 'number' ? e[k] : 0), 0);
  const fxHas = (s, k) => s.fx.some(e => e[k]);

  const occupancy = (B, skip) => {
    const o = new Int16Array(BT.cols * BT.rows).fill(-1);
    for (const p of B.obstacles) o[idx(p[0], p[1])] = -2;
    for (const s of B.stacks) if (s.count > 0 && s !== skip) for (const p of cells(s)) o[idx(p[0], p[1])] = s.id;
    return o;
  };
  const fits = (o, s, c, r) => cellsAt(s, c, r).every(p => inside(p[0], p[1]) && o[idx(p[0], p[1])] === -1);
  const gap = (a, c, r, b) => {
    let d = Infinity;
    for (const p of cellsAt(a, c, r)) for (const q of cells(b)) d = Math.min(d, Hex.dist(p[0], p[1], q[0], q[1]));
    return d;
  };
  const touching = (a, c, r, b) => gap(a, c, r, b) === 1;
  const enemyNear = (B, s, c, r) => alive(B).some(t => t.side !== s.side && touching(s, c, r, t));
  const canShoot = (B, s) => s.shots > 0 && !enemyNear(B, s, s.c, s.r) && !(B.sides[s.side].noShoot >= B.round);

  const reach = (B, s) => {
    const o = occupancy(B, s), u = U(s), out = new Map();
    const start = { c: s.c, r: s.r, steps: 0, path: [[s.c, s.r]] };
    out.set(idx(s.c, s.r), start);
    if (fxHas(s, 'noMove') || fxHas(s, 'frozen')) return out;
    if (u.fly) {
      for (let r = 0; r < BT.rows; r++) {
        for (let c = 0; c < BT.cols; c++) {
          const d = Hex.dist(s.c, s.r, c, r);
          if (d > 0 && d <= u.speed && fits(o, s, c, r)) out.set(idx(c, r), { c, r, steps: d, path: [[s.c, s.r], [c, r]] });
        }
      }
      return out;
    }
    let front = [start];
    for (let step = 1; step <= u.speed && front.length; step++) {
      const next = [];
      for (const f of front) {
        for (const [c, r] of Hex.near(f.c, f.r)) {
          const k = idx(c, r);
          if (out.has(k) || !fits(o, s, c, r)) continue;
          const n = { c, r, steps: step, path: [...f.path, [c, r]] };
          out.set(k, n);
          next.push(n);
        }
      }
      front = next;
    }
    return out;
  };
  const spots = (B, s, t, rc) => [...(rc || reach(B, s)).values()].filter(p => touching(s, p.c, p.r, t));

  const NONE = {};
  const heroOf = (B, s) => B.sides[s.side].hero || NONE;
  const atkOf = s => U(s).atk + s.atkPlus + s.lament - s.chill + fxs(s, 'atk');
  const defOf = (s, pierce) => (U(s).def + s.defPlus + fxs(s, 'def')) * (1 + fxs(s, 'defPct')) * (s.defending ? 1 + BT.defendBonus + s.stand : 1) * (1 - pierce);
  const initOf = s => Math.max(1, Math.round((U(s).init + s.initPlus) * (1 + fxs(s, 'initPct'))));

  const moraleOf = (B, s) => {
    let up = 0, down = 0;
    for (const t of alive(B)) {
      const a = U(t).aura;
      if (!a || t === s || !touching(s, s.c, s.r, t)) continue;
      if (a.side === 'own' && t.side === s.side) up = Math.max(up, a.morale);
      if (a.side === 'enemy' && t.side !== s.side) down = Math.min(down, a.morale);
    }
    const side = B.sides[s.side], boost = side.boost && B.round <= side.boost.until ? side.boost.morale : 0, moon = B.moon && B.moon.people.includes(U(s).faction) ? 1 : 0;
    return H.clamp(side.morale - side.mix + boost + moon + fxs(s, 'morale') + up + down, -BT.statCap, BT.statCap);
  };
  const luckOf = (B, s) => H.clamp(B.sides[s.side].luck, -BT.statCap, BT.statCap);

  const shotKind = k => k === 'shot' || k === 'saddle';
  const closeKind = k => k === 'melee' || k === 'retal' || k === 'support';
  const mult = (B, a, d, kind, ctx) => {
    const u = U(a), A = heroOf(B, a), D = heroOf(B, d), shot = shotKind(kind), close = closeKind(kind);
    let m = H.damageMult(atkOf(a), defOf(d, shot ? u.pierce || 0 : 0));
    if (shot && !A.aim && gap(a, ctx.c, ctx.r, d) > BT.far) m *= BT.farMul;
    if ((kind === 'melee' || kind === 'retal') && u.shots) m *= BT.meleeShooter;
    if (kind === 'saddle') m *= u.saddle;
    if (kind === 'bell') m *= u.bell.mul;
    if (kind === 'support') m *= (A.formation || F(a).formation) + (A.formationAdd || 0);
    if (kind === 'melee' && u.dive && ctx.flown >= u.dive.from) m *= 1 + u.dive.bonus;
    if (close) m *= 1 + (A.melee || 0);
    if (shot) m *= 1 + (A.ranged || 0);
    if (kind === 'retal') m *= 1 + (A.retal || 0);
    if (close && A.finish && total(d) * 2 < d.start * hpOf(d)) m *= 1 + A.finish;
    if (A.gun && A.gun.units.includes(a.unit)) m *= 1 + A.gun.dmg;
    if (close) m *= 1 - (D.guard || 0);
    m *= 1 + fxs(a, 'dmgPct');
    if (close) m *= 1 - fxs(d, 'closeIn');
    if (shot) m *= 1 - fxs(d, 'shotIn');
    m *= 1 - fxs(d, 'allIn');
    if (shot && D.shieldWall && alive(B).some(t => t !== d && t.side === d.side && touching(d, d.c, d.r, t))) m *= 1 - D.shieldWall;
    return m;
  };
  const hitMode = s => {
    const up = s.fx.some(e => e.hit === 'max' || e.sure), down = s.fx.some(e => e.hit === 'min');
    return up === down ? null : up ? 1 : 0;
  };
  const baseRange = s => {
    const u = U(s), n = s.count, mode = hitMode(s);
    if (mode != null) return [u.dmg[mode] * n, u.dmg[mode] * n];
    if (n <= BT.rollCount) return [u.dmg[0] * n, u.dmg[1] * n];
    const avg = (u.dmg[0] + u.dmg[1]) / 2 * n;
    return [avg * (1 - BT.spread), avg * (1 + BT.spread)];
  };
  const baseRoll = (B, s) => {
    const u = U(s), n = s.count, mode = hitMode(s);
    if (mode != null) return u.dmg[mode] * n;
    if (n <= BT.rollCount) {
      let t = 0;
      for (let i = 0; i < n; i++) t += u.dmg[0] + Math.floor(H.roll(B) * (u.dmg[1] - u.dmg[0] + 1));
      return t;
    }
    return (u.dmg[0] + u.dmg[1]) / 2 * n * (1 - BT.spread + H.roll(B) * 2 * BT.spread);
  };
  const finalDmg = v => Math.max(1, Math.floor(v));
  const killsFor = (s, dmg) => {
    const left = total(s) - dmg;
    return left <= 0 ? s.count : s.count - Math.ceil(left / hpOf(s));
  };
  const hurt = (s, dmg) => {
    const before = s.count, left = total(s) - dmg, hp = hpOf(s);
    if (left <= 0 || s.phantom) {
      s.count = 0;
      s.hp = 0;
    } else {
      s.count = Math.ceil(left / hp);
      s.hp = left - (s.count - 1) * hp;
    }
    if (s.borrowed) s.borrowed = Math.max(0, s.borrowed - (before - s.count));
    return before - s.count;
  };

  const supporters = (B, d) => (F(d).formation ? alive(B).filter(s => s !== d && s.side === d.side && !s.supported && F(s).formation && touching(s, s.c, s.r, d)) : []);

  const died = (B, d, ev, killer, before) => {
    ev.push({ t: 'death', id: d.id });
    const lament = F(d).lament, own = heroOf(B, d);
    if (lament) {
      const top = lament.max + (own.lamentMax || 0);
      for (const s of alive(B)) {
        if (s.side !== d.side || U(s).faction !== U(d).faction || s.lament >= top) continue;
        s.lament = Math.min(top, s.lament + lament.atk);
        if (own.lamentReady) s.ready += own.lamentReady;
        ev.push({ t: 'lament', id: s.id, value: s.lament });
      }
    }
    if (killer && own.lastStrike && killer.count > 0) {
      const u = U(d), dmg = finalDmg((u.dmg[0] + u.dmg[1]) / 2 * before * H.damageMult(atkOf(d), defOf(killer, 0)) * own.lastStrike), kills = hurt(killer, dmg);
      ev.push({ t: 'hit', by: d.id, to: killer.id, kind: 'last', dmg, kills, left: killer.count, hp: killer.hp, luck: 0 });
      if (killer.count === 0) died(B, killer, ev);
    }
  };

  const afterHit = (B, d, kills, ev) => {
    d.hurtRound = B.round;
    if (d.fx.some(e => e.sleep || e.blind)) d.fx = d.fx.filter(e => !e.sleep && !e.blind);
    if (kills > 0 && d.count > 0 && fxHas(d, 'curse')) {
      for (const t of alive(B)) {
        if (t === d || t.side !== d.side || !touching(d, d.c, d.r, t)) continue;
        t.fx = t.fx.filter(e => !e.cursed);
        t.fx.push({ spell: 'kurgancurse', cursed: true, morale: -1, until: B.round, bad: true });
        ev.push({ t: 'fx', id: t.id, spell: 'kurgancurse', bad: true });
      }
    }
  };

  const strike = (B, a, d, kind, ctx, ev) => {
    if (shotKind(kind) && fxHas(d, 'dodge')) {
      d.fx = d.fx.filter(e => !e.dodge);
      ev.push({ t: 'miss', by: a.id, to: d.id });
      return;
    }
    let m = mult(B, a, d, kind, ctx), luck = 0;
    const sure = a.fx.find(e => e.sure), l = kind === 'support' || sure ? 0 : luckOf(B, a), before = d.count;
    if (l > 0 && H.roll(B) < l * BT.luckStep) {
      m *= BT.luckHigh;
      luck = 1;
    } else if (l < 0 && !heroOf(B, a).fortune && H.roll(B) < -l * BT.luckStep) {
      m *= BT.luckLow;
      luck = -1;
    }
    const dmg = finalDmg(baseRoll(B, a) * m), kills = hurt(d, dmg);
    a.dealt = true;
    if (sure && kind !== 'support') a.fx = a.fx.filter(e => e !== sure);
    ev.push({ t: 'hit', by: a.id, to: d.id, kind, dmg, kills, left: d.count, hp: d.hp, luck });
    afterHit(B, d, kills, ev);
    const chill = U(a).chill;
    if (chill && (kind === 'melee' || kind === 'retal') && d.count > 0 && d.chill < chill.max) {
      d.chill = Math.min(chill.max, d.chill + chill.atk);
      ev.push({ t: 'chill', id: d.id, value: d.chill });
    }
    if (d.count === 0) died(B, d, ev, a, before);
  };

  const canAnswer = d => !d.fx.some(e => e.sleep || e.blind || e.frozen || e.skip);
  const melee = (B, a, d, ctx, ev) => {
    const help = supporters(B, d).filter(s => s !== a), answer = canAnswer(d);
    strike(B, a, d, 'melee', ctx, ev);
    for (const s of help) {
      if (a.count === 0) break;
      s.supported = true;
      strike(B, s, a, 'support', { c: s.c, r: s.r }, ev);
    }
    if (a.count > 0 && d.count > 0 && !d.retaliated && answer) {
      d.retaliated = true;
      strike(B, d, a, 'retal', { c: d.c, r: d.r }, ev);
    }
  };

  const order = (a, b) => b.ready - a.ready || initOf(b) - initOf(a) || b.side - a.side || a.id - b.id;

  const finishNow = B => [0, 1].some(side => !alive(B).some(s => s.side === side && !s.summoned));
  const finish = (B, ev) => {
    if (B.winner >= 0) return true;
    const left = [0, 1].map(side => alive(B).some(s => s.side === side && !s.summoned));
    if (left[0] && left[1]) return false;
    B.winner = left[0] ? 0 : 1;
    B.active = -1;
    ev.push({ t: 'end', winner: B.winner });
    return true;
  };

  const burnAt = (B, s, ev) => {
    if (s.count <= 0) return;
    for (const z of B.zones) {
      if (!cells(s).some(p => z.cells.some(q => q[0] === p[0] && q[1] === p[1]))) continue;
      const kills = hurt(s, z.dmg);
      ev.push({ t: 'hit', by: -1, to: s.id, kind: 'fire', dmg: z.dmg, kills, left: s.count, hp: s.hp, luck: 0 });
      s.hurtRound = B.round;
      if (s.count === 0) {
        died(B, s, ev);
        return;
      }
    }
  };

  const roundStart = (B, ev) => {
    for (const s of B.stacks) {
      s.retaliated = false;
      s.waited = false;
      s.supported = false;
      s.fx = s.fx.filter(e => e.until >= B.round);
      if (s.count > 0) s.was = [s.was[1], { count: s.count, hp: s.hp }];
    }
    B.zones = B.zones.filter(z => z.until >= B.round);
    for (const t of B.temp) {
      if (t.until < B.round) B.obstacles = B.obstacles.filter(p => p[0] !== t.c || p[1] !== t.r);
    }
    B.temp = B.temp.filter(t => t.until >= B.round);
    for (const t of B.temp) {
      if (!t.wound) continue;
      for (const s of alive(B)) {
        if (!cells(s).some(p => Hex.dist(p[0], p[1], t.c, t.r) === 1)) continue;
        const dmg = Math.max(1, Math.ceil(total(s) * t.wound)), kills = hurt(s, dmg);
        ev.push({ t: 'hit', by: -1, to: s.id, kind: 'thorn', dmg, kills, left: s.count, hp: s.hp, luck: 0 });
        if (s.count === 0) died(B, s, ev);
      }
    }
    for (const s of alive(B)) {
      const regen = fxs(s, 'regen');
      if (regen > 0) healStack(B, s, s.start * hpOf(s) * regen, false, ev);
      burnAt(B, s, ev);
    }
    ev.push({ t: 'round', n: B.round });
  };

  const forced = (B, s, wild, ev) => {
    s.fx = s.fx.filter(e => e !== wild);
    s.ready = 0;
    ev.push({ t: 'wild', id: s.id, betray: !!wild.betray });
    const rc = reach(B, s), pool = alive(B).filter(t => t !== s && (!wild.betray || t.side === s.side)).sort((a, b) => gap(s, s.c, s.r, a) - gap(s, s.c, s.r, b));
    for (const t of pool) {
      const spot = spots(B, s, t, rc).sort((x, y) => x.steps - y.steps)[0];
      if (!spot) continue;
      moveTo(B, s, spot, ev);
      if (s.count > 0) melee(B, s, t, { c: s.c, r: s.r, flown: 0 }, ev);
      return;
    }
  };

  const startTurn = (B, s, ev) => {
    const poison = fxs(s, 'poison');
    if (poison > 0) {
      const dmg = Math.max(1, Math.floor(poison)), kills = hurt(s, dmg);
      ev.push({ t: 'hit', by: -1, to: s.id, kind: 'poison', dmg, kills, left: s.count, hp: s.hp, luck: 0 });
      s.hurtRound = B.round;
      if (s.count === 0) {
        died(B, s, ev);
        return true;
      }
    }
    if (fxHas(s, 'skip') || fxHas(s, 'sleep') || fxHas(s, 'blind') || fxHas(s, 'frozen')) {
      s.fx = s.fx.filter(e => !e.skip);
      s.ready = 0;
      ev.push({ t: 'skip', id: s.id });
      return true;
    }
    const wild = s.fx.find(e => e.mad || e.betray);
    if (wild) {
      forced(B, s, wild, ev);
      return true;
    }
    return false;
  };

  const advance = (B, ev) => {
    for (let guard = 0; guard < 100000; guard++) {
      if (finish(B, ev)) return;
      const due = alive(B).filter(s => s.ready >= BT.full).sort(order);
      if (due.length) {
        const s = due[0];
        s.defending = false;
        if (startTurn(B, s, ev)) continue;
        const m = moraleOf(B, s);
        if (m < 0 && H.roll(B) < -m * BT.moraleStep) {
          s.ready = BT.panicAt;
          ev.push({ t: 'morale', id: s.id, good: false });
          continue;
        }
        B.active = s.id;
        ev.push({ t: 'turn', id: s.id });
        return;
      }
      B.tick++;
      for (const s of alive(B)) if (!(B.sides[s.side].stopTicks > 0)) s.ready += initOf(s);
      for (const side of B.sides) if (side.stopTicks > 0) side.stopTicks--;
      if (B.tick % BT.roundTicks === 0) {
        B.round++;
        roundStart(B, ev);
      }
    }
    throw new Error('battle clock stuck');
  };

  const addStack = (B, side, x, hero) => {
    const u = H.UNITS[x.unit], h = hero || NONE, stars = x.stars || 0;
    const spec = h.unit && h.unit.units.includes(x.unit) ? h.unit.n : 0;
    const shots = u.shots ? u.shots + (h.shots || 0) + (h.gun && h.gun.units.includes(x.unit) ? h.gun.shots : 0) : 0;
    const s = { id: B.stacks.length, side, unit: x.unit, count: x.count, start: x.count, hp: u.hp, c: x.c, r: x.r, ready: 0, shots, waited: false, defending: false, retaliated: false, supported: false, chill: 0, lament: 0, atkPlus: (h.atk || 0) + stars + spec, defPlus: (h.def || 0) + stars + spec, initPlus: h.init || 0, stand: h.stand || 0, stars, vet: x.vet || 0, dealt: false, fx: [], hpPct: 0, hurtRound: 0, summoned: false, phantom: false, borrowed: 0, was: [{ count: x.count, hp: u.hp }, { count: x.count, hp: u.hp }] };
    B.stacks.push(s);
    return s;
  };

  const create = o => {
    const B = { v: 1, seed: o.seed >>> 0, rs: ((o.seed >>> 0) ^ 0x9e3779b9) >>> 0, tick: 0, round: 1, active: -1, winner: -1, started: false, obstacles: [], temp: [], zones: [], orderUntil: 0, moon: o.moon || null, stacks: [], sides: [] };
    B.sides = o.sides.map(sd => {
      const peoples = new Set(sd.stacks.map(x => H.UNITS[x.unit].faction).filter(f => f !== 'neutral'));
      return { morale: sd.morale || 0, luck: sd.luck || 0, mix: sd.hero && sd.hero.banner ? 0 : Math.max(0, peoples.size - 1), hero: sd.hero ? Object.assign({}, sd.hero) : null, used: {}, acted: 0, boost: null, noShoot: 0, stopTicks: 0 };
    });
    o.sides.forEach((sd, side) => {
      const n = sd.stacks.length;
      sd.stacks.forEach((x, i) => {
        const big = H.UNITS[x.unit].big ? 1 : 0;
        const r = x.r != null ? x.r : Math.round((i + 0.5) * BT.rows / n - 0.5);
        const c = x.c != null ? x.c : side ? BT.cols - 1 - big : big;
        addStack(B, side, Object.assign({}, x, { c, r }), sd.hero);
      });
    });
    if (o.obstacles) B.obstacles = o.obstacles.map(p => [p[0], p[1]]);
    else {
      const occ = occupancy(B), want = BT.obstacles[0] + Math.floor(H.roll(B) * (BT.obstacles[1] - BT.obstacles[0] + 1));
      for (let tries = 0; B.obstacles.length < want && tries < 500; tries++) {
        const c = 3 + Math.floor(H.roll(B) * (BT.cols - 6)), r = Math.floor(H.roll(B) * BT.rows);
        if (occ[idx(c, r)] !== -1) continue;
        occ[idx(c, r)] = -2;
        B.obstacles.push([c, r]);
      }
    }
    for (const s of B.stacks) {
      const own = B.sides[s.side].hero || NONE, foe = B.sides[1 - s.side].hero || NONE;
      s.ready = Math.max(0, (o.ready ? o.ready[s.id] : Math.floor(H.roll(B) * (BT.startReady + 1))) + (own.firstReady || 0) - (foe.enemyReady || 0));
    }
    B.opening = [];
    advance(B, B.opening);
    return B;
  };

  const fail = m => { throw new Error(m); };
  const enemy = (B, s, id) => {
    const t = B.stacks[id];
    if (!t || t.count <= 0 || t.side === s.side) fail('bad target');
    return t;
  };
  const moveTo = (B, s, dest, ev) => {
    if (dest.steps > 0) ev.push({ t: 'move', id: s.id, path: dest.path, fly: !!U(s).fly || !!dest.slide });
    s.c = dest.c;
    s.r = dest.r;
    if (B.zones.length) burnAt(B, s, ev);
  };

  const place = (B, id, c, r) => {
    const s = B.stacks[id], cols = heroOf(B, s).tactics || 0;
    if (B.started || !cols) fail('no deployment');
    const inBand = ([pc]) => (s.side ? pc >= BT.cols - cols : pc < cols);
    if (!cellsAt(s, c, r).every(inBand) || !fits(occupancy(B, s), s, c, r)) fail('cannot stand there');
    s.c = c;
    s.r = r;
  };

  const raiseSpot = (B, s) => {
    const o = occupancy(B, s);
    if (fits(o, s, s.c, s.r)) return [s.c, s.r];
    let best = null, bd = Infinity;
    for (let r = 0; r < BT.rows; r++) {
      for (let c = 0; c < BT.cols; c++) {
        const d = Hex.dist(s.c, s.r, c, r);
        if (d < bd && fits(o, s, c, r)) {
          bd = d;
          best = [c, r];
        }
      }
    }
    return best;
  };
  const fallen = (B, side) => B.stacks.filter(s => s.side === side && s.count <= 0).sort((a, b) => b.start * U(b).cost - a.start * U(a).cost)[0] || null;

  const canOrder = (B, kind) => {
    const s = B.stacks[B.active];
    if (!s || B.winner >= 0) return false;
    const side = B.sides[s.side], h = side.hero;
    if (!h) return false;
    if (kind === 'warcry') return !!h.warcry && !side.used.warcry && alive(B).some(t => t.side === s.side && t !== s);
    if (kind !== 'high' || !h.high || side.used.high || side.acted === B.round) return false;
    return h.high !== 'kurgan' || !!fallen(B, s.side);
  };

  const command = (B, a) => {
    const s = B.stacks[B.active], ev = [];
    if (!s || !canOrder(B, a.order)) fail('cannot give this order');
    const side = B.sides[s.side];
    if (a.order === 'warcry') {
      const t = B.stacks[a.target];
      if (!t || t.count <= 0 || t.side !== s.side || t === s) fail('bad target');
      side.used.warcry = true;
      t.ready += BT.warcry;
      ev.push({ t: 'order', order: 'warcry', id: t.id });
      return ev;
    }
    side.used.high = true;
    side.acted = B.round;
    if (side.hero.high === 'nabat') {
      side.boost = { morale: BT.nabatMorale, until: B.round + BT.nabatRounds - 1 };
      for (const t of alive(B)) if (t.side === s.side) t.ready += BT.nabatReady;
      ev.push({ t: 'order', order: 'nabat', id: s.id });
    } else {
      const t = fallen(B, s.side), at = raiseSpot(B, t);
      t.count = Math.max(1, Math.ceil(t.start * BT.raiseShare));
      t.hp = U(t).hp;
      t.ready = 0;
      if (at) [t.c, t.r] = at;
      ev.push({ t: 'order', order: 'kurgan', id: t.id, count: t.count, c: t.c, r: t.r });
    }
    return ev;
  };

  const spellOf = id => H.SPELLS[id];
  const castSide = B => {
    const s = B.stacks[B.active];
    return s ? B.sides[s.side] : null;
  };
  const schoolRank = (B, h, sp) => Math.min(3, (h.ranks[sp.school] || 0) + (B.moon && B.moon.id === 'convergence' ? 1 : 0));
  const spellCost = (B, h, sp) => {
    const r = schoolRank(B, h, sp), moon = B.moon && B.moon.id;
    let c = sp.mana - (r >= 2 ? r - 1 : 0);
    if ((moon === 'white' && sp.school === 'yasna') || (moon === 'silver' && sp.school === 'morok')) c--;
    if (sp.school === 'morok' && h.perks.includes('shade')) c--;
    return Math.max(1, c);
  };
  const spellScale = (B, h, sp) => {
    const r = schoolRank(B, h, sp);
    return (1 + (r >= 2 ? (r - 1) * 0.15 : 0)) * (1 + (h.sorcery || 0)) * (h.specSpell && h.specSpell.id === sp.id ? 1 + h.specSpell.scale : 1);
  };
  const spellAmount = (B, h, sp, pair) => (pair[0] + h.power * pair[1]) * spellScale(B, h, sp);
  const spellRounds = (B, h, sp) => {
    let n = sp.rounds != null ? sp.rounds : Math.min(6, 2 + Math.floor(h.power / 4));
    if (sp.control && h.perks.includes('ice')) n++;
    if (sp.school === 'glub' && B.moon && B.moon.id === 'azure') n++;
    return n;
  };

  const resists = (t, sp) => {
    const u = U(t);
    if (t.fx.some(e => e.ward && sp.circle <= e.ward)) return true;
    if (u.stone && sp.school === 'glub') return true;
    if (sp.poison && (u.spirit || u.stone || u.mech)) return true;
    if (u.mech && (sp.school === 'tlen' || (sp.fx && sp.fx.morale))) return true;
    return !!sp.noSpirit && (u.spirit || u.mech);
  };
  const concealed = (t, side) => t.side !== side && fxHas(t, 'hidden');

  const nearCells = (c, r) => Hex.near(c, r);
  const areaCells = (area, c, r, side) => {
    if (area === 'ring') return nearCells(c, r);
    if (area === 'hex1') return [[c, r], ...nearCells(c, r)];
    if (area === 'hex2') {
      const out = [];
      for (let y = 0; y < BT.rows; y++) for (let x = 0; x < BT.cols; x++) if (Hex.dist(c, r, x, y) <= 2) out.push([x, y]);
      return out;
    }
    if (area === 'cone') {
      const dir = side ? -1 : 1, wings = nearCells(c, r).filter(p => p[1] !== r).sort((a, b) => (b[0] - a[0]) * dir);
      const up = wings.find(p => p[1] < r), down = wings.find(p => p[1] > r);
      return [[c, r], ...(up ? [up] : []), ...(down ? [down] : [])];
    }
    return [[c, r - 1], [c, r], [c, r + 1]].filter(p => inside(p[0], p[1]));
  };
  const stacksIn = (B, list) => alive(B).filter(s => cells(s).some(p => list.some(q => q[0] === p[0] && q[1] === p[1])));

  const spellDamage = (B, h, sp, t, raw) => {
    let dmg = raw;
    if (!sp.pure) dmg *= H.clamp(Math.pow(BT.statBase, -defOf(t, 0) / 2), 0.5, 1);
    if (sp.spiritOnly && !U(t).spirit) dmg *= sp.spiritOnly;
    if (sp.school === 'zhar' && B.moon && B.moon.id === 'red') dmg *= 1.2;
    if (sp.school === 'zhar' && h.perks.includes('fireire') && t.hurtRound === B.round) dmg *= 1.15;
    const foe = B.sides[t.side].hero;
    if (foe && foe.perks && foe.perks.includes('measureshield')) dmg *= 0.85;
    return Math.max(1, Math.floor(dmg * (1 - fxs(t, 'allIn'))));
  };

  const healStack = (B, s, n, keep, ev) => {
    if (s.count <= 0 || fxHas(s, 'noHeal') || n <= 0) return 0;
    const hp = hpOf(s), now = total(s), next = Math.min(s.start * hp, now + Math.round(n));
    if (next <= now) return 0;
    const count = Math.ceil(next / hp), raised = count - s.count;
    s.count = count;
    s.hp = next - (count - 1) * hp;
    if (!keep && raised > 0) s.borrowed += raised;
    ev.push({ t: 'heal', id: s.id, n: next - now, left: s.count, raised });
    return next - now;
  };
  const weakest = (B, side, skip) => alive(B).filter(s => s.side === side && s !== skip).sort((a, b) => total(a) / (a.start * hpOf(a)) - total(b) / (b.start * hpOf(b)))[0] || null;

  const magicHit = (B, h, sp, t, raw, ev, side) => {
    const dmg = spellDamage(B, h, sp, t, raw), kills = hurt(t, dmg);
    ev.push({ t: 'hit', by: -1, to: t.id, kind: 'spell', spell: sp.id, dmg, kills, left: t.count, hp: t.hp, luck: 0 });
    afterHit(B, t, kills, ev);
    if (t.count === 0) died(B, t, ev);
    if (sp.school === 'zhar' && h.perks.includes('blaze')) B.zones.push({ cells: cells(t).map(p => [p[0], p[1]]), until: B.round + 1, dmg: Math.max(1, Math.floor(dmg * 0.1)) });
    if (sp.school === 'tlen' && h.perks.includes('reap')) {
      const low = weakest(B, side);
      if (low) healStack(B, low, dmg * 0.25, false, ev);
    }
    return dmg;
  };

  const PCT = ['closeIn', 'shotIn', 'allIn', 'dmgPct', 'defPct', 'initPct', 'regen'];
  const addFx = (B, h, sp, t, side, ev, half) => {
    const k = spellScale(B, h, sp), e = { spell: sp.id, until: B.round + spellRounds(B, h, sp) - 1, bad: t.side !== side };
    for (const [key, val] of Object.entries(sp.fx || {})) {
      if (typeof val !== 'number') e[key] = val;
      else if (key === 'ward') e[key] = val;
      else if (PCT.includes(key)) e[key] = H.clamp(val * k, -0.9, 0.9) * (half ? 0.5 : 1);
      else e[key] = half ? val * 0.5 : val;
    }
    if (sp.control && h.perks.includes('coldwater')) e.defPct = (e.defPct || 0) - 0.1;
    t.fx = t.fx.filter(x => x.spell !== sp.id);
    t.fx.push(e);
    ev.push({ t: 'fx', id: t.id, spell: sp.id, bad: e.bad });
  };
  const setHpPct = (s, plus) => {
    const before = hpOf(s);
    s.hpPct += plus;
    const after = hpOf(s);
    s.hp = after > before ? s.hp + after - before : Math.min(s.hp, after);
  };
  const freeCellNear = (B, s, c, r) => {
    const o = occupancy(B);
    let best = null, bd = Infinity;
    for (let y = 0; y < BT.rows; y++) {
      for (let x = 0; x < BT.cols; x++) {
        const d = Hex.dist(c, r, x, y);
        if (d < bd && fits(o, s, x, y)) {
          bd = d;
          best = [x, y];
        }
      }
    }
    return best;
  };
  const summonStack = (B, side, x, flags, near, ev) => {
    const s = addStack(B, side, { unit: x.unit, count: x.count, c: 0, r: 0 }, B.sides[side].hero);
    Object.assign(s, flags, { summoned: true });
    const at = freeCellNear(B, s, near[0], near[1]);
    if (!at) {
      s.count = 0;
      s.hp = 0;
      return null;
    }
    [s.c, s.r] = at;
    ev.push({ t: 'summon', id: s.id, c: s.c, r: s.r, count: s.count });
    return s;
  };

  const fleeFrom = (B, t, ev) => {
    const foes = alive(B).filter(x => x.side !== t.side);
    let best = null, bd = -1;
    for (const p of reach(B, t).values()) {
      const d = Math.min(...foes.map(x => gap(t, p.c, p.r, x)));
      if (d > bd) {
        bd = d;
        best = p;
      }
    }
    if (best && best.steps) moveTo(B, t, best, ev);
    t.ready = 0;
  };

  const applySpell = (B, side, h, s, sp, a, ev) => {
    const amount = pair => spellAmount(B, h, sp, pair), caster = s.side, foes = () => alive(B).filter(t => t.side !== caster && !concealed(t, caster));
    let list = [];
    if (sp.aim === 'foe' || sp.aim === 'own' || sp.aim === 'stack' || sp.aim === 'push' || sp.aim === 'swap') list = [B.stacks[a.target]];
    else if (sp.aim === 'foes') list = foes();
    else if (sp.aim === 'owns') list = alive(B).filter(t => t.side === caster);
    else if (sp.area) list = stacksIn(B, areaCells(sp.area, a.c, a.r, caster));
    const hit = list.filter(t => {
      if (!resists(t, sp)) return true;
      ev.push({ t: 'resist', id: t.id, spell: sp.id });
      return false;
    });
    let drained = 0;
    if (sp.strikes) {
      for (let i = 0; i < sp.strikes; i++) {
        const pool = foes();
        if (pool.length) magicHit(B, h, sp, pool[Math.floor(H.roll(B) * pool.length)], amount(sp.dmg), ev, caster);
      }
    } else if (sp.dmg) for (const t of hit) drained += magicHit(B, h, sp, t, amount(sp.dmg), ev, caster);
    if (sp.drain) {
      const low = weakest(B, caster);
      if (low) healStack(B, low, drained * sp.drain, false, ev);
    }
    for (const t of hit) {
      if (t.count <= 0) continue;
      if (sp.heal) {
        const moon = B.moon && B.moon.id === 'white' ? 1.25 : 1, done = healStack(B, t, amount(sp.heal) * moon, false, ev);
        if (done && h.perks.includes('radiance')) t.fx.push({ spell: 'radiance', morale: 1, until: B.round + 1, bad: false });
      }
      if (sp.calm) t.fx = t.fx.filter(e => !e.fear);
      if (sp.cleanse) t.fx = t.fx.filter(e => !e.bad);
      if (sp.dispel) t.fx = [];
      if (sp.school === 'yasna' && h.perks.includes('lightdark')) {
        const curse = t.fx.find(e => e.bad);
        if (curse) t.fx = t.fx.filter(e => e !== curse);
      }
      if (sp.hpPct) setHpPct(t, sp.hpPct);
      if (sp.fx) {
        addFx(B, h, sp, t, caster, ev);
        if (sp.school === 'tlen' && h.perks.includes('blight')) {
          for (const n of alive(B)) if (n !== t && n.side === t.side && touching(t, t.c, t.r, n) && !resists(n, sp)) addFx(B, h, sp, n, caster, ev, true);
        }
      }
      if (sp.poison) {
        t.fx = t.fx.filter(e => e.spell !== sp.id);
        t.fx.push({ spell: sp.id, poison: amount(sp.poison), until: B.round + spellRounds(B, h, sp) - 1, bad: t.side !== caster });
        ev.push({ t: 'fx', id: t.id, spell: sp.id, bad: t.side !== caster });
      }
      if (sp.ready) {
        const extra = sp.time && h.perks.includes('precision') ? (sp.ready > 0 ? 10 : -10) : 0;
        t.ready = Math.max(0, t.ready + sp.ready + extra);
        ev.push({ t: 'ready', id: t.id, value: t.ready });
      }
      if (sp.raise) healStack(B, t, amount(sp.raise), (h.ranks.yasna || 0) >= 3, ev);
      if (sp.flee) fleeFrom(B, t, ev);
      if (sp.rewind) {
        const past = t.was[0];
        t.count = Math.min(t.start, Math.max(t.count, past.count));
        if (past.count >= t.count) t.hp = Math.min(hpOf(t), past.hp);
        ev.push({ t: 'heal', id: t.id, n: 0, left: t.count, raised: 0 });
      }
      if (sp.clone) {
        const at = [t.c, t.r], n = Math.max(1, Math.round(t.count * sp.clone)), copies = h.perks.includes('double') ? 2 : 1;
        for (let i = 0; i < copies; i++) summonStack(B, caster, { unit: t.unit, count: n }, { phantom: true }, at, ev);
      }
      if (sp.push) {
        const dest = fits(occupancy(B, t), t, a.c, a.r) && Hex.dist(t.c, t.r, a.c, a.r) <= sp.push;
        if (dest) moveTo(B, t, { c: a.c, r: a.r, steps: 1, path: [[t.c, t.r], [a.c, a.r]], slide: true }, ev);
      }
      if (sp.swap) {
        const b = B.stacks[a.target2], ax = t.c, ay = t.r;
        t.c = b.c;
        t.r = b.r;
        b.c = ax;
        b.r = ay;
        ev.push({ t: 'swap', a: t.id, b: b.id });
      }
    }
    if (sp.summon) {
      const k = h.perks.includes('fertility') ? 1.3 : 1, n = Math.max(1, Math.round(amount(sp.count) * k)), edge = caster ? BT.cols - 1 : 0;
      summonStack(B, caster, { unit: sp.summon, count: n }, {}, [edge, Math.floor(BT.rows / 2)], ev);
    }
    if (sp.bush) {
      B.obstacles.push([a.c, a.r]);
      B.temp.push({ c: a.c, r: a.r, until: h.perks.includes('roots') ? 9999 : B.round + spellRounds(B, h, sp) - 1, wound: sp.wound });
    }
    if (sp.wall) {
      for (const p of areaCells('line', a.c, a.r, caster)) {
        if (occupancy(B)[idx(p[0], p[1])] !== -1) continue;
        B.obstacles.push([p[0], p[1]]);
        B.temp.push({ c: p[0], r: p[1], until: h.perks.includes('roots') ? 9999 : B.round + spellRounds(B, h, sp) - 1, wound: 0 });
      }
    }
    if (sp.zone) {
      B.zones.push({ cells: areaCells('line', a.c, a.r, caster), until: B.round + spellRounds(B, h, sp) - 1, dmg: Math.round(amount(sp.zone)) });
      for (const t of alive(B)) burnAt(B, t, ev);
    }
    if (sp.noShoot) B.sides[1 - caster].noShoot = B.round + sp.noShoot;
    if (sp.stop) B.sides[1 - caster].stopTicks = sp.stop * BT.roundTicks;
    if (sp.order) B.orderUntil = B.round + sp.order - 1;
  };

  const castBlock = (B, id) => {
    const s = B.stacks[B.active], sp = spellOf(id);
    if (!s || B.winner >= 0) return 'Сейчас колдовать нельзя';
    const side = B.sides[s.side], h = side.hero;
    if (!h || !h.spells) return 'Нет героя';
    if (!h.spells.includes(id)) return 'Заклинание не изучено';
    if (side.acted === B.round && (!h.perks.includes('quickword') || side.used.quick)) return 'Герой уже действовал в этом раунде';
    if (h.mana < spellCost(B, h, sp)) return 'Не хватает маны';
    if (sp.once && side.used[id]) return 'Только раз за бой';
    if (B.round <= B.orderUntil && sp.circle <= 3 && sp.school !== 'mera') return 'Мир порядка: заклинание молчит';
    return '';
  };

  const stackTargets = (B, sp, caster) => {
    const h = B.sides[caster].hero;
    let list = alive(B);
    if (sp.aim === 'foe') list = list.filter(t => t.side !== caster);
    if (sp.aim === 'own') list = list.filter(t => t.side === caster);
    list = list.filter(t => !concealed(t, caster) && !resists(t, sp));
    if (sp.limit) list = list.filter(t => total(t) <= spellAmount(B, h, sp, sp.limit));
    if (sp.raise) list = list.filter(t => total(t) < t.start * hpOf(t));
    if (sp.heal) list = list.filter(t => !fxHas(t, 'noHeal'));
    if (sp.rewind) list = list.filter(t => t.was[0].count > t.count);
    return list;
  };

  const castOptions = (B, id) => {
    const s = B.stacks[B.active], sp = spellOf(id), caster = s.side;
    if (sp.aim === 'none' || sp.aim === 'foes' || sp.aim === 'owns') return [{ type: 'cast', spell: id }];
    if (sp.aim === 'foe' || sp.aim === 'own' || sp.aim === 'stack' || sp.aim === 'push' || sp.aim === 'swap') return stackTargets(B, sp, caster).map(t => ({ type: 'cast', spell: id, target: t.id }));
    const out = [];
    for (let r = 0; r < BT.rows; r++) for (let c = 0; c < BT.cols; c++) if (cellOkay(B, sp, c, r)) out.push({ type: 'cast', spell: id, c, r });
    return out;
  };
  const cellOkay = (B, sp, c, r) => {
    if (!inside(c, r)) return false;
    if (sp.aim === 'free') return occupancy(B)[idx(c, r)] === -1;
    if (sp.aim === 'line') return areaCells('line', c, r, 0).some(p => occupancy(B)[idx(p[0], p[1])] === -1);
    return true;
  };
  const pushOkay = (B, t, c, r, sp) => inside(c, r) && Hex.dist(t.c, t.r, c, r) <= sp.push && Hex.dist(t.c, t.r, c, r) > 0 && fits(occupancy(B, t), t, c, r);
  const swapOkay = (B, a, b) => {
    if (!a || !b || a === b || a.count <= 0 || b.count <= 0 || U(a).big !== U(b).big) return false;
    return !concealed(b, B.stacks[B.active].side);
  };

  const cast = (B, a) => {
    const s = B.stacks[B.active], sp = spellOf(a.spell), why = sp ? castBlock(B, a.spell) : 'Нет такого заклинания';
    if (why) fail(why);
    const side = B.sides[s.side], h = side.hero, caster = s.side, ev = [];
    if (sp.aim === 'foe' || sp.aim === 'own' || sp.aim === 'stack' || sp.aim === 'push' || sp.aim === 'swap') {
      if (!stackTargets(B, sp, caster).includes(B.stacks[a.target])) fail('bad spell target');
      if (sp.aim === 'push' && !pushOkay(B, B.stacks[a.target], a.c, a.r, sp)) fail('bad spell cell');
      if (sp.aim === 'swap' && !swapOkay(B, B.stacks[a.target], B.stacks[a.target2])) fail('bad spell target');
    } else if (sp.aim !== 'none' && sp.aim !== 'foes' && sp.aim !== 'owns' && !cellOkay(B, sp, a.c, a.r)) fail('bad spell cell');
    h.mana -= spellCost(B, h, sp);
    if (side.acted === B.round) side.used.quick = true;
    side.acted = B.round;
    if (sp.once) side.used[sp.id] = true;
    ev.push({ t: 'cast', spell: sp.id, side: caster });
    applySpell(B, side, h, s, sp, a, ev);
    if (h.perks.includes('echo') && H.roll(B) < 0.15 && !finishNow(B) && (a.target == null || B.stacks[a.target].count > 0)) {
      ev.push({ t: 'echo', spell: sp.id });
      applySpell(B, side, h, s, sp, a, ev);
    }
    if (s.count <= 0 || finishNow(B)) {
      B.active = -1;
      advance(B, ev);
    }
    return ev;
  };

  const spellFacts = (B, h, sp) => {
    const out = ['Мана: ' + spellCost(B, h, sp)], val = pair => Math.round(spellAmount(B, h, sp, pair));
    if (sp.dmg) out.push('Урон: ' + val(sp.dmg) + (sp.strikes ? ' × ' + sp.strikes : ''));
    if (sp.heal) out.push('Лечение: ' + Math.round(val(sp.heal) * (B.moon && B.moon.id === 'white' ? 1.25 : 1)));
    if (sp.raise) out.push('Здоровья поднимает: ' + val(sp.raise));
    if (sp.poison) out.push('Яд за ход: ' + val(sp.poison));
    if (sp.zone) out.push('Огонь: ' + val(sp.zone));
    if (sp.limit) out.push('Предел здоровья цели: ' + val(sp.limit));
    if (sp.count) out.push('Число: ' + Math.max(1, Math.round(val(sp.count))));
    if ((sp.fx || sp.poison || sp.bush || sp.wall || sp.zone) && spellRounds(B, h, sp) < 99) out.push('Раундов: ' + spellRounds(B, h, sp));
    return out;
  };

  const act = (B, a) => {
    if (a.type === 'order') return command(B, a);
    if (a.type === 'cast') return cast(B, a);
    const s = B.stacks[B.active];
    if (!s || B.winner >= 0) fail('no active stack');
    const u = U(s), ev = [];
    B.started = true;
    let surge = true;
    if (a.type === 'wait') {
      if (s.waited) fail('already waited');
      s.waited = true;
      s.ready = BT.waitAt;
      surge = false;
      ev.push({ t: 'wait', id: s.id });
    } else if (a.type === 'defend') {
      s.defending = true;
      s.ready = BT.defendAt;
      ev.push({ t: 'defend', id: s.id });
    } else if (a.type === 'move') {
      const dest = reach(B, s).get(idx(a.c, a.r));
      if (!dest || !dest.steps) fail('cannot move there');
      s.ready = 0;
      moveTo(B, s, dest, ev);
    } else if (a.type === 'attack') {
      const t = enemy(B, s, a.target), dest = reach(B, s).get(idx(a.c, a.r));
      if (!dest || !touching(s, dest.c, dest.r, t)) fail('cannot attack from there');
      s.ready = 0;
      moveTo(B, s, dest, ev);
      if (s.count > 0) melee(B, s, t, { c: s.c, r: s.r, flown: u.fly ? dest.steps : 0 }, ev);
    } else if (a.type === 'shoot') {
      const t = enemy(B, s, a.target);
      if (!canShoot(B, s) || fxHas(t, 'hidden')) fail('cannot shoot');
      s.ready = 0;
      s.shots--;
      strike(B, s, t, 'shot', { c: s.c, r: s.r }, ev);
    } else if (a.type === 'bell') {
      const t = enemy(B, s, a.target);
      if (!u.bell || enemyNear(B, s, s.c, s.r) || gap(s, s.c, s.r, t) > u.bell.range) fail('bell out of range');
      s.ready = 0;
      strike(B, s, t, 'bell', { c: s.c, r: s.r }, ev);
      if (t.count > 0) {
        t.ready = Math.max(0, t.ready - u.bell.ready);
        ev.push({ t: 'ready', id: t.id, value: t.ready });
      }
    } else if (a.type === 'saddle') {
      const t = enemy(B, s, a.target), dest = reach(B, s).get(idx(a.c, a.r));
      if (!u.saddle || s.shots <= 0 || !dest || enemyNear(B, s, dest.c, dest.r) || fxHas(t, 'hidden') || B.sides[s.side].noShoot >= B.round) fail('cannot shoot from the saddle there');
      s.ready = 0;
      moveTo(B, s, dest, ev);
      s.shots--;
      if (s.count > 0) strike(B, s, t, 'saddle', { c: s.c, r: s.r }, ev);
    } else fail('unknown action ' + a.type);
    if (surge && fxHas(s, 'hidden')) s.fx = s.fx.filter(e => !e.hidden);
    if (surge && s.count > 0) {
      const m = moraleOf(B, s);
      if (m > 0 && H.roll(B) < m * BT.moraleStep) {
        s.ready += BT.surge;
        ev.push({ t: 'morale', id: s.id, good: true });
      }
    }
    B.active = -1;
    advance(B, ev);
    return ev;
  };

  const queue = (B, n, override) => {
    const sim = alive(B).map(s => ({ id: s.id, side: s.side, init: initOf(s), ready: s.ready }));
    const out = [];
    if (!sim.length || B.winner >= 0) return out;
    let tick = B.tick, round = B.round;
    const cur = sim.find(x => x.id === B.active);
    if (cur) {
      if (override != null) cur.ready = override;
      else {
        out.push({ id: cur.id, round });
        cur.ready = 0;
      }
    }
    while (out.length < n) {
      const due = sim.filter(x => x.ready >= BT.full).sort((a, b) => b.ready - a.ready || b.init - a.init || b.side - a.side || a.id - b.id);
      if (due.length) {
        out.push({ id: due[0].id, round });
        due[0].ready = 0;
        continue;
      }
      tick++;
      for (const x of sim) x.ready += x.init;
      if (tick % BT.roundTicks === 0) round++;
    }
    return out;
  };

  const forecast = (B, s, t, kind, ctx) => {
    const at = ctx || { c: s.c, r: s.r, flown: 0 };
    const m = mult(B, s, t, kind, at), [lo, hi] = baseRange(s);
    const min = finalDmg(lo * m), max = finalDmg(hi * m);
    const out = { min, max, kmin: killsFor(t, min), kmax: killsFor(t, max), retal: null, support: 0 };
    if (kind !== 'melee') return out;
    out.support = supporters(B, t).length;
    if (t.retaliated || out.kmin >= t.count || !canAnswer(t)) return out;
    const most = { ...t }, least = { ...t };
    hurt(most, min);
    hurt(least, max);
    const rm = mult(B, most, s, 'retal', { c: t.c, r: t.r });
    const rmin = least.count ? finalDmg(baseRange(least)[0] * rm) : 0, rmax = finalDmg(baseRange(most)[1] * rm);
    out.retal = { min: rmin, max: rmax, kmin: rmin ? killsFor(s, rmin) : 0, kmax: killsFor(s, rmax) };
    return out;
  };

  const result = B => {
    const lost = [0, 1].map(side => B.stacks.filter(s => s.side === side && !s.summoned).map(s => {
      const left = Math.max(0, s.count - s.borrowed);
      return { unit: s.unit, lost: s.start - left, left };
    }));
    const xp = [1, 0].map(other => lost[other].reduce((a, x) => a + x.lost * H.UNITS[x.unit].hp, 0));
    const stars = [0, 1].map(side => B.stacks.filter(s => s.side === side && !s.summoned && s.count > 0 && s.dealt && s.stars < H.HERO.maxStars && s.vet + 1 >= H.HERO.starAfter).map(s => s.unit));
    return { winner: B.winner, round: B.round, lost, xp, stars };
  };

  H.Hex = Hex;
  H.Battle = { create, act, place, canOrder, queue, forecast, hurt, result, reach, spots, cells, cellsAt, gap, touching, enemyNear, canShoot, supporters, moraleOf, luckOf, atkOf, defOf, initOf, hpOf, total, alive, occupancy, fits, fxs, fxHas, castBlock, castOptions, stackTargets, cellOkay, pushOkay, swapOkay, spellCost, spellAmount, spellRounds, spellDamage, spellFacts, areaCells, stacksIn, resists, concealed, schoolRank };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
