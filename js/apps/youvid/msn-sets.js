(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp, clamp } = K;
  const Props = window.MsnProps;

  const WALL = { spec: [0.03, 4], rim: 0.2 };
  const ROCK = { spec: [0.05, 6], rim: 0.35 };
  const WOODM = { spec: [0.08, 8], rim: 0.3 };
  const METALM = { spec: [0.4, 20], rim: 0.4 };
  const SKY = { noFog: true, rim: 0, spec: [0, 1] };
  const MIRROR = M4.scale(1, 1, -1);

  function plane(b, x0, z0, x1, z1, y, col, ru, rv) {
    const u = ru || 1, v = rv || u;
    b.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], col, [[0, 0], [u, 0], [u, v], [0, v]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
  }

  function wall(b, a, c, y0, y1, col, ru, rv) {
    const d = V3.norm([c[0] - a[0], 0, c[1] - a[1]]);
    const n = [-d[2], 0, d[0]];
    const u = ru || 1, v = rv || 1;
    b.quad([a[0], y0, a[1]], [c[0], y0, c[1]], [c[0], y1, c[1]], [a[0], y1, a[1]], col, [[0, 0], [u, 0], [u, v], [0, v]], [n, n, n, n]);
  }

  function ceiling(b, x0, z0, x1, z1, y, col, ru, rv) {
    const u = ru || 1, v = rv || u;
    b.quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], col, [[0, 0], [u, 0], [u, v], [0, v]], [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]]);
  }

  function boxT(b, cx, cy, cz, sx, sy, sz, col, uv) {
    b.at(cx, cy, cz, h => h.box(sx, sy, sz, col, { uvScale: uv || 0 }));
  }

  function buildSky(b, R) {
    const n = 36, rows = 10;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < n; i++) {
        const pt = (ii, jj) => {
          const az = (ii / n - 0.5) * PI * 2, e = -0.2 + (jj / rows) * (PI / 2 + 0.2);
          return { p: [S(az) * C(e) * R, S(e) * R, -C(az) * C(e) * R], uv: [ii / n, clamp(0.08 + (e + 0.2) / (PI / 2 + 0.2) * 0.9, 0, 1)] };
        };
        const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
        b.quad(q[0].p, q[1].p, q[2].p, q[3].p, rgb(0xffffff, 1), q.map(v => v.uv));
      }
    }
    return b;
  }

  function buildMesas(b, R, h, y0) {
    const n = 48;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      const p = (a, y) => [S(a) * R, y, -C(a) * R];
      b.quad(p(a0, y0), p(a1, y0), p(a1, y0 + h), p(a0, y0 + h), rgb(0xffffff, 0.75), [[(i / n) * 3, 0], [((i + 1) / n) * 3, 0], [((i + 1) / n) * 3, 1], [(i / n) * 3, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    }
    return b;
  }

  function noise2(x, y, seed) {
    return S(x * 1.7 + seed) * 0.5 + S(y * 2.3 + seed * 1.3) * 0.3 + S((x + y) * 3.1 + seed * 0.7) * 0.2;
  }

  function hoodoo(b, cx, cz, base, h, seed, col) {
    const sides = 14, m = 9;
    const ring = (j) => {
      const k = j / m;
      const y = h * k;
      const r = base * (1 - 0.25 * k) * (k > 0.78 ? Math.sqrt(Math.max(0.02, 1 - Math.pow((k - 0.78) / 0.22, 2))) : 1);
      const pts = [];
      for (let i = 0; i <= sides; i++) {
        const a = (i / sides) * PI * 2;
        const w = 1 + 0.12 * noise2(a * 2, k * 4, seed) + 0.08 * S(k * 18 + seed);
        pts.push({ p: [cx + C(a) * r * w, y, cz + S(a) * r * w * 0.9], n: V3.norm([C(a), 0.15, S(a)]), uv: [(i / sides) * 2, y / 6] });
      }
      return pts;
    };
    const rings = [];
    for (let j = 0; j <= m; j++) rings.push(ring(j));
    for (let j = 0; j < m; j++) {
      for (let i = 0; i < sides; i++) {
        const a = rings[j][i], c = rings[j][i + 1], d = rings[j + 1][i + 1], e = rings[j + 1][i];
        b.quad(a.p, c.p, d.p, e.p, col, [a.uv, c.uv, d.uv, e.uv], [a.n, c.n, d.n, e.n]);
      }
    }
    const top = rings[m];
    const cc = [cx, h, cz];
    for (let i = 0; i < sides; i++) b.tri(cc, top[i].p, top[i + 1].p, col, [[0.5, h / 6], top[i].uv, top[i + 1].uv], [[0, 1, 0], top[i].n, top[i + 1].n]);
    return b;
  }

  function cliffWall(b, pts, h, seed, col, depth) {
    const steps = 6;
    for (let s = 0; s < pts.length - 1; s++) {
      const a = pts[s], c = pts[s + 1];
      const d = V3.norm([c[0] - a[0], 0, c[1] - a[1]]);
      const n = [-d[2], 0, d[0]];
      const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
      const nx = Math.max(2, Math.round(len / 3));
      const P = (i, j) => {
        const f = i / nx, k = j / steps;
        const x = lerp(a[0], c[0], f), z = lerp(a[1], c[1], f);
        const top = h * (0.8 + 0.2 * noise2(x * 0.2, z * 0.2, seed));
        const y = top * k;
        const out = (depth || 2) * (noise2(x * 0.5 + k * 3, z * 0.5, seed + 1) * 0.5 + 0.5) * (1 - k * 0.3) + (k > 0.85 ? -(k - 0.85) * 8 : 0);
        return [x + n[0] * out, y, z + n[2] * out];
      };
      for (let j = 0; j < steps; j++) {
        for (let i = 0; i < nx; i++) {
          const p0 = P(i, j), p1 = P(i + 1, j), p2 = P(i + 1, j + 1), p3 = P(i, j + 1);
          const nn = V3.norm(V3.cross(V3.sub(p1, p0), V3.sub(p3, p0)));
          const nf = V3.dot(nn, n) < 0 ? V3.mul(nn, -1) : nn;
          const uv = (p) => [(p[0] + p[2]) / 6, p[1] / 6];
          b.quad(p0, p1, p2, p3, col, [uv(p0), uv(p1), uv(p2), uv(p3)], [nf, nf, nf, nf]);
        }
      }
      for (let i = 0; i < nx; i++) {
        const p0 = P(i, steps), p1 = P(i + 1, steps);
        const back0 = [p0[0] - n[0] * 6, p0[1], p0[2] - n[2] * 6], back1 = [p1[0] - n[0] * 6, p1[1], p1[2] - n[2] * 6];
        b.quad(p0, p1, back1, back0, col, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
      }
    }
    return b;
  }

  function arch(b, cx, cz, yaw, R, r0, r1, col) {
    const n = 26, sides = 12;
    const M = M4.chain(M4.translate(cx, 0, cz), M4.rotY(yaw));
    b.push(M);
    const ring = (i) => {
      const u = i / n;
      const a = PI * (1 - u);
      const c = [C(a) * R, S(a) * R * 0.62, 0];
      const t = V3.norm([-S(a) * R, C(a) * R * 0.62, 0]);
      const side = [0, 0, 1];
      const nrm = V3.cross(t, side);
      const thick = lerp(r1, r0, Math.pow(Math.abs(u - 0.5) * 2, 2));
      const pts = [];
      for (let k = 0; k <= sides; k++) {
        const ang = (k / sides) * PI * 2;
        const w = 1 + 0.1 * S(ang * 3 + u * 9);
        const off = V3.add(V3.mul(nrm, C(ang) * thick * w), V3.mul(side, S(ang) * thick * 1.4 * w));
        pts.push({ p: V3.add(c, off), n: V3.norm(off), uv: [u * 6, (c[1] + off[1]) / 6] });
      }
      return pts;
    };
    const rings = [];
    for (let i = 0; i <= n; i++) rings.push(ring(i));
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < sides; k++) {
        const a = rings[i][k], c = rings[i][k + 1], d = rings[i + 1][k + 1], e = rings[i + 1][k];
        b.quad(a.p, c.p, d.p, e.p, col, [a.uv, c.uv, d.uv, e.uv], [a.n, c.n, d.n, e.n]);
      }
    }
    b.pop();
    return b;
  }

  const BOULDER_COLS = [0xb8684e, 0xc87c5c, 0xa65e48, 0xd09070];

  function boulders(b, n, area, seed, sMin, sMax) {
    const g = rand(seed);
    for (let i = 0; i < n; i++) {
      const x = lerp(area[0], area[2], g()), z = lerp(area[1], area[3], g());
      const s = lerp(sMin, sMax, g() * g());
      b.push(M4.translate(x, s * 0.3, z), M4.rotY(g() * PI));
      b.ellipsoid(s * (1 + g() * 0.6), s * (0.6 + g() * 0.3), s, 9, 6, BOULDER_COLS[Math.floor(g() * BOULDER_COLS.length)]);
      b.pop();
    }
    return b;
  }

  function cylUV(b, cx, cz, r, y0, y1, n, col, uRep, vRep) {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      const p = (a, y) => [cx + S(a) * r, y, cz + C(a) * r];
      const nn = (a) => [S(a), 0, C(a)];
      b.quad(p(a0, y0), p(a1, y0), p(a1, y1), p(a0, y1), col, [[(i / n) * uRep, 0], [((i + 1) / n) * uRep, 0], [((i + 1) / n) * uRep, vRep], [(i / n) * uRep, vRep]], [nn(a0), nn(a1), nn(a1), nn(a0)]);
    }
    return b;
  }

  function pole(b, x, z, h, yaw) {
    b.push(M4.translate(x, 0, z), M4.rotY(yaw || 0));
    b.prism(7, 0.13, 0.13, 0, 0.11, 0.11, h, 0x5a4636);
    b.at(0, h - 0.6, 0, q => q.box(1.9, 0.13, 0.13, 0x4e3c2e));
    b.at(0, h - 1.15, 0, q => q.box(1.3, 0.11, 0.11, 0x4e3c2e));
    [-0.85, -0.35, 0.35, 0.85].forEach(dx => b.at(dx, h - 0.52, 0, q => q.prism(6, 0.04, 0.04, 0, 0.03, 0.03, 0.12, 0x8a8c90)));
    b.pop();
  }

  function wires(b, poles, sagK) {
    for (let i = 0; i < poles.length - 1; i++) {
      const [x0, z0, h0, y0] = poles[i], [x1, z1, h1, y1] = poles[i + 1];
      [-0.85, -0.35, 0.35, 0.85].forEach(dx => {
        const a = [x0 + dx * C(y0 || 0), h0 - 0.42, z0 - dx * S(y0 || 0)], c = [x1 + dx * C(y1 || 0), h1 - 0.42, z1 - dx * S(y1 || 0)];
        const pts = [];
        for (let k = 0; k <= 10; k++) {
          const f = k / 10;
          const p = V3.lerp(a, c, f);
          p[1] -= S(f * PI) * V3.len(V3.sub(c, a)) * (sagK || 0.03);
          pts.push(p);
        }
        K.tube(b, pts, pts.map(() => 0.02), 4, 0x1a1816);
      });
    }
  }

  function grassTufts(b, n, area, seed, s0, s1) {
    const g = rand(seed);
    for (let i = 0; i < n; i++) {
      const x = lerp(area[0], area[2], g()), z = lerp(area[1], area[3], g());
      const s = lerp(s0, s1, g());
      for (let k = 0; k < 2; k++) {
        const a = g() * PI + k * PI / 2;
        const dx = C(a) * s * 0.5, dz = S(a) * s * 0.5;
        b.quad([x - dx, 0, z - dz], [x + dx, 0, z + dz], [x + dx, s, z + dz], [x - dx, s, z - dz], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
      }
    }
    return b;
  }

  function yucca(b, x, z, h, g, col) {
    const top = [x + (g() - 0.5) * 0.3, h * 0.55, z + (g() - 0.5) * 0.3];
    K.tube(b, [[x, 0, z], top], [0.12, 0.09], 6, col);
    for (let i = 0; i < 26; i++) {
      const a = g() * PI * 2, e = 0.2 + g() * 1.2;
      const dir = [C(a) * C(e), S(e), S(a) * C(e)];
      const tip = V3.add(top, V3.mul(dir, h * 0.3 * (0.6 + g() * 0.5)));
      K.tube(b, [top, tip], [h * 0.012, 0.003], 3, col);
    }
  }

  function buildRoad() {
    return (b) => {
      plane(b, -5.2, -500, 2.8, 30, 0.012, 0xffffff, 1, 66);
      return b;
    };
  }

  function buildRoadWorld(b) {
    plane(b, -400, -600, 400, 60, 0, 0xffffff, 120, 100);
    return b;
  }

  function buildRoadRocks(b) {
    const col = 0xffffff;
    cliffWall(b, [[-12, 30], [-14, 0], [-16, -30], [-15, -70], [-20, -110], [-26, -150]], 30, 3, col, 2.5);
    cliffWall(b, [[60, -170], [48, -130], [54, -100], [70, -80]], 26, 7, col, 2.5);
    hoodoo(b, -7.5, -6, 3.2, 6.5, 11, col);
    hoodoo(b, -8.5, -16, 2.6, 5, 13, col);
    hoodoo(b, 24, -70, 6, 12, 17, col);
    hoodoo(b, 36, -45, 5, 16, 19, col);
    hoodoo(b, 42, -110, 8, 26, 23, col);
    hoodoo(b, 78, -175, 12, 36, 31, col);
    arch(b, -6, -200, 0.05, 62, 10, 7, col);
    hoodoo(b, -58, -192, 10, 26, 37, col);
    hoodoo(b, 50, -196, 9, 22, 41, col);
    return b;
  }

  function buildRoadBoulders(b) {
    boulders(b, 40, [-9, -60, -4, 10], 101, 0.3, 1.8);
    boulders(b, 30, [5, -80, 14, 0], 103, 0.3, 2.2);
    return b;
  }

  const ROAD_POLES = [[-6.2, 12, 9, 0.02], [-6.6, -22, 9, 0.02], [-7.4, -58, 9, 0.03], [-8.6, -95, 9, 0.04], [-10, -132, 9, 0.05], [-11.5, -170, 9, 0.05]];

  function buildRoadProps(b) {
    ROAD_POLES.forEach(([x, z, h, yaw]) => pole(b, x, z, h, yaw));
    wires(b, ROAD_POLES, 0.025);
    K.tube(b, [[5.6, 0, -14], [5.6, 2.3, -14]], [0.045, 0.045], 6, 0x8a8a8a);
    [[11.5, -42], [17.5, -42]].forEach(([x, z]) => K.tube(b, [[x, 0, z], [x, 3.2, z]], [0.14, 0.14], 6, 0x5a4636));
    boxT(b, 14.5, 4.6, -42.15, 7.4, 3.2, 0.25, 0xd8ccb8);
    const g = rand(141);
    for (let i = 0; i < 6; i++) yucca(b, 6 + g() * 10, -20 - g() * 40, 2.5 + g() * 2, g, 0x5a4a30);
    return b;
  }

  function buildDash(b) {
    boxT(b, 0, -0.04, -0.12, 2.2, 0.08, 0.62, 0x4c4c42);
    boxT(b, 0, -0.03, 0.2, 2.2, 0.06, 0.06, 0x3a3a32);
    boxT(b, 0, -0.18, 0.26, 2.2, 0.28, 0.06, 0x44443a);
    [-0.7, -0.35, 0.35, 0.7].forEach(x => boxT(b, x, -0.17, 0.295, 0.24, 0.06, 0.012, 0x22221e));
    boxT(b, 0.0, 0.03, -0.18, 0.2, 0.06, 0.12, 0x5a5a50);
    boxT(b, 0, 0.012, -0.44, 2.2, 0.03, 0.08, 0x26241f);
    boxT(b, -0.06, 0.32, -0.49, 0.07, 0.62, 0.05, 0x3a362e);
    boxT(b, -1.1, 0.32, -0.46, 0.08, 0.7, 0.08, 0x3a362e);
    boxT(b, 1.0, 0.32, -0.46, 0.08, 0.7, 0.08, 0x3a362e);
    boxT(b, 0, 0.66, -0.52, 2.2, 0.06, 0.06, 0x3a362e);
    K.tube(b, [[-0.95, 0.06, -0.47], [-0.55, 0.4, -0.5], [-0.25, 0.62, -0.51]], [0.012, 0.01, 0.008], 6, 0x1a1816);
    return b;
  }

  function buildDashOutside(b) {
    b.quad([-30, -6, -40], [30, -6, -40], [30, 14, -40], [-30, 14, -40], 0xffffff, [[0, 0], [5, 0], [5, 2.4], [0, 2.4]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    return b;
  }

  function buildCab(b) {
    plane(b, -1.1, -1.0, 1.1, 0.8, 0, 0x3a3832);
    ceiling(b, -1.1, -1.0, 1.1, 0.8, 1.88, 0xb8bcb0);
    [-0.6, -0.2, 0.2, 0.55].forEach(z => boxT(b, 0, 1.86, z, 2.2, 0.03, 0.04, 0x8a8e82));
    K.tube(b, [[-1.0, 1.84, -0.9], [-0.3, 1.8, -0.4], [0.4, 1.83, 0.2], [1.0, 1.82, 0.6]], [0.008, 0.008, 0.008, 0.008], 5, 0x1e1c1a);
    K.tube(b, [[-0.9, 1.83, -0.95], [-0.2, 1.79, -0.6], [0.6, 1.81, -0.2]], [0.006, 0.006, 0.006], 5, 0x2a2826);
    boxT(b, 0, 0.75, -0.82, 2.2, 0.42, 0.3, 0x56584c);
    boxT(b, 0, 0.98, -0.78, 2.2, 0.05, 0.38, 0x3c3e36);
    [-1.06, 1.06].forEach(x => {
      boxT(b, x, 0.5, -0.15, 0.06, 1.0, 1.9, 0x6a6e62);
      boxT(b, x, 1.79, -0.15, 0.06, 0.18, 1.9, 0x6a6e62);
      boxT(b, x, 1.35, -0.86, 0.07, 0.95, 0.07, 0x5e6256);
      boxT(b, x, 1.35, 0.42, 0.07, 0.95, 0.09, 0x5e6256);
    });
    [[-1.0, -0.98], [1.0, -0.98]].forEach(([x, z]) => {
      b.push(M4.translate(x, 1.42, z), M4.rotX(-0.25));
      b.box(0.09, 0.95, 0.08, 0x5e6256);
      b.pop();
    });
    boxT(b, 0, 1.0, -0.92, 2.2, 0.06, 0.06, 0x4a4c44);
    boxT(b, 0, 1.84, -1.08, 2.2, 0.08, 0.1, 0x5e6256);
    boxT(b, 0, 0.95, 0.75, 2.2, 1.9, 0.06, 0x62665a);
    [0.45, -0.45].forEach(x => {
      boxT(b, x, 0.42, 0.05, 0.52, 0.14, 0.52, 0x4a3a2e);
      b.push(M4.translate(x, 0.82, 0.33), M4.rotX(-0.18));
      b.box(0.52, 0.72, 0.12, 0x4a3a2e);
      b.pop();
    });
    boxT(b, -0.95, 1.55, -0.55, 0.05, 0.22, 0.18, 0x8a3a30);
    boxT(b, -0.92, 1.55, -0.55, 0.02, 0.16, 0.12, 0xd8c8a0);
    return b;
  }

  function buildCabOutside(b) {
    const ridge = (x, z0, z1, h, seed) => {
      const n = 40;
      for (let i = 0; i < n; i++) {
        const za = lerp(z0, z1, i / n), zb = lerp(z0, z1, (i + 1) / n);
        const ha = h * (0.55 + 0.45 * Math.abs(noise2(za * 0.05, 0, seed))), hb = h * (0.55 + 0.45 * Math.abs(noise2(zb * 0.05, 0, seed)));
        b.quad([x, -3, za], [x, -3, zb], [x, hb, zb], [x, ha, za], 0xffffff, [[za / 12, 0], [zb / 12, 0], [zb / 12, hb / 12], [za / 12, ha / 12]], [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]]);
      }
    };
    ridge(-70, 200, -260, 7, 3);
    b.quad([-90, -3, -90], [90, -3, -90], [90, 8, -90], [-90, 8, -90], 0xffffff, [[0, 0], [10, 0], [10, 0.8], [0, 0.8]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    return b;
  }

  const MIRROR_HOLE = { x0: -0.21, x1: 0.21, y0: 1.32, y1: 1.98 };
  const ROOM = { x0: -0.78, x1: 0.78, z1: 1.75, y1: 2.32 };

  function buildMirrorWall(b) {
    const H = MIRROR_HOLE;
    const z = 0;
    const q = (x0, y0, x1, y1) => b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], 0xffffff, [[x0 * 1.6, y0 * 1.6], [x1 * 1.6, y0 * 1.6], [x1 * 1.6, y1 * 1.6], [x0 * 1.6, y1 * 1.6]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    q(ROOM.x0, 0, ROOM.x1, H.y0);
    q(ROOM.x0, H.y1, ROOM.x1, ROOM.y1);
    q(ROOM.x0, H.y0, H.x0, H.y1);
    q(H.x1, H.y0, ROOM.x1, H.y1);
    return b;
  }

  function buildMirrorFrame(b) {
    const H = MIRROR_HOLE;
    const t = 0.024;
    boxT(b, (H.x0 + H.x1) / 2, H.y0 - t / 2, 0.012, H.x1 - H.x0 + t * 2, t, 0.03, 0x8a8c88);
    boxT(b, (H.x0 + H.x1) / 2, H.y1 + t / 2, 0.012, H.x1 - H.x0 + t * 2, t, 0.03, 0x8a8c88);
    boxT(b, H.x0 - t / 2, (H.y0 + H.y1) / 2, 0.012, t, H.y1 - H.y0, 0.03, 0x8a8c88);
    boxT(b, H.x1 + t / 2, (H.y0 + H.y1) / 2, 0.012, t, H.y1 - H.y0, 0.03, 0x8a8c88);
    b.at(0, 1.1, 0.16, h => h.prism(18, 0.2, 0.15, -0.12, 0.24, 0.18, 0.0, 0xdedcd4, { capTop: false, capBottom: true }));
    boxT(b, 0, 1.11, 0.03, 0.5, 0.02, 0.06, 0xcfcdc5);
    K.tube(b, [[0.08, 1.12, 0.03], [0.08, 1.22, 0.05], [0.04, 1.24, 0.1]], [0.01, 0.01, 0.008], 6, 0xb8b8b0);
    return b;
  }

  function buildRoomBack(b) {
    const R = ROOM;
    b.quad([R.x1, 0, R.z1], [R.x0, 0, R.z1], [R.x0, R.y1, R.z1], [R.x1, R.y1, R.z1], 0xffffff, [[0, 0], [2.5, 0], [2.5, 3.6], [0, 3.6]], [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]);
    wall(b, [R.x0, 0], [R.x0, R.z1], 0, R.y1, 0xffffff, 2.8, 3.6);
    wall(b, [R.x1, R.z1], [R.x1, 0], 0, R.y1, 0xffffff, 2.8, 3.6);
    return b;
  }

  function buildRoomFloor(b) {
    plane(b, ROOM.x0, -0.01, ROOM.x1, ROOM.z1, 0, 0x5a4636, 2, 2);
    ceiling(b, ROOM.x0, -0.01, ROOM.x1, ROOM.z1, ROOM.y1, 0x9a968a, 2, 2);
    return b;
  }

  function buildRack(b) {
    const z = ROOM.z1 - 0.03;
    [-0.35, 0.1].forEach(x => {
      boxT(b, x, 1.62, z - 0.03, 0.03, 0.08, 0.06, 0x3a3836);
      boxT(b, x, 1.6, z - 0.06, 0.03, 0.02, 0.05, 0x3a3836);
    });
    [[-0.05, 1.05, 0.3, 0.26], [0.27, 1.05, 0.28, 0.24], [0.1, 1.31, 0.36, 0.26], [0.32, 1.32, 0.24, 0.28]].forEach(([x, y, w, h]) => boxT(b, x + 0.1, y + h / 2, z - 0.2, w, h, 0.3, 0xffffff, 3));
    boxT(b, 0.2, 0.9, z - 0.2, 0.75, 0.04, 0.42, 0x6a5444);
    return b;
  }

  function buildFortGround(b) {
    plane(b, -30, -60, 30, 30, 0, 0xb08a66, 12, 18);
    return b;
  }

  function buildFortCrates(b) {
    [[-4.2, -21.6], [3.8, -22.0], [-3.4, -22.1]].forEach(([x, z]) => boxT(b, x, 0.5, z, 1.0, 1.0, 1.0, 0xffffff, 1));
    return b;
  }

  function buildFort(b) {
    b.quad([-30, 0, -24], [30, 0, -24], [30, 7, -24], [-30, 7, -24], 0xffffff, [[0, 0], [14, 0], [14, 1.8], [0, 1.8]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    for (let x = -12; x <= 12; x += 1.6) boxT(b, x, 0.6, -20.5, 0.14, 1.2, 0.14, 0x7a5434);
    [0.45, 1.0].forEach(y => boxT(b, 0, y, -20.42, 24.4, 0.1, 0.06, 0x8a6040));
    for (let x = 3.3; x <= 5.8; x += 0.32) boxT(b, x, 1.2, -22.6, 0.22, 2.4, 0.06, 0x7a5a3e);
    boxT(b, 1.4, 2.4, -19.0, 0.36, 4.8, 0.36, 0x6a4a30);
    boxT(b, -2.6, 2.4, -21.8, 0.4, 4.8, 0.4, 0x6a4a30);
    boxT(b, 0, 4.9, -21.0, 14, 0.3, 0.5, 0x5e4028);
    return b;
  }

  const NEST_BLDG = [[-14, -42, 16, 12, 9, 3.5], [6, -50, 22, 14, 14, 4], [16, -36, 8, 8, 6, 2.5]];

  function buildNestWalls(b) {
    NEST_BLDG.forEach(([x, z, w, d, h]) => b.at(x, h / 2, z, q => q.box(w, h, d, 0xffffff, { uvScale: 0.25 })));
    return b;
  }

  function buildNestView(b) {
    plane(b, -80, -120, 80, 10, 0, 0xc49a74, 1, 1);
    const blu = (x, z, w, d, h, roofH) => {
      b.push(M4.translate(x, h, z));
      b.quad([-w / 2 - 0.4, 0, d / 2 + 0.4], [w / 2 + 0.4, 0, d / 2 + 0.4], [w / 2 + 0.4, roofH, 0], [-w / 2 - 0.4, roofH, 0], 0xb06a44, null, [[0, 0.7, 0.7], [0, 0.7, 0.7], [0, 0.7, 0.7], [0, 0.7, 0.7]]);
      b.quad([w / 2 + 0.4, 0, -d / 2 - 0.4], [-w / 2 - 0.4, 0, -d / 2 - 0.4], [-w / 2 - 0.4, roofH, 0], [w / 2 + 0.4, roofH, 0], 0x9a5a3a, null, [[0, 0.7, -0.7], [0, 0.7, -0.7], [0, 0.7, -0.7], [0, 0.7, -0.7]]);
      b.pop();
    };
    NEST_BLDG.forEach(([x, z, w, d, h, rh]) => blu(x, z, w, d, h, rh));
    [[-6, -29, 0.45], [-3, -29.5, 0.45], [-4.5, -28.2, 0.45], [2, -29, 0.45], [4.5, -28.6, 0.45]].forEach(([x, z, r]) => {
      b.at(x, 0, z, h => h.prism(12, r, r, 0, r, r, 1.1, 0xd8b030, { capTop: true }));
      b.at(x, 1.1, z, h => h.prism(12, r * 1.02, r * 1.02, 0, r * 1.02, r * 1.02, 0.04, 0x2a2622));
    });
    [[-16, -35.9], [-11, -35.9], [0, -42.9], [8, -42.9], [12, -42.9]].forEach(([x, z]) => {
      boxT(b, x, 7.5, z, 1.3, 1.6, 0.1, 0xe8e6e0);
      boxT(b, x, 7.5, z + 0.03, 1.0, 1.3, 0.1, 0x2a3036);
    });
    boxT(b, -2, 6.0, -35, 26, 0.3, 2.2, 0x6a5038);
    for (let x = -14; x <= 12; x += 2) boxT(b, x, 3.0, -34.2, 0.18, 6.0, 0.18, 0x5a4430);
    for (let x = -14; x <= 12; x += 2) boxT(b, x, 6.7, -34.0, 0.08, 1.2, 0.08, 0x5a4430);
    boxT(b, -1, 7.25, -34.0, 26, 0.08, 0.08, 0x5a4430);
    for (let x = -18; x <= 2; x += 0.6) boxT(b, x, 1.1, -26, 0.03, 2.2, 0.03, 0x707270);
    boxT(b, -8, 2.2, -26, 20, 0.05, 0.05, 0x707270);
    return b;
  }

  function buildGround(b) {
    plane(b, -300, -300, 300, 300, 0, 0xffffff, 80, 80);
    return b;
  }

  function buildPhoneRocks(b) {
    hoodoo(b, -30, -70, 12, 40, 211, 0xffffff);
    hoodoo(b, 25, -90, 16, 55, 213, 0xffffff);
    hoodoo(b, 70, -60, 14, 34, 217, 0xffffff);
    hoodoo(b, -70, -40, 10, 26, 219, 0xffffff);
    return b;
  }

  function buildPhoneSet(b) {
    K.tube(b, [[0, 0, 0], [0, 9, 0]], [0.16, 0.14], 9, 0x6a5e52);
    K.tube(b, [[0.12, 0.6, 0.04], [0.15, 1.9, 0.06], [0.16, 3.2, 0.08]], [0.012, 0.012, 0.012], 5, 0x5a2a20);
    boxT(b, 0.16, 1.55, 0.08, 0.025, 0.02, 0.02, 0xb8b8b0);
    boxT(b, 0.16, 2.35, 0.08, 0.025, 0.02, 0.02, 0xb8b8b0);
    boulders(b, 25, [-20, -40, 20, -10], 201, 0.4, 2.5);
    return b;
  }

  function buildHeadframe(b) {
    const steel = 0x3a3836;
    const legs = [[-1.2, 0, -1.0], [1.2, 0, -1.0], [-1.2, 0, 1.0], [1.2, 0, 1.0]];
    const top = 13.5;
    legs.forEach(([x, y, z]) => K.tube(b, [[x, 0, z], [x * 0.55, top, z * 0.55]], [0.13, 0.11], 6, steel));
    K.tube(b, [[4.5, 0, 0], [0.8, top - 0.4, 0]], [0.16, 0.13], 6, steel);
    K.tube(b, [[4.5, 0, 0.6], [0.8, top - 0.4, 0.4]], [0.12, 0.1], 6, steel);
    for (let i = 0; i < 6; i++) {
      const y = 1.5 + i * 2.1;
      const k = 1 - y / top * 0.45;
      [[[-1.2, -1.0], [1.2, -1.0]], [[1.2, -1.0], [1.2, 1.0]], [[1.2, 1.0], [-1.2, 1.0]], [[-1.2, 1.0], [-1.2, -1.0]]].forEach(([p, q]) => {
        K.tube(b, [[p[0] * k, y, p[1] * k], [q[0] * k, y, q[1] * k]], [0.06, 0.06], 4, steel);
      });
      if (i < 5) K.tube(b, [[-1.2 * k, y, -1.0 * k], [1.2 * k, y + 2.1, -1.0 * k]], [0.05, 0.05], 4, steel);
    }
    for (let i = 0; i < 40; i++) boxT(b, -0.66 * (1 - i * 0.008), 0.3 + i * 0.32, 1.02 - i * 0.012, 0.5, 0.04, 0.05, steel);
    [-0.92, -0.4].forEach(x => K.tube(b, [[x, 0, 1.06], [x * 0.6, top, 0.62]], [0.04, 0.04], 4, steel));
    boxT(b, 0, top, 0, 3.6, 0.16, 3.0, 0x4a4440);
    [[-1.8, 0], [1.8, 0], [0, -1.5], [0, 1.5]].forEach(([x, z]) => {
      if (Math.abs(x) > 0) boxT(b, x, top + 0.55, z, 0.06, 1.1, 3.0, steel);
      else boxT(b, x, top + 0.55, z, 3.6, 1.1, 0.06, steel);
    });
    b.push(M4.translate(0.2, top + 2.1, 0.3), M4.rotX(0));
    Props.torus(b, 1.95, 0.1, 32, 6, steel);
    Props.torus(b, 1.75, 0.05, 32, 4, steel);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * PI * 2;
      K.tube(b, [[0, 0, 0], [C(a) * 1.9, S(a) * 1.9, 0]], [0.045, 0.045], 4, steel);
    }
    b.at(0, 0, 0, h => { h.push(M4.rotX(PI / 2)); h.prism(10, 0.18, 0.18, -0.2, 0.18, 0.18, 0.2, steel, { capBottom: true }); h.pop(); });
    b.pop();
    b.push(M4.translate(0, top + 4.3, 0), M4.rotZ(-0.06));
    b.box(4.8, 0.12, 4.0, 0x8a847c);
    b.pop();
    [[-1.6, -1.4], [1.6, -1.4], [-1.6, 1.4], [1.6, 1.4]].forEach(([x, z]) => K.tube(b, [[x, top, z], [x * 0.9, top + 4.2, z * 0.9]], [0.05, 0.05], 4, steel));
    K.tube(b, [[0.2, top + 1.6, 0], [6, 0.5, 2]], [0.025, 0.025], 4, 0x1a1816);
    K.tube(b, [[0.2, top + 0.2, 0.2], [0.2, 2, 0.2]], [0.02, 0.02], 4, 0x1a1816);
    return b;
  }

  function buildTank(b) {
    cylUV(b, -7, 2, 2.4, 0, 4.6, 24, 0xffffff, 3, 1);
    return b;
  }

  function buildAdobe(b) {
    boxT(b, 11, 2.0, 4, 7, 4.0, 6, 0xffffff, 0.4);
    return b;
  }

  function buildTowerSet(b) {
    b.push(M4.translate(-7, 0, 2));
    b.at(0, 4.6, 0, h => h.prism(20, 2.5, 2.5, 0, 0.3, 0.3, 1.2, 0x7a7c7c));
    [[-1.8, 1.4], [1.8, 1.4], [0, -2.2]].forEach(([x, z]) => K.tube(b, [[x, 0, z], [x, 4.6, z]], [0.05, 0.05], 4, 0x5a5a58));
    b.pop();
    boxT(b, 11, 4.1, 4, 7.4, 0.25, 6.4, 0xb8a078);
    [[8.6, 2.4, 7.01], [11.4, 2.4, 7.01], [13.6, 2.4, 7.01]].forEach(([x, y, z]) => boxT(b, x, y, z, 1.0, 0.9, 0.05, 0x3a2e24));
    boulders(b, 14, [-12, 7, 14, 14], 301, 1.0, 2.6);
    return b;
  }

  function peak(b, cx, cz, base, h, seed, col) {
    const sides = 16, m = 8;
    const ring = (j) => {
      const k = j / m;
      const pts = [];
      for (let i = 0; i <= sides; i++) {
        const a = (i / sides) * PI * 2;
        const r = base * (1 - k) * (1 + 0.32 * noise2(a * 2, k * 3, seed) + 0.12 * S(a * 5 + seed));
        pts.push({ p: [cx + C(a) * r, h * k, cz + S(a) * r * 0.8], n: V3.norm([C(a), 0.6, S(a)]), uv: [(i / sides) * 3, h * k / 8] });
      }
      return pts;
    };
    const rings = [];
    for (let j = 0; j <= m; j++) rings.push(ring(j));
    for (let j = 0; j < m; j++) {
      for (let i = 0; i < sides; i++) {
        const a = rings[j][i], c = rings[j][i + 1], d = rings[j + 1][i + 1], e = rings[j + 1][i];
        b.quad(a.p, c.p, d.p, e.p, col, [a.uv, c.uv, d.uv, e.uv], [a.n, c.n, d.n, e.n]);
      }
    }
    return b;
  }

  function buildTowerRocks(b) {
    peak(b, -150, -280, 110, 150, 311, 0xffffff);
    peak(b, 40, -320, 120, 175, 313, 0xffffff);
    peak(b, 210, -260, 95, 120, 317, 0xffffff);
    hoodoo(b, -60, -120, 10, 22, 319, 0xffffff);
    hoodoo(b, 70, -110, 9, 18, 323, 0xffffff);
    return b;
  }

  function buildTowerPlants(b) {
    const g = rand(331);
    for (let i = 0; i < 8; i++) yucca(b, -12 + g() * 10, 6 + g() * 6, 2 + g() * 1.5, g, 0x5a5a3a);
    return b;
  }

  function buildVista(b) {
    const col = 0xffffff;
    const g = rand(401);
    for (let i = 0; i < 46; i++) {
      const a = g() * PI * 2, r = 18 + g() * 110;
      const x = S(a) * r, z = C(a) * r;
      if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;
      b.push(M4.translate(0, -16, 0));
      hoodoo(b, x, z, 4 + g() * 9, 12 + g() * 26, 403 + i, col);
      b.pop();
    }
    b.push(M4.translate(0, -16, 0));
    arch(b, -10, 150, PI + 0.2, 55, 10, 7, col);
    b.pop();
    return b;
  }

  function buildVistaRim(b) {
    const col = 0xffffff;
    const ring = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * PI * 2;
      const r = 85 + 15 * S(a * 3) + 10 * C(a * 5);
      ring.push([S(a) * r, C(a) * r]);
    }
    b.push(M4.translate(0, -16, 0));
    cliffWall(b, ring, 22, 431, col, 4);
    b.pop();
    return b;
  }

  function buildVistaFloor(b) {
    plane(b, -400, -400, 400, 400, -16, 0xffffff, 100, 100);
    b.push(M4.translate(0, -16, 0));
    boulders(b, 40, [-60, -60, 60, 60], 411, 0.6, 3);
    b.pop();
    return b;
  }

  function buildPerch(b) {
    const steel = 0x3a3836;
    boxT(b, 0, -0.08, 0, 3.6, 0.16, 3.0, 0x4a4440);
    [[-1.8, 0], [1.8, 0], [0, 1.5], [0, -1.5]].forEach(([x, z]) => {
      if (Math.abs(x) > 0) {
        boxT(b, x, 0.55, z, 0.06, 0.06, 3.0, steel);
        boxT(b, x, 1.05, z, 0.06, 0.06, 3.0, steel);
      } else {
        boxT(b, x, 0.55, z, 3.6, 0.06, 0.06, steel);
        boxT(b, x, 1.05, z, 3.6, 0.06, 0.06, steel);
      }
    });
    [[-1.8, -1.5], [1.8, -1.5], [-1.8, 1.5], [1.8, 1.5], [0, 1.5], [0, -1.5], [-1.8, 0], [1.8, 0]].forEach(([x, z]) => boxT(b, x, 0.55, z, 0.08, 1.1, 0.08, steel));
    [[-1.6, -1.4], [1.6, -1.4], [-1.6, 1.4], [1.6, 1.4]].forEach(([x, z]) => K.tube(b, [[x, 0, z], [x * 0.9, 3.5, z * 0.9]], [0.05, 0.05], 4, steel));
    [[-1.2, -1.0], [1.2, -1.0], [-1.2, 1.0], [1.2, 1.0]].forEach(([x, z]) => K.tube(b, [[x * 0.55, 0, z * 0.55], [x * 1.2, -14, z * 1.2]], [0.11, 0.13], 6, steel));
    return b;
  }

  function buildHutCrates(b) {
    boxT(b, -1.45, 0.3, 0.8, 0.6, 0.6, 0.6, 0xffffff, 1);
    boxT(b, 0.3, 0.3, 0.35, 0.9, 0.6, 0.75, 0xffffff, 1);
    boxT(b, 0.9, 0.36, -0.3, 0.8, 0.72, 0.7, 0xffffff, 1);
    boxT(b, -0.9, 0.32, 0.2, 0.75, 0.64, 0.7, 0xffffff, 1);
    boxT(b, -1.0, 0.3, -1.4, 1.2, 0.6, 0.9, 0xffffff, 1);
    return b;
  }

  function buildHut(b) {
    const X0 = -2.4, X1 = 2.6, Z0 = -2.2, Z1 = 2.4, H = 2.5;
    plane(b, X0, Z0, X1, Z1, 0, 0xffffff, 3, 3);
    wall(b, [X0, Z0], [X1, Z0], 0, H, 0xffffff, 4, 2);
    wall(b, [X0, Z1], [X0, Z0], 0, H, 0xffffff, 4, 2);
    wall(b, [X1, Z0], [X1, -0.4], 0, H, 0xffffff, 1.5, 2);
    wall(b, [X1, 1.2], [X1, Z1], 0, H, 0xffffff, 1.2, 2);
    wall(b, [X1, -0.4], [X1, 1.2], 0, 1.05, 0xffffff, 1.3, 0.8);
    wall(b, [X1, -0.4], [X1, 1.2], 2.0, H, 0xffffff, 1.3, 0.4);
    for (let i = 0; i < 7; i++) {
      const z = lerp(Z0, Z1, i / 6);
      b.push(M4.translate(0.1, H + 0.6, z));
      b.box(5.2, 0.16, 0.14, 0x3e2c20);
      b.pop();

    }
    [-1, 1].forEach(s => {
      b.push(M4.translate(0.1 + s * 1.35, H + 0.38, 0.1), M4.rotZ(s * 0.42));
      b.quad([-1.5, 0.08, Z0 - 0.1], [1.5, 0.08, Z0 - 0.1], [1.5, 0.08, Z1 + 0.1], [-1.5, 0.08, Z1 + 0.1], 0x5a4434, null, [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]]);
      b.pop();
    });
    boxT(b, X1 - 0.02, 1.52, 0.4, 0.1, 0.06, 1.7, 0x3e2c20);
    boxT(b, X1 - 0.02, 1.02, 0.4, 0.14, 0.06, 1.7, 0x3e2c20);
    boxT(b, X1 - 0.02, 1.52, -0.42, 0.1, 1.0, 0.08, 0x3e2c20);
    boxT(b, X1 - 0.02, 1.52, 1.22, 0.1, 1.0, 0.08, 0x3e2c20);
    boxT(b, -1.95, 1.4, -1.0, 0.5, 0.05, 1.6, 0x4e3a2a);
    boxT(b, -1.95, 1.9, -1.0, 0.5, 0.05, 1.6, 0x4e3a2a);
    return b;
  }

  function buildHutOutside(b) {
    plane(b, 2.6, -60, 80, 60, -0.3, 0xc49a74, 1, 1);
    b.at(12, 3, -2, h => h.box(8, 6, 10, 0x8a6a4a));
    b.push(M4.translate(12, 6, -2));
    b.quad([-4.4, 0, 5.4], [4.4, 0, 5.4], [0, 2.5, 5.4], [0, 2.5, 5.4], 0xb06a44);
    b.pop();
    return b;
  }

  function buildHall(b) {
    const X0 = -0.85, X1 = 0.85, Z0 = -9, Z1 = 2, H = 2.45;
    plane(b, X0, Z0, X1, Z1, 0, 0x8a8c88, 1, 6);
    wall(b, [X0, Z1], [X0, -1.3], 0, H, 0xffffff, 2.4, 2);
    wall(b, [X0, -2.7], [X0, Z0], 0, H, 0xffffff, 4.6, 2);
    wall(b, [X0, -1.3], [X0, -2.7], 0, 0.95, 0xffffff, 1, 0.8);
    wall(b, [X0, -1.3], [X0, -2.7], 2.0, H, 0xffffff, 1, 0.4);
    wall(b, [X1, Z0], [X1, Z1], 0, H, 0xffffff, 8, 2);
    wall(b, [X0, Z0], [X1, Z0], 0, H, 0xffffff, 1.4, 2);
    b.tri([X0, H, Z0], [X1, H, Z0], [0, H + 0.9, Z0], 0x463a30, [[0, 0], [1, 0], [0.5, 0.4]], [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    b.tri([X1, H, Z1], [X0, H, Z1], [0, H + 0.9, Z1], 0x463a30, [[0, 0], [1, 0], [0.5, 0.4]], [[0, 0, -1], [0, 0, -1], [0, 0, -1]]);
    b.quad([X0, H, Z1], [X0, H, Z0], [0, H + 0.9, Z0], [0, H + 0.9, Z1], 0x463a30, [[0, 0], [8, 0], [8, 1], [0, 1]], [[0.6, -0.8, 0], [0.6, -0.8, 0], [0.6, -0.8, 0], [0.6, -0.8, 0]]);
    b.quad([X1, H, Z0], [X1, H, Z1], [0, H + 0.9, Z1], [0, H + 0.9, Z0], 0x463a30, [[0, 0], [8, 0], [8, 1], [0, 1]], [[-0.6, -0.8, 0], [-0.6, -0.8, 0], [-0.6, -0.8, 0], [-0.6, -0.8, 0]]);
    for (let z = Z0 + 0.6; z < Z1; z += 1.4) {
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * 0.43, H + 0.45, z), M4.rotZ(-s * 0.98));
        b.box(1.05, 0.1, 0.1, 0x3e3026);
        b.pop();
      });
    }
    [[-3.4, 1], [-6.2, -1], [-1.0, -1]].forEach(([z, s]) => {
      boxT(b, s * 0.84, 1.0, z, 0.06, 2.0, 0.9, 0x6e665e);
      boxT(b, s * 0.82, 1.0, z, 0.03, 1.9, 0.8, 0x5a524a);
    });
    return b;
  }

  function buildHallOutside(b) {
    plane(b, -40, -30, -0.86, 20, -0.2, 0xc49a74, 1, 1);
    b.at(-8, 2.5, -2.5, h => h.box(6, 5, 9, 0x8a6a4a));
    b.push(M4.translate(-8, 5, -2.5));
    b.quad([3.4, 0, -5], [3.4, 0, 5], [0, 2.2, 5], [0, 2.2, -5], 0xb06a44, null, [[0.6, 0.8, 0], [0.6, 0.8, 0], [0.6, 0.8, 0], [0.6, 0.8, 0]]);
    b.pop();
    return b;
  }

  function buildHallFrame(b) {
    boxT(b, -0.84, 0.95, -2.0, 0.12, 0.08, 1.5, 0x3a3028);
    boxT(b, -0.84, 2.0, -2.0, 0.12, 0.08, 1.5, 0x3a3028);
    boxT(b, -0.84, 1.47, -1.28, 0.12, 1.1, 0.06, 0x3a3028);
    boxT(b, -0.84, 1.47, -2.72, 0.12, 1.1, 0.06, 0x3a3028);
    return b;
  }

  function buildTownWall(b) {
    b.quad([-3, 0, 0], [2, 0, 0], [2, 3.2, 0], [-3, 3.2, 0], 0xffffff, [[0, 0], [5, 0], [5, 3.2], [0, 3.2]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    return b;
  }

  function buildTownHouses(b) {
    boxT(b, -14, 3, -20, 10, 6, 8, 0xffffff, 0.3);
    boxT(b, 14, 2.4, -24, 8, 4.8, 8, 0xffffff, 0.3);
    return b;
  }

  function buildTownProps(b) {
    boxT(b, -0.5, 3.3, 0.05, 5.2, 0.2, 0.4, 0x8a7a66);
    [[6, -8], [11, -8]].forEach(([x, z]) => K.tube(b, [[x, 0, z], [x, 4.8, z]], [0.16, 0.16], 6, 0x5a4636));
    boxT(b, 8.5, 6.4, -8.15, 7.6, 3.4, 0.25, 0xd8ccb8);
    K.tube(b, [[-14, 6, -16], [-6, 5.6, -10], [2, 6.2, -6]], [0.02, 0.02, 0.02], 4, 0x1a1816);
    return b;
  }

  function buildTownRocks(b) {
    hoodoo(b, -40, -90, 16, 40, 511, 0xffffff);
    hoodoo(b, 30, -110, 18, 52, 513, 0xffffff);
    hoodoo(b, 75, -80, 12, 30, 517, 0xffffff);
    return b;
  }

  function buildLedge(b) {
    boxT(b, 0, -0.1, 0, 6, 0.2, 3, 0x7a6a58);
    b.push(M4.translate(0, -6, 0));
    boulders(b, 20, [-40, -60, 40, -10], 601, 1, 4);
    b.pop();
    return b;
  }

  function build(r) {
    const mk = (fn) => K.mesh(r, fn);
    return {
      sky: mk(b => buildSky(b, 420)),
      skyNear: mk(b => buildSky(b, 120)),
      mesas: mk(b => buildMesas(b, 380, 70, -12)),
      mesasNear: mk(b => buildMesas(b, 110, 26, -6)),
      roadWorld: mk(buildRoadWorld),
      road: mk(buildRoad()),
      roadRocks: mk(buildRoadRocks),
      roadBoulders: mk(buildRoadBoulders),
      ground: mk(buildGround),
      roadProps: mk(buildRoadProps),
      roadGrass: mk(b => { grassTufts(b, 40, [-9.5, -90, -6, -6], 151, 0.4, 0.9); grassTufts(b, 50, [3.6, -90, 14, -6], 153, 0.4, 0.9); return b; }),
      sign: mk(b => b.quad([4.95, 1.75, -14], [6.25, 1.75, -14], [6.25, 3.05, -14], [4.95, 3.05, -14], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]])),
      billboard: mk(b => b.quad([10.9, 3.1, -42.0], [18.1, 3.1, -42.0], [18.1, 6.1, -42.0], [10.9, 6.1, -42.0], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]])),
      dash: mk(buildDash),
      dashOut: mk(buildDashOutside),
      cab: mk(buildCab),
      cabOut: mk(buildCabOutside),
      mirrorWall: mk(buildMirrorWall),
      mirrorFrame: mk(buildMirrorFrame),
      roomBack: mk(buildRoomBack),
      roomFloor: mk(buildRoomFloor),
      rack: mk(buildRack),
      glass: mk(b => b.quad([MIRROR_HOLE.x0, MIRROR_HOLE.y0, 0.002], [MIRROR_HOLE.x1, MIRROR_HOLE.y0, 0.002], [MIRROR_HOLE.x1, MIRROR_HOLE.y1, 0.002], [MIRROR_HOLE.x0, MIRROR_HOLE.y1, 0.002], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]])),
      photo: mk(b => b.quad([-0.065, -0.08, 0], [0.065, -0.08, 0], [0.065, 0.08, 0], [-0.065, 0.08, 0], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]])),
      photoHeavy: mk(b => {
        b.quad([-0.065, -0.08, 0], [0.065, -0.08, 0], [0.065, 0.08, 0], [-0.065, 0.08, 0], 0xe9e6df, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        b.quad([-0.057, -0.058, 0.0005], [0.057, -0.058, 0.0005], [0.057, 0.072, 0.0005], [-0.057, 0.072, 0.0005], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      }),
      fort: mk(buildFort),
      fortGround: mk(buildFortGround),
      fortCrates: mk(buildFortCrates),
      nestView: mk(buildNestView),
      nestWalls: mk(buildNestWalls),
      window: mk(b => {
        const q = (x0, y0, x1, y1) => b.quad([x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], 0x2a221c, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        q(-4, -2, 4, 0.0);
        q(-4, 1.15, 4, 3);
        q(-4, 0, -1.7, 1.15);
        q(1.3, 0, 4, 1.15);
        boxT(b, -1.7, 0.58, -0.04, 0.12, 1.25, 0.1, 0x3a3028);
        boxT(b, 1.3, 0.58, -0.04, 0.12, 1.25, 0.1, 0x3a3028);
        boxT(b, -0.2, 0.0, -0.06, 3.1, 0.12, 0.2, 0x3a3028);
      }),
      phoneSet: mk(buildPhoneSet),
      phoneRocks: mk(buildPhoneRocks),
      headframe: mk(buildHeadframe),
      towerSet: mk(buildTowerSet),
      tank: mk(buildTank),
      adobe: mk(buildAdobe),
      towerRocks: mk(buildTowerRocks),
      towerPlants: mk(buildTowerPlants),
      vista: mk(buildVista),
      vistaFloor: mk(buildVistaFloor),
      vistaRim: mk(buildVistaRim),
      perch: mk(buildPerch),
      hut: mk(buildHut),
      hutCrates: mk(buildHutCrates),
      hutOut: mk(buildHutOutside),
      hall: mk(buildHall),
      hallOut: mk(buildHallOutside),
      hallFrame: mk(buildHallFrame),
      townWall: mk(buildTownWall),
      townHouses: mk(buildTownHouses),
      townProps: mk(buildTownProps),
      townRocks: mk(buildTownRocks),
      townBoard: mk(b => b.quad([4.8, 4.75, -8.0], [12.2, 4.75, -8.0], [12.2, 8.05, -8.0], [4.8, 8.05, -8.0], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]])),
      ledge: mk(buildLedge),
      grassNear: mk(b => grassTufts(b, 40, [-20, -60, 20, -8], 171, 0.5, 1.1)),
      r
    };
  }

  function skyAt(fx, W, T, near, noon) {
    const e = fx.cam.eye;
    fx.draw(near ? W.skyNear : W.sky, M4.translate(e[0], 0, e[2]), Object.assign({ texture: T(noon ? 'skyNoon' : 'sky') }, SKY));
  }

  function mesasAt(fx, W, T, near, tint) {
    const e = fx.cam.eye;
    fx.draw(near ? W.mesasNear : W.mesas, M4.translate(e[0], 0, e[2]), { texture: T('mesas'), rim: 0, spec: [0, 1], tint: tint || [1, 1, 1], noFog: true });
  }

  function drawPhotos(fx, W, T, heavyTex) {
    const list = [[0.29, 1.84, 0.006, 0.05, 'photoEngie'], [0.295, 1.655, 0.008, -0.03, 'heavy'], [0.288, 1.47, 0.006, 0.04, 'photoScout']];
    list.forEach(([x, y, z, rot, key]) => {
      const M = M4.chain(M4.translate(x, y, z), M4.rotZ(rot));
      if (key === 'heavy') fx.draw(W.photoHeavy, M, { texture: heavyTex, spec: [0.3, 20], rim: 0.2 });
      else fx.draw(W.photo, M, { texture: T(key), spec: [0.3, 20], rim: 0.2 });
    });
  }

  function draw(fx, W, name, T, opts) {
    const o = opts || {};
    if (name === 'road') {
      skyAt(fx, W, T);
      mesasAt(fx, W, T, false, [0.95, 0.9, 0.95]);
      fx.draw(W.roadWorld, null, Object.assign({ texture: T('sand') }, WALL));
      fx.draw(W.road, null, Object.assign({ texture: T('road') }, WALL));
      fx.draw(W.roadRocks, null, Object.assign({ texture: T('rock') }, ROCK));
      fx.draw(W.roadBoulders, null, ROCK);
      fx.draw(W.roadProps, null, WOODM);
      fx.draw(W.roadGrass, null, { texture: T('grass'), rim: 0.2, spec: [0, 1] });
      fx.draw(W.sign, null, { texture: T('sign'), spec: [0.3, 14], rim: 0.3 });
      fx.draw(W.billboard, null, { texture: T('billboard'), spec: [0.1, 8], rim: 0.3 });
    } else if (name === 'dash') {
      if (!o.inside) {
        fx.draw(W.dashOut, null, { texture: T('rockPale'), noFog: true, rim: 0, spec: [0, 1], tint: [1.15, 1.08, 1.0] });
      } else {
        fx.draw(W.dash, null, { spec: [0.12, 10], rim: 0.5 });
      }
    } else if (name === 'cab') {
      if (!o.inside) {
        skyAt(fx, W, T, true);
        fx.draw(W.cabOut, null, { texture: T('rockPale'), noFog: true, rim: 0, spec: [0, 1], uvScroll: [o.scroll || 0, 0], tint: [1.1, 1.02, 1.0] });
      } else {
        fx.draw(W.cab, null, { spec: [0.15, 10], rim: 0.45 });
      }
    } else if (name === 'mirror') {
      const pre = o.virtual ? MIRROR : null;
      const Mx = (M) => (pre ? (M ? M4.mul(pre, M) : pre) : M);
      if (o.virtual) {
        fx.draw(W.roomBack, Mx(null), Object.assign({ texture: T('planksCream') }, WALL));
        fx.draw(W.roomFloor, Mx(null), WALL);
        fx.draw(W.rack, Mx(null), Object.assign({ texture: T('cardboard') }, WOODM));
      } else {
        fx.draw(W.mirrorWall, null, Object.assign({ texture: T('planksCream') }, WALL));
        fx.draw(W.mirrorFrame, null, { spec: [0.5, 24], rim: 0.4 });
        fx.draw(W.roomFloor, null, WALL);
        drawPhotos(fx, W, T, o.heavyTex);
      }
    } else if (name === 'glass') {
      fx.draw(W.glass, null, { texture: T('mirror'), additive: true, alpha: 0.35, noFog: true });
    } else if (name === 'fort') {
      fx.draw(W.fortGround, null, Object.assign({ texture: T('sand') }, WALL));
      fx.draw(W.fort, null, Object.assign({ texture: T('planksWarmH') }, WOODM));
      fx.draw(W.fortCrates, null, Object.assign({ texture: T('crate') }, WOODM));
    } else if (name === 'nest') {
      if (!o.inside) {
        skyAt(fx, W, T);
        mesasAt(fx, W, T, false, [0.95, 0.9, 0.95]);
        fx.draw(W.nestWalls, null, Object.assign({ texture: T('siding') }, WALL));
        fx.draw(W.nestView, null, WALL);
      } else {
        fx.draw(W.window, M4.translate(0, 1.2, -0.6), { spec: [0.05, 4], rim: 0.2 });
      }
    } else if (name === 'phone') {
      skyAt(fx, W, T);
      mesasAt(fx, W, T, true, [0.85, 0.82, 0.95]);
      fx.draw(W.ground, null, Object.assign({ texture: T('sand') }, WALL));
      fx.draw(W.phoneRocks, null, Object.assign({ texture: T('rock') }, ROCK));
      fx.draw(W.phoneSet, null, ROCK);
    } else if (name === 'tower') {
      skyAt(fx, W, T);
      mesasAt(fx, W, T, false, [0.9, 0.86, 0.95]);
      fx.draw(W.ground, null, Object.assign({ texture: T('sand') }, WALL));
      fx.draw(W.towerRocks, null, Object.assign({ texture: T('rock') }, ROCK));
      fx.draw(W.tank, null, Object.assign({ texture: T('tank') }, METALM));
      fx.draw(W.adobe, null, Object.assign({ texture: T('adobe') }, WALL));
      fx.draw(W.towerSet, null, ROCK);
      fx.draw(W.headframe, null, METALM);
      fx.draw(W.towerPlants, null, WALL);
    } else if (name === 'perch') {
      skyAt(fx, W, T);
      mesasAt(fx, W, T, false, [0.92, 0.86, 0.9]);
      fx.draw(W.vistaFloor, null, Object.assign({ texture: T('sand') }, WALL));
      fx.draw(W.vista, null, Object.assign({ texture: T('rock') }, ROCK));
      fx.draw(W.vistaRim, null, Object.assign({ texture: T('rock') }, ROCK));
      fx.draw(W.perch, null, METALM);
    } else if (name === 'hut') {
      if (o.outside) fx.draw(W.hutOut, null, { spec: [0.05, 4], rim: 0.2, noFog: true });
      fx.draw(W.hut, null, Object.assign({ texture: T('planksDark') }, WOODM));
      fx.draw(W.hutCrates, null, Object.assign({ texture: T('crate') }, WOODM));
    } else if (name === 'hall') {
      skyAt(fx, W, T, true);
      fx.draw(W.hallOut, null, { spec: [0.05, 4], rim: 0.2 });
      fx.draw(W.hall, null, Object.assign({ texture: T('planksGrey') }, WOODM));
      fx.draw(W.hallFrame, null, WOODM);
    } else if (name === 'town') {
      skyAt(fx, W, T);
      mesasAt(fx, W, T, true, [0.95, 0.88, 0.85]);
      fx.draw(W.ground, null, Object.assign({ texture: T('sand') }, WALL));
      fx.draw(W.townWall, null, Object.assign({ texture: T('planksCream') }, WALL));
      fx.draw(W.townHouses, null, Object.assign({ texture: T('adobe') }, WALL));
      fx.draw(W.townRocks, null, Object.assign({ texture: T('rock') }, ROCK));
      fx.draw(W.townProps, null, WOODM);
      fx.draw(W.townBoard, null, { texture: T('billboard'), spec: [0.1, 8], rim: 0.3 });
    } else if (name === 'ledge') {
      skyAt(fx, W, T);
      mesasAt(fx, W, T, false, [0.95, 0.9, 0.9]);
      fx.draw(W.ground, M4.translate(0, -6, 0), Object.assign({ texture: T('sand') }, WALL));
      fx.draw(W.ledge, null, ROCK);
    } else if (name === 'sky') {
      skyAt(fx, W, T, false, o.noon);
    }
  }

  window.MsnSets = { build, draw, MIRROR, MIRROR_HOLE, ROOM, ROAD_POLES };
})();
