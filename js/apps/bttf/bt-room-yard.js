(function (S, B) {
  'use strict';
  const C = B.C;
  const E = B.EP1;
  const G = B.grey;
  const { ROOMS, TALK, LAYERS } = E;
  const { play, Circuits } = B.games;
  const MON = B.games.MONTHS;

  LAYERS.yard = {
    car: g => G.layer(250, 100, b => B.BG.paintDeLorean(b, { frost: g.f.frost, dog: !g.f.trail }))
  };

  ROOMS.yard = {
    id: 'yard', name: 'Двор у гаража', w: 800, music: 'bt_yard',
    scale: [306, 0.9, 470, 1],
    bgKey: g => g.f.dateKnown ? 'e' : '',
    paint: (b, g) => B.BG.paintYard(b, g.f.dateKnown),
    walk: [[40, 306, 780, 306, 792, 472, 8, 472]],
    layers: [{ id: 'car', x: 420, y: 250, base: 340, when: g => g.f.boom, key: g => (g.f.frost ? 'f' : '') + (g.f.trail ? '' : 'd') }],
    hot: [
      { id: 'garage', name: 'Лаборатория', rect: [96, 120, 74, 182], walk: [133, 320], face: 'n', exitDir: 'n', exit: { room: 'lab', x: 80, y: 360, dir: 'e' }, look: 'Гараж Дока. Банк хочет его снести.' },
      { id: 'car', name: 'ДеЛориан', rect: [440, 256, 230, 84], when: g => g.f.boom, walk: [520, 360], face: 'n', look: g => g.f.frost ? 'ДеЛориан. Весь в инее, будто его достали из морозилки. За рулём Эйнштейн.' : 'ДеЛориан Дока. Номер OUTATIME.', use: { room: 'car', x: 0, y: 0, dir: 's' }, act: 'use' },
      { id: 'fusion', name: '«Мистер Фьюжн»', rect: [634, 272, 30, 18], when: g => g.f.boom, walk: [660, 360], face: 'n', look: g => g.f.fusion ? 'Заправлен. Банка Биффа пошла на благое дело.' : '«Мистер Фьюжн». Перерабатывает мусор в энергию. Сейчас пустой.', use: g => g.f.fusion ? 'Полный.' : 'Голыми руками его не заправишь. Нужен мусор.', items: { can: function* (g) {
        g.drop('can');
        g.f.fusion = true;
        g.sfx('crunch');
        yield g.say('marty', 'Приятного аппетита.');
      }, photo: 'Папу в топливо? Ни за что.', guitar: 'Гитару жалко.' } },
      { id: 'fence', name: 'Забор', rect: [240, 196, 180, 108], walk: null, look: 'Сетка-рабица. За ней пустырь, где когда-то стоял особняк Браунов.' }
    ],
    actors: {
      george: { name: 'Джордж', dist: 44, look: 'Папа смотрит на мой наряд и молчит. Пока.', talk: function* (g) { yield g.talkTo('george31'); } }
    },
    enter: function* (g) {
      if (g.f.boom && !g.f.carSeen) {
        g.f.carSeen = true;
        E.setChapter(g, 2);
        yield g.say('marty', 'ДеЛориан?! Док!');
        yield g.say('marty', 'Нет. За рулём Эйнштейн.');
      }
      if (g.f.dressed && !g.f.georgeYard) {
        g.f.georgeYard = true;
        g.place('george', 'yard', 250, 380, 'e');
        yield g.say('george', 'Марти? Это что за наряд?');
        yield g.talkTo('george31');
      }
    }
  };

  TALK.george31 = { portrait: 'george', options: [
    { id: 'play', text: 'Это для школьного спектакля.', once: true, run: function* (g) {
      yield g.say('george', '«Гроздья гнева»? Ладно. Слушай, сынок. Можешь ничего не объяснять.');
      yield g.say('george', 'Иногда ради тех, кого любишь, приходится рисковать. Жаль, мой отец этого не понимал.');
    } },
    { id: 'trip', text: 'Пап, мне надо уехать. Ненадолго.', run: function* (g) {
      yield g.say('george', 'Только к ужину вернись. Мама приготовит мясной рулет.');
    } },
    { id: 'bye', text: 'Спасибо, пап.', end: true }
  ] };

  LAYERS.car = {
    dog: () => G.layer(140, 120, b => {
      const P = new S.Pen(b).at(70, 70, 2.6, false);
      P.part(P.poly(B.art.shag(0, 14, 18, 12, 18, 0.16, 21)), C.cream, { b: 3 });
      B.art.dogHead(P, 0, -4, {}, true);
    }),
    recorder: () => G.layer(40, 28, b => { G.rect(b, 2, 4, 36, 22, C.grey, { b: 1 }); G.rect(b, 8, 8, 24, 10, C.steel, { b: 2, sh: 0 }); }),
    shoe: () => G.layer(40, 20, b => { const P = new S.Pen(b); P.part(P.path('M 2 16 Q 4 8 14 8 Q 22 0 30 4 L 38 12 L 38 18 L 2 18 Z'), C.navy, { b: 3 }); })
  };

  ROOMS.car = {
    id: 'car', name: 'Салон ДеЛориана', w: 640, music: 'bt_yard',
    bgKey: g => g.f.circuitsOn ? 'on' : '',
    paint: (b, g) => B.BG.paintCar(b, g.f.circuitsOn),
    walk: [],
    setup(g) { g.actors.marty.visible = false; g.sfx('gullwing'); },
    leave(g) { g.actors.marty.visible = true; g.sfx('gullwing'); },
    layers: [
      { id: 'dog', x: 470, y: 300, base: 300 },
      { id: 'recorder', x: 180, y: 360, base: 400, when: g => !g.f.recorderTaken },
      { id: 'shoe', x: 260, y: 420, base: 440, when: g => !g.f.shoeTaken }
    ],
    hot: [
      { id: 'out', name: 'Выйти', rect: [20, 120, 120, 200], walk: null, exitDir: 'w', exit: { room: 'yard', x: 520, y: 362, dir: 's' }, look: 'Дверь-крыло.' },
      { id: 'dog', name: 'Эйнштейн', rect: [470, 300, 140, 120], walk: null, look: 'Эйнштейн. Живой, тёплый и очень рад меня видеть.', talk: function* (g) { yield g.say('einstein', 'Гав!'); yield g.say('marty', 'Где Док, Эйни?'); }, use: 'Эйнштейн облизывает мне руку.', items: {
        shoe: function* (g) {
          if (g.f.trail) { yield g.say('marty', 'След он уже взял.'); return; }
          yield g.say('marty', 'Что скажешь про эту туфлю, Эйни?');
          yield g.say('einstein', 'Гав! Гав!');
          g.f.trail = true;
          yield* B.cine.play(g, B.cine.skate());
          g.place('einstein', 'street86', 420, 410, 'w');
          yield* g.goRoom('street86', { x: 300, y: 420, dir: 'e' });
        },
        photo: 'Эйнштейн нюхает фото и чихает.'
      } },
      { id: 'recorder', name: 'Диктофон', rect: [180, 360, 40, 28], when: g => !g.f.recorderTaken, walk: null, look: 'Карманный диктофон. На кассете надпись: «МАРТИ!!!».', use: function* (g) {
        g.f.recorderTaken = true;
        g.give('recorder');
        yield* tape(g);
      } },
      { id: 'shoe', name: 'Туфля', rect: [260, 420, 40, 20], when: g => !g.f.shoeTaken, walk: null, look: 'Женская туфля на полу у пассажирского места. Не Дока точно.', use: function* (g) { g.f.shoeTaken = true; g.give('shoe'); yield g.say('marty', 'Туфля. Женская. Интересно.'); } },
      { id: 'display', name: 'Временные контуры', rect: [230, 210, 180, 80], walk: null, look: g => g.f.circuitsOn ? 'Табло горит: куда, сейчас и откуда.' : g.f.dateKnown ? 'Табло тёмное.' : 'LAST TIME DEPARTED показывает одни восьмёрки. Ну и где теперь искать Дока?', use: function* (g) { yield* keypad(g); } },
      { id: 'keypad', name: 'Пульт', rect: [430, 236, 70, 56], walk: null, look: 'Клавиатура временных контуров.', use: function* (g) { yield* keypad(g); } },
      { id: 'switch', name: 'Тумблер', rect: [300, 300, 40, 26], walk: null, look: g => g.f.circuitsOn ? 'Контуры включены.' : 'Тумблер временных контуров.', use: function* (g) {
        g.f.circuitsOn = !g.f.circuitsOn;
        g.sfx(g.f.circuitsOn ? 'flux' : 'click');
        yield g.say('marty', g.f.circuitsOn ? 'Контуры горят.' : 'Погасли.');
      } },
      { id: 'flux', name: 'Потоковый конденсатор', rect: [540, 40, 90, 120], walk: null, look: '«Отключить привод конденсатора перед вскрытием». И «беречь глаза от света».', use: 'Трогать его без Дока я не буду.' }
    ]
  };

  function* tape(g) {
    g.sfx('rewind');
    const t = (s) => E.voice(g, 'tape', s);
    yield g.say('marty', 'Это голос Дока!');
    yield t('Марти, ты уже приходил мне на помощь в прошлом. Или это было в будущем? Неважно. Мне снова нужна твоя помощь.');
    yield t('Машина вернулась к тебе сама: я поставил автоматический возврат на случай беды. Значит, беда случилась.');
    yield t('Отправляйся туда, откуда она приехала. Дата будет на табло последнего отъезда.');
    yield g.say('marty', 'И всё? А когда это, Док?');
    if (!g.f.tapeHeard) { g.f.tapeHeard = true; yield g.say('marty', 'На табло одни восьмёрки. Ну конечно.'); }
  }

  function present(g) { return g.f.arrived ? ['JUN', '13', '1931', 'AM', '04', '00'] : ['MAY', '14', '1986', 'PM', '07', '27']; }

  function* keypad(g) {
    if (!g.f.circuitsOn) { yield g.say('marty', 'Табло не горит.'); return; }
    const r = yield* play(g, new Circuits({ present: present(g), last: g.f.dateKnown ? null : 'garbage' }));
    if (!r) return;
    if (r.m < 1 || r.m > 12 || r.d < 1 || r.d > 31 || r.y < 1) { yield g.say('marty', 'Таких дат не бывает даже у Дока.'); return; }
    if (!g.f.dateKnown) { yield g.say('marty', 'Наобум ехать нельзя. Я даже не знаю, когда искать Дока.'); return; }
    if (r.y === 1955) { yield g.say('marty', 'В пятьдесят пятый? Хватит с меня пятьдесят пятого.'); return; }
    if (r.y > 1986) { yield g.say('marty', 'Будущее подождёт. Сначала Док.'); return; }
    if (r.y === 1931 && r.m === 6 && r.d === 14) { yield g.say('marty', 'Четырнадцатого будет поздно. В газете сказано: «прошлой ночью».'); return; }
    if (!(r.y === 1931 && r.m === 6 && r.d === 13)) { yield g.say('marty', MON[r.m - 1] + ' ' + r.d + ' ' + r.y + '? Газета говорит о другом дне.'); return; }
    if (!g.f.dressed) { yield g.say('marty', 'В таком виде в тридцать первом меня примут за марсианина.'); return; }
    if (!g.f.fusion) { yield g.say('marty', '«Мистер Фьюжн» пустой. Без топлива даже во времени далеко не уедешь.'); return; }
    yield* depart(g);
  }

  function* depart(g) {
    E.setChapter(g, 3);
    yield* B.cine.play(g, B.cine.circuitsSet());
    yield* B.cine.play(g, B.cine.highway());
    yield* B.cine.play(g, B.cine.arrival());
    g.f.arrived = true;
    E.setChapter(g, 4);
    g.place('einstein', 'square', 540, 400, 's');
    g.place('edna', 'square', 1180, 390, 'w');
    g.place('kid', 'square', 1480, 404, 's');
    g.place('cueball', 'kitchen', 330, 298, 's');
    g.place('matches', 'square', 1522, 408, 'w');
    yield* g.goRoom('square', { x: 1300, y: 400, dir: 'w' });
  }

  E.keypad = keypad;
  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
