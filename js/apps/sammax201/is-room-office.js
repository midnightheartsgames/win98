(function (S) {
  'use strict';
  const { C, COLORS } = S;
  const E = S.EP201;
  const { ROOMS, TALK } = E;
  const A = S.art201;

  E.leo = (g, t) => g.say(null, t, { key: 'leo', color: COLORS.leonard, x: 240, y: 66 });
  E.robotSay = (g, t) => g.say(null, t, { key: 'robot', color: COLORS.robot21, x: g.roomId === 'street' ? Math.round(214 - g.camX) : 132, y: g.roomId === 'street' ? 24 : 34 });
  const flint = (g, t) => g.say(null, t, { key: 'flint', color: COLORS.flint21, x: 60, y: 30 });
  const ledge = (g, t, who) => g.say(null, t, { key: who || 'jimmy', color: who === 'mary' ? COLORS.mary21 : COLORS.jimmy, x: 140, y: 86 });

  E.robotHere = g => !g.f.robotDown;
  E.ledgeHere = g => !!g.f.warGot && !g.f.jimmyHappy;

  function* intro(g) {
    g.hideUI = true;
    const max = g.actors.max;
    max.scripted = true;
    g.closeup = { kind: 'titlecard21', t0: g.time, lines: ['SAM & MAX', 'ЭПИЗОД 201', 'ПОЛЯРНАЯ СТАНЦИЯ САНТА'] };
    g.music('title21');
    yield g.fadeIn(1.2);
    yield 4.8;
    yield g.fadeOut(2);
    g.closeup = null;
    g.music('robot21');
    g.place('max', 'office', 118, 156, 'w');
    g.place('sam', 'office', 150, 164, 'w');
    yield g.fadeIn(1.5);
    yield g.say('max', 'Сэм, рыба на меня смотрит!');
    yield g.say('sam', 'Мистер Лопатка смотрит на всех. У него нет век.');
    yield g.say('max', 'Он смотрит со злобой! Я видел, как он пускал пузыри в форме черепа!');
    yield g.say('sam', 'Пузыри у него круглые. Как у любой рыбы, которой нечего скрывать.');
    yield g.say('max', 'Он перешёл на тёмную сторону кулера! Его надо судить! Я его помилую, а потом всё равно!');
    yield g.say('sam', 'Мистер Лопатка, у вас есть последнее слово?');
    g.sfx('pop');
    yield 1;
    g.sfx('laser');
    g.fx.flash = 1;
    g.fx.shake = 0.8;
    g.f.introDone = true;
    yield 0.6;
    g.sfx('sizzle');
    yield g.say('sam', 'Кулера нет. Воды нет. Мистера Лопатки тоже нет. Есть дырка в окне и запах жареной рыбы.');
    yield E.robotSay(g, 'Я МАЙМТРОН 9000. Я ВАШ ПОДАРОК. СЧАСТЛИВОГО РОЖДЕСТВА.');
    yield E.robotSay(g, 'ЛЮБОВЬ МОЯ, НЕ УХОДИ. СТОЙ СПОКОЙНО, Я ЦЕЛЮСЬ.');
    yield g.say('max', 'Сэм! Нам подарили робота-убийцу! Нас наконец-то кто-то ценит!');
    yield g.say('sam', 'До Рождества неделя. Подарок пришёл рано и хочет снести нам офис.');
    g.sfx('gun');
    yield 0.25;
    g.sfx('gun');
    g.f.flintHole = true;
    g.fx.shake = 0.3;
    yield 0.5;
    yield flint(g, 'Эй, соседи! Это я не вам. Это я громилам. Продолжайте.');
    yield g.say('sam', 'Флинт Пейпер, сосед. У него в офисе громилы, у нас за окном робот. Нормальная предпраздничная неделя.');
    max.scripted = false;
    g.hideUI = false;
  }

  function* takeKey(g) {
    if (!g.vt.robotThinks) {
      g.sfx('servo');
      yield g.say('sam', 'Красный глаз робота смотрит прямо в окно. Лапу высунешь, и её отрежут лазером вместе с рукавом.');
      return;
    }
    yield g.anim('sam', 'reach', 0.7);
    g.sfx('wind');
    g.f.keyGot = true;
    g.give('key');
    yield 0.6;
    g.sfx('servo');
    yield 0.8;
    g.sfx('crash');
    g.fx.shake = 1.2;
    g.f.robotDown = true;
    g.vt.robotThinks = false;
    g.music('office');
    yield 0.8;
    yield g.say('sam', 'Ключ вышел легко. Маймтрон 9000 перестал тикать и лёг поперёк улицы. Почти без звука. Если не считать звука.');
    yield g.say('max', 'Мы победили подарок! Сэм, пошли его распакуем!');
  }

  function* reunion(g) {
    const max = g.actors.max;
    max.scripted = true;
    g.drop('mary');
    yield g.anim('sam', 'reach', 0.6);
    g.vt.maryLedge = true;
    yield [g.walkTo('sam', 196, 148), g.walkTo('max', 220, 154)];
    g.face('sam', 'w');
    g.face('max', 'w');
    yield ledge(g, 'Джеймс?!', 'mary');
    yield ledge(g, 'Мэри?! Мэри! Ты совсем не изменилась!');
    yield ledge(g, 'Я просидела в коробке минуту. А ты почему такой старый?', 'mary');
    yield ledge(g, 'Двадцать лет прошло, Мэри.');
    yield ledge(g, 'Двадцать лет?! И ты всё это время не мыл уши?!', 'mary');
    yield ledge(g, 'Начальник. Держи. Это та самая перчатка. Мне она больше не нужна, у меня есть Мэри. А пояс я и так помню.');
    g.f.jimmyHappy = true;
    g.vt.maryLedge = false;
    g.give('glove');
    g.sfx('pickup');
    yield g.say('sam', 'Они спустились по водосточной трубе. Джимми ни разу не посмотрел вниз. Он смотрел на жену.');
    yield g.say('max', 'Сэм, а откуда у него перчатка? Её же подарил пёс в шляпе. А мы её сейчас понесём... Ой.');
    yield g.say('sam', 'Не думай об этом, Макс. Перчатка ходит по кругу. Как наши дела.');
    max.scripted = false;
  }

  TALK.ledge = {
    start: function* (g) {
      if (g.seen.ledgeHello) return;
      g.seen.ledgeHello = 1;
      yield ledge(g, 'Не подходи, начальник! Я на карнизе!');
    },
    options: [
      { id: 'why', icon: 'f:jimmy', text: 'Что ты там делаешь, Джимми?', run: function* (g) {
        yield ledge(g, 'Стою. Прыгать страшно, слезать стыдно. Высоты я боюсь с детства, начальник. Потому и выбрал.');
      } },
      { id: 'ring', icon: 'war21', text: 'Это из-за ринга?', run: function* (g) {
        yield ledge(g, 'Ринг был последний. Двадцать лет назад, в сочельник, ушла Мэри. Ни записки, ни следа. В ту ночь я выиграл пояс и больше ни одного боя.');
        yield ledge(g, 'Сегодня меня побила кукла. Кукла, начальник.');
        g.f.knowMary = true;
      } },
      { id: 'glove', icon: 'jglove21', text: 'Как ты выиграл тот пояс?', when: g => g.f.knowMary, run: function* (g) {
        yield ledge(g, 'Перчатку мне подарил какой-то пёс в шляпе. Прямо перед боем. Дрался я до того в напёрстке.');
        yield ledge(g, 'Не ты, начальник. Тот был вежливый.');
      } },
      { id: 'down', icon: 'up21', text: 'Слезай, Джимми.', run: function* (g) {
        yield ledge(g, 'Слезу, когда Мэри вернётся. То есть никогда. Иди, начальник, не загораживай мне вид.');
      } },
      { id: 'bye', icon: 'bye', text: 'Держись там крепче.', end: true }
    ]
  };

  TALK.flint = {
    options: [
      { id: 'how', icon: 'f:flint21', text: 'Флинт, как ты там?', run: function* (g) {
        g.sfx('punch');
        yield flint(g, 'Работаю, приятель. Двое громил объясняют мне, почему не будут платить. Объясняют медленно, я жду.');
      } },
      { id: 'robot', icon: 'robot21', text: 'Ты видел, кто привёз робота?', run: function* (g) {
        yield flint(g, 'Видел почтальона. Борода до пояса, красная куртка, мешок через плечо. Расписаться не дал, уехал на санях.');
        yield flint(g, 'Почтальоны теперь не те, пушистики.');
      } },
      { id: 'case', icon: 'badge', text: 'Над чем работаешь?', run: function* (g) {
        yield flint(g, 'Ищу одного лавочника. Наняла его мать. Седая, в очках, голос как у шкафа. Больше ни слова. Тайна клиента.');
        yield g.say('sam', 'Седая мать в очках. Где-то я её видел. Или его.');
      } },
      { id: 'hole', icon: 'gun', text: 'Ты прострелил нам стену.', run: function* (g) {
        yield flint(g, 'Стена была тонкая. Скажи спасибо, что сквозь неё прилетела только пуля. Громила бы застрял.');
      } },
      { id: 'bye', icon: 'bye', text: 'Не убей там никого, Флинт.', end: true, run: function* (g) { g.f.flintMet = true; yield flint(g, 'Не обещаю, приятель.'); } }
    ]
  };

  const TV_PROGS = ['news', 'poppers', 'stinky'];

  function* watchTv(g) {
    const i = g.f.tvSeg || 0;
    const prog = i < TV_PROGS.length ? TV_PROGS[i] : g.f.robotDown ? 'news2' : 'rerun';
    yield g.anim('sam', 'reach', 0.4);
    g.sfx('click');
    g.closeup = { kind: 'tv21', prog, t0: g.time };
    const tv = (t, c) => g.say(null, t, { key: 'tv', color: c || COLORS.tv, x: 160, y: 199 });
    if (prog === 'news') {
      yield tv(g.f.robotDown ? 'Новости. Гигантский робот, напавший утром на тихий квартал, лежит на тротуаре. Владелец не найден.' : 'Новости. На тихий квартал напал гигантский робот. Он поёт и стреляет. Полиция советует не подпевать.');
      yield tv('Других происшествий нет. За неделю до Рождества это само по себе происшествие.');
    } else if (prog === 'poppers') {
      g.music('sitcom');
      yield tv('Повтор! «Сода-Попперы», рождественский выпуск: «Кто украл подарки?» Подсказка: это были Попперы.', COLORS.specs);
    } else if (prog === 'stinky') {
      g.music('diner21');
      yield tv('Закусочная «У Стинки» снова открыта! Хозяйка лично знакома с тремя президентами, одним королём и почти с Элвисом!', COLORS.stinky21);
      yield tv('Каждый вечер викторина! Приз: коллекционный всадник!', COLORS.stinky21);
    } else if (prog === 'news2') {
      yield tv('Новости. Поверженный робот превращён в боксёрский ринг. Организатор, крыса, назвал это «вторым рождением техники».');
    } else {
      yield tv('Реклама. «Боско-Тех»: рентген для посылок. Узнайте, что внутри, пока не стало поздно.', COLORS.bosco);
    }
    g.closeup = null;
    g.music('office');
    g.f.tvSeg = i + 1;
    if (prog === 'poppers') yield g.say('sam', 'Сода-Попперы в рождественском выпуске. Тридцать лет прошло, а подарки они так и не вернули.');
    if (prog === 'stinky') { g.f.tvDone = true; yield g.say('sam', 'Закусочная «У Стинки». Старик Стинки кормил нас ещё в те годы, когда мы платили. Хозяйка, судя по рекламе, другая.'); }
    if (prog === 'rerun') yield g.say('sam', 'Боско даёт рекламу. Значит, ему опять что-то прислали.');
  }

  const MACHINE = [
    function* (g) {
      yield g.say(null, 'Сэм, это Боско. Мне пришла посылка. Она тикает. Если я не перезвоню, значит, тикала не зря.', { key: 'machine', color: COLORS.bosco, x: 70, y: 110 });
      yield g.say('sam', 'Боско не перезвонил. С Боско это может значить что угодно.');
    },
    function* (g) {
      yield g.say(null, 'Сэм, это Сибил. У меня свидание. Если Эйб позвонит за советом, скажите ему что-нибудь не из учебника истории.', { key: 'machine', color: COLORS.sybil, x: 70, y: 110 });
      yield g.say('max', 'Свидание с головой! Сэм, у неё всё серьёзно! Голова без тела не сбежит!');
    },
    function* (g) {
      yield g.say(null, 'Сэм, это Комиссар. Мне доложили о гигантском роботе. Если он ваш, уберите его до Рождества. Если не ваш, тем более.', { key: 'machine', color: COLORS.phone, x: 70, y: 110 });
      yield g.say('sam', 'Комиссар прав. Робот не наш, и это наша проблема.');
    }
  ];

  function* playMachine(g) {
    const n = g.count('machine') - 1;
    yield g.anim('sam', 'reach', 0.3);
    g.sfx('beep');
    yield 0.4;
    if (n >= MACHINE.length) { g.f.machineDone = true; yield g.say('sam', 'Новых сообщений нет. Перед Рождеством всем некогда, кроме роботов.'); return; }
    yield* MACHINE[n](g);
    if (n === MACHINE.length - 1) g.f.machineDone = true;
  }

  const CLOSET = {
    name: 'Шкаф', walk: [240, 136], face: 'n',
    look: g => g.f.closetOpen ? (g.f.exhibit ? 'Шкаф с уликами. Шесть дел прошлого сезона и ключ от великана. Музей пополнился.' : 'Шкаф с уликами. Леонард в парике Брэди, Мистер Мишка в очках, голова президента, пистонный пистолет, перчатка Макса и банка с Хью Блиссом.') : 'Шкаф. Шесть дел, шесть улик. Одна мычит, другая крутит глазами, третья пускает пузыри.',
    use: function* (g) {
      yield g.anim('sam', 'reach', 0.4);
      g.sfx('door');
      g.f.closetOpen = !g.f.closetOpen;
      if (g.f.closetOpen && !g.seen.closet201) {
        g.seen.closet201 = 1;
        yield g.say('max', 'Привет, музей! Леонард, с наступающим! Хью, не скучай!');
        g.sfx('mumble');
        yield E.leo(g, 'Мм!');
        yield g.say('sam', 'Новый сезон, старый шкаф. Место для седьмой улики на полке ещё есть.');
      }
    },
    items: {
      key: function* (g) { yield g.say('sam', g.f.exhibit ? 'Ключ уже висит в шкафу.' : 'Сдавать ключ в музей рано. Дело только началось.'); }
    }
  };

  function windowLook(g) {
    if (E.robotHere(g)) return g.vt.robotThinks ? 'За окном спина Маймтрона 9000. Голова робота задрана к небу, глаз погас. Из спины прямо напротив нашего окна торчит ключ завода.' : 'За окном спина Маймтрона 9000. Голова повёрнута задом наперёд, и красный глаз смотрит прямо на нас. Из спины торчит ключ завода.';
    if (E.ledgeHere(g)) return 'На карнизе за окном стоит Джимми Два Зуба. Смотрит вниз и дрожит.';
    return 'Город за окном. Без робота вид получше. Снег идёт на всех одинаково.';
  }

  ROOMS.office = {
    id: 'office', name: 'Офис Сэма и Макса', w: 320, music: g => (E.robotHere(g) ? 'robot21' : 'office'),
    paint: b => S.BG.office(b, {}),
    walk: [[40, 132, 258, 132, 316, 162, 316, 198, 4, 198, 4, 156, 36, 134]],
    block: [[0, 152, 96, 147, 112, 158, 112, 200, 0, 200]],
    layers: [
      { id: 'closetOpen', x: 222, y: 38, when: g => g.f.closetOpen },
      { id: 'mrbear', x: 222, y: 42, when: g => g.f.closetOpen, key: g => Math.floor(g.time * 3) % 8 },
      { id: 'head', x: 242, y: 46, when: g => g.f.closetOpen },
      { id: 'leoCloset', x: 222, y: 38, when: g => g.f.closetOpen },
      { id: 'capgun', x: 250, y: 74, when: g => g.f.closetOpen },
      { id: 'glove', x: 247, y: 88, when: g => g.f.closetOpen },
      { id: 'jar', x: 249, y: 111, when: g => g.f.closetOpen, key: g => Math.floor(g.time * 3) % 4 },
      { id: 'key', x: 226, y: 66, when: g => g.f.closetOpen && g.f.exhibit },
      { id: 'tree', x: 128, y: 92, base: 133 },
      { id: 'cooler', x: 84, y: 64, base: 134, key: g => (g.f.introDone ? 'g' : Math.floor(g.time * 6) % 12) },
      { id: 'flinthole', x: 12, y: 26, when: g => g.f.flintHole },
      { id: 'desk', x: 0, y: 138, base: 176 },
      { id: 'phone', x: 46, y: 142, base: 177 },
      { id: 'machine', x: 74, y: 145, base: 178, key: g => (g.f.machineDone ? 'h' : Math.floor(g.time * 2) % 2) }
    ],
    drawBack(f, g, cx) {
      const win = S.ringsMask([[100 - cx, 30, 164 - cx, 28, 164 - cx, 96, 100 - cx, 98]]);
      if (E.robotHere(g)) {
        const tmp = new S.Buf(f.w, f.h);
        const Q = new S.Pen(tmp);
        Q.part(Q.rect(96 - cx, 54, 72, 50), C.stone, { b: 3, sh: 0 });
        for (const [x, y] of [[108, 62], [156, 62], [108, 92], [156, 92]]) Q.part(Q.ell(x - cx, y, 1.6, 1.6), C.stone, { b: 4, sh: 0, hi: 0 });
        if (!g.f.keyGot) A.windKey(Q, 126 - cx, 78, 1);
        const head = E.robotHead(g);
        A.robotHead(Q, 132 - cx, 54, { mode: head === 'back' ? 'face' : head === 'face' ? 'back' : 'think', eye: true, k: Math.floor(g.time * 3) });
        win.each((x, y) => { const v = tmp.px[y * tmp.w + x]; f.set(x, y, v || (y < 54 ? C.sky[1] : C.stone[2])); });
        if (head === 'back' && Math.floor(g.time * 3) % 2) win.each((x, y) => { if (S.hash(x, y, 7) < 0.05) f.set(x, y, C.neonA); });
      }
      if (g.f.introDone) for (let i = 0; i < 7; i++) f.set(146 - cx + i, 34 + (i % 3), C.night[0]);
      if (E.ledgeHere(g)) {
        const sp = S.sprite(g.vt.maryLedge ? 'mary21' : 'jimmy', { dir: 's', blink: Math.floor(g.time * 2) % 7 === 0 }, 1.2);
        S.blit(f, sp.buf, Math.round(140 - cx - sp.ox), Math.round(97 - sp.oy));
        if (g.vt.maryLedge) { const sj = S.sprite('jimmy', { dir: 'w' }, 1.2); S.blit(f, sj.buf, Math.round(154 - cx - sj.ox), Math.round(97 - sj.oy)); }
      }
    },
    drawFront(f, g, cx) {
      for (let i = 0; i < 24; i++) {
        const x = 100 + ((i * 37 + Math.floor(g.time * 18) * (1 + (i % 3))) % 64);
        const y = 30 + ((i * 23 + Math.floor(g.time * 30)) % 66);
        if (S.inPoly([100, 30, 164, 28, 164, 96, 100, 98], x, y) && !E.robotHere(g)) f.set(x - cx, y, C.grey[5]);
      }
    },
    hot: [
      { id: 'edoor', name: 'Дверь на улицу', poly: [276, 32, 306, 23, 306, 170, 276, 142], walk: [284, 162], face: 'e',
        look: 'Наша дверь. Надпись на стекле изнутри читается задом наперёд. За стеклом гудит робот.',
        exit: function* (g) {
          if (!g.f.introDone) return;
          g.sfx('door');
          yield* g.goRoom('street', { x: 286, y: 146, dir: 's' });
        } },
      { id: 'window', name: g => (E.ledgeHere(g) ? 'Джимми на карнизе' : E.robotHere(g) ? 'Ключ за окном' : 'Окно'), poly: [100, 30, 164, 28, 164, 96, 100, 98], walk: [134, 134], face: 'n',
        look: g => windowLook(g),
        use: function* (g) {
          if (E.robotHere(g)) { yield* takeKey(g); return; }
          if (E.ledgeHere(g)) { yield g.say('sam', 'Тянуть Джимми за хвост? Он и так держится на одном честном слове.'); return; }
          yield g.say('sam', 'Открывать не буду. С улицы тянет снегом и праздником.');
        },
        talk: function* (g) {
          if (E.ledgeHere(g)) { yield g.talkTo('ledge'); return; }
          if (E.robotHere(g)) { yield E.robotSay(g, 'ГОВОРИ СО МНОЙ, ДЕТКА. ТОЛЬКО ЛИЦОМ К ЛИЦУ. Я НА УЛИЦЕ.'); return; }
          yield g.say('sam', 'Окну сказать нечего. Окно стеклянное.');
        },
        items: {
          mary: function* (g) {
            if (!E.ledgeHere(g)) { yield g.say('sam', 'Джимми за окном нет. Мэри некому показать.'); return; }
            yield* reunion(g);
          },
          gun: g => E.robotHere(g) ? 'Стрелять в робота через окно? Пуля отскочит обратно. Я это знаю из физики и из опыта.' : 'Стрелять в окно? Зима и так заходит без спроса.',
          key: g => E.robotHere(g) ? 'Ключ уже у меня в руке? Нет, он ещё в роботе.' : 'Возвращать ключ роботу? Пусть лежит.',
          glove: 'Перчатку Джимми уже отдал. Второй у него нет.'
        } },
      { id: 'cooler', name: g => (g.f.introDone ? 'Место кулера' : 'Кулер'), rect: [88, 66, 16, 68], walk: [100, 140], face: 'n',
        look: g => g.f.introDone ? 'Здесь стоял кулер. Теперь здесь пятно и запах жареной рыбы. Покойся с миром, Мистер Лопатка. Или как там у рыб.' : 'Кулер с водой и Мистером Лопаткой. Рыбка смотрит на Макса, Макс на рыбку.',
        use: g => g.f.introDone ? 'Воды нет. Рыбы тоже. Пить отсюда я больше не буду.' : 'Подождём с водой.' },
      { id: 'flinthole', name: 'Дырка в стене', rect: [10, 24, 18, 14], when: g => g.f.flintHole, walk: [44, 148], face: 'w',
        look: 'Дырка в стене от пули Флинта Пейпера. Через неё слышно, как он работает.',
        use: 'Совать палец в дырку от пули? Флинт с той стороны может принять это за громилу.',
        talk: function* (g) { yield g.talkTo('flint'); },
        items: { gun: 'Стрелять в ответ? Флинт сочтёт это приглашением.' } },
      { id: 'tv', name: 'Телевизор', poly: [172, 60, 212, 58, 213, 87, 172, 88], walk: [192, 136], face: 'n',
        look: 'Телевизор. Антенной служат плечики. С первого дела ничего не поменялось, кроме каналов.',
        use: function* (g) { yield* watchTv(g); },
        items: { gun: 'Стрелять в телевизор? Новости от этого лучше не станут.' } },
      { id: 'vcr', name: 'Видеомагнитофон', rect: [177, 88, 31, 10], walk: [192, 136], face: 'n',
        look: 'Видеомагнитофон. На часах «88:88». Под Рождество это почти праздничная гирлянда.',
        use: 'Кассет нет. Последние мы сдали в шкаф как улики.' },
      { id: 'phone', name: 'Телефон', rect: [44, 140, 26, 16], walk: [104, 150], face: 'w', over: true,
        look: 'Наш телефон. Дисковый. По нему нам сообщают, что всё плохо. Сегодня всё плохо и без звонка.',
        use: 'Звонить некому. Все, кто нам нужен, звонят сами.',
        items: { gun: 'Стрелять в телефон? Он единственный тут звонит по делу.' } },
      { id: 'machine', name: 'Автоответчик', rect: [74, 145, 16, 10], walk: [108, 154], face: 'w', over: true,
        look: g => g.f.machineDone ? 'Автоответчик. Лампочка погасла. На ленте Боско, Сибил и Комиссар.' : 'Автоответчик. Лампочка мигает.',
        use: function* (g) { yield* playMachine(g); } },
      { id: 'desk', name: 'Стол', poly: [0, 156, 92, 150, 108, 158, 108, 200, 0, 200], walk: [118, 164], face: 'w',
        look: 'Мой стол. Под стеклом список дел на неделю: «Рождество». Больше ничего не помещается.',
        use: 'В ящиках пусто. Подарки Макс держит за щекой.' },
      Object.assign({ id: 'closet', poly: [224, 42, 260, 40, 260, 128, 224, 128], when: g => !g.f.closetOpen }, CLOSET),
      Object.assign({ id: 'closetin', rect: [220, 36, 50, 96], when: g => g.f.closetOpen }, CLOSET),
      { id: 'mrbear', name: 'Мистер Мишка', rect: [226, 44, 16, 22], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Мистер Мишка из студии Майры, улика второго дела. На нём очки Реальности 2.0, улика пятого. Он видит исправленный мир, и мир ему не нравится.',
        use: function* (g) { g.sfx('zap'); yield g.say('sam', 'Бьёт током. Вице-президент на посту.'); },
        items: { gun: 'Мишка пережил воду, ток и выборы. Пуля его только развлечёт.' } },
      { id: 'preshead', name: 'Голова президента', rect: [243, 46, 15, 20], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Деревянная голова прошлого президента, улика четвёртого дела. До сих пор улыбается.',
        use: function* (g) { g.sfx('click'); yield g.say('sam', 'Челюсть щёлкает: «С Рож...» и заедает.'); } },
      { id: 'capgun', name: 'Пистолет с пистонами', rect: [250, 74, 9, 10], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Пистонный пистолет Леонарда, улика третьего дела. Висит там, где Леонард его видит.',
        use: 'Пусть висит.' },
      { id: 'mglove', name: 'Перчатка Макса', rect: [247, 88, 12, 14], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Перчатка Макса, улика первого дела. Лечит гипноз одним ударом. Демонов она не лечит, я спрашивал у Макса.',
        use: 'Пусть висит. Гипноза в этом деле пока нет.' },
      { id: 'jar', name: 'Банка с Хью Блиссом', rect: [249, 112, 11, 14], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Хью Блисс, колония бактерий, улика шестого дела. Прокипячён. На крышке рукой Макса: «Не пить. Уже пил».',
        use: 'Не открою. Ему и в банке хорошо.' },
      { id: 'keyex', name: 'Ключ завода', rect: [226, 66, 20, 8], when: g => g.f.closetOpen && g.f.exhibit, walk: [240, 136], face: 'n', over: true,
        look: 'Ключ от Маймтрона 9000. Первое дело нового сезона. Висит на гвозде и пахнет машинным маслом.',
        use: 'Пусть висит.' },
      { id: 'leocloset', name: 'Леонард', rect: [226, 76, 20, 48], when: g => g.f.closetOpen, walk: [240, 136], face: 'n', over: true,
        look: 'Леонард Стейкчармер. Сидит у нас с третьего дела. Парик Брэди ему к лицу, скотч тоже.',
        talk: function* (g) {
          g.sfx('mumble');
          yield E.leo(g, 'Мм-мм-мм! Мм!');
          yield g.say('sam', 'Он поздравляет нас с Рождеством. Или требует адвоката. Через скотч звучит одинаково.');
        },
        use: 'Выпускать рано. Праздники он проведёт в кругу улик.',
        items: {
          gun: 'Он связан и в парике. Добавить тут нечего.',
          sock: function* (g) { g.sfx('mumble'); yield E.leo(g, 'Мм!!'); yield g.say('sam', 'Леонард против носка. Впервые за три дела мы в чём-то согласны.'); }
        } },
      { id: 'hole', name: 'Нора Джимми', rect: [203, 114, 16, 15], walk: [204, 138], face: 'n',
        look: g => g.f.jimmyHappy ? 'Нора Джимми Два Зуба. Изнутри слышно, как кто-то ругает Джимми за немытые уши. Счастливый звук.' : 'Нора Джимми Два Зуба. Пусто. Хозяин занят на улице.',
        use: 'Совать лапу в крысиную нору я не стал в первом деле. Не стану и сейчас.' },
      { id: 'cabinet', name: 'Картотека', poly: [40, 62, 90, 58, 90, 124, 41, 129], walk: [66, 136], face: 'n',
        look: 'Картотека. Шесть папок прошлого сезона. Седьмую я подписал «Подарок», на всякий случай карандашом.',
        use: 'Подшивать рано.' },
      { id: 'picture', name: 'Картина', rect: [43, 17, 39, 33], walk: [62, 136], face: 'n',
        look: 'Собаки играют в покер. Кто-то повесил на угол рамы мишуру. Подозреваю Макса.',
        use: 'Висит криво. После лазера тут всё немного набекрень.' },
      { id: 'xtree', name: 'Ёлка', rect: [128, 92, 30, 40], walk: [146, 136], face: 'n',
        look: 'Наша ёлка. Пластмассовая, ростом с Макса. Под ней пусто, а подарок нам уже прислали.',
        use: 'Трогать не буду. Иголки у неё пластмассовые, но колются честно.' },
      { id: 'rack', name: 'Вешалка', rect: [10, 50, 22, 78], walk: [42, 146], face: 'w', look: 'Вешалка. Шляпу я не снимаю: под ней дуршлаг.', use: 'Вешать нечего.' },
      { id: 'switch', name: 'Выключатель', rect: [266, 73, 9, 14], walk: [262, 142], face: 'e', look: 'Выключатель. Щёлкает.',
        use: function* (g) {
          yield g.anim('sam', 'reach', 0.3);
          g.sfx('click');
          g.fx.dark = !g.fx.dark;
          yield g.say(g.fx.dark ? 'max' : 'sam', g.fx.dark ? 'Сэм! В темноте светится только Мистер Мишка! И глаз робота!' : 'Со светом спокойнее.');
        } },
      { id: 'bulb', name: 'Лампочка', rect: [144, 0, 12, 19], look: 'Лампочка. Сорок ватт. Пережила лазер.', use: 'Не дотянусь.' }
    ],
    setup(g) { g.fx.dark = false; },
    onLoad(g) { ROOMS.office.setup(g); }
  };

  E.epilogue = function* (g) {
    const max = g.actors.max;
    g.hideUI = true;
    g.f.epilogue = true;
    g.f.exhibit = true;
    g.f.closetOpen = true;
    g.drop('key');
    g.setRoom('office', { x: 236, y: 140, dir: 'n' });
    max.follow = 'sam';
    g.place('max', 'office', 204, 146, 'e');
    max.scripted = true;
    g.music('office');
    yield g.fadeIn(2);
    yield g.say('sam', 'Первое дело сезона закрыто. Ключ от Маймтрона висит в шкафу, Санта едет по адресу, демон в Санте.');
    yield g.say('max', 'А мы развезли подарки! Сэм, я подарил Комиссару указ! Он плакал!');
    g.sfx('mumble');
    yield E.leo(g, 'Мм?');
    yield g.say('sam', 'Тебе тоже подарок, Леонард. Новый сосед по шкафу. Он железный и молчит.');
    g.face('sam', 'e');
    yield g.say('sam', 'Одно меня беспокоит, Макс. На ящике с демоном был обратный адрес. Три буквы: С, У, П.');
    yield g.say('max', 'Суп? Демона прислал суп?');
    yield g.say('sam', 'Или кто-то, кто любит подписываться инициалами. Подождём, пока зазвонит телефон.');
    yield g.say('max', 'А пока объявлю войну Новому году! Он следующий!');
    yield 0.8;
    max.scripted = false;
    g.hideUI = false;
    yield g.fadeOut(1.5);
    g.ended = true;
  };

  E.startNewGame = function (g) {
    E.newGame(g);
    g.setRoom('office');
    g.fade = 1; g.fadeTo = 1;
    g.run(intro, { name: 'intro' });
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
