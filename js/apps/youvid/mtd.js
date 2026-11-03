(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, frac } = K;
  const Fx = window.MeetFx;
  const Demo = window.MeetDemoman;
  const Props = window.DemoProps;
  const Sets = window.DemoSets;
  const Art = window.DemoArt;
  const Script = window.DemoScript;
  const Heavy = window.MeetHeavy;
  const HeavyProps = window.MeetProps;
  const HeavySets = window.MeetSets;
  const MeetArt = window.MeetArt;
  const EngProps = window.EngProps;
  const EngArt = window.EngArt;
  const Fab = window.FabCast;

  const TITLE_ENV = {
    key: { dir: [0.45, -0.75, -0.5], col: [1.05, 0.98, 0.92] },
    ambTop: [0.38, 0.38, 0.4], ambBot: [0.18, 0.16, 0.15], warp: [0.6, 0.34, 0.3], rim: [0.38, 0.38, 0.4], rimPow: 3,
    points: [], fogCol: [0, 0, 0], fog: [500, 900], clear: [0, 0, 0], grade: [1, 1, 1, 0], vig: 0
  };

  function create(r) {
    const fx = Fx.create(r);
    const DP = Demo.build(r, fx);
    const PR = Props.build(r);
    const W = Sets.build(r);
    const FP = Fab.build(r);
    const EP = EngProps.build(r);
    let blu = null;
    let lineupP = null;
    const bluParts = () => {
      if (!blu) blu = { HP: Heavy.build(r, fx, { team: 'blu' }), MP: HeavyProps.build(r) };
      return blu;
    };
    const lineupParts = () => {
      if (!lineupP) lineupP = { HP: Heavy.build(r, fx), MP: HeavyProps.build(r), MS: HeavySets.build(r) };
      return lineupP;
    };
    const ov = K.overlay(r, 960, 540);
    const tex = {};
    const engTex = {};
    const T = (k) => Art.tex(r, tex, k);
    const TE = (k) => EngArt.tex(r, engTex, k);
    const quad = ov.quad;
    const chunk = K.mesh(r, b => b.box(1, 1, 1, 0xffffff));
    const logoQuad = K.mesh(r, b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], rgb(0xffffff, 1), [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));

    function glowAt(p, s, a, tint) {
      fx.draw(quad, fx.billboard(p, s, 0), { texture: T('glow'), additive: true, alpha: a, noFog: true, tint: tint || [1, 0.8, 0.45] });
    }

    function drawGun(gun) {
      if (!gun) return;
      if (gun.kind === 'sticky') Props.drawSticky(fx, PR, gun.M);
      else Props.drawLauncher(fx, PR, gun.M);
    }

    function drawDemo(st, opts) {
      if (!st.demo) return;
      Demo.draw(fx, DP, { m: st.demo.m, face: st.face, hands: st.demo.hands, opts: opts || {} });
      drawGun(st.demo.gun);
    }

    function drawBottle(st) {
      if (st.bottle) Props.drawBottle(fx, PR, st.bottle.M, T);
    }

    function drawActors(list, opts) {
      (list || []).forEach(a => {
        const m = Fab.solve(a.cls, a.pose);
        Fab.draw(fx, FP, a, m, Object.assign({}, a.flat ? { flat: [0.06, 0.045, 0.06, 1] } : {}, opts || {}));
      });
    }

    function drawBluHeavy(H) {
      if (!H) return;
      const B = bluParts();
      Heavy.draw(fx, B.HP, { m: H.m, face: H.face, hands: H.hands, opts: {} });
      if (H.gun) HeavyProps.drawGun(fx, B.MP, H.gun.M, H.gun.spin || 0);
    }

    function drawSentry(s, t) {
      if (!s) return;
      const M = M4.translate(s.at[0], s.at[1], s.at[2]);
      if (s.broken) {
        const tilt = M4.chain(M, M4.rotZ(0.5), M4.rotX(-0.3));
        EngProps.drawSentry(fx, EP, 2, M4.chain(tilt, M4.translate(0, -0.25, 0)), { yaw: s.yaw, pitch: -0.6, team: 'blu', tint: [0.35, 0.33, 0.33] }, TE);
        return;
      }
      EngProps.drawSentry(fx, EP, 2, M, s, TE);
    }

    function drawSentryFire(st, t) {
      const s = st.sentry, f = st.sentryFire;
      if (!s || !f) return;
      const muzzles = EngProps.sentryMuzzles(2, M4.translate(s.at[0], s.at[1], s.at[2]), s);
      muzzles.forEach((m, i) => {
        const fl = frac(t * 13 + i * 0.5);
        const p = V3.add(m.p, V3.mul(m.dir, 0.1));
        fx.draw(quad, fx.billboard(p, f.s * (0.7 + fl * 0.5), t * 21 + i), { texture: T('flash'), additive: true, alpha: 1, noFog: true });
        glowAt(p, f.s * 2.2, 0.55);
        if (f.tracers) {
          for (let k = 0; k < 3; k++) {
            const ph = frac(t * 3.2 + k / 3 + i * 0.17);
            const a = V3.add(m.p, V3.mul(m.dir, 0.4 + ph * 16));
            const b = V3.add(a, V3.mul(m.dir, 1.8));
            fx.draw(quad, fx.streak(a, b, 0.05), { texture: T('glow'), additive: true, alpha: 0.85, noFog: true, tint: [1, 0.85, 0.45] });
          }
        }
      });
    }

    function drawPipes(list, t) {
      (list || []).forEach(p => {
        fx.draw(PR.pipe, p.M, Props.METAL);
        if (p.glow) {
          const c = M4.point(p.M, [0, 0.06, 0]), c2 = M4.point(p.M, [0, -0.06, 0]);
          glowAt(c, 0.12, 0.5 * p.glow, [1, 0.3, 0.2]);
          glowAt(c2, 0.12, 0.5 * p.glow, [1, 0.3, 0.2]);
        }
      });
    }

    function drawStickies(list, t) {
      (list || []).forEach((s, i) => {
        fx.draw(PR.bomb, s.M, { spec: [0.4, 18], rim: 0.5 });
        if (s.glow) glowAt(M4.point(s.M, [0, 0, 0.03]), 0.2, 0.35 * s.glow * (0.7 + 0.3 * S(t * 6 + i)), [1, 0.25, 0.15]);
      });
    }

    function cloudAt(p, size, spin, alpha, tint) {
      fx.draw(quad, fx.billboard(p, size, spin), { texture: T('cloud'), blend: true, alpha, tint, noFog: true, rim: 0, spec: [0, 1] });
    }

    function fireAt(p, size, spin, alpha, tint) {
      fx.draw(quad, fx.billboard(p, size, spin), { texture: T('fireCloud'), blend: alpha < 1, alpha, tint: tint || [1, 1, 1], noFog: true, rim: 0, spec: [0, 1] });
    }

    function drawTrails(list, t) {
      (list || []).forEach(tr => {
        const k = tr.k;
        if (k <= 0) return;
        const g = rand(tr.i + 11);
        const pos = (q) => {
          const p = V3.lerp(tr.from, tr.to, q);
          p[1] += S(q * PI) * (tr.h || 1.5);
          return p;
        };
        const head = Math.min(k, 1);
        const p = pos(head);
        if (k < 1) {
          const M = M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotZ(t * 14 + tr.i), M4.rotX(t * 9 + tr.i));
          fx.draw(PR.pipe, M, Props.METAL);
          glowAt(p, 0.3, 0.7, [1, 0.35, 0.2]);
        }
        const n = 16;
        for (let i = 0; i < n; i++) {
          const q = head - (i / n) * 0.45;
          if (q <= 0) break;
          const age = (head - q) * 2 + Math.max(0, k - 1) * 1.5;
          const sp = V3.add(pos(q), [(g() - 0.5) * 0.12 * age, age * 0.15, (g() - 0.5) * 0.12 * age]);
          const fade = clamp(1 - age * 0.6, 0, 1);
          if (fade <= 0) continue;
          cloudAt(sp, 0.16 + age * 0.3, i * 1.3, 0.55 * fade, [0.86, 0.85, 0.86]);
        }
      });
    }

    function drawFires(list, t) {
      (list || []).forEach((f, j) => {
        const g = rand(17 + j);
        const n = f.n || 16;
        for (let i = 0; i < n; i++) {
          const ph = frac(f.u * 1.3 + i / n + g() * 0.3);
          const p = V3.add(f.p, [(g() - 0.5) * (f.w || 1.2), ph * 1.4 * (f.s || 1), (g() - 0.5) * 0.8]);
          const s = (f.s || 0.6) * (0.55 + S(ph * PI) * 0.7) * (1 - ph * 0.3);
          const hot = 1 - ph;
          fireAt(p, s, g() * 6 + (t || 0) * 0.5, clamp(0.95 - ph * 0.5, 0, 1), [1, lerp(0.55, 1, hot), lerp(0.4, 1, hot * hot)]);
        }
        glowAt(V3.add(f.p, [0, 0.5, 0]), 2.4 * (f.s || 1), 0.25, [1, 0.55, 0.25]);
      });
    }

    function drawBooms(list) {
      (list || []).forEach((f, j) => {
        const g = rand(31 + j);
        const k = clamp(f.u, 0, 1);
        const R = (f.s || 1.5) * (0.4 + 0.75 * Math.sqrt(k));
        const fire = clamp(1 - k * 1.5, 0, 1);
        const smoke = clamp((k - 0.15) * 2, 0, 1) * (1.15 - k);
        for (let i = 0; i < 14; i++) {
          const a = g() * PI * 2, e = (g() - 0.25) * 1.3;
          const off = V3.mul([C(a) * C(e), S(e) + 0.3, S(a) * C(e)], R * (0.12 + g() * 0.5));
          const sz = R * (0.6 + g() * 0.5);
          if (smoke > 0.02) cloudAt(V3.add(f.p, V3.add(off, [0, k * R * 0.5, 0])), sz * (1.1 + k * 0.5), g() * 6, 0.85 * smoke, [0.28, 0.25, 0.24]);
        }
        for (let i = 0; i < 12; i++) {
          const a = g() * PI * 2, e = (g() - 0.2) * 1.2;
          const off = V3.mul([C(a) * C(e), S(e) + 0.25, S(a) * C(e)], R * (0.05 + g() * 0.42) * (0.6 + k * 0.5));
          if (fire > 0.02) fireAt(V3.add(f.p, off), R * (0.55 + g() * 0.5) * (1 - k * 0.35), g() * 6, clamp(fire * 1.2, 0, 1), [1, lerp(0.55, 1, fire), lerp(0.35, 1, fire * fire)]);
        }
        glowAt(f.p, R * 2.6, 0.55 * fire, [1, 0.6, 0.3]);
      });
    }

    function drawSmokes(list) {
      (list || []).forEach((sm, j) => {
        const g = rand(41 + j);
        const n = sm.n || 10;
        for (let i = 0; i < n; i++) {
          const ph = clamp(sm.u + g() * 0.3, 0, 1.4);
          const p = V3.add(sm.p, [(g() - 0.5) * sm.s * (0.4 + ph), ph * sm.s * 0.5 + g() * 0.5, (g() - 0.5) * sm.s * 0.6]);
          cloudAt(p, sm.s * (0.5 + ph * 0.7), g() * 6, 0.6 * clamp(1.4 - ph, 0, 1), sm.tint || [0.5, 0.46, 0.43]);
        }
      });
    }

    function drawDebris(list) {
      (list || []).forEach(d => {
        const u = d.u;
        if (u <= 0) return;
        const p = V3.add(d.p, V3.mul(d.v, u));
        if (d.grav) p[1] -= 4.9 * u * u;
        if (p[1] < -0.2) return;
        const g = rand(d.seed);
        const M = M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotX(u * 7 + g() * 6), M4.rotZ(u * 5 + g() * 6), M4.scale(d.s * (1 + g()), d.s * (0.6 + g() * 0.6), d.s));
        fx.draw(chunk, M, { tint: g() < 0.5 ? [0.32, 0.25, 0.2] : [0.5, 0.42, 0.34], spec: [0.05, 4], rim: 0.3 });
      });
    }

    function drawRays(list) {
      (list || []).forEach(rr => {
        const g = rand(61);
        for (let i = 0; i < rr.n; i++) {
          const a = g() * PI * 2, e = (g() - 0.4) * 1.4;
          const dir = [C(a) * C(e), S(e), S(a) * C(e)];
          const len = rr.len * (0.4 + g() * 0.8);
          const a0 = V3.add(rr.p, V3.mul(dir, len * (0.2 + rr.u * 0.4)));
          const b0 = V3.add(a0, V3.mul(dir, len * 0.5));
          fx.draw(quad, fx.streak(a0, b0, 0.035), { texture: T('glow'), additive: true, alpha: 0.8, noFog: true, tint: [1, 0.85, 0.4] });
        }
      });
    }

    function drawFlashes(list, t) {
      (list || []).forEach(f => {
        const p = V3.add(f.p, V3.mul(f.dir, 0.08));
        fx.draw(quad, fx.billboard(p, f.s, t * 23), { texture: T('flash'), additive: true, alpha: 1, noFog: true });
        glowAt(p, f.s * 2.5, 0.6);
      });
    }

    function drawGibs(list) {
      (list || []).forEach(gb => {
        const M = M4.chain(M4.translate(gb.p[0], gb.p[1], gb.p[2]), M4.rotZ(gb.spin), M4.rotX(gb.spin * 0.7));
        fx.draw(PR.gibs[gb.kind % PR.gibs.length], M, { spec: [0.1, 6], rim: 0.5 });
        glowAt(gb.p, 0.4, 0.25, [1, 0.35, 0.2]);
      });
    }

    function drawEmbers(list, t) {
      (list || []).forEach(e => {
        const g = rand(71);
        for (let i = 0; i < e.n; i++) {
          const ph = frac(e.u * 0.25 + g());
          const p = V3.add(e.p, [(g() - 0.5) * 8 + S(t + i) * 0.3, -ph * 7 + g() * 2, (g() - 0.5) * 3]);
          glowAt(p, 0.12 + g() * 0.1, 0.8 * (1 - ph), [1, 0.4, 0.2]);
        }
      });
    }

    function drawPOV(st) {
      const pov = st.pov;
      if (!pov) return;
      Props.drawSticky(fx, PR, pov.M);
      const h = pov.hand;
      const HM = Demo.handBasis(h.target, h.fingers, h.palm);
      fx.draw(Demo.handMesh(DP, 'R', 'grip'), HM, { spec: [0.24, 10], rim: 1.15 });
      const elbow = V3.add(V3.sub(h.target, V3.mul(h.fingers, 0.26)), [0.04, -0.12, 0]);
      const y = V3.norm(V3.sub(elbow, h.target));
      let z = V3.sub([0, 1, 0], V3.mul(y, y[1]));
      z = V3.norm(z);
      const x = V3.cross(y, z);
      const FM = new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, elbow[0], elbow[1], elbow[2], 1]);
      fx.draw(DP.fore, FM, { spec: [0.05, 5], rim: 0.85 });
    }

    function fullFlash(a, col) {
      if (a <= 0) return;
      ov.begin();
      ov.rect(0, 0, 960, 540, { flat: col || [1, 0.96, 0.85, 1], alpha: clamp(a, 0, 0.95), blend: true });
    }

    function scene3d(st, t) {
      fx.begin(st.env, st.camera);
      Sets.draw(fx, W, st.set, { sky: st.sky, glowCol: st.glowWall, tints: st.tints });
      drawActors(st.actors);
      drawSentry(st.sentry, t);
      if (st.blur) fx.blurBack(st.blur);
      drawDemo(st);
      drawBottle(st);
      drawBluHeavy(st.bluHeavy);
      if (st.bench) Props.drawBench(fx, PR, M4.translate(0, 0, 0.6), T);
      drawPipes(st.pipes, t);
      drawStickies(st.stickies, t);
      drawPOV(st);
      drawGibs(st.gibs);
      drawDebris(st.debris);
      drawFires(st.fires, t);
      drawSmokes(st.smokes);
      drawBooms(st.booms);
      drawRays(st.rays);
      drawTrails(st.trails, t);
      drawSentryFire(st, t);
      drawFlashes(st.flashes, t);
      drawEmbers(st.embers, t);
      if (st.glow) fx.glow(st.glow, 0.6);
      fullFlash(st.fullFlash || 0);
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
      drawDemo(st);
      if (st.logo) drawLogo(st.logo);
    }

    function title(st) {
      r.clear([0, 0, 0]);
      ov.begin();
      const z = st.zoom || 1;
      const w = 960 * z, h = 540 * z;
      ov.rect((960 - w) / 2, (540 - h) / 2, w, h, { texture: T('title') });
      fx.begin(TITLE_ENV, { eye: [0, 0, 0], at: [0, 0, -1], fov: 30, near: 0.05, far: 20 }, null, true);
      const M = M4.chain(M4.translate(-0.74 * z, -0.45 * z, -3.5), M4.rotX(0.28), M4.rotY(0.32), M4.scale(1.2 * z, 1.2 * z, 1.2 * z), M4.translate(0, -0.2, 0));
      Props.drawCrate(fx, PR, M, T, true);
      Props.drawBottle(fx, PR, M4.chain(M, M4.translate(-0.2, Props.CRATE.h + 0.024, -0.1)), T);
      Props.drawBottle(fx, PR, M4.chain(M, M4.translate(-0.05, Props.CRATE.h + 0.075, 0.02), M4.rotY(-0.5), M4.rotZ(PI / 2 + 0.05)), T);
      Props.drawBottle(fx, PR, M4.chain(M, M4.translate(0.28, 0.05, 0.36), M4.rotY(1.2), M4.rotZ(-PI / 2 - 0.05)), T);
    }

    return {
      warm() {
        lineupParts();
        bluParts();
        ['title', 'orange', 'tf2', 'tf2emblem', 'flash', 'glow', 'cloud', 'fireCloud', 'flame', 'label', 'crateWood', 'crateLabel', 'blueprint', 'darkWood', 'sky'].forEach(T);
        Sets.TEX.forEach(T);
        TE('metal');
        Object.keys(Demo.HAND_POSES).forEach(p => ['L', 'R'].forEach(s => Demo.handMesh(DP, s, p)));
        const noop = { draw() {} };
        [64.185 + 3.2, 68.9, 73.5, 78.4, 83.5].forEach(t => (Script.stage(t).actors || []).forEach(a => Fab.draw(noop, FP, a, Fab.solve(a.cls, a.pose), {})));
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
        } else if (st.kind === 'flash') {
          r.clear([1, 0.97, 0.88]);
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
    audio: 'content/YouVid/Meet the Demoman.mp3',
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
