(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, frac } = K;
  const Fx = window.MeetFx;
  const Sol = window.MeetSoldier;
  const Props = window.MtsProps;
  const Sets = window.MtsSets;
  const Art = window.MtsArt;
  const MArt = window.MeetArt;
  const Fab = window.FabCast;
  const Script = window.MtsScript;

  const SHARED = ['orange', 'tf2', 'tf2emblem', 'flash', 'glow', 'puff', 'flame'];

  function paintStreaks(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    const g = rand(91);
    ctx.translate(W / 2, H / 2);
    for (let i = 0; i < 70; i++) {
      const a = g() * PI * 2, r0 = W * (0.05 + g() * 0.12), r1 = W * (0.25 + g() * 0.25);
      ctx.strokeStyle = `rgba(255,${200 + Math.round(g() * 55)},${Math.round(80 + g() * 120)},${0.35 + g() * 0.6})`;
      ctx.lineWidth = 1 + g() * 2.5;
      ctx.beginPath();
      ctx.moveTo(C(a) * r0, S(a) * r0);
      ctx.lineTo(C(a) * r1, S(a) * r1);
      ctx.stroke();
    }
  }

  function paintNoise(ctx, W, H) {
    const g = rand(93);
    ctx.fillStyle = '#7a5a36';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) {
      const x = g() * W, y = g() * H, r = W * (0.03 + g() * 0.12);
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${g() < 0.5 ? '60,40,22' : '170,130,80'},0.35)`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  function create(r) {
    const fx = Fx.create(r);
    const SP = Sol.build(r, fx);
    const PR = Props.build(r);
    const W = Sets.build(r);
    const FP = Fab.build(r);
    const ov = K.overlay(r, 960, 540);
    const tex = {};
    const own = {};
    const T = (k) => (SHARED.includes(k) ? MArt.tex(r, tex, k) : Art.tex(r, own, k));
    const extra = {
      streaks: r.texture(256, paintStreaks, { clamp: true }),
      dust: r.texture(256, paintNoise, { height: 144, clamp: true })
    };
    const quad = ov.quad;
    const mk = (fn) => K.mesh(r, fn);
    const chunk = mk(b => b.box(0.1, 0.07, 0.08, 0xffffff));
    const stick = mk(b => b.box(0.012, 0.012, 0.09, 0xf2eee6));
    const tire = mk(b => {
      const n = 24, m = 10, R = 0.62, rr = 0.24;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
          const pt = (ii, jj) => {
            const a = (ii / n) * PI * 2, c = (jj / m) * PI * 2;
            const nn = [C(a) * C(c), S(c), S(a) * C(c)];
            return { p: [C(a) * (R + rr * C(c)), rr * 1.4 * S(c), S(a) * (R + rr * C(c))], n: nn };
          };
          const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
          b.quad(q[0].p, q[1].p, q[2].p, q[3].p, (i + j) % 3 ? 0x232120 : 0x2c2a28, null, q.map(v => v.n));
        }
      }
    });
    const post = mk(b => b.box(0.32, 4.2, 0.32, 0x5a4636));
    const pyroMask = mk(b => {
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * 0.043, 0.022, 0.098), M4.rotY(s * 0.32));
        K.discXY(b, 0, 0, 0, 0.034, 16, rgb(0x6f6c68));
        K.discXY(b, 0, 0, 0.004, 0.027, 16, rgb(0x15191c));
        b.at(-0.008, 0.008, 0.005, q => K.discXY(q, 0, 0, 0, 0.007, 8, rgb(0x7f8a92)));
        b.pop();
      });
      b.push(M4.translate(0, -0.052, 0.1), M4.rotX(1.1));
      b.prism(12, 0.026, 0.026, 0, 0.028, 0.028, 0.055, 0x3a3836);
      b.prism(12, 0.03, 0.03, 0.055, 0.03, 0.03, 0.065, 0x77736c);
      b.pop();
    });
    const pyroTank = mk(b => {
      b.prism(14, 0.075, 0.075, -0.2, 0.075, 0.075, 0.18, 0x55524e, { capBottom: true });
      b.at(0, 0.2, 0, q => q.ellipsoid(0.072, 0.07, 0.072, 14, 8, 0xe3821f));
      b.at(0, 0.27, 0, q => q.prism(8, 0.012, 0.012, 0, 0.012, 0.012, 0.04, 0x2a2826));
      b.at(0.09, 0.0, 0.02, q => q.prism(10, 0.035, 0.035, -0.12, 0.035, 0.035, 0.1, 0x6a6662));
    });
    const stump = mk(b => {
      b.prism(14, 0.056, 0.05, -0.07, 0.06, 0.054, 0, 0xc98f6c, { capTop: false });
      b.at(0, -0.071, 0, h => {
        h.push(M4.rotX(PI / 2));
        K.discXY(h, 0, 0, 0, 0.058, 16, rgb(0x9a1c16));
        K.discXY(h, 0, 0, 0.002, 0.016, 10, rgb(0xeee6d8));
        h.pop();
      });
    });
    const helmetBlu = mk(b => {
      b.push(M4.scale(0.76, 0.76, 0.76));
      Sol.buildHelmet(b);
      b.pop();
    });
    const logoQuad = mk(b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], rgb(0xffffff, 1), [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));
    const WEAPON_MAT = { spec: [0.25, 14], rim: 0.5 };

    function drawFx(list) {
      list.forEach(f => {
        const g = rand(f.seed || 7);
        if (f.kind === 'muzzle') {
          fx.draw(quad, fx.billboard(f.p, f.s, f.spin || 0), { texture: T('flash'), additive: true, alpha: 1, noFog: true });
          fx.draw(quad, fx.billboard(f.p, f.s * 1.8, 0), { texture: T('glow'), additive: true, alpha: 0.5, noFog: true, tint: [1, 0.8, 0.4] });
        } else if (f.kind === 'tracer') {
          fx.draw(quad, fx.streak(f.a, f.b, 0.05), { texture: T('glow'), additive: true, alpha: 0.9, noFog: true, tint: [1, 0.85, 0.45] });
        } else if (f.kind === 'rocket') {
          const z = f.dir;
          let x = V3.cross([0, 1, 0], z);
          if (V3.len(x) < 1e-4) x = [1, 0, 0];
          x = V3.norm(x);
          const y = V3.cross(z, x);
          const M = new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, f.p[0], f.p[1], f.p[2], 1]);
          fx.draw(PR.rocket, M, WEAPON_MAT);
          const tail = V3.sub(f.p, V3.mul(z, 0.2));
          fx.draw(quad, fx.billboard(tail, 0.45, f.u * 30), { texture: T('flame'), additive: true, alpha: 1, noFog: true });
          fx.draw(quad, fx.billboard(tail, 0.9, 0), { texture: T('glow'), additive: true, alpha: 0.6, noFog: true, tint: [1, 0.7, 0.3] });
        } else if (f.kind === 'trail') {
          const len = V3.len(V3.sub(f.b, f.a));
          const n = Math.max(2, Math.round(len / 0.35));
          for (let i = 0; i < n; i++) {
            const k = i / n;
            const p = V3.lerp(f.a, f.b, k);
            fx.draw(quad, fx.billboard(V3.add(p, [S(i * 1.7) * 0.05, S(i * 2.3) * 0.05, 0]), 0.25 + (1 - k) * 0.4, i), { texture: T('puff'), blend: true, alpha: 0.5 * k + 0.1, tint: [0.82, 0.8, 0.78], noFog: true });
          }
        } else if (f.kind === 'backblast') {
          for (let i = 0; i < 6; i++) {
            const p = V3.add(f.p, V3.mul(f.dir, 0.2 + i * 0.18 + f.u * 2));
            fx.draw(quad, fx.billboard(p, 0.35 + i * 0.12, i), { texture: T(i < 2 ? 'flame' : 'puff'), additive: i < 2, blend: i >= 2, alpha: i < 2 ? 0.8 : 0.4, tint: i < 2 ? [1, 1, 1] : [0.8, 0.78, 0.75], noFog: true });
          }
        } else if (f.kind === 'flamer') {
          const n = f.big ? 44 : 26;
          for (let i = 0; i < n; i++) {
            const ph = frac(f.u * 2.2 + i / n);
            const d = ph * f.len;
            const side = V3.norm(V3.cross(f.dir, [0, 1, 0]));
            const wob = V3.add(V3.mul(side, S(i * 2.1 + f.u * 9) * d * 0.14), [0, C(i * 1.3 + f.u * 7) * d * 0.08 + d * d * 0.03, 0]);
            const p = V3.add(V3.add(f.p, V3.mul(f.dir, d)), wob);
            const s = (0.12 + ph * 0.9) * (f.big ? 1.6 : 1);
            fx.draw(quad, fx.billboard(p, s, i + f.u * 3), { texture: T('flame'), additive: true, alpha: 0.85 * (1 - ph * 0.7), noFog: true });
          }
          fx.draw(quad, fx.billboard(V3.add(f.p, V3.mul(f.dir, 0.05)), 0.18, f.u * 20), { texture: T('glow'), additive: true, alpha: 0.9, noFog: true, tint: [0.5, 0.6, 1] });
        } else if (f.kind === 'boom') {
          const k = clamp(f.u / 0.9, 0, 1);
          const R = (f.s || 1.5) * (0.35 + 0.85 * Math.sqrt(k));
          for (let i = 0; i < 22; i++) {
            const a = g() * PI * 2, e = (g() - 0.25) * 1.3;
            const d = [C(a) * C(e), S(e) + 0.25, S(a) * C(e)];
            const p = V3.add(f.p, V3.mul(d, R * (0.15 + g() * 0.6)));
            fx.draw(quad, fx.billboard(p, R * (0.7 + g() * 0.6) * (1 - k * 0.3), g() * 6), { texture: T('flame'), additive: true, alpha: (0.4 + g() * 0.35) * (1 - k), noFog: true });
          }
          for (let i = 0; i < 20; i++) {
            const a = g() * PI * 2, rr = 0.3 + g() * 0.6;
            const p = V3.add(f.p, [C(a) * R * rr, R * (0.2 + g() * 0.4) + k * R * (0.8 + g() * 0.8), S(a) * R * rr]);
            const sh = 0.24 + g() * 0.18;
            fx.draw(quad, fx.billboard(p, R * (0.5 + g() * 0.4 + k * 0.7), g() * 6), { texture: T('puff'), tint: [sh, sh * 0.92, sh * 0.85], blend: true, alpha: 0.32 * Math.min(1, k * 3) * (1 - k * 0.55), noFog: true });
          }
          for (let i = 0; i < 18; i++) {
            const a = g() * PI * 2, e = g() * 1.2;
            const d = [C(a) * C(e), S(e), S(a) * C(e)];
            const p = V3.add(f.p, V3.add(V3.mul(d, k * (f.s || 1.5) * 3 * (0.5 + g())), [0, -k * k * 2, 0]));
            fx.draw(quad, fx.billboard(p, 0.12, 0), { texture: T('glow'), additive: true, alpha: 1 - k, noFog: true, tint: [1, 0.8, 0.4] });
          }
          if (f.u < 0.3) fx.draw(quad, fx.billboard(f.p, (f.s || 1.5) * 2.6, g() * 6), { texture: extra.streaks, additive: true, alpha: 0.6 * (1 - f.u / 0.3), noFog: true });
        } else if (f.kind === 'gibs') {
          const k = f.u;
          for (let i = 0; i < f.n; i++) {
            const a = g() * PI * 2, e = 0.2 + g() * 1.0, sp = 3 + g() * 5;
            const v = [C(a) * C(e) * sp, S(e) * sp, S(a) * C(e) * sp];
            const p = [f.p[0] + v[0] * k, Math.max(0.05, f.p[1] + v[1] * k - 4.9 * k * k), f.p[2] + v[2] * k];
            const spin = k * (5 + g() * 10);
            const col = g() < 0.35 ? (f.team === 'blu' ? [0.35, 0.5, 0.66] : [0.66, 0.24, 0.2]) : g() < 0.5 ? [0.55, 0.12, 0.1] : [0.78, 0.55, 0.42];
            fx.draw(chunk, M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotX(spin), M4.rotY(spin * 0.7), M4.scale(0.6 + g() * 1.2, 0.6 + g(), 0.6 + g())), { tint: col, spec: [0.3, 12], rim: 0.4 });
          }
          for (let i = 0; i < 8; i++) {
            const a = g() * PI * 2;
            const p = V3.add(f.p, [C(a) * k * 1.4, 0.2 + k * 0.6, S(a) * k * 1.4]);
            fx.draw(quad, fx.billboard(p, 0.3 + k * 0.8, i), { texture: T('puff'), blend: true, alpha: 0.5 * (1 - Math.min(1, k * 1.5)), tint: [0.45, 0.06, 0.05], noFog: true });
          }
        } else if (f.kind === 'fire') {
          const n = f.n || 14;
          for (let i = 0; i < n; i++) {
            const ph = frac(f.u * 1.4 + i / n + g() * 0.3);
            const p = V3.add(f.p, [(g() - 0.5) * (f.w || 1), ph * (f.h || 1.2), (g() - 0.5) * (f.d || 1)]);
            const s = (f.s || 0.6) * (0.6 + S(ph * PI) * 0.8) * (1 - ph * 0.3);
            fx.draw(quad, fx.billboard(p, s, g() * 6), { texture: T('flame'), additive: true, alpha: 0.9 * (1 - ph * 0.6), noFog: true });
          }
        } else if (f.kind === 'embers') {
          for (let i = 0; i < (f.n || 20); i++) {
            const ph = frac(f.u * 0.5 + g());
            const p = V3.add(f.p, [(g() - 0.5) * f.w + S(ph * 6 + i) * 0.2, ph * 2.5, (g() - 0.5) * f.w * 0.6]);
            fx.draw(quad, fx.billboard(p, 0.05, 0), { texture: T('glow'), additive: true, alpha: 1 - ph, noFog: true, tint: [1, 0.55, 0.2] });
          }
        } else if (f.kind === 'smokeTrail') {
          for (let i = 0; i < 12; i++) {
            const y = (i / 12) * f.h;
            const p = V3.add(f.p, [S(y * 0.8 + f.u) * 0.3, y, C(y * 0.6) * 0.2]);
            fx.draw(quad, fx.billboard(p, 0.6 + y * 0.12, i), { texture: T('puff'), blend: true, alpha: 0.45 * (1 - i / 14), tint: [0.8, 0.79, 0.77], noFog: true });
          }
        } else if (f.kind === 'spark') {
          fx.draw(quad, fx.billboard(f.p, 0.25, 0), { texture: T('glow'), additive: true, alpha: 1, noFog: true, tint: [0.4, 0.5, 1] });
        } else if (f.kind === 'uber') {
          fx.draw(quad, fx.billboard(f.p, 2.4 + S(f.u * 9) * 0.2, f.u), { texture: T('glow'), additive: true, alpha: 0.45, noFog: true, tint: [0.3, 0.55, 1] });
        } else if (f.kind === 'flying') {
          if (f.what === 'launcherBlu') fx.draw(PR.launcher, M4.chain(M4.translate(f.p[0], f.p[1], f.p[2]), M4.rotZ(f.spin), M4.rotX(f.spin * 0.6)), Object.assign({ tint: [0.8, 0.9, 1.1] }, WEAPON_MAT));
          else if (f.what === 'bluHead') drawHead({ cls: 'heavy', p: f.p, yaw: f.spin, tilt: f.spin * 0.7, face: { eyes: 'shut', mouth: 'open', open: 0.8 } });
        } else if (f.kind === 'cig') {
          fx.draw(stick, M4.chain(M4.translate(f.p[0], f.p[1], f.p[2]), M4.rotX(f.u * 14), M4.rotY(f.u * 5)), { spec: [0.1, 4], rim: 0.3 });
        } else if (f.kind === 'squirt') {
          for (let i = 0; i < 8; i++) {
            const k = f.u * (0.8 + i * 0.1);
            const p = V3.add(f.p, [k * 1.2, k * 0.8 - k * k * 2.5, 0.05 * i]);
            fx.draw(quad, fx.billboard(p, 0.05, 0), { flat: [0.55, 0.05, 0.04, 1], noFog: true });
          }
        }
      });
    }

    function drawActors(list, opts) {
      (list || []).forEach(a => {
        const m = Fab.solve(a.cls, a.pose);
        Fab.draw(fx, FP, a, m, opts || {});
        if (a.cls === 'pyro') {
          const pass = { spec: [0.5, 30], rim: 0.5 };
          fx.draw(pyroMask, m.head, pass);
          fx.draw(pyroTank, M4.chain(m.chest, M4.translate(0.06, 0.3, -0.21)), Object.assign({}, pass, { spec: [0.3, 14] }));
        }
      });
    }

    function headMatrix(h) {
      return M4.chain(M4.translate(h.p[0], h.p[1], h.p[2]), M4.rotY(h.yaw || 0), M4.rotZ(h.tilt || 0), M4.rotX(h.roll || 0));
    }

    const HEAD_FACES = {
      sniper: { eyes: 'shut', mouth: 'o', open: 0.6 },
      pyro: {},
      heavy: { eyes: 'shut', brows: 'sad', mouth: 'open', open: 0.9 },
      spy: { eyes: 'half', mouth: 'teeth' },
      medic: { eyes: 'crazy', brows: 'up', mouth: 'scream', open: 0.8 },
      demo: { eyes: 'half', mouth: 'teeth' },
      scout: { eyes: 'wide', brows: 'up', mouth: 'scream', open: 1 },
      engineer: { eyes: 'shut', mouth: 'frown' },
      soldier: { eyes: 'shut', mouth: 'open', open: 0.7 }
    };
    const HEAD_WEAR = { sniper: 'shades', medic: 'glasses', engineer: 'goggles' };

    function drawHead(h) {
      const H = headMatrix(h);
      const a = { cls: h.cls, team: 'blu', hat: 'none', face: h.face || HEAD_FACES[h.cls] || {}, eyewear: HEAD_WEAR[h.cls], pose: null };
      Fab.draw({ draw: (mesh, M, ps) => { if (M === H) fx.draw(mesh, M, ps); } }, FP, a, { head: H }, {});
      const hy = Fab.HEAD[h.cls] || Fab.HEAD.soldier;
      fx.draw(helmetBlu, M4.chain(H, M4.translate(0, hy.ry * 0.12, 0), M4.scale(hy.rx / 0.106, hy.ry / 0.125, hy.rz / 0.116)), { tint: [0.82, 1.15, 1.5], spec: [0.35, 16], rim: 0.9, backDark: true });
      fx.draw(stump, M4.chain(H, M4.translate(0, -hy.ry * 0.72, -0.012)), { spec: [0.4, 24], rim: 0.3 });
    }

    function drawHeads(list) {
      (list || []).forEach(h => drawHead(h));
    }

    function drawSoldier(st, opts) {
      if (!st.sol) return;
      const s = st.sol;
      Sol.draw(fx, SP, { m: s.m, face: st.face, hands: s.hands, grenades: s.grenades, opts: opts || {} });
      if (s.weapon) fx.draw(PR[s.weapon.kind], s.weapon.M, WEAPON_MAT);
      (s.grenades || []).forEach(g => {
        if (!g.M || !g.tether) return;
        const a = M4.point(g.M, [0, 0.05, 0]);
        fx.draw(quad, fx.streak(a, g.tether, 0.012), { flat: [0.12, 0.11, 0.1, 1] });
      });
    }

    function drawProps(st) {
      (st.props || []).forEach(p => {
        if (p.kind === 'tires') {
          [[31.4, -49.6, 0.3], [28.6, -49.0, -0.5]].forEach(([x, z, yaw], i) => fx.draw(tire, M4.chain(M4.translate(x, 0.6, z), M4.rotY(yaw), M4.rotX(PI / 2 - 0.25 * (i ? -1 : 1))), { spec: [0.2, 10], rim: 0.5 }));
        } else if (p.kind === 'post') {
          fx.draw(post, M4.translate(p.p[0], 2.1, p.p[2]), { spec: [0.03, 4], rim: 0.3 });
        }
      });
      (st.drops || []).forEach(d => fx.draw(Fab.gunMesh(FP, d.gun), M4.chain(M4.translate(d.p[0], d.p[1], d.p[2]), M4.rotY(d.yaw), M4.rotZ(PI / 2)), Object.assign({ tint: [0.85, 0.95, 1.15] }, WEAPON_MAT)));
      if (st.fallen) drawHead(st.fallen);
    }

    function drawLogo(L) {
      fx.begin(Fx.DEFAULT_ENV, { eye: [0, 0, 3.2], at: [0, 0, 0], fov: 40, near: 0.05, far: 50 }, null, true);
      const gap = MArt.LOGO.gap;
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

    function lights(st) {
      const pts = [];
      (st.fx || []).forEach(f => {
        if (f.kind === 'boom' && f.u < 0.8) pts.push({ pos: f.p, col: [3.2 * (1 - f.u / 0.8), 1.8 * (1 - f.u / 0.8), 0.6 * (1 - f.u / 0.8)], k: 0.12 });
        else if (f.kind === 'flamer' || f.kind === 'fire') pts.push({ pos: f.p, col: [1.3, 0.7, 0.25], k: 0.5 });
      });
      if (!pts.length) return st.env;
      return Object.assign({}, st.env, { points: pts.slice(0, 2) });
    }

    function depthOnly(fn) {
      const gl = fx.gl;
      gl.colorMask(false, false, false, false);
      fn();
      gl.colorMask(true, true, true, true);
    }

    function scene(st) {
      fx.begin(lights(st), st.camera);
      const yard = st.set === 'yard';
      Sets.draw(fx, W, st.set, { noGate: yard });
      const gate = () => { if (yard) Sets.drawGate(fx, W); drawHeads(st.heads); };
      const focus = st.focus;
      if (focus === 'sol') {
        gate();
        drawActors(st.actors);
        drawProps(st);
        if (st.blur) fx.blurBack(st.blur);
        depthOnly(() => gate());
        drawSoldier(st);
      } else if (focus === 'heads' || focus === 'far') {
        drawSoldier(st);
        if (st.blur) fx.blurBack(st.blur);
        depthOnly(() => drawSoldier(st));
        gate();
        drawActors(st.actors);
        drawProps(st);
      } else {
        if (st.blur) fx.blurBack(st.blur);
        gate();
        drawActors(st.actors);
        drawProps(st);
        drawSoldier(st);
      }
      drawFx(st.fx || []);
      if (st.motionBlur) fx.blurBack(st.motionBlur);
      if (st.logo) drawLogo(st.logo);
      if (st.flash || st.streaks || st.flameFill) {
        ov.begin();
        if (st.flameFill) {
          ov.rect(-260, -420, 1480, 1380, { texture: T('flame'), additive: true, alpha: st.flameFill });
          ov.rect(0, 0, 960, 540, { flat: [1, 0.72, 0.2, 1], alpha: st.flameFill * 0.55, blend: true });
        }
        if (st.flash) ov.rect(0, 0, 960, 540, { flat: [1, 0.86, 0.45, 1], alpha: clamp(st.flash, 0, 1), blend: true });
        if (st.streaks) ov.rect(0, -210, 960, 960, { texture: extra.streaks, additive: true, alpha: st.streaks });
      }
    }

    function card(texKey, zoom, fade) {
      ov.begin();
      const z = zoom || 1;
      const w = 960 * z, h = 540 * z;
      ov.rect((960 - w) / 2, (540 - h) / 2, w, h, { texture: T(texKey) });
      if (fade !== undefined && fade < 1) ov.rect(0, 0, 960, 540, { flat: [0, 0, 0, 1], alpha: 1 - fade, blend: true });
    }

    return {
      warm() {
        ['title', 'barnWall', 'corrugated', 'woodPlanks', 'darkPlanks', 'dirt', 'tuft', 'crate', 'dynamite', 'bluSign', 'drill', 'noSmoking', 'number3', 'siloLogo', 'sky', 'corn', 'gate', 'blood'].forEach(k => Art.tex(r, W.tex, k));
        SHARED.forEach(T);
        Object.keys(Sol.HAND_POSES).forEach(p => ['L', 'R'].forEach(s => Sol.handMesh(SP, s, p)));
        const noop = { draw() {} };
        [5, 45, 47, 62, 75, 80].forEach(t => {
          const st = Script.stage(t);
          (st.actors || []).forEach(a => Fab.draw(noop, FP, a, Fab.solve(a.cls, a.pose), {}));
          (st.heads || []).forEach(h => Fab.draw(noop, FP, { cls: h.cls, team: 'blu', hat: 'none', face: HEAD_FACES[h.cls] || {}, eyewear: HEAD_WEAR[h.cls] }, { head: M4.ident() }, {}));
        });
      },
      render(t) {
        const st = Script.stage(t);
        if (st.kind === 'black') {
          r.clear([0, 0, 0]);
        } else if (st.kind === 'card') {
          r.clear([0, 0, 0]);
          card(st.cards[0].tex, st.cards[0].zoom, st.fade);
        } else if (st.kind === 'flash') {
          const b = Script.stage(59.9);
          scene(b);
          ov.begin();
          const k = clamp(st.u / 0.29, 0, 1);
          ov.rect(0, 0, 960, 540, { flat: [1, lerp(0.95, 0.62, k), lerp(0.7, 0.15, k), 1], alpha: 0.92, blend: true });
          ov.rect(0, -210, 960, 960, { texture: extra.streaks, additive: true, alpha: 0.8 * (1 - k) });
          if (k > 0.55) ov.rect(380, 0, 260, 540, { texture: extra.dust, blend: true, alpha: (k - 0.55) * 1.6, tint: [0.4, 0.3, 0.2] });
        } else if (st.kind === 'dust') {
          const b = Script.stage(63.32);
          scene(b);
          ov.begin();
          ov.rect(-200, -100, 1360, 740, { texture: extra.dust, blend: true, alpha: clamp(1 - st.u / 0.24, 0, 1) * 0.95 });
        } else {
          scene(st);
        }
        return { polys: Math.round(fx.polys + r.polys), shot: st.shot };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Meet the Soldier.mp3',
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
