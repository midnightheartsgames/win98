(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Rig = window.YouVidRig;

  const D = { chestY: 0.13, neckY: 0.5, headY: 0.15, shX: 0.19, shY: 0.37, upper: 0.31, fore: 0.29, hipX: 0.1, hipY: -0.05, thigh: 0.45, shin: 0.44 };
  const HEAD_SCALE = M4.scale(1.1, 1.1, 1.1);

  const COL = {
    skin: 0xc68866, skinDk: 0x9c6246, shirt: 0xe4e0d4, shirtDk: 0xbdb8aa, glove: 0x1d1b1c, gloveDk: 0x121112, shoe: 0x1b1818, sole: 0x0f0d0d,
    tongue: 0x9a4a46, paper: 0xf0ece2, filter: 0xc98a4c, ember: 0xff8a30, button: 0x141214, lid: 0xbf8262
  };

  const TEAM = {
    red: { mask: 0x5a2b29, maskCss: '#5a2b29', maskHi: '#74403a', maskDk: '#3a1a18', suit: 0x6c3b2f, suitDk: 0x4c2820, suitHi: 0x8a4e3e, suitCss: '#6c3b2f', stripe: 'rgba(255,214,190,0.09)', tie: 0x7c1f1a, tieCss: '#7c1f1a' },
    blu: { mask: 0x293a66, maskCss: '#293a66', maskHi: '#3e5286', maskDk: '#18233f', suit: 0x37517e, suitDk: 0x25395c, suitHi: 0x4d6a98, suitCss: '#37517e', stripe: 'rgba(205,222,255,0.09)', tie: 0x1d2949, tieCss: '#1d2949' }
  };

  const SKIN_MAT = { spec: [0.12, 9], rim: 1.05 };
  const MASK_MAT = { spec: [0.08, 7], rim: 0.95 };
  const CLOTH_MAT = { spec: [0.07, 6], rim: 0.85 };
  const GLOVE_MAT = { spec: [0.45, 22], rim: 0.7 };
  const SHOE_MAT = { spec: [0.6, 30], rim: 0.6 };
  const EYE_MAT = { spec: [0.9, 60], rim: 0.2 };

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

  const YT = table([[-1.571, -0.106], [-1.25, -0.104], [-1.0, -0.098], [-0.8, -0.089], [-0.62, -0.078], [-0.48, -0.067], [-0.36, -0.056], [-0.3, -0.049], [-0.2, -0.036], [-0.09, -0.02],
    [0.05, 0.0], [0.2, 0.022], [0.33, 0.042], [0.5, 0.063], [0.7, 0.081], [0.95, 0.093], [1.2, 0.1], [1.571, 0.103]]);
  const HW = table([[-1.571, 0.008], [-1.35, 0.026], [-1.25, 0.03], [-1.0, 0.037], [-0.8, 0.044], [-0.62, 0.05], [-0.48, 0.055], [-0.3, 0.06], [-0.2, 0.063], [-0.09, 0.066],
    [0.05, 0.069], [0.2, 0.071], [0.33, 0.072], [0.5, 0.07], [0.7, 0.064], [0.95, 0.05], [1.2, 0.032], [1.571, 0.0]]);
  const DF = table([[-1.571, 0.012], [-1.4, 0.05], [-1.25, 0.078], [-1.0, 0.098], [-0.8, 0.104], [-0.62, 0.098], [-0.48, 0.09], [-0.33, 0.088], [-0.2, 0.089], [-0.08, 0.089],
    [0.05, 0.088], [0.2, 0.086], [0.33, 0.09], [0.5, 0.087], [0.7, 0.077], [0.95, 0.06], [1.2, 0.04], [1.571, 0.0]]);
  const DB = table([[-1.571, 0.008], [-1.3, 0.03], [-1.1, 0.046], [-0.6, 0.07], [-0.2, 0.088], [0.2, 0.1], [0.6, 0.094], [0.95, 0.07], [1.25, 0.043], [1.571, 0.0]]);

  const NU = 72, NL = 16, NUP = 30, MW = 0.46;
  const HINGE = [0, -0.026, -0.012];
  const EYE_R = 0.0118;
  const CHANNELS = ['browDown', 'browUp', 'browInUp', 'smileL', 'smileR', 'frown', 'wide', 'round', 'sneer'];

  const g2 = (x, s) => Math.exp(-(x / s) * (x / s));
  const smooth = (e0, e1, x) => { const k = clamp((x - e0) / (e1 - e0), 0, 1); return k * k * (3 - 2 * k); };

  function lipP(a) {
    const q = a / 0.46;
    return -0.36 + 0.008 * Math.min(q * q, 1.6);
  }

  const EYE_HOLE = [[0.072, 0.35], [0.2, 0.372], [0.38, 0.378], [0.56, 0.366], [0.74, 0.335], [0.87, 0.28], [0.92, 0.2], [0.88, 0.13], [0.74, 0.085], [0.56, 0.055],
    [0.38, 0.03], [0.25, 0.01], [0.16, -0.02], [0.122, 0.05], [0.104, 0.14], [0.09, 0.23], [0.078, 0.3]];
  const MOUTH_HALF = [[0, -0.15], [0.2, -0.156], [0.42, -0.18], [0.6, -0.24], [0.7, -0.33], [0.7, -0.45], [0.6, -0.58], [0.42, -0.68], [0.2, -0.74], [0, -0.76]];

  function mirrorLoop(half) {
    const right = half.slice();
    const left = half.slice(1, -1).reverse().map(([a, p]) => [-a, p]);
    return right.concat(left);
  }

  const HOLES = [EYE_HOLE, EYE_HOLE.map(([a, p]) => [-a, p]).reverse(), mirrorLoop(MOUTH_HALF)];

  function insidePoly(poly, a, p) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [ai, pi] = poly[i], [aj, pj] = poly[j];
      if ((pi > p) !== (pj > p) && a < (aj - ai) * (p - pi) / (pj - pi) + ai) inside = !inside;
    }
    return inside;
  }

  function polyDist(poly, a, p) {
    let d = 1e9;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [ax, ay] = poly[j], [bx, by] = poly[i];
      const dx = bx - ax, dy = by - ay;
      const t = clamp(((a - ax) * dx + (p - ay) * dy) / (dx * dx + dy * dy), 0, 1);
      d = Math.min(d, Math.hypot(a - ax - dx * t, p - ay - dy * t));
    }
    return d;
  }

  function holeDepth(a, p) {
    let v = 0;
    HOLES.forEach(poly => {
      const d = polyDist(poly, a, p);
      if (insidePoly(poly, a, p)) v = Math.max(v, smooth(0, 0.035, d));
    });
    return v;
  }

  function maskRoll(a, p) {
    let v = 0;
    HOLES.forEach(poly => {
      if (insidePoly(poly, a, p)) return;
      v = Math.max(v, g2(polyDist(poly, a, p) - 0.012, 0.014));
    });
    return v;
  }

  function yawAt(i) {
    const s = 2 * i / NU - 1;
    return PI * Math.sign(s) * Math.pow(Math.abs(s), 1.35);
  }

  function squircle(p) {
    return 0.1 * smooth(-1.05, -0.65, p) * (1 - smooth(0.4, 0.8, p));
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
    const down = clamp((0.32 - p) / 0.45, 0, 1);
    h += (0.004 + 0.024 * down) * g2(a, 0.058 + 0.03 * down) * smooth(-0.17, -0.1, p) * (1 - smooth(0.28, 0.36, p));
    h += 0.008 * g2(a, 0.085) * g2(p + 0.095, 0.05);
    h += 0.0035 * g2(A - 0.11, 0.04) * g2(p + 0.125, 0.03);
    h -= 0.0025 * g2(a, 0.035) * g2(p + 0.22, 0.04);
    h += 0.0075 * g2(A - 0.3, 0.2) * g2(p - 0.35, 0.05);
    h += 0.003 * g2(a, 0.09) * g2(p - 0.32, 0.05);
    h -= 0.0042 * g2(A - 0.34, 0.12) * g2(p - 0.2, 0.08);
    h += 0.0095 * g2(A - 0.6, 0.16) * g2(p - 0.07, 0.08);
    h -= 0.0065 * g2(A - 0.6, 0.18) * g2(p + 0.24, 0.12);
    h -= 0.002 * g2(segDist(A, p, 0.15, -0.18, MW, lipP(MW) - 0.01), 0.025);
    h += 0.0022 * g2(dl - 0.022, 0.022) * (1 - smooth(MW, MW + 0.08, A));
    h += 0.0032 * g2(dl + 0.03, 0.026) * g2(a, 0.3);
    h -= 0.004 * g2(dl + 0.08, 0.03) * g2(a, 0.3);
    h += 0.012 * g2(a, 0.34) * g2(p + 0.8, 0.14);
    h -= 0.0025 * g2(a, 0.03) * g2(p + 0.8, 0.08);
    h += 0.005 * g2(A - 1.0, 0.25) * g2(p + 0.55, 0.14);
    h -= 0.004 * g2(A - 1.0, 0.2) * g2(p - 0.35, 0.15);
    h -= 0.0016 * holeDepth(a, p);
    h += 0.0007 * maskRoll(a, p);
    return h;
  }

  function eyeFrame(s) {
    const a = s * 0.34, p = 0.215;
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
      const e = Math.sqrt((psi / 1.15) * (psi / 1.15) + (phi / 0.66) * (phi / 0.66));
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
    const gB = g2(A - 0.3, 0.2) * g2(p - 0.335, 0.1) * smooth(0.22, 0.3, p);
    const gG = g2(a, 0.07) * g2(p - 0.3, 0.06);
    out.browDown = [-sg * 0.003 * gB, -0.0078 * gB, 0.0025 * gB - 0.0025 * gG];
    const gU = g2(A - 0.3, 0.26) * g2(p - 0.39, 0.13);
    out.browUp = [0, 0.0095 * gU, -0.001 * gU];
    const gI = g2(A - 0.12, 0.11) * g2(p - 0.345, 0.08);
    out.browInUp = [0, 0.0075 * gI, 0];
    const gC = g2(A - MW, 0.12) * g2(dl, 0.08);
    const gK = g2(A - 0.48, 0.15) * g2(p + 0.15, 0.1);
    const gL = g2(A - 0.32, 0.14) * g2(p - 0.13, 0.05);
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
    out.frown = [0, -0.0085 * gF, 0];
    const gUp = g2(dl - 0.025, 0.035) * inMouth;
    const gLo = g2(dl + 0.03, 0.04) * inMouth;
    out.wide = [sg * 0.007 * gC, 0.006 * gUp - 0.007 * gLo, 0.001 * gLo - 0.003 * gC];
    const gR = g2(dl, 0.08) * (1 - smooth(MW, MW + 0.12, A));
    const x0 = rawPt(a, p)[0];
    out.round = [-x0 * 0.33 * gR, 0, 0.008 * gR];
    const gS = g2(A - 0.13, 0.08) * g2(p + 0.13, 0.07);
    out.sneer = [0, 0.005 * gS + 0.0025 * gUp, 0.001 * gS];
    return out;
  }

  function jawWeight(a, p, lower) {
    if (!lower) return 0;
    const A = Math.abs(a);
    const side = (1 - smooth(1.0, 1.7, A)) * smooth(-1.35, -0.8, p);
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
        if (nx * px + ny * (py + 0.055) + nz * (pz + 0.01) < 0) { nx = -nx; ny = -ny; nz = -nz; }
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

  function paintFace(ctx, W, H, team) {
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
    const loop = (poly) => {
      const n = poly.length;
      const mid = (i) => { const q0 = P(...poly[i % n]), q1 = P(...poly[(i + 1) % n]); return [(q0[0] + q1[0]) / 2, (q0[1] + q1[1]) / 2]; };
      ctx.beginPath();
      ctx.moveTo(...mid(0));
      for (let i = 1; i <= n; i++) {
        const c = P(...poly[i % n]);
        const m = mid(i);
        ctx.quadraticCurveTo(c[0], c[1], m[0], m[1]);
      }
      ctx.closePath();
    };
    ctx.fillStyle = team.maskCss;
    ctx.fillRect(0, 0, W, H);
    const vg = ctx.createLinearGradient(0, 0, 0, H);
    vg.addColorStop(0, team.maskHi);
    vg.addColorStop(0.35, team.maskCss);
    vg.addColorStop(1, team.maskDk);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    const g = rand(23);
    for (let i = 0; i < 12000; i++) {
      ctx.fillStyle = `rgba(${g() < 0.5 ? '0,0,0' : '255,255,255'},${g() * 0.05})`;
      ctx.fillRect(g() * W, g() * H, 2, 1);
    }
    line([[PI - 0.002, 1.5], [PI - 0.002, -1.4]], 3, 'rgba(0,0,0,0.25)');
    line([[-PI + 0.002, 1.5], [-PI + 0.002, -1.4]], 3, 'rgba(0,0,0,0.25)');
    [-1, 1].forEach(s => blob(s * 0.12, -0.05, 0.08, 0.12, '255,255,255', 0.06));
    ctx.save();
    HOLES.forEach(poly => { loop(poly); ctx.fillStyle = '#c68866'; ctx.fill(); });
    ctx.beginPath();
    HOLES.forEach(poly => {
      const n = poly.length;
      const q0 = P(...poly[0]);
      ctx.moveTo(q0[0], q0[1]);
      for (let i = 1; i <= n; i++) ctx.lineTo(...P(...poly[i % n]));
    });
    ctx.clip();
    const sg = ctx.createLinearGradient(0, P(0, 0.4)[1], 0, P(0, -0.6)[1]);
    sg.addColorStop(0, 'rgba(236,176,136,0.35)');
    sg.addColorStop(0.45, 'rgba(236,176,136,0)');
    sg.addColorStop(1, 'rgba(110,58,40,0.3)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W, H);
    [-1, 1].forEach(s => {
      blob(s * 0.34, 0.205, 0.15, 0.07, '110,58,40', 0.4);
      blob(s * 0.46, 0.12, 0.16, 0.05, '120,64,46', 0.3);
      blob(s * 0.8, 0.22, 0.1, 0.1, '150,84,62', 0.35);
      blob(s * 0.16, 0.12, 0.05, 0.08, '96,50,36', 0.35);
      const brow = [];
      for (let i = 0; i <= 12; i++) {
        const k = i / 12;
        brow.push([s * lerp(0.1, 0.58, k), 0.322 + 0.03 * S(k * PI * 0.9) - 0.03 * (1 - k) + 0.012 * k]);
      }
      line(brow, 9, 'rgba(70,40,28,0.45)');
      line(brow, 5.5, 'rgba(46,26,18,0.95)');
      line([[s * 0.5, 0.16], [s * 0.6, 0.14], [s * 0.66, 0.15]], 1.6, 'rgba(110,60,42,0.4)');
      line([[s * 0.55, 0.205], [s * 0.66, 0.2]], 1.4, 'rgba(110,60,42,0.35)');
      line([[s * 0.2, 0.135], [s * 0.3, 0.12], [s * 0.42, 0.125]], 1.8, 'rgba(110,60,42,0.35)');
      ctx.strokeStyle = 'rgba(110,56,40,0.3)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(...P(s * 0.16, -0.19));
      ctx.quadraticCurveTo(...P(s * 0.3, -0.24), ...P(s * MW, lipP(MW) - 0.015));
      ctx.stroke();
    });
    blob(0, -0.47, 0.22, 0.05, '110,58,40', 0.3);
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = lerp(-MW - 0.02, MW + 0.02, i / 40);
      const [x, y] = P(a, lipP(a) + 0.004);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for (let i = 40; i >= 0; i--) {
      const a = lerp(-MW - 0.02, MW + 0.02, i / 40);
      const k = 1 - Math.pow(Math.abs(a) / (MW + 0.02), 2);
      ctx.lineTo(...P(a, lipP(a) - 0.005 - 0.034 * k));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(170,92,76,0.55)';
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
      ctx.lineTo(...P(a, lipP(a) + 0.006 + 0.016 * k));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(150,80,66,0.5)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56,24,18,0.95)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = lerp(-MW, MW, i / 40);
      const [x, y] = P(a, lipP(a));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    HOLES.forEach(poly => {
      loop(poly);
      ctx.strokeStyle = 'rgba(0,0,0,0.42)';
      ctx.lineWidth = 6;
      ctx.stroke();
      loop(poly);
      ctx.strokeStyle = team.maskHi;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  function paintEye(ctx, W, H) {
    ctx.fillStyle = '#e6e0d8';
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = W * 0.34;
    const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
    g.addColorStop(0, '#c8d6dc');
    g.addColorStop(0.6, '#8ea6b4');
    g.addColorStop(0.92, '#4c6474');
    g.addColorStop(1, '#2a3a46');
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
    [-0.15, 0.13, 0.1, 0.0], [-0.06, 0.134, 0.104, 0.004], [0.04, 0.142, 0.108, 0.008], [0.14, 0.156, 0.114, 0.012], [0.24, 0.176, 0.116, 0.012],
    [0.32, 0.194, 0.112, 0.006], [0.37, 0.194, 0.104, -0.002], [0.405, 0.172, 0.094, -0.006], [0.435, 0.134, 0.08, -0.008], [0.46, 0.094, 0.07, -0.004], [0.48, 0.068, 0.06, 0.0]
  ].map(([y, rx, rz, cz]) => ({ y, rx, rz, cz }));
  const V_TOP = 0.47, V_BOT = 0.12;

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

  function vHalf(y) {
    return 0.52 * clamp((y - V_BOT) / (V_TOP - V_BOT), 0, 1);
  }

  function paintSuit(ctx, W, H, team) {
    const y0 = TORSO[0].y, y1 = TORSO[TORSO.length - 1].y;
    const Y = (y) => (1 - (y - y0) / (y1 - y0)) * H;
    const U = (ang) => ((ang + PI) / (2 * PI)) * W;
    ctx.fillStyle = team.suitCss;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = team.stripe;
    ctx.lineWidth = 1.2;
    for (let x = 0; x < W; x += W / 96) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    const fold = ctx.createLinearGradient(0, 0, W, 0);
    fold.addColorStop(0, 'rgba(0,0,0,0.18)');
    fold.addColorStop(0.5, 'rgba(255,255,255,0.04)');
    fold.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = fold;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e4e0d4';
    ctx.beginPath();
    ctx.moveTo(U(0), Y(V_BOT));
    for (let i = 0; i <= 12; i++) {
      const y = lerp(V_BOT, y1 + 0.01, i / 12);
      ctx.lineTo(U(vHalf(y)), Y(y));
    }
    for (let i = 12; i >= 0; i--) {
      const y = lerp(V_BOT, y1 + 0.01, i / 12);
      ctx.lineTo(U(-vHalf(y)), Y(y));
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(120,110,96,0.25)';
    ctx.fillRect(U(-0.02), Y(y1), U(0.02) - U(-0.02), Y(V_BOT) - Y(y1));
    ctx.fillStyle = team.tieCss;
    ctx.beginPath();
    ctx.moveTo(U(-0.05), Y(0.46));
    ctx.lineTo(U(0.05), Y(0.46));
    ctx.lineTo(U(0.075), Y(0.2));
    ctx.lineTo(U(0), Y(V_BOT + 0.01));
    ctx.lineTo(U(-0.075), Y(0.2));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(U(0), Y(V_BOT));
    ctx.lineTo(U(0), Y(y0));
    ctx.stroke();
    [[-0.85, 0.02], [0.85, 0.02]].forEach(([a, y]) => {
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(U(a) - W * 0.045, Y(y) - 2, W * 0.09, 4);
    });
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(U(0.75) - W * 0.03, Y(0.3) - 1.5, W * 0.06, 3);
    const g = rand(9);
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = `rgba(${g() < 0.5 ? '0,0,0' : '255,255,255'},${g() * 0.04})`;
      ctx.fillRect(g() * W, g() * H, 2, 2);
    }
  }

  function paintCloth(ctx, W, H, team) {
    ctx.fillStyle = team.suitCss;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = team.stripe;
    ctx.lineWidth = 1.2;
    for (let x = 0; x < W; x += W / 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
  }

  function paintSkirt(ctx, W, H, team) {
    paintCloth(ctx, W, H, team);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    [0, W].forEach(x0 => {
      ctx.beginPath();
      ctx.moveTo(x0, H);
      ctx.lineTo(x0 + (x0 ? -1 : 1) * W * 0.004, H * 0.92);
      ctx.lineTo(x0 + (x0 ? -1 : 1) * W * 0.085, 0);
      ctx.lineTo(x0, 0);
      ctx.closePath();
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, W, H * 0.06);
  }

  function buildTorso(b) {
    ringLoft(b, TORSO, 32, null, {});
    return b;
  }

  function buildLapels(b, team) {
    [-1, 1].forEach(s => {
      const n = 14;
      const inner = [], outer = [];
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        const y = lerp(V_BOT, V_TOP - 0.012, k);
        const a = vHalf(y) + 0.004;
        const notch = k > 0.72 && k < 0.8 ? 0.6 : 1;
        const w = (0.05 + 0.32 * Math.pow(k, 1.3)) * notch * (k > 0.92 ? lerp(1, 0.55, (k - 0.92) / 0.08) : 1);
        inner.push(torsoSurf(s * a, y, 0.006));
        outer.push(torsoSurf(s * (a + w), y, 0.003));
      }
      for (let i = 0; i < n; i++) {
        const ni = torsoNormal(s * vHalf(inner[i][1]), inner[i][1]);
        const quad = s > 0 ? [inner[i], outer[i], outer[i + 1], inner[i + 1]] : [outer[i], inner[i], inner[i + 1], outer[i + 1]];
        b.quad(quad[0], quad[1], quad[2], quad[3], team.suitHi, null, [ni, ni, ni, ni]);
        const edge0 = inner[i], edge1 = inner[i + 1];
        const back0 = V3.sub(edge0, V3.mul(ni, 0.005)), back1 = V3.sub(edge1, V3.mul(ni, 0.005));
        b.quad(edge0, edge1, back1, back0, team.suitDk);
      }
    });
    [0.1, 0.02].forEach(y => {
      const p = torsoSurf(0.02, y, 0.006);
      const n = torsoNormal(0.02, y);
      b.push(M4.translate(p[0], p[1], p[2]), M4.rotY(Math.atan2(n[0], n[2])), M4.rotX(PI / 2));
      b.prism(10, 0.009, 0.009, 0, 0.008, 0.008, 0.004, COL.button);
      b.pop();
    });
    return b;
  }

  function buildCollar(b, team) {
    const shirt = [{ y: 0.448, rx: 0.077, rz: 0.069, cz: 0.0 }, { y: 0.47, rx: 0.07, rz: 0.064, cz: 0.0 }, { y: 0.5, rx: 0.066, rz: 0.06, cz: -0.002 }];
    ringLoft(b, shirt, 24, (u, y) => (y > 0.49 ? COL.shirtDk : COL.shirt), {});
    const fwd = [[0, 0.25, 1], [0, 0.25, 1], [0, 0.25, 1]];
    [-1, 1].forEach(s => b.tri([s * 0.008, 0.498, 0.064], [s * 0.056, 0.492, 0.044], [s * 0.03, 0.442, 0.073], COL.shirt, null, fwd));
    b.at(0, 0.455, 0.068, h => h.box(0.026, 0.026, 0.016, team.tie));
    const back = [{ y: 0.45, rx: 0.084, rz: 0.075, cz: -0.003 }, { y: 0.49, rx: 0.077, rz: 0.069, cz: -0.006 }, { y: 0.512, rx: 0.074, rz: 0.066, cz: -0.008 }];
    ringLoft(b, back, 24, () => team.suit, { skip: (u) => u > 0.3 && u < 0.7 });
    return b;
  }

  function buildShoulderCaps(b, team) {
    [-1, 1].forEach(s => {
      b.at(s * D.shX, D.shY + 0.002, -0.01, h => h.ellipsoid(0.05, 0.05, 0.052, 16, 10, team.suit));
    });
    return b;
  }

  function limbRings(len, keys) {
    return keys.map(([f, r, rz, cz]) => ({ y: -len * f, rx: r, rz: rz || r, cz: cz || 0 })).reverse();
  }

  function buildUpper(b, team) {
    const len = D.upper;
    const rings = limbRings(len, [[-0.14, 0.046], [0, 0.056, 0.057], [0.2, 0.054, 0.056, 0.003], [0.5, 0.05, 0.052, 0.003], [0.8, 0.046, 0.048, 0.002], [1.0, 0.043, 0.045], [1.08, 0.04, 0.042]]);
    ringLoft(b, rings, 16, () => team.suit, {});
    return b;
  }

  function buildFore(b, team) {
    const len = D.fore;
    const rings = limbRings(len, [[-0.1, 0.04], [0, 0.042], [0.3, 0.041, 0.039, 0.002], [0.6, 0.039, 0.037], [0.84, 0.038, 0.036], [0.845, 0.031, 0.03], [0.92, 0.031, 0.03],
      [0.925, 0.029, 0.027], [1.06, 0.028, 0.026]]);
    const col = (u, y) => {
      const f = -y / len;
      if (f < 0.842) return team.suit;
      return f < 0.922 ? COL.shirt : COL.glove;
    };
    ringLoft(b, rings, 14, col, { capTop: true, capBottom: true });
    const cuff = limbRings(len, [[0.85, 0.04, 0.038], [0.83, 0.04, 0.038]]);
    ringLoft(b, cuff, 14, () => team.suitDk, {});
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
    pinch: { curl: [0.45, 0.85, 0.95, 1], spread: 0.05, thumb: [0.75, 0.45] },
    cig: { curl: [0.32, 0.38, 0.85, 0.95], spread: 0.05, thumb: [0.55, 0.3] },
    knife: { curl: [0.8, 0.85, 0.88, 0.9], spread: 0.02, thumb: [0.4, 0.75] }
  };

  function palm(b) {
    const rows = [[0.012, 0.038, 0.024], [-0.02, 0.044, 0.026], [-0.06, 0.047, 0.023], [-0.094, 0.045, 0.019], [-0.106, 0.04, 0.015]];
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
    const xs = [0.03, 0.0105, -0.0095, -0.028];
    const lens = [0.09, 0.096, 0.09, 0.072];
    const rads = [0.0098, 0.0104, 0.0098, 0.0088];
    const spreads = [0.13, 0.03, -0.06, -0.16];
    xs.forEach((x, f) => {
      const c = pose.curl[f];
      const L = lens[f], r = rads[f];
      const l1 = L * 0.44, l2 = L * 0.31, l3 = L * 0.25;
      b.push(M4.translate(k * x, -0.098 + Math.abs(x) * 0.12, 0.002), M4.rotZ(k * spreads[f] * (0.4 + pose.spread)), M4.rotX(-(c * 1.45 + 0.06)));
      b.at(0, 0, 0, h => h.ellipsoid(r * 1.2, r * 1.12, r * 1.08, 8, 5, COL.glove));
      fingerSegment(b, l1, r, r * 0.97, COL.glove);
      b.push(M4.translate(0, -l1, 0), M4.rotX(-c * 1.65));
      fingerSegment(b, l2, r * 0.97, r * 0.92, COL.glove);
      b.push(M4.translate(0, -l2, 0), M4.rotX(-c * 1.05));
      fingerSegment(b, l3, r * 0.92, r * 0.8, COL.glove);
      b.pop();
      b.pop();
      b.pop();
    });
    const [ab, tc] = pose.thumb;
    b.push(M4.translate(k * 0.038, -0.028, 0.011), M4.rotY(k * (0.35 + ab * 0.5)), M4.rotZ(k * (0.55 + ab * 0.45)), M4.rotX(-0.3 - ab * 0.4));
    b.at(0, 0, 0, h => h.ellipsoid(0.015, 0.018, 0.014, 8, 5, COL.glove));
    fingerSegment(b, 0.034, 0.013, 0.0125, COL.glove);
    b.push(M4.translate(0, -0.034, 0), M4.rotX(-tc * 0.9));
    fingerSegment(b, 0.028, 0.0125, 0.012, COL.glove);
    b.push(M4.translate(0, -0.028, 0), M4.rotX(-tc * 0.8));
    fingerSegment(b, 0.024, 0.012, 0.0105, COL.glove);
    b.pop();
    b.pop();
    b.pop();
    return b;
  }

  function buildThigh(b, team) {
    const len = D.thigh;
    ringLoft(b, limbRings(len, [[-0.15, 0.074], [0, 0.077, 0.08], [0.4, 0.068, 0.07], [0.8, 0.058, 0.06], [1.0, 0.054, 0.055], [1.08, 0.052, 0.052]]), 14, () => team.suit, { capTop: true, capBottom: true });
    return b;
  }

  function buildShin(b, team) {
    const len = D.shin;
    const col = (u, y) => (-y / len > 0.94 ? COL.shoe : team.suit);
    ringLoft(b, limbRings(len, [[-0.06, 0.054], [0.1, 0.054], [0.4, 0.052], [0.7, 0.05], [0.9, 0.05], [0.94, 0.05], [0.945, 0.04], [1.04, 0.038]]), 14, col, { capTop: true, capBottom: true });
    return b;
  }

  function buildFoot(b) {
    b.at(0, -0.022, 0.06, h => h.ellipsoid(0.044, 0.036, 0.13, 14, 8, COL.shoe));
    b.at(0, -0.052, 0.06, h => h.box(0.09, 0.016, 0.27, COL.sole));
    b.at(0, -0.04, 0.17, h => h.ellipsoid(0.04, 0.022, 0.05, 10, 6, COL.shoe));
    b.at(0, 0.008, -0.004, h => h.prism(12, 0.042, 0.042, -0.045, 0.04, 0.04, 0.03, COL.shoe));
    return b;
  }

  function buildHips(b, team) {
    const rings = [
      { y: -0.2, rx: 0.12, rz: 0.1, cz: -0.006 },
      { y: -0.1, rx: 0.14, rz: 0.108, cz: 0.0 },
      { y: 0.0, rx: 0.14, rz: 0.106, cz: 0.004 },
      { y: 0.06, rx: 0.136, rz: 0.104, cz: 0.006 }
    ];
    ringLoft(b, rings, 20, () => team.suit, { capBottom: true });
    [-1, 1].forEach(s => b.at(s * 0.08, -0.08, 0.0, h => h.ellipsoid(0.084, 0.095, 0.094, 12, 8, team.suit)));
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
          return rgb(atEdge ? 0x24120c : COL.lid);
        });
        b.quad(q[0].p, q[1].p, q[2].p, q[3].p, cols, null, q.map(v => v.n));
      }
    }
    return b;
  }

  function buildTeeth(b, lower) {
    const n = 12;
    const R = 0.03, h = 0.01;
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
          return [S(y) * C(p) * 0.04, S(p) * 0.027, C(y) * C(p) * 0.026];
        };
        const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
        const shade = q.map(v => rgb([0.17 + v[2] * 1.5, 0.05 + v[2] * 0.4, 0.045 + v[2] * 0.3], 0.35));
        b.quad(q[0], q[1], q[2], q[3], shade, null, q.map(v => V3.norm(V3.mul(v, -1))));
      }
    }
    return b;
  }

  function buildEar(b, side, team) {
    const k = side === 'L' ? 1 : -1;
    b.push(M4.rotY(k * 0.3), M4.rotZ(-k * 0.08));
    b.ellipsoid(0.008, 0.024, 0.016, 12, 9, team.mask);
    b.at(k * 0.002, 0.001, 0.002, h => h.ellipsoid(0.006, 0.016, 0.01, 10, 7, team.mask));
    b.pop();
    return b;
  }

  function buildCig(b) {
    b.push(M4.rotX(PI / 2));
    b.prism(10, 0.0036, 0.0036, 0, 0.0036, 0.0036, 0.016, COL.filter, { capBottom: true, capTop: false });
    b.prism(10, 0.0036, 0.0036, 0.016, 0.0036, 0.0036, 0.07, COL.paper, { capTop: false });
    b.prism(10, 0.0036, 0.0036, 0.07, 0.0034, 0.0034, 0.075, rgb(COL.ember, 1));
    b.pop();
    return b;
  }

  function eyeFrames() {
    return EYES;
  }

  function frameM(f, extra) {
    const base = new Float32Array([f.x[0], f.x[1], f.x[2], 0, f.y[0], f.y[1], f.y[2], 0, f.z[0], f.z[1], f.z[2], 0, f.c[0], f.c[1], f.c[2], 1]);
    return extra ? M4.mul(base, extra) : base;
  }

  const SKIRT = [10, 24];

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
    const [SR, SS] = SKIRT;
    const skirt = fx.dyn();
    const sIdx = [];
    for (let j = 0; j < SR - 1; j++) {
      for (let i = 0; i < SS; i++) {
        const a = j * (SS + 1) + i, b = a + 1, c = a + SS + 2, d = a + SS + 1;
        sIdx.push(a, b, c, a, c, d);
      }
    }
    skirt.update(new Float32Array(SR * (SS + 1) * 12), new Uint16Array(sIdx));
    const mk = (fn) => K.mesh(r, fn);
    return {
      T,
      team,
      head,
      headData: new Float32Array(T.nv * 12),
      headPos: new Float32Array(T.nv * 3),
      neck,
      neckData: new Float32Array(NECK_RINGS * (NECK_SIDES + 1) * 12),
      neckDims: [NECK_RINGS, NECK_SIDES],
      skirt,
      skirtData: new Float32Array(SR * (SS + 1) * 12),
      faceTex: r.texture(1024, (ctx, w, h) => paintFace(ctx, w, h, team), { height: 512, clamp: true }),
      eyeTex: r.texture(128, paintEye, { clamp: true }),
      suitTex: r.texture(512, (ctx, w, h) => paintSuit(ctx, w, h, team), { height: 512, clamp: true }),
      clothTex: r.texture(128, (ctx, w, h) => paintCloth(ctx, w, h, team), {}),
      skirtTex: r.texture(512, (ctx, w, h) => paintSkirt(ctx, w, h, team), { height: 128, clamp: true }),
      eye: mk(buildEyeMesh),
      lidU: mk(b => buildLid(b, true)),
      lidD: mk(b => buildLid(b, false)),
      eyes: eyeFrames(),
      teethU: mk(b => buildTeeth(b, false)),
      teethL: mk(b => buildTeeth(b, true)),
      cavityU: mk(b => buildCavity(b, false)),
      cavityL: mk(b => buildCavity(b, true)),
      tongue: mk(b => b.ellipsoid(0.02, 0.007, 0.018, 12, 6, COL.tongue)),
      earL: mk(b => buildEar(b, 'L', team)),
      earR: mk(b => buildEar(b, 'R', team)),
      ears: [-1, 1].map(s => { const q = rawPt(s * 1.55, 0.1); return [q[0] - s * 0.002, q[1] - 0.004, q[2] - 0.008]; }),
      lip: basePt(0, lipP(0)),
      cig: mk(buildCig),
      torso: mk(buildTorso),
      lapels: mk(b => buildLapels(b, team)),
      collar: mk(b => buildCollar(b, team)),
      caps: mk(b => buildShoulderCaps(b, team)),
      hips: mk(b => buildHips(b, team)),
      upper: mk(b => buildUpper(b, team)),
      fore: mk(b => buildFore(b, team)),
      thigh: mk(b => buildThigh(b, team)),
      shin: mk(b => buildShin(b, team)),
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
    const bot = M4.mul(m.chest, M4.translate(0, D.neckY - 0.04, -0.006));
    const top = M4.chain(m.head, HEAD_SCALE, M4.translate(0, -0.085, -0.016));
    const shape = [[0.07, 0.064, 0], [0.067, 0.061, 0.004], [0.064, 0.059, 0.008], [0.062, 0.058, 0.01], [0.061, 0.057, 0.012], [0.061, 0.057, 0.012], [0.062, 0.058, 0.011], [0.064, 0.059, 0.01]];
    const ax = (M, c) => [M[c * 4], M[c * 4 + 1], M[c * 4 + 2]];
    const mc = rgb(P.team.mask);
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
        const shade = 0.82 + 0.18 * f;
        data.set([p[0], p[1], p[2], n[0], n[1], n[2], mc[0] * shade, mc[1] * shade, mc[2] * shade, 0, 0, 0], w);
        w += 12;
      }
    }
    P.neck.update(data);
  }

  function skirtPoint(m, th, f) {
    const sx = S(th), cz = C(th);
    const top = M4.point(m.pelvis, [sx * 0.15, 0.04, 0.006 + cz * 0.118]);
    const hemLocal = [sx * 0.17, -0.2, cz * 0.135 + 0.01];
    const hipL = [D.hipX, D.hipY, 0], hipR = [-D.hipX, D.hipY, 0];
    const viaL = M4.point(m.thighL, V3.sub(hemLocal, hipL));
    const viaR = M4.point(m.thighR, V3.sub(hemLocal, hipR));
    const rest = M4.point(m.pelvis, hemLocal);
    const wL = clamp(0.5 + sx * 1.6, 0, 1);
    const legs = V3.lerp(viaR, viaL, wL);
    const hem = V3.lerp(rest, legs, 0.6);
    const k = f * f * (3 - 2 * f) * 0.3 + f * 0.7;
    const p = V3.lerp(top, hem, k);
    const out = M4.dir(m.pelvis, [sx, 0, cz]);
    return V3.add(p, V3.mul(out, S(f * PI) * 0.01));
  }

  function updateSkirt(P, m) {
    const [NR, NS] = SKIRT;
    const data = P.skirtData;
    const pts = [];
    for (let j = 0; j < NR; j++) {
      const row = [];
      for (let i = 0; i <= NS; i++) row.push(skirtPoint(m, (i / NS) * PI * 2, j / (NR - 1)));
      pts.push(row);
    }
    let w = 0;
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
        const p = pts[j][i];
        data.set([p[0], p[1], p[2], n[0], n[1], n[2], 1, 1, 1, 0, i / NS, j / (NR - 1)], w);
        w += 12;
      }
    }
    P.skirt.update(data);
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
    const glove = Object.assign({}, GLOVE_MAT, tint);
    if (!o.noBody) {
      fx.draw(P.torso, W(m.chest), Object.assign({ texture: P.suitTex }, cloth));
      fx.draw(P.lapels, W(m.chest), cloth);
      fx.draw(P.collar, W(m.chest), cloth);
      fx.draw(P.caps, W(m.chest), cloth);
      ['L', 'R'].forEach(s => {
        fx.draw(P.upper, W(m['upper' + s]), Object.assign({ texture: P.clothTex }, cloth));
        fx.draw(P.fore, W(m['fore' + s]), cloth);
        const hand = st.hands && st.hands[s];
        const HM = hand && hand.M ? hand.M : m['hand' + s];
        fx.draw(handMesh(P, s, (hand && hand.pose) || 'relax'), W(HM), glove);
        if (!o.noLegs) {
          fx.draw(P.thigh, W(m['thigh' + s]), Object.assign({ texture: P.clothTex }, cloth));
          fx.draw(P.shin, W(m['shin' + s]), cloth);
          fx.draw(P.foot, W(m['foot' + s]), Object.assign({}, SHOE_MAT, tint));
        }
      });
      if (!o.noLegs) {
        fx.draw(P.hips, W(m.pelvis), cloth);
        if (!pre) {
          updateSkirt(P, m);
          fx.draw(P.skirt, null, Object.assign({ texture: P.skirtTex }, cloth));
        }
      }
    }
    if (o.noHead) return;
    updateNeck(P, m);
    fx.draw(P.neck, pre || null, Object.assign({}, MASK_MAT, tint));
    deformHead(P.T, F, { pos: P.headPos, data: P.headData });
    P.head.update(P.headData);
    const H = M4.mul(W(m.head), HEAD_SCALE);
    fx.draw(P.head, H, Object.assign({ texture: P.faceTex, backDark: true }, MASK_MAT, tint));
    const jaw = clamp(F.jaw || 0, 0, 1.2) * 0.3;
    const JM = M4.chain(H, M4.translate(HINGE[0], HINGE[1], HINGE[2]), M4.rotX(jaw), M4.translate(-HINGE[0], -HINGE[1], -HINGE[2]));
    const lip = P.lip;
    const smile = Math.max(F.smileL || 0, F.smileR || 0);
    const wide = clamp((F.wide || 0) + smile * 0.4, 0, 1.2);
    const dark = { rim: 0, spec: [0, 1] };
    fx.draw(P.cavityU, M4.chain(H, M4.translate(0, lip[1] - 0.006, lip[2] - 0.036)), dark);
    fx.draw(P.cavityL, M4.chain(JM, M4.translate(0, lip[1] - 0.011, lip[2] - 0.036)), dark);
    fx.draw(P.tongue, M4.chain(JM, M4.translate(0, lip[1] - 0.017, lip[2] - 0.031)), { rim: 0.1, spec: [0.3, 12] });
    fx.draw(P.teethU, M4.chain(H, M4.translate(0, lip[1] - 0.004 + wide * 0.002 + (F.sneer || 0) * 0.002, lip[2] - 0.034)), { spec: [0.4, 20], rim: 0.1 });
    fx.draw(P.teethL, M4.chain(JM, M4.translate(0, lip[1] + 0.0025 - wide * 0.002, lip[2] - 0.036)), { spec: [0.4, 20], rim: 0.1 });
    P.ears.forEach((q, i) => fx.draw(i ? P.earL : P.earR, M4.chain(H, M4.translate(q[0], q[1], q[2])), Object.assign({}, MASK_MAT, tint)));
    const look = F.look || [0, 0];
    const blink = clamp(F.blink || 0, 0, 1);
    const lidU = F.lidU === undefined ? 0.42 : F.lidU;
    const lidL = F.lidL === undefined ? 0.35 : F.lidL;
    const upEdge = lerp(lerp(-0.05, 0.6, lidU) - (F.browDown || 0) * 0.14, -0.12, blink);
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
    if (st.cig) fx.draw(P.cig, cigM(H), Object.assign({ spec: [0.2, 10], rim: 0.4 }, tint));
  }

  const CIG_POS = basePt(0.3, lipP(0.3) - 0.004);

  function cigM(H) {
    return M4.chain(H, M4.translate(CIG_POS[0], CIG_POS[1], CIG_POS[2] - 0.006), M4.rotY(0.55), M4.rotX(0.42));
  }

  function headPoint(m, local) {
    return M4.point(M4.mul(m.head, HEAD_SCALE), local);
  }

  function cigTip(m) {
    return M4.point(cigM(M4.mul(m.head, HEAD_SCALE)), [0, 0, 0.075]);
  }

  window.MeetSpy = { D, COL, TEAM, HAND_POSES, CHANNELS, build, solve, draw, handBasis, handMesh, headPoint, lipP, basePt, rawPt, torsoSurf, torsoNormal, EYE_R, HEAD_SCALE, cigTip };
})();
