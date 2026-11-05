(function (H) {
  'use strict';
  const G = H.Gfx;
  const U = 16;
  const hash = (x, y, s) => G.hash(x, y, s);

  const C = {
    out: '#0a0810', gold: '#c9a35a', goldHi: '#f0d28a', goldDk: '#7a5a2a',
    navy: '#1c2846', navyHi: '#2c3e68', navyDk: '#111830',
    wood: '#6a4228', woodHi: '#8a5a36', woodDk: '#432614',
    coral: '#c4503e', coralHi: '#e07258', coralDk: '#8a2e26',
    leaf: '#2f8a3e', leafHi: '#5cbc56', leafDk: '#1a5a2a',
    cream: '#efe6d2', creamDk: '#c8bca4', chrome: '#a8b4c4', chromeHi: '#e4ecf4', chromeDk: '#5a6474',
    purple: '#6a5aa8', purpleHi: '#9282cc', purpleDk: '#45397a',
    pink: '#f0a8c8', pinkDk: '#c47898', shade: 'rgba(4,2,12,0.38)'
  };

  const CARS = {
    parlor: {
      roof: '#0b0d18', roofHi: '#171c30', trim: C.gold, trimDk: C.goldDk,
      high: ['#1c2846', '#26355a', '#131b33'], low: ['#18223e', '#22305a', '#0e1428'],
      dark: ['#1b1a24', '#24232f', '#121119'], tint: null
    },
    cabin: {
      roof: '#0d0b10', roofHi: '#1c1820', trim: '#b8925a', trimDk: '#6a4e2a',
      high: ['#8a5a34', '#a8703e', '#6a4226'], low: ['#1c2846', '#26355a', '#121a32'],
      dark: ['#1e1b1f', '#28242a', '#141215'], tint: 'rgba(255,190,120,0.05)'
    },
    party: {
      roof: '#0a0810', roofHi: '#18141f', trim: '#d8a048', trimDk: '#7a5222',
      high: ['#1d1824', '#29222f', '#120e17'], low: ['#1a1520', '#251e2c', '#0f0c14'],
      dark: ['#1d1a22', '#27232d', '#131118'], tint: 'rgba(255,160,70,0.06)'
    },
    lab: {
      roof: '#090c12', roofHi: '#151b26', trim: C.gold, trimDk: C.goldDk,
      high: ['#23303e', '#2e3e50', '#17202b'], low: ['#1e2834', '#293646', '#121921'],
      dark: ['#2a313b', '#3a434f', '#1a1f26'], tint: 'rgba(120,200,255,0.05)', glow: '#5ad8ff'
    },
    room: {
      roof: '#0b0c14', roofHi: '#181a28', trim: '#d2ac64', trimDk: '#7a5828',
      high: ['#d8ceb8', '#ece4d0', '#b4a68e'], low: ['#7a5234', '#966844', '#563820'],
      dark: ['#c69c68', '#d6b07c', '#a87e4e'], tint: 'rgba(255,215,155,0.04)'
    }
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
    return P;
  }

  function sprite(w, h, up, draw) {
    const cv = G.mkCanvas(w, h + up), g = cv.getContext('2d');
    draw(pen(g, 0, up), g);
    return cv;
  }

  const DECOR = {
    palm: { w: 1, h: 1, up: 22, draw(P) {
      P.shadow(8, 14, 6, 2);
      P(4, 6, 8, 8, C.navy); P(4, 6, 2, 8, C.navyHi); P(11, 6, 1, 8, C.navyDk); P(4, 9, 8, 1, C.gold);
      P(3, 4, 10, 2, C.navyHi); P(4, 5, 8, 1, '#2a1a10'); P(4, 13, 8, 1, C.navyDk);
      const fr = [[0, -6], [16, -6], [2, -13], [14, -13], [6, -18], [11, -19], [-1, 0], [16, 1]];
      fr.forEach(([ex, ey], i) => {
        P.line(8, 4, ex, ey, C.leafDk, 2);
        P.line(8, 3, ex, ey - 1, i % 2 ? C.leaf : C.leafHi);
        for (let k = 1; k < 4; k++) { const tx = Math.round(8 + (ex - 8) * k / 4), ty = Math.round(4 + (ey - 4) * k / 4); P.dot(tx + (ex < 8 ? -1 : 1), ty + 1, C.leaf); }
      });
      P(7, 2, 2, 3, C.leafDk);
    } },
    planter: { w: 1, h: 1, up: 10, draw(P) {
      P.shadow(8, 15, 7, 2);
      P.box(2, 7, 12, 2, 6, '#3a2618', C.wood, C.gold);
      P(2, 13, 12, 1, C.goldDk);
      for (let i = 0; i < 9; i++) { const x = 2 + Math.floor(hash(i, 1, 41) * 12), y = -2 + Math.floor(hash(i, 2, 41) * 9); P.oval(x, y, 2, 2, i % 3 ? C.leaf : C.leafDk); P.dot(x - 1, y - 1, C.leafHi); }
    } },
    coffee: { w: 2, h: 1, up: 14, draw(P) {
      P.shadow(16, 15, 15, 2);
      P(0, -1, 32, 5, '#e6dccb'); P(0, -1, 32, 1, '#fff6e6'); P(0, 4, 32, 11, C.wood); P(0, 4, 32, 1, C.gold);
      P(2, 6, 13, 7, C.woodHi); P(17, 6, 13, 7, C.woodHi); P(3, 7, 11, 5, C.wood); P(18, 7, 11, 5, C.wood); P(15, 9, 2, 2, C.gold); P(0, 14, 32, 1, C.out);
      P(3, -12, 11, 12, C.chromeDk); P(3, -12, 11, 2, C.chromeHi); P(4, -10, 9, 8, C.chrome); P(5, -9, 2, 6, C.chromeHi);
      P(7, -3, 3, 2, '#2a2a30'); P(8, -1, 1, 1, '#3a2010'); P(11, -8, 1, 1, '#ff4040'); P(4, -13, 9, 1, C.out);
      for (const x of [18, 23]) { P(x, -3, 4, 3, '#ffffff'); P(x, -3, 4, 1, '#3a2010'); P(x + 4, -2, 1, 1, '#ffffff'); }
      P(27, -7, 3, 7, '#8a5a3a'); P(27, -7, 3, 1, '#c89a6a');
    } },
    chair: { w: 1, h: 1, up: 8, draw(P, v) {
      P.shadow(8, 14, 7, 2);
      if (v === 'u') {
        P(2, -2, 12, 14, C.coralDk); P(2, -2, 12, 2, C.coral); P(1, 2, 3, 10, C.coral); P(12, 2, 3, 10, C.coral); P(1, 2, 3, 1, C.coralHi); P(12, 2, 3, 1, C.coralHi);
        P.dot(6, 3, '#6a1e1a'); P.dot(10, 3, '#6a1e1a'); P.dot(8, 6, '#6a1e1a'); P(3, 12, 2, 2, C.woodDk); P(11, 12, 2, 2, C.woodDk);
      } else if (v === 'd') {
        P(2, -6, 12, 8, C.coralDk); P(2, -6, 12, 2, C.coral); P.dot(5, -3, '#6a1e1a'); P.dot(8, -3, '#6a1e1a'); P.dot(11, -3, '#6a1e1a');
        P(2, 2, 12, 7, C.coral); P(3, 2, 10, 1, C.coralHi); P(1, -1, 3, 11, C.coralHi); P(12, -1, 3, 11, C.coralHi); P(1, 9, 3, 2, C.coralDk); P(12, 9, 3, 2, C.coralDk);
        P(2, 11, 12, 1, C.coralDk); P(3, 12, 2, 2, C.woodDk); P(11, 12, 2, 2, C.woodDk);
      } else {
        const back = v === 'r' ? 1 : 12;
        P(2, 2, 12, 8, C.coral); P(2, 2, 12, 1, C.coralHi); P(back, -6, 3, 15, C.coralDk); P(back, -6, 3, 1, C.coral);
        P(2, 0, 12, 3, C.coralHi); P(2, 10, 12, 2, C.coralDk); P(3, 12, 2, 2, C.woodDk); P(11, 12, 2, 2, C.woodDk);
      }
    } },
    rtable: { w: 1, h: 1, up: 4, draw(P) {
      P.shadow(8, 14, 5, 2); P(7, 6, 2, 8, C.woodDk); P(5, 13, 6, 1, C.woodDk);
      P.oval(8, 3, 7, 3, C.woodDk); P.oval(8, 2, 7, 3, C.wood); P.oval(8, 2, 6, 2, C.woodHi); P(2, 5, 12, 1, C.gold);
      P(5, -1, 3, 3, '#ffffff'); P(5, -1, 3, 1, '#3a2010'); P(10, 0, 2, 2, C.cream);
    } },
    stable: { w: 1, h: 1, up: 6, draw(P) {
      P.shadow(8, 14, 6, 2); P.box(2, 2, 12, 3, 9, C.woodHi, C.wood, C.gold);
      P(4, -3, 7, 2, '#3a5a8a'); P(5, -5, 6, 2, '#8a3040'); P(4, -6, 7, 1, '#c8a050'); P(11, -4, 2, 6, C.chromeDk);
    } },
    ctable: { w: 1, h: 1, up: 3, draw(P) {
      P.shadow(8, 13, 7, 2); P.box(1, 4, 14, 4, 4, '#3a2a20', C.woodDk, C.gold);
      P(3, 2, 3, 3, '#ffffff'); P(3, 2, 3, 1, '#3a2010'); P(9, 4, 4, 2, C.cream); P(9, 4, 4, 1, '#ffffff');
    } },
    sofa: { w: 3, h: 1, up: 8, draw(P, v) {
      P.shadow(24, 14, 23, 2);
      if (v === 'u') {
        P(1, -3, 46, 15, C.coralDk); P(1, -3, 46, 2, C.coral); P(0, 0, 4, 12, C.coral); P(44, 0, 4, 12, C.coral); P(0, 0, 4, 1, C.coralHi); P(44, 0, 4, 1, C.coralHi);
        for (let x = 8; x < 44; x += 8) { P.dot(x, 2, '#6a1e1a'); P.dot(x - 4, 6, '#6a1e1a'); }
        P(4, 11, 40, 1, '#6a1e1a'); P(3, 12, 2, 2, C.woodDk); P(43, 12, 2, 2, C.woodDk);
      } else {
        P(1, -7, 46, 9, C.coralDk); P(1, -7, 46, 2, C.coral); for (let x = 8; x < 44; x += 8) P.dot(x, -3, '#6a1e1a');
        P(2, 2, 44, 8, C.coral); P(3, 2, 42, 1, C.coralHi); P(16, 2, 1, 7, C.coralDk); P(31, 2, 1, 7, C.coralDk);
        P(0, -2, 4, 12, C.coralHi); P(44, -2, 4, 12, C.coralHi); P(2, 10, 44, 2, C.coralDk); P(3, 12, 2, 2, C.woodDk); P(43, 12, 2, 2, C.woodDk);
      }
    } },
    bay: { w: 8, h: 2, up: 6, draw(P, v) {
      const top = v === 't', edge = x => { const k = (x - 63.5) / 64; return Math.round(27 * Math.sqrt(Math.max(0, 1 - k * k))); };
      for (let x = 0; x < 128; x++) {
        const e = Math.max(3, edge(x));
        if (top) {
          P(x, 0, 1, e, (x + Math.floor(hash(x, 1, 7) * 3)) % 4 ? '#1e3a26' : '#24462c');
          P(x, e, 1, 2, '#e6dccb'); P(x, e + 2, 1, 3, C.navy); P(x, e + 2, 1, 1, C.gold); P(x, e + 5, 1, 1, C.out);
        } else {
          const y0 = 32 - e;
          P(x, y0 - 1, 1, 1, C.gold); P(x, y0, 1, 2, '#e6dccb'); P(x, y0 + 2, 1, 30 - y0, (x + Math.floor(hash(x, 2, 7) * 3)) % 4 ? '#1e3a26' : '#24462c');
        }
      }
      for (let i = 0; i < 90; i++) {
        const x = 3 + Math.floor(hash(i, 1, 13) * 122), e = edge(x) - 3;
        if (e < 3) continue;
        const y = top ? 1 + Math.floor(hash(i, 2, 13) * e) : 32 - e + Math.floor(hash(i, 2, 13) * e);
        const tall = hash(i, 3, 13) > 0.7;
        P.line(x, y, x - 2, y - (tall ? 6 : 3), C.leafDk); P.line(x, y, x + 2, y - (tall ? 5 : 3), C.leaf); P.dot(x, y - (tall ? 4 : 2), C.leafHi);
        if (hash(i, 4, 13) > 0.86) { P(x - 1, y - 3, 2, 2, i % 2 ? '#f4c8dc' : '#fff4f8'); P.dot(x, y - 3, '#ffd860'); }
      }
      for (let i = 0; i < 6; i++) {
        const x = 16 + i * 19, e = edge(x), y = top ? Math.max(4, e - 6) : 32 - e + 6;
        P.line(x, y, x - 4, y - 9, C.leafDk, 2); P.line(x, y - 1, x - 4, y - 10, C.leafHi);
        P.line(x, y, x + 5, y - 8, C.leafDk, 2); P.line(x, y - 1, x + 5, y - 9, C.leaf);
        P.line(x, y, x, y - 11, C.leaf);
      }
    } },
    cart: { w: 1, h: 1, up: 10, draw(P) {
      P.shadow(8, 15, 7, 2);
      P(1, 1, 1, 13, C.gold); P(14, 1, 1, 13, C.gold); P(1, 1, 14, 3, '#e6dccb'); P(1, 1, 14, 1, C.goldHi); P(1, 9, 14, 2, '#e6dccb'); P(1, 11, 14, 1, C.goldDk);
      P.oval(3, 14, 1, 1, C.out); P.oval(13, 14, 1, 1, C.out);
      P(3, -4, 6, 5, '#f4e0e8'); P(3, -4, 6, 1, '#ffffff'); P(3, -2, 6, 1, C.pinkDk); P(5, -6, 2, 2, '#e04050');
      P(10, -3, 4, 4, C.chrome); P(10, -3, 4, 1, C.chromeHi); P(14, -2, 1, 2, C.chromeDk); P(11, -4, 2, 1, C.chromeHi);
      P(3, 6, 4, 3, '#c89a50'); P(9, 6, 4, 3, '#a0603a');
    } },
    lectern: { w: 1, h: 1, up: 10, draw(P) {
      P.shadow(8, 15, 5, 2); P(6, 2, 4, 12, C.woodDk); P(7, 2, 1, 12, C.wood); P(4, 13, 8, 2, C.woodDk); P(4, 13, 8, 1, C.gold);
      P(1, -4, 14, 7, C.wood); P(1, -4, 14, 1, C.gold); P(1, 3, 14, 1, C.woodDk);
      P(2, -6, 6, 7, '#f6eedc'); P(8, -6, 6, 7, '#ece2cc'); P(7, -6, 2, 7, '#c8bca4'); for (let y = -5; y < 0; y += 2) { P(3, y, 4, 1, '#8a8a9a'); P(9, y, 4, 1, '#8a8a9a'); }
      P(8, 0, 1, 4, '#c03040'); P(12, -8, 1, 5, C.goldHi);
    } },
    synth: { w: 2, h: 1, up: 14, draw(P) {
      P.shadow(16, 15, 15, 2);
      P.box(1, -2, 30, 4, 12, '#dfe6ee', '#b8c2ce', '#ffffff');
      P(1, 2, 30, 12, '#c6d0dc'); P(1, 2, 1, 12, '#ffffff'); P(30, 2, 1, 12, '#8a96a8');
      P(4, -12, 16, 11, '#28324a'); P(4, -12, 16, 1, '#ffffff'); P(5, -11, 14, 8, '#1a6aa8'); P(6, -10, 12, 6, '#3aa8e8');
      P(8, -9, 8, 1, '#c8f0ff'); P(8, -7, 5, 1, '#c8f0ff'); P(4, -1, 16, 1, '#8a96a8');
      P(22, -8, 7, 7, '#a8b4c4'); P(23, -7, 5, 5, '#6a7488'); P(24, -6, 3, 3, '#40e0ff');
      P(5, 5, 10, 4, '#2a3248'); P(6, 6, 8, 2, '#0a0e18'); P(19, 5, 2, 2, '#50ff90'); P(23, 5, 2, 2, '#ffb040'); P(19, 9, 9, 2, C.gold);
    } },
    desk: { w: 4, h: 1, up: 8, draw(P) {
      P.shadow(32, 15, 31, 2);
      P(0, 0, 64, 4, C.navyHi); P(0, 0, 64, 1, C.gold); P(0, 4, 64, 11, C.navy); P(0, 4, 64, 1, C.goldDk); P(0, 14, 64, 1, C.out);
      for (let x = 4; x < 60; x += 12) { P(x, 6, 8, 6, C.navyDk); P(x, 6, 8, 1, C.navyHi); }
      P(2, -4, 26, 5, '#2a3450'); P(2, -4, 26, 1, '#4a5a80'); for (let i = 0; i < 6; i++) { P(4 + i * 4, -3, 2, 2, i % 2 ? '#ffb040' : '#40e0ff'); } P(4, -1, 22, 1, '#141a2c');
      P(34, -6, 28, 7, '#141a2c'); P(34, -6, 28, 1, C.gold); P(36, -5, 24, 5, '#0a2a48'); P.ring(48, -3, 9, 2, '#60d8ff'); P.ring(48, -3, 5, 1, '#c8f4ff'); P.dot(48, -3, '#ffffff');
    } },
    phono: { w: 1, h: 1, up: 18, draw(P) {
      P.shadow(8, 15, 7, 2); P.box(1, 3, 14, 3, 9, C.woodHi, C.wood, C.gold); P(2, 8, 12, 4, C.woodDk); P(2, 8, 12, 1, C.goldDk);
      P.oval(8, 4, 6, 2, '#111016'); P.oval(8, 4, 2, 1, '#c03040'); P.dot(8, 4, C.goldHi);
      P(12, 0, 1, 5, C.gold); P(11, -4, 2, 5, C.goldDk); P(10, -8, 3, 5, C.gold);
      P.line(11, -8, 4, -15, C.goldDk, 2); P.oval(3, -15, 4, 5, C.gold); P.oval(3, -15, 3, 4, C.goldHi); P.oval(2, -15, 2, 3, '#4a3418');
    } },
    flamp: { w: 1, h: 1, up: 24, draw(P) {
      P.shadow(8, 15, 4, 1); P.oval(8, 13, 4, 1, C.goldDk); P(7, -14, 2, 27, C.goldDk); P(7, -14, 1, 27, C.gold);
      P.tri([3, -16, 13, -16, 11, -22, 5, -22], '#f6e4b8'); P(3, -16, 10, 1, '#c8a060'); P(5, -22, 6, 1, '#fff4d8');
    }, lights: () => [[8, -18, 22, '#ffd890', 0.35]] },
    hackterm: { w: 1, h: 1, up: 22, draw(P, v) {
      const jade = v === 'jade', cw = v === 'cw', hd = v === 'hd', range = v === 'range', warp = v === 'warp', glow = jade ? '#4ef0a0' : cw ? '#ffd471' : hd ? '#ff7a5a' : range ? '#ff7ad8' : warp ? '#c88aff' : '#5ad8ff';
      P.shadow(8, 15, 7, 2); P.box(1, 6, 14, 2, 6, '#2a2238', '#1a1424', C.purpleHi); P(2, 13, 12, 1, C.purpleDk);
      P(2, -16, 12, 22, '#120e1a'); P(2, -16, 12, 1, C.purpleHi); P(1, -14, 1, 20, C.purple); P(14, -14, 1, 20, C.purple);
      P(3, -14, 10, 12, '#05080c'); P(3, -14, 10, 1, glow);
      if (jade) { P.tri([8, -12, 11, -8, 8, -4, 5, -8], '#2aa070'); P.tri([8, -11, 10, -8, 8, -6, 6, -8], glow); P.dot(7, -9, '#e8fff4'); }
      else if (cw) { P.tri([8, -13, 11, -9, 8, -5, 5, -9], '#a8782a'); P.tri([8, -12, 10, -9, 8, -6, 8, -12], glow); P.dot(7, -10, '#fff4c8'); P(4, -4, 8, 1, '#5cff8a'); }
      else if (hd) { P(4, -7, 8, 2, '#c8d4f0'); P(4, -7, 8, 1, '#ffd890'); P(11, -8, 1, 1, '#ffd890'); P(4, -5, 8, 1, '#3a4258'); P.dot(4, -13, glow); P.dot(7, -12, glow); P.dot(11, -13, glow); P.dot(5, -10, '#ff3a2a'); P.dot(10, -11, '#ff3a2a'); P(4, -3, 8, 1, '#5cff8a'); }
      else if (warp) { P(4, -12, 8, 6, glow); P(5, -11, 6, 4, '#d8a840'); P(5, -11, 6, 1, '#ffe08a'); P(10, -11, 1, 1, glow); P(7, -9, 2, 1, '#fff4c8'); P(4, -4, 8, 1, '#e8e4ff'); }
      else if (range) { for (let r = 0; r < 4; r++) { P(4, -12 + r * 2, 8, 1, '#3a2a5a'); P(4, -12 + r * 2, 2, 1, '#7a6a9a'); P(7, -12 + r * 2, 2, 1, '#5ad8ff'); } P(10, -8, 2, 1, glow); }
      else { P(4, -12, 2, 1, glow); P(7, -12, 4, 1, '#2f6f86'); P(4, -10, 6, 1, '#2f6f86'); P(4, -8, 3, 1, glow); P(8, -8, 1, 2, '#e8f8ff'); P(4, -6, 5, 1, '#2f6f86'); }
      P(3, 0, 10, 4, '#1a1424'); for (let i = 0; i < 4; i++) P(4 + i * 2, 1, 1, 1, i % 2 ? C.pink : glow);
      P(12, -19, 1, 4, C.purpleHi); P.dot(12, -20, C.pink);
    }, lights: v => [[8, -8, 20, v === 'jade' ? '#4ef0a0' : v === 'cw' ? '#ffd471' : v === 'hd' ? '#ff7a5a' : v === 'range' ? '#ff7ad8' : v === 'warp' ? '#c88aff' : '#5ad8ff', 0.3, true]] },
    target: { w: 1, h: 1, up: 20, draw(P) {
      P.shadow(8, 15, 6, 2); P(7, 2, 2, 12, '#3a4258'); P(4, 13, 8, 2, '#2a3048'); P(5, 13, 6, 1, '#4a5470');
      P.oval(8, -6, 5, 5, '#9aa4bc'); P(4, -1, 8, 5, '#9aa4bc'); P(3, 0, 1, 7, '#7a8498'); P(12, 0, 1, 7, '#7a8498');
      P.oval(8, -6, 3, 3, '#ffd471'); P.oval(8, -6, 1, 1, '#c03040'); P(6, 1, 4, 3, '#ffd471'); P(7, 2, 2, 1, '#c03040');
      P.dot(5, -3, '#5a6478'); P.dot(11, 2, '#5a6478'); P.dot(10, -8, '#5a6478');
    } },
    term: { w: 1, h: 1, up: 16, draw(P, v) {
      const sim = v === 'sim';
      P.shadow(8, 15, 7, 2); P.box(2, 6, 12, 2, 6, C.navyHi, C.navy, C.gold); P(3, 13, 10, 1, C.goldDk);
      P(3, -14, 10, 20, C.navyDk); P(3, -14, 10, 1, C.gold); P(2, -12, 1, 18, C.gold); P(13, -12, 1, 18, C.gold);
      P(4, -12, 8, 10, sim ? '#2a1450' : '#0a2a48');
      if (sim) { for (let i = 0; i < 4; i++) P(5, -11 + i * 2, 6, 1, i % 2 ? '#50e0ff' : '#b080ff'); P(7, -5, 2, 2, '#ffffff'); }
      else { P(5, -10, 6, 4, C.goldHi); P(5, -10, 6, 1, '#ffffff'); P(6, -8, 4, 1, C.goldDk); P(5, -5, 6, 1, '#60d8ff'); }
      P(5, 0, 6, 2, '#141a2c'); P(6, 0, 4, 1, sim ? '#b080ff' : '#60d8ff');
    }, lights: v => [[8, -8, 18, v === 'sim' ? '#b080ff' : '#60d8ff', 0.3]] },
    tvdesk: { w: 2, h: 1, up: 12, draw(P) {
      P.shadow(16, 15, 15, 2); P.box(0, 1, 32, 4, 10, '#e6dccb', C.wood, '#fff6e6'); P(2, 7, 12, 6, C.woodDk); P(18, 7, 12, 6, C.woodDk);
      P(4, -4, 2, 6, C.goldDk); P(2, -6, 6, 3, '#f6e4b8');
      P(16, -10, 14, 12, '#2a2a30'); P(16, -10, 14, 1, '#4a4a52'); P(18, -8, 9, 8, '#1a3a3a'); P(19, -7, 7, 6, '#5ab8b0'); P(20, -6, 3, 2, '#c8fff8');
      P(28, -7, 1, 2, '#c03030'); P(28, -4, 1, 1, '#808088'); P.line(20, -11, 17, -16, '#8a8a92'); P.line(25, -11, 28, -16, '#8a8a92');
    } },
    bookcase: { w: 3, h: 1, up: 22, draw(P) {
      P.shadow(24, 15, 23, 2);
      P(0, -22, 48, 37, C.woodDk); P(0, -22, 48, 2, C.woodHi); P(1, -20, 46, 34, '#2a1a10');
      const books = ['#8a3040', '#3a5a8a', '#c8a050', '#4a7a4a', '#6a4a8a', '#d8d0c0', '#5a3a2a', '#2a6a7a'];
      for (const sy of [-19, -8, 3]) {
        let x = 2;
        while (x < 46) { const w = 1 + Math.floor(hash(x, sy, 3) * 3), h = 7 + Math.floor(hash(x * 3, sy, 4) * 3); if (hash(x, sy, 5) > 0.9) { x += 3; continue; } P(x, sy + 10 - h, Math.min(w, 46 - x), h, books[Math.floor(hash(x * 7, sy, 6) * books.length)]); x += w; }
        P(1, sy + 10, 46, 1, C.woodHi);
      }
      P(16, -22, 1, 37, C.wood); P(31, -22, 1, 37, C.wood); P(0, 14, 48, 1, C.out);
    } },
    databank: { w: 2, h: 1, up: 14, draw(P) {
      P.shadow(16, 15, 15, 2); P.box(0, 2, 32, 3, 10, '#2a3450', '#1c2440', '#5a6a90'); P(2, 7, 28, 1, C.gold);
      for (const [x, w] of [[1, 9], [11, 10], [22, 9]]) {
        P(x, -12, w, 13, '#141a2c'); P(x, -12, w, 1, '#5a6a90'); P(x + 1, -11, w - 2, 10, '#0a3020');
        for (let y = -10; y < -2; y += 2) P(x + 2, y, Math.max(1, Math.floor(hash(x, y, 9) * (w - 3)) + 1), 1, '#60ff90');
      }
      P(4, 3, 24, 2, '#3a4460'); for (let x = 5; x < 27; x += 2) P.dot(x, 3, '#8a96b0');
    }, lights: () => [[16, -6, 22, '#60ff90', 0.18]] },
    futon: { w: 2, h: 2, up: 2, draw(P) {
      P.shadow(16, 28, 15, 3); P(1, 1, 30, 28, '#e8eef4'); P(1, 1, 30, 1, '#ffffff'); P(1, 28, 30, 2, '#9aa8b8');
      P(2, 3, 12, 6, '#ffffff'); P(2, 8, 12, 1, '#c8d4e0'); P(1, 11, 30, 17, '#2a3a6a'); P(1, 11, 30, 2, '#3a4e88'); P(1, 27, 30, 1, '#1a2448');
      for (let x = 4; x < 30; x += 6) P(x, 14, 1, 12, '#34477a');
    } },
    bed: { w: 2, h: 2, up: 12, draw(P, v) {
      P.shadow(16, 30, 16, 2);
      if (v === 'himeko') {
        P(0, -12, 32, 14, C.woodDk); P(0, -12, 32, 2, C.gold); P(2, -9, 28, 9, '#7a1c24'); P(0, 2, 2, 28, C.wood); P(30, 2, 2, 28, C.wood);
        P(2, 2, 28, 26, '#f6efe4'); P(2, 10, 28, 18, '#8a222a'); P(2, 10, 28, 2, C.goldHi); P(2, 27, 28, 2, '#521218'); P(0, 29, 32, 2, C.woodDk);
        P(5, 3, 10, 6, '#fff8ee'); P(5, 8, 10, 1, C.gold); P(17, 3, 10, 6, '#fff8ee'); P(17, 8, 10, 1, C.gold);
        P(8, 16, 16, 8, '#6a1820'); P(8, 16, 16, 1, C.gold);
        return;
      }
      if (v === 'welt') {
        P(0, -12, 32, 14, C.wood); P(0, -12, 32, 2, C.woodHi); P(2, -9, 28, 9, '#24324c'); P(0, 2, 2, 28, C.woodDk); P(30, 2, 2, 28, C.woodDk);
        P(2, 2, 28, 26, '#e8eef4'); P(2, 10, 28, 18, '#2c3e5e'); P(2, 10, 28, 2, '#4a648c'); P(2, 27, 28, 2, '#1a2438'); P(0, 29, 32, 2, C.woodDk);
        for (let x = 6; x < 28; x += 6) P(x, 12, 1, 15, '#3b5278');
        for (let y = 15; y < 26; y += 5) P(2, y, 28, 1, '#3b5278');
        P(5, 3, 12, 6, '#ffffff'); P(5, 8, 12, 1, '#b8c6d8'); P(20, 4, 6, 4, '#3a2a1c'); P(21, 5, 4, 2, '#d8d0c0');
        return;
      }
      P(0, -12, 32, 14, '#f4d8e4'); P(0, -12, 32, 2, '#ffffff'); P(2, -9, 28, 9, C.pink); P(0, 2, 2, 28, '#e8c0d0'); P(30, 2, 2, 28, '#e8c0d0');
      P(2, 2, 28, 26, '#ffffff'); P(2, 10, 28, 18, '#f6b8d0'); P(2, 10, 28, 2, '#ffd4e4'); P(2, 27, 28, 2, C.pinkDk); P(0, 29, 32, 2, '#b06888');
      P(4, 3, 9, 6, '#ffffff'); P(5, 0, 2, 4, '#ffffff'); P(10, 0, 2, 4, '#ffffff'); P.dot(6, 1, C.pink); P.dot(11, 1, C.pink); P.dot(7, 5, '#3a2a30'); P.dot(10, 5, '#3a2a30');
      P(17, 3, 10, 7, '#b07848'); P.oval(18, 3, 2, 2, '#b07848'); P.oval(26, 3, 2, 2, '#b07848'); P.dot(20, 6, '#2a1a10'); P.dot(24, 6, '#2a1a10'); P(21, 7, 3, 2, '#d8a878');
      P(8, 16, 5, 4, '#ffffff'); P(9, 17, 3, 2, '#7ab0e0'); P(18, 20, 5, 4, '#ffffff'); P(19, 21, 3, 2, '#e0a050');
    } },
    nstand: { w: 1, h: 1, up: 12, draw(P) {
      P.shadow(8, 15, 6, 2); P.box(2, 3, 12, 3, 9, '#f4e8ee', '#e0c8d4', '#ffffff'); P(7, 8, 2, 1, C.gold);
      P(7, -5, 2, 8, C.goldDk); P.tri([4, -5, 12, -5, 10, -11, 6, -11], '#ffe8c8'); P(4, -5, 8, 1, '#e0b080');
    }, lights: () => [[8, -8, 16, '#ffd890', 0.3]] },
    camdesk: { w: 2, h: 1, up: 12, draw(P) {
      P.shadow(16, 15, 15, 2); P.box(0, 2, 32, 4, 9, '#f4e8ee', '#d8b8c8', '#ffffff'); P(2, 8, 12, 5, '#c8a0b4');
      P(3, -10, 13, 11, '#e8e8f0'); P(4, -9, 11, 8, '#2a3a5a'); P(5, -8, 9, 6, '#6aa0e0'); P(6, -7, 3, 2, '#ffffff'); P(8, 1, 3, 1, '#a8a8b8');
      P(19, -3, 9, 6, '#ffffff'); P(19, -3, 9, 1, '#f0c0d4'); P.oval(23, 0, 2, 2, '#2a2a40'); P.dot(23, 0, '#80c0ff'); P(26, -4, 2, 1, C.pink);
      P(19, 3, 4, 3, '#ffffff'); P(24, 3, 4, 3, '#ffffff'); P(20, 4, 2, 1, '#e0a050'); P(25, 4, 2, 1, '#70b0e0');
    } },
    cabinet: { w: 1, h: 1, up: 6, draw(P) {
      P.shadow(8, 15, 7, 2); P.box(1, 2, 14, 3, 10, '#f4e8ee', '#d8b8c8', '#ffffff'); P(2, 8, 12, 1, '#b890a4');
      P(3, -3, 3, 5, '#7a4a8a'); P(6, -4, 3, 6, '#3a7aa8'); P(9, -2, 3, 4, '#e08a40'); P(12, -5, 2, 7, '#f0c0d4');
    } },
    mirror: { w: 1, h: 1, up: 22, draw(P) {
      P.shadow(8, 15, 6, 2); P(3, 12, 10, 3, '#e0c8d4'); P(3, 12, 10, 1, '#ffffff');
      P(3, -21, 10, 34, '#f0d8e4'); P(4, -20, 8, 31, '#c8dcec'); P.dither(4, -20, 8, 31, '#e8f2fa', 0); P(5, -18, 1, 10, '#ffffff'); P(8, -14, 1, 6, '#ffffff');
    } },
    bunny: { w: 1, h: 1, up: 12, draw(P) {
      P.shadow(8, 15, 7, 2);
      P(1, 2, 14, 11, '#f6c4d8'); P(1, 2, 14, 1, '#ffe0ec'); P(1, 12, 14, 2, C.pinkDk); P(2, -4, 12, 7, '#f6c4d8'); P(2, -4, 12, 1, '#ffe0ec');
      P(3, -11, 3, 8, '#f6c4d8'); P(10, -11, 3, 8, '#f6c4d8'); P(4, -10, 1, 6, '#ffffff'); P(11, -10, 1, 6, '#ffffff');
      P(5, 0, 7, 8, '#b07848'); P.oval(5, 0, 1, 1, '#b07848'); P.oval(11, 0, 1, 1, '#b07848'); P.dot(7, 2, '#2a1a10'); P.dot(10, 2, '#2a1a10'); P(7, 4, 3, 2, '#d8a878');
    } },
    trolley: { w: 1, h: 1, up: 12, draw(P) {
      P.shadow(8, 15, 7, 2);
      P(1, 0, 1, 14, C.gold); P(14, 0, 1, 14, C.gold); P(1, 0, 14, 3, '#e6dccb'); P(1, 0, 14, 1, C.goldHi); P(1, 8, 14, 2, '#e6dccb'); P(1, 10, 14, 1, C.goldDk);
      P(2, 4, 3, 4, '#8a3040'); P(5, 5, 2, 3, '#3a5a8a'); P(7, 4, 3, 4, '#5a3a2a'); P(10, 5, 4, 3, '#c8a050');
      P(9, -5, 4, 5, '#ffffff'); P(9, -5, 4, 1, '#e0e0e8'); P.line(11, -6, 9, -11, C.leafDk); P.line(11, -6, 13, -10, C.leafDk); P(8, -12, 2, 2, '#e03040'); P(12, -11, 2, 2, '#e03040');
      P(3, -1, 4, 2, '#a0603a'); P(4, -3, 3, 2, '#c03040'); P.oval(2, 14, 1, 1, C.out); P.oval(14, 14, 1, 1, C.out);
    } },
    vase: { w: 1, h: 1, up: 12, draw(P) {
      P.shadow(8, 15, 6, 2); P(7, 4, 2, 10, C.goldDk); P(4, 13, 8, 1, C.goldDk); P.oval(8, 3, 6, 2, '#e6dccb'); P(2, 3, 12, 1, C.gold);
      P(6, -4, 4, 6, '#ffffff'); P(7, -5, 2, 1, '#e0e0e8'); P.line(8, -5, 6, -11, C.leafDk); P.line(8, -5, 10, -10, C.leafDk); P(5, -12, 2, 2, '#e03040'); P(9, -11, 2, 2, '#ff6070');
    } },
    coat: { w: 4, h: 1, up: 24, draw(P) {
      P.shadow(32, 15, 31, 2);
      P(1, -22, 2, 36, C.goldDk); P(44, -22, 2, 36, C.goldDk); P(1, -22, 45, 2, C.gold); P(0, 12, 47, 2, C.goldDk);
      const coats = [['#1c2846', '#c9a35a'], ['#8a2a2c', '#f0d28a'], ['#2a5a4a', '#e6dccb'], ['#1c2846', '#e04050'], ['#5a3a6a', '#f0d28a']];
      coats.forEach(([body, trim], i) => {
        const x = 4 + i * 8;
        P(x + 3, -20, 1, 2, C.chromeDk); P(x, -18, 7, 2, trim); P(x, -16, 7, 15, body); P(x + 3, -16, 1, 15, trim); P(x, -2, 7, 1, C.out);
      });
      P(6, 2, 6, 4, '#2a1a3a'); P(14, 3, 6, 3, '#8a2a2c'); P(22, 2, 6, 4, '#1c2846');
      P(49, -20, 14, 33, C.woodDk); P(50, -19, 12, 30, '#a8c0d4'); P.dither(50, -19, 12, 30, '#d8e8f4', 1); P(52, -17, 1, 12, '#ffffff'); P(49, -21, 14, 1, C.gold);
    } },
    booth: { w: 3, h: 1, up: 10, draw(P, v) {
      P.shadow(24, 15, 23, 2);
      if (v === 'u') {
        P(0, -4, 48, 17, C.purpleDk); P(0, -4, 48, 2, C.purple); P(0, -5, 48, 1, C.purpleHi);
        for (let x = 4; x < 48; x += 6) for (let y = -1; y < 12; y += 5) P.dot(x + ((y + 1) % 10 ? 0 : 3), y, '#2e2458');
        P(0, 12, 48, 1, '#2e2458'); P(0, 13, 48, 1, C.gold);
      } else {
        P(0, -9, 48, 10, C.purpleDk); P(0, -9, 48, 2, C.purpleHi);
        for (let x = 4; x < 48; x += 6) { P.dot(x, -5, '#2e2458'); P.dot(x + 3, -2, '#2e2458'); }
        P(1, 1, 46, 9, C.purple); P(1, 1, 46, 1, C.purpleHi); P(0, 10, 48, 2, C.purpleDk); P(0, 12, 48, 1, C.gold);
        P(16, 1, 1, 8, C.purpleDk); P(31, 1, 1, 8, C.purpleDk);
      }
    } },
    plantbox: { w: 1, h: 1, up: 14, size: v => [v || 1, 1], draw(P, v) {
      const n = v || 1, w = n * 16;
      P.shadow(w / 2, 15, w / 2 - 1, 2); P.box(0, 4, w, 2, 9, '#3a2618', C.woodDk, C.gold); P(0, 6, w, 1, C.goldDk);
      for (let i = 0; i < n * 5; i++) {
        const x = 2 + Math.floor(hash(i, n, 17) * (w - 4)), y = -6 + Math.floor(hash(i, 2, 17) * 10), big = hash(i, 3, 17) > 0.5;
        P.oval(x, y, big ? 4 : 2, big ? 3 : 2, i % 2 ? C.leafDk : C.leaf); P.line(x, y, x + (big ? 3 : 1), y - 2, C.leafHi);
        if (big) P.dot(x - 1, y + 1, '#24502c');
        if (hash(i, 4, 17) > 0.75) { P(x + 2, y - 3, 2, 2, i % 3 ? '#ff7090' : '#ffe070'); }
      }
    } },
    btable: { w: 1, h: 1, up: 6, draw(P) {
      P.shadow(8, 14, 5, 2); P(7, 4, 2, 9, C.chromeDk); P(7, 4, 1, 9, C.chrome); P.oval(8, 13, 4, 1, C.chromeDk);
      P.oval(8, 3, 6, 3, '#1a1622'); P.oval(8, 2, 6, 2, '#3a3046'); P(2, 4, 12, 1, C.gold);
      P(5, -3, 3, 3, 'rgba(200,230,255,0.7)'); P(6, -1, 1, 3, C.chromeHi); P(5, -3, 3, 1, '#ff7090'); P(10, -1, 2, 2, '#ffe070');
    } },
    barend: { w: 3, h: 3, up: 30, draw(P) {
      P.shadow(24, 44, 23, 3);
      P.oval(24, 30, 23, 13, '#2e2a52'); P.oval(24, 28, 23, 13, '#3c3668'); P.oval(24, 27, 22, 12, C.goldDk); P.oval(24, 27, 21, 11, '#4a3a2a'); P.oval(24, 27, 15, 7, '#1a1622');
      P.oval(24, 33, 23, 9, '#2e2a52');
      for (let x = 1; x < 48; x++) { const k = (x - 24) / 23, yb = Math.round(28 + 13 * Math.sqrt(Math.max(0, 1 - k * k))); P(x, yb, 1, 8, x % 6 === 0 ? '#3c3668' : '#2a2448'); P(x, yb, 1, 1, C.gold); P(x, yb + 7, 1, 1, C.out); }
      P(16, -26, 16, 52, '#f0a040'); P(16, -26, 3, 52, '#ffd890'); P(29, -26, 3, 52, '#c06820');
      for (let y = -20; y < 26; y += 8) P(16, y, 16, 1, '#a85a18');
      P(15, -20, 18, 4, '#c03030'); P(15, -20, 18, 1, '#ff6050');
      P(13, -30, 22, 5, '#1a1622'); P(13, -30, 22, 1, '#4a4060'); P(13, -26, 22, 1, C.gold);
      P(5, 22, 3, 3, 'rgba(200,230,255,0.7)'); P(39, 21, 3, 3, 'rgba(200,230,255,0.7)'); P(40, 19, 1, 2, '#ff7090');
    }, lights: () => [[24, 0, 56, '#ffb050', 0.42, true]] },
    bar: { w: 7, h: 1, up: 8, draw(P) {
      P.shadow(56, 15, 55, 2);
      P(0, -2, 112, 6, '#4a3a2a'); P(0, -2, 112, 1, C.goldHi); P(0, 3, 112, 1, C.gold); P(0, 4, 112, 12, '#2e2a52'); P(0, 15, 112, 1, C.out);
      for (let x = 6; x < 112; x += 14) { P(x, 6, 1, 6, C.goldDk); }
      for (let i = 0; i < 6; i++) { const x = 8 + i * 18; P(x, -6, 2, 5, ['#3a8a5a', '#c87030', '#7a3a8a', '#e0d0a0'][i % 4]); P(x, -7, 2, 1, C.chromeHi); P(x + 6, -3, 3, 3, 'rgba(200,230,255,0.7)'); }
    } },
    stool: { w: 1, h: 1, up: 6, draw(P) {
      P.shadow(8, 14, 4, 1); P(7, 3, 2, 10, C.chromeDk); P(7, 3, 1, 10, C.chrome); P.oval(8, 13, 3, 1, C.chromeDk);
      P.oval(8, 2, 5, 2, C.purpleDk); P.oval(8, 1, 5, 2, C.purple); P(5, 0, 5, 1, C.purpleHi);
    } },
    arcade: { w: 1, h: 1, up: 24, draw(P) {
      P.shadow(8, 15, 7, 2);
      P(1, -22, 14, 36, '#2a1a5a'); P(1, -22, 2, 36, '#4a3a9a'); P(13, -22, 2, 36, '#1a1040');
      P(1, -24, 14, 4, '#ff5090'); P(2, -23, 12, 2, '#ffd0e0');
      P(3, -17, 10, 9, '#0a0a14'); P(4, -16, 8, 7, '#1a6a8a'); P(5, -15, 2, 2, '#ffe060'); P(9, -13, 2, 2, '#ff5090'); P(4, -11, 8, 1, '#60e0ff');
      P(0, -6, 16, 5, '#3a2a7a'); P(0, -6, 16, 1, '#6a5ab8'); P(4, -8, 1, 3, '#c0c0c8'); P.dot(4, -9, '#ff3030'); P(9, -5, 2, 2, '#ffe060'); P(12, -5, 2, 2, '#60ff90');
      P(3, 2, 10, 2, '#ff5090'); P(3, 6, 10, 1, '#60e0ff'); P(6, 9, 4, 3, '#0a0a14'); P(1, 13, 14, 1, C.out);
    }, lights: () => [[8, -12, 20, '#60e0ff', 0.28, true]] },
    spiral: { w: 4, h: 3, up: 30, draw(P) {
      const cx = 32, cy = 26;
      P.shadow(32, 44, 26, 4);
      for (let i = 0; i < 14; i++) {
        const a0 = Math.PI * 0.55 + i * 0.36, a1 = a0 + 0.36, lift = i * 3.2;
        const pts = [cx, cy - lift, cx + Math.cos(a0) * 25, cy + Math.sin(a0) * 15 - lift, cx + Math.cos(a1) * 25, cy + Math.sin(a1) * 15 - lift];
        P.tri(pts, i % 2 ? '#7a5232' : '#6a4228');
        P.tri([pts[2], pts[3], pts[4], pts[5], pts[4], pts[5] + 3, pts[2], pts[3] + 3], '#3a2414');
        P.line(Math.round(pts[2]), Math.round(pts[3]), Math.round(pts[4]), Math.round(pts[5]), C.gold);
      }
      P(30, -26, 4, 54, C.goldDk); P(30, -26, 1, 54, C.goldHi);
      for (let i = 0; i <= 28; i++) {
        const a = Math.PI * 0.55 + i * 0.18, lift = i * 1.6;
        P(Math.round(cx + Math.cos(a) * 25), Math.round(cy + Math.sin(a) * 15 - lift - 9), 1, 9, C.goldDk);
        P(Math.round(cx + Math.cos(a) * 25), Math.round(cy + Math.sin(a) * 15 - lift - 10), 2, 1, C.gold);
      }
    } },
    rm_clutter: { w: 2, h: 1, up: 10, draw(P, v) {
      P.shadow(16, 14, 14, 2);
      P.box(1, 0, 14, 4, 9, '#c89a62', '#a67844', '#e0b67e');
      P(7, 0, 2, 13, '#d8c498'); P(3, 6, 6, 3, '#f4eedc'); P(4, 7, 4, 1, '#8a3030');
      P.box(15, -4, 15, 5, 12, '#b88852', '#946636', '#d4a66e');
      P(21, -4, 2, 17, '#c8382e'); P(17, 3, 5, 2, '#f4eedc');
      if (v === 'tall') { P.box(5, -8, 12, 3, 8, '#d4a870', '#b0824c', '#ecd098'); P(10, -8, 2, 11, '#d8c498'); }
    } },
    rm_bed: { w: 3, h: 2, up: 12, draw(P) {
      P.shadow(24, 30, 23, 2);
      P(1, -11, 46, 14, '#3a404a'); P(2, -10, 44, 12, '#4c525e');
      P(1, -11, 46, 1, C.gold); P(1, -11, 1, 14, C.goldDk); P(46, -11, 1, 14, C.goldDk);
      for (const x of [13, 24, 35]) P(x, -10, 1, 12, C.goldDk);
      P(1, 2, 46, 26, C.woodDk); P(2, 2, 44, 24, '#f4f0e6'); P(2, 2, 44, 2, '#ffffff');
      P(2, 10, 44, 16, '#34302c'); P(2, 10, 44, 2, '#4a443e'); P(2, 12, 44, 1, C.gold);
      P(1, 26, 46, 4, C.wood); P(1, 26, 46, 1, C.gold); P(2, 30, 3, 2, C.woodDk); P(43, 30, 3, 2, C.woodDk);
    } },
    rm_pillow: { w: 3, h: 1, up: 8, z: 1.2, draw(P, v) {
      for (const ox of [5, 27]) {
        P(ox, -3, 15, 8, '#f4f0e6'); P(ox + 3, -3, 5, 8, '#3a3632'); P(ox + 2, -3, 1, 8, '#d89a34'); P(ox + 8, -3, 2, 8, '#d89a34');
      }
      if (v === 'blue') {
        for (const ox of [5, 27]) { P(ox, -3, 15, 8, '#dcecf8'); P(ox + 3, -3, 5, 8, '#4a7ab8'); P(ox + 8, -3, 2, 8, '#90c8f0'); }
      } else if (v === 'bear') {
        P.oval(24, 2, 5, 4, '#9a6234'); P.oval(24, -3, 4, 3, '#b07442'); P.dot(21, -6, '#9a6234'); P.dot(27, -6, '#9a6234');
        P.oval(24, -2, 2, 1, '#e8cfa8'); P.dot(23, -4, '#1a1410'); P.dot(25, -4, '#1a1410'); P(22, 0, 4, 1, '#c8382e');
      } else if (v === 'diting') {
        P.oval(24, 1, 5, 4, '#e8e2d4'); P.oval(24, -3, 4, 3, '#f4f0e6'); P(20, -6, 2, 3, '#d4a048'); P(26, -6, 2, 3, '#d4a048');
        P(22, -3, 4, 1, '#38c8b0'); P(22, 0, 4, 2, '#c8382e');
      } else if (v === 'wubbaboo') {
        P.oval(24, 0, 5, 5, '#f2f6ff'); P.oval(24, -1, 4, 4, '#ffffff');
        P.dot(22, -1, '#202840'); P.dot(26, -1, '#202840'); P.oval(24, 1, 1, 1, '#70b8ff'); P.dot(24, -6, '#90d8ff');
      }
    } },
    rm_nstand: { w: 1, h: 1, up: 10, draw(P, v) {
      P.shadow(8, 14, 6, 2);
      P.box(2, 2, 12, 3, 9, C.woodHi, C.wood, C.gold);
      P(4, 7, 8, 5, C.woodDk); P(7, 9, 2, 1, C.goldHi);
      if (v === 'lamp') {
        P(6, -1, 4, 4, C.gold); P.tri([3, -1, 13, -1, 11, -7, 5, -7], '#ffe6a8'); P(5, -6, 6, 4, '#fff6d8');
      } else if (v === 'alarm') {
        P.oval(8, -1, 4, 4, '#c8382e'); P.oval(8, -1, 3, 3, '#fff8e8'); P.dot(6, -5, C.goldHi); P.dot(10, -5, C.goldHi); P(8, -3, 1, 2, '#2a2018');
      } else if (v === 'book') {
        P(4, -1, 8, 4, '#203868'); P(4, -1, 8, 1, C.goldHi); P(5, 0, 6, 2, '#4a78c0'); P(10, 2, 3, 2, '#f4eedc');
      }
    }, lights: v => v === 'lamp' ? [[8, -4, 22, '#ffd890', 0.32]] : [] },
    rm_desk: { w: 2, h: 1, up: 12, draw(P, v) {
      P.shadow(16, 14, 15, 2);
      P.box(1, 1, 30, 4, 9, C.woodHi, C.wood, C.gold);
      P(3, 6, 9, 7, C.woodDk); P(20, 6, 9, 7, C.woodDk); P(7, 9, 2, 1, C.gold); P(24, 9, 2, 1, C.gold);
      if (v === 'notes') {
        P(5, -1, 9, 4, '#f4eedc'); P(6, 0, 7, 1, '#5a6a8a'); P(6, 2, 5, 1, '#5a6a8a'); P(16, -2, 6, 4, '#2a3a68'); P(24, -5, 3, 6, C.gold);
      } else if (v === 'globe') {
        P(7, -1, 8, 3, '#f4eedc'); P.ring(22, -4, 5, 5, C.goldHi); P.oval(22, -4, 3, 3, '#2a6ab8'); P(21, 1, 3, 2, C.goldDk);
      } else if (v === 'camera') {
        P(6, -3, 8, 5, '#f0a8c8'); P(6, -3, 8, 1, '#ffffff'); P.oval(10, -1, 2, 2, '#2a3048');
        P(18, -1, 5, 4, '#ffffff'); P(19, 0, 3, 2, '#7ab0e0'); P(24, 0, 5, 4, '#ffffff'); P(25, 1, 3, 2, '#f0a050');
      }
    } },
    rm_bsofa: { w: 3, h: 1, up: 8, draw(P, v) {
      P.shadow(24, 14, 22, 2);
      P(1, -5, 46, 8, '#384668'); P(1, -5, 46, 2, '#506490'); P(1, -5, 46, 1, C.gold);
      P(2, 2, 44, 8, '#e6dcc8'); P(3, 2, 42, 1, '#fff8ea'); P(16, 2, 1, 7, '#c4b69e'); P(31, 2, 1, 7, '#c4b69e');
      P(0, -1, 4, 11, '#384668'); P(44, -1, 4, 11, '#384668'); P(2, 10, 44, 2, C.woodDk);
      if (v === 'plaid') {
        P(32, -4, 10, 12, '#b8322c'); P(34, -4, 2, 12, C.goldHi); P(32, 2, 10, 2, C.goldHi);
      } else if (v === 'cat') {
        P.oval(12, 2, 5, 4, '#f0a8c8'); P.tri([8, 0, 10, -4, 12, 0], '#f0a8c8'); P.tri([12, 0, 14, -4, 16, 0], '#f0a8c8');
        P.oval(36, 2, 5, 4, '#7cd8c8'); P.dot(11, 2, '#2a1a20'); P.dot(13, 2, '#2a1a20');
      } else if (v === 'poms') {
        for (const cx of [11, 37]) { P.oval(cx, 2, 5, 4, '#f4eedc'); P(cx - 5, 0, 2, 5, '#2a2634'); P(cx + 4, 0, 2, 5, '#2a2634'); P(cx - 2, -2, 5, 2, '#c8382e'); }
      }
    } },
    rm_wallart: { w: 2, h: 1, up: 16, z: 0.2, draw(P, v) {
      P(2, -14, 28, 16, C.gold); P(3, -13, 26, 14, '#141c34');
      if (v === 'serval') {
        P(3, -13, 26, 14, '#2a1438'); P.line(6, -2, 24, -11, '#ff50a0', 2); P.line(8, -11, 22, -2, '#60e0ff'); P.oval(16, -6, 4, 4, '#ffe060');
      } else if (v === 'museum') {
        P(3, -13, 26, 14, '#4a3628'); P.oval(16, -6, 6, 5, '#d8b46a'); P.oval(16, -7, 3, 3, '#f4e4b8');
      } else if (v === 'luofu') {
        P(3, -13, 26, 14, '#e8dec4'); P.oval(12, -8, 3, 3, '#c8382e'); P.line(6, -2, 26, -9, '#2a3438', 2); P.oval(20, -6, 4, 3, '#389888');
      } else {
        for (let i = 0; i < 10; i++) P.dot(5 + i * 2, -11 + (i * 3) % 10, '#ffffff');
        P.line(5, -3, 26, -10, C.goldHi); P.oval(18, -7, 3, 3, '#4aa0ff');
      }
    } },
    rm_sill: { w: 1, h: 1, up: 12, z: 0.2, draw(P, v) {
      P(4, -2, 8, 5, '#d8d0c0'); P(3, -3, 10, 2, C.gold);
      if (v === 'snow') {
        P(4, -9, 8, 7, 'rgba(180,230,255,0.45)'); P(7, -7, 2, 5, '#4a9a6a'); P.oval(8, -8, 2, 2, '#ffffff');
      } else if (v === 'bonsai') {
        P.line(7, -3, 9, -8, C.woodDk, 2); P.oval(6, -8, 4, 2, '#e8b038'); P.oval(11, -9, 4, 2, '#f4c850');
      } else {
        P.oval(8, -6, 5, 4, C.leaf); P.oval(6, -7, 3, 2, C.leafHi); P.oval(10, -5, 3, 2, C.leafDk);
      }
    } },
    rm_bench: { w: 2, h: 1, up: 6, draw(P, v) {
      P.shadow(16, 13, 14, 2);
      P.box(2, 3, 28, 4, 5, '#4c525e', C.wood, C.gold);
      if (v === 'boots') {
        P(6, 0, 4, 4, '#2a2630'); P(11, 0, 4, 4, '#2a2630'); P(19, 1, 8, 3, '#c8382e');
      } else if (v === 'chest') {
        P.box(8, -2, 16, 3, 4, '#8a5a34', '#5a381e', C.goldHi); P(15, 0, 2, 3, C.goldHi);
      } else if (v === 'tray') {
        P(7, 1, 18, 2, C.goldHi); P(10, -2, 4, 3, '#ffffff'); P(17, -3, 5, 4, '#d89a34');
      }
    } },
    rm_tub: { w: 3, h: 2, up: 10, draw(P, v) {
      P.shadow(24, 30, 22, 2);
      P.oval(24, 14, 22, 12, '#c8d4de'); P.oval(24, 12, 22, 11, '#ffffff');
      P.oval(24, 12, 19, 8, '#7ad8e8'); P.oval(22, 11, 14, 5, '#a8ecfa');
      P(2, 12, 44, 2, C.gold); P(4, 23, 4, 4, C.goldHi); P(40, 23, 4, 4, C.goldHi);
      P(42, 0, 3, 10, C.goldHi); P(39, 0, 4, 2, C.goldHi);
      for (const [bx, by] of [[12, 10], [16, 13], [30, 9], [34, 12]]) P.oval(bx, by, 3, 2, '#ffffff');
      if (v === 'duck') {
        P.oval(22, 11, 4, 3, '#ffd838'); P.oval(25, 8, 3, 2, '#ffe868'); P(27, 8, 2, 1, '#ff7820'); P.dot(25, 7, '#1a1410');
      } else if (v === 'pom') {
        P.oval(23, 11, 4, 3, '#f4eedc'); P(20, 6, 6, 4, '#c8382e'); P(20, 9, 6, 1, C.goldHi);
      } else if (v === 'salts') {
        P.oval(24, 12, 18, 7, '#d888e8'); P.oval(22, 11, 12, 4, '#f4b8ff');
      }
    }, lights: () => [[24, 10, 28, '#90e8ff', 0.25]] },
    rm_vanity: { w: 2, h: 1, up: 16, draw(P, v) {
      P.shadow(16, 14, 14, 2);
      P.box(2, 2, 28, 4, 8, '#eef4f8', '#5a6878', C.gold);
      P.oval(16, 4, 6, 2, '#90d8f0'); P(15, 0, 2, 3, C.goldHi);
      P(5, -14, 22, 14, C.gold); P(6, -13, 20, 12, '#8ab8d8'); P.line(8, -3, 18, -11, '#d8f0ff', 2);
      if (v === 'mugs') {
        P(5, 0, 3, 3, '#ff80a0'); P(24, 0, 3, 3, '#60b8ff');
      } else if (v === 'lotions') {
        P(4, -1, 2, 4, '#58d8c0'); P(7, 0, 2, 3, '#f0a8c8'); P(24, -1, 3, 4, '#ffd060');
      } else if (v === 'candle') {
        P(5, 0, 3, 3, '#f4eedc'); P.dot(6, -1, '#ff9830'); P(23, 0, 4, 3, '#88d8b0');
      }
    }, lights: () => [[16, -8, 22, '#d8f4ff', 0.25]] },
    rm_shower: { w: 1, h: 1, up: 18, draw(P) {
      P(1, -16, 14, 30, 'rgba(170,225,245,0.38)');
      P(1, -16, 14, 2, C.gold); P(1, 12, 14, 2, C.gold); P(1, -16, 1, 30, C.gold); P(14, -16, 1, 30, C.gold);
      P(7, -14, 2, 18, C.goldHi); P(5, -14, 6, 2, C.goldHi);
    } },
    rm_towel: { w: 1, h: 1, up: 14, draw(P, v) {
      P(2, -10, 12, 1, C.goldHi); P(2, -4, 12, 1, C.goldHi);
      const col = v === 'red' ? '#c8382e' : v === 'blue' ? '#4a88d8' : '#f4f0e6';
      P(4, -10, 8, 12, col); P(4, -1, 8, 2, C.gold);
    } },
    rm_bathmat: { w: 2, h: 1, up: 0, z: -10, draw(P, v) {
      const col = v === 'paw' ? '#e8c090' : v === 'wave' ? '#68b8d8' : '#eef4fa';
      P.oval(16, 8, 13, 6, C.goldDk); P.oval(16, 8, 12, 5, col);
      if (v === 'paw') { P.oval(16, 9, 4, 3, '#7a4e28'); for (const x of [11, 14, 18, 21]) P.dot(x, 5, '#7a4e28'); }
    } },
    rm_stairs: { w: 2, h: 2, up: 8, z: -10, draw(P) {
      P(0, -4, 32, 34, '#2a1a12');
      for (let i = 0; i < 7; i++) {
        P(2, i * 4, 28, 3, i % 2 ? '#8a5a34' : '#744828');
        P(2, i * 4, 28, 1, C.gold);
      }
      P(0, -6, 32, 2, C.goldHi); P(0, -6, 2, 36, C.gold); P(30, -6, 2, 36, C.gold);
    } },
    rm_mat: { w: 2, h: 1, up: 0, z: -10, draw(P, v) {
      const col = v === 'pom' ? '#384668' : v === 'trash' ? '#4a525a' : '#8a2824';
      P(2, 2, 28, 12, C.gold); P(3, 3, 26, 10, col);
      if (v === 'pom') { P.oval(16, 8, 4, 3, '#f4eedc'); P(13, 4, 6, 2, '#c8382e'); }
      else if (v === 'trash') { P(13, 4, 6, 7, '#b8c4d0'); P(12, 4, 8, 1, '#e4ecf4'); }
      else { P.oval(16, 8, 5, 3, C.goldHi); }
    } },
    rm_coat: { w: 2, h: 1, up: 16, draw(P, v) {
      P.shadow(16, 14, 14, 2);
      P.box(2, 6, 28, 3, 5, C.woodHi, C.wood, C.gold);
      P(5, -14, 2, 20, C.wood); P(25, -14, 2, 20, C.wood); P(4, -12, 24, 2, C.gold);
      P(8, -10, 5, 11, '#2c3e68'); P(15, -10, 5, 10, '#c8382e');
      if (v === 'hats') { P.oval(10, -13, 4, 2, '#c8382e'); P.oval(20, -13, 4, 2, '#d8b46a'); }
      else if (v === 'umb') { P(21, -9, 2, 13, '#f0a8c8'); P(20, -10, 4, 2, C.goldHi); }
      else if (v === 'bags') { P.box(19, 1, 6, 3, 4, '#d89a34', '#9a6418', C.goldHi); }
    } },
    rm_screen: { w: 2, h: 1, up: 16, draw(P, v) {
      P.shadow(16, 14, 15, 2);
      const bg = v === 'silk' ? '#e8dec4' : v === 'glass' ? '#5a98b8' : '#7a4e2d';
      for (let i = 0; i < 3; i++) {
        const x = 1 + i * 10;
        P(x, -14, 10, 28, C.goldDk); P(x + 1, -13, 8, 26, bg);
        P(x + 2, -9, 6, 1, C.goldHi); P(x + 2, 3, 6, 1, C.goldHi);
      }
    } },
    rm_hplant: { w: 1, h: 1, up: 18, draw(P, v) {
      P.shadow(8, 14, 6, 2);
      P.box(3, 5, 10, 3, 6, C.navyHi, C.navy, C.gold);
      if (v === 'bamboo') {
        for (const x of [5, 8, 10]) { P(x, -14, 2, 19, '#5cbc56'); P(x, -8, 2, 1, '#1a5a2a'); P.oval(x + 1, -14, 3, 2, '#78e070'); }
      } else if (v === 'ficus') {
        P(7, -4, 2, 9, C.wood); P.oval(8, -9, 6, 6, C.leaf); P.oval(6, -11, 4, 3, C.leafHi);
      } else {
        P(7, -4, 2, 9, C.wood);
        for (const [dx, dy] of [[-6, -10], [6, -10], [-4, -15], [4, -15], [0, -16]]) P.line(8, -4, 8 + dx, dy, C.leafHi, 2);
      }
    } },
    rm_board: { w: 2, h: 1, up: 14, draw(P) {
      P(1, -12, 30, 16, C.woodDk); P(2, -11, 28, 14, '#c89a62'); P(1, -12, 30, 1, C.gold);
      P(4, -9, 8, 6, '#fff8e6'); P(5, -8, 6, 1, '#c8382e');
      P(14, -9, 7, 9, '#e6f4ff'); P(22, -8, 6, 6, '#ffe898');
      P.oval(9, -1, 3, 3, '#c8382e'); P.dot(9, -1, C.goldHi);
    } },
    rm_fridge: { w: 1, h: 1, up: 18, draw(P, v) {
      P.shadow(8, 14, 7, 2);
      P(1, -16, 14, 30, '#dce4ec'); P(2, -15, 12, 28, '#f0f6fc');
      P(1, -4, 14, 1, '#9aa8b8'); P(12, -12, 1, 6, C.gold); P(12, -1, 1, 8, C.gold);
      if (v === 'stickers') {
        P.oval(6, -10, 3, 3, '#c8382e'); P(5, -1, 4, 4, '#ffd848'); P.dot(9, -7, '#4aa0ff');
      } else if (v === 'notes') {
        P(4, -12, 5, 4, '#ff90b8'); P(5, -7, 6, 4, '#80e0a0'); P(4, 1, 5, 4, '#ffe070');
      } else if (v === 'ice') {
        P(4, -11, 6, 5, '#2a3848'); P(5, -10, 4, 3, '#70d8ff');
      }
    } },
    rm_minibar: { w: 3, h: 1, up: 12, draw(P, v) {
      P.shadow(24, 14, 23, 2);
      P.box(0, 0, 48, 4, 10, '#4a3628', '#2a2038', C.gold);
      for (let x = 8; x < 44; x += 12) P(x, 5, 1, 7, C.goldDk);
      P(4, -8, 8, 8, C.chrome); P(5, -7, 6, 5, '#3a2010');
      const col = v === 'tea' ? '#68c888' : v === 'soda' ? '#ff6080' : v === 'juice' ? '#ffa830' : '#60c8ff';
      for (const x of [18, 25, 32, 39]) { P(x, -6, 4, 6, col); P(x, -7, 4, 1, '#ffffff'); }
    } },
    rm_candy: { w: 1, h: 1, up: 16, draw(P) {
      P.shadow(8, 14, 6, 2);
      P(3, 1, 10, 12, '#c8382e'); P(3, 1, 10, 1, C.goldHi); P(6, 6, 4, 4, C.gold);
      P.oval(8, -6, 6, 6, '#d8f0ff');
      for (const [x, y, c] of [[5, -5, '#ff5080'], [8, -4, '#ffe040'], [10, -6, '#50d890'], [7, -8, '#60a8ff'], [9, -3, '#c870ff']]) P.oval(x, y, 2, 2, c);
      P(5, -13, 6, 2, C.goldHi);
    } },
    rm_buffet: { w: 2, h: 1, up: 16, draw(P, v) {
      P.shadow(16, 14, 15, 2);
      P.box(1, -14, 30, 16, 12, C.woodHi, C.wood, C.gold);
      P(3, -12, 26, 11, '#261810'); P(3, -6, 26, 1, C.gold);
      const col = v === 'porcelain' ? '#70c8e8' : v === 'snacks' ? '#ff9848' : '#f4d890';
      for (const x of [5, 13, 21]) { P.oval(x + 2, -9, 3, 2, col); P.oval(x + 2, -3, 3, 2, '#ffffff'); }
    } },
    rm_island: { w: 3, h: 1, up: 8, draw(P, v) {
      P.shadow(24, 14, 22, 2);
      P.box(2, 0, 44, 5, 9, '#f4eee2', '#384668', C.gold);
      for (const x of [10, 24, 38]) { P.oval(x, 13, 4, 2, C.coral); P(x - 1, 10, 2, 3, C.goldDk); }
      if (v === 'cake') {
        P.oval(24, 1, 6, 3, '#ffffff'); P.oval(24, -1, 5, 2, '#ff80a8'); P.dot(24, -3, '#c82020');
      } else if (v === 'hotpot') {
        P.oval(24, 1, 7, 3, C.goldHi); P.oval(24, 0, 5, 2, '#e04028');
      } else if (v === 'pizza') {
        P.oval(24, 1, 6, 3, '#e8a840'); P.oval(24, 1, 5, 2, '#d83828'); P.dot(22, 1, '#ffe880'); P.dot(26, 1, '#ffe880');
      } else {
        P(14, -2, 5, 3, '#ffffff'); P(28, -3, 6, 4, C.goldHi);
      }
    } },
    rm_pcdesk: { w: 2, h: 1, up: 14, draw(P, v) {
      P.shadow(16, 14, 15, 2);
      P.box(1, 2, 30, 4, 8, '#2c3244', '#1c202c', '#5ad8ff');
      P(5, -10, 14, 11, '#d8d4c8'); P(6, -9, 12, 8, v === 'aether' ? '#3a2068' : v === 'silver' ? '#ff40a0' : '#008080');
      P(8, -7, 8, 4, '#ffffff'); P(21, -7, 7, 9, '#3a4052'); P(23, -5, 3, 1, '#50ff90');
      P(6, 3, 12, 2, '#d8d4c8');
    }, lights: () => [[12, -4, 24, '#5ad8ff', 0.3, true]] },
    rm_arcade: { w: 2, h: 1, up: 18, draw(P, v) {
      P.shadow(16, 14, 15, 2);
      const c1 = v === 'fight' ? '#c83040' : v === 'race' ? '#e89020' : '#3a2a7a';
      for (const ox of [1, 17]) {
        P(ox, -16, 14, 28, c1); P(ox, -16, 14, 3, '#ffd060');
        P(ox + 2, -12, 10, 8, '#0c1020'); P(ox + 3, -11, 8, 6, ox < 10 ? '#40d0ff' : '#ff60b0');
        P(ox + 1, -3, 12, 3, C.gold); P.dot(ox + 4, -2, '#ff3030'); P.dot(ox + 9, -2, '#50ff80');
      }
    }, lights: () => [[16, -8, 28, '#ff70c8', 0.3, true]] },
    rm_bgshelf: { w: 2, h: 1, up: 16, draw(P, v) {
      P.shadow(16, 14, 15, 2);
      P.box(1, -14, 30, 16, 12, C.woodHi, C.wood, C.gold);
      P(3, -12, 26, 12, '#1e2436'); P(3, -6, 26, 1, C.gold);
      const c = v === 'chess' ? '#d8b46a' : v === 'cards' ? '#e04868' : '#48d8a8';
      for (let x = 5; x < 26; x += 5) { P(x, -11, 4, 4, c); P(x, -4, 4, 4, '#f4eedc'); }
    } },
    rm_beans: { w: 2, h: 1, up: 6, draw(P, v) {
      P.oval(16, 9, 15, 5, '#2a2244'); P.oval(16, 9, 13, 4, '#443668');
      const c1 = v === 'trotter' ? '#f4eedc' : '#ff6888', c2 = v === 'trio' ? '#58d890' : '#58a8ff';
      P.oval(8, 5, 6, 5, c1); P.oval(7, 4, 4, 3, '#ffffff');
      P.oval(24, 5, 6, 5, c2); P.oval(23, 4, 4, 3, '#ffffff');
    } },
    rm_neon: { w: 2, h: 1, up: 16, z: 0.2, draw(P, v) {
      P(2, -13, 28, 12, '#121024'); P(2, -13, 28, 1, '#5ad8ff'); P(2, -2, 28, 1, '#ff60b8');
      if (v === 'wolf') {
        P.tri([8, -4, 16, -12, 24, -4], '#ff60b8'); P.dot(13, -7, '#5ad8ff'); P.dot(19, -7, '#5ad8ff');
      } else if (v === 'star') {
        P.oval(16, -7, 5, 4, '#ffe060'); P.line(6, -7, 26, -7, '#5ad8ff');
      } else {
        P.oval(16, -7, 7, 4, '#5ad8ff'); P.dot(12, -7, '#ffd860'); P.dot(20, -7, '#ff60b8');
      }
    }, lights: () => [[16, -7, 26, '#60d8ff', 0.32, true]] },
    rm_stand: { w: 3, h: 1, up: 20, draw(P) {
      P.shadow(24, 14, 23, 2);
      P(0, -18, 48, 22, '#1e2844'); P(2, -16, 44, 18, '#6890b8');
      P(0, -18, 48, 2, C.gold); P(0, -18, 2, 32, C.goldDk); P(46, -18, 2, 32, C.goldDk); P(15, -16, 2, 20, '#1e2844'); P(31, -16, 2, 20, '#1e2844');
      P(17, -7, 14, 2, '#ffe898');
      P.box(0, 2, 48, 3, 9, '#5a4636', '#243050', C.gold);
      for (const cx of [8, 24, 40]) { P.oval(cx, 2, 5, 2, '#2a2832'); P(cx - 5, 1, 10, 1, C.goldHi); }
    }, lights: () => [[24, -6, 32, '#ffe8a0', 0.28]] },
    rm_trophy: { w: 3, h: 1, up: 20, z: 0.3, draw(P, v) {
      if (v === 'trash_king') {
        P(4, -12, 8, 12, '#9aa6b4'); P(5, -12, 3, 12, '#dce4ec'); P(3, -14, 10, 2, '#c8d2de');
        P(19, -15, 10, 4, '#e06028'); P(17, -13, 14, 2, C.goldHi);
        P.oval(40, -5, 4, 5, '#c8d0dc'); P(38, -2, 4, 4, C.gold);
      } else if (v === 'express_model') {
        P(17, -14, 14, 4, '#1c2846'); P(16, -12, 16, 2, C.goldHi);
        P(5, -7, 6, 8, '#c8382e'); P(37, -8, 6, 9, '#4aa0ff');
      } else if (v === 'geomarrow') {
        P.tri([4, 1, 8, -11, 12, 1], '#ff8830'); P.tri([7, 1, 10, -8, 13, 1], '#ffd060');
        P.oval(24, -12, 5, 3, '#70c8ff'); P.oval(40, -5, 4, 5, '#8a96a8');
      } else if (v === 'star_skiff') {
        P.tri([16, -12, 24, -16, 32, -12], '#38b8a8'); P(18, -12, 12, 2, C.goldHi);
        P.oval(8, -5, 4, 4, '#e8b850'); P.oval(40, -5, 4, 4, '#c8382e');
      } else if (v === 'pixel_heart') {
        P(37, -9, 6, 6, '#ffe060'); P(39, -11, 2, 10, '#ffe060'); P(36, -7, 8, 2, '#2a2832');
        P.oval(8, -6, 4, 4, '#9a68e8'); P(18, -13, 12, 3, C.goldHi);
      } else if (v === 'herta_curio') {
        P.ring(8, -6, 5, 5, C.goldHi); P.oval(8, -6, 2, 2, '#60d8ff');
        P.oval(24, -12, 4, 4, '#d870ff'); P.oval(40, -5, 4, 4, '#50e0a0');
      } else if (v === 'trotter_gold') {
        P.oval(24, -4, 6, 5, C.goldHi); P.oval(22, -6, 3, 2, '#fff8c8'); P(20, -8, 8, 2, '#c8382e');
        P(5, -8, 6, 9, '#b8c4d0'); P.oval(40, -5, 4, 4, '#60b8ff');
      } else if (v === 'svarog_hand') {
        P(5, -11, 6, 12, '#7a8494'); P(6, -9, 4, 3, '#ff4040');
        P(19, -13, 10, 3, '#d89a34'); P.oval(40, -5, 4, 4, '#c8d4e0');
      } else if (v === 'arbor_leaf') {
        P.oval(24, -5, 5, 6, '#38c8a8'); P.oval(24, -5, 3, 4, C.goldHi);
        P(5, -9, 6, 10, '#c8382e'); P.oval(40, -6, 4, 4, '#ffe070');
      }
    } },
    rm_vitrines: { w: 2, h: 1, up: 14, draw(P, v) {
      P.shadow(16, 14, 14, 2);
      P.box(2, 2, 28, 3, 8, '#384668', '#1e2844', C.gold);
      P(3, -10, 26, 12, 'rgba(180,225,255,0.32)'); P(3, -10, 26, 1, C.goldHi);
      const c = v === 'medals' ? C.goldHi : v === 'scrolls' ? '#58d8a8' : '#70b8ff';
      for (const x of [7, 15, 23]) { P(x, -6, 4, 6, c); P(x, -1, 4, 2, C.goldDk); }
    } },
    cdoor_shut: { w: 1, h: 2, up: 0, z: -0.2, draw(P, v) {
      LAYER.cdoor(P, v);
    } },
    hm_siphon: { w: 1, h: 1, up: 14, draw(P) {
      P.shadow(8, 15, 7, 2);
      P.box(1, 2, 14, 3, 10, '#6a2824', '#421614', C.gold);
      P(3, 8, 10, 5, '#32100e'); P(7, 10, 2, 1, C.goldHi);
      P(4, -9, 1, 11, C.goldDk); P(3, 1, 7, 1, C.gold);
      P.oval(6, -1, 2, 2, '#d8f0ff'); P(5, 0, 3, 1, '#ff9838'); P.dot(6, 0, '#fff0a0');
      P.oval(6, -7, 3, 3, '#d8f0ff'); P(4, -7, 5, 2, '#2a1208'); P.dot(5, -9, '#ffffff');
      P(11, -3, 3, 4, '#8a3028'); P(11, -4, 3, 1, C.goldHi);
    }, lights: () => [[6, -2, 16, '#ffa848', 0.28, true]] },
    hm_chart: { w: 2, h: 1, up: 12, draw(P) {
      P.shadow(16, 15, 15, 2);
      P.box(1, 1, 30, 4, 9, '#6a2824', '#421614', C.gold);
      P(3, 6, 9, 7, '#32100e'); P(20, 6, 9, 7, '#32100e'); P(7, 9, 2, 1, C.gold); P(24, 9, 2, 1, C.gold);
      P(3, -1, 13, 5, '#142442'); P(3, -1, 13, 1, C.gold);
      P.line(5, 2, 9, 0, C.goldHi); P.line(9, 0, 14, 2, C.goldHi);
      P.dot(5, 2, '#ffffff'); P.dot(9, 0, '#ffffff'); P.dot(14, 2, '#ffffff');
      P(18, -2, 7, 5, '#8a242c'); P(19, -1, 5, 3, '#f6efe4');
      P.oval(27, 0, 2, 2, '#ffe8f0'); P.dot(27, 0, '#ffffff');
    }, lights: () => [[16, -2, 20, '#ffd890', 0.24]] },
    hm_case: { w: 1, h: 1, up: 10, draw(P) {
      P.shadow(8, 15, 7, 2);
      P.box(1, 2, 14, 4, 8, '#f4efe6', '#d8cfc0', C.gold);
      P(1, 5, 14, 1, C.gold); P(6, 5, 4, 2, C.goldHi);
      P(2, -5, 12, 7, '#ece6da'); P(2, -5, 12, 1, C.gold); P(3, -4, 10, 5, '#5a161c');
      P.oval(6, -2, 2, 2, C.goldHi); P(10, -3, 2, 3, '#70c8ff');
    } },
    wl_mecha: { w: 1, h: 1, up: 18, draw(P) {
      P.shadow(8, 15, 7, 2);
      P.box(1, -15, 14, 18, 12, C.woodHi, C.wood, C.gold);
      P(2, -13, 12, 14, '#182236'); P(2, -5, 12, 1, C.gold); P(2, 1, 12, 1, C.gold);
      P(6, -12, 4, 3, '#e8eef6'); P(5, -13, 6, 1, '#d83830'); P(7, -12, 2, 1, '#60e8ff');
      P(5, -9, 6, 4, '#d83830'); P(4, -9, 2, 3, '#e8eef6'); P(10, -9, 2, 3, '#e8eef6'); P(6, -8, 4, 1, C.goldHi);
      P.oval(5, -2, 2, 2, '#9aa8b8'); P.oval(10, -2, 2, 2, '#9aa8b8');
      P(4, 3, 5, 4, C.gold); P(5, 4, 3, 2, '#c85040');
    } },
    wl_desk: { w: 2, h: 1, up: 12, draw(P) {
      P.shadow(16, 15, 15, 2);
      P.box(1, 1, 30, 4, 9, C.woodHi, C.wood, C.gold);
      P(3, 6, 9, 7, C.woodDk); P(20, 6, 9, 7, C.woodDk); P(7, 9, 2, 1, C.gold); P(24, 9, 2, 1, C.gold);
      P(3, -3, 14, 6, '#2a3448'); P(4, -2, 12, 4, '#d8f4ff');
      P(6, -1, 4, 2, '#4a6890'); P(11, -1, 3, 2, '#d83830');
      P(19, -1, 6, 4, '#2c3e5e'); P(20, 0, 4, 2, '#f4eedc'); P(26, -4, 2, 5, C.goldHi);
    }, lights: () => [[10, 0, 22, '#90d8ff', 0.28]] },
    wl_cane: { w: 1, h: 1, up: 14, draw(P) {
      P.shadow(8, 15, 6, 2);
      P.box(2, 2, 12, 3, 9, C.woodHi, C.wood, C.gold);
      P(4, 7, 8, 5, C.woodDk); P(7, 9, 2, 1, C.gold);
      P(4, 0, 5, 2, '#1c2434'); P(5, 0, 1, 1, '#90c8ff'); P(7, 0, 1, 1, '#90c8ff');
      P(11, -10, 2, 22, '#241c34'); P(11, -10, 1, 22, C.gold);
      P.oval(12, -11, 2, 2, C.goldHi); P.dot(12, -11, '#b878ff');
    }, lights: () => [[12, -11, 14, '#a878ff', 0.24, true]] },
    wl_chess: { w: 1, h: 1, up: 10, draw(P) {
      P.shadow(8, 15, 7, 2);
      P.box(1, 2, 14, 3, 9, C.woodHi, C.wood, C.gold);
      for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) P(3 + x * 2, 2 + y, 2, 1, (x + y) % 2 ? '#f4eedc' : '#2a2434');
      P(4, 0, 1, 2, '#f4eedc'); P(7, 1, 1, 2, '#2a2434'); P(9, 0, 1, 2, C.goldHi);
      P(11, 1, 3, 3, '#2a3854'); P.dot(12, 1, '#70d8ff');
    }, lights: () => [[12, 0, 16, '#60c8ff', 0.24, true]] }
  };

  const LAYER = {
    emblem(P) {
      P.oval(16, 16, 11, 11, C.goldDk); P.oval(16, 16, 10, 10, C.navyDk); P.ring(16, 16, 8, 8, C.gold);
      P.tri([16, 6, 18, 14, 16, 26, 14, 14], C.goldHi); P.tri([6, 16, 14, 14, 26, 16, 14, 18], C.gold); P.dot(16, 16, '#ffffff');
    },
    screen(P) {
      P(0, 1, 64, 30, '#0a0c16'); P(0, 1, 64, 1, C.gold); P(0, 30, 64, 1, C.goldDk); P(1, 2, 1, 28, C.goldDk); P(62, 2, 1, 28, C.goldDk);
      P(3, 3, 58, 25, '#0e2a5a'); P.dither(3, 3, 58, 25, '#14386e', 0);
      P.oval(20, 15, 8, 8, '#2a6ab8'); P.ring(20, 15, 8, 8, '#c8e8ff'); P.tri([20, 8, 23, 15, 20, 22, 17, 15], '#ffffff');
      P(32, 9, 24, 2, '#c8e8ff'); P(32, 13, 18, 1, '#80b8f0'); P(32, 16, 21, 1, '#80b8f0'); P(32, 19, 14, 1, '#80b8f0'); P(3, 25, 58, 3, '#c03040'); P(5, 26, 30, 1, '#ffd0d8');
    },
    sconce(P) {
      P(6, 0, 4, 32, C.navyDk); P(7, 0, 2, 32, C.goldDk); P(7, 0, 1, 32, C.gold);
      P(5, 7, 6, 2, C.gold); P.tri([4, 9, 12, 9, 10, 16, 6, 16], '#ffe8b0'); P(6, 10, 4, 4, '#fff6d8');
    },
    door(P, v, open) {
      if (v === 'end') {
        P(0, 14, 16, 2, C.gold); P(0, 16, 16, 32, C.navy); P(1, 17, 14, 30, C.navyHi); P(2, 18, 12, 28, C.navy);
        P.oval(8, 26, 4, 4, C.gold); P.oval(8, 26, 3, 3, '#0e1a3a'); P.dot(7, 25, '#c8e8ff'); P(12, 32, 2, 4, C.goldHi); P(0, 48, 16, 2, C.gold);
        return;
      }
      P(0, 12, 16, 4, C.gold); P(0, 15, 16, 1, C.goldDk); P(0, 48, 16, 4, C.gold); P(0, 48, 16, 1, C.goldHi);
      P(v === 'l' ? 0 : 13, 16, 3, 32, 'rgba(255,214,140,0.22)');
    },
    stairs(P, v) {
      const w = v === 'l' ? 32 : 48;
      for (const y of [-2, 31]) { P(0, y, w, 2, C.goldDk); P(0, y, w, 1, C.gold); for (let x = 2; x < w; x += 6) P(x, y - 6, 1, 6, C.goldDk); P(0, y - 7, w, 1, C.goldHi); }
    },
    inlay(P) {
      P.ring(32, 16, 26, 13, C.gold); P.ring(32, 16, 24, 12, C.goldDk); P.ring(32, 16, 14, 7, C.gold);
      P.tri([32, 3, 35, 14, 32, 29, 29, 14], '#d8b46a'); P.tri([8, 16, 29, 13, 56, 16, 29, 19], '#d8b46a');
      P.tri([32, 7, 34, 15, 32, 25, 30, 15], C.goldHi); P.oval(32, 16, 2, 1, '#ffffff');
    },
    lockers(P) {
      for (let x = 0; x < 112; x += 16) { P(x + 1, 3, 14, 28, '#1a2440'); P(x + 1, 3, 14, 1, '#2c3a64'); P(x + 7, 6, 1, 18, '#e8f0ff'); P(x + 7, 6, 1, 1, '#ffffff'); }
      P(0, 2, 15, 30, '#1a4a4a'); P(1, 3, 13, 28, '#226060'); P(3, 9, 9, 1, C.gold); P(4, 5, 3, 4, '#8a6a4a'); P(9, 6, 2, 3, C.leafHi); P(3, 20, 9, 1, C.gold); P(5, 15, 5, 5, '#b8c8d8');
    },
    shelfwall(P) {
      const books = ['#8a3040', '#3a5a8a', '#c8a050', '#4a7a4a', '#6a4a8a', '#d8d0c0', '#5a3a2a'];
      P(0, 1, 112, 31, '#2a1a10');
      for (const sy of [2, 12, 22]) {
        let x = 1;
        while (x < 111) { const w = 1 + Math.floor(hash(x, sy, 21) * 3), h = 6 + Math.floor(hash(x * 5, sy, 22) * 3); P(x, sy + 9 - h, Math.min(w, 111 - x), h, books[Math.floor(hash(x * 3, sy, 23) * books.length)]); x += w + (hash(x, sy, 24) > 0.88 ? 2 : 0); }
        P(0, sy + 9, 112, 1, C.woodHi);
      }
      for (let x = 0; x < 112; x += 37) P(x, 1, 2, 31, C.wood);
    },
    photos(P) {
      P.line(0, 4, 31, 6, '#e8d0a0'); P.line(0, 17, 31, 15, '#e8d0a0');
      for (let i = 0; i < 6; i++) {
        const x = 1 + (i % 3) * 10, y = (i < 3 ? 6 : 17) + (i % 2), col = ['#7ab0e0', '#e0a050', '#f0a8c8', '#80d090', '#c8b0f0', '#f0e080'][i];
        P(x, y, 8, 9, '#ffffff'); P(x + 1, y + 1, 6, 5, col); P.dot(x + 3, y + 3, '#ffffff');
      }
      for (let x = 2; x < 32; x += 5) P.dot(x, 5 + (x % 2), '#fff0a0');
    },
    rangepad(P) {
      const w = 128, h = 48;
      for (let x = 0; x < w; x += 8) { const c = (x / 8) % 2 ? '#1a1820' : '#d8b030'; P(x, 0, 8, 3, c); P(x, h - 3, 8, 3, c); }
      for (let y = 0; y < h; y += 8) { const c = (y / 8) % 2 ? '#1a1820' : '#d8b030'; P(0, y, 3, 8, c); P(w - 3, y, 3, 8, c); }
    },
    spot() {},
    water(P) {
      P(0, 0, 64, 48, '#14304a');
      for (let i = 0; i < 26; i++) { const x = Math.floor(hash(i, 1, 31) * 60), y = Math.floor(hash(i, 2, 31) * 46); P(x, y, 4 + Math.floor(hash(i, 3, 31) * 6), 1, i % 2 ? '#2a6a8a' : '#3a8aa8'); }
      P(0, 0, 64, 1, C.gold); P(0, 0, 1, 48, C.gold);
      for (let x = 0; x < 64; x += 6) P(x, -2, 1, 3, C.goldDk);
    },
    cdoor(P, v) {
      if (v === 'open') {
        P(0, 0, 2, 32, C.wood); P(14, 0, 2, 32, C.wood); P(0, 0, 16, 3, C.woodHi); P(0, 3, 16, 1, C.goldDk); P(14, 2, 2, 28, '#a8703e');
        P(17, 8, 6, 4, C.gold); P(18, 9, 4, 2, '#3a2416');
        return;
      }
      P(0, 0, 16, 32, C.wood); P(1, 1, 14, 30, '#a8703e'); P(2, 2, 12, 28, C.wood);
      for (let i = 0; i < 4; i++) P.line(8, 18, 2 + i * 4, 4, '#94603a');
      P(12, 16, 2, 5, C.goldHi); P(4, 6, 8, 3, C.gold); P(5, 7, 6, 1, '#3a2416'); P(0, 30, 16, 2, C.woodDk);
    }
  };

  const LAYER_SIZE = { rangepad: [8, 3], emblem: [2, 2], screen: [4, 2], sconce: [1, 2], door: [1, 4], stairs: [2, 2], inlay: [4, 2], lockers: [7, 2], shelfwall: [7, 2], photos: [2, 2], spot: [3, 2], water: [4, 3], cdoor: [1, 2] };
  const LAYER_LIGHT = { sconce: () => [[8, 12, 18, '#ffd890', 0.32]], screen: () => [[32, 16, 40, '#4aa0ff', 0.2, true]], spot: () => [[24, 16, 26, '#ffd890', 0.3]] };

  function floorPaint(P, kind, car, e) {
    const r = i => hash(e.x * 13 + i, e.y * 7 + i * 3, 51);
    const pal = CARS[car] || CARS.parlor;
    if (car === 'lab' && (kind === 'floor' || kind === 'floor5')) { labFloor(P, kind, pal, e, r); return; }
    if (car === 'room') { roomFloor(P, kind, pal, e, r); return; }
    switch (kind) {
      case 'floor2': {
        P(0, 0, U, U, '#d8d1c3');
        if (r(1) > 0.4) P.line(Math.floor(r(2) * 10), 0, Math.floor(r(3) * 10) + 6, U - 1, '#c4baa8');
        if (r(4) > 0.7) P.line(0, Math.floor(r(5) * 12), U - 1, Math.floor(r(6) * 12) + 3, '#cbc2b1');
        P(0, 0, U, 1, '#e8e3d8'); P(0, 0, 1, U, '#e8e3d8'); P(U - 1, 0, 1, U, '#bbb19f'); P(0, U - 1, U, 1, '#bbb19f');
        if (e.edgeU) { P(0, 0, U, 3, '#1e1a24'); P(0, 3, U, 1, pal.trim); }
        if (e.edgeD) { P(0, U - 4, U, 1, pal.trim); P(0, U - 3, U, 3, '#1e1a24'); }
        return;
      }
      case 'floor3': {
        P(0, 0, U, U, '#741a20'); P.dither(0, 0, U, U, '#6a161c', (e.x + e.y) & 1);
        const ox = (e.x * 16) % 8, oy = (e.y * 16) % 8;
        for (let y = -oy; y < U; y += 8) for (let x = -ox; x < U; x += 8) { P(x + 3, y + 1, 2, 6, '#92302e'); P(x + 1, y + 3, 6, 2, '#92302e'); P(x + 3, y + 3, 2, 2, '#b04438'); }
        if (e.edgeU) P(0, 0, U, 1, '#3a0c10');
        if (e.edgeD) P(0, U - 1, U, 1, '#3a0c10');
        return;
      }
      case 'floor4': {
        for (let y = 0; y < U; y += 8) for (let x = 0; x < U; x += 8) P(x, y, 8, 8, ((x + y) / 8 + e.x * 2 + e.y * 2) % 2 ? '#2a2731' : '#d4cdbd');
        P(0, 0, U, 1, 'rgba(255,255,255,0.12)');
        return;
      }
      case 'floor5': {
        P(0, 0, U, U, '#2c6c6e'); P.dither(0, 0, U, U, '#286266', 0);
        for (let x = (e.x * 16) % 6; x < U; x += 6) P.dot(x, 8, '#4a9a94');
        if (e.edgeU) { P(0, 0, U, 1, '#1a3a3c'); P(0, 1, U, 1, '#6ab8b0'); }
        if (e.edgeD) { P(0, U - 2, U, 1, '#6ab8b0'); P(0, U - 1, U, 1, '#1a3a3c'); }
        return;
      }
      case 'stairs': {
        for (let x = 0; x < U; x += 4) { P(x, 0, 4, U, '#741a20'); P(x, 0, 1, U, pal.trim); P(x + 3, 0, 1, U, '#3a0c10'); }
        return;
      }
      case 'door': {
        const [b, hi, dk] = pal.dark;
        P(0, 0, U, U, b); P(0, 0, U, 3, '#3a2a1a'); P(0, 3, U, 1, pal.trim); P(1, 0, 1, U, dk); P(U - 2, 0, 1, U, dk); P(0, U - 1, U, 1, hi);
        return;
      }
      default: {
        const [b, hi, dk] = pal.dark;
        P(0, 0, U, U, b); P(0, 0, U, 1, hi); P(0, 0, 1, U, hi); P(U - 1, 0, 1, U, dk); P(0, U - 1, U, 1, dk);
        if (r(7) > 0.6) P.line(3, 12, 12, 3, 'rgba(255,255,255,0.05)');
      }
    }
  }

  function labFloor(P, kind, pal, e, r) {
    const [b, hi, dk] = pal.dark;
    if (kind === 'floor5') {
      P(0, 0, U, U, '#1d2530'); P.dither(0, 0, U, U, '#212a36', (e.x + e.y) & 1);
      if (e.edgeU) { P(0, 0, U, 1, '#0e141a'); P(0, 1, U, 1, pal.glow); P(0, 2, U, 1, 'rgba(90,216,255,0.25)'); P(e.x % 2 ? 2 : 10, 6, 4, 1, '#2f6f86'); }
      if (e.edgeD) { P(0, U - 3, U, 1, 'rgba(90,216,255,0.25)'); P(0, U - 2, U, 1, pal.glow); P(0, U - 1, U, 1, '#0e141a'); P(e.x % 2 ? 10 : 2, 9, 4, 1, '#2f6f86'); }
      return;
    }
    P(0, 0, U, U, b); P(0, 0, U, 1, hi); P(0, 0, 1, U, hi); P(U - 1, 0, 1, U, dk); P(0, U - 1, U, 1, dk);
    for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) P.dot(x, y, '#4a5462');
    if (r(1) > 0.55) for (let y = 4; y < 12; y += 3) for (let x = 4; x < 12; x += 3) P.dot(x + (y % 2), y, '#333b46');
  }

  function roomFloor(P, kind, pal, e, r) {
    if (kind === 'floor2') {
      P(0, 0, U, U, '#dce8f0');
      for (let y = 0; y < U; y += 8) for (let x = 0; x < U; x += 8) {
        P(x, y, 7, 7, ((x + y) / 8 + e.x + e.y) % 2 ? '#e8f2f8' : '#c8dce8');
        P(x + 7, y, 1, 8, '#9ab4c4'); P(x, y + 7, 8, 1, '#9ab4c4');
      }
      return;
    }
    if (kind === 'floor3') {
      P(0, 0, U, U, '#2c3858'); P.dither(0, 0, U, U, '#344266', (e.x + e.y) & 1);
      if (e.edgeU) P(0, 0, U, 2, pal.trim);
      if (e.edgeD) P(0, U - 2, U, 2, pal.trim);
      return;
    }
    if (kind === 'floor4') {
      for (let y = 0; y < U; y += 8) for (let x = 0; x < U; x += 8) P(x, y, 8, 8, ((x + y) / 8 + e.x + e.y) % 2 ? '#3e4c66' : '#d8d2c4');
      return;
    }
    if (kind === 'floor5') {
      P(0, 0, U, U, '#221e38'); P.dither(0, 0, U, U, '#2a2444', (e.x + e.y) & 1);
      if (e.edgeU) P(0, 0, U, 1, '#5ad8ff');
      if (e.edgeD) P(0, U - 1, U, 1, '#ff60b8');
      return;
    }
    if (kind === 'stairs') {
      for (let y = 0; y < U; y += 4) { P(0, y, U, 4, '#8a5a34'); P(0, y, U, 1, pal.trim); P(0, y + 3, U, 1, '#4a2c18'); }
      return;
    }
    const [b, hi, dk] = pal.dark;
    P(0, 0, U, U, b);
    for (let y = 0; y < U; y += 4) {
      P(0, y, U, 1, (y / 4 + e.y) % 2 ? hi : b);
      P(0, y + 3, U, 1, dk);
      const jx = ((e.x * 7 + e.y * 3 + y) * 5) % 14 + 1;
      P(jx, y, 1, 4, dk);
    }
    if (r(2) > 0.5) P(2, 5, 10, 1, hi);
  }

  function buildLayer(map) {
    const def = map.def, car = def.car, pal = CARS[car] || CARS.parlor;
    const cv = G.mkCanvas(map.w * U, map.h * U), g = cv.getContext('2d');
    const inside = (x, y) => x >= 0 && y >= 0 && x < map.w && y < map.h;
    const kind = (x, y) => G.tileKindAt(map, x, y);
    const shut = new Set();
    for (const [k, x, y, v] of def.decor || []) {
      if (k === 'cdoor' && v !== 'open') { shut.add(x + ',' + y); shut.add(x + ',' + (y + 1)); }
      if (k === 'door' && v === 'end') { shut.add(x + ',' + (y + 1)); shut.add(x + ',' + (y + 2)); }
    }
    const wall = (x, y) => !inside(x, y) || shut.has(x + ',' + y) || kind(x, y) === 'wall' || kind(x, y) === 'window';
    const role = (x, y) => {
      if (!wall(x, y)) return null;
      if (y + 1 >= map.h) return 'roof';
      if (!wall(x, y + 1)) return 'low';
      if (y + 2 < map.h && !wall(x, y + 2) && (car === 'room' || (inside(x - 1, y) && wall(x - 1, y)) || (inside(x + 1, y) && wall(x + 1, y)))) return 'high';
      return 'roof';
    };
    const floorKind = (x, y) => {
      const k = kind(x, y);
      if (k !== 'block') return k;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1], [0, -1], [0, 2], [0, -2], [-2, 0], [2, 0]]) { const n = inside(x + dx, y + dy) ? kind(x + dx, y + dy) : 'wall'; if (n !== 'block' && n !== 'wall' && n !== 'window' && n !== 'stairs' && n !== 'door') return n; }
      return (H.TILES[def.floor] || { kind: 'floor' }).kind;
    };
    const glass = [], lights = [], sprites = [], overs = [];
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      const P = pen(g, x * U, y * U), ro = role(x, y);
      if (!ro) {
        const fk = floorKind(x, y);
        const near = k => k === fk || k === 'block';
        floorPaint(P, fk, car, { x, y, edgeU: !near(inside(x, y - 1) ? floorKind(x, y - 1) : 'wall') && !wall(x, y - 1), edgeD: !near(inside(x, y + 1) ? floorKind(x, y + 1) : 'wall') && !wall(x, y + 1) });
        if (wall(x, y - 1)) { P(0, 0, U, 3, 'rgba(0,0,0,0.35)'); P(0, 3, U, 2, 'rgba(0,0,0,0.15)'); }
        if (wall(x - 1, y) && role(x - 1, y) === 'roof') P(0, 0, 2, U, 'rgba(0,0,0,0.3)');
        if (wall(x + 1, y) && role(x + 1, y) === 'roof') P(U - 2, 0, 2, U, 'rgba(0,0,0,0.3)');
        continue;
      }
      const win = kind(x, y) === 'window';
      const wl = inside(x - 1, y) && kind(x - 1, y) === 'window', wr = inside(x + 1, y) && kind(x + 1, y) === 'window';
      if (ro === 'roof') {
        P(0, 0, U, U, pal.roof);
        if (hash(x, y, 61) > 0.5) P(2, 2, U - 4, 1, pal.roofHi);
        const open = (dx, dy) => inside(x + dx, y + dy) && !wall(x + dx, y + dy);
        if (open(0, -1)) P(0, 0, U, 1, pal.trim);
        if (open(-1, 0)) P(0, 0, 1, U, pal.trim);
        if (open(1, 0)) P(U - 1, 0, 1, U, pal.trim);
        if (role(x, y + 1) === 'high') { P(0, U - 4, U, 2, pal.trimDk); P(0, U - 2, U, 1, pal.trim); P(0, U - 1, U, 1, pal.roofHi); }
        if (win && y === map.h - 1) {
          P(0, 2, U, 2, pal.trim); P(wl ? 0 : 1, 4, U - (wl ? 0 : 1) - (wr ? 0 : 1), 8, '#05060e'); P(0, 12, U, 2, pal.trimDk);
          if (!wl) P(0, 4, 1, 8, pal.trim);
          glass.push({ x: x * U + (wl ? 0 : 1), y: y * U + 4, w: U - (wl ? 0 : 1) - (wr ? 0 : 1), h: 8 });
        }
        continue;
      }
      const [b, hi, dk] = ro === 'high' ? pal.high : pal.low;
      P(0, 0, U, U, b);
      if (ro === 'high') {
        if (car === 'cabin') {
          P(0, 0, U, 2, pal.trimDk); P(0, 2, U, 1, pal.trim);
          for (let i = 0; i < 4; i++) P.line(8, 15, i * 5 - 1, 4, hi);
          P(0, 15, U, 1, dk);
        } else if (car === 'party') {
          P(0, 0, U, 2, '#3a2a18'); P(0, 2, U, 1, '#ffb050'); P(0, 3, U, 1, 'rgba(255,176,80,0.4)');
          P(2, 6, 12, 10, hi); P(3, 7, 10, 9, b);
        } else if (car === 'lab') {
          P(0, 0, U, 1, pal.trimDk); P(0, 1, U, 1, pal.trim);
          P(1, 4, 6, 12, hi); P(2, 5, 4, 11, b); P(9, 4, 6, 12, hi); P(10, 5, 4, 11, b); P(7, 4, 2, 12, dk);
          if (hash(x, y, 63) > 0.7) { P(4, 8, 1, 2, pal.glow); P(3, 8, 1, 2, 'rgba(90,216,255,0.35)'); }
        } else {
          P(0, 0, U, 1, pal.trimDk); P(0, 1, U, 1, pal.trim);
          P(2, 4, 12, 12, hi); P(3, 5, 10, 11, b);
        }
      } else {
        if (car === 'cabin') {
          P(0, 0, U, 1, pal.trim); P(0, 1, U, 2, '#c8ccd4'); P(2, 4, 12, 7, hi); P(3, 5, 10, 5, b); P(0, 12, U, 2, '#c8ccd4'); P(0, 14, U, 2, '#2a2a34');
        } else if (car === 'party') {
          P(2, 0, 12, 9, hi); P(3, 0, 10, 8, b); P(0, 10, U, 1, pal.trim); P(0, 11, U, 3, dk); P(0, 14, U, 2, '#0a0810');
        } else if (car === 'lab') {
          P(1, 0, 6, 7, hi); P(2, 0, 4, 6, b); P(9, 0, 6, 7, hi); P(10, 0, 4, 6, b); P(7, 0, 2, 7, dk);
          P(0, 8, U, 1, pal.trim); for (let i = 2; i < U - 1; i += 2) P(i, 9, 1, 2, dk);
          P(0, 11, U, 1, pal.glow); P(0, 12, U, 1, 'rgba(90,216,255,0.3)'); P(0, 13, U, 2, dk); P(0, 15, U, 1, '#05040a');
        } else {
          P(2, 0, 12, 8, hi); P(3, 0, 10, 7, b); P(0, 9, U, 1, pal.trim); P(0, 10, U, 1, pal.trimDk); P(0, 11, U, 3, dk); P(0, 14, U, 1, pal.trim); P(0, 15, U, 1, '#05040a');
        }
      }
      if (!win) {
        if (!(inside(x - 1, y) && wall(x - 1, y))) P(0, 0, 1, U, pal.trim);
        if (!(inside(x + 1, y) && wall(x + 1, y))) P(U - 1, 0, 1, U, pal.trim);
        continue;
      }
      const gx0 = wl ? 1 : 3, gx1 = wr ? U : U - 3;
      if (ro === 'high') {
        P(0, 0, U, 3, pal.trimDk); P(0, 2, U, 1, pal.trim);
        P(gx0 - 1, 3, gx1 - gx0 + 1, 13, pal.trim); P(gx0, 4, gx1 - gx0, 12, '#05060e');
        if (wl) P(0, 3, 1, 13, pal.trimDk);
        glass.push({ x: x * U + gx0, y: y * U + 4, w: gx1 - gx0, h: 12 });
      } else {
        P(gx0 - 1, 0, gx1 - gx0 + 1, 11, pal.trim); P(gx0, 0, gx1 - gx0, 10, '#05060e');
        if (wl) P(0, 0, 1, 10, pal.trimDk);
        P(0, 10, U, 2, '#e6dccb'); P(0, 10, U, 1, '#fff6e6'); P(0, 12, U, 3, pal.trimDk); P(0, 15, U, 1, '#05040a');
        glass.push({ x: x * U + gx0, y: y * U, w: gx1 - gx0, h: 10 });
      }
    }
    for (const [k, x, y, v, cond] of def.decor || []) {
      if (k === 'lantern') { overs.push({ k: v, x: x * U, y: y * U }); continue; }
      if (LAYER[k] && !cond) {
        LAYER[k](pen(g, x * U, y * U), v);
        for (const l of (LAYER_LIGHT[k] || (() => []))(v)) lights.push(light(x, y, l));
        continue;
      }
      const d = DECOR[k];
      if (!d) continue;
      const [w, h] = d.size ? d.size(v) : [d.w, d.h];
      const cvs = sprite(w * U, h * U, d.up, P => d.draw(P, v));
      sprites.push({ k, x, y, w, h, up: d.up, cv: cvs, sort: y + h - 1 + (d.z || 0), if: cond });
      for (const l of d.lights ? d.lights(v) : []) lights.push(Object.assign(light(x, y, l), cond ? { if: cond } : null));
    }
    return { cv, anims: [], th: def.theme, deco: true, car, glass, lights, sprites, overs };
  }

  function light(x, y, [lx, ly, r, col, a, pulse]) { return { x: x * U + lx, y: y * U + ly, r, col, a, pulse: !!pulse, ph: hash(x, y, 71) * 6.28 }; }

  const glows = new Map();
  function glowSprite(r, col) {
    const key = r + col;
    let c = glows.get(key);
    if (c) return c;
    c = G.mkCanvas(r * 2, r * 2);
    const g = c.getContext('2d'), n = parseInt(col.slice(1), 16), rgb = ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
    const gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, 'rgba(' + rgb + ',1)'); gr.addColorStop(0.35, 'rgba(' + rgb + ',0.45)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2);
    glows.set(key, c);
    return c;
  }

  const panos = new Map();
  function panorama(world, w, h) {
    const key = world + '|' + w + 'x' + h;
    let c = panos.get(key);
    if (c) return c;
    c = G.mkCanvas(w, h);
    const g = c.getContext('2d'), P = pen(g, 0, 0);
    if (world === 'belzerg') { meadowView(g, P, w, h); panos.set(key, c); return c; }
    if (world === 'luofu') { luofuView(g, P, w, h); panos.set(key, c); return c; }
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, world === 'jarilo' ? '#060914' : '#050716'); sky.addColorStop(1, world === 'jarilo' ? '#0e1a30' : '#120e2e');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    if (world !== 'jarilo') {
      for (let i = 0; i < 14; i++) {
        const x = hash(i, 1, 81) * w, y = hash(i, 2, 81) * h, r = 30 + hash(i, 3, 81) * 50;
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, i % 2 ? 'rgba(120,70,200,0.35)' : 'rgba(40,110,220,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
      }
    }
    for (let i = 0; i < w * h / 40; i++) {
      const x = Math.floor(hash(i, 5, 82) * w), y = Math.floor(hash(i, 6, 82) * h), k = hash(i, 7, 82);
      P.dot(x, y, k > 0.9 ? '#fff4c8' : k > 0.6 ? '#ffffff' : k > 0.3 ? '#a8c0ff' : '#5a6a9a');
      if (k > 0.985) { P.dot(x - 1, y, '#8aa0e0'); P.dot(x + 1, y, '#8aa0e0'); P.dot(x, y - 1, '#8aa0e0'); P.dot(x, y + 1, '#8aa0e0'); }
    }
    if (world === 'blue') {
      const R = Math.round(Math.min(w, h) * 0.42), cx = w * 0.62, cy = h * 0.72;
      const atm = g.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.12);
      atm.addColorStop(0, 'rgba(90,170,255,0.55)'); atm.addColorStop(1, 'rgba(90,170,255,0)');
      g.fillStyle = atm; g.fillRect(cx - R * 1.2, cy - R * 1.2, R * 2.4, R * 2.4);
      P.oval(cx, cy, R, R, '#1a5aa8');
      for (let i = 0; i < 90; i++) {
        const a = hash(i, 9, 86) * Math.PI * 2, rr = Math.sqrt(hash(i, 10, 86)) * R * 0.95;
        P.oval(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7, 6 + hash(i, 11, 86) * R * 0.12, 1 + hash(i, 12, 86) * 3, i % 4 ? '#e8f2ff' : '#2a7ad0');
      }
      for (let i = 0; i < 12; i++) { const a = hash(i, 13, 86) * Math.PI * 2, rr = hash(i, 14, 86) * R * 0.7; P.oval(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 4 + hash(i, 15, 86) * 10, 3 + hash(i, 16, 86) * 6, '#3a8a5a'); }
      const sh = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      sh.addColorStop(0, 'rgba(4,8,24,0)'); sh.addColorStop(0.55, 'rgba(4,8,24,0.15)'); sh.addColorStop(1, 'rgba(4,8,24,0.85)');
      g.fillStyle = sh; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
      P.ring(cx, cy, R, R, '#9ad0ff');
    } else if (world === 'jarilo') {
      const cx = w * 0.42, cy = 170, R = 150;
      P.oval(cx, cy, R + 2, R + 2, '#5a7aa8');
      P.oval(cx, cy, R, R, '#c6d2e2');
      for (let i = 0; i < 40; i++) { const a = hash(i, 9, 83) * Math.PI * 2, rr = hash(i, 10, 83) * R * 0.9; P.oval(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.6, 8 + hash(i, 11, 83) * 18, 2 + hash(i, 12, 83) * 3, i % 2 ? '#e6eef8' : '#aebcd2'); }
      const sh = g.createLinearGradient(cx - R, 0, cx + R, 0);
      sh.addColorStop(0, 'rgba(8,12,30,0)'); sh.addColorStop(0.65, 'rgba(8,12,30,0.1)'); sh.addColorStop(1, 'rgba(8,12,30,0.75)');
      g.fillStyle = sh; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
      P.ring(cx, cy, R + 1, R + 1, '#e8f4ff');
    } else {
      for (let i = 0; i < Math.ceil(w / 90); i++) {
        const x = i * 90 + Math.floor(hash(i, 13, 84) * 40), bw = 30 + Math.floor(hash(i, 14, 84) * 30), by = 38 + Math.floor(hash(i, 15, 84) * 6);
        P(x, by, bw, 12, '#121a30'); P(x, by, bw, 1, '#3a4a70'); P(x + 4, by - 6, 6, 6, '#121a30'); P(x + 6, by - 12, 1, 6, '#3a4a70'); P.dot(x + 6, by - 13, '#ff5050');
        for (let j = 0; j < bw - 4; j += 4) if (hash(i, j, 85) > 0.4) P(x + 2 + j, by + 3, 2, 2, '#ffd890');
        P(x, by + 10, bw, 1, '#40c8ff');
      }
      P(0, h - 22, w, 2, '#2a3450'); P(0, h - 20, w, 1, '#40c8ff');
    }
    panos.set(key, c);
    return c;
  }

  function luofuView(g, P, w, h) {
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#060d2a'); sky.addColorStop(0.12, '#123a5a'); sky.addColorStop(1, '#2e7470');
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    for (let i = 0; i < w * h / 80; i++) P.dot(Math.floor(hash(i, 5, 88) * w), Math.floor(hash(i, 6, 88) * 40), hash(i, 7, 88) > 0.7 ? '#ffffff' : '#8ab0e0');
    const hz = 40, K = '#0c2230', M = '#163a48', Rf = '#0a1a26', Au = '#e8b850', Win = '#ffd890', Jd = '#58f0d0';
    for (let i = 0; i < Math.ceil(w / 130) + 1; i++) {
      const x = i * 130 + Math.floor(hash(i, 1, 89) * 40), bw = 58 + Math.floor(hash(i, 2, 89) * 44), tiers = 1 + Math.floor(hash(i, 3, 89) * 2);
      let y = hz, tw = bw;
      for (let t = 0; t < tiers; t++) {
        const th = 14 + Math.floor(hash(i, 4 + t, 89) * 8), tx = x + Math.round((bw - tw) / 2);
        P(tx, y - th, tw, th, t % 2 ? M : K);
        for (let a = tx + 4; a < tx + tw - 5; a += 7) if (hash(i * 7 + t, a, 90) > 0.35) P(a, y - th + 4, 3, 4, Win);
        P.tri([tx - 7, y - th, tx + 4, y - th - 8, tx + tw - 4, y - th - 8, tx + tw + 7, y - th], Rf);
        P(tx - 7, y - th, tw + 14, 1, Au);
        y -= th + 8;
        tw = Math.max(16, Math.round(tw * 0.68));
      }
      P(x + Math.round(bw / 2), y - 14, 1, 14, Au);
      P.dot(x + Math.round(bw / 2), y - 15, Jd);
    }
    P(0, hz, w, h - hz, '#0a1c2a'); P(0, hz, w, 1, Au); P(0, hz + 3, w, 1, Jd);
    for (let x = 6; x < w; x += 22) P(x, hz + 8, 3, 2, Win);
    for (let i = 0; i < Math.ceil(w / 90); i++) {
      const sx = Math.floor(hash(i, 8, 91) * w), sy = 22 + Math.floor(hash(i, 9, 91) * 12);
      P.oval(sx, sy, 5, 1, '#d8e8f0'); P(sx - 2, sy - 2, 4, 1, Jd);
      for (let t = 1; t < 5; t++) P.dot(sx - 5 - t * 3, sy, t % 2 ? Jd : '#2a8a88');
    }
  }

  function meadowView(g, P, w, h) {
    const hz = Math.round(h * 0.62), sky = g.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, '#3a7ad0'); sky.addColorStop(1, '#bfe2f6');
    g.fillStyle = sky; g.fillRect(0, 0, w, hz);
    for (let i = 0; i < Math.ceil(w / 60); i++) {
      const x = i * 60 + hash(i, 1, 87) * 40, y = 10 + hash(i, 2, 87) * hz * 0.4, cw = 14 + Math.floor(hash(i, 3, 87) * 22);
      P.oval(x, y, cw, Math.max(3, Math.floor(cw * 0.3)), '#ffffff'); P.oval(x - cw * 0.4, y - 3, Math.floor(cw * 0.5), Math.max(2, Math.floor(cw * 0.25)), '#ffffff'); P(x - cw, y + 2, cw * 2, 1, '#d8e8f4');
    }
    for (let x = 0; x < w; x++) { const y = hz - 18 - Math.round(Math.sin(x / 60) * 10 + Math.sin(x / 17) * 3); P(x, y, 1, hz - y, '#8ab4b0'); }
    for (let i = 0; i < Math.ceil(w / 220); i++) {
      const kx = i * 220 + 140, ky = hz - 30 - Math.round(Math.sin(kx / 60) * 10);
      P(kx - 10, ky - 6, 20, 8, '#6e8a96'); P(kx - 13, ky - 12, 5, 14, '#6e8a96'); P(kx + 8, ky - 10, 5, 12, '#6e8a96'); P(kx - 2, ky - 18, 6, 12, '#6e8a96'); P(kx - 1, ky - 20, 4, 2, '#5a7480');
    }
    const wy = hz - 6;
    for (let x = 0; x < w; x++) { const y = hz - 6 - Math.round(Math.sin(x / 40 + 2) * 5); P(x, y, 1, h - y, '#5e9a48'); }
    for (let i = 0; i < Math.ceil(w / 160); i++) {
      const ax = i * 160 + 40;
      P(ax, wy - 16, 70, 14, '#c8beaa'); for (let x = 0; x < 70; x += 6) P(ax + x, wy - 19, 4, 3, '#c8beaa'); P(ax, wy - 16, 70, 1, '#e4dccc');
      for (let j = 0; j < 4; j++) { P(ax + 6 + j * 16, wy - 26, 10, 10, '#b8503a'); P.tri([ax + 5 + j * 16, wy - 26, ax + 11 + j * 16, wy - 33, ax + 17 + j * 16, wy - 26], '#c8643a'); }
      P(ax + 30, wy - 40, 8, 26, '#c8beaa'); P.tri([ax + 28, wy - 40, ax + 34, wy - 50, ax + 40, wy - 40], '#3a5a8a');
    }
    for (let x = 0; x < w; x += 3) P(x, h - 30 + Math.round(hash(x, 4, 87) * 4), 1, 30, x % 2 ? '#4c8c2c' : '#6cae3e');
    for (let i = 0; i < w / 20; i++) P.dot(Math.floor(hash(i, 5, 87) * w), h - 22 + Math.floor(hash(i, 6, 87) * 18), ['#ffffff', '#ffe060', '#ff9ab8'][i % 3]);
  }

  function drawWindows(ctx, L, map, cx, cy, t, vw) {
    if (!L.glass.length) return;
    const pano = panorama(L.outside || map.outside || 'herta', map.w * U + 320, map.h * U);
    const was = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    const shift = Math.round(cx * 0.375), maxX = (vw || 640) + 40;
    for (const gl of L.glass) {
      const sx = gl.x * 2 - cx, sy = gl.y * 2 - cy;
      if (sx > maxX || sy > 520 || sx + gl.w * 2 < -40 || sy + gl.h * 2 < -40) continue;
      const u = Math.max(0, Math.min(pano.width - gl.w, gl.x + 300 - shift));
      ctx.drawImage(pano, u, gl.y, gl.w, gl.h, sx, sy, gl.w * 2, gl.h * 2);
      ctx.fillStyle = 'rgba(160,200,255,0.07)';
      ctx.fillRect(sx + 2, sy, 3, gl.h * 2);
      if (Math.sin(t * 1.3 + gl.x * 0.7) > 0.96) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(sx + Math.floor(hash(gl.x, gl.y, 5) * (gl.w * 2 - 2)), sy + Math.floor(hash(gl.y, gl.x, 6) * (gl.h * 2 - 2)), 2, 2); }
    }
    ctx.imageSmoothingEnabled = was;
  }

  function drawSprite(ctx, s, sx, sy) {
    const was = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(s.cv, Math.round(sx), Math.round(sy - s.up * 2), s.cv.width * 2, s.cv.height * 2);
    ctx.imageSmoothingEnabled = was;
  }

  const LANTERN = {
    shell(P) {
      P.oval(22, 11, 19, 8, '#c8a060'); P.oval(22, 11, 18, 7, '#ffe8b8'); P.oval(20, 9, 13, 4, '#fff8e8');
      for (let i = 0; i < 6; i++) { const x = 9 + i * 6, k = (x - 22) / 19, hh = Math.round(7 * Math.sqrt(Math.max(0, 1 - k * k))); P(x, 11 - hh, 1, hh * 2 + 1, '#d8b070'); }
      P.tri([39, 11, 50, 4, 46, 11], '#ffe2a8'); P.tri([39, 11, 50, 18, 46, 11], '#ffe2a8'); P.line(39, 11, 49, 5, '#d8b070'); P.line(39, 11, 49, 17, '#d8b070');
      P.dot(8, 9, '#c8a060');
    },
    whale(P) {
      P.oval(20, 9, 16, 6, '#ffeec8'); P.oval(18, 8, 12, 4, '#fffaf0'); P.tri([34, 8, 44, 2, 41, 9], '#ffe2a8'); P.tri([34, 10, 44, 16, 41, 9], '#ffe2a8');
      P.tri([14, 12, 20, 19, 22, 13], '#ffe2a8'); P.dot(9, 8, '#c8a060'); P.line(6, 11, 16, 13, '#f0d090');
    },
    shark(P) {
      P.oval(16, 8, 13, 4, '#ffeec8'); P.oval(14, 7, 9, 2, '#fffaf0'); P.tri([14, 5, 18, 0, 20, 5], '#ffe2a8'); P.tri([28, 8, 34, 3, 33, 9], '#ffe2a8'); P.tri([28, 8, 34, 13, 33, 8], '#ffe2a8');
    },
    manta(P) {
      P.tri([2, 8, 16, 2, 30, 8], '#ffeec8'); P.tri([2, 8, 16, 14, 30, 8], '#ffe2a8'); P.oval(16, 8, 5, 4, '#fffaf0'); P.line(16, 14, 16, 22, '#f0d090');
    }
  };
  const lanterns = new Map(), LIFT = 46;
  function lanternSprite(k) {
    let c = lanterns.get(k);
    if (!c) { c = G.mkCanvas(52, 24); LANTERN[k](pen(c.getContext('2d'), 0, 0)); lanterns.set(k, c); }
    return c;
  }

  function drawFx(ctx, L, map, cx, cy, t, W, HGT, ok) {
    const was = ctx.imageSmoothingEnabled, op = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'lighter';
    for (const l of L.lights) {
      if (l.if && ok && !ok(l.if)) continue;
      const sx = l.x * 2 - cx, sy = l.y * 2 - cy, r = l.r * 2;
      if (sx < -r || sy < -r || sx > W + r || sy > HGT + r) continue;
      ctx.globalAlpha = Math.max(0, Math.min(1, l.a * (l.pulse ? 0.8 + 0.2 * Math.sin(t * 2.2 + l.ph) : 1)));
      ctx.drawImage(glowSprite(64, l.col), sx - r, sy - r, r * 2, r * 2);
    }
    for (const o of L.overs) {
      const sx = o.x * 2 - cx + 16, sy = o.y * 2 - cy + 16;
      ctx.globalAlpha = 0.16;
      ctx.drawImage(glowSprite(64, '#ffd890'), sx - 60, sy - LIFT - 40, 120, 80);
    }
    ctx.globalCompositeOperation = op;
    ctx.imageSmoothingEnabled = false;
    for (const o of L.overs) {
      const c = lanternSprite(o.k), sx = o.x * 2 - cx + 16 - c.width, sy = o.y * 2 - cy + 16 - LIFT - c.height + Math.round(Math.sin(t * 0.9 + o.x) * 2);
      if (sx > W || sy > HGT || sx + c.width * 2 < 0) continue;
      ctx.globalAlpha = 0.78;
      ctx.drawImage(c, sx, sy, c.width * 2, c.height * 2);
    }
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = was;
    const tint = L.tint !== undefined ? L.tint : (CARS[L.car] || {}).tint;
    if (tint) { ctx.fillStyle = tint; ctx.fillRect(0, 0, W, HGT); }
  }

  const INK = '#2a2018', INK_NAME = '#6a2a1a', WALL_PAGE = 8;

  function openBook(kind, close) {
    const ui = this, g = this.game, { W, HGT } = H.UI_CONST, photos = kind === 'photos', spreadsOf = () => Math.max(1, Math.ceil(entries.length / 6));
    let entries = g.bookPages(kind);
    this.push({
      page: 0, sel: Math.max(0, entries.findIndex(e => e.ok)),
      draw(c) {
        c.fillStyle = 'rgba(2,2,8,0.6)'; c.fillRect(0, 0, W, HGT);
        if (!photos) { entries = g.bookPages(kind); this.page = Math.min(this.page, spreadsOf() - 1); }
        if (photos) ui.drawPhotoWall(c, entries, this.sel, d => this.flip(d)); else ui.drawGuestBook(c, entries, this.page, spreadsOf());
        ui.hints(photos ? [['←→↑↓', 'Снимок'], ['Q E', 'Страница'], ['Esc', 'Закрыть']] : [['←→', 'Листать'], ['Esc', 'Закрыть']], W / 2, HGT - 30, { align: 'center' });
        ui.closeBtn(W - 50, 30, () => this.key('back'));
        if (!photos && ui.drawBookNet) ui.drawBookNet(c);
      },
      flip(d) {
        const pages = Math.max(1, Math.ceil(entries.length / WALL_PAGE)), page = Math.floor(this.sel / WALL_PAGE) + d;
        if (page < 0 || page >= pages) return;
        this.sel = Math.min(entries.length - 1, page * WALL_PAGE + this.sel % WALL_PAGE);
        ui.sfx('select');
      },
      key(k, code) {
        if (!photos && ui.bookNetKey && ui.bookNetKey(code)) return;
        if (k === 'back' || k === 'ok') { ui.screens.pop(); ui.sfx('cancel'); if (close) close(); return; }
        if (photos) {
          if (code === 'KeyQ' || code === 'KeyE') { this.flip(code === 'KeyQ' ? -1 : 1); return; }
          const n = entries.length, mv = { left: -1, right: 1, up: -4, down: 4 }[k];
          if (mv && this.sel + mv >= 0 && this.sel + mv < n) { this.sel += mv; ui.sfx('select'); }
          return;
        }
        if (k === 'left' && this.page > 0) { this.page--; ui.sfx('select'); }
        if (k === 'right' && this.page < spreadsOf() - 1) { this.page++; ui.sfx('select'); }
      }
    });
  }

  function drawGuestBook(c, entries, page, spreads) {
    const ui = this, bx = 40, by = 44, bw = 560, bh = 384;
    c.fillStyle = '#2a0c0e'; c.fillRect(bx - 4, by - 4, bw + 8, bh + 8);
    c.fillStyle = '#5a1c20'; c.fillRect(bx, by, bw, bh);
    c.fillStyle = C.gold; c.fillRect(bx + 4, by + 4, bw - 8, 1); c.fillRect(bx + 4, by + bh - 5, bw - 8, 1);
    for (const [px, side] of [[bx + 14, 0], [bx + bw / 2 + 2, 1]]) {
      const pw = bw / 2 - 16, ph = bh - 28, py = by + 14;
      c.fillStyle = '#efe4c8'; c.fillRect(px, py, pw, ph);
      const gr = c.createLinearGradient(side ? px : px + pw - 24, 0, side ? px + 24 : px + pw, 0);
      gr.addColorStop(side ? 0 : 1, 'rgba(90,60,30,0.35)'); gr.addColorStop(side ? 1 : 0, 'rgba(90,60,30,0)');
      c.fillStyle = gr; c.fillRect(side ? px : px + pw - 24, py, 24, ph);
      c.fillStyle = '#d8c8a4'; c.fillRect(px, py + ph - 2, pw, 2);
      const list = entries.slice(page * 6 + side * 3, page * 6 + side * 3 + 3);
      let y = py + 16;
      if (!side && !page) {
        ui.text('Гостевая книга', px + pw / 2, y, { align: 'center', size: 16, bold: true, serif: true, col: '#7a4a1a', shadow: false });
        c.fillStyle = '#b89a60'; c.fillRect(px + 40, y + 22, pw - 80, 1);
        y += 34;
      }
      for (const e of list) {
        ui.text(e.who, px + 18, y, { size: 13, bold: true, serif: true, col: INK_NAME, shadow: false });
        y += 18;
        for (const l of ui.wrap('«' + e.text + '»', pw - 40, 11)) { ui.text(l, px + 22, y, { size: 11, col: INK, shadow: false }); y += 14; }
        c.fillStyle = '#c8b48a'; c.fillRect(px + 22, y + 4, 40, 1); c.fillRect(px + 66, y + 4, 4, 1);
        y += 16;
      }
      if (!entries.length && !side) ui.text('Пока ни одной записи.', px + pw / 2, y + 10, { align: 'center', size: 11, col: '#8a7a5a', shadow: false });
      if (page === spreads - 1 && list.length < 3 && (side || entries.length - page * 6 <= 3)) ui.wrap('Чистых страниц ещё много. Путь продолжается.', pw - 40, 11).forEach((l, i) => ui.text(l, px + pw / 2, Math.max(y + 10, py + ph - 60) + i * 14, { align: 'center', size: 11, col: '#9a8a6a', shadow: false }));
      ui.text(String(page * 2 + side + 1), px + pw / 2, py + ph - 18, { align: 'center', size: 10, col: '#8a7a5a', shadow: false });
    }
    c.fillStyle = '#3a1012'; c.fillRect(bx + bw / 2 - 2, by + 10, 4, bh - 20);
    c.fillStyle = C.gold; c.fillRect(bx + bw / 2, by + 10, 1, bh - 20);
  }

  function drawPhotoWall(c, entries, sel, flip) {
    const ui = this, x0 = 56, y0 = 40, w = 528, h = 392;
    c.fillStyle = '#3a2414'; c.fillRect(x0 - 6, y0 - 6, w + 12, h + 12);
    c.fillStyle = '#b88a58'; c.fillRect(x0, y0, w, h);
    for (let i = 0; i < 900; i++) { c.fillStyle = i % 2 ? '#a87a4a' : '#c89a68'; c.fillRect(x0 + Math.floor(hash(i, 1, 91) * w), y0 + Math.floor(hash(i, 2, 91) * h), 2, 2); }
    c.fillStyle = '#ffd0e0'; c.fillRect(x0 + w / 2 - 90, y0 + 8, 180, 22);
    ui.text('Фотостена Март 7', x0 + w / 2, y0 + 12, { align: 'center', size: 13, bold: true, serif: true, col: '#8a3a5a', shadow: false });
    c.strokeStyle = 'rgba(255,240,180,0.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0 + 10, y0 + 46); c.quadraticCurveTo(x0 + w / 2, y0 + 62, x0 + w - 10, y0 + 46); c.stroke();
    const page = Math.floor(sel / WALL_PAGE), pages = Math.max(1, Math.ceil(entries.length / WALL_PAGE));
    entries.forEach((e, i) => {
      if (Math.floor(i / WALL_PAGE) !== page) return;
      const slot = i % WALL_PAGE, col = slot % 4, row = Math.floor(slot / 4), px = x0 + 22 + col * 126, py = y0 + 54 + row * 136 - (i === sel ? 4 : 0);
      if (!e.ok) {
        c.strokeStyle = 'rgba(80,50,30,0.6)'; c.setLineDash([4, 3]); c.strokeRect(px + 0.5, py + 0.5, 110, 118); c.setLineDash([]);
        ui.text('?', px + 55, py + 52, { align: 'center', size: 20, bold: true, col: 'rgba(80,50,30,0.6)', shadow: false });
      } else {
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(px + 3, py + 4, 110, 118);
        c.fillStyle = '#fbf8f0'; c.fillRect(px, py, 110, 118);
        const was = c.imageSmoothingEnabled; c.imageSmoothingEnabled = false;
        c.save(); c.beginPath(); c.rect(px + 6, py + 6, 98, 86); c.clip();
        c.drawImage(G.bgCanvas(e.bg, 98, 92), px + 6, py + 6, 98, 92);
        (e.cast || []).forEach((id, k, all) => G.drawSprite(c, G.lookOf(id, ui.game), 'down', 0, px + 55 - 16 + (k - (all.length - 1) / 2) * 30, py + 46));
        c.restore();
        c.imageSmoothingEnabled = was;
        c.fillStyle = 'rgba(255,240,220,0.12)'; c.fillRect(px + 6, py + 6, 98, 86);
        ui.text(String(i + 1), px + 98, py + 98, { align: 'right', size: 10, col: '#9a8a7a', shadow: false });
      }
      if (i === sel) { c.strokeStyle = C.goldHi; c.lineWidth = 2; c.strokeRect(px - 2, py - 2, 114, 122); c.lineWidth = 1; }
      c.fillStyle = ['#e04050', '#40a0e0', '#f0c040', '#60c070'][i % 4]; c.beginPath(); c.arc(px + 55, py + 2, 4, 0, Math.PI * 2); c.fill();
    });
    if (pages > 1) {
      ui.text('Страница ' + (page + 1) + ' из ' + pages, x0 + w - 20, y0 + 12, { align: 'right', size: 11, bold: true, col: '#fbf0d8' });
      for (const [d, ax] of [[-1, x0 - 30], [1, x0 + w + 8]]) {
        const on = page + d >= 0 && page + d < pages;
        c.fillStyle = on ? '#3a2414' : 'rgba(58,36,20,0.4)'; c.fillRect(ax, y0 + 150, 22, 60);
        c.fillStyle = on ? C.goldHi : 'rgba(255,220,150,0.3)';
        c.beginPath(); c.moveTo(ax + (d < 0 ? 6 : 16), y0 + 180); c.lineTo(ax + (d < 0 ? 16 : 6), y0 + 166); c.lineTo(ax + (d < 0 ? 16 : 6), y0 + 194); c.closePath(); c.fill();
        if (on && flip) ui.hit(ax, y0 + 150, 22, 60, () => flip(d));
      }
    }
    const e = entries[sel];
    c.fillStyle = '#fbf8f0'; c.fillRect(x0 + 20, y0 + h - 64, w - 40, 52);
    const lines = e && e.ok ? ui.wrap(e.text, w - 70, 11) : ['Здесь пока пусто. Март оставила место для следующего снимка.'];
    lines.slice(0, 3).forEach((l, i) => ui.text(l, x0 + 34, y0 + h - 58 + i * 15, { size: 11, col: INK, shadow: false }));
  }

  function openUi_hackjade() {
    this.debugJade();
    this.finishPending();
  }

  function openUi_hackdebug() {
    const s = this.openDebug(), close = s.onClose;
    s.onClose = () => { if (close) close(); this.finishPending(); };
  }

  if (H.UI) Object.assign(H.UI.prototype, { openBook, drawGuestBook, drawPhotoWall, openUi_hackjade, openUi_hackdebug });

  H.Train = { buildLayer, drawWindows, drawSprite, drawFx, DECOR, LAYER, CARS };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
