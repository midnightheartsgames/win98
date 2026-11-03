(function () {
  const { V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, frac } = K;
  const Cast = window.KafkaCast;
  const Fx = window.KafkaFx;

  const ID = 'K4fkaIr0ny9';
  const DURATION = 123.78;

  const VOICE = K.envelope('0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000llAqKOBgBCb0vHi1ZF50NXTI600GzCCs2TWEDyffyuZDa10pFLmGQe2ZVRNEeBzUZQr41114321000000000439200000000Ru62sF9CEIk3n202CQEEWSB8446eyym297ZWrqs3ACjFAn49EFaZEaJVtKKDGRLTyDyb67ZZtwPbzPqCMLa0000000000000000000000000000000000000000000000000000000000000000000a6472023103831oXRTZUcnBa100077310000000025fkh76uok224yqCthb8490001410000774200lKsjqtr7agTZeGZUSRD235ZNth7324596431RZPQDkggiiaDJi8ZZTga8it000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000783154005113142233042zFF60h22OXWN412GXuKA400ph0059drA00639ofb51000217Mxe849ub4000ASK40bZi8Z210ACx6559a8756a11350521005IUZYZUUe8920010erwTZR3kA2420Lxl82005TZOBMJu2319r9050ZQHa23610200000000000000000Bmka00iZZRq573200sGf00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000cb9688546zIE428XF4PeaDhzx3001005001IZZL301Fq000c754ex6011000090072009000000eu8869tJ02bvAhgulClhj01sZA1015oum6000001jjfdifa7aZZYZVrcewE7fsmAJmnNOxi1mSJIEJplctEmbbZDd4469149efmed00000000000000000000000000000000000000000000000000000000000000000000000000034301331102fWGciZU90Zf30RT600ckk50600000000000000000000000000000000000000000000020330000ZZY608yi51mOEb1jcAxe9557m3i04vAsejp32agc300401440000000000000000000000000000d4ei79opc6OZTykcheb7000000Gvr00000000000000000000000000000000000000000000000000000000000000000000ihhejlojgldc8a9475b50KZUYBn3iAstvJK0bATTG0ewf00b000hfTEagZxpjFMDT54ZB911o80000300006wod4000b300000060010056fZRd9tkLt8ghf7723610lzaga98bj803311200ZWZfpCh58827az93a6jl227fcJsnfd00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000045uByzIPuw2304002LXYZZYo73200139Dtja742432000sWk0nPZo4006hZwtj05g00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', 20);

  const LINES = [
    { t0: 5.64, t1: 14.96, who: 'radio', text: 'Внимание всем постам! Цель обнаружена! Придерживайтесь плана! Уничтожить на месте! Повторяю! Уничтожить на месте!' },
    { t0: 18.37, t1: 25.17, who: 'kafka', text: 'Не бойтесь. Послушайте. Разве вы не сами меня пригласили?' },
    { t0: 38.1, t1: 47.09, who: 'kafka', text: 'Эта паутина так хрупка, порвётся от прикосновения. Но вас сломать ещё легче?' },
    { t0: 47.97, t1: 48.93, who: 'kafka', text: 'Проверим.' },
    { t0: 72.16, t1: 75.04, who: 'kafka', text: 'У судьбы тысячи лиц.' },
    { t0: 75.16, t1: 80.94, who: 'kafka', text: 'Так почему же сейчас она явила нам именно этот лик?' },
    { t0: 84.74, t1: 86.44, who: 'kafka', text: 'Сидите в засаде?' },
    { t0: 88.73, t1: 91.51, who: 'kafka', text: 'Сейчас узнаем, где вы прячетесь.' },
    { t0: 92.94, t1: 94.34, who: 'kafka', text: 'Бум.' },
    { t0: 97.76, t1: 101.78, who: 'kafka', text: 'Рано или поздно занавес опустится.' },
    { t0: 101.9, t1: 106.47, who: 'kafka', text: 'Как думаешь, что нас ждёт в финале?' },
    { t0: 112.12, t1: 113.78, who: 'kafka', text: 'Орёл или решка?' },
    { t0: 113.82, t1: 115.4, who: 'kafka', text: 'Каков твой ответ?' }
  ];

  const ENVS = {
    hallBlue: { sunDir: [-0.35, -0.5, 0.8], sunColor: [0.3, 0.4, 0.74], ambTop: [0.13, 0.16, 0.3], ambBottom: [0.04, 0.045, 0.09], fogColor: [0.03, 0.04, 0.09], fogNear: 6, fogFar: 30, points: [{ pos: [-8.3, 2.6, -6], color: [1.0, 0.58, 0.26] }, { pos: [8.3, 2.6, -6], color: [0.8, 0.48, 0.22] }] },
    hallWarm: { sunDir: [0.85, -0.35, 0.1], sunColor: [0.98, 0.68, 0.42], ambTop: [0.16, 0.17, 0.32], ambBottom: [0.04, 0.04, 0.1], fogColor: [0.04, 0.04, 0.1], fogNear: 6, fogFar: 28 },
    hallPink: { sunDir: [0.3, -0.6, 0.7], sunColor: [0.88, 0.3, 0.62], ambTop: [0.26, 0.13, 0.3], ambBottom: [0.07, 0.025, 0.08], fogColor: [0.1, 0.03, 0.09], fogNear: 8, fogFar: 32, points: [{ pos: [-8.3, 2.6, -6], color: [1.0, 0.5, 0.3] }, { pos: [0, 5.5, -2], color: [0.9, 0.45, 0.6] }] },
    hallDark: { sunDir: [0.3, -0.6, 0.7], sunColor: [0.45, 0.18, 0.4], ambTop: [0.13, 0.07, 0.17], ambBottom: [0.03, 0.015, 0.04], fogColor: [0.03, 0.01, 0.04], fogNear: 4, fogFar: 20 },
    stairsWhite: { sunDir: [0.2, -0.75, -0.6], sunColor: [1.2, 1.15, 1.25], ambTop: [0.62, 0.6, 0.7], ambBottom: [0.2, 0.18, 0.26], fogColor: [0.9, 0.88, 0.94], fogNear: 30, fogFar: 80 },
    bw: { sunDir: [0.1, -0.85, -0.4], sunColor: [0.72, 0.72, 0.72], ambTop: [0.3, 0.3, 0.3], ambBottom: [0.06, 0.06, 0.06], fogColor: [0.04, 0.04, 0.04], fogNear: 6, fogFar: 28 },
    redRoom: { sunDir: [0.0, -0.3, 0.95], sunColor: [1.0, 0.18, 0.3], ambTop: [0.3, 0.06, 0.12], ambBottom: [0.08, 0.015, 0.04], fogColor: [0.16, 0.015, 0.05], fogNear: 6, fogFar: 26 },
    smoke: { sunDir: [0.2, -0.8, -0.4], sunColor: [0.42, 0.38, 0.5], ambTop: [0.4, 0.36, 0.46], ambBottom: [0.16, 0.13, 0.2], fogColor: [0.3, 0.26, 0.34], fogNear: 1.5, fogFar: 13 },
    smokeDark: { sunDir: [0.3, -0.6, -0.7], sunColor: [0.4, 0.3, 0.56], ambTop: [0.24, 0.18, 0.32], ambBottom: [0.07, 0.05, 0.11], fogColor: [0.17, 0.12, 0.23], fogNear: 1.5, fogFar: 12 },
    night: { sunDir: [-0.5, -0.4, 0.75], sunColor: [0.44, 0.28, 0.64], ambTop: [0.1, 0.07, 0.17], ambBottom: [0.02, 0.015, 0.04], fogColor: [0.02, 0.015, 0.04], fogNear: 3, fogFar: 16 },
    corridor: { sunDir: [0.4, -0.6, -0.7], sunColor: [0.52, 0.34, 0.8], ambTop: [0.24, 0.16, 0.36], ambBottom: [0.07, 0.04, 0.12], fogColor: [0.08, 0.045, 0.14], fogNear: 5, fogFar: 26 },
    clock: { sunDir: [-0.4, -0.5, -0.75], sunColor: [1.0, 0.86, 0.9], ambTop: [0.5, 0.4, 0.48], ambBottom: [0.22, 0.14, 0.2], fogColor: [0.2, 0.1, 0.18], fogNear: 20, fogFar: 40 },
    lift: { sunDir: [0.0, -0.4, -0.9], sunColor: [0.34, 0.32, 0.6], ambTop: [0.2, 0.18, 0.38], ambBottom: [0.06, 0.05, 0.13], fogColor: [0.04, 0.03, 0.1], fogNear: 6, fogFar: 20 },
    liftIn: { sunDir: [0.0, -1, -0.05], sunColor: [0.95, 0.7, 1.1], ambTop: [0.34, 0.24, 0.48], ambBottom: [0.1, 0.06, 0.17], fogColor: [0.18, 0.09, 0.27], fogNear: 8, fogFar: 20 },
    hallRed: { sunDir: [0.4, -0.55, -0.7], sunColor: [0.78, 0.1, 0.18], ambTop: [0.21, 0.035, 0.07], ambBottom: [0.06, 0.01, 0.03], fogColor: [0.08, 0.01, 0.03], fogNear: 6, fogFar: 28, points: [{ pos: [-8.3, 2.6, -6], color: [1.0, 0.42, 0.24] }, { pos: [8.3, 2.6, -1.5], color: [1.0, 0.38, 0.2] }] },
    poster: { sunDir: [0.0, -0.3, -0.95], sunColor: [0.8, 0.96, 0.96], ambTop: [0.38, 0.48, 0.5], ambBottom: [0.12, 0.17, 0.2], fogColor: [0.02, 0.05, 0.06], fogNear: 30, fogFar: 60 },
    studio: { sunDir: [-0.3, -0.5, -0.8], sunColor: [0.9, 0.86, 0.92], ambTop: [0.5, 0.46, 0.56], ambBottom: [0.2, 0.18, 0.25], fogColor: [0, 0, 0], fogNear: 30, fogFar: 60 },
    side: { sunDir: [-0.8, -0.3, -0.5], sunColor: [0.95, 0.88, 0.98], ambTop: [0.26, 0.24, 0.32], ambBottom: [0.06, 0.05, 0.08], fogColor: [0, 0, 0], fogNear: 30, fogFar: 60 },
    psy: { sunDir: [0.3, -0.4, -0.85], sunColor: [0.72, 0.46, 0.76], ambTop: [0.28, 0.2, 0.34], ambBottom: [0.08, 0.05, 0.12], fogColor: [0, 0, 0], fogNear: 30, fogFar: 60 },
    ruins: { sunDir: [0.5, -0.45, 0.72], sunColor: [0.46, 0.56, 0.92], ambTop: [0.16, 0.2, 0.32], ambBottom: [0.05, 0.06, 0.1], fogColor: [0.07, 0.09, 0.16], fogNear: 8, fogFar: 46, points: [{ pos: [2, 1.5, -3], color: [1.4, 0.7, 0.25] }] },
    ruinsFire: { sunDir: [-0.7, -0.2, -0.6], sunColor: [1.25, 0.68, 0.3], ambTop: [0.2, 0.22, 0.36], ambBottom: [0.06, 0.05, 0.08], fogColor: [0.08, 0.08, 0.14], fogNear: 8, fogFar: 40 },
    warehouse: { sunDir: [0.3, -0.6, -0.7], sunColor: [0.62, 0.55, 0.95], ambTop: [0.22, 0.19, 0.36], ambBottom: [0.07, 0.05, 0.12], fogColor: [0.08, 0.05, 0.15], fogNear: 8, fogFar: 32, points: [{ pos: [0, 2, -4], color: [1.6, 0.8, 0.3] }] },
    theaterLit: { sunDir: [0.1, 0.4, 0.9], sunColor: [1.2, 0.4, 0.52], ambTop: [0.5, 0.14, 0.22], ambBottom: [0.2, 0.04, 0.08], fogColor: [0.3, 0.02, 0.06], fogNear: 6, fogFar: 20 },
    theater: { sunDir: [0.2, -0.7, -0.68], sunColor: [0.98, 0.16, 0.26], ambTop: [0.3, 0.05, 0.1], ambBottom: [0.08, 0.01, 0.03], fogColor: [0.2, 0.01, 0.04], fogNear: 4, fogFar: 16 },
    stage: { sunDir: [0.0, -0.6, -0.8], sunColor: [1.2, 1.2, 1.25], ambTop: [0.8, 0.8, 0.86], ambBottom: [0.4, 0.4, 0.46], fogColor: [0.05, 0.05, 0.07], fogNear: 12, fogFar: 40 },
    spot: { sunDir: [0.0, -1, -0.1], sunColor: [1.3, 1.2, 1.35], ambTop: [0.08, 0.06, 0.1], ambBottom: [0.02, 0.02, 0.03], fogColor: [0.01, 0.01, 0.015], fogNear: 4, fogFar: 14 }
  };

  const GRADE = {
    hallBlue: [1.0, 1.02, 1.1, 0.0],
    hallPink: [1.08, 0.98, 1.06, 0.0],
    corridor: [1.04, 0.98, 1.1, 0.0],
    hallRed: [1.12, 0.94, 0.98, 0.0],
    smoke: [1.0, 0.98, 1.04, 0.25],
    bw: [1.05, 1.05, 1.05, 1.0]
  };

  function seg(t, a, b) {
    return clamp((t - a) / (b - a), 0, 1);
  }

  function mix3(a, b, k) {
    return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  }

  function look(eye, at, fov, roll) {
    const cam = { eye, at, fov: fov || 40 };
    if (roll) {
      const f = V3.norm(V3.sub(at, eye));
      let r = V3.cross(f, [0, 1, 0]);
      r = V3.len(r) < 1e-5 ? [1, 0, 0] : V3.norm(r);
      const u = V3.cross(r, f);
      cam.up = V3.add(V3.mul(u, C(roll)), V3.mul(r, S(roll)));
    }
    return cam;
  }

  function shake(cam, t, amp) {
    const w = K.wobble(t * 3, amp, 1.7);
    cam.eye = V3.add(cam.eye, w);
    cam.at = V3.add(cam.at, V3.mul(w, 0.5));
    return cam;
  }

  function blank(set, env) {
    return {
      kind: 'scene',
      set: set || 'none',
      env: env || 'hallBlue',
      camera: look([0, 1.5, 4], [0, 1.4, 0], 40),
      kafka: null,
      ghosts: [],
      guards: [],
      fg: [],
      lines: [],
      sprites: [],
      petals: [],
      shards: [],
      cones: [],
      smokes: [],
      coin: null,
      casings: [],
      katana: null,
      backdrop: [],
      front: [],
      flash: 0,
      flashColor: [1, 1, 1],
      bw: false,
      chroma: 0,
      zoomBlur: 0,
      kaleido: 0,
      invert: false,
      streaks: 0,
      fade: 1,
      bg: null
    };
  }

  function card(bg) {
    const s = blank('none', 'studio');
    s.kind = 'card';
    s.bg = bg || [0, 0, 0];
    return s;
  }

  function blink(t, base, rate) {
    return frac(t * (rate || 0.31) + 0.17) < 0.045 ? 'shut' : (base || 'open');
  }

  function speaking(t) {
    const v = VOICE(t);
    return v > 0.55 ? 'o' : v > 0.18 ? 'talk' : 'smile';
  }

  function kafka(x, z, yaw, extra) {
    const p = Object.assign({ pos: [x, 1.0, z], yaw, base: [x, 0, z], eyes: 'open', mouth: 'smile' }, extra || {});
    if (p.bob) p.pos = [p.pos[0], p.pos[1] - p.bob, p.pos[2]];
    return p;
  }

  function walking(t, x, z, yaw, speed, extra, rate) {
    const w = Cast.walkPose(t, rate || 7.2, 0.2, 0.07);
    const d = t * speed;
    const px = x + S(yaw) * d, pz = z + C(yaw) * d;
    return kafka(px, pz, yaw, Object.assign({ footL: w.footL, footR: w.footR, hL: w.hL, hR: w.hR, bob: w.bob, sp: [0.04, 0, 0] }, extra || {}));
  }

  function running(t, x, z, yaw, speed, extra) {
    const w = Cast.runPose(t, 11);
    const d = t * speed;
    return kafka(x + S(yaw) * d, z + C(yaw) * d, yaw, Object.assign({ footL: w.footL, footR: w.footR, hL: w.hL, hR: w.hR, eL: w.eL, eR: w.eR, bob: w.bob - 0.06, sp: [0.22, 0, 0], lean: 0.12 }, extra || {}));
  }

  function guard(x, z, yaw, mode, t, extra) {
    const p = { pos: [x, 1.02, z], yaw, base: [x, 0, z] };
    const aim = [S(yaw), -0.03, C(yaw)];
    const br = S((t || 0) * 1.7 + x * 3) * 0.006;
    if (mode === 'aim') Object.assign(p, { hR: [-0.1, 0.1 + br, 0.22], hL: [0.03, 0.08 + br, 0.5], eR: [-0.9, -0.3, -0.2], eL: [0.4, -0.8, 0.2], aimDir: aim, footL: [0.15, 0, 0.16], footR: [-0.17, 0, -0.14], sp: [0.08, 0.1, 0] });
    else if (mode === 'port') Object.assign(p, { hR: [-0.16, -0.22 + br, 0.16], hL: [0.17, 0.08 + br, 0.3], eR: [-0.8, -0.4, -0.3], eL: [0.6, -0.6, -0.2] });
    else if (mode === 'low') Object.assign(p, { hR: [-0.2, -0.14 + br, 0.2], hL: [0.05, -0.1 + br, 0.42], aimDir: [S(yaw), -0.45, C(yaw)], footL: [0.18, 0, 0.2], footR: [-0.18, 0, -0.18], sp: [0.12, 0, 0], pos: [x, 0.96, z] });
    else if (mode === 'walk') {
      const w = Cast.walkPose(t || 0, 6, 0.26, 0.08);
      Object.assign(p, { hR: [-0.16, -0.2, 0.16], hL: [0.17, 0.08, 0.3], footL: [0.13, 0, w.footL[2], w.footL[3] - 0.02], footR: [-0.13, 0, w.footR[2], w.footR[3] - 0.02] });
    }
    return Object.assign(p, extra || {});
  }

  function lyingGuard(x, z, yaw, faceUp, extra) {
    const lean = faceUp ? -PI / 2 : PI / 2;
    const head = [S(yaw), 0, C(yaw)];
    const side = [C(yaw), 0, -S(yaw)];
    const pelvis = [x, 0.2, z];
    const foot = (k) => [pelvis[0] - head[0] * 0.92 + side[0] * k * 0.16, 0.08, pelvis[2] - head[2] * 0.92 + side[2] * k * 0.16];
    const yawFix = faceUp ? yaw + PI : yaw;
    return Object.assign({ pos: pelvis, yaw: yawFix, lean, fLw: foot(1), fRw: foot(-1), kL: [0.1, 0.6, 0.6], kR: [-0.1, 0.6, 0.6], hL: [0.4, -0.1, 0.1], hR: [-0.4, 0.1, 0.1], rifle: false }, extra || {});
  }

  function pinkLasers(seed, n, t, box, width, alpha) {
    return Fx.laserGrid(seed, n, box, t, [1, 0.22, 0.66], width || 0.025).map(l => Object.assign(l, { alpha: alpha === undefined ? 0.9 : alpha }));
  }

  function muzzle(p, t, rate, size, color) {
    const on = frac(t * (rate || 12)) < 0.45;
    return on ? [{ p, size: size || 0.22, kind: 'star', color: color || [1, 0.82, 0.4], alpha: 1, roll: t * 9 }, { p, size: (size || 0.22) * 1.6, kind: 'halo', color: color || [1, 0.6, 0.2], alpha: 0.7 }] : [];
  }

  window.KafkaShots = { ENVS, GRADE, LINES, VOICE, ID, DURATION, seg, mix3, look, shake, blank, card, blink, speaking, kafka, walking, running, guard, lyingGuard, pinkLasers, muzzle };
})();
