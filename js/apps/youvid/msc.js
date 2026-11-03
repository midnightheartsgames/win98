(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, frac } = K;
  const Fx = window.MeetFx;
  const Scout = window.MeetScout;
  const Heavy = window.MeetHeavy;
  const Props = window.MscProps;
  const Sets = window.MscSets;
  const Art = window.MscArt;
  const Script = window.MscScript;
  const Sol = window.MeetSoldier;
  const SolProps = window.MtsProps;
  const HeavyProps = window.MeetProps;
  const HeavySets = window.MeetSets;
  const MeetArt = window.MeetArt;
  const Fab = window.FabCast;

  const WEAPON_MAT = { spec: [0.25, 14], rim: 0.5 };
  const INSIDE = ['room', 'door'];

  function create(r) {
    const fx = Fx.create(r);
    const SP = Scout.build(r, fx);
    const PR = Props.build(r);
    const W = Sets.build(r);
    const FP = Fab.build(r);
    const ov = K.overlay(r, 960, 540);
    const tex = {};
    const T = (k) => Art.tex(r, tex, k);
    const quad = ov.quad;
    let blu = null, team = null, sol = null;
    const bluHeavy = () => (blu || (blu = Heavy.build(r, fx, { team: 'blu' })));
    const lineupParts = () => (team || (team = { HP: Heavy.build(r, fx), MP: HeavyProps.build(r), MS: HeavySets.build(r) }));
    const soldierParts = () => (sol || (sol = { P: Sol.build(r, fx), PR: SolProps.build(r) }));
    const logoQuad = K.mesh(r, b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], rgb(0xffffff, 1), [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));
    const doorMesh = K.mesh(r, b => b.quad([-2.42, 0, 0], [2.42, 0, 0], [2.42, 1, 0], [-2.42, 1, 0], 0xffffff, [[0, 0], [2.5, 0], [2.5, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));
    const doorEdge = K.mesh(r, b => b.box(4.84, 0.1, 0.14, 0xc4c4c0));
    const cables = K.mesh(r, b => [0.42, 1.05, 1.6].forEach(y => b.at(0, y, -0.06, h => h.box(4.8, 0.022, 0.022, rgb(0xc8c8c8, 0.85)))));

    function glowAt(p, s, a, tint) {
      fx.draw(quad, fx.billboard(p, s, 0), { texture: T('glow'), additive: true, alpha: a, noFog: true, tint: tint || [1, 0.8, 0.45] });
    }

    function drawDoor(y) {
      if (y >= 2.98) return;
      const h = 3.0 - y;
      fx.draw(doorMesh, M4.chain(M4.translate(0, y, -0.03), M4.scale(1, h, 1)), { texture: T('shutter'), spec: [0.2, 10], rim: 0.3, backDark: true });
      fx.draw(doorEdge, M4.translate(0, y + 0.04, -0.03), { spec: [0.4, 16], rim: 0.6 });
      fx.draw(cables, M4.translate(0, y, 0), { spec: [0.5, 20], rim: 0.8 });
    }

    const SHADOW_DIR = V3.norm([-0.3, 0.02, -1]);

    function wallShadow(z0) {
      const a = SHADOW_DIR[0] / SHADOW_DIR[2], b = SHADOW_DIR[1] / SHADOW_DIR[2];
      return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, -a, -b, 0, 0, a * z0, b * z0, z0, 1]);
    }

    function drawShadow(st) {
      if (!st.scout || st.set !== 'locker') return;
      const gl = fx.gl;
      const flat = { flat: [0.5, 0.5, 0.56, 1] };
      const proxy = { draw: (mesh, M) => fx.draw(mesh, M, flat) };
      gl.enable(gl.STENCIL_TEST);
      gl.clear(gl.STENCIL_BUFFER_BIT);
      gl.stencilFunc(gl.EQUAL, 0, 0xff);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.DST_COLOR, gl.ZERO);
      gl.depthMask(false);
      Scout.draw(proxy, SP, { m: st.scout.m, face: st.face, hands: st.scout.hands, opts: { pre: wallShadow(0.035) } });
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.disable(gl.STENCIL_TEST);
    }

    function drawScout(st, opts) {
      const s = st.scout;
      if (!s) return;
      Scout.draw(fx, SP, { m: s.m, face: st.face, hands: s.hands, opts: opts || {} });
      if (s.gun) Props.drawScatter(fx, PR, s.gun);
      if (s.bat) Props.drawBat(fx, PR, s.bat);
    }

    function drawHeavy(st) {
      if (!st.heavy) return;
      const P = st.kind === 'lineup' ? lineupParts().HP : bluHeavy();
      Heavy.draw(fx, P, { m: st.heavy.m, face: st.heavyFace, hands: st.heavy.hands, opts: {} });
      if (st.heavy.gun) HeavyProps.drawGun(fx, lineupParts().MP, st.heavy.gun.M, st.heavy.gun.spin);
    }

    function drawSoldier(st) {
      if (!st.sol) return;
      const S0 = soldierParts();
      const tint = st.solTint ? { tint: st.solTint } : {};
      Sol.draw(fx, S0.P, { m: st.sol.m, face: st.solFace || {}, hands: st.sol.hands, opts: tint });
      fx.draw(S0.PR.launcher, st.sol.launcher, Object.assign({}, WEAPON_MAT, tint));
    }

    function drawActors(list) {
      (list || []).forEach(a => {
        const m = Fab.solve(a.cls, a.pose);
        Fab.draw(fx, FP, a, m, {});
      });
    }

    function drawProps(list) {
      (list || []).forEach(p => {
        if (p.kind === 'sentry') Props.drawSentry(fx, PR, p.M, p.st, p.tint);
        else if (p.kind === 'sandwich') Props.drawSandwich(fx, PR, p.M);
        else if (p.kind === 'bat') Props.drawBat(fx, PR, p.M);
      });
    }

    function drawFx(st, t) {
      (st.flashes || []).forEach((f, i) => {
        fx.draw(quad, fx.billboard(f.p, f.s * (0.8 + frac(t * 13 + i) * 0.4), t * 21 + i), { texture: T('flash'), additive: true, alpha: 1, noFog: true });
        glowAt(f.p, f.s * 2.4, 0.6);
      });
      (st.tracers || []).forEach(tl => fx.draw(quad, fx.streak(tl.a, tl.b, 0.035), { texture: T('glow'), additive: true, alpha: 0.75, noFog: true, tint: [1, 0.85, 0.5] }));
      (st.sparks || []).forEach(sk => {
        const g = rand(41);
        for (let i = 0; i < 18; i++) {
          const d = V3.norm([g() - 0.5, g() * 0.8, g() - 0.5]);
          const p = V3.add(sk.p, V3.add(V3.mul(d, sk.u * (0.4 + g() * 0.8)), [0, -sk.u * sk.u * 0.8, 0]));
          glowAt(p, 0.06, 1 - sk.u, [1, 0.75, 0.35]);
        }
        glowAt(sk.p, 0.6, 0.8 * (1 - sk.u));
      });
      (st.dust || []).forEach(d => {
        const k = d.u;
        fx.draw(quad, fx.billboard([d.p[0], d.p[1] + k * 0.35, d.p[2]], 0.18 + k * 0.5, k * 3), { texture: T('puff'), blend: true, alpha: 0.6 * (1 - k), tint: [0.62, 0.6, 0.56], noFog: true });
      });
      (st.booms || []).forEach(f => {
        const g = rand(31);
        const k = clamp(f.u / 0.9, 0, 1);
        const R = (f.s || 1.5) * (0.35 + 0.85 * Math.sqrt(k));
        for (let i = 0; i < 20; i++) {
          const a = g() * PI * 2, e = (g() - 0.25) * 1.3;
          const p = V3.add(f.p, V3.mul([C(a) * C(e), S(e) + 0.25, S(a) * C(e)], R * (0.15 + g() * 0.6)));
          fx.draw(quad, fx.billboard(p, R * (0.7 + g() * 0.6) * (1 - k * 0.3), g() * 6), { texture: T('flame'), additive: true, alpha: (0.4 + g() * 0.35) * (1 - k), noFog: true });
        }
        for (let i = 0; i < 10; i++) {
          const a = g() * PI * 2;
          const p = V3.add(f.p, [C(a) * R * 0.7, R * 0.3 + k * R * 1.2, S(a) * R * 0.7]);
          fx.draw(quad, fx.billboard(p, R * (0.8 + k * 0.9), g() * 6), { texture: T('puff'), tint: [0.32, 0.29, 0.26], blend: true, alpha: 0.55 * Math.min(1, k * 3) * (1 - k * 0.7), noFog: true });
        }
        glowAt(f.p, R * 3, 0.8 * (1 - k), [1, 0.7, 0.35]);
      });
      (st.rockets || []).forEach(rk => {
        const k = rk.k;
        if (k <= 0) return;
        const g = rand(rk.i + 5);
        const pos = (q) => V3.lerp(rk.from, rk.to, q);
        const head = Math.min(k, 1);
        const p = pos(head);
        if (k < 1) {
          const dir = V3.norm(V3.sub(rk.to, rk.from));
          const yaw = Math.atan2(dir[0], dir[2]), pitch = Math.asin(clamp(dir[1], -1, 1));
          fx.draw(PR.rocket, M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotY(yaw), M4.rotX(-pitch)), { spec: [0.5, 20], rim: 0.5 });
          glowAt(p, 0.9, 0.9, [1, 0.75, 0.4]);
        }
        for (let i = 0; i < 24; i++) {
          const q = head - (i / 24) * 0.6;
          if (q <= 0) break;
          const age = (head - q) * 2 + Math.max(0, k - 1) * 1.5;
          const sp = V3.add(pos(q), [(g() - 0.5) * 0.2 * age, age * 0.3, (g() - 0.5) * 0.2 * age]);
          const fade = clamp(1 - age * 0.55, 0, 1);
          if (fade <= 0) continue;
          fx.draw(quad, fx.billboard(sp, 0.3 + age * 0.5, i), { texture: T('puff'), blend: true, alpha: 0.55 * fade, tint: [0.92, 0.9, 0.94], noFog: true });
          if (i < 5 && k < 1) glowAt(sp, 0.45, 0.5 * fade, [1, 0.8, 0.5]);
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

    function lineup(st) {
      const H = lineupParts();
      fx.begin(st.env, st.camera);
      HeavySets.draw(fx, H.MS, 'lineup', {});
      if (st.blur) fx.blurBack(st.blur);
      drawHeavy(st);
      drawActors(st.actors);
      drawScout(st);
      if (st.logo) drawLogo(st.logo);
    }

    function scene3d(st, t) {
      if (st.inside) {
        fx.begin(st.envOut, st.camera);
        Sets.draw(fx, W, st.set, T, { skip: INSIDE });
        fx.begin(st.env, st.camera, null, true);
        Sets.draw(fx, W, st.set, T, { only: INSIDE });
      } else {
        fx.begin(st.env, st.camera);
        Sets.draw(fx, W, st.set, T, {});
      }
      if (st.door !== undefined) drawDoor(st.door);
      drawShadow(st);
      if (st.blurScout) drawScout(st);
      if (st.blur) fx.blurBack(st.blur);
      drawProps(st.props);
      drawActors(st.actors);
      drawSoldier(st);
      drawHeavy(st);
      if (!st.blurScout) drawScout(st);
      drawFx(st, t);
      const dark = Math.max(st.dark || 0, st.fade || 0);
      if (dark > 0) {
        ov.begin();
        ov.rect(0, 0, 960, 540, { flat: [0, 0, 0, 1], alpha: clamp(dark, 0, 1), blend: true });
      }
    }

    return {
      warm() {
        bluHeavy();
        lineupParts();
        soldierParts();
        ['poster', 'wallCream', 'brick', 'brickWarm', 'concrete', 'plaster', 'shutter', 'corrugated', 'container', 'fence', 'ties', 'lockers', 'watchStep', 'controlPoint',
          'redLogo', 'retail', 'boxes', 'valve', 'sky', 'flash', 'glow', 'puff', 'flame', 'tf2', 'tf2emblem'].forEach(T);
        Object.keys(Scout.HAND_POSES).forEach(p => ['L', 'R'].forEach(s => Scout.handMesh(SP, s, p)));
        const noop = { draw() {} };
        [8.5, 10.5, 13.9, 17.8, 26.5, 28.5, 72.0].forEach(t => (Script.stage(t).actors || []).forEach(a => Fab.draw(noop, FP, a, Fab.solve(a.cls, a.pose), {})));
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
    audio: 'content/YouVid/Meet the Scout.mp3',
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
