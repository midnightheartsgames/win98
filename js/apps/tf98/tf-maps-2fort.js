(function (T) {
  'use strict';
  const HALF_X = 90, HALF_Z = 44;
  const G = 0, UP = 3.4, TUN = -3.2, LOW = -5, WATER_TOP = -3.4, WATER_FLOOR = -6.4;
  const TOP = 7, SLAB = 0.4, ROOM_ROOF = 3, LOW_ROOF = -2.2, BASE_ROOF = -1.4, SPIRAL_ROOF = 6.6, STAIRS_ROOF = 3.2, TUN_ROOF = -SLAB, TUN_PASS = TUN + 2.76;
  const DOOR = 2.4, DOOR_H = 2.6, THIN = 0.3;
  const BRIDGE = 10, CANAL = 9, CANAL_Z = 11, ROCK_TOP = 8, CLIP_FORT = TOP + 0.3, CLIP_TOP = 22;
  const LEG_HIGH = 0.6, LEG_MID = -1.4;

  function kit(B, side, team) {
    const X = u => side * u, Z = z => side * z;
    const holesOf = (map, base, holes, y0) => holes.map(([a, b, lo, hi]) => {
      const p = map(a), q = map(b);
      return [Math.min(p, q) - base, Math.max(p, q) - base, lo - y0, hi - y0];
    });
    const K = {
      X,
      Z,
      team,
      toward: dir => ({ 'u+': side > 0 ? 'x+' : 'x-', 'u-': side > 0 ? 'x-' : 'x+', 'z+': side > 0 ? 'z+' : 'z-', 'z-': side > 0 ? 'z-' : 'z+' })[dir],
      yaw: (du, dz) => Math.atan2(side * du, side * dz),
      box(u0, y0, z0, u1, y1, z1, mat, o) { return B.box(X(u0), y0, Z(z0), X(u1), y1, Z(z1), mat, o); },
      plate(u0, z0, u1, z1, y) { return K.box(u0, y - SLAB, z0, u1, y, z1, 'plate'); },
      roof(u0, z0, u1, z1, y) { return K.box(u0, y, z0, u1, y + 0.3, z1, 'roof'); },
      holed(u0, z0, u1, z1, y, holes, mat, o) {
        const mapped = holes.map(([a, c, b, d]) => [Math.min(X(a), X(b)), Math.min(Z(c), Z(d)), Math.max(X(a), X(b)), Math.max(Z(c), Z(d))]);
        return B.ground(Math.min(X(u0), X(u1)), Math.min(Z(z0), Z(z1)), Math.max(X(u0), X(u1)), Math.max(Z(z0), Z(z1)), y, mapped, mat, Object.assign({ t: SLAB }, o));
      },
      alongZ(u, z0, z1, y0, y1, holes = [], t = 0.5) {
        return B.wall(X(u), Z(z0), X(u), Z(z1), y1 - y0, t, 'wall', { y: y0, holes: holesOf(Z, Math.min(Z(z0), Z(z1)), holes, y0) });
      },
      alongU(z, u0, u1, y0, y1, holes = [], t = 0.5) {
        return B.wall(X(u0), Z(z), X(u1), Z(z), y1 - y0, t, 'wall', { y: y0, holes: holesOf(X, Math.min(X(u0), X(u1)), holes, y0) });
      },
      stairs(u0, z0, u1, z1, lo, hi, dir) { return B.stairs(X(u0), Z(z0), X(u1), Z(z1), lo, hi, K.toward(dir), 'plate'); },
      doorZ(u, z0, y) { return B.door(X(u), Z(z0), X(u), Z(z0 + DOOR), DOOR_H, team, { y }); },
      doorU(z, u0, y) { return B.door(X(u0), Z(z), X(u0 + DOOR), Z(z), DOOR_H, team, { y }); },
      noBuild(u0, z0, u1, z1) { B.noBuild(Math.min(X(u0), X(u1)), Math.min(Z(z0), Z(z1)), Math.max(X(u0), X(u1)), Math.max(Z(z0), Z(z1))); },
      health(u, z, size, y) { B.pickupAt('health', X(u), Z(z), size, y); },
      ammo(u, z, size, y) { B.pickupAt('ammo', X(u), Z(z), size, y); },
      label(u, y, z, text) { B.label(X(u), y, Z(z), text); },
      spawn(u, z, y, du, dz) { B.spawn(team, X(u), Z(z), K.yaw(du, dz), y); },
      locker(u, z, y) { B.locker(X(u), Z(z), y); },
      post(role, u, z, y) { B.post(team, role, X(u), Z(z), y); },
      hint(kind, who, u, y, z, du, dz) { B.hint(kind, who, X(u), y, Z(z), K.yaw(du, dz)); },
      clip(u0, y0, z0, u1, z1) { B.solid(X(u0), y0, Z(z0), X(u1), CLIP_TOP, Z(z1), { nobul: true, offGrid: true }); }
    };
    return K;
  }

  function facade(K) {
    K.plate(CANAL, -16, 19, 16, G);
    K.alongZ(CANAL + 0.25, -CANAL_Z - 0.5, CANAL_Z + 0.5, WATER_FLOOR, -SLAB, [[-7.2, -4.8, TUN, TUN_ROOF], [4.8, 7.2, TUN, TUN_ROOF]]);
    K.box(BRIDGE, -SLAB, 16, 19, ROCK_TOP, HALF_Z, 'block');
    K.box(BRIDGE, -SLAB, -HALF_Z, 19, ROCK_TOP, -16, 'block');
    K.alongZ(18.75, -16, 16, G, ROOM_ROOF, [[-8.2, -5.8, G, DOOR_H], [5.8, 8.2, G, DOOR_H]]);
    K.box(12.5, G, -12.5, 13.7, 1.2, -8.5, 'block');
    K.box(12.5, G, 8.5, 13.7, 1.2, 12.5, 'block');
    K.box(BRIDGE, 3.1, -3, 18, 3.5, 3, 'roof', { offGrid: true });
    K.box(13.8, G, -3, 14.2, 3.1, -2.6, 'wall');
    K.box(13.8, G, 2.6, 14.2, 3.1, 3, 'wall');
    K.health(12, -14.5, 0.2, G);
    K.ammo(12, 14.5, 0.2, G);
    K.label(15, 2.4, -10, '3. Фасад');
    K.label(17.8, 2.8, -7, 'К ВЕНТИЛЮ: двери');
    K.label(17.8, 2.8, 7, 'К ВЕНТИЛЮ: двери');
  }

  function battlements(K) {
    K.plate(18, -16, 25.5, 16, UP);
    K.box(18, UP, -16, 18.3, UP + 1, -6, 'block');
    K.box(18, UP, 6, 18.3, UP + 1, 16, 'block');
    K.alongZ(18.15, -6, 6, UP, UP + 3, [[-5.2, -0.8, UP + 0.6, UP + 2.4], [0.8, 5.2, UP + 0.6, UP + 2.4]], THIN);
    K.alongU(-6, 18, 25, UP, UP + 3, [[20, 23, UP, UP + DOOR_H]], THIN);
    K.alongU(6, 18, 25, UP, UP + 3, [[20, 23, UP, UP + DOOR_H]], THIN);
    K.roof(18, -6.15, 25, 6.15, UP + 3);
    K.alongZ(25.25, -16, 16, UP - SLAB, TOP, [[8, 10.4, UP, UP + DOOR_H], [-14, -11.6, UP, UP + DOOR_H]]);
    K.doorZ(25.25, -14, UP);
    K.health(20, -14.5, 0.5, UP);
    K.ammo(20, 14.5, 0.5, UP);
    K.label(23, UP + 2, 0, '10. Бастион');
  }

  function lobby(K) {
    K.plate(19, -9, 24.5, 9, G);
    K.alongU(-9.25, 18.5, 25, G, ROOM_ROOF);
    K.alongU(9.25, 18.5, 25, G, ROOM_ROOF);
    K.alongZ(24.75, -9.5, 9.5, G, ROOM_ROOF, [[-3, 3, G, ROOM_ROOF]]);
    K.plate(24.5, -3.5, 36.5, 3.5, G);
    K.box(25.5, ROOM_ROOF, -3.5, 26.6, UP, 3.5, 'roof');
    K.alongU(-3.25, 25, 36.5, G, ROOM_ROOF, [[28, 30.4, G, DOOR_H]]);
    K.alongU(3.25, 25, 37.5, G, ROOM_ROOF, [[29.5, 31.9, G, DOOR_H]]);
    K.alongZ(36.25, -3.5, 3, G, ROOM_ROOF, [[-1.2, 1.2, G, DOOR_H]]);
    K.health(26, -2.2, 0.2, G);
    K.label(22, 2.2, 0, '4. Вестибюль');
    K.label(29.2, 2.4, -2.8, 'Вниз: тоннели');
    K.label(30.7, 2.4, 2.8, 'Боковая комната');
    K.label(35.6, 2.4, 0, 'Коридор');
  }

  function grate(K) {
    K.holed(26.6, -4.8, 36, 3, UP, [[33, -2.4, 35.4, 0]], 'grate', { t: 0.2, nobul: true, grate: true, vis: false });
    for (let u = 26.8; u < 36; u += 0.4) {
      if (u > 33 && u < 35.4) {
        K.box(u - 0.03, UP - 0.08, -4.8, u + 0.03, UP, -2.4, 'grate', { col: false, grid: false });
        K.box(u - 0.03, UP - 0.08, 0, u + 0.03, UP, 3, 'grate', { col: false, grid: false });
      } else {
        K.box(u - 0.03, UP - 0.08, -4.8, u + 0.03, UP, 3, 'grate', { col: false, grid: false });
      }
    }
    K.roof(26.1, -5.3, 36.5, 3, TOP);
    K.alongU(-5.05, 26.1, 36.5, UP - SLAB, TOP);
    K.alongZ(26.35, -5.3, 3, UP - SLAB, TOP);
    K.alongZ(36.25, -5.3, 3, UP - SLAB, TOP);
    K.ammo(28, 1.5, 0.2, UP);
    K.label(31, UP + 1.6, -1.5, '8. Решётка');
  }

  function hallway(K) {
    K.plate(36, -1.2, 39, 1.2, G);
    K.alongU(-1.45, 36.5, 38.5, G, ROOM_ROOF);
    K.alongU(1.45, 36.5, 38.5, G, ROOM_ROOF);
    K.roof(36.5, -1.7, 38.5, 1.7, ROOM_ROOF);
    K.plate(39, -17, 41.6, 15, G);
    K.alongZ(38.75, -17.5, 14.5, G, ROOM_ROOF, [[-1.2, 1.2, G, DOOR_H]]);
    K.alongZ(41.85, -17.5, 14.5, G, ROOM_ROOF);
    K.alongU(-17.25, 38.5, 42.1, G, ROOM_ROOF);
    K.roof(38.5, -14.5, 42.1, 14.5, ROOM_ROOF);
    K.label(40.3, 2.2, -8, '5. Узкий коридор');
    K.label(40.3, 2.4, 13, 'Двор');
  }

  function sideRoom(K) {
    K.plate(26.6, 3.5, 37, 15, G);
    K.alongZ(26.35, 3, 14.5, G, ROOM_ROOF);
    K.alongZ(37.25, 3, 14.5, G, ROOM_ROOF);
    K.box(28, G, 8, 29.2, 1.2, 11, 'block');
    K.health(28, 13, 0.5, G);
    K.label(32, 2.2, 8.5, '6. Боковая комната');
    K.label(35.7, 2.4, 14.2, 'Двор');
  }

  function upstairs(K) {
    K.plate(25.5, 3.5, 37, 15, UP);
    K.roof(25.5, 3.5, 37, 14.5, TOP);
    K.alongU(3.25, 25.5, 37, UP - SLAB, TOP, [[29, 31.4, UP, UP + DOOR_H]]);
    K.alongZ(37.25, 3, 14.5, UP - SLAB, TOP, [[8, 10.4, UP, UP + DOOR_H]]);
    K.plate(27, 15, 29.4, 19, UP);
    K.alongZ(26.75, 15, 18.5, UP - SLAB, TOP);
    K.alongZ(29.65, 15, 18.5, UP - SLAB, TOP);
    K.roof(26.5, 15, 29.9, 18.5, TOP);
    K.health(35.5, 12.5, 0.2, UP);
    K.label(31, UP + 2, 9, '9. Верхний зал');
    K.label(30.2, UP + 2.3, 3.8, 'Решётка');
    K.label(36.8, UP + 2.3, 9.2, 'К ВЕНТИЛЮ: спираль');
    K.label(25.8, UP + 2.3, 9.2, 'Бастион');
  }

  function courtyard(K) {
    K.plate(33.5, 15, 50.5, 29.5, G);
    K.plate(34, 15, 50, 17.4, UP);
    K.alongU(14.75, 25.5, 50.5, G, TOP, [[34.5, 36.9, G, DOOR_H], [39, 41.6, G, DOOR_H], [34, 37, UP, UP + DOOR_H], [27, 29.4, UP, UP + DOOR_H]]);
    K.alongZ(33.75, 14.5, 18.5, G, TOP);
    K.alongZ(50.25, 14.5, 29.5, G, TOP, [[24, 26.4, G, DOOR_H]]);
    K.alongU(29.25, 33.5, 50.5, G, TOP);
    K.box(38, G, 20, 39.2, 1.2, 24, 'block');
    K.box(44, G, 19.5, 47, 1.2, 20.7, 'block');
    K.box(42, G, 26.5, 44, 2.4, 28.5, 'block');
    K.box(48.5, G, 27.5, 49.8, 13, 28.8, 'wall');
    K.health(48.2, 19.5, 0.5, G);
    K.ammo(36, 27.5, 0.5, G);
    K.label(42, 3, 22, '7. Двор');
    K.label(49.6, 2.8, 25.2, 'К ВЕНТИЛЮ: вниз');
    K.label(40.3, 2.8, 15.6, 'Коридор');
    K.label(35.7, 2.8, 15.6, 'Боковая комната');
  }

  function mainShower(K) {
    K.plate(24, 19, 33.5, 40, G);
    K.alongZ(23.75, 18.5, 40.5, G, TOP);
    K.alongZ(33.75, 18.5, 40.5, G, TOP, [[21, 23.4, G, DOOR_H]]);
    K.alongU(18.75, 23.5, 34, G, TOP, [[27, 29.4, UP, UP + DOOR_H]]);
    K.alongU(40.25, 23.5, 34, G, TOP);
    K.roof(23.5, 18.5, 34, 40.5, TOP);
    K.alongU(32, 24, 33.5, G, TOP, [[27, 29.4, G, DOOR_H], [30.5, 32.9, G, DOOR_H]]);
    K.box(24, G, 19, 29.6, UP, 22, 'block');
    K.stairs(24, 22, 26.6, 31.5, G, UP, 'z-');
    K.doorZ(33.75, 21, G);
    K.doorU(18.75, 27, UP);
    for (const u of [27, 30.5]) K.gate(u);
    K.locker(32.8, 26.5, G);
    K.locker(25, 20.4, UP);
    for (const [u, z] of [[26, 35], [29, 36.5], [32, 35], [26, 38.5], [29, 39], [32, 38.5], [30.5, 33.8]]) K.spawn(u, z, G, 0, -1);
    K.noBuild(24, 19, 33.5, 40);
    K.label(29, 3.6, 36, '16. Главная душевая');
  }

  function sideShower(K) {
    K.holed(33.8, -32.5, 43.1, -14.5, UP, [[39, -17, 41.6, -14.6]], 'plate');
    K.roof(33.3, -33, 43.6, -14.5, TOP);
    K.alongU(-32.75, 33.3, 43.6, UP - SLAB, TOP);
    K.alongZ(33.55, -33, -14, UP - SLAB, TOP);
    K.alongZ(43.35, -33, -14, UP - SLAB, TOP);
    K.alongU(-14.25, 25.5, 43.6, UP - SLAB, TOP, [[34, 36.4, UP, UP + DOOR_H]]);
    K.doorU(-14.25, 34, UP);
    K.plate(25, -14.5, 36.4, -11.6, UP);
    K.alongU(-11.35, 25.5, 36.9, UP - SLAB, TOP);
    K.alongZ(36.65, -14, -11.1, UP - SLAB, TOP);
    K.roof(25.5, -14, 36.9, -11.1, TOP);
    K.locker(37, -15.2, UP);
    for (const [u, z] of [[36, -21], [38.5, -28], [41.5, -24], [36, -30], [41.5, -30]]) K.spawn(u, z, UP, 0, 1);
    K.noBuild(33.8, -32.5, 43.1, -14.5);
    K.label(38.5, UP + 2.2, -22, '17. Боковая душевая');
    K.label(30, UP + 2.2, -12.8, 'Заслонка на бастион');
  }

  function spiral(K) {
    K.plate(37, 8, 46.4, 10.4, UP);
    K.alongU(7.75, 37.5, 43.5, UP - SLAB, TOP);
    K.alongU(10.65, 37.5, 46.9, UP - SLAB, SPIRAL_ROOF);
    K.roof(37.5, 7.5, 43.5, 10.9, TOP);
    K.stairs(44, -3.4, 46.4, 8, LEG_HIGH, UP, 'z+');
    K.plate(44, -5.8, 46.4, -3.4, LEG_HIGH);
    K.stairs(46.4, -5.8, 52, -3.4, LEG_MID, LEG_HIGH, 'u-');
    K.plate(52, -5.8, 54.4, -3.4, LEG_MID);
    K.stairs(52, -3.4, 54.4, 11.5, LOW, LEG_MID, 'z-');
    K.alongZ(43.75, -6.3, 7.75, LEG_HIGH - SLAB, SPIRAL_ROOF);
    K.alongZ(46.65, -3.15, 10.9, LEG_HIGH - SLAB, SPIRAL_ROOF);
    K.alongU(-6.05, 43.5, 54.9, LEG_MID - SLAB, SPIRAL_ROOF);
    K.alongU(-3.15, 46.9, 51.5, LEG_MID - SLAB, SPIRAL_ROOF);
    K.alongZ(51.75, -3.15, 11.5, LOW, SPIRAL_ROOF);
    K.alongZ(54.65, -6.3, 11.5, LOW, SPIRAL_ROOF);
    K.roof(43.5, -6.3, 54.9, 10.9, SPIRAL_ROOF);
    K.health(42.5, 9.7, 0.2, UP);
    K.ammo(42.5, 8.7, 0.2, UP);
    K.label(40, UP + 1.6, 9.2, '11. Спираль');
    K.label(53.2, LOW + 2.2, 9, 'Подвал');
  }

  function stairsDown(K) {
    K.stairs(50.5, 24, 75, 26.4, LOW, G, 'u-');
    K.alongU(23.75, 50.5, 75, LOW, STAIRS_ROOF);
    K.alongU(26.65, 50.5, 77.9, LOW, STAIRS_ROOF);
    K.roof(50.5, 23.5, 77.9, 26.9, STAIRS_ROOF);
    K.plate(75, 14, 77.4, 26.4, LOW);
    K.alongU(23.75, 75, 77.9, LOW + 3, STAIRS_ROOF);
    K.alongZ(77.65, 13.5, 26.9, LOW, LOW + 3, [[18, 20.4, LOW, LOW + DOOR_H]]);
    K.alongZ(77.65, 23.5, 26.9, LOW + 3, STAIRS_ROOF);
    K.alongU(13.75, 75, 77.9, LOW, LOW + 3);
    K.alongZ(75.25, 18.5, 23.5, LOW, LOW + 3);
    K.roof(75, 13.5, 77.9, 23.5, LOW + 3);
    K.label(53, 2, 25.2, '12. Лестница');
    K.label(76.2, LOW + 2.2, 15.8, 'Подвал');
    K.label(76.2, LOW + 2.2, 19.2, 'Кладовка');
  }

  function basement(K) {
    K.plate(51.5, 11.5, 75.5, 18.5, LOW);
    K.alongU(11.75, 51.5, 75.5, LOW, BASE_ROOF, [[52, 54.4, LOW, LOW + 2.8], [55.4, 57.8, LOW, LOW + 2.8], [72.5, 74.9, LOW, LOW + 2.8]]);
    K.alongU(18.25, 51.5, 75.5, LOW, BASE_ROOF);
    K.alongZ(51.75, 11.5, 18.5, LOW, BASE_ROOF);
    K.alongZ(75.25, 11.5, 18.5, LOW, BASE_ROOF, [[14.5, 16.9, LOW, LOW + DOOR_H]]);
    K.roof(51.5, 11.5, 75.5, 18.5, BASE_ROOF);
    K.health(62.5, 15, 0.5, LOW);
    K.ammo(65, 15, 0.5, LOW);
    K.label(63.5, LOW + 2.4, 13, '13. Подвал');
    K.label(56.6, LOW + 2.8, 12.2, 'К ВЕНТИЛЮ');
    K.label(73.7, LOW + 2.8, 12.2, 'К ВЕНТИЛЮ');
    K.label(53.2, LOW + 2.8, 12.2, 'Спираль наверх');
  }

  function pantry(K) {
    K.plate(77.4, 15, 86, 24, LOW);
    K.alongZ(86.25, 14.5, 24.5, LOW, -2);
    K.alongU(14.75, 77.9, 86.5, LOW, -2);
    K.alongU(24.25, 77.9, 86.5, LOW, -2);
    K.roof(77.9, 14.5, 86.5, 24.5, -2);
    K.doorZ(77.65, 18, LOW);
    K.locker(84.5, 19.5, LOW);
    K.label(82, LOW + 2, 19.5, '15. Кладовка');
  }

  function corridors(K) {
    K.plate(55.4, -7, 57.8, 11.5, LOW);
    K.alongZ(55.15, -7.5, 11.5, LOW, LOW_ROOF);
    K.alongZ(58.25, 1, 11.5, LOW, LOW_ROOF);
    K.alongU(-7.25, 54.9, 58, LOW, LOW_ROOF);
    K.roof(54.9, -7.5, 58.5, 11.5, LOW_ROOF);
    K.plate(72.5, -7, 74.9, 11.5, LOW);
    K.alongZ(75.15, -7.5, 11.5, LOW, LOW_ROOF);
    K.alongZ(72.25, 1, 11.5, LOW, LOW_ROOF);
    K.alongU(-7.25, 72.5, 75.4, LOW, LOW_ROOF);
    K.roof(72, -7.5, 75.4, 11.5, LOW_ROOF);
  }

  function warRoom(K) {
    const shell = { col: false, grid: false };
    K.box(46, LOW - 1.5, -34, 84, LOW - 1.2, -14.5, 'roof', shell);
    K.box(46, TOP, -34, 84, TOP + 0.3, -14.5, 'roof', shell);
    K.box(45.7, LOW - 1.5, -34.3, 46, TOP, -14.5, 'wall', shell);
    K.box(84, LOW - 1.5, -34.3, 84.3, TOP, -14.5, 'wall', shell);
    K.box(45.7, LOW - 1.5, -34.3, 84.3, TOP, -34, 'wall', shell);
    for (const z of [-30, -25, -20]) {
      K.box(50, LOW - 1.2, z, 62, LOW - 0.4, z + 1, 'block', shell);
      K.box(68, LOW - 1.2, z, 80, LOW - 0.4, z + 1, 'block', shell);
    }
    K.box(52, LOW + 0.5, -33.9, 78, LOW + 5, -33.7, 'mark', shell);
    K.box(46, LOW - 1.5, -14.8, 58, TOP, -14.5, 'wall', shell);
    K.box(72.5, LOW - 1.5, -14.8, 84, TOP, -14.5, 'wall', shell);
  }

  function control(B, K) {
    K.plate(58, -14, 72.5, 1, LOW);
    K.alongZ(58.25, -14.5, 1, LOW, -SLAB, [[-7, -4.6, LOW, LOW + DOOR_H]]);
    K.alongZ(72.25, -14.5, 1, LOW, -SLAB, [[-7, -4.6, LOW, LOW + DOOR_H]]);
    K.alongU(-14.25, 58, 72.5, LOW, -SLAB, [[60, 70, LOW + 1.2, LOW + 3.6]]);
    K.alongU(0.75, 58, 72.5, LOW, -SLAB);
    K.roof(58, -14.5, 72.5, 1, -SLAB);
    B.solid(K.X(60), LOW + 1.2, K.Z(-14.5), K.X(70), LOW + 3.6, K.Z(-14), { offGrid: true });
    K.box(63.8, LOW, -6.3, 65.2, LOW + 0.9, -5.3, 'brass');
    K.box(59.5, LOW, -12, 62, LOW + 1.4, -10.8, 'block');
    K.box(67, LOW, -12, 69.5, LOW + 1.4, -10.8, 'block');
    K.box(59.5, LOW, -1, 61.5, LOW + 1.4, 0.2, 'block');
    K.box(67.5, LOW, -1, 69.5, LOW + 1.4, 0.2, 'block');
    K.box(63.1, LOW, -2.9, 65.9, LOW + 0.03, -0.1, 'brass', { col: false, grid: false });
    B.flag(K.team, K.X(64.5), LOW + 0.9, K.Z(-5.8));
    B.capture(K.team, K.X(64.5), LOW, K.Z(-1.5), 1.6);
    K.noBuild(62.9, -3.1, 66.1, 0.1);
    K.noBuild(63.3, -6.8, 65.7, -4.8);
    K.label(64.5, LOW + 2, -5.8, '14. Диспетчерская: вентиль');
    K.label(64.5, LOW + 1, -1.5, 'Распределитель');
  }

  function sewers(K) {
    K.plate(CANAL, -7.2, 16, -4.8, TUN);
    K.plate(CANAL, 4.8, 16, 7.2, TUN);
    K.alongU(-7.45, CANAL + 0.5, 15.5, TUN, TUN_ROOF);
    K.alongU(-4.55, CANAL + 0.5, 15.5, TUN, TUN_ROOF);
    K.alongU(4.55, CANAL + 0.5, 15.5, TUN, TUN_ROOF);
    K.alongU(7.45, CANAL + 0.5, 18.9, TUN, TUN_ROOF);
    K.plate(16, -22.4, 18.4, 7.2, TUN);
    K.alongZ(15.75, -22.9, 7.7, TUN, TUN_ROOF, [[-7.2, -4.8, TUN, TUN_PASS], [4.8, 7.2, TUN, TUN_PASS]]);
    K.alongZ(18.65, -19.5, 7.7, TUN, TUN_ROOF);
    K.plate(18.4, -22.4, 30.4, -20, TUN);
    K.alongU(-19.75, 18.9, 28, TUN, TUN_ROOF);
    K.alongU(-22.65, 15.5, 30.9, TUN, TUN_ROOF);
    K.roof(19, -23, 31, -19.5, TUN_ROOF);
    K.stairs(28, -20, 30.4, -3.5, TUN, G, 'z+');
    K.alongZ(27.75, -20, -3, TUN, ROOM_ROOF);
    K.alongZ(30.65, -20, -3, TUN, ROOM_ROOF);
    K.roof(27.5, -20, 30.9, -3.5, ROOM_ROOF);
    K.plate(30.4, -26, 36, -19.5, TUN);
    K.alongZ(30.65, -26.5, -22.4, TUN, TUN_ROOF);
    K.alongU(-26.25, 30.4, 36.5, TUN, TUN_ROOF);
    K.alongZ(36.25, -26.5, -19, TUN, TUN_ROOF);
    K.alongU(-19.25, 30.9, 36.5, TUN, TUN_ROOF);
    K.roof(30.4, -26.5, 36.5, -19, TUN_ROOF);
    K.health(34.5, -24.5, 0.5, TUN);
    K.ammo(34.5, -21, 0.5, TUN);
    K.label(17.2, TUN + 2.2, -8, '18. Служебные тоннели');
    K.label(33, TUN + 2.2, -23, '19. Комната при тоннелях');
    K.label(29.2, TUN + 2.2, -18, 'Наверх: вестибюль');
    K.label(CANAL + 1.6, TUN + 2.2, -6, 'Лаз в тоннели');
    K.label(CANAL + 1.6, TUN + 2.2, 6, 'Лаз в тоннели');
  }

  function clips(K) {
    K.clip(25.5, CLIP_FORT, -HALF_Z, 34, HALF_Z);
    K.clip(50, CLIP_FORT, -HALF_Z, 88, HALF_Z);
    K.clip(34, CLIP_FORT, -HALF_Z, 50, 14.5);
    K.clip(34, CLIP_FORT, 29.5, 50, HALF_Z);
    K.clip(BRIDGE, ROCK_TOP, 16, 25.5, HALF_Z);
    K.clip(BRIDGE, ROCK_TOP, -HALF_Z, 25.5, -16);
  }

  function orders(K, foe) {
    const team = K.team;
    for (const [u, z] of [[70.5, -9], [59.7, -3], [70.5, -3], [59.7, -9]]) K.post('guard', u, z, LOW);
    for (const [u, z] of [[11.5, -5], [11.5, 5], [13, 0], [16, -11], [16, 11]]) K.post('bridge', u, z, G);
    for (const z of [-11, 11]) K.post('bridge', 19.5, z, UP);
    K.post('mouth', CANAL + 1.6, -6, TUN);
    K.hint('sentry', team, 70, LOW, -2, -1, 0);
    K.hint('sentry', team, 59.6, LOW, -8, 1, 0);
    K.hint('sentry', team, 46, G, 18.5, -1, 0);
    K.hint('sniper', team, 19, UP, -3, -1, 0);
    K.hint('sniper', team, 19, UP, 3, -1, 0);
    K.hint('sniper', team, 19.5, UP, -13, -1, 0);
    K.hint('sticky', team, 64.5, LOW, -8.5, 0, 1);
    K.hint('sticky', team, 31, G, 0, -1, 0);
    K.hint('flank', foe, CANAL + 1.6, TUN, -6, 1, 0);
    K.hint('flank', foe, 17.2, TUN, 0, 0, -1);
    K.hint('charge', foe, 51.5, -0.3, 25.2, 1, 0);
    K.hint('charge', team, 15, G, 0, -1, 0);
    K.hint('ambush', team, 27.5, G, 13, 1, 0);
    K.hint('ambush', team, 26, G, -2.2, 1, 0);
    K.hint('jump', team, 14, G, 6, 1, 0);
    K.hint('jump', team, 12, G, 0, -1, 0);
  }

  function fort(B, side, team) {
    const K = kit(B, side, team);
    K.gate = u => B.gate(K.X(u), K.Z(32), K.X(u + DOOR), K.Z(32), DOOR_H, K.toward('z-'));
    facade(K);
    battlements(K);
    lobby(K);
    grate(K);
    hallway(K);
    sideRoom(K);
    upstairs(K);
    courtyard(K);
    mainShower(K);
    sideShower(K);
    spiral(K);
    stairsDown(K);
    basement(K);
    pantry(K);
    corridors(K);
    warRoom(K);
    control(B, K);
    sewers(K);
    clips(K);
    orders(K, T.enemyOf(team));
  }

  function bridge(B) {
    B.box(-BRIDGE, -SLAB, -3, BRIDGE, G, 3, 'plate');
    B.ground(-BRIDGE, -3, BRIDGE, 3, 3.5, [[-5.25, -1, -4.75, 1], [-0.25, -1, 0.25, 1], [4.75, -1, 5.25, 1]], 'roof', { t: 0.4, offGrid: true });
    for (const x of [-9.6, -5, 0, 5, 9.6]) {
      for (const z of [-2.8, 2.8]) B.box(x - 0.2, G, z - 0.2, x + 0.2, 3.1, z + 0.2, 'wall');
    }
    B.label(0, 2, -2.2, '1. Мост');
  }

  function canal(B) {
    B.water(-CANAL, -CANAL_Z, CANAL, CANAL_Z, WATER_FLOOR, WATER_TOP);
    B.box(-CANAL, WATER_FLOOR - 1, -CANAL_Z, CANAL, WATER_FLOOR, CANAL_Z, 'ground');
    B.box(-BRIDGE, WATER_FLOOR - 1, CANAL_Z, BRIDGE, ROCK_TOP, HALF_Z, 'block');
    B.box(-BRIDGE, WATER_FLOOR - 1, -HALF_Z, BRIDGE, ROCK_TOP, -CANAL_Z, 'block');
    B.solid(-BRIDGE, ROCK_TOP, CANAL_Z, BRIDGE, CLIP_TOP, HALF_Z, { nobul: true, offGrid: true });
    B.solid(-BRIDGE, ROCK_TOP, -HALF_Z, BRIDGE, CLIP_TOP, -CANAL_Z, { nobul: true, offGrid: true });
    B.label(0, WATER_TOP + 1, 6, '2. Канал');
  }

  T.MAPS['2fort'] = {
    name: '2Fort',
    build(B) {
      bridge(B);
      canal(B);
      fort(B, 1, 'hot');
      fort(B, -1, 'cold');
      B.bounds(-HALF_X, -HALF_Z, HALF_X, HALF_Z);
      B.killY(-14);
    }
  };

  if (typeof module !== 'undefined') module.exports = T;
})(globalThis.Tf98 = globalThis.Tf98 || {});
