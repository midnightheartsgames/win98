(function (H) {
  'use strict';

  const PASS = {
    sku: 'hsr98_express_pass', name: 'Пропуск снабжения экспресса', price: 4.99, priceText: '4,99 US$',
    now: 300, daily: 90, days: 30, max: 180,
    text: 'Провизия, которую Экспресс собрал для Первопроходцев. Сразу после покупки 300 звёздного нефрита, потом 30 дней подряд по 90 нефрита за каждый день в игре.',
    quote: '«Уважаемый проводник, можно не дырявить билеты? Я собираю целую коллекцию.»'
  };
  const PASS_RULES = [
    'Сразу после оплаты вы получите 300 звёздного нефрита.',
    'Затем 30 дней подряд пропуск приносит 90 звёздного нефрита в день. Награда приходит, когда вы заходите в игру. День начинается в 04:00.',
    'День, в который вы не заходили в игру, пропадает: его награду нельзя получить позже.',
    'Пропуск можно купить снова, пока он действует: каждая покупка добавляет 30 дней. Всего не больше 180 дней.',
    'Пропуск не продлевается сам. Когда дни закончатся, купите новый.',
    'Оплата проходит через Steam. Пропуск получает сохранение, которое загружено во время оплаты.'
  ];

  const dayNo = ms => { const [y, m, d] = H.dayKey(ms).split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); };

  Object.assign(H.Game.prototype, {
    passState() {
      const s = this.state;
      return s.pass || (s.pass = { end: null, last: null, orders: [], bought: 0, got: 0 });
    },
    passToday() { return dayNo(this.now()); },
    passLeft() {
      const p = this.passState(), today = this.passToday();
      return typeof p.end === 'number' && p.end >= today ? p.end - today + 1 : 0;
    },
    passActive() { return this.passLeft() > 0; },
    passClaimedToday() { return this.passState().last === this.passToday(); },
    passCanBuy() { return this.passLeft() + PASS.days <= PASS.max; },
    passReady() { return this.passActive() && !this.passClaimedToday(); },
    passOwed() { return Math.max(0, this.passLeft() - (this.passClaimedToday() ? 1 : 0)); },
    passClaim() {
      if (!this.passReady()) return null;
      const p = this.passState();
      p.last = this.passToday();
      p.got += PASS.daily;
      this.state.jade += PASS.daily;
      return { jade: PASS.daily, left: this.passOwed() };
    },
    passGrant(order) {
      const p = this.passState();
      if (!order || p.orders.includes(order)) return null;
      p.orders.push(order);
      p.bought++;
      const today = this.passToday(), from = this.passActive() ? p.end : today - 1;
      p.end = Math.min(today + PASS.max - 1, from + PASS.days);
      this.state.jade += PASS.now;
      p.got += PASS.now;
      const day = this.passClaim();
      return { now: PASS.now, day, left: this.passOwed() };
    }
  });

  Object.assign(H, { PASS, PASS_RULES, passDayNo: dayNo });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
