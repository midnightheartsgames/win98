(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Rig = window.YouVidRig;

  const D = { chestY: 0.12, neckY: 0.415, headY: 0.115, shX: 0.228, shY: 0.335, upper: 0.29, fore: 0.27, hipX: 0.115, hipY: -0.05, thigh: 0.44, shin: 0.43 };

  const COL = {
    suit: 0xb5442f, suitDk: 0x84301f, suitHi: 0xc8553a, strap: 0x3b322c, strapDk: 0x29231f, glove: 0x34302d, gloveDk: 0x24211f, gloveHi: 0x47423e,
    boot: 0x2b2725, sole: 0x1b1918, belt: 0x272320, buckle: 0x8c8478, mask: 0x393735, maskDk: 0x242322, rim: 0x5a5046, rimHi: 0x7e7062,
    lens: 0x1e120c, filter: 0x6c604f, filterDk: 0x3e362c, can: 0x8e8c86, canDk: 0x5e5c58, canBand: 0xcf6a2c, tank: 0xd6c9ad, tankDk: 0xa4987f,
    tankTop: 0xe2a234, knob: 0x3b3a38, patch: 0xe3b27a, patchIn: 0xb8442e,
    candyA: 0xf6a8c8, candyB: 0xfbe08a, candyC: 0xa8e4b0, candyD: 0x9ac8f2, candyE: 0xc8a8ee, candyTop: 0xf48cb4, dot: 0xfffaf2, key: 0xe8d08e, keyDk: 0xb89a52,
    jar: 0xf2e2b0, jarLid: 0xe8c040
  };

  const SUIT_MAT = { spec: [0.12, 9], rim: 0.85 };
  const RUBBER_MAT = { spec: [0.28, 18], rim: 0.7 };
  const METAL_MAT = { spec: [0.55, 26], rim: 0.6 };
  const LENS_MAT = { spec: [1.1, 90], rim: 0.25 };
  const TANK_MAT = { spec: [0.4, 22], rim: 0.6 };
  const CANDY_MAT = { spec: [0.35, 16], rim: 0.9 };

  const HOOD = { c: [0, 0.012, -0.006], rx: 0.101, ry: 0.122, rz: 0.106 };
  const HEAD_SCALE = M4.scale(1.08, 1.08, 1.08);
  const MASK = { a: 1.12, p0: -0.24, up: 0.64, down: 0.84, lensA: 0.43, lensP: 0.13, lensR: 0.029, filterP: -0.56, filterR: 0.041, filterL: 0.05 };

  const g2 = (x, s) => Math.exp(-(x / s) * (x / s));

  function hoodRaw(a, p) {
    const ca = C(a), sa = S(a), cp = C(p), sp = S(p);
    const front = Math.max(0, ca);
    const low = clamp((-0.4 - p) / 0.65, 0, 1);
    const flare = Math.pow(low, 1.5) * (1 - 0.6 * front * front);
    const push = 0.013 * front * front * g2(p + 0.2, 0.55) + 0.01 * front * front * g2(p + 0.62, 0.22);
    const out = flare * 0.075;
    const rz = ca > 0 ? HOOD.rz : HOOD.rz * 0.97;
    return [HOOD.c[0] + sa * (cp * HOOD.rx + out), HOOD.c[1] + sp * HOOD.ry - low * 0.03, HOOD.c[2] + ca * (cp * rz + out * (ca > 0 ? 0.3 : 1)) + push * ca];
  }

  function hoodN(a, p) {
    const e = 0.004;
    const pa = hoodRaw(a + e, p), pb = hoodRaw(a - e, p);
    const qa = hoodRaw(a, Math.min(p + e, 1.569)), qb = hoodRaw(a, Math.max(p - e, -1.569));
    const n = V3.cross(V3.sub(pa, pb), V3.sub(qa, qb));
    const len = V3.len(n);
    return len > 1e-9 ? V3.mul(n, 1 / len) : V3.norm(V3.sub(hoodRaw(a, p), HOOD.c));
  }

  function maskAP(rho, th) {
    return [MASK.a * rho * C(th), MASK.p0 + (S(th) > 0 ? MASK.up : MASK.down) * rho * S(th)];
  }

  function maskOff(rho) {
    if (rho <= 1) return 0.005 + 0.011 * (1 - rho * rho);
    return lerp(0.005, 0.0012, clamp((rho - 1) / 0.05, 0, 1));
  }

  function maskPt(a, p, rho) {
    return V3.add(hoodRaw(a, p), V3.mul(hoodN(a, p), maskOff(rho)));
  }

  function maskFrame(a, p, lift) {
    const rho = Math.min(1, Math.hypot(a / MASK.a, (p - MASK.p0) / (p > MASK.p0 ? MASK.up : MASK.down)));
    const c = V3.add(hoodRaw(a, p), V3.mul(hoodN(a, p), maskOff(rho) + (lift || 0)));
    const n = hoodN(a, p);
    let x = V3.cross([0, 1, 0], n);
    x = V3.len(x) < 1e-5 ? [1, 0, 0] : V3.norm(x);
    const y = V3.cross(n, x);
    return { c, n, x, y };
  }

  function frameMat(f, extra) {
    const m = new Float32Array([f.x[0], f.x[1], f.x[2], 0, f.y[0], f.y[1], f.y[2], 0, f.n[0], f.n[1], f.n[2], 0, f.c[0], f.c[1], f.c[2], 1]);
    return extra ? M4.mul(m, extra) : m;
  }

  function buildHood(b) {
    const NU = 44, NV = 26;
    const p0 = -1.35, p1 = 1.565;
    const P = (i, j) => [(i / NU) * PI * 2 - PI, p0 + (p1 - p0) * (j / NV)];
    const col = (a, p) => (p < -1.1 ? COL.suitDk : COL.suit);
    for (let j = 0; j < NV; j++) {
      for (let i = 0; i < NU; i++) {
        const q = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
        b.quad(...q.map(([a, p]) => hoodRaw(a, p)), q.map(([a, p]) => rgb(col(a, p))), null, q.map(([a, p]) => hoodN(a, p)));
      }
    }
    const top = hoodRaw(0, 1.5699);
    for (let i = 0; i < NU; i++) {
      const [a0] = P(i, NV), [a1] = P(i + 1, NV);
      b.tri(top, hoodRaw(a1, p1), hoodRaw(a0, p1), COL.suit, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0]]);
    }
    return b;
  }

  function buildMask(b) {
    const NR = 12, NT = 44;
    const R = (i) => (i <= NR ? i / NR : 1 + (i - NR) * 0.025);
    for (let i = 0; i < NR + 2; i++) {
      for (let k = 0; k < NT; k++) {
        const th0 = (k / NT) * PI * 2, th1 = ((k + 1) / NT) * PI * 2;
        const r0 = R(i), r1 = R(i + 1);
        const pts = [[r0, th0], [r0, th1], [r1, th1], [r1, th0]].map(([r, th]) => {
          const [a, p] = maskAP(Math.min(r, 1.06), th);
          return { q: maskPt(a, p, r), n: hoodN(a, p), edge: r > 1 };
        });
        const cols = pts.map(o => rgb(o.edge ? COL.maskDk : COL.mask));
        b.quad(pts[0].q, pts[1].q, pts[2].q, pts[3].q, cols, null, pts.map(o => o.n));
      }
    }
    return b;
  }

  function torus(b, R, r, nu, nv, col, from, to) {
    const a0 = from === undefined ? 0 : from, a1 = to === undefined ? PI * 2 : to;
    const pt = (u, v) => {
      const a = a0 + (a1 - a0) * u, w = v * PI * 2;
      const cx = C(a) * R, cy = S(a) * R;
      const n = [C(a) * C(w), S(a) * C(w), S(w)];
      return { p: [cx + n[0] * r, cy + n[1] * r, n[2] * r], n };
    };
    for (let i = 0; i < nu; i++) {
      for (let j = 0; j < nv; j++) {
        const A = pt(i / nu, j / nv), B = pt((i + 1) / nu, j / nv), Cc = pt((i + 1) / nu, (j + 1) / nv), Dd = pt(i / nu, (j + 1) / nv);
        b.quad(A.p, B.p, Cc.p, Dd.p, col, null, [A.n, B.n, Cc.n, Dd.n]);
      }
    }
    return b;
  }

  function lensFrames() {
    return [-1, 1].map(s => {
      const f = maskFrame(s * MASK.lensA, MASK.lensP, 0);
      const n = V3.norm(V3.lerp(f.n, [s * 0.18, 0.05, 1], 0.45));
      let x = V3.norm(V3.cross([0, 1, 0], n));
      const y = V3.cross(n, x);
      return { c: f.c, n, x, y, s };
    });
  }

  function buildLensRim(b) {
    torus(b, MASK.lensR + 0.004, 0.0072, 30, 8, COL.rim);
    b.at(0, 0, -0.004, h => torus(h, MASK.lensR + 0.0105, 0.004, 30, 6, COL.maskDk));
    return b;
  }

  function buildLensGlass(b) {
    b.ellipsoid(MASK.lensR + 0.002, MASK.lensR + 0.002, 0.007, 22, 8, COL.lens);
    return b;
  }

  function filterFrame() {
    const f = maskFrame(0, MASK.filterP, 0);
    const n = V3.norm(V3.add(f.n, [0, -0.32, 0.22]));
    const x = [1, 0, 0];
    const y = V3.norm(V3.cross(n, x));
    return { c: V3.add(f.c, V3.mul(f.n, -0.006)), n, x, y };
  }

  function buildFilter(b) {
    const L = MASK.filterL, R0 = MASK.filterR;
    b.push(M4.rotX(PI / 2));
    b.prism(26, R0 * 0.92, R0 * 0.92, 0, R0, R0, L * 0.45, COL.filterDk, { capTop: false });
    b.prism(26, R0, R0, L * 0.45, R0 * 1.04, R0 * 1.04, L, COL.filter, { capTop: false });
    [0.42, 0.62, 0.82].forEach(f => b.at(0, L * f, 0, h => h.prism(26, R0 * 1.07, R0 * 1.07, -0.003, R0 * 1.07, R0 * 1.07, 0.003, COL.filterDk, { capTop: false })));
    b.pop();
    b.at(0, 0, L + 0.0005, h => K.discXY(h, 0, 0, 0, R0 * 1.02, 26, rgb(COL.filter)));
    return b;
  }

  function buildGrill(b) {
    K.discXY(b, 0, 0, 0, MASK.filterR * 0.9, 26, rgb(0xffffff));
    return b;
  }

  function sideFrame() {
    const f = maskFrame(-0.95, -0.42, -0.003);
    return f;
  }

  function buildSideCan(b) {
    b.push(M4.rotX(PI / 2));
    b.prism(20, 0.026, 0.026, 0, 0.027, 0.027, 0.03, COL.filterDk, { capTop: false });
    b.at(0, 0.03, 0, h => h.prism(20, 0.029, 0.029, -0.004, 0.029, 0.029, 0.004, COL.rim, { capTop: false }));
    b.pop();
    b.at(0, 0, 0.0305, h => K.discXY(h, 0, 0, 0, 0.027, 20, rgb(COL.filter)));
    b.at(0, 0, 0.031, h => K.discXY(h, 0, 0, 0, 0.012, 14, rgb(COL.filterDk)));
    return b;
  }

  function buildStraps(b) {
    const band = (p, a0, a1, w) => {
      const n = 26;
      for (let i = 0; i < n; i++) {
        const u0 = lerp(a0, a1, i / n), u1 = lerp(a0, a1, (i + 1) / n);
        const q = [[u0, p - w], [u1, p - w], [u1, p + w], [u0, p + w]];
        b.quad(...q.map(([a, pp]) => V3.add(hoodRaw(a, pp), V3.mul(hoodN(a, pp), 0.0035))), COL.maskDk, null, q.map(([a, pp]) => hoodN(a, pp)));
      }
    };
    band(0.3, 1.0, PI * 2 - 1.0, 0.055);
    band(-0.62, 1.02, PI * 2 - 1.02, 0.06);
    [-1, 1].forEach(s => {
      const n = 10;
      for (let i = 0; i < n; i++) {
        const k0 = i / n, k1 = (i + 1) / n;
        const P = (k, d) => [s * (1.08 + d), lerp(0.3, -0.62, k)];
        const q = [P(k0, -0.05), P(k0, 0.05), P(k1, 0.05), P(k1, -0.05)];
        b.quad(...q.map(([a, pp]) => V3.add(hoodRaw(a, pp), V3.mul(hoodN(a, pp), 0.0038))), COL.maskDk, null, q.map(([a, pp]) => hoodN(a, pp)));
      }
    });
    return b;
  }

  function paintLabel(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(H * 0.62)}px Arial, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText('OPTICAL MASK', W / 2, H * 0.46);
    ctx.font = `${Math.round(H * 0.22)}px Arial, sans-serif`;
    ctx.fillText('MODEL 98 · FILTER TYPE B', W / 2, H * 0.88);
  }

  function paintGrill(ctx, W, H) {
    ctx.fillStyle = '#7a6c58';
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    ctx.fillStyle = '#2c2620';
    for (let i = -6; i <= 6; i++) {
      const x = cx + i * W * 0.068;
      const half = Math.sqrt(Math.max(0, 1 - Math.pow((x - cx) / (W * 0.46), 2))) * H * 0.42;
      ctx.fillRect(x - W * 0.018, cy - half, W * 0.036, half * 2);
    }
    ctx.strokeStyle = '#9a8a70';
    ctx.lineWidth = W * 0.04;
    ctx.beginPath();
    ctx.arc(cx, cy, W * 0.47, 0, PI * 2);
    ctx.stroke();
  }

  function paintSuit(ctx, W, H) {
    ctx.fillStyle = '#be4a33';
    ctx.fillRect(0, 0, W, H);
    const g = rand(71);
    for (let i = 0; i < 26; i++) {
      const x = g() * W, y = g() * H, len = 40 + g() * 120, ang = (g() - 0.5) * 1.2 + PI / 2;
      const gr = ctx.createLinearGradient(x, y, x + C(ang) * len, y + S(ang) * len);
      gr.addColorStop(0, 'rgba(90,20,12,0)');
      gr.addColorStop(0.5, `rgba(90,20,12,${0.14 + g() * 0.14})`);
      gr.addColorStop(1, 'rgba(90,20,12,0)');
      ctx.strokeStyle = gr;
      ctx.lineWidth = 5 + g() * 10;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + (g() - 0.5) * 40, y + len * 0.5, x + C(ang) * len, y + S(ang) * len);
      ctx.stroke();
    }
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = `rgba(40,30,26,${0.04 + g() * 0.08})`;
      ctx.beginPath();
      ctx.ellipse(g() * W, g() * H, 10 + g() * 40, 6 + g() * 24, g() * PI, 0, PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = `rgba(${g() < 0.5 ? '0,0,0' : '255,220,200'},${g() * 0.05})`;
      ctx.fillRect(g() * W, g() * H, 2, 2);
    }
  }

  function ringLoft(b, rings, sides, colAt, opts) {
    const o = opts || {};
    const ph = o.phase === undefined ? PI : o.phase;
    const y0 = rings[0].y, y1 = rings[rings.length - 1].y;
    const pt = (r, i) => {
      const a = (i / sides) * PI * 2 + ph;
      return [(r.cx || 0) + S(a) * r.rx, r.y, (r.cz || 0) + C(a) * r.rz];
    };
    const nrm = (r, i, slope) => {
      const a = (i / sides) * PI * 2 + ph;
      return V3.norm([S(a) / r.rx, slope, C(a) / r.rz]);
    };
    for (let j = 0; j < rings.length - 1; j++) {
      const r0 = rings[j], r1 = rings[j + 1];
      const dy = r1.y - r0.y;
      if (Math.abs(dy) < 1e-6) continue;
      const slope = (((r0.rx + r0.rz) - (r1.rx + r1.rz)) / 2) / dy;
      for (let i = 0; i < sides; i++) {
        const u0 = i / sides, u1 = (i + 1) / sides;
        const v0 = (r0.y - y0) / (y1 - y0), v1 = (r1.y - y0) / (y1 - y0);
        const cols = colAt ? [colAt(u0, r0.y), colAt(u1, r0.y), colAt(u1, r1.y), colAt(u0, r1.y)] : [0xffffff, 0xffffff, 0xffffff, 0xffffff];
        b.quad(pt(r0, i), pt(r0, i + 1), pt(r1, i + 1), pt(r1, i), cols.map(c => rgb(c)), [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], [nrm(r0, i, slope), nrm(r0, i + 1, slope), nrm(r1, i + 1, slope), nrm(r1, i, slope)]);
      }
    }
    if (o.capTop) {
      const r = rings[rings.length - 1];
      for (let i = 0; i < sides; i++) b.tri([r.cx || 0, r.y, r.cz || 0], pt(r, i), pt(r, i + 1), rgb(colAt ? colAt(i / sides, r.y) : 0xffffff), null, [[0, 1, 0], [0, 1, 0], [0, 1, 0]]);
    }
    if (o.capBottom) {
      const r = rings[0];
      for (let i = 0; i < sides; i++) b.tri([r.cx || 0, r.y, r.cz || 0], pt(r, i + 1), pt(r, i), rgb(colAt ? colAt(i / sides, r.y) : 0xffffff), null, [[0, -1, 0], [0, -1, 0], [0, -1, 0]]);
    }
    return b;
  }

  const TORSO = [
    [-0.16, 0.19, 0.15, 0.004], [-0.07, 0.2, 0.158, 0.01], [0.03, 0.212, 0.164, 0.016], [0.13, 0.222, 0.166, 0.018], [0.22, 0.232, 0.161, 0.014],
    [0.28, 0.236, 0.152, 0.008], [0.322, 0.226, 0.142, 0.0], [0.355, 0.2, 0.128, -0.006], [0.385, 0.165, 0.112, -0.008], [0.41, 0.126, 0.098, -0.006], [0.43, 0.096, 0.086, -0.002]
  ].map(([y, rx, rz, cz]) => ({ y, rx, rz, cz }));

  function torsoRing(y) {
    for (let i = 0; i < TORSO.length - 1; i++) {
      const a = TORSO[i], b = TORSO[i + 1];
      if (y <= b.y || i === TORSO.length - 2) {
        const k = clamp((y - a.y) / (b.y - a.y), 0, 1);
        return { rx: lerp(a.rx, b.rx, k), rz: lerp(a.rz, b.rz, k), cz: lerp(a.cz, b.cz, k) };
      }
    }
    return TORSO[TORSO.length - 1];
  }

  function torsoSurf(ang, y, lift) {
    const R = torsoRing(y);
    const l = lift || 0;
    return [S(ang) * (R.rx + l), y, R.cz + C(ang) * (R.rz + l)];
  }

  function torsoNormal(ang, y) {
    const R = torsoRing(y);
    return V3.norm([S(ang) / R.rx, 0.12, C(ang) / R.rz]);
  }

  function ribbon(b, path, w, lift, col) {
    for (let i = 0; i < path.length - 1; i++) {
      const q0 = path[i], q1 = path[i + 1];
      const p0 = torsoSurf(q0.ang, q0.y, lift), p1 = torsoSurf(q1.ang, q1.y, lift);
      const n0 = torsoNormal(q0.ang, q0.y), n1 = torsoNormal(q1.ang, q1.y);
      const t = V3.norm(V3.sub(p1, p0));
      const w0 = V3.mul(V3.norm(V3.cross(n0, t)), w), w1 = V3.mul(V3.norm(V3.cross(n1, t)), w);
      b.quad(V3.sub(p0, w0), V3.add(p0, w0), V3.add(p1, w1), V3.sub(p1, w1), col, null, [n0, n0, n1, n1]);
    }
  }

  function line(a0, y0, a1, y1, n) {
    const out = [];
    for (let i = 0; i <= n; i++) out.push({ ang: lerp(a0, a1, i / n), y: lerp(y0, y1, i / n) });
    return out;
  }

  function buildTorso(b) {
    ringLoft(b, TORSO, 32, null, {});
    return b;
  }

  function buildCowl(b) {
    const rings = [{ y: 0.28, rx: 0.245, rz: 0.16, cz: 0.006 }, { y: 0.32, rx: 0.24, rz: 0.155, cz: 0.002 }, { y: 0.36, rx: 0.222, rz: 0.146, cz: -0.002 },
      { y: 0.395, rx: 0.19, rz: 0.133, cz: -0.004 }, { y: 0.425, rx: 0.15, rz: 0.116, cz: -0.004 }, { y: 0.448, rx: 0.112, rz: 0.1, cz: 0.0 }];
    ringLoft(b, rings, 32, (u, y) => (y < 0.29 ? COL.suitDk : COL.suit), {});
    return b;
  }

  function buildHarness(b, land) {
    [-1, 1].forEach(s => {
      ribbon(b, line(s * 0.44, 0.3, s * 0.4, -0.12, 14), 0.024, 0.014, COL.strap);
      ribbon(b, line(PI - s * 0.46, 0.3, PI - s * 0.42, -0.1, 14), 0.024, 0.014, COL.strap);
    });
    const band = line(0.78, 0.29, -0.05, 0.02, 16);
    ribbon(b, band, 0.026, 0.02, COL.strapDk);
    [0.2, 0.38, 0.56, 0.74].forEach(k => {
      const ang = lerp(0.78, -0.05, k), y = lerp(0.29, 0.02, k);
      const p = torsoSurf(ang, y, 0.048);
      const n = torsoNormal(ang, y);
      const along = V3.norm(V3.sub(torsoSurf(-0.05, 0.02, 0.048), torsoSurf(0.78, 0.29, 0.048)));
      const axis = V3.norm(V3.cross(n, along));
      const z = n;
      const y2 = V3.norm(V3.cross(z, axis));
      b.push(new Float32Array([y2[0], y2[1], y2[2], 0, axis[0], axis[1], axis[2], 0, z[0], z[1], z[2], 0, p[0], p[1], p[2], 1]));
      const body = land ? COL.jar : COL.can, end = land ? COL.jarLid : COL.canDk, mid = land ? 0xf8f0d8 : COL.canBand;
      b.prism(14, 0.024, 0.024, -0.04, 0.024, 0.024, 0.04, body, { capTop: false });
      b.at(0, 0, 0, h => h.prism(14, 0.0248, 0.0248, -0.013, 0.0248, 0.0248, 0.013, mid, { capTop: false }));
      b.at(0, 0.04, 0, h => h.prism(14, 0.022, 0.022, 0, 0.02, 0.02, 0.008, end, {}));
      b.at(0, -0.04, 0, h => h.prism(14, 0.02, 0.02, -0.008, 0.022, 0.022, 0, end, { capTop: false, capBottom: true }));
      b.pop();
    });
    return b;
  }

  function buildShoulderCaps(b) {
    [-1, 1].forEach(s => {
      b.at(s * 0.228, 0.322, -0.004, h => {
        h.push(M4.rotZ(-s * 0.5));
        h.ellipsoid(0.08, 0.06, 0.088, 16, 10, COL.suit);
        h.pop();
      });
    });
    return b;
  }

  function buildTank(b, land) {
    const z = -0.29, y0 = -0.06, y1 = 0.32, R = 0.11;
    b.push(M4.translate(0, 0, z));
    if (land) {
      const bands = [COL.candyA, COL.candyB, COL.candyC, COL.candyD, COL.candyE, COL.candyA];
      for (let i = 0; i < bands.length; i++) {
        const a = lerp(y0, y1, i / bands.length), c = lerp(y0, y1, (i + 1) / bands.length);
        b.prism(22, R, R, a, R, R, c, bands[i], { capTop: false });
      }
      const g = rand(5);
      for (let i = 0; i < 26; i++) {
        const ang = g() * PI * 2, y = lerp(y0 + 0.03, y1 - 0.03, g());
        b.at(S(ang) * (R + 0.002), y, C(ang) * (R + 0.002), h => { h.push(M4.rotY(ang)); h.ellipsoid(0.011, 0.011, 0.004, 8, 4, COL.dot); h.pop(); });
      }
      b.at(0, y1, 0, h => h.ellipsoid(R, 0.075, R, 22, 8, COL.candyTop));
      b.at(0, y0, 0, h => h.ellipsoid(R, 0.04, R, 22, 6, COL.candyE));
      b.at(0, y1 + 0.07, 0, h => h.ellipsoid(0.03, 0.03, 0.03, 12, 8, COL.dot));
      b.push(M4.translate(0, 0.02, -R - 0.004));
      b.push(M4.rotX(-PI / 2));
      b.prism(10, 0.009, 0.009, 0, 0.009, 0.009, 0.05, COL.keyDk, {});
      b.pop();
      [-1, 1].forEach(s => b.at(s * 0.032, 0, -0.058, h => { h.push(M4.rotY(PI / 2)); torus(h, 0.024, 0.008, 18, 6, COL.key); h.pop(); }));
      b.pop();
    } else {
      b.prism(24, R, R, y0, R, R, y1, COL.tank, { capTop: false });
      [0.04, 0.27].forEach(y => b.prism(24, R + 0.004, R + 0.004, y - 0.008, R + 0.004, R + 0.004, y + 0.008, COL.tankDk, { capTop: false }));
      b.at(0, y1, 0, h => h.ellipsoid(R, 0.07, R, 24, 8, COL.tankTop));
      b.at(0, y0, 0, h => h.ellipsoid(R, 0.045, R, 24, 6, COL.tankDk));
      b.at(0, y1 + 0.065, 0, h => h.prism(12, 0.018, 0.018, 0, 0.016, 0.016, 0.045, COL.knob, {}));
      b.at(0, y1 + 0.105, 0, h => h.box(0.07, 0.012, 0.012, COL.knob));
      b.at(0.055, y1 + 0.02, -0.02, h => h.prism(10, 0.012, 0.012, 0, 0.012, 0.012, 0.05, COL.knob, {}));
      b.at(R * 0.7, 0.1, -R * 0.7, h => { h.push(M4.rotY(PI * 0.75)); h.box(0.05, 0.08, 0.02, COL.tankDk); h.pop(); });
    }
    b.pop();
    [-1, 1].forEach(s => b.at(s * 0.075, 0.18, -0.18, h => h.box(0.03, 0.36, 0.03, COL.strapDk)));
    return b;
  }

  function buildHips(b) {
    const rings = [
      { y: -0.2, rx: 0.17, rz: 0.14, cz: -0.006 },
      { y: -0.1, rx: 0.196, rz: 0.152, cz: 0.0 },
      { y: 0.0, rx: 0.196, rz: 0.152, cz: 0.006 },
      { y: 0.06, rx: 0.192, rz: 0.15, cz: 0.008 }
    ];
    ringLoft(b, rings, 22, () => COL.suit, { capBottom: true });
    [-1, 1].forEach(s => b.at(s * 0.095, -0.095, 0.0, h => h.ellipsoid(0.112, 0.118, 0.124, 12, 8, COL.suit)));
    const belt = [{ y: -0.01, rx: 0.2, rz: 0.156, cz: 0.008 }, { y: 0.035, rx: 0.198, rz: 0.154, cz: 0.008 }];
    ringLoft(b, belt, 26, () => COL.belt, {});
    b.at(0, 0.012, 0.166, h => {
      h.tri([-0.03, 0.022, 0], [0.03, 0.022, 0], [0, -0.028, 0], COL.buckle, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      h.tri([-0.018, 0.014, 0.002], [0.018, 0.014, 0.002], [0, -0.016, 0.002], COL.belt, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    });
    b.at(-0.17, -0.02, 0.07, h => { h.push(M4.rotY(-0.9)); h.box(0.07, 0.08, 0.035, COL.strapDk); h.at(0, 0.03, 0.019, q => q.box(0.072, 0.025, 0.004, COL.strap)); h.pop(); });
    b.at(0.178, -0.01, -0.03, h => { h.push(M4.rotY(1.3)); h.box(0.05, 0.06, 0.03, COL.strapDk); h.pop(); });
    return b;
  }

  function limbRings(len, keys) {
    return keys.map(([f, r, rz, cz]) => ({ y: -len * f, rx: r, rz: rz || r, cz: cz || 0 })).reverse();
  }

  function buildUpper(b, patch) {
    const len = D.upper;
    ringLoft(b, limbRings(len, [[-0.15, 0.07], [0, 0.077, 0.079], [0.2, 0.079, 0.08, 0.004], [0.5, 0.075, 0.076, 0.004], [0.8, 0.068, 0.068, 0.002], [1.0, 0.064, 0.064], [1.1, 0.06, 0.06]]), 18, () => COL.suit, {});
    if (patch) {
      b.push(M4.translate(0.077, -len * 0.3, 0.004), M4.rotY(PI / 2));
      K.discXY(b, 0, 0, 0, 0.034, 18, rgb(COL.patch));
      K.discXY(b, 0, 0, 0.001, 0.027, 18, rgb(COL.patchIn));
      b.at(0, -0.004, 0.002, h => {
        h.tri([-0.012, -0.012, 0], [0.012, -0.012, 0], [0, 0.018, 0], COL.patch, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      });
      b.pop();
    }
    return b;
  }

  function buildFore(b) {
    const len = D.fore;
    const rings = limbRings(len, [[-0.1, 0.062], [0, 0.065], [0.25, 0.063, 0.061], [0.5, 0.058, 0.056], [0.6, 0.055, 0.053], [0.61, 0.064, 0.062], [0.68, 0.066, 0.064], [0.85, 0.057, 0.055], [1.0, 0.048, 0.046], [1.05, 0.044, 0.042]]);
    const col = (u, y) => {
      const f = -y / len;
      if (f < 0.605) return COL.suit;
      return f < 0.69 ? COL.gloveHi : COL.glove;
    };
    ringLoft(b, rings, 16, col, { capTop: true, capBottom: true });
    return b;
  }

  const HAND_POSES = {
    relax: { curl: [0.35, 0.42, 0.48, 0.55], spread: 0.15, thumb: [0.45, 0.35] },
    fist: { curl: [1, 1, 1, 1], spread: 0, thumb: [0.15, 0.95] },
    grip: { curl: [0.74, 0.77, 0.8, 0.82], spread: 0.05, thumb: [0.65, 0.55] },
    point: { curl: [0.02, 1, 1, 1], spread: 0.05, thumb: [0.25, 0.85] },
    open: { curl: [0.06, 0.05, 0.07, 0.1], spread: 0.55, thumb: [0.85, 0.1] },
    flat: { curl: [0.04, 0.03, 0.04, 0.06], spread: 0.0, thumb: [0.3, 0.1] },
    rest: { curl: [0.22, 0.26, 0.3, 0.34], spread: 0.18, thumb: [0.5, 0.2] },
    claw: { curl: [0.55, 0.58, 0.6, 0.62], spread: 0.35, thumb: [0.6, 0.4] },
    wave: { curl: [0.1, 0.12, 0.16, 0.2], spread: 0.6, thumb: [0.8, 0.15] },
    hold: { curl: [0.5, 0.55, 0.6, 0.65], spread: 0.08, thumb: [0.8, 0.3] }
  };

  function palm(b) {
    const rows = [[0.014, 0.05, 0.032], [-0.02, 0.056, 0.034], [-0.06, 0.058, 0.03], [-0.094, 0.055, 0.025], [-0.106, 0.05, 0.02]];
    const sides = 14;
    const pt = (r, i) => {
      const a = (i / sides) * PI * 2;
      return [S(a) * r[1], r[0], C(a) * r[2]];
    };
    for (let j = 0; j < rows.length - 1; j++) {
      for (let i = 0; i < sides; i++) {
        const a = pt(rows[j], i), bb = pt(rows[j], i + 1), c = pt(rows[j + 1], i + 1), d = pt(rows[j + 1], i);
        const ns = [a, bb, c, d].map(q => V3.norm([q[0] / 0.055, 0, q[2] / 0.028]));
        b.quad(a, bb, c, d, COL.glove, null, ns);
      }
    }
    const top = rows[0], bot = rows[rows.length - 1];
    for (let i = 0; i < sides; i++) {
      b.tri([0, top[0], 0], pt(top, i), pt(top, i + 1), COL.glove);
      b.tri([0, bot[0], 0], pt(bot, i + 1), pt(bot, i), COL.glove);
    }
  }

  function fingerSegment(b, len, r0, r1, col) {
    b.prism(8, r1, r1 * 0.92, -len, r0, r0 * 0.92, 0, col, { capTop: false });
    b.at(0, -len, 0, h => h.ellipsoid(r1 * 1.02, r1 * 1.02, r1 * 0.95, 8, 5, col));
  }

  function buildHandMesh(b, side, poseName) {
    const k = side === 'L' ? 1 : -1;
    const pose = HAND_POSES[poseName] || HAND_POSES.relax;
    palm(b);
    const xs = [0.036, 0.013, -0.011, -0.033];
    const lens = [0.086, 0.092, 0.087, 0.07];
    const rads = [0.0138, 0.0145, 0.0138, 0.0124];
    const spreads = [0.13, 0.03, -0.06, -0.16];
    xs.forEach((x, f) => {
      const c = pose.curl[f];
      const L = lens[f], r = rads[f];
      const l1 = L * 0.44, l2 = L * 0.31, l3 = L * 0.25;
      b.push(M4.translate(k * x, -0.1 + Math.abs(x) * 0.12, 0.002), M4.rotZ(k * spreads[f] * (0.4 + pose.spread)), M4.rotX(-(c * 1.45 + 0.06)));
      b.at(0, 0, 0, h => h.ellipsoid(r * 1.2, r * 1.12, r * 1.08, 8, 5, COL.glove));
      fingerSegment(b, l1, r, r * 0.97, COL.glove);
      b.push(M4.translate(0, -l1, 0), M4.rotX(-c * 1.65));
      fingerSegment(b, l2, r * 0.97, r * 0.93, COL.glove);
      b.push(M4.translate(0, -l2, 0), M4.rotX(-c * 1.05));
      fingerSegment(b, l3, r * 0.93, r * 0.85, COL.gloveDk);
      b.pop();
      b.pop();
      b.pop();
    });
    const [ab, tc] = pose.thumb;
    b.push(M4.translate(k * 0.046, -0.03, 0.012), M4.rotY(k * (0.35 + ab * 0.5)), M4.rotZ(k * (0.55 + ab * 0.45)), M4.rotX(-0.3 - ab * 0.4));
    b.at(0, 0, 0, h => h.ellipsoid(0.02, 0.023, 0.019, 8, 5, COL.glove));
    fingerSegment(b, 0.036, 0.017, 0.0165, COL.glove);
    b.push(M4.translate(0, -0.036, 0), M4.rotX(-tc * 0.9));
    fingerSegment(b, 0.03, 0.0165, 0.0155, COL.glove);
    b.push(M4.translate(0, -0.03, 0), M4.rotX(-tc * 0.8));
    fingerSegment(b, 0.024, 0.0155, 0.014, COL.gloveDk);
    b.pop();
    b.pop();
    b.pop();
    return b;
  }

  function buildThigh(b) {
    const len = D.thigh;
    ringLoft(b, limbRings(len, [[-0.15, 0.1], [0, 0.106, 0.11], [0.4, 0.099, 0.102], [0.8, 0.085, 0.088], [1.0, 0.078, 0.08], [1.08, 0.074, 0.074]]), 16, () => COL.suit, { capTop: true, capBottom: true });
    return b;
  }

  function buildShin(b) {
    const len = D.shin;
    const col = (u, y) => {
      const f = -y / len;
      if (f > 0.52) return f > 0.96 ? COL.sole : COL.boot;
      return f > 0.44 ? COL.suitDk : COL.suit;
    };
    ringLoft(b, limbRings(len, [[-0.06, 0.078], [0.1, 0.082], [0.3, 0.079], [0.44, 0.076], [0.5, 0.078], [0.53, 0.072], [0.56, 0.068], [0.75, 0.062], [0.95, 0.06], [1.04, 0.06]]), 16, col, { capTop: true, capBottom: true });
    return b;
  }

  function buildFoot(b) {
    b.at(0, -0.022, 0.058, h => h.ellipsoid(0.062, 0.052, 0.13, 12, 8, COL.boot));
    b.at(0, -0.06, 0.054, h => h.box(0.106, 0.022, 0.225, COL.sole));
    b.at(0, -0.034, 0.158, h => h.ellipsoid(0.054, 0.036, 0.05, 10, 6, COL.boot));
    b.at(0, 0.014, -0.004, h => h.prism(12, 0.062, 0.062, -0.05, 0.06, 0.06, 0.04, COL.boot));
    return b;
  }

  function build(r, fx, opts) {
    const o = opts || {};
    const land = !!o.land;
    const mk = (fn) => K.mesh(r, fn);
    return {
      land,
      hood: mk(buildHood),
      mask: mk(buildMask),
      straps: mk(buildStraps),
      lensRim: mk(buildLensRim),
      lensGlass: mk(buildLensGlass),
      lenses: lensFrames(),
      filter: mk(buildFilter),
      grill: mk(buildGrill),
      filterF: filterFrame(),
      sideCan: mk(buildSideCan),
      sideF: sideFrame(),
      labelQuad: mk(b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]])),
      labelF: maskFrame(0.6, -0.22, 0.0016),
      labelTex: r.texture(256, paintLabel, { height: 48, clamp: true }),
      grillTex: r.texture(128, paintGrill, { clamp: true }),
      suitTex: r.texture(512, paintSuit, { height: 512 }),
      torso: mk(buildTorso),
      cowl: mk(buildCowl),
      harness: mk(b => buildHarness(b, land)),
      caps: mk(buildShoulderCaps),
      tank: mk(b => buildTank(b, land)),
      hips: mk(buildHips),
      upperL: mk(b => buildUpper(b, true)),
      upperR: mk(b => buildUpper(b, false)),
      fore: mk(buildFore),
      thigh: mk(buildThigh),
      shin: mk(buildShin),
      foot: mk(buildFoot),
      hands: {},
      r
    };
  }

  function handMesh(P, side, pose) {
    const key = side + '|' + pose;
    if (!P.hands[key]) P.hands[key] = K.mesh(P.r, b => buildHandMesh(b, side, pose));
    return P.hands[key];
  }

  function solve(pose) {
    return Rig.solve(pose, D);
  }

  function handBasis(pos, fingers, palmN) {
    const y = V3.norm(V3.mul(fingers, -1));
    let z = V3.sub(palmN, V3.mul(y, V3.dot(palmN, y)));
    z = V3.len(z) < 1e-5 ? [0, 0, 1] : V3.norm(z);
    const x = V3.cross(y, z);
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, pos[0], pos[1], pos[2], 1]);
  }

  function drawHead(fx, P, H, o) {
    const tint = o.tint ? { tint: o.tint } : {};
    fx.draw(P.hood, H, Object.assign({}, SUIT_MAT, tint));
    fx.draw(P.mask, H, Object.assign({}, RUBBER_MAT, tint));
    fx.draw(P.straps, H, Object.assign({}, RUBBER_MAT, tint));
    P.lenses.forEach(f => {
      const LM = M4.mul(H, frameMat(f));
      fx.draw(P.lensGlass, M4.mul(LM, M4.translate(0, 0, -0.0035)), Object.assign({}, LENS_MAT, o.lensTint ? { tint: o.lensTint } : tint));
      fx.draw(P.lensRim, LM, Object.assign({}, METAL_MAT, tint));
    });
    const FM = M4.mul(H, frameMat(P.filterF));
    fx.draw(P.filter, FM, Object.assign({}, METAL_MAT, tint));
    fx.draw(P.grill, M4.chain(FM, M4.translate(0, 0, MASK.filterL + 0.0015)), Object.assign({ texture: P.grillTex }, METAL_MAT, tint));
    fx.draw(P.sideCan, M4.mul(H, frameMat(P.sideF)), Object.assign({}, METAL_MAT, tint));
    const LF = P.labelF;
    fx.draw(P.labelQuad, M4.chain(H, frameMat(LF), M4.rotZ(-0.62), M4.scale(0.062, 0.0118, 1)), Object.assign({ texture: P.labelTex, tint: [0.42, 0.41, 0.39] }, RUBBER_MAT));
  }

  function draw(fx, P, st) {
    const m = st.m;
    const o = st.opts || {};
    const pre = o.pre;
    const W = (M) => (pre ? M4.mul(pre, M) : M);
    const tint = o.tint ? { tint: o.tint } : {};
    const suit = Object.assign({}, SUIT_MAT, tint);
    const rubber = Object.assign({}, RUBBER_MAT, tint);
    if (!o.noBody) {
      fx.draw(P.torso, W(m.chest), Object.assign({ texture: P.suitTex }, suit));
      fx.draw(P.cowl, W(m.chest), suit);
      fx.draw(P.caps, W(m.chest), suit);
      fx.draw(P.harness, W(m.chest), Object.assign({}, P.land ? CANDY_MAT : METAL_MAT, tint));
      if (!o.noTank) fx.draw(P.tank, W(m.chest), Object.assign({}, P.land ? CANDY_MAT : TANK_MAT, tint));
      fx.draw(P.hips, W(m.pelvis), suit);
      ['L', 'R'].forEach(s => {
        fx.draw(s === 'L' ? P.upperL : P.upperR, W(m['upper' + s]), suit);
        fx.draw(P.fore, W(m['fore' + s]), suit);
        const hand = st.hands && st.hands[s];
        const HM = hand && hand.M ? hand.M : m['hand' + s];
        fx.draw(handMesh(P, s, (hand && hand.pose) || 'relax'), W(HM), rubber);
        if (!o.noLegs) {
          fx.draw(P.thigh, W(m['thigh' + s]), suit);
          fx.draw(P.shin, W(m['shin' + s]), suit);
          fx.draw(P.foot, W(m['foot' + s]), rubber);
        }
      });
    }
    if (!o.noHead) drawHead(fx, P, M4.mul(W(m.head), HEAD_SCALE), o);
  }

  function headPoint(m, local) {
    return M4.point(M4.mul(m.head, HEAD_SCALE), local);
  }

  function lensWorld(m, side) {
    const f = lensFrames()[side > 0 ? 1 : 0];
    const H = M4.mul(m.head, HEAD_SCALE);
    return { c: M4.point(H, f.c), n: V3.norm(M4.dir(m.head, f.n)) };
  }

  function tankPoint(m, local) {
    return M4.point(m.chest, V3.add([0, 0, -0.29], local));
  }

  window.MeetPyro = { D, COL, MASK, HEAD_SCALE, HAND_POSES, build, solve, draw, drawHead, handBasis, handMesh, headPoint, lensWorld, tankPoint, torsoSurf, hoodRaw, maskFrame };
})();
