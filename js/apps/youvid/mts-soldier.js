(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Rig = window.YouVidRig;

  const D = { chestY: 0.13, neckY: 0.63, headY: 0.12, shX: 0.34, shY: 0.4, upper: 0.31, fore: 0.29, hipX: 0.125, hipY: -0.06, thigh: 0.43, shin: 0.43 };

  const COL = {
    skin: 0xc98b63, skinDk: 0x9c6448, lip: 0xa8644f, tongue: 0x9a4842, teeth: 0xece6d6,
    coat: 0xb8412f, coatDk: 0x8a2c22, coatHi: 0xd0573f, lining: 0xd8705c, shirt: 0xe9e5dd,
    strap: 0x2b2622, strapHi: 0x3e3631, helmet: 0x5a4c3e, helmetDk: 0x3a3029, chin: 0x1f1b19,
    grenade: 0x3c3b3d, grenadeBand: 0xd6752c, belt: 0x26221f, pouch: 0x2d2825, pouchTop: 0xd06a2a, buckle: 0x8f8a7c,
    pants: 0x4a4135, puttee: 0x6b5d4a, boot: 0x2a221d, sole: 0x18130f, patch: 0xe0873a, patchIcon: 0xa8352a
  };

  const TEAM = {
    red: { coat: COL.coat, coatDk: COL.coatDk, coatHi: COL.coatHi, lining: COL.lining, helmet: COL.helmet, helmetDk: COL.helmetDk, css: '#b8412f', shade: '60,10,6', liningCss: '#d8705c', seam: '90,20,14', dark: '70,14,10', noise: '40,0,0' },
    blu: { coat: 0x6f98ae, coatDk: 0x557a8e, coatHi: 0x86aec4, lining: 0x9ec2d6, helmet: 0x40525a, helmetDk: 0x2a363c, css: '#6f98ae', shade: '10,30,50', liningCss: '#9ec2d6', seam: '30,56,80', dark: '20,40,60', noise: '0,20,40' }
  };

  const SKIN_MAT = { spec: [0.2, 10], rim: 1.1 };
  const CLOTH_MAT = { spec: [0.06, 5], rim: 0.85 };
  const HELMET_MAT = { spec: [0.32, 16], rim: 0.9, backDark: true };

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

  const HW = table([[-1.571, 0.06], [-1.25, 0.11], [-1.0, 0.134], [-0.75, 0.141], [-0.5, 0.14], [-0.25, 0.133], [0.0, 0.127], [0.3, 0.12], [0.6, 0.107], [0.9, 0.086], [1.2, 0.056], [1.571, 0.0]]);
  const DF = table([[-1.571, 0.04], [-1.25, 0.09], [-1.0, 0.118], [-0.82, 0.122], [-0.62, 0.113], [-0.46, 0.118], [-0.3, 0.122], [-0.12, 0.116], [0.05, 0.11], [0.3, 0.107], [0.55, 0.1], [0.85, 0.084], [1.15, 0.052], [1.571, 0.0]]);
  const DB = table([[-1.571, 0.03], [-1.1, 0.072], [-0.6, 0.098], [-0.2, 0.11], [0.2, 0.118], [0.5, 0.114], [0.9, 0.088], [1.2, 0.054], [1.571, 0.0]]);
  const YT = table([[-1.571, -0.205], [-1.25, -0.2], [-1.0, -0.186], [-0.8, -0.162], [-0.6, -0.132], [-0.45, -0.108], [-0.3, -0.082], [-0.15, -0.056], [0.0, -0.028], [0.25, 0.016], [0.5, 0.056], [0.8, 0.094], [1.15, 0.12], [1.571, 0.132]]);

  const NU = 72, NL = 16, NUP = 24, MW = 0.37;
  const HINGE = [0, -0.04, -0.02];
  const CHANNELS = ['smile', 'frown', 'wide', 'round', 'sneer', 'lower'];

  const g2 = (x, s) => Math.exp(-(x / s) * (x / s));
  const smooth = (e0, e1, x) => { const k = clamp((x - e0) / (e1 - e0), 0, 1); return k * k * (3 - 2 * k); };

  function lipP(a) {
    const q = a / 0.42;
    return -0.43 - 0.035 * Math.min(q * q, 1.4);
  }

  function yawAt(i) {
    const s = 2 * i / NU - 1;
    return PI * Math.sign(s) * Math.pow(Math.abs(s), 1.35);
  }

  function squircle(p) {
    return 0.24 * smooth(-1.25, -0.85, p) * (1 - smooth(-0.2, 0.3, p));
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
    h += 0.032 * g2(a, 0.12) * g2(p + 0.22, 0.075);
    h += 0.02 * g2(a, 0.085) * smooth(-0.24, -0.12, p) * (1 - smooth(0.12, 0.3, p));
    h += 0.012 * g2(A - 0.155, 0.055) * g2(p + 0.27, 0.045);
    h -= 0.005 * g2(A - 0.075, 0.03) * g2(p + 0.31, 0.022);
    h -= 0.003 * g2(a, 0.03) * g2(dl - 0.06, 0.04);
    h += 0.005 * g2(dl - 0.035, 0.03) * (1 - smooth(MW - 0.04, MW + 0.06, A));
    h += 0.007 * g2(dl + 0.045, 0.035) * g2(a, 0.3);
    h -= 0.006 * g2(dl + 0.15, 0.045) * g2(a, 0.3);
    h += 0.015 * g2(a, 0.36) * g2(p + 0.9, 0.14);
    h -= 0.003 * g2(a, 0.035) * g2(p + 0.93, 0.08);
    h -= 0.006 * g2(segDist(A, p, 0.21, -0.29, MW + 0.04, lipP(MW) - 0.03), 0.035);
    h += 0.008 * g2(A - 0.5, 0.2) * g2(p + 0.3, 0.15);
    h += 0.01 * g2(A - 1.05, 0.3) * g2(p + 0.78, 0.2);
    h -= 0.004 * g2(A - 0.3, 0.2) * g2(p + 0.02, 0.08);
    return h;
  }

  function basePt(a, p) {
    return V3.add(rawPt(a, p), V3.mul(approxNormal(a, p), relief(a, p)));
  }

  function deltas(a, p) {
    const A = Math.abs(a), sg = Math.sign(a) || 1;
    const dl = p - lipP(a);
    const inMouth = 1 - smooth(MW - 0.03, MW + 0.1, A);
    const out = {};
    const gC = g2(A - MW, 0.13) * g2(dl, 0.09);
    const gK = g2(A - 0.45, 0.16) * g2(p + 0.12, 0.12);
    out.smile = [sg * (0.006 * gC + 0.002 * gK), 0.012 * gC + 0.005 * gK, -0.004 * gC + 0.003 * gK];
    const gF = g2(A - MW, 0.16) * g2(dl, 0.12);
    out.frown = [0, -0.009 * gF, 0];
    const gUp = g2(dl - 0.02, 0.035) * inMouth;
    const gLo = g2(dl + 0.025, 0.04) * inMouth;
    out.wide = [sg * 0.01 * gC, 0.019 * gUp - 0.019 * gLo, 0.001 * gLo - 0.003 * gC];
    const gR = g2(dl, 0.08) * (1 - smooth(MW, MW + 0.12, A));
    const x0 = rawPt(a, p)[0];
    out.round = [-x0 * 0.35 * gR, 0, 0.01 * gR];
    const gS = g2(dl - 0.025, 0.045) * g2(a, 0.32);
    out.sneer = [0, 0.02 * gS, 0.004 * gS];
    const gL = g2(dl + 0.025, 0.05) * g2(a, 0.34);
    out.lower = [0, -0.014 * gL, 0.003 * gL];
    return out;
  }

  function jawWeight(a, p, lower) {
    if (!lower) return 0;
    const A = Math.abs(a);
    const side = (1 - smooth(1.0, 1.7, A)) * smooth(-1.4, -0.85, p);
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
    ctx.fillStyle = '#bf825c';
    ctx.fillRect(0, 0, W, H);
    const vg = ctx.createLinearGradient(0, 0, 0, H);
    vg.addColorStop(0, 'rgba(60,34,26,0.55)');
    vg.addColorStop(0.38, 'rgba(60,34,26,0.45)');
    vg.addColorStop(0.47, 'rgba(60,34,26,0)');
    vg.addColorStop(0.72, 'rgba(110,60,44,0)');
    vg.addColorStop(1, 'rgba(110,60,44,0.35)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    blob(0, -0.22, 0.16, 0.09, '214,128,98', 0.4);
    [-1, 1].forEach(s => {
      blob(s * 0.5, -0.16, 0.24, 0.16, '200,108,84', 0.22);
      blob(s * 1.1, -0.5, 0.3, 0.25, '120,70,52', 0.18);
      blob(s * 0.075, -0.31, 0.03, 0.016, '60,26,20', 0.75);
    });
    const g = rand(51);
    const off = document.createElement('canvas');
    off.width = W;
    off.height = H;
    const oc = off.getContext('2d');
    const region = (c) => {
      c.beginPath();
      for (let i = 0; i <= 120; i++) {
        const a = -PI + (2 * PI * i) / 120;
        const A = Math.abs(a);
        const top = A < 0.22 ? lipP(a) + 0.07 : A < 0.5 ? lerp(lipP(0.22) + 0.07, -0.28, (A - 0.22) / 0.28) : A < 1.25 ? lerp(-0.28, -0.12, (A - 0.5) / 0.75) : lerp(-0.12, -0.4, clamp((A - 1.25) / 0.5, 0, 1));
        const [x, y] = P(a, top);
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.lineTo(W, H);
      c.lineTo(0, H);
      c.closePath();
    };
    oc.filter = 'blur(8px)';
    region(oc);
    oc.fillStyle = 'rgba(88,72,78,0.5)';
    oc.fill();
    oc.filter = 'none';
    oc.save();
    region(oc);
    oc.clip();
    for (let i = 0; i < 14000; i++) {
      const x = g() * W, y = P(0, -0.1)[1] + g() * (H - P(0, -0.1)[1]);
      oc.fillStyle = `rgba(70,52,54,${0.05 + g() * 0.1})`;
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
      const [x, y] = P(a, lipP(a) - 0.006 - 0.034 * k);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(176,96,80,0.55)';
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
      const [x, y] = P(a, lipP(a) + 0.006 + 0.024 * k);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(160,86,72,0.45)';
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(50,20,14,0.95)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = lerp(-MW, MW, i / 40);
      const [x, y] = P(a, lipP(a));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    [-1, 1].forEach(s => {
      ctx.strokeStyle = 'rgba(112,56,42,0.35)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(...P(s * 0.21, -0.29));
      ctx.quadraticCurveTo(...P(s * 0.36, -0.36), ...P(s * (MW + 0.05), lipP(MW) - 0.03));
      ctx.stroke();
      ctx.strokeStyle = 'rgba(112,60,46,0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(...P(s * (MW + 0.12), lipP(MW) + 0.02));
      ctx.quadraticCurveTo(...P(s * (MW + 0.16), lipP(MW) - 0.08), ...P(s * (MW + 0.1), lipP(MW) - 0.2));
      ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(100,52,40,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(...P(0, -0.84));
    ctx.lineTo(...P(0, -0.96));
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
    [-0.25, 0.25, 0.168, 0.0], [-0.16, 0.262, 0.174, 0.01], [-0.05, 0.285, 0.184, 0.018], [0.08, 0.315, 0.196, 0.026],
    [0.2, 0.335, 0.198, 0.026], [0.3, 0.342, 0.19, 0.016], [0.37, 0.33, 0.178, 0.004], [0.43, 0.29, 0.162, -0.006],
    [0.49, 0.225, 0.142, -0.012], [0.55, 0.16, 0.12, -0.012], [0.6, 0.115, 0.1, -0.008]
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

  function paintCoat(ctx, W, H, team) {
    const y0 = TORSO[0].y, y1 = TORSO[TORSO.length - 1].y;
    const Y = (y) => (1 - (y - y0) / (y1 - y0)) * H;
    const U = (ang) => ((ang + PI) / (2 * PI)) * W;
    ctx.fillStyle = team.css;
    ctx.fillRect(0, 0, W, H);
    const shade = ctx.createLinearGradient(0, 0, W, 0);
    shade.addColorStop(0, `rgba(${team.shade},0.16)`);
    shade.addColorStop(0.5, 'rgba(255,220,200,0.04)');
    shade.addColorStop(1, `rgba(${team.shade},0.16)`);
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e9e5dd';
    ctx.beginPath();
    ctx.moveTo(U(-0.3), Y(0.6));
    ctx.lineTo(U(0.3), Y(0.6));
    ctx.lineTo(U(0.03), Y(0.47));
    ctx.lineTo(U(-0.03), Y(0.47));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = team.liningCss;
    [-1, 1].forEach(s => {
      ctx.beginPath();
      ctx.moveTo(U(s * 0.3), Y(0.6));
      ctx.lineTo(U(s * 0.4), Y(0.56));
      ctx.lineTo(U(s * 0.06), Y(0.45));
      ctx.lineTo(U(s * 0.03), Y(0.47));
      ctx.closePath();
      ctx.fill();
    });
    ctx.strokeStyle = `rgba(${team.seam},0.55)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(U(0.03), Y(0.36));
    ctx.lineTo(U(0.05), Y(-0.25));
    ctx.stroke();
    [-1, 1].forEach(s => {
      ctx.strokeStyle = `rgba(${team.seam},0.3)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(U(s * 1.57), Y(0.42));
      ctx.lineTo(U(s * 1.57), Y(-0.25));
      ctx.stroke();
      ctx.strokeStyle = `rgba(${team.seam},0.4)`;
      ctx.strokeRect(U(s * 0.62) - W * 0.03, Y(0.2), W * 0.06, Y(0.12) - Y(0.2));
    });
    ctx.strokeStyle = `rgba(${team.dark},0.5)`;
    ctx.beginPath();
    ctx.moveTo(U(PI - 0.001), Y(0.45));
    ctx.lineTo(U(PI - 0.001), H);
    ctx.moveTo(U(-PI + 0.001), Y(0.45));
    ctx.lineTo(U(-PI + 0.001), H);
    ctx.stroke();
    const g = rand(7);
    for (let i = 0; i < 2400; i++) {
      ctx.fillStyle = `rgba(${g() < 0.5 ? team.noise : '255,220,200'},${g() * 0.05})`;
      ctx.fillRect(g() * W, g() * H, 2, 2);
    }
  }

  function paintPatch(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, R = W * 0.47;
    ctx.fillStyle = '#e0873a';
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8592a';
    ctx.lineWidth = W * 0.04;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.9, 0, PI * 2);
    ctx.stroke();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.75);
    ctx.fillStyle = '#a8352a';
    ctx.fillRect(-R * 0.55, -R * 0.12, R * 0.9, R * 0.24);
    ctx.beginPath();
    ctx.moveTo(R * 0.35, -R * 0.12);
    ctx.quadraticCurveTo(R * 0.62, 0, R * 0.35, R * 0.12);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-R * 0.55, -R * 0.12);
    ctx.lineTo(-R * 0.72, -R * 0.3);
    ctx.lineTo(-R * 0.45, -R * 0.12);
    ctx.moveTo(-R * 0.55, R * 0.12);
    ctx.lineTo(-R * 0.72, R * 0.3);
    ctx.lineTo(-R * 0.45, R * 0.12);
    ctx.fill();
    ctx.restore();
  }

  function strapPath(back) {
    const pts = [];
    const n = back ? 12 : 16;
    for (let i = 0; i <= n; i++) {
      const s = i / n;
      const ang = back ? lerp(-PI + 0.6, PI - 0.95, s) : lerp(-0.62, 0.98, s);
      const y = back ? lerp(0.46, -0.17, s) : lerp(0.47, -0.17, s);
      pts.push({ ang: back && ang < -PI ? ang + PI * 2 : ang, y });
    }
    return pts;
  }

  function strapFrame(back, s) {
    const pts = strapPath(back);
    const n = pts.length - 1;
    const f = clamp(s, 0, 1) * n;
    const i = Math.min(n - 1, Math.floor(f));
    const k = f - i;
    const a = pts[i], b = pts[i + 1];
    const ang = lerp(a.ang, b.ang, k), y = lerp(a.y, b.y, k);
    const p = torsoSurf(ang, y, 0.014);
    const nrm = torsoNormal(ang, y);
    const tan = V3.norm(V3.sub(torsoSurf(b.ang, b.y, 0.014), torsoSurf(a.ang, a.y, 0.014)));
    return { p, n: nrm, t: tan };
  }

  function buildStrap(b) {
    [false, true].forEach(back => {
      const pts = strapPath(back);
      const W = 0.034;
      for (let i = 0; i < pts.length - 1; i++) {
        const q = [pts[i], pts[i + 1]].map(r => {
          const p = torsoSurf(r.ang, r.y, 0.013);
          const n = torsoNormal(r.ang, r.y);
          return { p, n };
        });
        const tan = V3.norm(V3.sub(q[1].p, q[0].p));
        const side0 = V3.mul(V3.norm(V3.cross(q[0].n, tan)), W);
        const side1 = V3.mul(V3.norm(V3.cross(q[1].n, tan)), W);
        b.quad(V3.add(q[0].p, side0), V3.sub(q[0].p, side0), V3.sub(q[1].p, side1), V3.add(q[1].p, side1), COL.strap, null, [q[0].n, q[0].n, q[1].n, q[1].n]);
        const e0 = V3.add(q[0].p, V3.mul(side0, 1.0)), e1 = V3.add(q[1].p, V3.mul(side1, 1.0));
        b.quad(e0, e1, V3.add(e1, V3.mul(q[1].n, -0.01)), V3.add(e0, V3.mul(q[0].n, -0.01)), COL.strapHi, null, null);
        const f0 = V3.sub(q[0].p, side0), f1 = V3.sub(q[1].p, side1);
        b.quad(f1, f0, V3.add(f0, V3.mul(q[0].n, -0.01)), V3.add(f1, V3.mul(q[1].n, -0.01)), COL.strapHi, null, null);
      }
    });
    const front = torsoSurf(strapPath(false)[0].ang, strapPath(false)[0].y, 0.013);
    const back = torsoSurf(strapPath(true)[0].ang, strapPath(true)[0].y, 0.013);
    const arc = [];
    for (let k = 0; k <= 8; k++) {
      const f = k / 8;
      const p = V3.lerp(front, back, f);
      arc.push([p[0] - S(f * PI) * 0.03, p[1] + S(f * PI) * 0.075, p[2]]);
    }
    for (let k = 0; k < 8; k++) {
      const a = arc[k], c = arc[k + 1];
      const na = V3.norm(V3.sub(a, [-0.12, 0.42, 0])), nc = V3.norm(V3.sub(c, [-0.12, 0.42, 0]));
      const side = [0.034, 0.012, 0];
      b.quad(V3.add(a, side), V3.sub(a, side), V3.sub(c, side), V3.add(c, side), COL.strap, null, [na, na, nc, nc]);
    }
    return b;
  }

  function buildGrenade(b) {
    b.prism(10, 0.024, 0.024, -0.045, 0.027, 0.027, 0.02, COL.grenade, { capBottom: true });
    b.prism(10, 0.0275, 0.0275, 0.02, 0.0275, 0.0275, 0.032, COL.grenadeBand);
    b.prism(10, 0.026, 0.026, 0.032, 0.017, 0.017, 0.05, COL.grenade);
    b.prism(8, 0.01, 0.01, 0.05, 0.01, 0.01, 0.064, 0x6a6a68);
    b.at(0.0, 0.06, 0.012, h => { h.push(M4.rotX(0.4)); h.box(0.012, 0.004, 0.05, 0x6a6a68); h.pop(); });
    b.at(-0.014, 0.068, 0, h => { h.push(M4.rotZ(PI / 2)); h.prism(10, 0.012, 0.012, -0.002, 0.012, 0.012, 0.002, 0x8a8a86); h.pop(); });
    for (let i = 0; i < 3; i++) b.at(0, -0.035 + i * 0.022, 0, h => h.prism(10, 0.0255, 0.0255, -0.002, 0.0255, 0.0255, 0.002, 0x2c2b2d));
    return b;
  }

  const GRENADE_SLOTS = [0.33, 0.6];

  function grenadeRest(i) {
    const f = strapFrame(false, GRENADE_SLOTS[i]);
    const y = V3.mul(f.t, -1);
    let z = V3.sub(f.n, V3.mul(y, V3.dot(f.n, y)));
    z = V3.norm(z);
    const x = V3.cross(y, z);
    const o = V3.add(f.p, V3.mul(f.n, 0.03));
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, o[0], o[1], o[2], 1]);
  }

  function buildTorso(b) {
    ringLoft(b, TORSO, 30, null, {});
    return b;
  }

  function buildCollar(b, team) {
    const sides = 30;
    const levels = [[0.47, 0.205, 0.158, -0.022, 0.24, 0], [0.54, 0.172, 0.142, -0.024, 0.46, 0.02], [0.6, 0.168, 0.142, -0.026, 0.68, 0.06], [0.66, 0.19, 0.16, -0.028, 0.86, 0.11]];
    const pt = (L, f, grow) => {
      const gap = L[4];
      const a = gap + f * (PI * 2 - gap * 2);
      const drop = L[5] * (1 + C(a)) / 2;
      return [S(a) * (L[1] + grow), L[0] - drop, L[3] + C(a) * (L[2] + grow)];
    };
    for (let j = 0; j < levels.length - 1; j++) {
      for (let i = 0; i < sides; i++) {
        const f0 = i / sides, f1 = (i + 1) / sides;
        const A = pt(levels[j], f0, 0), B = pt(levels[j], f1, 0), Cc = pt(levels[j + 1], f1, 0), Dd = pt(levels[j + 1], f0, 0);
        const nA = V3.norm([A[0], 0.2, A[2]]), nB = V3.norm([B[0], 0.2, B[2]]), nC = V3.norm([Cc[0], 0.25, Cc[2]]), nD = V3.norm([Dd[0], 0.25, Dd[2]]);
        const top = j === levels.length - 2;
        b.quad(A, B, Cc, Dd, top ? [rgb(team.coat), rgb(team.coat), rgb(team.coatHi), rgb(team.coatHi)] : team.coat, null, [nA, nB, nC, nD]);
        const a2 = pt(levels[j], f0, -0.012), b2 = pt(levels[j], f1, -0.012), c2 = pt(levels[j + 1], f1, -0.012), d2 = pt(levels[j + 1], f0, -0.012);
        b.quad(a2, d2, c2, b2, team.lining, null, [V3.mul(nA, -1), V3.mul(nD, -1), V3.mul(nC, -1), V3.mul(nB, -1)]);
      }
    }
    [0, 1].forEach(e => {
      for (let j = 0; j < levels.length - 1; j++) {
        const A = pt(levels[j], e, 0), Dd = pt(levels[j + 1], e, 0), a2 = pt(levels[j], e, -0.012), d2 = pt(levels[j + 1], e, -0.012);
        b.quad(A, Dd, d2, a2, team.coatHi);
      }
    });
    b.at(0, 0.5, -0.01, h => h.prism(16, 0.118, 0.1, -0.03, 0.108, 0.094, 0.012, COL.shirt));
    return b;
  }

  function buildBelt(b) {
    const rings = [{ y: -0.215, rx: 0.256, rz: 0.174, cz: 0.0 }, { y: -0.165, rx: 0.266, rz: 0.179, cz: 0.01 }];
    ringLoft(b, rings, 26, () => COL.belt, {});
    b.at(0, -0.19, 0.19, h => h.box(0.07, 0.05, 0.012, COL.buckle));
    [-1, 1].forEach(s => {
      const p = torsoSurf(s * 0.42, -0.2, 0.02);
      b.push(M4.translate(p[0], p[1] - 0.01, p[2]), M4.rotY(s * 0.42));
      b.box(0.07, 0.085, 0.045, COL.pouch);
      b.at(0, 0.035, 0.004, h => h.box(0.074, 0.03, 0.05, COL.pouchTop));
      b.pop();
      const q = torsoSurf(s * 1.45, -0.21, 0.02);
      b.push(M4.translate(q[0], q[1] - 0.03, q[2]), M4.rotY(s * 1.45));
      b.box(0.085, 0.14, 0.05, COL.pouch);
      b.at(0, 0.06, 0.004, h => h.box(0.09, 0.03, 0.056, 0x1f1b18));
      b.pop();
    });
    return b;
  }

  function limbRings(len, keys) {
    return keys.map(([f, r, rz, cz]) => ({ y: -len * f, rx: r, rz: rz || r, cz: cz || 0 })).reverse();
  }

  function buildUpper(b, team) {
    const len = D.upper;
    ringLoft(b, limbRings(len, [[-0.3, 0.06], [-0.2, 0.095], [-0.1, 0.108], [0, 0.116, 0.118], [0.2, 0.116, 0.12, 0.006], [0.5, 0.108, 0.112, 0.008], [0.8, 0.096, 0.099, 0.004], [1.0, 0.088, 0.09, 0], [1.1, 0.08, 0.08, 0]]), 16, () => team.coat, { capTop: true });
    return b;
  }

  function buildFore(b, team) {
    const len = D.fore;
    const col = (u, y) => (-y / len > 0.86 ? team.coatDk : team.coat);
    ringLoft(b, limbRings(len, [[-0.12, 0.082], [0, 0.09], [0.2, 0.092, 0.087], [0.5, 0.083, 0.078], [0.8, 0.073, 0.069], [0.86, 0.078, 0.073], [1.0, 0.078, 0.073], [1.02, 0.055, 0.05]]), 14, col, { capTop: true, capBottom: true });
    return b;
  }

  const HAND_POSES = {
    relax: { curl: [0.32, 0.4, 0.46, 0.52], spread: 0.15, thumb: [0.45, 0.35] },
    fist: { curl: [1, 1, 1, 1], spread: 0, thumb: [0.15, 0.95] },
    grip: { curl: [0.72, 0.75, 0.78, 0.8], spread: 0.05, thumb: [0.65, 0.55] },
    point: { curl: [0.02, 1, 1, 1], spread: 0.05, thumb: [0.25, 0.85] },
    open: { curl: [0.06, 0.05, 0.07, 0.1], spread: 0.55, thumb: [0.85, 0.1] },
    flat: { curl: [0.12, 0.12, 0.14, 0.16], spread: 0.08, thumb: [0.35, 0.15] },
    claw: { curl: [0.55, 0.58, 0.6, 0.62], spread: 0.35, thumb: [0.6, 0.4] },
    hold: { curl: [0.6, 0.66, 0.7, 0.74], spread: 0.08, thumb: [0.8, 0.35] },
    poke: { curl: [0.05, 0.85, 0.9, 0.92], spread: 0.05, thumb: [0.4, 0.6] }
  };

  function palm(b) {
    const rows = [[0.012, 0.037, 0.024], [-0.02, 0.044, 0.026], [-0.06, 0.047, 0.024], [-0.092, 0.046, 0.02], [-0.104, 0.041, 0.016]];
    const sides = 14;
    const pt = (r, i) => {
      const a = (i / sides) * PI * 2;
      return [S(a) * r[1], r[0], C(a) * r[2]];
    };
    for (let j = 0; j < rows.length - 1; j++) {
      for (let i = 0; i < sides; i++) {
        const a = pt(rows[j], i), bb = pt(rows[j], i + 1), c = pt(rows[j + 1], i + 1), d = pt(rows[j + 1], i);
        const ns = [a, bb, c, d].map(q => V3.norm([q[0] / 0.045, 0, q[2] / 0.022]));
        b.quad(a, bb, c, d, COL.skin, null, ns);
      }
    }
    const top = rows[0], bot = rows[rows.length - 1];
    for (let i = 0; i < sides; i++) {
      b.tri([0, top[0], 0], pt(top, i), pt(top, i + 1), COL.skin);
      b.tri([0, bot[0], 0], pt(bot, i + 1), pt(bot, i), COL.skin);
    }
  }

  function fingerSegment(b, len, r0, r1, col, tipCol) {
    b.prism(8, r1, r1 * 0.92, -len, r0, r0 * 0.92, 0, col, { capTop: false });
    b.at(0, -len, 0, h => h.ellipsoid(r1 * 1.02, r1 * 1.02, r1 * 0.95, 8, 5, tipCol || col));
  }

  function buildHandMesh(b, side, poseName) {
    const k = side === 'L' ? 1 : -1;
    const pose = HAND_POSES[poseName] || HAND_POSES.relax;
    b.push(M4.scale(1.42, 1.42, 1.42));
    palm(b);
    const xs = [0.031, 0.011, -0.01, -0.029];
    const lens = [0.08, 0.086, 0.081, 0.066];
    const rads = [0.0108, 0.0112, 0.0107, 0.0095];
    const spreads = [0.13, 0.03, -0.06, -0.16];
    xs.forEach((x, f) => {
      const c = pose.curl[f];
      const L = lens[f], r = rads[f];
      const l1 = L * 0.44, l2 = L * 0.31, l3 = L * 0.25;
      b.push(M4.translate(k * x, -0.098 + Math.abs(x) * 0.12, 0.002), M4.rotZ(k * spreads[f] * (0.4 + pose.spread)), M4.rotX(-(c * 1.45 + 0.06)));
      b.at(0, 0, 0, h => h.ellipsoid(r * 1.12, r * 1.08, r * 1.04, 8, 5, COL.skin));
      fingerSegment(b, l1, r, r * 0.97, COL.skin);
      b.push(M4.translate(0, -l1, 0), M4.rotX(-c * 1.65));
      fingerSegment(b, l2, r * 0.97, r * 0.92, COL.skin);
      b.push(M4.translate(0, -l2, 0), M4.rotX(-c * 1.05));
      fingerSegment(b, l3, r * 0.92, r * 0.82, COL.skin, 0xd6977a);
      b.pop();
      b.pop();
      b.pop();
    });
    const [ab, tc] = pose.thumb;
    b.push(M4.translate(k * 0.039, -0.028, 0.012), M4.rotY(k * (0.35 + ab * 0.5)), M4.rotZ(k * (0.55 + ab * 0.45)), M4.rotX(-0.3 - ab * 0.4));
    b.at(0, 0, 0, h => h.ellipsoid(0.016, 0.019, 0.015, 8, 5, COL.skin));
    fingerSegment(b, 0.033, 0.0138, 0.0132, COL.skin);
    b.push(M4.translate(0, -0.033, 0), M4.rotX(-tc * 0.9));
    fingerSegment(b, 0.028, 0.0132, 0.0125, COL.skin);
    b.push(M4.translate(0, -0.028, 0), M4.rotX(-tc * 0.8));
    fingerSegment(b, 0.024, 0.0125, 0.011, COL.skin, 0xd6977a);
    b.pop();
    b.pop();
    b.pop();
    b.pop();
    return b;
  }

  function buildHips(b) {
    const rings = [
      { y: -0.2, rx: 0.21, rz: 0.158, cz: -0.01 },
      { y: -0.1, rx: 0.232, rz: 0.166, cz: 0.0 },
      { y: 0.02, rx: 0.24, rz: 0.165, cz: 0.0 },
      { y: 0.1, rx: 0.24, rz: 0.16, cz: 0.0 }
    ];
    ringLoft(b, rings, 20, () => COL.pants, { capBottom: true });
    [-1, 1].forEach(s => b.at(s * 0.125, -0.06, 0.0, h => h.ellipsoid(0.12, 0.13, 0.135, 12, 8, COL.pants)));
    return b;
  }

  function buildThigh(b) {
    const len = D.thigh;
    ringLoft(b, limbRings(len, [[-0.12, 0.12], [0, 0.126, 0.13], [0.4, 0.115, 0.12], [0.8, 0.095, 0.098], [1.0, 0.086, 0.086], [1.08, 0.08, 0.08]]), 14, () => COL.pants, { capTop: true, capBottom: true });
    return b;
  }

  function buildShin(b) {
    const len = D.shin;
    const col = (u, y) => { const f = -y / len; return f > 0.8 ? COL.boot : f > 0.4 ? COL.puttee : COL.pants; };
    ringLoft(b, limbRings(len, [[-0.06, 0.08], [0.1, 0.082], [0.38, 0.078], [0.4, 0.07], [0.6, 0.064], [0.79, 0.06], [0.8, 0.066], [1.04, 0.064]]), 14, col, { capTop: true, capBottom: true });
    for (let i = 0; i < 5; i++) {
      const y = -len * (0.44 + i * 0.075);
      b.push(M4.translate(0, y, 0), M4.rotX(0.18), M4.rotZ(0.12 * (i % 2 ? 1 : -1)));
      b.prism(14, 0.069 - i * 0.002, 0.069 - i * 0.002, -0.006, 0.069 - i * 0.002, 0.069 - i * 0.002, 0.006, 0x5d503f);
      b.pop();
    }
    return b;
  }

  function buildFoot(b) {
    b.at(0, -0.03, 0.06, h => h.ellipsoid(0.066, 0.05, 0.14, 12, 7, COL.boot));
    b.at(0, -0.068, 0.065, h => h.box(0.13, 0.026, 0.27, COL.sole));
    b.at(0, 0.02, -0.005, h => h.prism(12, 0.07, 0.07, -0.06, 0.068, 0.068, 0.06, COL.boot));
    return b;
  }

  function buildTeeth(b, lower) {
    const n = 14;
    const R = 0.05, h = lower ? 0.02 : 0.025;
    for (let i = 0; i < n; i++) {
      const a0 = lerp(-1.0, 1.0, i / n), a1 = lerp(-1.0, 1.0, (i + 1) / n);
      const shade = 0.9 + 0.1 * ((i % 2) ? 1 : 0);
      const col = [0.93 * shade, 0.9 * shade, 0.83 * shade, 0.1];
      const y0 = lower ? -h : 0, y1 = lower ? 0 : h;
      const p = (a, y, rr) => [S(a) * rr, y, C(a) * rr];
      b.quad(p(a0, y0, R), p(a1, y0, R), p(a1, y1, R), p(a0, y1, R), col, null, [[S(a0), 0, C(a0)], [S(a1), 0, C(a1)], [S(a1), 0, C(a1)], [S(a0), 0, C(a0)]]);
      const ye = lower ? y1 : y0;
      b.quad(p(a0, ye, R), p(a1, ye, R), p(a1, ye, R - 0.009), p(a0, ye, R - 0.009), col);
      const gap = [0.32, 0.32, 0.3, 0.4];
      const gy = lower ? [y0, y1] : [y0, y1];
      if (i % 2 === 0) b.quad(p(a1, gy[0], R + 0.0002), p(a1 + 0.012, gy[0], R + 0.0002), p(a1 + 0.012, gy[1], R + 0.0002), p(a1, gy[1], R + 0.0002), [gap[0], gap[1], gap[2], gap[3]]);
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
          return [S(y) * C(p) * 0.07, S(p) * 0.044, C(y) * C(p) * 0.04];
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
    b.push(M4.rotY(k * 0.25), M4.rotZ(-k * 0.1));
    b.ellipsoid(0.01, 0.028, 0.019, 10, 8, COL.skin);
    b.at(k * 0.003, 0.002, 0.003, h => h.ellipsoid(0.007, 0.018, 0.011, 8, 6, 0x9a5c44));
    b.pop();
    return b;
  }

  const HELMET = { c: [0, 0.052, -0.016], rx: 0.19, rz: 0.205, ry: 0.19, pitch: 0.05 };
  const FACE_SCALE = M4.scale(1.14, 0.92, 1.06);
  const HEAD_SCALE = M4.scale(0.78, 0.78, 0.78);
  const SKIRT_RINGS = 4, DOME_RINGS = 12;

  function rimY(th) {
    const back = (1 - C(th)) / 2;
    return lerp(-0.05, -0.122, Math.pow(back, 1.2));
  }

  function helmetPt(th, j, grow) {
    const g = grow || 0;
    let rs, y;
    if (j <= SKIRT_RINGS) {
      const s = j / SKIRT_RINGS;
      rs = 1 + 0.075 * Math.pow(1 - s, 2.2);
      y = rimY(th) * (1 - s);
    } else {
      const e = ((j - SKIRT_RINGS) / DOME_RINGS) * PI / 2;
      rs = C(e);
      y = HELMET.ry * S(e) * (1 + 0.04 * C(th) * S(e));
    }
    return [S(th) * (HELMET.rx + g) * rs, HELMET.c[1] + y, HELMET.c[2] + C(th) * (HELMET.rz + g) * rs];
  }

  function buildHelmet(b, team) {
    const tm = team || TEAM.red;
    const sides = 48;
    const total = SKIRT_RINGS + DOME_RINGS;
    const R = [];
    for (let j = 0; j <= total; j++) R.push(Array.from({ length: sides + 1 }, (_, i) => helmetPt((i / sides) * PI * 2, j, 0)));
    const ctr = [HELMET.c[0], HELMET.c[1] - 0.03, HELMET.c[2]];
    const n = (p) => V3.norm([(p[0] - ctr[0]) / HELMET.rx, Math.max(0, p[1] - HELMET.c[1]) / HELMET.ry * 1.2, (p[2] - ctr[2]) / HELMET.rz]);
    for (let j = 0; j < total; j++) {
      for (let i = 0; i < sides; i++) {
        const a = R[j][i], bb = R[j][i + 1], c = R[j + 1][i + 1], d = R[j + 1][i];
        b.quad(a, bb, c, d, tm.helmet, null, [n(a), n(bb), n(c), n(d)]);
      }
    }
    const lip0 = R[0];
    const lip1 = lip0.map((p, i) => { const th = (i / sides) * PI * 2; return [p[0] + S(th) * 0.008, p[1] - 0.009, p[2] + C(th) * 0.008]; });
    const lip2 = lip0.map(p => [p[0] * 0.95, p[1] - 0.007, (p[2] - HELMET.c[2]) * 0.95 + HELMET.c[2]]);
    for (let i = 0; i < sides; i++) {
      const th = (i / sides) * PI * 2;
      const n0 = V3.norm([S(th), -0.5, C(th)]);
      b.quad(lip0[i], lip1[i], lip1[i + 1], lip0[i + 1], tm.helmet, null, [n0, n0, n0, n0]);
      b.quad(lip1[i], lip2[i], lip2[i + 1], lip1[i + 1], tm.helmetDk, null, [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]]);
    }
    return b;
  }

  function buildStrapLoop(b) {
    b.at(0, -0.065, 0, h => h.box(0.012, 0.13, 0.004, COL.chin));
    b.at(0, -0.132, 0, h => h.box(0.016, 0.01, 0.006, 0x555048));
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
        const a = j * (NECK_SIDES + 1) + i, bb = a + 1, c = a + NECK_SIDES + 2, d = a + NECK_SIDES + 1;
        nIdx.push(a, bb, c, a, c, d);
      }
    }
    neck.update(new Float32Array(NECK_RINGS * (NECK_SIDES + 1) * 12), new Uint16Array(nIdx));
    const skirt = fx.dyn();
    const SK_SIDES = 32, SK_RINGS = 6;
    const sIdx = [];
    for (let j = 0; j < SK_RINGS - 1; j++) {
      for (let i = 0; i < SK_SIDES; i++) {
        const a = j * (SK_SIDES + 1) + i, bb = a + 1, c = a + SK_SIDES + 2, d = a + SK_SIDES + 1;
        if (skirtGap(i, SK_SIDES)) continue;
        sIdx.push(a, bb, c, a, c, d);
      }
    }
    skirt.update(new Float32Array(SK_RINGS * (SK_SIDES + 1) * 12), new Uint16Array(sIdx));
    const mk = (fn) => K.mesh(r, fn);
    const lipC = basePt(0, lipP(0));
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
      skirtData: new Float32Array(SK_RINGS * (SK_SIDES + 1) * 12),
      skirtDims: [SK_RINGS, SK_SIDES],
      faceTex: r.texture(1024, paintFace, { height: 512, clamp: true }),
      coatTex: r.texture(512, (ctx, w, h) => paintCoat(ctx, w, h, team), { height: 512, clamp: true }),
      patchTex: r.texture(64, paintPatch, { clamp: true }),
      teethU: mk(b => buildTeeth(b, false)),
      teethL: mk(b => buildTeeth(b, true)),
      cavityU: mk(b => buildCavity(b, false)),
      cavityL: mk(b => buildCavity(b, true)),
      tongue: mk(b => b.ellipsoid(0.032, 0.01, 0.03, 12, 6, COL.tongue)),
      earL: mk(b => buildEar(b, 'L')),
      earR: mk(b => buildEar(b, 'R')),
      ears: [-1, 1].map(s => { const q = rawPt(s * 1.5, -0.05); return [q[0] - s * 0.002, q[1], q[2] - 0.004]; }),
      lip: lipC,
      helmet: mk(b => buildHelmet(b, team)),
      chinStrap: mk(b => buildStrapLoop(b)),
      torso: mk(b => buildTorso(b)),
      collar: mk(b => buildCollar(b, team)),
      strap: mk(b => buildStrap(b)),
      belt: mk(b => buildBelt(b)),
      grenade: mk(b => buildGrenade(b)),
      patch: mk(b => K.discXY(b, 0, 0, 0, 0.042, 18, rgb(0xffffff))),
      hips: mk(b => buildHips(b)),
      upper: mk(b => buildUpper(b, team)),
      fore: mk(b => buildFore(b, team)),
      thigh: mk(b => buildThigh(b)),
      shin: mk(b => buildShin(b)),
      foot: mk(b => buildFoot(b)),
      hands: {},
      r
    };
  }

  function skirtGap(i, n) {
    const u = (i + 0.5) / n;
    const th = u * PI * 2;
    return th < 0.2 || th > PI * 2 - 0.2;
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

  function axis(M, c) {
    return [M[c * 4], M[c * 4 + 1], M[c * 4 + 2]];
  }

  function updateNeck(P, m) {
    const [NR, NS] = P.neckDims;
    const data = P.neckData;
    const bot = M4.mul(m.chest, M4.translate(0, 0.52, -0.01));
    const top = M4.chain(m.head, HEAD_SCALE, M4.translate(0, -0.13, -0.035));
    const shape = [[0.108, 0.094, 0], [0.104, 0.09, 0.004], [0.1, 0.088, 0.008], [0.098, 0.086, 0.012], [0.096, 0.085, 0.014], [0.095, 0.084, 0.015], [0.093, 0.082, 0.014], [0.09, 0.078, 0.012]];
    let w = 0;
    for (let j = 0; j < NR; j++) {
      const f = j / (NR - 1);
      const e = f * f * (3 - 2 * f);
      const o = V3.lerp(axis(bot, 3), axis(top, 3), f);
      const X = V3.norm(V3.lerp(axis(bot, 0), axis(top, 0), e));
      const Z0 = V3.lerp(axis(bot, 2), axis(top, 2), e);
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
        const sc = [lerp(base[0], 0.5, stub * 0.45), lerp(base[1], 0.38, stub * 0.45), lerp(base[2], 0.36, stub * 0.45)];
        data.set([p[0], p[1], p[2], n[0], n[1], n[2], sc[0], sc[1], sc[2], 0, 0, 0], w);
        w += 12;
      }
    }
    P.neck.update(data);
  }

  function skirtPoint(m, th, f) {
    const sx = S(th), cz = C(th);
    const top = M4.point(m.pelvis, [sx * 0.255, 0.075, 0.004 + cz * 0.172]);
    const hemLocal = [sx * 0.275, -0.38, cz * 0.205];
    const hipL = [D.hipX, D.hipY, 0], hipR = [-D.hipX, D.hipY, 0];
    const viaL = M4.point(m.thighL, V3.sub(hemLocal, hipL));
    const viaR = M4.point(m.thighR, V3.sub(hemLocal, hipR));
    const rest = M4.point(m.pelvis, hemLocal);
    const wL = clamp(0.5 + sx * 1.6, 0, 1);
    const legs = V3.lerp(viaR, viaL, wL);
    const hem = V3.lerp(rest, legs, 0.72);
    const k = f * f * (3 - 2 * f) * 0.35 + f * 0.65;
    const p = V3.lerp(top, hem, k);
    const bulge = S(f * PI) * 0.012;
    const out = M4.dir(m.pelvis, [sx, 0, cz]);
    return V3.add(p, V3.mul(out, bulge));
  }

  function updateSkirt(P, m) {
    const [NR, NS] = P.skirtDims;
    const data = P.skirtData;
    const pts = [];
    for (let j = 0; j < NR; j++) {
      const row = [];
      for (let i = 0; i <= NS; i++) row.push(skirtPoint(m, (i / NS) * PI * 2, j / (NR - 1)));
      pts.push(row);
    }
    let w = 0;
    const base = rgb(P.team.coat), dk = rgb(P.team.coatDk);
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
        const hem = j === NR - 1 ? 0.7 : 1;
        const c = j === NR - 1 ? dk : base;
        const p = pts[j][i];
        data.set([p[0], p[1], p[2], n[0], n[1], n[2], c[0] * hem + (1 - hem) * dk[0], c[1], c[2], 0, i / NS, j / (NR - 1)], w);
        w += 12;
      }
    }
    P.skirt.update(data);
  }

  function chinStrapM(H, side) {
    const k = side === 'L' ? 1 : -1;
    const anchor = M4.point(H, [k * 0.168, -0.05, -0.01]);
    const headDown = V3.norm(M4.dir(H, [0, -1, 0.05]));
    const down = V3.norm(V3.lerp(headDown, [0, -1, 0], 0.55));
    const sideV = V3.norm(M4.dir(H, [k, 0, 0]));
    let z = V3.norm(V3.cross(sideV, V3.mul(down, -1)));
    const y = V3.mul(down, -1);
    const x = V3.cross(y, z);
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, anchor[0], anchor[1], anchor[2], 1]);
  }

  function draw(fx, P, st) {
    const m = st.m;
    const F = st.face || {};
    const o = st.opts || {};
    const tint = o.tint ? { tint: o.tint } : {};
    const cloth = Object.assign({}, CLOTH_MAT, tint);
    const skin = Object.assign({}, SKIN_MAT, tint);
    if (!o.noBody) {
      fx.draw(P.torso, m.chest, Object.assign({ texture: P.coatTex }, cloth));
      fx.draw(P.collar, m.chest, cloth);
      fx.draw(P.strap, m.chest, Object.assign({}, cloth, { spec: [0.2, 12] }));
      fx.draw(P.belt, m.chest, Object.assign({}, cloth, { spec: [0.25, 14] }));
      const held = st.grenades || [];
      [0, 1].forEach(i => {
        const G = held[i] && held[i].M ? held[i].M : M4.mul(m.chest, grenadeRest(i));
        fx.draw(P.grenade, G, Object.assign({}, cloth, { spec: [0.35, 18] }));
      });
      [['L', 1], ['R', -1]].forEach(([s, k]) => {
        fx.draw(P.upper, m['upper' + s], cloth);
        if (s === 'R') fx.draw(P.patch, M4.chain(m.upperR, M4.translate(-0.098, -D.upper * 0.22, 0.012), M4.rotY(-PI / 2 + 0.12)), Object.assign({ texture: P.patchTex }, cloth));
        fx.draw(P.fore, m['fore' + s], cloth);
        const hand = st.hands && st.hands[s];
        const HM = hand && hand.M ? hand.M : m['hand' + s];
        fx.draw(handMesh(P, s, (hand && hand.pose) || 'relax'), HM, skin);
        if (!o.noLegs) {
          fx.draw(P.thigh, m['thigh' + s], cloth);
          fx.draw(P.shin, m['shin' + s], cloth);
          fx.draw(P.foot, m['foot' + s], cloth);
        }
      });
      if (!o.noLegs) {
        fx.draw(P.hips, m.pelvis, cloth);
        updateSkirt(P, m);
        fx.draw(P.skirt, null, Object.assign({ texture: null }, cloth));
      }
    }
    updateNeck(P, m);
    fx.draw(P.neck, null, skin);
    deformHead(P.T, F, { pos: P.headPos, data: P.headData });
    P.head.update(P.headData);
    const H0 = M4.mul(m.head, HEAD_SCALE);
    const H = M4.mul(H0, FACE_SCALE);
    fx.draw(P.head, H, Object.assign({ texture: P.faceTex, backDark: true }, skin));
    const jaw = clamp(F.jaw || 0, 0, 1.2) * 0.3;
    const JM = M4.chain(H, M4.translate(HINGE[0], HINGE[1], HINGE[2]), M4.rotX(jaw), M4.translate(-HINGE[0], -HINGE[1], -HINGE[2]));
    const lip = P.lip;
    const wide = clamp((F.wide || 0) + (F.smile || 0) * 0.4, 0, 1.2);
    const dark = { rim: 0, spec: [0, 1] };
    fx.draw(P.cavityU, M4.chain(H, M4.translate(0, lip[1] - 0.008, lip[2] - 0.055)), dark);
    fx.draw(P.cavityL, M4.chain(JM, M4.translate(0, lip[1] - 0.016, lip[2] - 0.055)), dark);
    fx.draw(P.tongue, M4.chain(JM, M4.translate(0, lip[1] - 0.026, lip[2] - 0.046)), { rim: 0.1, spec: [0.3, 12] });
    const showU = (F.sneer || 0) * 0.003;
    fx.draw(P.teethU, M4.chain(H, M4.translate(0, lip[1] - 0.017 + wide * 0.003 + showU, lip[2] - 0.052)), { spec: [0.45, 22], rim: 0.1 });
    fx.draw(P.teethL, M4.chain(JM, M4.translate(0, lip[1] - 0.006 - wide * 0.003, lip[2] - 0.055)), { spec: [0.45, 22], rim: 0.1 });
    P.ears.forEach((q, i) => fx.draw(i ? P.earR : P.earL, M4.chain(H, M4.translate(q[0], q[1], q[2])), skin));
    if (!o.noHelmet) {
      fx.draw(P.helmet, M4.chain(H0, M4.rotX(HELMET.pitch)), Object.assign({}, HELMET_MAT, tint));
      ['L', 'R'].forEach(s => fx.draw(P.chinStrap, chinStrapM(H0, s), cloth));
    }
  }

  function headPoint(m, local) {
    return M4.point(M4.chain(m.head, HEAD_SCALE, FACE_SCALE), local);
  }

  function grenadeRestWorld(m, i) {
    return M4.mul(m.chest, grenadeRest(i));
  }

  window.MeetSoldier = { D, COL, HAND_POSES, CHANNELS, HELMET, build, solve, draw, handBasis, handMesh, headPoint, grenadeRestWorld, strapFrame, torsoSurf, lipP, basePt, rawPt, buildHelmet, buildGrenade };
})();
