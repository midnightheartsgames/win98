(function (S) {
  'use strict';
  const { C, COLORS, ITEMS, TALK } = S;

  function ln(who, text) { return function* (g) { yield g.say(who, text); }; }

  Object.assign(ITEMS, {
    max: { name: 'Макс', icon: 'max', look: function* (g) { yield g.say('sam', 'Макс. Напарник и лучший друг. Его можно применить почти к чему угодно.'); yield g.say('max', 'Я многофункциональный!'); } },
    gun: { name: 'Пистолет Сэма', icon: 'gun', look: ['Мой служебный револьвер. Большой и громкий.', 'Решает проблемы. Иногда не те, о которых я просил.'] },
    swiss: { name: 'Швейцарский сыр', icon: 'swiss', look: 'Кусок сыра, который я лично сделал швейцарским.' },
    glove: { name: 'Боксёрская перчатка', icon: 'glove', look: 'Боксёрская перчатка Макса. Мне она маловата, но бить можно.' },
    ball: { name: 'Шар для боулинга', icon: 'ball', look: 'Шар для боулинга. Если уронить его с высоты, мало не покажется.' },
    hanger: { name: 'Плечики', icon: 'hanger', look: 'Проволочные плечики. Ими можно вскрыть машину. Или поймать лишний канал.' },
    tape: { name: 'Кассета «Ай-Бо»', icon: 'tape', look: '«Ай-Бо: аэробика для глаз. Брэди Калчер научит вас смотреть правильно!» На обложке огромный немигающий глаз.' },
    cheese: { name: 'Сыр Боско', icon: 'cheese', look: 'Головка сыра из лавки Боско. Не оплачена. Антивор-О-Мат, наверное, уже запомнил моё лицо.' },
    spray: { name: 'Баллончик с краской', icon: 'spray', look: 'Баллончик зелёной краски. Цвет «Ядовитый лайм».' },
    cash: { name: 'Мешок с деньгами', icon: 'cash', look: 'Мешок с десятью тысячами долларов, штраф за разбитую фару. На мешке написано «Первый национальный банк». Спрашивать не буду.' },
    launcher: { name: 'Гранатомёт со слезоточивым газом', icon: 'launcher', look: 'Гранатомёт со слезоточивым газом. После заряда человек какое-то время ничего не видит.' },
    form: { name: 'Бланк заявления', icon: 'form', look: function* (g) { yield* S.readForm(g); } },
    formok: { name: 'Подписанный бланк', icon: 'formok', look: function* (g) { yield g.say('sam', 'Бланк, подписанный лицензированным психотерапевтом. Официально подтверждено: я псих.'); yield g.say('max', 'Поздравляю, Сэм! Повесим в рамочку!'); } },
    tapes: { name: 'Коробка кассет', icon: 'tapes', look: ['Кассеты «Ай-Бо». Их надо доставить. Доставка. Радость.', 'Кассеты. Много кассет. Мастер будет доволен.'] },
    pump: { name: 'Велосипедный насос', icon: 'pump', look: 'Велосипедный насос. Надувает всё, что надувается.' },
    maxhead: { name: 'Голова Макса', icon: 'maxhead', look: 'Голова Макса. Без тела она выглядит спокойнее. Но скучает по рукам.' },
    antenna: { name: 'Антенна-плечики', icon: 'antenna', look: 'Плечики из сна. Служили Брэди антенной.' },
    diagram: { name: 'Схема шлема', icon: 'diagram', look: 'Схема антигипнотического шлема из журнала «Вестник практической психиатрии». Подписано: «Не пытайтесь повторить дома». Мы попытаемся не дома.' },
    helmet: { name: 'Антигипнотический шлем', icon: 'helmet', look: 'Антигипнотический шлем работы Боско. Дуршлаг, фольга, изолента и плечики вместо антенны. Выглядит глупо. Значит, работает.' }
  });

  ITEMS.gun.on = {
    max: function* (g) { yield g.say('sam', 'Макс, замри.'); yield g.say('max', 'Ух ты! В меня ещё никто не целился из этого угла!'); yield g.say('sam', 'Я пошутил, Макс.'); yield g.say('max', 'А я нет!'); },
    '*': 'Стрелять в собственные вещи? Это уже к Сибил.'
  };
  ITEMS.max.on = {
    gun: function* (g) { yield g.say('max', 'Дай пострелять, Сэм! Я буду целиться только в то, что шевелится!'); yield g.say('sam', 'Всё шевелится, Макс. В этом проблема.'); },
    '*': function* (g) { yield g.say('max', 'Я могу это понюхать. Или съесть. Или понюхать, а потом съесть.'); }
  };
  ITEMS.glove.on = { max: function* (g) { yield g.say('max', 'Спарринг? Давай, Сэм! Только не бей меня в лицо, у меня там рот!'); yield g.say('sam', 'Как-нибудь в другой раз, Макс.'); } };
  ITEMS.spray.on = { max: 'Не буду красить Макса. Он и так достаточно заметный.' };
  ITEMS.ball.on = { max: function* (g) { yield g.say('max', 'Я буду кеглей! Катай!'); yield g.say('sam', 'Не сейчас, Макс. У нас дело.'); } };
  ITEMS.launcher.on = { max: 'Нет. Макс плачет только от лука.' };
  ITEMS.hanger.on = { diagram: 'Я не инженер. Отнесу это Боско.' };
  ITEMS.diagram.on = { hanger: 'Я не инженер. Отнесу это Боско.' };
  ITEMS.swiss.on = { max: function* (g) { yield g.say('max', 'Я не ем сыр с дырками, Сэм. В дырках пустые калории.'); } };

  S.GENERIC = {
    look: ['Ничего особенного.', 'Выглядит ровно тем, чем является. Для нашего города редкость.', 'Я это вижу. Оно видит меня. Мы в расчёте.', 'Смотрю. Не впечатляет.'],
    use: ['Не знаю, что с этим делать.', 'Не работает. Или это я не работаю.', 'Не хочу это трогать без ордера.', 'Нет. Моя внутренняя собака говорит «нет».'],
    talk: ['Оно не отвечает. Типичный свидетель.', 'Разговор с предметами, Макс, это следующая стадия. Я пока не там.', 'Молчит. Наверное, адвокат запретил.'],
    useItem: ['Это не сработает.', 'Не думаю, что это хорошая идея. Даже по нашим меркам.', 'Нет. Даже Макс не стал бы так делать.', 'Бессмысленно. Хотя красиво.'],
    items: {
      gun: ['Стрелять в это бессмысленно.', 'Я бы выстрелил, но патроны нынче дороже хорошего повода.', 'Нет. Я стреляю только в то, что этого заслуживает.'],
      max: [function* (g) { yield g.say('max', 'Сэм, это несъедобно. Я проверил.'); }, function* (g) { yield g.say('max', 'Хочешь, я это укушу? Нет? Ну и ладно.'); }, function* (g) { yield g.say('max', 'Я на это не пойду. У меня принципы. Один. Но крепкий.'); }]
    },
    hypno: ['Это не кассета. Это неважно.', 'Мастер не одобрил бы.', 'Доставка кассет. Кассеты. Радость.', 'Мои мысли... заняты кассетами.']
  };

  S.ACTOR_HOT = S.ACTOR_HOT || {};
  S.ACTOR_HOT.max = {
    name: 'Макс',
    walk: null,
    look: ['Макс. Кролик-нечто. Его никто не понимает, и это взаимно.', 'Макс. Снаружи белый мех, внутри что-то, что лучше не выпускать.'],
    talk: function* (g) { yield g.talkTo('max'); },
    use: function* (g) { yield g.say('max', 'Щекотно!'); },
    items: {
      gun: function* (g) { yield* S.ITEMS.gun.on.max(g); },
      '*': function* (g) { yield g.say('max', 'Мне? Подарок? Лучше дай мне что-нибудь взорвать.'); }
    }
  };

  function maxHint(g) {
    const f = g.f;
    if (!f.phoneBack) {
      if (!f.closetOpen) return 'Джимми хочет швейцарский сыр. По-моему, у нас в шкафу что-то воняет. В хорошем смысле.';
      if (!f.cheeseShot) return 'В шкафу гора сыра! Пара пуль, и он швейцарский!';
      if (!g.has('swiss') && !f.jimmyOut) return 'Возьми кусочек дырявого сыра, Сэм.';
      if (!f.jimmyOut) return 'Положи сыр у норы. Крысы как люди, на халяву вылезают сами.';
      return 'Он вылез! Используй меня на крысе, Сэм! Я знаю, чего он боится!';
    }
    if (!f.caseOpen) return 'Телефон звонит, Сэм!';
    if (!f.metSpecs) return 'На улице кто-то рисует на стенах. Пойдём спросим зачем. Можно кулаками.';
    if (!f.tapeWatched) return g.has('tape') ? 'Давай посмотрим кассету у нас в офисе! У нас есть видик!' : 'У Боско раздают бесплатные кассеты «Ай-Бо». Бесплатное всегда подозрительно. И вкусно.';
    if (!f.sybilFree) return 'У Сибил в кабинете шкаф ходит ходуном. Может, там клад. Или Сибил.';
    if (!f.knowCure) return 'Надо спросить Сибил, как лечить гипноз. Она же доктор. Ну, сейчас доктор.';
    if (!f.whizzerCured) {
      if (!f.cheeseInBasket && !f.maxInToilet) return 'Уиззеру вечно надо в туалет. Если туалет займу я, ему придётся бросить корзинку. А у Боско есть штука, которая бьёт воров...';
      if (!f.cheeseInBasket) return 'Пока я сижу в туалете, подложи Уиззеру в корзинку что-нибудь неоплаченное!';
      return 'Всё готово. Позови меня из туалета, Сэм!';
    }
    if (!f.specsCured) {
      if (!g.has('spray') && !f.graffitiRuined) return 'На багажнике машины за нашим Де Сото лежит баллончик с краской.';
      if (!f.graffitiRuined) return 'Испорти Спексу его старую картинку у крыльца! Он взбесится и побежит перерисовывать.';
      if (!g.has('ball')) return 'Спекс стоит прямо под нашим окном. Нам бы что-нибудь тяжёлое. В офисе валяется шар для боулинга!';
      return 'Спекс стоит прямо под нашим окном. У нас есть шар для боулинга и гравитация. Гравитация бесплатно!';
    }
    if (!f.peepersCured) {
      if (!g.has('launcher') && !g.has('cash')) return f.knowLauncher ? 'Боско продаёт гранатомёт, но денег у нас нет. Выпишем кому-нибудь штраф на шоссе! Садись в Де Сото!' : 'Спроси Боско, что у него продаётся. Мне нравятся вещи, которые стреляют.';
      if (g.has('cash')) return 'Отдай деньги Боско! Пусть отдаст гранатомёт!';
      if (!f.peepersGassed) return 'Пиперс слишком быстро бегает. Надо, чтобы он ослеп от слёз. Стреляй в него газом!';
      return 'Теперь бей его перчаткой, Сэм!';
    }
    if (!f.homeKnown) return 'Надо догнать тот фургон!';
    if (!g.has('form') && !g.has('formok') && !f.samHypno) return 'У ворот приюта есть бланки заявлений. Может, нас примут как бывших звёзд?';
    if (g.has('form')) return 'Бланк должен подписать психиатр. Сибил! Прочитай симптомы на бланке и притворись, что они у тебя есть. Ну, больше, чем обычно.';
    if (g.has('formok')) return 'Вставь подписанный бланк в щель под будкой с обезьянкой!';
    return 'Не знаю, Сэм. Давай просто что-нибудь сломаем и посмотрим, что будет.';
  }

  const MAX_GAGS = [
    ['max', 'Отлично! Я только что придумал, как ограбить банк с помощью ложки. Но ложку я съел.'],
    ['max', 'Сэм, если я закрою глаза, меня видно? Проверь!'],
    ['max', 'Мне скучно. Уже час никто не взрывался.'],
    ['max', 'Я чувствую себя как миллион долларов. Мелкими купюрами, мятыми, в мешке.'],
    ['max', 'Я голоден. Не в смысле еды. В смысле насилия. И еды.']
  ];

  TALK.max = {
    actor: 'max',
    options: [
      { id: 'hint', icon: 'q', text: 'Макс, есть идеи, что делать дальше?', run: function* (g) { yield g.say('max', maxHint(g)); } },
      { id: 'how', icon: 'duck', text: 'Как дела, Макс?', run: function* (g) { const [w, t] = MAX_GAGS[g.count('maxgag') % MAX_GAGS.length]; yield g.say(w, t); } },
      { id: 'case', icon: 'badge', text: 'Что ты думаешь о нашем деле?', when: g => g.f.caseOpen, run: function* (g) {
        if (!g.f.tapeWatched) yield g.say('max', 'Сода-Попперы ведут себя как загипнотизированные зомби. А я знаю зомби! Я был зомби на Хеллоуин!');
        else if (!g.f.homeKnown) yield g.say('max', 'Брэди Калчер гипнотизирует людей кассетами. Это подло, Сэм. Я бы гипнотизировал кувалдой.');
        else yield g.say('max', 'Мы почти у цели! Злодей где-то за теми воротами. Я его чую.');
      } },
      { id: 'bye', icon: 'bye', text: 'Пошли, Макс.', end: true, say: true }
    ]
  };

  S.maxHint = maxHint;

  S.phone = function (g, text) {
    return g.say(null, text, { key: 'phone', color: COLORS.phone, x: 70, y: 110 });
  };

  S.readForm = function* (g) {
    const s = S.SYMPTOMS;
    yield g.say('sam', '«Заявление о приёме. Диагноз: искусственное расстройство личности. Пациент обязан проявлять все три симптома».');
    yield g.say('sam', '«Первый: ' + s.s1[g.f.sym1] + '. Второй: ' + s.s2[g.f.sym2] + '. Третий: ' + s.s3[g.f.sym3] + '».');
    yield g.say('sam', '«Требуется подпись лицензированного психиатрического специалиста». Хм.');
  };

  S.SYMPTOMS = {
    s1: { money: 'нездоровая одержимость деньгами', fame: 'нездоровая одержимость славой' },
    s2: { teeth: 'агрессия при упоминании стоматологии', hair: 'агрессия при упоминании парикмахерского дела' },
    s3: { mother: 'тайное желание жениться на собственной матери', peers: 'тайное желание увидеть, как стареют ровесники' }
  };

  S.newGame = function (g) {
    g.addActor('sam', { name: 'Сэм', color: COLORS.sam, speed: 62, stride: 34 });
    g.addActor('max', { name: 'Макс', color: COLORS.max, speed: 70, stride: 26, follow: 'sam' });
    g.addActor('jimmy', { name: 'Джимми Два Зуба', color: COLORS.jimmy, speed: 50, stride: 12, scale: 1.25 });
    g.addActor('bosco', { name: 'Боско', color: COLORS.bosco });
    g.addActor('sybil', { name: 'Сибил', color: COLORS.sybil, speed: 56, stride: 26 });
    g.addActor('specs', { name: 'Спекс', color: COLORS.specs, speed: 50, stride: 20 });
    g.addActor('whizzer', { name: 'Уиззер', color: COLORS.whizzer, speed: 50, stride: 20 });
    g.addActor('peepers', { name: 'Пиперс', color: COLORS.peepers, speed: 90, stride: 20 });
    g.addActor('brady', { name: 'Брэди Калчер', color: COLORS.brady, speed: 50, stride: 28 });
    g.addActor('monkey', { name: 'Обезьянка', color: COLORS.monkey });
    g.addActor('van', { name: 'Фургон', costume: 'van', color: C.grey[5] });
    g.addActor('dts', { name: 'Силуэт', costume: 'sybil', color: C.grey[5] });
    g.addActor('head', { name: 'Голова Макса', costume: 'max', color: COLORS.max });
    g.addActor('bmax', { name: 'Брэди-Макс', costume: 'bradymax', color: COLORS.brady });
    g.addActor('bulb', { name: 'Брэди-лампочка', costume: 'bulb', color: COLORS.brady });
    g.addActor('bcheese', { name: 'Брэди-сыр', costume: 'bradycheese', color: COLORS.brady });
    const r = g.rng;
    g.f.sym1 = r.next() < 0.5 ? 'money' : 'fame';
    g.f.sym2 = r.next() < 0.5 ? 'teeth' : 'hair';
    g.f.sym3 = r.next() < 0.5 ? 'mother' : 'peers';
    g.inv = ['max', 'gun'];
    g.place('sam', 'office', 150, 164, 's');
    g.place('max', 'office', 118, 168, 'e');
    g.place('jimmy', 'office', 211, 127, 'e');
    g.actors.jimmy.visible = false;
    g.place('specs', 'street', 318, 142, 'w');
    g.place('whizzer', 'bosco', 96, 160, 'e');
    g.place('peepers', 'sybil', 206, 146, 's');
    g.place('bosco', 'bosco', 250, 150, 's');
    g.place('sybil', 'sybil', 0, 0, 's');
    g.actors.sybil.visible = false;
    g.place('brady', 'studio', 160, 150, 's');
    g.place('monkey', 'homegate', 243, 118, 's');
    g.place('van', 'street', 604, 170, 'w');
    g.actors.peepers.v = 'wig';
    for (const id of ['specs', 'whizzer', 'peepers']) g.actors[id].hypno = true;
  };

  S.afterLoad = function (g) {
    const room = g.room;
    if (room && room.onLoad) room.onLoad(g);
  };

  S.ln = ln;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
