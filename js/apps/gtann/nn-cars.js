(function (N) {
  'use strict';

  const K = N.KIND;
  const T = n => N.TEX[n];
  const WHITE = [255, 255, 255, 255];
  const lerp = N.lerp, clamp = N.clamp;
  const NP = 10;
  const HARD = [true, true, true, true, false, true, true, true, false, false];

  function mono(keys) {
    const n = keys.length, xs = keys.map(k => k[0]), ys = keys.map(k => k[1]);
    if (n === 1) return () => ys[0];
    const d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    m[0] = d[0];
    m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
      const p = m[i] / d[i], q = m[i + 1] / d[i], s = p * p + q * q;
      if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * p * d[i]; m[i + 1] = k * q * d[i]; }
    }
    return x => {
      if (x <= xs[0]) return ys[0];
      if (x >= xs[n - 1]) return ys[n - 1];
      let i = 0;
      while (x > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (3 * t2 - 2 * t3) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
    };
  }

  const MATS = {
    paint: ['carbody', 'PAINT', WHITE],
    chrome: ['chrome', 'CHROME', [224, 224, 220, 255]],
    black: ['trim', 'TRIM', [44, 44, 46, 255]],
    rubber: ['trim', 'TRIM', [26, 26, 27, 255]],
    grille: ['trim', 'TRIM', [20, 20, 21, 255]],
    steel: ['white', 'TRIM', [196, 198, 200, 255]],
    dark: ['darkmetal', 'OPAQUE', [24, 24, 24, 255]],
    seam: ['darkmetal', 'OPAQUE', [14, 14, 14, 255]],
    floor: ['darkmetal', 'OPAQUE', [36, 34, 32, 255]],
    dash: ['darkmetal', 'OPAQUE', [46, 44, 42, 255]],
    tyre: ['tire', 'OPAQUE', WHITE],
    mirror: ['mirror', 'CHROME', [214, 220, 226, 255]],
    reflector: ['lamplens', 'LENS', [104, 18, 16, 255]],
    canvas: ['canvas', 'TRIM', [150, 158, 118, 255]],
    rimdark: ['white', 'TRIM', [46, 52, 38, 255]],
    rimgrey: ['white', 'TRIM', [120, 124, 126, 255]],
    plank: ['plank', 'OPAQUE', [176, 150, 112, 255]],
    chassis: ['darkmetal', 'OPAQUE', [34, 34, 34, 255]],
    alloy: ['white', 'TRIM', [206, 208, 212, 255]],
    cast: ['white', 'TRIM', [138, 140, 144, 255]],
    clad: ['carbody', 'TRIM', [124, 126, 128, 255]],
    ribbed: ['lamplens', 'LENS', [150, 112, 100, 255]],
    leather: ['fabric', 'OPAQUE', [34, 32, 30, 255]]
  };
  const mat = (name, c) => {
    const q = MATS[name];
    return { layer: T(q[0]), kind: K[q[1]], c: c || q[2] };
  };

  const SHELL = {
    wb: 2.424, track: [1.349, 1.305], tyre: [0.292, 0.155],
    arches: [{ a: 0, yc: 0.283, r: 0.358 }, { a: 2.424, yc: 0.19, r: 0.364 }],
    rocker: 0.055, shoulder: 0.04, round: 0.022, sillW: 0.035, railIn: 0.035, railOut: 0.015, railH: 0.045, tumble: 0.07, railRef: 1.34,
    roofCrown: 0.1,
    roof: [[0.8, 1.385], [0.86, 1.411], [0.95, 1.422], [1.3, 1.433], [1.65, 1.438], [1.95, 1.431], [2.16, 1.411], [2.29, 1.379], [2.38, 1.335]],
    ws: [0.43, 0.15, 0.8, 0.025], bw: [2.38, 0.02, 2.72, 0.06],
    doorWin: 1.452, rearDoorEnd: 2.346,
    win: [[0.55, 0.94, 'glass'], [0.94, 0.962, 'bar'], [0.962, 1.42, 'glass'], [1.42, 1.452, 'frame'], [1.452, 1.486, 'pillar'], [1.486, 1.516, 'frame'], [1.516, 2.0, 'glass'], [2.0, 2.022, 'bar'], [2.022, 2.07, 'glass'], [2.07, 2.3, 'diag']],
    winA: 0.55, winB: 2.3,
    handles: [[1.34, 0.745], [2.21, 0.725]],
    rearSeat: 2.02,
    glassC: [210, 234, 218, 255],
    moldings: [], panels: [],
    stripe: [0.555, 0.665], textY: 0.75, beaconA: 1.45,
    midF: 0.5, wsF: 1, bwF: 1, wsBar: 0, bwBar: 0, roofM: null, wsFrame: null, bwFrame: null,
    doorS0: 1, floor: null, rows: null, mirrorBody: false, textA: null, textW: 0.78, crossA: null, checkerY: null,
    tailA: null, extra: null, rim: 'steel', seamsA: [], flares: null, dual: 0
  };

  function classic(o) {
    const f = o.front, r = o.rear;
    return Object.assign({}, SHELL, {
      wide: [[f, 0.756], [f + 0.008, 0.783], [f + 0.025, 0.798], [f + 0.08, 0.8055], [r - 0.09, 0.8055], [r - 0.035, 0.799], [r - 0.01, 0.785], [r, 0.757]],
      sill: [[f, o.apron[0]], [f + 0.05, 0.31], [-0.37, 0.3], [0.42, 0.25], [2.05, 0.25], [2.8, 0.272], [r - 0.12, 0.275], [r, o.apron[1]]],
      crease: [[f, 0.47], [f + 0.1, 0.49], [r - 0.1, 0.49], [r, 0.47]],
      belt: [[f, o.nose[0]], [f + 0.03, o.nose[0] + 0.018], [0, 0.85], [0.42, 0.893], [0.62, 0.874], [1.4, 0.871], [2.3, 0.86], [2.74, 0.858], [2.8, 0.852], [3.15, 0.806], [r - 0.09, 0.786], [r - 0.025, 0.764], [r, o.back[0]]],
      deck: [[f, o.nose[1]], [f + 0.025, o.nose[1] + 0.016], [f + 0.12, o.nose[1] + 0.028], [0, 0.858], [0.43, 0.905], [2.72, 0.875], [2.8, 0.862], [3.0, 0.836], [r - 0.09, 0.8], [r - 0.025, 0.778], [r, o.back[1]]],
      deckCrown: [[f, 0.016], [r, 0.016]]
    }, o);
  }

  function body(o) {
    return Object.assign({}, SHELL, { rocker: 0.06, shoulder: 0.035, round: 0.03, sillW: 0.03, railIn: 0.035, railOut: 0.012, railH: 0.04, tumble: 0.1, railRef: 1.35, roofCrown: 0.1 }, o);
  }

  function samaraFace(k) {
    k.panel(-0.69, 0.535, 0.69, 0.68, 'grille', 0.004);
    k.slats(-0.27, 0.56, 0.27, 0.66, 3, 'black', 0.004, 0.012);
    k.block(-0.03, 0.592, 0.03, 0.628, 0.012, 0.02, 'chrome');
    k.both(s => {
      k.lamp(s * 0.465, 0.607, { w: 0.3, h: 0.112 }, k.LK.HEAD, 0.01);
      k.lamp(s * 0.66, 0.607, { w: 0.075, h: 0.112 }, k.ind(s), 0.01);
    });
  }

  function samara(o) {
    const f = o.front, r = o.rear;
    return body(Object.assign({
      track: [1.4, 1.37], tyre: [0.28, 0.165],
      arches: [{ a: 0, yc: 0.29, r: 0.37 }, { a: 2.46, yc: 0.28, r: 0.37 }],
      wide: [[f, 0.72], [f + 0.025, 0.77], [f + 0.085, 0.8], [f + 0.3, 0.82], [0, 0.825], [2.6, 0.825], [r - 0.2, 0.815], [r - 0.065, 0.8], [r - 0.015, 0.78], [r, 0.75]],
      sill: [[f, 0.27], [f + 0.15, 0.27], [-0.38, 0.26], [0.42, 0.22], [2.04, 0.22], [2.85, 0.27], [r, 0.28]],
      crease: [[f, 0.5], [r, 0.52]],
      roof: [[0.85, 1.36], [0.95, 1.385], [1.3, 1.4], [1.8, 1.4], [2.15, 1.39], [2.36, 1.365]],
      ws: [0.36, 0.07, 0.88, 0.03],
      wb: 2.46, door: [0.43, 1.4], doorWin: 1.36, rearDoorEnd: 2.2,
      handles: [[1.27, 0.77], [2.08, 0.78]], rearSeat: 1.98,
      frame: 'black', pillar: 'black', rail: 'paint', rockerM: 'black', mirror: 'black', wheel: 'steel', handle: 'black',
      face: samaraFace
    }, o));
  }

  function volga(o) {
    const f = o.front, r = o.rear;
    return body(Object.assign({
      wb: 2.8, track: [1.46, 1.42], tyre: [0.321, 0.205],
      arches: [{ a: 0, yc: 0.33, r: 0.385 }, { a: 2.8, yc: 0.32, r: 0.385 }],
      rocker: 0.06, shoulder: 0.04, round: 0.03, sillW: 0.035, railIn: 0.04, railOut: 0.014, railH: 0.045, tumble: 0.12, railRef: 1.45, roofCrown: 0.1,
      sill: [[f, 0.37], [f + 0.1, 0.35], [-0.4, 0.33], [0.4, 0.3], [2.4, 0.3], [3.2, 0.33], [r - 0.1, 0.36], [r, 0.38]],
      crease: [[f, 0.6], [r, 0.6]],
      roof: [[1.0, 1.42], [1.1, 1.455], [1.3, 1.48], [1.7, 1.49], [2.1, 1.47], [2.35, 1.43], [2.48, 1.395]],
      ws: [0.6, 0.1, 1.06, 0.03], bw: [2.47, 0.04, 2.92, 0.06],
      door: [0.68, 1.64], doorWin: 1.61, rearDoorEnd: 2.51,
      win: [[0.62, 0.84, 'glass'], [0.84, 0.866, 'bar'], [0.866, 1.585, 'glass'], [1.585, 1.61, 'frame'], [1.61, 1.665, 'pillar'], [1.665, 1.69, 'frame'], [1.69, 2.2, 'glass'], [2.2, 2.226, 'bar'], [2.226, 2.38, 'glass'], [2.38, 2.47, 'diag']],
      winA: 0.6, winB: 2.47,
      handles: [[1.5, 0.89], [2.38, 0.89]], rearSeat: 2.3,
      frame: 'chrome', pillar: 'paint', rail: 'chrome', rockerM: 'paint', mirror: 'chrome', wheel: 'cap', handle: 'chrome',
      stripe: [0.62, 0.7], textY: 0.8, checkerY: 0.84, beaconA: 1.7
    }, o));
  }

  function truckParts(pk, lod) {
    const liv = pk.liv, ch = 'chassis', hw = 1.19, b0 = 1.5, b1 = 5.29, fy = 1.18;
    pk.box(-1.0, 0.62, 0.38, b1 - 0.1, 0.82, 0.48, ch, true);
    if (lod < 2) for (const a of [-0.9, 1.6, 3.0, 4.4]) pk.box(a - 0.04, 0.64, -0.38, a + 0.04, 0.8, 0.38, ch);
    const fpts = [[-0.98, 0.66], [-0.95, 0.8], [-0.86, 0.91], [-0.62, 1.01], [-0.3, 1.06], [0, 1.07], [0.3, 1.04], [0.46, 0.97], [0.55, 0.86], [0.6, 0.76]];
    const pts = lod ? fpts.filter((q, i) => i % 2 === 0 || i === fpts.length - 1) : fpts;
    for (const side of [1, -1]) {
      pk.sweepA(pts, lod === 2 ? [[1.08, -0.16], [1.08, 0], [0.48, 0]] : [[1.08, -0.16], [1.07, -0.1], [1.0, -0.03], [0.88, 0], [0.5, 0], [0.48, -0.02]], 'paint', side);
      if (lod < 2) pk.sweepA(pts, [[0.5, -0.03], [1.06, -0.03]], 'dark', side);
    }
    pk.box(0.6, 0.72, 0.95, 1.38, 0.76, 1.1, 'black', true);
    if (lod < 2) {
      pk.box(0.68, 0.6, -0.6, 1.3, 0.9, -0.92, ch);
      pk.box(b0 - 0.05, 0.82, 0.36, b1 - 0.1, 1.1, 0.5, ch, true);
      for (const a of [b0 + 0.6, 2.9, 3.7 + 0.62]) pk.box(a - 0.03, 1.02, -hw + 0.05, a + 0.03, fy - 0.08, hw - 0.05, ch);
      pk.box(3.7 + 0.5, 0.26, 0.7, 3.7 + 0.53, 0.74, 1.12, 'black', true);
    }
    pk.box(b0, fy - 0.08, -hw, b1, fy, hw, 'plank');
    if (liv && liv.cargo) {
      pk.box(b0, fy, hw - 0.12, b1, fy + 0.14, hw, 'chassis', true);
      pk.cargo({ model: liv.cargo, y: fy, z: pk.z((b0 + b1) / 2 + 0.2) });
      return;
    }
    const top = fy + 0.6;
    pk.box(b0 + 0.06, fy, hw - 0.05, b1 - 0.06, top, hw, 'paint', true);
    pk.box(b0, fy, -hw, b0 + 0.06, 1.95, hw, 'paint');
    pk.box(b1 - 0.06, fy, -hw, b1, top, hw, 'paint');
    if (lod === 0) {
      for (const y of [fy + 0.2, fy + 0.4]) {
        pk.box(b0 + 0.06, y - 0.008, hw - 0.001, b1 - 0.06, y + 0.008, hw + 0.004, 'seam', true);
        pk.box(b1 - 0.001, y - 0.008, -hw, b1 + 0.004, y + 0.008, hw, 'seam');
      }
      for (const a of [b0 + 0.95, b0 + 1.9, b0 + 2.85]) pk.box(a - 0.03, fy - 0.06, hw - 0.002, a + 0.03, top, hw + 0.02, 'chassis', true);
    }
    if (liv && liv.tent) {
      const tm = 'canvas';
      pk.box(b0 + 0.06, top, hw - 0.02, b1 - 0.02, 2.3, hw, tm, true);
      pk.box(b0 + 0.06, top + 0.32, -hw + 0.02, b0 + 0.08, 2.3, hw - 0.02, tm);
      pk.box(b1 - 0.04, top, -hw + 0.02, b1 - 0.02, 2.3, hw - 0.02, tm);
      pk.box(b0 + 0.06, 2.3, -hw + 0.08, b1 - 0.02, 2.42, hw - 0.08, tm);
    }
  }

  function avtozakParts(pk, lod) {
    const liv = pk.liv, out = pk.out, M = pk.M, ch = 'chassis', b0 = 1.52, b1 = 5.42, hw = 1.22, y0 = 1.1, y1 = 2.98;
    if (lod < 2) pk.box(-1.1, 0.62, 0.38, b1 - 0.05, 0.84, 0.48, ch, true);
    if (lod === 0) for (const a of [-0.9, 1.7, 3.1, 4.6]) pk.box(a - 0.04, 0.64, -0.38, a + 0.04, 0.82, 0.38, ch);
    const fpts = [[-1.13, 0.6], [-1.12, 0.86], [-1.06, 0.98], [-0.9, 1.04], [-0.4, 1.06], [0.25, 1.06], [0.42, 1.0], [0.5, 0.88], [0.55, 0.76]];
    const pts = lod ? fpts.filter((q, i) => i % 2 === 0 || i === fpts.length - 1) : fpts;
    for (const side of [1, -1]) {
      pk.sweepA(pts, lod === 2 ? [[1.12, -0.2], [1.12, 0], [0.5, 0]] : [[1.12, -0.22], [1.12, -0.03], [1.09, 0], [0.53, 0], [0.5, -0.03]], 'paint', side);
      if (lod === 0) pk.sweepA(pts, [[0.51, -0.03], [1.1, -0.03]], 'dark', side);
    }
    if (lod < 2) pk.box(0.62, 0.72, 0.98, 1.4, 0.76, 1.12, 'black', true);
    if (lod === 0) {
      pk.box(0.7, 0.6, -0.62, 1.32, 0.92, -0.94, ch);
      pk.box(b0 - 0.05, 0.84, 0.36, b1 - 0.1, 1.1, 0.5, ch, true);
      for (const a of [2.6, 4.2]) pk.box(a - 0.25, y1, -0.25, a + 0.25, y1 + 0.015, 0.25, 'black');
    }
    pk.box(b0, y0, -hw, b1, y1, hw, 'paint');
    if (lod < 2) pk.box(b0 - 0.02, y0 - 0.05, -hw - 0.02, b1 + 0.02, y0 + 0.03, hw + 0.02, ch);
    if (liv && liv.stripe && lod < 2) {
      const sm = { layer: T('white'), kind: 0, c: N.rgb(liv.stripe) };
      pk.box(b0 + 0.02, 1.76, hw, b1 - 0.02, 1.9, hw + 0.004, sm, true);
      pk.box(b1, 1.76, -hw, b1 + 0.004, 1.9, hw, sm);
    }
    if (lod === 0) {
      const glass = pk.mat('dark'), bar = pk.mat('steel');
      for (const side of [1, -1]) for (const a of [2.4, 3.4, 4.4]) {
        const x = side * (hw + 0.003), z0 = a - 0.17 + M.zOff, z1 = a + 0.17 + M.zOff;
        out.mb.quad([x, 2.34, side > 0 ? z0 : z1, x, 2.34, side > 0 ? z1 : z0, x, 2.64, side > 0 ? z1 : z0, x, 2.64, side > 0 ? z0 : z1], [side, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], glass.c, glass.layer, glass.kind);
        for (let k = 1; k < 5; k++) pk.box(a - 0.17 + k * 0.068 - 0.008, 2.33, side * (hw + 0.003), a - 0.17 + k * 0.068 + 0.008, 2.65, side * (hw + 0.018), bar);
      }
      const A = N.ATLAS_MAP, uv = liv && liv.text && A && A['text|' + liv.text];
      if (uv) for (const side of [1, -1]) {
        const x = side * (hw + 0.006), za = 3.4 + M.zOff + side * 0.7, zb = 3.4 + M.zOff - side * 0.7;
        out.mb.quad([x, 1.96, za, x, 1.96, zb, x, 2.22, zb, x, 2.22, za], [side, 0, 0], [uv[0], uv[3], uv[2], uv[3], uv[2], uv[1], uv[0], uv[1]], WHITE, 0, K.ATLAS);
      }
      pk.box(b1 - 0.02, 0.62, 0.1, b1 + 0.32, 0.66, 0.78, ch);
      pk.box(b1 + 0.28, 0.66, 0.1, b1 + 0.32, 1.08, 0.14, ch);
      pk.box(b1 + 0.28, 0.66, 0.74, b1 + 0.32, 1.08, 0.78, ch);
    }
    const dm = new N.MB(256), pm = out.mat('paint'), zr = b1 + M.zOff;
    dm.box(0.06, 1.16, zr, 0.82, 2.72, zr + 0.05, pm);
    if (lod === 0) {
      const glass = out.mat('dark'), bar = out.mat('steel');
      dm.quad([0.3, 2.2, zr + 0.052, 0.58, 2.2, zr + 0.052, 0.58, 2.5, zr + 0.052, 0.3, 2.5, zr + 0.052], [0, 0, 1], [0, 0, 1, 0, 1, 1, 0, 1], glass.c, glass.layer, glass.kind);
      for (let k = 1; k < 4; k++) dm.box(0.3 + k * 0.07 - 0.008, 2.19, zr + 0.05, 0.3 + k * 0.07 + 0.008, 2.51, zr + 0.065, bar);
      dm.box(0.1, 1.9, zr + 0.05, 0.16, 1.98, zr + 0.09, out.mat('chrome'));
    }
    out.rear = { mb: dm, hx: 0.82, hz: zr };
  }

  function uralParts(pk, lod) {
    const liv = pk.liv, out = pk.out, M = pk.M, ch = 'chassis', b0 = 2.12, b1 = 6.0, hw = 1.25, fy = 1.55, top = 2.13;
    pk.box(-1.05, 0.74, 0.42, b1 - 0.05, 0.98, 0.52, ch, true);
    for (const a of [0, 3.525, 4.925]) pk.box(a - 0.09, 0.5, -0.82, a + 0.09, 0.66, 0.82, ch);
    if (lod < 2) {
      pk.box(3.35, 0.6, 0.48, 5.1, 0.74, 0.62, ch, true);
      for (const a of [-0.9, 1.7, 2.6, 4.2]) pk.box(a - 0.04, 0.76, -0.42, a + 0.04, 0.96, 0.42, ch);
      pk.box(1.7, 0.72, 0.56, 2.6, 1.18, 1.08, 'paint', true);
      pk.box(0.62, 0.84, 0.98, 1.46, 0.88, 1.2, 'black', true);
    }
    const fpts = [[-1.04, 0.92], [-1.04, 1.28], [-1.0, 1.42], [-0.86, 1.5], [-0.4, 1.52], [0.1, 1.52], [0.38, 1.44], [0.6, 1.26], [0.72, 1.06], [0.76, 0.9]];
    const pts = lod ? fpts.filter((q, i) => i % 2 === 0 || i === fpts.length - 1) : fpts;
    for (const side of [1, -1]) {
      pk.sweepA(pts, lod === 2 ? [[1.27, -0.2], [1.27, 0], [0.62, 0]] : [[1.27, -0.22], [1.26, -0.1], [1.19, -0.02], [1.06, 0], [0.64, 0], [0.62, -0.03]], 'paint', side);
      if (lod < 2) pk.sweepA(pts, [[0.64, -0.03], [1.25, -0.03]], 'dark', side);
    }
    pk.box(b0, fy - 0.08, -hw, b1, fy, hw, 'plank');
    if (lod < 2) pk.box(b0, fy - 0.2, -hw + 0.02, b1, fy - 0.08, hw - 0.02, ch);
    pk.box(b0 + 0.05, fy, hw - 0.05, b1 - 0.05, top, hw, 'paint', true);
    pk.box(b0, fy, -hw, b0 + 0.05, top + 0.1, hw, 'paint');
    pk.box(b1 - 0.05, fy, -hw, b1, top, hw, 'paint');
    if (lod === 0) {
      for (const y of [fy + 0.18, fy + 0.38]) {
        pk.box(b0 + 0.05, y - 0.008, hw - 0.001, b1 - 0.05, y + 0.008, hw + 0.004, 'seam', true);
        pk.box(b1 - 0.001, y - 0.008, -hw, b1 + 0.004, y + 0.008, hw, 'seam');
      }
      for (const a of [b0 + 0.98, b0 + 1.95, b0 + 2.92]) pk.box(a - 0.03, fy - 0.06, hw - 0.002, a + 0.03, top, hw + 0.02, ch, true);
      for (const a of [3.525, 4.925]) pk.box(a - 0.55, 0.92, 1.02, a + 0.55, 0.95, 1.24, 'dark', true);
    }
    pk.box(b1 - 0.06, 1.06, -1.12, b1 + 0.02, 1.36, 1.12, ch);
    if (lod === 0) {
      const sp = pk.M.tyre;
      out.mb.append(wheelMesh('truck', sp[1] / 2 / sp[0], 1, 'rimdark'), -0.5, 1.9, 1.86 + M.zOff, Math.PI / 2, sp[0]);
      pk.box(1.62, 1.3, -0.95, 1.7, 1.42, 0.0, ch);
    }
    if (liv && liv.tent) {
      const tm = out.mat('canvas'), y1 = M.H, r = 0.12;
      const prof = [[hw, top - 0.02], [hw, y1 - r], [hw - r * 0.3, y1 - r * 0.3], [hw - r, y1], [r - hw, y1], [r * 0.3 - hw, y1 - r * 0.3], [-hw, y1 - r], [-hw, top - 0.02]];
      const z0 = b0 + 0.03 + M.zOff, z1 = b1 + 0.01 + M.zOff;
      sweep(out.mb, [{ p: [0, 0, z0], o: [1, 0, 0], u: [0, 1, 0] }, { p: [0, 0, z1], o: [1, 0, 0], u: [0, 1, 0] }], prof, tm);
      for (const [z, nz] of [[z0, -1], [z1, 1]]) {
        out.mb.ensure(prof.length + 1, prof.length * 3);
        const c = out.mb.v(0, (top + y1) / 2, z, 0, 0, nz, 0.5, 0.5, tm.c, tm.layer, tm.kind);
        for (const q of prof) out.mb.v(q[0], q[1], z, 0, 0, nz, 0.5, 0.5, tm.c, tm.layer, tm.kind);
        for (let k = 0; k + 1 < prof.length; k++) out.mb.tri(c, c + 1 + k, c + 2 + k);
      }
      if (lod === 0) for (const a of [b0 + 0.9, b0 + 1.9, b0 + 2.9]) pk.box(a - 0.012, top, hw - 0.004, a + 0.012, y1 - 0.1, hw + 0.008, 'seam', true);
    }
  }

  function pazParts(pk, lod) {
    for (const a of [0.7, 3.3]) pk.box(a - 0.35, 2.76, -0.36, a + 0.35, 2.94, 0.36, 'paint');
    if (lod === 0) for (const a of [0.7, 3.3]) pk.box(a - 0.3, 2.94, -0.3, a + 0.3, 2.945, 0.3, 'black');
  }

  function lcParts(pk, lod) {
    const fl = lod < 2 ? [[0.97, -0.03], [0.975, 0.03], [0.93, 0.075], [0.88, 0.08]] : [[0.97, 0], [0.88, 0.07]];
    for (const r of pk.M.arches) {
      const t0 = -0.12, n = lod === 0 ? 10 : 5, pts = [];
      for (let k = 0; k <= n; k++) { const t = t0 + (Math.PI - 2 * t0) * k / n; pts.push([r.a - r.r * Math.cos(t), r.yc + r.r * Math.sin(t)]); }
      for (const side of [1, -1]) pk.sweepA(pts, fl, 'black', side);
    }
    if (lod < 2) {
      pk.box(0.62, 0.4, 0.8, 2.3, 0.44, 0.96, 'black', true);
      for (const a of [0.9, 2.0]) pk.box(a - 0.03, 0.44, 0.78, a + 0.03, 0.5, 0.86, 'chassis', true);
      pk.box(1.15, 1.85, 0.6, 3.68, 1.875, 0.64, 'black', true);
      if (lod === 0) for (const a of [1.2, 2.4, 3.6]) pk.box(a - 0.04, 1.83, 0.58, a + 0.04, 1.855, 0.66, 'black', true);
    }
  }

  const MODELS = {
    bmw525: body({
      front: -0.835, rear: 3.835, wb: 2.761, track: [1.47, 1.495], tyre: [0.324, 0.205],
      arches: [{ a: 0, yc: 0.31, r: 0.375 }, { a: 2.761, yc: 0.3, r: 0.375 }],
      rocker: 0.06, shoulder: 0.05, round: 0.03, tumble: 0.12, railRef: 1.38, roofCrown: 0.1, glassC: [226, 230, 236, 255],
      wide: [[-0.835, 0.72], [-0.82, 0.8], [-0.76, 0.85], [-0.55, 0.872], [-0.2, 0.8755], [3.55, 0.8755], [3.75, 0.865], [3.82, 0.83], [3.835, 0.78]],
      sill: [[-0.835, 0.28], [-0.65, 0.27], [-0.38, 0.26], [0.42, 0.22], [2.35, 0.22], [3.15, 0.26], [3.835, 0.3]],
      crease: [[-0.835, 0.5], [3.835, 0.52]],
      belt: [[-0.835, 0.7], [-0.78, 0.73], [-0.4, 0.8], [0, 0.85], [0.62, 0.915], [1.6, 0.925], [2.6, 0.935], [3.15, 0.94], [3.6, 0.93], [3.78, 0.9], [3.835, 0.86]],
      deck: [[-0.835, 0.72], [-0.79, 0.76], [-0.55, 0.81], [0, 0.89], [0.62, 0.965], [3.18, 1.03], [3.6, 1.02], [3.78, 0.99], [3.835, 0.95]],
      deckCrown: [[-0.835, 0.03], [3.835, 0.025]],
      roof: [[1.15, 1.37], [1.26, 1.395], [1.5, 1.41], [2.0, 1.412], [2.4, 1.395], [2.62, 1.36]],
      ws: [0.62, 0.12, 1.2, 0.04], bw: [2.62, 0.04, 3.18, 0.07],
      door: [0.62, 1.67], doorWin: 1.62, rearDoorEnd: 2.62,
      win: [[0.72, 1.6, 'glass'], [1.6, 1.62, 'frame'], [1.62, 1.72, 'pillar'], [1.72, 1.74, 'frame'], [1.74, 2.46, 'glass'], [2.46, 2.62, 'diag']],
      winA: 0.62, winB: 2.62,
      handles: [[1.55, 0.84], [2.5, 0.85]], rearSeat: 2.35,
      frame: 'black', pillar: 'black', rail: 'paint', rockerM: 'paint', mirror: 'paint', wheel: 'alloy10', rim: 'alloy', handle: 'black',
      moldings: [{ y: 0.48, h: 0.045, m: 'black', a0: -0.7, a1: 3.7 }],
      bumper: { ends: 'plastic', m: 'black', y: 0.4, yr: 0.42, h: 0.2, f: -0.838, fw: -0.5, r: 3.838, rw: 3.35, xh: 0.875, rc: 0.2, strip: [0.06, 'chrome'] },
      plates: [0.38, 0.58], plateZ: [-0.864, 3.842],
      stripe: [0.6, 0.68], textY: 0.78, beaconA: 1.7,
      face(k) {
        k.panel(-0.8, 0.53, 0.8, 0.73, 'grille', 0.004);
        k.both(s => {
          k.panel(s * 0.035, 0.535, s * 0.17, 0.725, 'grille', 0.024);
          k.frame(s * 0.03, 0.53, s * 0.175, 0.73, 0.012, 'chrome', 0.006, 0.03);
          k.vslats(s * 0.045, 0.545, s * 0.16, 0.715, 6, 'chrome', 0.006, 0.022, 0.3);
          k.lamp(s * 0.31, 0.63, { r: 0.072 }, k.LK.HEAD, 0.01);
          k.lamp(s * 0.5, 0.63, { r: 0.078 }, k.LK.HEAD, 0.01);
          k.lamp(s * 0.72, 0.4, { w: 0.13, h: 0.05 }, k.ind(s), -0.03);
        });
      },
      tail(k) {
        k.panel(-0.3, 0.72, 0.3, 0.86, 'grille', 0.003);
        k.both(s => {
          k.rect(s * 0.58, 0.79, 0.58, 0.16, 'black', 0.003);
          k.lamp(s * 0.78, 0.79, { w: 0.15, h: 0.13 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.6, 0.79, { w: 0.19, h: 0.13 }, k.ind(s), 0.008);
          k.lamp(s * 0.4, 0.79, { w: 0.18, h: 0.13 }, k.LK.REV, 0.008);
        });
      }
    }),
    merc600: body({
      front: -0.9, rear: 4.12, wb: 3.04, track: [1.602, 1.574], tyre: [0.344, 0.235],
      arches: [{ a: 0, yc: 0.33, r: 0.395 }, { a: 3.04, yc: 0.32, r: 0.395 }],
      rocker: 0.07, shoulder: 0.05, round: 0.04, tumble: 0.13, railRef: 1.45, roofCrown: 0.11, glassC: [226, 230, 236, 255],
      wide: [[-0.9, 0.8], [-0.88, 0.87], [-0.8, 0.92], [-0.55, 0.94], [-0.2, 0.943], [3.75, 0.943], [4.0, 0.93], [4.1, 0.9], [4.12, 0.86]],
      sill: [[-0.9, 0.3], [-0.7, 0.29], [-0.4, 0.28], [0.44, 0.24], [2.6, 0.24], [3.45, 0.28], [4.12, 0.31]],
      crease: [[-0.9, 0.57], [4.12, 0.59]],
      belt: [[-0.9, 0.78], [-0.82, 0.82], [-0.4, 0.88], [0, 0.92], [0.45, 0.96], [2.0, 0.98], [3.0, 1.0], [3.6, 1.02], [4.0, 1.0], [4.12, 0.94]],
      deck: [[-0.9, 0.8], [-0.86, 0.85], [-0.6, 0.9], [0, 0.95], [0.42, 0.985], [3.5, 1.08], [3.9, 1.07], [4.08, 1.03], [4.12, 0.99]],
      deckCrown: [[-0.9, 0.03], [4.12, 0.025]],
      roof: [[1.05, 1.42], [1.2, 1.46], [1.5, 1.48], [2.3, 1.484], [2.75, 1.46], [2.95, 1.43]],
      ws: [0.42, 0.14, 1.15, 0.06], bw: [2.95, 0.05, 3.5, 0.08],
      door: [0.5, 1.72], doorWin: 1.66, rearDoorEnd: 2.85,
      win: [[0.6, 1.64, 'glass'], [1.64, 1.66, 'frame'], [1.66, 1.78, 'pillar'], [1.78, 1.8, 'frame'], [1.8, 2.66, 'glass'], [2.66, 2.92, 'diag']],
      winA: 0.5, winB: 2.92,
      handles: [[1.6, 0.9], [2.72, 0.91]], rearSeat: 2.55,
      frame: 'chrome', pillar: 'black', rail: 'paint', rockerM: 'paint', mirror: 'paint', wheel: 'alloy8', rim: 'alloy', handle: 'chrome',
      moldings: [{ y: 0.375, h: 0.25, m: 'clad', a0: -0.86, a1: 4.08 }, { y: 0.506, h: 0.012, m: 'chrome', a0: -0.86, a1: 4.08 }],
      bumper: { ends: 'plastic', m: 'clad', y: 0.42, yr: 0.44, h: 0.26, f: -0.928, fw: -0.6, r: 4.141, rw: 3.7, xh: 0.94, rc: 0.22, strip: [0.06, 'chrome'] },
      plates: [0.4, 0.68], plateZ: [-0.954, 4.127],
      stripe: [0.64, 0.74], textY: 0.84, beaconA: 2.2,
      face(k) {
        k.panel(-0.27, 0.56, 0.27, 0.8, 'grille', 0.012);
        k.vslats(-0.26, 0.57, 0.26, 0.79, 9, 'chrome', 0.012, 0.03, 0.35);
        k.frame(-0.29, 0.545, 0.29, 0.815, 0.022, 'chrome', 0.008, 0.035);
        k.block(-0.03, 0.82, 0.03, 0.88, 0.02, 0.03, 'chrome');
        k.both(s => {
          k.rect(s * 0.57, 0.67, 0.5, 0.2, 'black', 0.004);
          k.lamp(s * 0.53, 0.67, { w: 0.36, h: 0.17 }, k.LK.HEAD, 0.008);
          k.lamp(s * 0.77, 0.67, { w: 0.1, h: 0.17 }, k.ind(s), 0.008);
          k.lamp(s * 0.6, 0.4, { r: 0.045 }, k.LK.HEAD, -0.02);
        });
      },
      tail(k) {
        k.rect(0, 0.75, 0.84, 0.06, 'ribbed', 0.004);
        k.both(s => {
          k.rect(s * 0.665, 0.82, 0.5, 0.22, 'black', 0.003);
          k.lamp(s * 0.69, 0.86, { w: 0.4, h: 0.12 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.82, 0.75, { w: 0.14, h: 0.06 }, k.ind(s), 0.008);
          k.lamp(s * 0.66, 0.75, { w: 0.16, h: 0.06 }, k.LK.REV, 0.008);
          k.rect(s * 0.505, 0.75, 0.15, 0.06, 'reflector', 0.006);
          k.rect(s * 0.665, 0.79, 0.48, 0.01, 'black', 0.009);
        });
      }
    }),
    audi80: body({
      front: -0.79, rear: 3.54, wb: 2.546, track: [1.41, 1.43], tyre: [0.3, 0.175],
      arches: [{ a: 0, yc: 0.29, r: 0.36 }, { a: 2.546, yc: 0.28, r: 0.36 }],
      rocker: 0.06, shoulder: 0.04, round: 0.04, tumble: 0.13, railRef: 1.36, roofCrown: 0.11, glassC: [226, 230, 236, 255],
      wide: [[-0.79, 0.7], [-0.77, 0.79], [-0.7, 0.83], [-0.4, 0.8475], [3.3, 0.8475], [3.48, 0.83], [3.535, 0.79], [3.54, 0.74]],
      sill: [[-0.79, 0.28], [-0.6, 0.27], [-0.37, 0.26], [0.4, 0.22], [2.15, 0.22], [2.95, 0.26], [3.54, 0.29]],
      crease: [[-0.79, 0.52], [3.54, 0.54]],
      belt: [[-0.79, 0.64], [-0.7, 0.67], [-0.4, 0.73], [0, 0.79], [0.35, 0.84], [1.3, 0.87], [2.3, 0.89], [2.95, 0.93], [3.4, 0.94], [3.5, 0.92], [3.54, 0.88]],
      deck: [[-0.79, 0.66], [-0.74, 0.7], [-0.5, 0.76], [0, 0.83], [0.3, 0.88], [2.98, 0.99], [3.4, 0.99], [3.5, 0.97], [3.54, 0.93]],
      deckCrown: [[-0.79, 0.03], [3.54, 0.025]],
      roof: [[1.0, 1.35], [1.1, 1.38], [1.4, 1.395], [1.9, 1.397], [2.2, 1.38], [2.38, 1.34]],
      ws: [0.3, 0.12, 1.02, 0.05], bw: [2.36, 0.04, 2.98, 0.07],
      door: [0.3, 1.3], doorWin: 1.26, rearDoorEnd: 2.24,
      win: [[0.42, 1.24, 'glass'], [1.24, 1.26, 'frame'], [1.26, 1.34, 'pillar'], [1.34, 1.36, 'frame'], [1.36, 2.1, 'glass'], [2.1, 2.36, 'diag']],
      winA: 0.3, winB: 2.36,
      handles: [[1.18, 0.78], [2.1, 0.8]], rearSeat: 2.05,
      frame: 'black', pillar: 'black', rail: 'paint', rockerM: 'black', mirror: 'black', wheel: 'cap2', handle: 'black',
      moldings: [{ y: 0.5, h: 0.05, m: 'black', a0: -0.79, a1: 3.54 }],
      bumper: { ends: 'plastic', m: 'black', y: 0.38, yr: 0.4, h: 0.22, f: -0.808, fw: -0.5, r: 3.541, rw: 3.2, xh: 0.86, rc: 0.2, strip: [0.04, 'rimgrey'] },
      plates: [0.36, 0.55], plateZ: [-0.834, 3.547],
      face(k) {
        k.panel(-0.27, 0.54, 0.27, 0.66, 'grille', 0.004);
        k.slats(-0.26, 0.55, 0.26, 0.65, 3, 'black', 0.004, 0.012);
        for (const x of [-0.09, -0.03, 0.03, 0.09]) k.ring(x, 0.6, 0.034, 'chrome', 0.014);
        k.both(s => {
          k.rect(s * 0.51, 0.6, 0.47, 0.15, 'black', 0.004);
          k.lamp(s * 0.46, 0.6, { w: 0.33, h: 0.12 }, k.LK.HEAD, 0.008);
          k.lamp(s * 0.685, 0.6, { w: 0.1, h: 0.12 }, k.ind(s), 0.008);
        });
      },
      tail(k) {
        k.panel(-0.32, 0.74, 0.32, 0.84, 'reflector', 0.003);
        k.both(s => {
          k.rect(s * 0.57, 0.79, 0.52, 0.15, 'black', 0.003);
          k.lamp(s * 0.74, 0.79, { w: 0.15, h: 0.12 }, k.ind(s), 0.008);
          k.lamp(s * 0.56, 0.79, { w: 0.2, h: 0.12 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.39, 0.79, { w: 0.12, h: 0.12 }, k.LK.REV, 0.008);
        });
      }
    }),
    lc80: body({
      front: -0.8, rear: 3.92, wb: 2.85, track: [1.595, 1.6], tyre: [0.395, 0.275],
      arches: [{ a: 0, yc: 0.42, r: 0.5 }, { a: 2.85, yc: 0.42, r: 0.5 }],
      rocker: 0.06, shoulder: 0.04, round: 0.03, sillW: 0.03, railIn: 0.04, railOut: 0.012, railH: 0.05, tumble: 0.06, railRef: 1.85, roofCrown: 0.04, midF: 0.7, glassC: [226, 230, 236, 255],
      wide: [[-0.8, 0.84], [-0.78, 0.88], [-0.72, 0.9], [3.85, 0.9], [3.9, 0.89], [3.92, 0.87]],
      sill: [[-0.8, 0.55], [-0.6, 0.52], [-0.45, 0.5], [0.46, 0.46], [2.4, 0.46], [3.3, 0.5], [3.92, 0.55]],
      crease: [[-0.8, 0.8], [3.92, 0.82]],
      belt: [[-0.8, 1.02], [-0.6, 1.04], [0, 1.08], [0.55, 1.12], [1.6, 1.15], [3.0, 1.17], [3.85, 1.17], [3.92, 1.15]],
      deck: [[-0.8, 1.04], [-0.75, 1.07], [-0.4, 1.1], [0, 1.12], [0.55, 1.15], [3.85, 1.2], [3.92, 1.18]],
      deckCrown: [[-0.8, 0.03], [3.92, 0.01]],
      roof: [[0.95, 1.79], [1.05, 1.825], [1.4, 1.84], [3.6, 1.84], [3.8, 1.83], [3.88, 1.8]],
      ws: [0.55, 0.06, 0.98, 0.02], bw: [3.86, 0, 3.915, 0],
      bwF: 0.86, bwFrame: 'paint',
      door: [0.55, 1.58], doorWin: 1.52, rearDoorEnd: 2.48,
      win: [[0.62, 1.48, 'glass'], [1.48, 1.52, 'frame'], [1.52, 1.64, 'pillar'], [1.64, 1.66, 'frame'], [1.66, 2.36, 'glass'], [2.36, 2.48, 'pillar'], [2.48, 3.62, 'glass'], [3.62, 3.86, 'pillar']],
      winA: 0.55, winB: 3.86,
      handles: [[1.45, 1.05], [2.4, 1.05]], rearSeat: 2.35, floor: 0.5,
      frame: 'black', pillar: 'black', rail: 'paint', rockerM: 'paint', mirror: 'black', wheel: 'alloy6', rim: 'alloy', handle: 'black',
      moldings: [{ y: 0.86, h: 0.04, m: 'black', a0: -0.6, a1: 3.8 }],
      bumper: { ends: 'plastic', m: 'steel', y: 0.6, yr: 0.62, h: 0.22, f: -0.838, fw: -0.55, r: 3.938, rw: 3.6, xh: 0.94, rc: 0.12 },
      plates: [0.58, 0.62], plateZ: [-0.864, 3.927],
      stripe: [0.92, 1.0], textY: 1.07, beaconA: 1.6,
      extra: lcParts,
      face(k) {
        k.panel(-0.44, 0.79, 0.44, 0.97, 'grille', 0.004);
        k.slats(-0.43, 0.8, 0.43, 0.96, 5, 'chrome', 0.004, 0.012);
        k.frame(-0.45, 0.78, 0.45, 0.98, 0.012, 'chrome', 0.004, 0.016);
        k.block(-0.06, 0.86, 0.06, 0.91, 0.014, 0.022, 'chrome');
        k.both(s => {
          k.rect(s * 0.65, 0.88, 0.36, 0.17, 'chrome', 0.004);
          k.lamp(s * 0.65, 0.88, { w: 0.32, h: 0.14 }, k.LK.HEAD, 0.008);
          k.lamp(s * 0.65, 0.75, { w: 0.28, h: 0.06 }, k.ind(s), 0.008);
        });
      },
      tail(k) {
        k.both(s => {
          k.rect(s * 0.81, 0.97, 0.13, 0.4, 'black', 0.003);
          k.lamp(s * 0.81, 1.1, { w: 0.1, h: 0.1 }, k.ind(s), 0.008);
          k.lamp(s * 0.81, 0.96, { w: 0.1, h: 0.16 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.81, 0.83, { w: 0.1, h: 0.08 }, k.LK.REV, 0.008);
        });
      }
    }),
    vaz2101: classic({
      front: -0.515, rear: 3.39, apron: [0.34, 0.32], nose: [0.775, 0.785], back: [0.742, 0.755],
      frame: 'chrome', pillar: 'paint', rail: 'chrome', rockerM: 'chrome', mirror: 'round', wheel: 'cap', handle: 'chrome',
      bumper: { y: 0.415, h: 0.062, f: -0.598, fw: -0.4, r: 3.448, rw: 3.24, xh: 0.832, rc: 0.09, ends: 'chrome', over: { x: 0.3, y0: 0.3, y1: 0.48, m: 'chrome' } },
      plates: [0.415, 0.535],
      face(k) {
        k.panel(-0.705, 0.548, 0.705, 0.752, 'grille', 0.004);
        if (k.lod === 0) for (const y of [0.582, 0.616, 0.65, 0.684, 0.718]) k.block(-0.452, y - 0.006, 0.452, y + 0.006, 0.004, 0.014, 'chrome');
        k.frame(-0.715, 0.538, 0.715, 0.762, 0.014, 'chrome', 0.004, 0.018);
        k.both(s => {
          k.ring(s * 0.565, 0.65, 0.104, 'chrome', 0.014);
          k.lamp(s * 0.565, 0.65, { r: 0.089 }, k.LK.HEAD, 0.017);
          k.lamp(s * 0.6, 0.322, { w: 0.11, h: 0.042 }, k.ind(s), 0.02);
        });
        if (k.lod === 0) k.block(-0.035, 0.695, 0.035, 0.732, 0.014, 0.022, 'chrome');
      },
      tail(k) {
        k.both(s => {
          k.frame(0.618 * s, 0.515, 0.782 * s, 0.745, 0.012, 'chrome', 0.002, 0.012);
          k.lamp(s * 0.7, 0.705, { w: 0.15, h: 0.058 }, k.ind(s), 0.008);
          k.lamp(s * 0.7, 0.628, { w: 0.15, h: 0.088 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.7, 0.553, { w: 0.15, h: 0.052 }, k.LK.REV, 0.008);
        });
      }
    }),
    vaz2106: classic({
      front: -0.545, rear: 3.42, apron: [0.33, 0.31], nose: [0.78, 0.79], back: [0.745, 0.76],
      frame: 'chrome', pillar: 'paint', rail: 'chrome', rockerM: 'chrome', mirror: 'chrome', wheel: 'cap2', handle: 'chrome',
      bumper: { y: 0.41, h: 0.074, f: -0.632, fw: -0.42, r: 3.482, rw: 3.24, xh: 0.835, rc: 0.1, ends: 'black', strip: true, over: { x: 0.36, y0: 0.335, y1: 0.47, m: 'rubber' } },
      plates: [0.41, 0.585],
      moldings: [{ y: 0.64, h: 0.02, m: 'chrome' }],
      vent: [2.4, 2.53, 1.03, 1.075],
      face(k) {
        k.panel(-0.735, 0.55, 0.735, 0.75, 'grille', 0.004);
        k.frame(-0.745, 0.54, 0.745, 0.76, 0.013, 'chrome', 0.004, 0.017);
        if (k.lod === 0) for (const y of [0.598, 0.702]) k.block(-0.33, y - 0.004, 0.33, y + 0.004, 0.004, 0.01, 'black');
        k.block(-0.335, 0.642, 0.335, 0.658, 0.004, 0.017, 'chrome');
        k.both(s => {
          for (const x of [0.43, 0.618]) {
            k.ring(s * x, 0.65, 0.08, 'chrome', 0.013);
            k.lamp(s * x, 0.65, { r: 0.066 }, k.LK.HEAD, 0.016);
          }
          k.lamp(s * 0.615, 0.318, { w: 0.13, h: 0.045 }, k.ind(s), 0.02);
        });
        if (k.lod === 0) k.block(-0.05, 0.63, 0.05, 0.67, 0.016, 0.024, 'chrome');
      },
      tail(k) {
        k.panel(-0.4, 0.565, 0.4, 0.715, 'grille', 0.003);
        k.both(s => {
          k.frame(0.392 * s, 0.556, 0.792 * s, 0.724, 0.011, 'chrome', 0.002, 0.013);
          k.lamp(s * 0.733, 0.64, { w: 0.096, h: 0.132 }, k.ind(s), 0.008);
          k.lamp(s * 0.597, 0.64, { w: 0.168, h: 0.132 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.458, 0.64, { w: 0.1, h: 0.132 }, k.LK.REV, 0.008);
        });
      }
    }),
    vaz2107: classic({
      front: -0.55, rear: 3.42, apron: [0.32, 0.31], nose: [0.792, 0.818], back: [0.75, 0.772],
      deckCrown: [[-0.55, 0.036], [-0.35, 0.032], [0.43, 0.018], [3.42, 0.016]],
      frame: 'black', pillar: 'black', rail: 'black', rockerM: 'black', mirror: 'black', wheel: 'steel', handle: 'black',
      bumper: { y: 0.41, h: 0.13, f: -0.637, fw: -0.37, r: 3.477, rw: 3.2, xh: 0.84, rc: 0.11, ends: 'big', over: null },
      plates: [0.395, 0.6],
      moldings: [{ y: 0.476, h: 0.044, m: 'rubber', a0: 0.4, a1: 2.04 }],
      face(k) {
        k.panel(-0.735, 0.545, 0.735, 0.74, 'grille', 0.004);
        k.panel(-0.18, 0.528, 0.18, 0.788, 'grille', 0.026);
        k.frame(-0.196, 0.514, 0.196, 0.802, 0.02, 'chrome', 0.004, 0.038);
        if (k.lod === 0) for (const x of [-0.12, -0.06, 0, 0.06, 0.12]) k.block(x - 0.008, 0.532, x + 0.008, 0.784, 0.02, 0.034, 'chrome');
        k.both(s => {
          k.rect(s * 0.4925, 0.64, 0.355, 0.158, 'chrome', 0.008);
          k.lamp(s * 0.447, 0.64, { w: 0.235, h: 0.13 }, k.LK.HEAD, 0.012);
          k.lamp(s * 0.623, 0.64, { w: 0.075, h: 0.13 }, k.ind(s), 0.012);
        });
      },
      tail(k) {
        k.panel(-0.39, 0.565, 0.39, 0.725, 'grille', 0.003);
        k.both(s => {
          k.rect(s * 0.59, 0.645, 0.43, 0.178, 'black', 0.004);
          k.lamp(s * 0.745, 0.645, { w: 0.1, h: 0.15 }, k.ind(s), 0.009);
          k.lamp(s * 0.585, 0.645, { w: 0.205, h: 0.15 }, k.LK.TAIL, 0.009);
          k.lamp(s * 0.435, 0.645, { w: 0.09, h: 0.15 }, k.LK.REV, 0.009);
        });
      }
    }),
    vaz2109: samara({
      front: -0.745, rear: 3.145,
      belt: [[-0.745, 0.71], [-0.7, 0.73], [-0.4, 0.77], [0, 0.825], [0.43, 0.88], [1.4, 0.9], [2.0, 0.92], [2.4, 0.95], [2.62, 0.975], [2.85, 0.97], [3.08, 0.95], [3.13, 0.93], [3.145, 0.9]],
      deck: [[-0.745, 0.73], [-0.7, 0.755], [-0.5, 0.79], [0, 0.88], [0.36, 0.93], [2.97, 1.0], [3.08, 0.985], [3.145, 0.96]],
      deckCrown: [[-0.745, 0.03], [3.145, 0.02]],
      bw: [2.34, 0.03, 2.97, 0.06],
      win: [[0.5, 1.36, 'glass'], [1.36, 1.45, 'pillar'], [1.45, 1.97, 'glass'], [1.97, 2.01, 'bar'], [2.01, 2.33, 'glass'], [2.33, 2.62, 'diag']],
      winA: 0.45, winB: 2.62,
      bumper: { ends: 'plastic', m: 'black', y: 0.4, yr: 0.43, h: 0.22, f: -0.778, fw: -0.4, r: 3.178, rw: 2.86, xh: 0.815, rc: 0.14 },
      plates: [0.4, 0.8], plateZ: [-0.804, 3.152],
      tail(k) {
        k.both(s => {
          k.rect(s * 0.585, 0.8, 0.41, 0.15, 'black', 0.003);
          k.lamp(s * 0.735, 0.8, { w: 0.09, h: 0.13 }, k.ind(s), 0.008);
          k.lamp(s * 0.6, 0.8, { w: 0.17, h: 0.13 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.465, 0.8, { w: 0.08, h: 0.13 }, k.LK.REV, 0.008);
        });
      }
    }),
    vaz21099: samara({
      front: -0.745, rear: 3.345,
      wide: [[-0.745, 0.72], [-0.72, 0.77], [-0.66, 0.8], [-0.445, 0.82], [0, 0.825], [2.6, 0.825], [3.15, 0.815], [3.28, 0.8], [3.33, 0.78], [3.345, 0.75]],
      sill: [[-0.745, 0.27], [-0.595, 0.27], [-0.38, 0.26], [0.42, 0.22], [2.04, 0.22], [2.85, 0.27], [3.345, 0.29]],
      belt: [[-0.745, 0.71], [-0.7, 0.73], [-0.4, 0.77], [0, 0.825], [0.43, 0.88], [1.4, 0.9], [2.0, 0.92], [2.4, 0.95], [2.62, 0.97], [2.86, 0.98], [3.25, 0.97], [3.31, 0.95], [3.345, 0.92]],
      deck: [[-0.745, 0.73], [-0.7, 0.755], [-0.5, 0.79], [0, 0.88], [0.36, 0.93], [2.86, 1.01], [3.25, 1.0], [3.31, 0.985], [3.345, 0.96]],
      deckCrown: [[-0.745, 0.03], [3.345, 0.02]],
      bw: [2.34, 0.03, 2.86, 0.07],
      win: [[0.5, 1.36, 'glass'], [1.36, 1.45, 'pillar'], [1.45, 1.97, 'glass'], [1.97, 2.01, 'bar'], [2.01, 2.24, 'glass'], [2.24, 2.48, 'diag']],
      winA: 0.45, winB: 2.48,
      bumper: { ends: 'plastic', m: 'black', y: 0.4, yr: 0.43, h: 0.22, f: -0.778, fw: -0.4, r: 3.378, rw: 2.86, xh: 0.815, rc: 0.14 },
      plates: [0.4, 0.8], plateZ: [-0.804, 3.352],
      tail(k) {
        k.panel(-0.36, 0.745, 0.36, 0.855, 'reflector', 0.002);
        k.both(s => {
          k.rect(s * 0.58, 0.8, 0.44, 0.14, 'black', 0.003);
          k.lamp(s * 0.735, 0.8, { w: 0.1, h: 0.12 }, k.ind(s), 0.008);
          k.lamp(s * 0.59, 0.8, { w: 0.17, h: 0.12 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.455, 0.8, { w: 0.08, h: 0.12 }, k.LK.REV, 0.008);
        });
      }
    }),
    vaz2110: body({
      front: -0.785, rear: 3.37, wb: 2.49, track: [1.4, 1.37], tyre: [0.29, 0.175],
      arches: [{ a: 0, yc: 0.3, r: 0.38 }, { a: 2.49, yc: 0.29, r: 0.38 }],
      rocker: 0.07, shoulder: 0.05, round: 0.045, tumble: 0.12, railRef: 1.38, roofCrown: 0.12,
      wide: [[-0.785, 0.62], [-0.77, 0.7], [-0.72, 0.775], [-0.6, 0.815], [-0.3, 0.835], [0.2, 0.84], [2.6, 0.84], [3.0, 0.835], [3.2, 0.815], [3.31, 0.78], [3.35, 0.74], [3.37, 0.68]],
      sill: [[-0.785, 0.29], [-0.6, 0.28], [-0.4, 0.27], [0.43, 0.22], [2.06, 0.22], [2.88, 0.27], [3.37, 0.3]],
      crease: [[-0.785, 0.52], [3.37, 0.55]],
      belt: [[-0.785, 0.72], [-0.74, 0.75], [-0.45, 0.81], [0, 0.89], [0.34, 0.955], [0.6, 0.975], [1.5, 0.99], [2.2, 1.03], [2.6, 1.055], [3.2, 1.045], [3.33, 1.015], [3.37, 0.975]],
      deck: [[-0.785, 0.74], [-0.74, 0.77], [-0.5, 0.83], [0, 0.93], [0.24, 0.975], [2.7, 1.085], [3.2, 1.07], [3.33, 1.045], [3.37, 1.0]],
      deckCrown: [[-0.785, 0.035], [3.37, 0.03]],
      roof: [[0.88, 1.36], [0.98, 1.395], [1.4, 1.42], [1.9, 1.415], [2.1, 1.395], [2.2, 1.375]],
      ws: [0.24, 0.1, 0.94, 0.04], bw: [2.16, 0.05, 2.7, 0.09],
      door: [0.36, 1.5], doorWin: 1.48, rearDoorEnd: 2.38,
      win: [[0.5, 1.48, 'glass'], [1.48, 1.56, 'pillar'], [1.56, 2.2, 'glass'], [2.2, 2.24, 'bar'], [2.24, 2.48, 'glass'], [2.48, 2.58, 'diag']],
      winA: 0.45, winB: 2.58,
      handles: [[1.37, 0.86], [2.22, 0.88]], rearSeat: 2.0,
      frame: 'black', pillar: 'black', rail: 'paint', rockerM: 'paint', mirror: 'paint', wheel: 'steel', handle: 'black',
      bumper: { ends: 'plastic', m: 'paint', y: 0.42, yr: 0.45, h: 0.27, f: -0.818, fw: -0.42, r: 3.403, rw: 2.9, xh: 0.835, rc: 0.28, strip: [0.035, 'black'] },
      plates: [0.4, 0.47], plateZ: [-0.846, 3.43],
      stripe: [0.66, 0.76], textY: 0.86,
      face(k) {
        k.panel(-0.2, 0.585, 0.2, 0.665, 'grille', 0.004);
        k.frame(-0.21, 0.578, 0.21, 0.672, 0.01, 'black', 0.004, 0.012);
        k.block(-0.045, 0.605, 0.045, 0.645, 0.012, 0.02, 'chrome');
        k.panel(-0.36, 0.33, 0.36, 0.39, 'grille', 0.064);
        k.both(s => {
          k.rect(s * 0.42, 0.625, 0.38, 0.13, 'black', 0.004);
          k.lamp(s * 0.4, 0.628, { w: 0.3, h: 0.11 }, k.LK.HEAD, 0.009);
          k.lamp(s * 0.585, 0.615, { w: 0.05, h: 0.08 }, k.ind(s), 0.009);
        });
      },
      tail(k) {
        k.panel(-0.32, 0.86, 0.32, 0.94, 'reflector', 0.003);
        k.both(s => {
          k.rect(s * 0.5, 0.9, 0.38, 0.11, 'black', 0.003);
          k.lamp(s * 0.625, 0.9, { w: 0.11, h: 0.09 }, k.ind(s), 0.008);
          k.lamp(s * 0.475, 0.9, { w: 0.17, h: 0.09 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.355, 0.9, { w: 0.07, h: 0.09 }, k.LK.REV, 0.008);
        });
      }
    }),
    niva: body({
      front: -0.67, rear: 2.97, wb: 2.2, track: [1.43, 1.4], tyre: [0.343, 0.175],
      arches: [{ a: 0, yc: 0.4, r: 0.43 }, { a: 2.2, yc: 0.4, r: 0.43 }],
      rocker: 0.06, shoulder: 0.03, round: 0.02, railIn: 0.03, railOut: 0.015, railH: 0.05, tumble: 0.07, railRef: 1.6, roofCrown: 0.06, midF: 0.86, bwF: 0.86,
      wide: [[-0.67, 0.8], [-0.65, 0.825], [-0.6, 0.835], [-0.3, 0.84], [2.7, 0.84], [2.92, 0.835], [2.96, 0.825], [2.97, 0.8]],
      sill: [[-0.67, 0.5], [-0.5, 0.46], [0.46, 0.42], [1.74, 0.42], [2.65, 0.46], [2.97, 0.5]],
      crease: [[-0.67, 0.8], [2.97, 0.8]],
      belt: [[-0.67, 0.955], [-0.63, 0.975], [0, 1.03], [0.6, 1.085], [1.6, 1.1], [2.85, 1.1], [2.95, 1.09], [2.97, 1.075]],
      deck: [[-0.67, 0.975], [-0.63, 0.995], [-0.3, 1.03], [0.2, 1.08], [0.58, 1.12], [2.945, 1.13], [2.97, 1.11]],
      deckCrown: [[-0.67, 0.025], [2.97, 0.02]],
      roof: [[0.92, 1.595], [1.02, 1.63], [1.5, 1.64], [2.6, 1.64], [2.82, 1.63], [2.9, 1.61]],
      ws: [0.58, 0.04, 0.93, 0.02], bw: [2.9, 0, 2.945, 0],
      door: [0.62, 1.63], doorWin: 1.58, rearDoorEnd: null,
      win: [[0.68, 1.0, 'glass'], [1.0, 1.03, 'bar'], [1.03, 1.58, 'glass'], [1.58, 1.67, 'pillar'], [1.67, 2.5, 'glass'], [2.5, 2.6, 'diag']],
      winA: 0.62, winB: 2.6,
      handles: [[1.5, 0.98]], rearSeat: 2.15,
      frame: 'chrome', pillar: 'paint', rail: 'paint', rockerM: 'paint', mirror: 'chrome', wheel: 'steel', handle: 'chrome',
      bumper: { ends: 'black', m: 'steel', y: 0.565, h: 0.11, f: -0.708, fw: -0.5, r: 3.008, rw: 2.68, xh: 0.85, rc: 0.06 },
      plates: [0.565, 0.72], plateZ: [-0.724, 2.977],
      stripe: [0.62, 0.72], textY: 0.9, beaconA: 1.5,
      face(k) {
        k.panel(-0.38, 0.75, 0.38, 0.92, 'grille', 0.004);
        k.slats(-0.37, 0.765, 0.37, 0.905, 4, 'black', 0.004, 0.012);
        k.both(s => {
          k.rect(s * 0.555, 0.835, 0.235, 0.235, 'grille', 0.004);
          k.ring(s * 0.555, 0.835, 0.1, 'chrome', 0.008);
          k.lamp(s * 0.555, 0.835, { r: 0.089 }, k.LK.HEAD, 0.011);
          k.lamp(s * 0.6, 0.675, { w: 0.12, h: 0.05 }, k.ind(s), 0.008);
        });
      },
      tail(k) {
        k.both(s => {
          k.rect(s * 0.58, 0.69, 0.32, 0.13, 'black', 0.003);
          k.lamp(s * 0.69, 0.69, { w: 0.09, h: 0.11 }, k.ind(s), 0.008);
          k.lamp(s * 0.56, 0.69, { w: 0.15, h: 0.11 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.45, 0.69, { w: 0.06, h: 0.11 }, k.LK.REV, 0.008);
        });
      }
    }),
    oka: body({
      front: -0.505, rear: 2.585, wb: 2.18, track: [1.21, 1.2], tyre: [0.26, 0.135],
      arches: [{ a: 0, yc: 0.27, r: 0.335 }, { a: 2.18, yc: 0.26, r: 0.335 }],
      rocker: 0.05, shoulder: 0.03, tumble: 0.07, railRef: 1.36, roofCrown: 0.05,
      wide: [[-0.505, 0.64], [-0.49, 0.68], [-0.45, 0.7], [-0.3, 0.71], [2.4, 0.71], [2.54, 0.7], [2.575, 0.685], [2.585, 0.66]],
      sill: [[-0.505, 0.25], [-0.35, 0.24], [0.34, 0.2], [1.84, 0.2], [2.5, 0.23], [2.585, 0.25]],
      crease: [[-0.505, 0.48], [2.585, 0.5]],
      belt: [[-0.505, 0.69], [-0.47, 0.71], [0, 0.8], [0.24, 0.84], [1.3, 0.86], [2.2, 0.9], [2.5, 0.915], [2.585, 0.9]],
      deck: [[-0.505, 0.705], [-0.47, 0.73], [0, 0.825], [0.18, 0.86], [2.535, 0.945], [2.585, 0.93]],
      deckCrown: [[-0.505, 0.015], [2.585, 0.015]],
      roof: [[0.82, 1.345], [0.92, 1.385], [1.5, 1.4], [2.3, 1.39], [2.42, 1.37]],
      ws: [0.18, 0.06, 0.86, 0.03], bw: [2.42, 0.02, 2.535, 0.03],
      door: [0.25, 1.42], doorWin: 1.33, rearDoorEnd: null,
      win: [[0.32, 1.33, 'glass'], [1.33, 1.44, 'pillar'], [1.44, 2.1, 'glass'], [2.1, 2.32, 'diag']],
      winA: 0.25, winB: 2.32,
      handles: [[1.3, 0.75]], rearSeat: 1.78,
      frame: 'black', pillar: 'paint', rail: 'paint', rockerM: 'black', mirror: 'black', wheel: 'steel', handle: 'black',
      bumper: { ends: 'plastic', m: 'black', y: 0.34, h: 0.21, f: -0.538, fw: -0.36, r: 2.618, rw: 2.53, xh: 0.725, rc: 0.08 },
      plates: [0.34, 0.34], plateZ: [-0.564, 2.644],
      stripe: [0.55, 0.63], textY: 0.72, beaconA: 1.4,
      face(k) {
        k.panel(-0.62, 0.46, 0.62, 0.69, 'grille', 0.004);
        k.slats(-0.3, 0.505, 0.3, 0.645, 3, 'black', 0.004, 0.012);
        k.both(s => {
          k.lamp(s * 0.445, 0.585, { w: 0.2, h: 0.11 }, k.LK.HEAD, 0.01);
          k.lamp(s * 0.585, 0.585, { w: 0.055, h: 0.11 }, k.ind(s), 0.01);
        });
      },
      tail(k) {
        k.both(s => {
          k.rect(s * 0.555, 0.665, 0.13, 0.29, 'black', 0.003);
          k.lamp(s * 0.555, 0.755, { w: 0.1, h: 0.08 }, k.ind(s), 0.008);
          k.lamp(s * 0.555, 0.665, { w: 0.1, h: 0.09 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.555, 0.575, { w: 0.1, h: 0.07 }, k.LK.REV, 0.008);
        });
      }
    }),
    zaz968: body({
      front: -0.61, rear: 3.055, wb: 2.16, track: [1.22, 1.2], tyre: [0.3, 0.155],
      arches: [{ a: 0, yc: 0.29, r: 0.36 }, { a: 2.16, yc: 0.28, r: 0.36 }],
      rocker: 0.05, shoulder: 0.04, round: 0.04, sillW: 0.035, railH: 0.045, tumble: 0.1, railRef: 1.34, roofCrown: 0.08,
      wide: [[-0.61, 0.7], [-0.59, 0.74], [-0.52, 0.77], [-0.3, 0.785], [2.6, 0.785], [2.9, 0.775], [3.02, 0.75], [3.055, 0.71]],
      sill: [[-0.61, 0.32], [-0.45, 0.29], [0.37, 0.25], [1.8, 0.25], [2.55, 0.28], [3.055, 0.32]],
      crease: [[-0.61, 0.58], [3.055, 0.6]],
      belt: [[-0.61, 0.81], [-0.57, 0.83], [-0.2, 0.86], [0.33, 0.895], [1.3, 0.905], [2.2, 0.91], [2.4, 0.905], [2.85, 0.88], [3.0, 0.855], [3.055, 0.82]],
      deck: [[-0.61, 0.84], [-0.57, 0.86], [-0.3, 0.895], [0.28, 0.94], [2.3, 0.96], [2.6, 0.935], [2.9, 0.88], [3.055, 0.835]],
      deckCrown: [[-0.61, 0.03], [3.055, 0.025]],
      roof: [[0.64, 1.35], [0.74, 1.385], [1.4, 1.4], [1.9, 1.395], [2.08, 1.365]],
      ws: [0.28, 0.06, 0.68, 0.03], bw: [2.07, 0.02, 2.3, 0.04],
      door: [0.3, 1.35], doorWin: 1.29, rearDoorEnd: null,
      win: [[0.38, 0.74, 'glass'], [0.74, 0.77, 'bar'], [0.77, 1.29, 'glass'], [1.29, 1.38, 'pillar'], [1.38, 1.96, 'glass'], [1.96, 2.1, 'diag']],
      winA: 0.34, winB: 2.1,
      handles: [[1.23, 0.79]], rearSeat: 1.72,
      frame: 'chrome', pillar: 'paint', rail: 'paint', rockerM: 'paint', mirror: 'round', wheel: 'cap', handle: 'chrome',
      moldings: [{ y: 0.745, h: 0.016, m: 'chrome' }],
      panels: [{ a0: 2.38, a1: 2.76, y0: 0.56, y1: 0.66, m: 'black', slots: 9 }],
      bumper: { ends: 'black', m: 'chrome', y: 0.37, h: 0.055, f: -0.648, fw: -0.46, r: 3.093, rw: 2.88, xh: 0.8, rc: 0.08, over: { x: 0.25, y0: 0.32, y1: 0.43, m: 'rubber' } },
      plates: [0.28, 0.565], plateZ: [-0.66, 3.062],
      stripe: [0.6, 0.69], textY: 0.81,
      face(k) {
        k.block(-0.37, 0.625, 0.37, 0.655, 0.004, 0.016, 'chrome');
        k.block(-0.05, 0.615, 0.05, 0.665, 0.012, 0.022, 'chrome');
        k.both(s => {
          k.ring(s * 0.5, 0.64, 0.1, 'chrome', 0.012);
          k.lamp(s * 0.5, 0.64, { r: 0.085 }, k.LK.HEAD, 0.016);
          k.lamp(s * 0.5, 0.48, { w: 0.08, h: 0.035 }, k.ind(s), 0.01);
        });
      },
      tail(k) {
        k.panel(-0.3, 0.66, 0.3, 0.78, 'grille', 0.003);
        k.slats(-0.29, 0.67, 0.29, 0.77, 5, 'black', 0.003, 0.01);
        k.both(s => {
          k.rect(s * 0.5, 0.565, 0.32, 0.11, 'chrome', 0.003);
          k.lamp(s * 0.605, 0.565, { w: 0.09, h: 0.09 }, k.ind(s), 0.008);
          k.lamp(s * 0.495, 0.565, { w: 0.12, h: 0.09 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.395, 0.565, { w: 0.07, h: 0.09 }, k.LK.REV, 0.008);
        });
      }
    }),
    m412: body({
      front: -0.73, rear: 3.42, wb: 2.4, track: [1.27, 1.27], tyre: [0.305, 0.165],
      arches: [{ a: 0, yc: 0.28, r: 0.355 }, { a: 2.4, yc: 0.27, r: 0.36 }],
      rocker: 0.05, shoulder: 0.03, round: 0.025, sillW: 0.035, railIn: 0.04, railH: 0.045, tumble: 0.09, railRef: 1.4, roofCrown: 0.09,
      wide: [[-0.73, 0.745], [-0.715, 0.765], [-0.67, 0.775], [3.35, 0.775], [3.4, 0.765], [3.42, 0.745]],
      sill: [[-0.73, 0.35], [-0.6, 0.31], [0.36, 0.27], [2.04, 0.27], [3.0, 0.31], [3.42, 0.35]],
      crease: [[-0.73, 0.57], [3.42, 0.57]],
      belt: [[-0.73, 0.81], [-0.7, 0.835], [0, 0.9], [0.42, 0.96], [1.5, 0.97], [2.4, 0.975], [2.6, 0.98], [3.3, 0.95], [3.39, 0.925], [3.42, 0.895]],
      deck: [[-0.73, 0.845], [-0.7, 0.865], [-0.4, 0.9], [0.35, 0.975], [2.58, 1.0], [3.3, 0.975], [3.39, 0.95], [3.42, 0.92]],
      deckCrown: [[-0.73, 0.02], [3.42, 0.02]],
      roof: [[0.7, 1.43], [0.8, 1.46], [1.4, 1.48], [2.0, 1.475], [2.2, 1.46], [2.32, 1.435]],
      ws: [0.35, 0.07, 0.72, 0.03], bw: [2.31, 0.03, 2.58, 0.06],
      door: [0.55, 1.48], doorWin: 1.455, rearDoorEnd: 2.33,
      win: [[0.62, 0.9, 'glass'], [0.9, 0.93, 'bar'], [0.93, 1.43, 'glass'], [1.43, 1.455, 'frame'], [1.455, 1.5, 'pillar'], [1.5, 1.525, 'frame'], [1.525, 1.94, 'glass'], [1.94, 1.97, 'bar'], [1.97, 2.12, 'glass'], [2.12, 2.31, 'diag']],
      winA: 0.55, winB: 2.31,
      handles: [[1.4, 0.86], [2.27, 0.86]], rearSeat: 2.05,
      frame: 'chrome', pillar: 'paint', rail: 'chrome', rockerM: 'chrome', mirror: 'round', wheel: 'cap', handle: 'chrome',
      bumper: { ends: 'chrome', m: 'chrome', y: 0.43, h: 0.07, f: -0.768, fw: -0.55, r: 3.458, rw: 3.25, xh: 0.79, rc: 0.08, over: { x: 0.34, y0: 0.33, y1: 0.52, m: 'rubber' } },
      plates: [0.32, 0.585], plateZ: [-0.778, 3.427],
      stripe: [0.62, 0.71], textY: 0.82,
      face(k) {
        k.panel(-0.7, 0.6, 0.7, 0.78, 'grille', 0.004);
        k.slats(-0.45, 0.61, 0.45, 0.77, 5, 'chrome', 0.004, 0.012);
        k.frame(-0.71, 0.59, 0.71, 0.79, 0.012, 'chrome', 0.004, 0.016);
        k.both(s => {
          k.ring(s * 0.575, 0.69, 0.1, 'chrome', 0.013);
          k.lamp(s * 0.575, 0.69, { r: 0.089 }, k.LK.HEAD, 0.016);
          k.lamp(s * 0.575, 0.53, { w: 0.09, h: 0.04 }, k.ind(s), 0.01);
        });
      },
      tail(k) {
        k.block(-0.3, 0.738, 0.3, 0.752, 0.003, 0.01, 'chrome');
        k.both(s => {
          k.frame(s * 0.39, 0.69, s * 0.74, 0.8, 0.01, 'chrome', 0.002, 0.012);
          k.lamp(s * 0.67, 0.745, { w: 0.1, h: 0.09 }, k.ind(s), 0.008);
          k.lamp(s * 0.53, 0.745, { w: 0.17, h: 0.09 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.42, 0.745, { w: 0.04, h: 0.09 }, k.LK.REV, 0.008);
        });
      }
    }),
    volga24: volga({
      front: -0.66, rear: 3.95,
      wide: [[-0.66, 0.82], [-0.64, 0.86], [-0.58, 0.89], [-0.3, 0.9], [3.6, 0.9], [3.88, 0.885], [3.95, 0.85]],
      belt: [[-0.66, 0.86], [-0.6, 0.9], [0, 0.93], [0.6, 0.955], [2.5, 0.955], [3.4, 0.935], [3.88, 0.9], [3.95, 0.86]],
      deck: [[-0.66, 0.89], [-0.6, 0.915], [0, 0.94], [0.6, 0.965], [2.92, 0.965], [3.5, 0.94], [3.88, 0.9], [3.95, 0.88]],
      deckCrown: [[-0.66, 0.02], [3.95, 0.02]],
      bumper: { ends: 'chrome', y: 0.47, h: 0.08, f: -0.704, fw: -0.45, r: 3.999, rw: 3.65, xh: 0.875, rc: 0.1, over: { x: 0.36, y0: 0.36, y1: 0.58, m: 'chrome' } },
      plates: [0.37, 0.615], plateZ: [-0.722, 3.957],
      moldings: [{ y: 0.335, h: 0.016, m: 'chrome', a0: 0.42, a1: 2.38 }],
      face(k) {
        k.panel(-0.56, 0.56, 0.56, 0.765, 'grille', 0.004);
        k.vslats(-0.55, 0.57, 0.55, 0.755, 22, 'chrome', 0.004, 0.012, 0.36);
        k.frame(-0.57, 0.552, 0.57, 0.772, 0.012, 'chrome', 0.004, 0.016);
        k.block(-0.8, 0.775, 0.8, 0.79, 0.004, 0.012, 'chrome');
        k.both(s => {
          k.ring(s * 0.67, 0.665, 0.105, 'chrome', 0.012);
          k.lamp(s * 0.67, 0.665, { r: 0.089 }, k.LK.HEAD, 0.016);
          k.lamp(s * 0.66, 0.54, { w: 0.11, h: 0.04 }, k.ind(s), 0.01);
        });
        k.block(-0.03, 0.66, 0.03, 0.7, 0.012, 0.02, 'chrome');
      },
      tail(k) {
        k.both(s => {
          k.rect(s * 0.765, 0.72, 0.13, 0.3, 'chrome', 0.003);
          k.lamp(s * 0.765, 0.82, { w: 0.105, h: 0.08 }, k.ind(s), 0.008);
          k.lamp(s * 0.765, 0.715, { w: 0.105, h: 0.11 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.765, 0.615, { w: 0.105, h: 0.07 }, k.LK.REV, 0.008);
        });
      }
    }),
    volga3110: volga({
      front: -0.83, rear: 3.97,
      wide: [[-0.83, 0.8], [-0.81, 0.85], [-0.74, 0.885], [-0.5, 0.9], [3.6, 0.9], [3.9, 0.885], [3.97, 0.85]],
      belt: [[-0.83, 0.79], [-0.75, 0.84], [-0.4, 0.88], [0, 0.91], [0.6, 0.955], [2.5, 0.955], [3.4, 0.955], [3.9, 0.93], [3.97, 0.88]],
      deck: [[-0.83, 0.81], [-0.78, 0.84], [-0.5, 0.88], [0, 0.93], [0.6, 0.965], [2.92, 0.975], [3.5, 0.97], [3.9, 0.945], [3.97, 0.91]],
      deckCrown: [[-0.83, 0.025], [3.97, 0.02]],
      frame: 'black', rail: 'black', mirror: 'black', handle: 'black', wheel: 'steel',
      bumper: { ends: 'plastic', m: 'black', y: 0.5, yr: 0.5, h: 0.2, f: -0.845, fw: -0.5, r: 3.975, rw: 3.65, xh: 0.89, rc: 0.18, strip: [0.06, 'chrome'] },
      plates: [0.44, 0.69], plateZ: [-0.873, 3.977],
      moldings: [{ y: 0.47, h: 0.035, m: 'black', a0: 0.42, a1: 2.38 }],
      face(k) {
        k.panel(-0.4, 0.6, 0.4, 0.755, 'grille', 0.004);
        k.slats(-0.39, 0.61, 0.39, 0.745, 4, 'black', 0.004, 0.012);
        k.frame(-0.41, 0.59, 0.41, 0.765, 0.012, 'chrome', 0.004, 0.016);
        k.block(-0.035, 0.655, 0.035, 0.705, 0.016, 0.024, 'chrome');
        k.both(s => {
          k.rect(s * 0.6, 0.68, 0.39, 0.155, 'black', 0.004);
          k.lamp(s * 0.565, 0.68, { w: 0.27, h: 0.13 }, k.LK.HEAD, 0.008);
          k.lamp(s * 0.745, 0.68, { w: 0.075, h: 0.13 }, k.ind(s), 0.008);
        });
      },
      tail(k) {
        k.both(s => {
          k.rect(s * 0.66, 0.79, 0.36, 0.14, 'black', 0.003);
          k.lamp(s * 0.785, 0.79, { w: 0.1, h: 0.12 }, k.ind(s), 0.008);
          k.lamp(s * 0.645, 0.79, { w: 0.17, h: 0.12 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.52, 0.79, { w: 0.07, h: 0.12 }, k.LK.REV, 0.008);
        });
      }
    }),
    volga3102: volga({
      front: -0.86, rear: 4.0, track: [1.496, 1.446], tyre: [0.324, 0.205],
      wide: [[-0.86, 0.85], [-0.84, 0.89], [-0.76, 0.905], [-0.5, 0.91], [3.6, 0.91], [3.94, 0.9], [4.0, 0.87]],
      belt: [[-0.86, 0.84], [-0.78, 0.88], [-0.3, 0.91], [0.6, 0.955], [2.5, 0.955], [3.5, 0.95], [3.94, 0.93], [4.0, 0.89]],
      deck: [[-0.86, 0.86], [-0.8, 0.9], [-0.4, 0.93], [0.6, 0.965], [2.92, 0.97], [3.5, 0.965], [3.94, 0.94], [4.0, 0.91]],
      deckCrown: [[-0.86, 0.02], [4.0, 0.02]],
      frame: 'chrome', rail: 'chrome', mirror: 'black', handle: 'chrome', wheel: 'cap2',
      bumper: { ends: 'plastic', m: 'black', y: 0.5, yr: 0.5, h: 0.18, f: -0.89, fw: -0.55, r: 4.01, rw: 3.7, xh: 0.9, rc: 0.12, strip: [0.055, 'chrome'] },
      plates: [0.42, 0.62], plateZ: [-0.918, 4.007],
      moldings: [{ y: 0.55, h: 0.04, m: 'black', a0: -0.45, a1: 3.3 }],
      face(k) {
        k.panel(-0.42, 0.6, 0.42, 0.76, 'grille', 0.004);
        k.vslats(-0.41, 0.61, 0.41, 0.75, 14, 'chrome', 0.004, 0.014, 0.35);
        k.frame(-0.43, 0.59, 0.43, 0.77, 0.014, 'chrome', 0.004, 0.018);
        k.both(s => {
          k.rect(s * 0.585, 0.68, 0.25, 0.165, 'chrome', 0.004);
          k.lamp(s * 0.585, 0.68, { w: 0.22, h: 0.14 }, k.LK.HEAD, 0.008);
          k.lamp(s * 0.79, 0.665, { w: 0.09, h: 0.12 }, k.ind(s), 0.008);
        });
      },
      tail(k) {
        k.panel(-0.36, 0.71, 0.36, 0.83, 'grille', 0.003);
        k.both(s => {
          k.rect(s * 0.6, 0.77, 0.5, 0.13, 'chrome', 0.003);
          k.lamp(s * 0.79, 0.77, { w: 0.1, h: 0.11 }, k.ind(s), 0.008);
          k.lamp(s * 0.6, 0.77, { w: 0.26, h: 0.11 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.42, 0.77, { w: 0.09, h: 0.11 }, k.LK.REV, 0.008);
        });
        k.slats(-0.85, 0.72, 0.85, 0.82, 3, 'chrome', 0.009, 0.012);
      }
    }),
    uaz469: body({
      front: -0.56, rear: 3.19, wb: 2.38, track: [1.442, 1.442], tyre: [0.384, 0.215],
      arches: [{ a: 0, yc: 0.42, r: 0.47 }, { a: 2.38, yc: 0.42, r: 0.47 }],
      rocker: 0.06, shoulder: 0.03, round: 0.02, sillW: 0.03, railIn: 0.03, railOut: 0.01, railH: 0.06, tumble: 0.03, railRef: 1.95, roofCrown: 0.04, midF: 0.7,
      wide: [[-0.56, 0.86], [-0.54, 0.885], [-0.5, 0.8925], [3.15, 0.8925], [3.19, 0.87]],
      sill: [[-0.56, 0.62], [-0.45, 0.6], [0.47, 0.6], [1.9, 0.6], [2.85, 0.62], [3.19, 0.66]],
      crease: [[-0.56, 0.95], [3.19, 0.95]],
      belt: [[-0.56, 1.1], [0.38, 1.15], [0.43, 1.29], [3.19, 1.3]],
      deck: [[-0.56, 1.12], [-0.5, 1.14], [0.42, 1.2], [3.08, 1.3], [3.19, 1.3]],
      deckCrown: [[-0.56, 0.01], [3.19, 0.01]],
      roof: [[0.6, 1.88], [0.66, 1.98], [0.8, 2.03], [1.2, 2.05], [3.08, 2.05], [3.14, 2.0]],
      ws: [0.45, 0.02, 0.6, 0.0], bw: [3.13, 0, 3.185, 0],
      wsF: 0.94, bwF: 0.45, roofM: 'canvas', rail: 'canvas', bwFrame: 'canvas', wsFrame: 'paint',
      door: [0.45, 1.25], doorWin: 1.22, rearDoorEnd: 2.12,
      win: [[0.5, 1.18, 'glass'], [1.18, 1.3, 'pillar'], [1.3, 2.05, 'glass'], [2.05, 2.12, 'pillar'], [2.12, 3.13, 'canvas']],
      winA: 0.45, winB: 3.13,
      handles: [[1.15, 1.18], [2.0, 1.18]], rearSeat: 2.1,
      frame: 'paint', pillar: 'paint', rail: 'canvas', rockerM: 'paint', mirror: 'round', wheel: 'steel', rim: 'rimdark', handle: 'chrome',
      bumper: { ends: 'bar', m: 'black', y: 0.56, h: 0.12, f: -0.62, d: 0.07, xh: 0.9, r: 3.25, yr: 0.58, hr: 0.1, xhr: 0.85 },
      plates: [0.56, 0.56], plateZ: [-0.626, 3.256],
      stripe: [0.98, 1.06], textY: 1.16, beaconA: 1.6,
      extra(pk, lod) { if (lod < 2) pk.wheel(3.19 + 0.11, 1.0, 0, Math.PI / 2); },
      face(k) {
        k.panel(-0.36, 0.72, 0.36, 1.06, 'grille', 0.004);
        k.vslats(-0.355, 0.725, 0.355, 1.055, 9, 'paint', 0.004, 0.014, 0.55);
        k.both(s => {
          k.ring(s * 0.62, 0.9, 0.105, 'chrome', 0.012);
          k.lamp(s * 0.62, 0.9, { r: 0.089 }, k.LK.HEAD, 0.016);
          k.lamp(s * 0.62, 1.05, { w: 0.07, h: 0.04 }, k.ind(s), 0.01);
        });
      },
      tail(k) {
        k.both(s => {
          k.rect(s * 0.78, 0.93, 0.11, 0.32, 'black', 0.003);
          k.lamp(s * 0.78, 1.04, { w: 0.08, h: 0.08 }, k.ind(s), 0.008);
          k.lamp(s * 0.78, 0.93, { w: 0.08, h: 0.11 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.78, 0.82, { w: 0.08, h: 0.07 }, k.LK.REV, 0.008);
        });
      }
    }),
    uaz452: body({
      front: -0.85, rear: 3.29, wb: 2.3, track: [1.453, 1.442], tyre: [0.372, 0.225],
      arches: [{ a: 0, yc: 0.4, r: 0.46 }, { a: 2.3, yc: 0.4, r: 0.46 }],
      rocker: 0.06, shoulder: 0.04, round: 0.05, sillW: 0.03, railIn: 0.12, railOut: 0.03, railH: 0.16, tumble: 0.06, railRef: 1.9, roofCrown: 0.05, midF: 0.6,
      wide: [[-0.85, 0.74], [-0.84, 0.82], [-0.8, 0.9], [-0.72, 0.95], [-0.6, 0.97], [3.2, 0.97], [3.26, 0.95], [3.29, 0.91]],
      sill: [[-0.85, 0.55], [-0.6, 0.47], [-0.4, 0.45], [2.8, 0.45], [3.29, 0.5]],
      crease: [[-0.85, 0.86], [3.29, 0.86]],
      belt: [[-0.85, 1.12], [-0.81, 1.26], [-0.74, 1.35], [-0.6, 1.38], [3.29, 1.4]],
      deck: [[-0.85, 1.15], [-0.83, 1.25], [-0.79, 1.33], [-0.75, 1.37], [-0.6, 1.4], [3.29, 1.42]],
      deckCrown: [[-0.85, 0.06], [-0.75, 0.04], [3.29, 0.01]],
      roof: [[-0.68, 1.86], [-0.58, 1.97], [-0.38, 2.03], [3.0, 2.03], [3.2, 1.98]],
      ws: [-0.76, 0.06, -0.68, 0.04], bw: [3.22, 0, 3.285, 0],
      wsF: 0.9, bwF: 0.78, wsBar: 0.05, bwBar: 0.28, wsFrame: 'paint', bwFrame: 'paint',
      door: [-0.65, 0.29], doorWin: 0.22, rearDoorEnd: null, doorS0: 2,
      seamsA: [[0.95, -0.004, 2, 5], [1.85, 0.004, 2, 5]],
      win: [[-0.45, 0.22, 'glass'], [0.22, 0.37, 'pillar'], [0.37, 0.78, 'glass'], [0.78, 0.94, 'pillar'], [0.94, 1.72, 'glass'], [1.72, 1.88, 'pillar'], [1.88, 2.74, 'glass'], [2.74, 2.85, 'pillar'], [2.85, 3.17, 'glass']],
      winA: -0.5, winB: 3.2,
      handles: [[0.2, 1.22], [1.0, 1.2]], rearSeat: null, rows: [{ a: 1.0, x: [0], w: 1.1 }, { a: 2.2, x: [0], w: 1.1 }], floor: 0.62, floorTo: 3.2, shelf: false,
      frame: 'black', pillar: 'paint', rail: 'paint', rockerM: 'paint', mirror: { a: -0.55, y: 1.42, out: 0.12, h: 0.2, fwd: 0.05 }, wheel: 'steel', rim: 'rimdark', handle: 'chrome',
      bumper: { ends: 'bar', m: 'black', y: 0.55, h: 0.12, f: -0.95, d: 0.1, xh: 0.95, r: 3.41, yr: 0.55, hr: 0.1, xhr: 0.95 },
      plates: [0.55, 0.62], plateZ: [-0.956, 3.296],
      stripe: [0.92, 1.0], textA: 1.33, textY: 1.18, textW: 1.1, crossA: 2.3, crossY: 1.15, beaconA: -0.3,
      face(k) {
        k.panel(-0.3, 0.8, 0.3, 1.08, 'grille', 0.004);
        k.vslats(-0.29, 0.81, 0.29, 1.07, 7, 'paint', 0.004, 0.014, 0.5);
        k.both(s => {
          k.ring(s * 0.58, 0.93, 0.105, 'chrome', 0.012);
          k.lamp(s * 0.58, 0.93, { r: 0.089 }, k.LK.HEAD, 0.016);
          k.lamp(s * 0.58, 1.08, { w: 0.07, h: 0.045 }, k.ind(s), 0.01);
        });
      },
      tail(k) {
        k.line(0, 0.52, 0, 1.95, 0.012, 'seam', 0.002);
        k.both(s => {
          k.rect(s * 0.8, 0.74, 0.12, 0.34, 'black', 0.003);
          k.lamp(s * 0.8, 0.86, { w: 0.09, h: 0.08 }, k.ind(s), 0.008);
          k.lamp(s * 0.8, 0.745, { w: 0.09, h: 0.11 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.8, 0.63, { w: 0.09, h: 0.07 }, k.LK.REV, 0.008);
        });
      }
    }),
    gazel: body({
      front: -0.99, rear: 4.4, wb: 2.9, track: [1.7, 1.56], tyre: [0.342, 0.185],
      arches: [{ a: 0, yc: 0.37, r: 0.43 }, { a: 2.9, yc: 0.37, r: 0.43 }],
      rocker: 0.06, shoulder: 0.04, round: 0.04, sillW: 0.03, railIn: 0.1, railOut: 0.04, railH: 0.25, tumble: 0.1, railRef: 2.1, roofCrown: 0.05, midF: 0.6,
      wide: [[-0.99, 0.9], [-0.95, 0.97], [-0.8, 1.02], [-0.4, 1.0375], [4.3, 1.0375], [4.37, 1.02], [4.4, 0.98]],
      sill: [[-0.99, 0.4], [-0.7, 0.42], [2.5, 0.42], [3.4, 0.45], [4.4, 0.52]],
      crease: [[-0.99, 0.7], [4.4, 0.75]],
      belt: [[-0.99, 0.86], [-0.8, 0.93], [-0.5, 1.03], [-0.2, 1.1], [0.42, 1.13], [1.4, 1.18], [4.4, 1.2]],
      deck: [[-0.99, 0.88], [-0.95, 0.92], [-0.8, 0.99], [-0.55, 1.07], [-0.3, 1.14], [-0.2, 1.16], [4.4, 1.22]],
      deckCrown: [[-0.99, 0.05], [-0.3, 0.03], [4.4, 0.01]],
      roof: [[0.42, 1.96], [0.62, 2.12], [0.95, 2.18], [4.2, 2.2], [4.35, 2.15]],
      ws: [-0.3, 0.14, 0.45, 0.05], bw: [4.34, 0, 4.395, 0],
      bwF: 0.8, bwBar: 0.2, bwFrame: 'paint',
      door: [0.42, 1.32], doorWin: 1.3, rearDoorEnd: null,
      seamsA: [[1.45, -0.004, 1, 5], [2.4, 0.004, 1, 5]],
      win: [[-0.16, 0.42, 'diagA'], [0.42, 1.28, 'glass'], [1.28, 1.45, 'pillar'], [1.45, 2.12, 'glass'], [2.12, 2.26, 'pillar'], [2.26, 2.96, 'glass'], [2.96, 3.1, 'pillar'], [3.1, 3.8, 'glass'], [3.8, 3.95, 'pillar'], [3.95, 4.3, 'glass']],
      winA: -0.15, winB: 4.32,
      handles: [[1.22, 1.02], [1.55, 1.0]], rearSeat: null, rows: [{ a: 1.6, x: [-0.36, 0.36], w: 0.6 }, { a: 2.45, x: [-0.36, 0.36], w: 0.6 }, { a: 3.3, x: [-0.36, 0.36], w: 0.6 }, { a: 4.05, x: [0], w: 1.3 }], floor: 0.55, floorTo: 4.25, shelf: false,
      frame: 'black', pillar: 'paint', rail: 'paint', rockerM: 'black', mirror: { a: 0.5, y: 1.3, out: 0.16, h: 0.24, fwd: 0.05 }, wheel: 'steel', handle: 'black',
      bumper: { ends: 'plastic', m: 'black', y: 0.5, yr: 0.52, h: 0.24, f: -1.018, fw: -0.7, r: 4.408, rw: 4.1, xh: 1.0, rc: 0.18 },
      plates: [0.46, 0.66], plateZ: [-1.046, 4.405],
      stripe: [0.8, 0.88], textA: 2.6, textY: 0.95, textW: 1.2, beaconA: 1.0,
      face(k) {
        k.panel(-0.42, 0.66, 0.42, 0.86, 'grille', 0.004);
        k.slats(-0.41, 0.67, 0.41, 0.85, 4, 'black', 0.004, 0.012);
        k.block(-0.04, 0.73, 0.04, 0.79, 0.012, 0.02, 'chrome');
        k.both(s => {
          k.rect(s * 0.66, 0.77, 0.4, 0.17, 'black', 0.004);
          k.lamp(s * 0.62, 0.77, { w: 0.28, h: 0.14 }, k.LK.HEAD, 0.008);
          k.lamp(s * 0.81, 0.77, { w: 0.08, h: 0.14 }, k.ind(s), 0.008);
        });
      },
      tail(k) {
        k.line(0, 0.58, 0, 2.08, 0.012, 'seam', 0.002);
        k.both(s => {
          k.rect(s * 0.88, 0.78, 0.12, 0.36, 'black', 0.003);
          k.lamp(s * 0.88, 0.9, { w: 0.09, h: 0.09 }, k.ind(s), 0.008);
          k.lamp(s * 0.88, 0.78, { w: 0.09, h: 0.11 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.88, 0.66, { w: 0.09, h: 0.08 }, k.LK.REV, 0.008);
        });
      }
    }),
    gaz53: body({
      front: -0.95, rear: 1.42, wb: 3.7, track: [1.63, 1.69], tyre: [0.465, 0.24], dual: 0.27,
      arches: [],
      rocker: 0.05, shoulder: 0.04, round: 0.04, sillW: 0.03, railIn: 0.05, railOut: 0.02, railH: 0.08, tumble: 0.04, railRef: 2.0, roofCrown: 0.06, midF: 0.6,
      wide: [[-0.95, 0.46], [-0.9, 0.5], [0.34, 0.5], [0.42, 0.98], [0.5, 1.0], [1.42, 1.0]],
      sill: [[-0.95, 0.75], [-0.88, 0.92], [-0.6, 0.98], [0.34, 0.98], [0.45, 0.95], [1.42, 0.95]],
      crease: [[-0.95, 1.15], [1.42, 1.25]],
      belt: [[-0.95, 1.4], [0.3, 1.5], [0.36, 1.5], [0.42, 1.62], [1.42, 1.62]],
      deck: [[-0.95, 1.42], [-0.88, 1.46], [0.0, 1.52], [0.36, 1.55], [0.46, 1.64], [1.42, 1.64]],
      deckCrown: [[-0.95, 0.06], [0.36, 0.08], [0.46, 0.02], [1.42, 0.02]],
      roof: [[0.62, 2.12], [0.7, 2.19], [0.9, 2.22], [1.3, 2.22], [1.4, 2.18]],
      ws: [0.48, 0.03, 0.62, 0.0], bw: [1.4, 0, 1.415, 0],
      wsF: 0.94, wsBar: 0.06, wsFrame: 'paint', bwF: 0.4, bwFrame: 'paint',
      door: [0.5, 1.35], doorWin: 1.3, rearDoorEnd: null,
      win: [[0.55, 1.3, 'glass']], winA: 0.5, winB: 1.38,
      handles: [[1.25, 1.55]], rearSeat: null, floor: 0.95, floorTo: 1.4, shelf: false,
      frame: 'paint', pillar: 'paint', rail: 'paint', rockerM: 'paint', mirror: { a: 0.55, y: 1.85, out: 0.22, h: 0.28, fwd: 0.04 }, wheel: 'truck', rim: 'rimgrey', handle: 'chrome',
      bumper: { ends: 'bar', m: 'black', y: 0.62, h: 0.16, f: -1.105, d: 0.1, xh: 1.1, r: 5.29, yr: 0.86, hr: 0.12, xhr: 1.0 },
      tailA: 5.29,
      plates: [0.62, 0.86], plateZ: [-1.111, 5.296],
      stripe: [1.2, 1.3], textY: 1.4, beaconA: 1.0,
      extra: truckParts,
      face(k) {
        k.panel(-0.38, 0.8, 0.38, 1.36, 'grille', 0.004);
        k.vslats(-0.37, 0.81, 0.37, 1.35, 8, 'paint', 0.004, 0.018, 0.55);
        k.block(-0.08, 1.3, 0.08, 1.34, 0.018, 0.026, 'chrome');
        k.both(s => {
          k.ring(s * 0.75, 0.86, 0.105, 'chrome', -0.1);
          k.lamp(s * 0.75, 0.86, { r: 0.089 }, k.LK.HEAD, -0.096);
          k.lamp(s * 0.75, 1.0, { w: 0.07, h: 0.05 }, k.ind(s), -0.14);
        });
      },
      tail(k) {
        k.both(s => {
          k.lamp(s * 0.82, 0.86, { w: 0.09, h: 0.08 }, k.ind(s), 0.005);
          k.lamp(s * 0.7, 0.86, { w: 0.12, h: 0.08 }, k.LK.TAIL, 0.005);
          k.lamp(s * 0.58, 0.86, { w: 0.07, h: 0.08 }, k.LK.REV, 0.005);
        });
      }
    }),
    ural4320: body({
      front: -1.08, rear: 1.62, wb: 4.225, track: [2.0, 2.0], tyre: [0.57, 0.4], tandem: 1.4,
      arches: [],
      rocker: 0.05, shoulder: 0.04, round: 0.05, sillW: 0.03, railIn: 0.05, railOut: 0.02, railH: 0.08, tumble: 0.04, railRef: 2.6, roofCrown: 0.06, midF: 0.6,
      wide: [[-1.08, 0.56], [-1.02, 0.62], [0.1, 0.62], [0.18, 1.14], [0.26, 1.18], [1.62, 1.18]],
      sill: [[-1.08, 0.92], [-0.95, 1.0], [0.1, 1.02], [0.2, 1.22], [1.62, 1.22]],
      crease: [[-1.08, 1.32], [1.62, 1.5]],
      belt: [[-1.08, 1.66], [0.06, 1.74], [0.12, 1.74], [0.2, 2.02], [1.62, 2.02]],
      deck: [[-1.08, 1.68], [-1.0, 1.73], [-0.2, 1.78], [0.12, 1.79], [0.22, 2.04], [1.62, 2.04]],
      deckCrown: [[-1.08, 0.04], [0.12, 0.05], [0.22, 0.02], [1.62, 0.02]],
      roof: [[0.48, 2.76], [0.56, 2.835], [0.78, 2.87], [1.4, 2.87], [1.58, 2.82]],
      ws: [0.31, 0.03, 0.5, 0.0], bw: [1.58, 0, 1.6, 0],
      wsF: 0.94, wsBar: 0.07, wsFrame: 'paint', bwF: 0.4, bwFrame: 'paint',
      door: [0.34, 1.5], doorWin: 1.44, rearDoorEnd: null,
      win: [[0.4, 1.44, 'glass']], winA: 0.34, winB: 1.56,
      handles: [[1.38, 1.95]], rearSeat: null, floor: 1.22, floorTo: 1.56, shelf: false,
      frame: 'paint', pillar: 'paint', rail: 'paint', rockerM: 'paint', mirror: { a: 0.36, y: 2.3, out: 0.24, h: 0.36, fwd: 0.05 }, wheel: 'truck', rim: 'rimdark', handle: 'black',
      bumper: { ends: 'bar', m: 'paint', y: 0.9, h: 0.26, f: -1.35, d: 0.16, xh: 1.24, r: 6.02, yr: 1.0, hr: 0.14, xhr: 1.12 },
      tailA: 6.02,
      plates: [0.9, 1.2], plateZ: [-1.356, 6.03],
      stripe: [1.5, 1.6], textY: 1.7, beaconA: 1.0,
      extra: uralParts,
      face(k) {
        k.panel(-0.5, 0.98, 0.5, 1.66, 'grille', 0.004);
        k.vslats(-0.49, 0.99, 0.49, 1.65, 8, 'paint', 0.004, 0.03, 0.5);
        k.block(-0.52, 1.6, 0.52, 1.67, 0.004, 0.03, 'paint');
        k.both(s => {
          k.ring(s * 0.94, 1.2, 0.12, 'black', -0.032);
          k.lamp(s * 0.94, 1.2, { r: 0.1 }, k.LK.HEAD, -0.03);
          k.lamp(s * 1.12, 1.4, { w: 0.07, h: 0.05 }, k.ind(s), -0.04);
        });
      },
      tail(k) {
        k.both(s => {
          k.lamp(s * 1.0, 1.21, { w: 0.08, h: 0.08 }, k.ind(s), 0.004);
          k.lamp(s * 0.87, 1.21, { w: 0.12, h: 0.08 }, k.LK.TAIL, 0.004);
          k.lamp(s * 0.75, 1.21, { w: 0.07, h: 0.08 }, k.LK.REV, 0.004);
        });
      }
    }),
    paz: body({
      front: -1.25, rear: 5.62, wb: 3.6, track: [1.94, 1.69], tyre: [0.465, 0.24], dual: 0.27,
      arches: [{ a: 0, yc: 0.47, r: 0.56 }, { a: 3.6, yc: 0.47, r: 0.56 }],
      rocker: 0.06, shoulder: 0.05, round: 0.04, sillW: 0.03, railIn: 0.1, railOut: 0.03, railH: 0.14, tumble: 0.05, railRef: 2.6, roofCrown: 0.1, midF: 0.65,
      wide: [[-1.25, 1.13], [-1.22, 1.2], [-1.12, 1.245], [-0.9, 1.25], [5.45, 1.25], [5.58, 1.22], [5.62, 1.17]],
      sill: [[-1.25, 0.48], [-0.7, 0.44], [5.0, 0.44], [5.62, 0.5]],
      crease: [[-1.25, 0.92], [5.62, 0.92]],
      belt: [[-1.25, 1.28], [-1.05, 1.5], [-0.85, 1.55], [5.62, 1.57]],
      deck: [[-1.25, 1.3], [-1.2, 1.34], [5.58, 1.58], [5.62, 1.6]],
      deckCrown: [[-1.25, 0.02], [5.62, 0.02]],
      roof: [[-1.0, 2.6], [-0.88, 2.72], [-0.6, 2.78], [5.3, 2.78], [5.5, 2.74], [5.58, 2.7]],
      ws: [-1.22, 0.05, -0.98, 0.03], bw: [5.57, 0, 5.615, 0],
      wsBar: 0.07, wsFrame: 'black', bwF: 0.85, bwFrame: 'paint',
      door: [-0.83, 0.05], doorWin: 0.05, rearDoorEnd: null, doorS0: 2,
      seamsA: [[4.65, -0.004, 1, 5], [5.42, 0.004, 1, 5]],
      win: [[-0.8, -0.06, 'glass'], [-0.06, 0.08, 'pillar'], [0.08, 1.05, 'glass'], [1.05, 1.16, 'pillar'], [1.16, 2.13, 'glass'], [2.13, 2.24, 'pillar'], [2.24, 3.21, 'glass'], [3.21, 3.32, 'pillar'], [3.32, 4.29, 'glass'], [4.29, 4.4, 'pillar'], [4.4, 5.38, 'glass']],
      winA: -0.9, winB: 5.5,
      handles: [[-0.12, 1.3]], rearSeat: null, floor: 0.85, floorTo: 5.4, shelf: false,
      rows: [0.4, 1.2, 2.0, 2.8, 3.6, 4.4].map(a => ({ a, x: [-0.72, 0.72], w: 0.86 })),
      frame: 'black', pillar: 'paint', rail: 'paint', rockerM: 'paint', mirror: { a: -1.12, y: 1.95, out: 0.17, h: 0.32, fwd: 0.1 }, mirrorBody: true, wheel: 'truck', rim: 'rimgrey', handle: 'chrome',
      moldings: [{ y: 0.93, h: 0.025, m: 'black', a0: -1.2, a1: 5.58 }],
      bumper: { ends: 'plastic', m: 'black', y: 0.6, yr: 0.62, h: 0.24, f: -1.248, fw: -0.95, r: 5.633, rw: 5.3, xh: 1.24, rc: 0.15 },
      plates: [0.6, 0.79], plateZ: [-1.276, 5.627],
      stripe: [1.2, 1.32], textA: 2.4, textY: 1.08, textW: 1.4, beaconA: -0.6,
      extra: pazParts,
      face(k) {
        k.panel(-1.15, 1.06, 1.15, 1.3, 'black', 0.004);
        k.panel(-0.55, 0.72, 0.55, 0.96, 'grille', 0.004);
        k.slats(-0.54, 0.73, 0.54, 0.95, 4, 'black', 0.004, 0.012);
        k.both(s => {
          k.rect(s * 0.84, 0.82, 0.5, 0.22, 'black', 0.004);
          k.lamp(s * 0.72, 0.82, { r: 0.085 }, k.LK.HEAD, 0.01);
          k.lamp(s * 0.95, 0.82, { r: 0.085 }, k.LK.HEAD, 0.01);
          k.lamp(s * 0.95, 1.0, { w: 0.12, h: 0.05 }, k.ind(s), 0.008);
        });
      },
      tail(k) {
        k.both(s => {
          k.rect(s * 1.0, 0.98, 0.14, 0.42, 'black', 0.003);
          k.lamp(s * 1.0, 1.13, { w: 0.11, h: 0.1 }, k.ind(s), 0.008);
          k.lamp(s * 1.0, 0.98, { w: 0.11, h: 0.13 }, k.LK.TAIL, 0.008);
          k.lamp(s * 1.0, 0.84, { w: 0.11, h: 0.09 }, k.LK.REV, 0.008);
        });
      }
    }),
    avtozak: body({
      front: -1.2, rear: 1.42, wb: 3.77, track: [1.63, 1.69], tyre: [0.47, 0.25], dual: 0.27,
      arches: [],
      rocker: 0.05, shoulder: 0.04, round: 0.03, sillW: 0.03, railIn: 0.05, railOut: 0.02, railH: 0.08, tumble: 0.03, railRef: 2.1, roofCrown: 0.05, midF: 0.6,
      wide: [[-1.2, 0.46], [-1.15, 0.5], [0.34, 0.5], [0.44, 1.06], [0.52, 1.08], [1.42, 1.08]],
      sill: [[-1.2, 0.72], [-1.12, 0.88], [-0.6, 0.95], [0.34, 0.97], [0.45, 0.96], [1.42, 0.96]],
      crease: [[-1.2, 1.12], [1.42, 1.25]],
      belt: [[-1.2, 1.32], [0.3, 1.5], [0.36, 1.5], [0.42, 1.66], [1.42, 1.66]],
      deck: [[-1.2, 1.34], [-1.12, 1.4], [-0.4, 1.47], [0.36, 1.55], [0.46, 1.66], [1.42, 1.66]],
      deckCrown: [[-1.2, 0.04], [0.36, 0.05], [0.46, 0.02], [1.42, 0.02]],
      roof: [[0.62, 2.3], [0.7, 2.36], [0.9, 2.38], [1.3, 2.38], [1.4, 2.34]],
      ws: [0.48, 0.03, 0.62, 0.0], bw: [1.4, 0, 1.415, 0],
      wsF: 0.94, wsFrame: 'paint', bwF: 0.4, bwFrame: 'paint',
      door: [0.5, 1.35], doorWin: 1.3, rearDoorEnd: null,
      win: [[0.55, 1.3, 'glass']], winA: 0.5, winB: 1.38,
      handles: [[1.25, 1.6]], rearSeat: null, floor: 0.98, floorTo: 1.4, shelf: false,
      frame: 'paint', pillar: 'paint', rail: 'paint', rockerM: 'paint', mirror: { a: 0.56, y: 1.95, out: 0.24, h: 0.3, fwd: 0.04 }, wheel: 'truck', rim: 'rimgrey', handle: 'chrome',
      bumper: { ends: 'bar', m: 'black', y: 0.6, h: 0.18, f: -1.215, d: 0.1, xh: 1.12, r: 5.44, yr: 0.86, hr: 0.12, xhr: 1.0 },
      tailA: 5.42,
      plates: [0.6, 0.86], plateZ: [-1.221, 5.45],
      stripe: [1.18, 1.27], textY: 1.4, beaconA: 0.95,
      extra: avtozakParts,
      face(k) {
        k.panel(-0.44, 0.84, 0.44, 1.3, 'grille', 0.004);
        k.slats(-0.43, 0.86, 0.43, 1.28, 7, 'black', 0.004, 0.016);
        k.both(s => {
          k.rect(s * 0.8, 0.9, 0.26, 0.24, 'black', -0.07);
          k.ring(s * 0.8, 0.9, 0.1, 'chrome', -0.072);
          k.lamp(s * 0.8, 0.9, { r: 0.085 }, k.LK.HEAD, -0.068);
          k.lamp(s * 0.8, 1.06, { w: 0.12, h: 0.05 }, k.ind(s), -0.075);
        });
      },
      tail(k) {
        k.both(s => {
          k.lamp(s * 0.95, 0.86, { w: 0.09, h: 0.08 }, k.ind(s), 0.005);
          k.lamp(s * 0.83, 0.86, { w: 0.12, h: 0.08 }, k.LK.TAIL, 0.005);
          k.lamp(s * 0.71, 0.86, { w: 0.07, h: 0.08 }, k.LK.REV, 0.005);
        });
      }
    }),
    m2141: body({
      front: -0.785, rear: 3.455, wb: 2.58, track: [1.44, 1.42], tyre: [0.31, 0.165],
      arches: [{ a: 0, yc: 0.31, r: 0.385 }, { a: 2.58, yc: 0.3, r: 0.385 }],
      tumble: 0.11, railRef: 1.36,
      wide: [[-0.785, 0.72], [-0.765, 0.77], [-0.71, 0.815], [-0.5, 0.84], [0, 0.845], [3.1, 0.845], [3.35, 0.83], [3.43, 0.8], [3.455, 0.76]],
      sill: [[-0.785, 0.28], [-0.6, 0.27], [0.43, 0.24], [2.15, 0.24], [2.97, 0.27], [3.455, 0.29]],
      crease: [[-0.785, 0.5], [3.455, 0.52]],
      belt: [[-0.785, 0.76], [-0.75, 0.785], [0, 0.865], [0.56, 0.93], [1.5, 0.94], [2.4, 0.955], [2.9, 0.965], [3.35, 0.955], [3.43, 0.935], [3.455, 0.905]],
      deck: [[-0.785, 0.78], [-0.75, 0.8], [-0.5, 0.84], [0, 0.9], [0.44, 0.96], [3.3, 1.0], [3.42, 0.985], [3.455, 0.96]],
      deckCrown: [[-0.785, 0.025], [3.455, 0.02]],
      roof: [[0.95, 1.36], [1.05, 1.39], [1.6, 1.4], [2.1, 1.395], [2.4, 1.37], [2.52, 1.345]],
      ws: [0.44, 0.12, 0.99, 0.04], bw: [2.48, 0.05, 3.3, 0.1],
      door: [0.48, 1.55], doorWin: 1.52, rearDoorEnd: 2.4,
      win: [[0.6, 1.52, 'glass'], [1.52, 1.61, 'pillar'], [1.61, 2.25, 'glass'], [2.25, 2.29, 'bar'], [2.29, 2.62, 'glass'], [2.62, 3.02, 'diag']],
      winA: 0.58, winB: 3.02,
      handles: [[1.41, 0.82], [2.29, 0.83]], rearSeat: 2.2,
      frame: 'black', pillar: 'black', rail: 'paint', rockerM: 'black', mirror: 'black', wheel: 'steel', handle: 'black',
      moldings: [{ y: 0.52, h: 0.05, m: 'black', a0: 0.43, a1: 2.15 }],
      bumper: { ends: 'plastic', m: 'black', y: 0.39, h: 0.2, f: -0.818, fw: -0.42, r: 3.488, rw: 2.99, xh: 0.855, rc: 0.15 },
      plates: [0.39, 0.77], plateZ: [-0.844, 3.462],
      face(k) {
        k.panel(-0.72, 0.52, 0.72, 0.73, 'grille', 0.004);
        k.slats(-0.29, 0.575, 0.29, 0.675, 3, 'black', 0.004, 0.012);
        k.both(s => {
          k.lamp(s * 0.47, 0.625, { w: 0.32, h: 0.13 }, k.LK.HEAD, 0.01);
          k.lamp(s * 0.675, 0.625, { w: 0.08, h: 0.13 }, k.ind(s), 0.01);
        });
      },
      tail(k) {
        k.panel(-0.74, 0.67, 0.74, 0.86, 'grille', 0.003);
        k.both(s => {
          k.lamp(s * 0.69, 0.765, { w: 0.09, h: 0.16 }, k.ind(s), 0.008);
          k.lamp(s * 0.545, 0.765, { w: 0.19, h: 0.16 }, k.LK.TAIL, 0.008);
          k.lamp(s * 0.4, 0.765, { w: 0.09, h: 0.16 }, k.LK.REV, 0.008);
        });
      }
    })
  };

  const CAB = {
    zhiguli: { dash: 'flat', gauges: 'round2', steer: 'twoPad', cover: 'leather', seats: [[110, 34, 30], [46, 44, 46], [92, 70, 52]], dashC: [30, 30, 32], head: [184, 178, 162], glow: [170, 240, 170], console: false, strip: null, bench: false, rests: true, rearRests: false, lean: 0.26, back: 0.58 },
    samara: { dash: 'high', gauges: 'rect', steer: 'samara', cover: 'fabric', seats: [[84, 88, 96], [70, 74, 86], [96, 92, 88]], dashC: [34, 35, 38], head: [176, 176, 172], glow: [170, 240, 170], console: true, strip: null, bench: false, rests: true, rearRests: false, lean: 0.26, back: 0.56 },
    modern: { dash: 'soft', gauges: 'round2', steer: 'four', cover: 'fabric', seats: [[90, 92, 96], [70, 72, 78]], dashC: [52, 54, 58], head: [180, 180, 176], glow: [140, 220, 255], console: true, strip: null, bench: false, rests: true, rearRests: false, lean: 0.26, back: 0.6 },
    utility: { dash: 'metal', gauges: 'round4', steer: 'three', cover: 'leather', seats: [[44, 44, 46], [58, 52, 44]], dashC: 'paint', head: [150, 150, 140], glow: [170, 240, 170], console: false, strip: null, bench: false, rests: false, rearRests: false, lean: 0.18, back: 0.56 },
    lux: { dash: 'soft', gauges: 'round3', steer: 'airbag', cover: 'leather', seats: [[196, 178, 146], [64, 64, 66], [150, 150, 148]], dashC: [44, 44, 46], head: [200, 194, 180], glow: [255, 170, 80], console: true, strip: 'wood', bench: false, rests: true, rearRests: true, lean: 0.26, back: 0.62 }
  };
  const cabIn = (k, o) => Object.assign({}, CAB[k], o);
  const INSIDE = {
    vaz2101: cabIn('zhiguli', { gauges: 'ribbon', steer: 'two', strip: 'chrome', rests: false }),
    vaz2106: cabIn('zhiguli', { gauges: 'round4', strip: 'wood', cover: 'fabric', seats: [[104, 40, 34], [70, 52, 40], [52, 54, 64]] }),
    vaz2107: cabIn('zhiguli', { gauges: 'rect', cover: 'fabric', seats: [[52, 50, 54], [84, 46, 40], [64, 70, 84]] }),
    vaz2109: cabIn('samara'),
    vaz21099: cabIn('samara'),
    vaz2110: cabIn('modern', { steer: 'samara', glow: [170, 240, 170] }),
    niva: cabIn('zhiguli', { gauges: 'round3', seats: [[44, 44, 46], [60, 56, 52]], console: true }),
    oka: cabIn('samara', { dash: 'flat', console: false, seats: [[80, 84, 92], [96, 60, 54]] }),
    zaz968: cabIn('zhiguli', { gauges: 'rect', steer: 'two', rests: false, seats: [[118, 84, 56], [104, 36, 30], [176, 160, 128]] }),
    m412: cabIn('zhiguli', { steer: 'ring', strip: 'chrome', rests: false, seats: [[120, 30, 30], [48, 46, 48], [100, 72, 50]] }),
    m2141: cabIn('samara', { seats: [[72, 74, 80], [88, 76, 70]] }),
    volga24: cabIn('zhiguli', { gauges: 'ribbon', steer: 'ring', strip: 'chrome', rests: false, seats: [[132, 40, 40], [176, 164, 140], [90, 92, 96]] }),
    volga3110: cabIn('modern', { glow: [170, 240, 170] }),
    volga3102: cabIn('modern', { cover: 'leather', seats: [[40, 40, 42], [84, 30, 34], [110, 104, 96]], dashC: [40, 36, 36], strip: 'wood' }),
    uaz469: cabIn('utility'),
    uaz452: cabIn('utility'),
    gazel: cabIn('modern', { dashC: [70, 72, 76], seats: [[70, 72, 78]], glow: [170, 240, 170] }),
    gaz53: cabIn('utility', { bench: true, lean: 0.08 }),
    ural4320: cabIn('utility', { bench: true, lean: 0.08, dashC: [40, 44, 36] }),
    paz: cabIn('utility', { steer: 'bus', seats: [[44, 60, 110]], dashC: [36, 36, 38] }),
    avtozak: cabIn('utility', { steer: 'bus', bench: true, lean: 0.08, dashC: [40, 42, 44] }),
    bmw525: cabIn('lux', { gauges: 'round4', seats: [[64, 64, 66], [176, 160, 132], [96, 98, 102]], glow: [255, 110, 40] }),
    merc600: cabIn('lux'),
    audi80: cabIn('modern', { gauges: 'rect', glow: [255, 60, 40], seats: [[84, 86, 92], [60, 62, 66]] }),
    lc80: cabIn('modern', { rearRests: true, seats: [[110, 108, 100], [84, 86, 90]], glow: [120, 220, 255] })
  };

  function resolve(spec) {
    const d = MODELS[spec.id];
    if (d.res) return d.res;
    const s = spec.shape;
    const M = Object.assign({}, d, { L: s.L, W: s.W, H: s.H, ax: s.ax, door: s.door, zOff: s.ax - s.L / 2 });
    for (const k of ['wide', 'sill', 'crease', 'belt', 'deck', 'roof', 'deckCrown']) M[k] = mono(d[k]);
    M.axZ = [M.zOff, M.wb + M.zOff];
    M.floorY = M.floor !== null ? M.floor : M.sill(M.wb / 2);
    M.tailA = M.tailA !== null ? M.tailA : M.rear;
    M.inside = INSIDE[spec.id];
    d.res = M;
    return M;
  }

  function archY(M, a) {
    let y = -1;
    for (const r of M.arches) {
      const d = a - r.a;
      if (Math.abs(d) <= r.r) y = Math.max(y, r.yc + Math.sqrt(r.r * r.r - d * d));
    }
    return y;
  }

  function gTop(M, a, f) {
    const f2 = f * f, ws = M.ws, bw = M.bw;
    const wsB = ws[0] + ws[1] * f2, wsT = ws[2] + ws[3] * f2, bwT = bw[0] - bw[1] * f2, bwB = bw[2] - bw[3] * f2;
    const dc = M.deckCrown(a) * f2, rc = M.roofCrown * f2;
    if (a <= wsB) return M.deck(a) - dc;
    if (a < wsT) return lerp(M.deck(wsB) - M.deckCrown(wsB) * f2, M.roof(wsT) - rc, (a - wsB) / (wsT - wsB));
    if (a <= bwT) return M.roof(a) - rc;
    if (a < bwB) return lerp(M.roof(bwT) - rc, M.deck(bwB) - M.deckCrown(bwB) * f2, (a - bwT) / (bwB - bwT));
    return M.deck(a) - dc;
  }

  function section(M, a) {
    const w = M.wide(a), belt = M.belt(a), ay = archY(M, a);
    const ys = [M.sill(a), M.sill(a) + M.rocker, M.crease(a), belt - M.shoulder, belt];
    for (let i = 0; i < 4; i++) if (ys[i] < ay) ys[i] = ay;
    for (let i = 1; i < 5; i++) if (ys[i] < ys[i - 1]) ys[i] = ys[i - 1];
    const x4 = w - M.round, x5 = x4 - M.sillW;
    const e = gTop(M, a, 1);
    const rise = clamp((e - belt) / Math.max(0.05, M.railRef - belt), 0, 1);
    const x7 = x5 - M.railIn - M.tumble * rise;
    const y5 = Math.max(ys[4] - 0.03, Math.min(belt + 0.005, gTop(M, a, x5 / x7)));
    const y7 = Math.max(y5, e);
    const y6 = Math.max(y5, y7 - M.railH);
    return [[w - 0.045, ys[0]], [w - 0.03, ys[1]], [w, ys[2]], [w - 0.004, ys[3]], [x4, ys[4]], [x5, y5], [x7 + M.railOut, y6], [x7, y7], [x7 * M.midF, Math.max(y5, gTop(M, a, M.midF))], [0, Math.max(y5, gTop(M, a, 0))]];
  }

  const CORE = 1, ARCH = 2, WIN = 4, SCREEN = 8;
  const stripMask = i0 => (i0 <= 2 ? CORE | ARCH : i0 === 3 ? CORE : i0 <= 6 ? CORE | WIN | SCREEN : CORE | SCREEN);

  function stations(M, lod) {
    const pts = [];
    const key = (a, m) => pts.push([a, 1, m]), fill = a => pts.push([a, 0, CORE]);
    key(M.front, CORE);
    key(M.rear, CORE);
    if (lod === 0) { fill(M.front + 0.012); fill(M.front + 0.04); fill(M.rear - 0.012); fill(M.rear - 0.04); }
    if (lod === 1) { fill(M.front + 0.04); fill(M.rear - 0.04); }
    for (const f of lod === 0 ? [0, 0.5, 1] : lod === 1 ? [0, 1] : [0]) {
      const f2 = f * f;
      for (const a of [M.ws[0] + M.ws[1] * f2, M.ws[2] + M.ws[3] * f2, M.bw[0] - M.bw[1] * f2, M.bw[2] - M.bw[3] * f2]) key(a, SCREEN);
    }
    key(M.door[0], CORE); key(M.door[1], CORE);
    if (lod === 0) {
      key(M.doorWin, CORE);
      if (M.rearDoorEnd) key(M.rearDoorEnd, CORE);
      for (const w of M.win) { key(w[0], WIN); key(w[1], WIN); }
    } else if (lod === 1) {
      let prev = null;
      for (const w of M.win) {
        const t = w[2] === 'bar' ? 'glass' : w[2] === 'frame' ? 'pillar' : w[2];
        if (t !== prev) key(w[0], WIN);
        prev = t;
      }
      key(M.win[M.win.length - 1][1], WIN);
    }
    const na = [9, 4, 2][lod];
    for (const r of M.arches) {
      const th0 = Math.asin(clamp((M.sill(r.a) - r.yc) / r.r, -0.95, 0.95));
      if (th0 < 0) { key(r.a - r.r - 0.004, ARCH); key(r.a + r.r + 0.004, ARCH); }
      const t0 = Math.max(0, th0);
      for (let k = 0; k <= na; k++) key(r.a - r.r * Math.cos(t0 + (Math.PI - 2 * t0) * k / na), ARCH);
    }
    const step = [0.45, 0.75, 0.95][lod];
    for (let a = M.front + step; a < M.rear - step * 0.5; a += step) fill(a);
    pts.sort((p, q) => p[0] - q[0]);
    const gap = [0.015, 0.035, 0.06][lod], out = [];
    for (const p of pts) {
      if (p[0] < M.front - 1e-6 || p[0] > M.rear + 1e-6) continue;
      const last = out[out.length - 1];
      if (last && p[0] - last[0] < gap) {
        if (p[1] && !last[1]) { last[0] = p[0]; last[1] = 1; last[2] = p[2] | (last[2] & ~CORE); }
        else if (p[1] && last[1] && p[0] - last[0] > 0.003) out.push(p.slice());
        else last[2] |= p[2];
        continue;
      }
      out.push(p.slice());
    }
    return { A: out.map(p => p[0]), mask: out.map(p => p[2]) };
  }

  function cls(M, s, a, v, f, lod) {
    const low = a > M.door[0] && a < M.door[1], win = a > M.door[0] && a < (lod ? M.door[1] : M.doorWin);
    if (s === 0) return M.rockerM + '|B';
    if (s <= 3) return low && s >= M.doorS0 ? 'paint|D' : 'paint|B';
    if (s === 4) return (a > M.winA && a < M.winB ? M.frame : 'paint') + (low ? '|D' : '|B');
    if (s === 5) {
      let m = 'paint';
      for (const w of M.win) if (a >= w[0] && a <= w[1]) {
        const t = w[2];
        m = t === 'diag' ? (v < 1 - (a - w[0]) / (w[1] - w[0]) ? 'glass' : 'paint') : t === 'diagA' ? (v < (a - w[0]) / (w[1] - w[0]) ? 'glass' : 'paint') : t === 'bar' ? (lod ? 'glass' : M.frame) : t === 'frame' ? (lod ? M.pillar : M.frame) : t === 'pillar' ? M.pillar : t === 'canvas' ? 'canvas' : 'glass';
        break;
      }
      return m + (win ? '|D' : '|B');
    }
    const ws = M.ws, bw = M.bw;
    if (s === 6) return (a > ws[2] + ws[3] && a < bw[0] - bw[1] ? M.rail : 'paint') + '|B';
    const f2 = f * f;
    if (a > ws[0] + ws[1] * f2 && a < ws[2] + ws[3] * f2) return (f <= M.wsF ? 'glass' : M.wsFrame || 'paint') + '|B';
    if (a > bw[0] - bw[1] * f2 && a < bw[2] - bw[3] * f2) return (f <= M.bwF ? 'glass' : M.bwFrame || M.roofM || 'paint') + '|B';
    if (M.roofM && a >= ws[2] + ws[3] * f2 && a <= bw[0] - bw[1] * f2) return M.roofM + '|B';
    return 'paint|B';
  }

  function gridNormal(G, j, i, upper) {
    const S = G.S, Z = G.Z, n = S.length;
    const P = (jj, ii) => (ii < NP ? S[jj][ii] : [-S[jj][2 * NP - 2 - ii][0], S[jj][2 * NP - 2 - ii][1]]);
    let c0, c1;
    if (!HARD[i] && i > 0) { c0 = P(j, i - 1); c1 = P(j, i + 1); }
    else if (upper && i > 0) { c0 = P(j, i - 1); c1 = P(j, i); }
    else { c0 = P(j, i); c1 = P(j, i + 1); }
    let tx = c1[0] - c0[0], ty = c1[1] - c0[1];
    if (Math.abs(tx) + Math.abs(ty) < 1e-6) { tx = 0; ty = 1; }
    const ja = Math.max(0, j - 1), jb = Math.min(n - 1, j + 1);
    const pa = S[ja][i], pb = S[jb][i];
    const zx = pb[0] - pa[0], zy = pb[1] - pa[1], zz = Z[jb] - Z[ja];
    const nx = ty * zz, ny = -tx * zz, nz = tx * zy - ty * zx;
    const l = Math.hypot(nx, ny, nz) || 1;
    return [nx / l, ny / l, nz / l];
  }

  function makeOut(M) {
    const o = { mb: new N.MB(2048), gl: new N.MB(256), doors: [{ mb: new N.MB(512), gl: new N.MB(64) }, { mb: new N.MB(512), gl: new N.MB(64) }], mats: {} };
    o.mat = name => {
      if (!o.mats[name]) o.mats[name] = name === 'glass' ? { layer: T('carglass'), kind: K.GLASS, c: M.glassC } : mat(name);
      return o.mats[name];
    };
    return o;
  }

  function loft(M, G, out, lod) {
    const pts = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [0, 2, 3, 5, 6, 7, 9], [0, 2, 4, 7, 9]][lod];
    const strips = [[0, 1, 2, 3, 4, 5, 6, 7, 8], [1, 2, 3, 5, 6, 8], [1, 2, 5, 8]][lod];
    const A = G.A, S = G.S, Z = G.Z;
    const OPTS = [[[0, 1, 2], [0, 2, 3]], [[0, 1, 3], [1, 2, 3]]];
    const UV = [[0, 0], [1, 0], [1, 1], [0, 1]];
    for (let k = 0; k + 1 < pts.length; k++) {
      const i0 = pts[k], i1 = pts[k + 1], s = strips[k], need = stripMask(i0);
      const J = [];
      for (let j = 0; j < A.length; j++) if (j === 0 || j === A.length - 1 || (G.mask[j] & need)) J.push(j);
      for (const side of [1, -1]) {
        const door = out.doors[side < 0 ? 0 : 1];
        const target = key => {
          const glass = key.startsWith('glass'), d = key.endsWith('D');
          return { mb: glass ? (d ? door.gl : out.gl) : d ? door.mb : out.mb, m: out.mat(key.slice(0, key.length - 2)) };
        };
        const vert = (mb, m, j, i, up) => {
          const p = S[j][i], n = gridNormal(G, j, i, up);
          const al = s <= 3 ? Math.round(255 * lerp(0.67, 1, clamp((p[1] - 0.26) / 0.6, 0, 1))) : 255;
          return mb.v(side * p[0], p[1], Z[j], side * n[0], n[1], n[2], (Z[j] + M.L / 2) / M.L, p[1] / 1.6, [m.c[0], m.c[1], m.c[2], al], m.layer, m.kind);
        };
        let run = null;
        for (let q = 0; q + 1 < J.length; q++) {
          const j = J[q], jn = J[q + 1];
          const c = [S[j][i0], S[jn][i0], S[jn][i1], S[j][i1]];
          const zj = [Z[j], Z[jn], Z[jn], Z[j]];
          const e1 = [c[2][0] - c[0][0], c[2][1] - c[0][1], zj[2] - zj[0]], e2 = [c[3][0] - c[1][0], c[3][1] - c[1][1], zj[3] - zj[1]];
          const area = Math.hypot(e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]);
          if (area < 4e-5) { run = null; continue; }
          const at = (u, v) => {
            const x = lerp(lerp(c[0][0], c[1][0], u), lerp(c[3][0], c[2][0], u), v);
            const x7 = lerp(S[j][7][0], S[jn][7][0], u);
            return cls(M, s, lerp(A[j], A[jn], u), v, Math.abs(x) / Math.max(1e-3, x7), lod);
          };
          const kc = at(0.5, 0.5);
          if (at(0.12, 0.12) === kc && at(0.88, 0.12) === kc && at(0.88, 0.88) === kc && at(0.12, 0.88) === kc) {
            const t = target(kc);
            t.mb.ensure(4, 6);
            let ia, id;
            if (run && run.key === kc && run.j === j) { ia = run.ib; id = run.ic; }
            else { ia = vert(t.mb, t.m, j, i0, false); id = vert(t.mb, t.m, j, i1, true); }
            const ib = vert(t.mb, t.m, jn, i0, false), ic = vert(t.mb, t.m, jn, i1, true);
            t.mb.tri(ia, ib, ic);
            t.mb.tri(ia, ic, id);
            run = { key: kc, j: jn, ib, ic };
            continue;
          }
          run = null;
          let best = null, bestScore = -1;
          for (const opt of OPTS) {
            let score = 0;
            const tris = opt.map(tr => {
              const cu = (UV[tr[0]][0] + UV[tr[1]][0] + UV[tr[2]][0]) / 3, cv = (UV[tr[0]][1] + UV[tr[1]][1] + UV[tr[2]][1]) / 3;
              const kk = at(cu, cv);
              for (const q of tr) if (at(cu + (UV[q][0] - cu) * 0.6, cv + (UV[q][1] - cv) * 0.6) === kk) score++;
              return { tr, kk };
            });
            if (score > bestScore) { bestScore = score; best = tris; }
          }
          for (const { tr, kk } of best) {
            const t = target(kk);
            t.mb.ensure(3, 3);
            const ids = tr.map(qq => vert(t.mb, t.m, qq === 1 || qq === 2 ? jn : j, qq >= 2 ? i1 : i0, qq >= 2));
            t.mb.tri(ids[0], ids[1], ids[2]);
          }
        }
      }
    }
  }

  function caps(M, G, out) {
    const m = out.mat('paint');
    for (const [j, dir] of [[0, -1], [G.A.length - 1, 1]]) {
      const S = G.S[j], z = G.Z[j], ring = [];
      for (let i = 0; i < NP; i++) ring.push(S[i]);
      for (let i = NP - 2; i >= 0; i--) ring.push([-S[i][0], S[i][1]]);
      const pts = ring.filter((p, k) => k === 0 || Math.hypot(p[0] - ring[k - 1][0], p[1] - ring[k - 1][1]) > 1e-4);
      let cy = 0;
      for (const p of pts) cy += p[1];
      cy /= pts.length;
      const mb = out.mb;
      mb.ensure(pts.length + 1, pts.length * 3);
      const c = mb.v(0, cy, z, 0, 0, dir, 0.5, cy / 1.6, m.c, m.layer, m.kind);
      const base = mb.nv;
      for (const p of pts) mb.v(p[0], p[1], z, 0, 0, dir, 0.5 + p[0] / M.W, p[1] / 1.6, [255, 255, 255, Math.round(255 * lerp(0.7, 1, clamp((p[1] - 0.26) / 0.6, 0, 1)))], m.layer, m.kind);
      for (let k = 0; k < pts.length; k++) mb.tri(c, base + k, base + (k + 1) % pts.length);
    }
  }

  function arches(M, out, lod) {
    const n = lod === 0 ? 9 : 4, m = out.mat('dark'), mb = out.mb;
    M.arches.forEach((r, w) => {
      const xo = M.wide(r.a) - 0.045, xi = M.track[w] / 2 - (w && M.dual ? M.dual / 2 : 0) - M.tyre[1] / 2 - 0.035;
      const t0 = Math.asin(clamp((M.sill(r.a) - r.yc) / r.r, -0.25, 0.95));
      const P = t => [r.a - r.r * Math.cos(t) + M.zOff, r.yc + r.r * Math.sin(t)];
      for (const side of [1, -1]) {
        mb.ensure(2 * n + 2, 6 * n);
        const b0 = mb.nv;
        for (let k = 0; k <= n; k++) {
          const t = t0 + (Math.PI - 2 * t0) * k / n, q = P(t), nn = [0, -Math.sin(t), Math.cos(t)];
          mb.v(side * xo, q[1], q[0], nn[0], nn[1], nn[2], k / n, 0, m.c, m.layer, m.kind);
          mb.v(side * xi, q[1], q[0], nn[0], nn[1], nn[2], k / n, 1, m.c, m.layer, m.kind);
        }
        for (let k = 0; k < n; k++) { const a = b0 + k * 2; mb.tri(a, a + 2, a + 3); mb.tri(a, a + 3, a + 1); }
        mb.ensure(n + 2, n * 3);
        const cz = r.a + M.zOff, c = mb.v(side * xi, r.yc, cz, side, 0, 0, 0.5, 0.5, m.c, m.layer, m.kind), base = mb.nv;
        for (let k = 0; k <= n; k++) { const q = P(t0 + (Math.PI - 2 * t0) * k / n); mb.v(side * xi, q[1], q[0], side, 0, 0, 0, 0, m.c, m.layer, m.kind); }
        for (let k = 0; k < n; k++) mb.tri(c, base + k, base + k + 1);
      }
    });
  }

  function underbody(M, out) {
    if (M.arches.length < 2) return;
    const m = out.mat('dark'), mb = out.mb, y = M.floorY + 0.02, zF = M.front + M.zOff + 0.06, zR = M.rear + M.zOff - 0.06;
    mb.quad([-0.55, y, zF, 0.55, y, zF, 0.55, y, zR, -0.55, y, zR], [0, -1, 0], [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
    const f = M.arches[0], r = M.arches[1], segs = [[M.front + 0.06, f.a - f.r], [f.a + f.r, r.a - r.r], [r.a + r.r, M.rear - 0.06]];
    for (const side of [1, -1]) for (const [a0, a1] of segs) {
      const x0 = side * 0.55, x1 = side * (Math.min(M.wide(a0), M.wide(a1)) - 0.05), z0 = a0 + M.zOff, z1 = a1 + M.zOff;
      mb.quad([x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1], [0, -1, 0], [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
    }
  }

  function sweep(mb, path, prof, m) {
    const np = prof.length, n = path.length;
    if (n < 2) return;
    const pn = prof.map((q, k) => {
      const a = prof[Math.max(0, k - 1)], b = prof[Math.min(np - 1, k + 1)];
      const dO = b[0] - a[0], dU = b[1] - a[1], l = Math.hypot(dO, dU) || 1;
      return [dU / l, -dO / l];
    });
    mb.ensure(n * np, (n - 1) * (np - 1) * 6);
    const base = mb.nv;
    path.forEach((P, i) => {
      for (let k = 0; k < np; k++) {
        const q = prof[k], nn = pn[k];
        mb.v(P.p[0] + P.o[0] * q[0] + P.u[0] * q[1], P.p[1] + P.o[1] * q[0] + P.u[1] * q[1], P.p[2] + P.o[2] * q[0] + P.u[2] * q[1],
          P.o[0] * nn[0] + P.u[0] * nn[1], P.o[1] * nn[0] + P.u[1] * nn[1], P.o[2] * nn[0] + P.u[2] * nn[1], k / np, i / n, m.c, m.layer, m.kind);
      }
    });
    for (let i = 0; i + 1 < n; i++) for (let k = 0; k + 1 < np; k++) {
      const a = base + i * np + k;
      mb.tri(a, a + np, a + np + 1);
      mb.tri(a, a + np + 1, a + 1);
    }
  }

  function slab(mb, x0, y0, z0, x1, y1, z1, front, m, sides) {
    const zf = front ? Math.min(z0, z1) : Math.max(z0, z1), zb = front ? Math.max(z0, z1) : Math.min(z0, z1), nz = front ? -1 : 1;
    mb.quad([x0, y0, zf, x1, y0, zf, x1, y1, zf, x0, y1, zf], [0, 0, nz], [0, 1, 1, 1, 1, 0, 0, 0], m.c, m.layer, m.kind);
    mb.quad([x0, y1, zf, x1, y1, zf, x1, y1, zb, x0, y1, zb], [0, 1, 0], [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
    mb.quad([x0, y0, zb, x1, y0, zb, x1, y0, zf, x0, y0, zf], [0, -1, 0], [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
    if (sides) {
      mb.quad([x0, y0, zb, x0, y0, zf, x0, y1, zf, x0, y1, zb], [-1, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
      mb.quad([x1, y0, zf, x1, y0, zb, x1, y1, zb, x1, y1, zf], [1, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
    }
  }

  function faceKit(M, out, parts, front, lod) {
    const kit = N.CarKit, mb = out.mb, dir = front ? -1 : 1, zf = (front ? M.front : M.tailA) + M.zOff, n = [0, 0, dir];
    const z = d => zf + dir * d;
    const k = {
      lod, LK: kit.LK,
      ind: s => (s < 0 ? kit.LK.INDL : kit.LK.INDR),
      both(fn) { fn(1); fn(-1); },
      panel(x0, y0, x1, y1, mn, d) {
        const m = out.mat(mn), zz = z(d), a = Math.min(x0, x1), b = Math.max(x0, x1);
        mb.quad(front ? [b, y0, zz, a, y0, zz, a, y1, zz, b, y1, zz] : [a, y0, zz, b, y0, zz, b, y1, zz, a, y1, zz], n, [0, 1, 1, 1, 1, 0, 0, 0], m.c, m.layer, m.kind);
      },
      block(x0, y0, x1, y1, d0, d1, mn) {
        if (lod) return;
        slab(mb, Math.min(x0, x1), Math.min(y0, y1), z(d0), Math.max(x0, x1), Math.max(y0, y1), z(d1), front, out.mat(mn), Math.abs(d1 - d0) > 0.025);
      },
      frame(x0, y0, x1, y1, t, mn, d0, d1) {
        const a = Math.min(x0, x1), b = Math.max(x0, x1);
        if (lod) { k.panel(a, y0, b, y1, mn, d0 + 0.001); return; }
        k.block(a, y0, b, y0 + t, d0, d1, mn);
        k.block(a, y1 - t, b, y1, d0, d1, mn);
        k.block(a, y0 + t, a + t, y1 - t, d0, d1, mn);
        k.block(b - t, y0 + t, b, y1 - t, d0, d1, mn);
      },
      ring(x, y, r, mn, d) {
        if (lod) return;
        const m = out.mat(mn);
        kit.shapeAt(mb, [x, y, z(d)], [1, 0, 0], [0, 1, 0], n, { r, seg: 12 }, m.c, m.layer, m.kind);
      },
      rect(x, y, w, h, mn, d) {
        if (lod) return;
        const m = out.mat(mn);
        kit.shapeAt(mb, [x, y, z(d)], [1, 0, 0], [0, 1, 0], n, { w, h }, m.c, m.layer, m.kind);
      },
      lamp(x, y, sh, kind, d) {
        kit.lampAt(mb, parts, [x, y, z(d)], [1, 0, 0], [0, 1, 0], n, sh.r ? { r: sh.r, seg: [12, 8, 6][lod] } : sh, kind);
      },
      slats(x0, y0, x1, y1, nb, mn, d0, d1) {
        if (lod) return;
        const step = (y1 - y0) / nb, hb = step * 0.42;
        for (let i = 0; i < nb; i++) { const y = y0 + step * (i + 0.5); k.block(x0, y - hb / 2, x1, y + hb / 2, d0, d1, mn); }
      },
      vslats(x0, y0, x1, y1, nb, mn, d0, d1, fill) {
        if (lod) return;
        const step = (x1 - x0) / nb, hb = step * (fill || 0.42);
        for (let i = 0; i < nb; i++) { const x = x0 + step * (i + 0.5); k.block(x - hb / 2, y0, x + hb / 2, y1, d0, d1, mn); }
      },
      glass(x0, y0, x1, y1, d) {
        const m = out.mat('glass'), zz = z(d), a = Math.min(x0, x1), b = Math.max(x0, x1);
        out.gl.quad(front ? [b, y0, zz, a, y0, zz, a, y1, zz, b, y1, zz] : [a, y0, zz, b, y0, zz, b, y1, zz, a, y1, zz], n, [0, 1, 1, 1, 1, 0, 0, 0], m.c, m.layer, m.kind);
      },
      line(x0, y0, x1, y1, w, mn, d) {
        if (lod) return;
        const m = out.mat(mn), zz = z(d), dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, ox = -dy / l * w / 2, oy = dx / l * w / 2;
        mb.quad([x0 + ox, y0 + oy, zz, x1 + ox, y1 + oy, zz, x1 - ox, y1 - oy, zz, x0 - ox, y0 - oy, zz], n, [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
      }
    };
    return k;
  }

  function bumperPath(M, front, aFace, aWrap, xh, rc, y, n) {
    const dir = front ? -1 : 1, path = [];
    const P = (x, a, nx, na) => path.push({ p: [x, y, a + M.zOff], o: [nx, 0, na], u: [0, 1, 0], x });
    const ca = aFace - dir * rc;
    P(-xh, aWrap, -1, 0);
    for (let k = 0; k <= n; k++) { const t = k / n * Math.PI / 2; P(-xh + rc - rc * Math.cos(t), ca + dir * rc * Math.sin(t), -Math.cos(t), dir * Math.sin(t)); }
    for (let k = n; k >= 0; k--) { const t = k / n * Math.PI / 2; P(xh - rc + rc * Math.cos(t), ca + dir * rc * Math.sin(t), Math.cos(t), dir * Math.sin(t)); }
    P(xh, aWrap, 1, 0);
    return path;
  }

  function bumpers(M, out, lod) {
    const B = M.bumper, nArc = [3, 1, 1][lod], bright = out.mat(B.m || 'chrome');
    for (const front of [true, false]) {
      const aFace = front ? B.f : B.r, aWrap = front ? B.fw : B.rw;
      if (B.ends === 'bar') {
        const h = (front ? B.h : B.hr || B.h) / 2, y = front ? B.y : B.yr || B.y, xh = front ? B.xh : B.xhr || B.xh, dir = front ? -1 : 1, z0 = aFace + M.zOff, z1 = z0 - dir * (B.d || 0.1);
        out.mb.box(-xh, y - h, Math.min(z0, z1), xh, y + h, Math.max(z0, z1), out.mat(B.m || 'black'));
        continue;
      }
      if (B.ends === 'plastic') {
        const h = B.h / 2, y = front ? B.y : B.yr || B.y;
        const prof = lod === 0 ? [[-0.04, -h], [0.008, -h + 0.012], [0.02, -h * 0.35], [0.022, h * 0.45], [0.012, h - 0.008], [-0.04, h]] : lod === 1 ? [[-0.04, -h], [0.02, -h * 0.5], [0.022, h * 0.5], [-0.04, h]] : [[-0.03, -h], [0.022, -h], [0.022, h], [-0.03, h]];
        const path = bumperPath(M, front, aFace, aWrap, B.xh, B.rc, y, Math.max(nArc, B.rc > 0.2 ? [4, 2, 1][lod] : nArc));
        sweep(out.mb, path, prof, out.mat(B.m || 'black'));
        if (B.strip && lod === 0) sweep(out.mb, path, [[0.018, B.strip[0] - 0.012], [0.03, B.strip[0] - 0.008], [0.03, B.strip[0] + 0.008], [0.018, B.strip[0] + 0.012]], out.mat(B.strip[1]));
        continue;
      }
      if (B.ends === 'big') {
        const lowP = lod === 2 ? [[-0.03, -0.05], [0.012, -0.05], [0.012, 0.035], [-0.03, 0.035]] : [[-0.03, -0.05], [0.006, -0.044], [0.014, 0.035], [-0.03, 0.035]];
        sweep(out.mb, bumperPath(M, front, aFace, aWrap, B.xh, B.rc, B.y - 0.015, nArc), lowP, out.mat('black'));
        const topP = [[-0.03, -0.006], [0.018, -0.004], [0.02, 0.014], [-0.03, 0.026]];
        sweep(out.mb, bumperPath(M, front, aFace, aWrap, B.xh, B.rc, B.y + 0.03, nArc), lod === 2 ? [topP[0], topP[2], topP[3]] : topP, out.mat('chrome'));
        continue;
      }
      const h = B.h / 2;
      const prof = lod === 0 ? [[-0.03, -h], [0.004, -h * 0.82], [0.012, 0], [0.004, h * 0.82], [-0.03, h]] : lod === 1 ? [[-0.03, -h], [0.012, -h * 0.4], [0.012, h * 0.4], [-0.03, h]] : [[-0.02, -h], [0.012, -h], [0.012, h], [-0.02, h]];
      const path = bumperPath(M, front, aFace, aWrap, B.xh, B.rc, B.y, nArc);
      if (B.ends === 'black') {
        const cut = path.findIndex(p => Math.abs(p.o[2]) > 0.999);
        const mid = path.slice(cut, path.length - cut);
        sweep(out.mb, mid, prof, bright);
        sweep(out.mb, path.slice(0, cut + 1), prof, out.mat('black'));
        sweep(out.mb, path.slice(path.length - cut - 1), prof, out.mat('black'));
        if (B.strip && lod === 0) sweep(out.mb, mid, [[0.006, -0.008], [0.016, -0.006], [0.016, 0.006], [0.006, 0.008]], out.mat('rubber'));
      } else sweep(out.mb, path, prof, bright);
      if (B.over && lod < 2) {
        const o = B.over, dir = front ? -1 : 1;
        for (const s of [-1, 1]) {
          const za = aFace + M.zOff - dir * 0.015, zb = aFace + M.zOff + dir * 0.016;
          out.mb.box(s * o.x - 0.022, o.y0, Math.min(za, zb), s * o.x + 0.022, o.y1, Math.max(za, zb), out.mat(o.m));
        }
      }
    }
  }

  function sideX(sec, y) {
    for (let i = 0; i < 4; i++) {
      const a = sec[i], b = sec[i + 1];
      if (y >= a[1] && y <= b[1]) return b[1] - a[1] < 1e-6 ? Math.max(a[0], b[0]) : lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1]));
    }
    return sec[2][0];
  }

  function sideBand(M, G, out, y0, y1, a0, a1, mn, off, toDoor, lod) {
    const m = out.mat(mn), minStep = lod ? 0.55 : 0.3;
    const js = [];
    let last = -9, lastClip = null;
    for (let j = 0; j < G.A.length; j++) {
      const a = G.A[j];
      if (a < a0 - 1e-6 || a > a1 + 1e-6) continue;
      const clip = G.S[j][0][1] + 0.004 > y0;
      const keyA = Math.abs(a - M.door[0]) < 1e-6 || Math.abs(a - M.door[1]) < 1e-6;
      if (a - last >= minStep || keyA || clip || clip !== lastClip) { js.push(j); last = a; }
      lastClip = clip;
    }
    if (js.length && js[js.length - 1] !== G.A.findIndex(a => a > a1 + 1e-6) - 1) {
      let jl = -1;
      for (let j = 0; j < G.A.length; j++) if (G.A[j] <= a1 + 1e-6) jl = j;
      if (jl > js[js.length - 1]) js.push(jl);
    }
    for (const side of [1, -1]) {
      let prev = null;
      for (let q = 0; q < js.length; q++) {
        const j = js[q], sa = G.S[j], lo = Math.max(y0, sa[0][1] + 0.004);
        const ok = y1 - lo >= 0.006;
        if (q > 0) {
          const ja = js[q - 1], a = G.A[ja], b = G.A[j];
          const mb = toDoor && a >= M.door[0] - 1e-6 && b <= M.door[1] + 1e-6 ? out.doors[side < 0 ? 0 : 1].mb : out.mb;
          if (ok && prev && prev.ok) {
            if (!prev.mb || prev.mb !== mb) {
              mb.ensure(4, 6);
              prev.i0 = mb.v(side * (sideX(G.S[ja], prev.lo) + off), prev.lo, G.Z[ja], side, 0, 0, 0, 0, m.c, m.layer, m.kind);
              prev.i1 = mb.v(side * (sideX(G.S[ja], y1) + off), y1, G.Z[ja], side, 0, 0, 0, 1, m.c, m.layer, m.kind);
              prev.mb = mb;
            }
            mb.ensure(2, 6);
            const i0 = mb.v(side * (sideX(sa, lo) + off), lo, G.Z[j], side, 0, 0, 1, 0, m.c, m.layer, m.kind);
            const i1 = mb.v(side * (sideX(sa, y1) + off), y1, G.Z[j], side, 0, 0, 1, 1, m.c, m.layer, m.kind);
            mb.tri(prev.i0, i0, i1);
            mb.tri(prev.i0, i1, prev.i1);
            prev = { ok, lo, i0, i1, mb };
            continue;
          }
        }
        prev = { ok, lo, mb: null };
      }
    }
  }

  function moldings(M, G, out, lod) {
    for (const q of M.moldings) {
      const a0 = q.a0 === undefined ? M.front + 0.06 : q.a0, a1 = q.a1 === undefined ? M.rear - 0.06 : q.a1;
      sideBand(M, G, out, q.y - q.h / 2, q.y + q.h / 2, a0, a1, q.m, 0.006, true, lod);
    }
  }

  function seams(M, out) {
    const m = out.mat('seam');
    for (const [a, dz, i0, i1] of [[M.door[0], -0.004, M.doorS0, 5], [M.door[1], 0.004, M.doorS0, 5], [M.rearDoorEnd, -0.004, 1, 4]].concat(M.seamsA)) {
      if (!a) continue;
      const sec = section(M, a), z = a + M.zOff + dz;
      for (const side of [1, -1]) for (let i = i0; i < i1; i++) {
        const p = sec[i], q = sec[i + 1];
        if (q[1] - p[1] < 1e-4 && Math.abs(q[0] - p[0]) < 1e-4) continue;
        const ox = 0.0015;
        out.mb.quad([side * (p[0] + ox), p[1], z - 0.003, side * (p[0] + ox), p[1], z + 0.003, side * (q[0] + ox), q[1], z + 0.003, side * (q[0] + ox), q[1], z - 0.003], [side, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
      }
    }
  }

  function frames(M, G, out) {
    const m = out.mat(M.frame), a0 = M.ws[0] + M.ws[1], a1 = M.win[M.win.length - 1][0], ox = 0.004, h = 0.013;
    for (const side of [1, -1]) {
      const door = out.doors[side < 0 ? 0 : 1];
      let prev = null;
      for (let j = 0; j < G.A.length; j++) {
        if (G.A[j] < a0 - 1e-6 || G.A[j] > a1 + 1e-6) continue;
        const p = G.S[j][6];
        const mb = G.A[j] > M.doorWin - 1e-6 ? out.mb : door.mb;
        if (prev && prev.mb !== mb) {
          mb.ensure(2, 0);
          prev = { mb, j: prev.j, i0: mb.v(side * (prev.p[0] + ox), prev.p[1] - h, G.Z[prev.j], side * 0.95, 0.3, 0, 0, 0, m.c, m.layer, m.kind), i1: mb.v(side * (prev.p[0] + ox * 0.5), prev.p[1] + 0.004, G.Z[prev.j], side * 0.95, 0.3, 0, 0, 1, m.c, m.layer, m.kind), p: prev.p };
        }
        mb.ensure(2, 6);
        const i0 = mb.v(side * (p[0] + ox), p[1] - h, G.Z[j], side * 0.95, 0.3, 0, 1, 0, m.c, m.layer, m.kind);
        const i1 = mb.v(side * (p[0] + ox * 0.5), p[1] + 0.004, G.Z[j], side * 0.95, 0.3, 0, 1, 1, m.c, m.layer, m.kind);
        if (prev && p[1] - G.S[j][5][1] > 0.005) { mb.tri(prev.i0, i0, i1); mb.tri(prev.i0, i1, prev.i1); }
        prev = { mb, j, i0, i1, p };
      }
      const dg = M.win[M.win.length - 1], sa = section(M, dg[0]), sb = section(M, dg[1]), za = dg[0] + M.zOff, zb = dg[1] + M.zOff;
      const p = sa[6], q = sb[5], w = 0.012;
      out.mb.quad([side * (p[0] + ox), p[1], za, side * (q[0] + ox), q[1], zb, side * (q[0] + ox), q[1], zb + w, side * (p[0] + ox), p[1], za + w], [side, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
    }
  }

  function screenFrames(M, out) {
    const m = out.mat(M.frame === 'chrome' ? 'chrome' : 'rubber');
    const edge = (aOf, lift) => {
      const path = [];
      for (let k = -5; k <= 5; k++) {
        const f = k / 5, a = aOf(f), sec = section(M, a), x = f * sec[7][0], y = gTop(M, a, Math.abs(f)) + lift;
        path.push({ p: [x, y, a + M.zOff], o: [0, 1, 0], u: [0, 0, 1] });
      }
      sweep(out.mb, path, [[0.004, -0.012], [0.006, 0.012]], m);
    };
    const ws = M.ws, bw = M.bw;
    edge(f => ws[0] + ws[1] * f * f + 0.012, 0.004);
    edge(f => ws[2] + ws[3] * f * f - 0.006, 0.003);
    edge(f => bw[0] - bw[1] * f * f + 0.006, 0.003);
    edge(f => bw[2] - bw[3] * f * f - 0.012, 0.004);
  }

  function wipers(M, out) {
    const m = out.mat('rubber'), ws = M.ws;
    for (const [f0, f1] of [[-0.86, -0.1], [0.02, 0.74]]) {
      const path = [];
      for (let k = 0; k <= 4; k++) {
        const f = lerp(f0, f1, k / 4), a = ws[0] + ws[1] * f * f + 0.04, sec = section(M, a);
        path.push({ p: [f * sec[7][0], gTop(M, a, Math.abs(f)) + 0.012, a + M.zOff], o: [0, 1, 0], u: [0, 0, 1] });
      }
      sweep(out.mb, path, [[-0.006, -0.008], [0.006, -0.006], [0.006, 0.006], [-0.006, 0.008]], m);
    }
  }

  function handles(M, out) {
    const m = out.mat(M.handle);
    M.handles.forEach(([a, y], k) => {
      const z = a + M.zOff, sec = section(M, a), x = sideX(sec, y);
      for (const side of [1, -1]) {
        const mb = k === 0 ? out.doors[side < 0 ? 0 : 1].mb : out.mb;
        const xa = side * x, xb = side * (x + 0.016);
        mb.quad([xb, y - 0.012, z - 0.06, xb, y - 0.012, z + 0.05, xb, y + 0.012, z + 0.05, xb, y + 0.012, z - 0.06], [side, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
        mb.quad([xa, y + 0.012, z - 0.06, xa, y + 0.012, z + 0.05, xb, y + 0.012, z + 0.05, xb, y + 0.012, z - 0.06], [0, 1, 0], [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
        mb.quad([xa, y - 0.012, z - 0.06, xb, y - 0.012, z - 0.06, xb, y - 0.012, z + 0.05, xa, y - 0.012, z + 0.05], [0, -1, 0], [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
      }
    });
  }

  function armMirrors(M, out, lod) {
    const q = M.mirror, a = q.a, sec = section(M, a), x0 = sideX(sec, q.y) - 0.01, z = a + M.zOff, body = out.mat('black'), glass = out.mat('mirror');
    for (const side of [1, -1]) {
      const mb = M.mirrorBody ? out.mb : out.doors[side < 0 ? 0 : 1].mb;
      const bx = (p, r, y1, y2, z1, z2, m) => { const xa = side * p, xb = side * r; mb.box(Math.min(xa, xb), y1, Math.min(z1, z2), Math.max(xa, xb), y2, Math.max(z1, z2), m); };
      const zf = z - (q.fwd || 0), hx = x0 + q.out;
      bx(x0, hx + 0.01, q.y - 0.012, q.y + 0.012, zf - 0.012, z + 0.012, body);
      if (q.fwd && !lod) bx(x0, x0 + 0.03, q.y - 0.012, q.y + 0.012, zf, z + 0.02, body);
      bx(hx - 0.02, hx + 0.03, q.y - q.h * 0.15, q.y + q.h * 0.85, zf - 0.035, zf + 0.005, body);
      if (lod) continue;
      const zz = zf + 0.006, xa = side * (hx - 0.012), xb = side * (hx + 0.022);
      mb.quad([xa, q.y - q.h * 0.15 + 0.012, zz, xb, q.y - q.h * 0.15 + 0.012, zz, xb, q.y + q.h * 0.85 - 0.012, zz, xa, q.y + q.h * 0.85 - 0.012, zz], [0, 0, 1], [0, 1, 1, 1, 1, 0, 0, 0], glass.c, glass.layer, glass.kind);
    }
  }

  function mirrors(M, out, lod) {
    if (typeof M.mirror === 'object') { armMirrors(M, out, lod); return; }
    const a = M.door[0] + 0.19, sec = section(M, a), z = a + M.zOff, x0 = sec[4][0], y0 = sec[4][1];
    const style = M.mirror, body = out.mat(style === 'black' ? 'black' : style === 'paint' ? 'paint' : 'chrome'), glass = out.mat('mirror');
    for (const side of [1, -1]) {
      const mb = out.doors[side < 0 ? 0 : 1].mb;
      const bx = (p, q, y1, y2, z1, z2, m) => { const xa = side * p, xb = side * q; mb.box(Math.min(xa, xb), y1, Math.min(z1, z2), Math.max(xa, xb), y2, Math.max(z1, z2), m); };
      let hx0, hx1, hy0, hy1;
      if (lod) { hx1 = x0 + 0.14; hy0 = y0 + 0.02; hy1 = y0 + 0.1; }
      else if (style === 'round') { bx(x0, x0 + 0.075, y0 + 0.02, y0 + 0.034, z - 0.008, z + 0.008, body); hx0 = x0 + 0.06; hx1 = x0 + 0.15; hy0 = y0 + 0.03; hy1 = y0 + 0.115; }
      else if (style === 'chrome') { bx(x0, x0 + 0.06, y0 + 0.015, y0 + 0.032, z - 0.01, z + 0.01, body); hx0 = x0 + 0.045; hx1 = x0 + 0.155; hy0 = y0 + 0.025; hy1 = y0 + 0.1; }
      else { bx(x0 - 0.01, x0 + 0.05, y0 - 0.005, y0 + 0.06, z - 0.03, z + 0.03, body); hx0 = x0 + 0.03; hx1 = x0 + 0.17; hy0 = y0 + 0.02; hy1 = y0 + 0.115; }
      if (lod) { mb.box(Math.min(side * x0, side * hx1), hy0, z - 0.03, Math.max(side * x0, side * hx1), hy1, z + 0.008, body); continue; }
      bx(hx0, hx1, hy0, hy1, z - 0.03, z + 0.008, body);
      const zz = z + 0.009, xa = side * (hx0 + 0.008), xb = side * (hx1 - 0.008);
      mb.quad([xa, hy0 + 0.008, zz, xb, hy0 + 0.008, zz, xb, hy1 - 0.008, zz, xa, hy1 - 0.008, zz], [0, 0, 1], [0, 1, 1, 1, 1, 0, 0, 0], glass.c, glass.layer, glass.kind);
    }
  }

  function vents(M, out) {
    const m = out.mat('black'), [a0, a1, y0, y1] = M.vent;
    for (const side of [1, -1]) {
      const pts = [[a0, y0], [a1, y0], [a1, y1], [a0, y1]].map(([a, y]) => {
        const sec = section(M, a), p5 = sec[5], p6 = sec[6], t = clamp((y - p5[1]) / Math.max(1e-3, p6[1] - p5[1]), 0, 1);
        return [side * (lerp(p5[0], p6[0], t) + 0.004), y, a + M.zOff];
      });
      out.mb.quad([].concat(...pts), [side, 0.2, 0], [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
    }
  }

  function panels(M, out, lod) {
    for (const q of M.panels) {
      const m = out.mat(q.m), n = lod ? 1 : 3;
      for (const side of [1, -1]) {
        const at = (a, y) => { const sec = section(M, a); return [side * (sideX(sec, y) + 0.004), y, a + M.zOff]; };
        for (let k = 0; k < n; k++) {
          const a = lerp(q.a0, q.a1, k / n), b = lerp(q.a0, q.a1, (k + 1) / n);
          out.mb.quad([].concat(at(a, q.y0), at(b, q.y0), at(b, q.y1), at(a, q.y1)), [side, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
        }
        if (lod || !q.slots) continue;
        const dark = out.mat('grille');
        for (let k = 0; k < q.slots; k++) {
          const a = lerp(q.a0 + 0.02, q.a1 - 0.02, (k + 0.5) / q.slots), w = 0.008, p0 = at(a - w, q.y0 + 0.012), p1 = at(a + w, q.y0 + 0.012), p2 = at(a + w, q.y1 - 0.012), p3 = at(a - w, q.y1 - 0.012);
          for (const p of [p0, p1, p2, p3]) p[0] += side * 0.002;
          out.mb.quad([].concat(p0, p1, p2, p3), [side, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], dark.c, dark.layer, dark.kind);
        }
      }
    }
  }

  function doorInner(M, out) {
    const m = { layer: T('fabric'), kind: 0, c: [74, 64, 58, 255] }, edge = out.mat('dark');
    const sa = section(M, M.door[0]), sb = section(M, M.door[1]), za = M.door[0] + M.zOff, zb = M.door[1] + M.zOff, x = Math.min(sa[2][0], sb[2][0]) - 0.06;
    const y0 = Math.max(sa[M.doorS0][1], sb[M.doorS0][1]), y1 = Math.min(sa[5][1], sb[5][1]);
    for (const side of [1, -1]) {
      const mb = out.doors[side < 0 ? 0 : 1].mb, xi = side * x;
      mb.quad([xi, y0, za, xi, y0, zb, xi, y1, zb, xi, y1, za], [-side, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
      mb.quad([side * sa[5][0], y1, za, side * sb[5][0], y1, zb, xi, y1, zb, xi, y1, za], [0, 1, 0], [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
      for (const [sec, z] of [[sa, za], [sb, zb]]) mb.quad([side * sec[2][0], y0, z, side * sec[2][0], y1, z, xi, y1, z, xi, y0, z], [0, 0, z === za ? -1 : 1], [0, 0, 1, 0, 1, 1, 0, 1], edge.c, edge.layer, edge.kind);
    }
  }

  const seatColor = (I, liv, vi) => (liv && liv.beacon && liv.beacon !== 'taxi' ? [52, 54, 60, 255] : I.seats[vi % I.seats.length].concat(255));

  function interior(M, spec, out, liv) {
    const cab = N.cabin(spec), mb = out.mb, I = M.inside, s = cab.seat, fl = M.floorY + 0.05;
    const fab = { layer: T(I.cover), kind: 0, c: seatColor(I, liv, 0) };
    const tyreW = M.tyre[1] / 2, inner = M.dual ? M.dual / 2 + tyreW : tyreW, rw = Math.min(M.W / 2 - 0.28, M.track[1] / 2 - inner - 0.03);
    for (const sx of [-1, 1]) {
      const cx = sx * Math.abs(s.x);
      mb.box(cx - 0.22, fl, s.z + 0.2, cx + 0.22, Math.min(M.H - 0.2, s.y + 0.66), s.z + 0.31, fab);
    }
    if (M.rearSeat !== null) mb.box(-rw, fl, M.rearSeat + M.zOff - 0.02, rw, Math.min(M.H - 0.22, s.y + 0.6), M.rearSeat + M.zOff + 0.12, fab);
  }

  function obox(mb, c, ax, ay, az, h, m) {
    const P = (sx, sy, sz) => [0, 1, 2].map(i => c[i] + ax[i] * h[0] * sx + ay[i] * h[1] * sy + az[i] * h[2] * sz);
    const face = (n, a, b, d, e) => mb.quad([...a, ...b, ...d, ...e], n, [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
    const neg = v => [-v[0], -v[1], -v[2]];
    face(ax, P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1));
    face(neg(ax), P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1), P(-1, -1, -1));
    face(ay, P(-1, 1, -1), P(-1, 1, 1), P(1, 1, 1), P(1, 1, -1));
    face(neg(ay), P(-1, -1, 1), P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1));
    face(az, P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1));
    face(neg(az), P(1, -1, -1), P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1));
  }

  function cabinTop(M, a) {
    if (a <= M.bw[0]) return M.roof(a);
    if (a >= M.bw[2]) return M.deck(a);
    return lerp(M.roof(M.bw[0]), M.deck(M.bw[2]), (a - M.bw[0]) / (M.bw[2] - M.bw[0]));
  }

  const DASH = {
    flat: (zf, yt, zw, yw) => [[zf - 0.12, yt - 0.28], [zf + 0.01, yt - 0.24], [zf, yt - 0.03], [zf - 0.03, yt], [zw, yw]],
    high: (zf, yt, zw, yw) => [[zf - 0.1, yt - 0.34], [zf + 0.05, yt - 0.26], [zf + 0.02, yt - 0.03], [zf - 0.06, yt + 0.01], [zw, yw]],
    soft: (zf, yt, zw, yw) => [[zf - 0.12, yt - 0.3], [zf + 0.04, yt - 0.24], [zf + 0.04, yt - 0.1], [zf + 0.01, yt - 0.03], [zf - 0.05, yt + 0.005], [zw, yw]],
    metal: (zf, yt, zw, yw) => [[zf - 0.03, yt - 0.2], [zf, yt - 0.19], [zf, yt], [zw, yw]]
  };

  function insideMesh(M, spec, liv, vi) {
    const I = M.inside, cab = N.cabin(spec), mb = new N.MB(1024), s = cab.seat, w = cab.wheel;
    const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];
    const fab = { layer: T(I.cover), kind: 0, c: seatColor(I, liv, vi) };
    const dash = I.dashC === 'paint' ? { layer: T('carbody'), kind: K.PAINT, c: WHITE } : { layer: T('white'), kind: K.TRIM, c: I.dashC.concat(255) };
    const dark = mat('dark'), chrome = mat('chrome'), head = { layer: T('fabric'), kind: 0, c: I.head.concat(255) };
    const visor = { layer: T('fabric'), kind: 0, c: I.head.map(v => v * 0.82 | 0).concat(255) }, floor = { layer: T('fabric'), kind: 0, c: [40, 38, 36, 255] };
    const glow = { layer: T('gauge'), kind: N.LAMPKIND.DASH, c: I.glow.concat(255) }, wood = { layer: T('barwood'), kind: K.TRIM, c: [178, 118, 74, 255] };
    const fl = M.floorY + 0.05, tyreW = M.tyre[1] / 2, inner = M.dual ? M.dual / 2 + tyreW : tyreW;
    const fw = M.arches.length ? Math.min(M.W / 2 - 0.2, Math.min(M.track[0] / 2 - tyreW, M.track[1] / 2 - inner) - 0.04) : M.W / 2 - 0.14, rw = Math.min(M.W / 2 - 0.28, M.track[1] / 2 - inner - 0.03);
    const cushion = (cx, cz, hw, cy, hd) => obox(mb, [cx, cy, cz], X, [0, 0.995, 0.0998], [0, -0.0998, 0.995], [hw, 0.065, hd], fab);
    const back = (cx, hy, hz, hw, L, lean, th) => {
      const up = [0, Math.cos(lean), Math.sin(lean)], bk = [0, -Math.sin(lean), Math.cos(lean)];
      obox(mb, [cx, hy + up[1] * L / 2 + bk[1] * th, hz + up[2] * L / 2 + bk[2] * th], X, up, bk, [hw, L / 2, th], fab);
      return { up, bk, y: hy + up[1] * L, z: hz + up[2] * L };
    };
    const rest = (cx, b, th) => obox(mb, [cx, b.y + b.up[1] * 0.11 + b.bk[1] * th, b.z + b.up[2] * 0.11 + b.bk[2] * th], X, b.up, b.bk, [0.13, 0.085, th * 0.85], fab);
    const th = I.dash === 'metal' ? 0.05 : 0.065;
    for (const [cx, hw] of I.bench ? [[0, fw]] : [[-Math.abs(s.x), 0.24], [Math.abs(s.x), 0.24]]) {
      cushion(cx, s.z - 0.03, hw, s.y + 0.02, 0.25);
      const b = back(cx, s.y + 0.07, s.z + 0.22, hw - 0.01, I.back, I.lean, th);
      if (I.rests) rest(cx, b, th);
    }
    if (M.rearSeat !== null) {
      const rz = M.rearSeat + M.zOff, hy = s.y + 0.05, hz = rz + 0.02, rl = 0.3;
      cushion(0, rz - 0.21, rw, s.y + 0.01, 0.22);
      let L = 0.56;
      for (let k = 0; k < 2; k++) L = Math.max(0.3, Math.min(0.56, (cabinTop(M, hz + Math.sin(rl) * L - M.zOff) - 0.1 - hy) / Math.cos(rl)));
      const b = back(0, hy, hz, rw, L, rl, 0.07);
      if (I.rearRests) for (const x of [-1, 1]) rest(x * (rw - 0.27), b, 0.06);
    }
    if (M.rows) for (const r of M.rows) for (const x of r.x) {
      const z0 = r.a + M.zOff;
      obox(mb, [x, fl + 0.4, z0 - 0.21], X, Y, Z, [r.w / 2, 0.05, 0.21], fab);
      back(x, fl + 0.42, z0, r.w / 2, 0.6, 0.12, 0.05);
    }
    const cz = M.ws[0] + M.zOff, fz1 = (M.floorTo !== undefined ? M.floorTo : M.rearSeat !== null ? M.rearSeat + 0.1 : M.door[1]) + M.zOff;
    mb.quad([-fw, fl, cz, fw, fl, cz, fw, fl, fz1, -fw, fl, fz1], Y, [0, 0, 1, 0, 1, 1, 0, 1], floor.c, floor.layer, floor.kind);
    if (M.shelf !== false && M.rearSeat !== null) {
      const pz = M.bw[2] + M.zOff - 0.04, py = M.belt(M.bw[2]) - 0.01, rz = M.rearSeat + M.zOff;
      mb.quad([-0.68, py, rz + 0.12, 0.68, py, rz + 0.12, 0.68, py, pz, -0.68, py, pz], Y, [0, 0, 1, 0, 1, 1, 0, 1], floor.c, floor.layer, floor.kind);
    }
    const zw = cz + 0.02, yw = M.deck(M.ws[0]) - 0.02, W2 = M.W / 2 - 0.12;
    const zf = Math.max(w.z - 0.16, zw + 0.08), yt = yw + (I.dash === 'high' ? 0.05 : I.dash === 'metal' ? -0.01 : 0.03);
    const pr = DASH[I.dash](zf, yt, zw, yw);
    sweep(mb, [{ p: [-W2, 0, 0], o: Z, u: Y }, { p: [W2, 0, 0], o: Z, u: Y }], pr, dash);
    const faceAt = y => {
      let z = zw;
      for (let i = 0; i + 1 < pr.length; i++) {
        const [z0, y0] = pr[i], [z1, y1] = pr[i + 1];
        if (y0 !== y1 && (y - y0) * (y - y1) <= 0) z = Math.max(z, z0 + (z1 - z0) * (y - y0) / (y1 - y0));
      }
      return z;
    };
    const bd = Math.max(0.02, Math.min(0.12, zf - zw - 0.01));
    obox(mb, [w.x, yt - 0.045, zf + 0.02 - bd / 2], X, Y, Z, [0.18, 0.095, bd / 2 + 0.02], dash);
    const gz = zf + 0.042, gy = yt - 0.04;
    const disc = (x, y, r, u0, v0, u1, v1) => {
      const seg = 14, base = mb.nv, uc = (u0 + u1) / 2, vc = (v0 + v1) / 2;
      mb.ensure(seg + 2, seg * 3);
      mb.v(x, y, gz, 0, 0, 1, uc, vc, glow.c, glow.layer, glow.kind);
      for (let i = 0; i <= seg; i++) {
        const t = i / seg * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t);
        mb.v(x + c * r, y + sn * r, gz, 0, 0, 1, uc + c * (u1 - u0) / 2, vc - sn * (v1 - v0) / 2, glow.c, glow.layer, glow.kind);
      }
      for (let i = 0; i < seg; i++) mb.tri(base, base + 1 + i, base + 2 + i);
    };
    const rect = (x, y, hw, hh, u0, v0, u1, v1) => mb.quad([x - hw, y - hh, gz, x + hw, y - hh, gz, x + hw, y + hh, gz, x - hw, y + hh, gz], Z, [u0, v1, u1, v1, u1, v0, u0, v0], glow.c, glow.layer, glow.kind);
    const D1 = [0, 0, 0.5, 0.5], D2 = [0.5, 0, 1, 0.5];
    if (I.gauges === 'round2') { disc(w.x - 0.068, gy, 0.058, ...D1); disc(w.x + 0.068, gy, 0.058, ...D2); }
    else if (I.gauges === 'round3') { disc(w.x, gy, 0.062, ...D1); disc(w.x - 0.12, gy - 0.01, 0.04, ...D2); disc(w.x + 0.12, gy - 0.01, 0.04, ...D2); }
    else if (I.gauges === 'round4') { disc(w.x - 0.05, gy, 0.046, ...D1); disc(w.x + 0.05, gy, 0.046, ...D2); disc(w.x - 0.135, gy - 0.012, 0.03, ...D2); disc(w.x + 0.135, gy - 0.012, 0.03, ...D2); }
    else if (I.gauges === 'ribbon') {
      rect(w.x, gy, 0.17, 0.04, 0, 0.56, 1, 0.78);
      for (const [x0, y0, x1, y1] of [[-0.18, 0.04, 0.18, 0.052], [-0.18, -0.052, 0.18, -0.04], [-0.18, -0.04, -0.17, 0.04], [0.17, -0.04, 0.18, 0.04]]) mb.box(w.x + x0, gy + y0, gz - 0.004, w.x + x1, gy + y1, gz + 0.006, chrome);
    } else rect(w.x, gy, 0.15, 0.06, 0, 0, 1, 0.5);
    if (I.strip) { const ys = yt - 0.11, zs = faceAt(ys); mb.box(-W2 + 0.04, ys - 0.012, zs - 0.01, W2 - 0.04, ys + 0.012, zs + 0.008, I.strip === 'wood' ? wood : chrome); }
    for (const x of [-0.11, 0.11]) {
      const vy = yt - 0.05, vz = faceAt(vy) + 0.004;
      mb.quad([x - 0.06, vy - 0.022, vz, x + 0.06, vy - 0.022, vz, x + 0.06, vy + 0.022, vz, x - 0.06, vy + 0.022, vz], Z, [0, 0, 1, 0, 1, 1, 0, 1], dark.c, dark.layer, dark.kind);
    }
    if (I.console) {
      const cy = yt - 0.12, fz = faceAt(cy), rz = s.z - 0.1;
      obox(mb, [0, (fl + cy) / 2, fz + 0.07], X, Y, Z, [0.11, (cy - fl) / 2, 0.08], dash);
      if (rz > fz + 0.2) obox(mb, [0, fl + 0.09, (fz + 0.15 + rz) / 2], X, Y, Z, [0.09, 0.09, (rz - fz - 0.15) / 2], dash);
      const ry = cy - 0.07, rzz = fz + 0.152;
      mb.quad([-0.085, ry - 0.025, rzz, 0.085, ry - 0.025, rzz, 0.085, ry + 0.025, rzz, -0.085, ry + 0.025, rzz], Z, [0, 0, 1, 0, 1, 1, 0, 1], dark.c, dark.layer, dark.kind);
    }
    const gx = I.bench || M.rows ? s.x + 0.32 : 0, gzl = s.z - 0.38, gb = I.console ? fl + 0.18 : fl + 0.05, gt = s.y + 0.3;
    obox(mb, [gx, (gb + gt) / 2, gzl], X, Y, Z, [0.008, (gt - gb) / 2, 0.008], dark);
    obox(mb, [gx, gt + 0.02, gzl], X, Y, Z, [0.022, 0.025, 0.022], dark);
    const n = [0, Math.sin(w.tilt), Math.cos(w.tilt)], cu = [0, Math.cos(w.tilt), -Math.sin(w.tilt)];
    obox(mb, [w.x - n[0] * 0.16, w.y - n[1] * 0.16, w.z - n[2] * 0.16], X, cu, n, [0.04, 0.05, 0.12], dark);
    const roofX = (S, x) => {
      const ax = Math.abs(x);
      for (let k = 9; k > 7; k--) { const p0 = S[k], q = S[k - 1]; if (ax >= p0[0] && ax <= q[0]) return lerp(p0[1], q[1], (ax - p0[0]) / ((q[0] - p0[0]) || 1)); }
      return S[7][1];
    };
    const SA = stations(M, 0).A;
    const secAt = a => {
      let j = 1;
      while (j < SA.length - 1 && SA[j] < a) j++;
      const sa = SA[j - 1], sb = SA[j], t = sb > sa ? Math.min(1, Math.max(0, (a - sa) / (sb - sa))) : 0, S0 = section(M, sa), S1 = section(M, sb);
      return S0.map((q, i) => [lerp(q[0], S1[i][0], t), lerp(q[1], S1[i][1], t)]);
    };
    const a0 = M.ws[2] + 0.04, a1 = M.bw[0] - 0.04, rows = [];
    for (let k = 0; k <= 3; k++) {
      const aa = lerp(a0, a1, k / 3), S = secAt(aa), xe = S[7][0] - 0.04;
      rows.push([-xe, -S[8][0], 0, S[8][0], xe].map(x => [x, roofX(S, x) - 0.035, aa + M.zOff]));
    }
    for (let k = 0; k < 3; k++) for (let i = 0; i < 4; i++) {
      const p0 = rows[k][i], p1 = rows[k][i + 1], q0 = rows[k + 1][i], q1 = rows[k + 1][i + 1];
      mb.quad([...p0, ...p1, ...q1, ...q0], [0, -1, 0], [0, 0, 1, 0, 1, 1, 0, 1], head.c, head.layer, head.kind);
    }
    const Sv = secAt(M.ws[2] + 0.05), zv = M.ws[2] + M.zOff + 0.05;
    for (const x of [-0.34, 0.34]) obox(mb, [x, roofX(Sv, 0.5) - 0.05, zv + 0.085], X, Y, Z, [0.16, 0.012, 0.085], visor);
    const ym = roofX(Sv, 0) - 0.06;
    obox(mb, [0, ym - 0.05, zv + 0.03], X, Y, Z, [0.11, 0.028, 0.012], dark);
    obox(mb, [0, ym - 0.01, zv + 0.03], X, Y, Z, [0.008, 0.02, 0.008], dark);
    return mb;
  }

  const STEER = {
    two: { t: 0.085, spokes: [-0.28, Math.PI + 0.28], sw: 0.05, hub: [0.34, 0.26], ring: 0 },
    twoPad: { t: 0.09, spokes: [-0.2, Math.PI + 0.2], sw: 0.07, hub: [0.56, 0.36], ring: 0 },
    ring: { t: 0.065, spokes: [-0.3, Math.PI + 0.3], sw: 0.045, hub: [0.28, 0.22], ring: 0.66 },
    samara: { t: 0.1, spokes: [-0.55, Math.PI + 0.55], sw: 0.12, hub: [0.62, 0.42], ring: 0 },
    three: { t: 0.08, spokes: [0, Math.PI, -Math.PI / 2], sw: 0.05, hub: [0.3, 0.3], ring: 0 },
    four: { t: 0.1, spokes: [-0.45, 0.45, Math.PI - 0.45, Math.PI + 0.45], sw: 0.05, hub: [0.42, 0.36], ring: 0 },
    airbag: { t: 0.12, spokes: [-0.5, 0.5, Math.PI - 0.5, Math.PI + 0.5], sw: 0.06, hub: [0.64, 0.54], ring: 0 },
    bus: { t: 0.06, spokes: [-0.15, Math.PI + 0.15], sw: 0.04, hub: [0.26, 0.2], ring: 0 }
  };
  const STEERS = new Map();
  function steerMesh(style) {
    if (STEERS.has(style)) return STEERS.get(style);
    const S = STEER[style] || STEER.two, mb = new N.MB(512), rim = { layer: T('trim'), kind: K.TRIM, c: [30, 30, 32, 255] };
    const torus = (R, t, m, seg) => {
      const path = [], prof = [];
      for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a); path.push({ p: [c * R, sn * R, 0], o: [c, sn, 0], u: [0, 0, 1] }); }
      for (let k = 0; k <= 6; k++) { const q = k / 6 * Math.PI * 2; prof.push([Math.cos(q) * t, Math.sin(q) * t]); }
      sweep(mb, path, prof, m);
    };
    torus(1, S.t, rim, 18);
    if (S.ring) torus(S.ring, 0.022, mat('chrome'), 16);
    const hx = S.hub[0] / 2, hy = S.hub[1] / 2;
    for (const a of S.spokes) {
      const c = Math.cos(a), sn = Math.sin(a), r0 = Math.min(hx / Math.max(Math.abs(c), 0.01), hy / Math.max(Math.abs(sn), 0.01)) * 0.9;
      tube(mb, [c * r0, sn * r0, -0.07], [c * (1 - S.t * 0.6), sn * (1 - S.t * 0.6), 0], S.sw, rim, 4);
    }
    mb.box(-hx, -hy, -0.12, hx, hy, 0.05, rim);
    STEERS.set(style, mb);
    return mb;
  }

  function dome(mb, x, y, z, r, h, base, lens, lod) {
    const seg = [12, 8, 5][lod || 0];
    const lathe = (prof, m) => {
      const np = prof.length, b0 = mb.nv;
      mb.ensure((seg + 1) * np, seg * (np - 1) * 6);
      for (let i = 0; i <= seg; i++) {
        const t = i / seg * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t);
        for (const [pr, py, nr, ny] of prof) mb.v(x + c * pr, y + py, z + sn * pr, c * nr, ny, sn * nr, i / seg, py / (h + 0.03), m.c, m.layer, m.kind);
      }
      for (let i = 0; i < seg; i++) for (let k = 0; k + 1 < np; k++) { const a = b0 + i * np + k; mb.tri(a, a + np, a + np + 1); mb.tri(a, a + np + 1, a + 1); }
    };
    if (!lod) lathe([[0, 0.002, 0, 1], [r * 1.25, 0.002, 0, 1], [r * 1.25, 0.022, 1, 0], [r * 1.1, 0.03, 0.4, 0.9], [0, 0.03, 0, 1]], base);
    lathe(lod === 2 ? [[r, 0.03, 1, 0], [r * 0.7, 0.03 + h, 0.5, 0.8], [0, 0.03 + h, 0, 1]] : [[r, 0.03, 1, 0], [r, 0.03 + h * 0.6, 1, 0.1], [r * 0.85, 0.03 + h * 0.88, 0.7, 0.7], [r * 0.4, 0.03 + h, 0.3, 0.95], [0, 0.03 + h, 0, 1]], lens);
  }

  function sideDecal(M, out, key, a, y, w, h, toDoor) {
    const A = N.ATLAS_MAP, uv = A && A[key];
    if (!uv) return;
    const sec = section(M, a), z = a + M.zOff;
    for (const side of [1, -1]) {
      const x = side * (sideX(sec, y) + 0.008), za = z + side * w / 2, zb = z - side * w / 2;
      (toDoor ? out.doors[side < 0 ? 0 : 1].mb : out.mb).quad([x, y - h / 2, za, x, y - h / 2, zb, x, y + h / 2, zb, x, y + h / 2, za], [side, 0, 0], [uv[0], uv[3], uv[2], uv[3], uv[2], uv[1], uv[0], uv[1]], WHITE, 0, K.ATLAS);
    }
  }

  function paintLivery(M, G, out, liv, lod) {
    const LK = N.CarKit.LK, A = N.ATLAS_MAP;
    if (liv.stripe) {
      out.mats.stripe = { layer: T('white'), kind: 0, c: N.rgb(liv.stripe) };
      sideBand(M, G, out, M.stripe[0], M.stripe[1], M.front + 0.05, M.rear - 0.05, 'stripe', 0.004, true, lod);
    }
    if (liv.text) {
      if (M.textA !== null) sideDecal(M, out, 'text|' + liv.text, M.textA, M.textY, M.textW, M.textW * 0.19, false);
      else sideDecal(M, out, 'text|' + liv.text, (M.door[0] + M.door[1]) / 2, liv.checker && M.checkerY !== null ? M.checkerY - 0.17 : M.textY, 0.78, 0.15, true);
    }
    if (liv.checker && M.checkerY !== null) sideDecal(M, out, 'checker', (M.door[0] + M.door[1]) / 2, M.checkerY, 0.9, 0.13, true);
    if (liv.cross && M.crossA !== null) sideDecal(M, out, 'cross', M.crossA, M.crossY, 0.42, 0.42, false);
    if (liv.grille && lod === 0) {
      const bar = out.mat('steel'), at = (S, f, side) => [side * (lerp(S[5][0], S[6][0], f) + 0.015), lerp(S[5][1], S[6][1], f)];
      for (const [w0, w1, t] of M.win) {
        if (t !== 'glass' || w0 < 0) continue;
        for (const side of [1, -1]) {
          for (let aa = w0 + 0.08; aa < w1 - 0.04; aa += 0.16) {
            const S = section(M, aa), p0 = at(S, 0.02, side), p1 = at(S, 0.98, side), zc = aa + M.zOff;
            out.mb.quad([p0[0], p0[1], zc - 0.009, p0[0], p0[1], zc + 0.009, p1[0], p1[1], zc + 0.009, p1[0], p1[1], zc - 0.009], [side, 0.1, 0], [0, 0, 1, 0, 1, 1, 0, 1], bar.c, bar.layer, bar.kind);
          }
          const S0 = section(M, w0), S1 = section(M, w1);
          for (const f of [0.34, 0.67]) {
            const q0 = at(S0, f, side), q1 = at(S1, f, side);
            out.mb.quad([q0[0], q0[1] - 0.009, w0 + M.zOff, q1[0], q1[1] - 0.009, w1 + M.zOff, q1[0], q1[1] + 0.009, w1 + M.zOff, q0[0], q0[1] + 0.009, w0 + M.zOff], [side, 0.1, 0], [0, 0, 1, 0, 1, 1, 0, 1], bar.c, bar.layer, bar.kind);
          }
        }
      }
    }
    const a = M.beaconA, z = a + M.zOff, y = M.roof(a) + 0.005, lens = T('lamplens'), blue = { layer: lens, kind: LK.BLUE, c: [60, 90, 255, 255] };
    if (liv.beacon === 'bar' || liv.beacon === 'dps') {
      const red = { layer: lens, kind: LK.RED, c: [255, 50, 40, 255] };
      out.mb.box(-0.56, y - 0.02, z - 0.13, 0.56, y + 0.05, z + 0.13, out.mat('steel'));
      if (lod === 0) out.mb.box(-0.15, y + 0.05, z - 0.08, 0.15, y + 0.15, z + 0.07, out.mat('black'));
      for (const s of [-1, 1]) dome(out.mb, s * 0.38, y + 0.03, z, 0.085, 0.12, out.mat('black'), s > 0 && liv.beacon === 'dps' ? red : blue, lod);
      out.beacon = { p: [0, y + 0.22, z], blue: liv.beacon === 'bar' };
    }
    if (liv.beacon === 'magnet' || liv.beacon === 'dome') {
      const mg = liv.beacon === 'magnet', ba = mg ? M.ws[2] + 0.3 : M.beaconA, bx = mg ? -M.W * 0.19 : 0, by = M.roof(ba) + (mg ? 0 : 0.005);
      dome(out.mb, bx, by, ba + M.zOff, mg ? 0.065 : 0.085, mg ? 0.1 : 0.13, out.mat('black'), blue, lod);
      out.beacon = { p: [bx, by + 0.2, ba + M.zOff], blue: true };
    }
    if (liv.beacon === 'taxi') {
      out.mb.box(-0.3, y - 0.01, z - 0.12, 0.3, y + 0.2, z + 0.12, { layer: T('white'), kind: 0, c: [240, 220, 60, 255] });
      const uv = A && A.checker;
      if (uv) for (const dz of [-1, 1]) {
        const zz = z + dz * 0.122;
        out.mb.quad(dz < 0 ? [0.28, y + 0.02, zz, -0.28, y + 0.02, zz, -0.28, y + 0.18, zz, 0.28, y + 0.18, zz] : [-0.28, y + 0.02, zz, 0.28, y + 0.02, zz, 0.28, y + 0.18, zz, -0.28, y + 0.18, zz], [0, 0, dz], [uv[0], uv[3], uv[2], uv[3], uv[2], uv[1], uv[0], uv[1]], WHITE, 0, K.ATLAS);
      }
      out.mb.box(0.1, y + 0.2, z - 0.05, 0.2, y + 0.28, z + 0.05, { layer: lens, kind: LK.TAXI, c: [60, 255, 90, 255] });
    }
  }

  const WHEELS = new Map();
  function wheelMesh(style, hw, lod, rim) {
    const key = style + '|' + hw.toFixed(3) + '|' + lod + '|' + (rim || 'steel');
    if (WHEELS.has(key)) return WHEELS.get(key);
    const seg = [16, 9, 6][lod], mb = new N.MB(256);
    const tyre = mat('tyre'), dark = mat('dark'), chrome = mat('chrome'), steel = mat(rim || 'steel'), rubber = mat('rubber');
    const lathe = (prof, m, uScale) => {
      const np = prof.length;
      mb.ensure((seg + 1) * np, seg * (np - 1) * 6);
      const base = mb.nv;
      const pn = prof.map((q, k) => {
        const a = prof[Math.max(0, k - 1)], b = prof[Math.min(np - 1, k + 1)];
        const dx = b[0] - a[0], dr = b[1] - a[1], l = Math.hypot(dx, dr) || 1;
        return [dr / l, -dx / l];
      });
      for (let i = 0; i <= seg; i++) {
        const t = i / seg * Math.PI * 2, ct = Math.cos(t), st = Math.sin(t);
        for (let k = 0; k < np; k++) {
          const q = prof[k], nn = pn[k];
          mb.v(q[0], ct * q[1], st * q[1], -nn[0], -nn[1] * ct, -nn[1] * st, uScale ? i / seg * uScale : 0.5 + 0.5 * ct * q[1], uScale ? k / (np - 1) : 0.5 + 0.5 * st * q[1], m.c, m.layer, m.kind);
        }
      }
      for (let i = 0; i < seg; i++) for (let k = 0; k + 1 < np; k++) {
        const a = base + i * np + k;
        mb.tri(a, a + np, a + np + 1);
        mb.tri(a, a + np + 1, a + 1);
      }
    };
    const fan = (x, r, m, nx) => {
      mb.ensure(seg + 2, seg * 3);
      const c = mb.v(x, 0, 0, nx, 0, 0, 0.5, 0.5, m.c, m.layer, m.kind), base = mb.nv;
      for (let i = 0; i <= seg; i++) { const t = i / seg * Math.PI * 2; mb.v(x, Math.cos(t) * r, Math.sin(t) * r, nx, 0, 0, 0.5 + 0.5 * Math.cos(t), 0.5 + 0.5 * Math.sin(t), m.c, m.layer, m.kind); }
      for (let i = 0; i < seg; i++) mb.tri(c, base + i, base + i + 1);
    };
    if (lod === 2) {
      lathe([[-hw, 0.84], [-hw * 0.7, 1], [hw * 0.7, 1], [hw, 0.84]], tyre, 4);
      fan(hw * 0.95, 0.84, tyre, 1);
      fan(hw * 0.97, 0.58, style === 'truck' || style === 'steel' || style.startsWith('alloy') ? steel : chrome, 1);
      fan(-hw, 0.84, dark, -1);
      WHEELS.set(key, mb);
      return mb;
    }
    lathe(lod ? [[-hw, 0.84], [-hw * 0.7, 1], [hw * 0.7, 1], [hw, 0.84]] : [[-hw, 0.82], [-hw * 0.88, 0.96], [-hw * 0.55, 1], [hw * 0.55, 1], [hw * 0.88, 0.96], [hw, 0.82]], tyre, 4);
    lathe(lod ? [[hw, 0.84], [hw * 0.9, 0.6]] : [[hw, 0.82], [hw * 0.98, 0.7], [hw * 0.9, 0.6]], tyre, 4);
    if (lod) fan(-hw, 0.84, dark, -1);
    else lathe([[-hw * 0.9, 0.6], [-hw * 0.98, 0.7], [-hw, 0.82]], tyre, 4);
    if (style === 'truck') {
      lathe([[hw * 0.9, 0.6], [hw * 0.7, 0.57], [hw * 0.45, 0.52]], steel);
      lathe([[hw * 0.45, 0.52], [hw * 0.5, 0.3], [hw * 0.75, 0.24], [hw * 0.8, 0.14]], steel);
      if (lod === 0) for (let k = 0; k < 6; k++) {
        const t = k / 6 * Math.PI * 2, cy = Math.cos(t) * 0.36, cz = Math.sin(t) * 0.36, r = 0.04, x = hw * 0.49;
        mb.quad([x, cy - r, cz - r, x, cy + r, cz - r, x, cy + r, cz + r, x, cy - r, cz + r], [1, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], dark.c, dark.layer, dark.kind);
      }
      fan(hw * 0.8, 0.14, dark, 1);
      if (!lod) fan(-hw * 0.9, 0.6, dark, -1);
      WHEELS.set(key, mb);
      return mb;
    }
    if (!lod) fan(-hw * 0.9, 0.6, dark, -1);
    if (style.startsWith('alloy')) {
      const nh = parseInt(style.slice(5), 10) || 5;
      lathe([[hw * 0.9, 0.6], [hw * 1.0, 0.585], [hw * 0.96, 0.54], [hw * 0.82, 0.5], [hw * 0.8, 0.2], [hw * 0.92, 0.13]], steel);
      if (lod === 0) for (let k = 0; k < nh; k++) {
        const t = (k + 0.5) / nh * Math.PI * 2, h = Math.PI / nh * 0.5, x = hw * 0.83, r0 = 0.25, r1 = 0.47;
        const P = (ang, r) => [x, Math.cos(ang) * r, Math.sin(ang) * r];
        mb.quad([].concat(P(t - h * 0.7, r0), P(t + h * 0.7, r0), P(t + h, r1), P(t - h, r1)), [1, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], dark.c, dark.layer, dark.kind);
      }
      fan(hw * 0.92, 0.13, chrome, 1);
    } else if (style === 'steel') {
      lathe([[hw * 0.9, 0.6], [hw * 0.95, 0.56], [hw * 0.82, 0.5], [hw * 0.7, 0.36], [hw * 0.76, 0.22]], steel);
      if (lod === 0) {
        for (let k = 0; k < 4; k++) {
          const t = k / 4 * Math.PI * 2 + Math.PI / 4, cy = Math.cos(t) * 0.43, cz = Math.sin(t) * 0.43, r = 0.045, x = hw * 0.77;
          mb.quad([x, cy - r, cz - r, x, cy + r, cz - r, x, cy + r, cz + r, x, cy - r, cz + r], [1, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], dark.c, dark.layer, dark.kind);
        }
      }
      lathe([[hw * 0.76, 0.22], [hw * 0.95, 0.15], [hw * 1.02, 0.06]], chrome);
      fan(hw * 1.02, 0.06, chrome, 1);
    } else {
      lathe([[hw * 0.9, 0.6], [hw * 1.02, 0.57], [hw * 1.1, 0.42], [hw * 1.16, 0.2]], chrome);
      if (style === 'cap2') { lathe([[hw * 1.16, 0.2], [hw * 1.17, 0.13]], rubber); fan(hw * 1.17, 0.13, chrome, 1); }
      else fan(hw * 1.16, 0.2, chrome, 1);
    }
    WHEELS.set(key, mb);
    return mb;
  }

  function screenBar(M, out, front) {
    const m = out.mat(front ? M.wsFrame || 'black' : M.bwFrame || 'black'), w = (front ? M.wsBar : M.bwBar) / 2, ws = M.ws, bw = M.bw;
    const a0 = front ? ws[0] : bw[0], a1 = front ? ws[2] : bw[2], path = [];
    const ya = gTop(M, a0, 0), yb = gTop(M, a1, 0), da = a1 - a0, dy = yb - ya, l = Math.hypot(da, dy) || 1, na = -dy / l, ny = da / l;
    for (let k = 0; k <= 3; k++) {
      const a = lerp(a0, a1, k / 3), y = gTop(M, a, 0);
      path.push({ p: [0, y + ny * 0.007, a + na * 0.007 + M.zOff], o: [1, 0, 0], u: [0, ny, na] });
    }
    sweep(out.mb, path, [[-w, 0], [w, 0]], m);
  }

  function partKit(M, out, lod, liv) {
    const pk = {
      lod, liv, M, out, z: a => a + M.zOff,
      mat: name => out.mat(name),
      box(a0, y0, x0, a1, y1, x1, mn, both) {
        const m = typeof mn === 'string' ? out.mat(mn) : mn, za = a0 + M.zOff, zb = a1 + M.zOff;
        if (both) for (const s of [1, -1]) out.mb.box(Math.min(s * x0, s * x1), Math.min(y0, y1), Math.min(za, zb), Math.max(s * x0, s * x1), Math.max(y0, y1), Math.max(za, zb), m);
        else out.mb.box(Math.min(x0, x1), Math.min(y0, y1), Math.min(za, zb), Math.max(x0, x1), Math.max(y0, y1), Math.max(za, zb), m);
      },
      sweepA(pts, prof, mn, side) {
        const path = pts.map((q, i) => {
          const pa = pts[Math.max(0, i - 1)], pb = pts[Math.min(pts.length - 1, i + 1)];
          const ta = pb[0] - pa[0], ty = pb[1] - pa[1], l = Math.hypot(ta, ty) || 1;
          return { p: [0, q[1], q[0] + M.zOff], o: [side, 0, 0], u: [0, ta / l, -ty / l] };
        });
        sweep(out.mb, path, prof, typeof mn === 'string' ? out.mat(mn) : mn);
      },
      quadA(pts, nrm, mn) {
        const m = typeof mn === 'string' ? out.mat(mn) : mn;
        out.mb.quad([].concat(...pts.map(q => [q[0], q[1], q[2] + M.zOff])), nrm, [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
      },
      wheel(a, y, x, yaw) {
        out.mb.append(wheelMesh(M.wheel, M.tyre[1] / 2 / M.tyre[0], lod, M.rim), x, y, a + M.zOff, yaw, M.tyre[0]);
      },
      cargo(c) { out.cargo = c; }
    };
    return pk;
  }

  function build(spec, livery, lod) {
    const M = resolve(spec);
    const liv = livery && spec.liveries ? spec.liveries[livery] : null;
    const kit = N.CarKit, out = makeOut(M);
    const st = stations(M, lod), A = st.A;
    const G = { A, mask: st.mask, S: A.map(a => section(M, a)), Z: A.map(a => a + M.zOff) };
    out.cargo = null;
    out.beacon = null;
    out.rear = null;
    loft(M, G, out, lod);
    caps(M, G, out);
    if (lod < 2) { arches(M, out, lod); underbody(M, out); }
    const parts = [];
    M.face(faceKit(M, out, parts, true, lod));
    M.tail(faceKit(M, out, parts, false, lod));
    bumpers(M, out, lod);
    const pz = M.plateZ || [M.bumper.f - 0.016, M.rear + 0.007];
    const plates = [kit.plateMatrix(0, M.plates[0], pz[0] + M.zOff, true), kit.plateMatrix(0, M.plates[1], pz[1] + M.zOff, false)];
    kit.shapeAt(out.mb, [0, M.plates[1] + kit.PLATE_H / 2 + 0.018, pz[1] + M.zOff + 0.002], [1, 0, 0], [0, 1, 0], [0, 0, 1], { w: 0.16, h: 0.02 }, kit.LAMP_COL[kit.LK.PLATE], T('lamplens'), kit.LK.PLATE);
    if (lod < 2) {
      mirrors(M, out, lod);
      if (lod === 0) doorInner(M, out);
      if (lod === 1) interior(M, spec, out, liv);
      if (lod === 0 || M.moldings.length && (M.moldings[0].m === 'chrome' || M.moldings[0].m === 'clad')) moldings(M, G, out, lod);
      panels(M, out, lod);
    }
    if (lod === 0) {
      handles(M, out);
      seams(M, out);
      frames(M, G, out);
      screenFrames(M, out);
      wipers(M, out);
      if (M.vent) vents(M, out);
    }
    if (M.wsBar && lod < 2) screenBar(M, out, true);
    if (M.bwBar && lod < 2) screenBar(M, out, false);
    if (M.extra) M.extra(partKit(M, out, lod, liv), lod);
    if (liv) paintLivery(M, G, out, liv, lod);
    kit.bakeWear([out.mb, out.doors[0].mb, out.doors[1].mb], { hw: M.W / 2, L: M.L, clr: M.floorY, belt: M.belt(M.wb / 2), wz: M.axZ, wr: M.tyre[0], ra: M.arches.length ? M.arches[0].r : M.tyre[0] + 0.1 });
    const cab = N.cabin(spec);
    const wheels = [];
    for (let i = 0; i < 2; i++) for (const sx of [-1, 1]) {
      const tx = M.track[i] / 2;
      if (i === 1 && M.dual) for (const o of [-1, 1]) wheels.push({ x: sx * (tx + o * M.dual / 2), y: M.tyre[0], z: M.axZ[i], r: M.tyre[0], front: false, sx });
      else if (i === 1 && M.tandem) for (const o of [-1, 1]) wheels.push({ x: sx * tx, y: M.tyre[0], z: M.axZ[i] + o * M.tandem / 2, r: M.tyre[0], front: false, sx });
      else wheels.push({ x: sx * tx, y: M.tyre[0], z: M.axZ[i], r: M.tyre[0], front: i === 0, sx });
    }
    return {
      mb: out.mb, gl: out.gl, wheels, wheel: wheelMesh(M.wheel, M.tyre[1] / 2 / M.tyre[0], lod, M.rim), seat: cab.seat, H: spec.shape.H, cab, lod,
      doors: [-1, 1].map((sx, k) => ({ mb: out.doors[k].mb, gl: out.doors[k].gl, hx: sx * M.wide(M.door[0]), hz: M.door[0] + M.zOff, sx })),
      lamps: kit.lampAnchors(parts, 0.05), plates, cargo: out.cargo, beacon: out.beacon, rear: out.rear || null, steer: M.inside.steer, trims: liv && liv.beacon && liv.beacon !== 'taxi' ? 1 : M.inside.seats.length
    };
  }

  function tube(mb, a, b, r, m, seg) {
    const t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(t[0], t[1], t[2]) || 1;
    for (let i = 0; i < 3; i++) t[i] /= l;
    const o0 = Math.abs(t[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], d = o0[0] * t[0] + o0[1] * t[1] + o0[2] * t[2];
    const o = [o0[0] - d * t[0], o0[1] - d * t[1], o0[2] - d * t[2]], ol = Math.hypot(o[0], o[1], o[2]);
    for (let i = 0; i < 3; i++) o[i] /= ol;
    const u = [t[1] * o[2] - t[2] * o[1], t[2] * o[0] - t[0] * o[2], t[0] * o[1] - t[1] * o[0]];
    const prof = [];
    for (let k = 0; k <= seg; k++) { const q = k / seg * Math.PI * 2; prof.push([Math.cos(q) * r, Math.sin(q) * r]); }
    sweep(mb, [{ p: a, o, u }, { p: b, o, u }], prof, m);
  }

  const BIKE_WHEELS = new Map();
  function bikeWheel(hw, lod) {
    const key = hw.toFixed(3) + '|' + (lod ? 1 : 0);
    if (BIKE_WHEELS.has(key)) return BIKE_WHEELS.get(key);
    const seg = lod ? 10 : 18, mb = new N.MB(512), tyre = mat('tyre'), chrome = mat('chrome'), hub = mat('alloy'), dark = mat('dark');
    const lathe = (prof, m) => {
      const np = prof.length, base = mb.nv;
      mb.ensure((seg + 1) * np, seg * (np - 1) * 6);
      const pn = prof.map((q, k) => {
        const a = prof[Math.max(0, k - 1)], b = prof[Math.min(np - 1, k + 1)], dx = b[0] - a[0], dr = b[1] - a[1], l = Math.hypot(dx, dr) || 1;
        return [dr / l, -dx / l];
      });
      for (let i = 0; i <= seg; i++) {
        const t = i / seg * Math.PI * 2, ct = Math.cos(t), st = Math.sin(t);
        for (let k = 0; k < np; k++) mb.v(prof[k][0], ct * prof[k][1], st * prof[k][1], -pn[k][0], -pn[k][1] * ct, -pn[k][1] * st, i / seg * 4, k / (np - 1), m.c, m.layer, m.kind);
      }
      for (let i = 0; i < seg; i++) for (let k = 0; k + 1 < np; k++) { const a = base + i * np + k; mb.tri(a, a + np, a + np + 1); mb.tri(a, a + np + 1, a + 1); }
    };
    lathe([[-hw, 0.8], [-hw * 0.9, 0.93], [-hw * 0.5, 1], [hw * 0.5, 1], [hw * 0.9, 0.93], [hw, 0.8], [hw * 0.75, 0.76]], tyre);
    lathe([[-hw * 0.75, 0.76], [-hw, 0.8]], tyre);
    lathe([[hw * 0.75, 0.76], [hw * 0.55, 0.72], [-hw * 0.55, 0.72], [-hw * 0.75, 0.76]], chrome);
    lathe([[-0.32, 0.1], [-0.32, 0.27], [-0.2, 0.3], [0.2, 0.3], [0.32, 0.27], [0.32, 0.1]], hub);
    for (let k = 0; k < (lod ? 0 : 20); k++) {
      const t = k / 20 * Math.PI * 2, t2 = t + 0.32, x0 = (k % 2 ? 1 : -1) * 0.24, x1 = (k % 2 ? 1 : -1) * 0.04, w = 0.012;
      const p0 = [x0, Math.cos(t) * 0.28, Math.sin(t) * 0.28], p1 = [x1, Math.cos(t2) * 0.72, Math.sin(t2) * 0.72];
      mb.quad([p0[0], p0[1] - w, p0[2], p0[0], p0[1] + w, p0[2], p1[0], p1[1] + w, p1[2], p1[0], p1[1] - w, p1[2]], [1, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], dark.c, dark.layer, dark.kind);
    }
    BIKE_WHEELS.set(key, mb);
    return mb;
  }

  function bikeKit(mb, zF, ox) {
    const P = (a, y, x) => [ox + (x || 0), y, zF + a];
    const box = (a0, y0, x0, a1, y1, x1, mm, both) => {
      for (const sd of both ? [1, -1] : [1]) mb.box(ox + Math.min(sd * x0, sd * x1), Math.min(y0, y1), zF + Math.min(a0, a1), ox + Math.max(sd * x0, sd * x1), Math.max(y0, y1), zF + Math.max(a0, a1), mm);
    };
    const arc = (ca, cy, r, t0, t1, n, w, mm, xc) => {
      const pts = [];
      for (let k = 0; k <= n; k++) { const t = t0 + (t1 - t0) * k / n; pts.push([ca - r * Math.cos(t), cy + r * Math.sin(t)]); }
      const path = pts.map((q, i) => {
        const pa = pts[Math.max(0, i - 1)], pb = pts[Math.min(pts.length - 1, i + 1)], ta = pb[0] - pa[0], ty = pb[1] - pa[1], l = Math.hypot(ta, ty) || 1;
        return { p: [ox + (xc || 0), q[1], zF + q[0]], o: [1, 0, 0], u: [0, ta / l, -ty / l] };
      });
      sweep(mb, path, [[w, -0.015], [w, 0], [-w, 0], [-w, -0.015]], mm);
    };
    const shell = (secs, mm, xc) => {
      const x0 = ox + (xc || 0);
      const rings = secs.map(([a, hx, y0, y1, r]) => {
        const k = 0.2929 * r;
        return {
          a, c: (y0 + y1) / 2,
          pts: [[hx - r, y1, 0, 1], [hx - k, y1 - k, 0.7071, 0.7071], [hx, y1 - r, 1, 0], [hx, y0 + r, 1, 0], [hx - k, y0 + k, 0.7071, -0.7071], [hx - r, y0, 0, -1],
            [r - hx, y0, 0, -1], [k - hx, y0 + k, -0.7071, -0.7071], [-hx, y0 + r, -1, 0], [-hx, y1 - r, -1, 0], [k - hx, y1 - k, -0.7071, 0.7071], [r - hx, y1, 0, 1], [hx - r, y1, 0, 1]]
        };
      });
      const np = 13, base = mb.nv;
      mb.ensure(rings.length * np + 2 * (np + 1), (rings.length - 1) * (np - 1) * 6 + 2 * np * 3);
      for (const g of rings) for (const q of g.pts) mb.v(x0 + q[0], q[1], zF + g.a, q[2], q[3], 0, q[0] * 2, g.a * 2, mm.c, mm.layer, mm.kind);
      for (let i = 0; i + 1 < rings.length; i++) for (let k = 0; k + 1 < np; k++) { const a = base + i * np + k; mb.tri(a, a + np, a + np + 1); mb.tri(a, a + np + 1, a + 1); }
      for (const [g, nz] of [[rings[0], -1], [rings[rings.length - 1], 1]]) {
        const c = mb.v(x0, g.c, zF + g.a, 0, 0, nz, 0.5, 0.5, mm.c, mm.layer, mm.kind);
        for (const q of g.pts) mb.v(x0 + q[0], q[1], zF + g.a, 0, 0, nz, 0.5, 0.5, mm.c, mm.layer, mm.kind);
        for (let k = 0; k + 1 < np; k++) mb.tri(c, c + 1 + k, c + 2 + k);
      }
    };
    const side = (sd, pts, mm, xc) => mb.quad(pts.flatMap(q => P(q[0], q[1], (xc || 0) + sd * q[2])), [sd, 0, 0], [0, 1, 1, 1, 1, 0, 0, 0], mm.c, mm.layer, mm.kind);
    const disc = (sd, a, y, x, r, mm) => N.CarKit.shapeAt(mb, P(a, y, sd * x), [0, 0, 1], [0, 1, 0], [sd, 0, 0], { r, seg: 12 }, mm.c, mm.layer, mm.kind);
    return { P, box, arc, shell, side, disc };
  }

  function bike(spec, lod) {
    const sh = spec.shape, wb = sh.wb, R = sh.wr, zF = -wb / 2, mb = new N.MB(2048), gl = new N.MB(16), kit = N.CarKit, parts = [];
    const tb = (a, b, r, mm, seg) => tube(mb, a, b, r, mm, lod ? Math.max(4, seg >> 1) : seg);
    const m = name => mat(name);
    const paint = m('paint'), chrome = m('chrome'), frame = m('chassis'), black = m('black'), alloy = m('alloy'), leather = m('leather'), cast = m('cast');
    const { P, box, arc, shell, side, disc } = bikeKit(mb, zF, 0);
    for (const sd of [1, -1]) {
      tb(P(0, R, sd * 0.085), P(0.16, 0.62, sd * 0.085), 0.024, alloy, 8);
      tb(P(0.16, 0.62, sd * 0.085), P(0.31, 0.93, sd * 0.085), 0.03, black, 8);
      tb(P(1.06, 0.33, sd * 0.11), P(wb, R, sd * 0.11), 0.02, frame, 6);
      tb(P(wb - 0.04, 0.36, sd * 0.135), P(1.27, 0.72, sd * 0.135), 0.018, chrome, 6);
      tb(P(wb - 0.07, 0.43, sd * 0.135), P(1.31, 0.64, sd * 0.135), 0.03, chrome, 8);
      tb(P(1.0, 0.72, sd * 0.1), P(1.76, 0.7, sd * 0.1), 0.016, frame, 6);
      tb(P(1.05, 0.3, sd * 0.13), P(1.05, 0.3, sd * 0.25), 0.014, black, 6);
    }
    box(0.27, 0.9, 0.11, 0.35, 0.96, -0.11, black);
    tb(P(0.34, 0.9), P(1.02, 0.7), 0.022, frame, 6);
    tb(P(0.34, 0.86), P(0.62, 0.3), 0.022, frame, 6);
    tb(P(0.62, 0.22), P(1.1, 0.22), 0.02, frame, 6);
    tb(P(1.1, 0.22), P(1.02, 0.72), 0.02, frame, 6);
    const hb = [P(0.62, 0.99, -0.38), P(0.44, 1.03, -0.13), P(0.44, 1.03, 0.13), P(0.62, 0.99, 0.38)];
    for (let i = 0; i < 3; i++) tb(hb[i], hb[i + 1], 0.012, chrome, 6);
    tb(P(0.6, 0.995, -0.3), P(0.62, 0.99, -0.41), 0.018, black, 6);
    tb(P(0.6, 0.995, 0.3), P(0.62, 0.99, 0.41), 0.018, black, 6);
    if (!lod) for (const sd of [1, -1]) {
      tb(P(0.55, 1.01, sd * 0.26), P(0.5, 1.18, sd * 0.3), 0.007, chrome, 4);
      kit.shapeAt(mb, P(0.5, 1.2, sd * 0.3), [1, 0, 0], [0, 1, 0], [0, 0, 1], { r: 0.045, seg: 10 }, [214, 220, 226, 255], T('mirror'), K.CHROME);
    }
    box(0.24, 0.8, 0.075, 0.36, 0.96, -0.075, black);
    kit.shapeAt(mb, P(0.235, 0.88, 0), [1, 0, 0], [0, 1, 0], [0, 0, -1], { r: 0.088, seg: 14 }, chrome.c, chrome.layer, chrome.kind);
    kit.lampAt(mb, parts, P(0.23, 0.88, 0), [1, 0, 0], [0, 1, 0], [0, 0, -1], { r: 0.075, seg: 14 }, kit.LK.HEAD);
    box(0.3, 0.97, 0.05, 0.36, 1.02, -0.05, black);
    for (const sd of [1, -1]) {
      box(0.28, 0.82, sd * 0.13, 0.33, 0.86, sd * 0.2, black);
      kit.lampAt(mb, parts, P(0.275, 0.84, sd * 0.2), [1, 0, 0], [0, 1, 0], [0, 0, -1], { w: 0.05, h: 0.035 }, sd < 0 ? kit.LK.INDL : kit.LK.INDR);
      box(1.5, 0.64, sd * 0.09, 1.54, 0.67, sd * 0.16, black);
      kit.lampAt(mb, parts, P(1.545, 0.655, sd * 0.16), [1, 0, 0], [0, 1, 0], [0, 0, 1], { w: 0.05, h: 0.035 }, sd < 0 ? kit.LK.INDL : kit.LK.INDR);
    }
    shell([[0.34, 0.06, 0.78, 0.9, 0.03], [0.41, 0.125, 0.715, 0.94, 0.05], [0.6, 0.148, 0.7, 0.935, 0.06], [0.78, 0.13, 0.72, 0.905, 0.05], [0.87, 0.085, 0.75, 0.87, 0.03]], paint);
    shell([[0.84, 0.1, 0.755, 0.835, 0.03], [0.93, 0.13, 0.745, 0.85, 0.04], [1.5, 0.13, 0.755, 0.855, 0.04], [1.6, 0.115, 0.76, 0.845, 0.035]], leather);
    shell([[1.28, 0.1, 0.66, 0.76, 0.02], [1.6, 0.1, 0.63, 0.76, 0.02], [1.78, 0.09, 0.6, 0.755, 0.02]], paint);
    for (const sd of [1, -1]) {
      side(sd, [[0.6, 0.77, 0.151], [0.77, 0.775, 0.134], [0.77, 0.855, 0.134], [0.64, 0.868, 0.1475]], black);
      side(sd, [[0.44, 0.83, 0.132], [0.55, 0.83, 0.145], [0.55, 0.862, 0.145], [0.44, 0.862, 0.132]], black);
      side(sd, [[1.05, 0.52, 0.166], [1.24, 0.52, 0.166], [1.24, 0.556, 0.166], [1.05, 0.556, 0.166]], black);
      disc(sd, 0.86, 0.32, 0.123, 0.095, alloy);
    }
    box(0.98, 0.43, 0.11, 1.29, 0.66, 0.165, paint, true);
    box(0.95, 0.45, 0.1, 1.25, 0.66, -0.1, black);
    box(0.64, 0.2, 0.1, 1.06, 0.44, -0.1, cast);
    box(0.66, 0.22, 0.1, 1.02, 0.42, 0.122, cast, true);
    disc(-1, 0.72, 0.3, 0.123, 0.075, alloy);
    disc(1, 0.78, 0.33, 0.125, 0.075, chrome);
    box(0.585, 0.44, 0.075, 0.815, 0.66, -0.075, frame);
    for (let k = 0; k < (lod ? 3 : 6); k++) box(0.56, 0.455 + k * (lod ? 0.068 : 0.034), 0.1, 0.84, 0.469 + k * (lod ? 0.068 : 0.034), -0.1, cast);
    box(0.6, 0.66, 0.07, 0.8, 0.69, -0.07, cast);
    box(0.84, 0.42, 0.08, 0.98, 0.64, -0.08, black);
    box(0.83, 0.46, 0.06, 0.9, 0.55, 0.11, alloy);
    box(1.0, 0.3, -0.1, wb, 0.38, -0.12, black);
    arc(0, R, R + 0.045, 0.35, 2.35, 8, 0.065, chrome);
    arc(wb, R, R + 0.05, 1.05, 3.0, 9, 0.07, chrome);
    box(1.785, 0.17, 0.055, 1.8, 0.37, -0.055, black);
    kit.lampAt(mb, parts, P(1.782, 0.685, 0), [1, 0, 0], [0, 1, 0], [0, 0, 1], { w: 0.15, h: 0.085 }, kit.LK.TAIL);
    const ex = [P(0.6, 0.56, 0.06), P(0.54, 0.44, 0.1), P(0.56, 0.29, 0.13), P(0.66, 0.22, 0.15), P(0.88, 0.205, 0.16)];
    for (let i = 0; i < 4; i++) tb(ex[i], ex[i + 1], 0.024, chrome, 8);
    tb(P(0.86, 0.205, 0.16), P(1.74, 0.29, 0.16), 0.048, chrome, 10);
    kit.shapeAt(mb, P(0.86, 0.205, 0.16), [1, 0, 0], [0, 1, 0], [0, 0, -1], { r: 0.048, seg: 10 }, chrome.c, chrome.layer, chrome.kind);
    kit.shapeAt(mb, P(1.74, 0.29, 0.16), [1, 0, 0], [0, 1, 0], [0, 0, 1], { r: 0.048, seg: 10 }, chrome.c, chrome.layer, chrome.kind);
    kit.shapeAt(mb, P(1.741, 0.29, 0.16), [1, 0, 0], [0, 1, 0], [0, 0, 1], { r: 0.02, seg: 8 }, black.c, black.layer, black.kind);
    const cab = N.cabin(spec);
    return {
      mb, gl, wheel: bikeWheel(sh.tw / 2 / R, lod), seat: cab.seat, H: sh.H, bike: true, cab, lod: 0,
      wheels: [{ x: 0, y: R, z: zF, r: R, front: true, sx: 1 }, { x: 0, y: R, z: zF + wb, r: R, front: false, sx: 1 }],
      lamps: kit.lampAnchors(parts, 0.05), plates: [], cargo: null
    };
  }

  function ural(spec, livery, lod) {
    const sh = spec.shape, wb = sh.wb, R = sh.wr, zF = -wb / 2, ox = -sh.sidecar / 2, mb = new N.MB(4096), gl = new N.MB(64), kit = N.CarKit, parts = [];
    const tb = (a, b, r, mm, seg) => tube(mb, a, b, r, mm, lod ? Math.max(4, seg >> 1) : seg);
    const liv = livery && spec.liveries ? spec.liveries[livery] : null;
    const m = name => mat(name);
    const paint = m('paint'), chrome = m('chrome'), frame = m('chassis'), black = m('black'), alloy = m('alloy'), leather = m('leather'), cast = m('cast');
    const { P, box, arc, shell, side, disc } = bikeKit(mb, zF, ox);
    const sc = sh.sidecar, ws = 0.98, sa = 1.25;
    for (const sd of [1, -1]) {
      tb(P(0, R, sd * 0.1), P(0.14, 0.62, sd * 0.1), 0.026, alloy, 8);
      tb(P(0.14, 0.62, sd * 0.1), P(0.3, 0.98, sd * 0.1), 0.034, black, 8);
      tb(P(0.34, 0.92, sd * 0.1), P(0.56, 0.22, sd * 0.11), 0.022, frame, 6);
      tb(P(0.56, 0.22, sd * 0.11), P(1.12, 0.22, sd * 0.11), 0.022, frame, 6);
      tb(P(1.12, 0.22, sd * 0.11), P(1.15, 0.78, sd * 0.1), 0.02, frame, 6);
      tb(P(1.06, 0.34, sd * 0.11), P(wb, R, sd * 0.11), 0.022, frame, 6);
      tb(P(wb - 0.04, 0.38, sd * 0.14), P(1.28, 0.8, sd * 0.14), 0.03, chrome, 8);
      tb(P(1.15, 0.8, sd * 0.1), P(1.86, 0.76, sd * 0.1), 0.018, frame, 6);
      tb(P(0.92, 0.3, sd * 0.13), P(0.92, 0.3, sd * 0.28), 0.016, black, 6);
      for (let k = 0; k < (lod ? 2 : 5); k++) tb(P(0.6, 0.42, sd * (0.14 + k * (lod ? 0.12 : 0.05))), P(0.6, 0.42, sd * (0.155 + k * (lod ? 0.12 : 0.05))), 0.085, cast, 10);
      tb(P(0.6, 0.42, sd * 0.12), P(0.6, 0.42, sd * 0.38), 0.062, frame, 10);
      box(0.5, 0.33, sd * 0.37, 0.7, 0.52, sd * 0.46, cast);
      box(0.52, 0.36, sd * 0.455, 0.68, 0.5, sd * 0.47, alloy);
      const ex = [P(0.5, 0.4, sd * 0.42), P(0.46, 0.3, sd * 0.38), P(0.56, 0.24, sd * 0.3), P(1.05, 0.26, sd * 0.27)];
      for (let i = 0; i < 3; i++) tb(ex[i], ex[i + 1], 0.022, chrome, 8);
      tb(P(1.02, 0.27, sd * 0.27), P(1.8, 0.33, sd * 0.27), 0.045, chrome, 10);
      if (!lod) {
        kit.shapeAt(mb, P(1.801, 0.33, sd * 0.27), [1, 0, 0], [0, 1, 0], [0, 0, 1], { r: 0.045, seg: 10 }, chrome.c, chrome.layer, chrome.kind);
        kit.shapeAt(mb, P(1.802, 0.33, sd * 0.27), [1, 0, 0], [0, 1, 0], [0, 0, 1], { r: 0.018, seg: 8 }, black.c, black.layer, black.kind);
      }
    }
    tb(P(0.32, 0.92), P(1.2, 0.8), 0.026, frame, 6);
    box(0.55, 0.22, 0.13, 0.86, 0.5, -0.13, cast);
    box(0.86, 0.25, 0.1, 1.1, 0.5, -0.1, cast);
    box(0.7, 0.5, 0.07, 0.86, 0.6, -0.07, black);
    arc(0, R, R + 0.05, 0.25, 2.5, 9, 0.075, paint);
    arc(wb, R, R + 0.055, 0.9, 3.0, 9, 0.08, paint);
    shell([[0.36, 0.08, 0.84, 0.94, 0.03], [0.45, 0.16, 0.76, 0.98, 0.06], [0.7, 0.17, 0.75, 0.97, 0.07], [0.88, 0.12, 0.79, 0.92, 0.04]], paint);
    for (const sd of [1, -1]) side(sd, [[0.62, 0.79, 0.172], [0.82, 0.8, 0.13], [0.82, 0.88, 0.13], [0.66, 0.9, 0.168]], black);
    shell([[0.9, 0.12, 0.8, 0.86, 0.03], [1.0, 0.15, 0.8, 0.88, 0.04], [1.12, 0.13, 0.8, 0.87, 0.04], [1.18, 0.08, 0.81, 0.85, 0.03]], leather);
    for (const sd of [1, -1]) tb(P(1.14, 0.68, sd * 0.06), P(1.14, 0.8, sd * 0.06), 0.014, chrome, 6);
    shell([[1.3, 0.1, 0.81, 0.87, 0.02], [1.52, 0.1, 0.81, 0.87, 0.02]], leather);
    box(0.2, 0.86, 0.09, 0.34, 1.0, -0.09, black);
    kit.shapeAt(mb, P(0.195, 0.93, 0), [1, 0, 0], [0, 1, 0], [0, 0, -1], { r: 0.098, seg: 14 }, chrome.c, chrome.layer, chrome.kind);
    kit.lampAt(mb, parts, P(0.19, 0.93, 0), [1, 0, 0], [0, 1, 0], [0, 0, -1], { r: 0.085, seg: 14 }, kit.LK.HEAD);
    const hb = [P(0.48, 1.04, -0.4), P(0.36, 1.08, -0.15), P(0.36, 1.08, 0.15), P(0.48, 1.04, 0.4)];
    for (let i = 0; i < 3; i++) tb(hb[i], hb[i + 1], 0.013, chrome, 6);
    if (!lod) for (const sd of [1, -1]) {
      tb(P(0.46, 1.045, sd * 0.32), P(0.48, 1.04, sd * 0.43), 0.02, black, 6);
      tb(P(0.42, 1.06, sd * 0.28), P(0.38, 1.24, sd * 0.32), 0.007, chrome, 4);
      kit.shapeAt(mb, P(0.38, 1.26, sd * 0.32), [1, 0, 0], [0, 1, 0], [0, 0, 1], { r: 0.05, seg: 10 }, [214, 220, 226, 255], T('mirror'), K.CHROME);
    }
    box(1.84, 0.62, 0.06, 1.9, 0.7, -0.06, black);
    kit.lampAt(mb, parts, P(1.905, 0.66, 0), [1, 0, 0], [0, 1, 0], [0, 0, 1], { w: 0.1, h: 0.06 }, kit.LK.TAIL);
    shell([[0.42, 0.14, 0.42, 0.62, 0.06], [0.6, 0.33, 0.3, 0.72, 0.12], [1.0, 0.39, 0.28, 0.76, 0.12], [1.62, 0.39, 0.28, 0.76, 0.12], [1.96, 0.35, 0.32, 0.74, 0.1], [2.06, 0.28, 0.36, 0.7, 0.08]], paint, sc);
    box(1.08, 0.761, sc - 0.24, 1.62, 0.765, sc + 0.24, black);
    box(1.56, 0.7, sc - 0.22, 1.66, 1.0, sc + 0.22, leather);
    gl.quad([ox + sc - 0.24, 0.76, zF + 0.98, ox + sc + 0.24, 0.76, zF + 0.98, ox + sc + 0.22, 0.98, zF + 1.04, ox + sc - 0.22, 0.98, zF + 1.04], [0, 0.3, -0.95], [0, 1, 1, 1, 1, 0, 0, 0], [226, 232, 236, 255], T('carglass'), K.GLASS);
    for (const a of [0.62, 1.48]) tb(P(a, 0.3, 0.12), P(a, 0.3, sc - 0.3), 0.02, frame, 6);
    tb(P(0.9, 0.82, 0.14), P(0.9, 0.5, sc - 0.3), 0.016, frame, 6);
    arc(sa, R, R + 0.05, 0.6, 2.6, 7, 0.07, paint, sc);
    mb.append(bikeWheel(sh.tw / 2 / R, lod), ox + sc, 0.52, zF + 2.13, Math.PI / 2, R * 0.92);
    let beacon = null;
    if (liv && liv.stripe) {
      const sm = { layer: T('white'), kind: 0, c: N.rgb(liv.stripe) };
      shell([[0.66, 0.35, 0.57, 0.64, 0.01], [1.0, 0.397, 0.57, 0.64, 0.01], [1.62, 0.397, 0.57, 0.64, 0.01], [1.93, 0.365, 0.57, 0.64, 0.01]], sm, sc);
      const A = N.ATLAS_MAP, uv = liv.text && A && A['text|' + liv.text];
      if (uv) {
        const x = ox + sc + 0.396, za = zF + 1.2 + 0.25, zb = zF + 1.2 - 0.25;
        mb.quad([x, 0.42, za, x, 0.42, zb, x, 0.53, zb, x, 0.53, za], [1, 0, 0], [uv[0], uv[3], uv[2], uv[3], uv[2], uv[1], uv[0], uv[1]], WHITE, 0, K.ATLAS);
      }
    }
    if (liv && liv.beacon === 'pole') {
      tb(P(1.9, 0.74, sc - 0.2), P(1.9, 1.42, sc - 0.2), 0.012, chrome, 6);
      const p = P(1.9, 1.42, sc - 0.2);
      dome(mb, p[0], p[1], p[2], 0.07, 0.11, black, { layer: T('lamplens'), kind: kit.LK.BLUE, c: [60, 90, 255, 255] }, 0);
      beacon = { p: [p[0], p[1] + 0.15, p[2]], blue: true };
    }
    const cab = N.cabin(spec);
    return {
      mb, gl, wheel: bikeWheel(sh.tw / 2 / R, lod), seat: cab.seat, H: sh.H, bike: true, cab, lod: 0, beacon,
      wheels: [{ x: ox, y: R, z: zF, r: R, front: true, sx: 1 }, { x: ox, y: R, z: zF + wb, r: R, front: false, sx: 1 }, { x: ox + sc, y: R, z: zF + sa, r: R, front: false, sx: 1 }],
      lamps: kit.lampAnchors(parts, 0.05), plates: [], cargo: null
    };
  }

  const HELIS = {
    mi2: {
      nose: [[-3.62, 0.28, -0.3, 0.3, 0.22], [-3.4, 0.55, -0.82, 0.62, 0.32], [-2.95, 0.68, -0.95, 0.82, 0.3], [-2.55, 0.72, -1.0, 0.88, 0.3]],
      body: [[-2.6, 0.72, -1.0, 0.88, 0.3], [-0.5, 0.74, -1.0, 0.9, 0.28], [0.3, 0.5, -0.75, 0.75, 0.2], [0.7, 0.32, -0.3, 0.6, 0.12]],
      top: [[-2.3, 0.4, 0.86, 1.25, 0.15], [-1.6, 0.48, 0.86, 1.42, 0.2], [0.2, 0.46, 0.86, 1.4, 0.2], [0.75, 0.3, 0.86, 1.18, 0.12]],
      boom: [[0.5, 0.3, 0.32], [3.2, 0.42, 0.2], [6.1, 0.58, 0.12]], fin: [5.8, 6.25, 0.4, 1.7], stab: [4.7, 0.45, 0.85],
      hub: [0, 1.62, -0.85], blades: 3, rr: 7.25, chord: 0.38, tail: [0.22, 1.05, 6.05], tr: 1.35,
      gnose: [-2.75, -1.32], gmain: [-0.35, -1.32, 1.05], gr: 0.24, door: [-1.9, -0.9], text: [-0.2, 0.05, 1.4]
    },
    mi8: {
      nose: [[-9.05, 0.42, -0.55, 0.5, 0.3], [-8.7, 0.9, -1.2, 0.92, 0.45], [-8.2, 1.1, -1.4, 1.15, 0.45], [-7.7, 1.15, -1.45, 1.2, 0.45]],
      body: [[-7.75, 1.15, -1.45, 1.2, 0.45], [-1.0, 1.18, -1.45, 1.22, 0.4], [0.8, 1.1, -1.3, 1.2, 0.35], [1.7, 0.75, -0.6, 1.05, 0.3]],
      top: [[-7.0, 0.6, 1.2, 1.75, 0.2], [-6.0, 0.95, 1.2, 2.05, 0.3], [-0.2, 0.9, 1.2, 2.0, 0.3], [0.9, 0.55, 1.2, 1.6, 0.2]],
      boom: [[1.4, 0.55, 0.55], [5.5, 0.85, 0.36], [9.2, 1.2, 0.22]], fin: [8.7, 9.6, 1.0, 3.1], stab: [7.8, 0.95, 1.5],
      hub: [0, 2.3, -3.2], blades: 5, rr: 10.6, chord: 0.52, tail: [-0.32, 2.4, 9.35], tr: 1.95,
      gnose: [-7.4, -1.85], gmain: [-1.6, -1.85, 1.75], gr: 0.36, door: [-5.6, -4.3], text: [-2.2, -0.2, 2.6]
    }
  };
  function rotorBlades(mb, blades, rr, chord, m, hub) {
    for (let k = 0; k < blades; k++) {
      const t = k / blades * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t), w = chord / 2;
      mb.quad([c * 0.4 - sn * w, 0, sn * 0.4 + c * w, c * rr - sn * w, -0.15, sn * rr + c * w, c * rr + sn * w, -0.15, sn * rr - c * w, c * 0.4 + sn * w, 0, sn * 0.4 - c * w], [0, 1, 0], [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
    }
    mb.box(-0.3, -0.25, -0.3, 0.3, 0.05, 0.3, hub);
  }

  function tailBlades(mb, n, tr, m) {
    for (let k = 0; k < n; k++) {
      const t = k / n * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t);
      mb.quad([0, c * 0.1 - sn * 0.08, sn * 0.1 + c * 0.08, 0, c * tr - sn * 0.08, sn * tr + c * 0.08, 0, c * tr + sn * 0.08, sn * tr - c * 0.08, 0, c * 0.1 + sn * 0.08, sn * 0.1 - c * 0.08], [1, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], m.c, m.layer, m.kind);
    }
  }

  const HELI_MESH = new Map();
  function heliMesh(type) {
    if (HELI_MESH.has(type)) return HELI_MESH.get(type);
    const H = HELIS[type], mb = new N.MB(2048), rotor = new N.MB(256), tail = new N.MB(64);
    const paint = mat('paint'), white = { layer: T('white'), kind: 0, c: [226, 228, 230, 255] }, dark = mat('dark'), frame = mat('chassis');
    const glass = { layer: T('mirror'), kind: K.CHROME, c: [46, 58, 70, 255] }, blade = { layer: T('darkmetal'), kind: 0, c: [38, 40, 42, 255] };
    const { shell, box } = bikeKit(mb, 0, 0);
    shell(H.nose, glass);
    shell(H.body, paint);
    shell(H.top, white);
    for (let i = 0; i + 1 < H.boom.length; i++) {
      const [a0, y0, r0] = H.boom[i], [a1, y1, r1] = H.boom[i + 1];
      tube(mb, [0, y0, a0], [0, y1, a1], (r0 + r1) / 2, i ? white : paint, 10);
    }
    box(H.fin[0], H.fin[2], 0.05, H.fin[1], H.fin[3], -0.05, paint);
    box(H.stab[0] - 0.3, H.stab[1] - 0.03, -H.stab[2], H.stab[0] + 0.3, H.stab[1] + 0.03, H.stab[2], white);
    const S = H.body[1], fl = S[2] + 0.2, top = S[3] - 0.3, hx = S[1] + 0.006;
    for (const sd of [1, -1]) mb.quad([sd * hx, fl, H.door[0], sd * hx, fl, H.door[1], sd * hx, top, H.door[1], sd * hx, top, H.door[0]], [sd, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], dark.c, dark.layer, dark.kind);
    const wm = wheelMesh('steel', 0.45, 1);
    tube(mb, [0, H.gnose[1] + H.gr + 0.4, H.gnose[0]], [0, H.gnose[1] + H.gr, H.gnose[0]], 0.05, frame, 6);
    mb.append(wm, 0, H.gnose[1] + H.gr, H.gnose[0], 0, H.gr);
    for (const sd of [1, -1]) {
      tube(mb, [sd * H.gmain[2] * 0.4, S[2] + 0.2, H.gmain[0]], [sd * H.gmain[2], H.gmain[1] + H.gr, H.gmain[0]], 0.06, frame, 6);
      mb.append(wm, sd * H.gmain[2], H.gmain[1] + H.gr, H.gmain[0], 0, H.gr);
    }
    const A = N.ATLAS_MAP, uv = A && A['text|МИЛИЦИЯ'];
    if (uv) for (const sd of [1, -1]) {
      const x = sd * (S[1] + 0.01), zc = H.text[0], y = H.text[1], w = H.text[2], za = zc + sd * w / 2, zb = zc - sd * w / 2;
      mb.quad([x, y - w * 0.1, za, x, y - w * 0.1, zb, x, y + w * 0.1, zb, x, y + w * 0.1, za], [sd, 0, 0], [uv[0], uv[3], uv[2], uv[3], uv[2], uv[1], uv[0], uv[1]], WHITE, 0, K.ATLAS);
    }
    rotorBlades(rotor, H.blades, H.rr, H.chord, blade, frame);
    tailBlades(tail, 2, H.tr, blade);
    const out = { mb, rotor, tail, hub: H.hub, tailAt: H.tail, door: [-(S[1] + 0.25), S[2] + 0.2, (H.door[0] + H.door[1]) / 2], gearY: H.gmain[1] };
    HELI_MESH.set(type, out);
    return out;
  }

  const ARMOR = { tank: true, apc: true };
  N.Cars = {
    heli: type => (type === 'mi24' ? N.Army.mi24() : heliMesh(type)),
    kit: { mat, tube, sweep, obox, bikeKit, wheelMesh, rotorBlades, tailBlades },
    has: id => !!MODELS[id] || !!(N.VEHICLES[id] && (N.VEHICLES[id].type === 'bike' || ARMOR[N.VEHICLES[id].type])),
    build: (spec, livery, lod) => (spec.type === 'bike' ? (spec.shape.sidecar ? ural(spec, livery, lod ? 1 : 0) : bike(spec, lod ? 1 : 0)) : ARMOR[spec.type] ? N.Army.build(spec, lod) : build(spec, livery, lod)),
    section: (id, a) => section(resolve(N.VEHICLES[id]), a),
    data: id => resolve(N.VEHICLES[id]),
    inside(id, livery, vi) {
      const spec = N.VEHICLES[id], d = MODELS[id], key = (livery || '') + '|' + (vi | 0);
      if (!d) return null;
      d.ins = d.ins || new Map();
      if (!d.ins.has(key)) d.ins.set(key, insideMesh(resolve(spec), spec, livery && spec.liveries ? spec.liveries[livery] : null, vi | 0));
      return d.ins.get(key);
    },
    steer: steerMesh,
    STEER_STYLES: Object.keys(STEER),
    clear() { WHEELS.clear(); BIKE_WHEELS.clear(); STEERS.clear(); HELI_MESH.clear(); if (N.Army) N.Army.clear(); for (const k of Object.keys(MODELS)) { delete MODELS[k].res; delete MODELS[k].ins; } }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
