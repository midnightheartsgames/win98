(function () {
  const { M4, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease, mesh } = K;
  const Sets = window.KartSets;
  const Vlad = window.KartVlad;
  const Anime = window.KartAnime;
  const Script = window.KartScript;

  const FLAT_ENV = { sunDir: [0, -1, 0], sunColor: [0, 0, 0], ambTop: [1, 1, 1], ambBottom: [1, 1, 1], fogColor: [0, 0, 0], fogNear: 1000, fogFar: 2000 };
  const TEXT_FOV = 2 * Math.atan(0.25) * 180 / PI;
  const CARD_FOV = 2 * Math.atan(0.5 / 3.2) * 180 / PI;
  const BLUE = [0.3, 0.5, 0.79];

  const BOKEH = [
    [0.93, 0.27, 0.12, 0.2, -0.004, 0.002],
    [0.0, 0.3, 0.09, 0.16, 0.003, -0.002],
    [0.7, 0.12, 0.07, 0.14, -0.003, 0.003],
    [0.17, 0.42, 0.05, 0.12, 0.004, 0.001],
    [0.42, 0.78, 0.06, 0.1, 0.002, -0.003],
    [0.82, 0.7, 0.08, 0.13, -0.002, -0.002],
    [0.6, 0.48, 0.04, 0.1, 0.003, 0.002],
    [0.3, 0.12, 0.05, 0.1, 0.002, 0.003],
    [0.05, 0.85, 0.07, 0.12, 0.003, -0.001]
  ];

  const TITLE_LINES = [['Влад', 0.36], ['савельев', 0.53], ['картинки', 0.69]];
  const GHOST_LINES = [['Влад', 0.2], ['савельев', 0.55], ['картинки', 0.88]];

  function lineTex(text, font, w, h, skew) {
    return (ctx, cw, ch) => {
      ctx.clearRect(0, 0, cw, ch);
      ctx.save();
      ctx.scale(cw / w, ch / h);
      ctx.transform(1, 0, -(skew || 0), 1, (skew || 0) * h / 2, 0);
      ctx.fillStyle = '#ffffff';
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, w / 2, h / 2);
      ctx.restore();
    };
  }

  function bgTex(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w * 0.25, h);
    g.addColorStop(0, '#3e485c');
    g.addColorStop(0.45, '#262e3e');
    g.addColorStop(1, '#0c1018');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function glowTex(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.75, '#9a9a9a');
    g.addColorStop(0.92, '#6a6a6a');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function flareTex(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.05, '#f4f8ff');
    core.addColorStop(0.15, '#7a8aa8');
    core.addColorStop(0.45, '#1c2230');
    core.addColorStop(1, '#000000');
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    [[0, 0.5, 0.012], [0.38, 0.2, 0.008], [-0.5, 0.12, 0.007]].forEach(([ang, len, wd]) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      const g = ctx.createLinearGradient(0, -h * len, 0, h * len);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.5, 'rgba(220,230,255,1)');
      g.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.fillStyle = g;
      ctx.fillRect(-w * wd, -h * len, w * wd * 2, h * len * 2);
      ctx.restore();
    });
  }

  function triM(a, b, c) {
    return new Float32Array([b[0] - a[0], b[1] - a[1], 0, 0, c[0] - a[0], c[1] - a[1], 0, 0, 0, 0, 1, 0, a[0], a[1], 0, 1]);
  }

  function cropProj(fov, aspect, cr) {
    const P = M4.perspective(fov, aspect, 0.03, 200);
    const z = cr.zoom;
    const Cm = new Float32Array([z, 0, 0, 0, 0, z, 0, 0, 0, 0, 1, 0, 2 * cr.dx, -2 * cr.dy, 0, 1]);
    return M4.mul(Cm, P);
  }

  function create(r) {
    const gl = r.gl;
    const sets = Sets.build(r);
    const anime = Anime.build(r);
    const vlad = Vlad.build(r);
    const ov = K.overlay(r, 1, 1);
    const tri = mesh(r, b => b.tri([0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 1, 1]));
    const disc = mesh(r, b => K.discXY(b, 0, 0, 0, 1, 48, [1, 1, 1, 1]));
    const unit = mesh(r, b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1]));
    const L0 = Script.slide('car').pillar[0], L1 = Script.slide('car').pillar[1];
    const cardFront = mesh(r, b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], [[L0, 0], [L1, 0], [L1, 1], [L0, 1]]));
    const T = {
      bg: r.texture(256, bgTex),
      glow: r.texture(64, glowTex),
      flare: r.texture(256, flareTex),
      lines: TITLE_LINES.map(([s]) => r.texture(512, lineTex(s, '400 80px "Segoe UI", Tahoma, Arial, sans-serif', 512, 128, 0.2), { height: 128, clamp: true })),
      ghosts: GHOST_LINES.map(([s]) => r.texture(1024, lineTex(s, '400 150px "Segoe UI", Tahoma, Arial, sans-serif', 1024, 192, 0.2), { height: 192, clamp: true })),
      thanks: [
        r.texture(512, lineTex('Спасибо  за', '400 86px "Segoe UI", Tahoma, Arial, sans-serif', 512, 128), { height: 128, clamp: true }),
        r.texture(512, lineTex('внимание!', '400 86px "Segoe UI", Tahoma, Arial, sans-serif', 512, 128), { height: 128, clamp: true })
      ]
    };
    const F = { a: r.frameTexture(false), b: r.frameTexture(false) };

    function size() {
      return { W: r.canvas.width || 480, H: r.canvas.height || 360 };
    }

    function drawTitle(st) {
      const { W, H } = size();
      const ts = st.title;
      r.clear([0, 0, 0]);
      ov.begin();
      ov.rect(0, 0, 1, 1, { texture: T.bg });
      if (ts.blue > 0) ov.rect(0, 0, 1, 1, { flat: BLUE.concat([ts.blue]), blend: ts.blue < 1 });
      const asp = H / W;
      BOKEH.forEach(([x, y, rad, a, vx, vy], i) => {
        const k = clamp((st.t - 0.25 - i * 0.04) / 0.5, 0, 1);
        if (k <= 0) return;
        const rr = rad * (1 + 0.06 * S(st.t * 0.7 + i));
        const cx = x + vx * st.t, cy = y + vy * st.t;
        ov.rect(cx - rr * asp, cy - rr, rr * 2 * asp, rr * 2, { texture: T.glow, additive: true, alpha: a * k * 0.6 });
      });
      if (ts.ghost > 0) {
        GHOST_LINES.forEach(([, y], i) => {
          const z = 1 + 0.03 * (st.t - 2);
          const w = 1.1 * z, h = 0.2 * z;
          ov.rect(0.5 - w / 2 + 0.01 * S(st.t * 0.4 + i), y - h / 2, w, h, { texture: T.ghosts[i], blend: true, alpha: 0.13 * ts.ghost });
        });
      }
      if (ts.star > 0) {
        const s = ts.starSize;
        ov.rect(0.5 - s * asp, 0.55 - s, s * 2 * asp, s * 2, { texture: T.flare, additive: true, alpha: Math.min(1, ts.star * 1.4) });
      }
      if (ts.textOn > 0) {
        r.begin(FLAT_ENV, { eye: [0, 0, 2], at: [0, 0, 0], fov: TEXT_FOV, near: 0.1, far: 10 }, null, true);
        const sw = 1 - ts.swing;
        TITLE_LINES.forEach(([, y], i) => {
          const lw = 0.62, lh = 0.155;
          const yy = 0.5 - y;
          const m = M4.chain(
            M4.translate(-0.05 * sw * (i - 1), yy + sw * (0.05 - i * 0.03), sw * 0.3),
            M4.rotY(-sw * 0.75),
            M4.rotZ(-sw * (0.12 + i * 0.05)),
            M4.scale(lw * (1 + sw * 0.35), lh * (1 + sw * 0.35), 1)
          );
          r.draw(unit, m, { texture: T.lines[i], blend: true, alpha: ts.textOn, noFog: true });
        });
      }
    }

    function drawSlide(key, t) {
      const { W, H } = size();
      const s = Script.slide(key);
      const cr = Script.crop(key, t);
      r.clear([0, 0, 0]);
      const set = key === 'anime' ? anime : sets[key];
      let rect = null;
      let aspect = W / H;
      if (s.pillar) {
        const x0 = Math.round(s.pillar[0] * W), x1 = Math.round(s.pillar[1] * W);
        rect = { x: x0, y: 0, w: x1 - x0, h: H };
        aspect = rect.w / H;
      }
      const cam = set.camera;
      r.begin(set.env, {
        proj: cropProj(cam.fov, aspect, cr),
        eye: cam.eye,
        at: cam.at,
        up: cam.up || [0, 1, 0],
        grade: set.grade,
        fx: { grain: 0.035, vignette: 0.12, time: Math.floor(t * 30) }
      }, rect);
      set.draw(r);
      if (set.vlad) {
        const p = Object.assign({ up: [0, 1, 0] }, set.vlad);
        Vlad.draw(r, vlad, Vlad.solve(p), p);
      }
      if (key === 'anime') drawThanks(Script.stage(t).thanks);
    }

    function drawThanks(th) {
      if (th.alpha <= 0) return;
      const { W, H } = size();
      ov.begin();
      const asp = H / W;
      [[0.462, 0], [0.628, 1]].forEach(([y, i]) => {
        const w = 0.6 * th.scale, h = w * 0.25 / asp;
        ov.rect(0.5 - w / 2, y - h / 2 + (1 - th.scale) * (i ? -0.05 : 0.05), w, h, { texture: T.thanks[i], tint: [th.shade, th.shade, th.shade], blend: true, alpha: th.alpha });
      });
    }

    function drawLayer(key, t, st) {
      if (key === 'title') drawTitle(st); else drawSlide(key, t);
    }

    function grabTo(tex) {
      const { W, H } = size();
      r.grab(tex, 0, 0, W, H);
    }

    function stencilShape(drawShape) {
      gl.enable(gl.STENCIL_TEST);
      gl.clear(gl.STENCIL_BUFFER_BIT);
      gl.stencilFunc(gl.ALWAYS, 1, 0xff);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
      gl.colorMask(false, false, false, false);
      drawShape();
      gl.colorMask(true, true, true, true);
      gl.stencilFunc(gl.EQUAL, 1, 0xff);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
    }

    function reveal(tex, shapeAt, k) {
      [[k + 0.03, 0.35], [k + 0.015, 0.6], [k, 1]].forEach(([kk, a]) => {
        ov.begin();
        stencilShape(() => shapeAt(Math.min(1, kk)).forEach(tr => r.draw(tri, triM(tr[0], tr[1], tr[2]), { flat: [1, 1, 1, 1] })));
        ov.rect(0, 0, 1, 1, { texture: tex, blend: a < 1, alpha: a });
        gl.disable(gl.STENCIL_TEST);
      });
    }

    function wedgeAt(k) {
      const ay = lerp(0.02, 1.08, ease(clamp(k * 1.8, 0, 1)));
      const ax = lerp(0.5, 0.46, k);
      const th = lerp(0.25, 1.7, ease(clamp(k * 1.25, 0, 1)));
      const far = 4;
      return [[[ax, ay], [ax - S(th) * far, ay - C(th) * far], [ax, ay - far]], [[ax, ay], [ax, ay - far], [ax + S(th * 0.96) * far, ay - C(th * 0.96) * far]]];
    }

    function arrowAt(k) {
      const e = ease(k);
      const ax = lerp(1.0, -1.3, e);
      const spread = lerp(0.02, 3.4, e);
      return [[[ax, 0.42], [1.2, 0.42 - spread], [1.2, 0.42 + spread]]];
    }

    function irisDraw(k) {
      const { W, H } = size();
      const e = ease(k);
      const ry = lerp(0.02, 1.45, e), rx = ry * 0.62 * H / W;
      r.draw(disc, M4.chain(M4.translate(0.5, 1.02, 0), M4.scale(rx, ry, 1)), { flat: [1, 1, 1, 1] });
    }

    function composite(L, t, st) {
      const k = L.k;
      if (L.kind === 'cross') {
        drawLayer(L.a, t, st);
        grabTo(F.a);
        drawLayer(L.b, t, st);
        ov.begin();
        ov.rect(0, 0, 1, 1, { texture: F.a, blend: true, alpha: Math.pow(1 - k, 0.8) });
        const ax = lerp(0.5, -0.02, ease(k));
        const a = 0.85 * clamp(k * 5, 0, 1) * (1 - ease((k - 0.7) / 0.3));
        r.draw(tri, triM([0, -0.02], [0, 1.02], [ax, 0.5]), { flat: BLUE.concat([a]), blend: true });
        r.draw(tri, triM([1, -0.02], [1, 1.02], [1 - ax, 0.5]), { flat: BLUE.concat([a]), blend: true });
        return;
      }
      if (L.kind === 'flip') {
        drawLayer(L.a, t, st);
        grabTo(F.a);
        drawLayer(L.b, t, st);
        grabTo(F.b);
        const { W, H } = size();
        r.clear([0, 0, 0]);
        r.begin(FLAT_ENV, { eye: [0, 0, 3.2], at: [0, 0, 0], fov: CARD_FOV, near: 0.1, far: 10 }, null, true);
        const th = -PI * k;
        const back = th < -PI / 2;
        const ang = back ? th + PI : th;
        const w = back ? W / H : (L1 - L0) * W / H;
        const push = -S(Math.abs(th)) * 0.15;
        r.draw(back ? unit : cardFront, M4.chain(M4.translate(0, 0, push), M4.rotY(ang), M4.scale(w, 1, 1)), { texture: back ? F.b : F.a, noFog: true });
        return;
      }
      drawLayer(L.a, t, st);
      grabTo(F.a);
      drawLayer(L.b, t, st);
      grabTo(F.b);
      ov.begin();
      ov.rect(0, 0, 1, 1, { texture: F.a });
      if (L.kind === 'wedge') reveal(F.b, wedgeAt, k);
      else if (L.kind === 'arrow') reveal(F.b, arrowAt, k);
      else if (L.kind === 'iris') {
        [[k + 0.08, 0.35], [k + 0.04, 0.6], [k, 1]].forEach(([kk, a]) => {
          ov.begin();
          stencilShape(() => irisDraw(Math.min(1, kk)));
          ov.rect(0, 0, 1, 1, { texture: F.b, blend: a < 1, alpha: a });
          gl.disable(gl.STENCIL_TEST);
        });
      }
    }

    return {
      warm() {},
      render(t) {
        const st = Script.stage(t);
        const L = st.layers;
        if (L.kind === 'one') drawLayer(L.a, t, st); else composite(L, t, st);
        return { polys: Math.round(r.polys) };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Влад Савельев картинки.mp3',
    duration: Script.DURATION,
    aspect: 4 / 3,
    cuts: Script.CUTS,
    stage: Script.stage,
    voiceAt: Script.beat,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
