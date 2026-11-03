(function (S) {
  'use strict';
  const M = S.METRICS;
  const BONES = ['hips', 'spine', 'chest', 'neck', 'head', 'jaw', 'clavL', 'armL', 'foreL', 'handL', 'fingerL', 'clavR', 'armR', 'foreR', 'handR', 'fingerR', 'thighL', 'shinL', 'footL', 'toeL', 'thighR', 'shinR', 'footR', 'toeR'];
  const PARENT = [-1, 0, 1, 2, 3, 4, 2, 6, 7, 8, 9, 2, 11, 12, 13, 14, 0, 16, 17, 18, 0, 20, 21, 22];
  const B = {};
  BONES.forEach((name, i) => { B[name] = i; });
  const COUNT = BONES.length;
  const STRIDE = 24;
  const TEXTURE = 256;

  const AGES = {
    adult: { height: M.adult, legs: 1, torso: 1, head: 1, arms: 1, girth: 1 },
    teen: { height: M.teen, legs: 0.95, torso: 0.93, head: 0.97, arms: 0.94, girth: 0.88 },
    child: { height: M.child, legs: 0.6, torso: 0.62, head: 0.88, arms: 0.6, girth: 0.7 },
    toddler: { height: M.toddler, legs: 0.36, torso: 0.42, head: 0.8, arms: 0.4, girth: 0.62 }
  };

  const RECTS = {
    head: [0, 0, 128, 64], hair: [128, 0, 64, 32], torso: [0, 64, 128, 64], arm: [128, 64, 32, 64],
    hand: [160, 64, 16, 32], leg: [0, 128, 64, 96], foot: [64, 128, 64, 32]
  };

  const TORSO = {
    m: [[0.84, 0.1, 0.085, 0], [0.9, 0.165, 0.11, 0], [0.97, 0.16, 0.105, 0], [1.05, 0.14, 0.098, 0.002], [1.14, 0.15, 0.105, 0.004], [1.24, 0.175, 0.12, 0.006], [1.34, 0.195, 0.118, 0.002], [1.41, 0.19, 0.098, -0.004], [1.465, 0.065, 0.062, 0]],
    f: [[0.84, 0.105, 0.09, 0], [0.9, 0.175, 0.115, -0.004], [0.97, 0.165, 0.105, -0.002], [1.05, 0.118, 0.085, 0.002], [1.14, 0.125, 0.09, 0.006], [1.24, 0.15, 0.112, 0.012], [1.31, 0.16, 0.112, 0.012], [1.4, 0.165, 0.088, 0], [1.465, 0.058, 0.056, 0]],
    t: [[0.84, 0.105, 0.09, 0], [0.9, 0.165, 0.11, -0.002], [0.97, 0.155, 0.1, 0], [1.05, 0.125, 0.09, 0.002], [1.14, 0.13, 0.092, 0.004], [1.24, 0.148, 0.102, 0.006], [1.31, 0.155, 0.102, 0.006], [1.4, 0.162, 0.086, 0], [1.465, 0.058, 0.056, 0]]
  };
  const TORSO_BONES = [[B.hips, B.hips, 0], [B.hips, B.hips, 0], [B.hips, B.spine, 0.5], [B.spine, B.spine, 0], [B.spine, B.chest, 0.5], [B.chest, B.chest, 0], [B.chest, B.chest, 0], [B.chest, B.chest, 0], [B.chest, B.neck, 0.6]];
  const HEAD_RINGS = [[1.44, 0.052, 0.052, 0, B.chest, B.neck, 0.7], [1.5, 0.05, 0.05, 0, B.neck, B.neck, 0], [1.545, 0.062, 0.072, 0.012, B.head, B.jaw, 0.6], [1.58, 0.074, 0.084, 0.012, B.head, B.jaw, 0.2], [1.62, 0.083, 0.092, 0.008, B.head, B.head, 0], [1.66, 0.088, 0.095, 0.005, B.head, B.head, 0], [1.7, 0.084, 0.09, 0, B.head, B.head, 0], [1.735, 0.062, 0.068, -0.002, B.head, B.head, 0], [1.752, 0.02, 0.02, -0.004, B.head, B.head, 0]];
  const ARM_RINGS = [[0.04, 0.02, 0.024, 0, 0, B.armL, 0], [-0.02, 0.046, 0.052, 0, 0, B.armL, 0], [-0.15, 0.044, 0.046, 0, 0, B.armL, 0], [-0.27, 0.036, 0.038, 0, 1, B.armL, 0.5], [-0.31, 0.036, 0.038, 0, 1, B.armL, 0.8], [-0.42, 0.036, 0.036, 0, 1, B.armL, 1], [-0.53, 0.025, 0.028, 0, 2, B.armL, 0.7]];
  const HAND_RINGS = [[-0.005, 0.026, 0.03, 0.002], [-0.05, 0.028, 0.044, 0.004], [-0.09, 0.026, 0.044, 0.006], [-0.125, 0.021, 0.038, 0.006], [-0.15, 0.01, 0.018, 0.006]];
  const LEG_RINGS = [[0.02, 0.085, 0.095, 0], [-0.1, 0.082, 0.09, 0], [-0.25, 0.068, 0.075, 0], [-0.4, 0.05, 0.055, 0.004], [-0.44, 0.05, 0.055, 0.006], [-0.56, 0.052, 0.06, -0.008], [-0.72, 0.038, 0.045, -0.008], [-0.82, 0.03, 0.036, -0.004]];
  const FOOT_RINGS = [[-0.075, -0.035, 0.03, 0.028], [-0.05, -0.02, 0.042, 0.05], [0.02, -0.02, 0.046, 0.052], [0.09, -0.04, 0.048, 0.03], [0.16, -0.05, 0.05, 0.02], [0.2, -0.056, 0.035, 0.012]];

  const LOD_RINGS = {
    torso: [[0, 1, 2, 3, 4, 5, 6, 7, 8], [1, 3, 5, 7, 8]],
    head: [[0, 1, 2, 3, 4, 5, 6, 7, 8], [1, 2, 4, 6, 8]],
    arm: [[0, 1, 2, 3, 4, 5, 6], [0, 2, 3, 6]],
    hand: [[0, 1, 2, 3, 4], [0, 1, 4]],
    leg: [[0, 1, 2, 3, 4, 5, 6, 7], [0, 2, 4, 6, 7]],
    foot: [[0, 1, 2, 3, 4, 5], [0, 2, 3, 5]]
  };
  const SIDES = {
    torso: [10, 6], head: [12, 7], arm: [7, 4], hand: [6, 4], leg: [8, 5], foot: [8, 5]
  };

  const skeletons = new Map();

  const skeleton = (age, sex) => {
    const key = age + sex;
    if (skeletons.has(key)) return skeletons.get(key);
    const a = AGES[age], t = a.torso, l = a.legs, h = a.head, r = a.arms, g = a.girth, shoulder = sex === 'f' ? 0.175 : 0.2;
    const off = new Float32Array(COUNT * 3), set = (name, x, y, z) => off.set([x, y, z], B[name] * 3);
    set('hips', 0, 0.93 * l, 0);
    set('spine', 0, 0.12 * t, 0);
    set('chest', 0, 0.17 * t, 0);
    set('neck', 0, 0.24 * t, 0);
    set('head', 0, 0.08 * h, 0);
    set('jaw', 0, 0.01 * h, 0.03 * h);
    for (const [side, sign] of [['L', 1], ['R', -1]]) {
      set('clav' + side, sign * 0.05 * g, 0.19 * t, 0);
      set('arm' + side, sign * (shoulder - 0.05) * g, 0.01 * t, 0);
      set('fore' + side, 0, -0.29 * r, 0);
      set('hand' + side, 0, -0.25 * r, 0);
      set('finger' + side, 0, -0.09 * r, 0);
      set('thigh' + side, sign * 0.095 * g, -0.03 * l, 0);
      set('shin' + side, 0, -0.43 * l, 0);
      set('foot' + side, 0, -0.4 * l, 0);
      set('toe' + side, 0, -0.05 * l, 0.13 * l);
    }
    const bind = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      for (let k = 0; k < 3; k++) bind[i * 3 + k] = off[i * 3 + k] + (PARENT[i] >= 0 ? bind[PARENT[i] * 3 + k] : 0);
    }
    const made = { age, sex, off, bind, hipsY: bind[1], legLen: 0.93 * l, a };
    skeletons.set(key, made);
    return made;
  };

  class MeshOut {
    constructor() {
      this.p = [];
      this.n = [];
      this.uv = [];
      this.w = [];
      this.i = [];
      this.count = 0;
    }

    vertex(x, y, z, u, v, b0, b1, w) {
      this.p.push(x, y, z);
      this.n.push(0, 0, 0);
      this.uv.push(u, v);
      this.w.push(b0, b1, w);
      return this.count++;
    }

    quad(a, b, c, d) {
      this.i.push(a, b, c, a, c, d);
    }

    faceNormals(from) {
      const { p, n, i } = this;
      for (let t = from; t < i.length; t += 3) {
        const a = i[t] * 3, b = i[t + 1] * 3, c = i[t + 2] * 3;
        const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2], vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        for (const q of [a, b, c]) {
          n[q] += nx;
          n[q + 1] += ny;
          n[q + 2] += nz;
        }
      }
    }

    joinSeam(first, line, rows, sides) {
      const n = this.n;
      for (let j = 0; j <= rows; j++) {
        const a = (first + j * line) * 3, b = (first + j * line + sides) * 3;
        for (let k = 0; k < 3; k++) {
          const sum = n[a + k] + n[b + k];
          n[a + k] = sum;
          n[b + k] = sum;
        }
      }
    }

    faceOutward(first, last) {
      const { p, n } = this, c = [0, 0, 0], count = last - first;
      for (let v = first; v < last; v++) {
        for (let k = 0; k < 3; k++) c[k] += p[v * 3 + k] / count;
      }
      let sum = 0;
      for (let v = first; v < last; v++) {
        for (let k = 0; k < 3; k++) sum += n[v * 3 + k] * (p[v * 3 + k] - c[k]);
      }
      if (sum < 0) {
        for (let q = first * 3; q < last * 3; q++) n[q] = -n[q];
      }
      return c;
    }

    capNormal(vertex, c) {
      const { p, n } = this;
      for (let k = 0; k < 3; k++) n[vertex * 3 + k] = p[vertex * 3 + k] - c[k];
    }

    pack() {
      const data = new ArrayBuffer(this.count * STRIDE), view = new DataView(data), { p, n, uv, w } = this;
      let top = -Infinity;
      for (let v = 0; v < this.count; v++) {
        const o = v * STRIDE, len = Math.hypot(n[v * 3], n[v * 3 + 1], n[v * 3 + 2]) || 1;
        for (let k = 0; k < 3; k++) {
          view.setFloat32(o + k * 4, p[v * 3 + k], true);
          view.setInt8(o + 12 + k, Math.round(n[v * 3 + k] / len * 127));
        }
        view.setUint16(o + 16, Math.round(uv[v * 2] * 65535), true);
        view.setUint16(o + 18, Math.round(uv[v * 2 + 1] * 65535), true);
        view.setUint8(o + 20, w[v * 3]);
        view.setUint8(o + 21, w[v * 3 + 1]);
        view.setUint8(o + 22, Math.round(w[v * 3 + 2] * 255));
        if (p[v * 3 + 1] > top) top = p[v * 3 + 1];
      }
      return { data, index: new Uint16Array(this.i), vertices: this.count, count: this.i.length, top };
    }
  }

  const loft = (out, rect, rings, sides) => {
    const from = out.i.length, first = out.count, [rx, ry, rw, rh] = rect, along = rings.length - 1;
    const uvOf = (u, v) => [(rx + u * rw) / TEXTURE, (ry + v * rh) / TEXTURE];
    rings.forEach((ring, j) => {
      for (let s = 0; s <= sides; s++) {
        const a = -Math.PI + s / sides * Math.PI * 2, sin = Math.sin(a), cos = Math.cos(a), [u, v] = uvOf(s / sides, ring.v === undefined ? j / along : ring.v);
        const bulge = ring.push ? ring.push(a) : 0;
        if (ring.flat) out.vertex(ring.x + ring.a * sin, ring.y + ring.b * cos, ring.z, u, v, ring.b0, ring.b1, ring.w);
        else out.vertex(ring.x + ring.a * sin, ring.y, ring.z + (ring.b + bulge) * cos, u, v, ring.b0, ring.b1, ring.w);
      }
    });
    const line = sides + 1;
    for (let j = 0; j < along; j++) {
      for (let s = 0; s < sides; s++) {
        const a = first + j * line + s, b = a + 1, c = a + line, d = c + 1;
        out.quad(a, c, d, b);
      }
    }
    out.faceNormals(from);
    out.joinSeam(first, line, along, sides);
    const middle = out.faceOutward(first, out.count);
    for (const j of [0, along]) {
      const ring = rings[j], [u, v] = uvOf(0.5, ring.v === undefined ? j / along : ring.v);
      const center = out.vertex(ring.x, ring.y, ring.z, u, v, ring.b0, ring.b1, ring.w);
      out.capNormal(center, middle);
      for (let s = 0; s < sides; s++) out.i.push(center, first + j * line + s, first + j * line + s + 1);
    }
  };

  const pick = (part, lod, list) => LOD_RINGS[part][lod].map(i => list[i]);

  const buildBody = (age, sex, lod) => {
    const out = new MeshOut(), skel = skeleton(age, sex), a = skel.a, bind = skel.bind, g = a.girth, side = part => SIDES[part][lod];
    const at = (name, k) => bind[B[name] * 3 + k];
    const torsoRows = TORSO[age === 'child' || age === 'toddler' ? 'm' : age === 'teen' && sex === 'f' ? 't' : sex];
    const torsoRings = torsoRows.map((row, i) => {
      const [y, rx, rz, oz] = row, [b0, b1, w] = TORSO_BONES[i], h = at('hips', 1);
      return { x: 0, y: h + (y - 0.93) * (y < 0.93 ? a.legs : a.torso), z: oz * g, a: rx * g, b: rz * g, b0, b1, w, v: (1.46 - y) / 0.62 };
    });
    loft(out, RECTS.torso, pick('torso', lod, torsoRings), side('torso'));
    const headRings = HEAD_RINGS.map(([y, rx, rz, oz, b0, b1, w]) => {
      const baseY = at('head', 1), s = y < 1.54 ? a.torso : a.head, scale = y < 1.54 ? g : a.head, hasNose = y === 1.62;
      const ring = { x: 0, y: baseY + (y - 1.54) * s, z: oz * scale, a: rx * scale, b: rz * scale, b0, b1, w, v: (1.76 - y) / 0.32 };
      if (hasNose) ring.push = t => Math.max(0, Math.cos(t)) ** 8 * 0.014 * a.head;
      return ring;
    });
    loft(out, RECTS.head, pick('head', lod, headRings), side('head'));
    for (const [letter, sign] of [['L', 1], ['R', -1]]) {
      const arm = B['arm' + letter], chain = [arm, B['fore' + letter], B['hand' + letter]], armX = at('arm' + letter, 0), armY = at('arm' + letter, 1);
      const armRings = ARM_RINGS.map(([dy, rx, rz, oz, seg, , w]) => {
        const b0 = seg === 0 ? chain[0] : seg === 1 ? chain[0] : chain[1], b1 = seg === 0 ? chain[0] : seg === 1 ? chain[1] : chain[2];
        return { x: armX, y: armY + dy * a.arms, z: oz, a: rx * g, b: rz * g, b0, b1, w, v: (0.03 - dy) / 0.56 };
      });
      loft(out, RECTS.arm, pick('arm', lod, armRings), side('arm'));
      const handY = at('hand' + letter, 1), hand = chain[2], finger = B['finger' + letter];
      const handRings = HAND_RINGS.map(([dy, rx, rz, oz]) => ({
        x: armX, y: handY + dy * a.arms, z: oz * g, a: rx * g, b: rz * g, b0: hand, b1: finger, w: dy < -0.07 ? 1 : 0, v: -dy / 0.15
      }));
      loft(out, RECTS.hand, pick('hand', lod, handRings), side('hand'));
      const thigh = B['thigh' + letter], shin = B['shin' + letter], foot = B['foot' + letter], toe = B['toe' + letter], legX = at('thigh' + letter, 0), legY = at('thigh' + letter, 1);
      const legRings = LEG_RINGS.map(([dy, rx, rz, oz]) => {
        let b0 = thigh, b1 = thigh, w = 0;
        if (dy <= -0.82) { b0 = shin; b1 = foot; w = 0.6; } else if (dy < -0.46) { b0 = shin; b1 = shin; } else if (dy <= -0.4) { b0 = thigh; b1 = shin; w = dy < -0.42 ? 0.65 : 0.35; }
        return { x: legX + sign * 0.002, y: legY + dy * a.legs, z: oz * g, a: rx * g, b: rz * g, b0, b1, w, v: (0.02 - dy) / 0.84 };
      });
      loft(out, RECTS.leg, pick('leg', lod, legRings), side('leg'));
      const ankleY = at('foot' + letter, 1), footRings = FOOT_RINGS.map(([dz, dy, rx, ry]) => {
        const toeSide = dz >= 0.13, mid = dz >= 0.05 && dz < 0.13;
        return { flat: true, x: legX, y: ankleY + dy * a.legs, z: dz * a.legs, a: rx * Math.max(g, 0.8), b: ry * a.legs, b0: toeSide ? toe : foot, b1: toeSide ? toe : toe, w: mid ? 0.5 : 0, v: (dz + 0.075) / 0.275 };
      });
      loft(out, RECTS.foot, pick('foot', lod, footRings), side('foot'));
    }
    return out.pack();
  };

  const HAIR_STYLES = {
    none: null,
    short: { rows: 5, sides: 12, lift: 0.007, bottom: t => 1.605 + 0.095 * ((1 + Math.cos(t)) / 2) ** 2 },
    long: { rows: 7, sides: 14, lift: 0.016, bottom: t => 1.38 + 0.32 * ((1 + Math.cos(t)) / 2) ** 3 }
  };
  const headRadius = y => {
    if (y <= 1.545) return [0.07, 0.078, -0.012];
    for (let i = 3; i < HEAD_RINGS.length; i++) {
      const r = HEAD_RINGS[i];
      if (y <= r[0]) {
        const q = HEAD_RINGS[i - 1], k = (y - q[0]) / (r[0] - q[0]);
        return [q[1] + (r[1] - q[1]) * k, q[2] + (r[2] - q[2]) * k, q[3] + (r[3] - q[3]) * k];
      }
    }
    const last = HEAD_RINGS[HEAD_RINGS.length - 1];
    return [last[1], last[2], last[3]];
  };

  const buildHair = (style, age, lod) => {
    const spec = HAIR_STYLES[style];
    if (!spec) return null;
    const out = new MeshOut(), a = AGES[age], bind = skeleton(age, 'm').bind, baseY = bind[B.head * 3 + 1], s = a.head, rows = lod ? 3 : spec.rows, sides = lod ? 7 : spec.sides, top = 1.765;
    const [rx, ry, rw, rh] = RECTS.hair, first = out.count;
    for (let j = 0; j <= rows; j++) {
      for (let k = 0; k <= sides; k++) {
        const t = -Math.PI + k / sides * Math.PI * 2, f = j / rows, y = top + (spec.bottom(t) - top) * f, [hx, hz, oz] = headRadius(y), grow = spec.lift * (1 + 0.5 * Math.sin(f * Math.PI));
        const flare = j === 0 ? 0.25 : 1;
        out.vertex((hx + grow) * Math.sin(t) * flare * s, baseY + (y - 1.54) * s, (oz + (hz + grow) * Math.cos(t) * flare) * s, (rx + k / sides * rw) / TEXTURE, (ry + f * rh) / TEXTURE, B.head, B.head, 0);
      }
    }
    const from = out.i.length, line = sides + 1;
    for (let j = 0; j < rows; j++) {
      for (let k = 0; k < sides; k++) {
        const p = first + j * line + k, q = p + 1, r = p + line, t = r + 1;
        out.quad(p, r, t, q);
      }
    }
    out.faceNormals(from);
    out.joinSeam(first, line, rows, sides);
    const middle = out.faceOutward(first, out.count);
    const cap = out.vertex(0, baseY + (top - 1.54) * s, -0.004 * s, (rx + 0.5 * rw) / TEXTURE, ry / TEXTURE, B.head, B.head, 0);
    out.capNormal(cap, middle);
    for (let k = 0; k < sides; k++) out.i.push(cap, first + k + 1, first + k);
    return out.pack();
  };

  const meshes = new Map();
  const cached = (key, make) => {
    if (!meshes.has(key)) meshes.set(key, make());
    return meshes.get(key);
  };

  const world = new Float32Array(COUNT * 12), rotA = new Float64Array(9), rotB = new Float64Array(9), tA = new Float64Array(3);

  S.Body = {
    BONES, B, PARENT, COUNT, STRIDE, AGES, RECTS, TEXTURE, HAIR_STYLES,
    skeleton,
    mesh: (age, sex, lod) => cached('b' + age + sex + lod, () => buildBody(age, sex, lod)),
    hair: (style, age, lod) => cached('h' + style + age + lod, () => buildHair(style, age, lod)),
    height: age => {
      const a = AGES[age];
      return 0.93 * a.legs + 0.53 * a.torso + 0.29 * a.head;
    },

    pose(skel, rot, root, x, y, z, yaw, out) {
      const { off, bind, a } = skel;
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      for (let i = 0; i < COUNT; i++) {
        const rx = rot[i * 3], ry = rot[i * 3 + 1], rz = rot[i * 3 + 2];
        const cx = Math.cos(rx), sx = Math.sin(rx), cb = Math.cos(ry), sb = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
        rotA[0] = cb * cz + sb * sx * sz;
        rotA[1] = -cb * sz + sb * sx * cz;
        rotA[2] = sb * cx;
        rotA[3] = cx * sz;
        rotA[4] = cx * cz;
        rotA[5] = -sx;
        rotA[6] = -sb * cz + cb * sx * sz;
        rotA[7] = sb * sz + cb * sx * cz;
        rotA[8] = cb * cx;
        const w = i * 12, parent = PARENT[i];
        if (parent < 0) {
          rotB[0] = cy;
          rotB[1] = 0;
          rotB[2] = sy;
          rotB[3] = 0;
          rotB[4] = 1;
          rotB[5] = 0;
          rotB[6] = -sy;
          rotB[7] = 0;
          rotB[8] = cy;
          tA[0] = x + (root[0] * cy + root[2] * sy) * a.legs;
          tA[1] = y + off[1] + root[1] * a.legs;
          tA[2] = z + (-root[0] * sy + root[2] * cy) * a.legs;
        } else {
          const p = parent * 12, ox = off[i * 3], oy = off[i * 3 + 1], oz = off[i * 3 + 2];
          rotB[0] = world[p];
          rotB[1] = world[p + 1];
          rotB[2] = world[p + 2];
          rotB[3] = world[p + 4];
          rotB[4] = world[p + 5];
          rotB[5] = world[p + 6];
          rotB[6] = world[p + 8];
          rotB[7] = world[p + 9];
          rotB[8] = world[p + 10];
          tA[0] = world[p + 3] + rotB[0] * ox + rotB[1] * oy + rotB[2] * oz;
          tA[1] = world[p + 7] + rotB[3] * ox + rotB[4] * oy + rotB[5] * oz;
          tA[2] = world[p + 11] + rotB[6] * ox + rotB[7] * oy + rotB[8] * oz;
        }
        for (let r = 0; r < 3; r++) {
          const b0 = rotB[r * 3], b1 = rotB[r * 3 + 1], b2 = rotB[r * 3 + 2];
          world[w + r * 4] = b0 * rotA[0] + b1 * rotA[3] + b2 * rotA[6];
          world[w + r * 4 + 1] = b0 * rotA[1] + b1 * rotA[4] + b2 * rotA[7];
          world[w + r * 4 + 2] = b0 * rotA[2] + b1 * rotA[5] + b2 * rotA[8];
          world[w + r * 4 + 3] = tA[r];
        }
        const bx = bind[i * 3], by = bind[i * 3 + 1], bz = bind[i * 3 + 2];
        for (let r = 0; r < 3; r++) {
          const q = w + r * 4, rr = world[q] * bx + world[q + 1] * by + world[q + 2] * bz;
          out[w + r * 4] = world[q];
          out[w + r * 4 + 1] = world[q + 1];
          out[w + r * 4 + 2] = world[q + 2];
          out[w + r * 4 + 3] = world[q + 3] - rr;
        }
      }
      return out;
    },

    point(rows, bone, x, y, z) {
      const o = bone * 12;
      return [rows[o] * x + rows[o + 1] * y + rows[o + 2] * z + rows[o + 3], rows[o + 4] * x + rows[o + 5] * y + rows[o + 6] * z + rows[o + 7], rows[o + 8] * x + rows[o + 9] * y + rows[o + 10] * z + rows[o + 11]];
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
