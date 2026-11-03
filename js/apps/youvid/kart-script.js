(function () {
  const K = window.YouVidKit;
  const { clamp, ease, lerp } = K;

  const ID = 'VladK4rt1nk';
  const DURATION = 20.32;

  const SLIDES = [
    { key: 'village', from: 3.63, to: 7.23, mid: 5.35, pan: [0, 0.0432] },
    { key: 'wall', from: 6.67, to: 10.47, mid: 8.55, pan: [-0.045, 0] },
    { key: 'road', from: 9.87, to: 13.77, mid: 11.8, pan: [0, -0.0468] },
    { key: 'car', from: 13.2, to: 16.7, mid: 15.05, pan: [0, 0.052], pillar: [0.058, 0.942] },
    { key: 'anime', from: 16.6, to: DURATION + 0.1, mid: 18.7, pan: [0.022, 0.021], zoom: [17.02, 20.32, 1.0, 1.14] }
  ];

  const TRANSITIONS = [
    { kind: 'cross', from: 3.63, to: 4.03, a: 'title', b: 'village' },
    { kind: 'wedge', from: 6.67, to: 7.23, a: 'village', b: 'wall' },
    { kind: 'arrow', from: 9.87, to: 10.47, a: 'wall', b: 'road' },
    { kind: 'iris', from: 13.2, to: 13.77, a: 'road', b: 'car' },
    { kind: 'flip', from: 16.3, to: 17.02, a: 'car', b: 'anime' }
  ];

  const CUTS = [4.03, 7.23, 10.47, 13.77, 17.02];

  const TITLE_END = 4.03;
  const THANKS = { in0: 17.2, in1: 17.85, out0: 19.67, out1: 20.3 };

  function slide(key) {
    return SLIDES.find(s => s.key === key);
  }

  function crop(key, t) {
    const s = slide(key);
    const dt = t - s.mid;
    let zoom = 1;
    if (s.zoom) {
      const [z0, z1, a, b] = s.zoom;
      zoom = lerp(a, b, clamp((t - z0) / (z1 - z0), 0, 1));
    }
    return { dx: s.pan[0] * dt, dy: s.pan[1] * dt, zoom };
  }

  function titleState(t) {
    const blue = 1 - ease((t - 0.12) / 0.5);
    const star = clamp(t / 0.55, 0, 1) * (1 - ease((t - 0.85) / 0.45));
    const swing = ease((t - 0.6) / 0.3);
    const textOn = clamp((t - 0.58) / 0.06, 0, 1);
    const ghost = ease((t - 0.9) / 0.8);
    return { t, blue, star, starSize: 0.04 + 0.3 * ease(t / 0.6), swing, textOn, ghost };
  }

  function thanksState(t) {
    const a = ease((t - THANKS.in0) / (THANKS.in1 - THANKS.in0));
    const b = 1 - ease((t - THANKS.out0) / (THANKS.out1 - THANKS.out0));
    const k = Math.min(a, b);
    return { alpha: k, scale: lerp(0.62, 1, k), shade: lerp(0.62, 0.02, k) };
  }

  function stage(t) {
    const tr = TRANSITIONS.find(x => t >= x.from && t < x.to);
    let layers;
    if (tr) {
      layers = { kind: tr.kind, a: tr.a, b: tr.b, k: clamp((t - tr.from) / (tr.to - tr.from), 0, 1) };
    } else if (t < TITLE_END) {
      layers = { kind: 'one', a: 'title' };
    } else {
      const s = SLIDES.slice().reverse().find(x => t >= x.from) || SLIDES[0];
      layers = { kind: 'one', a: s.key };
    }
    return {
      t,
      layers,
      title: titleState(t),
      thanks: thanksState(t),
      shot: CUTS.filter(c => t >= c).length
    };
  }

  const BEAT_PERIOD = 2.66;
  const BEAT_START = 1.3;

  function beat(t) {
    if (t < BEAT_START) return 0;
    const x = ((t - BEAT_START) % BEAT_PERIOD) / BEAT_PERIOD;
    return x < 0.04 ? 0.25 : 0.55 + 0.25 * Math.abs(Math.sin(x * Math.PI * 8));
  }

  window.KartScript = { ID, DURATION, SLIDES, TRANSITIONS, CUTS, THANKS, slide, crop, stage, beat };
})();
