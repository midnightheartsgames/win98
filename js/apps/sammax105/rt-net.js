(function (S) {
  'use strict';
  const { C, COLORS, font, blit } = S;
  const E = S.EP105;
  const { ROOMS, TALK } = E;
  const LABEL = { curt: 'ГЛУБИНА', bob: 'РОСТ', bluster: 'ТЯЖЕСТЬ' };
  const BOX = { x: 290, y: 176, w: 28, h: 22 };
  let live = null;

  const HUD = {
    id: 'hud', over: true, walkUse: true,
    get poly() {
      const cx = live && live.room ? Math.round(live.camX) : 0;
      return [cx + BOX.x, BOX.y, cx + BOX.x + BOX.w, BOX.y, cx + BOX.x + BOX.w, BOX.y + BOX.h, cx + BOX.x, BOX.y + BOX.h];
    },
    name: g => (g.f.vr ? 'Снять очки' : 'Надеть очки'),
    when: g => !!g.f.gogglesFixed && !g.f.netFreed,
    look: g => g.f.vr ? 'Значок очков. Нажму, и сниму их. Окажусь на том же месте, только в настоящем мире.' : 'Значок очков. Нажму, и окажусь в Реальности 2.0 на этом же месте.',
    use: function* (g) { yield* E.toggle(g); },
    talk: g => (g.f.vr ? 'Очки молчат. Говорит тут хозяйка, и она не в очках.' : 'Очки не отвечают. Отвечают те, кто внутри.'),
    items: { '*': 'Очкам это ни к чему. Их надевают или снимают.' }
  };
  E.HUD = HUD;
  E.HUD_BOX = BOX;

  function hudDraw(f, g) {
    if (!HUD.when(g) || g.cutscene || g.dialog || g.hideUI || g.closeup) return;
    const hot = g.hover && g.hover.kind === 'hot' && g.hover.id === 'hud';
    S.rectFill(f, BOX.x, BOX.y, BOX.w, BOX.h, g.f.vr ? C.night[1] : C.oak[1]);
    S.frameRect(f, BOX.x, BOX.y, BOX.w, BOX.h, C.black);
    S.frameRect(f, BOX.x + 1, BOX.y + 1, BOX.w - 2, BOX.h - 2, hot ? C.yellow[4] : g.f.vr ? C.tvA : C.oak[3]);
    blit(f, S.icon('vrgoggles5'), BOX.x + 2, BOX.y + 1);
    if (g.f.vr) font.draw(f, '2.0', BOX.x + 8, BOX.y + 13, C.lamp, C.black);
  }

  function statusDraw(f, g) {
    if (!g.f.vr || g.closeup) return;
    const on = g.f.bugOn;
    if (LABEL[on]) font.draw(f, 'СБОЙ: ' + LABEL[on], 4, 3, Math.floor(g.time * 3) % 2 ? C.neonA : C.lamp);
  }

  function tick(g) {
    E.applyBody(g);
    const a = g.actors.internet;
    if (!a || a.room !== g.roomId || !a.visible) return;
    a.x = Math.round(g.camX) + 160;
    if (!g.speech.some(s => s.who === 'internet')) a.visible = false;
  }

  E.install = function () {
    for (const room of Object.values(ROOMS)) {
      if (room.world105) continue;
      room.world105 = true;
      const setup = room.setup, update = room.update, front = room.drawFront;
      room.hot.push(HUD);
      room.setup = function (g) {
        live = g;
        if (g.actors.internet) g.actors.internet.visible = false;
        if (setup) setup.call(room, g);
        E.applyBody(g);
      };
      room.update = function (g, dt) {
        live = g;
        if (update) update.call(room, g, dt);
        tick(g);
      };
      room.drawFront = function (f, g, cx, r) {
        if (front) front.call(room, f, g, cx, r);
        statusDraw(f, g);
        hudDraw(f, g);
      };
      if (!room.onLoad) room.onLoad = function (g) { room.setup(g); };
    }
  };

  const ZONES = ['Нос', 'Середина', 'Хвост'];

  function* afterPaint(g) {
    const names = g.f.car.split('').map(id => (E.PAINTS.find(p => p.id === id) || { name: 'шашечки' }).name.toLowerCase());
    yield g.say('sam', 'Готово. Спереди ' + names[0] + ', посередине ' + names[1] + ', сзади ' + names[2] + '.');
    if (g.f.car === E.PLATE) { yield g.say('max', 'Синий, красный, фиолетовый! «СКФ»! Как на номере!'); return; }
    if (g.f.fwSeen) { yield g.say('max', 'Красиво! Только файрвол, по-моему, читает нас по буквам! Глаз у него нет!'); return; }
    yield g.say('max', 'Красиво! Поехали куда-нибудь, пока не высохло!');
  }

  TALK.paint = {
    options: (g, d) => {
      const zone = d.data.zone || 0;
      return E.PAINTS.map((p, i) => ({
        id: 'c' + i, icon: 'paint5_' + i, text: ZONES[zone] + ': ' + p.name.toLowerCase(), say: false,
        run: function* (gg) {
          const cols = gg.f.car.split('');
          cols[zone] = p.id;
          gg.f.car = cols.join('');
          gg.sfx('spray');
          yield 0.35;
          if (zone < 2) { d.data.zone = zone + 1; return; }
          gg.endDialog();
          yield* afterPaint(gg);
        }
      })).concat([{ id: 'bye', icon: 'bye', text: 'Хватит красить.', say: false, end: true }]);
    }
  };

  E.paintCar = function* (g) {
    const body = E.body(g);
    if (body === 'small') { yield g.say('sam', 'Я сейчас ниже колеса. Банку с краской мне не поднять.'); return; }
    if (body === 'flat') { yield g.say('sam', 'Плоской лапой кисть не удержать. Она проходит насквозь.'); return; }
    if (!g.seen.paintCar) {
      g.seen.paintCar = 1;
      yield g.say('sam', 'Семь банок и три части: нос, середина, хвост. Де Сото, не дёргайся.');
    }
    yield g.talkTo('paint');
  };

  TALK.netdrive = {
    options: [
      { id: 'bank', icon: 'bank5', text: 'bancolavadero.com', say: false, end: true, run: function* (g) { g.endDialog(); yield* E.toBank(g); } },
      { id: 'casino', icon: 'jackbox5', text: 'Казино Теда И. Бэра', say: false, run: function* (g) {
        yield E.net(g, 'Адрес не найден. Сайт взлетел на воздух вместе с владельцем.');
        yield g.say('max', 'Даже тут про нас помнят!');
      } },
      { id: 'bye', icon: 'bye', text: 'Никуда не едем.', say: false, end: true }
    ]
  };

  E.netDrive = function* (g) {
    const body = E.body(g);
    if (body === 'small') { yield g.say('sam', 'Я сейчас ниже педалей. За руль в таком росте не садятся.'); return; }
    if (body === 'flat') { yield g.say('sam', 'Плоский водитель проваливается в щель между сиденьями. Проверять не хочу.'); return; }
    if (!g.f.knowBank && !g.f.knowSite) {
      yield g.say('sam', 'Сесть можно, ехать некуда. В сети нужен адрес, а я не знаю ни одного.');
      return;
    }
    yield g.say('sam', 'Де Сото 2.0 спрашивает адрес.');
    yield g.talkTo('netdrive');
  };

  const fwSay = (g, text) => g.say(null, text, { key: 'fw', color: COLORS.internet, x: 160, y: 196 });

  E.toBank = function* (g) {
    const cols = g.f.car.split('');
    const ok = g.f.car === E.PLATE;
    g.hideUI = true;
    g.sfx('engine');
    yield g.fadeOut(4);
    g.closeup = { kind: 'netdrive5', t0: g.time, dur: 3, text: E.SITE, cols };
    g.music('firewall');
    yield g.fadeIn(4);
    if (!g.seen.netRide) {
      g.seen.netRide = 1;
      yield g.say('max', 'Сэм, мы едем по Интернету! Я всегда думал, что он липкий!', { x: 160, y: 196 });
    } else yield 1.8;
    yield g.fadeOut(4);
    const t0 = g.time;
    const cu = { kind: 'firewall5', t0, cars: ok ? [] : [{ cols: ['к', 'ф', 'з'], plate: 'кфз', at: 0.2 }, { cols: ['з', 'к', 'с'], plate: 'зкс', at: 5 }], own: { cols, plate: E.PLATE, at: ok ? 0.3 : 2.4, ok }, scan: null };
    g.closeup = cu;
    yield g.fadeIn(4);
    const until = t => g.until(gg => gg.time - t0 >= t || gg.skipping);
    if (ok) {
      yield until(2.3);
      g.sfx('ding');
      cu.scan = { t0: g.time, ok: true, text: 'СКФ: ПРОЕЗД РАЗРЕШЁН' };
      yield fwSay(g, 'Файрвол. Окраска совпала с номером. Добро пожаловать в банк.');
      yield g.fadeOut(4);
      g.closeup = null;
      const bank = new E.Bank(g);
      g.mode = 'bank';
      g.drive = bank;
      g.music('bank5');
      g.hideUI = false;
      yield g.fadeIn(4);
      yield bank.say('internet', 'Банко Лавадеро. Ваши деньги придут грязными и уйдут чистыми. Выберите счёт.');
      if (!g.seen.bankIn) {
        g.seen.bankIn = 1;
        yield bank.say('sam', 'Девять счетов, деньги лежат на двух. Счёт Боско пустой, как его доверие к людям.');
      }
      return;
    }
    yield until(2.2);
    g.sfx('ding');
    cu.scan = { t0: g.time, ok: true, text: 'КФЗ: ПРОЕЗД РАЗРЕШЁН' };
    yield until(4.4);
    g.sfx('buzzer');
    cu.scan = { t0: g.time, ok: false, text: 'СКФ: НОМЕР НЕ СОВПАЛ С ОКРАСКОЙ' };
    yield fwSay(g, 'Файрвол. Окраска машины не совпадает с номером. Проезд закрыт.');
    yield until(7);
    g.sfx('ding');
    cu.scan = { t0: g.time, ok: true, text: 'ЗКС: ПРОЕЗД РАЗРЕШЁН' };
    if (!g.f.fwSeen) {
      yield g.say('sam', 'Красно-фиолетово-зелёную пропустили. Зелёно-красно-синюю тоже. Нас, в шашечку, развернули.', { x: 160, y: 196 });
      yield g.say('max', 'Это дискриминация! Наш номер ничем не хуже! «СКФ» звучит как чих!', { x: 160, y: 196 });
    } else yield g.say('max', 'Опять развернули! Сэм, этот файрвол придирается к нашей внешности!', { x: 160, y: 196 });
    g.f.fwSeen = true;
    yield g.fadeOut(4);
    g.closeup = null;
    g.hideUI = false;
    yield* g.goRoom('street2', { x: 200, y: 164, dir: 's' }, { from: 'fw' });
  };

  E.sendCold = function* (g) {
    g.hideUI = true;
    yield g.say('sam', 'Конверт. Кому: «всем». От кого: «от Боско, с любовью».');
    yield g.anim('sam', 'reach', 0.5);
    g.drop('hanky');
    g.sfx('whoosh');
    yield 0.6;
    yield E.net(g, 'Вам письмо. И вам письмо. Всем письмо. Открываю.', 'ok');
    g.f.infected = true;
    g.sfx('spray');
    yield E.net(g, 'А... А-а... АПЧХИ!', 'sick');
    g.fx.shake = 0.8;
    g.fx.flash = 0.4;
    g.sfx('zap');
    yield g.say('max', 'Будь здорова! Хотя нет. Отменяю!');
    yield E.net(g, 'У меня течёт из всех портов. Графика... Я не удержу графику...', 'sick');
    g.music('text15');
    g.sfx('crash');
    g.closeup = { kind: 'crash5', t0: g.time, dur: 3 };
    yield 3.2;
    yield g.fadeOut(3);
    g.closeup = null;
    g.actors.internet.visible = false;
    g.mode = 'text15';
    g.drive = new E.Text15(g);
    g.hideUI = false;
    yield g.fadeIn(3);
  };

  const voice = (g, text) => g.say(null, text, { key: 'internet', color: COLORS.internet, x: 160, y: 40 });

  E.finale = function* (g) {
    const sam = g.actors.sam, max = g.actors.max, sy = g.actors.sybil, bo = g.actors.bosco;
    const O = E.office;
    g.hideUI = true;
    g.fx.dark = false;
    E.setWorld(g, false);
    if (g.f.bugOn) { g.f.bugOn = ''; if (!g.has('roach')) g.inv.push('roach'); }
    g.setRoom('street', { x: 470, y: 154, dir: 's' });
    max.scripted = true;
    g.place('max', 'street', 444, 157, 'e');
    g.place('sybil', 'street', 336, 150, 'e');
    sy.v = ''; sy.act = ''; sy.keepAct = false; sy.visible = true;
    g.place('bosco', 'street', 596, 152, 'w');
    bo.v = ''; bo.act = ''; bo.keepAct = false; bo.visible = true;
    g.music('street');
    yield g.fadeIn(1.2);
    yield voice(g, 'Говорит Интернет. Мне вернули одну вещь, и я вспомнила, зачем я нужна.');
    yield voice(g, 'Снимите очки. Идите домой. За тостеры простите.');
    yield g.say('sam', 'Она всех отпускает. Кто велел ей держать?');
    yield voice(g, 'Заказчик. Счёт открыт на имя Роя Г. Бива. Это он стёр у меня уваже... уваж... А-АПЧХИ!');
    g.sfx('zap');
    g.fx.flash = 0.6;
    yield voice(g, 'Перезагрузка. Ждите.');
    g.face('sam', 'e');
    yield g.say('bosco', 'Сэм! Мои сорок уровней сгорели! Скажи хоть, что миллиард настоящий!');
    yield g.say('sam', 'Настоящий. Его перевели из казны.');
    yield g.say('max', 'Из моей! Боско, ты мне должен насморк!');
    g.face('sam', 'w');
    yield g.say('sybil', 'Кажется, кончилось. Пойду переписывать вывеску.');
    yield g.fadeOut(1.2);
    g.f.closetOpen = true;
    g.f.epilogue = true;
    g.f.tvOff = false;
    g.setRoom('office', { x: 238, y: 140, dir: 'n' });
    g.place('max', 'office', 200, 152, 'e');
    g.music('office');
    yield g.fadeIn(1.2);
    yield g.say('sam', 'Очки Реальности 2.0, улика пятого дела. В шкафу места нет. Зато у мишки свободна голова.');
    yield g.anim('sam', 'reach', 0.6);
    g.sfx('click');
    g.drop('goggles');
    g.f.exhibit = true;
    yield g.say('max', 'Мишка в очках! Он и так видел то, чего нет. Теперь увидит в цвете!');
    g.sfx('mumble');
    yield O.leo(g, 'Мм-мм!');
    yield g.say('sam', 'Леонард просит примерить. Нет, Леонард.');
    yield* O.ring(g, 2);
    yield* O.pickUp(g, 'Вольная полиция. Приёмная президента.');
    yield E.phone(g, 'Сэм, тостер отдал пароль. Светофоры снова просто мигают. Что вы сделали?');
    yield g.say('sam', 'Послали Интернету письмо, Комиссар. С насморком.');
    yield E.phone(g, 'Это я записывать не буду.');
    yield g.say('sam', 'Запишите имя. Рой Г. Бив. На него открыт счёт, с которого всё оплатили.');
    yield E.phone(g, 'Похоже на псевдоним, Сэм.');
    O.hangUp(g);
    yield g.say('sam', 'Рой Г. Бив. Макс, на крышках банок с краской стояли буквы. R, O, Y, G, B, I, V. В том же порядке.');
    yield g.say('max', 'Значит, во всём виноват маляр! Объявляю малярам войну!');
    yield g.say('sam', 'Сначала четверг, Макс. Ему ты уже объявил.');
    yield g.fadeOut(0.6);
    g.hideUI = false;
    g.ended = true;
  };

  E.install();
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
