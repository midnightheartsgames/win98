(function () {
  const { M4 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, clamp } = K;
  const A = window.KafkaArt;
  const World = window.KafkaWorld;
  const Cast = window.KafkaCast;
  const Fx = window.KafkaFx;
  const Script = window.KafkaScript;

  const OV_W = 480;
  const OV_H = 270;

  const TEX = {
    studio: [512, 288, A.studioLogo],
    credits: [512, 64, A.credits],
    hsr: [512, 256, A.hsrLogo],
    posterBack: [1024, 576, A.posterBack],
    posterName: [512, 160, A.posterName],
    blotWhite: [512, 288, A.blot(4, { bg: '#0b0a1c', ink: ['#ffffff', '#ffb6dc', '#ff5aa8'], blur: 3, alpha: 0.7, count: 40 })],
    blotInk: [512, 288, A.blot(9, { bg: '#c4135e', ink: ['#14040c'], count: 30 })],
    blotDark: [512, 288, A.blot(12, { bg: '#0e0410', ink: ['#a01058', '#5a0830'], count: 34 })],
    blotRed: [512, 288, A.blot(15, { bg: '#08040a', ink: ['#c01048', '#70062a'], count: 14, size: 0.08, blur: 6, core: 'rgba(255,40,110,0.55)' })],
    blotPsy: [512, 288, A.blot(22, { bg: '#10202a', ink: ['#2a8a8a', '#5a2a8a', '#a02a90', '#1a4a6a'], count: 46, blur: 2, size: 0.18 })],
    blotSplash: [512, 512, A.blot(27, { bg: '#0a0306', ink: ['#b0102e', '#e0204a', '#600818'], count: 60, size: 0.2 })],
    blotHands: [512, 288, A.blot(33, { clear: true, ink: ['#08040a', '#1a0a14'], count: 36, size: 0.16 })],
    inkEdges: [512, 288, A.edges(41)],
    words: [512, 288, A.words('видите')],
    wordsVy: [512, 288, A.words('вы', 'ВЫ')],
    spiral: [512, 288, A.spiral],
    crystal: [512, 288, A.crystal],
    emblemDark: [512, 288, A.emblemDark],
    eyeShape: [512, 288, A.eyeShape],
    spiderGlow: [128, 128, A.spiderGlow],
    qWhat: [512, 96, A.caption('что вы видите?', '#f4e8f0', 'rgba(255,90,170,0.8)', 0.42)],
    qSee: [512, 128, A.glowWord('ВИДИТЕ?', '#ff3aa8')],
    entracte: [512, 128, A.caption('Антракт', '#ffffff', 'rgba(255,240,220,0.9)', 0.5)],
    cardMcGuffin: [512, 288, A.card('Макгаффин', { bg: '#f0a8c4' })],
    cardNonlinear: [512, 288, A.card('Нелинейная структура', { bg: '#f4c0d4', size: 0.075 })],
    cardOneiric: [512, 288, A.card('Онейрическая структура', { bg: '#2a6a5a', size: 0.072, glow: 'rgba(200,255,230,0.7)', ink: '#6a3a5a' })],
    kaleido: [512, 512, A.kaleido],
    bokeh: [512, 288, A.bokeh],
    cracks: [512, 288, A.cracks],
    flare: [256, 64, A.flare],
    halo: [128, 128, A.halo],
    star: [128, 128, A.star]
  };

  const INVERT = new Float32Array([-1, 0, 0, 0, -1, 0, 0, 0, -1]);

  function create(r) {
    const W = World.build(r);
    const V = Cast.build(r);
    const X = Fx.build(r);
    const ov = K.overlay(r, OV_W, OV_H);
    const T = {};
    const F = r.frameTexture(false);
    const mirrorH = K.mesh(r, b => b.quad([0.5, 0, 0], [1, 0, 0], [1, 1, 0], [0.5, 1, 0], [1, 1, 1, 1], [[0.5, 1], [0, 1], [0, 0], [0.5, 0]]));
    const mirrorV = K.mesh(r, b => b.quad([0, 0.5, 0], [1, 0.5, 0], [1, 1, 0], [0, 1, 0], [1, 1, 1, 1], [[0, 0.5], [1, 0.5], [1, 1], [0, 1]]));
    const screenM = M4.chain(M4.translate(0, OV_H, 0), M4.scale(OV_W, -OV_H, 1));

    function tex(key) {
      if (!T[key]) {
        const d = TEX[key];
        T[key] = r.texture(d[0], d[2], { height: d[1], clamp: true });
      }
      return T[key];
    }

    function layer(L) {
      const sc = L.scale || 1;
      const w = OV_W * (L.w || 1) * sc, h = OV_H * (L.h || 1) * sc;
      const cx = OV_W * (0.5 + (L.x || 0)), cy = OV_H * (0.5 - (L.y || 0));
      const m = M4.chain(M4.translate(cx, cy, 0), M4.rotZ(L.rot || 0), M4.scale(w, -h, 1), M4.translate(-0.5, -0.5, 0));
      const opts = { texture: tex(L.tex), tint: L.tint || [1, 1, 1], noFog: true };
      const a = L.alpha === undefined ? 1 : L.alpha;
      if (a <= 0.003) return;
      if (L.additive) Object.assign(opts, { additive: true, alpha: a });
      else if (a < 1) Object.assign(opts, { blend: true, alpha: a });
      r.draw(ov.quad, m, opts);
    }

    function grab() {
      r.grab(F, 0, 0, r.canvas.width, r.canvas.height);
    }

    function chroma(px) {
      grab();
      ov.begin();
      r.draw(ov.quad, screenM, { texture: F, tint: [0, 1, 0] });
      r.draw(ov.quad, M4.chain(M4.translate(px, 0, 0), screenM), { texture: F, tint: [1, 0, 0], additive: true });
      r.draw(ov.quad, M4.chain(M4.translate(-px, 0, 0), screenM), { texture: F, tint: [0, 0, 1], additive: true });
    }

    function zoomBlur(k) {
      grab();
      ov.begin();
      for (let i = 1; i <= 3; i++) {
        const s = 1 + k * i * 0.35;
        const m = M4.chain(M4.translate(OV_W / 2, OV_H / 2, 0), M4.scale(s, s, 1), M4.translate(-OV_W / 2, -OV_H / 2, 0), screenM);
        r.draw(ov.quad, m, { texture: F, blend: true, alpha: 0.32 });
      }
    }

    function kaleido(mode) {
      grab();
      ov.begin();
      r.draw(mirrorH, screenM, { texture: F });
      if (mode > 1) {
        grab();
        ov.begin();
        r.draw(mirrorV, screenM, { texture: F });
      }
    }

    function streaks(t, k) {
      ov.begin();
      const g = window.P3D.rand(Math.floor(t * 30));
      for (let i = 0; i < 26; i++) {
        const x = g() * OV_W, w = 2 + g() * 26;
        r.draw(ov.quad, M4.chain(M4.translate(x, 0, 0), M4.scale(w, OV_H, 1)), { flat: [1, 0.5 + g() * 0.5, 0.85, 0.35 * k], blend: true });
      }
    }

    function scene(st, t) {
      const env = Script.ENVS[st.env] || Script.ENVS.hallBlue;
      const grade = st.bw ? [1.05, 1.05, 1.05, 1] : (st.grade || Script.GRADE[st.env] || [1.02, 1.0, 1.04, 0]);
      const camera = Object.assign({
        near: 0.02,
        far: 140,
        grade,
        colorAdd: [0.01, 0.004, 0.012],
        fx: { grain: 0.014, vignette: st.vignette === undefined ? 0.22 : st.vignette, time: t }
      }, st.camera);
      if (st.invert) {
        camera.colorM = INVERT;
        camera.colorAdd = [1, 1, 1];
      }
      const keep = Boolean(st.bg || st.backdrop.length);
      r.begin(env, camera, null, keep);
      if (st.set !== 'none') World.draw(r, W, st);
      if (st.kafka) Cast.drawKafka(r, V, st.kafka, st.kafkaFlat ? { flat: st.kafkaFlat } : null);
      st.ghosts.forEach(g => Cast.drawKafka(r, V, g.pose, g.opts));
      st.guards.forEach(g => Cast.drawGuard(r, V, g, g.flat ? { flat: g.flat } : null));
      if (st.coin) {
        const c = st.coin;
        const m = M4.chain(M4.translate(c.p[0], c.p[1], c.p[2]), M4.rotY(c.ry || 0), M4.rotX(c.rx || 0), M4.rotZ(c.rz || 0), M4.scale(c.s, c.s, c.s));
        r.draw(V.props.coin, m);
        r.draw(V.props.coinFront, m, { texture: V.props.coinFaceTex });
        r.draw(V.props.coinBack, m, { texture: V.props.coinBackTex });
      }
      if (st.katana) {
        const kt = st.katana;
        const m = Cast.propMatrix(kt.p, kt.dir, kt.up || [0, 1, 0]);
        r.draw(V.props.katana, m, { texture: V.props.wrapTex });
        r.draw(V.props.katanaMetal, m);
        if (kt.sheath) r.draw(V.props.sheath, Cast.propMatrix(kt.sheath.p, kt.sheath.dir, kt.up || [0, 1, 0]));
      }
      st.casings.forEach(c => r.draw(W.ruins.casing, M4.chain(M4.translate(c.p[0], c.p[1], c.p[2]), M4.rotY(c.r), M4.rotZ(PI / 2 + c.r * 0.7))));
      const flatPetals = st.petalFlat || (st.bw ? [0.82, 0.05, 0.14, 1] : null);
      if (st.petals.length) Fx.petals(r, X, st.petals, flatPetals);
      let polys = r.polys;
      if (st.bw) {
        r.begin(env, Object.assign({}, camera, { grade: [1.04, 1.0, 1.04, 0] }), null, true);
      }
      if (st.shards.length) Fx.shards(r, X, st.shards, true);
      if (st.cones.length) Fx.cones(r, X, st.cones);
      if (st.smokes.length) Fx.sprites(r, X, camera, st.smokes);
      if (st.lines.length) Fx.lines(r, X, camera, st.lines);
      if (st.sprites.length) Fx.sprites(r, X, camera, st.sprites);
      polys += r.polys;
      if (st.fg.length) {
        if (st.bw) r.begin(env, camera, null, true);
        st.fg.forEach(g => Cast.drawGuard(r, V, g));
        polys += r.polys;
      }
      return polys;
    }

    return {
      warm() {
        Object.keys(TEX).forEach(tex);
      },
      render(t) {
        const st = Script.stage(t);
        let polys = 0;
        const has3d = st.kind === 'scene';
        if (st.bg || st.backdrop.length) {
          r.clear(st.bg || [0, 0, 0]);
          if (st.backdrop.length) {
            ov.begin();
            st.backdrop.forEach(layer);
          }
        }
        if (has3d) polys = Math.round(scene(st, t));
        if (st.kaleido) kaleido(st.kaleido);
        if (st.zoomBlur > 0) zoomBlur(st.zoomBlur);
        if (st.chroma > 0) chroma(st.chroma);
        if (st.front.length) {
          ov.begin();
          st.front.forEach(layer);
        }
        if (st.streaks > 0) streaks(t, st.streaks);
        const flash = st.flash > 0.004;
        const fade = st.fade < 0.996;
        if (flash || fade) {
          ov.begin();
          if (fade) ov.rect(0, 0, OV_W, OV_H, { flat: [0, 0, 0, 1 - clamp(st.fade, 0, 1)], blend: true });
          if (flash) ov.rect(0, 0, OV_W, OV_H, { flat: [st.flashColor[0], st.flashColor[1], st.flashColor[2], clamp(st.flash, 0, 1)], blend: true });
        }
        return { polys: polys + 2 };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: "content/YouVid/Kafka's The Irony of Drama.mp3",
    duration: Script.DURATION,
    aspect: 16 / 9,
    cuts: Script.CUTS,
    stage: Script.stage,
    voiceAt: Script.VOICE,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
