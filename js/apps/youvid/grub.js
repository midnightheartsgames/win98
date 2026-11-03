(function () {
  const { M4 } = window.P3D;
  const K = window.YouVidKit;
  const { clamp } = K;
  const World = window.GrubWorld;
  const Cast = window.GrubCast;
  const UI = window.GrubUI;
  const Script = window.GrubScript;

  function talkEnv(sun) {
    return {
      sunDir: sun,
      sunColor: [0.74, 0.7, 0.64],
      ambTop: [0.43, 0.45, 0.5],
      ambBottom: [0.31, 0.29, 0.27],
      fogColor: [0.44, 0.44, 0.43],
      fogNear: 5,
      fogFar: 22,
      points: [
        { pos: [-0.7, 0.55, -0.45], color: [0.55, 0.36, 0.2] },
        { pos: [0.9, 0.7, 1.1], color: [0.22, 0.22, 0.24] }
      ]
    };
  }

  const CAMP_ENV = {
    sunDir: [0.55, -0.7, -0.45],
    sunColor: [0.78, 0.72, 0.6],
    ambTop: [0.5, 0.56, 0.62],
    ambBottom: [0.3, 0.3, 0.26],
    fogColor: [0.52, 0.56, 0.52],
    fogNear: 14,
    fogFar: 40,
    points: [
      { pos: [7.7, 1.0, 0.55], color: [0.9, 0.35, 0.12] },
      { pos: [-4.0, 1.9, -4.6], color: [0.6, 0.35, 0.12] }
    ]
  };

  const GRADE = [1.02, 1.0, 0.98, 0.04];

  function stripMeshes(r, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const y0 = i / n, y1 = (i + 1) / n;
      out.push({ y: (y0 + y1) / 2, mesh: K.mesh(r, b => b.quad([0, y0, 0], [1, y0, 0], [1, y1, 0], [0, y1, 0], [1, 1, 1, 1], [[0, 1 - y0], [1, 1 - y0], [1, 1 - y1], [0, 1 - y1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]])) });
    }
    return out;
  }

  function create(r) {
    const cw = r.canvas.width || 480, ch = r.canvas.height || 270;
    const Y = World.buildYard(r);
    const Cp = World.buildCamp(r);
    const P = Cast.build(r);
    const px = K.overlay(r, cw, ch);
    const ov = K.overlay(r, UI.W, UI.H);
    const F = { full: r.frameTexture(false), half: r.frameTexture(false), quarter: r.frameTexture(false), eighth: r.frameTexture(false), sixteenth: r.frameTexture(false) };
    const strips = stripMeshes(r, 12);
    const uiOpts = { height: ch, clamp: true, nearest: true };
    const hudTex = r.texture(cw, K.textCanvas(UI.W, UI.H, UI.hud), uiOpts);
    const cursorTex = r.texture(64, UI.cursor, { clamp: true });
    const dialogTex = new Map();

    function dialogTexture(ui) {
      const key = JSON.stringify([ui.line, ui.options, ui.hover, ui.gold]);
      if (!dialogTex.has(key)) dialogTex.set(key, r.texture(cw, K.textCanvas(UI.W, UI.H, UI.dialog(ui)), uiOpts));
      return dialogTex.get(key);
    }

    function blur(amount, focus) {
      r.grab(F.full, 0, 0, cw, ch);
      px.begin();
      px.rect(0, 0, cw / 2, ch / 2, { texture: F.full });
      r.grab(F.half, 0, ch - Math.round(ch / 2), Math.round(cw / 2), Math.round(ch / 2));
      px.rect(0, 0, cw / 4, ch / 4, { texture: F.half });
      r.grab(F.quarter, 0, ch - Math.round(ch / 4), Math.round(cw / 4), Math.round(ch / 4));
      px.rect(0, 0, cw / 8, ch / 8, { texture: F.quarter });
      r.grab(F.eighth, 0, ch - Math.round(ch / 8), Math.round(cw / 8), Math.round(ch / 8));
      px.rect(0, 0, cw / 16, ch / 16, { texture: F.eighth });
      r.grab(F.sixteenth, 0, ch - Math.round(ch / 16), Math.round(cw / 16), Math.round(ch / 16));
      px.rect(0, 0, cw, ch, { texture: F.full });
      const S = M4.scale(cw, ch, 1);
      strips.forEach(s => {
        const d = Math.abs(s.y - focus);
        const k = amount * clamp(0.3 + d * 1.8, 0, 1);
        r.draw(s.mesh, S, { texture: F.quarter, blend: true, alpha: clamp(k * 1.3, 0, 1), noFog: true });
        r.draw(s.mesh, S, { texture: F.eighth, blend: true, alpha: clamp(k, 0, 1), noFog: true });
        r.draw(s.mesh, S, { texture: F.sixteenth, blend: true, alpha: clamp(k * k * 0.9, 0, 1), noFog: true });
      });
    }

    function camera(st) {
      return {
        eye: st.camera.eye,
        at: st.camera.at,
        fov: st.camera.fov,
        near: st.kind === 'camp' ? 0.3 : 0.02,
        far: st.kind === 'camp' ? 60 : 12,
        grade: GRADE,
        fx: { grain: 0.012, vignette: 0.12, time: st.t }
      };
    }

    function drawCursor(ui) {
      const c = ui.cursor;
      ov.rect(c[0], c[1], 22, 22, { texture: cursorTex });
    }

    return {
      warm() {
        dialogTexture(Script.stage(3).ui);
      },
      render(t) {
        const st = Script.stage(t);
        const cam = camera(st);
        const sol = Cast.solve(Object.assign({ thin: cw > 600 }, st.cat));
        if (st.kind === 'camp') {
          r.begin(CAMP_ENV, cam);
          World.drawCamp(r, Cp, st.t);
          Cast.drawShadow(r, P, sol, CAMP_ENV.sunDir, { alpha: 0.35 });
          Cast.draw(r, P, sol, { outline: [1, 0.86, 0.3, 1] });
          ov.begin();
          ov.rect(0, 0, UI.W, UI.H, { texture: hudTex });
          drawCursor(st.ui);
          return { polys: Math.round(r.polys) };
        }
        const env = talkEnv(st.sun);
        r.begin(env, cam);
        World.drawYard(r, Y);
        Cast.drawShadow(r, P, sol, st.sun, { alpha: 0.5 });
        if (st.blur > 0) blur(st.blur, st.focus);
        r.begin(env, cam, null, true);
        Cast.draw(r, P, sol);
        ov.begin();
        ov.rect(0, 0, UI.W, UI.H, { texture: dialogTexture(st.ui) });
        drawCursor(st.ui);
        return { polys: Math.round(r.polys) };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: "content/YouVid/Cats in Baldur's Gate 3 are too real.mp3",
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
