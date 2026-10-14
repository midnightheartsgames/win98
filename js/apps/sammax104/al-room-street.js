(function (S) {
  'use strict';
  const E = S.EP104;
  const { ROOMS, TALK } = E;

  function* ambient(g) {
    for (;;) {
      yield 0.5;
      const h = g.actors.hugh;
      if (!g.vt.hughBack || g.time < g.vt.hughBack || g.busy || g.dialog) continue;
      g.vt.hughBack = 0;
      h.visible = true; h.act = ''; h.keepAct = false;
      g.sfx('chime');
      g.fx.flash = 0.2;
      if (g.f.deliveryTaken && !g.seen.hughMiss) { g.seen.hughMiss = 1; g.say('hugh', 'Вот и я. Таблички нет. Значит, доставка отныне подразумевается.'); }
      else g.say('hugh', 'Вот и я. Я был везде. Там красиво.');
    }
  }

  function* vanish(g) {
    const h = g.actors.hugh;
    yield g.say('hugh', 'С радостью. Я исчезну. Вдох... выдох...');
    h.act = 'magic'; h.keepAct = true;
    g.sfx('chime');
    yield 0.9;
    g.fx.flash = 0.4;
    h.visible = false;
    h.act = ''; h.keepAct = false;
    yield g.say('max', 'Исчез! Сэм, быстро, сделай что-нибудь, чего при нём нельзя!');
    g.vt.hughBack = g.time + 9;
  }

  TALK.hugh = {
    start: function* (g) {
      if (!g.seen.hugh104) { g.seen.hugh104 = 1; yield g.say('hugh', 'Здравствуйте, Сэм. Здравствуйте, Макс. Какого вы сегодня цвета?'); }
    },
    options: [
      { id: 'who', icon: 'f:hugh', text: 'Хью? Вы же вели викторину.', run: function* (g) {
        yield g.say('hugh', 'Викторина кончилась в тот день, когда вы её выиграли. Теперь я несу людям призматологию.');
      } },
      { id: 'prism', icon: 'rainbow', text: 'Что такое призматология?', run: function* (g) {
        yield g.say('hugh', 'Внутри каждый человек радуга. Снаружи он обычно бежевый. Я помогаю вывернуться.');
        yield g.say('max', 'Я хочу вывернуться! Сэм, можно?');
        yield g.say('sam', 'Ты и так наизнанку, Макс.');
      } },
      { id: 'book', icon: 'book', text: 'Что это за книга?', run: function* (g) {
        yield g.say('hugh', '«Эметика». Самоучитель разноцветного счастья. Переведена на пятнадцать тысяч языков, включая эсперанто.');
        yield g.say('sam', '«Эметика». Это ведь от слова «рвотное».');
        yield g.say('hugh', 'Сначала из человека должно выйти всё серое.');
      } },
      { id: 'free', icon: 'money', text: 'Почему книга бесплатная?', run: function* (g) {
        yield g.say('hugh', 'Счастье не продают. Его доставляют. Адреса у меня есть. Все.');
      } },
      { id: 'pres', icon: 'f:pres', text: 'Вы слышали, что творит президент?', when: g => g.f.caseOpen && !g.f.puppetDown, run: function* (g) {
        yield g.say('hugh', 'Очень яркий человек. Я смотрю все его обращения. Каждое как в первый раз.');
      } },
      { id: 'abe', icon: 'f:lincoln', text: 'За кого вы голосуете?', when: g => g.f.election, run: function* (g) {
        yield g.say('hugh', g.f.elected ? 'Победил кролик. Белый цвет содержит все остальные. Я спокоен.' : 'Мрамор или мех. Оба кандидата белые, Сэм. Меня устроит любой исход.');
      } },
      { id: 'trick', icon: 'magic', text: 'Покажите фокус.', end: true, run: function* (g) { g.endDialog(); yield* vanish(g); } },
      { id: 'bye', icon: 'bye', text: 'Нам пора.', end: true, run: function* (g) {
        yield g.say('hugh', 'Идите с миром. Он вас догонит.');
      } }
    ]
  };

  const PAPER_Y = [
    '«Утренний курьер». «Казино без мафии взлетело на воздух. Мафия отрицает, что была внутри».',
    '«Министром обороны назначен оловянный солдатик. Пентагон отдал честь».',
    '«Пудинг ушёл в подполье. Очевидцы говорят, что он дрожал».'
  ];

  ROOMS.street = {
    id: 'street', name: 'Улица', w: 640, music: 'street',
    scale: [138, 0.84, 166, 0.92],
    paint: b => S.BG.street(b),
    walk: [[0, 139, 640, 139, 640, 166, 0, 166]],
    layers: [
      { id: 'posters', x: 186, y: 78, key: g => (g.f.posterTaken ? 't' : '') + (g.f.election ? 'e' : '') + (g.f.maxRuns ? 'm' : '') },
      { id: 'hughstand', x: 340, y: 96 },
      { id: 'delivery', x: 336, y: 48, when: g => !g.f.deliveryTaken },
      { id: 'sybilSign', x: 4, y: 44, key: g => g.f.scandal ? 'c' : '' },
      { id: 'sybilPlate', x: 102, y: 88, key: g => g.f.scandal ? 'c' : '' },
      { id: 'boscoFlag', x: 440, y: 58 },
      { id: 'boscoBanner', x: 408, y: 43 },
      { id: 'lamp', x: 166, y: 56, base: 166 },
      { id: 'lamp2', art: 'lamp', x: 436, y: 56, base: 166 },
      { id: 'hydrant', x: 258, y: 148, base: 166 },
      { id: 'mailbox', x: 394, y: 136, base: 164 },
      { id: 'paperY', x: 510, y: 132, base: 165 },
      { id: 'paperG', x: 532, y: 132, base: 165 },
      { id: 'desoto', x: 14, y: 156, base: 200 },
      { id: 'redcar', x: 150, y: 162, base: 199 }
    ],
    ambient,
    hot: [
      { id: 'sybildoor', name: 'Контора Сибил', rect: [66, 76, 34, 64], walk: [82, 143], face: 'n',
        look: g => g.f.scandal ? 'Дверь Сибил. Сердечко на ручке перевязано чёрной ленточкой.' : 'Дверь Сибил. На ручке висит сердечко. Сибил опять кем-то стала.',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('sybil', { x: 40, y: 170, dir: 'e' }); } },
      { id: 'officedoor', name: 'Наш офис', rect: [284, 58, 38, 82], walk: [303, 141], face: 'n',
        look: 'Наш подъезд. Под дверь сунули листовку «Обнимись с соседом». Наш сосед живёт в стене и сейчас в отпуске.',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('office', { x: 284, y: 162, dir: 'w' }); } },
      { id: 'boscodoor', name: 'Лавка Боско', rect: [466, 60, 36, 80], walk: [484, 143], face: 'n',
        look: 'Лавка Боско. Над дверью красный флаг со звездой. На коврике надпись латиницей: «DOBRO POZHALOVAT».',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('bosco', { x: 36, y: 172, dir: 'e' }); } },
      { id: 'desoto', name: 'Де Сото', rect: [16, 158, 128, 40], walk: [80, 164], face: 's', walkUse: true,
        look: ['Наш Де Сото. До Вашингтона на нём десять минут. География в этом городе сговорчивая.', 'На заднем сиденье коробка из-под пиццы. Её заказывал мой голос, ел Макс.'],
        use: function* (g) { yield* S.openMap(g); } },
      { id: 'redcar', name: 'Чужая машина', rect: [152, 164, 84, 32], walk: [200, 164], face: 's',
        look: 'Чужая машина. На стекле свежая наклейка: «Я обнялся в четверг». Машина стоит тут с понедельника.',
        use: 'Заперто. Хозяин, видимо, до сих пор обнимается.' },
      { id: 'posters', name: 'Плакаты', rect: [186, 78, 66, 58], walk: [218, 148], face: 'n',
        look: g => g.f.maxRuns ? 'Армейские плакаты, под ними агитация. «Эйб. 1861». Рядом Макс, на его плакате только зубы.' : g.f.election ? 'Армейские плакаты, а под ними уже висит «Эйб. 1861». Клеили ночью, пока статуя ещё сидела.' : g.f.posterTaken ? 'Армейские плакаты. Один я забрал. Сержанты на остальных смотрят с осуждением.' : 'Стена в армейских плакатах. Сержант тычет пальцем: «Отдай всё, что есть!» Крайний плакат держится на одной кнопке.',
        use: function* (g) {
          if (g.f.posterTaken) { yield g.say('sam', 'Одного сержанта мне хватит. Остальные пусть служат на стене.'); return; }
          yield g.anim('sam', 'reach', 0.5);
          g.sfx('rip');
          g.f.posterTaken = true;
          g.give('poster');
          yield g.say('sam', '«Отдай всё, что есть!» И отдал, с первой же кнопки. Армия щедрее, чем о ней говорят.');
        },
        items: { gun: 'Стрелять по сержантам? Их тут трое, и все нарисованы злыми.' } },
      { id: 'delivery', name: 'Табличка «Доставка на дом»', rect: [336, 48, 50, 20], walk: [362, 146], face: 'n', when: g => !g.f.deliveryTaken,
        look: '«Бесплатная доставка на дом!» Табличка Хью Блисса. Радужная кайма, один шуруп.',
        use: function* (g) {
          const h = g.actors.hugh;
          if (h.visible && h.room === 'street') { yield g.say('hugh', 'Табличку не трогайте, Сэм. Она часть предложения.'); return; }
          yield g.anim('sam', 'reach', 0.5);
          g.sfx('rip');
          g.f.deliveryTaken = true;
          g.give('delivery');
          yield g.say('sam', 'Хью вернётся и, надеюсь, решит, что табличка тоже вывернулась.');
        } },
      { id: 'hughstand', name: 'Стойка с книгами', rect: [340, 96, 48, 34], walk: [362, 146], face: 'n',
        look: 'Ящики под радужной скатертью. На них стопки «Эметики». Обложки разного цвета, текст, подозреваю, один.',
        use: function* (g) {
          const h = g.actors.hugh;
          if (h.visible) { yield g.say('hugh', 'Берите, Сэм. Бесплатно.'); yield g.say('sam', 'Спасибо. Бесплатное в нашем районе обходится дороже всего.'); return; }
          yield g.say('sam', 'Книгу не возьму. Макс её съест, а потом вывернется.');
        } },
      { id: 'paperY', name: 'Жёлтый газетный автомат', rect: [510, 132, 20, 34], walk: [520, 150], face: 'n',
        look: function* (g) {
          if (g.f.elected && !g.seen.paperWin) { g.seen.paperWin = 1; yield g.say('sam', '«Утренний курьер». «Кролик в Белом доме. Никто проиграл выборы».'); return; }
          yield g.say('sam', PAPER_Y[(g.count('paperY') - 1) % PAPER_Y.length]);
        },
        use: 'Монет у меня нет. Заголовки видно и через стекло.' },
      { id: 'paperG', name: 'Зелёный газетный автомат', rect: [532, 132, 20, 34], walk: [542, 150], face: 'n',
        look: ['«Вестник инопланетных треугольников». Последний номер. Сибил бросила газету, а автомат всё ещё в неё верит.', 'На первой полосе мы с Максом и зелёный Хью. Слава прошла, тираж остался.'],
        use: 'Этот номер у нас есть. Он подшит к делу о телестудии.' },
      { id: 'window', name: 'Окно нашего офиса', rect: [194, 10, 52, 46], walk: [218, 148], face: 'n',
        look: 'Окно нашего офиса. В нём мигает телевизор. Президент вещает даже в пустую комнату.' },
      { id: 'hydrant', name: 'Гидрант', rect: [256, 146, 16, 20], walk: [250, 160],
        look: 'Гидрант. К нему привязали ленточку «Обними меня». Закон велит обнимать соседа, и гидрант ближе всех.',
        use: 'Обнимать гидрант я не буду. До четверга ещё есть время.' },
      { id: 'mailbox', name: 'Почтовый ящик', rect: [394, 136, 20, 30], walk: [388, 158],
        look: 'Из щели торчит казённый конверт: «Повестка на экзамен по радости. Явка с улыбкой».',
        use: 'Чужую повестку не трону. Свою я ещё не получил и не тороплюсь.' },
      { id: 'boscosign', name: 'Вывеска Боско', rect: [404, 24, 156, 30], look: 'BOSCO\'S. Ниже натянут красный транспарант: «Народный склад неудобств». Буквы разной высоты, как будто писали в темноте.' },
      { id: 'flag', name: 'Флаг', rect: [440, 58, 24, 18], walk: [452, 146], face: 'n', look: 'Красный флаг с золотой звездой. На древке бирка магазина карнавальных костюмов.' },
      { id: 'sybilsign', name: 'Вывеска Сибил', rect: [4, 44, 144, 11],
        look: g => g.f.scandal ? '«Даты на заказ». Вывеска прежняя, сердечки заклеены бумажками. На одной выведено «С-14».' : '«Даты на заказ». По бокам сердечки. В прошлом месяце тут были свидетельские услуги, до них газета.' },
      { id: 'alley', name: 'Переулок', rect: [566, 0, 74, 140], look: 'Переулок за лавкой Боско. Тихо. Даже кошки, похоже, ушли обниматься.' }
    ],
    actors: {
      hugh: {
        name: 'Хью Блисс', when: g => g.actors.hugh.visible,
        look: 'Хью Блисс. Белый костюм, радужная лента, улыбка без единой тени. В прошлом деле он вёл викторину. Теперь раздаёт книги.',
        talk: function* (g) { yield g.talkTo('hugh'); },
        items: {
          roach: function* (g) { yield* E.bugPlant(g, 'hugh'); },
          dater: function* (g) { g.sfx('scan'); yield g.say('sam', 'На экране вместо числа написано: «Жжёная сиена».'); yield g.say('max', 'Он не выглядит ни на день старше бежевого!'); },
          serum: function* (g) { yield g.say('hugh', 'Нет-нет. Я не пью, Сэм. Совсем. Никогда. Уберите.'); yield g.say('sam', 'Впервые вижу, чтобы Хью перестал улыбаться. На полсекунды, но я успел.'); },
          gun: function* (g) { yield g.say('hugh', 'Оружие серое, Сэм. Попробуйте покрасить.'); },
          glove: function* (g) { yield g.say('hugh', 'Красная. Хороший цвет. Бить им, правда, необязательно.'); },
          head: function* (g) { yield g.say('hugh', 'Какая ровная улыбка. Её делал человек, который разбирается в счастье.'); },
          flyer: function* (g) { yield g.say('hugh', 'Линкольн. Белый мрамор. В белом, Сэм, прячутся все цвета сразу.'); },
          poster: function* (g) { yield g.say('hugh', 'Хаки. Цвет, который прячется. Я ему сочувствую.'); },
          max: function* (g) { yield g.say('max', 'Хью, а какого цвета я внутри?'); yield g.say('hugh', 'Я заглядывал, Макс. Там темно и кто-то рычит.'); }
        }
      }
    },
    enter: function* (g) {
      if (!g.seen.street104 && g.f.caseOpen) {
        g.seen.street104 = 1;
        yield g.say('max', 'Сэм, гляди! У Сибил сердечки, у Боско красный флаг, а на ящиках кто-то разноцветный!');
        yield g.say('sam', 'Сибил сменила вывеску, Боско сменил шапку. Значит, неделя началась.');
      }
    },
    setup(g) {
      const h = g.actors.hugh;
      g.place('hugh', 'street', 372, 150, 's');
      h.visible = true; h.act = ''; h.keepAct = false;
      g.vt.hughBack = 0;
    },
    onLoad(g) { ROOMS.street.setup(g); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
