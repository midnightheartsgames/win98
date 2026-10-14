(function (S) {
  'use strict';
  const { C, COLORS } = S;
  const E = S.EP103;
  const { ROOMS, TALK, LAYERS } = E;
  const { sprite, textOn } = S.BG;
  const A = S.art103;
  const CAM = { x: 100, y: 12 };

  function camAim(g) {
    const sam = g && g.actors && g.actors.sam;
    if (!sam) return 0;
    return Math.max(-2, Math.min(2, Math.round((sam.x - CAM.x) / 40)));
  }

  LAYERS.bosco = {
    counter: () => S.LAYERS.bosco.counter(),
    glovearm: g => S.LAYERS.bosco.glovearm(g),
    condiments: () => sprite(36, 38, (P, b) => {
      P.part(P.rect(1, 12, 34, 18), C.grey, { b: 3 });
      P.part(P.ell(7, 34, 3.5, 3.5), C.grey, { b: 0 });
      P.part(P.ell(29, 34, 3.5, 3.5), C.grey, { b: 0 });
      for (const [x, r] of [[7, C.red], [14, C.yellow], [21, C.cream], [28, C.green]]) {
        P.part(P.poly([x - 2.5, 13, x - 2.5, 5, x - 1, 2, x + 1, 2, x + 2.5, 5, x + 2.5, 13]), r, { b: 3, sh: 1 });
        P.part(P.rect(x - 1, 0, 2, 2.5), r, { b: 1, sh: 0 });
      }
      textOn(b, 'СОУСЫ', 4, 18, C.grey[1], 0);
    }),
    cafe: g => sprite(50, 40, (P, b) => {
      P.part(P.rect(22, 16, 5, 20), C.grey, { b: 1, sh: 0 });
      P.part(P.ell(24.5, 37, 10, 2.6), C.grey, { b: 1, sh: 0 });
      if (g && g.vt.springT && g.time - g.vt.springT < 0.8) {
        for (let i = 0; i < 5; i++) P.line(16 + (i % 2) * 16, 16 - i * 3, 32 - (i % 2) * 16, 13 - i * 3, C.grey[4]);
        P.part(P.ell(24.5, 0, 22, 3), C.red, { b: 3 });
        return;
      }
      const top = P.ell(24.5, 12, 23, 6);
      P.part(top, C.red, { b: 3 });
      top.each((x, y) => { if ((Math.floor(x / 4) + Math.floor(y / 3)) % 2 === 0 && b.px[y * b.w + x] !== C.black) b.set(x, y, C.grey[5]); });
      P.part(P.path('M 2 12 Q 3 22 6 24 L 43 24 Q 46 22 47 12 Q 24.5 20 2 12 Z'), C.red, { b: 2 });
      for (let x = 4; x < 46; x += 4) P.line(x, 14 + Math.abs(x - 24.5) * 0.05, x, 23, (x / 4) % 2 ? C.grey[5] : C.red[2]);
      if (g && g.f.boscoDone) {
        P.part(P.rect(15, 0, 18, 10), C.pink, { b: 3 });
        P.part(P.rect(22.5, 0, 3, 10), C.gold, { b: 3, sh: 0, hi: 0 });
      }
    }),
    camera: g => sprite(26, 18, P => {
      const a = camAim(g);
      P.part(P.rect(11, 0, 4, 6), C.grey, { b: 1, sh: 0 });
      P.part(P.rect(5 + a, 5, 16, 9), C.blue, { b: 3 });
      P.part(P.ell(13 + a * 3, 11, 3.2, 3), C.grey, { b: 0, sh: 0 });
      P.part(P.ell(13 + a * 3, 11, 1.4, 1.4), C.sky, { b: 4, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(18 + a, 6, 2, 2), C.red, { b: 4, sh: 0, hi: 0, ol: 0 });
    }),
    flag: () => sprite(22, 16, P => {
      P.part(P.rect(1, 1, 7, 14), C.blue, { b: 3, sh: 0 });
      P.part(P.rect(8, 1, 7, 14), C.grey, { b: 5, sh: 0 });
      P.part(P.rect(15, 1, 7, 14), C.red, { b: 3, sh: 0 });
    })
  };

  function* eject(g, what) {
    g.sfx('alarm');
    yield g.say(null, 'ДОСТАВКА ОБНАРУЖЕНА! ВОЗВРАТ ОТПРАВИТЕЛЮ!', { key: 'ads', color: C.red[4], x: 110, y: 40 });
    g.vt.springT = g.time;
    g.vt.flyT = g.time;
    g.vt.flyWhat = what;
    g.sfx('spring');
    g.fx.shake = 0.4;
    yield 1.1;
    g.vt.flyT = 0;
    g.sfx('crash');
  }

  function* deliver(g) {
    const bo = g.actors.bosco, max = g.actors.max;
    if (g.f.boscoDone) { yield g.say('sam', 'Мишка уже на месте. Второй был бы перебором даже для мафии.'); return; }
    if (!g.vt.boscoWatching) {
      yield g.say('bosco', 'Нон! Что это у вас, мсье? Коробка? С бантом? Анархисты подарков не принимают!');
      yield g.say('bosco', 'Уберите. И не пытайтесь поставить её на столик. АДС-2 всё равно выбросит её на улицу.');
      g.f.knowADS = true;
      return;
    }
    yield g.anim('sam', 'reach', 0.5);
    g.drop('bearbox');
    if (!g.f.cameraOut) {
      yield* eject(g, 'bearbox');
      g.f.knowADS = true;
      yield g.say('max', 'Коробка улетела на улицу! Я принесу!');
      max.scripted = true;
      yield g.walkTo('max', 10, 172, { speed: 2 });
      max.visible = false;
      g.sfx('door');
      yield 1.2;
      g.sfx('door');
      max.visible = true;
      yield g.walkTo('max', 60, 172, { speed: 2 });
      max.scripted = false;
      g.give('bearbox');
      yield g.say('max', 'Вот! Мишка цел! Он даже не моргнул! Он мне нравится!');
      yield g.say('sam', 'Возврат отправителю. Почта в этом городе работает хуже, чем эта пружина.');
      if (bo.act === 'watch') yield g.say('bosco', 'Что там хлопнуло? Неважно! Мишка на улице почесал ухо! Это знак!');
      return;
    }
    g.f.boscoDone = true;
    g.sfx('thump');
    yield g.say('sam', 'Пружина молчит. Вручено лично, без уведомления.');
    const cu = g.actors.cuddly;
    g.place('cuddly', 'bosco', 10, 172, 'e');
    cu.visible = true; cu.act = ''; cu.keepAct = false; cu.scripted = true;
    g.sfx('door');
    yield g.walkTo('cuddly', 32, 170);
    yield g.say('cuddly', 'Сдаю.');
    bo.act = 'up'; bo.keepAct = true;
    yield g.say('bosco', 'Мафия! Я сдаюсь! Анархист всегда сдаётся первым. Потом уходит в подполье!');
    yield g.walkTo('cuddly', 10, 172);
    g.place('cuddly', 'casino', 246, 146, 's');
    cu.act = 'deal'; cu.keepAct = true; cu.scripted = false;
    g.sfx('door');
    bo.act = ''; bo.keepAct = false;
    g.vt.boscoWatching = false;
    yield g.say('max', 'Он сказал «сдаю» без вопроса! Сэм, это значит «принято»!');
    yield g.say('sam', 'Или «я ухожу». С Обнимашкой трудно понять, где кончается словарь.');
    yield g.say('bosco', 'Мсье, на моём столике мишка. Он на меня смотрит. Я буду смотреть на него в ответ. Весь день.');
    yield* E.trialDone(g);
  }

  function* magnetCam(g) {
    if (g.f.cameraOut) return;
    yield g.anim('sam', 'reach', 0.6);
    g.drop('magnet');
    yield g.say('sam', 'Улыбнись, АДС-2. Тебе посылка от Теда И. Бэра.');
    g.sfx('alarm');
    yield g.say(null, 'ОБНАРУЖЕН ТОВАР ТЕДА И. БЭРА! ВОЗВРАТ ОТПРАВИТЕЛЮ!', { key: 'ads', color: C.red[4], x: 110, y: 40 });
    g.vt.camFlyT = g.time;
    g.sfx('spring');
    g.fx.shake = 0.3;
    yield 1.1;
    g.vt.camFlyT = 0;
    g.f.cameraOut = true;
    g.sfx('crash');
    if (g.actors.bosco.act === 'watch') yield g.say('bosco', 'Что-то улетело? Пустяки! Мишка на улице перевернул газету! Наконец-то!');
    else {
      yield g.say('bosco', 'Мон дьё! Система выстрелила сама в себя! Анархия пожирает своих детей!');
      yield g.say('bosco', 'Ничего. Я куплю новую камеру. Во вторник. Если доживу до вторника.');
    }
    yield g.say('max', 'Камера улетела вместе с магнитом! Сэм, мы сломали анархию!');
  }

  function* buyBug(g) {
    if (g.f.bugBought) { yield g.say('bosco', 'Второго нет, мон ами. Этот был последний ветеран в своём роду.'); return; }
    if (!g.f.knowBug) { yield g.say('bosco', 'Жетоны? Мне? За что? Спросите сначала, что у меня есть. Анархия любит порядок в покупках.'); return; }
    yield g.say('sam', 'Берём подслушивающее устройство. Десять миллионов жетонов.');
    yield g.say('bosco', 'Жетоны мафии? Какая ирония. Анархист берёт. Из протеста.');
    const bo = g.actors.bosco;
    bo.act = 'give'; bo.actT = 1;
    g.sfx('chips');
    g.drop('tokens');
    g.give('roach');
    g.f.bugBought = true;
    yield g.say('bosco', 'Держите крепче, оно кусается. Инструкция не нужна, оно всё расскажет само.');
    yield g.say(null, 'Сержант Жучок прибыл в ваше распоряжение, сэр!', { key: 'roachvoice', color: COLORS.roach });
    yield g.say('sam', 'Это таракан.');
    yield g.say('bosco', 'Это ветеран! Три командировки. Не спрашивайте куда. Он сам расскажет. Он всегда рассказывает.');
  }

  TALK.banda = {
    start: function* (g) {
      if (!g.seen.banda) {
        g.seen.banda = 1;
        yield g.say('bosco', 'Бонжур, мсье! Жан-Франсуа Банд-а-Пар, анархист новой волны. Будете покупать или просто ненавидеть систему?');
        yield g.say('max', 'Сэм, это Боско в берете!');
        yield g.say('bosco', 'Тише! Они не знают!');
      } else yield g.say('bosco', 'Снова вы, мон ами. Анархия слушает.');
    },
    options: [
      { id: 'who', icon: 'q', text: 'Боско, это ты?', run: function* (g) {
        yield g.say('bosco', 'Боско? Мсье ошибается. Боско был торговцем. Я анархист. Я против торговли. Я торгую только из протеста.');
      } },
      { id: 'why', icon: 'flag', text: 'Зачем вам берет и усы?', run: function* (g) {
        yield g.say('bosco', 'Игрушечная мафия, мон ами! Они хотят, чтобы я продавал их мишек. Мишки смотрят на покупателей, и покупатели делают что им скажут.');
        yield g.say('bosco', 'Боско они знают в лицо. Жан-Франсуа видят впервые. У анархиста нечего отнять, кроме убеждений. Убеждения я держу в сейфе.');
      } },
      { id: 'ads', icon: 'eye', text: 'Что это за камера?', run: function* (g) {
        yield g.say('bosco', 'АДС-2! Антидоставочная система Банд-а-Пара, модель два! Камера смотрит на всё, что здесь оставляют.');
        yield g.say('bosco', 'Увидит доставку, и пружина под столиком отправит её обратно на улицу. С уведомлением о вручении.');
        yield g.say('sam', 'А если вам принесут что-нибудь лично?');
        yield g.say('bosco', 'Лично мне ничего не приносят. Я анархист, у меня нет друзей.');
        g.f.knowADS = true;
      } },
      { id: 'sell', icon: 'money', text: 'Что у вас продаётся?', run: function* (g) {
        yield g.say('bosco', 'Всё, что мешает государству. Гвоздь сезона лежит под прилавком: миниатюрное органическое подслушивающее устройство.');
        yield g.say('bosco', 'Слышит всё, что говорят, и повторяет слово в слово. Чужим голосом. Как политик.');
        if (!g.f.bugBought) {
          yield g.say('sam', 'Почём?');
          yield g.say('bosco', 'Десять миллионов.');
          yield g.say('sam', 'Долларов?');
          yield g.say('bosco', 'Чего угодно. Мне противны все валюты одинаково. Даже жетоны.');
        }
        g.f.knowBug = true;
      } },
      { id: 'buy', icon: 'tokens', text: 'Мы берём ваше устройство.', when: g => g.has('tokens') && g.f.knowBug && !g.f.bugBought, run: function* (g) { yield* buyBug(g); } },
      { id: 'mafia', icon: 'f:cuddly', text: 'Смотрите, на улице мафия!', when: g => g.actors.cuddly.room === 'street' && !g.vt.boscoWatching && !g.f.boscoDone, run: function* (g) {
        const bo = g.actors.bosco;
        yield g.say('bosco', 'Где?! Мон дьё! Мишка с газетой! Я знал! Я знал, что они придут!');
        bo.act = 'watch'; bo.keepAct = true;
        g.face('bosco', 'w');
        g.vt.boscoWatching = true;
        yield g.say('bosco', 'Не отвлекайте меня, мсье. Я слежу за ним в бинокль. Он следит за мной в газету. Кто кого.');
      } },
      { id: 'code', icon: 'rug', text: E.CODE, run: function* (g) {
        yield g.say('bosco', 'Ковёр я продал. Шторы пошли на флаг. Ещё вопросы, мсье?');
      } },
      { id: 'french', icon: 'flag', text: 'Скажите что-нибудь по-французски.', once: true, run: function* (g) {
        yield g.say('bosco', 'Бонжур. Мерси. Круассан. Жё нё сэ па.');
        yield g.say('sam', 'Последнее что значит?');
        yield g.say('bosco', '«Я не знаю». Самое полезное выражение для анархиста. И для свидетеля.');
      } },
      { id: 'meat', icon: 'sandwich', text: 'Вы не видели сэндвич с фрикадельками?', when: g => g.f.meatStolen && !g.f.meatDone, run: function* (g) {
        yield g.say('bosco', 'Сэндвич? Мафиозная еда. Я ем только багеты. Чёрствые. Из принципа.');
      } },
      { id: 'bye', icon: 'bye', text: 'О ревуар, Жан-Франсуа.', end: true, run: function* (g) {
        yield g.say('bosco', 'О ревуар! И не приносите сюда мишек!');
      } }
    ]
  };

  ROOMS.bosco = {
    id: 'bosco', name: 'Лавка Жан-Франсуа', w: 320, music: 'bosco3',
    paint: b => S.BG.bosco(b),
    walk: [[8, 136, 212, 136, 232, 176, 312, 176, 312, 198, 8, 198]],
    block: [[44, 138, 94, 138, 94, 150, 44, 150]],
    layers: [
      { id: 'condiments', x: 194, y: 96, base: 131 },
      { id: 'glovearm', x: 46, y: 18 },
      { id: 'flag', x: 250, y: 30 },
      { id: 'camera', x: CAM.x - 13, y: CAM.y, when: g => !g.f.cameraOut, key: g => camAim(g) },
      { id: 'cafe', x: 44, y: 112, base: 150, key: g => (g.vt.springT && g.time - g.vt.springT < 0.8 ? 's' : '') + (g.f.boscoDone ? 'd' : '') },
      { id: 'counter', x: 216, y: 110, base: 172 }
    ],
    sprites(g) {
      const out = [];
      const fly = (t0, draw) => {
        const k = Math.min(1, (g.time - t0) / 1.0);
        const x = 66 + (6 - 66) * k, y = 112 - Math.sin(k * Math.PI) * 60 + k * 40;
        out.push({ y: 400, draw: (f, cx) => draw(f, x - cx, y) });
      };
      if (g.vt.flyT) fly(g.vt.flyT, (f, x, y) => S.blit(f, S.icon('bearbox'), Math.round(x - 12), Math.round(y - 10)));
      if (g.vt.camFlyT) {
        const k = Math.min(1, (g.time - g.vt.camFlyT) / 1.0);
        const x = CAM.x + (6 - CAM.x) * k, y = 20 - Math.sin(k * Math.PI) * 20 + k * 110;
        out.push({ y: 400, draw: f => { const P = new S.Pen(f); P.part(P.rect(x - g.camX - 8, y, 16, 9), C.blue, { b: 3 }); P.part(P.ell(x - g.camX, y + 4, 4, 4), C.oak, { b: 3, sh: 0 }); } });
      }
      return out;
    },
    hot: [
      { id: 'exit', name: 'Выход на улицу', rect: [4, 30, 40, 110], walk: [30, 170], face: 'w',
        look: 'Дверь на улицу. Над ней по-прежнему висит Антивор-О-Мат. К перчатке теперь пришит французский флажок.',
        exit: function* (g) { g.sfx('door'); yield* g.goRoom('street', { x: 484, y: 146, dir: 's' }); } },
      { id: 'antivor', name: 'Антивор-О-Мат', rect: [40, 4, 56, 14],
        look: 'Антивор-О-Мат. Стоит на страже частной собственности, хотя хозяин теперь против неё.',
        use: function* (g) { yield g.say('bosco', 'Не трогайте! Он теперь бьёт только буржуев. Проверять на себе не советую.'); } },
      { id: 'camera', name: 'Камера АДС-2', rect: [CAM.x - 12, CAM.y, 24, 16], walk: [96, 152], face: 'n', when: g => !g.f.cameraOut,
        look: 'Синяя камера антидоставочной системы. Поворачивается за мной, куда бы я ни пошёл. Как Боско, только без усов.',
        use: 'Не дотянусь, чтобы отвернуть. К тому же она заметит, что я тянусь.',
        items: {
          magnet: function* (g) { yield* magnetCam(g); },
          gun: 'Стрелять в камеру при хозяине? Анархист вызовет полицию. То есть нас.',
          bearbox: 'Показать камере мишку? Она только этого и ждёт.',
          roach: 'Жучок в камере? Там слушать нечего. Камера молчит и смотрит.',
          capgun: 'Камеру пистонами не испугать. Её вообще ничем не испугать, кроме конкурентов.'
        } },
      { id: 'cafe', name: g => g.f.boscoDone ? 'Столик с мишкой' : 'Столик', rect: [44, 112, 50, 28], walk: [70, 162], face: 'n',
        look: g => g.f.boscoDone ? 'На столике коробка с мишкой. Жан-Франсуа смотрит на неё из-за прилавка и не моргает.' : 'Круглый столик в красно-белую клетку. Французское кафе на одну персону. Под скатертью что-то пружинит.',
        use: 'Садиться не буду. Столик выглядит так, будто подбросит меня до потолка.',
        items: {
          bearbox: function* (g) { yield* deliver(g); },
          magnet: 'Магнит на столик? Камера увидит его и отправит на улицу. Магнит, а заодно и меня.',
          roach: 'Сажать жучка на столик? Тут подслушивать некого, кроме анархии.'
        } },
      { id: 'condiments', name: 'Тележка с соусами', rect: [194, 96, 36, 36], walk: [212, 140], face: 'n',
        look: 'Тележка с соусами. Кетчуп, горчица, майонез и что-то зелёное с табличкой «Анархия».',
        use: 'Пить кетчуп из горлышка при анархисте? Он решит, что я тоже за свободу.',
        items: {
          mug: function* (g) {
            yield g.anim('sam', 'reach', 0.6);
            g.sfx('splat');
            g.swap('mug', 'kmug');
            g.f.mugFilled = true;
            yield g.say('sam', 'Кружка Сибил, доверху кетчупа. Издали похоже на кофе. Если издали не пить.');
            yield g.say('bosco', 'Кетчуп для покупателей! ...Ладно. Анархия делится.');
          },
          kmug: 'Кетчупа в ней и так больше, чем во мне терпения.',
          sandwich: 'Сэндвичу нужен соус, но этот сэндвич принадлежит мафии. У мафии свои соусы.'
        } },
      { id: 'wc', name: 'Туалет', rect: [136, 30, 36, 82], walk: [154, 136], face: 'n',
        look: 'Туалет. Табличка: «Только для революционеров». Ниже мелко: «Уиззер, это и тебя касается».',
        use: 'Не сейчас. Революционеры терпят.' },
      { id: 'barrel', name: 'Бочка', rect: [172, 92, 22, 32], walk: [182, 140], face: 'n',
        look: 'Та самая бочка. Теперь на ней нарисован берет. Что бы там ни лежало, оно теперь француз.',
        use: function* (g) { yield g.say('bosco', 'Не открывать! Там багеты. Они выдерживаются. Как сыр.'); } },
      { id: 'shelves', name: 'Полки', rect: [56, 28, 78, 76], walk: [96, 140], face: 'n',
        look: ['«Багет чёрствый. Для баррикад».', '«Берет запасной. Для второго лица».', '«Словарь французского. Три слова».', '«Плакат "Долой всё". Без уточнений».', '«Фальшивые усы. Для товарищей по борьбе».'],
        use: 'Жан-Франсуа просил ничего не трогать. Анархисты тоже любят, когда их слушаются.' },
      { id: 'register', name: 'Касса', rect: [272, 110, 34, 16], walk: [250, 182], face: 'e', look: 'Касса. На ней наклейка: «Собственность есть кража». Касса, видимо, исключение.', use: function* (g) { yield g.say('bosco', 'Касса неприкосновенна! Даже анархии нужна сдача.'); } },
      { id: 'safe', name: 'Сейф', rect: [286, 36, 26, 24], look: 'Сейф «SAFE». Сверху мелом: «Не для государства».' },
      { id: 'signs', name: 'Табличка', rect: [96, 1, 92, 11], look: '«Торг неуместен». Кто-то приписал снизу: «Как и всё остальное».' }
    ],
    actors: {
      bosco: {
        name: 'Жан-Франсуа', walk: [238, 182], face: 'e', pad: 10,
        look: g => g.actors.bosco.act === 'watch' ? 'Жан-Франсуа смотрит в бинокль на улицу. На меня он сейчас не смотрит. Это ценно.' : 'Боско в чёрном берете и с тонкими усиками. Называет себя Жан-Франсуа. Бейджик «Боско» с рубашки снять забыл.',
        talk: function* (g) { yield g.talkTo('banda'); },
        items: {
          tokens: function* (g) { yield* buyBug(g); },
          token: function* (g) { yield g.say('bosco', 'Один жетон? Его не хватит даже на протест.'); },
          bearbox: function* (g) { yield g.say('bosco', 'Нон! Никаких мишек в моих руках! Уносите, пока он на меня не посмотрел!'); },
          magnet: function* (g) { yield g.say('bosco', 'Мишка на магните?! Уберите! Они и на холодильнике следят!'); },
          roach: function* (g) { yield* E.bugPlant(g, 'bosco'); },
          gun: function* (g) { yield g.say('bosco', 'Опустите оружие, мсье. Под прилавком у меня багет. Очень чёрствый.'); },
          ace: function* (g) { yield g.say('bosco', 'Туз пик? Карты для буржуев. Настоящий анархист играет в домино.'); },
          kmug: function* (g) { yield g.say('bosco', 'Кетчуп в кружке? Смелое заявление, мсье.'); },
          capgun: function* (g) { yield g.say('bosco', 'Пистоны! Так начинались все революции. Потом их, правда, заменяли настоящими.'); },
          max: function* (g) { yield g.say('max', 'Жан-Франсуа, продай мне что-нибудь взрывное!'); yield g.say('bosco', 'Анархия не продаёт взрывное детям.'); yield g.say('max', 'Я кролик!'); yield g.say('bosco', 'Тем более.'); }
        }
      }
    },
    setup(g) {
      const b = g.actors.bosco;
      b.act = ''; b.keepAct = false;
      g.place('bosco', 'bosco', 250, 150, 's');
      g.vt.boscoWatching = false;
      g.vt.springT = 0; g.vt.flyT = 0; g.vt.camFlyT = 0;
    },
    onLoad(g) { ROOMS.bosco.setup(g); }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
