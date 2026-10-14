(function (S) {
  'use strict';
  const E = S.EP102;
  const { ROOMS, TALK } = E;

  const QUESTIONS = [
    { q: '«Сколько весит тень от облака над Небраской в четверг?»', a: ['Три фунта.', 'Столько же, сколько облако.', 'Смотря какой четверг.', 'Небраски не существует.'] },
    { q: '«Как звали собаку второго помощника изобретателя скрепки?»', a: ['Скрепка.', 'Бобик.', 'Помощник Второй.', 'У него была кошка.'] },
    { q: '«Какое число я загадал в семьдесят девятом году?»', a: ['Семь.', 'Семьдесят девять.', 'Число «пи».', 'Вы загадали желание.'] },
    { q: '«О чём думал машинист поезда, который вышел из Чикаго в шесть утра?»', a: ['О кофе.', 'О Детройте.', 'О поезде.', 'Ни о чём. Он спал.'] }
  ];
  const LETTERS = ['ans_a', 'ans_b', 'ans_c', 'ans_d'];
  const COLOR_LINE = {
    red: ['Красный. Цвет смелости и солнечного ожога.'],
    green: ['Зелёный. Цвет гармонии. И салата.'],
    blue: ['Синий. Цвет спокойствия.'],
    '': ['Обычный. Цвет меня. Самый трудный фокус из всех.']
  };

  function hughSay(g, text) { return g.say('hugh', text); }

  function* consolation(g) {
    const h = g.actors.hugh;
    g.sfx('sting');
    yield hughSay(g, 'Увы! Вы никогда не станете миллионером!');
    if (!g.has('coin') && !g.has('paper') && !g.f.proofPaper) {
      g.give('coin');
      yield hughSay(g, 'Утешительный приз: пятьдесят центов и чувство глубокого покоя.');
    } else yield hughSay(g, 'Утешительный приз: чувство глубокого покоя. Монеты сегодня кончились.');
    if (!g.f.cardsIn) {
      g.f.cardsIn = true;
      h.act = ''; h.keepAct = false;
      yield hughSay(g, 'Карточки отдыхают в прорези стойки. Им тоже нужен покой. А я между играми медитирую.');
    }
    h.act = 'magic'; h.keepAct = true;
    g.f.quizLost = true;
  }

  function* play(g) {
    const h = g.actors.hugh;
    if (g.f.quizWon) { yield hughSay(g, 'Второй миллион? Боюсь, вселенная этого не выдержит. И спонсор тоже.'); return; }
    yield g.walkTo('sam', 78, 150);
    g.face('sam', 'e');
    h.act = 'card'; h.keepAct = true;
    g.music('quiz');
    yield hughSay(g, 'Добро пожаловать в «Кто никогда не станет миллионером»! Один вопрос. Один миллион. Ноль шансов.');
    g.sfx('sting');
    if (g.f.cardsSwapped) {
      yield hughSay(g, 'Вопрос на миллион долларов...');
      yield hughSay(g, '«Я синий?»');
      yield hughSay(g, 'Хм. Раньше вопросы были длиннее.');
      yield g.talkTo('quizlyric');
      return;
    }
    const i = (g.count('quizq') - 1) % QUESTIONS.length;
    g.f.quizQ = i;
    yield hughSay(g, 'Вопрос на миллион долларов: ' + QUESTIONS[i].q);
    yield g.talkTo('quizq');
  }

  TALK.quizq = {
    options: g => QUESTIONS[g.f.quizQ || 0].a.map((t, k) => ({
      id: 'a' + k, icon: LETTERS[k], text: t, end: true,
      run: function* (gg) {
        yield hughSay(gg, 'Ответ «' + t.replace('.', '') + '». Окончательный?');
        yield gg.say('sam', 'Окончательный. Как и всё в моей жизни.');
        yield 0.8;
        yield hughSay(gg, 'Правильный ответ... его никто не знает.');
        yield* consolation(gg);
      }
    }))
  };

  function* winQuiz(g) {
    const h = g.actors.hugh;
    g.sfx('chime');
    g.sfx('cheer');
    yield hughSay(g, 'Это... правильный ответ. Первый миллионер за всю историю передачи.');
    yield hughSay(g, 'Я чувствую... тревогу. Непривычное чувство. Оставлю его себе.');
    yield g.say('director', 'Миллион выдаём продовольственными талонами! Спонсор так захотел.');
    g.give('stamps');
    g.f.quizWon = true;
    h.act = ''; h.keepAct = false;
    yield g.say('max', 'Мы богаты, Сэм! Мы можем купить миллион обедов!');
    yield g.say('sam', 'Или одну очень дорогую глупость у лорда Рамплботтома.');
  }

  TALK.quizlyric = {
    options: [
      { id: 'yes', icon: 'yes', text: 'Да, Хью, вы синий.', end: true, run: function* (g) {
        if (g.f.hughColor === 'blue') { yield hughSay(g, 'Да... Я синий. Как неожиданно правильно.'); yield* winQuiz(g); return; }
        yield hughSay(g, 'Синий? Я ' + E.COLOR_NAME[g.f.hughColor || ''] + ', Сэм. Посмотрите внимательнее.');
        yield* consolation(g);
      } },
      { id: 'no', icon: 'no', text: 'Нет, Хью, вы не синий.', end: true, run: function* (g) {
        if (g.f.hughColor !== 'blue') { yield hughSay(g, 'Нет. Я не синий. Какая простая истина.'); yield* winQuiz(g); return; }
        yield hughSay(g, 'Не синий? Сэм, я синий с головы до пят.');
        yield* consolation(g);
      } }
    ]
  };

  function* recolor(g, c) {
    const h = g.actors.hugh;
    if ((g.f.hughColor || '') === c) { yield hughSay(g, 'Я и так такой. Вселенная не любит повторов.'); return; }
    h.act = 'magic'; h.actT = 1.2;
    g.sfx('chime');
    yield hughSay(g, 'Вдох... выдох...');
    g.fx.flash = 0.35;
    g.f.hughColor = c;
    h.v = c;
    yield hughSay(g, COLOR_LINE[c][0]);
    if (c === 'blue' && !g.seen.blueJoke) {
      g.seen.blueJoke = 1;
      yield g.say('sam', 'У нас в районе про синих говорят кое-что другое.');
      yield hughSay(g, 'Я не пью, Сэм. Я просто синий.');
    }
  }

  function* photo(g) {
    const d = g.actors.director;
    if (g.f.photoGiven) { yield g.say('sam', 'Одной фотографии для скандала хватит.'); return; }
    yield hughSay(g, 'Конечно. Фотография ловит мгновение. Мгновения, как и люди, бывают разного цвета.');
    yield g.walkTo('sam', 200, 160);
    g.face('sam', 's');
    d.act = 'photo'; d.keepAct = true;
    yield g.say('director', 'Улыбочку! Скажите «сыр»!');
    yield g.say('max', 'Сы-ы-ыр!');
    g.sfx('shutter');
    g.fx.flash = 0.8;
    yield 0.6;
    d.act = ''; d.keepAct = false;
    if (g.has('photo')) g.drop('photo');
    g.f.photoColor = g.f.hughColor || '';
    g.give('photo');
    const c = g.f.photoColor;
    if (c === 'green') yield g.say('sam', 'Хью на снимке зелёный. Вылитый пришелец с обложки.');
    else yield g.say('sam', 'Снимок готов. Хью на нём ' + E.COLOR_NAME[c] + '.');
  }

  TALK.hugh = {
    start: function* (g) {
      const h = g.actors.hugh;
      if (h.act === 'magic') { h.act = ''; h.keepAct = false; }
      if (!g.seen.hughHi) { g.seen.hughHi = 1; yield hughSay(g, 'Добро пожаловать, друзья. Я Хью Блисс. Здесь никто никогда не становится миллионером. В этом своя красота.'); }
    },
    end: function* (g) { const h = g.actors.hugh; if (g.f.quizLost && !g.f.quizWon) { h.act = 'magic'; h.keepAct = true; } },
    options: (g, d) => {
      if (d.data.menu === 'trick') {
        return [
          { id: 'red', icon: 'sw_red', text: 'Станьте красным.', run: function* (gg) { yield* recolor(gg, 'red'); } },
          { id: 'green', icon: 'sw_green', text: 'Станьте зелёным.', run: function* (gg) { yield* recolor(gg, 'green'); } },
          { id: 'blue', icon: 'sw_blue', text: 'Станьте синим.', run: function* (gg) { yield* recolor(gg, 'blue'); } },
          { id: 'norm', icon: 'sw_skin', text: 'Станьте обычным.', run: function* (gg) { yield* recolor(gg, ''); } },
          { id: 'mindmax', icon: 'f:max', text: 'Прочтите мысли Макса.', run: function* (gg) {
            yield hughSay(gg, 'Прикоснусь к мыслям кролика...');
            yield hughSay(gg, 'О боже. Это невыразимо порочно.');
            yield gg.say('max', 'Спасибо! Я долго над этим работал!');
          } },
          { id: 'mindsam', icon: 'mind', text: 'Прочтите мои мысли.', run: function* (gg) {
            if (gg.f.cardsSwapped) yield hughSay(gg, 'Вы думаете... о песне. Странно. Мне почему-то тревожно.');
            else yield hughSay(gg, 'Вы думаете о пончиках. И о том, как стать миллионером. Второе вряд ли.');
          } },
          { id: 'back', icon: 'bye', text: 'Хватит фокусов.', run: function* () { d.data.menu = null; } }
        ];
      }
      return [
        { id: 'who', icon: 'f:hugh', text: 'Кто вы такой?', run: function* (gg) { yield hughSay(gg, 'Хью Блисс. Ведущий. Немного целитель, немного фокусник. В основном ведущий.'); } },
        { id: 'rules', icon: 'q', text: 'Как у вас играют?', run: function* (gg) {
          yield hughSay(gg, 'Я задаю один вопрос. Ответите верно, получите миллион. Вопросы составлены так, что ответа не знает никто. Даже я. Особенно я.');
          yield hughSay(gg, 'Это передача о смирении, Сэм. Зрителям нравится смотреть, как смиряются другие.');
        } },
        { id: 'trick', icon: 'star', text: 'Покажите фокус!', run: function* (gg) {
          yield hughSay(gg, 'Какой? Я умею менять цвет и читать мысли. Остальное делает режиссёрша.');
          d.data.menu = 'trick';
        } },
        { id: 'photo', icon: 'camera', text: 'Можно с вами сфотографироваться?', when: gg => !gg.f.photoGiven, end: true, run: function* (gg) { gg.endDialog(); yield* photo(gg); } },
        { id: 'myra', icon: 'f:myra', text: 'Вы знаете Майру Стамп?', run: function* (gg) {
          yield hughSay(gg, 'Майра всегда светилась изнутри. Последние три дня светится тревожно. Я чувствую в её студии чужую ауру.');
          yield hughSay(gg, 'Плюшевую.');
        } },
        { id: 'play', icon: 'money', text: 'Давайте сыграем!', end: true, when: gg => !gg.f.quizWon, run: function* (gg) { gg.endDialog(); yield* play(gg); } },
        { id: 'bye', icon: 'bye', text: 'Нам пора.', end: true, run: function* (gg) { yield hughSay(gg, 'Идите с миром. Или просто идите.'); } }
      ];
    }
  };

  TALK.dirquiz = {
    options: [
      { id: 'when', icon: 'f:director', text: 'Как вы всё успеваете?', run: function* (g) { yield g.say('director', 'Я не сплю с девяносто третьего года. Сон у нас ушёл к Майре раньше всех.'); } },
      { id: 'why', icon: 'q', text: 'Зачем передача, где никто не выигрывает?', run: function* (g) { yield g.say('director', 'Экономия. Призовой фонд у нас пятьдесят центов. Утешительный.'); } },
      { id: 'bye', icon: 'bye', text: 'Не будем мешать.', end: true, run: function* (g) { yield g.say('director', 'Вы не мешаете. Вы рейтинг.'); } }
    ]
  };

  function* swapCards(g) {
    if (!g.f.cardsIn) { yield g.say('sam', 'Карточки у Хью в руках. Сначала надо, чтобы он их отложил. Проще всего проиграть.'); return; }
    if (g.f.cardsSwapped) { yield g.say('sam', 'Слова песни уже лежат в прорези.'); return; }
    const h = g.actors.hugh;
    h.act = 'magic'; h.keepAct = true;
    yield g.anim('sam', 'reach', 0.6);
    g.drop('lyrics');
    g.give('cards');
    g.f.cardsSwapped = true;
    g.sfx('pickup');
    yield g.say('sam', 'Меняю вопросы Хью на вопросы Пиперса. Одна философия на другую.');
    yield g.say('max', 'Он даже глаза не открыл! Вот это медитация!');
  }

  ROOMS.quiz = {
    id: 'quiz', name: 'Площадка «Кто никогда не станет миллионером»', w: 320, music: 'quiz',
    paint: b => S.BG.quiz(b),
    walk: [[4, 140, 316, 140, 316, 198, 4, 198]],
    layers: [
      { id: 'player', x: 56, y: 112, base: 160 },
      { id: 'host', x: 220, y: 112, base: 160, key: g => (g.f.cardsIn ? 'i' : '') + (g.f.cardsSwapped ? 's' : '') }
    ],
    hot: [
      { id: 'exit', name: 'Выход в коридор', rect: [0, 44, 22, 90], walk: [18, 172], face: 'w', look: 'Дверь за кулисы. Табличка: «Проигравшим налево». Выход тоже налево.',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('warp', { x: 465, y: 150, dir: 's' }); } },
      { id: 'board', name: 'Табло выигрышей', rect: [116, 10, 88, 104], look: 'Табло выигрышей: от ста долларов до миллиона. Все ступеньки, кроме последней, заклеены изолентой. Вопрос здесь один.' },
      { id: 'signs', name: 'Вывеска', rect: [26, 20, 86, 12], look: '«Кто никогда не станет миллионером». Название честное. Редкость для телевидения.' },
      { id: 'signs2', name: 'Вывеска', rect: [208, 20, 110, 12], look: 'Вторая половина названия. Раньше тут висело «Кто хочет», но спонсор счёл это обманом.' },
      { id: 'player', name: 'Стойка игрока', rect: [56, 112, 46, 36], walk: [78, 150], face: 'e',
        look: 'Стойка игрока. Четыре кнопки: A, B, C и D. Судя по потёртостям, никто так и не нашёл правильную.',
        use: function* (g) { yield* play(g); } },
      { id: 'slot', name: 'Прорезь в стойке ведущего', rect: [230, 110, 26, 8], walk: [210, 160], face: 'e', over: true,
        look: g => g.f.cardsSwapped ? 'В прорези лежат слова песни Пиперса. Хью ничего не заметил. Он вообще мало что замечает, кроме своей ауры.' : g.f.cardsIn ? 'Из прорези торчат карточки с вопросами.' : 'Прорезь в стойке ведущего. Пустая. Карточки Хью держит в руках.',
        use: function* (g) {
          if (g.f.cardsSwapped) { yield g.say('sam', 'Пусть лежат. Там теперь моя победа.'); return; }
          if (g.f.cardsIn) { yield g.say('sam', 'Украсть карточки? Там одни вопросы, ответов на них нет. Я проверял. Украду эти, Хью достанет запасные.'); return; }
          yield g.say('sam', 'Прорезь пустая. Карточки у Хью.');
        },
        items: { lyrics: function* (g) { yield* swapCards(g); }, cards: 'Возвращать Хью его вопросы? Тогда мне никогда не стать миллионером. Как и обещает название.' } },
      { id: 'host', name: 'Стойка ведущего', rect: [220, 120, 46, 40], walk: [210, 164], face: 'e', over: true, look: 'Стойка ведущего. На ней табличка «ХЬЮ» и прорезь для карточек.', use: 'Ведущему не понравится, если я встану на его место. Хотя ведущий в медитации, ему всё равно.' }
    ],
    actors: {
      hugh: {
        name: 'Хью Блисс', walk: [206, 160], face: 'e', dist: 24,
        look: g => 'Хью Блисс. Белый костюм, пурпурная лента, улыбка человека, у которого нет налоговой. Сейчас он ' + E.COLOR_NAME[g.f.hughColor || ''] + '.',
        talk: function* (g) { yield g.talkTo('hugh'); },
        items: {
          lyrics: function* (g) { yield hughSay(g, '«Я синий? Кто ты такой?» Прекрасные вопросы. Жаль, у нас в передаче вопросы потруднее.'); },
          cards: function* (g) { yield hughSay(g, 'Мои карточки? Оставьте себе. У меня их коробка. Вопросов без ответов на свете много.'); },
          coin: function* (g) { yield hughSay(g, 'Утешительный приз не возвращают. Утешение уже случилось.'); },
          gun: function* (g) { yield hughSay(g, 'Вы целитесь в мою ауру, Сэм. Ей щекотно.'); },
          photo: function* (g) { yield hughSay(g, 'Прекрасный снимок. На нём видно, какого я был цвета. Я уже не помню.'); },
          max: function* (g) { yield g.say('max', 'Хью, а меня перекрасить можно?'); yield hughSay(g, 'Кролика? Боюсь, у вас внутри такой цвет, что снаружи его лучше не показывать.'); }
        }
      },
      director: {
        name: 'Режиссёрша', walk: [276, 176], face: 'e', dist: 22, when: g => g.actors.director.room === 'quiz',
        look: 'Режиссёрша с поляроидом на шее. Уже тут. Разумеется.',
        talk: function* (g) { yield g.talkTo('dirquiz'); }
      }
    },
    setup(g) {
      const h = g.actors.hugh;
      g.place('hugh', 'quiz', 242, 150, 'w');
      h.v = g.f.hughColor || '';
      if (g.f.quizLost && !g.f.quizWon) { h.act = 'magic'; h.keepAct = true; } else { h.act = ''; h.keepAct = false; }
      g.place('director', 'quiz', 300, 176, 'w');
    },
    enter: function* (g) {
      if (!g.seen.quizFirst) {
        g.seen.quizFirst = 1;
        yield g.say('max', 'Сэм, спорим, она уже и у Майры в зале сидит?');
        yield g.say('sam', 'Не спорим. Не люблю проигрывать.');
      }
    },
    onLoad(g) { ROOMS.quiz.setup(g); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
