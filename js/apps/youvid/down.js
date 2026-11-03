(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Cam = window.DownCam;
  const Script = window.DownScript;
  const World = window.DownWorld;
  const Cast = window.DownCast;
  const Gun = window.DownGun;
  const Art = window.DownArt;
  const PW = window.ParadWorld;

  const OV_W = 960;
  const OV_H = 540;

  function create(r) {
    const T = Art.textures(r);
    const W = World.build(r);
    const X = Cast.build(r);
    const G = Gun.build(r);
    const ov = K.overlay(r, OV_W, OV_H);
    const flame = K.mesh(r, b => b.quad([-0.5, 0, 0], [0.5, 0, 0], [0.5, 1, 0], [-0.5, 1, 0], [1, 1, 1, 1], [[0, 0], [0.25, 0], [0.25, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));
    const heli = K.mesh(r, b => PW.heli(b));
    const btr = K.mesh(r, b => PW.btr(b));
    const blob = K.mesh(r, b => {
      for (let i = 0; i < 14; i++) {
        const a0 = (i / 14) * PI * 2, a1 = ((i + 1) / 14) * PI * 2;
        b.tri([0, 0, 0], [S(a1), 0, C(a1)], [S(a0), 0, C(a0)], [1, 1, 1, 1], null, [[0, 1, 0], [0, 1, 0], [0, 1, 0]]);
      }
    });
    let grabTex = null;

    function bill(cam, p, w, h) {
      const yr = Math.atan2(cam.eye[0] - p[0], cam.eye[2] - p[2]);
      return M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(yr), M4.scale(w, h, 1));
    }

    function fire(cam, p, t, s) {
      for (let i = 0; i < 3; i++) {
        const fl = 0.85 + 0.25 * S(t * 13 + i * 2.1) + 0.1 * S(t * 31 + i);
        const yr = Math.atan2(cam.eye[0] - p[0], cam.eye[2] - p[2]);
        const off = (i - 1) * 0.14 * s;
        const q = [p[0] + C(yr) * off, p[1], p[2] - S(yr) * off];
        const frame = Math.floor(t * 12 + i * 3) % 4;
        r.draw(flame, bill(cam, q, 0.55 * s, 0.9 * s * fl), { texture: T.fire, additive: true, alpha: 0.9, uvScroll: [frame * 0.25, 0], noFog: true });
      }
    }

    function shadow(x, z, sx, sz, a) {
      r.draw(blob, M4.chain(M4.translate(x, 0.03, z), M4.scale(sx, 1, sz)), { flat: [0.05, 0.04, 0.03, 1], blend: true, alpha: a || 0.3 });
    }

    function drawActors(st, t) {
      st.actors.forEach(a => {
        let m;
        if (a.lie) {
          if (a.fall < 1) {
            const up = Cast.pose(Object.assign({}, a, { kind: 'arms' }), t);
            const k = ease(a.fall);
            const piv = [a.pos[0], 0, a.pos[2]];
            const Rm = M4.chain(M4.translate(piv[0], piv[1], piv[2]), M4.rotY(a.face), M4.rotX(-k * PI / 2), M4.rotY(-a.face), M4.translate(-piv[0], -piv[1], -piv[2]));
            Object.keys(up).forEach(key => { if (up[key] instanceof Float32Array) up[key] = M4.mul(Rm, up[key]); });
            m = up;
          } else m = Cast.lying(a);
        } else if (a.barrel) m = Cast.barrelBody(a, t);
        else m = Cast.pose(a, t);
        Cast.drawHuman(r, T, X, m, a);
        if (!a.lie && !a.barrel) shadow(a.pos[0], a.pos[2], 0.45, 0.45, 0.28);
        a.m = m;
      });
    }

    function env(set, st) {
      const e = World.ENV[(st.camera && st.camera.env) || set] || World.ENV.road;
      const out = { sunDir: V3.norm(e.sun), sunColor: e.sunCol, ambTop: e.ambTop, ambBottom: e.ambBot, fogColor: e.fog, fogNear: e.near, fogFar: e.far, points: [] };
      if (st.gun.flash) out.points.push({ pos: [st.camera.eye[0] + st.camera.fwd[0] * 1.2, st.camera.eye[1], st.camera.eye[2] + st.camera.fwd[2] * 1.2], color: [1.6, 1.0, 0.45] });
      return out;
    }

    function drawSet(st, t) {
      const cam = st.camera;
      const set = st.set;
      const w = r.canvas.width, h = r.canvas.height;
      const e = env(set, st);
      const E = World.ENV[set] || {};
      if (set === 'bunker') e.points.push({ pos: [0, 3.2, 1.4], color: [0.9, 0.8, 0.6] });
      if (set === 'village') e.points.push({ pos: [W.village.fire[0], 1.0, W.village.fire[1]], color: [1.2, 0.6, 0.2] });
      if (set === 'barrel') e.points.push({ pos: [0.05, 1.3, -1.55], color: [1.4, 0.7, 0.25] });
      if (set === 'gate') e.points.push({ pos: [W.gate.barrelPos[0], 1.2, W.gate.barrelPos[1]], color: [0.7, 0.36, 0.12] });
      const grade = st.fx.flash ? [1 + st.fx.flash, 1 + st.fx.flash, 1 + st.fx.flash * 1.1, 0.15] : [1, 1, 1, 0.15];
      const camera = {
        proj: M4.perspective(cam.fov, w / h, 0.05, 900),
        eye: cam.eye, at: cam.at, up: [0, 1, 0], grade,
        fx: { grain: 0.02, vignette: 0.22, time: K.frac(t * 0.37) * 100 }
      };
      r.begin(e, camera);
      if (E.sky) r.draw(W.dome, M4.translate(cam.eye[0], 0, cam.eye[2]), { texture: T[E.sky], noFog: true });
      const S0 = W[set];
      if (S0 && S0.list && !st.ogre) PW.drawBatch(r, T, S0.list);
      if (st.ogre) r.draw(W.quad, M4.chain(M4.translate(0, 0, 3), M4.rotX(-PI / 2), M4.scale(12, 12, 1), M4.translate(0, -0.5, 0)), { texture: T.concreteDark, tint: [0.35, 0.35, 0.35] });
      extras(st, t, cam);
      drawActors(st, t);
      return { env: e, camera };
    }

    function extras(st, t, cam) {
      const set = st.set;
      if (set === 'bunker') {
        const B = W.bunker;
        r.draw(B.lamp, M4.ident());
        if (st.ogre) {
          drawOuthouse(st, t);
        } else {
          const m = st.morph || 0;
          if (m < 1) r.draw(B.door, M4.ident(), { texture: T.cloth, tint: [1 + st.doorGlow * 0.8, 1 + st.doorGlow * 0.8, 1 + st.doorGlow * 0.9], blend: m > 0, alpha: 1 - m });
          if (m > 0) drawOuthouse(st, t, m);
        }
      } else if (set === 'road') {
        const k = (t - 10.25) / 3.6;
        r.draw(heli, M4.chain(M4.translate(lerp(-60, -20, k), 46, -170), M4.rotY(1.4), M4.scale(0.9, 0.9, 0.9)), { texture: T.camo, tint: [0.4, 0.4, 0.42] });
      } else if (set === 'army') {
        r.draw(W.army.tractor, M4.chain(M4.translate(8.5, 0, -15), M4.rotY(-0.6)), { texture: T.cab, tint: [0.7, 0.85, 1.0] });
      } else if (set === 'wheel') {
        const Wh = W.wheel;
        const [cx, ch, cz] = Wh.wheelPos;
        const M = M4.chain(M4.translate(cx, ch, cz), M4.rotY(0.25));
        r.draw(Wh.wheel, M, { texture: T.wheelRim });
        for (let i = 0; i < 16; i++) {
          const a = i / 16 * PI * 2 + 0.1;
          r.draw(Wh.cabin, M4.chain(M, M4.translate(C(a) * 6.75, S(a) * 6.75, 0), M4.rotY(0.15), M4.scale(0.62, 0.62, 0.62)), { texture: T.cabin });
        }
      } else if (set === 'village') {
        const Vg = W.village;
        r.draw(Vg.van, M4.chain(M4.translate(Vg.vanPos[0], 0, Vg.vanPos[1]), M4.rotY(1.25)), { texture: T.vanWhite, tint: [0.85, 0.95, 1.05] });
        r.draw(Vg.fireLogs, M4.translate(Vg.fire[0], 0, Vg.fire[1]));
        fire(cam, [Vg.fire[0], 0.05, Vg.fire[1]], t, 0.9);
      } else if (set === 'ctrlOut') {
        r.draw(W.ctrlOut.truck, M4.chain(M4.translate(-3.2, 0, -6.8), M4.rotY(1.15)), { texture: T.cab });
      } else if (set === 'gate') {
        const bp = W.gate.barrelPos;
        r.draw(W.gate.barrel, M4.translate(bp[0], 0, bp[1]));
        fire(cam, [bp[0], 0.72, bp[1]], t, 0.55);
      } else if (set === 'hill') {
        const Hl = W.hill;
        r.draw(Hl.truck, M4.chain(M4.translate(Hl.truckPos[0] + 2, 0, Hl.truckPos[1] - 2), M4.rotY(2.0)), { texture: T.cab });
        r.draw(Hl.truck, M4.chain(M4.translate(9, 0, 6), M4.rotY(1.2)), { texture: T.cab, tint: [0.85, 0.9, 0.85] });
        r.draw(Hl.car, M4.chain(M4.translate(Hl.carPos[0], 0, Hl.carPos[1] - 1.5), M4.rotY(-0.4)), { texture: T.carYellow });
      } else if (set === 'barrel') {
        const Bb = W.barrel;
        r.draw(Bb.barrel, M4.translate(0.05, 0, -1.55), { texture: T.tin, tint: [1.1, 1.0, 0.9] });
        r.draw(Bb.logs, M4.translate(0.05, 0, -1.55));
        fire(cam, [0.05, 0.7, -1.7], t, 1.1);
      } else if (set === 'monument') {
        r.draw(W.monument.emblem, M4.chain(M4.translate(W.monument.emblemPos[0], 1.25, W.monument.emblemPos[1] - 0.6), M4.rotY(-0.35), M4.scale(1.75, 1.75, 1.75)), { texture: T.stone, tint: [0.5, 0.53, 0.58] });
      } else if (set === 'sign') {
        const Sg = W.sign;
        const [sx, sy, sz] = Sg.signPos;
        const M = M4.chain(M4.translate(sx, sy, sz), M4.rotY(-0.1));
        r.draw(Sg.sign, M, { texture: T.concrete });
        if (st.letters) {
          r.draw(Sg.board, M, { texture: T.signBoard });
          r.draw(Sg.letters, M, { texture: T.letters });
        } else r.draw(Sg.panels, M);
        r.draw(btr, M4.chain(M4.translate(Sg.btrPos[0], 0, Sg.btrPos[1] - 1), M4.rotY(1.45)), { texture: T.khaki, tint: [1.2, 1.15, 0.95] });
        fire(cam, [Sg.btrPos[0] - 0.8, 2.1, Sg.btrPos[1] - 1], t, 1.5);
        r.draw(btr, M4.chain(M4.translate(-2.6, 0, 1.2), M4.rotY(-0.1)), { texture: T.khaki, tint: [1.2, 1.15, 0.95] });
      } else if (set === 'plant') {
        const P = W.plant;
        P.boothPos.forEach((bp, i) => {
          const Mb = M4.chain(M4.translate(bp[0], 0, bp[1] - 2), M4.rotY(i ? 0.25 : 0.6));
          r.draw(P.booth, Mb, { texture: T.excavator, tint: [1.0, 0.92, 0.7] });
          if (!i) r.draw(P.boothFront, Mb, { texture: T.booth });
        });
        r.draw(P.excavator, M4.chain(M4.translate(P.excavatorPos[0], 0, P.excavatorPos[1] - 2), M4.rotY(1.2)), { texture: T.excavator });
        r.draw(P.lamp, M4.translate(P.lampPos[0], 0, P.lampPos[1] - 3));
      } else if (set === 'factory') {
        const F = W.factory;
        r.draw(F.excavator, M4.chain(M4.translate(F.excavatorPos[0], 0, F.excavatorPos[1]), M4.rotY(2.2), M4.rotZ(-0.12), M4.scale(1.4, 1.4, 1.4)), { texture: T.excavator });
        r.draw(F.lamp, M4.translate(F.lampPos[0], 0, F.lampPos[1]));
        for (let i = 0; i < 2; i++) {
          const k = (t - 68.33) * 0.09 + i * 0.45;
          const p = [lerp(-50, 60, K.frac(k)), 30 + i * 8, -80 - i * 25];
          r.draw(F.heli, M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(-PI / 2), M4.rotZ(0.15), M4.scale(0.7, 0.7, 0.7)), { texture: T.camo, tint: [0.6, 0.6, 0.55] });
        }
        fire(cam, [F.firePos[0], 0.5, F.firePos[1]], t, 0.8);
      }
    }

    function drawOuthouse(st, t, alpha) {
      const B = W.bunker;
      const a = alpha === undefined ? 1 : alpha;
      const op = a < 1 ? { blend: true, alpha: a } : {};
      const M = M4.chain(M4.translate(0, 0, 0.75), M4.scale(1.22, 1.12, 1.0));
      r.draw(B.outhouse, M, Object.assign({ texture: T.plankOld }, op));
      r.draw(B.outhouseMoss, M, Object.assign({ texture: T.moss }, op));
      const d = st.door || 0;
      const Md = M4.chain(M, M4.translate(0.6, 0, 0.73), M4.rotY(d * 2.7));
      r.draw(B.outhouseDoor, Md, Object.assign({ texture: T.outDoor }, op));
      if (st.ogre) {
        const m = Cast.ogrePose([0.05, 0, 1.35], t);
        const k = Cast.ogreKey(t);
        const base = [0.05, 0, 1.35 + k.z];
        const Sc = M4.chain(M4.translate(base[0], 0, base[2]), M4.scale(1.1, 1.1, 1.1), M4.translate(-base[0], 0, -base[2]));
        Object.keys(m).forEach(key => { if (m[key] instanceof Float32Array) m[key] = M4.mul(Sc, m[key]); });
        Cast.drawOgre(r, T, X, m, {});
      }
    }

    function drawView(st, info) {
      const g = st.gun;
      if (!g || g.mode === 'none') return;
      const w = r.canvas.width, h = r.canvas.height;
      const cam = st.camera;
      const V = M4.lookAt(cam.eye, cam.at, [0, 1, 0]);
      const e = info.env;
      const envVM = { sunDir: V3.norm(M4.dir(V, e.sunDir)), sunColor: e.sunColor.map(c => c * 1.1), ambTop: e.ambTop.map(c => c * 0.85), ambBottom: e.ambBottom.map(c => c * 0.8), fogColor: e.fogColor, fogNear: 50, fogFar: 100, points: g.flash ? [{ pos: [0.05, 0.0, -0.6], color: [2.2, 1.4, 0.6] }] : [] };
      if (st.set === 'barrel' || st.set === 'gate' || st.set === 'village') envVM.points.push({ pos: [0.0, -0.2, -1.2], color: [0.8, 0.45, 0.2] });
      r.begin(envVM, { proj: M4.perspective(55, w / h, 0.01, 20), view: M4.ident(), eye: [0, 0, 0], grade: info.camera.grade, fx: info.camera.fx }, null, true);
      const muzzle = Gun.draw(r, T, G, g);
      if (g.flash) Gun.drawFlash(r, T, G, muzzle, g.flash, g.shotN || 0);
    }

    const TAPS = (() => {
      const out = [[0, 0]];
      for (let i = 0; i < 8; i++) out.push([C(i / 8 * PI * 2), S(i / 8 * PI * 2)]);
      for (let i = 0; i < 8; i++) out.push([C((i + 0.5) / 8 * PI * 2) * 0.5, S((i + 0.5) / 8 * PI * 2) * 0.5]);
      return out;
    })();

    function blurPass(st, t, k) {
      const w = r.canvas.width, h = r.canvas.height;
      const bw = Math.max(16, Math.round(w / 2)), bh = Math.max(9, Math.round(h / 2));
      const info = drawSetRect(st, t, bw, bh);
      drawViewRect(st, info, bw, bh);
      if (!grabTex) grabTex = r.frameTexture();
      r.grab(grabTex, 0, 0, bw, bh);
      r.clear([0, 0, 0]);
      ov.begin();
      const rad = k * 2.4, m = rad + 2;
      TAPS.forEach(([dx, dy], i) => ov.rect(dx * rad - m, dy * rad - m, OV_W + m * 2, OV_H + m * 2, { texture: grabTex, blend: i > 0, alpha: 1 / (i + 1) }));
      return info;
    }

    function drawSetRect(st, t, bw, bh) {
      const cam = st.camera;
      const set = st.set;
      const e = env(set, st);
      const E = World.ENV[set] || {};
      const camera = { proj: M4.perspective(cam.fov, (bw / bh), 0.05, 900), eye: cam.eye, at: cam.at, up: [0, 1, 0], grade: [1, 1, 1, 0.15], fx: { grain: 0, vignette: 0.22, time: 0 } };
      r.begin(e, camera, { x: 0, y: 0, w: bw, h: bh });
      if (E.sky) r.draw(W.dome, M4.translate(cam.eye[0], 0, cam.eye[2]), { texture: T[E.sky], noFog: true });
      const S0 = W[set];
      if (S0 && S0.list) PW.drawBatch(r, T, S0.list);
      extras(st, t, cam);
      drawActors(st, t);
      return { env: e, camera };
    }

    function drawViewRect(st, info, bw, bh) {
      const g = st.gun;
      if (!g || g.mode === 'none') return;
      const cam = st.camera;
      const V = M4.lookAt(cam.eye, cam.at, [0, 1, 0]);
      const e = info.env;
      const envVM = { sunDir: V3.norm(M4.dir(V, e.sunDir)), sunColor: e.sunColor, ambTop: e.ambTop.map(c => c * 0.85), ambBottom: e.ambBottom.map(c => c * 0.8), fogColor: e.fogColor, fogNear: 50, fogFar: 100, points: [] };
      r.begin(envVM, { proj: M4.perspective(55, bw / bh, 0.01, 20), view: M4.ident(), eye: [0, 0, 0], grade: info.camera.grade }, { x: 0, y: 0, w: bw, h: bh }, true);
      Gun.draw(r, T, G, g);
    }

    function hud(st) {
      const H = st.hud;
      if (!H || st.noHud) return;
      ov.rect(2, 0, 132, 132, { texture: T['map:' + H.map] });
      ov.rect(12, 146, 42, 13, { texture: T.hudBattery });
      ov.rect(-8, 452, 96, 86, { texture: T['stance:' + H.stance] });
      ov.rect(836, 446, 120, 30, { texture: T.hudBars });
      ov.rect(838, 480, 118, 56, { texture: T['ammo:' + H.ammo] });
      if (H.belt) ov.rect(120, 498, 130, 34, { texture: T.hudBelt });
      if (H.cross === 'dot') ov.rect(OV_W / 2 - 8, OV_H / 2 - 8, 16, 16, { texture: T.crossDot });
      if (H.cross === 'ticks') ov.rect(OV_W / 2 - 22, OV_H / 2 - 22, 44, 44, { texture: T.crossTicks });
      if (H.drop) ov.rect(906, 352, 22, 32, { texture: T.drop });
    }

    function overlays(st, info) {
      const cam = st.camera;
      if (st.gamepad) ov.rect(727, 32, 220, 136, { texture: T.gamepad, blend: true, alpha: st.gamepad * 0.85 });
      if (st.fps !== undefined) ov.rect(377, 2, 156, 117, { texture: T['fps:' + st.fps] });
      if (st.alerts) [[195, 20], [672, 30], [184, 378], [668, 382]].forEach(([x, y]) => ov.rect(x, y, 92, 80, { texture: T.alert, blend: true, alpha: st.alerts }));
      if (st.arrow && (!st.arrow.from || st.t >= st.arrow.from)) ov.rect(st.arrow.x, st.arrow.y, st.arrow.w, st.arrow.h, { texture: T.arrow });
      if (st.npcLabel) {
        const a = st.actors[st.npcLabel.actor];
        if (a && a.m) {
          const p = M4.point(a.m.chest, [0, st.npcLabel.at === 'chest' ? -0.05 : 0.75, 0.2]);
          const sp = Cam.project(cam, p);
          if (sp) ov.rect(sp[0] * OV_W - 50, sp[1] * OV_H - 12, 100, 25, { texture: T[st.npcLabel.tex] });
        }
      }
      if (st.talkHint) ov.rect(OV_W / 2 - 60, 486, 120, 16, { texture: T.talkHint });
      if (st.redArc) ov.rect(300, 40, 230 * st.redArc, 120, { texture: T.redArc });
      st.titles.forEach(tt => {
        const D = Art.TITLES[tt.key];
        ov.rect(tt.x, tt.y, D.w, D.h, { texture: T['title:' + tt.key], blend: tt.alpha < 1, alpha: tt.alpha });
      });
    }

    function frame(st, t) {
      let info;
      if (st.fx.blur > 1) info = blurPass(st, t, st.fx.blur);
      else {
        info = drawSet(st, t);
        drawView(st, info);
      }
      return info;
    }

    function inventory(st, t) {
      r.clear([0.08, 0.08, 0.08]);
      ov.begin();
      ov.rect(0, 0, OV_W, 150, { texture: T.skyGrey });
      ov.rect(-120, 60, OV_W + 240, 520, { texture: T.corrDark, tint: [0.75, 0.82, 0.95] });
      ov.rect(560, 0, 420, 300, { texture: T.plasterGrey, tint: [0.55, 0.55, 0.6] });
      ov.rect(0, 0, OV_W, OV_H, { flat: [0, 0, 0, 1], blend: true, alpha: 0.3 });
      ov.rect(0, 0, OV_W, OV_H, { texture: T.inventory });
    }

    function invModel(st, t) {
      r.clear([0.1, 0.12, 0.14]);
      const cam = st.camera;
      const w = r.canvas.width, h = r.canvas.height;
      const E = World.ENV.invModel;
      r.begin({ sunDir: V3.norm(E.sun), sunColor: E.sunCol, ambTop: E.ambTop, ambBottom: E.ambBot, fogColor: E.fog, fogNear: E.near, fogFar: E.far, points: [] }, { proj: M4.perspective(cam.fov, w / h, 0.05, 50), eye: cam.eye, at: cam.at, up: [0, 1, 0] });
      r.draw(W.quad, M4.chain(M4.translate(0, -1, -1.2), M4.scale(8, 6, 1)), { flat: [0.12, 0.15, 0.2, 1] });
      drawActors(st, t);
      ov.begin();
      ov.rect(30, 0, 40, 540, { texture: T.invFrame });
      ov.rect(70, 200, 90, 340, { texture: T.invBars });
      if (st.arrow) ov.rect(st.arrow.x, st.arrow.y, st.arrow.w, st.arrow.h, { texture: T.arrow });
    }

    return {
      warm() {
        Object.keys(Art.DRAW).forEach(k => T[k]);
        Object.keys(window.ParadArt.DRAW).forEach(k => T[k]);
        Object.keys(Art.TITLES).forEach(k => T['title:' + k]);
        for (let t = 0; t < Script.DURATION; t += 0.5) {
          const st = Script.stage(t);
          if (st.hud) { T['map:' + st.hud.map]; T['ammo:' + st.hud.ammo]; T['stance:' + st.hud.stance]; }
          if (st.fps !== undefined) T['fps:' + st.fps];
        }
      },
      render(t) {
        r.clear([0, 0, 0]);
        const st = Script.stage(t);
        if (st.set === 'card') {
          ov.begin();
          ov.rect(120, 0, 720, 540, { texture: T.rating });
          if (st.fx.fade) ov.rect(0, 0, OV_W, OV_H, { flat: [0, 0, 0, 1], blend: true, alpha: st.fx.fade });
          return { polys: 2 };
        }
        if (st.set === 'black') return { polys: 0 };
        if (st.set === 'inv') { inventory(st, t); return { polys: r.polys }; }
        if (st.set === 'invModel') { invModel(st, t); return { polys: r.polys }; }
        const stW = st.fx.lowFps ? Script.stage(Math.max(Cam.shotAt(t).t0, Math.floor(t * st.fx.lowFps) / st.fx.lowFps)) : st;
        const info = frame(stW, stW.t);
        const polys = r.polys;
        ov.begin();
        if (st.fx.letterbox) {
          ov.rect(0, 0, OV_W, 67, { flat: [0, 0, 0, 1] });
          ov.rect(0, 473, OV_W, 67, { flat: [0, 0, 0, 1] });
        }
        if (st.fx.fade) ov.rect(0, 0, OV_W, OV_H, { flat: [0, 0, 0, 1], blend: true, alpha: st.fx.fade });
        if (st.madeIn && st.madeIn.line1) ov.rect(53, 404, 190, 22, { texture: T.madeIn });
        if (st.madeIn && st.madeIn.line2) ov.rect(53, 428, 120, 12, { texture: T.outsource, blend: true, alpha: st.madeIn.line2 });
        hud(st);
        overlays(st, info);
        return { polys };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/STALKER - Downgrade Edition Trailer.mp3',
    duration: Script.DURATION,
    aspect: 16 / 9,
    cuts: Script.CUTS,
    stage: Script.stage,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
