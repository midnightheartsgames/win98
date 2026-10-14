(function (N) {
  'use strict';

  const MS = N.MS, P = MS.P;
  const sh = (cam, lines, o) => Object.assign({ cam, lines: lines || [] }, o || {});

  N.VOICES['Портье'] = { g: 'm', pitch: 0.9, rate: 0.9 };
  N.VOICES['Гопник'] = { g: 'm', pitch: 1.12, rate: 1.16 };

  const m1Car = c => MS.veh(c, 'car', 'vaz2109', P('pier', -0.6, -5.2), { color: '#56585c', hp: 1600, lights: true });
  const m1Kesha = (c, ref) => MS.npc(c, 'kesha', 'kesha', ref, { friendly: true, hp: 300 });
  const m1Masks = (c, refs) => refs.map((ref, i) => MS.npc(c, 'mask' + (i + 1), 'bandit', ref, { kind: 'bandit', weapon: 'ak', gang: true, hp: 120, look: Object.assign(N.makeLook('bandit', c.w.rng), { hat: 'mask', top: '#1a1a1a', pants: '#1a1a1a' }) }));
  const m1Hostile = c => {
    for (let i = 1; i <= 3; i++) {
      const m = c.get('mask' + i);
      if (!m || m.dead) continue;
      m.hidden = false;
      m.fireT = 0.8 + i * 0.4;
      m.ai = { mode: 'attack', target: c.w.player, mission: true, hold: true, range: 40, acc: 0.1 };
    }
  };

  N.addMission({
    id: 'm1', title: 'Добро пожаловать в Нижний', giver: 'kesha', marker: null, requires: [], reward: 500, auto: true,
    fails: [{ dead: 'kesha', text: 'Кеша погиб!' }, { destroyed: 'car', text: '«Девятку» Кеши разнесли в решето.' }],
    steps: [
      { type: 'call', fn: c => {
        const w = c.w;
        w.clock = 21 * 60 + 48;
        w.setWeather('clear', 'instant');
        MS.tp(c, P('pier', 2.7, -2.0));
        m1Car(c);
        const k = m1Kesha(c, P('pier', 3.7, -3.0));
        c.pickup('case', 'item', k.x, k.z, { item: 'case', follow: k });
        const van = MS.veh(c, 'van', 'gazel', P('pier', -40, 9), { color: '#dcdcd4', lights: true });
        const drv = MS.npc(c, 'g2', 'bandit', P('pier', -40, 9), { kind: 'bandit', weapon: 'ak', gang: true, who: 'Бандит' });
        const gena = MS.npc(c, 'gena', 'gena', P('pier', -40, 9), { weapon: 'pm', gang: true });
        w.seat(drv, van, true);
        w.seat(gena, van, false);
        drv.anim.board = gena.anim.board = null;
        m1Masks(c, [P('pier', 27, 1.2), P('pier', 27.6, 2.6), P('pier', 26.4, 2.2)]).forEach(m => { m.hidden = true; m.yaw = w.city.places.pier.yaw + Math.PI; });
        w.player.yaw = w.city.places.pier.yaw;
      } },
      { type: 'cut', at: 'pier', clear: 40, shots: [
        sh({ p: [60, 38, 16], l: [2, -2, 1], m: 'in', ma: 0.14, fov: 0.85 }, [], { dur: 5.5, title: 'Нижний Новгород. Июль 2000 года.', fade: 'in', beats: [[0, S => S.light([7.6, 1.8], 2.7, 11, [1.6, 1.15, 0.6])]] }),
        sh({ k: 'two', a: 'kesha', b: 'tyoma', side: 1 }, [
          ['kesha', 'Тёма, главное — молчи. Говорить буду я. Эти, с ГАЗа, люди нервные.', 'calm>tyoma'],
          ['tyoma', 'Восемь лет молчал. Потерплю.'],
          ['kesha', 'Да... Ну. Где они там? На одиннадцать договаривались.', 'watch']
        ]),
        sh({ p: [6.2, -4.2, 1.5], l: [-40, 7, 0.8], fov: 0.75 }, [['tyoma', 'Едут.']], { dur: 6.2, pre: 2.6, beats: [[0, S => S.drive('van', [[-1.0, 6.6]], { speed: 9, r: 2 })], [0.2, S => { S.face('kesha', [-20, 7]); S.face('tyoma', [-20, 7]); }], [5.9, S => S.brake('van')]] }),
        sh({ p: [8.5, 12.5, 2.4], l: [1.5, 2.5, 1.1], fov: 0.82, m: 'in', ma: 0.12 }, [['gena', 'Здорово, москвичи.']], { dur: 3.6, pre: 1.8, beats: [[0, S => { S.brake('van'); S.exit('gena'); S.exit('g2'); }], [0.4, S => { S.walk('gena', [4.5, 0.7], { face: 'kesha' }); S.walk('g2', [0.7, 5.0], { face: 'kesha' }); S.face('kesha', 'gena'); S.face('tyoma', 'gena'); }]] }),
        sh({ k: 'ots', a: 'gena', b: 'kesha' }, [
          ['gena', 'Деньги привезли?'],
          ['kesha', 'Триста тысяч. Зелёными. Где машины?', 'give>gena']
        ]),
        sh({ k: 'mcu', a: 'gena', b: 'kesha' }, [['gena', 'Сорок «Волг», три-один-десять, прямо с конвейера. На барже идут. Сейчас подойдут.', 'point']]),
        sh({ k: 'ots', a: 'kesha', b: 'gena', side: -1 }, [
          ['kesha', 'На барже? Договаривались же на площадке.', 'shrug'],
          ['gena', 'Площадка — это ГАЗ. ГАЗ — это свидетели. Покажи деньги.']
        ]),
        sh({ k: 'cu', a: 'tyoma', yaw: 0.9 }, [['tyoma', 'Кеша. Баржи нет.']], { beats: [[0, S => S.gest('tyoma', 'look', 2.4)]] }),
        sh({ p: [9.5, -1.4, 1.7], l: [27, 1.8, 1.3], m: 'zoom', ma: 0.35, fov: 0.8 }, [], { dur: 2.8, beats: [[0.3, S => { S.show('mask1'); S.show('mask2'); S.show('mask3'); S.run('mask1', [18.5, -0.9]); S.run('mask2', [19.6, 0.9]); S.run('mask3', [17.4, 0.2]); }], [1.9, S => { S.aim('mask1', 'tyoma'); S.aim('mask2', 'kesha'); S.aim('mask3', 'tyoma'); }]] }),
        sh({ k: 'mcu', a: 'gena', b: 'kesha' }, [['gena', 'Извини, москвич. Ничего личного.']], { beats: [['L0', (S, c) => { S.gest('gena', 'give', 1.2); const k = c.get('case'); if (k) k.follow = c.get('gena'); }]] }),
        sh({ p: [1.8, -10.5, 1.0], l: [-1.2, -4.2, 1.0], fov: 0.86, hand: 0.05 }, [['tyoma', 'Кеша, ложись!']], { slow: 0.5, pre: 0.1, dur: 2.6, beats: [['L0', S => {
          S.blank('mask1', [1.4, -4.4], { n: 16, rate: 0.12, spread: 4 });
          S.blank('mask2', [1.4, -6.2], { n: 16, rate: 0.13, spread: 4, delay: 0.1 });
          S.blank('mask3', [2.5, -3.0], { n: 14, rate: 0.15, spread: 5, delay: 0.2 });
          S.run('tyoma', [-3.3, -4.4], { face: [18, 0] });
          S.run('kesha', [-3.5, -6.0], { face: [18, 0] });
          S.gest('tyoma', 'duck');
          S.gest('kesha', 'duck');
        }]] }),
        sh({ p: [-7.5, -9.5, 0.9], l: [12, 3, 1.3], fov: 0.78, hand: 0.03 }, [['kesha', 'Деньги! Тёма, деньги!']], { dur: 4.2, pre: 1.2, beats: [
          [0, S => { S.run('gena', [-0.2, 4.6], { keep: true }); S.run('g2', [-2.4, 5.6], { keep: true }); }],
          [1.1, S => { S.enter('g2', 'van', { driver: true }); S.enter('gena', 'van', { driver: false }); }],
          [2.4, S => S.drive('van', [[-25, 18], [-90, 34]], { speed: 12 })],
          [0.5, S => { S.blank('mask1', [0.4, -5], { n: 8, rate: 0.35 }); S.blank('mask3', [0.4, -4], { n: 7, rate: 0.4, delay: 0.2 }); }]
        ] }),
        sh({ k: 'two', a: 'kesha', b: 'tyoma', side: -1, h: -0.55, lh: -0.45 }, [
          ['kesha', 'Они забрали деньги! Все триста тысяч! Сонный нас убьёт, Тёма! Обоих!'],
          ['tyoma', 'Сначала пусть найдёт. В машину. Я поведу.']
        ], { beats: [[0.5, S => { S.blank('mask2', [0.5, -5.5], { n: 6, rate: 0.5 }); }]] })
      ] },
      { type: 'call', fn: c => {
        MS.rm(c, 'gena', 'g2', 'van', 'case');
        const k = c.get('kesha');
        k.anim.gest = null;
        c.w.player.anim.gest = null;
        k.ai = { mode: 'follow', target: c.w.player, mission: true };
        m1Hostile(c);
        c.say([['kesha', 'Тёма, быстрее! Они перезаряжаются!']]);
      } },
      { type: 'cp', id: 'pier', name: 'Причал', place: c => {
        c.w.clock = 21 * 60 + 52;
        m1Car(c);
        const k = m1Kesha(c, P('pier', -3.5, -6.0));
        k.ai = { mode: 'follow', target: c.w.player, mission: true };
        MS.tp(c, P('pier', -3.3, -4.4, Math.PI));
        m1Masks(c, [P('pier', 18.5, -0.9, Math.PI), P('pier', 19.6, 0.9, Math.PI), P('pier', 17.4, 0.2, Math.PI)]);
        m1Hostile(c);
      } },
      { type: 'enter', tag: 'car', text: 'Садись за руль «девятки», пока её не изрешетили.', help: 'drive' },
      { type: 'fn', text: 'Уезжай с причала!', tick: c => {
        const v = c.get('car'), pl = c.w.player;
        if (pl.veh === v && !MS.with(c, 'kesha') && !c.vars.waitK) { c.vars.waitK = 1; c.g.objective('Подожди Кешу — он садится. Потом гони!'); }
      }, fails: [{ far: 'kesha', dist: 150, time: 8, text: 'Ты бросил Кешу на причале.' }],
      fn: c => MS.with(c, 'kesha') && MS.dist(c, 'tyoma', 'pier') > 110, blips: c => [], bot: c => { MS.seat(c, 'kesha', 'car', false); const q = MS.at(c, P('pier', -140, -6)); const v = c.get('car'); v.x = q.x; v.z = q.z; c.w.player.x = q.x; c.w.player.z = q.z; } },
      { type: 'call', fn: c => { MS.rm(c, 'mask1', 'mask2', 'mask3'); } },
      { type: 'talk', need: c => MS.with(c, 'kesha'), away: ['kesha', 'Тёма! Ты куда? Я без тебя не поеду!'], gap: 2.6, delay: 1.2, lines: [
        ['kesha', 'Оторвались... Господи. Тёма, у меня руки трясутся. Смотри, как трясутся.'],
        ['tyoma', 'Я на дорогу смотрю. Куда ехать?'],
        ['kesha', 'В Соцгород, ко мне в контору. Проспект Октября. Дорогу помнишь?'],
        ['tyoma', 'Город помню. Таких машин не помню. Ларьков таких не помню.'],
        ['kesha', 'Тёма... Я ведь как лучше хотел. Ты там восемь лет, а я тут... Думал: выйдешь — и сразу при деле. Сорок «Волг», Москва, всё чисто.'],
        ['tyoma', 'Кто знал про сделку?'],
        ['kesha', 'Ну... Борзых с ГАЗа, он машины давал. Гена этот — от Борзых. Сонный, понятно.'],
        ['tyoma', 'И всё?'],
        ['kesha', 'Ну, я пару звонков сделал. Для солидности. Чтоб люди знали: Иннокентий Маркович — не пустое место.'],
        ['tyoma', 'Кому звонил?'],
        ['kesha', 'Всем, Тёма. Я звонил всем.'],
        ['tyoma', 'Девяносто второй помнишь?'],
        ['kesha', 'Помню. Ты меня тогда не сдал. Я каждый день это помню.'],
        ['tyoma', 'Вот и сейчас помни. Молча.']
      ] },
      { type: 'goto', at: 'kesha_door', r: 7, veh: 'car', with: 'kesha', withText: 'Подожди Кешу.', stop: true, text: 'Отвези Кешу в контору «Фемида» на проспекте Октября.', help: 'radar' },
      { type: 'cut', at: 'kesha_door', shots: [
        sh({ p: [-11, -6, 2.6], l: [-3, 0.5, 1.2], fov: 0.8 }, [], { dur: 3.4, beats: [[0, S => S.park('car', [-6.6, 2.4], Math.PI / 2)], [0.1, S => S.exit('kesha')], [0.7, S => S.exit('tyoma')], [1.0, S => { S.walk('kesha', [0.5, 0.2], { face: [-4, 1.2] }); }], [1.4, S => S.walk('tyoma', [-4.4, 1.0], { face: [0.5, 0.2] })]] }),
        sh({ k: 'two', a: 'kesha', b: 'tyoma' }, [
          ['kesha', 'Я тебе номер снял в «Автозаводской», через проспект. Отоспись. Утром — ко мне, будем думать.', '>tyoma'],
          ['tyoma', 'Машину тут оставлю.'],
          ['kesha', 'Оставь. Её теперь только на металлолом.', 'shrug']
        ]),
        sh({ k: 'mcu', a: 'kesha', b: 'tyoma' }, [['kesha', 'Тёма... Прости меня.', 'down']]),
        sh({ k: 'mcu', a: 'tyoma', b: 'kesha' }, [['tyoma', 'Иди спать, Кеша.']]),
        sh({ p: [-7, 3.5, 2.2], l: [2.5, 0, 1.6], fov: 0.8 }, [], { dur: 2.6, beats: [[0.2, S => S.walk('kesha', [2.6, 0.1])], ['end', S => S.hide('kesha')]] })
      ] },
      { type: 'call', fn: c => {
        MS.rm(c, 'kesha');
        const v = c.get('car');
        if (v) { v.persistent = false; v.lights = false; delete c.ents.car; }
      } },
      { type: 'cp', id: 'femida', name: '«Фемида»', place: c => MS.tp(c, P('kesha_door', -3.5, 1.2, Math.PI)) },
      { type: 'goto', at: 'hotel_door', r: 2.2, veh: 'none', text: 'Иди в гостиницу «Автозаводская» — она через проспект.' },
      { type: 'call', fn: c => { MS.npc(c, 'porter', 'pensioner', P('hotel_door', 1.6, 0.6, Math.PI), { kind: 'pensioner', who: 'Портье', hidden: true }); } },
      { type: 'cut', at: 'hotel_door', shots: [
        sh({ p: [-20, 8, 6.5], l: [4, 0, 4.5], m: 'in', ma: 0.1, fov: 0.85 }, [['tyoma', '«Тёма, позвони в Москву. С.»']], { pre: 1.4, beats: [[0, S => { S.face('tyoma', [-6, 0]); }], [0.4, S => S.sfx('pager')], [0.8, S => S.gest('tyoma', 'watch', 3)]] }),
        sh({ k: 'ms', a: 'porter', b: 'tyoma' }, [['Портье', 'Верещагин? Вам звонят. Из Москвы. Третий раз уже.', 'give>tyoma']], { beats: [[0, S => { S.show('porter'); S.walk('porter', [0.6, 0.4], { face: 'tyoma' }); S.face('tyoma', 'porter'); }]] }),
        sh({ k: 'ms', a: 'tyoma', yaw: -0.5 }, [
          ['sonny', 'Тёма. Это Сонный. Мне позвонили.', '~phone'],
          ['tyoma', 'Нас ждали на причале. Кто-то сдал.'],
          ['sonny', 'Мне неинтересно, кто кого сдал. Там были мои триста тысяч.', '~phone']
        ], { beats: [[0, S => { S.gest('tyoma', 'phone'); S.put('tyoma', [-3.0, -1.0], [-14, -2]); S.walk('porter', [1.2, 1.2], { face: 'tyoma' }); }]] }),
        sh({ k: 'cu', a: 'tyoma', yaw: -0.45 }, [
          ['tyoma', 'Я найду.'],
          ['sonny', 'Найдёшь. Ты у нас честный, Тёма. Восемь лет молчал. Вот и ищи — молча.', '~phone'],
          ['sonny', 'Только недолго.', '~phone']
        ]),
        sh({ p: [-0.7, 0.9, 2.0], l: [-12, -0.6, 1.7], fov: 0.82, m: 'up', ma: 1.2 }, [
          ['tyoma', 'Восемь лет не был на воле. Страна другая. Деньги другие.'],
          ['tyoma', 'Люди — те же.']
        ], { fade: 'out', beats: [[0, S => { S.hide('porter'); S.calm('tyoma'); S.put('tyoma', [-1.9, 0.4], [-24, -2.5]); }]] })
      ] },
      { type: 'call', fn: c => { MS.rm(c, 'porter'); c.g.help(N.HELP.save); } }
    ],
    onPass: g => g.pager(N.PAGER.afterM1)
  });

  const m2Setup = c => {
    MS.npc(c, 'larisa', 'larisa', P('market_stall', -0.6, -0.8), { friendly: true, hp: 200 });
    const spots = [[1.0, 11.0], [2.3, 12.6], [0.3, 13.7]];
    spots.forEach(([f, r], i) => {
      const g = MS.npc(c, 'gop' + (i + 1), 'gopnik', P('market_stall', f, r), { kind: 'gopnik', weapon: i === 1 ? 'knife' : 'fists', gang: true, hp: i === 2 ? 60 : 110, who: 'Гопник', face: P('market_stall', 1.2, 12.4) });
      g.money = 0;
    });
    c.pickup('bag', 'item', 0, 0, { item: 'bag', follow: c.get('gop3') });
    c.vars.fight = 0;
  };
  const m2Start = c => {
    if (c.vars.fight) return;
    c.vars.fight = 1;
    const pl = c.w.player;
    for (const t of ['gop1', 'gop2']) { const g = c.get(t); if (g && !g.dead) g.ai = { mode: 'attack', target: pl, mission: true, t: 0 }; }
    const thief = c.get('gop3');
    if (thief && !thief.dead) thief.ai = { mode: 'flee', fx: pl.x, fz: pl.z, t: 999, mission: true };
    c.g.objective('Гопник с выручкой убегает! Догони его и сбей с ног.');
    c.g.help(N.HELP.chase, 5);
    c.say([['Гопник', 'Атас! Валим!'], ['larisa', 'Держи его! Сумка у него!']]);
  };

  N.addMission({
    id: 'm2', title: 'Встречают по одёжке', giver: 'kesha', marker: 'kesha_door', requires: ['m1'], reward: 2500,
    fails: [{ dead: 'larisa', text: 'Лариса погибла!' }],
    steps: [
      { type: 'call', fn: c => {
        if (c.w.clock < 9 * 60 || c.w.clock > 19 * 60) c.w.clock = 10 * 60 + 15;
        MS.npc(c, 'kesha', 'kesha', P('kesha_door', 0.6, 0.3, Math.PI), { friendly: true, hp: 300, gest: 'phone' });
      } },
      { type: 'cut', at: 'kesha_door', shots: [
        sh({ k: 'ms', a: 'kesha', yaw: 0.35 }, [['kesha', 'Да, мама. Ем. Ем, говорю! Всё, мама, у меня клиент.', 'phone']], { beats: [[0, S => S.walk('tyoma', [-1.6, 0.6], { face: 'kesha' })]] }),
        sh({ k: 'two', a: 'kesha', b: 'tyoma' }, [
          ['kesha', 'Тёма. Ты в этой робе как с этапа. Тебя первый же постовой тормознёт.', 'shrug>tyoma'],
          ['tyoma', 'Другой нет.']
        ]),
        sh({ k: 'mcu', a: 'kesha', b: 'tyoma' }, [['kesha', 'На Мончегорском рынке Лариса держит точку. Скажешь — от меня. Оденет.']]),
        sh({ k: 'mcu', a: 'tyoma', b: 'kesha' }, [['tyoma', 'Денег нет. Их украли, если помнишь.']]),
        sh({ k: 'two', a: 'kesha', b: 'tyoma', side: -1 }, [
          ['kesha', 'Лариса даст в долг. Мне она тоже... даёт. В долг.', 'shrug'],
          ['kesha', 'И главное: Лариса на рынке знает всех. Кто с кем пьёт, кто на чём ездит. Спроси её про Гену.', 'point']
        ]),
        sh({ k: 'ots', a: 'kesha', b: 'tyoma' }, [
          ['tyoma', 'А ты?'],
          ['kesha', 'А я подниму старые связи. Аккуратно. Без звонков.', 'calm'],
          ['tyoma', 'Без звонков, Кеша.']
        ])
      ] },
      { type: 'call', fn: c => { MS.rm(c, 'kesha'); c.g.help('Своей машины нет — подойди к любой и нажми F. Водителя Тёма вытащит сам.', 7); } },
      { type: 'goto', at: 'market', r: 16, text: 'Езжай на Мончегорский рынок.' },
      { type: 'call', fn: m2Setup },
      { type: 'goto', at: 'market_stall', r: 2.6, veh: 'none', text: 'Найди Ларису — её палатка в глубине рынка.' },
      { type: 'cut', at: 'market_stall', clear: 18, shots: [
        sh({ p: [7, -6, 2.4], l: [0, 0, 1.3], fov: 0.8 }, [['larisa', 'Мужчина, вы покупать или глазеть?', 'hips>tyoma']], { pre: 1.2, beats: [[0, S => S.walk('tyoma', [1.5, 0.3], { face: 'larisa' })]] }),
        sh({ k: 'two', a: 'larisa', b: 'tyoma' }, [
          ['tyoma', 'Я от Кеши.'],
          ['larisa', 'От Кеши? Ой, а я думала, он сам приедет...', 'shrug']
        ]),
        sh({ k: 'mcu', a: 'larisa', b: 'tyoma' }, [
          ['larisa', 'Ладно. Вы вовремя. Трое с Соцгорода мою выручку забрали. Средь бела дня!', 'hips'],
          ['larisa', 'Вон они, у контейнеров. Пиво пьют. На мои деньги.', 'point']
        ]),
        sh({ p: [1.6, 4.2, 1.5], l: [1.2, 12.4, 0.7], fov: 0.62 }, [['Гопник', 'Слышь, а чё она на нас пальцем тычет?']], { pre: 0.8 }),
        sh({ k: 'two', a: 'larisa', b: 'tyoma', side: -1 }, [
          ['tyoma', 'Милицию звала?'],
          ['larisa', 'Милицию? Золотко, милиция с них долю берёт.']
        ]),
        sh({ k: 'mcu', a: 'larisa', b: 'tyoma' }, [['larisa', 'На. Кастет. От мужа остался. Муж, правда, тоже остался... на пять лет.', 'give']])
      ] },
      { type: 'call', fn: c => { MS.give(c, 'knuckles', 1, true); } },
      { type: 'cp', id: 'larisa', name: 'Рынок', place: c => { m2Setup(c); MS.tp(c, P('market_stall', 1.5, 0.3, -Math.PI / 2)); }, kit: { weapons: { knuckles: 1 }, equip: 'knuckles' } },
      { type: 'fn', id: 'fight', text: 'Проучи гопников у контейнеров и верни выручку.', help: 'melee', tick: (c, dt) => {
        const pl = c.w.player;
        if (!c.vars.fight) {
          const near = ['gop1', 'gop2', 'gop3'].some(t => { const g = c.get(t); return g && (g.hp < g.maxHp || g.dead || Math.hypot(g.x - pl.x, g.z - pl.z) < 4.5); });
          if (near) m2Start(c);
          return;
        }
        const th = c.get('gop3');
        if (th && !th.dead && th.state !== 'down' && th.ai && th.ai.mode === 'flee') { th.ai.fx = pl.x; th.ai.fz = pl.z; th.ai.t = 999; }
        const bag = c.get('bag');
        if (bag && bag.follow && th && (th.dead || th.state === 'down')) {
          bag.follow = null;
          bag.y = c.w.city.groundY(th.x, th.z) + 0.6;
          bag.x = th.x + 0.6; bag.z = th.z;
          if (!th.dead) th.ai = { mode: 'flee', fx: pl.x, fz: pl.z, t: 6, mission: true };
          c.say([['tyoma', 'Сумку отдал. Свободен.']]);
        }
      }, fn: c => { const bag = c.get('bag'); return !!bag && !bag.follow && MS.count(c, ['gop1', 'gop2']) === 0; },
      fails: [{ fn: c => { const th = c.get('gop3'), b = c.get('bag'); return th && b && b.follow && MS.dist(c, 'gop3', 'market_stall') > 150 ? 'Гопник удрал с выручкой.' : null; } }],
      blips: c => { const th = c.get('gop3'), b = c.get('bag'); return th && b && b.follow ? [{ x: th.x, z: th.z, type: 'enemy', ent: th }] : []; },
      bot: c => { m2Start(c); for (const t of ['gop1', 'gop2', 'gop3']) { const g = c.get(t); if (g && !g.dead) c.w.damagePed(g, 9999, c.w.player, 'melee'); } } },
      { type: 'collect', tag: 'bag', text: 'Подбери сумку с выручкой.' },
      { type: 'goto', at: 'market_stall', r: 2.6, veh: 'none', text: 'Верни выручку Ларисе.' },
      { type: 'cut', at: 'market_stall', clear: 16, shots: [
        sh({ k: 'two', a: 'larisa', b: 'tyoma' }, [
          ['larisa', 'Ну ты даёшь! Вот это мужчина!', 'hug>tyoma'],
          ['larisa', 'Выбирай, что нравится. Для своих — бесплатно.', 'point']
        ], { fade: 'out', beats: [[0, S => { S.put('larisa', [-0.6, -0.8]); S.walk('tyoma', [1.5, 0.3], { face: 'larisa' }); }]] }),
        sh({ p: [3.6, 4.4, 1.6], l: [1.2, 0, 1.0], fov: 0.78 }, [['tyoma', 'Кожаная. Как у всех.']], { fade: 'in', pre: 1.0, beats: [[0, (S, c) => c.g.setOutfit('leather')]] }),
        sh({ k: 'mcu', a: 'larisa', b: 'tyoma' }, [['larisa', 'Тебе идёт. Прямо как в кино.', 'hips']]),
        sh({ k: 'two', a: 'larisa', b: 'tyoma', side: -1 }, [
          ['tyoma', 'Про Гену с ГАЗа что знаешь?'],
          ['larisa', 'Генку? Шестёрка Хромого. Хромой — наш, автозаводский. Генка вчера на новой «девятке» катался. Деньги, видать, появились.', 'shrug'],
          ['tyoma', 'Видать.']
        ]),
        sh({ k: 'mcu', a: 'larisa', b: 'tyoma' }, [
          ['larisa', 'И ещё. Полковник Корчагин людей ищет. Живёт на Оке, на дебаркадере «Отставник». Ему нужны те, кто умеет молчать.'],
          ['larisa', 'Ты, я смотрю, умеешь.']
        ]),
        sh({ k: 'cu', a: 'tyoma', b: 'larisa' }, [['tyoma', 'Умею.']]),
        sh({ k: 'mcu', a: 'larisa', b: 'tyoma' }, [['larisa', 'А жаль.', 'shrug']], { hold: 0.9 })
      ] },
      { type: 'call', fn: c => { const l = c.get('larisa'); if (l) { l.keep = true; l.ai = { mode: 'idle', face: MS.at(c, P('market_stall', 3, 0)) }; } } }
    ],
    onPass: g => { g.pager(N.PAGER.afterM2); g.later(14, () => g.pager(N.PAGER.afterM2b)); }
  });

  const zl = (c, li, s, off) => {
    const Z = c.w.city.zaryaLanes, l = Z[Math.min(li, Z.length - 1)];
    const q = N.plineAt(l.pts, l.cum, N.clamp(s, 0, l.len));
    return [q.x - q.dz * off, q.z + q.dx * off, N.yawOf(q.dx, q.dz)];
  };
  const m3Box = c => { const b = zl(c, 1, 70, 2.9); return { x: b[0], z: b[1], yaw: b[2] }; };
  const m3Van = c => { MS.veh(c, 'van', 'gazel', zl(c, 0, 33, 2.4), { color: '#e2e2da', hp: 1400 }); c.vars.cargo = 1; };
  const m3Gang = c => {
    const pts = [zl(c, 0, 28, -1.6), zl(c, 0, 36, 1.0), zl(c, 0, 40, -2.0), zl(c, 0, 24, 1.6), zl(c, 0, 45, -0.8)];
    MS.crew(c, 'z', pts, { kind: 'zarechny', weapons: ['pm', 'knife', 'pm', 'fists', 'pm'], aggro: 26, exact: true });
    const boss = MS.npc(c, 'boss', 'boss', zl(c, 0, 31, -2.2), { kind: 'zarechny', weapon: 'pm', gang: true, hp: 140 });
    boss.fireT = 1;
    boss.ai = { mode: 'guard', mission: true, x: boss.x, z: boss.z, aggro: 26, group: 'z' };
    MS.veh(c, 'bosscar', 'vaz2106', zl(c, 0, 17, 2.5), { color: '#262626' });
    for (let i = 0; i < 3; i++) { const q = zl(c, 0, 29.4 - i * 0.9, 2.6 + (i % 2) * 0.9); c.pickup('crate' + i, 'item', q[0], q[1], { item: 'crate', prop: true, y: c.w.city.groundY(q[0], q[1]), yaw: q[2] + i * 0.3 }); }
  };
  const m3Colonel = (c, ref) => MS.npc(c, 'colonel', 'colonel', ref, { friendly: true, hp: 400, invuln: true });
  const m3Run = c => {
    const boss = c.get('boss');
    if (!boss || boss.dead || c.vars.run) return;
    c.vars.run = 1;
    boss.ai = { mode: 'enter', car: c.get('bosscar'), mission: true, drive: { mode: 'flee', speed: 21 } };
    c.say([['colonel', 'Главный к «шестёрке» побежал! Уйдёт!']]);
  };

  N.addMission({
    id: 'm3', title: 'Гаражи «Заря»', giver: 'colonel', marker: 'colonel', requires: ['m2'], reward: 4000,
    steps: [
      { type: 'call', fn: c => {
        const w = c.w;
        if (w.clock < 9 * 60 || w.clock > 19 * 60) w.clock = 11 * 60 + 40;
        m3Colonel(c, P('colonel_npc', 0, 0)).yaw = w.city.places.colonel_npc.yaw;
        c.get('colonel').anim.gest = { k: 'back', t: 1, d: 0 };
      } },
      { type: 'cut', at: 'colonel_npc', shots: [
        sh({ p: [15, -3, 3.2], l: [0, -3, 1.4], fov: 0.8 }, [['colonel', 'Верещагин? Кеша звонил. Подходи.']], { pre: 1.6, beats: [[0, S => S.walk('tyoma', [0.3, -1.7], { face: 'colonel' })]] }),
        sh({ k: 'two', a: 'colonel', b: 'tyoma' }, [
          ['colonel', 'Водку будешь?', '>tyoma'],
          ['tyoma', 'Нет.'],
          ['colonel', 'Правильно. Я тоже не буду. Мне нельзя, а тебе рано.']
        ]),
        sh({ k: 'mcu', a: 'colonel', b: 'tyoma' }, [['colonel', 'Я твоё дело читал. Восемь лет за чужую трубу.']]),
        sh({ k: 'mcu', a: 'tyoma', b: 'colonel' }, [['tyoma', 'За свою.']]),
        sh({ k: 'mcu', a: 'colonel', b: 'tyoma' }, [['colonel', 'Ну-ну. Молчать умеешь — это хорошо. Только не со всеми надо.', 'nod']]),
        sh({ k: 'two', a: 'colonel', b: 'tyoma', side: -1 }, [
          ['colonel', 'Шпана заречная вскрыла мой бокс в «Заре». Там ящики. Армейские, списанные. Очень списанные.', 'back'],
          ['colonel', 'Грузят сейчас в «газель». Отобьёшь — поставишь фургон обратно в бокс. Аккуратно: в ящиках «эфки».']
        ]),
        sh({ k: 'ms', a: 'colonel', b: 'tyoma' }, [
          ['colonel', 'Держи ПМ. Обращаться умеешь? Не отвечай.', 'give>tyoma'],
          ['tyoma', 'Сколько их?'],
          ['colonel', 'Пятеро. И главный — этот любит удирать на «шестёрке».']
        ]),
        sh({ k: 'two', a: 'colonel', b: 'tyoma' }, [
          ['colonel', 'Поехали. Покажу бокс. Права у меня отобрали, так что за рулём ты.'],
          ['tyoma', 'За что отобрали?'],
          ['colonel', 'Дорога длинная. Расскажу.']
        ])
      ] },
      { type: 'call', fn: c => {
        MS.give(c, 'pm', 48, true);
        const k = c.get('colonel');
        k.anim.gest = null;
        k.ai = { mode: 'follow', target: c.w.player, mission: true, invuln: true };
        c.g.help(N.HELP.aim, 7);
      } },
      { type: 'talk', need: c => MS.with(c, 'colonel'), away: ['colonel', 'Верещагин, я за тобой не угонюсь. Машину подгони.'], gap: 5, delay: 3, lines: [
        ['colonel', 'Права у меня отобрали в девяносто шестом. За превышение. На «Ниве», между прочим.'],
        ['tyoma', 'Сто сорок?'],
        ['colonel', 'Сто двадцать. Но в населённом пункте. И под горку.'],
        ['colonel', 'В деле у тебя написано: был один. Один грузовик угнал, один моторы грузил, один вахтёра трубой. Богатырь.'],
        ['tyoma', 'Так и было.'],
        ['colonel', 'Ну-ну.'],
        ['colonel', 'Я в Афгане тоже раз промолчал. За командира. Он потом генералом стал.'],
        ['tyoma', 'Помог он тебе?'],
        ['colonel', 'Пенсию помог оформить. И дебаркадер — тоже его подарок. Так что я, Верещагин, знаю, сколько стоит молчание. Ровно один дебаркадер.'],
        ['tyoma', 'А моё сколько стоит?'],
        ['colonel', 'Твоё? Пока — ничего. Похоже, ты не за того молчал.']
      ] },
      { type: 'goto', at: 'zarya', r: 20, veh: 'any', with: 'colonel', withText: 'Подожди полковника — он сядет к тебе.', text: 'Отвези полковника в гаражный кооператив «Заря». Своей машины нет — бери любую.' },
      { type: 'call', fn: c => {
        m3Gang(c);
        m3Van(c);
        const v = c.w.player.veh;
        if (v && !v.mtag) c.tag('ride', v);
      } },
      { type: 'cut', at: 'zarya', clear: 30, shots: [
        sh({ k: 'wide', a: 'boss', d: 10, h: 2.4, yaw: 2.4, lh: 1.2 }, [
          ['boss', 'Шевелись! Пока сторож не проснулся!', 'fist'],
          ['Гопник', 'Колян, да тут ящиков штук сорок!'],
          ['boss', 'Значит, сорок раз шевелись!', 'point']
        ], { beats: [[0, S => { S.gest('z1', 'count', 6); S.gest('z3', 'arms', 6); }]] }),
        sh({ k: 'two', a: 'colonel', b: 'tyoma' }, [
          ['colonel', 'Вот они, голубчики. Мой бокс — в соседнем ряду. Ящики — туда.', 'point'],
          ['tyoma', 'Жди у ворот.'],
          ['colonel', 'Жду. Возраст.', 'back']
        ], { beats: [[0, S => { if (S.ent('ride')) S.park('ride', [-1, 4.5], 0); S.put('colonel', [0.6, 2.6], [1.6, 0.4]); S.put('tyoma', [1.6, 0.4], [0.6, 2.6]); }]] }),
        sh({ k: 'cu', a: 'tyoma', yaw: 2.7 }, [['tyoma', 'Пятеро. И главный.']], { beats: [[0, S => S.face('tyoma', [30, 0])]] })
      ] },
      { type: 'call', fn: c => {
        const k = c.get('colonel');
        k.ai = { mode: 'idle', mission: true, invuln: true, face: MS.at(c, P('zarya', 20, 0)) };
        k.anim.gest = { k: 'back', t: 1, d: 0 };
      } },
      { type: 'cp', id: 'zarya', name: 'ГСК «Заря»', place: c => {
        m3Gang(c);
        m3Van(c);
        const k = m3Colonel(c, P('zarya', 0.6, 2.6));
        k.ai = { mode: 'idle', mission: true, invuln: true, face: MS.at(c, P('zarya', 20, 0)) };
        k.anim.gest = { k: 'back', t: 1, d: 0 };
        MS.tp(c, P('zarya', 1.6, 0.4));
      }, kit: { weapons: { pm: 40 }, equip: 'pm' } },
      { type: 'fn', text: 'Перестреляй заречных. Главного не упусти.', tick: (c, dt) => {
        const dead = MS.tags('z', 5).filter(t => !MS.alive(c, t)).length;
        if (dead >= 3) m3Run(c);
        const b = c.get('boss');
        if (c.vars.run && b && !b.dead && b.veh && !c.vars.told) { c.vars.told = 1; c.g.objective('Главный удирает на «шестёрке»! Останови его.'); }
      }, fn: c => MS.count(c, MS.tags('z', 5).concat(['boss'])) === 0,
      fails: [{ far: 'boss', dist: 320, time: 8, text: 'Главный ушёл.' }],
      blips: c => MS.tags('z', 5).concat(['boss']).filter(t => MS.alive(c, t)).map(t => { const e = c.get(t); return { x: e.veh ? e.veh.x : e.x, z: e.veh ? e.veh.z : e.z, type: 'enemy', ent: e }; }),
      bot: c => { for (const t of MS.tags('z', 5).concat(['boss'])) { const e = c.get(t); if (e && !e.dead) c.w.damagePed(e, 9999, c.w.player, 'bullet'); } } },
      { type: 'call', fn: c => { MS.rm(c, 'crate0', 'crate1', 'crate2'); c.say([['tyoma', 'Ящики уже в кузове. Ладно. Теперь — тихо.']]); } },
      { type: 'cp', id: 'van', name: 'Фургон с ящиками', place: c => {
        m3Van(c);
        const k = m3Colonel(c, P('zarya', 0.6, 2.6));
        k.ai = { mode: 'idle', mission: true, invuln: true };
        k.anim.gest = { k: 'back', t: 1, d: 0 };
        const v = c.get('van'), q = zl(c, 0, 37, -1.2);
        MS.tp(c, [q[0], q[1], N.yawOf(v.x - q[0], v.z - q[1])]);
      } },
      { type: 'enter', tag: 'van', text: 'Садись в «газель» с ящиками.', help: 'cargo', fails: [{ destroyed: 'van', text: 'Фургон с гранатами взорвался.' }] },
      { type: 'goto', at: m3Box, r: 3.6, veh: 'van', stop: true, text: 'Загони фургон в бокс полковника, в соседнем ряду. Не трясти!', tick: (c, dt) => {
        const v = c.get('van');
        if (!v || v.dead) return;
        for (const e of c.w.ev) if (e.t === 'crash' && e.v === v && !e.cargo) { e.cargo = true; c.vars.cargo -= Math.max(0, e.force - 4.5) * 0.045; if (c.vars.cargo > 0.05) c.say([['tyoma', c.vars.cargo > 0.5 ? 'Тихо, тихо...' : 'Ещё раз — и полетим.']]); }
        c.vars.cargo = Math.min(c.vars.cargo, v.hp / v.maxHp * 1.5 - 0.5);
        if (c.vars.cargo <= 0) { c.vars.cargo = 0; c.w.blowUp(v); }
      }, bar: c => ({ label: 'ГРУЗ', k: c.vars.cargo, col: c.vars.cargo > 0.5 ? '#7ad070' : c.vars.cargo > 0.25 ? '#f0c040' : '#ff5a3c' }),
      fails: [{ destroyed: 'van', text: 'Фургон с гранатами взорвался.' }] },
      { type: 'call', fn: c => { const v = c.get('van'); v.ctl.thr = 0; c.w.exitVehicle(c.w.player); } },
      { type: 'cut', at: m3Box, clear: 20, shots: [
        sh({ k: 'wide', a: 'van', d: 9, h: 2.2, yaw: 2.6 }, [], { dur: 2.8, beats: [[0, S => { S.park('van', [0, 0], 0); S.put('tyoma', [-5.0, 0.6], [0, 0]); S.put('colonel', [-12, -0.8], [0, 0]); S.calm('colonel'); S.walk('colonel', [-4.2, -1.1], { face: [0, 0] }); }]] }),
        sh({ k: 'ots', a: 'colonel', b: 'tyoma' }, [
          ['colonel', 'Так... Все на месте. Один пустой...', 'count'],
          ['colonel', 'А, нет. Этот я сам в девяносто восьмом продал.']
        ], { beats: [[0, S => S.face('tyoma', 'colonel')]] }),
        sh({ k: 'ots', a: 'tyoma', b: 'colonel' }, [
          ['colonel', 'Ты мне ничего не должен, Верещагин. Я тебе — тоже. Значит, можем друг другу верить.', '>tyoma'],
          ['tyoma', 'Странная арифметика.']
        ]),
        sh({ k: 'mcu', a: 'colonel', b: 'tyoma' }, [['colonel', 'Армейская. Кто должен — тот врёт. Запомни.', 'back']]),
        sh({ k: 'mcu', a: 'colonel', b: 'tyoma' }, c => [c.g.done('m4')
          ? ['colonel', 'Слышал, ты с Борзых уже познакомился. Через его «Волгу». Шустрый.']
          : ['colonel', 'Про твой причал я слышал. На ГАЗе есть человек — Борзых, замдиректора по сбыту. Через него «Волги» мимо кассы и уходят. Кеша твой его знает.']]),
        sh({ k: 'two', a: 'colonel', b: 'tyoma', yaw: 1.1 }, [
          ['colonel', 'Понадобится стрелок — позову. А домой я на такси. Хватит с меня твоей езды.'],
          ['tyoma', 'Нормально я езжу.'],
          ['colonel', 'С гранатами — нормально. Без гранат посмотрим.']
        ], { hold: 0.8 })
      ] }
    ],
    onPass: g => g.pager(N.PAGER.afterM3)
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
