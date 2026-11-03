(function () {
  const { cookieMatrix } = window.P3D;
  const Office = window.YegudOffice;
  const Cast = window.YegudCast;
  const Script = window.YegudScript;

  function envAt(st, stripes) {
    const b = st.bateman.p;
    const front = st.shot === 0;
    const sunDir = front ? [0.5, -0.38, -0.78] : [0.62, -0.28, 0.73];
    const env = {
      sunDir,
      sunColor: front ? [0.38, 0.38, 0.36] : [0.24 + 0.36 * st.stripes, 0.24 + 0.36 * st.stripes, 0.23 + 0.34 * st.stripes],
      ambTop: [0.5, 0.53, 0.55],
      ambBottom: [0.22, 0.23, 0.24],
      fogColor: [0.46, 0.49, 0.5],
      fogNear: 7,
      fogFar: 40,
      points: [
        { pos: front ? [b[0] - 0.9, 2.05, b[2] + 1.4] : [b[0] + 0.5, 2.3, b[2] + 1.6], color: front ? [0.6, 0.56, 0.5] : [0.16, 0.16, 0.15] },
        { pos: [0.3, 2.4, front ? -6 : 7], color: [0.12, 0.12, 0.11] }
      ]
    };
    if (st.stripes > 0) env.cookie = { texture: stripes, matrix: cookieMatrix(sunDir, [b[0], 1.3, b[2]], 0.26), strength: 0.9 * st.stripes };
    return env;
  }

  function wallShadowM(x0, L) {
    const ky = L[1] / L[0], kz = L[2] / L[0];
    return new Float32Array([0, -ky, -kz, 0, 0, 1, 0, 0, 0, 0, 1, 0, x0, ky * x0, kz * x0, 1]);
  }

  const GRADE = [1.0, 1.01, 1.02, 0.16];
  const COLOR_M = new Float32Array([1.02, -0.01, -0.02, 0.0, 1.0, 0.0, -0.02, 0.01, 1.0]);

  function create(r) {
    const W = Office.build(r);
    const P = Cast.build(r);
    const stripes = r.texture(64, (ctx, w, h) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 8; i++) ctx.fillRect(0, (i * h) / 8, w, (h / 8) * 0.56);
    });
    return {
      warm() {},
      render(t) {
        const st = Script.stage(t);
        const cw = r.canvas.width || 480, chh = r.canvas.height || 270;
        const h = Math.min(chh, Math.round(cw / Script.WIDE));
        const rect = { x: 0, y: Math.round((chh - h) / 2), w: cw, h };
        r.clear([0, 0, 0]);
        const cam = st.camera;
        r.begin(envAt(st, stripes), {
          eye: cam.eye,
          at: cam.at,
          up: cam.up,
          fov: cam.fov,
          near: 0.05,
          far: 60,
          grade: GRADE,
          colorM: COLOR_M,
          colorAdd: [0.006, 0.008, 0.01],
          fx: { grain: 0.03, vignette: 0.3, time: t }
        }, rect);
        Office.draw(r, W, st);
        const m = Cast.solve('bateman', st.bateman);
        Cast.draw(r, P, 'bateman', m, st.bateman, { tint: st.batemanTint });
        if (st.wallShadow > 0) Cast.draw(r, P, 'bateman', m, st.bateman, { pre: wallShadowM(-0.765, [-0.6, -0.1, 0.8]), flat: [0.16, 0.17, 0.18, 1], alpha: 0.4 * st.wallShadow, noWires: true });
        st.cast.forEach(c => Cast.draw(r, P, c.who, Cast.solve(c.who, c.pose), c.pose, Object.assign({ noCookie: true }, c.opts)));
        Office.drawGlass(r, W, st);
        return { polys: Math.round(r.polys) };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/YEGUDNAIS.mp3',
    duration: Script.DURATION,
    aspect: 16 / 9,
    cuts: Script.CUTS,
    stage: Script.stage,
    voiceAt: Script.BEAT,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
