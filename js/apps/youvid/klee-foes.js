(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;
  const F = window.KleeFaces;

  const COL = {
    cloth: 0x7a4a2c,
    clothRed: 0xb02a20,
    clothDark: 0x3c3632,
    skin: 0x8a6a50,
    mask: 0xeadfc4,
    maskRed: 0xd23a28,
    hole: 0x201814,
    hair: 0x2a2420,
    wood: 0x6a4a30,
    woodDark: 0x3a2818,
    slime: 0xbfeaff,
    bomb: 0xa82a1c,
    bombLight: 0xe85a2a,
    cream: 0xfff1e2,
    gold: 0xe6b450,
    book: 0x6a3a22
  };

  function ellAt(b, pos, rx, ry, rz, col, seg, rings, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.ellipsoid(rx, ry, rz, seg || 8, rings || 6, col);
    if (rotM) b.pop();
    b.pop();
  }

  function boxAt(b, pos, size, col, rotM) {
    b.push(M4.translate(pos[0], pos[1], pos[2]));
    if (rotM) b.push(rotM);
    b.box(size[0], size[1], size[2], col);
    if (rotM) b.pop();
    b.pop();
  }

  function hiliBody(cloth) {
    return b => {
      loft(b, [
        ring(0.0, 0.13, 0.1, 0, cloth),
        ring(0.18, 0.15, 0.11, 0, cloth),
        ring(0.34, 0.12, 0.09, 0.01, COL.skin),
        ring(0.38, 0.06, 0.05, 0.02, COL.skin)
      ], 10, { hard: true, capTop: true, capBottom: true });
      boxAt(b, [0, 0.04, 0.1], [0.28, 0.07, 0.02], COL.woodDark);
    };
  }

  function hiliHead(maskCol) {
    return b => {
      ellAt(b, [0, 0, 0], 0.095, 0.1, 0.095, COL.skin, 10, 8);
      ellAt(b, [0, 0.0, 0.04], 0.092, 0.1, 0.06, maskCol, 10, 8);
      [-1, 1].forEach(s => {
        ellAt(b, [s * 0.036, 0.015, 0.095], 0.02, 0.03, 0.01, COL.hole, 6, 4);
        boxAt(b, [s * 0.04, -0.045, 0.092], [0.012, 0.05, 0.01], COL.hole);
      });
      boxAt(b, [0, 0.04, 0.095], [0.012, 0.05, 0.01], maskCol === COL.mask ? COL.maskRed : COL.hole);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * PI * 2;
        b.push(M4.translate(S(a) * 0.07, 0.085, C(a) * 0.06 - 0.02), M4.rotZ(S(a) * 0.5), M4.rotX(-C(a) * 0.5));
        K.tube(b, [[0, 0, 0], [0, 0.11, 0]], [0.026, 0.002], 5, COL.hair);
        b.pop();
      }
    };
  }

  function hiliLimb(len, r0, r1, col) {
    return b => {
      loft(b, [ring(-len, r1, r1, 0, col), ring(0, r0, r0, 0, col)], 7, { hard: true, capTop: true, capBottom: true });
    };
  }

  function hiliClub() {
    return b => {
      K.tube(b, [[0, 0, 0], [0, 0.34, 0]], [0.014, 0.02], 6, COL.wood);
      ellAt(b, [0, 0.4, 0], 0.045, 0.1, 0.045, COL.woodDark, 7, 5);
    };
  }

  function slimeBody() {
    return b => {
      b.ellipsoid(0.34, 0.3, 0.34, 14, 9, COL.slime);
    };
  }

  function slimeSpikes() {
    return b => {
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * PI * 2;
        b.push(M4.translate(S(a) * 0.2, 0.18, C(a) * 0.2), M4.rotZ(-S(a) * 0.7), M4.rotX(C(a) * 0.7));
        K.tube(b, [[0, 0, 0], [0, 0.3, 0]], [0.07, 0.004], 5, 0xd8f4ff);
        b.pop();
      }
    };
  }

  function quadFace() {
    return b => {
      b.quad([-0.2, -0.12, 0], [0.2, -0.12, 0], [0.2, 0.12, 0], [-0.2, 0.12, 0], [1, 1, 1, 0.6], null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    };
  }

  function dumptyBody() {
    return b => {
      b.ellipsoid(0.3, 0.27, 0.3, 14, 10, COL.bomb);
      ellAt(b, [0, 0.0, 0.0], 0.26, 0.23, 0.26, [0.95, 0.38, 0.18, 0.55], 12, 8);
      [-1, 1].forEach(s => {
        ellAt(b, [s * 0.15, 0.26, 0], 0.07, 0.1, 0.05, COL.bomb, 6, 4, M4.rotZ(-s * 0.4));
      });
      K.tube(b, [[0, 0.26, 0], [0.03, 0.34, 0], [0.1, 0.4, 0]], [0.02, 0.016, 0.01], 5, COL.woodDark);
      ellAt(b, [0.11, 0.41, 0], 0.03, 0.03, 0.03, [1, 0.9, 0.3, 1], 6, 4);
    };
  }

  function dumptyFace() {
    return b => {
      b.quad([-0.17, -0.1, 0], [0.17, -0.1, 0], [0.17, 0.1, 0], [-0.17, 0.1, 0], [1, 1, 1, 0.8], null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    };
  }

  function bookMesh() {
    return b => {
      boxAt(b, [-0.09, 0, 0], [0.18, 0.02, 0.24], COL.book);
      boxAt(b, [0.09, 0, 0], [0.18, 0.02, 0.24], COL.book);
      boxAt(b, [-0.09, 0.012, 0], [0.16, 0.012, 0.22], 0xf4e8d0);
      boxAt(b, [0.09, 0.012, 0], [0.16, 0.012, 0.22], 0xf4e8d0);
      ellAt(b, [0, 0.012, 0], 0.014, 0.014, 0.1, COL.gold, 5, 4);
    };
  }

  function flameMesh() {
    return b => {
      const base = [0.95, 0.22, 0.04, 1];
      const mid = [1, 0.6, 0.1, 1];
      const tip = [1, 0.95, 0.4, 1];
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * PI * 2 + (i % 2) * 0.3;
        const h = 0.4 + (i % 4) * 0.16;
        const sx = S(a) * (0.08 + (i % 3) * 0.05), sz = C(a) * (0.08 + (i % 3) * 0.05);
        const lx = C(a) * 0.15, lz = -S(a) * 0.15;
        const n = [S(a), 0, C(a)];
        b.tri([sx - lx, 0, sz - lz], [sx + lx, 0, sz + lz], [sx + lx * 0.3, h * 0.55, sz + lz * 0.3], [base, base, mid], null, [n, n, n]);
        b.tri([sx - lx, 0, sz - lz], [sx + lx * 0.3, h * 0.55, sz + lz * 0.3], [sx - lx * 0.3, h * 0.55, sz - lz * 0.3], [base, mid, mid], null, [n, n, n]);
        b.tri([sx - lx * 0.3, h * 0.55, sz - lz * 0.3], [sx + lx * 0.3, h * 0.55, sz + lz * 0.3], [sx * 0.6, h, sz * 0.6], [mid, mid, tip], null, [n, n, n]);
      }
    };
  }

  function starMesh(points, inner) {
    return b => {
      const n = [0, 0, 1];
      const hot = [1, 0.95, 0.5, 1];
      const edge = [1, 0.55, 0.08, 1];
      for (let i = 0; i < points * 2; i++) {
        const a0 = (i / (points * 2)) * PI * 2, a1 = ((i + 1) / (points * 2)) * PI * 2;
        const r0 = i % 2 ? inner : 1, r1 = (i + 1) % 2 ? inner : 1;
        b.tri([0, 0, 0], [S(a0) * r0, C(a0) * r0, 0], [S(a1) * r1, C(a1) * r1, 0], [hot, edge, edge], null, [n, n, n]);
      }
    };
  }

  function glintMesh() {
    return b => {
      const n = [0, 0, 1];
      const c = [1, 1, 0.9, 1];
      const e = [1, 0.9, 0.5, 1];
      const arms = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      arms.forEach(([x, y], i) => {
        const [x2, y2] = arms[(i + 1) % 4];
        b.tri([0, 0, 0], [x, y, 0], [x2 * 0.12 + x * 0.12, y2 * 0.12 + y * 0.12, 0], [c, e, c], null, [n, n, n]);
        b.tri([0, 0, 0], [x2 * 0.12 + x * 0.12, y2 * 0.12 + y * 0.12, 0], [x2, y2, 0], [c, c, e], null, [n, n, n]);
      });
    };
  }

  function cloverMesh() {
    return b => {
      const n = [0, 0, 1];
      const c = [1, 0.35, 0.3, 1];
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * PI * 2 + PI / 4;
        const cx = S(a) * 0.5, cy = C(a) * 0.5;
        for (let k = 0; k < 8; k++) {
          const a0 = (k / 8) * PI * 2, a1 = ((k + 1) / 8) * PI * 2;
          b.tri([cx, cy, 0], [cx + S(a0) * 0.45, cy + C(a0) * 0.45, 0], [cx + S(a1) * 0.45, cy + C(a1) * 0.45, 0], c, null, [n, n, n]);
        }
      }
    };
  }

  function burstMesh() {
    return b => {
      b.ellipsoid(1, 1, 1, 14, 10, [1, 0.62, 0.12, 1]);
    };
  }

  function beamMesh() {
    return b => {
      const n = [0, 0, 1];
      const tip = [1, 0.35, 0.08, 1];
      const mid = [1, 0.92, 0.55, 1];
      b.tri([-1, 0, 0], [0, 0.12, 0], [0, 0, 0], [tip, mid, mid], null, [n, n, n]);
      b.tri([-1, 0, 0], [0, 0, 0], [0, -0.12, 0], [tip, mid, mid], null, [n, n, n]);
      b.tri([1, 0, 0], [0, 0, 0], [0, 0.12, 0], [tip, mid, mid], null, [n, n, n]);
      b.tri([1, 0, 0], [0, -0.12, 0], [0, 0, 0], [tip, mid, mid], null, [n, n, n]);
    };
  }

  function golemBody() {
    return b => {
      b.ellipsoid(0.8, 0.95, 0.75, 12, 9, 0x8a7a68, { flat: true });
      ellAt(b, [0, 1.0, 0], 0.5, 0.18, 0.46, 0x9a8a76, 10, 5);
      [-1, 1].forEach(s => ellAt(b, [s * 0.85, 0.2, 0.1], 0.3, 0.4, 0.3, 0x7a6a58, 8, 5));
    };
  }

  function golemCracks() {
    return b => {
      const glow = [1, 0.82, 0.2, 1];
      const lines = [[0.2, -0.3, 0.35], [-0.5, 0.2, -0.2], [0.9, 0.1, 0.45], [2.2, -0.2, 0.3], [-1.6, 0.35, 0.5], [3.4, 0.0, 0.4]];
      lines.forEach(([lon, lat0, len]) => {
        const pts = [];
        for (let i = 0; i <= 5; i++) {
          const la = lat0 + i * len / 5 * (i % 2 ? 1.1 : 0.9);
          const lo = lon + (i % 2 ? 0.1 : -0.08);
          pts.push([S(lo) * C(la) * 0.82, S(la) * 0.97 + 0.0, C(lo) * C(la) * 0.77]);
        }
        K.tube(b, pts, [0.03, 0.03, 0.03, 0.03, 0.03, 0.03], 4, glow);
      });
    };
  }

  function build(r) {
    const mk = (fn) => K.mesh(r, fn);
    return {
      hili: {
        bodyDark: mk(hiliBody(COL.clothDark)),
        bodyBrown: mk(hiliBody(COL.cloth)),
        bodyRed: mk(hiliBody(COL.clothRed)),
        headBone: mk(hiliHead(COL.mask)),
        headRed: mk(hiliHead(COL.maskRed)),
        arm: mk(hiliLimb(0.24, 0.04, 0.032, COL.skin)),
        leg: mk(hiliLimb(0.3, 0.05, 0.04, COL.skin)),
        club: mk(hiliClub())
      },
      slime: {
        body: mk(slimeBody()),
        spikes: mk(slimeSpikes()),
        face: mk(quadFace()),
        faceTex: r.texture(128, F.drawFaceCard('slime'), { clamp: true })
      },
      dumpty: {
        body: mk(dumptyBody()),
        face: mk(dumptyFace()),
        faceTex: r.texture(128, F.drawFaceCard('dumpty'), { clamp: true })
      },
      book: mk(bookMesh()),
      flame: mk(flameMesh()),
      star: mk(starMesh(9, 0.45)),
      star6: mk(starMesh(6, 0.38)),
      glint: mk(glintMesh()),
      clover: mk(cloverMesh()),
      burst: mk(burstMesh()),
      beam: mk(beamMesh()),
      golem: mk(golemBody()),
      cracks: mk(golemCracks())
    };
  }

  function drawHilichurl(r, X, p) {
    const sc = p.scale || 1;
    const t = p.t || 0;
    const run = p.run === undefined ? 1 : p.run;
    const ph = t * 9;
    const base = M4.chain(
      M4.translate(p.pos[0], p.pos[1], p.pos[2]),
      M4.rotY(p.yaw || 0),
      M4.rotX(p.tumble || 0),
      M4.scale(sc, sc, sc)
    );
    const h = X.hili;
    const red = p.variant === 'red';
    const body = red ? h.bodyRed : p.variant === 'brown' ? h.bodyBrown : h.bodyDark;
    const bob = Math.abs(C(ph)) * 0.03 * run;
    const torso = M4.chain(base, M4.translate(0, 0.32 + bob, 0), M4.rotX(0.25 + (p.lean || 0)));
    r.draw(body, torso, p.draw);
    r.draw(red ? h.headRed : h.headBone, M4.chain(torso, M4.translate(0, 0.46, 0.04), M4.rotX(0.15)), p.draw);
    [-1, 1].forEach((s, i) => {
      const swing = S(ph + i * PI) * 0.7 * run;
      r.draw(h.leg, M4.chain(base, M4.translate(s * 0.06, 0.34 + bob, 0), M4.rotX(swing)), p.draw);
      const armSwing = p.raise !== undefined && s > 0 ? -2.2 + p.raise : -S(ph + i * PI) * 0.6 * run;
      const arm = M4.chain(torso, M4.translate(s * 0.17, 0.3, 0.02), M4.rotX(armSwing), M4.rotZ(s * 0.3));
      r.draw(h.arm, arm, p.draw);
      if (s > 0 && p.club !== false) r.draw(h.club, M4.chain(arm, M4.translate(0, -0.24, 0.02), M4.rotX(-PI / 2)), p.draw);
    });
  }

  function drawSlime(r, X, p) {
    const t = p.t || 0;
    const sq = 1 + S(t * 5 + (p.seed || 0)) * 0.06;
    const sc = p.scale || 1;
    const m = M4.chain(M4.translate(p.pos[0], p.pos[1] + 0.28 * sc, p.pos[2]), M4.rotY(p.yaw || 0), M4.scale(sc / sq, sc * sq, sc / sq));
    r.draw(X.slime.body, m, { blend: true, alpha: 0.88, tint: p.tint || [1, 1, 1] });
    if (p.spiky) r.draw(X.slime.spikes, m, { tint: p.tint || [1, 1, 1] });
    r.draw(X.slime.face, M4.chain(m, M4.translate(0, 0.0, 0.3), M4.scale(1.1, 1.1, 1.1)), { blend: true, texture: X.slime.faceTex, alpha: 1 });
  }

  function drawDumpty(r, X, p) {
    const sc = p.scale || 1;
    const m = M4.chain(M4.translate(p.pos[0], p.pos[1], p.pos[2]), M4.rotY(p.yaw || 0), M4.rotZ(p.roll || 0), M4.scale(sc, sc, sc));
    r.draw(X.dumpty.body, m);
    r.draw(X.dumpty.face, M4.chain(m, M4.translate(0, 0.02, 0.29)), { texture: X.dumpty.faceTex });
  }

  function drawBook(r, X, p) {
    const flap = p.flap || 0;
    const base = M4.chain(M4.translate(p.pos[0], p.pos[1], p.pos[2]), M4.rotY(p.yaw || 0), M4.rotZ(p.roll || 0), M4.scale(p.scale || 1, p.scale || 1, p.scale || 1));
    r.draw(X.book, M4.chain(base, M4.rotZ(S(flap) * 0.5)));
  }

  function camBasis(cam) {
    const f = V3.norm(V3.sub(cam.at, cam.eye));
    let right = V3.cross(f, [0, 1, 0]);
    right = V3.norm(right);
    const up = V3.cross(right, f);
    return { f, right, up };
  }

  function billboard(pos, cam, sx, sy, roll) {
    const B = camBasis(cam);
    const c = C(roll || 0), s = S(roll || 0);
    const x = V3.add(V3.mul(B.right, c), V3.mul(B.up, s));
    const y = V3.sub(V3.mul(B.up, c), V3.mul(B.right, s));
    return Rig.basisM(pos, V3.mul(x, sx), V3.mul(y, sy), V3.mul(B.f, -1));
  }

  function drawGolem(r, X, p) {
    const sc = p.scale || 1;
    const m = M4.chain(M4.translate(p.pos[0], p.pos[1] + 0.95 * sc, p.pos[2]), M4.rotY(p.yaw || 0.4), M4.scale(sc, sc, sc));
    r.draw(X.golem, m);
    const g = p.glow === undefined ? 1 : p.glow;
    r.draw(X.cracks, m, { tint: [g, g, g], noFog: true });
  }

  function drawBeams(r, X, list, cam) {
    list.forEach(([x, y, z, len, ang]) => {
      r.draw(X.beam, billboard([x, y, z], cam, len * 0.5, len * 0.5, ang), { additive: true, alpha: 0.9, noFog: true });
    });
  }

  function drawFlames(r, X, list, t) {
    list.forEach(([x, y, z, sc, seed], i) => {
      const k = sc * (0.85 + 0.22 * S(t * 11 + (seed === undefined ? i : seed) * 2.7));
      const m = M4.chain(M4.translate(x, y, z), M4.rotY(t * 1.3 + i), M4.scale(sc * 1.1, k, sc * 1.1));
      r.draw(X.flame, m, { blend: true, alpha: 0.9, noFog: true });
    });
  }

  function drawBlast(r, X, pos, size, k, cam) {
    if (k < 0 || k > 1) return;
    const e = 1 - (1 - k) * (1 - k);
    const fade = 1 - k * k;
    r.draw(X.burst, M4.chain(M4.translate(pos[0], pos[1], pos[2]), M4.scale(size * e, size * e * 0.9, size * e)), { additive: true, alpha: 0.7 * fade, noFog: true });
    r.draw(X.burst, M4.chain(M4.translate(pos[0], pos[1], pos[2]), M4.scale(size * e * 0.55, size * e * 0.5, size * e * 0.55)), { additive: true, alpha: 0.9 * fade, tint: [1, 1, 0.8], noFog: true });
    if (cam) {
      const sz = size * (0.5 + e * 1.2);
      r.draw(X.star, billboard(pos, cam, sz, sz, k * 0.6), { blend: true, alpha: fade, noFog: true });
    }
  }

  function drawGlints(r, X, list, cam, t) {
    list.forEach(([x, y, z, sz, seed], i) => {
      const tw = 0.5 + 0.5 * S(t * 7 + (seed === undefined ? i : seed) * 3.1);
      r.draw(X.glint, billboard([x, y, z], cam, sz * tw, sz * tw, t * 0.5 + i), { additive: true, alpha: 0.95, noFog: true });
    });
  }

  function drawClovers(r, X, list, cam, t) {
    list.forEach(([x, y, z, sz, seed], i) => {
      const sw = S(t * 3 + (seed === undefined ? i : seed));
      r.draw(X.clover, billboard([x, y + sw * 0.05, z], cam, sz, sz, sw * 0.6), { blend: true, alpha: 0.95, noFog: true });
    });
  }

  window.KleeFoes = { COL, build, drawHilichurl, drawSlime, drawDumpty, drawBook, drawGolem, drawBeams, drawFlames, drawBlast, drawGlints, drawClovers, billboard, camBasis };
})();
