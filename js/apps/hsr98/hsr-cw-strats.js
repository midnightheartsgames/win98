(function (H) {
  'use strict';
  const CW = H.CW, TUN = CW.TUN;
  const { alive } = H.battleStat;
  const GP = H.Game.prototype, BP = H.Battle.prototype;
  const rnd = run => CW.rnd(run);
  const pick = (run, arr) => arr[Math.floor(rnd(run) * arr.length)];
  const Q_NAME = { s: 'Серебро', g: 'Золото', p: 'Призма' };
  const Q_ODDS = [[0.5, 0.4, 0.1], [0.35, 0.45, 0.2], [0.25, 0.45, 0.3]];
  const Q_DIFF = { s: [0, 0], g: [1, 3], p: [3, 6] };
  const EMBLEM_BONDS = Object.keys(CW.ITEMS).filter(k => CW.ITEMS[k].kind === 'emblem' && CW.ITEMS[k].from && CW.ITEMS[k].from !== 'trash').map(k => CW.ITEMS[k].bond);
  const DIFF_HP = 0.02, DIFF_ATK = 0.01;

  const gold = (run, n) => { run.gold += n; run.earned += Math.max(0, n); };
  const free = (run, n) => { run.free += n; };
  const pay = (rec, n, why) => { if (!n) return; rec.bondGold += n; rec.coins += n; rec.bondLines.push(why + ': +' + n); };
  const membersOf = k => CW.POOL.filter(id => CW.UNITS[id].bonds.includes(k));

  function giveHero(g, run, id, star) {
    if (!id) return null;
    const need = Math.pow(3, (star || 1) - 1);
    if ((star || 1) <= 1) {
      if (!(run.pool[id] > 0) || !g.cwRoomFor(run, id)) { gold(run, CW.UNITS[id].cost); return null; }
      return g.cwGive(run, id);
    }
    const at = CW.benchFree(run);
    if (run.pool[id] < need || at < 0) { gold(run, CW.UNITS[id].cost * need); return null; }
    run.pool[id] -= need;
    const u = { uid: ++run.uid, id, star };
    run.board.bench[at] = u;
    return { u, merged: g.cwMerge(run) };
  }
  const giveCost = (g, run, cost, star) => giveHero(g, run, g.cwDraw(run, cost), star);
  const giveMember = (g, run, k, star) => { const ids = membersOf(k).filter(id => run.pool[id] > 0); return ids.length ? giveHero(g, run, pick(run, ids), star) : null; };
  const items = (g, run, id, n) => { for (let i = 0; i < (n || 1); i++) g.cwGift(run, id); };
  const advRec = id => { const r = CW.REC[id]; return r ? r.on.concat(r.off).find(x => CW.ITEMS[x] && CW.ITEMS[x].kind === 'adv') : null; };
  const pv = (arr, P) => arr[Math.min(arr.length - 1, P)];

  const STRATS = {
    cutCost: { q: 'p', pl: [1], name: 'Сокращение расходов и увеличение доходов', text: '+10 монет, предел процентов 9. Если в узле не потрачено ни монеты, проценты максимальные.', take(g, run) { gold(run, 10); run.interestCap = Math.max(run.interestCap || 0, 9); } },
    rateUp: { q: 'p', pl: [1], name: 'Повышение процентной ставки', text: '+25 монет, предел процентов 10.', take(g, run) { gold(run, 25); run.interestCap = Math.max(run.interestCap || 0, 10); } },
    buyout: { q: 'p', pl: [1], name: 'Скупка', text: 'Процентов больше нет. +15 монет, +4 опыта в каждом узле.', take(g, run) { gold(run, 15); run.interestCap = 0; run.noInterest = true; }, node(g, run) { g.cwAddExp(run, 4); } },
    capital: { q: 'p', pl: [2, 3], name: 'Достаточный капитал+', text: '+26 (в изм. 3 +45) монет. Больше 50 монет в начале узла: 1 бесплатное обновление за каждые лишние 10, до 3.', take(g, run, P) { gold(run, P >= 2 ? 45 : 26); }, node(g, run) { if (run.gold > 50) free(run, Math.min(3, Math.floor((run.gold - 50) / 10))); } },
    career: { q: 'p', pl: [1], name: 'Карьерный рост', text: 'Каждый новый уровень даёт 2★ героя стоимостью «уровень − 4» (не меньше 1) и 1 монету.', level(g, run) { giveCost(g, run, Math.max(1, Math.min(5, run.lvl - 4)), 2); gold(run, 1); } },
    kmmFav: { q: 'p', pl: [1], name: 'Избранное КММ', text: 'Сейчас и в начале каждого измерения магазин из 5 разных героев стоимости 4, +3 монеты.', take(g, run) { g.cwShopOfCost(run, 4); gold(run, 3); }, plane(g, run) { g.cwShopOfCost(run, 4); gold(run, 3); } },
    timely: { q: 'p', pl: [3], name: 'Своевременная помощь', text: '3 героя 2★ стоимости 4, «Идеальный проектор», 4 бесплатных обновления.', take(g, run) { for (let i = 0; i < 3; i++) giveCost(g, run, 4, 2); items(g, run, 'pprojector'); free(run, 4); } },
    ace: { q: 'p', pl: [2], name: 'Туз в рукаве', text: 'Когда НР команды должны дойти до 0: урон отменяется, НР 40, +30 опыта, +80 монет.' },
    scale: { q: 'p', pl: [2, 3], name: 'Контроль масштаба', text: 'Наибольший уровень 7, «Самоцвет богатства», +40 монет.', take(g, run) { run.lvlCap = 7; if (run.lvl > 7) run.lvl = 7; run.exp = Math.min(run.exp, g.cwNeed(run)); items(g, run, 'gem'); gold(run, 40); } },
    insurance: { q: 'p', pl: [3], name: 'Страхование межзвёздного мира', text: 'Монеты по числу потерянных НР команды. +10 НР после каждого боя.', take(g, run) { gold(run, Math.max(0, run.hpMax - run.hp)); }, after(g, run) { run.hp = Math.min(run.hpMax, run.hp + 10); } },
    wantAll: { q: 'p', pl: [1], name: 'Хочу всё: Призма', text: 'В снабжении на 2 варианта меньше, но остальные варианты тоже ваши.' },
    distinction: { q: 'p', pl: [1, 2, 3], name: 'Отличие', text: 'У героя с 3 предметами один предмет на бой становится особым.' },
    fusion: { q: 'p', pl: [1, 2, 3], name: 'Призыв к слиянию', text: 'Два одинаковых продвинутых предмета на герое сливаются в особый. «Ящик с простым вооружением».', take(g, run) { items(g, run, 'armsBox'); g.cwFuseItems(run); } },
    bondPower: { q: 'p', pl: [1, 2, 3], name: 'Сила связи', text: '+5% урона и +3% понижения урона за каждую включённую связь фракции и направления.' },
    roleModel: { q: 'p', pl: [1, 2, 3], name: 'Ролевая модель: Призма', text: 'Лучший по урону герой прошлого боя получает +70% обеих сил, остальные после атаки добавляют чистый урон 1% его накопленного урона.' },
    arrows: { q: 'p', pl: [2, 3], name: 'Град стрел', text: 'В начале боя ветряные стрелы: число = звёзды отряда + 8, каждая 1600% базового урона.' },
    pinpoint: { q: 'p', pl: [1, 2, 3], name: 'Точечный подрыв', text: 'В начале каждой волны 999 999% базового урона по врагу с наибольшим НР (по боссу не больше 50% НР).' },
    peppyCameo: { q: 'p', pl: [1, 2], name: 'Камео Пеппи', text: 'Пеппи приходит в отряд. За каждую идеальную победу он надевает продвинутый предмет. Через 5 узлов Арлан уводит его и оставляет предметы (если Арлан выставлен, Пеппи остаётся).', take(g, run) { g.cwSpecial(run).cameo = { until: run.step + 5, gear: [] }; } },
    peppyArrive: { q: 'p', pl: [1], name: 'Прибытие Пеппи', text: 'Пеппи с 3 постоянными эмблемами, +8 монет.', take(g, run) { const sp = g.cwSpecial(run), have = new Set(sp.peppy.map(x => CW.ITEMS[x.id].bond)); const pool = Object.keys(CW.ITEMS).filter(k => CW.ITEMS[k].kind === 'emblem' && !have.has(CW.ITEMS[k].bond)); sp.peppyPerm = 3; for (let i = 0; i < 3 && pool.length; i++) { const id = pool.splice(Math.floor(rnd(run) * pool.length), 1)[0]; sp.peppy.push({ uid: ++run.iuid, id, sp: false, perm: true }); } gold(run, 8); } },
    moonFlash: { q: 'p', pl: [1, 2, 3], name: 'Вспышка: Отражение луны', text: 'Открывает связь «Наставник и ученик», даёт Цзинлю.', take(g, run) { giveHero(g, run, 'jingliu', 1); } },
    swordFlash: { q: 'p', pl: [1, 2, 3], name: 'Вспышка: Фамильный меч', text: 'Открывает связь «Наставник и ученик», даёт Яньцина.', take(g, run) { giveHero(g, run, 'yanqing', 1); } },
    hertaShow: { q: 'p', pl: [1, 2], name: 'Кукольный театр Герты', text: 'Сейчас и в начале каждого измерения 2 Герты 1★. Каждая 3★ Герта даёт «Космическим учёным» +1 кошку-пирожное.', take(g, run) { giveHero(g, run, 'herta', 1); giveHero(g, run, 'herta', 1); }, plane(g, run) { giveHero(g, run, 'herta', 1); giveHero(g, run, 'herta', 1); } },
    midnight: { q: 'p', pl: [1], name: 'Полночный прогноз', text: 'Видны враги трёх следующих узлов. +1 бесплатное обновление в каждом узле. Если выставлена Рисе, видны и узлы следующего измерения.', node(g, run) { free(run, 1); } },

    regular: { q: 'g', pl: [1], name: 'Регулярные бонусы', text: '+4 монеты сейчас, +2 в каждом узле.', take(g, run) { gold(run, 4); }, node(g, run) { gold(run, 2); } },
    refuel: { q: 'g', pl: [1], name: 'Заправка', text: 'Сейчас и в каждом узле: 1 бесплатное обновление и 8 монет.', take(g, run) { free(run, 1); gold(run, 8); }, node(g, run) { free(run, 1); gold(run, 8); } },
    pistol: { q: 'g', pl: [1, 2], name: 'Пистолет в руке+', text: '1 (в изм. 2 два) простых предмета сейчас, по 1 после каждого босса.', take(g, run, P) { items(g, run, 'basic', P >= 1 ? 2 : 1); }, after(g, run, rec) { if (rec.kind === 'boss') items(g, run, 'basic'); } },
    copyS: { q: 'g', pl: [1, 2], name: 'Мелкое копирование+', text: '2 «Проектора сотрудника» и 7 (в изм. 2 13) монет.', take(g, run, P) { items(g, run, 'projector', 2); gold(run, P >= 1 ? 13 : 7); } },
    deferred: { q: 'g', pl: [1, 2, 3], name: 'Отложенный доход', text: 'После 100 индекса действия в бою урон отряда +40%.' },
    market: { q: 'g', pl: [1], name: 'Рыночная активность', text: 'В магазине могут быть 2★ герои стоимости 1–2, чаще с уровнем.' },
    prismFut: { q: 'g', pl: [1, 2], name: 'Призматические фьючерсы+', text: 'Через 5 (в изм. 2 через 4) узлов выбор призматической стратегии без обновлений.', take(g, run, P) { g.cwStratQueue(run, 'p', 0, run.step + (P >= 1 ? 4 : 5)); } },
    longterm: { q: 'g', pl: [2, 3], name: 'Лонгтермизм+', text: 'Сейчас и в 3 следующих узлах по 7 (в изм. 3 по 9) монет.', take(g, run, P, st) { st.v = P >= 2 ? 9 : 7; st.left = 3; gold(run, st.v); }, node(g, run, st) { if (st.left > 0) { st.left--; gold(run, st.v); } } },
    stubborn: { q: 'g', pl: [1, 2], name: 'Упрямство', text: 'Поражение стоит на 5 НР больше, но серия сохраняется. +6 монет.', take(g, run) { gold(run, 6); }, after(g, run, rec, st, f) { if (rec.win) return; run.streak = f.streak0 || 0; run.hp = Math.max(0, run.hp - 5); rec.hpLoss += 5; } },
    fixedInv: { q: 'g', pl: [1, 2], name: 'Фиксированные инвестиции+', text: 'Сейчас и в начале каждого измерения 4 (6) опыта и 2 (3) бесплатных обновления.', take(g, run, P, st) { st.big = P >= 1; g.cwAddExp(run, st.big ? 6 : 4); free(run, st.big ? 3 : 2); }, plane(g, run, st) { g.cwAddExp(run, st.big ? 6 : 4); free(run, st.big ? 3 : 2); } },
    massCut: { q: 'g', pl: [2], name: 'Массовое сокращение', text: 'Продаёт всех героев поля и зоны подготовки за двойную цену. 6 бесплатных обновлений.', take(g, run) { for (const z of ['on', 'bench']) run.board[z].forEach((u, i) => { if (!u) return; gold(run, CW.sellValue(u) * 2); run.pool[u.id] += Math.pow(3, u.star - 1); for (const it of u.items || []) g.cwInv(run).push(it); run.board[z][i] = null; }); g.cwSpecialSold(run); free(run, 6); } },
    hyper: { q: 'g', pl: [2], name: 'Гиперинфляция', text: 'Забирает все монеты, через 5 узлов возвращает их и ещё 70.', take(g, run, P, st) { st.amt = run.gold; st.due = run.step + 5; run.gold = 0; }, node(g, run, st) { if (st.due != null && run.step >= st.due) { gold(run, st.amt + 70); st.due = null; } } },
    surplus: { q: 'g', pl: [1], name: 'Прибавочная стоимость', text: 'После боя +1 монета за каждые 30 оставшегося отсчёта, до 4.', after(g, run, rec, st, f) { if (f.left != null && rec.win) pay(rec, Math.min(4, Math.floor(f.left / 30)), 'Прибавочная стоимость'); } },
    costCtrl: { q: 'g', pl: [2], name: 'Контроль затрат', text: 'После боя +1 НР команды за каждые 10 оставшегося отсчёта, до 8. Сейчас +8 монет, +15 НР и наибольшего НР.', take(g, run) { gold(run, 8); run.hpMax += 15; run.hp += 15; }, after(g, run, rec, st, f) { if (f.left != null && rec.win) run.hp = Math.min(run.hpMax, run.hp + Math.min(8, Math.floor(f.left / 10))); } },
    top500: { q: 'g', pl: [1], name: 'ТОП-500', text: 'Первый герой, чья сила в бою дошла до 500, приносит 30 монет. Сейчас «Перочинный нож» и «Пистолет мира».', take(g, run) { items(g, run, 'knife'); items(g, run, 'pistol'); }, after(g, run, rec, st, f) { if (!st.done && f.so && f.so.top500) { st.done = true; pay(rec, 30, 'ТОП-500'); } } },
    bigHire: { q: 'g', pl: [3], name: 'Масштабный набор', text: 'Тратит монеты: за каждые 4 приходит случайный герой стоимости 4, до 40 монет. «Идеальный проектор», +16 монет.', take(g, run) { const n = Math.floor(Math.min(40, run.gold) / 4); run.gold -= n * 4; run.spent += n * 4; for (let i = 0; i < n; i++) giveCost(g, run, 4, 1); items(g, run, 'pprojector'); gold(run, 16); } },
    silverInv: { q: 'g', pl: [1, 2], name: 'Серебряные инвестиции', text: 'Сразу выбор серебряной стратегии с 3 обновлениями.', take(g, run) { g.cwStratQueue(run, 's', 3, run.step); } },
    expert: { q: 'g', pl: [2, 3], name: 'Наём эксперта+', text: '2 «Контракта стоимостью 5» и 4 (12) монеты.', take(g, run, P) { items(g, run, 'contract5', 2); gold(run, P >= 2 ? 12 : 4); } },
    twins: { q: 'g', pl: [2], name: 'Числа-близнецы', text: 'Первая покупка героя каждой стоимости даёт 2 / 3 / 5 / 7 / 11 опыта.', buy(g, run, id, st) { const c = CW.UNITS[id].cost; st.got = st.got || {}; if (!st.got[c]) { st.got[c] = true; g.cwAddExp(run, [2, 3, 5, 7, 11][c - 1]); } } },
    starMove: { q: 'g', pl: [2, 3], name: 'Движение звёзд', text: 'В начале боя случайный выставленный герой стоимости 1 становится 3★ на этот бой.' },
    promo4: { q: 'g', pl: [3], name: 'Продвижение за 4', text: 'Следующий купленный герой стоимости 4 сразу 2★. +12 монет.', take(g, run, P, st) { gold(run, 12); st.wait = true; }, buy(g, run, id, st, res) { if (!st.wait || CW.UNITS[id].cost !== 4 || !res || !res.u || res.u.star !== 1 || run.pool[id] < 2) return; st.wait = false; run.pool[id] -= 2; res.u.star = 2; res.merged = (res.merged || []).concat({ id, star: 2 }, g.cwMerge(run)); } },
    mineShift: { q: 'g', pl: [1, 2], name: 'Смена в шахте', text: '«Подземье» добывает на 3 геомарроу больше за бой. Если связь не включена, 1 монета за каждого героя Подземья на доске после боя.', after(g, run, rec, st, f) { if (rec.kind === 'reward') return; if (f.tiers && f.tiers.underworld != null) { run.bond.geo += 3; rec.geo = (rec.geo || 0) + 3; } else pay(rec, g.cwUnits(run).filter(x => CW.UNITS[x.u.id].bonds.includes('underworld')).length, 'Смена в шахте'); } },
    cabbage: { q: 'g', pl: [1], name: 'Капустная страда', text: '4 узла подряд после каждого боя 30% шанса на 2 монеты. Если в отряде Казума, шанс 60%.', take(g, run, P, st) { st.left = 4; }, after(g, run, rec, st) { if (!(st.left > 0)) return; st.left--; const k = g.cwDeployed(run).some(u => u.id === 'kazuma') ? 0.6 : 0.3; if (rnd(run) < k) pay(rec, 2, 'Капустная страда'); } },

    specFund: { q: 's', pl: [1, 2], name: 'Фонд спецопераций+', text: '+7 (в изм. 2 +11) монет при входе в узел босса.', take(g, run, P, st) { st.v = P >= 1 ? 11 : 7; }, node(g, run, st) { if (g.cwNodeKind(run) === 'boss') gold(run, st.v || 7); } },
    expBurst: { q: 's', pl: [1], name: 'Всплеск опыта', text: '+10 опыта.', take(g, run) { g.cwAddExp(run, 10); } },
    freeLunch: { q: 's', pl: [2, 3], name: 'Бесплатный обед', text: '11 бесплатных обновлений.', take(g, run) { free(run, 11); } },
    reinf2: { q: 's', pl: [1], name: 'Подкрепление: 2 стоимости', text: '4 случайных героя стоимости 2.', take(g, run) { for (let i = 0; i < 4; i++) giveCost(g, run, 2, 1); } },
    reinf3: { q: 's', pl: [2], name: 'Подкрепление: 3 стоимости', text: '4 случайных героя стоимости 3.', take(g, run) { for (let i = 0; i < 4; i++) giveCost(g, run, 3, 1); } },
    reinf4: { q: 's', pl: [3], name: 'Подкрепление: 4 стоимости', text: '4 случайных героя стоимости 4.', take(g, run) { for (let i = 0; i < 4; i++) giveCost(g, run, 4, 1); } },
    deposit: { q: 's', pl: [1], name: 'Возврат депозита', text: 'Если в прошлом узле не потрачено ни монеты, 2 бесплатных обновления.', node(g, run) { if (run.noSpendLast) free(run, 2); } },
    lastPay: { q: 's', pl: [1, 2], name: 'Последний платёж', text: 'После последнего снабжения измерения +30 монет.' },
    talent: { q: 's', pl: [1, 2], name: 'Поиск талантов+', text: 'После снабжения ещё один невыбранный герой со своим предметом. В изм. 2 ещё простой предмет и 4 монеты.', take(g, run, P, st) { st.big = P >= 1; } },
    winwin: { q: 's', pl: [1], name: 'Победа за победой', text: 'Серия побед сразу 4, +4 монеты.', take(g, run) { run.streak = Math.max(run.streak, 4); gold(run, 4); } },
    hope: { q: 's', pl: [2, 3], name: 'Надежда команды', text: 'Герой на первом месте поля получает +15% урона и +15% НР.' },
    goldFut: { q: 's', pl: [1, 2], name: 'Фьючерсы на золото+', text: 'Через 5 (4) узлов выбор золотой стратегии без обновлений.', take(g, run, P) { g.cwStratQueue(run, 'g', 0, run.step + (P >= 1 ? 4 : 5)); } },
    armsTrade: { q: 's', pl: [1, 2], name: 'Торговля оружием+', text: '«Ящик с простым вооружением» и 4 (8) монеты.', take(g, run, P) { items(g, run, 'armsBox'); gold(run, P >= 1 ? 8 : 4); } },
    warBreeds: { q: 's', pl: [1], name: 'Война порождает войну', text: 'После боя во встрече «Ящик с простым вооружением» и 6 монет.', after(g, run, rec) { if (rec.kind === 'enc') { items(g, run, 'armsBox'); pay(rec, 6, 'Война порождает войну'); } } },
    growth: { q: 's', pl: [1, 2], name: 'Фонд роста', text: '40 монет на 9-м уровне.', take(g, run, P, st) { if (run.lvl >= 9) { st.done = true; gold(run, 40); } }, level(g, run, st) { if (!st.done && run.lvl >= 9) { st.done = true; gold(run, 40); } } },
    jobs: { q: 's', pl: [1], name: 'Экономия рабочих мест', text: '3 узла в зоне подготовки только 3 места, потом 3 простых предмета.', take(g, run, P, st) { run.benchCap = 3; st.due = run.step + 3; }, node(g, run, st) { if (st.due != null && run.step >= st.due) { st.due = null; run.benchCap = null; items(g, run, 'basic', 3); } } },
    minimum: { q: 's', pl: [1], name: 'Абсолютный минимум', text: '3 узла нельзя покупать героев и обновлять магазин, потом +20 монет.', take(g, run, P, st) { run.noBuy = run.step + 3; st.due = run.step + 3; }, node(g, run, st) { if (st.due != null && run.step >= st.due) { st.due = null; run.noBuy = null; gold(run, 20); } } },
    restore: { q: 's', pl: [3], name: 'Восстановление жизни', text: '+40 НР команды после финального босса.', after(g, run, rec) { if (rec.kind === 'boss' && run.plane === CW.MODES[run.mode].planes.length - 1) run.hp = Math.min(run.hpMax + 40, run.hp + 40); } },
    expand: { q: 's', pl: [1], name: 'Расширение команды', text: '2 героя стоимости 1, 2 стоимости 2 и 1 стоимости 3.', take(g, run) { for (const c of [1, 1, 2, 2, 3]) giveCost(g, run, c, 1); } },
    quartz: { q: 's', pl: [1], name: 'Треснувший кварц: Серебро', text: 'Поверженный враг с шансом 20% роняет кристальную руду.', after(g, run, rec, st, f) { const ores = (f.kills || []).filter(() => rnd(run) < 0.2).map(() => 'ore1'); if (ores.length) rec.ores = (rec.ores || []).concat(g.cwOpenOres(run, ores)); } },
    noDamage: { q: 's', pl: [1], name: 'Прохождение без урона', text: 'Если в бою не было «О гибели», +1 монета. Сейчас «Цветок жизни».', take(g, run) { items(g, run, 'flower'); }, after(g, run, rec, st, f) { if (!f.near && rec.kind !== 'reward') pay(rec, 1, 'Без урона'); } },
    healthUp: { q: 's', pl: [2, 3], name: 'Пополнение здоровья', text: '+30 НР команды и наибольшего НР.', take(g, run) { run.hpMax += 30; run.hp += 30; } },
    easy: { q: 's', pl: [1, 2, 3], name: 'Простой режим', text: 'Сложность врагов −3.', take(g, run) { run.diffPlus = (run.diffPlus || 0) - 3; } },
    luckSpray: { q: 's', pl: [1, 2, 3], name: 'Спрей удачи', text: 'Урон счастливого удара отряда +25%.' },
    junk: { q: 's', pl: [1, 2], name: 'Безвредный мусор', text: '«Мусорный мешок» и 8 монет.', take(g, run) { items(g, run, 'trash'); gold(run, 8); } },
    expWealth: { q: 's', pl: [1], name: 'Опыт - это богатство', text: 'Опыт из всех источников, кроме покупки, приходит монетами. +4 монеты.', take(g, run) { gold(run, 4); } },
    contonFee: { q: 's', pl: [1, 2, 3], name: 'Гонорар Кон-Тона', text: 'Каждый «Выход на бис» связи «Кон-Тон» приносит 2 монеты, до 6 за бой.', after(g, run, rec, st, f) { if (f.so && f.so.encores) pay(rec, Math.min(6, f.so.encores * 2), 'Гонорар Кон-Тона'); } }
  };

  for (const k of EMBLEM_BONDS) {
    const name = CW.BOND_NAMES[k];
    STRATS['set_' + k] = {
      q: 'p', pl: [1, 2, 3], name: 'Набор эмблем «' + name + '»', bond: k,
      text: k === 'underworld' ? 'Эмблема «Подземья», Хук и «Кровожадность».' : 'Эмблема связи «' + name + '», её герой и подходящий продвинутый предмет.',
      take(g, run) {
        items(g, run, 'em_' + k);
        if (k === 'underworld') { giveHero(g, run, 'hook', 1); items(g, run, 'bloodlust'); return; }
        const got = giveMember(g, run, k, 1), adv = got && got.u ? advRec(got.u.id) : null;
        items(g, run, adv || pick(run, CW.ADV));
      }
    };
    STRATS['em_' + k] = { q: 'g', pl: [1, 2, 3], name: 'Эмблема «' + name + '»', bond: k, text: 'Эмблема и герой связи «' + name + '».', take(g, run) { items(g, run, 'em_' + k); giveMember(g, run, k, 1); } };
  }

  const on = (run, id) => !!run && (run.strats || []).some(s => s.id === id);
  const stOf = (run, id) => { run.stratSt = run.stratSt || {}; return run.stratSt[id] || (run.stratSt[id] = {}); };
  const each = (run, hook, fn) => { for (const s of (run.strats || []).slice()) { const S = STRATS[s.id]; if (S && S[hook]) fn(S, stOf(run, s.id), s); } };

  Object.assign(GP, {
    cwStratOn(run, id) { return on(run, id); },

    cwStratQueue(run, q, rolls, due) { (run.stratQ = run.stratQ || []).push({ q, rolls: rolls == null ? 0 : rolls, due: due == null ? run.step : due }); this.cwStratOpen(run); },

    cwStratRollQ(run) {
      const o = Q_ODDS[Math.min(2, run.plane)];
      let r = rnd(run);
      return r < o[0] ? 's' : r < o[0] + o[1] ? 'g' : 'p';
    },

    cwStratPool(run, q, skip) {
      const P = run.plane + 1, have = new Set((run.strats || []).map(s => s.id));
      return Object.keys(STRATS).filter(id => STRATS[id].q === q && STRATS[id].pl.includes(P) && !have.has(id) && !(skip || []).includes(id));
    },

    cwStratDeal(run, q, n, skip) {
      const pool = this.cwStratPool(run, q, skip), out = [];
      const fam = id => (STRATS[id].bond ? id.split('_')[0] : id);
      while (out.length < n && pool.length) {
        const id = pool.splice(Math.floor(rnd(run) * pool.length), 1)[0];
        if (STRATS[id].bond && out.some(x => fam(x) === fam(id))) continue;
        out.push(id);
      }
      const seen = (this.cw().seen.strats = this.cw().seen.strats || {});
      for (const id of out) seen[id] = seen[id] || 1;
      return out;
    },

    cwStratOpen(run) {
      if (!run || run.stratPick || run.phase !== 'prep') return;
      const Q = run.stratQ || [], i = Q.findIndex(x => run.step >= x.due);
      if (i < 0) return;
      const job = Q.splice(i, 1)[0];
      if (this.cwEnvOn && this.cwEnvOn(run, 'tricolor')) {
        const qs = ['s', 'g', 'p'], opts = [];
        for (const q of qs) opts.push(this.cwStratDeal(run, q, 1, opts)[0]);
        run.stratPick = { q: job.q, qs, opts, rolls: opts.map(() => Math.max(job.rolls + 2, this.cwPerkOn && this.cwPerkOn('stratRoll') ? 1 : 0)) };
        return;
      }
      const opts = this.cwStratDeal(run, job.q, 3);
      if (!opts.length) return;
      run.stratPick = { q: job.q, opts, rolls: opts.map(() => Math.max(job.rolls, this.cwPerkOn && this.cwPerkOn('stratRoll') ? 1 : 0)) };
    },

    cwStratReroll(i) {
      const run = this.cwRun(), pk = run && run.stratPick;
      if (!pk || !pk.opts[i]) return 'empty';
      if (!(pk.rolls[i] > 0)) return 'rolls';
      const next = this.cwStratDeal(run, pk.qs ? pk.qs[i] : pk.q, 1, pk.opts);
      if (!next.length) return 'empty';
      pk.opts[i] = next[0];
      pk.rolls[i]--;
      return null;
    },

    cwTakeStrat(i) {
      const run = this.cwRun(), pk = run && run.stratPick;
      if (!pk || !pk.opts[i]) return 'empty';
      const id = pk.opts[i], S = STRATS[id], P = run.plane, q = pk.qs ? pk.qs[i] : pk.q;
      run.stratPick = null;
      (run.strats = run.strats || []).push({ id, q, plane: P, at: run.step });
      const T = run.tier >= 7 ? 1 : 0;
      run.diffPlus = (run.diffPlus || 0) + Q_DIFF[q][T];
      const seen = (this.cw().seen.strats = this.cw().seen.strats || {});
      seen[id] = 2;
      const st = stOf(run, id);
      if (S.take) S.take(this, run, P, st);
      if (S.buy || S.level) st.on = true;
      this.cwStratOpen(run);
      return { id };
    },

    cwShopOfCost(run, cost) {
      const out = [];
      for (let n = 0; out.length < TUN.shopSize && n < 40; n++) { const id = this.cwDraw(run, cost); if (!id) break; if (!out.includes(id)) out.push(id); }
      while (out.length < TUN.shopSize) out.push(this.cwDraw(run, Math.max(1, cost - 1)));
      run.shop = out;
      run.shopStar = out.map(() => 1);
      run.lock = false;
    },

    cwShopPrice(run, i) { const id = run.shop[i]; return id ? CW.UNITS[id].cost * ((run.shopStar && run.shopStar[i] === 2) ? 3 : 1) : 0; },

    cwFuseItems(run) {
      for (const x of this.cwUnits(run)) {
        const its = x.u.items || [];
        for (let a = 0; a < its.length; a++) for (let b = a + 1; b < its.length; b++) {
          if (its[a].id !== its[b].id || its[a].sp || its[b].sp || CW.ITEMS[its[a].id].kind !== 'adv') continue;
          its[a].sp = true;
          its.splice(b, 1);
          return this.cwFuseItems(run);
        }
      }
    },

    cwForecast(run) {
      if (!on(run, 'midnight')) return null;
      const out = [];
      for (let i = run.node + 1; i < run.nodes.length && out.length < 3; i++) { const k = run.nodes[i], o = run.nodeOpp[i] && CW.OPPONENTS[run.nodeOpp[i]]; out.push({ i, kind: k, opp: o ? o.short : null }); }
      return out;
    }
  });

  const begin0 = GP.cwBeginNode;
  GP.cwBeginNode = function (run) {
    const r = begin0.call(this, run);
    run.noSpendLast = run.spentAt != null && run.spent === run.spentAt;
    run.spentAt = run.spent;
    if (run.node === 0 && run.step > 0) each(run, 'plane', (S, st) => S.plane(this, run, st));
    each(run, 'node', (S, st) => S.node(this, run, st));
    this.cwStratOpen(run);
    return r;
  };

  const interest0 = GP.cwInterest;
  GP.cwInterest = function (g0, run) {
    if (run && run.noInterest) return 0;
    if (run && on(run, 'cutCost') && run.spentAt != null && run.spent === run.spentAt) return run.interestCap || TUN.interestCap;
    return interest0.call(this, g0, run);
  };

  const addExp0 = GP.cwAddExp;
  GP.cwAddExp = function (run, n) {
    if (n > 0 && !this.cwExpBuying && on(run, 'expWealth')) { gold(run, n); return 0; }
    const ups = addExp0.call(this, run, n);
    for (let i = 0; i < ups; i++) each(run, 'level', (S, st) => S.level(this, run, st));
    return ups;
  };

  const buyExp0 = GP.cwBuyExp;
  GP.cwBuyExp = function () { this.cwExpBuying = true; try { return buyExp0.call(this); } finally { this.cwExpBuying = false; } };

  const roll0 = GP.cwRollShop;
  GP.cwRollShop = function (run) {
    roll0.call(this, run);
    const p2 = on(run, 'market') ? 0.04 + 0.02 * run.lvl : 0;
    run.shopStar = run.shop.map(id => (id && p2 && CW.UNITS[id].cost <= 2 && run.pool[id] >= 3 && rnd(run) < p2 ? 2 : 1));
  };

  const canBuy0 = GP.cwCanBuy;
  GP.cwCanBuy = function (i) {
    const run = this.cwRun();
    if (run && run.noBuy != null && run.step < run.noBuy && run.shop[i]) return 'locked';
    const r = canBuy0.call(this, i);
    if (r || !run) return r;
    if (run.shopStar && run.shopStar[i] === 2) { if (run.gold < this.cwShopPrice(run, i)) return 'gold'; if (run.pool[run.shop[i]] < 3 || CW.benchFree(run) < 0) return 'bench'; }
    return null;
  };

  const buy0 = GP.cwBuy;
  GP.cwBuy = function (i) {
    const run = this.cwRun();
    if (this.cwCanBuy(i)) return null;
    const id = run.shop[i];
    let res;
    if (run.shopStar && run.shopStar[i] === 2) {
      const price = this.cwShopPrice(run, i);
      run.gold -= price; run.spent += price; run.shop[i] = null; run.shopStar[i] = 1; run.pool[id] -= 3;
      const u = { uid: ++run.uid, id, star: 2 };
      run.board.bench[CW.benchFree(run)] = u;
      res = { u, merged: this.cwMerge(run) };
    } else { res = buy0.call(this, i); if (run.shopStar) run.shopStar[i] = 1; }
    if (res) each(run, 'buy', (S, st) => S.buy(this, run, id, st, res));
    return res;
  };

  const refresh0 = GP.cwRefresh;
  GP.cwRefresh = function () {
    const run = this.cwRun();
    if (run && run.noBuy != null && run.step < run.noBuy) return false;
    return refresh0.call(this);
  };

  const move0 = GP.cwMove;
  GP.cwMove = function (fz, fi, tz, ti) {
    const run = this.cwRun();
    if (run && run.benchCap && tz === 'bench' && ti >= run.benchCap) return 'locked';
    return move0.call(this, fz, fi, tz, ti);
  };

  const equip0 = GP.cwEquip;
  GP.cwEquip = function (i, zone, slot) {
    const r = equip0.call(this, i, zone, slot), run = this.cwRun();
    if (!r && run && on(run, 'fusion')) this.cwFuseItems(run);
    return r;
  };

  const offer0 = GP.cwOffer;
  GP.cwOffer = function (run) {
    const out = offer0.call(this, run);
    return on(run, 'wantAll') && out.length > 1 ? out.slice(0, Math.max(1, out.length - 2)) : out;
  };

  const takeOffer0 = GP.cwTakeOffer;
  GP.cwTakeOffer = function (i) {
    const run = this.cwRun();
    if (!run || run.phase !== 'supply' || !run.offer) return takeOffer0.call(this, i);
    const offer = run.offer.slice(), gear = (run.offerItems || []).slice(), last = run.node === run.nodes.lastIndexOf('supply');
    const r = takeOffer0.call(this, i);
    if (!r || r.full) return r;
    const rest = offer.map((id, j) => ({ id, j })).filter(x => x.j !== i && x.id);
    if (on(run, 'wantAll')) for (const x of rest) { giveHero(this, run, x.id, 1); if (gear[x.j]) this.cwInvAdd(run, gear[x.j]); }
    else if (on(run, 'talent') && rest.length) {
      const x = rest[Math.floor(rnd(run) * rest.length)];
      giveHero(this, run, x.id, 1);
      if (gear[x.j]) this.cwInvAdd(run, gear[x.j]);
      if (stOf(run, 'talent').big) { items(this, run, 'basic'); gold(run, 4); }
    }
    if (last && on(run, 'lastPay')) gold(run, 30);
    return r;
  };

  const skip0 = GP.cwSkipOffer;
  GP.cwSkipOffer = function () {
    const run = this.cwRun(), last = run && run.node === run.nodes.lastIndexOf('supply');
    const r = skip0.call(this);
    if (r && last && on(run, 'lastPay')) gold(run, 30);
    return r;
  };

  const fight0 = GP.cwFight;
  GP.cwFight = function (branch) {
    const run = this.cwRun(), streak = run ? run.streak : 0;
    const b = fight0.call(this, branch);
    if (b && run && run.fight) run.fight.streak0 = streak;
    return b;
  };

  const mods0 = GP.cwFoeMods;
  GP.cwFoeMods = function (run, kind, branch) {
    const m = mods0.call(this, run, kind, branch), d = run.diffPlus || 0;
    if (d) { m.hp *= Math.max(0.1, 1 + d * DIFF_HP); m.atk *= Math.max(0.1, 1 + d * DIFF_ATK); }
    return m;
  };

  const compile0 = GP.cwCompile;
  GP.cwCompile = function (run, kind) {
    const temp = [];
    if (on(run, 'starMove')) {
      const ones = this.cwDeployed(run).filter(u => CW.UNITS[u.id].cost === 1);
      if (ones.length) { const u = pick(run, ones); temp.push([u, 'star', u.star]); u.star = 3; }
    }
    if (on(run, 'distinction')) for (const u of this.cwDeployed(run)) {
      const its = u.items || [];
      if (its.length < 3) continue;
      const it = its.find(x => !x.sp && CW.ITEMS[x.id].kind === 'adv');
      if (it) { temp.push([it, 'sp', false]); it.sp = true; }
    }
    let cw;
    try { cw = compile0.call(this, run, kind); } finally { for (const [o, k, v] of temp) o[k] = v; }
    const ids = (run.strats || []).map(s => s.id);
    const bondN = Object.entries(cw.tiers).filter(([k]) => CW.BONDS[k] && CW.BONDS[k].kind !== 'special').length;
    cw.strat = { ids, bondN, roleTop: on(run, 'roleModel') ? stOf(run, 'roleModel').top || null : null, hope: on(run, 'hope') && run.board.on[0] ? run.board.on[0].uid : null };
    if (cw.strat.hope) { const p = cw.party.find(x => x.cw === cw.strat.hope); if (p) { p.stats.hp = Math.round(p.stats.hp * 1.15); p.hp = p.stats.hp; } }
    if (on(run, 'hertaShow') && cw.tiers.scholars != null) cw.cats += this.cwOwned(run, 'herta').filter(u => u.star >= 3).length;
    return cw;
  };

  const rewards0 = GP.cwBondRewards;
  GP.cwBondRewards = function (run, rec) {
    rewards0.call(this, run, rec);
    const f = run.fight || {};
    if (on(run, 'peppyCameo')) {
      const cm = this.cwSpecial(run).cameo;
      if (cm && rec.win && !f.near && rec.kind !== 'reward') { cm.gear.push({ uid: ++run.iuid, id: pick(run, CW.ADV), sp: false }); rec.bondLines.push('Пеппи надел предмет'); }
    }
    each(run, 'after', (S, st) => S.after(this, run, rec, st, f));
    if (rec.strat && rec.kind !== 'reward') this.cwStratQueue(run, this.cwStratRollQ(run), 0, run.step + 1);
    if (on(run, 'roleModel') && f.so && f.so.top) stOf(run, 'roleModel').top = f.so.top;
  };

  const finish0 = GP.cwFinish;
  GP.cwFinish = function (run, rec) {
    if (run.hp <= 0 && on(run, 'ace') && !stOf(run, 'ace').used) {
      stOf(run, 'ace').used = true;
      run.hp = 40;
      run.hpMax = Math.max(run.hpMax, 40);
      gold(run, 80);
      this.cwAddExp(run, 30);
      rec.ace = true;
    }
    return finish0.call(this, run, rec);
  };

  const end0 = GP.cwEndBattle;
  GP.cwEndBattle = function (b, ctx, out) {
    const run = this.cw().run, I = b.cwInfo;
    if (run && run.fight && I) {
      const top = Object.entries(I.dmg || {}).sort((a, c) => c[1] - a[1])[0];
      run.fight.so = { top500: !!I.top500, encores: I.encores || 0, top: top ? +top[0] : null };
    }
    return end0.call(this, b, ctx, out);
  };

  const advance0 = GP.cwAdvance;
  GP.cwAdvance = function (run) {
    const sp = this.cwSpecial(run), cm = sp.cameo;
    advance0.call(this, run);
    if (cm && run.step >= cm.until && !this.cwDeployed(run).some(u => u.id === 'arlan')) { for (const it of cm.gear) this.cwInv(run).push(it); sp.cameo = null; }
  };

  const slots0 = GP.cwPeppySlots;
  GP.cwPeppySlots = function (run) { return Math.max(slots0.call(this, run), this.cwSpecial(run).peppyPerm || 0); };

  const st = b => b.cw && b.cw.strat;
  const has = (b, id) => !!(st(b) && st(b).ids.includes(id));

  Object.assign(BP, {
    cwStratStart() {
      const I = this.cwInfo, S = st(this);
      if (!S) return;
      if (S.bondN && has(this, 'bondPower')) for (const a of this.allies) a.buffs.push({ s: 'dr', v: 0.03 * S.bondN, turns: 999, perm: true, name: 'Сила связи' });
      if (I.units.some(u => this.cwPow(u) * 100 >= 500)) I.top500 = true;
      if (has(this, 'arrows')) {
        const n = I.units.reduce((a, u) => a + (u.cwU.star || 1), 0) + 8, src = this.livingAllies[0];
        if (src) {
          this.push({ t: 'act', u: src, name: 'Град стрел × ' + n, kind: 'follow' });
          for (let i = 0; i < n && this.living.length; i++) this.hit(src, this.rng.pick(this.living), 0, { raw: this.cw.base * 16, e: 'wind', label: 'Град стрел' });
        }
      }
      this.cwStratWave(this.enemies);
    },

    cwStratWave(list) {
      if (!has(this, 'pinpoint')) return;
      const t = list.filter(alive).sort((a, b) => b.hp - a.hp)[0], src = this.livingAllies[0];
      if (!t || !src) return;
      const big = t.data.boss ? t.maxHp * 0.5 : Infinity;
      this.push({ t: 'act', u: src, name: 'Точечный подрыв', kind: 'follow' });
      this.hit(src, t, 0, { raw: Math.min(big, this.cw.base * 9999.99), e: 'fire', label: 'Точечный подрыв' });
    },

    cwStratAmp(w) {
      const S = st(this), I = this.cwInfo;
      if (!S) return 0;
      let a = 0;
      if (has(this, 'bondPower')) a += 0.05 * S.bondN;
      if (has(this, 'deferred') && I.t >= 100) a += 0.4;
      if (S.hope && w.cwU && w.cwU.uid === S.hope && !w.summon) a += 0.15;
      return a;
    }
  });

  const kitsStart0 = BP.cwKitsStart;
  BP.cwKitsStart = function () { kitsStart0.call(this); this.cwStratStart(); };

  const kitsWave0 = BP.cwKitsWave;
  BP.cwKitsWave = function (list) { kitsWave0.call(this, list); this.cwStratWave(list); };

  const kitsAmp0 = BP.cwKitsAmp;
  BP.cwKitsAmp = function (w, tgt, o) {
    const r = kitsAmp0.call(this, w, tgt, o), x = this.cwStratAmp(w);
    return x ? (1 + r) * (1 + x) - 1 : r;
  };

  const kitsPow0 = BP.cwKitsPow;
  BP.cwKitsPow = function (w) {
    const S = st(this);
    return kitsPow0.call(this, w) + (S && S.roleTop && w.cwU && w.cwU.uid === S.roleTop ? 0.7 : 0);
  };

  const kitsLucky0 = BP.cwKitsLucky;
  BP.cwKitsLucky = function (w) {
    const r = kitsLucky0.call(this, w);
    if (has(this, 'luckSpray')) r.dmg += 0.25;
    return r;
  };

  const kitsAfter0 = BP.cwKitsAfter;
  BP.cwKitsAfter = function (u, kind) {
    kitsAfter0.call(this, u, kind);
    const S = st(this), I = this.cwInfo;
    if (!S || !S.roleTop || !u || !u.cwU || u.cwU.uid === S.roleTop || this.over || !['basic', 'skill', 'ult', 'enhanced', 'follow'].includes(kind)) return;
    const v = ((I.dmg || {})[S.roleTop] || 0) * 0.01, t = this.cwLastTarget() || this.rng.pick(this.living);
    if (v >= 1 && t) this.hit(u, t, 0, { raw: v, label: 'Ролевая модель' });
  };

  CW.STRATS = STRATS;
  CW.STRAT_Q = Q_NAME;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
