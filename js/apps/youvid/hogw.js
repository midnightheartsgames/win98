(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, clamp, frac } = K;
  const Set = window.HogwSet;
  const Cast = window.HogwCast;
  const Props = window.HogwProps;
  const Script = window.HogwScript;

  const FW = 480;
  const FH = 360;
  const SHUTTER = 1 / 45;

  const ENV = {
    sunDir: [0.15, -1, 0.1],
    sunColor: [0.3, 0.29, 0.26],
    ambTop: [0.94, 0.91, 0.86],
    ambBottom: [0.44, 0.42, 0.4],
    fogColor: [0.9, 0.86, 0.76],
    fogNear: 40,
    fogFar: 80,
    points: [
      { pos: [-2.0, 2.9, -1.4], color: [0.3, 0.29, 0.26] },
      { pos: [-1.0, 2.9, 1.4], color: [0.24, 0.23, 0.2] }
    ]
  };

  const COLOR_M = new Float32Array([1.22, 0.02, -0.01, 0.03, 1.2, 0.0, -0.02, -0.01, 1.16]);

  function rolledUp(eye, at, roll) {
    const f = V3.norm(V3.sub(at, eye));
    const right = V3.norm(V3.cross(f, [0, 1, 0]));
    const up = V3.cross(right, f);
    return V3.add(V3.mul(up, Math.cos(roll)), V3.mul(right, -Math.sin(roll)));
  }

  function titleTex(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const k = w / FW;
    ctx.font = `${Math.round(15.5 * k)}px Arial, "Helvetica Neue", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    [['Если бы "Гарри Поттера"', 18.5], ['снимала Валерия Гай Германика', 36]].forEach(([s, y]) => {
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = 3.2 * k;
      ctx.strokeText(s, w / 2, y * k);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(s, w / 2, y * k);
    });
  }

  function cardTex(ctx, w, h) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const k = w / FW;
    const tc = document.createElement('canvas');
    tc.width = w;
    tc.height = h;
    const t = tc.getContext('2d');
    t.textAlign = 'center';
    t.textBaseline = 'middle';
    t.font = `bold ${Math.round(44 * k)}px "Segoe Print", "Comic Sans MS", "Bradley Hand", cursive`;
    t.save();
    t.translate(w / 2, h * 0.52);
    t.scale(0.92, 1.18);
    t.fillStyle = '#cfcfcf';
    t.fillText('Школа Хогвартс', 0, 0);
    t.restore();
    t.globalCompositeOperation = 'source-atop';
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 2600; i++) {
      t.fillStyle = rnd() < 0.6 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';
      t.fillRect(rnd() * w, h * 0.4 + rnd() * h * 0.24, 1.3 * k, (1 + rnd() * 3) * k);
    }
    ctx.drawImage(tc, 0, 0);
  }

  function create(r) {
    const W = Set.build(r);
    const P = Cast.build(r);
    const PR = Props.build(r);
    const ov = K.overlay(r, FW, FH);
    const T = {
      title: r.texture(1024, titleTex, { height: 768, clamp: true }),
      card: r.texture(1024, cardTex, { height: 768, clamp: true }),
      acc: r.frameTexture(false)
    };
    const camera = {
      eye: [0, 1, 0], at: [0, 1, -1], up: [0, 1, 0], fov: 50, near: 0.04, far: 30,
      grade: [1, 1, 1, 0.1],
      colorM: COLOR_M,
      colorAdd: [-0.1, -0.105, -0.09],
      fx: { grain: 0.035, vignette: 0.16, time: 0 }
    };

    function scene(t) {
      const st = Script.stage(t);
      camera.eye = st.camera.eye;
      camera.at = st.camera.at;
      camera.fov = st.camera.fov;
      camera.up = rolledUp(st.camera.eye, st.camera.at, st.camera.roll || 0);
      camera.fx.time = frac(t * 0.37) * 100;
      r.begin(ENV, camera);
      Set.draw(r, W, st.set);
      st.cast.forEach(c => {
        const m = Cast.solve(c.who, c.pose);
        Cast.draw(r, P, c.who, m, c.pose, c.opts);
        if (c.hold) c.hold.forEach(h => Props.held(r, PR, h, m));
      });
      Props.draw(r, PR, st.props, st);
      return st;
    }

    function samplesFor(t) {
      const a = Script.stage(t).camera, b = Script.stage(Math.max(0, t - SHUTTER)).camera;
      const fa = V3.norm(V3.sub(a.at, a.eye)), fb = V3.norm(V3.sub(b.at, b.eye));
      const ang = Math.acos(clamp(V3.dot(fa, fb), -1, 1)) + Math.abs((a.roll || 0) - (b.roll || 0)) * 0.5;
      return ang < 0.016 ? 1 : clamp(Math.ceil(ang / 0.012), 2, 9);
    }

    return {
      warm() {
        P.warm();
      },
      render(t) {
        const cw = r.canvas.width || FW, ch = r.canvas.height || FH;
        const tc = clamp(t, 0, Script.DURATION);
        const card = Script.cardAt(tc);
        let polys = 0;
        if (card < 1) {
          const n = samplesFor(tc);
          for (let k = 0; k < n; k++) {
            const tk = tc - (n > 1 ? SHUTTER * (k / (n - 1)) : 0);
            scene(Math.max(0, tk));
            polys = Math.max(polys, r.polys);
            if (k > 0) {
              ov.begin();
              ov.rect(0, 0, FW, FH, { texture: T.acc, blend: true, alpha: k / (k + 1) });
            }
            if (n > 1 && k < n - 1) r.grab(T.acc, 0, 0, cw, ch);
          }
        }
        ov.begin();
        if (card > 0) ov.rect(0, 0, FW, FH, { texture: T.card, blend: card < 1, alpha: card });
        const title = Script.titleAt(tc);
        if (title > 0) ov.rect(0, 0, FW, FH, { texture: T.title, blend: true, alpha: title });
        return { polys: Math.round(polys) };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Гарри Поттер, если бы его снимала Валерия Гай Германика в 3D.mp3',
    duration: Script.DURATION,
    aspect: 4 / 3,
    cuts: Script.CUTS,
    stage: Script.stage,
    voiceAt: Script.VOICE,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
