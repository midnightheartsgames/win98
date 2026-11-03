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

  const wallRows = (B, side) => {
    const out = [];
    if (!B.siege) return out;
    if (B.siege.towers) out.push(0, BT.rows - 1);
    for (const p of B.siege.pieces) if (p.hp > 0 && !(p.gate && side === 1)) out.push(...p.rows);
    return out;
  };
  const wallAt = (B, r) => wallRows(B, -1).includes(r);

  const occupancy = (B, skip) => {
    const o = new Int16Array(BT.cols * BT.rows).fill(-1);
    for (const p of B.obstacles) o[idx(p[0], p[1])] = -2;
    for (const r of wallRows(B, skip ? skip.side : -1)) o[idx(B.siege.col, r)] = -2;
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
  const canShoot = (B, s) => s.shots > 0 && (!!U(s).machine || !!U(s).closeShot || !enemyNear(B, s, s.c, s.r)) && !(B.sides[s.side].noShoot >= B.round);
  const heatCap = (B, s) => (heroOf(B, s).heatHold ? H.HERO.forge.hold : H.HERO.forge.cap);
  const fireMul = (B, t) => (U(t).fireproof ? 0 : 1 - (heroOf(B, t).fireCut || 0));
  const veiled = (B, t) => fxHas(t, 'hidden') || (!!U(t).veil && !enemyNear(B, t, t.c, t.r));
  const sees = (B, s, t) => !!U(s).trueSight || !veiled(B, t);
  const targets = (B, side) => alive(B).filter(t => t.side !== side && !U(t).fixed);
  const wagonOn = (B, side) => B.stacks.some(s => s.side === side && s.count > 0 && U(s).passive);

  const reach = (B, s) => {
    const o = occupancy(B, s), u = U(s), out = new Map();
    const start = { c: s.c, r: s.r, steps: 0, path: [[s.c, s.r]] };
    out.set(idx(s.c, s.r), start);
    if (fxHas(s, 'noMove') || fxHas(s, 'frozen')) return out;
    const pace = u.speed + (s.speedPlus || 0);
    if (u.fly) {
      for (let r = 0; r < BT.rows; r++) {
        for (let c = 0; c < BT.cols; c++) {
          const d = Hex.dist(s.c, s.r, c, r);
          if (d > 0 && d <= pace && fits(o, s, c, r)) out.set(idx(c, r), { c, r, steps: d, path: [[s.c, s.r], [c, r]] });
        }
      }
      return out;
    }
    let front = [start];
    const moat = B.siege && B.siege.moat ? B.siege.col - 1 : -1, brush = F(s).brush || u.leap ? new Set(B.obstacles.map(p => idx(p[0], p[1]))) : null, passed = new Set();
    const passes = (c, r) => !!brush && cellsAt(s, c, r).every(p => inside(p[0], p[1]) && (o[idx(p[0], p[1])] === -1 || brush.has(idx(p[0], p[1]))));
    for (let step = 1; step <= pace && front.length; step++) {
      const next = [];
      for (const f of front) {
        for (const [c, r] of Hex.near(f.c, f.r)) {
          const k = idx(c, r);
          if (out.has(k) || passed.has(k)) continue;
          const open = fits(o, s, c, r);
          if (!open && !passes(c, r)) continue;
          const n = { c, r, steps: step, path: [...f.path, [c, r]] };
          if (open) out.set(k, n);
          else passed.add(k);
          if (!cellsAt(s, c, r).some(p => p[0] === moat)) next.push(n);
        }
      }
      front = next;
    }
    return out;
  };
  const spots = (B, s, t, rc) => [...(rc || reach(B, s)).values()].filter(p => touching(s, p.c, p.r, t));

  const NONE = {};
  const heroOf = (B, s) => B.sides[s.side].hero || NONE;
  const nearBonus = (B, s, key) => {
    let top = 0;
    for (const t of B.stacks) if (U(t)[key] > top && t.count > 0 && t !== s && t.side === s.side && touching(t, t.c, t.r, s)) top = U(t)[key];
    return top;
  };
  const brushDef = (B, d) => (U(d).brushGuard ? U(d).brushGuard * B.obstacles.filter(p => cells(d).some(q => Hex.dist(p[0], p[1], q[0], q[1]) === 1)).length : 0);
  const touchesBrush = (B, s, side) => B.temp.some(t => t.brush === side && cells(s).some(p => Hex.dist(p[0], p[1], t.c, t.r) === 1));
  const ebbOf = (B, d) => (F(d).tide && B.round % 2 === 0 ? 1 + F(d).tide.def : 1);
  const atkOf = s => U(s).atk + s.atkPlus + s.lament - s.chill + fxs(s, 'atk');
  const defOf = (s, pierce) => (U(s).def + s.defPlus - (s.brine || 0) + (U(s).steady && !s.walked ? U(s).steady : 0) + fxs(s, 'def')) * (1 + fxs(s, 'defPct')) * (s.defending ? 1 + Math.max(BT.defendBonus, U(s).guardStand || 0) + s.stand : 1) * (1 - pierce);
  const initOf = s => Math.max(1, Math.round((U(s).init + s.initPlus) * (1 + fxs(s, 'initPct'))));

  const moraleOf = (B, s) => {
    let up = 0, down = 0;
    for (const t of alive(B)) {
      const a = U(t).aura;
      if (!a || t === s || !(a.range ? gap(s, s.c, s.r, t) <= a.range : touching(s, s.c, s.r, t))) continue;
      if (a.side === 'own' && t.side === s.side) up = Math.max(up, a.morale);
      if (a.side === 'enemy' && t.side !== s.side) down = Math.min(down, a.morale);
    }
    const side = B.sides[s.side], boost = side.boost && B.round <= side.boost.until ? side.boost.morale : 0, moon = B.moon && B.moon.people.includes(U(s).faction) ? 1 : 0, salt = B.field === 'saltcrust' && U(s).faction === 'barrows' ? 1 : 0, wet = (B.deck || B.shore) && F(s).tide ? 1 : 0;
    const m = H.clamp(side.morale - side.mix + boost + moon + salt + wet + fxs(s, 'morale') + up + down, -BT.statCap, BT.statCap);
    return m < 0 && alive(B).some(t => t.side === s.side && U(t).fearless) ? 0 : m;
  };
  const luckOf = (B, s) => {
    const light = alive(B).find(t => t !== s && t.side === s.side && U(t).beacon && gap(s, s.c, s.r, t) <= U(t).beacon.range);
    return H.clamp(B.sides[s.side].luck + (light ? U(light).beacon.luck : 0), -BT.statCap, BT.statCap);
  };

  const shotKind = k => k === 'shot' || k === 'saddle' || k === 'volley' || k === 'splash' || k === 'through';
  const closeKind = k => k === 'melee' || k === 'retal' || k === 'support' || k === 'flame' || k === 'pole' || k === 'trample' || k === 'sweep' || k === 'arc' || k === 'burst';
  const farShot = (B, a, c, r, d) => gap(a, c, r, d) > BT.far && !heroOf(B, a).aim && !U(a).aimed;
  const farMulOf = (B, a) => (alive(B).some(t => t.side === a.side && U(t).spotter) ? BT.farSpotted : BT.farMul);
  const coverOf = (B, d) => alive(B).reduce((top, t) => (t !== d && t.side === d.side && U(t).shield && touching(t, t.c, t.r, d) ? Math.max(top, U(t).shield.near) : top), U(d).shield ? U(d).shield.self : 0);
  const mult = (B, a, d, kind, ctx) => {
    const u = U(a), A = heroOf(B, a), D = heroOf(B, d), shot = shotKind(kind), close = closeKind(kind);
    let m = H.damageMult(atkOf(a) + nearBonus(B, a, 'atkNear'), defOf(d, shot ? u.pierce || 0 : 0) * ebbOf(B, d) + nearBonus(B, d, 'guardNear') + brushDef(B, d));
    if (F(a).tide && B.round % 2 === 1) m *= 1 + (A.tideHigh || F(a).tide.up);
    if (u.vsBig && U(d).big) m *= 1 + u.vsBig;
    const dim = alive(B).reduce((top, t) => (t.side !== a.side && U(t).dimNear && touching(t, t.c, t.r, a) ? Math.max(top, U(t).dimNear) : top), 0);
    if (dim) m *= 1 - dim;
    if (shot && farShot(B, a, ctx.c, ctx.r, d)) m *= farMulOf(B, a);
    if (shot && B.siege && a.side === 0 && !u.lob && !u.fly && ctx.c < B.siege.col && d.c > B.siege.col && wallAt(B, d.r)) m *= H.SIEGE.throughWall;
    if (shot && B.field === 'foglow') m *= BT.fogShots;
    if (u.deckBonus && B.deck) m *= 1 + u.deckBonus;
    if (u.firstHit && kind === 'melee' && !a.dealt) m *= 1 + u.firstHit;
    if (u.pack && kind === 'melee') m *= 1 + u.pack * alive(B).filter(t => t !== a && t.side === a.side && touching(t, t.c, t.r, d)).length;
    if (kind === 'flame') m *= u.flame.share;
    if (kind === 'trample') m *= u.trample.share;
    if (kind === 'sweep') m *= u.sweep.share;
    if (kind === 'arc') m *= u.arc.share;
    if (F(a).heat && a.heat) m *= 1 + a.heat * (A.heatPer || H.HERO.forge.per);
    if (u.restHit && a.rested && (kind === 'melee' || shotKind(kind))) m *= 1 + u.restHit;
    if (kind === 'flame' || kind === 'burst') m *= fireMul(B, d);
    if (kind === 'burst') m *= u.burst;
    if ((kind === 'melee' || kind === 'retal') && u.vsLow && U(d).tier <= u.vsLow.tiers) m *= 1 + u.vsLow.bonus;
    m *= 1 + fxs(d, 'marked');
    if (u.punish && d.fx.some(e => e.spell)) m *= 1 + u.punish;
    if (u.machine) m *= a.crew || 1;
    m *= 1 + (a.forged || 0);
    if ((kind === 'melee' || kind === 'retal') && u.shots && !u.fullHand) m *= BT.meleeShooter;
    if (kind === 'saddle') m *= u.saddle;
    if (kind === 'bell') m *= u.bell.mul;
    if (kind === 'volley') m *= u.volley.mul;
    if (kind === 'splash') m *= u.splash;
    if (kind === 'through') m *= u.line.share;
    if (kind === 'support') m *= Math.max(u.formationOwn || 0, A.formation || 0, F(a).formation || 0) + (A.formationAdd || 0);
    if (kind === 'melee' && u.dive && ctx.flown >= u.dive.from) m *= 1 + u.dive.bonus;
    if (kind === 'melee' && u.charge) m *= 1 + u.charge * (ctx.run || 0);
    if (close) m *= 1 + (A.melee || 0);
    if (shot) m *= 1 + (A.ranged || 0);
    if (kind === 'retal') m *= 1 + (A.retal || 0);
    if (close && A.finish && total(d) * 2 < d.start * hpOf(d)) m *= 1 + A.finish;
    if (A.gun && A.gun.units.includes(a.unit)) m *= 1 + A.gun.dmg;
    if (close) m *= 1 - (D.guard || 0);
    m *= 1 + fxs(a, 'dmgPct');
    if (close) m *= 1 - fxs(d, 'closeIn');
    if (shot) m *= (1 - fxs(d, 'shotIn')) * (1 - coverOf(B, d));
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
    if (left <= 0) return U(s).lastStand && !s.stood ? s.count - 1 : s.count;
    return s.count - Math.ceil(left / hpOf(s));
  };
  const hurt = (s, dmg) => {
    const before = s.count, left = total(s) - dmg, hp = hpOf(s);
    if (left <= 0 && U(s).lastStand && !s.stood && !s.phantom) {
      s.stood = true;
      s.count = 1;
      s.hp = 1;
    } else if (left <= 0 || s.phantom) {
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
    if (killer && U(killer).howl && killer.count > 0 && killer.side !== d.side) {
      for (const s of alive(B)) {
        if (s.side !== killer.side || U(s).machine) continue;
        s.fx = s.fx.filter(e => e.trait !== 'Вой');
        s.fx.push({ trait: 'Вой', morale: U(killer).howl, until: B.round + 1, bad: false });
      }
      ev.push({ t: 'trait', id: killer.id, name: 'Вой' });
    }
    if (killer && own.lastStrike && killer.count > 0 && !U(d).machine) {
      const u = U(d), dmg = finalDmg((u.dmg[0] + u.dmg[1]) / 2 * before * H.damageMult(atkOf(d), defOf(killer, 0)) * own.lastStrike), kills = hurt(killer, dmg);
      ev.push({ t: 'hit', by: d.id, to: killer.id, kind: 'last', dmg, kills, left: killer.count, hp: killer.hp, luck: 0 });
      if (killer.count === 0) died(B, killer, ev);
    }
  };

  const afterHit = (B, d, kills, ev) => {
    d.hurtRound = B.round;
    if (d.stood && !d.standSeen) {
      d.standSeen = true;
      ev.push({ t: 'trait', id: d.id, name: 'Стоят насмерть' });
    }
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

  const trait = (B, t, name, e, ev) => {
    t.fx = t.fx.filter(x => x.trait !== name);
    t.fx.push(Object.assign({ trait: name, bad: true }, e));
    ev.push({ t: 'trait', id: t.id, name });
  };
  const strikeTraits = (B, a, d, kind, dmg, ev) => {
    const u = U(a), hand = kind === 'melee' || kind === 'retal';
    if (u.drain && a.count > 0) healStack(B, a, dmg * u.drain, true, ev);
    const thornMul = U(d).thornsName ? 1 : fireMul(B, a);
    if (U(d).thorns && kind === 'melee' && a.count > 0 && thornMul > 0) {
      const back = Math.max(1, Math.floor(dmg * U(d).thorns * thornMul)), kills = hurt(a, back);
      ev.push({ t: 'hit', by: -1, to: a.id, kind: 'thorn', dmg: back, kills, left: a.count, hp: a.hp, luck: 0 });
      if (a.count === 0) died(B, a, ev);
    }
    if (d.count <= 0) return;
    if (u.mark && shotKind(kind)) trait(B, d, 'Метка', { marked: u.mark, until: B.round }, ev);
    if (u.ember && (hand || shotKind(kind)) && !U(d).machine && !U(d).fireproof) trait(B, d, 'Искры', { ember: Math.max(1, Math.floor(dmg * u.ember.share)), until: B.round + u.ember.rounds }, ev);
    if (shotKind(kind) && !U(d).machine) {
      if (u.mud) trait(B, d, u.mudName || 'Тина', { initPct: -u.mud.pct, until: B.round + u.mud.rounds - 1 }, ev);
      if (u.mudVenom && !U(d).spirit && !U(d).stone && !U(d).mech) trait(B, d, 'Яд', { poison: Math.max(1, Math.floor(dmg * u.mudVenom.share)), until: B.round + u.mudVenom.rounds - 1 }, ev);
      if ((u.snare || u.net) && !(d.snared >= B.round - 1)) {
        d.snared = B.round;
        trait(B, d, u.net ? 'Сеть' : 'Путы', { noMove: true, oneTurn: true, until: B.round + 1 }, ev);
      }
      if (u.brineShot) d.brine = Math.min(u.brineShot.max, (d.brine || 0) + u.brineShot.n);
      if (u.shotSap) {
        d.ready = Math.max(0, d.ready - u.shotSap);
        ev.push({ t: 'ready', id: d.id, value: d.ready });
      }
    }
    if (!hand) return;
    if (heroOf(B, a).saltBlood && F(a).tide && !U(d).machine) d.brine = Math.min(H.HERO.tide.brineMax, (d.brine || 0) + H.HERO.tide.brine);
    if (kind === 'retal' && u.retalVenom && !U(d).spirit && !U(d).stone && !U(d).mech) trait(B, d, 'Яд', { poison: Math.max(1, Math.floor(dmg * u.retalVenom.share)), until: B.round + u.retalVenom.rounds - 1 }, ev);
    if (u.grip) trait(B, d, u.gripName || 'Объятие', { noMove: true, until: B.round + 1 }, ev);
    if (u.web && !U(d).machine) trait(B, d, 'Стеклянная паутина', { initPct: -u.web.pct, until: B.round + u.web.rounds - 1 }, ev);
    if (u.song && kind === 'melee') {
      for (const t of alive(B)) {
        if (t === d || t.side !== d.side || U(t).fixed || !touching(t, t.c, t.r, d)) continue;
        t.ready = Math.max(0, t.ready - u.song);
        ev.push({ t: 'ready', id: t.id, value: t.ready });
      }
    }
    if (u.coil) trait(B, d, 'Обвить', { skip: true, until: B.round + 1 }, ev);
    if (u.curseHit) trait(B, d, 'Проклятие кургана', { noHeal: true, until: B.round + u.curseHit - 1 }, ev);
    if (u.slow) trait(B, d, 'Стужа', { initPct: -u.slow.pct, until: B.round + u.slow.rounds - 1 }, ev);
    if (u.venom && !U(d).spirit && !U(d).stone && !U(d).mech) trait(B, d, 'Яд', { poison: Math.max(1, Math.floor(dmg * u.venom.share)), until: B.round + u.venom.rounds - 1 }, ev);
    if (u.sap) {
      d.ready = Math.max(0, d.ready - u.sap);
      ev.push({ t: 'ready', id: d.id, value: d.ready });
    }
  };
  const cellsBehind = (B, a, d, n) => {
    const out = [];
    let [c, r] = [d.c, d.r];
    for (let i = 0; i < n; i++) {
      const next = Hex.near(c, r).filter(p => Hex.dist(a.c, a.r, p[0], p[1]) > Hex.dist(a.c, a.r, c, r)).sort((p, q) => Math.abs(p[1] - r) - Math.abs(q[1] - r) || (q[0] - p[0]) * (a.c < d.c ? 1 : -1))[0];
      if (!next) break;
      out.push(next);
      [c, r] = next;
    }
    return out;
  };
  const chillOne = (t, chill, ev) => {
    if (t.count <= 0 || t.chill >= chill.max) return;
    t.chill = Math.min(chill.max, t.chill + chill.atk);
    ev.push({ t: 'chill', id: t.id, value: t.chill });
  };
  const keeperOf = (B, d) => (U(d).cover || U(d).machine ? null : alive(B).find(k => k !== d && k.side === d.side && U(k).cover && touching(k, k.c, k.r, d)) || null);
  const strike = (B, a, d, kind, ctx, ev) => {
    if (shotKind(kind) && fxHas(d, 'dodge')) {
      d.fx = d.fx.filter(e => !e.dodge);
      ev.push({ t: 'miss', by: a.id, to: d.id });
      return;
    }
    if (U(d).blink && H.roll(B) < U(d).blink) {
      ev.push({ t: 'miss', by: a.id, to: d.id, blink: true });
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
    let dmg = finalDmg(baseRoll(B, a) * m);
    const keeper = keeperOf(B, d);
    if (keeper) {
      const part = Math.floor(dmg * U(keeper).cover), had = keeper.count, taken = Math.max(1, Math.floor(part * mult(B, a, keeper, kind, ctx) / mult(B, a, d, kind, ctx)));
      if (part > 0) {
        dmg -= part;
        const lost = hurt(keeper, taken);
        ev.push({ t: 'hit', by: a.id, to: keeper.id, kind: 'cover', dmg: taken, kills: lost, left: keeper.count, hp: keeper.hp, luck: 0 });
        afterHit(B, keeper, lost, ev);
        if (keeper.count === 0) died(B, keeper, ev, a, had);
      }
    }
    const kills = hurt(d, dmg);
    a.dealt = true;
    if (sure && kind !== 'support') a.fx = a.fx.filter(e => e !== sure);
    ev.push({ t: 'hit', by: a.id, to: d.id, kind, dmg, kills, left: d.count, hp: d.hp, luck });
    afterHit(B, d, kills, ev);
    strikeTraits(B, a, d, kind, dmg, ev);
    const chill = U(a).chill;
    if (chill && (kind === 'melee' || kind === 'retal')) {
      chillOne(d, chill, ev);
      if (U(a).chillNear) for (const t of alive(B)) if (t !== d && t.side === d.side && !U(t).fixed && touching(t, t.c, t.r, d)) chillOne(t, chill, ev);
    }
    if (U(a).soulTake && kills > 0) a.souls = (a.souls || 0) + kills * hpOf(d) * U(a).soulTake;
    if (HEAT_KINDS.includes(kind)) heatUp(B, a);
    if (a.rested && (kind === 'melee' || shotKind(kind))) a.rested = false;
    if (d.count === 0) died(B, d, ev, a, before);
  };
  const HEAT_KINDS = ['melee', 'retal', 'shot', 'saddle', 'volley', 'pole'];
  const heatUp = (B, a) => {
    if (!F(a).heat || U(a).machine || a.heatAct === B.acts) return;
    a.heatAct = B.acts;
    a.heat = Math.min(heatCap(B, a), (a.heat || 0) + 1);
  };

  const canAnswer = d => !U(d).machine && !d.fx.some(e => e.sleep || e.blind || e.frozen || e.skip);
  const braces = (a, d, ctx) => !!U(d).brace && !U(a).noBrace && !U(a).elusive && (ctx.run || 0) >= U(d).brace && !d.retaliated && canAnswer(d);
  const melee = (B, a, d, ctx, ev) => {
    const help = supporters(B, d).filter(s => s !== a), answer = canAnswer(d) && !U(a).elusive;
    if (braces(a, d, ctx)) {
      d.retaliated = true;
      ev.push({ t: 'trait', id: d.id, name: 'Упор' });
      strike(B, d, a, 'retal', { c: d.c, r: d.r }, ev);
      if (a.count === 0) return;
    }
    strike(B, a, d, 'melee', ctx, ev);
    if (U(a).flame && a.count > 0) {
      for (const t of stacksIn(B, cellsBehind(B, a, d, U(a).flame.cells))) if (t !== d && t.side !== a.side) strike(B, a, t, 'flame', { c: a.c, r: a.r }, ev);
    }
    if (U(a).burn && a.count > 0) {
      const u = U(a);
      B.zones = B.zones.filter(z => z.by !== a.id);
      B.zones.push({ by: a.id, cells: cellsBehind(B, a, d, u.flame.cells).map(p => [p[0], p[1]]), until: B.round + u.burn.rounds - 1, dmg: Math.max(1, Math.floor(a.count * (u.dmg[0] + u.dmg[1]) / 2 * u.burn.share)) });
      ev.push({ t: 'trait', id: a.id, name: 'Горит трава' });
    }
    if (U(a).sweep && a.count > 0) {
      for (const t of alive(B).filter(x => x !== d && x.side !== a.side && !U(x).fixed && touching(a, a.c, a.r, x)).slice(0, U(a).sweep.count - 1)) strike(B, a, t, 'sweep', { c: a.c, r: a.r }, ev);
    }
    if (U(a).arc && a.count > 0) {
      for (const t of alive(B).filter(x => x !== d && x.side === d.side && !U(x).fixed && touching(x, x.c, x.r, d)).slice(0, U(a).arc.n)) strike(B, a, t, 'arc', { c: a.c, r: a.r }, ev);
    }
    if (U(a).trample && a.count > 0) {
      for (const t of stacksIn(B, cellsBehind(B, a, d, U(a).trample.cells))) if (t !== d && t.side !== a.side) strike(B, a, t, 'trample', { c: a.c, r: a.r }, ev);
    }
    for (const s of help) {
      if (a.count === 0) break;
      s.supported = true;
      strike(B, s, a, 'support', { c: s.c, r: s.r }, ev);
    }
    if (a.count > 0 && d.count > 0 && !d.retaliated && answer) {
      d.retaliated = true;
      strike(B, d, a, 'retal', { c: d.c, r: d.r }, ev);
      const more = U(d).retalTwo && d.count > 0 ? alive(B).find(x => x !== a && x.side === a.side && !U(x).fixed && touching(d, d.c, d.r, x)) : null;
      if (more) strike(B, d, more, 'retal', { c: d.c, r: d.r }, ev);
    }
    if (U(a).ram && a.count > 0 && d.count > 0) shove(B, a, d, U(a).ram, ev);
  };
  const shove = (B, a, d, n, ev) => {
    if (U(d).machine) return;
    const o = occupancy(B, d);
    let to = null;
    for (const [c, r] of cellsBehind(B, a, d, n)) {
      if (!fits(o, d, c, r)) break;
      to = [c, r];
    }
    if (!to) return;
    ev.push({ t: 'trait', id: d.id, name: U(a).ramName || 'Таран' });
    moveTo(B, d, { c: to[0], r: to[1], steps: 1, path: [[d.c, d.r], to], slide: true }, ev);
  };

  const blastTargets = (B, a, d) => {
    const u = U(a), out = [];
    if (u.splash) for (const t of alive(B)) if (t !== d && t.side === d.side && !U(t).fixed && touching(d, d.c, d.r, t)) out.push([t, 'splash']);
    if (u.line) for (const t of stacksIn(B, cellsBehind(B, a, d, u.line.cells)).filter(x => x !== d && x.side === d.side).sort((x, y) => gap(d, d.c, d.r, x) - gap(d, d.c, d.r, y)).slice(0, u.line.max || Infinity)) out.push([t, 'through']);
    return out;
  };
  const sootheNear = (B, s, ev) => {
    for (const t of alive(B)) {
      if (t === s || t.side !== s.side || U(t).machine || !touching(s, s.c, s.r, t)) continue;
      healStack(B, t, s.count * hpOf(s) * U(s).soothe, false, ev);
      t.fx = t.fx.filter(e => !e.fear);
    }
  };

  const joySong = (B, s, ev) => {
    const j = U(s).joy;
    for (const t of alive(B)) {
      if (t === s || t.side !== s.side || U(t).machine || gap(s, s.c, s.r, t) > j.range) continue;
      healStack(B, t, s.count * hpOf(s) * j.heal, false, ev);
      t.fx = t.fx.filter(e => e.trait !== 'Радостная песнь');
      t.fx.push({ trait: 'Радостная песнь', morale: j.morale, until: B.round, bad: false });
    }
  };

  const order = (a, b) => b.ready - a.ready || initOf(b) - initOf(a) || b.side - a.side || a.id - b.id;

  const fighter = s => !s.summoned && !U(s).machine;
  const finishNow = B => [0, 1].some(side => !alive(B).some(s => s.side === side && fighter(s)));
  const finish = (B, ev) => {
    if (B.winner >= 0) return true;
    const left = [0, 1].map(side => alive(B).some(s => s.side === side && fighter(s)));
    if (left[0] && left[1]) return false;
    B.winner = left[0] ? 0 : 1;
    B.active = -1;
    ev.push({ t: 'end', winner: B.winner });
    return true;
  };

  const burnAt = (B, s, ev) => {
    if (s.count <= 0 || U(s).fixed) return;
    for (const z of B.zones) {
      if (!cells(s).some(p => z.cells.some(q => q[0] === p[0] && q[1] === p[1]))) continue;
      const dmg = Math.floor(z.dmg * fireMul(B, s));
      if (dmg <= 0) continue;
      const kills = hurt(s, dmg);
      ev.push({ t: 'hit', by: -1, to: s.id, kind: 'fire', dmg, kills, left: s.count, hp: s.hp, luck: 0 });
      s.hurtRound = B.round;
      if (s.count === 0) {
        died(B, s, ev);
        return;
      }
    }
  };

  const towerGain = (t, dmg) => Math.min(dmg, total(t)) / hpOf(t) * U(t).cost;
  const towerFire = (B, ev) => {
    const sg = B.siege;
    for (let i = 0; i < sg.towers && !finishNow(B); i++) {
      const list = alive(B).filter(t => t.side === 0 && !U(t).fixed && !veiled(B, t));
      if (!list.length) return;
      const t = list.reduce((a, b) => (towerGain(b, sg.dmg) > towerGain(a, sg.dmg) ? b : a)), kills = hurt(t, sg.dmg);
      ev.push({ t: 'hit', by: -1, to: t.id, kind: 'tower', dmg: sg.dmg, kills, left: t.count, hp: t.hp, luck: 0 });
      afterHit(B, t, kills, ev);
      if (t.count === 0) died(B, t, ev);
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
    for (const s of B.stacks) {
      if (s.count <= 0 || !s.expire || s.expire >= B.round) continue;
      s.count = 0;
      s.hp = 0;
      ev.push({ t: 'death', id: s.id });
      if (s.unit === 'woodtree') addBrush(B, s.side, s.c, s.r);
    }
    for (const t of B.temp) {
      if (!t.wound) continue;
      for (const s of alive(B)) {
        if (U(s).fixed || (t.only != null && s.side !== t.only) || !cells(s).some(p => Hex.dist(p[0], p[1], t.c, t.r) === 1)) continue;
        const dmg = Math.max(1, Math.ceil(total(s) * t.wound)), kills = hurt(s, dmg);
        ev.push({ t: 'hit', by: -1, to: s.id, kind: 'thorn', dmg, kills, left: s.count, hp: s.hp, luck: 0 });
        if (s.count === 0) died(B, s, ev);
      }
    }
    for (const s of alive(B)) {
      const regen = fxs(s, 'regen') + (U(s).regen || 0) + (U(s).machine ? 0 : heroOf(B, s).regen || 0);
      if (regen > 0) healStack(B, s, s.start * hpOf(s) * regen, false, ev);
      if (heroOf(B, s).brushBlood && !U(s).machine && touchesBrush(B, s, s.side)) healStack(B, s, s.start * hpOf(s) * heroOf(B, s).brushBlood, false, ev);
      if (heroOf(B, s).tideHeal && F(s).tide && B.round % 2 === 0) healStack(B, s, s.start * hpOf(s) * heroOf(B, s).tideHeal, false, ev);
      shoalOn(B, s);
      burnAt(B, s, ev);
    }
    for (const s of alive(B)) {
      const u = U(s);
      if (!u.healNear && !u.rally) continue;
      for (const t of alive(B)) {
        if (t === s || t.side !== s.side || U(t).machine || !touching(s, s.c, s.r, t)) continue;
        if (u.healNear) healStack(B, t, s.count * hpOf(s) * u.healNear, true, ev);
        if (u.rally) t.ready += u.rally;
      }
    }
    for (const s of alive(B)) {
      const light = U(s).beacon;
      if (!light) continue;
      const low = alive(B).filter(t => t !== s && t.side === s.side && !U(t).machine && touching(s, s.c, s.r, t) && total(t) < t.start * hpOf(t)).sort((a, b) => total(a) / (a.start * hpOf(a)) - total(b) / (b.start * hpOf(b)))[0];
      if (low) healStack(B, low, s.count * hpOf(s) * light.heal, false, ev);
    }
    if (B.deck && B.round === BT.deckPlanks) {
      B.obstacles = B.obstacles.filter(p => !BT.plankRows.includes(p[1]));
      ev.push({ t: 'planks' });
    }
    if (B.siege) towerFire(B, ev);
    ev.push({ t: 'round', n: B.round });
  };

  const forced = (B, s, wild, ev) => {
    s.fx = s.fx.filter(e => e !== wild);
    s.ready = 0;
    ev.push({ t: 'wild', id: s.id, betray: !!wild.betray });
    const rc = reach(B, s), pool = alive(B).filter(t => t !== s && !U(t).fixed && (!wild.betray || t.side === s.side)).sort((a, b) => gap(s, s.c, s.r, a) - gap(s, s.c, s.r, b));
    for (const t of pool) {
      const spot = spots(B, s, t, rc).sort((x, y) => x.steps - y.steps)[0];
      if (!spot) continue;
      moveTo(B, s, spot, ev);
      if (s.count > 0) melee(B, s, t, { c: s.c, r: s.r, flown: 0, run: spot.steps }, ev);
      return;
    }
  };

  const shoalOn = (B, s) => {
    const sh = B.shallow;
    if (!sh || s.count <= 0 || s.side === sh.side || U(s).fixed) return;
    s.fx = s.fx.filter(e => e.trait !== 'Мелководье');
    if (cells(s).some(p => sh.cells.some(q => q[0] === p[0] && q[1] === p[1]))) s.fx.push({ trait: 'Мелководье', initPct: -H.HERO.tide.floodInit, until: B.round, bad: true });
  };

  const scorch = (B, s, dmg, kind, ev) => {
    if (dmg <= 0 || s.count <= 0) return false;
    const kills = hurt(s, dmg);
    ev.push({ t: 'hit', by: -1, to: s.id, kind, dmg, kills, left: s.count, hp: s.hp, luck: 0 });
    s.hurtRound = B.round;
    if (s.count === 0) {
      died(B, s, ev);
      return true;
    }
    return false;
  };
  const overheat = (B, s, ev) => {
    if (!F(s).heat || U(s).machine || (s.heat || 0) < heatCap(B, s) || fxHas(s, 'noOverheat')) return false;
    const F0 = H.HERO.forge, slag = heroOf(B, s).slag;
    if (slag) for (const t of alive(B).filter(x => x.side !== s.side && !U(x).machine && touching(s, s.c, s.r, x))) scorch(B, t, Math.floor(total(t) * F0.slag * fireMul(B, t)), 'fire', ev);
    return scorch(B, s, Math.max(1, Math.floor(total(s) * F0.burn)), 'heat', ev);
  };
  const startTurn = (B, s, ev) => {
    const ember = fxs(s, 'ember');
    if (ember > 0 && scorch(B, s, Math.floor(ember * fireMul(B, s)), 'fire', ev)) return true;
    if (overheat(B, s, ev)) return true;
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
    if (U(s).soothe) sootheNear(B, s, ev);
    if (U(s).joy) joySong(B, s, ev);
    return false;
  };

  const advance = (B, ev) => {
    for (let guard = 0; guard < 100000; guard++) {
      if (finish(B, ev)) return;
      const due = alive(B).filter(s => s.ready >= BT.full).sort(order);
      if (due.length) {
        const s = due[0], rival = B.sides[1 - s.side].hero;
        if (rival && rival.brushRoots && s.rooted !== B.round && !U(s).machine && touchesBrush(B, s, 1 - s.side)) {
          s.rooted = B.round;
          s.ready -= rival.brushRoots;
          ev.push({ t: 'trait', id: s.id, name: 'Корни держат' });
          continue;
        }
        s.defending = false;
        if (startTurn(B, s, ev)) continue;
        const m = U(s).machine || U(s).oath ? 0 : moraleOf(B, s);
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
      for (const s of alive(B)) if (!U(s).passive && !(B.sides[s.side].stopTicks > 0)) s.ready += initOf(s);
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
    const spec = (h.unit && h.unit.units.includes(x.unit) ? h.unit.n : 0) + (h.kings && u.faction === 'throne' ? h.kings : 0);
    const shots = u.shots ? u.shots + (h.shots || 0) + (h.gun && h.gun.units.includes(x.unit) ? h.gun.shots : 0) : 0;
    const s = { id: B.stacks.length, side, unit: x.unit, count: x.count, start: x.count, hp: u.hp, c: x.c, r: x.r, ready: 0, shots, waited: false, defending: false, retaliated: false, supported: false, chill: 0, lament: 0, atkPlus: (h.atk || 0) + stars + spec, defPlus: (h.def || 0) + stars + spec + (x.guard || 0), initPlus: h.init || 0, stand: h.stand || 0, stars, vet: x.vet || 0, dealt: false, fx: [], hpPct: 0, hurtRound: 0, summoned: false, phantom: false, borrowed: 0, was: [{ count: x.count, hp: u.hp }, { count: x.count, hp: u.hp }], speedPlus: h.speed || 0, walked: false };
    if (h.hpPct || x.hpPlus) {
      s.hpPct = (h.hpPct || 0) + (x.hpPlus || 0);
      s.hp = hpOf(s);
      s.was = [{ count: x.count, hp: s.hp }, { count: x.count, hp: s.hp }];
    }
    B.stacks.push(s);
    return s;
  };

  const buildSiege = o => {
    const T = H.SIEGE, wall = T.wall[o.fort] * (o.wallMul || 1), towers = T.towers[o.fort];
    const rows = towers ? [[1, 2], [3], [6], [7, 8]] : [[0, 1, 2], [3], [6], [7, 8, 9]];
    return { fort: o.fort, faction: o.faction || null, col: T.col, dmg: o.dmg || 0, towers, moat: o.fort >= 3, pieces: [...rows.map(r => ({ rows: r, hp: wall, max: wall, gate: false })), { rows: [4, 5], hp: T.gate[o.fort], max: T.gate[o.fort], gate: true }] };
  };
  const spread = (i, n) => Math.round((i + 0.5) * BT.rows / n - 0.5);
  const siegeSpot = (sd, i) => {
    const n = sd.stacks.length, front = sd.front == null ? n : sd.front;
    if (i < front) return [H.SIEGE.col + (n > front ? 1 : 2), spread(i, front)];
    return [H.SIEGE.col + 3, spread(i - front, n - front)];
  };
  const MACHINE_ROW = { ballista: 2, wagon: 4, tent: 7 };
  const addMachine = (B, side, id, hero) => {
    const h = hero || NONE, s = addStack(B, side, { unit: id, count: 1, c: 0, r: 0 }, null), T = H.MACHINE;
    s.atkPlus = h.atk || 0;
    s.defPlus = h.def || 0;
    s.crew = (1 + (h.level || 0) * T.crewLevel) * ((h.machines || 0) >= 2 ? T.skilled : 1) * (1 + (h.machinePct || 0));
    if (U(s).fixed) {
      s.c = -5;
      s.r = 0;
      return s;
    }
    const at = freeCellNear(B, s, side ? BT.cols - 1 : 0, MACHINE_ROW[id]);
    if (at) [s.c, s.r] = at;
    else {
      s.count = 0;
      s.hp = 0;
    }
    return s;
  };

  const addBrush = (B, side, c, r) => {
    if (occupancy(B)[idx(c, r)] !== -1) return false;
    const hero = B.sides[side].hero || NONE;
    B.obstacles.push([c, r]);
    B.temp.push({ c, r, until: 9999, wound: hero.brushThorn || 0, only: 1 - side, brush: side });
    return true;
  };
  const plantOkay = (B, side, c, r) => {
    const sd = B.sides[side];
    if (B.started || !(sd.plantLeft > 0) || !inside(c, r) || occupancy(B)[idx(c, r)] !== -1) return false;
    return (sd.hero && sd.hero.brushWhisper) || (side ? c >= BT.cols / 2 : c < BT.cols / 2);
  };
  const plant = (B, side, c, r) => {
    if (!plantOkay(B, side, c, r)) fail('cannot plant there');
    addBrush(B, side, c, r);
    B.sides[side].plantLeft--;
  };
  const plantRest = (B, side) => {
    const sd = B.sides[side], front = side ? BT.cols - 6 : 5;
    while (sd.plantLeft > 0) {
      const own = alive(B).filter(s => s.side === side && !U(s).machine);
      let best = null, top = -Infinity;
      for (let r = 0; r < BT.rows; r++) {
        for (let c = 0; c < BT.cols; c++) {
          if (!plantOkay(B, side, c, r)) continue;
          const score = -Math.abs(c - front) + own.filter(s => cells(s).some(p => Hex.dist(p[0], p[1], c, r) <= 2)).length * 0.5 + H.roll(B) * 0.8;
          if (score > top) {
            top = score;
            best = [c, r];
          }
        }
      }
      if (!best) {
        sd.plantLeft = 0;
        return;
      }
      plant(B, side, best[0], best[1]);
    }
  };

  const plantAll = B => {
    if (!B.started) B.sides.forEach((sd, side) => { if (sd.plantLeft > 0) plantRest(B, side); });
  };

  const mirrorOkay = (B, side, id) => {
    const sd = B.sides[side], s = B.stacks[id], h = sd.hero || NONE;
    return !B.started && sd.mirrorLeft > 0 && !!s && s.side === side && s.count > 0 && !s.summoned && !s.mirrored && !U(s).machine && U(s).tier <= (h.mirrorTier || H.HERO.throne.tier);
  };
  const mirror = (B, side, id) => {
    if (!mirrorOkay(B, side, id)) fail('cannot mirror that');
    const sd = B.sides[side], s = B.stacks[id], h = sd.hero, ev = [];
    sd.mirrorLeft--;
    s.mirrored = true;
    const copy = summonStack(B, side, { unit: s.unit, count: Math.max(1, Math.round(s.count * (h.mirrorShare || H.HERO.throne.share))) }, { phantom: true, reflection: true, expire: B.round + (h.mirrorRounds || H.HERO.throne.rounds) - 1 }, [s.c, s.r], ev);
    if (copy) {
      copy.ready = s.ready;
      ev.push({ t: 'trait', id: copy.id, name: 'Отражение' });
    }
    return ev;
  };
  const mirrorRest = (B, side) => {
    const sd = B.sides[side], ev = [];
    while (sd.mirrorLeft > 0) {
      const best = B.stacks.filter(s => mirrorOkay(B, side, s.id)).sort((a, b) => b.count * U(b).cost - a.count * U(a).cost || a.id - b.id)[0];
      if (!best) sd.mirrorLeft = 0;
      else ev.push(...mirror(B, side, best.id));
    }
    return ev;
  };
  const mirrorAll = B => (B.started ? [] : B.sides.flatMap((sd, side) => (sd.mirrorLeft > 0 ? mirrorRest(B, side) : [])));

  const create = o => {
    const B = { v: 1, seed: o.seed >>> 0, rs: ((o.seed >>> 0) ^ 0x9e3779b9) >>> 0, tick: 0, round: 1, active: -1, winner: -1, started: false, obstacles: [], temp: [], zones: [], orderUntil: 0, moon: o.moon || null, field: o.field || null, deck: !!o.deck, shore: !!o.shore, shallow: null, stacks: [], sides: [] };
    B.sides = o.sides.map(sd => {
      const peoples = new Set(sd.stacks.map(x => H.UNITS[x.unit].faction).filter(f => f !== 'neutral'));
      return { morale: sd.morale || 0, luck: sd.luck || 0, mix: sd.hero && sd.hero.banner ? 0 : Math.max(0, peoples.size - 1), hero: sd.hero ? Object.assign({}, sd.hero) : null, used: {}, acted: 0, boost: null, noShoot: 0, stopTicks: 0, canFlee: !!sd.canFlee, ransomOk: !!sd.ransomOk, gold: sd.gold || 0, aiFlees: !!sd.aiFlees };
    });
    if (o.siege) B.siege = buildSiege(o.siege);
    B.fled = null;
    o.sides.forEach((sd, side) => {
      const n = sd.stacks.length;
      sd.stacks.forEach((x, i) => {
        const big = H.UNITS[x.unit].big ? 1 : 0, spot = o.siege && side === 1 ? siegeSpot(sd, i) : null;
        const r = x.r != null ? x.r : spot ? spot[1] : spread(i, n);
        const c = x.c != null ? x.c : spot ? spot[0] : side ? BT.cols - 1 - big : big;
        addStack(B, side, Object.assign({}, x, { c, r }), sd.hero);
      });
    });
    if (B.deck) for (const c of BT.deckGap) for (let r = 0; r < BT.rows; r++) B.obstacles.push([c, r]);
    else if (o.obstacles) B.obstacles = o.obstacles.map(p => [p[0], p[1]]);
    else {
      const occ = occupancy(B), want = BT.obstacles[0] + Math.floor(H.roll(B) * (BT.obstacles[1] - BT.obstacles[0] + 1));
      for (let tries = 0; B.obstacles.length < want && tries < 500; tries++) {
        const c = 3 + Math.floor(H.roll(B) * (o.siege ? H.SIEGE.col - 5 : BT.cols - 6)), r = Math.floor(H.roll(B) * BT.rows);
        if (occ[idx(c, r)] !== -1) continue;
        occ[idx(c, r)] = -2;
        B.obstacles.push([c, r]);
      }
    }
    o.sides.forEach((sd, side) => {
      for (const id of sd.machines || []) addMachine(B, side, id, sd.hero);
    });
    B.sides.forEach((sd, side) => {
      if (!sd.hero || !sd.hero.thicket || B.deck) return;
      const occ = occupancy(B), c = side ? BT.cols - 4 : 3, r = [4, 5, 3, 6, 2, 7].find(y => occ[idx(c, y)] === -1);
      if (r == null) return;
      B.obstacles.push([c, r]);
      B.temp.push({ c, r, until: 9999, wound: H.MACHINE.thicket });
    });
    B.sides.forEach((sd, side) => {
      if (!sd.hero || !sd.hero.brush || B.deck) return;
      sd.plantLeft = sd.hero.brush;
      if (!o.sides[side].plantByHand) plantRest(B, side);
    });
    if (o.siege) addMachine(B, 0, 'catapult', o.sides[0].hero);
    for (const s of B.stacks) {
      const own = B.sides[s.side].hero || NONE, foe = B.sides[1 - s.side].hero || NONE, set = o.ready ? o.ready[s.id] : null;
      s.ready = U(s).passive ? 0 : Math.max(0, (set != null ? set : Math.floor(H.roll(B) * (BT.startReady + 1))) + (own.firstReady || 0) + (U(s).ambush || 0) - (foe.enemyReady || 0));
    }
    B.sides.forEach((sd, side) => {
      if (!sd.hero) return;
      if (sd.hero.heatStart) for (const s of B.stacks) if (s.side === side && F(s).heat && !U(s).machine) s.heat = 1;
      if (sd.hero.smoke) for (const s of B.stacks) if (s.side !== side && U(s).shots && !U(s).machine) s.fx.push({ trait: 'Серный дым', dmgPct: -sd.hero.smoke, until: H.HERO.forge.smokeRounds, bad: true });
    });
    B.sides.forEach((sd, side) => {
      if (!sd.hero || !sd.hero.mirror) return;
      sd.mirrorLeft = sd.hero.mirror;
      if (!o.sides[side].plantByHand) mirrorRest(B, side);
    });
    B.opening = [];
    advance(B, B.opening);
    return B;
  };

  const fail = m => { throw new Error(m); };
  const enemy = (B, s, id) => {
    const t = B.stacks[id];
    if (!t || t.count <= 0 || t.side === s.side || U(t).fixed) fail('bad target');
    return t;
  };
  const moveTo = (B, s, dest, ev) => {
    if (dest.steps > 0) ev.push({ t: 'move', id: s.id, path: dest.path, fly: !!U(s).fly || !!dest.slide });
    if (dest.steps > 0 && !dest.slide) s.walked = true;
    s.c = dest.c;
    s.r = dest.r;
    if (B.zones.length) burnAt(B, s, ev);
    if (B.shallow) shoalOn(B, s);
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

  const floodCells = (c, r) => [[c, r], ...Hex.near(c, r)].slice(0, H.HERO.tide.floodCells);
  const canOrder = (B, kind) => {
    const s = B.stacks[B.active];
    if (!s || B.winner >= 0) return false;
    const side = B.sides[s.side], h = side.hero;
    if (!h) return false;
    if (kind === 'warcry') return !!h.warcry && !side.used.warcry && alive(B).some(t => t.side === s.side && t !== s);
    if (kind === 'flood') return !!h.flood && !side.used.flood && side.acted !== B.round;
    if (kind !== 'high' || !h.high || side.used.high || side.acted === B.round) return false;
    if (h.high === 'forest') return B.temp.some(t => t.brush === s.side);
    return h.high !== 'kurgan' || !!fallen(B, s.side);
  };

  const command = (B, a) => {
    const s = B.stacks[B.active], ev = [];
    if (!s || !canOrder(B, a.order)) fail('cannot give this order');
    const side = B.sides[s.side];
    if (a.order === 'flood') {
      if (!inside(a.c, a.r)) fail('bad cell');
      side.used.flood = true;
      side.acted = B.round;
      B.shallow = { side: s.side, cells: floodCells(a.c, a.r) };
      for (const t of alive(B)) shoalOn(B, t);
      ev.push({ t: 'order', order: 'flood', id: s.id });
      return ev;
    }
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
    } else if (side.hero.high === 'forest') {
      const n = 1 + Math.floor((side.hero.level || 0) / H.HERO.forest.perLevel), until = B.round + H.HERO.forest.rounds - 1;
      for (const t of B.temp.filter(x => x.brush === s.side)) {
        B.obstacles = B.obstacles.filter(p => p[0] !== t.c || p[1] !== t.r);
        B.temp = B.temp.filter(x => x !== t);
        const tree = addStack(B, s.side, { unit: 'woodtree', count: n, c: t.c, r: t.r }, side.hero);
        tree.summoned = true;
        tree.expire = until;
        ev.push({ t: 'summon', id: tree.id, c: tree.c, r: tree.r, count: tree.count });
      }
      ev.push({ t: 'order', order: 'forest', id: s.id });
    } else if (side.hero.high === 'erupt') {
      const F0 = H.HERO.forge;
      for (const t of alive(B)) {
        if (t.side === s.side || U(t).machine) continue;
        scorch(B, t, Math.floor(side.hero.level * F0.erupt * fireMul(B, t)), 'fire', ev);
      }
      for (const t of alive(B)) {
        if (t.side !== s.side || !F(t).heat || U(t).machine) continue;
        t.heat = heatCap(B, t);
        t.fx = t.fx.filter(e => e.trait !== 'Извержение');
        t.fx.push({ trait: 'Извержение', noOverheat: true, until: B.round + F0.eruptRounds - 1, bad: false });
      }
      ev.push({ t: 'order', order: 'erupt', id: s.id });
    } else if (side.hero.high === 'wave') {
      const W = H.HERO.tide;
      for (const t of alive(B)) {
        if (t.side === s.side || U(t).machine || U(t).fixed) continue;
        const dir = t.side ? 1 : -1, o = occupancy(B, t);
        let c = t.c;
        for (let i = 0; i < W.waveCells && fits(o, t, c + dir, t.r); i++) c += dir;
        if (c !== t.c) moveTo(B, t, { c, r: t.r, steps: 1, path: [[t.c, t.r], [c, t.r]], slide: true }, ev);
        t.ready = Math.max(0, t.ready - W.waveReady);
        ev.push({ t: 'ready', id: t.id, value: t.ready });
      }
      ev.push({ t: 'order', order: 'wave', id: s.id });
    } else if (side.hero.high === 'kings') {
      const T = H.HERO.throne, n = Math.max(1, Math.floor((side.hero.level || 0) / T.kingPer));
      summonStack(B, s.side, { unit: 'moonking', count: n }, { expire: B.round + T.kingRounds - 1 }, [s.side ? BT.cols - 2 : 1, Math.floor(BT.rows / 2)], ev);
      ev.push({ t: 'order', order: 'kings', id: s.id });
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
  const schoolRank = (B, h, sp) => Math.min(3, (h.ranks[sp.school] || 0) + (B.moon && B.moon.id === 'convergence' ? 1 : 0) + (B.field === 'moonglade' ? 1 : 0));
  const spellCost = (B, h, sp) => {
    const r = schoolRank(B, h, sp), moon = B.moon && B.moon.id;
    let c = sp.mana - (r >= 2 ? r - 1 : 0);
    if ((moon === 'white' && sp.school === 'yasna') || (moon === 'silver' && sp.school === 'morok')) c--;
    if (sp.school === 'morok' && h.perks.includes('shade')) c--;
    c -= h.manaCut || 0;
    if (h.moonMana && B.moon && (H.Moons.byId[B.moon.id] || {}).school === sp.school) c -= h.moonMana;
    if (B.field === 'holyground') c -= BT.holyMana;
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
    if (sp.school === 'yasna' && h.coldLight) n += h.coldLight;
    return n;
  };

  const resists = (t, sp) => {
    const u = U(t);
    if (u.spellproof) return true;
    if (u.moonproof && (sp.school === 'yasna' || sp.school === 'morok')) return true;
    if (u.oath && sp.school === 'morok') return true;
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
  const stacksIn = (B, list) => alive(B).filter(s => !U(s).machine && cells(s).some(p => list.some(q => q[0] === p[0] && q[1] === p[1])));

  const spellDamage = (B, h, sp, t, raw) => {
    let dmg = raw;
    if (!sp.pure) dmg *= H.clamp(Math.pow(BT.statBase, -(defOf(t, 0) * ebbOf(B, t) + nearBonus(B, t, 'guardNear') + brushDef(B, t)) / 2), 0.5, 1);
    if (sp.spiritOnly && !U(t).spirit) dmg *= sp.spiritOnly;
    if (sp.school === 'zhar') {
      if (!fireMul(B, t)) return 0;
      dmg *= fireMul(B, t);
    }
    if (sp.school === 'zhar' && B.moon && B.moon.id === 'red') dmg *= 1.2;
    if (sp.school === 'zhar' && h.perks.includes('fireire') && t.hurtRound === B.round) dmg *= 1.15;
    dmg *= 1 - (U(t).spellIn || 0);
    const foe = B.sides[t.side].hero;
    if (foe && foe.perks && foe.perks.includes('measureshield')) dmg *= 0.85;
    if (foe && foe.spellIn) dmg *= 1 - foe.spellIn;
    if (foe && foe.saltWounds && (sp.school === 'zhar' || sp.school === 'yasna')) dmg *= 1 - foe.saltWounds;
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
  const weakest = (B, side, skip) => alive(B).filter(s => s.side === side && s !== skip && !U(s).machine).sort((a, b) => total(a) / (a.start * hpOf(a)) - total(b) / (b.start * hpOf(b)))[0] || null;

  const mirrorBack = (B, side, back, ev) => {
    const pool = alive(B).filter(x => x.side === side && !U(x).machine);
    if (back <= 0 || !pool.length) return;
    const x = pool[Math.floor(H.roll(B) * pool.length)], lost = hurt(x, back);
    ev.push({ t: 'hit', by: -1, to: x.id, kind: 'mirror', dmg: back, kills: lost, left: x.count, hp: x.hp, luck: 0 });
    afterHit(B, x, lost, ev);
    if (x.count === 0) died(B, x, ev);
  };
  const magicHit = (B, h, sp, t, raw, ev, side) => {
    const guard = B.sides[t.side].hero, full = spellDamage(B, h, sp, t, raw), back = guard && guard.spellBack && t.side !== side ? Math.floor(full * guard.spellBack) : 0, dmg = full - back, kills = hurt(t, dmg);
    ev.push({ t: 'hit', by: -1, to: t.id, kind: 'spell', spell: sp.id, dmg, kills, left: t.count, hp: t.hp, luck: 0 });
    afterHit(B, t, kills, ev);
    if (t.count === 0) died(B, t, ev);
    if (sp.school === 'zhar' && h.perks.includes('blaze')) B.zones.push({ cells: cells(t).map(p => [p[0], p[1]]), until: B.round + 1, dmg: Math.max(1, Math.floor(dmg * 0.1)) });
    if (sp.school === 'tlen' && h.perks.includes('reap')) {
      const low = weakest(B, side);
      if (low) healStack(B, low, dmg * 0.25, false, ev);
    }
    mirrorBack(B, side, back, ev);
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
    const amount = pair => spellAmount(B, h, sp, pair), caster = s.side, foes = () => alive(B).filter(t => t.side !== caster && !U(t).machine && !concealed(t, caster));
    let list = [];
    if (sp.aim === 'foe' || sp.aim === 'own' || sp.aim === 'stack' || sp.aim === 'push' || sp.aim === 'swap') list = [B.stacks[a.target]];
    else if (sp.aim === 'foes') list = foes();
    else if (sp.aim === 'owns') list = alive(B).filter(t => t.side === caster && !U(t).machine);
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
    if (B.field === 'moonless') return 'Пустошь без луны: колдовать нельзя';
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
    let list = alive(B).filter(t => !U(t).machine);
    if (sp.aim === 'foe') list = list.filter(t => t.side !== caster);
    if (sp.aim === 'own') list = list.filter(t => t.side === caster);
    list = list.filter(t => !concealed(t, caster) && !resists(t, sp));
    if (sp.limit) list = list.filter(t => total(t) <= spellAmount(B, h, sp, sp.limit) * (sp.id === 'sleep' && h.lullaby ? 1 + h.lullaby : 1));
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
  const walkField = (B, s) => {
    const o = occupancy(B, s), out = new Int16Array(BT.cols * BT.rows).fill(-1), through = !!F(s).brush || !!U(s).leap;
    let front = [];
    for (const t of targets(B, s.side)) {
      for (const [c, r] of cells(t)) {
        out[idx(c, r)] = 0;
        front.push([c, r]);
      }
    }
    const wall = new Set(wallRows(B, s.side));
    for (let step = 1; front.length; step++) {
      const next = [];
      for (const [fc, fr] of front) {
        for (const [c, r] of Hex.near(fc, fr)) {
          if (out[idx(c, r)] >= 0 || (o[idx(c, r)] === -2 && !through) || (B.siege && c === B.siege.col && wall.has(r))) continue;
          out[idx(c, r)] = step;
          next.push([c, r]);
        }
      }
      front = next;
    }
    return out;
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

  const ransomPrice = (B, side) => Math.ceil(alive(B).filter(s => s.side === side && fighter(s)).reduce((t, s) => t + s.count * U(s).cost, 0) / 2);
  const canRetreat = (B, side, kind) => {
    const sd = B.sides[side];
    if (B.winner >= 0 || !sd.hero || !sd.canFlee) return false;
    return kind !== 'ransom' || (sd.ransomOk && sd.gold >= ransomPrice(B, side));
  };
  const retreat = (B, s, kind) => {
    if (!canRetreat(B, s.side, kind)) fail('cannot retreat');
    const price = kind === 'ransom' ? ransomPrice(B, s.side) : 0;
    if (kind === 'flee') {
      for (const t of B.stacks) {
        if (t.side !== s.side) continue;
        t.count = 0;
        t.hp = 0;
        t.borrowed = 0;
      }
    } else for (const t of B.stacks) if (t.side === s.side) t.borrowed = 0;
    B.fled = { side: s.side, kind, price };
    B.winner = 1 - s.side;
    B.active = -1;
    return [{ t: 'fled', side: s.side, kind, price }, { t: 'end', winner: B.winner }];
  };

  const hitPiece = (B, s, i, ev) => {
    const sg = B.siege, hero = B.sides[s.side].hero || NONE, live = sg.pieces.map((p, k) => (p.hp > 0 ? k : -1)).filter(k => k >= 0);
    if (!live.length) return;
    const sure = (hero.machines || 0) >= 3 || H.roll(B) < H.SIEGE.catapultAim, k = sure && live.includes(i) ? i : live[Math.floor(H.roll(B) * live.length)], p = sg.pieces[k];
    p.hp--;
    ev.push({ t: 'wall', piece: k, hp: p.hp, gate: p.gate });
  };
  const hurl = (B, s, a, ev) => {
    if (!B.siege || U(s).machine !== 'catapult' || !B.siege.pieces[a.piece] || B.siege.pieces[a.piece].hp <= 0) fail('nothing to hit there');
    const hero = B.sides[s.side].hero || NONE;
    s.ready = 0;
    for (let i = (hero.machines || 0) >= 3 ? 2 : 1; i > 0; i--) hitPiece(B, s, a.piece, ev);
  };
  const tendList = (B, s) => alive(B).filter(t => t.side === s.side && !U(t).machine && t.hp < hpOf(t) && !fxHas(t, 'noHeal'));
  const tend = (B, s, a, ev) => {
    const t = B.stacks[a.target], list = tendList(B, s), hero = B.sides[s.side].hero || NONE, T = H.MACHINE;
    if (U(s).machine !== 'tent' || !list.includes(t)) fail('nobody to tend there');
    const amount = Math.round((T.tent[0] + T.tent[1] * (hero.level || 0)) * ((hero.machines || 0) >= 2 ? T.skilled : 1) * (1 + (hero.machinePct || 0)));
    const treat = x => {
      const n = Math.min(amount, hpOf(x) - x.hp);
      x.hp += n;
      ev.push({ t: 'heal', id: x.id, n, left: x.count, raised: 0 });
    };
    s.ready = 0;
    treat(t);
    if (hero.fieldmedic) {
      const more = list.filter(x => x !== t).sort((x, y) => (hpOf(y) - y.hp) - (hpOf(x) - x.hp))[0];
      if (more) treat(more);
    }
  };

  const canWard = s => !!U(s).ward && (s.warded || 0) < U(s).ward.uses;
  const wardList = (B, s) => alive(B).filter(t => t.side === s.side && !U(t).machine);
  const canCry = s => !!U(s).cry && (s.cried || 0) < U(s).cry.uses;
  const cryList = (B, s) => alive(B).filter(t => t !== s && t.side === s.side && !U(t).machine);
  const canGrow = s => !!U(s).plantOnce && !s.grown;
  const growOkay = (B, s, c, r) => canGrow(s) && inside(c, r) && occupancy(B)[idx(c, r)] === -1 && cells(s).some(p => Hex.dist(p[0], p[1], c, r) <= 2);
  const canFog = s => !!U(s).fog && !s.fogged;
  const canTemper = s => !!U(s).temper && s.shots > 0;
  const canSwitch = s => !!U(s).swapOnce && !s.switched;
  const switchList = (B, s) => alive(B).filter(t => t !== s && t.side === s.side && !U(t).machine && !U(t).big === !U(s).big);
  const canMend = s => !!U(s).mend && !s.phantom && (s.mended || 0) < U(s).mend.uses;
  const mendList = (B, s) => alive(B).filter(t => t.side === s.side && !U(t).machine && !t.phantom && !fxHas(t, 'noHeal') && total(t) < t.start * hpOf(t));
  const canRevive = s => !!U(s).revive && !s.phantom && !s.revived;
  const reviveList = (B, s) => alive(B).filter(t => t.side === s.side && !U(t).machine && !t.summoned && !fxHas(t, 'noHeal') && t.count < t.start);
  const beamCells = (B, a, d) => {
    const out = [], goal = cells(d), near = p => Math.min(...goal.map(g => Hex.dist(p[0], p[1], g[0], g[1])));
    let at = [a.c, a.r];
    for (let i = 0; i < BT.cols + BT.rows; i++) {
      const next = Hex.near(at[0], at[1]).sort((p, q) => near(p) - near(q))[0];
      if (!next || !near(next)) break;
      out.push(next);
      at = next;
    }
    return [...out, ...(U(a).line ? cellsBehind(B, a, d, U(a).line.cells) : [])];
  };
  const temperList = (B, s) => alive(B).filter(t => t.side === s.side && !U(t).machine && !t.fx.some(e => e.trait === 'Закалка'));
  const burstList = (B, s) => alive(B).filter(t => t !== s && !U(t).machine && touching(s, s.c, s.r, t));
  const canBurst = (B, s) => !!U(s).burst && burstList(B, s).some(t => t.side !== s.side);
  const canDeep = s => !!U(s).deep && !s.deeped;
  const deepOkay = (B, s, c, r) => canDeep(s) && inside(c, r) && fits(occupancy(B, s), s, c, r);
  const canAlarm = s => !!U(s).alarm && !s.alarmed;
  const canCall = s => !!U(s).kinCall && !s.called;
  const callList = (B, s) => alive(B).filter(t => t !== s && t.side === s.side && !U(t).machine && !t.summoned && !t.phantom && t.count < t.start);
  const canDrag = (B, s) => !!U(s).drag && (s.dragged || 0) < U(s).drag.uses && !enemyNear(B, s, s.c, s.r);
  const inDrag = (B, s, t) => canDrag(B, s) && !U(t).fixed && !U(t).machine && !fxHas(t, 'hidden') && gap(s, s.c, s.r, t) >= 2 && gap(s, s.c, s.r, t) <= U(s).drag.range;
  const dragTo = (B, s, t, n) => {
    const o = occupancy(B, t);
    let c = t.c, r = t.r, moved = null;
    for (let i = 0; i < n; i++) {
      const now = gap(t, c, r, s), next = Hex.near(c, r).filter(p => fits(o, t, p[0], p[1]) && gap(t, p[0], p[1], s) < now && gap(t, p[0], p[1], s) >= 1).sort((p, q) => gap(t, p[0], p[1], s) - gap(t, q[0], q[1], s))[0];
      if (!next) break;
      [c, r] = next;
      moved = [c, r];
    }
    return moved;
  };
  const canVolley = (B, s) => !!U(s).volley && !s.volleyed && !enemyNear(B, s, s.c, s.r) && !(B.sides[s.side].noShoot >= B.round);
  const pull = (B, s, t, n, name, ev) => {
    if (U(t).machine || U(t).fixed) return;
    const at = dragTo(B, s, t, n);
    if (!at) return;
    ev.push({ t: 'trait', id: t.id, name });
    moveTo(B, t, { c: at[0], r: at[1], steps: 1, path: [[t.c, t.r], at], slide: true }, ev);
  };
  const inVolley = (B, s, t) => canVolley(B, s) && !veiled(B, t) && gap(s, s.c, s.r, t) <= U(s).volley.range;
  const acrossWall = (B, c, t) => !!B.siege && (c < B.siege.col) !== (t.c < B.siege.col) && wallAt(B, t.r);
  const poleReach = (B, s, c, r, t) => !!U(s).pole && gap(s, c, r, t) === 2 && !acrossWall(B, c, t);
  const poleSpots = (B, s, t, rc) => (U(s).pole ? [...(rc || reach(B, s)).values()].filter(p => poleReach(B, s, p.c, p.r, t)) : []);

  const charmSpells = u => Object.values(H.SPELLS).filter(sp => sp.circle === u.charm && sp.aim === 'foe' && sp.school !== 'road' && (sp.dmg || sp.fx));
  const canCharm = s => !!(U(s).charm || U(s).spellOnce) && !s.charmed;
  const charm = (B, s, a, ev) => {
    const t = enemy(B, s, a.target), pool = U(s).spellOnce ? [H.SPELLS[U(s).spellOnce]] : charmSpells(U(s));
    if (!canCharm(s)) fail('no charm left');
    s.ready = 0;
    s.charmed = true;
    const sp = pool[Math.floor(H.roll(B) * pool.length)], h = { power: U(s).tier, ranks: {}, perks: [], sorcery: 0, specSpell: null };
    ev.push({ t: 'cast', spell: sp.id, side: s.side });
    applySpell(B, B.sides[s.side], h, s, sp, { target: t.id }, ev);
  };

  const act = (B, a) => {
    plantAll(B);
    mirrorAll(B);
    if (a.type === 'order') return command(B, a);
    if (a.type === 'cast') return cast(B, a);
    const s = B.stacks[B.active];
    if (!s || B.winner >= 0) fail('no active stack');
    if (a.type === 'flee' || a.type === 'ransom') return retreat(B, s, a.type);
    const u = U(s), ev = [];
    B.started = true;
    B.acts = (B.acts || 0) + 1;
    if (a.type !== 'wait') {
      s.walked = false;
      if (fxHas(s, 'oneTurn')) s.fx = s.fx.filter(e => !e.oneTurn);
    }
    let surge = !u.machine;
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
      if (u.restHit) s.rested = true;
      if (F(s).heat && s.heat) {
        s.heat = 0;
        ev.push({ t: 'trait', id: s.id, name: 'Остыть' });
        healStack(B, s, s.start * hpOf(s) * H.HERO.forge.cool, false, ev);
      }
    } else if (a.type === 'move') {
      const dest = reach(B, s).get(idx(a.c, a.r));
      if (!dest || !dest.steps) fail('cannot move there');
      s.ready = 0;
      moveTo(B, s, dest, ev);
    } else if (a.type === 'attack') {
      const t = enemy(B, s, a.target), dest = reach(B, s).get(idx(a.c, a.r)), far = !!dest && poleReach(B, s, dest.c, dest.r, t), home = [s.c, s.r];
      if (!dest || (!far && !touching(s, dest.c, dest.r, t))) fail('cannot attack from there');
      s.ready = 0;
      moveTo(B, s, dest, ev);
      if (u.pullNear && s.count > 0) for (const x of alive(B).filter(q => q.side !== s.side && gap(s, s.c, s.r, q) === 2)) pull(B, s, x, 1, 'Притянуть', ev);
      if (s.count > 0 && far) strike(B, s, t, 'pole', { c: s.c, r: s.r }, ev);
      else if (s.count > 0) {
        melee(B, s, t, { c: s.c, r: s.r, flown: u.fly ? dest.steps : 0, run: dest.steps }, ev);
        if ((u.twice || (u.twiceStill && !dest.steps)) && s.count > 0 && t.count > 0) strike(B, s, t, 'melee', { c: s.c, r: s.r, flown: 0, run: 0 }, ev);
      }
      if (u.raid && s.count > 0 && dest.steps > 0 && fits(occupancy(B, s), s, home[0], home[1])) moveTo(B, s, { c: home[0], r: home[1], steps: 1, path: [[s.c, s.r], home], slide: true }, ev);
    } else if (a.type === 'shoot') {
      const t = enemy(B, s, a.target);
      if (!canShoot(B, s) || !sees(B, s, t)) fail('cannot shoot');
      s.ready = 0;
      if (!u.machine && !wagonOn(B, s.side)) s.shots--;
      const blast = blastTargets(B, s, t);
      strike(B, s, t, 'shot', { c: s.c, r: s.r }, ev);
      for (const [n, kind] of blast) if (n.count > 0) strike(B, s, n, kind, { c: s.c, r: s.r }, ev);
      if (u.twiceShot && t.count > 0 && s.count > 0 && (s.shots > 0 || wagonOn(B, s.side))) {
        if (!wagonOn(B, s.side)) s.shots--;
        strike(B, s, t, 'shot', { c: s.c, r: s.r }, ev);
      }
      if (u.glow && s.count > 0) for (const x of stacksIn(B, beamCells(B, s, t))) if (x.side === s.side && x !== s) healStack(B, x, s.count * hpOf(s) * u.glow, false, ev);
      if (u.harpoon && t.count > 0 && s.count > 0) pull(B, s, t, u.harpoon, 'Гарпун', ev);
      if (u.blastReady) {
        for (const n of [t, ...blast.map(x => x[0])]) {
          if (n.count <= 0) continue;
          n.ready = Math.max(0, n.ready - u.blastReady);
          ev.push({ t: 'ready', id: n.id, value: n.ready });
        }
      }
      const crew = B.sides[s.side].hero || NONE;
      if (u.machine && (crew.doubleshot || (crew.gun && crew.gun.units.includes(s.unit))) && t.count > 0) strike(B, s, t, 'shot', { c: s.c, r: s.r }, ev);
    } else if (a.type === 'charm') charm(B, s, a, ev);
    else if (a.type === 'hurl') hurl(B, s, a, ev);
    else if (a.type === 'tend') tend(B, s, a, ev);
    else if (a.type === 'bell') {
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
      if (!u.saddle || s.shots <= 0 || !dest || (u.saddleSteps && dest.steps > u.saddleSteps) || enemyNear(B, s, dest.c, dest.r) || veiled(B, t) || B.sides[s.side].noShoot >= B.round) fail('cannot shoot from the saddle there');
      s.ready = 0;
      moveTo(B, s, dest, ev);
      if (!wagonOn(B, s.side)) s.shots--;
      if (s.count > 0) strike(B, s, t, 'saddle', { c: s.c, r: s.r }, ev);
    } else if (a.type === 'alarm') {
      if (!canAlarm(s)) fail('no alarm left');
      s.ready = 0;
      s.alarmed = true;
      for (const t of alive(B)) if (t.side === s.side && t !== s && !U(t).machine) t.ready += u.alarm;
      ev.push({ t: 'alarm', id: s.id, value: u.alarm });
    } else if (a.type === 'call') {
      const t = B.stacks[a.target];
      if (!canCall(s) || !t || !callList(B, s).includes(t)) fail('nobody to call there');
      const n = Math.max(1, Math.ceil((t.start - t.count) * u.kinCall));
      s.ready = 0;
      s.called = true;
      t.count += n;
      ev.push({ t: 'trait', id: t.id, name: 'Зов рода' });
      ev.push({ t: 'heal', id: t.id, n: n * hpOf(t), left: t.count, raised: n });
    } else if (a.type === 'lasso') {
      const t = enemy(B, s, a.target);
      if (!inDrag(B, s, t)) fail('lasso out of reach');
      const at = dragTo(B, s, t, u.drag.cells);
      s.ready = 0;
      s.dragged = (s.dragged || 0) + 1;
      ev.push({ t: 'trait', id: t.id, name: u.drag.name || 'Аркан' });
      if (at) moveTo(B, t, { c: at[0], r: at[1], steps: 1, path: [[t.c, t.r], at], slide: true }, ev);
      t.ready = Math.max(0, t.ready - u.drag.ready);
      ev.push({ t: 'ready', id: t.id, value: t.ready });
    } else if (a.type === 'temper') {
      const t = B.stacks[a.target];
      if (!canTemper(s) || !temperList(B, s).includes(t)) fail('cannot temper that');
      s.ready = 0;
      s.shots--;
      t.fx.push({ trait: 'Закалка', def: u.temper, until: 9999, bad: false });
      ev.push({ t: 'trait', id: t.id, name: 'Закалка' });
    } else if (a.type === 'switch') {
      const t = B.stacks[a.target];
      if (!canSwitch(s) || !t || !switchList(B, s).includes(t)) fail('cannot switch with that');
      s.ready = 0;
      s.switched = true;
      [s.c, s.r, t.c, t.r] = [t.c, t.r, s.c, s.r];
      ev.push({ t: 'swap', a: s.id, b: t.id });
      ev.push({ t: 'trait', id: s.id, name: 'Зеркальный шаг' });
    } else if (a.type === 'mend') {
      const t = B.stacks[a.target];
      if (!canMend(s) || !t || !mendList(B, s).includes(t)) fail('nobody to mend there');
      s.ready = 0;
      s.mended = (s.mended || 0) + 1;
      ev.push({ t: 'trait', id: t.id, name: 'Лунный свет' });
      healStack(B, t, s.count * hpOf(s) * u.mend.share, false, ev);
    } else if (a.type === 'revive') {
      const t = B.stacks[a.target];
      if (!canRevive(s) || !t || !reviveList(B, s).includes(t)) fail('nobody to revive there');
      s.ready = 0;
      s.revived = true;
      ev.push({ t: 'trait', id: t.id, name: 'Белый свет' });
      healStack(B, t, s.count * u.revive, true, ev);
    } else if (a.type === 'burst') {
      const near = burstList(B, s);
      if (!canBurst(B, s)) fail('nothing to burst on');
      s.ready = 0;
      ev.push({ t: 'trait', id: s.id, name: 'Разрыв' });
      for (const t of near) if (t.count > 0 && s.count > 0) strike(B, s, t, 'burst', { c: s.c, r: s.r }, ev);
      if (s.count > 0) {
        hurt(s, total(s));
        died(B, s, ev);
      }
      surge = false;
    } else if (a.type === 'fog') {
      if (!canFog(s)) fail('no fog left');
      s.ready = 0;
      s.fogged = true;
      for (const t of alive(B)) {
        if (t.side !== s.side || U(t).machine || gap(s, s.c, s.r, t) > u.fog.range) continue;
        t.fx = t.fx.filter(e => e.trait !== 'Туман');
        t.fx.push({ trait: 'Туман', shotIn: u.fog.share, until: B.round + u.fog.rounds - 1, bad: false });
      }
      ev.push({ t: 'trait', id: s.id, name: 'Туман' });
    } else if (a.type === 'deep') {
      if (!deepOkay(B, s, a.c, a.r)) fail('cannot dive there');
      s.ready = 0;
      s.deeped = true;
      surge = false;
      ev.push({ t: 'trait', id: s.id, name: 'Уйти в глубь' });
      moveTo(B, s, { c: a.c, r: a.r, steps: 1, path: [[s.c, s.r], [a.c, a.r]], slide: true }, ev);
      s.fx.push({ trait: 'Уйти в глубь', hidden: true, oneTurn: true, until: B.round + 1, bad: false });
    } else if (a.type === 'ward') {
      const t = B.stacks[a.target];
      if (!canWard(s) || !t || !wardList(B, s).includes(t)) fail('nobody to ward there');
      s.ready = 0;
      s.warded = (s.warded || 0) + 1;
      if (u.ward.cleanse) t.fx = t.fx.filter(e => !e.bad);
      t.fx = t.fx.filter(e => e.trait !== 'Оберег');
      t.fx.push({ trait: 'Оберег', allIn: u.ward.share, until: B.round + u.ward.rounds - 1, bad: false });
      ev.push({ t: 'trait', id: t.id, name: 'Оберег' });
    } else if (a.type === 'cry') {
      const t = B.stacks[a.target];
      if (!canCry(s) || !t || !cryList(B, s).includes(t)) fail('nobody to wake there');
      s.ready = 0;
      s.cried = (s.cried || 0) + 1;
      t.ready += u.cry.ready;
      ev.push({ t: 'trait', id: t.id, name: 'Вещий крик' });
      ev.push({ t: 'ready', id: t.id, value: t.ready });
    } else if (a.type === 'grow') {
      if (!growOkay(B, s, a.c, a.r)) fail('cannot grow there');
      s.ready = 0;
      s.grown = true;
      addBrush(B, s.side, a.c, a.r);
      ev.push({ t: 'trait', id: s.id, name: 'Поставить заросль' });
    } else if (a.type === 'volley') {
      const t = enemy(B, s, a.target);
      if (!inVolley(B, s, t)) fail('volley out of range');
      s.ready = 0;
      s.volleyed = true;
      strike(B, s, t, 'volley', { c: s.c, r: s.r }, ev);
    } else fail('unknown action ' + a.type);
    const smith = heroOf(B, s).forge;
    if (smith && !u.machine && a.type !== 'wait' && a.type !== 'defend') s.forged = Math.min(H.MACHINE.forgeCap, (s.forged || 0) + smith);
    if (u.rallyMove && s.count > 0 && a.type !== 'wait' && a.type !== 'defend') {
      for (const t of alive(B)) if (t !== s && t.side === s.side && !U(t).machine && touching(s, s.c, s.r, t)) t.ready += u.rallyMove;
    }
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
    const sim = alive(B).filter(s => !U(s).passive).map(s => ({ id: s.id, side: s.side, init: initOf(s), ready: s.ready }));
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
    const out = { min, max, kmin: killsFor(t, min), kmax: killsFor(t, max), retal: null, support: 0, brace: false };
    if (kind !== 'melee') return out;
    out.support = supporters(B, t).length;
    out.brace = braces(s, t, at);
    if (t.retaliated || (!out.brace && out.kmin >= t.count) || !canAnswer(t) || U(s).elusive) return out;
    const most = { ...t }, least = { ...t };
    if (!out.brace) {
      hurt(most, min);
      hurt(least, max);
    }
    const rm = mult(B, most, s, 'retal', { c: t.c, r: t.r });
    const rmin = least.count ? finalDmg(baseRange(least)[0] * rm) : 0, rmax = finalDmg(baseRange(most)[1] * rm);
    out.retal = { min: rmin, max: rmax, kmin: rmin ? killsFor(s, rmin) : 0, kmax: killsFor(s, rmax) };
    return out;
  };

  const result = B => {
    const lost = [0, 1].map(side => B.stacks.filter(s => s.side === side && fighter(s)).map(s => {
      const left = Math.max(0, s.count - s.borrowed);
      return { unit: s.unit, lost: s.start - left, left };
    }));
    const xp = [1, 0].map(other => lost[other].reduce((a, x) => a + x.lost * H.UNITS[x.unit].hp, 0));
    const stars = [0, 1].map(side => B.stacks.filter(s => s.side === side && fighter(s) && s.count > 0 && s.dealt && s.stars < H.HERO.maxStars && s.vet + 1 >= H.HERO.starAfter).map(s => s.unit));
    const souls = [0, 1].map(side => B.stacks.filter(s => s.side === side).reduce((t, s) => t + (s.souls || 0), 0));
    return { winner: B.winner, round: B.round, lost, xp, stars, fled: B.fled, souls };
  };

  H.Hex = Hex;
  H.Battle = { sees, mirrorOkay, mirror, mirrorAll, keeperOf, canSwitch, switchList, canMend, mendList, canRevive, reviveList, beamCells, heatCap, fireMul, canTemper, temperList, burstList, canBurst, veiled, floodCells, canFog, canDeep, deepOkay, plant, plantAll, plantOkay, touchesBrush, canWard, wardList, canCry, cryList, canGrow, growOkay, canCall, callList, canDrag, inDrag, farShot, farMulOf, blastTargets, canAlarm, canVolley, inVolley, poleReach, poleSpots, canCharm, create, act, place, canOrder, queue, forecast, hurt, result, targets, wagonOn, wallAt, walkField, tendList, canRetreat, ransomPrice, reach, spots, cells, cellsAt, gap, touching, enemyNear, canShoot, supporters, moraleOf, luckOf, atkOf, defOf, initOf, hpOf, total, alive, occupancy, fits, fxs, fxHas, castBlock, castOptions, stackTargets, cellOkay, pushOkay, swapOkay, spellCost, spellAmount, spellRounds, spellDamage, spellFacts, areaCells, stacksIn, resists, concealed, schoolRank };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
