(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Cam = window.ParadCam;
  const Script = window.ParadScript;
  const World = window.ParadWorld;
  const Cast = window.ParadCast;
  const Gun = window.ParadGun;
  const Art = window.ParadArt;
  const Rig = window.YouVidRig;

  const OV_W = 960;
  const OV_H = 540;
  const SUN = V3.norm([-0.5, -0.45, -0.62]);

  function baseEnv(set) {
    const yard = set === 'yard';
    return {
      sunDir: SUN,
      sunColor: yard ? [0.62, 0.5, 0.38] : [0.52, 0.45, 0.38],
      ambTop: yard ? [0.62, 0.58, 0.62] : [0.66, 0.63, 0.68],
      ambBottom: [0.4, 0.35, 0.3],
      fogColor: [0.62, 0.57, 0.58],
      fogNear: 30,
      fogFar: set === 'field' ? 300 : 240,
      points: []
    };
  }

  function legPose(D, a, t) {
    const legLen = D.thigh + D.shin;
    const out = {};
    const run = a.run || 0, walk = a.walk || 0;
    const speed = run ? 10 : 6.5;
    const ph = t * speed + (a.seed || 0);
    const amp = run ? 0.38 : 0.2 * walk;
    const lift = run ? 0.22 : 0.1 * walk;
    [['L', 1, 0], ['R', -1, PI]].forEach(([s, k, o]) => {
      const sw = S(ph + o);
      out['f' + s] = [k * D.hipX * 1.15, -legLen * 0.98 + Math.max(0, C(ph + o)) * lift, 0.04 + sw * amp];
      out['k' + s] = [k * 0.1, 0, 1];
    });
    return out;
  }

  function ogrePose(a, t) {
    const D = Cast.OGRE;
    const h = a.face;
    const fwd = [S(h), 0, -C(h)];
    const breathe = S(t * 1.6 + (a.seed || 0)) * 0.01;
    const run = a.run || 0;
    const p = { p: [a.pos[0], (D.thigh + D.shin) * 0.97 + 0.08 + breathe - run * 0.08, a.pos[2]], up: [0, 1, 0], fwd, sp: [0.12 + run * 0.35, 0, 0], nk: [-0.1 - run * 0.3, 0, 0] };
    Object.assign(p, legPose(D, a, t));
    const sw = run ? S(t * 10) * 0.35 : 0;
    p.hL = [0.6, -0.42, 0.08 + sw];
    p.hR = [-0.6, -0.42, 0.08 - sw];
    p.eL = [0.9, 0.0, -0.4];
    p.eR = [-0.9, 0.0, -0.4];
    if (a.idle) { p.sp = [0.35, 0.3, 0.1]; p.hL = [0.45, -0.6, 0.35]; p.hR = [-0.5, -0.55, 0.25]; }
    return Rig.solve(p, D);
  }

  function manPose(a, t) {
    const D = Cast.MAN;
    const h = a.face;
    const fwd = [S(h), 0, -C(h)];
    const run = a.run || 0;
    const p = { p: [a.pos[0], (D.thigh + D.shin) * 0.98 + 0.07 - run * 0.05, a.pos[2]], up: [0, 1, 0], fwd, sp: [0.04 + run * 0.3, 0, 0], nk: [-0.05, 0, 0] };
    Object.assign(p, legPose(D, a, t));
    if (a.arms === 'down') {
      p.hL = [0.24, -0.5, 0.04];
      p.hR = [-0.24, -0.5, 0.04];
    } else {
      p.hL = [0.21, -0.27, 0.13];
      p.hR = [-0.21, -0.27, 0.13];
      p.eL = [0.8, 0.0, -0.4];
      p.eR = [-0.8, 0.0, -0.4];
    }
    if (run) {
      const sw = S(t * 10) * 0.25;
      p.hL = [0.2, -0.3, 0.1 + sw];
      p.hR = [-0.2, -0.3, 0.1 - sw];
    }
    if (a.wave) {
      p.hR = [-0.12, 0.05 + a.wave * 0.25, 0.25];
      p.eR = [-0.7, -0.3, 0.2];
    }
    if (a.crouch) {
      p.p[1] = 0.62;
      p.sp = [0.95, 0, 0];
      p.nk = [-0.5, 0, 0];
      p.fL = [D.hipX * 1.2, -0.55, 0.25];
      p.fR = [-D.hipX * 1.2, -0.55, -0.1];
      p.hL = [0.18, -0.35, 0.3];
      p.hR = [-0.18, -0.35, 0.3];
    }
    return Rig.solve(p, D);
  }

  function lyingPose(D, center, dir, armsSide) {
    const side = [dir[2], 0, -dir[0]];
    const p = { p: [center[0], 0.13, center[2]], up: dir, fwd: [0, 1, 0], sp: [0, 0, 0], nk: [-0.25, 0, 0] };
    [['L', 1], ['R', -1]].forEach(([s, kk]) => {
      const reach = armsSide ? 0.28 : 0.72, along = armsSide ? -0.05 : 0.5;
      p['h' + s + 'w'] = [center[0] + dir[0] * along - side[0] * kk * reach, 0.1, center[2] + dir[2] * along - side[2] * kk * reach];
      p['e' + s + 'w'] = [center[0] + dir[0] * 0.3 - side[0] * kk * 0.4, armsSide ? 0.1 : 0.5, center[2] + dir[2] * 0.3 - side[2] * kk * 0.4];
      p['f' + s + 'w'] = [center[0] - dir[0] * 0.9 - side[0] * kk * 0.16, 0.07, center[2] - dir[2] * 0.9 - side[2] * kk * 0.16];
      p['k' + s + 'w'] = [center[0] - dir[0] * 0.45, 0.8, center[2] - dir[2] * 0.45];
    });
    return Rig.solve(p, D);
  }

  function bodyPose(st, t, fireP) {
    const D = Cast.MAN;
    const cam = st.camera;
    const O = Cam.YARD_ORIGIN;
    const yawR = cam.yaw * PI / 180;
    const fw = [S(yawR), 0, -C(yawR)];
    if (t < 86.9) {
      const k = clamp((t - 82.55) / 0.45, 0, 1);
      const crawl = clamp((t - 83.0) / 3.5, 0, 1);
      const pos = [O[0] + lerp(0.5, 1.3, crawl), 0, O[2] + lerp(-1.5, -1.75, crawl)];
      const dirc = V3.norm([0.85, 0, -0.5]);
      const collapse = clamp((t - 86.3) / 0.5, 0, 1);
      const up = V3.norm([dirc[0] * (0.15 + 0.85 * k), 1 - 0.85 * k, dirc[2] * (0.15 + 0.85 * k)]);
      const p = { p: [pos[0], lerp(1.0, 0.52 - collapse * 0.34, k), pos[2]], up, fwd: V3.norm([dirc[0] * (1 - k) + 0.01, -k, dirc[2] * (1 - k)]), sp: [0.15, 0, 0], nk: [0.45 * k, 0.4, 0] };
      const side = [dirc[2], 0, -dirc[0]];
      const ph = t * 3.2;
      [['L', 1], ['R', -1]].forEach(([s, kk]) => {
        if (k > 0.5 && collapse < 0.6) p['h' + s + 'w'] = [pos[0] + dirc[0] * (0.55 + S(ph + kk) * 0.06) - side[0] * kk * 0.2, 0.06, pos[2] + dirc[2] * (0.55 + S(ph + kk) * 0.06) - side[2] * kk * 0.2];
        p['f' + s + 'w'] = [pos[0] - dirc[0] * 0.6 - side[0] * kk * 0.14, 0.07, pos[2] - dirc[2] * 0.6 - side[2] * kk * 0.14];
        p['k' + s + 'w'] = [pos[0] - side[0] * kk * 0.18, 0.0, pos[2] - side[2] * kk * 0.18];
      });
      return Rig.solve(p, D);
    }
    if (t < 93.2) {
      const side = [fw[2], 0, -fw[0]];
      const sway = S(t * 2.3) * 0.04;
      const pel = [cam.eye[0] + fw[0] * 0.1 + side[0] * sway, 0.5, cam.eye[2] + fw[2] * 0.1 + side[2] * sway];
      const head = [cam.eye[0] + fw[0] * 0.36, 1.1, cam.eye[2] + fw[2] * 0.36];
      const up = V3.norm(V3.sub(head, pel));
      const p = { p: pel, up, fwd: [-fw[0], 0.2, -fw[2]], sp: [-0.15, 0, 0], nk: [-0.55, 0, 0] };
      [['L', 1], ['R', -1]].forEach(([s, kk]) => {
        p['h' + s + 'w'] = [pel[0] + fw[0] * 0.05 - side[0] * kk * 0.78, 0.62, pel[2] + fw[2] * 0.05 - side[2] * kk * 0.78];
        p['e' + s + 'w'] = [pel[0] - side[0] * kk * 0.5, 1.0, pel[2] - side[2] * kk * 0.5];
        p['f' + s + 'w'] = [pel[0] - fw[0] * 0.75 - side[0] * kk * 0.16, 0.07, pel[2] - fw[2] * 0.75 - side[2] * kk * 0.16];
        p['k' + s + 'w'] = [pel[0] - fw[0] * 0.3, 0.0, pel[2] - fw[2] * 0.3];
      });
      return Rig.solve(p, D);
    }
    const towards = V3.norm([fireP[0] - cam.eye[0], 0, fireP[2] - cam.eye[2]]);
    if (t < 95.6) return lyingPose(D, [fireP[0] - towards[0] * 2.0, 0, fireP[2] - towards[2] * 2.0], towards, true);
    const R = [-towards[2], 0, towards[0]];
    const hip = [fireP[0] + R[0] * 0.1, 0.62, fireP[2] + R[2] * 0.1];
    const torso = V3.norm([R[0] * 0.32 - towards[0] * 0.12, 0.94, R[2] * 0.32 - towards[2] * 0.12]);
    const p = { p: hip, up: torso, fwd: [-towards[0], 0, -towards[2]], sp: [0.1, -0.2, 0], nk: [-0.3, -0.35, 0.1] };
    [['L', 1], ['R', -1]].forEach(([s, kk]) => {
      p['f' + s + 'w'] = [hip[0] - R[0] * 0.95 - towards[0] * (kk * 0.13 + 0.1), 1.05 + kk * 0.08, hip[2] - R[2] * 0.95 - towards[2] * (kk * 0.13 + 0.1)];
      p['k' + s + 'w'] = [hip[0] - R[0] * 0.4, 1.8, hip[2] - R[2] * 0.4];
      p['h' + s + 'w'] = [hip[0] + R[0] * 0.2 - towards[0] * kk * 0.42, 0.55, hip[2] + R[2] * 0.2 - towards[2] * kk * 0.42];
    });
    return Rig.solve(p, D);
  }

  function create(r) {
    const T = Art.textures(r);
    const W = World.build(r);
    const X = Cast.build(r);
    const G = Gun.build(r);
    const ov = K.overlay(r, OV_W, OV_H);
    const flame = K.mesh(r, b => b.quad([-0.5, 0, 0], [0.5, 0, 0], [0.5, 1, 0], [-0.5, 1, 0], [1, 1, 1, 1], [[0, 0], [0.25, 0], [0.25, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));
    const puff = K.mesh(r, b => {
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        b.tri([0, 0, 0], [C(a0), S(a0), 0], [C(a1), S(a1), 0], [1, 1, 1, 1], null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      }
    });
    const blob = K.mesh(r, b => {
      const n = 14;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        b.tri([0, 0, 0], [S(a1), 0, C(a1)], [S(a0), 0, C(a0)], [1, 1, 1, 1], null, [[0, 1, 0], [0, 1, 0], [0, 1, 0]]);
      }
    });
    const SHADOW = { toilet: [0.35, 0.45], washer: [0.45, 0.45], freezer: [0.8, 0.5], fridge: [0.45, 0.45], can: [0.55, 0.45], car: [1.2, 2.4], btr: [1.7, 3.6] };
    let grabTex = null;

    function bill(cam, p, w, h) {
      const yr = cam.yaw * PI / 180;
      return M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(-yr), M4.scale(w, h, 1));
    }

    function drawFire(cam, p, t, scale, tipped) {
      const s = scale || 1;
      for (let i = 0; i < 3; i++) {
        const fl = 0.85 + 0.25 * S(t * 13 + i * 2.1) + 0.1 * S(t * 31 + i);
        const off = (i - 1) * 0.14 * s;
        const yr = cam.yaw * PI / 180;
        const q = [p[0] + C(yr) * off, p[1], p[2] + S(yr) * off];
        const frame = Math.floor(t * 12 + i * 3) % 4;
        r.draw(flame, bill(cam, q, 0.55 * s, 0.9 * s * fl), { texture: T.fire, additive: true, alpha: 0.9, uvScroll: [frame * 0.25, 0], noFog: true });
      }
    }

    function drawSmoke(cam, p, age, n) {
      for (let i = 0; i < (n || 5); i++) {
        const a = age * 0.6 + i * 0.7;
        const y = p[1] + 0.5 + (a % 4) * 1.2;
        const rr = 0.5 + (a % 4) * 0.5;
        const q = [p[0] + S(i * 2.3 + age * 0.3) * 0.4, y, p[2] + C(i * 1.7) * 0.4];
        [1, 0.7, 0.45].forEach((k, j) => r.draw(puff, bill(cam, q, rr * k, rr * k), { flat: [0.62, 0.6, 0.58, 1], blend: true, alpha: 0.1 * (1 - (a % 4) / 4) }));
      }
    }

    function thingMatrix(x) {
      const P = x.p;
      if (x.kind === 'can') return M4.chain(M4.translate(P[0], P[1] + 0.5 * Cast.SCALE.can, P[2]), M4.rotY(x.yaw), M4.rotZ(PI / 2), M4.rotY(x.roll || 0), M4.scale(Cast.SCALE.can, Cast.SCALE.can, Cast.SCALE.can));
      if (x.kind === 'carUp') return M4.chain(M4.translate(P[0], 0, P[2]), M4.rotY(x.yaw), M4.translate(0, 2.05, 0), M4.rotX(PI / 2), M4.rotZ(0.3));
      if (x.kind === 'ybtr') return M4.chain(M4.translate(P[0], P[1], P[2]), M4.rotY(x.yaw), M4.translate(0, 3.4 * Math.min(1, x.pitch / 1.57), 0), M4.rotX(-x.pitch));
      if (x.kind === 'heliTree') return M4.chain(M4.translate(P[0], 5.0, P[2]), M4.rotY(0.6), M4.rotX(-0.9), M4.rotZ(0.5));
      const h = x.kind === 'freezer' ? 0.43 : x.kind === 'fridge' ? 0.78 : x.kind === 'washer' ? 0.42 : x.kind === 'toilet' ? 0.35 : 0.6;
      const s = Cast.SCALE[x.kind] || 1;
      const lie = x.lie ? M4.rotX(-PI / 2) : M4.ident();
      return M4.chain(M4.translate(P[0], P[1] + h * s, P[2]), M4.rotY(x.yaw || 0), M4.rotX(x.pitch || 0), M4.rotZ(x.roll || 0), lie, M4.scale(s, s, s), M4.translate(0, -h, 0));
    }

    function drawShadows(st) {
      st.things.forEach(x => {
        const sz0 = SHADOW[x.kind];
        if (!sz0) return;
        const sc = Cast.SCALE[x.kind] || 1;
        const sz = [sz0[0] * sc, sz0[1] * sc];
        const hgt = Math.max(0, x.p[1]);
        const fade = clamp(1 - hgt / 4, 0.25, 1);
        const yr = x.yaw || 0;
        [1, 0.75].forEach(k => r.draw(blob, M4.chain(M4.translate(x.p[0], 0.035 + k * 0.004, x.p[2]), M4.rotY(yr), M4.scale(sz[0] * k * (1 + hgt * 0.1), 1, sz[1] * k * (x.kind === 'car' || x.kind === 'btr' ? 1 : 1) * (1 + hgt * 0.1))), { flat: [0.08, 0.06, 0.05, 1], blend: true, alpha: 0.28 * fade }));
      });
    }

    function drawThings(st) {
      drawShadows(st);
      st.things.forEach(x => {
        if (x.kind === 'horn') { Cast.drawProp(r, T, X, 'horn', M4.chain(M4.translate(x.p[0], 0, x.p[2]), M4.rotY(PI - x.yaw)), { aim: 0, tilt: -0.06 }); return; }
        const M = thingMatrix(x);
        if (x.kind === 'car' || x.kind === 'carUp') r.draw(W.car, M, { texture: T.carWhite });
        else if (x.kind === 'btr') r.draw(W.btr, M, { texture: T.khaki, tint: [1.25, 1.25, 1.2] });
        else if (x.kind === 'ybtr') r.draw(W.btr, M, { texture: T.yellowMetal });
        else if (x.kind === 'heliTree') r.draw(W.heli, M, { texture: T.camo });
        else Cast.drawProp(r, T, X, x.kind, M);
      });
    }

    function drawActors(st, t) {
      st.actors.forEach(a => {
        if (a.who === 'ogre') Cast.drawOgre(r, T, X.ogre, ogrePose(a, t), a);
        else Cast.drawMan(r, T, X.man, manPose(a, t), a);
      });
    }

    function drawYardEnd(st, t, cam) {
      const fp = World.barrelPos('yard', t);
      const fireP = [fp.x, 0, fp.z];
      const O = Cam.YARD_ORIGIN;
      World.YARD.statics.forEach(q => {
        const M = M4.chain(M4.translate(O[0] + q.x, 0, O[2] + q.z), M4.rotY(q.rot));
        if (q.kind === 'freezer') r.draw(X.P.freezer, M, { flat: [0.96, 0.96, 1, 1] });
        else if (q.kind === 'horn') Cast.drawProp(r, T, X, 'horn', M, { tilt: -0.06 });
      });
      const towards = V3.norm([fireP[0] - cam.eye[0], 0, fireP[2] - cam.eye[2]]);
      const hd = Math.atan2(towards[0], -towards[2]);
      let Mb;
      if (t < 95.6) {
        const e = ease(clamp((t - 94.45) / 0.45, 0, 1));
        Mb = M4.chain(M4.translate(fireP[0], 0, fireP[2]), M4.rotY(PI - hd), M4.translate(0, 0.32 * e, 0), M4.rotX(-e * PI / 2));
      } else {
        const R = [-towards[2], 0, towards[0]];
        Mb = M4.chain(M4.translate(fireP[0], 0.32, fireP[2]), M4.rotY(Math.atan2(-R[2], R[0])), M4.translate(0.45, 0, 0), M4.rotZ(PI / 2));
      }
      r.draw(W.barrel, Mb);
      if (st.body) Cast.drawMan(r, T, X.man, bodyPose(st, t, fireP), { burn: t > 95.6 });
      if (t < 94.55) drawFire(cam, [fireP[0], 0.85, fireP[2]], t, 1.0);
      else if (t < 95.6) drawFire(cam, [fireP[0] - towards[0] * 0.75, 0.25, fireP[2] - towards[2] * 0.75], t, 1.3);
      else {
        drawFire(cam, [fireP[0] - towards[0] * 0.1, 0.42, fireP[2] - towards[2] * 0.1], t, 1.25);
        drawSmoke(cam, [fireP[0], 0.8, fireP[2]], t - 95.6, 4);
      }
    }

    function drawWorld(st, t) {
      const cam = st.camera;
      const w = r.canvas.width, h = r.canvas.height;
      const env = baseEnv(cam.set);
      if (st.gun.flash) env.points.push({ pos: [cam.eye[0] + cam.fwd[0] * 1.2, cam.eye[1] - 0.1, cam.eye[2] + cam.fwd[2] * 1.2], color: [1.6, 1.0, 0.45] });
      if (st.fire) env.points.push({ pos: [st.fire.x, 1.4, st.fire.z], color: st.flare ? [3.0 * st.flare + 0.6, 1.6 * st.flare + 0.35, 0.3] : [0.9, 0.5, 0.18] });
      const gr = [1.08, 0.98, 0.86];
      const camera = {
        proj: M4.perspective(cam.fov, w / h, 0.05, 900),
        eye: cam.eye, at: cam.at, up: [0, 1, 0],
        grade: [1, 1, 1, 0.22],
        colorM: new Float32Array([gr[0], 0, 0, 0, gr[1], 0, 0, 0, gr[2]]),
        colorAdd: [0.0, -0.01, -0.02],
        fx: { grain: 0.02, vignette: 0.2, time: K.frac(t * 0.37) * 100 }
      };
      r.begin(env, camera);
      World.drawSet(r, T, W, cam.set, cam, t);
      drawThings(st);
      drawActors(st, t);
      if (cam.set === 'village' && st.fire) drawFire(cam, [st.fire.x, 0.85, st.fire.z], t, 1.0);
      if (cam.set === 'yard') drawYardEnd(st, t, cam);
      st.fx.forEach(f => { if (f.kind === 'smoke') drawSmoke(cam, f.p, f.age, 6); });
      return { env, camera };
    }

    function drawView(st, info) {
      if (st.gun.mode === 'none') return;
      const cam = st.camera;
      const V = M4.lookAt(cam.eye, cam.at, [0, 1, 0]);
      const e = info.env;
      const sun = V3.norm(M4.dir(V, e.sunDir));
      const envVM = { sunDir: sun, sunColor: [0.62, 0.55, 0.48], ambTop: [0.42, 0.4, 0.44], ambBottom: [0.22, 0.2, 0.18], fogColor: e.fogColor, fogNear: 50, fogFar: 100, points: st.gun.flash ? [{ pos: [0.0, 0.02, -0.75], color: [2.2, 1.4, 0.6] }] : [] };
      const w = r.canvas.width, h = r.canvas.height;
      r.begin(envVM, { proj: M4.perspective(58, w / h, 0.01, 20), view: M4.ident(), eye: [0, 0, 0], colorM: info.camera.colorM, colorAdd: info.camera.colorAdd, fx: info.camera.fx }, null, true);
      const Mg = Gun.draw(r, T, G, st.gun);
      if (Mg && st.gun.flash) Gun.drawFlash(r, T, G, Mg, st.gun.kick, st.gun.shotN || 0);
    }

    function drawHud(st) {
      ov.begin();
      const H = st.hud;
      if (H.cross) ov.rect(OV_W / 2 - 7, OV_H / 2 - 7, 14, 14, { texture: T.crosshair, blend: true, alpha: 0.7 });
      if (H.label) ov.rect(OV_W / 2 - 132, OV_H / 2 + 6, 128, 36, { texture: T.label });
      if (H.hint) ov.rect(OV_W / 2 - 6, OV_H / 2 + 8, 420, 17.5, { texture: T.hint });
      if (H.pda) ov.rect(12, 424, 288, 20, { texture: T.pda });
      if (H.hit) ov.rect(OV_W / 2 - 60, 30, 120, 30, { texture: T.hit, blend: true, alpha: H.hit });
      if (st.flare) ov.rect(0, 0, OV_W, OV_H, { flat: [1, 0.7, 0.32, 1], additive: true, alpha: st.flare * 0.62 });
      if (st.fadeIn) ov.rect(0, 0, OV_W, OV_H, { flat: [0, 0, 0, 1], blend: true, alpha: st.fadeIn });
      if (st.fadeOut) ov.rect(0, 0, OV_W, OV_H, { flat: [0, 0, 0, 1], blend: true, alpha: st.fadeOut });
    }

    function frame(st, t) {
      const info = drawWorld(st, t);
      drawView(st, info);
      return info;
    }

    return {
      warm() {
        Object.keys(Art.DRAW).forEach(k => T[k]);
        for (let t = 0; t < Script.DURATION; t += 1) Script.stage(t);
      },
      render(t) {
        r.clear([0, 0, 0]);
        let polys = 0;
        if (t >= 77.9 && t < 78.12) {
          const k = (t - 77.9) / 0.22;
          const a = Script.stage(Math.min(t, 77.99));
          frame(a, Math.min(t, 77.99));
          if (!grabTex) grabTex = r.frameTexture();
          r.grab(grabTex, 0, 0, r.canvas.width, r.canvas.height);
          const b = Script.stage(Math.max(t, 78.0));
          frame(b, Math.max(t, 78.0));
          polys = r.polys;
          ov.begin();
          ov.rect(0, 0, OV_W, OV_H, { texture: grabTex, blend: true, alpha: 1 - k });
          return { polys };
        }
        const st = Script.stage(t);
        frame(st, t);
        polys = r.polys;
        drawHud(st);
        return { polys };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Парад беды - STALKER.mp3',
    duration: Script.DURATION,
    aspect: 16 / 9,
    cuts: Script.CUTS,
    stage: Script.stage,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
