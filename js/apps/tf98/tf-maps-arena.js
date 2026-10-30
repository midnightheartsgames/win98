(function (T) {
  'use strict';
  const X = 45, Z = 24;
  const EAST = Math.PI / 2, WEST = -Math.PI / 2;
  const TIER = 3.4;
  const DECK = 0.3;
  const ROOM_X = 34, ROOM_Z = 9, ROOM_H = 5;
  const RAMP_X = 26, RAMP_Z = 16, LANE_Z = 10;
  const DOOR_W = 2.4, DOOR_H = 2.6, DOOR_Z = 5.5;

  function room(B, sign, team, yaw) {
    const front = sign * ROOM_X, back = sign * X;
    const x0 = Math.min(front, back), x1 = Math.max(front, back);
    const north = ROOM_Z + DOOR_Z - DOOR_W, south = ROOM_Z - DOOR_Z;
    B.wall(front, -ROOM_Z, front, ROOM_Z, ROOM_H, 0.5, 'wall', { holes: [[south, south + DOOR_W, 0, DOOR_H], [north, north + DOOR_W, 0, DOOR_H]] });
    B.door(front, -DOOR_Z, front, -DOOR_Z + DOOR_W, DOOR_H, team);
    B.door(front, DOOR_Z - DOOR_W, front, DOOR_Z, DOOR_H, team);
    B.wall(x0, -ROOM_Z, x1, -ROOM_Z, ROOM_H, 0.5, 'wall');
    B.wall(x0, ROOM_Z, x1, ROOM_Z, ROOM_H, 0.5, 'wall');
    B.box(x0, ROOM_H, -ROOM_Z, x1, ROOM_H + 0.3, ROOM_Z, 'roof');
    B.box(x0, 0, ROOM_Z, x1, ROOM_H, Z, 'block');
    B.box(x0, 0, -Z, x1, ROOM_H, -ROOM_Z, 'block');
    B.locker(sign * (X - 3), 6, 0);
    B.locker(sign * (X - 3), -6, 0);
    for (const [ox, oz] of [[6, 0], [6, 3], [6, -3], [3, 1.5], [3, -1.5], [8, 1.5], [8, -1.5]]) {
      B.spawn(team, sign * (X - ox), oz, yaw, 0);
    }
    B.noBuild(x0, -ROOM_Z, x1, ROOM_Z);
    B.label(sign * (ROOM_X + 4), 3.2, 0, 'Душевая: ' + T.TEAMS[team].name);
  }

  function tier(B, sign) {
    const lane = sign * LANE_Z, ramp = sign * RAMP_Z, far = sign * Z;
    B.box(-RAMP_X, 0, Math.min(lane, far), RAMP_X, TIER, Math.max(lane, far), 'block');
    for (const side of [-1, 1]) {
      const a = Math.min(side * ROOM_X, side * RAMP_X), b = Math.max(side * ROOM_X, side * RAMP_X);
      B.box(a, 0, Math.min(ramp, far), b, TIER, Math.max(ramp, far), 'block');
      B.stairs(a, Math.min(lane, ramp), b, Math.max(lane, ramp), 0, TIER, side < 0 ? 'x+' : 'x-', 'plate');
    }
  }

  T.MAPS.arena = {
    name: 'Арена',
    build(B) {
      B.ground(-X, -Z, X, Z, 0, [], 'ground');
      B.wall(-X, -Z, X, -Z, 12, 1, 'wall');
      B.wall(-X, Z, X, Z, 12, 1, 'wall');
      B.wall(-X, -Z, -X, Z, 12, 1, 'wall');
      B.wall(X, -Z, X, Z, 12, 1, 'wall');
      room(B, -1, 'hot', EAST);
      room(B, 1, 'cold', WEST);
      tier(B, -1);
      tier(B, 1);
      B.box(-3, TIER - DECK, -LANE_Z, 3, TIER, LANE_Z, 'plate');
      for (const x of [-2.5, 2.5]) B.box(x - 0.25, 0, -0.25, x + 0.25, TIER - DECK, 0.25, 'wall');
      for (const [x, z, w, d, h] of [
        [-19, 0, 4, 1.2, 1.2], [19, 0, 4, 1.2, 1.2], [-13, -6, 1.2, 4, 1.2], [13, 6, 1.2, 4, 1.2],
        [-13, 6, 2, 2, 2.4], [13, -6, 2, 2, 2.4], [-26, -5, 1.2, 1.2, 1.2], [26, 5, 1.2, 1.2, 1.2]
      ]) {
        B.block(x, z, w, d, h, 'block');
      }
      for (const [x, z, w, d, h] of [[-16, 16, 1.2, 4, 1.2], [16, -16, 1.2, 4, 1.2], [-6, -16, 4, 1.2, 1.2], [6, 16, 4, 1.2, 1.2]]) {
        B.block(x, z, w, d, h, 'block', { y: TIER });
      }
      B.pickupAt('health', 0, 0, 1, 0);
      B.pickupAt('ammo', 0, 4, 0.5, 0);
      B.pickupAt('ammo', 0, -4, 0.5, 0);
      for (const [x, z] of [[-22, 7], [22, -7], [-22, -7], [22, 7]]) B.health(x, z, 0.2);
      for (const x of [-29, 29]) B.ammo(x, 0, 0.5);
      for (const [x, z] of [[-20, 18], [20, 18], [-20, -18], [20, -18]]) B.health(x, z, 0.5);
      for (const z of [18, -18]) B.ammo(0, z, 0.5);
      B.roam(0, 0, 0);
      B.roam(0, 0, TIER);
      for (const [x, z] of [[-16, 3], [16, -3], [-20, 17], [20, 17], [-20, -17], [20, -17], [0, 17], [0, -17]]) B.roam(x, z);
      B.bounds(-X, -Z, X, Z);
      B.killY(-12);
    }
  };

  if (typeof module !== 'undefined') module.exports = T;
})(globalThis.Tf98 = globalThis.Tf98 || {});
