(function () {
  const K = window.YouVidKit;
  const { clamp, frac } = K;
  const Rig = window.YouVidRig;
  const Cast = window.NiceCast;
  const Room = window.NiceRoom;
  const Over = window.NiceOverlay;

  const DURATION = 10.0;
  const VOICE = K.envelope('00000000000000000000000005fowGQVVUTUWUQQUXYYYXYYZZZZZZZZZZZZYYVOBna200000000000038fwOUSNGGNUXXYYYXYXXXXXXXYYXYYZZZZZZZZZZYYVMxh50000004oNYZYSHtkga30000000006itFTYYYTORXYYYYYYYYYYYYYYYYWSIvf4', 20);
  const motionAt = Rig.motion((window.YouVidMotion || {}).vEryN1ceGdN);
  const FW = 480;
  const FH = 270;

  const ENV = {
    sunDir: [0.25, -1, -0.45],
    sunColor: [0.3, 0.25, 0.16],
    ambTop: [0.86, 0.8, 0.66],
    ambBottom: [0.4, 0.36, 0.3],
    fogColor: [0.05, 0.04, 0.03],
    fogNear: 30,
    fogFar: 60,
    points: [{ pos: [-0.4, 2.6, -0.4], color: [0.4, 0.32, 0.2] }]
  };

  const BLINKS = [0.42, 3.55, 6.5, 7.45, 9.7];

  function faceAt(t) {
    const v = VOICE(t);
    if (t > 9.55) return { mouth: v > 0.2 ? 'open' : 'grin', eyes: BLINKS.some(b => t > b && t < b + 0.12) ? 'shut' : 'open' };
    const mouth = v < 0.14 ? 'shut' : v < 0.5 ? 'open' : 'wide';
    const eyes = v > 0.62 ? 'squeeze' : BLINKS.some(b => t > b && t < b + 0.12) ? 'shut' : 'open';
    return { mouth, eyes };
  }

  function poseAt(t) {
    const pose = { gR: 'mic', gL: t > 9.5 ? 'fist' : 'open', cableEnd: [0.55, 0.02, -0.95] };
    const mv = motionAt(clamp(t, 0.25, 10.03));
    if (mv) Rig.applyMotion(pose, mv);
    const belt = clamp((VOICE(t) - 0.5) / 0.4, 0, 1);
    const tilt = belt * belt * (3 - 2 * belt) * (t > 8.2 && t < 9.4 ? 0.75 : 0.5);
    if (pose.nk) pose.nk = [pose.nk[0] - tilt, pose.nk[1], pose.nk[2]];
    pose.micUp = t > 9.45 ? clamp((9.75 - t) / 0.3, 0, 1) : 1;
    Object.assign(pose, faceAt(t));
    return pose;
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    return { t: tt, pose: poseAt(tt), overlay: Over.state(tt), mask: Over.mask(tt) };
  }

  function create(r) {
    const V = Cast.build(r);
    const R = Room.build(r);
    const ov = K.overlay(r, FW, FH);
    const tex = {};
    const overlayTex = (st) => {
      const key = Over.stateKey(st);
      if (!tex[key]) tex[key] = r.texture(1024, Over.drawer(st), { height: 576, clamp: true });
      return tex[key];
    };
    const eye = Room.EYE;
    const camera = { eye, at: [eye[0], eye[1], eye[2] - 1], fov: Room.FOV, near: 0.05, far: 30, grade: [1.04, 0.96, 0.8, -0.12], colorAdd: [0.012, 0.006, 0], fx: { grain: 0.04, vignette: 0.42, time: 0 } };
    return {
      warm() {},
      render(t) {
        const st = stage(t);
        const m = Cast.solve(st.pose);
        camera.fx.time = frac(t * 0.37) * 100;
        r.begin(ENV, camera);
        Room.draw(r, R);
        Cast.draw(r, V, m, st.pose);
        const polys = Math.round(r.polys);
        ov.begin();
        ov.rect(0, 0, FW, FH, { texture: overlayTex(st.overlay) });
        st.mask.forEach(([x, y, w, h]) => ov.rect((x / 960) * FW, (y / 540) * FH, (w / 960) * FW, (h / 540) * FH, { flat: [0, 0, 0, 1] }));
        return { polys };
      }
    };
  }

  const video = {
    id: 'vEryN1ceGdN',
    audio: 'content/YouVid/verynicegoodnice.mp3',
    duration: DURATION,
    aspect: 16 / 9,
    stage,
    voiceAt: VOICE,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
