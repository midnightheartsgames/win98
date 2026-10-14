(function (M) {
  'use strict';
  const LAMP = [1, 0.78, 0.5];
  const CB = -3, F1 = 3.4, F2 = 6.8, PT = 9, RF = 12.4, EL = 9.2;
  const thug = (id, group, x, y, z, yaw, weapon, o) => Object.assign({ id, type: 'thug', group, pos: [x, y, z], yaw, weapon, mode: 'ambush' }, o || {});
  const mob = (id, group, x, y, z, yaw, weapon, o) => Object.assign({ id, type: 'mobster', group, pos: [x, y, z], yaw, weapon, mode: 'ambush' }, o || {});
  const trainParts = [[-15.2, 0, -1.4, -0.2, 3.1, 1.4], [0.2, 0, -1.4, 15.2, 3.1, 1.4], [15.6, 0, -1.4, 30.6, 3.1, 1.4]];

  function holed(B, rect, holes, y0, y1, mat) {
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
    for (const r of rects) B.box(r[0], y0, r[1], r[2], y1, r[3], mat);
  }

  M.defineLevel({
    id: 'wings',
    title: 'Страх, что даёт людям крылья',
    titleEn: 'Fear That Gives Men Wings',
    part: 1,
    chapter: 6,
    world: { ambient: [0.06, 0.055, 0.05], fog: { color: [0.05, 0.055, 0.065], near: 20, far: 90 }, weather: 'blizzard', sky: 'night', moon: { dir: M.norm([0.3, -0.8, 0.4]), color: [0.09, 0.1, 0.13] } },
    start: { pos: [30, 0, -12], yaw: Math.PI / 2 },
    loadout: { weapons: ['beretta', 'beretta2', 'deagle', 'pump', 'bat', 'ingram', 'grenade'], ammo: { '9mm': 120, '50ae': 14, '12g': 16, gren: 2 }, painkillers: 3 },
    music: 'tension',
    intro: 'wings_in',
    outro: 'wings_out',
    killY: -8,
    thought: 'Винни Гоньитти. Правая рука Лупино где-то в этом квартале.',
    build(B) {
      holed(B, [-80, -40, 70, 0], [[6, -5, 10, 0]], -1, 0, 'asphalt_snow');
      B.box(-80, 0, -3, 6, 0.15, 0, 'sidewalk'); B.box(10, 0, -3, 70, 0.15, 0, 'sidewalk');
      B.box(-80, -21, 0, 70, -20, 40, 'dirt');
      B.zone(-80, -21, -40, 70, 40, 40, { outdoor: true, amb: [0.09, 0.1, 0.13] });
      B.zone(0, -4, 0, 20, 12.3, 20, { outdoor: false });
      B.zone(20, -1, 0, 40, 9.9, 20, { outdoor: false });
      B.zone(-24, 8, 0, -4, 12.3, 20, { outdoor: false });
      B.zone(6, -4, -1, 10, -0.1, 0, { outdoor: false });
      B.box(-80, 0, -44, 70, 16, -40, { side: 'facade_brick', top: 'roof_tar' });
      B.box(40, 0, 0, 70, 14, 20, { side: 'facade_grey', top: 'roof_tar' });
      B.box(-24, -20, 0, -4, PT - 0.25, 20, { side: 'facade_brown', top: 'roof_tar' });
      B.box(0, -20, 0, 20, CB - 0.25, 20, 'dirt');
      B.box(20, -20, 0, 40, -0.25, 20, 'dirt');
      B.box(-44, -20, 0, -28, RF, 20, { side: 'facade_dark', top: 'roof_tar' });
      B.box(-64, -20, 0, -48, RF, 20, { side: 'facade_brick', top: 'roof_tar' });
      B.box(-80, -20, 0, -68, 16, 20, { side: 'facade_grey', top: 'roof_tar' });
      B.box(-120, EL - 0.6, 22, 70, EL, 26, { top: 'rail', side: 'metal', bottom: 'metal' });
      for (let x = -110; x < 70; x += 12) { B.box(x - 0.3, -20, 21.6, x + 0.3, EL - 0.6, 22.2, 'rust'); B.box(x - 0.3, -20, 25.8, x + 0.3, EL - 0.6, 26.4, 'rust'); }
      B.box(-28, RF, 9.4, -24, RF + 0.1, 10.6, 'plank');
      B.box(-48, RF, 5.4, -44, RF + 0.1, 6.6, 'plank');
      B.box(-4, RF - 0.35, 9.8, 0, RF - 0.05, 10.3, 'rust');
      B.box(-4, RF - 0.35, 10.5, 0, RF - 0.05, 11, 'rust');
      B.box(-4, RF - 0.45, 9.7, 0, RF - 0.35, 11.1, 'metal');
      B.stairs(6.2, -5, 9.8, -1.1, CB, 0, 'n', 'concrete');
      B.box(5.9, CB, -5, 6, 1, 0, 'metal'); B.box(10, CB, -5, 10.1, 1, 0, 'metal');
      B.plan({
        y: 0, h: 3.15, outer: 'brick_dark',
        rooms: [
          { id: 'sunk', x0: 6, z0: -1.1, x1: 10, z1: 0, y: CB, h: 2.9, floor: 'concrete', wall: 'brick_dark', noCeil: true, noWalls: ['n'] },
          { id: 'club', x0: 0, z0: 0, x1: 20, z1: 14, y: CB, floor: 'club_floor', wall: 'club_red', ceil: 'ceiling_dark' },
          { id: 'shaft', x0: 8, z0: 14, x1: 12, z1: 18, y: CB, h: 15.15, floor: 'metal_plate', wall: 'metal_plate', ceil: 'ceiling_dark' },
          { id: 'pent', x0: 0, z0: 0, x1: 20, z1: 14, y: PT, floor: 'parquet', wall: 'wallpaper_red', ceil: 'ceiling_panel', roof: 'roof_tar', ceilHoles: [[14, 4, 18, 10]] },
          { id: 'pbed', x0: 0, z0: 14, x1: 8, z1: 20, y: PT, floor: 'carpet_red', wall: 'wallpaper_red', ceil: 'plaster', roof: 'roof_tar' },
          { id: 'pnook', x0: 8, z0: 18, x1: 12, z1: 20, y: PT, floor: 'concrete', wall: 'plaster', ceil: 'plaster', roof: 'roof_tar' },
          { id: 'pbath', x0: 12, z0: 14, x1: 20, z1: 20, y: PT, floor: 'bath_tile', wall: 'bath_tile', ceil: 'plaster', roof: 'roof_tar' },
          { id: 'lob2', x0: 20, z0: 0, x1: 32, z1: 8, y: 0, floor: 'tile_floor', wall: 'plaster_green', ceil: 'ceiling_panel' },
          { id: 'sw2', x0: 32, z0: 0, x1: 36, z1: 12, y: 0, h: 9.95, floor: 'concrete', wall: 'plaster_dirty', ceil: 'ceiling_dark' },
          { id: 'c21', x0: 20, z0: 0, x1: 32, z1: 4, y: F1, floor: 'linoleum', wall: 'plaster_green', ceil: 'ceiling_panel' },
          { id: 'c22', x0: 20, z0: 0, x1: 32, z1: 4, y: F2, floor: 'linoleum', wall: 'plaster_green', ceil: 'ceiling_panel' },
          { id: 'ap22', x0: 20, z0: 4, x1: 32, z1: 16, y: F2, floor: 'wood_floor', wall: 'wallpaper_home', ceil: 'plaster' },
          { id: 'b3st', x0: -8, z0: 12, x1: -4, z1: 20, y: PT, h: 5.6, floor: 'concrete', wall: 'plaster_dirty', ceil: 'ceiling_dark', roof: 'roof_tar' },
          { id: 'b3c', x0: -24, z0: 8, x1: -4, z1: 12, y: PT, floor: 'linoleum', wall: 'plaster_dirty', ceil: 'ceiling_panel', roof: 'roof_tar' },
          { id: 'exr', x0: -14, z0: 0, x1: -4, z1: 8, y: PT, floor: 'concrete', wall: 'plaster_dirty', ceil: 'ceiling_dark', roof: 'roof_tar' },
          { id: 'b3w', x0: -24, z0: 0, x1: -14, z1: 8, y: PT, floor: 'wood_floor', wall: 'wallpaper_green', ceil: 'plaster', roof: 'roof_tar' },
          { id: 'office', x0: -24, z0: 12, x1: -8, z1: 20, y: PT, floor: 'carpet_red', wall: 'wood_panel', ceil: 'ceiling_panel', roof: 'roof_tar', ceilHoles: [[-24, 13.3, -20, 20]] }
        ],
        doors: [
          { x: 8, z: 0, w: 1.2, y: CB, door: { id: 'pwdoor', mat: 'door_red', locked: true, keyFlag: 'clubkey', noPush: false, lockMsg: 'Дверь заперта. Вышибала хочет услышать пароль.' } },
          { x: 10, z: 14, w: 2.2, y: CB, h: 2.4, door: { id: 'lift_low', mat: 'metal_plate', slide: true, noPush: true, open: 1, target: 1 } },
          { x: 10, z: 14, w: 2.2, y: PT, h: 2.4, door: { id: 'lift_up', mat: 'metal_plate', slide: true, noPush: true } },
          { x: 15, z: 14, w: 1.0, y: PT, door: { id: 'bath_door', mat: 'door_wood', locked: true, noPush: true, lockMsg: 'Заперто. За дверью кто-то поёт.' } },
          { x: 5, z: 14, w: 1.0, y: PT, door: { id: 'pbed_door', mat: 'door_wood', swing: 1 } },
          { x: 26, z: 0, w: 1.6, y: 0, door: { id: 'b2_front', mat: 'door_wood', double: true, open: 1, target: 1, swing: 1 } },
          { x: 32, z: 1, w: 1.2, y: 0 },
          { x: 32, z: 1, w: 1.2, y: F1, door: { id: 'sw2_1', mat: 'door_metal', swing: -1 } },
          { x: 32, z: 1, w: 1.2, y: F2, door: { id: 'sw2_2', mat: 'door_metal', swing: -1 } },
          { x: 26, z: 4, w: 1.1, y: F2, door: { id: 'ap_door', mat: 'door_wood', swing: 1 } },
          { x: -5, z: 12, w: 1.1, y: PT, door: { id: 'b3st_door', mat: 'door_metal', swing: -1 } },
          { x: -7, z: 12, w: 1.2, y: RF, h: 2.3, door: { id: 'b3roof_door', mat: 'door_metal', swing: 1 } },
          { x: -9, z: 8, w: 1.1, y: PT, door: { id: 'exr_door', mat: 'door_metal', swing: -1 } },
          { x: -19, z: 8, w: 1.1, y: PT, door: { id: 'b3w_door', mat: 'door_wood', swing: -1 } },
          { x: -16, z: 12, w: 1.1, y: PT, door: { id: 'office_door', mat: 'door_wood', locked: true, noPush: true, lockMsg: 'За дверью голоса. Заперто.' } }
        ],
        windows: [
          { x: 6, z: 0, w: 2, y: PT, y0: 0.9, y1: 2.3 },
          { x: -14, z: 0, w: 2, y: PT, y0: 0.9, y1: 2.3 }
        ]
      });
      B.group('jamwall', () => B.box(-14.25, PT, 8.1, -13.75, PT + 3.15, 11.9, { side: 'plaster_dirty', top: 'trim' }));
      B.group('jamrubble', () => { B.decor('rubble', -15.5, PT, 10, 0.4, { solid: false }); B.decor('rubble', -13, PT, 9.2, 1.2, { solid: false }); }, true);
      B.stairs(14.2, 4.2, 17.8, 9.8, PT, RF, 's', 'wood_floor');
      B.box(0, 0.4, 0, 8, PT - 0.25, 20, { side: 'facade_brick', top: 'trim' }); B.box(12, 0.4, 0, 20, PT - 0.25, 20, { side: 'facade_brick', top: 'trim' }); B.box(8, 0.4, 0, 12, PT - 0.25, 14, { side: 'facade_brick', top: 'trim' }); B.box(8, 0.4, 18, 12, PT - 0.25, 20, { side: 'facade_brick', top: 'trim' });
      B.box(20, 0, 8, 32, F1 - 0.25, 20, { side: 'facade_grey', top: 'trim' }); B.box(20, F1, 4, 32, F2 - 0.25, 20, { side: 'facade_grey', top: 'trim' }); B.box(20, F2, 16, 32, F2 + 3.4, 20, { side: 'facade_grey', top: 'roof_tar' });
      B.box(32, 0, 12, 40, F2 + 3.4, 20, { side: 'facade_grey', top: 'roof_tar' }); B.box(36, 0, 0, 40, F2 + 3.4, 12, { side: 'facade_grey', top: 'roof_tar' });
      B.box(-14.26, PT + 0.02, 9.45, -14.24, PT + 2.2, 10.55, 'door_wood');
      B.stairs(-7.8, 12.2, -6, 17.2, PT, RF, 'n', 'concrete', { open: true });
      B.box(-6, PT + 0.2, 12.3, -5.94, PT + 3.2, 17, 'metal');
      B.stairs(-23.9, 13.4, -20, 19.6, PT, RF, 's', 'wood_floor');
      for (let k = 0; k < 2; k++) {
        const y = k * F1;
        B.stairs(32.05, 2, 33.95, 10, y, y + 1.7, 's', 'concrete', { open: true });
        B.box(32, y + 1.7 - 0.14, 10, 36, y + 1.7, 12, { top: 'concrete', side: 'trim', bottom: 'ceiling_dark' });
        B.stairs(34.05, 2, 35.95, 10, y + 1.7, y + 3.4, 'n', 'concrete', { open: true });
        B.box(32, y + 3.4 - 0.14, 0, 36, y + 3.4, 2, { top: 'concrete', side: 'trim', bottom: 'ceiling_dark' });
      }
      for (const [x0, z0, x1, z1] of [[0, 0, 20, 20], [-24, 0, -4, 20]]) {
        B.box(x0, RF, z0 - 0.2, x1, RF + 1, z0, 'brick_dark');
        B.box(x0, RF, z1, x1, RF + 1, z1 + 0.2, 'brick_dark');
      }
      B.box(20, RF, 0, 20.2, RF + 1, 20, 'brick_dark');
      B.box(-24.2, RF, 0, -24, RF + 1, 9.2, 'brick_dark'); B.box(-24.2, RF, 10.8, -24, RF + 1, 20, 'brick_dark');
      B.box(-4, RF, 0, -3.8, RF + 1, 9.6, 'brick_dark'); B.box(-4, RF, 11.2, -3.8, RF + 1, 20, 'brick_dark');
      B.box(-0.2, RF, 0, 0, RF + 1, 9.6, 'brick_dark'); B.box(-0.2, RF, 11.2, 0, RF + 1, 20, 'brick_dark');
      B.box(8, RF, 14, 12, RF + 0.3, 18, 'metal_plate');
      B.decor('hydrant', 14, 0, -1.8, 0); B.decor('streetlight', 4, 0, -2.6, 0); B.decor('streetlight', 30, 0, -2.6, 0); B.decor('streetlight', -30, 0, -2.6, 0);
      B.light(4, 4.5, -3.5, [1, 0.72, 0.45], 14); B.light(30, 4.5, -3.5, [1, 0.72, 0.45], 14); B.light(-30, 4.5, -3.5, [1, 0.72, 0.45], 14);
      B.light(8, -0.4, -1.2, [1, 0.3, 0.3], 5, { i: 1.2 });
      B.decal(8, CB + 2.5, -0.12, 'nz', 1.6, 0.4, 'neon:КЛУБ', { emissive: true });
      B.decor('car', 20, 0, -7, Math.PI / 2, { color: '#3a2a1a' }); B.decor('car', -20, 0, -8, -Math.PI / 2, { color: '#1a2a3a' });
      B.decor('bar', 10, CB, 12.6, Math.PI); B.decor('table', 5, CB, 5, 0); B.decor('table', 14, CB, 5, 0); B.decor('tableside', 9.5, CB, 8.3, Math.PI);
      B.decor('speaker', 1, CB, 1, 0.4); B.decor('speaker', 19, CB, 1, -0.4); B.decor('piano', 3, CB, 12.5, Math.PI / 2);
      B.light(5, CB + 2.9, 5, [1, 0.3, 0.4], 8); B.light(14, CB + 2.9, 5, [0.5, 0.4, 1], 8); B.light(10, CB + 2.9, 11, [1, 0.7, 0.4], 7);
      B.light(10, CB + 2.6, 16, [1, 1, 0.9], 4, { i: 0.6 }); B.light(10, PT + 2.6, 16, [1, 1, 0.9], 4, { i: 0.6 });
      B.decor('sofa', 6, PT, 6, Math.PI / 2, { mat: 'fabric_red' }); B.decor('table', 8.5, PT, 6, 0); B.decor('tvstand', 3, PT, 11, Math.PI / 2);
      B.decor('shelf', 12, PT, 2.4, 0, { scale: 0.7 }); B.decor('bed', 5, PT, 17.5, Math.PI / 2); B.decor('bathtub', 17.4, PT, 17, 0); B.decor('toilet', 13, PT, 19.5, Math.PI);
      B.light(8, PT + 2.9, 7, LAMP, 9); B.light(5, PT + 2.9, 17, [1, 0.5, 0.6], 6); B.light(15, PT + 2.9, 17, [0.9, 1, 1], 6);
      B.decor('counter', 26, 0, 7.4, Math.PI); B.light(26, 2.9, 4, [0.9, 1, 0.9], 8);
      for (const y of [0, F1, F2]) B.light(34, y + 2.8, 6, [0.9, 0.9, 0.8], 6, { i: 0.8 });
      B.light(26, F1 + 2.9, 2, LAMP, 7); B.light(26, F2 + 2.9, 2, LAMP, 7);
      B.decor('bed', 22.6, F2, 12, Math.PI / 2); B.decor('armchair', 29, F2, 9, 2.2); B.decor('tvstand', 31.4, F2, 13, -Math.PI / 2);
      B.light(26, F2 + 2.9, 10, LAMP, 8);
      B.light(-6, PT + 3, 16, [0.9, 0.9, 0.8], 6);
      for (let x = -20; x < -4; x += 7) B.light(x, PT + 2.9, 10, [0.9, 0.9, 0.75], 6, { i: 0.8 });
      B.decor('pallet', -8, PT, 3, 0.2); B.decor('shelf', -13.5, PT, 4, Math.PI / 2, { scale: 0.8 });
      B.light(-9, PT + 2.8, 4, [1, 0.6, 0.35], 6);
      B.decor('bed', -20, PT, 4, 0); B.decor('armchair', -16, PT, 2, 0.4); B.light(-19, PT + 2.8, 4, LAMP, 6);
      B.decor('desk', -14, PT, 18.6, Math.PI); B.decor('armchair', -14, PT, 17.3, 0); B.decor('safe', -9, PT, 19.3, Math.PI); B.decor('sofa', -12, PT, 13, 0, { mat: 'fabric_brown' });
      B.light(-14, PT + 2.9, 16, [1, 0.8, 0.5], 9);
      B.light(-40, RF + 4, 10, [0.6, 0.65, 0.8], 16, { i: 0.5 });
      B.light(-56, RF + 4, 10, [0.6, 0.65, 0.8], 16, { i: 0.5 });
      B.light(10, RF + 4, 10, [0.6, 0.65, 0.8], 16, { i: 0.5 });
      for (let x = -100; x < 60; x += 24) B.light(x, EL + 4.5, 24, [1, 0.8, 0.55], 12, { i: 0.8 });
      B.decal(-4.12, PT + 1.5, 4, 'nx', 1.3, 0.5, 'signr:НЕ КУРИТЬ');
      B.decal(-23.88, PT + 1.5, 16, 'px', 1, 0.8, 'painting');
      B.decal(19.88, CB + 1.6, 8, 'nx', 1.1, 1.55, 'poster_valkyr');
    },
    props: [
      { kind: 'mover', id: 'lift', model: 'elevator', parts: [[-1.9, -0.25, -1.9, 1.9, 0, 1.9]], origin: [10, CB, 16], path: [[10, CB, 16], [10, PT, 16]], maxSpeed: 2, accel: 1.2, crush: false },
      { kind: 'mover', id: 'train1', model: 'eltrain', parts: trainParts, origin: [60, EL, 24], path: [[60, EL, 24], [-150, EL, 24]], maxSpeed: 9, accel: 4, noBrake: true },
      { kind: 'mover', id: 'train2', model: 'eltrain', parts: trainParts, origin: [80, EL, 24], path: [[80, EL, 24], [-120, EL, 24]], maxSpeed: 7, accel: 3, loop: true },
      { kind: 'cyl', id: 'cylx1', pos: [-5, PT, 6.8] },
      { kind: 'cyl', id: 'cylx2', pos: [-5.6, PT, 7.3] },
      { kind: 'crate', id: 'cr_ex', pos: [-11, PT, 1.2], size: [0.9, 0.9, 0.9] },
      { kind: 'crate', id: 'cr_club', pos: [15.8, CB, 7.2], size: [1.0, 1.0, 0.9], hp: 90 },
      { kind: 'button', id: 'jamdoor', pos: [-13.7, PT + 1.05, 10.3], yaw: -Math.PI / 2, label: 'Дёрнуть ручку', once: true }
    ],
    items: [
      { kind: 'weapon', weapon: 'ingram', amount: 32, pos: [12, PT + 1.1, 2.4] },
      { kind: 'painkillers', amount: 1, pos: [8.5, PT + 0.8, 6] },
      { kind: 'ammo', ammo: '9mm', amount: 36, pos: [26, 0.95, 7.4] },
      { kind: 'painkillers', amount: 1, pos: [29, F2, 12] },
      { kind: 'ammo', ammo: '12g', amount: 8, pos: [14, CB + 0.78, 5] },
      { kind: 'painkillers', amount: 2, pos: [10, CB + 1.12, 12.6] },
      { kind: 'painkillers', amount: 1, pos: [-11, PT + 0.02, 1.2], in: 'cr_ex' },
      { kind: 'weapon', weapon: 'grenade', amount: 2, pos: [-13.5, PT + 0.58, 4] },
      { kind: 'ammo', ammo: '50ae', amount: 7, pos: [-14, PT + 0.8, 18.6] }
    ],
    chars: [
      { id: 'doorman', type: 'doorman', pos: [8.9, CB, -0.5], yaw: Math.PI, weapon: 'deagle', mode: 'prop', usable: 'Поговорить', speaker: 'doorman', drop: { kind: 'key', flag: 'clubkey', name: 'Ключ от клуба' } },
      thug('st1', 'stair2', 34, 1.2, 6, 0, 'beretta'),
      mob('st2', 'stair2', 35, F1, 1, -Math.PI / 2, 'beretta'),
      thug('st3', 'stair2', 33, F1 + 1.7, 11, Math.PI, 'pump'),
      { id: 'beg', type: 'thug', group: 'beg', pos: [24, F2, 11], yaw: 0, weapon: null, mode: 'surrender', usable: 'Пусть проводит', speaker: 'guide', noDrop: true, hp: 60 },
      thug('am1', 'amb', 4, CB, 9, Math.PI, 'beretta', { hidden: true }),
      mob('am2', 'amb', 14, CB, 10, Math.PI, 'ingram', { hidden: true }),
      thug('am3', 'amb', 17, CB, 4, -Math.PI / 2, 'pump', { hidden: true }),
      mob('am4', 'amb', 3, CB, 3, Math.PI / 2, 'beretta', { hidden: true }),
      thug('am5', 'amb', 10, CB, 12, Math.PI, 'sawed', { hidden: true }),
      thug('singer', 'singer', 15, PT, 17, Math.PI, 'beretta', { mode: 'hold', blind: true, holdFire: true, deaf: true, pose: 'sing', stay: true }),
      mob('bf1', 'b3a', -12, PT, 10, -Math.PI / 2, 'beretta'),
      thug('bf2', 'b3a', -9, PT, 11, -Math.PI / 2, 'ingram'),
      thug('ex1', 'ex', -8, PT, 5, Math.PI / 2, 'beretta', { mode: 'hold', blind: true, holdFire: true, deaf: true, stay: true }),
      thug('ex2', 'ex', -6.5, PT, 6.2, Math.PI, 'beretta', { mode: 'hold', blind: true, holdFire: true, deaf: true, stay: true }),
      mob('cc1', 'cc', -19, PT, 10.5, -Math.PI / 2, 'ingram', { hidden: true }),
      thug('cc2', 'cc', -21, PT, 5, -Math.PI / 2, 'pump', { hidden: true }),
      mob('cc3', 'cc', -22.5, PT, 9, -Math.PI / 2, 'beretta', { hidden: true, gren: 1 }),
      mob('og1', 'office', -12, PT, 15, 0, 'beretta', { hidden: true }),
      thug('og2', 'office', -18, PT, 14, 0, 'ingram', { hidden: true }),
      { id: 'vinnie', type: 'vinnie', group: 'vinnie', pos: [-14, PT, 17.3], yaw: 0, weapon: 'beretta2', mode: 'prop', hidden: true, hpFloor: 250, noDrop: true, speaker: 'vinnie', static: true }
    ],
    triggers: [
      { id: 'sunk', min: [6, CB, -3], max: [10, 1, 0] },
      { id: 'b2', min: [22, 0, 0], max: [30, 2.5, 4] },
      { id: 'ap', min: [21, F2, 5], max: [31, F2 + 2.4, 15] },
      { id: 'liftIn', min: [8.3, CB - 0.1, 14.3], max: [11.7, CB + 2, 17.7] },
      { id: 'pent', min: [3, PT, 3], max: [12, PT + 2.4, 12] },
      { id: 'roof1', min: [0, RF, 0], max: [20, RF + 2.5, 20] },
      { id: 'b3roof', min: [-24, RF, 0], max: [-8, RF + 2.5, 20] },
      { id: 'b3c', min: [-8, PT, 8], max: [-4, PT + 2.4, 12] },
      { id: 'jamArea', min: [-14, PT, 8], max: [-10, PT + 2.4, 12] },
      { id: 'officeFront', min: [-18, PT, 8], max: [-14, PT + 2.4, 12], off: true },
      { id: 'b5edge', min: [-64, RF, 14], max: [-48, RF + 2.5, 20] }
    ],
    on: {
      start(g) {
        g.dialog([
          ['max:thought', 'Письмо в отеле, список в доходном доме. Все дороги вели к Винни Гоньитти.'],
          ['max:thought', 'В подвальном клубе этого квартала его люди пьют, пока Винни прячется. Спустимся.']
        ]);
        g.setThought('Подвальный клуб. Спуск с улицы.');
      },
      'talk:doorman'(g) {
        if (g.flags['has:pwd']) { g.fireEvent('pwdOpen'); return; }
        if (g.flags.dmTalk) { g.say('doorman', 'Я сказал: пароль. Или проваливай.', 2.5); return; }
        g.flags.dmTalk = true;
        g.dialog([
          ['doorman', 'Пароль.'],
          ['max', 'Метель.'],
          ['doorman', 'Неправильно. Проваливай, пока я добрый.'],
          ['max:thought', 'Пароля я не знал. Зато знал, что в соседнем доме сидят люди Винни. Кто-нибудь из них подскажет.']
        ]);
        g.setThought('Узнать пароль у людей Винни в соседнем доме.');
      },
      'hurt:doorman'(g) { const c = g.char('doorman'); c.ai.mode = 'combat'; c.usable = null; },
      'enter:b2'(g) { g.alert('stair2'); },
      'enter:ap'(g) {
        if (g.flags.begSeen) return;
        g.flags.begSeen = true;
        g.dialog([
          ['guide', 'Не стреляй! Не стреляй, я безоружный!'],
          ['guide', 'Я знаю пароль в клуб. Я проведу, клянусь мамой. Только не стреляй.']
        ]);
      },
      'talk:beg'(g) {
        const c = g.char('beg');
        if (g.flags.begGo) return;
        g.flags.begGo = true;
        c.usable = null;
        c.anim.hands = false;
        g.dialog([['max', 'Веди. Одно лишнее движение, и мама тебя не узнает.'], ['guide', 'Понял, понял. Иду.']], 'begWalk');
      },
      begWalk(g) {
        g.charTo('beg', [7.2, CB, -0.75], { run: true, then: 'prop', face: 0 });
        g.setThought('Идти за проводником к клубу.');
      },
      'arrive:beg'(g) {
        g.dialog([
          ['guide', 'Это я, Сэмми. Пароль: «Валгалла ждёт».'],
          ['doorman', 'Заходи.']
        ], 'begBetray');
      },
      begBetray(g) {
        g.unlock('pwdoor');
        g.openDoor('pwdoor', 1);
        g.say('guide', 'Засада! Это Пейн! Пейн здесь!', 3);
        g.charTo('beg', [9, CB, 6], { run: true, then: 'cower' });
        g.later(0.6, 'ambush');
      },
      ambush(g) {
        g.wake('amb', 'alert');
        const d = g.char('doorman');
        if (d && d.state === 'alive') { d.ai.mode = 'combat'; d.usable = null; M.AI.alertChar(g, d, g.player.pos, 0.3); }
        g.think('Мама Сэмми сегодня будет плакать.');
        g.music('tension');
      },
      'dead:beg'(g) {
        if (g.flags.begGo) return;
        const c = g.char('beg');
        g.addItem({ id: 'pwdnote', kind: 'flag', flag: 'pwd', name: 'Спичечный коробок: «Валгалла ждёт»', pos: [c.pos[0], c.pos[1] + 0.05, c.pos[2] + 0.4] });
      },
      'pick:pwdnote'(g) { g.think('На коробке спичек из клуба нацарапано: «Валгалла ждёт». Пароль.'); g.setThought('Пароль есть. К вышибале.'); },
      pwdOpen(g) {
        const d = g.char('doorman');
        g.dialog([['max', 'Валгалла ждёт.'], ['doorman', 'Проходи.']], 'pwdAmbush');
      },
      pwdAmbush(g) { g.unlock('pwdoor'); g.openDoor('pwdoor', 1); g.later(1.5, 'ambush'); },
      'kill:amb'(g) { g.think('Лифт в глубине клуба. Где-то наверху у Винни квартира.'); g.setThought('Лифт в клубе. Наверх.'); g.checkpoint(); },
      'enter:liftIn'(g) {
        if (g.flags.liftUp) return;
        g.flags.liftUp = true;
        g.closeDoor('lift_low');
        g.later(1.2, 'liftGo');
      },
      liftGo(g) { g.moverGo('lift'); },
      'mover:lift'(g) { g.openDoor('lift_up', 1); },
      'enter:pent'(g) {
        if (g.flags.pent) return;
        g.flags.pent = true;
        g.dialog([
          ['Бандит', '♪ Нью-Йорк, Нью-Йорк, город, который не спит... ♪'],
          ['max:thought', 'В ванной кто-то пел, и пел плохо. На шкафу лежал ингрэм. Хозяин за ним не вернётся.']
        ], 'singerOut');
      },
      singerOut(g) {
        g.later(3, 'singerDoor');
      },
      singerDoor(g) {
        g.unlock('bath_door');
        g.openDoor('bath_door', -1);
        const c = g.char('singer');
        c.pose = null; c.stay = false; c.blind = false; c.holdFire = false; c.ai.deaf = false; c.ai.mode = 'combat';
        M.AI.alertChar(g, c, g.player.pos, 0.6);
        g.say('Бандит', 'Какого... Кто тебя впустил?!', 2.4);
      },
      'hurt:singer'(g) { g.fireEvent('singerDoor'); },
      'enter:roof1'(g) {
        if (g.flags.roof1) return;
        g.flags.roof1 = true;
        g.think('Крыша. Через переулок по трубам можно перейти на соседнее здание. Там Винни.');
        g.setThought('Перейти по трубам на крышу соседнего здания.');
        g.checkpoint();
      },
      'enter:b3roof'(g) { g.setThought('Спуститься в здание, где прячется Винни.'); },
      'enter:b3c'(g) {
        if (g.flags.b3c) return;
        g.flags.b3c = true;
        g.alert('b3a');
        g.later(3, 'exBoom');
      },
      exBoom(g) {
        if (g.flags.exBoom) return;
        g.flags.exBoom = true;
        g.dialog([['Бандит', 'Осторожно с этим, Томми, у неё провод...'], ['Бандит', 'Да знаю я, что провод...']], 'exBlow');
      },
      exBlow(g) {
        const e1 = g.char('ex1'), e2 = g.char('ex2');
        g.explode([-7, PT + 0.8, 5.6], 4.5, 400, 'world');
        for (const c of [e1, e2]) if (c && c.state === 'alive') g.killChar(c, [0, 1, 0], 'body', 'explosion', 'world');
        g.think('Они возились со взрывчаткой. Долго возились.');
      },
      'enter:jamArea'(g) { if (!g.flags.jam) g.think('Коридор перекрыт перегородкой с дверью. Ручка болтается.'); },
      'use:jamdoor'(g) {
        if (g.flags.jam) return;
        g.flags.jam = true;
        g.prop('jamdoor').hidden = true;
        g.show('jamwall', false);
        g.show('jamrubble', true);
        g.emit({ t: 'debris', pos: [-14, PT + 1.5, 10], size: [0.5, 3, 4], mat: 'stone' });
        g.emit({ t: 'sfx', id: 'thud', pos: [-14, PT, 10] });
        g.think('Я взялся за ручку, и вся стена сложилась мне под ноги.');
        g.wake('cc', 'alert');
        g.enableTrigger('officeFront', true);
      },
      'enter:officeFront'(g) {
        if (g.flags.office) return;
        g.flags.office = true;
        g.dialog([
          ['vinnie', 'Он здесь? Как он здесь?! Вы же сказали, клуб его задержит!'],
          ['Бандит', 'Винни, мы думали...'],
          ['vinnie', 'Думать буду я! Стреляйте в него!']
        ], 'officeOpen');
      },
      officeOpen(g) {
        g.unlock('office_door');
        g.openDoor('office_door', 1);
        g.wake('office', 'alert');
        const v = g.char('vinnie');
        v.state = 'alive'; v.static = false; v.ai.mode = 'hold'; v.stay = true;
        M.AI.alertChar(g, v, g.player.pos, 0.3);
        v.ai.mode = 'hold';
        g.music('tension');
      },
      'floor:vinnie'(g) {
        if (g.flags.vinnieRun) return;
        g.flags.vinnieRun = true;
        const v = g.char('vinnie');
        v.invuln = true;
        v.stay = false;
        v.route = [
          { p: [-22, PT, 13], go: true },
          { p: [-22, RF, 19.5], go: true, speed: 1.1 },
          { p: [-20, RF, 10.2], go: true },
          { p: [-26, RF + 0.1, 10], go: true },
          { p: [-36, RF, 10], ev: 'vinnieB4', near: 14 },
          { p: [-42, RF, 6], go: true },
          { p: [-46, RF + 0.1, 6], go: true },
          { p: [-52, RF, 8], near: 14 },
          { p: [-56, RF, 19.2], ev: 'vinnieEdge' }
        ];
        v.ai.mode = 'flee';
        v.ai.route = 0;
        v.fleeNear = 16;
        g.dialog([
          ['vinnie', 'Он в меня попал! Он попал в меня! Держите его, я вам плачу!'],
          ['max:thought', 'Винни бежал, как бегают только очень толстые и очень напуганные люди. Страх даёт людям крылья.']
        ]);
        g.setThought('Догнать Винни. Он бежит по крышам.');
      },
      'shot:vinnie'(g) { if (g.real - (g.flags.vShotT || -9) > 5) { g.flags.vShotT = g.real; g.think('Темно, метель, и он всё время за чем-то прячется. Не попасть.'); } },
      vinnieB4(g) { g.checkpoint(); },
      vinnieEdge(g) {
        const v = g.char('vinnie');
        v.ai.mode = 'prop';
        v.static = true;
        g.say('vinnie', 'Не догонишь, коп! Никогда!', 2.4);
        g.moverGo('train1');
        g.later(0.2, 'vinnieWait');
      },
      vinnieWait(g) {
        const t = g.prop('train1');
        const v = g.char('vinnie');
        if (t.origin[0] < -56 + 12 && t.origin[0] > -56 - 25 && !g.flags.vinnieJumped) {
          g.flags.vinnieJumped = true;
          v.pos = [-56, EL + 3.1 + 0.01, 24];
          v.static = false;
          const gr = g.world.groundAt(v.pos[0], v.pos[2], v.pos[1] + 0.2, 0.2);
          v.onGround = true; v.groundObj = gr.obj;
          g.emit({ t: 'sfx', id: 'thud', pos: v.pos.slice() });
          g.dialog([['max:thought', 'Он прыгнул. Прямо на крышу поезда.'], ['max:thought', 'Следующий поезд идёт следом. Прыгать надо с разбега, когда крыша вагона будет под краем.']]);
          g.moverGo('train2');
          g.setThought('Запрыгнуть на крышу следующего поезда.');
          g.checkpoint();
          g.later(0.2, 'jumpWatch');
          g.later(8, 'hideVinnie');
          return;
        }
        g.later(0.1, 'vinnieWait');
      },
      hideVinnie(g) { const v = g.char('vinnie'); v.state = 'hidden'; },
      jumpWatch(g) {
        const p = g.player;
        if (p.onGround && p.groundObj && p.groundObj.prop === 'train2') { g.finish(); return; }
        g.later(0.1, 'jumpWatch');
      },
      'enter:b5edge'(g) { if (g.flags.vinnieJumped) g.hint('Прыжок: пробел. Разбегитесь и прыгайте, когда крыша вагона окажется под краем крыши.', 6); }
    }
  });
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
