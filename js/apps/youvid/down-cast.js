(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const MAN = { hipX: 0.11, hipY: -0.05, thigh: 0.46, shin: 0.45, chestY: 0.13, neckY: 0.34, shX: 0.2, shY: 0.25, upper: 0.3, fore: 0.27, headY: 0.13, head: 0.105 };
  const BULK = { hipX: 0.13, hipY: -0.05, thigh: 0.47, shin: 0.46, chestY: 0.14, neckY: 0.36, shX: 0.25, shY: 0.26, upper: 0.31, fore: 0.28, headY: 0.13, head: 0.115 };
  const OGRE = { hipX: 0.19, hipY: -0.06, thigh: 0.36, shin: 0.36, chestY: 0.22, neckY: 0.56, shX: 0.43, shY: 0.47, upper: 0.38, fore: 0.36, headY: 0.17, head: 0.2 };

  const OUTFITS = {
    loner: { body: 'jacketLoner', arms: 'jacketLoner', legs: 'jeans', face: 'faceA', hood: 'jacketLoner', pack: true },
    shustry: { body: 'jacketLoner', arms: 'jacketLoner', legs: 'jeans', face: 'faceA', hood: 'jacketLoner', pack: true, tint: [1.12, 1.12, 1.08] },
    bandit: { body: 'jacketBandit', arms: 'jacketBandit', legs: 'jeans', face: 'faceB', hood: 'jacketBandit', faceTint: [0.45, 0.4, 0.38] },
    exo: { body: 'exo', arms: 'exo', legs: 'exo', mask: true, bulk: true, pack: true, tint: [1.25, 1.25, 1.3] },
    soldier: { body: 'uniformBlack', arms: 'uniformBlack', legs: 'uniformBlack', mask: true, helmet: true },
    merc: { body: 'vestGreen', arms: 'jacketLoner', legs: 'camoPants', face: 'faceA', hair: true, armTint: [0.75, 0.78, 0.8] },
    camp: { body: 'jacketLoner', arms: 'jacketLoner', legs: 'jeans', face: 'faceA', hood: 'jacketLoner', tint: [0.8, 0.78, 0.72] },
    burnt: { body: 'jacketLoner', arms: 'jacketLoner', legs: 'camoPants', face: 'faceBurn', hood: 'jacketLoner', tint: [0.85, 0.85, 0.8] }
  };

  function limb(b, len, r0, r1, sides) {
    b.prism(sides || 8, r1, r1, -len, r0, r0, 0, [1, 1, 1], { capTop: true });
    b.push(M4.translate(0, -len, 0));
    b.ellipsoid(r1, r1, r1, 8, 5, [1, 1, 1]);
    b.pop();
  }

  function buildBody(r, D, bulk) {
    const M = {};
    const k = bulk ? 1.3 : 1;
    M.chest = mesh(r, b => {
      loft(b, [ring(-0.06, 0.17 * k, 0.12 * k, 0, [1, 1, 1]), ring(0.1, 0.19 * k, 0.13 * k, 0.01, [1, 1, 1]), ring(0.26, 0.22 * k, 0.14 * k, 0.01, [1, 1, 1]), ring(0.36, 0.13 * k, 0.09 * k, 0, [1, 1, 1])], 10, { capTop: true, capBottom: true, uv: true });
      [-1, 1].forEach(s => { b.push(M4.translate(s * D.shX * 0.95, 0.26, 0)); b.ellipsoid(0.075 * k, 0.07 * k, 0.075 * k, 6, 4, [1, 1, 1]); b.pop(); });
    });
    M.pelvis = mesh(r, b => { b.ellipsoid(0.165 * k, 0.12, 0.115 * k, 8, 5, [1, 1, 1]); });
    M.pack = mesh(r, b => { b.push(M4.translate(0, 0.16, -0.2 * k)); b.box(0.3, 0.38, 0.16, [1, 1, 1]); b.pop(); });
    M.headFront = mesh(r, b => K.spherePatch(b, 0.1, 0.122, 0.108, -1.3, 1.3, -1.25, 1.2, 12, 10, [1, 1, 1], [1, 1]));
    M.headBack = mesh(r, b => K.spherePatch(b, 0.104, 0.126, 0.106, 1.3, PI * 2 - 1.3, -1.25, 1.2, 8, 8, [1, 1, 1], null));
    M.hair = mesh(r, b => {
      K.spherePatch(b, 0.112, 0.132, 0.114, 1.2, PI * 2 - 1.2, -1.4, 1.3, 8, 8, 0x2a1e16, null);
      K.spherePatch(b, 0.114, 0.136, 0.116, -1.4, 1.4, 0.5, 1.35, 10, 4, 0x2a1e16, null);
    });
    M.hood = mesh(r, b => {
      K.spherePatch(b, 0.135, 0.15, 0.135, 0.95, PI * 2 - 0.95, -1.35, 1.4, 10, 8, [1, 1, 1], [1, 1]);
      K.spherePatch(b, 0.137, 0.152, 0.137, -1.0, 1.0, 0.75, 1.4, 8, 3, [1, 1, 1], [1, 1]);
    });
    M.mask = mesh(r, b => K.spherePatch(b, 0.118, 0.132, 0.124, -1.35, 1.35, -1.3, 1.25, 12, 10, [1, 1, 1], [1, 1]));
    M.helmet = mesh(r, b => K.spherePatch(b, 0.13, 0.12, 0.13, 0, PI * 2, 0.15, 1.5, 12, 4, [1, 1, 1], null));
    M.filter = mesh(r, b => { b.push(M4.translate(0, -0.07, 0.13), M4.rotX(PI / 2)); b.prism(8, 0.045, 0.045, 0, 0.04, 0.04, 0.07, [1, 1, 1], { capTop: true }); b.pop(); });
    M.neck = mesh(r, b => b.prism(8, 0.055, 0.055, -0.06, 0.05, 0.05, 0.1, [1, 1, 1]));
    M.upper = mesh(r, b => limb(b, D.upper, 0.065 * k, 0.056 * k));
    M.fore = mesh(r, b => limb(b, D.fore, 0.056 * k, 0.046 * k));
    M.hand = mesh(r, b => { b.push(M4.translate(0, -0.07, 0)); b.ellipsoid(0.042, 0.06, 0.026, 6, 4, 0x2a2622); b.pop(); });
    M.thigh = mesh(r, b => limb(b, D.thigh, 0.085 * k, 0.065 * k));
    M.shin = mesh(r, b => limb(b, D.shin, 0.065 * k, 0.052 * k));
    M.foot = mesh(r, b => { b.push(M4.translate(0, -0.035, 0.06)); b.box(0.11 * k, 0.08, 0.28, 0x1c1814); b.pop(); });
    return M;
  }

  function buildOgre(r) {
    const D = OGRE;
    const M = {};
    M.torso = mesh(r, b => loft(b, [ring(-0.12, 0.34, 0.3, 0.03, [1, 1, 1]), ring(0.06, 0.45, 0.42, 0.1, [1, 1, 1]), ring(0.26, 0.47, 0.42, 0.08, [1, 1, 1]), ring(0.44, 0.45, 0.33, 0.03, [1, 1, 1]), ring(0.58, 0.4, 0.26, 0, [1, 1, 1]), ring(0.68, 0.2, 0.16, 0, [1, 1, 1])], 14, { capTop: true, capBottom: true, uv: true }));
    M.vest = mesh(r, b => {
      [-1, 1].forEach(s => {
        const pts = [];
        for (let i = 0; i <= 6; i++) {
          const y = 0.04 + i * 0.1;
          const rx = [0.42, 0.46, 0.47, 0.465, 0.45, 0.42, 0.3][i] + 0.014;
          const rz = [0.39, 0.425, 0.43, 0.4, 0.35, 0.29, 0.2][i] + 0.014;
          pts.push({ y, rx, rz });
        }
        for (let i = 0; i < 6; i++) {
          const p = pts[i], q = pts[i + 1];
          const a0 = s > 0 ? 0.32 : -PI, a1 = s > 0 ? PI : -0.32;
          const n = 8;
          for (let j = 0; j < n; j++) {
            const u0 = a0 + (a1 - a0) * j / n, u1 = a0 + (a1 - a0) * (j + 1) / n;
            const P = (pp, u) => [S(u) * pp.rx, pp.y, C(u) * pp.rz + 0.05];
            b.quad(P(p, u0), P(p, u1), P(q, u1), P(q, u0), [1, 1, 1], [[j / n, i / 6], [(j + 1) / n, i / 6], [(j + 1) / n, (i + 1) / 6], [j / n, (i + 1) / 6]]);
          }
        }
      });
    });
    M.belt = mesh(r, b => { b.push(M4.translate(0, -0.08, 0.03)); b.prism(14, 0.36, 0.33, 0, 0.365, 0.335, 0.08, [1, 1, 1], { capTop: false }); b.pop(); });
    M.pelvis = mesh(r, b => { b.push(M4.translate(0, -0.02, 0.02)); b.ellipsoid(0.33, 0.19, 0.28, 10, 6, [1, 1, 1]); b.pop(); });
    M.headFront = mesh(r, b => K.spherePatch(b, 0.27, 0.25, 0.235, -1.35, 1.35, -1.25, 1.25, 14, 10, [1, 1, 1], [1, 1]));
    M.headBack = mesh(r, b => {
      K.spherePatch(b, 0.266, 0.246, 0.232, 1.35, PI * 2 - 1.35, -1.25, 1.25, 10, 8, [1, 1, 1], null);
      b.push(M4.translate(0, -0.15, 0.08));
      b.ellipsoid(0.25, 0.12, 0.19, 10, 6, [1, 1, 1]);
      b.pop();
      b.push(M4.translate(0, -0.02, 0.165));
      b.ellipsoid(0.045, 0.04, 0.035, 6, 4, [1, 1, 1]);
      b.pop();
    });
    M.ear = mesh(r, b => {
      b.prism(8, 0.035, 0.035, 0, 0.022, 0.022, 0.09, [1, 1, 1], { capTop: false });
      b.push(M4.translate(0, 0.09, 0));
      b.prism(8, 0.022, 0.022, 0, 0.05, 0.05, 0.03, [1, 1, 1], { capTop: false });
      b.pop();
    });
    M.upper = mesh(r, b => limb(b, D.upper, 0.15, 0.13, 10));
    M.fore = mesh(r, b => limb(b, D.fore, 0.12, 0.09, 10));
    M.cuff = mesh(r, b => b.prism(10, 0.145, 0.145, -0.14, 0.13, 0.13, 0, [1, 1, 1], { capTop: false }));
    M.hand = mesh(r, b => { b.push(M4.translate(0, -0.09, 0)); b.ellipsoid(0.1, 0.11, 0.06, 8, 5, [1, 1, 1]); b.pop(); });
    M.thigh = mesh(r, b => limb(b, D.thigh, 0.19, 0.15, 10));
    M.shin = mesh(r, b => limb(b, D.shin, 0.15, 0.12, 10));
    M.foot = mesh(r, b => { b.push(M4.translate(0, -0.05, 0.08)); b.box(0.18, 0.1, 0.32, 0x3a2614); b.pop(); });
    return M;
  }

  function build(r) {
    return { man: buildBody(r, MAN, false), bulk: buildBody(r, BULK, true), ogre: buildOgre(r) };
  }

  function drawHuman(r, T, X, m, o) {
    const f = OUTFITS[o.outfit] || OUTFITS.loner;
    const MS = f.bulk ? X.bulk : X.man;
    const tint = o.tint || f.tint;
    const body = { texture: T[f.body], tint };
    const arms = { texture: T[f.arms], tint: f.armTint || tint };
    const legs = { texture: T[f.legs], tint };
    r.draw(MS.chest, m.chest, body);
    if (f.pack) r.draw(MS.pack, m.chest, { texture: T.cabTarp, tint: [0.7, 0.7, 0.6] });
    r.draw(MS.pelvis, m.pelvis, legs);
    r.draw(MS.neck, m.neck, f.mask ? { texture: T.gasmask } : { texture: T[f.face || 'faceA'], tint: o.faceTint || f.faceTint });
    if (f.mask) {
      r.draw(MS.mask, m.head, { texture: T.gasmask });
      r.draw(MS.headBack, m.head, { texture: T.gasmask });
      r.draw(MS.filter, m.head, { texture: T.gasmask });
      if (f.helmet) r.draw(MS.helmet, m.head, { texture: T.uniformBlack, tint: [0.8, 0.85, 0.8] });
    } else {
      r.draw(MS.headFront, m.head, { texture: T[o.face || f.face], tint: o.faceTint || f.faceTint });
      r.draw(MS.headBack, m.head, { texture: T[o.face || f.face], tint: [0.3, 0.22, 0.18] });
      if (f.hair) r.draw(MS.hair, m.head);
      if (f.hood && o.hood !== false) r.draw(MS.hood, m.head, { texture: T[f.hood], tint });
    }
    ['L', 'R'].forEach(s => {
      r.draw(MS.upper, m['upper' + s], arms);
      r.draw(MS.fore, m['fore' + s], arms);
      r.draw(MS.hand, m['hand' + s], f.mask ? undefined : { tint: [3.6, 2.7, 2.2] });
      r.draw(MS.thigh, m['thigh' + s], legs);
      r.draw(MS.shin, m['shin' + s], legs);
      r.draw(MS.foot, m['foot' + s]);
    });
  }

  function drawOgre(r, T, X, m, o) {
    const MS = X.ogre;
    const skin = { texture: T.ogreSkin };
    const shirt = { texture: T.shirtLinen };
    r.draw(MS.torso, m.chest, shirt);
    r.draw(MS.vest, m.chest, { texture: T.vestLeather });
    r.draw(MS.belt, m.pelvis, { texture: T.beltLeather });
    r.draw(MS.pelvis, m.pelvis, { texture: T.trousers });
    const H = m.head;
    r.draw(MS.headFront, H, { texture: T.ogreFace });
    r.draw(MS.headBack, H, skin);
    [-1, 1].forEach(s => r.draw(MS.ear, M4.chain(H, M4.translate(s * 0.21, 0.12, -0.02), M4.rotZ(-s * 0.95), M4.scale(1.3, 1.3, 1.3)), skin));
    ['L', 'R'].forEach(s => {
      r.draw(MS.upper, m['upper' + s], shirt);
      r.draw(MS.cuff, m['fore' + s], shirt);
      r.draw(MS.fore, m['fore' + s], skin);
      r.draw(MS.hand, m['hand' + s], skin);
      r.draw(MS.thigh, m['thigh' + s], { texture: T.trousers });
      r.draw(MS.shin, m['shin' + s], { texture: T.trousers });
      r.draw(MS.foot, m['foot' + s]);
    });
  }

  function dims(outfit) {
    return (OUTFITS[outfit] || OUTFITS.loner).bulk ? BULK : MAN;
  }

  function legs(D, pos, face, walk, t, seed) {
    const legLen = D.thigh + D.shin;
    const out = {};
    const ph = t * 6.5 + (seed || 0);
    const amp = 0.22 * walk, lift = 0.1 * walk;
    const fw = [S(face), 0, C(face)], side = [C(face), 0, -S(face)];
    [['L', 1, 0], ['R', -1, PI]].forEach(([s, k, o]) => {
      const sw = S(ph + o);
      const off = k * D.hipX * 1.1;
      out['f' + s + 'w'] = [pos[0] + side[0] * off + fw[0] * sw * amp, 0.07 + Math.max(0, C(ph + o)) * lift, pos[2] + side[2] * off + fw[2] * sw * amp];
      out['k' + s + 'w'] = [pos[0] + side[0] * off * 1.2 + fw[0] * 1.2, 0.5, pos[2] + side[2] * off * 1.2 + fw[2] * 1.2];
    });
    out.height = legLen * 0.98 + 0.07;
    return out;
  }

  function pose(a, t) {
    const D = dims(a.outfit);
    const face = a.face || 0;
    const fwd = [S(face), 0, C(face)];
    const side = [C(face), 0, -S(face)];
    const pos = a.pos;
    const p = { up: [0, 1, 0], fwd, sp: [0.05, 0, 0], nk: [0, a.look || 0, 0] };
    const lg = legs(D, pos, face, a.walk || 0, t, a.seed);
    Object.assign(p, lg);
    p.p = [pos[0], lg.height + (a.y || 0), pos[2]];
    const rel = (x, y, z) => [pos[0] + side[0] * x + fwd[0] * z, p.p[1] + y, pos[2] + side[2] * x + fwd[2] * z];
    const breathe = S(t * 1.7 + (a.seed || 0)) * 0.012;
    p.p[1] += breathe;
    if (a.kind === 'rifle') {
      p.sp = [0.06, -0.25, 0];
      p.nk = [0.05, 0.25, 0];
      p.hRw = rel(-0.12, 0.28, 0.32);
      p.hLw = rel(0.06, 0.32, 0.55);
      p.eRw = rel(-0.5, 0.1, 0.0);
      p.eLw = rel(0.35, 0.0, 0.3);
    } else if (a.kind === 'lowRifle') {
      p.hRw = rel(-0.18, 0.08, 0.2);
      p.hLw = rel(0.1, 0.16, 0.38);
      p.eRw = rel(-0.5, 0.2, -0.2);
      p.eLw = rel(0.4, 0.1, 0.1);
    } else if (a.kind === 'arms') {
      p.hRw = rel(-0.26, -0.02, 0.06);
      p.hLw = rel(0.26, -0.02, 0.06);
    } else if (a.kind === 'aimPistol') {
      p.sp = [0.05, -0.1, 0];
      p.hRw = rel(-0.05, 0.42, 0.55);
      p.hLw = rel(0.02, 0.4, 0.5);
      p.eRw = rel(-0.5, 0.2, 0.1);
      p.eLw = rel(0.5, 0.2, 0.1);
    } else if (a.kind === 'run') {
      const sw = S(t * 9 + (a.seed || 0));
      p.sp = [0.35, 0, 0];
      p.nk = [-0.3, 0, 0];
      p.hRw = rel(-0.2, 0.12, 0.25 + sw * 0.15);
      p.hLw = rel(0.2, 0.12, 0.25 - sw * 0.15);
    }
    if (a.crouch) {
      const c = a.crouch;
      p.p[1] -= c * 0.42;
      p.sp[0] += c * 0.5;
      p.nk[0] -= c * 0.4;
      ['L', 'R'].forEach((s, i) => {
        const k = i ? -1 : 1;
        p['f' + s + 'w'] = [pos[0] + side[0] * k * 0.16 + fwd[0] * 0.18 * c, 0.07, pos[2] + side[2] * k * 0.16 + fwd[2] * 0.18 * c];
        p['k' + s + 'w'] = [pos[0] + side[0] * k * 0.3 + fwd[0] * 1.5, 0.6, pos[2] + side[2] * k * 0.3 + fwd[2] * 1.5];
      });
      if (!a.kind) {
        p.hRw = rel(-0.22, -0.32 * c + 0.0, 0.35 * c + 0.05);
        p.hLw = rel(0.22, -0.32 * c + 0.0, 0.35 * c + 0.05);
      }
    }
    if (a.sit) {
      p.p[1] = 0.45;
      p.sp = [0.35, 0, 0];
      p.nk = [-0.2, 0, 0];
      ['L', 'R'].forEach((s, i) => {
        const k = i ? -1 : 1;
        p['f' + s + 'w'] = [pos[0] + side[0] * k * 0.2 + fwd[0] * 0.55, 0.07, pos[2] + side[2] * k * 0.2 + fwd[2] * 0.55];
        p['k' + s + 'w'] = [pos[0] + side[0] * k * 0.25 + fwd[0] * 1.5, 1.2, pos[2] + side[2] * k * 0.25 + fwd[2] * 1.5];
      });
      p.hRw = rel(-0.12, 0.0, 0.42);
      p.hLw = rel(0.12, 0.0, 0.42);
    }
    if (a.tpose) {
      p.hRw = rel(-0.18, -0.1, -0.12);
      p.hLw = rel(0.18, -0.1, -0.12);
      p.eRw = rel(-0.4, 0.1, -0.3);
      p.eLw = rel(0.4, 0.1, -0.3);
    }
    if (a.wave) {
      p.hRw = rel(-0.25, 0.25 + S(t * 6) * 0.05, 0.3);
      p.eRw = rel(-0.6, 0.0, 0.2);
    }
    if (a.talk) p.nk[1] += S(t * 2.2) * 0.08;
    return Rig.solve(p, D);
  }

  function lying(a) {
    const D = dims(a.outfit);
    const dir = [S(a.face), 0, C(a.face)];
    const side = [dir[2], 0, -dir[0]];
    const c = a.pos;
    const p = { p: [c[0], 0.14, c[2]], up: dir, fwd: [0, 1, 0], sp: [0, 0, 0], nk: [-0.2, 0.3, 0] };
    [['L', 1], ['R', -1]].forEach(([s, kk]) => {
      const reach = 0.65, along = 0.45 + kk * 0.1;
      p['h' + s + 'w'] = [c[0] + dir[0] * along - side[0] * kk * reach, 0.1, c[2] + dir[2] * along - side[2] * kk * reach];
      p['e' + s + 'w'] = [c[0] + dir[0] * 0.3 - side[0] * kk * 0.4, 0.4, c[2] + dir[2] * 0.3 - side[2] * kk * 0.4];
      p['f' + s + 'w'] = [c[0] - dir[0] * 0.9 - side[0] * kk * 0.22, 0.08, c[2] - dir[2] * 0.9 - side[2] * kk * 0.22];
      p['k' + s + 'w'] = [c[0] - dir[0] * 0.45, 0.8, c[2] - dir[2] * 0.45];
    });
    return Rig.solve(p, D);
  }

  function barrelBody(a, t) {
    const D = MAN;
    const c = a.pos;
    const yaw = a.face;
    const fw = [S(yaw), 0, C(yaw)];
    const side = [C(yaw), 0, -S(yaw)];
    const hip = [c[0], 0.72, c[2]];
    const sway = S(t * 1.3) * 0.03;
    const torso = V3.norm([fw[0] * 0.75 + side[0] * 0.35, 0.55, fw[2] * 0.75 + side[2] * 0.35]);
    const p = { p: hip, up: torso, fwd: V3.norm([-fw[0] * 0.3 + side[0] * 0.2, 0.95, -fw[2] * 0.3 + side[2] * 0.2]), sp: [-0.25, 0, sway], nk: [-0.6, 0.25, 0] };
    [['L', 1], ['R', -1]].forEach(([s, kk]) => {
      p['f' + s + 'w'] = [c[0] - fw[0] * 0.55 - side[0] * (0.75 + kk * 0.1), 1.05 + kk * 0.12, c[2] - fw[2] * 0.55 - side[2] * (0.75 + kk * 0.1)];
      p['k' + s + 'w'] = [c[0] - side[0] * 0.5 + fw[0] * 0.2, 1.8, c[2] - side[2] * 0.5 + fw[2] * 0.2];
      p['h' + s + 'w'] = [c[0] + fw[0] * 0.1 + side[0] * kk * 0.35, 0.85, c[2] + fw[2] * 0.1 + side[2] * kk * 0.35];
    });
    return Rig.solve(p, D);
  }

  const OGRE_KEYS = [
    [5.24, { z: -0.55, sp: [0.05, 0, 0], nk: [0.05, 0, 0], hL: [0.42, -0.3, 0.25], hR: [-0.5, -0.1, 0.45], mouth: 0.2 }],
    [5.45, { z: 0.1, sp: [-0.05, 0.1, 0], nk: [0.0, 0.1, 0], hL: [0.95, 0.15, 0.25], hR: [-0.5, -0.45, 0.2], mouth: 0.1 }],
    [5.75, { z: 0.35, sp: [-0.08, 0.15, 0.05], nk: [-0.1, 0.1, 0], hL: [1.0, 0.2, 0.2], hR: [-0.55, -0.4, 0.25], mouth: 0.1 }],
    [5.95, { z: 0.45, sp: [0.05, 0.0, 0.0], nk: [0.0, 0.0, 0], hL: [0.85, -0.25, 0.25], hR: [-0.9, -0.15, 0.25], mouth: 0.2 }],
    [6.15, { z: 0.5, sp: [0.2, -0.2, 0.1], nk: [0.15, -0.2, 0.2], hL: [0.35, 0.18, 0.4], hR: [-0.45, 0.3, 0.35], crouch: 0.12, mouth: 0.6 }],
    [6.8, { z: 0.5, sp: [0.25, -0.15, 0.12], nk: [0.2, -0.25, 0.3], hL: [0.3, 0.2, 0.4], hR: [-0.4, 0.35, 0.35], crouch: 0.15, mouth: 0.9 }],
    [7.1, { z: 0.5, sp: [-0.12, 0, 0], nk: [-0.4, 0, 0], hL: [0.95, 0.55, 0.0], hR: [-0.95, 0.55, 0.0], mouth: 1.0 }],
    [7.55, { z: 0.5, sp: [-0.18, 0.05, 0], nk: [-0.5, 0, 0], hL: [1.12, 0.32, 0.1], hR: [-1.12, 0.32, 0.1], mouth: 1.0 }],
    [7.85, { z: 0.52, sp: [-0.05, 0.1, -0.05], nk: [-0.2, 0.05, 0], hL: [0.95, -0.3, 0.2], hR: [-1.0, 0.05, 0.2], mouth: 0.6 }],
    [8.2, { z: 0.55, sp: [0.02, 0, 0], nk: [0.0, 0, 0], hL: [0.45, -0.5, 0.15], hR: [-0.45, -0.5, 0.15], mouth: 0.2 }],
    [9.6, { z: 0.55, sp: [0.03, 0, 0], nk: [0.02, 0.05, 0], hL: [0.43, -0.52, 0.14], hR: [-0.44, -0.5, 0.15], mouth: 0.3 }]
  ];

  function ogreKey(t) {
    let i = 0;
    while (i < OGRE_KEYS.length - 2 && t >= OGRE_KEYS[i + 1][0]) i++;
    const [t0, a] = OGRE_KEYS[i], [t1, b] = OGRE_KEYS[i + 1];
    const k = K.ease(clamp((t - t0) / (t1 - t0), 0, 1));
    const out = {};
    Object.keys(b).forEach(key => {
      const va = a[key] === undefined ? (Array.isArray(b[key]) ? b[key].map(() => 0) : 0) : a[key];
      const vb = b[key];
      out[key] = Array.isArray(vb) ? vb.map((v, j) => lerp(va[j], v, k)) : lerp(va, vb, k);
    });
    return out;
  }

  function ogrePose(base, t) {
    const D = OGRE;
    const k = ogreKey(t);
    const pos = [base[0], 0, base[2] + k.z];
    const legLen = D.thigh + D.shin;
    const crouch = k.crouch || 0;
    const sway = S(t * 2.1) * 0.015;
    const p = { p: [pos[0] + sway, legLen * 0.97 + 0.1 - crouch * 0.22, pos[2]], up: [0, 1, 0], fwd: [0, 0, 1], sp: k.sp, nk: k.nk };
    [['L', 1], ['R', -1]].forEach(([s, kk]) => {
      p['f' + s + 'w'] = [pos[0] + kk * 0.2, 0.08, pos[2] + 0.02];
      p['k' + s + 'w'] = [pos[0] + kk * 0.35, 0.5, pos[2] + 1.0];
    });
    p.hL = k.hL;
    p.hR = k.hR;
    p.eL = [0.9, 0.1, -0.5];
    p.eR = [-0.9, 0.1, -0.5];
    const m = Rig.solve(p, D);
    m.mouth = k.mouth;
    return m;
  }

  window.DownCast = { MAN, BULK, OGRE, OUTFITS, build, drawHuman, drawOgre, pose, lying, barrelBody, ogrePose, ogreKey };
})();
