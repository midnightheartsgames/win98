(function (S) {
  'use strict';
  const E = S.EP102;
  const { ROOMS, TALK } = E;

  const DISHES = {
    cake: { icon: 'pinkcake', text: 'Торт! Праздничный!', done: 'Готово. Торт. Розовый, пористый и тёплый изнутри, как будто в нём кто-то живёт.' },
    stew: { icon: 'pot', text: 'Запеканку по-холостяцки!', done: 'Запеканка. Серая. Пахнет упаковкой от запеканки.' },
    shake: { icon: 'cup', text: 'Коктейль «Одинокий вечер»!', done: 'Коктейль «Одинокий вечер». Он дымится и тихо гудит.' }
  };
  const FEEL = [
    { id: 'spray', text: 'Баллончик. Шипит, если потрясти.', max: 'Сыр из баллончика! Оранжевый, как дорожный конус!' },
    { id: 'powder', text: 'Пакет. Внутри что-то сыпучее и скрипучее.', max: 'Яичный порошок! Или штукатурка! Пополам!' },
    { id: 'tube', text: 'Тюбик. Тёплый. Почему он тёплый?', max: 'Розовая глазурь! Светится в темноте! Спонсор эпизода!' },
    { id: 'jar', text: 'Банка. Внутри что-то булькает само по себе.', max: 'Соус «Как будто мясо»! На этикетке нарисована корова, которая плачет!' },
    { id: 'box', text: 'Коробочка. Гремит, как будто в ней зубы.', max: 'Сухие сливки в гранулах! Гранулы, Сэм! Сливки не бывают в гранулах!' },
    { id: 'can', text: 'Жестянка. Холодная, с усиками.', max: 'Консервированный бекон! Усики, кстати, настоящие!' }
  ];

  function feelOptions(g) {
    const r = new S.RNG((g.seed + (g.f.cookRound || 0) * 71 + (g.f.cook ? g.f.cook.picks.length : 0) * 13) >>> 0);
    return r.shuffle(FEEL).slice(0, 3);
  }

  function* startShow(g) {
    const sam = g.actors.sam;
    g.f.cook = { dish: null, picks: [] };
    g.f.cookRound = (g.f.cookRound || 0) + 1;
    yield g.walkTo('sam', 176, 152);
    g.face('sam', 'n');
    yield g.anim('sam', 'reach', 0.4);
    g.f.maskOn = true;
    sam.v = 'blind';
    g.face('sam', 's');
    g.sfx('click');
    yield g.say('director', 'Эфир через три, две... «Готовим не глядя»! Сегодня у нас новый ведущий.');
    yield g.say('sam', 'Добрый вечер, одинокие сердца. Сегодня готовим, как всегда, вслепую.');
    yield g.say('director', 'Шеф, что готовим?');
    yield g.talkTo('cook');
  }

  function* finish(g) {
    const sam = g.actors.sam;
    const c = g.f.cook;
    const d = DISHES[c.dish];
    g.sfx('oven');
    yield g.say('sam', 'В духовку!');
    yield g.anim('sam', 'reach', 0.5);
    yield 1.2;
    g.sfx('ding');
    sam.v = '';
    g.f.maskOn = false;
    yield g.say('sam', d.done);
    g.f.cook = null;
    if (c.dish === 'cake') {
      g.give('cake');
      g.f.cakeMade = true;
      yield g.say('director', 'Снято! Торт ваш, у нас его всё равно никто не ест. Даже спонсор.');
      yield g.say('max', 'Сэм, он на меня смотрит.');
      yield g.say('sam', 'Тортам не положено смотреть, Макс. Это просто пузырьки.');
      return;
    }
    if (c.dish === 'stew') {
      yield g.say('max', 'Можно я? Ням. Картон с приправой «Картон».');
    } else {
      yield g.say('max', 'Можно я? Буль-буль... Ик.');
      g.fx.shake = 0.3;
      yield g.say('max', 'Сэм, у меня из ушей идёт пар! Это лучший напиток в моей жизни!');
    }
    yield g.say('director', 'Зрители в восторге. Хотите ещё выпуск, берите повязку. Эфир у нас круглые сутки.');
  }

  TALK.cook = {
    options: (g, d) => {
      const c = g.f.cook;
      if (!c) return [{ id: 'bye', icon: 'bye', text: 'Всё.', end: true }];
      if (!c.dish) {
        return Object.entries(DISHES).map(([id, dsh]) => ({
          id, icon: dsh.icon, text: dsh.text, run: function* (gg) {
            gg.f.cook.dish = id;
            yield gg.say('director', id === 'cake' ? 'Торт! Смело. Берите первый ингредиент. На ощупь.' : 'Прекрасный выбор для одинокого вечера. Первый ингредиент, на ощупь.');
          }
        }));
      }
      if (c.picks.length < 3) {
        return feelOptions(g).map((fi, k) => ({
          id: 'f' + k, icon: 'feel', text: fi.text, run: function* (gg) {
            gg.f.cook.picks.push(fi.id);
            yield gg.anim('sam', 'reach', 0.4);
            gg.sfx('pop');
            yield gg.say('max', fi.max);
            if (gg.f.cook.picks.length < 3) yield gg.say('director', 'Ещё!');
            else yield gg.say('director', 'Три ингредиента! Теперь в духовку!');
          }
        }));
      }
      return [{ id: 'oven', icon: 'oven', text: 'В духовку!', end: true, say: false, run: function* (gg) { gg.endDialog(); yield* finish(gg); } }];
    }
  };

  TALK.dircook = {
    options: [
      { id: 'what', icon: 'q', text: 'Что это за передача?', run: function* (g) {
        yield g.say('director', 'Кулинарное шоу для холостяков. Ведущий готовит в повязке на глазах, из того, что не портится.');
        yield g.say('director', 'Натуральных продуктов на площадке нет. Натуральные продукты не прошли проверку спонсора.');
      } },
      { id: 'host', icon: 'f:director', text: 'А где ведущий?', once: true, run: function* (g) {
        yield g.say('director', 'Ушёл к Майре три дня назад. Вместе с половиной буфета. Вторую половину он приготовил.');
      } },
      { id: 'go', icon: 'chef', text: 'Можно я проведу выпуск?', end: true, when: g => !g.has('cake') && !g.has('kcake') && !g.f.whizzerGone, run: function* (g) {
        yield g.say('director', 'Можно. Эфир прямой, пять минут. Повязка на крючке, духовка горячая.');
        g.endDialog();
        yield* startShow(g);
      } },
      { id: 'enough', icon: 'pinkcake', text: 'Можно мне ещё торт?', when: g => g.has('cake') || g.has('kcake') || g.f.whizzerGone, run: function* (g) {
        yield g.say('director', 'Один торт на ведущего. Правило профсоюза кондитеров. Которого у нас нет.');
      } },
      { id: 'bye', icon: 'bye', text: 'Спасибо, мы посмотрим.', end: true, run: function* (g) { yield g.say('director', 'Смотрите. Только не нюхайте.'); } }
    ]
  };

  ROOMS.cooking = {
    id: 'cooking', name: 'Площадка «Готовим не глядя»', w: 320, music: 'cooking',
    noSave: g => !!g.f.cook,
    paint: b => S.BG.cooking(b),
    walk: [[4, 150, 316, 150, 316, 198, 4, 198]],
    layers: [
      { id: 'counter', x: 100, y: 96, base: 148 },
      { id: 'mask', x: 94, y: 56, when: g => !g.f.maskOn },
      { id: 'camera', x: 2, y: 124, base: 202 }
    ],
    hot: [
      { id: 'exit', name: 'Выход в коридор', rect: [0, 34, 22, 90], walk: [26, 168], face: 'w', look: 'Дверь за кулисы.',
        exit: function* (g) {
          if (g.f.cook) { yield g.say('director', 'Эфир! Ведущий не уходит посреди эфира!'); return; }
          g.sfx('door');
          yield* g.goRoom('warp', { x: 333, y: 150, dir: 's' });
        } },
      { id: 'sign', name: 'Вывеска', rect: [84, 16, 152, 26], look: '«Готовим не глядя. Для холостяков». Глаз на вывеске перечёркнут. Это не символ, это инструкция.' },
      { id: 'shelves', name: 'Полки с продуктами', rect: [24, 50, 64, 72], walk: [56, 156], face: 'n',
        look: ['Полки с продуктами. Ни одного натурального. Консервированный бекон, сыр в баллончике, сливки в гранулах.', '«Растворимые пельмени». «Соль без натрия». «Вода. Концентрат».'],
        use: 'Выбирать продукты глазами тут не принято. Это против концепции.' },
      { id: 'counter', name: 'Стол ведущего', rect: [100, 106, 150, 42], walk: [176, 152], face: 'n',
        look: 'Стол ведущего. Миска, венчик и ряд бутылочек без этикеток. Этикетки ведущему не положены.',
        use: function* (g) {
          if (g.has('cake') || g.has('kcake') || g.f.whizzerGone) { yield g.say('sam', 'Торт у нас уже был. Второй торт этой кухни город не переживёт.'); return; }
          yield g.say('sam', 'Начнём выпуск?');
          yield g.say('director', 'Начнём! Повязку на глаза, и в эфир.');
          yield* startShow(g);
        } },
      { id: 'oven', name: 'Духовка', rect: [250, 56, 56, 72], walk: [270, 156], face: 'n', look: 'Духовка. Внутри что-то светится. Надеюсь, лампочка.', use: 'Пустую духовку открывать незачем. Она и так всё видела.' },
      { id: 'mask', name: 'Повязка на глаза', rect: [92, 54, 20, 18], walk: [104, 154], face: 'n', when: g => !g.f.maskOn, look: 'Повязка ведущего. Чёрная, бархатная, пахнет луком. Лук, видимо, был последним натуральным продуктом здесь.', use: 'Надену, когда начнётся эфир.' },
      { id: 'camera', name: 'Камера', rect: [2, 124, 52, 76], look: 'Камера «Готовим не глядя». На объективе жирное пятно. Изображение от этого только аппетитнее.' }
    ],
    actors: {
      director: {
        name: 'Режиссёрша', walk: [268, 172], face: 'e', dist: 24, when: g => g.actors.director.room === 'cooking',
        look: 'Режиссёрша. Снова раньше нас. Теперь в поварском колпаке поверх гарнитуры.',
        talk: function* (g) { yield g.talkTo('dircook'); },
        items: { cake: function* (g) { yield g.say('director', 'Не мне. Я на диете. Тридцать лет на диете из кофе.'); } }
      }
    },
    setup(g) {
      g.place('director', 'cooking', 292, 172, 'w');
      if (g.f.cook) { g.f.cook = null; g.f.maskOn = false; g.actors.sam.v = ''; }
    },
    enter: function* (g) {
      if (!g.seen.cookFirst) {
        g.seen.cookFirst = 1;
        yield g.say('max', 'Сэм! Она опять тут! Режиссёрша, вы близнецы?');
        yield g.say('director', 'Нет. Я просто быстро хожу.');
      }
    },
    onLoad(g) { ROOMS.cooking.setup(g); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
