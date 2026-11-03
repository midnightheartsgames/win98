(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, mesh, tube } = K;
  const A = window.SairaArt;

  function lathe(b, prof, seg, col, uvk, opts) {
    const o = opts || {};
    const a0 = o.a0 || 0, a1 = o.a1 === undefined ? PI * 2 : o.a1;
    const lens = [0];
    for (let i = 1; i < prof.length; i++) lens.push(lens[i - 1] + Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]));
    const total = lens[lens.length - 1] || 1;
    const nrm = (i) => {
      const p = prof[Math.max(0, i - 1)], q = prof[Math.min(prof.length - 1, i + 1)];
      const dr = q[0] - p[0], dy = q[1] - p[1];
      const l = Math.hypot(dr, dy) || 1;
      return o.inside ? [-dy / l, dr / l] : [dy / l, -dr / l];
    };
    const sx = o.sx || 1, sz = o.sz || 1;
    for (let j = 0; j < seg; j++) {
      const u0 = j / seg, u1 = (j + 1) / seg;
      const t0 = a0 + (a1 - a0) * u0, t1 = a0 + (a1 - a0) * u1;
      for (let i = 0; i < prof.length - 1; i++) {
        const p = prof[i], q = prof[i + 1];
        const np = nrm(i), nq = nrm(i + 1);
        const P = (pp, t) => [S(t) * pp[0] * sx, pp[1], C(t) * pp[0] * sz];
        const N = (nn, t) => V3.norm([S(t) * nn[0] / sx, nn[1], C(t) * nn[0] / sz]);
        const uv = (u, v) => uvk ? [u * uvk[0], v * uvk[1]] : [u, v];
        const cols = typeof col === 'function' ? [col(p, u0), col(p, u1), col(q, u1), col(q, u0)] : col;
        b.quad(P(p, t0), P(p, t1), P(q, t1), P(q, t0), cols, [uv(u0, lens[i] / total), uv(u1, lens[i] / total), uv(u1, lens[i + 1] / total), uv(u0, lens[i + 1] / total)], [N(np, t0), N(np, t1), N(nq, t1), N(nq, t0)]);
      }
    }
    return b;
  }

  function disc(b, r, y, seg, col, uvScale, sx, sz) {
    const n = [0, 1, 0];
    const kx = sx || 1, kz = sz || 1;
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * PI * 2, a1 = ((i + 1) / seg) * PI * 2;
      const p0 = [S(a0) * r * kx, y, C(a0) * r * kz], p1 = [S(a1) * r * kx, y, C(a1) * r * kz];
      const uv = (p) => [0.5 + p[0] / (2 * r * kx) * (uvScale || 1), 0.5 + p[2] / (2 * r * kz) * (uvScale || 1)];
      b.tri([0, y, 0], p0, p1, col, [uv([0, y, 0]), uv(p0), uv(p1)], [n, n, n]);
    }
    return b;
  }

  function roundRect(w, d, rad, n) {
    const pts = [];
    const corners = [[w / 2 - rad, d / 2 - rad, 0], [-(w / 2 - rad), d / 2 - rad, PI / 2], [-(w / 2 - rad), -(d / 2 - rad), PI], [w / 2 - rad, -(d / 2 - rad), PI * 1.5]];
    corners.forEach(([cx, cz, a0]) => {
      for (let i = 0; i <= n; i++) {
        const a = a0 + (i / n) * PI / 2;
        pts.push([cx + C(a) * rad, cz + S(a) * rad]);
      }
    });
    return pts;
  }

  function flatPoly(b, pts, y, col, w, d) {
    const n = [0, 1, 0];
    const uv = (p) => [0.5 + p[0] / w, 0.5 + p[1] / d];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      b.tri([0, y, 0], [q[0], y, q[1]], [p[0], y, p[1]], col, [[0.5, 0.5], uv(q), uv(p)], [n, n, n]);
    }
  }

  function wallLoop(b, pts0, pts1, y0, y1, col, outward) {
    for (let i = 0; i < pts0.length; i++) {
      const j = (i + 1) % pts0.length;
      const a = [pts0[i][0], y0, pts0[i][1]], bb = [pts0[j][0], y0, pts0[j][1]];
      const c = [pts1[j][0], y1, pts1[j][1]], d = [pts1[i][0], y1, pts1[i][1]];
      const mid = [(pts0[i][0] + pts0[j][0]) / 2, 0, (pts0[i][1] + pts0[j][1]) / 2];
      const n = V3.norm([mid[0] * (outward ? 1 : -1), 0, mid[2] * (outward ? 1 : -1)]);
      b.quad(a, bb, c, d, col, [[i / pts0.length, 0], [j / pts0.length, 0], [j / pts0.length, 1], [i / pts0.length, 1]], [n, n, n, n]);
    }
  }

  function boxAt(b, x, y, z, sx, sy, sz, col, rot) {
    b.push(M4.translate(x, y, z), M4.rotY(rot || 0));
    b.box(sx, sy, sz, col);
    b.pop();
  }

  function cyl(b, r, h, seg, col, opts) {
    const o = opts || {};
    lathe(b, [[r, 0], [r, h]], seg, col, o.uvk || [1, 1]);
    if (o.top !== false) disc(b, r, h, seg, o.topCol || col);
    if (o.bottom) disc(b, r, 0, seg, col);
    return b;
  }

  const FRY = { rim: 0.142, bottom: 0.112, h: 0.052, floor: 0.009, handle: [0, 0, 1] };
  const SAUCE = { rim: 0.1, h: 0.1, floor: 0.01, handle: V3.norm([0.55, 0, 0.84]) };
  const BOX = { w: 0.192, d: 0.132, h: 0.062, rad: 0.022 };
  const BOWL = { rim: 0.098, h: 0.058, floor: 0.012 };

  function buildFryPan(r, T) {
    const outer = [[FRY.bottom, 0.0], [FRY.bottom + 0.006, 0.002], [FRY.rim - 0.004, FRY.h - 0.004], [FRY.rim, FRY.h], [FRY.rim - 0.004, FRY.h + 0.003]];
    const inner = [[0, FRY.floor], [FRY.bottom - 0.01, FRY.floor], [FRY.bottom - 0.002, FRY.floor + 0.004], [FRY.rim - 0.008, FRY.h - 0.001], [FRY.rim - 0.004, FRY.h + 0.003]];
    return {
      outer: mesh(r, b => { lathe(b, outer, 48, [0.75, 0.75, 0.78, 0], [8, 1]); disc(b, FRY.bottom, 0.0, 48, 0x202022); }),
      inner: mesh(r, b => lathe(b, inner, 48, [0.86, 0.86, 0.9, 0], [10, 2], { inside: true })),
      handle: mesh(r, b => buildHandle(b, 0.19, 0.012, 0.016)),
      tex: T.granite, texIn: T.graniteInner
    };
  }

  function buildHandle(b, len, r0, r1) {
    b.push(M4.rotX(PI / 2 - 0.12));
    lathe(b, [[0.0, -0.004], [0.017, 0.0], [0.017, 0.028], [0.014, 0.03]], 16, 0xc8ccd2);
    lathe(b, [[0.014, 0.03], [r0, 0.04], [r1, len - 0.02], [r1 * 0.9, len - 0.005], [0.0, len]], 14, 0x16161a);
    b.pop();
    return b;
  }

  function buildSaucepan(r, T) {
    const outer = [[0.094, 0.0], [0.097, 0.003], [SAUCE.rim, SAUCE.h - 0.004], [SAUCE.rim + 0.002, SAUCE.h], [SAUCE.rim - 0.003, SAUCE.h + 0.002]];
    const inner = [[0, SAUCE.floor], [0.088, SAUCE.floor], [0.093, SAUCE.floor + 0.005], [SAUCE.rim - 0.005, SAUCE.h - 0.001], [SAUCE.rim - 0.003, SAUCE.h + 0.002]];
    return {
      outer: mesh(r, b => { lathe(b, outer, 44, [0.72, 0.72, 0.75, 0], [7, 1.4]); disc(b, 0.094, 0.0, 44, 0x202022); }),
      inner: mesh(r, b => lathe(b, inner, 44, [0.86, 0.86, 0.9, 0], [8, 2.5], { inside: true })),
      handle: mesh(r, b => buildHandle(b, 0.17, 0.012, 0.015)),
      tex: T.granite, texIn: T.graniteInner
    };
  }

  function panMatrix(base, handleDir) {
    const yaw = Math.atan2(handleDir[0], handleDir[2]);
    return M4.chain(base, M4.rotY(yaw));
  }

  function buildCooktop(r, T) {
    const G = A.GLASS;
    const w = G.x1 - G.x0, d = G.z1 - G.z0;
    return {
      glass: mesh(r, b => b.quad([G.x0, 0, G.z1], [G.x1, 0, G.z1], [G.x1, 0, G.z0], [G.x0, 0, G.z0], [1, 1, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]])),
      frame: mesh(r, b => {
        const c = 0xb8bcc0;
        boxAt(b, G.x0 - 0.008, -0.004, (G.z0 + G.z1) / 2, 0.016, 0.012, d + 0.03, c);
        boxAt(b, G.x1 + 0.008, -0.004, (G.z0 + G.z1) / 2, 0.016, 0.012, d + 0.03, c);
        boxAt(b, (G.x0 + G.x1) / 2, -0.004, G.z0 - 0.008, w + 0.03, 0.012, 0.016, c);
      }),
      counter: mesh(r, b => {
        b.quad([G.x0 - 0.6, -0.01, G.z1 + 0.4], [G.x0 - 0.016, -0.01, G.z1 + 0.4], [G.x0 - 0.016, -0.01, G.z0 - 0.4], [G.x0 - 0.6, -0.01, G.z0 - 0.4], [1, 1, 1, 0], [[0, 0], [1.5, 0], [1.5, 2], [0, 2]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
        b.quad([G.x1 + 0.016, -0.01, G.z1 + 0.4], [G.x1 + 0.6, -0.01, G.z1 + 0.4], [G.x1 + 0.6, -0.01, G.z0 - 0.4], [G.x1 + 0.016, -0.01, G.z0 - 0.4], [1, 1, 1, 0], [[0, 0], [1.5, 0], [1.5, 2], [0, 2]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
      }),
      tex: T.glass, woodTex: T.wood
    };
  }

  function buildBox(r) {
    const outer = roundRect(BOX.w, BOX.d, BOX.rad, 5);
    const lower = roundRect(BOX.w - 0.01, BOX.d - 0.01, BOX.rad - 0.005, 5);
    const lip = roundRect(BOX.w + 0.008, BOX.d + 0.008, BOX.rad + 0.004, 5);
    return {
      walls: mesh(r, b => {
        wallLoop(b, lower, outer, 0, BOX.h, [0.92, 0.9, 0.86, 0], true);
        flatPoly(b, lower, 0.001, [0.9, 0.88, 0.84, 0], BOX.w, BOX.d);
      }),
      lip: mesh(r, b => {
        wallLoop(b, outer, lip, BOX.h, BOX.h + 0.003, [0.96, 0.95, 0.92, 0], true);
        wallLoop(b, lip, lip, BOX.h + 0.003, BOX.h - 0.002, [0.86, 0.85, 0.82, 0], true);
      }),
      content: mesh(r, b => flatPoly(b, roundRect(BOX.w - 0.008, BOX.d - 0.008, BOX.rad - 0.004, 5), 0, [1, 1, 1, 0], BOX.w, BOX.d))
    };
  }

  function buildBowl(r) {
    const outer = [[0.042, 0.0], [0.046, 0.006], [0.07, 0.022], [0.09, 0.042], [BOWL.rim, BOWL.h]];
    const inner = [[0, BOWL.floor], [0.04, BOWL.floor + 0.002], [0.064, 0.024], [0.084, 0.042], [BOWL.rim - 0.004, BOWL.h]];
    return {
      outer: mesh(r, b => { lathe(b, outer, 40, [0.93, 0.93, 0.92, 0.3]); disc(b, 0.042, 0.0, 40, 0xd8d8d4); }),
      inner: mesh(r, b => lathe(b, inner, 40, [0.96, 0.96, 0.95, 0.35], null, { inside: true })),
      rim: mesh(r, b => lathe(b, [[BOWL.rim - 0.004, BOWL.h], [BOWL.rim - 0.001, BOWL.h + 0.002], [BOWL.rim + 0.001, BOWL.h]], 40, [0.98, 0.98, 0.97, 0.4])),
      radiusAt: (y) => {
        for (let i = 1; i < inner.length; i++) if (y <= inner[i][1]) return inner[i - 1][0] + (inner[i][0] - inner[i - 1][0]) * (y - inner[i - 1][1]) / (inner[i][1] - inner[i - 1][1]);
        return BOWL.rim - 0.004;
      }
    };
  }

  function buildCan(r, h) {
    const R = 0.042;
    return {
      R, h,
      body: mesh(r, b => lathe(b, [[R, 0.002], [R, h - 0.004]], 28, [1, 1, 1, 0], [1, 1])),
      rims: mesh(r, b => {
        lathe(b, [[R - 0.002, 0], [R + 0.001, 0.002], [R + 0.001, 0.004], [R, 0.005]], 28, 0xc8ccd2);
        lathe(b, [[R, h - 0.005], [R + 0.001, h - 0.003], [R + 0.001, h], [R - 0.003, h + 0.001]], 28, 0xd4d8dc);
        disc(b, R - 0.002, 0.0, 28, 0xa8acb2);
      }),
      lid: mesh(r, b => disc(b, R - 0.002, 0, 28, [1, 1, 1, 0])),
      inside: mesh(r, b => {
        lathe(b, [[R - 0.003, h - 0.004], [R - 0.004, 0.006], [0, 0.006]], 24, 0xb8bcc2, null, { inside: true });
      }),
      pull: mesh(r, b => {
        tube(b, [[0, 0, 0], [0.012, 0, 0], [0.018, 0.0, 0.006], [0.012, 0, 0.012], [0, 0, 0.012]], [0.0015, 0.0015, 0.0015, 0.0015, 0.0015], 4, 0xd8dce0);
      })
    };
  }

  function buildJar(r, R, h, bodyCol, lidCol, content) {
    return {
      R, h,
      glass: mesh(r, b => lathe(b, [[R * 0.9, 0], [R, 0.01], [R, h * 0.82], [R * 0.8, h * 0.92], [R * 0.78, h]], 24, [0.86, 0.9, 0.92, 0])),
      fill: content ? mesh(r, b => lathe(b, [[0, 0.004], [R * 0.86, 0.006], [R * 0.95, 0.012], [R * 0.95, h * content], [0, h * content]], 22, bodyCol)) : null,
      label: mesh(r, b => lathe(b, [[R + 0.0012, h * 0.22], [R + 0.0012, h * 0.62]], 24, [1, 1, 1, 0], [1, 1])),
      lid: mesh(r, b => cyl(b, R * 0.82, h * 0.12, 22, lidCol, { topCol: lidCol }))
    };
  }

  function buildSpoon(r) {
    return mesh(r, b => {
      const col = [0.86, 0.87, 0.9, 0.12];
      tube(b, [[0, 0, 0.0], [0, 0.004, -0.06], [0, 0.002, -0.12], [0, -0.006, -0.145]], [0.0055, 0.0045, 0.003, 0.0028], 6, col);
      b.push(M4.translate(0, -0.01, -0.175), M4.scale(1, 0.32, 1.3));
      K.spherePatch(b, 0.021, 0.021, 0.021, 0, PI * 2, -PI / 2, 0.05, 12, 5, col);
      b.pop();
    });
  }

  function buildFork(r) {
    return mesh(r, b => {
      const col = [0.86, 0.87, 0.9, 0.12];
      tube(b, [[0, 0, 0.0], [0, 0.004, -0.07], [0, 0.0, -0.13], [0, -0.006, -0.15]], [0.0055, 0.0045, 0.003, 0.006], 6, col);
      b.push(M4.translate(0, -0.006, -0.152));
      boxAt(b, 0, 0, -0.004, 0.022, 0.003, 0.012, col);
      for (let i = 0; i < 4; i++) boxAt(b, -0.0085 + i * 0.0057, -0.002, -0.026, 0.0024, 0.0024, 0.04, col);
      b.pop();
    });
  }

  function buildSpatula(r) {
    return mesh(r, b => {
      const col = 0x4a8a8c;
      tube(b, [[0, 0, 0.02], [0, 0.002, -0.08], [0, 0.0, -0.17], [0, -0.004, -0.2]], [0.009, 0.008, 0.007, 0.007], 8, col);
      b.push(M4.translate(0, -0.006, -0.24));
      const pts = roundRect(0.058, 0.08, 0.022, 4);
      flatPoly(b, pts, 0.0035, col, 0.058, 0.08);
      flatPoly(b, pts.slice().reverse(), -0.0035, col, 0.058, 0.08);
      wallLoop(b, pts, pts, -0.0035, 0.0035, col, true);
      b.pop();
    });
  }

  function buildPlate(r) {
    return mesh(r, b => {
      lathe(b, [[0.0, 0.004], [0.075, 0.004], [0.1, 0.014], [0.112, 0.018], [0.11, 0.012], [0.07, 0.0], [0, 0]], 40, 0xf0f0ee);
    });
  }

  function chunkMesh(r, seed) {
    const g = rand(seed);
    return mesh(r, b => {
      const len = 0.03 + g() * 0.018, rad = 0.0085 + g() * 0.003;
      const skin = [0.4 + g() * 0.06, 0.4 + g() * 0.05, 0.42 + g() * 0.05, 0];
      const belly = [0.66, 0.62, 0.58, 0];
      const flesh = [0.74, 0.6, 0.48, 0];
      const pts = [], rs = [];
      for (let i = 0; i <= 4; i++) {
        pts.push([(i / 4 - 0.5) * len, rad * 0.62, (g() - 0.5) * 0.004]);
        rs.push(rad * (0.8 + g() * 0.35));
      }
      b.push(M4.scale(1, 0.66, 1));
      tube(b, pts, rs, 7, skin);
      b.push(M4.translate(pts[0][0], pts[0][1], pts[0][2]), M4.rotZ(PI / 2));
      disc(b, rs[0], 0, 7, flesh);
      b.pop();
      b.push(M4.translate(pts[4][0], pts[4][1], pts[4][2]), M4.rotZ(-PI / 2));
      disc(b, rs[4], 0, 7, flesh);
      b.pop();
      b.at(0, rad * 0.05, rad * 0.55, k => k.box(len * 0.9, rad * 0.5, rad * 0.4, belly));
      b.pop();
    });
  }

  function wedgeMesh(r, seed) {
    const g = rand(seed);
    return mesh(r, b => {
      const l = 0.03 + g() * 0.016, w = 0.014 + g() * 0.006, hh = 0.012 + g() * 0.004;
      const col = [1.0, 0.86, 0.34, 0];
      const side = [0.96, 0.78, 0.28, 0];
      K.spherePatch(b, l / 2, hh, w / 2, 0, PI * 2, 0, PI / 2, 10, 3, col);
      b.at(0, 0.0005, 0, k => k.ellipsoid(l / 2, 0.0005, w / 2, 10, 2, side));
    });
  }

  function buildTomato(r) {
    return {
      whole: mesh(r, b => {
        b.ellipsoid(0.026, 0.023, 0.026, 12, 8, [0.84, 0.16, 0.1, 0]);
        b.at(0, 0.022, 0, h => h.box(0.006, 0.004, 0.006, 0x3a5a1a));
      }),
      half: mesh(r, b => {
        K.spherePatch(b, 0.036, 0.03, 0.036, 0, PI * 2, -PI / 2, 0, 14, 5, [0.86, 0.2, 0.12, 0]);
        b.push(M4.rotX(-PI / 2));
        K.discXY(b, 0, 0, 0, 0.036, 16, [1, 1, 1, 0]);
        b.pop();
      })
    };
  }

  function cutFace(ctx, w, h) {
    ctx.fillStyle = '#e84a34';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c8281a';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.47, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f07a5a';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * PI * 2 + 0.4;
      ctx.beginPath();
      ctx.ellipse(w / 2 + Math.cos(a) * w * 0.24, h / 2 + Math.sin(a) * h * 0.24, w * 0.13, h * 0.09, a, 0, PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#f4e8a0';
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * PI * 2;
      ctx.beginPath();
      ctx.ellipse(w / 2 + Math.cos(a) * w * 0.25, h / 2 + Math.sin(a) * h * 0.25, 3, 2, a, 0, PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.06, 0, PI * 2);
    ctx.fill();
  }

  function buildBoard(r) {
    return mesh(r, b => {
      const w = 0.4, d = 0.28, t = 0.018;
      b.at(0, t / 2, 0, h => h.box(w, t, d, [1, 1, 1, 0], { faces: { top: [1, 1, 1, 0] } }));
      const groove = roundRect(w - 0.04, d - 0.04, 0.02, 3);
      for (let i = 0; i < groove.length; i++) {
        const p = groove[i], q = groove[(i + 1) % groove.length];
        b.quad([p[0], t + 0.0005, p[1]], [q[0], t + 0.0005, q[1]], [q[0] * 0.985, t + 0.0005, q[1] * 0.975], [p[0] * 0.985, t + 0.0005, p[1] * 0.975], [0.7, 0.52, 0.34, 0]);
      }
    });
  }

  function buildPouch(r) {
    return mesh(r, b => {
      const w = 0.12, h = 0.2, t = 0.025;
      const n = [0, 0, 1];
      b.quad([-w / 2, 0, t / 2], [w / 2, 0, t / 2], [w / 2, h, 0.004], [-w / 2, h, 0.004], [1, 1, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
      b.quad([w / 2, 0, -t / 2], [-w / 2, 0, -t / 2], [-w / 2, h, -0.004], [w / 2, h, -0.004], [0.2, 0.5, 0.24, 0]);
      b.quad([-w / 2, 0, -t / 2], [w / 2, 0, -t / 2], [w / 2, 0, t / 2], [-w / 2, 0, t / 2], 0x2a7a3a);
      b.at(w * 0.3, h + 0.012, 0, k => k.prism(10, 0.012, 0.012, -0.012, 0.011, 0.011, 0.0, 0xe8e8e4));
    });
  }

  function squiggle(r) {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      pts.push([-0.06 + u * 0.1 + S(u * 13) * 0.02, 0.006, -0.03 + S(u * 7.5) * 0.035 + u * 0.04]);
    }
    return mesh(r, b => tube(b, pts, pts.map((p, i) => 0.0075 * (1 - Math.abs(i / 40 - 0.5) * 0.6)), 6, [0.96, 0.92, 0.8, 0.05]));
  }

  function buildNoodleBrick(r) {
    return mesh(r, b => {
      const w = 0.092, h = 0.024;
      b.at(0, h / 2, 0, k => k.box(w, h, w, [1, 1, 1, 0], { uvScale: 10 }));
    });
  }

  function buildNoodleBox(r) {
    return mesh(r, b => {
      const w = 0.12, d = 0.135, h = 0.05;
      b.at(0, h / 2, 0, k => k.box(w, h, d, 0xf0eee6, { faces: { top: null } }));
      const n = [0, 1, 0];
      b.quad([-w / 2, h + 0.001, d / 2], [w / 2, h + 0.001, d / 2], [w / 2, h + 0.001, -d / 2], [-w / 2, h + 0.001, -d / 2], [1, 1, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
    });
  }

  function buildSoda(r) {
    return mesh(r, b => {
      lathe(b, [[0.026, 0], [0.033, 0.008], [0.033, 0.11], [0.027, 0.122]], 22, [1, 1, 1, 0], [1, 1]);
      disc(b, 0.027, 0.122, 22, 0xc8ccd2);
    });
  }

  function buildTub(r) {
    const w = 0.21, d = 0.15, h = 0.12;
    const top = roundRect(w, d, 0.04, 5), bot = roundRect(w - 0.03, d - 0.03, 0.03, 5);
    return {
      w, d, h,
      walls: mesh(r, b => {
        for (let i = 0; i < top.length; i++) {
          const j = (i + 1) % top.length;
          const a = [bot[i][0], 0, bot[i][1]], bb = [bot[j][0], 0, bot[j][1]], c = [top[j][0], h, top[j][1]], dd = [top[i][0], h, top[i][1]];
          const mid = [(top[i][0] + top[j][0]) / 2, 0, (top[i][1] + top[j][1]) / 2];
          const n = V3.norm([mid[0], 0.15, mid[2]]);
          b.quad(a, bb, c, dd, [0.95, 0.94, 0.9, 0.1], null, [n, n, n, n]);
        }
        flatPoly(b, bot, 0.001, 0xe8e6e0, w, d);
      }),
      rim: mesh(r, b => wallLoop(b, top, roundRect(w + 0.01, d + 0.01, 0.044, 5), h, h + 0.004, 0xf4f2ee, true)),
      label: mesh(r, b => {
        const zAt = (y) => (d - 0.03) / 2 + 0.015 * (y / h) + 0.0025;
        const n = [0, 0, 1];
        b.quad([-0.075, 0.012, zAt(0.012)], [0.075, 0.012, zAt(0.012)], [0.075, 0.1, zAt(0.1)], [-0.075, 0.1, zAt(0.1)], [1, 1, 1, 0], [[0.36, 0.03], [0.66, 0.03], [0.66, 0.95], [0.36, 0.95]], [n, n, n, n]);
      }),
      content: mesh(r, b => flatPoly(b, roundRect(w - 0.012, d - 0.012, 0.036, 5), 0, [1, 1, 1, 0], w, d))
    };
  }

  function buildTree(r) {
    return mesh(r, b => {
      const g = rand(71);
      for (let i = 0; i < 7; i++) {
        const y0 = 0.25 + i * 0.22, rad = 0.62 - i * 0.08;
        b.at(0, y0, 0, k => k.prism(9, rad, rad, 0, rad * 0.35, rad * 0.35, 0.34, [1, 1, 1, 0], { phase: g() }));
      }
      b.at(0, 0, 0, k => k.prism(6, 0.04, 0.04, 0, 0.04, 0.04, 0.3, 0x3a2a1e));
    });
  }

  function treeLights() {
    const g = rand(72);
    const out = [];
    for (let i = 0; i < 90; i++) {
      const y = 0.3 + g() * 1.5;
      const rad = 0.6 * (1 - (y - 0.25) / 1.75) + 0.05;
      const a = g() * PI * 2;
      out.push({ p: [S(a) * rad, y, C(a) * rad], col: g() < 0.55 ? [0.3, 0.5, 1.0] : g() < 0.6 ? [0.3, 1.0, 0.7] : [1.0, 0.9, 0.7], ph: g() * 6 });
    }
    return out;
  }

  function buildChair(r) {
    return mesh(r, b => {
      const col = 0x161618;
      b.at(0, 0.46, 0, k => k.box(0.52, 0.1, 0.5, col));
      b.push(M4.translate(0, 0.52, -0.24), M4.rotX(-0.12));
      b.at(0, 0.36, 0, k => k.box(0.54, 0.74, 0.12, col));
      b.at(0, 0.36, 0.07, k => k.box(0.44, 0.6, 0.04, 0x222226));
      b.pop();
      [-1, 1].forEach(s => b.at(s * 0.3, 0.62, 0.02, k => k.box(0.07, 0.06, 0.42, col)));
      b.at(0, 0.2, 0, k => k.prism(8, 0.03, 0.03, 0, 0.03, 0.03, 0.26, 0x2a2a2e));
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * PI * 2;
        b.push(M4.translate(0, 0.05, 0), M4.rotY(a));
        b.at(0, 0, 0.17, k => k.box(0.04, 0.04, 0.34, 0x1e1e22));
        b.pop();
      }
    });
  }

  function buildCat(r) {
    const fur = [1, 1, 1, 0];
    return {
      body: mesh(r, b => {
        const L = 0.5, nz = 14, n = 14;
        const prof = (z) => {
          const k = Math.max(0, 1 - Math.pow(Math.abs(2 * z / L), 2.4));
          const chest = z > 0 ? 1.05 : 1;
          return [0.075 * Math.pow(k, 0.5) * chest, 0.085 * Math.pow(k, 0.5) * (z < 0 ? 1.04 : 1)];
        };
        for (let j = 0; j < nz; j++) for (let i = 0; i < n; i++) {
          const z0 = -L / 2 + (L * j) / nz, z1 = -L / 2 + (L * (j + 1)) / nz;
          const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
          const P = (z, a) => { const q = prof(z); return [S(a) * q[0], C(a) * q[1], z]; };
          const N = (z, a) => V3.norm([S(a) / 0.075, C(a) / 0.085, 0]);
          b.quad(P(z0, a0), P(z0, a1), P(z1, a1), P(z1, a0), fur, [[i / n, j / nz], [(i + 1) / n, j / nz], [(i + 1) / n, (j + 1) / nz], [i / n, (j + 1) / nz]], [N(z0, a0), N(z0, a1), N(z1, a1), N(z1, a0)]);
        }
      }),
      head: mesh(r, b => {
        b.ellipsoid(0.052, 0.046, 0.05, 10, 8, 0xd88a44);
        b.at(0, -0.016, 0.038, k => k.ellipsoid(0.026, 0.02, 0.022, 8, 6, 0xf4ece4));
        b.at(0, -0.006, 0.058, k => k.ellipsoid(0.006, 0.005, 0.004, 6, 4, 0xd88a8a));
        [-1, 1].forEach(s => {
          b.push(M4.translate(s * 0.03, 0.036, -0.004), M4.rotZ(-s * 0.25));
          b.prism(3, 0.018, 0.01, 0, 0.002, 0.002, 0.034, 0xc87a3a);
          b.pop();
        });
        [-1, 1].forEach(s => b.at(s * 0.019, 0.008, 0.043, k => k.ellipsoid(0.007, 0.008, 0.004, 6, 4, 0x6a6a1a)));
      }),
      leg: mesh(r, b => {
        tube(b, [[0, 0, 0], [0, -0.1, 0.0], [0, -0.2, 0.012]], [0.022, 0.018, 0.015], 7, 0xf2e8de);
      }),
      tailSeg: mesh(r, b => tube(b, [[0, 0, 0], [0, 0, -0.065]], [0.016, 0.014], 6, 0xd07e3c))
    };
  }

  function buildHeadset(r) {
    return mesh(r, b => {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const a = -PI / 2 + (i / 12) * PI;
        pts.push([S(a) * 0.118, C(a) * 0.12 + 0.02, -0.01]);
      }
      tube(b, pts, pts.map(() => 0.009), 6, 0x18181c);
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * 0.118, 0.0, -0.005), M4.rotZ(PI / 2));
        b.prism(12, 0.045, 0.045, -0.018, 0.045, 0.045, 0.018, 0x141416, { capBottom: true });
        b.pop();
      });
    });
  }

  function buildSalad(r) {
    return mesh(r, b => {
      const w = 0.2, h = 0.07;
      const top = roundRect(w, w, 0.03, 4), bot = roundRect(w * 0.6, w * 0.6, 0.02, 4);
      for (let i = 0; i < top.length; i++) {
        const j = (i + 1) % top.length;
        b.quad([bot[i][0], 0, bot[i][1]], [bot[j][0], 0, bot[j][1]], [top[j][0], h, top[j][1]], [top[i][0], h, top[i][1]], 0xf2f0ec);
      }
      flatPoly(b, roundRect(w * 0.86, w * 0.86, 0.03, 4), h * 0.72, 0xe8e0c8, w, w);
      const g = rand(73);
      for (let i = 0; i < 26; i++) {
        const tomato = g() < 0.55;
        b.at((g() - 0.5) * w * 0.7, h * 0.75, (g() - 0.5) * w * 0.7, k => k.box(0.022, 0.012, 0.018, tomato ? [0.82, 0.14, 0.12, 0] : [0.78, 0.86, 0.6, 0]));
      }
    });
  }

  function buildMic(r) {
    return mesh(r, b => {
      tube(b, [[0, 0, 0], [0.0, 0.9, 0.0], [0.25, 1.25, 0.1], [0.45, 1.2, 0.25]], [0.012, 0.012, 0.01, 0.01], 6, 0x1a1a1c);
      b.at(0.47, 1.18, 0.27, k => k.ellipsoid(0.03, 0.05, 0.03, 8, 6, 0x222226));
      b.push(M4.translate(0.52, 1.16, 0.34), M4.rotX(PI / 2));
      K.discXY(b, 0, 0, 0, 0.07, 18, [0.1, 0.1, 0.12, 0]);
      b.pop();
    });
  }

  function buildMicrowave(r) {
    return mesh(r, b => {
      const w = 0.34, h = 0.22, d = 0.32;
      const n = (x, y, z) => [x, y, z];
      const cw = [1, 1, 1, 0];
      b.quad([-w / 2, 0, -d / 2], [w / 2, 0, -d / 2], [w / 2, h, -d / 2], [-w / 2, h, -d / 2], cw, [[0, 0], [2, 0], [2, 1.3], [0, 1.3]], [n(0, 0, 1), n(0, 0, 1), n(0, 0, 1), n(0, 0, 1)]);
      b.quad([-w / 2, 0, d / 2], [-w / 2, 0, -d / 2], [-w / 2, h, -d / 2], [-w / 2, h, d / 2], cw, [[0, 0], [2, 0], [2, 1.3], [0, 1.3]], [n(1, 0, 0), n(1, 0, 0), n(1, 0, 0), n(1, 0, 0)]);
      b.quad([w / 2, 0, -d / 2], [w / 2, 0, d / 2], [w / 2, h, d / 2], [w / 2, h, -d / 2], cw, [[0, 0], [2, 0], [2, 1.3], [0, 1.3]], [n(-1, 0, 0), n(-1, 0, 0), n(-1, 0, 0), n(-1, 0, 0)]);
      b.quad([-w / 2, h, -d / 2], [w / 2, h, -d / 2], [w / 2, h, d / 2], [-w / 2, h, d / 2], cw, [[0, 0], [2, 0], [2, 2], [0, 2]], [n(0, -1, 0), n(0, -1, 0), n(0, -1, 0), n(0, -1, 0)]);
      b.quad([-w / 2, 0, d / 2], [w / 2, 0, d / 2], [w / 2, 0, -d / 2], [-w / 2, 0, -d / 2], 0xe8e8e4);
      b.at(w / 2 - 0.004, h * 0.55, -0.05, k => k.box(0.004, 0.08, 0.1, 0xc8c8c4));
    });
  }

  function buildTurntable(r) {
    return mesh(r, b => lathe(b, [[0, 0.012], [0.13, 0.012], [0.14, 0.016], [0.14, 0.008]], 36, [0.8, 0.84, 0.86, 0.1]));
  }

  function buildSteam(r) {
    return mesh(r, b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));
  }

  function build(r) {
    const tex = {};
    const T = new Proxy({}, {
      get: (o, k) => tex[k] || (tex[k] = r.texture(texSize(k), A.DRAW[k], texOpts(k)))
    });
    const P = {
      T,
      fry: buildFryPan(r, T),
      sauce: buildSaucepan(r, T),
      cooktop: buildCooktop(r, T),
      box: buildBox(r),
      bowl: buildBowl(r),
      can: buildCan(r, 0.046),
      canTall: buildCan(r, 0.058),
      jar: buildJar(r, 0.04, 0.115, [0.62, 0.1, 0.06, 0], 0xc8a43a, 0.86),
      jarVlad: buildJar(r, 0.038, 0.12, [0.6, 0.08, 0.06, 0], 0xf0c81a, 0.9),
      jarPaste: buildJar(r, 0.034, 0.1, [0.16, 0.06, 0.05, 0], 0x1a1a1a, 0.9),
      pickles: buildJar(r, 0.05, 0.15, [0.5, 0.6, 0.3, 0.05], 0xb8bcc0, 0.82),
      spoon: buildSpoon(r),
      fork: buildFork(r),
      spatula: buildSpatula(r),
      plate: buildPlate(r),
      chunks: [1, 2, 3, 4, 5, 6].map(s => chunkMesh(r, 100 + s)),
      wedges: [1, 2, 3, 4].map(s => wedgeMesh(r, 200 + s)),
      tomato: buildTomato(r),
      cutTex: r.texture(128, cutFace, { clamp: true }),
      board: buildBoard(r),
      pouch: buildPouch(r),
      squiggle: squiggle(r),
      brick: buildNoodleBrick(r),
      noodleBox: buildNoodleBox(r),
      soda: buildSoda(r),
      tub: buildTub(r),
      tree: buildTree(r),
      lights: treeLights(),
      chair: buildChair(r),
      cat: buildCat(r),
      headset: buildHeadset(r),
      salad: buildSalad(r),
      mic: buildMic(r),
      microwave: buildMicrowave(r),
      turntable: buildTurntable(r),
      quad: buildSteam(r),
      disc: mesh(r, b => disc(b, 1, 0, 40, [1, 1, 1, 0])),
      unitQuad: mesh(r, b => b.quad([-0.5, 0, 0.5], [0.5, 0, 0.5], [0.5, 0, -0.5], [-0.5, 0, -0.5], [1, 1, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]))
    };
    return P;
  }

  function texSize(k) {
    if (k === 'glass' || k === 'store' || k === 'stream' || k === 'canNatural' || k === 'canTomato' || k === 'canVlad' || k === 'tub') return 1024;
    if (k === 'wood' || k === 'board' || k === 'felt' || k === 'feltSun' || k === 'granite' || k === 'graniteInner' || k === 'mayo' || k === 'noodleLid') return 512;
    return 256;
  }

  function texOpts(k) {
    if (k === 'store' || k === 'stream') return { height: 576, clamp: true };
    if (k === 'canNatural' || k === 'canTomato' || k === 'canVlad' || k === 'tub') return { height: 256 };
    if (k === 'mayo') return { height: 768, clamp: true };
    if (k === 'noodleLid') return { height: 384, clamp: true };
    if (k === 'jarSauce' || k === 'jarPaste' || k === 'soda') return { height: 128 };
    if (k === 'reflection' || k === 'glow') return { clamp: true };
    return {};
  }

  window.SairaProps = { FRY, SAUCE, BOX, BOWL, build, panMatrix, lathe, disc, roundRect, flatPoly };
})();
