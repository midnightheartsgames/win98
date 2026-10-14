(function (S) {
  'use strict';
  const { C, ROOMS, TALK } = S;
  const CLOSEUPS = S.CLOSEUPS = S.CLOSEUPS || {};

  const INK = [
    { money: 'Мешок с деньгами. Туго набитый.', fame: 'Статуэтка «Эмми» с моим именем.', none: 'Бабочка, которая плохо спала.', noneIcon: 'bug' },
    { money: 'Особняк. С бассейном, полным монет.', fame: 'Моё имя огромными буквами на афише.', none: 'Две утки спорят о налогах.', noneIcon: 'duck' },
    { money: 'Толстый кошелёк. Мой. Толстый.', fame: 'Автограф. Который у меня просят.', none: 'Раздавленный жук. Или пицца.', noneIcon: 'pizza' },
    { money: 'Фондовая биржа в час пик.', fame: 'Толпа визжащих поклонников.', none: 'Мой дядя Эдгар в профиль.', noneIcon: 'cloud' },
    { money: 'Кредитная карта без лимита.', fame: 'Вспышки фотокамер. Сплошные вспышки.', none: 'Пятно от кетчупа на галстуке.', noneIcon: 'popcorn' }
  ];
  const WORDS = {
    teeth: ['бормашина', 'пломба', 'коронка', 'фтор', 'зубная нить'],
    hair: ['расчёска', 'фен', 'начёс', 'шампунь', 'мелирование'],
    none: ['котёнок', 'облако', 'понедельник', 'тромбон', 'пирог', 'носок', 'трамвай']
  };
  const CALM = ['Облако.', 'Мама.', 'Бутерброд.', 'Понедельник.', 'Шляпа.', 'Сосиска.', 'Налоги.', 'Тишина.', 'Макс.', 'Сыр.'];
  const WHO = ['sybil', 'max', 'bosco', 'jimmy'];
  const WHO_NAME = { sybil: 'женщину с высокой причёской', max: 'кого-то маленького и ушастого', bosco: 'кого-то большого и лысого', jimmy: 'кого-то очень маленького с хвостом' };
  const WHO_NOM = { sybil: 'женщина с высокой причёской', max: 'кто-то маленький и ушастый', bosco: 'кто-то большой и лысый', jimmy: 'кто-то очень маленький с хвостом' };
  const BOX = ['donut', 'wcake', 'cake', 'pizza'];
  const BOX_NAME = { donut: 'Коробка пончиков', wcake: 'Свадебный торт', cake: 'Праздничный торт со свечами', pizza: 'Пицца' };

  function* freeSybil(g) {
    yield g.anim('sam', 'reach', 0.4);
    g.sfx('door');
    g.f.closetOpenS = true;
    const sy = g.actors.sybil;
    g.place('sybil', 'sybil', 298, 134, 's');
    sy.visible = true;
    yield g.say('sybil', 'Наконец-то! Хоть кто-то догадался открыть шкаф!');
    sy.scripted = true;
    yield g.walkTo('sybil', 238, 158);
    g.f.closetOpenS = false;
    g.sfx('door');
    g.face('sybil', 'w');
    yield g.say('sybil', 'Этот мелкий прохвост запер меня в шкафу и лечит моих пациентов рекламой «Ай-Бо»!');
    const pp = g.actors.peepers;
    yield g.say('peepers', 'Ой! Настоящая! Бежать!');
    pp.v = ''; pp.act = 'run'; pp.keepAct = true;
    pp.scripted = true;
    g.f.peepersRunning = true;
    g.f.sybilFree = true;
    sy.scripted = false;
    yield g.walkTo('peepers', 70, 180);
    pp.scripted = false;
    yield g.say('sybil', 'Будем знакомы: Сибил Пандемик, психотерапевт. Ну, на этой неделе.');
  }

  function* gasPeepers(g) {
    if (g.f.peepersGassed) { yield g.say('sam', 'Хватит. Сибил тоже дышит этим газом.'); return; }
    if (!g.f.knowCure && !g.f.whizzerCured) { yield g.say('sam', 'Сначала узнаю, как лечат гипноз. Стрелять буду потом.'); return; }
    const pp = g.actors.peepers;
    g.faceTo('sam', pp.x);
    yield g.anim('sam', 'shoot', 0.4);
    g.sfx('teargas');
    g.fx.flash = 0.2;
    g.f.gasX = pp.x; g.f.gasY = pp.y; g.f.gasT = g.time;
    pp.path = null; pp.scripted = true;
    pp.act = 'gassed'; pp.keepAct = true;
    g.f.peepersGassed = true;
    yield 0.6;
    yield g.say('peepers', 'А-а-а! Глаза! Как в финале второго сезона! Ничего не вижу!');
    yield g.say('sybil', 'Кхе-кхе! Сэм! Это мой кабинет!');
    yield g.say('max', 'Сэм, он стоит на месте! Бей его, пока он не проморгался!');
  }

  function* punchPeepers(g) {
    const pp = g.actors.peepers;
    const side = g.actors.sam.x < pp.x ? -20 : 20;
    yield g.walkTo('sam', pp.x + side, pp.y + 1);
    g.faceTo('sam', pp.x);
    yield g.anim('sam', 'reach', 0.3);
    g.sfx('punch');
    g.fx.shake = 0.5;
    pp.act = 'ko'; pp.keepAct = true;
    yield 1.6;
    pp.act = ''; pp.keepAct = false; pp.hypno = false; pp.v = '';
    g.f.peepersRunning = false;
    g.f.peepersCured = true;
    g.f.gasT = 0;
    yield g.say('peepers', 'Ой... Где я? Почему глаза чешутся?');
    yield g.say('sybil', 'Прекрасно. Мой первый настоящий пациент за неделю. Садитесь на кушетку, молодой человек.');
    yield g.walkTo('peepers', 112, 166);
    g.face('peepers', 's');
    pp.scripted = false;
    yield* S.checkCures(g);
  }

  function inkOrder(g, i) {
    const r = new S.RNG((g.seed + i * 977) >>> 0);
    return r.shuffle(['money', 'fame', 'none']);
  }

  TALK.ink = {
    start: function* (g) {
      g.closeup = { kind: 'inkblot', i: g.f.ink.i, t0: g.time };
      yield g.say('sybil', 'Карточка номер ' + (g.f.ink.i + 1) + '. Что вы видите?', { x: 160, y: 26 });
    },
    options: g => {
      const card = INK[g.f.ink.i] || INK[0];
      return inkOrder(g, g.f.ink.i).map(kind => ({
        id: kind, icon: kind === 'money' ? 'money' : kind === 'fame' ? 'star' : card.noneIcon, text: card[kind],
        run: function* (gg) { yield* inkAnswer(gg, kind); }
      }));
    }
  };

  function* inkAnswer(g, kind) {
    const k = g.f.ink;
    if (kind !== g.f.sym1) k.ok = false;
    const replies = ['Хм.', 'Интересно.', 'Записываю.', 'Очень интересно.', 'Угу.'];
    yield g.say('sybil', replies[k.i % replies.length], { x: 160, y: 26 });
    k.i++;
    if (k.i < INK.length) { g.closeup.i = k.i; yield g.say('sybil', 'Карточка номер ' + (k.i + 1) + '.', { x: 160, y: 26 }); return; }
    g.closeup = null;
    g.endDialog();
    const what = g.f.sym1 === 'money' ? 'деньгами' : 'славой';
    if (k.ok) {
      g.f.test1 = true;
      yield g.say('sybil', 'Нездоровая одержимость ' + what + ', на всех пяти карточках. Первый симптом подтверждён.');
      yield g.say('sam', 'Я всегда подозревал. Приятно, когда специалист подтверждает.');
    } else {
      yield g.say('sybil', 'Хм. Слишком разнообразно, Сэм. По бланку вы одержимы ' + what + '. Вы должны видеть это в каждом пятне.');
      yield g.say('sybil', 'Пятна не лгут. Приходите, когда будете готовы.');
    }
  }

  function makeWords(g) {
    const r = g.rng;
    const cat = g.f.sym2, other = cat === 'teeth' ? 'hair' : 'teeth';
    const trig = r.shuffle(WORDS[cat]).slice(0, 3);
    const dis = r.shuffle(WORDS[other]).slice(0, 2);
    const neu = r.shuffle(WORDS.none).slice(0, 3);
    return r.shuffle(trig.concat(dis, neu));
  }

  function* nextWord(g) {
    const a = g.f.assoc;
    if (a.i >= a.words.length) {
      g.f.assocWaiting = false;
      g.actors.sybil.act = ''; g.actors.sybil.keepAct = false;
      const what = g.f.sym2 === 'teeth' ? 'стоматологии' : 'парикмахерского дела';
      if (a.ok) {
        g.f.test2 = true;
        yield g.say('sybil', 'Агрессия при упоминании ' + what + ', как по учебнику. На остальное ноль реакции. Второй симптом подтверждён.');
      } else {
        yield g.say('sybil', 'Вы реагируете не на то, Сэм. По бланку вас бесит только тема ' + what + '. На всё остальное отвечайте спокойно.');
        yield g.say('sybil', 'Попробуем ещё раз, когда соберётесь.');
      }
      g.f.assoc = null;
      return;
    }
    g.actors.sybil.act = 'clip'; g.actors.sybil.keepAct = true;
    yield g.say('sybil', 'Слово: «' + a.words[a.i] + '».');
    g.f.assocWaiting = true;
  }

  function* respond(g, violent, how) {
    const a = g.f.assoc;
    const word = a.words[a.i];
    const trig = WORDS[g.f.sym2].includes(word);
    g.f.assocWaiting = false;
    if (violent) {
      if (how === 'gun') {
        yield g.anim('sam', 'shoot', 0.3);
        g.sfx('gun'); g.fx.flash = 0.35;
        yield g.say('sam', 'НИКАКИХ «' + word.toUpperCase() + '» В МОЁМ ПРИСУТСТВИИ!');
      } else {
        yield g.anim('sam', 'reach', 0.3);
        g.sfx('punch'); g.fx.shake = 0.4;
        yield g.say('sam', 'Н-Н-НЕНАВИЖУ «' + word.toUpperCase() + '»!');
      }
      yield g.say('sybil', trig ? 'Ого. Записываю: бурная реакция.' : 'Хм. Бурная реакция на слово «' + word + '». Записываю.');
    } else {
      yield g.say('sybil', 'Угу. Записываю.');
    }
    if (violent !== trig) a.ok = false;
    a.i++;
    yield* nextWord(g);
  }

  TALK.assoc = {
    options: g => {
      const a = g.f.assoc;
      const r = new S.RNG((g.seed + a.i * 131) >>> 0);
      const picks = r.shuffle(CALM).slice(0, 3);
      return picks.map((t, k) => ({ id: 'c' + k, icon: ['cloud', 'duck', 'q'][k], text: t, end: true, run: function* (gg) { yield* respond(gg, false); } }))
        .concat([{ id: 'stop', icon: 'bye', text: 'Давайте прервёмся.', end: true, run: function* (gg) {
          gg.f.assoc = null; gg.f.assocWaiting = false; gg.actors.sybil.act = ''; gg.actors.sybil.keepAct = false;
          yield gg.say('sybil', 'Как скажете. Начнём с начала, когда будете готовы.');
        } }]);
    }
  };

  function* test2(g) {
    yield g.say('sybil', 'Тест второй, свободные ассоциации. Я говорю слово, вы отвечаете первое, что придёт в голову.');
    yield g.say('sybil', 'Или делаете первое, что придёт в руки. Я не осуждаю. Я записываю.');
    g.f.assoc = { i: 0, ok: true, words: makeWords(g) };
    yield* nextWord(g);
  }

  function* test3(g) {
    yield g.say('sybil', 'Тест третий: анализ сновидений. Ложитесь на кушетку и закройте глаза.');
    yield g.walkTo('sam', 112, 168);
    yield g.say('sybil', 'Вы в комнате. Там кто-то стоит, и что-то лежит. Поменяйте их, как подскажет подсознание, и выходите в дверь.');
    g.f.dt = { who: 0, box: 0 };
    g.f.maxAway = true;
    yield* g.goRoom('dreamtest', { x: 60, y: 172, dir: 'e' }, { fade: 1.5 });
  }

  function* endDreamTest(g) {
    const d = g.f.dt;
    const who = WHO[d.who], box = BOX[d.box];
    yield* g.goRoom('sybil', { x: 112, y: 168, dir: 'e' }, { fade: 1.5 });
    g.f.maxAway = false;
    const pass = (g.f.sym3 === 'mother' && who === 'sybil' && box === 'wcake') || (g.f.sym3 === 'peers' && who === 'max' && box === 'cake');
    yield g.say('sybil', 'Итак, в вашем сне были ' + WHO_NOM[who] + ' и ' + BOX_NAME[box].toLowerCase() + '.');
    if (who === 'sybil' && box === 'wcake') yield g.say('sybil', 'Свадебный торт и... я? Классический перенос. Психотерапевт замещает мать. Вы тайно хотите жениться на собственной матери, Сэм.');
    else if (who === 'max' && box === 'cake') yield g.say('sybil', 'Праздничный торт и Макс. Свечи считают годы, а Макс не взрослеет. Вы хотите, чтобы ровесники старели, а вы оставались прежним.');
    else if (box === 'donut' || box === 'pizza') yield g.say('sybil', 'Еда. Вы просто голодны, Сэм. Такое лечится обедом.');
    else yield g.say('sybil', 'Хм. Это многое о вас говорит. Только в бланке об этом ни слова.');
    if (pass) {
      g.f.test3 = true;
      yield g.say('sybil', 'Третий симптом подтверждён!');
    } else {
      const need = g.f.sym3 === 'mother' ? 'желание жениться на матери' : 'желание увидеть, как стареют ровесники';
      yield g.say('sybil', 'А в бланке у вас ' + need + '. Подумайте, кто и что было бы к месту в таком сне. Попробуем ещё раз.');
    }
    if (g.f.test1 && g.f.test2 && g.f.test3) yield* signForm(g);
  }

  function* signForm(g) {
    yield g.say('sybil', 'Все три теста пройдены! Давайте бланк.');
    g.actors.sybil.act = 'write'; g.actors.sybil.keepAct = true;
    g.sfx('type');
    yield 1.0;
    g.actors.sybil.act = ''; g.actors.sybil.keepAct = false;
    g.swap('form', 'formok');
    g.f.formSigned = true;
    yield g.say('sybil', 'Поздравляю! Теперь вы сумасшедший. Официально, с подписью.');
    yield g.say('sam', 'Мама будет гордиться.');
    yield g.say('max', 'Сэм, а меня так можно? Я тоже хочу бумажку!');
    yield g.say('sybil', 'Макс, вам бумажка не нужна. У вас всё видно невооружённым глазом.');
  }

  TALK.sybil = {
    options: [
      { id: 'who', icon: 'q', text: 'Кто ты такая?', run: function* (g) {
        yield g.say('sybil', 'Сибил Пандемик, лицензированный психотерапевт. Лицензию мне прислали на прошлой неделе по почте.');
        yield g.say('sybil', 'До этого била татуировки, водила погрузчик и дегустировала газировку. Я себя ищу, Сэм.');
      } },
      { id: 'pp', icon: 'f:peepers', text: 'Что с Пиперсом?', when: g => !g.f.peepersCured, run: function* (g) {
        if (g.f.knowHypno) yield g.say('sybil', 'Загипнотизирован. Пустой взгляд, заученные фразы, тяга к кассетам «Ай-Бо». Ну и бегает он постоянно.');
        else yield g.say('sybil', 'Пустой взгляд, заученные фразы, любовь к кассетам... Похоже на гипноз. Или на рекламную кампанию. Разница невелика.');
      } },
      { id: 'cure', icon: 'eye', text: 'Как вылечить гипноз?', when: g => g.f.knowHypno && !g.f.knowCure, run: function* (g) {
        yield g.say('sybil', 'Раз плюнуть. Если гипноз свежий, хватит хорошего удара по голове. Мозг перезагружается, как телевизор.');
        yield g.say('sybil', 'А если гипнотизёр поработал всерьёз, он поселяется у жертвы в снах. Тогда жертву надо вырубить, а во сне уничтожить незваного гостя. Лично.');
        yield g.say('sam', 'Бить по голове мы умеем.');
        yield g.say('max', 'А уничтожать лично ещё лучше!');
        g.f.knowCure = true;
      } },
      { id: 'form', icon: 'form', text: 'Сибил, подпишешь мне этот бланк?', when: g => g.has('form') && !g.f.testsExplained, run: function* (g) {
        yield g.say('sybil', '«Искусственное расстройство личности»... Три симптома... Вы хотите, чтобы я признала вас психом?');
        yield g.say('sam', 'Официально. С печатью. Это для дела.');
        yield g.say('sybil', 'Без трёх тестов не подпишу. Пятна Роршаха, свободные ассоциации, анализ сновидений.');
        yield g.say('sybil', 'Показать нужно ровно те симптомы, что в бланке. Перечитайте его.');
        g.f.testsExplained = true;
      } },
      { id: 't1', icon: 'ex', text: 'Я готов к пятнам Роршаха.', when: g => g.has('form') && g.f.testsExplained && !g.f.test1, run: function* (g) {
        yield g.say('sybil', 'Тест первый. Я показываю пятно, вы говорите, что видите. Первое, что придёт в голову.');
        g.f.ink = { i: 0, ok: true };
        g.endDialog();
        yield g.talkTo('ink');
      } },
      { id: 't2', icon: 'ex', text: 'Давай свободные ассоциации.', when: g => g.has('form') && g.f.test1 && !g.f.test2, end: true, run: function* (g) { yield* test2(g); } },
      { id: 't3', icon: 'ex', text: 'Давай анализ сновидений.', when: g => g.has('form') && g.f.test1 && g.f.test2 && !g.f.test3, end: true, run: function* (g) { yield* test3(g); } },
      { id: 'shield', icon: 'helmet', text: 'Сибил, как защититься от гипноза?', when: g => g.f.samCured && !g.f.gotDiagram, run: function* (g) {
        yield g.say('sybil', 'В «Вестнике практической психиатрии» была схема антигипнотического шлема. Сейчас найду.');
        g.actors.sybil.act = 'clip';
        yield 0.6;
        g.actors.sybil.act = '';
        g.give('diagram');
        g.f.gotDiagram = true;
        yield g.say('sybil', 'Вот. Собрать его может любой параноик с паяльником. На людях лучше не носить.');
        yield g.say('sam', 'Параноик с паяльником... Кажется, я знаю одного.');
      } },
      { id: 'biz', icon: 'duck', text: 'Как идёт бизнес?', once: true, run: function* (g) {
        yield g.say('sybil', 'Пациентов мало. В этом районе все считают себя нормальными. Тревожный симптом.');
      } },
      { id: 'bye', icon: 'bye', text: 'До свидания, доктор.', end: true, run: function* (g) { yield g.say('sybil', 'Сеанс окончен. С вас сорок долларов. Шучу. Пятьдесят.'); } }
    ]
  };

  CLOSEUPS.inkblot = function (f, g, cu) {
    const key = 'ink' + cu.i;
    if (!S.tvCache.has(key)) {
      const b = new S.Buf(S.W, S.H);
      const P = new S.Pen(b);
      S.BG.sybil(b, {});
      S.shade(b, (() => { const m = new S.Mask(0, 0, S.W, S.H); m.m.fill(1); return m; })(), 1.4);
      P.part(P.poly([72, 34, 250, 30, 254, 164, 68, 168]), C.cream, { b: 4 });
      const r = new S.RNG(1000 + cu.i * 71);
      let m = null;
      for (let k = 0; k < 9; k++) {
        const cx = 160 - 6 - r.next() * 60, cy = 60 + r.next() * 80;
        const e = S.ellipseMask(cx, cy, 6 + r.next() * 18, 5 + r.next() * 14, r.next() * 3);
        m = m ? m.union(e) : e;
      }
      const full = new S.Mask(0, 0, S.W, S.H);
      m.each((x, y) => { full.put(x, y, 1); full.put(319 - x, y, 1); });
      full.each((x, y) => { if (x > 76 && x < 246 && y > 38 && y < 160) b.set(x, y, S.hash(x, y, cu.i) < 0.06 ? C.grey[1] : C.grey[0]); });
      S.tvCache.set(key, b);
    }
    S.blit(f, S.tvCache.get(key), 0, 0);
    S.font.drawCentered(f, 'Карточка ' + (cu.i + 1) + ' из 5', 160, 40, C.grey[2], 0);
  };

  ROOMS.sybil = {
    id: 'sybil', name: 'Кабинет Сибил', w: 320, music: 'sybil',
    paint: (b) => S.BG.sybil(b, {}),
    walk: [[6, 126, 316, 126, 316, 198, 6, 198]],
    block: [[64, 150, 158, 150, 158, 162, 64, 162], [178, 148, 220, 148, 220, 160, 178, 160]],
    layers: [
      { id: 'couch', x: 60, y: 118, base: 160 },
      { id: 'chair', x: 176, y: 104, base: 158 },
      { id: 'lamp', x: 222, y: 72, base: 131 },
      { id: 'closetOpen', x: 280, y: 28, when: g => g.f.closetOpenS }
    ],
    sprites(g) {
      const out = [];
      if (g.f.gasT && g.time - g.f.gasT < 6) {
        const t = g.time - g.f.gasT;
        out.push({ y: 400, draw: (f, cx) => {
          for (let i = 0; i < 14; i++) {
            const a = i * 2.4, r = 6 + t * 10 + (i % 3) * 4;
            const x = g.f.gasX + Math.cos(a) * r - cx, y = g.f.gasY - 20 + Math.sin(a) * r * 0.5 - t * 3;
            const m = S.ellipseMask(x, y, 5, 4, 0);
            m.each((px, py) => { if (S.dith(px, py, Math.max(0, 0.7 - t * 0.12))) f.set(px, py, C.mint[4]); });
          }
        } });
      }
      return out;
    },
    hot: [
      { id: 'door', name: 'Выход на улицу', rect: [4, 36, 38, 112], walk: [40, 168], face: 'w',
        look: 'Дверь на улицу.',
        exit: function* (g) {
          if (g.f.assoc) { g.f.assoc = null; g.f.assocWaiting = false; g.actors.sybil.act = ''; g.actors.sybil.keepAct = false; }
          g.sfx('door');
          yield* g.goRoom('street', { x: 82, y: 146, dir: 's' });
        } },
      { id: 'closet', name: 'Шкаф', rect: [282, 30, 34, 90], walk: [290, 136], face: 'n',
        look: g => g.f.sybilFree ? 'Шкаф. Сейчас в нём никого нет. Надеюсь.' : 'Шкаф ходит ходуном и мычит. Либо там Сибил, либо очень расстроенная корова.',
        use: function* (g) {
          if (g.f.sybilFree) { yield g.say('sam', 'Там пусто. Только запасная лицензия и парик.'); return; }
          yield* freeSybil(g);
        },
        talk: function* (g) { if (!g.f.sybilFree) { yield g.say('sam', 'Эй, в шкафу! Вы там живы?'); yield g.say(null, 'Мммф! Мммф-мммф!', { key: 'closet', color: S.COLORS.sybil, x: 290, y: 60 }); } else yield g.say('sam', 'Шкаф молчит. Хороший шкаф.'); } },
      { id: 'couch', name: 'Кушетка', rect: [62, 118, 96, 40], walk: [110, 170], face: 'n',
        look: 'Кушетка для пациентов. На ней столько раз рыдали, что она стала немного солёной.',
        use: function* (g) { yield g.say('sam', 'Доктор, мне снится, что я собака в костюме.'); yield g.say(g.f.sybilFree ? 'sybil' : 'peepers', g.f.sybilFree ? 'Это не сон, Сэм.' : 'Смотрите мне в глаза.'); } },
      { id: 'chair', name: 'Кресло', rect: [176, 104, 46, 50], walk: [200, 170], face: 'n', look: 'Кресло психотерапевта. С него удобно смотреть на страдания людей и выписывать счета.', use: 'Это кресло доктора. Я в нём буду выглядеть как собака, которая заняла кресло доктора.' },
      { id: 'diplomas', name: 'Дипломы', rect: [54, 20, 114, 28], walk: [110, 132], face: 'n', look: 'Дипломы: «Психолог», «Мастер тату», «Водитель погрузчика», «Сомелье по газировке». Сибил человек разносторонний.' },
      { id: 'books', name: 'Книжный шкаф', rect: [170, 22, 50, 76], walk: [196, 132], face: 'n', look: ['«Фрейд для начинающих». «Толкование снов о толковании снов». «Как перестать бояться и полюбить тест Роршаха».', '«Гипноз: руководство для чайников». Страница про защиту от гипноза вырвана. Странно.'] },
      { id: 'window', name: 'Окно', rect: [230, 26, 44, 58], walk: [252, 132], face: 'n', look: 'Окно с жалюзи. Сибил держит их закрытыми, чтобы пациенты не видели, как хорошо живут остальные.' },
      { id: 'plant', name: 'Фикус', rect: [240, 82, 32, 40], walk: [252, 134], face: 'n', look: 'Фикус. Выглядит спокойнее всех пациентов, вместе взятых.', talk: 'Как вы себя чувствуете, фикус? Он молчит. Классическое вытеснение.' }
    ],
    actors: {
      sybil: {
        name: 'Сибил', dist: 28, when: g => g.actors.sybil.visible,
        look: 'Сибил Пандемик. Высокая причёска, очки «кошачий глаз» и взгляд человека, который видел всё. И выписал за это счёт.',
        talk: function* (g) {
          if (g.f.assocWaiting) { yield g.talkTo('assoc'); return; }
          yield g.talkTo('sybil');
        },
        items: {
          form: function* (g) {
            if (!g.f.testsExplained) { g.used['sybil.form'] = 1; yield* S.exec1(g, TALK.sybil.options.find(o => o.id === 'form').run); return; }
            yield g.say('sybil', 'Сначала тесты, потом подпись. Бюрократия, Сэм.');
          },
          gun: function* (g) {
            if (g.f.assocWaiting) { yield* respond(g, true, 'gun'); return; }
            yield g.say('sybil', 'Уберите оружие, Сэм. Агрессию я лечу за отдельную плату.');
          },
          glove: function* (g) {
            if (g.f.assocWaiting) { yield* respond(g, true, 'glove'); return; }
            yield g.say('sybil', 'Вы хотите меня ударить? Интересно. Расскажите об этом подробнее. Лёжа.');
          },
          launcher: 'Газом в психотерапевта? Проблем от этого только прибавится.',
          max: function* (g) { yield g.say('max', 'Доктор, я иногда хочу кого-нибудь укусить. Это нормально?'); yield g.say('sybil', 'Для вас? Это признак здоровья, Макс.'); }
        }
      },
      peepers: {
        name: g => g.f.sybilFree ? 'Пиперс' : 'Доктор Сибил', dist: 26,
        walk: g => (g.f.peepersRunning && !g.f.peepersGassed) ? null : undefined,
        look: g => g.f.peepersCured ? 'Пиперс. Проморгался и вылечился. Глаза всё ещё как два яйца всмятку, но уже осмысленных.' : g.f.sybilFree ? 'Пиперс из «Сода-Попперов». Глаза как два яйца всмятку. Носится как испуганный таракан.' : '«Доктор Сибил». В парике, с глазами размером с блюдца и ростом мне по пояс. Что-то тут не так.',
        talk: function* (g) {
          if (g.f.peepersCured) { yield g.say('peepers', 'Спасибо, что стукнули!'); yield g.say('peepers', 'Брэди держит нас в каком-то приюте. Возят туда в фургоне. Окон нет. Телевизор есть.'); return; }
          if (g.f.peepersGassed) { yield g.say('peepers', 'Ничего не вижу! Кто здесь? Мама?'); return; }
          if (g.f.sybilFree) { yield g.say('peepers', 'Не догонишь! Смотрите в глаза! На бегу!'); return; }
          yield g.talkTo('fakesybil');
        },
        items: {
          launcher: function* (g) { if (!g.f.sybilFree) { yield g.say('sam', 'Сначала разберусь, кто тут доктор.'); return; } yield* gasPeepers(g); },
          glove: function* (g) {
            if (!g.f.sybilFree) { yield g.say('sam', 'Бить доктора до приёма невежливо.'); return; }
            if (!g.f.knowCure && !g.f.whizzerCured) { yield g.say('sam', 'Бить его, не зная, поможет ли это, я не стану.'); return; }
            if (!g.f.peepersGassed) { yield g.say('sam', 'Пока я замахнусь, он уже в соседнем квартале. Надо, чтобы он ничего не видел.'); return; }
            yield* punchPeepers(g);
          },
          gun: 'Нет. Он под гипнозом.',
          max: function* (g) { yield g.say('max', 'Я его догоню! ...Нет, не догоню. Он быстрее меня, Сэм! Это оскорбительно!'); }
        }
      }
    },
    setup(g) {
      const pp = g.actors.peepers, sy = g.actors.sybil;
      if (!g.f.sybilFree) { sy.visible = false; sy.room = 'sybil'; pp.v = 'wig'; pp.act = ''; pp.keepAct = false; g.place('peepers', 'sybil', 204, 162, 's'); }
      else {
        sy.visible = true; g.place('sybil', 'sybil', 238, 158, 'w'); sy.act = ''; sy.keepAct = false;
        if (pp.room === 'sybil') {
          if (g.f.peepersCured) { g.place('peepers', 'sybil', 112, 166, 's'); pp.act = ''; pp.keepAct = false; }
          else if (g.f.peepersGassed) { pp.act = 'gassed'; pp.keepAct = true; pp.scripted = true; }
          else { pp.act = 'run'; pp.keepAct = true; pp.scripted = false; }
        }
      }
      if (g.f.assoc && !g.f.assocWaiting) g.f.assoc = null;
      g.f.gasT = 0;
    },
    ambient: function* (g) {
      const spots = [[60, 184], [270, 186], [180, 190], [296, 150], [30, 140], [150, 136], [240, 176]];
      for (;;) {
        yield 0.3;
        const pp = g.actors.peepers;
        if (pp.room !== 'sybil' || !g.f.peepersRunning || g.f.peepersGassed || g.f.peepersCured || pp.scripted) continue;
        const sam = g.actors.sam;
        const d = Math.hypot(sam.x - pp.x, (sam.y - pp.y) * 1.5);
        if (pp.path && d >= 46) continue;
        {
          let best = spots[0], bd = -1;
          for (const s of spots) {
            const ds = Math.hypot(s[0] - sam.x, (s[1] - sam.y) * 1.5) + g.rng.next() * 60;
            if (ds > bd && Math.hypot(s[0] - pp.x, s[1] - pp.y) > 30) { bd = ds; best = s; }
          }
          g.walkTo('peepers', best[0], best[1], { speed: 1.3 });
        }
      }
    },
    onLoad(g) { ROOMS.sybil.setup(g); }
  };

  TALK.fakesybil = {
    options: [
      { id: 'doc', icon: 'q', text: 'Вы доктор Сибил?', run: function* (g) {
        yield g.say('peepers', 'Да! Доктор Сибил. Настоящая. Видите парик? То есть причёску. Настоящую.');
      } },
      { id: 'therapy', icon: 'q', text: 'Доктор, как вы лечите пациентов?', run: function* (g) {
        yield g.say('peepers', 'Просто. Пациент ложится, я включаю «Ай-Бо». Через час он здоров и хочет ещё кассету.');
      } },
      { id: 'eyes', icon: 'eye', text: 'Почему у вас такие огромные глаза?', run: function* (g) {
        yield g.say('peepers', 'Чтобы лучше видеть! Кто подходит, от того я убегаю. Всегда.');
      } },
      { id: 'closet', icon: 'ex', text: 'Что у вас в шкафу грохочет?', run: function* (g) {
        yield g.say('peepers', 'Ничего! Там трудный пациент. Не открывать! Ни в коем случае!');
      } },
      { id: 'bye', icon: 'bye', text: 'Я, пожалуй, пойду.', end: true, run: function* (g) { yield g.say('peepers', 'Приходите ещё! Смотрите в глаза!'); } }
    ]
  };

  ROOMS.dreamtest = {
    id: 'dreamtest', name: 'Сон', w: 320, music: 'dream', dream: true, noSave: true,
    paint: (b) => S.BG.sybil(b, { dream: true }),
    walk: [[6, 126, 316, 126, 316, 198, 6, 198]],
    layers: [{ id: 'chair', src: 'sybil', x: 176, y: 104, base: 158 }],
    sprites(g) {
      const d = g.f.dt || { box: 0 };
      return [{ y: 150, draw: (f, cx) => {
        S.blit(f, S.icon(BOX[d.box]), 230 - cx, 118);
      } }];
    },
    hot: [
      { id: 'door', name: 'Дверь', rect: [4, 36, 38, 112], walk: [40, 168], face: 'w', look: 'Дверь. Ведёт обратно на кушетку.', exit: function* (g) { yield* endDreamTest(g); } },
      { id: 'box', name: g => BOX_NAME[BOX[(g.f.dt || { box: 0 }).box]], rect: [226, 114, 30, 26], walk: [236, 160], face: 'n',
        look: g => BOX_NAME[BOX[g.f.dt.box]] + '. Во сне вещи меняются, стоит их тронуть.',
        use: function* (g) { g.f.dt.box = (g.f.dt.box + 1) % BOX.length; g.sfx('flip'); yield g.say('sam', 'Теперь это ' + BOX_NAME[BOX[g.f.dt.box]].toLowerCase() + '.'); } },
      { id: 'chair', name: 'Кресло', rect: [176, 104, 46, 50], look: 'Кресло доктора. Во сне оно фиолетовое и немного дышит.' }
    ],
    actors: {
      dts: {
        name: 'Тёмный силуэт', dist: 30,
        look: g => 'Тёмный силуэт. Похоже на ' + WHO_NAME[WHO[g.f.dt.who]] + '.',
        use: function* (g) {
          g.f.dt.who = (g.f.dt.who + 1) % WHO.length;
          const a = g.actors.dts; a.costume = WHO[g.f.dt.who];
          g.sfx('flip');
          yield g.say('sam', 'Теперь силуэт похож на ' + WHO_NAME[WHO[g.f.dt.who]] + '.');
        },
        talk: function* (g) { yield g.say('sam', 'Кто вы?'); yield g.say('dts', 'Я символ. Не задавай вопросов, Сэм. Спи.'); }
      }
    },
    setup(g) {
      if (!g.f.dt) g.f.dt = { who: 0, box: 0 };
      const a = g.actors.dts;
      a.costume = WHO[g.f.dt.who]; a.solid = C.black; a.visible = true;
      g.place('dts', 'dreamtest', 150, 176, 's');
    },
    onLoad(g) { ROOMS.dreamtest.setup(g); }
  };

  S.exec1 = function* (g, fn) { yield* g.exec(fn, 'x'); };
  S.sybilTests = { INK, WORDS, WHO, BOX, makeWords };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
