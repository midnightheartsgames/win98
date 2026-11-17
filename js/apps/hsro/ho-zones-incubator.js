(function (HO) {
  'use strict';

  function incubatorZone() {
    const z = HO.zoneBuilder();
    z.room(-10, 44, 10, 58, [{ s: 'n', c: 0, w: 6 }]);
    z.room(-14, 14, 14, 44, [{ s: 's', c: 0, w: 6 }, { s: 'n', c: 0, w: 6 }]);
    z.room(-16, -16, 16, 14, [{ s: 's', c: 0, w: 6 }, { s: 'n', c: 0, w: 6 }]);
    z.room(-14, -46, 14, -16, [{ s: 's', c: 0, w: 6 }, { s: 'n', c: 0, w: 6 }]);
    z.room(-16, -78, 16, -46, [{ s: 's', c: 0, w: 6 }, { s: 'n', c: 0, w: 6 }]);
    z.room(-14, -108, 14, -78, [{ s: 's', c: 0, w: 6 }, { s: 'n', c: 0, w: 6 }]);
    z.room(-20, -144, 20, -108, [{ s: 's', c: 0, w: 6 }]);
    for (const zz of [30, -30, -92]) { z.box(-13, 0, zz - 2, -10, 2.6, zz + 2, 'tank'); z.box(10, 0, zz - 2, 13, 2.6, zz + 2, 'tank'); }
    z.box(-15, 0, -76, -11, 1.2, -72, 'tank');
    z.box(11, 0, -76, 15, 1.2, -72, 'tank');
    const pack = (id, lvl, x, zz, p) => ({ id, lvl, x, z: zz, pack: p });
    return {
      id: 'incubator',
      name: 'Станция «Герта»: Инкубатор',
      absolute: true,
      instance: true,
      foeHp: 3,
      foeAtk: 1.25,
      creditMul: 0.15,
      spawn: { x: 0, y: 0, z: 52, yaw: 0 },
      fog: { color: '#081812', near: 30, far: 90 },
      boxes: z.boxes,
      areas: [
        { id: 'lock', name: 'Шлюз Инкубатора', x0: -10, z0: 44, x1: 10, z1: 58 },
        { id: 'nursery', name: 'Питомник', x0: -14, z0: 14, x1: 14, z1: 44 },
        { id: 'warden', name: 'Зал Смотрителя', x0: -16, z0: -16, x1: 16, z1: 14 },
        { id: 'cultures', name: 'Коридор культур', x0: -14, z0: -46, x1: 14, z1: -16 },
        { id: 'vat', name: 'Чан культуры', x0: -16, z0: -78, x1: 16, z1: -46 },
        { id: 'roost', name: 'Гнездовье', x0: -14, z0: -108, x1: 14, z1: -78 },
        { id: 'cradle', name: 'Колыбель Скаракабаза', x0: -20, z0: -144, x1: 20, z1: -108 }
      ],
      rest: [],
      medpoints: [{ x: 0, z: 50 }],
      anchors: [],
      npcs: [],
      objects: [
        { id: 'dungeon_beacon', name: 'Маяк вызова напарников', look: 'beacon', x: -6, z: 46, act: 'party', dungeon: true },
        { id: 'incubator_exit', name: 'Лифт в Распределительный центр', look: 'lift', x: 6, z: 54, act: 'travel', zone: 'seclusion', to: { x: 12, z: -10, yaw: 0 } }
      ],
      foes: [
        pack('juvsting', 9, -6, 34, 'a'), pack('juvsting', 9, -3, 36, 'a'),
        pack('gnawsting', 9, 6, 26, 'b'), pack('juvsting', 9, 8, 23, 'b'),
        pack('juvsting', 10, -6, 19, 'c'), pack('gnawsting', 9, -8, 16, 'c'),
        pack('juvsting', 9, 8, 38, 'j'), pack('juvsting', 9, 10, 36, 'j'),
        { id: 'warden', lvl: 10, x: 0, z: -2, yaw: 3.14 },
        pack('gnawsting', 9, -6, -24, 'd'), pack('gnawsting', 9, -3, -22, 'd'),
        pack('juvsting', 10, 7, -31, 'e'), pack('juvsting', 10, 9, -34, 'e'),
        pack('gnawsting', 10, -6, -40, 'f'), pack('juvsting', 9, -8, -42, 'f'),
        pack('juvsting', 9, 9, -20, 'k'), pack('gnawsting', 9, 10, -22, 'k'),
        { id: 'culture', lvl: 10, x: 0, z: -64 },
        pack('gnawsting', 10, -6, -86, 'g'), pack('gnawsting', 10, -3, -88, 'g'),
        pack('juvsting', 10, 7, -95, 'h'), pack('gnawsting', 10, 9, -98, 'h'),
        pack('juvsting', 10, -6, -103, 'i'), pack('juvsting', 10, -8, -101, 'i'),
        pack('gnawsting', 10, 8, -84, 'l'), pack('juvsting', 10, 10, -82, 'l'),
        { id: 'skaracabaz', lvl: 10, x: 0, z: -128, yaw: 3.14 }
      ]
    };
  }

  HO.ZONES.incubator = incubatorZone();
  HO.WORLD_ZONES.push('incubator');
  HO.BOSSES = ['warden', 'culture', 'skaracabaz'];

  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
