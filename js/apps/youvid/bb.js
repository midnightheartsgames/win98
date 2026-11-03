(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, mesh } = K;
  const Cast = window.BreakCast;
  const Sets = window.BreakSets;
  const Shots = window.BreakShots;
  const Script = window.BreakScript;
  const Art = window.BreakArt;

  const ASPECT = 16 / 9;
  const OW = 640;
  const OH = 360;
  const SMILES = ['walt', 'hank', 'saul', 'eladio'];

  function cropOf(rect, shot, panel) {
    const aspect = (rect[2] * 16) / (rect[3] * 9);
    let sw = 1, sh = 1;
    if (aspect < ASPECT) sw = aspect / ASPECT;
    else sh = ASPECT / aspect;
    const c = (shot.crop && (shot.crop[panel] || shot.crop.any)) || [0.5, 0.5, 1];
    const z = c[2] || 1;
    sw *= z;
    sh *= z;
    return [clamp(c[0], sw / 2, 1 - sw / 2), clamp(c[1], sh / 2, 1 - sh / 2), sw, sh];
  }

  function cropMatrix(c) {
    const sx = 1 / c[2], sy = 1 / c[3];
    const nx = c[0] * 2 - 1, ny = 1 - c[1] * 2;
    return new Float32Array([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, 1, 0, -sx * nx, -sy * ny, 0, 1]);
  }

  function viewOf(cam) {
    const fwd = V3.norm(V3.sub(cam.at, cam.eye));
    let right = V3.cross(fwd, [0, 1, 0]);
    right = V3.len(right) < 1e-4 ? [1, 0, 0] : V3.norm(right);
    const up0 = V3.cross(right, fwd);
    const roll = cam.roll || 0;
    const up = V3.add(V3.mul(up0, C(roll)), V3.mul(right, S(roll)));
    return M4.lookAt(cam.eye, cam.at, up);
  }

  function buildProps(r) {
    const P = Sets.PROPS;
    return {
      gun: mesh(r, b => P.revolver(b)),
      bottle: mesh(r, b => P.bottle(b)),
      phone: mesh(r, b => b.box(0.05, 0.11, 0.012, 0x141416)),
      paper: mesh(r, b => b.quad([-0.105, -0.14, 0], [0.105, -0.14, 0], [0.105, 0.14, 0], [-0.105, 0.14, 0], [1, 1, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]])),
      clipboard: mesh(r, b => {
        b.box(0.23, 0.32, 0.008, 0x8a6a3a);
        b.at(0, 0.0, 0.006, q => q.box(0.21, 0.28, 0.004, 0xf2f0ea));
        b.at(0, 0.15, 0.01, q => q.box(0.08, 0.03, 0.012, 0x9a9a9c));
      }),
      cane: mesh(r, b => P.cyl(b, 0, -0.9, 0, 0.012, 0.012, 1.25, 0x3a2a1a, 8))
    };
  }

  function create(r) {
    const CST = Cast.build(r);
    const SET = Sets.build(r);
    const A = SET.A;
    const PR = buildProps(r);
    const ov = K.overlay(r, OW, OH);
    const mark = r.texture(256, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      Art.text(ctx, 'placeboing', w * 0.96, h * 0.5, h * 0.42, '#141414', { align: 'right', weight: '600', font: 'Verdana, Arial, sans-serif' });
    }, { height: 64, clamp: true });
    let polys = 0;

    function rectPx(rect) {
      const W = r.canvas.width, H = r.canvas.height;
      const x0 = Math.round(rect[0] * W), x1 = Math.round((rect[0] + rect[2]) * W);
      const y0 = Math.round((1 - rect[1] - rect[3]) * H), y1 = Math.round((1 - rect[1]) * H);
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }

    function drawProp(kind, m, look, t) {
      const hp = (s, off) => M4.point(m['hand' + s], off || [0, -0.06, 0]);
      if (kind === 'gun' || kind === 'bigGun') {
        const k = kind === 'bigGun' ? 1.9 : 1;
        r.draw(PR.gun, M4.chain(m.handR, M4.translate(0.0, -0.05, 0.02), M4.rotX(PI / 2), M4.scale(k, k, k)));
      } else if (kind === 'bottle') {
        const p = hp('R', [0, -0.07, 0]);
        r.draw(PR.bottle, M4.chain(M4.translate(p[0], p[1] - 0.16, p[2] + 0.02), M4.rotZ(0.25), M4.rotX(-0.15)));
      } else if (kind === 'phone') {
        const p = hp('L', [0, -0.07, 0]);
        r.draw(PR.phone, M4.chain(M4.translate(p[0], p[1] + 0.02, p[2]), M4.rotY(0.9), M4.rotZ(0.4)));
      } else if (kind === 'paper') {
        const p = hp('R', [0, -0.08, 0]);
        r.draw(PR.paper, M4.chain(M4.translate(p[0] + 0.02, p[1] + 0.08, p[2]), M4.rotY(0.35), M4.rotZ(0.1)), { texture: A.tex('paper', 256, { height: 256 }) });
      } else if (kind === 'clipboard') {
        const p = hp('R', [0, -0.08, 0]);
        r.draw(PR.clipboard, M4.chain(M4.translate(p[0], p[1] - 0.05, p[2] + 0.04), M4.rotX(-0.5), M4.rotY(0.3)));
      } else if (kind === 'cane') {
        const p = hp('R', [0, -0.07, 0]);
        r.draw(PR.cane, M4.chain(M4.translate(p[0], p[1], p[2]), M4.rotZ(0.15), M4.rotX(0.25), M4.rotZ(PI)));
      }
    }

    function renderPanel(p, t, st) {
      if (p.shot === 'black') return;
      const shot = Shots.SHOTS[p.shot];
      if (!shot) return;
      const px = rectPx(p.rect);
      if (px.w < 2 || px.h < 2) return;
      const actors = (shot.actors ? shot.actors(t) : []).map(a => {
        const pose = Object.assign({}, a.pose);
        const L = Cast.LOOKS[a.look];
        if (L && L.head === st.singer && a.sing !== false) pose.jaw = clamp((st.voice - 0.12) / 0.5, 0, 1);
        const m = Cast.solve(a.look, pose);
        return { a, pose, m, head: M4.point(m.head, [0, 0, 0]) };
      });
      const cam = shot.cam(t, actors.map(x => x.head));
      const crop = cropOf(p.rect, shot, p.panel);
      const proj = M4.mul(cropMatrix(crop), M4.perspective(cam.fov, ASPECT, cam.near || 0.03, 160));
      r.begin(shot.env, { proj, view: viewOf(cam), eye: cam.eye, grade: shot.grade, fx: shot.fx }, px, false);
      SET.get(shot.set)(t, shot.setOpt, cam);
      actors.forEach(({ a, pose, m }) => {
        Cast.draw(r, CST, a.look, m, pose);
        if (a.prop) drawProp(a.prop, m, a.look, t);
      });
      if (shot.arms) shot.arms(t).forEach(a => Cast.drawArm(r, CST, a.look, a.side, a.elbow, a.wrist, a.grip, { w: a.w, ring: a.ring, upper: a.upper, front: a.front }));
      polys += r.polys;
    }

    return {
      warm() {
        SET.keys.forEach(k => SET.get(k));
        Object.keys(Cast.LOOKS).forEach(id => CST.lookFor(id));
        Object.keys(Cast.HEADS).forEach(h => [0, 1, 2, 3].forEach(l => {
          CST.headFor(h).get(l, 0);
          if (SMILES.includes(h)) CST.headFor(h).get(l, 1);
        }));
      },
      render(t) {
        const st = Script.stage(t);
        polys = 0;
        r.clear([0, 0, 0]);
        st.panels.forEach(p => renderPanel(p, t, st));
        if (t < 2.6) {
          const a = clamp((2.6 - t) / 1.0, 0, 1);
          ov.begin();
          ov.rect(OW - 236, OH - 46, 230, 57.5, { texture: mark, blend: true, alpha: a });
        }
        return { polys: Math.round(polys) };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Breaking Bad Remix (Seasons 3-5).mp3',
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
