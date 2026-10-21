(function () {
  const Yard = window.LingingYard;
  const Cast = window.LingingCast;
  const Script = window.LingingScript;

  function create(r) {
    const W = Yard.build(r);
    const V = Cast.build(r);

    return {
      warm() {},
      render(t) {
        const st = Script.stage(t);
        const env = st.env;
        const e = env.exposure || 1;
        const camera = Object.assign({
          near: 0.04,
          far: 200,
          grade: [1.05 * e, 1.02 * e, 0.98 * e, -0.08],
          colorAdd: [0.015, 0.01, 0.005],
          fx: { grain: 0.014, vignette: 0.14, time: t }
        }, st.camera);

        const m = Cast.solve(st.pose);
        r.begin(env, camera);
        Yard.draw(r, W);
        Cast.draw(r, V, m, st.pose);
        Yard.drawPeephole(r, W);
        return { polys: Math.round(r.polys) };
      }
    };
  }

  const video = {
    id: 'y0Ph0neL1ng',
    audio: 'content/YouVid/yo phone linging.mp3',
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
