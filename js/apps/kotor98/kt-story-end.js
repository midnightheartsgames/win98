(function (K) {
  'use strict';

  K.addNpcs({
    davik_greet: { n: 'Давик Канг', tpl: 'davik', m: 'davik', dlg: 'davik_tour', sight: 8, static: true, face: Math.PI },
    davik_guard_npc: { n: 'Охранник Давика', tpl: 'davik_guard', m: 'davik_guard', g: 'estate', wander: 3, bark: ['Гости Давика не ходят в восточное крыло.', 'Ангар закрыт. Приказ хозяина.', 'Новенькие? Не наделайте глупостей.'] },
    prisoner: { n: 'Пленник', m: 'republic', dlg: 'prisoner', static: true },
    torture_droid: { n: 'Дроид-допросчик', tpl: 'war_droid', m: 'protocol', static: true, bark: ['Процедура допроса продолжается. Посторонним покинуть помещение.'] }
  });

  K.addDialogs(`
== sith_terminal
@ n0
# n0 narr
Терминал охраны базы ситхов. Доступ защищён, но Т3-М4 уже подключил свой интерфейс.
- [Компьютеры 12] Отключить штурмовых дроидов в лаборатории. -> droids | ?skill:com:12 ?!sith_droids_off
- [2 шипа] Отключить штурмовых дроидов в лаборатории. -> droids | ?!skill:com:12 ?has:comp_spike:2 ?!sith_droids_off !take:comp_spike:2
- [Компьютеры 10] Открыть оружейную. -> armory | ?skill:com:10 ?!sith_armory
- [1 шип] Открыть оружейную. -> armory | ?!skill:com:10 ?has:comp_spike ?!sith_armory !take:comp_spike
- Просмотреть журнал базы. -> log
- Отойти. -> END
# droids narr !now:sith_droids
Штурмовые дроиды переведены в режим обслуживания.
> n0
# armory narr !now:sith_armory
Замок оружейной разблокирован.
> n0
# log narr
«Губернатор приказал хранить коды запуска для прохода через блокаду в его кабинете, в северном крыле. Все корабли на Тарисе стоят под арестом до поимки джедая. Адмирал Карат недоволен задержкой. Лорд Малак теряет терпение».
> n0

== davik_tour
@ n0
# n0 self
А, Кандерус! Это и есть твои новые рекруты? Выглядят… живучими. Я Давик Канг, и на Тарисе нет никого богаче и влиятельнее меня. Добро пожаловать в моё поместье.
- Честь познакомиться, Давик. -> n1
- Кандерус говорил, вам нужны люди. -> n1
# n1 self
Нужны. Ситхи раздражают, конкуренты наглеют, а Кало Норд берёт слишком дорого. Видите мой ангар? Там стоит «Эбеновый ястреб» — самый быстрый корабль в этом секторе. Скоро ситхи снимут блокаду, и я вернусь к делам.
- Впечатляет. -> n2
- [Убеждение] Может, прокатите нас на нём? -> joke | ~per:12:n2
# joke self
Ха! Смелость — это хорошо. Глупость — нет. Когда-нибудь, может быть.
> n2
# n2 self
Гостевые комнаты — в западном крыле. Отдохните. В восточное крыло и в ангар без меня не заходить — охрана стреляет без предупреждения. Кандерус, покажи им всё. Мне пора к… гостю в пыточной.
> n3 | !q:main=150 !set:davik_tour
# n3 canderous
Он ушёл. Хорошо. Код от ангара хранится в его кабинете, в восточном крыле — либо в терминале, либо в столе. Охрана пока нас не трогает. Не шумите, пока не доберёмся до корабля.
> END | !leave

== prisoner
@ n0
# n0 self
Вы… не из людей Давика? Я солдат Республики, пилот со «Шпиля Эндара». Давик держит меня здесь, думает, что я знаю, где прячется джедай. Пожалуйста… выключите эту машину.
- Держись, мы тебя вытащим. -> free
- [Лечение] Сначала я осмотрю твои раны. -> heal | ?skill:tre:10
- Не повезло тебе, приятель. -> leave
# heal self !ls:1
Спасибо… Уже легче. Выключите дроида — и я сбегу через служебный лифт.
> free
# free self !run:prisoner_free
Спасибо! Да хранит вас Республика. Если выберетесь с Тариса — передайте флоту, что пилот Даннер жив.
> END
# leave self !ds:2 !run:prisoner_leave
Нет… Нет! Вернитесь! Пожалуйста!
> END

== davik_terminal
@ got ?has:hangar_code
@ n0
# n0 narr
Личный терминал Давика Канга. Бухгалтерия, контракты с охотниками за головами, расписание охраны… и системы управления ангаром.
- [Компьютеры 14] Взломать систему ангара. -> hack | ?skill:com:14
- [2 шипа] Взломать систему ангара. -> hack | ?!skill:com:14 ?has:comp_spike:2 !take:comp_spike:2
- [Т3-М4] Пусть Т3 подключится. -> t3 | ?party:t3 ?!skill:com:14
- Отойти. -> END
# hack narr !give:hangar_code !xp:200
Код доступа к воротам ангара скопирован.
> END
# t3 t3 !give:hangar_code !xp:200
Бии-дуу-вии! [Т3-М4 с явным удовольствием вскрывает защиту и выводит на экран код ангара.]
> END
# got narr
Код ангара уже у вас.
> END

== davik_confront
@ n0
# n0 davik
Так-так. Мои новые «рекруты» решили угнать мой корабль. Кандерус, я от тебя такого не ожидал. Хотя нет — ожидал. Поэтому Кало здесь.
- Отойди, Давик. Корабль наш. -> n1
- Кало Норд? Мы уже виделись. -> n1
# n1 calo
Давик, я заберу их головы. Особенно джедайскую. Ситхи хорошо заплатят.
> n2
# n2 canderous
Наконец-то. Давно хотел проверить, чего стоит «великий» Кало Норд.
> n3
# n3 davik
Убейте их всех!
> END | !run:estate_fight

== hawk_ramp
@ go ?hawk_ready
@ n0
# n0 narr
Трап «Эбенового ястреба» опущен. Корабль готов к взлёту, но Давик так просто его не отдаст.
> END
# go narr
Трап «Эбенового ястреба». Над головой грохочут взрывы: флот ситхов бомбардирует Тарис.
- На борт! Взлетаем! -> END | !run:ending
- Ещё секунду. -> END

== davik_dead
@ n0
# n0 narr
Давик Канг падает. В тот же миг поместье содрогается — сверху обрушиваются огонь и обломки. Флот ситхов начал бомбардировку Тариса.
> n1
# n1 bastila
Малак решил уничтожить всю планету, лишь бы добраться до меня… Миллионы людей! Скорее на корабль!
> n2
# n2 canderous
Кало завалило обломками. Нет времени проверять. Бегом к трапу!
> END | !set:hawk_ready

== carth_talk
@ n0
# n0 carth
Что-то нужно?
- Расскажи о себе. -> me | ?!carth_t1
- Ты всё ещё мне не доверяешь? -> trust | ?carth_t1 ?!carth_t2
- Что думаешь о Бастиле? -> bast | ?joined:bastila ?!carth_t3
- Ничего. Идём дальше. -> END
# me carth !set:carth_t1
Служу Республике всю жизнь. Пилот, потом офицер. Был на Тельосе, когда… Неважно. Скажем так: у меня есть причины ненавидеть ситхов. Больше, чем у многих.
- Что случилось на Тельосе? -> tel
- Понимаю. -> END
# tel carth
Не сейчас. Может, когда-нибудь. Когда я буду уверен, что могу тебе доверять.
> END
# trust carth !set:carth_t2
Слушай… Меня предали те, кому я доверял больше всех. После такого начинаешь проверять каждого. Ты пока ведёшь себя честно. Этого достаточно — на сегодня.
> END
# bast carth !set:carth_t3
Она смелая, этого не отнять. Но упрямая, как бантха. И командовать любит больше, чем слушать. Хотя… без неё мы бы застряли тут навсегда.
> END

== mission_talk
@ n0
# n0 mission
Ну что, босс? Хочешь поболтать?
- Расскажи о себе, Миссия. -> me | ?!mission_t1
- Как вы с Заалбаром познакомились? -> zal | ?mission_t1 ?!mission_t2
- Всё в порядке. Идём. -> END
# me mission !set:mission_t1
Родилась на Рилоте, но почти не помню его. Брат, Гриф, притащил меня на Тарис, а потом… улетел. Обещал вернуться. Не вернулся. С тех пор я сама по себе. Ну, почти.
- Жаль твоего брата. -> END | !ls:1
- Ты хорошо справляешься. -> END
# zal mission !set:mission_t2
Он спас меня от банды, когда мне было лет девять. Просто встал между нами — такой огромный, мохнатый. С тех пор мы вместе. Он ворчит, но он лучший друг во всей галактике.
> END

== zaalbar_talk
@ n0
# n0 zaalbar
Урррх? [Ты хотел поговорить?]
- Расскажи о Кашиике. -> home | ?!zaalbar_t1
- Что такое долг жизни? -> debt | ?zaalbar_t1 ?!zaalbar_t2
- Нет, ничего. -> END
# home zaalbar !set:zaalbar_t1
Ррааух грррх. Урррах. [Кашиик — родина вуки. Огромные деревья до облаков. Я не могу вернуться туда. Меня изгнали. Однажды я расскажу почему.]
> END
# debt zaalbar !set:zaalbar_t2
Грррах ууух ррраа. [Долг жизни — самая священная клятва вуки. Ты спас меня. Теперь моя жизнь принадлежит тебе, пока долг не будет оплачен. А его нельзя оплатить.]
> END

== bastila_talk
@ n0
# n0 bastila
Да? Если это не срочно, у меня много мыслей.
- Что такое Боевая медитация? -> med | ?!bastila_t1
- Почему ты так на меня смотришь? -> look | ?bastila_t1 ?!bastila_t2
- Ничего. Пойдём. -> END
# med bastila !set:bastila_t1
Редкий дар Силы. Я могу укреплять дух союзников и сеять сомнения в сердцах врагов. Целые флоты побеждали благодаря ей. Поэтому Малак так жаждет меня заполучить.
> END
# look bastila !set:bastila_t2
Я… Там, на «Шпиле Эндара», когда ты был без сознания, я почувствовала что-то. Связь. Как будто мы уже встречались. Это, наверное, глупо. Забудь.
- Ты тоже снилась мне. -> dream
- Странно. -> END
# dream bastila
Снилась? Что ты видел?.. Нет. Не сейчас. Когда мы доберёмся до Совета джедаев, мы всё обсудим. Обещаю.
> END

== t3_talk
@ n0
# n0 t3
Бип-вуу? [Т3-М4 вопросительно вращает куполом.]
- Кто был твоим прежним хозяином? -> who
- Ничего, Т3. -> END
# who t3
Ррр-бии… дзинь. [Т3-М4 выводит на экран: «ДАННЫЕ ЗАШИФРОВАНЫ. ДОСТУП ЗАПРЕЩЁН». Похоже, дроид и сам не рад, что не может ответить.]
> END

== canderous_talk
@ n0
# n0 canderous
Чего тебе?
- Расскажи о мандалорских войнах. -> war | ?!cand_t1
- Почему ты работал на Давика? -> davik | ?cand_t1 ?!cand_t2
- Ничего. -> END
# war canderous !set:cand_t1
Лучшее время в моей жизни. Мы шли от системы к системе, и никто не мог нас остановить. Пока не пришли джедаи — Реван и Малак. Реван был гением. Разбил нас у Малакора. После этого мандалорцы рассеялись по галактике.
> END
# davik canderous !set:cand_t2
Воин без войны — наёмник. Давик платил. Но он слабак, прячущийся за охраной. Я лучше рискну с тобой и этим ведром на ножках, чем сгнию здесь.
> END
`);

  K.addScripts({
    sith_enter(g) {
      if (!g.flags.sith_entered) { g.flags.sith_entered = true; g.addLog('Т3-М4 взламывает замок. Двери базы ситхов открываются.', '#c8e0ff'); g.gainXp(150); }
    },
    sith_droids(g) {
      g.flags.sith_droids_off = true;
      for (const c of g.creatures) if (c.tpl === 'sith_droid' && !c.dead && c.group === 'lab') { c.loot = []; c.cr = 60; g.kill(c, null); }
      g.gainXp(120);
    },
    sith_armory(g) {
      g.flags.sith_armory = true;
      const d = g.doors.find(x => x.n === 'Дверь оружейной');
      if (d) { d.locked = false; g.areaState(g.area.id).doors[d.key] = 'unlocked'; }
      g.gainXp(60);
    },
    davik_enter(g) {
      if ((g.quests.main || 0) < 140) g.setQuest('main', 140);
    },
    prisoner_free(g) {
      g.flags.prisoner_done = true;
      g.setQuest('prisoner', 20);
      g.gainXp(250);
      g.shiftAlign(2);
      const d = g.npc('torture_droid');
      if (d) { d.faction = 'hostile'; d.loot = []; g.kill(d, g.leader); }
      const p = g.npc('prisoner');
      if (p) { p.static = false; p.runTo = [5.5, 35.5]; p.onArrive = () => g.removeCreature(p, true); }
    },
    prisoner_leave(g) {
      g.flags.prisoner_done_dark = true;
      g.setQuest('prisoner', 30);
    },
    hangar_confront(g) {
      if (g.flags.davik_confronted) return;
      g.flags.davik_confronted = true;
      const spots = [[25.5, 13.5], [35.5, 13.5]];
      const dv = K.makeCreature('davik', { faction: 'neutral' });
      dv.x = spots[0][0]; dv.z = spots[0][1]; dv.group = 'davik'; dv.ang = Math.PI; dv.npcId = 'davik';
      const ca = K.makeCreature('calo', { faction: 'neutral' });
      ca.x = spots[1][0]; ca.z = spots[1][1]; ca.group = 'davik'; ca.ang = Math.PI; ca.immortal = true; ca.npcId = 'calo';
      g.creatures.push(dv, ca);
      for (const c of g.creatures) if (c.npcId === 'davik_guard_npc' && c.z < 16) c.group = 'davik';
      g.emit('toast', { text: 'Давик Канг и Кало Норд' });
      g.startDialog('davik_confront', dv);
    },
    estate_fight(g) {
      g.flags.estate_alarm = true;
      g.setGroupHostile('davik');
      for (const c of g.creatures) if (c.npcId === 'davik_guard_npc' && !c.dead && c.group === 'davik') { c.faction = 'hostile'; c.aggro = true; c.dlg = null; }
    },
    davik_dead(g) {
      g.flags.davik_dead = true;
      g.emit('shake', { v: 1.2 });
      g.emit('sfx', { id: 'explode' });
      for (let i = 0; i < 6; i++) K.later(g, 0.3 * i, () => { g.emit('fx', { kind: 'explosion', x: 12 + g.rng.next() * 36, z: 2 + g.rng.next() * 12 }); g.emit('sfx', { id: 'explode' }); g.emit('shake', { v: 0.5 }); });
      const calo = g.creatures.find(c => c.tpl === 'calo' && !c.dead);
      if (calo) { g.emit('fx', { kind: 'explosion', x: calo.x, z: calo.z }); g.removeCreature(calo, false); g.addLog('Кало Норда завалило горящими обломками.', '#ffd070'); }
      for (const c of g.creatures.slice()) if (c.faction === 'hostile' && !c.dead) { c.loot = []; c.cr = 0; g.kill(c, null); }
      K.later(g, 1.2, () => g.startDialog('davik_dead', null));
    },
    ending(g) {
      g.setQuest('main', 200);
      g.gainXp(1000);
      g.mode = 'ending';
      g.emit('mode', { mode: 'ending' });
      g.emit('ending', {});
    }
  });

  K.DEATH_HOOKS.davik = g => K.SCRIPTS.davik_dead(g);
  K.QUEST_ITEM_HOOKS.launch_codes = g => { if ((g.quests.main || 0) < 130) g.setQuest('main', 130); };
  K.QUEST_ITEM_HOOKS.hangar_code = g => { if ((g.quests.main || 0) < 160) g.setQuest('main', 160); };

  if (typeof module !== 'undefined' && module.exports) module.exports = K;
})(globalThis.Kotor98 = globalThis.Kotor98 || {});
