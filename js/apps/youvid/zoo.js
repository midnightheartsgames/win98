(function () {
  const { M4, V3, Builder, shade, rand } = window.P3D;
  const { Figure, restPose } = window.P3DFigure;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, ease, keys, spherePatch, tube, mesh, noiseTex } = K;

  const DURATION = 19.06;
  const VOICE = K.envelope('00000000000000eIFxuib5eDDZy0000000IZZ300mcvLJRZZZVWSEo000000rqr10ionJILEDwByEa03xcfgf0000313475geEf0jela24000keloecbea00010000069007oUJ4czkhlm1d50409I00rz425ONECf06040gzna00i00c80kv0atjkw60000000Hl3anEJGKJCBp0000w60096m200tqhke009nrAupvuwjd7lBKzzxth00000jKPHICfef80000003cbd6gaa100cieei30500002gkla952bnOQBonnpbitfnifim6klBBtMMa4hhafgEk0202qml100000000000008nvjgfigiaf96159pmfcgsrqrwrkhh97ukd689jhok0', 25);

  const LOOK = {
    skin: 0xdcb0b0,
    hair: 0x2b232a,
    tips: 0x5a5259,
    shirt: 0x18223f,
    shell: 0x2a2d3a,
    fleece: 0x7c808c,
    lining: 0xa63a55
  };

  const DIM = { hip: 0.095, thigh: 0.42, shin: 0.4, sole: 0.05, shoulder: 0.2, upper: 0.29, fore: 0.25, torso: 0.46, waist: 0.17, chest: 0.215, depth: 0.13, headR: 0.1 };
  const SOLVER = { d: DIM, scale: 1 };
  const HR = 0.115;
  const HEAD_DROP = 0.065;
  const HEAD_Y_FIX = 0.058;
  const EYE = [0, 1.61, 0.7];
  const PITCH = 6.6 * PI / 180;
  const AT = [0, 1.61 - 0.7 * Math.tan(PITCH), 0];
  const TAN = Math.tan(25 * PI / 180);
  const HALF_W = 0.7 * TAN * (4 / 3);
  const HALF_H = 0.7 * TAN;

  const headScreen = keys([
    [0, [0.68, 0.355]], [1.3, [0.6, 0.37]], [2.5, [0.42, 0.4]], [3.3, [0.5, 0.41]], [4.2, [0.58, 0.46]], [4.95, [0.5, 0.42]],
    [5.3, [0.445, 0.415]], [7.5, [0.5, 0.42]], [8.5, [0.54, 0.385]], [10.8, [0.52, 0.36]], [13, [0.54, 0.4]],
    [14.2, [0.6, 0.4]], [15.5, [0.66, 0.42]], [16.4, [0.64, 0.42]], [17.2, [0.56, 0.4]], [18.5, [0.52, 0.4]], [19.1, [0.52, 0.4]]
  ]);
  const headYaw = keys([[0, 0.05], [2.0, 0.05], [2.4, 0.58], [2.95, 0.5], [3.35, 0.2], [3.8, 1.95], [4.55, 2.0], [4.95, 0.08], [14.15, 0.08], [14.65, 1.95], [16.15, 2.0], [16.55, 0.8], [16.9, 0.06], [19.1, 0.04]]);
  const lean = keys([[0, 0], [6.4, 0], [7.5, 0.085], [8.5, 0.08], [9.6, 0.03], [10.8, 0.03], [12.2, 0.06], [13, 0.11], [13.9, 0.04], [14.3, 0], [19.1, 0]]);
  const roll = keys([[0, -0.16], [1.0, -0.12], [1.8, 0.04], [2.5, 0.22], [3.3, 0.12], [3.8, -0.1], [4.55, -0.12], [4.9, 0.02], [5.3, 0.12], [7.6, 0.12], [8.4, 0], [14.2, 0], [14.65, -0.16], [16.2, -0.16], [16.9, 0], [19.1, 0]]);
  const twist = keys([[0, 0.05], [2.0, 0.05], [2.45, 0.2], [3.3, 0.1], [3.8, 0.25], [4.55, 0.27], [5, 0.02], [9, -0.06], [12, 0.03], [14.2, 0.04], [14.65, 0.25], [16.2, 0.27], [16.9, 0.05], [19.1, 0.05]]);

  const GESTURES = [
    { t0: 4.85, t1: 5.75, kind: 'spread', at: [0.47, 1.02] },
    { t0: 6.85, t1: 8.0, kind: 'pinch', at: [0.3, 0.9] },
    { t0: 8.15, t1: 8.95, kind: 'flat', at: [0.245, 0.83] },
    { t0: 10.05, t1: 11.7, kind: 'flat', at: [0.255, 0.77] }
  ];

  function handAt(t) {
    for (const g of GESTURES) {
      if (t > g.t0 && t < g.t1) {
        const k = Math.min(ease((t - g.t0) / 0.3), ease((g.t1 - t) / 0.3));
        const wig = [S(t * 5.3) * 0.012, S(t * 4.1) * 0.01];
        return { kind: g.kind, k, at: [g.at[0] + wig[0], g.at[1] + wig[1]] };
      }
    }
    return null;
  }

  const smileAt = (t) => t < 0.55 || t > 18.2 || (t > 12.6 && t < 13.2) || (t > 8.3 && t < 8.7);
  const blinkAt = (t) => [1.1, 4.95, 6.4, 9.2, 12.35, 13.9, 17.05, 18.6].some(b => t > b && t < b + 0.13);

  function mouthAt(t) {
    const v = VOICE(t);
    if (v < 0.18) return smileAt(t) ? 'smirk' : 'shut';
    if (v < 0.45) return 'open';
    return 'wide';
  }

  function screenToWorld(sx, sy, depth) {
    const f = V3.norm(V3.sub(AT, EYE));
    const right = V3.norm(V3.cross(f, [0, 1, 0]));
    const up = V3.cross(right, f);
    const nx = (sx * 2 - 1) * TAN * (4 / 3);
    const ny = (1 - sy * 2) * TAN;
    return V3.add(EYE, V3.mul(V3.add(V3.add(f, V3.mul(right, nx)), V3.mul(up, ny)), depth));
  }

  function stage(t) {
    const p = restPose();
    const hs = headScreen(t);
    const tw = twist(t);
    p.ry = tw * 0.5;
    const rl = roll(t);
    p.spine = [0.05 + S(t * 0.7) * 0.012, tw * 0.5, S(t * 0.9) * 0.02 + rl];
    const talk = VOICE(t);
    const yaw = headYaw(t);
    const turned = clamp((Math.abs(yaw) - 0.4) / 1.2, 0, 1);
    p.neck = [0.06 + talk * 0.05 * S(t * 11) + turned * 0.2, yaw - p.ry - p.spine[1] + S(t * 1.7) * 0.03, S(t * 1.2) * 0.04 - rl];
    p.shR = [-0.12, 0, 0.3];
    p.elR = [0.25, 0, 0];
    p.shL = [-0.28, 0, 0.36];
    p.elL = [0.22, 0, 0];
    const probe = Figure.prototype.solve.call(SOLVER, p);
    const head = M4.point(probe.head, [0, -HEAD_DROP, 0]);
    const zo = lean(t);
    const k = (0.7 - zo) / 0.7;
    const want = [(hs[0] - 0.5) * 2 * HALF_W * k, EYE[1] - zo * Math.tan(PITCH) + (0.375 - hs[1] - HEAD_Y_FIX) * 2 * HALF_H * k + 0.005];
    p.x = want[0] - head[0];
    p.z = zo;
    p.lift = want[1] - head[1];
    const solved = Figure.prototype.solve.call(SOLVER, p);
    const hand = handAt(t);
    let arm = null;
    if (hand) {
      const rest = [hand.at[0] - 0.12, 1.3];
      const k = hand.k;
      const sx = rest[0] + (hand.at[0] - rest[0]) * k, sy = rest[1] + (hand.at[1] - rest[1]) * k;
      const wrist = screenToWorld(sx, sy, 0.44);
      const elbow = screenToWorld(sx - 0.22, sy + 0.5, 0.5);
      arm = { kind: hand.kind, wrist, elbow };
    }
    const camera = { eye: EYE, at: AT, fov: 50, near: 0.05, far: 80, grade: [0.94, 0.94, 0.99, 0.08], fx: { grain: 0.03, vignette: 0.1, time: t } };
    return { camera, pose: p, m: solved, head: M4.point(solved.head, [0, -HEAD_DROP, 0]), mouth: mouthAt(t), blink: blinkAt(t), arm };
  }

  function drawFace(mouth, blink) {
    return (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(w / 256, h / 256);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const ey = 100;
      ctx.fillStyle = 'rgba(110, 72, 78, 0.22)';
      [86, 170].forEach(x => { ctx.beginPath(); ctx.ellipse(x, ey - 1, 27, 14, 0, 0, PI * 2); ctx.fill(); });
      ctx.fillStyle = 'rgba(150, 100, 104, 0.35)';
      ctx.beginPath();
      ctx.moveTo(116, ey + 44);
      ctx.quadraticCurveTo(128, ey + 52, 140, ey + 44);
      ctx.quadraticCurveTo(128, ey + 49, 116, ey + 44);
      ctx.fill();
      ctx.strokeStyle = '#211619';
      ctx.lineWidth = 8;
      [[86, -1], [170, 1]].forEach(([x, s]) => {
        ctx.beginPath();
        ctx.moveTo(x - s * 24, ey - 21);
        ctx.lineTo(x + s * 22, ey - 22);
        ctx.stroke();
      });
      [86, 170].forEach(x => {
        if (blink) {
          ctx.strokeStyle = '#3a2428';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(x - 16, ey + 1);
          ctx.quadraticCurveTo(x, ey + 5, x + 16, ey + 1);
          ctx.stroke();
          return;
        }
        ctx.fillStyle = '#e8e2e0';
        ctx.beginPath();
        ctx.ellipse(x, ey + 2, 15, 6, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3e2a22';
        ctx.beginPath();
        ctx.arc(x + (x < 128 ? 2 : -2), ey + 3, 6, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0e0808';
        ctx.beginPath();
        ctx.arc(x + (x < 128 ? 2 : -2), ey + 3, 2.8, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(96, 60, 66, 0.95)';
        ctx.fillRect(x - 17, ey - 5, 34, 5);
        ctx.strokeStyle = '#24161a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 16, ey);
        ctx.lineTo(x + 16, ey);
        ctx.stroke();
      });
      const my = 176;
      ctx.strokeStyle = '#86505a';
      ctx.fillStyle = '#4a1a20';
      ctx.lineWidth = 5;
      if (mouth === 'smirk') {
        ctx.beginPath();
        ctx.moveTo(108, my + 1);
        ctx.quadraticCurveTo(130, my + 4, 150, my - 6);
        ctx.stroke();
      } else if (mouth === 'shut') {
        ctx.beginPath();
        ctx.moveTo(110, my);
        ctx.quadraticCurveTo(128, my + 3, 148, my - 2);
        ctx.stroke();
      } else {
        const hgt = mouth === 'wide' ? 12 : 6;
        ctx.beginPath();
        ctx.ellipse(128, my + 2, mouth === 'wide' ? 18 : 15, hgt, 0, 0, PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#e8dcd6';
        ctx.fillRect(115, my - hgt + 3, 26, mouth === 'wide' ? 5 : 3);
      }
      ctx.restore();
    };
  }

  const FACES = [];
  ['shut', 'smirk', 'open', 'wide'].forEach(m => [false, true].forEach(b => FACES.push({ key: m + (b ? '-b' : ''), m, b })));

  function ringPt(ang, rx, rz, y) {
    return [S(ang) * rx, y, C(ang) * rz];
  }

  function jacketBand(b, a0, a1, y0, y1, r0, r1, colorAt, n, cuts) {
    const us = [];
    for (let i = 0; i <= n; i++) us.push(a0 + ((a1 - a0) * i) / n);
    (cuts || []).forEach(c => { if (c > a0 && c < a1) us.push(c); });
    us.sort((x, y) => x - y);
    for (let i = 0; i < us.length - 1; i++) {
      const u0 = us[i], u1 = us[i + 1];
      const col = colorAt((u0 + u1) / 2);
      const p00 = ringPt(u0, r0[0], r0[1], y0), p10 = ringPt(u1, r0[0], r0[1], y0);
      const p01 = ringPt(u0, r1[0], r1[1], y1), p11 = ringPt(u1, r1[0], r1[1], y1);
      const nrm = (u, y) => V3.norm([S(u), y, C(u)]);
      const slope = (r0[0] - r1[0]) * 2;
      b.quad(p00, p10, p11, p01, col, null, [nrm(u0, slope), nrm(u1, slope), nrm(u1, slope), nrm(u0, slope)]);
    }
  }

  function buildHands(r) {
    const skin = shade(LOOK.skin, 0.9);
    const slab = (b, x, y, w, len, ang, thick) => {
      b.push(M4.translate(x, y, 0), M4.rotZ(ang));
      b.at(0, len / 2, 0, h => h.box(w, len, thick || 0.02, skin));
      b.at(0, len, 0, h => h.ellipsoid(w / 2, 0.008, (thick || 0.02) / 2, 6, 3, skin));
      b.pop();
    };
    return {
      spread: mesh(r, b => {
        b.push(M4.rotZ(-0.85));
        b.box(0.07, 0.07, 0.024, skin);
        slab(b, -0.014, 0.03, 0.036, 0.075, 0.26);
        slab(b, 0.018, 0.03, 0.034, 0.068, -0.3);
        slab(b, 0.036, -0.022, 0.02, 0.05, -1.0);
        b.pop();
      }),
      pinch: mesh(r, b => {
        b.push(M4.rotZ(-0.5));
        b.box(0.068, 0.068, 0.03, skin);
        b.push(M4.translate(0, 0.034, 0), M4.rotX(1.1));
        slab(b, -0.004, 0, 0.056, 0.05, 0, 0.022);
        b.pop();
        b.push(M4.translate(0.03, -0.018, 0.012), M4.rotZ(-0.5), M4.rotX(0.6));
        slab(b, 0, 0, 0.02, 0.06, 0, 0.02);
        b.pop();
        b.pop();
      }),
      flat: mesh(r, b => {
        b.box(0.075, 0.066, 0.024, skin);
        b.push(M4.translate(0.036, 0, 0), M4.rotZ(-PI / 2));
        b.at(0, 0.035, 0, h => h.box(0.062, 0.07, 0.02, skin));
        b.at(0, 0.07, 0, h => h.ellipsoid(0.031, 0.01, 0.01, 6, 3, skin));
        b.pop();
        b.push(M4.translate(-0.01, 0.032, 0.004), M4.rotZ(-PI / 2 + 0.55));
        b.at(0, 0.025, 0, h => h.box(0.02, 0.05, 0.02, skin));
        b.pop();
      })
    };
  }

  function makeJawed(r) {
    const L = LOOK;
    const d = DIM;
    const faces = {};
    FACES.forEach(f => { faces[f.key] = r.texture(256, drawFace(f.m, f.b), { clamp: true }); });
    const RX = HR * 0.8, RY = HR * 1.12, RZ = HR * 0.96;
    const head = mesh(r, b => {
      spherePatch(b, RX, RY, RZ, -PI, PI, -PI / 2, PI / 2, 16, 12, L.skin);
      [-1, 1].forEach(s => b.at(s * RX * 0.97, -HR * 0.06, -0.01, h => h.ellipsoid(0.01, 0.021, 0.015, 6, 4, shade(L.skin, 0.8))));
      b.at(0, -HR * 0.1, RZ * 0.97, h => h.ellipsoid(0.011, 0.017, 0.009, 6, 4, shade(L.skin, 0.97)));
    });
    const face = mesh(r, b => spherePatch(b, RX * 1.01, RY * 1.01, RZ * 1.01, -0.95, 0.95, -0.74, 0.42, 10, 8, [1, 1, 1, 0], [1, 1]));
    const hair = mesh(r, b => {
      const H = L.hair;
      const T = L.tips;
      const g = rand(8);
      const nu = 20, nv = 7;
      const noise = [];
      for (let i = 0; i <= nu; i++) noise.push(g());
      const lower = (yaw) => {
        const a = Math.abs(yaw);
        if (a < 0.95) return 0.34 - (yaw > 0 ? 0.06 : 0);
        if (a < 1.55) return 0.2;
        if (a < 2.1) return 0.2 - (a - 1.55) * 2.0;
        return -0.95;
      };
      const pt = (i, j) => {
        const yaw = -PI + (i / nu) * 2 * PI;
        const p0 = lower(yaw);
        const pit = p0 + (PI / 2 - p0) * (j / nv);
        const bump = 1.08 + (j > 0 && j < nv ? 0.035 * noise[i % nu] + 0.02 * S(i * 1.7 + j) : 0.01);
        const wide = j >= nv - 3 ? 1.1 : 1;
        const flat = j === nv ? 0.93 : 1;
        return [S(yaw) * C(pit) * RX * bump * wide, S(pit) * RY * bump * flat + (j >= 3 ? RY * 0.05 : 0), C(yaw) * C(pit) * RZ * bump * wide];
      };
      for (let j = 0; j < nv; j++) {
        for (let i = 0; i < nu; i++) {
          const col = j >= nv - 2 && (i + j) % 3 === 0 ? T : H;
          b.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), col);
        }
      }
      const P = (yaw, pit, kk) => [S(yaw) * C(pit) * RX * kk, S(pit) * RY * kk, C(yaw) * C(pit) * RZ * kk];
      for (let i = 0; i < 9; i++) {
        const a = -2.4 + i * 0.6;
        b.push(M4.translate(...P(a, 0.95 + (i % 3) * 0.12, 1.08)), M4.rotY(a), M4.rotX(-0.9), M4.rotZ(0.4 + (i % 2) * 0.3));
        b.prism(4, 0.035, 0.018, 0, 0.004, 0.004, 0.05, i % 2 ? T : H);
        b.pop();
      }
      for (let i = 0; i < 7; i++) {
        const a0 = -0.9 + (1.8 * i) / 7, a1 = a0 + 1.8 / 7;
        const tip = a1 + 0.2;
        const low = 0.2 + ((i * 5) % 3) * 0.03 - (i / 7) * 0.05;
        b.tri(P(a0, 0.4, 1.08), P(a1, 0.4, 1.08), P(tip, low, 1.07), i % 3 === 2 ? T : H);
      }
    });
    const torso = mesh(r, b => {
      b.prism(12, d.waist * 0.95, d.depth * 0.95, 0, d.chest * 0.9, d.depth, d.torso * 0.8, L.shirt, { capTop: false });
      b.at(0, d.torso * 0.8, 0, h => h.prism(12, d.chest * 0.9, d.depth, 0, 0.062, 0.058, d.torso * 0.2, L.shirt));
      const liningEdge = (left, right) => ({ cuts: [-left, right], color: ang => ((ang < 0 ? -ang < left : ang < right) ? L.lining : L.shell) });
      const low = liningEdge(0.4, 0.8), mid = liningEdge(0.42, 0.74), high = liningEdge(0.5, 0.68);
      const allCuts = low.cuts.concat(mid.cuts, high.cuts);
      const openL = 0.2, openR = 0.17;
      const R0 = [d.waist * 1.28, d.depth * 1.38], R1 = [d.chest * 1.22, d.depth * 1.42], R2 = [d.chest * 1.24, d.depth * 1.4], R3 = [d.chest * 1.05, d.depth * 1.26], R4 = [d.chest * 0.62, d.depth * 1.0];
      [[-PI + 0.001, -openL], [openR, PI - 0.001]].forEach(([a0, a1]) => {
        jacketBand(b, a0, a1, -0.03, d.torso * 0.45, R0, R1, low.color, 10, allCuts);
        jacketBand(b, a0, a1, d.torso * 0.45, d.torso * 0.74, R1, R2, low.color, 10, allCuts);
        jacketBand(b, a0, a1, d.torso * 0.74, d.torso * 0.84, R2, R3, mid.color, 10, allCuts);
        jacketBand(b, a0, a1, d.torso * 0.84, d.torso * 0.96, R3, R4, high.color, 10, allCuts);
      });
      const F = L.fleece;
      const T0 = d.torso;
      const neckSide = [[0.105, T0 * 1.02, 0.035], [0.09, T0 * 1.05, -0.045], [0.045, T0 * 1.06, -0.09]];
      const sideL = [[0.09, T0 * 0.3, 0.182], [0.092, T0 * 0.55, 0.182], [0.088, T0 * 0.75, 0.174], [0.07, T0 * 0.85, 0.162], [0.055, T0 * 0.93, 0.138]].concat(neckSide);
      const sideR = [[0.04, T0 * 0.3, 0.19], [0.042, T0 * 0.55, 0.191], [0.04, T0 * 0.78, 0.181], [0.05, T0 * 0.9, 0.158]].concat(neckSide);
      const raw = sideL.map(([x, y, z]) => [-x, y, z]).concat([[0, T0 * 1.06, -0.1]]).concat(sideR.slice().reverse());
      const path = [];
      for (let i = 0; i < raw.length - 1; i++) {
        const p0 = raw[Math.max(0, i - 1)], p1 = raw[i], p2 = raw[i + 1], p3 = raw[Math.min(raw.length - 1, i + 2)];
        for (let k = 0; k < 3; k++) {
          const t = k / 3, t2 = t * t, t3 = t2 * t;
          path.push([0, 1, 2].map(c => 0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
        }
      }
      path.push(raw[raw.length - 1]);
      const width = path.map(q => (q[0] < 0 ? 0.05 + clamp((q[1] - T0 * 0.6) / (T0 * 0.3), 0, 1) * 0.035 : 0.017 + clamp((q[1] - T0 * 0.88) / (T0 * 0.12), 0, 1) * 0.045));
      const base = [0.35, 0.37, 0.41, 0];
      const lit = [0.4, 0.42, 0.46, 0];
      const fold = [0.29, 0.3, 0.34, 0];
      const nUp = V3.norm([0, 0.55, 0.85]);
      const nn = [nUp, nUp, nUp, nUp];
      const outer = path.map((q, i) => {
        const radial = V3.norm([q[0], 0, q[2] * 0.7]);
        const a = Math.atan2(q[0], q[2] / 0.7);
        const along = V3.mul(V3.norm([C(a), 0, -S(a) * 0.7]), Math.sign(q[0]));
        const k = clamp((q[1] - T0 * 0.92) / (T0 * 0.1), 0, 1);
        const o = V3.norm(V3.add(V3.mul(along, 1 - k), V3.mul(radial, k)));
        return [q[0] + o[0] * width[i], q[1] - 0.012, q[2] + o[2] * width[i]];
      });
      const under = path.map(q => {
        const o = V3.norm([q[0], 0, q[2] * 0.7]);
        return [q[0] - o[0] * 0.012, q[1] - 0.03, q[2] - o[2] * 0.012];
      });
      for (let i = 0; i < path.length - 1; i++) {
        b.quad(path[i], path[i + 1], outer[i + 1], outer[i], [lit, lit, base, base], null, nn);
        b.quad(under[i], under[i + 1], path[i + 1], path[i], [fold, fold, lit, lit], null, nn);
      }
      const standK = path.map(q => clamp((q[1] - T0 * 0.96) / (T0 * 0.08), 0, 1));
      const stand = path.map((q, i) => [q[0] * (1 - 0.3 * standK[i]), q[1] + 0.07 * standK[i], q[2] * (1 - 0.3 * standK[i]) + 0.01 * standK[i]]);
      const neckTone = [0.3, 0.33, 0.39, 0];
      const nFront = [nUp, nUp, nUp, nUp];
      for (let i = 0; i < path.length - 1; i++) {
        if (standK[i] + standK[i + 1] <= 0) continue;
        b.quad(path[i], path[i + 1], stand[i + 1], stand[i], [neckTone, neckTone, neckTone, neckTone], null, nFront);
      }
      b.at(0, d.torso * 0.98, 0, h => h.prism(8, 0.047, 0.045, 0, 0.045, 0.043, 0.07, shade(L.skin, 0.66)));
    });
    const upper = mesh(r, b => b.prism(10, 0.068, 0.072, -d.upper, 0.06, 0.062, -0.05, L.shell, { capBottom: true, capTop: false }));
    const fore = mesh(r, b => b.prism(10, 0.058, 0.06, -d.fore, 0.07, 0.072, 0.01, L.shell, { capBottom: true }));
    const sleeve = mesh(r, b => b.prism(10, 0.064, 0.064, 0, 0.055, 0.055, 1, L.shell, { capTop: true, capBottom: false }));
    const cuff = mesh(r, b => b.prism(10, 0.058, 0.058, -0.02, 0.058, 0.058, 0, shade(L.shell, 0.8), { capTop: false }));
    return { faces, head, face, hair, torso, upper, fore, sleeve, cuff, hands: buildHands(r) };
  }

  function drawJawed(r, J, st) {
    const m = st.m;
    r.draw(J.torso, m.torso);
    ['L', 'R'].forEach(s => {
      if (s === 'R' && st.arm) return;
      r.draw(J.upper, m['upper' + s]);
      r.draw(J.fore, m['fore' + s]);
    });
    if (st.arm) {
      const a = st.arm;
      const dir = V3.sub(a.wrist, a.elbow);
      const len = V3.len(dir);
      const n = V3.norm(dir);
      let x = V3.cross([0, 0, 1], n);
      if (V3.len(x) < 1e-4) x = [1, 0, 0];
      x = V3.norm(x);
      const z = V3.cross(x, n);
      const basis = new Float32Array([x[0], x[1], x[2], 0, n[0], n[1], n[2], 0, z[0], z[1], z[2], 0, a.elbow[0], a.elbow[1], a.elbow[2], 1]);
      r.draw(J.sleeve, M4.mul(basis, M4.scale(1, len - 0.03, 1)));
      const face = V3.norm(V3.sub(EYE, a.wrist));
      let right = V3.norm(V3.cross([0, 1, 0], face));
      const up = V3.cross(face, right);
      const hb = new Float32Array([right[0], right[1], right[2], 0, up[0], up[1], up[2], 0, face[0], face[1], face[2], 0, a.wrist[0], a.wrist[1], a.wrist[2], 1]);
      const handM = a.kind === 'flat' ? M4.mul(hb, M4.translate(0.02, 0.0, 0)) : M4.mul(hb, M4.translate(0.0, 0.03, 0));
      r.draw(J.hands[a.kind], M4.mul(handM, M4.scale(0.86)));
    }
    const hm = M4.mul(m.head, M4.translate(0, -HEAD_DROP, 0));
    r.draw(J.head, hm);
    r.draw(J.hair, hm);
    r.draw(J.face, hm, { texture: J.faces[st.mouth + (st.blink ? '-b' : '')] });
  }

  function texStraw(ctx, w, h) {
    const g = rand(41);
    ctx.fillStyle = '#b3b4ad';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) {
      const x = g() * w, y = g() * h, a = g() * PI;
      ctx.strokeStyle = g() < 0.5 ? '#cac8b8' : g() < 0.5 ? '#9e9e92' : '#c0bda8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + C(a) * 9, y + S(a) * 3);
      ctx.stroke();
    }
  }

  function texRock(ctx, w, h) {
    const g = rand(77);
    ctx.fillStyle = '#8c8b88';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = g() < 0.5 ? 'rgba(70,70,70,0.25)' : 'rgba(170,168,160,0.25)';
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 6 + g() * 18, 3 + g() * 7, 0, 0, PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(50,50,52,0.5)';
    for (let i = 0; i < 8; i++) {
      ctx.lineWidth = 1 + g() * 1.5;
      ctx.beginPath();
      let x = g() * w, y = g() * h;
      ctx.moveTo(x, y);
      for (let k = 0; k < 3; k++) {
        x += 10 + g() * 30;
        y += (g() - 0.5) * 8;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  function texFoliage(ctx, w, h) {
    const g = rand(55);
    ctx.fillStyle = '#3e4f49';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = ['#4a5e54', '#34443d', '#566a5a', '#2c3a33'][Math.floor(g() * 4)];
      ctx.beginPath();
      ctx.arc(g() * w, g() * h, 1.5 + g() * 3, 0, PI * 2);
      ctx.fill();
    }
  }

  const FLOOR = 0.42;

  function buildTusks(b) {
    tube(b, [[0.22, 1.84, 1.7], [0.25, 1.64, 1.92], [0.24, 1.47, 2.12], [0.2, 1.38, 2.3]], [0.06, 0.045, 0.03, 0.01], 6, [0.95, 0.93, 0.87, 0.2]);
  }

  function buildAnkle(b) {
    b.at(0.44, 0.18, 0.74, h => h.prism(10, 0.275, 0.275, 0, 0.275, 0.275, 0.07, [0.78, 0.76, 0.7, 0.05], { capTop: false }));
  }

  function buildElephant(b, tusk) {
    const grey = [1, 1, 1, 0];
    const ear = [0.9, 0.87, 0.89, 0];
    b.at(0, 1.78, 0, h => h.ellipsoid(0.82, 0.8, 1.3, 12, 8, grey));
    b.at(0, 2.14, -0.4, h => h.ellipsoid(0.66, 0.6, 0.72, 10, 6, grey));
    [[-0.44, 0.74], [0.44, 0.74], [-0.44, -0.8], [0.44, -0.8]].forEach(([x, z]) => b.at(x, 0, z, h => h.prism(10, 0.26, 0.26, 0, 0.3, 0.3, 1.5, grey, { capBottom: true })));
    b.at(0, 2.15, 1.5, h => h.ellipsoid(0.52, 0.68, 0.72, 10, 7, [1.1, 1.08, 1.1, 0]));
    b.at(0, 2.62, 1.22, h => h.ellipsoid(0.4, 0.24, 0.36, 8, 4, grey));
    [-1, 1].forEach(s => {
      b.push(M4.translate(s * 0.5, 2.5, 1.2), M4.rotY(-s * 0.35));
      const cy = -0.38, cz = -0.26;
      const nrm = V3.norm([s * 0.5, 0.6, 0.6]);
      const pts = [];
      for (let i = 0; i <= 14; i++) {
        const a = (i / 14) * PI * 2;
        pts.push([s * 0.02, cy + C(a) * 0.44, cz + S(a) * 0.36]);
      }
      for (let i = 0; i < pts.length - 1; i++) b.tri([s * 0.03, cy, cz], pts[i], pts[i + 1], ear, null, [nrm, nrm, nrm]);
      b.pop();
    });
    b.at(0, 1.9, -1.28, h => { h.push(M4.rotX(-2.8)); h.prism(5, 0.03, 0.03, 0, 0.02, 0.02, 0.7, grey); h.pop(); });
    [-1, 1].forEach(s => b.at(s * 0.36, 2.38, 1.66, h => h.ellipsoid(0.05, 0.035, 0.03, 5, 3, [0.05, 0.04, 0.04, 0])));
  }

  function trunkSegments(r) {
    const segs = [];
    for (let i = 0; i < 9; i++) {
      segs.push(mesh(r, b => tube(b, [[0, 0, 0], [0, -0.21, 0]], [0.22 - i * 0.018, 0.205 - i * 0.018], 8, [1.32, 1.29, 1.29, 0])));
    }
    return segs;
  }

  function steelMesh(b) {
    const bar = [0.42, 0.45, 0.53, 0.02];
    const rail = [0.4, 0.43, 0.5, 0.02];
    const a = [-1.56, -3.8], c = [1.63, -6.6];
    const along = (k) => [a[0] + (c[0] - a[0]) * k, a[1] + (c[1] - a[1]) * k];
    const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
    const ang = Math.atan2(c[0] - a[0], c[1] - a[1]);
    const n = 13;
    for (let i = 0; i <= n; i++) {
      const p = along(i / n);
      b.push(M4.translate(p[0], FLOOR, p[1]), M4.rotY(ang));
      b.box(0.075, 2.75, 0.075, bar, { base: true });
      b.pop();
    }
    [0.2, 1.05, 1.95, 2.72].forEach(y => {
      b.push(M4.translate(a[0], FLOOR + y, a[1]), M4.rotY(ang), M4.rotX(PI / 2));
      b.prism(6, 0.05, 0.05, 0, 0.05, 0.05, len, rail, { capBottom: true });
      b.pop();
    });
    const q = [along(0), along(1)];
    const back = 2.6;
    const wall = [0.44, 0.45, 0.47, 0];
    b.quad([q[0][0] - 0.2, FLOOR, q[0][1] - back], [q[1][0] + 0.8, FLOOR, q[1][1] - back], [q[1][0] + 0.8, FLOOR + 1.9, q[1][1] - back], [q[0][0] - 0.2, FLOOR + 1.9, q[0][1] - back], wall);
    b.quad([q[0][0], FLOOR, q[0][1] - 0.3], [q[0][0] - 0.2, FLOOR, q[0][1] - back], [q[0][0] - 0.2, FLOOR + 1.9, q[0][1] - back], [q[0][0], FLOOR + 1.9, q[0][1] - 0.3], [0.4, 0.41, 0.43, 0]);
    const post = [0.44, 0.47, 0.54, 0.05];
    [[-1.07, -2.9], [1.7, -2.95]].forEach(([x, z]) => {
      b.at(x, FLOOR, z, h => h.prism(10, 0.07, 0.07, 0, 0.07, 0.07, 1.72, post, { capTop: false }));
      b.at(x, FLOOR + 1.72, z, h => h.ellipsoid(0.08, 0.05, 0.08, 8, 4, post));
    });
    [1.02, 1.29, 1.6, 1.92].forEach(y => {
      b.at(0.9, y - 0.02, -2.92, h => { h.push(M4.rotZ(PI / 2)); h.prism(5, 0.009, 0.009, -2.0, 0.009, 0.009, 4.2, 0x8a8e94); h.pop(); });
    });
    for (let i = 0; i < 16; i++) b.at(0.6 + i * 0.075, 1.9 + (i % 2) * 0.006, -2.92, h => h.ellipsoid(0.03, 0.014, 0.014, 6, 3, [0.6, 0.6, 0.62, 0]));
    b.push(M4.translate(-0.42, 3.38, -5.0), M4.rotX(0.06));
    b.box(1.95, 0.08, 1.4, [0.86, 0.84, 0.8, 0]);
    b.pop();
    b.at(-0.42, 3.3, -4.3, h => h.box(1.95, 0.14, 0.05, [0.78, 0.75, 0.7, 0]));
    b.at(0.33, FLOOR, -5.2, h => h.box(0.08, 2.9, 0.08, [0.6, 0.6, 0.62, 0], { base: true }));
  }

  function buildSet(r) {
    const set = {};
    set.ground = mesh(r, b => {
      for (let x = -14; x < 14; x += 3) for (let z = -24; z < -1; z += 3) b.quad([x, FLOOR, z + 3], [x + 3, FLOOR, z + 3], [x + 3, FLOOR, z], [x, FLOOR, z], [0.8, 0.8, 0.78, 0], [[0, 0], [1.5, 0], [1.5, 1.5], [0, 1.5]]);
    });
    set.wall = mesh(r, b => {
      b.at(0, 0, -1.2, h => h.box(12, 0.84, 0.36, [0.6, 0.61, 0.64, 0], { base: true, faces: { top: [0.6, 0.6, 0.61, 0] } }));
      const gg = rand(21);
      const tuft = (x0, x1) => {
        for (let x = x0; x < x1; x += 0.06) {
          const hgt = 0.025 + gg() * gg() * 0.1;
          const nrm = [0, 0.3, 1];
          b.quad([x, 0.84, -1.42], [x + 0.07, 0.84, -1.42], [x + 0.05 + gg() * 0.02, 0.84 + hgt, -1.43], [x + gg() * 0.02, 0.84 + hgt * 0.8, -1.43], [0.36, 0.44, 0.3, 0], null, [nrm, nrm, nrm, nrm]);
        }
      };
      tuft(-1.1, -0.25);
      tuft(0.45, 1.2);
      tuft(-3, -1.6);
      tuft(1.6, 3);
    });
    set.rock = mesh(r, b => {
      const g = rand(5);
      const cols = 7, rows = 12;
      const x0 = -4.2, x1 = -1.18, zf = -3.0;
      const grid = [];
      for (let j = 0; j <= rows; j++) {
        const row = [];
        const y = FLOOR - 0.4 + j * 0.52;
        const ledge = j % 3 === 0 ? 0.22 : j % 3 === 1 ? 0.05 : 0.12;
        for (let i = 0; i <= cols; i++) {
          const x = i === cols ? x1 + (g() - 0.5) * 0.08 : x0 + ((x1 - x0) * i) / cols;
          row.push([x, y, zf + ledge + g() * 0.18 - (i === cols ? 0.15 : 0)]);
        }
        grid.push(row);
      }
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const a = grid[j][i], c = grid[j][i + 1], d = grid[j + 1][i + 1], e = grid[j + 1][i];
        const n = V3.norm(V3.cross(V3.sub(c, a), V3.sub(e, a)));
        const lit = clamp((0.72 + n[1] * 0.12 + clamp((rows - 1 - j) / 3, 0, 1) * 0.12 + ((rows - j) / rows) * 0.16) * (0.93 + clamp((3 - j) / 1.5, 0, 1) * 0.34), 0.66, 1.3);
        b.quad(a, c, d, e, [lit, lit, lit * 1.01, 0], [[i * 0.4, j * 0.35], [(i + 1) * 0.4, j * 0.35], [(i + 1) * 0.4, (j + 1) * 0.35], [i * 0.4, (j + 1) * 0.35]]);
      }
    });
    set.steel = mesh(r, steelMesh);
    set.hay = mesh(r, b => {
      const g = rand(12);
      const straw = [0.74, 0.74, 0.7, 0];
      [[-0.3, 2.45, -5.6, 0.6], [0.2, 2.62, -5.75, 0.7], [0.7, 2.5, -5.9, 0.6], [0.05, 2.85, -5.8, 0.5], [0.5, 2.8, -5.95, 0.45]].forEach(([x, y, z, rr]) => b.at(x, y, z, h => h.ellipsoid(rr, rr * 0.55, rr * 0.8, 8, 5, straw)));
      for (let i = 0; i < 30; i++) {
        b.push(M4.translate(-0.7 + g() * 1.8, 2.3 + g() * 0.1, -5.2 - g() * 0.3), M4.rotZ((g() - 0.5) * 0.6));
        b.box(0.012, -(0.2 + g() * 0.45), 0.012, [0.72, 0.71, 0.66, 0], { base: true });
        b.pop();
      }
      for (let i = 0; i < 40; i++) {
        const x = -3 + g() * 9, z = -3 - g() * 7;
        if (i % 2) b.at(x, FLOOR + 0.01, z, h => h.ellipsoid(0.3 + g() * 0.4, 0.03 + g() * 0.03, 0.25 + g() * 0.3, 6, 2, [0.62, 0.6, 0.52, 0]));
      }
    });
    set.backdrop = mesh(r, b => {
      b.at(1.3, FLOOR, -12, h => h.box(3.6, 4.55, 0.6, [0.5, 0.55, 0.6, 0], { base: true }));
      b.at(1.3, FLOOR + 4.55, -11.9, h => h.box(3.7, 0.1, 0.7, [0.64, 0.68, 0.72, 0]));
    });
    set.trees = mesh(r, b => {
      const g = rand(31);
      [[0.8, 2.6, 3], [3.2, 5.2, 6]].forEach(([x0, x1, n]) => {
        for (let i = 0; i < n; i++) {
          const x = x0 + g() * (x1 - x0), z = -16 - g() * 4;
          b.at(x, 5.0 + g() * 1.2, z, h => h.ellipsoid(0.8 + g() * 0.6, 0.8 + g() * 0.5, 0.8, 7, 5, [1, 1, 1, 0], { flat: true }));
        }
      });
    });
    set.elephant = mesh(r, b => buildElephant(b, false));
    set.elephantTusk = set.elephant;
    set.tusks = mesh(r, buildTusks);
    set.ankle = mesh(r, buildAnkle);
    set.trunk = trunkSegments(r);
    return set;
  }

  const ELEPHANTS = [
    { x: 0.3, z: -5.4, ry: -0.5, tusk: false, phase: 0.4, eat: 1, scale: 0.76, trunkX: -0.26 },
    { x: 2.9, z: -7.0, ry: -0.93, tusk: true, phase: 2.1, eat: 0 },
    { x: 4.3, z: -8.6, ry: -2.0, tusk: false, phase: 1.3, eat: 0 }
  ];

  function drawElephant(r, set, T, e, t) {
    const sway = S(t * 0.7 + e.phase) * 0.035;
    const base = M4.chain(M4.translate(e.x + sway * 0.4, FLOOR, e.z), M4.rotY(e.ry + sway), M4.scale(e.scale || 1));
    r.draw(set.elephant, base, { tint: [0.37, 0.34, 0.36] });
    if (e.tusk) r.draw(set.tusks, base);
    r.draw(set.ankle, base, { tint: [0.9, 0.88, 0.84] });
    let m = M4.chain(base, M4.translate(e.trunkX || 0, 2.0, 2.0), M4.rotX(e.eat ? 0.6 : 0.12));
    const curl = e.eat ? 0.14 + 0.12 * S(t * 1.4 + e.phase) : 0.03 + 0.04 * S(t * 1.1 + e.phase);
    set.trunk.forEach((seg, i) => {
      r.draw(seg, m, { tint: [0.37, 0.345, 0.365] });
      m = M4.chain(m, M4.translate(0, -0.2, 0), M4.rotX(-curl * (i > 5 ? 1.8 : 0.35)), M4.rotZ(0.04 * S(t * 0.9 + e.phase + i * 0.3)));
    });
  }

  const ENV = {
    sunDir: [0.3, -1, -0.5],
    sunColor: [0.32, 0.32, 0.31],
    ambTop: [0.97, 0.97, 0.96],
    ambBottom: [0.62, 0.62, 0.61],
    fogColor: [0.84, 0.85, 0.87],
    fogNear: 12,
    fogFar: 38
  };

  function create(r) {
    const T = {
      straw: r.texture(128, texStraw),
      rock: r.texture(128, texRock),
      foliage: r.texture(64, texFoliage)
    };
    const J = makeJawed(r);
    const set = buildSet(r);
    return {
      warm() {},
      render(t) {
        const tt = clamp(t, 0, DURATION);
        const st = stage(tt);
        r.polys = 0;
        r.begin(ENV, st.camera);
        r.draw(set.ground, null, { texture: T.straw });
        r.draw(set.backdrop);
        r.draw(set.trees, null, { texture: T.foliage });
        r.draw(set.steel);
        r.draw(set.hay, null, { texture: T.straw });
        ELEPHANTS.forEach(e => drawElephant(r, set, T, e, tt));
        r.draw(set.rock, null, { texture: T.rock });
        r.draw(set.wall);
        drawJawed(r, J, st);
        return { polys: Math.round(r.polys) };
      }
    };
  }

  const video = {
    id: 'jNQXAC9IVRw',
    audio: 'content/YouVid/Me at the zoo.mp3',
    duration: DURATION,
    aspect: 4 / 3,
    look: LOOK,
    stage,
    voiceAt: VOICE,
    create,
    buildElephant
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
