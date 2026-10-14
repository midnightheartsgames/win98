(function (M) {
  'use strict';
  const LAMP = [1, 0.78, 0.5];
  const BS = -3.4, F1 = 3.4, F2 = 6.8, F3 = 10.2;
  const FL = [0, F1, F2, F3];
  const thug = (id, group, x, y, z, yaw, weapon, o) => Object.assign({ id, type: 'thug', group, pos: [x, y, z], yaw, weapon, mode: 'ambush' }, o || {});
  const mob = (id, group, x, y, z, yaw, weapon, o) => Object.assign({ id, type: 'mobster', group, pos: [x, y, z], yaw, weapon, mode: 'ambush' }, o || {});

  function groundWithHoles(B, rect, holes, y, mat) {
    let rects = [rect];
    for (const h of holes) {
      const next = [];
      for (const r of rects) {
        if (h[2] <= r[0] || h[0] >= r[2] || h[3] <= r[1] || h[1] >= r[3]) { next.push(r); continue; }
        if (h[1] > r[1]) next.push([r[0], r[1], r[2], h[1]]);
        if (h[3] < r[3]) next.push([r[0], h[3], r[2], r[3]]);
        const a = Math.max(r[1], h[1]), b = Math.min(r[3], h[3]);
        if (h[0] > r[0]) next.push([r[0], a, h[0], b]);
        if (h[2] < r[2]) next.push([h[2], a, r[2], b]);
      }
      rects = next;
    }
    for (const r of rects) B.box(r[0], y - 1, r[1], r[2], y, r[3], mat);
  }

  M.defineLevel({
    id: 'gun',
    title: 'Пусть заговорят стволы',
    titleEn: 'Let the Gun Do the Talking',
    part: 1,
    chapter: 5,
    world: { ambient: [0.06, 0.055, 0.05], fog: { color: [0.05, 0.055, 0.065], near: 18, far: 75 }, weather: 'blizzard', sky: 'night', moon: { dir: M.norm([0.25, -0.85, 0.35]), color: [0.08, 0.09, 0.12] } },
    start: { pos: [12, 0, -18], yaw: Math.PI },
    loadout: { weapons: ['beretta', 'beretta2', 'deagle', 'pump', 'bat', 'molotov'], ammo: { '9mm': 100, '50ae': 14, '12g': 16, molo: 1 }, painkillers: 3 },
    music: 'tension',
    intro: 'gun_in',
    outro: 'gun_out',
    killY: -30,
    thought: 'Логово людей Лупино в доходном доме напротив.',
    build(B) {
      groundWithHoles(B, [-20, -40, 80, 40], [[40, 14, 44, 22], [4, 0, 40, 24]], 0, 'asphalt_snow');
      B.box(-20, 0, -3, 80, 0.15, 0, 'sidewalk');
      B.box(-20, 0, -24, 80, 0.15, -21, 'sidewalk');
      B.zone(-20, -2, -40, 80, 40, 40, { outdoor: true, amb: [0.09, 0.1, 0.13] });
      B.zone(4, -4, 0, 40.2, 14, 24, { outdoor: false });
      B.zone(40, -4, 14, 44, -0.1, 22, { outdoor: false });
      B.zone(44, -1, 0, 56, 3.5, 10, { outdoor: false });
      B.box(-20, 0, -40, 80, 14, -24, { side: 'facade_brown', top: 'roof_tar' });
      B.decal(12, 4, -23.9, 'pz', 4.5, 1.1, 'neon_hotel', { emissive: true });
      B.box(-20, 0, 0, 4, 12, 30, { side: 'facade_brick', top: 'roof_tar' });
      B.box(56, 0, 0, 80, 10, 30, { side: 'facade_grey', top: 'roof_tar' });
      B.box(44, 0, 10, 56, 6, 30, { side: 'facade_brick', top: 'roof_tar' });
      B.box(4, 0, 28, 44, 16, 34, { side: 'facade_dark', top: 'roof_tar' });
      B.box(40, 0, 13.9, 40.1, 1, 22, 'metal'); B.box(43.9, 0, 14, 44, 1, 22, 'metal'); B.box(40, 0, 21.9, 44, 1, 22, 'metal');
      const rooms = [
        { id: 'cel', x0: 22, z0: 14, x1: 40, z1: 24, y: BS, floor: 'concrete_dark', wall: 'brick_dark', ceil: 'ceiling_dark' },
        { id: 'cst', x0: 40, z0: 14, x1: 44, z1: 22, y: BS, floor: 'concrete', wall: 'brick_dark', noCeil: true },
        { id: 'c0', x0: 4, z0: 0, x1: 36, z1: 4, y: 0, floor: 'linoleum', wall: 'wallpaper_green', ceil: 'ceiling_panel' },
        { id: 'hall0', x0: 4, z0: 4, x1: 26, z1: 24, y: 0, h: 3.15, floor: 'wood_floor', wall: 'plaster_dirty', ceil: 'ceiling_dark', holes: [[22, 15, 26, 21.2]] },
        { id: 'store0', x0: 26, z0: 4, x1: 36, z1: 12, y: 0, floor: 'concrete', wall: 'plaster_dirty', ceil: 'ceiling_dark' },
        { id: 'back0', x0: 26, z0: 12, x1: 36, z1: 24, y: 0, floor: 'linoleum', wall: 'plaster_green', ceil: 'ceiling_dark' },
        { id: 'sw', x0: 36, z0: 0, x1: 40, z1: 12, y: 0, h: 13.35, floor: 'concrete', wall: 'plaster_dirty', ceil: 'ceiling_dark' },
        { id: 'c1', x0: 4, z0: 0, x1: 36, z1: 4, y: F1, floor: 'carpet_hotel', wall: 'wallpaper_hotel', ceil: 'ceiling_panel' },
        { id: 'a1', x0: 4, z0: 4, x1: 16, z1: 16, y: F1, floor: 'wood_floor', wall: 'wallpaper_home', ceil: 'plaster' },
        { id: 'b1', x0: 16, z0: 4, x1: 28, z1: 16, y: F1, floor: 'carpet_red', wall: 'wallpaper_red', ceil: 'plaster' },
        { id: 'k1', x0: 28, z0: 4, x1: 36, z1: 16, y: F1, floor: 'kitchen_tile', wall: 'plaster', ceil: 'plaster' },
        { id: 'd1', x0: 4, z0: 16, x1: 36, z1: 24, y: F1, floor: 'wood_floor', wall: 'wallpaper_green', ceil: 'plaster' },
        { id: 'c2', x0: 4, z0: 0, x1: 36, z1: 4, y: F2, floor: 'carpet_hotel', wall: 'wallpaper_hotel', ceil: 'ceiling_panel' },
        { id: 'a2', x0: 4, z0: 4, x1: 16, z1: 16, y: F2, floor: 'wood_floor', wall: 'wallpaper_home', ceil: 'plaster' },
        { id: 'b2', x0: 16, z0: 4, x1: 24, z1: 16, y: F2, floor: 'carpet_blue', wall: 'wallpaper_green', ceil: 'plaster' },
        { id: 'r2', x0: 24, z0: 4, x1: 36, z1: 16, y: F2, floor: 'wood_floor', wall: 'plaster_dirty', ceil: 'plaster', ceilHoles: [[26, 8, 30, 14]] },
        { id: 'd2', x0: 4, z0: 16, x1: 36, z1: 24, y: F2, floor: 'linoleum', wall: 'plaster_dirty', ceil: 'plaster' },
        { id: 'a3', x0: 4, z0: 4, x1: 20, z1: 24, y: F3, floor: 'parquet', wall: 'wallpaper_home', ceil: 'plaster' },
        { id: 'b3', x0: 20, z0: 4, x1: 36, z1: 24, y: F3, floor: 'wood_floor', wall: 'plaster_dirty', ceil: 'plaster', holes: [[26, 8, 30, 14]] },
        { id: 'c3', x0: 4, z0: 0, x1: 36, z1: 4, y: F3, floor: 'carpet_hotel', wall: 'wallpaper_hotel', ceil: 'ceiling_panel' },
        { id: 'shop', x0: 44, z0: 0, x1: 56, z1: 10, y: 0, floor: 'linoleum', wall: 'tile_white', ceil: 'ceiling_panel' }
      ];
      B.plan({
        y: 0, h: 3.15, outer: 'brick_dark',
        rooms,
        doors: [
          { x: 20, z: 0, w: 1.6, y: 0, door: { id: 'front', mat: 'door_wood', double: true, locked: true, lockMsg: 'Парадная заперта изнутри. Придётся искать другой вход.' } },
          { x: 40, z: 21, w: 1.4, y: BS, door: { id: 'cel_door', mat: 'door_old', swing: -1 } },
          { x: 36, z: 1, w: 1.2, y: 0, door: { id: 'sw0', mat: 'door_metal', locked: true, keyFlag: 'swkey', lockMsg: 'Дверь на лестницу заперта. Ключ должен быть у кого-то из них.' } },
          { x: 36, z: 1, w: 1.2, y: F1, door: { id: 'sw1', mat: 'door_metal', swing: -1 } },
          { x: 36, z: 1, w: 1.2, y: F2, door: { id: 'sw2', mat: 'door_metal', swing: -1 } },
          { x: 36, z: 1, w: 1.2, y: F3, door: { id: 'sw3', mat: 'door_metal', locked: true, lockMsg: 'Дверь заклинило.' } },
          { x: 15, z: 4, w: 1.4, y: 0, door: { id: 'hall_door', mat: 'door_wood', double: true, swing: 1 } },
          { x: 31, z: 4, w: 1.1, y: 0, door: { id: 'store_door', mat: 'door_metal', swing: 1 } },
          { x: 26, z: 18, w: 1.1, y: 0, door: { id: 'back_door', mat: 'door_wood', swing: 1 } },
          { x: 10, z: 4, w: 1.1, y: F1, door: { id: 'a1_door', mat: 'door_wood', swing: 1 } },
          { x: 22, z: 4, w: 1.1, y: F1, door: { id: 'b1_door', mat: 'door_wood', swing: 1, open: 1, target: 1 } },
          { x: 32, z: 4, w: 1.1, y: F1, door: { id: 'k1_door', mat: 'door_wood', swing: 1 } },
          { x: 10, z: 16, w: 1.1, y: F1 },
          { x: 10, z: 4, w: 1.1, y: F2, door: { id: 'a2_door', mat: 'door_wood', swing: 1 } },
          { x: 20, z: 4, w: 1.1, y: F2, door: { id: 'b2_door', mat: 'door_wood', swing: 1 } },
          { x: 30, z: 4, w: 1.1, y: F2, door: { id: 'r2_door', mat: 'door_wood', swing: 1 } },
          { x: 20, z: 16, w: 1.1, y: F2 },
          { x: 20, z: 18, w: 1.1, y: F3, door: { id: 'a3_door', mat: 'door_wood', swing: -1 } },
          { x: 28, z: 4, w: 1.1, y: F3, door: { id: 'b3_door', mat: 'door_wood', locked: true, lockMsg: 'Завалено с той стороны.' } },
          { x: 47, z: 0, w: 1.2, y: 0, door: { id: 'shop_door', mat: 'door_metal', swing: 1 } }
        ],
        windows: [
          { x: 51.5, z: 0, w: 5, y: 0, y0: 0.6, y1: 2.6, id: 'shopwin' },
          { x: 8, z: 0, w: 1.6, y: F1, y0: 0.9, y1: 2.2, id: 'w1a' }, { x: 26, z: 0, w: 1.6, y: F1, y0: 0.9, y1: 2.2, id: 'w1b' },
          { x: 8, z: 0, w: 1.6, y: F2, y0: 0.9, y1: 2.2 }, { x: 26, z: 0, w: 1.6, y: F2, y0: 0.9, y1: 2.2 },
          { x: 8, z: 0, w: 1.6, y: F3, y0: 0.9, y1: 2.2 }, { x: 26, z: 0, w: 1.6, y: F3, y0: 0.9, y1: 2.2 },
          { x: 12, z: 24, w: 1.8, y: F3, y0: 0.4, y1: 2.3, id: 'kitwin' }
        ]
      });
      B.stairs(40.3, 14.2, 43.7, 20.2, BS, 0, 'n', 'concrete');
      B.stairs(22.3, 15.2, 25.7, 21, BS, 0, 'n', 'concrete');
      for (let k = 0; k < 3; k++) {
        const y = FL[k];
        B.stairs(36.05, 2, 37.95, 10, y, y + 1.7, 's', 'concrete', { open: true });
        B.box(36, y + 1.7 - 0.14, 10, 40, y + 1.7, 12, { top: 'concrete', side: 'trim', bottom: 'ceiling_dark' });
        B.stairs(38.05, 2, 39.95, 10, y + 1.7, y + 3.4, 'n', 'concrete', { open: true });
        B.box(36, y + 3.4 - 0.14, 0, 40, y + 3.4, 2, { top: 'concrete', side: 'trim', bottom: 'ceiling_dark' });
      }
      B.group('swblock', () => {
        B.box(36, F2 + 1.7, 9.2, 40, F2 + 3.3, 12, 'rubble_c');
        B.box(38, F2 + 1.9, 6.5, 40, F2 + 3.3, 9.2, 'rubble_c');
      });
      B.stairs(26.2, 6.2, 29.8, 14, F2, F3, 's', 'rubble_c');
      B.box(25.6, F2, 6, 26.2, F2 + 0.8, 12, 'rubble_c');
      B.box(40, F3, 24, 60, F3 + 0.12, 26, { top: 'grate', side: 'metal' }, { noShot: true });
      B.box(4, F3, 24, 40, F3 + 0.12, 26, { top: 'grate', side: 'metal' }, { noShot: true });
      B.box(4, F3 + 0.12, 25.9, 40, F3 + 1.1, 26, 'bars', { noShot: true });
      B.zone(4, F3 - 0.5, 24, 60, F3 + 4, 26.2, { outdoor: true, amb: [0.09, 0.1, 0.13] });
      B.group('bomb2', () => { B.decor('rubble', 22, F1, 10, 0.5); B.decor('rubble', 18, F1, 7, 2); }, true);
      B.group('fallen3', () => { B.box(22, F3, 18, 25, F3 + 1.2, 21, 'rubble_c'); B.box(31, F3, 5, 35, F3 + 1.6, 8, 'rubble_c'); B.decor('rubble', 23, F3, 9, 0.8, { solid: false }); }, true);
      B.decor('streetlight', 4, 0, -2.6, 0); B.decor('streetlight', 30, 0, -2.6, 0); B.decor('streetlight', 50, 0, -21.6, Math.PI);
      B.light(4, 4.5, -3.5, [1, 0.72, 0.45], 14); B.light(30, 4.5, -3.5, [1, 0.72, 0.45], 14); B.light(50, 4.5, -20.7, [1, 0.72, 0.45], 14);
      B.group('carOk', () => B.decor('car', 16, 0, -8, Math.PI / 2, { color: '#6a6a6a' }));
      B.group('carWreck', () => { B.decor('car', 16, 0, -8, Math.PI / 2 + 0.2, { color: '#141210' }); B.decor('rubble', 18, 0, -9, 0.4, { solid: false, scale: 0.6 }); }, true);
      B.decor('dumpster', 42, 0, 2, Math.PI / 2);
      B.decor('trash', 41, 0, 9, 0);
      B.decal(50, 3.0, -0.12, 'nz', 3.2, 0.8, 'neon_shop', { emissive: true });
      B.light(50, 3.3, -1, [0.4, 1, 0.5], 6, { i: 0.8 });
      B.decor('shelf', 45, 0, 8.5, Math.PI / 2); B.decor('shelf', 48, 0, 9.4, Math.PI, { seed: 3 }); B.decor('shelf', 52, 0, 9.4, Math.PI, { seed: 7 });
      B.decor('counter', 54.4, 0, 4, -Math.PI / 2); B.decor('fridge', 55.4, 0, 8.5, -Math.PI / 2);
      B.light(48, 2.9, 5, [0.9, 1, 0.95], 8); B.light(54, 2.9, 5, [0.9, 1, 0.95], 7, { i: 0.7 });
      B.light(42, -1.3, 18, [1, 0.8, 0.5], 6, { i: 0.7 });
      B.decor('boiler', 36, BS, 20, 0); B.decor('shelf', 30, BS, 23.5, Math.PI); B.decor('barrel', 25, BS, 23, 0);
      B.light(31, BS + 2.9, 18, [1, 0.6, 0.35], 9);
      for (let x = 8; x < 36; x += 9) for (const y of FL) B.light(x, y + 2.9, 2, LAMP, 6, { i: 0.75 });
      B.light(38, 2.6, 11, [0.9, 0.9, 0.8], 5); B.light(38, F1 + 2.6, 11, [0.9, 0.9, 0.8], 5); B.light(38, F2 + 2.6, 11, [0.9, 0.9, 0.8], 5); B.light(38, F3 + 2.8, 6, [0.9, 0.9, 0.8], 6);
      B.decor('table', 12, 0, 13, 0.3); B.decor('chair', 10.8, 0, 13.3, 1.4, { solid: false }); B.decor('chair', 13.2, 0, 12.4, -1.5, { solid: false }); B.decor('chair', 12.3, 0, 14.4, 3, { solid: false });
      B.decor('sofa', 6, 0, 20, Math.PI / 2, { mat: 'fabric_brown' }); B.decor('piano', 18, 0, 23.3, Math.PI);
      B.decor('pallet', 8, 0, 6, 0.2); B.decor('pallet', 20, 0, 8, -0.3);
      B.decor('tableside', 19.6, 0, 13.4, Math.PI / 2);
      B.light(10, 2.9, 10, LAMP, 9); B.light(18, 2.9, 18, LAMP, 9); B.light(12, 2.9, 20, [1, 0.6, 0.4], 7, { i: 0.7 });
      B.decor('shelf', 35.5, 0, 8, -Math.PI / 2); B.decor('shelf', 28, 0, 11.5, Math.PI, { seed: 2 });
      B.light(31, 2.9, 8, [0.9, 0.9, 0.75], 6);
      B.decor('washer', 35.5, 0, 14, -Math.PI / 2); B.decor('washer', 35.5, 0, 15, -Math.PI / 2);
      B.light(31, 2.9, 18, [0.9, 0.9, 0.8], 6, { i: 0.6 });
      B.decor('desk', 6, F1, 12, Math.PI / 2); B.decor('bed', 12, F1, 14, Math.PI / 2); B.decor('tvstand', 15.4, F1, 6, -Math.PI / 2);
      B.light(10, F1 + 2.9, 10, LAMP, 8);
      B.decor('sofa', 22, F1, 14.8, Math.PI, { mat: 'fabric_red' }); B.decor('table', 22, F1, 12, 0);
      B.light(22, F1 + 2.9, 10, [1, 0.6, 0.35], 8);
      B.decor('counter', 32, F1, 15.6, Math.PI); B.decor('stove', 34.4, F1, 15.55, Math.PI); B.decor('fridge', 35.5, F1, 5, -Math.PI / 2);
      B.light(32, F1 + 2.9, 10, [0.9, 1, 0.95], 7);
      B.decor('bed', 8, F1, 21, 0); B.decor('bed', 30, F1, 21, 0); B.decor('shelf', 20, F1, 23.5, Math.PI);
      B.light(12, F1 + 2.9, 20, LAMP, 8); B.light(28, F1 + 2.9, 20, LAMP, 8);
      B.decor('bed', 8, F2, 12, Math.PI / 2); B.decor('armchair', 13, F2, 6, 0.6);
      B.light(10, F2 + 2.9, 10, LAMP, 8);
      B.decor('sofa', 20, F2, 14.8, Math.PI); B.light(20, F2 + 2.9, 10, [1, 0.8, 0.6], 7);
      B.decor('table', 32, F2, 12, 0.4); B.decor('shelf', 35.5, F2, 7, -Math.PI / 2, { seed: 4 });
      B.light(32, F2 + 2.9, 7, [1, 0.6, 0.35], 8);
      B.decor('bed', 12, F2, 21, 0); B.decor('bed', 28, F2, 21, 0); B.light(20, F2 + 2.9, 20, LAMP, 9);
      B.decor('sofa', 8, F3, 8, Math.PI / 2, { mat: 'fabric_green' }); B.decor('table', 11, F3, 8, 0); B.decor('tvstand', 17, F3, 5, 0);
      B.decor('counter', 6, F3, 23.4, Math.PI); B.decor('stove', 8.2, F3, 23.4, Math.PI); B.decor('fridge', 16.5, F3, 23.3, Math.PI); B.decor('table', 12, F3, 19.5, 0);
      B.light(10, F3 + 2.9, 9, LAMP, 9); B.light(12, F3 + 2.9, 20, [0.9, 1, 0.9], 8);
      B.decor('bed', 32, F3, 20, 0); B.decor('shelf', 22, F3, 23.5, Math.PI);
      B.light(28, F3 + 2.9, 12, [1, 0.55, 0.3], 10); B.light(24, F3 + 2.9, 20, [1, 0.55, 0.3], 8);
      B.decal(20, 2.2, -0.12, 'nz', 2.2, 0.45, 'signw:ДОХОДНЫЙ ДОМ 14');
      B.decal(4.12, 1.6, 16, 'px', 1.2, 1.2, 'graffiti2');
      B.decal(35.88, F1 + 1.4, 10, 'nx', 1.2, 1, 'blood_wall');
    },
    props: [
      { kind: 'mover', id: 'merc', model: 'mercedes', parts: [[-2.5, 0, -0.95, 2.5, 1.45, 0.95]], origin: [26, 0, -12], yaw: Math.PI / 2, path: [[26, 0, -12], [110, 0, -12]], maxSpeed: 16, accel: 5, crush: false, noBrake: true },
      { kind: 'cyl', id: 'cyl_hall', pos: [14.2, 0, 15.2], color: '#2a5aa0' },
      { kind: 'crate', id: 'cr_shop', pos: [45.5, 0, 3], size: [0.8, 0.8, 0.8] },
      { kind: 'crate', id: 'cr_hall', pos: [8.6, 0, 9.6], size: [1.0, 1.0, 0.9], hp: 90 },
      { kind: 'phone', id: 'woden_phone', pos: [6.2, F1 + 0.95, 12], yaw: Math.PI / 2 },
      { kind: 'tv', id: 'tv1', pos: [15.4, F1 + 0.5, 6], yaw: -Math.PI / 2, show: 'address', on: true },
      { kind: 'crate', id: 'cr_k1', pos: [29, F1, 5], size: [0.8, 0.8, 0.8] },
      { kind: 'note', id: 'den_note', pos: [22, F1 + 0.8, 12], title: 'Листок со списком', text: 'Пятница: товар в отель, Рико.\nСуббота: русские опять у причала. Винни говорит, Влад задаёт слишком много вопросов.\nВоскресенье: Лупино в клубе. Не беспокоить, когда он читает.' }
    ],
    items: [
      { kind: 'painkillers', amount: 1, pos: [45.5, 0.02, 3], in: 'cr_shop' },
      { kind: 'ammo', ammo: '9mm', amount: 36, pos: [54.4, 0.95, 4] },
      { kind: 'ammo', ammo: '12g', amount: 8, pos: [30, BS + 1.06, 23.5] },
      { kind: 'weapon', weapon: 'grenade', amount: 2, pos: [35.5, 0.58, 8] },
      { id: 'swkey', kind: 'key', flag: 'swkey', name: 'Ключ от лестницы', pos: [28, 0.58, 11.4] },
      { kind: 'painkillers', amount: 1, pos: [33, 0.02, 21] },
      { kind: 'painkillers', amount: 2, pos: [29, F1 + 0.02, 5], in: 'cr_k1' },
      { kind: 'ammo', ammo: '50ae', amount: 7, pos: [6, F1 + 0.8, 12.5] },
      { kind: 'weapon', weapon: 'ingram', amount: 32, pos: [32, F2 + 0.8, 12] },
      { kind: 'painkillers', amount: 1, pos: [35.5, F2 + 1.06, 7] },
      { kind: 'ammo', ammo: '9mm', amount: 48, pos: [12, F2, 5] },
      { kind: 'painkillers', amount: 1, pos: [11, F3 + 0.8, 8] }
    ],
    chars: [
      thug('sh1', 'shop', 46, 0, 6, 0, 'beretta'),
      mob('sh2', 'shop', 50, 0, 3.4, 0, 'pump'),
      thug('sh3', 'shop', 53.2, 0, 6.5, 0.3, 'beretta'),
      thug('ce1', 'cel', 30, BS, 18, Math.PI / 2, 'beretta'),
      mob('ce2', 'cel', 34, BS, 22, Math.PI / 2, 'pump'),
      thug('h1', 'hall', 11, 0, 12, 0.5, 'beretta', { pose: 'sit' }),
      mob('h2', 'hall', 13, 0, 12.2, -0.8, 'ingram', { pose: 'sit' }),
      thug('h3', 'hall', 12.5, 0, 14.6, 3, 'beretta', { pose: 'sit' }),
      mob('h4', 'hall', 20, 0, 18, Math.PI * 0.8, 'pump'),
      thug('keyman', 'store', 22, 0, 6, 0, 'beretta', { hunter: true }),
      thug('f1a', 'f1', 22, F1, 10, 0.2, 'beretta', { hidden: true }),
      mob('f1b', 'f1', 30, F1, 2, Math.PI / 2, 'ingram', { hidden: true }),
      thug('f2a', 'f2', 12, F2, 2.3, -Math.PI / 2, 'ingram'),
      mob('f2b', 'f2', 20, F2, 10, 0.3, 'pump'),
      thug('f2c', 'f2', 31, F2, 8, 0.2, 'beretta', { gren: 1 }),
      mob('f3a', 'f3', 14, F3, 10, -0.3, 'ingram'),
      mob('f3b', 'f3', 8, F3, 14, -0.8, 'ingram'),
      thug('f3c', 'f3', 17.5, F3, 16, 0.4, 'pump'),
      thug('fridge', 'fridgeGuy', 16.5, F3, 22.3, Math.PI, 'beretta', { pose: 'fridge', mode: 'hold', blind: true, holdFire: true, deaf: true, stay: true })
    ],
    triggers: [
      { id: 'street', min: [-20, 0, -21], max: [80, 3, -14], off: true },
      { id: 'shop', min: [44.5, 0, -3], max: [55.5, 3, 1] },
      { id: 'alley', min: [40.2, 0, 10], max: [43.8, 3, 14] },
      { id: 'cel', min: [22, BS, 14], max: [40, BS + 2.5, 24] },
      { id: 'hall', min: [22, 0, 13], max: [26, 2.5, 15] },
      { id: 'sw1', min: [36, F1, 0], max: [40, F1 + 2.4, 2] },
      { id: 'f1', min: [8, F1, 0], max: [34, F1 + 2.4, 4] },
      { id: 'f2', min: [30, F2, 0], max: [36, F2 + 2.4, 4] },
      { id: 'ramp', min: [26, F2 + 2, 11], max: [30, F3 + 1, 14] },
      { id: 'b3', min: [20.5, F3, 14.5], max: [26, F3 + 2.4, 20] },
      { id: 'a3', min: [14, F3, 16], max: [19.5, F3 + 2.4, 21] },
      { id: 'escape', min: [8, F3, 24.3], max: [16, F3 + 2.4, 26] }
    ],
    on: {
      start(g) {
        g.later(2.2, 'carbomb');
        g.setThought('Доходный дом напротив отеля.');
      },
      carbomb(g) {
        g.show('carOk', false);
        g.show('carWreck', true);
        g.explode([16, 0.8, -8], 6, 90, 'world');
        g.addFire([16, 0, -8], 2.2, 30);
        g.moverGo('merc');
        g.cam({ from: [10, 2.2, -17], to: [18, 2.8, -15], at: [26, 1, -12], followProp: 'merc', dur: 3.2, then: 'bomb2' });
      },
      bomb2(g) {
        g.explode([22, F1 + 1.4, 1.2], 7, 40, 'world');
        g.show('bomb2', true);
        for (const id of ['w1a', 'w1b']) { const q = g.prop(id); if (q) g.breakGlass(q, [0, 0, -1]); }
        g.addFire([22, F1, 10], 2.5, 1e9);
        g.addFire([12, F1, 20], 2, 1e9);
        g.dialog([
          ['max:thought', 'Машина взлетела на воздух. Чёрный «мерседес» уехал, не прибавляя газу. Так уезжают люди, которые всё сделали вовремя.'],
          ['max:thought', 'А потом рвануло в доме напротив, на втором этаже. Логово Лупино кто-то вскрывал за меня.']
        ]);
        g.setThought('Войти в доходный дом. Парадная заперта, нужен другой вход.');
        g.alert('shop');
      },
      'enter:shop'(g) { g.alert('shop'); },
      'kill:shop'(g) { g.think('В лавке не осталось ни одной целой банки. Переулок сбоку, там спуск в подвал.'); g.checkpoint(); },
      'enter:alley'(g) { g.setThought('Спуститься в подвал из переулка.'); },
      'enter:cel'(g) { g.alert('cel'); },
      'enter:hall'(g) {
        if (g.flags.hallSeen) return;
        g.flags.hallSeen = true;
        g.think('Трое сидят за столом и спорят о картах. Коктейль в эту компанию вписался бы как родной.');
      },
      'kill:hall'(g) { g.checkpoint(); },
      'hurt:h1'(g) { g.alert('hall'); },
      'hurt:h2'(g) { g.alert('hall'); },
      'hurt:h3'(g) { g.alert('hall'); },
      'dead:h1'(g) { g.alert('hall'); },
      'hurt:keyman'(g) { g.fireEvent('keyRun'); },
      keyRun(g) {
        if (g.flags.keyRun) return;
        g.flags.keyRun = true;
        g.charTo('keyman', [31, 0, 8], { run: true, then: 'combat' });
        g.say('Бандит', 'Я за подмогой! Держите его!', 2.5);
      },
      'pick:swkey'(g) { g.setThought('Ключ от лестницы. Дверь в конце коридора.'); },
      'open:sw0'(g) { g.checkpoint(); },
      'enter:sw1'(g) {
        if (g.flags.f1) return;
        g.flags.f1 = true;
        g.wake('f1', 'alert');
        g.later(2.5, 'wodenRing');
      },
      wodenRing(g) { g.ring('woden_phone'); },
      'phone:woden_phone'(g) {
        g.dialog([
          ['woden', 'Мистер Пейн. Не вешайте трубку, прошу вас.'],
          ['max', 'Кто это?'],
          ['woden', 'Меня зовут Альфред Воден. Вы меня не знаете. Я о вас знаю достаточно, чтобы позвонить именно сюда.'],
          ['woden', 'Полиция будет в этом доме через несколько минут. Бравура очень хочет с вами встретиться, и не для разговора.'],
          ['max', 'А вам с этого что?'],
          ['woden', 'Мы поговорим позже, когда вы будете готовы слушать. Будьте осторожны на верхних этажах.'],
          ['max:thought', 'Гудки. Воден. Имя, которое мне ничего не говорило.']
        ], 'chainStart');
      },
      chainStart(g) {
        g.later(1, 'chain1');
        g.setThought('Наверх. Дом начинает разваливаться.');
      },
      chain1(g) { g.explode([10, F1 + 2, 20], 5, 30, 'world'); g.addFire([10, F1, 18], 1.8, 1e9); g.later(1.5, 'chain2'); },
      chain2(g) { g.explode([30, F1 + 2, 10], 5, 30, 'world'); g.addFire([30, F1, 12], 1.8, 1e9); g.later(1.3, 'chain3'); },
      chain3(g) { g.explode([18, F1 + 2.5, 2], 4, 25, 'world'); g.think('Взрывы шли по дому цепочкой, этаж за этажом. Кто-то хорошо подготовился.'); },
      'enter:f2'(g) {
        if (g.flags.f2) return;
        g.flags.f2 = true;
        g.alert('f2');
        g.think('Лестница выше завалена. Придётся искать другой путь через квартиры.');
        g.setThought('Лестница завалена. В одной из квартир обрушился потолок.');
      },
      'enter:ramp'(g) { g.checkpoint(); },
      'enter:b3'(g) {
        if (g.flags.b3) return;
        g.flags.b3 = true;
        g.later(1.5, 'collapse1');
        g.think('Пол ходит под ногами. Задерживаться тут не стоит.');
      },
      collapse1(g) {
        g.show('fallen3', true);
        g.emit({ t: 'debris', pos: [23, F3 + 2.5, 19], size: [3, 1, 3], mat: 'stone' });
        g.emit({ t: 'debris', pos: [33, F3 + 2.5, 6], size: [3, 1, 3], mat: 'stone' });
        g.explode([33, F3 + 1, 6], 3.5, 25, 'world');
        g.alert('f3');
      },
      'enter:a3'(g) { g.alert('f3'); },
      'kill:f3'(g) {
        g.think('У холодильника кто-то роется, ничего не слыша. Кухонное окно выходит на пожарную лестницу.');
        g.setThought('Кухонное окно, пожарная лестница.');
      },
      'hurt:fridge'(g) { const c = g.char('fridge'); c.pose = null; c.stay = false; c.ai.mode = 'combat'; g.say('Бандит', 'Эй! Я просто хотел бутерброд!', 2.5); },
      'enter:escape'(g) { g.finish(); }
    }
  });
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
