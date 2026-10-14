(function (N) {
  'use strict';

  const MS = N.MS, P = MS.P;
  const sh = (cam, lines, o) => Object.assign({ cam, lines: lines || [] }, o || {});
  const kesha = c => c.g.flags.ledger === 'kesha';

  N.VOICES['Гаишник'] = { g: 'm', pitch: 0.94, rate: 1.02 };

  const m8Colonel = c => {
    const k = MS.npc(c, 'colonel', 'colonel', P('colonel_npc', 0, 0), { friendly: true, hp: 400, invuln: true, gest: 'back' });
    k.yaw = c.w.city.places.colonel_npc.yaw;
    return k;
  };
  const m8Convoy = c => {
    const city = c.w.city, cs = city.places.convoy_start, mb = city.places.myza_bridge;
    const path = N.routeTo(city, [cs.x, cs.z], [mb.x, mb.z]).map(q => ({ x: q.x, z: q.z }));
    const col = (i, gap) => { const a = path[0], b = path[Math.min(1, path.length - 1)], dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1; return [a.x - dx / L * gap * i, a.z - dz / L * gap * i, N.yawOf(dx, dz)]; };
    const lead = MS.veh(c, 'dps', 'vaz2109', col(-1.2, 13), { livery: 'dps', hp: 900 });
    const cop = MS.npc(c, 'gai', 'gai', [lead.x, lead.z], { kind: 'gai', weapon: 'pm', who: 'Гаишник' });
    c.w.seat(cop, lead, true);
    cop.anim.board = null;
    lead.ai = { mode: 'route', path: path.map(q => ({ x: q.x, z: q.z })), speed: 12.5, wp: 0 };
    lead.siren = false;
    for (let i = 0; i < 3; i++) {
      const v = MS.veh(c, 'tr' + (i + 1), 'gaz53', col(i, 13), { livery: 'carrier', heavy: 1.6, hp: 1800 });
      const d = MS.npc(c, 'drv' + i, 'worker', [v.x, v.z], { kind: 'worker' });
      c.w.seat(d, v, true);
      d.anim.board = null;
      v.ai = { mode: 'route', path: path.map(q => ({ x: q.x, z: q.z })), speed: 12.5, wp: 0, delay: i * 1.2 };
    }
    const e = MS.veh(c, 'escort', 'bmw525', col(3.4, 13), { color: '#101010', heavy: 1.3 });
    for (let i = 0; i < 3; i++) { const p = MS.npc(c, 'e' + i, 'bandit', [e.x, e.z], { kind: 'bandit', weapon: i ? 'pm' : 'ak', gang: true }); c.w.seat(p, e, i === 0); p.anim.board = null; p.ai.shootFromCar = true; }
    e.ai = { mode: 'route', path: path.map(q => ({ x: q.x, z: q.z })), speed: 12.5, wp: 0, delay: 5, escort: true };
    c.vars.copMad = 0;
  };
  const m8Borzyh = c => {
    const city = c.w.city, gate = city.places.carlot_gate;
    const tr = ['tr1', 'tr2', 'tr3'].map(t => c.get(t)).filter(Boolean);
    const last = tr.length ? tr[tr.length - 1] : c.w.player;
    c.vars.wx = last.x; c.vars.wz = last.z;
    const v = MS.veh(c, 'bvolga', 'volga3102', [gate.x, gate.z, gate.yaw], { color: '#141418', hp: 720 });
    const d = MS.npc(c, 'bdrv', 'driver', [v.x, v.z], { kind: 'worker' });
    const b = MS.npc(c, 'borzyh', 'borzyh', [v.x, v.z]);
    c.w.seat(d, v, true);
    c.w.seat(b, v, false);
    d.anim.board = b.anim.board = null;
    v.ai = { mode: 'route', path: N.routeTo(city, [v.x, v.z], [c.vars.wx, c.vars.wz]).map(q => ({ x: q.x, z: q.z })), speed: 15, wp: 0 };
    c.vars.stopT = 0;
  };

  N.addMission({
    id: 'm8', title: 'Автовоз', giver: 'colonel', marker: 'colonel', requires: ['m6'], reward: 10000,
    steps: [
      { type: 'call', fn: c => { if (c.w.clock < 8 * 60 || c.w.clock > 18 * 60) c.w.clock = 13 * 60 + 10; m8Colonel(c); } },
      { type: 'cut', at: 'colonel_npc', shots: [
        sh({ k: 'two', a: 'colonel', b: 'tyoma' }, [['colonel', 'Нашлись твои «Волги», Верещагин. Сорок штук на площадке готовой продукции. Сегодня их гонят автовозами за Оку. В Казань.', '>tyoma']], { beats: [[0, S => { S.put('tyoma', [0.3, -1.8], 'colonel'); S.face('colonel', 'tyoma'); }]] }),
        sh({ k: 'mcu', a: 'tyoma', b: 'colonel' }, [['tyoma', 'Деньги мои у Хромого. А машины — у Борзых.']]),
        sh({ k: 'mcu', a: 'colonel', b: 'tyoma' }, [
          ['colonel', 'Борзых продаёт их второй раз. Твои триста тысяч он уже поделил, теперь хочет ещё казанские.', 'back'],
          ['colonel', 'Три автовоза, сопровождение — «бумер» Хромого. Впереди гаишник, купленный. Мост тоже куплен.']
        ]),
        sh({ k: 'two', a: 'colonel', b: 'tyoma', side: -1 }, [
          ['colonel', 'Уйдут «Волги» за мост — Борзых при деньгах, а ты при долгах. Сгорят — Борзых сам к тебе приползёт. Ему за них перед заводом отвечать.', 'point'],
          ['colonel', 'Держи «эфки». Ещё с Афгана. Чека тугая — не бойся.', 'give']
        ]),
        sh({ k: 'cu', a: 'colonel', b: 'tyoma' }, [['colonel', 'Ни один не должен уйти за Оку. Ни один.']])
      ] },
      { type: 'call', fn: c => { MS.give(c, 'grenade', 8, true); c.g.help(N.HELP.grenade); m8Convoy(c); } },
      { type: 'cp', id: 'convoy', name: 'Колонна', place: c => {
        const cs = c.w.city.places.convoy_start;
        m8Convoy(c);
        const sp = c.w.city.nearestLane(cs.x + 140, cs.z + 60, 200, l => l.ambient) || { x: cs.x + 140, z: cs.z + 60, dx: 1, dz: 0 };
        MS.veh(c, 'ride', 'vaz2109', [sp.x, sp.z, N.yawOf(sp.dx, sp.dz)], { color: '#3a4a5a' });
        MS.tp(c, null, { car: 'ride' });
      }, kit: { weapons: { grenade: 6 }, equip: 'grenade' } },
      { type: 'destroy', tags: ['tr1', 'tr2', 'tr3'], text: 'Уничтожь три автовоза, пока они не ушли на Мызинский мост.', tick: (c, dt) => {
        const e = c.get('escort'), pl = c.w.player;
        if (e && !e.dead && e.driver && e.ai && e.ai.mode === 'route' && Math.hypot(e.x - pl.x, e.z - pl.z) < 60) { e.ai = { mode: 'chase', target: pl, speed: 26 }; c.say([['Бандит', 'Это он! Валим его!']]); }
        const d = c.get('dps');
        if (d && !c.vars.copMad && (d.hp < d.maxHp - 5 || d.dead)) { c.vars.copMad = 1; c.w.setWanted(Math.max(2, c.w.wanted.level)); c.say([['Гаишник', 'Нападение на сотрудника! Всем постам!', '~radio']]); }
        const left = ['tr1', 'tr2', 'tr3'].filter(t => MS.alive(c, t)).length;
        if (left < (c.vars.left === undefined ? 3 : c.vars.left)) { c.vars.left = left; c.say([['tyoma', left === 2 ? 'Один готов.' : left === 1 ? 'Второй. Остался последний.' : 'Всё. Горят «Волги».']]); }
      }, fails: [{ fn: c => {
        const b = c.w.city.places.myza_bridge;
        for (let i = 1; i <= 3; i++) { const v = c.get('tr' + i); if (v && !v.dead && Math.hypot(v.x - b.x, v.z - b.z) < 24) return 'Автовоз ушёл за реку.'; }
        return null;
      } }] },
      { type: 'call', fn: c => { m8Borzyh(c); c.say([['colonel', 'Верещагин, Борзых сорвался с завода. Чёрная «Волга», едет на пожар. Перехвати — и поговори с ним.', '~radio']]); } },
      { type: 'cp', id: 'borzyh', name: 'Чёрная «Волга»', place: c => {
        m8Borzyh(c);
        const sp = c.w.city.nearestLane(c.vars.wx, c.vars.wz, 200, l => l.ambient) || { x: c.vars.wx, z: c.vars.wz, dx: 1, dz: 0 };
        MS.veh(c, 'ride', 'vaz2109', [sp.x, sp.z, N.yawOf(sp.dx, sp.dz)], { color: '#3a4a5a' });
        MS.tp(c, null, { car: 'ride' });
      } },
      { type: 'fn', text: 'Перехвати чёрную «Волгу» Борзых. Сам Борзых нужен живым.', tick: (c, dt) => {
        const v = c.get('bvolga'), pl = c.w.player;
        if (!v || v.dead) return;
        const near = Math.hypot(v.x - pl.x, v.z - pl.z) < 9;
        c.vars.stopT = near && Math.abs(v.spd) < 1.6 ? c.vars.stopT + dt : 0;
        if (!c.vars.flee && Math.hypot(v.x - pl.x, v.z - pl.z) < 30) { c.vars.flee = 1; v.ai = { mode: 'flee', speed: 22 }; c.say([['borzyh', 'Валера, гони! Гони, я сказал!']]); }
      }, fn: c => { const v = c.get('bvolga'); return !v || v.hp < v.maxHp * 0.75 || c.vars.stopT > 1.4; },
      blips: c => { const v = c.get('bvolga'); return v && !v.dead ? [{ x: v.x, z: v.z, type: 'enemy', ent: v }] : []; },
      fails: [{ dead: 'borzyh', text: 'Борзых погиб — спросить больше некого.' }, { far: 'bvolga', dist: 380, time: 10, text: 'Борзых уехал.' }],
      bot: c => { const v = c.get('bvolga'); c.w.damageVehicle(v, v.maxHp * 0.3, c.w.player, false); } },
      { type: 'call', fn: c => {
        const v = c.get('bvolga'), w = c.w;
        if (v) { v.ai = null; v.ctl.thr = 0; v.ctl.hand = true; }
        const d = c.get('bdrv');
        if (d && !d.dead) { if (d.veh) w.exitVehicle(d); d.ai = { mode: 'flee', fx: w.player.x, fz: w.player.z, t: 20, mission: true }; }
        const b = c.get('borzyh');
        if (b && b.veh) w.exitVehicle(b);
        if (b) b.ai = { mode: 'idle', mission: true, invuln: true };
        if (w.player.veh) w.exitVehicle(w.player);
        c.vars.bx = b ? b.x : w.player.x; c.vars.bz = b ? b.z : w.player.z;
      } },
      { type: 'cut', at: '@borzyh', clear: 18, shots: [
        sh({ k: 'two', a: 'borzyh', b: 'tyoma' }, [['borzyh', 'Молодой человек! Я ответственное лицо! Я член...', 'calm>tyoma']], { beats: [[0, S => { S.put('tyoma', [1.6, 1.2], 'borzyh'); S.face('borzyh', 'tyoma'); }]] }),
        sh({ k: 'low', a: 'tyoma', b: 'borzyh' }, [['tyoma', 'На колени.']], { beats: [['L0', S => S.gest('borzyh', 'kneel')]] }),
        sh({ k: 'ots', a: 'borzyh', b: 'tyoma', h: -0.3, lh: -0.4 }, [
          ['tyoma', 'Где деньги?'],
          ['borzyh', 'Не у меня! Клянусь партбилетом! Мне — пять процентов, за машины. Шестьдесят — Хромому, сорок — «Шампанскому»!']
        ]),
        sh({ k: 'mcu', a: 'tyoma', b: 'borzyh' }, [['tyoma', 'Кто такой «Шампанское»?']]),
        sh({ k: 'mcu', a: 'borzyh', b: 'tyoma', h: -0.3, lh: -0.4 }, [['borzyh', 'Не знаю! Честно! Он через Хромого работал. Звонил всегда из какого-то клуба — музыка там гремела...']]),
        sh({ k: 'two', a: 'borzyh', b: 'tyoma', side: -1, h: -0.2 }, [
          ['tyoma', 'Сорок «Волг» ты мне должен, Анатолий Сергеевич.'],
          ['borzyh', 'Должен! Конечно, должен! В установленном порядке!'],
          ['tyoma', 'Иди.']
        ], { beats: [['L2', S => { S.calm('borzyh'); S.run('borzyh', [-14, -6], { keep: true }); }]] })
      ] },
      { type: 'call', fn: c => { MS.rm(c, 'borzyh', 'bdrv'); } }
    ],
    onPass: g => { if (g.done('m9')) g.pager(N.PAGER.finale); }
  });

  const m9Gang = c => {
    const pts = [[-20, -30], [18, -25], [-22, 10], [20, 14], [0, -40], [-8, 36], [12, 38], [0, 0], [-28, -5], [26, -8]];
    const s = c.w.city.places.stadium;
    MS.crew(c, 's', pts.map(q => { const r = N.placeAt(s, q[0], q[1]); return [r[0], r[1], 0]; }), { kind: 'bandit', weapons: ['pm', 'ak', 'pm', 'shotgun', 'pm', 'ak', 'pm', 'knife', 'pm', 'pm'], aggro: 34 });
    const h = MS.npc(c, 'hromoy', 'hromoy', P('stadium_vip', 1.5, 0, Math.PI), { kind: 'bandit', weapon: 'ak', gang: true, hp: 260, armor: 50 });
    h.ai = { mode: 'guard', mission: true, x: h.x, z: h.z, aggro: 14 };
    const lp = MS.at(c, P('stadium_lot', 6, 20));
    const ls = c.w.city.freeSpot(lp.x, lp.z, 14);
    MS.veh(c, 'lc', 'lc80', [ls[0], ls[1], c.w.city.places.stadium_lot.yaw], { color: '#101010', hp: 2200 });
    c.vars.pa = 0;
  };
  const m9Flee = c => {
    const h = c.get('hromoy');
    if (!h || h.dead || c.vars.run) return;
    c.vars.run = 1;
    h.ai = { mode: 'enter', car: c.get('lc'), mission: true, drive: { mode: 'flee', speed: 26 } };
    c.say([['hromoy', 'Прикройте меня, уроды! Москвича — в землю!', '~pa']]);
  };

  N.addMission({
    id: 'm9', title: 'Торпедо', giver: 'lyova', marker: 'club_meet', requires: ['m7'], reward: 12000,
    steps: [
      { type: 'call', fn: c => {
        if (c.w.clock > 5 * 60 && c.w.clock < 22 * 60) c.w.clock = 23 * 60;
        MS.npc(c, 'lyova', 'lyova', P('club_meet', 1.2, 0.8, Math.PI), { friendly: true, hp: 400 });
        MS.npc(c, 'vadik', 'vadik', P('club_meet', 1.6, -1.2, Math.PI), { friendly: true, hp: 300, gest: 'arms', weapon: 'ak' });
      } },
      { type: 'cut', at: 'club_meet', clear: 16, shots: c => [
        sh({ k: 'two', a: 'lyova', b: 'tyoma' }, kesha(c) ? [
          ['lyova', 'Тимофей, ты что-то хмурый. Не выспался?', 'look>tyoma'],
          ['tyoma', 'Работы много.'],
          ['lyova', 'Сегодня — последняя.']
        ] : [
          ['lyova', 'Тимофей, друг! Ну что, отдохнул?', 'hug>tyoma'],
          ['tyoma', 'Немного.']
        ], { beats: [[0, S => S.put('tyoma', [-1.2, 0.4], 'lyova')]] }),
        sh({ k: 'mcu', a: 'lyova', b: 'tyoma' }, [c.g.done('m8')
          ? ['lyova', 'Хромой засел на стадионе «Торпедо». Со всей бригадой. После автовозов он думает, что это я его сдал. Смешно, правда?', 'shrug']
          : ['lyova', 'Хромой засел на стадионе «Торпедо». Со всей бригадой. Чует, что под него копают.', 'point']]),
        sh({ k: 'ms', a: 'vadik', b: 'tyoma' }, [['lyova', 'Кончай его — и мы с тобой поделим этот город. Вадик, дай «калаш». Новый, в смазке.']], { beats: [[0, S => { S.calm('vadik'); S.walk('vadik', [0.2, -0.4], { face: 'tyoma' }); }], ['L0', S => S.gest('vadik', 'give', 2)]] }),
        sh({ k: 'cu', a: 'tyoma', b: 'lyova' }, [['tyoma', kesha(c) ? 'Поделим.' : 'Поделим. Посмотрим.']], { hold: 0.9 })
      ] },
      { type: 'call', fn: c => { MS.rm(c, 'lyova', 'vadik'); MS.give(c, 'ak', 150, true); } },
      { type: 'goto', at: 'stadium_gate', r: 14, text: 'Езжай на стадион «Торпедо».' },
      { type: 'call', fn: m9Gang },
      { type: 'say', lines: [['hromoy', 'Москвич! Я знаю, что это ты! Иди сюда, я тебя сам закопаю!', '~pa']] },
      { type: 'cp', id: 'stadium', name: 'Стадион «Торпедо»', place: c => { m9Gang(c); MS.tp(c, P('stadium_gate', -3, 0)); }, kit: { weapons: { ak: 120 }, equip: 'ak', armor: 30 } },
      { type: 'fn', text: 'Перебей людей Хромого.', tick: (c, dt) => {
        const dead = MS.tags('s', 10).filter(t => !MS.alive(c, t)).length;
        if (dead >= 4 && c.vars.pa < 1) { c.vars.pa = 1; c.say([['hromoy', 'Где вы, уроды?! Держите его! Я вам за что плачу?!', '~pa']]); }
        const h = c.get('hromoy');
        if ((dead >= 7 || (h && h.hp < h.maxHp * 0.7)) && h && !h.dead) m9Flee(c);
      }, fn: c => { const dead = MS.tags('s', 10).filter(t => !MS.alive(c, t)).length; return dead >= 10 || (c.vars.run && dead >= 7); },
      bot: c => { for (const t of MS.tags('s', 10)) { const e = c.get(t); if (e && !e.dead) c.w.damagePed(e, 9999, c.w.player, 'bullet'); } } },
      { type: 'call', fn: m9Flee },
      { type: 'cp', id: 'chase', name: 'Погоня за Хромым', place: c => {
        const lp = MS.at(c, P('stadium_lot', 6, 20)), ls = c.w.city.freeSpot(lp.x, lp.z, 14);
        const v = MS.veh(c, 'lc', 'lc80', [ls[0], ls[1], c.w.city.places.stadium_lot.yaw], { color: '#101010', hp: 2200 });
        const h = MS.npc(c, 'hromoy', 'hromoy', [v.x, v.z], { kind: 'bandit', weapon: 'ak', gang: true, hp: 200, armor: 20 });
        c.w.seat(h, v, true);
        h.anim.board = null;
        v.ai = { mode: 'flee', speed: 26 };
        c.vars.run = 1;
        MS.veh(c, 'ride', 'vaz2109', P('stadium_gate', -8, 4, Math.PI / 2), { color: '#3a4a5a' });
        MS.tp(c, null, { car: 'ride' });
      }, kit: { weapons: { ak: 90 }, equip: 'ak' } },
      { type: 'fn', text: 'Хромой удирает на «крузаке»! Останови его.', fn: c => {
        const h = c.get('hromoy');
        if (!h || h.dead) return true;
        if (h.hp < 60) {
          if (h.veh) c.w.exitVehicle(h);
          h.hp = 1;
          h.ai = { mode: 'idle', mission: true, invuln: true };
          c.w.knockDown(h, 999);
          return true;
        }
        const v = h.veh;
        if (v && (v.dead || v.hp < v.maxHp * 0.3) && !c.vars.out) {
          c.vars.out = 1;
          c.w.exitVehicle(h);
          h.ai = { mode: 'attack', target: c.w.player, mission: true, walkIn: true };
          c.say([['hromoy', 'Ну иди сюда, москвич! Иди!']]);
        }
        return false;
      }, blips: c => { const h = c.get('hromoy'); return h && !h.dead ? [{ x: (h.veh || h).x, z: (h.veh || h).z, type: 'enemy', ent: h }] : []; },
      fails: [{ far: 'hromoy', dist: 420, time: 10, text: 'Хромой ушёл.' }],
      bot: c => { const h = c.get('hromoy'); h.hp = 50; } },
      { type: 'call', fn: c => {
        const h = c.get('hromoy'), w = c.w;
        if (h.veh) w.exitVehicle(h);
        Object.assign(h, { dead: false, hp: 1, state: 'idle', stateT: 0 });
        h.anim.fall = 0;
        h.anim.tumble = null;
        h.anim.gest = { k: 'crouch', t: 1, d: 0 };
        h.weapon = 'fists';
        h.ai = { mode: 'idle', mission: true, invuln: true };
        if (w.player.veh) w.exitVehicle(w.player);
      } },
      { type: 'cut', at: '@hromoy', clear: 16, shots: c => [
        sh({ k: 'low', a: 'tyoma', b: 'hromoy' }, [], { dur: 2.0, beats: [[0, S => { S.put('tyoma', [1.8, 0.6], 'hromoy'); S.face('hromoy', 'tyoma'); }]] }),
        sh({ k: 'mcu', a: 'hromoy', b: 'tyoma' }, [
          ['hromoy', 'Дурак ты, москвич... Думаешь, это я тебя кинул?'],
          ['hromoy', 'Шампанское... Лёва всё придумал. Наводку дал, людей дал. Я только стволы держал.']
        ]),
        sh({ k: 'mcu', a: 'tyoma', b: 'hromoy' }, [['tyoma', kesha(c) ? 'Знаю.' : 'Почему мне говоришь?']]),
        sh({ k: 'mcu', a: 'hromoy', b: 'tyoma' }, [
          ['hromoy', 'Деньги — у него. Сорок процентов... и мои шестьдесят он тоже прибрал. За «охрану».'],
          ['hromoy', 'Он меня твоими руками убрал, москвич. Значит, и тебя... кем-нибудь...']
        ]),
        sh({ k: 'cu', a: 'tyoma', yaw: 0.5 }, [['tyoma', 'Лёва.']], { hold: 1.2, beats: [[0, (S, r) => { const h = r.get('hromoy'); h.ai = { mode: 'idle', mission: true }; r.w.killPed(h, null, 'bullet'); }]] })
      ] }
    ],
    onPass: g => { if (g.done('m8')) g.pager(N.PAGER.finale); }
  });

  const m10Allies = c => {
    for (let i = 0; i < 2; i++) {
      const s = MS.npc(c, 'ally' + i, 'soldier', P('kesha_door', -2.5 - i, 1.8 + i), { kind: 'soldier', weapon: 'ak', friendly: true, hp: 240 });
      s.ai = { mode: 'follow', target: c.w.player, mission: true, fight: true, dist: 3 };
    }
  };
  const m10Ambush = c => {
    const w = c.w, at = [w.player.x - 70, w.player.z + 45];
    const sp = w.city.nearestLane(at[0], at[1], 90, l => l.ambient);
    const v = MS.veh(c, 'ambush', 'bmw525', [sp ? sp.x : at[0], sp ? sp.z : at[1], sp ? N.yawOf(sp.dx, sp.dz) : 0], { color: '#101010' });
    for (let i = 0; i < 3; i++) { const p = MS.npc(c, 'am' + i, 'bandit', [v.x, v.z], { kind: 'bandit', weapon: i ? 'pm' : 'ak', gang: true }); w.seat(p, v, i === 0); p.anim.board = null; p.ai.shootFromCar = true; }
    v.ai = { mode: 'chase', target: w.player, speed: 24 };
  };
  const m10Outside = c => {
    MS.crew(c, 'o', [P('club_door', -6, -8), P('club_door', -7, 6), P('club_door', -14, -12), P('club_door', -12, 12)], { kind: 'bandit', weapons: ['pm', 'ak', 'shotgun', 'pm'], aggro: 40 });
    for (let i = 0; i < 3; i++) { const e = c.get('am' + i); if (e && !e.dead && e.veh && e.veh.dead) c.w.exitVehicle(e); }
  };
  const m10Inside = c => {
    const r = c.w.city.clubRoom;
    const pts = [[r.x0 + 12, r.z0 + 8], [r.x0 + 22, r.z0 + 6], [r.x0 + 30, r.z0 + 14], [r.x0 + 16, r.z0 + 20], [r.x0 + 26, r.z0 + 22], [r.x0 + 6, r.z0 + 14]];
    MS.crew(c, 'in', pts.map(q => [q[0], q[1], 0]), { kind: 'bandit', weapons: ['pm', 'ak', 'pm', 'shotgun', 'ak', 'pm'], aggro: 40, exact: true });
    const l = MS.npc(c, 'lyova', 'lyova', [r.x0 + 24.2, r.z1 - 4.2, Math.PI / 2 + Math.PI], { kind: 'bandit', weapon: 'pm', gang: true, hp: 320, armor: 100, invuln: true });
    l.ai = { mode: 'attack', target: c.w.player, mission: true, invuln: true, range: 14, hold: true, acc: 0.2 };
    if (!kesha(c)) {
      const k = MS.npc(c, 'kesha', 'kesha', [r.x0 + 33.5, r.z1 - 2.4, Math.PI], { friendly: true, hp: 300, invuln: true, gest: 'kneel' });
      k.ai = { mode: 'idle', mission: true, invuln: true };
    }
  };
  const m10Port = c => {
    const w = c.w;
    MS.crew(c, 'p', [P('port_crane', -6, -20), P('port_crane', 4, 18), P('port_crane', -8, 30), P('port_crane', 2, -34), P('port_crane', -14, 6)].map(r => { const q = MS.at(c, r); return [q.x, q.z, 0]; }), { kind: 'bandit', weapons: ['ak', 'pm', 'shotgun', 'ak', 'pm'], aggro: 45 });
    const merc = c.get('merc');
    const l = c.get('lyova');
    if (l && !l.dead) { if (l.veh) w.exitVehicle(l); l.ai = { mode: 'attack', target: w.player, mission: true, range: 18, acc: 0.3 }; }
    const k = c.get('kesha');
    if (k && !kesha(c)) {
      if (k.veh) w.exitVehicle(k);
      const q = MS.at(c, P('port_crane', -2, -3));
      Object.assign(k, { x: q.x, z: q.z, y: w.city.groundY(q.x, q.z) });
      k.ai = { mode: 'idle', mission: true, invuln: false };
      k.anim.gest = { k: 'kneel', t: 1, d: 0 };
      k.hp = k.maxHp = 300;
    }
    if (merc) { merc.ai = null; merc.ctl.thr = 0; merc.ctl.hand = true; }
  };
  const m10Merc = c => {
    const w = c.w, back = w.city.places.club_back, pc = w.city.places.port_crane;
    const v = MS.veh(c, 'merc', 'merc600', P('club_back', -5, 3, Math.PI / 2), { color: '#0c0c0c', hp: 2600, heavy: 1.4 });
    const l = MS.npc(c, 'lyova', 'lyova', [v.x, v.z], { kind: 'bandit', weapon: 'ak', gang: true, hp: 320, armor: 100 });
    w.seat(l, v, true);
    l.anim.board = null;
    if (!kesha(c)) { const k = c.get('kesha') || MS.npc(c, 'kesha', 'kesha', [v.x, v.z], { friendly: true, hp: 300 }); if (k.veh !== v) { if (k.veh) w.unseat(k); w.seat(k, v, false); } k.anim.gest = null; k.anim.board = null; k.ai = { mode: 'idle', mission: true, invuln: true }; }
    const path = N.routeTo(w.city, [back.x, back.z], [pc.x, pc.z]).map(q => ({ x: q.x, z: q.z }));
    v.ai = { mode: 'route', path, speed: 19, wp: 0, invuln: true };
    const e = MS.veh(c, 'mesc', 'bmw525', P('club_back', -12, 3, Math.PI / 2), { color: '#141414' });
    for (let i = 0; i < 2; i++) { const p = MS.npc(c, 'me' + i, 'bandit', [e.x, e.z], { kind: 'bandit', weapon: 'pm', gang: true }); w.seat(p, e, i === 0); p.anim.board = null; p.ai.shootFromCar = true; }
    e.ai = { mode: 'chase', target: w.player, speed: 23 };
  };

  N.addMission({
    id: 'm10', title: 'Мираж', giver: 'kesha', marker: 'kesha_door', requires: ['m8', 'm9'], reward: 30000, finale: true, dismiss: false, club: true,
    fails: [{ fn: c => (!kesha(c) && c.vars.hostage && c.ents.kesha && (c.ents.kesha.dead) ? 'Кеша погиб!' : null) }],
    steps: [
      { type: 'call', fn: c => {
        c.w.clock = 23 * 60 + 20;
        if (kesha(c)) {
          MS.npc(c, 'kesha', 'kesha', P('kesha_door', 0.6, 0.9, Math.PI), { friendly: true, hp: 300 });
          MS.npc(c, 'colonel', 'colonel', P('kesha_door', 0.9, -0.9, Math.PI), { friendly: true, hp: 400, invuln: true });
          m10Allies(c);
        } else MS.npc(c, 'colonel', 'colonel', P('kesha_door', -6, 4, Math.PI), { friendly: true, hp: 400, invuln: true });
      } },
      { type: 'cut', at: 'kesha_door', clear: 16, shots: c => kesha(c) ? [
        sh({ k: 'two', a: 'colonel', b: 'tyoma' }, [
          ['colonel', 'Кеша мне всё рассказал. Красиво Лёва сыграл: тебя — на Хромого, Хромого — на тебя. А сам — в шампанском.', 'back>tyoma']
        ], { beats: [[0, S => S.put('tyoma', [-1.8, 0], 'colonel')]] }),
        sh({ k: 'mcu', a: 'colonel', b: 'tyoma' }, [['colonel', 'Сегодня ночью Лёва закрывает «Мираж» на спецобслуживание. Будет весь его личный состав.']]),
        sh({ k: 'mcu', a: 'tyoma', b: 'colonel' }, [['tyoma', 'Весь — это сколько?']]),
        sh({ k: 'mcu', a: 'colonel', b: 'tyoma' }, [['colonel', 'Весь — это все.']], { hold: 0.8 }),
        sh({ k: 'two', a: 'colonel', b: 'tyoma', side: -1 }, [
          ['colonel', 'Возьми моих ребят. И броник. Не спорь.', 'give'],
          ['kesha', 'Тёма, я с вами!', 'fist'],
          ['colonel', 'Вы, Иннокентий Маркович, — со мной. В машине. Будем рядом.']
        ]),
        sh({ k: 'mcu', a: 'kesha', b: 'tyoma' }, [['kesha', 'Тёма... Ты только вернись. Мне ещё прощения просить.', 'down']])
      ] : [
        sh({ k: 'wide', a: 'tyoma', d: 8, h: 2.2, yaw: 2.6 }, [['tyoma', 'Кеша?']], { pre: 1.4, beats: [[0, S => S.walk('tyoma', [0.4, 0.2], { face: [3, 0] })]] }),
        sh({ k: 'two', a: 'colonel', b: 'tyoma' }, [
          ['colonel', 'Опоздали мы, Верещагин. Кешу увезли час назад. Соседка видела чёрный «мерседес».', '>tyoma'],
          ['tyoma', '«Мерседес» — у Лёвы.']
        ], { beats: [[0, S => { S.put('colonel', [-1.6, 1.4], 'tyoma'); S.face('tyoma', 'colonel'); }]] }),
        sh({ k: 'cu', a: 'tyoma', yaw: 0.4 }, [['tyoma', '«Тимофей, приезжай один. Поговорим. Л.»']], { beats: [[0, S => { S.sfx('pager'); S.gest('tyoma', 'watch', 3); }]] }),
        sh({ k: 'mcu', a: 'colonel', b: 'tyoma' }, [
          ['colonel', 'Хромой перед смертью тебе всё сказал, я так понимаю. Вот и Лёва так понимает.'],
          ['colonel', 'Моих ребят не дам — у них семьи. Броник дам.', 'give']
        ]),
        sh({ k: 'two', a: 'colonel', b: 'tyoma', side: -1 }, [
          ['tyoma', 'Сам справлюсь.'],
          ['colonel', 'Сам — это хорошо. Только живым вернись. Мне ещё должников не хватало.', 'back']
        ])
      ] },
      { type: 'call', fn: c => {
        const pl = c.w.player;
        pl.armor = Math.max(pl.armor, 100);
        MS.rm(c, 'colonel');
        if (kesha(c)) MS.rm(c, 'kesha');
        else { c.vars.hostage = 1; m10Ambush(c); c.say([['tyoma', 'А вот и встречающие.']]); }
        c.g.giveWeapon('ak', 90);
      } },
      { type: 'goto', at: 'club_door', r: 34, text: 'Езжай в «Мираж».' },
      { type: 'call', fn: m10Outside },
      { type: 'cp', id: 'club', name: '«Мираж»', place: c => {
        MS.veh(c, 'ride', 'vaz2109', P('club_door', -9, 40, -Math.PI / 2), { color: '#3a4a5a' });
        MS.tp(c, P('club_door', -12, 36, Math.PI));
        if (kesha(c)) { m10Allies(c); for (let i = 0; i < 2; i++) { const s = c.get('ally' + i), q = MS.at(c, P('club_door', -13, 35 + i * 1.6)); Object.assign(s, { x: q.x, z: q.z }); } }
        else c.vars.hostage = 1;
        m10Outside(c);
      }, kit: { weapons: { ak: 120 }, equip: 'ak', armor: 100 } },
      { type: 'kill', tags: c => MS.tags('o', 4).concat(c.get('am0') ? ['am0', 'am1', 'am2'] : []), text: 'Прорвись ко входу в «Мираж».' },
      { type: 'goto', at: 'club_door', r: 2, veh: 'none', text: 'Войди в клуб.' },
      { type: 'fn', text: 'Войди в клуб.', fn: c => c.w.city.inside(c.w.player.x), bot: c => c.g.teleport('club_in') },
      { type: 'call', fn: c => {
        m10Inside(c);
        if (kesha(c)) for (let i = 0; i < 2; i++) { const s = c.get('ally' + i); if (s && !s.dead) { const pl = c.w.player; Object.assign(s, { x: pl.x + 1 + i, z: pl.z + 1, y: pl.y }); } }
      } },
      { type: 'cut', at: c => { const r = c.w.city.clubRoom; return { x: r.x0 + 25, z: r.z1 - 5, yaw: Math.PI / 2, y: 0.1 }; }, clear: 0, shots: c => [
        sh({ k: 'ms', a: 'lyova', yaw: -0.3 }, [['lyova', 'Тимофей! Ну зачем ты так? Мы же дружили!', 'hug']], { beats: [[0, S => { S.face('tyoma', 'lyova'); S.face('lyova', 'tyoma'); }]] }),
        ...(kesha(c) ? [] : [sh({ k: 'ms', a: 'kesha', yaw: 0.4 }, [['kesha', 'Тёма! Я им ничего не сказал! Почти ничего!', 'kneel']])]),
        sh({ k: 'cu', a: 'tyoma', b: 'lyova' }, [['tyoma', 'Дружили.']])
      ] },
      { type: 'kill', tags: MS.tags('in', 6), text: 'Разберись с охраной Лёвы.' },
      { type: 'call', fn: c => {
        const k = c.get('kesha');
        MS.rm(c, 'lyova');
        if (k) { c.w.removePed(k); delete c.ents.kesha; }
        m10Merc(c);
        c.say([['tyoma', kesha(c) ? 'Ушёл через чёрный ход!' : 'Ушёл через чёрный ход! И Кешу увёз!']]);
      } },
      { type: 'fn', text: c => (kesha(c) ? 'Лёва уходит на «мерседесе» к речному порту! Догони.' : 'Лёва увозит Кешу к речному порту! Догони «мерседес».'), fn: c => {
        const v = c.get('merc');
        return !v || v.dead || !!(v.ai && v.ai.arrived);
      }, blips: c => { const v = c.get('merc'); return v && !v.dead ? [{ x: v.x, z: v.z, type: 'enemy', ent: v }] : []; },
      fails: [{ far: 'merc', dist: 480, time: 14, text: 'Лёва ушёл.' }],
      bot: c => { const v = c.get('merc'), pc = c.w.city.places.port_crane; v.x = pc.x; v.z = pc.z; v.ai.arrived = true; } },
      { type: 'call', fn: m10Port },
      { type: 'cp', id: 'port', name: 'Речной порт', place: c => {
        const w = c.w, pc = w.city.places.port_crane;
        const v = MS.veh(c, 'merc', 'merc600', P('port_crane', 0, 0, Math.PI / 2), { color: '#0c0c0c', hp: 2600 });
        MS.npc(c, 'lyova', 'lyova', P('port_crane', 2.5, 1), { kind: 'bandit', weapon: 'ak', gang: true, hp: 320, armor: 100 });
        if (!kesha(c)) { MS.npc(c, 'kesha', 'kesha', P('port_crane', -2, -3), { friendly: true, hp: 300 }); c.vars.hostage = 1; }
        m10Port(c);
        const sp = w.city.nearestLane(w.city.places.port_gate.x, w.city.places.port_gate.z, 120, () => true);
        MS.veh(c, 'ride', 'vaz2109', [sp ? sp.x : pc.x - 60, sp ? sp.z : pc.z, sp ? N.yawOf(sp.dx, sp.dz) : 0], { color: '#3a4a5a' });
        MS.tp(c, null, { car: 'ride' });
        if (kesha(c)) {
          m10Allies(c);
          ['ally0', 'ally1'].forEach((t, i) => { const s = c.get(t); Object.assign(s, { x: w.player.x + 3 + i, z: w.player.z + 2, y: w.city.groundY(w.player.x + 3 + i, w.player.z + 2) }); });
        }
        v.ai = null;
      }, kit: { weapons: { ak: 120 }, equip: 'ak', armor: 60 } },
      { type: 'fn', text: c => (kesha(c) ? 'Покончи с Лёвой и его людьми в речном порту.' : 'Отбей Кешу и покончи с Лёвой в речном порту.'), tick: (c, dt) => {
        const l = c.get('lyova');
        if (!l || l.dead) return;
        const rest = MS.count(c, MS.tags('p', 5));
        l.ai.invuln = rest > 0 && l.hp < l.maxHp * 0.4;
        if (rest > 0 && l.hp < l.maxHp * 0.4 && !c.vars.hide) { c.vars.hide = 1; c.say([['lyova', 'Прикройте! Чего встали?!']]); }
      }, fn: c => {
        const l = c.get('lyova');
        if (MS.count(c, MS.tags('p', 5)) > 0 || !l) return false;
        if (l.dead || l.hp < l.maxHp * 0.3) {
          l.dead = false;
          Object.assign(l, { hp: 1, state: 'idle' });
          l.ai = { mode: 'idle', mission: true, invuln: true };
          l.anim.fall = 0;
          return true;
        }
        return false;
      }, blips: c => MS.tags('p', 5).concat(['lyova']).filter(t => MS.alive(c, t)).map(t => { const e = c.get(t); return { x: e.x, z: e.z, type: 'enemy', ent: e }; }),
      bot: c => { for (const t of MS.tags('p', 5)) { const e = c.get(t); if (e && !e.dead) c.w.damagePed(e, 9999, c.w.player, 'bullet'); } const l = c.get('lyova'); l.hp = 20; } },
      { type: 'call', fn: c => {
        const w = c.w, l = c.get('lyova');
        w.setWanted(0);
        if (w.player.veh) w.exitVehicle(w.player);
        if (kesha(c)) {
          const u = MS.veh(c, 'uaz', 'uaz469', P('port_quay', -16, -14, 0.6), { color: '#4a5234' });
          MS.npc(c, 'kesha', 'kesha', P('port_quay', -14, -12), { friendly: true, hp: 300, invuln: true });
          MS.npc(c, 'colonel', 'colonel', P('port_quay', -15.5, -11), { friendly: true, hp: 400, invuln: true });
          u.ai = null;
        } else {
          const k = c.get('kesha');
          if (k) { k.anim.gest = null; k.ai = { mode: 'idle', mission: true, invuln: true }; }
        }
        const kk = c.get('kesha');
        if (kk) kk.weapon = 'fists';
        l.weapon = 'fists';
        c.pickup('case', 'item', l.x + 1, l.z, { item: 'case', prop: true, y: w.city.groundY(l.x + 1, l.z) + 0.2, yaw: 0.4 });
        c.vars.cx = l.x + 1; c.vars.cz = l.z;
      } },
      { type: 'cut', at: '@lyova', clear: 20, shots: c => [
        sh({ k: 'wide', a: 'lyova', d: 9, h: 2.6, yaw: 2.2 }, [], { dur: 2.6, beats: [[0, S => { S.light('@lyova', 7, 16, [1.5, 1.4, 1.2]); S.gest('lyova', 'crouch'); S.put('tyoma', [-3.4, 2.4], 'lyova'); S.walk('tyoma', [-1.5, 1.3], { face: 'lyova' }); S.face('lyova', 'tyoma'); S.put('kesha', [-9, -6], 'lyova'); }]] }),
        sh({ k: 'mcu', a: 'lyova', b: 'tyoma' }, [['lyova', 'Тимофей... Ну что ты как маленький. Это бизнес. Ты бы на моём месте...']]),
        sh({ k: 'low', a: 'tyoma', b: 'lyova' }, [['tyoma', 'Я был на твоём месте. Восемь лет. Помнишь, за кого?']]),
        sh({ k: 'mcu', a: 'lyova', b: 'tyoma' }, [['lyova', 'Я тебе передачки слал...']]),
        sh({ k: 'mcu', a: 'tyoma', b: 'lyova' }, [['tyoma', 'Это ты ударил вахтёра, Лёва. Трубой. А сел я. Восемь лет я молчал.']]),
        sh({ k: 'mcu', a: 'lyova', b: 'tyoma' }, [['lyova', 'Кто старое помянет, Тимофей...']]),
        sh({ k: 'cu', a: 'tyoma', b: 'lyova' }, [['tyoma', '...тому глаз вон. А кто забудет — тому оба.']]),
        sh({ k: 'wide', a: 'lyova', d: 7, h: 1.5, yaw: -2.4 }, [], { dur: 2.6, slow: 0.55, beats: [
          [0, S => { S.walk('tyoma', [1.2, 0.6], { face: [1.2, 3] }); }],
          [0.7, (S, r) => { const l = r.get('lyova'); l.weapon = 'pm'; S.aim('lyova', 'tyoma'); }],
          [1.4, (S, r) => { const k = r.get('kesha'); if (k) { k.weapon = 'pm'; S.put('kesha', [-4.5, -2.5], 'lyova'); S.blank('kesha', 'lyova', { n: 2, rate: 0.25, spread: 0.2, up: 0.9 }); } }],
          [1.9, (S, r) => { const l = r.get('lyova'); S.aim('lyova', null, false); l.ai = { mode: 'idle', mission: true }; r.w.killPed(l, null, 'bullet'); }]
        ] }),
        sh({ k: 'ms', a: 'kesha', b: 'lyova' }, [['kesha', 'Я... я его... Тёма, я опять не промолчал.', 'head']], { beats: [[0, (S, r) => { S.aim('kesha', null, false); const k = r.get('kesha'); if (k) k.weapon = 'fists'; }]] }),
        sh({ k: 'two', a: 'kesha', b: 'tyoma' }, [['tyoma', 'В этот раз — правильно.']], { beats: [[0, S => { S.walk('tyoma', [-3.0, -1.0], { face: 'kesha' }); S.face('kesha', 'tyoma'); }]] }),
        kesha(c)
          ? sh({ k: 'ms', a: 'colonel', b: 'tyoma' }, [['colonel', 'Отставить сантименты. Милиция будет через пять минут. Чемодан — и по машинам.', 'back']], { beats: [[0, S => S.walk('colonel', [-6, -3], { face: 'tyoma' })]] })
          : sh({ k: 'two', a: 'kesha', b: 'tyoma', side: -1 }, [['colonel', 'Верещагин, живой? Милиция будет через пять минут. Чемодан — и уходите.', '~radio']])
      ] },
      { type: 'call', fn: c => {
        const w = c.w;
        MS.rm(c, 'case', 'kesha', 'colonel', 'uaz');
        w.clock = 4 * 60 + 40;
        w.setWeather('clear', 'instant');
        MS.tp(c, P('port_quay', -1.5, 0, 0));
      } },
      { type: 'cut', at: 'port_quay', clear: 30, shots: [
        sh({ p: [16, -26, 6], l: [0, 0, 2.5], fov: 0.82, m: 'right', ma: 3 }, [['tyoma', 'Сто восемьдесят тысяч. Остальное Лёва проел. Или пропил. Или отдал тому, кто повыше.']], { fade: 'in', dur: 6 }),
        sh({ k: 'ms', a: 'tyoma', yaw: 0.6 }, [['tyoma', 'Клуб теперь мой. Город — пока нет.']]),
        sh({ k: 'cu', a: 'tyoma', yaw: -0.5 }, [['tyoma', '«Тёма, еду в Нижний. Готовь деньги. С.»']], { pre: 1.2, beats: [[0.2, S => S.sfx('pager')], [0.5, S => S.gest('tyoma', 'watch', 3.5)]] }),
        sh({ p: [-40, -60, 22], l: [30, 20, 18], fov: 0.9, m: 'up', ma: 6 }, [], { dur: 6, title: 'Конец первой главы. Продолжение следует…', fade: 'out' })
      ] }
    ],
    onPass: g => { g.pager(N.PAGER.ending); g.ownProperty('club'); }
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
