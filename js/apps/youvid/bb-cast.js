(function () {
  const { M4, V3, rgb, shade } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
  const gauss = (d, r) => Math.exp(-(d * d) / (r * r));

  const NOSE = { top: 0.04, tip: -0.27, base: -0.355, len: 0.0135, root: 0.0025, bw: 0.15, w: 0.2, wing: 0.006 };

  const HEADS = {
    walt: { rx: 0.072, ry: 0.106, rz: 0.095, top: 1.0, back: 0.97, jaw: 0.07, gonion: 0.2, chinIn: 0.05, chinDrop: 0.06, brow: 0.0072, cheek: 0.003, socket: 0.0088, eyeX: 0.4, eyeY: 0.08, nose: { len: 0.0125 }, mouth: -0.52, corner: 0.31, lips: 0.0028, muzzle: 0.004, chin: 0.004, beard: 'goatee', size: 2048 },
    hank: { rx: 0.084, ry: 0.11, rz: 0.1, top: 0.98, box: 0.72, back: 1.0, jaw: 0.007, gonion: 0.28, chinIn: 0.04, chinDrop: 0.08, brow: 0.0097, cheek: 0.004, socket: 0.0094, eyeX: 0.38, eyeY: 0.08, nose: { len: 0.0118 }, mouth: -0.52, corner: 0.31, lips: 0.003, muzzle: 0.005, chin: 0.006, jowl: 0.14, size: 2048 },
    jesse: { rx: 0.07, ry: 0.104, rz: 0.091, top: 1.03, back: 1.0, jaw: 0.07, gonion: 0.22, chinIn: 0.06, chinDrop: 0.06, brow: 0.0052, cheek: 0.003, socket: 0.0081, eyeX: 0.41, eyeY: 0.08, nose: { len: 0.0122 }, mouth: -0.52, corner: 0.31, lips: 0.0032, muzzle: 0.004, chin: 0.004, hair: 'crew', size: 2048 },
    saul: { rx: 0.074, ry: 0.11, rz: 0.095, top: 1.03, back: 0.98, jaw: 0.049, gonion: 0.18, chinIn: 0.05, chinDrop: 0.08, brow: 0.0065, cheek: 0.003, socket: 0.0086, eyeX: 0.4, eyeY: 0.08, nose: { len: 0.015 }, mouth: -0.52, corner: 0.31, lips: 0.003, muzzle: 0.004, chin: 0.005, hair: 'comb', size: 1024 },
    mike: { rx: 0.075, ry: 0.106, rz: 0.096, top: 0.98, back: 0.98, jaw: 0.035, gonion: 0.22, chinIn: 0.05, chinDrop: 0.07, brow: 0.0084, cheek: 0.003, socket: 0.0097, eyeX: 0.39, eyeY: 0.08, nose: { len: 0.0135 }, mouth: -0.52, corner: 0.31, lips: 0.0024, muzzle: 0.004, chin: 0.005, jowl: 0.04, size: 2048 },
    gus: { rx: 0.072, ry: 0.108, rz: 0.093, top: 1.05, back: 0.98, jaw: 0.042, gonion: 0.2, chinIn: 0.05, chinDrop: 0.07, brow: 0.0072, cheek: 0.004, socket: 0.0083, eyeX: 0.4, eyeY: 0.08, nose: { len: 0.0115 }, mouth: -0.52, corner: 0.31, lips: 0.0036, muzzle: 0.005, chin: 0.004, hair: 'buzz', size: 2048 },
    gomez: { rx: 0.076, ry: 0.108, rz: 0.096, top: 1.02, back: 0.98, jaw: 0.028, gonion: 0.22, chinIn: 0.05, chinDrop: 0.07, brow: 0.0078, cheek: 0.004, socket: 0.0086, eyeX: 0.39, eyeY: 0.08, nose: { len: 0.012 }, mouth: -0.52, corner: 0.31, lips: 0.003, muzzle: 0.004, chin: 0.004, hair: 'short', size: 1024 },
    eladio: { rx: 0.074, ry: 0.108, rz: 0.095, top: 1.04, back: 0.98, jaw: 0.035, gonion: 0.22, chinIn: 0.05, chinDrop: 0.07, brow: 0.0075, cheek: 0.004, socket: 0.0086, eyeX: 0.4, eyeY: 0.08, nose: { len: 0.013 }, mouth: -0.52, corner: 0.31, lips: 0.003, muzzle: 0.004, chin: 0.005, hair: 'swept', size: 1024 },
    doctor: { rx: 0.077, ry: 0.108, rz: 0.097, top: 1.02, back: 0.98, jaw: 0.014, gonion: 0.24, chinIn: 0.04, chinDrop: 0.06, brow: 0.0075, cheek: 0.004, socket: 0.0086, eyeX: 0.38, eyeY: 0.08, nose: { len: 0.012 }, mouth: -0.52, corner: 0.31, lips: 0.003, muzzle: 0.004, chin: 0.004, jowl: 0.06, hair: 'short', beard: 'full', size: 1024 },
    pete: { rx: 0.07, ry: 0.104, rz: 0.09, top: 1.02, back: 0.98, jaw: 0.063, gonion: 0.2, chinIn: 0.06, chinDrop: 0.06, brow: 0.004, cheek: 0.003, socket: 0.006, eyeX: 0.4, eyeY: 0.08, nose: { len: 0.012 }, mouth: -0.52, corner: 0.31, lips: 0.003, muzzle: 0.004, chin: 0.004, hair: 'beanie', size: 512 },
    badger: { rx: 0.072, ry: 0.106, rz: 0.092, top: 1.02, back: 0.98, jaw: 0.049, gonion: 0.2, chinIn: 0.06, chinDrop: 0.06, brow: 0.004, cheek: 0.003, socket: 0.006, eyeX: 0.4, eyeY: 0.08, nose: { len: 0.0125 }, mouth: -0.52, corner: 0.31, lips: 0.003, muzzle: 0.004, chin: 0.004, hair: 'beanie', size: 512 },
    lady: { rx: 0.068, ry: 0.1, rz: 0.088, top: 1.04, back: 0.98, jaw: 0.084, gonion: 0.16, chinIn: 0.07, chinDrop: 0.04, brow: 0.003, cheek: 0.004, socket: 0.005, eyeX: 0.42, eyeY: 0.08, nose: { len: 0.011 }, mouth: -0.52, corner: 0.31, lips: 0.0036, muzzle: 0.004, chin: 0.003, hair: 'long', size: 512 },
    old: { rx: 0.074, ry: 0.106, rz: 0.094, top: 1.04, back: 0.98, jaw: 0.042, gonion: 0.2, chinIn: 0.05, chinDrop: 0.07, brow: 0.006, cheek: 0.003, socket: 0.007, eyeX: 0.39, eyeY: 0.08, nose: { len: 0.014 }, mouth: -0.52, corner: 0.31, lips: 0.002, muzzle: 0.004, chin: 0.004, size: 512 }
  };

  Object.values(HEADS).forEach(H => { H.nose = Object.assign({}, NOSE, H.nose); });

  const HAIR = {
    crew: (yaw, pit) => {
      const front = Math.abs(yaw) < 1.3 ? smooth(0.62, 0.78, pit + 0.06 * Math.abs(S(yaw * 1.4))) : 0;
      const side = Math.abs(yaw) >= 1.3 || Math.cos(yaw) < 0.27 ? smooth(-0.15, 0.05, pit) * (Math.abs(yaw) > 1.3 && Math.abs(yaw) < 1.75 ? smooth(0.12, 0.3, pit) : 1) : 0;
      return 0.0045 * Math.max(front, side) + 0.0015 * smooth(0.9, 1.3, pit);
    },
    comb: (yaw, pit) => {
      const line = Math.abs(yaw) < 0.9 ? 0.66 : Math.abs(yaw) < 1.45 ? 0.66 - 0.55 * (Math.abs(yaw) - 0.9) / 0.55 : 0.0;
      const on = smooth(line - 0.04, line + 0.06, pit);
      const swell = 0.011 * gauss(pit - 1.05, 0.45) * smooth(-2.2, -0.2, yaw) + 0.006 * smooth(0.6, 1.2, pit);
      return on * (0.004 + swell);
    },
    buzz: (yaw, pit) => {
      const line = Math.abs(yaw) < 1.0 ? 0.74 : Math.abs(yaw) < 1.5 ? 0.74 - 0.5 * (Math.abs(yaw) - 1.0) / 0.5 : 0.1;
      return 0.0022 * smooth(line - 0.03, line + 0.05, pit);
    },
    short: (yaw, pit) => {
      const line = Math.abs(yaw) < 0.9 ? 0.7 : Math.abs(yaw) < 1.45 ? 0.7 - 0.6 * (Math.abs(yaw) - 0.9) / 0.55 : 0.0;
      return smooth(line - 0.03, line + 0.06, pit) * (0.006 + 0.004 * smooth(0.8, 1.3, pit));
    },
    swept: (yaw, pit) => {
      const line = Math.abs(yaw) < 0.9 ? 0.68 : Math.abs(yaw) < 1.45 ? 0.68 - 0.6 * (Math.abs(yaw) - 0.9) / 0.55 : -0.05;
      return smooth(line - 0.03, line + 0.07, pit) * (0.009 + 0.008 * gauss(pit - 0.95, 0.4));
    },
    beanie: (yaw, pit) => {
      const line = Math.abs(yaw) < 1.0 ? 0.55 : Math.abs(yaw) < 1.6 ? 0.55 - 0.45 * (Math.abs(yaw) - 1.0) / 0.6 : 0.05;
      return smooth(line - 0.02, line + 0.02, pit) * (0.012 + 0.006 * smooth(0.8, 1.4, pit));
    },
    long: (yaw, pit) => {
      const line = Math.abs(yaw) < 0.8 ? 0.7 : Math.abs(yaw) < 1.4 ? 0.7 - 0.9 * (Math.abs(yaw) - 0.8) / 0.6 : -0.6;
      return smooth(line - 0.03, line + 0.06, pit) * 0.014;
    }
  };

  const BEARD = {
    goatee: (H, yaw, pit) => {
      const ay = Math.abs(yaw);
      const stache = smooth(0.36, 0.3, ay) * gauss(pit - (H.mouth + 0.075), 0.045);
      const chin = smooth(0.5, 0.36, ay) * smooth(H.mouth - 0.04, H.mouth - 0.12, pit) * smooth(-1.3, -1.02, pit);
      const sides = gauss(ay - 0.3, 0.05) * smooth(H.mouth + 0.06, H.mouth - 0.04, pit) * smooth(-1.1, -0.8, pit);
      return 0.0026 * Math.max(stache, chin, sides);
    },
    full: (H, yaw, pit) => {
      const ay = Math.abs(yaw);
      const jaw = smooth(1.45, 1.2, ay) * smooth(H.mouth + 0.2, H.mouth + 0.05, pit) * smooth(-1.4, -1.15, pit);
      const stache = smooth(0.4, 0.3, ay) * gauss(pit - (H.mouth + 0.075), 0.045);
      return 0.0035 * Math.max(jaw * (ay < 0.3 ? 1 : smooth(H.mouth + 0.15, H.mouth - 0.05, pit)), stache);
    }
  };

  function dirOf(yaw, pit) {
    return [S(yaw) * C(pit), S(pit), C(yaw) * C(pit)];
  }

  function baseShape(H, yaw, pit) {
    const e = H.box || 0.78;
    const n = pit > 0 ? [S(yaw) * Math.pow(C(pit), e), Math.pow(S(pit), e), C(yaw) * Math.pow(C(pit), e)] : dirOf(yaw, pit);
    let x = n[0] * H.rx, y = n[1] * H.ry, z = n[2] * H.rz;
    if (n[1] > 0) {
      y *= H.top;
      const w = 1 + (H.parietal === undefined ? 0.1 : H.parietal) * S(Math.min(PI, pit * 2.2)) * (pit < PI / 2.2 ? 1 : 0);
      x *= w;
      if (z < 0) z *= 1 + 0.06 * S(Math.min(PI, pit * 2));
    }
    if (n[1] < 0) {
      const q = -n[1];
      const ax = Math.abs(n[0]);
      x *= 1 - H.jaw * q * q + H.gonion * Math.max(0, 1 - Math.abs(q - 0.55) / 0.3) * Math.max(0, ax - 0.3) + (H.jowl || 0) * gauss(q - 0.45, 0.3) * smooth(0.25, 0.7, ax);
      if (z > 0) z *= 1 - H.chinIn * q * q * (1 - 0.6 * Math.abs(S(yaw)));
      else z *= 1 - 0.35 * q * q;
      y *= 1 + H.chinDrop * q;
    }
    if (z < 0) z *= H.back;
    if (z > 0) {
      const band = smooth(-1.35, -1.0, pit) * smooth(0.75, 0.35, pit);
      const cy = C(yaw);
      z *= 1 + (H.flat === undefined ? 0.75 : H.flat) * band * (1 - cy) * cy * 1.6;
      z *= 1 - 0.04 * smooth(0.5, 1.2, Math.abs(yaw)) * gauss(pit - 0.25, 0.4);
    }
    return [x, y, z];
  }

  function noseRelief(N, yaw, pit) {
    if (pit > N.top + 0.06 || pit < N.base - 0.07) return 0;
    const ay = Math.abs(yaw);
    let h, w;
    if (pit >= N.tip) {
      const t = clamp((N.top - pit) / (N.top - N.tip), 0, 1);
      h = lerp(N.root, N.len, Math.pow(t, 1.25)) * smooth(N.top + 0.06, N.top - 0.02, pit);
      w = lerp(N.bw, N.w, t * t);
    } else {
      const u = clamp((N.tip - pit) / (N.tip - N.base), 0, 1);
      h = N.len * (1 - 0.5 * u * u) * (1 - smooth(0.55, 1.15, u));
      w = N.w * (1 + 0.15 * u);
    }
    const a = ay / (w * 1.25);
    const cross = a >= 1 ? 0 : (1 - a * a) * (1 - a * a) * (1 + 0.6 * a * a);
    const wings = N.wing * gauss(ay - N.w * 1.05, 0.045) * gauss(pit - (N.base + 0.035), 0.035);
    return h * cross + wings;
  }

  function relief(H, yaw, pit) {
    const ay = Math.abs(yaw);
    let d = 0;
    if (C(yaw) > 0) {
      d += H.brow * smooth(0.65, 0.3, ay) * gauss(pit - (H.eyeY + 0.15), 0.07);
      d += H.cheek * gauss(ay - 0.62, 0.2) * gauss(pit + 0.08, 0.16);
      d -= H.socket * gauss(ay - H.eyeX, 0.14) * gauss(pit - H.eyeY, 0.09);
      d += H.socket * 0.55 * gauss(ay - H.eyeX, 0.085) * gauss(pit - H.eyeY, 0.05);
      d += noseRelief(H.nose, yaw, pit);
      d += H.lips * (gauss(pit - (H.mouth + 0.032), 0.028) + 1.15 * gauss(pit - (H.mouth - 0.038), 0.032)) * smooth(H.corner + 0.07, H.corner - 0.08, ay);
      d += H.muzzle * gauss(yaw, 0.38) * gauss(pit - (H.mouth + 0.04), 0.22);
      d += H.chin * gauss(yaw, 0.24) * gauss(pit + 0.98, 0.14);
      d -= 0.0018 * gauss(ay - 0.24, 0.06) * gauss(pit - (H.mouth + 0.12), 0.08);
      if (H.beard) d += BEARD[H.beard](H, yaw, pit);
    }
    if (H.hair) d += HAIR[H.hair](yaw, pit);
    return d;
  }

  function lipW(H, yaw) {
    const a = Math.abs(yaw) / H.corner;
    return a >= 1 ? 0 : Math.pow(1 - a * a, 0.7);
  }

  function jawW(H, yaw, pit, lower) {
    if (!lower) return 0;
    const ay = Math.abs(yaw);
    const wy = smooth(1.5, 0.85, ay);
    const wn = smooth(-1.52, -1.12, pit);
    const wp = smooth(H.mouth, H.mouth - 0.16, pit);
    return wy * wn * (wp + (1 - wp) * lipW(H, yaw));
  }

  const JAW_MAX = 0.27;

  function hinge(H) {
    return [0, -H.ry * 0.22, -H.rz * 0.3];
  }

  function rotJaw(H, p, a) {
    const h = hinge(H);
    const y = p[1] - h[1], z = p[2] - h[2];
    const c = C(a), s = S(a);
    return [p[0], h[1] + y * c - z * s, h[2] + y * s + z * c];
  }

  function warp(H, yaw, pit, smile) {
    if (!smile) return [yaw, pit];
    const ay = Math.abs(yaw);
    const g = gauss(ay - H.corner, 0.16) * gauss(pit - H.mouth, 0.13);
    return [yaw + Math.sign(yaw) * 0.035 * smile * g, pit + 0.055 * smile * g];
  }

  function vertexAt(H, yaw, pit, lower, jaw, smile) {
    const [wy, wp] = warp(H, yaw, pit, smile);
    const base = baseShape(H, wy, wp);
    let rel = relief(H, wy, wp);
    if (smile) rel += 0.0035 * smile * gauss(Math.abs(wy) - 0.48, 0.16) * gauss(wp + 0.22, 0.12) * (C(wy) > 0 ? 1 : 0);
    const n = V3.norm(base);
    let p = V3.add(base, V3.mul(n, rel));
    const w = jawW(H, yaw, pit, lower);
    if (w > 0 && jaw > 0) p = rotJaw(H, p, jaw * JAW_MAX * w);
    return p;
  }

  function headGrid(H) {
    const k = H.size >= 2048 ? 1 : 1.5;
    const cols = [];
    for (let y = -PI; y < PI - 1e-6;) {
      cols.push(y);
      const a = Math.abs(y);
      y += (a < 0.5 ? 0.032 : a < 1.45 ? 0.06 : 0.2) * k;
    }
    cols.push(PI);
    [H.corner, -H.corner, 0].forEach(v => { if (!cols.some(c => Math.abs(c - v) < 1e-6)) cols.push(v); });
    cols.sort((a, b) => a - b);
    const rows = [];
    for (let p = -PI / 2; p < PI / 2 - 1e-6;) {
      rows.push(p);
      p += (p > -0.72 && p < 0.3 ? 0.028 : p > -1.25 && p < 0.8 ? 0.055 : 0.16) * k;
    }
    rows.push(PI / 2);
    if (!rows.some(r => Math.abs(r - H.mouth) < 1e-6)) rows.push(H.mouth);
    rows.sort((a, b) => a - b);
    return { cols: cols.filter((c, i) => i === 0 || c - cols[i - 1] > 0.004), rows: rows.filter((r, i) => i === 0 || r - rows[i - 1] > 0.004) };
  }

  const TEMPLATES = new Map();

  function headTemplate(H, smile) {
    let bySmile = TEMPLATES.get(H);
    if (!bySmile) {
      bySmile = {};
      TEMPLATES.set(H, bySmile);
    }
    if (bySmile[smile]) return bySmile[smile];
    const G = headGrid(H);
    const nu = G.cols.length, nv = G.rows.length;
    const cache = new Map();
    const vert = (i, j, lower) => {
      const key = i * 4096 + j * 2 + (lower ? 1 : 0);
      if (cache.has(key)) return cache.get(key);
      const yaw = G.cols[i], pit = G.rows[j];
      const p = vertexAt(H, yaw, pit, lower, 0, smile);
      const e = 0.004;
      const pa = vertexAt(H, yaw - e, pit, lower, 0, smile), pb = vertexAt(H, yaw + e, pit, lower, 0, smile);
      const pc = vertexAt(H, yaw, Math.max(-PI / 2, pit - e), lower, 0, smile), pd = vertexAt(H, yaw, Math.min(PI / 2, pit + e), lower, 0, smile);
      let n = V3.cross(V3.sub(pb, pa), V3.sub(pd, pc));
      n = V3.len(n) < 1e-12 ? V3.norm(p) : V3.norm(n);
      if (V3.dot(n, p) < 0) n = V3.mul(n, -1);
      const v = { p, n, uv: [(yaw + PI) / (2 * PI), (pit + PI / 2) / PI], w: jawW(H, yaw, pit, lower) };
      cache.set(key, v);
      return v;
    };
    const quads = [];
    for (let j = 0; j < nv - 1; j++) {
      const lower = G.rows[j + 1] <= H.mouth + 1e-6;
      for (let i = 0; i < nu - 1; i++) quads.push([vert(i, j, lower), vert(i + 1, j, lower), vert(i + 1, j + 1, lower), vert(i, j + 1, lower)]);
    }
    bySmile[smile] = quads;
    return quads;
  }

  function buildHeadMesh(b, H, jaw, smile) {
    const quads = headTemplate(H, smile);
    const ang = jaw * JAW_MAX;
    const moved = new Map();
    const tr = (v) => {
      if (!v.w || !ang) return v;
      let m = moved.get(v);
      if (!m) {
        const a = ang * v.w, c = C(a), s = S(a);
        m = { p: rotJaw(H, v.p, a), n: [v.n[0], v.n[1] * c - v.n[2] * s, v.n[1] * s + v.n[2] * c], uv: v.uv };
        moved.set(v, m);
      }
      return m;
    };
    const white = [1, 1, 1, 0];
    quads.forEach(q => {
      const [a, bb, c, d] = q.map(tr);
      b.quad(a.p, bb.p, c.p, d.p, white, [a.uv, bb.uv, c.uv, d.uv], [a.n, bb.n, c.n, d.n]);
    });
  }

  function buildMouthInside(b, H, jaw, skin) {
    const yM = Math.sin(H.mouth) * H.ry * (1 + H.chinDrop * Math.max(0, -Math.sin(H.mouth)));
    const dark = [0.16, 0.05, 0.05, 0];
    b.at(0, yM - 0.004, H.rz * 0.36, q => q.ellipsoid(H.rx * 0.52, H.ry * 0.2, H.rz * 0.5, 12, 8, dark));
    const tooth = [0.9, 0.87, 0.8, 0];
    const row = (dp, lower) => {
      const pts = [];
      for (let i = 0; i <= 10; i++) {
        const yaw = (i / 10 - 0.5) * H.corner * 1.75;
        let p = vertexAt(H, yaw, H.mouth + dp, false, 0, 0);
        p = V3.mul(p, 0.955);
        if (lower) p = rotJaw(H, p, jaw * JAW_MAX * 0.95);
        pts.push(p);
      }
      const hgt = lower ? 0.0075 : 0.0095;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], c = pts[i + 1];
        const up = lower ? [0, -hgt, 0] : [0, hgt, 0];
        const n = V3.norm([a[0] + c[0], 0, a[2] + c[2] + 0.02]);
        b.quad(V3.sub(a, V3.mul(up, 0.0)), V3.sub(c, V3.mul(up, 0.0)), V3.add(c, up), V3.add(a, up), tooth, null, [n, n, n, n]);
      }
    };
    row(-0.012, false);
    row(0.004, true);
    const tc = rotJaw(H, [0, yM - 0.012, H.rz * 0.5], jaw * JAW_MAX);
    b.at(tc[0], tc[1], tc[2], q => q.ellipsoid(H.rx * 0.32, H.ry * 0.07, H.rz * 0.3, 10, 6, [0.5, 0.2, 0.2, 0]));
  }

  function buildEars(b, H, skin) {
    [-1, 1].forEach(s => {
      const yaw = s * 1.6, pit = H.eyeY - 0.2;
      const p = baseShape(H, yaw, pit);
      b.push(M4.translate(p[0] - s * 0.006, p[1], p[2] - 0.002), M4.rotY(s * 0.2), M4.rotX(-0.15), M4.scale(0.9, 0.92, 0.9));
      b.at(s * 0.006, 0, 0, q => q.ellipsoid(0.0075, 0.03, 0.019, 10, 8, skin));
      const rim = [];
      for (let i = 0; i <= 14; i++) {
        const a = -0.6 + (i / 14) * (PI + 1.4);
        rim.push([s * 0.012, S(a) * 0.026, C(a) * 0.016 - 0.002]);
      }
      K.tube(b, rim, rim.map((p2, i) => 0.0032 * (1 - 0.4 * Math.abs(i / 14 - 0.45))), 5, shade(skin, 0.96));
      b.at(s * 0.01, -0.004, 0.002, q => q.ellipsoid(0.004, 0.012, 0.008, 6, 4, shade(skin, 0.72)));
      b.at(s * 0.006, -0.024, -0.002, q => q.ellipsoid(0.0065, 0.009, 0.009, 6, 4, skin));
      b.pop();
    });
  }

  const GLASSES = {
    walt: { col: 0xb89a62, w: 0.0255, h: 0.0175, round: 0.006, z: 0.012, rad: 0.0011 },
    gus: { col: 0xa8a090, w: 0.024, h: 0.016, round: 0.005, z: 0.012, rad: 0.001 }
  };

  function buildGlasses(b, H, G) {
    const eyeP = (s) => vertexAt(H, s * H.eyeX, H.eyeY, false, 0, 0);
    [-1, 1].forEach(s => {
      const c = eyeP(s);
      const cz = c[2] + G.z;
      const pts = [];
      const n = 32;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * PI * 2;
        const cx = C(a), cy = S(a);
        const px = Math.sign(cx) * Math.pow(Math.abs(cx), 0.55) * G.w, py = Math.sign(cy) * Math.pow(Math.abs(cy), 0.55) * G.h;
        const back = (s * px > 0 ? (s * px / G.w) : 0) * 0.006;
        pts.push([c[0] + px + s * 0.002, c[1] + py - 0.001, cz - back]);
      }
      K.tube(b, pts, pts.map(() => G.rad), 4, G.col);
      const ear = vertexAt(H, s * 1.45, H.eyeY - 0.03, false, 0, 0);
      const hinge0 = [c[0] + s * (G.w + 0.002), c[1] + G.h * 0.45, cz - 0.006];
      K.tube(b, [hinge0, [ear[0] + s * 0.004, ear[1] + 0.002, ear[2] + 0.03], [ear[0] + s * 0.002, ear[1], ear[2] - 0.01]], [G.rad, G.rad, G.rad], 4, G.col);
      [-1, 1].forEach(v => K.tube(b, [[c[0] - s * G.w * 0.85, c[1] - G.h * 0.55, cz - 0.001], [c[0] - s * G.w * 0.95, c[1] - G.h * 0.95, cz - 0.009]], [G.rad * 0.7, G.rad * 0.7], 3, 0xd8d0c0));
    });
    const l = eyeP(-1), r = eyeP(1);
    const z = Math.max(l[2], r[2]) + G.z;
    K.tube(b, [[l[0] + G.w * 0.8, l[1] + G.h * 0.5, z], [0, l[1] + G.h * 0.62, z + 0.004], [r[0] - G.w * 0.8, r[1] + G.h * 0.5, z]], [G.rad, G.rad, G.rad], 4, G.col);
  }

  function buildLenses(b, H, G) {
    [-1, 1].forEach(s => {
      const c = vertexAt(H, s * H.eyeX, H.eyeY, false, 0, 0);
      const cz = c[2] + G.z - 0.001;
      const n = 24;
      const ctr = [c[0] + s * 0.002, c[1] - 0.001, cz];
      for (let i = 0; i < n; i++) {
        const pt = (k) => {
          const a = (k / n) * PI * 2;
          const cx = C(a), cy = S(a);
          return [ctr[0] + Math.sign(cx) * Math.pow(Math.abs(cx), 0.55) * G.w, ctr[1] + Math.sign(cy) * Math.pow(Math.abs(cy), 0.55) * G.h, cz];
        };
        const nz = [0, 0, 1];
        b.tri(ctr, pt(i), pt(i + 1), [0.85, 0.9, 1.0, 1], null, [nz, nz, nz]);
      }
    });
  }

  const BODIES = {
    avg: { rings: [[-0.2, 0.16, 0.12, 0.02], [-0.08, 0.17, 0.135, 0.03], [0.05, 0.176, 0.135, 0.026], [0.16, 0.186, 0.128, 0.01], [0.24, 0.194, 0.12, 0.0], [0.29, 0.192, 0.108, -0.006], [0.318, 0.162, 0.094, -0.006], [0.337, 0.11, 0.074, -0.002], [0.348, 0.07, 0.06, 0.002], [0.354, 0.06, 0.055, 0.004]], D: { hipX: 0.1, hipY: -0.05, thigh: 0.45, shin: 0.44, chestY: 0.13, neckY: 0.335, shX: 0.17, shY: 0.262, upper: 0.29, fore: 0.27, headY: 0.135 }, neck: 0.056, k: 1 },
    heavy: { rings: [[-0.2, 0.19, 0.16, 0.04], [-0.08, 0.205, 0.178, 0.055], [0.05, 0.21, 0.17, 0.046], [0.16, 0.216, 0.154, 0.022], [0.24, 0.218, 0.14, 0.006], [0.29, 0.214, 0.126, -0.004], [0.318, 0.182, 0.11, -0.004], [0.337, 0.126, 0.088, 0.0], [0.348, 0.08, 0.072, 0.004], [0.354, 0.07, 0.066, 0.006]], D: { hipX: 0.11, hipY: -0.05, thigh: 0.44, shin: 0.43, chestY: 0.13, neckY: 0.335, shX: 0.19, shY: 0.262, upper: 0.29, fore: 0.27, headY: 0.13 }, neck: 0.066, k: 1.1 },
    slim: { rings: [[-0.2, 0.145, 0.105, 0.0], [-0.08, 0.15, 0.11, 0.005], [0.05, 0.16, 0.114, 0.008], [0.16, 0.174, 0.116, 0.004], [0.24, 0.18, 0.11, -0.004], [0.29, 0.178, 0.1, -0.008], [0.318, 0.15, 0.088, -0.006], [0.337, 0.1, 0.07, -0.002], [0.348, 0.064, 0.056, 0.002], [0.354, 0.056, 0.052, 0.004]], D: { hipX: 0.095, hipY: -0.05, thigh: 0.46, shin: 0.45, chestY: 0.13, neckY: 0.335, shX: 0.16, shY: 0.262, upper: 0.3, fore: 0.27, headY: 0.135 }, neck: 0.052, k: 0.93 }
  };

  function surfaceAt(R, y) {
    for (let i = 0; i < R.length - 1; i++) {
      const a = R[i], b = R[i + 1];
      if (y <= b[0]) {
        const k = clamp((y - a[0]) / (b[0] - a[0]), 0, 1);
        return { rx: lerp(a[1], b[1], k), rz: lerp(a[2], b[2], k), cz: lerp(a[3], b[3], k) };
      }
    }
    const l = R[R.length - 1];
    return { rx: l[1], rz: l[2], cz: l[3] };
  }

  function onSurface(R, a, y, lift) {
    const s = surfaceAt(R, y);
    const k = 1 + (lift || 0);
    return [S(a) * s.rx * k, y, s.cz + C(a) * s.rz * k];
  }

  function band(b, R, y0, y1, a0f, a1f, lift, col, nv, nu, uvBox) {
    const pt = (u, v) => {
      const y = lerp(y0, y1, v);
      return onSurface(R, lerp(a0f(y), a1f(y), u), y, lift);
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const yy = lerp(y0, y1, (v0 + v1) / 2);
        const am = lerp(a0f(yy), a1f(yy), (u0 + u1) / 2);
        const n = V3.norm([S(am), 0.15, C(am)]);
        const uv = uvBox ? [[uvBox[0] + u0 * uvBox[2], uvBox[1] + v0 * uvBox[3]], [uvBox[0] + u1 * uvBox[2], uvBox[1] + v0 * uvBox[3]], [uvBox[0] + u1 * uvBox[2], uvBox[1] + v1 * uvBox[3]], [uvBox[0] + u0 * uvBox[2], uvBox[1] + v1 * uvBox[3]]] : [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
        b.quad(pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1), col, uv, [n, n, n, n]);
      }
    }
  }

  const vOpen = (top, bottom, half) => (y) => half * clamp((y - bottom) / (top - bottom), 0, 1);

  function buildTorso(b, B, O, tex) {
    const R = B.rings;
    const n = R.length;
    const outer = O.jacket || O.shirt;
    const col = tex ? [1, 1, 1, 0] : outer;
    const rings = R.map(([y, rx, rz, cz]) => ring(y, rx, rz, cz, outer));
    if (tex) {
      const sides = 18;
      for (let j = 0; j < n - 1; j++) {
        const r0 = R[j], r1 = R[j + 1];
        for (let i = 0; i < sides; i++) {
          const a0 = (i / sides) * PI * 2, a1 = ((i + 1) / sides) * PI * 2;
          const P = (r, a) => [S(a) * r[1], r[0], r[3] + C(a) * r[2]];
          const N = (r, a) => V3.norm([S(a) / r[1], 0.1, C(a) / r[2]]);
          b.quad(P(r0, a0), P(r0, a1), P(r1, a1), P(r1, a0), col, [[i / sides * 3, j / (n - 1) * 2], [(i + 1) / sides * 3, j / (n - 1) * 2], [(i + 1) / sides * 3, (j + 1) / (n - 1) * 2], [i / sides * 3, (j + 1) / (n - 1) * 2]], [N(r0, a0), N(r0, a1), N(r1, a1), N(r1, a0)]);
        }
      }
      return;
    }
    loft(b, rings, 18, { capBottom: true });
  }

  function buildFront(b, B, O) {
    const R = B.rings;
    const yTop = R[R.length - 3][0] + 0.03;
    const k = B.k;
    if (O.jacket) {
      const yV = O.vDepth === undefined ? -0.02 : O.vDepth;
      const half = O.vHalf || 0.3;
      const ao = O.straight ? () => O.straight : vOpen(yTop + 0.02, yV, half);
      if (O.collar !== 'zip') band(b, R, O.straight ? R[0][0] + 0.02 : yV, yTop + 0.02, y => -ao(y), y => ao(y), 0.012, O.shirt, 5, 4);
      if (O.lapel) {
        const y0 = O.straight ? R[0][0] + 0.02 : yV;
        const lw = O.straight ? 0.12 : 0.22;
        band(b, R, y0, yTop + 0.02, y => ao(y), y => ao(y) + lw, 0.02, O.lapel, 5, 1);
        band(b, R, y0, yTop + 0.02, y => -ao(y) - lw, y => -ao(y), 0.02, O.lapel, 5, 1);
      }
      if (O.collar === 'zip') {
        const pts = [];
        for (let y = R[0][0] + 0.01; y < yTop; y += 0.03) pts.push(onSurface(R, 0.02, y, 0.02));
        K.tube(b, pts, pts.map(() => 0.004), 4, shade(O.jacket, 0.7));
      }
    }
    const s = surfaceAt(R, yTop);
    const nk = B.neck * k;
    if (O.collar === 'point' || O.collar === 'polo') {
      const big = O.collar === 'polo' ? 1.25 : 1;
      [-1, 1].forEach(side => {
        const base = [side * nk * 0.95, yTop + 0.035, s.cz + nk * 0.55];
        const tip = [side * nk * 0.55 * big, yTop - 0.035 * big, s.cz + nk * 1.25];
        const back = [side * nk * 1.15, yTop + 0.05, s.cz - nk * 0.2];
        const outerP = [side * nk * 1.55 * big, yTop - 0.005, s.cz + nk * 0.5];
        const nrm = V3.norm([side * 0.6, 0.4, 0.7]);
        b.quad(base, back, outerP, tip, O.collarCol || O.shirt, null, [nrm, nrm, nrm, nrm]);
      });
      b.at(0, yTop + 0.02, s.cz, q => loft(q, [ring(-0.012, nk * 1.12, nk * 1.05, 0, O.collarCol || O.shirt), ring(0.03, nk * 1.05, nk * 1.0, 0, O.collarCol || O.shirt)], 14));
    } else if (O.collar === 'tee' || O.collar === 'round' || O.collar === 'henley') {
      const kk = O.jacket ? 1.0 : 1.12;
      b.at(0, yTop + 0.012, s.cz + 0.004, q => loft(q, [ring(-0.01, nk * 1.1 * kk, nk * 1.04 * kk, 0, O.collarCol || O.shirt), ring(0.012, nk * 1.03 * kk, nk * 0.98 * kk, 0, O.collarCol || O.shirt)], 14));
      if (O.collar === 'henley') [0.0, -0.035].forEach(y => b.at(0, yTop + y, s.cz + s.rz * 0.98, q => q.ellipsoid(0.004, 0.004, 0.003, 5, 3, 0x2a1a14)));
    } else if (O.collar === 'hood') {
      const hc = O.hoodCol || O.jacket;
      const pts = [];
      for (let i = 0; i <= 14; i++) {
        const a = -PI * 0.56 + (i / 14) * PI * 1.12;
        pts.push([S(a) * nk * 1.75, yTop - 0.005 + 0.025 * C(a), s.cz - C(a) * nk * 1.55]);
      }
      K.tube(b, pts, pts.map((p, i) => 0.022 + 0.014 * S((i / 14) * PI)), 7, hc);
      b.at(0, yTop + 0.01, s.cz + 0.006, q => loft(q, [ring(-0.012, nk * 1.22, nk * 1.12, 0, O.shirt), ring(0.012, nk * 1.1, nk * 1.03, 0, O.shirt)], 14));
      if (O.straight) [-1, 1].forEach(sd => K.tube(b, [onSurface(R, sd * (O.straight + 0.05), yTop - 0.02, 0.03), onSurface(R, sd * (O.straight + 0.06), yTop - 0.24, 0.03)], [0.0035, 0.0035], 4, 0xd8d8d8));
    } else if (O.collar === 'scrubs') {
      const pts = [[-nk * 1.6, yTop + 0.02, s.cz + nk * 0.4], [0, yTop - 0.07, s.cz + s.rz * 1.02], [nk * 1.6, yTop + 0.02, s.cz + nk * 0.4]];
      K.tube(b, pts, [0.006, 0.006, 0.006], 4, shade(O.shirt, 0.85));
      band(b, R, yTop - 0.07, yTop + 0.02, y => -0.32 * clamp((y - (yTop - 0.07)) / 0.09, 0, 1), y => 0.32 * clamp((y - (yTop - 0.07)) / 0.09, 0, 1), 0.012, O.under || 0xf0f0ee, 3, 3);
    } else if (O.collar === 'zip') {
      b.at(0, yTop + 0.025, s.cz, q => loft(q, [ring(-0.02, nk * 1.35, nk * 1.25, 0, O.jacket), ring(0.04, nk * 1.25, nk * 1.15, 0, O.jacket)], 14));
    }
    if (O.apron) {
      band(b, R, R[0][0] - 0.25, yTop - 0.06, () => -1.0, () => 1.0, 0.03, O.apron, 6, 6);
      [-1, 1].forEach(sd => K.tube(b, [onSurface(R, sd * 0.6, yTop - 0.06, 0.04), [sd * nk * 1.1, yTop + 0.05, s.cz - 0.01]], [0.006, 0.006], 4, O.apron));
    }
    if (O.pocketPen) {
      const p = onSurface(R, 0.42, yTop - 0.17, 0.02);
      K.tube(b, [[p[0], p[1] - 0.03, p[2]], [p[0], p[1] + 0.025, p[2] + 0.003]], [0.0035, 0.0035], 5, 0x2a72c8);
      b.at(p[0] + 0.008, p[1] + 0.006, p[2] + 0.004, q => q.box(0.005, 0.03, 0.004, 0x58a8e8));
    }
  }

  function buildTie(b, B, O) {
    const R = B.rings;
    const yTop = R[R.length - 3][0] + 0.03;
    const yEnd = yTop - 0.36;
    const half = (y) => (0.016 + 0.02 * clamp((yTop - y) / (yTop - yEnd), 0, 1)) / surfaceAt(R, y).rx;
    band(b, R, yEnd, yTop - 0.012, y => -half(y), y => half(y), 0.022, O.tieTex ? [1, 1, 1, 0] : O.tie, 7, 2);
    const knot = onSurface(R, 0, yTop - 0.002, 0.026);
    b.push(M4.translate(knot[0], knot[1], knot[2]));
    b.prism(6, 0.016, 0.008, -0.012, 0.011, 0.006, 0.012, O.tieKnot || O.tie, { capBottom: true });
    b.pop();
  }

  function buildPrint(b, B, O) {
    const R = B.rings;
    const yTop = R[R.length - 3][0] + 0.03;
    const half = O.straight || 0.3;
    band(b, R, R[0][0] + 0.06, yTop - 0.04, () => -half * 0.95, () => half * 0.95, 0.016, [1, 1, 1, 0], 4, 4);
  }

  function buildPelvis(b, B, O) {
    const k = B.k;
    const top = O.jacket && O.long ? O.jacket : O.untucked ? O.shirt : O.pants;
    loft(b, [ring(-0.17, 0.15 * k, 0.12 * k, -0.01, O.pants), ring(-0.09, 0.19 * k, 0.15 * k, -0.01, O.pants), ring(0.02, 0.2 * k, 0.16 * k, 0.0, top), ring(0.09, 0.2 * k, 0.16 * k, 0.01, top)], 14, { capBottom: true, capTop: true });
    if (O.belt) b.at(0, 0.0, 0.0, q => loft(q, [ring(-0.012, 0.202 * k, 0.162 * k, 0, O.belt), ring(0.012, 0.202 * k, 0.162 * k, 0, O.belt)], 14));
  }

  function buildUpper(b, B, O) {
    const D = B.D, k = B.k;
    const col = O.sleeve || O.jacket || O.shirt;
    b.at(0, -0.025, 0, q => q.ellipsoid(0.06 * k, 0.062 * k, 0.064 * k, 9, 6, col));
    if (O.short) {
      loft(b, [ring(-0.16, 0.062 * k, 0.064 * k, 0, col), ring(-0.08, 0.07 * k, 0.072 * k, 0, col), ring(0.03, 0.078 * k, 0.08 * k, 0, col)], 10, { capBottom: false });
      loft(b, [ring(-D.upper - 0.01, 0.047 * k, 0.05 * k, 0, O.skin), ring(-0.15, 0.054 * k, 0.056 * k, 0, O.skin)], 10, { capBottom: true });
      return;
    }
    loft(b, [ring(-D.upper - 0.01, 0.05 * k, 0.052 * k, 0, col), ring(-0.18, 0.058 * k, 0.06 * k, 0, col), ring(-0.04, 0.066 * k, 0.068 * k, 0, col), ring(0.02, 0.062 * k, 0.064 * k, 0, col)], 10, { capBottom: true });
  }

  function buildFore(b, B, O) {
    const D = B.D, k = B.k;
    const col = O.short ? O.skin : O.sleeve || O.jacket || O.shirt;
    b.ellipsoid(0.056 * k, 0.056 * k, 0.056 * k, 8, 5, col);
    loft(b, [ring(-D.fore + 0.005, 0.038 * k, 0.042 * k, 0, O.short ? O.skin : col), ring(-0.16, 0.05 * k, 0.053 * k, 0, col), ring(0.0, 0.055 * k, 0.057 * k, 0, col)], 10, { capBottom: true });
    if (!O.short) {
      const cuff = O.jacket && !O.noCuff ? O.shirt : shade(col, 0.85);
      b.at(0, -D.fore + 0.022, 0, q => q.prism(10, 0.042 * k, 0.045 * k, -0.02, 0.042 * k, 0.045 * k, 0.016, cuff));
    }
    if (O.watch) b.at(0, -D.fore + 0.03, 0, q => q.prism(10, 0.04 * k, 0.043 * k, -0.01, 0.04 * k, 0.043 * k, 0.01, O.watch));
  }

  const CURL = {
    relax: [0.3, 0.38, 0.45, 0.5, 0.25], open: [0.05, 0.05, 0.08, 0.1, 0.05], flat: [0.02, 0.0, 0.02, 0.04, -0.1], fist: [1.5, 1.55, 1.55, 1.5, 0.8],
    grip: [1.05, 1.1, 1.15, 1.2, 0.6], point: [0.0, 1.5, 1.5, 1.5, 0.7], gun: [1.2, 1.3, 1.35, 1.4, 0.3], pinch: [0.6, 0.9, 1.1, 1.2, 0.7], claw: [0.7, 0.75, 0.8, 0.85, 0.4], spread: [0.1, 0.06, 0.08, 0.12, -0.2]
  };

  function finger(b, base, curl, len, rad, sk, spread) {
    let p = base, dir = V3.norm([0, -1, spread || 0]);
    const pts = [p];
    [0.46, 0.31, 0.23].forEach((part, k) => {
      const a = curl * (k === 0 ? 0.6 : 0.8);
      const c = C(a), sn = S(a);
      dir = V3.norm([dir[0] * c + sn * Math.abs(dir[1]), dir[1] * c - sn * Math.max(0, dir[0]) * 0.3, dir[2]]);
      p = V3.add(p, V3.mul(dir, len * part));
      pts.push(p);
    });
    K.tube(b, pts, [rad, rad * 0.95, rad * 0.88, rad * 0.78], 6, sk);
    b.at(p[0], p[1], p[2], q => q.ellipsoid(rad * 0.78, rad * 0.78, rad * 0.78, 6, 4, sk));
    pts.slice(1, 3).forEach(q0 => b.at(q0[0], q0[1], q0[2], q => q.ellipsoid(rad * 1.02, rad * 1.02, rad * 1.02, 6, 4, sk)));
    return pts;
  }

  function buildHand(b, sk, side, grip, k, ring_) {
    const sgn = side === 'L' ? 1 : -1;
    const curl = CURL[grip] || CURL.relax;
    const kk = k || 1;
    b.push(M4.scale(sgn, 1, 1));
    b.at(0.004 * kk, -0.05 * kk, 0, q => q.ellipsoid(0.017 * kk, 0.05 * kk, 0.042 * kk, 10, 7, sk));
    const zs = [0.028, 0.01, -0.008, -0.025];
    const lens = [0.074, 0.083, 0.078, 0.062];
    const fingers = zs.map((z, i) => finger(b, [0.004 * kk, -0.09 * kk, z * kk], curl[i], lens[i] * kk, 0.0083 * kk, sk, (i - 1.5) * 0.06 * (grip === 'spread' ? 2.5 : 1)));
    if (ring_) {
      const f = fingers[2];
      const c = V3.add(f[0], V3.mul(V3.sub(f[1], f[0]), 0.45));
      const d = V3.norm(V3.sub(f[1], f[0]));
      b.push(M4.translate(c[0], c[1], c[2]));
      const up = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
      const ax = V3.norm(V3.cross(d, up));
      const ay = V3.cross(d, ax);
      const pts = [];
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * PI * 2;
        pts.push(V3.add(V3.mul(ax, C(a) * 0.0098 * kk), V3.mul(ay, S(a) * 0.0098 * kk)));
      }
      K.tube(b, pts, pts.map(() => 0.0024 * kk), 4, 0xd8b048);
      b.pop();
    }
    const t = curl[4];
    const t0 = [0.012 * kk, -0.028 * kk, 0.034 * kk];
    const t1 = [0.022 * kk + 0.012 * t * kk, -0.055 * kk, 0.052 * kk - 0.012 * t * kk];
    const t2 = [0.03 * kk + 0.022 * t * kk, -0.077 * kk - 0.004 * t * kk, 0.064 * kk - 0.03 * t * kk];
    K.tube(b, [t0, t1, t2], [0.0115 * kk, 0.0098 * kk, 0.0085 * kk], 6, sk);
    b.at(t2[0], t2[1], t2[2], q => q.ellipsoid(0.0085 * kk, 0.0085 * kk, 0.0085 * kk, 6, 4, sk));
    b.pop();
  }

  function buildThigh(b, B, O) {
    const D = B.D, k = B.k;
    loft(b, [ring(-D.thigh - 0.02, 0.064 * k, 0.066 * k, 0, O.pants), ring(-0.3, 0.076 * k, 0.08 * k, 0, O.pants), ring(-0.12, 0.09 * k, 0.094 * k, 0.005, O.pants), ring(0.05, 0.096 * k, 0.096 * k, 0, O.pants)], 10, { capBottom: true, capTop: true });
  }

  function buildShin(b, B, O) {
    const D = B.D, k = B.k;
    b.ellipsoid(0.06 * k, 0.058 * k, 0.064 * k, 8, 5, O.pants);
    loft(b, [ring(-D.shin + 0.02, 0.05 * k, 0.052 * k, 0, O.pants), ring(-0.3, 0.054 * k, 0.058 * k, 0, O.pants), ring(0, 0.06 * k, 0.064 * k, 0, O.pants)], 10, { capBottom: true });
  }

  function buildFoot(b, O) {
    b.at(0, -0.04, 0, q => q.ellipsoid(0.046, 0.04, 0.05, 7, 4, O.shoe));
    b.at(0, -0.062, 0.055, q => q.box(0.092, 0.05, 0.215, O.shoe));
    if (O.soles) b.at(0, -0.085, 0.055, q => q.box(0.094, 0.012, 0.218, O.soles));
  }

  const SKIN = { walt: 0xc69482, hank: 0xc98f80, jesse: 0xcfa292, saul: 0xc99886, mike: 0xc29488, gus: 0x6a4434, gomez: 0xa47460, eladio: 0xb48262, doctor: 0xc69a8a, pete: 0xceaa9c, badger: 0xd6b2a4, lady: 0xd8b4a4, old: 0xc69c90 };

  const LOOKS = {
    waltDrive: { head: 'walt', body: 'avg', glasses: 'walt', O: { shirt: 0xd8c8b0, collar: 'point', pants: 0x6a6258, shoe: 0x3a2c22 } },
    waltRub: { head: 'walt', body: 'avg', glasses: 'walt', O: { shirt: 0x8a6a4a, jacket: 0x6a5038, collar: 'point', pants: 0x4a4038, shoe: 0x2a2018 } },
    waltDark: { head: 'walt', body: 'avg', glasses: 'walt', O: { shirt: 0x5a5a62, jacket: 0x2a2a2e, collar: 'point', pants: 0x2a2a2e, shoe: 0x1a1a1a } },
    waltKnock: { head: 'walt', body: 'avg', O: { shirt: 0x5a1c22, collar: 'round', pants: 0x2a2a2e, shoe: 0x1a1a1a } },
    waltApron: { head: 'walt', body: 'avg', O: { shirt: 0x1a1a1e, collar: 'tee', short: true, apron: 0xe0501c, pants: 0x2a2a30, shoe: 0x1a1a1a } },
    waltDesert: { head: 'walt', body: 'avg', glasses: 'walt', O: { shirt: 0x2a3a7a, jacket: 0x3a2e24, lapel: 0x34291f, collar: 'point', pants: 0x3a3430, shoe: 0x1a1612 } },
    waltSky: { head: 'walt', body: 'avg', glasses: 'walt', O: { shirt: 0x5a6ec8, jacket: 0xd8cbb0, lapel: 0xcdbfa3, collar: 'point', vHalf: 0.36, pants: 0x4a4440, shoe: 0x2a2018 } },
    waltSweater: { head: 'walt', body: 'avg', glasses: 'walt', O: { shirt: 0x6e6c6a, jacket: 0x5c5a58, collar: 'zip', pants: 0x2a2a2e, shoe: 0x1a1a1a, under: 0xd8d4cc } },
    waltWhite: { head: 'walt', body: 'avg', glasses: 'walt', O: { shirt: 0xe8e8ec, collar: 'point', pants: 0x4a4a52, shoe: 0x2a2a2a, tex: 'check' } },
    waltTan: { head: 'walt', body: 'avg', glasses: 'walt', O: { shirt: 0x8a9ab8, jacket: 0xa89070, lapel: 0x9c8466, collar: 'point', vHalf: 0.34, pants: 0x5a5048, shoe: 0x2a2018 } },
    waltNavy: { head: 'walt', body: 'avg', glasses: 'walt', O: { shirt: 0x26305a, collar: 'point', pants: 0x2a2a30, shoe: 0x1a1a1a, watch: 0x2a2a2a, tex: 'plaidNavy' } },
    waltGun: { head: 'walt', body: 'avg', glasses: 'walt', O: { shirt: 0x8a8070, jacket: 0x7a7262, collar: 'point', pants: 0x4a4440, shoe: 0x2a2018 } },
    hankPolo: { head: 'hank', body: 'heavy', O: { shirt: 0x5e4a30, collar: 'polo', short: true, pants: 0x3a3430, shoe: 0x2a2018, pocketPen: true, tex: 'polo' } },
    hankCamo: { head: 'hank', body: 'heavy', O: { shirt: 0x5a5a40, collar: 'point', pants: 0x3a3430, shoe: 0x2a2018, tex: 'camo' } },
    hankBed: { head: 'hank', body: 'heavy', O: { shirt: 0xf0f0f2, collar: 'point', collarCol: 0xf6f6f8, pants: 0xf0f0f2, shoe: 0xe0e0e0, tex: 'pajama' } },
    hankNight: { head: 'hank', body: 'heavy', O: { shirt: 0x6a2a4a, collar: 'point', pants: 0x3a3a40, shoe: 0x2a2a2a } },
    hankTie: { head: 'hank', body: 'heavy', O: { shirt: 0xc8ccd2, collar: 'point', tie: 0x3a4250, tieTex: 'stripe', tieKnot: 0x4a5260, pants: 0x3a3a40, shoe: 0x1a1a1a } },
    hankWall: { head: 'hank', body: 'heavy', O: { shirt: 0x6a1e1a, jacket: 0x262422, collar: 'zip', pants: 0x3a3430, shoe: 0x1a1a1a } },
    jesseJacket: { head: 'jesse', body: 'slim', O: { shirt: 0xcfcfcf, jacket: 0x1c1c1e, collar: 'tee', lapel: 0x111113, straight: 0.2, pants: 0x2a2e3a, shoe: 0x1a1a1a, tex: 'leather' } },
    jesseHood: { head: 'jesse', body: 'slim', O: { shirt: 0x3a3a3e, jacket: 0x1e1e20, collar: 'hood', straight: 0.14, pants: 0x2a2e3a, shoe: 0x1a1a1a } },
    jesseBruise: { head: 'jesse', face: 'bruise', body: 'slim', O: { shirt: 0x3a3a3e, jacket: 0x2a2a2c, collar: 'zip', pants: 0x2a2e3a, shoe: 0x1a1a1a } },
    jesseJump: { head: 'jesse', body: 'slim', O: { shirt: 0x1c1e1c, jacket: 0x4a4a4c, collar: 'tee', straight: 0.34, pants: 0x3a3a40, shoe: 0x1a1a1a, tex: 'plaid', inner: 'bolt' } },
    jesseGreen: { head: 'jesse', body: 'slim', O: { shirt: 0x3a4630, jacket: 0x3e4a34, collar: 'zip', pants: 0x2a2e3a, shoe: 0x1a1a1a } },
    jesseCam: { head: 'jesse', body: 'slim', O: { shirt: 0x6a4a34, jacket: 0x4a4a4e, collar: 'round', vHalf: 0.5, pants: 0x2a2e3a, shoe: 0x1a1a1a } },
    jesseLab: { head: 'jesse', body: 'slim', O: { shirt: 0xd8d8d8, collar: 'round', pants: 0x2a2a2e, shoe: 0x1a1a1a, tex: 'paisley' } },
    jesseHouse: { head: 'jesse', body: 'slim', O: { shirt: 0xe6e2da, collar: 'round', pants: 0xd8d0c0, shoe: 0xe8e8e8 } },
    saulSuit: { head: 'saul', body: 'avg', O: { shirt: 0xc8d0e0, jacket: 0x22242a, lapel: 0x1c1e24, collar: 'point', tie: 0xa88a2a, tieTex: 'paisleyTie', tieKnot: 0x9a7c24, pants: 0x22242a, shoe: 0x141414 } },
    saulAd: { head: 'saul', body: 'avg', O: { shirt: 0x5a3a6a, jacket: 0x857a62, lapel: 0x7c7258, collar: 'point', tie: 0xc8a830, tieTex: 'paisleyTie', tieKnot: 0xb89824, pants: 0xb8a078, shoe: 0x3a2a1a } },
    mikeCar: { head: 'mike', body: 'avg', O: { shirt: 0x5a4a3a, jacket: 0x2c2e2c, collar: 'zip', pants: 0x3a3a38, shoe: 0x1a1a1a } },
    mikeDark: { head: 'mike', body: 'avg', O: { shirt: 0x24283a, jacket: 0x1e2232, collar: 'zip', pants: 0x2a2a30, shoe: 0x1a1a1a } },
    gusSuit: { head: 'gus', body: 'slim', glasses: 'gus', O: { shirt: 0xd8dce4, jacket: 0x2a3456, lapel: 0x26304e, collar: 'point', tie: 0x2a2e3e, tieTex: 'stripe', tieKnot: 0x343a4a, pants: 0x2a3456, shoe: 0x141414, tex: 'gusSuit' } },
    gomez: { head: 'gomez', body: 'avg', O: { shirt: 0x1e1e22, jacket: 0x2a2a2e, collar: 'point', pants: 0x2a2a2e, shoe: 0x1a1a1a } },
    eladio: { head: 'eladio', body: 'avg', O: { shirt: 0x4a6cc8, collar: 'point', vHalf: 0.3, pants: 0xe8e2d6, shoe: 0x5a4030, watch: 0x2a2a2a } },
    doctor: { head: 'doctor', body: 'heavy', O: { shirt: 0x8aa6c8, collar: 'scrubs', short: true, pants: 0x8aa6c8, shoe: 0xe8e8e8, under: 0xf0f0ee, mask: true } },
    pete: { head: 'pete', body: 'slim', O: { shirt: 0x2a2a2e, jacket: 0x1e1e20, collar: 'hood', pants: 0x2a3040, shoe: 0x1a1a1a, beanie: 0x1a1a1c } },
    badger: { head: 'badger', body: 'slim', O: { shirt: 0x5a5a3a, jacket: 0x2a2a28, collar: 'hood', pants: 0x5a5a40, shoe: 0x2a2a2a, beanie: 0x2a2a2c, tex: 'camoPants' } },
    lady: { head: 'lady', body: 'slim', O: { shirt: 0x8a8090, collar: 'round', pants: 0x2a2a30, shoe: 0x1a1a1a } },
    marie: { head: 'lady', body: 'slim', O: { shirt: 0x5a2a6a, collar: 'round', pants: 0x2a2a30, shoe: 0x1a1a1a } },
    old: { head: 'old', body: 'avg', O: { shirt: 0x4a4a52, collar: 'point', pants: 0x3a3a40, shoe: 0x1a1a1a } }
  };

  Object.values(LOOKS).forEach(L => { L.O.skin = SKIN[L.head]; });

  function buildMask(b, H) {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const yaw = -1.3 + (i / 12) * 2.6;
      const p = vertexAt(H, yaw, -1.05 - 0.12 * C(yaw * 1.2), false, 0, 0);
      pts.push(V3.add(V3.mul(p, 1.06), [0, -0.012, 0.006]));
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], c = pts[i + 1];
      const d = [0, -0.045, 0.012];
      const n = V3.norm([a[0] + c[0], 0.2, a[2] + c[2] + 0.05]);
      b.quad(a, c, V3.add(c, d), V3.add(a, d), 0xa8c0d8, null, [n, n, n, n]);
    }
    [-1, 1].forEach(s => {
      const e = vertexAt(H, s * 1.55, 0.0, false, 0, 0);
      K.tube(b, [V3.mul(pts[s < 0 ? 0 : pts.length - 1], 1.0), [e[0] * 1.08, e[1], e[2]]], [0.0018, 0.0018], 3, 0xe8eef4);
    });
  }

  function build(r) {
    const cache = {};
    const tex = {};
    const Faces = window.BreakFaces;
    const Art = window.BreakArt;
    const faceTex = (who, variant) => {
      const key = who + ':' + (variant || '');
      if (!tex[key]) {
        const H = HEADS[who];
        tex[key] = r.texture(H.size, Faces.paint(who, H, variant, SKIN[who]), { height: H.size / 2 });
      }
      return tex[key];
    };
    const headSet = {};
    const headFor = (who) => {
      if (headSet[who]) return headSet[who];
      const H = HEADS[who];
      const skin = SKIN[who];
      const out = { heads: {}, insides: {}, ears: mesh(r, b => buildEars(b, H, skin)) };
      out.get = (lvl, smile) => {
        const key = lvl + ':' + smile;
        if (!out.heads[key]) {
          out.heads[key] = mesh(r, b => buildHeadMesh(b, H, lvl / 3, smile));
          out.insides[key] = mesh(r, b => buildMouthInside(b, H, lvl / 3, skin));
        }
        return { head: out.heads[key], inside: out.insides[key] };
      };
      headSet[who] = out;
      return out;
    };
    const lookFor = (id) => {
      if (cache[id]) return cache[id];
      const L = LOOKS[id];
      const B = BODIES[L.body];
      const O = L.O;
      const H = HEADS[L.head];
      const t = O.tex ? r.texture(256, Art.cloth(O.tex, O), {}) : null;
      const hands = {};
      const out = {
        L, B, O, H,
        hs: headFor(L.head),
        face: faceTex(L.head, L.face),
        torso: mesh(r, b => buildTorso(b, B, O, t)),
        torsoTex: t,
        front: mesh(r, b => buildFront(b, B, O)),
        tie: O.tie ? mesh(r, b => buildTie(b, B, O)) : null,
        print: O.inner ? mesh(r, b => buildPrint(b, B, O)) : null,
        printTex: O.inner ? r.texture(128, Art.chest, {}) : null,
        tieTex: O.tieTex ? r.texture(64, Art.cloth(O.tieTex, O), { height: 128 }) : null,
        pelvis: mesh(r, b => buildPelvis(b, B, O)),
        upper: mesh(r, b => buildUpper(b, B, O)),
        fore: mesh(r, b => buildFore(b, B, O)),
        thigh: mesh(r, b => buildThigh(b, B, O)),
        shin: mesh(r, b => buildShin(b, B, O)),
        foot: mesh(r, b => buildFoot(b, O)),
        neck: mesh(r, b => loft(b, [ring(-0.07, B.neck * B.k * 1.05, B.neck * B.k, 0, O.skin), ring(0.06, B.neck * B.k * 0.98, B.neck * B.k * 0.95, 0.008, O.skin), ring(0.13, B.neck * B.k * 0.9, B.neck * B.k * 0.85, 0.012, O.skin)], 12)),
        glasses: L.glasses ? mesh(r, b => buildGlasses(b, H, GLASSES[L.glasses])) : null,
        lenses: L.glasses ? mesh(r, b => buildLenses(b, H, GLASSES[L.glasses])) : null,
        mask: O.mask ? mesh(r, b => buildMask(b, H)) : null,
        hand: (side, grip, ringOn) => {
          const key = side + grip + (ringOn ? 'r' : '');
          if (!hands[key]) hands[key] = mesh(r, b => buildHand(b, O.skin, side, grip, B.k, ringOn));
          return hands[key];
        }
      };
      cache[id] = out;
      return out;
    };
    return { lookFor, faceTex, headFor };
  }

  function solve(id, pose) {
    const L = LOOKS[id];
    const B = BODIES[L.body];
    const yaw = pose.yaw || 0;
    const lean = pose.lean || 0;
    const roll = pose.roll || 0;
    const cy = C(yaw), sy = S(yaw);
    const fwd = [sy, 0, cy];
    const up = V3.norm([sy * S(lean) + cy * S(roll), C(lean) * C(roll), cy * S(lean) - sy * S(roll)]);
    return Rig.solve(Object.assign({}, pose, { p: pose.pos || [0, 1.0, 0], fwd, up }), B.D);
  }

  function draw(r, CST, id, m, pose, opts) {
    const o = opts || {};
    const V = CST.lookFor(id);
    const P = V.O;
    const extra = o.tint ? { tint: o.tint } : {};
    const W = (x) => Object.assign({}, x || {}, extra);
    if (!pose.noBody) {
      if (!pose.noLegs) r.draw(V.pelvis, m.pelvis, W());
      r.draw(V.torso, m.chest, W(V.torsoTex ? { texture: V.torsoTex } : null));
      r.draw(V.front, m.chest, W());
      if (V.tie) r.draw(V.tie, m.chest, W(V.tieTex ? { texture: V.tieTex } : null));
      if (V.print) r.draw(V.print, m.chest, W({ texture: V.printTex }));
    }
    r.draw(V.neck, m.neck, W());
    if (!pose.noHead) {
      const lvl = clamp(Math.round((pose.jaw || 0) * 3), 0, 3);
      const hm = V.hs.get(lvl, pose.smile || 0);
      r.draw(hm.head, m.head, W({ texture: V.face }));
      r.draw(hm.inside, m.head, W());
      r.draw(V.hs.ears, m.head, W());
      if (V.glasses) {
        r.draw(V.glasses, m.head, W());
        if (!o.noLens) r.draw(V.lenses, m.head, { blend: true, alpha: o.lensAlpha || 0.12 });
      }
      if (V.mask) r.draw(V.mask, m.head, W());
    }
    if (!pose.noArms) {
      ['L', 'R'].forEach(s => {
        if (pose['hide' + s]) return;
        r.draw(V.upper, m['upper' + s], W());
        r.draw(V.fore, m['fore' + s], W());
        r.draw(V.hand(s, pose['g' + s] || 'relax', pose['ring' + s]), m['hand' + s], W());
      });
    }
    if (!pose.noLegs && !pose.noBody) {
      ['L', 'R'].forEach(s => {
        r.draw(V.thigh, m['thigh' + s], W());
        r.draw(V.shin, m['shin' + s], W());
        r.draw(V.foot, m['foot' + s], W());
      });
    }
  }

  function drawArm(r, CST, id, side, elbow, wrist, grip, opts) {
    const V = CST.lookFor(id);
    const o = opts || {};
    const front = o.front || [0, 0, 1];
    const fore = Rig.boneM(elbow, wrist, front);
    r.draw(V.fore, fore, o.tint ? { tint: o.tint } : {});
    const w = o.w || [0, 0, 0];
    const k = side === 'L' ? 1 : -1;
    const hand = M4.chain(Rig.basisM(wrist, [fore[0], fore[1], fore[2]], [fore[4], fore[5], fore[6]], [fore[8], fore[9], fore[10]]), M4.rotX(w[0]), M4.rotY(k * w[1]), M4.rotZ(k * w[2]));
    r.draw(V.hand(side, grip || 'relax', o.ring), hand, o.tint ? { tint: o.tint } : {});
    if (o.upper) r.draw(V.upper, Rig.boneM(o.upper, elbow, front), o.tint ? { tint: o.tint } : {});
    return hand;
  }

  window.BreakCast = { HEADS, LOOKS, BODIES, SKIN, GLASSES, vertexAt, baseShape, build, solve, draw, drawArm, buildHand, dirOf };
})();
