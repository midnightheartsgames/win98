(function () {
  const { M4, V3, Builder, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const OGRE = { hipX: 0.15, hipY: -0.06, thigh: 0.5, shin: 0.5, chestY: 0.2, neckY: 0.5, shX: 0.36, shY: 0.4, upper: 0.4, fore: 0.38, headY: 0.1, head: 0.14 };
  const SCALE = { toilet: 2.0, washer: 2.0, freezer: 1.5, fridge: 1.3, can: 1.3 };
  const MAN = { hipX: 0.11, hipY: -0.05, thigh: 0.46, shin: 0.45, chestY: 0.13, neckY: 0.34, shX: 0.2, shY: 0.25, upper: 0.3, fore: 0.27, headY: 0.13, head: 0.105 };

  function limb(b, len, r0, r1, col, sides) {
    b.prism(sides || 8, r1, r1, -len, r0, r0, 0, col, { capTop: true });
    b.push(M4.translate(0, -len, 0));
    b.ellipsoid(r1, r1, r1, 8, 5, col);
    b.pop();
  }

  function buildOgre(r) {
    const M = {};
    const skin = [1, 1, 1];
    M.chest = mesh(r, b => {
      loft(b, [ring(-0.05, 0.22, 0.16, 0, skin), ring(0.15, 0.27, 0.19, 0.02, skin), ring(0.36, 0.38, 0.25, 0.04, skin), ring(0.5, 0.4, 0.23, 0.02, skin), ring(0.58, 0.22, 0.16, 0, skin)], 10, { capTop: true, capBottom: true });
      b.push(M4.translate(0, 0.42, 0.18));
      [-1, 1].forEach(s => { b.push(M4.translate(s * 0.13, 0, 0)); b.ellipsoid(0.13, 0.1, 0.08, 8, 5, skin); b.pop(); });
      b.pop();
      [-1, 1].forEach(s => { b.push(M4.translate(s * 0.34, 0.46, 0)); b.ellipsoid(0.16, 0.14, 0.15, 8, 6, skin); b.pop(); });
      [-1, 1].forEach(s => { b.push(M4.translate(s * 0.12, 0.08, 0.16)); b.ellipsoid(0.1, 0.16, 0.06, 6, 4, skin); b.pop(); });
    });
    M.pelvis = mesh(r, b => {
      b.push(M4.translate(0, -0.02, 0));
      b.ellipsoid(0.24, 0.17, 0.17, 10, 6, skin);
      b.pop();
    });
    M.loin = mesh(r, b => {
      b.prism(10, 0.27, 0.2, -0.06, 0.27, 0.2, 0.08, [1, 1, 1], { capTop: false });
      b.quad([-0.16, 0.0, 0.205], [0.16, 0.0, 0.205], [0.11, -0.36, 0.18], [-0.11, -0.36, 0.18], [1, 1, 1], [[0, 1], [1, 1], [1, 0], [0, 0]]);
      b.quad([0.16, 0.0, -0.205], [-0.16, 0.0, -0.205], [-0.11, -0.3, -0.18], [0.11, -0.3, -0.18], [0.8, 0.8, 0.8], [[0, 1], [1, 1], [1, 0], [0, 0]]);
    });
    M.head = mesh(r, b => {
      K.spherePatch(b, 0.15, 0.16, 0.15, -1.3, 1.3, -1.2, 1.2, 12, 10, [1, 1, 1], [1, 1]);
    });
    M.headBack = mesh(r, b => {
      K.spherePatch(b, 0.148, 0.158, 0.148, 1.3, PI * 2 - 1.3, -1.2, 1.2, 8, 8, [1, 1, 1], null);
      [-1, 1].forEach(s => {
        b.tri([s * 0.13, 0.04, 0.02], [s * 0.13, -0.03, -0.02], [s * 0.26, 0.1, -0.04], [1, 1, 1]);
        b.tri([s * 0.13, -0.03, -0.02], [s * 0.13, 0.04, 0.02], [s * 0.26, 0.1, -0.04], [1, 1, 1]);
      });
      b.push(M4.translate(0, -0.1, 0.06));
      b.ellipsoid(0.13, 0.08, 0.11, 8, 5, [1, 1, 1]);
      b.pop();
    });
    M.upper = mesh(r, b => limb(b, OGRE.upper, 0.13, 0.1, skin));
    M.fore = mesh(r, b => limb(b, OGRE.fore, 0.105, 0.075, skin));
    M.hand = mesh(r, b => { b.push(M4.translate(0, -0.08, 0)); b.ellipsoid(0.08, 0.1, 0.06, 8, 5, skin); b.pop(); });
    M.thigh = mesh(r, b => limb(b, OGRE.thigh, 0.15, 0.1, skin));
    M.shin = mesh(r, b => limb(b, OGRE.shin, 0.1, 0.07, skin));
    M.foot = mesh(r, b => { b.push(M4.translate(0, -0.04, 0.08)); b.box(0.16, 0.08, 0.3, skin); b.pop(); });
    M.neck = mesh(r, b => b.prism(8, 0.13, 0.12, -0.06, 0.1, 0.1, 0.12, skin));
    return M;
  }

  function buildMan(r) {
    const M = {};
    const suit = [1, 1, 1];
    M.chest = mesh(r, b => {
      loft(b, [ring(-0.06, 0.17, 0.12, 0, suit), ring(0.1, 0.18, 0.12, 0, suit), ring(0.26, 0.21, 0.12, 0, suit), ring(0.34, 0.12, 0.08, 0, suit)], 10, { capTop: true, capBottom: true });
      [-1, 1].forEach(s => { b.push(M4.translate(s * 0.19, 0.26, 0)); b.ellipsoid(0.07, 0.06, 0.07, 6, 4, suit); b.pop(); });
    });
    M.shirt = mesh(r, b => {
      b.quad([-0.08, 0.0, 0.126], [0.08, 0.0, 0.126], [0.06, 0.34, 0.09], [-0.06, 0.34, 0.09], [1, 1, 1], [[0.25, 0], [0.75, 0], [0.7, 1], [0.3, 1]]);
    });
    M.pelvis = mesh(r, b => { b.ellipsoid(0.16, 0.12, 0.11, 8, 5, suit); });
    M.head = mesh(r, b => K.spherePatch(b, 0.1, 0.122, 0.108, -1.3, 1.3, -1.25, 1.2, 12, 10, [1, 1, 1], [1, 1]));
    M.headBack = mesh(r, b => {
      K.spherePatch(b, 0.104, 0.126, 0.106, 1.3, PI * 2 - 1.3, -1.25, 1.2, 8, 8, 0x2a1e18, null);
      K.spherePatch(b, 0.108, 0.13, 0.112, -1.4, 1.4, 0.55, 1.3, 10, 4, 0x2a1e18, null);
    });
    M.neck = mesh(r, b => b.prism(8, 0.055, 0.055, -0.06, 0.05, 0.05, 0.1, 0xc99a7c));
    M.collar = mesh(r, b => b.prism(10, 0.07, 0.065, -0.02, 0.065, 0.06, 0.04, 0xecebf0));
    M.upper = mesh(r, b => limb(b, MAN.upper, 0.065, 0.055, suit));
    M.fore = mesh(r, b => limb(b, MAN.fore, 0.055, 0.045, suit));
    M.hand = mesh(r, b => {
      b.push(M4.translate(0, -0.01, 0));
      b.prism(8, 0.035, 0.035, -0.02, 0.035, 0.035, 0.0, 0xecebf0, { capTop: false });
      b.pop();
      b.push(M4.translate(0, -0.07, 0));
      b.ellipsoid(0.04, 0.055, 0.025, 6, 4, 0xc99a7c);
      b.pop();
    });
    M.thigh = mesh(r, b => limb(b, MAN.thigh, 0.08, 0.06, suit));
    M.shin = mesh(r, b => limb(b, MAN.shin, 0.06, 0.05, suit));
    M.foot = mesh(r, b => { b.push(M4.translate(0, -0.035, 0.06)); b.box(0.1, 0.07, 0.27, 0x1a1816); b.pop(); });
    return M;
  }

  function drawOgre(r, T, MS, m, o) {
    const sk = { texture: T.skinGreen };
    r.draw(MS.chest, m.chest, sk);
    r.draw(MS.pelvis, m.pelvis, sk);
    r.draw(MS.loin, m.pelvis, { texture: T.loin });
    r.draw(MS.neck, m.neck, sk);
    r.draw(MS.head, m.head, { texture: T.ogreFace });
    r.draw(MS.headBack, m.head, sk);
    ['L', 'R'].forEach(s => {
      r.draw(MS.upper, m['upper' + s], sk);
      r.draw(MS.fore, m['fore' + s], sk);
      r.draw(MS.hand, m['hand' + s], sk);
      r.draw(MS.thigh, m['thigh' + s], sk);
      r.draw(MS.shin, m['shin' + s], sk);
      r.draw(MS.foot, m['foot' + s], sk);
    });
  }

  function drawMan(r, T, MS, m, o) {
    const su = { texture: T.suit };
    r.draw(MS.chest, m.chest, su);
    r.draw(MS.shirt, m.chest, { texture: T.shirt });
    r.draw(MS.pelvis, m.pelvis, su);
    r.draw(MS.neck, m.neck);
    r.draw(MS.collar, m.neck);
    r.draw(MS.head, m.head, { texture: T.manFace, tint: o && o.burn ? [0.6, 0.45, 0.4] : undefined });
    r.draw(MS.headBack, m.head);
    ['L', 'R'].forEach(s => {
      r.draw(MS.upper, m['upper' + s], su);
      r.draw(MS.fore, m['fore' + s], su);
      r.draw(MS.hand, m['hand' + s]);
      r.draw(MS.thigh, m['thigh' + s], su);
      r.draw(MS.shin, m['shin' + s], su);
      r.draw(MS.foot, m['foot' + s]);
    });
  }

  function buildProps(r) {
    const P = {};
    P.toilet = mesh(r, b => {
      const w = 0xf4f4f6, g = 0xdcdce2;
      b.prism(12, 0.13, 0.17, 0, 0.17, 0.22, 0.32, g, { capTop: false });
      b.push(M4.translate(0, 0.32, 0.06));
      b.prism(14, 0.19, 0.25, 0, 0.2, 0.27, 0.1, w, { capTop: false });
      b.disc(0.17, 14, 0x9aa4ae, 0.05);
      b.prism(14, 0.2, 0.27, 0.1, 0.205, 0.275, 0.13, 0xe8e8ec, { capTop: true });
      b.pop();
      b.push(M4.translate(0, 0.45, -0.2));
      b.box(0.4, 0.38, 0.17, w, { base: true });
      b.push(M4.translate(0, 0.38, 0));
      b.box(0.44, 0.04, 0.2, g, { base: true });
      b.pop();
      b.pop();
      b.push(M4.translate(0, 0.46, -0.08), M4.rotX(-1.4));
      b.box(0.38, 0.03, 0.46, 0xf0f0f2, { base: true });
      b.pop();
    });
    P.washer = mesh(r, b => {
      b.push(M4.translate(0, 0, 0));
      b.box(0.6, 0.85, 0.58, 0xf2f2f4, { base: true, faces: { front: false } });
      b.pop();
    });
    P.washerFront = mesh(r, b => {
      b.quad([-0.3, 0, 0.291], [0.3, 0, 0.291], [0.3, 0.85, 0.291], [-0.3, 0.85, 0.291], [1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    });
    P.freezer = mesh(r, b => {
      b.box(1.25, 0.86, 0.66, 0xf6f6f8, { base: true });
      b.push(M4.translate(0, 0.86, 0));
      b.box(1.27, 0.06, 0.68, 0xeeeef2, { base: true });
      b.pop();
      b.push(M4.translate(-0.3, 0.6, 0.335));
      b.box(0.12, 0.05, 0.02, 0x8a8a90);
      b.pop();
    });
    P.fridge = mesh(r, b => {
      b.box(0.62, 1.55, 0.62, 0xc8ccd0, { base: true });
      b.push(M4.translate(0, 1.0, 0.315));
      b.box(0.56, 0.02, 0.02, 0x6a6e72);
      b.pop();
      b.push(M4.translate(0.22, 1.2, 0.33));
      b.box(0.04, 0.25, 0.04, 0x9a9ea2);
      b.pop();
      b.push(M4.translate(0, 1.3, 0.316));
      b.box(0.4, 0.3, 0.01, 0x30343a);
      b.pop();
    });
    P.canSide = mesh(r, b => {
      for (let i = 0; i < 20; i++) {
        const a0 = (i / 20) * PI * 2, a1 = ((i + 1) / 20) * PI * 2;
        const p = (a, y) => [S(a) * 0.5, y, C(a) * 0.5];
        const n0 = [S(a0), 0, C(a0)], n1 = [S(a1), 0, C(a1)];
        b.quad(p(a0, -0.3), p(a1, -0.3), p(a1, 0.3), p(a0, 0.3), [1, 1, 1], [[i / 20, 0], [(i + 1) / 20, 0], [(i + 1) / 20, 1], [i / 20, 1]], [n0, n1, n1, n0]);
      }
    });
    P.canLid = mesh(r, b => {
      [1, -1].forEach(s => {
        for (let i = 0; i < 20; i++) {
          const a0 = (i / 20) * PI * 2, a1 = ((i + 1) / 20) * PI * 2;
          const n = [0, s, 0];
          const pa = [S(a0) * 0.5, 0.3 * s, C(a0) * 0.5], pb = [S(a1) * 0.5, 0.3 * s, C(a1) * 0.5];
          const tri = s > 0 ? [[0, 0.3, 0], pa, pb] : [[0, -0.3, 0], pb, pa];
          const uv = (p) => [0.5 + p[0], 0.5 + p[2] * s];
          b.tri(tri[0], tri[1], tri[2], [1, 1, 1], tri.map(uv), [n, n, n]);
        }
      });
    });
    P.hornPole = mesh(r, b => {
      b.prism(6, 0.035, 0.035, 0, 0.03, 0.03, 1.55, 0x5a4a30);
      b.push(M4.translate(0, 1.55, 0));
      [-1, 1].forEach(s => { b.push(M4.rotZ(s * 0.5)); b.prism(5, 0.03, 0.03, 0, 0.025, 0.025, 0.32, 0x5a4a30); b.pop(); });
      b.pop();
    });
    P.horn = mesh(r, b => {
      const n = 16;
      const rings2 = [[-0.95, 0.3], [-0.15, 0.33], [-0.05, 0.37], [0.45, 0.52], [0.95, 0.74], [1.3, 0.96]];
      for (let j = 0; j < rings2.length - 1; j++) {
        const [z0, r0] = rings2[j], [z1, r1] = rings2[j + 1];
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
          const p = (a, z, rr) => [S(a) * rr, C(a) * rr, z];
          const nn = (a) => V3.norm([S(a), C(a), -(r1 - r0) / Math.max(0.01, z1 - z0)]);
          b.quad(p(a0, z0, r0), p(a1, z0, r0), p(a1, z1, r1), p(a0, z1, r1), [1, 1, 1], [[i / n * 3, z0], [(i + 1) / n * 3, z0], [(i + 1) / n * 3, z1], [i / n * 3, z1]], [nn(a0), nn(a1), nn(a1), nn(a0)]);
        }
      }
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        b.tri([0, 0, -0.95], [S(a1) * 0.3, C(a1) * 0.3, -0.95], [S(a0) * 0.3, C(a0) * 0.3, -0.95], [0.6, 0.6, 0.6]);
      }
    });
    P.hornInner = mesh(r, b => {
      const n = 16;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        b.tri([0, 0, 0.15], [S(a1) * 0.93, C(a1) * 0.93, 1.27], [S(a0) * 0.93, C(a0) * 0.93, 1.27], [1, 1, 1], [[0.5, 0.5], [0.5 + S(a1) * 0.5, 0.5 + C(a1) * 0.5], [0.5 + S(a0) * 0.5, 0.5 + C(a0) * 0.5]]);
      }
    });
    P.bolt = mesh(r, b => {
      b.prism(6, 0.012, 0.012, -0.02, 0.012, 0.012, 0.03, 0x8a8a84);
      b.push(M4.translate(0, 0.03, 0));
      b.prism(6, 0.02, 0.02, 0, 0.02, 0.02, 0.012, 0x9a9a94);
      b.pop();
    });
    P.debris = mesh(r, b => {
      b.box(0.3, 0.04, 0.2, 0xf0f0f2);
    });
    return P;
  }

  function build(r) {
    return { ogre: buildOgre(r), man: buildMan(r), P: buildProps(r) };
  }

  function drawProp(r, T, X, kind, M, o) {
    const P = X.P;
    const opt = o || {};
    if (kind === 'toilet') r.draw(P.toilet, M);
    else if (kind === 'washer') {
      r.draw(P.washer, M);
      r.draw(P.washerFront, M, { texture: T.washer });
    } else if (kind === 'freezer') r.draw(P.freezer, M);
    else if (kind === 'fridge') r.draw(P.fridge, M);
    else if (kind === 'can') {
      r.draw(P.canSide, M, { texture: T.canSide });
      r.draw(P.canLid, M, { texture: T.canLid });
    } else if (kind === 'horn') {
      r.draw(P.hornPole, M);
      const H = M4.chain(M, M4.translate(0, 1.72, 0), M4.rotY(opt.aim || 0), M4.rotX(opt.tilt || 0), M4.scale(0.85, 0.85, 0.85));
      r.draw(P.horn, H, { texture: T.rustHorn });
      r.draw(P.hornInner, H, { texture: T.rustHorn, tint: [0.55, 0.5, 0.46] });
    } else if (kind === 'debris') r.draw(P.debris, M);
  }

  window.ParadCast = { OGRE, MAN, SCALE, build, drawOgre, drawMan, drawProp, solve: Rig.solve };
})();
