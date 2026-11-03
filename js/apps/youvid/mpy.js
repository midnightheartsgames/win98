(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, frac, ease } = K;
  const Fx = window.MeetFx;
  const Pyro = window.MeetPyro;
  const Props = window.MpyProps;
  const Sets = window.MpySets;
  const Art = window.MpyArt;
  const Heads = window.MpyHeads;
  const Baby = window.MpyBaby;
  const Script = window.MpyScript;
  const Fab = window.FabCast;
  const MeetArt = window.MeetArt;
  const HeavySets = window.MeetSets;
  const HeavyProps = window.MeetProps;

  const RAINBOW = [[0.98, 0.42, 0.52], [1.0, 0.68, 0.36], [1.0, 0.94, 0.5], [0.56, 0.9, 0.5], [0.46, 0.72, 1.0], [0.72, 0.56, 0.98]];

  function create(r) {
    const fx = Fx.create(r);
    const PY = Pyro.build(r, fx, {});
    const PYL = Pyro.build(r, fx, { land: true });
    const PR = Props.build(r, fx);
    const W = Sets.build(r);
    const FP = Fab.build(r);
    const ov = K.overlay(r, 960, 540);
    const tex = {};
    const T = (k) => Art.tex(r, tex, k);
    const quad = ov.quad;
    const lazy = {};
    const once = (k, fn) => (lazy[k] || (lazy[k] = fn()));
    const heroes = () => once('heroes', () => ({
      MeetHeavy: window.MeetHeavy.build(r, fx), MeetScout: window.MeetScout.build(r, fx), MeetDemoman: window.MeetDemoman.build(r, fx),
      MeetSoldier: window.MeetSoldier.build(r, fx), MeetEngineer: window.MeetEngineer.build(r, fx), guest: Heads.build(r, fx)
    }));
    const bluHeavy = () => once('bluHeavy', () => window.MeetHeavy.build(r, fx, { team: 'blu' }));
    const bluSoldier = () => once('bluSoldier', () => window.MeetSoldier.build(r, fx, { team: 'blu' }));
    const recolored = (COL, swap, fn) => {
      const old = {};
      Object.keys(swap).forEach(k => { old[k] = COL[k]; COL[k] = swap[k]; });
      try { return fn(); } finally { Object.keys(old).forEach(k => { COL[k] = old[k]; }); }
    };
    const bluDemo = () => once('bluDemo', () => recolored(window.MeetDemoman.COL, { shirt: 0x46628e, shirtDk: 0x324a6e, scarf: 0x4a68a0, scarfDk: 0x344c78, pants: 0x3c5480, pantsDk: 0x2c3f62, emblem: 0x9ac0ec, emblemDk: 0x3a5a90 }, () => window.MeetDemoman.build(r, fx)));
    const baby = (kind) => once('baby:' + kind, () => Baby.build(r, fx, kind, heroes()));
    const lineupParts = () => once('lineup', () => ({ MS: HeavySets.build(r), MP: HeavyProps.build(r) }));
    const rainbowMesh = fx.dyn();
    const RB = { segs: 40, bands: RAINBOW.length };
    const rbIdx = [];
    for (let j = 0; j < RB.bands; j++) {
      for (let i = 0; i < RB.segs; i++) {
        const a = j * (RB.segs + 1) * 2 + i * 2;
        rbIdx.push(a, a + 1, a + 3, a, a + 3, a + 2);
      }
    }
    const rbData = new Float32Array(RB.bands * (RB.segs + 1) * 2 * 12);
    rainbowMesh.update(rbData, new Uint16Array(rbIdx));
    const logoQuad = K.mesh(r, b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], rgb(0xffffff, 1), [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));
    const plane = K.mesh(r, b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], rgb(0xffffff, 1), [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));
    const litPlane = K.mesh(r, b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));
    const hillMesh = K.mesh(r, b => K.spherePatch(b, 1, 1, 1, -PI, PI, 0, PI / 2, 40, 12, 0xffffff, [6, 2]));
    const helmet = () => once('helmet', () => K.mesh(r, b => window.MeetSoldier.buildHelmet(b)));
    const ringMesh = K.mesh(r, b => { for (let i = 0; i < 40; i++) { const a0 = (i / 40) * PI * 2, a1 = ((i + 1) / 40) * PI * 2; b.quad([C(a0), S(a0), 0], [C(a1), S(a1), 0], [C(a1) * 9, S(a1) * 9, 0], [C(a0) * 9, S(a0) * 9, 0], rgb(0x3e3a22, 1)); } });
    const charred = K.mesh(r, b => { const g = rand(77); for (let i = 0; i < 9; i++) b.at((g() - 0.5) * 0.12, g() * 0.08, (g() - 0.5) * 0.1, h => h.ellipsoid(0.03 + g() * 0.03, 0.025 + g() * 0.03, 0.03 + g() * 0.03, 8, 5, [0x1c1612, 0x2a1e16, 0x3a2418][i % 3])); });
    const cig = K.mesh(r, b => { b.push(M4.rotX(PI / 2)); b.prism(8, 0.0042, 0.0042, 0, 0.0042, 0.0042, 0.075, 0xf4f0e8, { capBottom: true }); b.prism(8, 0.0044, 0.0044, -0.022, 0.0044, 0.0044, 0, 0xc8964a, { capBottom: true }); b.pop(); });

    function glowAt(p, s, a, tint) {
      fx.draw(quad, fx.billboard(p, s, 0), { texture: T('glow'), additive: true, alpha: a, noFog: true, tint: tint || [1, 0.8, 0.45] });
    }

    function flameAt(p, s, spin, a, tint) {
      fx.draw(quad, fx.billboard(p, s, spin), { texture: T('flameTongue'), additive: true, alpha: a, noFog: true, tint: tint || [1, 1, 1] });
    }

    function drawFires(list, t) {
      (list || []).forEach((f, fi) => {
        const g = rand(f.seed || (fi + 3));
        const n = f.n || 14;
        const amp = f.a === undefined ? 1 : f.a;
        for (let i = 0; i < n; i++) {
          const ox = (g() - 0.5) * f.w, oz = (g() - 0.5) * (f.d || 0.4), rate = 0.7 + g() * 0.8, ph = g();
          const k = frac(t * rate + ph);
          const hgt = f.h * (0.55 + g() * 0.6);
          const wob = S(t * 4.3 + i * 1.7) * 0.06 * f.w;
          const p = [f.p[0] + ox * (1 - k * 0.5) + wob, f.p[1] + k * hgt * 0.85, f.p[2] + oz];
          const s = (f.s || 0.8) * (0.8 + g() * 0.6) * lerp(1, 0.45, k);
          const spin = (g() - 0.5) * 0.5 + S(t * 2.5 + i) * 0.18;
          const tint = [1, lerp(1, 0.62, k), lerp(1, 0.4, k)];
          if (i % 3 !== 2) fx.draw(quad, fx.billboard(p, [s * 0.8, s * 1.45], spin), { texture: T('flameCrisp'), blend: true, alpha: amp * 0.92 * (1 - k * k), noFog: true, tint });
          else fx.draw(quad, fx.billboard(p, [s * 1.1, s * 1.7], spin), { texture: T('flameTongue'), additive: true, alpha: amp * 0.7 * (1 - k), noFog: true });
        }
        if (f.glow !== false) glowAt([f.p[0], f.p[1] + f.h * 0.4, f.p[2]], Math.max(f.w, f.h) * 2.2, 0.35 * amp, [1, 0.6, 0.25]);
        if (f.smoke) {
          for (let i = 0; i < 6; i++) {
            const k = frac(t * 0.25 + i / 6);
            const p = [f.p[0] + (g() - 0.5) * f.w + k * 0.6, f.p[1] + f.h + k * f.h * 2.2, f.p[2] + (g() - 0.5) * 0.4];
            fx.draw(quad, fx.billboard(p, f.w * (0.8 + k * 1.6), g() * 6 + t * 0.2), { texture: T('smokeLump'), blend: true, alpha: 0.28 * Math.min(1, k * 3) * (1 - k), noFog: true, tint: [0.7, 0.62, 0.58] });
          }
        }
      });
    }

    function drawStreams(list, t) {
      (list || []).forEach((s0, si) => {
        const g = rand(si + 11);
        const n = s0.n || 34;
        const dir = V3.norm(s0.dir);
        const len = s0.len || 3.2;
        for (let i = 0; i < n; i++) {
          const ph = g(), spread = g() - 0.5, lift = g();
          const k = frac(t * (s0.rate || 2.6) + ph);
          const d = k * len * (s0.grow === undefined ? 1 : s0.grow);
          const side = V3.norm(V3.cross(dir, [0, 1, 0]));
          const p = V3.add(V3.add(s0.from, V3.mul(dir, d)), V3.add(V3.mul(side, spread * d * 0.35), [0, lift * d * 0.25 + d * d * 0.05, 0]));
          const sz = 0.1 + d * 0.42 * (s0.width || 1);
          const a0 = (s0.a === undefined ? 1 : s0.a);
          if (i % 2) flameAt(p, [sz * 1.2, sz * 1.3], g() * 6 + t * 3, (0.55 + g() * 0.45) * clamp(1.2 - k, 0, 1) * a0);
          else fx.draw(quad, fx.billboard(p, [sz, sz], g() * 6 + t * 2), { texture: T('fireLump'), blend: true, alpha: 0.9 * clamp(1.1 - k, 0, 1) * a0, noFog: true, tint: [1, lerp(1, 0.6, k), lerp(1, 0.45, k)] });
        }
        glowAt(V3.add(s0.from, V3.mul(dir, len * 0.4)), len * 1.3, 0.45 * (s0.a === undefined ? 1 : s0.a), [1, 0.6, 0.25]);
        glowAt(s0.from, 0.5, 0.8, [1, 0.85, 0.5]);
      });
    }

    function drawPilots(list, t) {
      (list || []).forEach(p => {
        const fl = 1 + S(t * 37) * 0.08 + S(t * 23) * 0.05;
        fx.draw(quad, fx.billboard(V3.add(p.p, [0, (p.s || 0.03) * 0.4, 0]), [(p.s || 0.03) * 0.55, (p.s || 0.03) * fl], 0), { texture: T('pilot'), additive: true, alpha: 1, noFog: true });
        glowAt(p.p, (p.s || 0.03) * 4, 0.35, [0.4, 0.55, 1]);
      });
    }

    function drawEmbers(list, t) {
      (list || []).forEach((e, ei) => {
        const g = rand(ei + 21);
        for (let i = 0; i < (e.n || 30); i++) {
          const k = frac(t * (0.12 + g() * 0.2) + g());
          const p = [e.p[0] + (g() - 0.5) * e.w + S(t * 1.3 + i) * 0.2, e.p[1] + k * e.h, e.p[2] + (g() - 0.5) * (e.d || e.w)];
          fx.draw(quad, fx.billboard(p, (e.s || 0.035) * (0.6 + g()), 0), { texture: T('ember'), additive: true, alpha: (1 - k) * 0.9, noFog: true });
        }
      });
    }

    function drawSmoke(list, t) {
      (list || []).forEach((s0, si) => {
        const g = rand(si + 31);
        for (let i = 0; i < (s0.n || 8); i++) {
          const k = frac(t * (s0.rate || 0.08) + i / (s0.n || 8));
          const p = [s0.p[0] + (g() - 0.5) * s0.w + k * (s0.drift || 1), s0.p[1] + k * s0.h, s0.p[2] + (g() - 0.5) * (s0.d || 1)];
          fx.draw(quad, fx.billboard(p, (s0.s || 2) * (0.6 + k), g() * 6 + t * 0.1), { texture: T('smokeLump'), blend: true, alpha: (s0.a || 0.5) * Math.min(1, k * 4) * (1 - k), noFog: !!s0.noFog, tint: s0.tint || [1, 1, 1] });
        }
      });
    }

    function drawRainbows(list) {
      (list || []).forEach(rb => {
        const pts = rb.pts;
        const n = RB.segs;
        const B = fx.basis();
        const grow = rb.grow === undefined ? 1 : rb.grow;
        const sample = (k) => {
          const x = clamp(k, 0, 1) * (pts.length - 1);
          const i = Math.min(pts.length - 2, Math.floor(x));
          return V3.lerp(pts[i], pts[i + 1], x - i);
        };
        let w = 0;
        for (let j = 0; j < RB.bands; j++) {
          const c = RAINBOW[j];
          for (let i = 0; i <= n; i++) {
            const k = (i / n) * grow;
            const p = sample(k), q = sample(k + 0.01);
            const tdir = V3.norm(V3.sub(q, p));
            let side = V3.cross(tdir, B.view);
            side = V3.len(side) < 1e-4 ? B.up : V3.norm(side);
            const width = rb.width * (rb.taper ? lerp(0.25, 1, Math.min(1, k * 3)) : 1);
            const a = V3.add(p, V3.mul(side, (j / RB.bands - 0.5) * width));
            const b2 = V3.add(p, V3.mul(side, ((j + 1) / RB.bands - 0.5) * width));
            const nn = V3.mul(B.view, -1);
            rbData.set([a[0], a[1], a[2], nn[0], nn[1], nn[2], c[0], c[1], c[2], 1, 0, 0], w);
            rbData.set([b2[0], b2[1], b2[2], nn[0], nn[1], nn[2], c[0], c[1], c[2], 1, 0, 0], w + 12);
            w += 24;
          }
        }
        rainbowMesh.update(rbData);
        fx.draw(rainbowMesh, null, { blend: true, alpha: rb.alpha === undefined ? 0.75 : rb.alpha, noFog: true });
        if (rb.glow) for (let i = 0; i < 10; i++) glowAt(sample((i / 9) * grow), rb.width * 2.2, 0.12, [1, 0.95, 1]);
      });
    }

    function drawSparkles(list, t) {
      (list || []).forEach((sp, si) => {
        const tw = 0.6 + 0.4 * S(t * (7 + (si % 5)) + si * 1.7);
        fx.draw(quad, fx.billboard(sp.p, sp.s * tw, t * 1.5 + si), { texture: T('sparkle'), additive: true, alpha: sp.a === undefined ? 0.9 : sp.a, noFog: true, tint: sp.tint || [1, 1, 1] });
      });
    }

    function drawBubbles(list) {
      (list || []).forEach(bb => fx.draw(quad, fx.billboard(bb.p, bb.s, bb.spin || 0), { texture: T('bubble'), additive: true, alpha: bb.a === undefined ? 0.8 : bb.a, noFog: true, tint: bb.tint || [0.9, 0.95, 1] }));
    }

    function drawSprites(list) {
      (list || []).forEach(sp => {
        const M = sp.M || fx.billboard(sp.p, sp.s, sp.spin || 0);
        fx.draw(sp.lit ? litPlane : plane, M, { texture: T(sp.tex), noFog: !sp.fog, tint: sp.tint || [1, 1, 1], spec: [0, 1], rim: 0, alpha: sp.alpha, blend: sp.alpha !== undefined && sp.alpha < 1 });
      });
    }

    function drawProps(list) {
      (list || []).forEach(p => {
        const tint = p.tint ? { tint: p.tint } : {};
        switch (p.kind) {
          case 'lolli': Props.drawLollipop(fx, PR, p.M, T, p.key, p.R, p.stick); break;
          case 'gift': Props.drawGift(fx, PR, p.M, T, p.key, p.w, p.h, p.d, p.bow); break;
          case 'balloonicorn': fx.draw(PR.balloonicorn, p.M, Object.assign({}, Props.SOFT_MAT, { spec: [0.6, 30] }, tint)); break;
          case 'hamster': fx.draw(PR.hamster, p.M, Object.assign({}, Props.SOFT_MAT, tint)); break;
          case 'sandwich': fx.draw(PR.sandwich, p.M, Object.assign({ texture: T('bread') }, Props.SOFT_MAT)); break;
          case 'shell': fx.draw(PR.shellHouse, p.M, Object.assign({ texture: T('shell') }, Props.SOFT_MAT)); break;
          case 'tree': fx.draw(PR[p.which || 'treePink'], p.M, Object.assign({}, Props.SOFT_MAT, tint)); break;
          case 'lolliTree': fx.draw(PR.lolliTree, p.M, Object.assign({}, Props.SOFT_MAT, tint)); break;
          case 'cottage': fx.draw(PR.cottage, p.M, Object.assign({ texture: T('landWall') }, Props.SOFT_MAT)); break;
          case 'gumball': fx.draw(p.blue ? PR.gumballB : PR.gumball, p.M, Object.assign({}, Props.SOFT_MAT, { spec: [0.9, 40] })); break;
          case 'balloon': fx.draw(PR.balloon, p.M, Object.assign({}, Props.SOFT_MAT, { spec: [0.9, 40] }, tint)); break;
          case 'post': fx.draw(PR.post, p.M, Props.SOFT_MAT); break;
          case 'garland': fx.draw(PR.garland, p.M, Object.assign({}, Props.SOFT_MAT, { rim: 0.4 })); break;
          case 'glasses': fx.draw(PR.glasses, p.M, { spec: [0.8, 40], rim: 0.6 }); break;
          case 'debris': fx.draw(PR.debris, p.M, { spec: [0.05, 4], rim: 0.4 }); break;
          case 'plant': fx.draw(W.plant, p.M, { spec: [0.1, 8], rim: 0.9 }); break;
          case 'chair': fx.draw(W.chair, p.M, { spec: [0.1, 8], rim: 0.8 }); break;
          case 'barnDoor': fx.draw(W.barnDoor, p.M, { flat: [1.0, 0.92, 0.75, 1] }); break;
          case 'axe': fx.draw(PR.axe, p.M, Props.WEAPON_MAT); break;
          case 'flamer': Props.drawFlamer(fx, PR, p.M, p.tint); break;
          case 'cig': fx.draw(cig, p.M, { spec: [0.2, 10], rim: 0.6 }); break;
          case 'hill': fx.draw(hillMesh, p.M, Object.assign({ texture: T('landGrass'), tint: [0.72, 0.86, 0.66] }, Sets.LAND)); break;
          case 'helmet': fx.draw(helmet(), M4.mul(p.M, M4.scale(0.78, 0.78, 0.78)), { spec: [0.5, 18], rim: 0.9, tint: [0.72, 0.7, 0.6] }); break;
          case 'rainblower': Props.drawRainblower(fx, PR, p.M); break;
          case 'charred': fx.draw(charred, p.M, { spec: [0.05, 4], rim: 0.5 }); break;
          default: break;
        }
      });
    }

    function drawWeapon(w, land) {
      if (!w) return;
      if (w.kind === 'flamer') Props.drawFlamer(fx, PR, w.M, w.tint);
      else if (w.kind === 'rainblower') Props.drawRainblower(fx, PR, w.M);
      else if (w.kind === 'lolli') Props.drawLollipop(fx, PR, M4.mul(w.M, M4.translate(0, 0.42, 0)), T, w.key || 'swirl', 0.19);
      else if (w.kind === 'axe') fx.draw(PR.axe, w.M, Props.WEAPON_MAT);
      else if (w.kind === 'flare') fx.draw(PR.flareGun, w.M, Props.WEAPON_MAT);
    }

    function drawPyro(st) {
      const p = st.pyro;
      if (!p) return;
      const P = p.land ? PYL : PY;
      Pyro.draw(fx, P, { m: p.m, hands: p.hands, opts: p.opts || {} });
      drawWeapon(p.weapon, p.land);
      if (p.hose !== false && p.weapon && (p.weapon.kind === 'flamer' || p.weapon.kind === 'rainblower') && !(p.opts && p.opts.noTank)) {
        const a = Pyro.tankPoint(p.m, [-0.07, -0.08, 0.02]);
        const b = M4.point(p.weapon.M, [0, -0.06, -0.15]);
        Props.drawHose(fx, PR, a, b, 0.16, p.land ? 0xf4a8c8 : 0x2a2624);
      }
    }

    function drawHeavy(st) {
      const h = st.heavy;
      if (!h) return;
      const P = h.team === 'blu' ? bluHeavy() : heroes().MeetHeavy;
      window.MeetHeavy.draw(fx, P, { m: h.m, face: st.heavyFace || {}, hands: h.hands, opts: h.opts || {} });
      if (h.gun) HeavyProps.drawGun(fx, lineupParts().MP, h.gun.M, h.gun.spin);
    }

    function drawScout(st) {
      const s = st.scout;
      if (!s) return;
      window.MeetScout.draw(fx, heroes().MeetScout, { m: s.m, face: st.scoutFace || {}, hands: s.hands, opts: s.opts || {} });
    }

    function drawDemo(st) {
      const d = st.demo;
      if (!d) return;
      window.MeetDemoman.draw(fx, d.team === 'blu' ? bluDemo() : heroes().MeetDemoman, { m: d.m, face: d.face || {}, hands: d.hands, opts: d.opts || {} });
    }

    function drawSoldier(st) {
      const d = st.soldier;
      if (!d) return;
      window.MeetSoldier.draw(fx, d.team === 'blu' ? bluSoldier() : heroes().MeetSoldier, { m: d.m, face: d.face || {}, hands: d.hands, opts: d.opts || {} });
    }

    function drawEngineer(st) {
      const d = st.engineer;
      if (!d) return;
      window.MeetEngineer.draw(fx, heroes().MeetEngineer, { m: d.m, face: d.face || {}, hands: d.hands, opts: d.opts || {} });
      if (d.wrench && window.EngProps) {
        const EP = once('engProps', () => window.EngProps.build(r));
        if (EP.wrench) fx.draw(EP.wrench, d.wrench, { spec: [0.5, 20], rim: 0.6 });
      }
    }

    function drawGuests(st) {
      (st.guests || []).forEach(g => {
        if (g.bust) Heads.drawBust(fx, heroes().guest, g.kind, g.bust, g.team, g.tint);
        Heads.draw(fx, heroes().guest, g.kind, g.H, g.face || {}, { team: g.team, tint: g.tint, noHat: g.noHat });
        if (g.glove) fx.draw(Pyro.handMesh(PY, 'R', g.glovePose || 'hold'), g.glove, { spec: [0.4, 20], rim: 0.6, tint: [0.45, 0.45, 0.48] });
      });
    }

    function drawActors(list) {
      (list || []).forEach(a => {
        const m = Fab.solve(a.cls, a.pose);
        Fab.draw(fx, FP, a, m, a.drawOpts || {});
        if (a.guestHead) {
          const H = M4.mul(m.head, M4.scale(a.guestScale || 1.05, a.guestScale || 1.05, a.guestScale || 1.05));
          Heads.draw(fx, heroes().guest, a.guestHead, H, a.guestFace || {}, { team: a.team, tint: a.tint });
        }
      });
    }

    function drawBabies(list, t) {
      (list || []).forEach(bb => Baby.draw(fx, baby(bb.kind), bb.st, bb.face));
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

    function drawCharacters(st, t) {
      drawActors(st.actors);
      drawHeavy(st);
      drawScout(st);
      drawDemo(st);
      drawSoldier(st);
      drawEngineer(st);
      drawGuests(st);
      drawBabies(st.babies, t);
      drawPyro(st);
    }

    function drawFx(st, t) {
      drawSmoke(st.smoke, t);
      drawFires(st.fires, t);
      drawStreams(st.streams, t);
      drawPilots(st.pilots, t);
      drawEmbers(st.embers, t);
      drawRainbows(st.rainbows);
      drawSparkles(st.sparkles, t);
      drawBubbles(st.bubbles);
      (st.glows || []).forEach(g => glowAt(g.p, g.s, g.a, g.tint));
      (st.flashes || []).forEach(f => fx.draw(quad, fx.billboard(f.p, f.s, t * 9), { texture: T('flash'), additive: true, alpha: f.a === undefined ? 1 : f.a, noFog: true }));
    }

    function landPost(st) {
      fx.glow(st.glow === undefined ? 0.12 : st.glow, 0.5);
      if (st.noFrame) return;
      ov.begin();
      ov.rect(0, 0, 960, 540, { texture: T('frameC'), blend: true, alpha: 0.28 });
      ov.rect(0, 0, 960, 540, { texture: T('frameB'), blend: true, alpha: 0.55 });
      ov.rect(0, 0, 960, 540, { texture: T('frameA') });
    }

    function overlays(st) {
      const dark = Math.max(st.dark || 0, st.fade || 0);
      const white = st.white || 0;
      const tintFlash = st.tintFlash;
      if (dark <= 0 && white <= 0 && !tintFlash) return;
      ov.begin();
      if (white > 0) ov.rect(0, 0, 960, 540, { flat: st.whiteCol || [1, 0.97, 0.9, 1], alpha: clamp(white, 0, 1), blend: true });
      if (tintFlash) ov.rect(0, 0, 960, 540, { flat: tintFlash, alpha: tintFlash[3], blend: true });
      if (dark > 0) ov.rect(0, 0, 960, 540, { flat: [0, 0, 0, 1], alpha: clamp(dark, 0, 1), blend: true });
    }

    function lensMask(st) {
      const L = st.lens;
      ov.begin();
      ov.rect(0, 0, 960, 540, { texture: T('lensShade'), blend: true, alpha: 0.5 });
      ov.rect(0, 0, 960, 540, { texture: T('lensMask') });
      if (L.rim) [[236, 270], [724, 270]].forEach(([cx, cy]) => ov.rect(cx - 260, cy - 260, 520, 520, { texture: T('lensRim'), additive: true, alpha: L.rim }));
    }

    function scene3d(st, t) {
      fx.begin(st.env, st.camera);
      Sets.draw(fx, W, st.set, T, { eye: st.camera.eye });
      drawSprites(st.backSprites);
      if (st.fxFirst) drawFx(st, t);
      if (st.blurFar) fx.blurBack(st.blurFar);
      drawProps(st.props);
      if (st.blurMid) fx.blurBack(st.blurMid);
      drawCharacters(st, t);
      drawProps(st.weaponProps);
      drawSprites(st.sprites);
      if (!st.fxFirst) drawFx(st, t);
      if (st.blur) fx.blurBack(st.blur);
      drawSprites(st.front);
      if (st.frontChars) {
        const keep = { pyro: st.frontChars.pyro, heavy: st.frontChars.heavy, babies: st.frontChars.babies };
        drawCharacters(keep, t);
      }
      if (st.land) landPost(st);
      if (st.ring) {
        ov.begin();
        const R = lerp(1400, 120, ease(st.ring.k));
        ov.rect(480 - R, 270 - R, R * 2, R * 2, { texture: T('helmetRing') });
      }
      if (st.lens) lensMask(st);
      overlays(st);
    }

    function lineup(st, t) {
      const H = lineupParts();
      fx.begin(st.env, st.camera);
      HeavySets.draw(fx, H.MS, 'lineup', {});
      if (st.blur) fx.blurBack(st.blur);
      drawCharacters(st, t);
      if (st.logo) drawLogo(st.logo);
      overlays(st);
    }

    function card(st, t) {
      r.clear([0, 0, 0]);
      ov.begin();
      st.cards.forEach(c => ov.rect(0, 0, 960, 540, Object.assign({ texture: T(c.tex) }, c.alpha < 1 ? { alpha: c.alpha, blend: true } : {})));
      if (st.burn) {
        const b = st.burn;
        const g = rand(7);
        const R = b.r;
        for (let i = 0; i < 110; i++) {
          const a = g() * PI * 2, d = (0.72 + g() * 0.4) * R;
          const k = frac(t * (0.9 + g() * 0.8) + g());
          const x = b.x + C(a) * d, y = b.y + S(a) * d * 0.8 - k * (16 + R * 0.12);
          const s = (10 + g() * 20) * (0.6 + R / 320) * (1 - k * 0.45);
          const kind = i % 3;
          ov.rect(x - s / 2, y - s * (kind === 1 ? 0.5 : 1), s, kind === 1 ? s : s * 1.7, { texture: T(kind === 0 ? 'flameTongue' : kind === 1 ? 'fireLump' : 'flameCrisp'), additive: kind === 0, blend: kind !== 0, alpha: 0.85 * (1 - k) });
        }
        ov.rect(b.x - R * 0.85, b.y - R * 0.68, R * 1.7, R * 1.36, { texture: T('burnHole') });
        for (let i = 0; i < 18; i++) {
          const a = g() * PI * 2, d = g() * R * 0.6;
          const k = frac(t * 1.4 + g());
          const s = R * (0.35 + g() * 0.3) * (1 - k * 0.4);
          ov.rect(b.x + C(a) * d - s / 2, b.y + S(a) * d * 0.8 - s * 0.8 - k * R * 0.3, s, s * 1.5, { texture: T('flameCrisp'), blend: true, alpha: 0.85 * (1 - k * k) });
        }
      }
      [st.sweep].concat(st.sweeps || []).forEach(s0 => {
        if (s0) ov.rect(s0.x - s0.w / 2, s0.y - s0.h / 2, s0.w, s0.h, { texture: T('flare'), additive: true, alpha: s0.a });
      });
      overlays(st);
    }

    return {
      warm() {
        heroes();
        bluHeavy();
        bluSoldier();
        bluDemo();
        lineupParts();
        ['title', 'sfm', 'flare', 'frameA', 'frameB', 'frameC', 'landSky', 'vistaSky', 'landCloud', 'landGrass', 'cookie', 'petals', 'sparkle', 'bubble', 'flowerPink', 'flowerBlue', 'flowerWhite',
          'giftBlue', 'giftPurple', 'giftPink', 'landWall', 'bread', 'shell', 'blinds', 'spyBlinds', 'leaf', 'duskSky', 'smokeSky', 'cracked', 'dirt', 'woodDark', 'woodBurnt', 'shedWood',
          'flameTongue', 'flameCrisp', 'pilot', 'ember', 'smokeLump', 'fireLump', 'swirl', 'swirlY', 'swirlR', 'swirlG', 'swirlP', 'swirlB', 'glow', 'flash', 'tf2', 'tf2emblem', 'lensMask', 'lensShade', 'lensRim', 'burnHole'].forEach(T);
        ['heavy', 'scout', 'demo', 'soldier', 'engineer', 'medic', 'spy'].forEach(baby);
        const noop = { draw() {} };
        [8, 21, 72, 100, 110, 120.3].forEach(t => (Script.stage(t).actors || []).forEach(a => Fab.draw(noop, FP, a, Fab.solve(a.cls, a.pose), {})));
      },
      render(t) {
        const st = Script.stage(t);
        if (st.kind === 'black') r.clear([0, 0, 0]);
        else if (st.kind === 'card') card(st, t);
        else if (st.kind === 'lineup') lineup(st, t);
        else scene3d(st, t);
        return { polys: Math.round(fx.polys + r.polys), shot: st.shot };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Meet the Pyro.mp3',
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
