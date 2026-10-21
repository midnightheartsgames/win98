(function () {
  const { M4 } = window.P3D;
  const K = window.YouVidKit;
  const World = window.RomanWorld;
  const Cast = window.RomanCast;
  const Script = window.RomanScript;

  const OV_W = 480;
  const OV_H = 270;

  function create(r) {
    const W = World.build(r);
    const V = Cast.build(r);
    const ov = K.overlay(r, OV_W, OV_H);

    return {
      warm() {},
      render(t) {
        const st = Script.stage(t);
        const env = st.env;
        const f = (env.exposure || 1) * (st.fade === undefined ? 1 : st.fade);
        const isDepot = st.set === 'depot';
        const camera = Object.assign({
          near: 0.03,
          far: 45,
          grade: isDepot ? [0.96 * f, 0.94 * f, 0.82 * f, 0.14] : [1.04 * f, 1.01 * f, 0.98 * f, -0.06],
          colorAdd: isDepot ? [0.01 * f, 0.012 * f, 0.004 * f] : [0.02 * f, 0.015 * f, 0.012 * f],
          fx: {
            grain: isDepot ? 0.028 : 0.014 + (st.blur || 0) * 0.018,
            vignette: isDepot ? 0.28 : 0.16 + (st.blur || 0) * 0.22,
            time: t
          }
        }, st.camera);

        r.begin(env, camera);
        World.draw(r, W, st);

        (st.cast || []).forEach(c => {
          const m = Cast.solve(c.who, c.pose);
          if (st.blur && st.blur > 0.2) {
            const off = st.blur * 0.016;
            const pGhost = Object.assign({}, c.pose, {
              pos: [c.pose.pos[0] + off, c.pose.pos[1] + off * 0.4, c.pose.pos[2]]
            });
            Cast.draw(r, V, c.who, Cast.solve(c.who, pGhost), pGhost, { alpha: 0.28, noFace: true });
          }
          Cast.draw(r, V, c.who, m, c.pose);
        });

        const polys = Math.round(r.polys);
        const lids = st.eyelids || [0, 0];
        if (st.blur > 0.05 || lids[0] > 0.01 || lids[1] > 0.01 || st.fade < 0.99 || st.subtitle) {
          ov.begin();
          if (st.blur > 0.05) {
            ov.rect(0, 0, OV_W, OV_H, {
              blend: true,
              alpha: st.blur * 0.26,
              flat: [0.92, 0.88, 0.9, 1]
            });
          }
          if (lids[0] > 0.01) {
            ov.rect(0, 0, OV_W, OV_H * 0.56 * lids[0], {
              blend: true,
              alpha: Math.min(1, lids[0] * 1.15),
              flat: [0.03, 0.02, 0.03, 1]
            });
          }
          if (lids[1] > 0.01) {
            const bh = OV_H * 0.56 * lids[1];
            ov.rect(0, OV_H - bh, OV_W, bh, {
              blend: true,
              alpha: Math.min(1, lids[1] * 1.15),
              flat: [0.03, 0.02, 0.03, 1]
            });
          }
          if (st.fade < 0.99) {
            ov.rect(0, 0, OV_W, OV_H, {
              blend: true,
              alpha: 1 - st.fade,
              flat: [0.02, 0.02, 0.02, 1]
            });
          }
          if (st.subtitle && W.T[st.subtitle]) {
            ov.rect(40, OV_H - 64, OV_W - 80, 56, {
              blend: true,
              alpha: 0.98,
              texture: W.T[st.subtitle]
            });
          }
        }

        return { polys };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/WAKE UP ROMAN.mp3',
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
