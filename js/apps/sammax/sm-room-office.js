(function (S) {
  'use strict';
  const { C, ROOMS, TALK } = S;

  function* ringPhone(g, times) {
    for (let i = 0; i < times; i++) { g.sfx('ring'); yield 1.1; }
  }

  function* intro(g) {
    g.hideUI = true;
    g.closeup = { kind: 'titlecard', t0: g.time, lines: ['SAM & MAX', 'ЭПИЗОД 101', 'КУЛЬТУРНЫЙ ШОК'] };
    g.music('title');
    yield g.fadeIn(1.2);
    yield 4.2;
    yield g.fadeOut(2);
    g.closeup = null;
    g.music('office');
    yield g.fadeIn(1.5);
    g.sfx('ring');
    yield 1.2;
    g.sfx('ring');
    yield g.say('sam', 'Макс, ты не видел телефон? Он звонит. Обычно это значит, что нам хотят дать работу.');
    g.sfx('ring');
    yield g.say('max', 'Последний раз я видел его у крысы. Думал, у вас роман.');
    g.face('sam', 'e');
    const j = g.actors.jimmy;
    j.visible = true; j.act = 'peek'; j.keepAct = true; j.x = 211; j.y = 128;
    g.sfx('squeak');
    yield 0.6;
    j.act = 'phone'; j.y = 131;
    yield g.say('jimmy', 'Алло? Не, они заняты. Чем-чем... ничем. Звоните в следующем веке.');
    g.sfx('hangup');
    yield g.say('sam', 'Джимми Два Зуба! Верни телефон.');
    yield g.say('jimmy', 'Был ваш, стал мой, начальник. Хотите обратно, несите сыр. Швейцарский.');
    yield g.say('jimmy', 'И чтоб с дырками. Без дырок я и мыло погрызть могу.');
    j.act = 'peek'; j.y = 128;
    yield 0.4;
    j.visible = false;
    g.sfx('squeak');
    yield g.say('max', 'Сэм, дай я его пристрелю! Я аккуратно. В тебя почти не попаду.');
    yield g.say('sam', 'Он в норе, Макс. Туда не прицелишься.');
    g.hideUI = false;
  }

  function* jimmyOutScene(g) {
    const j = g.actors.jimmy;
    g.drop('swiss');
    yield g.walkTo('sam', 200, 136);
    g.face('sam', 'n');
    yield g.anim('sam', 'reach', 0.6);
    g.f.cheeseAtHole = true;
    g.sfx('drop');
    yield g.walkTo('sam', 178, 142);
    g.face('sam', 'e');
    yield 0.8;
    j.visible = true; j.act = 'peek'; j.keepAct = true; j.x = 211; j.y = 128;
    g.sfx('squeak');
    yield 0.8;
    j.act = 'eat'; j.x = 214; j.y = 132; j.dir = 'w';
    g.f.cheeseAtHole = false;
    g.f.jimmyOut = true;
    yield g.say('jimmy', 'О-о-о! Швейцарский! Дырочка к дырочке!');
    yield g.say('sam', 'А теперь телефон, Джимми.');
    yield g.say('jimmy', 'Какой телефон? Мы про сыр договаривались, начальник. Про телефон разговора не было.');
    yield g.say('max', 'Сэм, он вылез! Снаружи его можно достать!');
  }

  function* dangleScene(g) {
    const j = g.actors.jimmy, max = g.actors.max;
    max.scripted = true;
    yield g.walkTo('max', 200, 136);
    g.face('max', 'e');
    yield g.say('max', 'Иди сюда, пушистый!');
    j.visible = false;
    g.sfx('squeak');
    yield g.say('jimmy', 'Эй! Лапы убери! Или что там у тебя!');
    yield g.walkTo('max', 136, 134);
    g.face('max', 'n');
    g.f.jimmyDangle = true;
    j.visible = true; j.act = ''; j.keepAct = true; j.dir = 'e'; j.upside = true; j.x = 124; j.y = 68; j.z = 200;
    max.act = 'reach'; max.keepAct = true;
    g.sfx('wind');
    yield g.say('jimmy', 'А-а-а! Высота! Я же от табуретки в обморок падаю!');
    yield g.say('max', 'Отдашь телефон? Или проверим, летают ли крысы?');
    yield g.say('jimmy', 'Отдам! Забирайте! Он всё равно трезвонит с утра до ночи!');
    j.visible = false; j.upside = false; j.z = 0;
    max.act = ''; max.keepAct = false;
    g.f.jimmyDangle = false;
    yield g.walkTo('max', 200, 136);
    g.sfx('squeak');
    j.x = 211; j.y = 128; j.act = 'peek'; j.visible = true;
    yield 0.4;
    j.visible = false;
    g.f.jimmyOut = false;
    g.f.phoneBack = true;
    g.sfx('drop');
    max.scripted = false;
    yield g.say('max', 'Телефон на столе! Крыса в норе! Все довольны, кроме крысы!');
    yield 0.5;
    yield* ringPhone(g, 2);
    yield g.walkTo('sam', 104, 150);
    g.face('sam', 'w');
    yield g.anim('sam', 'phone', 0.1);
    g.actors.sam.act = 'phone'; g.actors.sam.keepAct = true;
    g.f.onPhone = true;
    yield g.say('sam', 'Вольная полиция. Сэм слушает.');
    yield S.phone(g, 'Сэм, это Комиссар. Я третий час не могу до вас дозвониться.');
    yield g.say('sam', 'У нас была ситуация с заложником, Комиссар. Заложником был телефон.');
    yield S.phone(g, 'Меня это не интересует. У вас в квартале бесчинствуют Сода-Попперы.');
    yield g.talkTo('commish');
  }

  TALK.commish = {
    options: [
      { id: 'who', icon: 'q', text: 'Сода-Попперы? Детская группа из восьмидесятых?', run: function* (g) {
        yield S.phone(g, 'Они самые. «Газировка, газировка, лопни пузырёк». Только уже взрослые.');
        yield S.phone(g, 'Рисуют на стенах, воруют в магазине на углу, заняли кабинет психотерапевта. Вчера пели под окнами мэрии. Фальшиво.');
      } },
      { id: 'what', icon: 'ex', text: 'Что конкретно вы от нас хотите?', run: function* (g) {
        yield S.phone(g, 'Прекратите это безобразие. Желательно без жертв.');
        yield g.say('sam', 'А если без жертв не получится?');
        yield S.phone(g, 'Тогда хотя бы без свидетелей.');
      } },
      { id: 'force', icon: 'f:max', text: 'Можно применять чрезмерную силу?', speaker: 'max', run: function* (g) {
        yield S.phone(g, 'Макс, иначе я позвонил бы в обычную полицию.');
        yield g.say('max', 'Обожаю этого парня!');
      } },
      { id: 'rat', icon: 'f:jimmy', text: 'Комиссар, у нас в офисе живёт крыса.', once: true, run: function* (g) {
        yield S.phone(g, 'У меня тоже, Сэм. Сидит в отделе кадров.');
      } },
      { id: 'bye', icon: 'bye', text: 'Мы выезжаем, Комиссар.', end: true, run: function* (g) {
        yield S.phone(g, 'И Сэм... постарайтесь не взорвать квартал. Опять.');
        g.sfx('hangup');
        const sam = g.actors.sam;
        sam.act = ''; sam.keepAct = false;
        g.f.onPhone = false;
        g.f.caseOpen = true;
        yield g.say('sam', 'Собирайся, Макс. У нас дело.');
        yield g.say('max', 'Дело! Чур, я за рулём!');
        yield g.say('sam', 'Нет.');
      } }
    ]
  };

  TALK.jimmy = {
    options: [
      { id: 'phone', icon: 'q', text: 'Отдай телефон, Джимми.', when: g => !g.f.phoneBack, run: function* (g) {
        yield g.say('jimmy', g.f.jimmyOut ? 'Сыр взял, телефон оставил. Бизнес, начальник.' : 'Сначала сыр, начальник. Швейцарский, с дырками. Потом поговорим.');
      } },
      { id: 'why', icon: 'duck', text: 'Зачем крысе телефон?', once: true, run: function* (g) {
        yield g.say('jimmy', 'Маме звоню. Она в Бронксе живёт, в стене пиццерии.');
        yield g.say('sam', 'Так вот откуда в счёте сорок долларов.');
      } },
      { id: 'police', icon: 'ex', text: 'Мы полиция! Отдай телефон, или...', when: g => !g.f.phoneBack, run: function* (g) {
        yield g.say('jimmy', 'Или что? Без бумажки от Комиссара вы меня даже арестовать не можете.');
      } },
      { id: 'fear', icon: 'f:max', text: 'Ты хоть чего-нибудь боишься, Джимми?', run: function* (g) {
        yield g.say('jimmy', 'Я? Ничего. Ну, высоты. И кошек. Кошек на высоте особенно.');
        g.f.knowHeights = true;
        yield g.say('max', 'Высоты, значит.');
      } },
      { id: 'eyebo', icon: 'tv', text: 'Что ты видел по телевизору, Джимми?', when: g => g.f.tapeWatched, once: true, run: function* (g) {
        yield g.say('jimmy', 'Глаз. Здоровый такой. Смотрел на меня. Очнулся в шкафу, весь в сыре.');
        yield g.say('jimmy', 'Лучший вечер за год.');
      } },
      { id: 'thanks', icon: 'duck', text: 'Спасибо за телефон, Джимми.', when: g => g.f.phoneBack, once: true, run: function* (g) {
        yield g.say('jimmy', 'Да на здоровье. Мама всё равно трубку не берёт.');
      } },
      { id: 'bye', icon: 'bye', text: 'Сиди в своей норе.', end: true, run: function* (g) {
        yield g.say('jimmy', 'Сижу. И плачу за неё меньше вашего.');
        if (!g.f.jimmyOut) g.actors.jimmy.visible = false;
      } }
    ]
  };

  function* eyeboTape(g) {
    g.drop('tape');
    yield g.anim('sam', 'reach', 0.6);
    g.sfx('vcr');
    g.f.tapeInVcr = true;
    yield g.say('sam', 'Посмотрим, что там за аэробика для глаз.');
    g.closeup = { kind: 'tv', prog: 'eyebo', t0: g.time };
    g.music('hypno');
    g.fx.hypno = 1;
    yield g.say(null, 'Привет, друзья! Я Брэди Калчер. Смотрите мне в глаза...', { key: 'tv', color: S.COLORS.brady, x: 160, y: 199 });
    yield g.say(null, 'Глазам тоже нужна зарядка. Вдох... Смотрим налево... Направо... Мне в глаза...', { key: 'tv', color: S.COLORS.brady, x: 160, y: 199 });
    yield g.say(null, 'Вы расслаблены. Вы счастливы. Вы хотите купить ещё одну кассету «Ай-Бо». И ещё одну...', { key: 'tv', color: S.COLORS.brady, x: 160, y: 199 });
    g.closeup = null;
    for (const id of ['sam', 'max']) g.actors[id].hypno = true;
    g.actors.jimmy.visible = true; g.actors.jimmy.act = 'peek'; g.actors.jimmy.hypno = true; g.actors.jimmy.keepAct = true; g.actors.jimmy.x = 211; g.actors.jimmy.y = 128;
    yield 1.5;
    yield g.say('sam', 'Ещё... одну... кассету...');
    yield g.say('max', 'Сэм... мне... хочется...');
    yield g.say('max', '...ПОПКОРНА!');
    g.actors.max.hypno = false;
    g.fx.hypno = 0;
    g.sfx('pop');
    yield g.say('sam', 'Попкорн... Да. Попкорн.');
    g.actors.sam.hypno = false;
    g.music('office');
    yield g.say('sam', 'Макс. По-моему, эта кассета нас гипнотизировала.');
    yield g.say('max', 'Или продавала диету.');
    yield g.say('sam', 'Спорю, так Сода-Попперов и превратили в зомби с баллончиками.');
    const j = g.actors.jimmy;
    j.act = ''; j.x = 214; j.y = 131; j.dir = 'w';
    yield g.say('jimmy', 'Ай-Бо... Ай-Бо... Хочу... ещё... кассету...');
    yield g.say('max', 'Сэм, крыса сломалась.');
    j.hypno = false;
    yield g.say('jimmy', 'Ой. Я чего, опять телик смотрел?');
    j.act = 'peek'; j.y = 128;
    yield 0.3;
    j.visible = false; j.keepAct = false;
    g.f.tapeWatched = true;
    g.f.knowHypno = true;
    yield g.say('sam', 'Выну-ка я эту кассету. А потом посмотрим обычные каналы, вдруг там говорят про Сода-Попперов.');
  }

  const TV_PROGS = ['news', 'specs', 'whizzer', 'peepers', 'brady'];

  function* watchTv(g) {
    if (g.f.tapeInVcr) { yield g.say('sam', 'Сначала выну кассету. Мне одного сеанса хватило.'); return; }
    if (!g.f.tapeWatched) {
      const n = g.count('tvgag');
      const gags = ['По всем каналам показывают, как другие люди работают. Выключаю, пока не расстроился.', 'Реклама, реклама, сериал про адвокатов и снова реклама. Выключаю.', 'Прогноз погоды: на город надвигается облачность и лёгкая паранойя.'];
      yield g.anim('sam', 'reach', 0.4);
      g.sfx('tvon');
      yield g.say('sam', gags[(n - 1) % gags.length]);
      return;
    }
    const i = g.f.tvSeg || 0;
    yield g.anim('sam', 'reach', 0.4);
    g.sfx('tvon');
    if (i >= TV_PROGS.length) {
      g.closeup = { kind: 'tv', prog: 'rerun', t0: g.time };
      yield g.say(null, 'Повтор! «Сода-Попперы», серия сорок семь: «Кто разлил газировку?»', { key: 'tv', color: S.COLORS.tv, x: 160, y: 199 });
      g.closeup = null;
      yield g.say('sam', 'Повтор. Эту серию мы уже видели.');
      return;
    }
    const prog = TV_PROGS[i];
    g.closeup = { kind: 'tv', prog, t0: g.time };
    const tv = (t, col) => g.say(null, t, { key: 'tv', color: col || S.COLORS.tv, x: 160, y: 199 });
    if (prog === 'news') {
      yield tv('Новости района. Бывшие звёзды детского шоу «Сода-Попперы» снова попали в сводки.');
      yield tv('Граффити, мелкие кражи, захват кабинета психотерапии. Соседи в ужасе. Продавцы газировки довольны.');
      yield tv('Архивные кадры: Спекс, Уиззер и Пиперс, тысяча девятьсот восемьдесят второй год.');
    } else if (prog === 'specs') {
      yield tv('Спекс был в группе умником и художником. Плакаты в каждой серии рисовал он.', S.COLORS.tv);
      yield tv('Не трогайте мои рисунки! Кто испортит, будет перерисовывать со мной до утра!', S.COLORS.specs);
      yield tv('Выше очков Спекс не видел ничего. Декорации падали ему на голову шесть сезонов подряд.');
    } else if (prog === 'whizzer') {
      yield tv('Уиззер. Душа компании, мочевой пузырь размером с напёрсток.');
      yield tv('Мне надо в туалет! Мне срочно надо в туалет! Держите мою корзинку!', S.COLORS.whizzer);
      yield tv('Эту фразу Уиззер говорил в каждой серии. Иногда дважды.');
    } else if (prog === 'peepers') {
      yield tv('Пиперс, самый быстрый ребёнок на телевидении. Хулиганы гонялись за ним в каждой серии и ни разу не догнали.');
      yield tv('Меня не догнать! Только не режьте лук, я от него реву и ничего не вижу!', S.COLORS.peepers);
      yield tv('Говорят, до сих пор никто не видел Пиперса стоящим на месте. Кроме его окулиста.');
    } else if (prog === 'brady') {
      yield tv('А Брэди Калчер, «ребёнок-звезда, который так и не стал звездой»?');
      yield tv('В восемьдесят первом он провалил пробы в «Сода-Попперы». Его лицо сочли «слишком честным для телевидения».');
      yield tv('Сегодня Брэди учит людей самопомощи, продаёт видеокурс «Ай-Бо» и держит Приют для бывших детских звёзд. Адрес приюта он не называет.');
      yield tv('Главное, смотреть мне в глаза. Всегда. Смотреть. Мне. В глаза.', S.COLORS.brady);
    }
    g.closeup = null;
    g.f.tvSeg = i + 1;
    if (prog === 'specs') yield g.say('sam', 'Спекс бесится, когда трогают его рисунки. И никогда не смотрит вверх.');
    if (prog === 'whizzer') yield g.say('max', 'Я Уиззера понимаю. Мне тоже всегда надо, когда туалет занят.');
    if (prog === 'peepers') yield g.say('sam', 'Бегает он быстро. Но вслепую далеко не убежит.');
    if (prog === 'brady') {
      g.f.tvDone = true;
      yield g.say('sam', 'Брэди провалил пробы в «Сода-Попперы», а теперь Попперы рисуют ему рекламу на стенах. Дело пахнет мелкой местью, Макс.');
      yield g.say('max', 'И лаком для волос!');
    }
  }

  function* dropBall(g) {
    if (!g.f.graffitiRuined || g.f.specsCured) { yield g.say('sam', 'Внизу пусто. Не стану разбивать хороший шар о тротуар.'); return; }
    if (!g.f.knowCure && !g.f.whizzerCured) { yield g.say('sam', 'Без медицинских показаний я шары на прохожих не роняю.'); return; }
    yield g.anim('sam', 'throw', 0.6);
    g.drop('ball');
    g.sfx('whoosh');
    yield g.say('sam', 'Бомбы пошли!');
    const back = g.saveSpot();
    g.setRoom('street');
    g.camLock = 60;
    g.centerCam(true);
    const sp = g.actors.specs;
    sp.act = 'spray'; sp.keepAct = true;
    g.f.ballFalling = g.time;
    yield 1.0;
    g.f.ballFalling = 0;
    g.sfx('bonk');
    g.fx.shake = 0.6;
    sp.act = 'ko'; sp.keepAct = true;
    yield 1.4;
    yield g.say('specs', 'Ой... Мама, я больше не буду рисовать на обоях...');
    sp.act = ''; sp.keepAct = false; sp.hypno = false;
    yield g.say('specs', 'Где я? Откуда у меня баллончик? И что за колпак?');
    g.f.specsCured = true;
    yield 0.5;
    yield* g.goRoom('office', back);
    yield g.say('max', 'В яблочко! Точнее, в Спекса!');
    yield g.say('sam', 'Спустимся к нему. Посмотрим, что от него осталось.');
    yield* S.checkCures(g);
  }

  ROOMS.office = {
    id: 'office', name: 'Офис Сэма и Макса', w: 320, music: g => g.f.samHypno ? 'hypno' : 'office',
    paint: (b) => S.BG.office(b, {}),
    walk: [[40, 132, 258, 132, 316, 162, 316, 198, 4, 198, 4, 156, 36, 134]],
    block: [[0, 152, 96, 147, 112, 158, 112, 200, 0, 200]],
    layers: [
      { id: 'glove', x: 108, y: 84, when: g => !g.f.gloveTaken },
      { id: 'ball', x: 82, y: 114, base: 131, when: g => !g.f.ballTaken },
      { id: 'hanger', x: 13, y: 54, when: g => !g.f.hangerTaken },
      { id: 'closetOpen', x: 222, y: 38, when: g => g.f.closetOpen },
      { id: 'cheese', x: 226, y: 96, when: g => g.f.closetOpen, key: g => g.f.cheeseShot ? 'h' : '' },
      { id: 'desk', x: 0, y: 138, base: 176 },
      { id: 'phone', x: 46, y: 142, base: 177, when: g => g.f.phoneBack }
    ],
    sprites(g) {
      const out = [];
      if (g.f.cheeseAtHole || g.f.jimmyOut) out.push({ y: 133, draw: (f, cx) => { const ic = S.icon('swiss'); S.blit(f, ic, 212 - cx - (g.f.jimmyOut ? 12 : 0), 122); } });
      return out;
    },
    drawBack(f, g, cx) {
      if (g.f.tvOn) {
        for (let y = 63; y < 84; y++) for (let x = 176; x < 205; x++) f.set(x - cx, y, S.hash(x, y, Math.floor(g.time * 20)) > 0.5 ? C.grey[4] : C.grey[1]);
      }
    },
    hot: [
      { id: 'edoor', name: 'Дверь на улицу', poly: [276, 32, 306, 23, 306, 170, 276, 142], walk: [284, 162], face: 'e', exit: function* (g) {
        if (!g.f.caseOpen) {
          yield g.say('sam', 'Никуда не пойдём, пока телефон у крысы. Дело принципа.');
          if (!g.f.phoneBack) yield g.say('max', 'И сыра!');
          return;
        }
        g.sfx('door');
        yield* g.goRoom('street', { x: 300, y: 146, dir: 's' });
      }, look: 'Наша дверь. Изнутри надпись на стекле читается как «XAM & MAS».' },
      { id: 'switch', name: 'Выключатель', rect: [266, 73, 9, 14], walk: [262, 142], face: 'e', look: 'Выключатель.', use: function* (g) {
        yield g.anim('sam', 'reach', 0.3);
        g.sfx('click');
        g.fx.dark = !g.fx.dark;
        if (g.fx.dark) {
          yield g.say('sam', 'Жутковато.');
          yield g.say('max', 'Давай так и оставим! Будем пугать клиентов!');
          yield g.say('sam', 'У нас нет клиентов, Макс.');
          yield g.say('max', 'Вот! Уже работает!');
        } else yield g.say('sam', 'Так лучше.');
      } },
      { id: 'closet', name: 'Шкаф', poly: [224, 42, 260, 40, 260, 128, 224, 128], walk: [240, 136], face: 'n', look: g => g.f.closetOpen ? 'Шкаф, доверху забитый сыром Макса.' : 'Шкаф. Туда мы убираем всё, на что не хотим смотреть.', use: function* (g) {
        yield g.anim('sam', 'reach', 0.4);
        g.sfx('door');
        g.f.closetOpen = !g.f.closetOpen;
        if (g.f.closetOpen && !g.seen.cheeseSeen) {
          g.seen.cheeseSeen = 1;
          yield g.say('sam', 'Макс, почему в нашем шкафу гора сыра?');
          yield g.say('max', 'Это мои сбережения. На чёрный день.');
        }
      } },
      { id: 'cheesepile', name: g => g.f.cheeseShot ? 'Гора швейцарского сыра' : 'Гора сыра', rect: [226, 96, 34, 30], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: g => g.f.cheeseShot ? 'Гора сыра, теперь с дырками. Калибр солидный.' : 'Гора сыра. Чеддер, гауда и что-то рыжее и подозрительное. Ни одной дырки.',
        use: function* (g) {
          if (!g.f.cheeseShot) { yield g.say('sam', 'Джимми нужен швейцарский. В этом сыре ни одной дырки.'); return; }
          if (g.has('swiss')) { yield g.say('sam', 'Одного куска хватит.'); return; }
          yield g.anim('sam', 'reach', 0.5);
          g.give('swiss');
          yield g.say('sam', 'Беру кусок. Сыр собственного производства.');
        },
        items: {
          gun: function* (g) {
            if (g.f.cheeseShot) { yield g.say('sam', 'Ещё пара выстрелов, и сыра не останется.'); return; }
            yield g.anim('sam', 'shoot', 0.3);
            for (let i = 0; i < 3; i++) { g.sfx('gun'); g.fx.flash = 0.35; g.actors.sam.act = 'shoot'; yield 0.35; }
            g.actors.sam.act = '';
            g.f.cheeseShot = true;
            yield g.say('sam', 'Вот и швейцарский.');
            yield g.say('max', 'Сэм, ты художник!');
          },
          max: function* (g) { yield g.say('max', 'Могу прогрызть дырки. Только сыра потом не будет.'); }
        } },
      { id: 'hole', name: 'Крысиная нора', rect: [203, 114, 16, 15], walk: [204, 138], face: 'n',
        look: 'Нора Джимми Два Зуба. Живёт у нас бесплатно.',
        use: 'Я туда даже нос не просуну.',
        talk: function* (g) {
          const j = g.actors.jimmy;
          if (!g.f.jimmyOut) { j.visible = true; j.act = 'peek'; j.keepAct = true; j.x = 211; j.y = 128; j.dir = 'w'; }
          yield g.say('sam', 'Джимми! Выходи, поговорим.');
          yield g.say('jimmy', g.f.phoneBack ? 'Чего ещё? Телефон я отдал.' : 'Поговорить можно. Вылезу, когда увижу сыр.');
          yield g.talkTo('jimmy');
        },
        items: {
          swiss: function* (g) {
            if (g.f.phoneBack) { yield g.say('sam', 'Джимми больше не нужен сыр. А мне больше не нужен Джимми.'); return; }
            yield* jimmyOutScene(g);
          },
          cheese: 'Этот сыр не швейцарский. Джимми сноб.',
          max: function* (g) { yield g.say('max', 'Не пролезу. Проверял.'); },
          gun: 'Если выстрелю в нору, телефону конец. Крысе, может, тоже, но телефон жалко.'
        } },
      { id: 'window', name: 'Окно', poly: [100, 30, 164, 28, 164, 96, 100, 98], walk: [134, 134], face: 'n',
        look: g => (g.f.graffitiRuined && !g.f.specsCured) ? 'Спекс перерисовывает свою картинку прямо под нашим окном.' : 'Видно улицу, лавку Боско и наш Де Сото. Голуби его любят. Слишком.',
        use: 'Окно не открывается с тех пор, как Макс заклеил его жвачкой. Но форточка работает.',
        items: {
          ball: function* (g) { yield* dropBall(g); },
          max: function* (g) { yield g.say('max', 'Хочешь, выпрыгну? Со второго этажа не больно. Почти.'); yield g.say('sam', 'Потом, Макс.'); },
          gun: 'Из окна по улице? Нас и так соседи не любят.'
        } },
      { id: 'glove', name: 'Боксёрская перчатка', rect: [108, 84, 24, 14], when: g => !g.f.gloveTaken, walk: [122, 134], face: 'n',
        look: 'Боксёрская перчатка Макса. Лежит на подоконнике с тех пор, как он бросил бокс.',
        use: function* (g) {
          yield g.anim('sam', 'reach', 0.5);
          g.f.gloveTaken = true; g.give('glove');
          yield g.say('max', 'Моя перчатка! Двенадцать сломанных носов, и ни одного моего!');
        } },
      { id: 'cabinet', name: 'Картотека', poly: [40, 62, 90, 58, 90, 124, 41, 129], walk: [66, 136], face: 'n',
        look: 'Картотека. Раскрытые дела в верхнем ящике, нераскрытые в нижнем. Нижний не закрывается.',
        use: 'Старые дела. Ничего полезного.' },
      { id: 'ball', name: 'Шар для боулинга', rect: [82, 114, 18, 18], when: g => !g.f.ballTaken, walk: [100, 138], face: 'w',
        look: 'Шар для боулинга. Служит нам пресс-папье, а иногда аргументом.',
        use: function* (g) {
          yield g.anim('sam', 'reach', 0.5);
          g.f.ballTaken = true; g.give('ball');
          yield g.say('sam', 'Беру. Шар всегда пригождается.');
        } },
      { id: 'tv', name: 'Телевизор', poly: [172, 60, 212, 58, 213, 87, 172, 88], walk: [192, 136], face: 'n',
        look: 'Телевизор. Двенадцать каналов, на одиннадцати реклама.',
        use: function* (g) { yield* watchTv(g); },
        items: { gun: 'Я ещё не досмотрел сериал про адвокатов.', tape: 'Кассета идёт в видеомагнитофон. Он под телевизором.' } },
      { id: 'vcr', name: 'Видеомагнитофон', rect: [177, 88, 31, 10], walk: [192, 136], face: 'n',
        look: g => g.f.tapeInVcr ? 'В видеомагнитофоне кассета «Ай-Бо». Второй раз смотреть не хочу.' : 'Видеомагнитофон. Мигает «00:00» с тысяча девятьсот восемьдесят девятого года.',
        use: function* (g) {
          if (!g.f.tapeInVcr) { yield g.say('sam', 'Кассеты нет. Пусть мигает дальше.'); return; }
          yield g.anim('sam', 'reach', 0.5);
          g.sfx('vcr');
          g.f.tapeInVcr = false;
          g.give('tape');
          yield g.say('sam', 'Вынул. Кажется, я всё ещё я.');
        },
        items: { tape: function* (g) { yield* eyeboTape(g); } } },
      { id: 'crate', name: 'Ящик', rect: [176, 99, 33, 30], walk: [192, 138], face: 'n', look: 'Ящик с надписью «FRAGILE». Внутри то, что мы разбили, пока несли его наверх.', use: 'Осколки. Что это было, уже не узнать.' },
      { id: 'rack', name: g => g.f.hangerTaken ? 'Вешалка' : 'Вешалка с плечиками', rect: [10, 50, 22, 78], walk: [42, 146], face: 'w',
        look: g => g.f.hangerTaken ? 'Пустая вешалка.' : 'Вешалка с плечиками. Вешать нам нечего: Макс не носит одежду, а я ношу свою всю сразу.',
        use: function* (g) {
          if (g.f.hangerTaken) { yield g.say('sam', 'Больше там ничего нет.'); return; }
          yield g.anim('sam', 'reach', 0.5);
          g.f.hangerTaken = true; g.give('hanger');
          yield g.say('sam', 'Возьму плечики. Вдруг придётся вскрыть машину.');
        } },
      { id: 'picture', name: 'Картина', rect: [43, 17, 39, 33], walk: [62, 136], face: 'n', look: 'Картина «Собаки играют в покер». Одна из собак мухлюет. И это не я.', use: 'Сколько её ни поправляй, всё равно висит криво.' },
      { id: 'bulb', name: 'Лампочка', rect: [144, 0, 12, 19], look: 'Лампочка на сорок ватт. На большее у нас нет денег.', use: 'Не дотянусь. А Макс дотянется, но съест.' },
      { id: 'desk', name: 'Стол', poly: [0, 156, 92, 150, 108, 158, 108, 200, 0, 200], walk: [118, 164], face: 'w',
        look: g => g.f.phoneBack ? 'Мой стол. Кружка, лампа, бумаги и телефон, снова на месте.' : 'Мой стол. Кружка, лампа, бумаги. Телефона нет.',
        use: 'В ящиках старые рапорты, жвачка Макса и бутерброд времён Никсона.' },
      { id: 'phone', name: 'Телефон', rect: [44, 140, 26, 16], when: g => g.f.phoneBack, walk: [118, 160], face: 'w', over: true,
        look: 'Наш телефон. Трубка немного погрызена.',
        use: 'Звонить некому. Комиссар сам позвонит, когда захочет испортить нам день.' }
    ],
    actors: {
      jimmy: {
        name: 'Джимми Два Зуба', walk: [196, 138], face: 'e',
        when: g => g.actors.jimmy.visible && !g.f.jimmyDangle,
        look: 'Джимми Два Зуба. Всё, что в офисе плохо лежит, рано или поздно оказывается у него.',
        talk: function* (g) { yield g.say('sam', 'Джимми.'); yield g.say('jimmy', 'Начальник.'); yield g.talkTo('jimmy'); },
        use: 'Я не буду трогать эту крысу. У меня нет прививки, а у неё нет совести.',
        items: {
          max: function* (g) {
            if (!g.f.jimmyOut) { yield g.say('max', 'Он в норе! Сначала выманим.'); return; }
            yield* dangleScene(g);
          },
          gun: 'Застрелю его, и телефон останется в норе навсегда.',
          swiss: 'Ему хватит и одного куска.'
        }
      }
    },
    setup(g) {
      const j = g.actors.jimmy;
      if (!g.f.jimmyOut) { j.visible = false; j.act = 'peek'; j.keepAct = true; j.x = 211; j.y = 128; }
      g.fx.dark = false;
    },
    onLoad(g) { ROOMS.office.setup(g); }
  };

  S.office = { intro, ringPhone };

  S.startNewGame = function (g) {
    S.newGame(g);
    g.setRoom('office');
    g.fade = 1; g.fadeTo = 1;
    g.run(intro, { name: 'intro' });
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
