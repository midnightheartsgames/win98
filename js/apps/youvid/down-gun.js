(function () {
  const { M4 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, mesh } = K;

  function zCyl(b, r, z0, z1, y, x, sides, col) {
    b.push(M4.translate(x || 0, y || 0, 0), M4.rotX(-PI / 2));
    b.prism(sides || 12, r, r, z0, r, r, z1, col || [1, 1, 1], { capTop: true, capBottom: true });
    b.pop();
  }

  function build(r) {
    const G = {};
    G.pistol = mesh(r, b => {
      b.push(M4.translate(0, 0.028, -0.07));
      b.box(0.034, 0.036, 0.2, [1, 1, 1]);
      b.pop();
      b.push(M4.translate(0, 0.0, -0.05));
      b.box(0.03, 0.022, 0.15, [0.8, 0.8, 0.8]);
      b.pop();
      b.push(M4.translate(0, -0.06, 0.012), M4.rotX(0.28));
      b.box(0.03, 0.1, 0.045, [0.55, 0.55, 0.55]);
      b.pop();
      b.push(M4.translate(0, -0.022, -0.035));
      b.box(0.012, 0.03, 0.04, [0.5, 0.5, 0.5]);
      b.pop();
      b.push(M4.translate(0, 0.05, -0.165));
      b.box(0.006, 0.01, 0.01, [0.6, 0.6, 0.6]);
      b.pop();
    });
    G.rifle = mesh(r, b => {
      b.push(M4.translate(0, 0, -0.12));
      b.box(0.04, 0.06, 0.34, [1, 1, 1]);
      b.pop();
      zCyl(b, 0.012, 0.29, 0.75, 0.012, 0, 8, [0.8, 0.8, 0.8]);
      b.push(M4.translate(0, -0.06, -0.08), M4.rotX(-0.2));
      b.box(0.028, 0.1, 0.06, [0.8, 0.8, 0.8]);
      b.pop();
      b.push(M4.translate(0, -0.055, 0.07), M4.rotX(0.35));
      b.box(0.028, 0.09, 0.04, [0.7, 0.7, 0.7]);
      b.pop();
    });
    G.riflePiece = mesh(r, b => {
      b.push(M4.translate(0, 0.0, -0.4));
      b.box(0.046, 0.05, 0.22, [1, 1, 1]);
      b.pop();
      b.push(M4.translate(0, -0.01, 0.17));
      b.box(0.036, 0.07, 0.2, [1, 1, 1]);
      b.pop();
      b.push(M4.translate(0, -0.05, 0.3), M4.rotX(-0.35));
      b.box(0.034, 0.1, 0.12, [0.9, 0.9, 0.9]);
      b.pop();
    });
    G.scope = mesh(r, b => {
      zCyl(b, 0.024, -0.12, 0.13, 0.078, 0, 14, [1, 1, 1]);
      zCyl(b, 0.03, 0.13, 0.19, 0.078, 0, 14, [0.85, 0.85, 0.85]);
      zCyl(b, 0.04, -0.24, -0.14, 0.078, 0, 16, [0.4, 0.4, 0.4]);
      b.push(M4.translate(0, 0.045, 0.0));
      b.box(0.022, 0.032, 0.06, [0.7, 0.7, 0.7]);
      b.pop();
      b.push(M4.translate(0.03, 0.078, 0.02), M4.rotZ(PI / 2));
      b.prism(10, 0.016, 0.016, -0.014, 0.016, 0.016, 0.014, [0.7, 0.7, 0.7], { capTop: true, capBottom: true });
      b.pop();
      b.push(M4.translate(0, 0.108, 0.04));
      b.prism(10, 0.016, 0.016, 0, 0.016, 0.016, 0.02, [0.7, 0.7, 0.7], { capTop: true });
      b.pop();
    });
    G.scopeGlass = mesh(r, b => K.discXY(b, 0, 0.078, 0.242, 0.03, 16, [0.2, 0.26, 0.3, 0]));
    G.smg = mesh(r, b => {
      b.push(M4.translate(0, 0, -0.1));
      b.box(0.04, 0.05, 0.36, [1, 1, 1]);
      b.pop();
      zCyl(b, 0.018, 0.28, 0.48, 0.01, 0, 10, [0.9, 0.9, 0.9]);
      b.push(M4.translate(0, -0.08, -0.12), M4.rotX(-0.25));
      b.box(0.024, 0.13, 0.04, [0.8, 0.8, 0.8]);
      b.pop();
      b.push(M4.translate(0, -0.05, 0.03), M4.rotX(0.3));
      b.box(0.03, 0.09, 0.04, [0.7, 0.7, 0.7]);
      b.pop();
      b.push(M4.translate(0, 0.005, 0.2));
      b.box(0.032, 0.05, 0.16, [0.6, 0.6, 0.6]);
      b.pop();
      b.push(M4.translate(0, 0.045, -0.24));
      b.box(0.03, 0.03, 0.02, [0.8, 0.8, 0.8]);
      b.pop();
    });
    G.sleeve = mesh(r, b => b.prism(9, 0.042, 0.038, -0.34, 0.05, 0.046, 0, [1, 1, 1], { capTop: true, capBottom: true }));
    G.palm = mesh(r, b => { b.push(M4.translate(0, 0, -0.01)); b.box(0.085, 0.034, 0.08, [1, 1, 1]); b.pop(); });
    G.finger = mesh(r, b => {
      b.prism(6, 0.0095, 0.0095, -0.05, 0.0105, 0.0105, 0, 0xc89478, { capTop: true, capBottom: true });
    });
    G.fist = mesh(r, b => {
      b.push(M4.translate(-0.01, 0, 0.01));
      b.ellipsoid(0.048, 0.036, 0.052, 10, 7, 0xc08a6e);
      b.pop();
      for (let i = 0; i < 4; i++) {
        b.push(M4.translate(-0.044, 0.02 - i * 0.017, 0.03 - i * 0.004));
        b.ellipsoid(0.014, 0.009, 0.02, 6, 4, 0xb88468);
        b.pop();
      }
      b.push(M4.translate(-0.028, 0.03, 0.03), M4.rotY(0.5));
      b.ellipsoid(0.034, 0.016, 0.017, 8, 5, 0xc89478);
      b.pop();
    });
    G.fistGlove = mesh(r, b => { b.push(M4.translate(0.032, 0.004, -0.008)); b.ellipsoid(0.038, 0.032, 0.046, 10, 7, [1, 1, 1]); b.pop(); });
    G.bolt = mesh(r, b => {
      b.prism(6, 0.007, 0.007, -0.014, 0.007, 0.007, 0.018, 0xa8a8a0, { capTop: true, capBottom: true });
      b.push(M4.translate(0, 0.018, 0));
      b.prism(6, 0.013, 0.013, 0, 0.013, 0.013, 0.009, 0xc0c0b8, { capTop: true, capBottom: true });
      b.pop();
    });
    G.flash = mesh(r, b => {
      b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      b.quad([0, -0.3, -0.9], [0, -0.3, 0.1], [0, 0.3, 0.1], [0, 0.3, -0.9], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      b.quad([-0.3, 0, -0.9], [-0.3, 0, 0.1], [0.3, 0, 0.1], [0.3, 0, -0.9], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    });
    G.tracer = mesh(r, b => b.quad([-0.004, 0, 0], [0.004, 0, 0], [0.004, 0, -1], [-0.004, 0, -1], [1, 0.75, 0.3, 1]));
    return G;
  }

  const SKIN = { tint: [1, 1, 1] };

  function hand(r, T, G, M, curl, side, sleeveT, elbow) {
    const s = side === 'L' ? -1 : 1;
    r.draw(G.palm, M, { texture: T.glove });
    for (let i = 0; i < 4; i++) {
      const F = M4.chain(M, M4.translate((-0.03 + i * 0.02) * s, 0, -0.05), M4.rotX(PI / 2 - curl * 1.3));
      r.draw(G.finger, F, SKIN);
    }
    const Th = M4.chain(M, M4.translate(0.045 * s, -0.004, -0.01), M4.rotY(-0.6 * s), M4.rotX(PI / 2 - curl * 0.6));
    r.draw(G.finger, Th, SKIN);
    const wrist = M4.point(M, [0, 0, 0.035]);
    const e = elbow || (side === 'L' ? [wrist[0] - 0.16, wrist[1] - 0.24, wrist[2] + 0.2] : [wrist[0] + 0.12, wrist[1] - 0.24, wrist[2] + 0.2]);
    arm(r, T, G, wrist, e, sleeveT);
  }

  function arm(r, T, G, wrist, elbow, sleeveT) {
    const len = Math.hypot(wrist[0] - elbow[0], wrist[1] - elbow[1], wrist[2] - elbow[2]);
    r.draw(G.sleeve, M4.chain(window.YouVidRig.boneM(elbow, wrist, [0, 0, 1]), M4.scale(1, len / 0.34, 1)), { texture: T[sleeveT || 'sleeve'] });
  }

  function sway(st, amp) {
    const w = st.walk || 0;
    const wb = K.wobble(st.t * 0.6, 1, 3);
    return [S(st.t * 4.7) * 0.01 * w + wb[0] * 0.004 * (amp || 1), Math.abs(S(st.t * 4.7)) * 0.012 * w - 0.004 * w + wb[1] * 0.004 * (amp || 1)];
  }

  const HOLD = {
    pistol: { pos: [0.2, -0.1, -0.58], rot: [0.08, 0.16, 0.05] },
    pistolSilver: { pos: [0.2, -0.095, -0.58], rot: [0.1, 0.16, 0.06] },
    rifle: { pos: [0.23, -0.095, -0.57], rot: [0.02, 0.4, 0.0] },
    tan: { pos: [0.21, -0.12, -0.55], rot: [0.03, 0.36, 0.0] },
    smg: { pos: [0.2, -0.14, -0.5], rot: [0.04, 0.15, 0.0] }
  };

  function weaponM(st) {
    const h = HOLD[st.mode] || HOLD.pistol;
    let p = h.pos.slice(), q = h.rot.slice();
    const sw = sway(st);
    p[0] += sw[0];
    p[1] += sw[1];
    if (st.kick) { p[2] += 0.03 * st.kick; q[0] += 0.08 * st.kick; }
    if (st.reload !== undefined) {
      const k = st.reload;
      const up = ease(clamp(k / 0.2, 0, 1)) * (1 - ease(clamp((k - 0.8) / 0.2, 0, 1)));
      p = [lerp(p[0], 0.12, up), lerp(p[1], -0.2, up), p[2]];
      q = [lerp(q[0], 0.5, up), lerp(q[1], -0.2, up), lerp(q[2], -0.7, up)];
    }
    if (st.lower) {
      const k = st.lower;
      p = [lerp(p[0], 0.21, k), lerp(p[1], -0.21, k), lerp(p[2], -0.46, k)];
      q = [lerp(q[0], -0.4, k), lerp(q[1], 0.25, k), lerp(q[2], 0.1, k)];
    }
    if (st.sprint) {
      const k = st.sprint;
      p = [lerp(p[0], 0.06, k), lerp(p[1], -0.22, k), lerp(p[2], -0.42, k)];
      q = [lerp(q[0], -0.12, k), lerp(q[1], 1.15, k), lerp(q[2], 0.35, k)];
    }
    if (st.draw !== undefined) {
      const k = ease(st.draw);
      p[1] -= (1 - k) * 0.25;
      q[0] -= (1 - k) * 0.7;
      q[2] -= (1 - k) * 0.4;
    }
    if (st.inspect) {
      const k = st.inspect;
      p = [lerp(p[0], 0.1, k), lerp(p[1], -0.12, k), lerp(p[2], -0.42, k)];
      q = [lerp(q[0], 0.25, k), lerp(q[1], -0.5, k), lerp(q[2], -0.6, k)];
    }
    if (st.aim) { q[1] += st.aim[0]; q[0] += st.aim[1]; }
    return M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(q[1]), M4.rotX(q[0]), M4.rotZ(q[2]));
  }

  function drawPistol(r, T, G, st) {
    const M = weaponM(st);
    const silver = st.mode === 'pistolSilver';
    r.draw(G.pistol, M, { texture: silver ? T.chrome : T.gunMetal, tint: silver ? [1, 1, 1] : [1.5, 1.5, 1.6] });
    const Rh = M4.chain(M, M4.translate(0.003, -0.07, 0.025), M4.rotX(-0.25), M4.rotZ(PI / 2 + 0.1));
    hand(r, T, G, Rh, 0.85, 'R', st.sleeve);
    if (st.twoHand) {
      const Lh = M4.chain(M, M4.translate(-0.03, -0.07, 0.03), M4.rotY(0.5), M4.rotZ(-PI / 2 + 0.2), M4.rotX(-0.2));
      hand(r, T, G, Lh, 0.75, 'L', st.sleeve);
    }
    return M4.point(M, [0, 0.03, -0.18]);
  }

  function drawRifle(r, T, G, st) {
    const M = weaponM(st);
    const tan = st.mode === 'tan';
    r.draw(G.rifle, M, { texture: T.gunMetal, tint: tan ? [1.9, 1.7, 1.25] : [1.6, 1.6, 1.7] });
    r.draw(G.riflePiece, M, { texture: tan ? T.khaki : T.wood, tint: tan ? [1.25, 1.2, 1.05] : [1.1, 0.75, 0.65] });
    const Sm = tan ? M4.chain(M, M4.translate(0, -0.01, 0.02), M4.scale(0.75, 0.8, 0.6)) : M;
    r.draw(G.scope, Sm, { texture: T.gunMetal, tint: [1.5, 1.5, 1.55] });
    r.draw(G.scopeGlass, Sm);
    const Rh = M4.chain(M, M4.translate(0.004, -0.075, 0.08), M4.rotX(-0.45), M4.rotZ(PI / 2 + 0.15));
    hand(r, T, G, Rh, 0.85, 'R', st.sleeve);
    const lh = st.inspect ? [-0.06, -0.06, -0.12] : [-0.01, -0.05, -0.3];
    const Lh = M4.chain(M, M4.translate(lh[0], lh[1], lh[2]), M4.rotZ(-PI / 2 - 0.3), M4.rotY(-0.2), M4.rotX(0.3));
    hand(r, T, G, Lh, 0.8, 'L', st.sleeve);
    return M4.point(M, [0, 0.012, -0.76]);
  }

  function drawSmg(r, T, G, st) {
    const M = weaponM(st);
    r.draw(G.smg, M, { texture: T.gunMetal, tint: [1.5, 1.55, 1.65] });
    const Rh = M4.chain(M, M4.translate(0.004, -0.07, 0.02), M4.rotX(-0.35), M4.rotZ(PI / 2 + 0.1));
    hand(r, T, G, Rh, 0.85, 'R', st.sleeve);
    const Lh = M4.chain(M, M4.translate(-0.012, -0.05, -0.3), M4.rotZ(-PI / 2 - 0.3), M4.rotX(0.2));
    hand(r, T, G, Lh, 0.8, 'L', st.sleeve);
    return M4.point(M, [0, 0.01, -0.49]);
  }

  function drawBolt(r, T, G, st) {
    const sw = sway(st);
    let p = [0.05 + sw[0], -0.21 + sw[1], -0.42];
    let q = [0.3, 0.3, 0.2];
    if (st.throwK !== undefined) {
      const k = st.throwK;
      const a = k < 0.45 ? ease(k / 0.45) : 1 - ease((k - 0.45) / 0.55);
      p = [p[0] + 0.08 * a, p[1] + 0.1 * a, p[2] + 0.05 * a];
      q = [q[0] - 0.7 * a, q[1] + 0.2 * a, q[2] - 0.5 * a];
    }
    const M = M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(q[1]), M4.rotX(q[0]), M4.rotZ(q[2]));
    const open = st.throwK !== undefined && st.throwK > 0.4 && st.throwK < 0.8;
    if (open) {
      const Hm = M4.chain(M4.translate(p[0] + 0.03, p[1] + 0.02, p[2] + 0.02), M4.rotX(-1.2), M4.rotZ(0.3));
      hand(r, T, G, Hm, 0.1, 'R', st.sleeve);
    } else {
      const F = M4.chain(M, M4.rotY(PI - 0.3), M4.rotZ(0.3), M4.scale(0.85, 0.85, 0.85));
      r.draw(G.fist, F);
      r.draw(G.fistGlove, F, { texture: T.glove });
      r.draw(G.bolt, M4.chain(F, M4.translate(-0.045, 0.036, 0.035), M4.rotZ(0.5)));
      arm(r, T, G, M4.point(F, [0.07, -0.01, -0.03]), [p[0] + 0.12, p[1] - 0.28, p[2] + 0.12], st.sleeve);
    }
    if (st.reach) {
      const k = ease(st.reach);
      const Lh = M4.chain(M4.translate(lerp(-0.25, -0.06, k), lerp(-0.3, -0.12, k), -0.32), M4.rotX(-1.3 + 0.3 * k), M4.rotZ(-0.4), M4.rotY(0.3));
      hand(r, T, G, Lh, 0.15, 'L', st.sleeve);
    }
  }

  function draw(r, T, G, st) {
    if (st.mode === 'pistol' || st.mode === 'pistolSilver') return drawPistol(r, T, G, st);
    if (st.mode === 'rifle' || st.mode === 'tan') return drawRifle(r, T, G, st);
    if (st.mode === 'smg') return drawSmg(r, T, G, st);
    if (st.mode === 'bolt') drawBolt(r, T, G, st);
    return null;
  }

  function drawFlash(r, T, G, muzzle, k, seed) {
    if (!muzzle) return;
    const s = 0.06 + 0.05 * k;
    const M = M4.chain(M4.translate(muzzle[0], muzzle[1], muzzle[2]), M4.rotZ(seed * 2.1), M4.scale(s, s, s * 1.6));
    r.draw(G.flash, M, { texture: T.flash, additive: true, alpha: 0.95 * k, noFog: true });
  }

  window.DownGun = { build, draw, drawFlash, HOLD };
})();
