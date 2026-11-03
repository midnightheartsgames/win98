(function () {
  const { M4, V3, Builder, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Rig = window.YouVidRig;

  const COL = {
    fur: [0.72, 0.37, 0.22],
    furDk: [0.48, 0.21, 0.12],
    furLt: [0.86, 0.52, 0.36],
    cream: [0.88, 0.72, 0.60],
    creamDk: [0.76, 0.55, 0.43],
    earIn: [0.42, 0.21, 0.19],
    earBack: [0.62, 0.28, 0.13],
    nose: [0.62, 0.37, 0.40],
    mouth: [0.22, 0.07, 0.08],
    palate: [0.42, 0.16, 0.18],
    tongue: [0.62, 0.32, 0.36],
    tooth: [0.95, 0.93, 0.88],
    claw: [0.97, 0.95, 0.90],
    pad: [0.42, 0.22, 0.22],
    lidRim: [0.2, 0.1, 0.07],
    lid: [0.90, 0.58, 0.36],
    whisker: [0.98, 0.95, 0.90, 0.55]
  };

  const HEAD = { rx: 0.043, ry: 0.037, rz: 0.041 };
  const NA = 48, NV = 26, JL = 8, JA = 3;
  const A_JAW = (2 * PI * JA) / NA;
  const EYE = { a: 0.42, p: 0.075, r: 0.0096, inset: 0.64, toward: 0.42, tilt: 0.08 };
  const HEAD_SCALE = 1.5;
  const HINGE = [0, -0.011, -0.010];
  const ATLAS_HEAD = [0, 0.010, 0.030];
  const NECK = { base: [0, 0.25, 0.14], len: 0.08, pitch: 0.68 };
  const LEGS = [
    { side: 1, front: true, root: [0.052, 0.19, 0.105], paw: [0.048, 0, 0.13], l1: 0.1, l2: 0.092 },
    { side: -1, front: true, root: [-0.052, 0.19, 0.105], paw: [-0.048, 0, 0.13], l1: 0.1, l2: 0.092 },
    { side: 1, front: false, root: [0.058, 0.2, -0.135], paw: [0.054, 0, -0.15], l1: 0.11, l2: 0.1 },
    { side: -1, front: false, root: [-0.058, 0.2, -0.135], paw: [-0.054, 0, -0.15], l1: 0.11, l2: 0.1 }
  ];
  const TAIL = { base: [0, 0.225, -0.2], n: 11, seg: 0.029 };

  const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const LEG = mix(COL.fur, COL.furDk, 0.22);
  const tone = (c, k) => [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k), c[3] || 0];
  const gauss = (a, p, ca, cp, sa, sp) => {
    const da = (a - ca) / sa, dp = (p - cp) / sp;
    return Math.exp(-(da * da + dp * dp));
  };
  const pair = (a, p, ca, cp, sa, sp) => gauss(a, p, ca, cp, sa, sp) + gauss(a, p, -ca, cp, sa, sp);

  function headBump(a, p) {
    let d = 0;
    d += 0.0105 * gauss(a, p, 0, -0.36, 0.40, 0.24);
    d += 0.0045 * pair(a, p, 0.19, -0.40, 0.17, 0.14);
    d += 0.0062 * gauss(a, p, 0, -0.12, 0.11, 0.09);
    d += 0.0038 * gauss(a, p, 0, -0.74, 0.30, 0.16);
    d += 0.0078 * pair(a, p, 0.95, -0.28, 0.38, 0.36);
    d -= 0.0030 * pair(a, p, EYE.a, EYE.p, 0.15, 0.12);
    d -= 0.0035 * gauss(a, p, 0, 0.55, 0.70, 0.32);
    d += 0.0020 * pair(a, p, 0.36, 0.30, 0.16, 0.08);
    return d;
  }

  function headPt(a, p) {
    const n = [S(a) * C(p), S(p), C(a) * C(p)];
    const nn = V3.norm([n[0] / HEAD.rx, n[1] / HEAD.ry, n[2] / HEAD.rz]);
    return V3.add([n[0] * HEAD.rx, n[1] * HEAD.ry, n[2] * HEAD.rz], V3.mul(nn, headBump(a, p)));
  }

  function surfNormal(P, a, p, fallback) {
    const e = 0.003;
    const n = V3.cross(V3.sub(P(a + e, p), P(a - e, p)), V3.sub(P(a, Math.min(PI / 2, p + e)), P(a, Math.max(-PI / 2, p - e))));
    if (V3.len(n) < 1e-10) return fallback || [0, Math.sign(p) || 1, 0];
    return V3.norm(n);
  }

  function headNormal(a, p) {
    if (p > PI / 2 - 0.004) return [0, 1, 0];
    if (p < -PI / 2 + 0.004) return [0, -1, 0];
    return surfNormal(headPt, a, p);
  }

  function lipP(a) {
    const k = Math.min(1, Math.abs(a) / A_JAW);
    return -0.42 + 0.07 * k * k;
  }

  function gridA(i) {
    return -PI + (2 * PI * i) / NA;
  }

  function gridP(a, j) {
    const pl = lipP(a);
    if (j <= JL) return -PI / 2 + (pl + PI / 2) * (j / JL);
    return pl + (PI / 2 - pl) * ((j - JL) / (NV - JL));
  }

  function headBase(a, p) {
    const aa = Math.abs(a);
    let c = COL.fur;
    c = mix(c, COL.furDk, clamp((p - 0.25) / 0.9, 0, 1) * 0.4 * clamp(1 - aa / 2.4, 0.3, 1));
    c = mix(c, COL.furLt, clamp(pair(a, p, 0.95, -0.32, 0.45, 0.36), 0, 1) * 0.55);
    c = mix(c, COL.furLt, clamp(pair(a, p, EYE.a, EYE.p, 0.26, 0.2), 0, 1) * 0.65);
    const muzzle = gauss(a, p, 0, -0.42, 0.42, 0.24);
    const chin = clamp((-p - 0.5) / 0.35, 0, 1) * clamp(1.3 - aa / 1.5, 0, 1);
    c = mix(c, COL.cream, clamp(Math.max(muzzle * 1.1, chin), 0, 1));
    c = mix(c, COL.creamDk, clamp(gauss(a, p, 0, -0.62, 0.5, 0.1) * 0.25, 0, 1));
    c = mix(c, COL.furDk, clamp(pair(a, p, 0.78, 0.28, 0.22, 0.22) * 0.45 + pair(a, p, EYE.a, EYE.p + 0.02, 0.2, 0.15) * 0.3 + gauss(a, p, 0, 0.12, 0.1, 0.14) * 0.25, 0, 1));
    return c;
  }

  function faceTexture(ctx, w, h) {
    const X = (a) => ((a + PI) / (2 * PI)) * w;
    const Y = (p) => ((PI / 2 - p) / PI) * h;
    const lw = 256, lh = 128;
    const img = ctx.createImageData(lw, lh);
    const g = rand(71);
    for (let y = 0; y < lh; y++) {
      for (let x = 0; x < lw; x++) {
        const a = (x / lw) * 2 * PI - PI, p = PI / 2 - (y / lh) * PI;
        const c = headBase(a, p);
        const n = 0.94 + g() * 0.1;
        const i = (y * lw + x) * 4;
        img.data[i] = Math.round(clamp(c[0] * n, 0, 1) * 255);
        img.data[i + 1] = Math.round(clamp(c[1] * n, 0, 1) * 255);
        img.data[i + 2] = Math.round(clamp(c[2] * n, 0, 1) * 255);
        img.data[i + 3] = 255;
      }
    }
    const tmp = document.createElement('canvas');
    tmp.width = lw;
    tmp.height = lh;
    tmp.getContext('2d').putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(tmp, 0, 0, w, h);
    const css = (c, al) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${al})`;
    ctx.lineCap = 'round';
    for (let i = 0; i < 2600; i++) {
      const a = (g() * 2 - 1) * 2.6, p = (g() * 2 - 1) * 1.45;
      const ax = a, ay = p + 0.25;
      let fa = ax, fp = ay;
      if (p > 0.15) { fa = ax * 0.4; fp = 1; }
      const fl = Math.hypot(fa, fp) || 1;
      const len = 4 + g() * 9;
      const c = headBase(a, p);
      const k = g() < 0.5 ? 0.78 : 1.18;
      ctx.strokeStyle = css([c[0] * k, c[1] * k, c[2] * k], 0.35);
      ctx.lineWidth = 1 + g() * 1.2;
      ctx.beginPath();
      ctx.moveTo(X(a), Y(p));
      ctx.lineTo(X(a) + (fa / fl) * len, Y(p) - (fp / fl) * len);
      ctx.stroke();
    }
    ctx.strokeStyle = css(COL.furDk, 0.3);
    [-0.2, -0.07, 0.07, 0.2].forEach((a0, i) => {
      ctx.lineWidth = 2 + (i % 2);
      ctx.beginPath();
      ctx.moveTo(X(a0 * 0.8), Y(0.3));
      ctx.quadraticCurveTo(X(a0 * 1.2), Y(0.75), X(a0 * 1.5), Y(1.25));
      ctx.stroke();
    });
    [-1, 1].forEach(s => {
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(X(s * 0.66), Y(0.05));
      ctx.quadraticCurveTo(X(s * 0.95), Y(0.0), X(s * 1.35), Y(0.1));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(X(s * 0.8), Y(-0.16));
      ctx.quadraticCurveTo(X(s * 1.05), Y(-0.2), X(s * 1.4), Y(-0.12));
      ctx.stroke();
    });
    [-1, 1].forEach(s => {
      const cx = X(s * EYE.a), cy = Y(EYE.p);
      ctx.fillStyle = css(COL.lidRim, 1);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 0.175 * w / (2 * PI), 0.11 * h / PI, -s * 0.08, 0, PI * 2);
      ctx.fill();
      ctx.strokeStyle = css(COL.lidRim, 0.5);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.26 * w / (2 * PI), cy + 4);
      ctx.lineTo(cx - s * 0.36 * w / (2 * PI), cy + 14);
      ctx.stroke();
    });
    const nx = X(0), ny = Y(-0.06), nb = Y(-0.21), nw = X(0.085) - X(0);
    ctx.fillStyle = css(COL.nose, 1);
    ctx.beginPath();
    ctx.moveTo(nx - nw, ny);
    ctx.quadraticCurveTo(nx, ny - 6, nx + nw, ny);
    ctx.quadraticCurveTo(nx + nw * 0.9, ny + (nb - ny) * 0.45, nx + nw * 0.25, nb - 3);
    ctx.quadraticCurveTo(nx, nb + 2, nx - nw * 0.25, nb - 3);
    ctx.quadraticCurveTo(nx - nw * 0.9, ny + (nb - ny) * 0.45, nx - nw, ny);
    ctx.fill();
    ctx.fillStyle = css(mix(COL.nose, [1, 1, 1], 0.25), 0.8);
    ctx.beginPath();
    ctx.ellipse(nx, ny + 5, nw * 0.55, 4, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = css([0.22, 0.1, 0.11], 1);
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.ellipse(nx + s * nw * 0.42, ny + (nb - ny) * 0.62, nw * 0.2, 4, s * 0.6, 0, PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = css([0.25, 0.11, 0.1], 0.9);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(nx, nb);
    ctx.lineTo(nx, Y(lipP(0)) - 2);
    ctx.stroke();
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const a = -0.3 + (0.6 * i) / 24;
      const y = Y(lipP(a)) - 2 - 5 * Math.exp(-(a * a) / 0.004);
      if (i === 0) ctx.moveTo(X(a), y); else ctx.lineTo(X(a), y);
    }
    ctx.stroke();
    ctx.strokeStyle = css([0.32, 0.14, 0.12], 0.7);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const a = -0.24 + (0.48 * i) / 24;
      const y = Y(lipP(a)) + 3;
      if (i === 0) ctx.moveTo(X(a), y); else ctx.lineTo(X(a), y);
    }
    ctx.stroke();
    ctx.fillStyle = css([0.45, 0.25, 0.18], 0.7);
    [-1, 1].forEach(s => {
      for (let r0 = 0; r0 < 4; r0++) {
        for (let k = 0; k < 4; k++) {
          const a = s * (0.11 + k * 0.06), p = -0.29 - r0 * 0.045 - k * 0.006;
          ctx.beginPath();
          ctx.arc(X(a), Y(p), 1.6, 0, PI * 2);
          ctx.fill();
        }
      }
    });
  }

  function irisTexture(ctx, w, h) {
    ctx.fillStyle = '#121615';
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R = w * 0.49;
    const grd = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
    grd.addColorStop(0, '#c8d2b8');
    grd.addColorStop(0.45, '#a9b9a6');
    grd.addColorStop(0.8, '#7f978d');
    grd.addColorStop(1, '#3c4a45');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, PI * 2);
    ctx.fill();
    const g = rand(5);
    for (let i = 0; i < 90; i++) {
      const an = g() * PI * 2, r0 = R * (0.18 + g() * 0.2), r1 = R * (0.6 + g() * 0.38);
      ctx.strokeStyle = g() < 0.5 ? 'rgba(60,80,70,0.35)' : 'rgba(230,236,210,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0);
      ctx.lineTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1);
      ctx.stroke();
    }
    ctx.fillStyle = '#0b0c0c';
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.065, h * 0.36, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.ellipse(w * 0.37, h * 0.31, w * 0.05, h * 0.04, -0.5, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(w * 0.63, h * 0.68, w * 0.03, 0, PI * 2);
    ctx.fill();
  }

  function tuftTexture(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const g = rand(17);
    const sw = w / 4;
    for (let s = 0; s < 4; s++) {
      const x0 = s * sw + sw / 2;
      const n = 30 + s * 4;
      for (let i = 0; i < n; i++) {
        const rootX = x0 + (g() - 0.5) * sw * 0.32;
        const spread = (g() - 0.5) * sw * (0.55 + s * 0.08);
        const len = h * (0.55 + g() * 0.45);
        const bend = (g() - 0.5) * sw * 0.25;
        const v = 215 + Math.floor(g() * 40);
        ctx.strokeStyle = `rgb(${v},${v},${v})`;
        ctx.lineWidth = 1 + g() * 0.9;
        ctx.beginPath();
        ctx.moveTo(rootX, h);
        ctx.quadraticCurveTo(rootX + spread * 0.4 + bend, h - len * 0.55, rootX + spread, h - len);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgb(205,205,205)';
      ctx.beginPath();
      ctx.ellipse(x0, h, sw * 0.2, h * 0.18, 0, 0, PI * 2);
      ctx.fill();
    }
  }

  function furTexture(ctx, w, h) {
    ctx.fillStyle = '#e4e4e4';
    ctx.fillRect(0, 0, w, h);
    const g = rand(23);
    for (let i = 0; i < 2600; i++) {
      const x = g() * w, y = g() * h, len = 6 + g() * 16, dx = (g() - 0.5) * 4;
      const v = 150 + Math.floor(g() * 105);
      ctx.strokeStyle = `rgba(${v},${v},${v},0.55)`;
      ctx.lineWidth = 1 + g();
      [[0, 0], [-w, 0], [w, 0], [0, -h], [0, h]].forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.moveTo(x + ox, y + oy);
        ctx.lineTo(x + ox + dx, y + oy + len);
        ctx.stroke();
      });
    }
  }

  function addCard(b, root, nrm, flow, len, wid, lift, twist, col, slot) {
    let f = V3.sub(flow, V3.mul(nrm, V3.dot(flow, nrm)));
    if (V3.len(f) < 1e-5) f = Math.abs(nrm[1]) < 0.9 ? V3.cross(nrm, [0, 1, 0]) : V3.cross(nrm, [1, 0, 0]);
    f = V3.norm(f);
    const dir = V3.norm(V3.add(V3.mul(f, C(lift)), V3.mul(nrm, S(lift))));
    const side = V3.norm(V3.cross(nrm, f));
    const up = V3.norm(V3.cross(dir, side));
    const w = V3.norm(V3.add(V3.mul(side, C(twist)), V3.mul(up, S(twist))));
    const base = V3.sub(root, V3.mul(nrm, 0.0015));
    const tip = V3.add(base, V3.mul(dir, len));
    const hw = wid / 2;
    const u0 = slot / 4, u1 = (slot + 1) / 4;
    const c0 = tone(col, 0.93), c1 = tone(col, 1.06);
    b.quad(V3.sub(base, V3.mul(w, hw)), V3.add(base, V3.mul(w, hw)), V3.add(tip, V3.mul(w, hw * 1.2)), V3.sub(tip, V3.mul(w, hw * 1.2)),
      [c0, c0, c1, c1], [[u0 + 0.004, 0], [u1 - 0.004, 0], [u1 - 0.004, 1], [u0 + 0.004, 1]], [nrm, nrm, nrm, nrm]);
  }

  function scatter(b, n, seed, at, spec) {
    const g = rand(seed);
    for (let k = 0; k < n; k++) {
      const s = at(g(), g(), g);
      if (!s) continue;
      const len = lerp(spec.len[0], spec.len[1], g()) * (s.len || 1);
      const wid = lerp(spec.wid[0], spec.wid[1], g()) * (s.wid || 1);
      const lift = lerp(spec.lift[0], spec.lift[1], g());
      const twist = (g() - 0.5) * PI * (spec.twist === undefined ? 1 : spec.twist);
      const clump = 1 - 0.14 * (0.5 + 0.5 * S(s.p[0] * 90 + s.p[2] * 70) * S(s.p[1] * 80 + s.p[2] * 40));
      const col = tone(s.col, (0.84 + g() * 0.3) * clump);
      addCard(b, s.p, s.n, s.flow, len, wid, lift, twist, col, Math.floor(g() * 4));
    }
  }

  function grid(b, P, N, nu, nv, colAt, keep, uvs) {
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        if (keep && !keep(i, j)) continue;
        const q = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
        const pts = q.map(([u, v]) => P(u / nu, v / nv));
        const ns = q.map(([u, v]) => N(u / nu, v / nv));
        const cs = q.map(([u, v]) => colAt(u / nu, v / nv));
        b.quad(pts[0], pts[1], pts[2], pts[3], cs, uvs ? q.map(([u, v]) => [(u / nu) * uvs[0], (v / nv) * uvs[1]]) : null, ns);
      }
    }
  }

  function headMeshes(r) {
    const upper = new Builder(), jaw = new Builder();
    const white = [1, 1, 1, 0];
    const vert = (i, j) => {
      const a = gridA(i), p = gridP(a, j);
      return { p: headPt(a, p), n: headNormal(a, p), uv: [(a + PI) / (2 * PI), (p + PI / 2) / PI] };
    };
    for (let j = 0; j < NV; j++) {
      for (let i = 0; i < NA; i++) {
        const inJaw = j < JL && i >= NA / 2 - JA && i < NA / 2 + JA;
        const q = [vert(i, j), vert(i + 1, j), vert(i + 1, j + 1), vert(i, j + 1)];
        (inJaw ? jaw : upper).quad(q[0].p, q[1].p, q[2].p, q[3].p, white, q.map(v => v.uv), q.map(v => v.n));
      }
    }
    return { upper: r.mesh(upper), jaw: r.mesh(jaw) };
  }

  function headCards(r) {
    const furCards = new Builder(), jawCards = new Builder();
    const sample = (aRange, pRange, flowFn, opts) => (u, v) => {
      const a = lerp(aRange[0], aRange[1], u), p = lerp(pRange[0], pRange[1], v);
      if (opts && opts.skip && opts.skip(a, p)) return null;
      const pt = headPt(a, p), n = headNormal(a, p);
      return { p: pt, n, flow: flowFn(a, p, pt, n), col: headBase(a, p), len: opts && opts.len ? opts.len(a, p) : 1 };
    };
    const back = (a, p, pt) => V3.norm([pt[0] * 0.6, -0.25, -1]);
    const outBack = (a, p, pt) => V3.norm([Math.sign(a) * 0.9, -0.55, -0.45]);
    const down = () => [0, -1, 0.15];
    const inJawZone = (a, p) => Math.abs(a) < A_JAW * 0.98 && p < lipP(a) - 0.02;
    [-1, 1].forEach((s, k) => {
      scatter(furCards, 120, 31 + k, sample(s > 0 ? [0.55, 2.2] : [-2.2, -0.55], [-1.15, 0.05], outBack, {
        skip: inJawZone,
        len: (a, p) => 0.55 + 0.8 * clamp((Math.abs(a) - 0.5) / 0.9, 0, 1) * clamp((0.2 - p) / 0.8, 0, 1)
      }), { len: [0.016, 0.03], wid: [0.012, 0.02], lift: [0.25, 0.7] });
    });
    scatter(furCards, 140, 37, sample([-2.6, 2.6], [0.2, 1.45], back, {
      skip: (a, p) => Math.abs(a) < 0.55 && p < 0.55,
      len: (a) => 0.6 + 0.5 * clamp(Math.abs(a) / 2.2, 0, 1)
    }), { len: [0.008, 0.016], wid: [0.008, 0.014], lift: [0.12, 0.4], twist: 0.6 });
    scatter(furCards, 90, 41, sample([-3.1, 3.1], [-0.6, 0.6], back, {
      skip: (a) => Math.abs(a) < 1.5
    }), { len: [0.012, 0.022], wid: [0.012, 0.02], lift: [0.2, 0.55] });
    scatter(jawCards, 80, 43, sample([-A_JAW, A_JAW], [-1.5, -0.62], down, {
      skip: (a, p) => !inJawZone(a, p)
    }), { len: [0.014, 0.026], wid: [0.012, 0.02], lift: [0.15, 0.5] });
    return { cards: r.mesh(furCards), jawCards: r.mesh(jawCards) };
  }

  function mouthMeshes(r) {
    const top = K.mesh(r, b => {
      b.at(0, -0.014, 0.014, h => h.ellipsoid(0.021, 0.009, 0.022, 12, 8, COL.mouth));
      b.at(0, -0.010, 0.024, h => h.ellipsoid(0.015, 0.005, 0.013, 10, 6, COL.palate));
    });
    const topTeeth = K.mesh(r, b => {
      [-1, 1].forEach(s => {
        const base = headPt(s * 0.17, lipP(0.17) + 0.035);
        const root = V3.add(base, [-s * 0.0012, 0.001, -0.0055]);
        b.push(M4.translate(root[0], root[1], root[2]), M4.rotX(-0.25));
        b.prism(5, 0.0017, 0.0017, 0, 0, 0, -0.0045, COL.tooth, { capTop: false });
        b.pop();
      });
      for (let i = 0; i < 4; i++) {
        const a = -0.11 + i * 0.073;
        const base = V3.add(headPt(a, lipP(a) + 0.03), [0, 0, -0.004]);
        b.push(M4.translate(base[0], base[1], base[2]));
        b.box(0.0024, 0.0028, 0.0018, COL.tooth);
        b.pop();
      }
    });
    const low = K.mesh(r, b => {
      b.at(0, -0.021, 0.012, h => h.ellipsoid(0.016, 0.0055, 0.02, 12, 7, COL.mouth));
      b.at(0, -0.02, 0.014, h => h.ellipsoid(0.011, 0.0035, 0.014, 10, 6, COL.tongue));
    });
    const lowTeeth = K.mesh(r, b => {
      [-1, 1].forEach(s => {
        const base = headPt(s * 0.15, lipP(0.15) - 0.04);
        const root = V3.add(base, [-s * 0.0015, -0.002, -0.0065]);
        b.push(M4.translate(root[0], root[1], root[2]), M4.rotX(0.2));
        b.prism(5, 0.0013, 0.0013, 0, 0, 0, 0.0038, COL.tooth, { capTop: false });
        b.pop();
      });
    });
    return { top, low, topTeeth, lowTeeth };
  }

  function eyeMeshes(r) {
    const ball = K.mesh(r, b => {
      const nu = 18, nv = 12;
      for (let j = 0; j < nv; j++) {
        for (let i = 0; i < nu; i++) {
          const q = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([u, v]) => {
            const yaw = -PI + (2 * PI * u) / nu, pit = -PI / 2 + (PI * v) / nv;
            const p = [S(yaw) * C(pit), S(pit), C(yaw) * C(pit)];
            return { p, uv: [0.5 + p[0] * 0.5, 0.5 + p[1] * 0.5] };
          });
          b.quad(q[0].p, q[1].p, q[2].p, q[3].p, [1, 1, 1, 0.12], q.map(v => v.uv), q.map(v => v.p));
        }
      }
    });
    const lid = (upper) => K.mesh(r, b => {
      const R = upper ? 1.07 : 1.095, Y = 1.25, e0 = upper ? 0.62 : -0.56;
      const ny = 16, np = 7;
      const edge = (y) => e0 * Math.pow(Math.max(0, 1 - (y / Y) * (y / Y)), 0.6);
      const pt = (i, j) => {
        const y = -1.55 + (3.1 * i) / ny;
        const e = edge(y);
        const far = upper ? 2.8 : -2.8;
        const k = j / np;
        const p = lerp(e, far, k * k * 0.85 + k * 0.15);
        const n = [S(y) * C(p), S(p), C(y) * C(p)];
        return { p: V3.mul(n, R), n, rim: j === 0 };
      };
      for (let j = 0; j < np; j++) {
        for (let i = 0; i < ny; i++) {
          const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
          b.quad(q[0].p, q[1].p, q[2].p, q[3].p, q.map(v => (v.rim ? COL.lidRim : COL.lid)), null, q.map(v => v.n));
        }
      }
    });
    return { ball, upper: lid(true), lower: lid(false) };
  }

  function eyeFrame(s) {
    const a = s * EYE.a, p = EYE.p;
    const surf = headPt(a, p), n = headNormal(a, p);
    const raw = V3.add(V3.mul(n, 1 - EYE.toward), [0, 0, EYE.toward]);
    const dir = V3.norm([raw[0], raw[1] * 0.35, raw[2]]);
    const center = V3.sub(surf, V3.mul(dir, EYE.r * EYE.inset));
    const x = V3.norm(V3.cross([0, 1, 0], dir));
    const y = V3.cross(dir, x);
    return M4.chain(Rig.basisM(center, x, y, dir), M4.rotZ(s * EYE.tilt));
  }

  function earMeshes(r) {
    const H = 0.047, W0 = 0.056, D = 0.013;
    const P = (front) => (u, v) => {
      const sl = v, t = u * 2 - 1;
      const wd = W0 * Math.pow(1 - sl, 0.8) * (1 - 0.12 * sl);
      const x = t * wd * 0.5 * (1 - 0.45 * Math.pow(sl, 3)) + sl * sl * 0.006;
      const y = sl * H;
      const z = -D * (1 - t * t) * (1 - 0.6 * sl) + (front ? 0.0026 * (1 - sl) * (1 - t * t * 0.5) : 0);
      return [x, y, z];
    };
    const N = (front) => (u, v) => {
      const e = 0.01;
      const f = P(front);
      const n = V3.cross(V3.sub(f(Math.min(1, u + e), v), f(Math.max(0, u - e), v)), V3.sub(f(u, Math.min(0.999, v + e)), f(u, Math.max(0, v - e))));
      const nn = V3.len(n) < 1e-9 ? [0, 0, 1] : V3.norm(n);
      return front ? nn : V3.mul(nn, -1);
    };
    const outer = K.mesh(r, b => grid(b, P(false), N(false), 10, 9, (u, v) => mix(COL.earBack, COL.furDk, v * 0.35)));
    const inner = K.mesh(r, b => grid(b, P(true), N(true), 10, 9, (u, v) => {
      const t = Math.abs(u * 2 - 1);
      const edge = clamp((t - 0.62) / 0.3, 0, 1);
      return mix(mix(COL.earIn, [0.66, 0.42, 0.38], v * 0.6), COL.furLt, edge);
    }));
    const cards = K.mesh(r, b => {
      scatter(b, 16, 53, (u, v) => {
        const vv = v * 0.45, uu = u < 0.5 ? 0.12 + u * 0.3 : 0.58 + (u - 0.5) * 0.6;
        const p = P(true)(uu, vv);
        return { p: V3.add(p, [0, 0, 0.0015]), n: N(true)(uu, vv), flow: [(uu - 0.5) * 1.2, 1, 0.5], col: [0.94, 0.86, 0.76] };
      }, { len: [0.008, 0.014], wid: [0.005, 0.008], lift: [0.3, 0.6] });
      scatter(b, 22, 59, (u, v) => {
        const vv = v * 0.85, side = u < 0.5 ? 0.03 : 0.97;
        const p = P(false)(side, vv);
        return { p, n: [side < 0.5 ? -1 : 1, 0.2, -0.3], flow: [side < 0.5 ? -0.4 : 0.4, 1, 0], col: COL.fur };
      }, { len: [0.005, 0.009], wid: [0.005, 0.008], lift: [0.2, 0.5] });
    });
    return { outer, inner, cards };
  }

  function earFrame(s) {
    const base = headPt(s * 0.66, 0.62);
    return M4.chain(M4.translate(base[0], base[1] - 0.006, base[2] - 0.002), M4.rotY(s * 0.5), M4.rotZ(-s * 0.42), M4.rotX(-0.08));
  }

  function whiskerMesh(r, k) {
    return K.mesh(r, b => {
      const g = rand(97);
      const strand = (root, dir, len, bend, r0) => {
        const pts = [], rad = [];
        let d = V3.norm(dir);
        let p = root;
        const n = 6;
        for (let i = 0; i <= n; i++) {
          pts.push(p);
          rad.push(lerp(r0, r0 * 0.3, i / n));
          d = V3.norm(V3.add(d, V3.mul(bend, 1 / n)));
          p = V3.add(p, V3.mul(d, len / n));
        }
        K.tube(b, pts, rad.map(v => v * k), 3, COL.whisker);
      };
      [-1, 1].forEach(s => {
        for (let i = 0; i < 8; i++) {
          const row = i % 4, col = Math.floor(i / 4);
          const a = s * (0.15 + col * 0.08 + g() * 0.02), p = -0.31 - row * 0.04;
          const root = headPt(a, p);
          const fan = lerp(0.62, -0.4, row / 3) + (g() - 0.5) * 0.16;
          strand(root, [s * (0.9 + g() * 0.2), fan, 0.3 + g() * 0.2], 0.042 + g() * 0.018, [0, -0.08 - g() * 0.08, 0.12], 0.00055);
        }
        for (let i = 0; i < 3; i++) {
          const root = headPt(s * (0.3 + i * 0.06), 0.3 + i * 0.02);
          strand(root, [s * (0.3 + i * 0.16), 1, 0.3], 0.032 + g() * 0.012, [s * 0.1, -0.05, 0], 0.00045);
        }
        const root = headPt(s * 1.05, -0.15);
        strand(root, [s, 0.1, -0.2], 0.03, [0, -0.05, 0], 0.00045);
      });
    });
  }

  const TORSO = [
    [0.00, 0.030, 0.035, 0.035],
    [0.06, 0.075, 0.070, 0.065],
    [0.16, 0.095, 0.083, 0.078],
    [0.32, 0.102, 0.088, 0.084],
    [0.50, 0.102, 0.088, 0.086],
    [0.68, 0.100, 0.090, 0.088],
    [0.82, 0.094, 0.094, 0.090],
    [0.92, 0.080, 0.090, 0.086],
    [0.975, 0.052, 0.064, 0.060],
    [1.00, 0.004, 0.012, 0.012]
  ];

  function torsoProfile(s) {
    for (let i = 1; i < TORSO.length; i++) {
      if (s <= TORSO[i][0]) {
        const a = TORSO[i - 1], b = TORSO[i];
        const k = (s - a[0]) / (b[0] - a[0]);
        const e = k * k * (3 - 2 * k);
        return [lerp(a[1], b[1], e), lerp(a[2], b[2], e), lerp(a[3], b[3], e)];
      }
    }
    return TORSO[TORSO.length - 1].slice(1);
  }

  function spineAt(s, arch) {
    const z = lerp(-0.205, 0.175, s);
    const hump = S(PI * clamp((s - 0.04) / 0.9, 0, 1));
    return [0, 0.205 + arch * 0.1 * hump - arch * 0.025 * (1 - hump), z];
  }

  function torsoPt(arch) {
    return (u, v) => {
      const th = u * 2 * PI, s = v;
      const [rx, ryT, ryB] = torsoProfile(s);
      const c = spineAt(s, arch);
      const ct = C(th);
      const ry = ct > 0 ? ryT : ryB;
      const front = clamp((s - 0.8) / 0.2, 0, 1);
      return [c[0] + S(th) * rx, c[1] + ct * ry, c[2] + (ct < 0 ? front * 0.012 * -ct : 0)];
    };
  }

  function torsoCol(u, v) {
    const ct = C(u * 2 * PI);
    const belly = clamp((-ct - 0.25) / 0.6, 0, 1);
    const chest = clamp((v - 0.72) / 0.2, 0, 1) * clamp((0.35 - ct) / 0.9, 0, 1);
    const back = clamp((ct - 0.4) / 0.6, 0, 1);
    let c = mix(COL.fur, COL.furDk, back * 0.35);
    c = mix(c, COL.furLt, clamp(1 - Math.abs(ct) * 1.4, 0, 1) * 0.25);
    c = mix(c, COL.creamDk, belly * 0.75);
    return mix(c, COL.cream, chest * 0.9);
  }

  function torsoMeshes(r, arch) {
    const P = torsoPt(arch);
    const N = (u, v) => {
      const e = 0.004;
      const n = V3.cross(V3.sub(P(u, Math.min(1, v + e)), P(u, Math.max(0, v - e))), V3.sub(P(u + e, v), P(u - e, v)));
      return V3.len(n) < 1e-10 ? [0, 0, v > 0.5 ? 1 : -1] : V3.norm(n);
    };
    const body = K.mesh(r, b => grid(b, P, N, 18, 20, (u, v) => tone(torsoCol(u, v), 0.97), null, [5, 4]));
    const cards = K.mesh(r, b => {
      scatter(b, 1000, 61 + Math.round(arch * 10), (u, v) => {
        const s = 0.04 + v * 0.93;
        const p = P(u, s), n = N(u, s);
        const ct = C(u * 2 * PI);
        const flow = ct < -0.3 ? [0, -1, -0.3] : [n[0] * 0.3, -0.5, -1];
        const fluff = 0.8 + 0.6 * clamp((-ct + 0.2), 0, 1) + 0.3 * clamp((s - 0.75) / 0.2, 0, 1);
        return { p, n, flow, col: torsoCol(u, s), len: fluff };
      }, { len: [0.016, 0.03], wid: [0.012, 0.02], lift: [0.05, 0.3] });
      scatter(b, 260, 67, (u, v) => {
        const th = PI * (0.55 + u * 0.9), s = 0.8 + v * 0.19;
        const uu = th / (2 * PI);
        const p = P(uu, s), n = N(uu, s);
        return { p, n, flow: [0, -1, 0.35], col: mix(COL.cream, COL.fur, 0.25 + 0.3 * (1 - v)), len: 0.8 + v * 0.5 };
      }, { len: [0.02, 0.034], wid: [0.012, 0.02], lift: [0.3, 0.75] });
    });
    return { body, cards };
  }

  function neckMeshes(r) {
    const rings = [];
    for (let i = 0; i <= 6; i++) {
      const k = i / 6;
      rings.push({ y: -k, rx: lerp(0.036, 0.050, k), rz: lerp(0.038, 0.054, k), col: mix(COL.fur, COL.cream, 0.2) });
    }
    const tube = K.mesh(r, b => Rig.loft(b, rings, 14, { uv: true }));
    const cards = K.mesh(r, b => {
      scatter(b, 260, 71, (u, v) => {
        const th = u * 2 * PI, y = -v;
        const rx = lerp(0.036, 0.050, v), rz = lerp(0.038, 0.054, v);
        const front = C(th);
        const p = [S(th) * rx, y, C(th) * rz];
        const n = V3.norm([S(th), 0, C(th)]);
        const col = front > 0.1 ? mix(COL.cream, COL.creamDk, 0.25) : COL.fur;
        return { p, n, flow: [0, 1, 0], col, len: front > 0 ? 1.3 : 0.9 };
      }, { len: [0.018, 0.03], wid: [0.012, 0.02], lift: [0.3, 0.75] });
    });
    return { tube, cards };
  }

  function limbMesh(r, len, r0, r1, col, seed, fluff) {
    const rings = [];
    for (let i = 0; i <= 5; i++) {
      const k = i / 5;
      rings.push({ y: -len * k, rx: lerp(r0, r1, k), rz: lerp(r0, r1, k) * 1.05, col });
    }
    const tube = K.mesh(r, b => Rig.loft(b, rings, 10, { capTop: true, uv: true }));
    const cards = K.mesh(r, b => {
      scatter(b, Math.round(95 * fluff), seed, (u, v) => {
        const th = u * 2 * PI, k = v * 0.95;
        const rad = lerp(r0, r1, k);
        const p = [S(th) * rad, -len * k, C(th) * rad * 1.05];
        const n = [S(th), 0.1, C(th)];
        return { p, n: V3.norm(n), flow: [0, -1, 0], col: tone(col, 1.02), len: fluff };
      }, { len: [0.01, 0.018], wid: [0.009, 0.014], lift: [0.2, 0.55] });
    });
    return { tube, cards };
  }

  function pawMesh(r) {
    return K.mesh(r, b => {
      b.at(0, 0.010, 0.004, h => h.ellipsoid(0.019, 0.012, 0.024, 12, 8, COL.fur));
      [-1.5, -0.5, 0.5, 1.5].forEach(k => {
        const x = k * 0.0085, z = 0.022 - Math.abs(k) * 0.003;
        b.at(x, 0.008, z, h => h.ellipsoid(0.0058, 0.0072, 0.0068, 8, 6, COL.fur));
        b.push(M4.translate(x, 0.006, z + 0.006), M4.rotX(1.75));
        b.prism(4, 0.0014, 0.0014, 0, 0, 0, 0.0065, COL.claw, { capTop: false });
        b.pop();
      });
      b.at(0, 0.002, 0.002, h => h.ellipsoid(0.012, 0.002, 0.014, 8, 4, COL.pad));
    });
  }

  function tailMeshes(r) {
    const blob = K.mesh(r, b => b.ellipsoid(1, 1, 1, 10, 7, COL.fur));
    const cards = K.mesh(r, b => {
      scatter(b, 48, 83, (u, v) => {
        const th = u * 2 * PI, ph = (v - 0.5) * PI * 0.9;
        const n = [S(th) * C(ph), S(ph), C(th) * C(ph)];
        return { p: n, n, flow: [0, 1, 0], col: tone(COL.fur, 1.02), len: 1 };
      }, { len: [0.8, 1.3], wid: [0.5, 0.8], lift: [0.25, 0.7] });
    });
    return { blob, cards };
  }

  function build(r) {
    const tex = {
      face: r.texture(1024, faceTexture, { height: 512, clamp: true }),
      iris: r.texture(128, irisTexture, { clamp: true }),
      tuft: r.texture(256, tuftTexture, { height: 128, clamp: true }),
      fur: r.texture(256, furTexture)
    };
    const torsos = new Map();
    const P = {
      tex,
      head: headMeshes(r),
      headCards: headCards(r),
      mouth: mouthMeshes(r),
      eye: eyeMeshes(r),
      ear: earMeshes(r),
      earM: [earFrame(1), earFrame(-1)],
      whiskers: whiskerMesh(r, 1),
      thinWhiskers: whiskerMesh(r, 0.55),
      neck: neckMeshes(r),
      upperFront: limbMesh(r, 0.1, 0.036, 0.026, LEG, 101, 1.1),
      lowerFront: limbMesh(r, 0.092, 0.022, 0.017, LEG, 103, 0.8),
      upperHind: limbMesh(r, 0.11, 0.048, 0.032, LEG, 107, 1.4),
      lowerHind: limbMesh(r, 0.1, 0.027, 0.017, LEG, 109, 1.1),
      meta: limbMesh(r, 0.06, 0.017, 0.015, LEG, 113, 0.6),
      paw: pawMesh(r),
      tail: tailMeshes(r),
      torso(arch) {
        const key = Math.round(clamp(arch, 0, 1) * 4);
        if (!torsos.has(key)) torsos.set(key, torsoMeshes(r, key / 4));
        return torsos.get(key);
      }
    };
    return P;
  }

  function rotYXZ(ang) {
    return M4.chain(M4.rotY(ang[1] || 0), M4.rotX(-(ang[0] || 0)), M4.rotZ(ang[2] || 0));
  }

  function solve(st) {
    const root = M4.chain(M4.translate(st.p[0], st.p[1] || 0, st.p[2]), M4.rotY(st.yaw || 0));
    const crouch = st.crouch || 0, arch = st.arch || 0;
    const lean = st.lean || 0;
    const body = M4.chain(root, M4.translate(0, -crouch * 0.05, 0), M4.translate(0, 0.19, 0), M4.rotX(-lean), M4.rotZ(st.roll || 0), M4.translate(0, -0.19, 0));
    const breathe = 1 + S((st.t || 0) * 2.6) * 0.012;
    const torsoM = M4.chain(body, M4.translate(0, 0.19, 0), M4.scale(breathe, breathe, 1), M4.translate(0, -0.19, 0));
    const nk = st.neck || [0, 0];
    const nb = M4.point(body, [NECK.base[0], NECK.base[1] + arch * 0.03, NECK.base[2]]);
    const nPitch = NECK.pitch + (nk[0] || 0);
    const nDir = M4.dir(body, M4.dir(M4.rotY(nk[1] || 0), [0, S(nPitch), C(nPitch)]));
    const atlas = V3.add(nb, V3.mul(nDir, NECK.len * (st.stretch || 1)));
    const bodyRot = new Float32Array(body);
    bodyRot[12] = 0; bodyRot[13] = 0; bodyRot[14] = 0;
    const headRot = M4.chain(bodyRot, rotYXZ(st.head || [0, 0, 0]));
    const head = M4.chain(M4.translate(atlas[0], atlas[1], atlas[2]), headRot, M4.scale(HEAD_SCALE), M4.translate(ATLAS_HEAD[0], ATLAS_HEAD[1], ATLAS_HEAD[2]));
    const neckM = Rig.boneM(atlas, nb, M4.dir(body, [0, 0, 1]));
    const neckLen = V3.len(V3.sub(nb, atlas));
    const jaw = M4.chain(head, M4.translate(HINGE[0], HINGE[1], HINGE[2]), M4.rotX(clamp(st.jaw || 0, 0, 1) * 0.2), M4.translate(-HINGE[0], -HINGE[1], -HINGE[2]));
    const legs = LEGS.map((L, i) => {
      const plant = (st.paws && st.paws[i]) || L.paw;
      const rootW = M4.point(body, [L.root[0], L.root[1] + arch * (L.front ? 0.02 : 0.03), L.root[2]]);
      const pawW = M4.point(root, plant);
      const fwd = M4.dir(root, [0, 0, 1]);
      if (L.front) {
        const wrist = V3.add(pawW, V3.add([0, 0.024, 0], V3.mul(fwd, -0.004)));
        const sol = Rig.ik(rootW, wrist, L.l1, L.l2, V3.mul(fwd, -1));
        return {
          segs: [
            { part: 'upperFront', m: Rig.boneM(rootW, sol.mid, fwd) },
            { part: 'lowerFront', m: Rig.boneM(sol.mid, sol.end, fwd) }
          ],
          paw: M4.chain(M4.translate(pawW[0], pawW[1], pawW[2]), M4.rotY((st.yaw || 0) + L.side * 0.08))
        };
      }
      const hock = V3.add(pawW, V3.add([0, 0.058, 0], V3.mul(fwd, -0.03)));
      const sol = Rig.ik(rootW, hock, L.l1, L.l2, fwd);
      return {
        segs: [
          { part: 'upperHind', m: Rig.boneM(rootW, sol.mid, fwd) },
          { part: 'lowerHind', m: Rig.boneM(sol.mid, sol.end, fwd) },
          { part: 'meta', m: Rig.boneM(sol.end, V3.add(pawW, [0, 0.012, 0]), fwd) }
        ],
        paw: M4.chain(M4.translate(pawW[0], pawW[1], pawW[2]), M4.rotY((st.yaw || 0) + L.side * 0.05))
      };
    });
    const tl = st.tail || {};
    const tail = [];
    let tp = M4.point(body, [TAIL.base[0], TAIL.base[1] + arch * 0.02, TAIL.base[2]]);
    let tdir = [0, 0, -1];
    let pitch = tl.lift === undefined ? -0.9 : tl.lift;
    let yaw = tl.side0 || 0;
    for (let i = 0; i < TAIL.n; i++) {
      const k = i / (TAIL.n - 1);
      pitch += (tl.curl || 0) * (1 - k * 0.3) + (tl.wave || 0) * S(i * 0.9 + (st.t || 0) * 1.4) * 0.04;
      yaw += (tl.side || 0) + (tl.sway || 0) * S((st.t || 0) * 1.1 - i * 0.45) * 0.06;
      tdir = M4.dir(body, M4.dir(M4.chain(M4.rotY(yaw), M4.rotX(pitch)), [0, 0, -1]));
      const next = V3.add(tp, V3.mul(tdir, TAIL.seg));
      const rad = lerp(0.03, 0.022, k) * (k > 0.85 ? lerp(1, 0.75, (k - 0.85) / 0.15) : 1);
      const mid = V3.mul(V3.add(tp, next), 0.5);
      tail.push(M4.chain(Rig.boneM(mid, V3.sub(mid, tdir), [0, 1, 0]), M4.scale(rad, TAIL.seg * 0.85, rad)));
      tp = next;
    }
    const eyes = [0, 1].map(i => {
      const s = i === 0 ? 1 : -1;
      const local = M4.mul(head, P_EYE[i]);
      return { s, m: local };
    });
    return { root, body, torsoM, arch, head, jaw, neckM, neckLen, atlas, nb, legs, tail, eyes, st };
  }

  const P_EYE = [eyeFrame(1), eyeFrame(-1)];

  function lookRot(eyeM, target, limit) {
    if (!target) return M4.ident();
    const inv = [eyeM[12], eyeM[13], eyeM[14]];
    const d = V3.norm(V3.sub(target, inv));
    const z = [eyeM[8], eyeM[9], eyeM[10]], x = [eyeM[0], eyeM[1], eyeM[2]], y = [eyeM[4], eyeM[5], eyeM[6]];
    const yaw = clamp(Math.atan2(V3.dot(d, x), V3.dot(d, z)), -limit, limit);
    const pit = clamp(Math.atan2(V3.dot(d, y), V3.dot(d, z)), -limit, limit);
    return M4.chain(M4.rotY(yaw), M4.rotX(-pit));
  }

  function items(P, sol) {
    const st = sol.st;
    const tufts = { texture: P.tex.tuft };
    const list = [];
    const add = (mesh, m, opt, kind) => list.push({ mesh, m, opt: opt || {}, kind: kind || 'base' });
    const fur = { texture: P.tex.fur };
    const T = P.torso(sol.arch);
    add(T.body, sol.torsoM, fur);
    add(T.cards, sol.torsoM, tufts, 'fur');
    const neckM = M4.mul(sol.neckM, M4.scale(1, sol.neckLen, 1));
    add(P.neck.tube, neckM, fur);
    add(P.neck.cards, neckM, tufts, 'fur');
    sol.legs.forEach(L => {
      L.segs.forEach(sg => {
        add(P[sg.part].tube, sg.m, fur);
        add(P[sg.part].cards, sg.m, tufts, 'fur');
      });
      add(P.paw, L.paw);
    });
    sol.tail.forEach(m => {
      add(P.tail.blob, m);
      add(P.tail.cards, m, tufts, 'fur');
    });
    add(P.head.upper, sol.head, { texture: P.tex.face });
    add(P.head.jaw, sol.jaw, { texture: P.tex.face });
    add(P.mouth.top, sol.head, null, 'inner');
    add(P.mouth.low, sol.jaw, null, 'inner');
    if ((st.jaw || 0) > 0.12) {
      add(P.mouth.topTeeth, sol.head, null, 'inner');
      add(P.mouth.lowTeeth, sol.jaw, null, 'inner');
    }
    add(P.headCards.cards, sol.head, tufts, 'fur');
    add(P.headCards.jawCards, sol.jaw, tufts, 'fur');
    const close = clamp(Math.max(clamp(st.blink || 0, 0, 1), clamp(st.squint || 0, 0, 1) * 0.55), 0, 1);
    const scaleM = M4.scale(EYE.r);
    sol.eyes.forEach(E => {
      add(P.eye.ball, M4.chain(E.m, lookRot(E.m, st.look, 0.32), scaleM), { texture: P.tex.iris }, 'inner');
      add(P.eye.upper, M4.chain(E.m, M4.rotX(close * 0.98 - (st.wide || 0) * 0.12), scaleM));
      add(P.eye.lower, M4.chain(E.m, M4.rotX(-close * 0.12), scaleM));
    });
    const ears = st.ears || [0, 0];
    [0, 1].forEach(i => {
      const s = i === 0 ? 1 : -1;
      const m = M4.chain(sol.head, P.earM[i], M4.rotX(-(ears[i] || 0)), M4.rotZ(s * (ears[i] || 0) * 0.4));
      add(P.ear.outer, m);
      add(P.ear.inner, m);
      add(P.ear.cards, m, tufts, 'fur');
    });
    add(sol.st.thin ? P.thinWhiskers : P.whiskers, sol.head, { blend: true, alpha: 0.36 }, 'whisker');
    return list;
  }

  function draw(r, P, sol, opts) {
    const o = opts || {};
    const list = items(P, sol);
    if (o.outline) {
      const c = M4.point(sol.body, [0, 0.2, -0.02]);
      const pre = M4.chain(M4.translate(c[0], c[1], c[2]), M4.scale(o.outlineScale || 1.13), M4.translate(-c[0], -c[1], -c[2]));
      list.forEach(it => { if (it.kind === 'base') r.draw(it.mesh, M4.mul(pre, it.m), { flat: o.outline, noFog: true, blend: true, alpha: 1 }); });
    }
    list.forEach(it => {
      if (o.bald && it.kind === 'fur') return;
      if (o.noWhiskers && it.kind === 'whisker') return;
      r.draw(it.mesh, it.m, it.opt);
    });
  }

  function drawShadow(r, P, sol, light, opts) {
    const o = Object.assign({ shadow: true, blend: true, alpha: 0.45, flat: [0.1, 0.13, 0.18, 1], noFog: true }, opts || {});
    const sh = M4.planarShadow(light, 0.002);
    const T = P.torso(sol.arch);
    const fat = (m, k) => M4.chain(m, M4.scale(k));
    r.draw(T.body, M4.chain(sh, sol.torsoM, M4.translate(0, 0.19, -0.02), M4.scale(1.12), M4.translate(0, -0.19, 0.02)), o);
    r.draw(P.neck.tube, M4.chain(sh, sol.neckM, M4.scale(1.15, sol.neckLen, 1.15)), o);
    r.draw(P.head.upper, M4.chain(sh, fat(sol.head, 1.15)), o);
    r.draw(P.head.jaw, M4.chain(sh, sol.jaw), o);
    sol.legs.forEach(L => {
      L.segs.forEach(sg => r.draw(P[sg.part].tube, M4.chain(sh, sg.m, M4.scale(1.25, 1, 1.25)), o));
      r.draw(P.paw, M4.chain(sh, L.paw), o);
    });
    sol.tail.forEach(m => r.draw(P.tail.blob, M4.chain(sh, m, M4.scale(1.35, 1, 1.35)), o));
    [0, 1].forEach(i => r.draw(P.ear.outer, M4.chain(sh, sol.head, P.earM[i]), o));
  }

  function headPoint(sol, local) {
    return M4.point(sol.head, local || [0, 0, 0]);
  }

  window.GrubCast = { COL, HEAD, EYE, LEGS, TAIL, NECK, headPt, headBase, lipP, build, solve, draw, drawShadow, headPoint };
})();
