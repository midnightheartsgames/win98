(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { S, C, clamp } = K;
  const A = window.StsArt;
  const World = window.StsWorld;
  const Cast = window.StsCast;
  const Script = window.StsScript;

  const OV_W = 480;
  const OV_H = 270;
  const LOGO_ENV = { sunDir: [-0.45, -0.6, -0.65], sunColor: [0.62, 0.48, 0.2], ambTop: [0.95, 0.82, 0.56], ambBottom: [0.5, 0.34, 0.12], fogColor: [0, 0, 0], fogNear: 100, fogFar: 200, points: [{ pos: [-2, 2, 4], color: [0.6, 0.5, 0.3] }] };
  const SELECT_GREY = [0.96, 0.96, 1.0, 0.72];
  const OVERLAYS = { rules: A.rules, ren: A.renPlate, donate: A.donate, chat: A.chatMark, greek: A.greekTv('full'), tvbug: A.greekTv('bug'), band: A.pinkBand, grecii: A.grecii };

  function facing(cam, p, s) {
    const f = V3.norm(V3.sub(cam.at, cam.eye));
    const r = V3.norm(V3.cross(f, cam.up || [0, 1, 0]));
    const u = V3.cross(r, f);
    return new Float32Array([r[0] * s, r[1] * s, r[2] * s, 0, u[0] * s, u[1] * s, u[2] * s, 0, -f[0] * s, -f[1] * s, -f[2] * s, 0, p[0], p[1], p[2], 1]);
  }

  function create(r) {
    const W = World.build(r);
    const V = Cast.build(r);
    const Room = window.VladRoom;
    const VC = window.VladCast;
    let room = null, vlad = null;
    const roomOf = () => room || (room = Room.buildStatic(r));
    const vladOf = () => vlad || (vlad = VC.build(r));
    const ov = K.overlay(r, OV_W, OV_H);
    const tex = {};
    const overlayTex = (key) => tex[key] || (tex[key] = r.texture(1024, OVERLAYS[key], { height: 576, clamp: true }));

    function drawProps(st, P) {
      const pr = st.props || {};
      if (pr.croc) r.draw(P.croc, pr.croc);
      if (pr.things) pr.things.forEach(m => r.draw(P.thing, m));
      if (pr.pack) {
        r.draw(P.pack, pr.pack, { texture: P.packTex });
        r.draw(P.packTop, pr.pack);
      }
      if (pr.garment) r.draw(P.garment, pr.garment);
      if (pr.heap) r.draw(P.garment, M4.mul(pr.heap, M4.rotZ(1.45)));
    }

    function drawCast(st, opts) {
      st.cast.forEach(c => Cast.draw(r, V, c.who, Cast.solve(c.who, c.pose), c.pose, Object.assign({}, c.opts || {}, opts || {})));
    }

    return {
      warm() {
        Object.keys(OVERLAYS).forEach(overlayTex);
        for (let t = 0; t < Script.DURATION; t += 0.5) {
          const st = Script.stage(t);
          if (World.SETS[st.set]) W.get(st.set);
          if (st.set === 'vlad' || st.set === 'vladroom') roomOf();
          if (st.vlad) vladOf();
          st.cast.forEach(c => V.get(c.who).outfitFor(Cast.outfitOf(c.who, c.pose)));
        }
      },
      render(t) {
        const st = Script.stage(t);
        const w = r.canvas.width || 480, h = r.canvas.height || 270;
        const c = st.camera;
        const grade = st.selective ? SELECT_GREY : st.grade || [1, 1, 1, 0];
        const camera = {
          proj: M4.perspective(c.fov, w / h, 0.03, 1500),
          eye: c.eye,
          at: c.at,
          up: c.up,
          grade,
          colorAdd: st.under ? [0.0, 0.03, 0.03] : [0, 0, 0],
          fx: { grain: 0.035, vignette: st.under ? 0.5 : 0.22, time: K.frac(t * 0.37) * 100 }
        };
        r.clear([0, 0, 0]);
        r.begin(st.env, camera);
        if (st.set === 'vlad' || st.set === 'vladroom') Room.drawRoom(r, roomOf(), (st.props && st.props.room) || {});
        else World.draw(r, W, st.set, st);
        if (st.vlad) VC.draw(r, vladOf(), st.vlad.m, st.vlad.pose);
        if (st.selective) {
          drawCast(st, { part: 'rest' });
          r.gl.uniform4fv(r.loc.uGrade, [1.02, 1.02, 1.06, 0.0]);
          drawCast(st, { part: 'top' });
          r.gl.uniform4fv(r.loc.uGrade, grade);
        } else drawCast(st);
        drawProps(st, W.props);
        if (st.props && st.props.carton && st.cast[0]) {
          const m = Cast.solve(st.cast[0].who, st.cast[0].pose);
          r.draw(W.props.carton, M4.chain(m.handL, M4.translate(0, -0.12, 0.02)));
        }
        if (st.sun) {
          const p = V3.add(c.eye, V3.mul(st.sun.dir, 200));
          r.draw(W.props.glow, facing(c, p, 75), { additive: true, alpha: 0.75, noFog: true });
          r.draw(W.props.sun, facing(c, p, 6), { noFog: true });
        }
        const polys = Math.round(r.polys);
        ov.begin();
        if (st.overlay === 'greek') ov.rect(0, 0, OV_W, OV_H, { blend: true, alpha: 0.42, texture: overlayTex('band') });
        if (st.overlay) ov.rect(0, 0, OV_W, OV_H, { blend: true, texture: overlayTex(st.overlay) });
        if (st.grecii) ov.rect(0, 0, OV_W, OV_H, { blend: true, texture: overlayTex('grecii') });
        if (st.wipe > 0) {
          const k = st.wipe;
          ov.rect(0, 0, OV_W, OV_H, { blend: true, alpha: k * 0.6, flat: [0.86, 0.9, 0.95, 1] });
          ov.rect(0, OV_H * (0.12 + 0.3 * k), OV_W * k, 18, { blend: true, alpha: 0.9, flat: [0.85, 0.12, 0.14, 1] });
          ov.rect(0, 0, OV_W, OV_H, { blend: true, alpha: k * 0.8, texture: overlayTex('greek') });
        }
        if (st.letterbox) {
          ov.rect(0, 0, OV_W, OV_H * st.letterbox, { flat: [0, 0, 0, 1] });
          ov.rect(0, OV_H * (1 - st.letterbox), OV_W, OV_H * st.letterbox, { flat: [0, 0, 0, 1] });
        }
        const lw = Math.round(w * 0.112), lh = Math.round(h * 0.17);
        r.begin(LOGO_ENV, { eye: [0, 0, 6.2], at: [0, 0, 0], fov: 30, near: 1, far: 20 }, { x: Math.round(w * 0.042), y: Math.round(h * (1 - 0.232)), w: lw, h: lh }, true);
        r.draw(W.logo, M4.ident(), { noFog: true });
        return { polys };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Влад Савельев на СТС, но он реально на СТС.mp3',
    duration: Script.DURATION,
    aspect: 16 / 9,
    cuts: Script.CUTS,
    stage: Script.stage,
    voiceAt: Script.voice,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
