(function (S) {
  'use strict';
  const E = S.EP102;
  const { ROOMS, TALK } = E;

  const IDENT = {
    lampshade: [
      { id: 'chef', icon: 'chef', text: 'Это наш повар, мистер Фезерли.' },
      { id: 'lincoln', icon: 'tophat', text: 'Президент Линкольн. Он у нас проездом.' },
      { id: 'prince', icon: 'crown', text: 'Принц Верхнего Тромбоза. Инкогнито.' }
    ],
    plate: [
      { id: 'saint', icon: 'halo', text: 'Это святая. Видите нимб?' },
      { id: 'circus', icon: 'juggle', text: 'Циркачка. Крутит тарелки, не касаясь руками.' }
    ],
    cream: [
      { id: 'uncle', icon: 'beard', text: 'Дядюшка Грисволд из Техаса. Не брился с восемьдесят второго.' }
    ]
  };
  const REPLY = {
    chef: ['Повар! Наконец-то в этом доме кто-то готовит.', 'Шеф, что у нас на ужин? Я не ел с самого утра.'],
    lincoln: ['Господин президент! Какая честь.', 'Раз уж вы здесь, не могли бы вы заплатить за квартиру? Ковбои не платят с апреля.'],
    prince: ['Ваше высочество! В Тромбозе, видимо, не принято стучаться.', 'Как и платить за свет, судя по счетам ваших друзей.'],
    saint: ['Святая? В моём доме? Какое благословение.', 'Немедленно поднимаю арендную плату. За чудеса.'],
    circus: ['Циркачка! Прошу вас, никаких тарелок над моим паркетом.', 'Паркет у меня дубовый, а тарелки, как я погляжу, казённые.'],
    uncle: ['Дядюшка Грисволд! Ну и борода.', 'Вы, должно быть, прямо с перегона скота. Пахнет, во всяком случае, перегоном.']
  };
  const WHOM = { lincoln: 'президента', prince: 'принца', saint: 'святой', circus: 'циркачки', uncle: 'дядюшки' };
  const FILLER = ['Бла-бла-бла, пункт седьмой договора, бла-бла...', 'Так, бла-бла, трещина на потолке, бла-бла-бла...', 'Бла-бла, ковбои, бла, соседи снизу, бла-бла...'];

  function laugh(g, big) {
    g.sfx('laughtrack');
    if (big) g.sfx('applause');
    if (g.f.take) g.f.take.laughT = g.time;
    g.f.laughT = g.time;
  }

  function lampshadeOnLamp(g) {
    const t = g.f.take;
    return !g.has('lampshade') && !(t && t.dis === 'lampshade');
  }

  function resetSet(g) {
    g.f.take = null;
    g.drop('lampshade');
    g.drop('plate');
    const b = g.actors.bessy, ph = g.actors.philo;
    b.v = ''; b.act = ''; b.keepAct = false;
    ph.v = ''; ph.act = ''; ph.keepAct = false; ph.scripted = false;
    g.place('bessy', 'sitcom', 150, 170, 'w');
    g.place('philo', 'sitcom', 240, 162, 'w');
  }

  function* cut(g, line) {
    if (line) yield g.say('director', line);
    g.sfx('buzzer');
    yield g.say('director', 'Стоп! Снято не будет. По местам, дубль ' + ((g.f.takeNo || 0) + 1) + '.');
    resetSet(g);
    if (!g.seen.cutPhilo) { g.seen.cutPhilo = 1; yield g.say('philo', 'Опять. В Ливерпуле мне хотя бы давали доиграть до антракта.'); }
  }

  function* filler(g) {
    if (!g.f.take || g.actors.philo.room !== 'sitcom') return;
    yield g.say('philo', FILLER[(g.count('filler') - 1) % FILLER.length]);
  }

  function* startTake(g) {
    const n = (g.f.takeNo || 0) + 1;
    g.f.takeNo = n;
    g.f.take = { n, dis: null, id: null, served: false, answered: false, clock: 0, laughT: 0 };
    const d = g.actors.director, ph = g.actors.philo;
    d.act = 'clap'; d.actT = 0.9;
    g.sfx('click');
    yield g.say('director', '«Ковбои из центра», сцена первая, дубль ' + n + '. Мотор!');
    ph.scripted = true;
    ph.v = 'featherly';
    g.place('philo', 'sitcom', 276, 150, 'w');
    g.sfx('door');
    yield g.walkTo('philo', 236, 164);
    g.face('philo', 'w');
    yield g.say('philo', 'Добрый вечер, ковбои! Плановая проверка квартиры.');
    laugh(g);
    yield g.say('philo', 'Соседи снизу жалуются, что у вас по ночам кто-то мычит.');
    laugh(g);
    ph.scripted = false;
  }

  function* noticeCow(g) {
    if (!g.f.take || g.f.take.dis) return;
    yield g.say('philo', 'Погодите-ка. Эти рога... это вымя... Это же КОРОВА!');
    g.actors.philo.act = 'shock'; g.actors.philo.actT = 1;
    yield* cut(g, null);
  }

  function* disguise(g, item) {
    const t = g.f.take, b = g.actors.bessy;
    if (!t) { yield g.say('sam', 'Переодевать корову без камеры? Это уже что-то личное.'); return; }
    if (t.dis) { yield g.say('sam', 'Бесси уже в образе. Второй образ за серию будет перебором даже для неё.'); return; }
    yield g.anim('sam', 'reach', 0.6);
    if (item !== 'cream') g.drop(item);
    b.v = item;
    t.dis = item;
    g.sfx(item === 'cream' ? 'spray' : 'pop');
    laugh(g);
    yield g.say('philo', 'А это у вас кто? Какая... внушительная особа.');
    yield g.talkTo('ident');
  }

  TALK.ident = {
    options: g => {
      const t = g.f.take || { dis: 'lampshade' };
      return (IDENT[t.dis] || []).concat([{ id: 'cow', icon: 'cow', text: 'Это корова, мистер Фезерли.' }]).map(o => ({
        id: o.id, icon: o.icon, text: o.text, end: true,
        run: function* (gg) {
          const tk = gg.f.take;
          if (!tk) return;
          if (o.id === 'cow') {
            yield gg.say('philo', 'Корова?! В моём доме?! Я так и знал!');
            gg.actors.philo.act = 'shock'; gg.actors.philo.actT = 1;
            yield* cut(gg, null);
            return;
          }
          tk.id = o.id;
          const [a, b] = REPLY[o.id];
          yield gg.say('philo', a);
          laugh(gg);
          yield gg.say('philo', b);
          laugh(gg);
          const seen = gg.f.idents = gg.f.idents || {};
          seen[o.id] = 1;
          if (Object.keys(seen).length === 6 && !gg.seen.sixIdents) {
            gg.seen.sixIdents = 1;
            yield gg.say('director', 'Шесть личностей у одной коровы. Этой серии нужен психотерапевт. Где там была Сибил?');
          }
          if (o.id !== 'chef') yield gg.say('director', 'Мило. Только куда вы ведёте сцену? Зрителю нужна кухня, кухня всегда смешная.');
        }
      }));
    }
  };

  function* serve(g) {
    const t = g.f.take, ph = g.actors.philo, b = g.actors.bessy;
    if (!t) { yield g.say('sam', 'Собирать лепёшки вне кадра я не нанимался.'); return; }
    if (t.served) return;
    if (t.id !== 'chef') {
      yield g.anim('sam', 'reach', 0.5);
      yield g.say('philo', t.id ? 'Вы предлагаете мне лепёшку? От имени ' + WHOM[t.id] + '?' : 'Вы суёте мне тарелку с... этим?');
      yield* cut(g, 'Лепёшку подают только от лица повара! Это логика ситкома!');
      return;
    }
    yield g.anim('sam', 'reach', 0.6);
    g.sfx('splat');
    g.drop('plate');
    t.served = true;
    yield g.say('sam', 'Фирменное блюдо нашего шефа, мистер Фезерли. Прямо с плиты.');
    laugh(g);
    ph.scripted = true;
    yield g.walkTo('sam', ph.x - 22, ph.y + 1);
    g.face('sam', 'e');
    g.face('philo', 'w');
    ph.act = 'eat'; ph.actT = 1.4;
    g.sfx('eat');
    yield 1.3;
    yield g.say('philo', 'Хм. Землистое. С дымком. С характером. Шеф, это восхитительно!');
    laugh(g);
    yield g.say('philo', 'Я должен лично пожать шефу руку!');
    yield g.walkTo('philo', b.x + 38, b.y - 1);
    g.face('philo', 'w');
    ph.act = 'pull'; ph.actT = 0.8;
    yield 0.5;
    b.act = 'moo'; b.actT = 1.4;
    g.sfx('moo');
    yield g.say('bessy', 'МУ-У-У-У!');
    laugh(g);
    yield g.say('philo', 'Какое своеобразное рукопожатие. Что сказал шеф?');
    ph.scripted = false;
    yield g.talkTo('moo');
  }

  TALK.moo = {
    options: [
      { id: 'mgp', icon: 'noodles', text: 'Он сказал: «Му-гу-гай-пань». Это следующее блюдо.', end: true, run: function* (g) {
        if (!g.f.take) return;
        yield g.say('philo', 'Му-гу-гай-пань! Курица с грибами! Обожаю курицу...');
        g.actors.philo.act = 'shock'; g.actors.philo.actT = 1.6;
        yield g.say('philo', 'Минуточку. Я же КУРИЦА!');
        laugh(g, true);
        g.f.take.answered = true;
        yield g.say('director', 'Кролик! Спонсор! Сейчас!');
      } },
      { id: 'moo', icon: 'cow', text: 'Он сказал «му».', end: true, run: function* (g) {
        yield g.say('philo', 'Повар, который говорит «му»? Да это же корова!');
        yield* cut(g, null);
      } },
      { id: 'thanks', icon: 'heart', text: 'Он говорит: «Приятного аппетита».', end: true, run: function* (g) {
        yield g.say('philo', 'По-моему, он сказал «му». У меня, ковбои, слух как у налогового инспектора.');
        yield* cut(g, null);
      } },
      { id: 'rent', icon: 'money', text: 'Он спрашивает, когда вы вернёте залог.', end: true, run: function* (g) {
        yield g.say('philo', 'Залог? Какой ещё залог? Этого не было в сценарии.');
        yield* cut(g, 'Сценария нет вообще!');
      } }
    ]
  };

  E.sitcomWrap = function* (g) {
    const t = g.f.take;
    const max = g.actors.max, ph = g.actors.philo, d = g.actors.director;
    if (!t) { yield g.say('max', 'Реплика? Какая реплика? Камера же не крутится!'); return; }
    max.scripted = true;
    yield g.walkTo('max', ph.x - 24, ph.y + 2);
    g.faceTo('max', ph.x);
    if (!t.answered) {
      yield g.say('max', 'Мистер Фезерли, вам срочно нужна зубная паста «Серьёзная»!');
      max.scripted = false;
      yield* cut(g, 'Рано! Спонсор идёт после смеха. Всегда после!');
      return;
    }
    max.act = 'grin'; max.actT = 1.5;
    yield g.say('max', 'Мистер Фезерли, после такого ужина вам срочно нужна зубная паста «Серьёзная»! Серьёзно!');
    laugh(g, true);
    yield g.say('philo', 'Какая... своевременная реклама.');
    laugh(g);
    max.scripted = false;
    yield 0.6;
    d.act = 'clap'; d.actT = 0.9;
    g.sfx('click');
    yield g.say('director', 'Снято! Это в эфир!');
    resetSet(g);
    g.f.tapeDone = true;
    g.f.staff = true;
    g.give('vtape');
    yield g.say('director', 'Держите копию. Серия ваша. Вы теперь в штате WARP, все площадки открыты. Меня ждут на трёх сразу.');
    yield g.say('philo', 'Му-гу-гай-пань... Я играл короля Лира. А сегодня меня кормила лепёшкой собака. И знаете? Это моя лучшая роль.');
    yield g.say('sam', 'Кассета у нас. Роль в сериале есть. Осталось запеть и влипнуть в скандал.');
  };

  TALK.dirsitcom = {
    options: [
      { id: 'plot', icon: 'q', text: 'Про что сериал?', run: function* (g) {
        yield g.say('director', 'Два ковбоя переехали в город вместе с коровой Бесси. Домовладелец мистер Фезерли животных не терпит.');
        yield g.say('director', 'Каждую серию ковбои прячут от него корову. Двенадцатый сезон, и ни разу не повторились. Почти.');
      } },
      { id: 'feather', icon: 'f:philo', text: 'Кто играет мистера Фезерли?', run: function* (g) {
        yield g.say('director', 'Фило Пенниуорт. Курица с классическим образованием. Играл Лира в Ливерпуле, теперь играет домовладельца. До сих пор нам этого не простил.');
      } },
      { id: 'rules', icon: 'ex', text: 'Что нам играть?', run: function* (g) {
        yield g.say('director', 'Импровизируйте. Сценарий ушёл к Майре вместе со звёздами.');
        yield g.say('director', 'Если Фезерли поймёт, что в квартире корова, серия сорвана. Сорвали, переснимаем. Плёнки у меня много.');
      } },
      { id: 'sponsor', icon: 'toothpaste', text: 'А что должен делать Макс?', run: function* (g) {
        yield g.say('director', 'Наш спонсор: зубная паста «Серьёзная». Кролик должен сказать в кадре: «Вам срочно нужна зубная паста "Серьёзная"!»');
        yield g.say('director', 'Там, где это уместно. Сразу после смеха. Если скажет раньше, переснимаем.');
        yield g.say('max', 'Я умею быть уместным! Иногда! Однажды было!');
        g.f.knowSponsor = true;
      } },
      { id: 'go', icon: 'camera', text: 'Мотор!', end: true, run: function* (g) {
        g.endDialog();
        yield* startTake(g);
      } },
      { id: 'bye', icon: 'bye', text: 'Нам надо подготовиться.', end: true, run: function* (g) {
        yield g.say('director', 'Готовьтесь. Реквизит на площадке, трогать можно. Корову трогать осторожно, у неё агент.');
      } }
    ]
  };

  TALK.dirtake = {
    options: [
      { id: 'how', icon: 'q', text: 'Как идёт?', run: function* (g) {
        const t = g.f.take;
        if (t && t.id && t.id !== 'chef') yield g.say('director', 'Смешно, но сцена стоит. Зрителю нужна кухня. Переснимите.');
        else yield g.say('director', 'Смешно. Не останавливайтесь, плёнка крутится.');
      } },
      { id: 'again', icon: 'ex', text: 'Давайте переснимем.', end: true, run: function* (g) {
        yield* cut(g, 'По просьбе актёров.');
      } },
      { id: 'bye', icon: 'bye', text: 'Продолжаем.', end: true }
    ]
  };

  TALK.philo = {
    options: [
      { id: 'who', icon: 'f:philo', text: 'Вы Фило Пенниуорт?', run: function* (g) {
        yield g.say('philo', 'Он самый. Королевская академия драматического искусства, выпуск шестьдесят восьмого года.');
        yield g.say('philo', 'Мой Лир заставлял рыдать критиков. Теперь я играю домовладельца с голосом кастрюли.');
      } },
      { id: 'role', icon: 'q', text: 'Как вам роль Фезерли?', run: function* (g) {
        yield g.say('philo', 'Жалкий, мелочный человек, который не отличает корову от квартиросъёмщика. Двенадцатый сезон.');
        yield g.say('philo', 'Иногда он мне снится в роли Макбета. Просыпаюсь в холодном поту.');
      } },
      { id: 'improv', icon: 'star', text: 'Вы нам подыграете?', run: function* (g) {
        yield g.say('philo', 'Юноша, я всегда подыгрываю. Кем бы ни была эта корова, принцем, святой или поваром, я поверю.');
        yield g.say('philo', 'Пока вы в образе, Фило Пенниуорт верит в предлагаемые обстоятельства. Если назовёте её коровой, я, увы, тоже поверю.');
      } },
      { id: 'food', icon: 'plate', text: 'Что вам дают есть на площадке?', once: true, run: function* (g) {
        yield g.say('philo', 'Здесь кормят исключительно реквизитом. На прошлой неделе я съел пластмассовую индейку. Целиком. Ради кадра.');
      } },
      { id: 'bye', icon: 'bye', text: 'Увидимся в кадре.', end: true, run: function* (g) { yield g.say('philo', 'В кадре меня не увидишь, мальчик мой. Увидишь Фезерли.'); } }
    ]
  };

  TALK.featherly = {
    options: [
      { id: 'health', icon: 'q', text: 'Как ваше здоровье, мистер Фезерли?', run: function* (g) {
        yield g.say('philo', 'Прекрасно, пока в доме нет животных. Животных же в доме нет, правда, ковбои?');
        laugh(g);
        if (g.f.take && !g.f.take.dis) yield g.say('philo', 'А что это там у вас за спиной... рогатое?');
      } },
      { id: 'weather', icon: 'cloud', text: 'Хорошая погода для перегона скота.', run: function* (g) {
        yield g.say('philo', 'Скота? Какого скота? В городе нет скота. Разве что соседи.');
        laugh(g);
      } },
      { id: 'bye', icon: 'bye', text: 'Всего доброго, мистер Фезерли.', end: true, run: function* (g) {
        yield g.say('philo', 'Я никуда не ухожу, ковбои. Проверка ещё не закончена.');
        laugh(g);
      } }
    ]
  };

  const bessyLook = { '': 'Корова Бесси, звезда сериала. Жуёт так, будто знает про нас что-то важное.', lampshade: 'Бесси в абажуре. Если не присматриваться, повар. Если присмотреться, корова в абажуре.', plate: 'Бесси с тарелкой-нимбом. Смотрит на меня с кротостью святой и аппетитом коровы.', cream: 'Бесси с бородой из пены. Вылитый дядюшка из Техаса.' };

  ROOMS.sitcom = {
    id: 'sitcom', name: 'Площадка «Ковбои из центра»', w: 320, music: 'sitcom',
    noSave: g => !!g.f.take,
    paint: b => S.BG.sitcom(b),
    walk: [[24, 146, 300, 146, 318, 160, 318, 198, 2, 198, 2, 160]],
    block: [[26, 148, 118, 148, 118, 160, 26, 160], [114, 146, 134, 146, 134, 154, 114, 154], [196, 150, 252, 150, 252, 162, 196, 162]],
    layers: [
      { id: 'sign', x: 114, y: 0, key: g => g.f.laughT && g.time - g.f.laughT < 1.4 ? 'on' : '' },
      { id: 'couch', x: 26, y: 112, base: 158 },
      { id: 'lamp', x: 116, y: 82, base: 152 },
      { id: 'lampshade', x: 114, y: 74, base: 153, when: g => lampshadeOnLamp(g) },
      { id: 'table', x: 196, y: 126, base: 160 },
      { id: 'plates', x: 212, y: 124, base: 161 },
      { id: 'cowpie', x: 180, y: 160, base: 161, when: g => !(g.f.take && g.f.take.served) },
      { id: 'camera', x: 270, y: 124, base: 202 }
    ],
    hot: [
      { id: 'exit', name: 'Выход в коридор', rect: [0, 40, 22, 96], walk: [16, 170], face: 'w',
        look: 'Дверь за кулисы. Над ней лампочка «Тихо, идёт съёмка». Лампочка перегорела в прошлом сезоне.',
        exit: function* (g) {
          if (g.f.take) yield* cut(g, 'Актёры не уходят со сцены посреди дубля!');
          else if (g.has('lampshade') || g.has('plate')) { g.drop('lampshade'); g.drop('plate'); yield g.say('sam', 'Реквизит оставлю на площадке. Здесь он нужнее.'); }
          g.sfx('door');
          yield* g.goRoom('warp', { x: 267, y: 150, dir: 's' });
        } },
      { id: 'sign', name: 'Табло «Аплодисменты»', rect: [114, 0, 92, 14], look: 'Табло «АПЛОДИСМЕНТЫ». Загорается, когда зрителю пора смеяться. Зрителей нет, смех записан на плёнку в шестьдесят третьем.' },
      { id: 'window', name: 'Окно', rect: [130, 28, 60, 54], walk: [160, 150], face: 'n', look: 'Нарисованный небоскрёб в нарисованном окне. На двенадцатом этаже нарисован кот. Кота видят не все.', use: 'Окно не открывается. Это картон.' },
      { id: 'skull', name: 'Коровий череп', rect: [46, 30, 50, 30], walk: [72, 150], face: 'n', look: 'Коровий череп на стене. Бесси старается на него не смотреть.', use: 'Не буду снимать. Бесси и так нервничает.' },
      { id: 'hats', name: 'Ковбойские шляпы', rect: [206, 42, 48, 16], walk: [230, 150], face: 'n', look: 'Три ковбойские шляпы на крючках. Звёзды забыли их, уходя к Майре.', use: 'Шляпу я не меняю. Даже ради двенадцатого сезона.' },
      { id: 'wallplate', name: 'Тарелка на стене', rect: [230, 64, 28, 18], walk: [238, 152], face: 'n', look: 'Декоративная тарелка с подковой. Приклеена намертво. Реквизиторы знают, кто у них снимается.' },
      { id: 'door', name: 'Дверь квартиры', rect: [262, 40, 36, 92], walk: [262, 152], face: 'e', look: 'Дверь квартиры номер двенадцать. Через неё в каждой серии входит мистер Фезерли.', use: 'Если я выйду через эту дверь, то окажусь за декорацией. Там только провода и прошлое.' },
      { id: 'couch', name: 'Диван', rect: [26, 112, 92, 46], walk: [72, 166], face: 'n', look: 'Зелёный диван с подушкой в виде ковбойского флага. На нём двенадцать сезонов сидели ковбои. Пружины это помнят.', use: 'Садиться некогда. Камера не любит сидящих.' },
      { id: 'lamp', name: g => lampshadeOnLamp(g) ? 'Лампа с абажуром' : 'Лампа', rect: [112, 72, 22, 80], walk: [124, 160], face: 'n',
        look: g => lampshadeOnLamp(g) ? 'Торшер с абажуром. Бахрома, цветочки. Если прищуриться, абажур похож на поварской колпак.' : 'Торшер без абажура. Светит голой правдой.',
        use: function* (g) {
          if (!lampshadeOnLamp(g)) { yield g.say('sam', 'Абажура на лампе нет.'); return; }
          yield g.anim('sam', 'reach', 0.5);
          g.give('lampshade');
          yield g.say('sam', 'Снимаю абажур. Реквизиторы простят. Надеюсь.');
          yield* filler(g);
        },
        items: { lampshade: function* (g) { g.drop('lampshade'); yield g.say('sam', 'Возвращаю абажур на место.'); } } },
      { id: 'table', name: 'Стол с тарелками', rect: [196, 118, 56, 42], walk: [224, 168], face: 'n',
        look: 'Обеденный стол ковбоев. Стопка тарелок из реквизита. Фаянс настоящий, еды не было никогда.',
        use: function* (g) {
          if (g.has('plate')) { yield g.say('sam', 'Одной тарелки хватит.'); return; }
          yield g.anim('sam', 'reach', 0.5);
          g.give('plate');
          yield g.say('sam', 'Беру тарелку.');
          yield* filler(g);
        },
        items: { plate: function* (g) { g.drop('plate'); yield g.say('sam', 'Кладу тарелку обратно в стопку.'); } } },
      { id: 'cowpie', name: 'Коровья лепёшка', rect: [180, 156, 22, 12], walk: [206, 172], face: 'w', when: g => !(g.f.take && g.f.take.served),
        look: 'Коровья лепёшка. Свежая. Реквизиторы клянутся, что не заказывали.',
        use: 'Голыми лапами? Нет. Нужна хоть какая-то посуда.',
        items: {
          plate: function* (g) { yield* serve(g); },
          gun: 'Стрелять в лепёшку? Брызги попадут в кадр, а кадр у нас семейный.',
          max: function* (g) { yield g.say('max', 'Даже я это есть не буду, Сэм. У меня есть принципы. Один.'); }
        } },
      { id: 'camera', name: 'Камера', rect: [270, 124, 50, 76], look: 'Камера номер один. Номер два и номер три ушли к Майре.', use: function* (g) { yield g.say('director', 'Не трогайте камеру! Она у нас одна, а я одна у неё.'); } }
    ],
    actors: {
      bessy: {
        name: 'Корова Бесси', walk: g => [g.actors.bessy.x - 34, g.actors.bessy.y + 1], face: 'e', dist: 34,
        look: g => bessyLook[g.actors.bessy.v || ''],
        talk: function* (g) {
          const n = g.count('bessytalk');
          yield g.say('sam', n === 1 ? 'Добрый вечер, Бесси.' : 'Как вы, Бесси?');
          g.actors.bessy.act = 'moo'; g.actors.bessy.actT = 0.9;
          g.sfx('moo');
          yield g.say('bessy', n === 1 ? 'Му.' : 'Му-у.');
          yield g.say('sam', n === 1 ? 'Взаимно.' : 'Понимаю. Работа нервная.');
          if (g.f.take && !g.f.take.dis) { g.f.take.clock = (g.f.take.clock || 0) + 10; yield g.say('philo', 'Кто это там мычит?'); }
        },
        use: g => g.f.take ? 'Гладить корову посреди съёмки? Это сбивает её с образа.' : 'Глажу Бесси. Она явно рассчитывала на гонорар побольше.',
        items: {
          lampshade: function* (g) { yield* disguise(g, 'lampshade'); },
          plate: function* (g) { yield* disguise(g, 'plate'); },
          cream: function* (g) { yield* disguise(g, 'cream'); },
          gun: 'Стрелять в звезду сериала? Её агент меня закопает.',
          launcher: 'Корова в слезах? Это драма. А у нас комедия.',
          max: function* (g) { yield g.say('max', 'Можно я на ней покатаюсь?'); yield g.say('sam', 'Не в кадре, Макс. И не вне кадра тоже.'); }
        }
      },
      philo: {
        name: g => g.actors.philo.v === 'featherly' ? 'Мистер Фезерли' : 'Фило Пенниуорт', walk: g => [g.actors.philo.x - 24, g.actors.philo.y + 1], face: 'e', dist: 24,
        look: g => g.actors.philo.v === 'featherly' ? 'Мистер Фезерли, домовладелец. Кардиган, очки и голос, которым можно пилить металл.' : 'Фило Пенниуорт. Курица с классическим образованием. Держится как король, которого разжаловали в квартирные хозяева.',
        talk: function* (g) { yield g.talkTo(g.f.take ? 'featherly' : 'philo'); },
        items: {
          max: function* (g) {
            if (!g.f.take) { yield g.say('max', 'Мистер курица, дайте автограф!'); yield g.say('philo', 'Позже, юноша. Когда вы прославитесь, автограф возьму я.'); return; }
            yield* E.sitcomWrap(g);
          },
          plate: function* (g) {
            if (!g.f.take) { yield g.say('philo', 'Пустая тарелка? Здесь так кормят всегда.'); return; }
            yield g.say('philo', 'Пустая тарелка, ковбои? Вы что, намекаете, что ужина не будет?');
            laugh(g);
          },
          gun: function* (g) { yield g.say('philo', 'Я играл под обстрелом критиков, юноша. Ваш пугач меня не впечатляет.'); },
          cream: function* (g) { yield g.say('philo', 'Пена для бритья? Мне? Я курица. Я не бреюсь. Я линяю.'); }
        }
      },
      director: {
        name: 'Режиссёрша', walk: [240, 184], face: 'e', dist: 24, when: g => g.actors.director.room === 'sitcom',
        look: 'Режиссёрша за камерой. Снимает, светит, пишет звук и, судя по всему, одновременно монтирует.',
        talk: function* (g) {
          if (g.f.tapeDone) { yield g.say('director', 'Серия готова, вы в штате. Идите на другие площадки, там тоже нужны люди. И я.'); return; }
          yield g.talkTo(g.f.take ? 'dirtake' : 'dirsitcom');
        },
        items: { gun: function* (g) { yield g.say('director', 'У нас семейная комедия. Стреляем только хлопушкой.'); } }
      }
    },
    setup(g) {
      if (!g.f.take) resetSet(g);
      if (g.f.hired) g.place('director', 'sitcom', 256, 186, 'w');
    },
    enter: function* (g) {
      if (!g.seen.dirTeleport && g.f.hired) {
        g.seen.dirTeleport = 1;
        yield g.say('sam', 'Как вы оказались здесь раньше нас?');
        yield g.say('director', 'Я всегда раньше всех. Это называется продюсирование.');
      }
    },
    ambient: function* (g) {
      for (;;) {
        yield 0.5;
        const t = g.f.take;
        if (!t || t.dis || g.busy || g.dialog) continue;
        t.clock = (t.clock || 0) + 0.5;
        if (t.clock >= 22 && !t.warned) { t.warned = true; g.run(function* () { yield g.say('philo', 'Что-то у вас тут пахнет... фермой.'); }, { name: 'warn' }); }
        if (t.clock >= 45) { t.clock = -1000; g.run(noticeCow, { name: 'notice' }); }
      }
    },
    onLoad(g) { ROOMS.sitcom.setup(g); }
  };

  E.sitcom = { startTake, cut, IDENT };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
