(function (H) {
  'use strict';
  const G = H.Gfx;
  const U = 16;
  const layers = new Map();
  const hash = (x, y, s) => G.hash(x, y, s);

  const THEMES = {
    station: { bg: '#0a0e18', fl: ['#3b4352', '#4c5667', '#2b313d', '#20252f'], fl2: ['#2e3440', '#3c4452', '#1c2028'], fl3: ['#465062', '#56627a', '#384050'], top: ['#1e2433', '#2a3244', '#65758f'], face: ['#8c98ad', '#a8b4c8', '#5f6a80', '#465064'], accent: '#40c8ff', accentDk: '#1a6a8a', light: '#9ae0ff' },
    station2: { bg: '#0a0c12', fl: ['#3a3833', '#4a4740', '#2a2824', '#1e1c1a'], fl2: ['#4a4232', '#5a5040', '#2a2418'], fl3: ['#4a463e', '#5a564c', '#3a362f'], top: ['#1c1a18', '#282521', '#5e5a50'], face: ['#7a7264', '#948c7c', '#5a5448', '#443f36'], accent: '#ffa040', accentDk: '#8a4a10', light: '#ffc080' },
    express: { bg: '#140a08', fl: ['#6a2428', '#8a3a34', '#4a171a', '#c89a50'], fl2: ['#5a2024', '#7a3230', '#3e1416'], fl3: ['#7a2a2e', '#9a4038', '#521a1c'], top: ['#2a1810', '#3a2216', '#6a4a30'], face: ['#5a3222', '#74442e', '#3e2216', '#2a160e'], accent: '#d0a860', accentDk: '#7a5a2a', light: '#ffe0a0' },
    snow: { bg: '#8a9ab0', fl: ['#e8eef6', '#fbfdff', '#cdd7e6', '#b4c0d4'], fl2: ['#d2dae6', '#e4eaf2', '#b8c4d4'], fl3: ['#bcd4ea', '#dcecf8', '#98b8d4'], top: ['#f2f6fb', '#ffffff', '#c8d4e4'], face: ['#6c7a8e', '#8896aa', '#4c586a', '#3a4454'], accent: '#80d0ff', accentDk: '#3a6a90', light: '#ffffff' },
    city: { bg: '#6a7488', fl: ['#d9dfe8', '#eef2f7', '#c2cad6', '#aab4c4'], fl2: ['#c8d0dc', '#dce2ea', '#aeb8c8'], fl3: ['#e4eaf2', '#f6f9fc', '#ccd4e0'], top: ['#eef2f8', '#ffffff', '#c4ccda'], face: ['#707a8c', '#8a94a6', '#545d6e', '#40485a'], accent: '#ffd060', accentDk: '#8a6a20', light: '#fff0c0', road: ['#8e939e', '#a6abb5', '#6c717c', '#dfe4ec'], brick: ['#9a8674', '#b09a86', '#7a6858', '#5e4e42'], roof: ['#4e5666', '#606a7c', '#3a4150'] },
    under: { bg: '#140c08', fl: ['#4e3e30', '#5e4c3c', '#3a2e24', '#2a2018'], fl2: ['#3e3a36', '#4e4a44', '#2a2622'], fl3: ['#5a4838', '#6a5646', '#44362a'], top: ['#241a14', '#30241c', '#6a5038'], face: ['#5a4636', '#705844', '#40322a', '#8a5a34'], accent: '#ff9a40', accentDk: '#8a4a18', light: '#ffb060', road: ['#6e5238', '#86643f', '#4a3624', '#3a2a1c'], brick: ['#5e5048', '#72645a', '#4a3e36', '#3a302a'], roof: ['#3a3430', '#4a423c', '#2a2622'] },
    mine: { bg: '#0a0808', fl: ['#3e3a40', '#4c4850', '#2c282e', '#1e1a20'], fl2: ['#36323a', '#443f48', '#26222a'], fl3: ['#48424a', '#58525a', '#38323a'], top: ['#1e1a1e', '#2a252a', '#56505a'], face: ['#4a4450', '#5e5866', '#34303a', '#26222a'], accent: '#60d8f0', accentDk: '#1a6a80', light: '#a0e8ff' },
    rivet: { bg: '#50565e', fl: ['#9aa2ac', '#aeb6c0', '#7e8690', '#646c76'], fl2: ['#8a929c', '#9ea6b0', '#707882'], fl3: ['#b8c2cc', '#d0d8e0', '#9aa4ae'], top: ['#e6ecf2', '#f6f9fc', '#b8c2cc'], face: ['#5e626a', '#767a84', '#464a52', '#8a5436'], accent: '#ff7040', accentDk: '#8a3a18', light: '#ffd0a0', brick: ['#6e5c54', '#84706a', '#54443e', '#3e322e'], roof: ['#4a4e56', '#5a5e68', '#383c44'] },
    ice: { bg: '#1a3048', fl: ['#9cc2da', '#c4e0f2', '#7aa4c2', '#e0f4ff'], fl2: ['#9cc2da', '#c4e0f2', '#7aa4c2'], fl3: ['#b4d6ec', '#d8eefa', '#90b8d4'], top: ['#6c9ecc', '#a8d0ee', '#3e6c9c'], face: ['#4a78a0', '#6a9ac2', '#34587a', '#26445e'], accent: '#8ae8ff', accentDk: '#2a6a90', light: '#e0ffff' },
    office: { bg: '#0c0814', fl: ['#585070', '#6a6284', '#463e5c', '#c8a050'], fl2: ['#4a2668', '#6a3a8c', '#2e1648'], fl3: ['#7a5a3e', '#946e4a', '#5a402a'], top: ['#2a1e3c', '#3a2a52', '#9a82c0'], face: ['#d8cce6', '#efe8f6', '#a898c2', '#5a3a58'], accent: '#c890ff', accentDk: '#6a3aa8', light: '#f4dcff' },
    sim: { bg: '#05030c', fl: ['#1c1840', '#2a2658', '#141030', '#50e0ff'], fl2: ['#2a1650', '#5a2e98', '#1c0e38'], fl3: ['#1c1840', '#2a2658', '#141030'], top: ['#1a1238', '#2a1e52', '#7a5ad8'], face: ['#2a1e52', '#3a2c70', '#140c2c', '#0a0618'], accent: '#50e0ff', accentDk: '#1a5a8a', light: '#c8f4ff' },
    hill: { bg: '#3a4a6a', fl: ['#dfe8f2', '#f4f8fc', '#c4d0e0', '#a8b8cc'], fl2: ['#ccd8e6', '#e2eaf4', '#b0c0d4'], fl3: ['#c4dcee', '#e0f0fa', '#a0c0da'], top: ['#f0f6fc', '#ffffff', '#c4d2e2'], face: ['#5c6c86', '#7888a2', '#44526a', '#34405a'], accent: '#a0e0ff', accentDk: '#3a6a96', light: '#ffffff' }
  };

  const WALLISH = new Set(['wall', 'rock', 'house', 'window', 'housedoor', 'gate']);
  const HOUSE = new Set(['house', 'window', 'housedoor']);
  const ANIM = new Set(['chasm', 'lamp', 'console', 'crystal', 'window']);

  function kindAt(map, x, y) {
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) return 'wall';
    const t = H.TILES[map.tiles[y][x]];
    return t ? t.kind : 'floor';
  }

  function painter(g, ox, oy) {
    const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(ox + x, oy + y, w, h); };
    P.dot = (x, y, c) => { g.fillStyle = c; g.fillRect(ox + x, oy + y, 1, 1); };
    P.dither = (x, y, w, h, c, phase) => { g.fillStyle = c; for (let j = 0; j < h; j++) for (let i = (j + (phase || 0)) & 1; i < w; i += 2) g.fillRect(ox + x + i, oy + y + j, 1, 1); };
    P.tri = (pts, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(ox + pts[0], oy + pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(ox + pts[i], oy + pts[i + 1]); g.closePath(); g.fill(); };
    P.ell = (x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(ox + x, oy + y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
    return P;
  }

  function floorTile(P, T, th, kind, e) {
    const v = e.v, r = i => hash(e.x * 3 + i, e.y * 5 + i * 7, 17);
    switch (th === 'city' && kind === 'road' ? 'cobble' : th === 'under' && kind === 'road' ? 'planks' : kind === 'rail' ? 'rail' : kind === 'bridge' ? 'bridge' : kind === 'chasm' ? 'chasm' : kind === 'door' ? 'door' : kind === 'stairs' ? 'stairs' : 'ground') {
      case 'cobble': {
        const [b, hi, dk, sn] = T.road;
        P(0, 0, U, U, dk);
        for (let row = 0; row < 4; row++) for (let col = -1; col < 3; col++) {
          const x = col * 6 + (row % 2 ? 3 : 0) + 1, y = row * 4 + 1;
          P(Math.max(0, x), y, Math.min(5, U - Math.max(0, x)) - (x < 0 ? -x : 0), 3, r(row * 4 + col) > 0.85 ? sn : b);
          if (x >= 0 && x < U) P(x, y, Math.min(5, U - x), 1, hi);
        }
        if (e.edge.u) P(0, 0, U, 1, '#e8ecf2');
        if (e.edge.d) P(0, U - 1, U, 1, '#5a5f68');
        return;
      }
      case 'planks': {
        const [b, hi, dk, dk2] = T.road;
        P(0, 0, U, U, b);
        for (let i = 0; i < 4; i++) { P(0, i * 4 + 3, U, 1, dk); P(0, i * 4, U, 1, hi); }
        P(((v * 5) % 12) + 2, 1, 1, 2, dk2); P(((v * 7) % 10) + 3, 9, 1, 2, dk2);
        return;
      }
      case 'rail': {
        const base = th === 'mine' ? T.fl : T.fl;
        P(0, 0, U, U, base[0]);
        P.dither(0, 0, U, U, base[2], v);
        const vert = e.railV;
        if (vert) {
          for (let i = 1; i < U; i += 4) P(2, i, 12, 2, '#5a3c26');
          for (let i = 1; i < U; i += 4) P(2, i, 12, 1, '#7a5638');
          P(4, 0, 1, U, '#b8bcc8'); P(11, 0, 1, U, '#b8bcc8'); P(5, 0, 1, U, '#6a6e7a'); P(12, 0, 1, U, '#6a6e7a');
        } else {
          for (let i = 1; i < U; i += 4) P(i, 2, 2, 12, '#5a3c26');
          for (let i = 1; i < U; i += 4) P(i, 2, 1, 12, '#7a5638');
          P(0, 4, U, 1, '#b8bcc8'); P(0, 11, U, 1, '#b8bcc8'); P(0, 5, U, 1, '#6a6e7a'); P(0, 12, U, 1, '#6a6e7a');
        }
        return;
      }
      case 'bridge': bridgeTile(P, th, e); return;
      case 'chasm': {
        if (th === 'snow' || th === 'ice' || th === 'hill') {
          P(0, 0, U, U, '#6a9ec4');
          P.dither(0, 0, U, U, '#5a8eb4', v);
          for (let i = 0; i < 3; i++) P(Math.floor(r(i) * 12), Math.floor(r(i + 5) * 14), 3 + (i % 2), 1, '#a8d4ee');
          if (r(9) > 0.6) { P(Math.floor(r(10) * 10), Math.floor(r(11) * 10) + 2, 5, 1, '#e8f6ff'); P(Math.floor(r(10) * 10) + 2, Math.floor(r(11) * 10) + 3, 1, 1, '#e8f6ff'); }
          if (e.edge.u) { P(0, 0, U, 3, '#f4f8fc'); P(0, 3, U, 1, '#c4d4e4'); for (let i = 0; i < U; i += 4) P(i + (v % 3), 3, 2, 1, '#f4f8fc'); P(0, 4, U, 1, '#4a7ea4'); }
          if (e.edge.d) { P(0, U - 2, U, 2, '#3a6488'); }
          const wet = e.edge.u ? 5 : 0;
          if (e.nb2.l === 'bridge') { P(0, wet, 3, U - wet, 'rgba(20,40,70,0.45)'); P(3, wet, 1, U - wet, 'rgba(20,40,70,0.2)'); }
          if (e.nb2.r === 'bridge') P(U - 1, wet, 1, U - wet, 'rgba(20,40,70,0.3)');
        } else if (th === 'sim') {
          P(0, 0, U, U, '#05030c');
          if (r(1) > 0.45) P.dot(Math.floor(r(2) * U), Math.floor(r(3) * U), r(4) > 0.5 ? '#c8c0ff' : '#5a5aa0');
          if (r(5) > 0.9) { const x = Math.floor(r(6) * 12) + 2, y = Math.floor(r(7) * 12) + 2; P(x, y, 1, 1, '#ffffff'); P(x - 1, y, 3, 1, 'rgba(200,190,255,0.35)'); }
          if (e.edge.u) { P(0, 0, U, 1, '#50e0ff'); P(0, 1, U, 3, '#241a4a'); P(0, 4, U, 2, '#120c28'); for (let i = 1; i < U; i += 4) P(i, 2, 1, 1, '#c890ff'); }
        } else {
          P(0, 0, U, U, '#05060c');
          if (r(1) > 0.5) P.dot(Math.floor(r(2) * U), Math.floor(r(3) * U), '#8a90b0');
          if (e.edge.u) P(0, 0, U, 2, '#1c2030');
        }
        return;
      }
      case 'door': {
        groundTile(P, T, th, 'floor', e);
        const vert = e.nb.l && e.nb.r;
        if (vert) {
          P(0, 0, 3, U, T.face[3]); P(U - 3, 0, 3, U, T.face[3]);
          P(0, 0, 3, 1, T.top[2]); P(U - 3, 0, 3, 1, T.top[2]);
          P(3, 0, U - 6, 2, T.face[2]);
          P(3, U - 2, U - 6, 1, T.accent); P(3, 2, U - 6, 1, T.accentDk);
        } else {
          P(0, 0, U, 3, T.face[3]); P(0, U - 3, U, 3, T.face[3]);
          P(0, 0, 1, U, T.accent); P(U - 1, 0, 1, U, T.accentDk);
        }
        return;
      }
      case 'stairs': {
        const [b, hi, dk] = T.fl;
        for (let i = 0; i < 4; i++) { P(0, i * 4, U, 4, i % 2 ? b : hi); P(0, i * 4 + 3, U, 1, dk); }
        return;
      }
      default: groundTile(P, T, th, kind, e);
    }
  }

  const WOOD = ['#8a6440', '#96704a', '#7e5a3a'];

  function bridgeTile(P, th, e) {
    const r = i => hash(e.x * 7 + i, e.y * 3 + i * 11, 53), snowy = th === 'snow' || th === 'ice' || th === 'hill';
    const along = e.bridgeV;
    const Q = along ? P : (x, y, w, h, c) => P(y, x, h, w, c);
    const side = along ? { a: !e.same.l, b: !e.same.r, s: !e.same.u, f: !e.same.d } : { a: !e.same.u, b: !e.same.d, s: !e.same.l, f: !e.same.r };
    Q(0, 0, U, U, '#3e2a1a');
    for (let i = 0; i < 4; i++) {
      const y = i * 4, col = WOOD[Math.floor(r(i) * 3)];
      Q(0, y, U, 3, col);
      Q(0, y, U, 1, '#b08658');
      const seam = 3 + Math.floor(r(i + 8) * 10);
      if (r(i + 4) > 0.45) Q(seam, y, 1, 3, '#4a3220');
      Q(2, y + 1, 1, 1, '#3a2616'); Q(U - 3, y + 1, 1, 1, '#3a2616');
      if (snowy && r(i + 12) > 0.6) Q(Math.floor(r(i + 16) * 12) + 2, y + 1, 2, 1, '#f4f8fc');
    }
    if (side.a) {
      Q(0, 0, 3, U, '#4a3220'); Q(1, 0, 1, U, '#a07850');
      Q(0, 5, 4, 5, '#5c4028'); Q(0, 5, 4, 1, snowy ? '#f4f8fc' : '#b08658'); Q(3, 6, 1, 4, '#2c1c10');
      if (snowy) Q(0, 0, 1, U, '#e8eef6');
    }
    if (side.b) {
      Q(U - 3, 0, 3, U, '#4a3220'); Q(U - 2, 0, 1, U, '#a07850');
      Q(U - 4, 5, 4, 5, '#5c4028'); Q(U - 4, 5, 4, 1, snowy ? '#f4f8fc' : '#b08658'); Q(U - 4, 6, 1, 4, '#2c1c10');
      if (snowy) Q(U - 1, 0, 1, U, '#e8eef6');
    }
    if (side.s) { Q(0, 0, U, 2, '#5c4028'); Q(0, 0, U, 1, snowy ? '#f4f8fc' : '#b08658'); }
    if (side.f) { Q(0, U - 2, U, 2, '#2c1c10'); }
  }

  function groundTile(P, T, th, kind, e) {
    const v = e.v, r = i => hash(e.x * 11 + i, e.y * 13 + i * 5, 23);
    const pal = kind === 'floor2' ? T.fl2 : kind === 'floor3' ? T.fl3 : T.fl;
    const [b, hi, dk] = pal;
    P(0, 0, U, U, b);
    switch (th) {
      case 'station': case 'station2':
        if (kind === 'floor2') {
          P(0, 0, U, U, dk);
          for (let i = 1; i < U; i += 3) P(1, i, U - 2, 2, b);
          P(0, 0, U, 1, hi); P(0, 0, 1, U, hi);
          if (th === 'station2') for (let i = 0; i < U; i += 4) { P.tri([i, U, i + 2, U, i + 4, U - 3, i + 2, U - 3], '#d8a020'); }
        } else {
          P(0, 0, U, 1, hi); P(0, 0, 1, U, hi); P(0, U - 1, U, 1, dk); P(U - 1, 0, 1, U, dk);
          P.dot(2, 2, pal[3] || dk); P.dot(13, 2, pal[3] || dk); P.dot(2, 13, pal[3] || dk); P.dot(13, 13, pal[3] || dk);
          if (r(1) > 0.82) for (let i = 0; i < 4; i++) P(5, 5 + i * 2, 6, 1, dk);
          else if (r(2) > 0.86) { P(4, 7, 8, 2, dk); P(4, 7, 8, 1, hi); }
          if (th === 'station2' && r(3) > 0.9) P.dither(3, 3, 10, 10, '#4e473c', 0);
        }
        break;
      case 'express':
        P(0, 0, U, U, b);
        P.dither(0, 0, U, U, dk, 1);
        P(0, 0, U, U, b);
        P.tri([8, 3, 13, 8, 8, 13, 3, 8], hi);
        P.tri([8, 5, 11, 8, 8, 11, 5, 8], b);
        P.dot(8, 8, T.fl[3]); P.dot(0, 0, T.fl[3]); P.dot(15, 15, T.fl[3]); P.dot(0, 15, T.fl[3]); P.dot(15, 0, T.fl[3]);
        break;
      case 'snow': case 'hill':
        if (kind === 'floor3') { P(0, 0, U, U, b); P(2 + v, 4, 7, 1, hi); P(8, 10 - v, 6, 1, hi); P(5, 6 + v, 1, 5, dk); break; }
        P.dither(0, 0, U, U, pal[2], v);
        P(0, 0, U, U, b);
        for (let i = 0; i < 3; i++) P(Math.floor(r(i) * 13), Math.floor(r(i + 3) * 14), 3, 1, pal[2]);
        if (r(7) > 0.55) P.dot(Math.floor(r(8) * 15), Math.floor(r(9) * 15), '#ffffff');
        if (r(10) > 0.82) { const x = Math.floor(r(11) * 12) + 1, y = Math.floor(r(12) * 11) + 3; P(x, y, 3, 2, '#8a96a8'); P(x, y, 3, 1, '#b4bccc'); }
        if (th === 'snow' && r(13) > 0.88) { const x = Math.floor(r(14) * 12) + 2, y = Math.floor(r(15) * 10) + 4; P(x, y, 1, 3, '#6a8a58'); P(x + 2, y + 1, 1, 2, '#6a8a58'); P(x - 1, y + 1, 1, 2, '#7a9a66'); }
        if (kind === 'floor2') { P(3, 2 + (v % 3) * 4, 2, 2, pal[2]); P(9, 5 + (v % 3) * 3, 2, 2, pal[2]); }
        break;
      case 'city':
        P(0, 0, U, U, b);
        P(0, 7, U, 1, pal[2]); P(7, 0, 1, 7, pal[2]); P(11, 8, 1, 8, pal[2]);
        if (r(1) > 0.7) P(Math.floor(r(2) * 10) + 2, Math.floor(r(3) * 10) + 2, 4, 2, hi);
        if (r(4) > 0.85) P.dot(Math.floor(r(5) * 15), Math.floor(r(6) * 15), '#ffffff');
        break;
      case 'under':
        P.dither(0, 0, U, U, dk, v);
        P(0, 0, U, U, b);
        for (let i = 0; i < 4; i++) P.dot(Math.floor(r(i) * 15), Math.floor(r(i + 4) * 15), i % 2 ? dk : hi);
        if (r(9) > 0.8) { const x = Math.floor(r(10) * 10) + 2, y = Math.floor(r(11) * 10) + 3; P(x, y, 4, 2, '#2a2018'); P(x + 1, y, 2, 1, '#3a2c22'); }
        if (kind === 'floor2') { P(0, 0, U, U, pal[0]); for (let i = 1; i < U; i += 3) P(1, i, U - 2, 1, pal[2]); }
        break;
      case 'mine':
        P(0, 0, U, U, b);
        for (let i = 0; i < 6; i++) P.dot(Math.floor(r(i) * 15), Math.floor(r(i + 6) * 15), i % 3 ? dk : hi);
        if (r(12) > 0.75) { const x = Math.floor(r(13) * 10) + 3, y = Math.floor(r(14) * 10) + 3; P(x, y, 3, 2, pal[3] || dk); P(x, y, 2, 1, hi); }
        if (r(15) > 0.92) { const x = Math.floor(r(16) * 12) + 2, y = Math.floor(r(17) * 10) + 4; P(x, y, 1, 2, T.accent); P(x + 1, y + 1, 1, 1, T.light); }
        break;
      case 'rivet':
        P(0, 0, U, U, b);
        P(0, 0, U, 1, hi); P(0, 0, 1, U, hi); P(0, U - 1, U, 1, dk); P(U - 1, 0, 1, U, dk);
        if (r(1) > 0.5) { const x = Math.floor(r(2) * 8) + 2; P(x, 3, 1, 4, dk); P(x + 1, 6, 1, 3, dk); P(x + 2, 8, 1, 3, dk); }
        if (r(3) > 0.55) { const x = Math.floor(r(4) * 8) + 1, y = Math.floor(r(5) * 8) + 2; P(x, y, 6, 3, '#e2e8ee'); P(x + 1, y + 3, 4, 1, '#e2e8ee'); P(x, y, 6, 1, '#f6f9fc'); }
        break;
      case 'sim':
        if (kind === 'floor2') {
          P(0, 0, U, U, pal[2]);
          P.tri([8, 1, 15, 8, 8, 15, 1, 8], b); P.tri([8, 4, 12, 8, 8, 12, 4, 8], pal[1]); P(7, 7, 2, 2, '#e8d0ff');
        } else {
          P(0, 0, U, U, b);
          P(0, 0, U, 1, '#2e3a7a'); P(0, 0, 1, U, '#2e3a7a');
          if ((e.x + e.y * 3) % 5 === 0) P(0, 0, 2, 1, pal[3]);
          if (r(1) > 0.86) P(4 + Math.floor(r(2) * 6), 4 + Math.floor(r(3) * 6), 3, 1, '#3a4890');
        }
        break;
      case 'office':
        if (kind === 'floor2') {
          P(0, 0, U, U, b);
          P.dither(0, 0, U, U, pal[2], v);
          P(0, 0, U, U, b);
          P.tri([8, 3, 13, 8, 8, 13, 3, 8], pal[1]); P.tri([8, 5, 11, 8, 8, 11, 5, 8], b); P.dot(8, 8, '#d8a850');
          if (!e.same.u) { P(0, 0, U, 2, '#c8a050'); P(0, 2, U, 1, pal[2]); }
          if (!e.same.d) { P(0, U - 3, U, 1, pal[2]); P(0, U - 2, U, 2, '#c8a050'); }
          if (!e.same.l) { P(0, 0, 2, U, '#c8a050'); P(2, 0, 1, U, pal[2]); }
          if (!e.same.r) { P(U - 3, 0, 1, U, pal[2]); P(U - 2, 0, 2, U, '#c8a050'); }
        } else if (kind === 'floor3') {
          for (let i = 0; i < 4; i++) { P(0, i * 4, U, 4, i % 2 ? b : hi); P(0, i * 4 + 3, U, 1, dk); P(((v + i) * 5) % 13, i * 4, 1, 3, dk); }
        } else {
          P(0, 0, U, U, b);
          P(0, 0, U, 1, hi); P(0, 0, 1, U, hi); P(0, U - 1, U, 1, dk); P(U - 1, 0, 1, U, dk);
          if ((e.x + e.y) % 2 === 0) P.tri([2, 13, 13, 2, 15, 2, 4, 13], 'rgba(255,255,255,0.06)');
          P(0, 0, 2, 2, pal[3]); P(1, 1, 1, 1, '#f4dc90');
        }
        break;
      case 'ice':
        P(0, 0, U, U, b);
        P(0, 0, U, 1, hi);
        if (r(1) > 0.72) { const x = Math.floor(r(2) * 10) + 2, y = Math.floor(r(3) * 8) + 2; P(x, y, 1, 3, T.fl[3]); P(x + 1, y + 3, 1, 2, T.fl[3]); P(x + 2, y + 5, 2, 1, T.fl[3]); P(x - 1, y + 1, 1, 1, T.fl[3]); }
        if (r(4) > 0.8) P(Math.floor(r(5) * 10) + 1, Math.floor(r(6) * 12) + 2, 5, 1, hi);
        if (r(9) > 0.5) P.dot(Math.floor(r(7) * 15), Math.floor(r(8) * 15), dk);
        break;
      default:
        P.dither(0, 0, U, U, dk, v);
    }
  }

  function wallTile(P, T, th, kind, e) {
    const nb = e.nb, face = !nb.d, v = e.v, r = i => hash(e.x * 7 + i, e.y * 3 + i * 11, 31);
    if (HOUSE.has(kind)) return houseTile(P, T, th, kind, e);
    if (kind === 'gate') return gateTile(P, T, th, e);
    const [tb, tl, trim] = T.top;
    const [fb, fh, fd, fbase] = T.face;
    const topH = face ? 6 : U;
    P(0, 0, U, topH, tb);
    const snowy = th === 'snow' || th === 'hill' || th === 'city' || th === 'rivet';
    if (kind === 'rock' && (snowy || th === 'ice')) {
      const rk = th === 'ice' ? ['#5a80a8', '#8cb0d4', '#34587e'] : ['#7c8698', '#a4aebe', '#545e70'];
      P(0, 0, U, topH, rk[2]);
      for (let i = 0; i < 3; i++) {
        const bx = [0, 8, 3][i] + ((v + i) % 3), by = Math.min(topH - 3, [1, 3, 8][i] + (v % 2));
        if (by < 0) continue;
        P(bx, by, 6, 4, rk[0]); P(bx, by, 6, 1, rk[1]); P(bx + 5, by + 1, 1, 3, rk[2]);
        P(bx + 1, by - 1 < 0 ? 0 : by - 1, 4, 2, '#f4f8fc');
      }
    } else if (snowy) {
      P(0, 0, U, topH, th === 'city' ? tb : '#e2eaf4');
      P.dither(0, 0, U, topH, tl, v);
      for (let i = 0; i < 2; i++) { const x = Math.floor(r(i) * 12), y = Math.floor(r(i + 3) * Math.max(1, topH - 2)); P(x, y, 4, 1, '#c4d0e0'); P(x + 1, y + 1, 2, 1, '#c4d0e0'); }
      if (th !== 'city' && r(9) > 0.6) { const x = Math.floor(r(10) * 10) + 2, y = Math.max(0, Math.floor(r(11) * (topH - 3))); P(x, y + 1, 4, 2, '#7c8698'); P(x, y + 1, 4, 1, '#a4aebe'); P(x + 1, y, 2, 1, '#f4f8fc'); }
    } else if (th === 'ice') {
      P(0, 0, U, topH, tb);
      P.tri([0, 0, 9, 0, 3, Math.min(topH, 9)], tl);
      P.tri([16, 2, 16, Math.min(topH, 12), 9, Math.min(topH, 7)], trim);
      if (topH > 10) P.tri([4, 16, 12, 9, 13, 16], tl);
    } else if (kind === 'rock' || th === 'mine' || th === 'under') {
      for (let i = 0; i < 4; i++) { const x = Math.floor(r(i) * 12), y = Math.floor(r(i + 4) * Math.max(1, topH - 2)); P(x, y, 4, 2, tl); P(x, y + 2, 4, 1, e.T.bg); }
    } else {
      P(0, 7 < topH ? 7 : topH, U, 1, tl);
      if (topH > 8) P(7, 0, 1, topH, tl);
    }
    const rim = snowy ? '#8a9ab2' : trim;
    if (!nb.u) P(0, 0, U, 1, rim);
    if (!nb.l) { P(0, 0, 1, topH, rim); if (snowy) P(1, 0, 1, topH, '#c4d0e0'); }
    if (!nb.r) { P(U - 1, 0, 1, topH, snowy ? rim : fd); if (snowy) P(U - 2, 0, 1, topH, '#c4d0e0'); }
    if (!face) { if (!nb.dl && nb.l && !nb.d) P(0, U - 1, 1, 1, fd); return; }
    P(0, 6, U, 1, fbase);
    P(0, 7, U, 9, fb);
    switch (th) {
      case 'station': case 'station2':
        P(0, 7, U, 1, fh);
        P(0, 9, U, 1, T.accent); P(0, 10, U, 1, T.accentDk);
        P(0, 14, U, 2, fd); P(0, 15, U, 1, fbase);
        P((e.x % 2) ? 0 : 15, 11, 1, 3, fd);
        if (v === 1) { P(4, 11, 3, 2, fd); P(9, 11, 3, 2, fd); }
        break;
      case 'express':
        P(0, 7, U, 1, T.accent);
        P(0, 8, U, 7, fb);
        P(2, 9, 12, 5, fh); P(3, 10, 10, 3, fb);
        P(0, 15, U, 1, fbase);
        break;
      case 'office':
        P(0, 7, U, 1, fh);
        P((e.x % 2) ? 3 : 11, 8, 1, 3, fd);
        P(0, 11, U, 1, '#d8b060'); P(0, 12, U, 1, '#7a5a30');
        P(0, 12, U, 3, fbase); P(2, 13, 12, 1, '#6a4a68'); P(0, 15, U, 1, '#2a1828');
        break;
      case 'under':
        for (let i = 0; i < 3; i++) { const x = Math.floor(r(i + 8) * 12), y = 8 + Math.floor(r(i + 9) * 5); P(x, y, 4, 2, fh); P(x, y + 2, 4, 1, fd); }
        if (v === 2) { P(3, 8, 1, 7, fbase); P(3, 8, 1, 1, '#c8783a'); }
        P(0, 15, U, 1, fd);
        break;
      default: {
        for (let i = 0; i < 4; i++) { const x = Math.floor(r(i + 12) * 12), y = 8 + Math.floor(r(i + 13) * 5); P(x, y, 4 + (i % 2), 2, fh); P(x, y + 2, 4 + (i % 2), 1, fd); }
        P(0, 15, U, 1, fd);
        if (snowy) { P(0, 6, U, 1, '#ffffff'); for (let i = 0; i < U; i += 5) P(i + (v % 3), 7, 2, 1 + ((i + v) % 2), '#f2f6fb'); }
        if (th === 'mine' && r(20) > 0.6) { const x = Math.floor(r(21) * 10) + 3; P(x, 9, 1, 3, T.accent); P(x + 1, 11, 1, 2, T.accent); P(x, 9, 1, 1, T.light); }
        if (th === 'ice') { P(0, 7, U, 1, T.face[1]); if (r(22) > 0.5) P(Math.floor(r(23) * 12) + 2, 9, 1, 4, T.accent); }
        if (th === 'rivet' && r(24) > 0.5) { const x = Math.floor(r(25) * 10) + 2; P(x, 9, 3, 5, T.face[3]); P(x + 1, 13, 1, 2, T.face[3]); }
      }
    }
  }

  function expressWindow(P, T, e) {
    const r = i => hash(e.x * 5 + i, e.y * 3 + i, 77);
    P(0, 0, U, U, T.face[0]);
    P(0, 0, U, 1, T.accent);
    P(1, 2, 14, 12, T.accent); P(2, 3, 12, 10, '#060816');
    for (let i = 0; i < 5; i++) P.dot(2 + Math.floor(r(i) * 12), 3 + Math.floor(r(i + 5) * 10), i % 2 ? '#ffffff' : '#9ab0ff');
    if (r(11) > 0.7) P(2, 7, 12, 1, 'rgba(160,200,255,0.35)');
    P(7, 3, 2, 10, T.accent); P(7, 3, 1, 10, T.light);
    P(0, 14, U, 2, T.face[3]); P(0, 14, U, 1, T.accentDk);
  }

  function houseTile(P, T, th, kind, e) {
    if (th === 'express' && kind === 'window') return expressWindow(P, T, e);
    const nb = e.nb, facade = !nb.d || kind !== 'house';
    const brick = T.brick || T.face, roof = T.roof || T.top;
    if (!facade) {
      const [rb, rl, rd] = roof;
      P(0, 0, U, U, rb);
      for (let i = 0; i < 4; i++) { P(0, i * 4 + 3, U, 1, rd); for (let j = (i % 2) * 3; j < U; j += 6) P(j, i * 4, 1, 3, rd); }
      if (th === 'city' || th === 'rivet') {
        P(0, 0, U, 5, '#eef3f8'); P(0, 5, U, 1, '#c8d2e0');
        for (let i = 0; i < U; i += 4) P(i + ((e.x + e.y) % 3), 5, 2, 1 + (i % 2), '#eef3f8');
        if (!nb.u) P(0, 0, U, 1, '#ffffff');
      } else if (!nb.u) P(0, 0, U, 1, rl);
      if (!nb.l) P(0, 0, 1, U, rl);
      if (!nb.r) P(U - 1, 0, 1, U, rd);
      return;
    }
    const [bb, bh, bd, bm] = brick;
    P(0, 0, U, U, bb);
    if (th === 'under') {
      for (let i = 0; i < U; i += 3) { P(i, 0, 1, U, bd); P(i + 1, 0, 1, U, bh); }
      P(0, 0, U, 2, roof[2]);
    } else {
      for (let row = 0; row < 5; row++) { P(0, row * 3 + 2, U, 1, bm); for (let j = (row % 2) * 4; j < U; j += 8) P(j, row * 3 - 1, 1, 3, bm); }
      P(0, 0, U, 2, bd);
    }
    P(0, U - 1, U, 1, bm);
    if (kind === 'window') {
      const lit = th !== 'rivet';
      P(3, 4, 10, 9, '#3a2a20');
      P(4, 5, 8, 7, lit ? '#ffe39a' : '#1c1a20');
      if (lit) { P(4, 5, 8, 2, '#fff4c8'); P(7, 5, 2, 7, '#3a2a20'); P(4, 8, 8, 1, '#3a2a20'); }
      else { P.tri([4, 12, 7, 7, 9, 12], '#6a7480'); P.tri([8, 5, 12, 5, 11, 9], '#5a646e'); }
      P(2, 13, 12, 1, '#c8c0b0');
    }
    if (kind === 'housedoor') {
      P(4, 3, 8, 13, '#3a2014'); P(5, 4, 6, 12, '#6a3a20'); P(5, 4, 6, 1, '#8a5030');
      P(8, 5, 1, 11, '#4a2818'); P(9, 10, 1, 1, '#e0c060');
      P(3, 15, 10, 1, '#8a8478');
    }
  }

  function gateTile(P, T, th, e) {
    const nb = e.nb;
    P(0, 0, U, U, '#2a2e38');
    P(0, 0, U, 2, '#c8a040'); P(0, 13, U, 2, '#c8a040'); P(0, 2, U, 1, '#7a6020');
    for (let i = 1; i < U; i += 4) { P(i, 2, 2, 11, '#8a94a8'); P(i, 2, 1, 11, '#b8c2d4'); P(i, 1, 2, 1, '#e8d070'); }
    P(0, 7, U, 1, '#5a6272');
    if (!nb.l) P(0, 0, 1, U, '#6a5020');
    if (!nb.r) P(U - 1, 0, 1, U, '#6a5020');
    P(0, 15, U, 1, '#14161c');
  }

  function shadowTile(P, e) {
    const s = 'rgba(8,10,24,0.28)';
    if (e.nb.u) { P(0, 0, U, 2, s); P(0, 2, U, 1, 'rgba(8,10,24,0.14)'); }
    if (e.nb.l) { P(0, 0, 2, U, s); P(2, 0, 1, U, 'rgba(8,10,24,0.12)'); }
    if (e.nb.ul && !e.nb.u && !e.nb.l) P(0, 0, 2, 2, s);
  }

  function propTile(P, T, th, kind, e) {
    const v = e.v, r = i => hash(e.x * 5 + i, e.y * 9 + i * 3, 41);
    const shadow = (x, y, rx, ry) => P.ell(x, y, rx, ry, 'rgba(8,10,24,0.3)');
    switch (kind) {
      case 'tree': {
        if (th === 'under') { shadow(8, 14, 5, 2); P(5, -4, 6, 18, '#6a5a4a'); P(6, -4, 2, 18, '#8a7a66'); P(4, -5, 8, 2, '#4a3e32'); P(4, 12, 8, 2, '#4a3e32'); P(7, 2, 2, 2, '#ffb060'); return; }
        if (th === 'rivet') { shadow(8, 14, 5, 2); P(7, 2, 2, 12, '#5a4a40'); P(4, 4, 3, 1, '#5a4a40'); P(3, 3, 1, 1, '#5a4a40'); P(9, 6, 3, 1, '#5a4a40'); P(12, 5, 1, 1, '#5a4a40'); P(6, 0, 1, 2, '#5a4a40'); P(4, 4, 3, 1, '#e8eef4'); P(9, 6, 3, 1, '#e8eef4'); return; }
        if (th === 'station' || th === 'station2' || th === 'express' || th === 'mine' || th === 'ice') { shadow(8, 14, 5, 2); P(4, 2, 8, 12, '#4a5060'); P(5, 3, 6, 10, '#8a94a8'); P(4, 1, 8, 2, '#2a3040'); P(4, 13, 8, 2, '#2a3040'); return; }
        shadow(8, 14, 6, 2);
        P(7, 10, 2, 5, '#5a3a24');
        P.tri([8, -6, 15, 6, 1, 6], '#1e4a3c');
        P.tri([8, -2, 16, 11, 0, 11], '#24584a');
        P.tri([8, -6, 12, 0, 4, 0], '#f4f8fc');
        P.tri([8, -2, 11, 3, 5, 3], '#e8f0f8');
        P(1, 10, 14, 1, '#e8f0f8'); P(3, 5, 10, 1, '#f4f8fc');
        P(8, -2, 1, 12, '#163a2e');
        return;
      }
      case 'crate': {
        const metal = th === 'station' || th === 'station2';
        shadow(8, 15, 7, 2);
        const [b, hi, dk] = metal ? (th === 'station' ? ['#5a6474', '#7c889c', '#3c4452'] : ['#6a6250', '#86806a', '#4a4436']) : ['#7a5a34', '#9a7446', '#5a3e20'];
        P(1, 2, 14, 13, dk); P(2, 3, 12, 11, b); P(2, 3, 12, 1, hi); P(2, 3, 1, 11, hi);
        if (metal) { P(2, 7, 12, 2, dk); P(6, 10, 4, 3, T.accent); P(6, 10, 4, 1, T.light); if (th === 'station2') for (let i = 0; i < 12; i += 3) P(2 + i, 13, 2, 1, '#d8a020'); }
        else { P(2, 8, 12, 1, dk); P(3, 3, 1, 11, dk); P(12, 3, 1, 11, dk); P.tri([3, 4, 5, 4, 13, 12, 11, 12], dk); }
        if (e.nb2.u === 'crate') P(1, 0, 14, 3, dk);
        return;
      }
      case 'pipe': {
        const horiz = e.same.l || e.same.r, vert = e.same.u || e.same.d;
        const [pb, ph, pd] = th === 'under' ? ['#7a5a3a', '#a07a4e', '#4a3420'] : th === 'rivet' ? ['#6a6e78', '#9ca2ac', '#40444c'] : ['#5a6272', '#8a94a8', '#3a4050'];
        const rust = () => { if (th === 'rivet' && (e.x + e.y) % 2 === 0) { P(6, 5, 3, 2, '#9a5a30'); P(9, 9, 2, 2, '#b8683a'); } };
        if (horiz && !vert) { P(0, 4, U, 9, pd); P(0, 5, U, 6, pb); P(0, 6, U, 2, ph); if ((e.x % 3) === 0) { P(6, 3, 4, 11, pd); P(7, 3, 2, 11, ph); } if (th === 'station' && e.x % 4 === 1) { P(7, 7, 2, 2, T.accent); } rust(); return; }
        if (vert && !horiz) { P(4, 0, 9, U, pd); P(5, 0, 6, U, pb); P(6, 0, 2, U, ph); if ((e.y % 3) === 0) { P(3, 6, 11, 4, pd); P(3, 7, 11, 2, ph); } rust(); return; }
        shadow(8, 14, 7, 2);
        P(1, 2, 14, 12, pd); P(2, 3, 12, 10, pb); P(2, 3, 12, 2, ph);
        P(5, 6, 6, 6, pd); P(6, 7, 4, 4, th === 'under' ? '#ff9a40' : T.accent); P(6, 7, 2, 2, T.light);
        return;
      }
      case 'console': {
        const lft = e.same.l, rgt = e.same.r, up = e.same.u;
        P(0, 0, U, U, '#1a1e2a');
        if (!up) { P(0, 0, U, 2, '#3a4258'); }
        P(lft ? 0 : 1, 2, U - (lft ? 0 : 1) - (rgt ? 0 : 1), 8, '#0a1420');
        P(lft ? 0 : 2, 3, U - (lft ? 0 : 2) - (rgt ? 0 : 2), 6, G.dark(T.accent, 0.55));
        for (let i = 0; i < 3; i++) P(lft ? 1 : 3, 4 + i * 2, 3 + Math.floor(r(i) * 8), 1, T.accent);
        P(0, 11, U, 5, '#2e3446'); P(0, 11, U, 1, '#4a5470');
        for (let i = 0; i < 4; i++) P(1 + i * 4, 13, 2, 1, i % 2 ? '#ff5050' : '#50ff80');
        if (!lft) P(0, 2, 1, 14, '#0a0c14');
        if (!rgt) P(U - 1, 2, 1, 14, '#0a0c14');
        return;
      }
      case 'lamp': {
        shadow(8, 15, 4, 1.5);
        P(7, -2, 2, 16, '#2a2a34'); P(7, -2, 1, 16, '#4a4a58');
        P(5, 13, 6, 2, '#2a2a34');
        P(4, -6, 8, 5, '#1e1e26'); P(5, -5, 6, 3, T.light); P(6, -5, 2, 1, '#ffffff');
        P(3, -7, 10, 1, '#2a2a34');
        return;
      }
      case 'fence': {
        const horiz = e.same.l || e.same.r || !(e.same.u || e.same.d);
        if (horiz) {
          P(0, 6, U, 2, '#3a3e48'); P(0, 11, U, 2, '#3a3e48'); P(0, 6, U, 1, '#6a7080');
          for (let i = 1; i < U; i += 5) { P(i, 3, 2, 12, '#4a4e5a'); P(i, 3, 1, 12, '#7a8090'); P(i, 2, 2, 1, '#e8c860'); }
          P(0, 15, U, 1, 'rgba(8,10,24,0.3)');
        } else {
          P(6, 0, 2, U, '#3a3e48'); P(6, 0, 1, U, '#6a7080');
          for (let i = 2; i < U; i += 5) { P(4, i, 6, 2, '#4a4e5a'); P(5, i - 1, 2, 1, '#e8c860'); }
        }
        return;
      }
      case 'statue': {
        const top = e.same.d, left = e.same.r;
        if (!top) {
          P(0, 4, U, 12, '#6e707c'); P(0, 4, U, 2, '#9ea2b0'); P(0, 14, U, 2, '#4a4c56');
          P(left ? 2 : 0, 8, 14, 1, '#5a5c68');
          if (left) P(4, 9, 12, 3, '#c8a040'); else P(0, 9, 12, 3, '#c8a040');
          return;
        }
        if (left) { P(8, 2, 8, 14, '#b4bac8'); P(10, 0, 6, 4, '#c8ced8'); P(12, -4, 4, 5, '#d4dae4'); P(6, 8, 4, 8, '#9aa0b0'); P(9, 3, 2, 12, '#e4e8f0'); }
        else { P(0, 2, 8, 14, '#9aa0b0'); P(0, 0, 6, 4, '#aab0bc'); P(0, -4, 4, 5, '#b8becc'); P(6, 6, 4, 8, '#8a90a0'); P(0, -6, 2, 3, '#c8a040'); }
        return;
      }
      case 'table': {
        if (th === 'express') {
          const up = e.same.u, dn = e.same.d;
          P(1, up ? 0 : 2, 14, (dn ? U : 14) - (up ? 0 : 2), '#6a1a1c');
          P(2, up ? 0 : 3, 12, (dn ? U : 13) - (up ? 0 : 3), '#9a2a2c');
          P(3, up ? 0 : 4, 3, (dn ? U : 11) - (up ? 0 : 4), '#b83a3a');
          if (!up) { P(1, 2, 14, 1, T.accent); }
          if (!dn) { P(1, 14, 14, 2, '#4a1012'); P(2, 15, 12, 1, T.accent); }
          if (!up) { P(9, 4, 4, 4, '#f0e8d8'); P(10, 1, 2, 3, '#e8c060'); P(10, 0, 2, 1, '#fff0c0'); }
          return;
        }
        shadow(8, 14, 7, 2);
        P(1, 4, 14, 7, '#6a4a30'); P(1, 4, 14, 2, '#8a6a48'); P(2, 11, 2, 4, '#4a3020'); P(12, 11, 2, 4, '#4a3020');
        return;
      }
      case 'shelf': {
        const books = ['#8a3040', '#3a5a8a', '#c8a050', '#4a7a4a', '#6a4a8a', '#d8d0c0', '#5a3a2a'];
        if (!e.same.u) { P(0, -4, U, 4, '#2a1810'); P(0, -4, U, 1, '#7a5a3a'); }
        P(0, 0, U, U, '#3a2416'); P(1, 0, 14, U, '#5a3a24');
        for (const sy of [0, 8]) {
          let x = 2;
          while (x < 14) { const w = 1 + Math.floor(r(x + sy) * 2), hgt = 5 + Math.floor(r(x * 3 + sy) * 2); P(x, sy + 7 - hgt, Math.min(w, 14 - x), hgt, books[Math.floor(r(x * 7 + sy) * books.length)]); x += w + (r(x + 11) > 0.8 ? 1 : 0); }
          P(1, sy + 7, 14, 1, '#2a1810');
        }
        if (!e.same.d) { P(0, U - 2, U, 2, '#2a1810'); shadow(8, 16, 7, 1.5); }
        return;
      }
      case 'crystal': {
        const col = th === 'station' || th === 'station2' ? ['#b050ff', '#e0a8ff', '#6a20a8'] : th === 'mine' ? ['#50d0f0', '#c0f4ff', '#1a6a90'] : ['#80c8f0', '#e0f8ff', '#3a78a8'];
        shadow(8, 14, 6, 2);
        const tall = 6 + Math.floor(r(1) * 5);
        P.tri([3, 15, 5, 15 - tall + 3, 8, 15], col[2]);
        P.tri([6, 15, 9, 15 - tall - 3, 12, 15], col[0]);
        P.tri([10, 15, 13, 15 - tall + 4, 15, 15], col[2]);
        P.tri([9, 15 - tall - 3, 10, 15 - tall, 10, 15, 9, 15], col[1]);
        P.tri([6, 15, 9, 15 - tall - 3, 8, 15], G.light(col[0], 0.25));
        return;
      }
      default: return;
    }
  }

  function buildLayer(map) {
    const cv = G.mkCanvas(map.w * U, map.h * U), g = cv.getContext('2d');
    const th = map.def.theme, T = THEMES[th] || THEMES.station;
    const baseFloor = (H.TILES[map.def.floor] || { kind: 'floor' }).kind;
    const anims = [];
    const wallish = (x, y) => WALLISH.has(kindAt(map, x, y));
    const env = (x, y, kind) => {
      const k = (dx, dy) => kindAt(map, x + dx, y + dy);
      return {
        x, y, T, v: Math.floor(hash(x, y, 3) * 4),
        nb: { u: wallish(x, y - 1), d: wallish(x, y + 1), l: wallish(x - 1, y), r: wallish(x + 1, y), ul: wallish(x - 1, y - 1), dl: wallish(x - 1, y + 1) },
        same: { u: k(0, -1) === kind, d: k(0, 1) === kind, l: k(-1, 0) === kind, r: k(1, 0) === kind },
        nb2: { u: k(0, -1), d: k(0, 1), l: k(-1, 0), r: k(1, 0) },
        edge: { u: k(0, -1) !== kind && !WALLISH.has(k(0, -1)), d: k(0, 1) !== kind && !WALLISH.has(k(0, 1)) },
        bridgeV: k(0, -1) !== 'chasm' && k(0, 1) !== 'chasm',
        railV: (k(0, -1) === 'rail' || k(0, 1) === 'rail') && !(k(-1, 0) === 'rail' || k(1, 0) === 'rail')
      };
    };
    const PROPS = new Set(['tree', 'crate', 'pipe', 'console', 'lamp', 'fence', 'statue', 'table', 'crystal', 'shelf']);
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      const kind = kindAt(map, x, y), e = env(x, y, kind), P = painter(g, x * U, y * U);
      if (WALLISH.has(kind)) wallTile(P, T, th, kind, e);
      else {
        floorTile(P, T, th, PROPS.has(kind) ? baseFloor : kind, e);
        if (kind !== 'chasm') shadowTile(P, e);
      }
      if (ANIM.has(kind)) anims.push({ x, y, kind });
    }
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      const kind = kindAt(map, x, y);
      if (!PROPS.has(kind)) continue;
      propTile(painter(g, x * U, y * U), T, th, kind, env(x, y, kind));
    }
    return { cv, anims, th };
  }

  function layerOf(map) {
    let L = layers.get(map.id);
    if (!L || L.map !== map) { L = map.def.zone && H.Station ? H.Station.buildLayer(map) : map.def.car && H.Train ? H.Train.buildLayer(map) : buildLayer(map); L.map = map; layers.set(map.id, L); }
    return L;
  }

  function drawMap(ctx, map, cx, cy, t, vw, vh) {
    const L = layerOf(map), T = THEMES[L.th] || THEMES.station;
    const w = vw || 640, h = vh || 480;
    ctx.fillStyle = T.bg; ctx.fillRect(0, 0, w, h);
    const was = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    const sx = Math.floor(cx / 2), sy = Math.floor(cy / 2);
    const sw = Math.min(L.cv.width - Math.max(0, sx), Math.ceil(w / 2) + 1), sh = Math.min(L.cv.height - Math.max(0, sy), Math.ceil(h / 2) + 1);
    const dx = Math.max(0, -sx) * 2, dy = Math.max(0, -sy) * 2;
    if (sw > 0 && sh > 0) ctx.drawImage(L.cv, Math.max(0, sx), Math.max(0, sy), sw, sh, dx - (cx - sx * 2), dy - (cy - sy * 2), sw * 2, sh * 2);
    ctx.imageSmoothingEnabled = was;
    if (L.deco) H.Train.drawWindows(ctx, L, map, cx, cy, t, w, h);
    for (const a of L.anims) {
      const px = a.x * 32 - cx, py = a.y * 32 - cy;
      if (px < -48 || py < -64 || px > w + 16 || py > h + 16) continue;
      animCell(ctx, L.th, T, a, px, py, t);
    }
  }

  function animCell(ctx, th, T, a, px, py, t) {
    const ph = hash(a.x, a.y, 9) * 6.28;
    switch (a.kind) {
      case 'chasm': {
        if (th === 'snow' || th === 'ice' || th === 'hill') {
          const k = (t * 0.6 + ph) % 1;
          ctx.fillStyle = 'rgba(232,246,255,' + (0.5 * Math.sin(k * Math.PI)) + ')';
          ctx.fillRect(px + 4 + Math.floor(k * 16), py + 12 + Math.floor(hash(a.x, a.y, 2) * 10), 8, 2);
        } else if (Math.sin(t * 2 + ph) > 0.7) { ctx.fillStyle = '#c8d0f0'; ctx.fillRect(px + Math.floor(hash(a.x, a.y, 4) * 28), py + Math.floor(hash(a.y, a.x, 5) * 28), 2, 2); }
        break;
      }
      case 'lamp': {
        const k = 0.75 + 0.25 * Math.sin(t * 3 + ph);
        const gr = ctx.createRadialGradient(px + 16, py - 7, 1, px + 16, py - 7, 30);
        gr.addColorStop(0, 'rgba(255,230,160,' + (0.55 * k) + ')'); gr.addColorStop(1, 'rgba(255,200,120,0)');
        ctx.fillStyle = gr; ctx.fillRect(px - 14, py - 37, 60, 60);
        break;
      }
      case 'console':
        if (Math.sin(t * 5 + ph) > 0.3) { ctx.fillStyle = T.light; ctx.fillRect(px + 6 + Math.floor(hash(a.x, a.y, 7) * 16), py + 10, 4, 2); }
        break;
      case 'crystal': {
        const k = 0.5 + 0.5 * Math.sin(t * 2 + ph);
        const col = th === 'station' || th === 'station2' ? '200,120,255' : '140,230,255';
        const gr = ctx.createRadialGradient(px + 18, py + 16, 1, px + 18, py + 16, 22);
        gr.addColorStop(0, 'rgba(' + col + ',' + (0.35 * k) + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = gr; ctx.fillRect(px - 4, py - 6, 44, 44);
        if (k > 0.85) { ctx.fillStyle = '#ffffff'; ctx.fillRect(px + 18, py + 2, 2, 2); }
        break;
      }
      case 'window':
        if (th === 'express') { if (Math.sin(t * 1.5 + ph) > 0.6) { ctx.fillStyle = '#ffffff'; ctx.fillRect(px + 8 + Math.floor(hash(a.x, a.y, 3) * 16), py + 10 + Math.floor(hash(a.y, a.x, 4) * 12), 2, 2); } }
        else if (th !== 'rivet') { const k = 0.1 + 0.08 * Math.sin(t * 2 + ph); ctx.fillStyle = 'rgba(255,220,140,' + k + ')'; ctx.fillRect(px + 4, py + 6, 24, 22); }
        break;
    }
  }

  const objects = new Map();
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')'; };

  function objectCanvas(key, w, h, draw) {
    let c = objects.get(key);
    if (c) return c;
    c = G.mkCanvas(w, h);
    draw(painter(c.getContext('2d'), 0, 0));
    objects.set(key, c);
    return c;
  }

  const OBJ = {
    chest(P, open) {
      P.ell(8, 22, 7, 1.6, 'rgba(8,10,24,0.35)');
      const B = open ? '#a8a4a0' : '#ece6da', Bs = open ? '#7c7874' : '#b8ae9c', Au = open ? '#8a8070' : '#d8a840', Aud = open ? '#5a5248' : '#9a6e24';
      P(1, 13, 14, 9, Aud); P(2, 13, 12, 8, B); P(2, 17, 12, 4, Bs);
      P(1, 13, 14, 1, Au); P(1, 21, 14, 1, Au); P(1, 13, 1, 9, Au); P(14, 13, 1, 9, Au); P(7, 13, 2, 9, Au);
      if (open) {
        P(2, 10, 12, 4, '#2a2230'); P(3, 11, 10, 2, '#3e3446');
        P(1, 4, 14, 6, Aud); P(2, 5, 12, 4, B); P(1, 4, 14, 1, Au);
      } else {
        P(1, 8, 14, 6, Aud); P(2, 8, 12, 5, B); P(3, 7, 10, 1, B); P(2, 8, 12, 1, '#ffffff');
        P(1, 12, 14, 1, Au); P(7, 7, 2, 6, Au);
        P(6, 12, 4, 4, '#1a3a5a'); P(7, 13, 2, 2, '#50c8ff'); P.dot(7, 13, '#e0f8ff');
      }
    },
    anchorBase(P) {
      P.ell(8, 22, 7, 1.6, 'rgba(8,10,24,0.35)');
      P(3, 18, 10, 4, '#2e3a58'); P(2, 19, 12, 2, '#3e4c70'); P(4, 17, 8, 1, '#8ab0e0'); P(5, 18, 6, 1, '#4a5a7a');
      P(7, 15, 2, 3, '#4a5a7a');
    },
    anchorGem(P, on) {
      const c = on ? ['#a8f4ff', '#e8feff', '#40a8d8'] : ['#6a84a8', '#a0b4cc', '#3a4a68'];
      P.tri([8, 0, 13, 6, 8, 13, 3, 6], c[2]);
      P.tri([8, 1, 12, 6, 8, 11, 4, 6], c[0]);
      P.tri([8, 1, 8, 11, 4, 6], c[1]);
    },
    destr(P) {
      P.ell(8, 22, 7, 1.6, 'rgba(8,10,24,0.35)');
      P(2, 12, 12, 10, '#2a2436'); P(3, 13, 10, 8, '#4a4060'); P(3, 13, 10, 1, '#6a5e88'); P(3, 17, 10, 1, '#2a2436');
      P(5, 14, 6, 2, '#8a7ab0');
      P.tri([4, 13, 6, 3, 8, 13], '#9a50e0'); P.tri([7, 13, 10, 5, 12, 13], '#c080ff'); P.tri([10, 13, 13, 8, 14, 13], '#7a30c0');
      P.tri([6, 3, 7, 8, 5, 8], '#f0d8ff'); P.tri([10, 5, 11, 9, 9.5, 9], '#f0d8ff');
    },
    lever(P, on) {
      P.ell(8, 22, 6, 1.4, 'rgba(8,10,24,0.35)');
      P(2, 9, 12, 13, '#1e222c'); P(3, 10, 10, 11, '#3a3e4a'); P(3, 10, 10, 1, '#5a6070'); P(5, 18, 6, 2, '#22252c');
      P(4, 12, 8, 2, on ? '#40ff80' : '#ff4040'); P(4, 12, 3, 1, on ? '#c8ffd8' : '#ffc8c8');
      if (on) { P(10, 3, 2, 12, '#b8bcc8'); P(9, 2, 4, 3, '#e8c060'); } else { P(4, 3, 2, 12, '#b8bcc8'); P(3, 2, 4, 3, '#e8c060'); }
      P(7, 14, 2, 3, '#8a8e9a');
    },
    gatePost(P) {
      P(0, 6, 3, 18, '#2a2e38'); P(0, 6, 3, 1, '#8a94a8'); P(1, 9, 1, 12, '#ff5050');
      P(13, 6, 3, 18, '#2a2e38'); P(13, 6, 3, 1, '#8a94a8'); P(14, 9, 1, 12, '#ff5050');
      P.ell(8, 23, 8, 1.4, 'rgba(8,10,24,0.3)');
    },
    suMachine(P) {
      P.ell(40, 50, 38, 6, 'rgba(8,6,20,0.45)');
      P(2, 26, 12, 22, '#2a2240'); P(3, 27, 10, 20, '#4a3e6a'); P(4, 29, 8, 6, '#0c1424'); P(5, 30, 6, 1, '#50e0ff'); P(5, 32, 4, 1, '#c890ff'); P(4, 40, 8, 2, '#8a72c8');
      P(66, 26, 12, 22, '#2a2240'); P(67, 27, 10, 20, '#4a3e6a'); P(68, 29, 8, 6, '#0c1424'); P(69, 31, 6, 1, '#50e0ff'); P(69, 33, 3, 1, '#ffd060'); P(68, 40, 8, 2, '#8a72c8');
      P.ell(40, 24, 27, 23, '#241a3a');
      P.ell(40, 24, 25, 21, '#8a72c8');
      P.ell(40, 24, 22.5, 18.5, '#3a2c5a');
      P.ell(40, 24, 21, 17, '#120a24');
      for (let i = 0; i < 22; i++) P.dot(22 + (i * 37) % 36, 10 + (i * 23) % 28, i % 3 ? '#a8a0d8' : '#ffffff');
      P.ell(48, 20, 5, 5, '#6a9ae0'); P.ell(47, 19, 3.6, 3.6, '#a8d0ff'); P(42, 20, 12, 1, '#e8d8ff');
      P.ell(32, 30, 2.4, 2.4, '#ffb050');
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; P(Math.round(40 + Math.cos(a) * 24) - 1, Math.round(24 + Math.sin(a) * 20) - 1, 2, 2, '#f4dcff'); }
      P.ell(40, 46, 30, 6, '#2a2240'); P.ell(40, 45, 28, 5, '#5a4a80'); P.ell(40, 44.5, 24, 3.6, '#8a72c8'); P.ell(40, 44.5, 20, 2.6, '#c8b0ff');
      P(34, 34, 12, 10, '#3a3054'); P(35, 34, 10, 2, '#7a6aa8'); P(37, 37, 6, 6, '#241c38'); P(38, 38, 4, 3, '#50e0ff');
    },
    portrait(P, art) {
      const A = PORTRAITS[art] || PORTRAITS.herta;
      P(0, 0, 16, 15, '#6a4a18'); P(1, 1, 14, 13, '#d8b050'); P(2, 2, 12, 11, A.bg);
      A.draw(P);
      P(1, 1, 14, 1, '#f4dc90'); P(1, 13, 14, 1, '#8a6420'); P(14, 1, 1, 13, '#8a6420');
      P(5, 15, 6, 2, '#3a2a18'); P(6, 15, 4, 1, '#c8a050');
      P(1, 26, 2, 5, '#8a6a30'); P(13, 26, 2, 5, '#8a6a30'); P(1, 25, 2, 1, '#e8c870'); P(13, 25, 2, 1, '#e8c870');
      P(3, 27, 10, 1, '#a02838'); P(4, 28, 8, 1, '#7a1828');
      P.ell(8, 31, 7, 1.2, 'rgba(8,6,20,0.3)');
    },
    suFrame(P) {
      P.ell(8, 31, 7, 1.2, 'rgba(8,6,20,0.4)');
      P(2, 21, 2, 10, '#3a2e58'); P(12, 21, 2, 10, '#3a2e58'); P(2, 21, 1, 10, '#7a6aa8'); P(12, 21, 1, 10, '#7a6aa8'); P(1, 29, 14, 2, '#4a3e6a');
      P(0, 0, 16, 22, '#5a3a10'); P(1, 1, 14, 20, '#e8c060'); P(2, 2, 12, 18, '#8a6420'); P(3, 3, 10, 16, '#120a24');
      P(1, 1, 14, 1, '#fff0b0'); P(1, 1, 1, 20, '#fff0b0'); P(14, 2, 1, 19, '#a87a28');
      for (const [x, y] of [[0, 0], [13, 0], [0, 19], [13, 19]]) { P(x, y, 3, 3, '#f4dc90'); P(x + 1, y + 1, 1, 1, '#c890ff'); }
      P(6, 0, 4, 1, '#c890ff'); P(7, 21, 2, 1, '#c890ff');
    },
    suHeal(P) {
      P.ell(8, 22, 7, 1.6, 'rgba(8,10,24,0.35)');
      P(3, 18, 10, 4, '#2a2240'); P(2, 19, 12, 2, '#4a3e6a'); P(4, 18, 8, 1, '#8a72c8');
      P(4, 4, 8, 14, '#10202c'); P(5, 5, 6, 12, '#2a9a7a'); P(5, 5, 2, 12, '#7af0c8'); P.ell(8, 4, 4, 2, '#10202c'); P.ell(8, 4, 3, 1.4, '#7af0c8');
      P(7, 7, 2, 7, '#ffffff'); P(5, 9, 6, 2, '#ffffff');
    },
    suTp(P) {
      P.ell(8, 22, 7, 1.6, 'rgba(8,10,24,0.35)');
      P(4, 18, 8, 4, '#2a2240'); P(5, 17, 6, 1, '#8a72c8'); P(7, 12, 2, 6, '#4a3e6a');
      P.tri([8, 1, 13, 7, 8, 13, 3, 7], '#1a6ab8'); P.tri([8, 2, 12, 7, 8, 12, 4, 7], '#7ad8ff'); P.tri([8, 2, 8, 12, 4, 7], '#e8feff');
    },
    puppets(P) {
      P.ell(8, 23, 7, 1.6, 'rgba(8,6,20,0.35)');
      P(1, 1, 14, 21, '#3a2a48'); P(2, 2, 12, 17, '#1a2036');
      P(4, 6, 8, 3, '#c6ab9a'); P(5, 4, 6, 3, '#2a2230'); P(10, 4, 2, 2, '#8c5ae8'); P(5, 8, 6, 3, '#f8e0d4'); P(6, 9, 1, 1, '#6a3aa0'); P(9, 9, 1, 1, '#6a3aa0');
      P(4, 11, 8, 6, '#2e2536'); P(5, 11, 6, 2, '#f3f0f4'); P(4, 16, 8, 2, '#8c5ccc');
      P(2, 2, 3, 17, 'rgba(200,230,255,0.18)'); P(2, 2, 1, 17, 'rgba(230,245,255,0.45)');
      P(1, 19, 14, 3, '#5a4470'); P(1, 19, 14, 1, '#9a82c0'); P(6, 20, 4, 1, '#d8b050');
    },
    fhmirror(P) {
      P.ell(8, 42, 7, 1.8, 'rgba(8,10,24,0.4)');
      P(2, 39, 3, 2, '#3a2a18'); P(11, 39, 3, 2, '#3a2a18');
      P(2, 12, 2, 28, '#6a4a28'); P(12, 12, 2, 28, '#4a321c'); P(2, 12, 1, 28, '#9a7040');
      P(4, 35, 8, 2, '#6a4a28'); P(4, 35, 8, 1, '#9a7040');
      P.ell(8, 18, 6, 15, '#a07a2c'); P.ell(8, 18, 5.4, 14.4, '#f0d488'); P.ell(8, 18, 4.6, 13.6, '#c8a048');
      P.ell(8, 18, 4, 13, '#10204a'); P.ell(8, 19, 3.4, 11.6, '#1e3a7a'); P.ell(7, 15, 2, 6, '#3a6ac0');
      P(5, 9, 1, 6, '#9ad8ff'); P(6, 8, 1, 3, '#d8f2ff'); P(10, 22, 1, 6, '#5aa0f0');
      P(8, 12, 1, 2, '#f4fcff'); P(9, 14, 1, 2, '#f4fcff'); P(8, 16, 1, 3, '#f4fcff'); P(9, 19, 1, 2, '#f4fcff'); P(7, 21, 1, 3, '#d8f0ff'); P(10, 15, 2, 1, '#f4fcff'); P(6, 17, 2, 1, '#d8f0ff');
      P(7, 2, 2, 2, '#f0d488'); P(7, 1, 2, 1, '#7ac8ff');
    },
    creation(P, art) {
      const C = { tart: ['#f0c050', '#ffe8a0', '#b07a28'], bean: ['#8a80a0', '#c8c0dc', '#4a4260'], plum: ['#e890b0', '#ffd0e0', '#9a4a6a'], rice: ['#f4f0e4', '#ffffff', '#b8b0a0'] }[art] || ['#f0c050', '#ffe8a0', '#b07a28'];
      const [b, hi, dk] = C;
      P.ell(8, 23, 6, 1.4, 'rgba(8,6,20,0.35)');
      P.tri([3, 12, 4, 6, 7, 10], dk); P.tri([13, 12, 12, 6, 9, 10], dk);
      P.tri([4, 11, 4.5, 8, 6.5, 10], hi); P.tri([12, 11, 11.5, 8, 9.5, 10], hi);
      P.ell(8, 16, 6.5, 6, dk); P.ell(8, 15.5, 5.8, 5.4, b); P.ell(6.5, 13.5, 2.4, 1.8, hi);
      P(5, 15, 2, 2, '#1a1420'); P(10, 15, 2, 2, '#1a1420'); P(5, 15, 1, 1, '#ffffff'); P(10, 15, 1, 1, '#ffffff');
      P(7, 18, 3, 1, dk); P(4, 21, 3, 1, dk); P(10, 21, 3, 1, dk);
      if (art === 'tart') { P(3, 19, 10, 1, dk); P.ell(8, 9.5, 2, 1, '#fff6d0'); }
      if (art === 'bean') { P(3, 17, 2, 1, '#e8a0c0'); P(11, 17, 2, 1, '#e8a0c0'); }
    },
    crt(P) {
      P.ell(8, 23, 7, 1.6, 'rgba(8,10,24,0.35)');
      P(2, 18, 12, 2, '#3a2a1c'); P(3, 20, 1, 3, '#2a1e14'); P(12, 20, 1, 3, '#2a1e14');
      P(5, 2, 1, 4, '#8a8a90'); P(10, 1, 1, 5, '#8a8a90'); P(6, 5, 4, 1, '#5a5a62');
      P(1, 6, 14, 12, '#4a3420'); P(1, 6, 14, 1, '#8a6a44'); P(1, 6, 1, 12, '#6a4c30');
      P(2, 8, 10, 8, '#0c0e14'); P(3, 9, 8, 6, '#2a4a6a'); P(3, 9, 3, 2, '#9ad0f0');
      P(12, 8, 2, 2, '#18181c'); P(12, 12, 2, 2, '#18181c'); P(12, 15, 2, 1, '#c84040');
    },
    tent(P) {
      P.ell(8, 22, 8, 1.8, 'rgba(8,10,24,0.4)');
      P.tri([0, 22, 8, 5, 16, 22], '#4a3c26');
      P.tri([1, 22, 8, 7, 15, 22], '#8a7650');
      P.tri([8, 7, 15, 22, 9, 22], '#6e5c3c');
      P.tri([5, 22, 8, 14, 11, 22], '#1e1610');
      P(10, 16, 3, 3, '#5a6a4a'); P(10, 16, 3, 1, '#7a8a62');
      P(3, 18, 2, 2, '#7a3a2a');
      P(8, 2, 1, 5, '#3a2a1a'); P(9, 2, 3, 2, '#c0503a');
    },
    crate(P, art) {
      P.ell(8, 22, 7, 1.6, 'rgba(8,10,24,0.35)');
      P(2, 11, 12, 11, '#4a3018'); P(3, 12, 10, 9, '#9a6a36'); P(3, 12, 10, 1, '#c08c50');
      P(3, 15, 10, 1, '#6a4622'); P(3, 18, 10, 1, '#6a4622'); P(7, 12, 1, 9, '#6a4622');
      P(4, 13, 4, 3, '#e8e0c8'); P(5, 14, 2, 1, '#8a8070');
      if (art === 'smell') {
        P(13, 15, 3, 7, '#7a1a1a'); P(13, 15, 3, 1, '#d84a3a'); P(14, 16, 1, 5, '#a82a24');
        P.dot(14, 13, '#c8a060'); P.dot(13, 11, '#c8a060');
      }
    },
    stash(P) {
      P.ell(8, 22, 7, 1.6, 'rgba(8,10,24,0.35)');
      P(2, 12, 12, 10, '#3e2c1a'); P(3, 13, 10, 8, '#7a5634'); P(3, 13, 10, 1, '#a07a4a');
      P(1, 9, 14, 4, '#5a4026'); P(2, 9, 12, 1, '#8a6a42');
      P(5, 15, 2, 2, '#50c8ff'); P(8, 16, 2, 2, '#f06a8a'); P(10, 15, 2, 2, '#f0d040'); P.dot(5, 15, '#e0f8ff');
      P(4, 18, 4, 1, '#b07a3a'); P(4, 17, 1, 2, '#b07a3a');
    },
    junk(P) {
      P.ell(8, 22, 8, 1.8, 'rgba(8,10,24,0.4)');
      P(0, 15, 9, 7, '#4a4a52'); P(1, 16, 7, 5, '#6a6a74'); P(1, 16, 7, 1, '#8a8a96');
      P(7, 12, 8, 10, '#4a3018'); P(8, 13, 6, 8, '#8a6034'); P(8, 16, 6, 1, '#5a3a1a');
      P(9, 8, 6, 5, '#5a4a2a'); P(10, 9, 4, 3, '#c0902a'); P(11, 10, 2, 1, '#f0d070');
      P.tri([1, 15, 3, 11, 5, 15], '#c8601e'); P.tri([3, 15, 5, 12, 7, 15], '#e88a3a');
      P.ell(3, 20, 2, 2, '#2a2a30'); P.ell(3, 20, 1, 1, '#8a8a96');
    },
    dig(P) {
      P.ell(8, 21, 7, 2.2, 'rgba(8,10,24,0.35)');
      P.ell(8, 19, 7, 3, '#4a3424'); P.ell(8, 18, 6, 2.4, '#6a4c34'); P.ell(7, 17, 3, 1.2, '#86664a');
      P(4, 18, 1, 1, '#2a1a10'); P(10, 19, 1, 1, '#2a1a10'); P(12, 17, 1, 1, '#a08060');
    }
  };

  const PORTRAITS = {
    herta: { bg: '#3a2a52', draw(P) { P(4, 6, 8, 7, '#c6ab9a'); P(5, 3, 6, 3, '#1e1824'); P(10, 3, 2, 2, '#8c5ae8'); P(5, 6, 6, 4, '#f8e0d4'); P(6, 7, 1, 1, '#6a3aa0'); P(9, 7, 1, 1, '#6a3aa0'); P(5, 11, 6, 2, '#2e2536'); } },
    zandar: { bg: '#2a3a2e', draw(P) { P(5, 3, 6, 2, '#e8e4dc'); P(5, 5, 6, 4, '#e8c8a8'); P(6, 6, 1, 1, '#3a2a20'); P(9, 6, 1, 1, '#3a2a20'); P(5, 8, 6, 4, '#f4f0e8'); P(3, 10, 10, 3, '#3a6a4a'); P(7, 10, 2, 3, '#f4f0e8'); } },
    polka: { bg: '#141420', draw(P) { P(4, 3, 8, 10, '#0a0a10'); P(5, 5, 6, 4, '#2a2a36'); P(6, 7, 1, 1, '#c8c8e0'); P(9, 7, 1, 1, '#c8c8e0'); P(7, 9, 2, 1, '#a02838'); P(3, 11, 10, 2, '#22222e'); } },
    aiden: { bg: '#3e3a26', draw(P) { P(5, 3, 6, 3, '#7a5030'); P(5, 5, 6, 4, '#f0d0b0'); P(6, 6, 1, 1, '#2a2020'); P(9, 6, 1, 1, '#2a2020'); P(6, 8, 4, 1, '#c87060'); P(4, 10, 8, 3, '#e8e8f0'); P(7, 10, 2, 2, '#c8a050'); } },
    salas: { bg: '#262c40', draw(P) { P(4, 3, 8, 2, '#f0f0f4'); P(5, 5, 6, 4, '#e8c8a8'); P(6, 6, 1, 1, '#2a2a3a'); P(9, 6, 1, 1, '#2a2a3a'); P(5, 8, 6, 1, '#f0f0f4'); P(3, 10, 10, 3, '#2a4a8a'); P(7, 10, 2, 3, '#e8e8f0'); } },
    screwllum: { bg: '#1c2432', draw(P) { P(5, 2, 6, 2, '#3a4458'); P(4, 4, 8, 6, '#8a94a8'); P(5, 5, 6, 3, '#2a3040'); P(6, 6, 4, 1, '#80e0ff'); P(7, 8, 2, 1, '#5a6478'); P(3, 10, 10, 3, '#4a5468'); P(7, 10, 2, 3, '#c8a050'); } }
  };

  function floorTexture(theme) {
    const key = 'tex|' + theme;
    let c = objects.get(key);
    if (c) return c;
    const T = THEMES[theme] || THEMES.station;
    c = G.mkCanvas(U * 4, U * 4);
    const g = c.getContext('2d');
    for (let ty = 0; ty < 4; ty++) for (let tx = 0; tx < 4; tx++) {
      const e = { x: tx + 5, y: ty + 9, T, v: (tx * 3 + ty * 5) % 4, nb: {}, same: {}, nb2: {}, edge: {}, railV: false };
      groundTile(painter(g, tx * U, ty * U), T, theme, 'floor', e);
    }
    objects.set(key, c);
    return c;
  }

  function drawObject(ctx, kind, px, py, st, t) {
    const was = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    const ph = st.phase || 0;
    const put = (c, dx, dy) => ctx.drawImage(c, Math.round(px + dx), Math.round(py + dy), c.width * 2, c.height * 2);
    switch (kind) {
      case 'chest': {
        put(objectCanvas('chest' + (st.open ? 1 : 0), 16, 24, P => OBJ.chest(P, st.open)), 0, -16);
        if (!st.open) { const k = 0.3 + 0.25 * Math.sin(t * 3 + ph); ctx.fillStyle = 'rgba(255,230,140,' + k + ')'; ctx.fillRect(px + 14, py - 4, 4, 4); ctx.fillRect(px + 12, py - 2, 8, 1); }
        break;
      }
      case 'anchor': {
        const on = !!st.on, glow = 0.5 + 0.5 * Math.sin(t * 2 + ph);
        const gr = ctx.createRadialGradient(px + 16, py - 2, 2, px + 16, py - 2, 30);
        gr.addColorStop(0, on ? 'rgba(120,220,255,' + (0.45 + glow * 0.25) + ')' : 'rgba(120,150,200,0.25)'); gr.addColorStop(1, 'rgba(120,220,255,0)');
        ctx.fillStyle = gr; ctx.fillRect(px - 14, py - 32, 60, 60);
        put(objectCanvas('anchorBase', 16, 24, OBJ.anchorBase), 0, -16);
        put(objectCanvas('anchorGem' + (on ? 1 : 0), 16, 14, P => OBJ.anchorGem(P, on)), 0, -26 + Math.round(glow * 3) * 2);
        ctx.strokeStyle = on ? 'rgba(200,245,255,0.8)' : 'rgba(150,170,210,0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(px + 16, py - 10 + glow * 6, 13, 4, 0, t * 2 % (Math.PI * 2), t * 2 % (Math.PI * 2) + 4.2); ctx.stroke();
        break;
      }
      case 'destr': {
        const k = 0.35 + 0.2 * Math.sin(t * 3 + ph);
        const gr = ctx.createRadialGradient(px + 16, py + 6, 1, px + 16, py + 6, 22);
        gr.addColorStop(0, 'rgba(190,120,255,' + k + ')'); gr.addColorStop(1, 'rgba(190,120,255,0)');
        ctx.fillStyle = gr; ctx.fillRect(px - 6, py - 16, 44, 44);
        put(objectCanvas('destr', 16, 24, OBJ.destr), 0, -16);
        break;
      }
      case 'lever': put(objectCanvas('lever' + (st.on ? 1 : 0), 16, 24, P => OBJ.lever(P, st.on)), 0, -16); break;
      case 'su_machine': {
        put(objectCanvas('suMachine', 80, 56, OBJ.suMachine), -64, -80);
        const k = 0.5 + 0.5 * Math.sin(t * 2 + ph);
        const gr = ctx.createRadialGradient(px + 16, py - 32, 4, px + 16, py - 32, 46);
        gr.addColorStop(0, 'rgba(200,150,255,' + (0.18 + 0.14 * k) + ')'); gr.addColorStop(1, 'rgba(200,150,255,0)');
        ctx.fillStyle = gr; ctx.fillRect(px - 34, py - 82, 100, 100);
        for (let i = 0; i < 3; i++) { const a = t * 1.4 + i * 2.09; ctx.fillStyle = 'rgba(244,220,255,0.85)'; ctx.fillRect(Math.round(px + 16 + Math.cos(a) * 44) - 1, Math.round(py - 32 + Math.sin(a) * 36) - 1, 3, 3); }
        ctx.fillStyle = 'rgba(80,224,255,' + (0.25 + 0.3 * k) + ')'; ctx.fillRect(px + 6, py + 6, 20, 2);
        break;
      }
      case 'portrait': put(objectCanvas('portrait|' + st.art, 16, 32, P => OBJ.portrait(P, st.art)), 0, -32); break;
      case 'su_portal': {
        const col = st.col || '#80c8ff', k = 0.5 + 0.5 * Math.sin(t * 3 + ph), cx = px + 16, cy = py - 4;
        const gr = ctx.createRadialGradient(cx, cy + 12, 2, cx, cy + 12, 32);
        gr.addColorStop(0, rgba(col, 0.4 + 0.2 * k)); gr.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = gr; ctx.fillRect(px - 16, py - 36, 64, 72);
        ctx.fillStyle = 'rgba(8,4,22,0.9)'; ctx.beginPath(); ctx.ellipse(cx, cy, 11, 18, 0, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 9; i++) {
          const a = t * 2.2 + i * 0.7, r = 3 + (i % 3) * 3;
          ctx.fillStyle = i % 3 ? rgba(col, 0.9) : 'rgba(255,255,255,0.9)';
          ctx.fillRect(Math.round(cx + Math.cos(a) * r * 0.62) - 1, Math.round(cy + Math.sin(a) * r) - 1, 2, 2);
        }
        ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy, 12, 19, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,' + (0.5 + 0.4 * k).toFixed(2) + ')'; ctx.beginPath(); ctx.ellipse(cx, cy, 12, 19, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        ctx.fillStyle = rgba(col, 0.8); ctx.fillRect(px + 4, py + 16, 24, 2); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(px + 8, py + 16, 16, 1);
        break;
      }
      case 'su_frame': {
        const k = 0.5 + 0.5 * Math.sin(t * 1.6 + ph), lift = st.done ? 0 : Math.round(k * 2);
        if (!st.done) {
          const gr = ctx.createRadialGradient(px + 16, py - 10, 4, px + 16, py - 10, 40);
          gr.addColorStop(0, 'rgba(200,150,255,' + (0.2 + 0.15 * k).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(200,150,255,0)');
          ctx.fillStyle = gr; ctx.fillRect(px - 24, py - 50, 80, 80);
        }
        put(objectCanvas('suFrame', 16, 32, OBJ.suFrame), 0, -32 - lift);
        if (st.done) { ctx.fillStyle = 'rgba(10,6,24,0.55)'; ctx.fillRect(px + 6, py - 26 - lift, 20, 32); }
        break;
      }
      case 'su_heal': {
        const k = 0.5 + 0.5 * Math.sin(t * 2.4 + ph);
        const gr = ctx.createRadialGradient(px + 16, py + 2, 2, px + 16, py + 2, 26);
        gr.addColorStop(0, 'rgba(120,240,200,' + (0.3 + 0.2 * k).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(120,240,200,0)');
        ctx.fillStyle = gr; ctx.fillRect(px - 10, py - 24, 52, 52);
        put(objectCanvas('suHeal', 16, 24, OBJ.suHeal), 0, -16);
        break;
      }
      case 'su_tp': {
        const k = 0.5 + 0.5 * Math.sin(t * 3 + ph);
        const gr = ctx.createRadialGradient(px + 16, py - 4, 2, px + 16, py - 4, 24);
        gr.addColorStop(0, 'rgba(120,200,255,' + (0.3 + 0.25 * k).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(120,200,255,0)');
        ctx.fillStyle = gr; ctx.fillRect(px - 8, py - 28, 48, 48);
        put(objectCanvas('suTp', 16, 24, OBJ.suTp), 0, -16 - Math.round(k * 3));
        break;
      }
      case 'fhmirror': {
        const k = 0.5 + 0.5 * Math.sin(t * 1.7 + ph);
        const gl = ctx.createRadialGradient(px + 16, py - 20, 4, px + 16, py - 20, 40); gl.addColorStop(0, 'rgba(110,190,255,' + (0.18 + 0.14 * k).toFixed(3) + ')'); gl.addColorStop(1, 'rgba(110,190,255,0)'); ctx.fillStyle = gl; ctx.fillRect(px - 24, py - 60, 80, 80);
        put(objectCanvas('fhmirror2', 16, 44, OBJ.fhmirror), 0, -56);
        ctx.fillStyle = 'rgba(220,245,255,' + (0.15 + 0.3 * k).toFixed(3) + ')'; ctx.fillRect(px + 10, py - 42 + Math.floor((t * 12 + ph * 5) % 40), 10, 1);
        break;
      }
      case 'crt': {
        put(objectCanvas('crt', 16, 24, OBJ.crt), 0, -16);
        const k = 0.5 + 0.5 * Math.sin(t * 9 + ph) * Math.sin(t * 2.3);
        ctx.fillStyle = 'rgba(160,215,255,' + (0.12 + 0.18 * k).toFixed(3) + ')'; ctx.fillRect(px + 6, py + 2, 16, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(px + 6, py + 2 + Math.floor((t * 20 + ph * 7) % 12), 16, 1);
        break;
      }
      case 'rift': {
        const k = 0.5 + 0.5 * Math.sin(t * 2.5 + ph), cx = px + 16, cy = py - 2;
        const gr = ctx.createRadialGradient(cx, cy, 6, cx, cy, 40);
        gr.addColorStop(0, 'rgba(255,120,60,' + (0.3 + 0.15 * k).toFixed(3) + ')'); gr.addColorStop(0.5, 'rgba(150,80,220,0.18)'); gr.addColorStop(1, 'rgba(150,80,220,0)');
        ctx.fillStyle = gr; ctx.fillRect(cx - 40, cy - 40, 80, 80);
        ctx.fillStyle = '#050308'; ctx.beginPath(); ctx.arc(cx, cy, 15 + k, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,150,80,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 16 + k, t * 1.7 % (Math.PI * 2), t * 1.7 % (Math.PI * 2) + 2.4); ctx.stroke();
        ctx.strokeStyle = 'rgba(190,140,255,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, 17 + k, -t * 2.1 % (Math.PI * 2), -t * 2.1 % (Math.PI * 2) + 1.8); ctx.stroke();
        for (let i = 0; i < 8; i++) { const a = t * 0.9 + i * 0.785, r = 20 + ((t * 14 + i * 5) % 14); ctx.fillStyle = i % 2 ? 'rgba(255,170,90,0.9)' : 'rgba(220,190,255,0.9)'; ctx.fillRect(Math.round(cx + Math.cos(a) * r) - 1, Math.round(cy + Math.sin(a) * r * 0.8) - 1, 2, 2); }
        break;
      }
      case 'creation': {
        const bob = Math.round(Math.abs(Math.sin(t * 3 + ph)) * 2);
        put(objectCanvas('creation|' + (st.art || 'tart'), 16, 24, P => OBJ.creation(P, st.art)), 0, -16 - bob * 2);
        break;
      }
      case 'tent': case 'crate': case 'stash': case 'junk': put(objectCanvas(kind + '|' + (st.art || ''), 16, 24, P => OBJ[kind](P, st.art)), 0, -16); break;
      case 'dig': {
        put(objectCanvas('dig', 16, 24, OBJ.dig), 0, -16);
        const k = 0.5 + 0.5 * Math.sin(t * 5 + ph);
        ctx.fillStyle = 'rgba(255,214,80,' + (0.35 + 0.5 * k).toFixed(3) + ')';
        ctx.fillRect(px + 15, py - 2 - Math.round(k * 4), 2, 6); ctx.fillRect(px + 13, py - Math.round(k * 4), 6, 2);
        break;
      }
      case 'puppets': {
        put(objectCanvas('puppets', 16, 24, OBJ.puppets), 0, -16);
        if (Math.sin(t * 1.3 + ph) > 0.92) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(px + 6, py - 12, 2, 2); }
        break;
      }
      case 'gate': {
        put(objectCanvas('gatePost', 16, 24, OBJ.gatePost), 0, -16);
        for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(255,' + (60 + i * 20) + ',80,' + (0.45 + 0.3 * Math.sin(t * 8 + i)) + ')'; ctx.fillRect(px + 6, py - 2 + i * 8, 20, 2); }
        break;
      }
      case 'exit': {
        const a = 0.45 + 0.3 * Math.sin(t * 4), dir = st.dir || 'up', col = st.locked ? '255,90,90' : '255,226,150';
        ctx.save(); ctx.translate(px + 16, py + 16); ctx.rotate({ up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[dir]);
        for (let i = 0; i < 2; i++) {
          const y = 4 - i * 9 - (st.locked ? 0 : ((t * 12) % 9));
          ctx.fillStyle = 'rgba(' + col + ',' + (a * (1 - i * 0.35)) + ')';
          ctx.beginPath(); ctx.moveTo(-8, y + 5); ctx.lineTo(0, y - 3); ctx.lineTo(8, y + 5); ctx.lineTo(8, y + 8); ctx.lineTo(0, y); ctx.lineTo(-8, y + 8); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
        if (st.locked) { ctx.fillStyle = '#2a2230'; ctx.fillRect(px + 11, py + 12, 10, 8); ctx.fillStyle = '#ff7070'; ctx.fillRect(px + 12, py + 13, 8, 6); ctx.strokeStyle = '#ff7070'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px + 16, py + 12, 3, Math.PI, 0); ctx.stroke(); }
        break;
      }
    }
    ctx.imageSmoothingEnabled = was;
  }

  Object.assign(G, { THEMES, TILE_U: U, mapLayer: layerOf, drawMap, tileKindAt: kindAt, drawObject, floorTexture, tilePainter: painter });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
