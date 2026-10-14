(function () {
  const { M4 } = window.P3D;
  const Cast = window.SlayCast;
  const Street = window.SlayStreet;
  const Script = window.SlayScript;

  function create(r) {
    const W = Street.build(r);
    const V = Cast.build(r);

    return {
      warm() {},
      render(t) {
        const st = Script.stage(t);
        const env = st.env;
        const e = env.exposure || 1;
        const camera = Object.assign({ near: 0.04, far: 400, grade: [1.04 * e, 1.02 * e, 1.0 * e, -0.12], colorAdd: [0.01, 0.012, 0.02], fx: { grain: 0.018, vignette: 0.12, time: t } }, st.camera);
        const props = Object.assign({ t: st.t }, st.props);
        const people = st.cast.map(c => ({ who: c.who, pose: c.pose, m: Cast.solve(c.who, c.pose) }));

        r.begin(env, camera);
        Street.drawBackdrop(r, W, Street.MIRROR);
        Street.drawOutdoor(r, W, Street.MIRROR, props);
        people.forEach(c => { if (c.pose.p[2] > 0.05) Cast.draw(r, V, c.who, c.m, c.pose, { base: Street.MIRROR }); });
        Street.drawDoorway(r, W);

        r.begin(env, camera, null, true);
        Street.drawInterior(r, W, props.glass, props);
        Street.markGlass(r, W, props);
        Street.drawNear(r, W, props);
        Street.drawOutdoor(r, W, null, props);
        Street.drawBackdrop(r, W, null, { shadow: true });
        people.forEach(c => { if (!c.pose.mirrorOnly) Cast.draw(r, V, c.who, c.m, c.pose); });
        people.forEach(c => { if (!c.pose.mirrorOnly) Cast.drawShadow(r, V, c.who, c.m, c.pose, env.sunDir); });
        Street.drawGlass(r, W, props);
        return { polys: Math.round(r.polys) };
      }
    };
  }

  const video = {
    id: 'eXtr3meSlay',
    audio: 'content/YouVid/Теперь я extremely slay, меньше волос.mp3',
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
