(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const Props = window.SairaProps;
  const Sets = window.SairaSets;
  const Hands = window.SairaHands;
  const Script = window.SairaScript;
  const StsCast = window.StsCast;

  const PI_2 = Math.PI / 2;
  const OV_W = 960;
  const OV_H = 540;

  function create(r) {
    const P = Props.build(r);
    const W = Sets.build(r, P);
    const H = Hands.build(r);
    const V = StsCast.build(r);
    const ov = K.overlay(r, OV_W, OV_H);
    const ovTex = {};
    const overlay = (key) => ovTex[key] || (ovTex[key] = P.T[key]);
    let sharp = null, small = null;

    function grade(st) {
      const g = st.gain || [1, 1, 1];
      const c = st.contrast || 1;
      const add = (1 - c) * 0.5 + (st.lift || 0);
      return { colorM: new Float32Array([c * g[0], 0, 0, 0, c * g[1], 0, 0, 0, c * g[2]]), colorAdd: [add, add, add] };
    }

    function drawScene(st, t, rect) {
      const c = st.camera;
      const w = rect ? rect.w : r.canvas.width, h = rect ? rect.h : r.canvas.height;
      const gr = grade(st);
      const env = st.env;
      const camera = {
        proj: M4.perspective(c.fov, w / h, c.near || 0.02, c.far || 40),
        eye: c.eye, at: c.at, up: c.up,
        colorM: gr.colorM, colorAdd: gr.colorAdd,
        fx: { grain: st.grain === undefined ? 0.03 : st.grain, vignette: st.vignette === undefined ? 0.16 : st.vignette, time: K.frac(t * 0.37) * 100 }
      };
      if (st.cookie) env.cookie = { texture: W.cookie, matrix: st.cookie, strength: 1 };
      else delete env.cookie;
      r.begin(env, camera, rect || null, !!rect);
      if (st.set === 'stove') Sets.drawStove(r, P, W, st);
      else if (st.set === 'table') Sets.drawTable(r, P, W, st);
      else if (st.set === 'micro') Sets.drawMicro(r, P, W, st);
      else if (st.set === 'phone') Sets.drawPhone(r, P, W, st);
      else if (st.set === 'stream') Sets.drawStream(r, P, W, st);
      else if (st.set === 'room') Sets.drawVladRoom(r, P, W, st, t);
      (st.cast || []).forEach(a => {
        const m = StsCast.solve(a.who, a.pose);
        StsCast.draw(r, V, a.who, m, a.who === 'vlad' ? Object.assign({}, a.pose, { hat: false }) : a.pose);
        if (a.who === 'vlad') r.draw(W.hat, m.head);
        (a.hands || []).forEach(h => Hands.draw(r, H, h.tattoo ? Object.assign({}, h, { tattooTex: P.T.tattoo }) : h));
        (a.held || []).forEach(p => Sets.drawProp(r, P, Object.assign({}, p, { M: m['hand' + p.side] })));
        if (a.headset) r.draw(P.headset, M4.chain(m.head, M4.translate(0, 0.02, -0.01)));
        if (a.print) {
          r.draw(P.unitQuad, M4.chain(m.chest, M4.translate(0.0, 0.1, 0.276), M4.rotX(PI_2), M4.scale(0.2, 1, 0.2)), { texture: P.T.shirtFront });
        }
      });
      (st.props || []).forEach(p => Sets.drawProp(r, P, p));
      (st.handProps || []).forEach(p => Sets.drawProp(r, P, p, p.rig));
      (st.hands || []).forEach(h => Sets.drawHeld(r, P, H, h));
      if (st.steam) Sets.drawSteam(r, P, c, st.steam, t);
    }

    return {
      warm() {
        for (let t = 0; t < Script.DURATION; t += 0.5) {
          const st = Script.stage(t);
          (st.cast || []).forEach(a => V.get(a.who).outfitFor(StsCast.outfitOf(a.who, a.pose)));
        }
        Object.keys(window.SairaArt.DRAW).forEach(k => P.T[k]);
      },
      render(t) {
        const st = Script.stage(t);
        const w = r.canvas.width, h = r.canvas.height;
        r.clear([0, 0, 0]);
        if (st.portrait) {
          const pw = Math.round(h * 9 / 16);
          const rect = { x: Math.round((w - pw) / 2), y: 0, w: pw, h };
          drawScene(st, t, rect);
          if (!sharp) { sharp = r.frameTexture(); small = r.frameTexture(); }
          r.grab(sharp, rect.x, 0, rect.w, h);
          const sw = Math.max(8, Math.round(w / 40)), sh = Math.max(14, Math.round(h / 14));
          ov.begin();
          ov.rect(0, OV_H - OV_H * (sh / h), OV_W * (sw / w), OV_H * (sh / h), { texture: sharp });
          r.grab(small, 0, 0, sw, sh);
          ov.begin();
          ov.rect(0, 0, OV_W, OV_H, { flat: [0, 0, 0, 1] });
          const tx = OV_W * 0.5 / sw, ty = OV_H * 2.1 / sh;
          let n = 0;
          [-0.5, 0, 0.5].forEach(dx => [-0.5, 0, 0.5].forEach(dy => {
            n++;
            const o = { texture: small, tint: [0.82, 0.8, 0.78], blend: true, alpha: 1 / n };
            ov.rect(-OV_W * 0.08 + dx * tx, -OV_H * 0.62 + dy * ty, OV_W * 0.5, OV_H * 2.1, o);
            ov.rect(OV_W * 0.58 + dx * tx, -OV_H * 0.62 + dy * ty, OV_W * 0.5, OV_H * 2.1, o);
          }));
          ov.rect(OV_W * (rect.x / w), 0, OV_W * (rect.w / w), OV_H, { texture: sharp });
        } else {
          drawScene(st, t);
        }
        const polys = Math.round(r.polys);
        if (st.overlay || st.black) {
          ov.begin();
          if (st.overlay) ov.rect(0, 0, OV_W, OV_H, { blend: true, alpha: st.overlayAlpha === undefined ? 1 : st.overlayAlpha, texture: overlay(st.overlay) });
          if (st.black) ov.rect(0, 0, OV_W, OV_H, { blend: true, alpha: st.black, flat: [0, 0, 0, 1] });
        }
        return { polys };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Я приготовил суп из сайры Влада Савельева. Дичайшее хрючево..mp3',
    duration: Script.DURATION,
    aspect: 16 / 9,
    cuts: Script.CUTS,
    stage: Script.stage,
    voiceAt: Script.voice,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
