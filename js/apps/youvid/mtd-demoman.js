(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Rig = window.YouVidRig;

  const D = { chestY: 0.12, neckY: 0.45, headY: 0.12, shX: 0.27, shY: 0.37, upper: 0.29, fore: 0.27, hipX: 0.13, hipY: -0.06, thigh: 0.4, shin: 0.4 };

  const COL = {
    skin: 0x5c3a2b, skinHi: 0x7e5240, lip: 0x4c2a22, mouth: 0x220b09, tongue: 0x9a5258,
    shirt: 0xbe3c32, shirtDk: 0x8e2a24, cuff: 0xd9d3c4, cuffDk: 0xb4ad9c,
    vest: 0x46443d, vestDk: 0x32312c, vestHi: 0x57554b, collar: 0x42413a, collarIn: 0x2a2926, strap: 0x6c6a5c, buckle: 0x8a8476,
    scarf: 0xc94a3c, scarfDk: 0x9a3229, pipe: 0x9a9a86, pipeDk: 0x6c6c5e, band: 0xf0902c, pouch: 0x5a5850, pouchDk: 0x45433d,
    pants: 0xb04840, pantsDk: 0x8a3830, boot: 0x2e2622, sole: 0x191411, belt: 0x2c241f, beltBuckle: 0x8a8070,
    beanie: 0x45423f, beanieRib: 0x43403d, beanieDk: 0x363431, patch: 0x181614, patchRim: 0x2a2624, emblem: 0xf0a040, emblemDk: 0xb4382f, sclera: 0xe6ded4
  };

  const SKIN_MAT = { spec: [0.24, 10], rim: 1.15 };
  const CLOTH_MAT = { spec: [0.05, 5], rim: 0.85 };
  const KNIT_MAT = { spec: [0.03, 4], rim: 0.75 };
  const PATCH_MAT = { spec: [0.5, 24], rim: 0.35 };
  const PIPE_MAT = { spec: [0.3, 16], rim: 0.6 };
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

  const YT = table([[-1.571, -0.182], [-1.25, -0.18], [-0.95, -0.172], [-0.75, -0.154], [-0.55, -0.118], [-0.42, -0.09], [-0.3, -0.068], [-0.2, -0.05],
    [-0.1, -0.032], [0.0, -0.013], [0.12, 0.011], [0.24, 0.034], [0.42, 0.062], [0.6, 0.086], [0.8, 0.105], [1.1, 0.122], [1.35, 0.13], [1.571, 0.133]]);
  const HW = table([[-1.571, 0.036], [-1.25, 0.045], [-0.95, 0.058], [-0.75, 0.075], [-0.55, 0.09], [-0.3, 0.1], [-0.1, 0.105], [0.1, 0.106], [0.3, 0.105],
    [0.5, 0.104], [0.7, 0.098], [0.9, 0.087], [1.1, 0.07], [1.35, 0.042], [1.571, 0.0]]);
  const DF = table([[-1.571, 0.03], [-1.25, 0.066], [-0.95, 0.098], [-0.75, 0.114], [-0.55, 0.11], [-0.42, 0.108], [-0.3, 0.11], [-0.2, 0.112], [-0.1, 0.11],
    [0.0, 0.107], [0.12, 0.104], [0.24, 0.108], [0.42, 0.104], [0.6, 0.1], [0.8, 0.092], [1.1, 0.074], [1.35, 0.045], [1.571, 0.0]]);
  const DB = table([[-1.571, 0.02], [-1.0, 0.06], [-0.6, 0.092], [-0.2, 0.11], [0.2, 0.12], [0.6, 0.118], [1.0, 0.098], [1.3, 0.064], [1.571, 0.0]]);
  const SQ = table([[-1.571, 0.0], [-1.1, 0.04], [-0.8, 0.08], [-0.5, 0.1], [-0.2, 0.1], [0.2, 0.12], [0.5, 0.14], [0.8, 0.08], [1.1, 0.02], [1.571, 0.0]]);

  const NU = 64, NL = 16, NUP = 30, MW = 0.36;
  const HINGE = [0, -0.02, -0.01];
  const EYE_R = 0.0185;
  const EYE_A = -0.3, EYE_P = 0.12;
  const PATCH = { a: 0.32, p: 0.11, ra: 0.25, rp: 0.155, tilt: 0.1 };
  const HEAD_SCALE = 1.17;
  const CHANNELS = ['smileL', 'smileR', 'wide', 'round', 'frown', 'press', 'sneer', 'browDown', 'browUp'];

  const g2 = (x, s) => Math.exp(-(x / s) * (x / s));
  const smooth = (e0, e1, x) => { const k = clamp((x - e0) / (e1 - e0), 0, 1); return k * k * (3 - 2 * k); };

  function lipP(a) {
    const q = a / 0.44;
    return -0.3 - 0.02 * Math.min(q * q, 1.6);
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
    h += 0.062 * g2(a, 0.15) * g2(p + 0.075, 0.075);
    h += 0.028 * g2(a, 0.075) * smooth(-0.08, 0.04, p) * (1 - smooth(0.16, 0.27, p));
    h += 0.03 * g2(A - 0.15, 0.07) * g2(p + 0.115, 0.045);
    h -= 0.006 * g2(A - 0.075, 0.03) * g2(p + 0.135, 0.025);
    h += 0.02 * g2(A - 0.29, 0.2) * g2(p - 0.255, 0.045);
    h += 0.008 * g2(a, 0.09) * g2(p - 0.23, 0.05);
    h -= 0.008 * g2(A - 0.3, 0.12) * g2(p - 0.12, 0.07) * (a > 0 ? 1 : 0);
    h += 0.012 * g2(A - 0.58, 0.18) * g2(p - 0.02, 0.09);
    h -= 0.006 * g2(A - 0.62, 0.2) * g2(p + 0.22, 0.1);
    h += 0.007 * g2(a, 0.36) * g2(dl - 0.045, 0.028);
    h += 0.004 * g2(a, 0.3) * g2(dl - 0.02, 0.02) * (1 - smooth(MW, MW + 0.08, A));
    h += 0.006 * g2(a, 0.28) * g2(dl + 0.035, 0.028);
    h -= 0.006 * g2(segDist(A, p, 0.16, -0.09, 0.42, lipP(0.42) - 0.01), 0.024);
    h += 0.016 * g2(a, 0.36) * g2(p + 0.66, 0.13);
    h += 0.008 * g2(A - 0.85, 0.3) * g2(p + 0.52, 0.16);
    h += 0.004 * g2(A - 0.4, 0.1) * g2(dl + 0.06, 0.06);
    h -= 0.004 * g2(a, 0.05) * g2(p + 0.2, 0.04);
    h -= 0.008 * g2(A - 0.55, 0.22) * g2(p - 0.4, 0.15);
    return h;
  }

  function eyeFrame(s) {
    const a = s * Math.abs(EYE_A), p = EYE_P;
    const q = rawPt(a, p);
    const n = approxNormal(a, p);
    const c = V3.sub(q, V3.mul(n, EYE_R * 0.9));
    const z = V3.norm([s * 0.12, 0.03, 1]);
    const x = V3.norm(V3.cross([0, 1, 0], z));
    const y = V3.cross(z, x);
    return { side: s, c, x, y, z };
  }

  const EYE = eyeFrame(-1);

  function eyeWrap(q) {
    const f = EYE;
    const d = V3.sub(q, f.c);
    const lx = V3.dot(d, f.x), ly = V3.dot(d, f.y), lz = V3.dot(d, f.z);
    const r = Math.hypot(lx, ly, lz);
    if (lz <= 0 || r > EYE_R * 4.2) return q;
    const psi = Math.atan2(lx, lz), phi = Math.atan2(ly, Math.hypot(lx, lz));
    const e = Math.sqrt((psi / 1.22) * (psi / 1.22) + (phi / 0.92) * (phi / 0.92));
    let nr;
    if (e <= 1) {
      const wr = 1 - smooth(1.3, 2.0, r / EYE_R);
      if (wr <= 0) return q;
      nr = lerp(r, EYE_R * 0.88, wr);
    } else {
      const w = 1 - smooth(0, 1, (e - 1) / 0.6);
      if (w <= 0 || r >= EYE_R * 1.13) return q;
      nr = lerp(r, EYE_R * 1.13, w);
    }
    return V3.add(f.c, V3.mul(d, nr / r));
  }

  function basePt(a, p) {
    return eyeWrap(V3.add(rawPt(a, p), V3.mul(approxNormal(a, p), relief(a, p))));
  }

  function deltas(a, p) {
    const A = Math.abs(a), sg = Math.sign(a) || 1;
    const dl = p - lipP(a);
    const inMouth = 1 - smooth(MW - 0.02, MW + 0.1, A);
    const out = {};
    const gC = g2(A - MW, 0.13) * g2(dl, 0.085);
    const gK = g2(A - 0.48, 0.16) * g2(p + 0.1, 0.11);
    const gL = g2(A - 0.3, 0.15) * g2(p - 0.06, 0.05) * (a < 0 ? 1 : 0);
    const smile = [sg * (0.006 * gC + 0.002 * gK), 0.011 * gC + 0.006 * gK + 0.003 * gL, -0.005 * gC + 0.004 * gK + 0.001 * gL];
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
    const gB = g2(A - 0.24, 0.2) * g2(p - 0.26, 0.09) * smooth(0.15, 0.22, p);
    const gG = g2(a, 0.08) * g2(p - 0.22, 0.06);
    out.browDown = [-sg * 0.003 * gB, -0.008 * gB - 0.002 * gG, 0.003 * gB - 0.002 * gG];
    const gU = g2(A - 0.25, 0.26) * g2(p - 0.29, 0.13);
    out.browUp = [0, 0.011 * gU, -0.001 * gU];
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
    const jaw = clamp(F.jaw || 0, 0, 1.25) * 0.32;
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

  function beardOutline() {
    const pts = [];
    const n = 72;
    for (let i = 0; i <= n; i++) {
      const a = lerp(-1.42, 1.42, i / n);
      const A = Math.abs(a);
      let p;
      if (A < 0.2) p = lipP(a) + 0.115 - 0.02 * (A / 0.2);
      else if (A < 0.36) p = lerp(lipP(0.2) + 0.095, lipP(0.36) + 0.05, (A - 0.2) / 0.16);
      else if (A < 0.46) p = lerp(lipP(0.36) + 0.05, -0.52, (A - 0.36) / 0.1);
      else if (A < 0.95) p = lerp(-0.52, -0.42, (A - 0.46) / 0.49);
      else if (A < 1.3) p = lerp(-0.42, -0.08, (A - 0.95) / 0.35);
      else p = lerp(-0.08, 0.05, (A - 1.3) / 0.12);
      pts.push([a, p]);
    }
    return pts;
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
    ctx.fillStyle = '#684230';
    ctx.fillRect(0, 0, W, H);
    const vg = ctx.createLinearGradient(0, 0, 0, H);
    vg.addColorStop(0, 'rgba(140,92,66,0.35)');
    vg.addColorStop(0.45, 'rgba(140,92,66,0)');
    vg.addColorStop(0.75, 'rgba(40,20,14,0)');
    vg.addColorStop(1, 'rgba(40,20,14,0.25)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    [-1, 1].forEach(s => {
      blob(s * 0.58, 0.02, 0.2, 0.1, '150,92,66', 0.32);
      blob(s * 1.45, 0.08, 0.12, 0.14, '120,66,48', 0.3);
      blob(s * 0.3, 0.32, 0.22, 0.1, '150,100,74', 0.22);
    });
    blob(0, -0.05, 0.1, 0.07, '160,100,74', 0.4);
    blob(0, 0.08, 0.05, 0.08, '150,96,70', 0.25);
    blob(EYE_A, EYE_P, 0.17, 0.09, '40,20,14', 0.45);
    blob(EYE_A, EYE_P + 0.06, 0.18, 0.05, '30,16,12', 0.35);
    const g = rand(311);
    const off = document.createElement('canvas');
    off.width = W;
    off.height = H;
    const oc = off.getContext('2d');
    const outline = beardOutline();
    const region = (c, grow) => {
      c.beginPath();
      outline.forEach(([a, p], i) => {
        const [x, y] = P(a, p + (grow || 0));
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      });
      c.lineTo(...P(1.42, -1.2));
      c.lineTo(...P(-1.42, -1.2));
      c.closePath();
    };
    oc.filter = 'blur(10px)';
    region(oc, 0.05);
    oc.fillStyle = 'rgba(46,30,24,0.4)';
    oc.fill();
    oc.filter = 'blur(3px)';
    region(oc, 0);
    oc.fillStyle = 'rgba(30,21,18,0.94)';
    oc.fill();
    oc.filter = 'none';
    oc.save();
    region(oc, 0);
    oc.clip();
    for (let i = 0; i < 26000; i++) {
      const x = g() * W, y = P(0, 0.1)[1] + g() * (H - P(0, 0.1)[1]);
      oc.fillStyle = `rgba(${g() < 0.6 ? '20,14,12' : '70,52,44'},${0.12 + g() * 0.25})`;
      oc.fillRect(x, y, 1.4, 2.2);
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
      ctx.lineTo(...P(a, lipP(a) - 0.005 - 0.03 * k));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(92,52,44,0.85)';
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
    ctx.fillStyle = 'rgba(70,40,34,0.7)';
    ctx.fill();
    ctx.restore();
    [-1, 1].forEach(s => blob(s * 0.07, -0.118, 0.02, 0.011, '26,12,10', 0.75));
    ctx.strokeStyle = 'rgba(20,10,8,0.95)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = lerp(-MW, MW, i / 40);
      const [x, y] = P(a, lipP(a));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(24,16,14,0.95)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
      const a = lerp(-0.08, -0.48, i / 14);
      const p = 0.235 + 0.035 * S((i / 14) * PI * 0.85) - 0.02 * (i / 14);
      const [x, y] = P(a, p);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(40,26,20,0.55)';
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = 'rgba(30,16,12,0.35)';
    ctx.lineWidth = 2.5;
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.moveTo(...P(s * 0.17, -0.09));
      ctx.quadraticCurveTo(...P(s * 0.3, -0.16), ...P(s * 0.4, lipP(0.4) - 0.01));
      ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(40,22,16,0.25)';
    ctx.lineWidth = 2;
    [0.36, 0.42].forEach(p => {
      ctx.beginPath();
      ctx.moveTo(...P(-0.3, p - 0.01));
      ctx.quadraticCurveTo(...P(0, p + 0.012), ...P(0.3, p - 0.01));
      ctx.stroke();
    });
  }

  function paintEye(ctx, W, H) {
    ctx.fillStyle = '#e8e0d6';
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = W * 0.22;
    const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
    g.addColorStop(0, '#8a5a34');
    g.addColorStop(0.6, '#6a4022');
    g.addColorStop(0.92, '#3c2414');
    g.addColorStop(1, '#22140c');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b0807';
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.42, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(cx - R * 0.3, cy - R * 0.32, R * 0.15, 0, PI * 2);
    ctx.fill();
    const e = ctx.createRadialGradient(cx, cy, W * 0.3, cx, cy, W * 0.5);
    e.addColorStop(0, 'rgba(150,100,90,0)');
    e.addColorStop(1, 'rgba(150,100,90,0.45)');
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
      const slope = (((r0.rx + r0.rz) - (r1.rx + r1.rz)) / 2) / dy * (o.flip ? -1 : 1);
      for (let i = 0; i < sides; i++) {
        if (o.skip && o.skip(i / sides, j)) continue;
        const u0 = i / sides, u1 = (i + 1) / sides;
        const v0 = (r0.y - y0) / (y1 - y0), v1 = (r1.y - y0) / (y1 - y0);
        const cols = colAt ? [colAt(u0, r0.y), colAt(u1, r0.y), colAt(u1, r1.y), colAt(u0, r1.y)] : [0xffffff, 0xffffff, 0xffffff, 0xffffff];
        const ns = [nrm(r0, i, slope), nrm(r0, i + 1, slope), nrm(r1, i + 1, slope), nrm(r1, i, slope)].map(n => (o.flip ? V3.mul(n, -1) : n));
        b.quad(pt(r0, i), pt(r0, i + 1), pt(r1, i + 1), pt(r1, i), cols.map(c => rgb(c)), [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], ns);
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
    [-0.2, 0.22, 0.17, 0.012], [-0.12, 0.234, 0.18, 0.022], [-0.02, 0.246, 0.188, 0.028], [0.08, 0.258, 0.186, 0.026], [0.18, 0.27, 0.178, 0.016],
    [0.27, 0.276, 0.17, 0.006], [0.34, 0.27, 0.16, -0.004], [0.39, 0.252, 0.148, -0.01], [0.425, 0.208, 0.13, -0.012], [0.45, 0.156, 0.114, -0.01], [0.468, 0.124, 0.104, -0.006]
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

  function paintTorso(ctx, W, H) {
    const y0 = TORSO[0].y, y1 = TORSO[TORSO.length - 1].y;
    const Y = (y) => (1 - (y - y0) / (y1 - y0)) * H;
    const U = (ang) => ((ang + PI) / (2 * PI)) * W;
    ctx.fillStyle = '#46443d';
    ctx.fillRect(0, 0, W, H);
    const fold = ctx.createLinearGradient(0, 0, W, 0);
    fold.addColorStop(0, 'rgba(0,0,0,0.16)');
    fold.addColorStop(0.5, 'rgba(255,255,255,0.04)');
    fold.addColorStop(1, 'rgba(0,0,0,0.16)');
    ctx.fillStyle = fold;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#4e4c44';
    ctx.fillRect(U(-0.42), Y(0.33), U(0.42) - U(-0.42), Y(-0.02) - Y(0.33));
    ctx.strokeStyle = 'rgba(28,26,22,0.7)';
    ctx.lineWidth = 3;
    ctx.strokeRect(U(-0.42), Y(0.33), U(0.42) - U(-0.42), Y(-0.02) - Y(0.33));
    ctx.beginPath();
    ctx.moveTo(U(-0.42), Y(0.16));
    ctx.lineTo(U(0.42), Y(0.16));
    ctx.stroke();
    ctx.fillStyle = '#3c3a34';
    ctx.fillRect(0, Y(-0.06), W, Y(-0.1) - Y(-0.06));
    ctx.strokeStyle = 'rgba(150,140,120,0.35)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(U(-0.39), Y(0.31), U(0.39) - U(-0.39), Y(0.0) - Y(0.31));
    ctx.setLineDash([]);
    ctx.fillStyle = '#c94a3c';
    ctx.beginPath();
    ctx.moveTo(U(-0.3), Y(0.47));
    ctx.lineTo(U(0), Y(0.36));
    ctx.lineTo(U(0.3), Y(0.47));
    ctx.closePath();
    ctx.fill();
    const g = rand(9);
    for (let i = 0; i < 3200; i++) {
      ctx.fillStyle = `rgba(${g() < 0.5 ? '0,0,0' : '255,255,255'},${g() * 0.05})`;
      ctx.fillRect(g() * W, g() * H, 2, 2);
    }
    ctx.strokeStyle = 'rgba(20,18,16,0.5)';
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

  const COLLAR = [
    { y: 0.34, rx: 0.245, rz: 0.172, cz: -0.008, open: 0.07 },
    { y: 0.4, rx: 0.205, rz: 0.156, cz: -0.012, open: 0.082 },
    { y: 0.45, rx: 0.186, rz: 0.152, cz: -0.014, open: 0.1 },
    { y: 0.5, rx: 0.19, rz: 0.16, cz: -0.016, open: 0.125 },
    { y: 0.55, rx: 0.205, rz: 0.176, cz: -0.018, open: 0.15 },
    { y: 0.585, rx: 0.218, rz: 0.19, cz: -0.02, open: 0.17 }
  ];

  function buildCollar(b) {
    const n = 28, T = 0.024;
    const ang = (r, i) => lerp(r.open * PI * 2, PI * 2 - r.open * PI * 2, i / n);
    const P = (r, a, inset) => [S(a) * (r.rx - inset), r.y, r.cz + C(a) * (r.rz - inset)];
    const Nr = (r, a) => V3.norm([S(a) / r.rx, 0.1, C(a) / r.rz]);
    const outer = (y) => rgb(y > 0.57 ? COL.vestHi : COL.collar);
    for (let j = 0; j < COLLAR.length - 1; j++) {
      const r0 = COLLAR[j], r1 = COLLAR[j + 1];
      for (let i = 0; i < n; i++) {
        const a00 = ang(r0, i), a01 = ang(r0, i + 1), a10 = ang(r1, i), a11 = ang(r1, i + 1);
        b.quad(P(r0, a00, 0), P(r0, a01, 0), P(r1, a11, 0), P(r1, a10, 0), [outer(r0.y), outer(r0.y), outer(r1.y), outer(r1.y)], null, [Nr(r0, a00), Nr(r0, a01), Nr(r1, a11), Nr(r1, a10)]);
        const ni = (r, a) => V3.mul(Nr(r, a), -1);
        b.quad(P(r0, a01, T), P(r0, a00, T), P(r1, a10, T), P(r1, a11, T), rgb(COL.collarIn), null, [ni(r0, a01), ni(r0, a00), ni(r1, a10), ni(r1, a11)]);
      }
      [0, n].forEach(i => {
        const e0 = ang(r0, i), e1 = ang(r1, i);
        const side = i === 0 ? 1 : -1;
        const nn = V3.norm([C(e0) * side, 0, -S(e0) * side]);
        b.quad(P(r0, e0, 0), P(r1, e1, 0), P(r1, e1, T), P(r0, e0, T), rgb(COL.vestHi), null, [nn, nn, nn, nn]);
      });
    }
    const top = COLLAR[COLLAR.length - 1];
    for (let i = 0; i < n; i++) {
      const a0 = ang(top, i), a1 = ang(top, i + 1);
      b.quad(P(top, a0, 0), P(top, a0, T), P(top, a1, T), P(top, a1, 0), rgb(COL.vestHi), null, [N_UP, N_UP, N_UP, N_UP]);
    }
    return b;
  }

  const N_UP = [0, 1, 0];

  function buildScarf(b) {
    const rings = [
      { y: 0.36, rx: 0.15, rz: 0.13, cz: 0.012 },
      { y: 0.4, rx: 0.142, rz: 0.126, cz: 0.016 },
      { y: 0.44, rx: 0.132, rz: 0.12, cz: 0.016 },
      { y: 0.47, rx: 0.122, rz: 0.11, cz: 0.012 }
    ];
    ringLoft(b, rings, 24, (u, y) => (y > 0.46 || y < 0.365 ? COL.scarfDk : COL.scarf), {});
    return b;
  }

  const PIPES = [
    { s: -1, y: 0.3, ang: 0.66, tilt: 0.05 }, { s: -1, y: 0.2, ang: 0.7, tilt: 0.0 }, { s: -1, y: 0.1, ang: 0.74, tilt: -0.12 },
    { s: 1, y: 0.3, ang: 0.66, tilt: 0.05 }, { s: 1, y: 0.2, ang: 0.7, tilt: 0.0 }, { s: 1, y: 0.1, ang: 0.74, tilt: -0.12 }
  ];

  function pipeMesh(b, M) {
    b.push(M);
    b.prism(14, 0.04, 0.04, -0.07, 0.04, 0.04, 0.052, rgb(COL.pipe), { capTop: false, capBottom: true });
    b.prism(14, 0.0415, 0.0415, 0.052, 0.0415, 0.0415, 0.072, rgb(COL.band, 0.15), { capTop: false });
    b.prism(14, 0.04, 0.04, 0.072, 0.036, 0.036, 0.086, rgb(COL.pipe), { capTop: true });
    b.prism(14, 0.038, 0.038, -0.073, 0.038, 0.038, -0.07, rgb(COL.pipeDk));
    b.pop();
  }

  function buildPipes(b) {
    PIPES.forEach(q => {
      const ang = q.s * q.ang;
      const p0 = torsoSurf(ang, q.y, 0.03);
      const n = torsoNormal(ang, q.y);
      const out = V3.norm([q.s, q.tilt, 0.25]);
      const y = out;
      let z = V3.sub(n, V3.mul(y, V3.dot(n, y)));
      z = V3.norm(z);
      const x = V3.cross(y, z);
      const M = new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, p0[0], p0[1], p0[2], 1]);
      pipeMesh(b, M);
    });
    return b;
  }

  function buildStraps(b) {
    [-1, 1].forEach(s => {
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const f = i / 16;
        const front = f < 0.55;
        const k = front ? f / 0.55 : (f - 0.55) / 0.45;
        const ang = front ? s * lerp(0.58, 0.42, k) : s * lerp(0.6, PI - 0.5, k);
        const y = front ? lerp(0.03, 0.41, k) : lerp(0.43, 0.02, k);
        pts.push({ ang, y });
      }
      for (let i = 0; i < pts.length - 1; i++) {
        const q0 = pts[i], q1 = pts[i + 1];
        const p0 = torsoSurf(q0.ang, q0.y, 0.01), p1 = torsoSurf(q1.ang, q1.y, 0.01);
        const n0 = torsoNormal(q0.ang, q0.y), n1 = torsoNormal(q1.ang, q1.y);
        const t = V3.norm(V3.sub(p1, p0));
        const w0 = V3.mul(V3.norm(V3.cross(n0, t)), 0.03), w1 = V3.mul(V3.norm(V3.cross(n1, t)), 0.03);
        b.quad(V3.sub(p0, w0), V3.add(p0, w0), V3.add(p1, w1), V3.sub(p1, w1), COL.strap, null, [n0, n0, n1, n1]);
      }
    });
    return b;
  }

  function buildShoulderCaps(b) {
    [-1, 1].forEach(s => {
      b.at(s * 0.232, 0.375, -0.01, h => {
        h.push(M4.rotZ(-s * 0.55));
        h.ellipsoid(0.085, 0.05, 0.11, 16, 10, COL.vest);
        h.pop();
      });
    });
    return b;
  }

  function limbRings(len, keys, col) {
    return keys.map(([f, r, rz, cz]) => ({ y: -len * f, rx: r, rz: rz || r, cz: cz || 0, col })).reverse();
  }

  function buildUpper(b, side) {
    const len = D.upper;
    const rings = limbRings(len, [[-0.12, 0.074], [0, 0.092, 0.096], [0.15, 0.098, 0.102, 0.006], [0.35, 0.096, 0.098, 0.008], [0.6, 0.088, 0.09, 0.006], [0.85, 0.08, 0.082], [1.0, 0.076, 0.076], [1.1, 0.072, 0.072]]);
    ringLoft(b, rings, 16, () => COL.shirt, { capTop: true });
    const k = side === 'L' ? 1 : -1;
    b.at(k * 0.1, -len * 0.24, 0.004, h => {
      h.push(M4.rotY(k * PI / 2));
      K.discXY(h, 0, 0, 0, 0.05, 18, rgb(COL.emblem));
      K.discXY(h, 0, 0, 0.001, 0.036, 18, rgb(COL.emblemDk));
      K.discXY(h, 0, 0, 0.002, 0.014, 12, rgb(COL.emblem));
      h.at(0, 0, 0.0015, q => q.box(0.01, 0.072, 0.002, rgb(COL.emblem)));
      h.at(0, 0, 0.0015, q => q.box(0.072, 0.01, 0.002, rgb(COL.emblem)));
      h.pop();
    });
    return b;
  }

  function buildFore(b) {
    const len = D.fore;
    const sleeve = limbRings(len, [[-0.12, 0.078], [0.0, 0.084], [0.12, 0.086], [0.4, 0.078, 0.074], [0.7, 0.066, 0.062], [0.86, 0.06, 0.056], [0.9, 0.064, 0.06], [0.95, 0.063, 0.059]]);
    ringLoft(b, sleeve, 16, (u, y) => (-y / len > 0.86 ? COL.cuffDk : COL.cuff), { capTop: true, capBottom: true });
    const wrist = limbRings(len, [[0.9, 0.05, 0.046], [1.0, 0.048, 0.042], [1.06, 0.044, 0.04]]);
    ringLoft(b, wrist, 12, () => COL.skin, { capBottom: true });
    return b;
  }

  const HAND_POSES = {
    relax: { curl: [0.32, 0.4, 0.46, 0.52], spread: 0.15, thumb: [0.45, 0.35] },
    fist: { curl: [1, 1, 1, 1], spread: 0, thumb: [0.15, 0.95] },
    grip: { curl: [0.74, 0.77, 0.8, 0.82], spread: 0.05, thumb: [0.65, 0.55] },
    point: { curl: [0.02, 1, 1, 1], spread: 0.05, thumb: [0.25, 0.85] },
    open: { curl: [0.08, 0.08, 0.1, 0.14], spread: 0.6, thumb: [0.85, 0.12] },
    claw: { curl: [0.5, 0.55, 0.58, 0.62], spread: 0.45, thumb: [0.7, 0.35] },
    rest: { curl: [0.24, 0.28, 0.32, 0.36], spread: 0.18, thumb: [0.5, 0.2] },
    bottle: { curl: [0.62, 0.66, 0.7, 0.74], spread: 0.04, thumb: [0.9, 0.45] },
    drape: { curl: [0.42, 0.48, 0.52, 0.56], spread: 0.1, thumb: [0.35, 0.2] },
    press: { curl: [0.55, 0.85, 0.9, 0.92], spread: 0.05, thumb: [0.35, 0.15] }
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

  function buildHandMesh(b, side, poseName) {
    const k = side === 'L' ? 1 : -1;
    const pose = HAND_POSES[poseName] || HAND_POSES.relax;
    const base = COL.skin;
    const tip = 0x6e4634;
    b.push(M4.scale(1.2, 1.2, 1.2));
    palm(b, (q) => (q[2] > 0.012 ? 0x6a4332 : base));
    const xs = [0.034, 0.012, -0.011, -0.032];
    const lens = [0.086, 0.092, 0.087, 0.07];
    const rads = [0.0124, 0.013, 0.0124, 0.011];
    const spreads = [0.13, 0.03, -0.06, -0.16];
    xs.forEach((x, f) => {
      const c = pose.curl[f];
      const L = lens[f], r = rads[f];
      const l1 = L * 0.44, l2 = L * 0.31, l3 = L * 0.25;
      b.push(M4.translate(k * x, -0.1 + Math.abs(x) * 0.12, 0.002), M4.rotZ(k * spreads[f] * (0.4 + pose.spread)), M4.rotX(-(c * 1.45 + 0.06)));
      b.at(0, 0, 0, h => h.ellipsoid(r * 1.18, r * 1.12, r * 1.06, 8, 5, base));
      fingerSegment(b, l1, r * 1.04, r, base);
      b.push(M4.translate(0, -l1, 0), M4.rotX(-c * 1.65));
      fingerSegment(b, l2, r, r * 0.95, base);
      b.push(M4.translate(0, -l2, 0), M4.rotX(-c * 1.05));
      fingerSegment(b, l3, r * 0.95, r * 0.84, base, tip);
      b.pop();
      b.pop();
      b.pop();
    });
    const [ab, tc] = pose.thumb;
    b.push(M4.translate(k * 0.045, -0.03, 0.012), M4.rotY(k * (0.35 + ab * 0.5)), M4.rotZ(k * (0.55 + ab * 0.45)), M4.rotX(-0.3 - ab * 0.4));
    b.at(0, 0, 0, h => h.ellipsoid(0.019, 0.022, 0.018, 8, 5, base));
    fingerSegment(b, 0.036, 0.0158, 0.015, base);
    b.push(M4.translate(0, -0.036, 0), M4.rotX(-tc * 0.9));
    fingerSegment(b, 0.03, 0.015, 0.0142, base);
    b.push(M4.translate(0, -0.03, 0), M4.rotX(-tc * 0.8));
    fingerSegment(b, 0.026, 0.0142, 0.0128, base, tip);
    b.pop();
    b.pop();
    b.pop();
    b.pop();
    return b;
  }

  function buildThigh(b) {
    const len = D.thigh;
    ringLoft(b, limbRings(len, [[-0.16, 0.13], [0, 0.132, 0.136], [0.4, 0.124, 0.128], [0.8, 0.106, 0.11], [1.0, 0.096, 0.098], [1.1, 0.09, 0.09]]), 14, () => COL.pants, { capTop: true, capBottom: true });
    return b;
  }

  function buildShin(b) {
    const len = D.shin;
    const col = (u, y) => (-y / len > 0.6 ? COL.boot : COL.pants);
    ringLoft(b, limbRings(len, [[-0.06, 0.096], [0.1, 0.098], [0.4, 0.09], [0.58, 0.084], [0.6, 0.094], [0.66, 0.096], [0.9, 0.09], [1.04, 0.088]]), 14, col, { capTop: true, capBottom: true });
    return b;
  }

  function buildFoot(b) {
    b.at(0, -0.03, 0.06, h => h.ellipsoid(0.078, 0.058, 0.158, 12, 7, COL.boot));
    b.at(0, -0.07, 0.065, h => h.box(0.155, 0.03, 0.3, COL.sole));
    b.at(0, 0.02, -0.005, h => h.prism(12, 0.088, 0.088, -0.06, 0.086, 0.086, 0.07, COL.boot));
    return b;
  }

  function buildHips(b) {
    const rings = [
      { y: -0.19, rx: 0.195, rz: 0.155, cz: -0.004 },
      { y: -0.1, rx: 0.22, rz: 0.175, cz: 0.004 },
      { y: 0.0, rx: 0.222, rz: 0.176, cz: 0.012 },
      { y: 0.07, rx: 0.218, rz: 0.17, cz: 0.012 }
    ];
    ringLoft(b, rings, 22, () => COL.pants, { capBottom: true });
    [-1, 1].forEach(s => b.at(s * 0.125, -0.08, 0.0, h => h.ellipsoid(0.13, 0.13, 0.15, 12, 8, COL.pants)));
    const belt = [{ y: -0.005, rx: 0.228, rz: 0.182, cz: 0.012 }, { y: 0.05, rx: 0.224, rz: 0.178, cz: 0.012 }];
    ringLoft(b, belt, 24, () => COL.belt, {});
    b.at(0, 0.022, 0.198, h => h.box(0.07, 0.05, 0.012, COL.beltBuckle));
    b.push(M4.translate(0, -0.1, 0.19), M4.rotX(0.12));
    b.box(0.17, 0.15, 0.06, COL.pouch);
    b.at(0, 0.05, 0.032, h => h.box(0.172, 0.06, 0.008, COL.pouchDk));
    [-1, 1].forEach(s => b.at(s * 0.05, 0.03, 0.038, h => h.ellipsoid(0.008, 0.008, 0.004, 6, 4, COL.buckle)));
    b.pop();
    [-1, 1].forEach(s => b.at(s * 0.2, -0.04, 0.06, h => { h.push(M4.rotY(s * 0.9)); h.box(0.06, 0.09, 0.04, COL.pouchDk); h.pop(); }));
    return b;
  }

  function buildEar(b, side) {
    const k = side === 'L' ? 1 : -1;
    b.push(M4.rotY(k * 0.3), M4.rotZ(-k * 0.1));
    b.ellipsoid(0.01, 0.027, 0.018, 10, 8, COL.skin);
    b.at(k * 0.003, 0.002, 0.003, h => h.ellipsoid(0.007, 0.017, 0.01, 8, 6, 0x3e2418));
    b.pop();
    return b;
  }

  function buildTeeth(b, lower) {
    const n = 12;
    const R = 0.044, h = 0.014;
    for (let i = 0; i < n; i++) {
      const a0 = lerp(-1.0, 1.0, i / n), a1 = lerp(-1.0, 1.0, (i + 1) / n);
      const gap = 0.012;
      const shade = 0.92 + 0.08 * ((i % 2) ? 1 : 0);
      const col = [0.93 * shade, 0.91 * shade, 0.84 * shade, 0.06];
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
          return [S(y) * C(p) * 0.066, S(p) * 0.042, C(y) * C(p) * 0.038];
        };
        const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
        const shade = q.map(v => rgb([0.15 + v[2] * 1.4, 0.04 + v[2] * 0.4, 0.04 + v[2] * 0.3], 0.35));
        b.quad(q[0], q[1], q[2], q[3], shade, null, q.map(v => V3.norm(V3.mul(v, -1))));
      }
    }
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
          return rgb(atEdge ? 0x140a08 : 0x5a3828);
        });
        b.quad(q[0].p, q[1].p, q[2].p, q[3].p, cols, null, q.map(v => v.n));
      }
    }
    return b;
  }

  function surfAt(a, p, lift) {
    const q = basePt(a, p);
    const n = approxNormal(a, p);
    return { p: V3.add(q, V3.mul(n, lift)), n };
  }

  function buildPatch(b) {
    const rings = 7, seg = 28;
    const pt = (r, i) => {
      const t = (i / seg) * PI * 2;
      const ex = C(t) * r, ey = S(t) * r;
      const a = PATCH.a + ex * PATCH.ra * C(PATCH.tilt) - ey * PATCH.rp * S(PATCH.tilt) * 2.2;
      const p = PATCH.p + ey * PATCH.rp + ex * PATCH.ra * S(PATCH.tilt) * 0.4;
      return surfAt(a, p, 0.0045 + 0.006 * (1 - r * r));
    };
    for (let j = 0; j < rings; j++) {
      for (let i = 0; i < seg; i++) {
        const r0 = j / rings, r1 = (j + 1) / rings;
        const q = [pt(r0, i), pt(r0, i + 1), pt(r1, i + 1), pt(r1, i)];
        const col = j === rings - 1 ? COL.patchRim : COL.patch;
        b.quad(q[0].p, q[3].p, q[2].p, q[1].p, rgb(col), null, [q[0].n, q[3].n, q[2].n, q[1].n]);
      }
    }
    for (let i = 0; i < seg; i++) {
      const a = pt(1, i), c = pt(1, i + 1);
      const ai = V3.sub(a.p, V3.mul(a.n, 0.006)), ci = V3.sub(c.p, V3.mul(c.n, 0.006));
      b.quad(a.p, c.p, ci, ai, rgb(COL.patchRim), null, [a.n, c.n, c.n, a.n]);
    }
    const band = (list, w) => {
      const pts = list.map(([a, p]) => surfAt(a, p, 0.0032));
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], c = pts[i + 1];
        const t = V3.norm(V3.sub(c.p, a.p));
        const s0 = V3.mul(V3.norm(V3.cross(a.n, t)), w), s1 = V3.mul(V3.norm(V3.cross(c.n, t)), w);
        b.quad(V3.sub(a.p, s0), V3.sub(c.p, s1), V3.add(c.p, s1), V3.add(a.p, s0), rgb(COL.patch), null, [a.n, c.n, c.n, a.n]);
      }
    };
    band([[0.2, 0.22], [0.15, 0.28], [0.09, 0.34], [0.02, 0.4], [-0.06, 0.46], [-0.13, 0.52]], 0.0045);
    band([[0.47, 0.15], [0.62, 0.17], [0.8, 0.2], [1.0, 0.23], [1.2, 0.27], [1.4, 0.3]], 0.0045);
    return b;
  }

  function hemP(a) {
    const A = Math.abs(a);
    if (A < 0.6) return 0.335 - 0.02 * (A / 0.6);
    if (A < 1.45) return lerp(0.315, 0.28, (A - 0.6) / 0.85);
    return lerp(0.3, 0.1, clamp((A - 1.45) / 1.6, 0, 1));
  }

  function buildBeanie(b) {
    const n = 48, rows = 14;
    const pt = (i, j) => {
      const a = -PI + (i / n) * PI * 2;
      const h0 = hemP(a);
      const f = j / rows;
      const p = lerp(h0, PI / 2 - 0.0001, Math.pow(f, 0.85));
      const q = rawPt(a, p);
      const nn = approxNormal(a, p);
      const cuff = j <= 2 ? 0.005 : 0;
      const puff = 0.007 + 0.007 * smooth(0.3, 1, f) + cuff;
      return { p: V3.add(q, V3.mul(nn, puff)), n: nn };
    };
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < n; i++) {
        const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
        const rib = i % 2 === 0 ? COL.beanie : COL.beanieRib;
        const col = j < 2 ? COL.beanieDk : rib;
        b.quad(q[0].p, q[1].p, q[2].p, q[3].p, rgb(col), null, q.map(v => v.n));
      }
    }
    for (let i = 0; i < n; i++) {
      const a = pt(i, 0), c = pt(i + 1, 0);
      const ai = V3.sub(a.p, V3.mul(a.n, 0.014)), ci = V3.sub(c.p, V3.mul(c.n, 0.014));
      const dn = [0, -1, 0];
      b.quad(ai, ci, c.p, a.p, rgb(COL.beanieDk), null, [dn, dn, a.n, a.n]);
    }
    return b;
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
      lip: basePt(0, lipP(0)),
      eye: mk(buildEyeMesh),
      lidU: mk(b => buildLid(b, true)),
      lidD: mk(b => buildLid(b, false)),
      teethU: mk(b => buildTeeth(b, false)),
      teethL: mk(b => buildTeeth(b, true)),
      cavityU: mk(b => buildCavity(b, false)),
      cavityL: mk(b => buildCavity(b, true)),
      tongue: mk(b => b.ellipsoid(0.03, 0.009, 0.028, 12, 6, COL.tongue)),
      earL: mk(b => buildEar(b, 'L')),
      earR: mk(b => buildEar(b, 'R')),
      ears: [-1, 1].map(s => { const q = rawPt(s * 1.48, 0.04); return [q[0] - s * 0.003, q[1], q[2] + 0.004]; }),
      patch: mk(buildPatch),
      beanie: mk(buildBeanie),
      torso: mk(buildTorso),
      collar: mk(buildCollar),
      scarf: mk(buildScarf),
      straps: mk(buildStraps),
      pipes: mk(buildPipes),
      caps: mk(buildShoulderCaps),
      hips: mk(buildHips),
      upperL: mk(b => buildUpper(b, 'L')),
      upperR: mk(b => buildUpper(b, 'R')),
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

  function updateNeck(P, m, headM) {
    const [NR, NS] = P.neckDims;
    const data = P.neckData;
    const bot = M4.mul(m.chest, M4.translate(0, 0.42, -0.004));
    const top = M4.mul(headM, M4.translate(0, -0.11, -0.03));
    const shape = [[0.118, 0.104, 0], [0.114, 0.1, 0.004], [0.11, 0.097, 0.01], [0.106, 0.095, 0.014], [0.103, 0.094, 0.017], [0.1, 0.092, 0.018], [0.097, 0.09, 0.016], [0.094, 0.087, 0.012]];
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
        const beard = clamp((f - 0.4) / 0.5, 0, 1) * clamp(C(a) * 0.9 + 0.5, 0, 1);
        const base = rgb(COL.skin);
        const sc = [lerp(base[0], 0.15, beard * 0.8), lerp(base[1], 0.11, beard * 0.8), lerp(base[2], 0.09, beard * 0.8)];
        data.set([p[0], p[1], p[2], n[0], n[1], n[2], sc[0], sc[1], sc[2], 0, 0, 0], w);
        w += 12;
      }
    }
    P.neck.update(data);
  }

  function frameM(f) {
    return new Float32Array([f.x[0], f.x[1], f.x[2], 0, f.y[0], f.y[1], f.y[2], 0, f.z[0], f.z[1], f.z[2], 0, f.c[0], f.c[1], f.c[2], 1]);
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
      fx.draw(P.scarf, W(m.chest), cloth);
      fx.draw(P.collar, W(m.chest), cloth);
      fx.draw(P.pipes, W(m.chest), Object.assign({}, PIPE_MAT, tint));
      fx.draw(P.caps, W(m.chest), cloth);
      fx.draw(P.hips, W(m.pelvis), cloth);
      [['L', P.upperL], ['R', P.upperR]].forEach(([s, up]) => {
        fx.draw(up, W(m['upper' + s]), cloth);
        fx.draw(P.fore, W(m['fore' + s]), cloth);
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
    const H = W(M4.mul(m.head, M4.scale(HEAD_SCALE, HEAD_SCALE, HEAD_SCALE)));
    updateNeck(P, m, M4.mul(m.head, M4.scale(HEAD_SCALE, HEAD_SCALE, HEAD_SCALE)));
    fx.draw(P.neck, o.pre || null, skin);
    deformHead(P.T, F, { pos: P.headPos, data: P.headData });
    P.head.update(P.headData);
    fx.draw(P.head, H, Object.assign({ texture: P.faceTex, backDark: true }, skin));
    const jaw = clamp(F.jaw || 0, 0, 1.25) * 0.32;
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
    const look = F.look || [0, 0];
    const blink = clamp(F.blink || 0, 0, 1);
    const lidU = F.lidU === undefined ? 0.7 : F.lidU;
    const lidL = F.lidL === undefined ? 0.35 : F.lidL;
    const upEdge = lerp(lerp(-0.05, 0.62, lidU) - (F.browDown || 0) * 0.12 + (F.browUp || 0) * 0.08, -0.12, blink);
    const loEdge = lerp(lerp(-0.6, -0.12, lidL) + Math.max(F.smileL || 0, F.smileR || 0) * 0.1, -0.14, blink * 0.6);
    const EM = M4.mul(H, frameM(EYE));
    const ball = M4.chain(EM, M4.rotY(clamp(look[0], -0.5, 0.5)), M4.rotX(-clamp(look[1], -0.4, 0.4)), M4.scale(EYE_R, EYE_R, EYE_R));
    fx.draw(P.eye, ball, Object.assign({ texture: P.eyeTex }, EYE_MAT, tint));
    const lidS = M4.scale(EYE_R, EYE_R, EYE_R);
    const lidMat = Object.assign({ spec: [0.08, 8], rim: 0.15 }, tint);
    fx.draw(P.lidU, M4.chain(EM, M4.rotX(-upEdge), lidS), lidMat);
    fx.draw(P.lidD, M4.chain(EM, M4.rotX(-Math.min(loEdge, upEdge - 0.02)), lidS), lidMat);
    fx.draw(P.patch, H, Object.assign({}, PATCH_MAT, tint));
    if (!o.noHat) fx.draw(P.beanie, H, Object.assign({}, KNIT_MAT, tint));
  }

  function headPoint(m, local) {
    return M4.point(m.head, V3.mul(local, HEAD_SCALE));
  }

  window.MeetDemoman = { D, COL, HAND_POSES, CHANNELS, HEAD_SCALE, build, solve, draw, handBasis, handMesh, headPoint, lipP, basePt, rawPt, torsoSurf, EYE, EYE_R, PIPES };
})();
