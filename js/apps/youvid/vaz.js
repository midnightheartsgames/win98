(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh } = K;
  const Art = window.VazArt;
  const Diner = window.VazDiner;
  const Cast = window.VazCast;
  const Script = window.VazScript;

  const LIGHTS = {
    day: { sunDir: [-0.35, -0.82, -0.45], sunColor: [0.5, 0.47, 0.42], ambTop: [0.66, 0.64, 0.64], ambBottom: [0.4, 0.36, 0.38], fogColor: [0.42, 0.36, 0.38], fogNear: 12, fogFar: 34 },
    dim: { sunDir: [0.3, -0.7, -0.6], sunColor: [0.22, 0.24, 0.32], ambTop: [0.3, 0.32, 0.4], ambBottom: [0.16, 0.15, 0.2], fogColor: [0.1, 0.1, 0.14], fogNear: 8, fogFar: 26 },
    dance: { sunDir: [0.45, -0.75, 0.45], sunColor: [0.85, 0.74, 0.55], ambTop: [0.34, 0.32, 0.34], ambBottom: [0.2, 0.17, 0.18], fogColor: [0.22, 0.19, 0.17], fogNear: 7, fogFar: 26 },
    haze: { sunDir: [-0.3, -0.6, 0.7], sunColor: [0.7, 0.62, 0.46], ambTop: [0.42, 0.4, 0.36], ambBottom: [0.26, 0.24, 0.22], fogColor: [0.36, 0.32, 0.26], fogNear: 4, fogFar: 20 }
  };

  function mixEnv(a, b, k) {
    const out = {};
    Object.keys(a).forEach(key => {
      out[key] = Array.isArray(a[key]) ? a[key].map((v, i) => lerp(v, b[key][i], k)) : lerp(a[key], b[key], k);
    });
    return out;
  }

  function envOf(st) {
    const L = st.light || {};
    let env = Object.assign({}, LIGHTS[L.base || 'day']);
    if (L.to) env = mixEnv(env, LIGHTS[L.to], clamp(L.k || 0, 0, 1));
    if (L.sunDir) env.sunDir = L.sunDir;
    if (L.sun) env.sunColor = env.sunColor.map(v => v * L.sun);
    env.points = L.points || [];
    return env;
  }

  function camUp(cam) {
    const f = V3.norm(V3.sub(cam.at, cam.eye));
    let x = V3.cross(f, [0, 1, 0]);
    if (V3.len(x) < 1e-4) x = [1, 0, 0];
    x = V3.norm(x);
    const y = V3.cross(x, f);
    const r = cam.roll || 0;
    return V3.add(V3.mul(y, C(r)), V3.mul(x, S(r)));
  }

  const GRADE = [1.02, 1.0, 0.97, 0.06];

  function buildPage(r) {
    const T = {
      page: r.texture(512, Art.dictPage, { height: 640, clamp: true }),
      column: r.texture(128, Art.dictColumn, { height: 320, clamp: true }),
      edge: r.texture(64, Art.paperEdge, { height: 64 }),
      cover: r.texture(256, Art.dictCover, { height: 128 })
    };
    const V = {
      page: mesh(r, b => {
        const n = 6;
        for (let i = 0; i < n; i++) {
          const u0 = i / n, u1 = (i + 1) / n;
          const x0 = -0.125 + u0 * 0.2, x1 = -0.125 + u1 * 0.2;
          const z0 = -0.012 * S(u0 * PI), z1 = -0.012 * S(u1 * PI);
          b.quad([x0, -0.13, z0], [x1, -0.13, z1], [x1, 0.13, z1], [x0, 0.13, z0], 0xffffff, [[u0, 0], [u1, 0], [u1, 1], [u0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        }
      }),
      column: mesh(r, b => b.quad([0.075, -0.13, 0], [0.14, -0.13, -0.03], [0.14, 0.13, -0.03], [0.075, 0.13, 0], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]])),
      edge: mesh(r, b => b.quad([-0.15, -0.13, -0.035], [-0.125, -0.13, 0], [-0.125, 0.13, 0], [-0.15, 0.13, -0.035], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]])),
      cover: mesh(r, b => {
        b.quad([-0.17, -0.145, -0.075], [0.19, -0.145, -0.075], [0.19, 0.145, -0.075], [-0.17, 0.145, -0.075], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]]);
      }),
      fingers: mesh(r, b => {
        const skin = Cast.LOOKS.hugh.skin;
        [[0.0, 0.0], [0.036, 0.004], [0.07, 0.0]].forEach(([x, dz]) => {
          K.tube(b, [[x, 0.25, 0.05 + dz], [x + 0.003, 0.16, 0.034 + dz], [x + 0.005, 0.105, 0.012 + dz]], [0.017, 0.0165, 0.016], 10, skin);
          b.at(x + 0.005, 0.105, 0.012 + dz, h => h.ellipsoid(0.016, 0.019, 0.015, 8, 6, skin));
          b.at(x + 0.006, 0.104, 0.022 + dz, h => h.ellipsoid(0.01, 0.013, 0.005, 6, 4, 0xf9e4d6));
        });
      })
    };
    return { T, V };
  }

  function create(r) {
    const W = Diner.build(r);
    const P = Cast.build(r);
    const PG = buildPage(r);
    const FW = r.canvas.width || 480, FH = r.canvas.height || 360;
    const ov = K.overlay(r, FW, FH);
    const frame = r.frameTexture(false);
    const small = r.frameTexture(false);
    const logoTex = r.texture(256, Art.logo, { height: 160, clamp: true });

    function grab() {
      r.grab(frame, 0, 0, FW, FH);
    }

    function smear(dx, dy, k) {
      grab();
      ov.begin();
      const n = 7;
      for (let i = 1; i <= n; i++) {
        const u = i / n;
        ov.rect(dx * u * FW, dy * u * FH, FW, FH, { texture: frame, blend: true, alpha: k * (1 - u * 0.75) / (1 + i * 0.35) });
      }
    }

    function zoom(k) {
      grab();
      ov.begin();
      ov.rect(0, 0, FW, FH, { texture: frame });
      for (let i = 1; i <= 6; i++) {
        const sc = 1 + 0.05 * i * k;
        ov.rect((FW * (1 - sc)) / 2, (FH * (1 - sc)) / 2, FW * sc, FH * sc, { texture: frame, blend: true, alpha: (k * 0.7) / (1 + i * 0.4) });
      }
    }

    function soften(k) {
      grab();
      ov.begin();
      ov.rect(0, 0, FW / 4, FH / 4, { texture: frame });
      r.grab(small, 0, FH - FH / 4, FW / 4, FH / 4);
      ov.rect(0, 0, FW, FH, { texture: frame });
      ov.rect(0, 0, FW, FH, { texture: small, blend: true, alpha: k });
    }

    function cameraOf(st, t) {
      const c = st.camera;
      return {
        eye: c.eye,
        at: c.at,
        up: camUp(c),
        fov: c.fov || 40,
        near: c.near || 0.03,
        far: 60,
        grade: st.grade || GRADE,
        fx: { grain: 0.035, vignette: st.vignette === undefined ? 0.35 : st.vignette, time: t }
      };
    }

    function drawCast(st, cam, env) {
      (st.cast || []).forEach(c => {
        const s = Cast.solve(c.who, c.pose);
        if (c.shadow) {
          const a = s.pts.ankleL, b = s.pts.ankleR;
          Diner.drawShadow(r, W, (a[0] + b[0]) / 2, (a[2] + b[2]) / 2, c.shadow[0], c.shadow[1], c.shadow[2]);
        }
        Cast.draw(r, P, c.who, s, c.pose, c.opts);
      });
      (st.props || []).forEach(p => Cast.drawFree(r, P, p.kind, p.m));
    }

    function drawPage(st, t) {
      const pg = st.page;
      const cam = cameraOf(st, t);
      const env = envOf(st);
      r.begin(env, cam);
      Diner.draw(r, W, st);
      soften(0.85);
      r.begin(env, cam, null, true);
      const m = pg.out ? M4.mul(M4.translate(pg.out * 0.12, 0, 0), pg.m) : pg.m;
      r.draw(PG.V.cover, m, { texture: PG.T.cover, tint: [0.7, 0.7, 0.7] });
      r.draw(PG.V.edge, m, { texture: PG.T.edge });
      r.draw(PG.V.column, m, { texture: PG.T.column });
      r.draw(PG.V.page, M4.mul(m, M4.translate(0, 0, 0.002)), { texture: PG.T.page });
      r.draw(PG.V.fingers, M4.mul(m, M4.translate(-0.005 + (pg.fx || 0), 0.005 + (pg.fy || 0), 0)));
    }

    return {
      warm() {
        [0.5, 2.5, 3.6, 5.5, 8, 9.5, 11, 12.8, 15, 17.2, 18.9, 21, 24, 27.5, 28.3, 29.3, 31, 36, 39.3, 40.5, 43, 46.8, 47.6].forEach(t => this.render(t));
      },
      render(t) {
        const st = Script.stage(t);
        r.clear([0, 0, 0]);
        if (st.page) {
          drawPage(st, t);
        } else {
          const cam = cameraOf(st, t);
          const env = envOf(st);
          r.begin(env, cam);
          Diner.draw(r, W, st);
          (st.shadows || []).forEach(sh => Diner.drawShadow(r, W, sh[0], sh[1], sh[2], sh[3], sh[4]));
          if (st.soft) {
            soften(st.soft);
            r.begin(env, cam, null, true);
            r.gl.colorMask(false, false, false, false);
            Diner.draw(r, W, st);
            r.gl.colorMask(true, true, true, true);
          }
          drawCast(st, cam, env);
          Diner.drawFx(r, W, st, cam, t);
        }
        const polys = r.polys;
        if (st.smear) smear(st.smear[0], st.smear[1], st.smear[2]);
        if (st.zoomBlur) zoom(st.zoomBlur);
        const post = st.post === undefined ? 0.24 : st.post;
        if (post > 0.01) soften(post);
        ov.begin();
        if (st.flash) ov.rect(0, 0, FW, FH, { flat: [1, 0.96, 0.88, st.flash], blend: true });
        const lw = FW * 0.165, lh = lw * 0.62;
        ov.rect(FW * 0.755, FH * 0.07, lw, lh, { texture: logoTex, blend: true, alpha: 0.82 });
        if (st.fade) ov.rect(0, 0, FW, FH, { flat: [0, 0, 0, st.fade], blend: true });
        return { polys: Math.round(polys) };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/я мажу жопу вазелином.mp3',
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
