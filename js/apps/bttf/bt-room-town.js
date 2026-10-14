(function (S, B) {
  'use strict';
  const C = B.C;
  const E = B.EP1;
  const G = B.grey;
  const { ROOMS, TALK, LAYERS } = E;
  const { card } = B.games;

  LAYERS.kitchen = {
    counter: () => G.layer(308, 100, B.BG31.paintCounter),
    barrels: () => G.layer(92, 66, b => { const P = new S.Pen(b); for (let i = 0; i < 3; i++) B.BG31.barrel(P, 16 + i * 30, 40, 14, 22); P.line(2, 62, 90, 62, C.steel[2]); }),
    tables: () => G.layer(80, 60, b => { const P = new S.Pen(b); P.part(P.poly([2, 30, 78, 14, 78, 24, 2, 40]), C.plank, { b: 3 }); for (const x of [10, 60]) P.part(P.rect(x, 26 - x * 0.2, 7, 32), C.plank, { b: 2, sh: 0 }); P.part(P.poly([4, 42, 76, 30, 76, 36, 4, 48]), C.plank, { b: 2, sh: 0 }); }),
    loot: () => G.layer(70, 46, b => { const P = new S.Pen(b); B.BG31.barrel(P, 20, 24, 13, 20); B.BG31.barrel(P, 50, 24, 13, 20); })
  };

  ROOMS.kitchen = {
    id: 'kitchen', name: 'Столовая сестёр милосердия', w: 800, music: 'bt_kitchen',
    scale: [310, 0.9, 470, 1],
    paint: b => B.BG31.paintKitchen31(b),
    walk: [[20, 310, 780, 310, 792, 472, 8, 472]],
    block: [[170, 300, 490, 300, 490, 330, 170, 330]],
    layers: [
      { id: 'counter', x: 176, y: 204, base: 305 },
      { id: 'barrels', x: 524, y: 230, base: 300, when: g => g.f.barrels && !g.f.hooch },
      { id: 'tables', x: 636, y: 250, base: 316, when: g => g.f.wedge && !g.f.hooch },
      { id: 'loot', x: 446, y: 290, base: 330, when: g => g.f.hooch && !g.f.ednaHooch }
    ],
    hot: [
      { id: 'out', name: 'На площадь', rect: [780, 300, 20, 172], walk: [776, 420], exitDir: 'e', exit: { room: 'square', x: 372, y: 360, dir: 's' }, look: 'Выход на площадь.' },
      { id: 'phone', name: 'Телефон', rect: [60, 140, 46, 70], walk: [90, 330], face: 'n', look: 'Телефон на стене. Трубка на шнуре, ручка сбоку.', use: 'Кому звонить-то? Тут даже номеров не знаю.', items: { number: function* (g) {
        g.sfx('dial');
        yield g.say('marty', 'Алло? Это дом Браунов?');
        yield E.voice(g, 'butler', 'Резиденция Браунов. Младший господин Браун исполняет обязанности клерка в суде. Как вас представить?');
        yield g.say('marty', E.alias(g) + '. Неважно. Спасибо!');
        g.f.butler = true;
        g.drop('number');
      } } },
      { id: 'board', name: 'Доска «Суп дня»', rect: [200, 90, 120, 50], walk: [260, 336], face: 'n', look: '«Суп дня: капустный». Похоже, капустный каждый день.' },
      { id: 'counter', name: 'Стойка', rect: [180, 220, 300, 80], walk: [330, 340], face: 'n', look: 'Деревянная стойка. За неё Биток пускает только своих.', use: 'Зайдёшь за стойку, и Биток достанет пушку. Он так и сказал.' },
      { id: 'rack', name: 'Стеллаж с бочками', rect: [520, 160, 100, 140], walk: [570, 340], face: 'n', look: g => g.f.barrels && !g.f.hooch ? 'Бочки «особого супа». Пахнет совсем не капустой.' : 'Стеллаж. Его не пополняли со времён Кулиджа, так говорит Биток.', use: 'Бочка весит больше меня.' },
      { id: 'door', name: 'Кухонная дверь', rect: [640, 170, 70, 130], walk: [675, 340], face: 'n', look: g => g.f.wedge ? 'Эмметт подпёр дверь столами. Открыто.' : 'Дверь с иллюминатором. С той стороны её чем-то подпёрли.', use: g => g.f.wedge ? 'Открыто, но мне там делать нечего.' : 'Заперто. С той стороны что-то стоит.' },
      { id: 'pipe', name: 'Красная труба', rect: [740, 100, 24, 200], walk: [740, 340], face: 'n', look: 'Красная труба вдоль стены. Биток по ней иногда стучит.', use: pipe, items: { recorder: pipe } },
      { id: 'charity', name: 'Благотворительный стол', rect: [400, 320, 160, 40], walk: [480, 380], face: 'n', look: g => g.f.hooch && !g.f.ednaHooch ? 'На столе две бочки «особого супа». Для бедных. Ну-ну.' : 'Стол для благотворительных заказов.' },
      { id: 'table', name: 'Посетитель', rect: [40, 230, 120, 70], walk: [100, 340], face: 'n', look: 'Человек ест капустный суп и делает вид, что меня нет.', use: 'Не буду мешать человеку есть.' }
    ],
    actors: {
      cueball: { name: 'Биток', dist: 50, look: 'Биток Доннелли. Лысый, в кепке, руки как окорока.', talk: function* (g) { yield g.talkTo('cueball'); } },
      emmett: { name: 'Эмметт', dist: 44, look: 'Эмметт сидит у кухонной двери и делает вид, что читает газету.', talk: function* (g) { yield g.talkTo('emmettK'); } },
      artie: { name: 'Арти', dist: 44, look: 'Арти Макфлай. Мой дед. Похож на папу в пятьдесят пятом, как две капли.' },
      kid: { name: 'Кид Таннен', dist: 50, look: 'Кид Таннен собственной персоной.' }
    },
    update(g, dt) {
      if (g.f.barrels && !g.f.signal && !g.busy && !g.dialog && g.actors.marty.x < 200) {
        g.vt.hide = (g.vt.hide || 0) + dt;
        if (g.vt.hide > 2.5) { g.vt.hide = 0; g.run(signal, { name: 'signal' }); }
      } else g.vt.hide = 0;
      if (g.vt.cooking > 0) {
        g.vt.cooking -= dt;
        if (g.vt.cooking <= 0 && !g.busy) { g.vt.cooking = 0; g.run(function* () { yield g.walkTo('cueball', 330, 298, { free: true }); g.face('cueball', 's'); }, { name: 'cook', blocking: false }); }
      }
    },
    enter: function* (g) {
      if (!g.f.kidSeen && !g.f.night) yield* bully(g);
      if (g.f.emmettHelps && !g.f.barrels) yield* delivery(g);
    }
  };

  function* bully(g) {
    g.f.kidSeen = true;
    g.place('kid', 'kitchen', 470, 380, 'w');
    g.place('artie', 'kitchen', 380, 384, 'e');
    const k = g.actors.kid;
    k.act = ''; k.keepAct = false; k.scripted = true;
    g.actors.artie.scripted = true;
    yield g.say('artie', 'Мистер Таннен, я только хотел...');
    yield g.say('kid', 'Для тебя я мистер Таннен, Арти! Что ты тут делаешь? Сказано сидеть в укрытии!');
    yield g.say('kid', 'И шляпу давай сюда. Чтоб не высовывался.');
    g.f.kidHasHat = true;
    yield g.say('artie', 'Да, мистер Таннен.');
    yield g.walkTo('artie', 790, 420);
    g.place('artie', 'arthur', 0, 0, 's');
    g.actors.artie.visible = false;
    g.actors.artie.scripted = false;
    yield g.walkTo('kid', 790, 420);
    g.place('kid', 'square', 1480, 404, 's');
    k.scripted = false;
    E.dress(g);
    yield g.say('marty', 'Это мой дед. Вылитый папа в пятьдесят пятом.');
  }

  function* delivery(g) {
    g.f.barrels = true;
    g.place('matches', 'kitchen', 760, 420, 'w');
    const m = g.actors.matches;
    m.scripted = true;
    yield g.walkTo('matches', 560, 330);
    yield g.say('matches', 'Грузовик привёз свежую партию... э-э... супа.');
    yield g.say('cueball', 'Ставь на стеллаж. Да не урони, это тебе не капуста.');
    yield g.walkTo('matches', 790, 420);
    g.place('matches', 'square', 1522, 408, 'w');
    m.scripted = false;
  }

  function* signal(g) {
    const cb = g.actors.cueball;
    cb.scripted = true;
    yield g.walkTo('cueball', 720, 330, { free: true });
    g.face('cueball', 'e');
    g.sfx('clang');
    yield g.say('cueball', 'Тук-тук.');
    yield g.say('marty', 'Ого. Подъёмник увёз бочки вниз. В столовой, значит, есть подвал.');
    g.f.signal = true;
    yield g.walkTo('cueball', 330, 298, { free: true });
    g.face('cueball', 's');
    cb.scripted = false;
    yield g.say('marty', 'И бочки опять наверху. Видно, подвал ещё не готов.');
  }

  function* pipe(g) {
    if (!g.f.signal) { yield g.say('marty', 'Стучать по трубе просто так? Биток заметит.'); return; }
    if (g.f.hooch) { yield g.say('marty', 'Хватит с этой трубы.'); return; }
    if (!g.vt.cooking || g.vt.cooking <= 0) { yield g.say('cueball', 'Эй! Руки от трубы!'); return; }
    g.sfx('clang');
    if (!g.f.wedge) {
      g.sfx('barrels');
      yield* card(g, '', ['Подъёмник ухает вниз, стеллаж кренится, бочки катятся по полу и исчезают в щели у стены.', 'Снизу кто-то кричит: «Ой!»', 'Через минуту бочки снова на стеллаже.']);
      return;
    }
    g.sfx('barrels');
    yield* card(g, '', ['Подъёмник ухает вниз, стеллаж кренится. Бочки катятся по столам, которые подпёр Эмметт, и ложатся прямо на благотворительный стол.']);
    g.f.hooch = true;
    yield* ednaTakes(g);
  }

  function* ednaTakes(g) {
    g.place('edna', 'kitchen', 760, 420, 'w');
    const e = g.actors.edna;
    e.scripted = true;
    yield g.walkTo('edna', 520, 390);
    yield g.say('edna', 'Суп для благотворительности? Как кстати. Беру бочку.');
    g.f.ednaHooch = true;
    yield g.walkTo('edna', 790, 420);
    g.place('edna', 'square', 820, 404, 'w');
    e.scripted = false;
  }

  TALK.cueball = { portrait: 'cueball', options: [
    { id: 'soup', text: 'Можно супа?', run: function* (g) {
      yield g.say('cueball', 'Можно. А чего в нём не хватает, как думаешь? Я его улучшаю.');
      yield g.talkTo('spice');
    } },
    { id: 'barrel', text: 'Почему суп в бочках?', run: function* (g) { yield g.say('cueball', 'Так свежее. Суп любит темноту и дерево.'); } },
    { id: 'place', text: 'Тут правда столовая?', run: function* (g) { yield g.say('cueball', 'Столовая. Суп бесплатно, спасение за счёт заведения.'); } },
    { id: 'bye', text: 'Ладно, не буду мешать.', end: true }
  ] };

  TALK.spice = { portrait: 'cueball', options: ['Соли?', 'Перца чили?', 'Петрушки?'].map((t, i) => ({ id: 's' + i, text: t, end: true, run: function* (g) {
    yield g.say('cueball', 'Хм. А это мысль. Сейчас.');
    if (g.dialog && g.dialog.id === 'cueball') g.dialog = null;
    const cb = g.actors.cueball;
    cb.scripted = true;
    yield g.walkTo('cueball', 130, 320, { free: true });
    g.face('cueball', 'w');
    cb.scripted = false;
    g.vt.cooking = 14;
  } })) };

  TALK.emmettK = { portrait: 'emmett', options: [
    { id: 'door', text: 'Я не могу пройти на кухню.', when: g => g.f.signal && !g.f.wedge, run: function* (g) {
      yield g.say('emmett', 'Кухня? Двери... столы... наклонная плоскость... Эврика!');
      const em = g.actors.emmett;
      em.scripted = true;
      yield g.walkTo('emmett', 676, 330);
      g.sfx('thud');
      g.f.wedge = true;
      yield g.say('emmett', 'Подпёр столы. Если что-то покатится, покатится сюда.');
      yield g.walkTo('emmett', 120, 410);
      em.scripted = false;
    } },
    { id: 'drill', text: 'Как там бур?', run: function* (g) { yield g.say('emmett', 'Ждёт топлива. И меня. И, видимо, вас.'); } },
    { id: 'bye', text: 'Посиди тут.', end: true }
  ] };

  const ART = { x: 340, y: 140 };

  ROOMS.arthur = {
    id: 'arthur', name: 'Улица у дома №10', w: 640, music: 'bt_square',
    scale: [306, 0.9, 470, 1],
    paint: b => B.BG31.paintArthur31(b),
    walk: [[20, 306, 620, 306, 632, 472, 8, 472]],
    hot: [
      { id: 'door', name: 'Дверь дома №10', rect: [266, 204, 80, 100], walk: [306, 330], face: 'n', look: '«10. ДОМ ХИЛЛ-ВЭЛЛИ». Заперто изнутри.', use: 'Заперто. Арти сидит наверху.' },
      { id: 'out', name: 'На площадь', rect: [620, 300, 20, 172], walk: [616, 420], exitDir: 'e', exit: { room: 'square', x: 40, y: 400, dir: 'e' }, look: 'Обратно на площадь.' },
      { id: 'window', name: 'Окно Арти', rect: [274, 98, 132, 80], walk: [330, 330], face: 'n', look: 'Эркер на втором этаже. Занавеска шевелится.', act: 'talk', talk: function* (g) { yield* buzz(g); }, items: { recorder: tapeArtie, subpoena: 'До окна не дотянусь. Пусть сам спустится.' } },
      { id: 'buzzer', name: 'Звонок', rect: [372, 240, 14, 20], walk: [380, 330], face: 'n', look: 'Звонок квартиры №10.', use: function* (g) { yield* buzz(g); }, items: { recorder: tapeArtie, subpoena: 'Пусть сначала откроет.' } },
      { id: 'billiards', name: 'Бильярдная', rect: [34, 196, 192, 108], walk: [130, 330], face: 'n', look: 'Бильярдная. На вывеске шар-восьмёрка.', use: 'Не до бильярда.' },
      { id: 'bakery', name: 'Пекарня', rect: [416, 196, 192, 108], walk: [510, 330], face: 'n', look: 'Пекарня «Вэлли», с 1905 года. «Свежий хлеб». Закрыто.' }
    ],
    actors: {
      einstein: { name: 'Эйнштейн', dist: 40, look: 'Эйнштейн сидит под окном и виляет хвостом.', talk: function* (g) { yield g.say('einstein', 'Гав!'); } },
      artie: { name: 'Арти', dist: 44, look: 'Арти щурится на солнце, как будто не выходил из дома неделю.', talk: function* (g) { yield g.say('artie', 'Мистер Таннен велел спуститься. Я спустился. Что теперь?'); }, items: { subpoena: serve, hat: 'Шляпу отдам, когда закончим.' } },
      emmett: { name: 'Эмметт', dist: 44, look: 'Эмметт держится за моей спиной.' }
    },
    enter: function* (g) {
      if (g.f.arthurFound && !g.f.arthurSeen) { g.f.arthurSeen = true; yield g.say('marty', 'Дом №10 над бильярдной. Тот же дом, где через полвека будет жить Эдна.'); }
    }
  };

  function artieSay(g, text) { return E.voice(g, 'artie', text, ART.x, ART.y); }

  function* buzz(g) {
    g.sfx('buzzer');
    if (!g.f.arthurFound) { yield g.say('marty', 'Кто тут живёт, я пока не знаю.'); return; }
    if (g.f.arthurOut) { yield g.say('marty', 'Арти уже внизу.'); return; }
    yield artieSay(g, 'Кто там?');
    yield g.say('marty', 'Мистер Макфлай? У меня для вас кое-что есть!');
    yield artieSay(g, 'Тогда напиши открытку и отправь. Я сижу тут, пока босс не разрешит выйти.');
    g.f.arthurRefused = true;
  }

  function* tapeArtie(g) {
    if (!g.f.kidTaped) { yield g.say('marty', 'На кассете только старые записи.'); return; }
    if (g.f.arthurOut) return;
    g.sfx('rewind');
    yield E.voice(g, 'kid', 'Ты что там делаешь, мелкий заморыш? А ну слезай!', ART.x, ART.y + 120);
    yield artieSay(g, 'Да, мистер Таннен! Иду, мистер Таннен!');
    g.f.arthurOut = true;
    g.place('artie', 'arthur', 300, 330, 's');
    g.actors.artie.visible = true;
    g.place('emmett', 'arthur', 160, 420, 'e');
    E.dress(g);
    yield g.walkTo('artie', 330, 400);
  }

  function* serve(g) {
    g.drop('subpoena');
    yield g.say('emmett', '«Артуру Макфлаю предписывается явиться в суд и дать показания по делу о...»');
    yield g.say('artie', 'Против мистера Таннена?! Он меня убьёт!');
    yield g.say('marty', 'Не убьёт. Вы свидетель, суд вас защитит. Вот ваша шляпа.');
    if (g.has('hat')) g.drop('hat');
    g.f.hatBack = true;
    E.dress(g);
    yield g.say('artie', 'Защитит... Ну, раз суд... Ладно.');
    yield g.say('emmett', 'Он окончил школу на пять выпусков раньше меня. Говорят, считал быстрее учителей.');
    g.f.served = true;
    yield g.walkTo('artie', 630, 420);
    g.place('artie', null, 0, 0, 's');
    g.place('emmett', 'kitchen', 120, 410, 'e');
    yield* E.checkBoth(g);
  }

  ROOMS.bandstand = {
    id: 'bandstand', name: 'Крыша эстрады', w: 640, music: 'bt_chase', noSave: true,
    scale: [200, 0.7, 470, 1],
    paint: b => B.BG31.paintRoof31(b),
    walk: [[230, 220, 410, 220, 470, 280, 170, 280]],
    hot: [{ id: 'down', name: 'Спуститься', rect: [100, 330, 440, 30], walk: null, look: 'Внизу Кид и Спичка. Прыгать некуда.', use: 'Внизу меня ждут Кид и Спичка. Не самый удачный момент.' }],
    actors: {
      kid: { name: 'Кид Таннен', dist: 120, walk: null, look: 'Кид орёт снизу. Громко. Очень громко.', talk: function* (g) { yield g.say('marty', 'Мистер Таннен, давайте поговорим!'); yield g.say('kid', 'Поговорим, когда слезешь!'); }, items: { recorder: function* (g) {
        g.sfx('click');
        yield g.say('kid', 'Ты что там делаешь, мелкий заморыш? А ну слезай!');
        g.f.kidTaped = true;
        yield g.say('marty', 'Громко и чётко.');
      } } },
      matches: { name: 'Спичка', dist: 120, walk: null, look: 'Спичка жуёт спичку и ждёт.' },
      einstein: { name: 'Эйнштейн', dist: 120, walk: null, look: 'Эйнштейн крутится у ног гангстеров.', talk: function* (g) {
        if (!g.f.kidTaped) { yield g.say('einstein', 'Гав?'); return; }
        yield g.say('marty', 'Эйни! Отвлеки их!');
        yield g.say('einstein', 'Р-р-р-гав!');
        yield g.say('matches', 'Эй, отстань! Босс, тут псина!');
        yield* card(g, '', ['Эйнштейн кружит вокруг гангстеров, хватает Кида за штанину. Марти соскальзывает по столбу и скрывается за деревьями.']);
        g.place('kid', 'square', 1480, 404, 's');
        g.place('matches', 'square', 1522, 408, 'w');
        g.place('einstein', 'square', 540, 400, 's');
        yield* g.goRoom('square', { x: 700, y: 420, dir: 's' });
      }, use: 'Эйни занят: облаивает гангстеров снизу.' }
    },
    setup(g) { E.dress(g); const k = g.actors.kid; k.act = ''; k.keepAct = false; }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
