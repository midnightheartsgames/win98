(function () {
  const { M4 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, mesh } = K;
  const Cast = window.VladCast;
  const Room = window.VladRoom;
  const Script = window.VladScript;

  const ENV = {
    sunDir: [0.25, -0.7, -0.65],
    sunColor: [0.26, 0.24, 0.2],
    ambTop: [1.0, 0.96, 0.86],
    ambBottom: [0.56, 0.52, 0.46],
    fogColor: [0.06, 0.05, 0.04],
    fogNear: 9,
    fogFar: 22,
    points: [{ pos: [0.2, 2.1, 1.6], color: [0.32, 0.28, 0.22] }]
  };

  const NU = 40;
  const NV = 22;
  const FLY = [27.6, 33.2];

  function buildFly(b) {
    b.ellipsoid(0.007, 0.006, 0.011, 6, 4, [0.05, 0.05, 0.06, 0]);
    b.at(0, 0.002, 0.012, h => h.ellipsoid(0.005, 0.005, 0.005, 5, 3, [0.18, 0.06, 0.05, 0]));
  }

  function buildWing(b) {
    b.tri([0, 0, 0], [0.018, 0.004, -0.004], [0.014, 0.002, -0.014], [0.82, 0.86, 0.9, 0.6]);
  }

  function flyAt(t, head) {
    const k = t - FLY[0];
    const r0 = 0.16 + 0.05 * S(k * 1.3);
    return [head[0] + C(k * 3.1) * r0 + 0.06 * S(k * 7.9), head[1] + 0.12 + 0.05 * S(k * 4.3) + 0.02 * S(k * 17), head[2] + 0.12 + S(k * 3.1) * r0 * 0.7];
  }

  function create(r) {
    const V = Cast.build(r);
    const R = Room.buildStatic(r);
    const cloth = Room.makeCloth(r, NU, NV);
    const fly = { body: mesh(r, buildFly), wing: mesh(r, buildWing) };

    function clothPositions(st, m) {
      const b = st.blanket;
      const spheres = Cast.capsules(m, { armsUnder: b.armsUnder });
      const air = b.mode === 'throw' ? 0.16 * S(PI * b.k) : 0;
      return Room.drape(spheres, { nu: NU, nv: NV, x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1, seed: 3, lift: b.lift, liftX: m.pts.chest[0] + 0.15, bunch: b.bunch, air, reach: b.reach }, st.t);
    }

    return {
      warm() {},
      render(t) {
        const st = Script.stage(t);
        const m = Cast.solve(st.pose);
        const f = st.fade;
        const camera = Object.assign({ near: 0.05, far: 30, grade: [1.0 * f, 0.97 * f, 0.9 * f, 0.04], colorAdd: [0.025 * f, 0.02 * f, 0.008 * f], fx: { grain: 0.03 * f, vignette: 0.26, time: t } }, st.camera);
        r.begin(ENV, camera);
        Room.drawRoom(r, R, st.props);
        Cast.draw(r, V, m, st.pose);
        if (st.hoodie) r.draw(V.heap, M4.chain(M4.translate(st.hoodie.p[0], st.hoodie.p[1], st.hoodie.p[2]), M4.rotY(st.hoodie.ry), M4.rotZ(st.hoodie.rz)));
        if (t > FLY[0] && t < FLY[1]) {
          const at = flyAt(t, m.pts.head);
          const next = flyAt(t + 0.05, m.pts.head);
          const yaw = Math.atan2(next[0] - at[0], next[2] - at[2]);
          const base = M4.chain(M4.translate(at[0], at[1], at[2]), M4.rotY(yaw), M4.scale(1.7));
          const flap = S(t * 160) * 0.7;
          r.draw(fly.body, base);
          r.draw(fly.wing, M4.mul(base, M4.rotZ(flap)));
          r.draw(fly.wing, M4.chain(base, M4.scale(-1, 1, 1), M4.rotZ(flap)));
        }
        if (st.blanket) {
          cloth.update(clothPositions(st, m));
          r.draw(cloth, null, { texture: R.T.blanket, tint: [0.92, 0.88, 0.84] });
          r.draw(cloth, M4.translate(0, -0.035, 0.012), { texture: R.T.blanket, tint: [0.55, 0.5, 0.46] });
        }
        return { polys: Math.round(r.polys) };
      }
    };
  }

  const video = {
    id: 'i9AyI356ye4',
    audio: 'content/YouVid/Влад Савельев ложится спать.mp3',
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
