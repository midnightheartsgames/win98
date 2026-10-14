(function (M) {
  'use strict';
  const RED = [1, 0.25, 0.3], VIO = [0.6, 0.3, 1], BLU = [0.35, 0.5, 1];
  const G1 = 4.5, CT = 8, TOP = 12;
  const goth = (id, group, x, y, z, yaw, weapon, o) => Object.assign({ id, type: 'goth', group, pos: [x, y, z], yaw, weapon, mode: 'ambush' }, o || {});
  const mob = (id, group, x, y, z, yaw, weapon, o) => Object.assign({ id, type: 'mobster', group, pos: [x, y, z], yaw, weapon, mode: 'ambush' }, o || {});

  M.defineLevel({
    id: 'ragnarock',
    title: 'Рагнарок',
    titleEn: 'Ragna Rock',
    part: 1,
    chapter: 8,
    world: { ambient: [0.05, 0.04, 0.055], fog: { color: [0.04, 0.03, 0.05], near: 18, far: 80 }, weather: 'blizzard', sky: 'night', moon: { dir: M.norm([0.3, -0.85, 0.3]), color: [0.08, 0.09, 0.12] } },
    start: { pos: [24, 0, -12], yaw: Math.PI },
    loadout: { weapons: ['beretta', 'beretta2', 'deagle', 'pump', 'bat', 'ingram', 'ingram2', 'grenade', 'molotov'], ammo: { '9mm': 150, '50ae': 21, '12g': 20, gren: 3, molo: 2 }, painkillers: 4 },
    music: 'club',
    intro: 'ragnarock_in',
    outro: 'ragnarock_out',
    killY: -20,
    thought: 'Рагна Рок. Клуб Лупино в старой церкви.',
    dynLights(g, t) {
      const out = [];
      if (!g.flags.danceOff) {
        const k = Math.floor(t * 8) % 7;
        if (k === 0) out.push({ pos: [22, 7, 20], color: [2.2, 2.2, 2.4], r: 22 });
        out.push({ pos: [14 + Math.sin(t * 1.3) * 8, 6, 20 + Math.cos(t * 1.1) * 8], color: [1.4, 0.2, 0.4], r: 10 });
        out.push({ pos: [30 + Math.sin(t * 0.9 + 2) * 7, 6, 18 + Math.cos(t * 1.4) * 7], color: [0.4, 0.3, 1.5], r: 10 });
      }
      if (!g.flags.stageDone) out.push({ pos: [56, 6, 28 + Math.sin(t * 2) * 4], color: [1.2, 0.3, 0.3], r: 9 });
      return out;
    },
    build(B) {
      B.ground(-30, -30, 80, 0, 0, 'asphalt_snow');
      B.box(-30, 0, -3, 80, 0.15, 0, 'sidewalk');
      B.zone(-30, -2, -30, 80, 40, 0, { outdoor: true, amb: [0.09, 0.1, 0.13] });
      B.zone(8, TOP - 0.3, 52, 48, TOP + 8, 56, { outdoor: true, amb: [0.09, 0.1, 0.13] });
      B.zone(-8, -1, 0, 68, 16, 66, { outdoor: false, amb: [0.075, 0.06, 0.085] });
      B.box(-30, 0, -34, 80, 16, -30, { side: 'facade_brick', top: 'roof_tar' });
      B.plan({
        y: 0, h: 3.2, outer: 'stone_gothic',
        rooms: [
          { id: 'foyer', x0: 16, z0: 0, x1: 32, z1: 8, y: 0, floor: 'marble_dark', wall: 'club_black', ceil: 'ceiling_dark' },
          { id: 'sec', x0: 32, z0: 0, x1: 40, z1: 8, y: 0, floor: 'linoleum', wall: 'plaster_dirty', ceil: 'ceiling_dark' },
          { id: 'dance', x0: 4, z0: 8, x1: 40, z1: 32, y: 0, h: 9, floor: 'club_floor', wall: 'stone_gothic', ceil: 'ceiling_dark', roof: 'roof_tar' },
          { id: 'side1', x0: 40, z0: 8, x1: 48, z1: 20, y: 0, floor: 'concrete_dark', wall: 'club_red', ceil: 'ceiling_dark' },
          { id: 'corr1', x0: 40, z0: 20, x1: 48, z1: 40, y: 0, floor: 'concrete_dark', wall: 'club_black', ceil: 'ceiling_dark' },
          { id: 'st1', x0: 40, z0: 40, x1: 48, z1: 48, y: 0, h: 7.7, floor: 'concrete', wall: 'stone_gothic', ceil: 'ceiling_dark' },
          { id: 'gal2', x0: 12, z0: 32, x1: 40, z1: 48, y: G1, floor: 'parquet', wall: 'curtain_red', ceil: 'ceiling_dark' },
          { id: 'back1', x0: -8, z0: 12, x1: 4, z1: 28, y: G1, h: 6.7, floor: 'wood_floor', wall: 'brick_dark', ceil: 'ceiling_dark' },
          { id: 'count', x0: -8, z0: 28, x1: 4, z1: 40, y: CT, floor: 'carpet_red', wall: 'wood_panel', ceil: 'ceiling_panel' },
          { id: 'barrels', x0: -8, z0: 40, x1: 4, z1: 52, y: CT, floor: 'concrete', wall: 'brick_dark', ceil: 'ceiling_dark' },
          { id: 'tall', x0: -8, z0: 52, x1: 8, z1: 66, y: 0, h: 15.5, floor: 'concrete_dark', wall: 'stone_gothic', ceil: 'ceiling_dark', roof: 'roof_tar' },
          { id: 'stageR', x0: 48, z0: 20, x1: 64, z1: 56, y: 0, h: 14.5, floor: 'wood_floor', wall: 'club_black', ceil: 'ceiling_dark', roof: 'roof_tar' },
          { id: 'backdoor', x0: 64, z0: 21, x1: 68, z1: 25, y: 1, h: 3, floor: 'stone_gothic', wall: 'stone_gothic', ceil: 'ceiling_dark' }
        ],
        doors: [
          { x: 24, z: 0, w: 2.4, y: 0, door: { id: 'club_front', mat: 'door_red', double: true, swing: 1 } },
          { x: 32, z: 4, w: 1.1, y: 0, door: { id: 'sec_door', mat: 'door_metal', swing: 1 } },
          { x: 24, z: 8, w: 2.4, y: 0, door: { id: 'dance_door', mat: 'door_red', double: true, swing: 1, locked: true, lockMsg: 'Двери в зал заперты. Где-то должен быть пульт охраны.' } },
          { x: 40, z: 14, w: 1.4, y: 0, door: { id: 'side_door', mat: 'door_metal', swing: 1 } },
          { x: 44, z: 20, w: 1.2, y: 0, door: { id: 'pad_door', mat: 'door_old', swing: 1, locked: true, lockMsg: 'На двери висячий замок.' } },
          { x: 44, z: 40, w: 3, y: 0, h: 2.6 },
          { x: 40, z: 46.8, w: 1.4, y: G1, door: { id: 'gal_door', mat: 'door_red', swing: -1 } },
          { x: 22, z: 32, w: 2, y: G1, door: { id: 'mezz_door', mat: 'door_red', swing: -1 } },
          { x: 4, z: 20, w: 1.4, y: G1, door: { id: 'back_door', mat: 'door_old', swing: -1 } },
          { x: -2, z: 40, w: 1.2, y: CT, door: { id: 'barrels_door', mat: 'door_metal', swing: 1 } },
          { x: -2, z: 52, w: 1.4, y: CT, door: { id: 'tall_door', mat: 'door_old', swing: 1 } },
          { x: 8, z: 54, w: 1.2, y: TOP, door: { id: 'roof_door', mat: 'door_metal', swing: 1 } },
          { x: 48, z: 54, w: 1.2, y: TOP, door: { id: 'stage_top', mat: 'door_metal', swing: 1 } },
          { x: 64, z: 23, w: 1.6, y: 1, door: { id: 'sanctum_door', mat: 'door_red', double: true, locked: true, noPush: true, lockMsg: 'Декорации загораживают дверь.' } }
        ],
        windows: [{ x: 36, z: 0, w: 2.4, y: 0, y0: 1, y1: 2.4 }]
      });
      B.box(4, G1 - 0.25, 28, 40, G1, 32, { top: 'wood_floor', side: 'trim', bottom: 'ceiling_dark' });
      B.box(4, G1 - 0.25, 8, 8, G1, 28, { top: 'wood_floor', side: 'trim', bottom: 'ceiling_dark' });
      B.box(8, G1, 28, 40, G1 + 1, 28.1, 'metal');
      B.box(8, G1, 8, 8.1, G1 + 1, 28, 'metal');
      for (const [x, z] of [[8, 12], [8, 20], [8, 28], [16, 28], [24, 28], [32, 28], [39.6, 28]]) B.box(x - 0.2, 0, z - 0.2, x + 0.2, G1 - 0.25, z + 0.2, 'stone_gothic');
      B.box(12, 0, 32, 40, G1 - 0.25, 48, { side: 'stone_gothic', top: 'trim' });
      B.box(-8, 0, 12, 4, G1 - 0.25, 28, { side: 'stone_gothic', top: 'trim' });
      B.box(-8, 0, 28, 4, CT - 0.25, 52, { side: 'stone_gothic', top: 'trim' });
      B.box(4, 0, 32, 12, TOP, 52, { side: 'stone_gothic', top: 'roof_tar' });
      B.box(8, 0, 52, 48, TOP, 56, { side: 'stone_gothic', top: 'roof_tar' });
      B.box(12, G1 + 3.45, 32, 48, TOP, 52, { side: 'stone_gothic', top: 'roof_tar' });
      B.box(40, 0, 48, 48, G1 + 3.45, 52, { side: 'stone_gothic', top: 'roof_tar' });
      B.box(8, TOP, 55.8, 48, TOP + 1.1, 56, 'stone_gothic');
      B.box(8, TOP, 52, 48, TOP + 0.4, 52.2, 'stone_gothic');
      B.stairs(40.2, 40.2, 47.8, 47.8, 0, G1, 's', 'concrete');
      B.stairs(-7.8, 22.2, -4.2, 27.9, G1, CT, 's', 'wood_floor');
      B.box(-4.2, G1, 22.2, -4, G1 + 1, 27.9, 'metal');
      B.box(-8, CT - 0.25, 52, 8, CT, 55, { top: 'plank', side: 'trim', bottom: 'plank' });
      B.stairs(5.6, 55, 7.9, 64, CT, 10.4, 's', 'plank', { open: true });
      B.box(-8, 10.26, 64, 8, 10.4, 66, { top: 'plank', side: 'trim', bottom: 'plank' });
      B.stairs(-7.9, 57, -5.6, 64, 10.4, TOP, 'n', 'plank', { open: true });
      B.box(-8, TOP - 0.14, 52, -5.6, TOP, 57, { top: 'plank', side: 'trim', bottom: 'plank' });
      B.box(-5.6, TOP - 0.2, 53.6, 8, TOP, 54.4, 'plank');
      B.box(-5.6, TOP - 0.2, 57.6, 8, TOP, 58.1, 'rust');
      B.box(-5.6, TOP - 0.2, 61, 8, TOP, 61.5, 'rust');
      B.box(5.5, CT, 55, 5.6, CT + 1.2, 64, 'metal');
      B.box(48, 0, 20, 64, 1, 36, { top: 'wood_floor', side: 'club_black' });
      B.stairs(48.2, 36, 50, 38, 0, 1, 'n', 'wood_floor');
      B.box(48, TOP - 0.2, 50, 64, TOP, 56, { top: 'diamond_plate', side: 'metal', bottom: 'metal' });
      B.stairs(48.2, 38.2, 50.4, 50, 1, TOP, 's', 'metal', { open: true });
      B.box(50.4, TOP, 50, 50.5, TOP + 1, 56, 'metal');
      B.group('scen', () => {
        B.box(60, 1, 20.5, 63.9, 7, 21, 'curtain_red');
        B.box(60, 1, 25, 63.9, 7, 25.5, 'curtain_red');
        B.box(62.5, 1, 21, 63.9, 7, 25, { side: 'curtain_red', top: 'trim' });
      });
      B.decor('counter', 24, 0, 6.8, Math.PI); B.decor('coatrack', 17, 0, 1.5, 0); B.decor('coatrack', 30.8, 0, 1.5, 0); B.decor('statue', 17.5, 0, 6.5, 0.4);
      B.decal(24, 4.4, -0.12, 'nz', 7, 1.6, 'neon_ragna', { emissive: true });
      B.decal(24, 9, -0.12, 'nz', 4, 5, 'pentagram', { alpha: 0.35 });
      B.light(24, 4.8, -1.5, [0.5, 0.6, 1.2], 10, { i: 1.3 });
      B.decor('streetlight', 10, 0, -2.6, 0); B.decor('streetlight', 40, 0, -2.6, 0); B.light(10, 4.5, -3.5, [1, 0.72, 0.45], 14); B.light(40, 4.5, -3.5, [1, 0.72, 0.45], 14);
      B.decor('car', 12, 0, -7, Math.PI / 2, { color: '#111' }); B.decor('car', 36, 0, -7.5, -Math.PI / 2, { color: '#3a0a0a' });
      B.light(24, 3, 4, [0.8, 0.3, 0.4], 9);
      B.decor('desk', 36, 0, 6.8, Math.PI); B.decor('lockers', 39.6, 0, 3, -Math.PI / 2); B.decor('chair', 36, 0, 5.8, 0);
      B.light(36, 3, 4, [0.8, 1, 0.8], 7);
      B.decor('djbooth', 22, G1, 30, Math.PI); B.decor('speaker', 12, 0, 30.6, Math.PI); B.decor('speaker', 32, 0, 30.6, Math.PI); B.decor('speaker', 5, 0, 10, Math.PI / 2);
      B.decor('bar', 22, 0, 9.4, 0); B.decor('tableside', 14, 0, 16, Math.PI); B.decor('tableside', 30, 0, 16, Math.PI); B.decor('cage', 36, 0, 24, 0.3); B.decor('cage', 12, 0, 24, -0.2);
      B.light(22, 3.2, 11, [1, 0.75, 0.45], 7, { i: 0.9 });
      for (const [x, z, c] of [[8, 12, RED], [36, 12, VIO], [8, 28, BLU], [36, 28, RED]]) B.light(x, 2.6, z, c, 9, { i: 1.1 });
      B.light(22, 8.5, 14, RED, 14, { i: 0.9 }); B.light(22, 8.5, 26, VIO, 14, { i: 0.9 }); B.light(6, G1 + 2.8, 18, [1, 0.5, 0.3], 7); B.light(22, G1 + 2.8, 30, BLU, 9);
      B.decal(22, 7, 31.88, 'nz', 6, 6, 'pentagram', { emissive: true, alpha: 0.9 });
      B.decal(4.12, 3, 16, 'px', 1.1, 1.55, 'poster_valkyr'); B.decal(39.88, 3, 22, 'nx', 1.1, 1.55, 'poster_valkyr');
      B.decor('pallet', 45, 0, 12, 0.3); B.decor('barrel', 47, 0, 17, 0, { color: '#3a0a0a' }); B.decor('shelf', 47.6, 0, 10, -Math.PI / 2);
      B.light(44, 3, 14, RED, 8);
      for (let z = 24; z < 40; z += 6) B.light(44, 3, z, [0.9, 0.35, 0.35], 7, { i: 1.1 });
      B.decal(40.12, 1.6, 30, 'px', 1.4, 1.1, 'graffiti2');
      B.light(44, 7, 44, [0.9, 0.9, 0.8], 7);
      B.decor('sofa', 20, G1, 44, Math.PI, { mat: 'fabric_red' }); B.decor('sofa', 32, G1, 44, Math.PI, { mat: 'fabric_red' }); B.decor('table', 26, G1, 40, 0); B.decor('statue', 14, G1, 46, 0.6);
      B.light(18, G1 + 2.9, 40, [0.9, 0.4, 0.4], 9); B.light(32, G1 + 2.9, 40, [0.9, 0.4, 0.4], 9);
      B.decal(26, G1 + 1.6, 47.88, 'nz', 1.4, 1.1, 'painting');
      B.decor('shelf', 3.6, G1, 14, -Math.PI / 2); B.decor('pallet', -6, G1, 14, 0.2); B.decor('speaker', 2, G1, 26, 0);
      B.light(-2, G1 + 3, 20, [1, 0.6, 0.35], 9);
      B.decor('table', -2, CT, 34, 0); B.decor('chair', -3.2, CT, 34, Math.PI / 2, { solid: false }); B.decor('chair', -0.8, CT, 34, -Math.PI / 2, { solid: false }); B.decor('chair', -2, CT, 35.2, Math.PI, { solid: false });
      B.decor('moneypile', -2, CT + 0.78, 34, 0.2, { solid: false }); B.decor('safe', 3.3, CT, 38.8, -Math.PI / 2);
      B.light(-2, CT + 2.9, 34, [1, 0.85, 0.6], 8);
      for (let z = 42; z < 52; z += 2.4) { B.decor('barrel', -6.8, CT, z, 0, { color: '#4a2a1a' }); B.decor('barrel', -6.8, CT + 0.9, z, 0, { color: '#2a3a2a' }); }
      B.box(-1, CT, 45, 1, CT + 1.8, 49, 'crate');
      B.light(-2, CT + 2.9, 46, [0.9, 0.8, 0.6], 7);
      B.light(0, 9, 59, [0.8, 0.5, 0.35], 12); B.light(0, 14.5, 59, [0.7, 0.75, 0.9], 10, { i: 0.7 }); B.light(-6, 4, 58, [0.8, 0.3, 0.2], 7);
      B.decal(0, 7, 65.88, 'nz', 5, 5, 'pentagram', { alpha: 0.6 });
      B.light(28, TOP + 4, 54, [0.6, 0.65, 0.8], 20, { i: 0.5 });
      B.decor('speaker', 51, 1, 22, 0); B.decor('speaker', 51, 1, 34, Math.PI); B.decor('mixer', 58, 1, 33, Math.PI);
      B.decor('cross', 62, 1, 30, -Math.PI / 2); B.decor('candles', 55, 1, 27, 0, { solid: false });
      B.light(56, 9, 28, [1, 0.5, 0.4], 14); B.light(56, TOP + 1.5, 53, [0.9, 0.9, 0.8], 7); B.light(56, 6, 44, [0.6, 0.4, 0.8], 10);
      B.light(66, 3.6, 23, [1, 0.2, 0.2], 5, { i: 0.9 });
    },
    props: [
      { kind: 'button', id: 'secbtn', pos: [36, 1.2, 7.3], yaw: Math.PI, label: 'Открыть двери зала', once: true },
      { kind: 'tv', id: 'mon1', pos: [34.5, 0.78, 7.2], yaw: Math.PI, show: 'cctv', on: true },
      { kind: 'tv', id: 'mon2', pos: [37.5, 0.78, 7.2], yaw: Math.PI, show: 'cctv', on: true },
      { kind: 'padlock', id: 'pad', pos: [44.4, 1.05, 19.88], door: 'pad_door', swing: 1 },
      { kind: 'crate', id: 'crS', pos: [42, 0, 9.5], size: [0.8, 0.8, 0.8] },
      { kind: 'cyl', id: 'cylB', pos: [-5, CT, 44] },
      { kind: 'button', id: 'scenBtn', pos: [63.6, 2.2, 38], yaw: -Math.PI / 2, label: 'Пульт сцены: убрать декорации', once: true, locked: true, lockMsg: 'Сначала разберусь с охраной сцены.' },
      { kind: 'note', id: 'lupino_book', pos: [26, G1 + 0.8, 40], title: 'Страница из книги, вложенная между счетами', text: 'И придёт великая зима, и три зимы подряд не будет лета. Волк проглотит солнце, и звёзды упадут с неба.\n\nНа полях карандашом, почерк Лупино:\n«Это про нас. Валькирия открывает глаза. Скоро, скоро.»' }
    ],
    items: [
      { kind: 'painkillers', amount: 2, pos: [39.6, 1.06, 3] },
      { kind: 'ammo', ammo: '9mm', amount: 48, pos: [36, 0.8, 6.9] },
      { kind: 'ammo', ammo: '50ae', amount: 7, pos: [22, 1.12, 9.4] },
      { kind: 'painkillers', amount: 1, pos: [42, 0.02, 9.5], in: 'crS' },
      { kind: 'weapon', weapon: 'grenade', amount: 2, pos: [47.6, 1.06, 10] },
      { kind: 'painkillers', amount: 2, pos: [22, G1 + 1.2, 30] },
      { kind: 'ammo', ammo: '12g', amount: 12, pos: [3.6, G1 + 1.06, 14] },
      { kind: 'painkillers', amount: 1, pos: [3.3, CT + 1.4, 38.8] },
      { kind: 'ammo', ammo: '9mm', amount: 48, pos: [-1.5, CT + 0.78, 33.7] },
      { kind: 'painkillers', amount: 1, pos: [0, CT + 1.8, 47] },
      { kind: 'painkillers', amount: 2, pos: [56, TOP, 54] },
      { kind: 'ammo', ammo: '12g', amount: 8, pos: [58, 1, 31] }
    ],
    chars: [
      goth('f1', 'foyer', 20, 0, 5, Math.PI, 'beretta'),
      mob('f2', 'foyer', 28, 0, 3, Math.PI, 'ingram'),
      goth('d1', 'dance', 14, 0, 20, Math.PI, 'beretta', { hidden: true }),
      mob('d2', 'dance', 30, 0, 22, Math.PI, 'pump', { hidden: true }),
      goth('d3', 'dance', 22, 0, 26, Math.PI, 'ingram', { hidden: true }),
      goth('bal1', 'balcony', 6, G1, 14, -Math.PI / 2, 'beretta', { hidden: true, stay: true, mode: 'hold' }),
      goth('bal2', 'balcony', 6, G1, 24, -Math.PI / 2, 'ingram', { hidden: true, stay: true, mode: 'hold' }),
      mob('bal3', 'balcony', 34, G1, 30, Math.PI, 'beretta', { hidden: true, stay: true, mode: 'hold', gren: 1 }),
      goth('s1', 'side', 43, 0, 12, -Math.PI / 2, 'beretta'),
      goth('s2', 'side', 46, 0, 16, -Math.PI / 2, 'pump'),
      mob('s3', 'side', 45, 0, 10, -Math.PI / 2, 'ingram'),
      goth('c1', 'corr', 44, 0, 30, Math.PI, 'beretta', { hidden: true }),
      mob('c2', 'corr', 43, 0, 37, Math.PI, 'ingram', { hidden: true }),
      goth('g1', 'gal', 16, G1, 36, -Math.PI / 2, 'beretta', { hidden: true }),
      mob('g2', 'gal', 18, G1, 45, -Math.PI / 2, 'pump', { hidden: true }),
      goth('m1', 'mezz', 16, G1, 30, Math.PI, 'ingram', { hidden: true }),
      goth('m2', 'mezz', 30, G1, 29.5, Math.PI, 'beretta', { hidden: true }),
      mob('ct1', 'count', -3.2, CT, 34, Math.PI / 2, 'beretta', { pose: 'count', hidden: true }),
      mob('ct2', 'count', -0.8, CT, 34, -Math.PI / 2, 'ingram', { pose: 'count', hidden: true }),
      goth('ct3', 'count', -2, CT, 35.2, 0, 'beretta', { pose: 'count', hidden: true }),
      goth('br1', 'barrels', -4, CT, 50, 0, 'pump', { hidden: true, hunter: true }),
      mob('br2', 'barrels', -5.5, CT, 48, 0, 'beretta', { hidden: true, hunter: true }),
      goth('br3', 'barrels', -4.5, CT, 45.5, 0, 'ingram', { hidden: true, hunter: true }),
      goth('t1', 'tall', 6.8, 9.2, 60, Math.PI, 'beretta', { hidden: true }),
      mob('t2', 'tall', 0, 10.4, 65, Math.PI / 2, 'ingram', { hidden: true }),
      goth('t3', 'tall', -6.8, TOP, 54, 0, 'pump', { hidden: true }),
      goth('rf1', 'roof', 32, TOP, 54, Math.PI / 2, 'beretta', { hidden: true }),
      goth('st1', 'stairs', 49.3, 8, 46, 0, 'beretta', { hidden: true }),
      mob('st2', 'stairs', 49.3, 4, 41, 0, 'ingram', { hidden: true }),
      goth('sg1', 'stage', 54, 1, 30, Math.PI, 'pump', { hidden: true }),
      mob('sg2', 'stage', 60, 1, 26, Math.PI, 'ingram', { hidden: true }),
      goth('sg3', 'stage', 57, 1, 34, Math.PI, 'beretta', { hidden: true, gren: 1 })
    ],
    triggers: [
      { id: 'foyer', min: [18, 0, 0.5], max: [30, 2.5, 3] },
      { id: 'dance', min: [18, 0, 8.5], max: [30, 2.5, 12] },
      { id: 'side', min: [40.5, 0, 12], max: [44, 2.5, 16] },
      { id: 'corr', min: [40.5, 0, 20.5], max: [48, 2.5, 26] },
      { id: 'gal', min: [36, G1, 44], max: [40, G1 + 2.4, 48] },
      { id: 'mezz', min: [18, G1, 28.5], max: [26, G1 + 2.4, 31.5] },
      { id: 'back', min: [-8, G1, 12], max: [4, G1 + 2.4, 22] },
      { id: 'count', min: [-8, CT, 28], max: [4, CT + 2.4, 31] },
      { id: 'barrels', min: [-8, CT, 40.2], max: [4, CT + 2.4, 43] },
      { id: 'tall', min: [-8, CT - 0.1, 52], max: [8, CT + 2.4, 55] },
      { id: 'roof', min: [8.5, TOP, 52], max: [20, TOP + 2.5, 56] },
      { id: 'stageTop', min: [48, TOP - 0.3, 50], max: [56, TOP + 2.4, 56] },
      { id: 'stageFloor', min: [50, 1, 20], max: [64, 3.5, 36] },
      { id: 'sanctum', min: [64.2, 1, 21.2], max: [68, 3.5, 24.8] }
    ],
    on: {
      start(g) {
        g.dialog([
          ['max:thought', 'Рагна Рок. Кто-то купил старую церковь и поселил в ней клуб, где молятся другим богам.'],
          ['max:thought', 'Винни сказал: Лупино здесь. Сегодня он принимает гостей.']
        ]);
        g.setThought('Войти в клуб.');
      },
      'enter:foyer'(g) { g.alert('foyer'); },
      'kill:foyer'(g) { g.setThought('Двери в зал заперты. Пульт охраны в комнате справа.'); },
      'use:secbtn'(g) {
        g.unlock('dance_door');
        g.think('Замок на дверях зала щёлкнул. На мониторах танцпол и люди с оружием на балконе.');
        g.setThought('Танцпол. Стрелки на балконе.');
      },
      'enter:dance'(g) {
        if (g.flags.dance) return;
        g.flags.dance = true;
        g.wake('dance', 'alert');
        g.wake('balcony', 'hold');
        for (const c of g.chars) if (c.group === 'balcony') M.AI.alertChar(g, c, g.player.pos, 0.8);
        g.think('Музыка гремела так, что выстрелы казались частью ритма.');
      },
      'kill:dance'(g) { if (g.groupAlive('balcony') === 0) g.fireEvent('danceClear'); },
      'kill:balcony'(g) { if (g.groupAlive('dance') === 0) g.fireEvent('danceClear'); },
      danceClear(g) {
        if (g.flags.danceClear) return;
        g.flags.danceClear = true;
        g.flags.danceOff = true;
        g.setThought('Боковая дверь справа от бара.');
        g.checkpoint();
      },
      'enter:side'(g) { g.alert('side'); },
      'kill:side'(g) { g.think('Дальше дверь на висячем замке. Замки в этом городе держатся до первого выстрела.'); },
      'break:pad'(g) { g.wake('corr', 'alert'); },
      'enter:corr'(g) { g.wake('corr', 'alert'); },
      'enter:gal'(g) { g.wake('gal', 'alert'); },
      'kill:gal'(g) { g.setThought('Мезонин диджея через дверь в конце галереи.'); },
      'enter:mezz'(g) { g.wake('mezz', 'alert'); },
      'kill:mezz'(g) { g.setThought('С балкона налево, в дверь за кулисы.'); g.checkpoint(); },
      'enter:back'(g) { if (!g.flags.back) { g.flags.back = true; g.think('За кулисами лестница наверх. Сверху слышно, как шелестят купюры.'); } },
      'enter:count'(g) { if (!g.flags.count) { g.flags.count = true; g.wake('count', 'ambush'); g.hint('Граната: клавиша G. Трое считают деньги за одним столом.', 5); } },
      'kill:count'(g) { g.checkpoint(); },
      'enter:barrels'(g) { if (!g.flags.barrels) { g.flags.barrels = true; g.wake('barrels', 'alert'); g.say('Громила Лупино', 'Он здесь! За бочками!', 2.4); } },
      'enter:tall'(g) {
        if (g.flags.tall) return;
        g.flags.tall = true;
        g.wake('tall', 'alert');
        g.think('Высокий зал с деревянными лестницами вдоль стен. Наверху балки, по ним можно выйти на крышу.');
        g.setThought('Подняться наверх и выйти на крышу по балкам.');
      },
      'enter:roof'(g) {
        if (g.flags.roof) return;
        g.flags.roof = true;
        g.wake('roof', 'alert');
        g.think('Крыша. Метель. Край узкий, внизу далеко. Дверь впереди ведёт к сцене.');
        g.checkpoint();
      },
      'enter:stageTop'(g) { if (!g.flags.stageTop) { g.flags.stageTop = true; g.wake('stairs', 'alert'); } },
      'enter:stageFloor'(g) { if (!g.flags.stage) { g.flags.stage = true; g.wake('stage', 'alert'); } },
      'kill:stage'(g) {
        if (g.groupAlive('stairs') > 0) return;
        g.prop('scenBtn').locked = false;
        g.setThought('Пульт сцены у правой кулисы.');
      },
      'kill:stairs'(g) { if (g.groupAlive('stage') === 0 && g.flags.stage) { g.prop('scenBtn').locked = false; g.setThought('Пульт сцены у правой кулисы.'); } },
      'use:scenBtn'(g) {
        g.show('scen', false);
        g.flags.stageDone = true;
        g.emit({ t: 'sfx', id: 'slide', pos: [62, 3, 23] });
        g.unlock('sanctum_door');
        g.openDoor('sanctum_door', 1);
        g.dialog([
          ['max:thought', 'Декорации уехали вбок. За ними дверь, а за дверью кто-то монотонно распевал.'],
          ['lupino', 'Хеймдалль трубит в рог... Слышите? Слышите, как он трубит?'],
          ['max:thought', 'Мне это не понравилось.']
        ]);
        g.setThought('Дверь за сценой.');
      },
      'enter:sanctum'(g) { g.finish(); }
    }
  });
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
