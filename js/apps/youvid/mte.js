(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, frac } = K;
  const Fx = window.MeetFx;
  const Eng = window.MeetEngineer;
  const Props = window.EngProps;
  const Sets = window.EngSets;
  const Art = window.EngArt;
  const Script = window.EngScript;
  const Heavy = window.MeetHeavy;
  const HeavyProps = window.MeetProps;
  const HeavySets = window.MeetSets;
  const MeetArt = window.MeetArt;
  const Fab = window.FabCast;

  const TITLE_ENV = {
    key: { dir: [0.45, -0.75, -0.5], col: [1.05, 0.98, 0.92] },
    ambTop: [0.36, 0.34, 0.34], ambBot: [0.16, 0.13, 0.12], warp: [0.6, 0.32, 0.28], rim: [0.35, 0.32, 0.3], rimPow: 3,
    points: [], fogCol: [0, 0, 0], fog: [500, 900], clear: [0, 0, 0], grade: [1, 1, 1, 0], vig: 0
  };

  function create(r) {
    const fx = Fx.create(r);
    const EP = Eng.build(r, fx);
    const PR = Props.build(r);
    const W = Sets.build(r);
    const FP = Fab.build(r);
    let heavy = null;
    const lineupParts = () => {
      if (!heavy) heavy = { HP: Heavy.build(r, fx), MP: HeavyProps.build(r), MS: HeavySets.build(r) };
      return heavy;
    };
    const ov = K.overlay(r, 960, 540);
    const tex = {};
    const T = (k) => Art.tex(r, tex, k);
    const quad = ov.quad;
    const gib = K.mesh(r, b => {
      b.box(0.11, 0.3, 0.11, 0x3a4a6a);
      b.at(0, -0.17, 0.04, h => h.box(0.12, 0.08, 0.2, 0x2a2420));
      b.at(0, 0.16, 0, h => h.box(0.12, 0.04, 0.12, 0x8a2a20));
    });
    const rocketMesh = K.mesh(r, b => {
      b.push(M4.rotX(PI / 2));
      b.prism(8, 0.035, 0.035, -0.18, 0.035, 0.035, 0.12, 0x6a6c68, { capBottom: true });
      b.prism(8, 0.035, 0.035, 0.12, 0.004, 0.004, 0.2, 0x8a2a20);
      b.pop();
    });
    const logoQuad = K.mesh(r, b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], rgb(0xffffff, 1), [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));

    function glowAt(p, s, a, tint) {
      fx.draw(quad, fx.billboard(p, s, 0), { texture: T('glow'), additive: true, alpha: a, noFog: true, tint: tint || [1, 0.8, 0.45] });
    }

    function drawSentries(list) {
      (list || []).forEach(s => Props.drawSentry(fx, PR, s.level, M4.chain(M4.translate(s.at[0], s.at[1], s.at[2])), s, T));
    }

    function sentryOf(st, key) {
      const map = { s1: 0, s2: 1, s3: 2, s3c: 3 };
      return st.camp && st.camp.sentries[map[key]];
    }

    function drawFlashes(st, t) {
      (st.flashes || []).forEach(f => {
        const s = sentryOf(st, f.at);
        if (!s) return;
        const muzzles = Props.sentryMuzzles(s.level, M4.translate(s.at[0], s.at[1], s.at[2]), s);
        const list = f.both ? muzzles : [muzzles[0]];
        list.forEach((m, i) => {
          const fl = frac(t * 13 + i * 0.5);
          const p = V3.add(m.p, V3.mul(m.dir, 0.12 * f.s));
          fx.draw(quad, fx.billboard(p, f.s * (0.7 + fl * 0.5), t * 21 + i), { texture: T('flash'), additive: true, alpha: 1, noFog: true });
          glowAt(p, f.s * 2.2, f.glow === undefined ? 0.55 : f.glow);
          if (f.tracers) {
            for (let k = 0; k < 3; k++) {
              const ph = frac(t * 3.2 + k / 3 + i * 0.17);
              const a = V3.add(m.p, V3.mul(m.dir, 0.4 + ph * 14));
              const b = V3.add(a, V3.mul(m.dir, 1.6));
              fx.draw(quad, fx.streak(a, b, 0.05), { texture: T('glow'), additive: true, alpha: 0.85, noFog: true, tint: [1, 0.85, 0.45] });
            }
          }
          if (f.smoke) {
            for (let k = 0; k < 4; k++) {
              const ph = frac(t * 1.4 + k / 4);
              const q = V3.add(V3.add(m.p, V3.mul(m.dir, 0.2 + ph * 0.6)), [0, ph * 0.4, 0]);
              fx.draw(quad, fx.billboard(q, 0.3 + ph * 0.6, k), { texture: T('puff'), blend: true, alpha: 0.35 * (1 - ph), tint: [0.8, 0.78, 0.8], noFog: true });
            }
          }
        });
      });
    }

    function drawRockets(list, t) {
      (list || []).forEach(rk => {
        const k = rk.k;
        if (k <= 0) return;
        const g = rand(rk.i + 5);
        const pos = (q) => {
          const p = V3.lerp(rk.from, rk.to, q);
          p[1] += S(q * PI) * 1.5 + S(q * 9 + rk.i) * 0.15;
          return p;
        };
        const head = Math.min(k, 1);
        const p = pos(head);
        if (k < 1) {
          const dir = V3.norm(V3.sub(pos(Math.min(1, head + 0.01)), p));
          const yaw = Math.atan2(dir[0], dir[2]), pitch = Math.asin(clamp(dir[1], -1, 1));
          fx.draw(rocketMesh, M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(yaw), M4.rotX(-pitch)), { spec: [0.5, 20], rim: 0.5 });
          glowAt(p, 0.9, 0.9, [1, 0.75, 0.4]);
        }
        const n = 26;
        for (let i = 0; i < n; i++) {
          const q = head - (i / n) * 0.55;
          if (q <= 0) break;
          const age = (head - q) * 2 + Math.max(0, k - 1) * 1.5;
          const sp = V3.add(pos(q), [(g() - 0.5) * 0.2 * age, age * 0.3, (g() - 0.5) * 0.2 * age]);
          const fade = clamp(1 - age * 0.55, 0, 1);
          if (fade <= 0) continue;
          fx.draw(quad, fx.billboard(sp, 0.35 + age * 0.5, i), { texture: T('puff'), blend: true, alpha: 0.55 * fade, tint: [0.92, 0.9, 0.94], noFog: true });
          if (i < 5 && k < 1) glowAt(sp, 0.5, 0.5 * fade, [1, 0.8, 0.5]);
        }
      });
    }

    function drawFires(list) {
      (list || []).forEach(f => {
        const g = rand(17);
        const n = f.n || 16;
        for (let i = 0; i < n; i++) {
          const ph = frac(f.u * 1.3 + i / n + g() * 0.3);
          const p = V3.add(f.p, [(g() - 0.5) * 0.9, ph * 1.1, (g() - 0.5) * 0.6]);
          const s = (f.s || 0.6) * (0.5 + S(ph * PI) * 0.8) * (1 - ph * 0.3);
          fx.draw(quad, fx.billboard(p, s, g() * 6), { texture: T('flame'), additive: true, alpha: 0.85 * (1 - ph * 0.6), noFog: true });
        }
        glowAt(V3.add(f.p, [0, 0.4, 0]), 2.4, 0.35, [1, 0.6, 0.3]);
      });
    }

    function drawSparks(list) {
      (list || []).forEach(sk => {
        const g = rand(23);
        for (let i = 0; i < 26; i++) {
          const ph = frac(sk.u * 0.9 + g());
          const p = V3.add(sk.p, [(g() - 0.5) * 1.6, -ph * 2.4 + g() * 0.3, (g() - 0.5) * 0.8]);
          glowAt(p, 0.07, 0.9 * (1 - ph), [1, 0.75, 0.35]);
        }
      });
    }

    function drawSkySparks(list) {
      (list || []).forEach(sk => {
        const g = rand(29);
        for (let i = 0; i < 6; i++) {
          const a = V3.add(sk.p, [g() * 2, g() * 1.2, 0]);
          const b = V3.add(a, [0.8 + g(), 0.3, 0]);
          fx.draw(quad, fx.streak(a, b, 0.05), { texture: T('glow'), additive: true, alpha: 0.6 * clamp(1 - sk.u, 0, 1), noFog: true, tint: [1, 0.85, 0.5] });
        }
      });
    }

    function drawBooms(list) {
      (list || []).forEach(f => {
        const g = rand(31);
        const k = clamp(f.u / 0.9, 0, 1);
        const R = (f.s || 1.5) * (0.35 + 0.85 * Math.sqrt(k));
        for (let i = 0; i < 18; i++) {
          const a = g() * PI * 2, e = (g() - 0.25) * 1.3;
          const p = V3.add(f.p, V3.mul([C(a) * C(e), S(e) + 0.25, S(a) * C(e)], R * (0.15 + g() * 0.6)));
          fx.draw(quad, fx.billboard(p, R * (0.7 + g() * 0.6) * (1 - k * 0.3), g() * 6), { texture: T('flame'), additive: true, alpha: (0.4 + g() * 0.35) * (1 - k), noFog: true });
        }
        glowAt(f.p, R * 3, 0.8 * (1 - k), [1, 0.7, 0.35]);
      });
    }

    function drawTracerLines(list) {
      (list || []).forEach(tl => fx.draw(quad, fx.streak(tl.a, tl.b, 0.04), { texture: T('glow'), additive: true, alpha: 0.7, noFog: true, tint: [1, 0.85, 0.5] }));
    }

    function drawActors(list) {
      (list || []).forEach(a => {
        const m = Fab.solve(a.cls, a.pose);
        Fab.draw(fx, FP, a, m, a.flat ? { flat: [0.06, 0.045, 0.06, 1] } : {});
      });
    }

    function drawEngineer(st, opts) {
      if (!st.eng) return;
      Eng.draw(fx, EP, { m: st.eng.m, face: st.face, hands: st.eng.hands, opts: opts || {} });
      if (st.eng.guitar) Props.drawGuitar(fx, PR, st.eng.guitar, T);
      if (st.eng.wrench) fx.draw(PR.wrench, st.eng.wrench, Props.METAL);
      if (st.eng.bottle && st.eng.bottle !== Script.PLACES.bottle) Props.drawBottle(fx, PR, st.eng.bottle, T);
    }

    function drawCampBack(st) {
      const P = Script.PLACES;
      Props.drawTruck(fx, PR, P.truck, T);
      drawSentries(st.camp.sentries.filter(s => !(st.shot === 'sentry1' && s.level === 1) && !(st.shot === 'sentry2' && s.level === 2)));
      fx.draw(PR.crate, P.crate, { texture: T('crate'), spec: [0.05, 5], rim: 0.4 });
      Props.drawCounter(fx, PR, P.counter, st.camp.counter, T);
      if (!st.eng || !st.eng.bottle || st.eng.bottle === P.bottle) Props.drawBottle(fx, PR, P.bottle, T);
      P.bottles.forEach(M => Props.drawBottle(fx, PR, M, T));
      fx.draw(PR.shotgun, P.shotgun, Props.METAL);
    }

    function scene3d(st, t) {
      fx.begin(st.env, st.camera);
      Sets.draw(fx, W, st.dress || []);
      if (st.dress && st.dress.includes('sign')) fx.draw(PR.sign, M4.chain(M4.translate(-4.4, 0, 9.4), M4.rotY(0.5)), { texture: T('skullSign'), spec: [0.05, 5], rim: 0.3 });
      drawCampBack(st);
      drawActors(st.actors);
      if (st.shot === 'sentry1' || st.shot === 'sentry2') {
        drawEngineer(st);
        Props.drawToolbox(fx, PR, Script.PLACES.toolbox, T);
        if (st.blur) fx.blurBack(st.blur);
        drawSentries(st.camp.sentries.filter(s => (st.shot === 'sentry1' && s.level === 1) || (st.shot === 'sentry2' && s.level === 2)));
      } else {
        if (st.blur) fx.blurBack(st.blur);
        Props.drawToolbox(fx, PR, Script.PLACES.toolbox, T);
        drawEngineer(st);
      }
      (st.gibs || []).forEach(gb => fx.draw(gib, M4.chain(M4.translate(gb.p[0], gb.p[1], gb.p[2]), M4.rotZ(gb.spin), M4.rotX(gb.spin * 0.7)), { spec: [0.1, 6], rim: 0.5 }));
      drawFires(st.fires);
      drawSparks(st.sparkRain);
      drawSkySparks(st.sparks);
      drawTracerLines(st.tracerLines);
      drawBooms(st.booms);
      drawRockets(st.rockets, t);
      drawFlashes(st, t);
      const full = (st.flashes || []).reduce((m, f) => Math.max(m, f.full || 0), 0);
      if (full > 0) {
        ov.begin();
        ov.rect(0, 0, 960, 540, { flat: [1, 0.97, 0.9, 1], alpha: clamp(full, 0, 0.85), blend: true });
      }
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

    function lineup(st) {
      const H = lineupParts();
      fx.begin(st.env, st.camera);
      HeavySets.draw(fx, H.MS, 'lineup', {});
      if (st.blur) fx.blurBack(st.blur);
      if (st.heavy) {
        Heavy.draw(fx, H.HP, { m: st.heavy.m, face: st.heavyFace, hands: st.heavy.hands, opts: {} });
        if (st.heavy.gun) HeavyProps.drawGun(fx, H.MP, st.heavy.gun.M, st.heavy.gun.spin);
      }
      drawActors(st.actors);
      drawEngineer(st);
      if (st.logo) drawLogo(st.logo);
    }

    function title(st) {
      r.clear([0, 0, 0]);
      ov.begin();
      const z = st.zoom || 1;
      const w = 960 * z, h = 540 * z;
      ov.rect((960 - w) / 2, (540 - h) / 2, w, h, { texture: T('title') });
      fx.begin(TITLE_ENV, { eye: [0, 0, 0], at: [0, 0, -1], fov: 30, near: 0.05, far: 20 }, null, true);
      const M = M4.chain(M4.translate(-0.75 * z, -0.54 * z, -3.5), M4.rotX(0.34), M4.rotY(0.08), M4.scale(0.84 * z, 0.84 * z, 0.84 * z), M4.translate(0, -0.17, -0.21));
      Props.drawToolbox(fx, PR, M, T, true);
      fx.draw(PR.wrench, M4.chain(M, M4.translate(-0.56, -0.04, 0.2), M4.rotY(-0.4), M4.rotZ(-0.36), M4.scale(1.25, 1.25, 1.25)), Props.METAL);
    }

    return {
      warm() {
        lineupParts();
        ['title', 'orange', 'tf2', 'tf2emblem', 'flash', 'glow', 'puff', 'flame', 'guitarTop', 'fretboard', 'toolFront', 'toolPaint', 'crate', 'digits', 'plate', 'label', 'truck', 'rust', 'lockers', 'metal', 'skullSign'].forEach(T);
        ['sky', 'mesas', 'dirt', 'cliff'].forEach(k => Art.tex(r, W.tex, k));
        Object.keys(Eng.HAND_POSES).forEach(p => ['L', 'R'].forEach(s => Eng.handMesh(EP, s, p)));
        const noop = { draw() {} };
        [70.5, 73.0, 75.5].forEach(t => (Script.stage(t).actors || []).forEach(a => Fab.draw(noop, FP, a, Fab.solve(a.cls, a.pose), {})));
      },
      render(t) {
        const st = Script.stage(t);
        if (st.kind === 'black') {
          r.clear([0, 0, 0]);
        } else if (st.kind === 'title') {
          title(st);
        } else if (st.kind === 'card') {
          r.clear([0, 0, 0]);
          ov.begin();
          ov.rect(0, 0, 960, 540, { texture: T(st.tex) });
          if (st.fade < 1) ov.rect(0, 0, 960, 540, { flat: [0, 0, 0, 1], alpha: 1 - st.fade, blend: true });
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
    audio: 'content/YouVid/Meet the Engineer.mp3',
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
