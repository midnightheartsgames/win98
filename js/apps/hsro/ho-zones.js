(function (HO) {
  'use strict';
  const box = (x0, y0, z0, x1, y1, z1, kind) => [x0, y0, z0, x1, y1, z1, kind];

  const showcase = [], posts = [];
  for (let i = 0; i < 4; i++) {
    showcase.push({ model: 'kit_wall', x: -14 + i * 4, y: 0, z: 14.6, yaw: 0 });
    showcase.push({ model: 'kit_floor', x: -14 + i * 4, y: 0.012, z: 13, yaw: 0 });
  }
  for (let i = 0; i < 5; i++) {
    showcase.push({ model: 'kit_pillar', x: -16 + i * 4, y: 0, z: 14.6, yaw: 0 });
    posts.push(box(-16.4 + i * 4, 0, 14.2, -15.6 + i * 4, 4, 15, 'hidden'));
  }

  const stairs = [];
  for (let i = 0; i < 5; i++) stairs.push(box(8 + i * 0.8, 0, -6, 8.8 + i * 0.8, 0.3 * (i + 1), -2, 'step'));

  HO.ZONES = {
    greybox: {
      id: 'greybox',
      name: 'Серая комната',
      spawn: { x: 0, y: 0, z: 12.5, yaw: 0 },
      fog: { color: '#0b1430', near: 28, far: 75 },
      boxes: [
        box(-21, -1, -16, 21, 0, 16, 'floor'),
        box(-21, 0, -16, 21, 6, -15, 'wall'),
        box(-21, 0, 15, 21, 6, 16, 'wall'),
        box(-21, 0, -15, -20, 6, 15, 'wall'),
        box(20, 0, -15, 21, 6, 15, 'wall'),
        box(-12, 0, -9, -10.5, 6, -7.5, 'pillar'),
        box(-12, 0, 6, -10.5, 6, 7.5, 'pillar'),
        box(-4, 0, -9, -2.5, 6, -7.5, 'pillar'),
        box(-4, 0, 6, -2.5, 6, 7.5, 'pillar'),
        ...stairs,
        box(12, 0, -6, 19, 1.5, 4, 'block'),
        box(-16, 0, -2, -14, 1, 0, 'crate'),
        box(-16, 0, 2, -14, 2.2, 4, 'crate'),
        ...posts
      ],
      decor: showcase,
      npcs: [
        { id: 'terminal', name: 'Учебный терминал добровольца', role: 'trainer', look: 'terminal', x: 4, z: 12, yaw: 4.71, r: 0.6, h: 1.6 }
      ],
      foes: [
        { id: 'baryon', x: -7, z: 1 },
        { id: 'baryon', x: -16, z: 9 },
        { id: 'antibaryon', x: 6, z: 0 },
        { id: 'reaver', x: 6, z: -11 },
        { id: 'flamespawn', x: 14, z: 10 },
        { id: 'eliminator', x: -16, z: -12 },
        { id: 'distorter', x: -6, z: -12.5, pack: 'b' },
        { id: 'weaver', x: -8.5, z: -12.5, pack: 'b' },
        { id: 'trampler', x: 16.5, z: -3, yaw: 4.71 }
      ]
    }
  };

  const room = [];
  for (let i = 0; i < 3; i++) {
    room.push({ model: 'kit_wall', x: -4 + i * 4, y: 0, z: -2.5, yaw: HO.PI });
    room.push({ model: 'kit_floor', x: -4 + i * 4, y: 0.012, z: -0.5, yaw: 0 });
    room.push({ model: 'kit_floor', x: -4 + i * 4, y: 0.012, z: 3.5, yaw: 0 });
  }
  for (let i = 0; i < 4; i++) room.push({ model: 'kit_pillar', x: -6 + i * 4, y: 0, z: -2.5, yaw: HO.PI });
  HO.ZONES.showroom = {
    id: 'showroom',
    name: 'Приёмный центр',
    spawn: { x: 0, y: 0, z: 0, yaw: HO.PI },
    fog: { color: '#0b1430', near: 14, far: 40 },
    boxes: [box(-8, -1, -3, 8, 0, 6, 'hidden')],
    decor: room
  };

  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
