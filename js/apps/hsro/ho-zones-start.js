(function (HO) {
  'use strict';
  const WALL = 5;

  function builder() {
    const boxes = [];
    const b = (x0, y0, z0, x1, y1, z1, kind, id) => { const v = [x0, y0, z0, x1, y1, z1, kind]; if (id) v.push(id); boxes.push(v); };
    const pieces = (a, z, gaps) => {
      const out = [];
      let cur = a;
      for (const g of gaps.slice().sort((p, q) => p[0] - q[0])) {
        if (g[0] > cur) out.push([cur, g[0]]);
        cur = Math.max(cur, g[1]);
      }
      if (z > cur) out.push([cur, z]);
      return out;
    };
    return {
      boxes,
      box: b,
      room(x0, z0, x1, z1, doors) {
        b(x0, -1, z0, x1, 0, z1, 'floor');
        const gap = side => (doors || []).filter(d => d.s === side).map(d => [d.c - d.w / 2, d.c + d.w / 2]);
        for (const [a, c] of pieces(x0, x1, gap('n'))) b(a, 0, z0, c, WALL, z0 + 1, 'wall');
        for (const [a, c] of pieces(x0, x1, gap('s'))) b(a, 0, z1 - 1, c, WALL, z1, 'wall');
        for (const [a, c] of pieces(z0 + 1, z1 - 1, gap('w'))) b(x0, 0, a, x0 + 1, WALL, c, 'wall');
        for (const [a, c] of pieces(z0 + 1, z1 - 1, gap('e'))) b(x1 - 1, 0, a, x1, WALL, c, 'wall');
      },
      hall(axis, a0, a1, c, inner) {
        const h = inner / 2 + 1;
        if (axis === 'x') {
          b(a0, -1, c - h, a1, 0, c + h, 'floor');
          b(a0, 0, c - h, a1, WALL, c - h + 1, 'wall');
          b(a0, 0, c + h - 1, a1, WALL, c + h, 'wall');
        } else {
          b(c - h, -1, a0, c + h, 0, a1, 'floor');
          b(c - h, 0, a0, c - h + 1, WALL, a1, 'wall');
          b(c + h - 1, 0, a0, c + h, WALL, a1, 'wall');
        }
      }
    };
  }

  const person = (coat, hair, skin, race) => ({ type: 'person', coat, hair, skin: skin || '#f0d6c0', race: race || 'human' });

  function baseZone() {
    const z = builder();
    z.room(-15, 10, 15, 34, [{ s: 'n', c: 0, w: 6 }, { s: 's', c: 0, w: 6 }, { s: 'w', c: 22, w: 4 }, { s: 'e', c: 22, w: 4 }]);
    z.hall('z', -40, 10, 0, 8);
    z.room(-20, -66, 20, -40, [{ s: 's', c: 0, w: 8 }]);
    z.hall('z', 34, 48, 0, 6);
    z.room(-8, 48, 8, 60, [{ s: 'n', c: 0, w: 6 }]);
    z.hall('x', -19, -15, 22, 4);
    z.room(-45, 12, -19, 32, [{ s: 'e', c: 22, w: 4 }, { s: 'n', c: -35, w: 4 }]);
    z.hall('z', 6, 12, -35, 4);
    z.room(-45, -10, -25, 6, [{ s: 's', c: -35, w: 4 }]);
    z.hall('x', 15, 19, 22, 4);
    z.room(19, 12, 45, 32, [{ s: 'w', c: 22, w: 4 }]);
    for (let i = 0; i < 5; i++) {
      z.box(-4, 1.5, -36 + i * 10, -3.9, 3.2, -33 + i * 10, 'portrait');
      z.box(3.9, 1.5, -31 + i * 10, 4, 3.2, -28 + i * 10, 'portrait');
    }
    for (let i = 0; i < 4; i++) z.box(-44, 0, 14.5 + i * 5, -41.5, 0.9, 16.5 + i * 5, 'bed');
    for (let i = 0; i < 3; i++) z.box(-44, 0, -8 + i * 5, -41, 0.7, -5.5 + i * 5, 'bed');
    z.box(-4, 0, 18, 4, 1, 20, 'desk');
    return {
      id: 'base',
      name: 'Станция «Герта»: Базовая зона',
      start: true,
      absolute: true,
      spawn: { x: 0, y: 0, z: 28, yaw: 0 },
      fog: { color: '#0b1430', near: 40, far: 110 },
      boxes: z.boxes,
      areas: [
        { id: 'reception', name: 'Приёмный центр', x0: -15, z0: 10, x1: 15, z1: 34 },
        { id: 'portraits', name: 'Коридор портретов', x0: -5, z0: -40, x1: 5, z1: 10 },
        { id: 'north', name: 'Северный холл', x0: -20, z0: -66, x1: 20, z1: -40 },
        { id: 'liftlock', name: 'Шлюз космического лифта', x0: -8, z0: 34, x1: 8, z1: 60 },
        { id: 'medbay', name: 'Медицинский отсек', x0: -45, z0: 12, x1: -19, z1: 32 },
        { id: 'cabins', name: 'Каюты', x0: -45, z0: -10, x1: -25, z1: 6 },
        { id: 'observation', name: 'Комната наблюдения', x0: 19, z0: 12, x1: 45, z1: 32 }
      ],
      npcs: [
        { id: 'wen_minde', name: 'Вэнь Миндэ', role: 'quest', look: person('#e8ecf4', '#2a2026'), x: -6, z: 16, yaw: 3.14, greet: 'Новенький? Добро пожаловать на станцию. Рук после нападения не хватает, так что работа найдётся сразу.' },
        { id: 'base_terminal', name: 'Учебный терминал добровольца', role: 'trainer', look: 'terminal', x: 8, z: 14, yaw: 3.14, greet: 'Терминал мигает: «Программа добровольцев. Выберите урок».' },
        { id: 'base_vendor', name: 'Торговый автомат станции', role: 'vendor', look: 'vendor', x: 12, z: 31, yaw: 4.71, stock: ['lunch', 'coffee', 'medkit'], greet: 'Автомат урчит и подсвечивает витрину.' },
        { id: 'watson', name: 'Уотсон', role: 'quest', look: person('#c8ccd8', '#8a5a36'), x: 6, z: 12, yaw: 3.14, greet: 'В коридоре опять что-то гудит. Не люблю, когда гудит.' },
        { id: 'abraham', name: 'Авраам', role: 'quest', look: person('#e8ecf4', '#d8b070', '#e2bc9c'), x: -3, z: -36, yaw: 0, greet: 'Тише. Слышишь, как они звенят? Антибарионы. Красивый звук, если не стоять рядом.' },
        { id: 'joanna', name: 'Джоанна', role: 'quest', look: person('#e0f4ec', '#c85a3a'), x: -30, z: 22, yaw: 1.57, greet: 'Медицинский отсек. Если ничего не болит, всё равно ложись в капсулу. Порядок такой.' },
        { id: 'robot', name: 'Маленький робот', role: 'quest', look: 'robot', x: 21.5, z: 26, yaw: 4.71, escort: true, r: 0.4, h: 0.8, greet: 'Бип. Бип-бип? Робот моргает и показывает на дверь.' }
      ],
      objects: [
        { id: 'capsule', name: 'Капсула медосмотра', look: 'capsule', x: -42.5, z: 15.5 },
        { id: 'capsule', name: 'Капсула медосмотра', look: 'capsule', x: -42.5, z: 20.5 },
        { id: 'capsule', name: 'Капсула медосмотра', look: 'capsule', x: -42.5, z: 25.5 },
        { id: 'capsule', name: 'Капсула медосмотра', look: 'capsule', x: -42.5, z: 30.5 },
        { id: 'curio211', name: 'Диковина № 211 «Слепое пятно»', look: 'curio', x: 23, z: 29, aura: { k: 'unseen', dur: 20 } },
        { id: 'panel', name: 'Щиток', look: 'panel', x: 43.4, z: 14 },
        { id: 'lift', name: 'Космический лифт', look: 'lift', x: 0, z: 56, act: 'lift' }
      ],
      foes: [
        { id: 'baryon', lvl: 1, x: 2, z: -3 },
        { id: 'baryon', lvl: 1, x: -2, z: -13 },
        { id: 'baryon', lvl: 1, x: 2, z: -23 },
        { id: 'baryon', lvl: 2, x: 0, z: -48 },
        { id: 'antibaryon', lvl: 2, x: -12, z: -50 },
        { id: 'antibaryon', lvl: 2, x: 12, z: -50 },
        { id: 'antibaryon', lvl: 2, x: -10, z: -61 },
        { id: 'antibaryon', lvl: 3, x: 10, z: -61 },
        { id: 'baryon', lvl: 2, x: 0, z: -57 },
        { id: 'flamespawn', lvl: 2, x: 30, z: 17 },
        { id: 'flamespawn', lvl: 3, x: 38, z: 26 },
        { id: 'flamespawn', lvl: 3, x: 41, z: 15 }
      ]
    };
  }

  function supplyZone() {
    const z = builder();
    z.room(24, -30, 48, 30, [{ s: 'w', c: 0, w: 6 }, { s: 'n', c: 36, w: 6 }]);
    z.box(50, 0, -18, 74, 8, 18, 'ship');
    z.box(48, 0, -3, 50, 0.4, 3, 'ramp');
    z.hall('x', 8, 24, 0, 6);
    z.box(9, 0, -3, 10, 4, 3, 'gate', 'hatch');
    z.room(-16, -14, 8, 14, [{ s: 'e', c: 0, w: 4 }, { s: 's', c: -4, w: 6 }]);
    z.hall('z', 14, 34, -4, 6);
    z.box(-7, 0, 22, -1, 4, 23, 'gate', 'bridge');
    z.room(-16, 34, 8, 50, [{ s: 'n', c: -4, w: 6 }]);
    z.hall('z', -44, -30, 36, 6);
    z.room(16, -60, 44, -44, [{ s: 's', c: 36, w: 6 }, { s: 'w', c: -52, w: 6 }, { s: 'n', c: 30, w: 6 }]);
    z.hall('z', -62, -60, 30, 6);
    z.room(20, -78, 40, -62, [{ s: 's', c: 30, w: 6 }]);
    z.hall('x', -40, 16, -52, 6);
    z.room(-60, -66, -40, -30, [{ s: 'e', c: -52, w: 6 }]);
    z.box(26, 0, -77, 34, 0.9, -73, 'desk');
    for (let i = 0; i < 3; i++) z.box(-59, 0, -64 + i * 10, -57, 3, -60 + i * 10, 'machine');
    return {
      id: 'supply',
      name: 'Станция «Герта»: Зона поддержки',
      start: true,
      absolute: true,
      spawn: { x: 36, y: 0, z: 10, yaw: 4.712 },
      fog: { color: '#0b1430', near: 40, far: 110 },
      boxes: z.boxes,
      areas: [
        { id: 'perron', name: 'Перрон', x0: 24, z0: -30, x1: 48, z1: 30 },
        { id: 'sklad', name: 'Склад запчастей', x0: -16, z0: -14, x1: 8, z1: 14 },
        { id: 'bridge', name: 'Отталкивающий мост', x0: -8, z0: 14, x1: 0, z1: 34 },
        { id: 'dock', name: 'Грузовой причал', x0: -16, z0: 34, x1: 8, z1: 50 },
        { id: 'hub', name: 'Диспетчерская', x0: 16, z0: -60, x1: 44, z1: -44 },
        { id: 'versiya', name: 'Переговорная «Версия 1»', x0: 20, z0: -78, x1: 40, z1: -62 },
        { id: 'westhall', name: 'Западный коридор', x0: -40, z0: -56, x1: 16, z1: -48 },
        { id: 'substation', name: 'Электроподстанция', x0: -60, z0: -66, x1: -40, z1: -30 }
      ],
      npcs: [
        { id: 'captain', name: 'Шэнь Юнь', role: 'quest', look: person('#3a5a8a', '#d8b070', '#f0d6c0', 'foxian'), x: 40, z: 14, yaw: 4.71, greet: 'Капитан Шэнь Юнь, грузовое судно Комиссии по облачным переправам. Пока станцию чинят, мы стоим здесь. И раз уж стоим, работаем.' },
        { id: 'bob', name: 'Боб из ремонтной бригады', role: 'quest', look: person('#d8a040', '#5c3a46', '#e2bc9c'), x: 30, z: 4, yaw: 4.71, greet: 'Ремонтная бригада. Если что-то сломано, это к нам. Если сломано вами, тоже к нам, но с извинениями.' },
        { id: 'supply_terminal', name: 'Учебный терминал добровольца', role: 'trainer', look: 'terminal', x: 33, z: 22, yaw: 4.71, greet: 'Терминал мигает: «Программа добровольцев. Выберите урок».' },
        { id: 'supply_vendor', name: 'Торговый автомат станции', role: 'vendor', look: 'vendor', x: 46, z: -6, yaw: 4.71, stock: ['lunch', 'coffee', 'medkit'], greet: 'Автомат урчит и подсвечивает витрину.' },
        { id: 'wen_tw', name: 'Вэнь Тяньвэн', role: 'quest', look: person('#e8ecf4', '#2a2026'), x: 30, z: -22, yaw: 4.71, greet: 'Свет мигает с самого нападения. Я знаю, где рубильник. Я не знаю, как пройти мимо того, что возле него.' },
        { id: 'adler', name: 'Адлер', role: 'quest', look: person('#e8ecf4', '#8a5a36', '#c08c66'), x: 30, z: -70, yaw: 3.14, greet: 'Переговорная «Версия 1». Бронь на неделю вперёд, а говорить не с кем.' },
        { id: 'loader', name: 'Грузчик из лисьего народа', role: 'quest', look: person('#3a5a8a', '#8a5a36', '#e2bc9c', 'foxian'), x: 32, z: -2, yaw: 4.71, escort: true, greet: 'Мне на причал. Одному через склад не пойду, там что-то шуршит.' }
      ],
      objects: [
        { id: 'crate', name: 'Ящик груза судна', look: 'crate', x: -14, z: -11, give: 'cargo', respawn: 60 },
        { id: 'crate', name: 'Ящик груза судна', look: 'crate', x: -14, z: 1, give: 'cargo', respawn: 60 },
        { id: 'crate', name: 'Ящик груза судна', look: 'crate', x: 5, z: -11, give: 'cargo', respawn: 60 },
        { id: 'crate', name: 'Ящик груза судна', look: 'crate', x: -11, z: 11, give: 'cargo', respawn: 60 },
        { id: 'crate', name: 'Ящик груза судна', look: 'crate', x: 5, z: 11, give: 'cargo', respawn: 60 },
        { id: 'hatch', name: 'Люк Склада запчастей', look: 'panel', x: 11, z: -3.4, act: 'gate', gate: 'hatch', need: 'pass', deny: 'Посетитель не авторизован Гертой' },
        { id: 'console', name: 'Пульт отталкивающего моста', look: 'panel', x: -8, z: 12.4, act: 'gate', gate: 'bridge' },
        { id: 'switch', name: 'Рубильник подстанции', look: 'panel', x: -58.4, z: -34 },
        { id: 'lift', name: 'Космический лифт', look: 'lift', x: 40, z: -47, act: 'lift' }
      ],
      foes: [
        { id: 'baryon', lvl: 2, x: -10, z: -7 },
        { id: 'baryon', lvl: 2, x: 2, z: -7 },
        { id: 'baryon', lvl: 2, x: -10, z: 6 },
        { id: 'baryon', lvl: 2, x: 2, z: 6 },
        { id: 'baryon', lvl: 1, x: -20, z: -52 },
        { id: 'baryon', lvl: 1, x: 6, z: -52 },
        { id: 'antibaryon', lvl: 2, x: -55, z: -60 },
        { id: 'antibaryon', lvl: 2, x: -55, z: -47 },
        { id: 'antibaryon', lvl: 2, x: -47, z: -40 },
        { id: 'reaver', lvl: 2, x: -56, z: -32 },
        { id: 'trotter', lvl: 2, x: 34, z: -16, flee: true }
      ]
    };
  }

  HO.zoneBuilder = builder;
  HO.personLook = person;
  HO.ZONES.base = baseZone();
  HO.ZONES.supply = supplyZone();
  Object.assign(HO.ZONES.base, {
    rest: ['cabins'],
    medpoints: [{ x: -30, z: 27 }],
    anchors: [{ id: 'base_reception', name: 'Приёмный центр', x: 8, z: 24 }, { id: 'base_observation', name: 'Комната наблюдения', x: 17, z: 22 }]
  });
  HO.ZONES.supply.areas.push({ id: 'lounge', name: 'Кают-компания судна', x0: 40, z0: -29, x1: 47, z1: -18 });
  Object.assign(HO.ZONES.supply, {
    rest: ['lounge'],
    medpoints: [{ x: 30, z: 24 }],
    anchors: [{ id: 'supply_perron', name: 'Перрон', x: 30, z: 12 }, { id: 'supply_sklad', name: 'Склад запчастей', x: 18, z: 0 }, { id: 'supply_substation', name: 'Электроподстанция', x: -36, z: -52 }]
  });
  for (const z of [HO.ZONES.base, HO.ZONES.supply]) for (const n of z.npcs) if (n.role === 'trainer') n.trainMax = 4;
  HO.ZONES.base.npcs.find(n => n.id === 'joanna').trains = ['abundance'];
  HO.START_ZONE = { human: 'base', foxian: 'supply' };
  HO.TRAVEL = { base: { x: 0, z: 52, yaw: 0 }, supply: { x: 36, z: -50, yaw: 3.14 }, control: null };

  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
