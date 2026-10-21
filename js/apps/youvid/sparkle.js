(function () {
  const K = window.YouVidKit;
  const World = window.SparkleWorld;
  const Cast = window.SparkleCast;
  const Script = window.SparkleScript;

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
        const camera = Object.assign({
          near: 0.04,
          far: 120,
          grade: [1.05 * f, 1.01 * f, 1.02 * f, -0.08],
          colorAdd: [0.015 * f, 0.008 * f, 0.012 * f],
          fx: {
            grain: 0.014,
            vignette: 0.16,
            time: t
          }
        }, st.camera);

        r.begin(env, camera);
        World.draw(r, W, st);
        (st.cast || []).forEach(c => {
          const m = Cast.solve(c.pose);
          Cast.drawChar(r, V, m, c.pose);
        });
        Cast.drawExtras(r, V, st);

        const polys = Math.round(r.polys);
        const hasFade = st.fade !== undefined && st.fade < 0.99;
        const hasFlash = st.flash && st.flash > 0.01;
        const hasBanner = st.banner && W.T[st.banner];

        if (hasFade || hasFlash || hasBanner) {
          ov.begin();
          if (hasFade) {
            ov.rect(0, 0, OV_W, OV_H, {
              blend: true,
              alpha: 1 - st.fade,
              flat: [0.02, 0.01, 0.03, 1]
            });
          }
          if (hasBanner) {
            ov.rect(0, 0, OV_W, OV_H, {
              blend: true,
              alpha: st.bannerAlpha === undefined ? 1 : st.bannerAlpha,
              texture: W.T[st.banner]
            });
          }
          if (hasFlash) {
            ov.rect(0, 0, OV_W, OV_H, {
              blend: true,
              alpha: Math.min(1, st.flash),
              flat: [1, 0.88, 0.92, 1]
            });
          }
        }

        return { polys };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Sparkle Trailer - Monodrama.mp3',
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
