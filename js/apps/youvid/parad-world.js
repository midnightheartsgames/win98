(function () {
  const { M4, V3, Builder, rand, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;

  function Batch() {
    const map = {};
    return {
      b(key) { return map[key] || (map[key] = new Builder()); },
      build(r) { return Object.entries(map).map(([k, b]) => ({ key: k.split('#')[0], mesh: r.mesh(b) })); }
    };
  }

  function drawBatch(r, T, list, M, opts) {
    list.forEach(({ key, mesh }) => r.draw(mesh, M, Object.assign({ texture: key === 'flat' ? null : T[key] }, opts || {})));
  }

  function wallQuad(b, x0, z0, x1, z1, y0, y1, col, tile, u0) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const a = u0 || 0;
    const t = tile || 2;
    b.quad([x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0], col, [[a / t, y0 / t], [(a + len) / t, y0 / t], [(a + len) / t, y1 / t], [a / t, y1 / t]]);
  }

  function gableTri(b, x0, z0, x1, z1, y0, yTop, col, tile) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const t = tile || 2;
    const mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
    b.tri([x0, y0, z0], [x1, y0, z1], [mx, yTop, mz], col, [[0, y0 / t], [len / t, y0 / t], [len / 2 / t, yTop / t]]);
  }

  function box(b, x, y, z, w, h, d, col, rot, tile) {
    b.push(M4.translate(x, y, z), M4.rotY(rot || 0));
    const t = tile || 0;
    b.box(w, h, d, col, { base: true, uvScale: t ? 1 / t : 0 });
    b.pop();
  }

  function house(B, o) {
    const g = B;
    const W = o.w, D = o.d, H = o.h, R = o.roofH;
    const wall = g.b(o.wall);
    const pts = [[-W / 2, D / 2], [W / 2, D / 2], [W / 2, -D / 2], [-W / 2, -D / 2]];
    const M = M4.chain(M4.translate(o.x, 0, o.z), M4.rotY(o.rot || 0));
    const uniq = [...new Set([wall, g.b(o.gable || o.wall), g.b(o.roof === 'skeleton' ? 'flat' : o.roof), g.b('flat')])];
    uniq.forEach(b => b.push(M));
    for (let i = 0; i < 4; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[(i + 1) % 4];
      wallQuad(wall, x0, z0, x1, z1, 0, H, o.wallCol || [1, 1, 1], o.tile || 2.2);
    }
    const gable = g.b(o.gable || o.wall);
    if (o.ridge === 'x') {
      gableTri(gable, -W / 2, D / 2, W / 2, D / 2, H, H + R, o.gableCol || [1, 1, 1], 2);
      gableTri(gable, W / 2, -D / 2, -W / 2, -D / 2, H, H + R, o.gableCol || [1, 1, 1], 2);
    } else {
      gableTri(gable, W / 2, D / 2, W / 2, -D / 2, H, H + R, o.gableCol || [1, 1, 1], 2);
      gableTri(gable, -W / 2, -D / 2, -W / 2, D / 2, H, H + R, o.gableCol || [1, 1, 1], 2);
    }
    const roof = g.b(o.roof === 'skeleton' ? 'flat' : o.roof);
    const ov = 0.45;
    const rc = o.roofCol || [1, 1, 1];
    if (o.roof !== 'skeleton') {
      if (o.ridge === 'x') {
        const z1 = D / 2 + ov, x1 = W / 2 + ov;
        roof.quad([-x1, H - 0.25, z1], [x1, H - 0.25, z1], [x1, H + R, 0], [-x1, H + R, 0], rc, [[0, 0], [x1 * 0.8, 0], [x1 * 0.8, 3], [0, 3]]);
        roof.quad([x1, H - 0.25, -z1], [-x1, H - 0.25, -z1], [-x1, H + R, 0], [x1, H + R, 0], rc, [[0, 0], [x1 * 0.8, 0], [x1 * 0.8, 3], [0, 3]]);
      } else {
        const x1 = W / 2 + ov, z1 = D / 2 + ov;
        roof.quad([x1, H - 0.25, z1], [x1, H - 0.25, -z1], [0, H + R, -z1], [0, H + R, z1], rc, [[0, 0], [z1 * 0.8, 0], [z1 * 0.8, 3], [0, 3]]);
        roof.quad([-x1, H - 0.25, -z1], [-x1, H - 0.25, z1], [0, H + R, z1], [0, H + R, -z1], rc, [[0, 0], [z1 * 0.8, 0], [z1 * 0.8, 3], [0, 3]]);
      }
    } else {
      const fb = g.b('plankBrown');
      fb.push(M);
      const n = Math.round((o.ridge === 'x' ? W : D) / 0.8);
      for (let i = 0; i <= n; i++) {
        const s = -0.5 + i / n;
        if (o.ridge === 'x') {
          const x = s * W;
          fb.push(M4.translate(x, 0, 0));
          K.tube(fb, [[0, H, D / 2 + 0.3], [0, H + R, 0], [0, H, -D / 2 - 0.3]], [0.07, 0.07, 0.07], 4, [0.75, 0.62, 0.5]);
          fb.pop();
        } else {
          const z = s * D;
          fb.push(M4.translate(0, 0, z));
          K.tube(fb, [[W / 2 + 0.3, H, 0], [0, H + R, 0], [-W / 2 - 0.3, H, 0]], [0.07, 0.07, 0.07], 4, [0.75, 0.62, 0.5]);
          fb.pop();
        }
      }
      if (o.ridge === 'x') K.tube(fb, [[-W / 2, H + R, 0], [W / 2, H + R, 0]], [0.08, 0.08], 4, [0.7, 0.58, 0.46]);
      else K.tube(fb, [[0, H + R, -D / 2], [0, H + R, D / 2]], [0.08, 0.08], 4, [0.7, 0.58, 0.46]);
      fb.pop();
    }
    const flat = g.b('flat');
    (o.windows || []).forEach(([side, s, y, w, h]) => {
      const [x0, z0] = pts[side], [x1, z1] = pts[(side + 1) % 4];
      const nx = (z1 - z0), nz = -(x1 - x0);
      const l = Math.hypot(nx, nz);
      const ox = nx / l * 0.03, oz = nz / l * 0.03;
      const a = s - w / 2, c = s + w / 2;
      const P = (k, yy) => [lerp(x0, x1, k) + ox, yy, lerp(z0, z1, k) + oz];
      flat.quad(P(a, y), P(c, y), P(c, y + h), P(a, y + h), o.winCol || 0x1c1a18);
      if (o.frame !== false) {
        const fc = o.frameCol || 0xb8b4a8;
        const fw = 0.05;
        flat.quad(P(a, y - fw), P(c, y - fw), P(c, y), P(a, y), fc);
        flat.quad(P((a + c) / 2 - 0.02, y), P((a + c) / 2 + 0.02, y), P((a + c) / 2 + 0.02, y + h), P((a + c) / 2 - 0.02, y + h), fc);
      }
    });
    if (o.chimney) {
      const [cx, cz] = o.chimney;
      const cb = g.b('brickRed');
      cb.push(M);
      box(cb, cx, H, cz, 0.6, R + 1.0, 0.6, [1, 1, 1], 0, 1);
      cb.pop();
    }
    uniq.forEach(b => b.pop());
  }

  function shed(B, o) {
    const M = M4.chain(M4.translate(o.x, 0, o.z), M4.rotY(o.rot || 0));
    const br = B.b('brickRed');
    br.push(M);
    box(br, -1.2, 0, 0.9, 0.5, 2.3, 0.5, [1, 1, 1], 0, 1);
    box(br, 1.2, 0, 0.9, 0.5, 2.3, 0.5, [1, 1, 1], 0, 1);
    br.pop();
    const pk = B.b('plankGreySolid');
    pk.push(M);
    wallQuad(pk, -1.45, -1.2, -1.45, 1.1, 0, 2.3, [0.8, 0.8, 0.8], 2);
    wallQuad(pk, 1.45, 1.1, 1.45, -1.2, 0, 2.3, [0.8, 0.8, 0.8], 2);
    wallQuad(pk, 1.45, -1.2, -1.45, -1.2, 0, 2.3, [0.5, 0.5, 0.5], 2);
    pk.pop();
    const rf = B.b('slate');
    rf.push(M);
    rf.quad([-1.7, 2.4, 1.4], [1.7, 2.4, 1.4], [1.7, 2.7, -1.5], [-1.7, 2.7, -1.5], [0.8, 0.8, 0.8], [[0, 0], [2, 0], [2, 2], [0, 2]]);
    rf.quad([-1.7, 2.3, 1.4], [-1.7, 2.6, -1.5], [1.7, 2.6, -1.5], [1.7, 2.3, 1.4], [0.4, 0.4, 0.4], [[0, 0], [2, 0], [2, 2], [0, 2]]);
    rf.pop();
    const fl = B.b('flat');
    fl.push(M);
    fl.quad([-1.2, 0.01, 0.9], [1.2, 0.01, 0.9], [1.2, 0.01, -1.15], [-1.2, 0.01, -1.15], 0x161412);
    fl.quad([-1.2, 0, -1.15], [1.2, 0, -1.15], [1.2, 2.3, -1.15], [-1.2, 2.3, -1.15], 0x141210);
    fl.pop();
  }

  function fence(B, pts, o) {
    const b = B.b(o.tex);
    const h = o.h || 2.0;
    let u = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
      wallQuad(b, x0, z0, x1, z1, 0, h, o.col || [1, 1, 1], o.tile || 2, u);
      u += Math.hypot(x1 - x0, z1 - z0);
    }
    if (o.posts) {
      const fb = B.b('flat');
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
        const len = Math.hypot(x1 - x0, z1 - z0);
        const n = Math.max(1, Math.round(len / 2.5));
        for (let k = 0; k <= n; k++) box(fb, lerp(x0, x1, k / n), 0, lerp(z0, z1, k / n), 0.1, h + 0.1, 0.1, 0x3a322a);
      }
    }
  }

  function wireFence(B, pts) {
    const b = B.b('wire');
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
      wallQuad(b, x0, z0, x1, z1, 0.1, 1.5, [0.8, 0.8, 0.8], 3);
    }
    const bk = B.b('bark');
    pts.forEach(([x, z]) => {
      bk.push(M4.translate(x, 0, z));
      bk.prism(6, 0.07, 0.07, 0, 0.06, 0.06, 1.65, [0.9, 0.85, 0.8]);
      bk.pop();
    });
  }

  function cross(b, x, y, z, w, h, n, rot, col) {
    for (let i = 0; i < n; i++) {
      const a = (rot || 0) + (i / n) * PI;
      const dx = C(a) * w / 2, dz = S(a) * w / 2;
      b.quad([x - dx, y, z - dz], [x + dx, y, z + dz], [x + dx, y + h, z + dz], [x - dx, y + h, z - dz], col || [1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
    }
  }

  function poplar(B, x, z, h, seed) {
    const g = rand(seed);
    const k = 0.62 + g() * 0.2;
    cross(B.b('poplar'), x, 0, z, h * 0.34, h, 3, g() * PI, [k, k * 0.95, k * 0.88]);
  }

  function oak(B, x, z, h, seed, leaves) {
    const g = rand(seed);
    const bk = B.b('bark');
    bk.push(M4.translate(x, 0, z));
    K.tube(bk, [[0, 0, 0], [0.1, h * 0.35, 0.05], [0.2, h * 0.55, -0.1]], [h * 0.035, h * 0.028, h * 0.02], 6, [0.9, 0.9, 0.9]);
    bk.pop();
    const lb = B.b(leaves || 'leavesGreen');
    for (let i = 0; i < 7; i++) {
      const a = g() * PI * 2, rr = g() * h * 0.22;
      const cy = h * (0.45 + g() * 0.25);
      const s = h * (0.35 + g() * 0.2);
      const kk = 0.75 + g() * 0.35;
      cross(lb, x + C(a) * rr, cy - s / 2, z + S(a) * rr, s, s, 2, g() * PI, [kk, kk, kk]);
    }
  }

  function deadTree(B, x, z, h, seed) {
    const g = rand(seed);
    const bk = B.b('bark');
    bk.push(M4.translate(x, 0, z));
    K.tube(bk, [[0, 0, 0], [0.15, h * 0.3, 0], [0.05, h * 0.45, 0.1]], [h * 0.03, h * 0.022, h * 0.015], 6, [0.85, 0.82, 0.8]);
    bk.pop();
    cross(B.b('branches'), x, h * 0.2, z, h * 0.9, h * 0.85, 3, g() * PI, [0.9, 0.85, 0.8]);
  }

  function bush(B, x, z, s, seed) {
    const g = rand(seed);
    const k = 0.8 + g() * 0.3;
    cross(B.b('bush'), x, 0, z, s * 1.4, s, 2, g() * PI, [k, k, k]);
  }

  function tufts(B, cx, cz, rad, n, seed) {
    const g = rand(seed);
    const b = B.b('tuft');
    for (let i = 0; i < n; i++) {
      const a = g() * PI * 2, rr = Math.sqrt(g()) * rad;
      const s = 0.22 + g() * 0.28;
      const k = 0.55 + g() * 0.3;
      cross(b, cx + C(a) * rr, 0, cz + S(a) * rr, s * 1.4, s, 2, g() * PI, [k, k * 0.92, k * 0.8]);
    }
  }

  function pole(B, x, z, h, white) {
    const bk = B.b('bark');
    bk.push(M4.translate(x, 0, z));
    bk.prism(6, 0.13, 0.13, 0, 0.1, 0.1, h, [0.75, 0.68, 0.6], { capTop: true });
    bk.pop();
    const fl = B.b('flat');
    box(fl, x, h - 0.8, z, 1.4, 0.1, 0.1, 0x3a3028);
    if (white) {
      fl.push(M4.translate(x, 0, z));
      fl.prism(6, 0.145, 0.145, 0, 0.14, 0.14, 1.6, 0xd8d6cc, { capTop: false });
      fl.pop();
    }
  }

  function wires(B, a, b2, h) {
    const fl = B.b('flat');
    [-0.6, 0.6].forEach(o => {
      const p0 = [a[0] + o, h, a[1]], p1 = [b2[0] + o, h, b2[1]];
      const mid = [(p0[0] + p1[0]) / 2, h - 0.6, (p0[2] + p1[2]) / 2];
      K.tube(fl, [p0, mid, p1], [0.015, 0.015, 0.015], 3, 0x1a1816);
    });
  }

  function road(B, pts, w, key) {
    const b = B.b(key || 'dirt');
    let u = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
      const dx = x1 - x0, dz = z1 - z0;
      const l = Math.hypot(dx, dz);
      const nx = -dz / l * w / 2, nz = dx / l * w / 2;
      const t = 4;
      b.quad([x0 - nx, 0.02, z0 - nz], [x0 + nx, 0.02, z0 + nz], [x1 + nx, 0.02, z1 + nz], [x1 - nx, 0.02, z1 - nz], [1, 1, 1], [[0, u / t], [w / t, u / t], [w / t, (u + l) / t], [0, (u + l) / t]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
      u += l;
    }
  }

  function ground(B, cx, cz, size, seed, key) {
    const b = B.b(key || 'grass');
    const n = 24;
    const step = size / n;
    const col = (x, z) => {
      const v = 0.82 + 0.18 * S(x * 0.07 + seed) * C(z * 0.05 - seed) + 0.1 * S(x * 0.21 + z * 0.17);
      return [v, v * (0.96 + 0.04 * S(x * 0.03)), v * 0.9];
    };
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x0 = cx - size / 2 + i * step, z0 = cz - size / 2 + j * step;
        const x1 = x0 + step, z1 = z0 + step;
        const t = 3.2;
        b.quad([x0, 0, z1], [x1, 0, z1], [x1, 0, z0], [x0, 0, z0], [col(x0, z1), col(x1, z1), col(x1, z0), col(x0, z0)], [[x0 / t, z1 / t], [x1 / t, z1 / t], [x1 / t, z0 / t], [x0 / t, z0 / t]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
      }
    }
  }

  function hills(B, cx, cz, rad, seed, n) {
    const g = rand(seed);
    const b = B.b('grass#hill');
    const count = n || 18;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * PI * 2 + g() * 0.2;
      const r = rad * (0.85 + g() * 0.3);
      const hx = cx + S(a) * r, hz = cz - C(a) * r;
      const w = rad * (0.35 + g() * 0.3), h = rad * (0.04 + g() * 0.05);
      const tx = C(a), tz = S(a);
      const seg = 10;
      for (let k = 0; k < seg; k++) {
        const s0 = -1 + 2 * k / seg, s1 = -1 + 2 * (k + 1) / seg;
        const y0 = h * (1 - s0 * s0), y1 = h * (1 - s1 * s1);
        const p0 = [hx + tx * s0 * w, 0, hz + tz * s0 * w], p1 = [hx + tx * s1 * w, 0, hz + tz * s1 * w];
        const back = [S(a) * w * 0.4, 0, -C(a) * w * 0.4];
        const kk = 0.7 + 0.1 * g();
        b.quad(p0, p1, [p1[0] + back[0], y1, p1[2] + back[2]], [p0[0] + back[0], y0, p0[2] + back[2]], [kk, kk, kk * 0.92], [[s0 * 6, 0], [s1 * 6, 0], [s1 * 6, 2], [s0 * 6, 2]]);
      }
    }
  }

  function planksLying(B, x, z, n, seed) {
    const g = rand(seed);
    const b = B.b('plankGreySolid');
    for (let i = 0; i < n; i++) {
      const a = g() * PI, l = 1.5 + g() * 2;
      box(b, x + (g() - 0.5) * 2, 0, z + (g() - 0.5) * 2, 0.25, 0.06 + g() * 0.05, l, [0.9, 0.88, 0.85], a, 1);
    }
  }

  function stake(B, x, z, rot) {
    const b = B.b('flat');
    b.push(M4.translate(x, 0, z), M4.rotY(rot || 0));
    b.push(M4.rotZ(0.25));
    b.box(0.14, 1.5, 0.12, 0xd8d4c8, { base: true });
    b.pop();
    b.push(M4.rotZ(-0.2));
    b.box(0.14, 1.4, 0.12, 0xcfcbbf, { base: true });
    b.pop();
    b.pop();
  }

  function crate(B, x, z, rot, col) {
    box(B.b('flat'), x, 0, z, 1.0, 0.55, 0.6, col || 0x4a6a96, rot || 0);
  }

  function barrel(b) {
    b.prism(14, 0.32, 0.32, 0, 0.32, 0.32, 0.9, 0x3a3836, { capTop: false });
    b.prism(14, 0.335, 0.335, 0.1, 0.335, 0.335, 0.16, 0x4a4440, { capTop: false });
    b.prism(14, 0.335, 0.335, 0.7, 0.335, 0.335, 0.76, 0x4a4440, { capTop: false });
    b.disc(0.3, 14, 0x1a1210, 0.72);
    for (let i = 0; i < 6; i++) {
      const a = i * 1.1;
      b.push(M4.translate(S(a) * 0.15, 0.78, C(a) * 0.15), M4.rotY(a), M4.rotZ(0.6));
      b.box(0.08, 0.06, 0.4, 0x2a1a10);
      b.pop();
    }
  }

  function cistern(b) {
    b.push(M4.translate(0, 1.15, 0), M4.rotX(PI / 2));
    b.prism(16, 0.85, 0.85, -2.0, 0.85, 0.85, 2.0, [1, 1, 1], { capTop: true, capBottom: true });
    b.pop();
    [-0.6, 0.6].forEach(x => {
      b.push(M4.translate(x, 0.38, 0.4), M4.rotZ(PI / 2));
      b.prism(10, 0.38, 0.38, -0.12, 0.38, 0.38, 0.12, [0.25, 0.25, 0.25], { capTop: true, capBottom: true });
      b.pop();
    });
    b.push(M4.translate(0, 0.35, -2.4));
    b.box(0.1, 0.1, 1.4, [0.3, 0.3, 0.3]);
    b.pop();
  }

  function wheel(b, x, y, z, r, w, col) {
    b.push(M4.translate(x, y, z), M4.rotZ(PI / 2));
    b.prism(12, r, r, -w / 2, r, r, w / 2, col || 0x1e1e1c, { capTop: true, capBottom: true });
    b.pop();
  }

  function btr(b, col) {
    const c = col || [1, 1, 1];
    b.quad([-1.4, 0.7, 3.4], [1.4, 0.7, 3.4], [1.3, 1.5, 2.6], [-1.3, 1.5, 2.6], c, [[0, 0], [1, 0], [1, 0.5], [0, 0.5]]);
    b.quad([-1.3, 1.5, 2.6], [1.3, 1.5, 2.6], [1.25, 2.0, 1.2], [-1.25, 2.0, 1.2], c, [[0, 0], [1, 0], [1, 0.6], [0, 0.6]]);
    b.quad([-1.25, 2.0, 1.2], [1.25, 2.0, 1.2], [1.25, 2.0, -3.0], [-1.25, 2.0, -3.0], c, [[0, 0], [1, 0], [1, 2], [0, 2]]);
    b.quad([-1.4, 0.7, -3.4], [-1.25, 2.0, -3.0], [1.25, 2.0, -3.0], [1.4, 0.7, -3.4], c, [[0, 0], [0, 0.6], [1, 0.6], [1, 0]]);
    [-1, 1].forEach(s => {
      const x0 = 1.4 * s, x1 = 1.25 * s, x2 = 1.3 * s;
      const q = s > 0 ? (a, bq, cq, d) => b.quad(a, bq, cq, d, c, [[0, 0], [3, 0], [3, 0.6], [0, 0.6]]) : (a, bq, cq, d) => b.quad(d, cq, bq, a, c, [[0, 0], [3, 0], [3, 0.6], [0, 0.6]]);
      q([x0, 0.7, -3.4], [x0, 0.7, 3.4], [x2, 1.5, 2.6], [x1, 2.0, -3.0]);
      q([x2, 1.5, 2.6], [x1, 2.0, 1.2], [x1, 2.0, -3.0], [x2, 1.5, 2.6]);
    });
    b.quad([-1.4, 0.7, 3.4], [-1.4, 0.7, -3.4], [1.4, 0.7, -3.4], [1.4, 0.7, 3.4], [0.4, 0.4, 0.4]);
    b.push(M4.translate(0, 2.0, 0.6));
    b.prism(8, 0.5, 0.5, 0, 0.42, 0.42, 0.45, c);
    b.pop();
    b.push(M4.translate(0, 2.25, 1.0), M4.rotX(PI / 2));
    b.prism(6, 0.06, 0.06, 0, 0.05, 0.05, 1.6, 0x2a2a24);
    b.pop();
    [-2.3, -0.8, 0.8, 2.3].forEach(z => [-1, 1].forEach(s => {
      wheel(b, s * 1.38, 0.62, z, 0.6, 0.45, 0x3c3c38);
      wheel(b, s * 1.62, 0.62, z, 0.3, 0.02, 0x8a8a7a);
    }));
  }

  function car(b, col) {
    const c = col || [1, 1, 1];
    b.push(M4.translate(0, 0.35, 0));
    b.box(1.65, 0.6, 4.2, c, { base: true });
    b.pop();
    b.quad([-0.75, 0.95, 0.9], [0.75, 0.95, 0.9], [0.7, 1.4, 0.2], [-0.7, 1.4, 0.2], 0x2a2c2e);
    b.quad([-0.7, 1.4, 0.2], [0.7, 1.4, 0.2], [0.7, 1.4, -1.0], [-0.7, 1.4, -1.0], c);
    b.quad([-0.7, 1.4, -1.0], [0.7, 1.4, -1.0], [0.75, 0.95, -1.5], [-0.75, 0.95, -1.5], 0x2a2c2e);
    [-1, 1].forEach(s => {
      const pts = [[0.8 * s, 0.95, 0.9], [0.8 * s, 0.95, -1.5], [0.72 * s, 1.4, -1.0], [0.72 * s, 1.4, 0.2]];
      if (s > 0) b.quad(pts[0], pts[1], pts[2], pts[3], 0x2a2c2e); else b.quad(pts[3], pts[2], pts[1], pts[0], 0x2a2c2e);
    });
    [-1.35, 1.35].forEach(z => [-1, 1].forEach(s => wheel(b, s * 0.78, 0.33, z, 0.33, 0.2, 0x1e1e1c)));
  }

  function bus(B, x, z, rot) {
    const M = M4.chain(M4.translate(x, 0, z), M4.rotY(rot || 0));
    const b = B.b('bus');
    b.push(M);
    const L = 7, Wd = 2.4, Hh = 2.6;
    b.quad([Wd / 2, 0.4, L / 2], [Wd / 2, 0.4, -L / 2], [Wd / 2, Hh, -L / 2], [Wd / 2, Hh, L / 2], [1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    b.quad([-Wd / 2, 0.4, -L / 2], [-Wd / 2, 0.4, L / 2], [-Wd / 2, Hh, L / 2], [-Wd / 2, Hh, -L / 2], [1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    b.pop();
    const fl = B.b('flat');
    fl.push(M);
    fl.quad([-Wd / 2, Hh, L / 2], [Wd / 2, Hh, L / 2], [Wd / 2, Hh, -L / 2], [-Wd / 2, Hh, -L / 2], 0xd8d4c8);
    fl.quad([-Wd / 2, 0.4, L / 2], [Wd / 2, 0.4, L / 2], [Wd / 2, Hh, L / 2], [-Wd / 2, Hh, L / 2], 0x3e6aa0);
    fl.quad([Wd / 2, 0.4, -L / 2], [-Wd / 2, 0.4, -L / 2], [-Wd / 2, Hh, -L / 2], [Wd / 2, Hh, -L / 2], 0xd0ccc0);
    fl.quad([-Wd / 2 + 0.1, 1.3, L / 2 + 0.01], [Wd / 2 - 0.1, 1.3, L / 2 + 0.01], [Wd / 2 - 0.1, 2.3, L / 2 + 0.01], [-Wd / 2 + 0.1, 2.3, L / 2 + 0.01], 0x283240);
    [-2.4, 2.4].forEach(zz => [-1, 1].forEach(s => wheel(fl, s * 1.1, 0.42, zz, 0.42, 0.3)));
    fl.pop();
  }

  function heli(b) {
    const cam = [1, 1, 1];
    b.push(M4.rotX(PI / 2));
    b.prism(10, 0.9, 1.1, -2.5, 1.0, 1.2, 1.2, cam, { capBottom: true, capTop: false });
    b.prism(10, 1.0, 1.2, 1.2, 0.5, 0.6, 2.6, cam, { capTop: true });
    b.prism(8, 0.45, 0.5, -6.8, 0.9, 1.0, -2.5, cam, { capBottom: true, capTop: false });
    b.pop();
    b.push(M4.translate(0, 0.9, -6.6));
    b.box(0.15, 1.6, 0.9, cam);
    b.pop();
    b.push(M4.translate(0, 1.35, 0.2));
    b.prism(8, 0.4, 0.4, 0, 0.3, 0.3, 0.5, 0x3a3a30);
    b.pop();
    [0.2, 1.4, 2.6, 3.8].forEach((a, i) => {
      b.push(M4.translate(0, 1.85, 0.2), M4.rotY(a + i * 0.1), M4.rotZ(0.12 * (i % 2 ? 1 : -1)));
      b.box(0.35, 0.05, 7.5, 0x2a2c26, { base: true });
      b.pop();
    });
    [-1, 1].forEach(s => {
      b.push(M4.translate(s * 1.5, -0.1, 0.4));
      b.box(1.8, 0.12, 0.6, cam);
      b.pop();
    });
    b.quad([-0.7, 0.5, 2.5], [0.7, 0.5, 2.5], [0.4, 0.9, 1.6], [-0.4, 0.9, 1.6], 0x30383a);
  }

  const VILLAGE = {
    houses: [
      { x: -21.0, z: -12.8, w: 9.0, d: 8.4, h: 3.0, roofH: 3.4, rot: 0, ridge: 'z', wall: 'plaster', gable: 'plankBrown', roof: 'slate', chimney: [-1.5, -2.6], windows: [[1, 0.5, 3.4, 1.1, 1.4], [0, 0.3, 1.0, 1.0, 1.1], [0, 0.7, 1.0, 1.0, 1.1]] },
      { x: -1.0, z: -25.0, w: 9.0, d: 7.0, h: 3.0, roofH: 2.6, rot: 0.25, ridge: 'x', wall: 'brickPink', roof: 'skeleton', windows: [[0, 0.3, 1.0, 1.0, 1.2], [0, 0.7, 1.0, 0.9, 1.6]] },
      { x: 4.0, z: -44.0, w: 10.0, d: 7.0, h: 3.0, roofH: 2.8, rot: 0.1, ridge: 'x', wall: 'plankBlue', gable: 'plankBlue', roof: 'slate', chimney: [3, -1], windows: [[0, 0.25, 1.0, 1.2, 1.2], [0, 0.55, 1.0, 1.2, 1.2], [0, 0.8, 1.0, 1.0, 1.2]] },
      { x: 22.0, z: -40.0, w: 8.0, d: 7.0, h: 3.0, roofH: 2.8, rot: -0.2, ridge: 'z', wall: 'plankBlue', gable: 'plankBlue', roof: 'slate', windows: [[0, 0.5, 1.0, 1.2, 1.2]] },
      { x: -25.0, z: -13.0, w: 9.0, d: 7.0, h: 3.0, roofH: 3.0, rot: -PI / 2, ridge: 'x', wall: 'plaster', roof: 'slate', chimney: [2, 0], windows: [[0, 0.3, 1.0, 1.0, 1.2], [0, 0.7, 1.0, 1.0, 1.2]] },
      { x: -29.0, z: -27.0, w: 9.0, d: 7.0, h: 3.0, roofH: 3.0, rot: 0.6, ridge: 'x', wall: 'plaster', roof: 'slate', windows: [[0, 0.3, 1.0, 1.0, 1.2], [0, 0.7, 1.0, 1.0, 1.2]] },
      { x: -34.0, z: -4.0, w: 8.0, d: 6.0, h: 2.8, roofH: 2.6, rot: 1.2, ridge: 'x', wall: 'plaster', roof: 'skeleton', windows: [[0, 0.5, 1.0, 1.0, 1.2]] },
      { x: 14.0, z: 14.0, w: 9.0, d: 7.0, h: 2.9, roofH: 2.8, rot: 2.4, ridge: 'x', wall: 'plaster', roof: 'skeleton', windows: [[0, 0.3, 1.0, 1.0, 1.2], [0, 0.7, 1.0, 1.0, 1.2]] },
      { x: 26.0, z: 2.0, w: 8.0, d: 7.0, h: 2.8, roofH: 2.6, rot: 1.9, ridge: 'x', wall: 'plaster', roof: 'slate', windows: [[0, 0.5, 1.0, 1.0, 1.2]] },
      { x: 12.0, z: -6.0, w: 7.0, d: 6.0, h: 2.8, roofH: 2.4, rot: 1.6, ridge: 'x', wall: 'plankGreySolid', gable: 'plankGreySolid', roof: 'slate', windows: [[0, 0.5, 1.0, 1.0, 1.2]] },
      { x: 8.0, z: -64.0, w: 9.0, d: 7.0, h: 3.0, roofH: 2.6, rot: 0.3, ridge: 'x', wall: 'plaster', roof: 'skeleton' },
      { x: -12.0, z: -42.0, w: 8.0, d: 7.0, h: 3.0, roofH: 2.6, rot: -0.3, ridge: 'x', wall: 'plankBlue', gable: 'plankBlue', roof: 'slate', windows: [[0, 0.5, 1.0, 1.2, 1.2]] }
    ],
    sheds: [{ x: -16.4, z: -7.0, rot: -PI / 2 }],
    roads: [
      [[8, 12], [0, 0], [-5, -7], [-10, -12.5], [-17, -24], [-26, -44], [-34, -70]],
      [[-10, -12.5], [-2, -18], [10, -26], [24, -32]]
    ],
    fences: [
      { tex: 'plankGrey', pts: [[-3.5, -0.5], [-6.5, -3.4], [-10.6, -6.6]], h: 2.1, posts: true },
      { tex: 'plankBlue', pts: [[3.6, -9.0], [4.2, -14.0], [4.6, -17.5]], h: 1.8, posts: true },
      { tex: 'plankBlue', pts: [[-4.0, -30.0], [1.0, -36.0], [12.0, -38.0]], h: 1.7, posts: true },
      { tex: 'plankGrey', pts: [[-20.0, -30.0], [-12.0, -26.0], [-6.0, -24.5]], h: 1.8, posts: true },
      { tex: 'plankGrey', pts: [[-30.0, -8.0], [-26.0, -18.0]], h: 1.8, posts: true },
      { tex: 'plankGreySolid', pts: [[2.0, 8.0], [8.0, 4.0], [16.0, 6.0]], h: 1.8, posts: true }
    ],
    wire: [[-1.7, -2.5], [-5.0, -1.6], [-8.4, -0.6], [-11.6, 0.4]],
    poplars: [[-24, -2, 17], [-27, 6, 18], [-8, -32, 19], [-3, -30, 18], [3, -33, 17], [-20, -34, 18], [16, -30, 17], [-30, -34, 19], [-36, -20, 18], [30, -20, 17], [-14, 6, 16], [-6, 10, 18], [18, 22, 17], [0, -58, 18], [-18, -52, 18], [26, -52, 17], [-40, 4, 18]],
    oaks: [[13.0, -19.0, 13, 'leavesGreen'], [18.0, -32.0, 13, 'leavesGreen'], [-34.0, -36.0, 12, 'leavesGreen'], [24.0, -12.0, 12, 'leavesDark'], [-24.0, -44.0, 14, 'leavesGreen'], [-8.0, 20.0, 12, 'leavesAutumn'], [34.0, 12.0, 13, 'leavesGreen'], [-44.0, -10.0, 13, 'leavesDark'], [10.0, -54.0, 12, 'leavesGreen']],
    dead: [[-16.0, -2.0, 10], [6.0, 6.0, 9], [-28.0, -14.0, 10]],
    bushes: [[-4.4, 2.6, 2.4], [-2.6, 4.0, 2.0], [-5.6, -1.2, 1.6], [2.8, -2.0, 1.4], [-9.6, 1.0, 2.0], [7.0, -12.0, 1.8], [-14.0, -2.0, 2.2], [1.5, 6.5, 2.0], [-1.0, -18.0, 1.6], [-20.0, -6.0, 2.0]],
    poles: [[-1.0, -22.0, 8.5, false], [-9.0, -36.0, 8.5, false], [6.2, -6.0, 8.0, true], [-3.0, -12.0, 8.0, false], [9.0, -30.0, 8.0, false], [-18.0, -46.0, 8.5, false], [16.0, 6.0, 8.0, false]],
    stakes: [[-14.0, -16.4, 0.2], [-16.5, -19.8, 1.2], [-11.0, -20.0, 0.5]],
    crates: [[-7.4, -5.0, 0.3], [-3.4, -13.6, 0.0]],
    planks: [[-11.5, -12.8, 4, 4], [-15.0, -14.0, 3, 6], [-8.0, -16.0, 3, 9]],
    tufts: [[-2, -2, 6, 30], [-12, -9, 5, 26], [-6, -14, 6, 20], [4, -4, 6, 24], [-8, 2, 5, 20], [-16, -16, 5, 14]],
    cistern: { x: 0.5, z: -8.4, rot: 0.15 },
    cisternFar: { x: -3.6, z: -27.0, rot: 1.3 },
    barrelA: { x: -9.3, z: -9.5 },
    barrelB: { x: -9.3, z: -9.5 },
    buses: [[-21.0, -42.0, 0.4], [-27.5, -58.0, 0.2]],
    wrecks: [[-6.0, -27.0, 0.4, 'carWhite'], [-24.0, -38.0, 1.3, 'carWhite'], [2.0, -30.0, 2.0, 'carWhite']],
    helis: [{ x: -10.0, z: -24.0, rot: 2.2, tilt: 0.25, lift: 0.3 }, { x: 16.0, z: -7.2, rot: -0.6, tilt: -1.05, lift: 2.4 }]
  };

  const FIELD = {
    hills: true,
    oaks: [[-16, -12, 11, 'leavesDark'], [8, -26, 12, 'leavesDark'], [-22, -30, 13, 'leavesDark'], [16, -12, 10, 'leavesGreen'], [26, -34, 12, 'leavesDark'], [-30, -12, 12, 'leavesDark'], [4, 8, 11, 'leavesDark'], [-14, 6, 12, 'leavesDark'], [36, -10, 12, 'leavesGreen'], [-40, -40, 13, 'leavesDark'], [-8, -46, 12, 'leavesDark'], [20, -56, 12, 'leavesDark']],
    dead: [[2.0, -36.0, 12], [10.0, -40.0, 11], [-4.0, -60.0, 10], [24.0, -44.0, 11]],
    bushes: [[-6, -9, 1.4], [6, -14, 1.6], [-8, -16, 1.4], [0, -24, 1.8], [10, -24, 1.6], [-12, -26, 2.0], [14, -32, 1.6], [-18, -20, 1.8], [1.0, 1.2, 2.6], [-1.4, 1.6, 2.4]],
    tufts: [[0, -6, 10, 60], [-10, -20, 10, 40], [10, -20, 10, 40], [0, -30, 12, 40]]
  };

  const YARD = {
    houses: [
      { x: -4.0, z: -2.5, w: 5.0, d: 10.0, h: 2.8, roofH: 2.4, rot: 0, ridge: 'z', wall: 'plankTeal', gable: 'plankTeal', roof: 'tin', windows: [[1, 0.25, 1.0, 0.9, 1.1], [1, 0.62, 1.0, 0.9, 1.1]], winCol: 0x24302c, frameCol: 0xc8c0b0 },
      { x: 9.0, z: -18.0, w: 9.0, d: 7.0, h: 2.9, roofH: 2.6, rot: -0.3, ridge: 'x', wall: 'plaster', roof: 'slate', chimney: [2, 0], windows: [[0, 0.3, 1.0, 1.0, 1.2], [0, 0.7, 1.0, 1.0, 1.2]] },
      { x: -1.0, z: -24.0, w: 9.0, d: 7.0, h: 2.9, roofH: 2.6, rot: 0.1, ridge: 'x', wall: 'plaster', roof: 'slate', windows: [[0, 0.3, 1.0, 1.0, 1.2], [0, 0.7, 1.0, 1.0, 1.2]] },
      { x: -9.0, z: -26.0, w: 9.0, d: 7.0, h: 2.9, roofH: 2.6, rot: 0.2, ridge: 'x', wall: 'plankBlue', gable: 'plankBlue', roof: 'slate', windows: [[0, 0.5, 1.0, 1.0, 1.1]] },
      { x: 3.0, z: -30.0, w: 9.0, d: 7.0, h: 2.9, roofH: 2.6, rot: -0.1, ridge: 'x', wall: 'plaster', roof: 'skeleton' },
      { x: -20.0, z: -18.0, w: 8.0, d: 7.0, h: 2.8, roofH: 2.4, rot: 1.2, ridge: 'x', wall: 'plaster', roof: 'slate' }
    ],
    fences: [
      { tex: 'plankGreySolid', pts: [[3.0, 3.0], [3.3, -5.0], [2.8, -10.5]], h: 2.0, posts: true },
      { tex: 'plankGrey', pts: [[-14, -16], [-8, -16.5], [-4, -16.2]], h: 1.7, posts: true },
      { tex: 'plankGrey', pts: [[4, -14.5], [14, -15]], h: 1.7, posts: true },
      { tex: 'plankGreySolid', pts: [[-14, -20.5], [-6, -20.8], [6, -21.2]], h: 1.8, posts: true }
    ],
    roads: [[[5, 6], [6, -10], [0, -16], [-12, -20], [-24, -30]]],
    oaks: [[-1.0, -19.0, 13, 'leavesGreen'], [5.0, -21.0, 14, 'leavesAutumn'], [12, -10, 12, 'leavesGreen'], [-14, -10, 12, 'leavesDark']],
    poplars: [[8.0, -24.0, 17], [-6.0, -30.0, 18], [16.0, -28.0, 17], [-16, -26, 17]],
    buses: [[9.0, -12.0, 1.4]],
    wrecks: [[-6.0, -9.4, 0.9, 'carWhite']],
    barrel: { x: -1.5, z: -10.6 },
    statics: [{ kind: 'freezer', x: 2.4, z: -18.8, rot: 0.2, glow: true }, { kind: 'freezer', x: -3.8, z: -13.4, rot: 0.7 }, { kind: 'cistern', x: 0.4, z: -19.4, rot: 1.6 }, { kind: 'horn', x: -10.1, z: -11.1, rot: 0.9 }],
    stakes: [[-8.6, -10.2, 0.3]],
    tufts: [[0, -4, 3, 20], [-1, -10, 4, 20], [-4, -12, 5, 20]]
  };

  function buildSet(r, L, origin, seed) {
    const B = Batch();
    const [ox, , oz] = origin;
    const O = (x, z) => [ox + x, oz + z];
    ground(B, ox, oz - 20, 420, seed);
    (L.roads || []).forEach(pts => road(B, pts.map(([x, z]) => O(x, z)), 4.2));
    (L.houses || []).forEach(h => house(B, Object.assign({}, h, { x: ox + h.x, z: oz + h.z })));
    (L.sheds || []).forEach(s => shed(B, Object.assign({}, s, { x: ox + s.x, z: oz + s.z })));
    (L.fences || []).forEach(f => fence(B, f.pts.map(([x, z]) => O(x, z)), f));
    if (L.wire) wireFence(B, L.wire.map(([x, z]) => O(x, z)));
    (L.poplars || []).forEach(([x, z, h], i) => poplar(B, ox + x, oz + z, h, 100 + i));
    (L.oaks || []).forEach(([x, z, h, lv], i) => oak(B, ox + x, oz + z, h, 200 + i, lv));
    (L.dead || []).forEach(([x, z, h], i) => deadTree(B, ox + x, oz + z, h, 300 + i));
    (L.bushes || []).forEach(([x, z, s], i) => bush(B, ox + x, oz + z, s, 400 + i));
    (L.tufts || []).forEach(([x, z, rr, n], i) => tufts(B, ox + x, oz + z, rr, n, 500 + i));
    (L.poles || []).forEach(([x, z, h, w]) => pole(B, ox + x, oz + z, h, w));
    for (let i = 0; i + 1 < (L.poles || []).length; i++) {
      const a = L.poles[i], c = L.poles[i + 1];
      if (Math.hypot(a[0] - c[0], a[1] - c[1]) < 30) wires(B, O(a[0], a[1]), O(c[0], c[1]), a[2] - 0.8);
    }
    (L.stakes || []).forEach(([x, z, rr]) => stake(B, ox + x, oz + z, rr));
    (L.crates || []).forEach(([x, z, rr]) => crate(B, ox + x, oz + z, rr));
    (L.planks || []).forEach(([x, z, n, sd]) => planksLying(B, ox + x, oz + z, n, sd));
    (L.buses || []).forEach(([x, z, rr]) => bus(B, ox + x, oz + z, rr));
    if (L.hills) hills(B, ox, oz - 20, 150, seed + 7, 22);
    else hills(B, ox, oz - 20, 190, seed + 7, 16);
    return B.build(r);
  }

  function build(r) {
    const C0 = window.ParadCam;
    const W = {};
    W.village = buildSet(r, VILLAGE, [0, 0, 0], 1);
    W.field = buildSet(r, FIELD, C0.FIELD_ORIGIN, 2);
    W.yard = buildSet(r, YARD, C0.YARD_ORIGIN, 3);
    W.dome = K.mesh(r, b => {
      const nu = 32, nv = 12, e0 = -0.3, e1 = PI / 2, R = 400;
      for (let j = 0; j < nv; j++) {
        for (let i = 0; i < nu; i++) {
          const P = (u, v) => { const az = u * PI * 2, el = e0 + (e1 - e0) * v; return [S(az) * C(el) * R, S(el) * R, -C(az) * C(el) * R]; };
          const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
          const n = [0, -1, 0];
          const vv = (v) => Math.min(0.995, Math.max(0.005, 0.1 + (e0 + (e1 - e0) * v) * 0.9));
          b.quad(P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1), [1, 1, 1, 1], [[u0 * 2, vv(v0)], [u1 * 2, vv(v0)], [u1 * 2, vv(v1)], [u0 * 2, vv(v1)]], [n, n, n, n]);
        }
      }
    });
    W.barrel = K.mesh(r, b => barrel(b));
    W.cistern = K.mesh(r, b => cistern(b));
    W.btr = K.mesh(r, b => btr(b));
    W.car = K.mesh(r, b => car(b));
    W.heli = K.mesh(r, b => heli(b));
    return W;
  }

  function drawSet(r, T, W, set, cam, t) {
    r.draw(W.dome, M4.translate(cam.eye[0], 0, cam.eye[2]), { texture: T.sky, noFog: true });
    drawBatch(r, T, W[set]);
    if (set === 'village') {
      const L = VILLAGE;
      const cs = t < 1.7 ? L.cisternFar : L.cistern;
      r.draw(W.cistern, M4.chain(M4.translate(cs.x, 0, cs.z), M4.rotY(cs.rot)), { texture: T.cistern });
      const bar = t < 20 ? L.barrelA : L.barrelB;
      r.draw(W.barrel, M4.translate(bar.x, 0, bar.z));
      L.wrecks.forEach(([x, z, rr, tex]) => r.draw(W.car, M4.chain(M4.translate(x, 0, z), M4.rotY(rr)), { texture: T[tex] }));
      L.helis.forEach(h => r.draw(W.heli, M4.chain(M4.translate(h.x, h.lift, h.z), M4.rotY(h.rot), M4.rotX(h.tilt)), { texture: T.camo }));
    } else if (set === 'yard') {
      const o = window.ParadCam.YARD_ORIGIN;
      YARD.wrecks.forEach(([x, z, rr, tex]) => r.draw(W.car, M4.chain(M4.translate(o[0] + x, 0, o[2] + z), M4.rotY(rr)), { texture: T[tex] }));
      YARD.statics.forEach(q => {
        if (q.kind === 'cistern') r.draw(W.cistern, M4.chain(M4.translate(o[0] + q.x, 0, o[2] + q.z), M4.rotY(q.rot)), { texture: T.cistern });
      });
    }
  }

  function barrelPos(set, t) {
    if (set === 'village') return t < 20 ? VILLAGE.barrelA : VILLAGE.barrelB;
    if (set === 'yard') { const o = window.ParadCam.YARD_ORIGIN; return { x: o[0] + YARD.barrel.x, z: o[2] + YARD.barrel.z }; }
    return null;
  }

  window.ParadWorld = { VILLAGE, FIELD, YARD, build, drawSet, drawBatch, barrelPos, box, wheel, btr, car, house, Batch, wallQuad, gableTri, shed, fence, wireFence, cross, poplar, oak, deadTree, bush, tufts, pole, wires, road, ground, hills, planksLying, stake, crate, barrel, cistern, bus, heli };
})();
