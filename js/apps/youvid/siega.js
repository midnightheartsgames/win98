(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { clamp, frac } = K;
  const Room = window.SiegaRoom;
  const Cast = window.SiegaCast;
  const Screens = window.SiegaScreens;
  const Script = window.SiegaScript;

  const FW = 480;
  const FH = 270;
  const CONTRAST = 1.22;
  const CALL_VIEW = { x: 42, y: 23.25, w: 400, h: 241 };

  function envFor(light) {
    const k = light || 1;
    return {
      sunDir: [0.42, -0.5, -0.75],
      sunColor: [0.5 * k, 0.5 * k, 0.5 * k],
      ambTop: [0.3 * k, 0.3 * k, 0.3 * k],
      ambBottom: [0.14 * k, 0.14 * k, 0.14 * k],
      fogColor: [0.02, 0.02, 0.02],
      fogNear: 30,
      fogFar: 60,
      points: [{ pos: [0.8, 0.8, -0.9], color: [0.35 * k, 0.35 * k, 0.35 * k] }]
    };
  }

  function rolledUp(eye, at, roll) {
    const f = V3.norm(V3.sub(at, eye));
    const right = V3.norm(V3.cross(f, [0, 1, 0]));
    const up = V3.cross(right, f);
    return V3.add(V3.mul(up, Math.cos(roll)), V3.mul(right, -Math.sin(roll)));
  }

  function ledAt(shot, cam) {
    const base = shot.chair;
    if (!shot.ledPx) return [base[0] + 0.3, 0.95, base[1] - 0.62];
    const a = shot.pitch || 0.17, h = Math.tan((cam.fov * Math.PI) / 360);
    const x = (shot.ledPx[0] / 1280) * 2 - 1, y = 1 - (shot.ledPx[1] / 720) * 2;
    const dir = V3.norm([x * h * (16 / 9), y * h * Math.cos(a) - Math.sin(a), -y * h * Math.sin(a) - Math.cos(a)]);
    return V3.add(cam.eye, V3.mul(dir, 1.25));
  }

  function placeOf(shot, c, cam) {
    const base = shot.chair;
    const chair = M4.chain(M4.translate(c[0], c[1], c[2]), M4.rotY(c[3]));
    const w = shot.wall || [base[0], base[1] - 0.8, 0];
    const wall = M4.chain(M4.translate(w[0], 0, w[1]), M4.rotY(w[2] || 0));
    const l = ledAt(shot, cam);
    return { chair, wall, led: M4.translate(l[0], l[1], l[2]), pillowAt: shot.pillow, arms: shot.arms, tint: (shot.bg || 1) / (shot.key || 1) };
  }

  function create(r) {
    const W = Room.build(r);
    const V = Cast.build(r);
    const G = Screens.build(r);
    const ov = K.overlay(r, FW, FH);
    const c = (1 - CONTRAST) * 0.5;
    const camera = {
      eye: [0, 0, 0], at: [0, 0, -1], up: [0, 1, 0], fov: 44, near: 0.03, far: 30,
      grade: [1, 1, 1, 1],
      colorM: new Float32Array([CONTRAST, 0, 0, 0, CONTRAST, 0, 0, 0, CONTRAST]),
      colorAdd: [c, c, c],
      fx: { grain: 0.05, vignette: 0.32, time: 0 }
    };

    function spinMask(roll) {
      if (Math.abs(roll) < 1e-3) return;
      const B = 2000;
      const base = M4.chain(M4.translate(FW / 2, FH / 2, 0), M4.rotZ(roll));
      [[FW / 2, -B, B, 2 * B], [-FW / 2 - B, -B, B, 2 * B], [-B, -FH / 2 - B, 2 * B, B], [-B, FH / 2, 2 * B, B]].forEach(([x, y, w, h]) => {
        r.draw(ov.quad, M4.chain(base, M4.translate(x, y, 0), M4.scale(w, h, 1)), { flat: [0, 0, 0, 1], noFog: true });
      });
    }

    return {
      warm() {
        for (let t = 0; t < Script.DURATION; t += 0.05) V.faceTex(Cast.faceKey(Script.faceAt(t)));
      },
      render(t) {
        const st = Script.stage(t);
        const cw = r.canvas.width || FW, ch = r.canvas.height || FH;
        camera.fx.time = frac(t * 0.37) * 100;
        if (st.kind === 'game') {
          Screens.drawGame(r, G, ov, st, camera);
          return { polys: Math.round(r.polys) };
        }
        let view = null;
        if (st.kind === 'call') {
          ov.begin();
          Screens.drawCallBack(r, G, ov, st);
          const sx = cw / FW, sy = ch / FH;
          view = { x: Math.round(CALL_VIEW.x * sx), y: Math.round(ch - (CALL_VIEW.y + CALL_VIEW.h) * sy), w: Math.round(CALL_VIEW.w * sx), h: Math.round(CALL_VIEW.h * sy) };
        }
        camera.eye = st.camera.eye;
        camera.at = st.camera.at;
        camera.fov = st.camera.fov;
        camera.proj = st.kind === 'call' ? M4.perspective(st.camera.fov, 16 / 9, camera.near, camera.far) : null;
        camera.up = rolledUp(st.camera.eye, st.camera.at, st.camera.roll);
        r.begin(envFor(st.shot.key), camera, view);
        Room.draw(r, W, placeOf(st.shot, st.chair, st.camera));
        const m = Cast.solve(st.pose);
        Cast.draw(r, V, m, st.pose);
        const polys = Math.round(r.polys);
        if (st.kind === 'call') {
          ov.begin();
          Screens.drawCallFront(r, G, ov, st);
        } else if (st.camera.roll) {
          ov.begin();
          spinMask(st.camera.roll);
        }
        return { polys };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Жизнь и Страдания Сиеги.mp3',
    duration: Script.DURATION,
    aspect: 16 / 9,
    stage: Script.stage,
    voiceAt: Script.VOICE,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
