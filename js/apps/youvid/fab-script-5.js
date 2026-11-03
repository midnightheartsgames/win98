(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, clamp, lerp, ease } = K;
  const Cast = window.FabCast;
  const Art = window.FabArt;
  const A = window.FabScript1;
  const B = window.FabScript3;
  const D = window.FabScript4;
  const { cam, talk } = A;
  const { faceCam, ramp } = B;
  const { audience, lessonCast, lessonProps, day } = D;

  const SHOTS = [];
  const at = (t0, fn) => SHOTS.push([t0, fn]);

  const SING = 975.0;

  function cast(t, o) {
    const opts = o || {};
    const [h, v] = lessonCast(t);
    h.face = opts.heroFace || { mouth: 'smile', beard: true };
    v.face = t >= SING ? talk(t, 1.4, { brows: 'up', eyes: 'half' }) : opts.heavyFace || { brows: 'angry', mouth: 'frown' };
    return { h, v };
  }

  function lesson(t, extra) {
    return day(t, Object.assign({ props: lessonProps() }, extra));
  }

  at(960, (lt, t) => {
    const { h, v } = cast(t);
    return lesson(t, { camera: faceCam(h, 0.95, -0.3, 0.55, 54, { lu: -0.12, ls: 0.12 }), actors: [h, v] });
  });

  at(960.593, (lt, t) => {
    const { h } = cast(t);
    return lesson(t, { camera: faceCam(h, 0.72, -0.18, 0.4, 52, { lu: -0.08, ls: 0.1 }), actors: [h] });
  });

  at(963.095, (lt, t) => {
    const { v } = cast(t, { heavyFace: lt > 3.6 ? { brows: 'up', eyes: 'wide', mouth: 'shut' } : { brows: 'angry', mouth: 'frown' } });
    return lesson(t, { camera: faceCam(v, 1.0, -0.15, -0.05, 50, { chest: true, lu: 0.2 }), actors: [v] });
  });

  at(968.334, (lt, t) => {
    const { h } = cast(t, { heroFace: { mouth: 'smirk', eyes: 'half', beard: true } });
    return lesson(t, { camera: faceCam(h, 0.5, 0.0, -0.2, 46, { ls: -0.04 }), actors: [h] });
  });

  at(970.069, (lt, t) => {
    const sc = audience(t)[1];
    sc.face = { mouth: 'smirk', eyes: 'half', brows: 'raise' };
    return lesson(t, { camera: faceCam(sc, 0.5, 0.02, 0.12, 46), actors: [sc] });
  });

  const eyes = (lt, t) => {
    const { v } = cast(t, { heavyFace: { brows: 'up', eyes: 'wide', mouth: 'shut' } });
    return lesson(t, { camera: faceCam(v, 0.24, 0.05, 0.0, 30, { lu: 0.05 }), actors: [v] });
  };

  at(971.07, eyes);
  at(971.337, () => ({ set: null, bg: [0, 0, 0] }));
  at(971.504, eyes);

  at(972.271, (lt, t) => {
    const { v } = cast(t, { heavyFace: { brows: 'up', eyes: 'wide', mouth: lt > 1.4 ? 'o' : 'shut' } });
    return lesson(t, { camera: faceCam(v, 0.85, 0.0, 0.5, 48, { ls: 0.1 }), actors: [v] });
  });

  at(974.94, (lt, t) => {
    const sp = audience(t)[2];
    sp.face = { mouth: 'shut', eyes: 'half' };
    const m = Cast.solve('spy', sp.pose);
    const H = Cast.HEAD.spy;
    const cig = { kind: 'cigarette', M: M4.chain(m.head, M4.translate(0.035, -H.ry * 0.42, H.rz * 0.88), M4.rotY(0.6), M4.rotX(0.2)) };
    return lesson(t, { camera: faceCam(sp, 0.55, 0.02, -0.18, 46), actors: [sp], props: lessonProps().concat([cig]), fx: [{ kind: 'smoke', p: M4.point(cig.M, [0, 0.03, 0.08]), s: 0.05, n: 5, u: (lt % 1.6), dur: 1.6, col: [0.85, 0.85, 0.88], alpha: 0.5 }] });
  });

  at(976.675, (lt, t) => {
    const { h, v } = cast(t);
    return lesson(t, { camera: cam(V3.add(window.FabWorld.ZONES.lessons, [-0.1, 1.2, 1.4]), V3.add(window.FabWorld.ZONES.lessons, [-0.1, 1.0, -3.7]), 56), actors: audience(t).slice(3).concat([h, v]) });
  });

  at(982.915, () => ({ set: null, bg: [0, 0, 0] }));

  at(983.9, (lt) => ({ set: null, bg: [0, 0, 0], cards: [{ tex: 'createdOrange', x: 120, y: 90, w: 720, h: 360, alpha: clamp(Math.min(lt / 0.25, (3.8 - lt) / 0.3), 0.001, 0.999) }] }));

  at(987.7, () => ({ set: null, bg: [0, 0, 0] }));

  at(988.0, (lt) => {
    const s = 0.95 + lt * 0.03;
    return { set: null, bg: [0, 0, 0], cards: [{ tex: 'logo', x: 480 - 380 * s, y: 270 - 285 * s, w: 760 * s, h: 570 * s, alpha: clamp(Math.min(lt / 0.2, (3.0 - lt) / 0.25), 0.001, 0.999) }] };
  });

  const CRAWL0 = 991.0, CRAWL1 = 1029.0;

  function crawl(t) {
    const speed = (Art.creditsLength() - 260) / (CRAWL1 - CRAWL0);
    return { live: 'credits', u: (t - CRAWL0) * speed, top: true };
  }

  const PAGES = [['sketchPageHeavy', 992.4], ['sketchPageImp', 1001.2], ['sketchPageEngie', 1010.0]];

  function pages(t) {
    const out = [];
    PAGES.forEach(([tex, t0]) => {
      const lt = t - t0;
      if (lt < 0 || lt > 8.6) return;
      const kin = ease(clamp(lt / 0.8, 0, 1)), kout = ease(clamp((lt - 7.8) / 0.8, 0, 1));
      const x = lerp(-380, 40, kin) + lerp(0, 340, kout) + lt * 3;
      const y = 120 - lt * 4 - kout * 60;
      out.push({ tex, x, y, w: 300, h: 200, rot: lerp(-0.25, -0.04, kin) + kout * 0.5, alpha: 0.82 * (1 - kout * 0.9) });
    });
    return out;
  }

  at(991.0, (lt, t) => ({ set: null, bg: [0, 0, 0], cards: pages(t).concat([crawl(t)]) }));

  const RACE_Z = 22;

  at(1019.0, (lt, t) => {
    const x = 40 - lt * 5;
    const kh = A.kartHeavy(x, RACE_Z, -PI / 2, t, { face: { mouth: 'grin', open: 0.4 } });
    const rival = { kind: 'kart', at: [x - 5 - S(lt * 0.7) * 1.5, 0, RACE_Z + 0.6 * S(lt)], yaw: -PI / 2 };
    const fade = ramp(t, CRAWL1, 1033.0);
    return {
      set: 'kart',
      camera: cam([x + 2.6, 1.3, RACE_Z + 0.2], [x - 3, 0.9, RACE_Z], 58),
      actors: [kh.actor],
      props: [kh.prop, rival],
      cards: [{ tex: 'raceWindow' }, { tex: 'raceHud', x: 60, y: 150, w: 422, h: 236 }, crawl(t)],
      post: { black: fade }
    };
  });

  function irisCards(cx, cy, s) {
    const w = 960 * s, h = 540 * s;
    const x = cx - 0.46 * w, y = cy - 0.52 * h;
    const black = [0, 0, 0, 1];
    return [
      { tex: 'iris', x, y, w, h },
      { flat: black, x: 0, y: 0, w: Math.max(0, x), h: 540 },
      { flat: black, x: x + w, y: 0, w: Math.max(0, 960 - x - w), h: 540 },
      { flat: black, x, y: 0, w, h: Math.max(0, y) },
      { flat: black, x, y: y + h, w, h: Math.max(0, 540 - y - h) }
    ];
  }

  at(1033.032, (lt, t) => {
    const { v } = cast(t);
    const k = ramp(t, 1035.0, 1036.5);
    const st = lesson(t, { camera: faceCam(v, 1.15, -0.25, 0.15, 50, { chest: true, lu: 0.22 }), actors: [v] });
    if (k > 0) st.cards = irisCards(470, 230, lerp(3.4, 0.08, ease(k)));
    return st;
  });

  at(1036.5, () => ({ set: null, bg: [0, 0, 0] }));

  at(1037.0, (lt) => ({ set: null, bg: [0, 0, 0], cards: [{ tex: 'copyright', x: 160, y: 120, w: 640, h: 360, alpha: clamp(lt / 2.5, 0.001, 0.999) }] }));

  SHOTS.sort((a, b) => a[0] - b[0]);

  window.FabScript5 = { FROM: 960, TO: 1040.46, SHOTS };
})();
