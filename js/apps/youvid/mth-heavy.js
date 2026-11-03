(function () {
  const { M4, V3, rgb, Builder, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Rig = window.YouVidRig;

  const D = { chestY: 0.16, neckY: 0.61, headY: 0.12, shX: 0.37, shY: 0.42, upper: 0.35, fore: 0.34, hipX: 0.16, hipY: -0.07, thigh: 0.43, shin: 0.43 };

  const COL = {
    skin: 0xd38d62, skinHi: 0xe3a274, skinDk: 0xa8664a, lip: 0xae5f4c, mouth: 0x2a0d0b, tongue: 0x9c4a44, teeth: 0xe9e1cd,
    sclera: 0xe4dcd2, iris: 0x8eabbd, shirt: 0xb4382f, white: 0xe9e5dc, vest: 0x3a3532, vestDk: 0x2a2624, trim: 0x5c4d3d,
    pants: 0x5f5a4b, boot: 0x2a2421, sole: 0x1c1816, belt: 0x30271f, buckle: 0x8c8676, glove: 0x1f1c1b,
    casing: 0x4a433f, neck: 0xaaa298, tip: 0xf08a3c, strap: 0x2b2420
  };

  const TEAM = {
    red: { shirt: 0xb4382f, css: '#b4382f', patch: 0xd8743a, patchIn: 0xb4382f },
    blu: { shirt: 0x5a85ac, css: '#5a85ac', patch: 0xe8b04a, patchIn: 0x3a5f86 }
  };

  const SKIN_MAT = { spec: [0.22, 9], rim: 1.25 };
  const CLOTH_MAT = { spec: [0.05, 5], rim: 0.9 };
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

  const HW = table([[-1.571, 0.05], [-1.2, 0.1], [-0.85, 0.138], [-0.6, 0.146], [-0.35, 0.142], [-0.15, 0.13], [0.05, 0.118], [0.25, 0.11], [0.5, 0.104], [0.8, 0.09], [1.1, 0.064], [1.4, 0.03], [1.571, 0.0]]);
  const DF = table([[-1.571, 0.03], [-1.1, 0.07], [-0.8, 0.095], [-0.6, 0.106], [-0.42, 0.108], [-0.27, 0.112], [-0.1, 0.111], [0.1, 0.108], [0.24, 0.115], [0.5, 0.106], [0.8, 0.08], [1.15, 0.04], [1.571, 0.0]]);
  const DB = table([[-1.571, 0.02], [-1.1, 0.07], [-0.6, 0.095], [-0.2, 0.108], [0.2, 0.118], [0.5, 0.114], [0.9, 0.086], [1.2, 0.052], [1.571, 0.0]]);
  const YT = table([[-1.571, -0.225], [-1.1, -0.215], [-0.8, -0.192], [-0.6, -0.165], [-0.42, -0.12], [-0.27, -0.08], [-0.1, -0.038], [0.1, 0.012], [0.3, 0.05], [0.55, 0.088], [0.85, 0.114], [1.2, 0.128], [1.571, 0.132]]);

  const NU = 72, NL = 16, NUP = 30, MW = 0.3;
  const HINGE = [0, -0.03, -0.005];
  const EYE_R = 0.0145;
  const CHANNELS = ['browDown', 'browUp', 'browInUp', 'smile', 'frown', 'wide', 'round', 'sneer'];

  const g2 = (x, s) => Math.exp(-(x / s) * (x / s));
  const smooth = (e0, e1, x) => { const k = clamp((x - e0) / (e1 - e0), 0, 1); return k * k * (3 - 2 * k); };
  const sexp = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);

  function lipP(a) {
    const q = a / 0.4;
    return -0.275 - 0.02 * Math.min(q * q, 1.6);
  }

  function yawAt(i) {
    const s = 2 * i / NU - 1;
    return PI * Math.sign(s) * Math.pow(Math.abs(s), 1.35);
  }

  function squircle(p) {
    return 0.17 * smooth(-1.1, -0.7, p) * (1 - smooth(0.35, 0.75, p));
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
    h += 0.016 * Math.exp(-Math.pow(a / 0.55, 4)) * g2(p - 0.245, 0.05);
    h += 0.006 * g2(A - 0.28, 0.15) * g2(p - 0.235, 0.045);
    h -= 0.003 * g2(a, 0.06) * g2(p - 0.21, 0.05);
    h -= 0.004 * g2(A - 0.3, 0.16) * g2(p - 0.135, 0.09);
    h += (0.007 + 0.013 * clamp((0.21 - p) / 0.2, 0, 1)) * g2(a, 0.11) * smooth(-0.04, 0.0, p) * (1 - smooth(0.19, 0.25, p));
    h += 0.021 * g2(a, 0.16) * g2(p - 0.0, 0.07);
    h += 0.014 * g2(A - 0.13, 0.07) * g2(p + 0.045, 0.045);
    h += 0.01 * g2(A - 0.62, 0.22) * g2(p - 0.04, 0.11);
    h += 0.007 * g2(A - 0.46, 0.18) * g2(p + 0.1, 0.12);
    h -= 0.005 * g2(segDist(A, p, 0.18, -0.07, 0.36, lipP(0.36) - 0.005), 0.03);
    h += 0.004 * g2(dl - 0.03, 0.03) * (1 - smooth(MW, MW + 0.08, A));
    h += 0.005 * g2(dl + 0.03, 0.028) * g2(a, 0.28);
    h -= 0.004 * g2(dl + 0.085, 0.035) * g2(a, 0.3);
    h += 0.014 * g2(a, 0.38) * g2(p + 0.56, 0.1);
    h += 0.012 * g2(A - 0.8, 0.3) * g2(p + 0.45, 0.18);
    h -= 0.006 * g2(A - 1.05, 0.2) * g2(p - 0.3, 0.15);
    return h;
  }

  function eyeFrame(s) {
    const a = s * 0.3, p = 0.135;
    const q = rawPt(a, p);
    const n = approxNormal(a, p);
    const c = V3.sub(q, V3.mul(n, EYE_R * 0.92));
    const z = V3.norm([s * 0.12, 0.03, 1]);
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
      const e = Math.sqrt((psi / 1.05) * (psi / 1.05) + (phi / 0.84) * (phi / 0.84));
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
    const gB = g2(A - 0.2, 0.2) * g2(p - 0.27, 0.1) * smooth(0.16, 0.24, p);
    const gG = g2(a, 0.07) * g2(p - 0.23, 0.06);
    out.browDown = [-sg * 0.0035 * gB, -0.009 * gB, 0.003 * gB - 0.003 * gG];
    const gU = g2(A - 0.25, 0.28) * g2(p - 0.3, 0.14);
    out.browUp = [0, 0.011 * gU, -0.001 * gU];
    const gI = g2(A - 0.1, 0.12) * g2(p - 0.27, 0.08);
    out.browInUp = [0, 0.008 * gI, 0];
    const gC = g2(A - MW, 0.12) * g2(dl, 0.08);
    const gK = g2(A - 0.42, 0.15) * g2(p + 0.08, 0.1);
    const gL = g2(A - 0.3, 0.15) * g2(p - 0.07, 0.05);
    out.smile = [sg * (0.006 * gC + 0.002 * gK), 0.011 * gC + 0.006 * gK + 0.003 * gL, -0.005 * gC + 0.004 * gK + 0.001 * gL];
    const gF = g2(A - MW, 0.16) * g2(dl, 0.12);
    out.frown = [0, -0.008 * gF, 0];
    const gUp = g2(dl - 0.025, 0.035) * inMouth;
    const gLo = g2(dl + 0.03, 0.04) * inMouth;
    out.wide = [sg * 0.007 * gC, 0.006 * gUp - 0.007 * gLo, 0.001 * gLo - 0.003 * gC];
    const gR = g2(dl, 0.08) * (1 - smooth(MW, MW + 0.12, A));
    const x0 = rawPt(a, p)[0];
    out.round = [-x0 * 0.35 * gR, 0, 0.008 * gR];
    const gS = g2(A - 0.12, 0.08) * g2(p + 0.06, 0.07);
    out.sneer = [0, 0.005 * gS, 0.001 * gS];
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
    for (let k = 0; k <= NUP; k++) rows.push({ lower: false, f: Math.pow(k / NUP, 1.35) });
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
        const q = basePt(a, p);
        base.set(q, v * 3);
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

  function rotAbout(p, o, ang) {
    const c = C(ang), s = S(ang);
    const y = p[1] - o[1], z = p[2] - o[2];
    return [p[0], o[1] + y * c - z * s, o[2] + y * s + z * c];
  }

  function deformHead(T, F, out) {
    const nv = T.nv;
    const pos = out.pos;
    const w = CHANNELS.map(c => F[c] || 0);
    const jaw = clamp(F.jaw || 0, 0, 1.2) * 0.34;
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
    ctx.fillStyle = '#d08a60';
    ctx.fillRect(0, 0, W, H);
    const vg = ctx.createLinearGradient(0, 0, 0, H);
    vg.addColorStop(0, 'rgba(236,170,124,0.35)');
    vg.addColorStop(0.45, 'rgba(236,170,124,0)');
    vg.addColorStop(0.7, 'rgba(120,60,40,0)');
    vg.addColorStop(1, 'rgba(120,60,40,0.3)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    [-1, 1].forEach(s => {
      blob(s * 0.3, 0.13, 0.16, 0.1, '120,60,40', 0.45);
      blob(s * 0.3, 0.2, 0.2, 0.06, '120,62,44', 0.25);
      blob(s * 0.5, -0.04, 0.22, 0.14, '205,100,80', 0.22);
      blob(s * 1.5, 0.05, 0.12, 0.12, '190,95,75', 0.3);
      blob(s * 1.05, 0.3, 0.16, 0.14, '120,70,50', 0.12);
    });
    blob(0, -0.01, 0.12, 0.07, '200,95,75', 0.35);
    blob(0, 0.45, 0.6, 0.2, '240,180,130', 0.18);
    const g = rand(98);
    const stubTop = (a) => {
      const A = Math.abs(a);
      if (A < 0.2) return -0.07 - 0.008 * (A / 0.2);
      if (A < 0.36) return lerp(-0.078, -0.13, (A - 0.2) / 0.16);
      if (A < 0.66) return lerp(-0.13, -0.17, (A - 0.36) / 0.3);
      if (A < 1.15) return lerp(-0.17, -0.06, (A - 0.66) / 0.49);
      if (A < 1.42) return lerp(-0.06, 0.03, (A - 1.15) / 0.27);
      return lerp(0.03, -0.25, (A - 1.42) / 0.6);
    };
    const off = document.createElement('canvas');
    off.width = W;
    off.height = H;
    const oc = off.getContext('2d');
    const region = (c) => {
      c.beginPath();
      for (let i = 0; i <= 160; i++) {
        const a = -PI + (2 * PI * i) / 160;
        const [x, y] = P(a, stubTop(a));
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.lineTo(W, H);
      c.lineTo(0, H);
      c.closePath();
    };
    oc.filter = 'blur(7px)';
    region(oc);
    const sg = oc.createLinearGradient(0, P(0, -0.1)[1], 0, P(0, -0.3)[1]);
    sg.addColorStop(0, 'rgba(84,64,68,0.5)');
    sg.addColorStop(1, 'rgba(76,58,64,0.78)');
    oc.fillStyle = sg;
    oc.fill();
    oc.filter = 'none';
    oc.save();
    region(oc);
    oc.clip();
    for (let i = 0; i < 26000; i++) {
      const x = g() * W, y = P(0, 0.05)[1] + g() * (H - P(0, 0.05)[1]);
      oc.fillStyle = `rgba(58,40,42,${0.08 + g() * 0.16})`;
      oc.fillRect(x, y, 1.2, 1.2);
    }
    oc.restore();
    ctx.drawImage(off, 0, 0);
    [-1, 1].forEach(s => {
      ctx.save();
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const a = s * lerp(0.1, 0.44, i / 12);
        const p = 0.215 + 0.03 * S((i / 12) * PI * 0.9) - 0.012 * (i / 12);
        pts.push(P(a, p));
      }
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(58,32,22,0.9)';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      ctx.strokeStyle = 'rgba(90,52,36,0.55)';
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.restore();
      blob(s * 0.06, -0.052, 0.022, 0.011, '70,32,24', 0.6);
      ctx.strokeStyle = 'rgba(110,52,40,0.35)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(...P(s * 0.16, -0.06));
      ctx.quadraticCurveTo(...P(s * 0.3, -0.13), ...P(s * 0.36, lipP(0.36) - 0.012));
      ctx.stroke();
    });
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
      const [x, y] = P(a, lipP(a) - 0.005 - 0.03 * k);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(170,92,76,0.55)';
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = lerp(-MW - 0.02, MW + 0.02, i / 40);
      const [x, y] = P(a, lipP(a) - 0.003);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for (let i = 40; i >= 0; i--) {
      const a = lerp(-MW - 0.02, MW + 0.02, i / 40);
      const k = 1 - Math.pow(Math.abs(a) / (MW + 0.02), 2);
      const [x, y] = P(a, lipP(a) + 0.006 + 0.022 * k);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(150,80,66,0.45)';
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
    ctx.strokeStyle = 'rgba(120,64,46,0.16)';
    ctx.lineWidth = 2;
    [0.37, 0.43].forEach(p => {
      ctx.beginPath();
      ctx.moveTo(...P(-0.3, p - 0.01));
      ctx.quadraticCurveTo(...P(0, p + 0.012), ...P(0.3, p - 0.01));
      ctx.stroke();
    });
  }

  function paintEye(ctx, W, H) {
    ctx.fillStyle = '#e6ddd3';
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = W * 0.25;
    const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
    g.addColorStop(0, '#b7cfdc');
    g.addColorStop(0.6, '#86a3b6');
    g.addColorStop(0.92, '#4a6272');
    g.addColorStop(1, '#2e3a42');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0d0d0f';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.38, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(cx - R * 0.3, cy - R * 0.32, R * 0.14, 0, PI * 2);
    ctx.fill();
    const e = ctx.createRadialGradient(cx, cy, W * 0.3, cx, cy, W * 0.5);
    e.addColorStop(0, 'rgba(160,110,100,0)');
    e.addColorStop(1, 'rgba(160,110,100,0.5)');
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
    [-0.24, 0.255, 0.215, 0.0], [-0.16, 0.275, 0.235, 0.02], [-0.05, 0.3, 0.26, 0.04], [0.08, 0.32, 0.27, 0.04],
    [0.2, 0.335, 0.265, 0.03], [0.31, 0.345, 0.25, 0.015], [0.4, 0.34, 0.23, 0.0], [0.48, 0.31, 0.205, -0.012],
    [0.55, 0.245, 0.175, -0.014], [0.6, 0.185, 0.152, -0.006], [0.64, 0.15, 0.135, 0.0]
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
    return V3.norm([S(ang) / R.rx, 0.15, C(ang) / R.rz]);
  }

  function paintTorso(ctx, W, H, team) {
    const y0 = TORSO[0].y, y1 = TORSO[TORSO.length - 1].y;
    const Y = (y) => (1 - (y - y0) / (y1 - y0)) * H;
    const U = (ang) => ((ang + PI) / (2 * PI)) * W;
    ctx.fillStyle = '#3a3532';
    ctx.fillRect(0, 0, W, H);
    const shade = ctx.createLinearGradient(0, 0, W, 0);
    shade.addColorStop(0, 'rgba(0,0,0,0.12)');
    shade.addColorStop(0.5, 'rgba(255,255,255,0.03)');
    shade.addColorStop(1, 'rgba(0,0,0,0.12)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
    const vee = (inset) => {
      ctx.beginPath();
      ctx.moveTo(U(-0.62 + inset), Y(0.64));
      ctx.lineTo(U(-0.2 + inset * 0.5), Y(0.53));
      ctx.lineTo(U(0), Y(0.4 + inset * 0.2));
      ctx.lineTo(U(0.2 - inset * 0.5), Y(0.53));
      ctx.lineTo(U(0.62 - inset), Y(0.64));
      ctx.closePath();
    };
    ctx.fillStyle = '#5c4d3d';
    vee(-0.06);
    ctx.fill();
    ctx.fillStyle = team.css;
    vee(0);
    ctx.fill();
    ctx.save();
    vee(0);
    ctx.clip();
    ctx.fillStyle = '#e9e5dc';
    ctx.beginPath();
    ctx.moveTo(U(-0.7), Y(0.64));
    ctx.lineTo(U(0.7), Y(0.64));
    ctx.lineTo(U(0.7), Y(0.615));
    ctx.lineTo(U(0.2), Y(0.59));
    ctx.lineTo(U(0), Y(0.555));
    ctx.lineTo(U(-0.2), Y(0.59));
    ctx.lineTo(U(-0.7), Y(0.615));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    [-1, 1].forEach(s => {
      ctx.save();
      ctx.translate(U(s * 1.57), Y(0.44));
      ctx.scale(1, 1.6);
      ctx.strokeStyle = '#5c4d3d';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(0, 0, W * 0.07, 0, PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    ctx.fillStyle = '#5c4d3d';
    ctx.fillRect(0, Y(-0.155), W, Y(-0.19) - Y(-0.155));
    ctx.fillStyle = team.css;
    ctx.fillRect(0, Y(-0.19), W, Y(-0.215) - Y(-0.19));
    ctx.fillStyle = '#30271f';
    ctx.fillRect(0, Y(-0.215), W, H - Y(-0.215));
    ctx.fillStyle = '#8c8676';
    ctx.fillRect(U(-0.08), Y(-0.205), U(0.08) - U(-0.08), Y(-0.236) - Y(-0.205));
    ctx.fillStyle = 'rgba(80,72,64,0.85)';
    ctx.fillRect(U(-0.9), Y(0.06), U(0.9) - U(-0.9), Y(0.02) - Y(0.06));
    ctx.strokeStyle = 'rgba(20,18,16,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(U(PI - 0.001), 0);
    ctx.lineTo(U(PI - 0.001), H);
    ctx.moveTo(U(-PI + 0.001), 0);
    ctx.lineTo(U(-PI + 0.001), H);
    ctx.stroke();
    const g = rand(5);
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = `rgba(${g() < 0.5 ? '0,0,0' : '255,255,255'},${g() * 0.05})`;
      ctx.fillRect(g() * W, g() * H, 2, 2);
    }
  }

  function bullet(b, M, scale) {
    const s = scale || 1;
    b.push(M);
    b.prism(8, 0.0165 * s, 0.0165 * s, -0.04 * s, 0.0165 * s, 0.0165 * s, 0.022 * s, COL.casing, { capTop: false, capBottom: true });
    b.prism(8, 0.017 * s, 0.017 * s, 0.022 * s, 0.0155 * s, 0.0155 * s, 0.034 * s, COL.neck, { capTop: false });
    b.prism(8, 0.0155 * s, 0.0155 * s, 0.034 * s, 0.0118 * s, 0.0118 * s, 0.054 * s, rgb(COL.tip, 0.25), { capTop: false });
    b.prism(8, 0.0118 * s, 0.0118 * s, 0.054 * s, 0.003 * s, 0.003 * s, 0.07 * s, rgb(COL.tip, 0.25));
    b.pop();
  }

  function bandolierPath(back) {
    const pts = [];
    const n = back ? 13 : 17;
    for (let i = 0; i < n; i++) {
      const s = (i + 0.5) / n;
      const ang = back ? lerp(PI - 0.85, PI + 0.95, s) : lerp(-0.98, 0.78, s);
      const y = back ? lerp(-0.14, 0.56, s) : lerp(0.56, -0.14, s);
      pts.push({ ang, y });
    }
    return pts;
  }

  function buildBandolier(b) {
    [false, true].forEach(back => {
      const pts = bandolierPath(back);
      pts.forEach((q, i) => {
        const nx = pts[Math.min(pts.length - 1, i + 1)], pv = pts[Math.max(0, i - 1)];
        const p0 = torsoSurf(q.ang, q.y, 0.05);
        const n = torsoNormal(q.ang, q.y);
        const tan = V3.norm(V3.sub(torsoSurf(nx.ang, nx.y, 0.03), torsoSurf(pv.ang, pv.y, 0.03)));
        let side = V3.norm(V3.cross(n, tan));
        if (side[1] < 0) side = V3.mul(side, -1);
        const axis = V3.norm(V3.add(V3.add(side, V3.mul(n, 0.3)), back ? [0, 0, 0] : [0.7, -0.15, 0]));
        const z = V3.norm(V3.cross(axis, tan));
        const x = V3.cross(axis, z);
        const M = new Float32Array([x[0], x[1], x[2], 0, axis[0], axis[1], axis[2], 0, z[0], z[1], z[2], 0, p0[0], p0[1], p0[2], 1]);
        bullet(b, M, 2.0);
        b.push(M);
        b.box(0.05, 0.03, 0.032, COL.strap);
        b.pop();
      });
    });
    return b;
  }

  function buildTorso(b) {
    ringLoft(b, TORSO, 28, null, {});
    return b;
  }

  function buildCollar(b) {
    const rings = [
      { y: 0.55, rx: 0.2, rz: 0.165, cz: -0.01 },
      { y: 0.615, rx: 0.165, rz: 0.15, cz: -0.006 },
      { y: 0.645, rx: 0.167, rz: 0.153, cz: -0.004 }
    ];
    const col = (u, y) => (y > 0.635 ? COL.trim : COL.vest);
    ringLoft(b, rings, 24, col, { skip: (u) => Math.abs(u - 0.5) < 0.1 });
    const inner = rings.map(r => ({ y: r.y, rx: r.rx - 0.012, rz: r.rz - 0.012, cz: r.cz }));
    ringLoft(b, inner, 24, () => COL.vestDk, { skip: (u) => Math.abs(u - 0.5) < 0.1 });
    return b;
  }

  function buildShoulderCaps(b) {
    [-1, 1].forEach(s => {
      b.at(s * 0.28, 0.465, -0.012, h => {
        h.push(M4.rotZ(-s * 0.5));
        h.ellipsoid(0.13, 0.072, 0.162, 16, 10, COL.vest);
        h.pop();
      });
    });
    return b;
  }

  function limbRings(len, keys) {
    return keys.map(([f, r, rz, cz]) => ({ y: -len * f, rx: r, rz: rz || r, cz: cz || 0 })).reverse();
  }

  function buildUpper(b, side, team) {
    const len = D.upper;
    const rings = limbRings(len, [[-0.14, 0.12], [0, 0.15, 0.155], [0.12, 0.158, 0.165, 0.01], [0.3, 0.152, 0.155, 0.014], [0.42, 0.146, 0.148, 0.014], [0.425, 0.157, 0.159, 0.014], [0.444, 0.157, 0.159, 0.014], [0.446, 0.141, 0.143, 0.014], [0.48, 0.14, 0.142, 0.014], [0.62, 0.133, 0.14, 0.018], [0.85, 0.115, 0.12, 0.008], [1.0, 0.105, 0.108, 0], [1.08, 0.096, 0.096, 0]]);
    const col = (u, y) => (-y / len < 0.445 ? team.shirt : COL.skin);
    ringLoft(b, rings, 16, col, { capTop: true });
    const k = side === 'L' ? 1 : -1;
    b.at(k * 0.161, -len * 0.2, 0.008, h => {
      h.push(M4.rotY(k * PI / 2));
      K.discXY(h, 0, 0, 0, 0.045, 14, rgb(team.patch));
      K.discXY(h, 0, 0, 0.001, 0.036, 14, rgb(team.patchIn));
      h.box(0.012, 0.05, 0.004, rgb(team.patch));
      h.box(0.04, 0.012, 0.004, rgb(team.patch));
      h.pop();
    });
    return b;
  }

  function buildFore(b) {
    const len = D.fore;
    const rings = limbRings(len, [[-0.12, 0.1], [0, 0.112], [0.18, 0.13, 0.125, 0.01], [0.45, 0.118, 0.11, 0.006], [0.8, 0.088, 0.08], [0.88, 0.083, 0.076], [0.9, 0.09, 0.083], [1.02, 0.088, 0.08], [1.06, 0.066, 0.06]]);
    const col = (u, y) => (-y / len > 0.885 ? COL.glove : COL.skin);
    ringLoft(b, rings, 14, col, { capTop: true, capBottom: true });
    return b;
  }

  const HAND_POSES = {
    relax: { curl: [0.35, 0.42, 0.48, 0.55], spread: 0.15, thumb: [0.45, 0.35] },
    fist: { curl: [1, 1, 1, 1], spread: 0, thumb: [0.15, 0.95] },
    grip: { curl: [0.72, 0.75, 0.78, 0.8], spread: 0.05, thumb: [0.65, 0.55] },
    point: { curl: [0.02, 1, 1, 1], spread: 0.05, thumb: [0.25, 0.85] },
    open: { curl: [0.06, 0.05, 0.07, 0.1], spread: 0.55, thumb: [0.85, 0.1] },
    rest: { curl: [0.22, 0.26, 0.3, 0.34], spread: 0.18, thumb: [0.5, 0.2] },
    drape: { curl: [0.45, 0.5, 0.52, 0.55], spread: 0.1, thumb: [0.35, 0.2] },
    pinch: { curl: [0.42, 0.85, 0.9, 0.92], spread: 0.05, thumb: [0.75, 0.45] },
    claw: { curl: [0.55, 0.58, 0.6, 0.62], spread: 0.35, thumb: [0.6, 0.4] }
  };

  function palm(b, k) {
    const rows = [[0.012, 0.042, 0.027], [-0.02, 0.05, 0.03], [-0.06, 0.054, 0.027], [-0.095, 0.052, 0.022], [-0.108, 0.046, 0.018]];
    const sides = 14;
    const pt = (r, i) => {
      const a = (i / sides) * PI * 2;
      return [S(a) * r[1], r[0], C(a) * r[2]];
    };
    const colOf = (p) => {
      const back = p[2] < -0.006 && Math.abs(p[0]) < 0.022 && p[1] < -0.035 && p[1] > -0.08;
      return back ? COL.skin : COL.glove;
    };
    for (let j = 0; j < rows.length - 1; j++) {
      for (let i = 0; i < sides; i++) {
        const a = pt(rows[j], i), bb = pt(rows[j], i + 1), c = pt(rows[j + 1], i + 1), d = pt(rows[j + 1], i);
        const ns = [a, bb, c, d].map(q => V3.norm([q[0] / 0.05, 0, q[2] / 0.025]));
        b.quad(a, bb, c, d, [a, bb, c, d].map(q => rgb(colOf(q))), null, ns);
      }
    }
    const top = rows[0], bot = rows[rows.length - 1];
    for (let i = 0; i < sides; i++) {
      b.tri([0, top[0], 0], pt(top, i), pt(top, i + 1), COL.glove);
      b.tri([0, bot[0], 0], pt(bot, i + 1), pt(bot, i), COL.glove);
    }
    b.at(0, -0.055, -0.024, h => h.ellipsoid(0.022, 0.024, 0.006, 10, 5, COL.skin));
  }

  function fingerSegment(b, len, r0, r1, col, tipCol) {
    b.prism(8, r1, r1 * 0.92, -len, r0, r0 * 0.92, 0, col, { capTop: false });
    b.at(0, -len, 0, h => h.ellipsoid(r1 * 1.02, r1 * 1.02, r1 * 0.95, 8, 5, tipCol || col));
  }

  function buildHandMesh(b, side, poseName) {
    const k = side === 'L' ? 1 : -1;
    const pose = HAND_POSES[poseName] || HAND_POSES.relax;
    b.push(M4.scale(1.32, 1.32, 1.32));
    palm(b, k);
    const xs = [0.034, 0.012, -0.011, -0.032];
    const lens = [0.088, 0.094, 0.089, 0.072];
    const rads = [0.0118, 0.0124, 0.0118, 0.0104];
    const spreads = [0.13, 0.03, -0.06, -0.16];
    xs.forEach((x, f) => {
      const c = pose.curl[f];
      const L = lens[f], r = rads[f];
      const l1 = L * 0.44, l2 = L * 0.31, l3 = L * 0.25;
      b.push(M4.translate(k * x, -0.1 + Math.abs(x) * 0.12, 0.002), M4.rotZ(k * spreads[f] * (0.4 + pose.spread)), M4.rotX(-(c * 1.45 + 0.06)));
      b.at(0, 0, 0, h => h.ellipsoid(r * 1.15, r * 1.1, r * 1.05, 8, 5, COL.glove));
      b.prism(8, r * 1.08, r * 1.0, -l1 * 0.45, r * 1.1, r * 1.02, 0, COL.glove, { capTop: false });
      fingerSegment(b, l1, r, r * 0.97, COL.skin);
      b.push(M4.translate(0, -l1, 0), M4.rotX(-c * 1.65));
      fingerSegment(b, l2, r * 0.97, r * 0.92, COL.skin);
      b.push(M4.translate(0, -l2, 0), M4.rotX(-c * 1.05));
      fingerSegment(b, l3, r * 0.92, r * 0.82, COL.skin, 0xdf9a72);
      b.pop();
      b.pop();
      b.pop();
    });
    const [ab, tc] = pose.thumb;
    b.push(M4.translate(k * 0.043, -0.03, 0.012), M4.rotY(k * (0.35 + ab * 0.5)), M4.rotZ(k * (0.55 + ab * 0.45)), M4.rotX(-0.3 - ab * 0.4));
    b.at(0, 0, 0, h => h.ellipsoid(0.017, 0.02, 0.016, 8, 5, COL.glove));
    fingerSegment(b, 0.036, 0.0148, 0.0142, COL.glove);
    b.push(M4.translate(0, -0.036, 0), M4.rotX(-tc * 0.9));
    fingerSegment(b, 0.03, 0.0142, 0.0135, COL.skin);
    b.push(M4.translate(0, -0.03, 0), M4.rotX(-tc * 0.8));
    fingerSegment(b, 0.026, 0.0135, 0.012, COL.skin, 0xdf9a72);
    b.pop();
    b.pop();
    b.pop();
    b.pop();
    return b;
  }

  function buildThigh(b) {
    const len = D.thigh;
    ringLoft(b, limbRings(len, [[-0.15, 0.15], [0, 0.155, 0.16], [0.4, 0.145, 0.15], [0.8, 0.122, 0.125], [1.0, 0.112, 0.112], [1.08, 0.1, 0.1]]), 14, () => COL.pants, { capTop: true, capBottom: true });
    return b;
  }

  function buildShin(b) {
    const len = D.shin;
    const col = (u, y) => (-y / len > 0.58 ? COL.boot : COL.pants);
    ringLoft(b, limbRings(len, [[-0.06, 0.112], [0.1, 0.115], [0.4, 0.108], [0.57, 0.1], [0.58, 0.108], [0.62, 0.107], [0.9, 0.096], [1.04, 0.095]]), 14, col, { capTop: true, capBottom: true });
    return b;
  }

  function buildFoot(b) {
    b.at(0, -0.03, 0.07, h => h.ellipsoid(0.085, 0.06, 0.17, 12, 7, COL.boot));
    b.at(0, -0.074, 0.075, h => h.box(0.17, 0.03, 0.32, COL.sole));
    b.at(0, 0.02, -0.005, h => h.prism(12, 0.1, 0.1, -0.06, 0.098, 0.098, 0.07, COL.boot));
    return b;
  }

  function buildHips(b) {
    const rings = [
      { y: -0.2, rx: 0.22, rz: 0.19, cz: -0.01 },
      { y: -0.1, rx: 0.26, rz: 0.22, cz: 0.0 },
      { y: 0.02, rx: 0.26, rz: 0.22, cz: 0.0 },
      { y: 0.08, rx: 0.252, rz: 0.212, cz: 0.0 }
    ];
    ringLoft(b, rings, 20, () => COL.pants, { capBottom: true });
    [-1, 1].forEach(s => b.at(s * 0.17, -0.05, 0.0, h => h.ellipsoid(0.16, 0.16, 0.18, 12, 8, COL.pants)));
    b.at(0.24, -0.02, -0.02, h => {
      h.push(M4.rotZ(0.12));
      h.box(0.05, 0.16, 0.12, COL.belt);
      h.pop();
    });
    return b;
  }

  function buildEyeMesh(b) {
    const seg = 18, rings = 12;
    for (let j = 0; j < rings; j++) {
      for (let i = 0; i < seg; i++) {
        const pt = (ii, jj) => {
          const th = (jj / rings) * PI, ph = (ii / seg) * PI * 2;
          const n = [S(th) * S(ph), C(th), S(th) * C(ph)];
          return n;
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
          return rgb(atEdge ? 0x3c1e16 : 0xa86448);
        });
        b.quad(q[0].p, q[1].p, q[2].p, q[3].p, cols, null, q.map(v => v.n));
      }
    }
    return b;
  }

  function buildTeeth(b, lower) {
    const n = 12;
    const R = 0.04, h = 0.015;
    for (let i = 0; i < n; i++) {
      const a0 = lerp(-0.95, 0.95, i / n), a1 = lerp(-0.95, 0.95, (i + 1) / n);
      const shade = 0.92 + 0.08 * ((i % 2) ? 1 : 0);
      const col = [0.91 * shade, 0.88 * shade, 0.8 * shade, 0.08];
      const y0 = lower ? -h : 0, y1 = lower ? 0 : h;
      const p = (a, y, rr) => [S(a) * rr, y, C(a) * rr];
      b.quad(p(a0, y0, R), p(a1, y0, R), p(a1, y1, R), p(a0, y1, R), col, null, [[S(a0), 0, C(a0)], [S(a1), 0, C(a1)], [S(a1), 0, C(a1)], [S(a0), 0, C(a0)]]);
      const ye = lower ? y1 : y0;
      b.quad(p(a0, ye, R), p(a1, ye, R), p(a1, ye, R - 0.008), p(a0, ye, R - 0.008), col);
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
          return [S(y) * C(p) * 0.065, S(p) * 0.042, C(y) * C(p) * 0.036];
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
    b.push(M4.rotY(k * 0.25), M4.rotZ(-k * 0.12));
    b.ellipsoid(0.009, 0.029, 0.02, 10, 8, COL.skin);
    b.at(k * 0.003, 0.002, 0.003, h => h.ellipsoid(0.007, 0.019, 0.012, 8, 6, 0x9c5a44));
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
    const lipC = basePt(0, lipP(0));
    const P = {
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
      eye: mk(b => buildEyeMesh(b)),
      lidU: mk(b => buildLid(b, true)),
      lidD: mk(b => buildLid(b, false)),
      eyes: eyeFrames(T),
      teethU: mk(b => buildTeeth(b, false)),
      teethL: mk(b => buildTeeth(b, true)),
      cavityU: mk(b => buildCavity(b, false)),
      cavityL: mk(b => buildCavity(b, true)),
      tongue: mk(b => b.ellipsoid(0.03, 0.009, 0.028, 12, 6, COL.tongue)),
      earL: mk(b => buildEar(b, 'L')),
      earR: mk(b => buildEar(b, 'R')),
      ears: [-1, 1].map(s => { const q = rawPt(s * 1.5, 0.05); return [q[0] - s * 0.002, q[1], q[2] - 0.004]; }),
      lip: lipC,
      torso: mk(b => buildTorso(b)),
      collar: mk(b => buildCollar(b)),
      caps: mk(b => buildShoulderCaps(b)),
      band: mk(b => buildBandolier(b)),
      hips: mk(b => buildHips(b)),
      upperL: mk(b => buildUpper(b, 'L', team)),
      upperR: mk(b => buildUpper(b, 'R', team)),
      fore: mk(b => buildFore(b)),
      thigh: mk(b => buildThigh(b)),
      shin: mk(b => buildShin(b)),
      foot: mk(b => buildFoot(b)),
      hands: {},
      r
    };
    return P;
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
    const bot = M4.mul(m.chest, M4.translate(0, 0.53, -0.005));
    const top = M4.mul(m.head, M4.translate(0, -0.13, -0.02));
    const shape = [[0.155, 0.138, 0], [0.15, 0.132, 0.005], [0.145, 0.127, 0.012], [0.141, 0.122, 0.018], [0.137, 0.118, 0.022], [0.132, 0.114, 0.024], [0.126, 0.108, 0.022], [0.118, 0.1, 0.018]];
    const pts = [];
    for (let j = 0; j < NR; j++) {
      const f = j / (NR - 1);
      const e = f * f * (3 - 2 * f);
      const ax = (M, c) => [M[c * 4], M[c * 4 + 1], M[c * 4 + 2]];
      const o = V3.lerp(ax(bot, 3), ax(top, 3), f);
      const X = V3.norm(V3.lerp(ax(bot, 0), ax(top, 0), e));
      const Z0 = V3.lerp(ax(bot, 2), ax(top, 2), e);
      const Y = V3.norm(V3.cross(Z0, X));
      const Z = V3.cross(X, Y);
      const [rx, rz, cz] = shape[j];
      const row = [];
      for (let i = 0; i <= NS; i++) {
        const a = (i / NS) * PI * 2 + PI;
        const lx = S(a) * rx, lz = cz + C(a) * rz;
        const p = V3.add(o, V3.add(V3.mul(X, lx), V3.mul(Z, lz)));
        const n = V3.norm(V3.add(V3.mul(X, S(a) / rx), V3.mul(Z, C(a) / rz)));
        row.push({ p, n, front: C(a) });
      }
      pts.push(row);
    }
    let w = 0;
    pts.forEach((row, j) => {
      const f = j / (NR - 1);
      row.forEach(v => {
        const stub = clamp((f - 0.15) / 0.55, 0, 1) * clamp(v.front * 0.9 + 0.75, 0, 1);
        const base = rgb(COL.skin);
        const sc = [lerp(base[0], 0.5, stub * 0.62), lerp(base[1], 0.36, stub * 0.62), lerp(base[2], 0.34, stub * 0.62)];
        data.set([v.p[0], v.p[1], v.p[2], v.n[0], v.n[1], v.n[2], sc[0], sc[1], sc[2], 0, 0, 0], w);
        w += 12;
      });
    });
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
      fx.draw(P.caps, W(m.chest), cloth);
      fx.draw(P.band, W(m.chest), Object.assign({}, cloth, { spec: [0.35, 18] }));
      fx.draw(P.hips, W(m.pelvis), cloth);
      [['L', P.upperL], ['R', P.upperR]].forEach(([s, up]) => {
        fx.draw(up, W(m['upper' + s]), skin);
        fx.draw(P.fore, W(m['fore' + s]), skin);
        const hand = st.hands && st.hands[s];
        const HM = hand && hand.M ? hand.M : m['hand' + s];
        fx.draw(handMesh(P, s, (hand && hand.pose) || 'relax'), W(HM), skin);
        if (!o.noLegs) {
          fx.draw(P.thigh, W(m['thigh' + s]), cloth);
          fx.draw(P.shin, W(m['shin' + s]), cloth);
          fx.draw(P.foot, W(m['foot' + s]), cloth);
        }
      });
    }
    updateNeck(P, m);
    fx.draw(P.neck, pre || null, skin);
    deformHead(P.T, F, { pos: P.headPos, data: P.headData });
    P.head.update(P.headData);
    const H = W(m.head);
    fx.draw(P.head, H, Object.assign({ texture: P.faceTex, backDark: true }, skin));
    const jaw = clamp(F.jaw || 0, 0, 1.2) * 0.34;
    const JM = M4.chain(H, M4.translate(HINGE[0], HINGE[1], HINGE[2]), M4.rotX(jaw), M4.translate(-HINGE[0], -HINGE[1], -HINGE[2]));
    const lip = P.lip;
    const wide = clamp((F.wide || 0) + (F.smile || 0) * 0.4, 0, 1.2);
    const dark = { rim: 0, spec: [0, 1] };
    fx.draw(P.cavityU, M4.chain(H, M4.translate(0, lip[1] - 0.008, lip[2] - 0.05)), dark);
    fx.draw(P.cavityL, M4.chain(JM, M4.translate(0, lip[1] - 0.016, lip[2] - 0.05)), dark);
    fx.draw(P.tongue, M4.chain(JM, M4.translate(0, lip[1] - 0.024, lip[2] - 0.042)), { rim: 0.1, spec: [0.3, 12] });
    fx.draw(P.teethU, M4.chain(H, M4.translate(0, lip[1] - 0.0045 + wide * 0.002, lip[2] - 0.047)), { spec: [0.4, 20], rim: 0.1 });
    fx.draw(P.teethL, M4.chain(JM, M4.translate(0, lip[1] + 0.003 - wide * 0.002, lip[2] - 0.049)), { spec: [0.4, 20], rim: 0.1 });
    P.ears.forEach((q, i) => fx.draw(i ? P.earR : P.earL, M4.chain(H, M4.translate(q[0], q[1], q[2])), skin));
    const look = F.look || [0, 0];
    const blink = clamp(F.blink || 0, 0, 1);
    const lidU = F.lidU === undefined ? 0.55 : F.lidU;
    const lidL = F.lidL === undefined ? 0.35 : F.lidL;
    const upEdge = lerp(lerp(-0.05, 0.6, lidU) - (F.browDown || 0) * 0.12, -0.12, blink);
    const loEdge = lerp(lerp(-0.6, -0.12, lidL) + (F.smile || 0) * 0.12, -0.14, blink * 0.6);
    P.eyes.forEach(f => {
      const EM = M4.mul(H, frameM(f));
      const ball = M4.chain(EM, M4.rotY(clamp(look[0], -0.5, 0.5)), M4.rotX(-clamp(look[1], -0.4, 0.4)), M4.scale(EYE_R, EYE_R, EYE_R));
      fx.draw(P.eye, ball, Object.assign({ texture: P.eyeTex }, EYE_MAT, tint));
      const lidS = M4.scale(EYE_R, EYE_R, EYE_R);
      const lidMat = Object.assign({ spec: [0.08, 8], rim: 0.15 }, tint);
      fx.draw(P.lidU, M4.chain(EM, M4.rotX(-upEdge), lidS), lidMat);
      fx.draw(P.lidD, M4.chain(EM, M4.rotX(-Math.min(loEdge, upEdge - 0.02)), lidS), lidMat);
    });
  }

  function headPoint(m, local) {
    return M4.point(m.head, local);
  }

  window.MeetHeavy = { D, COL, HAND_POSES, CHANNELS, build, solve, draw, handBasis, handMesh, bullet, torsoSurf, headPoint, lipP, basePt, rawPt, eyeInfo: eyeFrames, EYE_R };
})();
