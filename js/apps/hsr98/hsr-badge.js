(function (H) {
  'use strict';
  const T = H.TUNING;

  const ALLEY4 = ['cone:cccgorilla', 'cone:cccbadge', 'cone:cccstandee'];
  const COL = { makoto: '#e0304a', amanda: '#ff6aa8', talleah: '#4a90e0' };
  const BANNERS = {
    con: { name: 'Главная сцена', kind: 'Кон-Тон', pass: 'badge', stars: {
      makoto: { name: 'Кошка-воровка', title: ['Кошка-', 'воровка'], col: COL.makoto, four: ['sampo', 'guinaifen', 'tingyun'] },
      amanda: { name: 'Розовая Защитница', title: ['Розовая', 'Защитница'], col: COL.amanda, four: ['march', 'arlan', 'hook'] },
      talleah: { name: 'Во имя правосудия!', title: ['Во имя', 'правосудия!'], col: COL.talleah, four: ['asta', 'herta', 'pela'] }
    } },
    alley: { name: 'Аллея художников', kind: 'Кон-Тон', pass: 'badge', stars: {
      makoto: { cone: 'cccletter', title: ['С любовью,', 'Макото'], col: COL.makoto, four: ALLEY4 },
      amanda: { cone: 'cccmagic', title: ['Настоящая', 'магия'], col: COL.amanda, four: ALLEY4 },
      talleah: { cone: 'cccpratia', title: ['Небеса', 'Пратии'], col: COL.talleah, four: ALLEY4 }
    } }
  };

  const ITEMS = {
    badge: { name: 'Бейдж Кон-Тона', kind: 'key', rar: 5, price: 0, text: 'Бейдж участника на шнурке. Пропуск на главную сцену и в Аллею художников. Его же показывают на входе в номер.' }
  };

  const DAYS = [['Четверг', 2], ['Пятница', 2], ['Суббота', 3], ['Воскресенье', 3]];

  const MAIL = {
    id: 'v14_conton', from: 'Экипаж Звёздного экспресса', title: 'Кризис на Косплейном Конвенте', give: { items: { badge: 10 } }, text: [
      'Уважаемый Первопроходец!',
      'Прибор с лампочками, который кто-то оставил в Вагоне для вечеринок, открыл дверь между мирами. За ней Кон-Тон, крупнейший конвент на всём северо-западном побережье.',
      'В Звёздном прыжке открылась вкладка «Кон-Тон». На главной сцене Макото Майн, Аманда Миллер и Таллея из Авии, в Аллее художников их световые конусы.',
      'Бейдж носить на шее. Без бейджа в зал не пускают. Во вложении 10 бейджей, ещё один дадут на регистрации, десять за четыре дня конвента.'
    ]
  };

  Object.assign(H.BANNERS, BANNERS);
  Object.assign(H.ITEMS, ITEMS);
  if (!H.MAIL.some(m => m.id === MAIL.id)) H.MAIL.push(MAIL);

  Object.assign(H.Game.prototype, {
    conRegistered() { return !!this.state.flags.con_reg; },

    conRegister() {
      if (this.conRegistered()) return false;
      this.state.flags.con_reg = true;
      this.give({ items: { badge: T.conRegBadges } });
      return true;
    },

    conDays() {
      const s = this.state;
      if (!s.conton || typeof s.conton !== 'object') s.conton = { days: 0, last: null, got: [] };
      const c = s.conton;
      if (!this.eventsOpen() || c.days >= DAYS.length) return c;
      const day = H.dayKey(this.now());
      if (c.last !== day) { c.days++; c.last = day; }
      return c;
    },

    conDayReady(i) { const c = this.conDays(); return i < c.days && !c.got[i]; },

    claimConDay(i) {
      if (!this.conDayReady(i)) return null;
      this.state.conton.got[i] = true;
      return this.give({ items: { badge: DAYS[i][1] } });
    }
  });

  const GUESTS = [
    ['%has_makoto', 'Макото', 'Классный поезд. Тут всё правильно. Почти. М.'],
    ['%has_amanda', 'Аманда', 'Если кто-то видел меня в розовом, вы ничего не видели. А. М.'],
    ['%has_talleah', 'Таллея', 'Друзья Экспресса! Мои гиноиды считают ваш поезд религиозным на 64%. Таллея из Авии.']
  ];
  for (const gst of GUESTS) if (H.GUESTS && !H.GUESTS.some(x => x[0] === gst[0])) H.GUESTS.push(gst);

  const proto = H.Game.prototype, baseClaim = proto.claimEvent, baseReady = proto.eventReady, baseAlerts = proto.alerts, baseCond = proto.cond;
  Object.assign(proto, {
    cond(expr) { return typeof expr === 'string' && expr.startsWith('%has_') ? !!this.state.roster[expr.slice(5)] : baseCond.call(this, expr); },
    claimEvent(id) {
      if (id !== 'conton') return baseClaim.call(this, id);
      const out = [];
      DAYS.forEach((d, i) => { const got = this.claimConDay(i); if (got) out.push(...got); });
      return out;
    },
    eventReady(id) { return id === 'conton' ? DAYS.some((d, i) => this.conDayReady(i)) : baseReady.call(this, id); },
    alerts() {
      const a = baseAlerts.call(this);
      if (this.eventsOpen() && this.eventReady('conton')) a.events = true;
      return a;
    }
  });

  H.CONTON_BANNER = { BANNERS, ITEMS, DAYS, MAIL, COL, ALLEY4, GUESTS };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
