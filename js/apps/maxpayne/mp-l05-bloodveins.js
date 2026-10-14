(function (M) {
  'use strict';
  const LAMP = [1, 0.78, 0.5];
  const B0 = -4, RF = 6.25;
  const thug = (id, group, x, y, z, yaw, weapon, o) => Object.assign({ id, type: 'thug', group, pos: [x, y, z], yaw, weapon, mode: 'ambush' }, o || {});
  const mob = (id, group, x, y, z, yaw, weapon, o) => Object.assign({ id, type: 'mobster', group, pos: [x, y, z], yaw, weapon, mode: 'ambush' }, o || {});

  M.defineLevel({
    id: 'bloodveins',
    title: 'Кровавые вены Нью-Йорка',
    titleEn: 'The Blood Veins of New York',
    part: 1,
    chapter: 4,
    world: { ambient: [0.06, 0.055, 0.05], fog: { color: [0.04, 0.045, 0.055], near: 16, far: 70 }, weather: 'blizzard', sky: 'night', moon: { dir: M.norm([0.3, -0.85, 0.2]), color: [0.08, 0.09, 0.12] } },
    start: { pos: [2, B0, -2], yaw: Math.PI },
    loadout: { weapons: ['beretta', 'beretta2', 'deagle', 'pump'], ammo: { '9mm': 90, '50ae': 14, '12g': 14 }, painkillers: 2 },
    music: 'hotel',
    intro: 'bloodveins_in',
    outro: 'bloodveins_out',
    killY: -30,
    thought: 'Подвал отеля. Где-то здесь разгружают Валькирию.',
    build(B) {
      B.ground(20, -30, 100, 0, 0, 'asphalt_snow');
      B.box(20, 0, -3, 100, 0.15, 0, 'sidewalk');
      B.zone(20, -2, -30, 100, 30, 0, { outdoor: true, amb: [0.09, 0.1, 0.13] });
      B.zone(-2, -8, 0, 80, 6, 48, { outdoor: false });
      B.zone(38, 6, -1, 74, 30, 37, { outdoor: true, amb: [0.08, 0.09, 0.12] });
      B.box(20, 0, -34, 100, 16, -30, { side: 'facade_brick', top: 'roof_tar' });
      B.box(74, 0, -30, 100, 14, 0, { side: 'facade_grey', top: 'roof_tar' });
      B.box(20, 0, -30, 38, 12, 0, { side: 'facade_brown', top: 'roof_tar' });
      B.plan({
        y: 0, h: 3.15, outer: 'brick_dark',
        rooms: [
          { id: 'lift', x0: 0, z0: -4, x1: 4, z1: 0, y: B0, h: 3.75, floor: 'metal_plate', wall: 'metal_plate', ceil: 'ceiling_dark' },
          { id: 'bs1', x0: 0, z0: 0, x1: 16, z1: 12, y: B0, h: 3.75, floor: 'concrete_dark', wall: 'brick_dark', ceil: 'ceiling_dark' },
          { id: 'bs2', x0: 16, z0: 0, x1: 30, z1: 12, y: B0, h: 3.75, floor: 'concrete', wall: 'concrete_block', ceil: 'ceiling_dark' },
          { id: 'bs3', x0: 30, z0: 0, x1: 34, z1: 14, y: B0, h: 3.75, floor: 'concrete_dark', wall: 'plaster_dirty', ceil: 'ceiling_dark' },
          { id: 'stK', x0: 30, z0: 14, x1: 34, z1: 20, y: B0, h: 7.4, floor: 'concrete', wall: 'plaster_dirty', ceil: 'ceiling_dark' },
          { id: 'kit', x0: 26, z0: 20, x1: 40, z1: 32, y: 0, floor: 'kitchen_tile', wall: 'tile_white', ceil: 'ceiling_panel' },
          { id: 'hall', x0: 40, z0: 16, x1: 60, z1: 36, y: 0, h: 5, floor: 'parquet', wall: 'wallpaper_red', ceil: 'ceiling_panel' },
          { id: 'bar', x0: 40, z0: 36, x1: 60, z1: 46, y: 0, h: 3.4, floor: 'wood_floor', wall: 'wood_panel', ceil: 'ceiling_dark' },
          { id: 'ricoR', x0: 60, z0: 36, x1: 72, z1: 46, y: 0, h: 3.4, floor: 'carpet_red', wall: 'wallpaper_red', ceil: 'ceiling_panel' },
          { id: 'sb', x0: 60, z0: 16, x1: 72, z1: 28, y: 0, floor: 'linoleum', wall: 'plaster_green', ceil: 'ceiling_panel' },
          { id: 'stR', x0: 72, z0: 20, x1: 76, z1: 36, y: 0, h: 9, floor: 'concrete', wall: 'plaster_dirty', ceil: 'ceiling_dark' },
          { id: 'lobbyG', x0: 40, z0: 0, x1: 72, z1: 16, y: 0, h: 6, floor: 'marble', wall: 'wallpaper_hotel', noCeil: true }
        ],
        gaps: [{ x: 16, z: 6, w: 3 }, { x: 30, z: 6, w: 3 }],
        doors: [
          { x: 2, z: 0, w: 2.2, y: B0, h: 2.4, door: { id: 'lift_door', mat: 'metal_plate', slide: true, noPush: true, open: 1, target: 1 } },
          { x: 32, z: 14, w: 3.6, y: B0, h: 2.8 },
          { x: 32, z: 20, w: 3.6, y: 0, h: 2.6 },
          { x: 40, z: 26, w: 2.4, y: 0, door: { id: 'hall_doors', mat: 'door_wood', double: true, swing: 1 } },
          { x: 50, z: 36, w: 1.4, y: 0, door: { id: 'bar_door', mat: 'door_red', locked: true, keyFlag: 'barkey', lockMsg: 'Заперто. Нужен ключ от бара.' } },
          { x: 60, z: 41, w: 1.2, y: 0, door: { id: 'rico_door', mat: 'door_wood', swing: 1 } },
          { x: 60, z: 24, w: 1.2, y: 0, door: { id: 'sb_door', mat: 'door_metal', swing: 1 } },
          { x: 72, z: 22, w: 1.2, y: 0, door: { id: 'stR_door', mat: 'door_metal', swing: 1 } },
          { x: 72, z: 34.5, w: 1.2, y: RF, door: { id: 'roof_door', mat: 'door_metal', swing: -1 } },
          { x: 50, z: 16, w: 1.4, y: 0, door: { id: 'lobby_hall', mat: 'door_wood', locked: true, lockMsg: 'Заперто.' } },
          { x: 56, z: 0, w: 3, y: 0, h: 2.8, door: { id: 'main_doors', mat: 'door_wood', double: true, locked: true, noPush: true, lockMsg: 'Главные двери на электрозамке. Отпирать нужно с пульта.' } }
        ],
        windows: [
          { x: 66, z: 16, w: 4, y: 0, y0: 1, y1: 2.4, id: 'sb_glass' },
          { x: 46, z: 0, w: 3, y: 0, y0: 1.2, y1: 3.8 },
          { x: 66, z: 0, w: 3, y: 0, y0: 1.2, y1: 3.8 }
        ]
      });
      B.stairs(30.2, 14.2, 33.8, 19.8, B0, 0, 's', 'concrete');
      B.stairs(72.2, 22.6, 75.8, 32.6, 0, RF, 's', 'concrete');
      B.box(72, 0, 32.6, 76, RF, 36, { top: 'concrete', side: 'plaster_dirty' });
      let deck = [[40, 0, 72, 36]];
      const holes = [[47, 6, 49, 10], [55, 6, 57, 10], [63, 6, 65, 10]];
      const sub = (r, h) => {
        if (h[2] <= r[0] || h[0] >= r[2] || h[3] <= r[1] || h[1] >= r[3]) return [r];
        const out = [];
        if (h[1] > r[1]) out.push([r[0], r[1], r[2], h[1]]);
        if (h[3] < r[3]) out.push([r[0], h[3], r[2], r[3]]);
        const a = Math.max(r[1], h[1]), b = Math.min(r[3], h[3]);
        if (h[0] > r[0]) out.push([r[0], a, h[0], b]);
        if (h[2] < r[2]) out.push([h[2], a, r[2], b]);
        return out;
      };
      for (const h of holes) deck = deck.flatMap(r => sub(r, h));
      for (const r of deck) B.box(r[0], RF - 0.25, r[1], r[2], RF, r[3], { top: 'roof_tar', bottom: 'ceiling_panel', side: 'trim' });
      for (const h of holes) {
        B.box(h[0] - 0.15, RF, h[1] - 0.15, h[2] + 0.15, RF + 0.35, h[1], 'metal');
        B.box(h[0] - 0.15, RF, h[3], h[2] + 0.15, RF + 0.35, h[3] + 0.15, 'metal');
        B.box(h[0] - 0.15, RF, h[1], h[0], RF + 0.35, h[3], 'metal');
        B.box(h[2], RF, h[1], h[2] + 0.15, RF + 0.35, h[3], 'metal');
      }
      B.box(39.8, RF, 0, 40, RF + 1, 36, 'brick_dark');
      B.box(40, RF, -0.2, 72, RF + 1, 0, 'brick_dark');
      B.box(40, RF, 36, 72, RF + 1, 36.2, 'brick_dark');
      B.box(72, RF + 2.6, 32.6, 76, RF + 2.75, 36, 'ceiling_dark');
      B.box(72, RF, 0, 72.2, RF + 1, 20, 'brick_dark');
      B.light(2, B0 + 3.3, -2, [0.85, 0.9, 1], 5, { i: 0.9 });
      B.decor('boiler', 5, B0, 6, 0);
      B.decor('pipes', 11, B0 + 2.9, 6, 0, { solid: false, scale: 1.4 });
      B.decor('washer', 13.5, B0, 11.3, Math.PI); B.decor('washer', 12.5, B0, 11.3, Math.PI);
      B.light(8, B0 + 3.2, 3, [1, 0.6, 0.35], 9); B.light(8, B0 + 3.2, 10, [1, 0.8, 0.5], 7, { i: 0.7 });
      B.decor('shelf', 18, B0, 1, 0); B.decor('shelf', 22, B0, 1, 0, { seed: 5 }); B.decor('shelf', 29.5, B0, 10.5, -Math.PI / 2, { seed: 8 });
      B.decor('pallet', 24, B0, 8, 0.4); B.decor('barrel', 19, B0, 10.5, 0, { color: '#8a3a1a' });
      B.light(23, B0 + 3.2, 6, [0.9, 0.9, 0.75], 10);
      B.light(32, B0 + 3.2, 4, [1, 0.8, 0.5], 6, { i: 0.7 }); B.light(32, B0 + 3.2, 12, [1, 0.8, 0.5], 6, { i: 0.6 });
      B.light(32, 2, 17, [1, 0.9, 0.7], 6);
      B.decor('counter', 30, 0, 21.6, Math.PI); B.decor('stove', 32.2, 0, 21.55, Math.PI); B.decor('stove', 33.8, 0, 21.55, Math.PI);
      B.decor('counter', 33, 0, 26, 0); B.decor('counter', 33, 0, 27, Math.PI);
      B.decor('fridge', 39.4, 0, 31.4, -Math.PI / 2); B.decor('shelf', 27, 0, 31.5, Math.PI, { scale: 0.9 });
      B.decor('counter', 37, 0, 31.6, Math.PI);
      B.light(30, 2.9, 24, [0.9, 1, 0.95], 8); B.light(36, 2.9, 28, [0.9, 1, 0.95], 8);
      for (const [x, z] of [[45, 21], [53, 21], [45, 30], [53, 30], [49, 25.5]]) B.decor('table', x, 0, z, 0);
      B.decor('tableside', 42.6, 0, 22.4, -Math.PI / 2); B.decor('tableside', 42.4, 0, 29.6, -Math.PI / 2); B.decor('tableside', 51.6, 0, 28.4, Math.PI / 2);
      B.decor('suitcase', 45, 0.78, 21, 0.2, { solid: false }); B.decor('suitcase', 53, 0.78, 30, -0.4, { solid: false }); B.decor('moneypile', 49, 0.78, 25.5, 0.6, { solid: false });
      B.decor('piano', 58.8, 0, 34, -Math.PI / 2);
      B.light(46, 4.6, 22, LAMP, 11); B.light(54, 4.6, 30, LAMP, 11); B.light(50, 4.6, 26, [1, 0.9, 0.7], 9);
      B.decor('bar', 50, 0, 44.6, Math.PI);
      B.decor('table', 44, 0, 39.5, 0.3); B.decor('table', 56, 0, 39.5, -0.3);
      B.decor('chair', 43, 0, 39, 1); B.decor('chair', 57, 0, 38.8, -1);
      B.light(45, 3.1, 41, [1, 0.35, 0.5], 8); B.light(55, 3.1, 41, [1, 0.35, 0.5], 8); B.light(50, 3.1, 45, [1, 0.8, 0.4], 6);
      B.decal(50, 2.6, 45.88, 'nz', 3, 0.75, 'neon_bar', { emissive: true });
      B.decor('bed', 69, 0, 43.5, Math.PI / 2, { sheet: '#5a1a3a' });
      B.decor('sofa', 64, 0, 44.9, Math.PI, { mat: 'fabric_red' });
      B.decor('desk', 70.8, 0, 38.5, -Math.PI / 2);
      B.decor('coatrack', 61, 0, 45.3, 0);
      B.light(66, 3.1, 41, [1, 0.4, 0.8], 9);
      B.decor('console', 66, 0, 17.2, 0);
      B.decor('desk', 70.8, 0, 22, -Math.PI / 2); B.decor('lockers', 61, 0, 20, Math.PI / 2);
      B.light(66, 2.9, 22, [0.9, 1, 0.9], 9, { i: 1.2 }); B.light(63, 2.9, 26, [0.9, 1, 0.9], 7, { i: 0.8 });
      B.light(74, 4, 27, [0.9, 0.9, 0.8], 7); B.light(74, RF + 2.3, 34, [0.9, 0.9, 0.8], 5);
      B.decor('counter', 64, 0, 12.4, 0); B.decor('counter', 66, 0, 12.4, 0);
      B.decor('sofa', 46, 0, 9, Math.PI / 2, { mat: 'fabric_red' }); B.decor('armchair', 46.4, 0, 5, Math.PI / 2 + 0.4);
      B.decor('statue', 56, 0, 9, Math.PI);
      B.decor('coatrack', 70.8, 0, 2, 0);
      B.light(48, 5.4, 4, LAMP, 11); B.light(64, 5.4, 4, LAMP, 11); B.light(56, 5.4, 12, [1, 0.9, 0.7], 10);
      B.decal(64.5, 2.6, 13.3, 'nz', 2.6, 0.5, 'sign:РЕГИСТРАЦИЯ');
      B.decal(40.12, 3, 8, 'px', 1.4, 1.1, 'painting');
      B.decal(71.88, 3, 8, 'nx', 1.4, 1.1, 'painting');
      B.decor('streetlight', 50, 0, -2.6, 0); B.decor('streetlight', 64, 0, -2.6, 0);
      B.light(50, 4.5, -3.5, [1, 0.72, 0.45], 14); B.light(64, 4.5, -3.5, [1, 0.72, 0.45], 14);
      B.light(56, RF + 3, 18, [0.6, 0.65, 0.8], 14, { i: 0.6 });
      B.decor('car', 44, 0, -7, Math.PI / 2, { color: '#1a1a2a' });
      B.decal(10, B0 + 2.2, 11.88, 'nz', 1.2, 0.9, 'graffiti2');
      B.decal(33.88, B0 + 1.4, 11, 'nx', 1, 1, 'blood_wall');
    },
    props: [
      { kind: 'crate', id: 'block1', pos: [30.8, B0, 9], size: [1.3, 1.6, 1.3], hp: 30 },
      { kind: 'crate', id: 'block2', pos: [32.1, B0, 9], size: [1.3, 1.6, 1.3], hp: 30 },
      { kind: 'crate', id: 'block3', pos: [33.3, B0, 9], size: [1.3, 1.6, 1.3], hp: 30 },
      { kind: 'crate', id: 'block4', pos: [32.1, B0 + 1.6, 9], size: [1.2, 1.2, 1.2], hp: 30 },
      { kind: 'cyl', id: 'cylA', pos: [20.5, B0, 3.2] },
      { kind: 'cyl', id: 'cylB', pos: [21.1, B0, 3.9] },
      { kind: 'cyl', id: 'cylC', pos: [26.5, B0, 9.8] },
      { kind: 'note', id: 'newspaper', pos: [32.4, B0 + 0.02, 12.4], title: 'Газета «Нью-Йорк Дейли», страница комиксов', text: 'КАПИТАН БЕЙСБОЛЬНАЯ БИТА\n\nКапитан: Никто не смеет грабить моих соседей!\nЗлодей: А кто сказал, что они твои соседи?\nКапитан: Бейсбольная бита говорит!\n\nНа полях кто-то нарисовал шариковой ручкой виселицу и написал: «Пейн».' },
      { kind: 'note', id: 'punch_letter', pos: [70.8, 0.8, 38.6], title: 'Письмо на бланке ресторана «Пунчинелло»', text: 'Рико,\nбольше никакого товара через отель без моего слова. Джек перестал слушать, и я знаю почему. Валькирия дорогая игрушка, и не наша, но деньги мы с неё берём. Значит, держи рот на замке и девочек подальше от подвала.\nА.П.' },
      { kind: 'button', id: 'sb_panel', pos: [66, 1.2, 16.6], yaw: 0, label: 'Пульт дверей', locked: true, lockMsg: 'Пульт отпирает главные двери, но работает только с дежурного места в вестибюле.' },
      { kind: 'button', id: 'exit_btn', pos: [65, 1.2, 12.1], yaw: Math.PI, label: 'Кнопка «ВЫХОД»', once: true, color: 'green' },
      { kind: 'glass', id: 'sky1', pos: [48, RF - 0.12, 8], axis: 'y', w: 2, d: 4, h: 0.04 },
      { kind: 'glass', id: 'sky2', pos: [56, RF - 0.12, 8], axis: 'y', w: 2, d: 4, h: 0.04 },
      { kind: 'glass', id: 'sky3', pos: [64, RF - 0.12, 8], axis: 'y', w: 2, d: 4, h: 0.04 }
    ],
    items: [
      { kind: 'weapon', weapon: 'bat', pos: [25, B0, 11.2] },
      { kind: 'painkillers', amount: 1, pos: [18, B0 + 1.06, 1] },
      { kind: 'ammo', ammo: '12g', amount: 8, pos: [13, B0, 1.5] },
      { kind: 'weapon', weapon: 'molotov', amount: 3, pos: [27, 0.58, 31.5] },
      { kind: 'painkillers', amount: 1, pos: [37, 0.95, 31.6] },
      { id: 'barkey', kind: 'key', flag: 'barkey', name: 'Ключ от бара', pos: [53, 0.8, 21] },
      { kind: 'ammo', ammo: '9mm', amount: 36, pos: [45, 0.8, 30] },
      { kind: 'painkillers', amount: 2, pos: [50, 1.12, 44.6] },
      { kind: 'ammo', ammo: '50ae', amount: 7, pos: [70.8, 0.8, 22] },
      { kind: 'painkillers', amount: 1, pos: [74, RF, 35] }
    ],
    chars: [
      thug('k1', 'bs1', 10, B0, 4, Math.PI, 'pump', { hidden: true }),
      thug('k2', 'bs1', 13, B0, 9, Math.PI * 0.8, 'pump', { hidden: true }),
      mob('s1', 'bs2', 21.5, B0, 5.2, Math.PI / 2, 'beretta'),
      thug('s2', 'bs2', 23, B0, 2.2, Math.PI / 2, 'beretta'),
      thug('s3', 'bs2', 27, B0, 8.4, Math.PI / 2, 'ingram'),
      { id: 'deadman', type: 'thug', pos: [31.4, B0, 12.9], yaw: 2.2, dead: true, deadPose: 'front', weapon: null, noDrop: true },
      thug('c1', 'kit', 30.5, 0, 25, Math.PI, 'beretta'),
      mob('c2', 'kit', 36, 0, 29.5, Math.PI * 0.7, 'beretta'),
      thug('c3', 'kit', 37.2, 0, 23.4, Math.PI / 2, 'sawed', { accMul: 1.2, hp: 120 }),
      mob('h1', 'hall', 45.5, 0, 26, -Math.PI / 2, 'ingram', { mode: 'hold', blind: true, holdFire: true, deaf: true }),
      thug('h2', 'hall', 47, 0, 24.3, -Math.PI / 2, 'beretta', { mode: 'hold', blind: true, holdFire: true, deaf: true }),
      thug('h3', 'hall', 46.8, 0, 27.8, -Math.PI / 2, 'pump', { mode: 'hold', blind: true, holdFire: true, deaf: true }),
      mob('h4', 'hall', 55, 0, 33, -Math.PI * 0.7, 'beretta', { gren: 1 }),
      { id: 'hooker', type: 'hooker', group: 'bar', pos: [50, 0, 42.5], yaw: 0, weapon: 'beretta2', mode: 'ambush', hp: 130, drop: { kind: 'painkillers', amount: 1 } },
      thug('bt1', 'bar', 42.5, 0, 44, 0.4, 'beretta'),
      { id: 'rico', type: 'rico', group: 'rico', pos: [66, 0, 42], yaw: Math.PI / 2, weapon: 'ingram', mode: 'ambush', leash: 14, hunter: true, gren: 1 },
      mob('rg1', 'rico', 63, 0, 38.5, Math.PI / 2, 'beretta', { hidden: true, hunter: true }),
      mob('rg2', 'rico', 69, 0, 40, Math.PI / 2, 'pump', { hidden: true, hunter: true }),
      thug('sb1', 'sb', 66, 0, 24, Math.PI / 2, 'beretta'),
      mob('sb2', 'sb', 69.5, 0, 19, Math.PI / 2, 'ingram'),
      thug('rf1', 'roof', 52, RF, 20, Math.PI * 0.7, 'beretta'),
      mob('rf2', 'roof', 60, RF, 30, Math.PI * 0.8, 'pump'),
      mob('lb1', 'lobby', 48, 0, 12, 0, 'beretta', { hidden: true, hunter: true }),
      thug('lb2', 'lobby', 62, 0, 4, 0, 'pump', { hidden: true, hunter: true }),
      mob('lb3', 'lobby', 68, 0, 9, 0, 'ingram', { hidden: true, hunter: true }),
      thug('lb4', 'lobby', 54, 0, 3, 0, 'beretta', { hidden: true, hunter: true, gren: 1 })
    ],
    triggers: [
      { id: 'bs1', min: [0, B0, 0], max: [4, B0 + 2.5, 3] },
      { id: 'crates', min: [30, B0, 5], max: [34, B0 + 2.5, 8] },
      { id: 'kit', min: [30, 0, 20], max: [34, 2.5, 23] },
      { id: 'hallDoor', min: [37, 0, 24], max: [40, 2.5, 28] },
      { id: 'bar', min: [45, 0, 36.5], max: [55, 2.5, 40] },
      { id: 'sb', min: [60.5, 0, 22], max: [64, 2.5, 26] },
      { id: 'roof', min: [66, RF, 30], max: [72, RF + 2.5, 36] },
      { id: 'lobbyDrop', min: [40, 0, 0], max: [72, 3, 16] },
      { id: 'out', min: [52, 0, -5], max: [60, 3, -1] }
    ],
    on: {
      start(g) {
        g.dialog([
          ['max:thought', 'Лифт спустил меня в подвал. Трубы, пар, запах сырой штукатурки.'],
          ['max:thought', 'Валькирия течёт по этому городу, как грязь по водостоку. Все знают, где у него вены, и никто не зовёт врача.']
        ]);
        g.later(1.5, 'bs1Wake');
        g.setThought('Пройти через подвал отеля.');
      },
      bs1Wake(g) { g.wake('bs1', 'alert'); },
      'enter:crates'(g) {
        if (g.flags.cratesSeen) return;
        g.flags.cratesSeen = true;
        if (!g.player.weapons.bat) g.think('Проход завален ящиками. Бита у стеллажа в прошлой комнате пришлась бы кстати.');
        else g.think('Проход завален ящиками. Для этого у меня есть бита.');
        g.hint('1: оружие ближнего боя. Ящики ломаются от ударов и выстрелов.', 6);
      },
      'read:newspaper'(g) { g.think('На полях кто-то нарисовал виселицу и подписал: «Пейн». Весь город уже знает моё имя.'); },
      'enter:kit'(g) { g.alert('kit'); },
      'kill:kit'(g) { g.think('За двойными дверями спорят. Коктейли Молотова на полке пригодятся.'); g.setThought('Банкетный зал за двойными дверями.'); },
      'enter:hallDoor'(g) {
        if (g.flags.argue) return;
        g.flags.argue = true;
        g.dialog([
          ['Мафиози', 'Лупино сказал, половину Рико. Это не половина, это треть.'],
          ['Бандит', 'Считай сам, раз такой умный. Я считаю, как умею.'],
          ['Бандит', 'А мне кто заплатит за то, что я неделю сижу в этой дыре?'],
          ['Мафиози', 'Тише вы. Мне показалось, на кухне стреляли.']
        ], 'hallWake');
      },
      hallWake(g) {
        for (const id of ['h1', 'h2', 'h3']) { const c = g.char(id); if (c && c.state === 'alive') { c.blind = false; c.holdFire = false; c.ai.deaf = false; c.ai.mode = 'combat'; } }
        g.alert('hall');
      },
      'kill:hall'(g) { g.setThought('Ключ от бара где-то на столах.'); g.checkpoint(); },
      'pick:barkey'(g) { g.think('Ключ с биркой «Бар». Рико держит там своих девочек.'); g.setThought('Бар за северной дверью банкетного зала.'); },
      'open:bar_door'(g) { g.alert('bar'); },
      'dead:hooker'(g) { g.later(0.8, 'ricoWake'); },
      ricoWake(g) {
        g.wake('rico', 'alert');
        g.alert('rico');
        g.dialog([
          ['rico', 'Сладкий, ты пришёл не в тот квартал. Это территория Рико Муэрте.'],
          ['max', 'Рико. Я как раз хотел поговорить про груз в подвале.'],
          ['rico', 'Со мной разговаривают деньгами, коп. Или свинцом.']
        ]);
        g.music('tension');
      },
      'kill:rico'(g) {
        g.dialog([['max:thought', 'Рико Муэрте. Громкое имя, мелкая душа.'], ['max:thought', 'У него на столе письмо на ресторанном бланке.']]);
        g.setThought('Письмо на столе Рико. Потом выбраться из отеля.');
        g.checkpoint();
      },
      'read:punch_letter'(g) {
        g.think('Анджело Пунчинелло. Дон знает про Валькирию и берёт с неё деньги. Лупино уже никого не слушает.');
        g.setThought('Главные двери отеля. Пульт в диспетчерской у холла.');
      },
      'enter:sb'(g) { g.alert('sb'); },
      'locked:sb_panel'(g) {
        if (g.flags.panelSeen) return;
        g.flags.panelSeen = true;
        g.think('Пульт работает только с дежурного места в вестибюле. Двери в вестибюль заперты. Через стекло видно стеклянную крышу.');
        g.setThought('Попасть в вестибюль через световые окна на крыше.');
      },
      'enter:roof'(g) { g.alert('roof'); g.think('Крыша. Метель. Световые окна над вестибюлем.'); },
      'break:sky1'(g) { g.fireEvent('skyBroken'); },
      'break:sky2'(g) { g.fireEvent('skyBroken'); },
      'break:sky3'(g) { g.fireEvent('skyBroken'); },
      skyBroken(g) { if (g.flags.lobbyWoke) return; g.flags.lobbyWoke = true; g.wake('lobby', 'alert'); },
      'enter:lobbyDrop'(g) {
        if (!g.flags.lobbyWoke) { g.flags.lobbyWoke = true; g.wake('lobby', 'alert'); }
        g.setThought('Кнопка «ВЫХОД» за стойкой регистрации.');
      },
      'use:exit_btn'(g) {
        g.unlock('main_doors');
        g.openDoor('main_doors', -1);
        g.think('Замки щёлкнули. Снаружи метель, и где-то в ней ждёт следующая глава этой истории.');
      },
      'enter:out'(g) { g.finish(); }
    }
  });
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
