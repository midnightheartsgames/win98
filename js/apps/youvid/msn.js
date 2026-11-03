(function () {
  const { M4, V3, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, frac } = K;
  const Fx = window.MeetFx;
  const Sniper = window.MeetSniper;
  const Heavy = window.MeetHeavy;
  const Props = window.MsnProps;
  const Sets = window.MsnSets;
  const Art = window.MsnArt;
  const Script = window.MsnScript;
  const Sh = window.MsnShots;
  const HeavyProps = window.MeetProps;
  const HeavySets = window.MeetSets;
  const MeetArt = window.MeetArt;
  const Fab = window.FabCast;

  const PHOTO_ENV = {
    key: { dir: [0.55, -0.45, -0.7], col: [0.82, 0.78, 0.72] }, ambTop: [0.3, 0.3, 0.34], ambBot: [0.16, 0.15, 0.15], warp: [0.62, 0.4, 0.34], rim: [0.5, 0.5, 0.55], rimPow: 3,
    points: [], fogCol: [0.36, 0.38, 0.42], fog: [50, 90], clear: [0.36, 0.38, 0.42], grade: [1, 1, 1, 0.05], vig: 0.25
  };

  function create(r) {
    const fx = Fx.create(r);
    const SP = Sniper.build(r, fx);
    const PR = Props.build(r);
    const W = Sets.build(r);
    const FP = Fab.build(r);
    const ov = K.overlay(r, 960, 540);
    const tex = {};
    const T = (k) => Art.tex(r, tex, k);
    const quad = ov.quad;
    const gl = fx.gl;
    let blu = null, team = null;
    const bluHeavy = () => (blu || (blu = Heavy.build(r, fx, { team: 'blu' })));
    const lineupParts = () => (team || (team = { HP: Heavy.build(r, fx), MP: HeavyProps.build(r), MS: HeavySets.build(r) }));
    const logoQuad = K.mesh(r, b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));
    const photoTex = r.frameTexture(false);
    const PHOTO = { w: Math.round(fx.cw * 0.25), h: Math.round(fx.cw * 0.25 * 1.15) };

    function glowAt(p, s, a, tint) {
      fx.draw(quad, fx.billboard(p, s, 0), { texture: T('glow'), additive: true, alpha: a, noFog: true, tint: tint || [1, 0.8, 0.45] });
    }

    function drawSniper(st, opts) {
      const s = st.sniper;
      if (!s) return;
      const o = Object.assign({ patch: T('patch') }, s.opts || {}, opts || {});
      Sniper.draw(fx, SP, { m: s.m, face: st.face, hands: s.hands, opts: o });
      const pre = o.pre;
      const W2 = (M) => (pre ? M4.mul(pre, M) : M);
      if (s.rifle) Props.drawRifle(fx, PR, W2(s.rifle));
      if (s.kukri) Props.drawKukri(fx, PR, W2(s.kukri), s.bloody);
    }

    function drawHeavy(st) {
      if (!st.heavy) return;
      const P = st.kind === 'lineup' ? lineupParts().HP : bluHeavy();
      Heavy.draw(fx, P, { m: st.heavy.m, face: st.heavyFace, hands: st.heavy.hands, opts: st.heavy.opts || {} });
      if (st.heavy.gun) HeavyProps.drawGun(fx, lineupParts().MP, st.heavy.gun.M, st.heavy.gun.spin);
    }

    function drawActors(list, opts) {
      (list || []).forEach(a => {
        const m = Fab.solve(a.cls, a.pose);
        Fab.draw(fx, FP, a, m, opts || {});
      });
    }

    function drawProps(list, pre) {
      const W2 = (M) => (pre ? M4.mul(pre, M) : M);
      (list || []).forEach(p => {
        if (p.virtual && !pre) return;
        const M = p.M ? W2(p.M) : null;
        if (p.kind === 'van') fx.draw(PR.van, M, { texture: T('van'), spec: [0.15, 10], rim: 0.5 });
        else if (p.kind === 'bobble') Props.drawBobble(fx, PR, M, p.nod, T);
        else if (p.kind === 'tray') fx.draw(PR.tray, M, Props.METAL);
        else if (p.kind === 'hand') fx.draw(Sniper.handMesh(SP, p.side, p.pose), M, { spec: [0.1, 8], rim: 1.0 });
        else if (p.kind === 'wheel') fx.draw(PR.wheel, M, { spec: [0.3, 14], rim: 0.5 });
        else if (p.kind === 'toothbrush') fx.draw(PR.toothbrush, M, Props.PLASTIC);
        else if (p.kind === 'rifle') Props.drawRifle(fx, PR, M);
        else if (p.kind === 'kukri') Props.drawKukri(fx, PR, M, p.bloody);
        else if (p.kind === 'mug') Props.drawMug(fx, PR, M, T);
        else if (p.kind === 'pot') fx.draw(PR.pot, M, { spec: [0.7, 30], rim: 0.8 });
        else if (p.kind === 'jar') Props.drawJar(fx, PR, M, p.fill);
        else if (p.kind === 'clock') {
          fx.draw(PR.clock, M, Props.METAL);
          fx.draw(PR.clockFace, M, { texture: T('clock'), spec: [0.3, 20], rim: 0.3 });
        } else if (p.kind === 'phoneBox') {
          const tint = p.tint ? { tint: p.tint } : {};
          fx.draw(PR.phoneBox, M, Object.assign({ spec: [0.05, 6], rim: 0.4 }, tint));
          fx.draw(PR.phoneFront, M, Object.assign({ texture: T('phoneBox'), spec: [0.05, 6], rim: 0.4 }, tint));
        } else if (p.kind === 'handset') fx.draw(PR.handset, M, { spec: [0.5, 24], rim: 0.5 });
        else if (p.kind === 'cord') Props.drawCord(fx, PR, pre ? p.pts.map(q => M4.point(pre, q)) : p.pts, 0.006);
        else if (p.kind === 'casing') fx.draw(PR.casing, M, Props.METAL);
        else if (p.kind === 'lamp') {
          fx.draw(PR.lamp, M, { spec: [0.4, 16], rim: 0.4 });
          fx.draw(PR.bulb, M, { noFog: true });
          glowAt(M4.point(M, [0, -0.12, 0]), 0.9, 0.5, [1, 0.95, 0.85]);
        }
      });
    }

    function drawFx(st, t) {
      const F = st.fx || {};
      (F.blood || []).forEach((b, bi) => {
        const g = rand(91 + bi);
        const k = clamp(b.u / 0.7, 0, 1);
        for (let i = 0; i < b.n; i++) {
          const d = V3.norm(V3.add(b.dir, [(g() - 0.5) * 1.6, (g() - 0.3) * 1.2, (g() - 0.5) * 1.2]));
          const sp = 0.6 + g() * 1.6;
          const p = V3.add(b.p, V3.add(V3.mul(d, sp * b.u), [0, -2.5 * b.u * b.u, 0]));
          const s = (0.05 + g() * 0.08) * (1 + k);
          fx.draw(quad, fx.billboard(p, s, g() * 6), { texture: T('puff'), blend: true, alpha: 0.9 * (1 - k), tint: [0.75, 0.06, 0.04], noFog: true });
        }
        if (b.u < 0.12) glowAt(b.p, 0.5, 0.8 * (1 - b.u / 0.12), [1, 0.4, 0.3]);
      });
      (F.beams || []).forEach(bm => {
        const wob = 0.035 + 0.01 * S(t * 30);
        fx.draw(quad, fx.streak(bm.a, bm.b, wob * 2.2), { texture: T('glow'), additive: true, alpha: 0.75, noFog: true, tint: [0.35, 0.95, 0.9] });
        fx.draw(quad, fx.streak(bm.a, bm.b, wob), { texture: T('glow'), additive: true, alpha: 0.9, noFog: true, tint: [0.7, 1, 1] });
        glowAt(bm.a, 0.25, 0.7, [0.4, 1, 0.9]);
      });
      (F.fire || []).forEach(f => {
        const g = rand(17);
        const c = M4.point(f.M, [0, 0.1, 0.1]);
        const fade = 1 - f.u;
        for (let i = 0; i < 26; i++) {
          const a = g() * PI * 2, rr = 0.1 + g() * 0.3;
          const rise = frac(t * (0.6 + g() * 0.6) + g());
          const p = V3.add(c, [C(a) * rr, -0.5 + g() * 1.0 + rise * 0.6, S(a) * rr * 0.6 + 0.12]);
          fx.draw(quad, fx.billboard(p, (0.18 + g() * 0.25) * (1 - rise * 0.5), g() * 6 + t * 3), { texture: T('flame'), additive: true, alpha: 0.85 * fade * (1 - rise), noFog: true, tint: [1, 0.55, 0.25] });
        }
      });
      (F.booms || []).forEach(f => {
        const g = rand(31);
        const k = clamp(f.u / 0.9, 0, 1);
        const R = (f.s || 1.5) * (0.35 + 0.85 * Math.sqrt(k));
        for (let i = 0; i < 18; i++) {
          const a = g() * PI * 2, e = (g() - 0.25) * 1.3;
          const p = V3.add(f.p, V3.mul([C(a) * C(e), S(e) + 0.25, S(a) * C(e)], R * (0.15 + g() * 0.6)));
          fx.draw(quad, fx.billboard(p, R * (0.7 + g() * 0.6) * (1 - k * 0.3), g() * 6), { texture: T('flame'), additive: true, alpha: (0.45 + g() * 0.35) * (1 - k), noFog: true });
        }
        for (let i = 0; i < 8; i++) {
          const a = g() * PI * 2;
          const p = V3.add(f.p, [C(a) * R * 0.7, R * 0.3 + k * R * 1.2, S(a) * R * 0.7]);
          fx.draw(quad, fx.billboard(p, R * (0.8 + k * 0.9), g() * 6), { texture: T('puff'), tint: [0.32, 0.29, 0.26], blend: true, alpha: 0.5 * Math.min(1, k * 3) * (1 - k * 0.7), noFog: true });
        }
        glowAt(f.p, R * 3, 0.8 * (1 - k), [1, 0.7, 0.35]);
      });
      if (st.flash) {
        fx.draw(quad, fx.billboard(st.flash.p, st.flash.s, t * 21), { texture: T('flash'), additive: true, alpha: st.flash.a, noFog: true });
        glowAt(st.flash.p, st.flash.s * 3, st.flash.a, [1, 0.9, 0.6]);
      }
    }

    function drawSun(st) {
      if (!st.sun) return;
      const e = fx.cam.eye;
      const p = V3.add(e, st.sun.p);
      fx.draw(quad, fx.billboard(p, st.sun.s, 0), { texture: T('sun'), additive: true, alpha: 0.9, noFog: true, noDepth: true });
    }

    function drawShafts(st) {
      (st.shafts || []).forEach(sf => {
        const g = rand(5);
        for (let i = 0; i < 5; i++) {
          const o = V3.add(sf.p, [0, (g() - 0.5) * sf.h, (g() - 0.5) * sf.w]);
          fx.draw(quad, fx.streak(o, V3.add(o, V3.mul(V3.norm(sf.dir), sf.len)), 0.35 + g() * 0.3), { texture: T('glow'), additive: true, alpha: 0.12, noFog: true, tint: [1, 0.8, 0.55] });
        }
      });
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

    function heavyPhoto(t) {
      const pose = { p: [0, 1.02, 0], fwd: [0, 0, 1], up: [0, 1, 0], sp: [-0.05, 0, 0], nk: [-0.12, 0.08, 0.04], eL: [0.85, -0.75, -0.15], eR: [-0.85, -0.75, -0.15] };
      pose.fLw = [0.22, 0.075, 0.05];
      pose.fRw = [-0.22, 0.075, 0.05];
      const st = Sh.heavyState(pose, null);
      const h = Sh.headPos(st);
      fx.begin(PHOTO_ENV, { eye: V3.add(h, [0.06, 0.0, 0.66]), at: V3.add(h, [0.0, -0.05, 0]), fov: 34, near: 0.05, far: 60 }, { x: 0, y: 0, w: PHOTO.w, h: PHOTO.h });
      Heavy.draw(fx, bluHeavy(), { m: st.m, face: Sh.heavyFace(t, Sh.HX.laugh), hands: st.hands, opts: {} });
      r.grab(photoTex, 0, 0, PHOTO.w, PHOTO.h);
    }

    function lineup(st) {
      const H = lineupParts();
      fx.begin(st.env, st.camera);
      HeavySets.draw(fx, H.MS, 'lineup', {});
      if (st.blur) fx.blurBack(st.blur);
      drawHeavy(st);
      drawActors(st.actors);
      drawSniper(st);
      if (st.logo) drawLogo(st.logo);
    }

    function scopeOverlay() {
      ov.begin();
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.DST_COLOR, gl.ZERO);
      ov.rect(0, 0, 960, 540, { texture: T('scope') });
      gl.disable(gl.BLEND);
    }

    function finish(st) {
      if (st.blurAll) fx.blurBack(st.blurAll);
      const needOv = st.scope || st.tintAll || st.white || st.fade || st.dark;
      if (!needOv) return;
      if (st.scope) scopeOverlay();
      ov.begin();
      if (st.tintAll && st.tintAll[3] > 0) ov.rect(0, 0, 960, 540, { flat: [st.tintAll[0], st.tintAll[1], st.tintAll[2], 1], alpha: st.tintAll[3], blend: true });
      if (st.white > 0) ov.rect(0, 0, 960, 540, { flat: [1, 0.97, 0.9, 1], alpha: clamp(st.white, 0, 1), blend: true });
      const dark = Math.max(st.dark || 0, st.fade || 0);
      if (dark > 0) ov.rect(0, 0, 960, 540, { flat: [0, 0, 0, 1], alpha: clamp(dark, 0, 1), blend: true });
    }

    function scene3d(st, t) {
      const set = st.set;
      if (set === 'mirror') {
        heavyPhoto(t);
        fx.begin(st.env, st.camera);
        gl.frontFace(gl.CW);
        Sets.draw(fx, W, 'mirror', T, { virtual: true });
        drawSniper(st, { pre: Sets.MIRROR });
        drawProps(st.props, Sets.MIRROR);
        gl.frontFace(gl.CCW);
        Sets.draw(fx, W, 'mirror', T, { heavyTex: photoTex });
        Sets.draw(fx, W, 'glass', T, {});
        if (!st.noReal) {
          drawSniper(st);
          drawProps(st.props);
        }
      } else if (set === 'dash' || set === 'cab') {
        fx.begin(st.env, st.camera);
        Sets.draw(fx, W, set, T, { scroll: st.scroll || 0 });
        fx.blurBack(st.outsideBlur === undefined ? 0.8 : st.outsideBlur);
        Sets.draw(fx, W, set, T, { inside: true });
        drawProps(st.props);
        drawSniper(st);
      } else if (set === 'nest') {
        fx.begin(st.env, st.camera);
        Sets.draw(fx, W, 'nest', T, {});
        drawFx(st, t);
        fx.blurBack(0.35);
        fx.begin(st.envIn, st.camera, null, true);
        Sets.draw(fx, W, 'nest', T, { inside: true });
        drawSniper(st);
      } else {
        fx.begin(st.env, st.camera);
        Sets.draw(fx, W, set, T, st.setOpts || {});
        drawSun(st);
        if (st.blur) fx.blurBack(st.blur);
        drawActors(st.actors);
        drawHeavy(st);
        drawProps(st.props);
        drawSniper(st);
        drawShafts(st);
        drawFx(st, t);
        if (st.sun) fx.glow(0.22, 0.65);
      }
      finish(st);
    }

    return {
      warm() {
        bluHeavy();
        lineupParts();
        Object.keys(Art.SIZES).forEach(T);
        ['flash', 'glow', 'puff', 'flame', 'tf2', 'tf2emblem', 'valve', 'cardboard'].forEach(T);
        Object.keys(Sniper.HAND_POSES).forEach(p => ['L', 'R'].forEach(s => Sniper.handMesh(SP, s, p)));
        const noop = { draw() {} };
        [30, 33.5, 62, 71.5, 72.5, 74, 75, 81].forEach(t => (Script.stage(t).actors || []).forEach(a => Fab.draw(noop, FP, a, Fab.solve(a.cls, a.pose), {})));
      },
      render(t) {
        const st = Script.stage(t);
        if (st.kind === 'black') {
          r.clear([0, 0, 0]);
        } else if (st.kind === 'card') {
          r.clear([0, 0, 0]);
          ov.begin();
          st.cards.forEach(c => ov.rect(0, 0, 960, 540, Object.assign({ texture: T(c.tex) }, c.alpha < 1 ? { alpha: c.alpha, blend: true } : {})));
        } else if (st.kind === 'lineup') {
          lineup(st);
        } else {
          scene3d(st, t);
        }
        return { polys: Math.round(fx.polys + r.polys), shot: st.shot };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Meet the Sniper.mp3',
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
