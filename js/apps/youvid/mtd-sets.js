(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Art = window.DemoArt;

  const N = { up: [0, 1, 0], dn: [0, -1, 0], px: [1, 0, 0], nx: [-1, 0, 0], pz: [0, 0, 1], nz: [0, 0, -1] };

  function face(b, a, c, d, e, n, uv, col) {
    b.quad(a, c, d, e, col === undefined ? 0xffffff : col, uv, [n, n, n, n]);
  }

  function slab(b, x0, y0, z0, x1, y1, z1, k, col, skip) {
    const s = skip || {};
    const u = (w, h) => [[0, 0], [w * k, 0], [w * k, h * k], [0, h * k]];
    const w = x1 - x0, h = y1 - y0, d = z1 - z0;
    if (!s.front) face(b, [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], N.pz, u(w, h), col);
    if (!s.back) face(b, [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], N.nz, u(w, h), col);
    if (!s.right) face(b, [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], N.px, u(d, h), col);
    if (!s.left) face(b, [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], N.nx, u(d, h), col);
    if (!s.top) face(b, [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], N.up, u(w, d), col);
    if (!s.bottom) face(b, [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], N.dn, u(w, d), col);
  }

  function ground(b, x0, z0, x1, z1, y, k) {
    face(b, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], N.up, [[x0 * k, z1 * k], [x1 * k, z1 * k], [x1 * k, z0 * k], [x0 * k, z0 * k]]);
  }

  function wall(b, p0, p1, y0, y1, k, holes, inward) {
    const dx = p1[0] - p0[0], dz = p1[1] - p0[1];
    const L = Math.hypot(dx, dz);
    let n = [dz / L, 0, -dx / L];
    if (inward) n = V3.mul(n, -1);
    const at = (u, y) => [p0[0] + dx * (u / L), y, p0[1] + dz * (u / L)];
    const quad = (u0, u1, v0, v1) => {
      if (u1 - u0 < 1e-4 || v1 - v0 < 1e-4) return;
      const uv = [[u0 * k, v0 * k], [u1 * k, v0 * k], [u1 * k, v1 * k], [u0 * k, v1 * k]];
      if (inward) b.quad(at(u1, v0), at(u0, v0), at(u0, v1), at(u1, v1), 0xffffff, [uv[1], uv[0], uv[3], uv[2]], [n, n, n, n]);
      else b.quad(at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1), 0xffffff, uv, [n, n, n, n]);
    };
    const hs = (holes || []).slice().sort((a, c) => a[0] - c[0]);
    let u = 0;
    hs.forEach(([u0, u1, v0, v1]) => {
      quad(u, u0, y0, y1);
      quad(u0, u1, y0, v0);
      quad(u0, u1, v1, y1);
      u = u1;
    });
    quad(u, L, y0, y1);
  }

  function roofGable(b, x, z, w, d, h, rh, yaw, k) {
    b.push(M4.translate(x, 0, z), M4.rotY(yaw || 0));
    const p = (sx, sz, y) => [sx * (w / 2 + 0.3), y, sz * (d / 2 + 0.3)];
    const nA = V3.norm([0, d / 2, rh]), nB = V3.norm([0, d / 2, -rh]);
    const L = Math.hypot(d / 2 + 0.3, rh);
    const uv = [[0, 0], [(w + 0.6) * k, 0], [(w + 0.6) * k, L * k], [0, L * k]];
    b.quad(p(-1, 1, h - 0.1), p(1, 1, h - 0.1), [w / 2 + 0.3, h + rh, 0], [-w / 2 - 0.3, h + rh, 0], 0xffffff, uv, [nA, nA, nA, nA]);
    b.quad(p(1, -1, h - 0.1), p(-1, -1, h - 0.1), [-w / 2 - 0.3, h + rh, 0], [w / 2 + 0.3, h + rh, 0], 0xffffff, uv, [nB, nB, nB, nB]);
    b.pop();
  }

  function shedWalls(b, x, z, w, d, h, rh, yaw, k, holes) {
    b.push(M4.translate(x, 0, z), M4.rotY(yaw || 0));
    const H = holes || {};
    wall(b, [-w / 2, d / 2], [w / 2, d / 2], 0, h, k, H.front);
    wall(b, [w / 2, -d / 2], [-w / 2, -d / 2], 0, h, k, H.back);
    wall(b, [w / 2, d / 2], [w / 2, -d / 2], 0, h, k, H.right);
    wall(b, [-w / 2, -d / 2], [-w / 2, d / 2], 0, h, k, H.left);
    if (rh > 0) {
      [-1, 1].forEach(s => {
        const xx = s * w / 2;
        const n = [s, 0, 0];
        const a = [xx, h, s > 0 ? d / 2 : -d / 2], c = [xx, h, s > 0 ? -d / 2 : d / 2], top = [xx, h + rh, 0];
        b.tri(a, c, top, 0xffffff, [[0, h * k], [d * k, h * k], [d * k / 2, (h + rh) * k]], [n, n, n]);
      });
    }
    b.pop();
  }

  function trim(b, x, z, w, d, h, yaw, col) {
    b.push(M4.translate(x, 0, z), M4.rotY(yaw || 0));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => b.at(sx * w / 2, h / 2, sz * d / 2, q => q.box(0.16, h, 0.16, col)));
    b.at(0, h, d / 2, q => q.box(w + 0.16, 0.16, 0.16, col));
    b.at(0, h, -d / 2, q => q.box(w + 0.16, 0.16, 0.16, col));
    b.pop();
  }

  function fence(b, a, c, h, col, rails) {
    const d = V3.sub([c[0], 0, c[1]], [a[0], 0, a[1]]);
    const L = V3.len(d);
    const yaw = Math.atan2(d[0], d[2]);
    const n = Math.max(1, Math.round(L / 2.2));
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      b.at(a[0] + d[0] * f, h / 2, a[1] + d[2] * f, q => q.box(0.12, h, 0.12, col));
    }
    b.push(M4.translate((a[0] + c[0]) / 2, 0, (a[1] + c[1]) / 2), M4.rotY(yaw));
    (rails || [0.3, 0.7, 0.95]).forEach(f => b.at(0, h * f, 0, q => q.box(0.06, 0.12, L, col)));
    b.pop();
  }

  function boards(b, a, c, h, k) {
    wall(b, a, c, 0, h, k);
    wall(b, c, a, 0, h, k);
  }

  function chainFence(post, mesh, a, c, h) {
    const d = [c[0] - a[0], c[1] - a[1]];
    const L = Math.hypot(d[0], d[1]);
    const n = Math.max(1, Math.round(L / 2.5));
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      post.at(a[0] + d[0] * f, h / 2, a[1] + d[1] * f, q => q.prism(8, 0.04, 0.04, -h / 2, 0.04, 0.04, h / 2, 0x6a6c6e));
    }
    post.push(M4.translate((a[0] + c[0]) / 2, h, (a[1] + c[1]) / 2), M4.rotY(Math.atan2(d[0], d[1])), M4.rotX(PI / 2));
    post.prism(8, 0.025, 0.025, -L / 2, 0.025, 0.025, L / 2, 0x6a6c6e);
    post.pop();
    wall(mesh, a, c, 0.05, h, 0.8);
  }

  function pole(b, x, z, h, col) {
    b.at(x, 0, z, q => q.prism(8, 0.13, 0.13, 0, 0.1, 0.1, h, col || 0x4a3a2e));
    b.at(x, h - 0.5, z, q => q.box(1.8, 0.12, 0.12, col || 0x4a3a2e));
  }

  function wires(b, poles, h) {
    for (let i = 0; i < poles.length - 1; i++) {
      [-0.8, 0, 0.8].forEach(o => {
        const a = [poles[i][0] + o, h - 0.44, poles[i][1]], c = [poles[i + 1][0] + o, h - 0.44, poles[i + 1][1]];
        const pts = [];
        for (let k = 0; k <= 10; k++) {
          const f = k / 10;
          const p = V3.lerp(a, c, f);
          p[1] -= S(f * PI) * 0.7;
          pts.push(p);
        }
        K.tube(b, pts, pts.map(() => 0.018), 4, 0x1e1c1a);
      });
    }
  }

  function tower(b, x, z, h, s) {
    const k = s || 1;
    const legs = (y) => {
      const r = lerp(2.2, 0.5, y / h) * k;
      return [[r, r], [-r, r], [-r, -r], [r, -r]].map(([lx, lz]) => [x + lx, y, z + lz]);
    };
    const seg = 10;
    for (let i = 0; i < seg; i++) {
      const y0 = (i / seg) * h, y1 = ((i + 1) / seg) * h;
      const col = i % 2 ? 0xe8e4dc : 0xc8322a;
      const A = legs(y0), B = legs(y1);
      for (let j = 0; j < 4; j++) {
        K.tube(b, [A[j], B[j]], [0.09 * k, 0.08 * k], 5, col);
        K.tube(b, [A[j], B[(j + 1) % 4]], [0.035 * k, 0.035 * k], 4, col);
        K.tube(b, [B[j], B[(j + 1) % 4]], [0.04 * k, 0.04 * k], 4, col);
      }
    }
    const top = legs(h);
    [0, 1, 2].forEach(i => {
      const y = h * (0.62 + i * 0.12);
      const p = legs(y)[i % 4];
      b.push(M4.translate(p[0], y, p[2]), M4.rotY(i * 1.9 + 0.6), M4.rotX(-PI / 2 + 0.2));
      b.prism(14, 0.7 * k, 0.7 * k, 0, 0.12 * k, 0.12 * k, 0.35 * k, 0xd8d6d0, { capTop: false });
      b.pop();
    });
    b.at(x, h + 0.6 * k, z, q => q.prism(6, 0.06 * k, 0.06 * k, -0.6 * k, 0.03 * k, 0.03 * k, 1.4 * k, 0xc8322a));
    top.forEach(p => b.at(p[0], p[1] + 0.05, p[2], q => q.ellipsoid(0.1 * k, 0.1 * k, 0.1 * k, 6, 4, rgb(0xff4030, 0.8))));
  }

  function waterTower(b, x, z, h) {
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => K.tube(b, [[x + sx * 1.6, 0, z + sz * 1.6], [x + sx * 1.1, h, z + sz * 1.1]], [0.12, 0.1], 6, 0x4a3a2e));
    b.at(x, h, z, q => q.prism(16, 1.8, 1.8, 0, 1.8, 1.8, 2.6, 0x6a5444, { capBottom: true }));
    b.at(x, h + 2.6, z, q => q.prism(16, 1.9, 1.9, 0, 0.2, 0.2, 1.0, 0x4a3a32));
  }

  function lump(b, cx, cy, cz, rx, ry, rz, seed, col, k) {
    const g = rand(seed);
    const seg = 22, rings = 14;
    const bumps = [];
    for (let i = 0; i < 16; i++) bumps.push({ d: V3.norm([g() - 0.5, g() - 0.4, g() - 0.5]), a: (g() < 0.3 ? -0.08 : 0.06) + g() * 0.14, w: 0.25 + g() * 0.5 });
    const pt = (i, j) => {
      const th = (j / rings) * PI, ph = (i / seg) * PI * 2;
      const n = [S(th) * S(ph), C(th), S(th) * C(ph)];
      let f = 1;
      bumps.forEach(q => { f += q.a * Math.exp(-(1 - V3.dot(n, q.d)) / (q.w * 0.3)); });
      const strata = 1 + 0.03 * S(n[1] * 18 + seed);
      const p = [cx + n[0] * rx * f * strata, cy + n[1] * ry * f, cz + n[2] * rz * f * strata];
      return { p: [p[0], Math.max(p[1], cy - ry * 0.7), p[2]], n: V3.norm([n[0] / rx, n[1] / ry, n[2] / rz]) };
    };
    for (let j = 0; j < rings; j++) {
      for (let i = 0; i < seg; i++) {
        const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
        const uv = q.map(v => [(v.p[0] + v.p[2]) * (k || 0.3), v.p[1] * (k || 0.3)]);
        let fn = V3.cross(V3.sub(q[3].p, q[0].p), V3.sub(q[1].p, q[0].p));
        fn = V3.len(fn) < 1e-9 ? q[0].n : V3.norm(fn);
        if (V3.dot(fn, q[0].n) < 0) fn = V3.mul(fn, -1);
        const nn = V3.norm(V3.add(V3.mul(fn, 0.75), V3.mul(q[0].n, 0.25)));
        b.quad(q[0].p, q[3].p, q[2].p, q[1].p, col || 0xffffff, [uv[0], uv[3], uv[2], uv[1]], [nn, nn, nn, nn]);
      }
    }
  }

  function cliff(b, pts, hgt, seed, k) {
    const g = rand(seed);
    const n = pts.length;
    const rows = 7;
    const noise = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j <= rows; j++) row.push((g() - 0.5) * 1.6);
      noise.push(row);
    }
    const at = (i, j) => {
      const p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)];
      const t = V3.norm([q[0] - o[0], 0, q[1] - o[1]]);
      const nrm = [t[2], 0, -t[0]];
      const f = j / rows;
      const h = (Array.isArray(hgt) ? hgt[i] : hgt) * (f < 0.9 ? f / 0.9 : 1);
      const back = f < 0.9 ? -f * 2.5 : -2.25 - (f - 0.9) * 40;
      const wob = noise[i][j] * (f < 0.9 ? 1 : 0.2) + S(f * 9 + i) * 0.4;
      return [p[0] - nrm[0] * (back + wob), h + (f >= 0.9 ? 0.4 * S(i * 1.7) : 0), p[1] - nrm[2] * (back + wob)];
    };
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < rows; j++) {
        const a = at(i, j), c = at(i + 1, j), d = at(i + 1, j + 1), e = at(i, j + 1);
        const nn = V3.norm(V3.cross(V3.sub(c, a), V3.sub(e, a)));
        const uv = [a, c, d, e].map(p => [(p[0] + p[2]) * (k || 0.12), p[1] * (k || 0.12)]);
        b.quad(a, e, d, c, 0xffffff, [uv[0], uv[3], uv[2], uv[1]], [nn, nn, nn, nn]);
      }
    }
  }

  function signQuad(b, x, y, z, w, h, yaw) {
    b.push(M4.translate(x, y, z), M4.rotY(yaw || 0));
    face(b, [-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0], N.pz, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    b.pop();
  }

  function skyDome(b, R) {
    const n = 32, rows = 10;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < n; i++) {
        const pt = (ii, jj) => {
          const a = (ii / n) * PI * 2, e = (jj / rows) * PI / 2 - 0.15;
          return [S(a) * C(e) * R, S(e) * R, C(a) * C(e) * R];
        };
        const uv = (ii, jj) => [(ii / n) * 3, 1 - jj / rows];
        b.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), rgb(0xffffff, 1), [uv(i, j), uv(i + 1, j), uv(i + 1, j + 1), uv(i, j + 1)]);
      }
    }
  }

  function group() {
    const B = {};
    const get = (k) => (B[k] = B[k] || new window.P3D.Builder());
    return { get, B };
  }

  function finish(r, G) {
    const out = {};
    Object.keys(G.B).forEach(k => { out[k] = r.mesh(G.B[k]); });
    return out;
  }

  function buildShed(r) {
    const G = group();
    const cc = G.get('concrete'), dk = G.get('darkWood'), plain = G.get('plain'), fr = G.get('fragile'), rs = G.get('redShed'), cr = G.get('crateWood');
    ground(cc, -4, -4, 4, 4, 0, 0.5);
    wall(dk, [-3, -1.4], [3, -1.4], 0, 3.2, 0.6);
    wall(dk, [2.2, 2.5], [2.2, -1.4], 0, 3.2, 0.6);
    wall(dk, [-2.2, -1.4], [-2.2, 2.5], 0, 3.2, 0.6);
    [0.95, 1.6, 2.25].forEach(y => plain.at(0, y, -1.18, q => q.box(4.2, 0.05, 0.45, 0x3a2a20)));
    [-2.0, 2.0].forEach(x => plain.at(x, 1.6, -1.18, q => q.box(0.06, 3.2, 0.45, 0x2e2018)));
    const g = rand(801);
    [0.98, 1.63, 2.28].forEach((y, row) => {
      let x = -1.95;
      while (x < 1.8) {
        const w = 0.3 + g() * 0.35, h = 0.2 + g() * 0.32, d = 0.3 + g() * 0.1;
        const kind = g();
        const B = kind < 0.3 ? fr : kind < 0.55 ? cr : plain;
        if (B === plain) B.at(x + w / 2, y + h / 2, -1.2, q => q.box(w, h, d, [0x6a5440, 0x5a4636, 0x7a6448][Math.floor(g() * 3)]));
        else slab(B, x, y, -1.2 - d / 2, x + w, y + h, -1.2 + d / 2, B === fr ? 1 / Math.max(w, h) : 1.6);
        x += w + 0.04 + g() * 0.1;
      }
    });
    slab(rs, 1.0, 0, -0.9, 2.0, 1.0, 0.1, 1);
    slab(rs, 1.05, 1.0, -0.85, 1.95, 1.9, 0.05, 1.1);
    slab(cr, -1.9, 0, -0.9, -1.1, 0.7, -0.1, 1.4);
    plain.at(-1.75, 0.55, 0.45, q => q.box(0.5, 1.1, 0.5, 0xa8302a));
    plain.at(-1.75, 1.12, 0.45, q => q.box(0.54, 0.04, 0.54, 0x6a1e1a));
    plain.at(1.65, 0.45, 0.9, q => q.prism(16, 0.32, 0.32, -0.45, 0.32, 0.32, 0.45, 0x5a4232));
    [-0.3, 0, 0.3].forEach(y => plain.at(1.65, 0.45 + y, 0.9, q => q.prism(16, 0.335, 0.335, -0.02, 0.335, 0.335, 0.02, 0x2a2420)));
    plain.at(-1.55, 1.15, -0.55, q => q.box(0.34, 0.3, 0.28, 0x6a5444));
    K.tube(plain, [[-1.55, 1.3, -0.55], [-1.55, 1.58, -0.55]], [0.012, 0.012], 6, 0x6a6c6a);
    K.tube(plain, [[-1.7, 1.58, -0.55], [-1.4, 1.58, -0.55]], [0.02, 0.02], 6, 0x5a3a24);
    plain.at(0, 0.3, -0.05, q => q.prism(14, 0.2, 0.2, -0.3, 0.2, 0.2, 0.3, 0x2e2420));
    return finish(r, G);
  }

  const BUNKER = { ow: 1.1, oh: 2.4, depth: 16, inner: -6.5 };

  function buildBunker(r) {
    const G = group();
    const cc = G.get('concrete'), gr = G.get('gravel'), plain = G.get('plain'), glow = G.get('glowWall');
    const { ow, oh, depth } = BUNKER;
    ground(gr, -14, 0, 14, 22, 0, 0.4);
    ground(G.get('concreteIn'), -ow, -depth, ow, 0, 0.002, 0.6);
    wall(cc, [-6, 0], [-ow, 0], 0, 5, 0.4);
    wall(cc, [ow, 0], [6, 0], 0, 5, 0.4);
    wall(cc, [-ow, 0], [ow, 0], oh, 5, 0.4);
    slab(cc, -6.6, 0, -1.4, -6, 5, 6, 0.4);
    slab(cc, 6, 0, -1.4, 6.6, 5, 4, 0.4);
    slab(cc, -6.3, 5, -1.4, 6.3, 5.5, 0.3, 0.4);
    const ci = G.get('concreteIn');
    wall(ci, [-ow, -depth], [-ow, 0], 0, oh, 0.5, null, true);
    wall(ci, [ow, 0], [ow, -depth], 0, oh, 0.5, null, true);
    face(ci, [-ow, oh, -depth], [ow, oh, -depth], [ow, oh, 0], [-ow, oh, 0], N.dn, [[0, 0], [1, 0], [1, 8], [0, 8]]);
    const fz = BUNKER.inner;
    wall(ci, [-ow, fz], [-0.75, fz], 0, oh, 0.5);
    wall(ci, [0.75, fz], [ow, fz], 0, oh, 0.5);
    wall(ci, [-0.75, fz], [0.75, fz], 2.0, oh, 0.5);
    face(glow, [-ow, 0, -depth + 0.01], [ow, 0, -depth + 0.01], [ow, oh, -depth + 0.01], [-ow, oh, -depth + 0.01], N.pz, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    [-1, 1].forEach(s => plain.at(s * (ow + 0.06), oh / 2, 0.04, q => q.box(0.12, oh + 0.1, 0.12, 0x6c6a64)));
    plain.at(0, oh + 0.06, 0.04, q => q.box(ow * 2 + 0.24, 0.12, 0.12, 0x6c6a64));
    return finish(r, G);
  }

  const ROOM = { x0: -3, x1: 3, z0: -3, z1: 3, h: 3.1, door: [-0.9, 0.9, 2.25], hatch: [-2.1, -0.9, -2.1, -0.9] };

  function buildRoom(r) {
    const G = group();
    const cc = G.get('concrete'), gr = G.get('gravel'), plain = G.get('plain'), tin = G.get('tin'), wd = G.get('planks'), rust = G.get('rust'), rk = G.get('rock'), warn = G.get('warning'), dk = G.get('darkWood');
    const R = ROOM;
    ground(cc, R.x0, R.z0, R.x1, R.z1, 0, 0.5);
    wall(cc, [R.x0, R.z0], [R.x1, R.z0], 0, R.h, 0.5, null, true);
    wall(cc, [R.x1, R.z0], [R.x1, R.z1], 0, R.h, 0.5, null, true);
    wall(cc, [R.x0, R.z1], [R.x0, R.z0], 0, R.h, 0.5, null, true);
    wall(cc, [R.x1, R.z1], [R.x0, R.z1], 0, R.h, 0.5, [[R.x1 - R.door[1], R.x1 - R.door[0], 0, R.door[2]]], true);
    const [hx0, hx1, hz0, hz1] = R.hatch;
    const ceil = (x0, x1, z0, z1) => face(cc, [x0, R.h, z0], [x1, R.h, z0], [x1, R.h, z1], [x0, R.h, z1], N.dn, [[x0 * 0.5, z0 * 0.5], [x1 * 0.5, z0 * 0.5], [x1 * 0.5, z1 * 0.5], [x0 * 0.5, z1 * 0.5]]);
    ceil(R.x0, hx0, R.z0, R.z1);
    ceil(hx1, R.x1, R.z0, R.z1);
    ceil(hx0, hx1, R.z0, hz0);
    ceil(hx0, hx1, hz1, R.z1);
    wall(cc, [hx0, hz0], [hx1, hz0], R.h, R.h + 1.2, 0.5, null, true);
    wall(cc, [hx1, hz0], [hx1, hz1], R.h, R.h + 1.2, 0.5, null, true);
    wall(cc, [hx1, hz1], [hx0, hz1], R.h, R.h + 1.2, 0.5, null, true);
    wall(cc, [hx0, hz1], [hx0, hz0], R.h, R.h + 1.2, 0.5, null, true);
    slab(cc, R.x0 - 0.3, R.h, R.z0 - 0.3, R.x1 + 0.3, R.h + 1.2, R.z1 + 0.3, 0.5, { bottom: true, top: true });
    signQuad(warn, 1.35, 2.15, R.z0 + 0.02, 0.9, 0.56, 0);
    plain.at(-2.6, 0.5, -2.4, q => q.box(0.7, 1.0, 0.7, 0x5a4a3a));
    plain.at(2.5, 0.35, -2.5, q => q.prism(14, 0.32, 0.32, -0.35, 0.32, 0.32, 0.4, 0x6a3428));
    K.tube(plain, [[R.x0 + 0.1, 2.7, R.z0 + 0.1], [R.x1 - 0.1, 2.7, R.z0 + 0.1]], [0.06, 0.06], 8, 0x5a5c5e);
    K.tube(plain, [[R.x1 - 0.1, 2.7, R.z0 + 0.1], [R.x1 - 0.1, 2.7, R.z1 - 0.1]], [0.06, 0.06], 8, 0x5a5c5e);
    ground(gr, -30, R.z1, 30, 60, 0, 0.4);
    ground(gr, -30, -30, -3.2, R.z1, 0, 0.4);
    ground(gr, 3.2, -30, 30, R.z1, 0, 0.4);
    slab(cc, R.x0 - 0.3, 0, R.z0 - 0.3, R.x0, R.h + 1.2, R.z1 + 0.3, 0.5, { right: true });
    slab(cc, R.x1, 0, R.z0 - 0.3, R.x1 + 0.3, R.h + 1.2, R.z1 + 0.3, 0.5, { left: true });
    wall(cc, [R.x0 - 0.3, R.z1 + 0.3], [R.x1 + 0.3, R.z1 + 0.3], 0, R.h + 1.2, 0.5, [[R.door[0] - R.x0 + 0.3, R.door[1] - R.x0 + 0.3, 0, R.door[2]]]);
    [R.door[0], R.door[1]].forEach((x, i) => wall(cc, [x, i ? R.z1 + 0.3 : R.z1], [x, i ? R.z1 : R.z1 + 0.3], 0, R.door[2], 0.5));
    face(cc, [R.door[0], R.door[2], R.z1], [R.door[1], R.door[2], R.z1], [R.door[1], R.door[2], R.z1 + 0.3], [R.door[0], R.door[2], R.z1 + 0.3], N.dn, [[0, 0], [1, 0], [1, 0.2], [0, 0.2]]);
    fence(dk, [-12, 9.5], [12, 9.5], 1.6, 0x5a4636, [0.25, 0.55, 0.85]);
    boards(wd, [-12, 9.6], [12, 9.6], 1.5, 0.5);
    shedWalls(tin, -2, 19, 14, 7, 5.5, 2.2, 0, 0.35, { front: [[3, 4.6, 0, 2.4], [8.5, 10.5, 1.5, 3]] });
    roofGable(rust, -2, 19, 14, 7, 5.5, 2.2, 0, 0.35);
    trim(plain, -2, 19, 14, 7, 5.5, 0, 0x4a3a2e);
    shedWalls(wd, 14, 22, 8, 6, 4.2, 1.5, 0.2, 0.5);
    roofGable(rust, 14, 22, 8, 6, 4.2, 1.5, 0.2, 0.35);
    cliff(rk, [[50, 46], [35, 42], [20, 45], [5, 41], [-10, 44], [-25, 40], [-40, 42]], [16, 20, 17, 19, 15, 18, 16], 821, 0.1);
    return finish(r, G);
  }

  function buildRock(r) {
    const G = group();
    const rk = G.get('rock'), gr = G.get('gravel'), dk = G.get('darkWood'), wd = G.get('planks'), tin = G.get('tin'), rust = G.get('rust'), plain = G.get('plain'), towerB = G.get('tower');
    ground(gr, -60, -60, 60, 60, 0, 0.4);
    lump(rk, 0, 1.2, 0, 2.2, 1.9, 1.7, 831);
    lump(rk, -2.6, 2.0, -0.6, 2.0, 2.6, 1.8, 832);
    lump(rk, -5.2, 3.0, -1.4, 2.6, 3.6, 2.4, 833);
    lump(rk, 4.6, 0.5, -1.8, 1.0, 0.8, 0.9, 834);
    fence(dk, [3, -6], [16, -6], 1.4, 0x5a4636);
    boards(wd, [3, -6.05], [16, -6.05], 1.3, 0.5);
    fence(dk, [3, 8], [16, 8], 1.4, 0x5a4636);
    shedWalls(tin, 14, -14, 9, 6, 4.5, 0, 0.1, 0.35);
    slab(plain, 9.2, 4.5, -17.4, 18.8, 4.7, -10.6, 0.3);
    roofGable(rust, 24, -8, 7, 5, 3.6, 1.4, -0.3, 0.35);
    shedWalls(wd, 24, -8, 7, 5, 3.6, 1.4, -0.3, 0.5);
    K.tube(plain, [[-0.6, 0, 3.6], [-0.6, 2.4, 3.6]], [0.04, 0.04], 6, 0x1e1c1a);
    K.tube(plain, [[-0.1, 0, 3.6], [-0.1, 2.4, 3.6]], [0.04, 0.04], 6, 0x1e1c1a);
    for (let i = 0; i < 6; i++) K.tube(plain, [[-0.6, 0.3 + i * 0.36, 3.6], [-0.1, 0.3 + i * 0.36, 3.6]], [0.025, 0.025], 5, 0x1e1c1a);
    tower(towerB, -18, -36, 26, 1);
    cliff(rk, [[-60, -30], [-45, -36], [-30, -40], [-12, -44], [5, -42], [22, -46], [40, -40]], [14, 18, 16, 20, 17, 19, 15], 835, 0.1);
    cliff(rk, [[40, 30], [20, 40], [0, 42], [-20, 40], [-40, 34]], [12, 16, 14, 15, 13], 836, 0.1);
    return finish(r, G);
  }

  function buildYard(r) {
    const G = group();
    const gr = G.get('gravel'), tin = G.get('tin'), rust = G.get('rust'), wd = G.get('planks'), dk = G.get('darkWood'), plain = G.get('plain'), rk = G.get('rock'), dg = G.get('danger'), win = G.get('window'), cc = G.get('concrete');
    ground(gr, -60, -60, 60, 60, 0, 0.4);
    shedWalls(tin, 6, -14, 16, 9, 6.5, 2.6, 0.05, 0.3, { front: [[2.5, 4.5, 2.5, 4.2], [9, 11, 2.5, 4.2], [12.5, 14.5, 0, 3.2]] });
    roofGable(rust, 6, -14, 16, 9, 6.5, 2.6, 0.05, 0.3);
    trim(plain, 6, -14, 16, 9, 6.5, 0.05, 0x46382c);
    [[-0.5, 3.4], [6.5, 3.4]].forEach(([x, y]) => signQuad(win, x - 1.5 + 6, y, -9.5 + 0.02, 2.0, 1.7, 0.05));
    slab(wd, 10.5, 0, -9.4, 16.5, 1.1, -6.8, 0.5);
    for (let i = 0; i < 4; i++) slab(wd, 9.7 - i * 0.28, 0, -8.6, 10.5, 1.1 - i * 0.28, -7.4, 0.5);
    K.tube(plain, [[10.5, 2.1, -6.8], [16.5, 2.1, -6.8]], [0.04, 0.04], 6, 0x3a3634);
    [10.5, 12.5, 14.5, 16.5].forEach(x => K.tube(plain, [[x, 1.1, -6.8], [x, 2.1, -6.8]], [0.04, 0.04], 6, 0x3a3634));
    shedWalls(wd, -12, -18, 8, 7, 4.8, 1.8, 0.35, 0.5);
    roofGable(rust, -12, -18, 8, 7, 4.8, 1.8, 0.35, 0.3);
    plain.at(-4, 0, -28, q => q.prism(20, 3.2, 3.2, 0, 3.2, 3.2, 14, 0x8a8c8a));
    plain.at(-4, 14, -28, q => q.ellipsoid(3.25, 1.4, 3.25, 20, 6, 0x6a6c6a));
    [[-20, -6], [-6, -4], [8, -2], [22, 0]].forEach(([x, z]) => pole(plain, x, z, 9));
    wires(plain, [[-20, -6], [-6, -4], [8, -2], [22, 0]], 9);
    shedWalls(tin, 30, 4, 10, 8, 5.5, 2, -1.3, 0.3, { front: [[3.5, 5.5, 0, 2.6]] });
    roofGable(rust, 30, 4, 10, 8, 5.5, 2, -1.3, 0.3);
    signQuad(dg, 25.62, 2.0, 3.445, 1.3, 0.98, -1.3);
    slab(wd, 18, 0, 6, 26, 0.9, 12, 0.5);
    cliff(rk, [[-60, -40], [-40, -46], [-20, -48], [0, -50], [20, -46], [40, -44], [60, -40]], [16, 20, 18, 22, 19, 21, 17], 841, 0.1);
    cliff(rk, [[60, 30], [40, 40], [20, 44], [0, 40]], [14, 16, 15, 14], 842, 0.1);
    return finish(r, G);
  }

  const SENTRY = { at: [0, 0, 0] };

  function buildSentryArea(r) {
    const G = group();
    const gr = G.get('gravel'), rk = G.get('rock'), wd = G.get('planks'), dk = G.get('darkWood'), plain = G.get('plain'), tin = G.get('tin'), rust = G.get('rust'), chain = G.get('chain'), cc = G.get('concrete'), sc = G.get('signC'), hz = G.get('hazard');
    ground(gr, -60, -60, 60, 60, 0, 0.4);
    cliff(rk, [[-30, -6], [-18, -4], [-8, -3.5], [2, -3], [10, -4], [20, -7], [34, -10]], [9, 11, 12, 13, 12, 10, 9], 851, 0.14);
    lump(rk, 3.5, 0.8, -1.6, 1.6, 1.4, 1.2, 852);
    shedWalls(wd, -9, 8, 6, 22, 4, 0, 0, 0.5);
    slab(plain, -12.2, 4, -3.2, -5.8, 4.2, 19.2, 0.3);
    chainFence(plain, chain, [-3.2, 3], [-3.2, 30], 2.4);
    chainFence(plain, chain, [5.5, 2], [5.5, 30], 2.4);
    K.tube(plain, [[4.6, 0, 7], [4.6, 4.2, 7]], [0.06, 0.05], 6, 0x2a2826);
    K.tube(plain, [[4.6, 4.2, 7], [3.9, 4.4, 7]], [0.04, 0.04], 6, 0x2a2826);
    plain.at(3.9, 4.3, 7, q => q.ellipsoid(0.16, 0.08, 0.16, 8, 4, rgb(0xf0e8c8, 0.6)));
    shedWalls(cc, 12, -1.5, 5, 4, 3.6, 0, 0, 0.5, { front: [[1.6, 3.4, 0, 2.3]] });
    slab(cc, 9.3, 3.6, -3.7, 14.7, 3.9, 0.7, 0.5);
    signQuad(sc, 12, 2.85, 0.53, 0.8, 0.8, 0);
    slab(dk, -2.8, 0, 2, -1.2, 1.1, 2.2, 0.5);
    K.tube(plain, [[-8, 1.0, -1.2], [-2.5, 1.0, -1.2]], [0.04, 0.04], 6, 0x3a3836);
    K.tube(plain, [[-8, 0.5, -1.2], [-2.5, 0.5, -1.2]], [0.04, 0.04], 6, 0x3a3836);
    for (let x = -8; x <= -2.5; x += 1.83) K.tube(plain, [[x, 0, -1.2], [x, 1.0, -1.2]], [0.04, 0.04], 6, 0x3a3836);
    waterTower(plain, 14, 26, 7);
    shedWalls(tin, -8, 34, 10, 6, 5, 1.8, 0, 0.3);
    roofGable(rust, -8, 34, 10, 6, 5, 1.8, 0, 0.3);
    slab(hz, -3.1, 0, 12, -3.05, 0.3, 18, 1);
    return finish(r, G);
  }

  function buildPointArea(r) {
    const G = group();
    const gr = G.get('gravel'), rk = G.get('rock'), wd = G.get('planks'), dk = G.get('darkWood'), plain = G.get('plain'), tin = G.get('tin'), rust = G.get('rust'), cc = G.get('concrete'), sb = G.get('signB'), sc = G.get('signC'), cap = G.get('capture'), win = G.get('window');
    ground(gr, -60, -60, 60, 60, 0, 0.4);
    shedWalls(tin, 0, -6, 12, 6, 5, 0, 0, 0.32, { front: [[2.0, 4.4, 1.2, 3.4], [8.0, 10, 0, 2.6]] });
    slab(cc, -6.2, 5, -9.2, 6.2, 5.3, -2.8, 0.5);
    signQuad(sb, 4.0, 3.2, -2.98, 1.3, 1.3, 0);
    signQuad(cap, 4.0, 1.8, -2.98, 1.8, 0.66, 0);
    signQuad(win, -2.8, 2.3, -2.98, 2.4, 2.2, 0);
    for (let i = 0; i < 4; i++) slab(cc, 1.5 + i * 0.0, 0, -2.9 + i * 0.32, 4.6, 0.6 - i * 0.15, -2.9 + (i + 1) * 0.32, 0.5);
    shedWalls(wd, -12, -4, 7, 8, 4.4, 1.6, 0.0, 0.5, { right: [[2.6, 4.6, 0, 2.5]] });
    roofGable(rust, -12, -4, 7, 8, 4.4, 1.6, 0.0, 0.3);
    shedWalls(tin, 14, -2, 8, 10, 6, 2.2, 0.0, 0.3);
    roofGable(rust, 14, -2, 8, 10, 6, 2.2, 0.0, 0.3);
    shedWalls(wd, 8, 18, 10, 6, 4, 1.6, 0.0, 0.5);
    roofGable(rust, 8, 18, 10, 6, 4, 1.6, 0.0, 0.3);
    shedWalls(cc, -14, 16, 6, 6, 5, 0, 0.0, 0.5, { right: [[2, 4, 0, 2.4]] });
    signQuad(sc, -10.98, 3.4, 16, 0.9, 0.9, PI / 2);
    waterTower(plain, -22, 4, 8);
    slab(wd, -4, 0, 6, -1.5, 1.2, 7.4, 0.5);
    slab(plain, 2, 0, 8, 3.2, 0.9, 9.2, 0.5);
    cliff(rk, [[-60, -26], [-40, -30], [-20, -32], [0, -30], [20, -34], [40, -30], [60, -28]], [14, 18, 16, 19, 17, 18, 15], 861, 0.1);
    cliff(rk, [[60, 40], [40, 44], [20, 46], [0, 44], [-20, 46], [-40, 42], [-60, 40]], [12, 15, 14, 16, 13, 15, 12], 862, 0.1);
    [[-30, 10], [-18, 12], [-6, 13]].forEach(([x, z]) => pole(plain, x, z, 9));
    wires(plain, [[-30, 10], [-18, 12], [-6, 13]], 9);
    return finish(r, G);
  }

  const HALLS = {
    stair: { x: 0, z: 0 },
    corridor: { x: 30, z: 0 },
    leap: { x: 60, z: 0 },
    window: { x: 90, z: 0 }
  };

  function buildInside(r) {
    const G = group();
    const cc = G.get('concrete'), plain = G.get('plain'), sc = G.get('signC'), cap = G.get('capture'), gr = G.get('gravel'), rk = G.get('rock'), tin = G.get('tin'), rust = G.get('rust'), wd = G.get('planks'), glow = G.get('glowWall'), warn = G.get('warning');
    const room = (x0, z0, x1, z1, h, holes, noCeil) => {
      ground(cc, x0, z0, x1, z1, 0, 0.5);
      wall(cc, [x0, z0], [x1, z0], 0, h, 0.5, holes && holes.n, true);
      wall(cc, [x1, z0], [x1, z1], 0, h, 0.5, holes && holes.e, true);
      wall(cc, [x1, z1], [x0, z1], 0, h, 0.5, holes && holes.s, true);
      wall(cc, [x0, z1], [x0, z0], 0, h, 0.5, holes && holes.w, true);
      if (!noCeil) face(cc, [x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1], N.dn, [[0, 0], [(x1 - x0) * 0.5, 0], [(x1 - x0) * 0.5, (z1 - z0) * 0.5], [0, (z1 - z0) * 0.5]]);
    };
    const s = HALLS.stair;
    room(s.x - 2, s.z - 12, s.x + 2, s.z + 2, 6.5, { n: [[1.0, 3.0, 3.0, 5.4]] });
    for (let i = 0; i < 12; i++) slab(cc, s.x - 1.6, 0, s.z - 2 - i * 0.6, s.x + 1.6, 0.25 + i * 0.25, s.z - 2 - (i + 1) * 0.6, 0.6);
    slab(cc, s.x - 1.8, 0, s.z - 12, s.x + 1.8, 3.0, s.z - 9.2, 0.5, { bottom: true });
    face(glow, [s.x - 1, 3.0, s.z - 12.02], [s.x + 1, 3.0, s.z - 12.02], [s.x + 1, 5.4, s.z - 12.02], [s.x - 1, 5.4, s.z - 12.02], N.pz, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    plain.at(s.x + 1.85, 4.6, s.z - 4, q => q.box(0.1, 0.4, 0.3, 0x4a4c4e));
    plain.at(s.x - 1.9, 5.8, s.z - 6, q => q.ellipsoid(0.12, 0.08, 0.12, 8, 4, rgb(0xf0e0c0, 0.8)));
    signQuad(warn, s.x - 1.97, 3.4, s.z - 5, 0.8, 0.5, PI / 2);
    const c = HALLS.corridor;
    room(c.x - 1.6, c.z - 16, c.x + 1.6, c.z + 2, 3.2);
    [0.4, 0.62, 0.84].forEach((y, i) => K.tube(plain, [[c.x - 1.45, 2.2 + y * 0.8, c.z - 16], [c.x - 1.45, 2.2 + y * 0.8, c.z + 2]], [0.07, 0.07], 8, [0x5e6062, 0x6e5a4a, 0x4e5052][i]));
    for (let z = -14; z < 2; z += 4) plain.at(c.x, 3.1, c.z + z, q => q.ellipsoid(0.16, 0.05, 0.16, 8, 4, rgb(0xf0e6cc, 0.8)));
    plain.at(c.x + 1.4, 0.6, c.z - 9, q => q.box(0.3, 1.2, 1.4, 0x5a5048));
    const l = HALLS.leap;
    room(l.x - 3, l.z - 8, l.x + 3, l.z + 3, 3.4, { n: [[2.2, 3.8, 0, 2.4]] });
    signQuad(sc, l.x - 1.5, 1.9, l.z - 7.97, 0.8, 0.8, 0);
    signQuad(cap, l.x + 1.6, 1.4, l.z - 7.97, 1.4, 0.5, 0);
    ground(gr, l.x - 6, l.z - 20, l.x + 6, l.z - 8.1, 0, 0.4);
    face(glow, [l.x - 0.8, 0, l.z - 12], [l.x + 0.8, 0, l.z - 12], [l.x + 0.8, 2.4, l.z - 12], [l.x - 0.8, 2.4, l.z - 12], N.pz, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const w = HALLS.window;
    room(w.x - 2, w.z - 4, w.x + 2, w.z + 4, 3.2, { n: [[0.6, 3.4, 1.0, 2.5]] });
    ground(gr, w.x - 40, w.z - 80, w.x + 40, w.z - 4.1, 0, 0.4);
    lump(rk, w.x - 6, 3, w.z - 18, 4, 6, 3, 871);
    lump(rk, w.x + 9, 4, w.z - 30, 6, 8, 4, 872);
    shedWalls(tin, w.x + 1, w.z - 26, 8, 5, 3.4, 0, 0, 0.3);
    slab(plain, w.x - 3.2, 3.4, w.z - 28.7, w.x + 5.2, 3.6, w.z - 23.3, 0.3);
    cliff(rk, [[w.x - 40, w.z - 46], [w.x - 20, w.z - 50], [w.x, w.z - 48], [w.x + 20, w.z - 52], [w.x + 40, w.z - 46]], [18, 22, 20, 23, 19], 873, 0.1);
    return finish(r, G);
  }

  const CDOOR = { w: 2.2, h: 2.6 };

  function buildCArea(r) {
    const G = group();
    const gr = G.get('gravel'), rk = G.get('rock'), cc = G.get('concrete'), plain = G.get('plain'), sc = G.get('signC'), cap = G.get('capture'), wd = G.get('planks'), tin = G.get('tin'), rust = G.get('rust');
    ground(gr, -60, -60, 60, 60, 0, 0.4);
    const W = 8, D = 8, H = 4.2;
    ground(cc, -W / 2, -D, W / 2, 0, 0.003, 0.5);
    wall(cc, [-W / 2, 0], [W / 2, 0], 0, H, 0.5, [[W / 2 - CDOOR.w / 2, W / 2 + CDOOR.w / 2, 0, CDOOR.h]]);
    wall(cc, [W / 2, -D], [-W / 2, -D], 0, H, 0.5);
    wall(cc, [W / 2, 0], [W / 2, -D], 0, H, 0.5);
    wall(cc, [-W / 2, -D], [-W / 2, 0], 0, H, 0.5);
    wall(cc, [-W / 2, -D], [W / 2, -D], 0, H, 0.5, null, true);
    wall(cc, [-W / 2, 0], [-W / 2, -D], 0, H, 0.5, null, true);
    wall(cc, [W / 2, -D], [W / 2, 0], 0, H, 0.5, null, true);
    wall(cc, [W / 2, -0.25], [-W / 2, -0.25], 0, H, 0.5, [[W / 2 - CDOOR.w / 2, W / 2 + CDOOR.w / 2, 0, CDOOR.h]], true);
    slab(cc, -W / 2 - 0.2, H, -D - 0.2, W / 2 + 0.2, H + 0.4, 0.2, 0.5);
    [-1, 1].forEach(s => slab(cc, s * CDOOR.w / 2 - (s > 0 ? 0 : 0.25), 0, -0.25, s * CDOOR.w / 2 + (s > 0 ? 0.25 : 0), CDOOR.h, 0, 0.6));
    signQuad(sc, -1.6, 2.4, -D + 0.03, 0.9, 0.9, 0);
    signQuad(cap, 1.2, 1.6, -D + 0.03, 1.5, 0.55, 0);
    plain.at(-2.8, 0.5, -6.6, q => q.box(1.0, 1.0, 1.0, 0x5a4a3a));
    lump(rk, -11, 4, -6, 5, 7, 4, 881);
    lump(rk, 12, 5, -10, 6, 9, 5, 882);
    shedWalls(wd, 16, 10, 5, 4, 3, 1.2, -0.6, 0.5);
    roofGable(rust, 16, 10, 5, 4, 3, 1.2, -0.6, 0.3);
    shedWalls(tin, -16, 12, 7, 5, 4, 1.4, 0.5, 0.3);
    roofGable(rust, -16, 12, 7, 5, 4, 1.4, 0.5, 0.3);
    cliff(rk, [[-60, -24], [-40, -28], [-20, -30], [0, -26], [20, -30], [40, -28], [60, -24]], [16, 19, 18, 20, 18, 19, 16], 883, 0.1);
    cliff(rk, [[60, 40], [30, 46], [0, 44], [-30, 46], [-60, 40]], [14, 16, 15, 17, 14], 884, 0.1);
    return finish(r, G);
  }

  function buildTower(r) {
    const G = group();
    const towerB = G.get('tower'), plain = G.get('plain'), tin = G.get('tin'), wd = G.get('planks');
    tower(towerB, -14, 32, 34, 1.2);
    const px = -10, pz = 8;
    [[0, 0], [5, 0], [0, 5], [5, 5]].forEach(([dx, dz]) => K.tube(plain, [[px + dx, 0, pz + dz], [px + dx, 9, pz + dz]], [0.12, 0.12], 6, 0x2e3032));
    [3, 6, 9].forEach(y => {
      [[0, 0, 5, 0], [5, 0, 5, 5], [5, 5, 0, 5], [0, 5, 0, 0]].forEach(([a, b0, c, d]) => {
        K.tube(plain, [[px + a, y, pz + b0], [px + c, y, pz + d]], [0.08, 0.08], 5, 0x2e3032);
        K.tube(plain, [[px + a, y - 3, pz + b0], [px + c, y, pz + d]], [0.05, 0.05], 4, 0x2e3032);
      });
    });
    slab(wd, px - 0.4, 9, pz - 0.4, px + 5.4, 9.3, pz + 5.4, 0.5);
    shedWalls(tin, px + 2.5, pz + 2.5, 5, 5, 3, 0, 0, 0.3);
    return finish(r, G);
  }

  function build(r) {
    const sky = K.mesh(r, b => skyDome(b, 260));
    return {
      sky,
      shed: buildShed(r),
      bunker: buildBunker(r),
      room: buildRoom(r),
      rock: buildRock(r),
      yard: buildYard(r),
      sentry: buildSentryArea(r),
      point: buildPointArea(r),
      inside: buildInside(r),
      carea: buildCArea(r),
      tower: buildTower(r),
      tex: {}
    };
  }

  const MATS = {
    concrete: { spec: [0.04, 5], rim: 0.15 },
    concreteIn: { spec: [0.02, 4], rim: 0.05, tint: [0.32, 0.3, 0.3] },
    gravel: { spec: [0.02, 3], rim: 0.08 },
    rock: { spec: [0.03, 4], rim: 0.3 },
    tin: { spec: [0.25, 14], rim: 0.3 },
    rust: { spec: [0.12, 8], rim: 0.25 },
    planks: { spec: [0.03, 4], rim: 0.2 },
    darkWood: { spec: [0.03, 4], rim: 0.2 },
    chain: { spec: [0.3, 14], rim: 0.2 },
    tower: { spec: [0.2, 12], rim: 0.4 },
    plain: { spec: [0.1, 8], rim: 0.3 }
  };

  const TEX = ['concrete', 'gravel', 'rock', 'tin', 'rust', 'planks', 'darkWood', 'chain', 'fragile', 'redShed', 'crateWood', 'crateLabel', 'warning', 'danger', 'signB', 'signC', 'capture', 'window', 'hazard'];

  function draw(fx, W, name, opts) {
    const o = opts || {};
    const T = (k) => Art.tex(fx.r, W.tex, k);
    if (o.sky) {
      const e = fx.cam.eye;
      fx.draw(W.sky, M4.translate(e[0], o.skyY === undefined ? 0 : o.skyY, e[2]), { texture: T('sky'), noFog: true, rim: 0, spec: [0, 1], tint: o.skyTint || [1, 1, 1] });
    }
    const A = W[name];
    if (!A) return;
    Object.keys(A).forEach(k => {
      const mat = Object.assign({}, MATS[k] || MATS.plain);
      const texKey = k === 'concreteIn' ? 'concrete' : k;
      if (TEX.includes(texKey)) mat.texture = T(texKey);
      if (k === 'glowWall') {
        fx.draw(A[k], null, { flat: o.glowCol || [1, 0.92, 0.75, 1], noFog: true });
        return;
      }
      if (o.tints && o.tints[k]) mat.tint = o.tints[k];
      fx.draw(A[k], null, mat);
    });
  }

  window.DemoSets = { build, draw, BUNKER, ROOM, SENTRY, HALLS, CDOOR, TEX };
})();
