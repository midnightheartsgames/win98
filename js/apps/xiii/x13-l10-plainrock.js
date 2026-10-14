(function (X) {
  'use strict';
  const F = X.F;
  const Y = 10, GY = Y - 0.06, T1 = Y + 3.6, TOPB = Y + 7.6, A1 = Y + 4, AR = Y + 8;
  const sm = t => X.smooth(X.clamp(t, 0, 1));
  const HOVER = [-8, AR + 3.2, -40];
  const MONGOOSE_POINTS = [[-14, AR, -46], [10, AR, -48], [14, AR, -32], [-2, AR, -31], [-16, AR, -33], [2, AR, -44]];

  function ground(x, z) {
    const ex = Math.max(0, Math.abs(x) - 46), ez = Math.max(0, z - 50, -68 - z);
    const d = Math.hypot(ex, ez);
    if (d <= 0) return GY;
    const cliff = GY - (GY + 3) * sm(d / 14);
    const n = Math.sin(x * 0.11 + 0.4) * Math.cos(z * 0.09) * 1.2 + Math.sin(x * 0.27 - z * 0.21) * 0.5;
    return cliff + n * sm(d / 6) * (1 - sm((d - 20) / 10));
  }

  function freeInmates(g, arm) {
    for (const c of g.chars) {
      if (c.group !== 'inmates' || c.state !== 'alive') continue;
      c.pose = null; c.ai.static = false; c.spawn.static = false; c.ai.sight = 30; c.ai.untargetable = false;
      if (arm && /[02468]$/.test(c.id)) c.weapon = c.id === 'pr0' ? 'shotgun' : 'beretta';
    }
  }

  function cells(B) {
    B.floor(-16, 10, 16, 34, Y, 'concrete', 0.4);
    B.wall(-16, 10, 16, 10, Y, TOPB, 'brick', { t: 0.4, holes: [[14, 4, 0, 3.2]] });
    B.wall(-16, 34, 16, 34, Y, TOPB, 'brick', { t: 0.4, holes: [[10, 1.6, 5.2, 6.8, true], [20.4, 1.6, 5.2, 6.8, true]] });
    for (const sx of [-1, 1]) {
      const wx = sx * 16;
      B.wall(wx, 10, wx, 34, Y, T1, 'brick', { t: 0.4, holes: [0, 1, 2, 3, 4, 5].map(i => [1.5 + i * 4, 1, 2.2, 2.9]) });
      B.wall(wx, 10, wx, 34, T1, TOPB, 'brick', { t: 0.4, holes: [0, 1, 2, 3, 4, 5].map(i => [1.5 + i * 4, 1, 2.2, 2.9]) });
      B.box(sx * 16, T1 - 0.3, 10, sx * 12, T1, 34, 'concrete', { flags: F.WALL, bot: 'concrete' });
      B.box(sx * 12, T1 - 0.3, 10, sx * 10, T1, 34, 'grate', { flags: F.WALL });
      for (let k = 0; k < 2; k++) {
        const y = k ? T1 : Y, h = k ? TOPB - T1 : T1 - Y - 0.3;
        for (let i = 0; i < 6; i++) {
          const z0 = 10 + i * 4;
          if (i > 0) B.wall(sx * 16, z0, sx * 12, z0, y, y + h, 'plaster', { t: 0.2 });
          B.at(sx * 12, y, z0 + 0.65, Math.PI / 2, () => X.PROPS.cell_bars(B, { len: 1.3, h: Math.min(3.2, h) }));
          B.at(sx * 12, y, z0 + 3.35, Math.PI / 2, () => X.PROPS.cell_bars(B, { len: 1.3, h: Math.min(3.2, h) }));
          B.at(sx * 12, y + 2.6, z0 + 2, Math.PI / 2, () => X.PROPS.cell_bars(B, { len: 1.4, h: Math.min(3.2, h) - 2.6 }));
          B.door(sx * 12, z0 + 2, y, 1.4, 2.6, 'z', { id: 'c' + (sx < 0 ? 'w' : 'e') + k + i, bars: true, slide: true, locked: 'script', noAI: true, label: 'Решётка заперта.' });
          B.prop('bunk', sx * 15.2, y, z0 + 2, 0, { mat: 'fabric' });
          B.prop('toilet', sx * 15.55, y, z0 + 0.6, sx * -Math.PI / 2, {});
          B.prop('sink', sx * 15.6, y, z0 + 3.3, sx * -Math.PI / 2, {});
        }
      }
      const rail = (z, len) => B.at(sx * 10, T1, z, Math.PI / 2, () => X.PROPS.post_rail(B, { len, h: 1.0 }));
      rail(15.5, 11); rail(24.3, 2.6);
    }
    B.box(-10, T1 - 0.3, 21, 10, T1, 23, 'grate', { flags: F.WALL });
    for (const z of [21, 23]) B.at(0, T1, z, 0, () => X.PROPS.post_rail(B, { len: 20, h: 1.0 }));
    B.stairs(-10, 25.6, -8.4, 33.6, Y, T1, 'n', 'concrete');
    B.stairs(8.4, 25.6, 10, 33.6, Y, T1, 'n', 'concrete');
    B.ceil(-16, 10, 16, 34, TOPB, 'concrete', 0.3);
    B.room(-2, 14, 2, 18, Y, 2.6, { floor: null, ceil: 'metal_grey', wall: 'metal_grey', t: 0.12, doors: { s: [[1.3, 1.4]] }, windows: { n: [[0.4, 3.2, 1.0, 2.2]], e: [[0.4, 3.2, 1.0, 2.2]], w: [[0.4, 3.2, 1.0, 2.2]] } });
    B.prop('desk', 0, Y, 15.2, 0, { w: 2.2, pc: true });
    B.item('doc', -0.6, Y + 0.8, 15.2, { title: 'Журнал дежурного', text: 'Камера В-7: Роуланд, он же XIII. Не разговаривать, не подходить поодиночке. Мангуст прибывает в 06:00 вертолётом. При отключении тока — резервный генератор, но только на вышки. Камеры без тока открываются! Когда уже починят эту проклятую схему?' });
    for (const z of [13, 19, 25, 31]) {
      B.at(0, TOPB, z, 0, () => X.PROPS.ceiling_light(B, { r: 11, color: [0.92, 1, 0.9], id: 'block' }));
      B.light(sx0(z), Y + 2.6, z, [1, 0.12, 0.08], 9, { id: 'emerg', on: false, bulbR: 0.1 });
    }
    B.interior(-16, Y - 0.4, 10, 16, TOPB, 34);
  }
  function sx0(z) { return (z % 2 ? -1 : 1) * 11.6; }

  function yard(B) {
    B.vbox(-32, GY - 0.1, -28, 32, Y - 0.03, 10, 'asphalt');
    for (const [x0, z0, x1, z1] of [[-10, -12, 10, -12.1], [-10, -2, 10, -2.1], [-10, -12, -9.9, -2], [9.9, -12, 10, -2]]) B.vbox(x0, Y - 0.03, z0, x1, Y - 0.015, z1, 'road_line');
    B.fence(-32, -16, -6, -16, GY, 3.2, { span: 4 });
    B.fence(6, -16, 32, -16, GY, 3.2, { span: 4 });
    for (const [x, z, a] of [[-20, 0, 0], [-20, -6, 0], [20, -4, Math.PI / 2], [-24, -22, 0.3]]) B.prop('bench', x, Y, z, a, {});
    B.at(-5, Y, -25.4, 0, () => X.PROPS.sandbags(B, { len: 3.4 }));
    B.at(5, Y, -25.4, 0, () => X.PROPS.sandbags(B, { len: 3.4 }));
    B.at(-30, Y, -24, 0, () => X.PROPS.watchtower(B, { h: 6, roof: 'roof_tar' }));
    B.at(30, Y, 4, 0, () => X.PROPS.watchtower(B, { h: 6, roof: 'roof_tar' }));
    B.searchlight(-30, Y + 8.4, -24, -Math.PI * 0.75, { id: 'slA', sweep: 0.75, speed: 0.32, pitch: -0.34, range: 55, r: 10 });
    B.searchlight(30, Y + 8.4, 4, Math.PI * 0.72, { id: 'slB', sweep: 0.75, speed: 0.36, pitch: -0.34, range: 55, r: 10, phase: 1.4 });
    for (const [x0, z0, x1, z1] of [[-36, -58, 36, -58], [-36, 40, 36, 40], [-36, -58, -36, 40], [36, -58, 36, 40]]) {
      if (z0 === z1) B.box(x0, GY, z0 - 0.4, x1, Y + 6, z0 + 0.4, 'concrete', { flags: F.WALL });
      else B.box(x0 - 0.4, GY, z0, x0 + 0.4, Y + 6, z1, 'concrete', { flags: F.WALL });
    }
    for (let x = -34; x <= 34; x += 4) B.vbox(x - 0.03, Y + 6, -58.1, x + 0.03, Y + 7.2, -57.9, 'metal_dark');
    B.beam([-36, Y + 7, -58], [36, Y + 7, -58], 0.02, 'metal_grey', { sides: 3 });
    for (const [x, z] of [[-26, 6], [26, -20], [0, -8], [-26, -14]]) B.prop('lamp_post', x, Y, z, 0, { id: 'yardlamp', r: 11, color: [1, 0.85, 0.6] });
    B.prop('generator', 30, Y, -12, Math.PI / 2, {});
    B.prop('crates', 26, Y, -26, 0.4, { n: 3 });
    B.prop('van', -26, Y, -40, 0.2, { mat: 'car_white' });
  }

  function admin(B) {
    B.floor(-20, -52, 20, -28, Y, 'tiles', 0.4);
    const W = 'plaster_blue';
    B.wall(-20, -28, 20, -28, Y, A1, 'brick', { t: 0.4, holes: [[18, 4, 0, 3], [4, 2, 1.1, 2.6, true], [10, 2, 1.1, 2.6, true], [26, 2, 1.1, 2.6, true], [33, 2, 1.1, 2.6, true]] });
    B.wall(-20, -28, 20, -28, A1, AR, 'brick', { t: 0.4, holes: [[4, 2, 1.1, 2.6, true], [10, 2, 1.1, 2.6, true], [18, 4, 1.1, 2.6, true], [26, 2, 1.1, 2.6, true], [33, 2, 1.1, 2.6, true]] });
    for (const [y0, y1] of [[Y, A1], [A1, AR]]) {
      B.wall(-20, -52, 20, -52, y0, y1, 'brick', { t: 0.4, holes: [[6, 2, 1.1, 2.6, true], [30, 2, 1.1, 2.6, true]] });
      B.wall(-20, -52, -20, -28, y0, y1, 'brick', { t: 0.4, holes: [[5, 2, 1.1, 2.6, true], [17, 2, 1.1, 2.6, true]] });
      B.wall(20, -52, 20, -28, y0, y1, 'brick', { t: 0.4, holes: [[5, 2, 1.1, 2.6, true], [17, 2, 1.1, 2.6, true]] });
    }
    B.wall(-8, -52, -8, -28, Y, A1, W, { t: 0.2, holes: [[5, 1.3], [18, 1.3]] });
    B.wall(8, -52, 8, -40, Y, A1, W, { t: 0.2, holes: [[5, 1.3]] });
    B.wall(-20, -40, -8, -40, Y, A1, W, { t: 0.2 });
    B.wall(8, -40, 20, -40, Y, A1, W, { t: 0.2 });
    B.wall(-8, -40, 4, -40, Y, A1, W, { t: 0.2, holes: [[7, 1.3]] });
    B.door(8, -32.6, Y, 1.3, 2.2, 'z', { id: 'armory', locked: 'armory', keyName: 'от оружейной', mat: 'door_metal' });
    B.wall(8, -40, 8, -28, Y, A1, W, { t: 0.2, holes: [[6.75, 1.3]] });
    B.wall(4, -52, 4, -40, Y, AR + 2.6, 'concrete', { t: 0.2 });
    B.wall(8, -52, 8, -40, A1, AR + 2.6, 'concrete', { t: 0.2 });
    B.wall(4, -40, 8, -40, Y, A1, 'concrete', { t: 0.2, holes: [[0.2, 1.6, 0, 2.3]] });
    B.wall(4, -40, 8, -40, A1, AR, 'concrete', { t: 0.2, holes: [[2.2, 1.6, 0, 2.3]] });
    B.wall(4, -40, 8, -40, AR, AR + 2.6, 'concrete', { t: 0.2, holes: [[2.2, 1.6, 0, 2.3]] });
    B.stairs(4.1, -49, 6, -41, Y, Y + 2, 'n', 'concrete');
    B.box(4.1, Y + 1.7, -52, 7.9, Y + 2, -49, 'concrete', { flags: F.WALL });
    B.stairs(6, -49, 7.9, -41, Y + 2, A1, 's', 'concrete');
    B.box(6, A1 - 0.3, -41, 7.9, A1, -40, 'concrete', { flags: F.WALL });
    B.stairs(4.1, -49, 6, -41, A1, A1 + 2, 'n', 'concrete');
    B.box(4.1, A1 + 1.7, -52, 7.9, A1 + 2, -49, 'concrete', { flags: F.WALL });
    B.stairs(6, -49, 7.9, -41, A1 + 2, AR, 's', 'concrete');
    B.box(6, AR - 0.3, -41, 7.9, AR, -40, 'concrete', { flags: F.WALL });
    B.box(3.8, AR + 2.6, -52.2, 8.2, AR + 2.85, -39.8, 'concrete', { flags: F.WALL });
    B.interior(4, Y - 0.3, -52, 8, AR + 2.6, -40);
    B.light(7, A1 - 0.6, -46, [1, 0.9, 0.7], 6, { bulbR: 0.08 });
    B.light(7, AR + 2.2, -46, [1, 0.9, 0.7], 6, { bulbR: 0.08 });

    for (const [x0, z0, x1, z1] of [[-20, -52, 4, -28], [8, -52, 20, -28], [4, -40, 8, -28]]) B.box(x0, A1 - 0.3, z0, x1, A1, z1, 'tiles', { flags: F.WALL, bot: 'ceiling_tiles' });
    B.wall(-8, -52, -8, -28, A1, AR, W, { t: 0.2, holes: [[18, 1.3]] });
    B.wall(8, -40, 8, -28, A1, AR, W, { t: 0.2, holes: [[6.75, 1.3]] });
    B.wall(-8, -40, 4, -40, A1, AR, W, { t: 0.2, holes: [[5, 1.3]] });
    B.wall(8, -40, 20, -40, A1, AR, W, { t: 0.2 });
    for (const [x0, z0, x1, z1] of [[-20, -52, 4, -28], [8, -52, 20, -28], [4, -40, 8, -28]]) B.box(x0, AR - 0.3, z0, x1, AR, z1, 'roof_tar', { flags: F.WALL, bot: 'ceiling_tiles' });
    for (const [x0, z0, x1, z1] of [[-20.2, -28.4, 20.2, -27.8], [-20.2, -52.2, 20.2, -51.6], [-20.2, -52.2, -19.6, -27.8], [19.6, -52.2, 20.2, -27.8]]) B.box(x0, AR, z0, x1, AR + 1.1, z1, 'brick', { flags: F.WALL });
    B.interior(-20, Y - 0.3, -52, 20, AR, -28);

    B.prop('counter', 0, Y, -34, 0, { len: 5, mat: 'wood', top: 'formica' });
    B.prop('plant', -6.6, Y, -29.4, 0, {});
    B.sign('PLAIN ROCK FEDERAL PENITENTIARY', 0, Y + 3.3, -39.85, 7, 0.6, Math.PI, { bg: '#1a2a4a', fg: '#e0d0a0', font: 'serif' });
    B.light(0, A1 - 0.4, -34, [1, 0.95, 0.85], 10, { bulbR: 0.1, id: 'admin' });
    for (let i = 0; i < 3; i++) B.prop('desk', -17 + i * 3.6, Y, -35, 0, { w: 1.6 });
    B.item('medkit', -18.8, Y + 0.1, -38.6, {});
    B.light(-14, A1 - 0.4, -34, [1, 0.95, 0.85], 9, { bulbR: 0.1, id: 'admin' });
    B.prop('table', -14, Y, -46, 0, { w: 2.4, d: 1.2 });
    B.prop('cooler', -19.3, Y, -50.6, Math.PI / 2, {});
    B.item('food', -14, Y + 0.8, -46, { n: 25, name: 'Холодный кофе охраны' });
    for (let i = 0; i < 2; i++) B.prop('shelf', 19.6, Y, -37.8 + i * 3.4, -Math.PI / 2, { w: 3, h: 2.2, fill: 'crate' });
    B.prop('table', 14, Y, -34, 0, { w: 3, d: 1.2, mat: 'metal_grey', leg: 'metal_dark' });
    B.item('weapon', 13, Y + 0.8, -34, { w: 'm16', n: 90 });
    B.item('weapon', 14.2, Y + 0.8, -34.2, { w: 'shotgun', n: 16 });
    B.item('weapon', 15.2, Y + 0.8, -33.8, { w: 'magnum', n: 18 });
    B.item('weapon', 12, Y + 0.1, -30, { w: 'bazooka', n: 3 });
    B.item('grenades', 12.6, Y + 0.1, -37, { n: 4 });
    B.item('vest', 10, Y + 0.1, -38.6, { n: 100 });
    B.light(14, A1 - 0.4, -34, [1, 0.95, 0.85], 8, { bulbR: 0.1, id: 'admin' });
    B.prop('locker', 19.4, Y, -46, -Math.PI / 2, { n: 4 });
    B.prop('table', 13, Y, -46, 0, { w: 2, d: 1 });
    B.light(14, A1 - 0.4, -46, [1, 0.95, 0.85], 8, { bulbR: 0.1, id: 'admin' });
    B.prop('desk', -14, A1, -45, 0, { w: 2.4, lamp: true });
    B.prop('bookshelf', -14, A1, -51.4, 0, { w: 3 });
    B.prop('armchair', -14, A1, -46.4, 0, {});
    B.item('doc', -14.4, A1 + 0.8, -44.8, { title: 'Директору тюрьмы: лично', text: 'Заключённого XIII содержать до прибытия Мангуста. Номер Один напоминает: Роуланд знает, кто такие Двадцать, даже если сам этого не помнит. Если он заговорит — последствия для страны будут необратимы. Подпись: «XX». И ниже, от руки: «Прости, Стив».' });
    B.light(-14, AR - 0.4, -46, [1, 0.85, 0.6], 8, { bulbR: 0.1, id: 'admin' });
    for (let i = 0; i < 4; i++) B.prop('computer', 10 + i * 2.6, A1, -30, Math.PI, {});
    B.prop('desk', 14, A1, -30.4, Math.PI, { w: 9, d: 0.9 });
    B.light(14, AR - 0.4, -34, [0.8, 0.95, 1], 8, { bulbR: 0.1, id: 'admin' });
    B.light(0, AR - 0.4, -34, [1, 0.95, 0.85], 8, { bulbR: 0.1, id: 'admin' });
    B.item('medkit', 1.6, A1 + 0.1, -38.6, {});

    B.prop('helipad', -8, AR, -40, 0, {});
    for (const [x, z] of [[14, -46], [14, -34]]) B.at(x, AR, z, 0, () => X.PROPS.hvac(B, {}));
    B.at(-17, AR, -30.5, 0, () => X.PROPS.antenna(B, { h: 9 }));
    B.prop('crates', 2, AR, -30.4, 0.3, { n: 2 });
    for (const [x, z] of [[-18.6, -50.6], [18.6, -29.4]]) B.light(x, AR + 1.6, z, [1, 0.3, 0.2], 7, { bulbR: 0.1, flicker: 0.3 });
  }

  function island(B) {
    const r = X.rng(1010);
    for (let i = 0; i < 40; i++) {
      const a = r() * Math.PI * 2, d = 60 + r() * 40;
      const x = Math.cos(a) * d * 0.9, z = -8 + Math.sin(a) * d;
      B.rock(x, z, 2 + r() * 4, { y: ground(x, z) - 0.5, solid: false, mat: 'rock' });
    }
    B.at(0, 0, 60, 0.1, () => { B.box(-2, -1, -18, 2, 1.2, 18, 'quay', { flags: F.WALL }); });
    B.cyl(40, GY, 44, 1.6, 12, 'lighthouse', { sides: 12, flags: F.WALL, r2: 1.2 });
    B.cyl(40, GY + 12, 44, 1.4, 1.6, 'lamp_glass', { sides: 10, solid: false, emit: true });
    B.light(40, GY + 12.8, 44, [1, 0.95, 0.7], 30, { bulbR: 0.5 });
  }

  X.addLevel({
    id: 'plainrock', n: 10, name: 'Plain Rock Penitentiary', sub: 'Федеральная тюрьма Плейн-Рок',
    env: {
      sky: { top: [0.04, 0.05, 0.08], mid: [0.08, 0.09, 0.13], hor: [0.16, 0.17, 0.22], below: [0.06, 0.07, 0.09], sun: [0.4, 0.6, 0.5], sunColor: [0.4, 0.45, 0.6], sunSize: 0.0, clouds: 1, cloudColor: [0.16, 0.17, 0.22], mountains: 0.6, mountainColor: [0.06, 0.07, 0.1] },
      light: { dir: [0.4, 0.75, 0.5], color: [0.34, 0.38, 0.5], ambient: [0.2, 0.21, 0.28], shadow: [0.17, 0.18, 0.25], indoor: [0.5, 0.5, 0.48] },
      fog: { color: [0.1, 0.11, 0.15], near: 18, far: 130 },
      grade: { tint: [0.95, 0.98, 1.06], sat: 0.8 },
      rain: 1
    },
    light: 0.62,
    music: 'stealth',
    ambience: 'rain',
    start: { strip: true },
    loadout: { weapons: [], clip: {}, res: {}, medkits: 0, gadgets: {}, skills: ['sense', 'marksman', 'silent', 'hands', 'cold', 'tough', 'knives'] },
    build(B) {
      B.bounds(-40, -62, 40, 44);
      B.terrain({ x0: -200, z0: -220, x1: 200, z1: 200, cell: 4, fn: ground, mat: 'rock', steep: 'rock', low: 'sand_wet', lowY: 0.4 });
      B.water(-200, -220, 200, 200, 0, { color: [0.1, 0.14, 0.18] });
      cells(B);
      yard(B);
      admin(B);
      island(B);
      B.vehicle('heli', 160, 40, -170, { id: 'rescue', hp: 999999, r: 2.6, hidden: true, friendly: true, yaw: 0.8 });

      B.spawnPlayer(-14.2, T1, 20, -Math.PI / 2);
      const occupied = [['w', 0, 0], ['w', 0, 3], ['w', 1, 0], ['w', 1, 4], ['e', 0, 1], ['e', 0, 4], ['e', 1, 2], ['e', 1, 5], ['w', 0, 5], ['e', 1, 0]];
      occupied.forEach(([s, k, i], n) => {
        const sx = s === 'w' ? -1 : 1;
        B.char('prisoner', sx * 14.4, 10 + i * 4 + 2.8, { y: k ? T1 : Y, id: 'pr' + n, pose: 'sit', static: true, weapon: null, look: sx * Math.PI / 2, group: 'inmates', sight: 0.01, untargetable: true });
      });
      B.char('guard', -7, 12, { y: Y, id: 'g1', path: [[-7, Y, 12], [-7, Y, 30], [7, Y, 30], [7, Y, 12]], wait: 2 });
      B.char('guard', -11, 12, { y: T1, id: 'g2', path: [[-11, T1, 12], [-11, T1, 24]], wait: 3, weapon: 'shotgun' });
      B.char('guard', 0.4, 16.4, { y: Y, id: 'g3', pose: 'sit', static: true, look: Math.PI, weapon: 'beretta' });
      B.char('guard', 11, 30, { y: T1, id: 'g4', look: Math.PI / 2 });
      for (let i = 0; i < 6; i++) B.char('prisoner', -18 + i * 7, -4 + (i % 2) * 5, { id: 'rt' + i, group: 'riot', hidden: true, weapon: i % 3 === 0 ? 'shotgun' : 'beretta', aggressive: true });
      B.char('guard', -5, -27, { id: 'y1', look: Math.PI, weapon: 'm16' });
      B.char('guard', 5, -27, { id: 'y2', look: Math.PI, weapon: 'm16' });
      B.char('officer', 0, -24, { id: 'cap', look: Math.PI, weapon: 'magnum', loot: [{ kind: 'key', key: 'armory', label: 'Ключ от оружейной' }] });
      B.char('guard', -20, -20, { id: 'y3', path: [[-20, -20], [20, -20]], wait: 2, weapon: 'm16' });
      B.char('guard', -30, -24, { y: Y + 6.2, id: 'ts1', ai: 'sniper', static: true, weapon: 'sniper', sight: 70, look: Math.PI * 0.75 });
      B.char('guard', 30, 4, { y: Y + 6.2, id: 'ts2', ai: 'sniper', static: true, weapon: 'sniper', sight: 70, look: -Math.PI * 0.72 });
      B.char('guard', 0, -31, { y: Y, id: 'a1', look: Math.PI, weapon: 'shotgun' });
      B.char('guard', -11.6, -33, { y: Y, id: 'a2', path: [[-11.6, Y, -31], [-11.6, Y, -38]], wait: 2 });
      B.char('guard', 16.5, -44, { y: Y, id: 'a3', look: Math.PI / 2 });
      B.char('guard', -2, -36, { y: A1, id: 'a4', path: [[-2, A1, -36], [-2, A1, -31]], wait: 2, weapon: 'm16' });
      B.char('guard', 12, -34, { y: A1, id: 'a5', look: Math.PI, weapon: 'm16' });
      B.char('mongoose', -2, -44, { y: AR, id: 'mongoose', points: MONGOOSE_POINTS, grenadier: true, sight: 50, deaf: true, bossName: 'Мангуст', taunts: ['Ты всегда был упрямым, Роуланд!', 'Номер Один не любит ждать!', 'Двадцатка вечна, Тринадцатый!', 'Иди ко мне!'] });
      B.char('killer', -12, -30.5, { y: AR, id: 'r1', look: Math.PI, deaf: true });
      B.char('killer', 12, -40, { y: AR, id: 'r2', look: Math.PI / 2, deaf: true });

      B.trigger('blockN', -4, Y - 0.5, 4, 4, Y + 3, 10.5);
      B.trigger('yardS', -30, Y - 0.5, -26, 30, Y + 3, -16);
      B.trigger('lobby', -7.5, Y - 0.5, -39.5, 7.5, Y + 3, -28.5);
      B.trigger('roof', -19.5, AR - 0.5, -51.5, 19.5, AR + 3, -28.5);
      B.trigger('rescue', -12, AR - 0.5, -44, -4, AR + 3, -36);
      B.cam('towerCam', [-25, Y + 7, -18], [-30, Y + 8, -24], 50);
      B.cam('roofCam', [8, AR + 2.4, -30], [-2, AR + 1.4, -44], 50);
      B.cam('cellCam', [-10.6, T1 + 2.2, 17], [-14.2, T1 + 1.2, 20.6], 50);
    },
    script(S) {
      S.on('start', g => {
        g.objective('out', 'Выбраться из камеры');
        g.caption('Плейн-Рок. Камера В-7. Шторм третий день, и третий день мне не дают спать.', 5);
        g.after(3.5, () => g.say('g2', 'Не спится, Тринадцатый? Утром прилетит Мангуст — отоспишься навсегда.', 4));
        g.after(9, () => g.script.fire('blackout'));
        g.flags.nextBolt = 4;
        g.flags.ignorePlayer = 1;
      });
      S.on('blackout', g => {
        g.flags.boltT = g.time;
        g.ev({ t: 'sfx', name: 'thunder', vol: 1.2 });
        g.setFlag('blackout');
        for (const l of g.world.lights) { if (l.id === 'block') l.on = false; if (l.id === 'emerg') l.on = true; }
        for (const d of g.doors) if (/^c[we]\d\d$/.test(d.id)) { d.locked = null; g.openDoor(d, [0, Y, 22]); }
        g.caption('Удар молнии — и темнота. Щёлкнули замки. Все замки. Разом.', 4.5);
        g.complete('out');
        g.objective('weapon', 'Добыть оружие');
        g.objective('admin', 'Пробиться через двор в административный корпус');
        g.after(1.2, () => g.say('pr1', 'Двери открыты! Бей вертухаев!', 3));
        delete g.flags.ignorePlayer;
        freeInmates(g, true);
        for (const id of ['g1', 'g2', 'g3', 'g4']) { const c = g.char(id); if (c && c.state === 'alive') X.AI.alert(g, c, g.player.pos); }
        g.spawn('riot', [0, Y, -10]);
        g.music('combat');
        g.checkpoint('riot');
      });
      S.zone('blockN', g => { if (!g.flags.blackout) g.script.fire('blackout'); });
      S.zone('yardS', g => {
        g.panel({ kind: 'cam', cam: 'towerCam', dur: 2.6, text: 'ВЫШКА', tint: 'red' });
        g.radio('radio', 'Внимание всем постам: бунт в блоке В! Вышкам — огонь на поражение!', 3.5);
        g.checkpoint('yard');
      });
      S.on('open:armory', g => g.msg('Оружейная. Теперь поговорим.', 3));
      S.zone('lobby', g => {
        g.complete('admin');
        g.objective('roof', 'Подняться на крышу — Мангуст ждёт вертолёт там');
        g.objective('armoryObj', 'Необязательно: вскрыть оружейную ключом капитана', { optional: true });
        g.checkpoint('admin');
      });
      S.on('open:armory', g => g.complete('armoryObj'));
      S.zone('roof', g => {
        g.panel({ kind: 'cam', cam: 'roofCam', dur: 3, text: 'МАНГУСТ', tint: 'red' });
        g.say('mongoose', 'Роуланд! Номер Один хотел поговорить с тобой лично. Придётся передать ему твою голову.', 4.5);
        g.music('boss');
        for (const id of ['mongoose', 'r1', 'r2']) { const c = g.char(id); if (c && c.state === 'alive') { c.ai.deaf = false; X.AI.alert(g, c, g.player.pos); } }
        g.checkpoint('roof');
      });
      S.dead('mongoose', g => {
        g.complete('roof');
        g.flags.boltT = g.time;
        g.ev({ t: 'sfx', name: 'thunder', vol: 1.2 });
        g.caption('Мангуст рухнул на мокрый бетон. Сквозь дождь — рёв винтов.', 4);
        g.music('calm');
        g.flags.rescueT = g.time;
        const v = g.vehicle('rescue');
        if (v) { v.hidden = false; v.active = true; }
        g.after(3, () => g.radio('jones', 'Тринадцатый! Это Джонс! Прыгай на площадку — я снижаюсь!', 4));
        g.objective('escape', 'Добраться до вертолёта Джонс на площадке');
      });
      S.zone('rescue', g => {
        if (!g.flags.rescueHere) { g.flags['!zone:rescue'] = 0; return; }
        g.complete('escape');
        g.finish();
      });
      S.on('restore', g => {
        if (g.flags.blackout) { for (const l of g.world.lights) { if (l.id === 'block') l.on = false; if (l.id === 'emerg') l.on = true; } freeInmates(g, false); }
        if (g.flags.rescueT) { const v = g.vehicle('rescue'); if (v) { v.hidden = false; v.active = true; } }
      });
    },
    tick(g, dt) {
      if (g.flags.nextBolt !== undefined && g.time > g.flags.nextBolt) {
        g.flags.boltT = g.time;
        g.flags.nextBolt = g.time + 7 + g.rng() * 9;
        const a = g.rng() * Math.PI * 2;
        g.ev({ t: 'sfx', name: 'thunder', vol: 0.6 + g.rng() * 0.5, p: [g.player.pos[0] + Math.cos(a) * 60, 40, g.player.pos[2] + Math.sin(a) * 60] });
      }
      if (!g.objectives.find(o => o.id === 'weapon' && o.done) && g.flags.blackout) {
        const w = g.player.weapons;
        if (Object.keys(w).some(k => w[k] && k !== 'fists' && k !== 'object')) g.complete('weapon');
      }
      const v = g.vehicle('rescue');
      if (v && g.flags.rescueT) {
        const want = X.vsub(HOVER, v.pos), l = X.vlen(want);
        if (l > 0.05) v.pos = X.vma(v.pos, Math.min(l, Math.max(2, l * 0.9) * dt * 0.6 + 0.02), X.vscale(want, 1 / l));
        v.yaw = X.turnTo(v.yaw || 0, X.yawTo(v.pos, g.player.pos), dt * 0.8);
        v.pitch = X.clamp(-l * 0.004, -0.22, 0);
        if (l < 1.5 && !g.flags.rescueHere) { g.flags.rescueHere = 1; g.msg('Вертолёт завис над площадкой!', 3); }
      }
    },
    post(g) {
      const k = g.flags.boltT === undefined ? 0 : Math.max(0, 1 - (g.time - g.flags.boltT) / 0.35);
      const k2 = g.flags.boltT === undefined ? 0 : Math.max(0, 1 - Math.abs(g.time - g.flags.boltT - 0.5) / 0.12);
      const f = Math.max(k, k2 * 0.6);
      return f > 0.01 ? { flash: f * 0.75, flashCol: [0.86, 0.9, 1] } : null;
    },
    comics: {
      intro: [
        {
          rows: [{ h: 0.55, w: [1] }, { h: 0.45, w: [0.52, 0.48] }],
          panels: [
            { cam: { pos: [70, 26, 80], look: [0, 16, -10], fov: 48 }, actors: [], tint: 'grey', text: [{ k: 'cap', t: 'Федеральная тюрьма Плейн-Рок. Скала посреди штормового моря. Отсюда не бегут.', x: 0.03, y: 0.05, w: 0.6 }] },
            { cam: { pos: [-12.6, T1 + 1.6, 20.8], look: [-15, T1 + 0.8, 19.4], fov: 48 }, actors: [{ type: 'xiii', pos: [-15.2, T1, 20], yaw: -Math.PI / 2, pose: 'sit' }], tint: 'grey', text: [{ k: 'think', t: 'Мангуст прилетит утром. У меня одна ночь.', x: 0.05, y: 0.06, w: 0.86 }] },
            { art: 'boom', text: [{ k: 'cap', t: 'И тут в тюрьму ударила молния.', x: 0.05, y: 0.08, w: 0.86 }] }
          ]
        }
      ],
      outro: [
        {
          rows: [{ h: 0.52, w: [0.56, 0.44] }, { h: 0.48, w: [0.6, 0.4] }],
          panels: [
            { cam: { pos: [6, AR + 1.2, -32], look: [-8, AR + 3.4, -40], fov: 50 }, actors: [{ type: 'xiii', pos: [-6.5, AR, -38.6], yaw: 2.2, pose: 'point' }], tint: 'grey', text: [{ k: 'cap', t: 'Вертолёт завис над площадкой. Джонс успела.', x: 0.04, y: 0.05, w: 0.6 }] },
            { shot: { on: 0, dist: 0.85, height: 0.05, angle: -24, fov: 36, target: 'head' }, actors: [{ type: 'jones', pos: [0, 0, 0], yaw: 0, pose: 'talk', float: true }], hideWorld: true, bg: [0.3, 0.36, 0.5], text: [{ k: 'say', t: 'Держись крепче, Тринадцатый! Кэррингтон ждёт на материке.', x: 0.05, y: 0.05, w: 0.9, who: 0 }] },
            { shot: { on: 0, dist: 0.9, height: 0.02, angle: 26, fov: 34, target: 'head' }, actors: [{ type: 'xiii', pos: [0, 0, 0], yaw: 0, pose: 'think', float: true }], hideWorld: true, bg: [0.5, 0.18, 0.14], text: [{ k: 'think', t: 'Двадцать заговорщиков. Одного я знаю — себя. Остальные — впереди.', x: 0.05, y: 0.05, w: 0.9 }] },
            { art: 'dossier', artOpt: { names: ['I — «НОМЕР ОДИН»', 'XIII — СВОБОДЕН', 'XX — ?', 'ПРОДОЛЖЕНИЕ СЛЕДУЕТ…'] }, text: [{ k: 'cap', t: 'ПРОДОЛЖЕНИЕ СЛЕДУЕТ…', x: 0.08, y: 0.78, w: 0.84 }] }
          ]
        }
      ]
    }
  });
})(globalThis.XIII = globalThis.XIII || {});
