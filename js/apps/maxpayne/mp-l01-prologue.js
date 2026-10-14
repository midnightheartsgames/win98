(function (M) {
  'use strict';
  const WARM = [1, 0.8, 0.55];
  const junkie = (id, group, x, y, z, yaw, weapon, o) => Object.assign({ id, type: 'junkie', group, pos: [x, y, z], yaw, weapon, hidden: true, leash: 9 }, o || {});

  M.defineLevel({
    id: 'prologue',
    title: 'Пролог',
    titleEn: 'Prologue',
    part: 1,
    chapter: 0,
    world: { ambient: [0.05, 0.055, 0.075], fog: { color: [0.03, 0.035, 0.05], near: 18, far: 70 }, weather: 'rain', sky: 'summer', moon: { dir: M.norm([0.35, -0.8, 0.45]), color: [0.12, 0.14, 0.22] } },
    start: { pos: [3.2, 0, -6.5], yaw: Math.PI },
    loadout: { reset: true, weapons: ['beretta'], ammo: { '9mm': 54 }, painkillers: 0 },
    music: 'prologue',
    intro: 'prologue_in',
    outro: 'prologue_out',
    killY: -20,
    thought: 'Домой. Мишель и малышка ждут.',
    build(B) {
      B.ground(-30, -20, 44, 40, 0, 'grass');
      B.box(-30, -0.02, -14, 44, 0.02, -5, 'asphalt');
      B.box(-30, 0, -5, 44, 0.12, -3.2, 'sidewalk');
      B.box(6.2, 0, -3.2, 7.8, 0.06, 6, 'sidewalk');
      B.box(8.6, 0, -5, 11.8, 0.03, 6, 'asphalt');
      B.zone(-30, -1, -20, 44, 30, 40, { outdoor: true, amb: [0.06, 0.07, 0.1] });
      B.zone(0, -1, 6, 14, 6, 18, { outdoor: false, amb: [0.05, 0.045, 0.045] });
      B.zone(4, -1, 4.2, 10, 2.8, 6, { outdoor: false, amb: [0.06, 0.06, 0.07] });
      const ground = B.plan({
        y: 0, h: 2.7, outer: 'siding',
        rooms: [
          { id: 'hall', x0: 5, z0: 6, x1: 9, z1: 18, floor: 'wood_floor', wall: 'wallpaper_home', noCeil: true },
          { id: 'living', x0: 0, z0: 6, x1: 5, z1: 13, floor: 'carpet_blue', wall: 'wallpaper_home', noCeil: true },
          { id: 'den', x0: 0, z0: 13, x1: 5, z1: 18, floor: 'wood_floor', wall: 'wallpaper_green', noCeil: true },
          { id: 'kitchen', x0: 9, z0: 6, x1: 14, z1: 12, floor: 'kitchen_tile', wall: 'plaster', noCeil: true },
          { id: 'dining', x0: 9, z0: 12, x1: 14, z1: 18, floor: 'parquet', wall: 'wallpaper_home', noCeil: true }
        ],
        doors: [
          { x: 7, z: 6, w: 1.2, door: { id: 'front', open: 1, target: 1, swing: 1, mat: 'door_wood' } },
          { x: 5, z: 16, w: 1.0, door: { id: 'den_door', mat: 'door_wood' } }
        ],
        gaps: [{ x: 5, z: 9, w: 2.2 }, { x: 9, z: 8.8, w: 1.6 }, { x: 9, z: 15, w: 2.2 }, { x: 11.5, z: 12, w: 2.2 }],
        windows: [{ x: 2.5, z: 6, w: 1.6, y0: 0.9, y1: 2.1 }, { x: 11.5, z: 6, w: 1.4, y0: 1.0, y1: 2.0 }, { x: 0, z: 15.5, w: 1.4, y0: 0.9, y1: 2.1 }, { x: 14, z: 15, w: 1.6, y0: 0.9, y1: 2.1 }]
      });
      const up = B.plan({
        y: 2.95, h: 2.6, outer: 'siding',
        rooms: [
          { id: 'uhall', roof: 'shingle', x0: 5, z0: 6, x1: 9, z1: 18, floor: 'wood_floor', wall: 'wallpaper_home', under: 'plaster', holes: [[7.6, 11, 8.8, 15.5]] },
          { id: 'bed', roof: 'shingle', x0: 0, z0: 6, x1: 5, z1: 13, floor: 'carpet_red', wall: 'wallpaper_home', under: 'plaster' },
          { id: 'bath', roof: 'shingle', x0: 0, z0: 13, x1: 5, z1: 18, floor: 'bath_tile', wall: 'bath_tile', under: 'plaster' },
          { id: 'guest', roof: 'shingle', x0: 9, z0: 6, x1: 14, z1: 11, floor: 'wood_floor', wall: 'wallpaper_green', under: 'plaster' },
          { id: 'nursery', roof: 'shingle', x0: 9, z0: 11, x1: 14, z1: 18, floor: 'carpet_blue', wall: 'wallpaper_nursery', under: 'plaster' }
        ],
        doors: [
          { x: 5, z: 9.5, w: 1.0, door: { id: 'bed_door', mat: 'door_wood', swing: -1 } },
          { x: 5, z: 16, w: 1.0, door: { id: 'bath_door', mat: 'door_wood', swing: -1 } },
          { x: 9, z: 8.5, w: 1.0, door: { id: 'guest_door', mat: 'door_wood' } },
          { x: 9, z: 16.8, w: 1.0, door: { id: 'nursery_door', mat: 'door_wood' } }
        ],
        windows: [{ x: 2.5, z: 6, w: 1.6, y0: 0.9, y1: 2.0 }, { x: 11.5, z: 6, w: 1.4, y0: 0.9, y1: 2.0 }, { x: 14, z: 14.5, w: 1.4, y0: 0.9, y1: 2.0 }, { x: 0, z: 10, w: 1.4, y0: 0.9, y1: 2.0 }]
      });
      B.stairs(7.6, 11, 8.8, 15.5, 0, 2.95, 's', 'wood_floor');
      B.box(7.45, 2.95, 11, 7.6, 3.95, 15.5, 'wood_trim');
      B.box(7.6, 2.95, 10.85, 8.8, 3.95, 11, 'wood_trim');
      B.box(4, 2.7, 4.2, 10, 2.85, 6, { top: 'shingle', side: 'wood_trim', bottom: 'wood_trim' });
      B.pillar(4.2, 4.3, 0.18, 0, 2.7, 'wood_trim');
      B.pillar(9.8, 4.3, 0.18, 0, 2.7, 'wood_trim');
      B.box(4, 0, 4.2, 10, 0.12, 6, 'wood_floor');
      for (const hx of [-18, 24]) {
        B.box(hx, 0, 6, hx + 12, 5.5, 18, { side: 'siding', top: 'shingle' });
        B.decal(hx + 3, 1.6, 5.99, 'nz', 1.4, 1.1, 'window_night');
        B.decal(hx + 9, 1.6, 5.99, 'nz', 1.4, 1.1, 'window_night');
        B.decal(hx + 6, 4.1, 5.99, 'nz', 1.4, 1.0, 'window_night');
      }
      B.box(-30, 0, 30, 44, 6, 32, { side: 'siding', top: 'shingle' });
      B.decor('car', 3.4, 0, -9.2, Math.PI / 2, { color: '#4a3020' });
      B.decor('car', -12, 0, -11.5, -Math.PI / 2, { color: '#2a3a4a' });
      B.decor('streetlight', -6, 0, -4.4, 0);
      B.decor('streetlight', 18, 0, -4.4, 0);
      B.light(-6, 4.5, -5.3, [1, 0.75, 0.45], 14, { i: 1.1 });
      B.light(18, 4.5, -5.3, [1, 0.75, 0.45], 14, { i: 1.1 });
      B.light(7, 2.5, 5.2, [1, 0.8, 0.55], 7, { i: 1.2 });
      B.decor('trash', 10.5, 0, 3.5, 0);
      B.decor('sofa', 2.5, 0, 12.2, Math.PI, { mat: 'fabric_green' });
      B.decor('armchair', 0.9, 0, 8.5, Math.PI / 2 + 0.4);
      B.decor('tvstand', 2.4, 0, 6.5, 0);
      B.decor('table', 2.4, 0, 9.6, 0.35);
      B.decor('chair', 3.6, 0, 7.5, 1.9);
      B.light(1.2, 2.3, 11, [1, 0.72, 0.45], 7, { i: 0.9 });
      B.decal(5.12, 1.5, 11.5, 'px', 1.4, 1.2, 'graffiti_v');
      B.decal(5.12, 1.2, 13.6, 'px', 0.9, 1.1, 'blood_wall');
      B.decal(8.88, 1.6, 10, 'nx', 0.5, 0.7, 'photo');
      B.decal(7.2, 0.01, 9.4, 'py', 1.8, 0.6, 'blood_trail', { rot: 1.2 });
      B.decal(0.12, 1.6, 15.5, 'px', 1.0, 0.8, 'painting');
      B.light(7, 2.5, 8, [1, 0.85, 0.65], 6, { i: 0.8 });
      B.decor('fridge', 13.5, 0, 6.5, Math.PI);
      B.decor('stove', 12.3, 0, 6.45, Math.PI);
      B.decor('counter', 10.4, 0, 6.4, Math.PI);
      B.decor('table', 11.5, 0, 15, 0);
      B.decor('chair', 10.7, 0, 15, Math.PI / 2);
      B.decor('chair', 12.3, 0, 15.3, -Math.PI / 2 + 0.8);
      B.light(11.5, 2.5, 9, [1, 0.92, 0.8], 7);
      B.light(11.5, 2.5, 15, [1, 0.8, 0.6], 6, { i: 0.7 });
      B.decor('shelf', 0.35, 0, 16, Math.PI / 2, { scale: 0.9 });
      B.decor('desk', 2.5, 0, 17.4, Math.PI);
      B.light(3, 2.3, 16, [1, 0.8, 0.5], 5, { i: 0.6 });
      B.light(7, 5.3, 8, [1, 0.85, 0.65], 7, { i: 0.8 });
      B.light(7, 5.3, 16.5, [1, 0.85, 0.65], 6, { i: 0.7 });
      B.decor('bed', 2.2, 2.95, 9.6, Math.PI / 2, { sheet: '#c8b8b0' });
      B.decor('tvstand', 0.4, 2.95, 12.4, Math.PI / 2);
      B.light(0.7, 3.9, 7.2, [1, 0.55, 0.4], 6, { i: 0.9 });
      B.decor('bathtub', 0.5, 2.95, 15.8, 0);
      B.decor('toilet', 4.2, 2.95, 17.6, Math.PI);
      B.decor('sink', 2.5, 2.95, 17.7, Math.PI);
      B.light(2.5, 5.3, 15.5, [0.9, 0.95, 1], 5, { i: 0.7 });
      B.decor('crib', 12.5, 2.95, 16.8, Math.PI / 2);
      B.decor('armchair', 10, 2.95, 12, 2.4);
      B.decor('shelf', 13.6, 2.95, 12.5, -Math.PI / 2, { scale: 0.6, seed: 9 });
      B.light(12.8, 3.4, 13.5, [0.6, 0.7, 1.0], 5, { i: 0.7 });
      B.decal(13.1, 1.35, 6.87, 'pz', 0.22, 0.28, 'note');
      B.decor('bed', 12.5, 2.95, 8.5, 0);
      B.light(11.5, 5.2, 8.5, [1, 0.85, 0.6], 5, { i: 0.5 });
    },
    props: [
      { kind: 'locker', id: 'med_cab', pos: [0.45, 2.95 + 1.2, 13.5], yaw: Math.PI / 2, w: 0.6, h: 0.6, d: 0.2, label: 'Открыть аптечку' },
      { kind: 'tv', id: 'tv_living', pos: [2.4, 0.5, 6.5], yaw: 0, show: 'news98', on: true },
      { kind: 'phone', id: 'phone_kitchen', pos: [9.12, 1.5, 7.3], yaw: -Math.PI / 2 },
      { kind: 'note', id: 'note_fridge', pos: [13.1, 1.3, 6.9], title: 'Записка на холодильнике', text: 'Макс!\nКупи молока и подгузники, если будешь ехать мимо. Малышка сегодня весь день улыбается.\nЦелую. М.', noModel: true }
    ],
    items: [
      { kind: 'painkillers', amount: 2, pos: [0.5, 4.2, 13.5], in: 'med_cab' },
      { kind: 'ammo', ammo: '9mm', amount: 18, pos: [10.6, 0.95, 6.4] },
      { kind: 'painkillers', amount: 1, pos: [3.1, 0.8, 17.3] }
    ],
    chars: [
      junkie('j1', 'down', 8.2, 2.95, 16.6, 0, 'beretta'),
      junkie('j2', 'down', 12, 0, 9.5, Math.PI / 2, 'bat', { melee: true, meleeDmg: 18 }),
      junkie('j3', 'up', 7.2, 2.95, 17, Math.PI, 'beretta'),
      junkie('j4', 'up', 6.2, 2.95, 12.5, Math.PI, 'beretta', { gren: 0 }),
      junkie('j5', 'bed', 3.5, 2.95, 11.8, -Math.PI / 2, 'pump', { hp: 70, drop: { kind: 'painkillers', amount: 1 } }),
      { id: 'michelle', type: 'michelle', pos: [2.1, 3.55, 9.6], yaw: Math.PI / 2, pose: 'lie', mode: 'prop', static: true, invuln: true, noHit: true, weapon: null }
    ],
    triggers: [
      { id: 'yard', min: [2, 0, -3], max: [12, 3, 2] },
      { id: 'porch', min: [4, 0, 3.5], max: [10, 3, 6] },
      { id: 'hall', min: [5.5, 0, 6.2], max: [8.5, 2.5, 9] },
      { id: 'living', min: [0.5, 0, 6.5], max: [4.5, 2.5, 12.5] },
      { id: 'stairs', min: [7.6, 0.5, 12.5], max: [8.8, 2.9, 15.5] },
      { id: 'upstairs', min: [7.5, 2.9, 15.5], max: [8.9, 5, 18] },
      { id: 'nursery', roof: 'shingle', min: [10.5, 2.9, 12], max: [13.5, 5, 17.5] },
      { id: 'bedroom', min: [0.5, 2.9, 6.5], max: [4.8, 5, 12.8] }
    ],
    on: {
      start(g) {
        g.later(4, 'thunder');
        g.think('Лето девяносто восьмого. Я освободился раньше и ехал домой с дурацкой улыбкой.', 5);
        g.hint('Идите к дому. Двери открываются, если в них войти.', 6);
      },
      thunder(g) {
        g.emit({ t: 'thunder' });
        g.later(7 + g.rng.next() * 9, 'thunder');
      },
      'enter:yard'(g) { g.think('В доме горел свет. Весь, даже в гостиной, где мы его никогда не включали.'); },
      'enter:porch'(g) {
        g.think('Входная дверь стояла нараспашку. Мишель запирала её, даже когда выносила мусор.');
        g.setThought('Дверь открыта. Найти Мишель.');
      },
      'enter:hall'(g) {
        g.emit({ t: 'sfx', id: 'scream', pos: [2, 4, 9] });
        g.later(1.2, 'baby');
        g.wake('down', 'alert');
        g.think('Крик наверху. Это Мишель.');
        g.music('tension');
        g.setThought('Мишель кричит наверху.');
      },
      baby(g) { g.emit({ t: 'sfx', id: 'baby', pos: [12, 4, 15] }); if (!g.flags.nurserySeen) g.later(2.5, 'baby'); },
      'enter:living'(g) { g.think('На стене намалёвана буква V, перечёркнутая шприцем.'); },
      'kill:down'(g) {
        g.think('Их глаза. Пустые, как у манекенов в витрине. Наверх, быстро.');
        g.setThought('Наверх, к Мишель и малышке.');
      },
      'enter:stairs'(g) { if (!g.flags.upWoke) { g.flags.upWoke = true; g.wake('up', 'alert'); } },
      'enter:upstairs'(g) { if (!g.flags.upWoke) { g.flags.upWoke = true; g.wake('up', 'alert'); } },
      'kill:up'(g) {
        g.flags.nurserySeen = true;
        g.think('Малышка больше не плакала. В доме стало очень тихо.');
        g.setThought('Детская в конце коридора.');
      },
      'enter:nursery'(g) {
        g.flags.nurserySeen = true;
        g.dialog([
          ['max:thought', 'Я подошёл к кроватке.'],
          ['max:thought', 'Потом я очень долго не мог вспомнить, что было дальше. Помню только обои со звёздами.']
        ], 'nurseryDone');
      },
      nurseryDone(g) {
        g.wake('bed', 'alert');
        g.emit({ t: 'sfx', id: 'doorclose', pos: [4, 4, 9] });
        g.setThought('Спальня. Мишель.');
      },
      'enter:bedroom'(g) {
        if (!g.flags.bedWoke) { g.flags.bedWoke = true; g.wake('bed', 'alert'); }
      },
      'kill:bed'(g) { g.later(1.2, 'ending'); },
      ending(g) {
        g.dialog([['max:thought', 'Мишель.']], 'finishPrologue');
      },
      finishPrologue(g) { g.finish(); }
    }
  });
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
