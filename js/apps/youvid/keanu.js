(function () {
  const K = window.YouVidKit;
  const Art = window.KeanuArt;
  const Script = window.KeanuScript;

  const FW = 640;
  const FH = 360;
  const BOX = { x: 118, y: 25, w: 404, h: 227 };
  const BORDER = 3;
  const BLACK = { flat: [0, 0, 0, 1] };
  const WHITE = { flat: [1, 1, 1, 1] };

  function create(r) {
    const ov = K.overlay(r, FW, FH);
    const scenes = {};
    Script.SHOTS.forEach(s => {
      if (!scenes[s.scene]) scenes[s.scene] = r.texture(FW, Art.sceneDrawer(s.scene), { height: FH, clamp: true });
    });
    const captions = {};
    Script.SHOTS.forEach(s => {
      if (s.caption && !captions[s.caption]) captions[s.caption] = r.texture(512, Art.captionDrawer(s.caption), { height: 64, clamp: true });
    });
    const mouth = r.texture(64, Art.mouthDrawer, { height: 32, clamp: true });
    const rating = r.texture(72, Art.ratingDrawer, { height: 96, clamp: true });
    const logo = r.texture(128, Art.logoDrawer, { height: 40, clamp: true });

    function drawMask(region) {
      ov.rect(0, 0, FW, region.y, BLACK);
      ov.rect(0, region.y + region.h, FW, FH - region.y - region.h, BLACK);
      ov.rect(0, region.y, region.x, region.h, BLACK);
      ov.rect(region.x + region.w, region.y, FW - region.x - region.w, region.h, BLACK);
    }

    function drawBorder(region) {
      const x = region.x - BORDER, y = region.y - BORDER, w = region.w + BORDER * 2, h = region.h + BORDER * 2;
      ov.rect(x, y, w, BORDER, WHITE);
      ov.rect(x, y + h - BORDER, w, BORDER, WHITE);
      ov.rect(x, y, BORDER, h, WHITE);
      ov.rect(x + w - BORDER, y, BORDER, h, WHITE);
    }

    return {
      warm() {},
      render(t) {
        const st = Script.stage(t);
        const shot = st.shot;
        const region = shot.boxed ? BOX : { x: 0, y: 0, w: FW, h: FH };
        r.clear([0, 0, 0]);
        ov.begin();
        const w = region.w * st.zoom;
        const h = region.h * st.zoom;
        const x = region.x + region.w / 2 - w / 2 + st.pan[0] * region.w;
        const y = region.y + region.h / 2 - h / 2 + st.pan[1] * region.h;
        ov.rect(x, y, w, h, { texture: scenes[shot.scene] });

        const face = Art.FACES[shot.scene];
        if (shot.talk && face && st.mouth > 0.08) {
          const sx = w / Art.W;
          const mw = face.mouth[2] * sx;
          const mh = mw * 0.5 * st.mouth;
          ov.rect(x + face.mouth[0] * sx - mw / 2, y + face.mouth[1] * sx - mh / 2, mw, mh, { texture: mouth });
        }

        if (shot.boxed) {
          drawMask(region);
          drawBorder(region);
          ov.rect(region.x, 266, region.w, 50.5, { texture: captions[shot.caption] });
        } else {
          if (shot.logo) ov.rect(6, 4, 128, 40, { texture: logo });
          if (shot.rating) ov.rect(14, 292, 36, 48, { texture: rating });
        }
        return { polys: Math.round(r.polys) };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Keanu Reeves is Extremely Horny.mp3',
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
