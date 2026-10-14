(function (N) {
  'use strict';

  const MS = N.MS, P = MS.P;
  const sh = (cam, lines, o) => Object.assign({ cam, lines: lines || [] }, o || {});

  N.VOICES['Охранник'] = { g: 'm', pitch: 0.86, rate: 1.0 };

  const m4Volga = (c, ref) => MS.veh(c, 'volga', 'volga3110', ref, { color: '#5a1220', hp: 1500 });
  const m4Club = c => MS.at(c, P('club_door', -8.5, -3.5, Math.PI / 2));
  const m4Bouncer = c => MS.npc(c, 'bouncer', 'bandit', P('club_door', 0.8, 1.6, Math.PI), { kind: 'bandit', weapon: 'pm', who: 'Охранник', hp: 120 });
  const m4Path = c => { const v = c.get('volga'), e = m4Club(c); return N.routeTo(c.w.city, [v.x, v.z], [e.x, e.z]); };
  const m4Drive = (c, speed) => {
    const v = c.get('volga');
    if (!v || v.dead) return;
    const path = c.vars.path || (c.vars.path = m4Path(c).map(q => ({ x: q.x, z: q.z })));
    v.ai = { mode: 'route', path, speed: speed || 11.5, wp: v.ai && v.ai.path === path ? v.ai.wp : 0, wpR: 5 };
    v.lights = c.w.clock > 20 * 60;
  };
  const m4Spotted = c => {
    if (c.vars.spotted) return;
    c.vars.spotted = 1;
    const v = c.get('volga');
    if (v && v.ai) { v.ai.speed = 21; v.ai.delay = 0; }
    c.w.setWanted(Math.max(1, c.w.wanted.level));
    c.say([['driver', 'Анатолий Сергеевич, за нами хвост!', '~phone'], ['tyoma', 'Засекли. Ладно, теперь не отстать.']]);
    c.jump('chase');
  };

  N.addMission({
    id: 'm4', title: 'Служебная «Волга»', giver: 'kesha', marker: 'kesha_door', requires: ['m2'], reward: 5000,
    steps: [
      { type: 'call', fn: c => {
        c.w.clock = 18 * 60 + 5;
        MS.npc(c, 'kesha', 'kesha', P('kesha_door', 0.6, 0.3, Math.PI), { friendly: true, hp: 300 });
      } },
      { type: 'cut', at: 'kesha_door', shots: [
        sh({ k: 'two', a: 'kesha', b: 'tyoma' }, [
          ['kesha', 'Тёма! Я нашёл. Без звонков, между прочим. Через бывшую жену бухгалтера.', 'point>tyoma'],
          ['tyoma', 'Кто?']
        ], { beats: [[0, S => { S.put('tyoma', [-1.7, 0.5], 'kesha'); S.face('kesha', 'tyoma'); }]] }),
        sh({ k: 'mcu', a: 'kesha', b: 'tyoma' }, [
          ['kesha', 'Сделку продал Борзых. Анатолий Сергеевич, замдиректора ГАЗа по сбыту. Это он нам «Волги» обещал.'],
          ['kesha', 'Сейчас он в ДК ГАЗ, на профсоюзном собрании. Потом едет отдыхать. На служебной «Волге», бордовой.']
        ]),
        sh({ k: 'mcu', a: 'tyoma', b: 'kesha' }, [['tyoma', 'Мне он зачем?']]),
        sh({ k: 'two', a: 'kesha', b: 'tyoma', side: -1 }, [
          ['kesha', 'Не он. Его ежедневник. В бардачке. Борзых туда всё пишет — старая школа, партийная.', 'count'],
          ['kesha', 'Проследи, куда он едет. Только не вплотную: водитель у него бывший гаишник, глаз намётанный.', 'calm']
        ]),
        sh({ k: 'ots', a: 'kesha', b: 'tyoma' }, [
          ['kesha', 'А когда Борзых уйдёт отдыхать — бери «Волгу» и гони ко мне в гараж, за контору.'],
          ['tyoma', 'Охрана?'],
          ['kesha', 'Там, где он отдыхает, охрана своя. Будет шум. Тёма, только без трупов, я тебя умоляю.', 'head']
        ])
      ] },
      { type: 'call', fn: c => {
        MS.rm(c, 'kesha');
        m4Volga(c, P('dk', 4.5, -4, Math.PI / 2));
        const d = MS.npc(c, 'driver', 'driver', P('dk', 4.5, -4), { kind: 'worker' });
        c.w.seat(d, c.get('volga'), true);
        d.anim.board = null;
        MS.npc(c, 'borzyh', 'borzyh', P('dk', 15, 0, Math.PI), { hidden: true });
      } },
      { type: 'goto', at: P('dk', -6, 0), r: 55, text: 'Езжай к ДК ГАЗ и жди Борзых. Близко не подъезжай.' },
      { type: 'cut', at: 'dk', clear: 25, shots: [
        sh({ p: [-10, -16, 3.5], l: [8, -2, 2.5], fov: 0.8 }, [['borzyh', 'Собрание окончено, товарищи. Все свободны.']], { pre: 0.8, beats: [[0, S => { S.show('borzyh'); S.walk('borzyh', [6.8, -3.1], { keep: true, face: 'volga' }); }]] }),
        sh({ k: 'ms', a: 'borzyh', b: 'volga' }, [
          ['driver', 'Куда, Анатолий Сергеевич?'],
          ['borzyh', 'Куда-куда. Как обычно, Валера. Пятница же.']
        ], { beats: [[0, S => S.put('borzyh', [6.0, -3.0], 'volga')], ['L1', S => S.enter('borzyh', 'volga', { driver: false })]] }),
        sh({ k: 'cu', a: 'tyoma', yaw: 0.4 }, [['tyoma', 'Поехали, Анатолий Сергеевич.']])
      ] },
      { type: 'call', fn: c => {
        const b = c.get('borzyh'), v = c.get('volga');
        if (b && v && b.veh !== v) { c.w.seat(b, v, false); b.anim.board = null; }
        c.vars.path = null;
        m4Drive(c);
        c.vars.stop = 0;
        c.g.help(N.HELP.tail, 7);
      } },
      { type: 'cp', id: 'dk', name: 'ДК ГАЗ', place: c => {
        m4Volga(c, P('dk', 4.5, -4, Math.PI / 2));
        const d = MS.npc(c, 'driver', 'driver', P('dk', 4.5, -4), { kind: 'worker' });
        const b = MS.npc(c, 'borzyh', 'borzyh', P('dk', 4.5, -4));
        c.w.seat(d, c.get('volga'), true);
        c.w.seat(b, c.get('volga'), false);
        d.anim.board = b.anim.board = null;
        const car = MS.veh(c, 'ride', 'vaz2107', P('dk', -62, 8, Math.PI / 2), { color: '#3a4a5a' });
        MS.tp(c, null, { car: 'ride' });
        c.vars.path = null;
        m4Drive(c);
        c.vars.stop = 0;
        c.vars.spotted = 0;
      } },
      { type: 'tail', tag: 'volga', near: 13, far: 170, spot: 4.5, lose: 11, text: 'Следи за бордовой «Волгой». Не подъезжай близко и не отставай.', tick: (c, dt) => {
        const v = c.get('volga');
        if (!v || !v.ai || !v.ai.path) return;
        const k = v.ai.wp / v.ai.path.length;
        if (k > 0.3 && !c.vars.l1) { c.vars.l1 = 1; c.say([['tyoma', 'Партийная школа. Даже по кабакам — на служебной.']]); }
        if (k > 0.47 && !c.vars.stop) { c.vars.stop = 1; v.ai.delay = 7; c.say([['tyoma', 'Встали. Валера за сигаретами пошёл. Не светись.']]); }
      }, spotted: m4Spotted, done: c => { const v = c.get('volga'); return !!(v && v.ai && v.ai.arrived); },
      bot: c => { const v = c.get('volga'), e = m4Club(c); Object.assign(v, { x: e.x, z: e.z, yaw: e.yaw }); v.ai.arrived = true; } },
      { type: 'fn', id: 'chase', text: 'Не упусти «Волгу» Борзых!', fn: c => { const v = c.get('volga'); return !!(v && v.ai && v.ai.arrived); },
        blips: c => { const v = c.get('volga'); return v && !v.dead ? [{ x: v.x, z: v.z, type: 'enemy', ent: v }] : []; },
        fails: [{ far: 'volga', dist: 260, time: 10, text: '«Волга» ушла.' }, { destroyed: 'volga', text: 'Ты разбил «Волгу» вместе с ежедневником.' }],
        bot: c => { const v = c.get('volga'), e = m4Club(c); Object.assign(v, { x: e.x, z: e.z, yaw: e.yaw }); if (v.ai) v.ai.arrived = true; } },
      { type: 'call', fn: c => {
        const v = c.get('volga');
        v.ai = null; v.ctl.thr = 0; v.ctl.hand = true;
        m4Bouncer(c);
      } },
      { type: 'cut', at: 'club_door', clear: 20, shots: [
        sh({ p: [-16, 9, 3.2], l: [2, -1, 3.5], fov: 0.82, m: 'in', ma: 0.12 }, [], { dur: 2.6, beats: [[0, S => { S.exit('borzyh'); S.exit('driver'); }], [0.2, S => { S.walk('borzyh', [-1.0, 0.4], { keep: true, face: 'bouncer' }); S.walk('driver', [-1.6, -1.0], { keep: true, face: 'bouncer' }); }]] }),
        sh({ k: 'two', a: 'bouncer', b: 'borzyh' }, [
          ['Охранник', 'Анатолий Сергеевич! Проходите, вас ждут.', 'calm>borzyh'],
          ['borzyh', 'Валера, со мной пойдёшь. Неспокойно мне сегодня.']
        ], { beats: [[0, S => { S.put('borzyh', [-1.0, 0.4], 'bouncer'); S.put('driver', [-1.6, -1.0], 'bouncer'); }]] }),
        sh({ p: [-6, 2.5, 1.9], l: [1.5, 0, 1.5], fov: 0.8 }, [], { dur: 2.4, beats: [[0, S => { S.walk('borzyh', [3.2, 0], { keep: true }); S.walk('driver', [3.2, 0.5], { keep: true }); }], ['end', S => { S.hide('borzyh'); S.hide('driver'); }]] }),
        sh({ k: 'cu', a: 'tyoma', yaw: 0.3 }, [['tyoma', 'Казино «Мираж». Запомним.']])
      ] },
      { type: 'call', fn: c => { MS.rm(c, 'borzyh', 'driver'); } },
      { type: 'cp', id: 'club', name: 'У «Миража»', place: c => {
        const e = m4Club(c);
        m4Volga(c, [e.x, e.z, e.yaw]);
        m4Bouncer(c);
        MS.veh(c, 'ride', 'vaz2107', P('club_door', -9.5, 28, -Math.PI / 2), { color: '#3a4a5a' });
        MS.tp(c, P('club_door', -12, 26, Math.PI));
      } },
      { type: 'enter', tag: 'volga', text: 'Угони «Волгу» Борзых. Ежедневник — в бардачке.', fails: [{ destroyed: 'volga', text: '«Волга» уничтожена вместе с ежедневником.' }] },
      { type: 'call', fn: c => {
        c.w.setWanted(Math.max(2, c.w.wanted.level));
        const b = c.get('bouncer');
        if (b && !b.dead) b.ai = { mode: 'attack', target: c.w.player, mission: true, range: 16, acc: 0.25 };
        c.say([['Охранник', 'Стой! Это машина Анатолия Сергеевича!'], ['tyoma', 'Была.']]);
        c.vars.alarm = 8;
      } },
      { type: 'lose', inVeh: 'volga', text: 'Оторвись от милиции или перекрась «Волгу» в автосервисе.', help: 'wanted', tick: (c, dt) => {
        const v = c.get('volga');
        if (v && c.vars.alarm > 0) { c.vars.alarm -= dt; if ((c.vars.alarm * 2 | 0) !== ((c.vars.alarm + dt) * 2 | 0)) { v.horn = 0.3; c.w.emit({ t: 'horn', v }); } }
      }, fails: [{ destroyed: 'volga', text: '«Волга» уничтожена вместе с ежедневником.' }] },
      { type: 'cp', id: 'volga', name: 'Чистая «Волга»', place: c => {
        m4Volga(c, P('club_door', -40, 60, Math.PI));
        MS.tp(c, null, { car: 'volga' });
      } },
      { type: 'goto', at: 'kesha_garage', r: 3.8, veh: 'volga', stop: true, text: 'Пригони «Волгу» в гараж Кеши — во двор за «Фемидой».', fails: [{ destroyed: 'volga', text: '«Волга» уничтожена вместе с ежедневником.' }] },
      { type: 'call', fn: c => {
        const v = c.get('volga');
        v.ctl.thr = 0;
        c.w.exitVehicle(c.w.player);
        v.locked = true;
        MS.npc(c, 'kesha', 'kesha', P('kesha_garage', -3, 2.5), { friendly: true, hp: 300 });
        c.pickup('diary', 'item', 0, 0, { item: 'diary', follow: c.get('kesha') });
      } },
      { type: 'cut', at: 'kesha_garage', clear: 16, shots: [
        sh({ k: 'two', a: 'kesha', b: 'tyoma' }, [
          ['kesha', 'Так... «Совещание»... «Баня»... «Профком»... Вот!', 'count'],
          ['kesha', 'Двенадцатое июля: «Москвичи. Причал. Хромой — шестьдесят, «Шампанское» — сорок».']
        ], { beats: [[0, S => { S.put('tyoma', [-2.6, -0.4], 'kesha'); S.face('kesha', 'tyoma'); }]] }),
        sh({ k: 'mcu', a: 'tyoma', b: 'kesha' }, [['tyoma', 'Хромой — это кто?']]),
        sh({ k: 'mcu', a: 'kesha', b: 'tyoma' }, [
          ['kesha', 'Автозаводский. Бандит старой закалки. А «Шампанское»... Не знаю. Кличка? Фирма?', 'shrug'],
          ['kesha', 'Сорок процентов, Тёма. Это не шестёрка.']
        ]),
        sh({ k: 'ots', a: 'kesha', b: 'tyoma' }, [
          ['tyoma', 'Борзых поехал в «Мираж».'],
          ['kesha', '«Мираж»... Тёма, «Мираж» — это Лёва. Лёва Дьяков. Помнишь Лёву?']
        ]),
        sh({ k: 'cu', a: 'tyoma', b: 'kesha' }, [['tyoma', 'Помню.']], { hold: 1.0 }),
        sh({ k: 'two', a: 'kesha', b: 'tyoma', side: -1 }, [
          ['kesha', 'Он звонил. Узнал, что ты вышел, — зовёт в гости. Говорит, может помочь.', 'calm'],
          ['tyoma', 'Восемь лет не звонил.'],
          ['kesha', 'Ну... Люди меняются.'],
          ['tyoma', 'Люди — нет. Схожу.']
        ])
      ] },
      { type: 'call', fn: c => { MS.rm(c, 'volga', 'diary', 'kesha'); } }
    ],
    onPass: g => g.later(5, () => g.pager(N.PAGER.afterM4))
  });

  const m5Bmw = c => {
    const city = c.w.city;
    const path = N.routeVia(city, city.tributeLoop.concat([city.tributeLoop[0]])).map(q => ({ x: q.x, z: q.z }));
    const a = path[0], b = path[Math.min(1, path.length - 1)];
    const v = MS.veh(c, 'bmw', 'bmw525', [a.x, a.z, N.yawOf(b.x - a.x, b.z - a.z)], { color: '#0e0e10', heavy: 1.3, hp: 1700 });
    for (let i = 0; i < 2; i++) {
      const p = MS.npc(c, 'b' + i, 'bandit', [a.x, a.z], { kind: 'bandit', weapon: 'pm', gang: true, who: 'Бандит' });
      c.w.seat(p, v, i === 0);
      p.anim.board = null;
      p.ai.shootFromCar = true;
    }
    v.ai = { mode: 'route', path, loop: true, speed: 12.5, wp: 0 };
    c.vars.stops = city.tributeLoop.map(q => [q[0], q[1]]);
    c.vars.stopped = -1;
  };
  const m5Gift = c => MS.veh(c, 'gift', 'vaz2109', P('club_door', -8.4, 3.5, Math.PI / 2), { color: '#b0141a' });
  const m5Wreck = c => {
    const v = c.get('bmw');
    if (!v) return;
    c.pickup('bag', 'item', v.x + 2.2, v.z + 1.2, { item: 'bag' });
    for (let i = 0; i < 2; i++) { const b = c.get('b' + i); if (b && !b.dead && b.veh) { c.w.exitVehicle(b); b.ai = { mode: 'attack', target: c.w.player, mission: true }; } }
    if (v.ai) v.ai = null;
  };

  N.addMission({
    id: 'm5', title: 'Бумер', giver: 'lyova', marker: 'club_meet', requires: ['m3', 'm4'], reward: 6000, club: true,
    steps: [
      { type: 'call', fn: c => {
        const w = c.w;
        if (w.clock < 21 * 60 && w.clock > 6 * 60) w.clock = 21 * 60 + 30;
        c.g.teleport('club_in');
        const r = w.city.clubRoom;
        MS.npc(c, 'lyova', 'lyova', [r.x0 + 31, r.z1 - 3.6, Math.PI], { friendly: true, hp: 400 });
        MS.npc(c, 'vadik', 'vadik', [r.x0 + 34.5, r.z1 - 2.6, Math.PI], { friendly: true, hp: 300, gest: 'arms' });
        for (let i = 0; i < 2; i++) MS.npc(c, 'girl' + i, 'dancer', [r.x0 + 28.5 + i * 1.2, r.z1 - 2.4, Math.PI * 0.9], { kind: 'dancer', ai: { dance: true } });
        for (let i = 0; i < 8; i++) { const p = MS.npc(c, 'dancer' + i, i % 3 ? 'dancer' : 'student', [r.x0 + 13 + (i % 4) * 3.2, r.z0 + 11 + Math.floor(i / 4) * 3.4, i], { kind: i % 3 ? 'dancer' : 'student' }); p.ai = { mode: 'idle', dance: true, mission: true }; }
        const pl = w.player;
        pl.x = r.x0 + 21; pl.z = r.z1 - 6; pl.yaw = Math.PI / 2;
      } },
      { type: 'cut', at: c => { const r = c.w.city.clubRoom; return { x: r.x0 + 25, z: r.z1 - 5, yaw: Math.PI / 2, y: 0.1 }; }, clear: 0, shots: [
        sh({ p: [-12, -7, 3.2], l: [0, -9, 1.4], fov: 0.85, m: 'right', ma: 1.6 }, [], { dur: 3.2, fade: 'in' }),
        sh({ k: 'two', a: 'lyova', b: 'tyoma', d: 5.2, h: 0.4 }, [['lyova', 'Тимофей! Живой! Восемь лет, мать моя женщина!', 'hug>tyoma']], { pre: 0.8, beats: [[0, S => { S.put('tyoma', [-0.4, 0], [3, 0]); S.walk('lyova', [1.4, 0.3], { face: 'tyoma' }); }]] }),
        sh({ k: 'two', a: 'lyova', b: 'tyoma' }, [
          ['lyova', 'Дай посмотрю на тебя... Похудел. Ничего, откормим.', 'shrug'],
          ['tyoma', 'Здравствуй, Лёва.'],
          ['lyova', 'Шампанского? Это «Советское», но бутылка французская.', 'drink']
        ]),
        sh({ k: 'mcu', a: 'lyova', b: 'tyoma' }, [['lyova', 'Я бы приехал к тебе, Тимофей. Честно. Дела. Тут такое творилось — ты не представляешь.', 'calm']]),
        sh({ k: 'mcu', a: 'tyoma', b: 'lyova' }, [['tyoma', 'Две передачки.']]),
        sh({ k: 'mcu', a: 'lyova', b: 'tyoma' }, [['lyova', 'Что?']], { hold: 0.6 }),
        sh({ k: 'ots', a: 'tyoma', b: 'lyova' }, [
          ['tyoma', 'Ты прислал две передачки. За восемь лет.'],
          ['lyova', 'Ты считал?'],
          ['tyoma', 'Время было.']
        ]),
        sh({ k: 'two', a: 'lyova', b: 'tyoma', side: -1 }, [
          ['lyova', 'Ну, Тимофей! Зато какие передачки были! Финский сервелат!', 'shrug'],
          ['lyova', 'Ладно. О деле. Наслышан про твою беду. Причал, Москва, триста тысяч. В Автозаводе такое делает один человек — Хромой.', 'point']
        ]),
        sh({ k: 'mcu', a: 'lyova', b: 'tyoma' }, [['lyova', 'У меня, кстати, на днях со стоянки служебную «Волгу» увели. Борзых с ГАЗа чуть инфаркт не схватил.', 'look']]),
        sh({ k: 'cu', a: 'tyoma', b: 'lyova' }, [], { dur: 1.8 }),
        sh({ k: 'mcu', a: 'lyova', b: 'tyoma' }, [['lyova', 'Шучу. Ну, не шучу, но ладно.', 'calm']]),
        sh({ k: 'two', a: 'lyova', b: 'tyoma' }, [
          ['lyova', 'Ребята Хромого прямо сейчас собирают дань с ларьков на Ленина. Чёрный «бумер». Отбей кассу — будет тебе первый взнос в московский долг.'],
          ['lyova', 'Вадик, дай Тимофею ключи от «девятки».', 'beckon']
        ]),
        sh({ k: 'ms', a: 'vadik', b: 'tyoma' }, [['vadik', 'Красная, у входа.', 'give>tyoma']], { beats: [[0, S => { S.calm('vadik'); S.put('vadik', [0.6, 1.6], 'tyoma'); }]] }),
        sh({ k: 'mcu', a: 'lyova', b: 'tyoma' }, [['lyova', 'Деньги любят дружбу, Тимофей.', 'drink']], { fade: 'out' })
      ] },
      { type: 'call', fn: c => {
        MS.rm(c, 'lyova', 'vadik', 'girl0', 'girl1');
        for (let i = 0; i < 8; i++) MS.rm(c, 'dancer' + i);
        MS.tp(c, P('club_door', -2.6, 0, Math.PI));
        m5Gift(c);
        m5Bmw(c);
        c.g.help(N.HELP.driveby, 7);
      } },
      { type: 'cp', id: 'loop', name: 'У «Миража»', place: c => { MS.tp(c, P('club_door', -2.6, 0, Math.PI)); m5Gift(c); m5Bmw(c); } },
      { type: 'fn', text: 'Найди чёрный «бумер» — он объезжает ларьки у проспекта Ленина. Останови его.', tick: (c, dt) => {
        const v = c.get('bmw'), pl = c.w.player;
        if (!v || v.dead || !v.ai) return;
        if (!c.vars.fleeing && v.ai.mode === 'route') {
          c.vars.stops.forEach((q, i) => {
            if (c.vars.stopped !== i && Math.hypot(v.x - q[0], v.z - q[1]) < 14) { c.vars.stopped = i; v.ai.delay = 5; if (Math.hypot(v.x - pl.x, v.z - pl.z) < 120) c.say([['tyoma', 'Встали у ларька. Собирают.']]); }
          });
        }
        if (!c.vars.fleeing && Math.hypot(v.x - pl.x, v.z - pl.z) < 45) { c.vars.fleeing = 1; v.ai = { mode: 'flee', speed: 25 }; c.say([['Бандит', 'Это не мент! Гони!'], ['tyoma', 'Заметили. Уходят.']]); }
      }, fn: c => {
        const v = c.get('bmw');
        return !v || v.dead || !v.driver || v.driver.dead || v.hp < v.maxHp * 0.22;
      }, blips: c => { const v = c.get('bmw'); return v && !v.dead ? [{ x: v.x, z: v.z, type: 'enemy', ent: v }] : []; },
      fails: [{ far: 'bmw', dist: 400, time: 10, text: '«Бумер» ушёл.' }],
      bot: c => { const v = c.get('bmw'); c.w.damageVehicle(v, 5000, c.w.player, true); } },
      { type: 'call', fn: m5Wreck },
      { type: 'collect', tag: 'bag', text: 'Забери сумку с деньгами.' },
      { type: 'call', fn: c => {
        c.vars.bx = c.w.player.x; c.vars.bz = c.w.player.z;
        c.say([['tyoma', 'Пачки банковские. «Сбербанк. Москва». Это московские деньги. Мои.']]);
      } },
      { type: 'cp', id: 'bag', name: 'Сумка с деньгами', place: c => {
        if (c.vars.bx === undefined) { const q = c.w.city.tributeLoop[1]; c.vars.bx = q[0]; c.vars.bz = q[1]; }
        const sp = c.w.city.freeSpot(c.vars.bx + 4, c.vars.bz, 8);
        MS.veh(c, 'ride', 'vaz2109', [sp[0], sp[1], 0], { color: '#b0141a' });
        MS.tp(c, [c.vars.bx, c.vars.bz, 0]);
      } },
      { type: 'goto', at: 'club_meet', r: 3, veh: 'none', text: 'Отвези деньги Лёве в «Мираж».' },
      { type: 'call', fn: c => {
        MS.npc(c, 'lyova', 'lyova', P('club_meet', 1.2, 0.8, Math.PI), { friendly: true, hp: 400 });
        MS.npc(c, 'vadik', 'vadik', P('club_meet', 1.6, -1.2, Math.PI), { friendly: true, hp: 300, gest: 'arms' });
      } },
      { type: 'cut', at: 'club_meet', clear: 16, shots: [
        sh({ k: 'two', a: 'lyova', b: 'tyoma' }, [
          ['lyova', 'Красавчик! Ну, давай посмотрим.', 'count>tyoma'],
          ['tyoma', 'Пачки банковские. Московские. Это мои деньги, Лёва.']
        ], { beats: [[0, S => S.put('tyoma', [-1.2, 0.4], 'lyova')]] }),
        sh({ k: 'mcu', a: 'lyova', b: 'tyoma' }, [['lyova', 'Значит, я не ошибся. Хромой.', 'nod']], { hold: 0.8 }),
        sh({ k: 'ots', a: 'lyova', b: 'tyoma' }, [
          ['lyova', 'Держи. Половина — твоя. Вторая половина — мне. За наводку.', 'give'],
          ['tyoma', 'Половина? Это всё моё.']
        ]),
        sh({ k: 'mcu', a: 'lyova', b: 'tyoma' }, [['lyova', 'Тимофей, ну что ты как маленький. Без меня ты бы этот «бумер» до осени искал. Деньги любят дружбу.', 'shrug']]),
        sh({ k: 'cu', a: 'tyoma', b: 'lyova' }, [], { dur: 1.6 }),
        sh({ k: 'mcu', a: 'lyova', b: 'tyoma' }, [['lyova', 'И не дуйся. Хромой теперь злой. А злые делают ошибки.', 'calm']])
      ] },
      { type: 'call', fn: c => { MS.rm(c, 'lyova', 'vadik'); const v = c.get('gift'); if (v) { v.keep = false; delete c.ents.gift; v.persistent = false; } } }
    ],
    onPass: g => g.later(6, () => g.pager(N.PAGER.afterM5))
  });

  const R = (c, line) => c.say([line]);
  const m6Colonel = c => {
    const k = MS.npc(c, 'colonel', 'colonel', P('colonel_npc', 0, 0), { friendly: true, hp: 400, invuln: true, weapon: 'svd' });
    k.yaw = c.w.city.places.colonel_npc.yaw;
    return k;
  };
  const m6Targets = c => {
    const meet = c.w.city.places.park_meet;
    const pts = [[0, 0], [2.2, 0.5], [1, 2.2], [-1.2, 1.5]];
    for (let i = 0; i < 4; i++) {
      const who = i === 0 ? 'gena' : 'bandit';
      const p = MS.npc(c, 't' + (i + 1), who, [meet.x + pts[i][0], meet.z + pts[i][1]], { kind: 'bandit', weapon: 'pm', gang: true, hp: 100 });
      p.ai = { mode: 'idle', mission: true, face: { x: meet.x + 0.5, z: meet.z + 1 } };
    }
    MS.veh(c, 'c1', 'bmw525', P('park_cars', 0, 0, 0), { color: '#101010' });
    MS.veh(c, 'c2', 'lc80', P('park_cars', -7, 0, 0), { color: '#1a2c48' });
    c.vars.dead = 0;
  };

  N.addMission({
    id: 'm6', title: 'Колесо обозрения', giver: 'colonel', marker: 'colonel', requires: ['m3'], reward: 7000,
    steps: [
      { type: 'call', fn: c => { c.w.clock = 19 * 60 + 50; m6Colonel(c); } },
      { type: 'cut', at: 'colonel_npc', shots: [
        sh({ k: 'ms', a: 'colonel', yaw: -0.5 }, [['colonel', 'Хромой мне задолжал, Верещагин. Взял партию «калашей» — и забыл заплатить. Забывчивый.']], { beats: [[0, S => S.walk('tyoma', [0.3, -1.8], { face: 'colonel' })]] }),
        sh({ k: 'two', a: 'colonel', b: 'tyoma' }, [
          ['colonel', 'Сегодня его люди встречаются в Автозаводском парке. На картодроме, за аттракционами. Четверо. Главные у него.', '>tyoma'],
          ['colonel', 'Один из них — твой Гена. С причала.']
        ]),
        sh({ k: 'cu', a: 'tyoma', b: 'colonel' }, [['tyoma', 'Гена — мой.']]),
        sh({ k: 'ms', a: 'colonel', b: 'tyoma' }, [
          ['colonel', 'Держи СВД. Не спрашивай откуда. Купи билет на колесо обозрения — сверху картодром как на ладони.', 'give'],
          ['colonel', 'Колесо идёт медленно. Наверху у тебя минута, не больше.']
        ]),
        sh({ k: 'two', a: 'colonel', b: 'tyoma', side: -1 }, [
          ['colonel', 'И рацию возьми. Я рядом встану, посмотрю в бинокль. Подскажу.', 'give'],
          ['tyoma', 'А если разбегутся?'],
          ['colonel', 'Значит, стреляй быстрее, чем они бегают.']
        ])
      ] },
      { type: 'call', fn: c => { MS.give(c, 'svd', 20, true); const k = c.get('colonel'); if (k) k.weapon = 'fists'; } },
      { type: 'goto', at: 'ferris', r: 2.4, veh: 'none', text: 'Езжай в Автозаводский парк, к колесу обозрения в городке аттракционов.' },
      { type: 'cp', id: 'wheel', name: 'Колесо обозрения', place: c => MS.tp(c, 'ferris'), kit: { weapons: { svd: 15 }, equip: 'svd' } },
      { type: 'say', lines: [['colonel', 'Я на месте, Верещагин. Картодром вижу. Садись в кабинку — билет за мой счёт.', '~radio']] },
      { type: 'fn', text: 'Садись в кабинку колеса обозрения.', fn: c => !!c.w.player.ride, bot: c => { if (c.w.park) c.w.park.board(c.w.player, { loop: true }); } },
      { type: 'call', fn: c => { m6Targets(c); c.w.player.weapon = 'svd'; } },
      { type: 'say', lines: [['colonel', 'Подъехали. Две машины, четверо. Гена — в белой куртке. Жди, пока поднимешься.', '~radio']] },
      { type: 'fn', text: 'Поднимись повыше: сверху виден картодром.', fn: c => c.w.player.ride && c.w.player.y > 18, bot: c => {
        const pk = c.w.park, pl = c.w.player;
        if (!pk) return;
        if (!pl.ride) pk.board(pl, { loop: true });
        const T = Math.PI * 2, W = c.w.city.parkData.wheel, ph = pk.cabin(pl.ride.i).ph;
        pk.advance(((Math.PI - ph) % T + T) % T / T * W.period);
      } },
      { type: 'call', fn: c => c.g.help(N.HELP.sniper) },
      { type: 'kill', tags: ['t1', 't2', 't3', 't4'], text: 'Сними всех четверых, пока кабинка наверху.', tick: (c, dt) => {
        const dead = MS.tags('t', 4).filter(t => !MS.alive(c, t));
        if (dead.length > c.vars.dead) {
          c.vars.dead = dead.length;
          const gena = c.get('t1');
          if (gena && gena.dead && !c.vars.gena) { c.vars.gena = 1; R(c, ['colonel', 'Гена готов. За причал.', '~radio']); }
          else R(c, ['colonel', ['Минус один.', 'Чисто.', 'Ещё один.', 'Хорошо.'][dead.length - 1] || 'Минус один.', '~radio']);
        }
        if (c.vars.panic) return;
        const hurt = MS.tags('t', 4).some(t => { const e = c.get(t); return e && (e.dead || e.hp < e.maxHp); });
        if (!hurt) return;
        c.vars.panic = 1;
        R(c, ['colonel', 'Засуетились! Бегут к машинам!', '~radio']);
        let k = 0;
        for (const t of MS.tags('t', 4)) {
          const e = c.get(t);
          if (!e || e.dead) continue;
          const cv = c.get(k % 2 ? 'c2' : 'c1');
          k++;
          e.ai = { mode: 'enter', car: cv, mission: true, drive: { mode: 'flee', speed: 24 } };
        }
      }, fails: [{ fn: c => {
        const meet = c.w.city.places.park_meet;
        for (const t of MS.tags('t', 4)) { const e = c.get(t); if (e && !e.dead && Math.hypot((e.veh || e).x - meet.x, (e.veh || e).z - meet.z) > 420) return 'Один из них ушёл.'; }
        return null;
      } }] },
      { type: 'call', fn: c => {
        const W = c.w.city.parkData.wheel, e = W.exit;
        const v = MS.veh(c, 'amb', 'vaz2109', [e[0] + W.ux * 9, e[1] + W.uz * 9, N.yawOf(-W.ux, -W.uz)], { color: '#202020' });
        ['a1', 'a2', 'a3'].forEach((t, i) => {
          const p = MS.npc(c, t, 'bandit', [e[0] + W.ux * (4 + i * 1.6) - W.nx * (i - 1) * 1.8, e[1] + W.uz * (4 + i * 1.6) - W.nz * (i - 1) * 1.8], { kind: 'bandit', weapon: i === 1 ? 'shotgun' : 'pm', gang: true, hp: 110 });
          p.fireT = 1 + i * 0.5;
          p.ai = { mode: 'attack', target: c.w.player, mission: true, range: 22, hold: true, acc: 0.3 };
        });
        v.ai = null;
        R(c, ['colonel', 'Все четверо. Только внизу тебя ждут: машина, трое. Не торопись выходить.', '~radio']);
      } },
      { type: 'kill', tags: ['a1', 'a2', 'a3'], text: 'Внизу засада. Разберись с ними — сверху или у выхода.' },
      { type: 'call', fn: c => {
        if (c.w.player.ride) c.w.player.ride.loop = false;
        c.w.setWanted(Math.max(2, c.w.wanted.level));
        R(c, ['colonel', 'Чисто. Милиция уже едет — уходи из парка. Спасибо, Верещагин. Хромой теперь мне должен поменьше.', '~radio']);
      } },
      { type: 'lose', text: 'Уйди от милиции.', help: 'wanted' }
    ],
    onPass: g => { g.pager(N.PAGER.afterM6); g.later(20, () => g.pager(N.PAGER.afterM6b)); }
  });

  const m7Gang = c => {
    const Rr = c.w.city.chopRect;
    const at = (u, v) => [Rr.ox + Rr.ax * u + Rr.nx * v, Rr.oz + Rr.az * u + Rr.nz * v];
    const pts = [at(-20, -12), at(-8, -18), at(6, -14), at(18, -4), at(-14, 6), at(2, 10), at(14, 12)];
    MS.crew(c, 'h', pts, { kind: 'bandit', weapons: ['pm', 'shotgun', 'pm', 'knife', 'pm', 'toz34', 'pm'], aggro: 30 });
    const lp = c.w.city.places.chop_ledger;
    c.pickup('ledger', 'item', lp.x, lp.z, { item: 'ledger' });
    c.vars.at = at(0, -24);
  };

  N.addMission({
    id: 'm7', title: 'Дробь', giver: 'lyova', marker: 'club_meet', requires: ['m5'], reward: 8000,
    steps: [
      { type: 'call', fn: c => {
        if (c.w.clock > 6 * 60 && c.w.clock < 22 * 60) c.w.clock = 22 * 60 + 40;
        MS.npc(c, 'lyova', 'lyova', P('club_meet', 1.2, 0.8, Math.PI), { friendly: true, hp: 400 });
        MS.npc(c, 'vadik', 'vadik', P('club_meet', 1.6, -1.2, Math.PI), { friendly: true, hp: 300, gest: 'arms', weapon: 'shotgun' });
      } },
      { type: 'cut', at: 'club_meet', clear: 16, shots: [
        sh({ k: 'two', a: 'lyova', b: 'tyoma' }, c => (c.g.done('m6') ? [
          ['lyova', 'Тимофей, слыхал? Ребят Хромого в парке кто-то с колеса обозрения снял. Не ты, случайно?', 'look>tyoma'],
          ['tyoma', 'Не я.'],
          ['lyova', 'Вот и я думаю — не ты. А значит, пора.']
        ] : [
          ['lyova', 'Тимофей, Хромой зашевелился. Чует, что под него копают.', 'calm>tyoma'],
          ['tyoma', 'Пусть чует.'],
          ['lyova', 'Пусть. А мы ударим первыми.']
        ]), { beats: [[0, S => S.put('tyoma', [-1.2, 0.4], 'lyova')]] }),
        sh({ k: 'mcu', a: 'lyova', b: 'tyoma' }, [
          ['lyova', 'У Хромого автосервис на Мончегорской. Там их касса и тетрадка. Чёрная бухгалтерия: кто кому сколько должен.', 'count'],
          ['lyova', 'Принеси мне тетрадку — и Хромой без штанов.']
        ]),
        sh({ k: 'ms', a: 'vadik', b: 'tyoma' }, [['lyova', 'Вадик, дай Тимофею инструмент.']], { beats: [[0, S => { S.calm('vadik'); S.walk('vadik', [0.2, -0.4], { face: 'tyoma' }); }], ['L0', S => S.gest('vadik', 'give', 2)]] }),
        sh({ k: 'ots', a: 'lyova', b: 'tyoma' }, [
          ['tyoma', 'Что тебе в тетрадке, Лёва?'],
          ['lyova', 'Читать люблю, Тимофей. Особенно чужие долги.', 'drink']
        ])
      ] },
      { type: 'call', fn: c => { MS.rm(c, 'lyova', 'vadik'); MS.give(c, 'shotgun', 24, true); } },
      { type: 'goto', at: 'chop_gate', r: 22, text: 'Езжай в автосервис Хромого на Мончегорской.' },
      { type: 'call', fn: m7Gang },
      { type: 'cut', at: 'chop_gate', clear: 0, shots: [
        sh({ k: 'wide', a: 'h2', d: 11, h: 3, yaw: 2.4, lh: 1.2 }, [
          ['Бандит', 'Хромой сказал: до утра «бумер» на запчасти. Кто не успеет — сам на запчасти пойдёт.'],
          ['Бандит', 'А тетрадку куда?'],
          ['Бандит', 'В контору. Под навес. Куда ж ещё.']
        ], { beats: [[0, S => { S.gest('h2', 'arms', 8); S.gest('h3', 'count', 8); }]] }),
        sh({ k: 'cu', a: 'tyoma', yaw: 0.4 }, [['tyoma', 'Под навес. Спасибо.']])
      ] },
      { type: 'cp', id: 'chop', name: 'Автосервис Хромого', place: c => { m7Gang(c); MS.tp(c, P('chop_gate', -2, 0)); }, kit: { weapons: { shotgun: 18 }, equip: 'shotgun' } },
      { type: 'kill', tags: MS.tags('h', 7), text: 'Зачисти автосервис Хромого. Дробовик — в упор.' },
      { type: 'collect', tag: 'ledger', text: 'Забери тетрадь из конторы под навесом.' },
      { type: 'call', fn: c => {
        const a = c.vars.at, gate = c.w.city.places.chop_gate;
        const v = MS.veh(c, 'rein', 'bmw525', [gate.x - Math.sin(gate.yaw) * 40, gate.z + Math.cos(gate.yaw) * 40, gate.yaw], { color: '#141414', heavy: 1.4 });
        ['r1', 'r2', 'r3'].forEach((t, i) => { const p = MS.npc(c, t, 'bandit', [v.x, v.z], { kind: 'bandit', weapon: i ? 'pm' : 'shotgun', gang: true }); c.w.seat(p, v, i === 0); p.anim.board = null; });
        v.ai = { mode: 'route', path: [{ x: gate.x, z: gate.z }, { x: a[0], z: a[1] }], speed: 18, wp: 0 };
        c.vars.rein = 0;
        c.say([['tyoma', 'Есть тетрадка. И гости.']]);
      } },
      { type: 'fn', text: 'Подкрепление Хромого! Отбейся.', tick: (c, dt) => {
        const v = c.get('rein');
        if (v && !c.vars.rein && (v.dead || (v.ai && v.ai.arrived) || Math.abs(v.spd) < 1 && c.t > 4)) {
          c.vars.rein = 1;
          for (const t of ['r1', 'r2', 'r3']) { const e = c.get(t); if (e && !e.dead && e.veh) { c.w.exitVehicle(e); e.ai = { mode: 'attack', target: c.w.player, mission: true }; } }
        }
      }, fn: c => MS.count(c, ['r1', 'r2', 'r3']) === 0, blips: c => ['r1', 'r2', 'r3'].filter(t => MS.alive(c, t)).map(t => { const e = c.get(t); return { x: (e.veh || e).x, z: (e.veh || e).z, type: 'enemy', ent: e }; }),
      bot: c => { for (const t of ['r1', 'r2', 'r3']) { const e = c.get(t); if (e && !e.dead) c.w.damagePed(e, 9999, c.w.player, 'bullet'); } } },
      { type: 'say', wait: true, lines: [['tyoma', '«Двенадцатое июля. Причал. Хромому — шестьдесят. Шампанскому — сорок»... Опять «Шампанское».']] },
      { type: 'cp', id: 'ledger', name: 'Тетрадь у тебя', place: c => {
        const g = c.w.city.places.chop_gate;
        MS.veh(c, 'ride', 'vaz2109', P('chop_gate', -10, 4, Math.PI / 2), { color: '#3a4a5a' });
        MS.tp(c, P('chop_gate', -6, 0));
      } },
      { type: 'choice', var: 'ledger', text: 'Отдай тетрадь Лёве в «Мираж» — или покажи её Кеше в «Фемиде».', options: [{ at: 'club_meet', value: 'lyova', r: 3, label: 'Лёва' }, { at: 'kesha_door', value: 'kesha', r: 3, label: 'Кеша' }] },
      { type: 'call', fn: c => {
        if (c.vars.ledger === 'lyova') {
          MS.npc(c, 'lyova', 'lyova', P('club_meet', 1.2, 0.8, Math.PI), { friendly: true, hp: 400 });
          c.pickup('book', 'item', 0, 0, { item: 'ledger', follow: c.get('lyova'), hidden: true });
        } else {
          MS.npc(c, 'kesha', 'kesha', P('kesha_door', 0.6, 0.3, Math.PI), { friendly: true, hp: 300 });
          c.pickup('book', 'item', 0, 0, { item: 'ledger', follow: c.get('kesha'), hidden: true });
        }
      } },
      { type: 'cut', at: c => (c.vars.ledger === 'lyova' ? 'club_meet' : 'kesha_door'), clear: 16, shots: c => c.vars.ledger === 'lyova' ? [
        sh({ k: 'two', a: 'lyova', b: 'tyoma' }, [['lyova', 'Тетрадочка! Моя ты хорошая...', 'count>tyoma']], { beats: [[0, (S, r) => { S.put('tyoma', [-1.2, 0.4], 'lyova'); const k = r.get('book'); if (k) k.hidden = false; }]] }),
        sh({ k: 'mcu', a: 'tyoma', b: 'lyova' }, [['tyoma', 'Там «Шампанское». Сорок процентов.']]),
        sh({ k: 'mcu', a: 'lyova', b: 'tyoma' }, [
          ['lyova', '«Шампанское»? Это Борзых. Он кроме шампанского ничего не пьёт, клоун партийный.', 'shrug'],
          ['lyova', 'Держи премию. Сверху. Заслужил.', 'give']
        ]),
        sh({ k: 'cu', a: 'tyoma', b: 'lyova' }, [['tyoma', 'Борзых, значит.']], { hold: 0.9 }),
        sh({ k: 'two', a: 'lyova', b: 'tyoma', side: -1 }, [['lyova', 'Борзых, Тимофей. Мелкая сошка с большими процентами. Иди отдыхай.', 'calm']])
      ] : [
        sh({ k: 'two', a: 'kesha', b: 'tyoma' }, [['kesha', '«Шампанскому — сорок»...', 'count>tyoma']], { beats: [[0, (S, r) => { S.put('tyoma', [-1.6, 0.5], 'kesha'); const k = r.get('book'); if (k) k.hidden = false; }]] }),
        sh({ k: 'mcu', a: 'kesha', b: 'tyoma' }, [['kesha', 'Тёма. Девяносто второй. Помнишь, как Лёву на рынке звали?', 'down']], { hold: 0.8 }),
        sh({ k: 'cu', a: 'tyoma', b: 'kesha' }, [['tyoma', 'Помню.']]),
        sh({ k: 'mcu', a: 'kesha', b: 'tyoma' }, [
          ['kesha', '«Шампанский». Он «Советское» в бутылки из-под «Моэта» переливал и толкал как французское.', 'drink'],
          ['kesha', 'Это Лёва, Тёма. Лёва сдал твою сделку.', 'head']
        ]),
        sh({ k: 'ots', a: 'tyoma', b: 'kesha' }, [
          ['tyoma', 'И Хромого на меня навёл. А меня — на Хромого.'],
          ['kesha', 'Что делать будем?']
        ]),
        sh({ k: 'two', a: 'kesha', b: 'tyoma', side: -1 }, [
          ['tyoma', 'Молчать. Делай вид, что ничего не знаешь.'],
          ['kesha', 'Я? Молчать? Тёма, ты меня знаешь...', 'shrug'],
          ['tyoma', 'Знаю. Поэтому прошу.'],
          ['kesha', 'Я полковнику позвоню. Тихо. Одному полковнику.', 'phone']
        ])
      ] },
      { type: 'call', fn: c => {
        if (c.vars.ledger === 'lyova') c.g.addMoney(4000);
        MS.rm(c, 'lyova', 'kesha', 'book');
      } }
    ],
    onPass: g => g.later(8, () => g.pager(N.PAGER.afterM7))
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
