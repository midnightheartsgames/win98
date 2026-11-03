(function () {
  const Cam = window.ParadCam;
  const { clamp, lerp, ease } = window.YouVidKit;
  const RAD = Math.PI / 180;
  const ID = 'P4radB3dy98';
  const DURATION = 103.677;

  function A(t, u, v, h) {
    return Cam.ground(t, u, v, h || 0) || Cam.at(t, u, v, 30);
  }

  function track(keys) {
    const pts = keys.map(k => ({ t: k[0], p: k[1] }));
    return (t) => {
      if (t <= pts[0].t) return pts[0].p;
      for (let i = 1; i < pts.length; i++) {
        if (t < pts[i].t) {
          const a = pts[i - 1], b = pts[i];
          const k = (t - a.t) / (b.t - a.t);
          const s = k * k * (3 - 2 * k);
          return [lerp(a.p[0], b.p[0], s), lerp(a.p[1], b.p[1], s), lerp(a.p[2], b.p[2], s)];
        }
      }
      return pts[pts.length - 1].p;
    };
  }

  const HALF = { washer: 0.42, toilet: 0.38, freezer: 0.45, fridge: 0.78, can: 0.5 };

  function anchored(list, h) {
    return track(list.map(([t, u, v, hh]) => [t, A(t, u, v, hh === undefined ? (h || 0) : hh)]));
  }

  function flying(kind, list) {
    const s = window.ParadCast.SCALE[kind] || 1;
    const half = (HALF[kind] || 0.4) * s;
    return track(list.map(([t, u, v, d]) => {
      const p = Cam.at(t, u, v, d * s);
      return [t, [p[0], Math.max(0.05, p[1] - half), p[2]]];
    }));
  }

  function headingTo(from, to) {
    return Math.atan2(to[0] - from[0], -(to[2] - from[2]));
  }

  const PARADE = [
    { kind: 'btr', from: 12.8, to: 16.2, pos: anchored([[13.0, 0.66, 0.64], [13.5, 0.52, 0.65], [14.0, 0.16, 0.66], [14.5, 0.12, 0.66], [15.0, 0.68, 0.58], [15.5, 0.98, 0.56]]), hop: 0.12, pitch: 0.1, yaw: 0.3 },
    { kind: 'car', from: 13.0, to: 20.0, pos: anchored([[13.2, 0.75, 0.62], [15.0, 0.15, 0.75], [15.5, 0.25, 0.72], [16.0, 0.6, 0.78], [17.0, 0.64, 0.7], [17.5, 0.55, 0.7], [18.0, 0.35, 0.72], [18.5, 0.2, 0.75]]), hop: 0.35, pitch: 0.4, yaw: 2.5 },
    { kind: 'car', from: 15.4, to: 20.0, pos: anchored([[15.6, 0.62, 0.62], [16.0, 0.85, 0.72], [17.0, 0.85, 0.6], [17.5, 0.85, 0.62], [18.0, 0.55, 0.62], [18.5, 0.45, 0.62]]), hop: 0.3, pitch: 0.35, yaw: 2.6 },
    { kind: 'car', from: 17.4, to: 20.5, pos: anchored([[17.6, 0.99, 0.6], [18.0, 0.72, 0.58], [18.5, 0.62, 0.58], [19.0, 0.55, 0.6]]), hop: 0.3, pitch: 0.3, yaw: 2.7 },
    { kind: 'can', from: 15.6, to: 21.0, pos: anchored([[15.8, 0.08, 0.52, 0.3], [16.5, 0.33, 0.55, 0.3], [17.0, 0.36, 0.55, 0.3], [17.5, 0.4, 0.57, 0.3], [18.0, 0.02, 0.62, 0.3], [19.0, 0.15, 0.66, 0.3], [19.5, 0.55, 0.66, 0.3], [20.0, 0.85, 0.72, 0.3]]), hop: 0.15, roll: true, yaw: 1.2 },
    { kind: 'can', from: 15.8, to: 21.0, pos: anchored([[16.0, 0.18, 0.52, 0.3], [16.5, 0.42, 0.56, 0.3], [17.0, 0.45, 0.56, 0.3], [17.5, 0.5, 0.58, 0.3], [18.5, 0.08, 0.66, 0.3], [19.0, 0.4, 0.62, 0.3], [19.5, 0.8, 0.7, 0.3]]), hop: 0.15, roll: true, yaw: 1.4 },
    { kind: 'washer', from: 15.6, to: 22.4, pos: anchored([[16.0, 0.21, 0.52, 0.35], [17.0, 0.24, 0.53, 0.35], [17.5, 0.04, 0.56, 0.35], [19.5, 0.15, 0.6, 0.35], [20.0, 0.42, 0.64, 0.35], [20.5, 0.52, 0.66, 0.35], [21.0, 0.43, 0.62, 0.35], [21.5, 0.47, 0.62, 0.35], [22.0, 0.68, 0.62, 0.35]]), hop: 0.25, tumble: 0.5, yaw: 0.6 },
    { kind: 'washer', from: 15.6, to: 22.4, pos: anchored([[16.0, 0.25, 0.52, 0.35], [17.0, 0.28, 0.53, 0.35], [17.5, 0.08, 0.56, 0.35], [19.5, 0.26, 0.6, 0.35], [20.0, 0.55, 0.66, 0.35], [20.5, 0.62, 0.68, 0.35], [21.0, 0.61, 0.68, 0.35], [21.5, 0.62, 0.64, 0.35], [22.0, 0.97, 0.62, 0.35]]), hop: 0.25, tumble: 0.6, yaw: 0.9 },
    { kind: 'toilet', from: 19.6, to: 25.0, pos: anchored([[19.8, 0.05, 0.5, 0.25], [21.0, 0.08, 0.52, 0.25], [22.0, 0.2, 0.5, 0.25], [22.5, 0.3, 0.5, 0.25], [23.0, 0.37, 0.55, 0.25], [23.5, 0.47, 0.5, 0.25], [24.0, 0.62, 0.52, 0.25]]), hop: 0.35, yaw: 0.4 },
    { kind: 'toilet', from: 19.6, to: 25.0, pos: anchored([[19.8, 0.12, 0.5, 0.25], [21.0, 0.17, 0.52, 0.25], [22.0, 0.3, 0.52, 0.25], [22.5, 0.45, 0.55, 0.25], [23.0, 0.5, 0.62, 0.25], [23.5, 0.63, 0.6, 0.25], [24.0, 0.85, 0.62, 0.25]]), hop: 0.4, yaw: 0.2 },
    { kind: 'toilet', from: 19.6, to: 25.0, pos: anchored([[19.8, 0.19, 0.5, 0.25], [21.0, 0.24, 0.52, 0.25], [22.0, 0.4, 0.52, 0.25], [22.5, 0.55, 0.58, 0.25], [23.0, 0.6, 0.68, 0.25], [23.5, 0.82, 0.66, 0.25], [24.0, 0.99, 0.7, 0.25]]), hop: 0.45, yaw: -0.3 },
    { kind: 'toilet', from: 19.6, to: 25.0, pos: anchored([[19.8, 0.02, 0.48, 0.25], [21.5, 0.04, 0.48, 0.25], [23.5, 0.22, 0.38, 0.25], [24.5, 0.3, 0.42, 0.25]]), hop: 0.3, yaw: 0.8 },
    { kind: 'toilet', from: 19.6, to: 25.0, pos: anchored([[19.8, 0.0, 0.47, 0.25], [21.5, 0.01, 0.47, 0.25], [23.5, 0.23, 0.37, 0.25], [24.5, 0.33, 0.41, 0.25]]), hop: 0.3, yaw: 1.1 }
  ];

  const ATTACK = [
    { kind: 'washer', from: 34.9, to: 39.6, pos: flying('washer', [[35.5, 0.7, 0.5, 12], [36.0, 0.5, 0.48, 10], [36.5, 0.43, 0.55, 7], [37.0, 0.48, 0.55, 5], [37.5, 0.47, 0.56, 4.2], [38.0, 0.45, 0.57, 4.2], [38.5, 0.48, 0.58, 4.0], [39.0, 0.34, 0.6, 3.0], [39.5, 0.4, 0.66, 2.0]]), hop: 0.3, tumble: 1.4, yaw: 0.5 },
    { kind: 'washer', from: 39.6, to: 44.9, pos: flying('washer', [[40.5, 0.62, 0.5, 9], [42.0, 0.55, 0.5, 7], [43.0, 0.5, 0.52, 4.5], [44.0, 0.45, 0.58, 2.2], [44.5, 0.4, 0.7, 1.0], [44.8, 0.3, 0.85, 0.6]]), hop: 0.1, tumble: 1.2, yaw: 1.0 },
    { kind: 'toilet', from: 39.6, to: 44.8, pos: flying('toilet', [[40.5, 0.55, 0.49, 10], [42.0, 0.47, 0.5, 8], [43.0, 0.44, 0.56, 4], [43.5, 0.38, 0.6, 2.8], [44.0, 0.3, 0.7, 1.8], [44.5, 0.2, 0.8, 1.2]]), hop: 0.1, tumble: 1.0, yaw: 0.5 },
    { kind: 'toilet', from: 39.6, to: 47.0, pos: flying('toilet', [[40.5, 0.58, 0.49, 10], [42.0, 0.51, 0.5, 8], [43.0, 0.53, 0.54, 4.5], [44.0, 0.55, 0.57, 3], [45.0, 0.75, 0.62, 2.2], [46.0, 0.72, 0.68, 1.8]]), hop: 0.1, tumble: 1.3, yaw: 0.2 },
    { kind: 'can', from: 44.6, to: 51.2, pos: flying('can', [[45.0, 0.62, 0.42, 1.6], [45.5, 0.55, 0.42, 1.6], [46.0, 0.72, 0.42, 2.8], [46.5, 0.62, 0.45, 3.0], [48.5, 0.6, 0.47, 4.0], [49.0, 0.62, 0.47, 3.5], [49.5, 0.48, 0.5, 2.6], [50.0, 0.65, 0.52, 1.8], [50.5, 0.78, 0.6, 1.3], [51.0, 0.99, 0.62, 1.2]]), hop: 0.05, roll: true, yaw: 1.3 },
    { kind: 'freezer', from: 44.4, to: 47.4, pos: flying('freezer', [[44.5, 0.55, 0.62, 1.4], [45.0, 0.3, 0.75, 1.0], [45.5, 0.2, 0.8, 1.0], [46.0, 0.45, 0.62, 1.6], [46.5, 0.6, 0.6, 2.0], [47.0, 0.85, 0.55, 2.2]]), hop: 0.05, tumble: 0.9, yaw: 0.3 },
    { kind: 'freezer', from: 48.5, to: 52.5, pos: flying('freezer', [[48.8, 0.35, 0.58, 4], [49.5, 0.3, 0.62, 3.2], [50.0, 0.38, 0.6, 3.0], [50.5, 0.41, 0.6, 3.2], [51.0, 0.45, 0.62, 2.8], [51.5, 0.52, 0.66, 2.2], [52.0, 0.6, 0.72, 1.8]]), hop: 0.05, tumble: 0.3, yaw: 0.1 },
    { kind: 'freezer', from: 48.0, to: 53.2, pos: flying('freezer', [[48.5, 0.52, 0.6, 2.0], [49.0, 0.2, 0.75, 1.3], [49.5, 0.15, 0.8, 1.2], [50.0, 0.2, 0.85, 1.1], [50.5, 0.2, 0.92, 1.0], [52.6, 0.15, 0.68, 2.0]]), hop: 0.05, tumble: 0.4, yaw: 1.8 },
    { kind: 'fridge', from: 49.6, to: 52.6, pos: flying('fridge', [[50.0, 0.58, 0.5, 4.5], [50.5, 0.56, 0.5, 4.2], [51.0, 0.5, 0.52, 3.6], [51.5, 0.48, 0.54, 3.0], [52.0, 0.45, 0.56, 2.6]]), hop: 0.05, tumble: 0.5, yaw: 0.4, tilt: 0.5 },
    { kind: 'toilet', from: 52.3, to: 53.2, pos: anchored([[52.5, 0.25, 0.52, 0.1], [52.9, 0.2, 0.55, 0.1]]), hop: 0.0, yaw: 0.5, lie: true },
    { kind: 'can', from: 52.3, to: 56.0, pos: flying('can', [[52.6, 0.48, 0.45, 12], [53.5, 0.75, 0.45, 6], [54.0, 0.65, 0.48, 4], [54.5, 0.45, 0.48, 2.6], [54.75, 0.35, 0.5, 2.0], [55.0, 0.4, 0.5, 1.5], [55.3, 0.6, 0.5, 1.2]]), hop: 0.05, roll: true, yaw: 0.9 }
  ];

  const UPRIGHT = { pos: A(55.5, 0.12, 0.85, 0), yaw: 0.7 };

  const OGRE1 = anchored([[11.0, 0.19, 0.88], [27.0, 0.12, 1.02], [30.5, 0.12, 1.0], [31.25, 0.42, 0.88], [32.0, 0.45, 0.87], [32.5, 0.45, 0.86], [33.0, 0.55, 0.62], [33.5, 0.32, 0.6], [34.0, 0.42, 0.58], [34.5, 0.47, 0.57], [35.0, 0.48, 0.56]]);
  const SUIT1 = anchored([[11.0, 0.47, 0.72], [27.0, 0.5, 0.79], [30.6, 0.52, 0.8], [31.25, 0.88, 1.05], [32.0, 1.2, 1.1]]);
  const OGRE2 = A(11.0, 0.6, 0.68);
  const HORN = [-12.2, 0, -12.1];
  const HORN_YAW = Cam.lin([[0, 40], [12.9, 40], [13.3, -80], [23.6, -80], [24.2, 45], [24.7, 50], [25.4, 78], [26.6, 82], [27.2, 60], [27.8, 35], [35.2, 35], [35.5, -60], [40, -60]]);

  const FO = Cam.FIELD_ORIGIN;
  const FIELD_THINGS = [
    { kind: 'toilet', from: 56.6, to: 59.0, pos: flying('toilet', [[57.0, 0.55, 0.47, 16], [57.75, 0.5, 0.45, 14]]), hop: 0.1, tumble: 1.2 },
    { kind: 'washer', from: 61.0, to: 66.5, pos: flying('washer', [[61.5, 0.08, 0.38, 22], [62.75, 0.62, 0.42, 14], [63.5, 0.52, 0.43, 13], [64.5, 0.48, 0.4, 13], [65.0, 0.23, 0.36, 11], [66.0, 0.04, 0.4, 12]]), hop: 0.1, tumble: 1.4 },
    { kind: 'toilet', from: 61.0, to: 66.5, pos: flying('toilet', [[61.5, 0.45, 0.42, 20], [63.0, 0.62, 0.43, 16], [64.0, 0.6, 0.44, 16], [65.5, 0.2, 0.44, 16]]), hop: 0.1, tumble: 1.0 },
    { kind: 'toilet', from: 67.4, to: 70.4, pos: flying('toilet', [[68.0, 0.42, 0.52, 9], [68.5, 0.5, 0.52, 8], [69.0, 0.33, 0.56, 6], [69.5, 0.37, 0.58, 5], [70.0, 0.25, 0.62, 5]]), hop: 0.1, tumble: 1.6 },
    { kind: 'washer', from: 75.8, to: 77.95, pos: flying('washer', [[76.25, 0.52, 0.5, 12], [77.0, 0.57, 0.48, 10], [77.5, 0.6, 0.46, 10], [77.9, 0.6, 0.47, 10]]), hop: 0.1, tumble: 1.0 }
  ];
  const YBTR = {
    pos: anchored([[70.0, 0.55, 0.45, 2.5], [70.25, 0.55, 0.42, 3.5], [70.5, 0.46, 0.44, 3.0], [70.75, 0.48, 0.46, 1.5], [71.0, 0.45, 0.6, 0.0]]),
    spin: Cam.smooth([[69.9, [0.2, 0.0]], [70.5, [1.2, 0.8]], [71.0, [1.57, 1.2]], [71.4, [1.5, 1.2]], [72.0, [1.57, 1.2]]])
  };
  const HELI_TREE = A(72.5, 0.5, 0.42, 0);

  const YO = Cam.YARD_ORIGIN;
  const SUIT2 = anchored([[79.4, 0.38, 0.62], [79.75, 0.3, 1.3], [80.2, 0.46, 1.42], [82.4, 0.46, 1.42]]);

  const SHOTS = [[31.5, 31.72], [32.88, 33.05], [34.0, 34.5], [35.9, 36.3], [36.8, 39.2], [42.6, 44.4], [44.7, 45.1], [45.75, 46.15], [48.2, 49.6], [49.7, 51.0], [53.85, 54.1], [54.45, 55.3], [56.2, 57.8], [61.55, 64.2], [67.9, 70.15], [72.45, 73.0], [76.3, 76.5], [77.1, 77.8], [82.6, 82.72], [83.9, 84.05], [84.28, 84.65], [85.25, 85.6]];
  const RATE = 13;

  function shotAt(t) {
    for (const [a, b] of SHOTS) {
      if (t >= a && t <= b + 0.08) {
        const n = Math.floor((Math.min(t, b) - a) * RATE);
        const t0 = a + n / RATE;
        const k = (t - t0) * RATE;
        if (t > b + 0.0001 && k > 1) return null;
        return { k: clamp(1 - k, 0, 1), n };
      }
    }
    return null;
  }

  const RELOADS = [[39.25, 41.9], [46.45, 48.1], [52.95, 53.7], [58.0, 61.2], [64.3, 67.4], [73.15, 76.2], [86.2, 86.9]];
  const THROWS = [[8.45, 9.3], [20.05, 20.75]];
  const LOWERS = [[52.3, 52.7, 0.5], [55.4, 56.15, 1], [70.4, 70.95, 1], [77.95, 79.85, 1], [91.0, 95.7, 1]];

  function windowK(list, t) {
    for (const w of list) if (t >= w[0] && t < w[1]) return { k: (t - w[0]) / (w[1] - w[0]), w };
    return null;
  }

  function gunState(t, cam) {
    const walking = (t > 2.2 && t < 13) || (t > 24.3 && t < 27.5) || (t > 39.4 && t < 56.6);
    const st = { t, walk: walking ? 1 : 0 };
    if (t < 28.3) {
      st.mode = 'bolt';
      const th = windowK(THROWS, t);
      if (th) st.throwK = th.k;
      return st;
    }
    if (t >= 86.9 && t < 95.7) { st.mode = 'none'; return st; }
    st.mode = 'gun';
    if (t < 28.8) st.draw = (t - 28.3) / 0.5;
    if (t >= 95.7 && t < 96.3) st.draw = (t - 95.7) / 0.6;
    const rl = windowK(RELOADS, t);
    if (rl) st.reload = rl.k;
    const lw = windowK(LOWERS, t);
    if (lw) {
      const w = lw.w;
      const edge = Math.min(1, (t - w[0]) / 0.25, (w[1] - t) / 0.25);
      st.lower = clamp(edge, 0, 1) * (w[2] || 1);
    }
    const sh = rl ? null : shotAt(t);
    if (sh) {
      st.kick = sh.k;
      st.flash = sh.k > 0.45 ? 1 : 0;
      st.shotN = sh.n;
    }
    return st;
  }

  const HINT = [28.25, 29.55];
  const LABEL = [27.4, 29.65];
  const PDA = [72.75, 77.8];
  const HIT = [34.0, 35.2];

  function suitPose1(t) {
    const p = SUIT1(t);
    const cam = Cam.camera(t);
    const face = headingTo(p, cam.eye);
    const wave = t > 29.0 && t < 30.7 ? Math.sin((t - 29.0) * 6) * 0.5 + 0.5 : 0;
    return { pos: p, face, wave, walk: t > 30.6 && t < 32 ? 1 : 0 };
  }

  function ogrePose1(t) {
    const p = OGRE1(t);
    const cam = Cam.camera(t);
    let face = headingTo(p, cam.eye);
    let run = 0;
    if (t > 32.0 && t < 35.2) {
      const q = OGRE1(t + 0.1);
      if (Math.hypot(q[0] - p[0], q[2] - p[2]) > 0.02) face = headingTo(p, q);
      run = 1;
    }
    return { pos: p, face, run, walk: t > 24.4 && t < 31 ? 0.3 : 0 };
  }

  function parade(list, t) {
    const out = [];
    list.forEach((o, i) => {
      if (t < o.from || t > o.to) return;
      const p = o.pos(t);
      const hop = o.hop ? Math.abs(Math.sin(t * 3.1 + i * 1.7)) * o.hop : 0;
      out.push({
        kind: o.kind, i, p: [p[0], p[1] + hop, p[2]], yaw: (o.yaw || 0) + (o.tumble ? Math.sin(t * 0.9 + i) * 0.4 : 0),
        pitch: (o.pitch ? Math.sin(t * 3.1 + i * 1.7) * o.pitch : 0) + (o.tumble ? t * o.tumble * 0.7 + i : 0) * (o.tumble ? 1 : 0),
        roll: o.roll ? t * 2.2 + i : (o.tumble ? Math.sin(t * 1.3 + i) * o.tumble : 0) + (o.tilt || 0), lie: !!o.lie, rolling: !!o.roll
      });
    });
    return out;
  }

  function stage(t) {
    const cam = Cam.camera(t);
    const st = { t, set: cam.set, camera: cam, gun: gunState(t, cam), actors: [], things: [], fx: [], hud: {} };
    if (cam.set === 'village') {
      st.actors.push(Object.assign({ who: 'ogre' }, ogrePose1(t)));
      st.actors.push({ who: 'ogre', pos: OGRE2, face: headingTo(OGRE2, cam.eye) + 0.4, idle: 1, seed: 2 });
      st.actors.push(Object.assign({ who: 'man' }, suitPose1(t)));
      st.things.push({ kind: 'horn', p: HORN, yaw: HORN_YAW(t) * RAD });
      parade(PARADE, t).forEach(x => st.things.push(x));
      parade(ATTACK, t).forEach(x => st.things.push(x));
      st.things.push({ kind: 'carUp', p: UPRIGHT.pos, yaw: UPRIGHT.yaw });
      st.fire = window.ParadWorld.barrelPos('village', t);
    } else if (cam.set === 'field') {
      parade(FIELD_THINGS, t).forEach(x => st.things.push(x));
      if (t > 69.8) {
        const s = YBTR.spin(t);
        st.things.push({ kind: 'ybtr', p: YBTR.pos(t), yaw: s[1], pitch: s[0] });
      }
      st.things.push({ kind: 'heliTree', p: HELI_TREE });
      if (t > 70.5) st.fx.push({ kind: 'smoke', p: YBTR.pos(71), age: t - 70.5 });
    } else {
      st.yard = true;
      if (t >= 79.3 && t < 82.55) {
        const p = SUIT2(t);
        st.actors.push({ who: 'man', pos: p, face: headingTo(p, cam.eye), run: t < 79.7 ? 1 : 0, crouch: t >= 79.6 && t < 80.1 ? 1 : 0, arms: 'down' });
      } else if (t >= 82.55) {
        st.body = { t };
      }
      st.fire = window.ParadWorld.barrelPos('yard', t);
    }
    if (t >= HINT[0] && t < HINT[1]) st.hud.hint = 1;
    if (t >= LABEL[0] && t < LABEL[1]) st.hud.label = 1;
    if (t >= PDA[0] && t < PDA[1]) st.hud.pda = 1;
    if (t >= HIT[0] && t < HIT[1]) st.hud.hit = 1 - (t - HIT[0]) / (HIT[1] - HIT[0]);
    if (t < 28.3) st.hud.cross = 1;
    st.fadeIn = clamp(1 - t / 0.35, 0, 1);
    st.fadeOut = clamp((t - 103.0) / 0.6, 0, 1);
    if (t >= 77.9 && t < 78.12) st.dissolve = (t - 77.9) / 0.22;
    if (t >= 94.95 && t < 95.85) st.flare = Math.sin(clamp((t - 94.95) / 0.9, 0, 1) * Math.PI);
    return st;
  }

  const CUTS = [0, 13.0, 24.4, 35.3, 39.5, 52.4, 56.6, 70.0, 78.0, 82.6, 87.0, 92.4, 95.0];

  window.ParadScript = { ID, DURATION, CUTS, SHOTS, RELOADS, stage, shotAt };
})();
