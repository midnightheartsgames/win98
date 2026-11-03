(function () {
  const { M4, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, clamp, lerp, ease } = K;
  const A = window.KonopArt;
  const World = window.KonopWorld;
  const Cast = window.KonopCast;
  const Foes = window.KonopFoes;
  const Fx = window.KonopFx;
  const Sh = window.KonopShots;
  const Script = window.KonopScript;

  const OV_W = 480;
  const OV_H = 270;
  const PX = OV_W / 1920;

  const TEX = {
    ring: [1024, 1024, A.ring],
    letterKo: [512, 512, A.cardLetter('こ', '#e5107a', 'KONO')],
    letterNo: [512, 512, A.cardLetter('の', '#f08a00', '')],
    letterSu: [512, 512, A.cardLetter('す', '#8ccc1c', 'SUB')],
    letterBa: [512, 512, A.cardLetter('ば', '#1ea2e2', 'BA')],
    episode: [1024, 256, A.episode],
    copyright: [1024, 48, A.copyright],
    more: [256, 64, A.endLabel('Watch More')],
    subscribe: [256, 64, A.endLabel('Subscribe')],
    watch: [256, 64, A.endLabel('Watch on CR!')],
    speed: [512, 256, A.speedLines],
    glow2d: [128, 128, A.glow],
    streak2d: [256, 32, A.streak],
    cross2d: [256, 256, A.crossStar],
    rays: [256, 256, A.lightRays]
  };

  function creditCanvas(c) {
    const xs = c.lines.map(l => l[1]).concat(c.lines.map(l => l[3]));
    const ys = c.lines.map(l => l[2]).concat(c.lines.map(l => l[4]));
    const pad = 16;
    const box = [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad];
    const sc = 0.5;
    const w = Math.ceil((box[2] - box[0]) * sc), h = Math.ceil((box[3] - box[1]) * sc);
    return { box, w, h, draw: A.textLines(c.lines, { col: c.col, edge: c.edge, x0: box[0], y0: box[1], scale: sc }) };
  }

  function create(r) {
    const W = World.build(r);
    const V = Cast.build(r);
    const F = Foes.build(r);
    const X = Fx.build(r);
    const ov = K.overlay(r, OV_W, OV_H);
    const T = {};
    const CT = {};
    const FT = r.frameTexture(false);
    const screenM = M4.chain(M4.translate(0, OV_H, 0), M4.scale(OV_W, -OV_H, 1));

    function tex(key) {
      if (!T[key]) {
        const d = TEX[key];
        T[key] = r.texture(d[0], d[2], { height: d[1], clamp: true });
      }
      return T[key];
    }

    function creditTex(c) {
      if (!CT[c.id]) {
        const cc = creditCanvas(c);
        CT[c.id] = { box: cc.box, tex: r.texture(cc.w, cc.draw, { height: cc.h, clamp: true }) };
      }
      return CT[c.id];
    }

    function layer(L) {
      const a = L.alpha === undefined ? 1 : L.alpha;
      if (a <= 0.003) return;
      const sc = L.scale || 1;
      const w = OV_W * (L.w || 1) * sc, h = OV_H * (L.h || 1) * sc;
      const cx = OV_W * (0.5 + (L.x || 0)), cy = OV_H * (0.5 - (L.y || 0));
      const m = M4.chain(M4.translate(cx, cy, 0), M4.rotZ(L.rot || 0), M4.scale(w, -h, 1), M4.translate(-0.5, -0.5, 0));
      if (L.flat) {
        r.draw(ov.quad, m, { flat: [L.flat[0], L.flat[1], L.flat[2], a], blend: true });
        return;
      }
      const opts = { texture: tex(L.tex), tint: L.tint || [1, 1, 1], noFog: true };
      if (L.additive) Object.assign(opts, { additive: true, alpha: a });
      else if (a < 1) Object.assign(opts, { blend: true, alpha: a });
      r.draw(ov.quad, m, opts);
    }

    function credits(t) {
      const list = Sh.creditsAt(t);
      if (!list.length) return;
      ov.begin();
      list.forEach((c, ci) => {
        const ct = creditTex(c);
        const age = t - c.t0, left = c.t1 - t;
        const k = c.noGlitch ? 1 : clamp(age / 0.4, 0, 1);
        let alpha = c.noGlitch ? clamp(age / 0.1, 0, 1) : (k < 0.45 ? 0 : k < 0.7 ? (Math.floor(t * 30) % 2 ? 1 : 0.4) : 1);
        alpha *= clamp(left / 0.12, 0, 1);
        if (k < 1) {
          const g = rand(Math.floor(t * 24) + ci * 97);
          const rgbCol = [parseInt(c.col.slice(1, 3), 16) / 255, parseInt(c.col.slice(3, 5), 16) / 255, parseInt(c.col.slice(5, 7), 16) / 255];
          c.lines.forEach(l => {
            const n = 2 + Math.floor(g() * 4);
            for (let i = 0; i < n; i++) {
              const x = lerp(l[1], l[3], g()) * PX, y = lerp(l[2], l[4], 0.2 + g() * 0.6) * PX;
              const s = (l[4] - l[2]) * PX * (0.25 + g() * 0.35);
              const col = g() < 0.5 ? [1, 1, 1] : rgbCol;
              ov.rect(x, y, s * (1 + g() * 1.5), s, { flat: [col[0], col[1], col[2], 1 - k * 0.6] });
            }
          });
        }
        if (alpha > 0.01) {
          const [x0, y0, x1, y1] = ct.box;
          ov.rect(x0 * PX, y0 * PX, (x1 - x0) * PX, (y1 - y0) * PX, alpha < 1 ? { texture: ct.tex, blend: true, alpha, noFog: true } : { texture: ct.tex, noFog: true });
        }
      });
    }

    function blur(radius) {
      const offs = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
      for (let pass = 0; pass < 2; pass++) {
        r.grab(FT, 0, 0, r.canvas.width, r.canvas.height);
        ov.begin();
        const rad = radius * (pass ? 0.55 : 1) * OV_W / r.canvas.width * (r.canvas.width / 480);
        offs.forEach((o, i) => {
          const m = M4.chain(M4.translate(o[0] * rad, o[1] * rad, 0), screenM);
          r.draw(ov.quad, m, i === 0 ? { texture: FT } : { texture: FT, blend: true, alpha: 1 / (i + 1) });
        });
      }
    }

    function endScreen(t) {
      const k = ease(clamp((t - 90.6) / 0.7, 0, 1));
      if (k <= 0) return;
      ov.begin();
      const box = (x0, y0, x1, y1) => {
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, hw = (x1 - x0) / 2 * k, hh = (y1 - y0) / 2 * k;
        const L = (cx - hw) * OV_W, T0 = (cy - hh) * OV_H, Wd = hw * 2 * OV_W, Hd = hh * 2 * OV_H;
        ov.rect(L, T0, Wd, Hd, { flat: [0.55, 0.55, 0.56, 0.62], blend: true });
        const lw = 1.2;
        ov.rect(L, T0, Wd, lw, { flat: [1, 1, 1, 1] });
        ov.rect(L, T0 + Hd - lw, Wd, lw, { flat: [1, 1, 1, 1] });
        ov.rect(L, T0, lw, Hd, { flat: [1, 1, 1, 1] });
        ov.rect(L + Wd - lw, T0, lw, Hd, { flat: [1, 1, 1, 1] });
      };
      box(0.06, 0.11, 0.41, 0.48);
      box(0.06, 0.5, 0.41, 0.86);
      box(0.665, 0.55, 0.805, 0.86);
      const cx = 0.735 * OV_W, cy = 0.255 * OV_H, R = 0.085 * OV_H * 1.78 * k;
      const n = 40;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2;
        const x = cx + Math.cos(a0) * R, y = cy + Math.sin(a0) * R;
        ov.rect(x - 1, y - 1, 2.2, 2.2, { flat: [1, 1, 1, 1] });
      }
      ov.rect(cx - R * 0.7, cy - R * 0.7, R * 1.4, R * 1.4, { flat: [0.55, 0.6, 0.85, 0.5 * k], blend: true });
      const la = clamp((t - 91.2) / 0.3, 0, 1);
      if (la > 0) {
        layer({ tex: 'more', x: -0.265, y: 0.45, w: 0.26, h: 0.09, alpha: la });
        layer({ tex: 'subscribe', x: 0.235, y: 0.45, w: 0.24, h: 0.09, alpha: la });
        layer({ tex: 'watch', x: 0.235, y: 0.0, w: 0.26, h: 0.09, alpha: la });
      }
    }

    function scene(st, t) {
      const env = Sh.ENVS[st.env] || Sh.ENVS.day;
      const camera = Object.assign({
        near: 0.03,
        far: 400,
        grade: st.grade || [1.02, 1.01, 1.0, 0],
        colorAdd: st.colorAdd || [0.006, 0.008, 0.01],
        fx: { grain: 0.008, vignette: st.vignette === undefined ? 0.12 : st.vignette, time: t }
      }, st.camera);
      const keep = Boolean(st.bg || st.backdrop.length);
      if (keep) {
        r.clear(st.bg || [0, 0, 0]);
        if (st.backdrop.length) {
          ov.begin();
          st.backdrop.forEach(layer);
        }
      }
      r.begin(env, camera, null, keep);
      World.draw(r, W, st);
      st.cast.forEach(c => {
        const m = Cast.solve(c.who, c.pose);
        Cast.drawChar(r, V, c.who, m, c.pose);
      });
      st.foes.forEach(f => Foes.draw(r, F, f));
      if (st.cubes.length) Fx.cubes(r, X, st.cubes);
      if (st.domes.length) Fx.domes(r, X, st.domes);
      if (st.circles.length) Fx.circles(r, X, st.circles);
      if (st.pillars.length) Fx.pillars(r, X, st.pillars);
      st.ribbons.forEach(rb => Fx.ribbon(r, X, camera, rb.pts, rb.w, rb.color, rb.alpha));
      if (st.lines.length) Fx.lines(r, X, camera, st.lines);
      if (st.sprites.length) Fx.sprites(r, X, camera, st.sprites);
      let polys = r.polys;
      if (st.veil && st.veil[3] > 0.003) {
        ov.begin();
        ov.rect(0, 0, OV_W, OV_H, { flat: st.veil, blend: st.veil[3] < 1 });
      }
      if (st.logo) {
        const lc = Object.assign({ eye: [0, 0, 10], at: [0, 0, 0], fov: 34, near: 0.1, far: 60 }, st.logo.camera || {});
        r.begin(Sh.ENVS.white, lc, null, true);
        Fx.logo(r, X, st.logo.glyphs, st.logo.sub);
        if (st.logo.sprites) Fx.sprites(r, X, lc, st.logo.sprites);
        polys += r.polys;
      }
      if (st.front.length) {
        ov.begin();
        st.front.forEach(layer);
      }
      return polys;
    }

    function finish(st) {
      const flash = st.flash > 0.004, fade = st.fade < 0.996;
      if (st.speed > 0) {
        ov.begin();
        layer({ tex: 'speed', additive: true, alpha: st.speed, x: st.speedX || 0, y: 0, w: 1.2, h: 1.2, rot: st.speedRot || 0 });
      }
      if (flash || fade) {
        ov.begin();
        if (fade) ov.rect(0, 0, OV_W, OV_H, { flat: [0, 0, 0, 1 - clamp(st.fade, 0, 1)], blend: true });
        if (flash) ov.rect(0, 0, OV_W, OV_H, { flat: [st.flashColor[0], st.flashColor[1], st.flashColor[2], clamp(st.flash, 0, 1)], blend: true });
      }
    }

    return {
      warm() {
        Object.keys(TEX).forEach(tex);
        Object.keys(World.TEX).forEach(k => W.tex(k));
        Sh.CREDITS.forEach(creditTex);
      },
      render(t) {
        const st = Script.stage(t);
        let polys = 0;
        if (st.replay !== undefined) {
          const rs = Script.stage(st.replay);
          polys = scene(rs, st.replay);
          finish(rs);
          blur(3.2);
          endScreen(t);
          finish({ flash: 0, fade: st.fade, speed: 0 });
        } else {
          polys = scene(st, t);
          finish(st);
          credits(t);
          if (st.copyright > 0) {
            ov.begin();
            ov.rect(936 * PX, 970 * PX, 880 * PX, 44 * PX, { texture: tex('copyright'), blend: st.copyright < 1, alpha: st.copyright, noFog: true });
          }
          if (st.episode > 0) {
            ov.begin();
            ov.rect(486 * PX, 410 * PX, 1000 * PX, 256 * PX, { texture: tex('episode'), blend: st.episode < 1, alpha: st.episode, noFog: true });
          }
        }
        return { polys: Math.round(polys) };
      }
    };
  }

  const video = {
    id: Sh.ID,
    audio: 'content/YouVid/KONOSUBA - Opening.mp3',
    duration: Sh.DURATION,
    aspect: 16 / 9,
    cuts: Script.CUTS,
    stage: Script.stage,
    voiceAt: () => 0,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
