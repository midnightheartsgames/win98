(function () {
  const { M4 } = window.P3D;
  const K = window.YouVidKit;
  const { clamp, lerp, ease } = K;
  const World = window.KleeWorld;
  const Cast = window.KleeCast;
  const Foes = window.KleeFoes;
  const Cards = window.KleeCards;
  const Script = window.KleeScript;

  const OV_W = 480;
  const OV_H = 270;

  const GRADE = {
    day: [1.06, 1.04, 1.0, -0.14],
    sunset: [1.08, 1.0, 0.96, -0.12],
    night: [1.0, 1.02, 1.1, -0.1],
    purple: [1.04, 0.98, 1.1, -0.1],
    hall: [1.02, 1.0, 0.98, -0.04],
    white: [1.0, 1.0, 1.0, -0.06]
  };

  function create(r) {
    const W = World.build(r);
    const V = Cast.build(r);
    const X = Foes.build(r);
    const ov = K.overlay(r, OV_W, OV_H);
    const T = {
      cards: {},
      comic: r.texture(512, Cards.drawComic, { height: 288, clamp: true }),
      comicText: r.texture(768, Cards.drawComicText, { height: 432, clamp: true }),
      iris: r.texture(512, Cards.iris, { clamp: true }),
      logo: r.texture(1024, Cards.hsrLogo, { height: 384, clamp: true }),
      seal: r.texture(256, Cards.seal, { clamp: true }),
      name: r.texture(256, Cards.nameText, { clamp: true }),
      red: r.texture(512, Cards.disc('#c4452c'), { clamp: true }),
      white: r.texture(512, Cards.disc('#fdf9f6'), { clamp: true }),
      labels: r.texture(512, Cards.labels, { height: 128, clamp: true }),
      frame: r.texture(1024, Cards.frameTex, { height: 576, clamp: true }),
      sigil: [0, 1, 2].map(i => r.texture(128, Cards.sigil(i), { clamp: true }))
    };

    function cardTexture(i) {
      if (!T.cards[i]) T.cards[i] = r.texture(768, Cards.drawCard(Cards.CARDS[i]), { height: 432, clamp: true });
      return T.cards[i];
    }

    function discAt(tex, size) {
      if (size < 1) return;
      ov.rect((OV_W - size) / 2, (OV_H - size) / 2, size, size, { texture: tex });
    }

    function drawWipe(st) {
      ov.begin();
      const q = clamp(st.k / 0.22, 0, 1);
      discAt(T.red, 60 + 620 * q * q);
    }

    function drawTitleBackdrop(st) {
      ov.begin();
      discAt(T.red, 640);
      const q = clamp(st.whiteK, 0, 1);
      discAt(T.white, 180 + 400 * q + 80 * q * q);
    }

    function drawIris(st) {
      ov.begin();
      const size = 500 + 700 * ease(clamp(st.iris, 0, 1));
      ov.rect((OV_W - size) / 2, (OV_H - size) / 2, size, size, { blend: true, texture: T.iris });
    }

    function drawLogo(st) {
      const k = st.logoK;
      const out = 1 - ease(clamp((st.t - 96.3) / 0.8, 0, 1));
      if (k < 0.15 || out <= 0) return;
      ov.begin();
      const w = OV_W * 0.8, h = w * 0.375;
      const lineK = ease(clamp((k - 0.15) / 0.55, 0, 1));
      const rise = ease(clamp((k - 0.5) / 0.9, 0, 1));
      const lineY = OV_H / 2 + h * 0.285;
      const lineW = OV_W * 0.86 * lineK;
      const glow = 1 - 0.55 * ease(clamp((k - 1.4) / 0.8, 0, 1));
      ov.rect((OV_W - lineW) / 2, lineY - 1, lineW, 2, { blend: true, alpha: glow * out, flat: [0.96, 0.86, 0.6, 1] });
      ov.rect((OV_W - lineW * 0.5) / 2, lineY - 4, lineW * 0.5, 8, { blend: true, alpha: 0.18 * glow * out, flat: [1, 0.9, 0.62, 1] });
      if (rise <= 0) return;
      const sc = lerp(0.9, 1, rise);
      const lw = w * sc, lh = h * sc;
      const y = (OV_H - lh) / 2 + (1 - rise) * h * 0.45;
      ov.rect((OV_W - lw) / 2, y, lw, lh, { blend: true, texture: T.logo, alpha: rise * out });
    }

    function drawTitleFront(st) {
      const k = st.k;
      ov.begin();
      const frameK = clamp((k - 0.62) / 0.2, 0, 1);
      if (frameK > 0) ov.rect(0, 0, OV_W, OV_H, { blend: true, texture: T.frame, alpha: frameK });
      const sealK = ease(clamp((k - 0.75) / 0.4, 0, 1));
      const sw = 158 * (0.5 + 0.5 * sealK);
      const ringOut = ease(clamp((k - 1.5) / 0.35, 0, 1));
      if (sealK > 0 && ringOut < 1) ov.rect(OV_W * 0.225 - sw / 2, OV_H * 0.5 - sw / 2, sw, sw, { blend: true, texture: T.seal, alpha: sealK * (1 - ringOut) });
      const nw = sw * lerp(1.0, 1.12, ringOut);
      if (ringOut > 0) ov.rect(OV_W * 0.225 - nw / 2, OV_H * 0.5 - nw / 2, nw, nw, { blend: true, texture: T.name, alpha: ringOut });
      const labelK = ease(clamp((k - 1.0) / 0.9, 0, 1));
      if (labelK > 0) ov.rect(OV_W * 0.6 + (1 - labelK) * 50, OV_H * 0.5 - 22, 176, 44, { blend: true, texture: T.labels, alpha: labelK });
    }

    function drawComic(st) {
      const k = st.k;
      const text = st.comic === 'text';
      const pop = text ? 1.18 - 0.14 * ease(clamp(k / 0.5, 0, 1)) : 0.7 + 0.45 * ease(clamp(k / 0.25, 0, 1));
      ov.begin();
      const w = OV_W * pop, h = OV_H * pop;
      ov.rect((OV_W - w) / 2, (OV_H - h) / 2, w, h, { texture: text ? T.comicText : T.comic });
    }

    function drawCast(st) {
      if (st.klee) Cast.drawKlee(r, V, st.klee);
      if (st.jean) Cast.drawBust(r, V, 'jean', st.jean);
      if (st.stelle) Cast.drawStelle(r, V, st.stelle);
      if (st.jeanLegs) Cast.drawJeanLegs(r, V, st.jeanLegs);
      st.hilis.forEach(h => Foes.drawHilichurl(r, X, h));
      if (st.golem) Foes.drawGolem(r, X, st.golem);
      st.dumpties.forEach(d => Foes.drawDumpty(r, X, d));
      st.books.forEach(b => Foes.drawBook(r, X, b));
      st.slimes.forEach(s => Foes.drawSlime(r, X, s));
    }

    function drawEffects(st, cam, t) {
      Foes.drawFlames(r, X, st.flames, t);
      st.blasts.forEach(b => Foes.drawBlast(r, X, b.pos, b.size, b.k, cam));
      Foes.drawBeams(r, X, st.beams, cam);
      Foes.drawGlints(r, X, st.glints, cam, t);
      Foes.drawClovers(r, X, st.clovers, cam, t);
    }

    function drawOverlays(st, t) {
      const showFlash = st.flash > 0.01;
      const showSigil = st.sigil >= 0;
      if (!showFlash && !showSigil) return;
      ov.begin();
      if (showSigil) ov.rect(OV_W - 58, OV_H - 62, 42, 42, { blend: true, texture: T.sigil[st.sigil], alpha: 0.9 });
      if (showFlash) ov.rect(0, 0, OV_W, OV_H, { blend: true, alpha: Math.min(1, st.flash), flat: [st.flashColor[0], st.flashColor[1], st.flashColor[2], 1] });
    }

    return {
      warm() {
        Cards.CARDS.forEach((c, i) => cardTexture(i));
      },
      render(t) {
        const st = Script.stage(t);
        if (st.kind === 'black') {
          r.clear([0, 0, 0]);
          return { polys: 0 };
        }
        if (st.kind === 'logo') {
          r.clear([0, 0, 0]);
          drawLogo(st);
          return { polys: 2 };
        }
        if (st.kind === 'cards') {
          r.clear([0, 0, 0]);
          ov.begin();
          ov.rect(0, 0, OV_W, OV_H, { texture: cardTexture(st.card) });
          return { polys: 2 };
        }
        if (st.overlay === 'comic') {
          r.clear([1, 1, 1]);
          drawComic(st);
          return { polys: 2 };
        }
        const env = Script.ENVS[st.env];
        const g = GRADE[st.env] || GRADE.day;
        const camera = Object.assign({
          near: 0.03,
          far: 140,
          grade: g,
          colorAdd: [0.012, 0.008, 0.004],
          fx: { grain: 0.012, vignette: st.env === 'white' ? 0 : 0.14, time: t }
        }, st.camera);
        const title = st.overlay === 'title';
        if (title) {
          r.clear([0.99, 0.98, 0.97]);
          drawTitleBackdrop(st);
        }
        r.begin(env, camera, null, title);
        const wst = Object.assign({ t }, st);
        if (st.set !== 'none') World.draw(r, W, wst);
        drawCast(st);
        drawEffects(st, camera, t);
        const polys = Math.round(r.polys);
        if (title) drawTitleFront(st);
        if (st.overlay === 'wipe') drawWipe(st);
        if (st.iris !== undefined && st.iris < 1) drawIris(st);
        drawOverlays(st, t);
        return { polys };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/klee.mp3',
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
