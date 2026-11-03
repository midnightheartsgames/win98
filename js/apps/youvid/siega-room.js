(function () {
  const { M4, V3, shade, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, mesh, tube } = K;

  const LOOK = {
    curtain: 0x8c8c92,
    foam: 0x3a3a3e,
    floor: 0x202022,
    leather: 0x27272b,
    leatherHi: 0x3a3a40,
    stitch: 0x56565c,
    armPad: 0x8a8a90,
    metal: 0x3c3c42
  };

  const CHAIR = {
    seatY: 0.5,
    seatD: 0.5,
    backTilt: 0.2,
    backH: 0.92,
    backZ: -0.24
  };

  const BACK_ROWS = [
    [0.0, 0.25, 0.04],
    [0.14, 0.26, 0.05],
    [0.32, 0.27, 0.06],
    [0.46, 0.3, 0.11],
    [0.56, 0.31, 0.13],
    [0.63, 0.29, 0.11],
    [0.69, 0.21, 0.03],
    [0.75, 0.19, 0.0],
    [0.83, 0.19, 0.0],
    [0.88, 0.18, 0.0],
    [0.91, 0.14, 0.0],
    [0.92, 0.09, 0.0]
  ];

  function curtainZ(x) {
    return 0.046 * S(x * 36.0) + 0.014 * S(x * 12.1 + 0.7) + 0.007 * S(x * 67 + 1.3);
  }

  function curtainSlope(x) {
    return 0.046 * 36.0 * C(x * 36.0) + 0.014 * 12.1 * C(x * 12.1 + 0.7) + 0.007 * 67 * C(x * 67 + 1.3);
  }

  function buildCurtain(b) {
    const x0 = -3.2, x1 = 0.62, y1 = 2.8, n = 180;
    for (let i = 0; i < n; i++) {
      const xa = x0 + (x1 - x0) * (i / n), xb = x0 + (x1 - x0) * ((i + 1) / n);
      const za = curtainZ(xa), zb = curtainZ(xb);
      const na = V3.norm([-curtainSlope(xa) * 0.6, 0, 1]), nb = V3.norm([-curtainSlope(xb) * 0.6, 0, 1]);
      const ka = 0.62 + 0.38 * clamp(0.5 + za * 11, 0, 1), kb = 0.62 + 0.38 * clamp(0.5 + zb * 11, 0, 1);
      const ca = shade(LOOK.curtain, ka), cb = shade(LOOK.curtain, kb);
      b.quad([xa, 0, za], [xb, 0, zb], [xb, y1, zb], [xa, y1, za], [ca, cb, cb, ca], null, [na, nb, nb, na]);
    }
  }

  function foamTex(ctx, w, h) {
    const cells = 8, cw = w / cells, ch = h / cells;
    ctx.fillStyle = '#5a5a5e';
    ctx.fillRect(0, 0, w, h);
    for (let j = 0; j < cells; j++) {
      for (let i = 0; i < cells; i++) {
        const x = i * cw, y = j * ch, cx = x + cw / 2, cy = y + ch / 2;
        const tri = (ax, ay, bx, by, col) => {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.closePath();
          ctx.fill();
        };
        tri(x, y, x + cw, y, '#606064');
        tri(x, y, x, y + ch, '#58585c');
        tri(x + cw, y, x + cw, y + ch, '#3e3e42');
        tri(x, y + ch, x + cw, y + ch, '#323236');
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(x, y, cw, 1.5);
        ctx.fillRect(x, y, 1.5, ch);
      }
    }
  }

  function buildFoam(b) {
    const x0 = 0.5, x1 = 3.2, y1 = 2.7, z = 0.05;
    const reps = [(x1 - x0) / 0.48, y1 / 0.48];
    b.quad([x0, 0, z], [x1, 0, z], [x1, y1, z], [x0, y1, z], 0xffffff, [[0, 0], [reps[0], 0], [reps[0], reps[1]], [0, reps[1]]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    b.at(x0 - 0.02, y1 / 2, z - 0.02, h => h.box(0.05, y1, 0.08, 0x1c1c1f));
  }

  function buildFloor(b) {
    b.quad([-3.2, 0, 0], [3.2, 0, 0], [3.2, 0, 3.4], [-3.2, 0, 3.4], LOOK.floor, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
  }

  function ledPoints() {
    return [[-0.012, -0.065, 0.0], [0.012, 0.065, -0.01]];
  }

  function buildLed(b) {
    const [a, c] = ledPoints();
    tube(b, [a, c], [0.013, 0.013], 8, [1, 1, 1, 1]);
  }

  function buildGlow(b) {
    const [a, c] = ledPoints();
    tube(b, [a, c], [0.035, 0.035], 8, [1, 1, 1, 1]);
  }

  function backRow(v) {
    const n = BACK_ROWS.length - 1;
    const f = clamp(v, 0, 1) * BACK_ROWS[n][0];
    let i = 0;
    while (i < n - 1 && BACK_ROWS[i + 1][0] < f) i++;
    const a = BACK_ROWS[i], b = BACK_ROWS[i + 1];
    const k = clamp((f - a[0]) / (b[0] - a[0]), 0, 1);
    return { y: f, hw: a[1] + (b[1] - a[1]) * k, wing: a[2] + (b[2] - a[2]) * k };
  }

  function backPoint(u, v, front) {
    const r = backRow(v);
    const x = u * r.hw;
    const side = clamp((Math.abs(u) - 0.5) / 0.45, 0, 1);
    const bolster = side * side * (3 - 2 * side) * r.wing;
    const dish = (1 - u * u) * 0.015;
    const z = front ? 0.06 + bolster - dish : -0.03 + bolster * 0.35;
    return [x, r.y, z];
  }

  function backTex(ctx, w, h) {
    ctx.fillStyle = '#1d1d21';
    ctx.fillRect(0, 0, w, h);
    const vy = (v) => (1 - v / BACK_ROWS[BACK_ROWS.length - 1][0]) * h;
    ctx.fillStyle = '#25252a';
    ctx.fillRect(w * 0.25, vy(0.7), w * 0.5, vy(0.02) - vy(0.7));
    ctx.strokeStyle = '#47474d';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    [0.25, 0.75].forEach(x => {
      ctx.beginPath();
      ctx.moveTo(w * x, vy(0.7));
      ctx.lineTo(w * x, vy(0.02));
      ctx.stroke();
    });
    ctx.setLineDash([]);
    [0.36, 0.64].forEach(x => {
      ctx.fillStyle = '#050506';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(w * (x - 0.1), vy(0.79), w * 0.2, vy(0.73) - vy(0.79), 14);
      else ctx.rect(w * (x - 0.1), vy(0.79), w * 0.2, vy(0.73) - vy(0.79));
      ctx.fill();
      ctx.strokeStyle = '#3c3c42';
      ctx.lineWidth = 3;
      ctx.stroke();
    });
    ctx.save();
    ctx.translate(w / 2, vy(0.845));
    ctx.scale(1, 0.95);
    ctx.fillStyle = '#a8a8ae';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `italic bold ${Math.round(w * 0.1)}px Arial, sans-serif`;
    ctx.fillText('DIVANRACER', 0, 0);
    ctx.restore();
  }

  function buildBack(b) {
    const nu = 14, nv = 26;
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = -1 + (2 * i) / nu, u1 = -1 + (2 * (i + 1)) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const a = backPoint(u0, v0, true), c = backPoint(u1, v0, true), d = backPoint(u1, v1, true), e = backPoint(u0, v1, true);
        const uv = [[(u0 + 1) / 2, v0], [(u1 + 1) / 2, v0], [(u1 + 1) / 2, v1], [(u0 + 1) / 2, v1]];
        const n = V3.norm(V3.cross(V3.sub(c, a), V3.sub(e, a)));
        b.quad(a, c, d, e, 0xffffff, uv, [n, n, n, n]);
        const ba = backPoint(u0, v0, false), bc = backPoint(u1, v0, false), bd = backPoint(u1, v1, false), be = backPoint(u0, v1, false);
        b.quad(bc, ba, be, bd, LOOK.leather, null, [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]);
      }
      [-1, 1].forEach(u => {
        const f0 = backPoint(u, j / nv, true), f1 = backPoint(u, (j + 1) / nv, true);
        const k0 = backPoint(u, j / nv, false), k1 = backPoint(u, (j + 1) / nv, false);
        const n = [u, 0, 0.2];
        if (u > 0) b.quad(k0, f0, f1, k1, LOOK.leatherHi, null, [n, n, n, n]);
        else b.quad(f0, k0, k1, f1, LOOK.leatherHi, null, [n, n, n, n]);
      });
    }
    for (let i = 0; i < nu; i++) {
      const u0 = -1 + (2 * i) / nu, u1 = -1 + (2 * (i + 1)) / nu;
      const a = backPoint(u0, 1, true), c = backPoint(u1, 1, true), d = backPoint(u1, 1, false), e = backPoint(u0, 1, false);
      b.quad(a, c, d, e, LOOK.leatherHi, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
    }
  }

  function buildSeat(b) {
    const L = LOOK.leather;
    b.at(0, CHAIR.seatY - 0.05, 0, h => h.box(0.5, 0.1, CHAIR.seatD, L));
    [-1, 1].forEach(s => {
      b.push(M4.translate(s * 0.23, CHAIR.seatY + 0.01, 0.0), M4.rotZ(-s * 0.35));
      b.box(0.08, 0.1, CHAIR.seatD, LOOK.leatherHi);
      b.pop();
    });
    b.at(0, CHAIR.seatY - 0.14, 0, h => h.box(0.36, 0.06, 0.36, LOOK.metal));
    b.at(0, 0.08, 0, h => h.prism(10, 0.03, 0.03, 0, 0.03, 0.03, CHAIR.seatY - 0.14, LOOK.metal));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * PI * 2 + 0.3;
      b.push(M4.translate(0, 0.07, 0), M4.rotY(a));
      b.at(0, 0, 0.17, h => h.box(0.05, 0.035, 0.34, LOOK.metal));
      b.at(0, -0.035, 0.33, h => h.ellipsoid(0.03, 0.03, 0.03, 6, 4, 0x101012));
      b.pop();
    }
  }

  function buildArms(b) {
    [-1, 1].forEach(s => {
      b.at(s * 0.31, 0.6, -0.02, h => h.box(0.04, 0.2, 0.06, LOOK.metal));
      b.at(s * 0.31, 0.715, 0.02, h => h.box(0.085, 0.035, 0.26, LOOK.armPad));
    });
  }

  function pillowTex(ctx, w, h) {
    ctx.fillStyle = '#222227';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#46464c';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.setLineDash([]);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(1, 0.75);
    ctx.fillStyle = '#9a9aa0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `italic bold ${Math.round(h * 0.2)}px Arial, sans-serif`;
    ctx.fillText('DIVANRACER', 0, 0);
    ctx.restore();
  }

  function buildPillow(b) {
    const nu = 10, nv = 5, rx = 0.15, ry = 0.075, rz = 0.05;
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const p = (u, v) => {
          const x = (-1 + 2 * u) * rx, y = (-1 + 2 * v) * ry;
          const puff = Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(-1 + 2 * u), 4))) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(-1 + 2 * v), 4)));
          return [x, y, rz * puff];
        };
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const a = p(u0, v0), c = p(u1, v0), d = p(u1, v1), e = p(u0, v1);
        const n = V3.norm(V3.add(V3.cross(V3.sub(c, a), V3.sub(e, a)), [0, 0, 0.002]));
        b.quad(a, c, d, e, 0xffffff, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], [n, n, n, n]);
      }
    }
  }

  function build(r) {
    return {
      curtain: mesh(r, buildCurtain),
      foam: mesh(r, buildFoam),
      foamTex: r.texture(256, foamTex),
      floor: mesh(r, buildFloor),
      led: mesh(r, buildLed),
      glow: mesh(r, buildGlow),
      back: mesh(r, buildBack),
      backTex: r.texture(256, backTex, { height: 512, clamp: true }),
      seat: mesh(r, buildSeat),
      arms: mesh(r, buildArms),
      pillow: mesh(r, buildPillow),
      pillowTex: r.texture(256, pillowTex, { height: 128, clamp: true })
    };
  }

  function backMatrix(chairM) {
    return M4.chain(chairM, M4.translate(0, CHAIR.seatY + 0.04, CHAIR.backZ), M4.rotX(-CHAIR.backTilt));
  }

  function backAt(chairM, u, v) {
    return M4.point(backMatrix(chairM), backPoint(u, v, true));
  }

  function draw(r, V, place) {
    const wall = place.wall;
    const k = place.tint || 1;
    const tint = [k, k, k];
    r.draw(V.curtain, wall, { tint });
    r.draw(V.foam, wall, { texture: V.foamTex, tint });
    r.draw(V.floor, place.floor || wall, { tint });
    if (place.led) {
      r.draw(V.led, place.led, { noFog: true });
      r.draw(V.glow, place.led, { additive: true, alpha: place.ledGlow === undefined ? 0.16 : place.ledGlow, noFog: true });
    }
    const chairM = place.chair;
    const backM = backMatrix(chairM);
    r.draw(V.back, backM, { texture: V.backTex, tint });
    if (place.pillowAt) r.draw(V.pillow, M4.chain(backM, M4.translate(place.pillowAt[0], place.pillowAt[1], 0.085), M4.rotZ(place.pillowAt[2] || 0)), { texture: V.pillowTex, tint });
    r.draw(V.seat, chairM, { tint });
    if (place.arms !== false) r.draw(V.arms, chairM, { tint });
  }

  window.SiegaRoom = { LOOK, CHAIR, build, draw, backMatrix, backAt, curtainZ };
})();
