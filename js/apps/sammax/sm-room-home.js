(function (S) {
  'use strict';
  const { C, ROOMS, TALK } = S;
  const POPS = ['specs', 'whizzer', 'peepers'];
  const monkeySay = (g, t) => g.say('monkey', t);

  function* readerScene(g, signed) {
    yield g.walkTo('sam', 140, 158);
    g.face('sam', 'n');
    yield g.anim('sam', 'reach', 0.5);
    g.sfx('type');
    yield 0.6;
    const m = g.actors.monkey;
    m.act = 'clap'; m.keepAct = true;
    g.sfx('cymbal');
    if (!signed) {
      g.sfx('buzzer');
      yield monkeySay(g, 'ДЗЫНЬ! ОТКАЗАНО! ТРЕБУЕТСЯ ПОДПИСЬ ЛИЦЕНЗИРОВАННОГО ПСИХИАТРИЧЕСКОГО СПЕЦИАЛИСТА! ДЗЫНЬ!');
      m.act = ''; m.keepAct = false;
      yield g.say('sam', 'Бланк вернули. Обезьяна строже, чем налоговая.');
      yield g.say('max', 'Сэм, у нас же есть знакомый психиатр! Почти.');
      return;
    }
    g.sfx('ding');
    yield monkeySay(g, 'ДЗЫНЬ! ОДОБРЕНО! ДОБРО ПОЖАЛОВАТЬ, ПАЦИЕНТ! ПРИЯТНОГО ЛЕЧЕНИЯ! ДЗЫНЬ!');
    m.act = ''; m.keepAct = false;
    g.drop('formok');
    g.f.gateOpen = true;
    g.sfx('gate');
    yield 1.0;
    yield g.say('max', 'Нас пустили! Нас признали сумасшедшими! Лучший день в моей жизни!');
    yield* enterStudio(g);
  }

  function* enterStudio(g) {
    if (g.f.samCured) {
      if (!g.has('helmet')) {
        yield g.say('sam', 'Без защиты не пойду. Второй раз развозить кассеты я не хочу.');
        yield g.say('sam', 'Нужно что-то от гипноза. Спрошу Боско или Сибил.');
        return;
      }
      yield g.walkTo('sam', 244, 156);
      g.face('sam', 'n');
      yield* g.goRoom('studio', { x: 44, y: 172, dir: 'e' });
      yield* finaleStart(g);
      return;
    }
    yield g.walkTo('sam', 244, 156);
    g.face('sam', 'n');
    yield* g.goRoom('studio', { x: 44, y: 172, dir: 'e' });
    yield* firstVisit(g);
  }

  function placePops(g, hyp) {
    const pos = [[112, 170, 'w'], [146, 172, 'w'], [180, 170, 'w']];
    POPS.forEach((id, i) => {
      const a = g.actors[id];
      g.place(id, 'studio', pos[i][0], pos[i][1], pos[i][2]);
      a.visible = true; a.hypno = hyp; a.act = ''; a.keepAct = false; a.v = id === 'whizzer' ? 'nobasket' : ''; a.scripted = false;
    });
  }

  function* firstVisit(g) {
    const br = g.actors.brady, max = g.actors.max, sam = g.actors.sam;
    g.place('brady', 'studio', 160, 126, 's');
    br.visible = true; br.act = 'arms'; br.keepAct = true;
    placePops(g, true);
    yield g.say('brady', 'Добро пожаловать в Приют! Новый пациент! Я Брэди Калчер. А вы, должно быть, Сэм. И... кролик.');
    yield g.say('sam', 'Мы по объявлению. У меня искусственное расстройство личности. Есть справка.');
    yield g.say('brady', 'Прекрасно! Здесь вы найдёте то, чего вам не хватало всю жизнь. Меня.');
    yield g.say('max', 'Сэм! Это же Попперы! Они снова зомби!');
    yield g.say('brady', 'Мальчики пришли сами. Требовали гонорар за старое шоу. Я заплатил свежей порцией «Ай-Бо».');
    yield g.say('brady', 'Гипнотрон, включить!');
    br.act = 'hypno';
    g.f.tronOn = true; g.fx.hypno = 1;
    g.sfx('hypno'); g.music('hypno');
    yield 1.4;
    sam.hypno = true;
    yield g.say('sam', 'Я... смотрю... в глаза...');
    yield g.say('max', 'Сэм? Сэм! Ты чего уставился? Там еду показывают?');
    yield g.say('brady', 'Кролик не поддаётся? Мальчики, взять его! Он будет звездой моего нового шоу!');
    max.scripted = true; max.follow = null;
    for (const id of POPS) g.walkTo(id, 70 + POPS.indexOf(id) * 8, 172);
    yield g.say('max', 'Эй! Пустите! Я кусаюсь! Я очень больно кусаюсь!');
    g.sfx('punch'); g.fx.shake = 0.5;
    g.place('max', 'studio', 224, 132, 's');
    g.f.maxStrapped = true;
    max.hypno = true;
    g.f.maxAway = true;
    g.drop('max');
    placePops(g, true);
    yield g.say('max', 'Смотрю... в глаза... Хочу... кассету...');
    yield g.say('brady', 'Сэм, друг мой. Теперь ты развозишь мои кассеты. Начни с лавки на углу.');
    yield g.say('sam', 'Развозить кассеты. Это моя радость. Это моя цель.');
    g.f.samHypno = true;
    g.f.tronOn = false; g.fx.hypno = 0;
    br.act = ''; br.keepAct = false;
    g.give('tapes');
    yield* g.goRoom('street', { x: 300, y: 150, dir: 's' }, { fade: 1 });
    yield g.say('sam', 'Кассеты. Лавка на углу. Доставка. Радость.');
  }

  function* finaleStart(g) {
    const br = g.actors.brady, sam = g.actors.sam;
    sam.helmet = true;
    g.place('brady', 'studio', 160, 126, 's');
    br.visible = true; br.act = 'arms'; br.keepAct = true;
    placePops(g, true);
    g.f.maxStrapped = true;
    yield g.say('sam', 'Надеваю шлем. Выгляжу как дуршлаг с амбициями.');
    yield g.say('brady', 'Снова ты?! Ты должен развозить кассеты! Гипнотрон, полная мощность!');
    br.act = 'hypno';
    g.f.tronOn = true; g.fx.hypno = 1;
    g.sfx('hypno');
    yield 1.0;
    g.sfx('zap'); g.fx.flash = 0.4;
    yield g.say('sam', 'Щекотно.');
    yield g.say('brady', 'Что?! Шлем из дуршлага?! Попперы! Взять его! Сорвать с него эту кастрюлю!');
    for (const id of POPS) { const a = g.actors[id]; a.act = 'attack'; a.keepAct = true; }
    g.sfx('zap');
    yield g.say('sam', 'Антенна трещит на их волне. Боско говорил, что она ещё и передаёт...');
    yield g.say('brady', 'В будку! Никто не тронет Брэди Калчера за бронестеклом!');
    br.act = ''; br.keepAct = false;
    yield g.walkTo('brady', 276, 138);
    g.face('brady', 'w');
    g.f.finale = true;
    g.f.bradyOut = false; g.f.popBrady = false;
    for (const id of POPS) { const a = g.actors[id]; a.act = ''; a.keepAct = false; }
    g.music('finale');
    yield g.say('sam', 'Надо поговорить с Попперами. Точнее, отдать им приказ.');
  }

  const VERBS = {
    worship: { icon: 'pray', text: 'Поклоняйтесь...', say: 'Поклоняйтесь ', obj: { brady: 'Брэди Калчеру', me: 'мне', max: 'Максу', each: 'друг другу' } },
    become: { icon: 'mask', text: 'Станьте...', say: 'Станьте ', obj: { brady: 'Брэди Калчером', me: 'мной', max: 'Максом', each: 'друг другом' } },
    attack: { icon: 'fist', text: 'Атакуйте...', say: 'Атакуйте ', obj: { brady: 'Брэди Калчера', me: 'меня', max: 'Макса', each: 'друг друга' } },
    dance: { icon: 'note', text: 'Танцуйте!', say: 'Танцуйте!' },
    sleep: { icon: 'zzz', text: 'Спите!', say: 'Спите!' }
  };
  const OBJ_ICON = { brady: 'f:brady', me: 'f:sam', max: 'f:max', each: 'f:poppers' };

  TALK.cmd = {
    options: (g, d) => {
      if (!d.data.verb) {
        return Object.entries(VERBS).map(([id, v]) => ({
          id, icon: v.icon, text: v.text, say: false,
          run: function* (gg) {
            if (!v.obj) { yield gg.say('sam', v.say); yield* command(gg, id, null); return; }
            d.data.verb = id;
          }
        })).concat([{ id: 'bye', icon: 'bye', text: 'Подумаю ещё.', end: true, say: false }]);
      }
      const v = VERBS[d.data.verb];
      return Object.entries(v.obj).map(([id, word]) => ({
        id, icon: OBJ_ICON[id], text: v.say + word + '!', say: false,
        run: function* (gg) {
          d.data.verb = null;
          yield gg.say('sam', v.say + word + '!');
          yield* command(gg, Object.keys(VERBS).find(k => VERBS[k] === v), id);
        }
      })).concat([{ id: 'back', icon: 'bye', text: 'Назад', say: false, run: function* () { d.data.verb = null; } }]);
    }
  };

  function popsAct(g, act, keep) { for (const id of POPS) { const a = g.actors[id]; a.act = act; a.keepAct = !!keep; } }
  const chorus = (g, t) => g.say('specs', t);

  function* resetPops(g) {
    for (const id of POPS) { const a = g.actors[id]; a.act = ''; a.keepAct = false; a.v = id === 'whizzer' ? 'nobasket' : ''; }
  }

  function* command(g, verb, obj) {
    const f = g.f;
    g.sfx('zap');
    const br = g.actors.brady;
    if (verb === 'worship' && obj === 'brady') {
      popsAct(g, 'worship', true);
      yield chorus(g, 'О великий Брэди! Самый честный из детских звёзд! Самый сияющий!');
      if (!f.bradyOut) {
        yield g.say('brady', 'Да... Да! Обожайте меня! Громче! Погодите, отсюда плохо слышно...');
        yield g.walkTo('brady', 160, 128);
        g.face('brady', 's');
        br.act = 'arms'; br.keepAct = true;
        f.bradyOut = true;
        yield g.say('brady', 'Вот так! Купайте меня в обожании! Я всю жизнь этого ждал!');
        yield g.say('sam', 'Он вышел из будки. Тщеславие открывает любые консервы.');
      } else yield g.say('brady', 'Ещё! Ещё обожания!');
      return;
    }
    if (verb === 'become' && obj === 'brady') {
      for (const id of POPS) g.actors[id].v = 'brady';
      popsAct(g, '', false);
      yield g.say('whizzer', 'Я Брэди Калчер!');
      yield g.say('peepers', 'Нет, я Брэди Калчер!');
      yield g.say('specs', 'Я тоже Брэди Калчер! У меня самое честное лицо!');
      if (!f.bradyOut) {
        yield g.say('brady', 'Три копии меня?! Никакой самодеятельности! Кнопка сброса!');
        g.sfx('zap'); g.fx.flash = 0.3;
        yield* resetPops(g);
        yield g.say('sam', 'Он сбросил их кнопкой из будки. Пока он сидит за пультом, фокус не пройдёт.');
        return;
      }
      f.popBrady = true;
      yield g.say('brady', 'Эй! Это что за подделки? Брэди Калчер бывает только один! Я!');
      yield g.say('sam', 'Теперь каждый из них считает Брэди Калчером себя. А остальных Брэди самозванцами.');
      return;
    }
    if (verb === 'attack' && obj === 'brady') {
      if (!f.popBrady) {
        popsAct(g, '', false);
        yield chorus(g, 'Мы не можем! Он наш Мастер! Мы обожаем Брэди Калчера!');
        yield g.say('brady', 'Ха! Их любовь ко мне сильнее твоей антенны, пёс!');
        if (!f.bradyOut) yield g.say('sam', 'И он сидит за бронестеклом. Сначала надо выманить его из будки.');
        return;
      }
      yield* victory(g);
      return;
    }
    if (verb === 'attack' && obj === 'me') {
      g.endDialog();
      popsAct(g, 'attack', true);
      yield chorus(g, 'Атаковать пса!');
      for (const id of POPS) g.walkTo(id, 70, 170);
      yield 0.8;
      g.sfx('punch'); g.fx.shake = 0.8;
      yield g.walkTo('sam', 26, 176);
      yield g.say('sam', 'Ладно. Это была плохая идея.');
      placePops(g, true);
      if (f.bradyOut) { yield g.say('brady', 'Ха-ха! Пока ты валялся, я вернулся в будку!'); yield g.walkTo('brady', 276, 138); g.face('brady', 'w'); br.act = ''; br.keepAct = false; }
      f.bradyOut = false; f.popBrady = false;
      return;
    }
    if (verb === 'attack' && obj === 'max') { yield g.say('sam', 'Нет. Отставить. Макс мой напарник, даже под гипнозом.'); return; }
    if (verb === 'attack' && obj === 'each') {
      popsAct(g, 'attack', true);
      yield chorus(g, 'Получай! И ты получай!');
      g.sfx('punch');
      yield 0.6; g.sfx('punch');
      yield g.say('brady', 'Мальчики, не ссорьтесь! Вы портите мне кадр!');
      popsAct(g, '', false);
      return;
    }
    if (verb === 'worship' && obj === 'me') {
      popsAct(g, 'worship', true);
      yield chorus(g, 'О великий пёс в дуршлаге!');
      yield g.say('sam', 'Приятно. Но непродуктивно.');
      if (f.bradyOut) yield g.say('brady', 'Эй! Это моё обожание! Верните!');
      popsAct(g, '', false);
      return;
    }
    if (verb === 'worship' && obj === 'max') {
      popsAct(g, 'worship', true);
      yield chorus(g, 'О великий кролик!');
      yield g.say('max', 'Нако...нец-то... меня... ценят...');
      popsAct(g, '', false);
      return;
    }
    if (verb === 'worship' && obj === 'each') {
      popsAct(g, 'worship', true);
      yield chorus(g, 'Ты велик! Нет, ты велик! Нет, ты!');
      yield g.say('sam', 'Взаимное уважение по кругу. Как в правительстве.');
      popsAct(g, '', false);
      return;
    }
    if (verb === 'become' && obj === 'me') {
      yield g.say('specs', 'Гав.'); yield g.say('whizzer', 'Гав-гав.'); yield g.say('peepers', 'Вольная полиция! Гав!');
      yield g.say('sam', 'Нет. Это жутко. Отставить.');
      return;
    }
    if (verb === 'become' && obj === 'max') {
      popsAct(g, 'dance', true);
      yield chorus(g, 'Мы кролики-нечто! Хаос! Разрушение! Сыр!');
      yield g.say('sam', 'Отставить. Мне и одного Макса хватает.');
      popsAct(g, '', false);
      return;
    }
    if (verb === 'become' && obj === 'each') {
      yield g.say('specs', 'Я Уиззер! Мне надо в туалет!');
      yield g.say('whizzer', 'Я Пиперс! Я быстрее ветра!');
      yield g.say('peepers', 'А я Спекс... Я ничего не вижу без очков... Которых у меня нет.');
      yield g.say('sam', 'Путаницы больше. Толку никакого.');
      return;
    }
    if (verb === 'dance') {
      popsAct(g, 'dance', true);
      g.sfx('laugh');
      yield chorus(g, 'Газировка, газировка! Лопни пузырёк!');
      if (f.bradyOut) yield g.say('brady', 'Мой старый хит... Нет, не мой. Их. Ненавижу эту песню.');
      yield 1.0;
      popsAct(g, '', false);
      return;
    }
    if (verb === 'sleep') {
      popsAct(g, 'sleep', true);
      yield 1.2;
      yield g.say('brady', f.bradyOut ? 'Подъём! Хлоп-хлоп!' : 'Подъём! Кнопка «Бодрость»!');
      g.sfx('zap');
      popsAct(g, '', false);
      yield g.say('sam', 'Проснулись. Хорошо, что я не велел им видеть сны. Кто знает, кто бы там поселился.');
    }
  }

  function* victory(g) {
    const br = g.actors.brady;
    g.endDialog();
    popsAct(g, 'attack', true);
    yield g.say('specs', 'Самозванец! Настоящий Брэди Калчер тут я!');
    yield g.say('whizzer', 'Нет, я!');
    yield g.say('peepers', 'Держи подделку!');
    for (const id of POPS) g.walkTo(id, 150 + POPS.indexOf(id) * 10, 130);
    yield g.say('brady', 'Нет! Стойте! Я оригинал! Я Брэди Калчер! Смотрите мне в глаза!');
    yield 0.6;
    g.sfx('punch'); g.fx.shake = 1;
    g.f.bradyFly = g.time;
    br.visible = false;
    yield 0.9;
    g.sfx('explosion'); g.fx.flash = 1; g.fx.shake = 1.5;
    g.f.tronOn = false; g.f.tronBroken = true; g.fx.hypno = 0;
    g.f.bradyFly = 0;
    yield 1.2;
    g.place('brady', 'studio', 160, 128, 'n');
    br.visible = true; br.act = ''; br.keepAct = false; br.v = 'dazed';
    for (const id of POPS) { const a = g.actors[id]; a.hypno = false; a.v = id === 'whizzer' ? 'nobasket' : ''; a.act = ''; a.keepAct = false; }
    placePops(g, false);
    const max = g.actors.max;
    max.hypno = false;
    g.f.maxStrapped = false;
    g.music('credits');
    yield g.say('specs', 'Где мы? Почему у нас на головах эти ужасные парики?');
    yield g.say('max', 'Сэм! Мне снилось, что я работаю! Настоящий кошмар!');
    yield g.walkTo('max', 78, 172);
    g.face('max', 'e');
    yield g.say('sam', 'Всё позади, Макс. Культ личности побеждён. Одной конкретной личности.');
    yield g.say('brady', 'Какое лицо... Какое честное лицо... Не могу оторваться... почему-то.');
    yield g.say('max', 'Сэм, он в Гипнотрон смотрится!');
    yield g.say('sam', 'Похоже, Брэди наконец нашёл самого преданного зрителя.');
    yield g.say('whizzer', 'А можно у вас автограф взять?');
    yield g.say('sam', 'Автограф? Звёзды тут вы, ребята.');
    yield g.say('peepers', 'Были. Теперь просто люди. Непривычно.');
    g.give('max');
    g.f.maxAway = false;
    max.follow = 'sam'; max.scripted = false;
    yield* S.ending(g);
  }

  S.ending = function* (g) {
    g.f.finale = false;
    yield g.fadeOut(1);
    g.actors.sam.helmet = false;
    g.setRoom('office', { x: 150, y: 166, dir: 's' });
    g.place('max', 'office', 120, 170, 'e');
    g.f.phoneBack = true;
    g.music('office');
    yield g.fadeIn(1);
    yield* S.office.ringPhone(g, 2);
    yield g.walkTo('sam', 104, 150);
    g.face('sam', 'w');
    g.actors.sam.act = 'phone'; g.actors.sam.keepAct = true;
    yield g.say('sam', 'Вольная полиция. Сэм слушает.');
    yield S.phone(g, 'Хорошая работа, Сэм. Соседи довольны, Попперы вернулись в шоу-бизнес, лавка Боско цела.');
    yield S.phone(g, 'А где сейчас Брэди Калчер?');
    yield g.say('sam', 'Смотрит телевизор, Комиссар. Долго смотрит.');
    yield S.phone(g, 'Пусть смотрит. До следующего звонка.');
    g.sfx('hangup');
    g.actors.sam.act = ''; g.actors.sam.keepAct = false;
    const j = g.actors.jimmy;
    j.visible = true; j.act = 'peek'; j.keepAct = true; j.x = 211; j.y = 128;
    g.sfx('squeak');
    yield g.say('jimmy', 'Эй, начальники! Швейцарского больше не осталось?');
    yield g.say('max', 'Сэм, можно я его теперь пристрелю?');
    yield g.say('sam', 'Нет, Макс. Но можешь подержать его за окном. В честь праздника.');
    yield g.say('jimmy', 'Я пошёл. Я уже ушёл. Меня тут не было.');
    j.visible = false;
    yield g.say('max', 'Сэм, а что мы будем делать завтра?');
    yield g.say('sam', 'То же, что и всегда, Макс. Ждать, пока позвонит телефон.');
    yield g.fadeOut(0.5);
    g.ended = true;
  };

  TALK.brady = {
    options: [
      { id: 'give', icon: 'ex', text: 'Брэди, сдавайся!', run: function* (g) {
        yield g.say('brady', 'Никогда! Мои Попперы обожают Брэди Калчера. Они никогда не поднимут руку на Брэди Калчера!');
        yield g.say('brady', 'Они живут, чтобы быть как Брэди Калчер. Смотреть на Брэди Калчера. Поклоняться Брэди Калчеру!');
      } },
      { id: 'out', icon: 'q', text: 'Выходи из будки!', when: g => !g.f.bradyOut, run: function* (g) {
        yield g.say('brady', 'Зачем? Тут бронестекло и кнопка сброса. А там ты со своей кастрюлей.');
        yield g.say('brady', 'Вот если бы меня кто-нибудь обожал погромче, я бы, может, и вышел на поклон...');
      } },
      { id: 'why', icon: 'q', text: 'Зачем ты всё это устроил?', once: true, run: function* (g) {
        yield g.say('brady', 'В восемьдесят первом меня не взяли в «Сода-Попперы». Сказали, лицо слишком честное для телевидения.');
        yield g.say('brady', 'Теперь вся страна смотрит мне в глаза. А Попперы носят мне кофе. Справедливость восторжествовала.');
      } },
      { id: 'max', icon: 'f:max', text: 'Отпусти Макса!', run: function* (g) {
        yield g.say('brady', 'Кролика? Ни за что. Он будет звездой моего нового шоу: «Брэди и Кролик». Рейтинги взлетят до небес!');
      } },
      { id: 'bye', icon: 'bye', text: 'Мы ещё поговорим.', end: true, run: function* (g) { yield g.say('brady', 'Смотри мне в глаза, пёс. А, ты же в кастрюле. Досадно.'); } }
    ]
  };

  ROOMS.homegate = {
    id: 'homegate', name: 'Приют Брэди Калчера', w: 320, music: 'home',
    paint: (b) => S.BG.homegate(b),
    walk: [[0, 154, 320, 154, 320, 198, 0, 198]],
    layers: [
      { id: 'gate', x: 186, y: 46, base: 150, key: g => g.f.gateOpen ? 'o' : '' },
      { id: 'forms', x: 82, y: 108 },
      { id: 'van', x: 14, y: 110, base: 150, when: g => g.f.vanCrashed },
      { id: 'desoto', x: -22, y: 160, base: 200 }
    ],
    hot: [
      { id: 'forms', name: 'Бланки заявлений', rect: [76, 90, 34, 26], walk: [96, 160], face: 'n',
        look: 'Ящик с бланками. «Заявление о приёме. Заполнять печатными буквами. Заполнять неразборчиво тоже можно».',
        use: function* (g) {
          if (g.has('form') || g.has('formok')) { yield g.say('sam', 'Бланк у меня уже есть.'); return; }
          if (g.f.samCured) { yield g.say('sam', 'Бланк больше не нужен. Ворота открыты.'); return; }
          yield g.anim('sam', 'reach', 0.5);
          g.give('form');
          g.f.formTaken = true;
          yield* S.readForm(g);
          yield g.say('max', 'Сэм, у тебя ведь всё это есть? Ну, хотя бы что-нибудь?');
        } },
      { id: 'slot', name: 'Щель для бланков', rect: [122, 122, 36, 14], walk: [140, 158], face: 'n',
        look: 'Щель с надписью «Бланки сюда». Под ней лампочка. Красная. Мне не нравится этот цвет.',
        use: 'Пальцы я туда совать не буду.',
        items: {
          form: function* (g) { yield* readerScene(g, false); },
          formok: function* (g) { yield* readerScene(g, true); },
          max: function* (g) { yield g.say('max', 'Я туда не пролезу. Но я могу туда покричать!'); }
        } },
      { id: 'booth', name: 'Будка приёмной', rect: [114, 62, 52, 58], walk: [140, 158], face: 'n', look: 'Будка приёмной. Внутри сидит механическая обезьянка с тарелками. Самый компетентный сотрудник, которого я видел за неделю.' },
      { id: 'gate', name: 'Ворота', rect: [186, 46, 116, 104], walk: [244, 158], face: 'n',
        look: g => g.f.gateOpen ? 'Ворота открыты. Дальше студия Брэди.' : 'Кованые ворота с узором в виде глаз. Глаза смотрят на меня. Максу нравится. Мне нет.',
        use: function* (g) {
          if (g.f.gateOpen) { yield* enterStudio(g); return; }
          yield g.say('sam', 'Заперто. Похоже, пускают только пациентов с заявлением.');
        },
        exit: function* (g) {
          if (g.f.gateOpen) { yield* enterStudio(g); return; }
          yield g.say('sam', 'Заперто. Похоже, пускают только пациентов с заявлением.');
        },
        items: { gun: 'Ворота бронированные. Рикошет мне ни к чему.' } },
      { id: 'sign', name: 'Вывеска', rect: [150, 4, 168, 22], look: '«Приют Брэди Калчера для бывших детских звёзд». Ниже мелко: «Слава проходит. Брэди остаётся».' },
      { id: 'mansion', name: 'Особняк', rect: [140, 60, 120, 60], look: 'Розовый особняк на холме. Над крыльцом огромный глаз.' },
      { id: 'stars', name: 'Звёзды на тротуаре', rect: [0, 158, 320, 36], look: ['Звёзды на тротуаре: «Малыш Бобби», «Близнецы Оладушкины», «Говорящий пудель Пьер». Никого не помню.', '«Сода-Попперы». Звезда поцарапана. Кто-то очень старался.'] },
      { id: 'desoto', name: 'Де Сото', rect: [0, 162, 110, 36], walk: [104, 178], face: 'w', look: 'Наш Де Сото. Припаркован с достоинством и немного на газоне.', use: function* (g) { yield* S.openMap(g); } },
      { id: 'van', name: 'Разбитый фургон', rect: [14, 110, 88, 44], when: g => g.f.vanCrashed, walk: [60, 160], face: 'n', look: 'Фургон «Ай-Бо» в кустах. Шины спущены, водитель сбежал, кассеты рассыпаны.', use: 'Внутри только кассеты «Ай-Бо». Сотни кассет. Сотни глаз. Я закрою дверь.' }
    ],
    actors: {
      monkey: {
        name: 'Обезьянка-приёмщица', walk: [140, 158], face: 'n',
        look: 'Механическая обезьянка с тарелками. На табличке: «Приёмная. Заявления принимает обезьяна».',
        talk: function* (g) {
          const m = g.actors.monkey;
          m.act = 'clap'; m.keepAct = true; g.sfx('cymbal');
          yield monkeySay(g, 'ДЗЫНЬ! ПРЕДЪЯВИТЕ ЗАЯВЛЕНИЕ! ДЗЫНЬ!');
          m.act = ''; m.keepAct = false;
          yield g.say('max', 'Сэм, она мне нравится. Можно я её заберу домой?');
        },
        items: { gun: 'Стрелять в игрушку ниже моего достоинства. Хотя она явно работает на врага.', max: function* (g) { yield g.say('max', 'Дай пять, железная! ...Она дала мне тарелкой по лицу. Уважаю.'); } }
      }
    },
    setup(g) {
      g.place('monkey', 'homegate', 140, 121, 's');
    },
    enter: function* (g) {
      if (g.f.samCured && !g.seen.gateCured) {
        g.seen.gateCured = 1;
        yield g.say('sam', 'Держись, Макс. Я иду.');
      }
    },
    onLoad(g) { ROOMS.homegate.setup(g); }
  };

  ROOMS.studio = {
    id: 'studio', name: 'Студия Брэди', w: 320, music: g => g.f.finale ? 'finale' : 'studio', noSave: true,
    paint: (b) => S.BG.studio(b),
    walk: [[20, 150, 300, 150, 300, 176, 20, 176]],
    layers: [
      { id: 'chair', x: 207, y: 94, base: 133 },
      { id: 'glass', x: 246, y: 52, base: 145 },
      { id: 'seats', x: 0, y: 172, base: 400 }
    ],
    drawBack(f, g, cx) {
      if (!g.f.tronOn && !g.f.tronBroken) return;
      const x0 = 160, y0 = 60;
      for (let y = 10; y < 112; y++) for (let x = 84; x < 238; x++) {
        const dx = (x - x0) / 76, dy = (y - y0) / 54;
        if (Math.abs(dy) > (1 - dx * dx) * 0.98 || dx * dx > 1) continue;
        if (g.f.tronBroken) {
          const crack = Math.abs(((x - 160) * 0.7 + (y - 60) * 1.3) % 23) < 1 || Math.abs(((x - 150) * -1.1 + (y - 50)) % 31) < 1;
          f.set(x - cx, y, crack ? C.grey[5] : S.hash(x >> 1, y >> 1, 9) > 0.93 ? C.sky[4] : C.grey[0]);
          continue;
        }
        const a = Math.atan2(y - y0, (x - x0) * 0.7), r = Math.hypot((x - x0) * 0.7, y - y0);
        const k = Math.floor((a * 3 + r * 0.22 - g.time * 5) / 1.1);
        f.set(x - cx, y, C.cycle[((k % 8) + 8) % 8]);
      }
      if (g.f.tronBroken) {
        const P = new S.Pen(f).at(160 - cx, 70, 1.6);
        S.art.bradyHead(P, 0, 0, { v: 'dazed' });
      }
    },
    sprites(g) {
      const out = [];
      if (g.f.bradyFly) {
        const t = Math.min(1, (g.time - g.f.bradyFly) / 0.9);
        out.push({ y: 500, draw: (f, cx) => {
          const s = S.sprite('brady', { act: 'arms', t: g.time }, 1 - t * 0.6);
          S.blit(f, s.buf, Math.round(160 - s.ox - cx), Math.round(126 - t * 70 - s.oy));
        } });
      }
      return out;
    },
    hot: [
      { id: 'tron', name: 'Гипнотрон', rect: [84, 10, 152, 102],
        look: g => g.f.tronBroken ? 'Разбитый Гипнотрон. В трещинах отражается Брэди. Брэди не может отвести глаз.' : 'Гипнотрон. Огромный телевизор в форме глаза. Долго на него лучше не смотреть.',
        use: 'Высоко. И он пытается меня загипнотизировать.',
        items: { gun: 'Стекло бронированное, пулей не разбить. Нужно что-то потяжелее. Или кто-то.' } },
      { id: 'exit', name: 'Выход', rect: [0, 100, 18, 76], walk: [26, 170], face: 'w', look: 'Выход из студии.',
        exit: function* (g) {
          if (g.f.finale) { yield g.say('sam', 'Я не уйду без Макса.'); return; }
          yield* g.goRoom('homegate', { x: 244, y: 160, dir: 's' });
        } },
      { id: 'booth', name: 'Будка режиссёра', rect: [246, 52, 70, 94], look: g => g.f.bradyOut ? 'Будка режиссёра. Пустая. Кнопка сброса скучает.' : 'Бронированная будка режиссёра. Внутри Брэди и кнопка сброса. Пока он там, до него не добраться.' },
      { id: 'cameras', name: 'Телекамеры', rect: [8, 76, 60, 70], look: 'Телекамеры. Горят красные лампочки. Значит, нас снимают. Причешусь... а, я в дуршлаге.' },
      { id: 'seats', name: 'Зрительный зал', rect: [0, 176, 320, 24], look: 'Пустые кресла. Брэди мечтал о полном зале. Пока у него трое загипнотизированных и один кролик.' }
    ],
    actors: {
      brady: {
        name: 'Брэди Калчер', walk: g => g.f.bradyOut ? [120, 156] : [230, 160], face: 'e',
        look: 'Брэди Калчер. Помпадур высотой с небоскрёб и улыбка, которую видно из космоса. «Слишком честное лицо для телевидения».',
        talk: function* (g) { if (g.f.finale) yield g.talkTo('brady'); else yield g.say('brady', 'Смотри мне в глаза, Сэм.'); },
        items: {
          gun: g => g.f.bradyOut ? 'Попперы закроют его собой. Нужен план поизящнее.' : 'Бронестекло. Пуля отскочит и попадёт в меня. Так уже было в Кливленде.',
          glove: g => g.f.bradyOut ? 'Он окружён своими фанатами. Мне до него не дотянуться.' : 'Через бронестекло? Моя перчатка не настолько длинная.',
          launcher: 'Газ в студии? Макс привязан в двух шагах. Нет.',
          tapes: 'Вернуть кассеты? Ни за что. Я их больше видеть не могу.'
        }
      },
      max: {
        name: 'Макс', walk: [196, 174], face: 'e', when: g => g.f.maxStrapped,
        look: 'Макс привязан к креслу «Звезда». Глаза крутятся спиралями. Выглядит почти счастливым, и это пугает больше всего.',
        talk: function* (g) { yield g.say('sam', 'Макс! Держись!'); yield g.say('max', 'Смотрю... в глаза... Кассета... хочу... Сэм?.. Нет... кассета...'); },
        use: 'Ремни на замке, а ключ у Брэди. Сначала надо разобраться с ним.',
        items: { helmet: 'Шлем один. Сниму его, и загипнотизированных станет двое.' }
      },
      specs: popHot('Спекс'), whizzer: popHot('Уиззер'), peepers: popHot('Пиперс')
    },
    setup(g) {
      g.fx.hypno = g.f.tronOn ? 1 : 0;
      g.actors.sam.helmet = g.has('helmet') && g.f.samCured;
    },
    onLoad(g) { ROOMS.studio.setup(g); }
  };

  function popHot(name) {
    return {
      name, walk: [70, 174], face: 'e',
      look: g => g.f.finale ? name + ' под гипнозом. Глаза крутятся, кулаки сжаты. Ждёт приказа. Слушает любого, кто говорит на волне Мастера.' : name + '.',
      talk: function* (g) {
        if (!g.f.finale) { yield g.say('sam', 'Эй!'); return; }
        yield g.say('sam', 'Проверим шлем. Внимание, Сода-Попперы!');
        yield g.talkTo('cmd');
      },
      items: {
        gun: 'Нет. Они под гипнозом. И их трое.',
        glove: 'Их трое. Пока я вырублю одного, двое других снимут с меня дуршлаг.',
        launcher: 'Газ? Нет. Макс рядом.'
      }
    };
  }

  S.home = { VERBS, command };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
