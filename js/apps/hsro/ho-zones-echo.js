(function (HO) {
  'use strict';

  function echoZone() {
    const z = HO.zoneBuilder();
    z.room(-24, -32, 24, 32, []);
    z.box(14, 0, -18, 23, 7, 14, 'ship');
    z.box(12, 0, -4, 14, 0.4, 4, 'ramp');
    z.box(-22, 0, 12, -17, 1.4, 16, 'crate');
    z.box(-22, 0, -20, -18, 1.4, -16, 'crate');
    z.box(-6, 0, -31, 6, 3, -29, 'machine');
    return {
      id: 'echo',
      name: 'Эхо войны: перрон Зоны поддержки',
      absolute: true,
      instance: true,
      creditMul: 0.15,
      spawn: { x: 0, y: 0, z: 25, yaw: 0 },
      fog: { color: '#1a0a24', near: 30, far: 85 },
      boxes: z.boxes,
      areas: [{ id: 'perron', name: 'Перрон в ночь нападения', x0: -24, z0: -32, x1: 24, z1: 32 }],
      rest: [],
      medpoints: [{ x: 0, z: 28 }],
      anchors: [],
      npcs: [],
      objects: [
        { id: 'echo_beacon', name: 'Маяк вызова напарников', look: 'beacon', x: -5, z: 27, act: 'party', dungeon: true },
        { id: 'echo_exit', name: 'Выход из Виртуальной вселенной', look: 'panel', x: 5, z: 31.4, act: 'travel', zone: 'control', to: { x: -7, z: -36, yaw: 3.14 } }
      ],
      foes: [{ id: 'doomsday', lvl: 10, x: 0, z: -14, yaw: 3.14 }]
    };
  }

  HO.ZONES.echo = echoZone();
  HO.WORLD_ZONES.push('echo');
  HO.BOSSES.push('doomsday');
  HO.ZONES.control.objects.push({ id: 'vu_machine', name: 'Машина Виртуальной вселенной', look: 'terminal', x: -7, z: -38.6, act: 'travel', opensFor: 'k_echo', zone: 'echo', to: { x: 0, z: 25, yaw: 0 }, deny: 'Машина просит допуск. Кукла Герты даёт его героям 10-го уровня' });

  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
