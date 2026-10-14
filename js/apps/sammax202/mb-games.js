(function (S) {
  'use strict';
  const { C } = S;
  const E = S.EP202;

  E.portalPuzzle = function* (g) {
    g.sfx('zap');
    yield g.say('sam', 'Камертон вибрирует на трех нотах. Портальная дуга раскрывается над жерлом вулкана.');
    g.f.portalTuned = true;
  };

  E.divertLava = function* (g) {
    g.hideUI = true;
    g.music('finale22');
    g.sfx('rumble');
    g.fx.shake = 1.4;
    yield 1.0;
    yield g.say('sam', 'Лава переливается через край кальдеры!');
    yield g.say('max', 'Сэм, прыгай в магму! Она такая теплая и праздничная!');
    yield g.say('sam', 'Ставлю сейсмический инвертор на базальтовую плиту.');
    g.sfx('servo');
    g.drop('seismic');
    yield 0.8;
    g.sfx('zap');
    yield g.say('sam', 'Ударная волна разворачивает треугольный разлом прямо навстречу потоку.');
    yield g.say('max', 'Огонь засасывает внутрь! А куда он вылетит?');
    yield g.say('sam', 'В открытый Тихий океан, в трех милях к западу. Там как раз плавала старая баржа.');
    g.sfx('splash');
    g.fx.shake = 0.5;
    g.f.lavaDiverted = true;
    yield 1.2;
    yield g.say('sam', 'Поток иссяк. Вулкан снова спокоен. Осталось разобраться с жрецом.');
    g.hideUI = false;
  };

  E.defeatSpatula = function* (g) {
    g.hideUI = true;
    yield g.say('sam', 'Золотой купол остался без защиты лавы.');
    yield g.say('max', 'Дай я его укушу! Я всегда мечтал пожевать жреца!');
    yield g.say('sam', 'Мы поступим гуманнее. Сачок правосудия и банка из-под майонеза.');
    g.sfx('pop');
    yield 0.6;
    g.give('spatula');
    g.f.spatulaCaptured = true;
    yield g.say('sam', 'Мистер Лопатка пойман. Заговор золотого карася официально подавлен.');
    yield g.say('max', 'А можно я назначу его министром обороны?');
    yield g.say('sam', 'Он пойдет в шкаф вещдоков, Макс. Рядом с головой Линкольна.');
    g.hideUI = false;
    yield* E.epilogue(g);
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
