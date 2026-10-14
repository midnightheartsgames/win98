(function (S, B) {
  'use strict';
  const C = B.C;
  const E = B.EP1;
  const G = B.grey;
  const { ROOMS, TALK, LAYERS } = E;

  function paintVan(b) {
    const P = new S.Pen(b);
    P.part(P.rect(2, 4, 150, 98), C.snow, { b: 3, sh: 1 });
    for (let x = 10; x < 150; x += 12) P.line(x, 6, x, 100, C.snow[2]);
    P.part(P.rect(30, 14, 92, 66), C.night, { b: 1, sh: 0, hi: 0 });
    P.part(P.rect(36, 20, 40, 56), C.steel, { b: 1, sh: 0 });
    for (let y = 26; y < 74; y += 10) { P.line(38, y, 74, y, C.steel[0]); b.set(42 + (y % 3) * 6, y + 3, y % 20 ? C.ledG : C.ledR); b.set(60, y + 4, C.ledY); }
    P.curve('M 78 30 Q 96 60 88 78', C.red[2]);
    P.curve('M 82 24 Q 110 40 114 78', C.ledY);
    P.curve('M 76 50 Q 100 70 120 66', C.teal[3]);
    P.part(P.rect(84, 56, 30, 22), C.vest, { b: 3, sh: 0 });
    G.label(b, 'Д-Р Э. БРАУН', 76, 84, C.navy[2]);
    P.part(P.path('M 152 34 L 196 34 L 220 62 L 226 64 L 226 102 L 152 102 Z'), C.snow, { b: 3, sh: 1 });
    P.part(P.poly([160, 40, 192, 40, 212, 62, 160, 62]), C.night, { b: 2, sh: 0, hi: 1 });
    P.line(158, 66, 158, 100, C.snow[1]);
    P.part(P.rect(216, 70, 10, 6), C.cream, { b: 4, sh: 0, hi: 0 });
    P.part(P.rect(150, 96, 80, 8), C.steel, { b: 2, sh: 0 });
    for (const x of [44, 188]) { P.part(P.ell(x, 104, 15, 15), C.stone, { b: 0, sh: 0 }); P.part(P.ell(x, 104, 7, 7), C.steel, { b: 3, sh: 0 }); }
  }

  LAYERS.mall = {
    van: () => G.layer(232, 122, paintVan),
    toolbox: () => G.layer(44, 30, b => {
      const P = new S.Pen(b);
      P.part(P.rect(3, 12, 38, 16), C.vest, { b: 3 });
      P.line(3, 18, 41, 18, C.vest[1]);
      P.part(P.rect(14, 4, 16, 4), C.steel, { b: 2, sh: 0 });
      for (const x of [14, 28]) P.line(x, 8, x, 12, C.steel[1]);
      P.part(P.rect(8, 9, 22, 4), C.cream, { b: 4, sh: 0 });
    }),
    camera: () => G.layer(36, 70, b => {
      const P = new S.Pen(b);
      for (const x1 of [4, 32, 20]) P.line(18, 26, x1, 68, C.steel[2]);
      P.part(P.rect(6, 10, 24, 14), C.stone, { b: 1, sh: 0 });
      P.part(P.ell(30, 17, 4, 5), C.stone, { b: 2, sh: 0 });
      P.part(P.ell(30, 17, 2, 3), C.night, { b: 3, sh: 0, hi: 0 });
      b.set(9, 13, C.ledR);
    }),
    sign: g => G.layer(206, 106, b => B.BG.paintMallSign(b, g.f.nightmare))
  };

  ROOMS.mall = {
    id: 'mall', name: 'Стоянка «Две сосны»', w: 960, music: 'bt_dream', noSave: g => !g.f.introDone,
    scale: [330, 0.86, 470, 1],
    bgKey: g => g.f.nightmare ? 'n' : '',
    paint: (b, g) => B.BG.paintMall(b, g.f.nightmare),
    walk: [[20, 330, 940, 330, 952, 472, 8, 472]],
    layers: [
      { id: 'van', x: 36, y: 296, base: 414 },
      { id: 'camera', x: 330, y: 316, base: 384 },
      { id: 'toolbox', x: 266, y: 390, base: 418, when: g => !g.f.notebookToDoc },
      { id: 'sign', x: 706, y: 178, base: -1000, key: g => g.f.nightmare ? 'n' : '' }
    ],
    hot: [
      { id: 'van', name: 'Фургон Дока', rect: [36, 300, 232, 118], walk: [160, 420], face: 'n', look: 'Фургон Дока. Внутри полно приборов и кабелей.', use: 'Туда лучше без Дока не лазить.' },
      { id: 'toolbox', name: 'Ящик с инструментами', rect: [266, 398, 44, 22], when: g => !g.f.notebookToDoc, walk: [300, 428], face: 's', look: 'Оранжевый ящик Дока. Сверху лежит тетрадь.', use: function* (g) {
        if (!g.f.introDone) { yield g.say('marty', 'Сначала досмотрю опыт.'); return; }
        yield g.anim('marty', 'reach', 0.5);
        g.f.notebookToDoc = true;
        yield* nightmare(g);
      } },
      { id: 'sign', name: 'Вывеска', rect: [716, 196, 186, 84], walk: [800, 350], face: 'n', look: g => g.f.nightmare ? 'Теперь там написано «Одинокая сосна».' : '«Торговый центр Две сосны».' },
      { id: 'camera', name: 'Камера', rect: [334, 324, 32, 60], walk: [350, 420], face: 'n', look: 'Камера на штативе. Всё пишется. Для истории.', use: 'Пусть пишет дальше.' },
      { id: 'trails', name: 'Огненный след', rect: [520, 386, 180, 32], walk: [600, 430], face: 'n', look: 'Две полосы огня на асфальте. Тут только что стоял ДеЛориан.', use: 'Горячо. Очень горячо.' },
      { id: 'mall', name: 'Торговый центр', rect: [30, 110, 900, 150], walk: null, look: 'Ночью тут ни души. Только мы с Доком и камера.' }
    ],
    actors: {
      doc: { name: 'Док', dist: 50, look: 'Док. Защитный комбинезон, пульт с антенной и глаза, как у ребёнка в Рождество.', talk: function* (g) {
        if (!g.f.introDone) { yield g.talkTo('doc85'); return; }
        yield g.say('doc', 'Блокнот, Марти! Он в ящике у фургона.');
      } }
    }
  };

  TALK.doc85 = { portrait: 'doc', options: (g, d) => {
    const st = d.data.step || 0;
    if (st === 0) return [
      { id: 'disint', text: 'Ты испарил Эйнштейна!', run: function* (g, dd) { d.data.film = (d.data.film || 0) + 1; d.data.step = 1; yield g.say('doc', 'Успокойся, Марти. Молекулы Эйнштейна целы. Целёхоньки.'); } },
      { id: 'where', text: 'Где машина, Док?', run: function* () { d.data.step = 1; yield g.say('doc', 'Машина там же, где и была. Просто не в этой минуте.'); } },
      { id: 'heck', text: 'Это ещё что было?', run: function* () { d.data.step = 1; yield g.say('doc', 'Это, Марти, был первый в истории рейс во времени!'); } }
    ];
    return [
      { id: 'built', text: 'Подожди. Ты сделал машину времени из ДеЛориана?', end: true, run: function* () { d.data.film = (d.data.film || 0) + 1; yield* after(g, d); } },
      { id: 'works', text: 'Она правда вернётся?', end: true, run: function* () { yield* after(g, d); } },
      { id: 'cool', text: 'Круто, Док.', end: true, run: function* () { yield* after(g, d); } }
    ];
  } };

  function* after(g, d) {
    if (d.data.film === 2) { g.f.dejaMarty = true; yield g.say('doc', 'Странно. У меня ощущение, что ты это уже говорил.'); }
    else yield g.say('doc', 'Если делать, то с размахом. А у этой машины ещё и нержавеющий корпус.');
    yield g.say('doc', 'Ровно в 1:21 и ноль секунд мы его поймаем.');
    yield 1.2;
    yield g.say('doc', '1:21... Где же он?');
    yield g.say('doc', 'Мне нужны мои записи. Марти, принеси блокнот!');
  }

  function* nightmare(g) {
    const doc = g.actors.doc;
    doc.scripted = true;
    yield g.walkTo('marty', doc.x - 50, doc.y + 4);
    g.faceTo('marty', doc.x);
    yield g.say('doc', 'Так. Масса, частота, дисперсия потока... Перенос девятки...');
    yield g.say('doc', 'Нет. Нет, нет, нет. Я совершил ужасную ошибку.');
    g.f.nightmare = true;
    g.fx.flash = 0.8;
    g.sfx('boom');
    yield 0.6;
    yield* B.cine.play(g, B.cine.nightmare());
    doc.visible = false;
    doc.scripted = false;
    yield* B.cine.play(g, B.cine.bedroom());
    yield* E.startChapter1(g);
  }

  E.prologue = function* (g) {
    yield* B.cine.play(g, B.cine.prologue());
    yield g.fadeIn(3);
    yield g.say('doc', 'Ха! Что я тебе говорил? Восемьдесят восемь миль в час!');
    yield g.talkTo('doc85');
    g.f.introDone = true;
  };

  E.startChapter1 = function* (g) {
    E.setChapter(g, 1);
    g.actors.doc.visible = true;
    g.place('doc', null, 0, 0, 's');
    g.place('george', 'lab', 236, 352, 's');
    g.place('biff', 'labback', 470, 380, 'w');
    g.place('ednaOld', 'edna86', 420, 372, 's');
    g.fade = 1;
    g.setRoom('lab', { x: 90, y: 420, dir: 'e' });
    yield g.fadeIn(2);
    yield g.say('george', 'Марти, ну наконец-то. Покупатели с девяти утра ходят.');
    yield g.say('marty', 'Пап, я проспал. Мне снился Док.');
    yield g.say('george', 'Банк ждать не станет. Посмотри, что тут можно спасти, пока всё не растащили.');
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
