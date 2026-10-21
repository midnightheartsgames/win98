(function () {
  const { M4, shade } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, mesh, spherePatch, noiseTex } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const D = {
    chestY: 0.10,
    neckY: 0.44,
    headY: 0.14,
    shX: 0.22,
    shY: 0.35,
    upper: 0.27,
    fore: 0.26,
    hipX: 0.12,
    hipY: -0.05,
    thigh: 0.40,
    shin: 0.39
  };

  const COL = {
    skin: 0xd7a695,
    skinHi: 0xe6b9a8,
    skinShade: 0xa87e6e,
    shirt: 0x677b77,
    shirtDark: 0x4d5d5b,
    patch: 0xdfd878,
    overalls: 0x2e2628,
    overallsHi: 0x423739,
    belt: 0x1d1819,
    buckle: 0xb89348,
    glove: 0xf0a43c,
    gloveDark: 0xb86c22,
    hardhat: 0xfdd43b,
    hardhatRim: 0xd87a20,
    hardhatIn: 0x32241c,
    goggleFrame: 0x221e1d,
    goggleRim: 0x565250,
    goggleLens: [0.93, 0.92, 0.89, 0.65],
    wrench: 0x252325,
    wrenchHi: 0x4c4a4e,
    boot: 0x221c1d,
    cord: 0x3a2e28
  };

  function faceTex(mode) {
    return (ctx, w, h) => {
      ctx.fillStyle = '#d7a695';
      ctx.fillRect(0, 0, w, h);

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(235, 190, 172, 0.45)');
      grad.addColorStop(0.55, 'rgba(215, 166, 149, 0.0)');
      grad.addColorStop(1, 'rgba(132, 94, 82, 0.55)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(135, 92, 78, 0.45)';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.54, w * 0.075, h * 0.045, 0, 0, PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(115, 76, 64, 0.55)';
      ctx.lineWidth = w * 0.022;
      ctx.lineCap = 'round';
      [-1, 1].forEach(s => {
        ctx.beginPath();
        ctx.moveTo(w * (0.5 + s * 0.11), h * 0.56);
        ctx.quadraticCurveTo(w * (0.5 + s * 0.18), h * 0.66, w * (0.5 + s * 0.15), h * 0.77);
        ctx.stroke();
      });

      const my = h * 0.73;
      if (mode === 'nope') {
        ctx.fillStyle = '#261212';
        ctx.beginPath();
        ctx.ellipse(w * 0.5, my + h * 0.02, w * 0.145, h * 0.095, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ece6dc';
        ctx.fillRect(w * 0.38, my - h * 0.045, w * 0.24, h * 0.042);
        ctx.strokeStyle = '#7e4e44';
        ctx.lineWidth = w * 0.026;
        ctx.beginPath();
        ctx.ellipse(w * 0.5, my + h * 0.02, w * 0.145, h * 0.095, 0, 0, PI * 2);
        ctx.stroke();
      } else if (mode === 'open') {
        ctx.fillStyle = '#2a1414';
        ctx.beginPath();
        ctx.ellipse(w * 0.5, my + h * 0.01, w * 0.11, h * 0.055, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e8e2d8';
        ctx.fillRect(w * 0.41, my - h * 0.025, w * 0.18, h * 0.028);
      } else {
        ctx.strokeStyle = '#5c3830';
        ctx.lineWidth = w * 0.028;
        ctx.beginPath();
        ctx.moveTo(w * 0.37, my + h * 0.01);
        ctx.quadraticCurveTo(w * 0.5, my - h * 0.015, w * 0.63, my + h * 0.005);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(110, 72, 62, 0.5)';
        ctx.lineWidth = w * 0.018;
        ctx.beginPath();
        ctx.moveTo(w * 0.42, my + h * 0.055);
        ctx.quadraticCurveTo(w * 0.5, my + h * 0.075, w * 0.58, my + h * 0.055);
        ctx.stroke();
      }
    };
  }

  function buildPelvis(b) {
    loft(b, [
      ring(-0.10, 0.165, 0.125, 0, shade(COL.overalls, 0.88)),
      ring(-0.02, 0.18, 0.138, 0.005, COL.overalls),
      ring(0.06, 0.175, 0.132, 0.005, COL.overallsHi),
      ring(0.10, 0.17, 0.128, 0, COL.belt)
    ], 14, { capBottom: true, capTop: true });

    b.at(0, 0.08, 0.135, h => h.box(0.065, 0.048, 0.022, COL.buckle));
    b.at(0.15, 0.07, 0.06, h => h.box(0.06, 0.09, 0.07, COL.belt));
    b.at(-0.16, 0.05, 0.03, h => h.box(0.05, 0.11, 0.08, COL.cord));
  }

  function buildChest(b) {
    loft(b, [
      ring(-0.02, 0.168, 0.124, 0, COL.overalls),
      ring(0.12, 0.186, 0.138, 0.008, COL.overalls),
      ring(0.26, 0.205, 0.146, 0.006, COL.shirt),
      ring(0.37, 0.215, 0.142, 0, COL.shirt),
      ring(0.43, 0.145, 0.108, 0, COL.shirtDark),
      ring(0.46, 0.092, 0.085, 0.005, COL.shirtDark)
    ], 16, { capBottom: true, capTop: true });

    b.at(0, 0.15, 0.136, h => h.box(0.22, 0.26, 0.03, COL.overalls));
    b.at(0, 0.16, -0.132, h => h.box(0.24, 0.28, 0.03, COL.overalls));

    [-1, 1].forEach(s => {
      b.at(s * 0.085, 0.34, 0.115, h => {
        h.push(M4.rotX(-0.32));
        h.box(0.048, 0.18, 0.024, COL.overalls);
        h.pop();
      });
      b.at(s * 0.085, 0.27, 0.142, h => h.box(0.052, 0.032, 0.026, COL.buckle));
      b.at(s * 0.09, 0.425, 0.01, h => h.box(0.052, 0.028, 0.16, COL.overalls));
      b.at(s * 0.09, 0.34, -0.11, h => {
        h.push(M4.rotX(0.32));
        h.box(0.048, 0.18, 0.024, COL.overalls);
        h.pop();
      });
      b.at(s * 0.21, 0.35, -0.01, h => h.ellipsoid(0.082, 0.082, 0.082, 10, 6, COL.shirt));
    });

    b.at(0, 0.43, 0.065, h => h.ellipsoid(0.068, 0.048, 0.062, 10, 6, COL.skinShade));
  }

  function buildNeckUnit(b) {
    loft(b, [
      ring(0.0, 0.066, 0.064, 0, COL.skinShade),
      ring(0.25, 0.062, 0.060, 0.002, COL.skin),
      ring(0.65, 0.060, 0.058, 0.004, COL.skin),
      ring(1.0, 0.062, 0.060, 0.004, COL.skinHi)
    ], 14, { capBottom: true, capTop: true });
  }

  function buildHead(b) {
    loft(b, [
      ring(-0.105, 0.052, 0.058, 0.018, COL.skinShade),
      ring(-0.075, 0.078, 0.088, 0.014, COL.skinShade),
      ring(-0.03, 0.092, 0.102, 0.008, COL.skin),
      ring(0.025, 0.098, 0.108, 0.002, COL.skin),
      ring(0.08, 0.096, 0.105, -0.002, COL.skinHi),
      ring(0.125, 0.078, 0.086, -0.004, COL.skinHi),
      ring(0.152, 0.042, 0.046, -0.004, COL.skinHi)
    ], 16, { capBottom: true, capTop: true });

    b.at(0, -0.005, 0.112, h => h.ellipsoid(0.022, 0.028, 0.026, 8, 5, COL.skin));

    [-1, 1].forEach(s => {
      b.at(s * 0.098, 0.005, -0.005, h => h.ellipsoid(0.016, 0.032, 0.022, 6, 5, COL.skinShade));
    });

    b.at(0, 0.025, -0.002, h => h.prism(16, 0.101, 0.110, -0.018, 0.101, 0.110, 0.018, COL.goggleFrame, { capTop: false }));
    b.at(0, 0.026, 0.108, h => h.box(0.032, 0.022, 0.024, COL.goggleFrame));

    [-1, 1].forEach(s => {
      b.push(M4.translate(s * 0.042, 0.025, 0.098), M4.rotY(s * 0.14), M4.rotX(PI / 2));
      b.prism(12, 0.034, 0.034, 0, 0.032, 0.032, 0.024, COL.goggleFrame, { capTop: true, capBottom: true });
      b.prism(12, 0.030, 0.030, 0.020, 0.029, 0.029, 0.028, COL.goggleRim, { capTop: true });
      b.prism(12, 0.024, 0.024, 0.026, 0.024, 0.024, 0.031, COL.goggleLens, { capTop: true });
      b.pop();
    });
  }

  function buildFaceOverlay(b) {
    spherePatch(b, 0.096, 0.115, 0.108, -0.72, 0.72, -0.68, 0.12, 12, 8, 0xffffff, [1, 1]);
  }

  function buildHardhat(b) {
    b.at(0, 0.055, 0, h => h.prism(16, 0.108, 0.122, 0, 0.095, 0.108, 0.06, COL.hardhatIn, { capBottom: true, capTop: true }));

    b.at(0, 0.058, 0.012, h => {
      h.push(M4.rotX(0.06));
      h.prism(18, 0.138, 0.162, -0.008, 0.126, 0.148, 0.014, COL.hardhatRim, { capBottom: true, capTop: true });
      h.pop();
    });
    b.at(0, 0.055, 0.135, h => {
      h.push(M4.rotX(0.12));
      h.ellipsoid(0.095, 0.012, 0.048, 10, 4, COL.hardhatRim);
      h.pop();
    });

    loft(b, [
      ring(0.064, 0.118, 0.134, 0.004, COL.hardhatRim),
      ring(0.095, 0.116, 0.130, 0.002, COL.hardhat),
      ring(0.145, 0.106, 0.118, 0.0, COL.hardhat),
      ring(0.190, 0.082, 0.092, -0.002, COL.hardhat),
      ring(0.222, 0.042, 0.048, -0.002, shade(COL.hardhat, 1.06))
    ], 16, { capBottom: false, capTop: true });

    b.at(0, 0.165, 0.0, h => h.box(0.036, 0.13, 0.21, shade(COL.hardhat, 1.05)));
  }

  function buildUpperArm(b, isRight) {
    loft(b, [
      ring(0, 0.068, 0.068, 0, COL.shirt),
      ring(-0.15, 0.064, 0.064, 0, COL.shirt),
      ring(-0.19, 0.067, 0.067, 0, COL.shirtDark),
      ring(-0.21, 0.054, 0.054, 0, COL.skin),
      ring(-D.upper, 0.050, 0.050, 0, COL.skin)
    ], 10, { capTop: true, capBottom: true });

    const sx = isRight ? -0.064 : 0.064;
    b.at(sx, -0.09, 0, h => h.box(0.016, 0.065, 0.055, COL.patch));
  }

  function buildForearmL(b) {
    loft(b, [
      ring(0, 0.050, 0.050, 0, COL.skin),
      ring(-0.14, 0.046, 0.046, 0, COL.skin),
      ring(-D.fore, 0.038, 0.038, 0, COL.skinShade)
    ], 10, { capTop: true, capBottom: true });
  }

  function buildForearmR(b) {
    loft(b, [
      ring(0, 0.050, 0.050, 0, COL.skin),
      ring(-0.08, 0.048, 0.048, 0, COL.skin),
      ring(-0.09, 0.060, 0.060, 0, COL.gloveDark),
      ring(-0.18, 0.056, 0.056, 0, COL.glove),
      ring(-D.fore, 0.052, 0.052, 0, COL.glove)
    ], 10, { capTop: true, capBottom: true });
  }

  function buildHandL(b) {
    b.at(0, -0.045, 0, h => h.ellipsoid(0.038, 0.052, 0.032, 8, 6, COL.skin));
  }

  function buildHandRWithWrench(b) {
    b.at(0, -0.05, 0.005, h => h.ellipsoid(0.048, 0.058, 0.044, 10, 6, COL.glove));
    b.at(0.035, -0.045, 0.025, h => h.ellipsoid(0.024, 0.032, 0.024, 6, 5, COL.gloveDark));

    b.push(M4.translate(0, -0.05, 0.02), M4.rotX(1.15), M4.rotZ(0.12));
    b.at(0, 0.14, 0, h => h.box(0.032, 0.38, 0.048, COL.wrench));
    b.at(0, 0.28, 0, h => h.box(0.044, 0.045, 0.062, COL.wrenchHi));
    b.at(0, 0.35, 0.025, h => h.box(0.046, 0.075, 0.11, COL.wrench));
    b.at(0, 0.40, 0.035, h => h.box(0.044, 0.048, 0.12, COL.wrenchHi));
    b.pop();
  }

  function buildLimb(b, len, r0, r1, col0, col1) {
    loft(b, [ring(0, r0, r0, 0, col0), ring(-len, r1, r1, 0, col1 || col0)], 10, { capTop: true, capBottom: true });
  }

  function buildShin(b) {
    loft(b, [
      ring(0, 0.088, 0.088, 0, COL.overalls),
      ring(-0.08, 0.086, 0.092, 0.008, COL.boot),
      ring(-0.28, 0.078, 0.078, 0, COL.overalls),
      ring(-D.shin, 0.066, 0.066, 0, COL.boot)
    ], 10, { capTop: true, capBottom: true });
  }

  function buildBoot(b) {
    b.at(0, -0.035, 0.045, h => h.box(0.105, 0.075, 0.21, COL.boot));
  }

  function build(r) {
    const T = {
      cloth: r.texture(64, noiseTex('#ffffff', 19, 0.07, 0.4)),
      skin: r.texture(64, noiseTex('#ffffff', 23, 0.04, 0.3)),
      face_shut: r.texture(128, faceTex('shut'), { clamp: true }),
      face_open: r.texture(128, faceTex('open'), { clamp: true }),
      face_nope: r.texture(128, faceTex('nope'), { clamp: true })
    };
    const V = {
      pelvis: mesh(r, buildPelvis),
      chest: mesh(r, buildChest),
      neckUnit: mesh(r, buildNeckUnit),
      head: mesh(r, buildHead),
      face: mesh(r, buildFaceOverlay),
      hardhat: mesh(r, buildHardhat),
      upperL: mesh(r, b => buildUpperArm(b, false)),
      upperR: mesh(r, b => buildUpperArm(b, true)),
      foreL: mesh(r, buildForearmL),
      foreR: mesh(r, buildForearmR),
      handL: mesh(r, buildHandL),
      handR: mesh(r, buildHandRWithWrench),
      thigh: mesh(r, b => buildLimb(b, D.thigh, 0.098, 0.086, COL.overalls, shade(COL.overalls, 0.9))),
      shin: mesh(r, buildShin),
      boot: mesh(r, buildBoot)
    };
    return { T, V };
  }

  function solve(pose) {
    const s = Rig.solve(pose, D);
    const neckStretch = pose.neckStretch || 0;
    const hatLift = pose.hatLift || 0;

    const baseHead = M4.mul(s.neck, M4.translate(0, D.headY, 0.03));
    s.head = M4.mul(s.neck, M4.translate(0, D.headY + neckStretch, 0.03));
    s.hat = M4.mul(baseHead, M4.translate(0, hatLift, 0));

    const neckLen = Math.max(0.08, D.headY + neckStretch + 0.03);
    s.neckCyl = M4.chain(s.neck, M4.translate(0, -0.02, 0.015), M4.scale(1, neckLen, 1));

    s.pts.head = M4.point(s.head, [0, 0, 0]);
    s.pts.hat = M4.point(s.hat, [0, 0.14, 0]);
    return s;
  }

  function draw(r, Cst, s, opts) {
    const { T, V } = Cst;
    const o = opts || {};
    const cloth = { texture: T.cloth };
    const skin = { texture: T.skin };

    r.draw(V.pelvis, s.pelvis, cloth);
    r.draw(V.chest, s.chest, cloth);
    r.draw(V.neckUnit, s.neckCyl, skin);
    r.draw(V.head, s.head, skin);

    const fTex = T['face_' + (o.face || 'shut')] || T.face_shut;
    r.draw(V.face, s.head, { texture: fTex });
    r.draw(V.hardhat, s.hat);

    r.draw(V.upperL, s.upperL, cloth);
    r.draw(V.upperR, s.upperR, cloth);
    r.draw(V.foreL, s.foreL, skin);
    r.draw(V.foreR, s.foreR, cloth);
    r.draw(V.handL, s.handL, skin);
    r.draw(V.handR, s.handR, cloth);

    ['L', 'R'].forEach(side => {
      r.draw(V.thigh, s['thigh' + side], cloth);
      r.draw(V.shin, s['shin' + side], cloth);
      r.draw(V.boot, s['foot' + side]);
    });
  }

  window.NopeCast = { D, COL, build, solve, draw };
})();
