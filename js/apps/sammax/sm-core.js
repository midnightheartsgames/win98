(function (S) {
  'use strict';
  const W = 320, H = 200;

  const RAMPS = {
    grey: ['#141418', '#34343c', '#5c5c68', '#8c8c98', '#bcbcc4', '#e4e4ea'],
    fur: ['#3c1a06', '#643010', '#94501e', '#bc7432', '#dc9c58'],
    suit: ['#26304c', '#44567c', '#6c84b0', '#94acd4', '#c4d4f0'],
    navy: ['#0c1028', '#1c2450', '#303c78', '#4c5ca0'],
    maxw: ['#282c44', '#646c94', '#a4acc8', '#e0e4f4', '#ffffff'],
    red: ['#3c0404', '#780c0c', '#b41c14', '#e8402c', '#ff8468'],
    orange: ['#4c1c00', '#8c3c00', '#cc6410', '#f49830', '#ffcc68'],
    yellow: ['#4c3c00', '#8c7400', '#c8ac10', '#f0dc38', '#fff890'],
    cheese: ['#6c4400', '#b07c08', '#e0b020', '#f8d850', '#fff4a0'],
    green: ['#062a0c', '#105218', '#1e8028', '#48b040', '#98e07c'],
    olive: ['#262a08', '#444c12', '#687420', '#949c38', '#c4c86c'],
    teal: ['#04282c', '#0c4c54', '#187880', '#34a8a8', '#7cd8cc'],
    blue: ['#060c34', '#10247c', '#1c48b8', '#3c80e8', '#88c0ff'],
    sky: ['#2c4c9c', '#4474c8', '#6c9ce0', '#9cc4f0', '#cce4fc'],
    purple: ['#1c0630', '#3c1060', '#662494', '#9648c0', '#c888ec'],
    plum: ['#2a0c24', '#4c1840', '#7a2c64', '#a8508c', '#d484b8'],
    pink: ['#4c0c2c', '#8c1c54', '#d03c80', '#f478b0', '#ffc0dc'],
    skin: ['#582810', '#9c5430', '#d08858', '#f0b484', '#ffdcb8'],
    dskin: ['#1c0a04', '#3a1a0a', '#643214', '#8c5028', '#b47848'],
    wood: ['#2c1406', '#522810', '#7c4018', '#a8602a', '#d0884a'],
    oak: ['#3c2008', '#6c3c10', '#9c6020', '#c88c3c', '#e8b870'],
    brick: ['#3c0c08', '#6c1c10', '#9c3420', '#c45434', '#e08460'],
    stone: ['#2c2830', '#4c4854', '#747080', '#a09cac', '#ccc8d4'],
    sand: ['#4c3820', '#7c6038', '#a88c5c', '#d0b888', '#f0e0bc'],
    asphalt: ['#1c1c28', '#303444', '#484c60', '#646880', '#8488a0'],
    lilac: ['#2c2048', '#4c3c78', '#7460a8', '#a088d0', '#ccb8f0'],
    mint: ['#0c3024', '#1c5840', '#34886a', '#5cb894', '#a0e4c4'],
    rose: ['#40141c', '#742834', '#a84450', '#d0707c', '#f0a8b0'],
    night: ['#08061a', '#141034', '#221c50', '#342c70', '#4c4494'],
    gold: ['#3c2400', '#7c5400', '#bc8c10', '#ecc038', '#fff08c'],
    slime: ['#0c2c04', '#205c08', '#3c9410', '#6cc820', '#b0f058'],
    rat: ['#241c16', '#463a30', '#6e5e50', '#98867a', '#c4b4a4'],
    cream: ['#5c4c30', '#948058', '#c8b488', '#e8dcb8', '#fcf6e4'],
    hair: ['#3c0c04', '#6c1c0c', '#9c3414', '#c85420', '#e8803c'],
    pale: ['#5c3c40', '#9c7474', '#c8a4a0', '#e8ccc4', '#fcece6'],
    orchid: ['#5a2c58', '#8c4c88', '#c07cb8', '#e4a4d8', '#fcd0f0'],
    pistachio: ['#34461c', '#5a742e', '#84a050', '#aac878', '#d0e6a4']
  };

  const PALETTE = [[0, 0, 0], [0, 0, 0], [255, 255, 255]];
  const C = { clear: 0, black: 1, white: 2 };
  const DARKER = [0, 1, 1];
  const LIGHTER = [0, 1, 2];
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

  for (const [name, list] of Object.entries(RAMPS)) {
    const idx = [];
    for (let i = 0; i < list.length; i++) {
      idx.push(PALETTE.length);
      PALETTE.push(hex(list[i]));
    }
    for (let i = 0; i < idx.length; i++) {
      DARKER[idx[i]] = i > 0 ? idx[i - 1] : 1;
      LIGHTER[idx[i]] = i < idx.length - 1 ? idx[i + 1] : 2;
    }
    C[name] = idx;
  }
  DARKER[2] = C.grey[5];

  const SPECIAL = 232;
  while (PALETTE.length < SPECIAL) { PALETTE.push([0, 0, 0]); DARKER.push(1); LIGHTER.push(2); }
  const CYCLE = [];
  const cycleCols = ['#ff2c9c', '#ffe03c', '#3cf0ff', '#9c3cff', '#ff2c9c', '#ffe03c', '#3cf0ff', '#9c3cff'];
  for (let i = 0; i < 8; i++) { CYCLE.push(PALETTE.length); PALETTE.push(hex(cycleCols[i])); DARKER.push(1); LIGHTER.push(2); }
  C.cycle = CYCLE;
  C.glow = PALETTE.length; PALETTE.push([255, 255, 240]); DARKER.push(C.grey[4]); LIGHTER.push(2);
  C.pupil = PALETTE.length; PALETTE.push([8, 8, 8]); DARKER.push(1); LIGHTER.push(1);
  C.tvA = PALETTE.length; PALETTE.push([150, 220, 255]); DARKER.push(C.sky[2]); LIGHTER.push(2);
  C.tvB = PALETTE.length; PALETTE.push([60, 110, 200]); DARKER.push(C.sky[0]); LIGHTER.push(C.tvA);
  C.lamp = PALETTE.length; PALETTE.push([255, 236, 150]); DARKER.push(C.yellow[3]); LIGHTER.push(2);
  C.neonA = PALETTE.length; PALETTE.push([255, 80, 120]); DARKER.push(C.red[2]); LIGHTER.push(C.pink[4]);
  C.neonB = PALETTE.length; PALETTE.push([90, 255, 170]); DARKER.push(C.green[2]); LIGHTER.push(C.mint[4]);
  C.eye = PALETTE.length; PALETTE.push([250, 250, 246]); DARKER.push(C.grey[4]); LIGHTER.push(2);
  while (PALETTE.length < 256) { PALETTE.push([0, 0, 0]); DARKER.push(1); LIGHTER.push(2); }

  const EMISSIVE = new Uint8Array(256);
  for (const i of [C.glow, C.lamp, C.neonA, C.neonB, C.tvA, C.tvB, C.eye, ...CYCLE]) EMISSIVE[i] = 1;

  const PAL0 = { id: 'sammax', PALETTE, DARKER, LIGHTER, EMISSIVE, CYCLE, C };

  function makePalette(id, ramps, o) {
    o = o || {};
    const P = [[0, 0, 0], [0, 0, 0], [255, 255, 255]];
    const D = [0, 1, 1], L = [0, 1, 2];
    const K = { clear: 0, black: 1, white: 2 };
    const em = new Uint8Array(256);
    for (const [name, list] of Object.entries(ramps)) {
      const idx = [];
      for (let i = 0; i < list.length; i++) { idx.push(P.length); P.push(hex(list[i])); }
      for (let i = 0; i < idx.length; i++) {
        D[idx[i]] = i > 0 ? idx[i - 1] : 1;
        L[idx[i]] = i < idx.length - 1 ? idx[i + 1] : 2;
      }
      K[name] = idx;
    }
    const cyc = [];
    for (const h of o.cycle || []) { cyc.push(P.length); em[P.length] = 1; P.push(hex(h)); D.push(1); L.push(2); }
    K.cycle = cyc;
    for (const [name, h, glow] of o.special || []) { K[name] = P.length; if (glow) em[P.length] = 1; P.push(hex(h)); D.push(1); L.push(2); }
    if (P.length > 256) throw new Error('palette ' + id + ' needs ' + P.length + ' colours');
    while (P.length < 256) { P.push([0, 0, 0]); D.push(1); L.push(2); }
    return { id, PALETTE: P, DARKER: D, LIGHTER: L, EMISSIVE: em, CYCLE: cyc, C: K };
  }

  function usePalette(p) { S.pal = p || PAL0; return S.pal; }

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  const approach = (v, t, step) => v < t ? Math.min(t, v + step) : Math.max(t, v - step);

  function hash(a, b, c) {
    let h = (a * 374761393 + b * 668265263 + (c || 0) * 2246822519) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  class RNG {
    constructor(seed) { this.s = (seed >>> 0) || 1; }
    next() {
      let t = this.s += 0x6d2b79f5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    int(n) { return Math.floor(this.next() * n); }
    pick(a) { return a[this.int(a.length)]; }
    shuffle(a) {
      const r = a.slice();
      for (let i = r.length - 1; i > 0; i--) { const j = this.int(i + 1); const t = r[i]; r[i] = r[j]; r[j] = t; }
      return r;
    }
  }

  const COLORS = {
    sam: C.orange[3],
    max: 2,
    jimmy: C.grey[4],
    phone: C.sky[3],
    bosco: C.green[4],
    sybil: C.pink[3],
    specs: C.yellow[3],
    whizzer: C.teal[4],
    peepers: C.lilac[4],
    brady: C.red[4],
    monkey: C.cheese[3],
    tv: C.yellow[4],
    driver: C.mint[4],
    popper: C.rose[4],
    sign: C.gold[4]
  };

  Object.assign(S, { W, H, RAMPS, PALETTE, C, DARKER, LIGHTER, EMISSIVE, CYCLE, COLORS, PAL0, pal: PAL0, makePalette, usePalette, hex, clamp, lerp, dist, approach, hash, RNG });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
