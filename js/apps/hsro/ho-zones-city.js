(function (HO) {
  'use strict';
  const person = HO.personLook;

  function controlZone() {
    const z = HO.zoneBuilder();
    z.room(-25, -20, 25, 20, [{ s: 'n', c: 0, w: 6 }, { s: 's', c: 0, w: 6 }, { s: 'e', c: 0, w: 6 }, { s: 'w', c: 0, w: 6 }]);
    z.box(-3, 0, -3, 3, 7, 3, 'core');
    z.hall('z', -26, -20, 0, 6);
    z.room(-12, -44, 12, -26, [{ s: 's', c: 0, w: 6 }]);
    z.hall('x', 25, 31, 0, 6);
    z.room(31, -12, 55, 12, [{ s: 'w', c: 0, w: 6 }]);
    z.hall('x', -31, -25, 0, 6);
    z.room(-55, -12, -31, 12, [{ s: 'e', c: 0, w: 6 }]);
    z.hall('z', 20, 26, 0, 6);
    z.room(-10, 26, 10, 40, [{ s: 'n', c: 0, w: 6 }]);
    z.box(-6, 0, -11, 6, 1.1, -9, 'desk');
    z.box(36, 0, 6, 44, 0.8, 10, 'desk');
    z.box(-9, 0, -43, -5, 1.6, -40, 'machine');
    return {
      id: 'control',
      name: 'Станция «Герта»: Главная контрольная зона',
      absolute: true,
      safe: true,
      spawn: { x: 0, y: 0, z: 14, yaw: 0 },
      fog: { color: '#0b1430', near: 40, far: 110 },
      boxes: z.boxes,
      areas: [
        { id: 'hall', name: 'Главный пульт', x0: -25, z0: -20, x1: 25, z1: 20 },
        { id: 'office', name: 'Офис Герты', x0: -12, z0: -44, x1: 12, z1: -26 },
        { id: 'lounge', name: 'Зона отдыха', x0: 31, z0: -12, x1: 55, z1: 12 },
        { id: 'post', name: 'Пост охраны', x0: -55, z0: -12, x1: -31, z1: 12 },
        { id: 'liftlock', name: 'Шлюз космического лифта', x0: -10, z0: 20, x1: 10, z1: 40 }
      ],
      rest: ['hall', 'office', 'lounge', 'post', 'liftlock'],
      medpoints: [{ x: 38, z: -8 }],
      anchors: [{ id: 'control_central', name: 'Центральный проход', x: 0, z: 8 }, { id: 'control_watch', name: 'Зона наблюдения', x: 9, z: -15 }],
      npcs: [
        { id: 'asta', name: 'Аста', role: 'quest', look: person('#e8d0f0', '#c85a6a'), x: 0, z: -13, yaw: 3.14, greet: 'Аста, руководитель станции. Добровольцы? Отлично. У меня список дел длиннее этого коридора.' },
        { id: 'arlan', name: 'Арлан', role: 'quest', trains: ['destruction'], look: person('#3a4a6a', '#e8e4f0', '#8e5b3c'), x: -45, z: -4, yaw: 1.57, greet: 'Арлан, охрана станции. Если ты идёшь Путём Разрушения, учиться будешь у меня. Если нет, всё равно слушай, когда я говорю «назад».' },
        { id: 'herta_puppet', name: 'Кукла Герты', role: 'quest', trains: ['erudition'], look: person('#5a4a8a', '#c8b0e8', '#f4e4f0'), x: 0, z: -37, yaw: 0, greet: 'Кукла поворачивает голову. «Опять кто-то пришёл. Эрудицию объясню, если поймёшь с первого раза».' },
        { id: 'hinkel', name: 'Хинкель', role: 'quest', look: person('#c8ccd8', '#8a5a36'), x: -16, z: -13, yaw: 0, greet: 'Пульт спутникового зондирования опять завис. Три кнопки. Порядок я помню. Дотянуться до всех трёх сразу не могу.' },
        { id: 'emily', name: 'Эмили', role: 'quest', look: person('#e8ecf4', '#d8b070'), x: 14, z: 10, yaw: 3.14, greet: 'Кофе? Я как раз варю. Смена без кофе на этой станции не живёт.' },
        { id: 'mayr', name: 'Мэйр', role: 'quest', look: person('#e8ecf4', '#2a2026'), x: 18, z: -12, yaw: 3.14, greet: 'Не отвлекай, я считаю. Хотя ладно, отвлекай.' },
        { id: 'eikura', name: 'Эйкура Сю', role: 'quest', look: person('#e8ecf4', '#3a8a8a', '#e2bc9c'), x: -18, z: 12, yaw: 0, greet: 'Эйкура Сю, отдел экологии. Растения на станции переживают нападение лучше людей.' },
        { id: 'lukacs', name: 'Лукач', role: 'quest', look: person('#c8ccd8', '#5c3a46'), x: 10, z: 15, yaw: 3.14, greet: 'Лукач. Я тут временно. Уже третий год.' },
        { id: 'wen_shici', name: 'Вэнь Шици', role: 'vendor', look: person('#d8a040', '#2a2026'), x: 50, z: 4, yaw: 4.71, repair: true, stock: ['lunch', 'coffee', 'medkit', 'bagx'], greet: 'Внутренние закупки станции. Чиню, продаю, принимаю хлам. Без очереди, потому что очереди нет.' },
        { id: 'chef123', name: 'Кулинарный гений № 123', role: 'vendor', look: 'vendor', x: 50, z: -6, yaw: 4.71, stock: ['lunch', 'rice', 'coffee'], greet: 'Автомат с гордой надписью на корпусе. «Сегодня в меню: всё».' }
      ],
      objects: [
        { id: 'console_up', name: 'Пульт зондирования «Вверх»', look: 'panel', x: -20, z: -18.4 },
        { id: 'console_right', name: 'Пульт зондирования «Вправо»', look: 'panel', x: -14, z: -18.4 },
        { id: 'console_down', name: 'Пульт зондирования «Вниз»', look: 'panel', x: -8, z: -18.4 },
        { id: 'lift', name: 'Космический лифт', look: 'lift', x: 0, z: 34, act: 'lift' }
      ],
      foes: []
    };
  }

  function storageZone() {
    const z = HO.zoneBuilder();
    z.room(-25, -25, 25, 25, [{ s: 'w', c: 0, w: 6 }, { s: 'e', c: -12, w: 6 }, { s: 'e', c: 12, w: 6 }, { s: 's', c: 0, w: 6 }, { s: 'n', c: 0, w: 6 }]);
    z.box(-4, 0, -4, 4, 8, 4, 'core');
    z.hall('z', -31, -25, 0, 6);
    z.room(-15, -50, 15, -31, [{ s: 's', c: 0, w: 6 }]);
    z.hall('x', -31, -25, 0, 6);
    z.room(-61, -16, -31, 16, [{ s: 'e', c: 0, w: 6 }]);
    z.hall('x', 25, 31, -12, 6);
    z.room(31, -30, 55, -4, [{ s: 'w', c: -12, w: 6 }]);
    z.hall('x', 25, 31, 12, 6);
    z.room(31, 4, 55, 30, [{ s: 'w', c: 12, w: 6 }]);
    z.hall('z', 25, 31, 0, 6);
    z.room(-10, 31, 10, 45, [{ s: 'n', c: 0, w: 6 }]);
    for (let i = 0; i < 4; i++) z.box(46, 0, 7 + i * 6, 53, 1.4, 9 + i * 6, 'shelf');
    z.box(44, 0, -26, 52, 1.1, -23, 'desk');
    return {
      id: 'storage',
      name: 'Станция «Герта»: Зона хранения',
      absolute: true,
      spawn: { x: 0, y: 0, z: 36, yaw: 0 },
      fog: { color: '#0b1430', near: 40, far: 110 },
      boxes: z.boxes,
      areas: [
        { id: 'atrium', name: 'Атриум', x0: -25, z0: -25, x1: 25, z1: 25 },
        { id: 'gallery', name: 'Галерея теней', x0: -61, z0: -16, x1: -31, z1: 16 },
        { id: 'control', name: 'Центр управления', x0: 31, z0: -30, x1: 55, z1: -4 },
        { id: 'curios', name: 'Склад диковин', x0: 31, z0: 4, x1: 55, z1: 30 },
        { id: 'liftlock', name: 'Шлюз космического лифта', x0: -10, z0: 25, x1: 10, z1: 45 },
        { id: 'platform', name: 'Северная платформа', x0: -15, z0: -50, x1: 15, z1: -31 }
      ],
      rest: ['control', 'liftlock'],
      medpoints: [{ x: 0, z: 38 }, { x: 44, z: -12 }],
      anchors: [{ id: 'storage_gallery', name: 'Галерея теней', x: -29, z: 0 }, { id: 'storage_atrium', name: 'Атриум', x: 0, z: 20 }, { id: 'storage_outer', name: 'Внешний отсек центра управления', x: 36, z: -8 }],
      npcs: [
        { id: 'duty', name: 'Дежурный охраны', role: 'quest', look: person('#3a4a6a', '#2a2026'), x: 40, z: -20, yaw: 4.71, greet: 'Центр управления Зоны хранения. Арлан велел держать этот этаж. Держу. Помощь не помешает.' },
        { id: 'kapote', name: 'Капоте', role: 'quest', look: person('#e8ecf4', '#c85a3a', '#e2bc9c'), x: 38, z: 26, yaw: 1.57, greet: 'Капоте, хранитель склада диковин. Если что-то на складе шевелится, это нормально. Если убегает, это уже ко мне.' },
        { id: 'peppy', name: 'Пеппи', role: 'quest', look: 'dog', x: 48, z: -28.3, yaw: 0, r: 0.4, h: 0.6, greet: 'Пеппи виляет хвостом и прячется за столом. Гав.' }
      ],
      objects: [
        { id: 'rift', name: 'Остаточный разлом', look: 'rift', x: -57, z: 12 },
        { id: 'card_house', name: 'Карточный домик', look: 'curio', x: 33, z: 6 },
        { id: 'shell', name: 'Хохочущая раковина', look: 'curio', x: 40, z: 6.5, effect: 'lure' },
        { id: 'weight', name: 'Невыносимая тяжесть', look: 'curio', x: 33, z: 29, effect: 'slow' },
        { id: 'key_box', name: 'Ящик с ключом шифрования', look: 'crate', x: 53, z: -10, give: 'cipher_key' },
        { id: 'lift_panel', name: 'Панель лифта на второй этаж', look: 'panel', x: 33, z: -28.4, need: 'cipher_key', act: 'quest' },
        { id: 'stairs_up', name: 'Лифт на второй этаж', look: 'lift', x: 52, z: -16, act: 'travel', zone: 'storage2', to: { x: 24, z: -20, yaw: 3.14 }, needDone: 't_key', deny: 'Лифт на второй этаж заблокирован. Нужен ключ шифрования' },
        { id: 'lost_curio', name: 'Потерянная диковина', look: 'curio', x: 12, z: -20 },
        { id: 'lift', name: 'Космический лифт', look: 'lift', x: 0, z: 40, act: 'lift' }
      ],
      foes: [
        { id: 'reaver', lvl: 4, x: -16, z: -16 },
        { id: 'reaver', lvl: 4, x: 16, z: -16 },
        { id: 'reaver', lvl: 5, x: -16, z: 16 },
        { id: 'reaver', lvl: 5, x: 16, z: 16 },
        { id: 'baryon', lvl: 4, x: -16, z: 0 },
        { id: 'weaver', lvl: 5, x: 16, z: 0 },
        { id: 'distorter', lvl: 5, x: -38, z: -9 },
        { id: 'distorter', lvl: 6, x: -46, z: 6 },
        { id: 'distorter', lvl: 6, x: -47, z: -6 },
        { id: 'weaver', lvl: 5, x: -38, z: 12 },
        { id: 'trampler', lvl: 7, x: -57, z: -11, yaw: 1.57 },
        { id: 'eliminator', lvl: 6, x: -9, z: -37 },
        { id: 'eliminator', lvl: 6, x: 9, z: -37 },
        { id: 'eliminator', lvl: 6, x: 0, z: -46 },
        { id: 'eliminator', lvl: 6, x: -11, z: -47 },
        { id: 'weaver', lvl: 6, x: 52, z: 11 }
      ]
    };
  }

  function storage2Zone() {
    const z = HO.zoneBuilder();
    z.room(-30, -30, 30, 30, [{ s: 'e', c: 0, w: 6 }]);
    z.box(-14, 0, -14, -3, 1.2, 14, 'rail');
    z.box(3, 0, -14, 14, 1.2, 14, 'rail');
    z.box(-14, -6, -14, -3, -1, 14, 'void');
    z.hall('x', 30, 36, 0, 6);
    z.room(36, -14, 60, 14, [{ s: 'w', c: 0, w: 6 }]);
    for (let i = 0; i < 3; i++) z.box(54, 0, -10 + i * 8, 59, 1, -6 + i * 8, 'desk');
    return {
      id: 'storage2',
      name: 'Станция «Герта»: Зона хранения, второй этаж',
      absolute: true,
      spawn: { x: 24, y: 0, z: -20, yaw: 3.14 },
      fog: { color: '#0b1430', near: 40, far: 110 },
      boxes: z.boxes,
      areas: [
        { id: 'balcony', name: 'Балкон над Атриумом', x0: -30, z0: -30, x1: 30, z1: 30 },
        { id: 'bridge', name: 'Мост над Атриумом', x0: -3, z0: -14, x1: 3, z1: 14 },
        { id: 'lab', name: 'Лаборатория специального назначения', x0: 36, z0: -14, x1: 60, z1: 14 }
      ],
      rest: [],
      medpoints: [{ x: 24, z: -24 }],
      anchors: [{ id: 'storage2_lab', name: 'Лаборатория специального назначения', x: 37, z: 8 }],
      npcs: [
        { id: 'lamina', name: 'Ламина', role: 'quest', look: person('#e8ecf4', '#6a5ad0', '#f0d6c0'), x: 38, z: -12, yaw: 1.57, greet: 'Ламина, лаборатория специального назначения. Здесь хранятся вещи, о которых лучше не спрашивать. Спрашивай.' },
        { id: 'peppy2', name: 'Пеппи', role: 'quest', look: 'dog', x: -24, z: 24, yaw: 0, r: 0.4, h: 0.6, greet: 'Пеппи сидит у перил и смотрит вниз. Гав?' }
      ],
      objects: [
        { id: 'lab_sample', name: 'Образец в капсуле', look: 'capsule', x: 56, z: 10 },
        { id: 'wings', name: 'Крылья-планер', look: 'curio', x: 0, z: -18, act: 'travel', zone: 'storage', to: { x: 10, z: -18, yaw: 0 } },
        { id: 'seclusion_door', name: 'Запертая дверь в Изолированную зону', look: 'panel', x: -29.4, z: 0 },
        { id: 'stairs_down', name: 'Лифт на первый этаж', look: 'lift', x: 24, z: -26, act: 'travel', zone: 'storage', to: { x: 50, z: -16, yaw: 4.71 } }
      ],
      foes: [
        { id: 'eliminator', lvl: 6, x: -20, z: -22 },
        { id: 'eliminator', lvl: 7, x: 20, z: 22 },
        { id: 'eliminator', lvl: 7, x: -22, z: 10 },
        { id: 'weaver', lvl: 6, x: 20, z: 6 },
        { id: 'weaver', lvl: 7, x: -8, z: 24 },
        { id: 'distorter', lvl: 7, x: 0, z: -6 },
        { id: 'distorter', lvl: 7, x: 0, z: 10 },
        { id: 'distorter', lvl: 7, x: -20, z: -6 },
        { id: 'reaver', lvl: 7, x: 50, z: 9 },
        { id: 'reaver', lvl: 7, x: 50, z: -1 },
        { id: 'reaver', lvl: 8, x: 55, z: -12 }
      ]
    };
  }

  HO.ZONES.control = controlZone();
  HO.ZONES.storage = storageZone();
  HO.ZONES.storage2 = storage2Zone();
  HO.TRAVEL.control = { x: 0, z: 30, yaw: 0 };
  HO.TRAVEL.storage = { x: 0, z: 36, yaw: 0 };
  HO.LIFT_ZONES = ['base', 'supply', 'control', 'storage'];

  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
