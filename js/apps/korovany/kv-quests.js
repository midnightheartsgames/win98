(function (K) {
  'use strict';
  const { clamp } = K;

  const near = (a, x, z, r) => Math.hypot(a.x - x, a.z - z) < r;
  const tagged = (g, tag) => g.actors.filter(a => a.tags.has(tag));
  const aliveTagged = (g, tag) => tagged(g, tag).filter(a => !a.dead);
  const spot = (g, id) => g.world.spots[id];
  const place = (g, id) => g.world.places[id];
  const leadWagon = (g, tag) => g.wagons.find(w => w.tag === tag && !w.gone);
  const villain = g => g.actors.find(a => a.kind === 'villain');
  const burnedSince = (g, prefix, t) => Object.values(g.world.burn).filter(b => b.id.startsWith(prefix) && b.state !== 'ok' && b.t >= t).length;

  function squadNear(g, fac, target, n, tag, at, opts = {}) {
    const sq = K.AI.launchSquad(g, fac, target, n, Object.assign({ tag, startAt: at }, opts));
    return sq;
  }

  const ELF = [
    {
      id: 'e1', title: 'Первая стража',
      offer: 'Ночью у восточной тропы ходили чужие. Трое, в чёрном железе, с гор. Это разведка Злого.\n\nВстань у восточного края Листвы и встреть их. Живыми не отпускай: кто расскажет в форте, где наши дома, тот приведёт сюда войско.',
      goal: 'Встретить разведчиков Злого у восточного края Листвы и убить всех троих.',
      start(g, q) { q.d.at = g.time + 1.5; },
      update(g, q) {
        if (!q.d.spawned && g.time > q.d.at) { q.d.spawned = true; squadNear(g, 'evil', 'village', 3, 'q_scouts', [-200, 74], { kinds: ['veteran', 'blackguard', 'recruit'], from: 'town', burn: false, life: 400 }); }
        return q.d.spawned && aliveTagged(g, 'q_scouts').length === 0 && tagged(g, 'q_scouts').length > 0;
      },
      marker(g, q) { const a = aliveTagged(g, 'q_scouts')[0]; return a ? { x: a.x, z: a.z, label: 'Разведчики Злого' } : { x: spot(g, 'village_east').x, z: spot(g, 'village_east').z, label: 'Восточный край Листвы' }; },
      report: 'Трое. Хорошо. В форте их хватятся не сразу.\n\nВозьми зелье, оно тебе ещё пригодится.',
      reward: { gold: 40, items: [['potion', 1]], rep: 6 }
    },
    {
      id: 'e2', title: 'Корован',
      offer: 'Из Развилок во дворец пошёл казённый корован. Две телеги, коровы, охрана в красном. Везут зерно, вино и сундук с жалованьем для стражи.\n\nОграбь его на тракте. Без жалованья стража служит хуже, а нам зерно нужнее, чем им.',
      goal: 'Ограбить казённый корован на северном тракте между Развилками и дворцом.',
      start(g, q) { K.AI.launchCaravan(g, 'supply', { tag: 'q_caravan' }); q.d.robT = null; },
      on(g, q, type, d) { if (type === 'rob' && d.fac === 'emp') q.d.robbed = true; if (type === 'caravanArrive' && d.tag === 'q_caravan' && !d.robbed && !q.d.robbed) { g.msg('Корован дошёл до дворца. Из Развилок скоро выйдет следующий.', '#e0c080'); setTimeout0(g, q, 'relaunch', 60); } },
      update(g, q) { if (q.d.relaunch && g.time > q.d.relaunch) { q.d.relaunch = null; K.AI.launchCaravan(g, 'supply', { tag: 'q_caravan' }); } return !!q.d.robbed; },
      marker(g, q) { const w = leadWagon(g, 'q_caravan') || g.wagons.find(x => x.fac === 'emp' && !x.gone && !x.robbed); return w ? { x: w.x, z: w.z, label: 'Казённый корован' } : { x: 50, z: -100, label: 'Северный тракт' }; },
      report: 'Стражу оставили без жалованья. Говорят, у ворот уже ругаются.\n\nЗолото оставь себе. Ты его заработал на тракте, не я.',
      reward: { gold: 60, rep: 10 }
    },
    {
      id: 'e3', title: 'Набег',
      offer: 'Стража не простила корован. С севера идут солдаты дворца, шестеро, у них факелы.\n\nЕсли они дойдут до домов, Листва сгорит. Встреть их, пока они в лесу. Лучники на дубе прикроют.',
      goal: 'Отбить набег солдат дворца на Листву.',
      start(g, q) { q.d.t0 = g.time; squadNear(g, 'emp', 'village', 6, 'q_raid', [-250, -82], { burn: true, from: 'palace', life: 300 }); },
      update(g, q) { const all = tagged(g, 'q_raid'); return all.length > 0 && (aliveTagged(g, 'q_raid').length === 0 || q.d.retreat); },
      on(g, q, type, d) { if (type === 'raidEnd' && d.tag === 'q_raid' && d.beaten) q.d.retreat = true; },
      marker(g, q) { const a = aliveTagged(g, 'q_raid')[0]; return a ? { x: a.x, z: a.z, label: 'Солдаты дворца' } : { x: -380, z: 0, label: 'Листва' }; },
      reportFn(g, q) { const n = burnedSince(g, 'elf_', q.d.t0); return n ? 'Отбились. Сгорело домов: ' + n + '. Отстроим, лес даст брёвна.\n\nВозьми этот лук. Мой сын стрелял из него лучше меня.' : 'Отбились, и ни одного дома не потеряли. Такого давно не было.\n\nВозьми этот лук. Мой сын стрелял из него лучше меня.'; },
      reward: { gold: 80, items: [['elfbow', 1], ['arrows', 20]], rep: 10 }
    },
    {
      id: 'e4', title: 'Глаза леса',
      offer: 'В казарме дворца, в сундуке у дальней стены, лежит расписание караулов. Кто, где и когда стоит.\n\nПринеси его. Надень капюшон: в капюшоне и с убранным оружием стража примет тебя за прохожего, если не подходить вплотную. Ночью видно хуже. Пригнись (C) за стенами двора.',
      goal: 'Украсть расписание караулов из сундука в казарме дворца и вернуться к Ясеню.',
      start(g, q) { if (!g.has(g.player, 'hood')) g.give(g.player, 'hood', 1); },
      update(g, q) { return g.has(g.player, 'rota') > 0; },
      marker(g, q) { const s = spot(g, 'barracks_in'); return { x: s.x, z: s.z, label: 'Казарма дворца' }; },
      reportFn(g, q) { g.take(g.player, 'rota'); return 'Вот оно что. У северной стены после полуночи стоит один человек.\n\nТеперь наши знают, когда можно ходить мимо дворца. Ты сделал больше, чем десять лучников.'; },
      reward: { gold: 120, rep: 15 }
    },
    {
      id: 'e5', title: 'Двойной удар',
      offer: 'С гор спускается войско Злого. Шесть чернолатников и ветераны на деревяшках, эти дерутся злее молодых.\n\nСначала отбей их от Листвы. Потом выйди на восточный тракт: следом за войском в форт везут гвозди и железо. Пусть Злой останется без кузни.',
      goal: 'Отбить войско Злого от Листвы, затем ограбить корован контрабандистов на восточном тракте.',
      start(g, q) { q.d.t0 = g.time; q.d.stage = 0; squadNear(g, 'evil', 'village', 6, 'q_evilraid', [-200, 74], { burn: true, from: 'town', life: 300 }); },
      update(g, q) {
        if (q.d.stage === 0 && tagged(g, 'q_evilraid').length && (aliveTagged(g, 'q_evilraid').length === 0 || q.d.retreat)) { q.d.stage = 1; g.msg('Войско отбито. Теперь корован на восточный тракт.', '#c8e0a0'); K.AI.launchCaravan(g, 'smuggle', { tag: 'q_smuggle' }); }
        if (q.d.stage === 1 && q.d.relaunch && g.time > q.d.relaunch) { q.d.relaunch = null; K.AI.launchCaravan(g, 'smuggle', { tag: 'q_smuggle' }); }
        return q.d.stage === 1 && q.d.robbed;
      },
      on(g, q, type, d) {
        if (type === 'raidEnd' && d.tag === 'q_evilraid' && d.beaten) q.d.retreat = true;
        if (type === 'rob' && d.fac === 'evil' && q.d.stage === 1) q.d.robbed = true;
        if (type === 'caravanArrive' && d.tag === 'q_smuggle' && !d.robbed && !q.d.robbed) setTimeout0(g, q, 'relaunch', 90);
      },
      marker(g, q) {
        if (q.d.stage === 0) { const a = aliveTagged(g, 'q_evilraid')[0]; return a ? { x: a.x, z: a.z, label: 'Войско Злого' } : { x: -380, z: 40, label: 'Листва' }; }
        const w = leadWagon(g, 'q_smuggle'); return w ? { x: w.x, z: w.z, label: 'Корован контрабандистов' } : { x: 200, z: 150, label: 'Восточный тракт' };
      },
      report: 'Без гвоздей нет щитов, без железа нет топоров. Злой будет злее обычного, но слабее.\n\nОтдохни. Скоро понадобятся все, кто умеет держать лук.',
      reward: { gold: 100, items: [['potion', 2]], rep: 10 }
    },
    {
      id: 'e6', title: 'Партизаны',
      offer: 'Четверо из лагеря пойдут с тобой. Веди их к форту. За стеной стоят три палатки с припасами.\n\nСожги хотя бы две. Факелы возьми, их здесь три. Ворота форта обычно открыты, но ветераны у ворот не спят.',
      goal: 'Привести партизан к старому форту и сжечь две палатки с припасами.',
      start(g, q) {
        q.d.t0 = g.time; g.give(g.player, 'torch', 3);
        const c = spot(g, 'village_center');
        for (let i = 0; i < 4; i++) { const p = K.AI.freeNear(g.world, c.x + i * 1.5, c.z + 2); const a = g.spawn(i < 3 ? 'partisan' : 'archer', p[0], p[1], { tags: ['q_partisans'] }); a.ai.follow = g.player.id; a.drawn = true; }
      },
      update(g, q) { return burnedSince(g, 'fort_tent', q.d.t0) >= 2; },
      marker(g, q) { const b = Object.values(g.world.burn).find(x => x.id.startsWith('fort_tent') && x.state === 'ok'); return b ? { x: b.x, z: b.z, label: 'Палатка с припасами' } : { x: place(g, 'fort').x, z: place(g, 'fort').z, label: 'Форт' }; },
      reportFn(g, q) { const back = aliveTagged(g, 'q_partisans').length; for (const a of aliveTagged(g, 'q_partisans')) { a.ai.follow = null; a.ai.mode = 'wander'; a.ai.center = { x: place(g, 'camp').x, z: place(g, 'camp').z }; a.ai.r = 10; a.ai.goTo = { x: place(g, 'camp').x, z: place(g, 'camp').z, speed: 'walk' }; } return 'Дым видно с дуба. Из четверых вернулись ' + back + '.\n\nЗлой этого не стерпит. Он придёт сам. Будь готов.'; },
      reward: { gold: 150, rep: 12 }
    },
    {
      id: 'e7', title: 'Последний лист',
      offer: 'Он идёт. Сам Злой, с секирой и железной рукой, и с ним всё, что осталось от его войска. Через лес, к Листве.\n\nУбей его. Только его. Без него ветераны разойдутся по горам: им незачем воевать за пустое место.',
      goal: 'Убить Злого, пока он ведёт войско через лес.',
      start(g, q) {
        const v = villain(g);
        if (!v || v.dead) { q.d.done = true; return; }
        const sq = squadNear(g, 'evil', 'village', 6, 'q_final', [-130, 96], { burn: true, from: 'town', life: 600 });
        if (sq) { v.x = -126; v.z = 98; v.y = g.world.height(v.x, v.z); v.ai.squad = sq.id; v.ai.mode = null; sq.members.unshift(v.id); sq.leader = v.id; v.tags.add('q_final'); }
      },
      update(g, q) { const v = villain(g); return q.d.done || !v || v.dead; },
      marker(g, q) { const v = villain(g); return v && !v.dead ? { x: v.x, z: v.z, label: 'Злой' } : null; },
      report: 'Всё. Ветераны уходят в горы, бросают щиты по дороге.\n\nДворец прислал гонца: император подпишет, что лес наш. Без Злого ему нужны друзья, а не враги. Мы будем помнить, кто это сделал.',
      reward: { gold: 300, rep: 20 }, ending: 'elf'
    }
  ];

  const EMP = [
    {
      id: 'g1', title: 'Присяга',
      offer: 'Новобранец? Хорошо. Мне нужен человек у ворот. Встанешь снаружи, справа от прохода, и будешь стоять, пока не сменят. Четыре часа.\n\nВсех, кто идёт во дворец, проверяй. Эльфы ходят в капюшонах, под капюшоном уши. Подойди, заговори, сними капюшон. С поста не уходить. Ушёл без приказа, получил выговор.',
      goal: 'Стоять на посту у ворот четыре часа и проверять прохожих в капюшонах.',
      start(g, q) { q.d.onPost = 0; q.d.away = 0; q.d.stage = 0; },
      update(g, q, dt) {
        const p = g.player, s = spot(g, 'gate_post');
        const on = near(p, s.x, s.z, 5);
        if (on) { q.d.onPost += dt; q.d.away = 0; } else { q.d.away += dt; if (q.d.away > 40 && q.d.onPost > 0 && !q.d.warned) { q.d.warned = true; breach(g, 'post'); } }
        if (!q.d.spy && q.d.onPost > 50) {
          q.d.spy = true;
          const sp = spot(g, 'gate_out');
          const decoy = g.spawn('townsman', sp.x - 18, sp.z + 40, { tags: ['q_decoy'] }); decoy.equip.head = 'hood'; g.give(decoy, 'hood', 1, true); decoy.ai.goTo = { x: sp.x - 2, z: sp.z - 2, speed: 'walk', then: 'post' }; decoy.ai.post = { x: sp.x - 3, z: sp.z, yaw: 0 };
          const spy = K.AI.spawnSpy(g, 'palace', { tag: 'q_gatespy', near: { x: sp.x + 10, z: sp.z + 46 } });
          spy.ai.dest = [sp.x + 1, sp.z - 3]; spy.ai.pause = 0;
          g.msg('К воротам идут двое в капюшонах.', '#e0d0a0');
        }
        const spyDone = q.d.spy && (q.d.arrested || (tagged(g, 'q_gatespy').length > 0 && aliveTagged(g, 'q_gatespy').every(a => a.arrested)));
        return q.d.onPost >= 240 && spyDone;
      },
      on(g, q, type, d) { if (type === 'arrest' && d.tags && d.tags.includes('q_gatespy')) q.d.arrested = true; },
      progress(g, q) { return 'На посту: ' + Math.min(240, Math.floor(q.d.onPost)) + ' из 240 мин.'; },
      marker(g, q) { const s = spot(g, 'gate_post'); const spy = aliveTagged(g, 'q_gatespy')[0]; if (spy && spy.revealed) return { x: spy.x, z: spy.z, label: 'Шпион' }; return { x: s.x, z: s.z, label: 'Пост у ворот' }; },
      report: 'Шпиона взял, пост выстоял. Годится.\n\nДержи жалованье. Каждое утро подходи за деньгами, если выговоров нет.',
      reward: { gold: 30, rep: 8 }
    },
    {
      id: 'g2', title: 'Обоз',
      offer: 'В Развилках стоит казённый корован. Эльфы его уже раз ограбили на тракте. Второго раза не будет.\n\nИди в Развилки, встреть корован у площади и доведи до дворца. От телег дальше пятидесяти шагов не отходить.',
      goal: 'Встретить казённый корован в Развилках и довести его до дворца целым.',
      start(g, q) { q.d.stage = 0; },
      update(g, q, dt) {
        const p = g.player, t = place(g, 'town');
        if (q.d.stage === 0 && near(p, t.x, t.z, 50)) {
          q.d.stage = 1; K.AI.launchCaravan(g, 'supply', { tag: 'q_escort', guards: 2 });
          const amb = [58, -60];
          for (let i = 0; i < 4; i++) { const a = g.spawn(i < 3 ? 'partisan' : 'archer', amb[0] + (i - 1.5) * 4 + 8, amb[1] + (i % 2) * 5, { tags: ['q_ambush'], ai: { mode: 'wander', center: { x: amb[0] + 10, z: amb[1] }, r: 5 } }); a.drawn = true; }
          g.msg('Корован тронулся. Держитесь рядом с телегами.', '#e0d0a0');
        }
        if (q.d.stage === 1) {
          const w = leadWagon(g, 'q_escort');
          if (w && !near(p, w.x, w.z, 55)) { q.d.away = (q.d.away || 0) + dt; if (q.d.away > 30) { q.d.away = 0; breach(g, 'escort'); } } else q.d.away = 0;
        }
        return q.d.stage === 2;
      },
      on(g, q, type, d) {
        if (type === 'caravanArrive' && d.tag === 'q_escort') { if (!d.robbed) q.d.stage = 2; }
        if (type === 'rob' && q.d.stage === 1 && d.fac === 'emp') { q.d.failed = (q.d.failed || 0) + 1; g.msg('Корован ограблен! Воевода будет в ярости.', '#ff8060'); breach(g, 'escort'); q.d.stage = 0; }
      },
      marker(g, q) { if (q.d.stage === 0) return { x: place(g, 'town').x, z: place(g, 'town').z, label: 'Развилки' }; const w = leadWagon(g, 'q_escort'); return w ? { x: w.x, z: w.z, label: 'Казённый корован' } : { x: spot(g, 'gate_out').x, z: spot(g, 'gate_out').z, label: 'Ворота дворца' }; },
      report: 'Дошёл. Целый. Казначей даже улыбнулся, впервые за год.\n\nДержи. И иди отоспись, завтра будет работа.',
      reward: { gold: 60, rep: 8 }
    },
    {
      id: 'g3', title: 'Шпион',
      offer: 'В Развилках завёлся эльфийский шпион. Ходит в капюшоне, слушает, о чём болтают у колодца, и бегает в лес.\n\nНайди его. Спрашивай горожан про слухи. Капюшоны снимай с подозрительных. Только смотри: если сдёрнешь капюшон с честного горожанина, Развилки обидятся.',
      goal: 'Найти эльфийского шпиона в Развилках и взять его живым или мёртвым.',
      start(g, q) {
        K.AI.spawnSpy(g, 'town', { tag: 'q_townspy' });
        const sq = spot(g, 'town_square');
        for (let i = 0; i < 2; i++) { const a = g.spawn('townsman', sq.x + (i ? 14 : -16), sq.z + (i ? -8 : 12), { tags: ['q_decoy'], ai: { mode: 'route', route: 'town', ri: i * 3, wanderer: true } }); a.equip.head = 'hood'; g.give(a, 'hood', 1, true); }
      },
      update(g, q) { return !!q.d.arrested || (tagged(g, 'q_townspy').length > 0 && aliveTagged(g, 'q_townspy').every(a => a.arrested)); },
      on(g, q, type, d) { if (type === 'arrest' && d.tags && d.tags.includes('q_townspy')) q.d.arrested = true; },
      marker(g, q) { const s = aliveTagged(g, 'q_townspy')[0]; if (s && s.revealed) return { x: s.x, z: s.z, label: 'Шпион' }; return { x: place(g, 'town').x, z: place(g, 'town').z, label: 'Развилки' }; },
      reportFn(g, q) { return q.d.arrested ? 'Живым? Это лучше, чем я ждал. Посидит в холодной, расскажет про лесные тропы.\n\nДержи награду.' : 'Мёртвый шпион не расскажет, но и не убежит.\n\nДержи награду.'; },
      reward: { gold: 70, rep: 8 }
    },
    {
      id: 'g4', title: 'Набег на Листву',
      offer: 'Идём на Листву. Я веду, ты идёшь со мной. Шаг в сторону, выговор: держись в сорока шагах от меня.\n\nСожжём три дома и уйдём, пока лучники не опомнились. Факелы у интенданта, два я тебе уже дал.',
      goal: 'Идти в набег с воеводой и сжечь три дома в Листве.',
      start(g, q) {
        q.d.t0 = g.time; g.give(g.player, 'torch', 2);
        const c = g.actors.find(a => a.kind === 'commander' && !a.dead);
        const sq = K.AI.launchSquad(g, 'emp', 'village', 5, { tag: 'q_guardraid', burn: true, from: 'palace', life: 300 });
        if (c && sq) { c.ai.squad = sq.id; sq.members.unshift(c.id); sq.leader = c.id; g.give(c, 'torch', 1, true); q.d.cmd = c.id; }
      },
      update(g, q, dt) {
        const c = g.byId.get(q.d.cmd);
        const sq = g.squads.find(s => s.tag === 'q_guardraid');
        if (c && !c.dead && sq && sq.state === 'march' && !near(g.player, c.x, c.z, 45)) { q.d.away = (q.d.away || 0) + dt; if (q.d.away > 25) { q.d.away = 0; breach(g, 'march'); } } else q.d.away = 0;
        return burnedSince(g, 'elf_', q.d.t0) >= 3 && !near(g.player, place(g, 'village').x, place(g, 'village').z, 80);
      },
      progress(g, q) { return 'Сожжено домов: ' + burnedSince(g, 'elf_', q.d.t0) + ' из 3. Потом уйти из Листвы.'; },
      marker(g, q) { if (burnedSince(g, 'elf_', q.d.t0) >= 3) return { x: spot(g, 'commander').x, z: spot(g, 'commander').z, label: 'Дворец' }; const c = g.byId.get(q.d.cmd); return c && !c.dead ? { x: c.x, z: c.z, label: 'Воевода Груздь' } : { x: place(g, 'village').x, z: place(g, 'village').z, label: 'Листва' }; },
      reportFn(g, q) { const c = g.byId.get(q.d.cmd); if (c && !c.dead) { c.ai.squad = null; c.ai.mode = 'post'; c.ai.goTo = { x: spot(g, 'commander').x, z: spot(g, 'commander').z, speed: 'walk', then: 'post' }; } return 'Дым до самого дворца. Эльфы теперь неделю будут тушить, а не грабить.\n\nНе нравится тебе такая служба? Мне тоже. Но приказ есть приказ.'; },
      reward: { gold: 90, items: [['chain', 1]], rep: 10 }
    },
    {
      id: 'g5', title: 'Ночь у ворот',
      offer: 'Разведка донесла: Злой идёт на дворец. Ворота закрываем. Твоё место во дворе, у ворот.\n\nПока последний чернолатник не ляжет, со двора не уходить. Арбалетчики на стенах, ты внизу.',
      goal: 'Защитить дворец от штурма войска Злого.',
      start(g, q) {
        g.world.gates.palace_gate.closed = true; g.world.gates.palace_gate.hp = g.world.gates.palace_gate.max; g.world.rebuildNavColliders();
        q.d.t0 = g.time;
        const sq = K.AI.launchSquad(g, 'evil', 'palace', 8, { kind: 'assault', tag: 'q_assault', from: 'jne', startAt: [150, -300], life: 400 });
        if (sq) sq.kind = 'assault';
        q.d.started = true;
      },
      update(g, q, dt) {
        const p = g.player, P = place(g, 'palace');
        if (!near(p, P.x, P.z, 95)) { q.d.away = (q.d.away || 0) + dt; if (q.d.away > 30) { q.d.away = 0; breach(g, 'post'); } } else q.d.away = 0;
        const done = tagged(g, 'q_assault').length > 0 && aliveTagged(g, 'q_assault').length === 0;
        if (done) { const gt = g.world.gates.palace_gate; gt.closed = false; g.world.rebuildNavColliders(); }
        return done;
      },
      marker(g, q) { const a = aliveTagged(g, 'q_assault')[0]; return a ? { x: a.x, z: a.z, label: 'Войско Злого' } : { x: spot(g, 'gate_in').x, z: spot(g, 'gate_in').z, label: 'Ворота' }; },
      report: 'Отстояли. Ворота целы, почти.\n\nТеперь ясно: пока Злой сидит в форте, покоя не будет. Сначала глянем, что у него там.',
      reward: { gold: 120, items: [['potion', 2]], rep: 10 }
    },
    {
      id: 'g6', title: 'Разведка',
      offer: 'Над фортом есть скальный уступ. Оттуда видно весь двор. Дойди до уступа, посчитай, сколько их там, и возвращайся.\n\nИди по военному тракту, мимо заставы. В бой без нужды не лезь. Мёртвый разведчик ничего не докладывает.',
      goal: 'Дойти до скального уступа над фортом, осмотреться и вернуться к воеводе.',
      start(g, q) { q.d.look = 0; },
      update(g, q, dt) {
        const s = spot(g, 'lookout');
        if (near(g.player, s.x, s.z, 9)) { q.d.look += dt; if (q.d.look > 12 && !q.d.seen) { q.d.seen = true; const n = g.actors.filter(a => a.fac === 'evil' && !a.dead && K.AI.inside(g, a.x, a.z, 'fort')).length; q.d.count = n; g.msg('Во дворе форта около ' + n + ' человек. Пора назад.', '#e0d0a0'); } }
        return !!q.d.seen && near(g.player, place(g, 'palace').x, place(g, 'palace').z, 70);
      },
      marker(g, q) { if (q.d.seen) return { x: spot(g, 'commander').x, z: spot(g, 'commander').z, label: 'Воевода' }; const s = spot(g, 'lookout'); return { x: s.x, z: s.z, label: 'Скальный уступ' }; },
      reportFn(g, q) { return 'Около ' + (q.d.count || 'двадцати') + '? Немного больше, чем хотелось бы. Но меньше, чем у нас.\n\nГотовься. Идём на форт.'; },
      reward: { gold: 80, rep: 6 }
    },
    {
      id: 'g7', title: 'Штурм форта',
      offer: 'Идём на форт всем, кто может держать меч. Ворота у них старые, гнилые: разобьём.\n\nМне нужен Злой. Мёртвым. Остальные разбегутся сами.',
      goal: 'Взять старый форт и убить Злого.',
      start(g, q) {
        const v = villain(g);
        if (!v || v.dead) { q.d.done = true; return; }
        const gt = g.world.gates.fort_gate; gt.closed = true; gt.hp = gt.max; g.world.rebuildNavColliders();
        K.AI.launchSquad(g, 'emp', 'fort', 9, { kind: 'assault', tag: 'q_storm', from: 'pass', startAt: [300, 128], life: 600 });
      },
      update(g, q) { const v = villain(g); return q.d.done || !v || v.dead; },
      marker(g, q) { const v = villain(g); return v && !v.dead ? { x: v.x, z: v.z, label: 'Злой' } : null; },
      report: 'Злого больше нет. Ветераны сдаются десятками, бросают деревянные ноги в кучу у ворот.\n\nИмператор велел внести твоё имя в Летопись. Рядом с теми, кого он сам когда-то вычеркнул. Пусть знает, кто стоял у ворот.',
      reward: { gold: 300, rep: 20 }, ending: 'emp'
    }
  ];

  const EVIL = [
    {
      id: 'v1', title: 'Сбор войска',
      offer: 'Записка на столе, вашим почерком:\n\n«Солдат мало. Двое чернолатников ходят за мной, остальные стерегут стены. Нужно хотя бы четверо своих. Вербовщик Култышка у доски берёт по 60 золотых за голову.»',
      goal: 'Собрать войско из четырёх солдат (вербовщик у доски во дворе форта).',
      start() {},
      update(g) { return g.army().length >= 4; },
      progress(g) { return 'Войско: ' + g.army().length + ' из 4. Приказы войску: Q.'; },
      marker(g) { const s = spot(g, 'shop_recruit'); return { x: s.x, z: s.z, label: 'Доска вербовщика' }; },
      report: 'Четверо. Мало, но уже не двое. Своих людей кормят, а кормить нечем. Следующая записка лежит под первой.',
      reward: { gold: 40 }
    },
    {
      id: 'v2', title: 'Казна',
      offer: '«Казна пуста. Из Развилок во дворец ходят казённые корованы, ночью к нам ходят контрабандисты, но с ними мы в доле. Брать надо казённое. Два корована, и войску будет чем платить.»',
      goal: 'Ограбить два корована.',
      start(g, q) { q.d.n = 0; K.AI.launchCaravan(g, 'supply', { tag: 'q_v2' }); },
      on(g, q, type, d) { if (type === 'rob') q.d.n++; },
      update(g, q) { return q.d.n >= 2; },
      progress(g, q) { return 'Ограблено корованов: ' + q.d.n + ' из 2. Корован можно ограбить, когда отогнали охрану: E у телеги.'; },
      marker(g, q) { const w = g.wagons.find(x => !x.gone && !x.robbed); return w ? { x: w.x, z: w.z, label: w.name } : { x: 50, z: -100, label: 'Северный тракт' }; },
      report: 'Есть чем платить. Ветераны пьют за ваше здоровье. Пьют, правда, за чьё угодно.',
      reward: { gold: 60 }
    },
    {
      id: 'v3', title: 'Лесная заноза',
      offer: '«Эльфы опять лезут. Дозорный видел пятерых на восточном тракте: идут к форту, у двоих луки. Встретить у ворот. Живыми в лес не отпускать.»',
      goal: 'Отбить партизан, идущих на форт.',
      start(g, q) { squadNear(g, 'elf', 'fort', 5, 'q_v3', [250, 165], { kinds: ['partisan', 'partisan', 'archer', 'partisan', 'archer'], from: 'town', life: 300 }); },
      update(g, q) { return tagged(g, 'q_v3').length > 0 && aliveTagged(g, 'q_v3').length === 0; },
      on(g, q, type, d) { if (type === 'raidEnd' && d.tag === 'q_v3' && d.beaten) q.d.beaten = true; },
      marker(g, q) { const a = aliveTagged(g, 'q_v3')[0]; return a ? { x: a.x, z: a.z, label: 'Партизаны' } : null; },
      report: 'Заноза вынута. До следующей.',
      reward: { gold: 40 }
    },
    {
      id: 'v4', title: 'Тихий набег',
      offer: '«На краю леса эльфы поставили вышку. С неё видно весь военный тракт, и каждый наш выход в лес они знают заранее. Сжечь. Факелы в палатках.»',
      goal: 'Сжечь эльфийскую вышку на краю леса.',
      start(g) { g.give(g.player, 'torch', 2); },
      update(g) { return g.world.burn.elf_tower.state !== 'ok'; },
      marker(g) { const b = g.world.burn.elf_tower; return { x: b.x, z: b.z, label: 'Эльфийская вышка' }; },
      report: 'Вышка горела красиво. Эльфы теперь слепы на один глаз. Вам это чувство знакомо.',
      reward: { gold: 50 }
    },
    {
      id: 'v5', title: 'Глаза дворца',
      offer: '«Груздь шлёт разведку по военному тракту. Четверо стоят у заставы и считают наших. Убрать. Дворец не должен знать, сколько нас.»',
      goal: 'Убить разведчиков дворца у заставы на военном тракте.',
      start(g, q) {
        const f = place(g, 'ford');
        for (let i = 0; i < 4; i++) g.spawn(i === 3 ? 'xbowman' : 'spearman', f.x + 6 + i * 2, f.z + 8 + (i % 2) * 3, { tags: ['q_v5'], ai: { mode: 'wander', center: { x: f.x + 8, z: f.z + 8 }, r: 10 } });
      },
      update(g) { return tagged(g, 'q_v5').length > 0 && aliveTagged(g, 'q_v5').length === 0; },
      marker(g) { const a = aliveTagged(g, 'q_v5')[0]; return a ? { x: a.x, z: a.z, label: 'Разведчики дворца' } : null; },
      report: 'Четыре красных плаща в канаве у заставы. Теперь у дворца нет глаз на военном тракте.\n\nПора.',
      reward: { gold: 60 }
    },
    {
      id: 'v6', title: 'Таран',
      offer: '«Всё готово. Дворец закрыл ворота: знают, что идём. Ворота дубовые, но и не такие рубили.\n\nВести войско самому. Приказ войску: Q, потом 5, "на дворец". К войску присоединятся ещё шестеро из форта.»',
      goal: 'Довести войско до дворца и разбить ворота.',
      start(g) {
        const gt = g.world.gates.palace_gate; gt.closed = true; gt.hp = gt.max; g.world.rebuildNavColliders();
        const s = spot(g, 'fort_muster');
        for (let i = 0; i < 6; i++) { const p = K.AI.freeNear(g.world, s.x + (i % 3) * 2, s.z + Math.floor(i / 3) * 2); const a = g.spawn(i % 3 === 2 ? 'veteran' : 'blackguard', p[0], p[1], { tags: ['army'] }); a.ai.order = 'follow'; }
      },
      update(g) { return g.world.gates.palace_gate.hp <= 0; },
      marker(g) { const s = spot(g, 'gate_out'); const gt = g.world.gates.palace_gate; return { x: s.x, z: s.z, label: 'Ворота дворца (' + Math.ceil(gt.hp) + ')' }; },
      report: '«Ворота лежат.» Дальше записок не будет. Дальше только трон.',
      reward: {}, auto: true
    },
    {
      id: 'v7', title: 'Трон',
      offer: 'Велимир Третий в тронном зале, в глубине двора. Тот самый, что велел стереть ваше имя с камня Летописи.',
      goal: 'Убить императора Велимира III. Потом подойти к камню Летописи во дворе.',
      start() {},
      update(g, q) { const e = g.actors.find(a => a.kind === 'emperor'); if (!e || e.dead) q.d.dead = true; return q.d.dead && q.d.carved; },
      on(g, q, type, d) { if (type === 'carve') q.d.carved = true; },
      marker(g, q) { if (q.d.dead) { const s = g.world.uses.find(u => u.kind === 'chronicle'); return { x: s.x, z: s.z, label: 'Камень Летописи' }; } const e = g.actors.find(a => a.kind === 'emperor' && !a.dead); return e ? { x: e.x, z: e.z, label: 'Император' } : null; },
      report: '', reward: {}, auto: true, ending: 'evil'
    }
  ];

  const CAMPAIGNS = { elf: ELF, emp: EMP, evil: EVIL };
  const GIVER = { elf: ['elder'], emp: ['commander', 'quartermaster'], evil: null };

  function setTimeout0(g, q, key, mins) { q.d[key] = g.time + mins; }

  function init(g) {
    g.quest = { fac: g.pf, step: 0, state: 'offer', d: {}, t: g.time, ended: null };
  }
  function restored(g) { if (!g.quest) init(g); if (!g.garrison) K.AI.rebuildGarrison(g); }
  function list(g) { return CAMPAIGNS[g.quest ? g.quest.fac : g.pf]; }
  function cur(g) { const q = g.quest; if (!q) return null; return list(g)[q.step] || null; }
  function giverOf(g) {
    const ks = GIVER[g.pf];
    if (!ks) return null;
    for (const k of ks) { const a = g.actors.find(x => x.kind === k && !x.dead); if (a) return a; }
    return null;
  }
  function isGiver(g, a) { const gv = giverOf(g); return !!gv && gv === a; }

  function accept(g) {
    const q = g.quest, s = cur(g);
    if (!s || q.state !== 'offer') return;
    q.state = 'active'; q.d = {}; q.t = g.time;
    s.start && s.start(g, q);
    g.msg('Новый приказ: «' + s.title + '».', '#ffd080');
    g.emit('quest', { step: q.step, state: 'active' });
  }
  function complete(g) {
    const q = g.quest, s = cur(g);
    if (!s || q.state !== 'done') return null;
    const text = s.reportFn ? s.reportFn(g, q) : s.report;
    const r = s.reward || {};
    if (r.gold) g.addGold(g.player, r.gold);
    if (r.items) for (const [id, n] of r.items) g.give(g.player, id, n);
    if (r.rep) g.rep[g.pf] = clamp(g.rep[g.pf] + r.rep, -100, 100);
    if (s.ending) { q.ended = s.ending; g.emit('ending', { fac: s.ending }); }
    q.step++; q.state = q.step < list(g).length ? 'offer' : 'finished'; q.d = {};
    g.emit('quest', { step: q.step, state: q.state });
    return text;
  }
  function update(g, dt) {
    const q = g.quest; if (!q) return;
    if (g.pf === 'emp') guardDuty(g, dt);
    const s = cur(g);
    if (!s || q.state !== 'active') return;
    if (s.update(g, q, dt)) {
      q.state = 'done';
      g.msg('Приказ «' + s.title + '» выполнен. ' + (g.pf === 'evil' ? 'Вернитесь к военному столу.' : 'Доложите ' + (g.pf === 'elf' ? 'Ясеню.' : 'воеводе.')), '#ffd080');
      g.emit('quest', { step: q.step, state: 'done' });
      if (s.auto) { const txt = complete(g); if (txt) g.emit('note', { text: txt, title: s.title }); if (cur(g) && g.quest.state === 'offer' && g.pf === 'evil') { accept(g); g.emit('note', { text: cur(g).offer, title: cur(g).title }); } }
    }
  }
  function on(g, type, d) {
    const q = g.quest; if (!q) return;
    if (type === 'death' && d.kind === 'emperor' && g.pf === 'evil') {}
    const s = cur(g);
    if (s && q.state === 'active' && s.on) s.on(g, q, type, d);
  }
  function marker(g) {
    const q = g.quest, s = cur(g);
    if (!s) return null;
    if (q.state === 'active') return s.marker ? s.marker(g, q) : null;
    if (g.pf === 'evil') { const u = g.world.spots.wartable; return { x: u.x, z: u.z, label: 'Военный стол' }; }
    const gv = giverOf(g);
    return gv ? { x: gv.x, z: gv.z, label: gv.name } : null;
  }
  function goalText(g) {
    const q = g.quest, s = cur(g);
    if (!q) return '';
    if (q.state === 'finished' || !s) return q.ended ? 'Кампания пройдена. Долина ваша: делайте что хотите.' : 'Приказов больше нет.';
    if (q.state === 'offer') return g.pf === 'evil' ? 'Подойдите к военному столу в форте.' : 'Поговорите с ' + (g.pf === 'elf' ? 'Ясенем у большого дуба.' : 'воеводой Груздем во дворе дворца.');
    if (q.state === 'done') return g.pf === 'evil' ? 'Вернитесь к военному столу.' : 'Доложите о выполнении.';
    return s.goal + (s.progress ? ' ' + s.progress(g, q) : '');
  }

  function breach(g, kind) {
    if (g.pf !== 'emp' || g.flags.outlaw) return;
    const text = { post: 'ушли с поста', march: 'отстали от воеводы', escort: 'бросили корован', rob: 'грабили казённый корован', folk: 'напали на горожанина', ally: 'напали на своего' }[kind] || 'нарушили приказ';
    g.reprimands++;
    g.lastBreach = g.time;
    g.msg('Выговор (' + g.reprimands + ' из 3): вы ' + text + '.', '#ff8060');
    g.emit('reprimand', { n: g.reprimands, kind });
    if (g.reprimands >= 3) g.emit('arrest', {});
  }
  function guardDuty(g, dt) {
    if (g.reprimands > 0 && g.time - (g.lastBreach || 0) > 3 * 1440) { g.reprimands--; g.lastBreach = g.time; g.msg('Старый выговор сняли.', '#c8e0a0'); }
  }
  function resolveArrest(g, choice) {
    const p = g.player, cell = g.world.spots.barracks_in;
    if (choice === 'fine') {
      if (p.gold < 150) return 'gold';
      p.gold -= 150; g.reprimands = 0; g.msg('Вы заплатили штраф. Выговоры сняты.', '#e0d0a0'); return 'ok';
    }
    if (choice === 'cell') {
      p.x = cell.x; p.z = cell.z; p.y = g.world.groundAt(p.x, p.z);
      g.passTime(24 * 60, true); g.reprimands = 0; g.msg('Сутки в холодной. Выговоры сняты.', '#e0d0a0'); return 'ok';
    }
    g.flags.outlaw = true; g.rep.emp = -100;
    for (const a of g.actors) if (a.fac === 'emp' && !a.dead) { a.hostile.add(p.id); a.aware.set(p.id, { known: true, s: 1 }); }
    g.msg('Вы теперь вне закона. Стража дворца будет убивать вас на месте.', '#ff6040');
    return 'ok';
  }
  function wage(g) {
    if (g.pf !== 'emp' || g.flags.outlaw) return 'no';
    const day = Math.floor(g.time / 1440);
    if (g.wageDay === day) return 'paid';
    if (g.reprimands > 0) return 'reprimand';
    g.wageDay = day; g.addGold(g.player, 30);
    return 'ok';
  }

  K.Quests = { CAMPAIGNS, init, restored, cur, accept, complete, update, on, marker, goalText, giverOf, isGiver, breach, resolveArrest, wage };
})(globalThis.Korovany = globalThis.Korovany || {});
