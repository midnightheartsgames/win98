(function (O) {
  'use strict';

  const flipNS = str => str.replace(/[ns]/g, c => (c === 'n' ? 's' : 'n'));
  const flipRoof = r => (r === 'shed-n' ? 'shed-s' : r === 'shed-s' ? 'shed-n' : r);

  function mirror(B, s) {
    const Z = z => z * s;
    const yaw = y => (s > 0 ? y : Math.PI - y);
    const dir = d => (s > 0 ? d : d === 'z+' ? 'z-' : d === 'z-' ? 'z+' : d);
    const face = f => (s > 0 ? f : f === 'n' ? 's' : f === 's' ? 'n' : f);
    return {
      s,
      box: (x0, y0, z0, x1, y1, z1, mat, o) => B.box(x0, y0, Z(z0), x1, y1, Z(z1), mat, o),
      floor: (x0, z0, x1, z1, y, mat, o) => B.floor(x0, Z(z0), x1, Z(z1), y, mat, o),
      slab: (x0, z0, x1, z1, y, t, mat, o) => B.slab(x0, Z(z0), x1, Z(z1), y, t, mat, o),
      house(x0, z0, x1, z1, h, mat, o = {}) {
        const oo = Object.assign({}, o);
        if (s < 0 && o.win && o.win.sides) oo.win = Object.assign({}, o.win, { sides: flipNS(o.win.sides) });
        if (s < 0 && o.roof) oo.roof = flipRoof(o.roof);
        return B.house(x0, Z(z0), x1, Z(z1), h, mat, oo);
      },
      stairs: (x0, z0, x1, z1, lo, hi, d, mat, o) => B.stairs(x0, Z(z0), x1, Z(z1), lo, hi, dir(d), mat, o),
      ramp: (x0, z0, x1, z1, lo, hi, d, mat, o) => B.ramp(x0, Z(z0), x1, Z(z1), lo, hi, dir(d), mat, o),
      rail: (x0, z0, x1, z1, y, mat, o) => B.rail(Math.min(x0, x1), Math.min(Z(z0), Z(z1)), Math.max(x0, x1), Math.max(Z(z0), Z(z1)), y, mat, o),
      wall(x0, z0, x1, z1, h, t, mat, o = {}) {
        if (s > 0 || z0 === z1) return B.wall(x0, Z(z0), x1, Z(z1), h, t, mat, o);
        const L = Math.abs(z1 - z0);
        const holes = (o.holes || []).map(q => [L - q[1], L - q[0], q[2], q[3]]);
        return B.wall(x0, Z(z1), x1, Z(z0), h, t, mat, Object.assign({}, o, { holes }));
      },
      cyl: (x, z, y0, y1, r, mat, o) => B.cyl(x, Z(z), y0, y1, r, mat, o),
      prop(type, x, z, o = {}) {
        const oo = Object.assign({}, o, { yaw: yaw(o.yaw || 0) });
        if (o.to) oo.to = [o.to[0], o.to[1] * s];
        return B.prop(type, x, Z(z), oo);
      },
      healthPack: (x, z, big, y) => B.healthPack(x, Z(z), big, y),
      hint: (kind, x, z, o) => B.hint(kind, 0, x, Z(z), o),
      light: (x, y, z, c, r, o) => B.light(x, y, Z(z), c, r, o),
      sign: (x, y, z, f, w, h, text, o) => B.sign(x, y, Z(z), face(f), w, h, text, o),
      decal: (x, y, z, f, w, h, tex, o) => B.decal(x, y, Z(z), face(f), w, h, tex, o),
      roof: (x0, z0, x1, z1, y, h, style, mat, o) => B.roof(x0, Z(z0), x1, Z(z1), y, h, s < 0 ? flipRoof(style) : style, mat, o),
      spawnRoom(o) {
        const exits = (o.exits || []).map(e => {
          if (s > 0) return e;
          if (e.side === 'n' || e.side === 's') return Object.assign({}, e, { side: e.side === 'n' ? 's' : 'n' });
          return Object.assign({}, e, { a: o.d - e.b, b: o.d - e.a });
        });
        return B.spawnRoom(Object.assign({}, o, { z: Z(o.z), yaw: yaw(o.yaw || 0), exits, role: s > 0 ? 'att' : 'def', stage: [0, 0] }));
      }
    };
  }

  function sides(B, fn) { fn(mirror(B, 1)); fn(mirror(B, -1)); }

  const IL = { white: [0xffffff, 0xfaf8f2, 0xfcfaf6], blue: 0x2a6ac8, stone: 0xe4d8c0, marble: 0xece6da, sand: 0xe4d8c0 };

  function ilHouse(M, x0, z0, x1, z1, h, o = {}) {
    M.house(x0, z0, x1, z1, h, 'plaster', {
      tint: IL.white[(o.i || 0) % 3], band: { h: 0.3, mat: 'plaster', tint: 0xdcd8d0 }, top: 'plaster', topTint: 0xe8e4dc,
      roof: o.roof, roofMat: o.roof === 'dome' ? 'plaster' : 'roofBlue', roofTint: o.roof === 'dome' ? 0x3a78e0 : IL.blue, roofH: o.roofH || 2, over: 0.2,
      win: { tex: 'shutter', sp: 3, w: 1.1, h: 1.5, fl: 3.4, sill: 1.2, sides: o.sides || 'nsew', lit: 0, tint: 0x4a8ae0 }
    });
  }

  function ilSpawn(M, extra) {
    M.spawnRoom({ x: 0, z: -46, w: 16, d: 12, yaw: 0, exits: [{ side: 'n', a: 5, b: 11 }, { side: 'e', a: 3, b: 9 }].concat(extra || []), mat: 'plaster', tint: 0xf0f0ea });
    M.box(-8, 0, -54, 8, 6, -52, 'plaster', { tint: IL.white[1] });
    ilHouse(M, -34, -54, -8, -40, 7, { i: 1, sides: 'n', roof: 'flat' });
    ilHouse(M, 14, -54, 34, -42, 6, { i: 2, sides: 'nw' });
    M.box(-8, 5.6, -52, 8, 7, -40, 'plaster', { tint: IL.white[0] });
  }

  const ilTheme = {
    skyTop: 0x3a88e0, skyHorizon: 0xd8ecf8, skyLow: 0x7aa8d0, fog: 0xd0e4f0, fogNear: 70, fogFar: 260,
    sun: [0.35, 0.85, -0.3], sunCol: 0xfff6e4, amb: 0xb8c4dc, ground: 0xc8b898,
    skyline: 'hills', skylineTint: 0x9ab0c0, time: 'day', sea: -20, seaCol: 0x2a78c0
  };

  O.MAPS.ilios = {
    id: 'ilios', name: 'ILIOS', mode: 'control', theme: ilTheme,
    stages: [
      {
        name: 'ILIOS: LIGHTHOUSE',
        build(B) {
          B.bounds(-34, -54, 34, 54);
          B.killY(-14);
          B.floor(-30, -54, 34, 54, 0, 'paving', { tint: 0xece8e0 });
          B.box(-33, -26, -54, -30, -0.3, 54, 'rock', { tint: 0xa89a86, uv: 0.6, col: false });
          B.point('A', 0, 0, 7.5);
          B.decal(0, 0.03, 0, 'up', 13, 13, 'marble', { tint: 0xe8e0d0 });
          B.box(18, 0, -10, 34, 3, 10, 'stone', { tint: IL.stone, top: 'paving', topTint: 0xe8e4dc });
          B.prop('lighthouse', 29.5, 0, { col: false, y: 3, s: 1.1 });
          B.box(26.5, 3, -3, 32.5, 24, 3, 'plaster', { vis: false });
          B.prop('planter', -11, 0); B.prop('planter', 11, 0);
          B.prop('tree_olive', -18, 0);
          B.prop('boat', -60, 20, { col: false, y: -20, c: 0xf0f0f0, yaw: 0.6 });
          B.prop('bigrock', -48, -30, { col: false, y: -20, s: 3, c: 0x9a8a78 });
          sides(B, M => {
            ilSpawn(M);
            M.rail(-30, -40, -30, -8, 0, 'plaster', { h: 1.1, t: 0.5, tint: 0xf0ece4 });
            ilHouse(M, -26, -32, -16, -20, 5, { i: 1, sides: 'ne', roof: 'flat' });
            M.stairs(-16, -32, -12, -24, 0, 5, 'z+', 'plaster', { tint: 0xe4e0d8 });
            M.prop('tree_olive', -24, -14);
            M.prop('pot', -28, -20);
            M.box(-10, 0, -21, -3, 1.2, -20, 'plaster', { tint: 0xf0ece4 });
            M.box(3, 0, -15, 10, 1.2, -14, 'plaster', { tint: 0xf0ece4 });
            M.prop('umbrella', -5, -28, { c: IL.blue });
            M.prop('table', -5, -28);
            ilHouse(M, 8, -36, 18, -24, 6, { i: 2, sides: 'nw', roof: 'dome', roofH: 3 });
            M.stairs(18, -18, 24, -10, 0, 3, 'z+', 'stone', { tint: IL.stone });
            M.box(24, 0, -18, 34, 3, -10, 'stone', { tint: IL.stone, top: 'paving', topTint: 0xe8e4dc });
            M.healthPack(-22, -10, false);
            M.healthPack(28, -14, false, 3);
            M.healthPack(2, -32, true);
            M.hint('hold', -6, -6); M.hint('hold', 6, -8); M.hint('perch', 22, -4, { y: 3 }); M.hint('perch', -20, -26, { y: 5 });
          });
          B.cam('shot', -20, 6, -26, 0, 2, 0);
          B.cam('menu', -14, 2.4, -14, 4, 4, 6);
        }
      },
      {
        name: 'ILIOS: WELL',
        build(B) {
          B.bounds(-32, -54, 32, 54);
          B.killY(-14);
          B.floor(-32, -54, 32, -4, 0, 'paving', { tint: IL.sand });
          B.floor(-32, 4, 32, 54, 0, 'paving', { tint: IL.sand });
          B.floor(-32, -4, -4, 4, 0, 'paving', { tint: IL.sand });
          B.floor(4, -4, 32, 4, 0, 'paving', { tint: IL.sand });
          for (const [x0, z0, x1, z1] of [[-4.5, -4.5, 4.5, -4], [-4.5, 4, 4.5, 4.5], [-4.5, -4, -4, 4], [4, -4, 4.5, 4]]) B.box(x0, -16, z0, x1, -1, z1, 'stone', { tint: 0x8a8070, col: false });
          B.box(-4.7, 0, -0.3, -4.2, 4, 0.3, 'wood', { tint: 0x6a4a30 });
          B.box(4.2, 0, -0.3, 4.7, 4, 0.3, 'wood', { tint: 0x6a4a30 });
          B.box(-4.7, 3.6, -0.2, 4.7, 4, 0.2, 'wood', { tint: 0x6a4a30 });
          B.point('A', 0, 0, 9);
          B.slab(-32, -18, -22, 18, 3.5, 0.5, 'stone', { tint: IL.stone });
          for (const z of [-15, -5, 5, 15]) B.prop('column', -22.6, z, { h: 3, c: IL.marble });
          B.wall(18, -16, 18, 16, 4, 0.8, 'stone', { tint: 0xd8ccb0, holes: [[4, 8, 1, 2.6], [14, 18, 0, 3.2], [24, 28, 1, 2.6]] });
          B.prop('brokencol', 25, 0, { c: IL.marble });
          sides(B, M => {
            ilSpawn(M);
            M.prop('column', -7, -7, { h: 5, c: IL.marble });
            M.prop('column', 7, -7, { h: 5, c: IL.marble });
            M.stairs(-32, -28, -26, -18, 0, 3.5, 'z+', 'stone', { tint: IL.stone });
            ilHouse(M, -30, -40, -18, -30, 6, { i: 1, sides: 'ne', roof: 'flat' });
            ilHouse(M, 10, -38, 22, -26, 5, { i: 2, sides: 'nw', roof: 'dome', roofH: 3 });
            M.box(-12, 0, -20, -6, 1.4, -18.8, 'stone', { tint: IL.stone });
            M.box(6, 0, -24, 12, 1.4, -22.8, 'stone', { tint: IL.stone });
            M.prop('brokencol', -14, -12, { c: IL.marble });
            M.prop('brokencol', 13, -10, { c: IL.marble });
            M.prop('tree_olive', 26, -30);
            M.prop('pot', -20, -22);
            M.healthPack(-26, -24, false);
            M.healthPack(26, -20, false);
            M.healthPack(0, -28, true);
            M.hint('hold', -8, -10); M.hint('hold', 8, -10); M.hint('perch', -27, -10, { y: 3.5 }); M.hint('hold', 22, -8);
          });
          B.cam('shot', 16, 5, -24, 0, 1, 0);
          B.cam('menu', 12, 2.4, -16, -2, 3, 2);
        }
      },
      {
        name: 'ILIOS: RUINS',
        build(B) {
          B.bounds(-34, -54, 34, 54);
          B.killY(-14);
          B.floor(-34, -54, 34, 54, 0, 'paving', { tint: 0xe0d4bc });
          B.box(-10, 0, -8, 10, 1.2, 8, 'marble', { tint: IL.marble });
          B.ramp(-14, -4, -10, 4, 0, 1.2, 'x+', 'marble', { tint: IL.marble });
          B.ramp(10, -4, 14, 4, 0, 1.2, 'x-', 'marble', { tint: IL.marble });
          B.prop('statue', 0, 0, { y: 1.2, c: 0xd8d0c0 });
          B.point('A', 0, 0, 7, { y: 1.2 });
          B.box(22, 0, -14, 34, 3.5, 14, 'stone', { tint: IL.stone, top: 'marble', topTint: IL.marble });
          for (const z of [-12, -4, 4, 12]) B.prop('column', 23, z, { y: 3.5, h: 4, c: IL.marble });
          B.box(22.4, 7.5, -13, 23.6, 8.2, 13, 'marble', { tint: IL.marble, col: false });
          B.prop('tree_olive', -26, 0);
          B.prop('brokencol', -20, 0, { c: IL.marble });
          sides(B, M => {
            ilSpawn(M);
            M.stairs(-6, -11, 6, -8, 0, 1.2, 'z+', 'marble', { tint: IL.marble });
            M.prop('column', -8.5, -6.5, { y: 1.2, h: 6, c: IL.marble });
            M.prop('column', 8.5, -6.5, { y: 1.2, h: 6, c: IL.marble });
            M.box(-9.2, 7.2, -7, 9.2, 8, -6, 'marble', { tint: IL.marble, col: false });
            M.stairs(22, -22, 28, -14, 0, 3.5, 'z+', 'stone', { tint: IL.stone });
            M.box(28, 0, -22, 34, 3.5, -14, 'stone', { tint: IL.stone, top: 'marble', topTint: IL.marble });
            M.box(-22, 0, -24, -12, 3, -23, 'stone', { tint: 0xc8bca0 });
            M.box(-22, 0, -23, -21, 3, -16, 'stone', { tint: 0xc8bca0 });
            M.box(12, 0, -30, 18, 2.4, -29, 'stone', { tint: 0xc8bca0 });
            M.prop('brokencol', -6, -20, { c: IL.marble });
            M.prop('brokencol', 16, -14, { c: IL.marble });
            M.prop('tree_olive', -28, -30);
            M.healthPack(-26, -14, false);
            M.healthPack(30, -26, false, 3.5);
            M.healthPack(0, -24, true);
            M.hint('hold', -8, -12); M.hint('hold', 8, -12); M.hint('perch', 26, -6, { y: 3.5 }); M.hint('hold', -18, -6);
          });
          B.cam('shot', -22, 6, -24, 0, 2, 0);
          B.cam('menu', -16, 2.8, -14, 0, 4, 2);
        }
      }
    ]
  };

  const LJ = { red: 0xb83a2a, wall: [0xe8dcc4, 0xd8c8a8, 0xc8b898], roof: 0x3a4a5a, gold: 0xe8b840 };

  function ljHouse(M, x0, z0, x1, z1, h, o = {}) {
    M.house(x0, z0, x1, z1, h, 'plaster', {
      tint: LJ.wall[(o.i || 0) % 3], band: { h: 0.5, mat: 'wood', tint: LJ.red }, top: 'tiles', topTint: 0x7a7a80,
      roof: o.roof === undefined ? 'pagoda' : o.roof, roofMat: 'roofJp', roofTint: o.roofTint || LJ.roof, roofH: o.roofH || 2.4, over: 0.8, curl: 0.4,
      win: { tex: 'shojiLit', sp: 2.8, w: 1.2, h: 1.6, fl: 3.4, sill: 1.1, sides: o.sides || 'nsew', lit: 70 }
    });
  }

  function ljSpawn(M) {
    M.spawnRoom({ x: 0, z: -46, w: 16, d: 12, yaw: 0, exits: [{ side: 'n', a: 5, b: 11 }, { side: 'w', a: 3, b: 9 }], mat: 'wood', tint: 0xa84a3a });
    M.box(-8, 0, -54, 8, 6, -52, 'plaster', { tint: LJ.wall[1] });
    ljHouse(M, -32, -54, -14, -42, 7, { i: 1, sides: 'n' });
    ljHouse(M, 8, -54, 32, -40, 8, { i: 2, sides: 'n' });
    M.box(-8, 5.6, -52, 8, 7, -40, 'plaster', { tint: LJ.wall[0] });
  }

  const ljTheme = {
    skyTop: 0x080c22, skyHorizon: 0x3a2448, skyLow: 0x18142a, fog: 0x1e1a34, fogNear: 40, fogFar: 170,
    sun: [0.3, 0.8, 0.4], sunCol: 0x6a6aa8, amb: 0x5a5480, ground: 0x3a3440,
    skyline: 'towers', skylineTint: 0x14122a, time: 'night'
  };

  O.MAPS.lijiang = {
    id: 'lijiang', name: 'LIJIANG TOWER', mode: 'control', theme: ljTheme,
    stages: [
      {
        name: 'LIJIANG: NIGHT MARKET',
        build(B) {
          B.bounds(-32, -54, 32, 54);
          B.floor(-32, -54, 32, 54, 0, 'tiles', { tint: 0x6a6670 });
          B.point('A', 0, 0, 8);
          for (const [x, z] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) B.cyl(x, z, 0, 5, 0.35, 'wood', { tint: LJ.red });
          B.roof(-6.5, -6.5, 6.5, 6.5, 5, 2.6, 'pagoda', 'roofJp', { tint: 0x2a3a4a, over: 0.6, curl: 0.5 });
          B.box(-6.6, 4.6, -6.6, 6.6, 5, 6.6, 'wood', { tint: LJ.red, col: false });
          B.light(0, 4, 0, 0xff7040, 14);
          B.prop('lanterns', -30, 0, { to: [60, 0], h: 6, n: 16, col: false });
          B.prop('skyline', 0, 0, { col: false, n: 18, r: 140, h: 60, c: 0x1a1830, lit: 0.45, lc: 0xff90c0, y: 0 });
          sides(B, M => {
            ljSpawn(M);
            ljHouse(M, -32, -34, -16, -18, 8, { i: 0, sides: 'ne' });
            M.slab(-16, -32, -12, -20, 4, 0.4, 'wood', { tint: 0x6a3a2a });
            M.stairs(-16, -20, -12, -12, 0, 4, 'z-', 'wood', { tint: 0x7a4a30 });
            M.rail(-12, -32, -12, -20, 4, 'wood', { tint: LJ.red });
            M.sign(-16.05, 6.4, -26, 'e', 6, 1.2, 'ЧАЙНЫЙ ДОМ', { bg: '#1a0a0a', fg: '#ff5060', glow: true, emit: 1 });
            ljHouse(M, 14, -36, 32, -20, 7, { i: 1, sides: 'nw' });
            M.sign(13.95, 5.2, -28, 'w', 8, 1.4, 'NEON DUMPLINGS', { bg: '#0a0a1a', fg: '#40e0ff', glow: true, emit: 1 });
            M.prop('stall', -8, -22, { c: 0xd83a3a, lamp: true });
            M.prop('stall', 8, -28, { c: 0x3a8ad8, lamp: true });
            M.prop('stall', 20, -12, { c: 0xe8a030, yaw: Math.PI / 2, lamp: true });
            M.prop('crates', -22, -10);
            M.prop('lanterns', -16, -16, { to: [30, 0], h: 5.5, n: 10, col: false });
            M.prop('vending', 24, -40.6, { c: 0x2a8ad8 });
            M.light(-8, 3, -22, 0xff5030, 9);
            M.light(20, 3, -12, 0xffa040, 9);
            M.healthPack(-22, -12, false);
            M.healthPack(24, -16, false);
            M.healthPack(0, -32, true);
            M.hint('hold', -10, -8); M.hint('hold', 10, -8); M.hint('perch', -14, -26, { y: 4 }); M.hint('hold', 0, -14);
          });
          B.cam('shot', 18, 5, -24, 0, 2, 0);
          B.cam('menu', -12, 2.4, -16, 2, 3.6, 2);
        }
      },
      {
        name: 'LIJIANG: GARDEN',
        build(B) {
          B.bounds(-32, -54, 32, 54);
          B.floor(-32, -54, 32, -8, 0, 'tiles', { tint: 0x8a8478 });
          B.floor(-32, 8, 32, 54, 0, 'tiles', { tint: 0x8a8478 });
          B.floor(-32, -8, -12, 8, 0, 'tiles', { tint: 0x8a8478 });
          B.floor(12, -8, 32, 8, 0, 'tiles', { tint: 0x8a8478 });
          B.floor(-12, -8, 12, 8, -0.4, 'dirt', { tint: 0x3a4a3a });
          B.water(-12, -8, 12, 8, -0.12, 0x2a5a78);
          B.box(-5, -0.4, -5, 5, 0.8, 5, 'wood', { tint: 0x8a5a3a, top: 'wood', topTint: 0xa87a4a });
          B.ramp(-12.5, -2, -5, 2, 0, 0.8, 'x+', 'wood', { tint: 0x8a5a3a });
          B.ramp(5, -2, 12.5, 2, 0, 0.8, 'x-', 'wood', { tint: 0x8a5a3a });
          for (const [x, z] of [[-4.4, -4.4], [4.4, -4.4], [-4.4, 4.4], [4.4, 4.4]]) B.cyl(x, z, 0.8, 5.2, 0.3, 'wood', { tint: LJ.red });
          B.roof(-5.8, -5.8, 5.8, 5.8, 5.2, 2.8, 'pagoda', 'roofJp', { tint: 0x2a4a3a, over: 0.6, curl: 0.5 });
          B.point('A', 0, 0, 7.5, { y: 0.8 });
          B.light(0, 4.4, 0, 0xffc070, 13);
          B.slab(-32, -14, -22, 14, 3, 0.4, 'wood', { tint: 0x7a4a30 });
          B.roof(-32, -14, -22, 14, 6.4, 1.6, 'gable-z', 'roofJp', { tint: 0x2a3a4a, over: 0.4 });
          for (const z of [-13, -4.5, 4.5, 13]) B.cyl(-22.4, z, 0, 6.4, 0.25, 'wood', { tint: LJ.red });
          B.slab(22, -14, 32, 14, 3, 0.4, 'wood', { tint: 0x7a4a30 });
          B.roof(22, -14, 32, 14, 6.4, 1.6, 'gable-z', 'roofJp', { tint: 0x2a3a4a, over: 0.4 });
          for (const z of [-13, -4.5, 4.5, 13]) B.cyl(22.4, z, 0, 6.4, 0.25, 'wood', { tint: LJ.red });
          B.prop('skyline', 0, 0, { col: false, n: 18, r: 140, h: 60, c: 0x1a1830, lit: 0.45, lc: 0xffc0e0, y: 0 });
          sides(B, M => {
            ljSpawn(M);
            M.ramp(-2, -12.5, 2, -5, 0, 0.8, 'z+', 'wood', { tint: 0x8a5a3a });
            M.stairs(-32, -22, -26, -14, 0, 3, 'z+', 'wood', { tint: 0x7a4a30 });
            M.stairs(26, -22, 32, -14, 0, 3, 'z+', 'wood', { tint: 0x7a4a30 });
            M.prop('tree_sakura', -14, -16);
            M.prop('tree_sakura', 15, -20, { c1: 0xf0b0d0 });
            M.prop('tree_round', -8, -34, { c1: 0x3a6a3a });
            M.prop('rock', -16, -26);
            M.prop('rock', 12, -12, { c: 0x7a7468 });
            M.prop('lantern_stone', -8, -14);
            M.prop('lantern_stone', 8, -14);
            M.box(-4, 0, -30, 4, 1.3, -29, 'stone', { tint: 0x9a948a });
            ljHouse(M, 14, -38, 26, -28, 5, { i: 2, sides: 'nw' });
            M.healthPack(-28, -6, false, 3);
            M.healthPack(20, -24, false);
            M.healthPack(-2, -22, true);
            M.hint('hold', -9, -11); M.hint('hold', 9, -11); M.hint('perch', -27, -4, { y: 3 }); M.hint('perch', 27, -4, { y: 3 });
          });
          B.cam('shot', 0, 6, -26, 0, 2, 0);
          B.cam('menu', 10, 2.4, -16, -2, 3, 2);
        }
      },
      {
        name: 'LIJIANG: CONTROL CENTER',
        theme: { amb: 0x6a6a90, fogNear: 50, fogFar: 180 },
        build(B) {
          B.bounds(-30, -50, 30, 50);
          B.killY(-14);
          B.floor(-30, -50, 30, 50, 0, 'metal', { tint: 0x4a4e5a });
          B.box(-30, 12, -50, 30, 13, 50, 'metalDark', { tint: 0x2a2e38 });
          B.box(30, 0, -50, 32, 13, 50, 'tech', { tint: 0x5a6070 });
          B.rail(-30, -50, -30, 50, 0, 'metal', { h: 1.1, t: 0.4, tint: 0x6a7080 });
          for (const z of [-40, -24, -8, 8, 24, 40]) B.box(-30.4, 1.1, z - 0.3, -29.6, 12, z + 0.3, 'metalDark', { tint: 0x3a3e48 });
          B.box(-8, 0, -6, 8, 1, 6, 'metal', { tint: 0x6a7080, top: 'tech', topTint: 0x8a90a8 });
          B.ramp(-12, -3, -8, 3, 0, 1, 'x+', 'metal', { tint: 0x6a7080 });
          B.ramp(8, -3, 12, 3, 0, 1, 'x-', 'metal', { tint: 0x6a7080 });
          B.point('A', 0, 0, 7, { y: 1 });
          B.cyl(0, 0, 1, 4.2, 1.1, 'tech', { tint: 0x40a0ff });
          B.box(-0.8, 4.2, -0.8, 0.8, 4.3, 0.8, 'tech', { tint: 0x80d0ff, emit: 1, col: false });
          B.light(0, 6, 0, 0x60b0ff, 16);
          B.box(18, 0, -14, 30, 4, 14, 'metal', { tint: 0x5a6070, top: 'grate', topTint: 0x8a90a0 });
          B.rail(18, -14, 18, 14, 4, 'metal', { tint: 0xe8b840 });
          B.prop('rocket', -120, 0, { col: false, y: -40, s: 2 });
          B.prop('skyline', 0, 0, { col: false, n: 20, r: 150, h: 70, c: 0x16142c, lit: 0.5, lc: 0x80c8ff, y: -40, a0: -Math.PI, span: Math.PI });
          sides(B, M => {
            M.spawnRoom({ x: 0, z: -43, w: 16, d: 12, yaw: 0, exits: [{ side: 'n', a: 5, b: 11 }, { side: 'e', a: 3, b: 9 }], mat: 'tech', tint: 0x8a90a8 });
            M.box(-8, 0, -50, 8, 12, -49, 'tech', { tint: 0x6a7080 });
            M.box(-30, 0, -50, -8, 12, -37, 'tech', { tint: 0x5a6070 });
            M.box(14, 0, -50, 30, 12, -37, 'tech', { tint: 0x5a6070 });
            M.stairs(-6, -9, 6, -6, 0, 1, 'z+', 'metal', { tint: 0x6a7080 });
            M.stairs(18, -24, 24, -14, 0, 4, 'z+', 'metal', { tint: 0x6a7080 });
            M.box(24, 0, -24, 30, 4, -14, 'metal', { tint: 0x5a6070, top: 'grate', topTint: 0x8a90a0 });
            for (const [x, z] of [[-16, -18], [-6, -24], [6, -20], [-20, -8]]) M.box(x - 2.5, 0, z - 0.6, x + 2.5, 1.2, z + 0.6, 'tech', { tint: 0x3a4a6a, top: 'tech', topTint: 0x40a0ff });
            M.box(-24, 0, -30, -18, 3, -28, 'tech', { tint: 0x4a5070 });
            M.decal(-21, 1.8, -27.95, 'n', 5, 2, 'tech', { emit: 0.6 });
            M.sign(0, 9, -36.95, 'n', 14, 1.8, 'ЦЕНТР УПРАВЛЕНИЯ ПОЛЁТАМИ', { bg: '#0a1020', fg: '#60c8ff', glow: true, emit: 1 });
            M.light(-16, 5, -20, 0x60b0ff, 12);
            M.light(20, 8, -30, 0xffe0a0, 12);
            M.healthPack(-26, -14, false);
            M.healthPack(27, -20, false, 4);
            M.healthPack(0, -28, true);
            M.hint('hold', -8, -10); M.hint('hold', 8, -10); M.hint('perch', 22, -6, { y: 4 }); M.hint('hold', -22, -2);
          });
          B.cam('shot', -20, 6, -24, 0, 2, 0);
          B.cam('menu', -16, 2.6, -12, 2, 3.4, 2);
        }
      }
    ]
  };
})(globalThis.Ow98 = globalThis.Ow98 || {});
