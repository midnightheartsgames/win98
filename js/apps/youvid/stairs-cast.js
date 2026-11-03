(function () {
  const { M4, V3, rgb, shade, Builder } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;
  const Break = window.BreakCast;
  const Faces = window.BreakFaces;
  const Art = window.StairsArt;

  const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };

  const HEADS = {
    joker: { rx: 0.067, ry: 0.105, rz: 0.092, top: 1.02, back: 0.97, jaw: 0.1, gonion: 0.1, chinIn: 0.06, chinDrop: 0.07, brow: 0.0078, cheek: -0.0045, socket: 0.0098, eyeX: 0.4, eyeY: 0.08, nose: { len: 0.0145, w: 0.19 }, mouth: -0.5, corner: 0.31, lips: 0.003, muzzle: 0.004, chin: 0.005, size: 2048 },
    burke: { rx: 0.084, ry: 0.11, rz: 0.1, top: 0.98, box: 0.72, back: 1.0, hair: 'comb', jaw: 0.007, gonion: 0.28, chinIn: 0.04, chinDrop: 0.08, brow: 0.0097, cheek: 0.004, socket: 0.0094, eyeX: 0.38, eyeY: 0.08, nose: { len: 0.0128 }, mouth: -0.52, corner: 0.31, lips: 0.0026, muzzle: 0.006, chin: 0.006, jowl: 0.16, size: 1024 },
    garrity: { rx: 0.075, ry: 0.108, rz: 0.096, top: 1.03, back: 0.98, jaw: 0.045, gonion: 0.22, chinIn: 0.05, chinDrop: 0.07, brow: 0.0078, cheek: 0.003, socket: 0.0088, eyeX: 0.4, eyeY: 0.08, nose: { len: 0.0128 }, mouth: -0.52, corner: 0.31, lips: 0.003, muzzle: 0.004, chin: 0.005, hair: 'comb', size: 1024 },
    walker: { rx: 0.075, ry: 0.106, rz: 0.095, top: 1.0, back: 0.98, jaw: 0.04, gonion: 0.2, chinIn: 0.05, chinDrop: 0.07, brow: 0.007, cheek: 0.003, socket: 0.008, eyeX: 0.4, eyeY: 0.08, nose: { len: 0.013 }, mouth: -0.52, corner: 0.31, lips: 0.003, muzzle: 0.004, chin: 0.004, hair: 'short', size: 512 }
  };
  Object.values(HEADS).forEach(H => { H.nose = Object.assign({}, Break.HEADS.jesse.nose, H.nose); });

  Faces.SPEC.burke = Faces.SPEC.burke || { iris: '#5a5a4a', brow: '#7a6650', browW: 3.8, browArch: 1.4, lip: '#a86a5e', lipLow: '#b87a6c', age: 0.85, shine: 0.18, scalp: 'comb', hair: '#8a7660', heavy: true, bags: 1, mustache: { col: '#5e4a3a', grey: '#a89a88' } };
  Faces.SPEC.garrity = Faces.SPEC.garrity || { iris: '#5a6a7a', brow: '#5a4430', browW: 3.4, browArch: 1.7, lip: '#a8645a', lipLow: '#b8786a', age: 0.5, shine: 0.14, scalp: 'comb', hair: '#5e4a34' };
  Faces.SPEC.walker = Faces.SPEC.walker || { iris: '#4a3a2a', brow: '#3a2a1a', browW: 3.2, browArch: 1.4, lip: '#a46a5e', lipLow: '#b47a6c', age: 0.3, shine: 0.05, scalp: 'short', hair: '#2a2018' };

  const SKIN = { joker: 0xb08470, burke: 0xc6927e, garrity: 0xcf9e8a, walker: 0xb8866e };

  const BODIES = {
    joker: {
      rings: [[-0.21, 0.148, 0.106, 0.0], [-0.08, 0.15, 0.108, 0.004], [0.05, 0.16, 0.112, 0.008], [0.16, 0.178, 0.114, 0.004], [0.24, 0.192, 0.108, -0.004], [0.29, 0.19, 0.098, -0.008], [0.318, 0.16, 0.086, -0.006], [0.337, 0.1, 0.068, -0.002], [0.348, 0.062, 0.054, 0.002], [0.354, 0.054, 0.05, 0.004]],
      D: { hipX: 0.088, hipY: -0.05, thigh: 0.46, shin: 0.45, chestY: 0.13, neckY: 0.335, shX: 0.168, shY: 0.262, upper: 0.3, fore: 0.27, headY: 0.135 }, neck: 0.05, k: 0.94
    },
    heavy: {
      rings: [[-0.21, 0.2, 0.17, 0.05], [-0.08, 0.212, 0.182, 0.06], [0.05, 0.215, 0.172, 0.048], [0.16, 0.218, 0.156, 0.022], [0.24, 0.22, 0.142, 0.006], [0.29, 0.216, 0.128, -0.004], [0.318, 0.184, 0.112, -0.004], [0.337, 0.128, 0.09, 0.0], [0.348, 0.082, 0.074, 0.004], [0.354, 0.072, 0.068, 0.006]],
      D: { hipX: 0.11, hipY: -0.05, thigh: 0.44, shin: 0.43, chestY: 0.13, neckY: 0.335, shX: 0.192, shY: 0.262, upper: 0.29, fore: 0.27, headY: 0.13 }, neck: 0.068, k: 1.12
    },
    avg: {
      rings: [[-0.21, 0.16, 0.12, 0.02], [-0.08, 0.17, 0.135, 0.03], [0.05, 0.176, 0.135, 0.026], [0.16, 0.186, 0.128, 0.01], [0.24, 0.196, 0.12, 0.0], [0.29, 0.194, 0.108, -0.006], [0.318, 0.164, 0.094, -0.006], [0.337, 0.11, 0.074, -0.002], [0.348, 0.07, 0.06, 0.002], [0.354, 0.06, 0.055, 0.004]],
      D: { hipX: 0.1, hipY: -0.05, thigh: 0.45, shin: 0.44, chestY: 0.13, neckY: 0.335, shX: 0.172, shY: 0.262, upper: 0.29, fore: 0.27, headY: 0.135 }, neck: 0.056, k: 1
    }
  };

  const LOOKS = {
    joker: { head: 'joker', body: 'joker', O: { jacket: 0x9a3626, lapel: 0x8e3022, vest: 0xd7961c, shirt: 0x1f4a4a, pants: 0x9a3626, shoe: 0x3a2216, sock: 0xe8e4dc, skirt: 0.26, open: true, buttons: 0x8a5a12, cuff: 0x1f4a4a, peak: true } },
    burke: { head: 'burke', body: 'heavy', O: { jacket: 0x8f7d5a, lapel: 0x857250, shirt: 0xe8e6e0, tie: 0x2a2a30, tieStripe: 0x8a6a3a, pants: 0x4a4038, shoe: 0x1e1814, skirt: 0.62, open: true, coat: true, badge: true, cuff: 0xe8e6e0 } },
    garrity: { head: 'garrity', body: 'avg', O: { jacket: 0x1e2a44, lapel: 0x1a253e, shirt: 0xb8c8de, tie: 0x182038, tieStripe: 0x3a4a6a, pants: 0x262a36, shoe: 0x141414, skirt: 0.22, open: true, badge: true, cuff: 0xb8c8de } },
    walkerKhaki: { head: 'walker', body: 'avg', O: { jacket: 0x7a6a42, shirt: 0x5a4a32, pants: 0x34486a, shoe: 0x2a2018, skirt: 0.16, closed: true, cuff: 0x7a6a42 } },
    walkerCoat: { head: 'walker', body: 'avg', O: { jacket: 0x4a3a30, shirt: 0x3a3028, pants: 0x2a2a2e, shoe: 0x1a1a1a, skirt: 0.5, closed: true, cuff: 0x4a3a30 } },
    walkerGrey: { head: 'walker', body: 'avg', O: { jacket: 0x5a5a5e, shirt: 0x3a3a3e, pants: 0x2e2e34, shoe: 0x1a1a1a, skirt: 0.4, closed: true, cuff: 0x5a5a5e } }
  };

  function headGrid(H) {
    const k = H.size >= 2048 ? 1 : H.size >= 1024 ? 1.4 : 2.2;
    const cols = [];
    for (let y = -PI; y < PI - 1e-6;) {
      cols.push(y);
      const a = Math.abs(y);
      y += (a < 0.5 ? 0.034 : a < 1.45 ? 0.062 : 0.2) * k;
    }
    cols.push(PI);
    [H.corner, -H.corner, 0].forEach(v => { if (!cols.some(c => Math.abs(c - v) < 1e-6)) cols.push(v); });
    cols.sort((a, b) => a - b);
    const rows = [];
    for (let p = -PI / 2; p < PI / 2 - 1e-6;) {
      rows.push(p);
      p += (p > -0.72 && p < 0.3 ? 0.03 : p > -1.25 && p < 0.8 ? 0.058 : 0.16) * k;
    }
    rows.push(PI / 2);
    if (!rows.some(r => Math.abs(r - H.mouth) < 1e-6)) rows.push(H.mouth);
    rows.sort((a, b) => a - b);
    return { cols: cols.filter((c, i) => i === 0 || c - cols[i - 1] > 0.004), rows: rows.filter((r, i) => i === 0 || r - rows[i - 1] > 0.004) };
  }

  function buildHead(b, H, jaw, smile) {
    const G = headGrid(H);
    const cache = new Map();
    const vert = (i, j, lower) => {
      const key = i * 4096 + j * 2 + (lower ? 1 : 0);
      if (cache.has(key)) return cache.get(key);
      const yaw = G.cols[i], pit = G.rows[j];
      const at = (y, p) => Break.vertexAt(H, y, p, lower, jaw, smile);
      const p = at(yaw, pit);
      const e = 0.004;
      let n = V3.cross(V3.sub(at(yaw + e, pit), at(yaw - e, pit)), V3.sub(at(yaw, Math.min(PI / 2, pit + e)), at(yaw, Math.max(-PI / 2, pit - e))));
      n = V3.len(n) < 1e-12 ? V3.norm(p) : V3.norm(n);
      if (V3.dot(n, p) < 0) n = V3.mul(n, -1);
      const v = { p, n, uv: [(yaw + PI) / (2 * PI), (pit + PI / 2) / PI] };
      cache.set(key, v);
      return v;
    };
    const white = [1, 1, 1, 0];
    for (let j = 0; j < G.rows.length - 1; j++) {
      const lower = G.rows[j + 1] <= H.mouth + 1e-6;
      for (let i = 0; i < G.cols.length - 1; i++) {
        const a = vert(i, j, lower), bb = vert(i + 1, j, lower), c = vert(i + 1, j + 1, lower), d = vert(i, j + 1, lower);
        b.quad(a.p, bb.p, c.p, d.p, white, [a.uv, bb.uv, c.uv, d.uv], [a.n, bb.n, c.n, d.n]);
      }
    }
  }

  function buildMouth(b, H, jaw) {
    const yM = S(H.mouth) * H.ry;
    b.at(0, yM - 0.006 - jaw * 0.01, H.rz * 0.4, q => q.ellipsoid(H.rx * 0.5, H.ry * 0.18 + jaw * 0.012, H.rz * 0.48, 12, 8, [0.18, 0.05, 0.05, 0]));
    b.at(0, yM + 0.002, H.rz * 0.78, q => q.box(H.rx * 0.62, 0.008, 0.012, [0.88, 0.85, 0.78, 0]));
  }

  function buildEars(b, H, skin) {
    [-1, 1].forEach(s => {
      const p = Break.baseShape(H, s * 1.6, H.eyeY - 0.2);
      b.push(M4.translate(p[0] - s * 0.006, p[1], p[2] - 0.002), M4.rotY(s * 0.2), M4.rotX(-0.15), M4.scale(0.9, 0.92, 0.9));
      b.at(s * 0.006, 0, 0, q => q.ellipsoid(0.0075, 0.03, 0.019, 10, 8, skin));
      const rim = [];
      for (let i = 0; i <= 14; i++) {
        const a = -0.6 + (i / 14) * (PI + 1.4);
        rim.push([s * 0.012, S(a) * 0.026, C(a) * 0.016 - 0.002]);
      }
      K.tube(b, rim, rim.map((q, i) => 0.0032 * (1 - 0.4 * Math.abs(i / 14 - 0.45))), 5, shade(skin, 0.96));
      b.at(s * 0.01, -0.004, 0.002, q => q.ellipsoid(0.004, 0.012, 0.008, 6, 4, shade(skin, 0.72)));
      b.pop();
    });
  }

  function hairPit(yaw) {
    const a = Math.abs(yaw);
    if (a < 0.45) return 0.76;
    if (a < 1.15) return lerp(0.76, 0.36, (a - 0.45) / 0.7);
    if (a < 1.5) return lerp(0.36, 0.12, (a - 1.15) / 0.35);
    if (a < 1.85) return lerp(0.12, -0.5, (a - 1.5) / 0.35);
    return -0.5 - 0.1 * smooth(1.85, PI, a);
  }

  function buildHairCap(b, H, col) {
    const ny = 64, np = 30;
    const pt = (yaw, pit) => {
      const base = Break.baseShape(H, yaw, pit);
      const n = V3.norm(base);
      const edge = smooth(hairPit(yaw), hairPit(yaw) + 0.18, pit);
      const th = (0.006 + 0.012 * edge + 0.004 * smooth(0.5, PI, Math.abs(yaw))) * (1 + 0.25 * S(yaw * 14 + pit * 6));
      return V3.add(base, V3.mul(n, th));
    };
    const pitOf = (yaw, v) => lerp(hairPit(yaw) - 0.03, PI / 2, Math.pow(v, 0.85));
    for (let i = 0; i < ny; i++) {
      for (let j = 0; j < np; j++) {
        const y0 = -PI + (i / ny) * 2 * PI, y1 = -PI + ((i + 1) / ny) * 2 * PI;
        const v0 = j / np, v1 = (j + 1) / np;
        const p0 = pitOf((y0 + y1) / 2, v0), p1 = pitOf((y0 + y1) / 2, v1);
        const a = pt(y0, pitOf(y0, v0)), bb = pt(y1, pitOf(y1, v0)), c = pt(y1, pitOf(y1, v1)), d = pt(y0, pitOf(y0, v1));
        const uv = [[(y0 + PI) / (2 * PI) * 3, p0], [(y1 + PI) / (2 * PI) * 3, p0], [(y1 + PI) / (2 * PI) * 3, p1], [(y0 + PI) / (2 * PI) * 3, p1]];
        const n = V3.norm(V3.add(a, c));
        b.quad(a, bb, c, d, col, uv, [n, n, n, n]);
      }
    }
  }

  const HANGS = {
    back: { from: 1.5, to: 2 * PI - 1.5, pits: [0.0, -0.3], len: 0.2, spread: 0.045, origin: [0, -0.03, -0.03], locks: 40, rad: 0.026 },
    left: { from: 1.72, to: 2.15, pits: [0.1, -0.1], len: 0.19, spread: 0.014, origin: [0.06, -0.01, -0.02], locks: 8, rad: 0.02 },
    right: { from: -2.15, to: -1.72, pits: [0.1, -0.1], len: 0.19, spread: 0.014, origin: [-0.06, -0.01, -0.02], locks: 8, rad: 0.02 }
  };

  function buildHang(b, H, spec, col, mess, seed) {
    const g = window.P3D.rand(seed);
    for (let i = 0; i < spec.locks; i++) {
      const u = (i + 0.5) / spec.locks;
      const yaw = lerp(spec.from, spec.to, u) + (g() - 0.5) * 0.05;
      const pit = lerp(spec.pits[0], spec.pits[1], g());
      const root = V3.mul(Break.baseShape(H, yaw, pit), 1.02);
      const n = V3.norm([root[0], 0, root[2]]);
      const side = [n[2], 0, -n[0]];
      const len = spec.len * (0.8 + g() * 0.35) * (1 + mess * 0.1 * g());
      const curl = 0.007 + g() * 0.006 + mess * 0.004;
      const ph = g() * PI * 2;
      const pts = [];
      const rads = [];
      for (let k = 0; k <= 7; k++) {
        const v = k / 7;
        const out = spec.spread * Math.sin(v * PI * 0.8) * (1 + mess * 0.5) + 0.006 * v;
        const w = curl * S(v * 6.5 + ph) * smooth(0, 0.25, v);
        const p = V3.add(V3.add(V3.add(root, V3.mul(n, out)), V3.mul(side, w)), [0, -len * v, 0]);
        pts.push(V3.sub(p, spec.origin));
        rads.push(spec.rad * (1 - 0.55 * v) * (0.85 + g() * 0.3));
      }
      const tone = 0.75 + g() * 0.5;
      K.tube(b, pts, rads, 6, [col[0] * tone, col[1] * tone, col[2] * tone, 0]);
      b.at(pts[7][0], pts[7][1], pts[7][2], q => q.ellipsoid(rads[7], rads[7] * 1.4, rads[7], 5, 3, [col[0] * tone, col[1] * tone, col[2] * tone, 0]));
    }
  }

  function buildFrontLocks(b, H, col) {
    [-1, 1].forEach(s => {
      [[1.18, 0.42, 0.17], [1.28, 0.36, 0.18], [1.38, 0.3, 0.17], [1.48, 0.24, 0.16]].forEach(([yaw, pit, len], k) => {
        const root = V3.mul(Break.baseShape(H, s * yaw, pit), 1.05);
        const pts = [];
        for (let i = 0; i <= 6; i++) {
          const v = i / 6;
          const n = V3.norm([root[0], 0, root[2]]);
          pts.push([root[0] + n[0] * 0.018 * Math.sin(v * PI * 0.7) + s * 0.004 * S(v * 5 + k), root[1] - len * v, root[2] + n[2] * 0.012 * v + 0.005 * S(v * 4 + k)]);
        }
        K.tube(b, pts, pts.map((q, i) => 0.014 * (1 - i / 9)), 6, col);
      });
    });
  }

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

  function band(b, R, y0, y1, a0f, a1f, lift, col, nv, nu) {
    const pt = (u, v) => {
      const y = lerp(y0, y1, v);
      return onSurface(R, lerp(a0f(y), a1f(y), u), y, lift);
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const yy = lerp(y0, y1, (v0 + v1) / 2);
        const am = lerp(a0f(yy), a1f(yy), (u0 + u1) / 2);
        const n = V3.norm([S(am), 0.12, C(am)]);
        b.quad(pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1), col, null, [n, n, n, n]);
      }
    }
  }

  function buildTorso(b, B, O) {
    loft(b, B.rings.map(([y, rx, rz, cz]) => ring(y, rx, rz, cz, O.jacket)), 20, { capBottom: true });
  }

  function openAt(O, y) {
    if (O.closed) return 0.06;
    if (y >= 0.02) return lerp(O.coat ? 0.34 : 0.3, 0.52, clamp((y - 0.02) / 0.32, 0, 1));
    return (O.coat ? 0.34 : 0.3) + (0.02 - y) * 0.7;
  }

  function lapelW(O, y) {
    const pk = O.peak ? 0.62 : 0.5;
    const pts = [[0.0, 0.0], [0.12, 0.3], [0.235, pk], [0.25, pk * 0.9], [0.265, 0.22], [0.3, 0.28], [0.345, 0.22]];
    for (let i = 0; i < pts.length - 1; i++) {
      if (y <= pts[i + 1][0]) return lerp(pts[i][1], pts[i + 1][1], clamp((y - pts[i][0]) / (pts[i + 1][0] - pts[i][0]), 0, 1));
    }
    return pts[pts.length - 1][1];
  }

  function buildFront(b, B, O) {
    const R = B.rings;
    const yTop = 0.348;
    const nk = B.neck * B.k;
    if (!O.closed) {
      band(b, R, R[0][0] + 0.005, 0.31, y => -openAt(O, y), y => openAt(O, y), 0.01, O.vest || O.shirt, 8, 6);
      const vh = (y) => O.vest ? 0.55 * clamp((y - 0.16) / (yTop - 0.16), 0, 1) : openAt(O, y);
      band(b, R, O.vest ? 0.16 : R[0][0] + 0.005, yTop, y => -vh(y), y => vh(y), 0.016, O.shirt, 6, 4);
      [-1, 1].forEach(s => {
        band(b, R, 0.0, yTop, y => (s > 0 ? openAt(O, y) : -openAt(O, y) - lapelW(O, y)), y => (s > 0 ? openAt(O, y) + lapelW(O, y) : -openAt(O, y)), 0.028, O.lapel || O.jacket, 12, 2);
      });
      if (O.vest) {
        for (let i = 0; i < 5; i++) {
          const y = 0.13 - i * 0.075;
          const p = onSurface(R, 0, y, 0.02);
          b.at(p[0], p[1], p[2], q => q.ellipsoid(0.007, 0.007, 0.004, 6, 4, O.buttons || 0x6a4a10));
        }
        [-1, 1].forEach(s => {
          const a = s * 0.18;
          const p0 = onSurface(R, a - s * 0.12, R[0][0] + 0.02, 0.02), p1 = onSurface(R, a, R[0][0] - 0.035, 0.02), p2 = onSurface(R, 0, R[0][0] + 0.02, 0.02);
          b.tri(p0, p1, p2, O.vest, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        });
      }
      if (O.tie) {
        const yEnd = yTop - 0.4;
        const half = (y) => (0.016 + 0.02 * clamp((yTop - y) / (yTop - yEnd), 0, 1)) / surfaceAt(R, y).rx;
        band(b, R, yEnd, yTop - 0.012, y => -half(y), y => half(y), 0.022, O.tie, 8, 2);
        for (let i = 0; i < 6; i++) {
          const y = yTop - 0.06 - i * 0.055;
          band(b, R, y - 0.01, y + 0.008, yy => -half(yy) * 0.95, yy => half(yy) * 0.95, 0.024, O.tieStripe || O.tie, 1, 1);
        }
        const knot = onSurface(R, 0, yTop - 0.002, 0.026);
        b.at(knot[0], knot[1], knot[2], q => q.prism(6, 0.016, 0.008, -0.012, 0.011, 0.006, 0.012, O.tie, { capBottom: true }));
      }
      if (O.badge) {
        const p = onSurface(R, 0.42, 0.17, 0.034);
        b.push(M4.translate(p[0], p[1], p[2]), M4.rotY(0.42));
        b.ellipsoid(0.024, 0.03, 0.006, 10, 6, [0.85, 0.7, 0.3, 0.15]);
        b.at(0, 0, 0.004, q => q.ellipsoid(0.013, 0.013, 0.004, 5, 3, [0.95, 0.82, 0.42, 0.25]));
        b.pop();
      }
    } else {
      [-1, 1].forEach(s => band(b, R, R[0][0] + 0.02, yTop, y => s * 0.02, y => s * 0.06, 0.012, shade(O.jacket, 0.82), 4, 1));
    }
    const s = surfaceAt(R, yTop);
    const collar = O.shirt;
    if (!O.closed) {
      [-1, 1].forEach(side => {
        const base = [side * nk * 0.95, yTop + 0.03, s.cz + nk * 0.55];
        const big = O.vest ? 1.2 : 1.0;
        const tip = [side * nk * 0.75 * big, yTop - 0.045 * big, s.cz + nk * 1.3];
        const back = [side * nk * 1.15, yTop + 0.05, s.cz - nk * 0.2];
        const outerP = [side * nk * 1.75 * big, yTop - 0.005, s.cz + nk * 0.6];
        const nrm = V3.norm([side * 0.6, 0.4, 0.7]);
        b.quad(base, back, outerP, tip, collar, null, [nrm, nrm, nrm, nrm]);
      });
    }
    b.at(0, yTop + 0.02, s.cz, q => loft(q, [ring(-0.014, nk * 1.14, nk * 1.07, 0, collar), ring(0.03, nk * 1.06, nk * 1.01, 0, collar)], 14));
    const jc = O.jacket;
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const a = PI * 0.42 + (i / 14) * PI * 1.16;
      pts.push([S(a) * nk * 1.45, yTop + 0.01 + 0.012 * C(a), s.cz + C(a) * nk * 1.3]);
    }
    K.tube(b, pts, pts.map(() => 0.01), 6, jc);
    if (!O.closed && !O.vest) return;
    if (O.vest) {
      [-1, 1].forEach(sd => {
        const p = onSurface(R, sd * 0.85, 0.2, 0.012);
        b.at(p[0], p[1], p[2], q => q.box(0.07, 0.006, 0.01, shade(O.jacket, 0.8)));
      });
    }
  }

  function buildSkirt(b, B, O, flare) {
    const len = O.skirt;
    const top = 0.1, bot = 0.1 - len;
    const gap = O.closed ? 0.03 : O.coat ? 0.36 : 0.34;
    const rows = 6, cols = 22;
    const R0 = B.rings[0];
    const pt = (u, v) => {
      const a = gap + u * (2 * PI - 2 * gap);
      const y = lerp(top, bot, v);
      const k = B.k;
      const rx = (R0[1] + 0.012) * (1 + 0.1 * v) * (1 + flare * 0.55 * v * v) * (O.coat ? 1.0 + 0.18 * v : 1);
      const rz = (R0[2] + 0.02) * (1 + 0.16 * v) * (1 + flare * 0.55 * v * v) * (O.coat ? 1.0 + 0.2 * v : 1);
      return [S(a) * rx * k, y + flare * 0.06 * v * v, C(a) * rz * k - 0.005];
    };
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const u0 = i / cols, u1 = (i + 1) / cols, v0 = j / rows, v1 = (j + 1) / rows;
        const am = gap + ((u0 + u1) / 2) * (2 * PI - 2 * gap);
        const n = [S(am), 0, C(am)];
        b.quad(pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1), O.jacket, null, [n, n, n, n]);
        const ni = V3.mul(n, -1);
        b.quad(pt(u0, v1), pt(u1, v1), pt(u1, v0), pt(u0, v0), shade(O.jacket, 0.55), null, [ni, ni, ni, ni]);
      }
    }
    if (O.coat) {
      const y = 0.0;
      loft(b, [ring(y - 0.02, (R0[1] + 0.02) * B.k, (R0[2] + 0.03) * B.k, -0.005, shade(O.jacket, 0.85)), ring(y + 0.02, (R0[1] + 0.02) * B.k, (R0[2] + 0.03) * B.k, -0.005, shade(O.jacket, 0.85))], 18);
    }
  }

  function buildPelvis(b, B, O) {
    const k = B.k;
    loft(b, [ring(-0.17, 0.14 * k, 0.11 * k, -0.01, O.pants), ring(-0.09, 0.17 * k, 0.135 * k, -0.01, O.pants), ring(0.02, 0.172 * k, 0.135 * k, 0.0, O.pants), ring(0.09, 0.17 * k, 0.13 * k, 0.01, O.pants)], 14, { capBottom: true, capTop: true });
  }

  function buildUpper(b, B, O) {
    const D = B.D, k = B.k;
    const col = O.jacket;
    b.at(0, -0.02, 0, q => q.ellipsoid(0.064 * k, 0.066 * k, 0.066 * k, 9, 6, col));
    loft(b, [ring(-D.upper - 0.01, 0.052 * k, 0.054 * k, 0, col), ring(-0.18, 0.06 * k, 0.062 * k, 0, col), ring(-0.04, 0.068 * k, 0.07 * k, 0, col), ring(0.02, 0.064 * k, 0.066 * k, 0, col)], 10, { capBottom: true });
  }

  function buildFore(b, B, O) {
    const D = B.D, k = B.k;
    const col = O.jacket;
    b.ellipsoid(0.057 * k, 0.057 * k, 0.057 * k, 8, 5, col);
    loft(b, [ring(-D.fore + 0.012, 0.047 * k, 0.05 * k, 0, col), ring(-0.16, 0.052 * k, 0.055 * k, 0, col), ring(0.0, 0.056 * k, 0.058 * k, 0, col)], 10, { capBottom: false });
    b.at(0, -D.fore + 0.02, 0, q => q.prism(10, 0.041 * k, 0.044 * k, -0.026, 0.041 * k, 0.044 * k, 0.012, O.cuff || O.shirt, { capBottom: true }));
  }

  function buildThigh(b, B, O) {
    const D = B.D, k = B.k;
    loft(b, [ring(-D.thigh - 0.02, 0.062 * k, 0.064 * k, 0, O.pants), ring(-0.3, 0.072 * k, 0.076 * k, 0, O.pants), ring(-0.12, 0.084 * k, 0.088 * k, 0.005, O.pants), ring(0.05, 0.09 * k, 0.09 * k, 0, O.pants)], 10, { capBottom: true, capTop: true });
  }

  function buildShin(b, B, O) {
    const D = B.D, k = B.k;
    const flare = O.vest ? 1.25 : 1.0;
    b.ellipsoid(0.058 * k, 0.056 * k, 0.062 * k, 8, 5, O.pants);
    loft(b, [ring(-D.shin + 0.035, 0.06 * k * flare, 0.064 * k * flare, 0, O.pants), ring(-0.3, 0.052 * k, 0.056 * k, 0, O.pants), ring(0, 0.058 * k, 0.062 * k, 0, O.pants)], 10, { capBottom: false });
    b.at(0, -D.shin + 0.035, 0, q => q.prism(10, 0.06 * k * flare, 0.064 * k * flare, -0.004, 0.02, 0.02, 0.002, shade(O.pants, 0.5)));
  }

  function buildFoot(b, O) {
    if (O.sock) b.at(0, 0.0, 0, q => q.prism(10, 0.04, 0.042, -0.035, 0.04, 0.042, 0.035, O.sock, { capBottom: false }));
    b.at(0, -0.045, 0.0, q => q.ellipsoid(0.045, 0.038, 0.05, 8, 5, O.shoe));
    b.at(0, -0.062, 0.06, q => q.box(0.088, 0.048, 0.22, O.shoe));
    b.at(0, -0.06, 0.16, q => q.ellipsoid(0.044, 0.026, 0.05, 8, 4, shade(O.shoe, 1.25)));
    b.at(0, -0.088, 0.058, q => q.box(0.09, 0.012, 0.226, 0x16100c));
  }

  function buildCigarette(b) {
    K.tube(b, [[0, 0, 0], [0, 0, 0.062]], [0.0042, 0.0042], 8, [0.95, 0.94, 0.9, 0]);
    K.tube(b, [[0, 0, -0.02], [0, 0, 0.0]], [0.0044, 0.0044], 8, [0.86, 0.62, 0.3, 0]);
    K.tube(b, [[0, 0, 0.062], [0, 0, 0.068]], [0.0041, 0.0036], 8, [1, 0.45, 0.12, 0.9]);
    K.tube(b, [[0, 0, 0.068], [0, 0, 0.071]], [0.0036, 0.002], 6, [0.4, 0.38, 0.36, 0]);
  }

  function axisAngle(axis, ang) {
    const [x, y, z] = axis;
    const c = C(ang), s = S(ang), t = 1 - c;
    return new Float32Array([t * x * x + c, t * x * y + s * z, t * x * z - s * y, 0, t * x * y - s * z, t * y * y + c, t * y * z + s * x, 0, t * x * z + s * y, t * y * z - s * x, t * z * z + c, 0, 0, 0, 0, 1]);
  }

  function hangMatrix(head, origin, swing, gravity) {
    const rest = M4.chain(head, M4.translate(origin[0], origin[1], origin[2]));
    const o = [rest[12], rest[13], rest[14]];
    const d0 = V3.norm(M4.dir(rest, [0, -1, 0]));
    const want = V3.norm(V3.add(V3.add(V3.mul(d0, 1 - gravity), [0, -gravity, 0]), swing || [0, 0, 0]));
    const ax = V3.cross(d0, want);
    const sn = V3.len(ax);
    const cs = clamp(V3.dot(d0, want), -1, 1);
    const rot = sn < 1e-5 ? M4.ident() : axisAngle(V3.mul(ax, 1 / sn), Math.atan2(sn, cs));
    const lin = new Float32Array(rest);
    lin[12] = 0; lin[13] = 0; lin[14] = 0;
    return M4.chain(M4.translate(o[0], o[1], o[2]), rot, lin);
  }

  function build(r) {
    const cache = {};
    const tex = {};
    const heads = {};
    const faceTex = (who, variant) => {
      const key = who + ':' + (variant || '');
      if (!tex[key]) {
        const H = HEADS[who];
        const paint = who === 'joker' ? Art.jokerFace(H, { closed: variant === 'closed' }) : Art.detectiveFace(who, H, SKIN[who]);
        tex[key] = r.texture(H.size, paint, { height: H.size / 2 });
      }
      return tex[key];
    };
    const hairTex = r.texture(256, Art.hairStrands, {});
    const headFor = (who) => {
      if (heads[who]) return heads[who];
      const H = HEADS[who];
      const out = { meshes: {}, mouths: {}, ears: mesh(r, b => buildEars(b, H, SKIN[who])) };
      out.get = (lvl, smile) => {
        const key = lvl + ':' + smile;
        if (!out.meshes[key]) {
          out.meshes[key] = mesh(r, b => buildHead(b, H, lvl / 3, smile));
          out.mouths[key] = mesh(r, b => buildMouth(b, H, lvl / 3));
        }
        return { head: out.meshes[key], mouth: out.mouths[key] };
      };
      if (who === 'joker') {
        const hc = [0.3, 0.28, 0.22, 0];
        out.cap = mesh(r, b => buildHairCap(b, H, hc));
        out.hang = {};
        out.hangFor = (part, mess) => {
          const key = part + (mess > 0.5 ? 'm' : 's');
          if (!out.hang[key]) out.hang[key] = mesh(r, b => buildHang(b, H, HANGS[part], [0.1, 0.09, 0.065, 0], mess > 0.5 ? 1 : 0, part.length * 31 + (mess > 0.5 ? 7 : 0)));
          return out.hang[key];
        };
        out.locks = mesh(r, b => buildFrontLocks(b, H, [0.1, 0.09, 0.065, 0]));
        out.cig = mesh(r, b => buildCigarette(b));
      }
      heads[who] = out;
      return out;
    };
    const lookFor = (id) => {
      if (cache[id]) return cache[id];
      const L = LOOKS[id];
      const B = BODIES[L.body];
      const O = Object.assign({ skin: SKIN[L.head] }, L.O);
      const hands = {};
      const skirts = {};
      const out = {
        L, B, O, H: HEADS[L.head],
        hs: headFor(L.head),
        torso: mesh(r, b => buildTorso(b, B, O)),
        front: mesh(r, b => buildFront(b, B, O)),
        pelvis: mesh(r, b => buildPelvis(b, B, O)),
        upper: mesh(r, b => buildUpper(b, B, O)),
        fore: mesh(r, b => buildFore(b, B, O)),
        thigh: mesh(r, b => buildThigh(b, B, O)),
        shin: mesh(r, b => buildShin(b, B, O)),
        foot: mesh(r, b => buildFoot(b, O)),
        neck: mesh(r, b => loft(b, [ring(-0.07, B.neck * B.k * 1.05, B.neck * B.k, 0, O.skin), ring(0.06, B.neck * B.k * 0.98, B.neck * B.k * 0.95, 0.008, O.skin), ring(0.13, B.neck * B.k * 0.9, B.neck * B.k * 0.85, 0.012, O.skin)], 12)),
        skirt: (flare) => {
          const lvl = clamp(Math.round(flare * 3), 0, 3);
          if (!skirts[lvl]) skirts[lvl] = mesh(r, b => buildSkirt(b, B, O, lvl / 3));
          return skirts[lvl];
        },
        hand: (side, grip) => {
          const key = side + grip;
          if (!hands[key]) hands[key] = mesh(r, b => Break.buildHand(b, O.skin, side, grip, B.k, false));
          return hands[key];
        }
      };
      cache[id] = out;
      return out;
    };
    return { lookFor, faceTex, headFor, hairTex };
  }

  function solve(id, pose) {
    const L = LOOKS[id];
    const B = BODIES[L.body];
    if (pose.up && pose.fwd && pose.p) return Rig.solve(pose, B.D);
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
    const extra = o.tint ? { tint: o.tint } : {};
    const W = (x) => Object.assign({}, x || {}, extra);
    const hide = pose.hide || {};
    if (!hide.body) {
      if (!hide.legs) r.draw(V.pelvis, m.pelvis, W());
      r.draw(V.torso, m.chest, W());
      r.draw(V.front, m.chest, W());
      const flare = clamp(pose.flare || 0, 0, 1);
      const sk = pose.skirtSwing ? M4.chain(m.pelvis, M4.rotX(pose.skirtSwing[0]), M4.rotZ(pose.skirtSwing[1])) : m.pelvis;
      r.draw(V.skirt(flare), sk, W());
    }
    r.draw(V.neck, m.neck, W());
    if (!hide.head) {
      const lvl = clamp(Math.round((pose.jaw || 0) * 3), 0, 3);
      const hm = V.hs.get(lvl, pose.smile || 0);
      r.draw(hm.head, m.head, W({ texture: CST.faceTex(V.L.head, pose.eyes === 'closed' ? 'closed' : '') }));
      r.draw(hm.mouth, m.head, W());
      r.draw(V.hs.ears, m.head, W());
      if (V.hs.cap) {
        r.draw(V.hs.cap, m.head, W({ texture: CST.hairTex }));
        const mess = pose.mess || 0;
        const sw = pose.hairSwing || [0, 0, 0];
        const fly = Math.min(0.7, Math.abs(pose.spin || 0) * 0.07);
        const side = V3.norm([m.head[0], m.head[1], m.head[2]]);
        const back = V3.norm([-m.head[8], -m.head[9], -m.head[10]]);
        const OUT = { back, left: side, right: V3.mul(side, -1) };
        ['back', 'left', 'right'].forEach(part => {
          const spec = HANGS[part];
          const hm2 = hangMatrix(m.head, spec.origin, V3.add(sw, V3.mul(OUT[part], fly)), pose.hairGravity === undefined ? 0.45 : pose.hairGravity);
          r.draw(V.hs.hangFor(part, mess), hm2, W());
        });
        if (mess > 0.5) r.draw(V.hs.locks, m.head, W());
      }
      if (pose.cig && V.hs.cig) {
        const H = V.H;
        const c = pose.cig;
        r.draw(V.hs.cig, M4.chain(m.head, M4.translate(c[0] * H.rx, S(H.mouth) * H.ry - 0.002, H.rz * 0.9), M4.rotY(c[1]), M4.rotX(c[2])), W());
      }
    }
    if (!hide.arms) {
      ['L', 'R'].forEach(s => {
        if (hide['arm' + s]) return;
        r.draw(V.upper, m['upper' + s], W());
        r.draw(V.fore, m['fore' + s], W());
        r.draw(V.hand(s, pose['g' + s] || 'relax'), m['hand' + s], W());
      });
    }
    if (!hide.legs && !hide.body) {
      ['L', 'R'].forEach(s => {
        r.draw(V.thigh, m['thigh' + s], W());
        r.draw(V.shin, m['shin' + s], W());
        r.draw(V.foot, m['foot' + s], W());
      });
    }
  }

  function cigTip(m, pose, H) {
    const c = pose.cig;
    const M = M4.chain(m.head, M4.translate(c[0] * H.rx, S(H.mouth) * H.ry - 0.002, H.rz * 0.9), M4.rotY(c[1]), M4.rotX(c[2]));
    return M4.point(M, [0, 0, 0.072]);
  }

  window.StairsCast = { HEADS, LOOKS, BODIES, SKIN, HANGS, build, solve, draw, hangMatrix, cigTip, hairPit };
})();
