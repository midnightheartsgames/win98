(function (M) {
  'use strict';
  const LAMP = [1, 0.78, 0.5];
  const EL = 9.2, TF = 9.2, R3 = 12.6, LF = 6.0;
  const thug = (id, group, x, y, z, yaw, weapon, o) => Object.assign({ id, type: 'thug', group, pos: [x, y, z], yaw, weapon, mode: 'ambush' }, o || {});
  const mob = (id, group, x, y, z, yaw, weapon, o) => Object.assign({ id, type: 'mobster', group, pos: [x, y, z], yaw, weapon, mode: 'ambush' }, o || {});
  const cop = (id, x, z, yaw) => ({ id, type: 'cop', group: 'cops', pos: [x, 0, z], yaw, weapon: 'beretta', mode: 'cop', invuln: true, friendly: true, faceYaw: yaw, noDrop: true, sight: 60, accMul: 0.55 });
  const trainParts = [[-15.2, 0, -1.4, -0.2, 3.1, 1.4], [0.2, 0, -1.4, 15.2, 3.1, 1.4]];

  M.defineLevel({
    id: 'brutality',
    title: 'Жестокость полиции',
    titleEn: 'Police Brutality',
    part: 1,
    chapter: 7,
    world: { ambient: [0.06, 0.055, 0.05], fog: { color: [0.05, 0.055, 0.065], near: 22, far: 95 }, weather: 'blizzard', sky: 'night', moon: { dir: M.norm([0.3, -0.8, 0.45]), color: [0.09, 0.1, 0.13] } },
    start: { pos: [6, EL, 4], yaw: -Math.PI / 2 },
    loadout: { weapons: ['beretta', 'beretta2', 'deagle', 'pump', 'bat', 'ingram', 'ingram2', 'grenade'], ammo: { '9mm': 140, '50ae': 14, '12g': 16, gren: 2 }, painkillers: 3 },
    music: 'tension',
    intro: 'brutality_in',
    outro: 'brutality_out',
    killY: -8,
    thought: 'Винни здесь. На этот раз не уйдёт.',
    build(B) {
      B.box(-40, -21, -60, 120, -20, 80, 'dirt');
      B.ground(-40, -60, 120, -12, 0, 'asphalt_snow');
      B.box(-40, 0, -14, 120, 0.15, -12, 'sidewalk');
      B.ground(52, 10, 84, 60, 0, 'asphalt_snow');
      B.zone(-40, -21, -60, 120, 40, 80, { outdoor: true, amb: [0.09, 0.1, 0.13] });
      B.zone(70, -0.3, -2, 74, 11.9, 10, { outdoor: false });
      B.zone(54, -0.3, 36, 80, R3, 56, { outdoor: false });
      B.zone(76, R3, 46, 80, 15.6, 50, { outdoor: false });
      B.zone(54, R3, 50, 58, TF + 6, 56, { outdoor: false });
      B.box(-40, 0, -64, 120, 16, -60, { side: 'facade_brick', top: 'roof_tar' });
      B.box(-10, EL - 1.2, -2, 32, EL - 1, 2, { top: 'rail', side: 'metal' });
      B.box(-10, EL - 1.2, 2, 30, EL, 6, { top: 'tile_floor', side: 'metal' });
      B.box(-10, EL - 1.2, 1.6, 30, EL, 2, { top: 'platform_edge', side: 'metal' });
      for (let x = -6; x < 30; x += 8) { B.box(x - 0.2, EL, 5.6, x + 0.2, EL + 3.6, 6, 'column_green'); B.box(x - 0.3, -20, -0.3, x + 0.3, EL - 1.2, 0.3, 'rust'); }
      B.box(-10, EL + 3.6, 1, 30, EL + 3.8, 6.4, { side: 'metal', bottom: 'metal', top: 'roof_tar' });
      B.box(-10, EL, 6, 30, EL + 1, 6.2, 'metal');
      B.box(30, EL - 0.12, 3, 32, EL, 5, 'diamond_plate');
      B.box(30, EL, 2.9, 32, EL + 1, 3, 'metal'); B.box(30, EL, 5, 32, EL + 1, 5.1, 'metal');
      B.box(32, -20, -10, 50, EL, 10, { side: 'facade_brown', top: 'roof_tar' });
      B.box(54, -20, -10, 70, EL, 10, { side: 'facade_grey', top: 'roof_tar' }); B.box(70, -20, -10, 74, EL, -2, { side: 'facade_grey', top: 'roof_tar' }); B.box(70, -20, -2, 74, -0.25, 10, 'dirt');
      B.box(50, EL - 0.35, -0.3, 54, EL - 0.05, 0.2, 'rust');
      B.box(50, EL - 0.35, 0.4, 54, EL - 0.05, 0.9, 'rust');
      B.box(50, EL - 0.45, -0.4, 54, EL - 0.35, 1, 'metal');
      for (const [x0, x1] of [[32, 50], [54, 74]]) { B.box(x0, EL, -10.2, x1, EL + 1, -10, 'brick_dark'); B.box(x0, EL, 10, x1, EL + 1, 10.2, 'brick_dark'); }
      B.box(49.8, EL, -10, 50, EL + 1, -0.5, 'brick_dark'); B.box(49.8, EL, 1.1, 50, EL + 1, 10, 'brick_dark');
      B.box(54, EL, -10, 54.2, EL + 1, -0.5, 'brick_dark'); B.box(54, EL, 1.1, 54.2, EL + 1, 10, 'brick_dark');
      B.box(32, EL, -10, 32.2, EL + 1, 2.9, 'brick_dark'); B.box(32, EL, 5.1, 32.2, EL + 1, 10, 'brick_dark');
      B.box(38, EL, -4, 40, EL + 1.4, -2, 'metal'); B.box(44, EL, 4, 46, EL + 2, 6, 'sheetmetal');
      B.box(60, EL, -6, 62, EL + 1.8, -3, 'sheetmetal'); B.box(64, EL, 2, 66.5, EL + 1.2, 4.5, 'metal');
      B.box(56, EL, 6, 58, EL + 1.3, 8, 'metal');
      B.plan({
        y: 0, h: 3.07, outer: 'brick_dark',
        rooms: [
          { id: 'swA', x0: 70, z0: -2, x1: 74, z1: 10, y: 0, h: 11.9, floor: 'concrete', wall: 'plaster_dirty', ceil: 'ceiling_dark', roof: 'roof_tar' },
          { id: 'lobB', x0: 56, z0: 36, x1: 80, z1: 46, y: 0, h: 3.15, floor: 'tile_floor', wall: 'plaster_green', ceil: 'ceiling_panel' },
          { id: 'shaftB', x0: 76, z0: 46, x1: 80, z1: 50, y: 0, h: 15.6, floor: 'metal_plate', wall: 'metal_plate', ceil: 'ceiling_dark', roof: 'roof_tar' },
          { id: 'loft', x0: 66, z0: 36, x1: 80, z1: 46, y: LF, h: 6.35, floor: 'wood_floor', wall: 'brick_dark', ceil: 'ceiling_dark', roof: 'roof_tar' },
          { id: 'apt1', x0: 54, z0: 36, x1: 66, z1: 46, y: TF, h: 3.15, floor: 'linoleum', wall: 'wallpaper_home', ceil: 'plaster', roof: 'roof_tar' },
          { id: 'tfc', x0: 54, z0: 46, x1: 76, z1: 50, y: TF, h: 3.15, floor: 'carpet_hotel', wall: 'wallpaper_hotel', ceil: 'ceiling_panel', roof: 'roof_tar' },
          { id: 'tfst', x0: 54, z0: 50, x1: 58, z1: 56, y: TF, h: 6.0, floor: 'concrete', wall: 'plaster_dirty', ceil: 'ceiling_dark', roof: 'roof_tar' },
          { id: 'r3n', x0: 58, z0: 50, x1: 76, z1: 56, y: TF, h: 3.15, floor: 'concrete', wall: 'plaster_dirty', ceil: 'ceiling_dark', roof: 'roof_tar' }
        ],
        doors: [
          { x: 72, z: -2, w: 1.2, y: EL, h: 2.2, door: { id: 'roofdoorA', mat: 'door_metal', swing: 1 } },
          { x: 74, z: -1, w: 1.2, y: 0, door: { id: 'courtdoor', mat: 'door_metal', swing: 1 } },
          { x: 68, z: 36, w: 2.4, y: 0, door: { id: 'lobB_door', mat: 'door_wood', double: true, swing: 1 } },
          { x: 78, z: 46, w: 2.2, y: 0, h: 2.4, door: { id: 'liftB_low', mat: 'metal_plate', slide: true, noPush: true, open: 1, target: 1 } },
          { x: 78, z: 50, w: 2.2, y: R3, h: 2.4, door: { id: 'liftB_up', mat: 'metal_plate', slide: true, noPush: true } },
          { x: 55, z: 50, w: 1.2, y: R3, h: 2.2, door: { id: 'r3door', mat: 'door_metal', swing: -1 } },
          { x: 57, z: 50, w: 1.1, y: TF, door: { id: 'tfst_door', mat: 'door_metal', swing: -1 } },
          { x: 60, z: 46, w: 1.1, y: TF, door: { id: 'apt_door', mat: 'door_wood', swing: -1 } },
          { x: 71, z: 46, w: 1.2, y: TF, door: { id: 'loft_door', mat: 'door_wood', swing: -1, locked: true, lockMsg: 'Изнутри заперто. Сначала коридор.' } },
          { x: 73, z: 36, w: 1.6, y: LF, door: { id: 'barricade', mat: 'door_metal', double: true, locked: true, noPush: true, lockMsg: 'Забаррикадировано.' } }
        ],
        windows: [{ x: 60, z: 36, w: 2, y: TF, y0: 0.9, y1: 2.2 }, { x: 63, z: 36, w: 3, y: 0, y0: 1, y1: 2.6 }]
      });
      for (let k = 0; k < 3; k++) {
        const y = k * 3.07;
        B.stairs(70.05, 0, 71.95, 8, y, y + 1.53, 's', 'concrete', { open: true });
        B.box(70, y + 1.53 - 0.14, 8, 74, y + 1.53, 10, { top: 'concrete', side: 'trim', bottom: 'ceiling_dark' });
        B.stairs(72.05, 0, 73.95, 8, y + 1.53, y + 3.07, 'n', 'concrete', { open: true });
        B.box(70, y + 3.07 - 0.14, -2, 74, y + 3.07, 0, { top: 'concrete', side: 'trim', bottom: 'ceiling_dark' });
      }
      B.box(56, 3.4, 36, 66, TF - 0.25, 46, { side: 'facade_grey', top: 'trim' });
      B.box(66, 3.4, 36, 80, LF - 0.25, 46, { side: 'facade_grey', top: 'trim' });
      B.box(54, 0, 36, 56, TF - 0.25, 46, { side: 'facade_grey', top: 'trim' });
      B.box(54, 0, 46, 76, TF - 0.25, 56, { side: 'facade_grey', top: 'trim' });
      B.box(76, 0, 50, 80, TF + 3.4, 56, { side: 'facade_grey', top: 'roof_tar' });
      B.box(66, TF - 0.25, 43, 80, TF, 46, { top: 'wood_floor', side: 'trim', bottom: 'plaster' });
      B.box(67.6, TF, 43, 80, TF + 1, 43.1, 'metal');
      B.stairs(66.2, 37, 67.6, 43, LF, TF, 's', 'wood_floor', { open: true });
      B.box(67.6, LF, 37, 67.7, TF + 1, 43, 'metal');
      for (const [x, z] of [[70, 43.2], [75, 43.2], [79.6, 43.2]]) B.box(x - 0.15, LF, z - 0.15, x + 0.15, TF, z + 0.15, 'rust');
      B.box(71, LF, 36.3, 75, LF + 1.6, 37.4, 'crate'); B.box(72, LF + 1.6, 36.3, 74, LF + 2.4, 37.2, 'crate');
      for (const [x, z, w, h] of [[70, 40, 1.2, 1.1], [76, 39, 1.4, 1.2], [73, 41.5, 1, 0.9]]) B.box(x - w / 2, LF, z - w / 2, x + w / 2, LF + h, z + w / 2, 'crate');
      B.stairs(54.2, 50.6, 55.8, 55.8, TF, R3, 'n', 'concrete', { open: true });
      B.box(55.8, TF + 0.3, 50.6, 55.9, R3 + 0.9, 55.8, 'metal');
      for (const [x0, z0, x1, z1] of [[54, 36, 80, 36.2], [54, 55.8, 80, 56], [54, 36, 54.2, 56], [79.8, 36, 80, 56]]) B.box(x0, R3, z0, x1, R3 + 1, z1, 'brick_dark');
      B.box(62, R3, 40, 64, R3 + 1.4, 42, 'metal'); B.box(68, R3, 48, 71, R3 + 1.2, 50, 'sheetmetal'); B.box(60, R3, 52, 62, R3 + 1, 54, 'metal');
      for (const [x0, z0, x1, z1] of [[52, 12, 76, 12.1], [80, 12, 84, 12.1], [52, 34, 66, 34.1], [70, 34, 84, 34.1], [52, 12, 52.1, 34], [83.9, 12, 84, 34]]) B.box(x0, 0, z0, x1, 3.5, z1, 'chainlink', { noShot: true });
      B.ground(74, -12, 84, 10, 0, 'asphalt_snow');
      B.box(84, -20, -12, 100, 12, 34, { side: 'facade_dark', top: 'roof_tar' });
      B.decor('dumpster', 82.5, 0, 2, -Math.PI / 2); B.light(78, 3.5, 0, [1, 0.7, 0.4], 9, { i: 0.8 });
      B.decor('hoop', 68, 0, 13, Math.PI); B.decor('hoop', 68, 0, 33, 0);
      B.decor('dumpster', 70, 0, 17.6, 0); B.decor('pallet', 63, 0, 25.2, 0.4);
      B.decor('dumpster', 80, 0, 30, -Math.PI / 2); B.decor('bench', 56, 0, 20, Math.PI / 2); B.box(74, 0, 22, 76, 1.2, 24, 'crate');
      B.decor('cruiser', 52, 0, -20, Math.PI / 2 + 0.3); B.decor('cruiser', 66, 0, -21, Math.PI / 2 - 0.2); B.decor('cruiser', 80, 0, -19, Math.PI / 2 + 0.1);
      B.light(52, 1.8, -18, [1, 0.2, 0.2], 10, { i: 1.1 }); B.light(66, 1.8, -19, [0.2, 0.3, 1], 10, { i: 1.1 }); B.light(80, 1.8, -17, [1, 0.2, 0.2], 10, { i: 1.1 });
      for (let x = -30; x < 120; x += 24) { B.decor('streetlight', x, 0, -12.6, 0); B.light(x, 4.5, -13.5, [1, 0.72, 0.45], 14); }
      for (let x = 0; x < 30; x += 8) B.light(x, EL + 3.3, 4, [0.85, 0.95, 0.9], 9, { i: 1 });
      B.light(41, EL + 4, 0, [0.6, 0.65, 0.8], 16, { i: 0.5 }); B.light(64, EL + 4, 0, [0.6, 0.65, 0.8], 16, { i: 0.5 });
      for (const y of [0, 3.07, 6.14]) B.light(72, y + 2.7, 5, [0.9, 0.9, 0.8], 6, { i: 0.8 });
      B.light(60, 6, 23, [1, 0.8, 0.5], 18); B.light(76, 6, 23, [1, 0.8, 0.5], 16);
      B.decor('streetlight', 56, 0, 14, Math.PI / 2); B.decor('streetlight', 80, 0, 32, -Math.PI / 2);
      B.decor('counter', 72, 0, 44.6, 0); B.decor('sofa', 60, 0, 44.5, Math.PI); B.light(62, 2.9, 40, LAMP, 10); B.light(74, 2.9, 40, LAMP, 9);
      B.light(78, 2.6, 48, [1, 1, 0.9], 4); B.light(78, R3 + 2.6, 48, [1, 1, 0.9], 4);
      B.light(66, R3 + 4, 46, [0.6, 0.65, 0.8], 18, { i: 0.5 }); B.light(56, R3 + 2.6, 53, [0.9, 0.9, 0.8], 5); B.light(56, TF + 2.8, 53, [0.9, 0.9, 0.8], 6);
      for (let x = 58; x < 76; x += 6) B.light(x, TF + 2.9, 48, LAMP, 6, { i: 0.8 });
      B.decor('counter', 55, TF, 43, Math.PI / 2); B.decor('stove', 55.4, TF, 45.3, Math.PI / 2); B.decor('fridge', 55.4, TF, 38, Math.PI / 2); B.decor('table', 61, TF, 41, 0.3); B.decor('chair', 60, TF, 40, 1);
      B.decal(58, TF + 0.01, 42.5, 'py', 1.6, 1.6, 'blood1');
      B.light(60, TF + 2.9, 41, [0.9, 1, 0.9], 8);
      B.light(70, LF + 5.8, 40, [1, 0.7, 0.4], 12); B.light(77, LF + 5.8, 44, [1, 0.7, 0.4], 9); B.light(73, LF + 2.5, 37.5, [1, 0.4, 0.3], 5);
      B.decal(66.12, LF + 3, 41, 'px', 1.4, 1.4, 'graffiti2');
    },
    props: [
      { kind: 'mover', id: 'trainS', model: 'eltrain', parts: trainParts, origin: [8, EL - 1, 0], path: [[8, EL - 1, 0], [160, EL - 1, 0]], maxSpeed: 12, accel: 3, crush: false, noBrake: true },
      { kind: 'searchlight', id: 'sl1', pos: [58, 1.8, -18], yaw: Math.PI, pitch: 0.42, sweep: 0.55, speed: 0.45, cone: 0.13, range: 45 },
      { kind: 'searchlight', id: 'sl2', pos: [72, 1.8, -19], yaw: Math.PI, pitch: 0.4, sweep: 0.5, speed: 0.6, phase: 2, cone: 0.13, range: 45 },
      { kind: 'mover', id: 'liftB', model: 'elevator', parts: [[-1.9, -0.25, -1.9, 1.9, 0, 1.9]], origin: [78, 0, 48], path: [[78, 0, 48], [78, R3, 48]], maxSpeed: 2.2, accel: 1.2, crush: false },
      { kind: 'button', id: 'liftBcall', pos: [79.7, 1.3, 45.4], yaw: -Math.PI / 2, label: 'Вызвать лифт' },
      { kind: 'cyl', id: 'cylR3', pos: [57, R3, 48.4] },
      { kind: 'cyl', id: 'cylR3b', pos: [58.6, R3, 48.9], color: '#2a5aa0' },
      { kind: 'crate', id: 'cr_c', pos: [58, 0, 30], size: [0.9, 0.9, 0.9] },
      { kind: 'note', id: 'apt_note', pos: [61, TF + 0.8, 41], title: 'Записка на столе', text: 'Винни!\nЯ отдал всё, что было. Скажи Лупино, что я больше ничего не должен.\nНе надо больше приходить ночью.\nФрэнк, кв. 12' }
    ],
    items: [
      { kind: 'painkillers', amount: 1, pos: [28, EL, 5] },
      { kind: 'ammo', ammo: '9mm', amount: 36, pos: [45, EL + 2, 5] },
      { kind: 'painkillers', amount: 1, pos: [65, EL + 1.2, 3] },
      { kind: 'ammo', ammo: '12g', amount: 8, pos: [72, 3.07, -1] },
      { kind: 'painkillers', amount: 1, pos: [58, 0.02, 30], in: 'cr_c' },
      { kind: 'weapon', weapon: 'grenade', amount: 2, pos: [75, 1.2, 23] },
      { kind: 'painkillers', amount: 2, pos: [62, R3 + 1.4, 41] },
      { kind: 'ammo', ammo: '9mm', amount: 48, pos: [55, TF + 0.95, 43] },
      { kind: 'painkillers', amount: 1, pos: [70, TF, 44.5] },
      { kind: 'ammo', ammo: '50ae', amount: 7, pos: [79, TF, 44.5] }
    ],
    chars: [
      { id: 'vinnie', type: 'vinnie', group: 'vinnie', pos: [26, EL, 4], yaw: Math.PI / 2, weapon: 'beretta2', mode: 'hold', stay: true, invuln: true, noDrop: true, speaker: 'vinnie', fleeNear: 18, accMul: 0.6,
        route: [
          { p: [31, EL, 4], go: true }, { p: [40, EL, 0], near: 16 }, { p: [48, EL, 0.3], near: 14 }, { p: [55, EL, 0.3], go: true },
          { p: [66, EL, 0], near: 14 }, { p: [72, EL, -1], ev: 'vinnieDown' }, { p: [72.8, 0, -1], go: true }, { p: [78, 0, -1], go: true }, { p: [78, 0, 14], near: 16 }, { p: [68, 0, 24], near: 16 }, { p: [68, 0, 38], ev: 'vinnieLobby', near: 16 }, { p: [78, 0, 48], ev: 'vinnieLift', go: true }
        ] },
      thug('r1a', 'r1', 42, EL, -6, -Math.PI / 2, 'beretta'),
      mob('r1b', 'r1', 46, EL, 7, -Math.PI / 2, 'ingram'),
      thug('r2a', 'r2', 60, EL, -8, Math.PI / 2, 'pump'),
      mob('r2b', 'r2', 66, EL, 6, Math.PI / 2, 'ingram'),
      thug('r2c', 'r2', 70, EL, -5, Math.PI / 2, 'beretta', { gren: 1 }),
      cop('cop1', 54, -17.5, Math.PI), cop('cop2', 63, -18.5, Math.PI), cop('cop3', 70, -18, Math.PI), cop('cop4', 82, -16.5, Math.PI),
      thug('sa1', 'swA', 71, 3.07, 9, Math.PI, 'beretta', { hidden: true }),
      mob('sa2', 'swA', 73, 1.53, 1, 0, 'pump', { hidden: true }),
      thug('sa3', 'swA', 71, 0, 9, Math.PI, 'ingram', { hidden: true }),
      thug('ct1', 'court', 60, 0, 28, 0, 'beretta'),
      mob('ct2', 'court', 76, 0, 26, 0, 'ingram'),
      thug('ct3', 'court', 64, 0, 18, 0.5, 'pump'),
      mob('ct4', 'court', 80, 0, 16, 0.3, 'beretta', { gren: 1 }),
      thug('rt1', 'r3', 62, R3, 44, 0, 'beretta', { hidden: true }),
      mob('rt2', 'r3', 70, R3, 40, 0.4, 'ingram', { hidden: true }),
      thug('sg1', 'r3sg', 56.5, R3, 47.4, Math.PI, 'pump', { hidden: true, stay: true, mode: 'hold' }),
      thug('sg2', 'r3sg', 58.2, R3, 47.6, Math.PI, 'pump', { hidden: true, stay: true, mode: 'hold' }),
      { id: 'frank', type: 'civ', pos: [57, TF, 42], yaw: 1, dead: true, deadPose: 'back', weapon: null, noDrop: true },
      thug('tc1', 'tfc', 66, TF, 47, -Math.PI / 2, 'beretta', { gren: 1 }),
      mob('tc2', 'tfc', 70, TF, 48.5, -Math.PI / 2, 'ingram', { gren: 1 }),
      thug('tc3', 'tfc', 73, TF, 47.3, -Math.PI / 2, 'pump', { gren: 1 }),
      mob('tc4', 'tfc', 74.5, TF, 49, -Math.PI / 2, 'beretta', { gren: 2 }),
      mob('lf1', 'loft', 70, LF, 38, 0, 'ingram', { hidden: true, leash: 8 }),
      thug('lf2', 'loft', 76, LF, 38, 0, 'pump', { hidden: true, leash: 8 }),
      mob('lf3', 'loft', 73, LF, 40, 0, 'beretta', { hidden: true, leash: 8, gren: 1 }),
      thug('lf4', 'loft', 78.5, LF, 41, 0.3, 'beretta', { hidden: true, leash: 8 })
    ],
    triggers: [
      { id: 'r2', min: [54.5, EL, -10], max: [74, EL + 2.5, 10] },
      { id: 'swA', min: [70, 5, -2], max: [74, EL + 0.5, 10] },
      { id: 'court', min: [52, 0, 12], max: [84, 3, 34] },
      { id: 'liftBin', min: [76.3, -0.1, 46.3], max: [79.7, 2, 49.7] },
      { id: 'r3', min: [54, R3, 36], max: [76, R3 + 2.5, 50] },
      { id: 'tfc', min: [54, TF, 46], max: [60, TF + 2.4, 50] },
      { id: 'loftIn', min: [68, TF, 43], max: [74, TF + 2.4, 46] }
    ],
    on: {
      start(g) {
        g.later(2.5, 'vinnieRun');
        g.later(3.5, 'trainOut');
        g.dialog([
          ['vinnie', 'Он всё ещё за мной! Да что ж такое!'],
          ['max:thought', 'Поезд остановился. Винни уже бежал по платформе, отстреливаясь не глядя.']
        ]);
        g.setThought('Не упустить Винни.');
      },
      trainOut(g) { g.moverGo('trainS'); g.later(12, 'trainHide'); },
      trainHide(g) { const t = g.prop('trainS'); t.hidden = true; t.moving = false; g.syncProp(t); },
      vinnieRun(g) {
        const v = g.char('vinnie');
        v.stay = false;
        v.ai.mode = 'flee';
        v.ai.route = 0;
      },
      'shot:vinnie'(g) { if (g.real - (g.flags.vShotT || -9) > 6) { g.flags.vShotT = g.real; g.think('Винни петляет, как заяц. В метель не попасть.'); } },
      'enter:r2'(g) {
        if (g.flags.r2) return;
        g.flags.r2 = true;
        g.dialog([
          ['cop', 'Полиция Нью-Йорка! Это Пейн, он на крыше!'],
          ['max:thought', 'Копы. Бравура не терял времени. В них я стрелять не стану, а они в меня будут. Держаться подальше от прожекторов.']
        ]);
        g.hint('Не попадайте в луч прожектора: полиция откроет огонь, а отвечать ей нельзя.', 7);
        g.setThought('Уйти с крыши через дверь на лестницу. Не попадаться в прожекторы.');
      },
      'spotted:sl1'(g) { g.fireEvent('copsOpen'); },
      'spotted:sl2'(g) { g.fireEvent('copsOpen'); },
      copsOpen(g) {
        g.flags.copsFire = true;
        g.later(3.5, 'copsCease');
        if (!g.flags.copsSaid) { g.flags.copsSaid = true; g.say('cop', 'Вон он! Огонь!', 2); }
      },
      copsCease(g) { g.flags.copsFire = false; },
      vinnieDown(g) { g.checkpoint(); },
      'enter:swA'(g) { if (!g.flags.swA) { g.flags.swA = true; g.wake('swA', 'alert'); } },
      'enter:court'(g) { g.alert('court'); },
      vinnieLobby(g) { g.checkpoint(); },
      vinnieLift(g) {
        const v = g.char('vinnie');
        v.ai.mode = 'prop';
        g.closeDoor('liftB_low');
        g.later(1, 'vinnieUp');
        g.say('vinnie', 'Пока, коп! Встретимся в аду!', 2.4);
      },
      vinnieUp(g) {
        const v = g.char('vinnie');
        const gr = g.world.groundAt(v.pos[0], v.pos[2], v.pos[1] + 0.3, 0.2);
        v.onGround = true; v.groundObj = gr.obj;
        g.moverGo('liftB', [[78, 0, 48], [78, R3, 48]]);
        g.flags.liftBusy = true;
      },
      'mover:liftB'(g) {
        const t = g.prop('liftB');
        if (!g.flags.vinnieGone) {
          g.flags.vinnieGone = true;
          const v = g.char('vinnie');
          v.state = 'hidden';
          v.pos = [75, LF, 38];
          g.later(1.5, 'liftBack');
          g.think('Лифт ушёл наверх. Вызову его обратно.');
          g.setThought('Вызвать лифт и подняться за Винни.');
          return;
        }
        g.flags.liftBusy = false;
        if (t.origin[1] > 1) { g.openDoor('liftB_up', 1); g.wake('r3', 'alert'); g.wake('r3sg', 'hold'); }
        else g.openDoor('liftB_low', 1);
      },
      liftBack(g) { g.flags.liftBusy = true; g.moverGo('liftB', [[78, R3, 48], [78, 0, 48]]); },
      'use:liftBcall'(g) {
        g.prop('liftBcall').used = false;
        const t = g.prop('liftB');
        if (g.flags.liftBusy || t.origin[1] < 1) return;
        g.flags.liftBusy = true;
        g.closeDoor('liftB_up');
        g.later(1, 'liftBack');
      },
      'enter:liftBin'(g) {
        const t = g.prop('liftB');
        if (!g.flags.vinnieGone || g.flags.liftBusy || t.origin[1] > 1) { g.enableTrigger('liftBin', true); return; }
        g.flags.liftBusy = true;
        g.closeDoor('liftB_low');
        g.later(1.2, 'liftUpPlayer');
      },
      liftUpPlayer(g) { g.moverGo('liftB', [[78, 0, 48], [78, R3, 48]]); },
      'enter:r3'(g) {
        if (g.flags.r3) return;
        g.flags.r3 = true;
        g.think('Двое с дробовиками стерегут лестницу. Между ними газовый баллон. Кто-то оставил мне подсказку.');
        g.setThought('Спуститься через лестничную будку на крыше.');
      },
      'enter:tfc'(g) { if (!g.flags.tfc) { g.flags.tfc = true; g.alert('tfc'); } },
      'kill:tfc'(g) {
        g.unlock('loft_door');
        g.think('Из-за двери в конце коридора голос Винни. Он кричит на кого-то.');
        g.setThought('Дверь в конце коридора. Винни там.');
        g.checkpoint();
      },
      'enter:loftIn'(g) {
        if (g.flags.loft) return;
        g.flags.loft = true;
        g.wake('loft', 'alert');
        const v = g.char('vinnie');
        v.state = 'alive'; v.pos = [74, LF, 37.9]; v.yaw = 0; v.invuln = true; v.ai.mode = 'hold'; v.stay = true; v.static = true;
        g.dialog([
          ['vinnie', 'Дверь заколочена! Кто её заколотил?! Кто?!'],
          ['Бандит', 'Ты сам велел, Винни.'],
          ['vinnie', 'Заткнись и стреляй!']
        ]);
        g.music('tension');
      },
      'kill:loft'(g) {
        const v = g.char('vinnie');
        v.ai.mode = 'surrender';
        v.anim.hands = true;
        v.usable = 'Допросить';
        g.dialog([['vinnie', 'Всё, всё! Я сдаюсь! Не стреляй, Пейн, я безоружный!']]);
        g.setThought('Допросить Винни.');
      },
      'talk:vinnie'(g) {
        if (g.flags.interrogate) return;
        g.flags.interrogate = true;
        g.char('vinnie').usable = null;
        g.later(0.3, 'brutalEnd');
      },
      brutalEnd(g) { g.finish(); }
    }
  });
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
