(function (H) {
  'use strict';
  const C = H.TOWN.contract;
  const NAMES = Object.fromEntries(H.RESOURCES);
  const U = id => H.UNITS[id];
  const GOODS = ['wood', 'ore', 'salt', 'sulfur', 'amber', 'moonsilver'];
  const RARE = ['salt', 'sulfur', 'amber', 'moonsilver'];
  const SIDES = ['на востоке', 'на юго-востоке', 'на юге', 'на юго-западе', 'на западе', 'на северо-западе', 'на севере', 'на северо-востоке'];
  const TITLE = { hire: 'Наём', bounty: 'Награда', supply: 'Поставка' };

  const pick = (S, list) => list[Math.floor(H.roll(S) * list.length)];
  const stepped = (v, step) => Math.max(step, Math.round(v / step) * step);
  const desk = o => o.owner >= 0 && o.built.some(id => H.Town.def(o, id).contracts);
  const dealsOf = (S, pid) => S.players[pid].deals;
  const inReach = (o, x) => x.l === o.l && Math.hypot(x.c - o.c, x.r - o.r) <= C.radius;

  const targetOk = (S, d) => {
    if (d.obj != null) return !!H.Adv.obj(S, d.obj);
    return d.hero == null || S.heroes[d.hero].alive;
  };
  const claimed = (S, pid) => new Set(dealsOf(S, pid).filter(d => d.obj != null).map(d => d.obj));
  const monstersNear = (S, o, used) => S.map.objs.filter(x => x.t === 'monster' && !x.gone && !x.tag && !used.has(x.id) && inReach(o, x));

  const rareReward = (S, tier) => ({ res: pick(S, RARE), n: 1 + Math.floor(tier / 3) });
  const hireOffer = (S, o, used) => {
    const list = monstersNear(S, o, used);
    if (!list.length) return null;
    const x = pick(S, list);
    used.add(x.id);
    return { kind: 'hire', town: o.id, obj: x.id, unit: x.unit, each: Math.round(U(x.unit).cost * C.hire) };
  };
  const bountyOffer = (S, o, used) => {
    const seen = H.Adv.visible(S, o.owner, o.l), foes = S.heroes.filter(h => h.alive && h.owner !== o.owner && h.l === o.l && seen[h.r * S.map.w + h.c]);
    if (foes.length && H.roll(S) < C.heroShare) {
      const h = pick(S, foes), gold = Math.min(C.bountyCap, stepped(H.Adv.armyValue(h.army) * C.bounty, 50));
      return { kind: 'bounty', town: o.id, hero: h.id, gold, res: pick(S, RARE), n: 3 };
    }
    const list = monstersNear(S, o, used);
    if (!list.length) return null;
    const x = pick(S, list), gold = Math.min(C.bountyCap, stepped(x.count * U(x.unit).cost * C.bounty, 50));
    used.add(x.id);
    return Object.assign({ kind: 'bounty', town: o.id, obj: x.id, unit: x.unit, gold }, rareReward(S, U(x.unit).tier));
  };
  const supplyOffer = (S, o, used) => {
    const res = pick(S, GOODS.filter(r => !used.has(r))), each = Math.round(H.TOWN.value[res] * C.supply);
    const worth = Math.min(C.supplyTop, C.supplyBase + C.supplyWeek * H.Moons.weekOf(S));
    const n = Math.max(1, Math.round(worth / each));
    used.add(res);
    return { kind: 'supply', town: o.id, res, n, pay: n * each };
  };

  const rollBoard = (S, o) => {
    const used = claimed(S, o.owner);
    o.board = [hireOffer(S, o, used), bountyOffer(S, o, used)].filter(Boolean);
    while (o.board.length < C.board) o.board.push(supplyOffer(S, o, used));
    o.boardWeek = H.Moons.weekOf(S);
    o.boardOwner = o.owner;
  };
  const board = (S, o) => {
    if (!desk(o)) return [];
    if (o.boardWeek !== H.Moons.weekOf(S) || o.boardOwner !== o.owner) rollBoard(S, o);
    const used = claimed(S, o.owner);
    return o.board.filter(d => targetOk(S, d) && (d.obj == null || !used.has(d.obj)));
  };

  const take = (S, o, i) => {
    const offer = board(S, o)[i], pid = o.owner;
    if (!offer) return { ok: false, why: 'Контракта нет', ev: [] };
    if (dealsOf(S, pid).length >= C.active) return { ok: false, why: 'Одновременно идут только ' + C.active + ' контракта', ev: [] };
    o.board = o.board.filter(d => d !== offer);
    const deal = Object.assign({}, offer, { id: S.nextDeal++, until: S.day + C.term });
    dealsOf(S, pid).push(deal);
    if (deal.obj != null) {
      const x = H.Adv.obj(S, deal.obj);
      H.Adv.reveal(S, pid, x.l, x.c, x.r, C.sight);
    }
    S.ver++;
    return { ok: true, deal, ev: [{ t: 'dealTaken', player: pid, deal: deal.id }] };
  };
  const grant = (S, pid, a) => {
    const at = a.indexOf('at'), term = a.indexOf('for'), byTag = tag => S.map.objs.find(o => o.tag === tag && !o.gone) || null;
    const town = at >= 0 ? byTag(a[at + 1]) : H.Town.list(S, pid)[0];
    if (!town) return null;
    const deal = { kind: a[0], town: town.id, id: S.nextDeal++, until: S.day + (term >= 0 ? +a[term + 1] : C.term) };
    if (deal.kind === 'supply') Object.assign(deal, { res: a[1], n: +a[2], pay: +a[3] });
    else {
      const x = byTag(a[1]);
      if (!x) return null;
      Object.assign(deal, { obj: x.id, unit: x.unit });
      if (deal.kind === 'hire') deal.each = Math.round(U(x.unit).cost * C.hire);
      else Object.assign(deal, { gold: +a[2], res: a[3], n: +a[4] });
      H.Adv.reveal(S, pid, x.l, x.c, x.r, C.sight);
    }
    dealsOf(S, pid).push(deal);
    S.ver++;
    return deal;
  };
  const dropDeal = (S, pid, id) => {
    const p = S.players[pid];
    p.deals = p.deals.filter(d => d.id !== id);
    S.ver++;
  };
  const finish = (S, pid, d, gain, ev) => {
    const p = S.players[pid];
    for (const [k, v] of Object.entries(gain)) p.res[k] += v;
    p.deals = p.deals.filter(x => x !== d);
    p.dealsDone = (p.dealsDone || 0) + 1;
    S.ver++;
    ev.push({ t: 'dealDone', player: pid, kind: d.kind, res: gain });
  };

  const canDeliver = (S, o, d) => d.kind === 'supply' && d.town === o.id && !!H.Town.visitor(S, o) && S.players[o.owner].res[d.res] >= d.n;
  const deliver = (S, o, id) => {
    const d = dealsOf(S, o.owner).find(x => x.id === id), ev = [];
    if (!d || !canDeliver(S, o, d)) return { ok: false, why: 'Нужен герой в городе и весь груз', ev };
    S.players[o.owner].res[d.res] -= d.n;
    finish(S, o.owner, d, { gold: d.pay }, ev);
    return { ok: true, ev };
  };

  const dealOn = (S, pid, id) => dealsOf(S, pid).find(d => d.obj === id) || null;
  const hireDeal = (S, hero, o) => {
    const d = dealOn(S, hero.owner, o.id);
    return d && d.kind === 'hire' && hero.faction === 'league' ? d : null;
  };
  const hirePrice = (hero, d, o) => Math.round(o.count * d.each * (H.Hero.hasTalent(hero, 'league-1') ? C.recruiter : 1));
  const hired = (S, pid, id, ev) => {
    const d = dealsOf(S, pid).find(x => x.id === id);
    if (d) finish(S, pid, d, {}, ev);
  };
  const won = (S, pid, ref, ev) => {
    const d = dealsOf(S, pid).find(x => x.kind === 'bounty' && (ref.obj != null ? x.obj === ref.obj : x.hero === ref.hero));
    if (d) finish(S, pid, d, { gold: d.gold, [d.res]: d.n }, ev);
  };

  const sweep = (S, ev) => {
    for (const p of S.players) {
      if (!p.deals.length) continue;
      p.deals = p.deals.filter(d => {
        const town = H.Town.byId(S, d.town), ok = targetOk(S, d) && !!town && town.owner === p.id && S.day <= d.until;
        if (!ok) ev.push({ t: 'dealLost', player: p.id, kind: d.kind, late: S.day > d.until });
        return ok;
      });
    }
  };

  const sideOf = (o, x) => {
    const a = Math.atan2(x.r - o.r, x.c - o.c);
    return SIDES[Math.round((a + Math.PI * 2) / (Math.PI / 4)) % 8];
  };
  const whereText = (o, x) => (x.c === o.c && x.r === o.r ? 'у города' : sideOf(o, x) + ', ' + Math.round(Math.hypot(x.c - o.c, x.r - o.r)) + ' ' + H.plural(Math.round(Math.hypot(x.c - o.c, x.r - o.r)), 'клетка', 'клетки', 'клеток'));
  const rewardText = d => {
    if (d.kind === 'supply') return d.pay + ' золота';
    if (d.kind === 'hire') return 'по ' + d.each + ' золота за каждого';
    return d.gold + ' золота, ' + NAMES[d.res].toLowerCase() + ' ×' + d.n;
  };
  const describe = (S, d) => {
    const o = H.Town.byId(S, d.town);
    if (d.kind === 'supply') return { title: TITLE.supply, lines: ['Привезти в ' + o.name + ': ' + NAMES[d.res].toLowerCase() + ' ×' + d.n + '.', 'Сдаёт герой в городе.'], reward: rewardText(d) };
    if (d.hero != null) {
      const h = S.heroes[d.hero];
      return { title: TITLE.bounty, lines: ['Победить героя ' + h.name + ' (' + H.PLAYER_NAMES[S.players[h.owner].color] + ' игрок).'], reward: rewardText(d) };
    }
    const x = H.Adv.obj(S, d.obj), place = x ? whereText(o, x) : 'неизвестно где', name = U(d.unit).name;
    if (d.kind === 'hire') return { title: TITLE.hire, lines: [name + ': ' + place + '.', 'Пойдут к герою Лиги без боя.'], reward: rewardText(d) };
    return { title: TITLE.bounty, lines: ['Разбить отряд: ' + name + '.', 'Он стоит ' + place + '.'], reward: rewardText(d) };
  };
  const target = (S, d) => {
    if (d.obj != null) return H.Adv.obj(S, d.obj);
    return d.hero != null ? S.heroes[d.hero] : null;
  };

  H.Contracts = { desk, board, take, grant, dropDeal, canDeliver, deliver, dealOn, hireDeal, hirePrice, hired, won, sweep, describe, rewardText, target, TITLE };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
