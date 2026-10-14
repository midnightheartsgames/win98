(function (C) {
  'use strict';
  const { Mat, clamp } = C;
  const STRIDE = 26;
  const MAT_CODE = { wood: 1, gunmetal: 2, metal: 2, chrome: 2, brass: 2, bakelite: 3, plastic: 4, rubber: 4 };
  const SKIN = 0xb88a68, GLOVE = 0x2a2824, TAU = Math.PI * 2;

  const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const madd = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const shade = (col, k) => ((Math.min(255, (col >> 16 & 255) * k) << 16) | (Math.min(255, (col >> 8 & 255) * k) << 8) | Math.min(255, (col & 255) * k)) >>> 0;
  const frame = (X, Y, Z, at) => [X[0], X[1], X[2], Y[0], Y[1], Y[2], Z[0], Z[1], Z[2], at[0], at[1], at[2]];
  const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

  class MeshBuilder {
    constructor() { this.out = []; this.mat = 0; }

    tri(p, n, col, glow) {
      const f = norm([n[0][0] + n[1][0] + n[2][0], n[0][1] + n[1][1] + n[2][1], n[0][2] + n[1][2] + n[2][2]]);
      const o = this.out;
      for (let i = 0; i < 3; i++) o.push(p[i][0], p[i][1], p[i][2], n[i][0], n[i][1], n[i][2]);
      o.push(f[0], f[1], f[2], col >> 16 & 255, col >> 8 & 255, col & 255, glow || 0, this.mat);
    }

    quad(p, n, col, glow) {
      this.tri([p[0], p[1], p[2]], [n[0], n[1], n[2]], col, glow);
      this.tri([p[0], p[2], p[3]], [n[0], n[2], n[3]], col, glow);
    }

    grid(m, surf, nu, nv, col, glow) {
      const at = (i, j) => { const [p, n] = surf(i / nu, j / nv); return [Mat.apply(m, p[0], p[1], p[2]), norm(Mat.rotate(m, n[0], n[1], n[2]))]; };
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
        const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
        this.quad([a[0], b[0], c[0], d[0]], [a[1], b[1], c[1], d[1]], col, glow);
      }
    }

    fan(m, ring, center, normal, col, glow) {
      const c = Mat.apply(m, center[0], center[1], center[2]), n = norm(Mat.rotate(m, normal[0], normal[1], normal[2]));
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i], b = ring[(i + 1) % ring.length];
        this.tri([c, Mat.apply(m, a[0], a[1], a[2]), Mat.apply(m, b[0], b[1], b[2])], [n, n, n], col, glow);
      }
    }

    box(m, s, col, glow) {
      const uv = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (let a = 0; a < 3; a++) for (const sg of [-1, 1]) {
        const b = (a + 1) % 3, c = (a + 2) % 3, e = [0, 0, 0];
        e[a] = sg;
        const n = norm(Mat.rotate(m, e[0], e[1], e[2]));
        const pts = uv.map(([u, v]) => { const q = [0, 0, 0]; q[a] = sg * s[a]; q[b] = u * s[b]; q[c] = v * s[c]; return Mat.apply(m, q[0], q[1], q[2]); });
        this.quad(pts, [n, n, n, n], col, glow);
      }
    }

    cyl(m, s, col, glow, seg = 10) {
      this.grid(m, (u, v) => { const t = u * TAU, c = Math.cos(t), si = Math.sin(t); return [[s[0] * c, s[1] * si, s[2] * (2 * v - 1)], [c / s[0], si / s[1], 0]]; }, seg, 1, col, glow);
      for (const sg of [-1, 1]) {
        const ring = [];
        for (let i = 0; i < seg; i++) { const t = i / seg * TAU; ring.push([s[0] * Math.cos(t), s[1] * Math.sin(t), sg * s[2]]); }
        this.fan(m, ring, [0, 0, sg * s[2]], [0, 0, sg], col, glow);
      }
    }

    ell(m, s, col, glow, seg = 10, rings = 6) {
      this.grid(m, (u, v) => {
        const t = u * TAU, ph = -Math.PI / 2 + v * Math.PI;
        const n0 = [Math.cos(ph) * Math.cos(t), Math.cos(ph) * Math.sin(t), Math.sin(ph)];
        return [[s[0] * n0[0], s[1] * n0[1], s[2] * n0[2]], [n0[0] / s[0], n0[1] / s[1], n0[2] / s[2]]];
      }, seg, rings, col, glow);
    }

    ball(at, r, col, seg = 6) { this.ell([1, 0, 0, 0, 1, 0, 0, 0, 1, at[0], at[1], at[2]], [r, r, r], col, 0, seg, 4); }

    tube(a, b, ra, rb, col, seg = 8, caps = true) {
      const w = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(w[0], w[1], w[2]);
      if (len < 1e-6) return;
      const z = [w[0] / len, w[1] / len, w[2] / len];
      const x = norm(Math.abs(z[2]) < 0.9 ? cross(z, [0, 0, 1]) : cross(z, [1, 0, 0])), y = cross(z, x);
      const m = frame(x, y, z, a);
      this.grid(m, (u, v) => { const t = u * TAU, c = Math.cos(t), si = Math.sin(t), r = ra + (rb - ra) * v; return [[c * r, si * r, v * len], [c, si, 0]]; }, seg, 1, col, 0);
      if (!caps) return;
      for (const [zz, r, sg] of [[0, ra, -1], [len, rb, 1]]) {
        const ring = [];
        for (let i = 0; i < seg; i++) { const t = i / seg * TAU; ring.push([Math.cos(t) * r, Math.sin(t) * r, zz]); }
        this.fan(m, ring, [0, 0, zz], [0, 0, sg], col, 0);
      }
    }

    part(m, shape, size, col, glow) {
      if (shape === 'box') this.box(m, size, col, glow);
      else if (shape === 'cyl') this.cyl(m, size, col, glow);
      else this.ell(m, size, col, glow);
    }

    mesh() { return { data: new Float32Array(this.out), count: this.out.length / STRIDE }; }
  }

  const FOREARM = 0.26, UPPER_ARM = 0.29;

  function gripHand(side, center, axis, fwd, halfW, xOff, curl) {
    const Y = norm(axis);
    const X = norm(madd(fwd, Y, -dot(fwd, Y)));
    const Z = side === 'R' ? cross(X, Y) : cross(Y, X);
    const at = madd(madd(center, X, -xOff), Z, halfW + 0.015);
    return { side, X, Y, Z, at, curl };
  }

  const SHOULDERS = { R: [0.19, -0.24, -0.03], L: [-0.17, -0.25, 0.02] };
  const POLES = { R: [0.6, -1, -0.2], L: [-0.6, -1, -0.2] };
  const IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];

  function elbowIK(wrist, shoulder, pole) {
    const toS = [shoulder[0] - wrist[0], shoulder[1] - wrist[1], shoulder[2] - wrist[2]];
    const dist = Math.hypot(toS[0], toS[1], toS[2]), u = norm(toS);
    const d = clamp(dist, 0.05, FOREARM + UPPER_ARM - 0.01);
    const cosA = clamp((FOREARM * FOREARM + d * d - UPPER_ARM * UPPER_ARM) / (2 * FOREARM * d), -1, 1);
    const pl = norm(madd(pole, u, -dot(pole, u)));
    return madd(madd(wrist, u, FOREARM * cosA), pl, FOREARM * Math.sqrt(1 - cosA * cosA));
  }

  function buildArms(wrists, sleeve) {
    const mb = new MeshBuilder();
    for (const w of wrists) {
      const shoulder = SHOULDERS[w.side], elbow = elbowIK(w.at, shoulder, POLES[w.side]);
      const dir = norm([elbow[0] - w.at[0], elbow[1] - w.at[1], elbow[2] - w.at[2]]);
      const cuffEnd = madd(w.at, dir, 0.03);
      mb.tube(madd(w.at, dir, -0.006), cuffEnd, 0.032, 0.033, shade(sleeve, 0.75), 10, false);
      mb.tube(cuffEnd, elbow, 0.031, 0.04, sleeve, 10, false);
      mb.ball(elbow, 0.041, sleeve, 8);
      mb.tube(elbow, shoulder, 0.043, 0.05, sleeve, 10, false);
    }
    return mb.mesh();
  }

  function buildHand(mb, h) {
    const H = frame(h.X, h.Y, h.Z, h.at);
    const L = (x, y, z) => Mat.apply(H, x, y, z);
    const curlDir = a => [Math.cos(a), 0, -Math.sin(a)];
    mb.box(H, [0.042, 0.04, 0.015], GLOVE);
    mb.ell([h.X[0], h.X[1], h.X[2], h.Y[0], h.Y[1], h.Y[2], h.Z[0], h.Z[1], h.Z[2], ...L(0.036, 0, 0.004)], [0.014, 0.041, 0.013], GLOVE, 0, 8, 4);
    const fingers = [[0.03, 1], [0.01, 1.07], [-0.01, 1], [-0.029, 0.82]];
    const segs = [[0.028, 0.0098, GLOVE, 0.75], [0.022, 0.009, SKIN, 1.05], [0.017, 0.0082, SKIN, 0.85]];
    fingers.forEach(([yo, k], fi) => {
      let p = [0.042, yo, -0.002], ang = 0;
      const curl = fi === 0 && h.index != null ? h.index : h.curl;
      mb.ball(L(p[0], p[1], p[2]), segs[0][1], GLOVE);
      for (const [len, r, col, bend] of segs) {
        ang += curl * bend;
        const q = madd(p, curlDir(ang), len * k);
        mb.tube(L(p[0], p[1], p[2]), L(q[0], q[1], q[2]), r, r * 0.95, col, 6, false);
        mb.ball(L(q[0], q[1], q[2]), r * 0.95, col);
        p = q;
      }
    });
    const tc = h.thumb == null ? 1 : h.thumb;
    let tp = h.thumbRoot || [0.0, 0.036, -0.012];
    const tdirs = h.thumbDirs || [[0.62, 0.55, -0.35 * tc], [0.75, 0.2 - 0.3 * tc, -0.7 * tc]];
    [[0.03, 0.012, GLOVE], [0.026, 0.0105, SKIN]].forEach(([len, r, col], i) => {
      const q = madd(tp, norm(tdirs[i]), len);
      const a = L(tp[0], tp[1], tp[2]), b = L(q[0], q[1], q[2]);
      mb.tube(a, b, r, r * 0.92, col, 6, false);
      mb.ball(a, r, col); mb.ball(b, r * 0.92, col);
      tp = q;
    });
    const wrist = L(-0.07, 0, 0);
    mb.tube(L(-0.035, 0, 0), wrist, 0.028, 0.029, GLOVE, 8, false);
    return wrist;
  }

  const RIFLE_GRIP = { c: [-0.07, 0, -0.03], a: [0.25, 0, 0.97] };
  const STOCK_GRIP = { c: [-0.15, 0, -0.012], a: [0.45, 0, 0.9] };
  const PISTOL_GRIP = { c: [-0.04, 0, -0.025], a: [0.25, 0, 0.97] };
  const LONG_GUNS = {
    aksu: { grip: RIFLE_GRIP, fore: [0.11, 0.025, 0.024] },
    ak: { grip: RIFLE_GRIP, fore: [0.16, 0.028, 0.026] },
    trs: { grip: RIFLE_GRIP, fore: [0.18, 0.028, 0.028] },
    toz: { grip: STOCK_GRIP, fore: [0.14, 0.018, 0.02] },
    chaser: { grip: STOCK_GRIP, fore: [0.16, 0.018, 0.024] },
    vintorez: { grip: STOCK_GRIP, fore: [0.14, 0.022, 0.026] },
    svd: { grip: STOCK_GRIP, fore: [0.2, 0.026, 0.028] }
  };
  const PISTOLS = ['pm', 'fort', 'pb'];

  const roleOf = extra => (extra && typeof extra === 'object' ? extra.role : null) || null;

  function gripOf(spec, up) {
    const p = spec.find(q => roleOf(q[5]) === 'grip');
    if (!p) return null;
    const [, s, pos, , rot] = p, r = rot || [0, 0, 0];
    const a = Mat.rotate(Mat.fromEuler(r[0], r[1], r[2]), 0, 0, 1);
    return { c: madd(pos, a, s[2] * up), a, hw: s[1], xo: s[0] + 0.007 };
  }

  function foreOf(spec) {
    const p = spec.find(q => roleOf(q[5]) === 'fore');
    if (!p) return null;
    const [shape, s, pos] = p, len = shape === 'cyl' ? s[2] : s[0], half = shape === 'cyl' ? s[0] : s[1];
    return [pos[0] - len * 0.25, pos[2], half + 0.003];
  }

  const kindOf = id => id.startsWith('detector') ? 'detector' : PISTOLS.includes(id) ? 'pistol' : id === 'knife' ? 'knife' : id === 'bolt' || id === 'grenade' ? 'throw' : 'rifle';

  function heldFrame(h, offX, offZ) {
    const at = madd(madd(h.at, h.X, offX), h.Z, -offZ);
    const iy = h.Z, ix = h.Y, iz = cross(ix, iy);
    return frame(ix, iy, iz, at);
  }

  function buildWeapon(id, sleeve, oneHand) {
    const spec = C.GUN_MODELS[id] || C.GUN_MODELS.ak;
    const kind = kindOf(id);
    const gun = new MeshBuilder(), mag = new MeshBuilder(), rhand = new MeshBuilder(), lhand = new MeshBuilder();
    let base = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], right, left = null, eye, aimEye, pivot;
    if (kind === 'rifle') {
      const g = LONG_GUNS[id] || LONG_GUNS.ak;
      const G = gripOf(spec, 0.3) || { c: g.grip.c, a: g.grip.a, hw: 0.014, xo: 0.026 }, fore = foreOf(spec) || g.fore;
      right = gripHand('R', G.c, G.a, [1, 0, 0], G.hw, G.xo, 1.15);
      right.index = 0.4;
      left = gripHand('L', [fore[0], 0, fore[1]], [1, 0, 0], [0, -1, 0.35], fore[2], 0.022, 1.05);
      left.thumb = 0.6;
      eye = [-0.44, 0.21, 0.135]; aimEye = [-0.46, 0, 0.014]; pivot = G.c;
    } else if (kind === 'pistol') {
      const G = gripOf(spec, 0.2) || { c: PISTOL_GRIP.c, a: PISTOL_GRIP.a, hw: 0.013, xo: 0.024 };
      right = gripHand('R', G.c, G.a, [1, 0, 0], G.hw, G.xo, 1.2);
      right.index = 0.45;
      if (!oneHand) left = gripHand('L', madd(G.c, [0, 0, 1], -0.012), G.a, [1, 0, -0.2], 0.03, 0.01, 1.1);
      eye = oneHand ? [-0.38, 0.18, 0.13] : [-0.42, 0.12, 0.13]; aimEye = [-0.44, 0, 0.012]; pivot = G.c;
    } else if (kind === 'knife') {
      right = gripHand('R', [0, 0, 0], [0.55, 0.1, 0.83], [0.83, 0, -0.55], 0.014, 0.026, 1.25);
      base = heldFrame(right, 0.026, 0.029);
      base = Mat.mul(base, Mat.fromEuler(0, 0, 0, 0.02, 0, 0));
      eye = [-0.34, 0.2, 0.14]; aimEye = eye; pivot = [0, 0, 0];
    } else {
      right = gripHand('R', [0, 0, 0], [0.2, 0.3, 0.93], [1, 0, -0.2], 0.012, 0.024, 1.3);
      base = heldFrame(right, 0.026, 0.026);
      eye = [-0.32, 0.19, 0.13]; aimEye = eye; pivot = [0, 0, 0];
    }
    let tipX = -1, tipZ = 0.04, magC = null;
    const roles = spec.some(q => roleOf(q[5]));
    spec.forEach(([shape, size0, pos0, color, rot, extra]) => {
      const r = rot || [0, 0, 0], role = roleOf(extra);
      const [size, pos] = kind === 'rifle' && (roles ? role === 'stock' : true) ? trimStock(shape, size0, pos0) : [size0, pos0];
      if (!size) return;
      const m = Mat.mul(base, Mat.fromEuler(r[0], r[1], r[2], pos[0], pos[1], pos[2]));
      const isMag = kind === 'rifle' && (roles ? role === 'mag' : shape === 'box' && pos[0] > 0 && pos[2] <= -0.04);
      if (isMag && !magC) magC = [pos[0], 0, pos[2]];
      const mb = isMag ? mag : gun;
      mb.mat = MAT_CODE[typeof extra === 'string' ? extra : extra && extra.mat] || 0;
      mb.part(m, shape, size, color, extra && extra.glow);
      mb.mat = 0;
      const front = pos[0] + (Math.abs(r[1]) > 1 ? size[2] : size[0]);
      if (front > tipX) { tipX = front; tipZ = pos[2]; }
    });
    const rightWrist = buildHand(rhand, right);
    const leftWrist = left ? buildHand(lhand, left) : null;
    if (kind === 'rifle' && !magC) magC = [0.06, 0, -0.06];
    const gunMesh = gun.mesh();
    if (aimEye !== eye) aimEye = [aimEye[0], 0, sightTop(gunMesh) + aimEye[2]];
    return {
      id, kind, eye, aimEye, pivot, el: 0.1, sleeve, rightWrist, leftWrist,
      tip: Mat.apply(base, tipX, 0, tipZ),
      leftAt: left ? left.at : null, magAt: magC,
      pieces: { gun: gunMesh, mag: mag.mesh(), rhand: rhand.mesh(), lhand: lhand.mesh() }
    };
  }

  const STOCK_CUT = -0.24;

  function trimStock(shape, size, pos) {
    if (shape !== 'box') return pos[0] < STOCK_CUT ? [null, null] : [size, pos];
    if (pos[0] > -0.15) return [size, pos];
    const front = pos[0] + size[0], rear = Math.max(pos[0] - size[0], STOCK_CUT);
    if (front <= rear + 0.01) return [null, null];
    return [[(front - rear) / 2, size[1], size[2]], [(front + rear) / 2, pos[1], pos[2]]];
  }

  function sightTop(mesh) {
    let top = 0;
    for (let t = 0; t < mesh.count; t++) for (let v = 0; v < 3; v++) {
      const b = t * STRIDE + v * 6;
      if (mesh.data[b] > -0.12 && Math.abs(mesh.data[b + 1]) < 0.03) top = Math.max(top, mesh.data[b + 2]);
    }
    return top;
  }

  const DETECTOR_PLACE = { at: [0.38, 0.16, -0.15], yaw: 0.38, tilt: 0.35 };

  function buildDetector(model, sleeve) {
    const spec = C.GUN_MODELS[model] || C.GUN_MODELS.detector_otklik;
    const P = Mat.mul(Mat.fromEuler(0, 0, DETECTOR_PLACE.yaw, ...DETECTOR_PLACE.at), Mat.fromEuler(0, DETECTOR_PLACE.tilt, 0));
    const mb = new MeshBuilder();
    spec.forEach(([shape, size, pos, color, rot, extra], i) => {
      const r = rot || [0, 0, 0];
      const m = Mat.mul(P, Mat.fromEuler(r[0], r[1], r[2], -pos[0], pos[1], pos[2]));
      mb.part(m, shape, size, color, extra && extra.glow);
    });
    const body = spec[0][1];
    const toP = v => Mat.rotate(P, v[0], v[1], v[2]);
    const h = gripHand('L', Mat.apply(P, 0, 0, -body[2] * 0.45), toP([0, 0, 1]), toP([0, -1, 0]), body[0], 0.006, 1.3);
    h.thumbRoot = [-0.03, 0.036, -0.012];
    h.thumbDirs = [[-1, 0.15, -0.35], [0.25, 0, -1]];
    const wrist = buildHand(mb, h);
    const fx = -body[0] - 0.002;
    const face = [[fx, -body[1], -body[2]], [fx, body[1], -body[2]], [fx, body[1], body[2]], [fx, -body[1], body[2]]].map(q => Mat.apply(P, q[0], q[1], q[2]));
    return { id: model, kind: 'detector', mesh: mb.mesh(), face, wrist, sleeve };
  }

  function viewMatrix(eye, el) {
    const s = Math.sin(el), c = Math.cos(el);
    const R = [0, s, c, -1, 0, 0, 0, c, -s, 0, 0, 0];
    const t = Mat.apply(R, -eye[0], -eye[1], -eye[2]);
    R[9] = t[0]; R[10] = t[1]; R[11] = t[2];
    return R;
  }

  const about = (pivot, off, rx, ry, rz) => Mat.mul(Mat.fromEuler(0, 0, 0, pivot[0] + off[0], pivot[1] + off[1], pivot[2] + off[2]), Mat.mul(Mat.fromEuler(rx, ry, rz), Mat.fromEuler(0, 0, 0, -pivot[0], -pivot[1], -pivot[2])));
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  function weaponPose(vm, st) {
    const aim = st.aimK || 0;
    const eye = lerp3(vm.eye, vm.aimEye, aim);
    const V = viewMatrix(eye, vm.el * (1 - aim));
    const off = [0, st.bobX || 0, st.bobY || 0];
    let rx = 0, ry = 0, rz = 0;
    const rec = Math.min(0.25, st.recoil || 0) * (1 - aim * 0.6);
    off[0] -= rec * 0.35; ry -= rec * 1.3;
    const lag = applyLag(st, off, 1 - aim * 0.75);
    rz += lag[0]; ry += lag[1];
    const kick = st.kick || 0;
    off[0] -= 0.035 * kick; off[2] += 0.004 * kick; ry -= 0.06 * kick * (1 - aim * 0.5);
    const run = st.sprint || 0;
    off[0] -= 0.05 * run; off[1] -= 0.02 * run; off[2] -= 0.05 * run;
    rz += 0.6 * run; rx += 0.35 * run; ry += 0.28 * run;
    const sw = st.switchK || 0;
    off[2] -= sw * 0.28; ry += sw * 0.9;
    let lOff = [0, 0, 0], magOff = [0, 0, 0];
    if (st.reload != null) {
      const u = st.reload, s = Math.sin(u * Math.PI);
      rx += (vm.kind === 'pistol' ? 0.5 : 0.45) * s; ry += 0.18 * s; off[2] -= 0.04 * s;
      if (vm.kind === 'rifle' && vm.leftAt) {
        if (st.shell) {
          const k = Math.abs(Math.sin(st.shellPhase * Math.PI));
          lOff = [(0.02 - vm.leftAt[0]) * smooth(s * 3), 0, -0.07 * k * smooth(s * 3)];
        } else {
          const reach = smooth(s * 2), drop = smooth(s * 2 - 1);
          lOff = [(vm.magAt[0] - vm.leftAt[0]) * reach, -0.01 * reach, (vm.magAt[2] - 0.035 - vm.leftAt[2]) * reach - 0.2 * drop];
          magOff = [0, 0, -0.2 * drop];
        }
      } else lOff = [-0.02 * s, 0.02 * s, -0.14 * s];
    }
    if (st.knife != null) {
      const u = st.knife, s = Math.sin(u * Math.PI);
      off[0] += 0.1 * s; off[1] += (0.1 - 0.35 * u) * s; off[2] += 0.08 * s * (1 - u);
      rz += (0.9 - 1.8 * u) * s; rx -= 0.7 * s; ry -= 0.25 * s;
    }
    if (st.throw != null) {
      const u = st.throw, back = Math.sin(Math.min(1, u * 1.6) * Math.PI);
      off[0] += -0.12 * back + 0.25 * u; off[2] += 0.16 * back; ry -= 1.1 * back;
    }
    const A = Mat.mul(V, about(vm.pivot, off, rx, ry, rz));
    const lhand = Mat.mul(A, Mat.fromEuler(0, 0, 0, ...lOff));
    const wrists = [{ side: 'R', at: Mat.apply(A, ...vm.rightWrist) }];
    if (vm.leftWrist) wrists.push({ side: 'L', at: Mat.apply(lhand, ...vm.leftWrist) });
    return {
      gun: A,
      mag: Mat.mul(A, Mat.fromEuler(0, 0, 0, ...magOff)),
      lhand,
      arms: buildArms(wrists, vm.sleeve),
      tip: Mat.apply(A, vm.tip[0], vm.tip[1], vm.tip[2])
    };
  }

  function applyLag(st, off, k) {
    const sx = clamp(st.swayX || 0, -4, 4) * k, sy = clamp(st.swayY || 0, -4, 4) * k, br = Math.sin(st.breath || 0) * k;
    off[1] -= sx * 0.005; off[2] -= sy * 0.004 + br * 0.003;
    return [-sx * 0.028, sy * 0.025 + br * 0.006];
  }

  function detectorPose(st) {
    const V = viewMatrix([0, 0, 0], 0);
    const hide = 1 - (st.detK == null ? 1 : st.detK);
    const run = st.sprint || 0;
    const off = [-0.04 * run, (st.bobX || 0) * 0.5, (st.bobY || 0) - hide * 0.35 - 0.05 * run];
    const lag = applyLag(st, off, 1);
    return Mat.mul(V, about([0.35, 0.2, -0.3], off, -0.25 * run, hide * 0.8 + lag[1] + 0.3 * run, lag[0]));
  }

  C.MeshBuilder = MeshBuilder;
  C.VIEW_STRIDE = STRIDE;
  function detectorArms(dvm, M) { return buildArms([{ side: 'L', at: Mat.apply(M, ...dvm.wrist) }], dvm.sleeve); }

  C.ViewModels = { kindOf, buildWeapon, buildDetector, weaponPose, detectorPose, detectorArms, viewMatrix, IDENTITY };
})(globalThis.Cop98 = globalThis.Cop98 || {});
