(function () {
  const { M4, V3, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;
  const KC = window.KonosubaCast;
  const { boxAt, ellAt, hp, lock, capGrid, bangs } = KC;

  const BASE = ['aqua', 'megumin', 'darkness', 'kazuma'];

  function dimsFrom(base, k) {
    const d = Object.assign({}, KC.DIMS[base]);
    if (k && k !== 1) ['hipX', 'hipY', 'thigh', 'shin', 'chestY', 'neckY', 'shX', 'shY', 'upper', 'fore', 'headY'].forEach(n => { d[n] *= k; });
    return d;
  }

  const FACE = {
    brown: { eye: '#7a4a2a', eyeDark: '#3a1e10', eyeLight: '#d8a878', lash: '#2a1a14' },
    gold: { eye: '#d8a030', eyeDark: '#7a4a10', eyeLight: '#ffe8a0', lash: '#3a2214' },
    red: { eye: '#d02838', eyeDark: '#701018', eyeLight: '#ff9aa0', lash: '#1e1418' },
    blue: { eye: '#3a7ad0', eyeDark: '#1a3a7a', eyeLight: '#a6d8ff', lash: '#1e2030' },
    green: { eye: '#3a9a68', eyeDark: '#1a4a34', eyeLight: '#a6e8c6', lash: '#1e2a20' },
    violet: { eye: '#7a5ab8', eyeDark: '#3a2a6a', eyeLight: '#cab8ff', lash: '#1e1a2a' },
    dark: { eye: '#3a3a4a', eyeDark: '#141418', eyeLight: '#8a8a9a', lash: '#141418' }
  };

  const LOOKS = {
    kazumaJ: { base: 'kazuma', male: true, jersey: true },
    wiz: { base: 'aqua', face: 'gold', skin: 0xfde4d4, hair: 0x9a5a34, hairMid: 0x84482a, hairTip: 0x6a3a22, brow: 0x6a3a22, style: 'long', fringe: 'side',
      top: [[0.24, 0xfde4d4], [0.2, 0x5a3a7a], [-1, 0x6a4a8a]], bust: 0x6a4a8a, trim: 0xd8b04a, sleeve: [[0, 0x5a3a7a]], fore: [[0, 0x6a4a8a], [0.85, 0xd8b04a]], skirt: { col: 0x5a3a7a, len: 0.82, r: 0.24, trim: 0xd8b04a }, legs: [[0, 0x3a2a4a]], shoe: 0x3a2a3a, cape: 0x4a2a6a },
    luna: { base: 'darkness', face: 'gold', skin: 0xfde6d6, hair: 0xf2c86a, hairMid: 0xe0aa48, hairTip: 0xc88a34, brow: 0xb88a3a, style: 'curly',
      top: [[0.2, 0xfde6d6], [0.17, 0xffffff], [-1, 0x2a3a5a]], bust: 0xffffff, bow: 0xd02838, sleeve: [[0, 0xfde6d6]], fore: [[0, 0xffffff]], skirt: { col: 0x2a3a5a, len: 0.45, r: 0.2 }, legs: [[0, 0x2a2a32]], shoe: 0x3a2a24 },
    waitress: { base: 'aqua', face: 'brown', skin: 0xfde6d6, hair: 0xf0b07a, hairMid: 0xdc9a64, hairTip: 0xc8844e, brow: 0xb8784a, style: 'bob',
      top: [[0.235, 0xfde6d6], [0.13, 0xffffff], [-1, 0x26222a]], bust: 0xffffff, corset: 0xf0a040, choker: 0x1e1a1e, sleeve: [[0, 0xffffff]], fore: [[0, 0xffffff], [0.8, 0xfde6d6]], skirt: { col: 0xa82830, len: 0.42, r: 0.22, trim: 0xffffff }, legs: [[0, 0xfde6d6], [0.75, 0xffffff]], shoe: 0x8a2a22 },
    waitressB: { base: 'darkness', face: 'blue', skin: 0xfde8dc, hair: 0xf6ecc8, hairMid: 0xe8dcb0, hairTip: 0xd8c898, brow: 0xc8b890, style: 'long', fringe: 'parted',
      top: [[0.235, 0xfde8dc], [0.13, 0xffffff], [-1, 0x26222a]], bust: 0xffffff, corset: 0xd8a040, choker: 0x1e1a1e, sleeve: [[0, 0xffffff]], fore: [[0, 0xffffff]], skirt: { col: 0x8a2028, len: 0.42, r: 0.22, trim: 0xffffff }, legs: [[0, 0xfde8dc]], shoe: 0x5a2a22 },
    waitressC: { base: 'megumin', face: 'brown', skin: 0xfde4d4, hair: 0xc8583a, hairMid: 0xb0482e, hairTip: 0x983a24, brow: 0x8a3a22, style: 'bob',
      top: [[0.22, 0xfde4d4], [0.12, 0xffffff], [-1, 0x26222a]], bust: 0xffffff, corset: 0xd8a040, choker: 0x1e1a1e, sleeve: [[0, 0xffffff]], fore: [[0, 0xffffff]], skirt: { col: 0xa82830, len: 0.4, r: 0.2, trim: 0xffffff }, legs: [[0, 0xfde4d4]], shoe: 0x5a2a22 },
    waitressD: { base: 'megumin', face: 'dark', skin: 0xfde4d4, hair: 0x2a2026, hairMid: 0x1e161a, hairTip: 0x140e12, brow: 0x1e1418, style: 'long',
      top: [[0.22, 0xfde4d4], [0.12, 0xffffff], [-1, 0x26222a]], bust: 0xffffff, corset: 0xd8a040, choker: 0x1e1a1e, sleeve: [[0, 0xffffff]], fore: [[0, 0xffffff]], skirt: { col: 0xa82830, len: 0.4, r: 0.2, trim: 0xffffff }, legs: [[0, 0xfde4d4]], shoe: 0x5a2a22 },
    waitressE: { base: 'aqua', face: 'brown', skin: 0xfde6d6, hair: 0xf6d27a, hairMid: 0xe8bc5e, hairTip: 0xd8a44a, brow: 0xc89a4a, style: 'bob',
      top: [[0.235, 0xfde6d6], [0.13, 0xffffff], [-1, 0x26222a]], bust: 0xffffff, corset: 0xd8a040, choker: 0x1e1a1e, sleeve: [[0, 0xffffff]], fore: [[0, 0xffffff]], skirt: { col: 0xa82830, len: 0.42, r: 0.22, trim: 0xffffff }, legs: [[0, 0xfde6d6]], shoe: 0x5a2a22 },
    chris: { base: 'megumin', face: 'violet', skin: 0xfde6da, hair: 0xd8dce4, hairMid: 0xc4c8d4, hairTip: 0xaab0bc, brow: 0xa0a6b4, style: 'short',
      top: [[0.2, 0xfde6da], [0.09, 0x2a3a2a], [-1, 0xfde6da]], sleeve: [[0, 0xfde6da]], fore: [[0, 0xfde6da], [0.7, 0x3a3a3a]], shorts: 0x2a2e3a, legs: [[0, 0xfde6da], [0.6, 0x3a3226]], shoe: 0x4a3a2a, scarf: 0x6a9a3a },
    yunyun: { base: 'megumin', face: 'red', skin: 0xfde4d6, hair: 0x2a1e24, hairMid: 0x20161c, hairTip: 0x160e12, brow: 0x1e1418, style: 'braids', ribbon: 0xe84a6a,
      top: [[0.21, 0xfde4d6], [0.18, 0xffffff], [-1, 0x26202a]], sleeve: [[0, 0x26202a]], fore: [[0, 0x26202a], [0.85, 0xffffff]], skirt: { col: 0x26202a, len: 0.4, r: 0.19, trim: 0xe84a6a }, legs: [[0, 0x26202a]], shoe: 0x3a2a2a, tie: 0xf08aa8 },
    mitsurugi: { base: 'kazuma', male: true, face: 'blue', skin: 0xf8dcc8, hair: 0xc89a5a, hairMid: 0xb0844a, hairTip: 0x98703a, brow: 0x8a6a3a, style: 'male', band: 0x3a6ad0,
      top: [[0.235, 0xf8dcc8], [-1, 0x2a3e8a]], armor: 0x3a5ab0, trim: 0xe8b83a, sleeve: [[0, 0x26304a], [0.5, 0x3a5ab0]], fore: [[0, 0x3a5ab0], [0.3, 0x26304a]], pants: 0x26304a, legs: [[0, 0x26304a], [0.5, 0x3a5ab0]], shoe: 0x26304a, scarf: 0xb82a2a, cape: 0x1e1e2a, glove: 0x1e1e26 },
    clemea: { base: 'megumin', face: 'green', skin: 0xfde4d4, hair: 0xe85a6a, hairMid: 0xd04a5a, hairTip: 0xb83a4a, brow: 0xb03a4a, style: 'bob',
      top: [[0.12, 0xfde4d4], [0.06, 0xe85a5a], [-1, 0xfde4d4]], sleeve: [[0, 0xfde4d4]], fore: [[0, 0xfde4d4], [0.6, 0xe8d0b0]], skirt: { col: 0xe8d0b0, len: 0.26, r: 0.18 }, legs: [[0, 0xfde4d4], [0.7, 0x6a4a3a]], shoe: 0x6a4a3a },
    fiore: { base: 'megumin', face: 'violet', skin: 0xfde6da, hair: 0x8ad06a, hairMid: 0x74ba58, hairTip: 0x5ea248, brow: 0x5a8a3a, style: 'twin',
      top: [[0.12, 0xfde6da], [0.06, 0xf4f0e0], [-1, 0xfde6da]], sleeve: [[0, 0xfde6da]], fore: [[0, 0xfde6da]], shorts: 0x2a6aa8, legs: [[0, 0xfde6da], [0.7, 0x2a2a3a]], shoe: 0x2a2a3a, scarf: 0x3a8ad8 },
    bigman: { base: 'kazuma', scale: 1.18, male: true, wide: 1.45, face: 'dark', skin: 0x9a6440, hair: 0x9a6440, hairMid: 0x8a5838, hairTip: 0x7a4c30, brow: 0x2a1a14, style: 'bald',
      top: [[0.26, 0x9a6440], [-1, 0x26262c]], sleeve: [[0, 0x26262c]], fore: [[0, 0x9a6440], [0.6, 0xe8e0d0]], pants: 0x3a2a24, legs: [[0, 0x3a2a24]], shoe: 0x2a1a14, sash: 0xb02a2a },
    guildman: { base: 'kazuma', male: true, face: 'brown', skin: 0xf2d0b4, hair: 0x2a2220, hairMid: 0x221a18, hairTip: 0x1a1412, brow: 0x1a1412, style: 'male',
      top: [[0.235, 0xf2d0b4], [0.2, 0xffffff], [-1, 0x3a2a26]], vest: 0x3a2a26, tie: 0xb02a2a, sleeve: [[0, 0xffffff]], fore: [[0, 0xffffff]], pants: 0x26222a, legs: [[0, 0x26222a]], shoe: 0x1e1814 },
    guildman2: { base: 'kazuma', male: true, face: 'blue', skin: 0xf6dac4, hair: 0xe8c878, hairMid: 0xd8b060, hairTip: 0xc89a4a, brow: 0xa88040, style: 'male',
      top: [[0.235, 0xf6dac4], [0.2, 0xffffff], [-1, 0x3a2a26]], vest: 0x3a2a26, tie: 0xb02a2a, sleeve: [[0, 0x8a5a3a]], fore: [[0, 0x8a5a3a]], pants: 0x26222a, legs: [[0, 0x26222a]], shoe: 0x1e1814 },
    staffGirl: { base: 'megumin', face: 'dark', skin: 0xfde6da, hair: 0x1e1a22, hairMid: 0x161218, hairTip: 0x100c12, brow: 0x141016, style: 'long',
      top: [[0.22, 0xfde6da], [0.19, 0xffffff], [-1, 0x2a2026]], vest: 0x2a2026, tie: 0xb02a2a, sleeve: [[0, 0xffffff]], fore: [[0, 0xffffff]], skirt: { col: 0x26222a, len: 0.42, r: 0.19 }, legs: [[0, 0x26222a]], shoe: 0x1e1814 },
    elfGirl: { base: 'megumin', face: 'green', skin: 0xfde8dc, hair: 0xc8e0b0, hairMid: 0xb0cc98, hairTip: 0x98b880, brow: 0x88a070, style: 'bob',
      top: [[0.22, 0xfde8dc], [0.19, 0xffffff], [-1, 0x7a4a2a]], vest: 0x7a4a2a, tie: 0xb02a2a, sleeve: [[0, 0xffffff]], fore: [[0, 0xffffff]], skirt: { col: 0x26222a, len: 0.42, r: 0.19 }, legs: [[0, 0x26222a]], shoe: 0x1e1814 },
    crowdA: { base: 'kazuma', male: true, face: 'brown', skin: 0xf0c8a4, hair: 0x6a3a22, hairMid: 0x5a3020, hairTip: 0x4a281a, brow: 0x3a2014, style: 'male',
      top: [[0.235, 0xf0c8a4], [-1, 0x8a6a3a]], sleeve: [[0, 0x8a6a3a]], fore: [[0, 0xf0c8a4]], pants: 0x4a3a2a, legs: [[0, 0x4a3a2a]], shoe: 0x2a1e14 },
    crowdB: { base: 'aqua', face: 'green', skin: 0xfde4d4, hair: 0xd85a4a, hairMid: 0xc04a3a, hairTip: 0xa83a2e, brow: 0x9a3a2a, style: 'bob', hat: 0x3a2a4a,
      top: [[0.235, 0xfde4d4], [0.12, 0xd8d0c0], [-1, 0xa83a3a]], bust: 0xd8d0c0, sleeve: [[0, 0xfde4d4]], fore: [[0, 0xfde4d4]], skirt: { col: 0x6a2a3a, len: 0.36, r: 0.2 }, legs: [[0, 0xfde4d4], [0.6, 0x3a2a2a]], shoe: 0x3a2a2a },
    crowdC: { base: 'megumin', face: 'red', skin: 0xfde8e0, hair: 0xf2eef2, hairMid: 0xe2dce4, hairTip: 0xd0c8d4, brow: 0xc0b8c4, style: 'long', ears: true,
      top: [[0.22, 0xfde8e0], [0.15, 0xc82a3a], [-1, 0xf4ece8]], sleeve: [[0, 0xf4ece8]], fore: [[0, 0xf4ece8]], skirt: { col: 0xc82a3a, len: 0.32, r: 0.19 }, legs: [[0, 0xfde8e0]], shoe: 0x8a2a2a },
    crowdD: { base: 'kazuma', male: true, scale: 1.08, wide: 1.25, face: 'dark', skin: 0xe8b88a, hair: 0x8a7a6a, hairMid: 0x7a6a5a, hairTip: 0x6a5a4a, brow: 0x4a3a2a, style: 'male',
      top: [[0.235, 0xe8b88a], [-1, 0x9aa4ac]], armor: 0xb8c0c8, sleeve: [[0, 0x6a5a4a]], fore: [[0, 0xe8b88a]], pants: 0x4a4a54, legs: [[0, 0x4a4a54]], shoe: 0x2a2420 }
  };

  const JERSEY = { green: 0x2f7e62, greenDark: 0x226650, black: 0x1e2026, white: 0xf2f2f0, shoe: 0x2a5ab0, sole: 0xf0f0f0 };

  function torsoRings(fem, wide) {
    const k = wide || 1;
    return [
      { y: -0.105, rx: (fem ? 0.112 : 0.118) * k, rz: 0.08 * Math.sqrt(k) },
      { y: -0.04, rx: (fem ? 0.092 : 0.11) * k, rz: 0.07 * Math.sqrt(k) },
      { y: 0.04, rx: (fem ? 0.096 : 0.118) * k, rz: 0.074 * Math.sqrt(k) },
      { y: 0.12, rx: (fem ? 0.108 : 0.13) * k, rz: 0.08 * Math.sqrt(k) },
      { y: 0.19, rx: (fem ? 0.12 : 0.15) * k, rz: 0.074 * Math.sqrt(k) },
      { y: 0.225, rx: (fem ? 0.086 : 0.108) * k, rz: 0.06 * Math.sqrt(k) },
      { y: 0.25, rx: 0.045 * k, rz: 0.042 * k }
    ];
  }

  function bandColor(list, y) {
    for (let i = 0; i < list.length; i++) if (y > list[i][0]) return list[i][1];
    return list[list.length - 1][1];
  }

  function cfgOf(who) {
    const L = LOOKS[who];
    if (!L) return KC.CHARS[who] || KC.CHARS.aqua;
    if (L.jersey) return Object.assign({}, KC.CHARS.kazuma, { dim: KC.DIMS.kazuma });
    const f = FACE[L.face || 'brown'];
    return Object.assign({ dim: dimsFrom(L.base, L.scale) }, f, L);
  }

  function dims(who) {
    return cfgOf(who).dim;
  }

  function standY(who, bend) {
    const D = dims(who);
    return 0.07 + (D.thigh + D.shin) * (bend || 0.995) - D.hipY;
  }

  function standLegs(who, spread, bend) {
    const D = dims(who);
    const L = (D.thigh + D.shin) * (bend || 0.995);
    const w = spread === undefined ? 0.075 : spread;
    return { fL: [w, D.hipY - L, 0.01], kL: [0.04, 0, 1], fR: [-w, D.hipY - L, 0.01], kR: [-0.04, 0, 1] };
  }

  function solve(who, pose) {
    const D = dims(who);
    const yaw = pose.yaw || 0, lean = pose.lean || 0, roll = pose.roll || 0;
    const cy = C(yaw), sy = S(yaw);
    const fwd = pose.fwd || [sy, 0, cy];
    const up = pose.up || V3.norm([S(roll) * cy + sy * lean, C(roll), -S(roll) * sy + cy * lean]);
    return Rig.solve(Object.assign({}, pose, { p: pose.pos || [0, standY(who), 0], fwd, up }), D);
  }

  function stripe(r, len, side, col, rad) {
    return K.mesh(r, b => {
      const rr = rad || 0.034;
      b.quad([side * (rr + 0.002), 0, -0.012], [side * (rr + 0.002), 0, 0.012], [side * (rr - 0.004), -len, 0.01], [side * (rr - 0.004), -len, -0.01], col);
    });
  }

  function hairStyle(b, R, cfg) {
    const st = cfg.style;
    const h = cfg.hair, hm = cfg.hairMid, ht = cfg.hairTip;
    if (st === 'bald') {
      ellAt(b, [0, R * 0.2, R * 0.98], 0.03, 0.006, 0.006, 6, 4, cfg.brow);
      return;
    }
    if (st === 'male') {
      capGrid(b, R, 1.06, 0.55, -0.6, h, (u, v) => (v < 0.3 ? hm : h));
      [[-0.7, 0.6, 0.042, -0.6], [-0.4, 0.75, 0.045, -0.35], [-0.1, 0.8, 0.045, 0.2], [0.22, 0.78, 0.045, 0.45], [0.55, 0.65, 0.042, 0.6]].forEach(([yaw, len, w, curl]) => {
        lock(b, [hp(R, yaw * 0.4, 1.0, 1.02), hp(R, yaw * 0.8 + curl * 0.1, 0.55, 1.12), hp(R, yaw + curl * 0.35, lerp(0.4, 0.12, len), 1.09)], w, 0.014, h, { tip: hm, taper: 1.0, rootW: 1.3 });
      });
      for (let i = 0; i < 10; i++) {
        const yaw = (i / 10) * PI * 2 + 0.3;
        if (C(yaw) > 0.55) continue;
        const base = hp(R, yaw, 0.35, 1.03);
        const tip = V3.add(V3.add(base, V3.mul(V3.norm(base), R * 0.3)), [0, -R * 0.3, 0]);
        lock(b, [hp(R, yaw, 0.65, 1.0), base, tip], 0.045, 0.015, h, { tip: hm, taper: 1.0 });
      }
      if (cfg.band) {
        for (let i = 0; i < 16; i++) {
          const a0 = -1.6 + (i / 16) * 3.2, a1 = -1.6 + ((i + 1) / 16) * 3.2;
          b.quad(hp(R, a0, 0.55, 1.08), hp(R, a1, 0.55, 1.08), hp(R, a1, 0.68, 1.08), hp(R, a0, 0.68, 1.08), cfg.band);
        }
        ellAt(b, hp(R, 0, 0.62, 1.1), 0.02, 0.016, 0.008, 8, 5, rgb(0xe8c040, 0.3));
      }
      return;
    }
    const low = st === 'short' ? -0.55 : st === 'bob' ? -0.75 : -0.95;
    capGrid(b, R, 1.05, 0.5, low, h, (u, v) => (v < 0.3 ? hm : h));
    if (cfg.fringe === 'side') {
      bangs(b, R, cfg, [[-0.85, 0.6, 0.04, -0.4], [-0.55, 0.85, 0.045, -0.3], [-0.2, 0.95, 0.045, 0.1], [0.15, 1.0, 0.05, 0.4], [0.45, 1.05, 0.055, 0.6], [0.75, 1.0, 0.05, 0.5]]);
      lock(b, [hp(R, 0.6, 0.95, 1.02), hp(R, 0.75, 0.3, 1.14), hp(R, 0.6, -0.25, 1.16), hp(R, 0.55, -0.5, 1.1)], 0.07, 0.016, h, { tip: hm, taper: 1.0 });
    } else if (cfg.fringe === 'parted') {
      bangs(b, R, cfg, [[-0.85, 0.7, 0.04, -0.5], [-0.55, 0.7, 0.045, -0.6], [0.55, 0.7, 0.045, 0.6], [0.85, 0.7, 0.04, 0.5]]);
    } else {
      bangs(b, R, cfg, [[-0.78, 0.7, 0.04, -0.3], [-0.5, 0.85, 0.042, -0.2], [-0.22, 0.95, 0.04, 0.05], [0.06, 0.92, 0.042, 0.1], [0.32, 0.95, 0.04, 0.2], [0.58, 0.85, 0.042, 0.3], [0.82, 0.7, 0.036, 0.35]]);
    }
    const sideLen = st === 'short' ? 0.9 : st === 'bob' ? 1.3 : st === 'curly' ? 3.4 : st === 'braids' ? 1.2 : 2.6;
    [-1, 1].forEach(s => {
      lock(b, [hp(R, s * 1.0, 0.7, 1.02), hp(R, s * 1.12, 0.05, 1.12), [s * R * 1.0, -R * 0.7, R * 0.4], [s * R * 0.98, -R * sideLen, R * 0.42]], 0.04, 0.013, h, { tip: ht, taper: 1.0 });
      lock(b, [hp(R, s * 1.4, 0.55, 1.02), hp(R, s * 1.5, -0.2, 1.1), [s * R * 1.0, -R * Math.min(sideLen, 1.4), -R * 0.1]], 0.05, 0.015, hm, { tip: ht });
    });
    const backLen = st === 'short' ? 0.9 : st === 'bob' ? 1.2 : st === 'braids' ? 2.0 : st === 'twin' ? 1.0 : 4.6;
    const n = st === 'short' ? 7 : 9;
    for (let i = 0; i < n; i++) {
      const yaw = PI + (i - (n - 1) / 2) * 0.3;
      const pts = [hp(R, yaw, 0.85, 1.0), hp(R, yaw, 0.0, 1.1), hp(R, yaw, -0.7, 1.12), [S(yaw) * R * 0.8, -R * backLen, C(yaw) * R * 1.0]];
      if (backLen > 2) pts.push([S(yaw) * R * 0.85, -R * backLen * 1.2, C(yaw) * R * 1.05]);
      lock(b, pts, 0.06, 0.018, h, { tip: hm, blunt: st === 'bob' || st === 'short' });
    }
    if (st === 'curly') {
      [-1, 1].forEach(s => {
        const pts = [];
        for (let i = 0; i <= 16; i++) {
          const a = i * 0.9;
          pts.push([s * (R * 1.15 + C(a) * R * 0.25), -R * 0.4 - i * R * 0.14, R * 0.25 + S(a) * R * 0.25]);
        }
        lock(b, pts, 0.05, 0.03, h, { tip: hm, taper: 0.5 });
      });
    }
    if (st === 'braids') {
      [-1, 1].forEach(s => {
        for (let i = 0; i < 7; i++) ellAt(b, [s * R * 1.0, -R * 0.6 - i * R * 0.32, R * 0.3], 0.024, 0.032, 0.022, 7, 5, i % 2 ? h : hm);
        ellAt(b, [s * R * 0.95, -R * 0.35, R * 0.35], 0.026, 0.02, 0.012, 7, 5, rgb(cfg.ribbon || 0xe84a6a, 0.15));
      });
      ellAt(b, [R * 0.55, R * 0.75, R * 0.35], 0.022, 0.022, 0.014, 8, 5, rgb(0xd8a030, 0.3));
      ellAt(b, [R * 0.45, R * 0.65, R * 0.55], 0.026, 0.012, 0.008, 7, 4, rgb(cfg.ribbon || 0xe84a6a, 0.15));
    }
    if (st === 'twin') {
      [-1, 1].forEach(s => {
        lock(b, [[s * R * 0.75, R * 0.65, -R * 0.2], [s * R * 1.5, R * 0.55, -R * 0.4], [s * R * 1.7, -R * 0.6, -R * 0.4], [s * R * 1.6, -R * 2.4, -R * 0.2], [s * R * 1.4, -R * 3.6, -R * 0.1]], 0.07, 0.026, h, { tip: ht, swell: 0.4, taper: 1.2 });
        ellAt(b, [s * R * 0.78, R * 0.66, -R * 0.2], 0.022, 0.022, 0.022, 7, 5, rgb(0xf0f0f0, 0.2));
      });
    }
    if (cfg.ears) {
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * R * 0.45, R * 0.85, -R * 0.1), M4.rotZ(-s * 0.2));
        b.ellipsoid(0.025, 0.12, 0.012, 7, 6, 0xf6f0f4);
        b.pop();
      });
    }
    if (cfg.hat) {
      b.push(M4.translate(0, R * 0.75, 0), M4.rotX(-0.15));
      b.prism(14, R * 2.0, R * 2.0, 0, R * 2.0, R * 2.0, 0.008, cfg.hat);
      b.prism(12, R * 0.95, R * 0.95, 0, R * 0.2, R * 0.2, R * 2.0, cfg.hat);
      b.pop();
    }
  }

  function torsoFor(r, cfg) {
    const fem = !cfg.male;
    const rings = torsoRings(fem, cfg.wide);
    return K.mesh(r, b => {
      loft(b, rings.map(q => ring(q.y, q.rx, q.rz, 0, bandColor(cfg.top, q.y))), 14, { capTop: true, capBottom: true, hard: true });
      K.tube(b, [[0, 0.22, 0.004], [0, 0.31, 0.012]], [0.034 * (cfg.wide || 1), 0.032 * (cfg.wide || 1)], 8, cfg.skin);
      if (fem && cfg.bust) [-1, 1].forEach(s => ellAt(b, [s * 0.045, 0.112, 0.05], 0.05, 0.047, 0.042, 10, 8, cfg.bust));
      if (cfg.corset) {
        loft(b, [ring(-0.1, 0.098, 0.075, 0, 0x26222a), ring(0.02, 0.094, 0.072, 0.004, 0x26222a), ring(0.09, 0.1, 0.07, 0.008, 0x26222a)], 12, { hard: true });
        [-0.06, -0.02, 0.02].forEach(y => boxAt(b, [0, y, 0.077], [0.06, 0.012, 0.01], cfg.corset));
      }
      if (cfg.choker) K.tube(b, [[0, 0.262, 0], [0, 0.275, 0.002]], [0.037, 0.037], 10, cfg.choker);
      if (cfg.bow) {
        [-1, 1].forEach(s => ellAt(b, [s * 0.04, 0.17, 0.11], 0.045, 0.028, 0.014, 8, 5, cfg.bow, M4.rotZ(s * 0.3)));
        ellAt(b, [0, 0.17, 0.115], 0.016, 0.016, 0.012, 6, 4, cfg.bow);
      }
      if (cfg.vest) {
        [-1, 1].forEach(s => b.quad([s * 0.012, 0.2, 0.082], [s * 0.1, 0.19, 0.06], [s * 0.104, -0.1, 0.07], [s * 0.01, -0.1, 0.085], cfg.vest));
        [0.12, 0.06, 0.0].forEach(y => ellAt(b, [0.03, y, 0.083], 0.006, 0.006, 0.004, 5, 3, 0xd8c070));
      }
      if (cfg.tie) {
        b.quad([-0.012, 0.215, 0.09], [0.012, 0.215, 0.09], [0.016, 0.05, 0.088], [-0.016, 0.05, 0.088], cfg.tie);
        b.tri([-0.016, 0.05, 0.088], [0.016, 0.05, 0.088], [0, 0.02, 0.087], cfg.tie);
      }
      if (cfg.armor) {
        loft(b, [ring(-0.02, 0.112 * (cfg.wide || 1), 0.084, 0.004, cfg.armor), ring(0.12, 0.138 * (cfg.wide || 1), 0.095, 0.01, cfg.armor), ring(0.2, 0.15 * (cfg.wide || 1), 0.082, 0.004, cfg.armor)], 14, { hard: true, capTop: true });
        if (cfg.trim) {
          boxAt(b, [0, 0.09, 0.106], [0.07, 0.012, 0.01], cfg.trim);
          boxAt(b, [-0.03, 0.06, 0.106], [0.012, 0.07, 0.01], cfg.trim);
          boxAt(b, [0, 0.03, 0.106], [0.06, 0.012, 0.01], cfg.trim);
          boxAt(b, [0, 0.0, 0.1], [0.07, 0.012, 0.01], cfg.trim);
        }
      }
      if (cfg.sash) boxAt(b, [0, -0.06, 0], [0.26 * (cfg.wide || 1), 0.05, 0.17], cfg.sash);
      if (cfg.scarf) {
        K.tube(b, [[-0.06, 0.25, -0.03], [-0.07, 0.25, 0.05], [0, 0.245, 0.075], [0.07, 0.25, 0.05], [0.06, 0.25, -0.03], [0, 0.255, -0.06], [-0.06, 0.25, -0.03]], [0.028, 0.028, 0.03, 0.028, 0.028, 0.028, 0.028], 6, cfg.scarf);
      }
      if (cfg.cape) {
        const n = 12;
        for (let i = 0; i < n; i++) {
          const a0 = 0.9 + (i / n) * (2 * PI - 1.8), a1 = 0.9 + ((i + 1) / n) * (2 * PI - 1.8);
          const P = (a, y, rx, rz) => [S(a) * rx, y, C(a) * rz - 0.01];
          b.quad(P(a0, 0.24, 0.12, 0.07), P(a1, 0.24, 0.12, 0.07), P(a1, -0.5, 0.24, 0.15), P(a0, -0.5, 0.24, 0.15), cfg.cape);
        }
      }
    });
  }

  function pelvisFor(r, cfg) {
    return K.mesh(r, b => {
      const w = cfg.wide || 1;
      if (cfg.skirt) {
        const sk = cfg.skirt, len = sk.len, rr = sk.r;
        loft(b, [ring(-len, rr, rr * 0.86, 0, sk.trim || sk.col), ring(-len + 0.02, rr * 0.99, rr * 0.85, 0, sk.col), ring(-0.06, 0.15, 0.12, 0, sk.col), ring(0.03, 0.112, 0.082, 0, sk.col)], 16, { hard: true, capTop: true });
      } else {
        const col = cfg.shorts || cfg.pants || 0x2a2a32;
        loft(b, [ring(-0.13, 0.145 * w, 0.115 * w, 0, col), ring(0.03, 0.12 * w, 0.088 * w, 0, col)], 14, { hard: true, capTop: true, capBottom: true });
      }
    });
  }

  function limbsFor(r, cfg) {
    const D = cfg.dim, w = cfg.wide ? Math.sqrt(cfg.wide) : 1;
    const up = (f) => lerp(0.037, 0.031, f) * w;
    const fo = (f) => (lerp(0.031, 0.025, f) + (f > 0.85 ? 0.004 : 0)) * w;
    const th = (f) => lerp(0.066, 0.046, f) * w;
    const sh = (f) => (0.046 - 0.012 * f + 0.008 * S(PI * Math.min(1, f * 1.6)) * (f < 0.6 ? 1 : 0)) * w;
    const thighB = cfg.thigh || (cfg.pants ? [[0, cfg.pants]] : cfg.shorts ? [[0, cfg.shorts], [0.3, cfg.skin]] : [[0, cfg.skin]]);
    const shinB = cfg.legs || [[0, cfg.pants || cfg.skin]];
    const L = {
      upperL: KC.limbMesh(r, D.upper, cfg.sleeve || [[0, cfg.skin]], up, true),
      foreL: KC.limbMesh(r, D.fore, cfg.fore || [[0, cfg.skin]], fo),
      thighL: KC.limbMesh(r, D.thigh, thighB, th, true),
      shinL: KC.limbMesh(r, D.shin, shinB, sh),
      foot: KC.footMesh(r, cfg.shoe || 0x3a2a24, cfg.sole || 0x1e1814, cfg.male ? 0.16 : 0.14),
      hand: KC.handMesh(r, cfg.glove || cfg.skin)
    };
    L.upperR = L.upperL;
    L.foreR = L.foreL;
    L.thighR = L.thighL;
    L.shinR = L.shinL;
    return L;
  }

  function lookHead(r, cfg) {
    const R = cfg.dim.head;
    const eyes = new Map(), mouths = new Map();
    const bald = cfg.style === 'bald';
    return {
      eyeTex(state, gaze, blush) {
        const g = gaze ? [Math.round(gaze[0] * 4) / 4, Math.round(gaze[1] * 4) / 4] : [0, 0];
        const key = state + ':' + g.join(',') + ':' + (blush ? 1 : 0);
        if (!eyes.has(key)) eyes.set(key, r.texture(512, KC.eyeState(cfg, state, g, blush), { height: 256, clamp: true }));
        return eyes.get(key);
      },
      mouthTex(state) {
        if (!mouths.has(state)) mouths.set(state, r.texture(256, KC.mouthState(cfg, state), { height: 256, clamp: true }));
        return mouths.get(state);
      },
      mHead: K.mesh(r, b => KC.headGrid(b, R, -PI, PI, -PI / 2 + 0.02, PI / 2 - 0.02, 24, 16, (yaw, pit) => (!bald && (pit > 0.4 || Math.abs(yaw) > 1.5) ? cfg.hair : cfg.skin))),
      mEyePatch: K.mesh(r, b => KC.headGrid(b, R, KC.EYE_PATCH[0], KC.EYE_PATCH[1], KC.EYE_PATCH[2], KC.EYE_PATCH[3], 16, 8, null, 1.004, true)),
      mMouthPatch: K.mesh(r, b => KC.headGrid(b, R, KC.MOUTH_PATCH[0], KC.MOUTH_PATCH[1], KC.MOUTH_PATCH[2], KC.MOUTH_PATCH[3], 12, 8, null, 1.004, true)),
      mHair: K.mesh(r, b => hairStyle(b, R, cfg))
    };
  }

  function buildLook(r, key) {
    const cfg = cfgOf(key);
    const P = Object.assign({ cfg, key }, lookHead(r, cfg));
    P.mTorso = torsoFor(r, cfg);
    P.mPelvis = pelvisFor(r, cfg);
    P.limbs = limbsFor(r, cfg);
    P.stripes = null;
    return P;
  }

  function buildJersey(r, base) {
    const cfg = KC.CHARS.kazuma;
    const D = KC.DIMS.kazuma;
    const J = JERSEY;
    const P = Object.assign({}, base, { cfg, key: 'kazumaJ' });
    P.mTorso = K.mesh(r, b => {
      const rings = torsoRings(false);
      const colAt = (y) => (y > 0.235 ? cfg.skin : y > 0.11 ? J.black : y > 0.095 ? J.white : y > -0.085 ? J.green : J.black);
      const pts = [];
      rings.forEach((q, i) => {
        pts.push(q);
        const nx = rings[i + 1];
        if (nx && q.y < 0.1 && nx.y > 0.1) pts.push({ y: 0.095, rx: lerp(q.rx, nx.rx, (0.095 - q.y) / (nx.y - q.y)), rz: lerp(q.rz, nx.rz, (0.095 - q.y) / (nx.y - q.y)) }, { y: 0.11, rx: lerp(q.rx, nx.rx, (0.11 - q.y) / (nx.y - q.y)), rz: lerp(q.rz, nx.rz, (0.11 - q.y) / (nx.y - q.y)) });
        if (nx && q.y < -0.085 && nx.y > -0.085) pts.push({ y: -0.085, rx: lerp(q.rx, nx.rx, (-0.085 - q.y) / (nx.y - q.y)), rz: lerp(q.rz, nx.rz, (-0.085 - q.y) / (nx.y - q.y)) });
      });
      pts.sort((a, b2) => a.y - b2.y);
      loft(b, pts.map(q => ring(q.y, q.rx, q.rz, 0, colAt(q.y + 0.0001))), 14, { capTop: true, capBottom: true, hard: true });
      K.tube(b, [[0, 0.22, 0.004], [0, 0.31, 0.012]], [0.034, 0.032], 8, cfg.skin);
      loft(b, [ring(0.215, 0.062, 0.05, 0.004, J.black), ring(0.27, 0.052, 0.046, 0.006, J.black), ring(0.275, 0.054, 0.048, 0.006, J.white)], 12, { hard: true });
      boxAt(b, [0, 0.07, 0.081], [0.006, 0.3, 0.006], 0xb8bcc4);
      [-1, 1].forEach(s => {
        b.quad([s * 0.012, 0.11, 0.08], [s * 0.13, 0.12, 0.05], [s * 0.13, 0.105, 0.05], [s * 0.012, 0.095, 0.08], J.white);
      });
    });
    P.mPelvis = K.mesh(r, b => {
      loft(b, [ring(-0.13, 0.145, 0.115, 0, J.green), ring(0.03, 0.12, 0.088, 0, J.green)], 14, { hard: true, capTop: true, capBottom: true });
    });
    const up = (f) => lerp(0.04, 0.034, f);
    const fo = (f) => lerp(0.034, 0.028, f) + (f > 0.88 ? 0.004 : 0);
    const th = (f) => lerp(0.07, 0.05, f);
    const sh = (f) => 0.05 - 0.012 * f + 0.006 * S(PI * Math.min(1, f * 1.6)) * (f < 0.6 ? 1 : 0);
    P.limbs = {
      upperL: KC.limbMesh(r, D.upper, [[0, J.black]], up, true),
      foreL: KC.limbMesh(r, D.fore, [[0, J.black], [0.9, J.white]], fo),
      thighL: KC.limbMesh(r, D.thigh, [[0, J.green]], th, true),
      shinL: KC.limbMesh(r, D.shin, [[0, J.green], [0.86, J.black]], sh),
      foot: KC.footMesh(r, J.shoe, J.sole, 0.16),
      hand: KC.handMesh(r, cfg.skin)
    };
    P.limbs.upperR = P.limbs.upperL;
    P.limbs.foreR = P.limbs.foreL;
    P.limbs.thighR = P.limbs.thighL;
    P.limbs.shinR = P.limbs.shinL;
    P.stripes = {
      upperL: stripe(r, D.upper, 1, J.white, 0.04), upperR: stripe(r, D.upper, -1, J.white, 0.04),
      foreL: stripe(r, D.fore * 0.88, 1, J.white, 0.034), foreR: stripe(r, D.fore * 0.88, -1, J.white, 0.034),
      thighL: stripe(r, D.thigh, 1, J.white, 0.07), thighR: stripe(r, D.thigh, -1, J.white, 0.07),
      shinL: stripe(r, D.shin * 0.85, 1, J.white, 0.05), shinR: stripe(r, D.shin * 0.85, -1, J.white, 0.05)
    };
    P.mCape = null;
    P.mHairBack = null;
    P.mHat = null;
    P.extras = null;
    return P;
  }

  function buildProps(r) {
    const m = (fn) => K.mesh(r, fn);
    return {
      dagger: m(b => {
        boxAt(b, [0, 0, -0.03], [0.026, 0.026, 0.11], 0x4a3020);
        boxAt(b, [0, 0, 0.03], [0.07, 0.016, 0.016], 0x8a8a92);
        b.quad([-0.022, 0, 0.04], [0.022, 0, 0.04], [0.008, 0, 0.26], [-0.008, 0, 0.26], rgb(0xe8eef4, 0.3));
        b.tri([-0.008, 0, 0.26], [0.008, 0, 0.26], [0, 0, 0.3], rgb(0xe8eef4, 0.3));
      }),
      sword: m(b => {
        boxAt(b, [0, 0, -0.06], [0.03, 0.03, 0.18], 0x3a2a20);
        boxAt(b, [0, 0, 0.04], [0.14, 0.03, 0.03], 0xc8a040);
        b.quad([-0.025, 0, 0.05], [0.025, 0, 0.05], [0.02, 0, 0.72], [-0.02, 0, 0.72], rgb(0xe0e6ee, 0.3));
        b.tri([-0.02, 0, 0.72], [0.02, 0, 0.72], [0, 0, 0.8], rgb(0xe0e6ee, 0.3));
      }),
      greatsword: m(b => {
        boxAt(b, [0, 0, -0.1], [0.036, 0.036, 0.24], 0x6a3a1e);
        boxAt(b, [0, 0, 0.04], [0.26, 0.04, 0.05], 0xd8a838);
        b.quad([-0.04, 0, 0.06], [0.04, 0, 0.06], [0.035, 0, 1.1], [-0.035, 0, 1.1], rgb(0xe8eef6, 0.35));
        b.tri([-0.035, 0, 1.1], [0.035, 0, 1.1], [0, 0, 1.2], rgb(0xe8eef6, 0.35));
        boxAt(b, [0, 0.002, 0.55], [0.01, 0.004, 0.95], 0xa8b0bc);
      }),
      gram: m(b => {
        boxAt(b, [0, 0, -0.1], [0.04, 0.04, 0.24], 0x1e1e2a);
        boxAt(b, [0, 0, 0.04], [0.34, 0.06, 0.06], 0xe8b83a);
        b.quad([-0.06, 0, 0.07], [0.06, 0, 0.07], [0.07, 0, 1.3], [-0.05, 0, 1.3], rgb(0x6a8ae0, 0.35));
        b.tri([-0.05, 0, 1.3], [0.07, 0, 1.3], [0.04, 0, 1.45], rgb(0x6a8ae0, 0.35));
        boxAt(b, [0.005, 0.003, 0.7], [0.016, 0.006, 1.2], 0xc8d8ff);
      }),
      staffAqua: m(b => {
        b.push(M4.rotX(PI / 2));
        b.prism(8, 0.014, 0.014, -0.9, 0.014, 0.014, 0.75, 0xf4f4f8);
        b.pop();
        b.push(M4.translate(0, 0, 0.82));
        for (let i = 0; i < 12; i++) {
          const a0 = (i / 12) * PI * 2, a1 = ((i + 1) / 12) * PI * 2;
          K.tube(b, [[C(a0) * 0.08, 0, S(a0) * 0.08 + 0.02], [C(a1) * 0.08, 0, S(a1) * 0.08 + 0.02]], [0.012, 0.012], 5, 0xe8f0f8);
        }
        ellAt(b, [0, 0, 0.02], 0.035, 0.035, 0.035, 8, 6, rgb(0x3a8ae8, 0.35));
        b.pop();
      }),
      staffMeg: m(b => {
        b.push(M4.rotX(PI / 2));
        b.prism(7, 0.02, 0.02, -0.75, 0.016, 0.016, 0.9, 0x8a5a34);
        b.pop();
        K.tube(b, [[0, 0, 0.9], [0.06, 0, 1.0], [0.0, 0, 1.12], [-0.08, 0, 1.06], [-0.05, 0, 0.98]], [0.02, 0.018, 0.016, 0.014, 0.01], 6, 0x7a4a2a);
        ellAt(b, [-0.01, 0, 1.03], 0.05, 0.05, 0.05, 8, 6, rgb(0xd02838, 0.5));
        boxAt(b, [0, 0, 0.6], [0.05, 0.05, 0.06], 0xe8e0d0);
      }),
      bread: m(b => {
        ellAt(b, [0, 0, 0.0], 0.06, 0.035, 0.05, 8, 6, 0xc88a40);
        ellAt(b, [0.02, 0.015, 0.01], 0.04, 0.025, 0.035, 7, 5, 0xd8a050);
      }),
      tray: m(b => {
        b.prism(14, 0.2, 0.2, -0.01, 0.2, 0.2, 0.01, 0xa87a3a, { capBottom: true });
        b.push(M4.translate(-0.06, 0.01, 0));
        b.prism(10, 0.06, 0.06, 0, 0.065, 0.065, 0.025, 0xd89a48);
        b.prism(10, 0.066, 0.066, 0.025, 0.066, 0.066, 0.035, 0x6a3a1e);
        b.prism(10, 0.068, 0.068, 0.035, 0.068, 0.068, 0.042, 0x78c040);
        b.prism(10, 0.065, 0.065, 0.042, 0.02, 0.02, 0.075, 0xd89a48);
        b.pop();
        b.push(M4.translate(0.09, 0.01, 0.05));
        b.prism(10, 0.03, 0.03, 0, 0.035, 0.035, 0.05, 0xf4f4f4);
        b.pop();
        boxAt(b, [0.08, 0.03, -0.08], [0.08, 0.05, 0.05], 0xf0e0b0);
      }),
      mug: m(b => {
        b.push(M4.rotX(-PI / 2));
        b.prism(10, 0.055, 0.055, -0.1, 0.055, 0.055, 0.08, 0xc8ccd4, { capBottom: true });
        b.prism(10, 0.06, 0.06, 0.08, 0.066, 0.066, 0.13, rgb(0xfaf6ec, 0.45));
        boxAt(b, [0.075, 0, 0], [0.03, 0.12, 0.02], 0xa8acb4);
        b.pop();
      }),
      thumb: m(b => {
        ellAt(b, [0, 0, 0.045], 0.013, 0.013, 0.035, 6, 5, 0xf8dcc8);
      }),
      thumbDark: m(b => {
        ellAt(b, [0, 0, 0.045], 0.014, 0.014, 0.035, 6, 5, 0x2c2a30);
      }),
      orb: m(b => {
        ellAt(b, [0, 0, 0], 0.07, 0.07, 0.07, 10, 8, rgb(0x9ae8ff, 1));
      })
    };
  }

  function build(r) {
    const base = KC.build(r);
    const chars = Object.assign({}, base.chars);
    chars.kazumaJ = buildJersey(r, base.chars.kazuma);
    Object.keys(LOOKS).forEach(k => {
      if (k !== 'kazumaJ') chars[k] = buildLook(r, k);
    });
    return { chars, props: buildProps(r) };
  }

  function propMatrix(origin, dir, upHint) {
    const z = V3.norm(dir);
    let x = V3.cross(upHint || [0, 1, 0], z);
    if (V3.len(x) < 1e-4) x = [1, 0, 0];
    x = V3.norm(x);
    const y = V3.cross(z, x);
    return Rig.basisM(origin, x, y, z);
  }

  function gripPoint(m, hand) {
    return M4.point(m['hand' + hand], [0, -0.05, 0.012]);
  }

  function drawProps(r, V, m, pose) {
    (pose.props || []).forEach(p => {
      const mesh = V.props[p.kind];
      if (!mesh) return;
      const at = p.hand ? V3.add(gripPoint(m, p.hand), p.off || [0, 0, 0]) : p.pos;
      const mm = M4.chain(propMatrix(at, p.dir || [0, 1, 0], p.up), M4.scale(p.s || 1, p.s || 1, p.s || 1));
      r.draw(mesh, mm, p.glow ? { tint: p.glow } : {});
    });
  }

  function drawThumbs(r, V, m, pose) {
    const mesh = pose.glove ? V.props.thumbDark : V.props.thumb;
    if (pose.thumbR) r.draw(mesh, propMatrix(M4.point(m.handR, [0, -0.04, 0.02]), pose.thumbR, [0, 0, 1]));
    if (pose.thumbL) r.draw(mesh, propMatrix(M4.point(m.handL, [0, -0.04, 0.02]), pose.thumbL, [0, 0, 1]));
  }

  function drawChar(r, V, who, m, pose) {
    if (BASE.includes(who)) {
      KC.drawChar(r, V, who, m, pose);
      drawThumbs(r, V, m, pose);
      drawProps(r, V, m, pose);
      return;
    }
    const P = V.chars[who] || V.chars.aqua;
    const L = P.limbs;
    const o = pose.flat ? { flat: pose.flat } : {};
    r.draw(P.mPelvis, m.pelvis, o);
    r.draw(P.mTorso, m.chest, o);
    r.draw(L.upperL, m.upperL, o);
    r.draw(L.upperR, m.upperR, o);
    r.draw(L.foreL, m.foreL, o);
    r.draw(L.foreR, m.foreR, o);
    r.draw(L.hand, m.handL, o);
    r.draw(L.hand, M4.mul(m.handR, M4.scale(-1, 1, 1)), o);
    r.draw(L.thighL, m.thighL, o);
    r.draw(L.thighR, m.thighR, o);
    r.draw(L.shinL, m.shinL, o);
    r.draw(L.shinR, m.shinR, o);
    r.draw(L.foot, m.footL, o);
    r.draw(L.foot, m.footR, o);
    if (P.stripes) Object.keys(P.stripes).forEach(k => r.draw(P.stripes[k], m[k], o));
    r.draw(P.mHead, m.head, o);
    if (!pose.flat) {
      r.draw(P.mEyePatch, m.head, { texture: P.eyeTex(pose.eyes || 'open', pose.gaze, pose.blush) });
      r.draw(P.mMouthPatch, m.head, { texture: P.mouthTex(pose.mouth || 'smile') });
    }
    r.draw(P.mHair, m.head, o);
    drawThumbs(r, V, m, pose);
    drawProps(r, V, m, pose);
  }

  window.KonopCast = { LOOKS, BASE, build, solve, drawChar, drawProps, standY, standLegs, dims, propMatrix, gripPoint };
})();
