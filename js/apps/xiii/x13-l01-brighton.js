(function (X) {
  'use strict';
  const F = X.F;
  const DECK = 3.0;

  function beach(x, z) {
    let h = 1.4 - Math.max(0, z - 12) * 0.043;
    if (z > 12 && z < 34) h += 0.22 * Math.sin(x * 0.13 + 1) * Math.sin(z * 0.21) * X.smooth(X.clamp((z - 12) / 6, 0, 1));
    const dx = x - 190, dz = z - 42;
    h += 7 * Math.exp(-(dx * dx + dz * dz) / 900);
    const gx = x + 48;
    if (z > 18 && z < 80 && Math.abs(gx) < 4) h += (1 - Math.abs(gx) / 4) * 0.6;
    return h;
  }

  function shopFront(B, x0, x1, name, o) {
    o = o || {};
    const z0 = -16, z1 = -2, h = o.h || 3.8;
    const wall = o.wall || 'siding';
    B.floor(x0, z0, x1, z1, DECK, o.floor || 'wood_floor', 0.3);
    B.box(x0, 1.2, z0, x1, DECK - 0.3, z1, 'concrete', { flags: F.SOLID | F.SHOT | F.SIGHT });
    B.room(x0, z0, x1, z1, DECK, h, { floor: null, ceil: o.ceil === undefined ? 'ceiling_wood' : o.ceil, wall, t: 0.25, doors: o.doors || {}, windows: o.windows || {} });
    B.box(x0 - 0.15, DECK + h, z0 - 0.15, x1 + 0.15, DECK + h + 0.25, z1 + 0.15, 'roof_tar', { flags: F.WALL });
    B.box(x0 - 0.15, DECK + h + 0.25, z1 - 0.1, x1 + 0.15, DECK + h + 1.3, z1 + 0.15, wall, { flags: F.SOLID | F.SHOT | F.SIGHT });
    if (name) B.sign(name, (x0 + x1) / 2, DECK + h + 0.7, z1 + 0.17, Math.min(x1 - x0 - 1, name.length * 0.62 + 1.2), 0.95, Math.PI, { bg: o.signBg || '#f3e6c6', fg: o.signFg || '#7a1c12', font: 'serif', border: '#3a2414' });
  }

  X.addLevel({
    id: 'brighton', n: 1, name: 'Brighton Beach', sub: 'Брайтон-Бич, Нью-Йорк',
    env: {
      sky: { top: [0.88, 0.55, 0.3], mid: [0.98, 0.76, 0.42], hor: [1, 0.9, 0.62], sun: [0.86, 0.14, 0.3], sunColor: [1, 0.95, 0.7], sunSize: 0.07, clouds: 0.55, cloudColor: [0.98, 0.7, 0.45], mountains: 0 },
      light: { dir: [0.75, 0.42, 0.5], color: [1.08, 0.94, 0.74], ambient: [0.5, 0.4, 0.36], shadow: [0.62, 0.44, 0.36] },
      fog: { color: [0.98, 0.82, 0.58], near: 60, far: 420 },
      grade: { tint: [1.04, 0.99, 0.9], sat: 1.05 },
      water: [0.36, 0.52, 0.56]
    },
    light: 0.9,
    music: 'beach',
    loadout: { weapons: [], medkits: 0, skills: ['sense'] },
    build(B) {
      B.bounds(-64, -36, 104, 98);
      B.terrain({ x0: -240, z0: -60, x1: 300, z1: 240, cell: 4, fn: beach, mat: 'sand', low: 'sand_wet', lowY: 0.45 });
      B.water(-600, 30, 800, 800, 0);

      B.box(-62, 2.7, -2, 90, DECK, 10, 'planks', { top: 'planks', flags: F.WALL });
      for (let x = -60; x <= 88; x += 4) for (const z of [9.7, 4, -1.6]) B.cyl(x, 1.1, z, 0.15, 1.62, 'wood_dark', { sides: 6 });
      const stairs = [[-22, -19], [18, 21], [58, 61]];
      for (const [a, b] of stairs) B.stairs(a, 10, b, 12.8, 1.28, DECK, 'n', 'planks_x');
      let cur = -62;
      for (const [a, b] of stairs.concat([[76, 82], [90, 90]])) {
        if (a - cur > 0.3) B.at((cur + a) / 2, DECK, 9.85, 0, () => X.PROPS.railing(B, { len: a - cur, mat: 'wood_white' }));
        cur = b;
      }
      for (let x = -56; x <= 86; x += 12) B.prop('lamp_post', x, DECK, 9.3, Math.PI, { h: 4.4, color: [1, 0.8, 0.5], r: 10 });
      for (const x of [-40, -12, 30, 66]) B.prop('bench', x, DECK, 8.6, Math.PI, { len: 2.4, mat: 'wood_white' });
      for (const x of [-30, 3, 44, 84]) B.prop('trash', x, DECK, 9.0, 0, { mat: 'metal_green' });
      B.prop('telescope', 86, DECK, 9.1, Math.PI, {});
      B.box(-62.5, DECK, -2, -62, DECK + 3.2, 10, 'siding_white', { flags: F.WALL });
      B.fence(-61.9, 0.5, -61.9, 9.8, DECK, 2.2, {});

      shopFront(B, -60, -30, 'SURF HOTEL', { h: 7, wall: 'siding_blue', windows: { s: [[3, 1.6, 1.0, 2.4], [8, 1.6, 1.0, 2.4], [13, 1.6, 1.0, 2.4], [18, 1.6, 1.0, 2.4], [23, 1.6, 1.0, 2.4]] }, signBg: '#fff3dc', signFg: '#1c3c7a' });
      for (const x of [-56, -48, -40, -32]) B.vbox(x - 0.9, DECK + 4.4, -1.9, x + 0.9, DECK + 6.2, -1.75, 'window_dark');
      B.box(-60, DECK + 7, -16, -30, DECK + 7.3, -2, 'roof_tar', { flags: F.WALL });

      shopFront(B, -26, -8, 'PENNY ARCADE', { wall: 'siding_red', doors: { s: [[7.5, 3]] }, signBg: '#ffe25a', signFg: '#b01010' });
      B.box(-18.5, DECK, -2.2, -15.5, DECK + 2.4, -1.9, 'shutter', { flags: F.WALL });
      B.box(-26, DECK, -2, -30, DECK + 2.6, -1.8, 'siding_white', { flags: F.WALL });
      B.box(-8, DECK, -16, -4, DECK + 2.6, -15.8, 'siding_white', { flags: F.WALL });
      B.floor(-8, -16, -4, -2, DECK, 'wood_floor', 0.3);
      B.box(-8, 1.2, -16, -4, DECK - 0.3, -2, 'concrete', { flags: F.WALL });
      B.prop('crates', -6.5, DECK, -10, 0.3, { n: 3 });
      B.prop('barrel', -5, DECK, -6, 0, { mat: 'barrel_blue' });

      shopFront(B, -4, 14, 'LUNCHEONETTE', { wall: 'siding_yellow', doors: { s: [[8, 1.4]], e: [[10, 1.1]] }, windows: { s: [[1.5, 2.8, 0.9, 2.3], [11, 2.8, 0.9, 2.3], [15, 1.6, 0.9, 2.3]] }, signBg: '#f8eed6', signFg: '#8a2410' });
      for (const x of [-3.0, 0.4, 6.5, 9.9]) B.vbox(x, DECK + 0.8, -1.86, x + 0.55, DECK + 2.5, -1.8, 'shutter_green');
      B.vbox(-4, DECK + 2.6, -1.9, 14, DECK + 2.75, -0.8, 'awning');
      B.at(5, DECK, -14.2, 0, () => X.PROPS.counter(B, { len: 12, mat: 'wood_dark', top: 'marble' }));
      for (let x = 0; x <= 10; x += 2) B.prop('stool', x, DECK, -12.8, 0, { mat: 'leather_red' });
      for (const x of [-1.5, 3.5, 11]) {
        B.prop('table', x, DECK, -5.2, 0, { w: 1.4, d: 0.8, mat: 'formica' });
        B.prop('bench', x, DECK, -6.3, Math.PI, { len: 1.4, mat: 'leather_red' });
        B.prop('bench', x, DECK, -4.1, 0, { len: 1.4, mat: 'leather_red' });
      }
      B.vbox(-3.8, DECK + 1.2, -15.8, 13.8, DECK + 2.2, -15.7, 'menu_board');
      B.sign('HOT DOGS 15c * COFFEE 5c * PIE', 5, DECK + 2.6, -15.69, 8, 0.5, 0, { bg: '#1e2a20', fg: '#f4f0d0', font: 'sans' });
      B.object('bottle', 3.3, DECK + 0.77, -5.1, 0);
      B.object('bottle', 11.2, DECK + 0.77, -5.3, 0);
      B.object('ashtray', -1.3, DECK + 0.77, -5.0, 0);
      B.item('food', -1.7, DECK + 0.85, -5.4, { name: 'Хот-дог', n: 20 });
      B.item('ammo', 9, DECK + 1.1, -14.6, { w: 'beretta', n: 15 });
      B.item('medkit', 1, DECK + 1.1, -14.4, {});
      B.light(5, DECK + 3.4, -8, [1, 0.85, 0.6], 11, { bulbR: 0.14 });
      B.floor(14, -16, 16, -2, DECK, 'wood_floor', 0.3);
      B.box(14, 1.2, -16, 16, DECK - 0.3, -2, 'concrete', { flags: F.WALL });
      B.box(14, DECK, -16, 16, DECK + 2.6, -15.8, 'siding_white', { flags: F.WALL });
      B.prop('barrel', 15, DECK, -13, 0, { mat: 'barrel_blue' });
      B.prop('trash', 15.1, DECK, -11.6, 0, {});

      shopFront(B, 16, 26, 'BAIT & TACKLE', { wall: 'siding_green', doors: { s: [[4.3, 1.4]] }, windows: { s: [[1, 2, 1.0, 2.2], [7, 2, 1.0, 2.2]] }, signBg: '#e8f0e0', signFg: '#1e4a2a' });
      B.at(21, DECK, -13, 0, () => X.PROPS.counter(B, { len: 5, mat: 'wood', top: 'wood_dark' }));
      B.at(17.2, DECK, -9, Math.PI / 2, () => X.PROPS.shelf(B, { w: 3, h: 2.2, fill: 'tackle' }));
      B.at(24.8, DECK, -9, -Math.PI / 2, () => X.PROPS.shelf(B, { w: 3, h: 2.2, fill: 'tackle' }));
      B.item('weapon', 21, DECK + 1.12, -13, { w: 'knife', n: 5 });
      B.object('broom', 24.5, DECK, -5, 0);
      B.light(21, DECK + 3.4, -8, [1, 0.85, 0.6], 8, { bulbR: 0.1 });
      B.floor(26, -16, 30, -2, DECK, 'wood_floor', 0.3);
      B.box(26, 1.2, -16, 30, DECK - 0.3, -2, 'concrete', { flags: F.WALL });
      B.box(26, DECK, -16, 30, DECK + 2.6, -15.8, 'siding_white', { flags: F.WALL });
      B.prop('crates', 28, DECK, -8, 0.1, { n: 2 });

      shopFront(B, 30, 74, null, { wall: 'siding_white', doors: { s: [[20.3, 1.4]], e: [[6, 1.4]] }, windows: { s: [[2, 3, 1.0, 2.4], [7, 3, 1.0, 2.4], [12, 3, 1.0, 2.4], [26, 3, 1.0, 2.4], [31, 3, 1.0, 2.4], [36, 3, 1.0, 2.4]] }, ceil: 'ceiling' });
      B.sign('BRIGHTON BEACH CLUB', 52, DECK + 4.5, -1.83, 11, 1.0, Math.PI, { bg: '#f6f0e4', fg: '#1f3f6a', font: 'serif', border: '#2a2a2a' });
      B.box(30, DECK + 3.2, -2, 74, DECK + 3.4, 4.2, 'roof_shingle_under', { top: 'roof_tar', flags: F.SOLID | F.SHOT | F.SIGHT });
      for (let x = 30.3; x <= 74; x += 4.36) B.box(x - 0.14, DECK, 3.86, x + 0.14, DECK + 3.2, 4.14, 'wood_white', { flags: F.WALL });
      B.vbox(30, DECK + 2.9, 3.8, 74, DECK + 3.2, 4.2, 'wood_white');
      for (const x of [36, 45, 58, 67]) B.prop('bench', x, DECK, -1.4, Math.PI, { len: 3, mat: 'wood' });
      B.object('ashtray', 45.4, DECK + 0.5, -1.4, 0);
      for (let i = 0; i < 6; i++) B.at(33 + i * 1.1, DECK, -15.4, 0, () => X.PROPS.locker(B, { n: 1, mat: 'locker' }));
      for (let i = 0; i < 6; i++) B.at(56 + i * 1.1, DECK, -15.4, 0, () => X.PROPS.locker(B, { n: 1, mat: 'locker' }));
      B.item('medkit', 60, DECK + 0.1, -12, {});
      B.item('ammo', 36, DECK + 0.1, -12, { w: 'beretta', n: 15 });
      B.wall(46, -16, 46, -8, DECK, DECK + 3.6, 'tiles', { t: 0.15 });
      B.wall(56, -16, 56, -8, DECK, DECK + 3.6, 'tiles', { t: 0.15 });
      B.light(40, DECK + 3.4, -9, [0.95, 0.95, 1], 10, { bulbR: 0.12 });
      B.light(64, DECK + 3.4, -9, [0.95, 0.95, 1], 10, { bulbR: 0.12 });
      B.box(30, DECK + 3.8, -16, 74, DECK + 5.0, -15.8, 'siding_white', { flags: F.WALL });

      B.floor(74, -30, 110, -2, DECK, 'asphalt', 0.3);
      B.box(74, 1.2, -30, 110, DECK - 0.3, -2, 'concrete', { flags: F.WALL });
      B.floor(30, -34, 110, -16, DECK, 'asphalt', 0.3);
      B.box(30, 1.2, -34, 110, DECK - 0.3, -16, 'concrete', { flags: F.WALL });
      B.box(88, DECK, -2, 110, DECK + 1.1, -1.7, 'concrete', { flags: F.WALL });
      B.box(89.7, DECK, -2, 90, DECK + 1.1, 10, 'concrete', { flags: F.WALL });
      B.box(30, DECK, -36, 110, DECK + 9, -34, 'brick', { flags: F.WALL });
      for (let x = 34; x < 108; x += 7) {
        B.vbox(x, DECK + 1.2, -34.1, x + 2.2, DECK + 3.0, -33.98, 'window_dark');
        B.vbox(x, DECK + 4.6, -34.1, x + 2.2, DECK + 6.4, -33.98, 'window_lit', { emit: true });
      }
      B.sign('SURF AVE', 60, DECK + 3.4, -33.95, 3.2, 0.5, 0, { bg: '#1c5a2a', fg: '#ffffff', font: 'sans' });
      B.box(29.8, DECK, -34, 30, DECK + 4, -16, 'brick', { flags: F.WALL });
      B.box(110, DECK, -36, 111, DECK + 4, -2, 'brick', { flags: F.WALL });
      B.vbox(30, DECK + 0.02, -26.2, 110, DECK + 0.03, -25.8, 'road_line');
      B.box(30, DECK, -34, 110, DECK + 0.15, -31.5, 'sidewalk', { flags: F.WALL });
      B.prop('car', 96, DECK, -27, Math.PI / 2 + 0.05, { mat: 'car_blue' });
      B.prop('car', 60, DECK, -29.5, -Math.PI / 2, { mat: 'car_red' });
      B.prop('van', 44, DECK, -28, Math.PI / 2, { mat: 'car_white' });
      B.prop('phonebooth', 100, DECK + 0.15, -32.6, 0, {});
      B.prop('newsstand', 84, DECK + 0.15, -32.8, 0, {});
      B.prop('hydrant', 76, DECK + 0.15, -31.8, 0, {});
      B.prop('mailbox', 90, DECK + 0.15, -32.4, 0, {});
      for (const x of [40, 64, 88, 106]) B.prop('lamp_post', x, DECK + 0.15, -32.2, 0, { h: 4.8, r: 12 });
      B.prop('jersey', 106, DECK, -26, Math.PI / 2, {});
      B.prop('jersey', 106, DECK, -22.5, Math.PI / 2, {});
      B.sign('ROAD CLOSED', 107.5, DECK + 1.3, -24.3, 2.4, 0.6, -Math.PI / 2, { bg: '#f0a020', fg: '#101010', font: 'sans', two: true });

      B.box(76, 2.7, 10, 82, DECK, 96, 'planks', { top: 'planks_z', flags: F.WALL });
      for (let z = 14; z <= 94; z += 5) for (const x of [76.3, 81.7]) B.cyl(x, -3, z, 0.18, 5.8, 'wood_dark', { sides: 6 });
      for (let z = 12; z < 88; z += 6) {
        B.at(76.1, DECK, z + 3, Math.PI / 2, () => X.PROPS.railing(B, { len: 6, mat: 'wood_white' }));
        B.at(81.9, DECK, z + 3, Math.PI / 2, () => X.PROPS.railing(B, { len: 6, mat: 'wood_white' }));
      }
      B.box(72, 2.7, 88, 86, DECK, 98, 'planks', { top: 'planks', flags: F.WALL });
      for (const x of [72.3, 85.7]) B.at(x, DECK, 93, Math.PI / 2, () => X.PROPS.railing(B, { len: 10, mat: 'wood_white' }));
      B.at(79, DECK, 97.8, 0, () => X.PROPS.railing(B, { len: 14, mat: 'wood_white' }));
      B.at(74, DECK, 88.2, 0, () => X.PROPS.railing(B, { len: 4, mat: 'wood_white' }));
      B.at(84, DECK, 88.2, 0, () => X.PROPS.railing(B, { len: 4, mat: 'wood_white' }));
      B.prop('bench', 74, DECK, 95, Math.PI / 2, { len: 2, mat: 'wood_white' });
      B.prop('crate', 84.5, DECK, 96.4, 0.2, { s: 0.8, mat: 'crate' });
      B.item('doc', 84.5, DECK + 0.9, 96.4, { title: 'Записка рыбака', text: 'Видел, как ночью на пирсе высадили троих в вязаных шапках. Один звонил кому-то и повторял: «Мангуст ждёт, Мангуст ждёт». Никогда больше не выйду сюда после заката.' });
      B.prop('lamp_post', 79, DECK, 90, 0, { h: 4, r: 9 });
      B.item('ammo', 73, DECK + 0.1, 96.5, { w: 'beretta', n: 15 });

      B.at(8, beach(8, 37), 37, 0, () => {
        for (const x of [-1.1, 1.1]) for (const z of [-1.1, 1.1]) B.cyl(x, -0.4, z, 0.12, 3.0, 'wood_white', { sides: 6 });
        B.box(-1.4, 2.5, -1.4, 1.4, 2.7, 1.4, 'planks', { flags: F.WALL });
        B.box(-1.4, 2.7, -1.4, 1.4, 3.6, -1.3, 'siding_white', { flags: F.SOLID | F.SHOT });
        B.box(-1.4, 2.7, 1.3, 1.4, 3.6, 1.4, 'siding_white', { flags: F.SOLID | F.SHOT });
        B.box(1.3, 2.7, -1.4, 1.4, 3.6, 1.4, 'siding_white', { flags: F.SOLID | F.SHOT });
        B.box(-1.4, 2.7, -1.4, -1.3, 3.6, 0.2, 'siding_white', { flags: F.SOLID | F.SHOT });
        for (const [x, z] of [[-1.35, -1.35], [1.35, -1.35], [-1.35, 1.35], [1.35, 1.35]]) B.vbox(x - 0.05, 3.6, z - 0.05, x + 0.05, 4.6, z + 0.05, 'wood_white');
        B.roof(-1.5, -1.5, 1.5, 1.5, 4.6, 0.6, 'x', 'roof_red', { over: 0.25, gable: false, solid: false });
        B.box(-1.5, 4.55, -1.5, 1.5, 4.6, 1.5, null, { vis: false, flags: F.SOLID | F.SHOT | F.SIGHT });
        B.ladder(-1.4, 0.8, -0.4, 2.7, -Math.PI / 2, 0.6, { mat: 'wood_white' });
        B.sign('LIFEGUARD', 0, 3.9, 1.42, 1.9, 0.4, 0, { bg: '#d02010', fg: '#ffffff', font: 'sans', two: true });
        B.item('medkit', 0.6, 2.8, -0.7, {});
        B.item('doc', -0.6, 2.8, 0.6, { title: 'Журнал спасателя', text: '28 августа. Утро: ветер северо-восточный. Двое купальщиков. Вечер: у волнореза видела лодку без огней. Мужчина в сером костюме смотрел в бинокль на берег. Надо сказать полиции... наверное, рыбаки.' });
      });
      B.object('chair', 5.2, beach(5.2, 35.2), 35.2, 0.4);
      B.prop('lifebuoy', 12, beach(12, 36), 36, 0);
      B.prop('lifebuoy', -26, beach(-26, 34), 34, 0.3);
      for (const [x, z, m] of [[-14, 30, 'stripes'], [-30, 26, 'stripes_blue'], [32, 30, 'stripes'], [44, 25, 'stripes_blue'], [-5, 24, 'stripes_blue']]) {
        B.prop('umbrella', x, beach(x, z), z, 0, { mat: m });
        B.prop('deckchair', x + 1.2, beach(x + 1.2, z + 0.8), z + 0.8, 0.3, { mat: m });
      }
      for (let z = 22; z < 78; z += 3.2) B.rock(-48 + Math.sin(z) * 0.8, z, 1.5 + (z % 2) * 0.5, { sy: 0.8 });
      for (let i = 0; i < 26; i++) {
        const x = 110 + i * 3.3 + Math.sin(i * 1.7) * 2, z = 30 + Math.sin(i * 0.9) * 3;
        B.rock(x, z, 2 + (i % 3) * 0.7, { sy: 0.8, solid: false });
      }
      B.at(190, beach(190, 42) - 0.5, 42, 0, () => {
        B.cyl(0, 0, 0, 3.2, 3, 'stone', { solid: false, sides: 10 });
        B.cyl(0, 3, 0, 2.1, 18, 'lighthouse', { solid: false, sides: 12, r2: 1.5 });
        B.cyl(0, 21, 0, 2.2, 0.5, 'metal_dark', { solid: false, sides: 12 });
        B.cyl(0, 21.5, 0, 1.3, 2.2, 'lamp_glass', { solid: false, sides: 10, emit: true });
        B.cyl(0, 23.7, 0, 1.6, 1.4, 'roof_red', { solid: false, sides: 10, r2: 0.1 });
        B.light(0, 22.5, 0, [1, 0.95, 0.7], 30, { bulbR: 0.8 });
      });
      B.at(26, -2, 150, 0, () => X.PROPS.boat(B, { len: 9, cabin: true, mat: 'boat_white' }));

      B.spawnPlayer(6.2, beach(6.2, 36.8), 36.8, 0.2);
      B.char('sally', 6.0, 41.5, { dead: 'back', yaw: 2.2, id: 'sally' });
      B.char('hitman', 19.5, 2, { y: DECK, id: 'h1', ai: 'guard', look: Math.PI, weapon: 'beretta', dropAmmo: 12 });
      B.char('hitman', 4, 5, { y: DECK, id: 'h2', group: 'deck', path: [[4, DECK, 5], [30, DECK, 5], [30, DECK, 1], [4, DECK, 1]], weapon: 'beretta' });
      B.char('hitman2', 7.3, 0.2, { y: DECK, id: 'h3', group: 'deck', look: Math.PI, weapon: 'beretta' });
      B.char('hitman', 6, -11.5, { y: DECK, id: 'h4', group: 'cafe', look: 0.3, weapon: 'beretta', pose: 'lean' });
      B.char('hitman2', 40, 1.5, { y: DECK, id: 'h5', group: 'club', look: -Math.PI / 2, weapon: 'beretta' });
      B.char('hitman', 58, 6, { y: DECK, id: 'h6', group: 'club', path: [[58, DECK, 6], [70, DECK, 6], [70, DECK, 2], [48, DECK, 2]], weapon: 'shotgun' });
      B.char('hitman2', 52, 1, { y: DECK + 3.4, id: 'h7', group: 'club', ai: 'sniper', look: Math.PI, weapon: 'beretta', sight: 36, static: true });
      B.char('hitman', 79, 93, { y: DECK, id: 'h8', group: 'pier', path: [[79, DECK, 93], [79, DECK, 70], [79, DECK, 93], [74, DECK, 95]], weapon: 'beretta' });
      B.char('hitman2', 92, -24, { y: DECK, id: 'boss1', group: 'street', hidden: true, weapon: 'shotgun', aggressive: true, hp: 140 });
      B.char('hitman', 98, -22, { y: DECK, id: 'h9', group: 'street', hidden: true, weapon: 'beretta', aggressive: true });
      B.char('hitman', 88, -29, { y: DECK, id: 'h10', group: 'street', hidden: true, weapon: 'beretta', aggressive: true });

      B.trigger('beachExit', 16, 1.5, 9, 23, 5, 14);
      B.trigger('beachExitW', -24, 1.5, 9, -17, 5, 14);
      B.trigger('beachExitE', 56, 1.5, 9, 63, 5, 14);
      B.trigger('deck', -60, DECK - 0.5, -2, 90, DECK + 3, 10);
      B.trigger('club', 34, DECK - 0.5, -2, 44, DECK + 3, 10);
      B.trigger('plaza', 72, DECK - 0.5, -12, 90, DECK + 3, 10);
      B.trigger('street', 72, DECK - 0.5, -34, 110, DECK + 3, -14);
      B.trigger('pierEnd', 72, DECK - 0.5, 86, 86, DECK + 3, 98);
      B.usable('phone', 100, DECK + 1.4, -32.1, { label: 'Позвонить', enabled: false, r: 1.6 });
      B.cam('roof', [46, DECK + 5.8, 8], [52, DECK + 4.4, 1], 40);
      B.cam('street', [80, DECK + 2.2, -14], [94, DECK + 1.2, -25], 45);
      B.cam('pier', [79, DECK + 2, 62], [79, DECK + 1.2, 93], 35);
      B.zone('dark', -62, -2, 90, 10, { y0: 0, y1: 2.8, k: 0.45 });
      B.item('doc', -35, 1.5, 3, { title: 'Бумажник утопленника', text: 'Размокший бумажник под настилом. Внутри — пустая визитка без имени, только оттиск: «XX». И вырезка из газеты: «Убийца президента Шеридана по-прежнему не найден».' });
    },
    script(S) {
      S.on('start', g => {
        g.objective('escape', 'Уйти с пляжа живым');
        g.objective('weapon', 'Найти оружие');
        g.caption('Брайтон-Бич. Кто-то застрелил Салли. Убийца всё ещё рядом.', 5);
        g.msg('[W][A][S][D] — идти, мышь — смотреть, [C] — присесть', 6);
        const h1 = g.char('h1');
        X.AI.goto(g, h1, [6.4, beach(6.4, 39.8), 39.8], { id: 'h1body', face: Math.PI, pose: null });
        g.after(6, () => g.msg('Подойдите к стулу и нажмите [E], чтобы взять его', 5));
      });
      S.on('arrive:h1body', g => {
        const h1 = g.char('h1');
        if (!h1 || h1.state !== 'alive') return;
        h1.ai.home = h1.pos.slice(); h1.ai.homeYaw = Math.PI; h1.ai.mode = 'guard';
        g.say('h1', 'Готова. Где же этот Тринадцатый?..');
        g.after(4, () => g.msg('Подкрадитесь сзади и ударьте стулом — [ЛКМ]', 5));
      });
      S.dead('h1', g => {
        g.after(1.5, () => g.msg('Подберите его пистолет', 4));
        g.checkpoint('beach');
      });
      S.on('got:beretta', g => g.complete('weapon'));
      S.on('got:knife', g => g.complete('weapon'));
      S.on('got:shotgun', g => g.complete('weapon'));
      const leaveBeach = g => {
        g.complete('escape');
        g.objective('boardwalk', 'Пройти по набережной на восток, к улице');
        g.checkpoint('deck');
      };
      S.zone('beachExit', leaveBeach);
      S.zone('beachExitW', leaveBeach);
      S.zone('beachExitE', leaveBeach);
      S.zone('club', g => {
        const h7 = g.char('h7');
        if (h7 && h7.state === 'alive') g.panel({ kind: 'cam', cam: 'roof', dur: 2.6, text: 'НА КРЫШЕ!', tint: 'red' });
      });
      S.zone('pierEnd', g => g.checkpoint('pier'));
      S.zone('plaza', g => {
        g.checkpoint('plaza');
        g.spawn('street', g.player.pos);
        g.panel({ kind: 'cam', cam: 'street', dur: 3, text: 'ЕЩЁ ТРОЕ!', tint: 'red' });
        g.say('boss1', 'Вот он! Мангуст заплатит вдвойне!');
        g.music('combat');
      });
      S.cleared('street', g => {
        g.complete('boardwalk');
        g.objective('phone', 'Позвонить из телефонной будки на Серф-авеню');
        g.enable('phone', true);
        g.music('calm');
        g.checkpoint('street');
      });
      S.use('phone', g => { g.complete('phone'); g.finish(); });
    },
    comics: {
      intro: [
        {
          rows: [{ h: 0.42, w: [1] }, { h: 0.58, w: [0.56, 0.44] }],
          panels: [
            { cam: { pos: [-6, 3.2, 52], look: [4, 0.6, 42], fov: 55 }, actors: [{ type: 'xiii', pos: [3.8, 0.35, 42.4], yaw: 1.2, pose: 'lie' }], text: [{ k: 'cap', t: 'Брайтон-Бич, Нью-Йорк. Конец лета.', x: 0.03, y: 0.06, w: 0.42 }] },
            { cam: { pos: [2.0, 1.55, 39.8], look: [4.1, 0.5, 42.4], fov: 42 }, actors: [{ type: 'xiii', pos: [3.8, 0.35, 42.4], yaw: 1.2, pose: 'lie' }, { type: 'sally', pos: [4.6, 0.35, 41.5], yaw: 2.6, pose: 'kneel' }], text: [{ k: 'say', t: 'Эй, мистер! Вы меня слышите? Господи, да на вас живого места нет...', x: 0.05, y: 0.05, w: 0.6, who: 1 }] },
            { shot: { on: 0, dist: 0.62, from: 'above', angle: 0, fov: 34, target: 'head' }, actors: [{ type: 'xiii', pos: [3.8, 0.35, 42.4], yaw: 1.2, pose: 'lie' }], text: [{ k: 'think', t: '...Где я? ...Кто я?', x: 0.08, y: 0.06, w: 0.62 }] }
          ]
        },
        {
          rows: [{ h: 0.5, w: [0.5, 0.5] }, { h: 0.5, w: [0.38, 0.62] }],
          panels: [
            { cam: { pos: [1.5, 2.1, 39], look: [5.5, 1.4, 44.5], fov: 46 }, actors: [{ type: 'xiii', pos: [4.2, 0.5, 45.2], yaw: 0.8, pose: 'kneel' }, { type: 'sally', pos: [5.3, 0.45, 43.6], yaw: 2.8, pose: 'talk' }], text: [{ k: 'say', t: 'Я Салли, спасатель. Вас выбросило волной. И посмотрите — у вас на ключице татуировка: «XIII».', x: 0.04, y: 0.04, w: 0.8, who: 1 }] },
            { art: 'tattoo', text: [{ k: 'cap', t: 'Тринадцать. Это всё, что у меня есть. Это — и ключ в кармане.', x: 0.04, y: 0.74, w: 0.9 }] },
            { cam: { pos: [14, 4.8, 17], look: [19.5, 4.2, 5], fov: 40 }, actors: [{ type: 'hitman', pos: [19, DECK, 8.5], yaw: Math.PI - 0.35, pose: 'aim' }, { type: 'hitman2', pos: [21, DECK, 7.8], yaw: Math.PI - 0.25, pose: 'aim' }], text: [{ k: 'sfx', t: 'BLAM! BLAM!', x: 0.18, y: 0.12, size: 1.3 }] },
            { cam: { pos: [2.5, 1.4, 49], look: [5.6, 1.1, 43.2], fov: 44 }, actors: [{ type: 'sally', pos: [5.3, 0.45, 43.6], yaw: 2.8, pose: 'fall' }, { type: 'xiii', pos: [4.2, 0.5, 45.2], yaw: 0.2, pose: 'kneel' }], tint: 'red', text: [{ k: 'shout', t: 'А-а-а!', x: 0.52, y: 0.08, w: 0.3, who: 0 }, { k: 'sfx', t: 'BLAM!', x: 0.08, y: 0.12 }] }
          ]
        },
        {
          rows: [{ h: 0.55, w: [0.6, 0.4] }, { h: 0.45, w: [1] }],
          panels: [
            { shot: { on: 0, dist: 1.6, height: 0.1, angle: 20, fov: 38, target: 'head' }, actors: [{ type: 'hitman', pos: [19, DECK, 8.5], yaw: Math.PI - 0.35, pose: 'aim' }], text: [{ k: 'say', t: 'Мангуст сказал — никаких свидетелей. Найди Тринадцатого и добей. Я спущусь к девке, проверю.', x: 0.04, y: 0.05, w: 0.7, who: 0 }] },
            { shot: { on: 0, dist: 0.7, height: 0.05, angle: -30, fov: 34, target: 'head' }, actors: [{ type: 'hitman2', pos: [21, DECK, 7.8], yaw: Math.PI - 0.25, pose: 'stand' }], tint: 'warm', text: [{ k: 'say', t: 'Он не мог уйти далеко.', x: 0.05, y: 0.06, w: 0.8, who: 0 }] },
            { cam: { pos: [3.2, 0.9, 33.5], look: [7.6, 1.1, 38.3], fov: 48 }, actors: [{ type: 'xiii', pos: [6.2, 0.45, 36.8], yaw: 0.2, pose: 'crouch' }], text: [{ k: 'think', t: 'Кем бы они ни были — они пришли за мной. Салли погибла из-за меня... Надо уходить с пляжа. И найти оружие.', x: 0.36, y: 0.08, w: 0.58 }] }
          ]
        }
      ],
      outro: [
        {
          rows: [{ h: 0.5, w: [0.5, 0.5] }, { h: 0.5, w: [1] }],
          panels: [
            { cam: { pos: [97.5, DECK + 1.9, -29.5], look: [100, DECK + 1.5, -32.2], fov: 45 }, actors: [{ type: 'xiii', pos: [100, DECK + 0.15, -32.2], yaw: 0, pose: 'phone' }], text: [{ k: 'say', t: 'Алло? Полиция? ...Нет. Не надо полиции.', x: 0.05, y: 0.05, w: 0.75, who: 0 }] },
            { art: 'silhouette', artOpt: { glint: true }, text: [{ k: 'radio', t: 'Он ушёл, босс. Троих наших положил.', x: 0.05, y: 0.05, w: 0.7 }, { k: 'say', t: 'Неважно. Ключ приведёт его в банк Уинслоу. Там мы его и встретим.', x: 0.3, y: 0.6, w: 0.66, tail: [0.5, 0.35] }] },
            { art: 'key', text: [{ k: 'cap', t: 'Ключ с биркой: «WINSLOW BANK — 1313». Если здесь меня знают — начать стоит оттуда.', x: 0.03, y: 0.06, w: 0.5 }] }
          ]
        }
      ]
    }
  });
})(globalThis.XIII = globalThis.XIII || {});
