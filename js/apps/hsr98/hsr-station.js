(function (H) {
  'use strict';
  const G = H.Gfx;
  const U = 16;
  const hash = (x, y, s) => G.hash(x, y, s);

  const ZONES = {
    control: {
      roof: '#0a0f1c', roofHi: '#1a2440', trim: '#e8a848', trimDk: '#8a5a22', strip: '#56d4ff',
      high: ['#c8d0dc', '#e6ecf4', '#98a2b4'], low: ['#b0b9c8', '#d0d7e2', '#788398'],
      floor: ['#262e40', '#323c52', '#1c2232'], seam: '#3e4a64',
      glass: ['#123a70', '#2f7ad0', '#0a2448'], accent: ['#9a5a2a', '#c07a3a', '#5e3416'],
      metal: ['#4a5468', '#66728a', '#323a4a'], mat: ['#1e4a52', '#2a6670', '#143438'],
      void: '#04060e', tint: null
    },
    base: {
      roof: '#0b0e18', roofHi: '#1a2030', trim: '#f0a838', trimDk: '#9a6020', strip: '#46c8ff',
      high: ['#3a4458', '#4e5a72', '#283040'], low: ['#323a4c', '#465268', '#20263a'],
      floor: ['#2c3344', '#384156', '#21283a'], seam: '#454f66',
      glass: ['#155a9a', '#3aa0f0', '#0c3a6a'], accent: ['#4a3e2a', '#6a5634', '#2e2618'],
      metal: ['#4a5262', '#626c80', '#323844'], mat: ['#3a2a3a', '#4a3a4c', '#281c28'],
      void: '#04060c', tint: null
    },
    storage: {
      roof: '#0a141c', roofHi: '#16283a', trim: '#f0c040', trimDk: '#8a6a1c', strip: '#ffd040',
      high: ['#4a7a94', '#6a9ab4', '#2e5468'], low: ['#3e6a82', '#5a8aa4', '#264a5e'],
      floor: ['#22303c', '#2e3e4c', '#18222c'], seam: '#3a4c5c',
      glass: ['#1a6a90', '#5ac0e8', '#0e4058'], accent: ['#c8ccd0', '#eef0f2', '#8a9096'],
      metal: ['#46525e', '#5e6c7a', '#2e3842'], mat: ['#2a2440', '#3a3258', '#1c1830'],
      void: '#050a10', tint: 'rgba(120,200,255,0.035)'
    },
    supply: {
      roof: '#090c14', roofHi: '#171d2c', trim: '#ff9a40', trimDk: '#8a4a18', strip: '#ff9a40',
      high: ['#2e3646', '#3e4860', '#1e2432'], low: ['#283040', '#384258', '#1a2030'],
      floor: ['#1e2533', '#2a3244', '#151a26'], seam: '#343e52',
      glass: ['#1a4a7a', '#4a90d0', '#0e2a4a'], accent: ['#3a4a62', '#506482', '#26324a'],
      metal: ['#3e4656', '#56607a', '#282e3a'], mat: ['#3a2e22', '#4e3e2c', '#261e16'],
      void: '#03050a', tint: 'rgba(255,150,60,0.03)'
    },
    seclusion: {
      roof: '#070a18', roofHi: '#141c38', trim: '#ffd050', trimDk: '#8a6a20', strip: '#4ab0ff',
      high: ['#1e2a50', '#2c3a68', '#141c38'], low: ['#1a2446', '#283662', '#10162e'],
      floor: ['#161e36', '#222c4a', '#0e1428'], seam: '#28345a',
      glass: ['#1a4aa0', '#4a8af0', '#0e2a68'], accent: ['#2a6a7a', '#3a9aaa', '#1a4450'],
      metal: ['#2e3a5a', '#3e4c74', '#1e2640'], mat: ['#1e4a2a', '#2a6a3a', '#123018'],
      void: '#03040c', tint: 'rgba(80,140,255,0.04)'
    },
    office: {
      roof: '#080c1c', roofHi: '#18223e', trim: '#4ab0ff', trimDk: '#1a4a8a', strip: '#6ad0ff',
      high: ['#1e2a4a', '#2c3c64', '#141c34'], low: ['#26345a', '#34467a', '#18223e'],
      floor: ['#b88a58', '#d0a470', '#8a6440'], seam: '#9a7448',
      glass: ['#4a5262', '#6a7488', '#323844'], accent: ['#6a4a9a', '#8a6ac0', '#46306a'],
      metal: ['#3e4c74', '#566690', '#2a3452'], mat: ['#4a2a4a', '#6a3a62', '#301a30'],
      void: '#04060e', tint: 'rgba(80,160,255,0.035)'
    }
  };

  const C = {
    out: '#06080e', white: '#eef2f8', whiteDk: '#b8c0cc', steel: '#7a8498', steelDk: '#4a5262', steelHi: '#aab4c4',
    navy: '#1a2236', navyHi: '#2a3550', gold: '#e8a848', goldHi: '#ffd890', goldDk: '#8a5a22',
    blue: '#3aa0f0', blueHi: '#b8e8ff', blueDk: '#145090', cyan: '#56d4ff',
    leaf: '#3a9a4a', leafHi: '#7ad06a', leafDk: '#1e5a2a', pink: '#e8507a', pinkHi: '#ff8ab0', pinkDk: '#8a2a4a',
    orange: '#ff9a40', orangeHi: '#ffd0a0', yellow: '#ffd040', red: '#e04040', shade: 'rgba(2,4,12,0.4)'
  };

  function pen(g, ox, oy) {
    const P = G.tilePainter(g, ox, oy);
    P.oval = (cx, cy, rx, ry, c) => {
      for (let y = -ry; y <= ry; y++) {
        const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry || 1))));
        P(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1, c);
      }
    };
    P.ring = (cx, cy, rx, ry, c) => {
      const n = Math.max(12, Math.round((rx + ry) * 3));
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; P.dot(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), c); }
    };
    P.arc = (cx, cy, rx, ry, a0, a1, c) => {
      const n = Math.max(8, Math.round((rx + ry) * Math.abs(a1 - a0)));
      for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; P.dot(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), c); }
    };
    P.line = (x0, y0, x1, y1, c, w) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) P(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), w || 1, w || 1, c);
    };
    P.box = (x, y, w, h, d, top, front, rim) => {
      P(x, y, w, h, top); P(x, y + h, w, d, front);
      if (rim) P(x, y, w, 1, rim);
      P(x, y + h + d - 1, w, 1, C.out);
    };
    P.shadow = (cx, cy, rx, ry) => P.oval(cx, cy, rx, ry, C.shade);
    P.screen = (x, y, w, h, col, seed) => {
      P(x, y, w, h, '#06101e'); P(x + 1, y + 1, w - 2, h - 2, col || '#103a6a');
      for (let j = y + 2; j < y + h - 2; j += 2) {
        const len = Math.max(1, Math.floor(hash(j, seed || 0, 91) * (w - 4)));
        P(x + 2, j, len, 1, hash(j, (seed || 0) + 1, 92) > 0.7 ? '#ffd890' : '#8ad8ff');
      }
      P(x, y, w, 1, '#2a4a6a');
    };
    return P;
  }

  function sprite(w, h, up, draw) {
    const cv = G.mkCanvas(w, h + up), g = cv.getContext('2d');
    draw(pen(g, 0, up), g);
    return cv;
  }

  const CURIOS = [
    P => { for (let i = 0; i < 4; i++) P.tri([4 + i, 10 - i * 2, 8, 2 + i, 12 - i, 10 - i * 2], i % 2 ? '#f4ecd8' : '#d8c8a8'); },
    P => { P(4, 6, 8, 4, '#d8a830'); P.tri([4, 6, 5, 2, 7, 6], '#ffd040'); P.tri([7, 6, 8, 1, 10, 6], '#ffd040'); P.tri([10, 6, 11, 2, 12, 6], '#ffd040'); P.dot(8, 8, '#e04060'); },
    P => { P(4, 5, 8, 6, '#6ac8e8'); P(5, 6, 6, 4, '#b8f0ff'); P(4, 5, 8, 1, '#ffffff'); P.dot(7, 8, '#ffd8f0'); },
    P => { P.oval(8, 7, 4, 4, '#1a1a24'); P.ring(8, 7, 5, 5, '#c8a050'); P.dot(7, 6, '#6a5aa8'); },
    P => { P.line(4, 11, 11, 3, '#c04a3a', 2); P.line(5, 11, 12, 3, '#ff7a5a'); P.dot(12, 2, '#ffd0a0'); P.dot(3, 12, '#5a2a1a'); },
    P => { P.tri([2, 7, 8, 4, 8, 9], '#22222a'); P.tri([14, 7, 8, 4, 8, 9], '#22222a'); P.line(3, 7, 7, 5, '#5a5a6a'); P.line(13, 7, 9, 5, '#5a5a6a'); },
    P => { P(7, 2, 2, 10, '#a8b0c0'); P(7, 2, 2, 1, '#ffffff'); P(6, 11, 4, 1, '#5a6070'); P.dot(8, 4, '#ff6040'); },
    P => { P(4, 6, 6, 3, '#4a4a58'); P(9, 5, 3, 2, '#4a4a58'); P(5, 9, 2, 3, '#3a3a46'); P.dot(11, 5, '#ff4040'); P(4, 6, 6, 1, '#7a7a8a'); },
    P => {},
    P => { P.oval(8, 8, 4, 3, '#f0d8c8'); P.arc(8, 8, 4, 3, 3.6, 6.0, '#c8a090'); P.dot(10, 7, '#ffffff'); },
    P => { P.tri([4, 11, 8, 3, 12, 11], '#3a3a44'); P.tri([5, 10, 8, 5, 11, 10], '#5a5a66'); P.dot(8, 8, '#a0ff80'); },
    P => { P(5, 5, 6, 6, '#3a3048'); P(6, 6, 4, 4, '#8a6ac0'); P.dot(8, 8, '#ffffff'); },
    P => { P(4, 4, 8, 7, '#5a6a7a'); P(5, 5, 6, 5, '#1a2a3a'); P.line(5, 5, 10, 10, '#ffffff'); P.line(10, 5, 7, 9, '#a8e8ff'); P.dot(6, 9, '#ffe080'); }
  ];

  const CURIO_ART = {
    cards(P) { for (let i = 0; i < 5; i++) { P.tri([4 + i, -6 - i * 4, 8, -22 + i * 1, 12 - i, -6 - i * 4], i % 2 ? '#f4ecd8' : '#d8c8a8'); P.line(4 + i, -6 - i * 4, 12 - i, -6 - i * 4, '#8a7a5a'); } P.dot(8, -22, '#e04060'); },
    crown(P) { P(3, -12, 10, 5, '#5ac0d8'); P(3, -12, 10, 1, '#c8f4ff'); for (const x of [3, 6, 9, 12]) P.tri([x - 1, -12, x, -20, x + 2, -12], x % 2 ? '#8ae8ff' : '#4aa8c8'); P.dot(8, -10, '#ffffff'); P(3, -8, 10, 1, '#2a6a8a'); },
    joy(P) { for (const [x, y] of [[2, -10], [6, -12], [10, -10], [4, -6], [8, -6], [6, -16]]) { P(x, y, 4, 4, '#7a8a9a'); P(x, y, 4, 1, '#d8e8f8'); P.dot(x + 1, y + 2, '#ffd060'); } },
    hole(P) { P(3, -18, 10, 12, '#4a4a52'); P(4, -17, 8, 10, '#2a2a30'); P.oval(8, -12, 3, 3, '#0a0a10'); P.ring(8, -12, 4, 4, '#ff9a40'); P(3, -18, 10, 1, '#8a8a92'); P.dot(5, -16, '#e8c860'); P(4, -6, 2, 2, '#3a3a40'); P(10, -6, 2, 2, '#3a3a40'); },
    blade(P) { const bits = [[7, -22, 2, 4], [8, -17, 2, 5], [7, -11, 3, 3], [9, -7, 2, 3], [6, -5, 2, 2]]; for (const [x, y, w, h] of bits) { P(x, y, w, h, '#c03a2a'); P(x, y, 1, h, '#ff7a5a'); } P(5, -4, 6, 1, '#5a2a1a'); P.dot(11, -20, '#ffb080'); },
    wings(P) { P.tri([8, -12, 1, -18, 3, -8], '#22222a'); P.tri([8, -12, 15, -18, 13, -8], '#22222a'); P.tri([8, -12, 2, -15, 4, -10], '#4a4a5a'); P.tri([8, -12, 14, -15, 12, -10], '#4a4a5a'); P(7, -13, 2, 3, '#3a3a44'); },
    rod(P) { P(7, -22, 2, 18, '#4aa8ff'); P(6, -22, 4, 2, '#c8f0ff'); P(7, -24, 2, 2, '#ffffff'); P(6, -6, 4, 2, '#2a5a9a'); P.dot(8, -16, '#ffffff'); },
    shard(P) { P(3, -16, 10, 9, '#4a4a58'); P(4, -15, 8, 7, '#1a2a3a'); P.line(5, -15, 10, -9, '#ffffff'); P.line(10, -15, 7, -10, '#a8e8ff'); P(4, -7, 8, 2, '#3a3a44'); for (const [x, y] of [[2, -19], [13, -18], [12, -6], [1, -9]]) P.dot(x, y, '#ffe080'); },
    pistol(P) { P(3, -12, 10, 4, '#f0c020'); P(3, -12, 10, 1, '#fff0a0'); P(4, -8, 3, 5, '#2a2a30'); P(12, -11, 2, 2, '#3a80d0'); P.ring(8, -16, 3, 3, '#f0c020'); P.oval(8, -16, 2, 2, '#ffffff'); P.dot(8, -16, '#e02030'); P(10, -9, 2, 1, '#ffffff'); },
    conch(P) { P.oval(8, -12, 5, 4, '#f0d8c8'); P.arc(8, -12, 5, 4, 3.6, 6.0, '#c8a090'); P.ring(8, -12, 3, 2, '#a8c8f0'); P.tri([12, -12, 15, -10, 12, -9], '#e8c0b0'); P.dot(10, -14, '#ffffff'); },
    eclipse(P) { P.tri([4, -6, 8, -20, 12, -6], '#5a5a66'); P.tri([5, -7, 8, -17, 11, -7], '#7a7a88'); P.tri([2, -12, 14, -10, 2, -8], '#4a4a54'); P.ring(8, -12, 6, 3, 'rgba(160,160,180,0.6)'); },
    unknown(P) { P(4, -16, 8, 10, '#5a4a3a'); P(4, -16, 8, 1, '#8a7a5a'); P(4, -11, 8, 1, '#3a2a1a'); P(7, -15, 2, 1, '#ffd060'); P(8, -14, 1, 1, '#ffd060'); P(7, -12, 1, 1, '#ffd060'); P(7, -9, 1, 1, '#ffd060'); },
    blind(P) { P.oval(8, -12, 5, 6, 'rgba(200,230,255,0.25)'); P.ring(8, -12, 5, 6, 'rgba(230,250,255,0.6)'); P.dot(6, -14, '#ffffff'); }
  };

  const DECOR = {
    planter: { w: 1, h: 1, up: 14, draw(P, v) {
      P.shadow(8, 14, 7, 2);
      P.box(1, 6, 14, 2, 6, C.whiteDk, C.white, '#ffffff'); P(1, 13, 14, 1, C.gold);
      const pink = v !== 'g';
      for (let i = 0; i < 7; i++) {
        const bx = 3 + i * 1.7, top = -6 - Math.floor(hash(i, 3, 44) * 6), col = pink && i % 2 ? C.pink : C.leaf;
        P.line(Math.round(bx), 6, Math.round(bx + (i - 3) * 1.4), top, col === C.pink ? C.pinkDk : C.leafDk, 2);
        P.line(Math.round(bx), 6, Math.round(bx + (i - 3) * 1.4), top, col);
        P.dot(Math.round(bx + (i - 3) * 1.4), top, pink && i % 2 ? C.pinkHi : C.leafHi);
      }
    } },
    palm: { w: 1, h: 1, up: 24, draw(P) {
      P.shadow(8, 14, 6, 2);
      P.box(4, 8, 8, 2, 5, C.steelDk, C.white, '#ffffff'); P(4, 12, 8, 1, C.gold);
      const fr = [[-1, -2], [17, -2], [1, -10], [15, -10], [5, -18], [11, -19], [8, -22]];
      fr.forEach(([ex, ey], i) => { P.line(8, 7, ex, ey, C.leafDk, 2); P.line(8, 6, ex, ey - 1, i % 2 ? C.leaf : C.leafHi); });
      P(7, 2, 2, 6, C.leafDk);
    } },
    bench: { w: 2, h: 1, up: 6, draw(P) {
      P.shadow(16, 14, 15, 2);
      P(2, 2, 28, 5, C.white); P(2, 2, 28, 1, '#ffffff'); P(2, 7, 28, 2, C.whiteDk); P(2, 9, 28, 1, C.gold);
      P(4, 10, 3, 4, C.steelDk); P(25, 10, 3, 4, C.steelDk); P(2, -3, 28, 4, C.navyHi); P(2, -3, 28, 1, C.steel);
    } },
    console: { w: 2, h: 1, up: 16, draw(P, v) {
      P.shadow(16, 15, 15, 2);
      P.box(0, 4, 32, 3, 8, C.whiteDk, C.white, '#ffffff'); P(0, 12, 32, 1, C.gold); P(2, 8, 28, 1, C.steel);
      for (let i = 0; i < 4; i++) P(3 + i * 7, 5, 5, 2, i % 2 ? '#4a8ac8' : '#c8a050');
      P(3, -11, 12, 13, C.navy); P.screen(4, -10, 10, 10, v === 'r' ? '#5a1a2a' : '#103a6a', 3);
      P(17, -11, 12, 13, C.navy); P.screen(18, -10, 10, 10, '#103a6a', 7);
      P(8, 2, 2, 2, C.steelDk); P(22, 2, 2, 2, C.steelDk);
    }, lights: v => [[16, -2, 22, v === 'r' ? '#ff6070' : '#4ab0ff', 0.25, true]] },
    terminal: { w: 1, h: 1, up: 18, draw(P, v) {
      P.shadow(8, 14, 6, 2);
      P(3, 11, 10, 3, C.steelDk); P(4, 11, 8, 1, C.steel); P(5, 12, 6, 1, C.gold);
      P(5, 3, 6, 8, C.steel); P(6, 3, 2, 8, C.white); P(10, 3, 1, 8, C.steelDk);
      P(3, 1, 10, 3, C.white); P(3, 1, 10, 1, '#ffffff'); P(4, 2, 8, 1, C.cyan);
      P(2, -11, 12, 12, C.navy); P.screen(3, -10, 10, 10, v === 'a' ? '#4a2a10' : '#103a6a', 11);
      P(2, -11, 12, 1, C.steelHi);
    }, lights: v => [[8, -5, 16, v === 'a' ? '#ffb050' : '#4ab0ff', 0.22, true]] },
    column: { w: 1, h: 1, up: 34, draw(P) {
      P.shadow(8, 14, 7, 2);
      P(3, -34, 10, 48, C.white); P(3, -34, 2, 48, '#ffffff'); P(11, -34, 2, 48, C.whiteDk);
      P(3, -8, 10, 3, C.gold); P(3, -7, 10, 1, C.goldHi); P(7, -30, 2, 20, C.cyan); P(7, -30, 2, 1, '#ffffff');
      P(2, 11, 12, 3, C.steelDk); P(2, -35, 12, 2, C.steel);
    }, lights: () => [[8, -18, 18, '#56d4ff', 0.18]] },
    crate: { w: 1, h: 1, up: 6, draw(P, v) {
      P.shadow(8, 14, 7, 2);
      const top = v === 'o' ? '#8a5a2a' : C.steel, front = v === 'o' ? '#6a3a1a' : C.steelDk;
      P.box(1, -2, 14, 5, 10, top, front, v === 'o' ? '#c88a4a' : C.steelHi);
      for (let x = 2; x < 15; x += 4) { P(x, 4, 2, 9, C.yellow); P(x + 2, 4, 2, 9, '#2a2a30'); }
      P(1, 3, 14, 1, C.out); P(4, 0, 8, 1, 'rgba(255,255,255,0.3)');
    } },
    crates: { w: 1, h: 1, up: 18, draw(P) {
      P.shadow(8, 14, 7, 2);
      P.box(1, -2, 14, 5, 10, C.steel, C.steelDk, C.steelHi); for (let x = 2; x < 15; x += 4) P(x, 5, 2, 6, C.yellow);
      P.box(3, -15, 10, 4, 8, '#5a6a8a', '#3e4a66', '#8a9ab8'); P(5, -9, 6, 2, C.cyan);
    } },
    pod: { w: 1, h: 1, up: 16, draw(P) {
      P.shadow(8, 14, 7, 3);
      P.oval(8, 8, 7, 5, C.whiteDk); P.oval(8, 7, 7, 5, C.white); P.oval(8, 3, 6, 6, '#2a6aa8'); P.oval(8, 2, 5, 5, '#5ab0f0');
      P.oval(6, 0, 2, 2, '#c8ecff'); P.oval(8, -2, 5, 2, '#88d0ff'); P(2, 10, 12, 1, C.gold); P(6, 11, 4, 2, C.cyan);
    }, lights: () => [[8, 2, 14, '#5ab0f0', 0.22, true]] },
    display: { w: 1, h: 1, up: 20, draw(P, v) {
      P.shadow(8, 14, 6, 2);
      P(3, 6, 10, 8, C.navy); P(3, 6, 10, 1, C.steel); P(3, 12, 10, 1, C.gold); P(4, 13, 8, 1, C.out);
      P(2, -16, 12, 22, 'rgba(160,220,255,0.18)'); P(2, -16, 1, 22, 'rgba(220,245,255,0.6)'); P(13, -16, 1, 22, 'rgba(120,180,220,0.5)'); P(2, -16, 12, 1, 'rgba(220,245,255,0.7)');
      const art = CURIOS[(v | 0) % CURIOS.length];
      const sub = (x, y, w, h, c) => P(x, y - 13, w, h, c);
      sub.dot = (x, y, c) => P.dot(x, y - 13, c); sub.tri = (pts, c) => P.tri(pts.map((n, i) => i % 2 ? n - 13 : n), c);
      sub.oval = (cx, cy, rx, ry, c) => P.oval(cx, cy - 13, rx, ry, c); sub.ring = (cx, cy, rx, ry, c) => P.ring(cx, cy - 13, rx, ry, c);
      sub.arc = (cx, cy, rx, ry, a, b, c) => P.arc(cx, cy - 13, rx, ry, a, b, c); sub.line = (a, b, c, d, col, w) => P.line(a, b - 13, c, d - 13, col, w);
      art(sub);
      P.dot(4, -14, '#ffffff');
    } },
    pedestal: { w: 1, h: 1, up: 14, draw(P, v) {
      P.shadow(8, 14, 6, 2);
      P.oval(8, 11, 6, 2, C.steelDk); P(3, 4, 10, 7, C.white); P(3, 4, 10, 1, '#ffffff'); P(12, 4, 1, 7, C.whiteDk); P.oval(8, 4, 5, 2, C.whiteDk);
      P.oval(8, -3, 5, 5, v === 'r' ? '#e04060' : '#8a5aff'); P.oval(7, -4, 2, 2, '#ffffff');
    }, lights: v => [[8, -3, 14, v === 'r' ? '#ff6080' : '#a080ff', 0.3, true]] },
    table: { w: 2, h: 1, up: 6, draw(P) {
      P.shadow(16, 14, 14, 2);
      P.oval(16, 4, 14, 5, C.whiteDk); P.oval(16, 3, 14, 5, C.white); P.oval(16, 2, 12, 3, '#ffffff'); P(14, 8, 4, 6, C.steelDk);
      P(6, 0, 4, 3, C.navy); P(20, 1, 5, 2, '#c8a050'); P.dot(12, 2, C.cyan);
    } },
    chair: { w: 1, h: 1, up: 8, draw(P) {
      P.shadow(8, 14, 5, 2);
      P(4, -4, 8, 8, C.navyHi); P(4, -4, 8, 1, C.steel); P(3, 4, 10, 4, C.white); P(3, 4, 10, 1, '#ffffff'); P(7, 8, 2, 5, C.steelDk); P(5, 12, 6, 1, C.steelDk);
    } },
    server: { w: 1, h: 1, up: 22, draw(P) {
      P.shadow(8, 14, 7, 2);
      P(2, -20, 12, 34, '#1a2030'); P(2, -20, 12, 1, C.steel); P(2, -20, 1, 34, C.steelDk);
      for (let y = -17; y < 12; y += 4) { P(4, y, 8, 2, '#2a3246'); P.dot(5, y, hash(y, 1, 5) > 0.5 ? '#40ff80' : '#ffb040'); P.dot(7, y, '#4ab0ff'); }
    }, lights: () => [[8, -4, 12, '#40ff80', 0.15, true]] },
    generator: { w: 2, h: 2, up: 26, draw(P) {
      P.shadow(16, 30, 15, 3);
      P(2, 4, 28, 26, C.steelDk); P(2, 4, 28, 2, C.steel); P(4, 8, 24, 20, '#1a1e2a');
      P(8, -24, 16, 32, C.steel); P(8, -24, 3, 32, C.steelHi); P(21, -24, 3, 32, C.steelDk);
      P(10, -18, 12, 20, '#3a1a08'); P(11, -17, 10, 18, '#ff7a20'); P(13, -15, 6, 14, '#ffd0a0'); P(15, -13, 2, 10, '#ffffff');
      for (let y = -20; y < 6; y += 6) P(8, y, 16, 1, C.steelDk);
      P(4, 24, 24, 2, C.yellow); for (let x = 4; x < 28; x += 4) P(x, 24, 2, 2, '#2a2a30');
      P(0, 12, 4, 10, C.steel); P(28, 12, 4, 10, C.steel); P.dot(1, 14, '#40ff80'); P.dot(30, 14, '#40ff80');
    }, lights: () => [[16, -8, 34, '#ff8a30', 0.35, true]] },
    parts: { w: 2, h: 1, up: 22, draw(P) {
      P.shadow(16, 14, 15, 2);
      P(1, -20, 2, 34, C.steelDk); P(29, -20, 2, 34, C.steelDk);
      for (const y of [-14, -4, 6]) { P(1, y, 30, 2, C.steel); P(1, y, 30, 1, C.steelHi); }
      const bits = ['#c8a050', '#5a6a8a', '#8a4a3a', '#a8b0c0', '#4a8a5a'];
      for (const y of [-14, -4, 6]) for (let x = 3; x < 28; x += 5) { const h = 3 + Math.floor(hash(x, y, 6) * 4); P(x, y - h, 4, h, bits[Math.floor(hash(x, y, 7) * bits.length)]); }
      P(1, 12, 30, 2, C.steelDk);
    } },
    liftcore: { w: 4, h: 3, up: 70, draw(P) {
      P.oval(32, 40, 30, 8, 'rgba(0,0,0,0.45)');
      P.oval(32, 38, 30, 9, '#2a3440'); P.oval(32, 36, 30, 9, '#c8ccd0'); P.oval(32, 36, 27, 7, '#3a4652'); P.ring(32, 36, 30, 9, '#ffffff');
      P(14, -68, 36, 104, '#e2e6ea'); P(14, -68, 6, 104, '#ffffff'); P(44, -68, 6, 104, '#a8b0b8'); P(30, -68, 4, 104, '#2a3440'); P(31, -68, 2, 104, C.yellow);
      for (const y of [-52, -20, 12]) { P(14, y, 36, 2, '#8a949e'); P(20, y + 4, 2, 10, '#6a7a88'); P(42, y + 4, 2, 10, '#6a7a88'); }
      P.oval(32, -2, 32, 8, '#3a3a2a'); P.oval(32, -4, 32, 8, '#e0b030'); P.oval(32, -4, 26, 5, '#ffe080'); P.oval(32, -4, 22, 4, '#2a3440');
      P(14, -6, 36, 4, '#2a3440'); P(14, -70, 36, 3, '#8a949e');
    }, lights: () => [[32, -4, 40, '#ffd040', 0.28, true], [32, -40, 30, '#e0f0ff', 0.14]] },
    holo: { w: 2, h: 2, up: 30, draw(P) {
      P.shadow(16, 28, 12, 3);
      P.oval(16, 26, 10, 3, C.steelDk); P(10, 18, 12, 8, C.white); P(10, 18, 12, 1, '#ffffff'); P(10, 24, 12, 1, C.gold);
      P.ring(16, -6, 14, 14, '#ffd060'); P.ring(16, -6, 13, 13, 'rgba(255,208,96,0.5)'); P.ring(16, -6, 16, 5, '#ffe8a0');
      for (let i = 0; i < 40; i++) { const a = hash(i, 1, 66) * 6.28, r = hash(i, 2, 66) * 11; P.dot(Math.round(16 + Math.cos(a) * r), Math.round(-6 + Math.sin(a) * r), i % 3 ? '#ffe090' : '#80e0ff'); }
      P.line(16, 10, 16, 17, 'rgba(255,220,140,0.7)');
    }, lights: () => [[16, -6, 36, '#ffd060', 0.3, true]] },
    lamp: { w: 1, h: 1, up: 30, draw(P) {
      P.shadow(8, 14, 4, 2);
      P(7, -24, 2, 37, C.steel); P(7, -24, 1, 37, C.steelHi); P(5, 12, 6, 2, C.steelDk);
      P(3, -28, 10, 4, C.white); P(3, -24, 10, 2, C.cyan); P(4, -23, 8, 1, '#ffffff');
    }, lights: () => [[8, -22, 26, '#80dcff', 0.3]] },
    screen: { w: 2, h: 1, up: 30, draw(P, v) {
      P.shadow(16, 14, 10, 2);
      P(14, 2, 4, 11, C.steelDk); P(9, 12, 14, 2, C.steelDk);
      P(0, -28, 32, 30, C.navy); P(0, -28, 32, 1, C.steelHi); P.screen(2, -26, 28, 26, v === 'map' ? '#0a2a4a' : '#103a6a', 21);
      if (v === 'map') { P.ring(16, -13, 9, 9, '#56d4ff'); P.ring(16, -13, 4, 4, '#ffd060'); P.line(16, -24, 16, -2, 'rgba(86,212,255,0.6)'); }
    }, lights: () => [[16, -13, 30, '#4ab0ff', 0.22, true]] },
    scanner: { w: 2, h: 1, up: 30, draw(P) {
      P.shadow(16, 14, 15, 2);
      P(0, -28, 5, 42, C.white); P(27, -28, 5, 42, C.white); P(0, -28, 32, 5, C.white); P(0, -28, 32, 1, '#ffffff');
      P(4, -23, 1, 37, C.whiteDk); P(27, -23, 1, 37, C.whiteDk);
      P(5, -23, 22, 1, C.cyan); P(2, -20, 1, 30, C.cyan); P(29, -20, 1, 30, C.cyan); P(12, -27, 8, 3, '#103a6a'); P(13, -26, 6, 1, '#40ff80');
    }, lights: () => [[16, -10, 26, '#56d4ff', 0.2, true]] },
    desk: { w: 3, h: 1, up: 12, draw(P) {
      P.shadow(24, 14, 22, 2);
      P(0, 0, 48, 6, C.white); P(0, 0, 48, 1, '#ffffff'); P(0, 6, 48, 8, C.whiteDk); P(0, 9, 48, 1, C.gold); P(0, 13, 48, 1, C.out);
      P(6, -9, 10, 9, C.navy); P.screen(7, -8, 8, 7, '#103a6a', 31); P(32, -9, 10, 9, C.navy); P.screen(33, -8, 8, 7, '#103a6a', 33);
      P(20, -2, 8, 2, '#c8a050');
    } },
    express: { w: 14, h: 3, up: 12, draw(P) {
      const W = 224;
      P(0, 30, W, 6, 'rgba(0,0,0,0.5)');
      P(0, -8, W, 40, '#14203a'); P(0, -8, W, 3, '#2a3c66'); P(0, 28, W, 4, '#0a1020');
      P(0, -10, W, 3, '#0a0e18'); P(0, 12, W, 2, C.gold); P(0, 22, W, 1, C.goldDk);
      for (let x = 6; x < W - 10; x += 22) { P(x, -2, 14, 10, '#0a0e18'); P(x + 1, -1, 12, 8, '#ffd890'); P(x + 1, -1, 12, 2, '#fff4d0'); P(x + 6, -1, 1, 8, '#c8a050'); }
      for (let x = 30; x < W; x += 72) { P(x, -6, 10, 34, '#0e1830'); P(x, -6, 10, 1, C.gold); P(x + 2, 14, 6, 1, C.gold); }
      P(W - 20, -6, 20, 34, '#1a2a4a'); P(W - 18, -2, 14, 10, '#c8e0ff'); P(W - 6, 10, 6, 8, C.gold);
      for (let x = 10; x < W; x += 36) { P.oval(x + 8, 32, 7, 3, '#0a0a10'); P.oval(x + 8, 31, 5, 2, '#4a4a58'); }
      P(0, -8, 3, 36, '#0a0e18');
    }, lights: () => [[60, 2, 50, '#ffd890', 0.2], [150, 2, 50, '#ffd890', 0.2]] },
    vat: { w: 1, h: 1, up: 24, draw(P, v) {
      P.shadow(8, 14, 6, 2);
      P(3, 8, 10, 6, C.steelDk); P(3, 8, 10, 1, C.steel); P(3, -22, 10, 2, C.steel);
      P(3, -20, 10, 28, v === 'p' ? 'rgba(200,120,255,0.35)' : 'rgba(80,220,160,0.32)');
      P(3, -20, 1, 28, 'rgba(255,255,255,0.5)'); P(12, -20, 1, 28, 'rgba(120,200,180,0.4)');
      if (v === 'p') { P.oval(8, -4, 3, 4, '#c080ff'); P.dot(7, -5, '#ffffff'); } else { P.line(8, 6, 8, -12, C.leafDk, 2); P.oval(6, -10, 3, 2, C.leaf); P.oval(10, -6, 3, 2, C.leafHi); P.oval(7, -16, 2, 2, C.leafHi); }
      for (let i = 0; i < 4; i++) P.dot(5 + i * 2, -16 + i * 6, 'rgba(255,255,255,0.6)');
    }, lights: v => [[8, -6, 14, v === 'p' ? '#c080ff' : '#60e0a0', 0.22, true]] },
    cryo: { w: 1, h: 1, up: 24, draw(P) {
      P.shadow(8, 14, 6, 2);
      P.oval(8, 12, 6, 2, C.steelDk); P(2, -22, 12, 34, C.white); P(2, -22, 2, 34, '#ffffff'); P(12, -22, 2, 34, C.whiteDk);
      P(4, -18, 8, 24, '#7ac8e8'); P(5, -17, 6, 22, '#c8f0ff'); P(4, -18, 8, 1, '#ffffff'); P(5, 8, 6, 2, C.cyan);
    }, lights: () => [[8, -6, 14, '#a8e8ff', 0.18]] },
    nursery: { w: 2, h: 1, up: 14, draw(P) {
      P.shadow(16, 14, 15, 2);
      P(1, 2, 30, 4, '#3a2a1a'); P(1, 6, 30, 7, C.steel); P(1, 6, 30, 1, C.steelHi); P(1, 12, 30, 1, C.gold);
      for (let x = 2; x < 30; x += 3) { const h = 4 + Math.floor(hash(x, 2, 7) * 8); P(x, 2 - h, 2, h, x % 2 ? C.leaf : C.leafHi); P.dot(x, 1 - h, C.leafHi); }
      P(0, -14, 32, 1, 'rgba(160,220,255,0.5)'); P(0, -14, 1, 16, 'rgba(160,220,255,0.5)'); P(31, -14, 1, 16, 'rgba(160,220,255,0.5)');
    }, lights: () => [[16, -6, 20, '#b0ff90', 0.15]] },
    shuttle: { w: 2, h: 1, up: 26, draw(P) {
      P.shadow(16, 14, 12, 2);
      P(13, 0, 6, 13, C.steelDk); P(0, -24, 32, 24, C.navy); P(0, -24, 32, 1, C.steelHi);
      P(2, -22, 28, 20, '#0a1a3a'); P.line(4, -6, 12, -16, '#ffd060'); P.line(12, -16, 22, -10, '#ffd060'); P.line(22, -10, 28, -20, '#ffd060');
      for (const [x, y] of [[4, -6], [12, -16], [22, -10], [28, -20]]) { P(x - 1, y - 1, 3, 3, '#ffffff'); }
    }, lights: () => [[16, -12, 22, '#ffd060', 0.18, true]] },
    spire: { w: 3, h: 2, up: 76, draw(P) {
      P.tri([24, -76, 36, -40, 12, -40], '#c8d0dc'); P.tri([24, -76, 30, -40, 24, -40], '#ffffff');
      P.tri([12, -40, 36, -40, 24, 0], '#98a2b4'); P.tri([24, -40, 36, -40, 24, 0], '#c8d0dc');
      P.line(24, -76, 24, 0, C.gold); P.tri([8, -46, 24, -54, 18, -30], '#e8a848'); P.tri([40, -46, 24, -54, 30, -30], '#e8a848');
      P.oval(24, -40, 5, 5, '#ff80ff'); P.oval(24, -40, 3, 3, '#ffffff');
      P.line(24, 0, 24, 30, 'rgba(255,128,255,0.35)', 2);
    }, lights: () => [[24, -40, 50, '#d080ff', 0.4, true]] },
    bin: { w: 1, h: 1, up: 8, draw(P) {
      P.shadow(8, 14, 6, 2);
      P(2, 2, 5, 11, C.steel); P(9, 2, 5, 11, '#4a8a5a'); P(2, 2, 5, 1, C.steelHi); P(9, 2, 5, 1, '#7ac08a');
      P(2, -1, 5, 3, C.steelDk); P(9, -1, 5, 3, '#2e5a3a'); P(3, 6, 3, 1, C.white); P(10, 6, 3, 1, C.white); P(2, 12, 12, 1, C.out);
    } },
    robot: { w: 1, h: 1, up: 10, draw(P) {
      P.shadow(8, 14, 5, 2);
      P.oval(8, 8, 5, 5, C.white); P.oval(8, 7, 4, 4, '#ffffff'); P(5, 5, 6, 3, C.navy); P(6, 6, 1, 1, C.cyan); P(9, 6, 1, 1, C.cyan);
      P(7, -2, 2, 4, C.steel); P.dot(8, -3, C.orange);
    } },
    adbot: { w: 1, h: 1, up: 22, draw(P) {
      P.shadow(8, 14, 5, 2);
      P(6, 4, 4, 10, C.steelDk); P(5, 12, 6, 2, C.steelDk);
      P(1, -20, 14, 24, C.white); P(1, -20, 14, 1, '#ffffff'); P.screen(2, -18, 12, 14, '#5a2a6a', 41); P(3, -2, 10, 3, C.orange);
    }, lights: () => [[8, -10, 14, '#ff80c0', 0.2, true]] },
    shelf: { w: 2, h: 1, up: 24, draw(P) {
      P.shadow(16, 14, 15, 2);
      P(1, -22, 30, 36, '#3a2a1a'); P(2, -21, 28, 34, '#5a3e22');
      const books = ['#8a3040', '#3a5a8a', '#c8a050', '#4a7a4a', '#6a4a8a', '#d8d0c0'];
      for (const sy of [-20, -10, 0]) {
        let x = 3;
        while (x < 29) { const w = 1 + Math.floor(hash(x, sy, 21) * 2), h = 5 + Math.floor(hash(x * 5, sy, 22) * 3); P(x, sy + 8 - h, Math.min(w, 29 - x), h, books[Math.floor(hash(x * 3, sy, 23) * books.length)]); x += w + 1; }
        P(2, sy + 8, 28, 1, '#8a6a42');
      }
    } },
    arches: { w: 12, h: 1, up: 58, draw(P) {
      const cx = 96, by = 14;
      for (const [r, col, w] of [[92, '#1a3a7a', 3], [80, '#4ab0ff', 2], [70, '#b8e8ff', 1], [58, '#2a6ad0', 2], [46, '#4ab0ff', 1]]) {
        for (let i = 0; i <= 120; i++) {
          const a = Math.PI + Math.PI * i / 120, x = Math.round(cx + Math.cos(a) * r), y = Math.round(by + Math.sin(a) * r * 0.66);
          if (x >= 0 && x < 192) P(x, y, w, w, col);
        }
      }
      P(cx - 1, by - 54, 2, 54, 'rgba(120,200,255,0.25)');
      P.tri([cx, by - 46, cx + 22, by - 6, cx - 22, by - 6], '#e8eef8'); P.tri([cx, by - 38, cx + 15, by - 10, cx - 15, by - 10], '#1a3a7a');
      P.ring(cx, by - 20, 9, 9, '#6ad0ff'); P.tri([cx, by - 27, cx + 6, by - 16, cx - 6, by - 16], '#b8e8ff'); P.dot(cx, by - 20, '#ffffff');
    }, lights: () => [[96, -20, 70, '#4ab0ff', 0.32, true], [96, -40, 40, '#b8e8ff', 0.18]] },
    curio: { w: 1, h: 1, up: 34, draw(P, v) {
      P.shadow(8, 14, 7, 2);
      P(1, 4, 14, 10, C.white); P(1, 4, 14, 1, '#ffffff'); P(14, 4, 1, 10, C.whiteDk); P(1, 2, 14, 3, '#2a3040'); P(1, 13, 14, 1, C.out);
      P(5, 8, 6, 3, C.gold); P(6, 9, 4, 1, C.goldDk);
      if (v !== 'shard') {
        P(1, -32, 14, 34, 'rgba(120,210,255,0.16)'); P(4, -32, 8, 34, 'rgba(150,230,255,0.16)');
        P(1, -32, 1, 34, 'rgba(220,245,255,0.55)'); P(14, -32, 1, 34, 'rgba(120,180,220,0.45)'); P(1, -33, 14, 1, 'rgba(220,245,255,0.7)');
        P(2, -34, 12, 2, C.white);
      }
      const A = CURIO_ART[v];
      if (A) A(P);
    }, lights: v => v === 'empty' ? [] : [[8, -14, 16, v === 'shard' ? '#ffe090' : '#7ad8ff', 0.26, true]] },
    vault: { w: 3, h: 2, up: 46, draw(P) {
      P.shadow(24, 30, 22, 3);
      for (let i = 0; i < 3; i++) { P(4 + i * 4, 18 + i * 4, 40 - i * 8, 4, i % 2 ? C.whiteDk : C.white); P(4 + i * 4, 18 + i * 4, 40 - i * 8, 1, '#ffffff'); }
      P(18, 18, 12, 2, C.gold);
      P(6, -46, 36, 22, C.steelDk); P(8, -44, 32, 18, C.steel); P(8, -44, 32, 2, C.steelHi); P(6, -24, 36, 3, C.out);
      P(22, -54, 4, 8, C.steelDk); for (let x = 10; x < 38; x += 6) P(x, -36, 3, 3, C.orange);
      P.oval(24, 4, 7, 7, 'rgba(255,220,120,0.5)'); P.oval(24, 4, 4, 4, '#ffe8a0'); P.oval(24, 3, 2, 2, '#ffffff');
      P.line(24, -21, 24, -3, 'rgba(255,230,160,0.5)');
    }, lights: () => [[24, 4, 40, '#ffd890', 0.4, true]] },
    hexdoor: { w: 1, h: 3, up: 24, draw(P) {
      P(0, -24, 16, 6, C.white); P(0, 66, 16, 4, C.white); P(10, -24, 6, 94, C.white); P(0, -24, 3, 94, C.white);
      P(3, -18, 2, 84, '#ffffff'); P(11, -18, 2, 84, C.orange); P(0, -24, 16, 1, C.orange);
    }, lights: () => [[8, 24, 20, '#e8f4ff', 0.2]] },
    labscanner: { w: 4, h: 3, up: 60, draw(P) {
      P.oval(32, 30, 28, 14, 'rgba(60,220,255,0.18)'); P.ring(32, 30, 28, 14, '#56d4ff'); P.ring(32, 30, 20, 10, 'rgba(86,212,255,0.6)');
      P(30, -60, 4, 30, C.steelDk);
      P(8, -34, 48, 22, C.white); P(8, -34, 48, 2, '#ffffff'); P(8, -14, 48, 4, C.whiteDk); P(12, -12, 40, 2, C.cyan);
      P(14, -30, 8, 6, '#2a3040'); P(42, -30, 8, 6, '#2a3040'); P(26, -28, 12, 10, '#103a6a'); P.dot(32, -23, '#80e0ff');
      for (let i = 0; i < 6; i++) P.line(14 + i * 7, -10, 10 + i * 9, 26, 'rgba(120,230,255,0.35)');
    }, lights: () => [[32, 20, 46, '#56d4ff', 0.3, true]] },
    arm: { w: 1, h: 1, up: 26, draw(P) {
      P.shadow(8, 14, 6, 2);
      P(3, 8, 10, 6, C.steelDk); P(5, 6, 6, 3, C.steel);
      P.line(8, 6, 4, -10, C.white, 3); P.line(4, -10, 12, -20, C.white, 3); P(11, -22, 4, 3, C.orange); P(10, -19, 2, 3, C.steelDk); P(14, -19, 2, 3, C.steelDk);
      P.dot(4, -10, C.orange); P.dot(8, 6, C.orange);
    } },
    cabinet: { w: 1, h: 1, up: 24, draw(P, v) {
      P.shadow(8, 14, 6, 2);
      P(1, -22, 14, 36, C.white); P(1, -22, 14, 1, '#ffffff'); P(14, -22, 1, 36, C.whiteDk);
      P(3, -19, 10, 26, 'rgba(120,200,255,0.25)'); P(3, -19, 1, 26, 'rgba(230,250,255,0.6)'); P(3, -6, 10, 1, C.steel);
      if (v === 'cone') { P.tri([8, -16, 12, -9, 4, -9], '#ffe090'); P.dot(8, -13, '#ffffff'); }
      P(3, 9, 10, 2, C.gold);
    } },
    memorial: { w: 1, h: 1, up: 22, draw(P) {
      P.shadow(8, 14, 7, 2);
      P(2, 6, 12, 8, C.steelDk); P(2, 6, 12, 1, C.steel);
      P(3, -20, 10, 26, '#3a4658'); P(4, -19, 8, 24, '#4e5c72'); P(3, -20, 10, 1, C.steelHi);
      for (let y = -15; y < 2; y += 3) P(5, y, 6, 1, '#a8b8d0');
      P(6, -4, 1, 3, 'rgba(140,220,255,0.7)'); P(9, -9, 1, 4, 'rgba(140,220,255,0.6)');
    } },
    cubes: { w: 1, h: 1, up: 6, draw(P) {
      P.shadow(8, 14, 7, 2);
      for (const [x, y, c] of [[2, 6, '#5a6a7a'], [8, 7, '#6a7a8a'], [4, 1, '#7a8a9a'], [10, 2, '#4a5a6a']]) { P(x, y, 5, 5, c); P(x, y, 5, 1, '#c8d8e8'); P(x + 4, y, 1, 5, '#2a3440'); }
    } },
    tanks: { w: 2, h: 1, up: 20, draw(P) {
      P.shadow(16, 14, 15, 2);
      for (const [x, h] of [[1, 30], [11, 34], [21, 28]]) {
        P(x, 14 - h, 10, h, C.steel); P(x, 14 - h, 3, h, C.steelHi); P(x + 8, 14 - h, 2, h, C.steelDk);
        P.oval(x + 5, 14 - h, 5, 2, C.steelHi); P(x, 6 - h / 3, 10, 1, C.yellow); P(x + 3, 10 - h / 2, 4, 2, '#2a3040');
      }
    } },
    hourglass: { w: 4, h: 5, up: 30, draw(P) {
      P.shadow(32, 76, 28, 4);
      P(8, 66, 48, 10, C.steelDk); P(8, 66, 48, 2, C.steel);
      P.tri([12, -26, 52, -26, 32, 22], C.whiteDk); P.tri([16, -22, 48, -22, 32, 18], C.white);
      P.tri([12, 66, 52, 66, 32, 22], C.whiteDk); P.tri([16, 62, 48, 62, 32, 26], C.white);
      P(28, 14, 8, 16, '#2a6aa8'); P(30, 16, 4, 12, C.cyan); P.oval(32, 22, 5, 5, 'rgba(120,220,255,0.6)');
      P(10, -30, 44, 4, C.gold); P(10, 64, 44, 3, C.gold);
      for (const y of [-14, 0, 40, 54]) { P(22, y, 20, 2, C.orange); }
    }, lights: () => [[32, 22, 40, '#56d4ff', 0.3, true]] },
    board: { w: 1, h: 1, up: 40, draw(P) {
      P.shadow(8, 14, 4, 2);
      P(7, -24, 2, 37, C.steel); P(5, 12, 6, 2, C.steelDk);
      P(-2, -40, 20, 14, C.out); P(-1, -39, 18, 12, '#0a1424');
      P(1, -37, 3, 8, '#ffb040'); P(5, -37, 3, 8, '#ffb040'); P(2, -36, 1, 6, '#0a1424'); P(5, -36, 2, 3, '#0a1424'); P(5, -32, 2, 2, '#0a1424');
      P(10, -37, 6, 2, '#56d4ff'); P(10, -33, 5, 1, '#56d4ff'); P(10, -30, 6, 1, '#56d4ff');
    }, lights: () => [[8, -33, 14, '#ffb040', 0.2]] },
    toilet: { w: 1, h: 1, up: 12, draw(P) {
      P.shadow(8, 14, 6, 2);
      P(4, -10, 8, 8, '#f4f6fa'); P(4, -10, 8, 1, '#ffffff'); P(5, -4, 6, 1, C.whiteDk);
      P.oval(8, 4, 6, 4, '#e8ecf2'); P.oval(8, 3, 5, 3, '#ffffff'); P.oval(8, 3, 3, 2, '#9ad8ff');
      P(6, 7, 4, 6, '#d8dee8'); P.dot(11, -7, C.gold); P(2, -2, 3, 3, '#ffe890');
    }, lights: () => [[8, 3, 10, '#9ad8ff', 0.18, true]] },
    emblemholo: { w: 2, h: 1, up: 28, draw(P) {
      P.shadow(16, 13, 11, 2);
      P.oval(16, 11, 10, 3, C.steelDk); P(9, 6, 14, 5, C.white); P(9, 6, 14, 1, '#ffffff'); P(9, 10, 14, 1, C.gold); P(12, 5, 8, 1, C.cyan);
      for (const [x, y] of [[6, -24], [25, -24], [2, -12], [29, -12], [6, 0], [25, 0]]) P(x, y, 2, 2, C.gold);
      P.line(7, -24, 25, -24, 'rgba(255,208,96,0.55)'); P.line(26, -24, 30, -12, 'rgba(255,208,96,0.55)'); P.line(30, -12, 26, 0, 'rgba(255,208,96,0.55)');
      P.line(25, 0, 7, 0, 'rgba(255,208,96,0.55)'); P.line(6, 0, 2, -12, 'rgba(255,208,96,0.55)'); P.line(2, -12, 6, -24, 'rgba(255,208,96,0.55)');
      P.ring(16, -12, 7, 7, '#ffd060'); P.arc(15, -12, 5, 5, 0.9, 5.4, '#ffe8a0'); P.line(8, -4, 24, -20, '#ffd060', 2); P.tri([24, -20, 20, -19, 23, -16], '#ffffff');
      P.line(16, 1, 16, 5, 'rgba(255,220,140,0.6)');
    }, lights: () => [[16, -12, 30, '#ffd060', 0.3, true]] },
    frontdesk: { w: 6, h: 1, up: 10, draw(P) {
      P.shadow(48, 14, 45, 2);
      P(2, 0, 92, 6, C.white); P(2, 0, 92, 1, '#ffffff'); P(2, 6, 92, 7, C.whiteDk); P(2, 9, 92, 1, C.gold); P(2, 12, 92, 1, C.out);
      P(0, 2, 2, 10, C.white); P(94, 2, 2, 10, C.white);
      for (const x of [6, 43, 80]) { P(x, -8, 10, 8, C.navy); P.screen(x + 1, -7, 8, 6, '#103a6a', x); }
      P(21, 1, 6, 3, '#f4ecd8'); P(69, 1, 5, 3, '#f4ecd8'); P(44, 7, 8, 2, C.cyan);
    } },
    glassbench: { w: 1, h: 4, up: 8, draw(P) {
      P.shadow(8, 62, 7, 2);
      P(1, 0, 14, 62, '#2a6a8a'); P(2, 1, 12, 60, 'rgba(120,220,255,0.55)'); P(2, 1, 2, 60, 'rgba(230,250,255,0.8)');
      P(1, -6, 14, 6, C.white); P(1, -6, 14, 1, '#ffffff'); P(1, 60, 14, 3, C.whiteDk);
      for (let y = 8; y < 56; y += 14) { P(4, y, 8, 4, C.leaf); P.dot(6, y - 1, C.leafHi); P.dot(10, y + 1, C.pink); }
      P(0, 0, 1, 62, C.gold); P(15, 0, 1, 62, C.gold);
    }, lights: () => [[8, 16, 14, '#56d4ff', 0.18], [8, 46, 14, '#56d4ff', 0.18]] },
    nurse: { w: 3, h: 3, up: 12, draw(P) {
      P.shadow(24, 44, 22, 3);
      const hx = [[12, 4], [36, 4], [46, 24], [36, 44], [12, 44], [2, 24]];
      P.tri([hx[0][0], hx[0][1], hx[1][0], hx[1][1], hx[3][0], hx[3][1]], C.whiteDk); P.tri([hx[0][0], hx[0][1], hx[3][0], hx[3][1], hx[4][0], hx[4][1]], C.whiteDk);
      P.tri([hx[1][0], hx[1][1], hx[2][0], hx[2][1], hx[3][0], hx[3][1]], C.white); P.tri([hx[0][0], hx[0][1], hx[4][0], hx[4][1], hx[5][0], hx[5][1]], C.white);
      P(14, 12, 20, 24, '#2a6a7a'); P(16, 14, 16, 20, '#3a9aaa');
      P(22, 16, 4, 16, '#40e080'); P(16, 22, 16, 4, '#40e080'); P(23, 17, 2, 14, '#c8ffd8');
      P(8, -8, 8, 8, C.navy); P.screen(9, -7, 6, 6, '#103a6a', 5); P(32, -8, 8, 8, C.navy); P.screen(33, -7, 6, 6, '#103a6a', 9);
      P.oval(24, -4, 5, 4, '#c060ff'); P(23, -1, 2, 5, C.leafDk);
    }, lights: () => [[24, 24, 26, '#40e080', 0.18, true]] },
    hscreen: { w: 2, h: 1, up: 70, draw(P) {
      P(15, -70, 2, 40, C.steelDk);
      P(0, -48, 32, 22, C.out); P(1, -47, 30, 20, '#ff9a30'); P(1, -47, 30, 4, '#ffd090');
      P.arc(8, -32, 10, 10, 4.2, 6.0, '#ffffff'); P.arc(8, -32, 7, 7, 4.2, 6.0, '#ffc070');
      P(14, -38, 14, 2, '#1a1a40'); P(14, -34, 10, 2, '#1a1a40'); P(14, -30, 12, 1, '#1a1a40');
    }, lights: () => [[16, -36, 22, '#ff9a40', 0.2]] },
    hatch: { w: 2, h: 1, up: 20, draw(P) {
      P(0, -20, 32, 34, C.steelDk); P(2, -18, 28, 30, C.steel); P(2, -18, 28, 2, C.steelHi);
      P(15, -18, 2, 30, '#2a3040'); P(4, -6, 10, 2, C.yellow); P(18, -6, 10, 2, C.yellow);
      P(12, -14, 8, 6, '#1a1a24'); P.dot(14, -12, '#ff4040'); P.dot(17, -12, '#ff4040'); P.dot(14, -10, '#ff4040');
      for (let x = 2; x < 30; x += 4) P(x, 10, 2, 2, C.yellow);
    }, lights: () => [[16, -11, 12, '#ff4040', 0.2, true]] },
    memo: { w: 1, h: 1, up: 6, draw(P) {
      P.shadow(8, 14, 6, 2);
      P(2, 3, 12, 4, C.white); P(2, 3, 12, 1, '#ffffff'); P(2, 7, 12, 2, C.whiteDk); P(2, 8, 12, 1, C.gold);
      P(4, 9, 2, 5, C.steelDk); P(10, 9, 2, 5, C.steelDk);
      P(4, 1, 6, 4, '#f4ecd8'); P(5, 2, 4, 1, '#8a7a5a'); P(5, 3, 3, 1, '#8a7a5a'); P(8, 0, 4, 4, '#ffe890'); P(9, 1, 2, 1, '#c8a050');
    } },
    trolley: { w: 1, h: 1, up: 12, draw(P) {
      P.shadow(8, 14, 7, 2);
      P(2, -8, 1, 20, C.steel); P(13, -8, 1, 20, C.steel);
      for (const y of [-6, 2, 9]) { P(2, y, 12, 2, C.white); P(2, y, 12, 1, '#ffffff'); }
      P(4, -9, 4, 3, '#3a5a8a'); P(9, -8, 3, 2, '#c8a050'); P(4, 0, 3, 2, '#f4ecd8'); P(8, -1, 4, 3, '#8a3040'); P(5, 7, 6, 2, '#4a7a4a');
      P.dot(3, 13, '#1a1a20'); P.dot(12, 13, '#1a1a20');
    } },
    puppetcase: { w: 1, h: 1, up: 24, draw(P) {
      P.shadow(8, 14, 6, 2);
      P(2, 6, 12, 8, '#3a2a50'); P(2, 6, 12, 1, C.gold);
      P(2, -22, 12, 28, 'rgba(200,180,255,0.2)'); P(2, -22, 1, 28, 'rgba(240,230,255,0.6)'); P(2, -22, 12, 1, C.gold);
      P(6, -12, 4, 10, '#5a3a8a'); P.oval(8, -15, 3, 3, '#f8e0d8'); P(5, -19, 6, 3, '#e8e0f0'); P(5, -16, 1, 4, '#e8e0f0'); P(10, -16, 1, 4, '#e8e0f0');
      P(4, -21, 8, 2, '#3a2a50');
    } }
  };

  const LAYER = {
    emblem(P, v, Z) {
      const g1 = Z.trim, g0 = Z.trimDk, d = '#1a1208';
      P.oval(32, 24, 26, 18, d); P.oval(32, 24, 24, 16, Z.floor[2]); P.ring(32, 24, 22, 15, g0); P.ring(32, 24, 24, 16, g1);
      P.arc(30, 24, 12, 10, 0.9, 5.4, g1); P.arc(31, 24, 11, 9, 0.9, 5.4, g1); P.arc(34, 22, 8, 7, 0.9, 5.4, Z.floor[2]);
      P.line(14, 38, 50, 10, g1, 2); P.tri([50, 10, 44, 11, 49, 16], '#ffffff');
      P.dot(32, 24, '#ffffff');
    },
    hex(P, v, Z) {
      const c0 = Z.trim, c1 = Z.trimDk;
      P(4, 4, 56, 1, c1); P(4, 59, 56, 1, c1); P(4, 4, 1, 56, c1); P(59, 4, 1, 56, c1);
      for (const [x, y] of [[4, 4], [57, 4], [4, 57], [57, 57]]) P(x, y, 3, 3, c0);
      P.ring(32, 32, 16, 16, c1); P.ring(32, 32, 12, 12, c0);
      P.line(16, 32, 48, 32, c1); P.line(32, 16, 32, 48, c1);
      P.oval(32, 32, 3, 3, Z.floor[2]); P.ring(32, 32, 4, 4, c0);
    },
    screens(P, v, Z) {
      const w = (v | 0) || 4;
      P(0, 0, w * 16, 32, '#05080e');
      for (let i = 0; i < w * 2; i++) for (let j = 0; j < 2; j++) {
        const x = 1 + i * 8, y = 2 + j * 14;
        P.screen(x, y, 7, 12, hash(i, j, 81) > 0.8 ? '#5a1a2a' : hash(i, j, 82) > 0.5 ? '#0a3050' : '#103a6a', i * 7 + j);
      }
      P(0, 0, w * 16, 1, Z.trim); P(0, 31, w * 16, 1, Z.trimDk);
    },
    sign(P, v, Z) {
      P(0, 6, 48, 14, Z.trimDk); P(1, 7, 46, 12, Z.trim); P(2, 8, 44, 10, '#1a1208');
      for (let x = 6; x < 42; x += 4) { const h = 2 + Math.floor(hash(x, 1, 8) * 5); P(x, 10 + (6 - h), 2, h, Z.trim); P(x, 15, 3, 1, Z.trim); }
      P(2, 8, 3, 10, Z.trim);
    },
    liftpad(P, v, Z) {
      P.oval(16, 16, 15, 11, Z.metal[2]); P.oval(16, 16, 13, 9, Z.metal[0]); P.ring(16, 16, 14, 10, Z.trim); P.ring(16, 16, 10, 7, Z.strip);
      P.oval(16, 16, 7, 5, Z.floor[2]);
      for (const [x, y] of [[16, 7], [16, 25], [4, 16], [28, 16]]) P(x - 1, y - 1, 3, 3, Z.strip);
      P.tri([12, 18, 16, 13, 20, 18], Z.trim);
    },
    hazard(P, v) {
      const w = ((v | 0) || 2) * 16;
      for (let x = 0; x < w; x += 6) P.tri([x, 14, x + 3, 10, x + 6, 10, x + 3, 14], C.yellow);
      P(0, 9, w, 1, '#2a2a30'); P(0, 14, w, 1, '#2a2a30');
    },
    vent(P, v, Z) {
      P(1, 3, 14, 10, Z.metal[2]); for (let y = 4; y < 12; y += 2) P(2, y, 12, 1, Z.metal[1]);
    },
    strip(P, v, Z) {
      const w = ((v | 0) || 2) * 16;
      P(0, 7, w, 2, Z.strip); P(0, 7, w, 1, '#ffffff');
    },
    arrow(P, v, Z) {
      const flip = v === 'd';
      for (let i = 0; i < 3; i++) { const y = flip ? 2 + i * 4 : 12 - i * 4; P.tri(flip ? [3, y, 8, y + 4, 13, y, 13, y + 2, 8, y + 6, 3, y + 2] : [3, y, 8, y - 4, 13, y, 13, y - 2, 8, y - 6, 3, y - 2], i ? Z.trimDk : Z.trim); }
    },
    fragment(P, v) {
      const sd = (v | 0) + 3;
      for (let i = 0; i < 9; i++) {
        const x = 4 + Math.floor(hash(i, sd, 31) * 22), y = 4 + Math.floor(hash(sd, i, 32) * 22), r = 2 + Math.floor(hash(i, i + sd, 33) * 4);
        P.oval(x, y, r + 1, r, '#120c14'); P.oval(x, y - 1, r, r - 1, '#2a1a24');
        P.line(x - r, y, x + r, y - 1, '#c89a3a'); P.dot(x, y - r + 1, '#ffd060');
      }
    },
    rug(P, v, Z) {
      const [w, h] = (v || '4x2').split('x').map(Number);
      P(0, 0, w * 16, h * 16, Z.accent[2]); P(1, 1, w * 16 - 2, h * 16 - 2, Z.accent[0]);
      P(3, 3, w * 16 - 6, 1, Z.trim); P(3, h * 16 - 4, w * 16 - 6, 1, Z.trim); P(3, 3, 1, h * 16 - 6, Z.trim); P(w * 16 - 4, 3, 1, h * 16 - 6, Z.trim);
      for (let x = 8; x < w * 16 - 6; x += 8) P.dot(x, h * 8, Z.accent[1]);
    }
  };
  const LAYER_SIZE = { fragment: [2, 2], emblem: [4, 3], hex: [4, 4], screens: [4, 2], sign: [3, 2], liftpad: [2, 2], hazard: [2, 1], vent: [1, 1], strip: [2, 1], arrow: [1, 1], rug: [4, 2] };
  const LAYER_LIGHT = {
    emblem: () => [[32, 24, 40, '#ffd060', 0.12]],
    screens: v => [[((v | 0) || 4) * 8, 16, ((v | 0) || 4) * 10, '#4ab0ff', 0.2, true]],
    liftpad: () => [[16, 16, 24, '#56d4ff', 0.22, true]],
    strip: v => [[((v | 0) || 2) * 8, 8, ((v | 0) || 2) * 10, '#56d4ff', 0.12]]
  };

  function floorPaint(P, kind, Z, e) {
    const r = i => hash(e.x * 13 + i, e.y * 7 + i * 3, 57);
    const [b, hi, dk] = Z.floor;
    switch (kind) {
      case 'floor2': {
        const [gb, ghi, gdk] = Z.glass;
        P(0, 0, U, U, gdk); P(1, 1, U - 2, U - 2, gb);
        P.dither(1, 1, U - 2, U - 2, gdk, (e.x + e.y) & 1);
        P(1, 7, U - 2, 1, ghi); P(7, 1, 1, U - 2, ghi);
        if (r(1) > 0.6) P.dot(3 + Math.floor(r(2) * 10), 3 + Math.floor(r(3) * 10), '#ffffff');
        if (!e.same.u) P(0, 0, U, 1, ghi);
        if (!e.same.d) P(0, U - 1, U, 1, ghi);
        if (!e.same.l) P(0, 0, 1, U, ghi);
        if (!e.same.r) P(U - 1, 0, 1, U, ghi);
        return;
      }
      case 'floor3': {
        const [ab, ahi, adk] = Z.accent;
        P(0, 0, U, U, ab);
        for (let y = 3; y < U; y += 4) P(0, y, U, 1, adk);
        P(0, 0, U, 1, ahi);
        if (!e.same.u) P(0, 0, U, 1, Z.trim);
        if (!e.same.d) P(0, U - 1, U, 1, Z.trimDk);
        if (!e.same.l) P(0, 0, 1, U, Z.trimDk);
        if (!e.same.r) P(U - 1, 0, 1, U, Z.trimDk);
        return;
      }
      case 'floor4': {
        const [mb, mhi, mdk] = Z.metal;
        P(0, 0, U, U, mdk);
        for (let y = 1; y < U; y += 3) for (let x = (y % 2) ? 0 : 1; x < U; x += 3) P(x, y, 2, 2, mb);
        P(0, 0, U, 1, mhi);
        if (!e.same.l) P(0, 0, 1, U, mhi);
        return;
      }
      case 'floor5': {
        const [cb, chi, cdk] = Z.mat;
        P(0, 0, U, U, cb); P.dither(0, 0, U, U, cdk, (e.x + e.y) & 1);
        if (!e.same.u) P(0, 0, U, 1, chi);
        if (!e.same.d) P(0, U - 1, U, 1, cdk);
        return;
      }
      case 'stairs': {
        for (let y = 0; y < U; y += 4) { P(0, y, U, 4, Z.metal[0]); P(0, y, U, 1, Z.metal[1]); P(0, y + 3, U, 1, Z.metal[2]); }
        P(0, 0, 1, U, Z.trim); P(U - 1, 0, 1, U, Z.trim);
        return;
      }
      case 'door': {
        P(0, 0, U, U, dk); P(0, 0, U, U, b); P(2, 0, U - 4, U, hi);
        P(0, 0, 2, U, Z.metal[0]); P(U - 2, 0, 2, U, Z.metal[0]); P(1, 0, 1, U, Z.strip); P(U - 2, 0, 1, U, Z.strip);
        for (let y = 2; y < U; y += 4) P(5, y, 6, 1, Z.seam);
        return;
      }
      default: {
        P(0, 0, U, U, b);
        P(0, 0, U, 1, hi); P(0, 0, 1, U, hi); P(U - 1, 0, 1, U, dk); P(0, U - 1, U, 1, dk);
        P(0, 8, U, 1, Z.seam); P(8, 0, 1, U, Z.seam);
        const k = r(4);
        if (k > 0.86) { P(3, 3, 3, 3, Z.seam); P(4, 4, 1, 1, Z.strip); }
        else if (k > 0.74) P(10, 10, 4, 1, hi);
        if ((e.x + e.y * 3) % 7 === 0) P(9, 9, 6, 6, dk);
      }
    }
  }

  function buildLayer(map) {
    const def = map.def, Z = ZONES[def.zone] || ZONES.control;
    const cv = G.mkCanvas(map.w * U, map.h * U), g = cv.getContext('2d');
    const inside = (x, y) => x >= 0 && y >= 0 && x < map.w && y < map.h;
    const kind = (x, y) => G.tileKindAt(map, x, y);
    const wall = (x, y) => !inside(x, y) || kind(x, y) === 'wall' || kind(x, y) === 'window';
    const voidAt = (x, y) => inside(x, y) && kind(x, y) === 'chasm';
    const role = (x, y) => {
      if (!wall(x, y)) return null;
      if (y + 1 >= map.h) return 'roof';
      if (!wall(x, y + 1)) return 'low';
      if (y + 2 < map.h && !wall(x, y + 2) && ((inside(x - 1, y) && wall(x - 1, y)) || (inside(x + 1, y) && wall(x + 1, y)))) return 'high';
      return 'roof';
    };
    const baseKind = (H.TILES[def.floor] || { kind: 'floor' }).kind;
    const floorKind = (x, y) => {
      const k = kind(x, y);
      if (k !== 'block') return k;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1], [0, -1], [0, 2], [0, -2], [-2, 0], [2, 0]]) {
        const n = inside(x + dx, y + dy) ? kind(x + dx, y + dy) : 'wall';
        if (n !== 'block' && n !== 'wall' && n !== 'window' && n !== 'stairs' && n !== 'door' && n !== 'chasm') return n;
      }
      return baseKind;
    };
    const glass = [], lights = [], sprites = [], overs = [];
    const space = def.void !== 'shaft';
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      const P = pen(g, x * U, y * U), ro = role(x, y);
      if (voidAt(x, y) || kind(x, y) === 'marvel') {
        P(0, 0, U, U, Z.void);
        if (space) glass.push({ x: x * U, y: y * U, w: U, h: U });
        else {
          const d = hash(x, y, 71);
          P.dither(0, 0, U, U, '#0a1424', (x + y) & 1);
          if (d > 0.82) P(2, Math.floor(d * 12), 12, 1, Z.strip);
          if (!voidAt(x, y - 1)) { P(0, 0, U, 4, '#1a2a3a'); P(0, 4, U, 1, Z.glass[0]); P(0, 6, U, 1, 'rgba(255,208,64,0.4)'); }
        }
        continue;
      }
      if (!ro) {
        const fk = floorKind(x, y);
        const sameAt = (dx, dy) => inside(x + dx, y + dy) && !wall(x + dx, y + dy) && floorKind(x + dx, y + dy) === fk;
        floorPaint(P, fk, Z, { x, y, same: { u: sameAt(0, -1), d: sameAt(0, 1), l: sameAt(-1, 0), r: sameAt(1, 0) } });
        if (wall(x, y - 1)) { P(0, 0, U, 3, 'rgba(0,0,0,0.35)'); P(0, 3, U, 2, 'rgba(0,0,0,0.15)'); }
        if (wall(x - 1, y) && role(x - 1, y) === 'roof') P(0, 0, 2, U, 'rgba(0,0,0,0.3)');
        if (wall(x + 1, y) && role(x + 1, y) === 'roof') P(U - 2, 0, 2, U, 'rgba(0,0,0,0.3)');
        const rail = 'rgba(170,225,255,0.55)', post = Z.metal[1];
        if (voidAt(x, y + 1)) { P(0, U - 5, U, 1, rail); P(0, U - 2, U, 2, post); P(0, U - 2, U, 1, Z.strip); if (x % 2 === 0) P(1, U - 7, 2, 5, post); }
        if (voidAt(x, y - 1)) { P(0, 0, U, 2, post); P(0, 2, U, 1, rail); if (x % 2 === 0) P(1, 0, 2, 5, post); }
        if (voidAt(x - 1, y)) { P(0, 0, 2, U, post); P(2, 0, 1, U, rail); }
        if (voidAt(x + 1, y)) { P(U - 2, 0, 2, U, post); P(U - 3, 0, 1, U, rail); }
        continue;
      }
      const win = kind(x, y) === 'window';
      const wl = inside(x - 1, y) && kind(x - 1, y) === 'window', wr = inside(x + 1, y) && kind(x + 1, y) === 'window';
      if (ro === 'roof') {
        P(0, 0, U, U, Z.roof);
        if (hash(x, y, 61) > 0.55) P(2, 2 + Math.floor(hash(x, y, 62) * 10), U - 4, 1, Z.roofHi);
        const open = (dx, dy) => inside(x + dx, y + dy) && !wall(x + dx, y + dy);
        if (open(0, -1)) { P(0, 0, U, 1, Z.trim); P(0, 1, U, 1, Z.trimDk); }
        if (open(-1, 0)) P(0, 0, 1, U, Z.trim);
        if (open(1, 0)) P(U - 1, 0, 1, U, Z.trim);
        if (role(x, y + 1) === 'high') { P(0, U - 3, U, 1, Z.trimDk); P(0, U - 2, U, 1, Z.trim); P(0, U - 1, U, 1, Z.roofHi); }
        continue;
      }
      const [wb, whi, wdk] = ro === 'high' ? Z.high : Z.low;
      P(0, 0, U, U, wb);
      if (ro === 'high') {
        P(0, 0, U, 2, wdk); P(0, 2, U, 1, Z.trim);
        P(1, 5, U - 2, 10, whi); P(2, 6, U - 4, 9, wb);
        P(0, 15, U, 1, wdk);
        if ((x + y) % 3 === 0) { P(6, 8, 4, 4, wdk); P(7, 9, 2, 2, Z.strip); }
      } else {
        P(1, 0, U - 2, 6, whi); P(2, 0, U - 4, 5, wb);
        P(0, 7, U, 2, Z.strip); P(0, 7, U, 1, '#ffffff');
        P(0, 10, U, 3, wdk); P(0, 13, U, 1, Z.trim); P(0, 14, U, 1, Z.trimDk); P(0, 15, U, 1, C.out);
      }
      if (!win) {
        if (!(inside(x - 1, y) && wall(x - 1, y))) P(0, 0, 1, U, Z.trim);
        if (!(inside(x + 1, y) && wall(x + 1, y))) P(U - 1, 0, 1, U, Z.trim);
        continue;
      }
      const gx0 = wl ? 0 : 2, gx1 = wr ? U : U - 2;
      if (ro === 'high') {
        P(0, 0, U, 2, wdk); P(0, 2, U, 1, Z.trim);
        P(gx0, 3, gx1 - gx0, 13, Z.void);
        glass.push({ x: x * U + gx0, y: y * U + 3, w: gx1 - gx0, h: 13 });
        if (!wl) P(0, 3, 2, 13, whi);
        if (!wr) P(U - 2, 3, 2, 13, wdk);
        if (wl && x % 3 === 0) P(0, 3, 1, 13, whi);
      } else {
        P(gx0, 0, gx1 - gx0, 9, Z.void);
        glass.push({ x: x * U + gx0, y: y * U, w: gx1 - gx0, h: 9 });
        if (!wl) P(0, 0, 2, 9, whi);
        if (!wr) P(U - 2, 0, 2, 9, wdk);
        P(0, 9, U, 1, '#ffffff'); P(0, 10, U, 2, Z.strip); P(0, 12, U, 2, wdk); P(0, 14, U, 1, Z.trim); P(0, 15, U, 1, C.out);
      }
    }
    for (const [k, x, y, v, cond] of def.decor || []) {
      if (LAYER[k]) {
        LAYER[k](pen(g, x * U, y * U), v, Z);
        for (const l of (LAYER_LIGHT[k] || (() => []))(v)) lights.push(light(x, y, l));
        continue;
      }
      const d = DECOR[k];
      if (!d) continue;
      const [w, h] = d.size ? d.size(v) : [d.w, d.h];
      const cvs = sprite(w * U, h * U, d.up, P => d.draw(P, v));
      sprites.push({ k, x, y, w, h, up: d.up, cv: cvs, sort: y + h - 1, if: cond });
      for (const l of d.lights ? d.lights(v) : []) lights.push(Object.assign(light(x, y, l), { if: cond }));
    }
    return { cv, anims: [], th: def.theme, deco: true, zone: def.zone, outside: def.outside || 'blue', tint: Z.tint, glass, lights, sprites, overs };
  }

  function light(x, y, [lx, ly, r, col, a, pulse]) { return { x: x * U + lx, y: y * U + ly, r, col, a, pulse: !!pulse, ph: hash(x, y, 71) * 6.28 }; }

  const DOC_LOOK = {
    paper: { bg: '#efe6cf', edge: '#c8b48a', ink: '#2a2018', head: '#6a2a1a', rule: 'rgba(90,70,40,0.18)' },
    book: { bg: '#e8dcc0', edge: '#8a5a3a', ink: '#2a1e14', head: '#5a2a5a', rule: 'rgba(90,60,40,0.12)' },
    screen: { bg: '#081a30', edge: '#2a6aa8', ink: '#a8e0ff', head: '#ffd890', rule: 'rgba(86,212,255,0.08)' }
  };

  function docLines(ui, text, width, size) {
    const out = [];
    for (const para of String(text).split('\n')) {
      if (!para.trim()) { out.push({ t: '' }); continue; }
      const center = para.startsWith('^'), right = para.startsWith('>');
      const body = center || right ? para.slice(1) : para;
      for (const l of ui.wrap(body, width, size)) out.push({ t: l, align: center ? 'center' : right ? 'right' : 'left' });
    }
    return out;
  }

  function openDoc(id, close) {
    const ui = this, { W, HGT } = H.UI_CONST, d = (H.DOCS || {})[id] || { title: '...', text: '' };
    const L = DOC_LOOK[d.kind] || DOC_LOOK.paper, screen = d.kind === 'screen';
    const bw = 470, bh = 380, bx = (W - bw) / 2, by = 40, pad = 26, size = 12, lh = 17;
    const lines = docLines(ui, ui.game && ui.game.fill ? ui.game.fill(d.text) : d.text, bw - pad * 2, size), view = Math.floor((bh - 90) / lh), maxTop = Math.max(0, lines.length - view);
    ui.sfx('select');
    this.push({
      top: 0,
      draw(c) {
        c.fillStyle = 'rgba(2,3,10,0.66)'; c.fillRect(0, 0, W, HGT);
        c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(bx + 6, by + 6, bw, bh);
        c.fillStyle = L.edge; c.fillRect(bx - 3, by - 3, bw + 6, bh + 6);
        c.fillStyle = L.bg; c.fillRect(bx, by, bw, bh);
        if (screen) {
          c.fillStyle = 'rgba(86,212,255,0.05)';
          for (let y = by; y < by + bh; y += 3) c.fillRect(bx, y, bw, 1);
          c.fillStyle = '#2a6aa8'; c.fillRect(bx, by, bw, 18);
          ui.text('ТЕРМИНАЛ КОСМИЧЕСКОЙ СТАНЦИИ «ГЕРТА»', bx + 10, by + 3, { size: 10, bold: true, col: '#e8f6ff', shadow: false });
        } else {
          for (let y = by + 72; y < by + bh - 20; y += lh) { c.fillStyle = L.rule; c.fillRect(bx + pad - 6, y + lh - 3, bw - pad * 2 + 12, 1); }
          if (d.kind === 'book') { c.fillStyle = 'rgba(60,30,20,0.25)'; c.fillRect(bx, by, 10, bh); }
        }
        ui.text(d.title, bx + bw / 2, by + (screen ? 28 : 18), { align: 'center', size: 15, bold: true, serif: !screen, col: L.head, shadow: false });
        if (d.sub) ui.text(d.sub, bx + bw / 2, by + (screen ? 48 : 40), { align: 'center', size: 10, col: screen ? '#6aa8d0' : '#7a6a50', shadow: false });
        c.fillStyle = L.head; c.globalAlpha = 0.5; c.fillRect(bx + pad, by + 60, bw - pad * 2, 1); c.globalAlpha = 1;
        lines.slice(this.top, this.top + view).forEach((l, i) => {
          const x = l.align === 'center' ? bx + bw / 2 : l.align === 'right' ? bx + bw - pad : bx + pad;
          ui.text(l.t, x, by + 70 + i * lh, { align: l.align, size, serif: !screen, col: L.ink, shadow: false });
        });
        if (maxTop) {
          const tx = bx + bw - 10, th = bh - 90, kh = Math.max(16, th * view / lines.length), ky = by + 70 + (th - kh) * this.top / maxTop;
          c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(tx, by + 70, 3, th);
          c.fillStyle = L.head; c.fillRect(tx, ky, 3, kh);
        }
        ui.hints(maxTop ? [['↑↓', 'Листать'], ['Esc', 'Закрыть']] : [['Esc', 'Закрыть']], W / 2, by + bh + 14, { align: 'center' });
        ui.wheelZone(bx, by, bw, bh, s => this.key(s > 0 ? 'down' : 'up'));
        ui.hit(0, 0, W, HGT, () => this.key(this.top < maxTop ? 'down' : 'back'));
      },
      key(k) {
        if (k === 'up' || k === 'left') { this.top = Math.max(0, this.top - (k === 'left' ? view : 3)); return; }
        if (k === 'down' || k === 'right') {
          if (this.top >= maxTop && k === 'down') return;
          this.top = Math.min(maxTop, this.top + (k === 'right' ? view : 3));
          return;
        }
        if (k === 'ok' && this.top < maxTop) { this.top = Math.min(maxTop, this.top + view); return; }
        if (k === 'back' || k === 'ok') { ui.screens.pop(); ui.sfx('cancel'); if (close) close(); }
      }
    });
  }

  if (H.UI) Object.assign(H.UI.prototype, { openDoc });

  H.Station = { buildLayer, DECOR, LAYER, LAYER_SIZE, ZONES, pen, sprite, light };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
