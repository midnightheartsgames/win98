(function () {
  const Fx = window.NagFx;
  const Cast = window.NagCast;
  const World = window.NagWorld;
  const Script = window.NagScript;
  const A = window.NagArt;

  const ENVS = {
    toon: { sunDir: [-0.25, -0.5, -0.83], sunColor: [0.36, 0.36, 0.36], ambTop: [0.84, 0.84, 0.86], ambBottom: [0.6, 0.6, 0.64], fogColor: [0, 0, 0], fogNear: 300, fogFar: 600 },
    side: { sunDir: [-0.85, -0.35, -0.4], sunColor: [0.5, 0.5, 0.5], ambTop: [0.7, 0.7, 0.72], ambBottom: [0.46, 0.46, 0.5], fogColor: [0, 0, 0], fogNear: 300, fogFar: 600 },
    room: { sunDir: [0.3, -0.75, -0.6], sunColor: [0.34, 0.34, 0.34], ambTop: [0.86, 0.86, 0.86], ambBottom: [0.62, 0.62, 0.62], fogColor: [0, 0, 0], fogNear: 300, fogFar: 600 },
    dark: { sunDir: [0.6, -0.3, -0.7], sunColor: [0.55, 0.55, 0.6], ambTop: [0.34, 0.34, 0.4], ambBottom: [0.2, 0.2, 0.26], fogColor: [0, 0, 0], fogNear: 300, fogFar: 600 }
  };
  const WHITE = [1, 1, 1, 1];

  function create(r) {
    const fx = Fx.create(r);
    const V = Cast.build(r);
    const W = World.build(r);
    const layers2d = {
      back: { cv: document.createElement('canvas'), o: fx.overlayTexture() },
      front: { cv: document.createElement('canvas'), o: fx.overlayTexture() },
      mid: { cv: document.createElement('canvas'), o: fx.overlayTexture() },
      over: { cv: document.createElement('canvas'), o: fx.overlayTexture() }
    };
    Object.values(layers2d).forEach(l => { l.cv.width = A.W; l.cv.height = A.H; });

    function camOf(L) {
      return Object.assign({ near: 0.02, far: 60 }, L.camera);
    }

    function drawCast(L, opts) {
      L.cast.forEach(c => {
        const m = c.m || Cast.solve(c.who, c.pose);
        c.m = m;
        Cast.drawChar(r, V, c.who, m, c.pose, opts);
        (c.carry || []).forEach(p => World.drawProp(r, W, Object.assign({}, p, { matrix: p.at(m) }), opts));
      });
    }

    function drawProps(L, opts) {
      (L.props || []).forEach(p => World.drawProp(r, W, p, opts));
    }

    function paint2d(which, st, info) {
      const fn = st[which];
      if (!fn) return;
      const l = layers2d[which];
      const stamp = st.stamp + ':' + which;
      if (l.o.stamp !== stamp) {
        const ctx = l.cv.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, l.cv.width, l.cv.height);
        ctx.save();
        fn(ctx, info);
        ctx.restore();
      }
      fx.upload(l.o, l.cv, stamp);
      fx.drawTex(l.o.tex, 1);
    }

    function renderStage(st) {
      const info = { t: st.t, lt: st.lt, k: st.k, f: st.f };
      const masks = [];
      st.layers.forEach((L, i) => {
        if (!L.rim && !L.ink) return;
        r.clear([0, 0, 0]);
        r.begin(ENVS[L.env || 'toon'], camOf(L), null, true);
        drawCast(L, { flat: WHITE });
        if (L.maskProps) drawProps(L, { flat: WHITE });
        masks[i] = fx.grabMask(i);
      });
      r.clear(Fx.hexRgb(st.bg || '#000000'));
      paint2d('back', st, info);
      let polys = 0;
      st.layers.forEach((L, i) => {
        if (masks[i]) fx.edge(masks[i], L.rim, L.ink, L.wob, (st.f % 4) * 1.7 + i);
        r.begin(ENVS[L.env || 'toon'], camOf(L), null, true);
        let ref = 1;
        const own = [];
        if (L.lut) fx.stencilWrite(1);
        if (L.set) World.drawSet(r, W, L.set);
        drawProps(L, null);
        L.cast.forEach(c => {
          c.ref = 0;
          if (c.lut) {
            ref += 1;
            c.ref = ref;
            own.push(c);
          } else if (L.lut) c.ref = 1;
        });
        if (!L.lut && !own.length) fx.stencilOff();
        L.cast.forEach(c => {
          const m = c.m || Cast.solve(c.who, c.pose);
          c.m = m;
          if (c.ref) fx.stencilWrite(c.ref); else if (L.lut || own.length) fx.stencilOff();
          Cast.drawChar(r, V, c.who, m, c.pose, c.flat ? { flat: c.flat } : null);
          (c.carry || []).forEach(p => World.drawProp(r, W, Object.assign({}, p, { matrix: p.at(m) }), null));
        });
        fx.stencilOff();
        polys += r.polys;
        if (L.lut) fx.applyLut(L.lut, 1);
        own.forEach(c => fx.applyLut(c.lut, c.ref));
        if (i === 0) paint2d('mid', st, info);
      });
      paint2d('front', st, info);
      const post = st.post || {};
      if (post.blur) fx.blur(post.blur);
      if (post.fill) fx.fill(post.fill[0], post.fill[1]);
      return polys;
    }

    return {
      warm() {
        Script.WARM.forEach(([who, face]) => Cast.faceTexture(V, who, face));
      },
      render(t) {
        const st = Script.stage(t);
        const polys = renderStage(st);
        paint2d('over', st, { t: st.t, lt: st.lt, k: st.k, f: st.f });
        return { polys: Math.round(polys) };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: "content/YouVid/DON'T TOY WITH ME, MISS NAGATORO Opening   EASY LOVE.mp3",
    duration: Script.DURATION,
    aspect: 16 / 9,
    cuts: Script.CUTS,
    stage: Script.stage,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
