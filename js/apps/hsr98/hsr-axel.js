(function (H) {
  'use strict';
  const G = H.Gfx;
  const U = 16;
  const hash = (x, y, s) => G.hash(x, y, s);
  const J = () => H.Jarilo;
  const spr = (w, h, up, draw) => J().spr(w, h, up, draw);

  const MEADOW = {
      grass: ['#6cae3e', '#8cca52', '#4c8c2c', '#3a7424'], bloom: ['#ffffff', '#ffe060', '#ff9ab8', '#b8a0ff'],
      dirt: ['#9a7a4e', '#b8966a', '#6e5434'], field: ['#8a6440', '#a87c52', '#5e4228'], sand: ['#d8c48a', '#ecdcaa', '#b0985e'],
      path: ['#c4a66c', '#dcc28a', '#9a7e4c'], water: ['#3a82cc', '#8cc8f4', '#2a5e9e', '#1e4a80'],
      cliff: ['#9a7a54', '#b89470', '#6a5238', '#4a3826'], turf: ['#5ea438', '#7ec24e', '#3e7e24'],
      leaf: ['#2e6a2a', '#46883a', '#1e4a1e', '#62a44a'], bark: ['#5a3e26', '#7a5636', '#3a2616'],
      stone: ['#b8ae9a', '#d4ccb8', '#8a8270', '#6a6252'], moss: '#6a8a3a', wood: ['#8a5a34', '#a8723e', '#5a3820'],
      trim: ['#d4ccb8', '#8a8270'], frame: '#3a2a1e', lit: '#ffe8a0', glass: ['#2a2a34', '#4a4a5a'], door: ['#6a4428', '#8a5a36', '#3e2614'],
      night: 0, storeys: 2, rockHouse: true, bare: true, noRail: true, tint: null, wall: 'forest', house: 'stone'
  };
  const ROOFS = [['#c8643a', '#e08450', '#8a3e22'], ['#a8402e', '#c85a42', '#6a2418'], ['#4a5a7a', '#6a7a9a', '#2e3a52'], ['#8a5a3a', '#a87650', '#5a3820']];
  const ROOM = { inside: true, wall: 'room', house: 'room', storeys: 2, ceil: ['#2a1e16', '#3e2c20', '#1a120c'], plaster: ['#e8dcc0', '#f6ecd6', '#c4b496'], panel: ['#7a5232', '#94663e', '#523420'], plank: ['#a8784a', '#c08e5a', '#7a5432'], tile: ['#9a8a74', '#b4a48a', '#6e6250'], rug: ['#8a2a2a', '#c89a4a', '#5a1a1a'], straw: ['#d8b860', '#ecd284', '#a8883a'] };
  const LANDS = {
    meadow: MEADOW,
    axtown: Object.assign({}, MEADOW, { town: true, wall: 'stone', house: 'timber', storeys: 3, plaster: ['#ece2cc', '#f8f0de', '#c8bca2'], beam: ['#5a3a24', '#7a5236', '#3a2416'], cobble: ['#b8ae9c', '#d0c8b6', '#8a8070'], street: ['#b89a6a', '#d0b484', '#8a7048'], flag: ['#a8a090', '#bcb4a2', '#7e7664'], shutter: ['#4a6a3a', '#6a8a52', '#2e4a24'], night: 0.12 }),
    guild: Object.assign({}, MEADOW, ROOM),
    wizshop: Object.assign({}, MEADOW, ROOM, { plaster: ['#d8cce8', '#ece4f6', '#b0a2c8'], panel: ['#4e3c6a', '#6a5488', '#34264a'], plank: ['#8a6a4a', '#a4825e', '#5e4630'] }),
    stable: Object.assign({}, MEADOW, ROOM, { plaster: ['#b8946a', '#d0ac80', '#8a6c48'], panel: ['#6a4a2a', '#84603a', '#46301a'] }),
    estate: Object.assign({}, MEADOW, { wall: 'stone', house: 'timber', storeys: 3, plaster: ['#efe6d2', '#fbf4e4', '#cbc0a8'], beam: ['#4a2e1e', '#6a4630', '#2e1a10'], shutter: ['#3a5a7a', '#5a7a9a', '#22364a'], night: 0.1 }),
    forest: Object.assign({}, MEADOW, { grass: ['#5a9a38', '#78b44c', '#3e7a26', '#2e6420'], leaf: ['#285e26', '#3e7a34', '#1a401a', '#56943e'] }),
    keele: Object.assign({}, MEADOW, { town: true, dungeon: true, wall: 'stone', house: 'stone', storeys: 2, cobble: ['#6e645a', '#82786c', '#4e463e'], flag: ['#62584e', '#766c60', '#443c34'], street: ['#5a4e46', '#6e6258', '#3e342e'], stone: ['#4a4a56', '#62626e', '#2e2e38', '#1e1e26'], moss: '#3e5a3a', night: 0.6, tint: 'rgba(20,20,60,0.22)' }),
    mansion: Object.assign({}, MEADOW, ROOM, { plaster: ['#eadcc4', '#f8eedc', '#c6b498'], panel: ['#5a3422', '#74462e', '#3a2014'], plank: ['#9a6a40', '#b4824e', '#6e4a2a'], rug: ['#2e4e7e', '#c89a4a', '#1e3456'] })
  };
  let roofOf = null;

  const PROPS = new Set(['tree', 'crate', 'fence', 'lamp', 'statue', 'table', 'shelf', 'block']);
  const BUILD = new Set(['house', 'window', 'housedoor', 'gate']);

  function tufts(P, Z, e, n, seed) {
    const [b, hi, dk] = Z.grass, r = i => hash(e.x * 13 + i, e.y * 7 + i * 3, seed);
    for (let i = 0; i < n; i++) {
      const x = Math.floor(r(i) * 14) + 1, y = Math.floor(r(i + 9) * 13) + 2;
      P(x, y, 1, 2, dk); P(x + 1, y - 1, 1, 2, r(i + 20) > 0.5 ? hi : dk);
    }
    return b;
  }

  function grass(P, Z, e) {
    const [b, hi, dk, deep] = Z.grass, r = i => hash(e.x * 13 + i, e.y * 7 + i * 3, 201);
    P(0, 0, U, U, b);
    for (let py = 0; py < U; py++) for (let px = 0; px < U; px++) {
      const gx = e.x * U + px, gy = e.y * U + py, v = Math.sin(gx * 0.06) + Math.sin(gy * 0.07 + gx * 0.025) + Math.sin((gx - gy) * 0.035 + 2);
      const odd = (gx + gy) & 1;
      if (v > 2 || (v > 1.5 && odd)) P(px, py, 1, 1, hi);
      else if (v < -2.1 || (v < -1.6 && odd)) P(px, py, 1, 1, dk);
    }
    tufts(P, Z, e, 4, 203);
    if (r(1) > 0.8) { const x = Math.floor(r(2) * 12) + 2, y = Math.floor(r(3) * 12) + 2; P(x, y, 2, 1, hi); P(x + 1, y - 1, 1, 1, hi); }
    if (r(4) > 0.9) { const x = Math.floor(r(5) * 12) + 2, y = Math.floor(r(6) * 12) + 2; P(x, y, 2, 2, '#9a9480'); P(x, y, 2, 1, '#c8c2ae'); P(x, y + 2, 2, 1, deep); }
  }

  function fringe(P, Z, e) {
    const [, hi, dk] = Z.grass, r = i => hash(e.x * 17 + i, e.y * 11 + i, 207);
    const blades = (n, at) => { for (let i = 0; i < n; i++) { const k = r(i + n * 3); at(Math.floor(k * 15), 1 + Math.floor(r(i + 40) * 3), i); } };
    if (!e.same.u) { P(0, 0, U, 2, Z.grass[0]); blades(6, (p, d, i) => P(p, 2, 1, d, i % 2 ? dk : Z.grass[0])); P(0, 0, U, 1, hi); }
    if (!e.same.d) { P(0, U - 2, U, 2, Z.grass[0]); blades(6, (p, d, i) => P(p, U - 2 - d, 1, d, i % 2 ? hi : Z.grass[0])); }
    if (!e.same.l) { P(0, 0, 2, U, Z.grass[0]); blades(5, (p, d) => P(2, p, d, 1, Z.grass[0])); }
    if (!e.same.r) { P(U - 2, 0, 2, U, Z.grass[0]); blades(5, (p, d) => P(U - 2 - d, p, d, 1, Z.grass[0])); }
  }

  function stones(P, e, pal, w, h, seed) {
    const [b, hi, dk] = pal;
    P(0, 0, U, U, dk);
    for (let row = 0; row * h < U; row++) for (let col = -1; col * w < U; col++) {
      const x = col * w + (row % 2 ? Math.floor(w / 2) : 0) + 1, y = row * h + 1, x0 = Math.max(0, x), ww = Math.min(x + w - 1, U) - x0;
      if (ww <= 0) continue;
      const k = hash(e.x * 5 + col, e.y * 5 + row, seed);
      P(x0, y, ww, h - 1, k > 0.75 ? hi : k < 0.2 ? dk : b);
      P(x0, y, ww, 1, k > 0.75 ? '#e4dccc' : hi);
    }
  }

  function townFloor(P, Z, kind, e) {
    const r = i => hash(e.x * 13 + i, e.y * 7 + i * 3, 213);
    switch (kind) {
      case 'floor': stones(P, e, Z.cobble, 5, 4, 215); return true;
      case 'road': stones(P, e, Z.flag, 8, 8, 217); return true;
      case 'floor5': {
        const [b, hi, dk] = Z.flag;
        P(0, 0, U, U, b);
        P(0, 0, U, 1, hi); P(0, 0, 1, U, hi); P(U - 1, 0, 1, U, dk); P(0, U - 1, U, 1, dk);
        if ((e.x + e.y) % 2) P.tri([8, 3, 13, 8, 8, 13, 3, 8], hi);
        return true;
      }
      case 'floor2': {
        const [b, hi, dk] = Z.street;
        P(0, 0, U, U, b);
        for (let i = 0; i < 6; i++) { const x = Math.floor(r(i) * 14) + 1, y = Math.floor(r(i + 7) * 14) + 1; P(x, y, 2, 1, i % 2 ? hi : dk); }
        return true;
      }
      case 'floor4': {
        const [b, hi, dk] = Z.wood;
        P(0, 0, U, U, b);
        for (let y = 0; y < U; y += 4) { P(0, y, U, 1, hi); P(0, y + 3, U, 1, dk); P(((e.x * 7 + y) % 12) + 2, y + 1, 1, 2, dk); }
        return true;
      }
    }
    return false;
  }

  function roomFloor(P, Z, kind, e) {
    const r = i => hash(e.x * 13 + i, e.y * 7 + i * 3, 221);
    switch (kind) {
      case 'floor2': stones(P, e, Z.tile, 8, 8, 223); return;
      case 'floor3': {
        const [b, hi, dk] = Z.rug;
        P(0, 0, U, U, b);
        if (!e.same.u) { P(0, 0, U, 2, dk); P(0, 2, U, 1, hi); }
        if (!e.same.d) { P(0, U - 3, U, 1, hi); P(0, U - 2, U, 2, dk); }
        if (!e.same.l) { P(0, 0, 2, U, dk); P(2, 0, 1, U, hi); }
        if (!e.same.r) { P(U - 3, 0, 1, U, hi); P(U - 2, 0, 2, U, dk); }
        if ((e.x + e.y) % 2 === 0) P.tri([8, 5, 11, 8, 8, 11, 5, 8], hi);
        return;
      }
      case 'floor4': {
        const [b, hi, dk] = Z.straw;
        P(0, 0, U, U, b);
        for (let i = 0; i < 9; i++) { const x = Math.floor(r(i) * 14), y = Math.floor(r(i + 9) * 15); P.line(x, y, x + 2 + Math.floor(r(i + 18) * 3), y + (i % 3) - 1, i % 2 ? hi : dk); }
        return;
      }
      default: {
        const [b, hi, dk] = kind === 'floor5' ? Z.panel : Z.plank;
        P(0, 0, U, U, b);
        for (let y = 0; y < U; y += 4) { P(0, y, U, 1, hi); P(0, y + 3, U, 1, dk); const j = (e.x * 5 + (e.y * 4 + y) * 3) % 16; P(j, y, 1, 4, dk); }
        if (r(1) > 0.85) P.dot(Math.floor(r(2) * 14) + 1, Math.floor(r(3) * 14) + 1, dk);
      }
    }
  }

  function floorPaint(P, Z, kind, e) {
    if (Z.inside) return roomFloor(P, Z, kind, e);
    if (Z.town && townFloor(P, Z, kind, e)) return;
    const r = i => hash(e.x * 13 + i, e.y * 7 + i * 3, 211);
    switch (kind) {
      case 'floor': grass(P, Z, e); return;
      case 'floor2': {
        grass(P, Z, e);
        for (let i = 0; i < 3; i++) {
          const x = Math.floor(r(i) * 12) + 2, y = Math.floor(r(i + 5) * 11) + 3, c = Z.bloom[Math.floor(r(i + 10) * Z.bloom.length)];
          P(x, y + 1, 1, 2, Z.grass[2]); P(x - 1, y, 3, 1, c); P(x, y - 1, 1, 3, c); P.dot(x, y, c === '#ffe060' ? '#c87a1a' : '#ffe060');
        }
        return;
      }
      case 'floor3': {
        const [b, hi, dk] = Z.dirt;
        P(0, 0, U, U, b);
        P.dither(0, 0, U, U, dk, (e.x * 3 + e.y) & 1);
        for (let i = 0; i < 3; i++) { const x = Math.floor(r(i) * 13) + 1, y = Math.floor(r(i + 4) * 13) + 1; P(x, y, 2, 1, hi); P(x, y + 1, 2, 1, dk); }
        fringe(P, Z, e);
        return;
      }
      case 'floor4': {
        const [b, hi, dk] = Z.field;
        P(0, 0, U, U, b);
        for (let y = 1; y < U; y += 4) { P(0, y, U, 1, dk); P(0, y + 1, U, 1, hi); }
        for (let y = 2; y < U; y += 4) for (let x = 2 + ((e.x + y) % 3); x < U; x += 5) { P(x, y - 2, 1, 2, Z.grass[2]); P(x + 1, y - 3, 1, 2, Z.grass[1]); }
        return;
      }
      case 'floor5': {
        const [b, hi, dk] = Z.sand;
        P(0, 0, U, U, b);
        for (let i = 0; i < 4; i++) P.dot(Math.floor(r(i) * 16), Math.floor(r(i + 6) * 16), i % 2 ? hi : dk);
        fringe(P, Z, e);
        return;
      }
      case 'road': {
        const [b, hi, dk] = Z.path;
        P(0, 0, U, U, b);
        for (let i = 0; i < 5; i++) { const x = Math.floor(r(i) * 14) + 1, y = Math.floor(r(i + 7) * 14) + 1; P(x, y, 2, 1, i % 2 ? hi : dk); }
        if ((e.x + e.y) % 3 === 0) { P(3, 7, 1, 1, dk); P(11, 3, 1, 1, dk); P(9, 12, 2, 1, hi); }
        fringe(P, Z, e);
        return;
      }
      case 'chasm': {
        const [b, hi, dk, deep] = Z.water;
        P(0, 0, U, U, b);
        if (e.same.u && e.same.l && e.same.r && e.same.d) P.dither(0, 0, U, U, dk, (e.x + e.y) & 1);
        for (let i = 0; i < 2; i++) { const x = Math.floor(r(i) * 10) + 1, y = 3 + Math.floor(r(i + 3) * 10); P(x, y, 4 + Math.floor(r(i + 6) * 3), 1, hi); }
        if (!e.same.u) { P(0, 0, U, 4, Z.cliff[0]); P(0, 0, U, 1, Z.grass[0]); P(0, 1, U, 1, Z.grass[2]); P(0, 4, U, 1, deep); P(0, 5, U, 1, dk); }
        if (!e.same.l) { P(0, 0, 2, U, Z.sand[0]); P(2, 0, 1, U, hi); }
        if (!e.same.r) { P(U - 2, 0, 2, U, Z.sand[0]); P(U - 3, 0, 1, U, hi); }
        if (!e.same.d) { P(0, U - 3, U, 3, Z.sand[0]); P(0, U - 4, U, 1, hi); }
        return;
      }
      case 'bridge': {
        const [b, hi, dk] = Z.wood;
        P(0, 0, U, U, Z.water[0]);
        if (e.bridgeV) { P(1, 0, U - 2, U, b); for (let y = 0; y < U; y += 4) { P(1, y, U - 2, 1, hi); P(1, y + 3, U - 2, 1, dk); } P(1, 0, 1, U, dk); P(U - 2, 0, 1, U, dk); }
        else { P(0, 1, U, U - 2, b); for (let x = 0; x < U; x += 4) { P(x, 1, 1, U - 2, hi); P(x + 3, 1, 1, U - 2, dk); } P(0, 1, U, 1, dk); P(0, U - 2, U, 1, dk); }
        return;
      }
      case 'stairs': {
        const [b, hi, dk] = Z.cliff;
        for (let y = 0; y < U; y += 4) { P(0, y, U, 4, b); P(0, y, U, 1, hi); P(0, y + 3, U, 1, dk); }
        P(0, 0, 2, U, Z.turf[2]); P(U - 2, 0, 2, U, Z.turf[2]);
        return;
      }
      case 'door': { const [b, hi, dk] = Z.door; P(0, 0, U, U, dk); P(2, 0, U - 4, U, b); P(3, 0, 1, U, hi); return; }
      default: grass(P, Z, e);
    }
  }

  function rockFace(P, Z, ro, e) {
    const [b, hi, dk, deep] = Z.cliff, r = i => hash(e.x * 5 + i, e.y * 11 + i, 221);
    P(0, 0, U, U, b);
    for (let y = 3; y < U; y += 5) { P(0, y, U, 1, dk); P(0, y + 1, U, 1, hi); }
    for (let i = 0; i < 2; i++) { const x = Math.floor(r(i) * 12) + 1, y = Math.floor(r(i + 3) * 12) + 1; P(x, y, 3, 2, Z.stone[2]); P(x, y, 3, 1, Z.stone[1]); }
    if (ro === 'low') { P(0, U - 3, U, 3, dk); P(0, U - 1, U, 1, deep); for (let x = 1; x < U; x += 3) if (r(x + 7) > 0.4) P(x, U - 3, 1, 2, Z.grass[2]); }
    if (ro === 'high' || e.capTop) {
      P(0, 0, U, 3, Z.turf[0]); P(0, 0, U, 1, Z.turf[1]);
      for (let x = 0; x < U; x += 2) P(x, 3, 1, 1 + Math.floor(r(x + 11) * 3), Z.turf[2]);
    }
  }

  function rockTop(P, Z, e, open) {
    const [b, hi, dk] = Z.turf, r = i => hash(e.x * 7 + i, e.y * 3 + i, 223);
    P(0, 0, U, U, b);
    if (e.deep) P.dither(0, 0, U, U, dk, (e.x + e.y) & 1);
    for (let i = 0; i < 3; i++) { const x = Math.floor(r(i) * 14) + 1, y = Math.floor(r(i + 4) * 13) + 2; P(x, y, 1, 2, dk); P(x + 1, y - 1, 1, 2, hi); }
    if (open.l) { P(0, 0, 2, U, Z.cliff[0]); P(0, 0, 1, U, Z.cliff[3]); }
    if (open.r) { P(U - 2, 0, 2, U, Z.cliff[0]); P(U - 1, 0, 1, U, Z.cliff[3]); }
    if (open.u) { P(0, 0, U, 1, Z.cliff[3]); P(0, 1, U, 1, hi); }
  }

  function canopy(P, Z, e, open, eave) {
    const [b, hi, dk, lite] = Z.leaf, r = i => hash(e.x * 17 + i, e.y * 5 + i, 225);
    P(0, 0, U, U, dk);
    for (let i = 0; i < 4; i++) {
      const cx = Math.floor(r(i) * 12) + 2, cy = Math.floor(r(i + 4) * 12) + 2, rr = 3 + Math.floor(r(i + 8) * 3);
      P.oval(cx, cy, rr, rr - 1, b); P.oval(cx - 1, cy - 1, rr - 2, rr - 2, hi); P.dot(cx - 2, cy - 2, lite);
    }
    if (open.u) { P(0, 0, U, 2, dk); for (let x = 0; x < U; x += 4) P.oval(x + 2, 3, 3, 2, b); }
    if (open.l) P(0, 0, 1, U, dk);
    if (open.r) P(U - 1, 0, 1, U, dk);
    if (eave) for (let x = 0; x < U; x += 3) P(x, U - 2, 2, 1 + Math.floor(r(x + 30) * 2), b);
  }

  function wallTop(P, Z, e, open, eave) {
    const [b, hi, dk] = Z.stone;
    P(0, 0, U, U, b);
    for (let y = 0; y < U; y += 4) { P(0, y, U, 1, dk); for (let x = (y % 8 ? 0 : 4); x < U; x += 8) P(x, y, 1, 4, dk); }
    if (open.u) { P(0, 0, U, 2, hi); P(0, 2, U, 1, dk); }
    if (open.l) P(0, 0, 1, U, Z.stone[3]);
    if (open.r) P(U - 1, 0, 1, U, Z.stone[3]);
    if (eave) { P(0, U - 3, U, 3, hi); P(0, U - 1, U, 1, dk); }
  }

  function ceiling(P, Z, e, open, eave) {
    const [b, hi, dk] = Z.ceil;
    P(0, 0, U, U, dk);
    if ((e.x + e.y * 3) % 5 === 0) P(0, 6, U, 3, b);
    if (eave) { P(0, U - 3, U, 3, Z.panel[2]); P(0, U - 3, U, 1, hi); }
  }

  function tileRoof(P, Z, e, open, eave) {
    const [b, hi, dk] = ROOFS[(roofOf && roofOf[e.y * 4096 + e.x]) || 0], r = i => hash(e.x * 17 + i, e.y * 5 + i, 233);
    P(0, 0, U, U, b);
    for (let y = 2; y < U; y += 4) {
      P(0, y + 1, U, 1, dk);
      for (let x = (y % 8 === 2 ? 0 : 3); x < U; x += 6) { P(x, y - 2, 4, 1, hi); P(x + 4, y - 2, 1, 3, dk); }
    }
    if (open.u) { P(0, 0, U, 3, dk); P(0, 0, U, 1, hi); P(0, 1, U, 1, b); }
    if (open.l) { P(0, 0, 2, U, dk); P(0, 0, 1, U, '#2a1810'); }
    if (open.r) { P(U - 2, 0, 2, U, dk); P(U - 1, 0, 1, U, '#2a1810'); }
    if (r(1) > 0.94 && !eave && !open.u) { P(5, 1, 6, 11, '#8a4a34'); P(5, 1, 6, 1, '#b86a4a'); P(4, 0, 8, 2, '#5a3a2a'); P(6, 3, 1, 8, '#5a2a1a'); }
    if (eave) { P(0, U - 4, U, 2, dk); P(0, U - 2, U, 2, '#2a1810'); P(0, U - 4, U, 1, hi); }
  }

  function caveTop(P, Z, e, open, eave) {
    const r = i => hash(e.x * 19 + i, e.y * 7 + i, 239);
    P(0, 0, U, U, '#121218');
    for (let i = 0; i < 4; i++) P(Math.floor(r(i) * 14), Math.floor(r(i + 5) * 14), 2, 1, '#1e1e28');
    if (open.l) P(0, 0, 2, U, Z.stone[3]);
    if (open.r) P(U - 2, 0, 2, U, Z.stone[3]);
    if (open.u) P(0, 0, U, 2, Z.stone[3]);
    if (eave) { P(0, U - 3, U, 3, Z.stone[2]); P(0, U - 3, U, 1, Z.stone[1]); }
  }

  function roofTile(P, Z, e, open, eave) {
    if (Z.dungeon) return caveTop(P, Z, e, open, eave);
    if (e.k === 'wall') return Z.wall === 'forest' ? canopy(P, Z, e, open, eave) : Z.inside ? ceiling(P, Z, e, open, eave) : wallTop(P, Z, e, open, eave);
    if (Z.house === 'timber') return tileRoof(P, Z, e, open, eave);
    if (Z.inside) return ceiling(P, Z, e, open, eave);
    wallTop(P, Z, e, open, eave);
  }

  function forestFace(P, Z, ro, e) {
    const [b, hi, dk] = Z.leaf, r = i => hash(e.x * 23 + i, e.y * 9 + i, 227);
    if (ro === 'high') {
      P(0, 0, U, U, dk);
      for (let i = 0; i < 3; i++) { const cx = Math.floor(r(i) * 14) + 1, cy = Math.floor(r(i + 3) * 8) + 2; P.oval(cx, cy, 4, 3, b); P.oval(cx - 1, cy - 1, 2, 1, hi); }
      for (let x = 0; x < U; x += 3) P(x, U - 3, 2, 3, '#14301a');
      return;
    }
    P(0, 0, U, U, '#16301a');
    const tx = Math.floor(r(7) * 9) + 2;
    P(tx, 0, 4, U, Z.bark[0]); P(tx, 0, 1, U, Z.bark[1]); P(tx + 3, 0, 1, U, Z.bark[2]);
    if (r(8) > 0.5) { const t2 = (tx + 8) % 13; P(t2, 0, 2, U - 2, Z.bark[2]); }
    P(0, 0, U, 3, b); for (let x = 0; x < U; x += 4) P.oval(x + 2, 3, 2, 1, b);
    P(0, U - 3, U, 3, Z.grass[3]);
    for (let x = 1; x < U; x += 2) P(x, U - 3 - Math.floor(r(x + 12) * 3), 1, 3, Z.grass[x % 4 ? 2 : 0]);
  }

  function stoneFace(P, Z, ro, ch, e, sides) {
    const [b, hi, dk, deep] = Z.stone, r = i => hash(e.x * 29 + i, e.y * 3 + i, 229);
    P(0, 0, U, U, b);
    for (let y = 0; y < U; y += 4) { P(0, y + 3, U, 1, dk); for (let x = ((y + e.y * 4) % 8 ? 2 : 6); x < U; x += 8) P(x, y, 1, 3, dk); P(0, y, U, 1, hi); }
    if (r(1) > 0.7) { const x = Math.floor(r(2) * 10) + 2; P(x, U - 4, 4, 1, Z.moss); P(x + 1, U - 3, 2, 1, Z.moss); }
    if (!sides.l) P(0, 0, 2, U, deep);
    if (!sides.r) P(U - 2, 0, 2, U, deep);
    if (ro === 'high' && e.top && !Z.dungeon) {
      P(0, 0, U, 6, b); P(6, 0, 4, 4, dk); P(6, 3, 4, 1, deep);
      for (const mx of [0, 10]) { P(mx, 0, 6, 1, hi); P(mx, 0, 1, 5, hi); P(mx + 5, 1, 1, 4, dk); }
      P(0, 5, U, 1, dk);
    }
    if (ch === 'window') { P(7, ro === 'high' ? 5 : 3, 2, 7, '#1a1410'); P(6, ro === 'high' ? 4 : 2, 4, 1, hi); }
    if (ch === 'housedoor') { P(4, ro === 'high' ? 5 : 1, 8, U, Z.door[0]); P(4, ro === 'high' ? 5 : 1, 8, 1, Z.door[1]); P(7, ro === 'high' ? 6 : 2, 2, U, Z.door[2]); }
    if (ro === 'low') { P(0, U - 2, U, 2, deep); for (let x = 0; x < U; x += 3) if (r(x + 9) > 0.5) P(x, U - 3, 1, 2, Z.grass[2]); }
  }

  function timberFace(P, Z, ro, ch, e, sides) {
    const [b, hi] = Z.plaster, [bm, bmh, bmd] = Z.beam, r = i => hash(e.x * 31 + i, e.y * 7 + i, 235);
    P(0, 0, U, U, b);
    if ((e.x * 7 + e.y * 3) % 4 === 0) P(Math.floor(r(9) * 10) + 2, Math.floor(r(10) * 10) + 3, 3, 1, hi);
    if (ro === 'high') {
      P(0, 0, U, 2, bm); P(0, 0, U, 1, bmh);
      if (e.top) P(0, 2, U, 2, 'rgba(0,0,0,0.25)');
      if (!sides.l) { P(0, 0, 3, U, bm); P(0, 0, 1, U, bmh); }
      if (!sides.r) { P(U - 3, 0, 3, U, bm); P(U - 1, 0, 1, U, bmd); }
      if (ch === 'house' && e.x % 3 === 1) P(7, 2, 2, U - 2, bm);
      if (ch === 'house' && e.x % 3 === 0 && r(1) > 0.4) P.line(3, U - 1, 13, 3, bm, 2);
      if (ch === 'window') {
        P(3, 4, 10, 10, bm); P(4, 5, 8, 8, r(2) < Z.night + 0.25 ? Z.lit : Z.glass[0]); P(4, 5, 3, 2, Z.glass[1]); P(7, 5, 2, 8, bm); P(4, 8, 8, 1, bm);
        P(1, 4, 2, 10, Z.shutter[0]); P(13, 4, 2, 10, Z.shutter[0]); P(1, 4, 1, 10, Z.shutter[1]); P(14, 4, 1, 10, Z.shutter[2]);
        P(2, 14, 12, 2, bmd); P(3, 13, 2, 1, '#d83a3a'); P(7, 13, 2, 1, '#ffe060'); P(11, 13, 2, 1, '#d83a3a');
      }
      if (ch === 'housedoor') { P(3, 5, 10, U - 5, bmd); P(4, 6, 8, U - 6, Z.door[0]); P.oval(8, 6, 4, 2, Z.door[0]); P(7, 5, 2, U - 5, Z.door[2]); P(4, 6, 8, 1, Z.door[1]); }
      if (ch === 'gate') { P(0, 4, U, U - 4, bmd); P(1, 5, U - 2, U - 5, Z.door[0]); for (let x = 2; x < U; x += 4) P(x, 5, 1, U - 5, Z.door[2]); P(0, 9, U, 1, '#3a3a40'); }
      return;
    }
    P(0, U - 5, U, 5, Z.stone[0]); P(0, U - 5, U, 1, Z.stone[1]); P(5 + (e.x % 2) * 4, U - 4, 1, 4, Z.stone[2]); P(0, U - 1, U, 1, Z.stone[3]);
    P(0, U - 6, U, 1, bm);
    if (!sides.l) { P(0, 0, 3, U - 5, bm); P(0, 0, 1, U - 5, bmh); }
    if (!sides.r) { P(U - 3, 0, 3, U - 5, bm); P(U - 1, 0, 1, U - 5, bmd); }
    if (ch === 'window') { P(3, 1, 10, 8, bm); P(4, 2, 8, 6, r(3) < Z.night + 0.2 ? Z.lit : Z.glass[0]); P(7, 2, 2, 6, bm); P(1, 1, 2, 8, Z.shutter[0]); P(13, 1, 2, 8, Z.shutter[0]); }
    if (ch === 'housedoor') { P(3, 0, 10, U, bmd); P(4, 0, 8, U, Z.door[0]); P(7, 0, 2, U, Z.door[2]); P(10, 7, 1, 2, '#c8a050'); P(3, U - 1, 10, 1, '#000000'); }
    if (ch === 'gate') { P(0, 0, U, U, Z.door[0]); for (let x = 1; x < U; x += 4) P(x, 0, 1, U, Z.door[2]); P(0, 5, U, 1, '#3a3a40'); P(0, 10, U, 1, '#3a3a40'); P(0, U - 1, U, 1, '#000000'); }
  }

  function roomFace(P, Z, ro, ch, e, sides) {
    const [b] = Z.plaster, [pb, phi, pdk] = Z.panel;
    P(0, 0, U, U, b);
    if (!sides.l) P(0, 0, 2, U, pdk);
    if (!sides.r) P(U - 2, 0, 2, U, pdk);
    if (ro === 'high') {
      P(0, 0, U, 3, pb); P(0, 2, U, 1, pdk);
      if (e.x % 4 === 0) { P(7, 3, 2, U - 3, pb); P(7, 3, 1, U - 3, phi); }
      if (ch === 'window') { P(3, 4, 10, 11, pdk); P(4, 5, 8, 9, '#bfe2f6'); P(4, 5, 8, 2, '#ffffff'); P(7, 5, 2, 9, pdk); P(4, 9, 8, 1, pdk); P(2, 14, 12, 2, pb); }
      if (ch === 'housedoor' || ch === 'gate') { P(3, 4, 10, U - 4, pdk); P(4, 5, 8, U - 5, Z.door[0]); P(4, 5, 8, 1, Z.door[1]); P(7, 5, 2, U - 5, Z.door[2]); }
      return;
    }
    P(0, 4, U, U - 4, pb); P(0, 4, U, 1, phi); P(0, 5, U, 1, pdk);
    for (let x = 1; x < U; x += 5) { P(x, 7, 4, 6, phi); P(x + 1, 8, 2, 4, pb); }
    P(0, U - 1, U, 1, '#000000');
    if (ch === 'window') { P(3, 0, 10, 5, pdk); P(4, 0, 8, 4, '#bfe2f6'); P(7, 0, 2, 4, pdk); }
    if (ch === 'housedoor' || ch === 'gate') { P(3, 0, 10, U - 1, pdk); P(4, 0, 8, U - 1, Z.door[0]); P(7, 0, 2, U - 1, Z.door[2]); P(10, 7, 1, 2, '#c8a050'); }
  }

  function faceTile(P, Z, ro, ch, e, sides) {
    if (ch === 'wall') return Z.wall === 'forest' ? forestFace(P, Z, ro, e) : Z.inside ? roomFace(P, Z, ro, ch, e, sides) : stoneFace(P, Z, ro, ch, e, sides);
    if (Z.house === 'timber') return timberFace(P, Z, ro, ch, e, sides);
    if (Z.inside) return roomFace(P, Z, ro, ch, e, sides);
    stoneFace(P, Z, ro, ch, e, sides);
  }

  function propSprite(kind, Z, land, x, y, at) {
    const r = i => hash(x * 7 + i, y * 13 + i, 231);
    switch (kind) {
      case 'tree': {
        const big = r(1) > 0.35;
        return {
          up: big ? 30 : 18, cv: spr(U, U, big ? 30 : 18, P => {
            const h = big ? 46 : 34, [b, hi, dk, lite] = Z.leaf;
            P.shadow(8, h - 3, 8, 3);
            P(6, h - 14, 4, 12, Z.bark[0]); P(6, h - 14, 1, 12, Z.bark[1]); P(9, h - 14, 1, 12, Z.bark[2]); P(5, h - 3, 6, 1, Z.bark[2]); P.line(9, h - 12, 12, h - 16, Z.bark[0]);
            const cy = big ? 17 : 12, rr = big ? 10 : 7;
            P.oval(8, cy + 2, rr, rr - 2, dk);
            P.oval(4, cy, rr - 4, rr - 4, b); P.oval(12, cy + 1, rr - 4, rr - 4, b); P.oval(8, cy - (big ? 5 : 3), rr - 3, rr - 4, b); P.oval(8, cy + 2, rr - 3, rr - 5, b);
            P.oval(6, cy - (big ? 6 : 4), 3, 2, hi); P.oval(3, cy - 1, 2, 1, hi); P.oval(11, cy - 2, 2, 1, hi); P.dot(5, cy - (big ? 8 : 5), lite);
            P(0, cy + rr - 3, 16, 1, dk);
            if (r(3) > 0.7) { P.dot(10, cy - 1, '#d83a3a'); P.dot(4, cy + 3, '#d83a3a'); }
          })
        };
      }
      case 'crate': if (land !== 'meadow') return {
        up: 6, cv: spr(U, U, 6, P => {
          const [b, hi, dk] = Z.wood;
          P.shadow(8, 21, 7, 2);
          if ((x + y) % 2) { P(3, 7, 10, 14, b); P(3, 7, 2, 14, hi); P(11, 7, 2, 14, dk); P.oval(8, 7, 5, 2, hi); P.oval(8, 7, 3, 1, dk); P(3, 10, 10, 1, '#4a4a52'); P(3, 17, 10, 1, '#4a4a52'); return; }
          P(2, 7, 12, 13, b); P(2, 7, 12, 1, hi); P(2, 7, 1, 13, hi); P(13, 7, 1, 13, dk); P(2, 19, 12, 1, dk); P.line(3, 8, 12, 18, dk); P(2, 13, 12, 1, dk);
        })
      };
      return {
        up: 10, cv: spr(U, U, 10, P => {
          P.shadow(8, 23, 8, 2);
          P.oval(8, 15, 7, 8, '#c8a03a'); P.oval(8, 13, 6, 6, '#e0bc54'); P.oval(7, 10, 3, 2, '#f4d878');
          for (let i = 0; i < 6; i++) P.line(3 + i * 2, 9 + (i % 2), 4 + i * 2, 20, '#a8822a');
          P(1, 16, 14, 1, '#8a6a1e');
        })
      };
      case 'fence': {
        const same = (dx, dy) => at && at(x + dx, y + dy) === 'fence', run = same(-1, 0) || same(1, 0) || !(same(0, -1) || same(0, 1));
        return {
          up: 6, cv: spr(U, U, 6, P => {
            const [b, hi, dk] = Z.wood;
            if (run) {
              const x0 = same(-1, 0) ? 0 : 3, x1 = same(1, 0) ? U : 13;
              P(x0, 9, x1 - x0, 2, b); P(x0, 9, x1 - x0, 1, hi); P(x0, 15, x1 - x0, 2, b); P(x0, 15, x1 - x0, 1, hi);
              for (const px of [2, 11]) { P(px, 5, 3, 16, dk); P(px, 5, 1, 16, b); P(px, 4, 3, 1, hi); }
              return;
            }
            const y0 = same(0, -1) ? 0 : 8, y1 = same(0, 1) ? 22 : 18;
            P(9, y0, 2, y1 - y0, b); P(9, y0, 1, y1 - y0, hi); P(5, y0 + 2, 2, y1 - y0 - 2, dk);
            P(6, 6, 3, 16, dk); P(6, 6, 1, 16, b); P(6, 5, 3, 1, hi);
          })
        };
      }
      case 'lamp': if (land !== 'meadow') return {
        up: 26, light: [8, -20, 30, '#ffc870', 0.16],
        cv: spr(U, U, 26, P => {
          P.shadow(8, 41, 4, 2);
          P(6, 40, 4, 2, '#2a2420'); P(7, 8, 2, 33, '#2a2420'); P(7, 8, 1, 33, '#5a4a3a');
          P(4, 3, 8, 7, '#2a2420'); P(5, 4, 6, 5, '#ffd890'); P(5, 4, 6, 1, '#fff4c8'); P(3, 2, 10, 1, '#2a2420'); P(7, 0, 2, 2, '#2a2420');
        })
      };
      return {
        up: 18, cv: spr(U, U, 18, P => {
          const [b, hi, dk] = Z.wood;
          P.shadow(8, 33, 4, 2);
          P(7, 6, 2, 28, dk); P(7, 6, 1, 28, b);
          P(1, 6, 13, 6, b); P(1, 6, 13, 1, hi); P(1, 11, 13, 1, dk); P.tri([14, 6, 16, 9, 14, 12], b);
          P(3, 8, 7, 1, '#3a2614'); P(3, 10, 5, 1, '#3a2614');
        })
      };
      case 'statue': return {
        up: 6, cv: spr(U, U, 6, P => {
          const [b, hi, dk] = Z.stone;
          P.shadow(8, 21, 6, 2);
          P(4, 6, 8, 15, b); P(4, 6, 8, 1, hi); P(4, 6, 1, 15, hi); P(11, 6, 1, 15, dk); P(5, 4, 6, 2, b);
          P(6, 10, 4, 1, dk); P(6, 13, 4, 1, dk); P(3, 20, 10, 1, Z.moss);
        })
      };
      case 'table': return {
        up: 4, cv: spr(U, U, 4, P => { const [b, hi, dk] = Z.wood; P.shadow(8, 18, 7, 2); P(1, 6, 14, 5, b); P(1, 6, 14, 1, hi); P(2, 11, 2, 7, dk); P(12, 11, 2, 7, dk); })
      };
      case 'shelf': if (Z.inside) return {
        up: 14, cv: spr(U, U, 14, P => {
          const [b, hi, dk] = Z.panel, pot = ['#d83a6a', '#3a8ad8', '#5ac84a', '#e8c040', '#a85ad8', '#e87a3a'];
          P(1, 2, 14, 28, dk); P(1, 2, 14, 1, hi); P(2, 3, 12, 26, b);
          for (let yy = 9; yy < 30; yy += 7) {
            P(2, yy, 12, 1, dk);
            for (let xx = 3; xx < 13; xx += 3) {
              if (land === 'wizshop') { P(xx, yy - 4, 2, 4, pot[(xx + yy + x * 3) % pot.length]); P(xx, yy - 5, 2, 1, '#e8e0d0'); P.dot(xx, yy - 3, '#ffffff'); }
              else P(xx, yy - 5, 2, 5, ['#8a3a3a', '#3a5a8a', '#6a8a3a', '#a08a4a'][(xx + yy) % 4]);
            }
          }
        })
      };
      return {
        up: 8, cv: spr(U, U, 8, P => {
          const [b, hi, dk] = Z.wood;
          P.shadow(8, 23, 7, 2);
          P(2, 8, 12, 15, b); P(2, 8, 2, 15, hi); P(12, 8, 2, 15, dk); P.oval(8, 8, 6, 2, hi); P.oval(8, 8, 4, 1, dk);
          P(2, 12, 12, 1, '#4a4a52'); P(2, 19, 12, 1, '#4a4a52');
        })
      };
      case 'block': return null;
    }
    return null;
  }

  function protoRuin(P, st) {
    P.shadow(64, 116, 62, 10);
    P.line(6, 92, 22, 74, st[2], 4); P.line(22, 74, 30, 84, st[3], 3);
    P.line(122, 98, 108, 78, st[2], 4); P.line(108, 78, 100, 90, st[3], 3);
    P.line(16, 120, 34, 110, st[2], 3);
    P.oval(64, 96, 56, 22, st[3]); P.oval(64, 90, 50, 26, st[2]);
    for (let i = 0; i < 70; i++) {
      const a = hash(i, 3, 262), b = hash(i, 4, 262), dx = (a - 0.5) * 2, x = 64 + dx * 54;
      const top = 100 - (1 - dx * dx) * 58, y = top + b * (114 - top);
      const r = 3 + Math.floor(hash(i, 5, 262) * 7), c = i % 3;
      P.oval(x, y + 1, r, r * 0.7, st[3]); P.oval(x, y, r - 1, r * 0.6, st[c ? 0 : 2]); P.oval(x - 1, y - 1, r * 0.5, r * 0.3, st[1]);
    }
    P(40, 40, 24, 8, st[2]); P(42, 38, 20, 3, st[0]); P(48, 32, 6, 8, st[2]); P(49, 30, 4, 2, st[1]);
    P.oval(78, 58, 9, 7, '#1a1a22'); P.oval(78, 58, 6, 4, '#3a2a3e'); P.line(72, 54, 84, 63, st[3], 1);
    for (let i = 0; i < 12; i++) P.dot(16 + Math.floor(hash(i, 6, 262) * 96), 108 + Math.floor(hash(i, 7, 262) * 14), st[3]);
  }

  const DECOR = {
    camp: {
      w: 3, h: 2, up: 16,
      draw(P) {
        const wd = MEADOW.wood;
        P.shadow(18, 45, 16, 3);
        P.tri([2, 44, 18, 6, 34, 44], '#7a5a3a'); P.tri([6, 44, 18, 12, 18, 44], '#8a6a46'); P.tri([14, 44, 18, 30, 22, 44], '#2a1c12'); P(17, 4, 2, 4, wd[2]);
        P.oval(40, 40, 6, 3, '#4a3a2a'); for (const [x, y] of [[36, 40], [44, 40], [40, 42]]) P(x - 1, y - 1, 3, 2, '#6a4a2a');
        P.tri([36, 40, 40, 28, 44, 40], '#e8642a'); P.tri([38, 40, 40, 32, 42, 40], '#ffd040');
        P(26, 30, 2, 14, wd[2]); P(26, 30, 10, 2, wd[2]); P.oval(36, 34, 3, 2, '#c8b890');
      },
      lights: () => [[40, 18, 34, '#ff9a4a', 0.35, true]]
    },
    cave: {
      w: 3, h: 2, up: 10,
      draw(P) {
        const s = MEADOW.stone;
        P.oval(24, 30, 22, 20, s[2]); P.oval(24, 30, 19, 17, s[0]); P.oval(24, 34, 13, 14, '#0a0a10'); P(11, 34, 26, 8, '#0a0a10');
        for (let i = 0; i < 7; i++) P(6 + i * 6, 14 + (i % 3) * 3, 4, 3, s[1]);
        P(4, 40, 40, 2, s[3]);
      }
    },
    dolls: {
      w: 1, h: 1, up: 6,
      draw(P) {
        P.shadow(8, 21, 7, 2);
        for (const [x, y] of [[4, 12], [11, 13], [8, 8]]) { P(x - 2, y + 2, 5, 6, '#1e1e28'); P.oval(x, y, 3, 3, '#f0d6c2'); P(x - 3, y - 2, 3, 3, '#1a1a22'); P(x, y - 2, 3, 3, '#f4f2ee'); P.dot(x - 1, y, '#d83a3a'); }
      }
    },
    turret: {
      w: 1, h: 1, up: 18,
      draw(P) {
        const st = ['#7a7468', '#9a9488', '#4e4a42', '#2e2a26'];
        P.shadow(8, 33, 7, 2); P(3, 14, 10, 20, st[0]); P(3, 14, 10, 2, st[1]); P(12, 14, 1, 20, st[2]); P.oval(8, 12, 6, 4, st[2]); P.oval(8, 11, 5, 3, st[0]); P(10, 9, 6, 3, st[3]); P.dot(6, 11, '#ff6a3a');
      }
    },
    proto: {
      w: 8, h: 6, up: 30,
      draw(P, v) {
        const st = ['#6e6e7a', '#8e8e9a', '#4a4a56', '#2e2e38'];
        if (v === 'ruin') return protoRuin(P, st);
        for (let i = 0; i < 4; i++) {
          const ly = 70 + i * 10;
          P.line(30, ly - 10, 4, ly + 14, st[2], 4); P.line(4, ly + 14, 2, ly + 30, st[3], 3);
          P.line(98, ly - 10, 124, ly + 14, st[2], 4); P.line(124, ly + 14, 126, ly + 30, st[3], 3);
        }
        P.oval(64, 70, 46, 36, st[3]); P.oval(64, 66, 44, 33, st[0]); P.oval(56, 52, 26, 14, st[1]);
        for (let i = 0; i < 6; i++) P(26 + i * 13, 70, 8, 2, st[2]);
        P(40, 34, 48, 14, st[2]); P(44, 30, 40, 6, st[0]); for (const x of [46, 62, 78]) { P(x, 24, 6, 8, st[2]); P(x + 1, 22, 4, 2, st[1]); }
        P.oval(64, 92, 16, 8, st[2]); P.oval(64, 92, 10, 5, v === 'sleep' ? '#4a1a1a' : '#ff3a2a'); P.oval(62, 90, 3, 2, v === 'sleep' ? '#6a2a2a' : '#ffd0c0');
        P.oval(64, 66, 10, 8, '#1a1a22'); P.oval(64, 66, 7, 5, v === 'sleep' ? '#3a1a3a' : '#c85aff');
        for (let i = 0; i < 12; i++) P(20 + Math.floor(hash(i, 1, 261) * 88), 50 + Math.floor(hash(i, 2, 261) * 40), 3, 1, st[3]);
      }
    },
    cage: {
      w: 3, h: 2, up: 18,
      draw(P, v) {
        const iron = ['#5a5a66', '#8a8a96', '#2a2a32'];
        P.oval(24, 44, 22, 5, MEADOW.water[2]); P.oval(24, 44, 18, 3, MEADOW.water[1]);
        P(4, 6, 40, 3, iron[0]); P(4, 6, 40, 1, iron[1]); P(4, 42, 40, 3, iron[0]);
        for (let x = 4; x <= 42; x += 5) { P(x, 6, 2, 38, iron[0]); P(x, 6, 1, 38, iron[1]); }
        P(22, 0, 4, 7, iron[2]); P.ring(24, 2, 3, 2, iron[1]);
        if (v === 'aqua') { P.oval(24, 30, 6, 10, '#3a8ad8'); P.oval(24, 20, 5, 5, '#f8e0d4'); P(19, 16, 10, 4, '#5ab8f0'); P(18, 18, 2, 14, '#5ab8f0'); P(28, 18, 2, 14, '#5ab8f0'); }
      }
    },
    sofa: {
      w: 3, h: 1, up: 12,
      draw(P) {
        P.shadow(24, 27, 22, 2);
        P(2, 4, 44, 12, '#5a1a1e'); P(3, 5, 42, 10, '#8a2a2e'); P(3, 5, 42, 2, '#b84a4a');
        P(0, 14, 48, 12, '#7a2228'); P(0, 14, 48, 2, '#a83a3e'); P(0, 24, 48, 2, '#4a1216');
        P(0, 10, 6, 16, '#6a1c22'); P(42, 10, 6, 16, '#6a1c22'); P(0, 10, 6, 2, '#a83a3e'); P(42, 10, 6, 2, '#a83a3e');
        for (const x of [16, 32]) P(x, 15, 1, 9, '#4a1216');
        P(2, 26, 3, 2, '#3a2416'); P(43, 26, 3, 2, '#3a2416');
      }
    },
    bucket: {
      w: 1, h: 1, up: 4,
      draw(P, v) {
        const wd = MEADOW.wood;
        P.shadow(8, 19, 6, 2);
        P(3, 8, 10, 11, wd[0]); P(3, 8, 2, 11, wd[1]); P(11, 8, 2, 11, wd[2]); P(3, 11, 10, 1, '#4a4a52'); P(3, 16, 10, 1, '#4a4a52');
        P.oval(8, 8, 5, 2, MEADOW.water[0]); P.oval(8, 8, 3, 1, MEADOW.water[1]);
        if (v === 'tadpole') { P.oval(8, 7, 3, 2, '#7a4aa8'); P.dot(7, 6, '#ffffff'); P.dot(9, 6, '#ffffff'); P.line(11, 7, 14, 4, '#9a6ac8'); }
      }
    },
    chomusuke: {
      w: 1, h: 1, up: 2,
      draw(P) {
        P.shadow(8, 17, 6, 2);
        P.oval(8, 13, 5, 4, '#1a1a22'); P.oval(5, 9, 3, 3, '#1a1a22'); P.tri([3, 7, 3, 4, 5, 6], '#1a1a22'); P.tri([7, 7, 8, 4, 6, 6], '#1a1a22');
        P.dot(4, 9, '#e8c040'); P.dot(6, 9, '#e8c040'); P.dot(5, 7, '#d83a3a'); P.dot(4, 7, '#d83a3a'); P.dot(6, 7, '#d83a3a');
        P.tri([9, 11, 15, 7, 12, 13], '#3a2a4a'); P.line(13, 15, 15, 11, '#1a1a22');
      }
    },
    mgate: {
      w: 2, h: 1, up: 22,
      draw(P) {
        const s = MEADOW.stone;
        for (const x of [0, 26]) { P(x, 4, 6, 34, s[0]); P(x, 4, 6, 1, s[1]); P(x + 5, 4, 1, 34, s[2]); P(x - 1, 2, 8, 3, s[1]); P(x + 1, 0, 4, 3, '#2a2420'); P(x + 2, 1, 2, 1, '#ffd890'); }
        for (let i = 0; i < 4; i++) { P(6 + i * 2, 10, 1, 26, '#2a2a30'); P(25 - i * 2, 10, 1, 26, '#2a2a30'); }
        P(6, 10, 7, 1, '#2a2a30'); P(19, 10, 7, 1, '#2a2a30'); P(6, 22, 7, 1, '#2a2a30'); P(19, 22, 7, 1, '#2a2a30');
      },
      lights: () => [[3, -20, 18, '#ffd890', 0.2], [29, -20, 18, '#ffd890', 0.2]]
    },
    ruincastle: {
      w: 8, h: 4, up: 40,
      draw(P) {
        const st = ['#8a8a92', '#a8a8b2', '#5e5e68', '#44444c'], ivy = ['#3e6a2e', '#5a8a3a'];
        P(10, 40, 108, 60, st[0]); P(10, 40, 108, 2, st[1]);
        for (let y = 46; y < 100; y += 6) for (let x = 10 + ((y / 6) % 2) * 6; x < 118; x += 12) P(x, y, 1, 6, st[2]);
        for (let y = 46; y < 100; y += 6) P(10, y, 108, 1, st[2]);
        for (const [x, h] of [[0, 78], [52, 96], [104, 70]]) {
          P(x, 104 - h, 24, h, st[0]); P(x, 104 - h, 24, 2, st[1]); P(x + 22, 104 - h, 2, h, st[2]);
          for (let i = 0; i < 4; i++) P(x + i * 6, 98 - h, 4, 6, st[0]);
          P(x + 9, 116 - h, 6, 10, '#1a1a22'); P(x + 9, 140 - h, 6, 10, '#1a1a22');
        }
        P.tri([70, 40, 86, 22, 100, 40], '#4a6a8a');
        P(30, 70, 10, 16, '#1a1a22'); P.oval(35, 70, 5, 3, '#1a1a22'); P(86, 66, 10, 16, '#1a1a22'); P.oval(91, 66, 5, 3, '#1a1a22');
        for (const [x, y] of [[40, 40], [62, 18], [96, 46], [110, 44]]) { P(x, y, 8, 3, st[3]); P(x + 2, y + 3, 4, 2, st[3]); }
        P.tri([40, 40, 52, 30, 60, 40], '#bfe2f6');
        for (let i = 0; i < 14; i++) { const x = Math.floor(hash(i, 3, 251) * 120), y = 50 + Math.floor(hash(i, 4, 251) * 50); P(x, y, 2, 4 + (i % 3) * 2, ivy[i % 2]); }
        P.oval(64, 102, 40, 6, '#4a3a2a');
        for (let i = 0; i < 10; i++) P(30 + i * 8, 100 + (i % 2), 4, 2, st[2]);
      }
    },
    fountain: {
      w: 3, h: 2, up: 18,
      draw(P) {
        const s = MEADOW.stone, w = MEADOW.water;
        P.shadow(24, 47, 23, 3);
        P.oval(24, 36, 23, 11, s[3]); P.oval(24, 35, 22, 10, s[0]); P.oval(24, 34, 20, 8, s[1]); P.oval(24, 35, 18, 7, w[0]); P.oval(24, 36, 15, 5, w[2]);
        for (let i = 0; i < 6; i++) P(10 + i * 5, 34 + (i % 2), 3, 1, w[1]);
        P(21, 12, 6, 24, s[0]); P(21, 12, 2, 24, s[1]); P(26, 12, 1, 24, s[2]); P.oval(24, 12, 6, 3, s[1]); P.oval(24, 12, 4, 2, w[0]);
        P(23, 2, 2, 10, w[1]); P.line(23, 4, 15, 18, w[1]); P.line(24, 4, 33, 18, w[1]); P.dot(14, 20, '#ffffff'); P.dot(34, 20, '#ffffff'); P.dot(24, 1, '#ffffff');
      }
    },
    stall: {
      w: 2, h: 1, up: 18,
      draw(P, v) {
        const [kind, col] = (v || 'fruit:red').split(':'), c = { red: ['#c83a3a', '#f4ecd8'], blue: ['#3a6ac8', '#f4ecd8'], green: ['#4a8a3a', '#f4ecd8'], yellow: ['#d8a830', '#f4ecd8'] }[col] || ['#c83a3a', '#f4ecd8'], wd = MEADOW.wood;
        P.shadow(16, 33, 15, 2);
        P(2, 8, 2, 26, wd[2]); P(28, 8, 2, 26, wd[2]);
        for (let x = 0; x < 32; x += 6) { P(x, 2, 6, 8, c[(x / 6) % 2]); P(x, 10, 6, 2, c[(x / 6) % 2]); }
        P(0, 2, 32, 1, '#2a1a10'); P(0, 12, 32, 1, 'rgba(0,0,0,0.3)');
        P(1, 20, 30, 7, wd[0]); P(1, 20, 30, 1, wd[1]); P(1, 26, 30, 7, wd[2]);
        const goods = { fruit: ['#d83a3a', '#e8a030', '#8ac040'], cabbage: ['#7ab84a', '#a8d870', '#4a8a2a'], pots: ['#a85ad8', '#3a8ad8', '#e8c040'], fish: ['#8aa8c8', '#c8d8e8', '#5a7898'] }[kind] || ['#d83a3a', '#e8a030', '#8ac040'];
        for (let i = 0; i < 8; i++) { const gx = 3 + i * 3 + (i % 2), gy = 17 - (i % 3); if (kind === 'pots') { P(gx, gy, 2, 3, goods[i % 3]); P(gx, gy - 1, 2, 1, '#e8e0d0'); } else P.oval(gx + 1, gy + 1, 2, 2, goods[i % 3]); }
      }
    },
    noticeboard: {
      w: 2, h: 1, up: 20,
      draw(P, v) {
        const wd = MEADOW.wood;
        P.shadow(16, 35, 14, 2);
        P(3, 10, 2, 26, wd[2]); P(27, 10, 2, 26, wd[2]);
        P(1, 2, 30, 20, wd[2]); P(2, 3, 28, 18, '#a8865a'); P(1, 1, 30, 2, wd[1]);
        P(4, 5, 7, 9, '#efe6d0'); P(5, 6, 5, 4, '#7a5a3a'); P(5, 6, 5, 2, '#82502e'); P(6, 8, 1, 1, '#2e8a7e'); P(8, 8, 1, 1, '#2e8a7e'); P(5, 11, 5, 1, '#a82a2a'); P(5, 13, 4, 1, '#4a3a2a');
        P(13, 4, 6, 7, '#e8dcc0'); P(14, 6, 4, 1, '#4a3a2a'); P(14, 8, 3, 1, '#4a3a2a');
        P(21, 5, 7, 6, '#f0e8d0'); P(22, 7, 5, 1, '#4a3a2a'); P(13, 13, 6, 6, '#e0d0b0'); P(21, 13, 6, 6, '#efe6d0'); P(22, 15, 4, 1, '#a82a2a');
        for (const [x, y] of [[7, 5], [16, 4], [24, 5], [16, 13], [24, 13]]) P.dot(x, y, '#c84a3a');
        if (v === 'guild') { P(12, 0, 8, 3, '#2a5a9a'); P(15, 0, 2, 3, '#e8c050'); }
      }
    },
    well: {
      w: 1, h: 1, up: 16,
      draw(P) {
        const s = MEADOW.stone, wd = MEADOW.wood;
        P.shadow(8, 31, 8, 2);
        P(1, 20, 14, 11, s[0]); P(1, 20, 14, 1, s[1]); for (let y = 23; y < 31; y += 3) P(1, y, 14, 1, s[2]); P.oval(8, 20, 7, 2, '#1a2a3a');
        P(2, 4, 2, 17, wd[2]); P(12, 4, 2, 17, wd[2]); P.tri([0, 6, 8, 0, 16, 6], '#a8402e'); P(0, 6, 16, 1, '#6a2418'); P(4, 9, 8, 1, wd[0]); P(8, 10, 1, 6, '#5a5a62'); P(7, 15, 3, 3, wd[0]);
      }
    },
    bench: {
      w: 2, h: 1, up: 4,
      draw(P) { const wd = MEADOW.wood; P.shadow(16, 19, 14, 2); P(2, 6, 28, 4, wd[0]); P(2, 6, 28, 1, wd[1]); P(4, 10, 2, 8, wd[2]); P(26, 10, 2, 8, wd[2]); P(2, 2, 28, 3, wd[2]); }
    },
    counter: {
      w: 1, h: 1, up: 10,
      size: v => [(v | 0) || 3, 1],
      draw(P, v) {
        const n = ((v | 0) || 3) * 16, wd = MEADOW.wood;
        P.shadow(n / 2, 25, n / 2 - 1, 2);
        P(0, 10, n, 4, wd[1]); P(0, 10, n, 1, '#d8a870'); P(0, 14, n, 12, wd[0]); P(0, 14, n, 1, wd[2]);
        for (let x = 4; x < n - 4; x += 12) { P(x, 16, 8, 8, wd[2]); P(x + 1, 17, 6, 6, wd[0]); }
        P(6, 6, 4, 4, '#e8dcc0'); P(n - 14, 5, 3, 5, '#7a4a2a'); P(n - 10, 7, 4, 3, '#c8a050');
      }
    },
    tavtable: {
      w: 2, h: 1, up: 8,
      draw(P, v) {
        const wd = MEADOW.wood;
        P.shadow(16, 25, 15, 2);
        P(1, 8, 30, 6, wd[1]); P(1, 8, 30, 1, '#d8a870'); P(1, 14, 30, 2, wd[2]); P(3, 16, 2, 8, wd[2]); P(27, 16, 2, 8, wd[2]);
        for (const x of [5, 13, 23]) { P(x, 4, 4, 5, '#c8b890'); P(x, 4, 4, 1, '#ffffff'); P(x + 4, 5, 1, 3, '#a89870'); }
        if (v === 'feast') { P.oval(17, 8, 4, 2, '#e8dcc0'); P.oval(17, 7, 3, 1, '#c86a3a'); }
        for (const x of [-2, 30]) { P(x + 1, 18, 4, 2, wd[0]); P(x + 2, 20, 2, 5, wd[2]); }
      }
    },
    barrels: {
      w: 1, h: 1, up: 12,
      draw(P) { const wd = MEADOW.wood; P.shadow(8, 27, 7, 2); P(2, 10, 12, 17, wd[0]); P(2, 10, 2, 17, wd[1]); P(12, 10, 2, 17, wd[2]); P.oval(8, 10, 6, 2, wd[1]); P.oval(8, 10, 4, 1, wd[2]); P(2, 14, 12, 1, '#4a4a52'); P(2, 22, 12, 1, '#4a4a52'); P(6, 3, 6, 8, wd[0]); P.oval(9, 3, 3, 1, wd[1]); }
    },
    hay: {
      w: 2, h: 1, up: 10,
      draw(P) { P.shadow(16, 25, 15, 2); P.oval(16, 16, 15, 9, '#c8a03a'); P.oval(16, 14, 13, 7, '#e0bc54'); P.oval(12, 11, 6, 3, '#f4d878'); for (let i = 0; i < 9; i++) P.line(4 + i * 3, 10 + (i % 3), 5 + i * 3, 23, '#a8822a'); }
    },
    trough: {
      w: 2, h: 1, up: 4,
      draw(P) { const wd = MEADOW.wood; P.shadow(16, 21, 15, 2); P(1, 8, 30, 10, wd[2]); P(2, 9, 28, 3, MEADOW.water[0]); P(1, 12, 30, 6, wd[0]); P(1, 12, 30, 1, wd[1]); P(3, 18, 2, 3, wd[2]); P(27, 18, 2, 3, wd[2]); }
    },
    cauldron: {
      w: 1, h: 1, up: 10,
      draw(P) { P.shadow(8, 25, 7, 2); P.oval(8, 17, 7, 7, '#2a2a32'); P.oval(8, 12, 6, 2, '#5ad8a0'); P.oval(7, 11, 2, 1, '#c8ffe8'); P(2, 22, 2, 3, '#1a1a20'); P(12, 22, 2, 3, '#1a1a20'); P.dot(10, 7, '#8affc8'); P.dot(6, 4, '#8affc8'); },
      lights: () => [[8, 2, 18, '#5ad8a0', 0.22, true]]
    },
    chandelier: {
      w: 1, h: 1, up: 40,
      draw(P) { P(7, 0, 2, 10, '#2a2420'); P.oval(8, 12, 7, 2, '#2a2420'); for (const x of [2, 8, 14]) { P(x, 8, 1, 3, '#f4ecd8'); P.dot(x, 7, '#ffd890'); } },
      lights: () => [[8, -26, 46, '#ffd890', 0.16]]
    },
    axgate: {
      w: 4, h: 3, up: 26,
      draw(P) {
        const [b, hi, dk, deep] = MEADOW.stone, wd = MEADOW.wood;
        for (const tx of [0, 50]) {
          P(tx, 6, 14, 68, b); P(tx, 6, 14, 1, hi); P(tx, 6, 1, 68, hi); P(tx + 13, 6, 1, 68, dk);
          for (let y = 10; y < 74; y += 6) P(tx + 1, y, 12, 1, dk);
          P.tri([tx - 2, 7, tx + 7, 0, tx + 16, 7], '#b8503a'); P.tri([tx + 7, 0, tx + 7, 7, tx + 16, 7], '#8a3a2a'); P(tx - 2, 7, 18, 1, '#6a2a1e');
          P(tx + 5, 18, 4, 7, '#1a1410'); P(tx + 4, 17, 6, 1, hi);
        }
        P(14, 14, 36, 60, b);
        for (let y = 14; y < 32; y += 5) { P(14, y, 36, 1, dk); }
        P(14, 14, 36, 1, hi);
        for (let x = 0; x < 30; x++) { const k = (x - 14.5) / 15, top = 34 - Math.round(12 * Math.sqrt(Math.max(0, 1 - k * k))); P(17 + x, top, 1, 74 - top, '#20160e'); }
        for (let x = 0; x < 28; x++) { const k = (x - 13.5) / 14, top = 35 - Math.round(11 * Math.sqrt(Math.max(0, 1 - k * k))); P(18 + x, top + 1, 1, 73 - top, wd[0]); if (x % 4 === 1) P(18 + x, top + 1, 1, 73 - top, wd[2]); }
        P(31, 23, 2, 51, '#2a1c12'); P(18, 44, 28, 2, '#3a3a40'); P(18, 60, 28, 2, '#3a3a40');
        for (const x of [21, 27, 37, 43]) { P(x, 44, 1, 2, '#9a9aa8'); P(x, 60, 1, 2, '#9a9aa8'); }
        P(28, 50, 2, 3, '#c8a050'); P(34, 50, 2, 3, '#c8a050');
        P(24, 4, 16, 9, '#2a5a9a'); P(24, 4, 16, 1, '#4a7ac8'); P(29, 6, 6, 4, '#e8c050'); P(31, 5, 2, 6, '#e8c050');
        P(14, 73, 36, 1, deep);
      }
    },
    express: {
      w: 18, h: 3, up: 18,
      draw(P) {
        const gy = 64, rail = '#d8b060';
        P(0, gy - 4, 288, 2, '#6a5a3a'); P(0, gy - 4, 288, 1, rail); P(0, gy - 1, 288, 1, '#8ae0ff');
        for (let x = 2; x < 288; x += 7) P(x, gy - 2, 4, 2, '#4a3a2a');
        const car = (x0, w, door) => {
          P(x0 + 2, 20, w - 4, 4, '#1a1214'); P(x0 + 4, 18, w - 8, 2, '#2a2024'); P(x0 + 6, 18, w - 12, 1, '#4a3a3e');
          P(x0, 24, w, 30, '#7a1c22'); P(x0, 24, w, 1, '#b84a3a'); P(x0, 46, w, 8, '#4a1014'); P(x0, 44, w, 2, '#d8b060'); P(x0, 26, w, 1, '#d8b060');
          P(x0, 24, 1, 30, '#3a0c10'); P(x0 + w - 1, 24, 1, 30, '#3a0c10');
          for (let i = 0; i < 5; i++) {
            const wx = x0 + 6 + i * Math.floor((w - 12) / 5);
            if (door && i === 2) { P(wx - 1, 28, 12, 26, '#2a0e0e'); P(wx, 29, 10, 25, '#5a1418'); P(wx + 4, 29, 2, 25, '#2a0e0e'); P(wx + 7, 40, 1, 3, '#d8b060'); continue; }
            P(wx, 29, 10, 11, '#2a0e0e'); P(wx + 1, 30, 8, 9, '#ffe8a0'); P(wx + 1, 30, 8, 2, '#fff8d8'); P(wx + 5, 30, 1, 9, '#2a0e0e');
          }
          for (const wx of [x0 + 10, x0 + 22, x0 + w - 30, x0 + w - 18]) { P.oval(wx + 4, 57, 4, 4, '#1a1a22'); P.oval(wx + 4, 57, 2, 2, '#8a8a96'); P.dot(wx + 4, 57, '#d8b060'); }
          P(x0 + 8, 54, w - 16, 2, '#1a1214');
        };
        car(2, 94, false); car(100, 96, true);
        const lx = 200;
        P(lx, 24, 62, 30, '#1e1a22'); P(lx, 24, 62, 1, '#4a4452'); P(lx, 44, 62, 2, '#d8b060'); P(lx, 30, 62, 1, '#d8b060');
        P(lx + 4, 14, 22, 12, '#1e1a22'); P(lx + 6, 16, 18, 8, '#ffe8a0'); P(lx + 14, 16, 2, 8, '#1e1a22'); P(lx + 4, 14, 22, 1, '#d8b060');
        P(lx + 36, 10, 8, 14, '#2a2430'); P(lx + 34, 8, 12, 3, '#d8b060');
        P.tri([lx + 62, 24, lx + 84, 46, lx + 62, 54], '#1e1a22'); P.tri([lx + 62, 30, lx + 78, 46, lx + 62, 46], '#2e2834');
        P.line(lx + 62, 24, lx + 84, 46, '#d8b060');
        P.oval(lx + 70, 34, 5, 5, '#d8b060'); P.oval(lx + 70, 34, 4, 4, '#fff4c8'); P.oval(lx + 69, 33, 2, 2, '#ffffff');
        P.tri([lx + 66, 54, lx + 86, 54, lx + 86, 60], '#6a6a76'); P.line(lx + 66, 54, lx + 86, 60, '#9a9aa8');
        for (const wx of [lx + 6, lx + 22, lx + 40]) { P.oval(wx + 5, 56, 6, 6, '#1a1a22'); P.oval(wx + 5, 56, 3, 3, '#8a8a96'); P.dot(wx + 5, 56, '#d8b060'); }
        P(96, 30, 4, 20, '#2a2024'); P(196, 30, 4, 20, '#2a2024');
      },
      lights: () => [[270, 34, 40, '#fff4c8', 0.35, true], [150, 34, 30, '#ffe8a0', 0.18], [50, 34, 30, '#ffe8a0', 0.18]]
    },
    reeds: {
      w: 1, h: 1, up: 10,
      draw(P, v) {
        const n = v === 'big' ? 5 : 3;
        for (let i = 0; i < n; i++) { const x = 2 + i * 3, h = 12 + (i % 2) * 6; P(x, 26 - h, 1, h, '#4a7a2a'); P(x, 26 - h, 1, 3, '#6a4a2a'); P(x, 26 - h + 1, 1, 1, '#8a6a3a'); }
        P.line(1, 20, 4, 14, '#5a8a32'); P.line(14, 21, 11, 13, '#5a8a32');
      }
    },
    bush: {
      w: 1, h: 1, up: 6,
      draw(P, v) {
        const [b, hi, dk] = MEADOW.leaf;
        P.shadow(8, 21, 7, 2);
        P.oval(8, 15, 7, 6, dk); P.oval(6, 13, 4, 3, b); P.oval(11, 14, 3, 3, b); P.oval(6, 12, 2, 1, hi);
        if (v === 'berry') { P.dot(4, 15, '#d83a6a'); P.dot(10, 12, '#d83a6a'); P.dot(12, 16, '#d83a6a'); }
      }
    },
    rocks: {
      w: 1, h: 1, up: 2,
      draw(P) {
        const s = MEADOW.stone;
        P.shadow(8, 16, 7, 2);
        P.oval(6, 12, 5, 4, s[2]); P.oval(6, 11, 4, 3, s[0]); P.oval(5, 10, 2, 1, s[1]);
        P.oval(12, 14, 3, 2, s[2]); P.oval(12, 13, 2, 1, s[0]);
      }
    },
    cart: {
      w: 2, h: 1, up: 10,
      draw(P) {
        const [b, hi, dk] = MEADOW.wood;
        P.shadow(16, 25, 15, 2);
        P(2, 10, 26, 9, b); P(2, 10, 26, 1, hi); P(2, 18, 26, 1, dk); for (let x = 5; x < 28; x += 6) P(x, 11, 1, 7, dk);
        P(4, 6, 8, 5, '#c8a03a'); P(14, 5, 10, 6, '#c8a03a'); P(5, 6, 6, 1, '#f4d878'); P(15, 5, 8, 1, '#f4d878');
        P.line(28, 15, 32, 20, dk);
        for (const wx of [8, 22]) { P.oval(wx, 20, 4, 4, dk); P.ring(wx, 20, 4, 4, '#3a2616'); P.dot(wx, 20, hi); }
      }
    }
  };

  const LAYER = {
    porch(P, v, Z) {
      const w = ((v | 0) || 3) * 16, wd = MEADOW.wood;
      P(0, 4, w, 6, '#5a3a2a'); P(0, 4, w, 1, '#8a5a3e'); P(-2, 8, w + 4, 3, '#7a4a30');
      for (const x of [2, w - 6]) { P(x, 10, 4, 22, wd[0]); P(x, 10, 1, 22, wd[1]); }
      P(0, 30, w, 2, Z.stone ? Z.stone[2] : '#6a6252');
    },
    sign(P, v) {
      const wd = MEADOW.wood;
      P(2, 0, 28, 1, '#2a2420'); P(6, 1, 1, 2, '#2a2420'); P(25, 1, 1, 2, '#2a2420');
      P(3, 3, 26, 11, wd[2]); P(4, 4, 24, 9, wd[0]); P(4, 4, 24, 1, wd[1]);
      switch (v) {
        case 'guild': P(9, 6, 14, 5, '#2a5a9a'); P.line(10, 5, 22, 12, '#d8dce4'); P.line(22, 5, 10, 12, '#d8dce4'); P(14, 6, 4, 6, '#e8c050'); break;
        case 'wiz': P(14, 5, 4, 2, '#e8e0d0'); P.oval(16, 9, 4, 3, '#a85ad8'); P.dot(15, 8, '#ffffff'); P(9, 7, 3, 1, '#e8c050'); P(20, 7, 3, 1, '#e8c050'); break;
        case 'axis': P.oval(16, 9, 3, 3, '#3a8ad8'); P.tri([13, 8, 16, 4, 19, 8], '#3a8ad8'); P.dot(15, 8, '#ffffff'); break;
        case 'bath': P(10, 9, 12, 3, '#3a8ad8'); for (const x of [11, 15, 19]) { P(x, 5, 1, 3, '#f4f4f8'); P(x + 1, 4, 1, 2, '#f4f4f8'); } break;
        case 'stable': P.arc(16, 9, 4, 4, Math.PI * 0.85, Math.PI * 2.15, '#8a8a96'); P.arc(16, 9, 3, 3, Math.PI * 0.85, Math.PI * 2.15, '#8a8a96'); break;
        case 'cafe': P.oval(14, 8, 2, 2, '#d83a6a'); P.oval(18, 8, 2, 2, '#d83a6a'); P.tri([12, 9, 20, 9, 16, 12], '#d83a6a'); break;
        default: P(8, 8, 16, 1, '#3a2614');
      }
    },
    banner(P, v) {
      const c = v === 'axis' ? ['#3a6ac8', '#f4f4f8'] : ['#2a5a9a', '#e8c050'];
      P(4, 0, 8, 1, '#2a2420'); P(5, 1, 6, 22, c[0]); P(5, 1, 6, 1, c[1]); P(7, 6, 2, 8, c[1]); P(5, 9, 6, 2, c[1]); P.tri([5, 23, 8, 19, 11, 23], c[0]);
    },
    questboard(P) {
      const wd = MEADOW.wood;
      P(0, 1, 48, 15, wd[2]); P(1, 2, 46, 13, '#a8865a'); P(0, 1, 48, 1, wd[1]);
      const papers = [[3, 3, 7, 8], [12, 4, 6, 6], [20, 3, 8, 9], [30, 4, 6, 7], [38, 3, 7, 8], [11, 11, 5, 3], [29, 12, 6, 3]];
      papers.forEach(([x, y, w, h], i) => { P(x, y, w, h, i % 3 ? '#efe6d0' : '#e0d0b0'); P(x + 1, y + 2, w - 2, 1, '#4a3a2a'); P(x + 1, y + 4, w - 3, 1, i === 2 ? '#a82a2a' : '#4a3a2a'); P.dot(x + Math.floor(w / 2), y, '#c84a3a'); });
    },
    fireplace(P) {
      const s = MEADOW.stone;
      P(0, 0, 32, 30, s[0]); P(0, 0, 32, 2, s[1]); for (let y = 4; y < 30; y += 5) P(0, y, 32, 1, s[2]);
      P(6, 10, 20, 20, '#1a120c'); P.oval(16, 10, 10, 4, '#1a120c');
      P.tri([10, 30, 16, 16, 22, 30], '#e8642a'); P.tri([13, 30, 16, 20, 19, 30], '#ffd040'); P(8, 28, 16, 2, '#5a3a24');
      P(-2, 8, 36, 3, MEADOW.wood[0]); P(-2, 8, 36, 1, MEADOW.wood[1]);
    },
    emblem(P, v) {
      P.oval(16, 8, 9, 8, '#2a5a9a'); P.oval(16, 8, 7, 6, '#3a7ac8'); P.line(11, 4, 21, 13, '#d8dce4'); P.line(21, 4, 11, 13, '#d8dce4'); P(14, 5, 4, 7, '#e8c050');
      if (v === 'wiz') { P.oval(16, 8, 9, 8, '#4e3c80'); P.oval(16, 8, 7, 6, '#6a54a8'); P.oval(16, 9, 3, 3, '#a8e8ff'); P(15, 4, 2, 3, '#e8e0d0'); }
    },
    rugtile(P, v) {
      const [w, h] = (v || '3x2').split('x').map(Number), R = ROOM.rug;
      P(0, 0, w * U, h * U, R[2]); P(2, 2, w * U - 4, h * U - 4, R[0]); P(4, 4, w * U - 8, 1, R[1]); P(4, h * U - 5, w * U - 8, 1, R[1]); P(4, 4, 1, h * U - 8, R[1]); P(w * U - 5, 4, 1, h * U - 8, R[1]);
    },
    crater(P, v) {
      const [w, h] = (v || '3x2').split('x').map(Number), cx = w * 8, cy = h * 8, d = MEADOW.dirt;
      P.oval(cx, cy, w * 8 - 1, h * 8 - 1, d[1]);
      P.oval(cx, cy, w * 8 - 3, h * 8 - 3, d[0]);
      P.oval(cx, cy + 1, w * 6 - 2, h * 6 - 2, d[2]);
      P.oval(cx, cy + 2, w * 4 - 2, h * 4 - 2, '#4a3624');
      P.oval(cx - 2, cy + 1, w * 2, h * 2 - 1, '#3a2a1a');
      for (let i = 0; i < w * 3; i++) { const a = hash(i, w, 241) * Math.PI * 2, rr = 0.8 + hash(i, h, 243) * 0.25; P(Math.round(cx + Math.cos(a) * w * 8 * rr), Math.round(cy + Math.sin(a) * h * 8 * rr), 2, 1, d[2]); }
    },
    flowers(P, v) {
      const n = (v | 0) || 6, Z = MEADOW;
      for (let i = 0; i < n; i++) { const x = Math.floor(hash(i, n, 245) * 30) + 1, y = Math.floor(hash(n, i, 247) * 14) + 1, c = Z.bloom[i % Z.bloom.length]; P(x, y + 1, 1, 2, Z.grass[2]); P(x - 1, y, 3, 1, c); P(x, y - 1, 1, 3, c); }
    }
  };
  const LAYER_SIZE = { porch: [3, 2], crater: [3, 2], flowers: [2, 1], sign: [2, 1], banner: [1, 2], questboard: [3, 1], fireplace: [2, 2], emblem: [2, 1], rugtile: [3, 2] };
  const LAYER_LIGHT = { fireplace: () => [[16, 22, 30, '#ff9a4a', 0.3, true]] };

  const KIT = { LANDS, DECOR, LAYER, LAYER_LIGHT, BUILD, PROPS, floorPaint, roofTile, faceTile, rockFace, rockTop, propSprite, outside: 'belzerg', fallback: 'meadow' };

  function grassTex(P, e) { grass(P, MEADOW, Object.assign({ same: { u: true, d: true, l: true, r: true } }, e)); }

  Object.assign(G.THEMES, {
    meadow: { bg: '#2e5a24', fl: ['#6cae3e', '#8cca52', '#4c8c2c', '#3a7424'], fl2: ['#5ea438', '#7ec24e', '#3e7e24'], fl3: ['#9a7a4e', '#b8966a', '#6e5434'], top: ['#2e6a2a', '#46883a', '#1e4a1e'], face: ['#9a7a54', '#b89470', '#6a5238', '#4a3826'], accent: '#ffe060', accentDk: '#8a6a20', light: '#fff8d0', tex: grassTex }
  });

  function roofComponents(map) {
    const out = {}, seen = new Set(), isHouse = (x, y) => x >= 0 && y >= 0 && x < map.w && y < map.h && BUILD.has(G.tileKindAt(map, x, y));
    let n = 0;
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      const k = y * 4096 + x;
      if (seen.has(k) || !isHouse(x, y)) continue;
      const col = map.def.roofs && map.def.roofs[n] != null ? map.def.roofs[n] : Math.floor(hash(n, x, 237) * ROOFS.length);
      n++;
      const st = [[x, y]];
      seen.add(k);
      while (st.length) {
        const [cx, cy] = st.pop();
        out[cy * 4096 + cx] = col;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy, nk = ny * 4096 + nx; if (!seen.has(nk) && isHouse(nx, ny)) { seen.add(nk); st.push([nx, ny]); } }
      }
    }
    return out;
  }

  function buildLayer(map) {
    roofOf = LANDS[map.def.land] && LANDS[map.def.land].house === 'timber' ? roofComponents(map) : null;
    try { return J().buildLayer(map, KIT); } finally { roofOf = null; }
  }

  function toad(p, main, hi, dk, crown) {
    const belly = '#e0d8a0', bellyDk = '#b8b078';
    p.ell(dk, 20, 76, 18, 15); p.ell(dk, 80, 76, 18, 15);
    p.ell(main, 21, 74, 16, 13); p.ell(main, 79, 74, 16, 13); p.ell(hi, 17, 69, 7, 5); p.ell(hi, 75, 69, 7, 5);
    p.ell(dk, 50, 67, 39, 29); p.ell(main, 50, 65, 37, 27);
    p.ell(bellyDk, 50, 78, 27, 15); p.ell(belly, 50, 77, 25, 13);
    p.ell(main, 50, 46, 31, 18); p.ell(hi, 44, 38, 16, 6);
    for (const [x, y, r] of [[30, 58, 4], [66, 60, 5], [56, 44, 3], [40, 50, 3], [74, 48, 3]]) p.ell(dk, x, y, r, r * 0.8);
    p.ell(dk, 32, 31, 10, 9); p.ell(dk, 68, 31, 10, 9); p.ell(main, 32, 30, 9, 8); p.ell(main, 68, 30, 9, 8);
    p.ell('#f4e8a0', 32, 29, 6, 5.5); p.ell('#f4e8a0', 68, 29, 6, 5.5); p.ell('#1a1a10', 32, 30, 3.8, 2.4); p.ell('#1a1a10', 68, 30, 3.8, 2.4);
    p.snap('#ffffff', 29.6, 27, 1.6, 1.2); p.snap('#ffffff', 65.6, 27, 1.6, 1.2);
    p.poly(dk, [20, 51, 50, 57, 80, 51, 80, 54, 50, 61, 20, 54]);
    p.poly('#c86a6a', [34, 56, 50, 59, 66, 56, 50, 60]);
    p.snap(dk, 45, 42, 2, 1.2); p.snap(dk, 53, 42, 2, 1.2);
    p.ell(dk, 34, 92, 10, 5); p.ell(dk, 66, 92, 10, 5); p.ell(main, 34, 91, 9, 4); p.ell(main, 66, 91, 9, 4);
    for (const x of [27, 34, 41, 59, 66, 73]) p.ell(hi, x, 93, 2.2, 1.6);
    if (crown) { p.poly('#f8e070', [36, 22, 40, 12, 46, 20, 50, 8, 54, 20, 60, 12, 64, 22]); p.ell('#d83a3a', 50, 18, 2, 2); }
  }

  function gator(p, main, hi, dk, big) {
    const belly = '#c8c890', teeth = '#f4f0e0';
    p.poly(dk, [60, 70, 96, 62, 99, 70, 70, 82]); p.poly(main, [60, 70, 94, 64, 96, 69, 68, 79]);
    for (const x of [72, 80, 88]) p.poly(dk, [x, 66, x + 3, 61, x + 6, 66]);
    p.ell(dk, 52, 74, 30, 15); p.ell(main, 52, 72, 28, 13); p.ell(belly, 50, 79, 20, 5);
    for (const x of [40, 50, 60]) p.poly(dk, [x - 3, 61, x, 55, x + 3, 61]);
    p.ell(dk, 30, 90, 7, 4); p.ell(dk, 70, 90, 7, 4); p.ell(main, 30, 88, 6, 4); p.ell(main, 70, 88, 6, 4);
    p.poly(dk, [36, 60, 4, 70, 4, 84, 36, 82]);
    p.poly(main, [36, 61, 6, 70, 6, 76, 36, 74]);
    p.poly('#8a2a2a', [36, 74, 6, 76, 6, 80, 36, 80]);
    p.poly(main, [36, 80, 6, 80, 5, 84, 36, 84]);
    for (let x = 8; x < 34; x += 4) { p.poly(teeth, [x, 76, x + 2, 76, x + 1, 79]); p.poly(teeth, [x + 1, 80, x + 3, 80, x + 2, 77]); }
    p.ell(main, 30, 58, 6, 5); p.ell(main, 40, 58, 6, 5);
    p.ell('#f0d040', 30, 57, 3.5, 3); p.ell('#f0d040', 40, 57, 3.5, 3); p.ell('#1a1a10', 30, 57, 1, 2.6); p.ell('#1a1a10', 40, 57, 1, 2.6);
    p.ell(hi, 48, 66, 12, 3); p.ell(hi, 20, 66, 8, 2);
    if (big) { for (const x of [26, 46, 66, 86]) p.poly('#c8a050', [x - 2, 60 - (x > 60 ? 0 : 4), x, 52, x + 2, 60]); p.ell('#5a1a1a', 52, 70, 6, 3); }
  }

  function goblin(p, skin, cloth, shaman) {
    const dk = '#1e2a14', bone = '#e8e0c8';
    p.poly(dk, [40, 64, 36, 92, 44, 92, 48, 70, 52, 70, 56, 92, 64, 92, 60, 64]);
    p.poly(skin, [42, 66, 39, 90, 44, 90, 48, 70]); p.poly(skin, [58, 66, 61, 90, 56, 90, 52, 70]);
    p.poly(cloth, [36, 58, 64, 58, 66, 72, 34, 72]);
    p.ell(dk, 50, 50, 15, 13); p.ell(skin, 50, 49, 13, 11);
    p.ell(skin, 50, 30, 15, 13); p.poly(skin, [35, 28, 18, 18, 36, 34]); p.poly(skin, [65, 28, 82, 18, 64, 34]);
    p.ell('#ffe040', 44, 30, 3, 2.4); p.ell('#ffe040', 56, 30, 3, 2.4); p.ell('#1a1a10', 44, 30, 1.2, 1.6); p.ell('#1a1a10', 56, 30, 1.2, 1.6);
    p.poly(dk, [42, 38, 58, 38, 54, 42, 46, 42]); p.poly(bone, [45, 38, 47, 38, 46, 41]); p.poly(bone, [53, 38, 55, 38, 54, 41]);
    p.poly(skin, [34, 46, 22, 60, 26, 64, 38, 52]); p.poly(skin, [66, 46, 76, 58, 72, 62, 62, 52]);
    if (shaman) {
      p.rect('#6a4a2a', 76, 20, 3, 56); p.ell('#5ad8a0', 77, 18, 5, 5); p.ell('#c8ffe8', 76, 17, 2, 2);
      for (const [x, c] of [[40, '#d83a3a'], [46, '#e8c040'], [52, '#3a8ad8'], [58, '#d83a3a']]) p.poly(c, [x, 20, x + 3, 6, x + 5, 20]);
      p.poly('#7a5a8a', [36, 58, 64, 58, 68, 86, 32, 86]);
    } else { p.poly('#8a6a3a', [18, 62, 26, 56, 14, 38, 8, 42]); p.ell('#6a4a2a', 10, 40, 5, 6); }
  }

  function vdoll(p) {
    const suit = '#1e2040', white = '#f4f2ee', blk = '#18161e';
    p.poly(suit, [36, 60, 64, 60, 66, 90, 34, 90]); p.poly(white, [46, 60, 54, 60, 50, 74]); p.poly('#e0d890', [48, 62, 52, 62, 50, 70]);
    p.rect(suit, 38, 88, 8, 6); p.rect(suit, 54, 88, 8, 6); p.ell(blk, 42, 95, 6, 2); p.ell(blk, 58, 95, 6, 2);
    p.poly(suit, [36, 62, 26, 80, 30, 82, 40, 68]); p.poly(suit, [64, 62, 74, 80, 70, 82, 60, 68]); p.ell(white, 28, 82, 4, 4); p.ell(white, 72, 82, 4, 4);
    p.ell('#f0d6c2', 50, 40, 20, 20); p.poly('#262a48', [30, 34, 40, 18, 60, 18, 70, 34, 64, 26, 36, 26]);
    p.poly(blk, [31, 32, 50, 28, 50, 48, 36, 46]); p.poly(white, [50, 28, 69, 32, 64, 46, 50, 48]);
    p.ell('#d83a3a', 42, 39, 3, 2.4); p.ell('#d83a3a', 58, 39, 3, 2.4);
    p.rect(blk, 56, 30, 1.6, 6); p.rect(blk, 59, 30, 1.6, 6);
    p.poly('#8a2a2a', [44, 52, 56, 52, 50, 56]);
  }

  function protoArt(p) {
    const st = ['#6e6e7a', '#8e8e9a', '#4a4a56', '#2e2e38'];
    for (const [x0, x1, y1] of [[30, 4, 92], [34, 12, 96], [66, 88, 96], [70, 96, 92]]) { p.poly(st[2], [x0, 56, x0 + 4, 58, x1 + 3, y1 - 26, x1, y1 - 24]); p.poly(st[3], [x1 - 2, y1 - 26, x1 + 4, y1 - 26, x1 + 2, y1, x1 - 1, y1]); }
    for (const [x0, x1] of [[28, 0], [72, 100]]) p.poly(st[2], [x0, 50, x0 + 3, 54, x1, 40, x1 + (x1 ? -3 : 3), 36]);
    p.ell(st[3], 50, 52, 36, 26); p.ell(st[0], 50, 50, 34, 24); p.ell(st[1], 44, 40, 20, 10);
    for (const x of [26, 38, 50, 62, 74]) p.rect(st[2], x - 3, 58, 6, 2);
    p.rect(st[2], 34, 18, 32, 12); p.rect(st[0], 36, 16, 28, 4);
    for (const x of [38, 48, 58]) { p.rect(st[2], x, 10, 5, 8); p.rect(st[1], x + 1, 8, 3, 2); }
    p.ell(st[3], 50, 50, 9, 8); p.ell('#c85aff', 50, 50, 6, 5); p.ell('#f4d8ff', 49, 48, 2, 2);
    p.ell(st[2], 50, 68, 12, 6); p.ell('#ff3a2a', 50, 68, 8, 4); p.ell('#ffd0c0', 48, 67, 2.4, 1.4);
  }

  function turretArt(p) {
    const st = ['#7a7468', '#9a9488', '#4e4a42', '#2e2a26'];
    p.rect(st[3], 30, 86, 40, 8); p.rect(st[2], 32, 50, 36, 38); p.rect(st[0], 34, 50, 32, 36); p.rect(st[1], 34, 50, 32, 3);
    for (let y = 58; y < 86; y += 8) p.rect(st[2], 34, y, 32, 1);
    p.ell(st[2], 50, 46, 20, 12); p.ell(st[0], 50, 44, 18, 10);
    p.poly(st[3], [46, 40, 54, 40, 80, 30, 80, 38]); p.ell('#1a1a1a', 80, 34, 3, 4);
    p.ell('#ff6a3a', 44, 44, 3, 2.4); p.ell('#ffd0a0', 43, 43, 1, 1);
  }

  function spiderArt(p) {
    const st = ['#5a5a66', '#7a7a86', '#34343e', '#1e1e26'];
    for (const [a, b, c] of [[34, 14, 86], [38, 22, 92], [62, 78, 92], [66, 86, 86]]) { p.poly(st[2], [a, 66, a + 3, 68, b + 2, 74, b, 72]); p.poly(st[3], [b, 72, b + 3, 72, c > 88 ? b + 1 : b - 2, c, b - 3, c]); }
    p.ell(st[3], 50, 70, 18, 12); p.ell(st[0], 50, 68, 16, 10); p.ell(st[1], 46, 64, 8, 4);
    p.ell(st[2], 50, 56, 10, 8); p.ell('#ff3a2a', 46, 56, 2, 2); p.ell('#ff3a2a', 54, 56, 2, 2); p.ell('#ff3a2a', 50, 52, 1.6, 1.6);
  }

  const FOES = {
    ks_proto(p) { protoArt(p); },
    ks_turret(p) { turretArt(p); },
    ks_spider(p) { spiderArt(p); },
    ks_goblin(p) { goblin(p, '#6a9a3a', '#7a5a3a'); },
    ks_goblin_shaman(p) { goblin(p, '#5a8a4a', '#5a4a6a', true); },
    ks_doll(p) { vdoll(p); },
    ks_gator(p) { gator(p, '#4a6a32', '#6a8a48', '#26381a'); },
    ks_gator_big(p) { gator(p, '#3a4a2a', '#5a6a40', '#1a2414', true); },
    ks_toad(p) { toad(p, '#5a9a3a', '#8ac85a', '#2e5a22'); },
    ks_toad_blue(p) { toad(p, '#3a6aa8', '#6a9ad8', '#1e3a6a'); },
    ks_toad_gold(p) { toad(p, '#c8a030', '#f0d060', '#7a5a10', true); }
  };
  Object.assign(G.FOE_ART, FOES);
  Object.assign(G.FOE_META, { ks_toad: { icon: [50, 38, 26] }, ks_toad_blue: { icon: [50, 38, 26] }, ks_toad_gold: { icon: [50, 34, 28] }, ks_gator: { icon: [28, 68, 22] }, ks_gator_big: { icon: [28, 68, 22] }, ks_goblin: { icon: [50, 32, 18] }, ks_goblin_shaman: { icon: [50, 30, 18] }, ks_doll: { icon: [50, 38, 20] }, ks_proto: { icon: [50, 50, 30] }, ks_turret: { icon: [52, 44, 20] }, ks_spider: { icon: [50, 62, 18] } });

  H.Axel = { LANDS, DECOR, LAYER, LAYER_SIZE, KIT, buildLayer };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
