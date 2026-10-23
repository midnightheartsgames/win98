(function (H) {
  'use strict';

  const HOUR = 3600000;
  const PERIODS = { week: { ms: HOUR, label: 'неделя' }, version: { ms: 6 * HOUR, label: 'версия' } };
  const HERTA_TEXT = 'Договор о взаимной помощи между Гертой и Экспрессом. Герта помогает Экспрессу, чем может, а взамен получает диковинки, найденные в Освоении.';
  const GRAND_TEXT = 'Великая Герта не подписывает мелких бумаг. Этот контракт она скрепила личной печатью, и выбор поставки оставила Первопроходцам.';

  const CONTRACTS = [
    {
      id: 'c_coop', name: 'Великая Герта: Контракт стратегического сотрудничества', rar: 5, price: 2680, limit: 5, period: 'version', look: 'grand', text: GRAND_TEXT,
      give: { items: { spass: 10 } }, pick: 3,
      from: [{ items: { resin: 2 } }, { items: { remains: 1600 } }, { items: { tears: 480 } }, { items: { exp3: 200 } }]
    },
    {
      id: 'c_support', name: 'Великая Герта: Контракт стратегической поддержки', rar: 5, price: 720, limit: 5, period: 'version', look: 'grandDark', text: GRAND_TEXT,
      give: {}, pick: 2,
      from: [{ items: { resin: 1 } }, { items: { remains: 800 } }, { items: { tears: 240 } }, { items: { exp3: 100 } }]
    },
    { id: 'c_aid', name: '«Герта»: Контракт на снабжение Первопроходцев', rar: 4, price: 880, limit: 1, period: null, look: 'aid', text: HERTA_TEXT, give: { items: { exp3: 60 }, credits: 24000 } },
    { id: 'c_fuel', name: '«Герта»: Контракт на восполнение топлива', rar: 4, price: 240, limit: 1, period: 'week', look: 'fuel', text: HERTA_TEXT, give: { items: { fuel: 2 }, credits: 3000 } },
    { id: 'c_quest', name: '«Герта»: Контракт на совместные приключения', rar: 3, price: 180, limit: 2, period: 'week', look: 'quest', text: HERTA_TEXT, give: { items: { exp2: 25, exp1: 60 }, credits: 5000 } },
    { id: 'c_roam', name: '«Герта»: Контракт на поставки в путешествиях', rar: 4, price: 330, limit: 8, period: 'version', look: 'roam', text: HERTA_TEXT, give: { items: { exp3: 20, exp2: 15 }, credits: 12000 } },
    { id: 'c_res2', name: '«Герта»: Контракт на снабжение материалами 2', rar: 4, price: 660, limit: 5, period: 'version', look: 'res2', text: HERTA_TEXT, give: { items: { tears: 150 }, credits: 12000 } }
  ];

  const lots = g => [].concat(Object.entries(g.items || {}).map(([id, n]) => ({ id, n })), g.credits ? [{ id: 'credits', n: g.credits }] : []);
  const merge = list => list.reduce((a, g) => {
    for (const [id, n] of Object.entries(g.items || {})) a.items[id] = (a.items[id] || 0) + n;
    if (g.credits) a.credits = (a.credits || 0) + g.credits;
    return a;
  }, { items: {} });

  Object.assign(H.Game.prototype, {
    contractBook() { const s = this.state; return s.contracts || (s.contracts = {}); },
    contractSlot(c) { return c.period ? Math.floor(this.now() / PERIODS[c.period].ms) : 0; },
    contractEnds(c) { return c.period ? (this.contractSlot(c) + 1) * PERIODS[c.period].ms : null; },
    contractLeft(c) {
      const b = this.contractBook()[c.id];
      return c.limit - (b && b.slot === this.contractSlot(c) ? b.n : 0);
    },
    contractView(id) {
      const c = CONTRACTS.find(x => x.id === id);
      if (!c) return null;
      const left = this.contractLeft(c);
      return { c, left, ends: this.contractEnds(c), block: left <= 0 ? 'limit' : this.state.jade < c.price ? 'jade' : null };
    },
    contractList() { return CONTRACTS.map(c => this.contractView(c.id)); },
    contractBuy(id, picks) {
      const v = this.contractView(id);
      if (!v || v.block) return null;
      const c = v.c, sel = [...new Set(picks || [])].filter(i => Number.isInteger(i) && i >= 0 && i < (c.from || []).length);
      if ((c.pick || 0) !== sel.length) return null;
      const book = this.contractBook(), slot = this.contractSlot(c), b = book[c.id];
      book[c.id] = { slot, n: (b && b.slot === slot ? b.n : 0) + 1 };
      this.state.jade -= c.price;
      const pack = merge([c.give].concat(sel.map(i => c.from[i])));
      return { c, pack, got: this.give(pack) };
    }
  });

  Object.assign(H, { CONTRACTS, CONTRACT_PERIODS: PERIODS, contractLots: lots });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
