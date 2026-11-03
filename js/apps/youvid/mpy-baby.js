(function () {
  const { M4, V3, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;

  const SKIN_MAT = { spec: [0.12, 9], rim: 1.1 };
  const CLOTH_MAT = { spec: [0.08, 6], rim: 1.0 };
  const WING_MAT = { spec: [0.2, 10], rim: 1.3 };

  const LOOKS = {
    heavy: { hero: 'MeetHeavy', shirt: 0x34383e, trim: 0x5a7eb8, diaper: 'stripes', skin: 0xd99c78, head: 0.8, neck: [0.53, 0.13], belly: 1.18, face: 'heavy' },
    scout: { hero: 'MeetScout', shirt: 0x7cace0, trim: 0x5a86c0, diaper: 'plain', skin: 0xdfa47c, head: 0.9, neck: [0.4, 0.097], belly: 1.0, face: 'scout' },
    demo: { hero: 'MeetDemoman', shirt: 0x3a3836, trim: 0x5a7eb8, diaper: 'plain', skin: 0x7a5034, head: 0.86, neck: [0.42, 0.129], belly: 1.05, face: 'demo' },
    soldier: { hero: 'MeetSoldier', shirt: 0x86a8d4, trim: 0xf2f2ee, diaper: 'plain', skin: 0xdfa47c, head: 1.05, neck: [0.52, 0.101], belly: 1.05, face: 'soldier' },
    engineer: { hero: 'MeetEngineer', shirt: 0x40485a, trim: 0x6a8ec4, diaper: 'plain', skin: 0xdfa47c, head: 0.92, neck: [0.43, 0.1], belly: 1.05, face: 'engineer' },
    medic: { heads: 'medic', shirt: 0xf2f0ea, trim: 0x8ab4e8, diaper: 'plain', skin: 0xe8b894, head: 1.32, neck: [0, 0], belly: 1.0, face: 'guest', lift: 0.1 },
    spy: { heads: 'spy', shirt: 0x2e3650, trim: 0x8ab4e8, diaper: 'plain', skin: 0xdfa47c, head: 1.32, neck: [0, 0], belly: 0.95, face: 'guest', team: 'blu', lift: 0.1 }
  };

  function limb(b, len, r0, r1, col) {
    b.at(0, -len / 2, 0, h => h.ellipsoid(r0 * 1.05, len * 0.62, r0, 12, 8, col));
    b.at(0, -len, 0, h => h.ellipsoid(r1, r1, r1, 10, 6, col));
    return b;
  }

  function buildBody(b, L) {
    const k = L.belly;
    b.at(0, 0.17, 0.012, h => h.ellipsoid(0.2 * k, 0.215, 0.185 * k, 22, 14, L.shirt, { colorAt: p => (p[1] < -0.12 ? L.trim : L.shirt) }));
    b.at(0, 0.335, -0.004, h => h.ellipsoid(0.165 * k, 0.1, 0.13 * k, 18, 10, L.shirt));
    b.at(0, 0.405, -0.006, h => h.ellipsoid(0.095, 0.04, 0.085, 14, 6, L.trim));
    b.at(0, 0.02, 0.0, h => h.ellipsoid(0.205 * k, 0.125, 0.172 * k, 20, 12, 0xffffff, {
      colorAt: p => (L.diaper === 'stripes' ? ((Math.floor((p[0] + 0.3) * 18) % 2) ? 0x9cc4ee : 0xfbfbff) : (p[1] > 0.09 ? 0xe8eef8 : 0xfcfcff))
    }));
    b.at(0, 0.06, 0.168 * k + 0.004, h => {
      h.box(0.07, 0.012, 0.01, 0xe8c050);
      h.at(0.036, 0, 0, q => q.ellipsoid(0.012, 0.012, 0.008, 8, 5, 0xe8c050));
    });
    return b;
  }

  function buildArm(b, L) {
    limb(b, 0.13, 0.058, 0.052, L.shirt);
    b.at(0, -0.13, 0, h => {
      limb(h, 0.12, 0.05, 0.046, L.skin);
      h.at(0, -0.15, 0.0, q => {
        q.ellipsoid(0.045, 0.05, 0.035, 10, 6, L.skin);
        q.at(0.03, 0.01, 0.018, w => w.ellipsoid(0.016, 0.026, 0.016, 8, 5, L.skin));
      });
    });
    return b;
  }

  function buildLeg(b, L) {
    limb(b, 0.12, 0.072, 0.06, L.skin);
    b.at(0, -0.12, 0, h => {
      limb(h, 0.1, 0.058, 0.05, L.skin);
      h.at(0, -0.13, 0.03, q => q.ellipsoid(0.045, 0.035, 0.07, 10, 6, L.skin));
    });
    return b;
  }

  function buildWing(b) {
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      const len = 0.24 - r * 0.035;
      const ang = 0.35 + r * 0.32;
      b.push(M4.rotZ(-ang));
      for (let i = 0; i < 4; i++) {
        b.at(0, -0.03 - i * len * 0.24, 0, h => h.ellipsoid(0.03 + i * 0.004, len * 0.22, 0.012, 8, 5, r % 2 ? 0xf4f6fc : 0xffffff));
      }
      b.at(0, -len * 0.9, 0, h => h.ellipsoid(0.04, 0.06, 0.012, 8, 5, 0xffffff));
      b.pop();
    }
    b.ellipsoid(0.06, 0.05, 0.02, 10, 6, 0xffffff);
    return b;
  }

  function build(r, fx, kind, heroes) {
    const L = LOOKS[kind];
    const mk = (fn) => K.mesh(r, fn);
    return {
      kind, L,
      body: mk(b => buildBody(b, L)),
      arm: mk(b => buildArm(b, L)),
      leg: mk(b => buildLeg(b, L)),
      wing: mk(buildWing),
      heroes
    };
  }

  function aim(from, dir, hint) {
    const y = V3.norm(V3.mul(dir, -1));
    let x = V3.cross(y, hint || [0, 0, 1]);
    x = V3.len(x) < 1e-4 ? [1, 0, 0] : V3.norm(x);
    const z = V3.cross(x, y);
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, from[0], from[1], from[2], 1]);
  }

  function rotYXZ(yaw, pitch, roll) {
    return M4.chain(M4.rotY(yaw || 0), M4.rotX(pitch || 0), M4.rotZ(roll || 0));
  }

  function pose(o) {
    const scale = o.scale || 1;
    const M = M4.chain(M4.translate(o.at[0], o.at[1], o.at[2]), rotYXZ(o.yaw, o.pitch, o.roll), M4.scale(scale, scale, scale));
    const t = o.t || 0;
    const flap = o.flap === undefined ? S(t * 22) : o.flap;
    const arms = o.arms || {};
    const legs = o.legs || {};
    const kick = o.kick === undefined ? 0 : o.kick;
    const out = { M, flap, scale, o };
    out.armL = M4.mul(M, aim([0.17, 0.34, 0.0], arms.L || [0.55, -0.6, 0.35]));
    out.armR = M4.mul(M, aim([-0.17, 0.34, 0.0], arms.R || [-0.55, -0.6, 0.35]));
    out.legL = M4.mul(M, aim([0.09, -0.04, 0.03], legs.L || [0.15, -0.8, 0.45 + S(t * 9) * kick]));
    out.legR = M4.mul(M, aim([-0.09, -0.04, 0.03], legs.R || [-0.15, -0.8, 0.45 - S(t * 9) * kick]));
    out.wingL = M4.chain(M, M4.translate(0.06, 0.3, -0.15), M4.rotY(0.5 + flap * 0.4), M4.rotZ(-0.2));
    out.wingR = M4.chain(M, M4.translate(-0.06, 0.3, -0.15), M4.rotY(PI - 0.5 - flap * 0.4), M4.rotZ(-0.2));
    const hd = o.head || [0, 0, 0];
    out.head = M4.chain(M, M4.translate(0, o.headY || 0.53, 0.01), rotYXZ(hd[0], hd[1], hd[2]));
    out.hands = { L: M4.point(out.armL, [0, -0.28, 0]), R: M4.point(out.armR, [0, -0.28, 0]) };
    return out;
  }

  function headFace(kind, f) {
    const e = f || {};
    const smile = e.smile === undefined ? 0.9 : e.smile;
    const jaw = e.jaw === undefined ? 0.35 : e.jaw;
    return {
      smile, smileL: smile, smileR: smile, wide: e.wide === undefined ? 0.45 : e.wide, jaw, browUp: e.browUp === undefined ? 0.35 : e.browUp, browInUp: e.browInUp || 0.1,
      browDown: e.browDown || 0, frown: 0, round: e.round || 0, sneer: 0, press: 0, lower: 0, lidU: e.lidU === undefined ? 0.4 : e.lidU, lidL: e.lidL === undefined ? 0.55 : e.lidL,
      blink: e.blink || 0, look: e.look || [0, 0]
    };
  }

  function draw(fx, P, st, face) {
    const L = P.L;
    const tint = st.o.tint ? { tint: st.o.tint } : {};
    const cloth = Object.assign({}, CLOTH_MAT, tint);
    const skin = Object.assign({}, SKIN_MAT, tint);
    fx.draw(P.body, st.M, cloth);
    fx.draw(P.arm, st.armL, cloth);
    fx.draw(P.arm, st.armR, cloth);
    fx.draw(P.leg, st.legL, skin);
    fx.draw(P.leg, st.legR, skin);
    fx.draw(P.wing, st.wingL, Object.assign({}, WING_MAT, tint));
    fx.draw(P.wing, st.wingR, Object.assign({}, WING_MAT, tint));
    const k = L.head;
    const H = M4.mul(st.head, M4.chain(M4.translate(0, L.lift || 0, 0), M4.scale(k, k, k)));
    if (L.hero) {
      const hero = window[L.hero];
      const parts = P.heroes[L.hero];
      const chest = M4.mul(H, M4.translate(0, -(L.neck[1] + 0.012) - L.neck[0], -0.01));
      hero.draw(fx, parts, { m: { head: H, chest, pelvis: chest }, face: headFace(L.face, face), hands: {}, opts: Object.assign({ noBody: true }, st.o.headOpts || {}) });
    } else if (L.heads && window.MpyHeads) {
      window.MpyHeads.draw(fx, P.heroes.guest, L.heads, H, headFace('guest', face), { team: L.team || 'blu' });
    }
  }

  function handAt(st, side) {
    return st.hands[side];
  }

  window.MpyBaby = { LOOKS, build, pose, draw, headFace, handAt, aim };
})();
