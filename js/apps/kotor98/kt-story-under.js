(function (K) {
  'use strict';

  K.addNpcs({
    rukil: { n: 'Рукил', m: 'rukil', dlg: 'rukil', static: true, face: Math.PI / 2 },
    gendar: { n: 'Гендар', m: 'outcast', look: { hair: '#8a8a8a' }, dlg: 'gendar', static: true },
    hendar: { n: 'Хендар', m: 'outcast_f', dlg: 'hendar', static: true },
    outcast: { n: 'Изгой', m: 'outcast', wander: 4, bark: ['Нас сбросили сюда из Верхнего города. Изгоев никто не ждёт наверху.', 'Ракгулы нападают каждую ночь. Держитесь ближе к огню.', 'Рукил верит в Землю обетованную. Наверное, это просто сказка.'] },
    village_gate_guard: { n: 'Страж деревни', m: 'outcast', look: { top: '#4a4a3a' }, tpl: 'npc_guard', dlg: 'village_gate', static: true, face: Math.PI },
    zaalbar_cell: { n: 'Заалбар', m: 'zaalbar', tpl: 'zaalbar', dlg: 'zaalbar_free', joins: 'zaalbar', static: true, face: 0 }
  });

  K.addDialogs(`
== village_gate
@ n0
# n0 self
Стойте! Это деревня изгоев. Внутри — безопасно, пока ворота закрыты. Снаружи — ракгулы. Если идёте в пустоши, возвращайтесь до темноты. Хотя… какая тут темнота. Здесь всегда темно.
- Где вход в канализацию? -> sewer
- Спасибо. -> END
# sewer self
В юго-западном углу Подгорода. Решётка заперта — ключи есть только у старых контрабандистов. Ну, или у кого-то, кто вырос на улицах и знает, как её открыть.
> END

== gendar
@ n0
# n0 self
Я Гендар. Когда-то я был инженером в Верхнем городе. Потом меня сбросили сюда, как и всех. Теперь я помогаю старику Рукилу держать деревню.
- Что с вами случилось? -> story
- Расскажи про ракгулов. -> rak
- Пока. -> END
# story self
В Верхнем городе избавляются от неудобных людей. Банкротов, больных, недовольных. Сажают на лифт — и вниз. Обратно пути нет. Ситхи только ужесточили порядки.
- Это несправедливо. -> END | !ls:1
- Сами виноваты. -> END | !ds:1
# rak self
Мутанты. Говорят, это последствия древнего оружия. Их укус заражает чумой, и человек сам превращается в ракгула. Доктор наверху, Зелка Форн, ищет лекарство.
> END

== hendar
@ done ?hendar_done
@ n0
# n0 self
Прошу вас… Мой сын ранен — его поцарапал ракгул. Если у вас есть аптечка… Я отдам всё, что у меня есть. Правда, у меня ничего нет.
- Вот, возьмите аптечку. -> give | ?has:medpac !take:medpac
- Извините, нам самим нужно. -> END
- Бесполезно, он уже заражён. -> END | !ds:1 !set:hendar_done
# give self !ls:2 !xp:100 !set:hendar_done
Спасибо! Спасибо вам! Пусть Сила… пусть хоть кто-нибудь присмотрит за вами, как вы за нами.
> END
# done self
Мой сын поправляется. Да хранят вас… кто там хранит добрых людей.
> END

== rukil
@ done ?q:promised>=20
@ all ?has:rukil_1 ?has:rukil_2 ?has:rukil_3
@ some ?q:promised>=10
@ n0
# n0 self
Путник… с поверхности? Я Рукил. Когда-то я был летописцем. Теперь я просто старик, который верит в Землю обетованную.
- Что это за Земля обетованная? -> land
- Мне некогда. -> END
# land self
Место под городом, где нет ракгулов, где есть чистая вода и свет. Мой ученик отправился искать путь туда и вёл дневник. Он не вернулся. Его записи разбросаны: одна — где-то здесь, в пустошах Подгорода, другая — в канализации, третья… я слышал, вулкары забрали её в свою базу.
- Я найду дневник. -> END | !q:promised=10
- Это просто сказка, старик. -> END | !q:promised=10 !ds:1
# some self
Нашёл что-нибудь? Мой ученик писал о пути в Землю обетованную. Три части дневника: Подгород, канализация, база вулкаров.
> END
# all self
Это… его почерк. Все три части! Теперь я вижу путь. Земля обетованная существует! Мой народ спасён. Возьми это — всё, что у меня есть. И моё благословение.
- Рад был помочь. -> END | !take:rukil_1 !take:rukil_2 !take:rukil_3 !q:promised=20 !ls:2 !xp:600 !give:verpine_band
# done self
Изгои собираются в дорогу. Мы никогда не забудем тебя, путник.
> END

== zaalbar_free
@ n0
# n0 self
Ррррааааааарх! Грррух… [Огромный вуки настороженно смотрит на вас.]
> n1
# n1 mission
Заалбар! Большой ты мохнатый увалень, ты жив! Это друзья, Большой З. Они помогли мне найти тебя.
> n2
# n2 self
Ворррууух. Ррргх уррах аррр. [Ты спас мне жизнь. По законам моего народа, я в долгу жизни перед тобой. Я пойду за тобой, куда бы ты ни пошёл.]
- Долг жизни? Что это значит? -> debt
- Добро пожаловать в команду, Заалбар. -> END | !join:zaalbar !q:main=60 !xp:300
# debt self
Урргх ааррр хуррх. [Это клятва. Я буду защищать тебя до самой смерти. Такова честь вуки. Но Миссия тоже идёт с нами — я не брошу её.]
- Хорошо. Идём вместе. -> END | !join:zaalbar !q:main=60 !xp:300 !ls:1

== cell_console
@ opened ?cell_open
@ n0
# n0 narr
Грубо собранный пульт управления камерами. Гаморреанцы явно не утруждали себя защитой.
- Открыть камеры. -> END | ?gam_dead !run:cell_open
- Открыть камеры. -> busy | ?!gam_dead
- Отойти. -> END
# busy narr
Гаморреанцы рядом — сперва разберитесь с ними.
> END
# opened narr
Камеры открыты.
> END

== bait_spot
@ n0
# n0 narr
Узкий проход к логову ранкора. Сюда чудовище выходит кормиться — пол усыпан костями и обрывками брони.
- Спрятать осколочную гранату в гниющих останках и оставить приманку. -> bait | ?has:remains ?has:frag
- [Внимательность] Осмотреться. -> look
- Уйти. -> END
# look narr
Ранкор огромен — сражаться с ним в лоб самоубийство. Но он явно жрёт всё, что сюда попадает. Если бы найти подходящую приманку… например, останки одного из вулкаров, что пытались здесь пройти.
> END
# bait narr !take:remains !take:frag
Вы прячете гранату со взведённым таймером в зловонные останки и отходите в тень.
> END | !run:rancor_bait

== vulkar_terminal
@ n0
# n0 narr
Терминал охраны базы «Чёрных вулкаров». Экран показывает гараж и схему дверей.
- [Компьютеры 12] Отключить боевых дроидов в гараже. -> droids | ?skill:com:12 ?!garage_droids_off
- [2 шипа] Отключить боевых дроидов в гараже. -> droids | ?!skill:com:12 ?has:comp_spike:2 ?!garage_droids_off !take:comp_spike:2
- [Компьютеры 10] Открыть дверь гаража. -> door | ?skill:com:10 ?!garage_open
- [1 шип] Открыть дверь гаража. -> door | ?!skill:com:10 ?has:comp_spike ?!garage_open !take:comp_spike
- Отойти. -> END
# droids narr !now:garage_droids
Протокол отключения принят. Боевые дроиды в гараже переходят в режим ожидания.
> n0
# door narr !now:garage_open
Замок двери гаража разблокирован.
> n0
`);

  K.addScripts({
    under_enter(g) {
      const q = g.quests.main || 0;
      if (q >= 40 && q < 50) g.setQuest('main', 50);
    },
    sewer_enter(g) {
      const q = g.quests.main || 0;
      if (q >= 40 && q < 55) g.setQuest('main', 55);
    },
    vulkar_enter(g) {
      const q = g.quests.main || 0;
      if (q < 70) g.setQuest('main', 70);
    },
    cell_open(g) {
      g.flags.cell_open = true;
      const d = g.doors.find(x => x.req && x.req.indexOf('cell_open') >= 0);
      if (d) { d.locked = false; g.areaState(g.area.id).doors[d.key] = 'unlocked'; g.openDoor(d); }
      g.addLog('Двери камер открыты.', '#a0ffa0');
    },
    rancor_bait(g) {
      const r = g.creatures.find(c => c.tpl === 'rancor' && !c.dead);
      if (!r) return;
      if (r.aggro) { g.addLog('Ранкор уже в ярости и не обращает внимания на приманку!', '#ffb0b0'); return; }
      const spot = g.objects.find(o => o.type === 'use' && o.def.dlg === 'bait_spot');
      const tx = spot ? spot.x + 1.2 : r.x, tz = spot ? spot.z : r.z;
      r.faction = 'neutral';
      r.leash = 0;
      let done = false;
      const boom = () => {
        if (done || r.dead) return;
        done = true;
        r.anim = { a: 'eat', t: 0 };
        K.later(g, 1.6, () => {
          g.emit('fx', { kind: 'explosion', x: r.x, z: r.z });
          g.emit('fx', { kind: 'explosion', x: r.x + 0.8, z: r.z + 0.4 });
          g.emit('sfx', { id: 'explode' });
          g.emit('shake', { v: 0.9 });
          g.addLog('Граната взрывается в брюхе ранкора!', '#ffd070');
          r.faction = 'hostile';
          g.kill(r, g.leader);
        });
      };
      r.runTo = [tx, tz];
      r.onArrive = boom;
      K.later(g, 10, boom);
      if (g.roster.mission && g.active.indexOf('mission') >= 0) g.emit('float', { uid: g.roster.mission.uid, text: 'Он идёт! Отойдите!', col: '#ffffff', long: true });
    },
    garage_droids(g) {
      g.flags.garage_droids_off = true;
      for (const c of g.creatures) if (c.tpl === 'war_droid' && !c.dead && g.area.id === 'vulkar_base') { c.loot = []; c.cr = 60; g.kill(c, null); }
      g.gainXp(100);
    },
    garage_open(g) {
      g.flags.garage_open = true;
      const d = g.doors.find(x => x.keyItem === 'garage_pass');
      if (d) { d.locked = false; g.areaState(g.area.id).doors[d.key] = 'unlocked'; }
      g.gainXp(60);
    }
  });

  K.DEATH_HOOKS['group:gam'] = g => { g.flags.gam_dead = true; g.addLog('Гаморреанцы повержены. Пульт камер теперь доступен.', '#c8e0ff'); };
  K.DEATH_HOOKS.rancor = g => { g.flags.rancor_dead = true; };
  K.QUEST_ITEM_HOOKS.serum = g => { if ((g.quests.serum || 0) < 20) g.setQuest('serum', 20); };
  const journal = g => { if (!g.quests.promised) g.setQuest('promised', 10); };
  K.QUEST_ITEM_HOOKS.rukil_1 = journal;
  K.QUEST_ITEM_HOOKS.rukil_2 = journal;
  K.QUEST_ITEM_HOOKS.rukil_3 = journal;

  if (typeof module !== 'undefined' && module.exports) module.exports = K;
})(globalThis.Kotor98 = globalThis.Kotor98 || {});
