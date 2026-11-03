(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Rig = window.YouVidRig;

  const D = { chestY: 0.12, neckY: 0.42, headY: 0.12, shX: 0.262, shY: 0.345, upper: 0.27, fore: 0.25, hipX: 0.135, hipY: -0.06, thigh: 0.35, shin: 0.35 };

  const COL = {
    skin: 0xb87652, shirt: 0xc8443a, shirtDk: 0x8e2a24, under: 0xe6e2d8, overall: 0x4a3a33, overallDk: 0x35291f, strap: 0x5e4336, buckle: 0x8c6e50,
    belt: 0x9c8c6c, beltBuckle: 0x5e5a52, pouch: 0x3c3a36, pad: 0xcd823c, padDk: 0x7c4a26, rivet: 0x3a3230, boot: 0x46322a, sole: 0x221a16,
    glove: 0xf08a30, gloveBand: 0x968f86, gloveTip: 0xb4ada2, hat: 0xf07a22, gogRim: 0x423c38, gogLens: 0x3c2416, gogStrap: 0xc8c4ba,
    patch: 0xf09440, patchDk: 0xb8542c, mouth: 0x2a0e0b, tongue: 0x9a4a44, cable: 0xe0901a
  };

  const TEAM = {
    red: { shirt: COL.shirt, shirtDk: COL.shirtDk, css: '#c8443a', fold: '60,10,8', seam: '70,14,10' },
    blu: { shirt: 0x5a87ac, shirtDk: 0x3f6488, css: '#5a87ac', fold: '10,28,50', seam: '20,40,64' }
  };

  const SKIN_MAT = { spec: [0.2, 9], rim: 1.1 };
  const CLOTH_MAT = { spec: [0.05, 5], rim: 0.85 };
  const HAT_MAT = { spec: [0.55, 26], rim: 0.7 };
  const RUBBER_MAT = { spec: [0.18, 12], rim: 0.5 };
  const LENS_MAT = { spec: [0.55, 28], rim: 0.15 };

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

  const YT = table([[-1.571, -0.157], [-1.25, -0.156], [-0.95, -0.145], [-0.75, -0.118], [-0.52, -0.088], [-0.4, -0.07], [-0.3, -0.055], [-0.2, -0.041],
    [-0.1, -0.027], [0.0, -0.012], [0.1, 0.002], [0.25, 0.025], [0.42, 0.05], [0.6, 0.075], [0.8, 0.1], [1.1, 0.125], [1.35, 0.138], [1.571, 0.142]]);
  const HW = table([[-1.571, 0.05], [-1.25, 0.062], [-0.95, 0.072], [-0.75, 0.098], [-0.52, 0.112], [-0.3, 0.116], [0.0, 0.118], [0.25, 0.118], [0.42, 0.118],
    [0.6, 0.116], [0.8, 0.11], [1.1, 0.09], [1.35, 0.055], [1.571, 0.0]]);
  const DF = table([[-1.571, 0.03], [-1.25, 0.06], [-0.95, 0.095], [-0.75, 0.114], [-0.52, 0.103], [-0.4, 0.107], [-0.3, 0.109], [-0.2, 0.11], [-0.1, 0.105],
    [0.0, 0.101], [0.1, 0.099], [0.25, 0.096], [0.42, 0.093], [0.6, 0.097], [0.8, 0.095], [1.1, 0.08], [1.35, 0.05], [1.571, 0.0]]);
  const DB = table([[-1.571, 0.02], [-1.0, 0.055], [-0.6, 0.085], [-0.2, 0.104], [0.2, 0.114], [0.6, 0.116], [1.0, 0.096], [1.3, 0.062], [1.571, 0.0]]);
  const SQ = table([[-1.571, 0.0], [-1.1, 0.14], [-0.8, 0.3], [-0.5, 0.32], [-0.2, 0.3], [0.2, 0.28], [0.5, 0.24], [0.8, 0.12], [1.1, 0.04], [1.571, 0.0]]);

  const NU = 64, NL = 16, NUP = 28, MW = 0.36;
  const HINGE = [0, -0.012, -0.012];
  const CHANNELS = ['smileL', 'smileR', 'wide', 'round', 'frown', 'press', 'sneer'];

  const g2 = (x, s) => Math.exp(-(x / s) * (x / s));
  const smooth = (e0, e1, x) => { const k = clamp((x - e0) / (e1 - e0), 0, 1); return k * k * (3 - 2 * k); };

  function lipP(a) {
    const q = a / 0.44;
    return -0.3 - 0.018 * Math.min(q * q, 1.6);
  }

  function yawAt(i) {
    const s = 2 * i / NU - 1;
    return PI * Math.sign(s) * Math.pow(Math.abs(s), 1.35);
  }

  function rawPt(a, p) {
    const q = SQ(p);
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
    h += 0.04 * g2(a, 0.15) * g2(p + 0.01, 0.1);
    h += 0.027 * g2(a, 0.1) * smooth(-0.06, 0.06, p) * (1 - smooth(0.28, 0.42, p));
    h += 0.018 * g2(A - 0.17, 0.075) * g2(p + 0.06, 0.06);
    h -= 0.006 * g2(A - 0.085, 0.03) * g2(p + 0.1, 0.025);
    h += 0.011 * g2(A - 0.62, 0.2) * g2(p - 0.14, 0.1);
    h += 0.004 * g2(A - 0.62, 0.25) * g2(p + 0.22, 0.15);
    h += 0.016 * g2(a, 0.38) * g2(p + 0.8, 0.13);
    h -= 0.006 * g2(a, 0.26) * g2(p + 0.52, 0.04);
    h -= 0.003 * g2(a, 0.04) * g2(p + 0.85, 0.1);
    h += 0.004 * g2(a, 0.3) * g2(dl - 0.03, 0.03) * (1 - smooth(MW, MW + 0.08, A));
    h += 0.006 * g2(a, 0.28) * g2(dl + 0.035, 0.03);
    h -= 0.006 * g2(segDist(A, p, 0.17, -0.06, 0.42, lipP(0.42) - 0.01), 0.028);
    h -= 0.012 * g2(A - 0.55, 0.22) * g2(p - 0.4, 0.15);
    h += 0.005 * g2(A - 0.45, 0.3) * g2(p - 0.62, 0.07);
    h += 0.012 * g2(A - 1.1, 0.22) * g2(p + 0.66, 0.16);
    h += 0.006 * g2(A - 0.75, 0.2) * g2(p + 0.82, 0.08);
    h += 0.003 * g2(a, 0.05) * g2(p + 0.18, 0.05);
    return h;
  }

  function basePt(a, p) {
    return V3.add(rawPt(a, p), V3.mul(approxNormal(a, p), relief(a, p)));
  }

  function deltas(a, p) {
    const A = Math.abs(a), sg = Math.sign(a) || 1;
    const dl = p - lipP(a);
    const inMouth = 1 - smooth(MW - 0.02, MW + 0.1, A);
    const out = {};
    const gC = g2(A - MW, 0.13) * g2(dl, 0.085);
    const gK = g2(A - 0.48, 0.16) * g2(p + 0.1, 0.11);
    const smile = [sg * (0.006 * gC + 0.002 * gK), 0.011 * gC + 0.006 * gK, -0.005 * gC + 0.004 * gK];
    const none = [0, 0, 0];
    out.smileL = a > 0 ? smile : none;
    out.smileR = a < 0 ? smile : none;
    if (A < 0.02) {
      const half = V3.mul(smile, 0.5);
      out.smileL = half;
      out.smileR = half;
    }
    const gUp = g2(dl - 0.025, 0.035) * inMouth;
    const gLo = g2(dl + 0.03, 0.04) * inMouth;
    out.wide = [sg * 0.007 * gC, 0.006 * gUp - 0.007 * gLo, 0.001 * gLo - 0.003 * gC];
    const gR = g2(dl, 0.08) * (1 - smooth(MW, MW + 0.12, A));
    const x0 = rawPt(a, p)[0];
    out.round = [-x0 * 0.33 * gR, 0, 0.008 * gR];
    const gF = g2(A - MW, 0.16) * g2(dl, 0.12);
    out.frown = [0, -0.008 * gF, 0];
    const gP = g2(dl, 0.06) * inMouth;
    const gM = g2(a, 0.28) * g2(p + 0.62, 0.12);
    out.press = [0, -0.004 * gUp + 0.004 * gLo + 0.003 * gM, -0.002 * gP + 0.004 * gM];
    const gS = g2(A - 0.13, 0.08) * g2(p + 0.12, 0.07);
    out.sneer = [0, 0.005 * gS + 0.003 * gUp, 0.001 * gS];
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
        if (nx * px + ny * (py + 0.03) + nz * pz < 0) { nx = -nx; ny = -ny; nz = -nz; }
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

  function stubTop(a) {
    const A = Math.abs(a);
    if (A < 0.12) return -0.11;
    if (A < 0.22) return lerp(-0.11, -0.14, (A - 0.12) / 0.1);
    if (A < 0.4) return lerp(-0.14, -0.19, (A - 0.22) / 0.18);
    if (A < 0.7) return lerp(-0.19, -0.1, (A - 0.4) / 0.3);
    if (A < 1.05) return lerp(-0.1, 0.12, (A - 0.7) / 0.35);
    if (A < 1.3) return lerp(0.12, 0.32, (A - 1.05) / 0.25);
    if (A < 1.55) return lerp(0.32, -0.2, (A - 1.3) / 0.25);
    return lerp(-0.2, -0.75, clamp((A - 1.55) / 0.5, 0, 1));
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
    ctx.fillStyle = '#b87650';
    ctx.fillRect(0, 0, W, H);
    const vg = ctx.createLinearGradient(0, 0, 0, H);
    vg.addColorStop(0, 'rgba(232,166,124,0.3)');
    vg.addColorStop(0.45, 'rgba(232,166,124,0)');
    vg.addColorStop(0.75, 'rgba(110,56,38,0)');
    vg.addColorStop(1, 'rgba(110,56,38,0.18)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    [-1, 1].forEach(s => {
      blob(s * 0.55, 0.0, 0.22, 0.12, '205,98,78', 0.2);
      blob(s * 1.48, 0.12, 0.12, 0.14, '190,92,72', 0.32);
      blob(s * 0.52, 0.42, 0.22, 0.12, '110,58,40', 0.4);
    });
    blob(0, 0.0, 0.1, 0.06, '205,96,76', 0.4);
    const g = rand(57);
    const off = document.createElement('canvas');
    off.width = W;
    off.height = H;
    const oc = off.getContext('2d');
    const region = (c) => {
      c.beginPath();
      for (let i = 0; i <= 180; i++) {
        const a = -PI + (2 * PI * i) / 180;
        const [x, y] = P(a, stubTop(a));
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.lineTo(W, H);
      c.lineTo(0, H);
      c.closePath();
    };
    oc.filter = 'blur(6px)';
    region(oc);
    const sg = oc.createLinearGradient(0, P(0, -0.1)[1], 0, P(0, -0.5)[1]);
    sg.addColorStop(0, 'rgba(100,70,60,0.36)');
    sg.addColorStop(1, 'rgba(86,62,54,0.55)');
    oc.fillStyle = sg;
    oc.fill();
    oc.filter = 'none';
    oc.save();
    region(oc);
    oc.clip();
    for (let i = 0; i < 30000; i++) {
      const x = g() * W, y = P(0, 0.35)[1] + g() * (H - P(0, 0.35)[1]);
      oc.fillStyle = `rgba(60,42,38,${0.05 + g() * 0.12})`;
      oc.fillRect(x, y, 1.2, 1.2);
    }
    oc.restore();
    ctx.drawImage(off, 0, 0);
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
    ctx.fillStyle = 'rgba(176,98,82,0.6)';
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
      ctx.lineTo(...P(a, lipP(a) + 0.006 + 0.02 * k));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(150,80,66,0.45)';
    ctx.fill();
    ctx.restore();
    [-1, 1].forEach(s => {
      blob(s * 0.075, -0.082, 0.02, 0.011, '60,26,20', 0.7);
      ctx.strokeStyle = 'rgba(100,48,36,0.35)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(...P(s * 0.16, -0.07));
      ctx.quadraticCurveTo(...P(s * 0.32, -0.15), ...P(s * 0.4, lipP(0.4) - 0.015));
      ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(48,20,14,0.95)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = lerp(-MW, MW, i / 40);
      const [x, y] = P(a, lipP(a));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(100,52,38,0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(...P(-0.22, -0.5));
    ctx.quadraticCurveTo(...P(0, -0.54), ...P(0.22, -0.5));
    ctx.stroke();
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
        const mid = (r0.y + r1.y) / 2;
        const cols = colAt ? [colAt(u0, mid), colAt(u1, mid), colAt(u1, mid), colAt(u0, mid)] : [0xffffff, 0xffffff, 0xffffff, 0xffffff];
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
    [-0.2, 0.212, 0.164, 0.012], [-0.12, 0.226, 0.174, 0.022], [-0.02, 0.236, 0.18, 0.028], [0.08, 0.246, 0.176, 0.024], [0.18, 0.258, 0.168, 0.014],
    [0.27, 0.264, 0.16, 0.004], [0.33, 0.258, 0.152, -0.004], [0.38, 0.24, 0.14, -0.01], [0.415, 0.196, 0.124, -0.012], [0.44, 0.146, 0.108, -0.01], [0.458, 0.118, 0.098, -0.006]
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

  const BIB_TOP = 0.15, BIB_ANG = 0.66;

  function paintTorso(ctx, W, H, team) {
    const y0 = TORSO[0].y, y1 = TORSO[TORSO.length - 1].y;
    const Y = (y) => (1 - (y - y0) / (y1 - y0)) * H;
    const U = (ang) => ((ang + PI) / (2 * PI)) * W;
    ctx.fillStyle = team.css;
    ctx.fillRect(0, 0, W, H);
    const fold = ctx.createLinearGradient(0, 0, W, 0);
    fold.addColorStop(0, `rgba(${team.fold},0.18)`);
    fold.addColorStop(0.5, 'rgba(255,200,180,0.05)');
    fold.addColorStop(1, `rgba(${team.fold},0.18)`);
    ctx.fillStyle = fold;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e6e2d8';
    ctx.beginPath();
    ctx.moveTo(U(-0.42), Y(0.46));
    ctx.lineTo(U(0), Y(0.31));
    ctx.lineTo(U(0.42), Y(0.46));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(${team.seam},0.6)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(U(0), Y(0.31));
    ctx.lineTo(U(0.02), Y(BIB_TOP));
    ctx.stroke();
    ctx.fillStyle = '#4a3a33';
    ctx.beginPath();
    ctx.moveTo(0, Y(-0.06));
    ctx.lineTo(U(-PI + 0.01), Y(-0.06));
    ctx.lineTo(U(-BIB_ANG - 0.3), Y(-0.06));
    ctx.quadraticCurveTo(U(-BIB_ANG - 0.05), Y(0.0), U(-BIB_ANG), Y(BIB_TOP));
    ctx.lineTo(U(BIB_ANG), Y(BIB_TOP));
    ctx.quadraticCurveTo(U(BIB_ANG + 0.05), Y(0.0), U(BIB_ANG + 0.3), Y(-0.06));
    ctx.lineTo(W, Y(-0.06));
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#35291f';
    ctx.fillRect(U(-0.3), Y(0.11), U(0.3) - U(-0.3), Y(-0.02) - Y(0.11));
    ctx.fillStyle = '#4a3a33';
    ctx.fillRect(U(-0.28), Y(0.1), U(0.28) - U(-0.28), Y(-0.01) - Y(0.1));
    ctx.strokeStyle = 'rgba(150,120,90,0.45)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(U(-BIB_ANG + 0.04), Y(BIB_TOP - 0.01), U(BIB_ANG - 0.04) - U(-BIB_ANG + 0.04), Y(-0.15) - Y(BIB_TOP - 0.01));
    ctx.strokeRect(U(-0.26), Y(0.095), U(0.26) - U(-0.26), Y(0.0) - Y(0.095));
    ctx.setLineDash([]);
    ctx.fillStyle = '#7a6a50';
    ctx.fillRect(U(-0.05), Y(0.13), U(0.05) - U(-0.05), Y(0.11) - Y(0.13));
    const g = rand(8);
    for (let i = 0; i < 3200; i++) {
      ctx.fillStyle = `rgba(${g() < 0.5 ? '0,0,0' : '255,255,255'},${g() * 0.05})`;
      ctx.fillRect(g() * W, g() * H, 2, 2);
    }
    ctx.strokeStyle = 'rgba(40,10,8,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(U(PI - 0.001), 0);
    ctx.lineTo(U(PI - 0.001), H);
    ctx.moveTo(U(-PI + 0.001), 0);
    ctx.lineTo(U(-PI + 0.001), H);
    ctx.stroke();
  }

  function buildTorso(b) {
    ringLoft(b, TORSO, 30, null, {});
    return b;
  }

  function buildCollar(b, team) {
    const rings = [
      { y: 0.35, rx: 0.236, rz: 0.158, cz: -0.004 },
      { y: 0.405, rx: 0.19, rz: 0.134, cz: -0.008 },
      { y: 0.438, rx: 0.138, rz: 0.112, cz: -0.006 },
      { y: 0.452, rx: 0.134, rz: 0.11, cz: -0.006 }
    ];
    const open = (u, j) => Math.abs(u - 0.5) < (j === 0 ? 0.11 : j === 1 ? 0.085 : 0.07);
    ringLoft(b, rings, 28, (u, y) => (y > 0.444 ? team.shirtDk : team.shirt), { skip: open });
    return b;
  }

  function strapPath(s) {
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const f = i / 16;
      const front = f < 0.5;
      const k = front ? f / 0.5 : (f - 0.5) / 0.5;
      const ang = front ? s * lerp(0.48, 0.62, k) : s * lerp(PI - 0.62 * 1.0 + 0.0, PI - 0.38, k);
      const y = front ? lerp(BIB_TOP - 0.005, 0.43, Math.sqrt(k)) : lerp(0.43, -0.05, k * k * 0.3 + k * 0.7);
      pts.push({ ang: front ? ang : (s > 0 ? ang : -ang), y });
    }
    return pts;
  }

  function buildStraps(b) {
    [-1, 1].forEach(s => {
      const pts = strapPath(s);
      for (let i = 0; i < pts.length - 1; i++) {
        const q0 = pts[i], q1 = pts[i + 1];
        const p0 = torsoSurf(q0.ang, q0.y, 0.008), p1 = torsoSurf(q1.ang, q1.y, 0.008);
        const n0 = torsoNormal(q0.ang, q0.y), n1 = torsoNormal(q1.ang, q1.y);
        const t = V3.norm(V3.sub(p1, p0));
        const w0 = V3.mul(V3.norm(V3.cross(n0, t)), 0.024), w1 = V3.mul(V3.norm(V3.cross(n1, t)), 0.024);
        b.quad(V3.sub(p0, w0), V3.add(p0, w0), V3.add(p1, w1), V3.sub(p1, w1), COL.strap, null, [n0, n0, n1, n1]);
      }
      const bk = torsoSurf(s * 0.52, 0.29, 0.015);
      const n = torsoNormal(s * 0.52, 0.29);
      const yaw = Math.atan2(n[0], n[2]);
      b.push(M4.translate(bk[0], bk[1], bk[2]), M4.rotY(yaw), M4.rotX(-0.25));
      b.box(0.07, 0.03, 0.012, COL.buckle);
      b.at(0, 0, 0.007, h => h.box(0.045, 0.012, 0.004, 0x2e2420));
      b.pop();
      const ck = torsoSurf(s * 0.5, 0.2, 0.012);
      b.push(M4.translate(ck[0], ck[1], ck[2]), M4.rotY(yaw));
      b.box(0.012, 0.05, 0.008, COL.buckle);
      b.at(0, -0.03, 0, h => h.box(0.05, 0.012, 0.008, COL.buckle));
      b.at(-0.02, -0.045, 0, h => h.box(0.01, 0.03, 0.008, COL.buckle));
      b.at(0.02, -0.045, 0, h => h.box(0.01, 0.03, 0.008, COL.buckle));
      b.pop();
    });
    return b;
  }

  function buildShoulderCaps(b, team) {
    [-1, 1].forEach(s => {
      b.at(s * 0.225, 0.36, -0.008, h => {
        h.push(M4.rotZ(-s * 0.6));
        h.ellipsoid(0.075, 0.042, 0.1, 16, 10, team.shirt);
        h.pop();
      });
    });
    return b;
  }

  function limbRings(len, keys, col) {
    return keys.map(([f, r, rz, cz]) => ({ y: -len * f, rx: r, rz: rz || r, cz: cz || 0, col })).reverse();
  }

  function buildUpper(b, side, team) {
    const len = D.upper;
    const rings = limbRings(len, [[-0.12, 0.07], [0, 0.088, 0.092], [0.15, 0.096, 0.1, 0.006], [0.35, 0.094, 0.096, 0.008], [0.6, 0.086, 0.088, 0.006], [0.85, 0.078, 0.08], [1.0, 0.074, 0.074], [1.1, 0.07, 0.07]]);
    ringLoft(b, rings, 16, () => team.shirt, { capTop: true });
    const k = side === 'L' ? 1 : -1;
    b.at(k * 0.105, -len * 0.18, 0.005, h => {
      h.push(M4.rotY(k * PI / 2));
      K.discXY(h, 0, 0, 0, 0.031, 16, rgb(COL.patch));
      K.discXY(h, 0, 0, 0.001, 0.021, 16, rgb(COL.patchDk));
      K.discXY(h, 0, 0, 0.002, 0.009, 12, rgb(COL.patch));
      h.at(0, 0, 0.0015, q => q.box(0.007, 0.045, 0.002, rgb(COL.patch)));
      h.at(0, 0, 0.0015, q => q.box(0.045, 0.007, 0.002, rgb(COL.patch)));
      h.pop();
    });
    return b;
  }

  function buildForeBare(b, team) {
    const len = D.fore;
    const roll = limbRings(len, [[-0.1, 0.082], [0.0, 0.086], [0.06, 0.088], [0.16, 0.084], [0.2, 0.068]]);
    ringLoft(b, roll, 16, () => team.shirt, { capTop: true, capBottom: true });
    const arm = limbRings(len, [[0.12, 0.074, 0.068], [0.35, 0.072, 0.064, 0.004], [0.6, 0.06, 0.054], [0.85, 0.05, 0.044], [1.02, 0.046, 0.04]]);
    ringLoft(b, arm, 14, () => COL.skin, { capBottom: true });
    return b;
  }

  function buildForeGlove(b, team) {
    const len = D.fore;
    const sleeve = limbRings(len, [[-0.1, 0.074], [0.0, 0.078], [0.3, 0.07], [0.42, 0.066]]);
    ringLoft(b, sleeve, 16, () => team.shirt, { capTop: true });
    const cuff = [
      [0.3, 0.086, 0.084], [0.34, 0.094, 0.092], [0.42, 0.092, 0.09], [0.5, 0.088, 0.086], [0.53, 0.089, 0.087], [0.64, 0.085, 0.083], [0.67, 0.084, 0.082],
      [0.78, 0.078, 0.076], [0.92, 0.07, 0.068], [1.02, 0.066, 0.064], [1.06, 0.06, 0.058]
    ];
    const bandAt = (f) => (f > 0.52 && f < 0.655 ? COL.gloveBand : COL.glove);
    const rings = cuff.map(([f, rx, rz]) => ({ y: -len * f, rx, rz }));
    ringLoft(b, rings.slice().reverse(), 18, (u, y) => bandAt(-y / len), { capBottom: true });
    const inner = [{ y: -len * 0.3, rx: 0.07, rz: 0.068 }, { y: -len * 0.36, rx: 0.072, rz: 0.07 }].reverse();
    ringLoft(b, inner, 18, () => 0x6a3a18, {});
    return b;
  }

  const HAND_POSES = {
    relax: { curl: [0.32, 0.4, 0.46, 0.52], spread: 0.15, thumb: [0.45, 0.35] },
    fist: { curl: [1, 1, 1, 1], spread: 0, thumb: [0.15, 0.95] },
    grip: { curl: [0.74, 0.77, 0.8, 0.82], spread: 0.05, thumb: [0.65, 0.55] },
    point: { curl: [0.02, 1, 1, 1], spread: 0.05, thumb: [0.25, 0.85] },
    open: { curl: [0.08, 0.08, 0.1, 0.14], spread: 0.6, thumb: [0.85, 0.12] },
    wave: { curl: [0.12, 0.18, 0.26, 0.34], spread: 0.7, thumb: [0.9, 0.2] },
    rest: { curl: [0.24, 0.28, 0.32, 0.36], spread: 0.18, thumb: [0.5, 0.2] },
    strum: { curl: [0.62, 0.72, 0.78, 0.82], spread: 0.08, thumb: [0.7, 0.6] },
    fret: { curl: [0.55, 0.6, 0.66, 0.72], spread: 0.32, thumb: [0.9, 0.3] },
    bottle: { curl: [0.66, 0.7, 0.74, 0.78], spread: 0.04, thumb: [0.9, 0.45] },
    drape: { curl: [0.42, 0.48, 0.52, 0.56], spread: 0.1, thumb: [0.35, 0.2] }
  };

  function palm(b, colAt) {
    const rows = [[0.012, 0.044, 0.026], [-0.02, 0.052, 0.029], [-0.06, 0.055, 0.026], [-0.095, 0.053, 0.021], [-0.108, 0.047, 0.017]];
    const sides = 14;
    const pt = (r, i) => {
      const a = (i / sides) * PI * 2;
      return [S(a) * r[1], r[0], C(a) * r[2]];
    };
    for (let j = 0; j < rows.length - 1; j++) {
      for (let i = 0; i < sides; i++) {
        const a = pt(rows[j], i), bb = pt(rows[j], i + 1), c = pt(rows[j + 1], i + 1), d = pt(rows[j + 1], i);
        const ns = [a, bb, c, d].map(q => V3.norm([q[0] / 0.05, 0, q[2] / 0.025]));
        b.quad(a, bb, c, d, [a, bb, c, d].map(q => rgb(colAt(q))), null, ns);
      }
    }
    const top = rows[0], bot = rows[rows.length - 1];
    for (let i = 0; i < sides; i++) {
      b.tri([0, top[0], 0], pt(top, i), pt(top, i + 1), rgb(colAt([0, top[0], 0])));
      b.tri([0, bot[0], 0], pt(bot, i + 1), pt(bot, i), rgb(colAt([0, bot[0], 0])));
    }
  }

  function fingerSegment(b, len, r0, r1, col, tipCol) {
    b.prism(8, r1, r1 * 0.92, -len, r0, r0 * 0.92, 0, col, { capTop: false });
    b.at(0, -len, 0, h => h.ellipsoid(r1 * 1.02, r1 * 1.02, r1 * 0.95, 8, 5, tipCol || col));
  }

  function buildHandMesh(b, side, poseName, glove) {
    const k = side === 'L' ? 1 : -1;
    const pose = HAND_POSES[poseName] || HAND_POSES.relax;
    const base = glove ? COL.glove : COL.skin;
    const tip = glove ? COL.gloveTip : 0xd08e6a;
    b.push(M4.scale(glove ? 1.42 : 1.12, glove ? 1.42 : 1.12, glove ? 1.42 : 1.12));
    palm(b, (q) => (glove && q[1] > -0.005 ? COL.gloveBand : base));
    const xs = [0.034, 0.012, -0.011, -0.032];
    const lens = [0.086, 0.092, 0.087, 0.07];
    const rads = [0.0118, 0.0124, 0.0118, 0.0104];
    const spreads = [0.13, 0.03, -0.06, -0.16];
    xs.forEach((x, f) => {
      const c = pose.curl[f];
      const L = lens[f], r = rads[f];
      const l1 = L * 0.44, l2 = L * 0.31, l3 = L * 0.25;
      b.push(M4.translate(k * x, -0.1 + Math.abs(x) * 0.12, 0.002), M4.rotZ(k * spreads[f] * (0.4 + pose.spread)), M4.rotX(-(c * 1.45 + 0.06)));
      b.at(0, 0, 0, h => h.ellipsoid(r * 1.15, r * 1.1, r * 1.05, 8, 5, base));
      fingerSegment(b, l1, r * 1.04, r, base);
      b.push(M4.translate(0, -l1, 0), M4.rotX(-c * 1.65));
      fingerSegment(b, l2, r, r * 0.95, base);
      b.push(M4.translate(0, -l2, 0), M4.rotX(-c * 1.05));
      fingerSegment(b, l3, r * 0.95, r * 0.84, glove ? tip : base, tip);
      b.pop();
      b.pop();
      b.pop();
    });
    const [ab, tc] = pose.thumb;
    b.push(M4.translate(k * 0.045, -0.03, 0.012), M4.rotY(k * (0.35 + ab * 0.5)), M4.rotZ(k * (0.55 + ab * 0.45)), M4.rotX(-0.3 - ab * 0.4));
    b.at(0, 0, 0, h => h.ellipsoid(0.018, 0.021, 0.017, 8, 5, base));
    fingerSegment(b, 0.036, 0.0152, 0.0146, base);
    b.push(M4.translate(0, -0.036, 0), M4.rotX(-tc * 0.9));
    fingerSegment(b, 0.03, 0.0146, 0.0138, base);
    b.push(M4.translate(0, -0.03, 0), M4.rotX(-tc * 0.8));
    fingerSegment(b, 0.026, 0.0138, 0.0124, glove ? tip : base, tip);
    b.pop();
    b.pop();
    b.pop();
    b.pop();
    return b;
  }

  function buildThigh(b) {
    const len = D.thigh;
    ringLoft(b, limbRings(len, [[-0.16, 0.128], [0, 0.13, 0.134], [0.4, 0.122, 0.126], [0.8, 0.104, 0.108], [1.0, 0.094, 0.096], [1.1, 0.088, 0.088]]), 14, () => COL.overall, { capTop: true, capBottom: true });
    return b;
  }

  function buildShin(b) {
    const len = D.shin;
    const col = (u, y) => (-y / len > 0.66 ? COL.boot : COL.overall);
    ringLoft(b, limbRings(len, [[-0.06, 0.094], [0.1, 0.096], [0.4, 0.09], [0.64, 0.084], [0.66, 0.092], [0.7, 0.094], [0.9, 0.088], [1.04, 0.086]]), 14, col, { capTop: true, capBottom: true });
    return b;
  }

  function buildKneePad(b) {
    b.push(M4.translate(0, -0.03, 0.075), M4.rotX(0.1));
    b.ellipsoid(0.082, 0.1, 0.045, 14, 9, COL.pad, { colorAt: p => (p[2] < -0.02 ? COL.padDk : COL.pad) });
    [[-0.05, 0.05], [0.05, 0.05], [-0.055, -0.03], [0.055, -0.03], [0, 0.075], [0, -0.07]].forEach(([x, y]) => {
      const z = 0.045 * Math.sqrt(Math.max(0, 1 - (x / 0.082) * (x / 0.082) - (y / 0.1) * (y / 0.1)));
      b.at(x, y, z, h => h.ellipsoid(0.007, 0.007, 0.004, 6, 4, COL.rivet));
    });
    b.pop();
    b.at(0, -0.1, 0.0, h => h.prism(14, 0.094, 0.094, -0.012, 0.094, 0.094, 0.012, COL.overallDk, { capTop: false }));
    b.at(0, 0.05, 0.0, h => h.prism(14, 0.092, 0.092, -0.012, 0.092, 0.092, 0.012, COL.overallDk, { capTop: false }));
    return b;
  }

  function buildFoot(b) {
    b.at(0, -0.03, 0.06, h => h.ellipsoid(0.075, 0.058, 0.155, 12, 7, COL.boot));
    b.at(0, -0.07, 0.065, h => h.box(0.15, 0.03, 0.29, COL.sole));
    b.at(0, 0.02, -0.005, h => h.prism(12, 0.086, 0.086, -0.06, 0.084, 0.084, 0.07, COL.boot));
    b.at(0, 0.0, 0.11, h => h.ellipsoid(0.06, 0.03, 0.06, 10, 5, 0x5a4034));
    return b;
  }

  function buildHips(b) {
    const rings = [
      { y: -0.19, rx: 0.19, rz: 0.15, cz: -0.004 },
      { y: -0.1, rx: 0.215, rz: 0.17, cz: 0.004 },
      { y: 0.0, rx: 0.212, rz: 0.168, cz: 0.012 },
      { y: 0.07, rx: 0.205, rz: 0.162, cz: 0.012 }
    ];
    ringLoft(b, rings, 22, () => COL.overall, { capBottom: true });
    [-1, 1].forEach(s => b.at(s * 0.125, -0.08, 0.0, h => h.ellipsoid(0.13, 0.13, 0.15, 12, 8, COL.overall)));
    const belt = [{ y: -0.005, rx: 0.218, rz: 0.174, cz: 0.012 }, { y: 0.045, rx: 0.214, rz: 0.17, cz: 0.012 }];
    ringLoft(b, belt, 24, () => COL.belt, {});
    b.at(0, 0.02, 0.19, h => h.box(0.075, 0.055, 0.012, COL.beltBuckle));
    b.at(0, 0.02, 0.197, h => h.box(0.05, 0.032, 0.006, COL.belt));
    b.at(-0.17, -0.02, 0.1, h => { h.push(M4.rotY(-0.9)); h.box(0.07, 0.09, 0.04, COL.pouch); h.at(0, 0.035, 0.022, q => q.box(0.072, 0.025, 0.006, 0x2e2c2a)); h.pop(); });
    b.at(0.18, -0.03, 0.08, h => { h.push(M4.rotY(0.9)); h.box(0.06, 0.1, 0.035, COL.pouch); h.pop(); });
    const coil = [];
    for (let i = 0; i <= 28; i++) {
      const f = i / 28;
      coil.push([-0.2 + S(f * PI * 6) * 0.012, -0.02 - f * 0.22, 0.02 + C(f * PI * 6) * 0.012]);
    }
    K.tube(b, coil, coil.map(() => 0.006), 5, COL.cable);
    return b;
  }

  function buildEar(b, side) {
    const k = side === 'L' ? 1 : -1;
    b.push(M4.rotY(k * 0.3), M4.rotZ(-k * 0.1));
    b.ellipsoid(0.01, 0.027, 0.018, 10, 8, COL.skin);
    b.at(k * 0.003, 0.002, 0.003, h => h.ellipsoid(0.007, 0.017, 0.01, 8, 6, 0x9a5840));
    b.pop();
    return b;
  }

  function buildTeeth(b, lower) {
    const n = 12;
    const R = 0.044, h = 0.014;
    for (let i = 0; i < n; i++) {
      const a0 = lerp(-1.0, 1.0, i / n), a1 = lerp(-1.0, 1.0, (i + 1) / n);
      const gap = 0.012;
      const shade = 0.9 + 0.1 * ((i % 2) ? 1 : 0);
      const col = [0.9 * shade, 0.87 * shade, 0.78 * shade, 0.06];
      const y0 = lower ? -h : 0, y1 = lower ? 0 : h;
      const p = (a, y, rr) => [S(a) * rr, y, C(a) * rr];
      const b0 = a0 + gap * 0.5, b1 = a1 - gap * 0.5;
      b.quad(p(b0, y0, R), p(b1, y0, R), p(b1, y1, R), p(b0, y1, R), col, null, [[S(b0), 0, C(b0)], [S(b1), 0, C(b1)], [S(b1), 0, C(b1)], [S(b0), 0, C(b0)]]);
      b.quad(p(b1, y0, R), p(a1 + gap * 0.5, y0, R), p(a1 + gap * 0.5, y1, R), p(b1, y1, R), [0.35, 0.3, 0.26, 0.05]);
      const ye = lower ? y1 : y0;
      b.quad(p(b0, ye, R), p(b1, ye, R), p(b1, ye, R - 0.008), p(b0, ye, R - 0.008), col);
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
          return [S(y) * C(p) * 0.066, S(p) * 0.04, C(y) * C(p) * 0.036];
        };
        const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
        const shade = q.map(v => rgb([0.17 + v[2] * 1.5, 0.05 + v[2] * 0.4, 0.045 + v[2] * 0.3], 0.35));
        b.quad(q[0], q[1], q[2], q[3], shade, null, q.map(v => V3.norm(V3.mul(v, -1))));
      }
    }
    return b;
  }

  const HAT = { c: [0, 0.096, -0.012], rx: 0.136, ry: 0.13, rz: 0.144, tilt: -0.05 };

  function hatM() {
    return M4.chain(M4.translate(HAT.c[0], HAT.c[1], HAT.c[2]), M4.rotX(HAT.tilt));
  }

  function buildHat(b) {
    const n = 32, rows = 9;
    const dome = (i, j) => {
      const a = (i / n) * PI * 2, e = (j / rows) * (PI / 2);
      const n0 = [S(a) * C(e), S(e), C(a) * C(e)];
      const flat = 1 - 0.06 * Math.pow(S(e), 6);
      return { p: [n0[0] * HAT.rx, n0[1] * HAT.ry * flat, n0[2] * HAT.rz], n: V3.norm([n0[0] / HAT.rx, n0[1] / HAT.ry, n0[2] / HAT.rz]) };
    };
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < n; i++) {
        const q = [dome(i, j), dome(i + 1, j), dome(i + 1, j + 1), dome(i, j + 1)];
        b.quad(q[0].p, q[1].p, q[2].p, q[3].p, COL.hat, null, q.map(v => v.n));
      }
    }
    const brimW = (a) => 0.02 + 0.016 * Math.max(0, C(a)) + 0.004 * Math.max(0, -C(a));
    const ring = (a, out, dy) => {
      const ex = S(a) * (HAT.rx + out), ez = C(a) * (HAT.rz + out);
      return [ex, dy, ez];
    };
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      const w0 = brimW(a0), w1 = brimW(a1);
      const in0 = ring(a0, -0.004, 0.0), in1 = ring(a1, -0.004, 0.0);
      const out0 = ring(a0, w0, -0.012), out1 = ring(a1, w1, -0.012);
      const up = [0, 1, 0];
      b.quad(in1, in0, out0, out1, COL.hat, null, [up, up, up, up]);
      const dn0 = V3.add(out0, [0, -0.006, 0]), dn1 = V3.add(out1, [0, -0.006, 0]);
      const o0 = V3.norm([S(a0), 0, C(a0)]), o1 = V3.norm([S(a1), 0, C(a1)]);
      b.quad(out1, out0, dn0, dn1, COL.hat, null, [o1, o0, o0, o1]);
      const bin0 = V3.add(in0, [0, -0.008, 0]), bin1 = V3.add(in1, [0, -0.008, 0]);
      const dw = [0, -1, 0];
      b.quad(dn1, dn0, bin0, bin1, rgb(0xb85a1a), null, [dw, dw, dw, dw]);
    }
    const crest = [];
    for (let i = 0; i <= 24; i++) {
      const e = lerp(0.08, PI - 0.3, i / 24);
      const a = e < PI / 2 ? 0 : PI;
      const ee = e < PI / 2 ? e : PI - e;
      const q = dome(a / (PI * 2) * n, ee / (PI / 2) * rows);
      crest.push(V3.add(q.p, V3.mul(q.n, -0.001)));
    }
    K.tube(b, crest, crest.map((_, i) => 0.0068 * (1 - 0.3 * Math.pow(i / 24, 2))), 10, COL.hat);
    return b;
  }

  const GOG = { a: 0.43, p: 0.38, R: 0.05, depth: 0.032, lens: 0.037, yaw: 0.16, pitch: -0.05 };

  function goggleFrames() {
    return [-1, 1].map(s => {
      const a = s * GOG.a;
      const q = basePt(a, GOG.p);
      const z = V3.norm([S(s * GOG.yaw), S(GOG.pitch), C(GOG.yaw)]);
      const x = V3.norm(V3.cross([0, 1, 0], z));
      const y = V3.cross(z, x);
      let top = -1;
      for (let i = -12; i <= 12; i++) {
        for (let j = -12; j <= 12; j++) {
          const w = basePt(a + i * 0.04, GOG.p + j * 0.03);
          const d = V3.sub(w, q);
          const along = V3.dot(d, z);
          const lat = V3.len(V3.sub(d, V3.mul(z, along)));
          if (lat < GOG.R * 1.08) top = Math.max(top, along);
        }
      }
      const c = V3.add(q, V3.mul(z, top - 0.006));
      return { side: s, c, x, y, z };
    });
  }

  function frameM(f) {
    return new Float32Array([f.x[0], f.x[1], f.x[2], 0, f.y[0], f.y[1], f.y[2], 0, f.z[0], f.z[1], f.z[2], 0, f.c[0], f.c[1], f.c[2], 1]);
  }

  function buildGoggleCup(b) {
    const R = GOG.R, L = GOG.depth, r = GOG.lens;
    const sides = 22;
    const rings = [[0, R * 1.04], [L * 0.55, R], [L * 0.86, R * 0.98], [L, R * 0.9], [L * 1.04, R * 0.8], [L * 0.98, r * 1.04], [L * 0.8, r]];
    for (let j = 0; j < rings.length - 1; j++) {
      const [z0, r0] = rings[j], [z1, r1] = rings[j + 1];
      for (let i = 0; i < sides; i++) {
        const a0 = (i / sides) * PI * 2, a1 = ((i + 1) / sides) * PI * 2;
        const p = (a, rr, z) => [C(a) * rr, S(a) * rr, z];
        const dz = z1 - z0, dr = r1 - r0;
        const nrm = (a) => V3.norm([C(a) * dz, S(a) * dz, -dr]);
        const inward = j >= 4;
        const n0 = inward ? V3.mul(nrm(a0), 1) : nrm(a0), n1 = inward ? V3.mul(nrm(a1), 1) : nrm(a1);
        b.quad(p(a0, r0, z0), p(a1, r0, z0), p(a1, r1, z1), p(a0, r1, z1), j >= 5 ? 0x1c1816 : COL.gogRim, null, [n0, n1, n1, n0]);
      }
    }
    return b;
  }

  function buildLens(b) {
    const sides = 22;
    for (let i = 0; i < sides; i++) {
      const a0 = (i / sides) * PI * 2, a1 = ((i + 1) / sides) * PI * 2;
      const bulge = (a, k) => [C(a) * GOG.lens * k, S(a) * GOG.lens * k, GOG.depth * 0.8 + 0.0015 * (1 - k * k)];
      for (let j = 0; j < 3; j++) {
        const k0 = j / 3, k1 = (j + 1) / 3;
        const n = (a, k) => V3.norm([C(a) * k * 0.4, S(a) * k * 0.4, 1]);
        b.quad(bulge(a0, k0), bulge(a0, k1), bulge(a1, k1), bulge(a1, k0), COL.gogLens, null, [n(a0, k0), n(a0, k1), n(a1, k1), n(a1, k0)]);
      }
    }
    return b;
  }

  function buildGoggleStrap(b, frames) {
    const f = frames;
    const p0 = V3.add(f[1].c, V3.mul(f[1].z, 0.012)), p1 = V3.add(f[0].c, V3.mul(f[0].z, 0.012));
    const mid = [0, (p0[1] + p1[1]) / 2 + 0.004, Math.max(p0[2], p1[2]) + 0.006];
    K.tube(b, [V3.add(p1, [0.03, 0, 0]), mid, V3.add(p0, [-0.03, 0, 0])], [0.006, 0.007, 0.006], 6, COL.gogRim);
    const band = [];
    for (let i = 0; i <= 26; i++) {
      const a = lerp(0.7, 2 * PI - 0.7, i / 26);
      const q = rawPt(a, GOG.p + 0.16);
      const n = approxNormal(a, GOG.p + 0.16);
      band.push({ p: V3.add(q, V3.mul(n, 0.004)), n });
    }
    for (let i = 0; i < band.length - 1; i++) {
      const a = band[i], c = band[i + 1];
      const h = 0.011;
      b.quad(V3.add(a.p, [0, -h, 0]), V3.add(c.p, [0, -h, 0]), V3.add(c.p, [0, h, 0]), V3.add(a.p, [0, h, 0]), COL.gogStrap, null, [a.n, c.n, c.n, a.n]);
    }
    [-1, 1].forEach(s => {
      const fr = f[s > 0 ? 1 : 0];
      const side = V3.add(fr.c, V3.mul(fr.x, s * GOG.R * 0.9));
      const target = band[s > 0 ? 0 : band.length - 1].p;
      K.tube(b, [side, V3.lerp(side, target, 0.5), target], [0.008, 0.008, 0.008], 6, COL.gogRim);
    });
    return b;
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
    const frames = goggleFrames();
    return {
      T,
      head,
      headData: new Float32Array(T.nv * 12),
      headPos: new Float32Array(T.nv * 3),
      neck,
      neckData: new Float32Array(NECK_RINGS * (NECK_SIDES + 1) * 12),
      neckDims: [NECK_RINGS, NECK_SIDES],
      faceTex: r.texture(1024, paintFace, { height: 512, clamp: true }),
      torsoTex: r.texture(512, (ctx, w, h) => paintTorso(ctx, w, h, team), { height: 512, clamp: true }),
      lip: basePt(0, lipP(0)),
      teethU: mk(b => buildTeeth(b, false)),
      teethL: mk(b => buildTeeth(b, true)),
      cavityU: mk(b => buildCavity(b, false)),
      cavityL: mk(b => buildCavity(b, true)),
      tongue: mk(b => b.ellipsoid(0.03, 0.009, 0.028, 12, 6, COL.tongue)),
      earL: mk(b => buildEar(b, 'L')),
      earR: mk(b => buildEar(b, 'R')),
      ears: [-1, 1].map(s => { const q = rawPt(s * 1.45, 0.14); return [q[0] - s * 0.003, q[1], q[2] + 0.004]; }),
      hat: mk(buildHat),
      gogFrames: frames,
      cup: mk(buildGoggleCup),
      lens: mk(buildLens),
      strap: mk(b => buildGoggleStrap(b, frames)),
      torso: mk(buildTorso),
      collar: mk(b => buildCollar(b, team)),
      straps: mk(buildStraps),
      caps: mk(b => buildShoulderCaps(b, team)),
      hips: mk(buildHips),
      upperL: mk(b => buildUpper(b, 'L', team)),
      upperR: mk(b => buildUpper(b, 'R', team)),
      foreL: mk(b => buildForeBare(b, team)),
      foreR: mk(b => buildForeGlove(b, team)),
      thigh: mk(buildThigh),
      shin: mk(buildShin),
      pad: mk(buildKneePad),
      foot: mk(buildFoot),
      hands: {},
      r
    };
  }

  function handMesh(P, side, pose) {
    const key = side + '|' + pose;
    if (!P.hands[key]) P.hands[key] = K.mesh(P.r, b => buildHandMesh(b, side, pose, side === 'R'));
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
    const bot = M4.mul(m.chest, M4.translate(0, 0.43, -0.006));
    const top = M4.mul(m.head, M4.translate(0, -0.1, -0.03));
    const shape = [[0.124, 0.104, 0], [0.118, 0.1, 0.004], [0.112, 0.097, 0.01], [0.108, 0.095, 0.014], [0.105, 0.094, 0.017], [0.102, 0.092, 0.018], [0.098, 0.09, 0.016], [0.094, 0.086, 0.012]];
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
        const stub = clamp((f - 0.35) / 0.5, 0, 1) * clamp(C(a) * 0.9 + 0.6, 0, 1);
        const base = rgb(COL.skin);
        const sc = [lerp(base[0], 0.42, stub * 0.6), lerp(base[1], 0.3, stub * 0.6), lerp(base[2], 0.27, stub * 0.6)];
        data.set([p[0], p[1], p[2], n[0], n[1], n[2], sc[0], sc[1], sc[2], 0, 0, 0], w);
        w += 12;
      }
    }
    P.neck.update(data);
  }

  function draw(fx, P, st) {
    const m = st.m;
    const F = st.face || {};
    const o = st.opts || {};
    const W = (M) => (o.pre ? M4.mul(o.pre, M) : M);
    const tint = o.tint ? { tint: o.tint } : {};
    const cloth = Object.assign({}, CLOTH_MAT, tint);
    const skin = Object.assign({}, SKIN_MAT, tint);
    if (!o.noBody) {
      fx.draw(P.torso, W(m.chest), Object.assign({ texture: P.torsoTex }, cloth));
      fx.draw(P.collar, W(m.chest), cloth);
      fx.draw(P.straps, W(m.chest), cloth);
      fx.draw(P.caps, W(m.chest), cloth);
      fx.draw(P.hips, W(m.pelvis), cloth);
      [['L', P.upperL, P.foreL], ['R', P.upperR, P.foreR]].forEach(([s, up, fore]) => {
        fx.draw(up, W(m['upper' + s]), cloth);
        fx.draw(fore, W(m['fore' + s]), s === 'R' ? Object.assign({}, cloth, { spec: [0.12, 10] }) : skin);
        const hand = st.hands && st.hands[s];
        const HM = hand && hand.M ? hand.M : m['hand' + s];
        fx.draw(handMesh(P, s, (hand && hand.pose) || 'relax'), W(HM), s === 'R' ? Object.assign({}, cloth, { spec: [0.12, 10] }) : skin);
        if (!o.noLegs) {
          fx.draw(P.thigh, W(m['thigh' + s]), cloth);
          fx.draw(P.shin, W(m['shin' + s]), cloth);
          fx.draw(P.pad, W(m['shin' + s]), Object.assign({}, cloth, { spec: [0.2, 12] }));
          fx.draw(P.foot, W(m['foot' + s]), cloth);
        }
      });
    }
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
    fx.draw(P.cavityU, M4.chain(H, M4.translate(0, lip[1] - 0.008, lip[2] - 0.05)), dark);
    fx.draw(P.cavityL, M4.chain(JM, M4.translate(0, lip[1] - 0.016, lip[2] - 0.05)), dark);
    fx.draw(P.tongue, M4.chain(JM, M4.translate(0, lip[1] - 0.024, lip[2] - 0.043)), { rim: 0.1, spec: [0.3, 12] });
    fx.draw(P.teethU, M4.chain(H, M4.translate(0, lip[1] - 0.0045 + wide * 0.002, lip[2] - 0.046)), { spec: [0.4, 20], rim: 0.1 });
    fx.draw(P.teethL, M4.chain(JM, M4.translate(0, lip[1] + 0.003 - wide * 0.002, lip[2] - 0.048)), { spec: [0.4, 20], rim: 0.1 });
    P.ears.forEach((q, i) => fx.draw(i ? P.earR : P.earL, M4.chain(H, M4.translate(q[0], q[1], q[2])), skin));
    P.gogFrames.forEach(f => {
      const GM = M4.mul(H, frameM(f));
      fx.draw(P.cup, GM, Object.assign({}, RUBBER_MAT, tint));
      fx.draw(P.lens, GM, Object.assign({}, LENS_MAT, tint));
    });
    fx.draw(P.strap, H, Object.assign({}, RUBBER_MAT, tint));
    if (!o.noHat) fx.draw(P.hat, M4.mul(H, hatM()), Object.assign({}, HAT_MAT, tint));
  }

  function headPoint(m, local) {
    return M4.point(m.head, local);
  }

  window.MeetEngineer = { D, COL, HAND_POSES, CHANNELS, build, solve, draw, handBasis, handMesh, headPoint, lipP, basePt, rawPt, torsoSurf, HAT };
})();
