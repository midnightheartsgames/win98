(function () {
  const K = window.YouVidKit;
  const { clamp, lerp, ease } = K;
  const Cam = window.DownCam;
  const ID = 'D0wngr4d3Ed';

  const TITLES = [
    ['classic', 230, 43, 10.3, 17.75, 0.35],
    ['downgrade', 570, 17, 18.62, 24.18, 0.08],
    ['original640', 752, 22, 24.18, 26.86, 0.05],
    ['downgrade8k', 537, 22, 26.86, 29.86, 0.08],
    ['controller', 288, 22, 29.95, 33.9, 0.25],
    ['voice', 241, 10, 36.35, 41.37, 0.3],
    ['original', 760, 22, 41.39, 43.84, 0.05],
    ['downgrade', 785, 22, 43.84, 46.55, 0.05],
    ['bugs', 210, 27, 46.6, 49.55, 0.3],
    ['original', 758, 20, 57.75, 61.18, 0.08],
    ['decom', 333, 33, 61.25, 64.4, 0.35],
    ['original', 760, 20, 64.46, 68.33, 0.05],
    ['deind', 301, 64, 68.45, 72.4, 0.35]
  ];

  const HUD = {
    road: { map: '|3', stance: 'aim', ammo: '9x18|6/48' },
    army: { map: '|4', stance: 'stand', ammo: '9x39 ПАБ-9|10/434', belt: true },
    wheel: { map: '|5', stance: 'aim', ammo: '9x39 ПАБ-9|10/771', belt: true },
    cellar: { map: '60.2 m.|6', stance: 'aim', ammo: 'Болт|', cross: 'dot' },
    vorig: { map: '|7', stance: 'aim', ammo: '|', cross: 'dot' },
    v8k: { map: '|7', stance: 'aim', ammo: 'Болт|', cross: 'dot' },
    ctrlIn: { map: '104.3 m.|8', stance: 'aim', ammo: '9x18|8/92', cross: 'ticks', drop: true },
    ctrlOut: { map: '102.0 m.|9', stance: 'stand', ammo: '9x18|4/84', cross: 'ticks', drop: true },
    voice: { map: '131.1 m.|10', stance: 'stand', ammo: '9x18|6/72' },
    rtxA: { map: '|11', stance: 'stand', ammo: '9x18|6/63' },
    rtxB: { map: '115.4 m.|11', stance: 'stand', ammo: '9x18|6/72' },
    bugsA: { map: '244.7 m.|12', stance: 'aim', ammo: '9x19 ЦМО (А)|30/889', cross: 'ticks' },
    bugsB: { map: '244.7 m.|12', stance: 'aim', ammo: '9x19 ЦМО (А)|27/889', cross: 'ticks' },
    barrel: { map: '359.3 m.|13', stance: 'stand', ammo: 'Болт|', cross: 'dot' },
    monument: { map: '200.9 m.|14', stance: 'aim', ammo: 'Болт|', cross: 'dot' },
    signA: { map: '|15', stance: 'aim', ammo: '7.62x54 7Н1|10/738', belt: true },
    signB: { map: '610.1 m.|16', stance: 'aim', ammo: '5.56 SS (A)|30/32', cross: 'ticks' }
  };

  const AMMO = {
    ctrlIn: [[29.86, '9x18|0/100'], [30.5, '9x18|8/92'], [31.1, '9x18|7/92'], [32.35, '9x18|6/92'], [33.0, '9x18|2/92'], [33.6, '9x18|1/92']],
    ctrlOut: [[33.93, '9x18|7/84'], [34.6, '9x18|5/84'], [35.0, '9x18|4/84']],
    bugsA: [[46.55, '9x19 ЦМО (А)|30/889']],
    bugsB: [[48.07, '9x19 ЦМО (А)|30/889'], [48.25, '9x19 ЦМО (А)|28/889'], [48.45, '9x19 ЦМО (А)|25/889'], [48.7, '9x19 ЦМО (А)|23/889']]
  };

  const SHOTS_FIRED = {
    ctrlIn: [31.12, 32.33, 32.5, 33.6],
    ctrlOut: [34.3, 34.6, 34.95],
    bugsB: [48.1, 48.2, 48.3, 48.4, 48.5, 48.6]
  };

  const GUN = {
    road: { mode: 'pistolSilver', walk: 1 },
    army: { mode: 'rifle', drawAt: [13.81, 14.15], inspect: [[14.1, 0], [14.3, 1], [14.85, 1], [15.1, 0]] },
    wheel: { mode: 'rifle', walk: 0.2 },
    cellar: { mode: 'bolt', walk: 1 },
    vorig: { mode: 'bolt', walk: 0.6 },
    v8k: { mode: 'bolt', walk: 1 },
    ctrlIn: { mode: 'pistol', reload: [29.86, 30.6], twoHand: false },
    ctrlOut: { mode: 'pistol' },
    voice: { mode: 'pistol', lower: 1 },
    rtxA: { mode: 'pistol' },
    rtxB: { mode: 'pistol', walk: 0.5 },
    bugsA: { mode: 'smg', sprint: [[46.55, 1], [47.15, 1], [47.4, 0]] },
    bugsB: { mode: 'smg', sprint: [[48.07, 0], [48.72, 0], [48.95, 1]] },
    barrel: { mode: 'bolt', reach: [[52.7, 0], [53.4, 1], [55.04, 1]] },
    monument: { mode: 'bolt', walk: 0.4 },
    signA: { mode: 'rifle' },
    signB: { mode: 'tan', walk: 0.3 },
    plantA: { mode: 'bolt', walk: 0.5 },
    plantB: { mode: 'bolt', walk: 0.6, throwAt: 70.75 }
  };

  const keys = K.keys;

  function fadeIn(t, t0, d) { return clamp((t - t0) / d, 0, 1); }

  function titleList(t) {
    return TITLES.filter(([, , , a, b]) => t >= a && t < b).map(([key, x, y, a, b, f]) => ({ key, x, y, alpha: Math.min(fadeIn(t, a, f), clamp((b - t) / f, 0, 1)) }));
  }

  function lastKey(list, t) {
    let v = list[0][1];
    for (const [k, x] of list) if (t >= k) v = x;
    return v;
  }

  function gunState(shot, t) {
    const cfg = GUN[shot.name];
    if (!cfg) return { mode: 'none', t };
    const st = { mode: cfg.mode, t, walk: cfg.walk || 0, twoHand: cfg.twoHand };
    if (cfg.drawAt) { const [a, b] = cfg.drawAt; if (t < b) st.draw = clamp((t - a) / (b - a), 0, 1); }
    if (cfg.inspect) st.inspect = keys(cfg.inspect)(t);
    if (cfg.reload) { const [a, b] = cfg.reload; if (t >= a && t < b) st.reload = (t - a) / (b - a); }
    if (cfg.lower) st.lower = cfg.lower;
    if (cfg.sprint) st.sprint = keys(cfg.sprint)(t);
    if (cfg.reach) st.reach = keys(cfg.reach)(t);
    if (cfg.throwAt !== undefined && t >= cfg.throwAt && t < cfg.throwAt + 0.75) st.throwK = (t - cfg.throwAt) / 0.75;
    const fired = SHOTS_FIRED[shot.name] || [];
    fired.forEach((f, i) => {
      const d = t - f;
      if (d >= 0 && d < 0.09) { st.flash = 1 - d / 0.09; st.shotN = i; }
      if (d >= 0 && d < 0.22) st.kick = Math.max(st.kick || 0, 1 - d / 0.22);
    });
    if (shot.name === 'bugsB' && t > 48.07 && t < 48.7) st.tracer = true;
    return st;
  }

  function hudState(shot, t) {
    const h = HUD[shot.name];
    if (!h) return null;
    const out = Object.assign({}, h);
    if (AMMO[shot.name]) out.ammo = lastKey(AMMO[shot.name], t);
    return out;
  }

  function actorsOf(shot, t) {
    const n = shot.name;
    const out = [];
    if (n === 'army') {
      out.push({ outfit: 'exo', pos: [-1.15, 0, -2.0], face: 0.35, kind: 'lowRifle', seed: 1 });
      out.push({ outfit: 'exo', pos: [-0.15, 0, -4.8], face: -0.1, kind: 'lowRifle', seed: 2 });
      out.push({ outfit: 'exo', pos: [1.7, 0, -7.4], face: -0.5, kind: 'rifle', seed: 3, look: 0.4 });
    } else if (n === 'vorig' || n === 'v8k') {
      const g = (u, v) => Cam.ground(24.4, u, v);
      const f = g(0.53, 0.485);
      out.push({ outfit: 'camp', pos: [f[0] - 1.1, 0, f[2] + 0.4], face: 1.9, sit: true, seed: 4 });
      out.push({ outfit: 'camp', pos: [f[0] + 1.0, 0, f[2] + 0.5], face: -2.0, sit: true, seed: 5 });
      out.push({ outfit: 'camp', pos: [f[0] + 0.2, 0, f[2] - 1.1], face: 0.1, crouch: 0.6, seed: 7 });
      const s1 = g(0.555, 0.495), s2 = g(0.677, 0.496);
      out.push({ outfit: 'loner', pos: [s1[0], 0, s1[2]], face: 0.6, kind: 'arms', seed: 6 });
      out.push({ outfit: 'loner', pos: [s2[0], 0, s2[2]], face: -0.4, kind: 'lowRifle', seed: 8 });
    } else if (n === 'ctrlIn') {
      if (t < 31.0) {
        const k = clamp((t - 30.45) / 0.6, 0, 1);
        out.push({ outfit: 'bandit', pos: [lerp(-1.5, 3.2, k), 0, -9.6], face: 1.57, kind: 'run', seed: 9, walk: 1 });
      } else if (t < 33.3) {
        const k = ease(clamp((t - 31.95) / 1.15, 0, 1));
        out.push({ outfit: 'bandit', pos: [lerp(-0.75, 1.4, k), 0, lerp(-2.4, -5.8, k)], face: lerp(0.35, -2.4, k), kind: k > 0.15 ? 'run' : 'aimPistol', walk: k > 0.05 && k < 0.95 ? 1 : 0, seed: 10 });
      } else {
        out.push({ outfit: 'bandit', pos: [-3.3, 0, -3.6], face: 1.2, crouch: 0.55, kind: 'aimPistol', seed: 11 });
      }
    } else if (n === 'ctrlOut') {
      if (t < 35.32) out.push({ outfit: 'bandit', pos: [-0.9, 0, -9.2], face: 0.3, kind: 'aimPistol', seed: 12 });
      else if (t < 35.5) out.push({ outfit: 'bandit', pos: [-0.9, 0, -9.0], face: 0.3, kind: 'aimPistol', seed: 12 });
      else out.push({ outfit: 'bandit', pos: [-0.9, 0, -8.8], face: 0.3, lie: true, fall: clamp((t - 35.5) / 0.35, 0, 1), seed: 12 });
    } else if (n === 'voice') {
      const stand = ease(clamp((t - 38.3) / 0.9, 0, 1));
      out.push({ outfit: 'shustry', pos: [0.15, 0, -1.5], face: -0.08, crouch: 1 - stand, kind: 'arms', talk: t > 36.8, seed: 13, label: true });
    } else if (n === 'bugsA') {
      const k = (t - 46.55) / 1.5;
      [[-11.5, -10.8], [-6.2, -10.4], [-2.4, -11.0]].forEach(([x, z], i) => out.push({ outfit: 'soldier', pos: [x + k * 2.6, 0, z + k * 0.6 + i * 0.2], face: 1.3 - i * 0.2, kind: 'run', walk: 1, seed: 20 + i }));
      out.push({ outfit: 'soldier', pos: [3.0 - k * 0.6, 0, -7.4 + k * 0.6], face: -2.2, kind: 'aimPistol', seed: 23 });
    } else if (n === 'bugsB') {
      if (t < 48.7) out.push({ outfit: 'soldier', pos: [16.6 - (t - 48.07) * 2.0, 0, -4.4], face: -1.8, kind: 'run', walk: 1, seed: 24 });
    } else if (n === 'barrel') {
      out.push({ outfit: 'burnt', pos: [0.05, 0, -1.55], face: 3.0, barrel: true, seed: 25 });
    } else if (n === 'signA' || n === 'signB') {
      const g = (u, v) => Cam.ground(59.4, u, v);
      const b0 = g(0.52, 0.74), b1 = g(0.08, 0.6), b2 = g(0.36, 0.61);
      out.push({ outfit: 'loner', pos: [b0[0], 0, b0[2]], face: 2.2, lie: true, fall: 1, seed: 26 });
      out.push({ outfit: 'soldier', pos: [b1[0], 0, b1[2]], face: -0.6, lie: true, fall: 1, seed: 27 });
      out.push({ outfit: 'loner', pos: [b2[0], 0, b2[2]], face: 1.2, lie: true, fall: 1, seed: 28 });
    } else if (n === 'invModel') {
      out.push({ outfit: 'merc', pos: [0, 0, 0], face: 0, tpose: true, seed: 29 });
    }
    return out;
  }

  function stage(t) {
    const shot = Cam.shotAt(t);
    const camera = Cam.camera(t, shot);
    const st = {
      t, shot: shot.name, set: shot.set, camera,
      gun: gunState(shot, t),
      hud: hudState(shot, t),
      titles: titleList(t),
      actors: actorsOf(shot, t),
      fx: { blur: 0, fade: 0, flash: 0, letterbox: 0, lowFps: 0 }
    };
    const fx = st.fx;
    if (shot.name === 'rating') fx.fade = clamp((t - 1.95) / 0.5, 0, 1);
    if (shot.name === 'bunker') { fx.letterbox = 1; fx.fade = lerp(0.8, 0.22, ease(clamp((t - 2.45) / 2.3, 0, 1))); st.morph = clamp((t - 4.72) / 0.42, 0, 1); st.doorGlow = clamp(1 - Math.abs(t - 4.58) / 0.25, 0, 1); }
    if (shot.name === 'ogre') { fx.fade = clamp((t - 9.0) / 0.45, 0, 1); st.door = ease(clamp((t - 5.0) / 0.42, 0, 1)); st.ogre = true; }
    if (shot.name === 'black') fx.fade = 1;
    if (shot.name === 'road') fx.fade = 1 - clamp((t - 10.25) / 0.5, 0, 1);
    if (shot.name === 'cellar') fx.blur = 3;
    if (shot.name === 'v8k') fx.blur = 4;
    if (shot.name === 'rtxB') { fx.blur = 4; fx.lowFps = 12; }
    if (shot.name === 'plantB') fx.fade = clamp((t - 72.35) / 0.6, 0, 1);
    if (shot.name === 'signA' && t >= 60.0 && t < 60.13) fx.flash = 0.3;
    if (shot.name === 'bunker' || shot.name === 'ogre') st.madeIn = { line1: shot.name === 'bunker' ? 1 : 0, line2: shot.name === 'bunker' ? clamp((t - 4.3) / 0.2, 0, 1) : 0 };
    if (shot.name === 'ctrlIn' || shot.name === 'ctrlOut') st.gamepad = Math.min(fadeIn(t, 29.95, 0.25), 1);
    if (shot.name === 'rtxA') st.fps = 323 + Math.round((t - 41.39) * 7.6);
    if (shot.name === 'rtxB') st.fps = [28, 34, 33, 40, 38][Math.min(4, Math.floor((t - 43.84) / 0.55))];
    if (shot.name === 'monument') st.alerts = t >= 55.77 && !(t >= 56.38 && t < 56.45) && !(t >= 56.98 && t < 57.03) ? 1 : 0;
    if (shot.name === 'ctrlOut' && t > 35.3) st.npcLabel = { tex: 'labelBandit', actor: 0, dy: 2.1 };
    if (shot.name === 'voice') st.npcLabel = { tex: 'labelShustry', actor: 0, dy: 1.2, at: 'chest' };
    if (shot.name === 'voice' && t > 40.8) st.talkHint = 1;
    if (shot.name === 'ctrlOut' && t > 34.2 && t < 35.3) st.redArc = clamp((t - 34.2) / 0.3, 0, 1);
    if (shot.name === 'invModel') st.arrow = { x: 421, y: 388, w: 108, h: 55 };
    if (shot.name === 'monument') st.arrow = { x: 168, y: 100, w: 162, h: 64, from: 56.07 };
    if (shot.name === 'plantA' || shot.name === 'plantB') st.noHud = true;
    st.letters = shot.name === 'signA';
    st.plantGone = shot.name === 'plantB';
    return st;
  }

  window.DownScript = { ID, DURATION: Cam.DURATION, CUTS: Cam.CUTS, TITLES, HUD, GUN, stage };
})();
