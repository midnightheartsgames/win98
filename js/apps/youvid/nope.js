(function () {
  const { M4 } = window.P3D;
  const World = window.NopeWorld;
  const Cast = window.NopeCast;
  const Script = window.NopeScript;

  const ENV = {
    sunDir: [-0.45, -0.78, -0.43],
    sunColor: [0.46, 0.42, 0.35],
    ambTop: [0.78, 0.74, 0.68],
    ambBottom: [0.48, 0.42, 0.38],
    fogColor: [0.70, 0.52, 0.31],
    fogNear: 28,
    fogFar: 65,
    points: [
      { pos: [-1.2, 2.6, 1.8], color: [0.22, 0.20, 0.16] }
    ]
  };

  function create(r) {
    const W = World.build(r);
    const Cst = Cast.build(r);

    return {
      warm() {},
      render(t) {
        const st = Script.stage(t);
        const camera = Object.assign({
          near: 0.05,
          far: 45,
          grade: [1, 1, 1, 0],
          fx: { grain: 0.006, vignette: 0.03, time: t }
        }, st.camera);

        r.begin(ENV, camera);
        World.draw(r, W);

        if (st.visible) {
          const s = Cast.solve(st.pose);
          const p = st.pose.p;
          if (p[2] < 0.4) {
            const footY = Math.min(s.pts.ankleL[1], s.pts.ankleR[1]) - 0.04;
            const shM = M4.chain(M4.translate(p[0] + 0.08, footY, p[2] - 0.05), M4.scale(0.32, 1, 0.22));
            r.draw(W.shadowBlob, shM, { blend: true, alpha: 0.34, flat: [0.22, 0.17, 0.12, 1], noFog: true });
          }
          Cast.draw(r, Cst, s, { face: st.face });
        }

        return { polys: Math.round(r.polys) };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/nope.avi.mp3',
    duration: Script.DURATION,
    aspect: 16 / 9,
    cuts: Script.CUTS,
    stage: Script.stage,
    voiceAt: Script.VOICE,
    sfxAt: Script.SFX,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
