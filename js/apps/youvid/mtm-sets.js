(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Props = window.MedProps;

  const LAB = { x0: -3.5, x1: 3.5, z0: -2.4, z1: 3.6, h: 3.2 };
  const WIN = { x0: 0.2, x1: 1.6, y0: 1.5, y1: 2.6 };

  function wallQuad(b, a, c, d, e, tile, col, flipU) {
    const w = V3.len(V3.sub(c, a)), h = V3.len(V3.sub(e, a));
    const n = V3.norm(V3.cross(V3.sub(c, a), V3.sub(e, a)));
    const u = w / tile, v = h / tile;
    const uvs = flipU ? [[u, 0], [0, 0], [0, v], [u, v]] : [[0, 0], [u, 0], [u, v], [0, v]];
    b.quad(a, c, d, e, col || 0xffffff, uvs, [n, n, n, n]);
  }

  function panel(b, x0, y0, x1, y1, z, tile, faceZ) {
    if (faceZ > 0) wallQuad(b, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], tile);
    else wallQuad(b, [x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z], tile);
  }

  function panelX(b, z0, y0, z1, y1, x, tile, faceX) {
    if (faceX > 0) wallQuad(b, [x, y0, z1], [x, y0, z0], [x, y1, z0], [x, y1, z1], tile);
    else wallQuad(b, [x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], tile);
  }

  function labFloor(b) {
    wallQuad(b, [LAB.x0, 0, LAB.z1], [LAB.x1, 0, LAB.z1], [LAB.x1, 0, LAB.z0], [LAB.x0, 0, LAB.z0], 1.2);
    return b;
  }

  function labLow(b) {
    panel(b, LAB.x0, 0, LAB.x1, 1.2, LAB.z0, 1.0, 1);
    panelX(b, LAB.z0, 0, LAB.z1, 1.2, LAB.x0, 1.0, 1);
    panelX(b, LAB.z0, 0, LAB.z1, 1.2, LAB.x1, 1.0, -1);
    panel(b, LAB.x0, 0, LAB.x1, 1.2, LAB.z1, 1.0, -1);
    return b;
  }

  function labMid(b) {
    panel(b, LAB.x0, 1.2, LAB.x1, 2.3, LAB.z0, 1.0, 1);
    panelX(b, LAB.z0, 1.2, LAB.z1, 2.3, LAB.x0, 1.0, 1);
    panelX(b, LAB.z0, 1.2, LAB.z1, 2.3, LAB.x1, 1.0, -1);
    panel(b, LAB.x0, 1.2, WIN.x0, 2.3, LAB.z1, 1.0, -1);
    panel(b, WIN.x1, 1.2, LAB.x1, 2.3, LAB.z1, 1.0, -1);
    panel(b, WIN.x0, 1.2, WIN.x1, WIN.y0, LAB.z1, 1.0, -1);
    return b;
  }

  function labTop(b) {
    panel(b, LAB.x0, 2.3, LAB.x1, LAB.h, LAB.z0, 2.0, 1);
    panelX(b, LAB.z0, 2.3, LAB.z1, LAB.h, LAB.x0, 2.0, 1);
    panelX(b, LAB.z0, 2.3, LAB.z1, LAB.h, LAB.x1, 2.0, -1);
    panel(b, LAB.x0, 2.3, WIN.x0, LAB.h, LAB.z1, 2.0, -1);
    panel(b, WIN.x1, 2.3, LAB.x1, LAB.h, LAB.z1, 2.0, -1);
    panel(b, WIN.x0, WIN.y1, WIN.x1, LAB.h, LAB.z1, 2.0, -1);
    wallQuad(b, [LAB.x0, LAB.h, LAB.z0], [LAB.x1, LAB.h, LAB.z0], [LAB.x1, LAB.h, LAB.z1], [LAB.x0, LAB.h, LAB.z1], 2.0);
    return b;
  }

  function labTrim(b) {
    const trim = 0x5a6660;
    b.at(0, 1.2, LAB.z0 + 0.02, h => h.box(LAB.x1 - LAB.x0, 0.05, 0.04, trim));
    b.at(LAB.x0 + 0.02, 1.2, (LAB.z0 + LAB.z1) / 2, h => h.box(0.04, 0.05, LAB.z1 - LAB.z0, trim));
    b.at(LAB.x1 - 0.02, 1.2, (LAB.z0 + LAB.z1) / 2, h => h.box(0.04, 0.05, LAB.z1 - LAB.z0, trim));
    b.at(0, 2.3, LAB.z0 + 0.02, h => h.box(LAB.x1 - LAB.x0, 0.04, 0.03, 0x6a746e));
    for (let i = 0; i < 3; i++) {
      const x = -2.0 + i * 2.0;
      b.at(x, LAB.h - 0.04, 0.4, h => h.box(0.18, 0.06, 1.6, 0x9a9e98));
      b.at(x, LAB.h - 0.08, 0.4, h => h.box(0.12, 0.03, 1.5, rgb(0xf4f8f4, 1)));
    }
    const wy = WIN.y0, wx0 = WIN.x0, wx1 = WIN.x1;
    b.at((wx0 + wx1) / 2, wy - 0.03, LAB.z1 - 0.05, h => h.box(wx1 - wx0 + 0.1, 0.06, 0.16, 0x6a6a64));
    [wx0, wx1].forEach(x => b.at(x, (WIN.y0 + WIN.y1) / 2, LAB.z1, h => h.box(0.06, WIN.y1 - WIN.y0, 0.14, 0x4a4a46)));
    b.at((wx0 + wx1) / 2, WIN.y1, LAB.z1, h => h.box(wx1 - wx0, 0.06, 0.14, 0x4a4a46));
    for (let i = 1; i < 4; i++) b.at(lerp(wx0, wx1, i / 4), (WIN.y0 + WIN.y1) / 2, LAB.z1 + 0.02, h => h.box(0.025, WIN.y1 - WIN.y0, 0.025, 0x2a2a28));
    b.at((wx0 + wx1) / 2, (WIN.y0 + WIN.y1) / 2, LAB.z1 + 0.02, h => h.box(wx1 - wx0, 0.025, 0.025, 0x2a2a28));
    const rad = (x, z, w, rot) => {
      b.push(M4.translate(x, 0.22, z), M4.rotY(rot || 0));
      for (let i = 0; i < Math.round(w / 0.07); i++) b.at(-w / 2 + i * 0.07, 0.3, 0, h => h.box(0.045, 0.6, 0.1, 0x8e948e));
      b.at(0, 0.62, 0, h => h.box(w, 0.04, 0.12, 0x7a807a));
      b.pop();
    };
    rad(-1.6, LAB.z0 + 0.12, 1.1);
    rad(2.6, LAB.z1 - 0.12, 1.0);
    rad(LAB.x1 - 0.12, 1.4, 1.2, PI / 2);
    return b;
  }

  function labFurniture(b) {
    b.at(2.2, 0.75, LAB.z0 + 0.3, h => h.box(1.5, 1.5, 0.55, 0x76827a));
    b.at(2.2, 1.56, LAB.z0 + 0.3, h => h.box(1.56, 0.1, 0.6, 0x5a645e));
    b.at(-1.25, 0.47, LAB.z0 + 0.32, h => h.box(1.9, 0.94, 0.6, 0x66726c));
    b.at(-1.25, 0.96, LAB.z0 + 0.32, h => h.box(1.96, 0.05, 0.66, 0x4e6a5a));
    for (let i = 0; i < 3; i++) b.at(-1.9 + i * 0.65, 0.6, LAB.z0 + 0.63, h => h.box(0.56, 0.56, 0.02, 0x5e6a64));
    b.at(1.6, 1.26, LAB.z0 + 0.14, h => h.box(1.5, 0.04, 0.26, 0x6a5a48));
    b.at(-2.85, 1.0, LAB.z0 + 0.32, h => h.box(0.9, 2.0, 0.55, 0x8a948e));
    b.at(LAB.x1 - 0.32, 0.5, -1.0, h => h.box(0.6, 1.0, 1.2, 0x6e7a72));
    b.at(LAB.x1 - 0.32, 1.02, -1.0, h => h.box(0.64, 0.04, 1.24, 0x4e5852));
    return b;
  }

  function labFronts(b) {
    const front = (x, y, z, w, h, faceX) => {
      if (faceX) wallQuad(b, [x, y - h / 2, z - w / 2], [x, y - h / 2, z + w / 2], [x, y + h / 2, z + w / 2], [x, y + h / 2, z - w / 2], Math.max(w, h), rgb(0xffffff), false);
      else {
        const n = [0, 0, 1];
        b.quad([x - w / 2, y - h / 2, z], [x + w / 2, y - h / 2, z], [x + w / 2, y + h / 2, z], [x - w / 2, y + h / 2, z], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
      }
    };
    front(2.2, 0.85, LAB.z0 + 0.58, 1.4, 1.2);
    return b;
  }

  function labCabinet(b) {
    const n = [0, 0, 1];
    b.quad([-3.28, 0.15, LAB.z0 + 0.6], [-2.42, 0.15, LAB.z0 + 0.6], [-2.42, 1.9, LAB.z0 + 0.6], [-3.28, 1.9, LAB.z0 + 0.6], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
    return b;
  }

  function fieldGround(b, x0, x1, z0, z1, n, hf, col) {
    const g = rand(611);
    const pt = (i, j) => {
      const x = lerp(x0, x1, i / n), z = lerp(z0, z1, j / n);
      return [x, hf(x, z), z];
    };
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const a = pt(i, j), c = pt(i + 1, j), d = pt(i + 1, j + 1), e = pt(i, j + 1);
        const nn = V3.norm(V3.cross(V3.sub(e, a), V3.sub(c, a)));
        const sh = 0.9 + g() * 0.18;
        const cc = rgb(col);
        const k = 0.12;
        b.quad(a, e, d, c, [cc[0] * sh, cc[1] * sh, cc[2] * sh, 0], [[a[0] * k, a[2] * k], [e[0] * k, e[2] * k], [d[0] * k, d[2] * k], [c[0] * k, c[2] * k]], [nn, nn, nn, nn]);
      }
    }
    return b;
  }

  function ridgeH(x, z) {
    const r = Math.max(0, 1 - Math.abs(z + 6) / 9);
    return 0.4 * S(x * 0.35) * S(z * 0.4) + 1.6 * r * r + 0.25 * S(x * 1.3 + z * 0.7);
  }

  function valleyH(x, z) {
    return 0.18 * S(x * 0.4) * C(z * 0.3) + 0.12 * S(x * 1.1 + z * 0.8) + Math.max(0, (Math.abs(x) - 16) * 0.6);
  }

  function mountains(b, R, n, seed, col, h0, h1) {
    const g = rand(seed);
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * PI * 2;
      const h = h0 + g() * (h1 - h0);
      const p = [S(a) * R, h, C(a) * R];
      if (prev) {
        const base0 = [prev[0], -5, prev[2]], base1 = [p[0], -5, p[2]];
        const nn = V3.norm([-(prev[0] + p[0]) / 2, 0, -(prev[2] + p[2]) / 2]);
        b.quad(base0, base1, p, prev, col, null, [nn, nn, nn, nn]);
      }
      prev = p;
    }
    return b;
  }

  function sky(b) {
    const nu = 32, nv = 12, R = 280;
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const pt = (ii, jj) => {
          const a = (ii / nu) * PI * 2, p = -0.15 + (jj / nv) * (PI / 2 + 0.15);
          return [S(a) * C(p) * R, S(p) * R, C(a) * C(p) * R];
        };
        const uv = (ii, jj) => [ii / nu * 2, jj / nv];
        b.quad(pt(i, j), pt(i, j + 1), pt(i + 1, j + 1), pt(i + 1, j), rgb(0xffffff, 1), [uv(i, j), uv(i, j + 1), uv(i + 1, j + 1), uv(i + 1, j)]);
      }
    }
    return b;
  }

  function cliffWall(b, pts, h, col) {
    const g = rand(621);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], c = pts[i + 1];
      const rows = 4;
      for (let j = 0; j < rows; j++) {
        const y0 = (j / rows) * h, y1 = ((j + 1) / rows) * h;
        const j0 = (g() - 0.5) * 0.6, j1 = (g() - 0.5) * 0.6;
        const p0 = [a[0] + j0, y0, a[1]], p1 = [c[0] + j1, y0, c[1]], p2 = [c[0] + j1 * 0.5 - 0.3 * (j + 1), y1, c[1]], p3 = [a[0] + j0 * 0.5 - 0.3 * (j + 1), y1, a[1]];
        const sh = 0.8 + g() * 0.3;
        const cc = rgb(col);
        b.quad(p0, p1, p2, p3, [cc[0] * sh, cc[1] * sh, cc[2] * sh, 0]);
      }
    }
    return b;
  }

  function tunnel(b) {
    b.at(0, 1.4, 0, h => h.box(3.2, 2.8, 0.4, 0x3a3634));
    b.at(0, 1.25, 0.05, h => h.box(2.4, 2.5, 0.42, 0x0c0a0a));
    b.at(0, 2.62, 0.21, h => h.box(2.6, 0.18, 0.06, 0x8a2a24));
    [-1, 1].forEach(s => b.at(s * 1.25, 1.3, 0.21, h => h.box(0.12, 2.6, 0.06, 0x8a2a24)));
    b.at(0, 1.4, -0.4, h => h.box(2.3, 2.4, 0.1, rgb(0x6a1a14, 0.6)));
    return b;
  }

  function hangar(b) {
    const W = 14, Dp = 18, H = 6;
    const col = 0x7a6c5e;
    b.at(0, H / 2, -Dp / 2, h => h.box(W, H, 0.3, col));
    [-1, 1].forEach(s => b.at(s * W / 2, H / 2, 0, h => h.box(0.3, H, Dp, col)));
    for (let i = 0; i < 6; i++) {
      const z = -Dp / 2 + 1.5 + i * 3;
      K.tube(b, [[-W / 2, H, z], [0, H + 1.6, z], [W / 2, H, z]], [0.08, 0.08, 0.08], 6, 0x3a3430);
      K.tube(b, [[-W / 2, H, z], [W / 2, H, z]], [0.06, 0.06], 6, 0x3a3430);
      for (let k = 1; k < 6; k++) {
        const x = lerp(-W / 2, W / 2, k / 6);
        const y = H + 1.6 * (1 - Math.abs(x) / (W / 2));
        K.tube(b, [[x, H, z], [x, y, z]], [0.04, 0.04], 4, 0x3a3430);
      }
    }
    [-1, 1].forEach(s => {
      for (let i = 0; i < 4; i++) b.at(s * (W / 2 - 0.16), 4.2, -6 + i * 4, h => h.box(0.06, 1.2, 1.6, rgb(0xe8e0c8, 0.85)));
    });
    return b;
  }

  function bluBase(b) {
    b.at(0, 5, 0, h => h.box(16, 10, 6, 0x9a8e7e));
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 7; i++) b.at(-6 + i * 2, 2.5 + j * 3, 3.02, h => h.box(0.9, 1.6, 0.06, 0x2a2a2e));
    }
    b.at(0, 10.3, 0, h => h.box(16.4, 0.6, 6.4, 0x6a5e52));
    return b;
  }

  function stripeWall(b) {
    const n = [0, 0, 1];
    b.quad([-3, 0, 0], [3, 0, 0], [3, 3.2, 0], [-3, 3.2, 0], 0xffffff, [[0, 0], [3, 0], [3, 1.6], [0, 1.6]], [n, n, n, n]);
    return b;
  }

  function doorWall(b) {
    const n = [0, 0, 1];
    b.quad([-4, 0, 0], [4, 0, 0], [4, 5, 0], [-4, 5, 0], 0xffffff, [[0, 0], [4, 0], [4, 2.5], [0, 2.5]], [n, n, n, n]);
    return b;
  }

  function doorHalf(b, side) {
    const k = side === 'L' ? -1 : 1;
    const n = [0, 0, 1];
    const R = 1.3;
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const a = k > 0 ? lerp(-PI / 2, PI / 2, i / 16) : lerp(PI / 2, PI * 1.5, i / 16);
      pts.push([C(a) * R, S(a) * R]);
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], c = pts[i + 1];
      const uv = (p) => [p[0] / (2 * R) + 0.5, p[1] / (2 * R) + 0.5];
      b.tri([0, 0, 0], k > 0 ? [a[0], a[1], 0] : [c[0], c[1], 0], k > 0 ? [c[0], c[1], 0] : [a[0], a[1], 0], 0xffffff, [[0.5, 0.5], uv(k > 0 ? a : c), uv(k > 0 ? c : a)], [n, n, n]);
    }
    return b;
  }

  function doorFrame(b) {
    const pts = [];
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * PI * 2;
      pts.push([C(a) * 1.38, S(a) * 1.38, 0.05]);
    }
    K.tube(b, pts, pts.map(() => 0.1), 8, 0x2a2624);
    return b;
  }

  function waitingRoom(b) {
    const W = 9, Dp = 7, H = 3;
    wallQuad(b, [-W / 2, 0, Dp / 2], [W / 2, 0, Dp / 2], [W / 2, 0, -Dp / 2], [-W / 2, 0, -Dp / 2], 1.0);
    return b;
  }

  function waitingWalls(b) {
    const W = 9, Dp = 7, H = 3;
    panel(b, -W / 2, 0, W / 2, H, -Dp / 2, 2.0, 1);
    panelX(b, -Dp / 2, 0, Dp / 2, H, -W / 2, 2.0, 1);
    panelX(b, -Dp / 2, 0, Dp / 2, H, W / 2, 2.0, -1);
    wallQuad(b, [-W / 2, H, -Dp / 2], [W / 2, H, -Dp / 2], [W / 2, H, Dp / 2], [-W / 2, H, Dp / 2], 2.0);
    return b;
  }

  function quadAt(b, x, y, z, w, h, rotY) {
    b.push(M4.translate(x, y, z), M4.rotY(rotY || 0));
    const n = [0, 0, 1];
    b.quad([-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
    b.pop();
    return b;
  }

  function build(r) {
    const mk = (fn) => K.mesh(r, fn);
    return {
      labFloor: mk(labFloor),
      labLow: mk(labLow),
      labMid: mk(labMid),
      labTop: mk(labTop),
      labTrim: mk(labTrim),
      labFurniture: mk(labFurniture),
      labConsole: mk(labFronts),
      labCabinet: mk(labCabinet),
      sky: mk(sky),
      ridge: mk(b => fieldGround(b, -40, 40, -40, 30, 48, ridgeH, 0x56524c)),
      valley: mk(b => fieldGround(b, -60, 60, -60, 60, 56, valleyH, 0x8a7a64)),
      mountainsNear: mk(b => mountains(b, 120, 40, 631, 0x3a3a40, 10, 26)),
      mountainsFar: mk(b => mountains(b, 200, 30, 632, 0x4e4e56, 20, 45)),
      cliff: mk(b => cliffWall(b, [[-14, -8], [-9, -9], [-4, -10], [0, -10], [4, -10], [9, -9], [14, -7]], 9, 0x5a5048)),
      tunnel: mk(tunnel),
      hangar: mk(hangar),
      bluBase: mk(bluBase),
      stripeWall: mk(stripeWall),
      doorWall: mk(doorWall),
      doorL: mk(b => doorHalf(b, 'L')),
      doorR: mk(b => doorHalf(b, 'R')),
      doorFrame: mk(doorFrame),
      waitFloor: mk(waitingRoom),
      waitWalls: mk(waitingWalls),
      ticketWall: mk(b => quadAt(b, -2.2, 1.5, -3.48, 1.6, 2.6)),
      servingSign: mk(b => quadAt(b, -3.3, 2.3, -3.46, 0.7, 0.35)),
      nextSign: mk(b => quadAt(b, 1.2, 2.55, -3.44, 0.7, 0.24)),
      ciggy: mk(b => b.at(-0.6, 0.95, -3.2, h => h.box(0.9, 1.9, 0.55, 0xd6d0c2))),
      ciggyFront: mk(b => quadAt(b, -0.6, 0.95, -2.92, 0.86, 1.86)),
      doorFrameWait: mk(b => b.at(1.2, 1.1, -3.46, h => h.box(1.7, 2.3, 0.06, 0x3a3634)))
    };
  }

  const CLEAR = [[0, 14.5, 9], [2, 9, 6], [14, 10, 5], [6, -9.5, 5], [5.4, -5.5, 4], [3.6, -7, 4], [6, -12.6, 4], [8.5, 2.5, 4], [5.5, 1, 5]];

  function rockField(seed, keep) {
    const g = rand(seed);
    const out = [];
    for (let i = 0; i < 70; i++) {
      const x = (g() - 0.5) * 70, z = (g() - 0.5) * 70;
      const rock = { x, z, s: 0.3 + g() * 1.6, rot: g() * PI * 2, kind: Math.floor(g() * 4), slab: g() < 0.25 };
      if (keep(x, z)) out.push(rock);
    }
    return out;
  }

  const ROCKS = rockField(641, (x, z) => Math.abs(x) >= 3 || Math.abs(z) >= 3);
  const VALLEY_ROCKS = rockField(642, (x, z) => CLEAR.every(([cx, cz, r]) => Math.hypot(x - cx, z - cz) > r));

  function drawRocks(fx, PR, list, hf, T, tint) {
    list.forEach(rk => {
      const y = hf(rk.x, rk.z);
      const mesh = rk.slab ? PR.slabs[rk.kind % 2] : PR.rocks[rk.kind];
      fx.draw(mesh, M4.chain(M4.translate(rk.x, y - rk.s * 0.15, rk.z), M4.rotY(rk.rot), M4.scale(rk.s, rk.s, rk.s)), Object.assign({ texture: T('stone'), spec: [0.05, 6], rim: 0.5 }, tint ? { tint } : {}));
    });
  }

  function drawLab(fx, W, T, PR, o) {
    const mat = { spec: [0.25, 18], rim: 0.25 };
    fx.draw(W.labFloor, null, Object.assign({ texture: T('labFloor') }, mat, { spec: [0.5, 30] }));
    fx.draw(W.labLow, null, Object.assign({ texture: T('labLow') }, mat));
    fx.draw(W.labMid, null, Object.assign({ texture: T('labWall') }, mat));
    fx.draw(W.labTop, null, Object.assign({ texture: T('labPaint') }, { spec: [0.05, 6], rim: 0.2 }));
    fx.draw(W.labTrim, null, { spec: [0.3, 16], rim: 0.3 });
    fx.draw(W.labFurniture, null, { spec: [0.3, 16], rim: 0.3 });
    fx.draw(W.labConsole, null, { texture: T('console'), spec: [0.3, 16], rim: 0.2 });
    fx.draw(W.labCabinet, null, { texture: T('cabinet'), spec: [0.6, 30], rim: 0.2 });
    [[-1.65, 'xray1'], [-0.95, 'xray2'], [0.95, 'xray1'], [1.65, 'xray2']].forEach(([x, key]) => {
      fx.draw(PR.xray, M4.translate(x, 1.9, LAB.z0 + 0.04), { texture: T(key), spec: [0.2, 10], rim: 0.1, noFog: true });
    });
    fx.draw(PR.monitor, M4.chain(M4.translate(1.55, 1.42, -0.95), M4.rotY(-0.35)), { texture: T('monitor'), spec: [0.3, 16], rim: 0.3 });
    fx.draw(PR.tray, M4.translate(-0.75, 0, -1.25), { spec: [0.6, 30], rim: 0.4 });
    PR.jars.forEach((jar, i) => fx.draw(jar, M4.translate(1.1 + i * 0.42, 1.28, LAB.z0 + 0.14), { spec: [0.3, 12], rim: 0.5 }));
    [[1.0, 1.28], [2.3, 1.28]].forEach(([x, y], i) => fx.draw(PR.jars[(i + 1) % 3], M4.chain(M4.translate(x + 0.2, y, LAB.z0 + 0.14), M4.scale(0.8, 0.8, 0.8)), { spec: [0.3, 12], rim: 0.5 }));
    if (!o.noFridge) fx.draw(PR.fridge, M4.chain(M4.translate(LAB.x0 + 0.38, 0, -0.6), M4.rotY(PI / 2)), { spec: [0.5, 24], rim: 0.4 });
  }

  function drawField(fx, W, T, PR, area, o) {
    fx.draw(W.sky, M4.translate(fx.cam.eye[0], -10, fx.cam.eye[2]), { texture: T('dusk'), noFog: true, spec: [0, 1], rim: 0 });
    fx.draw(W.mountainsFar, M4.translate(fx.cam.eye[0], 0, fx.cam.eye[2]), { noFog: true, spec: [0, 1], rim: 0.15, tint: o.mtnTint || [0.42, 0.42, 0.46] });
    fx.draw(W.mountainsNear, M4.translate(fx.cam.eye[0] * 0.5, 0, fx.cam.eye[2] * 0.5), { noFog: true, spec: [0, 1], rim: 0.2, tint: [0.36, 0.35, 0.37] });
    if (area === 'ridge') {
      fx.draw(W.ridge, null, { texture: T('dirt'), spec: [0.03, 6], rim: 0.3 });
      drawRocks(fx, PR, ROCKS, ridgeH, T);
    } else {
      fx.draw(W.valley, null, { texture: T('dirt'), spec: [0.03, 6], rim: 0.3 });
      drawRocks(fx, PR, VALLEY_ROCKS, valleyH, T);
      fx.draw(W.cliff, M4.translate(0, -0.5, -4), { texture: T('stone'), spec: [0.05, 6], rim: 0.4 });
      fx.draw(W.tunnel, M4.translate(6, valleyH(6, -13.2), -13.2), { spec: [0.2, 10], rim: 0.3 });
      fx.draw(W.bluBase, M4.chain(M4.translate(-6, 0, 46), M4.rotY(PI)), { texture: T('concrete'), spec: [0.05, 6], rim: 0.2 });
      if (area === 'hangar') fx.draw(W.hangar, M4.translate(0, 0, 18), { texture: T('baseWall'), spec: [0.1, 8], rim: 0.3 });
      if (area === 'stripes') fx.draw(W.stripeWall, M4.translate(14, 0, 10), { texture: T('stripes'), spec: [0.1, 8], rim: 0.3 });
    }
  }

  function drawDoor(fx, W, T, open) {
    fx.draw(W.doorWall, M4.translate(0, 0, -0.02), { texture: T('doorMetal'), spec: [0.4, 20], rim: 0.4 });
    const gap = open * 1.35;
    fx.draw(W.doorL, M4.translate(-gap, 1.45, 0.02), { texture: T('redCross'), spec: [0.3, 18], rim: 0.3 });
    fx.draw(W.doorR, M4.translate(gap, 1.45, 0.02), { texture: T('redCross'), spec: [0.3, 18], rim: 0.3 });
    fx.draw(W.doorFrame, M4.translate(0, 1.45, 0), { spec: [0.5, 24], rim: 0.5 });
  }

  function drawWaiting(fx, W, T, PR, o) {
    fx.draw(W.waitFloor, null, { texture: T('labFloor'), spec: [0.4, 24], rim: 0.2 });
    fx.draw(W.waitWalls, null, { texture: T('labWall'), spec: [0.2, 12], rim: 0.2, tint: [0.92, 0.9, 0.86] });
    fx.draw(W.ticketWall, null, { texture: T('ticket'), spec: [0.1, 8], rim: 0.1 });
    fx.draw(W.servingSign, null, { texture: T(o.serving === 2 ? 'serving2' : 'serving1'), spec: [0.2, 10], rim: 0.1 });
    fx.draw(W.doorFrameWait, null, { spec: [0.3, 14], rim: 0.2 });
    fx.draw(W.nextSign, null, { texture: T('nextSign'), noFog: true, spec: [0, 1], rim: 0, tint: [1.4, 1.4, 1.4] });
    fx.draw(W.ciggy, null, { spec: [0.3, 14], rim: 0.3 });
    fx.draw(W.ciggyFront, null, { texture: T('ciggy'), spec: [0.4, 20], rim: 0.1 });
    fx.draw(PR.dispenser, M4.translate(-2.2, 1.05, -3.42), { spec: [0.5, 20], rim: 0.3 });
    const gap = o.doorsOpen || 0;
    fx.draw(PR.door, M4.chain(M4.translate(0.84, 0, -3.42), M4.rotY(-gap * 1.2)), { spec: [0.3, 18], rim: 0.3 });
    fx.draw(PR.door, M4.chain(M4.translate(1.56, 0, -3.42), M4.rotY(gap * 1.2), M4.translate(0, 0, 0)), { spec: [0.3, 18], rim: 0.3 });
    (o.chairs || []).forEach(c => fx.draw(PR.chair, M4.chain(M4.translate(c[0], 0, c[1]), M4.rotY(c[2] || 0)), { spec: [0.4, 20], rim: 0.4 }));
  }

  function draw(fx, W, area, T, PR, opts) {
    const o = opts || {};
    if (area === 'lab') drawLab(fx, W, T, PR, o);
    else if (area === 'door') drawDoor(fx, W, T, o.doorOpen || 0);
    else if (area === 'waiting') drawWaiting(fx, W, T, PR, o);
    else if (area === 'fog') return;
    else drawField(fx, W, T, PR, area, o);
  }

  window.MedSets = { LAB, WIN, build, draw, ridgeH, valleyH, ROCKS };
})();
