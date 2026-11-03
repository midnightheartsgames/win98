(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, frac } = K;
  const Fx = window.MeetFx;
  const Heavy = window.MeetHeavy;
  const Props = window.MeetProps;
  const Sets = window.MeetSets;
  const Art = window.MeetArt;
  const Fab = window.FabCast;
  const Script = window.MeetScript;

  const SHAFTS = [
    { p: [-2.4, 5.5, -1.2], yaw: 0.5, roll: -0.42, w: 1.1, h: 6.5, a: 0.09 },
    { p: [-0.9, 5.5, -1.6], yaw: 0.5, roll: -0.42, w: 0.9, h: 6.5, a: 0.07 },
    { p: [0.6, 5.5, -2.0], yaw: 0.5, roll: -0.42, w: 0.8, h: 6.0, a: 0.05 }
  ];

  function create(r) {
    const fx = Fx.create(r);
    const HP = Heavy.build(r, fx);
    const PR = Props.build(r);
    const W = Sets.build(r);
    const FP = Fab.build(r);
    const ov = K.overlay(r, 960, 540);
    const tex = {};
    const T = (k) => Art.tex(r, tex, k);
    const quad = ov.quad;
    const shell = K.mesh(r, b => b.box(0.018, 0.045, 0.018, 0xc9a24a));
    const logoQuad = K.mesh(r, b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], rgb(0xffffff, 1), [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));
    const ACTOR_MAT = { spec: [0.1, 8], rim: 0.9 };

    function drawFx(list) {
      list.forEach(f => {
        const g = rand(f.seed || 7);
        if (f.kind === 'muzzle') {
          fx.draw(quad, fx.billboard(f.p, f.s, f.spin || 0), { texture: T('flash'), additive: true, alpha: 1, noFog: true });
          fx.draw(quad, fx.billboard(f.p, f.s * 1.8, 0), { texture: T('glow'), additive: true, alpha: 0.5, noFog: true, tint: [1, 0.8, 0.4] });
        } else if (f.kind === 'tracer') {
          fx.draw(quad, fx.streak(f.a, f.b, 0.05), { texture: T('glow'), additive: true, alpha: 0.9, noFog: true, tint: [1, 0.85, 0.45] });
        } else if (f.kind === 'shell') {
          fx.draw(shell, M4.chain(M4.translate(f.p[0], f.p[1], f.p[2]), M4.rotX(f.spin), M4.rotZ(f.spin * 0.7)), { spec: [0.8, 30], rim: 0.5 });
        } else if (f.kind === 'dust') {
          const k = f.u;
          fx.draw(quad, fx.billboard([f.p[0], f.p[1] + k * 0.6, f.p[2]], (f.s || 0.6) * (0.4 + k * 1.2), k * 3), { texture: T('puff'), blend: true, alpha: 0.55 * (1 - k), tint: [0.85, 0.72, 0.56], noFog: true });
        } else if (f.kind === 'boom') {
          const k = clamp(f.u / 0.9, 0, 1);
          const R = (f.s || 1.5) * (0.35 + 0.85 * Math.sqrt(k));
          for (let i = 0; i < 22; i++) {
            const a = g() * PI * 2, e = (g() - 0.25) * 1.3;
            const d = [C(a) * C(e), S(e) + 0.25, S(a) * C(e)];
            const p = V3.add(f.p, V3.mul(d, R * (0.15 + g() * 0.6)));
            fx.draw(quad, fx.billboard(p, R * (0.7 + g() * 0.6) * (1 - k * 0.3), g() * 6), { texture: T('flame'), additive: true, alpha: (0.35 + g() * 0.35) * (1 - k), noFog: true });
          }
          for (let i = 0; i < 12; i++) {
            const a = g() * PI * 2;
            const p = V3.add(f.p, [C(a) * R * 0.7, R * 0.3 + k * R * 1.2, S(a) * R * 0.7]);
            fx.draw(quad, fx.billboard(p, R * (0.8 + k * 0.9), g() * 6), { texture: T('puff'), tint: [0.32, 0.29, 0.26], blend: true, alpha: 0.6 * Math.min(1, k * 3) * (1 - k * 0.7), noFog: true });
          }
          for (let i = 0; i < 16; i++) {
            const a = g() * PI * 2, e = g() * 1.2;
            const d = [C(a) * C(e), S(e), S(a) * C(e)];
            const p = V3.add(f.p, V3.add(V3.mul(d, k * (f.s || 1.5) * 3 * (0.5 + g())), [0, -k * k * 2, 0]));
            fx.draw(quad, fx.billboard(p, 0.12, 0), { texture: T('glow'), additive: true, alpha: 1 - k, noFog: true, tint: [1, 0.8, 0.4] });
          }
        } else if (f.kind === 'fire') {
          const n = f.n || 14;
          for (let i = 0; i < n; i++) {
            const ph = frac(f.u * 1.4 + i / n + g() * 0.3);
            const p = V3.add(f.p, [(g() - 0.5) * (f.w || 1), ph * (f.h || 1.2), (g() - 0.5) * (f.d || 1)]);
            const s = (f.s || 0.6) * (0.6 + S(ph * PI) * 0.8) * (1 - ph * 0.3);
            fx.draw(quad, fx.billboard(p, s, g() * 6), { texture: T('flame'), additive: true, alpha: 0.9 * (1 - ph * 0.6), noFog: true });
          }
        } else if (f.kind === 'smokeTrail') {
          for (let i = 0; i < 12; i++) {
            const y = (i / 12) * f.h;
            const p = V3.add(f.p, [S(y * 0.8 + f.u) * 0.3, y, C(y * 0.6) * 0.2]);
            fx.draw(quad, fx.billboard(p, 0.7 + y * 0.12, i), { texture: T('puff'), blend: true, alpha: 0.45 * (1 - i / 14), tint: [0.86, 0.84, 0.82], noFog: true });
          }
        }
      });
    }

    function drawHeavy(st, opts) {
      if (!st.heavy) return;
      Heavy.draw(fx, HP, { m: st.heavy.m, face: st.face, hands: st.heavy.hands, opts: opts || {} });
      if (st.heavy.gun) Props.drawGun(fx, PR, st.heavy.gun.M, st.heavy.gun.spin);
    }

    function drawProps(list) {
      (list || []).forEach(p => {
        if (p.kind === 'box') {
          fx.draw(PR.box, p.M, { texture: T('cardboard'), spec: [0.03, 4], rim: 0.3 });
          fx.draw(PR.boxFront, p.M, { texture: T('boxFront'), spec: [0.03, 4], rim: 0.3 });
        } else if (p.kind === 'table') {
          fx.draw(PR.table, p.M, { spec: [0.1, 8], rim: 0.4 });
        } else if (p.kind === 'round') {
          fx.draw(PR.round, p.M, { spec: [0.9, 26], rim: 0.6 });
        }
      });
    }

    function drawActors(list) {
      (list || []).forEach(a => {
        const m = Fab.solve(a.cls, a.pose);
        Fab.draw(fx, FP, a, m, Object.assign({}, a.drawOpts || {}));
      });
    }

    function drawLogo(L) {
      fx.begin(Fx.DEFAULT_ENV, { eye: [0, 0, 3.2], at: [0, 0, 0], fov: 40, near: 0.05, far: 50 }, null, true);
      const gap = Art.LOGO.gap;
      const wdt = 3.7, hgt = wdt * 160 / 1024;
      const base = M4.chain(M4.translate(0, -0.66 + (L.y || 0), 0), M4.rotX((1 - L.flip) * 1.4), M4.scale(wdt, hgt, 1));
      const n = 26;
      for (let i = n; i >= 1; i--) {
        const k = i / n;
        const M = M4.chain(base, M4.translate(-k * 0.022, -k * 0.2, -k * 0.09));
        fx.draw(logoQuad, M, { texture: T('tf2'), tint: [lerp(0.93, 0.62, k), lerp(0.62, 0.33, k), lerp(0.22, 0.1, k)], noFog: true });
      }
      fx.draw(logoQuad, M4.chain(base, M4.translate(0, 0, 0.002)), { texture: T('tf2'), tint: [1, 1, 1], noFog: true });
      if (L.emblem > 0) {
        const ex = gap - 0.5;
        const target = M4.chain(base, M4.translate(ex, 0.05, 0.006), M4.scale(hgt * 0.8 / wdt, 0.8, 1));
        let M = target;
        if (L.emblemFly) {
          const k = L.emblem;
          const big = M4.chain(M4.translate(-0.6, 0.2, 2.6), M4.scale(3.2, 3.2, 1));
          M = target.map((v, i) => lerp(big[i], v, k * k));
        }
        fx.draw(logoQuad, M, { texture: T('tf2emblem'), tint: [1, 1, 1], noFog: true });
      }
    }

    function card(texKey, zoom) {
      ov.begin();
      const z = zoom || 1;
      const w = 960 * z, h = 540 * z;
      ov.rect((960 - w) / 2, (540 - h) / 2, w, h, { texture: T(texKey) });
    }

    function scene(st, t) {
      const env = st.env;
      fx.begin(env, st.camera);
      Sets.draw(fx, W, st.set, {});
      if (st.blurSplit === 'heavy') {
        drawHeavy(st);
        fx.blurBack(st.blur || 0.5);
        drawProps(st.props);
      } else {
        if (st.set === 'battle') drawActors(st.actors);
        if (st.blur) fx.blurBack(st.blur);
        drawProps(st.props);
        drawHeavy(st);
        if (st.set !== 'battle') drawActors(st.actors);
      }
      drawFx(st.fx || []);
      if (st.shafts) Sets.draw(fx, W, 'none', { shafts: SHAFTS });
      if (st.motionBlur) fx.blurBack(st.motionBlur);
      if (st.logo) drawLogo(st.logo);
    }

    return {
      warm() {
        ['title', 'orange', 'tf2', 'tf2emblem', 'boxFront', 'cardboard', 'flash', 'glow', 'puff', 'flame'].forEach(T);
        ['planks', 'wall', 'map', 'fan', 'shaft', 'sand', 'rock', 'wood', 'sign', 'lineupWall'].forEach(k => Art.tex(r, W.tex, k));
        Object.keys(Heavy.HAND_POSES).forEach(p => ['L', 'R'].forEach(s => Heavy.handMesh(HP, s, p)));
        const noop = { draw() {} };
        [67, 75, 82].forEach(t => (Script.stage(t).actors || []).forEach(a => Fab.draw(noop, FP, a, Fab.solve(a.cls, a.pose), {})));
      },
      render(t) {
        const st = Script.stage(t);
        if (st.kind === 'black') {
          r.clear([0, 0, 0]);
        } else if (st.kind === 'card') {
          r.clear([0, 0, 0]);
          card(st.cards[0].tex, st.cards[0].zoom);
        } else if (st.kind === 'flash') {
          const b = Script.stage(68.98);
          scene(b, t);
          ov.begin();
          const k = 1 - clamp(st.u / 0.25, 0, 1);
          ov.rect(0, 0, 960, 540, { flat: [1, 0.96, 0.75, 1], alpha: 0.55 + k * 0.4, blend: true });
          ov.rect(-200, -330, 1000, 1000, { texture: T('flash'), additive: true, alpha: 0.9 });
        } else {
          scene(st, t);
        }
        return { polys: Math.round(fx.polys + r.polys), shot: st.shot };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Meet the Heavy.mp3',
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
