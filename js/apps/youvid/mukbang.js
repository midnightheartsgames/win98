(function () {
  const K = window.YouVidKit;
  const { frac } = K;
  const Room = window.MukbangRoom;
  const Cast = window.MukbangCast;
  const Script = window.MukbangScript;

  const CONTRAST = 1.04;
  const GAIN = [1.06, 1.13, 1.25];
  const ENV = {
    sunDir: [-0.14, -0.5, -0.85],
    sunColor: [0.38, 0.36, 0.34],
    ambTop: [0.62, 0.59, 0.57],
    ambBottom: [0.36, 0.33, 0.31],
    fogColor: [0.93, 0.9, 0.9],
    fogNear: 60,
    fogFar: 120,
    points: [{ pos: [0.6, 1.7, 0.1], color: [0.22, 0.21, 0.2] }, { pos: [3.3, 1.3, -9.3], color: [0.9, 0.88, 0.9] }]
  };

  function create(r) {
    const W = Room.build(r);
    const V = Cast.build(r);
    const c = (1 - CONTRAST) * 0.5;
    const camera = {
      eye: Script.CAM.eye.slice(), at: [0, 0.8, -1], up: [0, 1, 0], fov: Script.CAM.fov, near: 0.05, far: 40,
      colorM: new Float32Array([CONTRAST * GAIN[0], 0, 0, 0, CONTRAST * GAIN[1], 0, 0, 0, CONTRAST * GAIN[2]]),
      colorAdd: [c, c, c],
      fx: { grain: 0.025, vignette: 0.22, time: 0 }
    };
    return {
      warm() {
        for (let t = 0; t < Script.DURATION; t += 0.05) V.faceTex(Cast.faceKey(Script.faceAt(t)));
      },
      render(t) {
        const st = Script.stage(t);
        camera.eye = st.camera.eye;
        camera.at = st.camera.at;
        camera.fov = st.camera.fov;
        camera.fx.time = frac(t * 0.41) * 100;
        r.begin(ENV, camera);
        Room.draw(r, W);
        if (st.pose) Cast.draw(r, V, Cast.solve(st.pose), st.pose);
        return { polys: Math.round(r.polys) };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Самое странное начало видео от Влада Савельева.mp3',
    duration: Script.DURATION,
    aspect: 16 / 9,
    stage: Script.stage,
    voiceAt: Script.VOICE,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
