(function () {
  const { M4 } = window.P3D;
  const K = window.YouVidKit;
  const { frac, mesh } = K;
  const Room = window.StraySet;
  const Script = window.StrayScript;

  const FW = 480;
  const FH = 270;
  const CAM_SPLIT = 0.785;
  const CHAT_TEX_W = 512;
  const CHAT_TEX_H = 2048;
  const CHAT_LOGICAL_H = CHAT_TEX_H * (Room.CHAT_W / CHAT_TEX_W);
  const CHAT_VISIBLE = FH * Room.CHAT_W / (FW * (1 - CAM_SPLIT));
  const FIRST_CHAT_ROW_AT_START = 32;

  const ENV = {
    sunDir: [0.2, -0.4, -0.9],
    sunColor: [0.34, 0.31, 0.29],
    ambTop: [0.86, 0.8, 0.78],
    ambBottom: [0.5, 0.44, 0.46],
    fogColor: [0.03, 0.02, 0.03],
    fogNear: 30,
    fogFar: 60,
    points: [{ pos: [-0.3, 0.2, 1.2], color: [0.22, 0.22, 0.26] }]
  };

  function create(r) {
    const V = Room.build(r);
    const ov = K.overlay(r, FW, FH);
    let layout = null;
    const chatTex = r.texture(CHAT_TEX_W, (ctx, w, h) => { layout = Room.drawChat(ctx, w, h, FIRST_CHAT_ROW_AT_START, CHAT_VISIBLE); }, { height: CHAT_TEX_H, clamp: true });
    const visFrac = CHAT_VISIBLE / CHAT_LOGICAL_H;
    const chatQuad = mesh(r, b => b.quad([0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, visFrac], [0, visFrac]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));
    const startRow = layout.rows[FIRST_CHAT_ROW_AT_START];
    const startBottom = startRow.y + startRow.parts.length * 14 + 3;
    const camera = { eye: [0, 0, 1], at: [0, 0, 0], fov: 40, near: 0.05, far: 30, grade: [1, 1, 1, 0], colorAdd: [0.01, 0.004, 0.01], fx: { grain: 0.05, vignette: 0.24, time: 0 } };

    return {
      warm() {},
      render(t) {
        const st = Script.stage(t);
        const cw = r.canvas.width || FW, ch = r.canvas.height || FH;
        const view = { x: 0, y: 0, w: Math.round(cw * CAM_SPLIT), h: ch };
        camera.grade = st.grade;
        camera.fx.time = frac(t * 0.37) * 100;
        r.begin(ENV, camera, view);
        Room.draw(r, V, st.pose);
        const polys = Math.round(r.polys);
        ov.begin();
        const bottom = startBottom + (layout.height - startBottom) * st.chat;
        const top = Math.max(0, Math.min(CHAT_LOGICAL_H - CHAT_VISIBLE, bottom - CHAT_VISIBLE));
        const scroll = 1 - (top + CHAT_VISIBLE) / CHAT_LOGICAL_H;
        const x = FW * CAM_SPLIT, w = FW - x;
        r.draw(chatQuad, M4.chain(M4.translate(x, FH, 0), M4.scale(w, -FH, 1)), { noFog: true, texture: chatTex, uvScroll: [0, scroll] });
        return { polys };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Стрей Не Оценил Губную Гармошку.mp3',
    duration: Script.DURATION,
    aspect: 16 / 9,
    stage: Script.stage,
    voiceAt: Script.VOICE,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
