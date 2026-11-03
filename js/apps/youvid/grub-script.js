(function () {
  const K = window.YouVidKit;
  const { S, clamp, lerp, envelope } = K;
  const UI = window.GrubUI;

  const ID = 'cAtsBG3r34L';
  const DURATION = 46.43;
  const CUTS = [0, 2.633, 16.417, 21.3, 36.083];

  const VOICE = envelope(
    '00000000000000000000000000000000000000000000000000004308RVAhcff3pGz9640fsh00eyMKBp000000000000000000' +
    '180qGw0lqyKKErc500000000000000000hLOHA6fj0dHIm6vJJEub4cgd6000000000000000000000000000000000000000000' +
    '0000000000000000000000000000005jd0IQCkebbc64nAyi00002kqi00dzCsh0000000000000000000000000000000000000' +
    '000000000000000000000000000000vAc00vKMA905mqd0200002LOsxykbsAo00000000000000000000000000000000000000' +
    '00000000000000000000000000000fuxqlkmnmnnk9rAp0pDxc0280001tEEyohd0mAr0wEta000008vvg900000000008wDqfoc' +
    '00xFvc000zGzn6ab01dkxAte000000000000000000yHDwng69pMOCvwwf0DHj66moDEnrxBp0sJFg000009EKAtd0000000rEyb' +
    'rGAd0tGx0000CEe000000000dAv00750000uGBwshBFj050000ami0000008rvun03otl3000005jppe00000600000000000000' +
    '00000000000000000000000000vEo0000oFEyvupib008wt85wGzrh0eAAb00000000FJzxma2000000000epquBt20001ezIGzo' +
    'h2000000000000000000HPybcFNCc000000HNymkgca00007CHAwk002rBztspefoqxAs8000000000000000000000000000000' +
    '0000000000000000000000000000000',
    20
  );

  function curve(list) {
    const n = list.length;
    const slope = (i, k) => {
      if (i <= 0 || i >= n - 1) return 0;
      const v = (j) => (Array.isArray(list[j][1]) ? list[j][1][k] : list[j][1]);
      const d0 = (v(i) - v(i - 1)) / Math.max(1e-6, list[i][0] - list[i - 1][0]);
      const d1 = (v(i + 1) - v(i)) / Math.max(1e-6, list[i + 1][0] - list[i][0]);
      if (d0 * d1 <= 0) return 0;
      return (2 * d0 * d1) / (d0 + d1);
    };
    return (t) => {
      if (t <= list[0][0]) return list[0][1];
      if (t >= list[n - 1][0]) return list[n - 1][1];
      let i = 0;
      while (i < n - 2 && t >= list[i + 1][0]) i++;
      const t0 = list[i][0], t1 = list[i + 1][0], h = t1 - t0;
      const u = (t - t0) / h, u2 = u * u, u3 = u2 * u;
      const one = (a, b, k) => (2 * u3 - 3 * u2 + 1) * a + (u3 - 2 * u2 + u) * h * slope(i, k) + (-2 * u3 + 3 * u2) * b + (u3 - u2) * h * slope(i + 1, k);
      const a = list[i][1], b = list[i + 1][1];
      return Array.isArray(a) ? a.map((v, k) => one(v, b[k], k)) : one(a, b, 0);
    };
  }

  const SHOTS = [
    { from: 0, to: 2.633, kind: 'camp', camera: { eye: [1.1, 12, 10], at: [0.8, 0, -0.3], fov: 36 } },
    { from: 2.633, to: 16.417, kind: 'talk', camera: { eye: [0.495, 0.59, 0.508], at: [-0.03, 0.22, 0.14], fov: 42 }, sun: [0.72, -0.56, 0.4], blur: 0.85, focus: 0.82, yawShift: 0.1, pitchShift: 0.15, tail: { lift: -1.2, curl: 0.1, side: 0.05, sway: 1 } },
    { from: 16.417, to: 21.3, kind: 'talk', camera: { eye: [0.3, 0.44, 0.4], at: [0.02, 0.25, 0.1], fov: 45 }, sun: [0.7, -0.5, 0.5], blur: 1, focus: 1.2, yawShift: 0.4, arch: 0.8, crouch: 0.6, neck: -0.9, tail: { lift: -1.3, curl: 0.08, side: 0.02, sway: 0.6 } },
    { from: 21.3, to: 36.083, kind: 'talk', camera: { eye: [0.25, 0.47, 0.5], at: [0.0, 0.28, 0.2], fov: 42 }, sun: [0.7, -0.55, 0.45], blur: 1, focus: 1.4, yawShift: 0, tail: { lift: -1.0, curl: 0.08, side: 0.05, sway: 0.8 } },
    { from: 36.083, to: DURATION, kind: 'talk', camera: { eye: [0.134, 0.549, 0.432], at: [0.0, 0.34, 0.2], fov: 45 }, sun: [0.68, -0.6, 0.42], blur: 1, focus: 1.4, yawShift: 0.1, pitchShift: 0.12, tail: { lift: 1.2, curl: -0.05, side: 0.03, sway: 1 } }
  ];

  const HEAD = curve([
    [0.0, [0.3, 1.2, 0]], [2.633, [0.45, 0.30, 0.10]], [3.2, [0.55, 0.28, 0.08]], [3.9, [0.5, 0.55, 0.0]], [4.4, [0.5, 0.66, -0.05]],
    [5.5, [0.47, 0.72, -0.05]], [6.4, [0.5, 0.66, -0.03]], [6.75, [0.56, 0.32, 0.08]], [7.6, [0.58, 0.26, 0.1]], [8.4, [0.57, 0.27, 0.09]],
    [8.9, [0.53, 0.33, 0.05]], [9.4, [0.6, 0.22, 0.1]], [10.9, [0.6, 0.22, 0.1]], [11.6, [0.62, 0.25, 0.08]], [12.4, [0.5, 0.46, 0.0]],
    [12.9, [0.45, 0.62, -0.04]], [14.2, [0.42, 0.69, -0.05]], [15.4, [0.43, 0.67, -0.05]], [15.8, [0.55, 0.32, 0.06]], [16.4, [0.56, 0.3, 0.06]],
    [16.417, [-0.1, 0.5, 0.0]], [16.7, [0.12, 0.6, 0]], [16.95, [0.3, 0.65, 0]], [17.3, [0.6, 0.62, 0]], [18.4, [0.62, 0.6, 0.02]],
    [20.0, [0.66, 0.54, 0.05]], [21.29, [0.66, 0.52, 0.05]],
    [21.3, [0.45, 0.25, 0.08]], [22.2, [0.5, 0.28, 0.08]], [22.65, [0.15, 0.6, 0]], [23.1, [0.24, 0.62, -0.03]], [25.4, [0.27, 0.62, -0.03]],
    [25.9, [0.5, 0.36, 0.08]], [27.6, [0.56, 0.3, 0.1]], [28.1, [0.6, 0.06, 0.12]], [29.5, [0.6, 0.04, 0.12]], [30.0, [0.02, -0.42, 0.12]],
    [31.9, [-0.04, -0.46, 0.12]], [32.25, [0.2, 0.3, 0]], [32.6, [0.6, 0.6, 0]], [35.0, [0.6, 0.6, 0]], [35.3, [0.42, 0.62, 0]], [36.08, [0.42, 0.62, 0]],
    [36.083, [0.6, 0.15, 0.1]], [36.85, [0.62, 0.15, 0.1]], [37.2, [0.95, 0.4, 0]], [38.6, [0.95, 0.42, 0]], [38.9, [1.05, 0.4, 0]], [39.9, [1.05, 0.4, 0]],
    [40.2, [0.7, 0.1, 0.1]], [43.1, [0.7, 0.1, 0.1]], [43.4, [0.95, 0.4, 0]], [44.1, [1.04, 0.42, 0]], [46.43, [1.07, 0.42, 0]]
  ]);

  const BLINKS = [2.62, 3.95, 4.68, 8.92, 12.5, 16.45, 21.3, 26.9, 33.6, 40.6, 42.9, 45.6];
  const SQUINT = curve([[0, 0], [12.2, 0], [12.45, 0.7], [12.8, 0.7], [13.0, 0], [22.45, 0], [22.6, 1], [22.9, 1], [23.1, 0], [46.43, 0]]);
  const EARS = curve([[0, 0], [6.9, 0], [7.05, 0.3], [7.3, 0], [13.1, 0], [13.25, 0.25], [13.5, 0], [16.42, 0.35], [17.2, 0.05], [21.3, 0], [24.4, 0], [24.55, 0.28], [24.8, 0], [29.9, 0.15], [32.2, 0], [38.9, 0], [39.05, 0.25], [39.3, 0], [46.43, 0]]);

  const LINES = [
    { from: 2.633, to: 11.28, text: "Grub: I'm just a Cat! P-please! Talk to Yenna." },
    { from: 11.28, to: 16.417, text: 'Grub: W-why are *you* so nosy?' },
    { from: 16.417, to: 18.3, text: "Grub: P-please don't." },
    { from: 19.5, to: 21.3, text: "Grub: P-please don't." },
    { from: 21.3, to: 34.35, text: "Grub: N-nothing good, I don't think. She was so very sick. M-maybe she made like a Cat and went off to... to *spend her last life.*" },
    { from: 34.8, to: 36.083, text: "Grub: N-nothing good, I don't think. She was so very sick. M-maybe she made like a Cat and went off to... to *spend her last life.*" },
    { from: 36.083, to: 43.45, text: 'Grub: Y-Yenna is my best friend. She\'s kind. H-help *her*, not me!' },
    { from: 43.9, to: DURATION + 1, text: 'Grub: Y-Yenna is my best friend. She\'s kind. H-help *her*, not me!' }
  ];

  const MENUS = [
    { from: 8.1, to: 11.28, options: ["I'm not going to hurt you, kitty.", 'Why are you so scared?', '*Leave.*'], hover: [[9.3, 0], [10.9, 1]], pick: 1 },
    { from: 13.7, to: 16.417, options: ['Is Yenna mistreating you?', 'May I pet you?', "Do you know what happened to Yenna's mother?", '*Leave.*'], hover: [[14.7, 1]], pick: 1 },
    { from: 19.7, to: 21.3, options: ['Is Yenna mistreating you?', "Do you know what happened to Yenna's mother?", '*Leave.*'], hover: [[19.7, 1]], pick: 1 },
    { from: 35.1, to: 36.083, options: ['Is Yenna mistreating you?', '*Leave.*'], hover: [[35.8, 0]], pick: 0 },
    { from: 44.2, to: DURATION + 1, options: ['*Leave.*'], hover: [] }
  ];

  const L = UI.LAYOUT;
  const opt = (n, i) => UI.optionRows(n)[i] - 6;
  const CURSOR = curve([
    [0, [470, 268]], [2.633, [700, 400]], [7.9, [712, 415]], [8.5, [690, 405]], [9.0, [450, 445]], [9.3, [395, opt(3, 0)]], [10.8, [385, opt(3, 0)]],
    [10.95, [378, opt(3, 1)]], [11.28, [376, opt(3, 1)]], [11.6, [355, 492]], [13.3, [380, 505]], [13.9, [430, 510]], [14.3, [420, 505]],
    [14.7, [330, opt(4, 1)]], [16.4, [315, opt(4, 1)]], [16.6, [318, 455]], [19.4, [395, 470]], [19.7, [L.textX + 140, opt(3, 1)]],
    [21.3, [L.textX + 130, opt(3, 1)]], [21.6, [365, 490]], [34.4, [452, 512]], [35.2, [408, 500]], [35.8, [L.textX + 120, opt(2, 0)]],
    [36.083, [L.textX + 118, opt(2, 0)]], [36.4, [362, 492]], [43.6, [680, 415]], [44.5, [588, 520]], [46.43, [330, 505]]
  ]);

  function shotAt(t) {
    const tt = clamp(t, 0, DURATION - 0.001);
    let idx = 0;
    SHOTS.forEach((s, i) => { if (tt >= s.from) idx = i; });
    return idx;
  }

  function blinkAt(t) {
    let b = 0;
    BLINKS.forEach(c => {
      const d = t - c;
      if (d > -0.09 && d < 0.2) b = Math.max(b, d < 0 ? 1 + d / 0.09 : 1 - d / 0.2);
    });
    return clamp(b, 0, 1);
  }

  function uiAt(t) {
    const line = LINES.find(l => t >= l.from && t < l.to);
    const menu = MENUS.find(m => t >= m.from && t < m.to);
    let hover = -1;
    if (menu) menu.hover.forEach(([th, i]) => { if (t >= th) hover = i; });
    return {
      line: line ? line.text : '',
      options: menu ? menu.options : null,
      hover,
      gold: menu ? (hover >= 0 ? hover : 0) : -1,
      cursor: CURSOR(t)
    };
  }

  function catAt(t, shot) {
    const sh = SHOTS[shot];
    if (sh.kind === 'camp') {
      return { t, p: [0, 0, 0], yaw: 0.55, head: [0.25 + S(t * 2) * 0.05, 0.35, 0], neck: [0.1, 0.1], jaw: 0, blink: blinkAt(t + 1.4), ears: [0, 0], tail: { lift: -0.4, curl: 0.15, side: 0.06, sway: 1.4 }, look: [0.62, 1.6, 1.15] };
    }
    const head = HEAD(t);
    const voice = VOICE(t);
    const jaw = clamp(Math.max(voice, VOICE(t - 0.05) * 0.85, VOICE(t - 0.1) * 0.6) * 0.8, 0, 1);
    const up = Math.max(0, head[0] - 0.3);
    return {
      t,
      p: [0, 0, 0],
      yaw: 0,
      arch: sh.arch || 0,
      crouch: sh.crouch || 0,
      lean: (sh.arch ? 0.05 : 0) + S(t * 0.7) * 0.012,
      head: [head[0] + (sh.pitchShift || 0) + S(t * 1.9) * 0.015, head[1] + (sh.yawShift || 0) + S(t * 1.3 + 1) * 0.02, head[2]],
      neck: [up * 0.25 + (head[0] < 0 ? head[0] * 0.35 : 0) + (sh.neck || 0), head[1] * 0.3],
      stretch: 1 + up * 0.15,
      jaw,
      blink: blinkAt(t),
      squint: SQUINT(t),
      ears: [EARS(t), EARS(t)],
      tail: sh.tail || {},
      look: sh.camera.eye
    };
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    const shot = shotAt(tt);
    const sh = SHOTS[shot];
    return {
      t: tt,
      shot,
      kind: sh.kind,
      camera: sh.camera,
      sun: sh.sun,
      blur: sh.blur || 0,
      focus: sh.focus || 0,
      voice: VOICE(tt),
      cat: catAt(tt, shot),
      ui: uiAt(tt)
    };
  }

  window.GrubScript = { ID, DURATION, CUTS, SHOTS, LINES, MENUS, VOICE, stage, blinkAt, curve };
})();
