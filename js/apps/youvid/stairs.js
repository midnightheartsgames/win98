(function () {
  const { M4, V3, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh } = K;
  const World = window.StairsWorld;
  const Cast = window.StairsCast;
  const Script = window.StairsScript;
  const Art = window.StairsArt;

  const OW = 640;
  const OH = 360;
  const BAR = 0.0195;

  const SMOKE = {
    mcu: [
      { t0: 28.42, t1: 28.9, from: 'mouth', dir: [-0.22, 0.06, 0.12], rate: 14, life: 1.4, size: [0.05, 0.3], a: 0.08 },
      { t0: 30.05, t1: 30.4, from: 'mouth', dir: [0.2, 0.08, 0.1], rate: 12, life: 1.2, size: [0.05, 0.25], a: 0.07 }
    ],
    cu: [
      { t0: 69.4, t1: 74.6, from: 'tip', dir: [-0.01, 0.07, 0.0], rate: 7, life: 1.8, size: [0.015, 0.09], a: 0.1 },
      { t0: 69.4, t1: 69.9, from: 'mouth', dir: [-0.2, 0.04, 0.04], rate: 16, life: 1.6, size: [0.04, 0.28], a: 0.07 },
      { t0: 71.6, t1: 72.4, from: 'mouth', dir: [0.22, 0.03, 0.06], rate: 16, life: 1.7, size: [0.04, 0.3], a: 0.07 },
      { t0: 74.8, t1: 77.8, from: 'mouth', dir: [0.0, 0.24, 0.02], rate: 16, life: 1.8, size: [0.05, 0.34], a: 0.08 },
      { t0: 74.8, t1: 78.4, from: 'tip', dir: [0.01, 0.1, 0.0], rate: 7, life: 1.5, size: [0.015, 0.08], a: 0.1 }
    ]
  };

  function viewOf(cam) {
    return M4.lookAt(cam.eye, cam.at, cam.up || [0, 1, 0]);
  }

  function create(r) {
    const WD = World.build(r);
    const CST = Cast.build(r);
    const fx = window.NagFx.create(r);
    const ov = K.overlay(r, OW, OH);
    const titleTex = r.texture(1024, Art.title, { height: 512, clamp: true });
    const puffTex = r.texture(128, Art.puff, { clamp: true });
    const flareTex = r.texture(128, Art.flare, { clamp: true });
    const sprite = mesh(r, b => b.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [1, 1, 1, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));
    let polys = 0;

    function camera(st) {
      const c = st.camera;
      const G = Script.GRADE[st.gradeKey] || Script.GRADE.stairs;
      return {
        eye: c.eye,
        at: c.at,
        up: c.up || [0, 1, 0],
        fov: c.fov || 40,
        near: c.near || 0.03,
        far: c.far || 260,
        view: viewOf(c),
        grade: G.grade,
        colorAdd: G.add,
        fx: { grain: 0.035, vignette: 0.28, time: st.t }
      };
    }

    function drawActors(st) {
      st.actors.forEach(a => {
        const m = Cast.solve(a.look, a.pose);
        a.m = m;
        Cast.draw(r, CST, a.look, m, a.pose);
      });
    }

    function billboard(view, p, size, rot) {
      const rx = [view[0], view[4], view[8]], uy = [view[1], view[5], view[9]], fz = [view[2], view[6], view[10]];
      const c = C(rot || 0), s = S(rot || 0);
      const ax = V3.add(V3.mul(rx, c), V3.mul(uy, s)), ay = V3.add(V3.mul(uy, c), V3.mul(rx, -s));
      return new Float32Array([ax[0] * size, ax[1] * size, ax[2] * size, 0, ay[0] * size, ay[1] * size, ay[2] * size, 0, fz[0], fz[1], fz[2], 0, p[0], p[1], p[2], 1]);
    }

    function drawSmoke(st, cam) {
      const list = SMOKE[st.fx.smoke];
      const jk = st.actors.find(a => a.look === 'joker');
      if (!list || !jk || !jk.m) return;
      const H = Cast.HEADS.joker;
      const mouth = M4.point(jk.m.head, [0, S(H.mouth) * H.ry - 0.004, H.rz * 1.02]);
      const tip = jk.pose.cig ? Cast.cigTip(jk.m, jk.pose, H) : mouth;
      list.forEach((e, ei) => {
        const step = 1 / e.rate;
        for (let te = e.t0; te <= Math.min(e.t1, st.t); te += step) {
          const age = st.t - te;
          if (age < 0 || age > e.life) continue;
          const g = rand(Math.round(te * 1000) + ei * 7919);
          const k = age / e.life;
          const src = e.from === 'tip' ? tip : mouth;
          const drift = [(g() - 0.5) * 0.08 * age, 0.05 * age * age, (g() - 0.5) * 0.05 * age];
          const p = V3.add(V3.add(src, V3.mul(e.dir, age * (1.4 - 0.5 * k))), drift);
          const size = lerp(e.size[0], e.size[1], Math.sqrt(k)) * (0.8 + g() * 0.4);
          const a = e.a * (1 - k) * Math.min(1, age * 6);
          r.draw(sprite, billboard(cam.view, p, size, g() * PI * 2), { texture: puffTex, additive: true, alpha: a, tint: [0.85, 0.9, 0.92] });
        }
      });
    }

    function overlays(st) {
      ov.begin();
      if (st.fx.flare > 0.01) {
        const f = st.fx.flare;
        ov.rect(OW * 0.36, OH * 0.66, OW * 0.26, OH * 0.4, { texture: flareTex, additive: true, alpha: 0.85 * f });
        ov.rect(OW * 0.44, OH * 0.4, OW * 0.08, OH * 0.12, { texture: flareTex, additive: true, alpha: 0.4 * f });
      }
      if (st.fx.black > 0.002) ov.rect(0, 0, OW, OH, { flat: [0, 0, 0, clamp(st.fx.black, 0, 1)], blend: true });
      if (st.fx.title > 0.002) {
        const a = st.fx.title;
        ov.rect(0, OH * BAR, OW, OH * (1 - 2 * BAR), a >= 0.999 ? { texture: titleTex } : { texture: titleTex, blend: true, alpha: a });
      }
      ov.rect(0, 0, OW, OH * BAR + 0.5, { flat: [0, 0, 0, 1] });
      ov.rect(0, OH * (1 - BAR) - 0.5, OW, OH * BAR + 1, { flat: [0, 0, 0, 1] });
    }

    return {
      warm() {
        WD.keys.forEach(k => WD.get(k));
        WD.textures.forEach(k => WD.A.tex(k));
        ['joker', 'burke', 'garrity', 'walkerKhaki', 'walkerCoat', 'walkerGrey'].forEach(id => {
          const V = CST.lookFor(id);
          [0, 0.34, 0.67, 1].forEach(f => V.skirt(f));
          CST.faceTex(V.L.head, '');
          V.hs.get(0, 0);
        });
        const jk = CST.headFor('joker');
        [[1, 0], [2, 1], [1, 1]].forEach(([l, s]) => jk.get(l, s));
        ['back', 'left', 'right'].forEach(p => { jk.hangFor(p, 0); jk.hangFor(p, 1); });
        CST.faceTex('joker', 'closed');
      },
      render(t) {
        const st = Script.stage(t);
        polys = 0;
        r.clear([0, 0, 0]);
        if (st.set !== 'black') {
          const cam = camera(st);
          r.begin(st.env, cam);
          WD.get(st.set).draw(st.setOpts);
          polys += r.polys;
          if (st.fx.bgBlur > 0) {
            fx.blur(st.fx.bgBlur * r.canvas.width / 480);
            r.begin(st.env, cam, null, true);
          }
          drawActors(st);
          drawSmoke(st, cam);
          polys += r.polys;
        }
        overlays(st);
        return { polys: Math.round(polys) };
      }
    };
  }

  const video = {
    id: Script.ID,
    audio: 'content/YouVid/Stairs Dance Complete Scene.mp3',
    duration: Script.DURATION,
    aspect: 16 / 9,
    cuts: Script.CUTS,
    stage: Script.stage,
    create
  };

  window.youvidClips = window.youvidClips || [];
  if (!window.youvidClips.some(v => v.id === video.id)) window.youvidClips.push(video);
})();
