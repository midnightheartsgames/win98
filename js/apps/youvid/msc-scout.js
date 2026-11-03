(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Rig = window.YouVidRig;

  const D = { chestY: 0.12, neckY: 0.43, headY: 0.13, shX: 0.17, shY: 0.335, upper: 0.29, fore: 0.27, hipX: 0.1, hipY: -0.05, thigh: 0.45, shin: 0.44 };
  const HEAD_SCALE = M4.scale(1.14, 1.14, 1.14);

  const COL = {
    skin: 0xd4976d, skinDk: 0xb07450, shirt: 0xc84f47, shirtDk: 0x9e3a34, shirtHi: 0xd4584e, strap: 0x4c4642, strapDk: 0x34302c, bag: 0x403b37,
    tag: 0xb8b8b2, chain: 0x8e8e8a, pants: 0x5e5c4c, pantsDk: 0x4a4838, belt: 0x2a2624, buckle: 0x9a9890, sock: 0xe6e4dc, shoe: 0x262322,
    sole: 0xdedad2, wrap: 0xd6d4ca, wrapDk: 0xb2b0a6, cap: 0x363230, capDk: 0x252221, band: 0x2a2826, cup: 0xd27a36, cupDk: 0x9a5426,
    boom: 0x8a8a86, mic: 0x1e1c1c, tongue: 0x9a4a46, hair: 0x4a3426
  };

  const TEAM = {
    red: { shirt: COL.shirt, shirtDk: COL.shirtDk, css: '#c84f47', fold: '70,12,10', crease: 'rgba(110,24,20,0.28)', hem: 'rgba(80,16,14,0.35)' },
    blu: { shirt: 0x5b8bb4, shirtDk: 0x44698c, css: '#5b8bb4', fold: '14,34,60', crease: 'rgba(24,52,90,0.3)', hem: 'rgba(16,40,70,0.35)' }
  };

  const SKIN_MAT = { spec: [0.1, 8], rim: 1.1 };
  const CLOTH_MAT = { spec: [0.05, 5], rim: 0.9 };
  const EYE_MAT = { spec: [0.9, 60], rim: 0.2 };
  const CAP_MAT = { spec: [0.08, 6], rim: 0.8 };
  const CUP_MAT = { spec: [0.4, 20], rim: 0.6 };
  const TAG_MAT = { spec: [0.9, 30], rim: 0.5 };

  function table(rows) {
    return (x) => {
      const n = rows.length;
      if (x <= rows[0][0]) return rows[0][1];
      if (x >= rows[n - 1][0]) return rows[n - 1][1];
      let i = 0;
      while (i < n - 2 && x > rows[i + 1][0]) i++;
      const p0 = rows[Math.max(0, i - 1)], p1 = rows[i], p2 = rows[i + 1], p3 = rows[Math.min(n - 1, i + 2)];
      const h = p2[0] - p1[0];
      const t = (x - p1[0]) / h;
      const m1 = (p2[1] - p0[1]) / (p2[0] - p0[0]) * h;
      const m2 = (p3[1] - p1[1]) / (p3[0] - p1[0]) * h;
      const t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2;
    };
  }

  const YT = table([[-1.571, -0.113], [-1.25, -0.111], [-1.0, -0.105], [-0.8, -0.096], [-0.62, -0.085], [-0.48, -0.073], [-0.3, -0.056], [-0.2, -0.042], [-0.09, -0.024],
    [0.05, -0.002], [0.2, 0.02], [0.33, 0.038], [0.5, 0.058], [0.7, 0.074], [0.95, 0.085], [1.2, 0.091], [1.571, 0.094]]);
  const HW = table([[-1.571, 0.03], [-1.25, 0.043], [-1.0, 0.052], [-0.8, 0.059], [-0.62, 0.065], [-0.48, 0.068], [-0.3, 0.071], [-0.2, 0.073], [-0.09, 0.075],
    [0.05, 0.077], [0.2, 0.078], [0.33, 0.078], [0.5, 0.076], [0.7, 0.069], [0.95, 0.055], [1.2, 0.038], [1.571, 0.0]]);
  const DF = table([[-1.571, 0.035], [-1.25, 0.055], [-1.0, 0.074], [-0.8, 0.086], [-0.62, 0.092], [-0.48, 0.09], [-0.33, 0.092], [-0.2, 0.091], [-0.08, 0.088],
    [0.05, 0.086], [0.2, 0.084], [0.33, 0.088], [0.5, 0.085], [0.7, 0.074], [0.95, 0.058], [1.2, 0.04], [1.571, 0.0]]);
  const DB = table([[-1.571, 0.02], [-1.1, 0.05], [-0.6, 0.074], [-0.2, 0.09], [0.2, 0.098], [0.6, 0.09], [0.95, 0.064], [1.25, 0.04], [1.571, 0.0]]);

  const NU = 72, NL = 16, NUP = 30, MW = 0.48;
  const HINGE = [0, -0.022, -0.012];
  const EYE_R = 0.0122;
  const CHANNELS = ['browDown', 'browUp', 'browInUp', 'smileL', 'smileR', 'frown', 'wide', 'round', 'sneer'];

  const g2 = (x, s) => Math.exp(-(x / s) * (x / s));
  const smooth = (e0, e1, x) => { const k = clamp((x - e0) / (e1 - e0), 0, 1); return k * k * (3 - 2 * k); };

  function lipP(a) {
    const q = a / 0.44;
    return -0.33 + 0.005 * Math.min(q * q, 1.6);
  }

  function yawAt(i) {
    const s = 2 * i / NU - 1;
    return PI * Math.sign(s) * Math.pow(Math.abs(s), 1.35);
  }

  function squircle(p) {
    return 0.14 * smooth(-1.05, -0.65, p) * (1 - smooth(0.4, 0.8, p));
  }

  function rawPt(a, p) {
    const q = squircle(p);
    const sa = S(a), ca = C(a);
    const hw = HW(p), d = ca > 0 ? DF(p) : DB(p);
    return [sa * hw * (1 + q * ca * ca), YT(p), ca * d * (1 + q * sa * sa)];
  }

  function approxNormal(a, p) {
    const e = 0.004;
    const pa = rawPt(a + e, p), pb = rawPt(a - e, p);
    const qa = rawPt(a, Math.min(p + e, 1.57)), qb = rawPt(a, Math.max(p - e, -1.57));
    const n = V3.cross(V3.sub(pa, pb), V3.sub(qa, qb));
    const len = V3.len(n);
    return len > 1e-9 ? V3.mul(n, 1 / len) : V3.norm(rawPt(a, p));
  }

  function segDist(x, y, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy), 0, 1);
    return Math.hypot(x - ax - dx * t, y - ay - dy * t);
  }

  function relief(a, p) {
    const A = Math.abs(a);
    const dl = p - lipP(a);
    let h = 0;
    const down = clamp((0.3 - p) / 0.4, 0, 1);
    h += (0.005 + 0.017 * down) * g2(a, 0.07 + 0.03 * down) * smooth(-0.15, -0.1, p) * (1 - smooth(0.27, 0.35, p));
    h += 0.007 * g2(a, 0.1) * g2(p + 0.09, 0.045);
    h += 0.004 * g2(A - 0.11, 0.045) * g2(p + 0.115, 0.032);
    h -= 0.003 * g2(a, 0.035) * g2(p + 0.2, 0.05);
    h += 0.0065 * g2(A - 0.3, 0.2) * g2(p - 0.345, 0.05);
    h += 0.003 * g2(a, 0.09) * g2(p - 0.31, 0.05);
    h -= 0.004 * g2(A - 0.34, 0.12) * g2(p - 0.2, 0.08);
    h += 0.009 * g2(A - 0.62, 0.17) * g2(p - 0.08, 0.08);
    h -= 0.006 * g2(A - 0.6, 0.18) * g2(p + 0.2, 0.1);
    h -= 0.002 * g2(segDist(A, p, 0.16, -0.12, MW, lipP(MW) - 0.01), 0.025);
    h += 0.0035 * g2(dl - 0.022, 0.022) * (1 - smooth(MW, MW + 0.08, A));
    h += 0.005 * g2(dl + 0.03, 0.026) * g2(a, 0.32);
    h -= 0.004 * g2(dl + 0.08, 0.03) * g2(a, 0.32);
    h += 0.011 * g2(a, 0.38) * g2(p + 0.68, 0.12);
    h -= 0.0025 * g2(a, 0.035) * g2(p + 0.66, 0.08);
    h += 0.004 * g2(A - 1.0, 0.25) * g2(p + 0.55, 0.14);
    h -= 0.004 * g2(A - 1.0, 0.2) * g2(p - 0.35, 0.15);
    return h;
  }

  function eyeFrame(s) {
    const a = s * 0.36, p = 0.21;
    const q = rawPt(a, p);
    const n = approxNormal(a, p);
    const c = V3.sub(q, V3.mul(n, EYE_R * 0.95));
    const z = V3.norm([s * 0.1, 0.02, 1]);
    const x = V3.norm(V3.cross([0, 1, 0], z));
    const y = V3.cross(z, x);
    return { side: s, c, x, y, z };
  }

  const EYES = [eyeFrame(-1), eyeFrame(1)];

  function eyeWrap(q) {
    let out = q;
    EYES.forEach(f => {
      const d = V3.sub(out, f.c);
      const lx = V3.dot(d, f.x), ly = V3.dot(d, f.y), lz = V3.dot(d, f.z);
      const r = Math.hypot(lx, ly, lz);
      if (lz <= 0 || r > EYE_R * 4.2) return;
      const psi = Math.atan2(lx, lz), phi = Math.atan2(ly, Math.hypot(lx, lz));
      const e = Math.sqrt((psi / 1.12) * (psi / 1.12) + (phi / 0.7) * (phi / 0.7));
      let nr;
      if (e <= 1) {
        const wr = 1 - smooth(1.3, 2.0, r / EYE_R);
        if (wr <= 0) return;
        nr = lerp(r, EYE_R * 0.88, wr);
      } else {
        const w = 1 - smooth(0, 1, (e - 1) / 0.6);
        if (w <= 0 || r >= EYE_R * 1.13) return;
        nr = lerp(r, EYE_R * 1.13, w);
      }
      out = V3.add(f.c, V3.mul(d, nr / r));
    });
    return out;
  }

  function basePt(a, p) {
    return eyeWrap(V3.add(rawPt(a, p), V3.mul(approxNormal(a, p), relief(a, p))));
  }

  function deltas(a, p) {
    const A = Math.abs(a), sg = Math.sign(a) || 1;
    const dl = p - lipP(a);
    const inMouth = 1 - smooth(MW - 0.02, MW + 0.1, A);
    const out = {};
    const gB = g2(A - 0.3, 0.2) * g2(p - 0.33, 0.1) * smooth(0.22, 0.3, p);
    const gG = g2(a, 0.07) * g2(p - 0.3, 0.06);
    out.browDown = [-sg * 0.003 * gB, -0.0075 * gB, 0.0025 * gB - 0.0025 * gG];
    const gU = g2(A - 0.3, 0.26) * g2(p - 0.38, 0.13);
    out.browUp = [0, 0.009 * gU, -0.001 * gU];
    const gI = g2(A - 0.12, 0.11) * g2(p - 0.34, 0.08);
    out.browInUp = [0, 0.007 * gI, 0];
    const gC = g2(A - MW, 0.12) * g2(dl, 0.08);
    const gK = g2(A - 0.5, 0.15) * g2(p + 0.12, 0.1);
    const gL = g2(A - 0.33, 0.14) * g2(p - 0.13, 0.05);
    const smile = [sg * (0.009 * gC + 0.003 * gK), 0.014 * gC + 0.007 * gK + 0.003 * gL, -0.005 * gC + 0.004 * gK + 0.001 * gL];
    const none = [0, 0, 0];
    out.smileL = a > 0 ? smile : none;
    out.smileR = a < 0 ? smile : none;
    if (A < 0.02) {
      const half = V3.mul(smile, 0.5);
      out.smileL = half;
      out.smileR = half;
    }
    const gF = g2(A - MW, 0.16) * g2(dl, 0.12);
    out.frown = [0, -0.008 * gF, 0];
    const gUp = g2(dl - 0.025, 0.035) * inMouth;
    const gLo = g2(dl + 0.03, 0.04) * inMouth;
    out.wide = [sg * 0.007 * gC, 0.006 * gUp - 0.007 * gLo, 0.001 * gLo - 0.003 * gC];
    const gR = g2(dl, 0.08) * (1 - smooth(MW, MW + 0.12, A));
    const x0 = rawPt(a, p)[0];
    out.round = [-x0 * 0.33 * gR, 0, 0.008 * gR];
    const gS = g2(A - 0.13, 0.08) * g2(p + 0.1, 0.07);
    out.sneer = [0, 0.005 * gS + 0.002 * gUp, 0.001 * gS];
    return out;
  }

  function jawWeight(a, p, lower) {
    if (!lower) return 0;
    const A = Math.abs(a);
    const side = (1 - smooth(1.0, 1.7, A)) * smooth(-1.3, -0.75, p);
    const below = lipP(a) - p;
    if (A < MW) {
      const taper = Math.sqrt(clamp(1 - (A / MW) * (A / MW), 0, 1));
      return Math.max(taper, clamp(below / 0.12, 0, 1)) * side;
    }
    return clamp(below / (0.08 + 0.7 * (A - MW)), 0, 1) * side;
  }

  function headTemplate() {
    const rows = [];
    for (let j = 0; j <= NL; j++) rows.push({ lower: true, f: Math.pow(j / NL, 0.75) });
    for (let k = 0; k <= NUP; k++) rows.push({ lower: false, f: Math.pow(k / NUP, 1.3) });
    const cols = NU + 1;
    const nv = rows.length * cols;
    const base = new Float32Array(nv * 3);
    const uv = new Float32Array(nv * 2);
    const jw = new Float32Array(nv);
    const dch = CHANNELS.map(() => new Float32Array(nv * 3));
    rows.forEach((row, j) => {
      for (let i = 0; i < cols; i++) {
        const a = yawAt(i);
        const lp = lipP(a);
        const p = row.lower ? -PI / 2 + (lp + PI / 2) * row.f : lp + (PI / 2 - lp) * row.f;
        const v = j * cols + i;
        base.set(basePt(a, p), v * 3);
        uv[v * 2] = (a + PI) / (2 * PI);
        uv[v * 2 + 1] = (p + PI / 2) / PI;
        jw[v] = jawWeight(a, p, row.lower);
        const dd = deltas(a, p);
        CHANNELS.forEach((c, ci) => dch[ci].set(dd[c], v * 3));
      }
    });
    const idx = [];
    const strip = (r0, r1) => {
      for (let j = r0; j < r1; j++) {
        for (let i = 0; i < NU; i++) {
          const a = j * cols + i, b = a + 1, c = a + cols + 1, d = a + cols;
          idx.push(a, b, c, a, c, d);
        }
      }
    };
    strip(0, NL);
    strip(NL + 1, rows.length - 1);
    return { rows, cols, nv, base, uv, jw, dch, idx: new Uint16Array(idx) };
  }

  function deformHead(T, F, out) {
    const nv = T.nv;
    const pos = out.pos;
    const w = CHANNELS.map(c => F[c] || 0);
    const jaw = clamp(F.jaw || 0, 0, 1.2) * 0.32;
    for (let v = 0; v < nv; v++) {
      let x = T.base[v * 3], y = T.base[v * 3 + 1], z = T.base[v * 3 + 2];
      for (let c = 0; c < w.length; c++) {
        if (!w[c]) continue;
        const d = T.dch[c];
        x += d[v * 3] * w[c];
        y += d[v * 3 + 1] * w[c];
        z += d[v * 3 + 2] * w[c];
      }
      const jw = T.jw[v] * jaw;
      if (jw > 1e-5) {
        const c = C(jw), s = S(jw);
        const yy = y - HINGE[1], zz = z - HINGE[2];
        y = HINGE[1] + yy * c - zz * s;
        z = HINGE[2] + yy * s + zz * c;
      }
      pos[v * 3] = x;
      pos[v * 3 + 1] = y;
      pos[v * 3 + 2] = z;
    }
    const cols = T.cols, nr = T.rows.length;
    const data = out.data;
    for (let j = 0; j < nr; j++) {
      const lowerPart = j <= NL;
      const r0 = lowerPart ? 0 : NL + 1, r1 = lowerPart ? NL : nr - 1;
      for (let i = 0; i < cols; i++) {
        const v = j * cols + i;
        const il = i === 0 ? NU - 1 : i - 1, ir = i === NU ? 1 : i + 1;
        const jd = Math.max(r0, j - 1), ju = Math.min(r1, j + 1);
        const a = (j * cols + ir) * 3, b = (j * cols + il) * 3, c = (ju * cols + i) * 3, d = (jd * cols + i) * 3;
        const tx = pos[a] - pos[b], ty = pos[a + 1] - pos[b + 1], tz = pos[a + 2] - pos[b + 2];
        const ux = pos[c] - pos[d], uy = pos[c + 1] - pos[d + 1], uz = pos[c + 2] - pos[d + 2];
        let nx = ty * uz - tz * uy, ny = tz * ux - tx * uz, nz = tx * uy - ty * ux;
        let len = Math.hypot(nx, ny, nz);
        const px = pos[v * 3], py = pos[v * 3 + 1], pz = pos[v * 3 + 2];
        if (len < 1e-10) {
          nx = px; ny = py; nz = pz;
          len = Math.hypot(nx, ny, nz) || 1;
        }
        nx /= len; ny /= len; nz /= len;
        if (nx * px + ny * (py + 0.02) + nz * pz < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const o = v * 12;
        data[o] = px; data[o + 1] = py; data[o + 2] = pz;
        data[o + 3] = nx; data[o + 4] = ny; data[o + 5] = nz;
        data[o + 6] = 1; data[o + 7] = 1; data[o + 8] = 1; data[o + 9] = 0;
        data[o + 10] = T.uv[v * 2]; data[o + 11] = T.uv[v * 2 + 1];
      }
    }
    return data;
  }

  function faceUV(a, p, W, H) {
    return [(a + PI) / (2 * PI) * W, (1 - (p + PI / 2) / PI) * H];
  }

  function paintFace(ctx, W, H) {
    const P = (a, p) => faceUV(a, p, W, H);
    const sx = W / (2 * PI), sy = H / PI;
    const blob = (a, p, ra, rp, col, alpha) => {
      const [x, y] = P(a, p);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1, (rp * sy) / (ra * sx));
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ra * sx);
      g.addColorStop(0, `rgba(${col},${alpha})`);
      g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, ra * sx, 0, PI * 2);
      ctx.fill();
      ctx.restore();
    };
    const line = (pts, width, col) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      pts.forEach(([a, p], i) => (i ? ctx.lineTo(...P(a, p)) : ctx.moveTo(...P(a, p))));
      ctx.stroke();
    };
    ctx.fillStyle = '#d4976d';
    ctx.fillRect(0, 0, W, H);
    const vg = ctx.createLinearGradient(0, 0, 0, H);
    vg.addColorStop(0, 'rgba(240,180,132,0.3)');
    vg.addColorStop(0.45, 'rgba(240,180,132,0)');
    vg.addColorStop(0.72, 'rgba(130,70,46,0)');
    vg.addColorStop(1, 'rgba(130,70,46,0.25)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    [-1, 1].forEach(s => {
      blob(s * 0.33, 0.2, 0.14, 0.08, '120,64,44', 0.35);
      blob(s * 0.55, -0.02, 0.2, 0.12, '205,110,84', 0.2);
      blob(s * 0.62, -0.2, 0.18, 0.1, '150,82,58', 0.18);
      blob(s * 1.45, 0.0, 0.12, 0.14, '190,100,78', 0.3);
    });
    blob(0, -0.07, 0.1, 0.06, '205,102,80', 0.3);
    blob(0, 0.5, 0.5, 0.2, '240,186,140', 0.15);
    const g = rand(41);
    const side = (s) => {
      ctx.save();
      ctx.beginPath();
      const A = (a) => s * a;
      const pts = [[A(1.12), 0.42], [A(1.2), 0.1], [A(1.27), -0.12], [A(1.34), -0.14], [A(1.4), 0.08], [A(1.62), 0.3], [A(2.4), 0.2], [A(2.6), 0.5]];
      pts.forEach(([a, p], i) => (i ? ctx.lineTo(...P(a, p)) : ctx.moveTo(...P(a, p))));
      ctx.closePath();
      ctx.fillStyle = 'rgba(78,52,38,0.92)';
      ctx.fill();
      ctx.clip();
      for (let i = 0; i < 2600; i++) {
        const [x, y] = P(A(1.1 + g() * 1.5), -0.15 + g() * 0.65);
        ctx.fillStyle = `rgba(40,26,18,${0.1 + g() * 0.25})`;
        ctx.fillRect(x, y, 1, 2);
      }
      ctx.restore();
    };
    side(1);
    side(-1);
    ctx.fillStyle = 'rgba(78,52,38,0.92)';
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.moveTo(...P(s * PI, 1.2));
      ctx.lineTo(...P(s * 2.3, 1.2));
      ctx.lineTo(...P(s * 2.3, 0.35));
      ctx.quadraticCurveTo(...P(s * 2.6, -0.2), ...P(s * 2.95, -0.3));
      ctx.lineTo(...P(s * PI, -0.32));
      ctx.closePath();
      ctx.fill();
    });
    [-1, 1].forEach(s => {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const k = i / 12;
        pts.push([s * lerp(0.1, 0.52, k), 0.315 + 0.03 * S(k * PI * 0.95) - 0.018 * k]);
      }
      line(pts, 7, 'rgba(110,70,44,0.45)');
      line(pts, 4, 'rgba(80,50,30,0.9)');
      blob(s * 0.06, -0.126, 0.018, 0.009, '90,44,30', 0.4);
      ctx.strokeStyle = 'rgba(120,60,42,0.16)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(...P(s * 0.16, -0.125));
      ctx.quadraticCurveTo(...P(s * 0.3, -0.2), ...P(s * MW, lipP(MW) - 0.012));
      ctx.stroke();
      blob(s * 0.33, 0.135, 0.12, 0.025, '120,70,52', 0.3);
    });
    line([[-0.012, -0.66], [0, -0.62], [0.012, -0.66]], 2, 'rgba(110,60,42,0.35)');
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = lerp(-MW - 0.02, MW + 0.02, i / 40);
      const [x, y] = P(a, lipP(a) + 0.004);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for (let i = 40; i >= 0; i--) {
      const a = lerp(-MW - 0.02, MW + 0.02, i / 40);
      const k = 1 - Math.pow(Math.abs(a) / (MW + 0.02), 2);
      ctx.lineTo(...P(a, lipP(a) - 0.005 - 0.032 * k));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(178,100,82,0.55)';
    ctx.fill();
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = lerp(-MW - 0.02, MW + 0.02, i / 40);
      const [x, y] = P(a, lipP(a) - 0.003);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for (let i = 40; i >= 0; i--) {
      const a = lerp(-MW - 0.02, MW + 0.02, i / 40);
      const k = 1 - Math.pow(Math.abs(a) / (MW + 0.02), 2);
      ctx.lineTo(...P(a, lipP(a) + 0.006 + 0.018 * k));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(160,86,70,0.45)';
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(56,24,18,0.95)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = lerp(-MW, MW, i / 40);
      const [x, y] = P(a, lipP(a));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function paintEye(ctx, W, H) {
    ctx.fillStyle = '#e8e2da';
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = W * 0.36;
    const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
    g.addColorStop(0, '#c4dcec');
    g.addColorStop(0.6, '#7ea6c8');
    g.addColorStop(0.92, '#3e6084');
    g.addColorStop(1, '#263a50');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0d0d10';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.36, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(cx - R * 0.3, cy - R * 0.32, R * 0.14, 0, PI * 2);
    ctx.fill();
    const e = ctx.createRadialGradient(cx, cy, W * 0.3, cx, cy, W * 0.5);
    e.addColorStop(0, 'rgba(170,120,110,0)');
    e.addColorStop(1, 'rgba(170,120,110,0.5)');
    ctx.fillStyle = e;
    ctx.fillRect(0, 0, W, H);
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
        if (o.skip && o.skip(i / sides, j)) continue;
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
    [-0.15, 0.13, 0.102, 0.0], [-0.06, 0.134, 0.104, 0.006], [0.04, 0.14, 0.108, 0.012], [0.14, 0.15, 0.112, 0.014], [0.24, 0.165, 0.11, 0.012],
    [0.3, 0.178, 0.104, 0.006], [0.345, 0.172, 0.098, -0.002], [0.375, 0.15, 0.09, -0.006], [0.405, 0.116, 0.08, -0.008], [0.432, 0.088, 0.07, -0.004], [0.452, 0.066, 0.06, 0.0]
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

  function paintTorso(ctx, W, H, team) {
    const y0 = TORSO[0].y, y1 = TORSO[TORSO.length - 1].y;
    const Y = (y) => (1 - (y - y0) / (y1 - y0)) * H;
    const U = (ang) => ((ang + PI) / (2 * PI)) * W;
    ctx.fillStyle = team.css;
    ctx.fillRect(0, 0, W, H);
    const fold = ctx.createLinearGradient(0, 0, W, 0);
    fold.addColorStop(0, `rgba(${team.fold},0.16)`);
    fold.addColorStop(0.5, 'rgba(255,210,190,0.05)');
    fold.addColorStop(1, `rgba(${team.fold},0.16)`);
    ctx.fillStyle = fold;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = team.crease;
    ctx.lineWidth = 3;
    [[-0.4, 0.05, -0.15, -0.1], [0.45, 0.1, 0.2, -0.08], [-0.2, 0.3, -0.05, 0.2], [0.9, 0.2, 1.2, -0.05], [-1.0, 0.25, -1.25, -0.02]].forEach(([a0, ya, a1, yb]) => {
      ctx.beginPath();
      ctx.moveTo(U(a0), Y(ya));
      ctx.quadraticCurveTo(U((a0 + a1) / 2 + 0.05), Y((ya + yb) / 2), U(a1), Y(yb));
      ctx.stroke();
    });
    ctx.fillStyle = team.hem;
    ctx.fillRect(0, Y(-0.12), W, Y(-0.15) - Y(-0.12));
    const g = rand(9);
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = `rgba(${g() < 0.5 ? '0,0,0' : '255,255,255'},${g() * 0.045})`;
      ctx.fillRect(g() * W, g() * H, 2, 2);
    }
  }

  function buildTorso(b) {
    ringLoft(b, TORSO, 30, null, {});
    return b;
  }

  function buildCollar(b, team) {
    const rings = [{ y: 0.425, rx: 0.104, rz: 0.08, cz: -0.006 }, { y: 0.442, rx: 0.08, rz: 0.07, cz: -0.004 }, { y: 0.45, rx: 0.075, rz: 0.066, cz: -0.002 }];
    ringLoft(b, rings, 26, (u, y) => (y > 0.455 ? team.shirtDk : team.shirt), {});
    return b;
  }

  function strapPath() {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const k = i / 20;
      pts.push({ ang: lerp(0.6, -1.15, k), y: lerp(0.405, -0.1, Math.pow(k, 0.92)) });
    }
    return pts;
  }

  function strapBack() {
    const pts = [];
    for (let i = 0; i <= 18; i++) {
      const k = i / 18;
      pts.push({ ang: lerp(PI - 0.6, PI + 1.0, k), y: lerp(0.405, -0.06, Math.pow(k, 0.9)) });
    }
    return pts;
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

  function buildStrap(b) {
    ribbon(b, strapPath(), 0.028, 0.012, COL.strap);
    ribbon(b, strapBack(), 0.028, 0.012, COL.strap);
    const top = [];
    for (let i = 0; i <= 8; i++) {
      const k = i / 8;
      const a = lerp(0.6, PI - 0.6, k);
      const p = torsoSurf(a, 0.405, 0.012);
      const lift = S(k * PI);
      top.push([p[0] * (1 + lift * 0.18), 0.405 + lift * 0.035, p[2] * (1 - lift * 0.4)]);
    }
    for (let i = 0; i < top.length - 1; i++) {
      const a = top[i], c = top[i + 1];
      const t = V3.norm(V3.sub(c, a));
      const w = V3.mul(V3.norm(V3.cross([0, 1, 0], t)), 0.028);
      b.quad(V3.sub(a, w), V3.add(a, w), V3.add(c, w), V3.sub(c, w), COL.strap, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
    }
    const bk = torsoSurf(-0.55, 0.16, 0.014);
    const n = torsoNormal(-0.55, 0.16);
    b.push(M4.translate(bk[0], bk[1], bk[2]), M4.rotY(Math.atan2(n[0], n[2])), M4.rotZ(-0.95));
    b.box(0.07, 0.034, 0.012, COL.strapDk);
    b.at(0, 0, 0.007, h => h.box(0.03, 0.026, 0.004, COL.buckle));
    b.pop();
    return b;
  }

  function buildBag(b) {
    const p = torsoSurf(-2.55, -0.1, 0.04);
    b.push(M4.translate(p[0], p[1], p[2]), M4.rotY(-2.55 + PI), M4.rotZ(0.12));
    b.ellipsoid(0.14, 0.105, 0.045, 14, 8, COL.bag);
    b.at(0, 0.04, -0.03, h => {
      h.push(M4.rotX(-0.25));
      h.ellipsoid(0.142, 0.07, 0.022, 14, 6, COL.strapDk);
      h.pop();
    });
    b.at(0.0, 0.0, -0.05, h => h.box(0.03, 0.04, 0.006, COL.buckle));
    b.pop();
    return b;
  }

  function buildTags(b) {
    const chain = [];
    for (let i = 0; i <= 18; i++) {
      const k = i / 18;
      const a = lerp(-0.75, 0.75, k);
      const yN = 0.44 - 0.012 * Math.abs(S(a));
      const drop = Math.pow(C(a * 2.0), 2) * 0.12 * (Math.abs(a) < 0.75 ? 1 : 0);
      const y = yN - drop * (1 - Math.abs(a) / 0.75);
      const q = torsoSurf(a, clamp(y, 0.24, 0.452), 0.006);
      chain.push(q);
    }
    K.tube(b, chain, chain.map(() => 0.0028), 4, COL.chain);
    const back = [];
    for (let i = 0; i <= 10; i++) {
      const a = lerp(0.75, 2 * PI - 0.75, i / 10);
      back.push(torsoSurf(a, 0.442 + 0.006 * S(i / 10 * PI), 0.006));
    }
    K.tube(b, back, back.map(() => 0.0028), 4, COL.chain);
    const low = chain[9];
    const n = torsoNormal(0, low[1]);
    [[-0.012, 0.02, -0.1], [0.008, 0.026, 0.12]].forEach(([dx, dy, rz], i) => {
      b.push(M4.translate(low[0] + dx, low[1] - dy, low[2] + 0.003 + i * 0.002), M4.rotX(-Math.atan2(n[1], n[2]) + 0.05), M4.rotZ(rz));
      b.box(0.026, 0.042, 0.003, COL.tag);
      b.at(0, 0, 0.002, h => h.box(0.018, 0.03, 0.001, 0xa2a29c));
      b.pop();
    });
    return b;
  }

  function buildShoulderCaps(b, team) {
    [-1, 1].forEach(s => {
      b.at(s * 0.17, 0.35, -0.006, h => {
        h.push(M4.rotZ(-s * 0.55));
        h.ellipsoid(0.05, 0.034, 0.058, 16, 10, team.shirt);
        h.pop();
      });
    });
    return b;
  }

  function limbRings(len, keys) {
    return keys.map(([f, r, rz, cz]) => ({ y: -len * f, rx: r, rz: rz || r, cz: cz || 0 })).reverse();
  }

  function buildUpper(b, team) {
    const len = D.upper;
    const sleeveEnd = 0.46;
    const rings = limbRings(len, [[-0.12, 0.04], [0, 0.045, 0.047], [0.15, 0.047, 0.048, 0.004], [0.3, 0.047, 0.048, 0.004], [0.42, 0.047, 0.047, 0.004], [0.43, 0.051, 0.051, 0.004],
      [0.47, 0.051, 0.051, 0.004], [0.475, 0.036, 0.038, 0.003], [0.55, 0.035, 0.037, 0.004], [0.8, 0.033, 0.034, 0.002], [1.0, 0.03, 0.03], [1.08, 0.028, 0.028]]);
    const col = (u, y) => {
      const f = -y / len;
      if (f > 0.474) return COL.skin;
      return f > 0.425 ? team.shirtDk : team.shirt;
    };
    ringLoft(b, rings, 16, col, {});
    const inner = limbRings(len, [[sleeveEnd, 0.05], [sleeveEnd - 0.06, 0.048]]);
    ringLoft(b, inner, 16, () => team.shirtDk, {});
    return b;
  }

  function buildFore(b) {
    const len = D.fore;
    const rings = limbRings(len, [[-0.1, 0.028], [0, 0.031], [0.12, 0.034, 0.032, 0.002], [0.35, 0.032, 0.03, 0.002], [0.62, 0.027, 0.025], [0.72, 0.025, 0.023],
      [0.74, 0.029, 0.027], [0.9, 0.029, 0.027], [1.02, 0.028, 0.026], [1.06, 0.024, 0.022]]);
    const col = (u, y) => {
      const f = -y / len;
      if (f < 0.735) return COL.skin;
      return ((f * 40) | 0) % 2 ? COL.wrap : COL.wrapDk;
    };
    ringLoft(b, rings, 14, col, { capTop: true, capBottom: true });
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
    thumb: { curl: [1, 1, 1, 1], spread: 0, thumb: [0.9, 0.0] },
    hold: { curl: [0.5, 0.55, 0.6, 0.65], spread: 0.08, thumb: [0.8, 0.3] }
  };

  function palm(b) {
    const rows = [[0.012, 0.04, 0.025], [-0.02, 0.046, 0.027], [-0.06, 0.049, 0.024], [-0.092, 0.047, 0.02], [-0.104, 0.042, 0.016]];
    const sides = 14;
    const pt = (r, i) => {
      const a = (i / sides) * PI * 2;
      return [S(a) * r[1], r[0], C(a) * r[2]];
    };
    const colOf = (p) => (((p[1] * 140) | 0) % 2 ? COL.wrap : COL.wrapDk);
    for (let j = 0; j < rows.length - 1; j++) {
      for (let i = 0; i < sides; i++) {
        const a = pt(rows[j], i), bb = pt(rows[j], i + 1), c = pt(rows[j + 1], i + 1), d = pt(rows[j + 1], i);
        const ns = [a, bb, c, d].map(q => V3.norm([q[0] / 0.045, 0, q[2] / 0.022]));
        b.quad(a, bb, c, d, [a, bb, c, d].map(q => rgb(colOf(q))), null, ns);
      }
    }
    const top = rows[0], bot = rows[rows.length - 1];
    for (let i = 0; i < sides; i++) {
      b.tri([0, top[0], 0], pt(top, i), pt(top, i + 1), COL.wrap);
      b.tri([0, bot[0], 0], pt(bot, i + 1), pt(bot, i), COL.wrap);
    }
  }

  function fingerSegment(b, len, r0, r1, col, tipCol) {
    b.prism(8, r1, r1 * 0.92, -len, r0, r0 * 0.92, 0, col, { capTop: false });
    b.at(0, -len, 0, h => h.ellipsoid(r1 * 1.02, r1 * 1.02, r1 * 0.95, 8, 5, tipCol || col));
  }

  function buildHandMesh(b, side, poseName) {
    const k = side === 'L' ? 1 : -1;
    const pose = HAND_POSES[poseName] || HAND_POSES.relax;
    b.push(M4.scale(1.0, 1.0, 1.0));
    palm(b);
    const xs = [0.031, 0.011, -0.01, -0.029];
    const lens = [0.084, 0.09, 0.085, 0.068];
    const rads = [0.0104, 0.011, 0.0104, 0.0092];
    const spreads = [0.13, 0.03, -0.06, -0.16];
    xs.forEach((x, f) => {
      const c = pose.curl[f];
      const L = lens[f], r = rads[f];
      const l1 = L * 0.44, l2 = L * 0.31, l3 = L * 0.25;
      b.push(M4.translate(k * x, -0.096 + Math.abs(x) * 0.12, 0.002), M4.rotZ(k * spreads[f] * (0.4 + pose.spread)), M4.rotX(-(c * 1.45 + 0.06)));
      b.at(0, 0, 0, h => h.ellipsoid(r * 1.2, r * 1.12, r * 1.08, 8, 5, COL.wrap));
      fingerSegment(b, l1, r, r * 0.97, COL.skin);
      b.push(M4.translate(0, -l1, 0), M4.rotX(-c * 1.65));
      fingerSegment(b, l2, r * 0.97, r * 0.92, COL.skin);
      b.push(M4.translate(0, -l2, 0), M4.rotX(-c * 1.05));
      fingerSegment(b, l3, r * 0.92, r * 0.82, COL.skin, 0xe0a882);
      b.pop();
      b.pop();
      b.pop();
    });
    const [ab, tc] = pose.thumb;
    b.push(M4.translate(k * 0.04, -0.028, 0.011), M4.rotY(k * (0.35 + ab * 0.5)), M4.rotZ(k * (0.55 + ab * 0.45)), M4.rotX(-0.3 - ab * 0.4));
    b.at(0, 0, 0, h => h.ellipsoid(0.016, 0.019, 0.015, 8, 5, COL.wrap));
    fingerSegment(b, 0.034, 0.0136, 0.013, COL.wrap);
    b.push(M4.translate(0, -0.034, 0), M4.rotX(-tc * 0.9));
    fingerSegment(b, 0.028, 0.013, 0.0124, COL.skin);
    b.push(M4.translate(0, -0.028, 0), M4.rotX(-tc * 0.8));
    fingerSegment(b, 0.024, 0.0124, 0.011, COL.skin, 0xe0a882);
    b.pop();
    b.pop();
    b.pop();
    b.pop();
    return b;
  }

  function buildThigh(b) {
    const len = D.thigh;
    ringLoft(b, limbRings(len, [[-0.15, 0.078], [0, 0.082, 0.086], [0.4, 0.074, 0.078], [0.8, 0.064, 0.066], [1.0, 0.06, 0.06], [1.08, 0.056, 0.056]]), 14, () => COL.pants, { capTop: true, capBottom: true });
    return b;
  }

  function buildShin(b) {
    const len = D.shin;
    const col = (u, y) => {
      const f = -y / len;
      if (f > 0.5) return f > 0.93 ? COL.sole : COL.sock;
      return f > 0.42 ? COL.pantsDk : COL.pants;
    };
    ringLoft(b, limbRings(len, [[-0.06, 0.06], [0.1, 0.062], [0.3, 0.06], [0.41, 0.058], [0.42, 0.066], [0.49, 0.066], [0.5, 0.042], [0.62, 0.041], [0.8, 0.036], [0.95, 0.034], [1.04, 0.034]]), 14, col, { capTop: true, capBottom: true });
    return b;
  }

  function buildFoot(b) {
    b.at(0, -0.02, 0.055, h => h.ellipsoid(0.048, 0.042, 0.125, 12, 7, COL.shoe));
    b.at(0, -0.058, 0.058, h => h.box(0.1, 0.026, 0.27, COL.sole));
    b.at(0, -0.03, 0.155, h => h.ellipsoid(0.042, 0.03, 0.04, 10, 6, COL.sole));
    b.at(0, 0.012, -0.004, h => h.prism(12, 0.046, 0.046, -0.05, 0.044, 0.044, 0.04, COL.shoe));
    [-0.01, 0.02, 0.05].forEach(z => b.at(0, 0.02 - z * 0.25, 0.06 + z, h => h.box(0.05, 0.004, 0.01, COL.sole)));
    return b;
  }

  function buildHips(b) {
    const rings = [
      { y: -0.2, rx: 0.13, rz: 0.11, cz: -0.006 },
      { y: -0.1, rx: 0.152, rz: 0.118, cz: 0.0 },
      { y: 0.0, rx: 0.15, rz: 0.114, cz: 0.004 },
      { y: 0.06, rx: 0.146, rz: 0.112, cz: 0.006 }
    ];
    ringLoft(b, rings, 20, () => COL.pants, { capBottom: true });
    [-1, 1].forEach(s => b.at(s * 0.085, -0.08, 0.0, h => h.ellipsoid(0.09, 0.1, 0.1, 12, 8, COL.pants)));
    const belt = [{ y: -0.005, rx: 0.154, rz: 0.118, cz: 0.006 }, { y: 0.035, rx: 0.152, rz: 0.116, cz: 0.006 }];
    ringLoft(b, belt, 24, () => COL.belt, {});
    b.at(0, 0.015, 0.122, h => h.box(0.05, 0.036, 0.01, COL.buckle));
    b.at(0, 0.015, 0.127, h => h.box(0.032, 0.02, 0.004, COL.belt));
    [-1, 1].forEach(s => b.at(s * 0.1, 0.015, 0.095, h => { h.push(M4.rotY(s * 0.7)); h.box(0.012, 0.05, 0.008, COL.pantsDk); h.pop(); }));
    return b;
  }

  function buildEyeMesh(b) {
    const seg = 18, rings = 12;
    for (let j = 0; j < rings; j++) {
      for (let i = 0; i < seg; i++) {
        const pt = (ii, jj) => {
          const th = (jj / rings) * PI, ph = (ii / seg) * PI * 2;
          return [S(th) * S(ph), C(th), S(th) * C(ph)];
        };
        const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
        const uv = q.map(n => (n[2] > 0 ? [0.5 + n[0] * 0.5, 0.5 + n[1] * 0.5] : [0.02, 0.02]));
        b.quad(q[0], q[1], q[2], q[3], 0xffffff, uv, q);
      }
    }
    return b;
  }

  function buildLid(b, upper) {
    const R = 1.06;
    const nu = 14, nv = 6;
    const p0 = upper ? 0 : -1.45, p1 = upper ? 1.45 : 0;
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const pt = (ii, jj) => {
          const y = lerp(-1.35, 1.35, ii / nu), p = lerp(p0, p1, jj / nv);
          const n = [S(y) * C(p), S(p), C(y) * C(p)];
          return { p: V3.mul(n, R), n };
        };
        const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
        const edgeRow = upper ? j === 0 : j === nv - 1;
        const cols = q.map((v, n) => {
          const atEdge = edgeRow && (upper ? n < 2 : n >= 2);
          return rgb(atEdge ? 0x2a1610 : 0xc08462);
        });
        b.quad(q[0].p, q[1].p, q[2].p, q[3].p, cols, null, q.map(v => v.n));
      }
    }
    return b;
  }

  function buildTeeth(b, lower) {
    const n = 12;
    const R = 0.036, h = 0.012;
    for (let i = 0; i < n; i++) {
      const a0 = lerp(-1.0, 1.0, i / n), a1 = lerp(-1.0, 1.0, (i + 1) / n);
      const gap = 0.01;
      const shade = 0.92 + 0.08 * ((i % 2) ? 1 : 0);
      const col = [0.94 * shade, 0.92 * shade, 0.86 * shade, 0.08];
      const y0 = lower ? -h : 0, y1 = lower ? 0 : h;
      const p = (a, y, rr) => [S(a) * rr, y, C(a) * rr];
      const b0 = a0 + gap * 0.5, b1 = a1 - gap * 0.5;
      b.quad(p(b0, y0, R), p(b1, y0, R), p(b1, y1, R), p(b0, y1, R), col, null, [[S(b0), 0, C(b0)], [S(b1), 0, C(b1)], [S(b1), 0, C(b1)], [S(b0), 0, C(b0)]]);
      b.quad(p(b1, y0, R), p(a1 + gap * 0.5, y0, R), p(a1 + gap * 0.5, y1, R), p(b1, y1, R), [0.4, 0.34, 0.3, 0.05]);
      const ye = lower ? y1 : y0;
      b.quad(p(b0, ye, R), p(b1, ye, R), p(b1, ye, R - 0.007), p(b0, ye, R - 0.007), col);
    }
    return b;
  }

  function buildCavity(b, lower) {
    const seg = 16, rings = 8;
    for (let j = 0; j < rings; j++) {
      for (let i = 0; i < seg; i++) {
        const pt = (ii, jj) => {
          const y = (ii / seg) * PI * 2;
          const p = lower ? lerp(-PI / 2, 0.5, jj / rings) : lerp(-0.6, PI / 2, jj / rings);
          return [S(y) * C(p) * 0.058, S(p) * 0.036, C(y) * C(p) * 0.032];
        };
        const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
        const shade = q.map(v => rgb([0.17 + v[2] * 1.5, 0.05 + v[2] * 0.4, 0.045 + v[2] * 0.3], 0.35));
        b.quad(q[0], q[1], q[2], q[3], shade, null, q.map(v => V3.norm(V3.mul(v, -1))));
      }
    }
    return b;
  }

  function buildEar(b, side) {
    const k = side === 'L' ? 1 : -1;
    b.push(M4.rotY(k * 0.42), M4.rotZ(-k * 0.08));
    b.ellipsoid(0.011, 0.033, 0.022, 12, 9, COL.skin);
    b.at(k * 0.004, 0.003, 0.004, h => h.ellipsoid(0.007, 0.022, 0.013, 10, 7, 0xb06c4c));
    b.at(k * 0.002, -0.022, 0.002, h => h.ellipsoid(0.008, 0.01, 0.01, 8, 5, COL.skin));
    b.pop();
    return b;
  }

  const CAP = { c: [0, 0.03, -0.004], rx: 0.09, ry: 0.075, rz: 0.104, front: 0.07, back: -0.004 };

  function capRim(a) {
    const f = (1 + C(a)) / 2;
    return lerp(CAP.back, CAP.front, Math.pow(f, 1.3)) - CAP.c[1];
  }

  function buildCap(b) {
    const n = 36, rows = 10;
    const pt = (i, j) => {
      const a = (i / n) * PI * 2;
      const e0 = Math.asin(clamp(capRim(a) / CAP.ry, -1, 1));
      const e = lerp(e0, PI / 2, j / rows);
      const n0 = [S(a) * C(e), S(e), C(a) * C(e)];
      const flat = 1 - 0.03 * Math.pow(S(e), 8);
      return { p: [n0[0] * CAP.rx, n0[1] * CAP.ry * flat, n0[2] * CAP.rz], n: V3.norm([n0[0] / CAP.rx, n0[1] / CAP.ry, n0[2] / CAP.rz]) };
    };
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < n; i++) {
        const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
        b.quad(q[0].p, q[1].p, q[2].p, q[3].p, COL.cap, null, q.map(v => v.n));
      }
    }
    for (let i = 0; i < n; i++) {
      const q0 = pt(i, 0), q1 = pt(i + 1, 0);
      const in0 = V3.mul(q0.p, 0.94), in1 = V3.mul(q1.p, 0.94);
      b.quad(q1.p, q0.p, in0, in1, COL.capDk, null, [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]]);
    }
    b.at(0, CAP.ry * 0.9, 0, h => h.ellipsoid(0.012, 0.007, 0.012, 8, 4, COL.capDk));
    const nb = 18;
    const bill = (u, w) => {
      const a = lerp(-0.82, 0.82, u);
      const r0x = CAP.rx * 0.99, r0z = CAP.rz * 0.99;
      const edge = [S(a) * r0x, capRim(a), C(a) * r0z];
      const out = 0.076 * Math.pow(C(a * 1.1), 0.8) * w;
      const dir = V3.norm([S(a) * 0.55, 0, C(a)]);
      return V3.add(edge, [dir[0] * out, -0.01 * w - 0.008 * w * w - 0.014 * Math.abs(S(a)) * w, dir[2] * out]);
    };
    for (let i = 0; i < nb; i++) {
      for (let j = 0; j < 3; j++) {
        const u0 = i / nb, u1 = (i + 1) / nb, w0 = j / 3, w1 = (j + 1) / 3;
        const a = bill(u0, w0), c = bill(u1, w0), d = bill(u1, w1), e = bill(u0, w1);
        const up = V3.norm(V3.cross(V3.sub(e, a), V3.sub(c, a)));
        const nU = up[1] < 0 ? V3.mul(up, -1) : up;
        b.quad(a, c, d, e, COL.cap, null, [nU, nU, nU, nU]);
        const lo = (p) => V3.add(p, [0, -0.005, 0]);
        b.quad(lo(e), lo(d), lo(c), lo(a), COL.capDk, null, [V3.mul(nU, -1), V3.mul(nU, -1), V3.mul(nU, -1), V3.mul(nU, -1)]);
      }
      const t0 = bill(i / nb, 1), t1 = bill((i + 1) / nb, 1);
      b.quad(t0, t1, V3.add(t1, [0, -0.005, 0]), V3.add(t0, [0, -0.005, 0]), COL.capDk);
    }
    return b;
  }

  const CUP = { x: 0.088, y: -0.004, z: -0.008, R: 0.03, T: 0.02 };

  function buildCup(b, side) {
    const k = side === 'L' ? 1 : -1;
    b.push(M4.translate(k * CUP.x, CUP.y, CUP.z), M4.rotZ(-k * PI / 2));
    b.prism(20, CUP.R, CUP.R, 0, CUP.R * 0.96, CUP.R * 0.96, CUP.T * 0.75, COL.cup, { capTop: false });
    b.prism(20, CUP.R * 0.96, CUP.R * 0.96, CUP.T * 0.75, CUP.R * 0.8, CUP.R * 0.8, CUP.T, COL.cup);
    b.at(0, CUP.T + 0.001, 0, h => h.prism(16, CUP.R * 0.45, CUP.R * 0.45, 0, CUP.R * 0.4, CUP.R * 0.4, 0.003, COL.cupDk));
    b.prism(20, CUP.R * 1.02, CUP.R * 1.02, -0.006, CUP.R * 1.0, CUP.R * 1.0, 0.0, COL.band, { capBottom: true });
    b.pop();
    b.at(k * (CUP.x + 0.006), CUP.y + CUP.R + 0.012, CUP.z, h => h.box(0.012, 0.036, 0.016, COL.band));
    return b;
  }

  function buildBand(b) {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const a = lerp(-PI / 2, PI / 2, i / 20);
      const r = CAP.rx + 0.007;
      pts.push([S(a) * r * 1.02, CAP.c[1] + C(a) * (CAP.ry + 0.006) - 0.004, CUP.z - 0.006 * C(a)]);
    }
    pts[0] = [-(CAP.rx + 0.004), CAP.c[1] - 0.004, CUP.z];
    pts[20] = [CUP.x + 0.006, CUP.y + CUP.R + 0.028, CUP.z];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], c = pts[i + 1];
      const t = V3.norm(V3.sub(c, a));
      const nOut = V3.norm([a[0], a[1] - CAP.c[1], 0]);
      const w = V3.mul(V3.norm(V3.cross(t, nOut)), 0.011);
      const th = V3.mul(nOut, 0.004);
      b.quad(V3.sub(a, w), V3.add(a, w), V3.add(c, w), V3.sub(c, w), COL.band, null, [nOut, nOut, nOut, nOut]);
      b.quad(V3.add(V3.sub(a, w), th), V3.add(V3.add(a, w), th), V3.add(V3.add(c, w), th), V3.add(V3.sub(c, w), th), COL.band, null, [nOut, nOut, nOut, nOut]);
    }
    b.at(-(CAP.rx + 0.006), CAP.c[1] - 0.012, CUP.z, h => h.box(0.012, 0.03, 0.026, COL.band));
    const boom = [[CUP.x + 0.026, CUP.y - 0.006, CUP.z + 0.014], [CUP.x + 0.02, CUP.y - 0.05, CUP.z + 0.05], [0.07, -0.085, 0.09], [0.042, -0.092, 0.11], [0.026, -0.088, 0.116]];
    K.tube(b, boom, [0.0032, 0.003, 0.0028, 0.0028, 0.0028], 6, COL.boom);
    b.at(0.022, -0.088, 0.118, h => h.ellipsoid(0.011, 0.008, 0.011, 10, 6, COL.mic));
    return b;
  }

  function eyeFrames() {
    return EYES;
  }

  function frameM(f, extra) {
    const base = new Float32Array([f.x[0], f.x[1], f.x[2], 0, f.y[0], f.y[1], f.y[2], 0, f.z[0], f.z[1], f.z[2], 0, f.c[0], f.c[1], f.c[2], 1]);
    return extra ? M4.mul(base, extra) : base;
  }

  function build(r, fx, opts) {
    const team = TEAM[(opts && opts.team) || 'red'];
    const T = headTemplate();
    const head = fx.dyn();
    head.update(new Float32Array(T.nv * 12), T.idx);
    const neck = fx.dyn();
    const NECK_SIDES = 20, NECK_RINGS = 8;
    const nIdx = [];
    for (let j = 0; j < NECK_RINGS - 1; j++) {
      for (let i = 0; i < NECK_SIDES; i++) {
        const a = j * (NECK_SIDES + 1) + i, b = a + 1, c = a + NECK_SIDES + 2, d = a + NECK_SIDES + 1;
        nIdx.push(a, b, c, a, c, d);
      }
    }
    neck.update(new Float32Array(NECK_RINGS * (NECK_SIDES + 1) * 12), new Uint16Array(nIdx));
    const mk = (fn) => K.mesh(r, fn);
    return {
      T,
      head,
      headData: new Float32Array(T.nv * 12),
      headPos: new Float32Array(T.nv * 3),
      neck,
      neckData: new Float32Array(NECK_RINGS * (NECK_SIDES + 1) * 12),
      neckDims: [NECK_RINGS, NECK_SIDES],
      faceTex: r.texture(1024, paintFace, { height: 512, clamp: true }),
      eyeTex: r.texture(128, paintEye, { clamp: true }),
      torsoTex: r.texture(512, (ctx, w, h) => paintTorso(ctx, w, h, team), { height: 512, clamp: true }),
      eye: mk(buildEyeMesh),
      lidU: mk(b => buildLid(b, true)),
      lidD: mk(b => buildLid(b, false)),
      eyes: eyeFrames(),
      teethU: mk(b => buildTeeth(b, false)),
      teethL: mk(b => buildTeeth(b, true)),
      cavityU: mk(b => buildCavity(b, false)),
      cavityL: mk(b => buildCavity(b, true)),
      tongue: mk(b => b.ellipsoid(0.026, 0.008, 0.024, 12, 6, COL.tongue)),
      earL: mk(b => buildEar(b, 'L')),
      earR: mk(b => buildEar(b, 'R')),
      ears: [-1, 1].map(s => { const q = rawPt(s * 1.55, 0.1); return [q[0] + s * 0.004, q[1] - 0.004, q[2] - 0.006]; }),
      lip: basePt(0, lipP(0)),
      cap: mk(buildCap),
      cups: mk(b => buildCup(b, 'L')),
      band: mk(buildBand),
      torso: mk(buildTorso),
      collar: mk(b => buildCollar(b, team)),
      strap: mk(buildStrap),
      bag: mk(buildBag),
      tags: mk(buildTags),
      caps: mk(b => buildShoulderCaps(b, team)),
      hips: mk(buildHips),
      upper: mk(b => buildUpper(b, team)),
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

  function updateNeck(P, m) {
    const [NR, NS] = P.neckDims;
    const data = P.neckData;
    const bot = M4.mul(m.chest, M4.translate(0, D.neckY - 0.03, -0.006));
    const top = M4.chain(m.head, HEAD_SCALE, M4.translate(0, -0.085, -0.022));
    const shape = [[0.076, 0.068, 0], [0.071, 0.064, 0.004], [0.067, 0.061, 0.008], [0.064, 0.059, 0.01], [0.063, 0.058, 0.012], [0.063, 0.058, 0.012], [0.064, 0.059, 0.011], [0.066, 0.06, 0.01]];
    const ax = (M, c) => [M[c * 4], M[c * 4 + 1], M[c * 4 + 2]];
    let w = 0;
    for (let j = 0; j < NR; j++) {
      const f = j / (NR - 1);
      const e = f * f * (3 - 2 * f);
      const o = V3.lerp(ax(bot, 3), ax(top, 3), f);
      const X = V3.norm(V3.lerp(ax(bot, 0), ax(top, 0), e));
      const Z0 = V3.lerp(ax(bot, 2), ax(top, 2), e);
      const Y = V3.norm(V3.cross(Z0, X));
      const Z = V3.cross(X, Y);
      const [rx, rz, cz] = shape[j];
      for (let i = 0; i <= NS; i++) {
        const a = (i / NS) * PI * 2 + PI;
        const lx = S(a) * rx, lz = cz + C(a) * rz;
        const p = V3.add(o, V3.add(V3.mul(X, lx), V3.mul(Z, lz)));
        const n = V3.norm(V3.add(V3.mul(X, S(a) / rx), V3.mul(Z, C(a) / rz)));
        const sc = rgb(COL.skin);
        const shade = 0.88 + 0.12 * f;
        data.set([p[0], p[1], p[2], n[0], n[1], n[2], sc[0] * shade, sc[1] * shade, sc[2] * shade, 0, 0, 0], w);
        w += 12;
      }
    }
    P.neck.update(data);
  }

  function draw(fx, P, st) {
    const m = st.m;
    const F = st.face || {};
    const o = st.opts || {};
    const pre = o.pre;
    const W = (M) => (pre ? M4.mul(pre, M) : M);
    const tint = o.tint ? { tint: o.tint } : {};
    const cloth = Object.assign({}, CLOTH_MAT, tint);
    const skin = Object.assign({}, SKIN_MAT, tint);
    if (!o.noBody) {
      fx.draw(P.torso, W(m.chest), Object.assign({ texture: P.torsoTex }, cloth));
      fx.draw(P.collar, W(m.chest), cloth);
      fx.draw(P.strap, W(m.chest), cloth);
      if (!o.noBag) fx.draw(P.bag, W(m.chest), cloth);
      fx.draw(P.tags, W(m.chest), Object.assign({}, TAG_MAT, tint));
      fx.draw(P.hips, W(m.pelvis), cloth);
      ['L', 'R'].forEach(s => {
        fx.draw(P.upper, W(m['upper' + s]), cloth);
        fx.draw(P.fore, W(m['fore' + s]), skin);
        const hand = st.hands && st.hands[s];
        const HM = hand && hand.M ? hand.M : m['hand' + s];
        fx.draw(handMesh(P, s, (hand && hand.pose) || 'relax'), W(HM), skin);
        if (!o.noLegs) {
          fx.draw(P.thigh, W(m['thigh' + s]), cloth);
          fx.draw(P.shin, W(m['shin' + s]), cloth);
          fx.draw(P.foot, W(m['foot' + s]), Object.assign({}, cloth, { spec: [0.2, 12] }));
        }
      });
    }
    updateNeck(P, m);
    fx.draw(P.neck, pre || null, skin);
    deformHead(P.T, F, { pos: P.headPos, data: P.headData });
    P.head.update(P.headData);
    const H = M4.mul(W(m.head), HEAD_SCALE);
    fx.draw(P.head, H, Object.assign({ texture: P.faceTex, backDark: true }, skin));
    const jaw = clamp(F.jaw || 0, 0, 1.2) * 0.32;
    const JM = M4.chain(H, M4.translate(HINGE[0], HINGE[1], HINGE[2]), M4.rotX(jaw), M4.translate(-HINGE[0], -HINGE[1], -HINGE[2]));
    const lip = P.lip;
    const smile = Math.max(F.smileL || 0, F.smileR || 0);
    const wide = clamp((F.wide || 0) + smile * 0.4, 0, 1.2);
    const dark = { rim: 0, spec: [0, 1] };
    fx.draw(P.cavityU, M4.chain(H, M4.translate(0, lip[1] - 0.007, lip[2] - 0.044)), dark);
    fx.draw(P.cavityL, M4.chain(JM, M4.translate(0, lip[1] - 0.014, lip[2] - 0.044)), dark);
    fx.draw(P.tongue, M4.chain(JM, M4.translate(0, lip[1] - 0.021, lip[2] - 0.038)), { rim: 0.1, spec: [0.3, 12] });
    fx.draw(P.teethU, M4.chain(H, M4.translate(0, lip[1] - 0.004 + wide * 0.002, lip[2] - 0.041)), { spec: [0.4, 20], rim: 0.1 });
    fx.draw(P.teethL, M4.chain(JM, M4.translate(0, lip[1] + 0.0025 - wide * 0.002, lip[2] - 0.043)), { spec: [0.4, 20], rim: 0.1 });
    P.ears.forEach((q, i) => fx.draw(i ? P.earL : P.earR, M4.chain(H, M4.translate(q[0], q[1], q[2])), skin));
    const look = F.look || [0, 0];
    const blink = clamp(F.blink || 0, 0, 1);
    const lidU = F.lidU === undefined ? 0.42 : F.lidU;
    const lidL = F.lidL === undefined ? 0.35 : F.lidL;
    const upEdge = lerp(lerp(-0.05, 0.6, lidU) - (F.browDown || 0) * 0.12, -0.12, blink);
    const loEdge = lerp(lerp(-0.6, -0.12, lidL) + smile * 0.12, -0.14, blink * 0.6);
    P.eyes.forEach(f => {
      const EM = M4.mul(H, frameM(f));
      const ball = M4.chain(EM, M4.rotY(clamp(look[0], -0.5, 0.5)), M4.rotX(-clamp(look[1], -0.4, 0.4)), M4.scale(EYE_R, EYE_R, EYE_R));
      fx.draw(P.eye, ball, Object.assign({ texture: P.eyeTex }, EYE_MAT, tint));
      const lidS = M4.scale(EYE_R, EYE_R, EYE_R);
      const lidMat = Object.assign({ spec: [0.08, 8], rim: 0.15 }, tint);
      fx.draw(P.lidU, M4.chain(EM, M4.rotX(-upEdge), lidS), lidMat);
      fx.draw(P.lidD, M4.chain(EM, M4.rotX(-Math.min(loEdge, upEdge - 0.02)), lidS), lidMat);
    });
    if (!o.noCap) {
      fx.draw(P.cap, M4.chain(H, M4.translate(CAP.c[0], CAP.c[1], CAP.c[2])), Object.assign({}, CAP_MAT, tint));
      fx.draw(P.cups, H, Object.assign({}, CUP_MAT, tint));
      fx.draw(P.band, H, Object.assign({}, CUP_MAT, tint));
    }
  }

  function headPoint(m, local) {
    return M4.point(M4.mul(m.head, HEAD_SCALE), local);
  }

  window.MeetScout = { D, COL, HAND_POSES, CHANNELS, build, solve, draw, handBasis, handMesh, headPoint, lipP, basePt, rawPt, torsoSurf, EYE_R, CAP };
})();
