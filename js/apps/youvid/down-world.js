(function () {
  const { M4, V3, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp, mesh } = K;
  const PW = window.ParadWorld;
  const Cam = window.DownCam;
  const { Batch, box, wallQuad } = PW;

  const ENV = {
    ogre: { sky: null, fog: [0.01, 0.015, 0.015], near: 5, far: 11, sun: [0.45, -0.55, -0.7], sunCol: [0.75, 0.7, 0.58], ambTop: [0.55, 0.56, 0.52], ambBot: [0.24, 0.22, 0.2] },
    bunker: { sky: null, fog: [0.02, 0.03, 0.03], near: 10, far: 34, sun: [0.3, -0.6, -0.7], sunCol: [0.3, 0.35, 0.32], ambTop: [0.42, 0.5, 0.48], ambBot: [0.14, 0.17, 0.16] },
    road: { sky: 'skySunset', fog: [0.6, 0.55, 0.6], near: 25, far: 330, sun: [-0.6, -0.35, 0.7], sunCol: [0.5, 0.42, 0.4], ambTop: [0.6, 0.56, 0.64], ambBot: [0.38, 0.32, 0.3] },
    army: { sky: 'skyGrey', fog: [0.5, 0.52, 0.52], near: 12, far: 140, sun: [0.3, -0.8, 0.4], sunCol: [0.22, 0.22, 0.2], ambTop: [0.5, 0.53, 0.55], ambBot: [0.3, 0.32, 0.28] },
    wheel: { sky: 'skyWheel', fog: [0.45, 0.43, 0.5], near: 20, far: 200, sun: [0.4, -0.6, 0.5], sunCol: [0.18, 0.17, 0.2], ambTop: [0.42, 0.4, 0.48], ambBot: [0.22, 0.2, 0.2] },
    cellar: { sky: 'skyHaze', fog: [0.66, 0.64, 0.6], near: 20, far: 160, sun: [-0.4, -0.6, -0.6], sunCol: [0.55, 0.45, 0.3], ambTop: [0.62, 0.58, 0.52], ambBot: [0.36, 0.3, 0.22] },
    village: { sky: 'skyVillage', fog: [0.66, 0.58, 0.6], near: 25, far: 240, sun: [-0.55, -0.4, -0.7], sunCol: [0.55, 0.44, 0.36], ambTop: [0.62, 0.56, 0.6], ambBot: [0.38, 0.3, 0.26] },
    ctrlIn: { sky: 'skyBright', fog: [0.42, 0.44, 0.46], near: 15, far: 120, sun: [0.4, -0.7, -0.5], sunCol: [0.3, 0.28, 0.25], ambTop: [0.28, 0.3, 0.33], ambBot: [0.14, 0.13, 0.12] },
    ctrlOut: { sky: 'skyBright', fog: [0.68, 0.7, 0.72], near: 20, far: 180, sun: [0.4, -0.7, -0.5], sunCol: [0.55, 0.52, 0.46], ambTop: [0.62, 0.64, 0.66], ambBot: [0.36, 0.33, 0.3] },
    gate: { sky: 'skyGrey', fog: [0.3, 0.3, 0.3], near: 12, far: 80, sun: [0.5, -0.7, -0.4], sunCol: [0.35, 0.32, 0.28], ambTop: [0.42, 0.42, 0.42], ambBot: [0.2, 0.19, 0.17] },
    hill: { sky: 'skyVillage', fog: [0.62, 0.52, 0.52], near: 30, far: 260, sun: [-0.7, -0.3, 0.6], sunCol: [0.6, 0.45, 0.38], ambTop: [0.58, 0.5, 0.56], ambBot: [0.36, 0.28, 0.24] },
    bugs: { sky: 'skyGrey', fog: [0.58, 0.6, 0.6], near: 20, far: 220, sun: [0.3, -0.7, -0.5], sunCol: [0.3, 0.3, 0.28], ambTop: [0.55, 0.58, 0.6], ambBot: [0.3, 0.3, 0.28] },
    barrel: { sky: 'skyGrey', fog: [0.36, 0.38, 0.36], near: 12, far: 90, sun: [0.3, -0.8, -0.4], sunCol: [0.22, 0.22, 0.2], ambTop: [0.42, 0.44, 0.42], ambBot: [0.22, 0.22, 0.18] },
    monument: { sky: 'skyGrey', fog: [0.62, 0.64, 0.66], near: 15, far: 200, sun: [0.3, -0.7, -0.5], sunCol: [0.25, 0.25, 0.24], ambTop: [0.55, 0.57, 0.6], ambBot: [0.3, 0.3, 0.3] },
    sign: { sky: 'skyStorm', fog: [0.42, 0.42, 0.44], near: 20, far: 200, sun: [0.3, -0.6, -0.6], sunCol: [0.25, 0.24, 0.24], ambTop: [0.46, 0.46, 0.5], ambBot: [0.26, 0.25, 0.24] },
    factory: { sky: 'skyPlant', fog: [0.64, 0.66, 0.68], near: 140, far: 800, sun: [0.3, -0.6, -0.6], sunCol: [0.3, 0.3, 0.3], ambTop: [0.6, 0.62, 0.66], ambBot: [0.34, 0.34, 0.32] },
    plant: { sky: 'skyPlant', fog: [0.64, 0.66, 0.68], near: 40, far: 420, sun: [0.3, -0.6, -0.6], sunCol: [0.3, 0.3, 0.3], ambTop: [0.6, 0.62, 0.66], ambBot: [0.34, 0.34, 0.32] },
    invModel: { sky: null, fog: [0.1, 0.12, 0.14], near: 30, far: 60, sun: [0.4, -0.5, -0.7], sunCol: [0.5, 0.48, 0.45], ambTop: [0.5, 0.52, 0.56], ambBot: [0.22, 0.22, 0.24] }
  };

  function card(b, x, y, z, w, h, rot, col, uv) {
    const dx = C(rot || 0) * w / 2, dz = -S(rot || 0) * w / 2;
    b.quad([x - dx, y, z - dz], [x + dx, y, z + dz], [x + dx, y + h, z + dz], [x - dx, y + h, z - dz], col || [1, 1, 1], uv || [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }

  function floorQuad(b, x0, z0, x1, z1, y, col, tile) {
    const t = tile || 4;
    b.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], col || [1, 1, 1], [[x0 / t, z1 / t], [x1 / t, z1 / t], [x1 / t, z0 / t], [x0 / t, z0 / t]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
  }

  function slab(B, key, x, y, z, w, h, d, rot, col, tile) {
    box(B.b(key), x, y, z, w, h, d, col || [1, 1, 1], rot || 0, tile || 1.5);
  }

  function ringOfTrees(B, cx, cz, r0, r1, n, seed, kinds) {
    const g = rand(seed);
    for (let i = 0; i < n; i++) {
      const a = g() * PI * 2, rr = r0 + g() * (r1 - r0);
      const x = cx + S(a) * rr, z = cz - C(a) * rr;
      const k = kinds[Math.floor(g() * kinds.length)];
      if (k === 'poplar') PW.poplar(B, x, z, 14 + g() * 6, seed + i);
      else if (k === 'dead') PW.deadTree(B, x, z, 9 + g() * 4, seed + i);
      else if (k === 'bush') PW.bush(B, x, z, 2 + g() * 2, seed + i);
      else PW.oak(B, x, z, 10 + g() * 5, seed + i, k);
    }
  }

  function guardrail(B, pts) {
    const fl = B.b('flat');
    const st = B.b('rail');
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, z0] = pts[i], [x1, z1] = pts[i + 1];
      const len = Math.hypot(x1 - x0, z1 - z0);
      st.quad([x0, 0.55, z0], [x1, 0.55, z1], [x1, 0.85, z1], [x0, 0.85, z0], [1, 1, 1], [[0, 0], [len / 2, 0], [len / 2, 1], [0, 1]]);
      const n = Math.max(1, Math.round(len / 2.2));
      for (let k = 0; k <= n; k++) box(fl, lerp(x0, x1, k / n), 0, lerp(z0, z1, k / n), 0.12, 0.85, 0.12, 0x2a2a28);
    }
  }

  function brickShed(B, x, z, rot, w, d, h, key) {
    const M = M4.chain(M4.translate(x, 0, z), M4.rotY(rot || 0));
    const b = B.b(key || 'brickRed');
    b.push(M);
    const p = [[-w / 2, d / 2], [w / 2, d / 2], [w / 2, -d / 2], [-w / 2, -d / 2]];
    for (let i = 0; i < 4; i++) wallQuad(b, p[i][0], p[i][1], p[(i + 1) % 4][0], p[(i + 1) % 4][1], 0, h, [0.9, 0.9, 0.9], 2);
    b.pop();
    const r = B.b('tin');
    r.push(M);
    r.quad([-w / 2 - 0.2, h, d / 2 + 0.2], [w / 2 + 0.2, h, d / 2 + 0.2], [w / 2 + 0.2, h + 0.3, -d / 2 - 0.2], [-w / 2 - 0.2, h + 0.3, -d / 2 - 0.2], [0.8, 0.8, 0.8], [[0, 0], [2, 0], [2, 2], [0, 2]]);
    r.pop();
    const f = B.b('flat');
    f.push(M);
    f.quad([-0.5, 0, d / 2 + 0.02], [0.5, 0, d / 2 + 0.02], [0.5, 1.9, d / 2 + 0.02], [-0.5, 1.9, d / 2 + 0.02], 0x2a2420);
    f.quad([w / 2 + 0.02, 1.0, 0.6], [w / 2 + 0.02, 1.0, -0.6], [w / 2 + 0.02, 1.7, -0.6], [w / 2 + 0.02, 1.7, 0.6], 0x1a1816);
    f.pop();
  }

  function zil(b, cabKey) {
    b.push(M4.translate(0, 0.55, 2.2));
    b.box(2.2, 0.9, 1.6, [1, 1, 1], { base: true });
    b.pop();
    b.push(M4.translate(0, 1.45, 1.7));
    b.box(2.1, 1.05, 1.6, [1, 1, 1], { base: true });
    b.pop();
    b.quad([-1.0, 1.65, 2.52], [1.0, 1.65, 2.52], [1.0, 2.35, 2.45], [-1.0, 2.35, 2.45], 0x283036);
    b.push(M4.translate(0, 0.85, -1.2));
    b.box(2.3, 0.15, 4.4, 0x5a4a3a, { base: true });
    b.pop();
    [[-1.15, -1.2, 0.0], [1.15, -1.2, 0.0]].forEach(([x, z]) => {
      b.push(M4.translate(x, 1.0, z - 1.2));
      b.box(0.06, 0.7, 4.4, 0x6a5a46, { base: true });
      b.pop();
    });
    b.push(M4.translate(0, 1.0, -3.4));
    b.box(2.3, 0.7, 0.06, 0x6a5a46, { base: true });
    b.pop();
    [[2.2, 1.0], [-0.6, 1.0], [-1.9, 1.0]].forEach(([z]) => [-1, 1].forEach(s => PW.wheel(b, s * 1.0, 0.48, z, 0.48, 0.32, 0x1e1e1c)));
  }

  function uaz(b) {
    b.push(M4.translate(0, 0.45, 0));
    b.box(1.9, 1.5, 4.3, [1, 1, 1], { base: true });
    b.pop();
    b.quad([-0.85, 1.25, 2.16], [0.85, 1.25, 2.16], [0.8, 1.8, 2.0], [-0.8, 1.8, 2.0], 0x283036);
    [-1, 1].forEach(s => b.quad([s * 0.96, 1.3, 1.5], [s * 0.96, 1.3, -1.8], [s * 0.96, 1.75, -1.8], [s * 0.96, 1.75, 1.5], 0x2a3438));
    [1.4, -1.4].forEach(z => [-1, 1].forEach(s => PW.wheel(b, s * 0.85, 0.38, z, 0.38, 0.25, 0x1e1e1c)));
  }

  function tractor(b) {
    b.push(M4.translate(0, 0.9, 0.9));
    b.box(1.1, 0.9, 1.8, [1, 1, 1], { base: true });
    b.pop();
    b.push(M4.translate(0, 0.9, -0.6));
    b.box(1.5, 1.8, 1.4, [1, 1, 1], { base: true });
    b.pop();
    b.quad([-0.7, 1.6, 0.11], [0.7, 1.6, 0.11], [0.7, 2.5, 0.11], [-0.7, 2.5, 0.11], 0x26303a);
    PW.wheel(b, -0.85, 0.75, -0.7, 0.75, 0.4, 0x1e1e1c);
    PW.wheel(b, 0.85, 0.75, -0.7, 0.75, 0.4, 0x1e1e1c);
    PW.wheel(b, -0.6, 0.45, 1.3, 0.45, 0.25, 0x1e1e1c);
    PW.wheel(b, 0.6, 0.45, 1.3, 0.45, 0.25, 0x1e1e1c);
  }

  function excavator(b) {
    [-1, 1].forEach(s => {
      b.push(M4.translate(s * 1.2, 0, 0));
      b.box(0.8, 0.9, 4.2, 0x2a2824, { base: true });
      b.pop();
    });
    b.push(M4.translate(0, 0.9, -0.3));
    b.box(2.8, 1.5, 3.6, [1, 1, 1], { base: true });
    b.pop();
    b.push(M4.translate(0.75, 2.4, 0.6));
    b.box(1.2, 1.4, 1.3, [1, 1, 1], { base: true });
    b.pop();
    b.quad([0.16, 2.6, 1.26], [1.34, 2.6, 1.26], [1.34, 3.6, 1.26], [0.16, 3.6, 1.26], 0x283036);
    K.tube(b, [[-0.3, 2.2, 1.0], [-0.3, 4.6, 3.6], [-0.3, 3.0, 6.4]], [0.25, 0.22, 0.18], 6, [1, 1, 1]);
    b.push(M4.translate(-0.3, 2.2, 6.6), M4.rotX(0.5));
    b.box(1.2, 0.9, 0.8, 0x4a4a44);
    b.pop();
  }

  function heliMesh(r) {
    return mesh(r, b => PW.heli(b));
  }

  function lattice(B, key, x0, y0, z0, x1, y1, z1, w, faces) {
    const b = B.b(key);
    const dir = V3.sub([x1, y1, z1], [x0, y0, z0]);
    const len = V3.len(dir);
    const d = V3.norm(dir);
    let side = V3.cross(d, [0, 1, 0]);
    if (V3.len(side) < 1e-3) side = [1, 0, 0];
    side = V3.norm(side);
    const up = V3.cross(side, d);
    const n = faces || 4;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2 + PI / 4;
      const o = V3.add(V3.mul(side, C(a) * w * 0.7), V3.mul(up, S(a) * w * 0.7));
      const a2 = ((i + 1) / n) * PI * 2 + PI / 4;
      const o2 = V3.add(V3.mul(side, C(a2) * w * 0.7), V3.mul(up, S(a2) * w * 0.7));
      const p0 = V3.add([x0, y0, z0], o), p1 = V3.add([x0, y0, z0], o2);
      const q0 = V3.add([x1, y1, z1], o), q1 = V3.add([x1, y1, z1], o2);
      b.quad(p0, p1, q1, q0, [1, 1, 1], [[0, 0], [1, 0], [1, len / w / 4], [0, len / w / 4]]);
    }
  }

  function tiledWall(b, x0, z0, x1, z1, y0, y1, tile, col) {
    wallQuad(b, x0, z0, x1, z1, y0, y1, col || [1, 1, 1], tile || 2);
  }

  function buildBunker(r) {
    const B = Batch();
    floorQuad(B.b('concreteDark'), -5, -1, 5, 9, 0, [0.5, 0.5, 0.5], 3);
    tiledWall(B.b('tiles'), -5, 0, 5, 0, 0, 5, 2.2);
    tiledWall(B.b('tiles'), -4.2, 9, -4.2, 0, 0, 5, 2.2, [0.8, 0.8, 0.8]);
    tiledWall(B.b('tiles'), 4.2, 0, 4.2, 9, 0, 5, 2.2, [0.8, 0.8, 0.8]);
    const fl = B.b('flat');
    fl.quad([-5, 5, 9], [5, 5, 9], [5, 5, -1], [-5, 5, -1], 0x0e1210);
    const pk = B.b('pipe');
    [[-2.1, 0.09], [-2.45, 0.07], [2.3, 0.06], [3.3, 0.08]].forEach(([x, rr]) => {
      pk.push(M4.translate(x, 0, 0.25));
      pk.prism(8, rr, rr, 0, rr, rr, 5, [1, 1, 1]);
      pk.pop();
    });
    pk.push(M4.translate(0, 3.55, 0.3), M4.rotZ(PI / 2));
    pk.prism(8, 0.08, 0.08, -4.5, 0.08, 0.08, 4.5, [0.8, 0.8, 0.8]);
    pk.pop();
    const mt = B.b('bunkerMetal');
    box(mt, 0, 0, 0.06, 2.3, 3.75, 0.12, [0.9, 0.9, 0.9], 0, 1);
    box(mt, -3.3, 0, 0.3, 1.0, 1.8, 0.5, [0.7, 0.7, 0.7], 0, 1);
    box(mt, 3.4, 1.2, 0.2, 0.6, 0.8, 0.3, [0.7, 0.7, 0.7], 0, 1);
    const W = {
      list: B.build(r),
      door: mesh(r, b => {
        b.push(M4.translate(0, 0, 0.2));
        b.box(1.7, 3.3, 0.16, [1, 1, 1], { base: true });
        b.pop();
        K.tube(b, [[-0.95, 3.32, 0.32], [0.95, 3.32, 0.32]], [0.12, 0.12], 8, [0.9, 0.9, 0.86]);
        b.quad([-0.88, 0.05, 0.31], [0.88, 0.05, 0.31], [0.88, 3.3, 0.31], [-0.88, 3.3, 0.31], [1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      }),
      lamp: mesh(r, b => {
        b.push(M4.translate(0, 3.85, 0.35));
        b.box(0.9, 0.12, 0.3, [1, 0.92, 0.74, 1]);
        b.pop();
      }),
      outhouse: mesh(r, b => {
        const w = 1.55, d = 1.45, h = 2.45, hb = 2.2;
        b.quad([-w / 2, 0, -d / 2], [-w / 2, 0, d / 2], [-w / 2, hb, d / 2], [-w / 2, h, -d / 2], [0.85, 0.85, 0.85], [[0, 0], [1, 0], [1, 1.4], [0, 1.6]]);
        b.quad([w / 2, 0, d / 2], [w / 2, 0, -d / 2], [w / 2, h, -d / 2], [w / 2, hb, d / 2], [0.8, 0.8, 0.8], [[0, 0], [1, 0], [1, 1.6], [0, 1.4]]);
        b.quad([w / 2, 0, -d / 2], [-w / 2, 0, -d / 2], [-w / 2, h, -d / 2], [w / 2, h, -d / 2], [0.6, 0.6, 0.6], [[0, 0], [1, 0], [1, 1.6], [0, 1.6]]);
        [[-w / 2, -0.58], [w / 2 - 0.16, 0.58]].forEach(([x]) => b.quad([x, 0, d / 2], [x + 0.16, 0, d / 2], [x + 0.16, hb, d / 2], [x, hb, d / 2], [0.9, 0.9, 0.9], [[0, 0], [0.12, 0], [0.12, 1.4], [0, 1.4]]));
        b.quad([-w / 2, hb - 0.32, d / 2], [w / 2, hb - 0.32, d / 2], [w / 2, hb, d / 2], [-w / 2, hb, d / 2], [0.9, 0.9, 0.9], [[0, 0], [1, 0], [1, 0.2], [0, 0.2]]);
        b.quad([-w / 2 - 0.15, hb + 0.05, d / 2 + 0.25], [w / 2 + 0.15, hb + 0.05, d / 2 + 0.25], [w / 2 + 0.15, h + 0.1, -d / 2 - 0.1], [-w / 2 - 0.15, h + 0.1, -d / 2 - 0.1], [0.75, 0.75, 0.75], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      }),
      outhouseMoss: mesh(r, b => {
        b.quad([-0.95, 2.3, 1.0], [0.1, 2.3, 1.0], [0.1, 2.6, -0.8], [-0.95, 2.6, -0.8], [1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
        for (let i = 0; i < 7; i++) {
          const x = -0.92 + i * 0.12, len = 0.1 + (i % 3) * 0.07;
          b.quad([x, 2.32, 1.0], [x + 0.11, 2.32, 1.0], [x + 0.11, 2.32 - len, 1.02], [x, 2.32 - len, 1.02], [1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
        }
        b.quad([-0.95, 2.45, 0.4], [-0.55, 2.45, 0.4], [-0.5, 3.3, 0.2], [-1.0, 3.3, 0.2], [1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      }),
      outhouseDoor: mesh(r, b => {
        b.quad([-1.22, 0.02, 0.02], [0, 0.02, 0.02], [0, 2.18, 0.02], [-1.22, 2.18, 0.02], [1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
        b.quad([0, 0.02, -0.02], [-1.22, 0.02, -0.02], [-1.22, 2.18, -0.02], [0, 2.18, -0.02], [0.7, 0.7, 0.7], [[1, 0], [0, 0], [0, 1], [1, 1]]);
      })
    };
    return W;
  }

  function anchor(t, u, v, h) {
    const p = Cam.ground(t, u, v, h || 0);
    return [p[0], p[2]];
  }

  function buildRoad(r) {
    const B = Batch();
    PW.ground(B, 0, -60, 520, 21, 'grassAutumn');
    const e0 = anchor(10.8, 0.49, 0.99), e1 = anchor(10.8, 0.72, 0.62);
    const d = V3.norm([e1[0] - e0[0], 0, e1[1] - e0[1]]);
    const n = [-d[2], d[0]];
    const left = [[e0[0] - d[0] * 12, e0[1] - d[2] * 12], e0, e1, [e1[0] + d[0] * 20 + n[0] * -2, e1[1] + d[2] * 20 + n[1] * -2], [e1[0] + d[0] * 40 + n[0] * -8, e1[1] + d[2] * 40 + n[1] * -8], [e1[0] + d[0] * 60 + n[0] * -20, e1[1] + d[2] * 60 + n[1] * -20]];
    const W = 5.6;
    const mid = left.map(([x, z], i) => {
      const a = left[Math.max(0, i - 1)], b = left[Math.min(left.length - 1, i + 1)];
      const dd = V3.norm([b[0] - a[0], 0, b[1] - a[1]]);
      return [x - dd[2] * W / 2, z + dd[0] * W / 2];
    });
    PW.road(B, mid, W, 'gravel');
    guardrail(B, mid.slice(2).map(([x, z], i) => {
      const a = mid[Math.min(mid.length - 1, i + 2)], b = mid[Math.min(mid.length - 1, i + 3)];
      const dd = V3.norm([b[0] - a[0], 0, b[1] - a[1]]);
      return [x - dd[2] * (W / 2 + 0.6), z + dd[0] * (W / 2 + 0.6)];
    }));
    const g = rand(22);
    [[0.361, 0.639, 0.4, 3.0, 0.8, 1.5], [0.425, 0.628, -0.25, 1.8, 0.7, 1.2], [0.48, 0.642, 0.5, 2.4, 0.55, 1.2]].forEach(([u, v, rr, w, h, dp]) => {
      const p = anchor(10.8, u, v);
      slab(B, 'concrete', p[0], 0, p[1] - dp / 2, w, h, dp, rr, [1.05, 1.05, 1.05], 1.2);
    });
    brickShed(B, 1.56, -25.9, -0.3, 4.2, 3.4, 2.7, 'corrRust');
    [[-16, -18, 11, 'leavesGreen'], [-26, -42, 12, 'leavesGreen'], [-8, -60, 11, 'leavesDark'], [14, -70, 12, 'leavesGreen'], [28, -48, 11, 'leavesDark'], [16, 6, 12, 'leavesGreen']].forEach(([x, z, h, lv], i) => PW.oak(B, x, z, h, 31 + i, lv));
    PW.poplar(B, 14, -2, 16, 37);
    for (let i = 0; i < 48; i++) {
      const a = -1.6 + g() * 3.0, rr = 90 + g() * 150;
      PW.oak(B, S(a) * rr, -C(a) * rr - 10, 8 + g() * 6, 40 + i, g() < 0.5 ? 'leavesDark' : 'leavesGreen');
    }
    for (let i = 0; i < 30; i++) PW.bush(B, -60 + g() * 120, -20 - g() * 80, 1.4 + g() * 1.6, 90 + i);
    PW.tufts(B, -6, -10, 10, 70, 23);
    PW.tufts(B, -10, -24, 10, 50, 26);
    PW.hills(B, 0, -60, 220, 25, 22);
    return { list: B.build(r) };
  }

  function buildArmy(r) {
    const B = Batch();
    PW.ground(B, 0, -20, 300, 41, 'grassGreen');
    PW.house(B, { x: -9, z: -21, w: 9, d: 6, h: 2.8, roofH: 2.6, rot: 0.1, ridge: 'x', wall: 'plankGrey', gable: 'plankGrey', roof: 'slate', windows: [[0, 0.3, 1.0, 1.0, 1.0], [0, 0.7, 1.0, 1.0, 1.0]] });
    PW.house(B, { x: 6, z: -25, w: 8, d: 6, h: 2.8, roofH: 2.4, rot: -0.15, ridge: 'x', wall: 'plankBlue', gable: 'plankBlue', roof: 'skeleton' });
    PW.fence(B, [[-16, -15], [-8, -14.2], [-1, -13.6], [5, -13.2], [12, -14]], { tex: 'plankGrey', h: 1.6, posts: true });
    PW.pole(B, -6.5, -12, 8, false);
    PW.pole(B, 10, -30, 8, false);
    PW.wires(B, [-6.5, -12], [10, -30], 7.2);
    PW.oak(B, -20, -26, 12, 42, 'leavesGreen');
    PW.oak(B, 16, -32, 12, 43, 'leavesDark');
    PW.poplar(B, 22, -28, 18, 44);
    ringOfTrees(B, 0, -20, 50, 120, 40, 45, ['leavesGreen', 'leavesDark', 'poplar', 'bush']);
    PW.tufts(B, 0, -6, 8, 80, 46);
    PW.hills(B, 0, -20, 170, 47, 18);
    return { list: B.build(r), tractor: mesh(r, b => tractor(b)) };
  }

  function buildWheel(r) {
    const B = Batch();
    PW.ground(B, 0, -30, 300, 51, 'grassGrey');
    floorQuad(B.b('asphalt'), -30, -60, 30, 8, 0.02, [0.8, 0.8, 0.8], 5);
    const cx = -2.4, cz = -8.7, ch = 7.2;
    [-1, 1].forEach(s => {
      lattice(B, 'latticeDark', cx - 3.2, 0, cz + s * 1.6, cx, ch, cz + s * 0.6, 0.45);
      lattice(B, 'latticeDark', cx + 3.2, 0, cz + s * 1.6, cx, ch, cz + s * 0.6, 0.45);
    });
    slab(B, 'rustFrame', cx, 0, cz, 6, 0.5, 3.6, 0, [0.7, 0.7, 0.7], 1);
    PW.oak(B, 9, -14, 13, 52, 'leavesDark');
    PW.oak(B, 13, -24, 14, 53, 'leavesAutumn');
    PW.oak(B, -20, -16, 12, 54, 'leavesDark');
    PW.oak(B, -24, -30, 14, 55, 'leavesDark');
    PW.oak(B, 18, -6, 12, 56, 'leavesAutumn');
    ringOfTrees(B, 0, -30, 40, 110, 40, 57, ['leavesDark', 'leavesAutumn', 'leavesGreen', 'dead']);
    PW.house(B, { x: 10, z: -60, w: 30, d: 10, h: 12, roofH: 0.5, rot: 0.1, ridge: 'x', wall: 'plasterGrey', roof: 'slate', windows: [[0, 0.2, 2, 2.5, 1.5], [0, 0.4, 2, 2.5, 1.5], [0, 0.6, 2, 2.5, 1.5], [0, 0.8, 2, 2.5, 1.5], [0, 0.2, 6, 2.5, 1.5], [0, 0.4, 6, 2.5, 1.5], [0, 0.6, 6, 2.5, 1.5], [0, 0.8, 6, 2.5, 1.5]] });
    const fr = B.b('rustFrame');
    [[-14, -8], [-14, -18], [-24, -8], [-24, -18]].forEach(([x, z]) => box(fr, x, 0, z, 0.2, 3.2, 0.2, [0.8, 0.8, 0.8]));
    B.b('tin').quad([-25, 3.2, -7], [-13, 3.2, -7], [-13, 3.5, -19], [-25, 3.5, -19], [0.6, 0.6, 0.6], [[0, 0], [4, 0], [4, 4], [0, 4]]);
    PW.fence(B, [[-10, -9], [-2, -10], [8, -11]], { tex: 'wire', h: 1.4, posts: true });
    PW.hills(B, 0, -30, 180, 58, 14);
    const wheel = mesh(r, b => {
      [-0.4, 0.4].forEach(z => b.quad([-6.95, -6.95, z], [6.95, -6.95, z], [6.95, 6.95, z], [-6.95, 6.95, z], [1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]));
      b.push(M4.rotX(PI / 2));
      b.prism(8, 0.3, 0.3, -0.8, 0.3, 0.3, 0.8, 0x3a2a22, { capTop: true, capBottom: true });
      b.pop();
    });
    const cabin = mesh(r, b => {
      b.push(M4.translate(0, -1.9, 0));
      b.prism(8, 0.85, 0.85, 0, 0.95, 0.95, 1.15, [1, 1, 1], { capTop: true, capBottom: true });
      b.pop();
      b.push(M4.translate(0, -0.75, 0));
      b.prism(8, 0.95, 0.95, 0, 0.3, 0.3, 0.45, [0.85, 0.85, 0.85], { capTop: true });
      b.pop();
      b.push(M4.translate(0, -0.3, 0));
      b.box(0.08, 0.6, 0.08, 0x3a2a22);
      b.pop();
    });
    return { list: B.build(r), wheel, cabin, wheelPos: [cx, ch, cz] };
  }

  function buildCellar(r) {
    const B = Batch();
    const y0 = -2.6;
    floorQuad(B.b('cellarDirt'), -2.5, -3, 2.5, 4, y0, [0.9, 0.9, 0.9], 3);
    const br = B.b('cellar');
    tiledWall(br, -2.2, 4, -2.2, -3.2, y0, y0 + 2.4, 2.2);
    tiledWall(br, 2.2, -3.2, 2.2, 4, y0, y0 + 2.4, 2.2);
    tiledWall(br, 2.2, 4, -2.2, 4, y0, y0 + 2.4, 2.2);
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * PI, a1 = ((i + 1) / 8) * PI;
      br.quad([C(a0) * 2.2, y0 + 2.4 + S(a0) * 1.1, 4], [C(a1) * 2.2, y0 + 2.4 + S(a1) * 1.1, 4], [C(a1) * 2.2, y0 + 2.4 + S(a1) * 1.1, -3.2], [C(a0) * 2.2, y0 + 2.4 + S(a0) * 1.1, -3.2], [0.85, 0.82, 0.78], [[i / 2, 0], [(i + 1) / 2, 0], [(i + 1) / 2, 3.5], [i / 2, 3.5]]);
    }
    const st = B.b('stair');
    for (let k = 0; k < 9; k++) {
      const z = -3.2 - k * 0.32, y = y0 + (k + 1) * 0.29;
      box(st, 0, y - 0.29, z - 0.16, 1.8, 0.29, 0.34, [0.9, 0.9, 0.9], 0, 0.8);
    }
    const sw = B.b('plankOld');
    tiledWall(sw, -0.95, -3.2, -0.95, -6.2, y0, 0.3, 1.6, [0.7, 0.7, 0.7]);
    tiledWall(sw, 0.95, -6.2, 0.95, -3.2, y0, 0.3, 1.6, [0.7, 0.7, 0.7]);
    B.b('cellar').quad([-2.2, y0 + 2.4, -3.2], [2.2, y0 + 2.4, -3.2], [2.2, 1.2, -3.2], [-2.2, 1.2, -3.2], [0.8, 0.8, 0.8], [[0, 0], [2, 0], [2, 1], [0, 1]]);
    const rf = B.b('plankOld');
    rf.quad([-1.0, y0 + 2.3, -3.2], [1.0, y0 + 2.3, -3.2], [1.0, 0.9, -5.6], [-1.0, 0.9, -5.6], [0.45, 0.42, 0.4], [[0, 0], [1.4, 0], [1.4, 2], [0, 2]]);
    [-1, 1].forEach(sd => rf.quad([sd * 0.95, 0.3, -6.2], [sd * 0.95, 0.3, -3.2], [sd * 1.1, 1.0, -3.2], [sd * 1.1, 1.0, -6.2], [0.6, 0.58, 0.55], [[0, 0], [2, 0], [2, 0.5], [0, 0.5]]));
    B.b('flat').quad([-1.2, y0 + 1.0, 3.99], [-0.4, y0 + 1.0, 3.99], [-0.4, y0 + 2.2, 3.99], [-1.2, y0 + 2.2, 3.99], 0x2a1a10);
    B.b('flat').quad([-0.1, y0 + 1.4, 3.98], [0.3, y0 + 1.4, 3.98], [0.3, y0 + 1.75, 3.98], [-0.1, y0 + 1.75, 3.98], 0xd8d0c0);
    PW.ground(B, 0, -40, 300, 61, 'grassAutumn');
    const gnd = B.b('flat');
    gnd.quad([-1.0, 0.01, -3.0], [1.0, 0.01, -3.0], [1.0, 0.01, -6.2], [-1.0, 0.01, -6.2], 0x14100c);
    const hatch = B.b('plankBlue');
    hatch.quad([1.0, 0.05, -6.2], [2.2, 0.6, -6.4], [2.2, 0.6, -3.0], [1.0, 0.05, -3.0], [0.9, 0.9, 0.9], [[0, 0], [0.6, 0], [0.6, 1.6], [0, 1.6]]);
    PW.house(B, { x: 14, z: -34, w: 8, d: 6, h: 2.8, roofH: 2.6, rot: -0.4, ridge: 'x', wall: 'plaster', roof: 'skeleton' });
    PW.oak(B, -6, -18, 13, 62, 'leavesAutumn');
    PW.oak(B, 4, -26, 12, 63, 'leavesAutumn');
    PW.oak(B, -14, -30, 14, 64, 'leavesDark');
    PW.oak(B, 9, -14, 11, 65, 'leavesAutumn');
    PW.poplar(B, -2, -40, 18, 66);
    ringOfTrees(B, 0, -30, 30, 100, 40, 67, ['leavesAutumn', 'leavesDark', 'poplar', 'bush']);
    PW.tufts(B, 0, -17, 6, 90, 68);
    PW.tufts(B, -4, -24, 10, 80, 69);
    PW.hills(B, 0, -30, 160, 70, 16);
    return { list: B.build(r) };
  }

  function buildVillage(r) {
    const B = Batch();
    const A = (u, v) => anchor(24.4, u, v);
    PW.ground(B, 0, -30, 400, 71);
    const h0 = A(0.583, 0.48), fire0 = A(0.53, 0.485);
    PW.road(B, [[0.6, 8], [0.6, -8], [fire0[0] + 2.5, fire0[1] + 4], [h0[0] + 1, h0[1] + 6], [h0[0] + 9, h0[1] - 10], [h0[0] + 16, h0[1] - 40]], 8, 'dirt');
    PW.house(B, { x: h0[0] + 1.0, z: h0[1] - 3.4, w: 8, d: 7, h: 2.9, roofH: 3.2, rot: 0.08, ridge: 'z', wall: 'plaster', gable: 'plankBrown', roof: 'slate', chimney: [1.6, -0.5], windows: [[0, 0.3, 1.0, 1.0, 1.2], [0, 0.7, 1.0, 1.0, 1.2], [3, 0.5, 3.3, 1.0, 1.3]] });
    const bs = A(0.465, 0.48);
    brickShed(B, bs[0], bs[1] - 1.0, 0.1, 2.4, 2.4, 2.2, 'brickRed');
    PW.house(B, { x: h0[0] + 18, z: h0[1] - 8, w: 8, d: 6, h: 2.8, roofH: 2.6, rot: -0.3, ridge: 'x', wall: 'plaster', roof: 'skeleton' });
    PW.house(B, { x: h0[0] - 14, z: h0[1] - 16, w: 8, d: 6, h: 2.8, roofH: 2.6, rot: 0.2, ridge: 'x', wall: 'plankBlue', gable: 'plankBlue', roof: 'slate' });
    const f0 = A(0.0, 0.62), f1 = A(0.43, 0.545);
    PW.fence(B, [[f0[0] - 4, f0[1] + 3], f0, f1, [f1[0] + 0.6, f1[1] - 2.5]], { tex: 'plankGrey', h: 2.3, posts: true });
    PW.fence(B, [[h0[0] + 6, h0[1] + 2], [h0[0] + 11, h0[1] + 1], [h0[0] + 15, h0[1] - 1]], { tex: 'plankGreySolid', h: 1.7, posts: true });
    const cr = A(0.47, 0.515);
    PW.crate(B, cr[0], cr[1], 0.1);
    const v8 = anchor(27.0, 0.18, 0.72);
    PW.crate(B, v8[0], v8[1], 0.25);
    PW.shed(B, { x: v8[0] - 2.6, z: v8[1] + 1.2, rot: -PI / 2 });
    const pl = A(0.72, 0.47);
    PW.pole(B, pl[0], pl[1], 8.5, false);
    PW.pole(B, pl[0] + 3, pl[1] - 16, 8.5, false);
    PW.wires(B, pl, [pl[0] + 3, pl[1] - 16], 7.7);
    [[0.3, 0.47, 18], [0.36, 0.475, 17], [0.5, 0.47, 19], [0.63, 0.472, 18], [0.7, 0.47, 17], [0.2, 0.48, 16], [0.82, 0.468, 17], [0.42, 0.47, 18]].forEach(([u, v, h], i) => {
      const p = A(u, v);
      PW.poplar(B, p[0], p[1] - 4, h, 72 + i);
    });
    [[0.1, 0.5, 13, 'leavesAutumn'], [0.9, 0.49, 12, 'leavesAutumn'], [0.25, 0.49, 13, 'leavesAutumn']].forEach(([u, v, h, lv], i) => {
      const p = A(u, v);
      PW.oak(B, p[0], p[1] - 3, h, 82 + i, lv);
    });
    PW.deadTree(B, h0[0] + 7, h0[1] + 6, 9, 88);
    PW.bush(B, h0[0] + 6, h0[1] + 9, 2.2, 89);
    PW.bush(B, h0[0] + 9, h0[1] + 11, 2.6, 90);
    ringOfTrees(B, h0[0], h0[1], 50, 140, 50, 92, ['leavesAutumn', 'poplar', 'leavesDark', 'bush']);
    PW.tufts(B, -3, -10, 6, 30, 93);
    PW.tufts(B, 5, -16, 6, 30, 94);
    PW.hills(B, 0, -40, 200, 95, 16);
    const fireLogs = mesh(r, b => {
      for (let i = 0; i < 5; i++) {
        b.push(M4.rotY(i * 1.25), M4.translate(0, 0.08, 0), M4.rotZ(0.25));
        b.box(0.08, 0.08, 0.9, 0x2a1a10);
        b.pop();
      }
    });
    return { list: B.build(r), van: mesh(r, b => uaz(b)), fireLogs, fire: fire0, vanPos: A(0.9, 0.445) };
  }

  function buildCtrlIn(r) {
    const B = Batch();
    floorQuad(B.b('cellarDirt'), -8, -16, 8, 6, 0, [0.5, 0.48, 0.46], 3);
    const br = B.b('brickRed');
    box(br, -0.85, 0, -0.95, 1.0, 3.6, 1.0, [0.75, 0.72, 0.7], 0, 1);
    tiledWall(br, -4.2, 5, -4.2, -11, 0, 3.6, 2, [0.42, 0.42, 0.42]);
    tiledWall(br, 4.4, -11, 4.4, 5, 0, 3.6, 2, [0.5, 0.5, 0.5]);
    tiledWall(br, -4.2, -11, 2.0, -11, 0, 3.6, 2, [0.5, 0.5, 0.5]);
    tiledWall(br, 3.4, -11, 4.4, -11, 0, 3.6, 2, [0.5, 0.5, 0.5]);
    br.quad([2.0, 2.5, -11], [3.4, 2.5, -11], [3.4, 3.6, -11], [2.0, 3.6, -11], [0.5, 0.5, 0.5], [[0, 0], [0.7, 0], [0.7, 0.5], [0, 0.5]]);
    const fl = B.b('flat');
    [[-3, -5], [-6.5, -9]].forEach(([z0, z1]) => fl.quad([4.38, 1.2, z0], [4.38, 1.2, z1], [4.38, 2.6, z1], [4.38, 2.6, z0], [0.72, 0.76, 0.8, 1]));
    [[-3.6, -4.4], [-7.2, -8.0]].forEach(([z0, z1]) => box(fl, 4.35, 1.2, (z0 + z1) / 2, 0.06, 1.4, 0.06, 0x1a1816));
    fl.quad([-8, 3.6, 6], [8, 3.6, 6], [8, 3.6, -11], [-8, 3.6, -11], 0x121010);
    for (let i = 0; i < 6; i++) box(fl, 0, 3.3, 2 - i * 2.6, 8.6, 0.3, 0.25, 0x1e1a16);
    tiledWall(B.b('plankGate'), -4.15, -0.6, -4.15, -4.4, 0, 3.0, 2.6, [0.6, 0.62, 0.66]);
    fl.quad([-4.18, 0, -4.6], [-4.18, 0, -6.2], [-4.18, 3.0, -6.2], [-4.18, 3.0, -4.6], [0.85, 0.88, 0.9, 1]);
    floorQuad(B.b('dirt'), -12, -40, 12, -11, 0.01, [0.9, 0.9, 0.9], 4);
    PW.house(B, { x: 3, z: -24, w: 10, d: 7, h: 3.2, roofH: 2.4, rot: 0, ridge: 'x', wall: 'plaster', roof: 'slate', windows: [[0, 0.2, 1.0, 1.2, 1.3], [0, 0.5, 1.0, 1.2, 1.3], [0, 0.8, 1.0, 1.2, 1.3]] });
    PW.oak(B, -1, -20, 12, 101, 'leavesGreen');
    return { list: B.build(r) };
  }

  function buildCtrlOut(r) {
    const B = Batch();
    PW.ground(B, 0, -20, 300, 111);
    floorQuad(B.b('asphalt'), -12, -40, 1.8, 12, 0.02, [0.72, 0.68, 0.64], 4);
    const bw = B.b('brickRed');
    tiledWall(bw, 1.9, 14, 1.9, -16, 0, 6.2, 2.2, [1.0, 0.92, 0.86]);
    tiledWall(bw, 1.9, -16, 9, -16, 0, 6.2, 2.2, [0.8, 0.74, 0.7]);
    const fl = B.b('flat');
    [-1.5, -5.5, -9.5, 2.5, 6.5].forEach(z => {
      fl.quad([1.88, 3.0, z + 0.9], [1.88, 3.0, z - 0.9], [1.88, 4.6, z - 0.9], [1.88, 4.6, z + 0.9], 0x1a1c1e);
      fl.quad([1.87, 2.9, z + 1.0], [1.87, 2.9, z - 1.0], [1.87, 3.0, z - 1.0], [1.87, 3.0, z + 1.0], 0xb8a890);
    });
    floorQuad(B.b('slate'), 1.9, -16, 9, 14, 6.2, [0.6, 0.6, 0.6], 3);
    PW.house(B, { x: -6, z: -20, w: 9, d: 7, h: 5.0, roofH: 2.8, rot: 0.35, ridge: 'x', wall: 'brickPink', roof: 'slate', chimney: [2, 0], windows: [[0, 0.3, 1.6, 1.2, 1.3], [0, 0.7, 1.6, 1.2, 1.3], [0, 0.3, 3.6, 1.2, 1.2], [0, 0.7, 3.6, 1.2, 1.2]] });
    PW.house(B, { x: -1, z: -34, w: 12, d: 7, h: 3.6, roofH: 2.0, rot: -0.1, ridge: 'x', wall: 'plaster', roof: 'slate', windows: [[0, 0.3, 1.2, 1.2, 1.2], [0, 0.7, 1.2, 1.2, 1.2]] });
    PW.pole(B, -4.5, -12, 9, false);
    PW.poplar(B, -12, -14, 17, 112);
    PW.oak(B, -16, -26, 13, 113, 'leavesDark');
    box(B.b('cellarDirt'), 0.9, 0, -1.6, 1.4, 0.35, 1.2, [0.8, 0.7, 0.6], 0.4, 1);
    ringOfTrees(B, 0, -30, 40, 120, 30, 114, ['leavesGreen', 'leavesDark', 'poplar']);
    PW.hills(B, 0, -30, 170, 115, 14);
    return { list: B.build(r), truck: mesh(r, b => zil(b)) };
  }

  function buildGate(r) {
    const B = Batch();
    const gz = -2.0;
    floorQuad(B.b('dirt'), -8, -10, 8, 6, 0, [0.62, 0.6, 0.58], 4);
    tiledWall(B.b('plankGate'), -7, gz, 0.75, gz, 0, 3.6, 2.6, [0.85, 0.85, 0.85]);
    B.b('flat').quad([-7, 3.6, gz], [0.75, 3.6, gz], [0.75, 3.9, gz], [-7, 3.9, gz], 0x3a342c);
    box(B.b('flat'), -1.1, 0, gz + 0.05, 0.12, 3.6, 0.08, 0x2a2622);
    box(B.b('flat'), -1.3, 1.2, gz + 0.08, 0.5, 0.08, 0.04, 0x1a1816);
    tiledWall(B.b('plasterGrey'), 0.75, gz, 1.1, 6, 0, 4.0, 2.4, [0.9, 0.86, 0.8]);
    tiledWall(B.b('plasterGrey'), -7, 6, -7, gz, 0, 3.6, 2.4, [0.7, 0.68, 0.64]);
    const cr = B.b('plankOld');
    const c0 = anchor(36.4, 0.16, 0.42, 0.8);
    const cz = Math.max(gz + 0.6, c0[1]);
    [[0, 0, 1.0, 0.8, 0.8, 0.3, 0], [-0.9, 0.3, 0.9, 0.7, 0.8, -0.2, 0], [-0.4, 0.1, 0.8, 0.6, 0.7, 0.1, 0.8]].forEach(([x, z, w, h, d, rr, y]) => box(cr, c0[0] + x, y, cz + z, w, h, d, [0.9, 0.9, 0.9], rr, 1));
    floorQuad(B.b('flat'), -9, -12, 9, gz - 0.05, 3.9, 0x6a6e72);
    return { list: B.build(r), barrel: mesh(r, b => PW.barrel(b)), barrelPos: anchor(36.4, 0.13, 0.74, 0.9) };
  }

  function buildHill(r) {
    const B = Batch();
    const A = (u, v) => anchor(41.45, u, v);
    PW.ground(B, 0, -30, 420, 121);
    floorQuad(B.b('asphalt'), -30, -40, 30, 20, 0.02, [0.8, 0.76, 0.72], 5);
    floorQuad(B.b('tin'), -2.5, -2.0, 2.5, 3.0, 3.75, [0.6, 0.58, 0.55], 2);
    tiledWall(B.b('brickRed'), -2.5, -2.0, 2.5, -2.0, 0, 3.75, 2, [0.9, 0.85, 0.8]);
    const w0 = A(0.0, 0.8), w1 = A(0.34, 0.72);
    tiledWall(B.b('brickRed'), w0[0] - 3, w0[1] + 1, w0[0], w0[1], 0, 3.0, 2, [1.0, 0.9, 0.82]);
    tiledWall(B.b('brickRed'), w0[0], w0[1], w1[0], w1[1], 0, 3.0, 2, [1.0, 0.9, 0.82]);
    const bb = A(0.68, 0.745);
    PW.house(B, { x: bb[0] + 2.2, z: bb[1] - 4.0, w: 7, d: 7, h: 5.0, roofH: 2.4, rot: 0.15, ridge: 'z', wall: 'brickPink', gable: 'brickPink', roof: 'slate', windows: [[0, 0.5, 2.0, 1.0, 1.2]] });
    const lb = A(0.46, 0.61);
    PW.house(B, { x: lb[0], z: lb[1] - 3.5, w: 24, d: 7, h: 3.0, roofH: 1.8, rot: 0.1, ridge: 'x', wall: 'plaster', roof: 'slate', windows: [[0, 0.1, 1.2, 1.0, 1.0], [0, 0.25, 1.2, 1.0, 1.0], [0, 0.4, 1.2, 1.0, 1.0], [0, 0.55, 1.2, 1.0, 1.0], [0, 0.7, 1.2, 1.0, 1.0], [0, 0.85, 1.2, 1.0, 1.0]] });
    PW.house(B, { x: 16, z: 6, w: 12, d: 7, h: 3.0, roofH: 1.8, rot: PI / 2 + 0.1, ridge: 'x', wall: 'plaster', roof: 'slate', windows: [[0, 0.3, 1.2, 1.0, 1.0], [0, 0.7, 1.2, 1.0, 1.0]] });
    PW.house(B, { x: 10, z: 18, w: 10, d: 6, h: 2.8, roofH: 2.2, rot: PI + 0.2, ridge: 'x', wall: 'brickRed', roof: 'tin' });
    [[0.2, 0.56, 17], [0.43, 0.53, 18], [0.06, 0.57, 16], [0.62, 0.52, 17]].forEach(([u, v, h], i) => { const p = A(u, v); PW.poplar(B, p[0], p[1] - 3, h, 122 + i); });
    [[20, -6, 18], [26, 10, 17], [14, 28, 16], [-6, 24, 18]].forEach(([x, z, h], i) => PW.poplar(B, x, z, h, 126 + i));
    [[-24, -12, 12, 'leavesGreen'], [28, -30, 12, 'leavesDark'], [24, 22, 13, 'leavesGreen']].forEach(([x, z, h, lv], i) => PW.oak(B, x, z, h, 130 + i, lv));
    ringOfTrees(B, 0, -10, 70, 160, 40, 133, ['poplar', 'leavesGreen', 'leavesDark', 'bush']);
    PW.hills(B, 0, -20, 210, 134, 18);
    return { list: B.build(r), truck: mesh(r, b => zil(b)), car: mesh(r, b => PW.car(b)), carPos: A(0.44, 0.595), truckPos: anchor(42.6, 0.47, 0.84) };
  }

  function buildBugs(r) {
    const B = Batch();
    PW.ground(B, 0, -30, 360, 141, 'grassGrey');
    PW.road(B, [[0, 6], [0.5, -20], [-1, -40], [-6, -70], [-10, -110]], 6.5, 'asphalt');
    PW.road(B, [[20.5, 6], [20.8, -20], [19, -45], [14, -80]], 5.5, 'asphalt');
    floorQuad(B.b('asphalt'), -12, -14, 8, -6, 0.025, [0.85, 0.85, 0.85], 4);
    tiledWall(B.b('corrDark'), -16, -12.5, 5.2, -12.5, 0, 3.6, 3);
    tiledWall(B.b('corrDark'), -16, -12.5, -16, 4, 0, 3.6, 3, [0.8, 0.8, 0.8]);
    slab(B, 'concrete', 6.0, 0, -11.5, 1.0, 4.4, 1.0, 0, [0.9, 0.9, 0.9], 1);
    slab(B, 'concrete', 6.0, 4.4, -13.5, 1.0, 0.8, 5.0, 0, [0.9, 0.9, 0.9], 1);
    tiledWall(B.b('corrDark'), 6.5, -13.5, 16.8, -14.2, 0, 3.6, 3, [0.85, 0.85, 0.85]);
    tiledWall(B.b('corrRust'), 18.2, 3, 18.2, -12, 0, 3.6, 2.4);
    tiledWall(B.b('corrRust'), 18.2, -12, 13, -16, 0, 3.6, 2.4, [0.8, 0.8, 0.8]);
    const hb = B.b('grass#valley');
    [[-1, 30, -32], [1, 28, 4]].forEach(([s, h, x0]) => {
      for (let k = 0; k < 14; k++) {
        const z0 = 30 - k * 12, z1 = z0 - 12;
        const xIn = x0 + s * 8, xOut = x0 + s * 60;
        hb.quad([xIn, 0, z0], [xIn, 0, z1], [xOut, h, z1], [xOut, h, z0], [0.75, 0.74, 0.62], [[0, z0 / 8], [0, z1 / 8], [4, z1 / 8], [4, z0 / 8]]);
      }
    });
    PW.oak(B, 18, -34, 12, 142, 'leavesGreen');
    PW.oak(B, -22, -40, 13, 143, 'leavesDark');
    PW.oak(B, -28, -10, 12, 144, 'leavesGreen');
    PW.poplar(B, 26, -40, 17, 145);
    PW.bush(B, -8, -60, 2.4, 146);
    PW.bush(B, 12, -70, 2.6, 147);
    ringOfTrees(B, 8, -40, 70, 160, 30, 148, ['leavesGreen', 'leavesDark', 'bush']);
    return { list: B.build(r) };
  }

  function buildBarrel(r) {
    const B = Batch();
    PW.ground(B, 0, -10, 200, 151, 'grassGreen');
    PW.tufts(B, 0, -3, 4, 70, 152);
    const br = B.b('brickRed');
    [[-0.55, -1.6, 0.4], [0.62, -1.45, -0.3], [0.5, -0.95, 1.2], [-0.5, -2.2, 0.9], [0.7, -2.15, 0.2], [-0.3, -0.95, 0.5]].forEach(([x, z, rr]) => box(br, x, 0, z, 0.24, 0.12, 0.13, [0.75, 0.62, 0.58], rr, 0.5));
    slab(B, 'cabTarp', 3.2, 0, -7.5, 4.5, 2.6, 2.6, 0.3, [0.8, 0.9, 0.8], 2);
    PW.house(B, { x: -6, z: -12, w: 7, d: 6, h: 2.8, roofH: 2.2, rot: 0.3, ridge: 'x', wall: 'plankGrey', gable: 'plankGrey', roof: 'tin' });
    PW.bush(B, -2.5, -6, 1.6, 153);
    PW.bush(B, 4.5, -4, 1.8, 154);
    ringOfTrees(B, 0, -10, 20, 60, 24, 155, ['leavesGreen', 'leavesDark', 'bush']);
    return { list: B.build(r), barrel: mesh(r, b => {
      b.prism(16, 0.4, 0.4, 0, 0.44, 0.44, 0.62, [1, 1, 1], { capTop: false, capBottom: true });
      b.disc(0.38, 16, 0x1a1008, 0.42);
    }), logs: mesh(r, b => {
      for (let i = 0; i < 7; i++) {
        b.push(M4.translate(S(i * 0.9) * 0.14, 0.45, C(i * 0.9) * 0.14), M4.rotY(i * 0.9), M4.rotZ(0.7));
        b.box(0.05, 0.05, 0.4, 0x2a1a0e);
        b.pop();
      }
    }) };
  }

  function buildMonument(r) {
    const B = Batch();
    PW.ground(B, 0, -20, 300, 161, 'grassGrey');
    floorQuad(B.b('asphalt'), -20, -40, 20, -6, 0.02, [0.8, 0.8, 0.8], 5);
    const em = anchor(57.3, 0.5, 0.67);
    slab(B, 'concrete', em[0], 0, em[1] - 0.6, 6.5, 0.8, 3.0, -0.25, [0.8, 0.8, 0.82], 1.5);
    slab(B, 'concrete', em[0], 0.8, em[1] - 0.6, 4.6, 0.45, 2.2, -0.25, [0.75, 0.75, 0.78], 1.5);
    [[-14, -40, 18, 14, 10], [8, -46, 24, 18, 12], [-30, -30, 12, 10, 12]].forEach(([x, z, w, h, d], i) => {
      PW.house(B, { x, z, w, d, h, roofH: 0.3, rot: 0.1 * i, ridge: 'x', wall: 'concreteDark', roof: 'concrete', windows: [[0, 0.2, 2, 1.8, 1.4], [0, 0.4, 2, 1.8, 1.4], [0, 0.6, 2, 1.8, 1.4], [0, 0.8, 2, 1.8, 1.4], [0, 0.2, 6, 1.8, 1.4], [0, 0.4, 6, 1.8, 1.4], [0, 0.6, 6, 1.8, 1.4], [0, 0.8, 6, 1.8, 1.4]] });
    });
    lattice(B, 'latticeDark', 4, 9, -18, 30, 9, -30, 1.0);
    lattice(B, 'latticeDark', 4, 0, -18, 4, 9, -18, 0.8);
    lattice(B, 'latticeDark', 18, 0, -24, 18, 9, -24, 0.8);
    PW.pole(B, -4.5, -9, 9, false);
    [[-6, -4, 8], [-9, -8, 9], [5, -5, 8], [-3, -2.5, 7]].forEach(([x, z, h], i) => PW.deadTree(B, x, z, h, 162 + i));
    [[-4, -3.5, 2.6], [2, -4, 2.2], [-7, -6, 2.8], [6, -6, 2.4]].forEach(([x, z, s], i) => PW.bush(B, x, z, s, 166 + i));
    ringOfTrees(B, 0, -20, 40, 120, 30, 170, ['dead', 'leavesDark', 'bush']);
    const emblem = mesh(r, b => {
      const arc = [];
      for (let i = 0; i <= 14; i++) {
        const a = -0.6 + i / 14 * 3.9;
        arc.push([C(a) * 1.6, 1.9 + S(a) * 1.6, 0]);
      }
      arc.forEach((p, i) => { if (i === arc.length - 1) return; const q = arc[i + 1]; const w0 = 0.22 + 0.26 * S(i / 14 * PI), w1 = 0.22 + 0.26 * S((i + 1) / 14 * PI); const n0 = V3.norm([p[0], p[1] - 1.9, 0]), n1 = V3.norm([q[0], q[1] - 1.9, 0]); [-0.14, 0.14].forEach(z => b.quad([p[0], p[1], z], [q[0], q[1], z], [q[0] - n1[0] * w1, q[1] - n1[1] * w1, z], [p[0] - n0[0] * w0, p[1] - n0[1] * w0, z], [1, 1, 1])); b.quad([p[0], p[1], -0.14], [q[0], q[1], -0.14], [q[0], q[1], 0.14], [p[0], p[1], 0.14], [0.8, 0.8, 0.8]); });
      b.push(M4.translate(-0.4, 0.4, 0), M4.rotZ(0.65));
      b.box(0.36, 3.4, 0.36, [1, 1, 1], { base: true });
      b.pop();
      b.push(M4.translate(0.72, 2.75, 0), M4.rotZ(0.65));
      b.box(1.7, 0.9, 0.62, [1, 1, 1]);
      b.pop();
      b.push(M4.translate(1.15, 0.3, 0), M4.rotZ(-0.5));
      b.box(0.24, 1.2, 0.26, [1, 1, 1], { base: true });
      b.pop();
    });
    return { list: B.build(r), emblem, emblemPos: anchor(57.3, 0.5, 0.67) };
  }

  function buildSign(r) {
    const B = Batch();
    const A = (u, v) => anchor(59.4, u, v);
    PW.ground(B, 0, -30, 360, 181, 'grassGrey');
    floorQuad(B.b('asphalt'), -60, -90, 60, 20, 0.02, [0.85, 0.85, 0.85], 6);
    const sb = A(0.5, 0.57);
    const R = 7;
    const bc = [sb[0], sb[1] - R + 1.5];
    const curb = B.b('concrete');
    for (let i = 0; i < 28; i++) {
      const a0 = i / 28 * PI * 2, a1 = (i + 1) / 28 * PI * 2;
      const p0 = [bc[0] + S(a0) * R, bc[1] - C(a0) * R], p1 = [bc[0] + S(a1) * R, bc[1] - C(a1) * R];
      wallQuad(curb, p0[0], p0[1], p1[0], p1[1], 0, 0.35, [0.85, 0.85, 0.85], 1);
    }
    const soil = B.b('cellarDirt');
    for (let i = 0; i < 28; i++) {
      const a0 = i / 28 * PI * 2, a1 = (i + 1) / 28 * PI * 2;
      soil.tri([bc[0], 0.3, bc[1]], [bc[0] + S(a1) * R, 0.3, bc[1] - C(a1) * R], [bc[0] + S(a0) * R, 0.3, bc[1] - C(a0) * R], [0.7, 0.7, 0.66]);
    }
    PW.tufts(B, bc[0], bc[1], 6, 40, 182);
    [[0.15, 0.53, 11], [0.32, 0.5, 12], [0.62, 0.52, 10], [0.75, 0.53, 11], [0.9, 0.55, 12], [0.05, 0.55, 11], [0.45, 0.5, 10], [0.55, 0.5, 12]].forEach(([u, v, h], i) => { const p = A(u, v); PW.deadTree(B, p[0], p[1] - 6, h, 183 + i); });
    ringOfTrees(B, bc[0], bc[1], 50, 150, 40, 191, ['dead', 'dead', 'leavesDark', 'bush']);
    PW.hills(B, 0, -30, 200, 192, 16);
    const sign = mesh(r, b => {
      [-2.2, 2.2].forEach(x => { b.push(M4.translate(x, 0, 0)); b.box(0.5, 2.4, 0.4, [0.82, 0.82, 0.82], { base: true }); b.pop(); });
      b.push(M4.translate(0, 2.0, 0));
      b.box(6.2, 0.1, 0.25, [0.7, 0.7, 0.7], { base: true });
      b.pop();
    });
    const board = mesh(r, b => b.quad([-3.1, 2.1, 0.14], [3.1, 2.1, 0.14], [3.1, 2.9, 0.14], [-3.1, 2.9, 0.14], [1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]));
    const letters = mesh(r, b => b.quad([-3.6, 2.95, 0.0], [3.6, 2.95, 0.0], [3.6, 5.1, 0.0], [-3.6, 5.1, 0.0], [1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]));
    const panels = mesh(r, b => [-1.1, 1.1].forEach(x => b.quad([x - 0.8, 0.4, 0.2], [x + 0.8, 0.4, 0.2], [x + 0.8, 1.9, 0.2], [x - 0.8, 1.9, 0.2], 0xc8cac8)));
    const bt = A(0.255, 0.565);
    return { list: B.build(r), sign, board, letters, panels, btr: mesh(r, b => PW.btr(b)), signPos: [sb[0], 0.3, sb[1] - 1.4], btrPos: bt, bodies: [A(0.52, 0.74), A(0.05, 0.6), A(0.36, 0.6)] };
  }

  function crane(B, x, z, h, jib, rot) {
    lattice(B, 'lattice', x, 0, z, x, h, z, 1.6);
    lattice(B, 'lattice', x - C(rot) * jib * 0.25, h, z + S(rot) * jib * 0.25, x + C(rot) * jib, h, z - S(rot) * jib, 1.1);
    box(B.b('excavator'), x + 0.9, h - 3.0, z + 0.9, 2.2, 2.2, 2.2, [0.9, 0.9, 0.9], rot, 2);
  }

  function buildPlant(r) {
    const B = Batch();
    const A = (u, v) => anchor(64.6, u, v);
    PW.ground(B, 0, -60, 700, 201, 'grassGreen');
    PW.tufts(B, 0, -8, 12, 140, 202);
    PW.tufts(B, -10, -24, 12, 90, 203);
    const far = (u, v, d) => { const p = Cam.at(64.6, u, v, d); return [p[0], p[2]]; };
    const sc = far(0.38, 0.613, 150);
    const sx = sc[0], sz = sc[1] - 30;
    const sw = B.b('sarcophagus');
    tiledWall(sw, sx - 45, sz + 30, sx + 45, sz + 30, 0, 50, 16);
    tiledWall(sw, sx + 45, sz + 30, sx + 45, sz - 30, 0, 50, 16, [0.8, 0.8, 0.8]);
    tiledWall(sw, sx - 45, sz - 30, sx - 45, sz + 30, 0, 50, 16, [0.8, 0.8, 0.8]);
    floorQuad(B.b('concreteDark'), sx - 45, sz - 30, sx + 45, sz + 30, 50, [0.8, 0.8, 0.8], 8);
    box(B.b('concrete'), sx - 66, 0, sz + 34, 40, 18, 26, [0.85, 0.85, 0.85], 0, 4);
    box(B.b('sarcophagus'), sx + 10, 50, sz - 4, 40, 14, 36, [0.85, 0.85, 0.85], 0, 6);
    const st = B.b('stack');
    st.push(M4.translate(sx - 10, 0, sz - 14));
    st.prism(12, 5.5, 5.5, 0, 4.6, 4.6, 125, [1, 1, 1], { capTop: false });
    st.pop();
    lattice(B, 'lattice', sx - 10, 55, sz - 7, sx - 10, 125, sz - 8, 4.0);
    const hc = far(0.9, 0.6, 130);
    const hw = B.b('corrBlue');
    tiledWall(hw, hc[0] - 14, hc[1], hc[0] + 120, hc[1] - 10, 0, 40, 8, [1.05, 1.05, 1.1]);
    tiledWall(hw, hc[0] - 14, hc[1] - 40, hc[0] - 14, hc[1], 0, 40, 8, [0.8, 0.8, 0.85]);
    floorQuad(B.b('concreteDark'), hc[0] - 14, hc[1] - 40, hc[0] + 120, hc[1], 40, [0.8, 0.8, 0.8], 8);
    const fz = far(0.5, 0.64, 60);
    tiledWall(B.b('concrete'), -200, fz[1], 200, fz[1] - 6, 0, 3.2, 3, [0.95, 0.95, 0.95]);
    const c1 = far(0.66, 0.6, 75);
    crane(B, c1[0], c1[1], 62, 40, -0.4);
    crane(B, sx + 52, sz + 40, 70, 50, 2.4);
    lattice(B, 'latticeDark', sx - 40, 0, sz + 48, sx - 40, 32, sz + 48, 1.2);
    ringOfTrees(B, 0, -80, 220, 320, 30, 204, ['leavesDark', 'leavesGreen']);
    const W = { list: B.build(r) };
    W.booth = mesh(r, b => {
      b.push(M4.translate(0, 0.7, 0));
      b.box(2.6, 2.4, 4.6, [1, 1, 1], { base: true, uvScale: 0.4 });
      b.pop();
      b.quad([-1.3, 3.1, 2.3], [1.3, 3.1, 2.3], [1.3, 3.3, -2.3], [-1.3, 3.3, -2.3], 0x6a5a3a);
      [1.4, -1.4].forEach(z => [-1, 1].forEach(s => PW.wheel(b, s * 1.0, 0.42, z, 0.42, 0.25, 0x1e1e1c)));
    });
    W.boothFront = mesh(r, b => b.quad([1.31, 0.9, 2.2], [1.31, 0.9, -2.2], [1.31, 2.9, -2.2], [1.31, 2.9, 2.2], [1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]]));
    W.excavator = mesh(r, b => excavator(b));
    W.lamp = mesh(r, b => { b.push(M4.translate(0, 16, 0)); b.box(1.6, 0.5, 0.5, [1, 1, 0.92, 1]); b.pop(); b.prism(6, 0.2, 0.2, 0, 0.15, 0.15, 16, 0x2a2a2a); });
    W.boothPos = [A(0.65, 0.815), A(0.95, 0.78)];
    W.excavatorPos = anchor(66.8, 0.37, 0.745);
    W.lampPos = anchor(66.8, 0.36, 0.7);
    return W;
  }

  function buildFactory(r) {
    const B = Batch();
    const A = (u, v, h) => anchor(68.6, u, v, h);
    const far = (u, v, d) => { const p = Cam.at(68.6, u, v, d); return [p[0], p[2]]; };
    PW.ground(B, 0, -60, 900, 211, 'grassGreen');
    PW.tufts(B, 0, -8, 12, 140, 212);
    PW.tufts(B, -8, -20, 12, 90, 213);
    const fc = far(0.57, 0.6, 110);
    const fx = fc[0], fz = fc[1] - 20;
    const fk = B.b('corrDark');
    tiledWall(fk, fx - 35, fz + 20, fx + 35, fz + 20, 0, 26, 6, [0.6, 0.62, 0.7]);
    tiledWall(fk, fx + 35, fz + 20, fx + 35, fz - 20, 0, 26, 6, [0.5, 0.5, 0.55]);
    tiledWall(fk, fx - 35, fz - 20, fx - 35, fz + 20, 0, 26, 6, [0.5, 0.5, 0.55]);
    floorQuad(B.b('flat'), fx - 35, fz - 20, fx + 35, fz + 20, 26, 0x1c2026);
    [[-18, 6], [-6, 6], [6, 6]].forEach(([x, z]) => {
      const p = B.b('corrDark');
      p.push(M4.translate(fx + x, 26, fz + z));
      p.prism(8, 2.2, 2.2, 0, 2.0, 2.0, 12, [0.7, 0.7, 0.7], { capTop: true });
      p.pop();
    });
    tiledWall(B.b('corrBlue'), fx - 70, fz + 26, fx - 35, fz + 26, 0, 9, 4);
    tiledWall(B.b('corrBlue'), fx + 35, fz + 24, fx + 80, fz + 20, 0, 8, 4, [0.8, 0.8, 0.85]);
    [[fx - 130, fz + 30, 18], [fx + 120, fz + 34, 16], [fx + 150, fz + 26, 20]].forEach(([x, z, w], i) => box(B.b('corrRust'), x, 0, z, w, 5, 8, [0.8, 0.8, 0.8], 0.1 * i, 3));
    tiledWall(B.b('concrete'), fx - 260, fz + 30, fx + 260, fz + 28, 0, 3.0, 3, [0.95, 0.95, 0.95]);
    const c1 = far(0.21, 0.5, 70);
    crane(B, c1[0], c1[1], 34, 18, 0.6);
    const c2 = far(0.97, 0.55, 30);
    crane(B, c2[0], c2[1], 38, 26, 2.6);

    ringOfTrees(B, 0, -80, 260, 380, 30, 214, ['leavesDark', 'leavesGreen']);
    const lampPos = far(0.185, 0.5, 34);
    return { list: B.build(r), excavator: mesh(r, b => excavator(b)), excavatorPos: far(0.14, 0.6, 21), heli: mesh(r, b => PW.heli(b)), firePos: A(0.65, 0.81), lampPos, lamp: mesh(r, b => { b.push(M4.translate(0, 16, 0)); b.box(1.6, 0.5, 0.5, [1, 1, 0.92, 1]); b.pop(); b.prism(6, 0.2, 0.2, 0, 0.15, 0.15, 16, 0x2a2a2a); }) };
  }

  function buildDome(r) {
    return K.mesh(r, b => {
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
  }

  function build(r) {
    return {
      dome: buildDome(r),
      bunker: buildBunker(r),
      road: buildRoad(r),
      army: buildArmy(r),
      wheel: buildWheel(r),
      cellar: buildCellar(r),
      village: buildVillage(r),
      ctrlIn: buildCtrlIn(r),
      ctrlOut: buildCtrlOut(r),
      gate: buildGate(r),
      hill: buildHill(r),
      bugs: buildBugs(r),
      barrel: buildBarrel(r),
      monument: buildMonument(r),
      sign: buildSign(r),
      plant: buildPlant(r),
      factory: buildFactory(r),
      quad: mesh(r, b => b.quad([-0.5, 0, 0], [0.5, 0, 0], [0.5, 1, 0], [-0.5, 1, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]))
    };
  }

  window.DownWorld = { ENV, build, card, floorQuad };
})();
