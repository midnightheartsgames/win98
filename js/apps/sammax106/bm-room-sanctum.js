(function (S) {
  'use strict';
  const { C, COLORS } = S;
  const E = S.EP106;
  const { ROOMS, TALK } = E;
  const A = S.art106;
  const HOME = [270, 168];
  const ORD = ['', 'первый', 'второй', 'третий', 'последний'];
  const TRAP = [
    null,
    { id: 'wheel', name: 'Радужное колесо смерти', sam: [108, 120], free: [152, 172], near: [170, 170] },
    { id: 'cabinet', name: 'Отдели своё блаженство', sam: [177, 149], free: [214, 168], near: [234, 170] },
    { id: 'lander', name: 'Билет в небытие', sam: [330, 160], free: [282, 172], near: [276, 172] },
    { id: 'tank', name: 'Очистительная ванна аннигиляции', sam: [420, 141], free: [386, 166], near: [376, 170] }
  ];
  const bufs = new Map();

  const fight = g => (g.vt.fight && g.vt.fight.started ? g.vt.fight : null);
  const free = g => !(fight(g) && fight(g).bound);
  const W = (x, y) => g => (free(g) ? [x, y] : null);
  const prop = n => g => !!fight(g) && (free(g) || fight(g).trap === n);
  const vox = (g, who, t) => g.say(null, t, { key: who, color: COLORS[who], x: 160, y: 176 });

  function cached(key, fn) {
    if (!bufs.has(key)) bufs.set(key, fn());
    return bufs.get(key);
  }

  function stage(g) {
    const ft = fight(g);
    const sam = g.actors.sam, hugh = g.actors.hugh, max = g.actors.max;
    sam.scale = null; sam.upside = false; sam.z = 0;
    hugh.upside = false; hugh.z = 0;
    g.f.frozen = false;
    if (!ft) { max.scale = null; return; }
    max.follow = null;
    max.scale = 0.8;
    g.place('max', 'sanctum', 240, 134, 's');
    hugh.v = 'germ';
    hugh.scale = 1;
    const T = TRAP[ft.trap];
    if (ft.bound && T) {
      g.f.frozen = true;
      g.place('sam', 'sanctum', T.sam[0], T.sam[1], 's');
      sam.scale = T.id === 'tank' ? 0.7 : 0.84;
      if (T.id === 'wheel') sam.z = 70;
      g.place('hugh', 'sanctum', T.near[0], T.near[1], T.near[0] < T.sam[0] ? 'e' : 'w');
    } else if (ft.hughIn && T) {
      g.place('hugh', 'sanctum', T.sam[0], T.sam[1], 's');
      hugh.scale = T.id === 'tank' ? 0.62 : 0.76;
      if (T.id === 'wheel') hugh.z = 70;
    } else g.place('hugh', 'sanctum', HOME[0], HOME[1], 'w');
  }

  function* zap(g) {
    g.sfx('zap');
    g.fx.flash = 0.45;
    yield 0.25;
  }

  function* enterTrap(g, n) {
    const ft = fight(g);
    const again = ft.cycle > 1;
    ft.trap = n;
    ft.hughIn = false;
    ft.bound = false;
    stage(g);
    yield g.say('hugh', 'Номер ' + ORD[n] + '. «' + TRAP[n].name + '».');
    if (n === 3 && !ft.lander) {
      g.sfx('whoosh');
      g.fx.flash = 0.3;
      ft.lander = 'up';
      yield g.say('hugh', 'Реквизит с поверхности. Настоящий лунный модуль на деревянной опоре. Дерево я вёз с Земли.');
    }
    yield* zap(g);
    ft.bound = true;
    stage(g);
    if (n === 1) {
      if (again) { yield g.say('sam', 'Снова колесо. Талисман на этот раз уже у меня.'); return; }
      yield g.say('hugh', 'Колесо крутится. Над вами две ложки. Когда оно остановится, они сомкнутся. Любите сюрпризы, Сэм?');
      yield g.say('sam', 'Меня пристегнули к радуге. Над шляпой качаются две ложки размером с весло. В левой что-то зажато.');
      yield vox(g, 'max', 'Сэм! Ты вертишься! Тебе идёт! Я отсюда вижу всё, кроме твоей шляпы!');
    } else if (n === 2) {
      if (g.has('saw')) { yield g.say('hugh', 'Пилу вы унесли. Ничего. Ящик сожмёт вас и без неё.'); return; }
      yield g.say('hugh', 'Ящик, пила, ассистент. Пила настоящая. Я фокусник старой школы.');
      yield g.say('sam', again ? 'Снова ящик. Пила ждёт меня в той же прорези.' : 'Я стою в ящике. На уровне пояса прорезь, в прорези ходит пила.');
    } else if (n === 3) {
      yield g.say('sam', again ? 'Опять под соплом. К мишени я уже привык.' : 'Лунный модуль. Я его знаю, у меня от него ключ. Сейчас он висит надо мной соплом вниз, а я привязан к мишени.');
      yield g.say('hugh', 'Билет в один конец, Сэм. Пуск у меня в руке.');
    } else {
      yield g.say('hugh', 'Вода смоет с вас серое, Сэм. Вместе с вами.');
      yield g.say('sam', 'Я в баке. Вода по самую шляпу. Дышать получается. На Луне с этим вообще странно.');
    }
  }

  function* nextTrap(g) {
    const ft = fight(g);
    let n = ft.trap + 1;
    if (ft.hughIn) {
      g.sfx('pop');
      yield g.say('hugh', ft.trap === 1 ? 'Благодарю. Накатался.' : ft.trap === 2 ? 'Ящик открывается изнутри. Я сам его чертил.' : 'Вылезаю. Вода была хороша.');
      ft.hughIn = false;
      stage(g);
    }
    if (n > 4) { n = 1; ft.cycle++; yield g.say('hugh', 'Начнём сначала. Я люблю повторять номера.'); }
    if (n === 3 && ft.lander === 'down') {
      yield g.say('hugh', 'Третий номер отменяется. Кто-то уронил мой реквизит.');
      n = 4;
    }
    yield* enterTrap(g, n);
  }

  function* escape(g) {
    const ft = fight(g);
    if (!ft || !ft.hughIn) return;
    g.sfx('splash');
    yield g.say('hugh', 'Вы отошли от бака, Сэм. Благодарю.');
    ft.hughIn = false;
    stage(g);
    ft.trap = 4;
    yield* nextTrap(g);
  }

  function* burnHugh(g) {
    const ft = fight(g);
    yield g.say('hugh', 'Сэм, постойте. Пуск я уже нажал.');
    g.vt.fireT = g.time + 1.6;
    g.sfx('missile');
    g.fx.shake = 0.7;
    yield 1.6;
    g.vt.fireT = 0;
    yield g.say('hugh', 'Горячо! Мы не выносим горячего!');
    ft.hughIn = false;
    g.place('hugh', 'sanctum', 420, 141, 's');
    g.actors.hugh.scale = 0.62;
    g.sfx('splash');
    yield g.say('sam', 'Хью осыпался сажей и стёк в бак с водой. В воде он собрался обратно за секунду.');
    yield g.say('hugh', 'Жар нам вреден, Сэм. Вода нас лечит. Прошу в ванну.');
    g.sfx('pop');
    yield* enterTrap(g, 4);
  }

  function* swap(g) {
    const ft = fight(g);
    if (!ft) { yield g.say('sam', 'Поменяться местами с Хью? Он сидит в кристалле и правит планетой. Дышать за шесть миллиардов я не умею.'); return; }
    if (!ft.bound) { yield g.say('sam', ft.hughIn ? 'В ловушке сидит он. Меняться обратно я не стану.' : 'Мы оба на свободе. Меняться сейчас незачем.'); return; }
    const n = ft.trap;
    yield g.say('sam', 'Хью, посмотрите сюда. Сейчас вылетит птичка.');
    g.sfx('pop');
    g.fx.flash = 0.5;
    ft.bound = false;
    ft.hughIn = true;
    stage(g);
    g.place('sam', 'sanctum', TRAP[n].free[0], TRAP[n].free[1], n === 1 ? 'w' : 'e');
    if (n === 1) {
      yield g.say('hugh', ft.cycle > 1 ? 'Опять? У-ух.' : 'Талисман фокусника. Мой, личный. Верните, Сэм.');
      if (ft.cycle === 1) yield g.say('sam', 'Покатайтесь пока. Радуга вам к лицу.');
    } else if (n === 2) {
      yield g.say('hugh', 'Вы были в моём ящике. Теперь в нём я. Фокус удался. Не тот.');
      if (!g.has('saw')) yield g.say('sam', 'Пила встала в прорези. Хью заперт, а у меня свободны лапы.');
    } else if (n === 3) {
      yield* burnHugh(g);
    } else {
      yield g.say('hugh', 'Буль. Мне тут уютно, Сэм. Мы вышли из воды.');
      yield g.say('sam', 'Хью в баке. Улыбается оттуда, как рыбка из пакета, и ждёт, когда я отвернусь.');
      yield vox(g, 'max', ft.lander === 'down' ? 'Сэм! Сопло под баком! Ты же помнишь, что оно сделало с несокрушимой витриной?!' : 'Сэм, он там отмокает и хорошеет! Вода ему как нам отпуск!');
    }
  }

  function* takeSaw(g) {
    const ft = fight(g);
    if (g.has('saw')) { yield g.say('sam', 'Пила уже у меня.'); return; }
    if (!(ft && ft.trap === 2 && ft.hughIn)) { yield g.say('sam', 'Пила ходит в прорези, а Хью ходит за мной. При нём я реквизит не трогаю.'); return; }
    yield g.anim('sam', 'reach', 0.5);
    g.give('saw');
    yield g.say('sam', 'Двуручная, зубья настоящие. Фокусник старой школы не соврал.');
    yield g.say('hugh', 'Это реквизит, Сэм. Он под расписку.');
  }

  function* sawCrane(g) {
    const ft = fight(g);
    yield g.say('sam', 'Дерево сухое. Фокусники экономят на реквизите.');
    g.sfx('crunch');
    yield 0.6;
    g.sfx('crunch');
    yield 0.5;
    ft.lander = 'down';
    g.sfx('crash');
    g.fx.shake = 0.9;
    yield 0.5;
    yield g.say('sam', 'Опора подломилась. Модуль рухнул набок и упёрся соплом под бак с водой.');
    if (ft.hughIn) yield g.say('hugh', 'Сэм! Это музейная вещь! Я её не покупал!');
    yield vox(g, 'max', 'Сэм! Ты уронил космическую программу! Прямо под ванну!');
  }

  function* boil(g) {
    const ft = fight(g);
    const max = g.actors.max, hugh = g.actors.hugh;
    g.hideUI = true;
    yield g.say('sam', 'Ключ на старт. Спасибо, НАСА.');
    yield g.say('hugh', 'Сэм. Что вы делаете с моим реквизитом?');
    g.vt.fireT = g.time + 60;
    g.vt.boilT = g.time;
    g.sfx('missile');
    g.fx.shake = 0.8;
    yield 1;
    yield g.say('sam', 'Двигатель бьёт под бак. Три тысячи градусов. Вода закипает сразу.');
    g.sfx('sizzle');
    yield g.say('hugh', 'Горячо! Сэм! Мы не выносим кипячения! Девяносто девять процентов нас...');
    yield g.say('hugh', 'Вдох... вы...');
    g.vt.fireT = 0;
    g.f.boiled = true;
    g.place('hugh', 'nowhere', 0, 0);
    g.music('sanctum6');
    yield 0.8;
    yield g.say('sam', 'Прокипячён. В любой инструкции про микробов это стоит первым пунктом.');
    g.vt.fight = null;
    g.vt.boilT = g.time;
    stage(g);
    g.sfx('glass');
    g.fx.flash = 0.4;
    max.follow = 'sam';
    max.scripted = true;
    g.place('max', 'sanctum', 262, 166, 'e');
    E.dress(g);
    yield g.say('max', 'Свобода! Сэм, я хочу пить! Я сидел в кристалле и злился, а это сушит!');
    yield g.say('sam', 'Макс, только не...');
    yield g.walkTo('max', 392, 166);
    g.face('max', 'e');
    g.sfx('slurp');
    yield 0.7;
    g.sfx('slurp');
    yield 0.7;
    g.vt.boilT = 0;
    g.vt.drunk = true;
    g.sfx('burp');
    yield g.say('max', 'Выпил! Весь бак! С пузырьками!');
    yield g.say('sam', 'Ты выпил Хью Блисса.');
    yield g.say('max', 'Кипячёного! На вкус как бассейн!');
    yield* finale(g);
  }

  function* finale(g) {
    const max = g.actors.max;
    g.sfx('swell');
    g.fx.flash = 0.6;
    yield 0.6;
    yield g.say('sam', 'Прибор загудел. Он слушался Хью, а Хью теперь внутри Макса.');
    yield g.fadeOut(4);
    g.closeup = { kind: 'beam6', t0: g.time, delay: 0.8, max: true };
    g.music('vice6');
    yield g.fadeIn(4);
    yield E.narr(g, 'Прибор принял Макса за хозяина. Луч снова бьёт в Землю. Только цвет у него теперь один.');
    yield g.fadeOut(5);
    g.closeup = { kind: 'world6', t0: g.time, who: 'max', faces: ['f:momma6', 'f:queen6', 'f:leonard6', 'f:superball6'] };
    yield g.fadeIn(5);
    yield vox(g, 'bosco', 'Я Макс! Дайте мне базуку и кассу!');
    yield vox(g, 'sybil', 'Мы Макс! Канада объявляет войну всем, кто на букву «а»!');
    yield vox(g, 'leonard', 'МММ! ММ-ММ-ММ!');
    yield vox(g, 'superball', 'Я Макс, сэр. Докладываю: хочу всё сломать, сэр.');
    yield E.narr(g, 'Шесть миллиардов Максов. Хью хотя бы молчал и дышал.');
    yield g.fadeOut(5);
    g.closeup = null;
    g.music('sanctum6');
    yield g.fadeIn(5);
    yield g.say('max', 'Сэм! Они все стали мной! Это лучший день моего президентства!');
    yield g.say('sam', g.has('glove') ? 'Держи перчатку, Макс. Гипноз она лечит одним ударом. Лечить придётся всех.' : 'Перчатка висит в шкафу, Макс. Гипноз она лечит одним ударом. Лечить придётся всех.');
    yield g.say('max', 'Всех? Шесть миллиардов ударов? Сэм... Я СОГЛАСЕН!');
    if (g.has('glove')) g.drop('glove');
    yield g.fadeOut(4);
    g.closeup = { kind: 'world6', t0: g.time, who: 'max', faces: ['f:queen6', 'f:momma6', 'f:jimmy6'] };
    yield g.fadeIn(4);
    for (let i = 0; i < 3; i++) { g.sfx('punch'); g.fx.flash = 0.5; g.fx.shake = 0.4; yield 0.5; }
    yield E.narr(g, 'Макс обошёл планету с боксёрской перчаткой. Без шишки не остался никто.');
    yield g.fadeOut(2);
    g.closeup = null;
    max.scripted = false;
    g.hideUI = false;
    yield* E.epilogue(g);
  }

  function* confront(g) {
    const max = g.actors.max, hugh = g.actors.hugh;
    g.hideUI = true;
    max.scripted = true;
    yield [g.walkTo('sam', 150, 172), g.walkTo('max', 122, 176)];
    g.face('sam', 'e'); g.face('max', 'e');
    yield g.say('hugh', 'Сэм. Макс. Вдох... выдох... Я ждал вас на жёлтом уровне, а вы пришли на красном. Торопитесь.');
    yield g.say('sam', 'Рой Г. Бив. Кассеты Брэди, мишка Майры, игрушечная мафия, кукла в Белом доме, Интернет. Пять дел, и под каждым ваш счёт.');
    yield g.say('hugh', 'Пять репетиций, Сэм. Кассета, мишка, казино, кукла, провод. Каждый раз вы ломали прибор, и каждый раз я узнавал, что в нём исправить.');
    yield g.say('max', 'Мы ломали бесплатно! Сэм, он должен нам за консультации!');
    yield g.say('hugh', 'Теперь прибор исправен и стоит на Луне. Сюда не дотянется ни один полицейский. Кроме двоих. Этого я не учёл.');
    yield g.say('sam', 'Чего вы хотите, Хью?');
    yield g.say('hugh', 'Блаженства. Для всех. Внутри человек цветной, снаружи серый. Серое я уберу. Останется улыбка.');
    yield g.say('hugh', 'Им будет хорошо. Я их не спрашиваю, потому что серые всегда отвечают «нет».');
    g.anim('hugh', 'magic', 2.4);
    g.sfx('swell');
    g.fx.flash = 0.7;
    g.f.beam = true;
    yield 0.8;
    yield g.fadeOut(4);
    g.closeup = { kind: 'beam6', t0: g.time, delay: 0.8 };
    g.music('bliss6');
    yield g.fadeIn(4);
    yield E.narr(g, 'Луч уходит к Земле. Там, куда он падает, перестают спорить и начинают дышать.');
    yield g.fadeOut(5);
    g.closeup = { kind: 'world6', t0: g.time, who: 'hugh', faces: ['f:momma6', 'f:queen6', 'f:leonard6'] };
    yield g.fadeIn(5);
    yield vox(g, 'bosco', 'Здравствуйте. Я Хью Блисс.');
    yield vox(g, 'sybil', 'Здравствуйте. Я Хью Блисс.');
    yield vox(g, 'leonard', 'Мм. Мм мм ммм.');
    yield g.fadeOut(5);
    g.closeup = null;
    g.music('sanctum6');
    yield g.fadeIn(5);
    yield g.say('sam', 'Вы сделали из целой планеты себя.');
    yield g.say('hugh', 'Из лучшего, что в них было. Остались вы двое. Дуршлаг под шляпой, Сэм? Остроумно. У Макса шляпы нет.');
    yield g.say('max', 'У меня иммунитет! Мне все говорили, что я невыносим!');
    yield g.say('hugh', 'Макса нельзя загипнотизировать. В нём слишком много лишнего. Значит, лишнее надо вынуть.');
    g.anim('hugh', 'magic', 2);
    yield* zap(g);
    yield g.walkTo('max', 226, 168, { speed: 2 });
    g.face('max', 's');
    g.fx.shake = 0.5;
    g.sfx('pop');
    g.place('maxred', 'sanctum', 188, 176, 'w');
    yield g.say('hugh', 'Рука. Она бьёт.');
    g.actors.maxred.act = 'shoot'; g.actors.maxred.actT = 0.8;
    g.sfx('gun');
    yield g.say('maxred', 'ПИФ-ПАФ!');
    g.sfx('pop');
    g.place('maxgreen', 'sanctum', 264, 178, 'w');
    yield g.say('hugh', 'Желудок. Он жрёт.');
    yield g.say('maxgreen', 'ЕДА!');
    g.sfx('pop');
    g.place('maxblue', 'sanctum', 330, 180, 'e');
    yield g.say('hugh', 'Хвост. Он ленится.');
    yield g.say('maxblue', 'Отстаньте.');
    g.f.maxSplit = true;
    E.dress(g);
    g.fx.flash = 0.4;
    yield g.say('max', 'Сэм. Друг мой. Мне вдруг стало так спокойно.');
    yield g.say('sam', 'Макс?');
    yield g.say('max', 'Я больше не хочу никого кусать. Даже его. Это и есть счастье, Сэм? Оно какое-то пустое.');
    yield g.say('hugh', 'Он чист. А грязь пусть погуляет. Без хозяина ей долго не прожить.');
    yield g.say('maxred', 'На горки! Там есть во что стрелять!');
    yield g.walkTo('maxred', 40, 170, { speed: 1.6 });
    g.place('maxred', 'nowhere', 0, 0);
    yield g.say('maxgreen', 'У Боско сосиски!');
    yield g.walkTo('maxgreen', 40, 170, { speed: 1.6 });
    g.place('maxgreen', 'nowhere', 0, 0);
    yield g.say('maxblue', 'Лягу снаружи. Далеко не пойду.');
    yield g.walkTo('maxblue', 40, 170, { speed: 1.8 });
    g.place('maxblue', 'nowhere', 0, 0);
    yield g.say('sam', 'Рука, желудок и хвост. Разбежались, как свидетели. Макса придётся собирать по частям.');
    yield g.say('hugh', 'Собирайте, Сэм. Дышите. Я подожду. У меня теперь всё время мира.');
    yield g.walkTo('max', 124, 176);
    max.scripted = false;
    g.hideUI = false;
  }

  function* fightIntro(g) {
    const max = g.actors.max, hugh = g.actors.hugh;
    g.hideUI = true;
    max.scripted = true;
    g.place('hugh', 'sanctum', 240, 136, 's');
    hugh.v = ''; hugh.scale = 0.8;
    g.place('max', 'sanctum', 120, 176, 'e');
    max.scale = null;
    yield g.walkTo('sam', 150, 172);
    g.face('sam', 'e');
    yield g.say('max', 'ХЬЮ! Я пришёл за сдачей!');
    yield g.say('hugh', 'Макс. Вы снова серый. Какая жалость. Вдох...');
    yield g.walkTo('max', 222, 160, { speed: 2 });
    g.sfx('punch');
    g.fx.shake = 0.8;
    g.fx.flash = 0.5;
    g.place('hugh', 'sanctum', HOME[0], HOME[1], 'w');
    hugh.v = 'germ'; hugh.scale = 1;
    g.sfx('glass');
    yield g.say('sam', 'Макс выдернул Хью из кристалла за ленту. Улыбка, волосы и белый костюм остались у Макса в кулаке. Как перчатка.');
    yield g.say('hugh', 'Вы порвали мне костюм, Макс. Человеческий. Я носил его много лет.');
    yield g.say('sam', 'Вы не человек.');
    yield g.say('hugh', 'Я колония, Сэм. Миллиард очень маленьких и очень дружных существ. Мы едим блаженство. Раньше его приходилось выпрашивать по одному человеку.');
    yield g.say('hugh', 'Теперь у нас шесть миллиардов кормушек. И две помехи.');
    yield* zap(g);
    g.vt.fight.started = true;
    stage(g);
    max.scripted = false;
    yield g.say('max', 'Сэм! Я в кристалле! Отсюда всё видно и ничего нельзя укусить!');
    yield g.say('hugh', 'Макс посидит в приборе. А для вас, Сэм, я приготовил номера. Я ведь начинал с фокусов.');
    g.sfx('fanfare');
    g.fx.flash = 0.4;
    g.hideUI = false;
  }

  function* begin(g) {
    yield* fightIntro(g);
    yield* nextTrap(g);
  }

  const pending = g => !!(g.vt.fight && !g.vt.fight.started);

  TALK.hugh = {
    options: [
      { id: 'why', icon: 'earth6', text: 'Зачем вам вся Земля?', run: function* (g) {
        yield g.say('hugh', 'Одному человеку я нужен час в день. Шести миллиардам я нужен всегда.');
        yield g.say('hugh', 'Их блаженство идёт по лучу обратно, сюда. Я его собираю. Бережно.');
        yield g.say('sam', 'Собираете.');
        yield g.say('hugh', 'Пью, если угодно. Хотя пить я не пью, Сэм.');
      } },
      { id: 'max', icon: 'f:max', text: 'Верните Максу то, что вынули.', run: function* (g) {
        yield g.say('hugh', 'Рука, желудок и хвост. Злость, жадность и лень. Вы просите вернуть ему грязь.');
        yield g.say('sam', 'Это мой напарник. Он из неё состоит.');
        yield g.say('hugh', 'Поймаете, и она прилипнет сама. Грязь тянется к хозяину. Только она вам не дастся.');
      } },
      { id: 'past', icon: 'rainbow6', text: 'Вы с самого начала стояли рядом.', run: function* (g) {
        yield g.say('hugh', 'В студии Майры я вёл викторину. У Белого дома продавал книги. Вы здоровались и шли ловить тех, кого я нанял.');
        yield g.say('hugh', 'Лучшее место для пряток, Сэм, это радуга. На неё смотрят и не спрашивают, из чего она.');
      } },
      { id: 'color', icon: 'level6', text: 'Какого я сегодня цвета, Хью?', run: function* (g) {
        yield g.say('hugh', 'Коричневого. С серым кантом. Цвет того, кто пришёл всё испортить.');
      } },
      { id: 'bye', icon: 'bye', text: 'Я вернусь с целым Максом.', end: true, run: function* (g) { yield g.say('hugh', 'Возвращайтесь. Дышите.'); } }
    ]
  };

  TALK.fight = {
    options: g => {
      const ft = fight(g) || { trap: 0 };
      return [
        { id: 'next', icon: 'wheel6', text: ft.trap === 0 ? 'Показывайте ваши номера, Хью.' : ft.trap === 4 ? 'Вылезайте. Начнём сначала.' : 'Следующий номер.', end: true, run: function* (gg) { gg.endDialog(); if (fight(gg)) yield* nextTrap(gg); } },
        { id: 'germ', icon: 'germ6', text: 'Бактерии. Всё это время.', run: function* (gg) {
          yield gg.say('hugh', 'Радуга, Сэм, тоже из мелких капель. Никто не зовёт её плесенью.');
          yield gg.say('hugh', 'Мы прожили среди вас долго. Нам нужен был один большой глоток.');
        } },
        { id: 'taunt', icon: 'f:max', text: 'Хью! Твои фокусы хуже моих указов!', speaker: 'max', say: false, run: function* (gg) {
          yield vox(gg, 'max', 'Хью! Твои фокусы хуже моих указов!');
          yield gg.say('hugh', 'Ваши указы я читал, Макс. Я над ними дышал.');
        } },
        { id: 'bye', icon: 'bye', text: ft.hughIn ? 'Посидите пока там.' : 'Минуту, Хью.', end: true }
      ];
    }
  };

  const BOUND_LOOK = [
    '',
    'Колесо подо мной крутится. Радуга мелькает, шляпа держится.',
    'Я стою в ящике фокусника. Из окошка видно Хью и мою собственную участь.',
    'Я привязан к мишени. Сопло смотрит мне в шляпу.',
    'Я в баке. Сквозь воду Хью кажется шире. Улыбка у него от этого не меняется.'
  ];

  const maxItems = {};
  for (const [id, fn] of Object.entries(E.ACTOR_HOT.max.items)) {
    maxItems[id] = function* (g) {
      if (fight(g)) { yield g.say('sam', 'Сквозь кристалл Максу ничего не передать.'); return; }
      yield* fn(g);
    };
  }

  function lookEarth(g) {
    if (g.f.boiled) return 'Земля в окне. Радужное кольцо погасло.';
    return E.blissed(g) ? 'Земля в окне, вся в радужном кольце. Отсюда Хью смотрит, как она ему улыбается.' : 'В окне Земля. Отсюда она размером с монету. Хью, похоже, так к ней и относится.';
  }

  function drawWheel(f, g, cx) {
    const P = new S.Pen(f);
    const got = g.has('mtal');
    A.wheel(P, 108 - cx, 92, 28, g.time * 2.2);
    for (const x of [90, 126]) { P.line(x - cx, 0, x - cx, 34, C.grey[3]); P.line(x + 1 - cx, 0, x + 1 - cx, 34, C.grey[5]); }
    if (got) P.part(P.ell(96 - cx, 40, 6, 3.4, 0.9), C.grey, { b: 4 });
    else { P.part(P.ell(90 - cx, 40, 7, 5), C.grey, { b: 4 }); A.talisman(P, 90 - cx, 41, 'mtal', 3.4); }
    P.part(P.ell(126 - cx, 40, 7, 5), C.grey, { b: 4 });
  }

  function drawLander(f, g, cx, ft) {
    const P = new S.Pen(f);
    const fire = !!(g.vt.fireT && g.time < g.vt.fireT);
    const k = fire ? Math.floor(g.time * 10) % 4 : 0;
    const up = cached('up' + (fire ? k : ''), () => A.landerSprite({ fire, k }));
    if (ft.lander === 'up') {
      P.part(P.rect(294 - cx, 4, 5, 146), C.wood, { b: 2 });
      P.part(P.rect(294 - cx, 4, 40, 4), C.wood, { b: 3, sh: 0 });
      P.line(330 - cx, 8, 330 - cx, 18, C.grey[4]);
      S.blit(f, up, 290 - cx, 2);
      P.part(P.ell(330 - cx, 161, 13, 3), C.red, { b: 3, sh: 0, hi: 0 });
      P.part(P.ell(330 - cx, 161, 7, 1.6), C.grey, { b: 5, sh: 0, hi: 0, ol: 0 });
    } else {
      P.part(P.rect(294 - cx, 128, 5, 22), C.wood, { b: 2 });
      S.blit(f, cached('down' + (fire ? k : ''), () => A.rot90(up)), 300 - cx, 72, true);
    }
  }

  function drawTankFront(f, g, cx) {
    const k = Math.floor(g.time * 6) % 2;
    for (let y = 101; y < 142; y++) for (let x = 401; x < 440; x++) if ((x + y + k) % 2 === 0) f.set(x - cx, y, C.sky[2]);
    for (let y = 96; y < 140; y += 2) f.set(403 - cx, y, C.sky[4]);
  }

  function hughWalk(g) {
    const ft = fight(g);
    if (!ft) return [206, 160];
    if (ft.bound) return null;
    if (ft.hughIn) return TRAP[ft.trap].free;
    return [HOME[0] - 40, HOME[1]];
  }

  ROOMS.sanctum = {
    id: 'sanctum', name: 'Святилище Хью', w: 480, music: g => (g.f.maxWhole && !g.f.boiled ? 'show6' : 'sanctum6'),
    scale: [152, 0.9, 196, 1.04],
    paint: b => S.BG.sanctum6(b),
    walk: [[8, 152, 472, 152, 472, 196, 8, 196]],
    noSave: g => !!fight(g),
    drawBack(f, g, cx) {
      const bl = E.blissed(g);
      A.earth(new S.Pen(f), 106 - cx, 35, 18, { bliss: bl, k: Math.floor(g.time * 4) % 8, max: !!g.f.boiled });
    },
    sprites(g) {
      const out = [];
      const ft = fight(g);
      const lit = E.blissed(g);
      out.push({ y: 128, draw: (f, cx) => S.blit(f, cached('crystal' + (lit ? 1 : 0), () => E.LAYERS.sanctum.crystal(g)), 215 - cx, 52) });
      out.push({ y: 142, draw: (f, cx) => A.crystalFront(f, 240 - cx, 140) });
      if (lit) out.push({ y: 20, draw: (f, cx) => A.beam(f, 240 - cx, 58, 240 - cx, 26, g.time, 3) });
      const after = !ft && (g.vt.boilT || g.vt.drunk);
      if (ft || after) {
        const boil = !!g.vt.boilT;
        out.push({ y: 139, draw: (f, cx) => A.tank(new S.Pen(f), 420 - cx, 150, { boil, k: Math.floor(g.time * 8) % 8, pinned: !ft || ft.lander === 'down' }) });
        if (g.vt.drunk) out.push({ y: 140, draw: (f, cx) => S.rectFill(f, 401 - cx, 93, 38, 49, C.night[1]) });
      }
      if (after) out.push({ y: 151, draw: (f, cx) => drawLander(f, g, cx, { lander: 'down' }) });
      if (!ft) return out;
      out.push({ y: 100, draw: (f, cx) => drawWheel(f, g, cx) });
      out.push({ y: 150, draw: (f, cx) => A.cabinet(new S.Pen(f), 177 - cx, 150, { saw: !g.has('saw') }) });
      if (ft.lander) out.push({ y: ft.lander === 'up' ? 96 : 151, draw: (f, cx) => drawLander(f, g, cx, ft) });
      if (ft.trap === 4 && (ft.bound || ft.hughIn)) out.push({ y: 143, draw: (f, cx) => drawTankFront(f, g, cx) });
      if (ft.trap === 3 && ft.bound) out.push({ y: 161, draw: (f, cx) => { for (let i = 0; i < 3; i++) S.line(f, 321 - cx, 128 + i * 6, 339 - cx, 130 + i * 6, C.sand[3]); } });
      return out;
    },
    hot: [
      { id: 'door', name: 'Свинцовая дверь', rect: [6, 40, 44, 112], walk: W(56, 168), face: 'w', when: free,
        look: 'Та же дверь изнутри. Кнопка «Открыть» утоплена, на ней лежит шар для боулинга.',
        exit: function* (g) {
          if (fight(g)) { yield g.say('sam', 'Макс сидит в приборе. Без него я отсюда не уйду.'); return; }
          yield* g.goRoom('vest', { x: 200, y: 166, dir: 's' });
        } },
      { id: 'window', name: 'Окно', rect: [60, 10, 92, 50], when: free, look: lookEarth },
      { id: 'emitter', name: 'Излучатель', rect: [222, 0, 36, 26], when: free,
        look: g => E.blissed(g) ? 'Излучатель. Луч выходит из кристалла, уходит в потолок и дальше на вышку.' : g.f.boiled ? 'Излучатель. Остыл и больше не светится.' : 'Воронка в потолке над кристаллом. Оттуда провода идут наверх, к вышке.' },
      { id: 'device', name: 'Прибор Хью', rect: [204, 130, 72, 22], walk: W(240, 160), face: 'n', when: free,
        look: 'Пульт под кристаллом. Семь клавиш, по одной на цвет. Восьмой, серой, нет.',
        use: 'Клавиши утоплены. Прибор слушается только хозяина.',
        items: {
          gun: 'Пуля звякает о пульт и падает на пол. Кристалл Хью растил не для того, чтобы его ломали.',
          saw: 'Пила скользит по кристаллу. Он твёрже вышки.',
          key: 'Скважины нет. Хью заводит прибор улыбкой.',
          remote: 'Ронять спутник на святилище? Я в нём стою.'
        } },
      { id: 'console', name: 'Пульт с экраном', rect: [312, 100, 56, 52], walk: W(340, 160), face: 'n', when: g => free(g) && !(fight(g) && fight(g).lander === 'down'),
        look: g => E.blissed(g) ? 'На экране семь столбиков, и все упёрлись в потолок. Подпись: «Блаженство Земли. Приход».' : 'Экран с семью столбиками. Все на нуле. Подпись: «Блаженство Земли».',
        use: 'Кнопки не нажимаются. Хью запер пульт на себя.' },
      { id: 'gauge', name: 'Шкала', rect: [396, 56, 68, 54], when: g => !fight(g) && !g.vt.drunk && !g.vt.boilT,
        look: g => E.blissed(g) ? 'Шкала «Блаженство». Стрелка лежит на красном и дрожит от удовольствия.' : 'Шкала «Блаженство». Стрелка дошла до красного и ждёт.' },
      { id: 'wheel', name: 'Радужное колесо смерти', rect: [78, 62, 60, 72], walk: W(152, 172), face: 'w', when: prop(1),
        look: g => (free(g) ? (fight(g).hughIn && fight(g).trap === 1 ? 'На колесе крутится Хью. Колония бактерий в семь цветов.' : 'Радужное колесо смерти. Семь секторов и два ремня. Я на нём уже катался.') : BOUND_LOOK[1]),
        use: g => (free(g) ? 'Кататься второй раз по своей воле я не стану.' : 'Ремни держат. Хью вязал их с любовью.'),
        items: { saw: 'Пилить колесо? Оно железное, а пила для дерева и ассистентов.', gun: 'Колесо крутится дальше, теперь с дыркой в зелёном.' } },
      { id: 'lspoon', name: 'Левая ложка', rect: [80, 30, 20, 18], walk: W(152, 172), face: 'w', when: prop(1), noWalkItem: true,
        look: g => g.has('mtal') ? 'Левая ложка. Согнута. Талисман из неё у меня.' : 'Левая ложка над колесом. В чашке что-то зажато. Круглое, золотое, с лицом Хью.',
        use: 'До ложек не дотянуться. Они висят под самым потолком.',
        items: {
          spoon: function* (g) {
            if (g.has('mtal')) { yield g.say('sam', 'Левая ложка уже согнута. Талисман у меня.'); return; }
            yield g.say('sam', 'С ложками этот талисман сговорчив. Даже когда я привязан.');
            g.sfx('clang');
            g.give('mtal');
            yield g.say('sam', 'Ложка согнулась, и то, что она держала, упало мне прямо в лапу. Талисман с лицом Хью. Лицо подмигивает.');
            yield g.say('hugh', 'Это моё. Талисман фокусника. Положите, Сэм.');
            yield vox(g, 'max', 'Сэм! Это тот самый, которым хвастался Фило! Хью, на талисмане ты толще, чем в жизни!');
          },
          gun: 'Звон красивый. Толку никакого.'
        } },
      { id: 'rspoon', name: 'Правая ложка', rect: [116, 30, 20, 18], walk: W(152, 172), face: 'w', when: prop(1), noWalkItem: true,
        look: 'Правая ложка. Пустая. Висит для симметрии.',
        use: 'До ложек не дотянуться.',
        items: { spoon: 'Правая ложка гнётся охотно и без толку. Она пустая.' } },
      { id: 'cabinet', name: 'Ящик фокусника', rect: [160, 66, 36, 84], walk: W(214, 168), face: 'w', when: prop(2),
        look: g => (free(g) ? (g.has('saw') ? 'Ящик фокусника. Прорезь пустая, пилу я забрал.' : 'Ящик фокусника. Фиолетовый, в звёздах. В прорези торчит двуручная пила.') : BOUND_LOOK[2]),
        use: function* (g) {
          if (!free(g)) { yield g.say('sam', 'Заперто. Фокусники не любят, когда ассистент уходит посреди номера.'); return; }
          yield* takeSaw(g);
        },
        items: {
          saw: function* (g) {
            const ft = fight(g);
            if (!(ft.hughIn && ft.trap === 2)) { yield g.say('sam', 'Пилить пустой ящик? Фокус без ассистента не считается.'); return; }
            g.sfx('crunch');
            yield g.say('sam', 'Ящик пополам. Голова Хью остаётся в верхней половине и улыбается.');
            yield g.say('hugh', 'Щекотно, Сэм. Мы срастаемся быстрее, чем вы пилите.');
          }
        } },
      { id: 'crane', name: 'Опора', rect: [292, 20, 9, 130], walk: W(282, 168), face: 'e', when: g => !!fight(g) && free(g) && fight(g).lander === 'up',
        look: 'Деревянная опора, на которой висит лунный модуль. Сухая сосна. Модуль тяжёлый, сосна одна.',
        use: 'Стоит. Сосна сухая, но упрямая.',
        items: {
          saw: function* (g) { yield* sawCrane(g); },
          gun: 'В дереве дырка, опора стоит. Сосна держит удар лучше меня.',
          glove: 'Перчатке больно. Опоре нет.'
        } },
      { id: 'lander', name: 'Лунный модуль', rect: [302, 6, 64, 84], walk: W(282, 172), face: 'e', when: g => !!fight(g) && (free(g) || fight(g).trap === 3) && fight(g).lander === 'up',
        look: g => (free(g) ? 'Лунный модуль. Висит на деревянной опоре соплом вниз. Под соплом нарисована мишень.' : BOUND_LOOK[3]),
        use: g => (free(g) ? 'До модуля не дотянуться. Он висит, как обещание Хью.' : 'Узлы морские. Хью где-то служил.'),
        items: {
          key: 'Модуль висит соплом в пол. Заведу его, и он уйдёт в потолок вместе с ключом.',
          saw: 'До модуля пилой не достать. Он висит выше моих возможностей.',
          gun: 'Стрелять в музейный модуль? НАСА и так пришлёт нам счёт.'
        } },
      { id: 'fallen', name: 'Лунный модуль', rect: [302, 80, 92, 70], walk: W(360, 188), face: 'e', when: g => !!fight(g) && free(g) && fight(g).lander === 'down',
        look: 'Лунный модуль лежит на боку. Сопло упёрлось прямо под бак с водой.',
        use: 'Поднять его я не смогу. И не хочу: лежит он удачно.',
        items: {
          key: function* (g) {
            const ft = fight(g);
            if (!(ft.trap === 4 && ft.hughIn)) { yield g.say('sam', 'Топлива в модуле на один запуск. Тратить его на пустой бак жалко.'); return; }
            yield* boil(g);
          },
          saw: 'Модуль уже лежит. Пилить больше нечего.'
        } },
      { id: 'tank', name: 'Бак с водой', rect: [398, 84, 46, 68], walk: W(386, 166), face: 'e', when: prop(4),
        look: g => (free(g) ? (fight(g).hughIn && fight(g).trap === 4 ? 'В баке сидит Хью. В воде он расплылся и похож на кисель с улыбкой.' : 'Бак с водой. На крышке табличка: «Очистительная ванна аннигиляции. Не нырять».') : BOUND_LOOK[4]),
        use: g => (free(g) ? 'Лезть в бак по своей воле я не стану.' : 'Крышка тяжёлая. Хью положил на неё ладонь.'),
        items: {
          key: 'У бака нет замка зажигания. Бак вообще существо простое.',
          gun: 'Стрелять в бак? Вода вытечет, и я останусь в луже посреди Луны.',
          saw: 'Стекло пилой не взять.'
        } }
    ],
    actors: {
      hugh: {
        name: 'Хью Блисс', walk: hughWalk, face: 'e',
        look: g => fight(g) ? 'Хью без человеческого костюма. Зелёная рябь в форме Хью. Миллиард существ держит одну улыбку.' : 'Хью Блисс в кристалле, как муха в янтаре. Только муха улыбается и правит планетой.',
        talk: function* (g) {
          if (pending(g)) { yield* begin(g); return; }
          const ft = fight(g);
          if (!ft) { yield g.talkTo('hugh'); return; }
          if (ft.bound) { yield g.say('hugh', g.count('boundTalk') % 2 ? 'Не вертитесь, Сэм. Номер портится.' : 'Дышите. Осталось недолго.'); return; }
          yield g.talkTo('fight');
        },
        use: function* (g) {
          if (pending(g)) { yield* begin(g); return; }
          yield g.say('sam', fight(g) ? 'Лапа проходит сквозь Хью и возвращается мокрой.' : 'До Хью не дотянуться. Он внутри кристалла, а кристалл твёрже вышки.');
        },
        items: {
          mtal: function* (g) { yield* swap(g); },
          gun: function* (g) {
            if (fight(g)) { yield g.say('sam', 'Пуля проходит сквозь Хью. Дырка затягивается, колония даже не сбилась с дыхания.'); return; }
            yield g.say('sam', 'Пуля вязнет в кристалле и повисает внутри.');
            yield g.say('hugh', 'Благодарю, Сэм. Повешу её на стену.');
          },
          glove: g => fight(g) ? 'Перчатка проходит сквозь рябь и возвращается мокрой.' : 'Кристалл перчаткой не пробить.',
          uni: function* (g) {
            yield g.say('hugh', g.f.uniRed ? 'Рогатик. С красным рогом. Вы его грели, Сэм. Запах жулика я узнаю.' : 'Рогатик. Жёлтый рог. Вы честный турист, Сэм.');
            yield* E.uniShown(g, 'hugh');
          },
          saw: g => fight(g) ? 'Пилить Хью? Он срастётся раньше, чем я закончу.' : 'Пила скользит по кристаллу.',
          key: 'Ключу от модуля нужен модуль.',
          gastro: function* (g) {
            if (fight(g)) { yield g.say('sam', 'Талисман молчит. У колонии бактерий нет желудка. Она сама чей-то завтрак.'); return; }
            yield g.say('hugh', 'Гастрокинез против меня? У меня нет желудка, Сэм. Подумайте об этом на досуге.');
          },
          remote: 'Ронять спутник на святилище? Я в нём стою.',
          hat: function* (g) { yield g.say('hugh', 'Шляпа Фило. Я учил его держать её открытой. Фокус всегда падает сверху.'); },
          max: function* (g) {
            if (fight(g)) { yield g.say('sam', 'Макс в приборе. Достать его можно, только разобравшись с Хью.'); return; }
            yield g.say('max', 'Спасибо, Хью. Мне хорошо.');
            yield g.say('hugh', 'На здоровье, Макс. Дышите.');
            yield g.say('sam', 'Хватит. Идём собирать тебя обратно.');
          }
        }
      },
      max: {
        name: g => (fight(g) ? 'Макс в кристалле' : E.ACTOR_HOT.max.name(g)), walk: null,
        look: function* (g) {
          if (fight(g)) { yield g.say('sam', 'Макс сидит в приборе Хью. Кристалл жмёт ему в ушах. Он стучит изнутри и комментирует.'); return; }
          yield* E.ACTOR_HOT.max.look(g);
        },
        talk: function* (g) { yield g.talkTo('max'); },
        use: function* (g) {
          if (fight(g)) { yield g.say('sam', 'Кристалл не открыть, пока Хью цел.'); return; }
          yield* E.ACTOR_HOT.max.use(g);
        },
        items: maxItems
      }
    },
    enter: function* (g) {
      if (!g.f.maxSplit) { yield* confront(g); return; }
      if (pending(g)) yield* begin(g);
    },
    setup(g) {
      const hugh = g.actors.hugh;
      for (const id of ['maxred', 'maxgreen', 'maxblue']) if (g.actors[id].room === 'sanctum') g.place(id, 'nowhere', 0, 0);
      g.vt.fireT = 0;
      g.vt.boilT = 0;
      g.vt.drunk = false;
      if (g.f.boiled) { g.vt.fight = null; g.place('hugh', 'nowhere', 0, 0); }
      else {
        if (!g.f.maxWhole) g.vt.fight = null;
        else if (!g.vt.fight) g.vt.fight = { trap: 0, bound: false, hughIn: false, lander: '', cycle: 1, started: false };
        if (!fight(g)) {
          g.place('hugh', 'sanctum', 240, 136, 's');
          hugh.v = ''; hugh.scale = 0.8;
        }
      }
      stage(g);
    },
    leave(g) {
      const sam = g.actors.sam, max = g.actors.max, hugh = g.actors.hugh;
      sam.scale = null; sam.upside = false; sam.z = 0;
      hugh.upside = false; hugh.z = 0;
      max.scale = null;
      max.follow = 'sam';
      g.f.frozen = false;
    },
    update(g) {
      const ft = fight(g);
      if (!ft) return;
      const T = TRAP[ft.trap];
      if (ft.bound) g.actors.sam.dir = 's';
      if (T && T.id === 'wheel' && (ft.bound || ft.hughIn)) {
        const a = ft.bound ? g.actors.sam : g.actors.hugh;
        const h = ft.bound ? 68 * 0.84 : 84 * 0.76;
        const up = Math.floor(g.time * 0.9) % 2 === 1;
        a.upside = up;
        a.y = up ? T.sam[1] - h : T.sam[1];
      }
      if (ft.trap === 4 && ft.hughIn && !ft.leaving && !g.busy && !g.dialog && g.actors.sam.x < 356) {
        ft.leaving = true;
        g.run(function* () { yield* escape(g); ft.leaving = false; }, { name: 'escape' });
      }
    }
  };

  E.sanctum = { stage };
  E.install();
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
