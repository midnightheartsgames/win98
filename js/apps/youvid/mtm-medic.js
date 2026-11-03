(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Rig = window.YouVidRig;

  const D = { chestY: 0.12, neckY: 0.47, headY: 0.135, shX: 0.2, shY: 0.37, upper: 0.31, fore: 0.29, hipX: 0.1, hipY: -0.05, thigh: 0.47, shin: 0.46 };

  const COL = {
    skin: 0xc08468, skinDk: 0xb27a5e, lidEdge: 0x3a2018, hair: 0x231c1b, hairHi: 0x3a3030, shirt: 0xe9e7e1, shirtDk: 0xc9c6bd,
    vest: 0xbdb6a4, vestDk: 0x9a937f, tie: 0xa8201f, coat: 0xdedad0, coatDk: 0xb9b4a8, strap: 0x3c2c22, strapDk: 0x2a1f19, buckle: 0x8e8a80,
    glove: 0xb3231f, gloveDk: 0x86181a, pants: 0x3a2b2a, pantsDk: 0x2a1f1f, belt: 0x1f1a19, boot: 0x1c1919, sole: 0x121010,
    frame: 0x3d4652, tongue: 0x9a4a46, patch: 0xd78a3a, cross: 0xb42a24
  };

  const SKIN_MAT = { spec: [0.12, 9], rim: 1.05 };
  const CLOTH_MAT = { spec: [0.05, 5], rim: 0.85 };
  const GLOVE_MAT = { spec: [0.75, 34], rim: 0.9 };
  const BOOT_MAT = { spec: [0.5, 26], rim: 0.7 };
  const EYE_MAT = { spec: [0.9, 60], rim: 0.2 };
  const HAIR_MAT = { spec: [0.35, 18], rim: 0.6 };
  const FRAME_MAT = { spec: [0.9, 40], rim: 0.5 };

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

  const YT = table([[-1.571, -0.137], [-1.25, -0.135], [-1.0, -0.129], [-0.8, -0.117], [-0.62, -0.104], [-0.48, -0.091], [-0.37, -0.077], [-0.22, -0.055], [-0.1, -0.035],
    [0.05, -0.008], [0.14, 0.012], [0.3, 0.04], [0.5, 0.066], [0.7, 0.087], [0.95, 0.1], [1.2, 0.106], [1.571, 0.108]]);
  const HW = table([[-1.571, 0.036], [-1.25, 0.05], [-1.0, 0.06], [-0.8, 0.07], [-0.62, 0.078], [-0.48, 0.082], [-0.3, 0.085], [-0.1, 0.086], [0.05, 0.086],
    [0.2, 0.085], [0.35, 0.083], [0.5, 0.079], [0.7, 0.068], [0.95, 0.055], [1.2, 0.037], [1.571, 0.0]]);
  const DF = table([[-1.571, 0.04], [-1.25, 0.068], [-1.0, 0.088], [-0.8, 0.097], [-0.62, 0.094], [-0.48, 0.091], [-0.33, 0.091], [-0.2, 0.092], [-0.08, 0.092],
    [0.05, 0.09], [0.2, 0.089], [0.33, 0.092], [0.5, 0.086], [0.7, 0.075], [0.95, 0.061], [1.2, 0.041], [1.571, 0.0]]);
  const DB = table([[-1.571, 0.02], [-1.1, 0.052], [-0.6, 0.076], [-0.2, 0.094], [0.2, 0.104], [0.6, 0.098], [0.95, 0.072], [1.25, 0.045], [1.571, 0.0]]);

  const NU = 72, NL = 16, NUP = 30, MW = 0.46;
  const HINGE = [0, -0.03, -0.012];
  const EYE_R = 0.0155;
  const CHANNELS = ['browDown', 'browUp', 'browInUp', 'smileL', 'smileR', 'frown', 'wide', 'round', 'sneer'];

  const g2 = (x, s) => Math.exp(-(x / s) * (x / s));
  const smooth = (e0, e1, x) => { const k = clamp((x - e0) / (e1 - e0), 0, 1); return k * k * (3 - 2 * k); };

  function lipP(a) {
    const q = a / 0.44;
    return -0.37 + 0.012 * Math.min(q * q, 1.6);
  }

  function yawAt(i) {
    const s = 2 * i / NU - 1;
    return PI * Math.sign(s) * Math.pow(Math.abs(s), 1.35);
  }

  function squircle(p) {
    return 0.14 * smooth(-1.05, -0.6, p) * (1 - smooth(0.4, 0.8, p));
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
    const down = clamp((0.34 - p) / 0.5, 0, 1);
    h += (0.006 + 0.019 * Math.pow(down, 1.5)) * g2(a, 0.065 + 0.06 * down) * smooth(-0.23, -0.17, p) * (1 - smooth(0.32, 0.4, p));
    h += 0.012 * g2(a, 0.15) * g2(p + 0.15, 0.055);
    h += 0.006 * g2(A - 0.15, 0.05) * g2(p + 0.19, 0.035);
    h -= 0.003 * g2(a, 0.04) * g2(p + 0.24, 0.035);
    h += 0.008 * g2(A - 0.3, 0.2) * g2(p - 0.29, 0.055);
    h += 0.004 * g2(a, 0.1) * g2(p - 0.27, 0.05);
    h -= 0.005 * g2(A - 0.34, 0.12) * g2(p - 0.15, 0.07);
    h += 0.009 * g2(A - 0.62, 0.16) * g2(p - 0.02, 0.08);
    h -= 0.002 * g2(A - 0.6, 0.18) * g2(p + 0.3, 0.11);
    h -= 0.0035 * g2(segDist(A, p, 0.16, -0.2, MW, lipP(MW) - 0.01), 0.025);
    h += 0.0012 * g2(dl - 0.02, 0.022) * (1 - smooth(MW, MW + 0.08, A));
    h += 0.0018 * g2(dl + 0.03, 0.026) * g2(a, 0.32);
    h -= 0.004 * g2(dl + 0.085, 0.03) * g2(a, 0.32);
    h += 0.016 * g2(a, 0.55) * g2(p + 0.82, 0.14);
    h += 0.004 * g2(A - 1.05, 0.25) * g2(p + 0.62, 0.14);
    h -= 0.004 * g2(A - 1.0, 0.2) * g2(p - 0.35, 0.15);
    return h;
  }

  function eyeFrame(s) {
    const a = s * 0.31, p = 0.14;
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
      const e = Math.sqrt((psi / 1.12) * (psi / 1.12) + (phi / 0.66) * (phi / 0.66));
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
    const gB = g2(A - 0.3, 0.2) * g2(p - 0.29, 0.1) * smooth(0.2, 0.26, p);
    const gG = g2(a, 0.07) * g2(p - 0.27, 0.06);
    out.browDown = [-sg * 0.003 * gB, -0.0075 * gB, 0.0025 * gB - 0.0025 * gG];
    const gU = g2(A - 0.3, 0.26) * g2(p - 0.34, 0.13);
    out.browUp = [0, 0.009 * gU, -0.001 * gU];
    const gI = g2(A - 0.12, 0.11) * g2(p - 0.3, 0.08);
    out.browInUp = [0, 0.007 * gI, 0];
    const gC = g2(A - MW, 0.12) * g2(dl, 0.08);
    const gK = g2(A - 0.5, 0.15) * g2(p + 0.16, 0.1);
    const gL = g2(A - 0.33, 0.14) * g2(p - 0.06, 0.05);
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
    out.wide = [sg * 0.009 * gC, 0.011 * gUp - 0.012 * gLo, 0.001 * gLo - 0.003 * gC];
    const gR = g2(dl, 0.08) * (1 - smooth(MW, MW + 0.12, A));
    const x0 = rawPt(a, p)[0];
    out.round = [-x0 * 0.33 * gR, 0, 0.008 * gR];
    const gS = g2(A - 0.13, 0.08) * g2(p + 0.16, 0.07);
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
        const o = v * 12;
        data[o] = px; data[o + 1] = py; data[o + 2] = pz;
        data[o + 3] = nx; data[o + 4] = ny; data[o + 5] = nz;
        data[o + 6] = 1; data[o + 7] = 1; data[o + 8] = 1; data[o + 9] = 0;
        data[o + 10] = T.uv[v * 2]; data[o + 11] = T.uv[v * 2 + 1];
      }
    }
    return data;
  }

  const HAIRLINE = [[0, 0.57], [0.18, 0.6], [0.42, 0.7], [0.72, 0.66], [0.98, 0.5], [1.18, 0.3], [1.32, 0.1], [1.42, 0.12], [1.52, 0.3], [1.66, 0.34], [1.86, 0.18],
    [2.15, -0.12], [2.55, -0.34], [PI, -0.4]];

  function hairP(a) {
    const A = Math.min(Math.abs(a), PI);
    for (let i = 0; i < HAIRLINE.length - 1; i++) {
      const [a0, p0] = HAIRLINE[i], [a1, p1] = HAIRLINE[i + 1];
      if (A <= a1) {
        const k = (A - a0) / (a1 - a0);
        return lerp(p0, p1, k * k * (3 - 2 * k));
      }
    }
    return HAIRLINE[HAIRLINE.length - 1][1];
  }

  function hairThick(a, p) {
    const A = Math.abs(a);
    const top = 0.011 * g2(A, 0.8) * smooth(0.45, 0.95, p);
    const back = 0.005 * smooth(1.6, 2.6, A);
    const edge = smooth(0, 0.14, p - hairP(a));
    return (0.0025 + top + back) * edge;
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
    ctx.fillStyle = '#c08468';
    ctx.fillRect(0, 0, W, H);
    const vg = ctx.createLinearGradient(0, 0, 0, H);
    vg.addColorStop(0, 'rgba(244,196,160,0.3)');
    vg.addColorStop(0.42, 'rgba(244,196,160,0)');
    vg.addColorStop(0.7, 'rgba(120,70,52,0)');
    vg.addColorStop(1, 'rgba(120,70,52,0.3)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    [-1, 1].forEach(s => {
      blob(s * 0.34, 0.15, 0.15, 0.08, '110,62,48', 0.38);
      blob(s * 0.36, 0.06, 0.1, 0.035, '120,70,60', 0.22);
      blob(s * 0.58, -0.08, 0.2, 0.12, '205,112,90', 0.14);
      blob(s * 0.62, -0.32, 0.2, 0.12, '130,76,58', 0.22);
      blob(s * 1.5, 0.05, 0.12, 0.16, '190,104,82', 0.3);
      blob(s * 0.9, -0.55, 0.3, 0.18, '90,84,96', 0.12);
    });
    blob(0, -0.14, 0.09, 0.06, '214,112,88', 0.32);
    blob(0, -0.8, 0.36, 0.18, '90,84,96', 0.1);
    blob(0, 0.45, 0.5, 0.18, '246,200,160', 0.16);
    [-1, 1].forEach(s => {
      blob(s * 0.1, -0.2, 0.02, 0.01, '80,34,28', 0.45);
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const k = i / 12;
        pts.push([s * lerp(0.06, 0.58, k), 0.19 + 0.03 * S(k * PI * 0.85) + 0.012 * k]);
      }
      line(pts, 15, 'rgba(70,46,36,0.4)');
      line(pts, 11, 'rgba(32,22,20,0.97)');
      ctx.strokeStyle = 'rgba(120,60,44,0.22)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(...P(s * 0.15, -0.2));
      ctx.quadraticCurveTo(...P(s * 0.3, -0.27), ...P(s * MW, lipP(MW) - 0.012));
      ctx.stroke();
      blob(s * 0.34, 0.08, 0.12, 0.022, '120,72,58', 0.32);
      line([[s * 0.24, 0.205], [s * 0.34, 0.225], [s * 0.45, 0.205]], 2, 'rgba(90,50,40,0.35)');
    });
    const g = rand(57);
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const a = lerp(-PI, PI, i / 64);
      const [x, y] = P(a, hairP(a));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.lineTo(W, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = '#231c1b';
    ctx.fill();
    ctx.clip();
    for (let i = 0; i < 2600; i++) {
      const [x, y] = P(-PI + g() * 2 * PI, -0.4 + g() * 1.9);
      ctx.fillStyle = `rgba(${g() < 0.5 ? '70,58,56' : '10,8,8'},${0.2 + g() * 0.3})`;
      ctx.fillRect(x, y, 1, 3);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(40,30,28,0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 64; i++) {
      const a = lerp(-PI, PI, i / 64);
      const [x, y] = P(a, hairP(a) - 0.008);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
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
      ctx.lineTo(...P(a, lipP(a) - 0.005 - 0.018 * k));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(160,92,80,0.25)';
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
      ctx.lineTo(...P(a, lipP(a) + 0.004 + 0.01 * k));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(140,78,66,0.3)';
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(60,26,20,0.95)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = lerp(-MW, MW, i / 40);
      const [x, y] = P(a, lipP(a));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function paintHair(ctx, W, H) {
    ctx.fillStyle = '#231c1b';
    ctx.fillRect(0, 0, W, H);
    const g = rand(71);
    for (let i = 0; i < 900; i++) {
      const x = g() * W, y = g() * H;
      ctx.strokeStyle = `rgba(${g() < 0.6 ? '86,74,72' : '8,6,6'},${0.15 + g() * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (g() - 0.5) * 3, y + 10 + g() * 24);
      ctx.stroke();
    }
  }

  function paintEye(ctx, W, H) {
    ctx.fillStyle = '#e6e0d8';
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = W * 0.34;
    const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
    g.addColorStop(0, '#cfdce6');
    g.addColorStop(0.6, '#8aa3b8');
    g.addColorStop(0.92, '#4a6278');
    g.addColorStop(1, '#2c3a48');
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
    [-0.16, 0.138, 0.104, 0.0], [-0.06, 0.14, 0.105, 0.004], [0.04, 0.146, 0.109, 0.01], [0.14, 0.156, 0.115, 0.014], [0.25, 0.17, 0.117, 0.014],
    [0.33, 0.18, 0.113, 0.008], [0.38, 0.176, 0.105, 0.0], [0.415, 0.156, 0.095, -0.006], [0.445, 0.12, 0.083, -0.008], [0.468, 0.084, 0.071, -0.004], [0.485, 0.064, 0.061, 0.0]
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

  function splat(ctx, x, y, r, g, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    const n = 9 + Math.floor(g() * 6);
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * PI * 2;
      const rr = r * (0.55 + g() * 0.6);
      const px = x + C(a) * rr, py = y + S(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    const rays = 3 + Math.floor(g() * 5);
    for (let i = 0; i < rays; i++) {
      const a = g() * PI * 2, len = r * (1.2 + g() * 1.6);
      ctx.lineWidth = r * (0.12 + g() * 0.2);
      ctx.strokeStyle = col;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + C(a) * len, y + S(a) * len);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + C(a) * len * 1.12, y + S(a) * len * 1.12, r * (0.1 + g() * 0.14), 0, PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 6; i++) {
      const a = g() * PI * 2, d = r * (1.4 + g() * 2.4);
      ctx.beginPath();
      ctx.arc(x + C(a) * d, y + S(a) * d, r * (0.06 + g() * 0.16), 0, PI * 2);
      ctx.fill();
    }
  }

  function bloodPass(ctx, W, H, level, seed, spots) {
    const g = rand(seed);
    for (let l = 1; l <= level; l++) {
      spots[l - 1].forEach(([u, v, r]) => splat(ctx, u * W, v * H, r * W, g, 'rgba(172,18,16,0.92)'));
      for (let i = 0; i < 26 * l; i++) {
        ctx.fillStyle = 'rgba(160,16,14,0.85)';
        ctx.beginPath();
        ctx.arc(g() * W, H * (0.1 + g() * 0.8), 1 + g() * 3.2, 0, PI * 2);
        ctx.fill();
      }
    }
  }

  const VEST_SPLATS = [
    [[0.5, 0.42, 0.03], [0.44, 0.6, 0.018], [0.58, 0.7, 0.014], [0.37, 0.33, 0.012]],
    [[0.53, 0.5, 0.05], [0.4, 0.26, 0.026], [0.62, 0.32, 0.022], [0.46, 0.75, 0.03], [0.68, 0.58, 0.02], [0.3, 0.5, 0.016]]
  ];

  function paintTorsoLab(ctx, W, H, blood) {
    const y0 = TORSO[0].y, y1 = TORSO[TORSO.length - 1].y;
    const Y = (y) => (1 - (y - y0) / (y1 - y0)) * H;
    const U = (ang) => ((ang + PI) / (2 * PI)) * W;
    ctx.fillStyle = '#a69e8a';
    ctx.fillRect(0, 0, W, H);
    const fold = ctx.createLinearGradient(0, 0, W, 0);
    fold.addColorStop(0, 'rgba(60,50,40,0.18)');
    fold.addColorStop(0.5, 'rgba(255,250,240,0.06)');
    fold.addColorStop(1, 'rgba(60,50,40,0.18)');
    ctx.fillStyle = fold;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e9e7e1';
    ctx.beginPath();
    ctx.moveTo(U(-0.62), Y(0.49));
    ctx.lineTo(U(0.62), Y(0.49));
    ctx.lineTo(U(0.5), Y(0.42));
    ctx.lineTo(U(0.03), Y(0.17));
    ctx.lineTo(U(-0.03), Y(0.17));
    ctx.lineTo(U(-0.5), Y(0.42));
    ctx.closePath();
    ctx.fill();
    [-1, 1].forEach(s => {
      ctx.strokeStyle = 'rgba(120,110,92,0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(U(s * 0.5), Y(0.42));
      ctx.lineTo(U(s * 0.03), Y(0.17));
      ctx.stroke();
      ctx.fillStyle = '#e9e7e1';
      ctx.beginPath();
      ctx.moveTo(U(s * 1.25), Y(0.485));
      ctx.lineTo(U(s * 1.9), Y(0.485));
      ctx.lineTo(U(s * 1.9), Y(0.33));
      ctx.quadraticCurveTo(U(s * 1.6), Y(0.36), U(s * 1.25), Y(0.485));
      ctx.fill();
    });
    ctx.fillStyle = '#a8201f';
    ctx.beginPath();
    ctx.moveTo(U(-0.045), Y(0.46));
    ctx.lineTo(U(0.045), Y(0.46));
    ctx.lineTo(U(0.03), Y(0.43));
    ctx.lineTo(U(0.075), Y(0.2));
    ctx.lineTo(U(0), Y(0.16));
    ctx.lineTo(U(-0.075), Y(0.2));
    ctx.lineTo(U(-0.03), Y(0.43));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(70,10,10,0.35)';
    ctx.fillRect(U(-0.006), Y(0.43), U(0.006) - U(-0.006), Y(0.19) - Y(0.43));
    ctx.fillStyle = '#3a342c';
    [0.1, 0.02, -0.06].forEach(y => {
      ctx.beginPath();
      ctx.arc(U(0.045), Y(y), 4, 0, PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = 'rgba(110,100,84,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(U(0.02), Y(0.17));
    ctx.lineTo(U(0.02), Y(-0.12));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(100,92,76,0.6)';
    ctx.lineWidth = 2;
    [[-0.55, 0.04, -0.22, 0.06], [0.6, 0.0, 0.3, 0.05]].forEach(([a0, ya, a1, yb]) => {
      ctx.beginPath();
      ctx.moveTo(U(a0), Y(ya));
      ctx.lineTo(U(a1), Y(yb));
      ctx.stroke();
    });
    ctx.fillStyle = 'rgba(80,72,60,0.4)';
    ctx.fillRect(U(PI - 0.7), Y(0.08), U(PI - 0.05) - U(PI - 0.7), 8);
    ctx.fillRect(U(-PI + 0.05), Y(0.08), U(-PI + 0.7) - U(-PI + 0.05), 8);
    const g = rand(13);
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = `rgba(${g() < 0.5 ? '0,0,0' : '255,255,255'},${g() * 0.04})`;
      ctx.fillRect(g() * W, g() * H, 2, 2);
    }
    if (blood) bloodPass(ctx, W, H, blood, 91, VEST_SPLATS);
  }

  function paintTorsoCoat(ctx, W, H) {
    const y0 = TORSO[0].y, y1 = TORSO[TORSO.length - 1].y;
    const Y = (y) => (1 - (y - y0) / (y1 - y0)) * H;
    const U = (ang) => ((ang + PI) / (2 * PI)) * W;
    ctx.fillStyle = '#dedad0';
    ctx.fillRect(0, 0, W, H);
    const fold = ctx.createLinearGradient(0, 0, W, 0);
    fold.addColorStop(0, 'rgba(70,64,56,0.2)');
    fold.addColorStop(0.5, 'rgba(255,255,250,0.05)');
    fold.addColorStop(1, 'rgba(70,64,56,0.2)');
    ctx.fillStyle = fold;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e9e7e1';
    ctx.beginPath();
    ctx.moveTo(U(-0.32), Y(0.49));
    ctx.lineTo(U(0.32), Y(0.49));
    ctx.lineTo(U(0.05), Y(0.34));
    ctx.lineTo(U(-0.05), Y(0.34));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#a8201f';
    ctx.beginPath();
    ctx.moveTo(U(-0.035), Y(0.46));
    ctx.lineTo(U(0.035), Y(0.46));
    ctx.lineTo(U(0.05), Y(0.36));
    ctx.lineTo(U(0), Y(0.34));
    ctx.lineTo(U(-0.05), Y(0.36));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,114,100,0.9)';
    ctx.lineWidth = 3;
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.moveTo(U(s * 0.32), Y(0.49));
      ctx.lineTo(U(s * 0.05), Y(0.34));
      ctx.lineTo(U(s * 0.04), Y(0.3));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(U(s * 0.32), Y(0.49));
      ctx.lineTo(U(s * 0.42), Y(0.36));
      ctx.lineTo(U(s * 0.12), Y(0.27));
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(U(0.06), Y(0.3));
    ctx.lineTo(U(0.06), Y(-0.16));
    ctx.stroke();
    ctx.fillStyle = '#4a4238';
    [0.22, 0.1, -0.02, -0.12].forEach(y => {
      ctx.beginPath();
      ctx.arc(U(0.12), Y(y), 4, 0, PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#3c2c22';
    [-1, 1].forEach(s => {
      ctx.fillRect(U(s * 0.48) - 9, Y(0.45), 18, Y(-0.06) - Y(0.45));
      ctx.fillRect(U(s * (PI - 0.55)) - 9, Y(0.45), 18, Y(-0.02) - Y(0.45));
    });
    ctx.fillRect(0, Y(-0.06), W, Y(-0.1) - Y(-0.06));
    ctx.fillStyle = '#8e8a80';
    [-1, 1].forEach(s => ctx.fillRect(U(s * 0.48) - 6, Y(0.16), 12, 10));
    const g = rand(17);
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = `rgba(${g() < 0.5 ? '0,0,0' : '255,255,255'},${g() * 0.035})`;
      ctx.fillRect(g() * W, g() * H, 2, 2);
    }
  }

  function buildTorso(b) {
    ringLoft(b, TORSO, 32, null, {});
    return b;
  }

  function buildCollar(b, coat) {
    const rings = [{ y: 0.455, rx: 0.088, rz: 0.076, cz: -0.004 }, { y: 0.49, rx: 0.07, rz: 0.064, cz: -0.002 }, { y: 0.512, rx: 0.068, rz: 0.062, cz: 0.0 }];
    ringLoft(b, rings, 24, () => COL.shirt, { skip: (u) => u > 0.47 && u < 0.53 });
    [-1, 1].forEach(s => {
      const a = [s * 0.012, 0.512, 0.062], c = [s * 0.058, 0.512, 0.032], d = [s * 0.05, 0.47, 0.072];
      b.tri(a, s > 0 ? c : d, s > 0 ? d : c, COL.shirtDk);
      b.tri(a, s > 0 ? d : c, s > 0 ? c : d, COL.shirt);
    });
    b.at(0, 0.47, 0.074, h => h.ellipsoid(0.014, 0.016, 0.01, 10, 6, COL.tie));
    if (coat) {
      const cr = [{ y: 0.43, rx: 0.13, rz: 0.104, cz: -0.006 }, { y: 0.47, rx: 0.1, rz: 0.088, cz: -0.012 }, { y: 0.53, rx: 0.088, rz: 0.08, cz: -0.016 }];
      ringLoft(b, cr, 28, (u, y) => (y > 0.52 ? COL.coatDk : COL.coat), { skip: (u) => u > 0.4 && u < 0.6 });
    }
    return b;
  }

  function buildStraps(b) {
    [-1, 1].forEach(s => {
      const pts = [];
      for (let i = 0; i <= 10; i++) {
        const k = i / 10;
        const a = lerp(s * 0.48, s * (PI - 0.55), k);
        const p = torsoSurf(a, 0.43, 0.012);
        const lift = S(k * PI);
        pts.push([p[0] * (1 + lift * 0.12), 0.43 + lift * 0.05, p[2] * (1 - lift * 0.3)]);
      }
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], c = pts[i + 1];
        const t = V3.norm(V3.sub(c, a));
        const w = V3.mul(V3.norm(V3.cross([0, 1, 0], t)), 0.02);
        b.quad(V3.sub(a, w), V3.add(a, w), V3.add(c, w), V3.sub(c, w), COL.strap, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
      }
      const bk = torsoSurf(s * 0.48, 0.16, 0.014);
      const n = torsoNormal(s * 0.48, 0.16);
      b.push(M4.translate(bk[0], bk[1], bk[2]), M4.rotY(Math.atan2(n[0], n[2])));
      b.box(0.05, 0.03, 0.01, COL.buckle);
      b.pop();
    });
    return b;
  }

  function buildShoulderCaps(b, col) {
    [-1, 1].forEach(s => {
      b.at(s * 0.2, 0.36, -0.006, h => {
        h.push(M4.rotZ(-s * 0.55));
        h.ellipsoid(0.052, 0.036, 0.058, 16, 10, col);
        h.pop();
      });
    });
    return b;
  }

  function limbRings(len, keys) {
    return keys.map(([f, r, rz, cz]) => ({ y: -len * f, rx: r, rz: rz || r, cz: cz || 0 })).reverse();
  }

  function buildUpper(b, coat, side) {
    const len = D.upper;
    if (coat) {
      const rings = limbRings(len, [[-0.12, 0.046], [0, 0.052, 0.054], [0.2, 0.053, 0.054, 0.004], [0.5, 0.05, 0.05, 0.004], [0.8, 0.046, 0.046, 0.002], [1.0, 0.043, 0.043], [1.08, 0.04, 0.04]]);
      ringLoft(b, rings, 16, () => COL.coat, {});
      if (side === 'L') {
        b.push(M4.translate(0.05, -len * 0.26, 0), M4.rotY(PI / 2));
        K.discXY(b, 0, 0, 0.002, 0.03, 18, rgb(COL.patch));
        K.discXY(b, 0, 0, 0.0026, 0.025, 18, rgb(0xeee7da));
        b.at(0, 0, 0.0032, h => {
          h.box(0.012, 0.036, 0.002, rgb(COL.cross));
          h.box(0.036, 0.012, 0.002, rgb(COL.cross));
        });
        b.pop();
      }
      return b;
    }
    const rings = limbRings(len, [[-0.12, 0.044], [0, 0.05, 0.052], [0.2, 0.051, 0.052, 0.004], [0.5, 0.048, 0.049, 0.004], [0.8, 0.046, 0.046, 0.002], [0.9, 0.05, 0.05], [1.02, 0.05, 0.05], [1.08, 0.04, 0.04]]);
    ringLoft(b, rings, 16, (u, y) => (-y / len > 0.88 ? COL.shirtDk : COL.shirt), {});
    return b;
  }

  function buildFore(b, coat) {
    const len = D.fore;
    if (coat) {
      const rings = limbRings(len, [[-0.1, 0.042], [0, 0.044], [0.3, 0.043, 0.041], [0.5, 0.04, 0.038], [0.52, 0.047, 0.045], [0.62, 0.044, 0.042], [0.85, 0.032, 0.03], [1.0, 0.029, 0.027], [1.05, 0.026, 0.024]]);
      ringLoft(b, rings, 14, (u, y) => (-y / len < 0.51 ? COL.coat : COL.glove), { capTop: true, capBottom: true });
      return b;
    }
    const rings = limbRings(len, [[-0.1, 0.04], [0, 0.046], [0.06, 0.046, 0.044], [0.12, 0.04, 0.038], [0.35, 0.037, 0.035], [0.65, 0.031, 0.029], [0.85, 0.028, 0.026], [1.0, 0.027, 0.025], [1.05, 0.024, 0.022]]);
    ringLoft(b, rings, 14, () => COL.glove, { capTop: true, capBottom: true });
    return b;
  }

  const HAND_POSES = {
    relax: { curl: [0.32, 0.4, 0.46, 0.52], spread: 0.15, thumb: [0.45, 0.35] },
    fist: { curl: [1, 1, 1, 1], spread: 0, thumb: [0.15, 0.95] },
    grip: { curl: [0.74, 0.77, 0.8, 0.82], spread: 0.05, thumb: [0.65, 0.55] },
    point: { curl: [0.02, 1, 1, 1], spread: 0.05, thumb: [0.25, 0.85] },
    open: { curl: [0.06, 0.05, 0.07, 0.1], spread: 0.55, thumb: [0.85, 0.1] },
    flat: { curl: [0.04, 0.03, 0.04, 0.06], spread: 0.0, thumb: [0.3, 0.1] },
    claw: { curl: [0.5, 0.55, 0.6, 0.62], spread: 0.4, thumb: [0.6, 0.4] },
    cup: { curl: [0.34, 0.36, 0.38, 0.4], spread: 0.1, thumb: [0.7, 0.25] },
    pinch: { curl: [0.55, 0.85, 0.9, 0.92], spread: 0.05, thumb: [0.7, 0.6] },
    hold: { curl: [0.5, 0.55, 0.6, 0.65], spread: 0.08, thumb: [0.8, 0.3] }
  };

  function palm(b) {
    const rows = [[0.012, 0.038, 0.024], [-0.02, 0.045, 0.026], [-0.06, 0.048, 0.023], [-0.092, 0.046, 0.019], [-0.104, 0.041, 0.015]];
    const sides = 14;
    const pt = (r, i) => {
      const a = (i / sides) * PI * 2;
      return [S(a) * r[1], r[0], C(a) * r[2]];
    };
    for (let j = 0; j < rows.length - 1; j++) {
      for (let i = 0; i < sides; i++) {
        const a = pt(rows[j], i), bb = pt(rows[j], i + 1), c = pt(rows[j + 1], i + 1), d = pt(rows[j + 1], i);
        const ns = [a, bb, c, d].map(q => V3.norm([q[0] / 0.045, 0, q[2] / 0.022]));
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
    const xs = [0.03, 0.01, -0.01, -0.028];
    const lens = [0.088, 0.095, 0.09, 0.072];
    const rads = [0.0102, 0.0108, 0.0102, 0.009];
    const spreads = [0.13, 0.03, -0.06, -0.16];
    xs.forEach((x, f) => {
      const c = pose.curl[f];
      const L = lens[f], r = rads[f];
      const l1 = L * 0.44, l2 = L * 0.31, l3 = L * 0.25;
      b.push(M4.translate(k * x, -0.096 + Math.abs(x) * 0.12, 0.002), M4.rotZ(k * spreads[f] * (0.4 + pose.spread)), M4.rotX(-(c * 1.45 + 0.06)));
      b.at(0, 0, 0, h => h.ellipsoid(r * 1.2, r * 1.12, r * 1.08, 8, 5, COL.glove));
      fingerSegment(b, l1, r, r * 0.97, COL.glove);
      b.push(M4.translate(0, -l1, 0), M4.rotX(-c * 1.65));
      fingerSegment(b, l2, r * 0.97, r * 0.92, COL.glove);
      b.push(M4.translate(0, -l2, 0), M4.rotX(-c * 1.05));
      fingerSegment(b, l3, r * 0.92, r * 0.82, COL.glove);
      b.pop();
      b.pop();
      b.pop();
    });
    const [ab, tc] = pose.thumb;
    b.push(M4.translate(k * 0.04, -0.028, 0.011), M4.rotY(k * (0.35 + ab * 0.5)), M4.rotZ(k * (0.55 + ab * 0.45)), M4.rotX(-0.3 - ab * 0.4));
    b.at(0, 0, 0, h => h.ellipsoid(0.016, 0.019, 0.015, 8, 5, COL.glove));
    fingerSegment(b, 0.034, 0.0136, 0.013, COL.glove);
    b.push(M4.translate(0, -0.034, 0), M4.rotX(-tc * 0.9));
    fingerSegment(b, 0.028, 0.013, 0.0124, COL.glove);
    b.push(M4.translate(0, -0.028, 0), M4.rotX(-tc * 0.8));
    fingerSegment(b, 0.024, 0.0124, 0.011, COL.glove);
    b.pop();
    b.pop();
    b.pop();
    return b;
  }

  function buildThigh(b) {
    const len = D.thigh;
    ringLoft(b, limbRings(len, [[-0.15, 0.072], [0, 0.076, 0.08], [0.4, 0.068, 0.072], [0.8, 0.058, 0.06], [1.0, 0.054, 0.054], [1.08, 0.05, 0.05]]), 14, () => COL.pants, { capTop: true, capBottom: true });
    return b;
  }

  function buildShin(b) {
    const len = D.shin;
    const col = (u, y) => (-y / len > 0.12 ? COL.boot : COL.pants);
    ringLoft(b, limbRings(len, [[-0.06, 0.054], [0.08, 0.055], [0.1, 0.06], [0.14, 0.06], [0.3, 0.056], [0.55, 0.048], [0.8, 0.042], [0.95, 0.04], [1.04, 0.04]]), 14, col, { capTop: true, capBottom: true });
    return b;
  }

  function buildFoot(b) {
    b.at(0, -0.02, 0.05, h => h.ellipsoid(0.046, 0.04, 0.12, 12, 7, COL.boot));
    b.at(0, -0.056, 0.055, h => h.box(0.094, 0.022, 0.26, COL.sole));
    b.at(0, -0.04, -0.06, h => h.box(0.07, 0.04, 0.05, COL.sole));
    b.at(0, 0.012, -0.004, h => h.prism(12, 0.044, 0.044, -0.05, 0.042, 0.042, 0.04, COL.boot));
    return b;
  }

  function buildHips(b, coat) {
    const rings = [
      { y: -0.2, rx: 0.124, rz: 0.104, cz: -0.006 },
      { y: -0.1, rx: 0.144, rz: 0.112, cz: 0.0 },
      { y: 0.0, rx: 0.142, rz: 0.108, cz: 0.004 },
      { y: 0.06, rx: 0.138, rz: 0.106, cz: 0.006 }
    ];
    ringLoft(b, rings, 20, () => (coat ? COL.coat : COL.pants), { capBottom: true });
    [-1, 1].forEach(s => b.at(s * 0.08, -0.08, 0.0, h => h.ellipsoid(0.086, 0.096, 0.096, 12, 8, COL.pants)));
    const belt = [{ y: -0.005, rx: 0.146, rz: 0.112, cz: 0.006 }, { y: 0.035, rx: 0.144, rz: 0.11, cz: 0.006 }];
    ringLoft(b, belt, 24, () => (coat ? COL.strap : COL.belt), {});
    b.at(0, 0.015, 0.116, h => h.box(0.046, 0.034, 0.01, COL.buckle));
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
          return rgb(atEdge ? COL.lidEdge : 0xc58f74);
        });
        b.quad(q[0].p, q[1].p, q[2].p, q[3].p, cols, null, q.map(v => v.n));
      }
    }
    return b;
  }

  function buildTeeth(b, lower) {
    const n = 12;
    const R = 0.038, h = 0.013;
    for (let i = 0; i < n; i++) {
      const a0 = lerp(-1.0, 1.0, i / n), a1 = lerp(-1.0, 1.0, (i + 1) / n);
      const gap = 0.01;
      const shade = 0.92 + 0.08 * ((i % 2) ? 1 : 0);
      const col = [0.96 * shade, 0.95 * shade, 0.9 * shade, 0.08];
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
    b.push(M4.rotY(k * 0.45), M4.rotZ(-k * 0.06), M4.scale(0.8, 0.82, 0.8));
    b.ellipsoid(0.012, 0.036, 0.024, 12, 9, COL.skin);
    b.at(k * 0.004, 0.003, 0.004, h => h.ellipsoid(0.007, 0.024, 0.014, 10, 7, 0xb47258));
    b.at(k * 0.002, -0.025, 0.002, h => h.ellipsoid(0.008, 0.011, 0.011, 8, 5, COL.skin));
    b.pop();
    return b;
  }

  function buildHair(b) {
    const NA = 64, NR = 9;
    const pt = (i, j) => {
      const a = -PI + (i / NA) * 2 * PI;
      const p0 = hairP(a);
      const p = lerp(p0, PI / 2 - 0.001, Math.pow(j / NR, 0.9));
      const q = basePt(a, p);
      const n = approxNormal(a, p);
      return { p: V3.add(q, V3.mul(n, hairThick(a, p))), uv: [i / NA * 4, (p + PI / 2) / PI * 2] };
    };
    const grid = [];
    for (let j = 0; j <= NR; j++) {
      const row = [];
      for (let i = 0; i <= NA; i++) row.push(pt(i, j));
      grid.push(row);
    }
    for (let j = 0; j < NR; j++) {
      for (let i = 0; i < NA; i++) {
        const a = grid[j][i], c = grid[j][i + 1], d = grid[j + 1][i + 1], e = grid[j + 1][i];
        const nn = [a, c, d, e].map(v => V3.norm(V3.add(v.p, [0, 0.02, 0])));
        b.quad(a.p, c.p, d.p, e.p, COL.hair, [a.uv, c.uv, d.uv, e.uv], nn);
      }
    }
    return b;
  }

  const GLASSES = { R: 0.0195, tube: 0.0016, z: 0.024 };

  function lensFrame(f) {
    const c = V3.add(V3.add(f.c, V3.mul(f.z, EYE_R + GLASSES.z - 0.006)), [0, 0.002, 0]);
    const z = V3.norm([f.side * 0.12, 0.02, 1]);
    const x = V3.norm(V3.cross([0, 1, 0], z));
    const y = V3.cross(z, x);
    return { c, x, y, z };
  }

  function ringPts(L, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * PI * 2;
      pts.push(V3.add(L.c, V3.add(V3.mul(L.x, C(a) * GLASSES.R), V3.mul(L.y, S(a) * GLASSES.R))));
    }
    return pts;
  }

  function buildGlasses(b) {
    const L = EYES.map(lensFrame);
    L.forEach(F => K.tube(b, ringPts(F, 24), new Array(25).fill(GLASSES.tube), 6, COL.frame));
    const li = V3.add(L[0].c, V3.mul(L[0].x, GLASSES.R)), ri = V3.add(L[1].c, V3.mul(L[1].x, -GLASSES.R));
    const nose = basePt(0, 0.2);
    const bridge = [];
    for (let i = 0; i <= 8; i++) {
      const k = i / 8;
      const p = V3.lerp(li, ri, k);
      const lift = S(k * PI);
      bridge.push([p[0], p[1] + lift * 0.004, Math.max(p[2], nose[2] + 0.004) + lift * 0.002]);
    }
    K.tube(b, bridge, new Array(9).fill(GLASSES.tube), 6, COL.frame);
    L.forEach(F => {
      const side = Math.sign(F.c[0]);
      const out = V3.add(F.c, V3.mul(F.x, side * Math.sign(F.x[0]) * GLASSES.R));
      const temple = rawPt(side * 1.38, 0.18);
      const ear = rawPt(side * 1.62, 0.16);
      const pts = [out, V3.add(out, [side * 0.006, 0.001, -0.006]), [temple[0] + side * 0.005, temple[1] + 0.006, temple[2]], [ear[0] + side * 0.008, ear[1] + 0.008, ear[2]], [ear[0] + side * 0.004, ear[1] - 0.012, ear[2] - 0.016]];
      K.tube(b, pts, new Array(pts.length).fill(GLASSES.tube * 0.9), 5, COL.frame);
    });
    return b;
  }

  function buildLenses(b) {
    EYES.map(lensFrame).forEach(F => {
      const n = 20;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        const p0 = V3.add(F.c, V3.add(V3.mul(F.x, C(a0) * GLASSES.R), V3.mul(F.y, S(a0) * GLASSES.R)));
        const p1 = V3.add(F.c, V3.add(V3.mul(F.x, C(a1) * GLASSES.R), V3.mul(F.y, S(a1) * GLASSES.R)));
        b.tri(F.c, p0, p1, 0xffffff, [[0.5, 0.5], [0.5 + C(a0) * 0.5, 0.5 + S(a0) * 0.5], [0.5 + C(a1) * 0.5, 0.5 + S(a1) * 0.5]], [F.z, F.z, F.z]);
      }
    });
    return b;
  }

  function paintLens(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(255,255,255,0.0)');
    g.addColorStop(0.3, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.42, 'rgba(255,255,255,0.0)');
    g.addColorStop(0.62, 'rgba(255,255,255,0.0)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.3)');
    g.addColorStop(0.76, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function skirtGap(i, n) {
    const u = (i + 0.5) / n;
    const th = u * PI * 2;
    return th < 0.14 || th > PI * 2 - 0.14;
  }

  function skirtPoint(m, th, f, flare) {
    const sx = S(th), cz = C(th);
    const top = M4.point(m.pelvis, [sx * 0.15, 0.04, 0.006 + cz * 0.115]);
    const hemLocal = [sx * (0.2 + flare * 0.08), -0.56, cz * (0.16 + flare * 0.04) - flare * 0.05];
    const hipL = [D.hipX, D.hipY, 0], hipR = [-D.hipX, D.hipY, 0];
    const viaL = M4.point(m.thighL, V3.sub(hemLocal, hipL));
    const viaR = M4.point(m.thighR, V3.sub(hemLocal, hipR));
    const rest = M4.point(m.pelvis, hemLocal);
    const wL = clamp(0.5 + sx * 1.6, 0, 1);
    const legs = V3.lerp(viaR, viaL, wL);
    const hem = V3.lerp(rest, legs, 0.6);
    const k = f * f * (3 - 2 * f) * 0.35 + f * 0.65;
    const p = V3.lerp(top, hem, k);
    const bulge = S(f * PI) * 0.014;
    const out = M4.dir(m.pelvis, [sx, 0, cz]);
    return V3.add(p, V3.mul(out, bulge));
  }

  function updateSkirt(P, m, flare, tintCol) {
    const [NR, NS] = P.skirtDims;
    const data = P.skirtData;
    const pts = [];
    for (let j = 0; j < NR; j++) {
      const row = [];
      for (let i = 0; i <= NS; i++) row.push(skirtPoint(m, (i / NS) * PI * 2, j / (NR - 1), flare));
      pts.push(row);
    }
    let w = 0;
    const base = rgb(COL.coat), dk = rgb(COL.coatDk);
    for (let j = 0; j < NR; j++) {
      for (let i = 0; i <= NS; i++) {
        const il = i === 0 ? NS - 1 : i - 1, ir = i === NS ? 1 : i + 1;
        const ju = Math.max(0, j - 1), jd = Math.min(NR - 1, j + 1);
        const t = V3.sub(pts[j][ir], pts[j][il]);
        const u = V3.sub(pts[ju][i], pts[jd][i]);
        let n = V3.cross(u, t);
        const len = V3.len(n);
        n = len > 1e-9 ? V3.mul(n, 1 / len) : [0, 0, 1];
        const out = M4.dir(m.pelvis, [S((i / NS) * PI * 2), 0, C((i / NS) * PI * 2)]);
        if (V3.dot(n, out) < 0) n = V3.mul(n, -1);
        const c = j === NR - 1 ? dk : base;
        const p = pts[j][i];
        data.set([p[0], p[1], p[2], n[0], n[1], n[2], c[0], c[1], c[2], 0, i / NS, j / (NR - 1)], w);
        w += 12;
      }
    }
    P.skirt.update(data);
  }

  function frameM(f, extra) {
    const base = new Float32Array([f.x[0], f.x[1], f.x[2], 0, f.y[0], f.y[1], f.y[2], 0, f.z[0], f.z[1], f.z[2], 0, f.c[0], f.c[1], f.c[2], 1]);
    return extra ? M4.mul(base, extra) : base;
  }

  function dynGrid(fx, rings, sides, gap) {
    const m = fx.dyn();
    const idx = [];
    for (let j = 0; j < rings - 1; j++) {
      for (let i = 0; i < sides; i++) {
        const a = j * (sides + 1) + i, bb = a + 1, c = a + sides + 2, d = a + sides + 1;
        if (gap && gap(i, sides)) continue;
        idx.push(a, bb, c, a, c, d);
      }
    }
    m.update(new Float32Array(rings * (sides + 1) * 12), new Uint16Array(idx));
    return m;
  }

  function build(r, fx) {
    const T = headTemplate();
    const head = fx.dyn();
    head.update(new Float32Array(T.nv * 12), T.idx);
    const NECK_SIDES = 20, NECK_RINGS = 8, SK_SIDES = 36, SK_RINGS = 7;
    const mk = (fn) => K.mesh(r, fn);
    return {
      T,
      head,
      headData: new Float32Array(T.nv * 12),
      headPos: new Float32Array(T.nv * 3),
      neck: dynGrid(fx, NECK_RINGS, NECK_SIDES),
      neckData: new Float32Array(NECK_RINGS * (NECK_SIDES + 1) * 12),
      neckDims: [NECK_RINGS, NECK_SIDES],
      skirt: dynGrid(fx, SK_RINGS, SK_SIDES, skirtGap),
      skirtData: new Float32Array(SK_RINGS * (SK_SIDES + 1) * 12),
      skirtDims: [SK_RINGS, SK_SIDES],
      faceTex: r.texture(1024, paintFace, { height: 512, clamp: true }),
      hairTex: r.texture(128, paintHair, {}),
      eyeTex: r.texture(128, paintEye, { clamp: true }),
      lensTex: r.texture(64, paintLens, { clamp: true }),
      labTex: [0, 1, 2].map(level => r.texture(512, (ctx, w, h) => paintTorsoLab(ctx, w, h, level), { height: 512, clamp: true })),
      coatTex: r.texture(512, paintTorsoCoat, { height: 512, clamp: true }),
      eye: mk(buildEyeMesh),
      lidU: mk(b => buildLid(b, true)),
      lidD: mk(b => buildLid(b, false)),
      eyes: EYES,
      teethU: mk(b => buildTeeth(b, false)),
      teethL: mk(b => buildTeeth(b, true)),
      cavityU: mk(b => buildCavity(b, false)),
      cavityL: mk(b => buildCavity(b, true)),
      tongue: mk(b => b.ellipsoid(0.026, 0.008, 0.024, 12, 6, COL.tongue)),
      earL: mk(b => buildEar(b, 'L')),
      earR: mk(b => buildEar(b, 'R')),
      ears: [-1, 1].map(s => { const q = rawPt(s * 1.62, 0.05); return [q[0] + s * 0.002, q[1], q[2] - 0.004]; }),
      lip: basePt(0, lipP(0)),
      hair: mk(buildHair),
      glasses: mk(buildGlasses),
      lenses: mk(buildLenses),
      torso: mk(buildTorso),
      collarLab: mk(b => buildCollar(b, false)),
      collarCoat: mk(b => buildCollar(b, true)),
      straps: mk(buildStraps),
      capsLab: mk(b => buildShoulderCaps(b, COL.shirt)),
      capsCoat: mk(b => buildShoulderCaps(b, COL.coat)),
      hipsLab: mk(b => buildHips(b, false)),
      hipsCoat: mk(b => buildHips(b, true)),
      upperLab: mk(b => buildUpper(b, false)),
      upperCoatL: mk(b => buildUpper(b, true, 'L')),
      upperCoatR: mk(b => buildUpper(b, true, 'R')),
      foreLab: mk(b => buildFore(b, false)),
      foreCoat: mk(b => buildFore(b, true)),
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

  const NECK_TOP = [0, -0.104, -0.026];

  function updateNeck(P, m) {
    const [NR, NS] = P.neckDims;
    const data = P.neckData;
    const bot = M4.mul(m.chest, M4.translate(0, D.neckY - 0.03, -0.006));
    const top = M4.mul(m.head, M4.translate(NECK_TOP[0], NECK_TOP[1], NECK_TOP[2]));
    const shape = [[0.066, 0.06, 0], [0.062, 0.057, 0.004], [0.058, 0.055, 0.008], [0.056, 0.053, 0.01], [0.055, 0.053, 0.012], [0.056, 0.054, 0.012], [0.058, 0.056, 0.011], [0.062, 0.058, 0.01]];
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
        const shade = 0.82 + 0.18 * f;
        data.set([p[0], p[1], p[2], n[0], n[1], n[2], sc[0] * shade, sc[1] * shade, sc[2] * shade, 0, 0, 0], w);
        w += 12;
      }
    }
    P.neck.update(data);
  }

  function drawHead(fx, P, m, F, o, W, tint) {
    const skin = Object.assign({}, SKIN_MAT, tint);
    updateNeck(P, m);
    fx.draw(P.neck, o.pre || null, skin);
    deformHead(P.T, F, { pos: P.headPos, data: P.headData });
    P.head.update(P.headData);
    const H = W(m.head);
    fx.draw(P.head, H, Object.assign({ texture: P.faceTex, backDark: true }, skin));
    const jaw = clamp(F.jaw || 0, 0, 1.2) * 0.3;
    const JM = M4.chain(H, M4.translate(HINGE[0], HINGE[1], HINGE[2]), M4.rotX(jaw), M4.translate(-HINGE[0], -HINGE[1], -HINGE[2]));
    const lip = P.lip;
    const smile = Math.max(F.smileL || 0, F.smileR || 0);
    const wide = clamp((F.wide || 0) + smile * 0.4, 0, 1.2);
    const dark = { rim: 0, spec: [0, 1] };
    fx.draw(P.cavityU, M4.chain(H, M4.translate(0, lip[1] - 0.007, lip[2] - 0.046)), dark);
    fx.draw(P.cavityL, M4.chain(JM, M4.translate(0, lip[1] - 0.014, lip[2] - 0.046)), dark);
    fx.draw(P.tongue, M4.chain(JM, M4.translate(0, lip[1] - 0.022, lip[2] - 0.04)), { rim: 0.1, spec: [0.3, 12] });
    fx.draw(P.teethU, M4.chain(H, M4.translate(0, lip[1] - 0.0045 + wide * 0.002, lip[2] - 0.043)), { spec: [0.5, 24], rim: 0.1 });
    fx.draw(P.teethL, M4.chain(JM, M4.translate(0, lip[1] + 0.0025 - wide * 0.002, lip[2] - 0.045)), { spec: [0.4, 20], rim: 0.1 });
    P.ears.forEach((q, i) => fx.draw(i ? P.earL : P.earR, M4.chain(H, M4.translate(q[0], q[1], q[2])), skin));
    const look = F.look || [0, 0];
    const blink = clamp(F.blink || 0, 0, 1);
    const lidU = F.lidU === undefined ? 0.62 : F.lidU;
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
    fx.draw(P.hair, H, Object.assign({ texture: P.hairTex }, HAIR_MAT, tint));
    if (!o.noGlasses) {
      fx.draw(P.glasses, H, Object.assign({}, FRAME_MAT, tint));
      fx.draw(P.lenses, H, { texture: P.lensTex, additive: true, alpha: o.lensGlint === undefined ? 0.5 : o.lensGlint, noFog: true });
    }
  }

  function draw(fx, P, st) {
    const m = st.m;
    const F = st.face || {};
    const o = st.opts || {};
    const coat = st.outfit === 'coat';
    const pre = o.pre;
    const W = (M) => (pre ? M4.mul(pre, M) : M);
    const tint = o.tint ? { tint: o.tint } : {};
    const cloth = Object.assign({}, CLOTH_MAT, tint);
    const glove = Object.assign({}, GLOVE_MAT, tint);
    if (o.handsOnly) {
      ['L', 'R'].forEach(s => {
        fx.draw(coat ? P.foreCoat : P.foreLab, W(m['fore' + s]), coat ? cloth : glove);
        const hand = st.hands && st.hands[s];
        fx.draw(handMesh(P, s, (hand && hand.pose) || 'relax'), W(hand && hand.M ? hand.M : m['hand' + s]), glove);
      });
      return;
    }
    if (!o.noBody) {
      const torsoTex = coat ? P.coatTex : P.labTex[clamp(st.blood || 0, 0, 2)];
      fx.draw(P.torso, W(m.chest), Object.assign({ texture: torsoTex }, cloth));
      fx.draw(coat ? P.collarCoat : P.collarLab, W(m.chest), cloth);
      fx.draw(coat ? P.capsCoat : P.capsLab, W(m.chest), cloth);
      if (coat) fx.draw(P.straps, W(m.chest), Object.assign({}, cloth, { spec: [0.3, 14] }));
      fx.draw(coat ? P.hipsCoat : P.hipsLab, W(m.pelvis), cloth);
      ['L', 'R'].forEach(s => {
        fx.draw(coat ? (s === 'L' ? P.upperCoatL : P.upperCoatR) : P.upperLab, W(m['upper' + s]), cloth);
        fx.draw(coat ? P.foreCoat : P.foreLab, W(m['fore' + s]), coat ? cloth : glove);
        const hand = st.hands && st.hands[s];
        const HM = hand && hand.M ? hand.M : m['hand' + s];
        fx.draw(handMesh(P, s, (hand && hand.pose) || 'relax'), W(HM), glove);
        if (!o.noLegs) {
          fx.draw(P.thigh, W(m['thigh' + s]), cloth);
          fx.draw(P.shin, W(m['shin' + s]), Object.assign({}, BOOT_MAT, tint));
          fx.draw(P.foot, W(m['foot' + s]), Object.assign({}, BOOT_MAT, tint));
        }
      });
      if (coat && !o.noLegs && !pre) {
        updateSkirt(P, m, st.flare || 0);
        fx.draw(P.skirt, null, Object.assign({ backDark: false }, cloth));
      }
    }
    drawHead(fx, P, m, F, o, W, tint);
  }

  function headPoint(m, local) {
    return M4.point(m.head, local);
  }

  function lensCenters(m) {
    return EYES.map(f => M4.point(m.head, lensFrame(f).c));
  }

  window.MeetMedic = { D, COL, HAND_POSES, CHANNELS, build, solve, draw, handBasis, handMesh, headPoint, lensCenters, lipP, basePt, rawPt, torsoSurf, torsoNormal, EYE_R, NECK_TOP };
})();
