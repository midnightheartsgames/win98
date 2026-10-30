(function (T) {
  'use strict';
  const HALF_X = 56, HALF_Z = 30;
  const G = 0, UP = 3.4, TUN = -3.2, LOW = -5, WATER_TOP = -3.4, WATER_FLOOR = -6.4;
  const TOP = 7, SLAB = 0.4, ROOM_ROOF = 3, LOW_ROOF = -2.2, SPIRAL_ROOF = 6.6, STAIRS_ROOF = 3.2, TUN_ROOF = -SLAB;
  const DOOR = 2.4, DOOR_H = 2.6, THIN = 0.3, LEG_TURN = 1.2, LEG_MID = -1.7;
  const CLIP_FORT = TOP + 0.3, CLIP_ROCK = 9, CLIP_TOP = 22;

  function kit(B, side) {
    const X = u => side * u;
    const K = {
      X,
      toCanal: side < 0 ? 'x+' : 'x-',
      toBack: side < 0 ? 'x-' : 'x+',
      yaw: (du, dz) => Math.atan2(side * du, dz),
      box(u0, y0, z0, u1, y1, z1, mat, o) { return B.box(X(u0), y0, z0, X(u1), y1, z1, mat, o); },
      plate(u0, z0, u1, z1, y) { return K.box(u0, y - SLAB, z0, u1, y, z1, 'plate'); },
      roof(u0, z0, u1, z1, y) { return K.box(u0, y, z0, u1, y + 0.3, z1, 'roof'); },
      holed(u0, z0, u1, z1, y, holes, mat, o) {
        const mapped = holes.map(([a, c, b, d]) => [Math.min(X(a), X(b)), c, Math.max(X(a), X(b)), d]);
        return B.ground(Math.min(X(u0), X(u1)), z0, Math.max(X(u0), X(u1)), z1, y, mapped, mat, Object.assign({ t: SLAB }, o));
      },
      alongZ(u, z0, z1, y0, y1, holes = [], t = 0.5) {
        return B.wall(X(u), z0, X(u), z1, y1 - y0, t, 'wall', { y: y0, holes: holes.map(([a, b, lo, hi]) => [a - z0, b - z0, lo - y0, hi - y0]) });
      },
      alongU(z, u0, u1, y0, y1, holes = [], t = 0.5) {
        const base = Math.min(X(u0), X(u1));
        const mapped = holes.map(([a, b, lo, hi]) => {
          const p = X(a), q = X(b);
          return [Math.min(p, q) - base, Math.max(p, q) - base, lo - y0, hi - y0];
        });
        return B.wall(X(u0), z, X(u1), z, y1 - y0, t, 'wall', { y: y0, holes: mapped });
      },
      stairs(u0, z0, u1, z1, lo, hi, dir) { return B.stairs(X(u0), z0, X(u1), z1, lo, hi, dir, 'plate'); },
      health(u, z, size, y) { B.pickupAt('health', X(u), z, size, y); },
      ammo(u, z, size, y) { B.pickupAt('ammo', X(u), z, size, y); },
      label(u, y, z, text) { B.label(X(u), y, z, text); },
      hint(kind, team, u, y, z, du, dz) { B.hint(kind, team, X(u), y, z, K.yaw(du, dz)); }
    };
    return K;
  }

  function facade(B, K) {
    K.plate(12, -14, 24.5, 14, G);
    K.box(10, WATER_FLOOR, -HALF_Z, 12, TUN, HALF_Z, 'ground');
    K.alongZ(12.25, -HALF_Z, HALF_Z, WATER_FLOOR, -SLAB, [[-1.2, 1.2, TUN, -SLAB]]);
    K.box(12, -SLAB, 14, 23.7, CLIP_ROCK, HALF_Z, 'block');
    K.box(12, -SLAB, -HALF_Z, 23.7, CLIP_ROCK, -14, 'block');
    K.alongZ(24.25, -14, 16, G, TOP, [[-3.7, -1.3, G, DOOR_H], [1.3, 3.7, G, DOOR_H], [7.6, 10, UP, UP + DOOR_H], [-10, -7.6, UP, UP + DOOR_H]]);
    K.box(15.5, G, -9, 16.7, 1.2, -5, 'block');
    K.box(15.5, G, 5, 16.7, 1.2, 9, 'block');
    K.health(14, -11, 0.2, G);
    K.ammo(14, 11, 0.2, G);
    K.label(18, 2.2, -12, '3. Фасад');
    K.label(21, 2.4, 0, 'К ВЕНТИЛЮ: двери в вестибюль');
  }

  function bastion(B, K) {
    K.plate(20.5, -14, 24.5, 14, UP);
    K.box(20.5, UP, -14, 20.8, UP + 1, 14, 'block');
    K.box(20.9, G, -9.3, 21.5, UP - SLAB, -8.7, 'wall');
    K.box(20.9, G, 8.7, 21.5, UP - SLAB, 9.3, 'wall');
    K.health(22.5, -12.5, 0.5, UP);
    K.ammo(22.5, 12.5, 0.5, UP);
    K.label(22.5, UP + 1.6, 0, '10. Бастион');
  }

  function lobby(B, K) {
    K.holed(24, -5.5, 32, 5.5, G, [[24.5, -1.2, 29.4, 1.2]], 'plate');
    K.alongZ(31.75, -9, 5.5, G, TOP);
    K.alongU(-5.25, 24.5, 31.5, G, TOP, [[26, 28.4, G, DOOR_H]]);
    K.health(30.4, 3.8, 0.2, G);
    K.label(30.3, 2.2, -3.6, '4. Вестибюль');
    K.label(27, 1.4, 0, 'Вниз: тоннели');
    K.label(27.2, 2.4, -4.8, 'Коридор');
    K.label(27.2, 2.4, 4.8, 'Боковая комната');
  }

  function grate(B, K) {
    K.holed(24.5, -5, 31.5, 5, UP, [[28, -4.4, 30.4, -2]], 'grate', { t: 0.2, nobul: true, grate: true, vis: false });
    for (let u = 24.7; u < 31.5; u += 0.4) {
      if (u > 28 && u < 30.4) {
        K.box(u - 0.03, UP - 0.08, -5, u + 0.03, UP, -4.4, 'grate', { col: false, grid: false });
        K.box(u - 0.03, UP - 0.08, -2, u + 0.03, UP, 5, 'grate', { col: false, grid: false });
      } else {
        K.box(u - 0.03, UP - 0.08, -5, u + 0.03, UP, 5, 'grate', { col: false, grid: false });
      }
    }
    K.roof(24.5, -5, 31.5, 5, TOP);
    K.ammo(26, 3.5, 0.2, UP);
    K.label(30.8, UP + 1.5, 0, '8. Решётка');
  }

  function sideRoom(B, K) {
    K.holed(24, 5, 35, 13, G, [[24.5, 9.1, 29.4, 11.5]], 'plate');
    K.alongZ(34.75, 5.5, 13, G, ROOM_ROOF);
    K.alongU(12.75, 24.5, 35, G, ROOM_ROOF);
    K.health(32.8, 11, 0.5, G);
    K.label(31, 2.2, 8, '6. Боковая комната');
    K.label(33.2, 2.4, 5.8, 'Двор');
  }

  function corridor(B, K) {
    K.plate(25.9, -13, 28.5, -5, G);
    K.plate(28.5, -13, 36, -10.4, G);
    K.plate(33.4, -10.4, 36, -8.5, G);
    K.alongZ(25.65, -13.5, -5.5, G, ROOM_ROOF);
    K.alongZ(28.75, -9.9, -5.5, G, ROOM_ROOF);
    K.alongU(-10.15, 28.5, 33.4, G, ROOM_ROOF);
    K.alongU(-13.25, 25.4, 36.5, G, ROOM_ROOF);
    K.alongZ(36.25, -13.5, -9, G, ROOM_ROOF);
    K.alongZ(33.15, -9.9, -9, G, ROOM_ROOF);
    K.roof(31.5, -13.5, 36.5, -9, ROOM_ROOF);
    K.label(30.5, 2.2, -11.7, '5. Коридор');
  }

  function yard(B, K) {
    K.plate(31.5, -9, 48.5, 5.5, G);
    K.plate(32, 3, 48, 5, UP);
    K.alongU(-8.75, 31.5, 48.5, G, TOP, [[33.6, 36, G, DOOR_H]]);
    K.alongZ(48.25, -9, 5.5, G, TOP, [[-2, 0.4, G, DOOR_H]]);
    K.box(37, G, -2.5, 38.2, 1.2, 1.5, 'block');
    K.box(42, G, -7, 45, 1.2, -5.8, 'block');
    K.box(43, G, -1, 45, 2.4, 1, 'block');
    K.box(39.5, G, -8.5, 41, 13, -7.5, 'wall');
    K.health(46, -7, 0.5, G);
    K.ammo(34, -6, 0.5, G);
    K.label(40, 2.8, -2, '7. Двор');
    K.label(47.6, 2.8, -0.8, 'К ВЕНТИЛЮ: вниз');
    K.label(34.8, 2.8, -8.2, 'Коридор');
    K.label(33.2, 2.8, 2.6, 'Боковая комната, к мосту');
  }

  function wall5(B, K) {
    K.alongU(5.25, 24.5, 48, G, TOP, [
      [26, 28.4, G, DOOR_H], [32, 34.4, G, DOOR_H], [41, 43.4, G, DOOR_H],
      [27, 29.4, UP, UP + DOOR_H], [32, 36.5, UP, UP + DOOR_H]
    ]);
  }

  function hall(B, K) {
    K.plate(24.5, 5, 37, 16, UP);
    K.roof(24.5, 5.5, 37, 16, TOP);
    K.alongZ(36.75, 5.5, 16, G, TOP, [[6, 8.4, UP, UP + DOOR_H]]);
    K.alongU(15.75, 24, 38, LOW, TOP, [[26, 28.4, UP, UP + DOOR_H], [35.6, 38, LOW, LOW + 2.8]]);
    K.health(34, 14, 0.2, UP);
    K.label(31, UP + 2, 10, '9. Верхний зал');
    K.label(27.2, UP + 2.3, 15.2, 'К ВЕНТИЛЮ: спираль');
    K.label(25, UP + 2.3, 8.8, 'Бастион');
  }

  function sideShower(B, K, team) {
    K.holed(24.5, -13.5, 31.5, -5.5, UP, [[25.9, -13, 28.5, -10.4]], 'plate');
    K.roof(24.5, -14, 32, -5.5, TOP);
    K.alongU(-13.75, 24.5, 32, UP - SLAB, TOP);
    K.alongZ(31.75, -14, -9, UP - SLAB, TOP);
    B.door(K.X(24.25), -10, K.X(24.25), -7.6, DOOR_H, team, { y: UP });
    B.locker(K.X(25), -6.4, UP);
    for (const [u, z] of [[29.5, -8], [30.5, -12], [27.5, -7.5], [30, -6.5], [29.5, -10]]) B.spawn(team, K.X(u), z, K.yaw(-1, 0), UP);
    B.noBuild(Math.min(K.X(24.5), K.X(31.5)), -13.5, Math.max(K.X(24.5), K.X(31.5)), -5.5);
    K.label(28, UP + 2.2, -8.5, '17. Боковая душевая');
  }

  function mainShower(B, K, team) {
    K.box(37, G, 5.5, 39.9, UP, 15.5, 'block');
    K.plate(39.9, 5, 47.5, 15.5, G);
    K.stairs(39.9, 13, 46.5, 15.5, G, UP, K.toCanal);
    K.roof(37, 5.5, 47.5, 15.5, TOP);
    K.alongZ(47.25, 5.5, 15.5, G, TOP);
    K.alongU(15.75, 38, 47.5, G, TOP);
    B.door(K.X(41), 5.25, K.X(43.4), 5.25, DOOR_H, team);
    B.door(K.X(36.75), 6, K.X(36.75), 8.4, DOOR_H, team, { y: UP });
    B.locker(K.X(45.8), 6.2, G);
    B.locker(K.X(38.8), 10.5, UP);
    for (const [u, z] of [[44, 8], [42, 9], [45.5, 10.5], [41.5, 11.5], [43.5, 12], [46, 8.5], [42.2, 7]]) B.spawn(team, K.X(u), z, Math.PI, G);
    B.noBuild(Math.min(K.X(37), K.X(47)), 5.5, Math.max(K.X(37), K.X(47)), 15.5);
    K.label(43, 3.2, 10, '16. Главная душевая');
  }

  function spiral(B, K) {
    K.plate(26, 16, 28.4, 18.4, UP);
    K.stairs(28.4, 16, 35.6, 18.4, LEG_TURN, UP, K.toCanal);
    K.plate(35.6, 16, 38, 21.1, LEG_TURN);
    K.stairs(26.4, 18.7, 35.6, 21.1, LEG_MID, LEG_TURN, K.toBack);
    K.plate(24, 18.7, 26.4, 23.8, LEG_MID);
    K.stairs(26.4, 21.4, 35.6, 23.8, LOW, LEG_MID, K.toCanal);
    K.plate(35.6, 13, 38, 23.8, LOW);
    K.alongZ(25.85, 15.9, 18.4, UP - SLAB, SPIRAL_ROOF, [], THIN);
    K.alongU(18.55, 23.7, 35.6, LOW, SPIRAL_ROOF, [], THIN);
    K.alongU(21.25, 26.4, 38, LOW, SPIRAL_ROOF, [[35.6, 38, LOW, LOW + 2.8]], THIN);
    K.alongU(23.95, 23.7, 38.3, LOW, SPIRAL_ROOF, [], THIN);
    K.alongZ(23.85, 18.4, 24.1, LEG_MID - SLAB, SPIRAL_ROOF, [], THIN);
    K.alongZ(38.15, 16, 24.1, LOW, SPIRAL_ROOF, [], THIN);
    K.alongZ(35.45, 15.9, 21.25, LOW, LEG_TURN - SLAB, [], THIN);
    K.alongZ(35.35, 12.5, 15.5, LOW, LOW + 2.9);
    K.alongU(12.75, 35.1, 38, LOW, LOW + 2.9);
    K.roof(35.1, 12.5, 38, 15.5, LOW + 2.9);
    K.roof(23.7, 16, 38.3, 24.1, SPIRAL_ROOF);
    K.health(36.8, 17.2, 0.2, LEG_TURN);
    K.ammo(25.2, 21, 0.2, LEG_MID);
    K.label(30, UP + 1, 17.2, '11. Спираль');
    K.label(36.8, LOW + 2, 14.2, 'В подвал');
  }

  function basement(B, K) {
    K.plate(38, 7, 49, 19, LOW);
    K.box(38.5, -SLAB, 15.5, 48.5, G, 18.5, 'roof');
    K.box(47, -SLAB, 7.5, 48.5, G, 15.5, 'roof');
    K.alongZ(38.25, 7, 19, LOW, G, [[9, 11.4, LOW, LOW + DOOR_H], [13, 15.4, LOW, LOW + DOOR_H]]);
    K.alongZ(48.75, 7, 19, LOW, G, [[9, 11.4, LOW, LOW + DOOR_H], [16, 18.4, LOW, LOW + DOOR_H]]);
    K.alongU(7.25, 38, 49, LOW, G);
    K.alongU(18.75, 38, 49, LOW, G, [[40, 42.4, LOW, LOW + DOOR_H]]);
    K.health(39.5, 17.3, 0.5, LOW);
    K.ammo(47.2, 8.6, 0.5, LOW);
    K.label(43.5, LOW + 2.4, 13, '13. Подвал');
    K.label(39, LOW + 2.8, 10.2, 'К ВЕНТИЛЮ');
    K.label(48, LOW + 2.8, 10.2, 'К ВЕНТИЛЮ');
  }

  function pantry(B, K, team) {
    K.plate(39, 18.5, 43.5, 23, LOW);
    K.alongZ(39.25, 19, 23, LOW, LOW_ROOF);
    K.alongZ(43.25, 19, 23, LOW, LOW_ROOF);
    K.alongU(22.75, 39, 43.5, LOW, LOW_ROOF);
    K.roof(39, 19, 43.5, 23, LOW_ROOF);
    B.door(K.X(40), 18.75, K.X(42.4), 18.75, DOOR_H, team, { y: LOW });
    B.locker(K.X(41.2), 21.9, LOW);
    K.label(41.2, LOW + 2, 20.2, '15. Кладовка');
  }

  function corridors(B, K) {
    K.plate(33.6, 9, 38, 11.4, LOW);
    K.plate(33.6, 5, 36, 9, LOW);
    K.alongU(11.65, 33.1, 38, LOW, LOW_ROOF);
    K.alongZ(33.35, 5.5, 11.9, LOW, LOW_ROOF);
    K.alongZ(36.25, 5.5, 8.75, LOW, LOW_ROOF);
    K.alongU(8.75, 36, 38, LOW, LOW_ROOF);
    K.roof(33.1, 5.5, 38, 11.9, LOW_ROOF);
    K.plate(48.5, -5.4, 51.4, -3, LOW);
    K.plate(49, -3, 51.4, 11.4, LOW);
    K.alongZ(48.75, -3, 7, LOW, LOW_ROOF);
    K.alongU(-5.65, 48.5, 51.9, LOW, LOW_ROOF);
    K.alongZ(51.65, -5.9, 0.4, LOW, LOW_ROOF);
    K.alongU(11.65, 49, 51.5, LOW, LOW_ROOF);
    K.roof(48.5, -5.9, 51.5, 11.9, LOW_ROOF);
  }

  function control(B, K, team) {
    K.plate(31.5, -9, 48.5, 5.5, LOW);
    K.alongZ(31.75, -9, 5.5, LOW, -SLAB);
    K.alongZ(48.25, -9, 5.5, LOW, -SLAB, [[-5.4, -3, LOW, LOW + DOOR_H]]);
    K.alongU(-8.75, 31.5, 48.5, LOW, -SLAB);
    K.alongU(5.25, 31.5, 48.5, LOW, -SLAB, [[33.6, 36, LOW, LOW + DOOR_H]]);
    K.box(42.8, LOW, -2, 44.2, LOW + 0.9, -1, 'brass');
    K.box(36, LOW, -6.5, 37, LOW + 1.4, -3.5, 'block');
    K.box(36, LOW, 0.5, 37, LOW + 1.4, 3.5, 'block');
    K.box(40, LOW, -7, 41, LOW + 1.4, -4, 'block');
    K.box(40, LOW, 1, 41, LOW + 1.4, 4, 'block');
    K.box(47.9, LOW + 1.2, 1, 48, LOW + 3.4, 4.8, 'mark', { col: false, grid: false });
    K.box(37.1, LOW, -2.9, 39.9, LOW + 0.03, -0.1, 'brass', { col: false, grid: false });
    B.flag(team, K.X(43.5), LOW + 0.9, -1.5);
    B.capture(team, K.X(38.5), LOW, -1.5, 1.6);
    B.noBuild(Math.min(K.X(36.9), K.X(40.1)), -3.1, Math.max(K.X(36.9), K.X(40.1)), 0.1);
    B.noBuild(Math.min(K.X(42.3), K.X(44.7)), -2.5, Math.max(K.X(42.3), K.X(44.7)), -0.5);
    K.label(43.5, LOW + 2, -1.5, '14. Диспетчерская: вентиль');
    K.label(38.5, LOW + 1, -1.5, 'Распределитель');
    K.label(47.6, LOW + 2.4, 2.9, 'Мнемосхема');
  }

  function stairsDown(B, K) {
    K.plate(48.5, -2, 54.4, 0.4, G);
    K.alongU(-2.25, 48.5, 54.9, G, STAIRS_ROOF);
    K.alongU(0.65, 48.5, 51.5, G, STAIRS_ROOF);
    K.stairs(52, 0.4, 54.4, 16, LOW, G, 'z-');
    K.alongZ(54.65, -2.5, 18.9, LOW, STAIRS_ROOF);
    K.alongZ(51.75, 0.4, 16, LOW, STAIRS_ROOF);
    K.alongZ(51.75, 16, 19, LOW_ROOF, STAIRS_ROOF);
    K.plate(49, 16, 54.4, 18.4, LOW);
    K.alongU(18.65, 49, 54.9, LOW, STAIRS_ROOF);
    K.alongU(15.75, 49, 51.5, LOW, LOW_ROOF);
    K.roof(49, 15.5, 51.5, 18.9, LOW_ROOF);
    K.roof(48.5, -2.5, 54.9, 0.9, STAIRS_ROOF);
    K.roof(51.5, 0.9, 54.9, 18.9, STAIRS_ROOF);
    K.label(53.2, 2, -0.8, '12. Лестница');
  }

  function tunnels(B, K) {
    K.plate(12, -1.2, 23.2, 1.2, TUN);
    K.stairs(23.2, -1.2, 29.4, 1.2, TUN, G, K.toBack);
    K.alongU(-1.45, 12.5, 29.9, TUN, -0.02);
    K.alongU(1.45, 12.5, 29.9, TUN, -0.02, [[20.8, 23.2, TUN, TUN + 2.76]]);
    K.plate(20.8, 1.2, 23.2, 11.5, TUN);
    K.alongZ(20.55, 1.7, 12, TUN, TUN_ROOF, [[5, 7.4, TUN, TUN + 2.76]]);
    K.alongZ(23.45, 1.7, 8.6, TUN, TUN_ROOF);
    K.alongU(8.85, 23.2, 29.9, TUN, -0.02);
    K.alongU(11.75, 20.3, 29.9, TUN, -0.02);
    K.stairs(23.2, 9.1, 29.4, 11.5, TUN, G, K.toBack);
    K.plate(18.4, 5, 20.8, 7.4, TUN);
    K.alongZ(18.15, 4.5, 7.9, TUN, TUN_ROOF);
    K.alongU(4.75, 17.9, 20.3, TUN, TUN_ROOF);
    K.alongU(7.65, 17.9, 20.3, TUN, TUN_ROOF);
    K.health(19.4, 6.2, 0.5, TUN);
    K.ammo(22, 10.3, 0.2, TUN);
    K.label(16, TUN + 2, 0, '18. Служебные тоннели');
    K.label(22, TUN + 2.2, 3, 'К боковой комнате');
    K.label(11, TUN + 1.6, 0, 'Лаз в тоннели');
  }

  function clips(B, K) {
    const clip = (u0, y0, z0, u1, z1) => B.solid(K.X(u0), y0, z0, K.X(u1), CLIP_TOP, z1, { nobul: true, clip: true });
    clip(24, CLIP_FORT, -14, 32, 25);
    clip(48, CLIP_FORT, -14, 55.5, 25);
    clip(32, CLIP_FORT, -14, 48, -9);
    clip(32, CLIP_FORT, 5.5, 48, 25);
    clip(12, CLIP_ROCK, 14, 24, HALF_Z);
    clip(12, CLIP_ROCK, -HALF_Z, 24, -14);
  }

  function orders(B, K, team, foe) {
    for (const [u, z] of [[45.5, 2.5], [45.5, -6], [38.5, 3], [38.5, -6.5], [34, -3]]) B.post(team, 'guard', K.X(u), z, LOW);
    for (const [u, z] of [[13.5, -2.5], [13.5, 2.5], [15, -7], [15, 7], [18.5, 0], [19, -6], [19, 6]]) B.post(team, 'bridge', K.X(u), z, G);
    B.post(team, 'mouth', K.X(11.2), 0, TUN);
    K.hint('sentry', team, 45.5, LOW, 2, -1, 0);
    K.hint('sentry', team, 34.5, LOW, -5, 1, 0);
    K.hint('sentry', team, 40, G, -6.5, 0, 1);
    K.hint('sniper', team, 21.6, UP, -4, -1, 0);
    K.hint('sniper', team, 21.6, UP, 5, -1, 0);
    K.hint('sticky', team, 35, LOW, 4, 0, -1);
    K.hint('sticky', team, 27, G, -3, -1, 0);
    K.hint('flank', foe, 11, TUN, 0, 1, 0);
    K.hint('flank', foe, 22, TUN, 3, 0, 1);
    K.hint('charge', foe, 53.2, G, -0.8, 0, 1);
    K.hint('charge', team, 15, G, 0, -1, 0);
    K.hint('ambush', team, 25.5, G, 6.6, 1, 0);
    K.hint('ambush', team, 30.5, G, -4.2, -1, 0);
    K.hint('jump', team, 14, G, 6, 1, 0);
    K.hint('jump', team, 13, G, 0, -1, 0);
  }

  function fort(B, side, team) {
    const K = kit(B, side);
    facade(B, K);
    bastion(B, K);
    lobby(B, K);
    grate(B, K);
    sideRoom(B, K);
    corridor(B, K);
    yard(B, K);
    wall5(B, K);
    hall(B, K);
    sideShower(B, K, team);
    mainShower(B, K, team);
    spiral(B, K);
    basement(B, K);
    pantry(B, K, team);
    corridors(B, K);
    control(B, K, team);
    stairsDown(B, K);
    tunnels(B, K);
    clips(B, K);
    orders(B, K, team, T.enemyOf(team));
  }

  function bridge(B) {
    B.box(-12, -SLAB, -3, 12, G, 3, 'plate');
    B.ground(-12, -3, 12, 3, 3.2, [[-6.25, -1, -5.75, 1], [-0.25, -1, 0.25, 1], [5.75, -1, 6.25, 1]], 'roof', { t: 0.3 });
    for (const x of [-11.6, -6, 0, 6, 11.6]) {
      for (const z of [-2.8, 2.8]) B.box(x - 0.2, G, z - 0.2, x + 0.2, 2.9, z + 0.2, 'wall');
    }
    B.label(0, 2, -2.2, '1. Мост');
  }

  function canal(B) {
    B.water(-10, -HALF_Z, 10, HALF_Z, WATER_FLOOR, WATER_TOP);
    B.box(-10, WATER_FLOOR - 1, -HALF_Z, 10, WATER_FLOOR, HALF_Z, 'ground');
    B.wall(-12, -HALF_Z, 12, -HALF_Z, 18.4, 1, 'wall', { y: WATER_FLOOR });
    B.wall(-12, HALF_Z, 12, HALF_Z, 18.4, 1, 'wall', { y: WATER_FLOOR });
    B.label(0, WATER_TOP + 1, 8, '2. Канал');
  }

  T.MAPS['2fort'] = {
    name: '2Fort',
    build(B) {
      bridge(B);
      canal(B);
      fort(B, -1, 'hot');
      fort(B, 1, 'cold');
      B.bounds(-HALF_X, -HALF_Z, HALF_X, HALF_Z);
      B.killY(-14);
    }
  };

  if (typeof module !== 'undefined') module.exports = T;
})(globalThis.Tf98 = globalThis.Tf98 || {});
