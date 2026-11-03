(function () {
  const { M4, V3, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, frac } = K;
  const Fx = window.MeetFx;
  const Medic = window.MeetMedic;
  const Heavy = window.MeetHeavy;
  const Scout = window.MeetScout;
  const Demo = window.MeetDemoman;
  const Eng = window.MeetEngineer;
  const Sol = window.MeetSoldier;
  const Props = window.MedProps;
  const Sets = window.MedSets;
  const Art = window.MedArt;
  const Script = window.MedScript;
  const MeetArt = window.MeetArt;
  const HeavyProps = window.MeetProps;
  const HeavySets = window.MeetSets;
  const DemoProps = window.DemoProps;
  const EngProps = window.EngProps;
  const EngArt = window.EngArt;
  const DemoArt = window.DemoArt;
  const SolProps = window.MtsProps;
  const Fab = window.FabCast;

  const WEAPON_MAT = { spec: [0.4, 20], rim: 0.6 };
  const METAL_SKIN = { tint: [1.25, 0.22, 0.18], spec: [1.3, 26], rim: 1.8 };

  function create(r) {
    const fx = Fx.create(r);
    const gl = fx.gl;
    const MP = Medic.build(r, fx);
    const PR = Props.build(r);
    const W = Sets.build(r);
    const FP = Fab.build(r);
    const ov = K.overlay(r, 960, 540);
    const tex = {}, texE = {}, texD = {};
    const T = (k) => Art.tex(r, tex, k);
    const TE = (k) => EngArt.tex(r, texE, k);
    const TD = (k) => DemoArt.tex(r, texD, k);
    const quad = ov.quad;
    const lazy = {};
    const once = (k, fn) => (lazy[k] || (lazy[k] = fn()));
    const heavyRed = () => once('heavyRed', () => Heavy.build(r, fx));
    const heavyBlu = () => once('heavyBlu', () => Heavy.build(r, fx, { team: 'blu' }));
    const heavyProps = () => once('heavyProps', () => HeavyProps.build(r));
    const heavySets = () => once('heavySets', () => HeavySets.build(r));
    const scoutP = () => once('scout', () => Scout.build(r, fx));
    const demoP = () => once('demo', () => Demo.build(r, fx));
    const demoProps = () => once('demoProps', () => DemoProps.build(r));
    const engP = () => once('eng', () => Eng.build(r, fx));
    const engProps = () => once('engProps', () => EngProps.build(r));
    const solP = () => once('sol', () => Sol.build(r, fx));
    const solProps = () => once('solProps', () => SolProps.build(r));
    const logoQuad = K.mesh(r, b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));

    function glowAt(p, s, a, tint) {
      fx.draw(quad, fx.billboard(p, s, 0), { texture: T('glow'), additive: true, alpha: a, noFog: true, tint: tint || [1, 0.8, 0.45] });
    }

    function metalProxy(k) {
      const mat = {
        tint: [lerp(1, METAL_SKIN.tint[0], k), lerp(1, METAL_SKIN.tint[1], k), lerp(1, METAL_SKIN.tint[2], k)],
        spec: [lerp(0.2, METAL_SKIN.spec[0], k), METAL_SKIN.spec[1]], rim: lerp(0.9, METAL_SKIN.rim, k)
      };
      return { draw: (mesh, M, o) => fx.draw(mesh, M, Object.assign({}, o, mat)), gl: fx.gl };
    }

    function drawHeavy(h) {
      if (!h) return;
      const P = h.team === 'blu' ? heavyBlu() : heavyRed();
      const base = h.metal > 0 ? metalProxy(h.metal) : fx;
      const target = h.noBand ? { draw: (mesh, M, o) => { if (mesh !== P.band) base.draw(mesh, M, o); }, gl: fx.gl } : base;
      Heavy.draw(target, P, { m: h.m, face: h.face || {}, hands: h.hands, opts: h.tint ? { tint: h.tint } : {} });
      if (h.gun) HeavyProps.drawGun(target, heavyProps(), h.gun.M, h.gun.spin || 0, h.metal > 0 ? {} : undefined);
      if (h.cavity) fx.draw(PR.rim, h.m.chest, { spec: [0.6, 30], rim: 0.6 });
      if (h.eyes > 0) {
        Heavy.eyeInfo().forEach(f => fx.draw(quad, fx.billboard(V3.add(M4.point(h.m.head, f.c), V3.mul(fx.basis().view, -0.03)), 0.12 * h.eyes, 0), { texture: T('glow'), additive: true, alpha: h.eyes, noFog: true, noDepth: true, tint: [1, 0.85, 0.3] }));
      }
    }

    function drawMedic(md) {
      if (!md) return;
      Medic.draw(fx, MP, { m: md.m, face: md.face, hands: md.hands, outfit: md.outfit, blood: md.blood, flare: md.flare, opts: md.opts || {} });
      if (md.pack) Props.drawPack(fx, PR, md.m.chest, md.pack, T);
      if (md.gun) fx.draw(PR.medigun, md.gun, WEAPON_MAT);
      if (md.saw) fx.draw(PR.saw, md.saw, WEAPON_MAT);
      if (md.crack) {
        Medic.lensCenters(md.m).forEach(p => fx.draw(quad, fx.billboard(p, 0.05, 0.4), { texture: T('crack'), blend: true, alpha: md.crack, noFog: true }));
      }
    }

    function drawScout(sc) {
      if (!sc) return;
      Scout.draw(fx, scoutP(), { m: sc.m, face: sc.face, hands: sc.hands, opts: sc.opts || {} });
    }

    function drawDemo(dm) {
      if (!dm) return;
      Demo.draw(fx, demoP(), { m: dm.m, face: dm.face, hands: dm.hands, opts: dm.opts || {} });
      if (dm.launcher) DemoProps.drawLauncher(fx, demoProps(), dm.launcher);
      if (dm.bottle) DemoProps.drawBottle(fx, demoProps(), dm.bottle, TD);
    }

    function drawEngineer(en) {
      if (!en) return;
      Eng.draw(fx, engP(), { m: en.m, face: en.face || {}, hands: en.hands, opts: en.opts || {} });
      if (en.guitar) EngProps.drawGuitar(fx, engProps(), en.guitar, TE);
    }

    function drawSoldier(so) {
      if (!so) return;
      Sol.draw(fx, solP(), { m: so.m, face: so.face || {}, hands: so.hands, opts: so.opts || {} });
      if (so.launcher) fx.draw(solProps().launcher, so.launcher, WEAPON_MAT);
    }

    function drawActors(list, opts) {
      (list || []).forEach(a => {
        const m = Fab.solve(a.cls, a.pose);
        Fab.draw(fx, FP, a, m, opts || {});
      });
    }

    function drawLabProps(st) {
      if (st.table) fx.draw(PR.table, st.table, Props.METAL);
      if (st.labGun) Props.drawLabGun(fx, PR, st.labGun, T);
      if (st.lamp) fx.draw(PR.lamp, st.lamp, { spec: [0.6, 30], rim: 0.5 });
      if (st.fridgeDoor !== undefined) {
        const F = st.fridgeM;
        fx.draw(PR.fridgeDoor, M4.chain(F, M4.translate(-0.37, 0, 0.33), M4.rotY(-st.fridgeDoor * 1.9)), { spec: [0.5, 24], rim: 0.4 });
      }
      (st.items || []).forEach(it => {
        if (it.kind === 'bottle') fx.draw(PR.bottle, it.M, { spec: [0.9, 40], rim: 0.8 });
        else if (it.kind === 'can') {
          fx.draw(PR.can, it.M, { spec: [0.7, 30], rim: 0.5 });
          fx.draw(PR.plate, M4.chain(it.M, M4.translate(0, 0.06, 0.034), M4.scale(0.05, 0.1, 1)), { texture: T('canLabel'), spec: [0.6, 30], rim: 0.2 });
        } else if (it.kind === 'dish') fx.draw(PR.dish, it.M, { spec: [0.9, 40], rim: 0.9, alpha: 0.85 });
        else if (it.kind === 'sandwich') fx.draw(PR.sandwich, it.M, { spec: [0.2, 10], rim: 0.4 });
        else if (it.kind === 'label') fx.draw(PR.plate, it.M, { texture: T(it.tex), spec: [0.2, 10], rim: 0.1 });
        else if (it.kind === 'jar') fx.draw(PR.jars[it.i || 0], it.M, { spec: [0.3, 12], rim: 0.5 });
        else if (it.kind === 'uber') Props.drawUber(fx, PR, it.M, it.needle || 0, T);
        else if (it.kind === 'saw') fx.draw(PR.saw, it.M, WEAPON_MAT);
        else if (it.kind === 'medigun') fx.draw(PR.medigun, it.M, WEAPON_MAT);
        else if (it.kind === 'chair') fx.draw(PR.chair, it.M, { spec: [0.4, 20], rim: 0.4 });
        else if (it.kind === 'tree') fx.draw(PR.tree, it.M, { spec: [0.05, 4], rim: 0.6 });
        else if (it.kind === 'rock') fx.draw(PR.rocks[it.i || 0], it.M, { texture: T('stone'), spec: [0.05, 6], rim: 0.5 });
        else if (it.kind === 'guitar') EngProps.drawGuitar(fx, engProps(), it.M, TE);
        else if (it.kind === 'launcher') DemoProps.drawLauncher(fx, demoProps(), it.M);
        else if (it.kind === 'rocket') fx.draw(solProps().launcher, it.M, WEAPON_MAT);
        else if (it.kind === 'magazine') fx.draw(PR.plate, it.M, { texture: T('magazine'), spec: [0.05, 4], rim: 0.2 });
        else if (it.kind === 'minigun') HeavyProps.drawGun(fx, heavyProps(), it.M, it.spin || 0);
        else if (it.kind === 'bomb') fx.draw(PR.bomb, it.M, { spec: [0.6, 30], rim: 0.8 });
        else if (it.kind === 'fabGun') fx.draw(Fab.gunMesh(FP, it.gun), it.M, WEAPON_MAT);
        else if (it.kind === 'crow') fx.draw(PR.crow, it.M, { spec: [0.2, 10], rim: 0.6 });
      });
      if (st.spy) Props.drawSpyHead(fx, PR, st.spy.M, st.spy.face);
    }

    function drawHearts(list, filter) {
      (list || []).forEach(h => { if (!filter || filter(h)) Props.drawHeart(fx, PR, h, T); });
    }

    function drawDoves(list, filter) {
      (list || []).forEach(d => {
        if (filter && !filter(d)) return;
        if (d.crow) fx.draw(PR.crow, d.M, { spec: [0.2, 10], rim: 0.6, tint: d.tint || [1, 1, 1] });
        else Props.drawDove(fx, PR, d);
      });
    }

    function cavityPass(st) {
      const h = st.heavy;
      if (!h || !h.cavity) return;
      const M = h.m.chest;
      gl.enable(gl.STENCIL_TEST);
      gl.clearStencil(0);
      gl.clear(gl.STENCIL_BUFFER_BIT);
      gl.stencilFunc(gl.ALWAYS, 1, 0xff);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
      gl.colorMask(false, false, false, false);
      gl.depthMask(false);
      fx.draw(PR.hole, M, {});
      gl.stencilFunc(gl.EQUAL, 1, 0xff);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
      gl.depthMask(true);
      gl.depthFunc(gl.ALWAYS);
      gl.depthRange(1, 1);
      fx.draw(PR.hole, M, {});
      gl.depthRange(0, 1);
      gl.depthFunc(gl.LEQUAL);
      gl.colorMask(true, true, true, true);
      const glow = h.glow || 0;
      fx.draw(PR.bowl, M, { texture: T('organs'), spec: [0.8, 30], rim: 0.6, tint: [1 + glow * 0.8, 1 + glow * 0.3, 1 + glow * 0.2] });
      fx.draw(PR.organs, M, { spec: [0.9, 34], rim: 0.7, tint: [1 + glow * 0.6, 1 + glow * 0.2, 1 + glow * 0.2] });
      if (st.medic && st.medic.inChest) Medic.draw(fx, MP, { m: st.medic.m, hands: st.medic.hands, outfit: st.medic.outfit, opts: { handsOnly: true } });
      drawHearts(st.hearts, x => x.inChest);
      drawDoves(st.doves, d => d.inChest);
      if (glow > 0) glowAt(M4.point(M, [0.06, 0.3, 0.2]), 0.4 + glow * 0.3, glow * 0.8, [1, 0.3, 0.2]);
      gl.disable(gl.STENCIL_TEST);
    }

    function beam(b, t) {
      const n = 3;
      for (let k = 0; k < n; k++) {
        const pts = [];
        const seg = 14;
        const dir = V3.sub(b.b, b.a);
        const len = V3.len(dir) || 1;
        const side = V3.norm(V3.cross(dir, fx.basis().view));
        const up = V3.norm(V3.cross(side, dir));
        for (let i = 0; i <= seg; i++) {
          const u = i / seg;
          const env = S(u * PI);
          const w = (b.wob === undefined ? 0.05 : b.wob) * len * 0.1 * env;
          const off = V3.add(V3.mul(side, S(u * 9 + t * 7 + k * 2.1) * w), V3.mul(up, C(u * 7 - t * 6 + k * 1.3) * w));
          pts.push(V3.add(V3.add(b.a, V3.mul(dir, u)), off));
        }
        for (let i = 0; i < seg; i++) {
          const a = V3.lerp(pts[i], pts[i + 1], -0.35), c = V3.lerp(pts[i], pts[i + 1], 1.35);
          fx.draw(quad, fx.streak(a, c, (b.w || 0.06) * (k === 0 ? 1 : 0.55)), { texture: T('beam'), additive: true, alpha: (b.alpha || 0.85) * (k === 0 ? 1 : 0.6), noFog: true, tint: b.col || [1, 0.3, 0.22] });
        }
      }
      const g = rand(Math.floor(t * 8));
      for (let i = 0; i < 10; i++) {
        const u = (i + frac(t * 1.6)) / 10;
        const p = V3.add(V3.lerp(b.a, b.b, u), [(g() - 0.5) * 0.05, (g() - 0.5) * 0.05, (g() - 0.5) * 0.05]);
        fx.draw(quad, fx.billboard(p, (b.w || 0.06) * (2.2 + g() * 1.5), g() * 6), { texture: T('puff'), additive: true, alpha: 0.28, noFog: true, tint: b.col || [1, 0.3, 0.22] });
      }
      glowAt(b.a, (b.w || 0.06) * 5, 0.8, b.col || [1, 0.3, 0.22]);
      glowAt(b.b, (b.w || 0.06) * 6, 0.7, b.col || [1, 0.3, 0.22]);
    }

    function zap(z, t) {
      const g = rand(Math.floor(t * 12) + (z.seed || 0));
      for (let k = 0; k < (z.n || 4); k++) {
        let p = V3.add(z.p, [(g() - 0.5) * z.r, (g() - 0.5) * z.r, (g() - 0.5) * z.r]);
        for (let i = 0; i < 5; i++) {
          const q = V3.add(p, [(g() - 0.5) * z.r * 0.6, (g() - 0.5) * z.r * 0.6, (g() - 0.5) * z.r * 0.6]);
          fx.draw(quad, fx.streak(p, q, z.w || 0.012), { texture: T('glow'), additive: true, alpha: 0.9, noFog: true, tint: z.col || [1, 0.35, 0.25] });
          p = q;
        }
      }
    }

    function drawFx(st, t) {
      (st.beams || []).forEach(b => beam(b, t));
      (st.zaps || []).forEach(z => zap(z, t));
      (st.glows || []).forEach(g => glowAt(g.p, g.s, g.a, g.tint));
      (st.flashes || []).forEach((f, i) => {
        fx.draw(quad, fx.billboard(f.p, f.s * (0.8 + frac(t * 13 + i) * 0.4), t * 21 + i), { texture: T('flash'), additive: true, alpha: 1, noFog: true });
        glowAt(f.p, f.s * 2.4, 0.6);
      });
      (st.tracers || []).forEach(tl => fx.draw(quad, fx.streak(tl.a, tl.b, tl.w || 0.03), { texture: T('glow'), additive: true, alpha: 0.75, noFog: true, tint: [1, 0.85, 0.5] }));
      (st.sparks || []).forEach(sk => {
        const g = rand(sk.seed || 41);
        for (let i = 0; i < 18; i++) {
          const d = V3.norm([g() - 0.5, g() * 0.8, g() - 0.5]);
          const p = V3.add(sk.p, V3.add(V3.mul(d, sk.u * (0.4 + g() * 0.8) * (sk.s || 1)), [0, -sk.u * sk.u * 0.8, 0]));
          glowAt(p, 0.06 * (sk.s || 1), 1 - sk.u, sk.tint || [1, 0.75, 0.35]);
        }
      });
      (st.blood || []).forEach(sk => {
        const g = rand(sk.seed || 51);
        for (let i = 0; i < 26; i++) {
          const d = V3.norm([g() - 0.5, g() * 0.9 - 0.1, g() - 0.5]);
          const p = V3.add(sk.p, V3.add(V3.mul(d, sk.u * (0.3 + g() * 1.1) * (sk.s || 1)), [0, -sk.u * sk.u * 1.2, 0]));
          fx.draw(quad, fx.billboard(p, (0.03 + g() * 0.05) * (sk.s || 1), g() * 6), { texture: T('puff'), blend: true, alpha: clamp(1.2 - sk.u, 0, 1), noFog: true, tint: [0.55, 0.02, 0.03] });
        }
      });
      (st.dust || []).forEach(d => {
        const k = d.u;
        fx.draw(quad, fx.billboard([d.p[0], d.p[1] + k * 0.35, d.p[2]], (d.s || 0.4) + k * 0.8, k * 3), { texture: T('puff'), blend: true, alpha: (d.a || 0.6) * (1 - k), tint: d.tint || [0.6, 0.56, 0.5], noFog: true });
      });
      (st.booms || []).forEach(f => {
        const g = rand(f.seed || 31);
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
      (st.smoke || []).forEach((sm, i) => {
        fx.draw(quad, fx.billboard(sm.p, sm.s, (sm.rot || 0) + i), { texture: T('puff'), blend: true, alpha: sm.a, noFog: true, tint: sm.tint || [0.5, 0.48, 0.45] });
      });
    }

    function overlays(st) {
      const layers = [];
      if (st.crack) layers.push(() => ov.rect(0, 0, 960, 540, { texture: T('crack'), blend: true, alpha: st.crack }));
      if (st.wash) layers.push(() => ov.rect(0, 0, 960, 540, { flat: [st.wash[0], st.wash[1], st.wash[2], 1], alpha: st.wash[3], blend: true }));
      const dark = Math.max(st.dark || 0, st.fade || 0);
      if (dark > 0) layers.push(() => ov.rect(0, 0, 960, 540, { flat: [0, 0, 0, 1], alpha: clamp(dark, 0, 1), blend: true }));
      if (st.white > 0) layers.push(() => ov.rect(0, 0, 960, 540, { flat: [1, 0.97, 0.9, 1], alpha: clamp(st.white, 0, 1), blend: true }));
      if (!layers.length) return;
      ov.begin();
      layers.forEach(f => f());
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
      fx.begin(st.env, st.camera);
      HeavySets.draw(fx, heavySets(), 'lineup', {});
      if (st.blur) fx.blurBack(st.blur);
      drawHeavy(st.heavy);
      drawActors(st.actors);
      drawDemo(st.demo);
      drawMedic(st.medic);
      if (st.logo) drawLogo(st.logo);
    }

    function scene3d(st, t) {
      fx.begin(st.env, st.camera);
      Sets.draw(fx, W, st.set, T, PR, st.setOpts || {});
      if (st.blurFirst) {
        drawActors(st.bgActors);
        fx.blurBack(st.blurFirst);
      }
      drawLabProps(st);
      drawActors(st.actors, st.actorOpts);
      drawEngineer(st.engineer);
      drawSoldier(st.soldier);
      drawHeavy(st.heavy);
      drawScout(st.scout);
      drawDemo(st.demo);
      if (st.blur) fx.blurBack(st.blur);
      drawMedic(st.medic);
      drawHearts(st.hearts, x => !x.inChest || st.heavy);
      drawDoves(st.doves);
      cavityPass(st);
      drawFx(st, t);
      overlays(st);
    }

    return {
      warm() {
        heavyRed();
        scoutP();
        demoP();
        engP();
        heavyProps();
        heavySets();
        demoProps();
        engProps();
        ['title', 'labWall', 'labLow', 'labFloor', 'labPaint', 'xray1', 'xray2', 'monitor', 'console', 'cabinet', 'gauge', 'heartSkin', 'organs', 'glow', 'flash', 'puff', 'flame',
          'dusk', 'dirt', 'stone', 'redCross', 'doorMetal', 'meterFace', 'lampOff', 'lampOn', 'crack', 'tf2', 'tf2emblem', 'beam', 'stripes', 'baseWall', 'concrete',
          'megaBaboon', 'spareLabel', 'canLabel', 'beerLabel', 'ticket', 'serving1', 'serving2', 'nextSign', 'ciggy', 'magazine', 'quote1', 'quote2', 'quote3', 'f2p', 'f2pUrl'].forEach(T);
        ['guitarTop', 'fretboard'].forEach(TE);
        TD('label');
        Object.keys(Medic.HAND_POSES).forEach(p => ['L', 'R'].forEach(s => Medic.handMesh(MP, s, p)));
        const noop = { draw() {} };
        [6.5, 146.6, 173.0, 176.9, 200.5, 206.5, 216.0, 221.0, 227.0].forEach(t => (Script.stage(t).actors || []).forEach(a => Fab.draw(noop, FP, a, Fab.solve(a.cls, a.pose), {})));
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
    audio: 'content/YouVid/Meet the Medic.mp3',
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
