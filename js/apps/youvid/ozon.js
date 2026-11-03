(function () {
  const { M4 } = window.P3D;
  const K = window.YouVidKit;
  const World = window.OzonWorld;
  const Cast = window.OzonCast;
  const Over = window.OzonOverlay;
  const Script = window.OzonScript;
  const Rig = window.YouVidRig;
  const SKIN = 0xdcae98;

  const OV_W = 480;
  const OV_H = 270;

  function buildHand(r) {
    return {
      open: K.mesh(r, b => {
        b.box(0.09, 0.028, 0.1, SKIN);
        [-0.03, -0.01, 0.01, 0.03].forEach(x => b.at(x, 0, -0.085, h => h.box(0.018, 0.02, 0.075, SKIN)));
        b.push(M4.translate(0.05, 0, 0.0), M4.rotY(-0.6));
        b.at(0, 0, -0.04, h => h.box(0.022, 0.022, 0.06, SKIN));
        b.pop();
      }),
      grip: K.mesh(r, b => {
        b.box(0.09, 0.03, 0.1, SKIN);
        b.at(0, -0.025, -0.06, h => h.box(0.085, 0.05, 0.035, SKIN));
      }),
      arm: K.mesh(r, b => {
        b.push(M4.rotX(Math.PI / 2));
        Rig.loft(b, [Rig.ring(-0.42, 0.05, 0.045, 0, SKIN), Rig.ring(-0.04, 0.036, 0.03, 0, SKIN)], 8, { capTop: true });
        b.pop();
      })
    };
  }

  function create(r) {
    const W = World.build(r);
    const V = Cast.build(r);
    const ov = K.overlay(r, OV_W, OV_H);
    const hand = buildHand(r);
    const cache = {};
    let cacheKeys = [];
    const overlayTex = (st) => {
      const key = Over.stateKey(st);
      if (!cache[key]) {
        cache[key] = r.texture(1024, Over.drawer(st), { height: 576, clamp: true });
        cacheKeys.push(key);
        if (cacheKeys.length > 24) {
          const old = cacheKeys.shift();
          r.gl.deleteTexture(cache[old]);
          delete cache[old];
        }
      }
      return cache[key];
    };
    const marquee = r.texture(512, Over.marquee, { height: 32 });
    return {
      warm() {
        [0, 14, 21, 30, 66, 70, 75, 95, 106].forEach(t => overlayTex(Over.state(Script.stage(t).overlay, t) || { kind: 'none' }));
      },
      render(t) {
        const st = Script.stage(t);
        const w = r.canvas.width || 480, h = r.canvas.height || 270;
        const c = st.camera;
        const fade = st.fade;
        const g = st.grade || [1, 1, 1, 0];
        const camera = {
          proj: M4.perspective(c.fov, w / h, 0.03, 40),
          eye: c.eye,
          at: c.at,
          up: c.up,
          grade: [g[0] * fade, g[1] * fade, g[2] * fade, g[3]],
          colorAdd: (st.colorAdd || [0, 0, 0]).map(v => v * fade),
          fx: { grain: 0.03, vignette: st.set === 'cam' ? 0.3 : 0.22, time: K.frac(t * 0.37) * 100 }
        };
        r.begin(st.env, camera);
        World.draw(r, W, st);
        (st.cast || []).forEach(p => {
          const m = Cast.solve(p.who, p.pose);
          Cast.draw(r, V, p.who, m, p.pose);
        });
        if (st.hand) {
          const hd = st.hand;
          const mm = M4.chain(M4.translate(hd.pos[0], hd.pos[1], hd.pos[2]), M4.rotY(hd.yaw || 0), M4.rotX(hd.pitch || 0));
          r.draw(hd.open ? hand.open : hand.grip, mm);
          r.draw(hand.arm, mm);
        }
        const polys = Math.round(r.polys);
        const ost = st.overlay ? Over.state(st.overlay, t) : null;
        ov.begin();
        if (st.blur) ov.rect(0, 0, OV_W, OV_H, { blend: true, alpha: st.blur * 0.12, flat: [0.95, 0.94, 0.92, 1] });
        if (ost) {
          ov.rect(0, 0, OV_W, OV_H, { blend: true, alpha: fade, texture: overlayTex(ost) });
          if (st.overlay === 'goal') {
            const mq = Over.MARQUEE;
            ov.rect(mq.x / 2, mq.y / 2, mq.w / 2, mq.h / 2, { blend: true, alpha: 1, texture: marquee, uvScroll: [Over.marqueeShift(t), 0] });
          }
        }
        if (st.flash > 0) ov.rect(0, 0, OV_W, OV_H, { blend: true, alpha: st.flash * 0.75, flat: [0.82, 0.88, 1.0, 1] });
        if (fade < 0.999) ov.rect(0, 0, OV_W, OV_H, { blend: true, alpha: 1 - fade, flat: [0, 0, 0, 1] });
        return { polys };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Кладбище телевизоров Озона.mp3',
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
