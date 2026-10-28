(function (K) {
  'use strict';

  const TAU = Math.PI * 2;

  const state = () => ({ t: 0, phase: 0, speed: 0, crouch: 0, air: 0, swim: 0, climb: 0, climbPhase: 0, drop: 0, prone: 0, crutch: 0, sit: 0, kneel: 0, tied: 0, load: 0, lastY: null });

  const ease = (cur, target, rate, dt) => cur + (target - cur) * Math.min(1, rate * dt);

  function update(a, mv, dt) {
    a.t += dt;
    a.speed = ease(a.speed, mv.ladder || mv.swim ? 0 : mv.speed, 8, dt);
    const run = K.clamp((a.speed - 2.2) / 2.3, 0, 1), sprint = K.clamp((a.speed - 4.6) / 1.9, 0, 1);
    a.prone = ease(a.prone, mv.crawl ? 1 : 0, 5, dt);
    a.crutch = ease(a.crutch, mv.crutchOn ? 1 : 0, 8, dt);
    a.sit = ease(a.sit, mv.chair ? 1 : 0, 10, dt);
    a.kneel = ease(a.kneel, mv.kneel ? 1 : 0, 6, dt);
    a.tied = ease(a.tied, mv.tied ? 1 : 0, 6, dt);
    a.load = ease(a.load, mv.load === 'carry' ? 1 : mv.load === 'drag' ? -1 : 0, 8, dt);
    const stride = K.lerp(K.lerp(1.45, 2.5, run) + 0.6 * sprint, 0.55, a.prone);
    a.phase = (a.phase + a.speed / stride * TAU * dt) % TAU;
    a.crouch = ease(a.crouch, mv.crouch ? 1 : 0, 9, dt);
    a.air = ease(a.air, !mv.onGround && !mv.swim && !mv.ladder ? 1 : 0, 12, dt);
    a.swim = ease(a.swim, mv.swim ? 1 : 0, 5, dt);
    a.climb = ease(a.climb, mv.ladder ? 1 : 0, 10, dt);
    a.drop = ease(a.drop, !mv.onGround && mv.vel[1] < -4 ? 1 : 0, 4, dt);
    if (a.lastY !== null && mv.ladder) a.climbPhase = (a.climbPhase + Math.abs(mv.pos[1] - a.lastY) / 0.45 * Math.PI) % TAU;
    a.lastY = mv.pos[1];
    return a;
  }

  function pose(a, kit, out) {
    const p = out || K.Body.restPose();
    for (const k of K.Body.POSE_KEYS) p[k] = 0;
    const t = a.t, s = Math.sin(a.phase), c = Math.cos(a.phase);
    const move = K.clamp(a.speed / 1.6, 0, 1), run = K.clamp((a.speed - 2.2) / 2.3, 0, 1), sprint = K.clamp((a.speed - 4.6) / 1.9, 0, 1);
    const skirt = kit && kit.side === 'town' && kit.fig === 'f' ? 0.75 : 1;
    const cr = a.crouch * (1 - a.swim), ar = a.air * (1 - a.climb), sw = a.swim, cl = a.climb;
    const step = move * (1 - 0.55 * cr) * (1 - ar) * (1 - sw) * (1 - cl);
    const hipA = K.lerp(0.42, 0.78 + 0.12 * sprint, run) * step * skirt, kneeA = K.lerp(0.62, 1.45, run) * step, kneeBase = K.lerp(0.06, 0.32, run) * step;
    const armA = K.lerp(0.32, 0.62, run) * step, elBase = 0.12 + K.lerp(0.12, 1.3, run) * step;
    p.lHip = hipA * s + 0.12 * run * step;
    p.rHip = -hipA * s + 0.12 * run * step;
    p.lKnee = kneeBase + kneeA * Math.pow(Math.max(0, c), 1.3);
    p.rKnee = kneeBase + kneeA * Math.pow(Math.max(0, -c), 1.3);
    p.lSh = -armA * s;
    p.rSh = armA * s;
    p.lEl = elBase + 0.25 * Math.max(0, -s) * step * (1 - run);
    p.rEl = elBase + 0.25 * Math.max(0, s) * step * (1 - run);
    p.lOut = 0.09;
    p.rOut = 0.09;
    p.spine = 0.02 * Math.sin(t * 1.4) + K.lerp(0.04, 0.22 + 0.08 * sprint, run) * step;
    p.twist = 0.08 * s * step;
    p.neck = -p.spine * 0.6;

    if (a.sit > 0.01) {
      const si = a.sit, fig = K.Body.figure(kit || K.Body.HEROES['guard.m'].kit), to = (k, v) => { p[k] += (v - p[k]) * si; };
      to('lHip', 1.5); to('rHip', 1.5); to('lKnee', 1.45); to('rKnee', 1.45); to('pitch', -0.05); to('spine', 0.08);
      to('lSh', 0.35 + 0.35 * Math.sin(a.phase) * K.clamp(a.speed / 2, 0, 1)); to('rSh', 0.35 + 0.35 * Math.sin(a.phase) * K.clamp(a.speed / 2, 0, 1)); to('lEl', 0.6); to('rEl', 0.6); to('lOut', 0.25); to('rOut', 0.25);
      p.lift = (K.Move.CHAIR.seat + 0.06 - fig.origin[2][1]) * si;
      p.plant = 1 - si;
      return p;
    }
    const pr = a.prone;
    if (pr > 0) {
      const mvk = K.clamp(a.speed / 0.6, 0, 1), cs = Math.sin(a.phase), fig = K.Body.figure(kit || K.Body.HEROES['guard.m'].kit);
      const to = (k, v) => { p[k] += (v - p[k]) * pr; };
      to('pitch', 1.5);
      to('spine', 0.05);
      to('twist', 0.12 * cs * mvk);
      to('neck', -1.2);
      to('lSh', 2.55 + 0.5 * cs * mvk);
      to('rSh', 2.55 - 0.5 * cs * mvk);
      to('lEl', 0.55 + 0.5 * Math.max(0, -cs) * mvk);
      to('rEl', 0.55 + 0.5 * Math.max(0, cs) * mvk);
      to('lOut', 0.3);
      to('rOut', 0.3);
      to('lHip', -0.1 + 0.3 * cs * mvk);
      to('rHip', -0.1 - 0.3 * cs * mvk);
      to('lHipOut', 0.15);
      to('rHipOut', 0.15);
      to('lKnee', 0.2 + 0.7 * Math.max(0, cs) * mvk);
      to('rKnee', 0.2 + 0.7 * Math.max(0, -cs) * mvk);
      p.lift = -(fig.origin[2][1] - 0.16) * pr;
      p.plant = 1 - pr;
      return p;
    }
    const cu = a.crutch;
    if (cu > 0) {
      const cs = Math.sin(a.phase);
      p.spine += 0.12 * cu;
      p.lHip = p.lHip * (1 - cu) + (0.35 + 0.25 * cs) * cu;
      p.rHip = p.rHip * (1 - cu) + (0.35 + 0.25 * cs) * cu;
      p.lKnee = p.lKnee * (1 - cu) + 0.3 * cu;
      p.rKnee = p.rKnee * (1 - cu) + 0.3 * cu;
    }
    p.pitch += 0.45 * cr;
    p.spine += 0.3 * cr;
    p.neck -= 0.55 * cr;
    p.lHip += 1.9 * cr;
    p.rHip += 1.9 * cr;
    p.lKnee += 1.9 * cr;
    p.rKnee += 1.9 * cr;
    p.lSh += 1.05 * cr;
    p.rSh += 1.05 * cr;
    p.lEl += 0.55 * cr;
    p.rEl += 0.55 * cr;

    const fl = a.drop * ar;
    p.lHip += (0.55 - 0.35 * fl) * ar;
    p.rHip += (0.3 - 0.1 * fl) * ar;
    p.lKnee += (0.95 - 0.6 * fl) * ar;
    p.rKnee += (0.6 - 0.3 * fl) * ar;
    p.lSh += (0.35 + 0.5 * fl * Math.sin(t * 7)) * ar;
    p.rSh += (0.35 - 0.5 * fl * Math.sin(t * 7)) * ar;
    p.lOut += (0.35 + 0.8 * fl) * ar;
    p.rOut += (0.35 + 0.8 * fl) * ar;
    p.lEl += 0.4 * ar;
    p.rEl += 0.4 * ar;
    p.spine += 0.1 * ar;

    if (sw > 0) {
      const k = Math.sin(t * 2.2);
      p.pitch += 1.3 * sw;
      p.neck -= 0.95 * sw;
      p.lSh += (1.5 + 1.5 * k) * sw;
      p.rSh += (1.5 - 1.5 * k) * sw;
      p.lEl += 0.45 * sw;
      p.rEl += 0.45 * sw;
      p.lHip += 0.25 * Math.sin(t * 6) * sw;
      p.rHip -= 0.25 * Math.sin(t * 6) * sw;
      p.lKnee += 0.2 * sw;
      p.rKnee += 0.2 * sw;
    }
    if (cl > 0) {
      const k = Math.sin(a.climbPhase);
      p.lSh += (2.6 + 0.3 * k) * cl;
      p.rSh += (2.6 - 0.3 * k) * cl;
      p.lEl += (0.55 + 0.35 * k) * cl;
      p.rEl += (0.55 - 0.35 * k) * cl;
      p.lHip += (0.65 + 0.45 * k) * cl;
      p.rHip += (0.65 - 0.45 * k) * cl;
      p.lKnee += (1.0 + 0.55 * k) * cl;
      p.rKnee += (1.0 - 0.55 * k) * cl;
    }
    p.plant = Math.max(0, 1 - Math.max(ar, sw, cl));
    p.lift = 0.28 * sw - 0.12 * cl;
    const kn = a.kneel, ti = a.tied, lo = a.load;
    if (kn > 0.01) {
      const to = (k, v) => { p[k] += (v - p[k]) * kn; };
      to('lHip', 0.05); to('rHip', 0.05); to('lKnee', 1.65); to('rKnee', 1.65); to('pitch', 0); to('spine', 0.1); to('neck', 0.15);
    }
    if (kn * (1 - ti) > 0.01) {
      const w = kn * (1 - ti), to = (k, v) => { p[k] += (v - p[k]) * w; };
      to('lSh', 2.75); to('rSh', 2.75); to('lEl', 0.45); to('rEl', 0.45); to('lOut', 0.35); to('rOut', 0.35);
    }
    if (ti > 0.01) {
      const to = (k, v) => { p[k] += (v - p[k]) * ti; };
      to('lSh', -0.5); to('rSh', -0.5); to('lEl', 1.25); to('rEl', 1.25); to('lOut', -0.12); to('rOut', -0.12);
    }
    if (lo > 0.01) {
      const to = (k, v) => { p[k] += (v - p[k]) * lo; };
      to('rSh', 2.4); to('rEl', 1.55); to('rOut', 0.25); to('lSh', 0.85); to('lEl', 1.1); p.spine += 0.12 * lo;
    } else if (lo < -0.01) {
      const w = -lo, to = (k, v) => { p[k] += (v - p[k]) * w; };
      to('rSh', -0.35); to('rEl', 0.1); p.spine += 0.25 * w;
    }
    return p;
  }

  const FP = Object.freeze({ shoulder: [0.2, -0.24, -0.05], elbow: [0.27, -0.42, 0.3], hand: [0.15, -0.27, 0.55] });

  const sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
  const mul = (p, s) => [p[0] * s, p[1] * s, p[2] * s];
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
  const len = v => Math.hypot(v[0], v[1], v[2]);
  const unit = v => { const l = len(v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
  const perp = (v, y) => unit(sub(v, mul(y, dot(v, y))));
  const comb = (b, f, r, u) => [b.fwd[0] * f + b.right[0] * r + b.up[0] * u, b.fwd[1] * f + b.right[1] * r + b.up[1] * u, b.fwd[2] * f + b.right[2] * r + b.up[2] * u];
  const put = (frames, i, x, y, z, o) => frames.set([x[0], x[1], x[2], y[0], y[1], y[2], z[0], z[1], z[2], o[0], o[1], o[2]], i * 12);
  const origin = (frames, i) => [frames[i * 12 + 9], frames[i * 12 + 10], frames[i * 12 + 11]];

  function reach(frames, upper, lower, S, target, pole, thumb, fig) {
    const L1 = 0.3 * fig.sy, L2 = 0.32 * fig.sy;
    let d = sub(target, S), dl = len(d);
    const hi = L1 + L2 - 0.004, lo = Math.abs(L1 - L2) + 0.03;
    if (dl < 1e-6) { d = [0, -1, 0]; dl = 1; }
    const dir = mul(d, 1 / dl), r = K.clamp(dl, lo, hi), H = add(S, mul(dir, r));
    const a = (L1 * L1 - L2 * L2 + r * r) / (2 * r), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    let pp = sub(pole, mul(dir, dot(pole, dir)));
    if (len(pp) < 1e-4) pp = perp([0, -1, 0.3], dir);
    pp = unit(pp);
    const E = add(add(S, mul(dir, a)), mul(pp, h));
    const y1 = unit(sub(S, E));
    let bend = sub(H, E);
    bend = sub(bend, mul(y1, dot(bend, y1)));
    const z1 = len(bend) > 1e-4 ? mul(unit(bend), -1) : pp;
    put(frames, upper, cross(y1, z1), y1, z1, S);
    const y2 = unit(sub(E, H)), z2 = mul(perp(thumb, y2), -1);
    put(frames, lower, cross(y2, z2), y2, z2, E);
    return H;
  }

  const frameAt = (o, y, front, out) => {
    const f = out || new Float32Array(12), z = mul(perp(front, y), -1), x = cross(y, z);
    f.set([x[0], x[1], x[2], y[0], y[1], y[2], z[0], z[1], z[2], o[0], o[1], o[2]]);
    return f;
  };

  function shieldFrame(disc, b, out) {
    const up = perp(b.up, disc.n);
    return frameAt(disc.c, up, disc.n, out);
  }

  function fightPose(p, F, kit) {
    const a = F.act;
    if (kit.side === 'straw') {
      for (const k of K.Body.POSE_KEYS) p[k] = 0;
      p.lOut = 1.35;
      p.rOut = 1.35;
      p.lEl = 0.12;
      p.rEl = 0.12;
      p.plant = 1;
      return p;
    }
    if (a && a.kind === 'kick') {
      const k = Math.sin(Math.PI * K.clamp(a.t / K.Combat.KICK.time, 0, 1));
      p.rHip += 1.75 * k;
      p.rKnee = p.rKnee * (1 - k) + 0.25 * k;
      p.spine -= 0.15 * k;
    }
    if (a && a.kind === 'swing') {
      const s = K.clamp(a.t / K.Data.WEAPONS[F.weapon].swing, 0, 1), side = Math.cos(a.dir * Math.PI / 4);
      p.twist += side * 0.45 * (0.5 - s);
      p.spine += 0.12 * Math.sin(Math.PI * s);
    }
    if (a && a.kind === 'wind') p.twist += Math.cos(F.lastDir * Math.PI / 4) * 0.2;
    if (F.stun > 0) { p.spine -= 0.18; p.neck -= 0.25; }
    if (F.guard) p.spine += 0.06;
    return p;
  }

  function dress(who, a, scratch, gearOut) {
    const kit = who.kit, fig = K.Body.figure(kit), mv = who.mv, F = who.fight;
    const p = pose(a, kit, scratch);
    if (F) fightPose(p, F, kit);
    const frames = K.Body.fk(fig, p, mv.pos, mv.yaw, who.frames || new Float32Array(132));
    who.frames = frames;
    const gear = gearOut || who.gear || { weapon: null, shield: null, frameW: new Float32Array(12), frameS: new Float32Array(12) };
    gear.weapon = null;
    gear.shield = null;
    const cut = kit.cut || {};
    if (F && !F.down && kit.side !== 'straw' && !mv.load && !mv.tied && !mv.kneel) {
      const b = K.basis(F.aim.yaw, F.aim.pitch), yaw = K.basis(mv.yaw, 0);
      const poleR = unit(comb(yaw, -0.35, 0.55, -0.75)), poleL = unit(comb(yaw, -0.35, -0.55, -0.75));
      const W = F.hand === 'l' ? ARM_L : ARM_R, O = F.hand === 'l' ? ARM_R : ARM_L, wPole = F.hand === 'l' ? poleL : poleR, oPole = F.hand === 'l' ? poleR : poleL;
      const rangedOn = K.Missile && K.Missile.ranged(F);
      gear.nock = null;
      if ((F.weapon || rangedOn) && !cut[W.fore] && !cut[W.arm]) {
        const bl = K.Combat.pose(F);
        reach(frames, W.upper, W.lower, origin(frames, W.upper), bl.grip, wPole, bl.d, fig);
        gear.weapon = bl.empty ? null : frameAt(bl.gearO || sub(bl.grip, mul(bl.d, bl.choke)), bl.gearY || bl.d, bl.gearF || bl.edge, gear.frameW);
        if (bl.nock) gear.nock = frameAt(bl.nock.o, bl.nock.y, [0, 1, 0], gear.frameN || (gear.frameN = new Float32Array(12)));
        if (bl.grip2 && !cut[O.fore] && !cut[O.arm]) reach(frames, O.upper, O.lower, origin(frames, O.upper), bl.grip2, oPole, bl.d, fig);
      }
      if (F.shield && !cut[O.fore] && !cut[O.arm]) {
        const disc = K.Combat.shieldDisc(F);
        reach(frames, O.upper, O.lower, origin(frames, O.upper), sub(disc.c, mul(disc.n, 0.07)), oPole, perp(b.up, disc.n), fig);
        gear.shield = shieldFrame(disc, b, gear.frameS);
      }
    }
    if (mv.pushing && mv.handles && F && !F.down) {
      const yb = K.basis(mv.yaw, 0);
      for (const [A, h] of [[ARM_L, mv.handles[0]], [ARM_R, mv.handles[1]]]) if (!cut[A.fore] && !cut[A.arm]) reach(frames, A.upper, A.lower, origin(frames, A.upper), h, unit(comb(yb, -0.3, 0.6 * A.side, -0.7)), comb(yb, 0, -A.side, 0.3), fig);
      gear.weapon = null;
      gear.shield = null;
    }
    gear.torch = null;
    if (F && F.torch && !F.down && !F.shield && !mv.load && !mv.tied) {
      const O = F.hand === 'l' ? ARM_R : ARM_L;
      if (!cut[O.fore] && !cut[O.arm]) {
        const yb = K.basis(mv.yaw, 0), s = O.side, hand = add(origin(frames, O.upper), comb(yb, 0.3, 0.12 * s, -0.12));
        reach(frames, O.upper, O.lower, origin(frames, O.upper), hand, unit(comb(yb, -0.3, 0.6 * s, -0.7)), comb(yb, 0, -s, 0.3), fig);
        gear.torch = frameAt(hand, unit(comb(yb, 0.3, 0.05 * s, 1)), yb.fwd, gear.frameT || (gear.frameT = new Float32Array(12)));
      }
    }
    gear.crutch = null;
    if (mv.crutchOn && F && !F.down) {
      const O = F.hand === 'l' ? ARM_R : ARM_L, cutO = cut[O.fore] || cut[O.arm];
      if (!cutO) {
        const yb = K.basis(mv.yaw, 0), s = O.side, sw = Math.sin(a.phase) * K.clamp(a.speed / 1.0, 0, 1);
        const foot = add(mv.pos, comb(yb, 0.22 * sw + 0.05, 0.3 * s, 0)), top = add(origin(frames, O.upper), comb(yb, 0.02, 0.07 * s, -0.08));
        const dir = unit(sub(top, foot)), hand = add(foot, mul(dir, 0.78));
        reach(frames, O.upper, O.lower, origin(frames, O.upper), hand, unit(comb(yb, -0.3, 0.6 * s, -0.7)), comb(yb, 1, 0, 0), fig);
        gear.crutch = frameAt(foot, dir, yb.fwd, gear.frameC || (gear.frameC = new Float32Array(12)));
      }
    }
    who.gear = gear;
    return frames;
  }

  const ARM_R = Object.freeze({ upper: 4, lower: 6, fore: 'rFore', arm: 'rArm', side: 1 }), ARM_L = Object.freeze({ upper: 3, lower: 5, fore: 'lFore', arm: 'lArm', side: -1 });

  function firstPerson(a, kit, cam, F, out, gearOut) {
    const frames = out || new Float32Array(132), fig = K.Body.figure(kit), b = K.basis(cam.yaw, cam.pitch), e = cam.eye;
    const move = K.clamp(a.speed / 1.6, 0, 1), run = K.clamp((a.speed - 2.2) / 2.3, 0, 1), sprint = K.clamp((a.speed - 4.6) / 1.9, 0, 1);
    const amp = move * (1 + run) * (1 - a.swim);
    const world = v => add(e, comb(b, v[2], v[0], v[1]));
    const gear = gearOut || { weapon: null, shield: null, frameW: new Float32Array(12), frameS: new Float32Array(12) };
    gear.weapon = null;
    gear.shield = null;
    const cut = kit.cut || {}, bob = side => comb(b, 0.06 * side * Math.sin(a.phase) * sprint, 0.008 * Math.cos(a.phase) * amp, 0.012 * Math.sin(a.phase * 2) * amp - 0.06 * sprint + 0.03 * a.air);
    const poleR = unit(comb(b, -0.2, 0.7, -0.7)), poleL = unit(comb(b, -0.2, -0.7, -0.7));
    const SR = world([FP.shoulder[0], FP.shoulder[1], FP.shoulder[2]]), SL = world([-FP.shoulder[0], FP.shoulder[1], FP.shoulder[2]]);
    const rest = side => add(world([FP.hand[0] * side, FP.hand[1] + 0.2 * a.climb + 0.05 * a.climb * Math.sin(a.climbPhase) * side, FP.hand[2] - 0.08 * a.climb]), bob(side));
    const restThumb = side => comb(b, 0, -0.9 * side, 0.3);
    const done = { 3: false, 4: false };
    const Wa = F && F.hand === 'l' ? ARM_L : ARM_R, Oa = Wa === ARM_L ? ARM_R : ARM_L, Sh = a => a === ARM_R ? SR : SL, Po = a => a === ARM_R ? poleR : poleL;
    gear.nock = null;
    if (F && (F.weapon || (K.Missile && K.Missile.ranged(F))) && !F.down && !cut[Wa.fore] && !cut[Wa.arm]) {
      const bl = K.Combat.pose(F), sway = bob(Wa.side);
      const grip = add(bl.grip, sway);
      reach(frames, Wa.upper, Wa.lower, Sh(Wa), grip, Po(Wa), bl.d, fig);
      gear.weapon = bl.empty ? null : frameAt(bl.gearO ? add(bl.gearO, sway) : sub(grip, mul(bl.d, bl.choke)), bl.gearY || bl.d, bl.gearF || bl.edge, gear.frameW);
      if (bl.nock) gear.nock = frameAt(add(bl.nock.o, sway), bl.nock.y, [0, 1, 0], gear.frameN || (gear.frameN = new Float32Array(12)));
      done[Wa.upper] = true;
      if (bl.grip2 && !cut[Oa.fore] && !cut[Oa.arm]) { reach(frames, Oa.upper, Oa.lower, Sh(Oa), add(bl.grip2, sway), Po(Oa), bl.d, fig); done[Oa.upper] = true; }
    }
    if (F && F.shield && !F.down && !cut[Oa.fore] && !cut[Oa.arm]) {
      const disc = K.Combat.shieldDisc(F, true);
      reach(frames, Oa.upper, Oa.lower, Sh(Oa), sub(disc.c, mul(disc.n, 0.07)), Po(Oa), perp(b.up, disc.n), fig);
      gear.shield = shieldFrame(disc, b, gear.frameS);
      done[Oa.upper] = true;
    }
    gear.torch = null;
    if (F && F.torch && !F.down && !F.shield && !done[Oa.upper] && !cut[Oa.fore] && !cut[Oa.arm]) {
      const hand = add(world([0.2 * Oa.side, -0.2, 0.5]), bob(Oa.side));
      reach(frames, Oa.upper, Oa.lower, Sh(Oa), hand, Po(Oa), restThumb(Oa.side), fig);
      gear.torch = frameAt(hand, unit(comb(b, 0.25, 0.05 * Oa.side, 1)), b.fwd, gear.frameT || (gear.frameT = new Float32Array(12)));
      done[Oa.upper] = true;
    }
    if (!done[4]) reach(frames, 4, 6, SR, rest(1), poleR, restThumb(1), fig);
    if (!done[3]) reach(frames, 3, 5, SL, rest(-1), poleL, restThumb(-1), fig);
    return { frames, gear };
  }

  const GAITS = Object.freeze({
    walk: { off: [0.25, 0.75, 0, 0.5], amp: 0.32, lift: 0.01, back: 0.02 },
    trot: { off: [0, 0.5, 0.5, 0], amp: 0.45, lift: 0.025, back: 0.04 },
    run: { off: [0.5, 0.6, 0, 0.1], amp: 0.75, lift: 0.06, back: 0.12 }
  });

  const beastState = () => ({ t: 0, phase: 0, speed: 0, rest: 0, eat: 0, lying: 0, flap: 0, gait: 'walk', act: 0 });

  function beastUpdate(a, b, dt) {
    const s = K.Beasts.SPECIES[b.beast], mv = b.mv, B = b.brain || {}, F = b.fight;
    a.t += dt;
    a.speed = ease(a.speed, mv.speed || 0, 8, dt);
    const [w, tr] = s.speed;
    a.gait = s.fly ? 'run' : a.speed < w * 1.3 ? 'walk' : a.speed < tr * 1.35 ? 'trot' : 'run';
    const stride = s.fly ? 1.2 : s.stride[a.gait === 'walk' ? 0 : a.gait === 'trot' ? 1 : 2];
    a.phase = (a.phase + (s.fly ? 3.2 * dt : a.speed / stride * dt)) % 1;
    const down = K.Beasts.legsLeft(b.kit) <= 2;
    a.rest = ease(a.rest, B.pose === 'sleep' && a.speed < 0.2 ? 1 : 0, 2, dt);
    a.eat = ease(a.eat, B.pose === 'eat' && a.speed < 0.3 ? 1 : 0, 3, dt);
    a.lying = ease(a.lying, down ? 1 : 0, 3, dt);
    a.act = ease(a.act, F && F.act ? 1 : 0, 12, dt);
    return a;
  }

  function beastPose(a, s, b) {
    const G = GAITS[a.gait], move = K.clamp(a.speed / Math.max(0.3, s.speed[0]), 0, 1), cut = (b && b.kit.cut) || {};
    const restF = [-0.05, 0.12, 0], restH = [0.32, -0.62, 0], legs = [];
    const keys = ['lf', 'rf', 'lh', 'rh'];
    for (let i = 0; i < 4; i++) {
      const ph = (a.phase + G.off[i]) * Math.PI * 2, sw = Math.sin(ph) * G.amp * move, flex = Math.max(0, -Math.cos(ph)) * G.amp * move * 1.4;
      const front = i < 2, rest = front ? restF : restH;
      let up = rest[0] + sw, lo = front ? rest[1] - flex * 1.2 : rest[1] - flex * 0.8;
      if (cut[keys[i]]) { up = front ? 0.6 : 0.9; lo = -0.4; }
      if (a.rest > 0.01) { up += ((front ? 1.45 : 1.3) - up) * a.rest; lo += ((front ? 0 : -2.6) - lo) * a.rest; }
      legs.push([up, lo, 0]);
    }
    const bob = Math.sin(a.phase * Math.PI * 4) * move;
    const p = {
      legs, neck: 0.08 * bob * (a.gait === 'walk' ? 1 : 0.4) + a.eat * 1.05 + a.rest * 0.35, head: -a.eat * 0.35 - a.rest * 0.2 - a.act * 0.25,
      tail: Math.sin(a.t * 2) * 0.08 + (a.gait === 'run' ? -0.4 : 0), wag: s.mind === 'dog' ? Math.sin(a.t * 9) * 0.3 : 0,
      back: Math.sin(a.phase * Math.PI * 2) * G.back * move, lift: Math.abs(Math.sin(a.phase * Math.PI * 2)) * G.lift * move, rest: a.rest * (1 - a.lying), lying: a.lying, roll: a.lying * Math.PI / 2, pitch: -a.act * 0.08
    };
    if (s.bird) {
      const fl = s.fly ? 1 : 0;
      p.wings = [fl, fl ? Math.sin(a.phase * Math.PI * 2) * 0.55 : 0];
      for (let i = 0; i < 2; i++) p.legs[i] = [0, 0, 0];
      if (fl) { p.legs[2] = [0.9, -0.4, 0]; p.legs[3] = [0.9, -0.4, 0]; }
    }
    return p;
  }

  function beastDead(s, seed) {
    const r = K.rng(seed * 17 + 5), bend = () => (r() - 0.5) * 0.5;
    const p = { legs: [[0.4 + bend(), 0.1, 0], [0.2 + bend(), 0.2, 0], [-0.2 + bend(), -0.2, 0], [0.1 + bend(), -0.3, 0]], neck: 0.4 + bend(), head: -0.3, tail: 0.6, wag: 0, back: 0, lift: 0, rest: 0, lying: 1, roll: Math.PI / 2, pitch: 0 };
    if (s.bird) p.wings = [0.3, 0];
    return p;
  }

  K.Anim = { state, update, pose, dress, firstPerson, reach, frameAt, FP, GAITS, beastState, beastUpdate, beastPose, beastDead };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
