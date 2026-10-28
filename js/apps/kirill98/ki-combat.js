(function (K) {
  'use strict';

  const CLICK = 0.15, PARRY = 0.15, PARRY_OPEN = 0.6, WIND_RAISE = 0.12, TH0 = 100 * Math.PI / 180, TH1 = -70 * Math.PI / 180;
  const KICK = Object.freeze({ time: 0.38, at: 0.17, reach: 1.25, push: 1.5, cost: 10, damage: 4 });
  const GUARD_SHIELD = 0.5, GUARD_BREAK = 0.25, STUN_HEAD = 2, STAGGER = 0.45, SHIELD_STAGGER = 0.35, STEP = 0.03, SHIELD_R = 0.3, EYE_R = 0.025;
  const HEAVY = ['axe', 'mace', 'bardiche'], SHIELD_UP = 0.15, SHIELD_SLOW = 0.6, THRUST_POWER = 0.6;
  const PART_KIND = ['head', 'chest', 'belly', 'arm', 'arm', 'fore', 'fore', 'thigh', 'thigh', 'shin', 'shin'];
  const CHOKE = Object.freeze({ spear: 1.2, bardiche: 0.75, axe: 0.18, mace: 0.18 }), CHOKE_LOSS = 0.6, ONE_HAND = 0.75, BODY_PUSH = 1.6, KICK_BODY = 4.5, BOW_FROM = 0.45, BOW_SPAN = 0.6, CHOP_HIGH = 0.8, CHOP_DEEP = 0.15;

  const W = id => K.Data.WEAPONS[id] || K.Data.SHOTS[id] || K.Data.BITES[id];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const len = a => Math.hypot(a[0], a[1], a[2]);
  const norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const ease = s => s * s * (3 - 2 * s);
  const comb = (b, f, r, u) => [b.fwd[0] * f + b.right[0] * r + b.up[0] * u, b.fwd[1] * f + b.right[1] * r + b.up[1] * u, b.fwd[2] * f + b.right[2] * r + b.up[2] * u];

  function fighter(o) {
    const opts = o || {};
    return {
      life: 100, weapon: opts.weapon || null, shield: !!opts.shield, exp: opts.exp || 'soldier', hand: opts.hand || 'r',
      act: null, guard: null, stun: 0, steer: [0, 0], lastDir: 0, down: null, hostile: null,
      aim: { eye: [0, 0, 0], yaw: 0, pitch: 0 }, hitBy: null,
      bleed: { heavy: -1, medium: 0, light: 0, lightN: 0, drip: 0 }, ko: 0, binding: null, mode: 'melee', loaded: opts.loaded !== false
    };
  }

  const dirOf = (dx, dy, fallback) => {
    if (Math.hypot(dx, dy) < 6) return fallback;
    return ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
  };
  const guardOf = (dx, dy, fallback) => {
    if (Math.hypot(dx, dy) < 6) return fallback;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'up' : 'down');
  };

  const CENTRE = 16;
  const centred = f => !!f.weapon && W(f.weapon).stab > 0 && Math.hypot(f.steer[0], f.steer[1]) < CENTRE;
  const charge = (wp, t) => K.clamp((t - wp.wind[0]) / (wp.wind[1] - wp.wind[0]), 0, 1);

  const view = f => K.basis(f.aim.yaw, f.aim.pitch);
  const sideOf = f => f.hand === 'l' ? -1 : 1;
  const flip = (v, s) => [v[0], v[1] * s, v[2]];
  const swapDir = (d, s) => s > 0 ? d : d === 'left' ? 'right' : d === 'right' ? 'left' : d;
  const bowOf = f => K.clamp((-f.aim.pitch - BOW_FROM) / BOW_SPAN, 0, 1);
  const pivot = (f, b, dir) => {
    const low = dir === undefined ? 0 : Math.max(0, -Math.sin(dir * Math.PI / 4)), flat = K.basis(f.aim.yaw, 0);
    const bow = bowOf(f);
    return add(f.aim.eye, comb(flat, 0.16 * low + 0.45 * bow, 0.18 * sideOf(f), -0.22 - 0.36 * low - 0.45 * bow));
  };
  const windVec = (b, i) => { const a = i * Math.PI / 4; return comb(b, 0, Math.cos(a), Math.sin(a)); };
  const arcDir = (b, w, th) => norm(add(mul(b.fwd, Math.cos(th)), mul(w, Math.sin(th))));

  const REST = {
    one: { g: [0.42, 0.04, -0.1], d: [0.4, -0.08, 0.91] },
    knife: { g: [0.4, 0.04, -0.14], d: [0.62, -0.06, 0.78] },
    spear: { g: [0.16, 0.04, -0.16], d: [0.97, -0.04, 0.1] },
    bardiche: { g: [0.3, 0.04, -0.12], d: [0.3, 0, 0.95] }
  };
  const restOf = (id, b, C, s) => {
    const r = REST[id] || REST.one, g = flip(r.g, s), d = flip(r.d, s);
    return { grip: add(C, comb(b, g[0], g[1], g[2])), d: norm(comb(b, d[0], d[1], d[2])) };
  };
  const blend = (p, q, k) => ({ grip: mix(p.grip, q.grip, k), d: norm(mix(p.d, q.d, k)) });

  const GUARDS = {
    up: { grip: [0.3, 0.15, 0.62], dir: [0.15, -0.97, 0.1] },
    left: { grip: [0.36, -0.36, 0.08], dir: [0.3, -0.1, 0.9] },
    right: { grip: [0.36, 0.12, 0.05], dir: [0.3, 0.1, 0.9] },
    down: { grip: [0.4, 0.05, -0.22], dir: [0.4, -0.55, -0.7] }
  };

  function pose(f) {
    if (K.Missile && K.Missile.ranged(f)) return K.Missile.pose(f);
    const wp = W(f.weapon), b = view(f), a = f.act, L = wp.reach - wp.grip;
    const lowDir = a && a.kind === 'swing' ? a.dir : a && a.kind === 'wind' && !centred(f) ? dirOf(f.steer[0], f.steer[1], f.lastDir) : undefined;
    const C = pivot(f, b, lowDir);
    const side = sideOf(f);
    let P = restOf(f.weapon, b, C, side), edge = null, phase = 'rest';
    if (a && a.kind === 'swing') {
      const s = ease(K.clamp(a.t / wp.swing, 0, 1)), th = TH0 + (TH1 - TH0) * s, w = windVec(b, a.dir), d = arcDir(b, w, th);
      const bow = a.point ? bowOf(f) : 0, bent = bow ? K.clamp(len(sub(a.point, C)) - L + 0.05, 0.12, wp.grip) : wp.grip;
      P = { d, grip: add(C, mul(d, (wp.grip + (bent - wp.grip) * bow) * (0.82 + 0.18 * Math.sin(Math.PI * s)))) };
      edge = norm(sub(mul(b.fwd, Math.sin(th)), mul(w, Math.cos(th))));
      const down = bow * K.clamp((Math.sin(a.dir * Math.PI / 4) + 0.2) / 0.9, 0, 1);
      if (down > 0) {
        const tip = add(a.point, [0, CHOP_HIGH * (1 - s) - CHOP_DEEP * s, 0]), dd = norm(sub(tip, C));
        P = blend(P, { d: dd, grip: sub(tip, mul(dd, L - (a.choke || 0))) }, down);
        edge = norm(mix(edge, [0, -1, 0], down));
      }
      phase = 'swing';
    } else if (a && a.kind === 'wind' && centred(f)) {
      const k = ease(K.clamp(a.t / WIND_RAISE, 0, 1)), d = norm(comb(b, 1, -0.06, 0.04)), back = wp.grip * (0.55 - 0.3 * charge(wp, a.t));
      P = blend(P, { d, grip: add(C, mul(d, back)) }, k);
      phase = 'aim';
    } else if (a && a.kind === 'wind') {
      const k = ease(K.clamp(a.t / WIND_RAISE, 0, 1)), d = arcDir(b, windVec(b, dirOf(f.steer[0], f.steer[1], f.lastDir)), TH0);
      P = blend(P, { d, grip: add(C, mul(d, wp.grip * 0.8)) }, k);
      phase = 'wind';
    } else if (a && a.kind === 'recover') {
      P = blend(a.from || P, P, ease(K.clamp(a.t / a.time, 0, 1)));
      phase = 'recover';
    } else if (a && a.kind === 'thrust') {
      const s = K.clamp(a.t / wp.thrust, 0, 1), d = a.point ? norm(sub(a.point, C)) : b.fwd;
      const far = a.point ? len(sub(a.point, C)) - (L - (a.choke || 0)) : wp.grip + 0.2;
      const r0 = K.clamp(far - 0.3, 0.12, wp.grip * 0.7), r1 = K.clamp(far + 0.12, r0 + 0.1, wp.grip + 0.28);
      P = { d, grip: add(C, mul(d, r0 + (r1 - r0) * ease(s))) };
      if (a.from) P.grip = mix(a.from.grip, P.grip, ease(K.clamp(s / 0.3, 0, 1)));
      phase = 'thrust';
    } else if (f.guard && f.weapon && !f.shield) {
      const at = key => { const g = GUARDS[swapDir(key, side)], p = flip(g.grip, side), q = flip(g.dir, side); return { grip: add(C, comb(b, p[0], p[1], p[2])), d: norm(comb(b, q[0], q[1], q[2])) }; };
      P = blend(at(f.guard.prev || f.guard.dir), at(f.guard.dir), switched(f.guard));
      phase = 'guard';
    }
    const choke = a && a.choke ? a.choke : 0;
    const d = P.d, grip = P.grip, tip = add(grip, mul(d, L - choke));
    if (!edge) {
      const side = Math.abs(dot(d, b.fwd)) > 0.9 ? b.up : b.fwd;
      edge = norm(sub(side, mul(d, dot(side, d))));
    }
    const out = { C, d, grip, tip, edge, phase, head: wp.head, choke, from: { grip, d } };
    if (wp.hands === 2 && !f.shield) out.grip2 = add(grip, mul(d, f.weapon === 'spear' ? 0.55 : 0.4));
    return out;
  }

  const SHIELD_GUARDS = {
    right: { c: [0.45, -0.02, -0.3], n: [1, 0.12, 0] },
    left: { c: [0.43, -0.24, -0.28], n: [1, -0.3, 0] },
    up: { c: [0.32, -0.06, 0.27], n: [1, 0, 0.6] },
    down: { c: [0.45, -0.08, -0.5], n: [1, 0, -0.45] }
  };
  const SWITCH = 0.12;
  const switched = g => g.prev && g.prev !== g.dir ? ease(K.clamp(g.sw / SWITCH, 0, 1)) : 1;

  function shieldDisc(f, shown) {
    const side = sideOf(f), b = view(f), e = f.aim.eye, lift = shown ? 1 : 0, c = add(e, comb(b, 0.2 + 0.1 * lift, -0.32 * side, -0.58 + 0.12 * lift)), n = norm(comb(b, 0.55, -0.83 * side, 0));
    if (!f.guard || f.act) return { c, n, r: SHIELD_R };
    const k = ease(K.clamp(f.guard.t / (SHIELD_UP * (f.shieldLoad ? 3 : 1)), 0, 1)), s = switched(f.guard);
    const at = key => { const g = SHIELD_GUARDS[swapDir(key, side)], gc = flip(g.c, side), gn = flip(g.n, side); return { c: add(e, comb(b, gc[0], gc[1], gc[2])), n: norm(comb(b, gn[0], gn[1], gn[2])) }; };
    const p = at(f.guard.prev || f.guard.dir), q = at(f.guard.dir);
    const up = { c: mix(p.c, q.c, s), n: norm(mix(p.n, q.n, s)) };
    return { c: mix(c, up.c, k), n: norm(mix(n, up.n, k)), r: SHIELD_R };
  }

  const canAct = f => !f.down && f.stun <= 0 && !f.binding;
  const handPace = who => {
    if (!K.Wounds || !who.kit) return 1;
    const arm = K.Wounds.limbs(who.kit).arms[who.fight.hand === 'l' ? 'l' : 'r'], spec = K.Wounds.ARMS[arm.kind];
    return spec && spec.slow ? spec.slow : 1;
  };

  function press(f) {
    if (!f.weapon || f.act || !canAct(f) || (K.Missile && K.Missile.ranged(f))) return false;
    f.act = { kind: 'wind', t: 0 };
    f.steer = [0, 0];
    f.guard = null;
    return true;
  }

  function steer(f, dx, dy) {
    f.steer[0] += dx;
    f.steer[1] += dy;
    if (f.guard) {
      const g = guardOf(f.steer[0], f.steer[1], f.guard.dir);
      if (g !== f.guard.dir) turnGuard(f, g);
    }
  }

  const startSwing = f => {
    const a = f.act, wp = W(f.weapon), dir = dirOf(f.steer[0], f.steer[1], f.lastDir);
    f.lastDir = dir;
    f.act = { kind: 'swing', t: 0, dir, power: 0.55 + 0.45 * charge(wp, a.t) };
  };

  const startThrust = (f, power, aimed) => {
    const p = aimed ? pose(f) : null;
    f.act = p ? { kind: 'thrust', t: 0, power, from: { grip: p.grip, d: p.d } } : { kind: 'thrust', t: 0, power };
  };

  const startStrike = f => {
    if (centred(f)) startThrust(f, THRUST_POWER + (1 - THRUST_POWER) * charge(W(f.weapon), f.act.t), true);
    else startSwing(f);
  };

  function release(f, mv) {
    const a = f.act;
    if (!a || a.kind !== 'wind' || a.released) return false;
    const wp = W(f.weapon);
    if (a.t < CLICK) startThrust(f, THRUST_POWER);
    else if (a.t >= wp.wind[0]) startStrike(f);
    else a.released = true;
    if (mv) spend(mv, wp.cost);
    return true;
  }

  function turnGuard(f, dir) {
    const g = f.guard, s = switched(g);
    g.prev = s < 0.5 && g.prev ? g.prev : g.dir;
    g.dir = dir;
    g.sw = 0;
    if (!f.shield) g.t = 0;
  }

  function guard(f, on, dir) {
    if (!on) { f.guard = null; return; }
    if (K.Missile && K.Missile.ranged(f) && !f.shield) return;
    if (!canAct(f)) return;
    if (f.act && f.act.kind === 'wind') f.act = null;
    if (f.act) return;
    if (!f.guard) { f.guard = { dir: dir || 'right', prev: null, t: 0, sw: 0 }; f.steer = [0, 0]; }
    else if (dir && dir !== f.guard.dir) turnGuard(f, dir);
  }

  function kick(f, mv) {
    if (f.act || !canAct(f)) return false;
    f.act = { kind: 'kick', t: 0, done: false };
    f.guard = null;
    if (mv) spend(mv, KICK.cost);
    return true;
  }

  const spend = (mv, n) => {
    mv.stamina = Math.max(0, mv.stamina - n);
    if (mv.stamina <= 0) mv.tired = true;
  };

  const segDist = (p1, q1, p2, q2) => {
    const d1 = sub(q1, p1), d2 = sub(q2, p2), r = sub(p1, p2), a = dot(d1, d1), e = dot(d2, d2), f = dot(d2, r);
    let s, t;
    if (a <= 1e-12 && e <= 1e-12) { s = 0; t = 0; }
    else if (a <= 1e-12) { s = 0; t = K.clamp(f / e, 0, 1); }
    else {
      const c = dot(d1, r);
      if (e <= 1e-12) { t = 0; s = K.clamp(-c / a, 0, 1); }
      else {
        const bb = dot(d1, d2), den = a * e - bb * bb;
        s = den > 1e-12 ? K.clamp((bb * f - c * e) / den, 0, 1) : 0;
        t = (bb * s + f) / e;
        if (t < 0) { t = 0; s = K.clamp(-c / a, 0, 1); }
        else if (t > 1) { t = 1; s = K.clamp((bb - c) / a, 0, 1); }
      }
    }
    const c1 = add(p1, mul(d1, s)), c2 = add(p2, mul(d2, t));
    return { d: len(sub(c1, c2)), s, t, at: mix(c1, c2, 0.5) };
  };

  const segDisc = (p, q, disc) => {
    const d = sub(q, p), den = dot(d, disc.n);
    if (Math.abs(den) < 1e-9) return null;
    const t = dot(sub(disc.c, p), disc.n) / den;
    if (t < 0 || t > 1) return null;
    const x = add(p, mul(d, t));
    return len(sub(x, disc.c)) <= disc.r ? { t, at: x } : null;
  };

  const eyePoints = (who) => {
    if (who.beast) return [];
    const kit = who.kit, fr = who.frames, fig = K.Body.figure(kit), eyes = kit.eyes || {}, out = [];
    if ((kit.cut || {}).head) return out;
    for (const [side, x] of [['l', -0.032], ['r', 0.032]]) {
      if (eyes[side]) continue;
      const l = [x * fig.sx, 0.19 * fig.sy, -0.095 * fig.sx];
      out.push({ side, at: [fr[9] + fr[0] * l[0] + fr[3] * l[1] + fr[6] * l[2], fr[10] + fr[1] * l[0] + fr[4] * l[1] + fr[7] * l[2], fr[11] + fr[2] * l[0] + fr[5] * l[1] + fr[8] * l[2]] });
    }
    return out;
  };

  function sweep(att, targets, from, to, stab) {
    const tipMove = Math.max(len(sub(to.tip, from.tip)), len(sub(to.grip, from.grip)));
    const n = Math.max(1, Math.ceil(tipMove / STEP));
    const list = targets.map(t => ({ who: t, caps: K.Body.capsules(t.kit, t.frames), disc: t.fight && t.fight.shield && !(t.kit.cut || {}).lFore ? shieldDisc(t.fight) : null, eyes: stab && t.fight ? eyePoints(t) : [] }));
    let prevTip = from.tip;
    for (let i = 1; i <= n; i++) {
      const k = i / n, g = mix(from.grip, to.grip, k), tp = mix(from.tip, to.tip, k);
      const base = stab ? mix(g, tp, Math.max(0, 1 - 0.14 / Math.max(0.01, len(sub(tp, g))))) : g;
      let best = null;
      for (const L of list) {
        if (L.disc) {
          const hs = segDisc(base, tp, L.disc);
          if (hs && (!best || best.depth < 1)) best = { who: L.who, shield: true, at: hs.at, depth: 1 };
        }
        for (const e of L.eyes) {
          const sd = segDist(prevTip, tp, e.at, e.at);
          if (sd.d <= EYE_R && (!best || best.depth < 2)) best = { who: L.who, part: 0, tag: 'eye', eye: e.side, at: e.at, depth: 2, onBlade: true };
        }
        for (const [part, a, e, r, tag] of L.caps) {
          const sd = segDist(base, tp, a, e);
          if (sd.d > r) continue;
          const depth = 1 - sd.d / r;
          if (best && best.depth >= depth) continue;
          const along = len(sub(add(base, mul(sub(tp, base), sd.s)), g)), blade = len(sub(tp, g)) - to.head;
          best = { who: L.who, part, tag, at: sd.at, depth, onBlade: stab || along >= blade - 0.02 };
        }
      }
      if (best && stab && best.tag === 'skull') {
        const L = list.find(x => x.who === best.who), ahead = add(tp, mul(norm(sub(tp, g)), 0.07));
        for (const e of L.eyes) if (segDist(prevTip, ahead, e.at, e.at).d <= EYE_R) best = { who: best.who, part: 0, tag: 'eye', eye: e.side, at: e.at, depth: 2, onBlade: true };
      }
      prevTip = tp;
      if (best) return best;
    }
    return null;
  }

  const arrival = (att, def) => {
    const a = att.fight.act;
    if (!a || a.kind !== 'swing') return null;
    const w = windVec(view(att.fight), a.dir), db = view(def.fight);
    const h = dot(w, db.right), v = dot(w, db.up), out = [];
    if (v > 0.38) out.push('up');
    if (v < -0.38) out.push('down');
    if (h > 0.38) out.push('right');
    if (h < -0.38) out.push('left');
    return out;
  };

  function blockedBy(att, def) {
    const g = def.fight.guard;
    if (!g || def.fight.act || !canAct(def.fight)) return null;
    const to = sub(att.fight.aim.eye, def.fight.aim.eye), fb = view(def.fight).fwd;
    const flat = norm([to[0], 0, to[2]]), face = norm([fb[0], 0, fb[2]]);
    if (dot(flat, face) < Math.cos(80 * Math.PI / 180)) return null;
    const timed = g.t < PARRY;
    if (def.fight.shield && !(def.kit.cut || {}).lFore) return def.fight.hooked > 0 ? null : g.t >= SHIELD_UP * (def.fight.shieldLoad ? 3 : 1) ? 'shield' : null;
    if (ironArm(def.kit) && g.t >= SHIELD_UP) return 'shield';
    if (!def.fight.weapon) return null;
    const sides = arrival(att, def);
    if (sides && !sides.includes(g.dir)) return null;
    return timed ? 'parry' : 'block';
  }

  const WOODEN = new Set(['peg', 'carved', 'willow']), UNCUT = new Set(['iron', 'hook']), WILLOW_BREAK = 8, HOOKED = 1.6, IRON_KICK = Object.freeze({ push: 2.6, stun: 1.2 });
  const prosAt = (kit, part) => (kit.pros || {})[K.Body.PARTS[part]] || null;
  const ironArm = kit => ['lFore', 'rFore'].some(p => (kit.pros || {})[p] === 'iron');
  const ironLeg = kit => ['lShin', 'rShin'].some(p => (kit.pros || {})[p] === 'iron');
  const helm = kit => K.Data.ARMOR.helm[kit.head] || 1;
  const bodyArmor = kit => (kit.armor || []).reduce((m, a) => Math.min(m, K.Data.ARMOR.body[a] || 1), 1);
  const material = (kit, part) => {
    if (kit.side === 'straw') return 'straw';
    const pros = kit.pros || {};
    if (part >= 3 && pros[K.Body.PARTS[part]]) return WOODEN.has(pros[K.Body.PARTS[part]]) ? 'wood' : 'iron';
    if (part === 0 && K.Data.ARMOR.helm[kit.head]) return 'plate';
    if ((part === 1 || part === 2) && (kit.armor || []).includes('plate')) return 'plate';
    if ((part >= 1 && part <= 4) && (kit.armor || []).includes('mail')) return 'mail';
    return 'flesh';
  };

  function cutThreshold(kit, part, tag) {
    if (kit.side === 'straw') return part >= 3 && part <= 6 ? 18 : Infinity;
    const kind = tag === 'neck' ? 'neck' : PART_KIND[part], armor = kit.armor || [], G = K.Data.ARMOR.guard;
    let thr = K.Data.CUT[kind];
    if (thr === undefined || UNCUT.has(prosAt(kit, part))) return Infinity;
    if (kind === 'fore' && armor.includes('bracers')) thr += G.bracers;
    if (kind === 'shin' && armor.includes('greaves')) thr += G.greaves;
    if (kind === 'neck' && armor.includes('collar')) thr += G.collar;
    return thr;
  }

  function strike(att, def, hit, kind, rnd) {
    const wp = W(att.fight.weapon), a = att.fight.act, kit = def.kit, fx = K.Data.EXP[att.fight.exp] || K.Data.EXP.soldier;
    const st = att.mv && att.mv.tired ? 0.7 : 1, short = a.kind === 'thrust' ? 1 - CHOKE_LOSS * (a.choke || 0) / (CHOKE[att.fight.weapon] || 1) : 1, oneHand = a.kind === 'thrust' && wp.hands === 2 && att.fight.shield ? ONE_HAND : 1, power = (a.power || 0.6) * st * fx.strength * short * oneHand;
    let type = kind, base = wp[kind] || 0;
    if (!hit.onBlade) { type = 'blunt'; base = Math.max(wp.chop, wp.crush, wp.stab) * 0.3; }
    else if (!base) { type = 'crush'; base = Math.max(wp.crush, wp.chop, wp.stab) * 0.45; }
    const part = hit.part, out = { type, part, tag: hit.tag, cut: null, eye: null, damage: 0, material: material(kit, part) };
    let m = K.Data.PART_DAMAGE[part];
    const armorMul = part === 0 ? helm(kit) : part <= 2 ? bodyArmor(kit) : 1;
    m *= type === 'crush' || type === 'blunt' ? 0.5 + 0.5 * armorMul : armorMul;
    if (wp.plate && out.material === 'plate') m = Math.min(1, m * wp.plate);
    if (hit.tag === 'eye') {
      const facing = view(def.fight).fwd, from = norm(sub(def.fight.aim.eye, att.fight.aim.eye));
      const straight = dot(facing, mul(from, -1)) > Math.cos(20 * Math.PI / 180);
      if (kit.head === 'closed' || (kit.head === 'nasal' && !straight) || !wp.eye) hit.tag = null;
      else out.eye = hit.eye;
    }
    out.damage = base * power * m * (kit.side === 'straw' ? 0 : 1) * (def.fight && def.fight.rules && att !== def ? def.fight.rules.harm : 1);
    const shieldArm = def.fight && def.fight.shield && (part === 3 || part === 5);
    if (type === 'chop' && !shieldArm && (wp.cuts.includes(hit.tag === 'neck' ? 'neck' : PART_KIND[part]) || kit.side === 'straw')) {
      const force = wp.cut * power * (0.9 + 0.2 * rnd());
      if (force > cutThreshold(kit, part, hit.tag)) out.cut = part;
    }
    if ((type === 'crush' || type === 'blunt') && prosAt(kit, part) === 'willow' && out.damage >= WILLOW_BREAK) out.cut = part;
    out.stun = type === 'crush' && part === 0 ? STUN_HEAD : 0;
    return out;
  }

  const severs = (kit, part) => {
    if (part === 0) return [0];
    if (part === 3 || part === 4) return [part, part + 2];
    if (part === 7 || part === 8) return [part, part + 2];
    return [part];
  };

  function step(S, dt, rnd) {
    const events = [], fighters = [];
    if (S.player && S.player.fight && !S.player.fight.down) fighters.push(S.player);
    for (const p of S.people) if (p.fight) fighters.push(p);
    for (const f of fighters) {
      const F = f.fight;
      if (F.stun > 0) F.stun = Math.max(0, F.stun - dt);
      if (F.hooked > 0) F.hooked = Math.max(0, F.hooked - dt);
      if (F.guard) { F.guard.t += dt; F.guard.sw += dt; }
      const a = F.act;
      if (!a) continue;
      a.t += dt * handPace(f);
      if (a.kind === 'wind' && a.released && a.t >= W(F.weapon).wind[0]) startStrike(F);
      else if (a.kind === 'recover' && a.t >= a.time) F.act = null;
      else if (a.kind === 'kick' && !a.done && a.t >= KICK.at) { a.done = true; kickHit(S, f, fighters, events); }
      else if (a.kind === 'kick' && a.t >= KICK.time) F.act = null;
    }
    for (const f of fighters) {
      const F = f.fight, a = F.act;
      if (!a || (a.kind !== 'swing' && a.kind !== 'thrust') || F.down) continue;
      const wp = W(F.weapon), dur = a.kind === 'swing' ? wp.swing : wp.thrust;
      if (a.choke === undefined) a.choke = chokeFor(F, fighters.filter(t => t !== f && !t.fight.down));
      const first = a.point === undefined && a.kind === 'thrust' || a.t <= dt + 1e-9;
      const bodies = bodiesNear(S, F.aim.eye, wp.reach + 2);
      if ((a.kind === 'thrust' || bowOf(F) > 0) && a.point === undefined) a.point = aimPoint(F, fighters.filter(t => t !== f && !t.fight.down).concat(bodies, preyNear(S, F.aim.eye, wp.reach + 2)));
      const now = pose(F), prev = first || !f.blade ? now : f.blade;
      if (!a.whoosh) { a.whoosh = true; events.push({ kind: 'whoosh', who: f, at: now.tip, power: a.power || 0.6 }); }
      const targets = fighters.filter(t => t !== f && !t.fight.down && Math.hypot(t.mv.pos[0] - F.aim.eye[0], t.mv.pos[2] - F.aim.eye[2]) < wp.reach + 2).concat(bodies, preyNear(S, F.aim.eye, wp.reach + 2));
      const hit = targets.length ? sweep(f, targets, prev, now, a.kind === 'thrust') : null;
      if (hit) resolve(S, f, hit, now, events, rnd);
      else if (a.t >= dur) F.act = { kind: 'recover', t: 0, time: wp.recover, from: now.from };
    }
    for (const f of fighters) {
      f.blade = f.fight.weapon && !f.fight.down ? pose(f.fight) : null;
      if (f.mv) f.mv.slow = f.fight.guard && f.fight.shield ? SHIELD_SLOW : 1;
    }
    return events;
  }


  function aimPoint(F, others) {
    const b = view(F), wp = W(F.weapon), far = wp.reach + 0.45 + 0.9 * bowOf(F), end = add(F.aim.eye, mul(b.fwd, far));
    let best = null, bd = far;
    for (const t of others) {
      for (const [, a, e, r] of K.Body.capsules(t.kit, t.frames)) {
        const sd = segDist(F.aim.eye, end, a, e);
        if (sd.d > r) continue;
        const along = sd.s * far - Math.sqrt(Math.max(0, r * r - sd.d * sd.d));
        if (along < bd) { bd = along; best = add(F.aim.eye, mul(b.fwd, Math.max(0.2, along))); }
      }
      for (const e of t.fight ? eyePoints(t) : []) {
        const sd = segDist(F.aim.eye, end, e.at, e.at);
        if (sd.d <= EYE_R && sd.s * far < bd + 0.08) { bd = sd.s * far; best = e.at; }
      }
    }
    return best || add(F.aim.eye, mul(b.fwd, wp.reach + 0.05));
  }

  function chokeFor(F, others) {
    const max = CHOKE[F.weapon];
    if (!max) return 0;
    const b = view(F), wp = W(F.weapon);
    let best = Infinity;
    for (const t of others) {
      const to = sub(t.mv.pos, F.aim.eye), d = Math.hypot(to[0], to[2]);
      if (d < best && (to[0] * b.fwd[0] + to[2] * b.fwd[2]) / Math.max(d, 1e-6) > 0.5) best = d;
    }
    if (!isFinite(best)) return 0;
    const reachAt = F.act.kind === 'thrust' ? wp.reach + 0.28 : wp.reach;
    return K.clamp(reachAt - (best + 0.12), 0, max);
  }

  const preyNear = (S, eye, r) => (S.beasts || []).filter(b => !b.fight.down && b.frames && !K.Beasts.SPECIES[b.beast].fly && Math.hypot(b.mv.pos[0] - eye[0], b.mv.pos[2] - eye[2]) < r + 1);

  const bodiesNear = (S, eye, r) => (S.bodies || []).filter(b => { const a = K.Body.anchorOf(b); return Math.hypot(a[0] - eye[0], a[2] - eye[2]) < r; });

  function resolveBody(S, att, hit, now, events, rnd) {
    const F = att.fight, def = hit.who, wp = W(F.weapon);
    const kind = F.act.kind === 'thrust' ? (wp.stab > 0 ? 'stab' : 'crush') : wp.chop > 0 ? 'chop' : 'crush';
    const r = strike(att, def, hit, kind, rnd), dir = norm(sub(hit.at, att.fight.aim.eye));
    events.push({ kind: 'hit', who: att, to: def, at: hit.at, dir, part: r.part, type: r.type, damage: r.damage, material: r.material, heavy: r.cut !== null, body: true });
    if (r.cut !== null) {
      const parts = severs(def.kit, r.cut).filter(p => !(def.kit.cut || {})[K.Body.PARTS[p]]);
      if (parts.length) events.push({ kind: 'cut', who: att, to: def, at: hit.at, dir, parts, iron: parts.every(p => (def.kit.pros || {})[K.Body.PARTS[p]]), body: true });
    }
    K.Body.nudge(def, hit.at, dir, BODY_PUSH * (0.5 + 0.5 * (F.act.power || 0.6)), 0.45);
    F.act = { kind: 'recover', t: 0, time: wp.recover, from: now.from };
  }

  function resolve(S, att, hit, now, events, rnd) {
    if (!hit.who.fight) { resolveBody(S, att, hit, now, events, rnd); return; }
    const F = att.fight, def = hit.who, D = def.fight, wp = W(F.weapon);
    const end = () => { F.act = { kind: 'recover', t: 0, time: wp.recover, from: now.from }; };
    if (def.beast) {
      K.Beasts.struck(S, att, def, hit, F.act.kind === 'thrust' ? (wp.stab > 0 ? 'stab' : 'crush') : wp.chop > 0 ? 'chop' : 'crush', events, rnd);
      end();
      return;
    }
    const how = hit.shield ? 'shield' : blockedBy(att, def);
    if (how) {
      const heavy = how === 'shield' && HEAVY.includes(F.weapon) && (F.act.power || 0) >= 0.75;
      if (def.mv) spend(def.mv, how === 'parry' ? 2 : how === 'shield' ? (heavy ? 10 : 7) : 5);
      events.push({ kind: how === 'parry' ? 'parry' : 'block', who: att, to: def, at: hit.at || now.tip, material: how === 'shield' ? 'wood' : 'steel', heavy });
      if (heavy) { D.guard = null; D.stun = Math.max(D.stun, SHIELD_STAGGER); }
      if (how === 'parry') { F.act = null; F.stun = PARRY_OPEN; } else end();
      return;
    }
    const kind = F.act.kind === 'thrust' ? (wp.stab > 0 ? 'stab' : 'crush') : wp.chop > 0 ? 'chop' : 'crush';
    const r = strike(att, def, hit, kind, rnd);
    D.life -= r.damage;
    if (K.Wounds) K.Wounds.hurt(def, r);
    D.hitBy = att;
    D.hitTime = S.time;
    if (r.stun) { D.stun = Math.max(D.stun, r.stun); D.act = null; D.guard = null; }
    else if ((r.type === 'crush') && r.part <= 2) { D.stun = Math.max(D.stun, STAGGER); D.act = null; D.guard = null; }
    const dir = norm(sub(hit.at, att.fight.aim.eye));
    events.push({ kind: 'hit', who: att, to: def, at: hit.at, dir, part: r.part, type: r.type, damage: r.damage, material: r.material, heavy: r.damage >= 14 || r.cut !== null });
    if (r.eye) {
      def.kit.eyes = Object.assign({}, def.kit.eyes, { [r.eye]: true });
      events.push({ kind: 'eye', who: att, to: def, at: hit.at, side: r.eye });
    }
    if (r.cut !== null) {
      const parts = severs(def.kit, r.cut).filter(p => !(def.kit.cut || {})[K.Body.PARTS[p]]);
      if (parts.length) events.push({ kind: 'cut', who: att, to: def, at: hit.at, dir, parts, iron: parts.every(p => (def.kit.pros || {})[K.Body.PARTS[p]]) });
    }
    if (D.hostile === null && def !== S.player) D.hostile = att;
    end();
  }

  function kickHit(S, f, fighters, events) {
    const F = f.fight, b = view(F);
    let best = null, bd = KICK.reach;
    for (const t of fighters) {
      if (t === f || t.fight.down) continue;
      const to = sub(t.mv.pos, f.mv.pos), d = Math.hypot(to[0], to[2]);
      if (d > bd || d < 0.05) continue;
      const fl = norm([b.fwd[0], 0, b.fwd[2]]);
      if ((to[0] * fl[0] + to[2] * fl[2]) / d < Math.cos(50 * Math.PI / 180)) continue;
      best = t;
      bd = d;
    }
    if (!best) { kickBody(S, f, events); return; }
    const D = best.fight, push = norm([best.mv.pos[0] - f.mv.pos[0], 0, best.mv.pos[2] - f.mv.pos[2]]);
    let what = 'push';
    if (D.guard && D.shield) { what = 'shield'; D.guard = null; D.stun = Math.max(D.stun, GUARD_SHIELD); }
    else if (D.guard) { what = 'guard'; D.guard = null; D.stun = Math.max(D.stun, GUARD_BREAK); }
    if (best.mv) K.Move.shove(best.mv, push, KICK.push);
    if (f.kit && ironLeg(f.kit) && best.mv) { K.Move.shove(best.mv, push, IRON_KICK.push); D.stun = Math.max(D.stun || 0, IRON_KICK.stun); D.act = null; D.guard = null; what = 'down'; }
    D.life -= KICK.damage;
    D.hitBy = f;
    if (D.hostile === null && best !== S.player) D.hostile = f;
    events.push({ kind: 'kick', who: f, to: best, at: add(best.mv.pos, [0, 1.0, 0]), what });
  }

  function hookShield(S, f) {
    const F = f.fight, b = view(F), fl = norm([b.fwd[0], 0, b.fwd[2]]), all = S.player ? [S.player, ...S.people] : S.people;
    if (F.act || !canAct(F)) return null;
    let best = null, bd = KICK.reach + 0.15;
    for (const t of all) {
      if (t === f || !t.fight || t.fight.down || !t.fight.shield) continue;
      const to = sub(t.mv.pos, f.mv.pos), d = Math.hypot(to[0], to[2]);
      if (d > bd || d < 0.05 || (to[0] * fl[0] + to[2] * fl[2]) / d < Math.cos(45 * Math.PI / 180)) continue;
      best = t;
      bd = d;
    }
    if (!best) return null;
    best.fight.hooked = HOOKED;
    best.fight.guard = null;
    if (best.fight.hostile === null && best !== S.player) best.fight.hostile = f;
    return { kind: 'hooked', who: f, to: best, at: add(best.mv.pos, [0, 1.1, 0]) };
  }

  function kickBody(S, f, events) {
    const fl = norm([view(f.fight).fwd[0], 0, view(f.fight).fwd[2]]), foot = add(f.mv.pos, [fl[0] * 0.75, 0.25, fl[2] * 0.75]);
    let best = null, bd = 0.6, at = null;
    for (const b of bodiesNear(S, f.mv.pos, 3)) {
      for (let i = 0; i < b.pts.length; i += 3) {
        const d = Math.hypot(b.pts[i] - foot[0], b.pts[i + 1] - foot[1], b.pts[i + 2] - foot[2]);
        if (d < bd) { bd = d; best = b; at = [b.pts[i], b.pts[i + 1], b.pts[i + 2]]; }
      }
    }
    if (!best) return;
    K.Body.nudge(best, at, [fl[0], 0.25, fl[2]], KICK_BODY, 1.2);
    events.push({ kind: 'kick', who: f, to: best, at, what: 'body' });
  }

  const twoHanded = F => F.weapon && K.Data.WEAPONS[F.weapon].hands === 2 && !F.shield;

  function dropGear(S, who, which) {
    const F = who.fight, g = who.gear || {}, vel = who.mv ? who.mv.vel : [0, 0, 0];
    if ((!which || which === 'weapon') && F.weapon) {
      if (g.weapon) S.items.push(K.Body.drop(F.weapon, g.weapon, { uid: S.nextId++, vel, born: S.time }));
      F.weapon = null;
      F.act = null;
      F.guard = null;
    }
    if ((!which || which === 'shield') && F.shield) {
      if (g.shield) S.items.push(K.Body.drop('shield', g.shield, { uid: S.nextId++, vel, born: S.time }));
      F.shield = false;
      F.guard = null;
    }
  }

  function apply(S, events) {
    const out = [];
    for (const e of events) {
      if (e.kind !== 'cut') continue;
      const who = e.to, F = who.fight;
      const piece = K.Body.sever(who, e.parts, { id: S.nextId++, vel: who.mv ? who.mv.vel : [0, 0, 0], dir: e.dir, born: S.time, owner: who === S.player ? 'player' : who.id });
      if (who.kit.side === 'straw') { piece.straw = who.id; for (const p of e.parts) who.regrow[K.Body.PARTS[p]] = S.time + 20; }
      S.parts.push(piece);
      out.push({ kind: 'piece', piece, at: e.at, iron: e.iron });
      if (!F || who.kit.side === 'straw') continue;
      const cut = who.kit.cut, mine = F.hand === 'l' ? 'l' : 'r', other = mine === 'l' ? 'r' : 'l';
      const holds = s => { const L = K.Wounds ? K.Wounds.limbs(who.kit).arms[s].kind : (cut[s + 'Fore'] || cut[s + 'Arm'] ? 'none' : 'hand'); return L === 'hand' || L === 'iron' || L === 'hinge'; };
      const grabs = s => { const L = K.Wounds ? K.Wounds.limbs(who.kit).arms[s].kind : (cut[s + 'Fore'] || cut[s + 'Arm'] ? 'none' : 'hand'); return L === 'hand' || L === 'hook' || L === 'hinge'; };
      if (F.weapon && (!holds(mine) || (twoHanded(F) && !holds(other)))) { dropGear(S, who, 'weapon'); out.push({ kind: 'disarmed', who }); }
      if (F.shield && !grabs(other)) dropGear(S, who, 'shield');
      if (e.parts.includes(0)) F.down = 'head';
      else if (e.parts.some(p => p >= 7)) out.push({ kind: 'crippled', who });
    }
    const fallen = [];
    for (const p of S.people) {
      const F = p.fight;
      if (!F || p.kit.side === 'straw') continue;
      if (F.life <= 0 && !F.down) { if (K.Wounds) K.Wounds.knockOut(F); else F.down = F.life <= -50 ? 'dead' : 'fell'; }
      if (F.down) fallen.push(p);
    }
    for (const p of fallen) {
      const F = p.fight, from = F.hitBy ? F.hitBy.mv.pos : null, push = from ? norm([p.mv.pos[0] - from[0], 0, p.mv.pos[2] - from[2]]) : [0, 0, 0];
      dropGear(S, p);
      const body = K.Body.fall(p.kit, p.frames, { id: p.id, vel: p.mv.vel.slice(), push: [push[0] * 1.8, 0.2, push[2] * 1.8], sack: p.sack, born: S.time });
      body.cause = F.down;
      if (p.team) body.who = { team: p.team, name: p.name || null, debt: p.debt || 0, squad: p.squad || null, exp: F.exp, hand: F.hand };
      if (F.down === 'ko') { body.ko = F.ko || (K.Wounds ? K.Wounds.KO_TIME : 20); body.bleed = F.bleed; }
      S.people.splice(S.people.indexOf(p), 1);
      S.bodies.push(body);
      out.push({ kind: 'down', who: p, body, cause: F.down });
    }
    if (S.player && S.player.fight) {
      const F = S.player.fight;
      if (F.life <= 0 && !F.down) { if (K.Wounds) K.Wounds.knockOut(F); else F.down = 'fell'; }
      if (F.down && !F.reported) { F.reported = true; out.push({ kind: 'defeat', who: S.player, cause: F.down }); }
    }
    return out;
  }

  K.Combat = { WOODEN, UNCUT, HOOKED, IRON_KICK, hookShield, blockedBy, segDisc, eyePoints, CENTRE, centred, CLICK, PARRY, PARRY_OPEN, KICK, TH0, TH1, PART_KIND, fighter, pose, shieldDisc, press, steer, release, guard, kick, step, apply, dropGear, dirOf, guardOf, cutThreshold, severs, segDist, view, strike };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
