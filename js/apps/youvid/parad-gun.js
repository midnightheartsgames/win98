(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, mesh } = K;

  function rectLoft(b, secs, col, tile) {
    const t = tile || 0.2;
    for (let i = 0; i < secs.length - 1; i++) {
      const [z0, t0, b0, w0] = secs[i], [z1, t1, b1, w1] = secs[i + 1];
      const P = (z, y, x) => [x, y, z];
      const uv = (a, c) => [a / t, c / t];
      b.quad(P(z0, t0, w0), P(z1, t1, w1), P(z1, b1, w1), P(z0, b0, w0), col, [uv(z0, t0), uv(z1, t1), uv(z1, b1), uv(z0, b0)]);
      b.quad(P(z1, t1, -w1), P(z0, t0, -w0), P(z0, b0, -w0), P(z1, b1, -w1), col, [uv(z1, t1), uv(z0, t0), uv(z0, b0), uv(z1, b1)]);
      b.quad(P(z0, t0, -w0), P(z1, t1, -w1), P(z1, t1, w1), P(z0, t0, w0), col, [uv(z0, -w0), uv(z1, -w1), uv(z1, w1), uv(z0, w0)]);
      b.quad(P(z0, b0, w0), P(z1, b1, w1), P(z1, b1, -w1), P(z0, b0, -w0), col, [uv(z0, w0), uv(z1, w1), uv(z1, -w1), uv(z0, -w0)]);
    }
    const [za, ta, ba, wa] = secs[0];
    b.quad([-wa, ba, za], [wa, ba, za], [wa, ta, za], [-wa, ta, za], col);
    const [zb, tb, bb, wb] = secs[secs.length - 1];
    b.quad([wb, bb, zb], [-wb, bb, zb], [-wb, tb, zb], [wb, tb, zb], col);
  }

  function zCyl(b, r, z0, z1, y, col, sides, uvRep) {
    const n = sides || 12;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      const p = (a, z) => [S(a) * r, y + C(a) * r, z];
      const nn = (a) => [S(a), C(a), 0];
      const u = uvRep || 1;
      b.quad(p(a0, z0), p(a1, z0), p(a1, z1), p(a0, z1), col, [[0, i / n * u], [0, (i + 1) / n * u], [1, (i + 1) / n * u], [1, i / n * u]], [nn(a0), nn(a1), nn(a1), nn(a0)]);
    }
  }

  function build(r) {
    const G = {};
    G.wood = mesh(r, b => {
      rectLoft(b, [
        [-0.44, -0.005, -0.15, 0.024], [-0.3, 0.0, -0.13, 0.024], [-0.16, -0.015, -0.085, 0.021], [-0.08, -0.02, -0.075, 0.02],
        [-0.04, -0.005, -0.06, 0.021], [0.06, 0.0, -0.05, 0.022], [0.15, 0.004, -0.04, 0.021]
      ], [1, 1, 1], 0.25);
    });
    G.metal = mesh(r, b => {
      b.push(M4.translate(0, 0.0, 0.05));
      b.box(0.042, 0.05, 0.2, [1, 1, 1], { base: true });
      b.pop();
      b.push(M4.translate(0, 0.05, -0.03));
      b.box(0.03, 0.022, 0.04, [0.8, 0.8, 0.8], { base: true });
      b.pop();
      b.push(M4.translate(0.03, 0.025, 0.07));
      b.box(0.03, 0.012, 0.016, [0.7, 0.7, 0.7]);
      b.pop();
      b.push(M4.translate(0, -0.045, 0.1), M4.rotX(-0.18));
      b.push(M4.translate(0, -0.08, 0));
      b.box(0.022, 0.17, 0.048, [0.75, 0.75, 0.75]);
      b.pop();
      b.pop();
      b.push(M4.translate(0, -0.06, -0.025));
      b.box(0.012, 0.012, 0.07, [0.6, 0.6, 0.6]);
      b.pop();
      b.push(M4.translate(0, 0.055, 0.405));
      b.box(0.008, 0.026, 0.01, [0.9, 0.9, 0.9], { base: true });
      b.pop();
      b.push(M4.translate(0, 0.025, 0.405));
      b.box(0.054, 0.054, 0.025, [0.7, 0.7, 0.7]);
      b.pop();
    });
    G.shroud = mesh(r, b => zCyl(b, 0.025, 0.14, 0.4, 0.025, [1, 1, 1], 12, 2));
    G.mag = mesh(r, b => { b.push(M4.translate(0, -0.08, 0)); b.box(0.022, 0.17, 0.048, [0.75, 0.75, 0.75]); b.pop(); });
    G.palm = mesh(r, b => { b.push(M4.translate(0, 0, -0.012)); b.box(0.085, 0.032, 0.076, [1, 1, 1]); b.pop(); });
    G.knuckles = mesh(r, b => { b.push(M4.translate(0, 0.002, 0.036)); b.box(0.084, 0.03, 0.03, 0xc8987c); b.pop(); });
    G.finger = mesh(r, b => {
      b.prism(6, 0.0095, 0.0095, -0.018, 0.01, 0.01, 0, [1, 1, 1], { capTop: true });
      b.push(M4.translate(0, -0.018, 0));
      b.prism(6, 0.0088, 0.0088, -0.05, 0.0094, 0.0094, 0, 0xc8987c, { capTop: false, capBottom: true });
      b.pop();
    });
    G.thumb = mesh(r, b => {
      b.prism(6, 0.011, 0.011, -0.04, 0.012, 0.012, 0, [1, 1, 1], { capTop: true });
      b.push(M4.translate(0, -0.04, 0));
      b.prism(6, 0.01, 0.01, -0.028, 0.011, 0.011, 0, 0xc49478, { capTop: false, capBottom: true });
      b.pop();
    });
    G.fore = mesh(r, b => {
      b.prism(9, 0.034, 0.03, -0.34, 0.048, 0.044, 0, [1, 1, 1], { capTop: true, capBottom: true });
    });
    G.cuff = mesh(r, b => b.prism(9, 0.036, 0.032, -0.06, 0.038, 0.034, 0.0, [1, 1, 1], { capTop: false }));
    G.wrist = mesh(r, b => b.prism(8, 0.028, 0.025, -0.03, 0.03, 0.027, 0.0, 0xb88a70));
    G.flash = mesh(r, b => {
      b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      b.quad([0, -0.3, -0.1], [0, -0.3, 0.9], [0, 0.3, 0.9], [0, 0.3, -0.1], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      b.quad([-0.3, 0, -0.1], [-0.3, 0, 0.9], [0.3, 0, 0.9], [0.3, 0, -0.1], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    });
    G.fistSkin = mesh(r, b => {
      b.push(M4.translate(-0.012, 0, 0.012));
      b.ellipsoid(0.047, 0.034, 0.05, 10, 7, 0xc08a6e);
      b.pop();
      b.push(M4.translate(-0.03, 0.022, 0.03), M4.rotY(0.5));
      b.ellipsoid(0.034, 0.016, 0.017, 8, 5, 0xc89478);
      b.pop();
      for (let i = 0; i < 3; i++) {
        b.push(M4.translate(-0.042, -0.012 - i * 0.016, 0.03 - i * 0.004));
        b.ellipsoid(0.014, 0.0085, 0.02, 6, 4, 0xb88468);
        b.pop();
      }
    });
    G.fistGlove = mesh(r, b => {
      b.push(M4.translate(0.034, 0.004, -0.01));
      b.ellipsoid(0.036, 0.03, 0.044, 10, 7, [1, 1, 1]);
      b.pop();
    });
    G.bolt = mesh(r, b => {
      b.prism(6, 0.006, 0.006, -0.012, 0.006, 0.006, 0.016, 0x8e8e88, { capTop: true, capBottom: true });
      b.push(M4.translate(0, 0.016, 0));
      b.prism(6, 0.011, 0.011, 0, 0.011, 0.011, 0.008, 0xa2a29a, { capTop: true, capBottom: true });
      b.pop();
    });
    return G;
  }

  const SKIN = { tint: [0.8, 0.6, 0.48] };

  function hand(r, T, G, M, curl, side) {
    const s = side === 'L' ? -1 : 1;
    r.draw(G.palm, M, { texture: T.glove });
    r.draw(G.knuckles, M);
    for (let i = 0; i < 4; i++) {
      const x = (-0.03 + i * 0.02) * s;
      const F = M4.chain(M, M4.translate(x, 0, 0.05), M4.rotX(-PI / 2 + curl * 1.3));
      r.draw(G.finger, F, SKIN);
    }
    const Th = M4.chain(M, M4.translate(0.045 * s, -0.005, 0.0), M4.rotY(0.6 * s), M4.rotX(-PI / 2 + curl * 0.7), M4.rotZ(-0.4 * s));
    r.draw(G.thumb, Th, SKIN);
  }

  function armTo(r, T, G, wrist, elbow, cuff) {
    const len = V3.len(V3.sub(wrist, elbow));
    const M = M4.chain(window.YouVidRig.boneM(elbow, wrist, [0, 0, 1]), M4.scale(1, len / 0.34, 1));
    r.draw(G.fore, M, { texture: T.sleeve });
    if (!cuff) return;
    const Mc = M4.chain(window.YouVidRig.boneM(wrist, elbow, [0, 0, 1]), M4.rotX(PI), M4.translate(0, 0.015, 0));
    r.draw(G.cuff, Mc, { texture: T.glove });
  }

  function arm(r, T, G, M) {
    r.draw(G.cuff, M4.chain(M, M4.translate(0, 0, -0.03), M4.rotX(PI / 2)), { texture: T.glove });
    r.draw(G.fore, M4.chain(M, M4.translate(0, 0, -0.08), M4.rotX(PI / 2)), { texture: T.sleeve });
  }

  function gunPose(st) {
    const base = { pos: [0.07, -0.112, -0.24], rot: [0.1, 0.08, 0.03] };
    let p = base.pos.slice(), q = base.rot.slice();
    const w = st.walk || 0;
    p[0] += S(st.t * 4.7) * 0.008 * w;
    p[1] += Math.abs(S(st.t * 4.7)) * 0.01 * w - 0.004 * w;
    const sw = K.wobble(st.t * 0.6, 1, 3);
    p[0] += sw[0] * 0.004;
    p[1] += sw[1] * 0.004;
    if (st.kick) {
      p[2] += 0.022 * st.kick;
      q[0] += 0.05 * st.kick;
      p[1] += 0.006 * st.kick;
    }
    if (st.reload !== undefined) {
      const k = st.reload;
      const up = ease(clamp(k / 0.18, 0, 1)) * (1 - ease(clamp((k - 0.86) / 0.14, 0, 1)));
      p = [lerp(p[0], 0.05, up), lerp(p[1], -0.06, up), lerp(p[2], -0.3, up)];
      q = [lerp(q[0], 0.95, up), lerp(q[1], -0.15, up), lerp(q[2], -0.55, up)];
      const jig = S(k * 40) * 0.01 * up * (k > 0.55 && k < 0.8 ? 1 : 0);
      q[0] += jig;
    }
    if (st.lower) {
      const k = st.lower;
      p = [lerp(p[0], -0.04, k), lerp(p[1], -0.26, k), lerp(p[2], -0.24, k)];
      q = [lerp(q[0], -0.25, k), lerp(q[1], 0.9, k), lerp(q[2], 0.5, k)];
    }
    if (st.draw !== undefined) {
      const k = ease(st.draw);
      p[1] -= (1 - k) * 0.3;
      q[0] -= (1 - k) * 0.6;
    }
    if (st.aim) {
      q[1] += st.aim[0];
      q[0] += st.aim[1];
    }
    return M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(PI + q[1]), M4.rotX(-q[0]), M4.rotZ(q[2]));
  }

  function drawGun(r, T, G, st) {
    const Mg = gunPose(st);
    r.draw(G.wood, Mg, { texture: T.wood });
    r.draw(G.metal, Mg, { texture: T.gunMetal });
    r.draw(G.shroud, Mg, { texture: T.shroud });
    const Rh = M4.chain(Mg, M4.translate(0.004, -0.06, -0.1), M4.rotZ(-0.3), M4.rotX(0.2));
    hand(r, T, G, M4.chain(Rh, M4.rotZ(PI / 2), M4.translate(0, 0, 0)), 0.75, 'R');
    arm(r, T, G, M4.chain(Rh, M4.rotY(-0.35), M4.rotX(-0.55), M4.translate(0, 0, -0.02)));
    let Lh;
    if (st.reload !== undefined && st.reload > 0.2 && st.reload < 0.86) {
      const k = st.reload;
      const away = k < 0.42 ? ease((k - 0.2) / 0.22) : k < 0.62 ? 1 - ease((k - 0.42) / 0.2) * 0.85 : 0.15 * (1 - ease((k - 0.62) / 0.24));
      Lh = M4.chain(Mg, M4.translate(-0.02 - away * 0.05, -0.12 - away * 0.2, 0.09 - away * 0.08), M4.rotZ(-1.4), M4.rotX(0.4));
      if (k > 0.42) r.draw(G.mag, M4.chain(Lh, M4.translate(0.035, 0.06, 0.02), M4.rotZ(1.4)), { texture: T.gunMetal });
    } else {
      Lh = M4.chain(Mg, M4.translate(-0.012, -0.065, 0.11), M4.rotZ(-1.25), M4.rotX(0.1));
    }
    hand(r, T, G, Lh, 0.8, 'L');
    arm(r, T, G, M4.chain(Lh, M4.rotZ(1.25), M4.rotY(0.6), M4.rotX(-0.45), M4.translate(0, -0.01, -0.02)));
    return Mg;
  }

  function muzzle(Mg) {
    return M4.point(Mg, [0, 0.025, 0.43]);
  }

  function drawFlash(r, T, G, Mg, k, seed) {
    const p = muzzle(Mg);
    const s = 0.07 + 0.05 * k;
    const M = M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(PI + 0.09), M4.rotZ(seed * 2.1), M4.scale(s, s, s * 1.6));
    r.draw(G.flash, M, { texture: T.flash, additive: true, alpha: 0.95 * k, noFog: true });
  }

  function drawBolt(r, T, G, st) {
    const w = st.walk || 0;
    let p = [0.0, -0.148, -0.3];
    let q = [0.25, 0.25, 0.1];
    p[0] += S(st.t * 4.7) * 0.01 * w;
    p[1] += Math.abs(S(st.t * 4.7)) * 0.012 * w;
    const sw = K.wobble(st.t * 0.6, 1, 5);
    p[0] += sw[0] * 0.004;
    p[1] += sw[1] * 0.004;
    if (st.throwK !== undefined) {
      const k = st.throwK;
      const a = k < 0.45 ? ease(k / 0.45) : 1 - ease((k - 0.45) / 0.55);
      const fw = k > 0.35 && k < 0.7 ? S((k - 0.35) / 0.35 * PI) : 0;
      p = [p[0] + 0.07 * a, p[1] + 0.09 * a, p[2] + 0.05 * a - 0.08 * fw];
      q = [q[0] - 0.6 * a, q[1] + 0.2 * a, q[2] - 0.5 * a];
    }
    const M = M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(PI + q[1]), M4.rotX(-q[0]), M4.rotZ(q[2]));
    const open = st.throwK !== undefined && st.throwK > 0.4 && st.throwK < 0.75;
    let wrist;
    if (open) {
      const Hm = M4.chain(window.YouVidRig.basisM([p[0] + 0.02, p[1] - 0.01, p[2]], [0, 1, 0], [0, 0, -1], [-1, 0, 0]), M4.rotX(0.25), M4.rotY(-0.35));
      hand(r, T, G, Hm, 0.12, 'R');
      wrist = M4.point(Hm, [0.0, 0.0, -0.05]);
    } else {
      const F = M4.chain(M, M4.rotY(PI - 0.3), M4.rotZ(0.3), M4.scale(0.82, 0.82, 0.82));
      r.draw(G.fistSkin, F);
      r.draw(G.fistGlove, F, { texture: T.glove });
      r.draw(G.bolt, M4.chain(F, M4.translate(-0.045, 0.034, 0.035), M4.rotZ(0.5)));
      wrist = M4.point(F, [0.075, -0.02, -0.035]);
    }
    armTo(r, T, G, wrist, [wrist[0] + 0.11, wrist[1] - 0.2, wrist[2] + 0.02], open);
  }

  function draw(r, T, G, st) {
    if (st.mode === 'gun') {
      const Mg = drawGun(r, T, G, st);
      return Mg;
    }
    if (st.mode === 'bolt') drawBolt(r, T, G, st);
    return null;
  }

  window.ParadGun = { build, draw, drawFlash, muzzle, gunPose };
})();
