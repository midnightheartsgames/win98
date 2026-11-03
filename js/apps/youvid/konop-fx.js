(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, frac } = K;
  const Rig = window.YouVidRig;
  const A = window.KonopArt;

  const LOGO = [
    { key: 'kono', text: 'この', x: -2.18, y: 0.73, w: 1.2, h: 0.75, col: [0.36, 0.17, 0.23], small: true },
    { key: 'su', text: '素', x: -1.0, y: 0.9, w: 1.32, h: 1.32, col: [0.9, 0.08, 0.48] },
    { key: 'ba', text: '晴', x: 0.32, y: 0.95, w: 1.42, h: 1.42, col: [0.95, 0.6, 0.1] },
    { key: 'rashii', text: 'らしい', x: 1.62, y: 0.78, w: 1.35, h: 0.72, col: [0.36, 0.17, 0.23], small: true, slant: 0.12 },
    { key: 'se', text: '世', x: -2.78, y: -0.37, w: 1.22, h: 1.22, col: [0.9, 0.08, 0.48] },
    { key: 'kai', text: '界', x: -1.53, y: -0.47, w: 1.32, h: 1.32, col: [0.95, 0.6, 0.1] },
    { key: 'ni', text: 'に', x: -0.6, y: -0.42, w: 0.72, h: 0.72, col: [0.36, 0.17, 0.23], small: true },
    { key: 'shuku', text: '祝', x: 0.27, y: -0.35, w: 1.38, h: 1.38, col: [0.9, 0.08, 0.48] },
    { key: 'fuku', text: '福', x: 1.57, y: -0.35, w: 1.46, h: 1.46, col: [0.95, 0.6, 0.1] },
    { key: 'wo', text: 'を', x: 2.5, y: -0.47, w: 0.66, h: 0.66, col: [0.36, 0.17, 0.23], small: true },
    { key: 'bang', text: '!', x: 3.02, y: -0.55, w: 1.0, h: 2.0, col: [0.9, 0.08, 0.48] }
  ];

  function build(r) {
    const tex = (w, h, fn, clampIt) => r.texture(w, fn, { height: h, clamp: clampIt !== false });
    const X = {
      sprite: K.mesh(r, b => b.quad([-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]])),
      strip: K.mesh(r, b => b.quad([-1, 0, 0], [1, 0, 0], [1, 1, 0], [-1, 1, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]])),
      disc: K.mesh(r, b => b.quad([-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]])),
      sphere: K.mesh(r, b => b.ellipsoid(1, 1, 1, 16, 10, [1, 1, 1, 1])),
      cyl: K.mesh(r, b => b.prism(16, 1, 1, 0, 1, 1, 1, [1, 1, 1, 1], { capTop: false })),
      cube: K.mesh(r, b => b.box(1, 1, 1, rgb(0x5ab8ff, 0.7))),
      cubeEdge: K.mesh(r, b => b.box(1.06, 1.06, 1.06, rgb(0xd8f4ff, 1))),
      glyph: K.mesh(r, b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]])),
      glowTex: tex(128, 128, A.glow),
      sparkTex: tex(128, 128, A.spark),
      bubbleTex: tex(128, 128, A.bubble),
      featherTex: tex(128, 128, A.feather),
      puffTex: tex(128, 128, A.puffSprite('#f2ead8', '#c8b898', 1801)),
      smokeTex: tex(128, 128, A.puffSprite('#4a4644', '#2a2826', 1803)),
      dustTex: tex(128, 128, A.puffSprite('#e0d4bc', '#b8a888', 1805)),
      cloudTex: tex(128, 128, A.puffSprite('#ffffff', '#c8d8f0', 1807)),
      streakTex: tex(256, 32, A.streak),
      crossTex: tex(256, 256, A.crossStar),
      circleTex: tex(512, 512, A.magicCircle),
      fireTex: tex(64, 128, A.fireTex),
      domeTex: tex(256, 256, A.dome),
      ribbonTex: tex(64, 16, A.ribbon),
      glyphs: {}
    };
    LOGO.forEach(g => {
      const w = Math.round(256 * Math.max(1, g.w / g.h)), h = 256;
      X.glyphs[g.key] = tex(w, h, A.glyph(g.text, { size: g.small ? 0.8 : 0.94, fat: g.small ? 0.07 : 0.028, slant: g.slant }));
    });
    X.subtitle = tex(1024, 64, A.wordTex('KONO SUBARASHII SEKAI NI SYUKUFUKU WO!', { size: 0.78, col: '#5a2a3a', font: A.LAT, weight: '900' }));
    return X;
  }

  function camBasis(cam) {
    const f = V3.norm(V3.sub(cam.at, cam.eye));
    let right = V3.cross(f, cam.up || [0, 1, 0]);
    right = V3.len(right) < 1e-5 ? [1, 0, 0] : V3.norm(right);
    const up = V3.cross(right, f);
    return { f, right, up };
  }

  function billboard(pos, cam, sx, sy, roll) {
    const B = camBasis(cam);
    const c = C(roll || 0), s = S(roll || 0);
    const x = V3.add(V3.mul(B.right, c), V3.mul(B.up, s));
    const y = V3.sub(V3.mul(B.up, c), V3.mul(B.right, s));
    return Rig.basisM(pos, V3.mul(x, sx), V3.mul(y, sy), V3.mul(B.f, -1));
  }

  const KIND = {
    glow: ['glowTex', 'add'],
    spark: ['sparkTex', 'add'],
    bubble: ['bubbleTex', 'add'],
    feather: ['featherTex', 'cut'],
    puff: ['puffTex', 'blend'],
    smoke: ['smokeTex', 'blend'],
    dust: ['dustTex', 'blend'],
    cloud: ['cloudTex', 'cut'],
    streak: ['streakTex', 'add'],
    cross: ['crossTex', 'add'],
    fire: ['fireTex', 'add']
  };

  function sprites(r, X, cam, list) {
    list.forEach(s => {
      const k = KIND[s.kind || 'glow'];
      const a = s.alpha === undefined ? 1 : s.alpha;
      if (a <= 0.003) return;
      const m = billboard(s.p, cam, s.size * (s.sx || 1), s.size * (s.sy || 1), s.roll || 0);
      const opts = { texture: X[k[0]], tint: s.color || [1, 1, 1], noFog: true };
      if (k[1] === 'add') Object.assign(opts, { additive: true, alpha: a });
      else if (k[1] === 'blend' || a < 1) Object.assign(opts, { blend: true, alpha: a });
      r.draw(X.sprite, m, opts);
    });
  }

  function line(r, X, cam, a, b, width, color, alpha, tex) {
    const dir = V3.sub(b, a);
    if (V3.len(dir) < 1e-5) return;
    const mid = V3.mul(V3.add(a, b), 0.5);
    const view = V3.sub(cam.eye, mid);
    let side = V3.cross(dir, view);
    if (V3.len(side) < 1e-6) side = [1, 0, 0];
    side = V3.mul(V3.norm(side), width / 2);
    const n = V3.norm(V3.cross(side, dir));
    const a0 = alpha === undefined ? 1 : alpha;
    const opts = tex ? { texture: X[tex], additive: true, tint: color || [1, 1, 1], alpha: a0, noFog: true } : { flat: [color[0], color[1], color[2], a0], blend: true };
    r.draw(X.strip, Rig.basisM(a, side, dir, n), opts);
  }

  function lines(r, X, cam, list) {
    list.forEach(l => line(r, X, cam, l.a, l.b, l.w || 0.03, l.color || [1, 1, 1], l.alpha, l.tex));
  }

  function ribbon(r, X, cam, pts, width, color, alpha) {
    for (let i = 0; i < pts.length - 1; i++) line(r, X, cam, pts[i], pts[i + 1], width * (1 - i / pts.length * 0.5), color, alpha);
  }

  function circles(r, X, list) {
    list.forEach(c => {
      const m = M4.chain(M4.translate(c.p[0], c.p[1], c.p[2]), M4.rotY(c.yaw || 0), M4.rotX(c.tilt || 0), M4.rotY(c.spin || 0), M4.scale(c.r, 1, c.r));
      r.draw(X.disc, m, { texture: X.circleTex, additive: true, alpha: c.alpha === undefined ? 1 : c.alpha, tint: c.color || [1, 0.85, 0.7], noFog: true });
    });
  }

  function domes(r, X, list) {
    list.forEach(d => {
      const m = M4.chain(M4.translate(d.p[0], d.p[1], d.p[2]), M4.scale(d.r, d.r * (d.squash || 1), d.r));
      r.draw(X.sphere, m, d.flat ? { flat: [d.flat[0], d.flat[1], d.flat[2], d.alpha === undefined ? 1 : d.alpha], blend: (d.alpha || 1) < 1 } : { tint: d.color || [1, 0.8, 0.4], additive: true, alpha: d.alpha === undefined ? 1 : d.alpha, noFog: true });
    });
  }

  function pillars(r, X, list) {
    list.forEach(p => {
      const m = M4.chain(M4.translate(p.p[0], p.p[1], p.p[2]), M4.scale(p.r, p.h, p.r));
      r.draw(X.cyl, m, { flat: [p.color[0], p.color[1], p.color[2], p.alpha === undefined ? 0.6 : p.alpha], additive: true });
    });
  }

  function cubes(r, X, list) {
    list.forEach(c => {
      const m = M4.chain(M4.translate(c.p[0], c.p[1], c.p[2]), M4.rotY(c.ry || 0), M4.rotX(c.rx || 0), M4.scale(c.s, c.s, c.s));
      r.draw(X.cubeEdge, m, { blend: true, alpha: 0.45 });
      r.draw(X.cube, M4.mul(m, M4.scale(0.92, 0.92, 0.92)));
    });
  }

  function field(seed, n, center, size, t, o) {
    const opt = o || {};
    const g = rand(seed);
    const out = [];
    for (let i = 0; i < n; i++) {
      const bx = (g() - 0.5) * size[0], by = g() * size[1], bz = (g() - 0.5) * size[2];
      const sp = 0.6 + g() * 0.8, ph = g() * PI * 2;
      const fall = opt.fall || 0;
      const rise = opt.rise || 0;
      const y = size[1] * frac((by - fall * sp * t + rise * sp * t) / size[1] + 10);
      const drift = opt.drift || [0, 0, 0];
      const tw = opt.twinkle ? 0.5 + 0.5 * S(t * (3 + g() * 5) + ph) : 1;
      out.push({
        p: [center[0] + bx + S(t * sp * 0.8 + ph) * (opt.sway || 0) + drift[0] * t, center[1] + y - size[1] / 2 * (opt.center ? 1 : 0), center[2] + bz + C(t * sp * 0.6 + ph) * (opt.sway || 0) + drift[2] * t],
        size: (opt.size || 0.05) * (0.5 + g()),
        roll: opt.spin ? t * opt.spin * sp + ph : ph,
        kind: opt.kind || 'spark',
        color: opt.color,
        alpha: (opt.alpha === undefined ? 1 : opt.alpha) * tw
      });
    }
    return out;
  }

  function burst(seed, n, center, radius, k, o) {
    const opt = o || {};
    const g = rand(seed);
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = g() * PI * 2, e = (g() - (opt.up ? 0.1 : 0.5)) * PI * (opt.flat ? 0.3 : 1);
      const d = radius * (0.3 + g() * 0.7) * k;
      out.push({
        p: [center[0] + C(a) * C(e) * d, center[1] + S(e) * d * (opt.ys || 1) - (opt.grav || 0) * k * k, center[2] + S(a) * C(e) * d * (opt.zs || 1)],
        size: (opt.size || 0.1) * (0.5 + g()) * (opt.grow ? 0.4 + k : 1),
        roll: g() * PI * 2,
        kind: opt.kind || 'glow',
        color: opt.color,
        alpha: (opt.alpha === undefined ? 1 : opt.alpha) * (opt.fade ? clamp(1 - k, 0, 1) : 1)
      });
    }
    return out;
  }

  function logo(r, X, glyphs, sub) {
    glyphs.forEach(g => {
      const L = LOGO.find(q => q.key === g.key);
      if (!L || (g.alpha !== undefined && g.alpha <= 0.01)) return;
      const base = M4.chain(M4.translate(g.p[0], g.p[1], g.p[2]), M4.rotY(g.ry || 0), M4.rotX(g.rx || 0), M4.rotZ(g.rz || 0), M4.scale(L.w * (g.s || 1), L.h * (g.s || 1), g.s || 1));
      const layers = g.layers || 8;
      const depth = (L.small ? 0.1 : 0.16) / (L.w > L.h ? L.h : 1);
      for (let i = layers - 1; i >= 0; i--) {
        const k = i / (layers - 1);
        const shade = i === 0 ? 1 : 0.62 - 0.08 * k;
        const col = [L.col[0] * shade, L.col[1] * shade, L.col[2] * shade];
        r.draw(X.glyph, M4.chain(base, M4.translate(0, 0, -depth * k)), { texture: X.glyphs[L.key], tint: col, noFog: true });
      }
    });
    if (sub && sub.alpha > 0.01) {
      const m = M4.chain(M4.translate(sub.p[0], sub.p[1], sub.p[2]), M4.scale(5.3 * (sub.s || 1), 0.33 * (sub.s || 1), 1));
      r.draw(X.glyph, m, { texture: X.subtitle, noFog: true, tint: [1, 1, 1], blend: sub.alpha < 1, alpha: sub.alpha });
    }
  }

  window.KonopFx = { LOGO, build, camBasis, billboard, sprites, line, lines, ribbon, circles, domes, pillars, cubes, field, burst, logo };
})();
