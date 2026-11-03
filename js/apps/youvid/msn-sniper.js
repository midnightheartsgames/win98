(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Rig = window.YouVidRig;

  const D = { chestY: 0.13, neckY: 0.46, headY: 0.135, shX: 0.172, shY: 0.36, upper: 0.31, fore: 0.29, hipX: 0.095, hipY: -0.05, thigh: 0.48, shin: 0.47 };
  const HEAD_SCALE = M4.scale(1.1, 1.1, 1.1);

  const COL = {
    skin: 0xbf8462, skinDk: 0xa46c4c, shirt: 0xb8393b, shirtDk: 0x8c2a2c, under: 0xe6e0d4, vest: 0x4e4842, vestDk: 0x37322e, vestHi: 0x726a60,
    strap: 0xc29a74, strapDk: 0x8e6c4e, brass: 0xc9a14e, tip: 0xc8703c, pants: 0x56564b, pantsDk: 0x45453b, belt: 0x4a3426, buckle: 0x9a9890,
    boot: 0x5e4330, bootDk: 0x3e2c20, sole: 0x2a2420, glove: 0x3b302a, gloveDk: 0x2a221e, watch: 0x1e1c1c, dial: 0xd8d8d0,
    hat: 0x7b6a58, hatDk: 0x56493d, band: 0x37302a, frame: 0x151313, hair: 0x2e231c, tongue: 0x9a4a46
  };

  const SKIN_MAT = { spec: [0.1, 8], rim: 1.1 };
  const CLOTH_MAT = { spec: [0.05, 5], rim: 0.9 };
  const VEST_MAT = { spec: [0.16, 10], rim: 0.8 };
  const EYE_MAT = { spec: [0.9, 60], rim: 0.2 };
  const HAT_MAT = { spec: [0.06, 6], rim: 0.85 };
  const METAL_MAT = { spec: [0.9, 30], rim: 0.5 };
  const FRAME_MAT = { spec: [0.6, 30], rim: 0.3 };

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

  const YT = table([[-1.571, -0.124], [-1.25, -0.122], [-1.0, -0.117], [-0.8, -0.108], [-0.62, -0.097], [-0.48, -0.087], [-0.3, -0.068], [-0.2, -0.054], [-0.09, -0.034],
    [0.05, -0.007], [0.2, 0.018], [0.33, 0.037], [0.5, 0.058], [0.7, 0.076], [0.95, 0.089], [1.2, 0.097], [1.571, 0.1]]);
  const HW = table([[-1.571, 0.034], [-1.25, 0.049], [-1.0, 0.059], [-0.8, 0.066], [-0.62, 0.071], [-0.48, 0.074], [-0.3, 0.077], [-0.2, 0.078], [-0.09, 0.08],
    [0.05, 0.082], [0.2, 0.082], [0.33, 0.081], [0.5, 0.078], [0.7, 0.07], [0.95, 0.057], [1.2, 0.039], [1.571, 0.0]]);
  const DF = table([[-1.571, 0.032], [-1.25, 0.054], [-1.0, 0.073], [-0.8, 0.084], [-0.62, 0.089], [-0.48, 0.088], [-0.33, 0.089], [-0.2, 0.089], [-0.08, 0.086],
    [0.05, 0.084], [0.2, 0.08], [0.33, 0.085], [0.5, 0.083], [0.7, 0.074], [0.95, 0.058], [1.2, 0.04], [1.571, 0.0]]);
  const DB = table([[-1.571, 0.02], [-1.1, 0.05], [-0.6, 0.076], [-0.2, 0.093], [0.2, 0.101], [0.6, 0.096], [0.95, 0.07], [1.25, 0.043], [1.571, 0.0]]);

  const NU = 72, NL = 16, NUP = 30, MW = 0.47;
  const HINGE = [0, -0.03, -0.014];
  const EYE_R = 0.0118;
  const CHANNELS = ['browDown', 'browUp', 'browInUp', 'smileL', 'smileR', 'frown', 'wide', 'round', 'sneer'];

  const g2 = (x, s) => Math.exp(-(x / s) * (x / s));
  const smooth = (e0, e1, x) => { const k = clamp((x - e0) / (e1 - e0), 0, 1); return k * k * (3 - 2 * k); };

  function lipP(a) {
    const q = a / MW;
    return -0.37 - 0.004 * Math.min(q * q, 1.6);
  }

  function yawAt(i) {
    const s = 2 * i / NU - 1;
    return PI * Math.sign(s) * Math.pow(Math.abs(s), 1.35);
  }

  function squircle(p) {
    return 0.12 * smooth(-1.1, -0.7, p) * (1 - smooth(0.4, 0.8, p));
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

  function burnside(A, p) {
    const inA = smooth(1.18, 1.24, A) * (1 - smooth(1.44, 1.52, A));
    const top = 1 - smooth(0.36, 0.44, p);
    const bottom = smooth(-0.2, -0.14, p);
    return inA * top * bottom;
  }

  function relief(a, p) {
    const A = Math.abs(a);
    const dl = p - lipP(a);
    let h = 0;
    const down = clamp((0.32 - p) / 0.44, 0, 1);
    h += (0.008 + 0.02 * down) * g2(a, 0.11 + 0.05 * down) * smooth(-0.2, -0.14, p) * (1 - smooth(0.3, 0.38, p));
    h += 0.0025 * g2(a, 0.07) * g2(p - 0.08, 0.06);
    h += 0.013 * g2(a, 0.15) * g2(p + 0.1, 0.06);
    h += 0.0045 * g2(A - 0.2, 0.07) * g2(p + 0.135, 0.04);
    h -= 0.0035 * g2(a, 0.035) * g2(p + 0.25, 0.055);
    h += 0.011 * g2(A - 0.38, 0.24) * g2(p - 0.34, 0.055);
    h += 0.003 * g2(a, 0.09) * g2(p - 0.32, 0.05);
    h -= 0.005 * g2(A - 0.44, 0.13) * g2(p - 0.2, 0.07);
    h += 0.013 * g2(A - 0.72, 0.18) * g2(p - 0.06, 0.09);
    h -= 0.002 * g2(A - 0.68, 0.17) * g2(p + 0.24, 0.1);
    h -= 0.0025 * g2(segDist(A, p, 0.25, -0.14, MW, lipP(MW) - 0.01), 0.025);
    h += 0.003 * g2(dl - 0.022, 0.022) * (1 - smooth(MW, MW + 0.08, A));
    h += 0.0045 * g2(dl + 0.03, 0.026) * g2(a, 0.3);
    h -= 0.004 * g2(dl + 0.085, 0.03) * g2(a, 0.3);
    h += 0.008 * g2(a, 0.42) * g2(p + 0.72, 0.14);
    h += 0.005 * g2(A - 0.95, 0.24) * g2(p + 0.6, 0.15);
    h -= 0.004 * g2(A - 1.0, 0.2) * g2(p - 0.35, 0.15);
    h += 0.0035 * burnside(A, p);
    h += 0.005 * smooth(0.56, 0.78, p + (A > 1.6 ? 0.25 : 0));
    return h;
  }

  function eyeFrame(s) {
    const a = s * 0.42, p = 0.19;
    const q = rawPt(a, p);
    const n = approxNormal(a, p);
    const c = V3.sub(q, V3.mul(n, EYE_R * 0.95));
    const z = V3.norm([s * 0.16, 0.02, 1]);
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
      const e = Math.sqrt((psi / 1.12) * (psi / 1.12) + (phi / 0.62) * (phi / 0.62));
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
    const gB = g2(A - 0.38, 0.22) * g2(p - 0.34, 0.1) * smooth(0.22, 0.3, p);
    const gG = g2(a, 0.07) * g2(p - 0.3, 0.06);
    out.browDown = [-sg * 0.003 * gB, -0.0075 * gB, 0.0025 * gB - 0.0025 * gG];
    const gU = g2(A - 0.38, 0.28) * g2(p - 0.4, 0.13);
    out.browUp = [0, 0.009 * gU, -0.001 * gU];
    const gI = g2(A - 0.16, 0.12) * g2(p - 0.35, 0.08);
    out.browInUp = [0, 0.007 * gI, 0];
    const gC = g2(A - MW, 0.12) * g2(dl, 0.08);
    const gK = g2(A - 0.5, 0.15) * g2(p + 0.14, 0.1);
    const gL = g2(A - 0.35, 0.14) * g2(p - 0.12, 0.05);
    const smile = [sg * (0.008 * gC + 0.003 * gK), 0.013 * gC + 0.006 * gK + 0.003 * gL, -0.005 * gC + 0.004 * gK + 0.001 * gL];
    const none = [0, 0, 0];
    out.smileL = a > 0 ? smile : none;
    out.smileR = a < 0 ? smile : none;
    if (A < 0.02) {
      const half = V3.mul(smile, 0.5);
      out.smileL = half;
      out.smileR = half;
    }
    const gF = g2(A - MW, 0.16) * g2(dl, 0.12);
    out.frown = [0, -0.009 * gF, 0.001 * gF];
    const gUp = g2(dl - 0.025, 0.035) * inMouth;
    const gLo = g2(dl + 0.03, 0.04) * inMouth;
    out.wide = [sg * 0.007 * gC, 0.006 * gUp - 0.007 * gLo, 0.001 * gLo - 0.003 * gC];
    const gR = g2(dl, 0.08) * (1 - smooth(MW, MW + 0.12, A));
    const x0 = rawPt(a, p)[0];
    out.round = [-x0 * 0.33 * gR, 0, 0.008 * gR];
    const gS = g2(A - 0.14, 0.08) * g2(p + 0.12, 0.07);
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
    const jaw = clamp(F.jaw || 0, 0, 1.2) * 0.3;
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
    const poly = (pts, fill) => {
      ctx.beginPath();
      pts.forEach(([a, p], i) => (i ? ctx.lineTo(...P(a, p)) : ctx.moveTo(...P(a, p))));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    };
    ctx.fillStyle = '#bf8462';
    ctx.fillRect(0, 0, W, H);
    const vg = ctx.createLinearGradient(0, 0, 0, H);
    vg.addColorStop(0, 'rgba(236,176,128,0.25)');
    vg.addColorStop(0.45, 'rgba(236,176,128,0)');
    vg.addColorStop(0.7, 'rgba(120,64,44,0)');
    vg.addColorStop(1, 'rgba(120,64,44,0.25)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    [-1, 1].forEach(s => {
      blob(s * 0.44, 0.19, 0.16, 0.08, '96,52,36', 0.42);
      blob(s * 0.44, 0.12, 0.14, 0.04, '110,60,44', 0.3);
      blob(s * 0.64, -0.24, 0.2, 0.12, '120,66,46', 0.28);
      blob(s * 0.62, 0.05, 0.16, 0.08, '214,120,90', 0.18);
      blob(s * 1.42, 0.02, 0.12, 0.14, '182,96,72', 0.3);
    });
    blob(0, -0.08, 0.11, 0.07, '200,96,74', 0.32);
    blob(0, 0.06, 0.06, 0.12, '200,110,84', 0.15);
    blob(0, 0.55, 0.5, 0.18, '236,180,136', 0.12);
    const g = rand(57);
    const stubble = (a0, a1, p0, p1, n, alpha) => {
      for (let i = 0; i < n; i++) {
        const a = lerp(a0, a1, g()), p = lerp(p0, p1, g());
        const [x, y] = P(a, p);
        ctx.fillStyle = `rgba(52,44,48,${alpha * (0.4 + g() * 0.6)})`;
        ctx.fillRect(x, y, 1.6, 1.6);
      }
    };
    blob(0, -0.72, 0.42, 0.2, '70,60,62', 0.3);
    [-1, 1].forEach(s => blob(s * 0.75, -0.55, 0.3, 0.2, '70,60,62', 0.22));
    stubble(-0.5, 0.5, -1.15, -0.5, 2600, 0.5);
    stubble(-1.05, -0.45, -0.95, -0.3, 900, 0.35);
    stubble(0.45, 1.05, -0.95, -0.3, 900, 0.35);
    stubble(-0.32, 0.32, -0.34, -0.26, 500, 0.25);
    const side = (s) => {
      const A = (a) => s * a;
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const p = lerp(0.44, -0.14, i / 12);
        pts.push([A(1.2 + Math.max(0, -p) * 0.2), p]);
      }
      pts.push([A(1.25), -0.2]);
      pts.push([A(1.34), -0.19]);
      pts.push([A(1.42), -0.1]);
      for (let i = 10; i >= 0; i--) {
        const p = lerp(0.44, -0.04, i / 10);
        pts.push([A(1.5 - Math.max(0, -p) * 0.5), p]);
      }
      ctx.save();
      ctx.filter = 'blur(3px)';
      poly(pts, 'rgba(44,32,24,0.55)');
      ctx.restore();
      poly(pts, 'rgba(44,32,24,0.95)');
      ctx.save();
      ctx.clip();
      for (let i = 0; i < 1400; i++) {
        const [x, y] = P(A(1.0 + g() * 0.55), -0.32 + g() * 0.76);
        ctx.fillStyle = `rgba(${g() < 0.5 ? '20,14,10' : '74,56,42'},${0.15 + g() * 0.3})`;
        ctx.fillRect(x, y, 1, 3);
      }
      ctx.restore();
    };
    side(1);
    side(-1);
    const hair = ctx.createLinearGradient(0, 0, 0, P(0, 0.4)[1]);
    hair.addColorStop(0, '#2a1f19');
    hair.addColorStop(1, '#3a2c22');
    ctx.fillStyle = hair;
    ctx.beginPath();
    ctx.moveTo(...P(-PI, 1.6));
    for (let i = 0; i <= 60; i++) {
      const a = lerp(-PI, PI, i / 60);
      const A = Math.abs(a);
      let p;
      if (A < 0.95) p = 0.6 + 0.05 * Math.pow(A / 0.95, 2) - 0.03 * g2(a, 0.12);
      else if (A < 1.5) p = lerp(0.62, 0.42, (A - 0.95) / 0.55);
      else if (A < 1.75) p = 0.42 - (A - 1.5) * 1.2;
      else p = lerp(0.12, -0.22, smooth(1.75, 2.6, A));
      ctx.lineTo(...P(a, p));
    }
    ctx.lineTo(...P(PI, 1.6));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,70,56,0.35)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 70; i++) {
      const a0 = lerp(-PI, PI, g());
      ctx.beginPath();
      ctx.moveTo(...P(a0, 0.6));
      ctx.quadraticCurveTo(...P(a0 * 1.05, 1.0), ...P(a0 * 1.15 + (a0 > 0 ? 0.3 : -0.3), 1.5));
      ctx.stroke();
    }
    [-1, 1].forEach(s => {
      blob(s * 0.62, 0.62, 0.3, 0.05, '30,22,16', 0.25);
    });
    [-1, 1].forEach(s => {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const k = i / 12;
        pts.push([s * lerp(0.13, 0.66, k), 0.33 + 0.022 * S(k * PI * 0.9) - 0.035 * k]);
      }
      line(pts, 9, 'rgba(60,40,28,0.4)');
      line(pts, 5.5, 'rgba(36,26,20,0.95)');
      blob(s * 0.09, -0.14, 0.03, 0.012, '84,40,28', 0.5);
      ctx.strokeStyle = 'rgba(110,56,40,0.32)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(...P(s * 0.25, -0.13));
      ctx.quadraticCurveTo(...P(s * 0.4, -0.22), ...P(s * (MW + 0.04), lipP(MW) - 0.03));
      ctx.stroke();
      blob(s * 0.45, 0.115, 0.14, 0.025, '110,62,46', 0.35);
      line([[s * 0.7, 0.18], [s * 0.78, 0.13], [s * 0.82, 0.07]], 1.6, 'rgba(110,60,44,0.35)');
      line([[s * 0.06, 0.3], [s * 0.075, 0.39]], 1.8, 'rgba(110,58,42,0.45)');
    });
    [0.47, 0.52].forEach((p, i) => line([[-0.42 + i * 0.05, p], [-0.15, p + 0.01], [0.15, p + 0.01], [0.42 - i * 0.05, p]], 1.5, 'rgba(120,64,46,0.28)'));
    line([[-0.012, -0.7], [0, -0.66], [0.012, -0.7]], 2, 'rgba(100,54,40,0.35)');
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
      ctx.lineTo(...P(a, lipP(a) - 0.005 - 0.026 * k));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(162,92,74,0.5)';
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
      ctx.lineTo(...P(a, lipP(a) + 0.005 + 0.014 * k));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(148,82,66,0.42)';
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(52,22,16,0.95)';
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
    ctx.fillStyle = '#e6e0d6';
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = W * 0.34;
    const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
    g.addColorStop(0, '#cbd8e2');
    g.addColorStop(0.6, '#8ea4b6');
    g.addColorStop(0.92, '#4c6276');
    g.addColorStop(1, '#2c3a48');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0d0d10';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.34, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(cx - R * 0.3, cy - R * 0.32, R * 0.13, 0, PI * 2);
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
        if (o.skip && o.skip(i / sides, j, (i + 1) / sides, r0.y, r1.y)) continue;
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
    [-0.16, 0.128, 0.1, 0.0], [-0.06, 0.128, 0.1, 0.004], [0.04, 0.133, 0.103, 0.01], [0.14, 0.143, 0.107, 0.012], [0.24, 0.156, 0.107, 0.01],
    [0.31, 0.166, 0.103, 0.004], [0.355, 0.164, 0.097, -0.004], [0.39, 0.145, 0.089, -0.008], [0.42, 0.112, 0.079, -0.008], [0.445, 0.082, 0.069, -0.004], [0.465, 0.062, 0.059, 0.0]
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

  const VEST_LIFT = 0.011;

  function gapHalf(y) {
    return lerp(0.036, 0.075, smooth(0.12, 0.43, y));
  }

  function paintTorso(ctx, W, H) {
    const y0 = TORSO[0].y, y1 = TORSO[TORSO.length - 1].y;
    const Y = (y) => (1 - (y - y0) / (y1 - y0)) * H;
    const U = (u) => u * W;
    ctx.fillStyle = '#b8393b';
    ctx.fillRect(0, 0, W, H);
    const fold = ctx.createLinearGradient(0, 0, W, 0);
    fold.addColorStop(0, 'rgba(70,12,10,0.14)');
    fold.addColorStop(0.5, 'rgba(255,210,190,0.05)');
    fold.addColorStop(1, 'rgba(70,12,10,0.14)');
    ctx.fillStyle = fold;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e6e0d4';
    ctx.beginPath();
    ctx.moveTo(U(0.5 - 0.055), Y(0.465));
    ctx.lineTo(U(0.5 + 0.055), Y(0.465));
    ctx.lineTo(U(0.5), Y(0.33));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,14,14,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(U(0.5 - 0.06), Y(0.465));
    ctx.lineTo(U(0.5 - 0.005), Y(0.3));
    ctx.lineTo(U(0.5 - 0.005), Y(-0.16));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(U(0.5 + 0.06), Y(0.465));
    ctx.lineTo(U(0.5 + 0.004), Y(0.31));
    ctx.stroke();
    ctx.fillStyle = 'rgba(220,210,200,0.8)';
    [0.22, 0.1, -0.02].forEach(y => {
      ctx.beginPath();
      ctx.arc(U(0.5 - 0.012), Y(y), 3, 0, PI * 2);
      ctx.fill();
    });
    const g = rand(9);
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = `rgba(${g() < 0.5 ? '0,0,0' : '255,255,255'},${g() * 0.045})`;
      ctx.fillRect(g() * W, g() * H, 2, 2);
    }
  }

  function paintVest(ctx, W, H) {
    const y0 = -0.14, y1 = 0.44;
    const Y = (y) => (1 - (y - y0) / (y1 - y0)) * H;
    const U = (u) => u * W;
    ctx.fillStyle = '#4e4842';
    ctx.fillRect(0, 0, W, H);
    const g = rand(23);
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = `rgba(${g() < 0.5 ? '20,16,14' : '120,110,100'},${g() * 0.08})`;
      ctx.fillRect(g() * W, g() * H, 2, 2);
    }
    const fold = ctx.createLinearGradient(0, 0, W, 0);
    fold.addColorStop(0, 'rgba(10,8,6,0.2)');
    fold.addColorStop(0.3, 'rgba(10,8,6,0)');
    fold.addColorStop(0.7, 'rgba(10,8,6,0)');
    fold.addColorStop(1, 'rgba(10,8,6,0.2)');
    ctx.fillStyle = fold;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#726a60';
    const edge = (side) => {
      ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const y = lerp(y0, y1, i / 20);
        const x = U(0.5 + side * gapHalf(y));
        if (i === 0) ctx.moveTo(x, Y(y)); else ctx.lineTo(x, Y(y));
      }
      for (let i = 20; i >= 0; i--) {
        const y = lerp(y0, y1, i / 20);
        ctx.lineTo(U(0.5 + side * (gapHalf(y) + 0.012)), Y(y));
      }
      ctx.closePath();
      ctx.fill();
    };
    edge(-1);
    edge(1);
    ctx.fillRect(0, Y(-0.12), W, Y(-0.14) - Y(-0.12));
    ctx.strokeStyle = 'rgba(30,26,22,0.8)';
    ctx.lineWidth = 2;
    [[0.5 - 0.17, 0.5 - 0.08], [0.5 + 0.08, 0.5 + 0.17]].forEach(([ua, ub]) => {
      ctx.strokeRect(U(ua), Y(0.04), U(ub) - U(ua), Y(-0.1) - Y(0.04));
      ctx.fillStyle = '#433d38';
      ctx.fillRect(U(ua), Y(0.04), U(ub) - U(ua), (Y(-0.1) - Y(0.04)) * 0.38);
      ctx.strokeRect(U(ua), Y(0.04), U(ub) - U(ua), (Y(-0.1) - Y(0.04)) * 0.38);
    });
    ctx.strokeStyle = 'rgba(140,130,118,0.4)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1.5;
    [0.18, 0.82].forEach(u => {
      ctx.beginPath();
      ctx.moveTo(U(u), Y(y1));
      ctx.lineTo(U(u + (u < 0.5 ? 0.04 : -0.04)), Y(y0));
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }

  function buildTorso(b) {
    ringLoft(b, TORSO, 30, null, {});
    return b;
  }

  function vestRings() {
    return [-0.14, -0.08, 0.0, 0.08, 0.16, 0.24, 0.3, 0.345, 0.38, 0.41, 0.44].map(y => {
      const R = torsoRing(y);
      const l = VEST_LIFT * (y > 0.4 ? 1.4 : 1);
      return { y, rx: R.rx + l, rz: R.rz + l, cz: R.cz };
    });
  }

  function buildVest(b) {
    const skip = (u0, j, u1, ya, yb) => Math.abs((u0 + u1) / 2 - 0.5) < gapHalf((ya + yb) / 2);
    const rings = vestRings();
    ringLoft(b, rings, 40, null, { skip });
    const top = rings[rings.length - 1];
    const n = 40;
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n;
      if (Math.abs((u0 + u1) / 2 - 0.5) < gapHalf(0.44)) continue;
      const a0 = u0 * PI * 2 + PI, a1 = u1 * PI * 2 + PI;
      const p = (a, s) => [S(a) * top.rx * s, top.y, top.cz + C(a) * top.rz * s];
      b.quad(p(a0, 1), p(a1, 1), p(a1, 0.86), p(a0, 0.86), COL.vestDk, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
    }
    return b;
  }

  function buildVestCollar(b) {
    const rings = [
      { y: 0.42, rx: 0.096, rz: 0.084, cz: -0.008 },
      { y: 0.46, rx: 0.085, rz: 0.077, cz: -0.01 },
      { y: 0.49, rx: 0.084, rz: 0.077, cz: -0.012 },
      { y: 0.51, rx: 0.088, rz: 0.08, cz: -0.014 }
    ];
    const skip = (u0, j, u1) => Math.abs((u0 + u1) / 2 - 0.5) < 0.13;
    ringLoft(b, rings, 30, (u, y) => (y > 0.505 ? COL.vestHi : COL.vest), { skip });
    const inner = rings.map(r => ({ y: r.y, rx: r.rx - 0.006, rz: r.rz - 0.006, cz: r.cz }));
    ringLoft(b, inner, 30, () => COL.vestDk, { skip });
    return b;
  }

  function buildShirtCollar(b) {
    [-1, 1].forEach(s => {
      const root = torsoSurf(s * 0.38, 0.452, 0.004);
      const tip = torsoSurf(s * 0.62, 0.36, 0.016);
      const back = torsoSurf(s * 0.95, 0.47, 0.006);
      const n = torsoNormal(s * 0.5, 0.42);
      b.tri(root, tip, back, COL.shirt, null, [n, n, n]);
      b.tri(root, back, tip, COL.shirtDk, null, [V3.mul(n, -1), V3.mul(n, -1), V3.mul(n, -1)]);
    });
    return b;
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
    const front = [], back = [];
    for (let i = 0; i <= 22; i++) {
      const k = i / 22;
      front.push({ ang: lerp(-0.62, 1.05, k), y: lerp(0.418, -0.11, Math.pow(k, 0.95)) });
      back.push({ ang: lerp(-PI + 0.62, -PI - 1.0, k), y: lerp(0.418, -0.08, Math.pow(k, 0.9)) });
    }
    ribbon(b, front, 0.019, VEST_LIFT + 0.007, COL.strap);
    ribbon(b, back, 0.019, VEST_LIFT + 0.007, COL.strap);
    const top = [];
    for (let i = 0; i <= 8; i++) {
      const k = i / 8;
      const a = lerp(-0.62, -PI + 0.62, k);
      const p = torsoSurf(a, 0.418, VEST_LIFT + 0.007);
      const lift = S(k * PI);
      top.push([p[0] * (1 + lift * 0.16), 0.418 + lift * 0.03, p[2] * (1 - lift * 0.4)]);
    }
    for (let i = 0; i < top.length - 1; i++) {
      const a = top[i], c = top[i + 1];
      const t = V3.norm(V3.sub(c, a));
      const w = V3.mul(V3.norm(V3.cross([0, 1, 0], t)), 0.019);
      b.quad(V3.sub(a, w), V3.add(a, w), V3.add(c, w), V3.sub(c, w), COL.strap, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
    }
    const bk = torsoSurf(0.45, 0.14, VEST_LIFT + 0.01);
    const n = torsoNormal(0.45, 0.14);
    b.push(M4.translate(bk[0], bk[1], bk[2]), M4.rotY(Math.atan2(n[0], n[2])), M4.rotZ(0.92));
    b.box(0.05, 0.03, 0.01, COL.strapDk);
    b.at(0, 0, 0.006, h => h.box(0.026, 0.022, 0.004, COL.buckle));
    b.pop();
    return b;
  }

  function buildBullets(b) {
    const ang = -0.5, y = 0.27;
    const p = torsoSurf(ang, y, VEST_LIFT + 0.004);
    const n = torsoNormal(ang, y);
    b.push(M4.translate(p[0], p[1], p[2]), M4.rotY(Math.atan2(n[0], n[2])), M4.rotX(-0.12));
    b.box(0.072, 0.026, 0.008, COL.vestDk);
    for (let i = 0; i < 4; i++) {
      const x = -0.027 + i * 0.018;
      b.at(x, -0.012, 0.009, h => {
        h.prism(8, 0.0058, 0.0058, 0, 0.0058, 0.0058, 0.034, COL.brass);
        h.at(0, 0.034, 0, q => q.prism(8, 0.0058, 0.0058, 0, 0.0016, 0.0016, 0.016, COL.tip));
      });
    }
    b.pop();
    return b;
  }

  function buildPatch(b, k) {
    const len = D.upper;
    const r = 0.054;
    b.push(M4.translate(k * r, -len * 0.3, 0.0), M4.rotY(k * PI / 2));
    K.discXY(b, 0, 0, 0.002, 0.03, 18, rgb(0xffffff));
    b.pop();
    return b;
  }

  function limbRings(len, keys) {
    return keys.map(([f, r, rz, cz]) => ({ y: -len * f, rx: r, rz: rz || r, cz: cz || 0 })).reverse();
  }

  function buildUpper(b) {
    const len = D.upper;
    const rings = limbRings(len, [[-0.12, 0.042], [0, 0.048, 0.05], [0.15, 0.05, 0.051, 0.004], [0.3, 0.049, 0.05, 0.004], [0.55, 0.047, 0.047, 0.004], [0.7, 0.046, 0.046, 0.004],
      [0.72, 0.052, 0.052, 0.004], [0.84, 0.052, 0.052, 0.004], [0.845, 0.036, 0.037, 0.003], [0.92, 0.035, 0.036, 0.003], [1.0, 0.032, 0.032], [1.08, 0.03, 0.03]]);
    const col = (u, y) => {
      const f = -y / len;
      if (f > 0.843) return COL.skin;
      return f > 0.71 ? COL.shirtDk : COL.shirt;
    };
    ringLoft(b, rings, 16, col, {});
    return b;
  }

  function buildFore(b, side) {
    const len = D.fore;
    const gloved = side === 'L';
    const rings = limbRings(len, [[-0.1, 0.03], [0, 0.033], [0.12, 0.036, 0.034, 0.002], [0.35, 0.034, 0.032, 0.002], [0.62, 0.028, 0.026], [0.82, 0.025, 0.023],
      [0.84, gloved ? 0.029 : 0.025, gloved ? 0.027 : 0.023], [0.92, gloved ? 0.03 : 0.025, gloved ? 0.028 : 0.023], [1.02, gloved ? 0.029 : 0.024, gloved ? 0.027 : 0.022], [1.06, 0.024, 0.022]]);
    const col = (u, y) => {
      const f = -y / len;
      if (!gloved || f < 0.835) return COL.skin;
      return f < 0.9 ? COL.watch : COL.glove;
    };
    ringLoft(b, rings, 14, col, { capTop: true, capBottom: true });
    if (gloved) {
      b.push(M4.translate(0, -len * 0.87, 0.0), M4.rotZ(PI / 2));
      b.prism(16, 0.011, 0.011, -0.031, 0.011, 0.011, -0.037, COL.buckle);
      b.at(0, -0.0372, 0, h => h.prism(16, 0.0085, 0.0085, -0.0006, 0.0085, 0.0085, 0.0004, COL.dial));
      b.pop();
    }
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
    hold: { curl: [0.5, 0.55, 0.6, 0.65], spread: 0.08, thumb: [0.8, 0.3] },
    trigger: { curl: [0.38, 0.85, 0.88, 0.9], spread: 0.05, thumb: [0.7, 0.6] },
    pinch: { curl: [0.45, 0.62, 0.85, 0.9], spread: 0.1, thumb: [0.85, 0.45] },
    flick: { curl: [0.05, 0.2, 0.75, 0.85], spread: 0.25, thumb: [0.55, 0.15] },
    phone: { curl: [0.62, 0.68, 0.72, 0.76], spread: 0.06, thumb: [0.85, 0.45] },
    wheel: { curl: [0.68, 0.72, 0.76, 0.8], spread: 0.08, thumb: [0.55, 0.5] },
    mug: { curl: [0.62, 0.7, 0.78, 0.85], spread: 0.02, thumb: [0.7, 0.4] }
  };

  function palm(b, gloved) {
    const rows = [[0.012, 0.039, 0.024], [-0.02, 0.045, 0.026], [-0.06, 0.048, 0.023], [-0.094, 0.046, 0.019], [-0.106, 0.041, 0.015]];
    const sides = 14;
    const pt = (r, i) => {
      const a = (i / sides) * PI * 2;
      return [S(a) * r[1], r[0], C(a) * r[2]];
    };
    const base = gloved ? COL.glove : COL.skin;
    for (let j = 0; j < rows.length - 1; j++) {
      for (let i = 0; i < sides; i++) {
        const a = pt(rows[j], i), bb = pt(rows[j], i + 1), c = pt(rows[j + 1], i + 1), d = pt(rows[j + 1], i);
        const ns = [a, bb, c, d].map(q => V3.norm([q[0] / 0.045, 0, q[2] / 0.022]));
        b.quad(a, bb, c, d, base, null, ns);
      }
    }
    const top = rows[0], bot = rows[rows.length - 1];
    for (let i = 0; i < sides; i++) {
      b.tri([0, top[0], 0], pt(top, i), pt(top, i + 1), base);
      b.tri([0, bot[0], 0], pt(bot, i + 1), pt(bot, i), base);
    }
    if (gloved) b.at(0, -0.01, 0.0, h => h.prism(14, 0.047, 0.027, -0.008, 0.047, 0.027, 0.004, COL.gloveDk));
  }

  function fingerSegment(b, len, r0, r1, col, tipCol) {
    b.prism(8, r1, r1 * 0.92, -len, r0, r0 * 0.92, 0, col, { capTop: false });
    b.at(0, -len, 0, h => h.ellipsoid(r1 * 1.02, r1 * 1.02, r1 * 0.95, 8, 5, tipCol || col));
  }

  function buildHandMesh(b, side, poseName) {
    const k = side === 'L' ? 1 : -1;
    const gloved = side === 'L';
    const pose = HAND_POSES[poseName] || HAND_POSES.relax;
    palm(b, gloved);
    const xs = [0.03, 0.01, -0.01, -0.028];
    const lens = [0.09, 0.097, 0.091, 0.073];
    const rads = [0.0098, 0.0104, 0.0098, 0.0087];
    const spreads = [0.13, 0.03, -0.06, -0.16];
    const knuckle = gloved ? COL.glove : COL.skin;
    xs.forEach((x, f) => {
      const c = pose.curl[f];
      const L = lens[f], r = rads[f];
      const l1 = L * 0.44, l2 = L * 0.31, l3 = L * 0.25;
      b.push(M4.translate(k * x, -0.098 + Math.abs(x) * 0.12, 0.002), M4.rotZ(k * spreads[f] * (0.4 + pose.spread)), M4.rotX(-(c * 1.45 + 0.06)));
      b.at(0, 0, 0, h => h.ellipsoid(r * 1.2, r * 1.12, r * 1.08, 8, 5, knuckle));
      fingerSegment(b, l1, r * (gloved ? 1.08 : 1), r * (gloved ? 1.04 : 0.97), gloved ? COL.glove : COL.skin);
      b.push(M4.translate(0, -l1, 0), M4.rotX(-c * 1.65));
      fingerSegment(b, l2, r * 0.97, r * 0.92, COL.skin);
      b.push(M4.translate(0, -l2, 0), M4.rotX(-c * 1.05));
      fingerSegment(b, l3, r * 0.92, r * 0.82, COL.skin, 0xd8a07c);
      b.pop();
      b.pop();
      b.pop();
    });
    const [ab, tc] = pose.thumb;
    b.push(M4.translate(k * 0.039, -0.028, 0.011), M4.rotY(k * (0.35 + ab * 0.5)), M4.rotZ(k * (0.55 + ab * 0.45)), M4.rotX(-0.3 - ab * 0.4));
    b.at(0, 0, 0, h => h.ellipsoid(0.016, 0.019, 0.015, 8, 5, knuckle));
    fingerSegment(b, 0.036, 0.0136, 0.013, gloved ? COL.glove : COL.skin);
    b.push(M4.translate(0, -0.036, 0), M4.rotX(-tc * 0.9));
    fingerSegment(b, 0.029, 0.013, 0.0124, COL.skin);
    b.push(M4.translate(0, -0.029, 0), M4.rotX(-tc * 0.8));
    fingerSegment(b, 0.024, 0.0124, 0.011, COL.skin, 0xd8a07c);
    b.pop();
    b.pop();
    b.pop();
    return b;
  }

  function buildThigh(b) {
    const len = D.thigh;
    ringLoft(b, limbRings(len, [[-0.15, 0.076], [0, 0.08, 0.084], [0.4, 0.071, 0.075], [0.8, 0.06, 0.062], [1.0, 0.056, 0.056], [1.08, 0.052, 0.052]]), 14, () => COL.pants, { capTop: true, capBottom: true });
    return b;
  }

  function buildShin(b) {
    const len = D.shin;
    const col = (u, y) => {
      const f = -y / len;
      if (f > 0.66) return f > 0.97 ? COL.bootDk : COL.boot;
      return COL.pants;
    };
    ringLoft(b, limbRings(len, [[-0.06, 0.056], [0.1, 0.058], [0.3, 0.056], [0.5, 0.05], [0.64, 0.048], [0.66, 0.05], [0.8, 0.046], [0.95, 0.045], [1.04, 0.045]]), 14, col, { capTop: true, capBottom: true });
    return b;
  }

  function buildFoot(b) {
    b.at(0, -0.022, 0.058, h => h.ellipsoid(0.046, 0.042, 0.13, 12, 7, COL.boot));
    b.at(0, -0.06, 0.055, h => h.box(0.094, 0.02, 0.27, COL.sole));
    b.at(0, -0.056, -0.06, h => h.box(0.088, 0.034, 0.07, COL.bootDk));
    b.at(0, 0.012, -0.004, h => h.prism(12, 0.047, 0.047, -0.05, 0.046, 0.046, 0.04, COL.boot));
    [-0.01, 0.02, 0.05].forEach(z => b.at(0, 0.024 - z * 0.25, 0.06 + z, h => h.box(0.046, 0.004, 0.008, COL.bootDk)));
    return b;
  }

  function buildHips(b) {
    const rings = [
      { y: -0.2, rx: 0.128, rz: 0.108, cz: -0.006 },
      { y: -0.1, rx: 0.146, rz: 0.114, cz: 0.0 },
      { y: 0.0, rx: 0.143, rz: 0.11, cz: 0.004 },
      { y: 0.06, rx: 0.138, rz: 0.108, cz: 0.006 }
    ];
    ringLoft(b, rings, 20, () => COL.pants, { capBottom: true });
    [-1, 1].forEach(s => b.at(s * 0.083, -0.08, 0.0, h => h.ellipsoid(0.088, 0.1, 0.098, 12, 8, COL.pants)));
    const belt = [{ y: -0.008, rx: 0.148, rz: 0.114, cz: 0.006 }, { y: 0.03, rx: 0.146, rz: 0.112, cz: 0.006 }];
    ringLoft(b, belt, 24, () => COL.belt, {});
    b.at(0, 0.011, 0.118, h => h.box(0.046, 0.034, 0.01, COL.buckle));
    b.at(0, 0.011, 0.123, h => h.box(0.03, 0.02, 0.004, COL.belt));
    [-1, 1].forEach(s => b.at(s * 0.1, 0.011, 0.092, h => { h.push(M4.rotY(s * 0.7)); h.box(0.012, 0.046, 0.008, COL.pantsDk); h.pop(); }));
    b.at(-0.12, -0.05, 0.03, h => { h.push(M4.rotY(-0.9)); h.box(0.07, 0.09, 0.03, COL.strapDk); h.at(0, 0.035, 0.016, q => q.box(0.072, 0.03, 0.006, COL.belt)); h.pop(); });
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
          return rgb(atEdge ? 0x2a1610 : 0xb67c5c);
        });
        b.quad(q[0].p, q[1].p, q[2].p, q[3].p, cols, null, q.map(v => v.n));
      }
    }
    return b;
  }

  function buildTeeth(b, lower) {
    const n = 12;
    const R = 0.034, h = 0.011;
    for (let i = 0; i < n; i++) {
      const a0 = lerp(-1.0, 1.0, i / n), a1 = lerp(-1.0, 1.0, (i + 1) / n);
      const gap = 0.01;
      const shade = 0.88 + 0.08 * ((i % 2) ? 1 : 0);
      const col = [0.9 * shade, 0.86 * shade, 0.76 * shade, 0.08];
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
          return [S(y) * C(p) * 0.054, S(p) * 0.034, C(y) * C(p) * 0.03];
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
    b.ellipsoid(0.011, 0.034, 0.022, 12, 9, COL.skin);
    b.at(k * 0.004, 0.003, 0.004, h => h.ellipsoid(0.007, 0.023, 0.013, 10, 7, 0xa46a4c));
    b.at(k * 0.002, -0.023, 0.002, h => h.ellipsoid(0.008, 0.011, 0.01, 8, 5, COL.skin));
    b.pop();
    return b;
  }

  const LENS = { rx: 0.0262, ry: 0.0238, fwd: 0.017, out: 0.003 };

  function lensFrames() {
    return EYES.map(f => {
      const c = V3.add(f.c, V3.add(V3.mul(f.z, EYE_R + LENS.fwd), [f.side * LENS.out, 0.002, 0]));
      const z = V3.norm([f.side * 0.1, 0.04, 1]);
      const x = V3.norm(V3.cross([0, 1, 0], z));
      const y = V3.cross(z, x);
      return { side: f.side, c, x, y, z };
    });
  }

  function lensPt(f, ang, s) {
    const top = ang > 0 ? 0.93 : 1;
    return V3.add(f.c, V3.add(V3.mul(f.x, C(ang) * LENS.rx * s), V3.mul(f.y, S(ang) * LENS.ry * s * top)));
  }

  function buildFrames(b) {
    const L = lensFrames();
    L.forEach(f => {
      const pts = [];
      for (let i = 0; i <= 28; i++) pts.push(lensPt(f, (i / 28) * PI * 2, 1.0));
      K.tube(b, pts, pts.map(() => 0.0033), 6, COL.frame);
    });
    const inL = lensPt(L[1], PI, 1.0), inR = lensPt(L[0], 0, 1.0);
    const nose = rawPt(0, 0.21);
    const bz = nose[2] + relief(0, 0.21) + 0.004;
    const bridge = [];
    for (let i = 0; i <= 8; i++) {
      const k = i / 8;
      const p = V3.lerp(inL, inR, k);
      bridge.push([p[0], p[1] + 0.004 + S(k * PI) * 0.004, Math.max(p[2], bz) + S(k * PI) * 0.001]);
    }
    K.tube(b, bridge, bridge.map(() => 0.0024), 6, COL.frame);
    L.forEach(f => {
      const outer = lensPt(f, f.side > 0 ? 0 : PI, 1.0);
      const s = f.side;
      const hinge = V3.add(outer, [s * 0.004, 0.002, -0.004]);
      const ear = [s * (HW(0.15) + 0.008), YT(0.15) + 0.004, -0.012];
      const behind = [s * (HW(0.1) + 0.004), YT(0.02), -0.034];
      const arm = [outer, hinge];
      for (let i = 1; i <= 8; i++) arm.push(V3.lerp(hinge, ear, i / 8));
      arm.push(behind);
      K.tube(b, arm, arm.map(() => 0.0022), 5, COL.frame);
    });
    return b;
  }

  function buildLenses(b) {
    lensFrames().forEach(f => {
      const n = 24;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        b.tri(f.c, lensPt(f, a0, 0.98), lensPt(f, a1, 0.98), rgb(0xffffff), null, [f.z, f.z, f.z]);
      }
    });
    return b;
  }

  const HAT = { y: 0.054, tilt: -0.1, z: -0.004, h: 0.08 };

  function crownR(y) {
    const k = clamp((y - HAT.y) / HAT.h, 0, 1);
    return { rx: lerp(0.083, 0.071, k), rz: lerp(0.101, 0.088, k) };
  }

  function buildHat(b) {
    const n = 40, rows = 9;
    const top = HAT.y + HAT.h;
    const pt = (i, j) => {
      const a = (i / n) * PI * 2;
      const k = j / rows;
      const y = j === 0 ? HAT.y : j === 1 ? HAT.y + 0.019 : lerp(HAT.y + 0.019, top, Math.pow((k - 1 / rows) / (1 - 1 / rows), 0.9));
      const R = crownR(y);
      const close = k > 0.78 ? Math.sqrt(Math.max(0, 1 - Math.pow((k - 0.78) / 0.22, 2) * 0.86)) : 1;
      let x = S(a) * R.rx * close, z = C(a) * R.rz * close;
      let yy = y;
      yy -= 0.02 * g2(x, 0.03) * smooth(0.6, 1, k);
      const pinch = g2(a - 0.65, 0.3) + g2(a + 0.65, 0.3);
      x *= 1 - 0.1 * pinch * smooth(0.4, 0.9, k);
      z *= 1 - 0.06 * pinch * smooth(0.4, 0.9, k);
      return [x, yy, z];
    };
    const grid = [];
    for (let j = 0; j <= rows; j++) {
      const row = [];
      for (let i = 0; i <= n; i++) row.push(pt(i, j));
      grid.push(row);
    }
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < n; i++) {
        const a = grid[j][i], c = grid[j][i + 1], d = grid[j + 1][i + 1], e = grid[j + 1][i];
        const nn = V3.norm(V3.cross(V3.sub(c, a), V3.sub(e, a)));
        const out = V3.dot(nn, [a[0], 0.3, a[2]]) < 0 ? V3.mul(nn, -1) : nn;
        b.quad(a, c, d, e, j < 1 ? COL.band : COL.hat, null, [out, out, out, out]);
      }
    }
    const capTop = grid[rows];
    const cc = capTop.reduce((s, p) => V3.add(s, p), [0, 0, 0]).map(v => v / capTop.length);
    for (let i = 0; i < n; i++) b.tri(cc, capTop[i], capTop[i + 1], COL.hat, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0]]);
    const nb = 48, nr = 5;
    const brim = (i, r) => {
      const a = (i / nb) * PI * 2;
      const R = crownR(HAT.y);
      const out = lerp(0, 1, r);
      const ext = lerp(0.074, 0.058, Math.abs(S(a)));
      const rx = R.rx + out * ext, rz = R.rz + out * ext;
      const droop = out * out * (0.034 * Math.pow(C(a), 2) - 0.004 * Math.pow(S(a), 2));
      return [S(a) * rx, HAT.y - droop + 0.002, C(a) * rz];
    };
    for (let j = 0; j < nr; j++) {
      for (let i = 0; i < nb; i++) {
        const a = brim(i, j / nr), c = brim(i + 1, j / nr), d = brim(i + 1, (j + 1) / nr), e = brim(i, (j + 1) / nr);
        const nn = V3.norm(V3.cross(V3.sub(e, a), V3.sub(c, a)));
        const up = nn[1] < 0 ? V3.mul(nn, -1) : nn;
        const th = 0.004;
        b.quad(a, c, d, e, COL.hat, null, [up, up, up, up]);
        const dn = (p) => V3.add(p, [0, -th, 0]);
        b.quad(dn(e), dn(d), dn(c), dn(a), COL.hatDk, null, [V3.mul(up, -1), V3.mul(up, -1), V3.mul(up, -1), V3.mul(up, -1)]);
      }
      if (j === nr - 1) {
        for (let i = 0; i < nb; i++) {
          const a = brim(i, 1), c = brim(i + 1, 1);
          b.quad(a, c, V3.add(c, [0, -0.004, 0]), V3.add(a, [0, -0.004, 0]), COL.hatDk);
        }
      }
    }
    return b;
  }

  function eyeFrames() {
    return EYES;
  }

  function frameM(f, extra) {
    const base = new Float32Array([f.x[0], f.x[1], f.x[2], 0, f.y[0], f.y[1], f.y[2], 0, f.z[0], f.z[1], f.z[2], 0, f.c[0], f.c[1], f.c[2], 1]);
    return extra ? M4.mul(base, extra) : base;
  }

  function build(r, fx) {
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
      torsoTex: r.texture(512, paintTorso, { height: 512, clamp: true }),
      vestTex: r.texture(512, paintVest, { height: 512, clamp: true }),
      eye: mk(buildEyeMesh),
      lidU: mk(b => buildLid(b, true)),
      lidD: mk(b => buildLid(b, false)),
      eyes: eyeFrames(),
      teethU: mk(b => buildTeeth(b, false)),
      teethL: mk(b => buildTeeth(b, true)),
      cavityU: mk(b => buildCavity(b, false)),
      cavityL: mk(b => buildCavity(b, true)),
      tongue: mk(b => b.ellipsoid(0.024, 0.008, 0.022, 12, 6, COL.tongue)),
      earL: mk(b => buildEar(b, 'L')),
      earR: mk(b => buildEar(b, 'R')),
      ears: [-1, 1].map(s => { const q = rawPt(s * 1.55, 0.1); return [q[0] + s * 0.003, q[1] - 0.006, q[2] - 0.004]; }),
      lip: basePt(0, lipP(0)),
      hat: mk(buildHat),
      frames: mk(buildFrames),
      lenses: mk(buildLenses),
      torso: mk(buildTorso),
      vest: mk(buildVest),
      vestCollar: mk(buildVestCollar),
      shirtCollar: mk(buildShirtCollar),
      strap: mk(buildStrap),
      bullets: mk(buildBullets),
      hips: mk(buildHips),
      upper: mk(buildUpper),
      patchL: mk(b => buildPatch(b, 1)),
      patchR: mk(b => buildPatch(b, -1)),
      foreL: mk(b => buildFore(b, 'L')),
      foreR: mk(b => buildFore(b, 'R')),
      thigh: mk(buildThigh),
      shin: mk(buildShin),
      foot: mk(buildFoot),
      emblem: null,
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

  function updateNeck(P, m, tint) {
    const [NR, NS] = P.neckDims;
    const data = P.neckData;
    const bot = M4.mul(m.chest, M4.translate(0, D.neckY - 0.035, -0.006));
    const top = M4.chain(m.head, HEAD_SCALE, M4.translate(0, -0.092, -0.024));
    const shape = [[0.07, 0.064, 0], [0.064, 0.059, 0.004], [0.06, 0.056, 0.008], [0.057, 0.054, 0.01], [0.056, 0.053, 0.012], [0.056, 0.053, 0.012], [0.057, 0.054, 0.011], [0.06, 0.056, 0.01]];
    const ax = (M, c) => [M[c * 4], M[c * 4 + 1], M[c * 4 + 2]];
    const sc = rgb(COL.skin);
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
        const apple = j === 4 || j === 5 ? 0.006 * g2(a - 2 * PI, 0.25) : 0;
        const lx = S(a) * rx, lz = cz + C(a) * (rz + apple);
        const p = V3.add(o, V3.add(V3.mul(X, lx), V3.mul(Z, lz)));
        const n = V3.norm(V3.add(V3.mul(X, S(a) / rx), V3.mul(Z, C(a) / rz)));
        const shade = 0.86 + 0.14 * f;
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
    const vest = Object.assign({}, VEST_MAT, tint);
    const skin = Object.assign({}, SKIN_MAT, tint);
    if (!o.noBody) {
      fx.draw(P.torso, W(m.chest), Object.assign({ texture: P.torsoTex }, cloth));
      fx.draw(P.vest, W(m.chest), Object.assign({ texture: P.vestTex }, vest));
      fx.draw(P.vestCollar, W(m.chest), vest);
      fx.draw(P.shirtCollar, W(m.chest), cloth);
      fx.draw(P.strap, W(m.chest), Object.assign({}, vest, { spec: [0.2, 10] }));
      fx.draw(P.bullets, W(m.chest), Object.assign({}, METAL_MAT, tint));
      fx.draw(P.hips, W(m.pelvis), cloth);
      ['L', 'R'].forEach(s => {
        fx.draw(P.upper, W(m['upper' + s]), cloth);
        if (o.patch) fx.draw(s === 'L' ? P.patchL : P.patchR, W(m['upper' + s]), Object.assign({ texture: o.patch }, cloth));
        fx.draw(s === 'L' ? P.foreL : P.foreR, W(m['fore' + s]), skin);
        const hand = st.hands && st.hands[s];
        const HM = hand && hand.M ? hand.M : m['hand' + s];
        fx.draw(handMesh(P, s, (hand && hand.pose) || 'relax'), W(HM), skin);
        if (!o.noLegs) {
          fx.draw(P.thigh, W(m['thigh' + s]), cloth);
          fx.draw(P.shin, W(m['shin' + s]), cloth);
          fx.draw(P.foot, W(m['foot' + s]), Object.assign({}, cloth, { spec: [0.25, 12] }));
        }
      });
    }
    updateNeck(P, m);
    fx.draw(P.neck, pre || null, skin);
    deformHead(P.T, F, { pos: P.headPos, data: P.headData });
    P.head.update(P.headData);
    const H = M4.mul(W(m.head), HEAD_SCALE);
    fx.draw(P.head, H, Object.assign({ texture: P.faceTex, backDark: true }, skin));
    const jaw = clamp(F.jaw || 0, 0, 1.2) * 0.3;
    const JM = M4.chain(H, M4.translate(HINGE[0], HINGE[1], HINGE[2]), M4.rotX(jaw), M4.translate(-HINGE[0], -HINGE[1], -HINGE[2]));
    const lip = P.lip;
    const smile = Math.max(F.smileL || 0, F.smileR || 0);
    const wide = clamp((F.wide || 0) + smile * 0.4, 0, 1.2);
    const dark = { rim: 0, spec: [0, 1] };
    fx.draw(P.cavityU, M4.chain(H, M4.translate(0, lip[1] - 0.007, lip[2] - 0.042)), dark);
    fx.draw(P.cavityL, M4.chain(JM, M4.translate(0, lip[1] - 0.014, lip[2] - 0.042)), dark);
    fx.draw(P.tongue, M4.chain(JM, M4.translate(0, lip[1] - 0.02, lip[2] - 0.036)), { rim: 0.1, spec: [0.3, 12] });
    fx.draw(P.teethU, M4.chain(H, M4.translate(0, lip[1] - 0.004 + wide * 0.002, lip[2] - 0.039)), { spec: [0.4, 20], rim: 0.1 });
    fx.draw(P.teethL, M4.chain(JM, M4.translate(0, lip[1] + 0.0025 - wide * 0.002, lip[2] - 0.041)), { spec: [0.4, 20], rim: 0.1 });
    P.ears.forEach((q, i) => fx.draw(i ? P.earL : P.earR, M4.chain(H, M4.translate(q[0], q[1], q[2])), skin));
    const look = F.look || [0, 0];
    const blink = clamp(F.blink || 0, 0, 1);
    const lidU = F.lidU === undefined ? 0.3 : F.lidU;
    const lidL = F.lidL === undefined ? 0.4 : F.lidL;
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
    if (!o.noGlasses) fx.draw(P.frames, H, Object.assign({}, FRAME_MAT, tint));
    if (!o.noHat) fx.draw(P.hat, M4.chain(H, M4.translate(0, 0, HAT.z), M4.rotX(HAT.tilt)), Object.assign({}, HAT_MAT, tint));
    if (!o.noGlasses && !o.noLens) {
      const lens = o.lens || [0.94, 0.78, 0.42];
      fx.draw(P.lenses, H, { flat: [lens[0], lens[1], lens[2], 1], alpha: o.lensAlpha === undefined ? 0.24 : o.lensAlpha, blend: true });
    }
  }

  function headPoint(m, local) {
    return M4.point(M4.mul(m.head, HEAD_SCALE), local);
  }

  window.MeetSniper = { D, COL, HAND_POSES, CHANNELS, HAT, build, solve, draw, handBasis, handMesh, headPoint, lipP, basePt, rawPt, torsoSurf, torsoNormal, EYE_R, VEST_LIFT };
})();
