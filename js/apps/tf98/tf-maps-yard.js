(function (T) {
  'use strict';
  const X0 = -60, X1 = 60, Z0 = -48, Z1 = 48;
  const EAST = Math.PI / 2, WEST = -Math.PI / 2, NORTH = 0, SOUTH = Math.PI;

  const HEIGHTS = [
    [0.3, 'ступень 0,30'],
    [0.35, 'шаг 0,35'],
    [0.5, '0,50: нужен прыжок'],
    [0.9, 'прыжок 0,90'],
    [1.0, '1,00: прыжка мало'],
    [1.3, 'с приседанием 1,30'],
    [1.45, '1,45: приседания мало'],
    [1.9, 'двойной 1,90'],
    [2.3, 'двойной + присед 2,30'],
    [2.5, '2,50: только взрыв']
  ];
  const PITS = [[-50, 2], [-41, 3], [-32, 4], [-22, 5]];
  const PIT_Z0 = -22, PIT_Z1 = -8, PIT_DEPTH = 0.9;
  const POOL = { x0: 6, z0: -18, x1: 30, z1: 2, floor: -3.25, surface: -0.25, shelfZ: -4, shelfY: -0.45 };
  const TOWERS = [[-22, 3], [-14, 5], [-6, 7], [10, 10]];
  const TOWER_Z0 = 2, TOWER_Z1 = 7, TOWER_W = 5;
  const WALL_Z = 14;
  const ROOFS = [[-50, 4], [-40, 6], [-30, 7], [-20, 10], [-10, 11.5]];
  const FIRE_LINE = { x: 4, z: 36 };
  const TARGETS = [5, 10, 20, 40];
  const SUPPLIES = { x: 6, z: 45, step: 3.5 };
  const STANDING = [['hydrant', 'cold', 50, 2], ['titan', 'cold', 50, 6], ['hydrant', 'hot', 56, -6], ['titan', 'hot', 56, -2]];

  function lane(B) {
    B.box(-58, 0, -46, 58, 0.012, -38, 'plate', { col: false, grid: false });
    for (let i = 0; i <= 11; i++) {
      const x = -55 + i * 10;
      B.box(x - 0.08, 0, -46, x + 0.08, 0.02, -38, 'mark', { col: false, grid: false });
      B.label(x, 0.4, -45, (i * 10) + ' м');
    }
    B.label(-50, 2.2, -42, '1. Дорожка. Отметки через 10 м, Снайперу линия 40–60 м');
  }

  function heights(B) {
    HEIGHTS.forEach(([h, text], i) => {
      const x = -54 + i * 6;
      B.box(x - 2, 0, -34, x + 2, h, -28, 'block');
      B.label(x, h + 0.5, -35, text);
    });
    B.label(-26, 3.6, -34, '2. Высоты. Подходите с юга');
  }

  function stairs(B) {
    B.box(28, 0, -34, 40, 3, -22, 'block');
    B.stairs(18, -34, 28, -22, 0, 3, 'x+', 'plate');
    B.ramp(40, -34, 45.2, -22, 0, 3, 'x-', 'plate');
    B.label(23, 2.6, -28, '3. Лестница: ступень 0,30');
    B.label(43, 2.6, -28, 'Скат 30°');
  }

  function pits(B) {
    for (const [x, len] of PITS) {
      B.floor(x, PIT_Z0, x + len, PIT_Z1, -PIT_DEPTH, 'plate', { t: 0.2 });
      B.label(x + len / 2, 0.7, PIT_Z0 + 2, 'яма ' + len + ' м');
    }
    B.label(-54, 2.2, -15, '4. Ямы. Разбег на восток, выход прыжком');
  }

  function pool(B) {
    const p = POOL;
    B.box(p.x0 - 0.5, p.floor - 0.25, p.z0 - 0.5, p.x0, -1, p.z1 + 0.5, 'wall');
    B.box(p.x1, p.floor - 0.25, p.z0 - 0.5, p.x1 + 0.5, -1, p.z1 + 0.5, 'wall');
    B.box(p.x0, p.floor - 0.25, p.z0 - 0.5, p.x1, -1, p.z0, 'wall');
    B.box(p.x0, p.floor - 0.25, p.z1, p.x1, -1, p.z1 + 0.5, 'wall');
    B.floor(p.x0, p.z0, p.x1, p.z1, p.floor, 'plate', { t: 0.25 });
    B.box(p.x0, p.floor, p.shelfZ, p.x1, p.shelfY, p.z1, 'plate');
    B.ramp(22, p.z0, p.x1, -12, p.floor, 0, 'x+', 'plate', { base: p.floor });
    B.water(p.x0, p.z0, p.x1, p.z1, p.floor, p.surface);
    B.label(18, 1.4, -11, '5. Бассейн: 3 м глубины');
    B.label(18, 0.6, -1, 'Отмель 0,2 м');
    B.label(26, 1.4, -15, 'Скат из воды');
  }

  function towers(B) {
    for (const [x, h] of TOWERS) {
      B.box(x, 0, TOWER_Z0, x + TOWER_W, h, TOWER_Z1, 'block');
      const cx = x + TOWER_W / 2;
      B.ladder(cx - 1, TOWER_Z1, cx + 1, TOWER_Z1 + 0.6, 0, h, 'z-');
      B.box(cx - 1, 0, TOWER_Z1, cx + 1, h, TOWER_Z1 + 0.08, 'ladder', { col: false, grid: false });
      B.label(cx, h + 0.6, TOWER_Z0 + 2.5, 'башня ' + h + ' м');
    }
    B.label(-14, 1.5, TOWER_Z1 + 1.5, '6. Башни для падения: без урона до 5 м');
    B.label(12.5, 1.5, TOWER_Z1 + 1.5, 'С башни 10 м на юг вода: урона нет');
  }

  function passages(B) {
    const h = 7, a0 = -58;
    const door = -54, narrow = -48, main = -42, duck = -33, gate = -27, hotDoor = -21, coldDoor = -15;
    const w = 2.4;
    const hole = (x, wide, top) => [x - a0, x - a0 + wide, 0, top];
    B.wall(a0, WALL_Z, -6, WALL_Z, h, 0.5, 'wall', {
      holes: [hole(door, w, 2.6), hole(narrow, w, 2.8), hole(main, 5, 6), hole(duck, w, 1.25), hole(gate, w, 2.6), hole(hotDoor, w, 2.6), hole(coldDoor, w, 2.6)]
    });
    B.wall(narrow - 0.125, WALL_Z, narrow - 0.125, WALL_Z + 8, 2.8, 0.25, 'wall');
    B.wall(narrow + w + 0.125, WALL_Z, narrow + w + 0.125, WALL_Z + 8, 2.8, 0.25, 'wall');
    B.box(narrow - 0.25, 2.8, WALL_Z, narrow + w + 0.25, 3.1, WALL_Z + 8, 'roof');
    B.wall(duck - 0.125, WALL_Z, duck - 0.125, WALL_Z + 6, 1.25, 0.25, 'wall');
    B.wall(duck + w + 0.125, WALL_Z, duck + w + 0.125, WALL_Z + 6, 1.25, 0.25, 'wall');
    B.box(duck - 0.25, 1.25, WALL_Z, duck + w + 0.25, 1.55, WALL_Z + 6, 'roof');
    B.gate(gate, WALL_Z, gate + w, WALL_Z, 2.6, 'z+');
    B.door(hotDoor, WALL_Z, hotDoor + w, WALL_Z, 2.6, 'hot');
    B.door(coldDoor, WALL_Z, coldDoor + w, WALL_Z, 2.6, 'cold');
    const sign = (x, text) => B.label(x, 3.2, WALL_Z - 0.6, text);
    sign(door + w / 2, 'дверь 2,4 × 2,6');
    sign(narrow + w / 2, 'проход 2,4, потолок 2,8');
    sign(main + 2.5, 'главный путь 5 м');
    B.label(duck + w / 2, 1.6, WALL_Z - 0.6, 'лаз 1,25: присесть');
    sign(gate + w / 2, 'ворота: только на север');
    sign(hotDoor + w / 2, 'дверь Горячих');
    sign(coldDoor + w / 2, 'дверь Холодных');
    B.label(-34, 5.2, WALL_Z - 0.6, '7. Проходы');
  }

  function lineup(B) {
    T.MERC_ORDER.forEach((id, i) => {
      const x = 6 + i * 5;
      B.dummy(id, 'hot', x, 16, SOUTH);
      B.dummy(id, 'cold', x, 24, SOUTH);
      B.label(x, 2.1, 16, T.MERCS[id].name);
      B.label(x, 2.1, 24, T.MERCS[id].name);
    });
    B.label(28, 3.2, 20, '8. Дублёры: свои сквозь, чужие держат');
  }

  function roofs(B) {
    for (const [x, h] of ROOFS) {
      B.box(x - 3, 0, 32, x + 3, h, 40, 'block');
      B.label(x, h + 0.6, 36, 'крыша ' + String(h).replace('.', ',') + ' м');
    }
    B.label(-30, 2.2, 29, '9. Крыши. Солдат: прыжок, присесть, Трубомёт под ноги. Подрывник: мина под ноги, прыжок, ПКМ');
  }

  function range(B) {
    const { x, z } = FIRE_LINE;
    B.box(x - 0.1, 0, z - 6, x + 0.1, 0.02, z + 6, 'mark', { col: false, grid: false });
    for (const d of TARGETS) {
      B.target(x + d, z, -EAST);
      B.label(x + d, 2.1, z, 'мишень ' + d + ' м');
    }
    B.label(x + 3, 2.8, z - 5, '10. Мишени. Стрелять от белой линии');
  }

  function supplies(B) {
    const { x, z, step } = SUPPLIES;
    const row = [
      ['health', 0.2, 'кружка 20 %'], ['health', 0.5, 'чайник 50 %'], ['health', 1, 'самовар 100 %'],
      ['ammo', 0.2, 'ящик 20 %'], ['ammo', 0.5, 'два ящика 50 %'], ['ammo', 1, 'штабель 100 %']
    ];
    row.forEach(([kind, size, text], i) => {
      B[kind](x + i * step, z, size);
      B.label(x + i * step, 1, z, text);
    });
    const lockerX = x + row.length * step;
    B.locker(lockerX, z + 1);
    B.label(lockerX, 2.4, z, 'шкафчик');
    B.label(x + 8, 2.4, z - 3, '11. Запасы. Возвращаются через 10 с');
  }

  function walkers(B) {
    const loop = [[32, 27], [56, 27], [56, 32], [32, 32]];
    B.patrol('diver', 'hot', loop);
    B.patrol('diver', 'cold', [loop[2], loop[3], loop[0], loop[1]]);
    B.label(44, 2.6, 29.5, '12. Обход: дублёры на ходу, для удара в спину');
  }

  function standing(B) {
    for (const [kind, team, x, z] of STANDING) B.turret(kind, team, x, z, WEST, 'plumber');
    B.label(53, 3, 9, '13. Здания обеих сторон для пломбы. Гидранты бьют только по живым');
  }

  T.MAPS.yard = {
    name: 'Двор',
    spec: { HEIGHTS, PITS, PIT_Z0, PIT_Z1, PIT_DEPTH, POOL, TOWERS, TOWER_Z0, TOWER_Z1, TOWER_W, WALL_Z, ROOFS, FIRE_LINE, TARGETS, SUPPLIES, STANDING, EAST, WEST, NORTH, SOUTH },
    build(B) {
      const holes = PITS.map(([x, len]) => [x, PIT_Z0, x + len, PIT_Z1]);
      holes.push([POOL.x0, POOL.z0, POOL.x1, POOL.z1]);
      B.ground(X0, Z0, X1, Z1, 0, holes, 'ground');
      B.wall(X0, Z0, X1, Z0, 14, 1, 'wall');
      B.wall(X0, Z1, X1, Z1, 14, 1, 'wall');
      B.wall(X0, Z0, X0, Z1, 14, 1, 'wall');
      B.wall(X1, Z0, X1, Z1, 14, 1, 'wall');
      lane(B);
      heights(B);
      stairs(B);
      pits(B);
      pool(B);
      towers(B);
      passages(B);
      lineup(B);
      roofs(B);
      range(B);
      supplies(B);
      walkers(B);
      standing(B);
      B.spawn('hot', -54, -42, EAST);
      B.spawn('cold', 54, -42, WEST);
      B.bounds(X0, Z0, X1, Z1);
      B.killY(-12);
    }
  };

  if (typeof module !== 'undefined') module.exports = T;
})(globalThis.Tf98 = globalThis.Tf98 || {});
