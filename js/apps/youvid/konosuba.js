(function () {
  const { M4, V3 } = window.P3D;
  const World = window.KonosubaWorld;
  const Cast = window.KonosubaCast;
  const Critters = window.KonosubaCritters;
  const Script = window.KonosubaScript;

  function holdMatrix(rig, hold) {
    const a = rig.pts.wristL, b = rig.pts.wristR;
    const mid = hold.at === 'chest' ? M4.point(rig.chest, [0, 0, 0]) : hold.hand === 'L' ? a : hold.hand === 'R' ? b : V3.lerp(a, b, 0.5);
    const o = hold.off || [0, 0, 0];
    const world = V3.add(mid, M4.dir(rig.chest, o));
    return M4.chain(M4.translate(world[0], world[1], world[2]), extractRot(rig.chest), M4.rotY(hold.yaw || 0), M4.rotX(hold.pitch || 0), M4.rotZ(hold.roll || 0));
  }

  function extractRot(m) {
    const out = M4.ident();
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) out[i * 4 + j] = m[i * 4 + j];
    return out;
  }

  function create(r) {
    const W = World.build(r);
    const V = Cast.build(r);
    const CR = Critters.build(r);

    return {
      warm() {},
      render(t) {
        const st = Script.stage(t);
        const env = st.env;
        const f = (env.exposure || 1) * (st.fade === undefined ? 1 : st.fade);
        const camera = Object.assign({
          near: 0.03,
          far: 200,
          grade: [1.02 * f, 1.01 * f, 1.0 * f, -0.1],
          colorAdd: [0.01 * f, 0.012 * f, 0.012 * f],
          fx: { grain: 0.01, vignette: 0.1, time: t }
        }, st.camera);

        r.begin(env, camera);
        World.draw(r, W, st.set, st.t, st);
        const rigs = {};
        st.cast.forEach(c => {
          const m = Cast.solve(c.who, c.pose);
          rigs[c.who] = m;
          Cast.drawChar(r, V, c.who, m, c.pose);
          if (c.pose.holdCat) {
            const h = c.pose.holdCat;
            const cm = M4.chain(m.chest, M4.translate(h.off[0], h.off[1], h.off[2]), M4.rotY(h.yaw || 0), M4.rotX(h.pitch || 0), M4.rotZ(h.roll || 0), M4.scale(h.scale || 1));
            Critters.drawCat(r, CR, Object.assign({ matrix: cm, held: true }, h));
          }
        });
        (st.toads || []).forEach(td => Critters.drawFrog(r, CR, Object.assign({}, td, td.tongueAt && rigs[td.tongueAt.who] ? { tongueTo: V3.add(rigs[td.tongueAt.who].pts.pelvis, td.tongueAt.off || [0, 0, 0]) } : {})));
        const cats = Array.isArray(st.chomusuke) ? st.chomusuke : st.chomusuke ? [st.chomusuke] : [];
        cats.forEach(c => Critters.drawCat(r, CR, c));
        if (st.tadpole) {
          const td = st.tadpole;
          if (td.hold && rigs[td.hold.who]) {
            Critters.drawTadpole(r, CR, Object.assign({}, td, { matrix: holdMatrix(rigs[td.hold.who], td.hold) }), st.t);
          } else {
            Critters.drawTadpole(r, CR, td, st.t);
          }
        }
        return { polys: Math.round(r.polys) };
      }
    };
  }

  const video = {
    id: 'k0n0SuBa3Ed',
    audio: 'content/YouVid/KONOSUBA 3 - Ending.mp3',
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
