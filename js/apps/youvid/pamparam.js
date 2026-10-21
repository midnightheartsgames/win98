(function () {
  const { M4 } = window.P3D;
  const World = window.PamparamWorld;
  const Cast = window.PamparamCast;
  const Script = window.PamparamScript;

  const ENV = {
    sunDir: [-0.25, -0.82, -0.52],
    sunColor: [0.24, 0.23, 0.21],
    ambTop: [0.96, 0.95, 0.92],
    ambBottom: [0.58, 0.56, 0.53],
    fogColor: [0.78, 0.76, 0.72],
    fogNear: 12,
    fogFar: 38,
    points: [
      { pos: [0.2, 2.8, 0.8], color: [0.22, 0.21, 0.19] },
      { pos: [3.2, 2.8, 0.8], color: [0.22, 0.21, 0.19] }
    ]
  };

  function create(r) {
    const W = World.build(r);
    const V = Cast.build(r);
    return {
      warm() {},
      render(t) {
        const st = Script.stage(t);
        const cam = st.camera;
        const w = r.canvas.width || 480, h = r.canvas.height || 270;
        const proj = M4.perspective(cam.fov, (w / h) / (cam.wide || 1.35), 0.04, 50);
        const camera = {
          proj,
          eye: cam.eye,
          at: cam.at,
          up: cam.up,
          fov: cam.fov,
          near: 0.04,
          far: 50,
          grade: [1.02, 1.0, 0.97, 0.08],
          colorAdd: [0.012, 0.01, 0.006],
          fx: { grain: 0.025 + st.bass * 0.02, vignette: 0.22, time: t }
        };
        r.begin(ENV, camera);
        World.draw(r, W);
        const shadow = M4.chain(M4.translate(st.pose.p[0], 0.015, st.pose.p[2]), M4.scale(0.58, 1, 0.38));
        r.draw(W.shadowBlob, shadow, { blend: true, alpha: 0.34, flat: [0.18, 0.17, 0.16, 1] });
        if (st.bass > 0.15) {
          const prev = Script.stage(Math.max(0, t - 0.055));
          Cast.draw(r, V, prev.m, prev.pose, { alpha: 0.22, noFace: true });
        }
        Cast.draw(r, V, st.m, st.pose);
        return { polys: Math.round(r.polys) };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Пампарам-пампарам,приветствую смотрящих.mp3',
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
