(function () {
  const { M4, V3, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp } = K;

  const COL = {
    gun: 0x2e2e30, gunHi: 0x4a4a4e, wood: 0x5a3a24, woodDk: 0x3e2618, bore: 0x0b0b0b, bat: 0xc9a66e, batDk: 0xa8844e, tape: 0x26262a,
    bread: 0xe6cc9a, crust: 0xb8864a, lettuce: 0x6aa83a, ham: 0xd88a8a, cheese: 0xe8c040, tomato: 0xc8382c, olive: 0x5a7a2a, pick: 0xe0d0a8,
    sentry: 0x50565e, sentryDk: 0x32363c, bluPanel: 0x4a74a0, lens: 0x0e1420, rocket: 0x6a6c68, warhead: 0x8a2a20
  };

  const METAL = { spec: [0.45, 22], rim: 0.6 };
  const WOOD = { spec: [0.25, 12], rim: 0.5 };
  const FOOD = { spec: [0.15, 8], rim: 0.6 };

  function cyl(b, from, to, r, col, sides, opts) {
    const d = V3.sub(to, from);
    const len = V3.len(d);
    const y = V3.mul(d, 1 / len);
    let x = V3.cross(y, Math.abs(y[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]);
    x = V3.norm(x);
    const z = V3.cross(x, y);
    const M = new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, from[0], from[1], from[2], 1]);
    b.push(M);
    const r0 = Array.isArray(r) ? r[0] : r, r1 = Array.isArray(r) ? r[1] : r;
    b.prism(sides || 12, r0, r0, 0, r1, r1, len, col, Object.assign({ capBottom: true }, opts || {}));
    b.pop();
    return b;
  }

  function buildScatter(b) {
    b.at(0, 0.055, 0.07, h => h.box(0.046, 0.066, 0.2, COL.gun));
    b.at(0, 0.09, 0.07, h => h.box(0.03, 0.008, 0.18, COL.gunHi));
    cyl(b, [0, 0.07, 0.16], [0, 0.07, 0.58], 0.0165, COL.gun, 12);
    cyl(b, [0, 0.07, 0.565], [0, 0.07, 0.585], 0.019, COL.gunHi, 12);
    b.at(0, 0.07, 0.5851, h => K.discXY(h, 0, 0, 0, 0.011, 10, rgb(COL.bore, 0.6)));
    cyl(b, [0, 0.036, 0.16], [0, 0.036, 0.52], 0.0135, COL.gunHi, 10);
    b.at(0, 0.036, 0.5201, h => K.discXY(h, 0, 0, 0, 0.0136, 10, rgb(COL.gun)));
    cyl(b, [0, 0.04, 0.28], [0, 0.04, 0.43], 0.024, COL.wood, 10);
    [0.3, 0.33, 0.36, 0.39].forEach(z => cyl(b, [0, 0.04, z], [0, 0.04, z + 0.008], 0.0248, COL.woodDk, 10));
    b.push(M4.translate(0, 0.0, -0.005), M4.rotX(0.35));
    b.box(0.034, 0.11, 0.045, COL.wood);
    b.pop();
    b.at(0, 0.012, 0.045, h => h.box(0.012, 0.03, 0.04, COL.gun));
    b.push(M4.translate(0, 0.035, -0.11), M4.rotX(-0.12));
    b.box(0.04, 0.07, 0.2, COL.wood);
    b.at(0, -0.01, -0.105, q => q.box(0.042, 0.09, 0.016, COL.woodDk));
    b.pop();
    return b;
  }

  function buildBat(b) {
    const keys = [[0, 0.019], [0.012, 0.022], [0.022, 0.015], [0.24, 0.0155], [0.38, 0.019], [0.52, 0.026], [0.66, 0.032], [0.76, 0.034], [0.82, 0.032], [0.845, 0.022], [0.852, 0.0]];
    for (let i = 0; i < keys.length - 1; i++) {
      const [y0, r0] = keys[i], [y1, r1] = keys[i + 1];
      const col = y0 < 0.022 ? COL.tape : y0 < 0.24 ? ((i % 2) ? COL.tape : 0x34343a) : COL.bat;
      b.prism(14, r0, r0, y0 - 0.03, r1, r1, y1 - 0.03, col, { capTop: i === keys.length - 2, capBottom: i === 0 });
    }
    for (let k = 0; k < 6; k++) {
      const y = 0.02 + k * 0.032;
      b.push(M4.translate(0, y - 0.03, 0), M4.rotZ(0.25));
      b.prism(14, 0.0162, 0.0162, -0.004, 0.0162, 0.0162, 0.004, COL.tape, { capTop: false });
      b.pop();
    }
    return b;
  }

  function slab(b, y, h, w, d, col, wobble) {
    const n = 14;
    const pt = (i, yy, k) => {
      const a = (i / n) * PI * 2;
      const r = 1 + (wobble || 0) * S(a * 5 + yy * 40) * k;
      return [C(a) * w * r, yy, S(a) * d * r];
    };
    for (let i = 0; i < n; i++) {
      const a0 = pt(i, y, 1), a1 = pt(i + 1, y, 1), b0 = pt(i, y + h, 1), b1 = pt(i + 1, y + h, 1);
      b.quad(a0, b0, b1, a1, col);
      b.tri([0, y + h, 0], b1, b0, col, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0]]);
      b.tri([0, y, 0], a0, a1, col, null, [[0, -1, 0], [0, -1, 0], [0, -1, 0]]);
    }
  }

  function buildSandwich(b) {
    b.at(0, 0, 0, h => h.box(0.15, 0.03, 0.12, COL.bread, { base: true }));
    b.at(0, 0.004, 0, h => h.box(0.156, 0.022, 0.126, COL.crust, { base: true, faces: { top: null, bottom: null } }));
    slab(b, 0.03, 0.012, 0.085, 0.068, COL.lettuce, 0.12);
    slab(b, 0.042, 0.012, 0.078, 0.062, COL.ham, 0.04);
    b.at(0, 0.054, 0, h => { h.push(M4.rotY(0.4)); h.box(0.12, 0.006, 0.1, COL.cheese, { base: true }); h.pop(); });
    [[-0.035, 0.01], [0.03, -0.015]].forEach(([x, z]) => b.at(x, 0.06, z, h => h.prism(12, 0.032, 0.032, 0, 0.032, 0.032, 0.008, COL.tomato)));
    b.at(0, 0.068, 0, h => h.box(0.15, 0.032, 0.12, COL.bread, { base: true }));
    b.at(0, 0.1, 0, h => h.ellipsoid(0.075, 0.012, 0.06, 12, 4, COL.crust));
    cyl(b, [0.01, 0.05, 0.005], [0.01, 0.14, 0.005], 0.0018, COL.pick, 6);
    b.at(0.01, 0.142, 0.005, h => h.ellipsoid(0.011, 0.012, 0.011, 10, 6, COL.olive));
    return b;
  }

  function buildSentryBase(b) {
    [0, 2.094, 4.189].forEach(a => {
      const foot = [S(a) * 0.3, 0.0, C(a) * 0.3];
      const hub = [0, 0.32, 0];
      K.tube(b, [hub, V3.lerp(hub, foot, 0.55), foot], [0.02, 0.018, 0.016], 6, COL.sentryDk);
      b.push(M4.translate(foot[0], 0.015, foot[2]), M4.rotY(a));
      b.box(0.05, 0.03, 0.08, COL.sentryDk);
      b.pop();
    });
    cyl(b, [0, 0.28, 0], [0, 0.46, 0], 0.035, COL.sentryDk, 12);
    cyl(b, [0, 0.45, 0], [0, 0.48, 0], 0.06, COL.sentry, 14);
    return b;
  }

  function buildSentryGun(b) {
    [-1, 1].forEach(s => b.at(s * 0.12, 0.06, 0, h => h.box(0.02, 0.15, 0.12, COL.sentryDk)));
    b.at(0, 0.13, -0.03, h => h.box(0.2, 0.18, 0.34, COL.sentry, { faces: { left: COL.bluPanel, right: COL.bluPanel } }));
    b.at(0, 0.23, -0.03, h => h.box(0.18, 0.02, 0.3, COL.sentryDk));
    cyl(b, [0, 0.14, 0.14], [0, 0.14, 0.3], 0.06, COL.sentry, 16);
    b.at(0, 0.14, 0.301, h => K.discXY(h, 0, 0, 0, 0.05, 16, rgb(COL.lens, 0.2)));
    b.at(-0.02, 0.16, 0.302, h => K.discXY(h, 0, 0, 0, 0.012, 10, rgb(0x6a9ad8, 0.8)));
    cyl(b, [0, 0.08, 0.12], [0, 0.08, 0.42], 0.022, COL.sentryDk, 10);
    b.at(0, 0.08, 0.4201, h => K.discXY(h, 0, 0, 0, 0.015, 10, rgb(COL.bore, 0.6)));
    b.at(0, 0.1, -0.24, h => h.box(0.14, 0.1, 0.08, COL.sentryDk));
    return b;
  }

  function buildRocket(b) {
    b.push(M4.rotX(PI / 2));
    b.prism(8, 0.035, 0.035, -0.18, 0.035, 0.035, 0.12, COL.rocket, { capBottom: true });
    b.prism(8, 0.035, 0.035, 0.12, 0.004, 0.004, 0.2, COL.warhead);
    b.pop();
    return b;
  }

  function build(r) {
    const mk = (fn) => K.mesh(r, fn);
    return {
      scatter: mk(buildScatter),
      bat: mk(buildBat),
      sandwich: mk(buildSandwich),
      sentryBase: mk(buildSentryBase),
      sentryGun: mk(buildSentryGun),
      rocket: mk(buildRocket)
    };
  }

  const GRIPS = {
    scatter: {
      R: { at: [0, -0.005, -0.012], fingers: [0, -0.35, 1], palm: [-1, 0, 0], pose: 'grip' },
      L: { at: [0, 0.03, 0.355], fingers: [0.2, -0.2, 1], palm: [1, 0.3, 0], pose: 'grip' }
    },
    bat: {
      R: { at: [0, 0.05, 0], fingers: [1, 0, 0], palm: [0, 0, -1], pose: 'grip' },
      L: { at: [0, 0.13, 0], fingers: [1, 0, 0], palm: [0, 0, -1], pose: 'grip' }
    },
    sandwich: {
      R: { at: [-0.075, 0.05, 0], fingers: [0, 0, 1], palm: [1, 0, 0], pose: 'hold' },
      L: { at: [0.075, 0.05, 0], fingers: [0, 0, 1], palm: [-1, 0, 0], pose: 'hold' }
    }
  };

  function grip(kind, side, M) {
    const g = GRIPS[kind][side];
    return { pos: M4.point(M, g.at), fingers: V3.norm(M4.dir(M, g.fingers)), palm: V3.norm(M4.dir(M, g.palm)), pose: g.pose };
  }

  function muzzle(M) {
    return { p: M4.point(M, [0, 0.07, 0.6]), d: V3.norm(M4.dir(M, [0, 0, 1])) };
  }

  function sentryFrames(M, st) {
    const s = st || {};
    const yaw = M4.chain(M, M4.translate(0, 0.48, 0), M4.rotY(s.yaw || 0));
    const gun = M4.chain(yaw, M4.translate(0, 0.02, 0), M4.rotX(-(s.pitch || 0)));
    return { yaw, gun };
  }

  function drawSentry(fx, P, M, st, tint) {
    const t = tint ? { tint } : {};
    const F = sentryFrames(M, st);
    const build = st && st.build !== undefined ? st.build : 1;
    const base = build < 1 ? M4.chain(M, M4.scale(1, lerp(0.4, 1, build), 1)) : M;
    fx.draw(P.sentryBase, base, Object.assign({}, METAL, t));
    if (build > 0.5) fx.draw(P.sentryGun, F.gun, Object.assign({}, METAL, t));
    return F;
  }

  function drawScatter(fx, P, M, tint) {
    fx.draw(P.scatter, M, Object.assign({}, METAL, tint ? { tint } : {}));
  }

  function drawBat(fx, P, M, tint) {
    fx.draw(P.bat, M, Object.assign({}, WOOD, tint ? { tint } : {}));
  }

  function drawSandwich(fx, P, M, tint) {
    fx.draw(P.sandwich, M, Object.assign({}, FOOD, tint ? { tint } : {}));
  }

  function frameFrom(origin, fwd, up) {
    const z = V3.norm(fwd);
    let x = V3.cross(up, z);
    x = V3.len(x) < 1e-5 ? [1, 0, 0] : V3.norm(x);
    const y = V3.cross(z, x);
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, origin[0], origin[1], origin[2], 1]);
  }

  window.MscProps = { COL, GRIPS, METAL, build, grip, muzzle, sentryFrames, drawSentry, drawScatter, drawBat, drawSandwich, frameFrom };
})();
