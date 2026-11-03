(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, frac } = K;
  const Fx = window.MeetFx;
  const Spy = window.MeetSpy;
  const Scout = window.MeetScout;
  const Sol = window.MeetSoldier;
  const Heavy = window.MeetHeavy;
  const Eng = window.MeetEngineer;
  const Props = window.MspProps;
  const SolProps = window.MtsProps;
  const ScoutProps = window.MscProps;
  const HeavyProps = window.MeetProps;
  const EngProps = window.EngProps;
  const HeavySets = window.MeetSets;
  const MeetArt = window.MeetArt;
  const Sets = window.MspSets;
  const Art = window.MspArt;
  const Script = window.MspScript;
  const Fab = window.FabCast;

  const WEAPON = { spec: [0.3, 16], rim: 0.5 };

  function create(r) {
    const fx = Fx.create(r);
    const PR = Props.build(r);
    const W = Sets.build(r);
    const FP = Fab.build(r);
    const ov = K.overlay(r, 960, 540);
    const tex = {};
    const T = (k) => Art.tex(r, tex, k);
    const quad = ov.quad;
    const cache = {};
    const once = (k, fn) => cache[k] || (cache[k] = fn());
    const SPY = (team) => once('spy' + team, () => Spy.build(r, fx, { team }));
    const SCOUT = () => once('scout', () => Scout.build(r, fx, { team: 'blu' }));
    const SOL = () => once('sol', () => Sol.build(r, fx, { team: 'blu' }));
    const HEAVY = (team) => once('heavy' + team, () => Heavy.build(r, fx, team === 'blu' ? { team: 'blu' } : {}));
    const ENG = () => once('eng', () => Eng.build(r, fx, { team: 'blu' }));
    const blueShirt = (ctx, w, h) => {
      ctx.fillStyle = '#5a87ac';
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, 'rgba(10,28,50,0.2)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.05)');
      g.addColorStop(1, 'rgba(10,28,50,0.2)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    };
    const guestBuild = (Mod, cols, after) => {
      const saved = {};
      Object.keys(cols).forEach(k => { saved[k] = Mod.COL[k]; Mod.COL[k] = cols[k]; });
      try {
        const P = Mod.build(r, fx);
        Object.keys(Mod.HAND_POSES || {}).forEach(pose => ['L', 'R'].forEach(s => Mod.handMesh(P, s, pose)));
        if (after) after(P);
        return P;
      } finally {
        Object.keys(saved).forEach(k => { Mod.COL[k] = saved[k]; });
      }
    };
    const MEDIC = () => once('medic', () => guestBuild(window.MeetMedic, { glove: 0x4f8fc4, gloveDk: 0x3a6c98, tie: 0x24345a, cross: 0x3a6ea8 }));
    const SNIPER = () => once('sniper', () => guestBuild(window.MeetSniper, { shirt: 0x5a87ac, shirtDk: 0x3f6488 }, P => { P.torsoTex = r.texture(512, blueShirt, { height: 512, clamp: true }); }));
    const SOLPR = () => once('solpr', () => SolProps.build(r));
    const SCPR = () => once('scpr', () => ScoutProps.build(r));
    const HPR = () => once('hpr', () => HeavyProps.build(r));
    const EPR = () => once('epr', () => EngProps.build(r));
    const HSETS = () => once('hsets', () => HeavySets.build(r));
    const logoQuad = K.mesh(r, b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], rgb(0xffffff, 1), [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));
    const DOOR_REST = M4.chain(M4.translate(0.03, 1.05, 0), M4.rotY(PI / 2));
    const cw = r.canvas.width, ch = r.canvas.height;
    const px = K.overlay(r, cw, ch);
    const xfade = r.frameTexture(false);
    const SHAFTS = [[-1.1, 1.45, -2.5, 0.35, 0.9], [1.3, 1.45, -2.5, -0.2, 0.9], [3.0, 1.4, -0.1, -0.9, 0.0]];
    const DOOR_FLOOR = M4.chain(M4.translate(2.3, 0.03, 0.35), M4.rotY(0.4), M4.rotX(-PI / 2));

    function glowAt(p, s, a, tint) {
      fx.draw(quad, fx.billboard(p, s, 0), { texture: T('glow'), additive: true, alpha: a, noFog: true, tint: tint || [1, 0.8, 0.45] });
    }

    function drawHero(h) {
      const o = h.opts || {};
      const st = { m: h.st.m, face: h.face || {}, hands: h.st.hands, opts: o };
      if (h.who === 'spy') {
        Spy.draw(fx, SPY(h.team || 'blu'), Object.assign(st, { cig: h.cig }));
      } else if (h.who === 'scout') {
        Scout.draw(fx, SCOUT(), st);
      } else if (h.who === 'soldier') {
        Sol.draw(fx, SOL(), st);
      } else if (h.who === 'heavy') {
        Heavy.draw(fx, HEAVY(h.team || 'blu'), st);
        if (h.gun) HeavyProps.drawGun(fx, HPR(), h.gun.M, h.gun.spin);
      } else if (h.who === 'engineer') {
        Eng.draw(fx, ENG(), st);
      } else if (h.who === 'medic' && window.MeetMedic) {
        window.MeetMedic.draw(fx, MEDIC(), Object.assign(st, { outfit: 'coat' }));
      } else if (h.who === 'sniper' && window.MeetSniper) {
        window.MeetSniper.draw(fx, SNIPER(), st);
      }
      if (h.who === 'soldier' && h.gun && !h.noGun) fx.draw(SOLPR().shotgun, h.gun, WEAPON);
      if (h.who === 'scout' && h.bat) ScoutProps.drawBat(fx, SCPR(), h.bat);
    }

    function drawDoor(d) {
      const M = d.M || (d.open ? DOOR_FLOOR : DOOR_REST);
      fx.draw(PR.door, M, { spec: [0.3, 14], rim: 0.4 });
      fx.draw(PR.doorSign, M, { texture: T('doorSign'), spec: [0.05, 4], rim: 0.1 });
      if (!d.M && !d.open) {
        const KM = Sets.keypadM(M);
        fx.draw(PR.keypad, KM, { spec: [0.3, 14], rim: 0.3 });
        fx.draw(PR.keypadFace, KM, { texture: T('keypad'), spec: [0.2, 10], rim: 0.1 });
        fx.draw(PR.handle, M4.chain(M, M4.translate(-0.33, -0.05, -0.03), M4.rotY(PI)), { spec: [0.8, 40], rim: 0.6 });
      }
      (d.debris || []).forEach(p => fx.draw(p.big ? PR.shardA : PR.shardB, p.M, { spec: [0.3, 14], rim: 0.4 }));
    }

    function drawProp(p) {
      const M = p.M;
      switch (p.kind) {
        case 'shotgun': fx.draw(SOLPR().shotgun, M, WEAPON); break;
        case 'launcher': fx.draw(SOLPR().launcher, M, WEAPON); break;
        case 'bat': ScoutProps.drawBat(fx, SCPR(), M); break;
        case 'minigun': HeavyProps.drawGun(fx, HPR(), M, p.spin || 0); break;
        case 'bell':
          fx.draw(PR.bell, M, { spec: [0.6, 30], rim: 0.6 });
          fx.draw(PR.bellPlate, M, { texture: T('bellPlate'), spec: [0.2, 10], rim: 0.2 });
          fx.draw(PR.hammer, M4.chain(M, M4.translate(0, -0.17, 0.035), M4.rotZ(p.swing || 0)), { spec: [0.5, 20], rim: 0.4 });
          break;
        case 'briefcase':
          fx.draw(PR.briefcase, M, { spec: [0.5, 26], rim: 0.5 });
          fx.draw(PR.caseTop, M, { texture: T('caseTop'), spec: [0.5, 26], rim: 0.3 });
          break;
        case 'knife': Props.drawKnife(fx, PR, M, p.open === undefined ? 1 : p.open); break;
        case 'revolver': fx.draw(PR.revolver, M, WEAPON); break;
        case 'sapper': fx.draw(PR.sapper, M, { spec: [0.5, 24], rim: 0.5 }); break;
        case 'folder': fx.draw(PR.folder, M, { texture: T('folder'), spec: [0.05, 4], rim: 0.2 }); break;
        case 'photo': fx.draw(PR.photo, M, { texture: T(p.tex || 'photo1'), spec: [0.3, 18], rim: 0.2 }); break;
        case 'paper': fx.draw(PR.photo, M, { texture: T('paper'), spec: [0.05, 4], rim: 0.2 }); break;
        case 'cigCase': fx.draw(p.open ? PR.cigCaseOpen : PR.cigCase, M, { spec: [0.8, 40], rim: 0.6 }); break;
        case 'lighter': fx.draw(PR.lighter, M, { spec: [0.8, 40], rim: 0.6 }); break;
        case 'cig': fx.draw(PR.cig, M, { spec: [0.2, 10], rim: 0.4 }); break;
        case 'saw': fx.draw(PR.saw, M, WEAPON); break;
        case 'kukri': fx.draw(PR.kukri, M, WEAPON); break;
        case 'shell': fx.draw(PR.shell, M, { spec: [0.6, 24], rim: 0.4 }); break;
        case 'crate': fx.draw(PR.crate, M, { texture: T('crate'), spec: [0.1, 6], rim: 0.3 }); break;
        case 'sentry': EngProps.drawSentry(fx, EPR(), p.level || 3, M, p.st || {}, T); break;
        default: break;
      }
    }

    function guestFace(f) {
      const o = { lidU: 0.45, lidL: 0.35, jaw: 0, blink: 0, look: [0, 0] };
      if (!f) return o;
      if (f.eyes === 'wide') Object.assign(o, { lidU: 1, browUp: 0.8 });
      if (f.eyes === 'angry' || f.brows === 'angry') Object.assign(o, { browDown: 0.9, lidU: 0.4 });
      if (f.eyes === 'half') o.lidU = 0.3;
      if (f.brows === 'sad') Object.assign(o, { browInUp: 0.8 });
      if (f.brows === 'up') o.browUp = 0.9;
      if (f.mouth === 'o') Object.assign(o, { jaw: 0.4, round: 0.5 });
      if (f.mouth === 'open') o.jaw = 0.3 + (f.open || 0) * 0.5;
      if (f.mouth === 'teeth') Object.assign(o, { wide: 0.7, sneer: 0.5, jaw: 0.08 });
      if (f.mouth === 'smirk') Object.assign(o, { smileL: 0.6, smileR: 0.15 });
      if (f.mouth === 'smile') Object.assign(o, { smileL: 0.6, smileR: 0.6 });
      return o;
    }

    function drawActors(list) {
      (list || []).forEach(a => {
        const Mod = a.team === 'blu' && !a.fab ? (a.cls === 'medic' ? window.MeetMedic : a.cls === 'sniper' ? window.MeetSniper : null) : null;
        if (Mod) {
          const m = Mod.solve(a.pose);
          drawHero({ who: a.cls, team: 'blu', st: { m, hands: {} }, face: guestFace(a.face) });
          if (a.gun && Fab.TWO[a.gun]) fx.draw(Fab.gunMesh(FP, a.gun), M4.mul(m.chest, a.gunM || Fab.twoHanded(a.gun).M), WEAPON);
          if (a.itemR === 'knife') fx.draw(PR.kukri, M4.chain(m.handR, M4.translate(0, -0.075, 0.01), M4.rotX(-PI / 2 + 0.3)), WEAPON);
          return;
        }
        const m = Fab.solve(a.cls, a.pose);
        Fab.draw(fx, FP, a, m, a.opts || {});
      });
    }

    function drawFx(st, t) {
      (st.flashes || []).forEach((f, i) => {
        fx.draw(quad, fx.billboard(f.p, f.s * (0.8 + frac(t * 13 + i) * 0.4), t * 21 + i), { texture: T('flash'), additive: true, alpha: 1, noFog: true });
        glowAt(f.p, f.s * 2.4, 0.6);
      });
      (st.sparks || []).forEach((sk, j) => {
        const g = rand(41 + j);
        const n = sk.n || 10;
        for (let i = 0; i < n; i++) {
          const a = V3.add(sk.p, [(g() - 0.5) * sk.r, (g() - 0.3) * sk.r, (g() - 0.5) * sk.r]);
          const b = V3.add(a, [(g() - 0.5) * sk.r, (g() - 0.5) * sk.r, (g() - 0.5) * sk.r]);
          if (frac(t * 9 + i * 0.37) < 0.6) fx.draw(quad, fx.streak(a, b, 0.012), { texture: T('spark'), additive: true, alpha: 0.9, noFog: true, tint: [0.6, 0.85, 1.0] });
        }
        glowAt(sk.p, sk.r * 3, 0.5 + 0.3 * frac(t * 7), [0.4, 0.7, 1.0]);
      });
      (st.smoke || []).forEach(sm => {
        const n = sm.n || 6;
        for (let i = 0; i < n; i++) {
          const k = frac(t * 0.35 + i / n);
          const p = V3.add(sm.p, [S(i * 2.1 + t) * 0.03 * k + (sm.drift || [0, 0, 0])[0] * k, k * (sm.rise || 0.35), C(i * 1.7 + t) * 0.03 * k]);
          fx.draw(quad, fx.billboard(p, 0.04 + k * 0.22, i + t * 0.3), { texture: T('glow'), additive: true, alpha: (sm.a || 0.35) * 0.55 * (1 - k) * Math.min(1, k * 6), tint: [0.62, 0.64, 0.7], noFog: true });
        }
      });
      (st.glows || []).forEach(g => glowAt(g.p, g.s, g.a === undefined ? 0.7 : g.a, g.tint));
      (st.blood || []).forEach(b => fx.draw(quad, fx.billboard(b.p, b.s, b.spin || 0), { texture: T('blood'), blend: true, alpha: b.a === undefined ? 1 : b.a, noFog: true }));
      (st.cones || []).forEach(c => fx.draw(quad, c.M, { texture: T('cone'), additive: true, alpha: c.a || 0.25, noFog: true, tint: c.tint || [1, 0.95, 0.85] }));
    }

    function drawLogo(L) {
      fx.begin(Fx.DEFAULT_ENV, { eye: [0, 0, 3.2], at: [0, 0, 0], fov: 40, near: 0.05, far: 50 }, null, true);
      const gap = MeetArt.LOGO.gap;
      const wdt = 3.7, hgt = wdt * 160 / 1024;
      const base = M4.chain(M4.translate(0, -0.66 + (L.y || 0), 0), M4.rotX((1 - L.flip) * 1.4), M4.scale(wdt, hgt, 1));
      const n = 26;
      for (let i = n; i >= 1; i--) {
        const k = i / n;
        fx.draw(logoQuad, M4.chain(base, M4.translate(-k * 0.022, -k * 0.2, -k * 0.09)), { texture: T('tf2'), tint: [lerp(0.93, 0.62, k), lerp(0.62, 0.33, k), lerp(0.22, 0.1, k)], noFog: true });
      }
      fx.draw(logoQuad, M4.chain(base, M4.translate(0, 0, 0.002)), { texture: T('tf2'), tint: [1, 1, 1], noFog: true });
      if (L.emblem > 0) {
        const target = M4.chain(base, M4.translate(gap - 0.5, 0.05, 0.006), M4.scale(hgt * 0.8 / wdt, 0.8, 1));
        let M = target;
        if (L.emblemFly) {
          const k = L.emblem;
          const big = M4.chain(M4.translate(-0.6, 0.2, 2.6), M4.scale(3.2, 3.2, 1));
          M = target.map((v, i) => lerp(big[i], v, k * k));
        }
        fx.draw(logoQuad, M, { texture: T('tf2emblem'), tint: [1, 1, 1], noFog: true });
      }
    }

    function overlays(st) {
      const dark = Math.max(st.dark || 0, st.fade || 0);
      if (dark > 0 || st.white > 0 || st.letterbox) {
        ov.begin();
        if (dark > 0) ov.rect(0, 0, 960, 540, { flat: [0, 0, 0, 1], alpha: clamp(dark, 0, 1), blend: true });
        if (st.white > 0) ov.rect(0, 0, 960, 540, { flat: st.whiteCol || [1, 0.97, 0.86, 1], alpha: clamp(st.white, 0, 1), blend: true });
        if (st.letterbox) {
          const hb = 540 * st.letterbox;
          ov.rect(0, 0, 960, hb, { flat: [0.55, 0.36, 0.22, 1] });
          ov.rect(0, 540 - hb, 960, hb, { flat: [0.55, 0.36, 0.22, 1] });
        }
      }
    }

    function lineup(st) {
      fx.begin(st.env, st.camera);
      HeavySets.draw(fx, HSETS(), 'lineup', {});
      if (st.blur) fx.blurBack(st.blur);
      drawActors(st.actors);
      (st.heroes || []).forEach(drawHero);
      (st.props || []).forEach(drawProp);
      drawFx(st, 0);
      if (st.logo) drawLogo(st.logo);
    }

    function floorShadow(fs) {
      const L = fs.dir, y0 = fs.y || 0.005;
      const a = L[0] / L[1], c = L[2] / L[1];
      const pre = new Float32Array([1, 0, 0, 0, -a, 0, -c, 0, 0, 0, 1, 0, a * y0, y0, c * y0, 1]);
      const gl = fx.gl;
      const flat = { flat: [0.32, 0.3, 0.3, 1] };
      const proxy = { draw: (mesh, M) => fx.draw(mesh, M, flat), dyn: fx.dyn, gl };
      gl.enable(gl.STENCIL_TEST);
      gl.clear(gl.STENCIL_BUFFER_BIT);
      gl.stencilFunc(gl.EQUAL, 0, 0xff);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.DST_COLOR, gl.ZERO);
      gl.depthMask(false);
      fs.heroes.forEach(h => {
        if (h.who === 'spy') Spy.draw(proxy, SPY(h.team || 'blu'), { m: h.st.m, face: h.face || {}, hands: h.st.hands, opts: { pre } });
      });
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.disable(gl.STENCIL_TEST);
    }

    function shafts(t) {
      SHAFTS.forEach(([x, y, z, dx, dz], i) => {
        const a = [x, y + 0.4, z], b = [x + dx * 2.2, 0.0, z + 1.9 + dz];
        fx.draw(quad, fx.streak(a, b, 0.9), { texture: T('cone'), additive: true, alpha: 0.16 + 0.03 * S(t * 0.7 + i), noFog: true, tint: [1, 0.85, 0.6] });
      });
    }

    function body3d(st, t) {
      fx.begin(st.env, st.camera);
      if (st.set) Sets.draw(fx, W, st.set, T, st.setOpts || {});
      if (st.door) drawDoor(st.door);
      if (st.floorShadow) floorShadow(st.floorShadow);
      (st.back || []).forEach(drawHero);
      if (st.blur) fx.blurBack(st.blur);
      (st.props || []).forEach(drawProp);
      drawActors(st.actors);
      if (!st.hideHeroes) (st.heroes || []).forEach(drawHero);
      if (st.shafts) shafts(t);
      drawFx(st, t);
      if (st.motion) fx.blurBack(st.motion);
    }

    function scene3d(st, t) {
      if (st.dissolve && st.dissolve.k > 0) {
        body3d(st.dissolve.to, t);
        r.grab(xfade, 0, 0, cw, ch);
        body3d(st, t);
        px.begin();
        px.rect(0, 0, cw, ch, { texture: xfade, blend: true, alpha: clamp(st.dissolve.k, 0, 1) });
        overlays(st.dissolve.k > 0.5 ? st.dissolve.to : st);
        return;
      }
      body3d(st, t);
      overlays(st);
    }

    function cards(st) {
      r.clear([0, 0, 0]);
      ov.begin();
      st.cards.forEach(c => {
        const z = c.zoom || 1;
        const w = 960 * z, h = 540 * z;
        ov.rect((960 - w) / 2, (540 - h) / 2, w, h, Object.assign({ texture: T(c.tex) }, c.alpha !== undefined && c.alpha < 1 ? { alpha: c.alpha, blend: true } : {}));
      });
      overlays(st);
    }

    return {
      warm() {
        SPY('blu');
        SPY('red');
        SCOUT();
        SOL();
        HEAVY('blu');
        HEAVY('red');
        ENG();
        if (window.MeetMedic) MEDIC();
        if (window.MeetSniper) SNIPER();
        SOLPR();
        SCPR();
        HPR();
        EPR();
        HSETS();
        Object.keys(Art.SIZES).forEach(T);
        ['flash', 'glow', 'puff', 'flame', 'tf2', 'tf2emblem', 'metal'].forEach(T);
        Object.keys(Spy.HAND_POSES).forEach(p => ['L', 'R'].forEach(s => Spy.handMesh(SPY('blu'), s, p)));
        Object.keys(Spy.HAND_POSES).forEach(p => ['L', 'R'].forEach(s => Spy.handMesh(SPY('red'), s, p)));
      },
      render(t) {
        const st = Script.stage(t);
        if (st.kind === 'black') r.clear([0, 0, 0]);
        else if (st.kind === 'card') cards(st);
        else if (st.kind === 'lineup') lineup(st);
        else scene3d(st, t);
        return { polys: Math.round(fx.polys + r.polys), shot: st.shot };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Meet the Spy.mp3',
    duration: Script.DURATION,
    aspect: 16 / 9,
    cuts: Script.CUTS,
    stage: Script.stage,
    voiceAt: Script.voiceAt,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
