(function (HO) {
  'use strict';
  const person = HO.personLook;

  function seclusionZone() {
    const z = HO.zoneBuilder();
    z.room(26, -9, 44, 9, [{ s: 'w', c: 0, w: 6 }]);
    z.hall('x', 20, 26, 0, 6);
    z.room(-20, -20, 20, 20, [{ s: 'n', c: 0, w: 6 }, { s: 's', c: 0, w: 6 }, { s: 'e', c: 0, w: 6 }, { s: 'w', c: 0, w: 6 }]);
    z.hall('z', -26, -20, 0, 6);
    z.room(-18, -56, 18, -26, [{ s: 's', c: 0, w: 6 }]);
    z.hall('x', -26, -20, 0, 6);
    z.room(-50, -14, -26, 14, [{ s: 'e', c: 0, w: 6 }]);
    z.hall('z', 20, 26, 0, 6);
    z.room(-30, 26, 30, 56, [{ s: 'n', c: 0, w: 6 }]);
    z.box(-16, 0, -34, -13, 3.2, -30, 'tank');
    z.box(13, 0, -34, 16, 3.2, -30, 'tank');
    z.box(-3, 0, -50, 3, 3.2, -48, 'tank');
    for (const [x0, x1] of [[-24, -6], [6, 24]]) for (const zz of [34, 46]) z.box(x0, 0, zz, x1, 0.9, zz + 2, 'planter');
    z.box(-49, 0, -6, -48, 2.2, 6, 'cabinet');
    z.box(30, 0, 7, 36, 1.1, 8, 'desk');
    return {
      id: 'seclusion',
      name: 'Станция «Герта»: Изолированная зона',
      absolute: true,
      spawn: { x: 36, y: 0, z: 0, yaw: 4.71 },
      fog: { color: '#0a1a1c', near: 36, far: 100 },
      boxes: z.boxes,
      areas: [
        { id: 'gate', name: 'Пост у входа', x0: 26, z0: -9, x1: 44, z1: 9 },
        { id: 'center', name: 'Распределительный центр', x0: -20, z0: -20, x1: 20, z1: 20 },
        { id: 'nutrient', name: 'Питательная среда', x0: -18, z0: -56, x1: 18, z1: -26 },
        { id: 'pharma', name: 'Фармацевтический кабинет', x0: -50, z0: -14, x1: -26, z1: 14 },
        { id: 'green', name: 'Теплицы', x0: -30, z0: 26, x1: 30, z1: 56 }
      ],
      rest: [],
      medpoints: [{ x: 32, z: 4 }],
      anchors: [{ id: 'seclusion_center', name: 'Распределительный центр', x: 14, z: 0 }, { id: 'seclusion_nutrient', name: 'Питательная среда', x: 0, z: -30 }, { id: 'seclusion_pharma', name: 'Фармацевтический кабинет', x: -29, z: 0 }],
      npcs: [
        { id: 'herta_puppet2', name: 'Кукла Герты', role: 'quest', look: person('#5a4a8a', '#c8b0e8', '#f4e4f0'), x: 38, z: -5, yaw: 4.71, greet: 'Ещё одна кукла. «Да, я везде. Нет, это не одна и та же. Да, обе слушают. Говори по делу».' },
        { id: 'beanpaste', name: 'Дымчатая Бобовая Паста', role: 'quest', look: 'creature', x: 0, z: 31, yaw: 3.14, r: 0.5, h: 0.9, greet: 'Тёмное круглое создание с листиком на макушке. Пахнет жареными бобами. Смотрит на вас и ждёт.' }
      ],
      objects: [
        { id: 'seclusion_exit', name: 'Дверь во второй этаж Зоны хранения', look: 'panel', x: 43.4, z: 0, act: 'travel', zone: 'storage2', to: { x: -26, z: 0, yaw: 1.57 } },
        { id: 'incubator_lift', name: 'Лифт в Инкубатор', look: 'lift', x: 12, z: -14, act: 'travel', opensFor: 'i_incubator', zone: 'incubator', to: { x: 0, z: 52, yaw: 0 }, deny: 'Лифт в Инкубатор заперт. Кукла Герты пустит туда только группу' },
        { id: 'party_beacon', name: 'Маяк вызова напарников', look: 'beacon', x: -6, z: -27.4, act: 'party', group: ['i_swarm'] },
        { id: 'rec_center', name: 'Терминал записей', look: 'panel', x: -19.4, z: -14 },
        { id: 'rec_nutrient', name: 'Терминал записей', look: 'panel', x: -17.4, z: -28 },
        { id: 'rec_green', name: 'Терминал записей', look: 'panel', x: 29.4, z: 33 },
        { id: 'serum_box', name: 'Шкаф с сыворотками', look: 'crate', x: -47, z: -10, give: 'serum', respawn: 45 },
        { id: 'serum_box', name: 'Шкаф с сыворотками', look: 'crate', x: -47, z: 10, give: 'serum', respawn: 45 },
        { id: 'serum_box', name: 'Шкаф с сыворотками', look: 'crate', x: -38, z: -12.5, give: 'serum', respawn: 45 },
        { id: 'serum_box', name: 'Шкаф с сыворотками', look: 'crate', x: -38, z: 12.5, give: 'serum', respawn: 45 },
        { id: 'creature_a', name: 'Встревоженное создание', look: 'creature', x: -26, z: 30, calm: true },
        { id: 'creature_b', name: 'Встревоженное создание', look: 'creature', x: -2, z: 54, calm: true },
        { id: 'creature_c', name: 'Встревоженное создание', look: 'creature', x: -26, z: 54, calm: true },
        { id: 'nest', name: 'Гнездо Роя', look: 'nest', x: -27, z: 41, respawn: 60, ambush: ['juvsting', 9] },
        { id: 'nest', name: 'Гнездо Роя', look: 'nest', x: 27, z: 52, respawn: 60, ambush: ['juvsting', 9] },
        { id: 'nest', name: 'Гнездо Роя', look: 'nest', x: 4, z: 41, respawn: 60, ambush: ['juvsting', 9] },
        { id: 'nest', name: 'Гнездо Роя', look: 'nest', x: -6, z: 52, respawn: 60, ambush: ['juvsting', 9] }
      ],
      foes: [
        { id: 'juvsting', lvl: 8, x: -10, z: -12 },
        { id: 'juvsting', lvl: 8, x: 2, z: -13 },
        { id: 'juvsting', lvl: 8, x: -10, z: 10 },
        { id: 'juvsting', lvl: 8, x: 2, z: 12 },
        { id: 'juvsting', lvl: 9, x: -5, z: -1 },
        { id: 'gnawsting', lvl: 9, x: -12, z: -38 },
        { id: 'gnawsting', lvl: 9, x: 12, z: -38 },
        { id: 'gnawsting', lvl: 9, x: -14, z: -51 },
        { id: 'gnawsting', lvl: 10, x: 14, z: -51 },
        { id: 'gnawsting_e', lvl: 10, x: 0, z: -53 },
        { id: 'gnawsting', lvl: 9, x: -38, z: -8 },
        { id: 'juvsting', lvl: 9, x: -38, z: 9 },
        { id: 'gnawsting', lvl: 9, x: -46, z: 1 },
        { id: 'juvsting', lvl: 9, x: -15, z: 41 },
        { id: 'juvsting', lvl: 9, x: 15, z: 41 },
        { id: 'gnawsting', lvl: 9, x: 18, z: 52 },
        { id: 'juvsting', lvl: 9, x: 20, z: 30 }
      ]
    };
  }

  HO.ZONES.seclusion = seclusionZone();
  const door = HO.ZONES.storage2.objects.find(o => o.id === 'seclusion_door');
  Object.assign(door, { opensAfter: 'u_door', zone: 'seclusion', to: { x: 36, z: 0, yaw: 4.71 }, deny: 'Дверь заперта изнутри. Допуск даёт кукла Герты' });
  HO.TRAVEL.seclusion = { x: 36, z: 0, yaw: 4.71 };
  HO.ZONES.storage.objects.push({ id: 'party_beacon', name: 'Маяк вызова напарников', look: 'beacon', x: -26, z: -3.4, act: 'party', group: ['t_trampler'] });
  HO.WORLD_ZONES = ['base', 'supply', 'control', 'storage', 'storage2', 'seclusion'];
  HO.ANCHORS = {};
  for (const zid of HO.WORLD_ZONES) for (const a of HO.ZONES[zid].anchors || []) HO.ANCHORS[a.id] = Object.assign({ zone: zid }, a);
  HO.ANCHOR_IDS = Object.keys(HO.ANCHORS);

  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
