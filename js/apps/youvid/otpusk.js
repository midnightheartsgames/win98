(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp } = K;
  const World = window.OtpuskWorld;
  const Cast = window.OtpuskCast;
  const Script = window.OtpuskScript;
  const Rig = window.YouVidRig;

  const ENV = {
    sunDir: [-0.3, -0.8, -0.5],
    sunColor: [0.22, 0.2, 0.2],
    ambTop: [0.92, 0.9, 0.94],
    ambBottom: [0.52, 0.5, 0.5],
    fogColor: [0.86, 0.8, 0.86],
    fogNear: 70,
    fogFar: 420
  };

  const PINK = new Float32Array([0.92, 0.2, 0.26, 0.34, 0.47, 0.24, 0.02, 0.1, 0.56]);
  const PINK_ADD = [0.035, 0.005, 0.035];
  const NEGATIVE = PINK.map(v => -v);
  const NEGATIVE_ADD = [0, 1, 2].map(i => PINK[i] + PINK[3 + i] + PINK[6 + i] + PINK_ADD[i] - 0.1);
  const OW = 640;
  const OH = 360;

  function gagMatrix(st) {
    const g = st.gag;
    const plain = g.body.every(v => Math.abs(v - 1) < 1e-3) && !g.spin && Math.abs(g.lift) < 1e-3;
    if (plain) return null;
    const p = st.pose.p;
    const yaw = st.world.yaw;
    return M4.chain(
      M4.translate(p[0], g.lift, p[2]),
      M4.rotY(yaw + g.spin),
      M4.scale(g.body[0], g.body[1], g.body[2]),
      M4.rotY(-yaw),
      M4.translate(-p[0], 0, -p[2])
    );
  }

  function bigHead(m, s) {
    if (Math.abs(s - 1) < 1e-3) return m;
    return Object.assign({}, m, { head: M4.chain(m.neck, M4.translate(0, Cast.D.headY * s, 0.035 * s), M4.scale(s, s, s)) });
  }

  function memeText(text) {
    return K.textCanvas(1024, 192, (ctx, w, h) => {
      let size = 150;
      ctx.font = `bold ${size}px Impact, 'Arial Black', sans-serif`;
      while (ctx.measureText(text).width > w - 40 && size > 40) {
        size -= 6;
        ctx.font = `bold ${size}px Impact, 'Arial Black', sans-serif`;
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = size * 0.14;
      ctx.strokeStyle = '#000';
      ctx.strokeText(text, w / 2, h / 2);
      ctx.fillStyle = '#fff';
      ctx.fillText(text, w / 2, h / 2);
    });
  }

  function heartPic(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.font = `${Math.round(h * 0.9)}px 'Segoe UI Symbol', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = h * 0.06;
    ctx.strokeStyle = '#5a0020';
    ctx.strokeText('\u2665', w / 2, h * 0.55);
    ctx.fillStyle = '#ff3a7a';
    ctx.fillText('\u2665', w / 2, h * 0.55);
  }

  const HEARTS = [[0.14, 0.62, 70, 0], [0.82, 0.7, 90, 0.35], [0.24, 0.85, 54, 0.7], [0.7, 0.9, 64, 0.2], [0.5, 0.95, 80, 0.55]];

  function opHeadM(st, cam) {
    const v = Script.vladWorld(st.t);
    const base = M4.chain(M4.translate(v.x, Script.P_Y, v.z), M4.rotY(v.yaw));
    const at = M4.point(base, st.op.headAt || [0, 0.6, 1.0]);
    const look = V3.norm(V3.sub(cam.eye, at));
    const yaw = Math.atan2(look[0], look[2]);
    const pitch = Math.asin(clamp(look[1], -1, 1));
    const bob = st.op.voice * 0.02 * S(st.t * 12);
    return M4.chain(M4.translate(at[0], at[1] + bob, at[2]), M4.rotY(yaw), M4.rotX(-pitch * 0.7), M4.rotZ(S(st.t * 0.7) * 0.08));
  }

  function opArmM(st, cam, a) {
    const f = V3.norm(V3.sub(cam.at, cam.eye));
    const rgt = V3.norm(V3.cross(f, cam.up));
    const up = V3.cross(rgt, f);
    const local = (p) => V3.add(cam.eye, V3.add(V3.add(V3.mul(rgt, p[0]), V3.mul(up, p[1])), V3.mul(f, p[2])));
    const from = local(a.from || [0.32, -0.32, -0.05]);
    let to;
    if (a.part) {
      const m = st.m;
      const parts = { chin: M4.point(m.head, [0, -0.1, 0.1]), cheek: M4.point(m.head, [0.08, -0.02, 0.09]), belly: M4.point(m.chest, [0, -0.1, 0.36]), chest: M4.point(m.chest, [0.05, 0.2, 0.3]), shoulder: M4.point(m.chest, [-0.22, 0.32, 0.05]), hand: m.pts.wristR, bag: M4.point(m.handR, [0, -0.2, 0]) };
      to = parts[a.part] || parts.chest;
      if (a.off) to = V3.add(to, a.off);
    } else {
      const target = a.to || [0.05, -0.1, 0.5];
      to = local([target[0] * 0.6, target[1] * 0.55, target[2]]);
    }
    if (a.wag) to = V3.add(to, V3.mul(rgt, 0.05 * S(st.t * 14)));
    to = V3.lerp(V3.lerp(from, to, 0.35), to, a.k);
    const len = V3.len(V3.sub(to, from));
    const bone = Rig.boneM(from, to, up);
    return { m: M4.chain(bone, M4.scale(1, len / 0.72, 1)), to, f, up };
  }

  function create(r) {
    const W = World.build(r);
    const V = Cast.build(r);
    const ov = K.overlay(r, OW, OH);
    const texts = {};
    let heart = null;
    const textTex = (s) => texts[s] || (texts[s] = r.texture(1024, memeText(s), { height: 192, clamp: true }));

    function drawOverlay(st) {
      const g = st.gag;
      if (!g.text && g.hearts < 0) return;
      ov.begin();
      if (g.hearts >= 0) {
        heart = heart || r.texture(128, heartPic, { clamp: true });
        HEARTS.forEach(([x, y, size, delay]) => {
          const a = g.hearts - delay;
          if (a < 0) return;
          const s = size * Math.min(1, a * 4) * (1 + 0.12 * S(a * 9));
          const yy = y * OH - a * 55;
          ov.rect(x * OW - s / 2 + S(a * 3 + x * 9) * 10, yy - s / 2, s, s, { texture: heart, blend: true, noFog: true });
        });
      }
      if (g.text) {
        const pop = Math.min(1, g.textT * 6);
        const s = 1 + 0.25 * (1 - pop) + 0.03 * S(g.textT * 30);
        const w = OW * 0.92 * s, h = w * 192 / 1024;
        ov.rect((OW - w) / 2 + S(g.textT * 41) * 2, OH * 0.78 - h / 2, w, h, { texture: textTex(g.text), blend: true, noFog: true });
      }
    }

    return {
      warm() {},
      render(t) {
        const st = Script.stage(t);
        const cam = st.camera;
        const neg = st.gag.negative;
        const camera = { eye: cam.eye, at: cam.at, up: cam.up, fov: cam.fov, near: 0.03, far: 900, colorM: neg ? NEGATIVE : PINK, colorAdd: neg ? NEGATIVE_ADD : PINK_ADD, grade: [0.98, 0.96, 0.98, 0.12], fx: { grain: 0.035, vignette: 0.3, time: t } };
        r.begin(ENV, camera);
        World.draw(r, W, cam.eye);
        st.traffic.forEach(c => World.drawCar(r, W, c.kind, c.col, c.x, c.z, c.ry, c.lights));
        st.walkers.forEach(w => Cast.walkerDraw(r, V, w.kind, w.pos, w.yaw, w.phase, w.moving));
        const m = st.m;
        const G = gagMatrix(st);
        const rv = G ? { draw: (mesh, M, o) => r.draw(mesh, M4.mul(G, M), o) } : r;
        Cast.draw(rv, V, bigHead(m, st.gag.head), st.pose);
        const g = st.gag;
        const shadow = M4.chain(M4.translate(st.pose.p[0], 0.13, st.pose.p[2]), M4.rotY(st.world.yaw + g.spin), M4.scale(0.5 * g.body[0], 1, 0.4 * g.body[2]));
        r.draw(W.shadowBlob, shadow, { blend: true, alpha: 0.35, flat: [0.2, 0.18, 0.2, 1] });
        st.props.forEach(p => {
          if (p.bag) r.draw(p.bag === 'khaki' ? V.khakiBag : V.blackBag, M4.chain(M4.translate(p.at[0], p.bag === 'khaki' ? 0.45 : 0.29, p.at[1]), M4.rotY(p.ry || 0), M4.rotZ(p.tip || 0)));
          if (p.bottle) r.draw(V.bottle, M4.translate(p.at[0], 0.12, p.at[1]));
          if (p.leaf) r.draw(V.leaf, M4.chain(M4.translate(p.at[0], p.at[1], p.at[2]), M4.rotY(p.ry || 0), M4.rotX(p.rx || 0)));
        });
        if (st.op) {
          const hm = opHeadM(st, cam);
          r.draw(V.opHead, hm);
          r.draw(V.opFace, hm, { texture: V.opFaces[st.op.voice > 0.3 && st.op.mood === 'smirk' ? 'shout' : st.op.mood] || V.opFaces.smirk });
        }
        st.opArms.forEach(a => {
          const arm = opArmM(st, cam, a);
          r.draw(a.kind === 'point' ? V.opFinger : V.opArm, arm.m);
          if (a.leaf) r.draw(V.leaf, M4.chain(M4.translate(arm.to[0], arm.to[1], arm.to[2]), Rig.boneM([0, 0, 0], V3.mul(arm.up, -1), arm.f), M4.translate(0, -0.02, 0.03), M4.scale(1.6, 1.6, 1.6)));
        });
        const polys = Math.round(r.polys);
        drawOverlay(st);
        return { polys };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Савельев берет отпуск тли тотальное неуважение.mp3',
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
