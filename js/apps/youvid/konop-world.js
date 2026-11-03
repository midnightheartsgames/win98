(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const A = window.KonopArt;

  const TEX = {
    skyDay: [1024, 512, A.sky({ stops: [[0, '#1c5ed8'], [0.5, '#3f8ef0'], [1, '#b8e0fa']], clouds: 70, cloudScale: 0.55, wisps: 40, seed: 11, cloudShade: '#a8c4ec' })],
    skyPale: [1024, 512, A.sky({ stops: [[0, '#4a9ae8'], [0.55, '#8cc8f4'], [1, '#e8f6ff']], clouds: 30, cloudScale: 0.35, wisps: 160, seed: 21, cloudShade: '#c8dcf4', wispCol: 'rgba(255,255,255,0.45)' })],
    skyDawn: [1024, 512, A.sky({ stops: [[0, '#14205a'], [0.5, '#2848a0'], [0.82, '#4878c8'], [1, '#a8c8ec']], stars: 50, wisps: 40, wispCol: 'rgba(150,190,240,0.35)', seed: 31 })],
    skyNight: [1024, 512, A.sky({ stops: [[0, '#040818'], [0.7, '#0c1a3c'], [1, '#2a3a60']], stars: 260, seed: 41 })],
    skySunset: [1024, 512, A.sky({ stops: [[0, '#8a6ab8'], [0.5, '#e89ab0'], [0.85, '#f8c890'], [1, '#ffe4b0']], clouds: 26, cloudScale: 0.55, cloudTop: '#ffd8b8', cloudShade: '#c88aa8', cloudBand: [0.45, 0.85], seed: 51 })],
    skyStorm: [1024, 512, A.sky({ stops: [[0, '#0c0e18'], [0.6, '#262838'], [1, '#5a4a40']], clouds: 30, cloudScale: 0.6, cloudTop: '#3a3a48', cloudShade: '#1a1a24', seed: 61 })],
    skyBright: [1024, 512, A.sky({ stops: [[0, '#2a7ae0'], [0.5, '#6ab4f0'], [1, '#eaf6ff']], clouds: 26, cloudScale: 0.32, wisps: 220, cloudShade: '#d8e8f8', wispCol: 'rgba(255,255,255,0.42)', seed: 71 })],
    panoValley: [1024, 256, A.pano({ seed: 5, ridges: [{ base: 0.62, amp: 0.4, col: '#8eaccc' }, { base: 0.7, amp: 0.25, col: '#6e94a8', trees: '#5a8a8a' }], fields: [0.66], town: [0.35, 0.25], river: '#6aa8d8', haze: 'rgba(200,225,240,0.5)' })],
    panoRock: [1024, 256, A.pano({ seed: 7, ridges: [{ base: 0.75, amp: 0.55, col: '#8a94a8', light: '#c8d0dc' }, { base: 0.88, amp: 0.35, col: '#6a6458', light: '#a49a88' }, { base: 1.0, amp: 0.2, col: '#857a68' }] })],
    panoForest: [1024, 256, A.pano({ seed: 9, ridges: [{ base: 0.7, amp: 0.3, col: '#6a9ab0' }, { base: 0.9, amp: 0.2, col: '#2e6a3a', trees: '#24582e' }] })],
    panoNight: [1024, 256, A.pano({ seed: 13, ridges: [{ base: 0.75, amp: 0.45, col: '#0c1428' }, { base: 0.9, amp: 0.25, col: '#080c18' }] })],
    panoDawn: [1024, 256, A.pano({ seed: 15, ridges: [{ base: 0.8, amp: 0.35, col: '#1a2a5a' }, { base: 0.95, amp: 0.15, col: '#0e1a38' }] })],
    panoSunset: [1024, 256, A.pano({ seed: 17, ridges: [{ base: 0.85, amp: 0.3, col: '#a87a8a' }, { base: 0.95, amp: 0.15, col: '#7a5a6a' }] })],
    panoLake: [1024, 256, A.pano({ seed: 19, ridges: [{ base: 0.75, amp: 0.3, col: '#7aa0b8' }, { base: 0.9, amp: 0.18, col: '#3a8a4a', trees: '#2e7a3e' }] })],
    grass: [512, 512, A.grass('#5cae3c', '#9ad85e', '#3a8a30', 101)],
    grassDeep: [512, 512, A.grass('#3e8e36', '#6cba4a', '#2a6a2a', 103)],
    grassGold: [512, 512, A.grass('#d8a830', '#f4d060', '#b07a1c', 107)],
    grassNight: [512, 512, A.grass('#1c3a3a', '#2e5a52', '#102a2a', 109)],
    fieldsTex: [512, 512, A.speckle('#4a7a4a', ['#5e9258', '#3a6a3e', '#7aa060', '#6a8a50', '#2e5a36'], 113, 900, 26)],
    dirt: [256, 256, A.speckle('#b8a07a', ['#a08a66', '#cab48e', '#94805e'], 127, 400, 8)],
    rockTex: [512, 512, A.rock('#9a958a', '#c8c4b8', '#5e5a52', 131)],
    rockWarm: [512, 512, A.rock('#a8987a', '#d0c4a4', '#6a5a44', 137)],
    rockDark: [512, 512, A.rock('#2a2e3a', '#4a5262', '#14161e', 139)],
    cobble: [256, 256, A.bricks('#b8b0a4', '#7a7268', 149, 8, 6, 26)],
    planks: [256, 256, A.planks('#9a6a3e', '#4a2e18', 151, 6)],
    darkPlanks: [256, 256, A.planks('#5a3a22', '#2a1a0e', 157, 6)],
    barnWood: [256, 256, A.planks('#c8b8a0', '#8a7a64', 163, 10, true)],
    stone: [256, 256, A.stoneBlocks('#d8d4c8', 167)],
    stoneWarm: [256, 256, A.stoneBlocks('#cfc2a8', 169)],
    dungeon: [256, 256, A.stoneBlocks('#3a4250', 173)],
    roofRed: [256, 256, A.tiles('#d0603a', '#7a2a18', 179)],
    roofSlate: [256, 256, A.tiles('#6a6478', '#3a3448', 181)],
    roofPurple: [256, 256, A.tiles('#8a5a7a', '#4a2a44', 191)],
    plaster: [256, 256, A.plaster(193)],
    darkFloor: [512, 512, A.darkFloor],
    lake: [256, 256, A.water('#3a8ad0', '#bfe8ff', 197)],
    stream: [256, 256, A.water('#7ab8c8', '#e8fbff', 199)],
    lily: [128, 128, A.lilyPad],
    treeA: [256, 256, A.treeBill('#7cc85a', '#4a9a3e', '#2a6a2e', '#5a3a22', 211)],
    treeNight: [256, 256, A.treeBill('#2a4a6a', '#1a2e4a', '#0c1830', '#0a0e18', 213)],
    bladesGreen: [512, 128, A.bladeStrip('#3e9a34', '#7ccc4c', 223)],
    bladesDark: [512, 128, A.bladeStrip('#1a1418', '#2a2026', 227, 300)],
    bladesGold: [512, 128, A.bladeStrip('#c08a24', '#f0c850', 229)],
    latticeWarm: [128, 128, A.windowLattice(true)],
    gothic: [128, 256, A.gothicWindow],
    shelves: [256, 256, A.shelves],
    wizSign: [256, 128, A.wizSign]
  };

  function boxAt(b, pos, size, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.box(size[0], size[1], size[2], col);
    if (rotM) b.pop();
    b.pop();
  }

  function ellAt(b, pos, rx, ry, rz, seg, rings, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.ellipsoid(rx, ry, rz, seg, rings, col);
    if (rotM) b.pop();
    b.pop();
  }

  function texQuad(b, a, bq, c, d, uv, col, nrm) {
    const cc = col || [1, 1, 1, 0];
    const n = nrm || V3.norm(V3.cross(V3.sub(bq, a), V3.sub(d, a)));
    const uvs = (uv || [[0, 0], [1, 0], [1, 1], [0, 1]]).map(([u, v]) => [u, 1 - v]);
    b.quad(a, bq, c, d, [cc, cc, cc, cc], uvs, [n, n, n, n]);
  }

  function skyDome(b, R) {
    const nu = 24, nv = 10, e0 = -0.25, e1 = PI / 2;
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const P = (u, v) => {
          const az = u * PI * 2, el = e0 + (e1 - e0) * v;
          return [S(az) * C(el) * R, S(el) * R, -C(az) * C(el) * R];
        };
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const n = [0, -1, 0];
        b.quad(P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1), [1, 1, 1, 1], [[u0 * 3, v0], [u1 * 3, v0], [u1 * 3, v1], [u0 * 3, v1]], [n, n, n, n]);
      }
    }
  }

  function cylinder(b, R, y0, y1, rep, a0, a1) {
    const n = 48;
    const s0 = a0 === undefined ? 0 : a0, s1 = a1 === undefined ? PI * 2 : a1;
    for (let i = 0; i < n; i++) {
      const t0 = s0 + (s1 - s0) * (i / n), t1 = s0 + (s1 - s0) * ((i + 1) / n);
      const P = (a, y) => [S(a) * R, y, -C(a) * R];
      const u0 = (i / n) * rep, u1 = ((i + 1) / n) * rep;
      const nn = [0, 0, 1];
      b.quad(P(t0, y0), P(t1, y0), P(t1, y1), P(t0, y1), [1, 1, 1, 1], [[u0, 0], [u1, 0], [u1, 1], [u0, 1]], [nn, nn, nn, nn]);
    }
  }

  function grid(b, x0, z0, x1, z1, nx, nz, hf, colf, uvk, emis) {
    const P = (i, j) => {
      const x = lerp(x0, x1, i / nx), z = lerp(z0, z1, j / nz);
      return [x, hf(x, z), z];
    };
    const N = (x, z) => {
      const e = 0.2;
      return V3.norm([hf(x - e, z) - hf(x + e, z), 2 * e, hf(x, z - e) - hf(x, z + e)]);
    };
    for (let j = 0; j < nz; j++) {
      for (let i = 0; i < nx; i++) {
        const ps = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
        const cols = ps.map(p => {
          const c = rgb(colf ? colf(p[0], p[2], p[1]) : 0xffffff);
          return [c[0], c[1], c[2], emis || 0];
        });
        const uvs = uvk ? ps.map(p => [p[0] * uvk, p[2] * uvk]) : null;
        b.quad(ps[0], ps[1], ps[2], ps[3], cols, uvs, ps.map(p => N(p[0], p[2])));
      }
    }
  }

  function house(b, x, z, w, d, h, yaw, wall, roof, o) {
    const opt = o || {};
    b.push(M4.translate(x, 0, z), M4.rotY(yaw));
    b.box(w, h, d, wall, { base: true, faces: { bottom: null } });
    const rh = Math.min(w, d) * (opt.pitch || 0.45), ov = 0.35;
    const x0 = -w / 2 - ov, x1 = w / 2 + ov, z0 = -d / 2 - ov, z1 = d / 2 + ov;
    const rc = rgb(roof), rd = [rc[0] * 0.8, rc[1] * 0.8, rc[2] * 0.85, 0];
    b.quad([x0, h - 0.1, z1], [x1, h - 0.1, z1], [x1, h + rh, 0], [x0, h + rh, 0], rc);
    b.quad([x1, h - 0.1, z0], [x0, h - 0.1, z0], [x0, h + rh, 0], [x1, h + rh, 0], rd);
    b.tri([-w / 2, h, d / 2], [-w / 2, h + rh, 0], [-w / 2, h, -d / 2], wall);
    b.tri([w / 2, h, -d / 2], [w / 2, h + rh, 0], [w / 2, h, d / 2], wall);
    if (opt.windows !== false) {
      const win = opt.win || 0x3a4a6a;
      const nw = Math.max(1, Math.floor(w / 2.2));
      for (let k = 0; k < nw; k++) {
        const wx = -w / 2 + (k + 0.5) * (w / nw);
        b.quad([wx - 0.35, h * 0.45, d / 2 + 0.02], [wx + 0.35, h * 0.45, d / 2 + 0.02], [wx + 0.35, h * 0.8, d / 2 + 0.02], [wx - 0.35, h * 0.8, d / 2 + 0.02], win);
        if (h > 5) b.quad([wx - 0.35, h * 0.12, d / 2 + 0.02], [wx + 0.35, h * 0.12, d / 2 + 0.02], [wx + 0.35, h * 0.35, d / 2 + 0.02], [wx - 0.35, h * 0.35, d / 2 + 0.02], win);
      }
    }
    if (opt.dormer) {
      [-1, 1].forEach(sx => {
        const dx = sx * w * 0.22, dz = d * 0.22, dy = h + rh * 0.35;
        b.push(M4.translate(dx, dy, dz));
        b.box(0.9, 0.9, 0.9, wall, { base: true });
        b.quad([-0.6, 0.9, 0.55], [0.6, 0.9, 0.55], [0, 1.4, 0.55], [0, 1.4, 0.55], rc);
        b.quad([-0.6, 0.9, 0.55], [0, 1.4, 0.55], [0, 1.4, -0.4], [-0.6, 0.9, -0.4], rc);
        b.quad([0.6, 0.9, 0.55], [0, 1.4, 0.55], [0, 1.4, -0.4], [0.6, 0.9, -0.4], rd);
        b.quad([-0.25, 0.2, 0.46], [0.25, 0.2, 0.46], [0.25, 0.7, 0.46], [-0.25, 0.7, 0.46], opt.win || 0x3a4a6a);
        b.pop();
      });
    }
    if (opt.chimney) boxAt(b, [w * 0.3, h + rh * 0.7, -d * 0.1], [0.6, 1.6, 0.6], 0xe8e0d0);
    b.pop();
  }

  function tree(b, x, z, s, cols, y) {
    const [top, mid, trunk] = cols || [0x7cc85a, 0x4a9a3e, 0x5a3a22];
    b.push(M4.translate(x, y || 0, z), M4.scale(s, s, s));
    b.prism(6, 0.18, 0.18, 0, 0.12, 0.12, 2.0, trunk);
    ellAt(b, [0, 2.6, 0], 1.3, 1.1, 1.3, 8, 6, mid);
    ellAt(b, [0.3, 3.3, 0.2], 0.95, 0.85, 0.95, 8, 6, top);
    ellAt(b, [-0.5, 2.9, -0.3], 0.9, 0.8, 0.9, 8, 6, mid);
    b.pop();
  }

  function pine(b, x, z, s, col) {
    b.push(M4.translate(x, 0, z), M4.scale(s, s, s));
    b.prism(6, 0.15, 0.15, 0, 0.1, 0.1, 1.0, 0x4a3020);
    [[0.8, 1.6, 1.0], [1.6, 1.2, 0.8], [2.3, 0.9, 0.6], [2.9, 0.6, 0.45]].forEach(([y, h, r]) => b.prism(8, r * 1.4, r * 1.4, y - 0.3, 0.05, 0.05, y + h, col || 0x2a6a4a, { capBottom: true }));
    b.pop();
  }

  function boulder(b, pos, size, col, seed, flatten) {
    const g = rand(seed);
    const seg = 7, rings = 5;
    const jit = [];
    for (let j = 0; j <= rings; j++) {
      jit.push([]);
      for (let i = 0; i <= seg; i++) jit[j].push(0.78 + g() * 0.4);
    }
    for (let j = 0; j <= rings; j++) jit[j][seg] = jit[j][0];
    const P = (i, j) => {
      const th = (j / rings) * PI, ph = (i / seg) * PI * 2;
      const k = jit[j][i];
      let y = C(th) * size[1] * k;
      if (flatten && y < 0) y *= 0.3;
      return [pos[0] + S(th) * S(ph) * size[0] * k, pos[1] + y, pos[2] + S(th) * C(ph) * size[2] * k];
    };
    for (let j = 0; j < rings; j++) {
      for (let i = 0; i < seg; i++) {
        b.tri(P(i, j), P(i, j + 1), P(i + 1, j + 1), col);
        b.tri(P(i, j), P(i + 1, j + 1), P(i + 1, j), col);
      }
    }
  }

  function fence(b, x0, z0, x1, z1, n, col) {
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      boxAt(b, [lerp(x0, x1, k), 0.5, lerp(z0, z1, k)], [0.12, 1.0, 0.12], col);
    }
    const len = Math.hypot(x1 - x0, z1 - z0), yaw = Math.atan2(x1 - x0, z1 - z0);
    [0.35, 0.75].forEach(y => boxAt(b, [(x0 + x1) / 2, y, (z0 + z1) / 2], [0.06, 0.08, len], col, M4.rotY(yaw)));
  }

  function table(b, x, z, w, d, yaw) {
    b.push(M4.translate(x, 0, z), M4.rotY(yaw || 0));
    boxAt(b, [0, 0.76, 0], [w, 0.07, d], 0x8a5a30);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => boxAt(b, [sx * (w / 2 - 0.1), 0.38, sz * (d / 2 - 0.1)], [0.08, 0.76, 0.08], 0x5a3a20));
    [-1, 1].forEach(sz => boxAt(b, [0, 0.45, sz * (d / 2 + 0.28)], [w, 0.06, 0.3], 0x7a4a26));
    b.pop();
  }

  function tankard(b, x, y, z, s) {
    b.push(M4.translate(x, y, z), M4.scale(s, s, s));
    b.prism(10, 0.05, 0.05, 0, 0.05, 0.05, 0.16, 0xc8ccd4, { capBottom: true });
    b.prism(10, 0.052, 0.052, 0.15, 0.056, 0.056, 0.2, rgb(0xfaf6ec, 0.4));
    boxAt(b, [0.065, 0.08, 0], [0.025, 0.1, 0.02], 0xa8acb4);
    b.pop();
  }

  function build(r) {
    const T = {};
    const tex = (key) => {
      if (!T[key]) {
        const d = TEX[key];
        T[key] = r.texture(d[0], d[2], { height: d[1], clamp: d[1] !== d[0] && key.startsWith('pano') });
      }
      return T[key];
    };
    const mesh = (fn) => K.mesh(r, fn);
    const W = { tex, T };

    W.dome = mesh(b => skyDome(b, 160));
    W.panoRing = mesh(b => cylinder(b, 120, -2, 34, 3));
    W.panoNear = mesh(b => cylinder(b, 60, -1, 16, 3));
    W.white = mesh(b => b.quad([-200, -200, -150], [200, -200, -150], [200, 200, -150], [-200, 200, -150], [1, 1, 1, 1]));

    W.town = (() => {
      const g = rand(4242);
      const houses = mesh(b => {
        const walls = [0xf2eadc, 0xe8dcc6, 0xf6f0e4, 0xdcd0bc, 0xeee4d2];
        const roofs = [0xc8583a, 0xd8724a, 0xb84a34, 0x8a6a7a, 0x7a6a74, 0xd06a44, 0xc8603e];
        const B = 26, street = 6;
        for (let bx = -6; bx < 6; bx++) {
          for (let bz = -6; bz < 6; bz++) {
            const x0 = bx * B + street / 2, z0 = bz * B + street / 2, size = B - street;
            const cx = x0 + size / 2, cz = z0 + size / 2;
            if (Math.hypot(cx, cz) > 132) continue;
            if (Math.abs(cx) < 18 && Math.abs(cz + 10) < 18) continue;
            const spots = [[x0 + 5, z0 + 3.5, 0], [x0 + 15, z0 + 3.5, 0], [x0 + 5, z0 + size - 3.5, PI], [x0 + 15, z0 + size - 3.5, PI], [x0 + 3.5, z0 + 10, PI / 2], [x0 + size - 3.5, z0 + 10, -PI / 2]];
            spots.forEach(([x, z, yaw]) => {
              if (Math.abs(riverZ(x) - z) < 10 || g() < 0.12) return;
              house(b, x, z, 7 + g() * 3, 5.5 + g() * 1.5, 5 + g() * 4, yaw, walls[Math.floor(g() * walls.length)], roofs[Math.floor(g() * roofs.length)], { dormer: g() < 0.35, chimney: g() < 0.4 });
            });
            if (g() < 0.5) boxAt(b, [cx, 0.5, cz], [size * 0.5, 1.0, 1.4], 0x4a8a3e);
            if (g() < 0.35) tree(b, cx + (g() - 0.5) * 6, cz + (g() - 0.5) * 6, 1.3 + g() * 0.6, null);
          }
        }
      });
      const ground = mesh(b => {
        grid(b, -160, -160, 160, 160, 32, 32, () => 0, (x, z) => (Math.hypot(x, z) < 150 ? 0xbab4aa : 0x2e4a46), 0, 0);
      });
      const fields = mesh(b => texQuad(b, [-1400, -0.2, -1400], [1400, -0.2, -1400], [1400, -0.2, 1400], [-1400, -0.2, 1400], [[0, 0], [7, 0], [7, 7], [0, 7]], [1, 1, 1, 0.2], [0, 1, 0]));
      const wall = mesh(b => {
        const n = 72;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * PI * 2, R = 152 + S(a * 2) * 4;
          const seg = (PI * 2 * R) / n + 0.6;
          boxAt(b, [S(a) * R, 5, C(a) * R], [seg, 10, 4], 0xe8e4dc, M4.rotY(a + PI / 2));
          if (i % 6 === 0) {
            b.push(M4.translate(S(a) * R, 0, C(a) * R));
            b.prism(10, 4.5, 4.5, 0, 4.5, 4.5, 16, 0xf0ece4);
            b.prism(10, 5, 5, 16, 0.2, 0.2, 21, 0x7a6a7a);
            b.pop();
          }
        }
      });
      const river = mesh(b => {
        for (let x = -700; x < 700; x += 14) {
          const z0 = riverZ(x), z1 = riverZ(x + 14);
          const wd = 7;
          b.quad([x, 0.12, z0 - wd], [x + 14, 0.12, z1 - wd], [x + 14, 0.12, z1 + wd], [x, 0.12, z0 + wd], rgb(0x3a6ad0, 0.35));
        }
      });
      const plaza = mesh(b => {
        b.quad([-16, 0.05, -26], [16, 0.05, -26], [16, 0.05, 6], [-16, 0.05, 6], rgb(0xd8d0c0, 0.1));
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * PI * 2;
          b.push(M4.translate(S(a) * 10, 0, -10 + C(a) * 10));
          b.box(3, 0.6, 1.2, 0x4a8a3a, { base: true });
          b.pop();
        }
      });
      return { houses, ground, fields, wall, river, plaza };
    })();

    W.gate = mesh(b => {
      const stone = 0xe6e2d8, shade = 0xc8c2b4;
      boxAt(b, [-30, 6, 0], [44, 12, 3], stone);
      boxAt(b, [30, 6, 0], [44, 12, 3], stone);
      for (let x = -52; x < 52; x += 6) boxAt(b, [x, 9, 1.6], [0.6, 6, 0.4], shade);
      [-6.5, 6.5].forEach(x => {
        b.push(M4.translate(x, 0, 0.5));
        b.prism(14, 3.4, 3.4, 0, 3.4, 3.4, 19, stone);
        b.prism(14, 3.6, 3.6, 19, 3.6, 3.6, 20, shade);
        for (let k = 0; k < 14; k += 2) {
          const a = (k / 14) * PI * 2;
          boxAt(b, [S(a) * 3.3, 20.6, C(a) * 3.3], [1.0, 1.2, 0.9], stone, M4.rotY(a));
        }
        [[0, 14, 3.35], [0, 9, 3.35]].forEach(([dx, y, rr]) => boxAt(b, [dx, y, rr], [0.7, 1.4, 0.2], 0x3a3a42));
        b.pop();
      });
      boxAt(b, [0, 9, 0.6], [10, 18, 3.8], stone);
      for (let x = -4; x <= 4; x += 2) boxAt(b, [x, 18.6, 2.3], [1.0, 1.2, 0.6], stone);
      b.push(M4.translate(0, 0, 2.55));
      for (let i = 0; i <= 12; i++) {
        const a0 = PI * (i / 12), a1 = PI * ((i + 1) / 12);
        const P = (a, rr) => [C(a) * rr, 4 + S(a) * rr, 0];
        b.quad(P(a0, 3.4), P(a1, 3.4), P(a1, 4.2), P(a0, 4.2), shade);
      }
      b.quad([-3.4, 0, 0], [3.4, 0, 0], [3.4, 4, 0], [-3.4, 4, 0], 0x4a4a50);
      for (let x = -3; x <= 3; x += 1) boxAt(b, [x, 3, 0.1], [0.14, 6, 0.1], 0x6a5a4a);
      for (let y = 1; y <= 6; y += 1.2) boxAt(b, [0, y, 0.12], [6.8, 0.12, 0.1], 0x6a5a4a);
      ellAt(b, [0, 9.5, 0.2], 1.6, 1.4, 0.4, 10, 6, 0xd8d2c4);
      b.pop();
      for (let i = 0; i < 8; i++) ellAt(b, [-11 + i * 0.2, 3 + i * 1.6, 2.2], 0.6, 1.0, 0.3, 6, 4, 0x5a8a4a);
    });
    W.gateRoofs = mesh(b => {
      const g = rand(77);
      const roofs = [0xd0703e, 0xc85a36, 0x6a6474, 0x7a7484, 0xd88050];
      for (let i = 0; i < 42; i++) {
        const row = Math.floor(i / 14);
        const x = -30 + (i % 14) * 4.6 + (g() - 0.5) * 1.5 + row * 2, z = 9 + row * 6.5 + g() * 1.5;
        house(b, x, z, 4.8 + g() * 2, 5 + g() * 2, 3.2 + g() * 1.8 + row * 0.6, (g() < 0.6 ? 0 : PI / 2) + (g() - 0.5) * 0.2, 0xf0e8da, roofs[Math.floor(g() * roofs.length)], { dormer: g() < 0.5, chimney: g() < 0.5, pitch: 0.5 });
      }
      for (let i = 0; i < 6; i++) ellAt(b, [-28 + i * 10 + g() * 3, 2, 4 + g() * 2], 2, 1.6, 1.5, 8, 6, 0x3a7a46);
    });

    W.nightField = mesh(b => {
      grid(b, -80, -120, 80, 20, 20, 20, (x, z) => 0.6 * S(x * 0.05) + 0.4 * C(z * 0.07) - (z < -60 ? (z + 60) * -0.02 : 0), (x, z) => (Math.abs((x * 0.3 + z) % 18) < 9 ? 0x203c46 : 0x1a3240));
      fence(b, -30, -6, 30, -14, 18, 0x2a2a30);
      tree(b, 11, -17, 3.4, [0x1e3448, 0x142638, 0x0e1420]);
      tree(b, 22, -40, 2.4, [0x1e3448, 0x142638, 0x0e1420]);
      boxAt(b, [24, 2, -12], [6, 4, 5], 0x1e2a36);
    });

    W.sky = W.dome;

    W.hill = mesh(b => {
      grid(b, -40, -60, 40, 12, 24, 20, (x, z) => (z > -8 ? 0 : (z + 8) * 0.35 - 0.02 * x * x * 0.02), (x, z, y) => (y < -3 ? 0x5aa858 : 0x6cbc4a), 0.25);
    });
    W.hillBlades = mesh(b => {
      for (let i = 0; i < 10; i++) {
        const x0 = -6 + i * 1.3, z = 1.2 + (i % 3) * 0.2;
        texQuad(b, [x0, 0.75, z], [x0 + 1.6, 0.75, z], [x0 + 1.6, -0.02, z], [x0, -0.02, z], [[i * 0.31, 0], [i * 0.31 + 0.4, 0], [i * 0.31 + 0.4, 1], [i * 0.31, 1]], [1, 1, 1, 0.25], [0, 0, 1]);
      }
    });

    W.meadow = mesh(b => {
      grid(b, -20, -30, 20, 10, 16, 16, (x, z) => (z < -6 ? (z + 6) * -0.12 : 0) + 0.15 * S(x * 0.4), null, 0.25, 0.15);
    });

    W.barn = mesh(b => {
      b.push(M4.translate(-2, 0, -14), M4.rotY(-0.55));
      const wood = 0xd2c4ac, roof = 0x7a4e7a;
      b.box(22, 5.5, 10, wood, { base: true });
      boxAt(b, [-7, 5.5, 0], [8, 3, 10], wood);
      b.quad([-11.6, 5.4, 5.6], [11.6, 5.4, 5.6], [11.6, 8.8, 0], [-11.6, 8.8, 0], roof);
      b.quad([11.6, 5.4, -5.6], [-11.6, 5.4, -5.6], [-11.6, 8.8, 0], [11.6, 8.8, 0], 0x5a3a5a);
      b.quad([-11.6, 7.0, 5.6], [-3, 7.0, 5.6], [-3, 10.6, 0], [-11.6, 10.6, 0], roof);
      b.tri([-11, 5.5, 5], [-11, 10.4, 0], [-11, 5.5, -5], wood);
      b.tri([11, 5.5, -5], [11, 8.6, 0], [11, 5.5, 5], wood);
      for (let x = -10; x <= 10; x += 2.5) boxAt(b, [x, 2.75, 5.06], [0.25, 5.5, 0.1], 0x8a7a64);
      [[-7, 1.8], [-1.5, 1.8], [4, 1.8], [8.5, 1.8]].forEach(([x, w]) => {
        boxAt(b, [x, 1.6, 5.08], [w * 1.4, 3.2, 0.08], 0x4a3e34);
        boxAt(b, [x, 1.6, 5.1], [w * 1.4, 0.15, 0.08], 0xe8dcc8);
      });
      boxAt(b, [-7, 7.4, 5.1], [2, 1.6, 0.1], 0x3a3036);
      b.pop();
      tree(b, 16, -10, 3.2);
      tree(b, 20, -20, 2.6);
      for (let i = 0; i < 14; i++) tree(b, -30 + i * 5, -34 - (i % 3) * 3, 1.6 + (i % 2) * 0.5);
      fence(b, 8, -4, 26, -8, 12, 0x6a5a4a);
    });

    W.forest = mesh(b => {
      const fh = (x, z) => (z < -1 ? (-z - 1) * 0.32 : 0) + 0.12 * S(x * 0.9) * (z < -1 ? 1 : 0.3);
      grid(b, -20, -30, 20, 10, 20, 20, fh, (x, z) => (S(x * 2 + z) > 0.4 ? 0x7a6a44 : 0x4a8a3a), 0, 0.05);
      const g = rand(91);
      for (let i = 0; i < 26; i++) {
        const x = -18 + g() * 36, z = -26 + g() * 16;
        tree(b, x, z, 1.4 + g() * 1.2, [0x5aa04a, 0x3a7a3a, 0x4a3020], fh(x, z));
      }
      for (let i = 0; i < 34; i++) {
        const x = -14 + g() * 28, z = -8 + g() * 10;
        ellAt(b, [x, fh(x, z), z], 0.6 + g() * 0.8, 0.5 + g() * 0.5, 0.7, 7, 5, g() < 0.5 ? 0x4a9a3e : 0x6ab84e);
      }
    });

    W.goldField = mesh(b => {
      grid(b, -12, -12, 12, 12, 8, 8, () => 0, null, 0.3, 0.2);
    });

    W.guild = mesh(b => {
      boxAt(b, [0, 4, -8], [24, 8, 0.4], 0x6a4428);
      boxAt(b, [-12, 4, 0], [0.4, 8, 18], 0x6a4428);
      boxAt(b, [12, 4, 0], [0.4, 8, 18], 0x6a4428);
      for (let x = -9; x <= 9; x += 4.5) {
        boxAt(b, [x, 3.5, -7.6], [1.6, 4.6, 0.2], 0x2a1a10);
        boxAt(b, [x, 3.5, -7.5], [1.3, 4.2, 0.1], rgb(0xe8c890, 0.8));
        boxAt(b, [x, 3.5, -7.45], [0.08, 4.2, 0.1], 0x3a2414);
      }
      [[-6, -3], [6, -3], [-6, 4], [6, 4], [-2, -6], [2, -6]].forEach(([x, z]) => {
        b.push(M4.translate(x, 0, z));
        b.prism(8, 0.35, 0.35, 0, 0.35, 0.35, 8, 0x8a5a30);
        b.prism(8, 0.5, 0.5, 0, 0.5, 0.5, 0.4, 0x5a3a22);
        b.pop();
      });
      table(b, -3.5, 0.5, 2.4, 1.0, 0);
      table(b, 3.5, 0.5, 2.4, 1.0, 0);
      table(b, -3.5, -4, 2.4, 1.0, 0);
      table(b, 3, -4.2, 2.4, 1.0, 0.1);
      table(b, 0, 4, 2.4, 1.0, 0);
      [[-3.8, 0.84, 0.3], [-3.0, 0.84, 0.6], [3.3, 0.84, 0.4], [-3.2, 0.84, -4.1], [0.4, 0.84, 4.1]].forEach(([x, y, z]) => tankard(b, x, y, z, 1));
      ellAt(b, [-3.4, 0.86, 0.6], 0.25, 0.08, 0.18, 8, 4, 0x8a4a20);
      for (let i = 0; i < 10; i++) boxAt(b, [-10 + i * 0.6, i * 0.3 + 0.15, -6], [0.6, 0.3, 2], 0x7a4a26);
      boxAt(b, [-7, 3.1, -6.0], [0.1, 3, 0.1], 0x3a2414);
      [[-5, -2], [5, -2], [0, 2]].forEach(([x, z]) => {
        boxAt(b, [x, 6.2, z], [0.04, 1.6, 0.04], 0x2a1a10);
        ellAt(b, [x, 5.3, z], 0.22, 0.3, 0.22, 8, 6, rgb(0xffd890, 1));
      });
    });
    W.guildFloor = mesh(b => texQuad(b, [-12, 0, -8], [12, 0, -8], [12, 0, 10], [-12, 0, 10], [[0, 0], [6, 0], [6, 4.5], [0, 4.5]], [1, 1, 1, 0.1], [0, 1, 0]));

    W.street = mesh(b => {
      const g = rand(303);
      for (let i = 0; i < 6; i++) {
        house(b, -9, -4 - i * 8, 6, 7, 7 + g() * 3, PI / 2, 0xf0e6d6, [0xb8583a, 0x7a6a7a][i % 2], { dormer: true, chimney: true });
        house(b, 9, -4 - i * 8, 6, 7, 7 + g() * 3, -PI / 2, 0xe8dcc8, [0x7a6a7a, 0xc8603e][i % 2], { dormer: true });
      }
      for (let i = 0; i < 4; i++) boxAt(b, [-5.8, 1.5, -6 - i * 8], [0.4, 3, 2.5], 0x6a4a2e);
    });
    W.streetFloor = mesh(b => texQuad(b, [-12, 0, -60], [12, 0, -60], [12, 0, 6], [-12, 0, 6], [[0, 0], [4, 0], [4, 11], [0, 11]], [1, 1, 1, 0.1], [0, 1, 0]));

    W.castle = mesh(b => {
      const st = 0xd8d0c0, sh = 0xb8b0a0;
      boxAt(b, [2, 7, -14], [30, 14, 4], st);
      for (let x = -12; x <= 16; x += 2) boxAt(b, [x, 14.6, -12.2], [1, 1.2, 0.6], st);
      b.push(M4.translate(-10, 0, -10));
      b.prism(14, 4, 4, 0, 4, 4, 22, st);
      b.prism(14, 4.3, 4.3, 22, 4.3, 4.3, 23, sh);
      for (let k = 0; k < 14; k += 2) {
        const a = (k / 14) * PI * 2;
        boxAt(b, [S(a) * 4, 23.6, C(a) * 4], [1.2, 1.2, 1], st, M4.rotY(a));
      }
      [8, 13, 18].forEach(y => boxAt(b, [0, y, 4.0], [0.8, 1.6, 0.2], 0x3a3a46));
      b.pop();
      b.push(M4.translate(14, 0, -10));
      b.prism(12, 3.4, 3.4, 0, 3.4, 3.4, 18, st);
      b.prism(12, 3.7, 3.7, 18, 0.3, 0.3, 24, 0x8a6a7a);
      b.pop();
      b.push(M4.translate(4, 0, -11.9));
      for (let i = 0; i <= 12; i++) {
        const a0 = PI * (i / 12), a1 = PI * ((i + 1) / 12);
        const P = (a, rr) => [C(a) * rr, 5 + S(a) * rr, 0];
        b.quad(P(a0, 3.2), P(a1, 3.2), P(a1, 4.0), P(a0, 4.0), sh);
      }
      b.quad([-3.2, 0, 0], [3.2, 0, 0], [3.2, 5, 0], [-3.2, 5, 0], 0x5a5048);
      for (let x = -2.8; x <= 2.8; x += 0.8) boxAt(b, [x, 3.4, 0.1], [0.12, 6.4, 0.1], 0x4a3a2e);
      ellAt(b, [0, 10.5, 0.2], 1.8, 1.6, 0.5, 10, 6, 0xc8c0b0);
      b.pop();
      [-20, -16, 22, 26].forEach((x, i) => pine(b, x, -4 - i, 3.2, 0x2a6a50));
      boxAt(b, [6, 16, -12], [0.15, 4, 0.15], 0x6a5a4a);
      b.quad([6, 17.5, -12], [8, 17.2, -12], [8, 16.6, -12], [6, 16.4, -12], 0xe86a8a);
    });

    W.dungeon = mesh(b => {
      boxAt(b, [0, 3, -6], [16, 6, 0.6], 0x2e3440);
      boxAt(b, [-7, 3, 0], [0.6, 6, 14], 0x262c38);
      boxAt(b, [7, 3, 0], [0.6, 6, 14], 0x262c38);
      [[-4, -5.6], [4, -5.6]].forEach(([x, z]) => {
        boxAt(b, [x, 3.2, z], [0.12, 0.6, 0.3], 0x4a3020);
        ellAt(b, [x, 3.7, z + 0.1], 0.14, 0.25, 0.14, 8, 6, rgb(0xffb040, 1));
      });
    });
    W.dungeonFloor = mesh(b => texQuad(b, [-8, 0, -6], [8, 0, -6], [8, 0, 8], [-8, 0, 8], [[0, 0], [4, 0], [4, 3.5], [0, 3.5]], [1, 1, 1, 0.05], [0, 1, 0]));
    W.dungeonWall = mesh(b => {
      texQuad(b, [-8, 6, -5.7], [8, 6, -5.7], [8, 0, -5.7], [-8, 0, -5.7], [[0, 0], [4, 0], [4, 1.5], [0, 1.5]], [1, 1, 1, 0.05], [0, 0, 1]);
      texQuad(b, [-6.7, 6, -6], [-6.7, 6, 8], [-6.7, 0, 8], [-6.7, 0, -6], [[0, 0], [3.5, 0], [3.5, 1.5], [0, 1.5]], [1, 1, 1, 0.05], [1, 0, 0]);
      texQuad(b, [6.7, 6, 8], [6.7, 6, -6], [6.7, 0, -6], [6.7, 0, 8], [[0, 0], [3.5, 0], [3.5, 1.5], [0, 1.5]], [1, 1, 1, 0.05], [-1, 0, 0]);
    });

    W.camp = mesh(b => {
      grid(b, -14, -14, 14, 14, 12, 12, (x, z) => (Math.hypot(x, z) > 6 ? (Math.hypot(x, z) - 6) * 0.2 : 0), (x, z) => (Math.hypot(x, z) < 6 ? 0x3a4a2a : 0x1e3a2e), 0, 0.05);
      const g = rand(515);
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * PI * 2 + g() * 0.2, rr = 8 + g() * 4;
        tree(b, S(a) * rr, C(a) * rr, 1.6 + g() * 0.8, [0x2a4a6a, 0x1c3456, 0x0e1626], (rr - 6) * 0.2);
      }
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * PI * 2;
        boxAt(b, [S(a) * 0.55, 0.08, C(a) * 0.55], [0.12, 0.12, 0.9], 0x3a2414, M4.rotY(a));
      }
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * PI * 2;
        boulder(b, [S(a) * 0.95, 0.05, C(a) * 0.95], [0.16, 0.12, 0.14], 0x5a5a5e, 520 + i);
      }
    });

    W.lakeWater = mesh(b => texQuad(b, [-60, 0, -60], [60, 0, -60], [60, 0, 20], [-60, 0, 20], [[0, 0], [16, 0], [16, 11], [0, 11]], [1, 1, 1, 0.35], [0, 1, 0]));
    W.lakeShore = mesh(b => {
      grid(b, -60, -60, 60, -26, 16, 6, (x, z) => (z > -34 ? (-34 - z) * -0.0 : 0.4 + 0.3 * S(x * 0.3)), () => 0x4aa046, 0, 0.1);
      const g = rand(616);
      for (let i = 0; i < 30; i++) tree(b, -55 + i * 3.8 + g(), -38 - g() * 10, 1.6 + g() * 1.2, [0x5ab04a, 0x3a8a3a, 0x4a3020], 0.4);
    });
    W.lily = mesh(b => {
      const g = rand(717);
      const pads = [[-2.6, 0.6, 1.6], [0.5, -1.4, 1.2], [2.8, -0.2, 1.4], [-0.4, 2.6, 0.9], [4.2, 2.2, 1.0], [-4.6, -2.8, 1.3], [1.8, -4.2, 1.0], [-3.0, -6.0, 1.1], [5.4, -3.6, 0.8], [-6.2, 1.8, 0.9]];
      pads.forEach(([x, z, rr]) => {
        const a = g() * PI * 2;
        b.push(M4.translate(x, 0.04, z), M4.rotY(a));
        texQuad(b, [-rr, 0, -rr], [rr, 0, -rr], [rr, 0, rr], [-rr, 0, rr], null, [1, 1, 1, 0.2], [0, 1, 0]);
        b.pop();
      });
    });
    W.lotus = mesh(b => {
      [[3.6, 1.2], [-5.0, -1.0], [6.0, -2.0]].forEach(([x, z]) => {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * PI * 2;
          b.push(M4.translate(x, 0.08, z), M4.rotY(a), M4.rotX(-0.6));
          b.quad([-0.12, 0, 0], [0.12, 0, 0], [0.06, 0.32, 0], [-0.06, 0.32, 0], rgb(0xf6a8d0, 0.3));
          b.pop();
        }
        ellAt(b, [x, 0.12, z], 0.08, 0.06, 0.08, 6, 4, rgb(0xf8e070, 0.4));
      });
    });

    W.sunset = mesh(b => {
      grid(b, -40, -60, 40, 10, 12, 12, (x, z) => 0.3 * S(x * 0.2), () => 0x8a5a4a, 0, 0.0);
    });
    W.sunsetBlades = mesh(b => {
      for (let i = 0; i < 9; i++) {
        const x0 = -9 + i * 2.2, z = 2.2 + (i % 2) * 0.4;
        texQuad(b, [x0, 1.5, z], [x0 + 2.6, 1.5, z], [x0 + 2.6, -0.02, z], [x0, -0.02, z], [[i * 0.27, 0], [i * 0.27 + 0.45, 0], [i * 0.27 + 0.45, 1], [i * 0.27, 1]], [1, 1, 1, 1], [0, 0, 1]);
      }
    });

    W.stage = mesh(b => texQuad(b, [-30, 0, -30], [30, 0, -30], [30, 0, 30], [-30, 0, 30], [[0, 0], [12, 0], [12, 12], [0, 12]], [1, 1, 1, 0.6], [0, 1, 0]));

    W.waste = mesh(b => {
      grid(b, -60, -90, 60, 20, 24, 22, (x, z) => 0.5 * S(x * 0.15) * C(z * 0.11) + (z < -40 ? (z + 40) * -0.08 : 0), null, 0.12, 0.12);
    });
    W.wasteRocks = mesh(b => {
      const g = rand(818);
      for (let i = 0; i < 40; i++) {
        const x = (g() - 0.5) * 80, z = -10 - g() * 70, s = 0.5 + g() * 2.5;
        boulder(b, [x, 0, z], [s * 1.3, s * 0.8, s], g() < 0.5 ? 0x8a8478 : 0x6e695e, 900 + i, true);
      }
      for (let i = 0; i < 6; i++) {
        const x = -30 + i * 12, z = -60 - (i % 2) * 10;
        boulder(b, [x, 0, z], [6 + i % 3, 10 + (i % 2) * 4, 5], 0x7a7466, 960 + i, true);
      }
    });

    W.cliff = mesh(b => {
      boulder(b, [0, -6, 0], [9, 6.2, 7], 0x8a8478, 1001, false);
      boulder(b, [-6, -4, 3], [5, 4.5, 4], 0x7a7468, 1003, false);
      boulder(b, [6, -5, -3], [6, 5.4, 5], 0x948e80, 1005, false);
    });
    W.cliffTop = mesh(b => {
      grid(b, -6, -6, 6, 6, 8, 8, (x, z) => -0.08 * (x * x + z * z) * 0.25 + 0.1 * S(x * 2) * C(z * 1.6), null, 0.3, 0.1);
    });

    W.valley = mesh(b => {
      grid(b, -200, -400, 200, 40, 26, 30, (x, z) => 6 * S(x * 0.02 + 1) * C(z * 0.015) + (z < -200 ? (z + 200) * -0.25 : 0) + (Math.abs(x) > 120 ? (Math.abs(x) - 120) * 0.3 : 0), (x, z, y) => (y > 10 ? 0x3a3428 : 0x4a3e30), 0, 0.05);
    });

    W.shop = mesh(b => {
      boxAt(b, [0, 0.42, -0.9], [4, 0.84, 0.8], 0x6a3a1e);
      boxAt(b, [0, 0.86, -0.9], [4.2, 0.06, 0.9], 0x8a5028);
      boxAt(b, [0, 2.2, -2.6], [8, 4.4, 0.2], 0x4a2a16);
      [[-2.6, 2.6], [0, 2.6], [2.6, 2.6]].forEach(([x, y]) => boxAt(b, [x, y, -2.45], [2.2, 2.4, 0.06], 0x2a160c));
      [[0.9, 0.9, -0.8]].forEach(([x, y, z]) => {
        boxAt(b, [x, y + 0.02, z], [0.36, 0.04, 0.2], 0xc8a040);
        boxAt(b, [x, y + 0.25, z], [0.03, 0.45, 0.03], 0xc8a040);
        boxAt(b, [x, y + 0.46, z], [0.42, 0.02, 0.02], 0xc8a040);
        [-0.2, 0.2].forEach(dx => {
          boxAt(b, [x + dx, y + 0.32, z], [0.01, 0.26, 0.01], 0xa88a30);
          b.push(M4.translate(x + dx, y + 0.18, z));
          b.prism(10, 0.09, 0.09, 0, 0.11, 0.11, 0.03, 0xd8b048, { capBottom: true });
          b.pop();
        });
      });
      for (let i = 0; i < 6; i++) {
        b.push(M4.translate(-1.6 + i * 0.22, 0.89, -0.95));
        b.prism(8, 0.06, 0.06, 0, 0.03, 0.03, 0.25, [0x5aa8a0, 0x8a3a7a, 0xc8a040][i % 3], { capBottom: true });
        b.pop();
      }
      ellAt(b, [-0.7, 0.94, -0.95], 0.22, 0.1, 0.12, 8, 5, 0x8a6a3a);
    });
    W.shopWalls = mesh(b => {
      texQuad(b, [-4, 4.4, -2.48], [4, 4.4, -2.48], [4, 0, -2.48], [-4, 0, -2.48], [[0, 0], [2, 0], [2, 1], [0, 1]], [1, 1, 1, 0.15], [0, 0, 1]);
    });
    W.shopWindows = mesh(b => {
      [[-2.6, 2.6], [0, 2.6], [2.6, 2.6]].forEach(([x, y]) => texQuad(b, [x - 1.0, y + 1.1, -2.4], [x + 1.0, y + 1.1, -2.4], [x + 1.0, y - 1.1, -2.4], [x - 1.0, y - 1.1, -2.4], null, [1, 1, 1, 1], [0, 0, 1]));
    });
    W.shopFront = mesh(b => {
      boxAt(b, [0, 3, 0], [12, 6, 0.3], 0x4a2a16);
      boxAt(b, [-2, 2.6, 0.1], [3.6, 3.2, 0.1], 0x2a160c);
      boxAt(b, [3, 3.2, 0.1], [0.1, 1.5, 0.1], 0x2a2a2a);
    });
    W.shopFrontWin = mesh(b => texQuad(b, [-3.6, 4.1, 0.2], [-0.4, 4.1, 0.2], [-0.4, 1.1, 0.2], [-3.6, 1.1, 0.2], null, [1, 1, 1, 1], [0, 0, 1]));
    W.shopSign = mesh(b => texQuad(b, [1.6, 3.5, 0.3], [4.4, 3.5, 0.3], [4.4, 2.1, 0.3], [1.6, 2.1, 0.3], null, [1, 1, 1, 0.5], [0, 0, 1]));

    W.roof = mesh(b => {
      b.push(M4.rotZ(0.35));
      texQuad(b, [-12, 0, -4], [12, 0, -4], [12, 0, 4], [-12, 0, 4], [[0, 0], [6, 0], [6, 2], [0, 2]], [1, 1, 1, 0.1], [0, 1, 0]);
      b.pop();
    });
    W.roofSolid = mesh(b => {
      boxAt(b, [-1.5, 0.4, 0], [1.2, 2.4, 1.2], 0xc8b8a8);
      boxAt(b, [-1.5, 1.65, 0], [1.4, 0.2, 1.4], 0x8a7a6a);
    });

    W.hall = mesh(b => {
      boxAt(b, [0, -0.05, -10], [40, 0.1, 40], 0x0a1424);
      for (let i = 0; i < 7; i++) {
        boxAt(b, [-14, 8, -28 + i * 6], [1, 16, 1.2], 0x08101c);
        boxAt(b, [14, 8, -28 + i * 6], [1, 16, 1.2], 0x08101c);
      }
      boxAt(b, [0, 8, -30], [30, 16, 0.5], 0x050a14);
    });
    W.hallWindows = mesh(b => {
      for (let i = 0; i < 6; i++) {
        texQuad(b, [-14.4, 13, -25 + i * 6], [-14.4, 13, -22 + i * 6], [-14.4, 3, -22 + i * 6], [-14.4, 3, -25 + i * 6], null, [1, 1, 1, 1], [1, 0, 0]);
        texQuad(b, [14.4, 13, -22 + i * 6], [14.4, 13, -25 + i * 6], [14.4, 3, -25 + i * 6], [14.4, 3, -22 + i * 6], null, [1, 1, 1, 1], [-1, 0, 0]);
      }
    });

    W.streamSet = mesh(b => {
      grid(b, -16, -50, 16, 6, 16, 20, (x, z) => (Math.abs(x + 0.6 * S(z * 0.15) * 3) < 2.2 ? -0.15 : 0.05 * Math.abs(x)) + 0.3 * S(z * 0.2), (x, z, y) => (y < -0.05 ? 0x7a9aa0 : 0x5aa04a), 0, 0.1);
      const g = rand(1111);
      for (let i = 0; i < 26; i++) {
        const side = i % 2 ? 1 : -1;
        tree(b, side * (5 + g() * 8), -4 - g() * 44, 1.8 + g() * 1.2, [0x6ab84e, 0x3a8a3e, 0x4a3020], 0.3);
      }
      for (let i = 0; i < 30; i++) ellAt(b, [(i % 2 ? 1 : -1) * (2.6 + g() * 2), 0.2, -2 - g() * 40], 0.8, 0.5, 0.8, 7, 5, g() < 0.5 ? 0x4a9a3e : 0x7ac85a);
    });
    W.streamWater = mesh(b => {
      for (let z = -50; z < 6; z += 2) {
        const c0 = -0.6 * S(z * 0.15) * 3, c1 = -0.6 * S((z + 2) * 0.15) * 3;
        texQuad(b, [c0 - 2.0, -0.05, z], [c0 + 2.0, -0.05, z], [c1 + 2.0, -0.05, z + 2], [c1 - 2.0, -0.05, z + 2], [[0, z * 0.2], [1, z * 0.2], [1, z * 0.2 + 0.4], [0, z * 0.2 + 0.4]], [1, 1, 1, 0.4], [0, 1, 0]);
      }
    });

    W.finale = mesh(b => {
      grid(b, -3, -4, 16, 4, 14, 6, (x, z) => 0.12 * S(x * 0.9 + z) - 0.02 * x, (x, z) => (S(x * 3 + z * 2) > 0.3 ? 0xc4beb0 : 0xa8a294), 0, 0.05);
      b.push(M4.translate(5, 0, 0));
      b.prism(9, 9.6, 4.6, -80, 9.2, 4.2, -0.05, 0x9a9488, { flat: true, phase: 0.3 });
      b.pop();
      b.push(M4.translate(-1, 0, 2));
      b.prism(7, 4, 3, -80, 3, 2.4, -1.5, 0x8a8478, { flat: true, phase: 0.8 });
      b.pop();
      boulder(b, [12, -3, 3], [5, 4, 3], 0xb0aa9c, 1207, false);
    });
    W.finaleValley = mesh(b => {
      texQuad(b, [-900, -60, -900], [900, -60, -900], [900, -60, 300], [-900, -60, 300], [[0, 0], [6, 0], [6, 4], [0, 4]], [1, 1, 1, 0.3], [0, 1, 0]);
    });
    W.finaleTown = mesh(b => {
      const g = rand(1301);
      for (let i = 0; i < 420; i++) {
        const x = -260 + g() * 300, z = -420 + g() * 140;
        b.push(M4.translate(x, -59.8, z));
        b.box(3 + g() * 3, 1.5, 3, g() < 0.6 ? 0xc86a4a : 0xe8dcc8, { base: true });
        b.pop();
      }
      for (let x = -900; x < 400; x += 20) {
        const z0 = -260 + 60 * S(x * 0.01), z1 = -260 + 60 * S((x + 20) * 0.01);
        b.quad([x, -59.7, z0 - 4], [x + 20, -59.7, z1 - 4], [x + 20, -59.7, z1 + 4], [x, -59.7, z0 + 4], rgb(0x4a8ad8, 0.5));
      }
    });

    W.props = {
      tankard: mesh(b => tankard(b, 0, 0, 0, 1)),
      lilyQuad: mesh(b => texQuad(b, [-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1], null, [1, 1, 1, 0.2], [0, 1, 0]))
    };

    W.SETS = SETS;
    return W;
  }

  function riverZ(x) {
    return 30 * S(x * 0.012 + 0.6) + 18 * S(x * 0.031);
  }

  let EYE = [0, 0, 0];

  function sky(r, W, key, spin, o) {
    const m = M4.chain(M4.translate(EYE[0], EYE[1] + (o && o.dy || 0), EYE[2]), M4.rotY(spin || 0));
    r.draw(W.dome, m, { texture: W.tex(key), noFog: true, tint: o && o.tint, blend: true, alpha: 1 });
  }

  function pano(r, W, key, o) {
    const p = o || {};
    const m = M4.chain(M4.translate(EYE[0], p.y || 0, EYE[2]), M4.rotY(p.spin || 0), M4.scale(p.s || 1, p.sy || p.s || 1, p.s || 1));
    r.draw(p.near ? W.panoNear : W.panoRing, m, { texture: W.tex(key), noFog: !p.fog, tint: p.tint, blend: true, alpha: 1 });
  }

  const I = M4.ident();

  const SETS = {
    none() {},
    white() {},
    town(r, W, o) {
      sky(r, W, o.sky || 'skyDawn', o.spin, { tint: o.skyTint });
      r.draw(W.town.fields, I, { texture: W.tex('fieldsTex'), tint: [0.62, 0.78, 0.82] });
      r.draw(W.town.ground, I);
      r.draw(W.town.river, I);
      r.draw(W.town.plaza, I);
      r.draw(W.town.wall, I);
      r.draw(W.town.houses, I);
    },
    gate(r, W, o) {
      sky(r, W, o.sky || 'skyDay', o.spin || 0.3, { tint: o.skyTint });
      r.draw(W.gate, I);
      r.draw(W.gateRoofs, I);
    },
    nightField(r, W, o) {
      sky(r, W, 'skyDawn', o.spin || 1.2);
      pano(r, W, 'panoDawn', { spin: 0.4 });
      r.draw(W.nightField, I);
    },
    sky(r, W, o) {
      sky(r, W, o.sky || 'skyPale', o.spin || 0, { tint: o.skyTint });
    },
    hill(r, W, o) {
      sky(r, W, 'skyDay', o.spin || 0.2);
      pano(r, W, 'panoValley', { spin: o.panoSpin || 0, y: -18 });
      r.draw(W.hill, I, { texture: W.tex('grass') });
      r.draw(W.hillBlades, I, { texture: W.tex('bladesGreen') });
    },
    meadow(r, W, o) {
      sky(r, W, 'skyDay', o.spin || 0);
      pano(r, W, 'panoForest', { spin: o.panoSpin || 0, y: -2 });
      r.draw(W.meadow, I, { texture: W.tex(o.ground || 'grass') });
    },
    barn(r, W, o) {
      sky(r, W, 'skyDay', o.spin || 0.5);
      pano(r, W, 'panoForest', { spin: 0.3, y: -3 });
      r.draw(W.meadow, M4.scale(3, 1, 3), { texture: W.tex('grass') });
      r.draw(W.barn, I);
    },
    forest(r, W, o) {
      sky(r, W, 'skyDay', 0.8);
      pano(r, W, 'panoForest', { spin: 0.2, y: -2 });
      r.draw(W.forest, I);
    },
    goldField(r, W) {
      r.draw(W.goldField, I, { texture: W.tex('grassGold') });
    },
    guild(r, W) {
      r.draw(W.guildFloor, I, { texture: W.tex('planks') });
      r.draw(W.guild, I);
    },
    street(r, W, o) {
      sky(r, W, 'skyDay', o.spin || 0.1);
      r.draw(W.streetFloor, I, { texture: W.tex('cobble') });
      r.draw(W.street, I);
    },
    castle(r, W, o) {
      sky(r, W, 'skyDay', o.spin || 0.9);
      r.draw(W.meadow, M4.scale(3, 1, 3), { texture: W.tex('grass') });
      r.draw(W.streetFloor, M4.chain(M4.translate(3, 0.02, 4), M4.scale(0.5, 1, 0.3)), { texture: W.tex('cobble') });
      r.draw(W.castle, I);
    },
    dungeon(r, W) {
      r.draw(W.dungeonFloor, I, { texture: W.tex('dungeon') });
      r.draw(W.dungeonWall, I, { texture: W.tex('dungeon') });
      r.draw(W.dungeon, I);
    },
    camp(r, W) {
      r.draw(W.camp, I);
    },
    lake(r, W, o) {
      sky(r, W, 'skyDay', o.spin || 0.6);
      pano(r, W, 'panoLake', { spin: 0.1, y: -1 });
      r.draw(W.lakeWater, I, { texture: W.tex('lake'), uvScroll: [o.t * 0.01, 0] });
      r.draw(W.lakeShore, I);
      r.draw(W.lily, I, { texture: W.tex('lily') });
      r.draw(W.lotus, I);
    },
    sunset(r, W, o) {
      sky(r, W, 'skySunset', o.spin || 0);
      pano(r, W, 'panoSunset', { spin: 0.5, y: -2 });
      r.draw(W.sunset, I);
      r.draw(W.sunsetBlades, I, { texture: W.tex('bladesDark') });
    },
    stage(r, W, o) {
      r.draw(W.stage, I, { texture: W.tex('darkFloor'), uvScroll: [0, (o.t || 0) * 0.004] });
    },
    waste(r, W, o) {
      sky(r, W, o.sky || 'skyDay', o.spin || 0);
      pano(r, W, 'panoRock', { spin: o.panoSpin || 0, y: -6 });
      r.draw(W.waste, I, { texture: W.tex('rockWarm') });
      r.draw(W.wasteRocks, I);
    },
    cliff(r, W, o) {
      sky(r, W, o.sky || 'skyDay', o.spin || 0);
      pano(r, W, o.pano || 'panoRock', { spin: o.panoSpin || 0, y: -30 });
      r.draw(W.cliff, I);
      r.draw(W.cliffTop, I, { texture: W.tex('rockTex') });
    },
    valley(r, W, o) {
      sky(r, W, 'skyStorm', o.spin || 0);
      pano(r, W, 'panoNight', { spin: 0.2, y: -10 });
      r.draw(W.valley, I, { texture: W.tex('rockWarm') });
    },
    shop(r, W) {
      r.draw(W.guildFloor, I, { texture: W.tex('darkPlanks') });
      r.draw(W.shopWalls, I, { texture: W.tex('shelves') });
      r.draw(W.shopWindows, I, { texture: W.tex('latticeWarm') });
      r.draw(W.shop, I);
    },
    shopFront(r, W) {
      r.draw(W.shopFront, I);
      r.draw(W.shopFrontWin, I, { texture: W.tex('latticeWarm') });
      r.draw(W.shopSign, I, { texture: W.tex('wizSign') });
    },
    roof(r, W, o) {
      sky(r, W, 'skyDay', o.spin || 0.4);
      r.draw(W.roof, I, { texture: W.tex('roofRed') });
      r.draw(W.roofSolid, I);
    },
    hall(r, W) {
      r.draw(W.hall, I);
      r.draw(W.hallWindows, I, { texture: W.tex('gothic') });
    },
    stream(r, W, o) {
      sky(r, W, 'skyDay', o.spin || 0.3);
      pano(r, W, 'panoForest', { y: -2 });
      r.draw(W.streamSet, I);
      r.draw(W.streamWater, I, { texture: W.tex('stream'), uvScroll: [0, -(o.t || 0) * 0.2] });
    },
    finale(r, W, o) {
      sky(r, W, 'skyDay', o.spin || 0.1);
      pano(r, W, 'panoValley', { y: -70, s: 1.5, spin: 0.35 });
      r.draw(W.finaleValley, I, { texture: W.tex('fieldsTex') });
      r.draw(W.finaleTown, I);
      r.draw(W.finale, I, {});
    }
  };

  function draw(r, W, st) {
    const fn = SETS[st.set] || SETS.none;
    EYE = (st.camera && st.camera.eye) || [0, 0, 0];
    fn(r, W, Object.assign({ t: st.t }, st.world || {}));
  }

  window.KonopWorld = { TEX, build, draw, house, tree, pine, boulder, texQuad, boxAt, ellAt, grid, tankard };
})();
