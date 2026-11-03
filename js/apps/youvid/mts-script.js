(function () {
  const { M4, V3, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, frac } = K;
  const Sol = window.MeetSoldier;
  const Props = window.MtsProps;
  const Sets = window.MtsSets;
  const FP = window.FabPose;
  const Fab = window.FabCast;
  const Voice = window.MtsVoice;
  const { FARM, YARD } = Sets;

  const ID = 'M33tTh3S0ld';
  const DURATION = 86.84;
  const CUTS = [0, 1.498, 4.162, 6.535, 8.324, 10.489, 13.985, 31.385, 33.258, 34.964, 36.13, 36.546, 39.668, 41.666, 44.039, 45.704, 47.285, 56.984, 59.565, 59.856, 61.355, 62.395, 63.061, 64.643, 65.392, 66.266, 66.516, 73.634, 76.922, 77.547, 78.171, 78.796, 79.42, 81.793, 83.416];

  const jawV = K.envelope(Voice.JAW, Voice.RATE);
  const rndV = K.envelope(Voice.ROUND, Voice.RATE);
  const wideV = K.envelope(Voice.WIDE, Voice.RATE);

  function spline(keys) {
    const n = keys.length;
    const arr = Array.isArray(keys[0][1]);
    const val = (k) => (arr ? k[1] : [k[1]]);
    return (t) => {
      let out;
      if (t <= keys[0][0]) out = val(keys[0]).slice();
      else if (t >= keys[n - 1][0]) out = val(keys[n - 1]).slice();
      else {
        let i = 0;
        while (i < n - 2 && t > keys[i + 1][0]) i++;
        const a = keys[Math.max(0, i - 1)], b = keys[i], c = keys[i + 1], d = keys[Math.min(n - 1, i + 2)];
        const h = c[0] - b[0], u = (t - b[0]) / h;
        const u2 = u * u, u3 = u2 * u;
        const va = val(a), vb = val(b), vc = val(c), vd = val(d);
        out = vb.map((_, j) => {
          const m1 = (vc[j] - va[j]) / Math.max(1e-6, c[0] - a[0]) * h;
          const m2 = (vd[j] - vb[j]) / Math.max(1e-6, d[0] - b[0]) * h;
          return (2 * u3 - 3 * u2 + 1) * vb[j] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * vc[j] + (u3 - u2) * m2;
        });
      }
      return arr ? out : out[0];
    };
  }

  function steps(keys, dur) {
    return (t) => {
      let i = 0;
      while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
      const cur = keys[i][1];
      if (i === 0) return cur;
      const k = ease((t - keys[i][0]) / (keys[i][2] || dur || 0.3));
      const prev = keys[i - 1][1];
      return Array.isArray(cur) ? cur.map((v, j) => lerp(prev[j], v, k)) : lerp(prev, cur, k);
    };
  }

  const X = {
    calm: [0.1, 0, 0.1, 0, 0.15, 0, 0.04],
    pout: [0, 0.35, 0, 0.55, 0, 0, 0],
    proud: [0.3, 0, 0.45, 0, 0.45, 0.2, 0.06],
    grin: [0.9, 0, 0.75, 0, 0.6, 0.35, 0.08],
    laugh: [1.0, 0, 0.85, 0, 0.6, 0.55, 0.45],
    shout: [0.1, 0.25, 0.75, 0, 0.6, 0.5, 0.25],
    yell: [0, 0.3, 0.95, 0, 0.85, 0.85, 0.85],
    grimace: [0, 0.7, 0.95, 0, 0.9, 0.65, 0.02],
    scowl: [0, 0.55, 0.25, 0, 0.3, 0.1, 0],
    smirk: [0.55, 0, 0.45, 0, 0.45, 0.15, 0.03],
    strain: [0, 0.5, 1.0, 0, 0.9, 0.8, 0.12]
  };

  const FACE = steps([
    [0, X.calm], [13.9, X.pout], [14.6, X.proud, 0.3], [16.2, X.shout], [17.4, X.grin], [19.2, X.proud], [20.4, X.shout], [21.6, X.grin],
    [24.4, X.shout], [25.4, X.grin], [27.0, X.laugh], [28.6, X.laugh], [29.4, X.grin], [30.9, X.proud], [31.3, X.yell, 0.1],
    [33.3, X.grimace], [36.5, X.yell], [39.7, X.grimace], [47.3, X.grimace], [49.3, X.scowl], [51.0, X.shout], [52.2, X.scowl],
    [53.5, X.grimace], [55.0, X.strain], [56.9, X.yell], [66.5, X.scowl], [68.9, X.smirk], [70.4, X.grin], [71.8, X.shout],
    [73.6, X.grimace], [76.9, X.grimace], [77.5, X.scowl], [81.8, X.smirk], [82.5, X.grin]
  ], 0.25);

  function faceAt(t, extra) {
    const e = FACE(t);
    const talk = clamp(jawV(t), 0, 1);
    const f = {
      smile: e[0], frown: e[1], wide: clamp(e[2] + wideV(t) * 0.3 * talk, 0, 1.2), round: clamp(rndV(t) * 0.75 * (1 - e[2] * 0.6), 0, 1),
      sneer: e[4], lower: clamp(e[5] + talk * 0.2, 0, 1.2), jaw: clamp(e[6] + talk * (0.75 - e[6] * 0.4), 0, 1.15)
    };
    return Object.assign(f, extra || {});
  }

  function cam(eye, at, fov, roll) {
    return { eye, at, fov, roll: roll || 0, near: 0.03, far: 400 };
  }

  function shake(t, amp, seed) {
    return K.wobble(t * 1.7, amp, seed || 1);
  }

  function yawTo(a, b) {
    return Math.atan2(b[0] - a[0], b[2] - a[2]);
  }

  function fwdOf(yaw) {
    return [S(yaw), 0, C(yaw)];
  }

  function sideOf(yaw) {
    return [C(yaw), 0, -S(yaw)];
  }

  const LEG = D => D.thigh + D.shin;

  function legsStanding(pose, p, yaw, spread, ground, stagger) {
    const fwd = fwdOf(yaw), side = sideOf(yaw);
    const g = ground || 0;
    [['L', 1], ['R', -1]].forEach(([s, k]) => {
      const st = (stagger || 0) * k;
      const f = V3.add(p, V3.add(V3.mul(side, k * (0.14 + (spread || 0))), V3.mul(fwd, 0.04 + st)));
      pose['f' + s + 'w'] = [f[0], g + 0.075, f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 1.4 + side[0] * k * 0.2, g + 0.6, fwd[2] * 1.4 + side[2] * k * 0.2]);
    });
    return pose;
  }

  function legsRun(pose, phase, amp) {
    const D = Sol.D;
    const L = LEG(D);
    const ph = phase * PI * 2;
    const a = amp === undefined ? 0.34 : amp;
    [['L', 1, 1], ['R', -1, -1]].forEach(([s, k, sgn]) => {
      const sw = S(ph) * sgn;
      const lift = Math.max(0, C(ph) * sgn) * 0.24;
      pose['f' + s] = [k * (D.hipX + 0.02), -L + 0.07 + lift, sw * a * L];
      pose['k' + s] = [k * 0.15, 0, 1];
      pose['a' + s] = -0.25 * sw;
    });
    return pose;
  }

  function legsCrouch(pose, p, yaw, depth, ground) {
    const fwd = fwdOf(yaw), side = sideOf(yaw);
    const g = ground || 0;
    [['L', 1, 0.18], ['R', -1, -0.12]].forEach(([s, k, off]) => {
      const f = V3.add(p, V3.add(V3.mul(side, k * 0.2), V3.mul(fwd, off + depth * 0.2)));
      pose['f' + s + 'w'] = [f[0], g + 0.075, f[2]];
      pose['k' + s + 'w'] = V3.add(f, [fwd[0] * 2 + side[0] * k * 0.5, g + 0.5, fwd[2] * 2 + side[2] * k * 0.5]);
    });
    return pose;
  }

  function body(o) {
    const yaw = o.yaw || 0;
    const pose = { p: o.p, fwd: fwdOf(yaw), up: o.up || [0, 1, 0], sp: o.sp || [0, 0, 0], nk: o.nk || [0, 0, 0], eL: o.eL || [0.75, -0.55, -0.35], eR: o.eR || [-0.75, -0.55, -0.35] };
    if (o.hL) pose.hL = o.hL;
    if (o.hR) pose.hR = o.hR;
    if (o.run !== undefined) legsRun(pose, o.run, o.stride);
    else if (o.crouch) legsCrouch(pose, o.p, yaw, o.crouch, o.ground);
    else if (o.air) {
      const L = LEG(Sol.D);
      pose.fL = [Sol.D.hipX + 0.06, -L * 0.72, 0.2];
      pose.fR = [-Sol.D.hipX - 0.04, -L * 0.88, -0.15];
      pose.kL = [0.2, 0, 1];
      pose.kR = [-0.2, 0, 1];
    } else legsStanding(pose, o.p, yaw, o.spread, o.ground, o.stagger);
    return pose;
  }

  function gripHand(kind, side, M, lift) {
    const g = Props.grip(kind, side, M);
    const wrist = V3.sub(g.pos, V3.mul(g.fingers, 0.09 + (lift || 0)));
    return { target: V3.add(wrist, V3.mul(g.palm, -0.028)), fingers: g.fingers, palm: g.palm, pose: g.pose };
  }

  function freeHand(pos, fingers, palm, pose) {
    return { target: pos, fingers: V3.norm(fingers), palm: V3.norm(palm), pose };
  }

  function blendHand(a, b, k) {
    if (!a) return b;
    if (!b) return a;
    if (k <= 0) return a;
    if (k >= 1) return b;
    return { target: V3.lerp(a.target, b.target, k), fingers: V3.norm(V3.lerp(a.fingers, b.fingers, k)), palm: V3.norm(V3.lerp(a.palm, b.palm, k)), pose: k < 0.5 ? a.pose : b.pose };
  }

  function solState(pose, hands, extra) {
    const p = Object.assign({}, pose);
    if (hands.L) p.hLw = hands.L.target;
    if (hands.R) p.hRw = hands.R.target;
    const m = Sol.solve(p);
    const hm = {};
    ['L', 'R'].forEach(s => {
      const h = hands[s];
      if (!h) return;
      hm[s] = { pose: h.pose, M: h.loose ? null : Sol.handBasis(m.pts['wrist' + s], h.fingers, h.palm) };
    });
    return Object.assign({ pose: p, m, hands: hm }, extra || {});
  }

  function chestOf(pose) {
    return Sol.solve(pose).chest;
  }

  function carry(pose, kind, local, rot) {
    const ch = chestOf(pose);
    const r = rot || [0, 0, 0];
    return M4.chain(ch, M4.translate(local[0], local[1], local[2]), M4.rotY(r[1]), M4.rotX(r[0]), M4.rotZ(r[2]));
  }

  const SHOULDER = { at: [-0.205, 0.53, 0.16], rot: [-0.04, 0.02, 0] };
  const HIP = { at: [-0.22, 0.12, 0.3], rot: [0.12, 0.06, 0] };

  function withLauncher(pose, mode, extra) {
    const md = mode || SHOULDER;
    const G = carry(pose, 'launcher', md.at, md.rot);
    const hR = gripHand('launcher', 'R', G);
    const hL = gripHand('launcher', 'L', G);
    return solState(pose, { L: hL, R: hR }, Object.assign({ weapon: { kind: 'launcher', M: G } }, extra || {}));
  }

  function withShotgun(pose, aim, extra) {
    const G = carry(pose, 'shotgun', [-0.09, 0.2, 0.36], [aim || 0, 0.04, 0]);
    const hR = gripHand('shotgun', 'R', G);
    const hL = gripHand('shotgun', 'L', G);
    return solState(pose, { L: hL, R: hR }, Object.assign({ weapon: { kind: 'shotgun', M: G } }, extra || {}));
  }

  function shovelInHand(handM) {
    return M4.chain(handM, M4.translate(0, -0.075, 0.03), M4.rotY(-PI / 2), M4.translate(0, 0, 0.3));
  }

  function headPos(st, off) {
    return M4.point(st.m.head, off || [0, 0, 0]);
  }

  const RED_ENV = {
    key: { dir: [-0.35, -0.62, 0.7], col: [1.25, 1.12, 0.95] },
    ambTop: [0.55, 0.56, 0.6], ambBot: [0.42, 0.34, 0.27], warp: [0.75, 0.42, 0.32], rim: [0.75, 0.78, 0.82], rimPow: 2.6,
    points: [], fogCol: [0.86, 0.84, 0.8], fog: [40, 230], clear: [0.86, 0.84, 0.8], grade: [1.02, 1.0, 0.97, 0.06], vig: 0.22
  };

  const YARD_ENV = {
    key: { dir: [0.45, -0.55, 0.7], col: [1.15, 1.04, 0.9] },
    ambTop: [0.5, 0.5, 0.54], ambBot: [0.36, 0.3, 0.26], warp: [0.72, 0.4, 0.32], rim: [0.7, 0.72, 0.78], rimPow: 2.8,
    points: [], fogCol: [0.8, 0.76, 0.72], fog: [30, 160], clear: [0.84, 0.8, 0.74], grade: [1.0, 0.98, 0.96, 0.05], vig: 0.25
  };

  const REVEAL_ENV = Object.assign({}, YARD_ENV, {
    key: { dir: [-0.4, -0.5, -0.75], col: [1.25, 1.1, 0.92] }, ambTop: [0.6, 0.6, 0.62], rim: [0.95, 0.92, 0.86], grade: [1.04, 1.0, 0.95, 0.04]
  });

  const LINEUP_ENV = {
    key: { dir: [0.4, -0.5, -0.75], col: [1.0, 0.95, 0.9] },
    ambTop: [0.55, 0.55, 0.55], ambBot: [0.3, 0.28, 0.27], warp: [0.7, 0.38, 0.32], rim: [0.6, 0.6, 0.62], rimPow: 3,
    points: [], fogCol: [0.55, 0.53, 0.5], fog: [12, 40], clear: [0.5, 0.48, 0.45], grade: [1, 1, 1, 0.05], vig: 0.25
  };

  function blu(cls, pose, extra) {
    return Object.assign({ cls, team: 'blu', pose }, extra || {});
  }

  function armed(a, gun, opts) {
    const g = FP.aimGun(a.cls, gun, opts);
    Object.assign(a.pose, { hR: g.hR, hL: g.hL });
    a.gun = gun;
    a.gunM = g.gunM;
    return a;
  }

  function flung(cls, base, t0, t, seed, opts) {
    const o = opts || {};
    const g = rand(seed);
    const u = t - t0;
    const v = o.v || [(g() - 0.5) * 4, 6 + g() * 2.5, (g() - 0.5) * 4];
    const p = [base[0] + v[0] * u, Math.max(0.35, base[1] + 1.0 + v[1] * u - 9.8 * u * u * 0.7), base[2] + v[2] * u];
    const spin = u * (6 + g() * 4);
    return blu(cls, FP.airborne(cls, p, [S(spin) * 0.9, C(spin), 0.3], [0, -0.2, 1]), { face: { eyes: 'wide', mouth: 'scream', open: 1 } });
  }

  function rocketFx(a, b, t0, t1, t, extra) {
    if (t < t0 || t > t1) return [];
    const k = clamp((t - t0) / (t1 - t0), 0, 1);
    const p = V3.lerp(a, b, k);
    const dir = V3.norm(V3.sub(b, a));
    const trail = V3.lerp(a, b, Math.max(0, k - 0.45));
    return [Object.assign({ kind: 'rocket', p, dir }, extra || {}), { kind: 'trail', a: trail, b: p, u: k }];
  }

  function boomFx(p, t0, t, s, extra) {
    if (t < t0 || t > t0 + 2.2) return [];
    return [Object.assign({ kind: 'boom', p, u: t - t0, s: s || 1.6, seed: Math.round(t0 * 10) }, extra || {})];
  }

  function gibsFx(p, t0, t, n, seed, team) {
    if (t < t0 || t > t0 + 3) return [];
    return [{ kind: 'gibs', p, u: t - t0, n: n || 14, seed: seed || 5, team: team || 'blu' }];
  }

  function shotPyro(t) {
    const u = t - 1.498;
    const base = FARM.pyro;
    const camEye = spline([[0, [base[0] - 0.6, 1.12, base[2] - 1.05]], [1.0, [base[0] - 0.55, 0.95, base[2] - 1.2]], [1.9, [base[0] - 0.3, 0.32, base[2] - 2.6]], [2.66, [base[0] - 0.1, 0.22, base[2] - 3.4]]])(u);
    const camAt = spline([[0, [base[0] + 0.15, 1.42, base[2]]], [1.0, [base[0] + 0.15, 1.45, base[2]]], [1.9, [base[0] + 0.4, 2.0, base[2] + 0.6]], [2.66, [base[0] + 0.5, 2.6, base[2] + 1.2]]])(u);
    const toCam = yawTo(base, camEye);
    const sweep = spline([[0, -0.2], [0.5, -0.12], [0.85, -0.02], [1.2, 0.12], [1.8, 0.45], [2.66, 0.62]])(u);
    const pose = FP.stand('pyro', base[0], base[2], toCam + sweep, { sp: [0.1, 0, 0], nk: [-0.05, -sweep * 0.3, 0] });
    const a = armed(blu('pyro', pose, { tint: [0.5, 0.66, 0.95] }), 'flamer', { pitch: 0.18 });
    const m = Fab.solve('pyro', a.pose);
    const gun = M4.mul(m.chest, a.gunM);
    const nozzle = M4.point(gun, [0, 0, 0.6]);
    const dir = V3.norm(M4.dir(gun, [0, 0.05, 1]));
    const toEye = V3.norm(V3.sub(camEye, nozzle));
    const fill = clamp((V3.dot(dir, toEye) - 0.82) / 0.14, 0, 1);
    return {
      shot: 'pyro', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(V3.add(camEye, shake(t, 0.02)), camAt, 50), actors: [a],
      fx: [{ kind: 'flamer', p: nozzle, dir, u: t, len: 4.2, big: true }], flameFill: fill
    };
  }

  function shotCrates(t) {
    const u = t - 4.162;
    const top = [FARM.crates[0] + 0.8, 3.0, FARM.crates[2] + 0.1];
    const hop = Math.abs(S(u * 5.2)) * 0.18;
    const actors = [];
    const fx = [];
    const hit = 5.7;
    if (t < hit) {
      const pose = FP.stand('soldier', top[0], top[2], PI + 0.2, { y: top[1] - 0.0 + hop, sp: [-0.15, 0, 0], nk: [-0.35, 0, 0], hL: [0.3, 0.75, 0.05], hR: [-0.3, 0.75, 0.05], eL: [0.9, 0.2, 0.2], eR: [-0.9, 0.2, 0.2] });
      const a = blu('soldier', pose, { face: { eyes: 'open', mouth: 'grin', open: 0.6 } });
      actors.push(a);
    } else {
      actors.push(flung('soldier', top, hit, t, 41, { v: [-3.5, 7, 1.5] }));
    }
    fx.push(...rocketFx([FARM.crates[0] + 9, 1.4, FARM.crates[2] - 9], [top[0], top[1] + 1.0, top[2]], 5.42, hit, t));
    fx.push(...boomFx([top[0], top[1] + 1.0, top[2]], hit, t, 2.0));
    fx.push(...gibsFx([top[0], top[1] + 1.0, top[2]], hit, t, 18, 7));
    if (t > hit) fx.push({ kind: 'flying', what: 'launcherBlu', p: [top[0] - 2.2 * (t - hit), top[1] + 1.4 + 3 * (t - hit) - 4 * (t - hit) * (t - hit), top[2]], spin: (t - hit) * 7 });
    const eye = [FARM.crates[0] - 1.6, 0.6, FARM.crates[2] - 7.6];
    return {
      shot: 'crates', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(V3.add(eye, shake(t, 0.03, 3)), [FARM.crates[0] + 0.6, 3.9, FARM.crates[2] + 1], 48), actors, fx
    };
  }

  function shotHill(t) {
    const u = t - 6.535;
    const H = FARM.hill;
    const x = H[0] + 3.2 + u * 1.6;
    const z = H[2] - 1.0;
    const y = Sets.hillY(x, z);
    const hit = 7.45;
    const actors = [];
    const fx = [];
    if (t < hit) {
      const pose = FP.run('soldier', x, z, PI / 2 - 0.2, u * 1.7, { y, lean: 0.3 });
      actors.push(armed(blu('soldier', pose), 'rocket'));
    } else {
      const xh = H[0] + 3.2 + (hit - 6.535) * 1.6;
      actors.push(flung('soldier', [xh, Sets.hillY(xh, z), z], hit, t, 52, { v: [1.5, 6.5, 2.5] }));
    }
    const target = [H[0] + 3.2 + (hit - 6.535) * 1.6, Sets.hillY(H[0] + 4.6, z) + 1.0, z];
    fx.push(...rocketFx([H[0] - 14, 2.2, z - 3], target, 6.95, hit, t));
    fx.push(...boomFx(target, hit, t, 1.8));
    fx.push(...gibsFx(target, hit, t, 16, 9));
    const eye = [H[0] - 6, 0.5, H[2] - 16];
    return {
      shot: 'hill', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(V3.add(eye, shake(t, 0.02, 4)), [H[0] + 2.5, 3.0, H[2]], 36), actors, fx
    };
  }


  function shotHeavyRun(t) {
    const u = t - 8.324;
    const start = [30, 0, -51];
    const z = start[2] - u * 2.4;
    const hit = 9.15;
    const actors = [];
    const fx = [];
    const camZ = start[2] - Math.min(u, hit - 8.324) * 2.4 - 2.3;
    if (t < hit) {
      const pose = FP.run('heavy', start[0], z, PI, u * 1.5, { lean: 0.15, stride: 0.3, hL: [0.5, 0.05, 0.35], hR: [-0.5, 0.0, 0.3] });
      actors.push(blu('heavy', pose, { face: { eyes: 'wide', brows: 'up', mouth: 'open', open: 0.5 } }));
    }
    const hz = start[2] - (hit - 8.324) * 2.4;
    fx.push(...rocketFx([start[0] + 6, 1.2, hz - 1.5], [start[0] + 0.3, 1.2, hz], 9.0, hit, t));
    fx.push(...boomFx([start[0] + 0.6, 1.0, hz + 0.6], hit, t, 2.0, { big: true }));
    fx.push(...gibsFx([start[0], 1.3, hz], hit, t, 22, 13));
    if (t > 9.35) {
      [[31.4, -49.6], [28.6, -49.0]].forEach((q, i) => fx.push({ kind: 'fire', p: [q[0], 0.4, q[1]], u: t - 9.35 + i * 0.3, w: 1.6, d: 1.0, h: 1.4, s: 0.55, n: 18 }));
      fx.push({ kind: 'smokeTrail', p: [start[0] + 1.4, 0.8, start[2] - 1.5], u: t, h: 4 });
      fx.push({ kind: 'embers', p: [start[0], 0.2, start[2] - 1.5], u: t - 9.35, w: 4, n: 40 });
    }
    if (t > 10.33 && t < 10.47) fx.push({ kind: 'flying', what: 'bluHead', p: [start[0] - 0.3, 1.8 - (t - 10.33) * 6, camZ + 0.9], spin: t * 6 });
    const eye = [start[0] - 0.25, 1.3, camZ + 0.55];
    return {
      shot: 'heavyRun', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(V3.add(eye, shake(t, 0.03, 6)), [start[0] + 0.15, 1.38, hz + 4], 46), actors, fx,
      props: [{ kind: 'tires' }], flash: t > hit && t < 9.38 ? 0.9 - (t - hit) / 0.25 : 0
    };
  }

  function shotTitle(t) {
    if (t < 10.53) return { shot: 'title', kind: 'black' };
    return { shot: 'title', kind: 'card', cards: [{ tex: 'title', zoom: 1 + (t - 10.53) * 0.004 }], fade: clamp((t - 10.53) / 0.22, 0, 1) };
  }

  const SP = { z: 0.62 };

  function speechState(t) {
    const x = spline([[13.98, -0.1], [17.0, -0.05], [19.0, 0.05], [21.0, 0.05], [22.4, 0.12], [24.2, 0.17], [26.6, 0.18], [27.6, 0.2], [28.6, 0.1], [30.2, -0.2], [31.39, -0.3]])(t);
    const z = spline([[13.98, SP.z], [21.0, SP.z], [23.0, 0.6], [24.4, 0.63], [26.6, 0.62], [27.4, 0.6], [28.6, 0.62], [31.39, 0.66]])(t);
    const yaw = spline([[13.98, -PI / 2 + 0.2], [16.0, -PI / 2 - 0.35], [17.2, -PI / 2 + 0.3], [18.4, 0.2], [19.4, PI - 0.4], [21.0, PI - 0.1], [22.4, PI + 0.35], [24.4, PI + 0.2], [26.6, PI + 0.05], [27.6, PI - 0.35], [28.6, PI / 2 + 0.25], [29.6, PI - 0.3], [30.6, PI - 0.6], [31.39, PI / 2 + 0.3]])(t);
    const lean = spline([[13.98, -0.05], [21.0, 0.0], [22.6, 0.25], [24.3, 0.6], [26.6, 0.62], [27.4, 0.05], [28.0, -0.2], [28.8, -0.15], [30.0, 0.05], [31.39, 0.0]])(t);
    const nk = spline([[13.98, [-0.35, 0, 0]], [16.0, [-0.4, -0.1, 0.1]], [17.4, [-0.2, 0.2, 0]], [19.4, [-0.1, 0.0, 0]], [20.6, [-0.05, 0.05, 0.08]], [22.0, [0.15, 0.2, -0.05]], [23.4, [0.25, 0.1, 0.05]], [24.6, [-0.1, 0.1, 0]], [26.6, [-0.25, -0.1, 0.05]], [27.6, [-0.55, 0.1, 0.1]], [28.6, [-0.45, 0.2, 0.05]], [29.6, [-0.1, -0.1, 0]], [30.6, [-0.15, -0.2, -0.05]], [31.39, [-0.35, -0.1, 0]]])(t);
    const p = [x, 0.97 - Math.max(0, lean) * 0.08, z];
    const pose = body({ p, yaw, sp: [lean, 0, 0], nk });
    const fistUp = (t0, t1, side) => ease((t - t0) / 0.35) * (1 - ease((t - t1) / 0.4));
    const pumpR = fistUp(17.3, 19.0) * (0.5 + 0.5 * Math.abs(S((t - 17.3) * 6)));
    const pumpL = fistUp(21.2, 25.6) * (0.55 + 0.45 * Math.abs(S((t - 21.2) * 5.2)));
    const restR = freeHand(M4.point(chestOf(pose), [-0.29, -0.22, 0.08]), M4.dir(chestOf(pose), [0, -1, 0.2]), M4.dir(chestOf(pose), [1, 0, 0.3]), 'relax');
    const restL = freeHand(M4.point(chestOf(pose), [0.29, -0.22, 0.08]), M4.dir(chestOf(pose), [0, -1, 0.2]), M4.dir(chestOf(pose), [-1, 0, 0.3]), 'relax');
    const ch = chestOf(pose);
    const upR = freeHand(M4.point(ch, [-0.36, 0.62 + 0.12 * pumpR, 0.18]), M4.dir(ch, [0, 1, 0.3]), M4.dir(ch, [0.4, 0, 1]), 'fist');
    const upL = freeHand(M4.point(ch, [0.36, 0.58 + 0.12 * pumpL, 0.2]), M4.dir(ch, [0, 1, 0.3]), M4.dir(ch, [-0.4, 0, 1]), 'fist');
    const hR = blendHand(restR, upR, fistUp(17.3, 19.0));
    const hL = blendHand(restL, upL, fistUp(21.2, 25.6));
    return solState(pose, { L: hL, R: hR });
  }

  const HEAD_ROW = [-1.36, -1.02, -0.68, -0.34, 0.0, 0.34, 0.68, 1.02, 1.36];
  const HEAD_CLS = ['sniper', 'pyro', 'heavy', 'spy', 'medic', 'demo', 'scout', 'engineer', 'soldier'];

  function headsOnGate() {
    return HEAD_ROW.map((x, i) => ({ cls: HEAD_CLS[i], p: [x, YARD.gateTop + 0.13, 0], yaw: (i % 2 ? 0.12 : -0.1), tilt: (i % 3 - 1) * 0.12, i }));
  }

  function shotSpeech(t) {
    const st = speechState(t);
    const h = headPos(st);
    const lead = spline([[13.98, [-0.3, -0.05]], [17.0, [-0.2, -0.02]], [19.4, [-0.05, 0]], [22.0, [0.15, -0.05]], [23.6, [0.05, 0.02]], [26.6, [0, 0.02]], [27.8, [-0.1, 0.05]], [29.6, [0.0, 0.0]], [31.39, [-0.2, 0.0]]])(t);
    const camX = spline([[13.98, 0.17], [17.0, 0.17], [19.0, 0.17], [21.0, 0.17], [24.4, 0.17], [26.6, 0.17], [28.6, 0.17], [31.39, -0.1]])(t);
    const camZ = spline([[13.98, -1.05], [22.6, -1.05], [24.0, -0.85], [26.8, -0.85], [27.8, -1.05], [31.39, -1.05]])(t);
    const camY = spline([[13.98, 1.52], [22.6, 1.52], [24.0, 1.6], [26.8, 1.6], [27.8, 1.52], [31.39, 1.52]])(t);
    const eye = V3.add([camX, camY, camZ], shake(t, 0.01, 2));
    const at = [h[0] + lead[0] * 0.6, h[1] - 0.1 + lead[1] * 0.6, h[2]];
    return {
      shot: 'speech', kind: '3d', set: 'yard', env: YARD_ENV, camera: cam(eye, at, 19), sol: st, face: faceAt(t), heads: headsOnGate(), blur: 0.55, focus: 'sol'
    };
  }

  function shotCharge(t) {
    const u = t - 31.385;
    const door = [FARM.drill[0] + 4.7, 0, FARM.drill[2] + 1.2];
    const p = V3.add(door, [0.3 + u * 2.4, 0.95, -0.2 - u * 1.4]);
    const yaw = PI / 2 + 0.55;
    const pose = body({ p, yaw, run: u * 1.55, sp: [0.18, 0, 0], nk: [-0.25, 0, 0] });
    const ch = chestOf(pose);
    const up = freeHand(M4.point(ch, [-0.46, 0.55 + S(u * 9) * 0.06, 0.08]), M4.dir(ch, [0.25, 0.35, 1]), M4.dir(ch, [1, -0.2, -0.1]), 'fist');
    const out = freeHand(M4.point(ch, [0.45, 0.0, 0.25]), M4.dir(ch, [0.3, -0.6, 1]), M4.dir(ch, [-1, 0, 0]), 'open');
    const st = solState(pose, { L: out, R: up });
    st.weapon = { kind: 'shovel', M: shovelInHand(st.hands.R.M) };
    const h = headPos(st);
    const eye = V3.add(spline([[0, [door[0] + 4.6, 1.6, door[2] - 3.4]], [0.7, [door[0] + 4.4, 1.6, door[2] - 3.2]], [1.4, [door[0] + 4.0, 1.55, door[2] - 2.6]], [1.873, [door[0] + 4.6, 1.5, door[2] - 2.0]]])(u), shake(t, 0.03, 7));
    return {
      shot: 'charge', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(eye, V3.add(h, [0, -0.25, 0]), u < 0.5 ? 48 : 40), sol: st, face: faceAt(t), motionBlur: u > 0.55 ? 0.45 : 0.15
    };
  }

  function shotAlley(t) {
    const u = t - 33.258;
    const base = FARM.alley;
    const p = [base[0] + 0.0 + u * 2.2, 0.95, base[2] - 1.0 + u * 1.3];
    const yaw = 1.04;
    const pose = body({ p, yaw, run: u * 1.6, sp: [0.25, -0.2, 0], nk: [-0.2, 0.2, 0] });
    const st = withShotgun(pose, -0.05);
    const fx = [];
    const actors = [];
    const sx = base[0] + 6.5 - u * 1.2, sz = base[2] + 2.5;
    if (t < 34.5) actors.push(blu('scout', FP.run('scout', sx, sz, -1.6, u * 2.2, {}), { gun: null }));
    else {
      const k = t - 34.5;
      actors.push(blu('scout', FP.run('scout', sx - k * 1.5, sz, -1.9, u * 2.2, { lean: 0.5 }), { face: { eyes: 'wide', mouth: 'scream', open: 1 } }));
      fx.push({ kind: 'fire', p: [sx - k * 1.5, 0.6, sz], u: k, w: 0.5, d: 0.5, h: 1.6, s: 0.5, n: 16 });
    }
    if (t > 34.42 && t < 34.62) {
      const mz = Props.muzzle('shotgun', st.weapon.M);
      fx.push({ kind: 'muzzle', p: V3.add(mz.p, V3.mul(mz.d, 0.15)), s: 0.6, spin: t * 30 });
    }
    const h = headPos(st);
    const eye = V3.add(V3.add(p, [-2.1 - u * 0.2, 0.75, -1.5]), shake(t, 0.06, 8));
    return {
      shot: 'alley', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(eye, V3.add(h, [1.2, -0.4, 0.6]), 52), sol: st, face: faceAt(t), actors, fx, motionBlur: 0.55
    };
  }

  function shotCrouch(t) {
    const u = t - 34.964;
    const base = [FARM.alley[0] + 5, 0, FARM.alley[2] + 1.5];
    const p = [base[0] + Math.min(u, 0.4) * 1.5, 0.62, base[2]];
    const yaw = -0.4 + ease((u - 0.5) / 0.4) * 1.0;
    const pose = body({ p, yaw, crouch: 0.6, sp: [0.45, 0.1, 0], nk: [-0.3, -0.2 + ease((u - 0.5) / 0.4) * 0.5, 0] });
    const st = withShotgun(pose, -0.25);
    const h = headPos(st);
    const whip = ease((u - 0.1) / 0.5);
    const eye = V3.add([base[0] - 0.8 - whip * 1.2, 1.0, base[2] - 2.6 + whip * 0.8], shake(t, 0.05, 9));
    const at = V3.lerp([base[0] - 6, 0.4, base[2] + 2], V3.add(h, [0, -0.25, 0]), whip);
    const fx = t > 35.1 && t < 35.5 ? [{ kind: 'spark', p: [base[0] - 3 + (t - 35.1) * 4, 0.6, base[2] + 1] }] : [];
    return {
      shot: 'crouch', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(eye, at, 50), sol: st, face: faceAt(t), fx, motionBlur: u < 0.6 ? 0.7 : 0.3
    };
  }

  function shotBoom(t) {
    const u = t - 36.13;
    const wall = [FARM.alley[0] - 2.6, 1.5, FARM.alley[2] - 0.5];
    return {
      shot: 'boom', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(V3.add([wall[0] + 2.6, 1.3, wall[2] - 1.8], shake(t, 0.08, 10)), [wall[0] - 0.5, 1.4, wall[2] + 0.8], 55),
      fx: [{ kind: 'boom', p: [wall[0] + 0.9, 1.3, wall[2] + 0.2], u: u + 0.05, s: 2.4, seed: 361 }], flash: clamp(1 - u / 0.42, 0, 1) * 0.6, streaks: clamp(1 - u / 0.4, 0, 1), motionBlur: 0.5
    };
  }

  const BALC = [FARM.balcony[0] + 1.2, 3.3, FARM.balcony[2] - 1.3];

  function sniperActor(t, hit) {
    if (t < hit) {
      const pose = FP.stand('sniper', BALC[0], BALC[2], PI + 0.3, { y: BALC[1] - 0.0, sp: [0.1, 0, 0] });
      return blu('sniper', pose, { itemR: 'knife', hat: 'slouch' });
    }
    return flung('sniper', BALC, hit, t, 77, { v: [2, 5, -3] });
  }

  function shotRun(t) {
    const u = t - 36.546;
    const start = [-23.5, 0.95, 19.6];
    const yaw = -0.3;
    const p = V3.add(start, V3.mul(fwdOf(yaw), u * 2.2));
    const pose = body({ p, yaw, run: u * 1.6, sp: [0.25, 0, 0], nk: [-0.15, 0, 0] });
    const st = withLauncher(pose, u < 1.2 ? HIP : SHOULDER);
    const h = headPos(st);
    const orbit = spline([[0, 0.25], [0.9, 0.5], [1.5, 1.9], [2.2, 2.9], [3.12, 3.05]])(u);
    const dist = spline([[0, 1.5], [0.9, 1.2], [2.0, 1.4], [3.12, 1.0]])(u);
    const dir = [S(yaw + orbit), 0, C(yaw + orbit)];
    const eye = V3.add(V3.add(h, V3.add(V3.mul(dir, dist), [0, -0.25, 0])), shake(t, 0.05, 11));
    const at = u < 1.9 ? V3.add(h, [0, -0.35, 0]) : V3.lerp(V3.add(h, [0, -0.35, 0]), BALC, ease((u - 1.9) / 0.8) * 0.65);
    return {
      shot: 'run', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(eye, at, 52), sol: st, face: faceAt(t), actors: [sniperActor(t, 40.05)], motionBlur: 0.55
    };
  }

  function shotFire(t) {
    const u = t - 39.668;
    const p = [FARM.balcony[0] + 4.2, 0.97, FARM.balcony[2] - 6.5];
    const aimYaw = yawTo(p, BALC);
    const turn = ease((u - 0.55) / 0.6);
    const yaw = aimYaw + turn * PI * 0.92;
    const pose = body({ p, yaw, sp: [0.05, -0.05, 0], nk: [-0.15 * (1 - turn), 0, 0], stagger: 0.12 });
    const st = withLauncher(pose, SHOULDER);
    const fx = [];
    const mz = Props.muzzle('launcher', withLauncher(body({ p, yaw: aimYaw, stagger: 0.12 }), SHOULDER).weapon.M);
    fx.push(...rocketFx(mz.p, [BALC[0], BALC[1] + 0.9, BALC[2]], 39.7, 40.05, t));
    if (t > 39.68 && t < 39.85) fx.push({ kind: 'backblast', p: M4.point(st.weapon.M, [0, 0, -0.7]), dir: V3.norm(M4.dir(st.weapon.M, [0, 0, -1])), u: t - 39.68 });
    fx.push(...boomFx([BALC[0], BALC[1] + 0.9, BALC[2]], 40.05, t, 2.2));
    fx.push(...gibsFx([BALC[0], BALC[1] + 0.9, BALC[2]], 40.05, t, 14, 23));
    const h = headPos(st);
    const shoulder = M4.point(st.m.chest, [-0.35, 0.5, -0.45]);
    const eye = V3.add(V3.lerp(V3.add(shoulder, [0, 0.15, 0]), V3.add(h, [S(yaw) * 1.2 + 0.4, -0.2, C(yaw) * 1.2]), turn), shake(t, 0.04, 12));
    const at = V3.lerp(BALC, V3.add(h, [0, -0.3, 0]), turn);
    return {
      shot: 'fire', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(eye, at, 50), sol: st, face: faceAt(t), actors: [sniperActor(t, 40.05)], fx, motionBlur: turn > 0.05 && turn < 0.95 ? 0.6 : 0.2
    };
  }

  function shotReload(t) {
    const u = t - 41.666;
    const p = [FARM.balcony[0] + 2.5 + u * 1.8, 0.95, FARM.balcony[2] - 8 - u * 0.5];
    const yaw = PI / 2 + 0.6;
    const pose = body({ p, yaw, run: u * 1.4, sp: [0.3, 0, 0], nk: [-0.1, 0, 0] });
    const mode = u < 0.9 ? { at: [-0.12, 0.25, 0.42], rot: [0.5, 0.4, 0.2] } : SHOULDER;
    const st = withLauncher(pose, mode);
    const h = headPos(st);
    const eye = V3.add(V3.add(h, [S(yaw + 1.2) * 1.0, -0.35, C(yaw + 1.2) * 1.0]), shake(t, 0.06, 13));
    return {
      shot: 'reload', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(eye, V3.add(h, [0, -0.45, 0]), 46), sol: st, face: faceAt(t), motionBlur: 0.65
    };
  }

  const POSTCAM = [0, 1.5, 16.4];

  function shotHeavyPost(t) {
    const u = t - 44.039;
    const C0 = POSTCAM;
    const post = V3.add(C0, [1.15, -1.5, 2.4]);
    const hv0 = V3.add(C0, [1.4, -1.5, 7.5]), hv1 = V3.add(C0, [-2.2, -1.5, 2.8]);
    const hp = V3.lerp(hv0, hv1, clamp(u / 1.66, 0, 1));
    const heavy = { cls: 'heavy', team: 'red', pose: FP.run('heavy', hp[0], hp[2], yawTo(hv0, hv1), u * 1.4, { lean: 0.12 }), face: { eyes: 'angry', brows: 'angry', mouth: 'teeth' } };
    armed(heavy, 'minigun');
    const s0 = V3.add(C0, [0.4, -0.55, 4.2]), s1 = V3.add(C0, [-2.6, -0.55, 11.5]);
    const p = V3.lerp(s0, s1, clamp(u / 1.66, 0, 1));
    const pose = body({ p, yaw: yawTo(s0, s1), run: u * 1.7, sp: [0.25, 0, 0] });
    const st = withLauncher(pose, SHOULDER);
    const fx = boomFx(V3.add(C0, [-4.5, -0.9, 14]), 44.95, t, 2.2);
    return {
      shot: 'heavyPost', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(V3.add(C0, shake(t, 0.02, 14)), V3.add(C0, [-1.0, 0.4, 12]), 50), sol: st, face: faceAt(t), actors: [heavy], fx,
      props: [{ kind: 'post', p: post }]
    };
  }

  const FIELD_BLU = [[-3, 22, 'scout'], [2, 24, 'demo'], [6, 25, 'soldier'], [9, 21, 'heavy'], [-6, 26, 'medic'], [13, 24, 'pyro']];
  const FIELD_RED = [[-5, 10, 'scout'], [1, 8, 'heavy'], [8, 12, 'demo']];

  function fieldActors(t) {
    const out = [];
    FIELD_BLU.forEach(([x, z, cls], i) => {
      const a = blu(cls, FP.run(cls, 6 - x + S(t * 0.7 + i) * 1.2, 24 + z - (t - 44) * 0.8, PI + S(i) * 0.3, t * 1.5 + i * 0.3, {}));
      out.push(a);
    });
    FIELD_RED.forEach(([x, z, cls], i) => {
      out.push({ cls, team: 'red', pose: FP.run(cls, 6 - x, 26 + z + (t - 44) * 1.2, 0.1 * i, t * 1.5 + i * 0.4, {}) });
    });
    return out;
  }

  function shotWide(t) {
    const u = t - 45.704;
    const p = [9 - u * 2.2, 0.95, 33 + u * 2.4];
    const pose = body({ p, yaw: -0.75, run: u * 1.7, sp: [0.22, 0, 0] });
    const st = withLauncher(pose, SHOULDER);
    const fx = [];
    fx.push(...boomFx([13, 0.8, 31], 45.72, t, 2.2));
    fx.push(...boomFx([3, 0.8, 44], 46.75, t, 2.0));
    fx.push(...rocketFx([15, 1.4, 30], [2, 1.0, 46], 45.9, 46.6, t));
    for (let i = 0; i < 3; i++) {
      const ph = frac(t * 2 + i / 3);
      const a = [-2 + i * 2, 1.3, 52];
      const z = [12 - i, 0.8, 34];
      fx.push({ kind: 'tracer', a: V3.lerp(a, z, ph), b: V3.lerp(a, z, Math.min(1, ph + 0.1)) });
    }
    const eye = [8 - u * 0.4, 1.8, 24];
    return {
      shot: 'wide', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(V3.add(eye, shake(t, 0.03, 15)), [6, 3.2, 60], 52), sol: st, face: faceAt(t), actors: fieldActors(t), fx
    };
  }

  function grenadeHands(t, st0) {
    const ch = st0.m.chest;
    const g0 = Sol.grenadeRestWorld(st0.m, 0), g1 = Sol.grenadeRestWorld(st0.m, 1);
    const pos0 = M4.point(g0, [0, 0, 0]), pos1 = M4.point(g1, [0, 0, 0]);
    const pick = (pos, side) => freeHand(V3.add(pos, M4.dir(ch, [side * 0.03, -0.06, 0.07])), M4.dir(ch, [-side * 0.6, 0.3, -0.4]), M4.dir(ch, [-side * 0.3, 0, -1]), 'hold');
    const lift = (side, k) => freeHand(M4.point(ch, [side * 0.25, 0.36 + k * 0.05, 0.4]), M4.dir(ch, [-side * 0.15, 1, 0.25]), M4.dir(ch, [-side, 0, 0.35]), 'hold');
    const low = (side) => freeHand(M4.point(ch, [side * 0.2, 0.15, 0.3]), M4.dir(ch, [-side * 0.5, -0.3, 0.6]), M4.dir(ch, [-side * 0.8, 0, -0.4]), 'hold');
    const swing = (side, k) => freeHand(M4.point(ch, [side * (0.3 + k * 0.25), 0.2 + k * 0.1, 0.3 - k * 0.15]), M4.dir(ch, [side, -0.2, 0.5]), M4.dir(ch, [0, 0, -1]), 'hold');
    const keysR = [[47.29, pick(pos0, -1)], [48.9, pick(pos0, -1)], [49.6, lift(-1, 0)], [51.6, lift(-1, 1)], [52.2, low(-1)], [53.6, low(-1)], [54.1, lift(-1, 0)], [54.9, low(-1)], [55.4, swing(-1, 1)], [56.0, low(-1)], [56.5, swing(-1, 1)]];
    const keysL = [[47.29, pick(pos1, 1)], [49.0, pick(pos1, 1)], [49.6, lift(1, 0)], [51.6, lift(1, 1)], [52.2, low(1)], [53.8, low(1)], [54.4, lift(1, 0)], [55.0, swing(1, 1)], [55.6, low(1)], [56.2, swing(1, 1)], [56.9, low(1)]];
    const at = (keys) => {
      let i = 0;
      while (i < keys.length - 1 && t >= keys[i + 1][0]) i++;
      if (i >= keys.length - 1) return keys[keys.length - 1][1];
      const k = ease((t - keys[i][0]) / Math.min(0.45, keys[i + 1][0] - keys[i][0]));
      return blendHand(keys[i][1], keys[i + 1][1], k);
    };
    return { R: at(keysR), L: at(keysL), pos0, pos1 };
  }

  function shotGrenades(t) {
    const Y2 = FARM.yard2;
    const sway = spline([[47.29, 0], [49.5, 0.05], [52.0, -0.05], [53.5, 0.25], [55.0, 0.45], [56.0, 0.6], [56.98, 0.55]])(t);
    const lean = spline([[47.29, 0.05], [49.5, 0.0], [51.0, -0.05], [52.4, 0.4], [53.4, 0.3], [54.6, 0.15], [55.3, 0.45], [56.2, 0.55], [56.98, 0.5]])(t);
    const yaw = spline([[47.29, -0.25], [49.0, -0.2], [51.0, -0.1], [52.5, 0.1], [54.0, -0.4], [55.3, 0.25], [56.3, -0.3], [56.98, -0.1]])(t);
    const nk = spline([[47.29, [0.0, 0.25, 0]], [48.4, [0.15, 0.1, 0]], [49.4, [-0.05, 0.0, 0]], [50.8, [0.1, 0.25, 0.1]], [52.3, [0.6, 0.1, 0]], [53.4, [0.1, -0.2, 0]], [54.4, [-0.05, 0.25, 0.1]], [55.3, [0.2, -0.3, 0]], [56.2, [0.3, 0.2, -0.1]], [56.98, [0.2, 0.0, 0]]])(t);
    const p = [Y2[0] + sway * 0.3, 0.97 - lean * 0.1, Y2[2] + 0.2];
    const pose = body({ p, yaw, sp: [lean, sway * 0.3, 0], nk, spread: 0.05 });
    const st0 = solState(pose, {});
    const H = grenadeHands(t, st0);
    const st = solState(pose, { L: H.L, R: H.R });
    const gM = (side) => {
      const hm = st.hands[side] && st.hands[side].M;
      return hm ? M4.chain(hm, M4.translate(0, -0.075, 0.075), M4.rotX(-0.5), M4.scale(1.15, 1.15, 1.15)) : null;
    };
    st.grenades = [{ M: gM('R'), tether: H.pos0 }, { M: gM('L'), tether: H.pos1 }];
    const h = headPos(st);
    const push = spline([[47.29, 0], [52.0, 0.05], [53.0, 0.25], [55.0, 0.3], [56.98, 0.35]])(t);
    const eye = V3.add([Y2[0] - 0.2 + push * 0.2, 1.6 - push * 0.15, Y2[2] + 1.34 - push * 0.3], shake(t, 0.01, 16));
    return {
      shot: 'grenades', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(eye, [h[0] + 0.04, h[1] - 0.31, h[2]], 42), sol: st, face: faceAt(t), blur: 0.55, focus: 'sol', motionBlur: t > 55.2 ? 0.3 : 0
    };
  }

  function shotAway(t) {
    const u = t - 56.984;
    const start = [FARM.field[0] - 2, 0, FARM.field[2] + 10];
    const p = [start[0] + u * 0.4, 0.95, start[2] + u * 3.2];
    const pose = body({ p, yaw: 0.1, run: u * 1.7, sp: [0.2, 0, 0] });
    const st = withLauncher(pose, SHOULDER);
    const scout = { cls: 'scout', team: 'red', pose: FP.crouch('scout', start[0] - 3.5, start[2] + 3 + u * 0.4, 0.4, {}) };
    armed(scout, 'scatter');
    const bodies = [[1.5, 6, 'medic'], [3, 9, 'scout'], [-1, 12, 'pyro']].map(([x, z, cls], i) => blu(cls, FP.supine(cls, start[0] + x, start[2] + z, i * 1.3)));
    const fx = boomFx([start[0] + 3, 0.6, start[2] + 4.5], 57.0, t, 1.8);
    const eye = V3.add([p[0] - 0.4, 1.5, p[2] - 3.4], shake(t, 0.05, 17));
    return {
      shot: 'away', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(eye, [p[0] + 0.2, 1.3, p[2] + 6], 52), sol: st, face: faceAt(t), actors: [scout].concat(bodies), fx, motionBlur: 0.45
    };
  }

  function shotPipe(t) {
    const u = t - 59.856;
    const pipe = FARM.pipe;
    const top = [pipe[0], 1.5, pipe[2] + 1];
    const jump = clamp((u - 0.12) / 1.4, 0, 1);
    const p = [top[0] + 0.3, top[1] + 0.95 + S(jump * PI * 0.62) * 1.7, top[2] + jump * 1.0];
    const pose = body({ p, yaw: -PI / 2 + 0.4, air: true, sp: [0.1, 0, 0], nk: [-0.1, 0, 0] });
    const st = withLauncher(pose, { at: [-0.18, 0.62, 0.05], rot: [-1.0, 0.1, 0] });
    const fx = boomFx([top[0], top[1] + 0.2, top[2]], 59.82, t, 2.4);
    const eye = [pipe[0] - 4.6, 1.5, pipe[2] + 0.6];
    return {
      shot: 'pipe', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(V3.add(eye, shake(t, 0.03, 18)), [pipe[0], 2.6 + jump * 0.4, pipe[2] + 1.1], 46), sol: u > 0.08 ? st : null, face: faceAt(t), fx,
      flash: clamp(1 - u / 0.2, 0, 1) * 0.8
    };
  }

  function bridgeBlu(t) {
    const B = FARM.bridge;
    const y = 2.72;
    const pyro = armed(blu('pyro', FP.stand('pyro', B[0] - 0.6, B[2] + 1.5, PI / 2 + 0.3, { y }), { tint: [0.62, 0.8, 1.05] }), 'flamer');
    const medic = armed(blu('medic', FP.stand('medic', B[0] + 0.4, B[2] - 0.5, PI / 2, { y })), 'medigun');
    const heavy = armed(blu('heavy', FP.stand('heavy', B[0] + 0.6, B[2] - 2.2, PI / 2 - 0.3, { y })), 'minigun');
    return [pyro, medic, heavy];
  }

  function shotTank(t) {
    const B = FARM.bridge;
    const p = [B[0] + 6.4, 2.35 + 0.97, B[2] + 1.2];
    const aimYaw = yawTo(p, [B[0], 3.2, B[2]]);
    const pose = body({ p, yaw: aimYaw, sp: [0.2, 0, 0], ground: 2.35, stagger: 0.15 });
    const st = withLauncher(pose, SHOULDER);
    const fx = [];
    const mz = Props.muzzle('launcher', st.weapon.M);
    fx.push(...rocketFx(mz.p, [B[0] + 0.2, 3.4, B[2] - 0.2], 61.95, 62.28, t));
    fx.push(...boomFx([B[0] + 0.2, 3.4, B[2] - 0.2], 62.28, t, 1.8));
    const actors = bridgeBlu(t);
    const pyroM = Fab.solve('pyro', actors[0].pose);
    const gun = M4.mul(pyroM.chest, actors[0].gunM);
    fx.push({ kind: 'flamer', p: M4.point(gun, [0, 0, 0.6]), dir: V3.norm(M4.dir(gun, [0, 0, 1])), u: t, len: 2.4 });
    fx.push({ kind: 'uber', p: [B[0] + 0.4, 3.6, B[2] - 0.5], u: t });
    const eye = V3.add(M4.point(st.m.chest, [0.75, 0.95, -0.55]), shake(t, 0.03, 19));
    return {
      shot: 'tank', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(eye, [B[0] - 1.2, 2.4, B[2] - 1.0], 50), sol: st, face: faceAt(t), actors, fx, blur: 0.25, focus: 'far'
    };
  }

  function shotJump(t) {
    const u = t - 62.395;
    const B = FARM.bridge;
    const y = 2.72;
    const heavy = armed(blu('heavy', FP.stand('heavy', B[0] + 0.85, B[2] + 0.2, PI - 0.5, { y, sp: [-0.2, 0, 0], nk: [-0.6, 0, 0] }), { face: { eyes: 'wide', mouth: 'o', brows: 'up' } }), 'minigun');
    const pyro = armed(blu('pyro', FP.stand('pyro', B[0] - 0.75, B[2] + 0.3, PI + 0.5, { y, sp: [-0.25, 0, 0], nk: [-0.6, 0, 0] }), { tint: [0.62, 0.8, 1.05] }), 'flamer');
    const p = [B[0], y + 1.2 + u * 9, B[2] + 0.9];
    const pose = body({ p, yaw: 0, air: true, sp: [0.2, 0, 0] });
    const st = withLauncher(pose, { at: [-0.2, 0.3, 0.2], rot: [1.3, 0, 0] });
    const fx = boomFx([B[0], y + 0.3, B[2] + 0.9], 62.38, t, 1.6);
    fx.push({ kind: 'smokeTrail', p: [B[0], y + 0.3, B[2] + 0.9], u: t, h: Math.min(6, u * 9) });
    const eye = [B[0] + 0.1, y + 0.55, B[2] - 1.6];
    return {
      shot: 'jump', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(V3.add(eye, shake(t, 0.05, 20)), [B[0], y + 1.9, B[2] + 1.0], 64), sol: st, face: faceAt(t), actors: [heavy, pyro], fx
    };
  }

  const DROPS = [['minigun', [-1.4, 0.4, 0.8], 0.4], ['flamer', [1.2, 0.36, -0.6], -1.2], ['medigun', [0.6, 0.36, 1.3], 2.2], ['scatter', [-0.8, 0.36, -1.2], 0.9]];

  function shotLand(t) {
    if (t < 63.3) return { shot: 'land', kind: 'dust', u: t - 63.061 };
    const u = t - 63.3;
    const P0 = FARM.platform;
    const p = [P0[0], 0.35 + 0.48, P0[2]];
    const yaw = 0.9 + u * 0.3;
    const pose = body({ p, yaw, crouch: 0.9, ground: 0.35, sp: [0.7, 0.2, 0], nk: [-0.3, -0.1, 0] });
    const ch = chestOf(pose);
    const swing = ease((u - 0.5) / 0.3);
    const hR = freeHand(M4.point(ch, [-0.35 + swing * 0.5, 0.25 + swing * 0.2, 0.4]), M4.dir(ch, [0.4, -0.2, 1]), M4.dir(ch, [-0.2, -1, 0]), 'fist');
    const hL = freeHand(M4.point(ch, [0.3, -0.05, 0.35]), M4.dir(ch, [0, -1, 0.5]), M4.dir(ch, [-1, 0, 0]), 'relax');
    const st = solState(pose, { L: hL, R: hR });
    const burning = blu('medic', FP.stand('medic', P0[0] + S(yaw) * 1.4 + 0.6, P0[2] + C(yaw) * 1.4, yaw + PI, { y: 0.35, sp: [0.3, 0, 0], hL: [0.4, 0.5, 0.2], hR: [-0.4, 0.55, 0.2] }), { face: { eyes: 'wide', mouth: 'scream', open: 1 } });
    const fx = [{ kind: 'fire', p: [burning.pose.p[0], 0.9, burning.pose.p[2]], u: t, w: 0.6, d: 0.6, h: 1.8, s: 0.55, n: 20 }, { kind: 'embers', p: [P0[0], 0.4, P0[2]], u: t - 63.3, w: 5, n: 30 }];
    const eye = V3.add([P0[0] - 1.6, 1.15, P0[2] - 1.9], shake(t, 0.03, 21));
    return {
      shot: 'land', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(eye, [P0[0] - 0.2, 0.85, P0[2] - 0.3], 48), sol: st, face: faceAt(t), actors: [burning], fx,
      drops: DROPS.map(([gun, off, yawD]) => ({ gun, p: [P0[0] + off[0], off[1] + 0.08, P0[2] + off[2]], yaw: yawD })), motionBlur: 0.3
    };
  }

  function shotSpyFight(t) {
    const P0 = FARM.spy;
    const close = t < 65.392;
    const u = close ? t - 64.643 : t - 65.392;
    const p = [P0[0] + 0.2, 0.97, P0[2] + 2.0];
    const yaw = close ? 2.4 : PI / 2 + 0.2;
    const pose = body({ p, yaw, sp: [0.25, close ? 0.2 : -0.35, 0], nk: [-0.1, close ? -0.15 : 0.25, 0], stagger: 0.2 });
    const ch = chestOf(pose);
    const punch = close ? 0 : ease((u - 0.1) / 0.18) * (1 - ease((u - 0.4) / 0.2));
    const grab = close ? 0 : ease((u - 0.45) / 0.2);
    const hR = freeHand(M4.point(ch, [-0.25 + punch * 0.1, 0.35 + punch * 0.1, 0.25 + punch * 0.5]), M4.dir(ch, [0, 0.2, 1]), M4.dir(ch, [0, -1, 0]), 'fist');
    const hL = freeHand(M4.point(ch, [0.25 - grab * 0.05, 0.3 + grab * 0.2, 0.3 + grab * 0.35]), M4.dir(ch, [-0.3, 0.4, 1]), M4.dir(ch, [-0.5, -0.8, 0]), grab > 0.5 ? 'claw' : 'relax');
    const st = solState(pose, { L: hL, R: hR });
    const fwd = fwdOf(yaw), side = sideOf(yaw);
    let spyPos, spyYaw, spyPose;
    if (close) {
      const lunge = clamp(u / 0.7, 0, 1);
      spyPos = V3.add(p, V3.add(V3.mul(fwd, -1.6 + lunge * 0.7), V3.mul(side, -0.6)));
      spyPos[1] = 0;
      spyYaw = yawTo(spyPos, p);
      spyPose = FP.stand('spy', spyPos[0], spyPos[2], spyYaw, { y: S(lunge * PI) * 0.45, sp: [0.25, 0, 0], hR: [-0.25, 0.8, 0.15], hL: [0.35, 0.2, 0.3], eR: [-0.8, 0.2, -0.2] });
    } else {
      spyPos = V3.add(p, V3.add(V3.mul(fwd, 0.72 - grab * 0.1), V3.mul(side, -0.3)));
      spyYaw = yaw + PI;
      spyPose = FP.stand('spy', spyPos[0], spyPos[2], spyYaw, { sp: [-0.25 - grab * 0.25, 0, 0], nk: [-0.55 - grab * 0.4, 0.2, 0], hR: [-0.45, 0.05, 0.25], hL: [0.45, 0.2, 0.15] });
    }
    const spy = blu('spy', spyPose, { itemR: close ? 'knife' : null, face: { eyes: close ? 'angry' : 'wide', brows: close ? 'angry' : 'up', mouth: close ? 'teeth' : 'scream', open: 1 } });
    const fx = [];
    if (close) fx.push({ kind: 'fire', p: V3.add(p, V3.add(V3.mul(side, 1.6), [0, -0.4, 0])), u: t, w: 1.2, d: 0.8, h: 1.6, s: 0.6, n: 18 });
    else if (u > 0.55) fx.push({ kind: 'cig', p: V3.add(spyPos, [0.1, 1.7 + (u - 0.55) * 1.5, 0.2]), u: u - 0.55 }, { kind: 'squirt', p: V3.add(spyPos, [0.05, 1.55, 0]), u: u - 0.55 });
    const h = headPos(st);
    const eye = close ? V3.add(h, V3.add(V3.mul(fwd, 0.85), V3.add(V3.mul(side, 0.45), [0, -0.05, 0]))) : [p[0] + 0.55, 1.45, p[2] + 2.1];
    const at = close ? V3.lerp(V3.add(h, [0, -0.15, 0]), V3.add(spyPos, [0, 1.55, 0]), 0.55) : V3.add(V3.lerp(h, spyPos, 0.5), [0, -0.3, 0]);
    return {
      shot: close ? 'fire2' : 'spy', kind: '3d', set: 'farm', env: RED_ENV, camera: cam(V3.add(eye, shake(t, 0.04, 22)), at, close ? 56 : 50), sol: st, face: faceAt(t), actors: [spy], fx, motionBlur: close ? 0.3 : 0.25
    };
  }

  function speech2State(t) {
    const near = ease((t - 68.9) / 1.3);
    const p = [lerp(0.2, 0.18, near), 0.97 - near * 0.06, lerp(2.6, 0.58, near)];
    const yaw = PI + spline([[66.5, -0.1], [68.6, 0.0], [69.6, 0.3], [70.6, 0.35], [72.0, 0.15], [73.63, 0.0]])(t);
    const lean = spline([[66.5, 0.2], [68.6, 0.25], [69.4, 0.1], [70.2, 0.45], [72.0, 0.5], [73.63, 0.45]])(t);
    const nk = spline([[66.5, [0.45, 0.1, 0.1]], [68.2, [0.35, 0.05, 0.05]], [68.9, [0.0, 0.0, 0.0]], [70.0, [-0.2, -0.15, 0.05]], [71.2, [-0.25, 0.05, 0.1]], [72.4, [-0.1, -0.05, -0.05]], [73.63, [-0.15, 0.0, 0.0]]])(t);
    const pose = body({ p, yaw, sp: [lean, 0, 0], nk });
    const ch = chestOf(pose);
    const st0 = solState(pose, {});
    const H = st0.m.head;
    const palm = freeHand(M4.point(H, [-0.03, -0.16, 0.2]), M4.dir(H, [0.6, 0.75, 0.1]), M4.dir(H, [0.1, 0.2, -1]), 'flat');
    const elbow = freeHand(M4.point(ch, [-0.02, 0.12, 0.26]), M4.dir(ch, [-1, 0.1, 0.2]), M4.dir(ch, [0, -0.3, -1]), 'relax');
    const down = freeHand(M4.point(ch, [-0.3, -0.18, 0.12]), M4.dir(ch, [0, -1, 0.2]), M4.dir(ch, [1, 0, 0.3]), 'relax');
    const downL = freeHand(M4.point(ch, [0.3, -0.18, 0.12]), M4.dir(ch, [0, -1, 0.2]), M4.dir(ch, [-1, 0, 0.3]), 'relax');
    const off = ease((t - 68.6) / 0.5);
    const hR = blendHand(palm, down, off);
    const hL = blendHand(elbow, downL, off);
    return solState(pose, { L: hL, R: hR });
  }

  function shotSpeech2(t) {
    const st = speech2State(t);
    const h = headPos(st);
    const near = ease((t - 68.9) / 1.3);
    const eye = V3.add(V3.lerp([0.17, 1.6, -0.72], [0.17, 1.55, -0.32], near), shake(t, 0.01, 23));
    const at = V3.add(h, V3.lerp([0, -0.3, 0], [-0.04, -0.07, 0], near));
    return {
      shot: 'speech2', kind: '3d', set: 'yard', env: YARD_ENV, camera: cam(eye, at, lerp(36, 32, near)), sol: st, face: faceAt(t), heads: headsOnGate(), blur: 0.5, focus: 'sol'
    };
  }

  function revealState(t) {
    const p = [1.1, 0.97, 1.8];
    const pose = body({ p, yaw: PI + 0.35, sp: [0.05, 0, 0], nk: [0.1, 0, 0] });
    return solState(pose, {});
  }

  function shotReveal(t) {
    const st = revealState(t);
    const u = t - 73.634;
    const eye = V3.add([0.1 - u * 0.02, 1.5, 2.05 - u * 0.04], shake(t, 0.006, 24));
    return {
      shot: 'reveal', kind: '3d', set: 'yard', env: REVEAL_ENV, camera: cam(eye, [0.05, 1.36, 0], 38), sol: st, face: faceAt(t), heads: headsOnGate(), blur: 0.35, focus: 'heads'
    };
  }

  function shotClose(t) {
    const p = [0.2, 0.97, 0.78];
    const pose = body({ p, yaw: PI + 0.1, sp: [0.12, 0, 0], nk: [0.3, 0.05, 0] });
    const st = solState(pose, {});
    const h = headPos(st);
    const eye = V3.add(h, [-0.04, -0.22, -0.44]);
    return {
      shot: 'close', kind: '3d', set: 'yard', env: YARD_ENV, camera: cam(eye, V3.add(h, [0.01, -0.05, 0]), 44), sol: st, face: faceAt(t), heads: headsOnGate(), blur: 0.3
    };
  }

  const LINE = [
    { cls: 'pyro', x: -1.95, z: 0.15, yaw: 0.35, gun: 'flamer', raise: 0.6 },
    { cls: 'engineer', x: -1.35, z: 0.55, yaw: 0.25, gun: 'shotgun' },
    { cls: 'spy', x: -0.95, z: -0.15, yaw: 0.2, item: 'revolver', raise: true },
    { cls: 'heavy', x: -0.35, z: 0.3, yaw: 0.1, gun: 'minigun' },
    { cls: 'sniper', x: 0.3, z: -0.3, yaw: -0.1, item: 'rifle', raise: true },
    { cls: 'scout', x: 0.3, z: 0.85, yaw: -0.2, item: 'bat', crouch: true },
    { cls: 'demo', x: 1.25, z: 0.45, yaw: -0.3, gun: 'grenade', crouch: true },
    { cls: 'medic', x: 1.95, z: 0.05, yaw: -0.4, gun: 'medigun', raise: 0.8 }
  ];

  function lineupActors() {
    return LINE.map(c => {
      const pose = c.crouch ? FP.crouch(c.cls, c.x, c.z, c.yaw, { depth: 0.45 }) : FP.stand(c.cls, c.x, c.z, c.yaw, {});
      const a = { cls: c.cls, team: 'red', pose };
      if (c.gun) {
        a.gun = c.gun;
        const g = FP.aimGun(c.cls, c.gun, c.raise ? { pitch: -c.raise } : {});
        Object.assign(pose, { hR: g.hR, hL: g.hL });
        a.gunM = g.gunM;
      }
      if (c.item) {
        a.itemR = c.item;
        if (c.raise) {
          pose.hR = [-0.2, 0.42, 0.12];
          pose.eR = [-0.8, -0.3, 0.2];
        }
      }
      return a;
    });
  }

  function lineupSoldier() {
    const p = [0.75, 0.97, 0.05];
    const pose = body({ p, yaw: -0.2, sp: [-0.05, 0, 0], nk: [-0.25, 0.1, 0] });
    return withLauncher(pose, { at: [-0.16, 0.5, 0.14], rot: [-0.85, 0.15, 0.1] });
  }

  function shotLineup(t) {
    const st = lineupSoldier();
    const h = headPos(st);
    let camera;
    let which = 'lineupA';
    if (t < 78.171) camera = cam(V3.add(h, [0.35, -0.42, 0.9 + (t - 77.547) * 0.1]), V3.add(h, [-0.15, -0.12, 0]), 40);
    else if (t < 78.796) {
      which = 'lineupB';
      camera = cam([1.35 - (t - 78.171) * 0.3, 0.95, 1.55], [0.55, 1.75, 0], 46);
    } else {
      which = 'lineupC';
      camera = cam([0.1, 1.0, 3.2], [0.1, 1.45, 0], 52);
    }
    const out = { shot: which, kind: '3d', set: 'lineup', env: LINEUP_ENV, camera, sol: st, face: faceAt(t), actors: lineupActors(), blur: which === 'lineupA' ? 0.3 : 0 };
    if (t >= 78.796) {
      const k = ease((t - 78.8) / 0.55);
      out.logo = { flip: k, y: (1 - k) * -0.4, emblem: 0 };
    }
    return out;
  }

  function shotLogo(t) {
    const st = lineupSoldier();
    const fly = t < 80.0 ? 0 : clamp((t - 80.0) / 0.32, 0, 1);
    return {
      shot: 'logo', kind: '3d', set: 'lineup', env: LINEUP_ENV, camera: cam([0.1, 1.0, 3.2 - (t - 79.42) * 0.03], [0.1, 1.45, 0], 52), sol: st, face: faceAt(t), actors: lineupActors(),
      logo: { flip: 1, y: 0, emblem: fly, emblemFly: t >= 80.0 && t < 80.32 }
    };
  }

  function shotPoke(t) {
    const u = t - 81.793;
    const headAt = [-0.35, 0.15, 1.5];
    const p = [0.3, 0.72, 1.2];
    const yaw = yawTo(p, headAt) + 0.25;
    const pose = body({ p, yaw, crouch: 0.85, sp: [1.0, 0.1, 0.05], nk: [0.35, -0.15, 0] });
    const ch = chestOf(pose);
    const poke = S(u * 7) * 0.02 * (u > 0.3 ? 1 : 0);
    const stump = V3.add(headAt, [0.0, 0.0, 0.1]);
    const finger = freeHand(V3.add(stump, [0.1 + poke, 0.1, 0.06]), V3.norm(V3.sub(stump, M4.point(ch, [-0.25, 0.25, 0.4]))), [0, -1, 0], 'poke');
    const st = solState(pose, { R: finger, L: freeHand(M4.point(ch, [0.42, -0.05, 0.25]), M4.dir(ch, [0, -1, 0.3]), M4.dir(ch, [-1, 0, 0]), 'relax') });
    const eye = [-0.55, 0.32, 2.45];
    return {
      shot: 'poke', kind: '3d', set: 'yard', env: REVEAL_ENV, camera: cam(V3.add(eye, shake(t, 0.004, 25)), [-0.02, 0.52, 1.3], 44), sol: st, face: faceAt(t), blur: 0.45,
      fallen: { cls: 'soldier', p: headAt, roll: -1.45, yaw: 0.35, tilt: 0.25 }
    };
  }

  const SHOTS = [
    [0, 'black'], [1.498, 'pyro'], [4.162, 'crates'], [6.535, 'hill'], [8.324, 'heavyRun'], [10.489, 'title'], [13.985, 'speech'], [31.385, 'charge'],
    [33.258, 'alley'], [34.964, 'crouch'], [36.13, 'boom'], [36.546, 'run'], [39.668, 'fire'], [41.666, 'reload'], [44.039, 'heavyPost'],
    [45.704, 'wide'], [47.285, 'grenades'], [56.984, 'away'], [59.565, 'flash'], [59.856, 'pipe'], [61.355, 'tank'], [62.395, 'jump'],
    [63.061, 'land'], [64.643, 'spyFight'], [66.266, 'black'], [66.516, 'speech2'], [73.634, 'reveal'], [76.922, 'close'], [77.547, 'lineup'],
    [79.42, 'logo'], [81.793, 'poke'], [83.416, 'orange']
  ];

  function shotAt(t) {
    let i = 0;
    while (i < SHOTS.length - 1 && t >= SHOTS[i + 1][0]) i++;
    return SHOTS[i][1];
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION - 0.001);
    switch (shotAt(tt)) {
      case 'pyro': return shotPyro(tt);
      case 'crates': return shotCrates(tt);
      case 'hill': return shotHill(tt);
      case 'heavyRun': return shotHeavyRun(tt);
      case 'title': return shotTitle(tt);
      case 'speech': return shotSpeech(tt);
      case 'charge': return shotCharge(tt);
      case 'alley': return shotAlley(tt);
      case 'crouch': return shotCrouch(tt);
      case 'boom': return shotBoom(tt);
      case 'run': return shotRun(tt);
      case 'fire': return shotFire(tt);
      case 'reload': return shotReload(tt);
      case 'heavyPost': return shotHeavyPost(tt);
      case 'wide': return shotWide(tt);
      case 'grenades': return shotGrenades(tt);
      case 'away': return shotAway(tt);
      case 'flash': return { shot: 'flash', kind: 'flash', u: tt - 59.565 };
      case 'pipe': return shotPipe(tt);
      case 'tank': return shotTank(tt);
      case 'jump': return shotJump(tt);
      case 'land': return shotLand(tt);
      case 'spyFight': return shotSpyFight(tt);
      case 'speech2': return shotSpeech2(tt);
      case 'reveal': return shotReveal(tt);
      case 'close': return shotClose(tt);
      case 'lineup': return shotLineup(tt);
      case 'logo': return shotLogo(tt);
      case 'poke': return shotPoke(tt);
      case 'orange': return { shot: 'orange', kind: 'card', cards: [{ tex: 'orange', zoom: 1 }], fade: 1 - clamp((tt - 85.55) / 0.75, 0, 1) };
      default: return { shot: 'black', kind: 'black' };
    }
  }

  function voiceAt(t) {
    return jawV(t);
  }

  window.MtsScript = { ID, DURATION, CUTS, SHOTS, stage, voiceAt, faceAt, spline, X, LINE, HEAD_CLS };
})();
