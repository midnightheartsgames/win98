(function (H) {
  'use strict';
  const MP = H.MAP;
  const mine = (name, res, foot) => ({ name, kind: 'mine', res, flag: true, sight: MP.mineSight, foot: foot || [3, 2], entry: [1, foot ? foot[1] - 1 : 1] });
  const pile = (name, res, amount) => ({ name, kind: 'pile', res, foot: [1, 1], entry: [0, 0], amount });
  const site = (name, kind, foot, extra) => Object.assign({ name, kind, foot, entry: [Math.floor(foot[0] / 2), foot[1] - 1] }, extra || {});
  const vault = (name, foot, guard, gold, res, arts, unit) => site(name, 'vault', foot, { guard, gold, res, arts, unit, worth: 0 });

  H.OBJ = {
    goldmine: mine('Золотой прииск', 'gold'),
    sawmill: mine('Лесопилка', 'wood'),
    oremine: mine('Рудник', 'ore'),
    saltworks: mine('Солеварня', 'salt'),
    ambermine: mine('Янтарная копь', 'amber'),
    sulfurspring: mine('Серный ключ', 'sulfur', [2, 2]),
    moonrift: mine('Лунный разлом', 'moonsilver'),
    oldmine: mine('Заброшенная шахта', null),
    'res-gold': pile('Куча золота', 'gold', [500, 1000]),
    'res-wood': pile('Брёвна', 'wood', [5, 10]),
    'res-ore': pile('Руда', 'ore', [5, 10]),
    'res-salt': pile('Соль', 'salt', [3, 6]),
    'res-amber': pile('Янтарь', 'amber', [3, 6]),
    'res-sulfur': pile('Сера', 'sulfur', [3, 6]),
    'res-moonsilver': pile('Лунное серебро', 'moonsilver', [3, 6]),
    moonshard: pile('Лунный осколок', 'moonsilver', [1, 2]),
    chest: { name: 'Сундук', kind: 'chest', foot: [1, 1], entry: [0, 0], offers: [[1000, 500], [1500, 1000], [2000, 1500]] },
    campfire: { name: 'Костёр', kind: 'campfire', foot: [1, 1], entry: [0, 0], gold: [400, 600], res: [4, 6] },
    artifact: { name: 'Артефакт', kind: 'artifact', foot: [1, 1], entry: [0, 0] },
    scroll: { name: 'Свиток', kind: 'scroll', foot: [1, 1], entry: [0, 0] },
    wagon: site('Брошенная повозка', 'loot', [2, 1], { about: 'Кто-то бросил поклажу', worth: 1500, loot: [{ res: { wood: 5, ore: 5 } }, { gold: 750 }, { art: 'plain' }] }),
    wreck: site('Обломки на берегу', 'loot', [2, 1], { about: 'Море вынесло доски и груз', worth: 2200, loot: [{ res: { wood: 8 } }, { gold: 500 }, { art: 'plain' }] }),
    barrel: site('Бочка в воде', 'loot', [1, 1], { about: 'Можно поднять с корабля', worth: 1800, loot: [{ gold: 300 }, { res: { salt: 2 } }, { res: { sulfur: 2 } }, { res: { amber: 2 } }] }),
    traveler: site('Вещи путника', 'loot', [1, 1], { about: 'Хозяин за ними уже не придёт', worth: 2500, loot: [{ art: 'plain' }] }),
    windmill: site('Ветряная мельница', 'weekly', [3, 3], { about: 'Раз в неделю ресурс', worth: 2400, give: { pick: [['wood', 5], ['ore', 5], ['salt', 3], ['amber', 3], ['sulfur', 3]] } }),
    watermill: site('Водяная мельница', 'weekly', [3, 2], { about: 'Раз в неделю 1000 золота', worth: 2200, give: { gold: 1000 } }),
    apiary: site('Пасека', 'weekly', [2, 2], { about: 'Раз в неделю 500 золота и мораль +1 до боя', worth: 1800, give: { gold: 500, fresh: { morale: 1 } } }),
    well: site('Колодец', 'weekly', [1, 1], { about: 'Раз в неделю мана до предела', worth: 1500, give: { mana: true } }),
    stable: site('Конюшня', 'weekly', [3, 2], { about: 'Раз в неделю +3 шага в день до конца недели', worth: 1600, give: { steps: 3 } }),
    crystalgrotto: site('Кристальный грот', 'weekly', [3, 2], { about: 'Раз в неделю 1 Лунное серебро', worth: 800, give: { res: { moonsilver: 1 } } }),
    atkstone: site('Камень натиска', 'growth', [2, 2], { about: '+1 Натиск, каждому герою раз', worth: 2500, gain: { atk: 1 } }),
    ancestorshield: site('Щит предков', 'growth', [2, 2], { about: '+1 Стойкость, каждому герою раз', worth: 2500, gain: { def: 1 } }),
    charmspring: site('Источник чар', 'growth', [2, 2], { about: '+1 Чары, каждому герою раз', worth: 2500, gain: { power: 1 } }),
    sagescroll: site('Свиток мудреца', 'growth', [2, 2], { about: '+1 Мудрость, каждому герою раз', worth: 2500, gain: { wis: 1 } }),
    knowledgetree: site('Древо познания', 'knowledge', [3, 3], { about: 'Новый уровень за плату, каждому герою раз', worth: 3500 }),
    witchhut: site('Хижина ведуна', 'witchhut', [2, 2], { about: 'Учит навыку, каждому герою раз', worth: 3000 }),
    camp: site('Учебный лагерь', 'growth', [3, 2], { about: '1000 опыта, каждому герою раз', worth: 2500, gain: { xp: 1000 } }),
    arena: site('Арена', 'arena', [3, 3], { about: '+2 Натиска или Стойкости на выбор, каждому герою раз', worth: 4500 }),
    shrine1: { name: 'Святилище 1 круга', kind: 'shrine', circle: 1, foot: [2, 2], entry: [0, 1] },
    shrine2: { name: 'Святилище 2 круга', kind: 'shrine', circle: 2, foot: [2, 2], entry: [0, 1] },
    shrine3: { name: 'Святилище 3 круга', kind: 'shrine', circle: 3, foot: [2, 2], entry: [0, 1] },
    weekaltar: site('Алтарь недели', 'weekaltar', [2, 2], { about: 'Школа луны недели на ступень выше до конца недели', worth: 1200 }),
    library: site('Библиотека', 'library', [3, 2], { about: 'Все заклинания 1 и 2 кругов героям с 10 уровня', worth: 5000 }),
    chapel: site('Часовня', 'blessing', [2, 2], { about: 'Мораль +1 до боя', worth: 1400, fresh: { morale: 1 } }),
    luckspring: site('Родник удачи', 'blessing', [2, 1], { about: 'Удача +1 до боя', worth: 1400, fresh: { luck: 1 } }),
    idol: site('Идол', 'blessing', [1, 1], { about: 'Удача +2 до конца недели', worth: 1700, week: { luck: 2 } }),
    graveyard: site('Погост', 'graveyard', [3, 2], { about: 'Раскопать: артефакт и мораль −1 до конца недели', worth: 2000 }),
    portal1: site('Портал в одну сторону', 'portal', [2, 2], { about: 'Переносит и не возвращает' }),
    portal2: site('Портал в обе стороны', 'portal', [2, 2], { about: 'Переносит туда и обратно' }),
    moongate: site('Лунные врата', 'moongate', [3, 2], { about: 'Открыты в неделю своей луны и в Схождение' }),
    ferry: site('Паром', 'portal', [2, 1], { about: 'Перевозит на другой берег' }),
    stairsdown: site('Спуск в Подлунье', 'portal', [2, 2], { about: 'Ведёт вниз' }),
    stairsup: site('Ход наверх', 'portal', [2, 2], { about: 'Ведёт на поверхность' }),
    shipyard: site('Верфь', 'shipyard', [3, 3], { about: 'Корабль за 1000 золота и 10 древесины', flag: true, sight: MP.mineSight }),
    boat: site('Лодка', 'boat', [1, 1], { about: 'На ней герой идёт по воде' }),
    whirlpool: site('Водоворот', 'whirlpool', [2, 2], { about: 'Переносит к другому водовороту и забирает десятую часть самого большого отряда' }),
    watchtower: site('Дозорная башня', 'lookout', [2, 2], { about: 'Открывает круг 15 клеток', worth: 2400, radius: 15 }),
    observatory: site('Обсерватория', 'observatory', [3, 3], { about: 'Владельцу круг 20 клеток и календарь на 8 недель', flag: true, sight: 20, worth: 2500 }),
    cartographer: site('Картограф', 'cartographer', [2, 2], { about: 'Продаёт карту поверхности, Подлунья или вод', worth: 3000 }),
    market: site('Рынок', 'marketplace', [3, 2], { about: 'Обмен ресурсов', worth: 2600 }),
    fair: site('Ярмарка', 'fair', [3, 2], { about: 'Новый артефакт каждую неделю', worth: 2600 }),
    blackmarket: site('Чёрный рынок', 'blackmarket', [2, 2], { about: 'Три артефакта втридорога', worth: 1500 }),
    inn: site('Придорожная таверна', 'inn', [3, 2], { about: 'Герои и слухи', worth: 2600 }),
    mercenarycamp: site('Наёмничий лагерь', 'dwelling', [3, 2], { about: 'Наём раз в неделю', unit: 'mercenaries' }),
    changeforge: site('Кузня перемен', 'changeforge', [2, 2], { about: 'Переводит отряд в другую ветвь за плату', worth: 2600 }),
    outpost: site('Застава', 'outpost', [2, 1], { about: 'Держит проход, в ней стоит гарнизон владельца', flag: true, sight: MP.mineSight, held: true, pass: true, worth: 3000 }),
    prison: site('Острог', 'prison', [3, 2], { about: 'В остроге сидит герой', worth: 9000 }),
    sealer: site('Печатник', 'sealer', [2, 2], { about: 'Выдаёт печать своего цвета', worth: 2500 }),
    sealgate: site('Застава печати', 'sealgate', [1, 1], { about: 'Пропускает с печатью своего цвета', gate: true }),
    petitioner: site('Хижина просителя', 'quest', [2, 2], { about: 'Просит об услуге и платит за неё' }),
    questgate: site('Ворота задания', 'questgate', [1, 1], { about: 'Открываются после задания', gate: true }),
    signstone: site('Камень с надписью', 'lore', [1, 1], { about: 'Надпись стёрта' }),
    boundstone: site('Межевой камень', 'quest', [2, 2], { about: 'Просит то, что записано в Грамоте' }),
    hamlet: site('Село', 'hamlet', [2, 2], { about: 'Живут люди. Есть что взять, если не жалко' }),
    wagonruin: vault('Разорённый обоз', [3, 2], [['bandits', 30], ['mercenaries', 10]], 1500, { wood: 5 }, [null, null, 'plain', 'rare']),
    wolfden: vault('Волчье логово', [3, 2], [['wolves', 30], ['boars', 8]], 1000, {}, [null, 'plain', 'plain', 'rare'], ['wolves', 6]),
    eaglenest: vault('Гнездо орлов', [2, 3], [['mountaineagles', 12]], 2000, {}, ['plain', 'plain', 'rare', 'rare']),
    wildhive: vault('Дикий улей', [2, 2], [['bees', 60]], 1000, { amber: 3 }, [null, null, 'plain', 'plain']),
    sunkentemple: vault('Затонувший храм', [3, 3], [['pirates', 12], ['seaserpent', 3]], 3000, { salt: 4 }, ['plain', 'rare', 'rare', 'relic']),
    khancrypt: vault('Склеп ханов', [3, 2], [['blackspirit', 4], ['shade', 30]], 4000, { salt: 4 }, ['plain', 'rare', 'rare', 'relic']),
    piratecove: vault('Пиратская бухта', [3, 3], [['pirates', 20]], 3500, { wood: 8 }, [null, 'plain', 'rare', 'rare']),
    trollcave: vault('Пещера троллей', [3, 2], [['bridgetroll', 5]], 2000, { ore: 10 }, [null, 'plain', 'rare', 'rare']),
    giantforge: vault('Кузня великанов', [3, 3], [['stonegiant', 3]], 3000, { ore: 8, sulfur: 3 }, ['plain', 'rare', 'rare', 'relic']),
    moonmine: vault('Лунный рудник', [3, 2], [['moondream', 3]], 2000, { moonsilver: 5 }, [null, 'plain', 'rare', 'rare']),
    ruinedobservatory: vault('Руина обсерватории', [3, 3], [['silverspirit', 4], ['goldspirit', 3]], 3000, { moonsilver: 2 }, ['rare', 'rare', 'relic', 'relic']),
    thronetreasury: vault('Сокровищница Престола', [3, 3], [['ancientlizard', 1], ['moondream', 4]], 10000, { moonsilver: 5 }, ['rare', 'relic', 'relic', 'relic']),
    whiteruin: site('Белая руина', 'ruin', [3, 2], { about: 'Флаг даёт в неделю 250 золота, Престолу 1 Лунное серебро', flag: true, sight: MP.mineSight, worth: 2500 }),
    menhir: site('Менгир', 'menhir', [1, 2], { about: 'Указывает направление к Сердцу', worth: 4000 }),
    digspot: { name: 'Ямка', kind: 'decor', foot: [1, 1], entry: null, flat: true },
    heartstone: site('Сердце Восьмой луны', 'heartstone', [1, 1], { about: 'Камень, который светит без неба', worth: 30000 }),
    fungalring: site('Грибной круг', 'lore', [2, 2], { about: 'Узел грибницы. Для других народов просто круг грибов' }),
    witchring: site('Ведьмин круг', 'witchring', [2, 2], { flag: true, about: 'Кольцо Чащи. Для других народов просто вытоптанная трава' }),
    kurganstone: site('Курганный камень', 'barrowstone', [2, 2], { about: 'Раз в неделю герой Курганов поднимает здесь павших, которым некуда уйти. Другие видят только камень' }),
    monster: { name: 'Отряд', kind: 'monster', foot: [1, 1], entry: null },
    town: { name: 'Город', kind: 'town', foot: [5, 3], entry: [2, 2], flag: true, held: true },
    tree: { name: 'Дерево', kind: 'decor', foot: [1, 1], entry: null },
    pine: { name: 'Ель', kind: 'decor', foot: [1, 1], entry: null },
    rock: { name: 'Камень', kind: 'decor', foot: [1, 1], entry: null },
    mountain: { name: 'Гора', kind: 'decor', foot: [3, 2], entry: null }
  };

  for (const f of Object.values(H.FACTIONS)) {
    for (const row of f.units) H.OBJ['dwell-' + row[0]] = site('Жилище: ' + H.UNITS[row[0]].name, 'dwelling', H.UNITS[row[0]].tier >= 5 ? [3, 2] : [2, 2], { unit: row[0], flag: true, sight: MP.mineSight, about: 'Прирост каждую неделю, копится две недели' });
  }
  for (const [id, u] of Object.entries(H.UNITS)) {
    if (u.faction === 'neutral') H.OBJ['dwell-' + id] = site('Жилище: ' + u.name, 'dwelling', u.tier >= 5 ? [3, 2] : [2, 2], { unit: id, flag: true, sight: MP.mineSight, about: 'Прирост каждую неделю, копится две недели' });
  }

  H.SEAL_COLORS = [['Алая', '#d84a2a'], ['Лазурная', '#3a8ad0'], ['Зелёная', '#4aa83a'], ['Золотая', '#e8c040'], ['Серебряная', '#b8c8e0'], ['Чёрная', '#3a3648'], ['Белая', '#f0f0e0'], ['Лиловая', '#a060c0']];
  H.mineRes = o => o.res || H.OBJ[o.t].res;

  const VAULT_SCALE = [1, 1.5, 2.2, 3.2];
  const ART_PRICE = { plain: 2500, rare: 6000, relic: 11000 };
  const artPrice = id => H.ARTIFACTS[id].cost;
  const BLACK_PRICE = 1.5;
  const FORGE_SHARE = 0.2;
  const OBSERVE_WEEKS = 8;
  const MAP_PRICE = { surface: 2000, under: 3000, waters: 1500 };
  const span = (S, [lo, hi]) => lo + Math.floor(H.roll(S) * (hi - lo + 1));
  const RARE = ['wood', 'ore', 'salt', 'amber', 'sulfur', 'moonsilver'];
  const NOTE = '#ffe080';
  const BAD = '#ff9080';
  const MD = () => H.MapData;
  const note = (ev, text, color) => ev.push({ t: 'note', text, color: color || NOTE });
  const resOf = (S, hero) => S.players[hero.owner].res;
  const weekOf = S => H.Moons.weekOf(S);
  const names = () => Object.fromEntries(H.RESOURCES);

  const randomSpell = (S, circle) => {
    const pool = Object.values(H.SPELLS).filter(s => s.circle === circle);
    return pool[Math.floor(H.roll(S) * pool.length)].id;
  };
  const rollArt = (S, rank) => {
    const pool = Object.values(H.ARTIFACTS).filter(a => a.rank === rank && !a.scroll && a.slot !== 'scroll');
    return pool[Math.floor(H.roll(S) * pool.length)].id;
  };
  const addRes = (S, hero, res) => {
    const own = resOf(S, hero);
    for (const [k, v] of Object.entries(res)) own[k] += v;
  };
  const stringOfRes = res => Object.entries(res).map(([k, v]) => '+' + v + ' ' + names()[k].toLowerCase()).join(', ');
  const ask = (S, hero, o, site, title, lines, options, ai, extra, ev) => {
    S.pending = Object.assign({ kind: 'choice', site, hero: hero.id, obj: o.id, title, lines, options, ai }, extra || {});
    ev.push({ t: 'pending', kind: 'choice' });
  };
  const flagIt = (S, hero, o, ev) => {
    if (o.owner === hero.owner || H.Adv.allied(S, o.owner, hero.owner)) return false;
    o.owner = hero.owner;
    S.ver++;
    ev.push({ t: 'capture', obj: o.id, res: H.mineRes(o) });
    return true;
  };
  const once = (o, id) => {
    o.seen = o.seen || [];
    if (o.seen.includes(id)) return false;
    o.seen.push(id);
    return true;
  };
  const seen = (o, id) => !!o.seen && o.seen.includes(id);
  const ringShare = hero => (H.Hero.hasTalent(hero, 'thicket-5') ? H.HERO.ring.short : H.HERO.ring.share);
  const ringCost = (S, hero) => Math.ceil(H.Adv.daySteps(S, hero) * ringShare(hero));
  const ringsOf = (S, pid) => S.map.objs.filter(o => !o.gone && o.owner === pid && (o.t === 'witchring' || (o.t === 'town' && H.Town.hasRing(o))));
  const ringWhy = (S, hero) => {
    if (hero.faction !== 'thicket') return 'Кольца слушают только Чащу';
    if (hero.ringDay === S.day) return 'Сегодня кольцо уже водило этого героя';
    const cost = ringCost(S, hero);
    return hero.steps < cost ? 'Не хватает очков хода: нужно ' + cost : '';
  };
  const ringHere = (S, hero) => ringsOf(S, hero.owner).find(o => {
    const e = MD().entry(o);
    return o.l === hero.l && e[0] === hero.c && e[1] === hero.r;
  }) || null;
  const ringTargets = (S, hero, from) => ringsOf(S, hero.owner).filter(o => o !== from && !H.Adv.heroAt(S, o.l, MD().entry(o)[0], MD().entry(o)[1])).sort((a, b) => Math.hypot(b.c - hero.c, b.r - hero.r) - Math.hypot(a.c - hero.c, a.r - hero.r)).slice(0, H.HERO.ring.show);
  const ringName = (S, o) => {
    if (o.t === 'town') return o.name;
    const north = o.r < S.map.h / 2, west = o.c < S.map.w / 2;
    return 'Круг на ' + (north ? 'северо-' : 'юго-') + (west ? 'западе' : 'востоке');
  };
  const jump = (S, hero, to, ev) => {
    const [c, r] = MD().entry(to);
    if (H.Adv.heroAt(S, to.l, c, r)) {
      note(ev, 'Выход занят', BAD);
      return false;
    }
    hero.l = to.l;
    hero.c = c;
    hero.r = r;
    H.Adv.reveal(S, hero.owner, to.l, c, r, H.Hero.sight(S, hero));
    S.ver++;
    ev.push({ t: 'teleport', hero: hero.id });
    return true;
  };
  const backTo = (S, hero, from) => {
    if (!from) return;
    hero.c = from[0];
    hero.r = from[1];
    H.Adv.reboard(S, hero);
    S.ver++;
  };
  const objAt = (S, id) => S.map.objs.find(x => x.id === id) || null;
  const ringJump = (S, hero, to, ev) => {
    const why = ringWhy(S, hero);
    if (why) {
      note(ev, why, BAD);
      return false;
    }
    const cost = ringCost(S, hero);
    if (!jump(S, hero, to, ev)) return false;
    hero.steps -= cost;
    hero.ringDay = S.day;
    return true;
  };

  const dest = (S, o) => {
    const def = H.OBJ[o.t];
    if (def.kind === 'portal') return o.link != null ? objAt(S, o.link) : null;
    if (def.kind === 'moongate') {
      const ring = S.map.objs.filter(x => x.t === 'moongate' && x.moon === o.moon).sort((a, b) => a.id - b.id);
      return ring.length > 1 ? ring[(ring.indexOf(o) + 1) % ring.length] : null;
    }
    if (def.kind === 'whirlpool') {
      if (o.link != null) return objAt(S, o.link);
      const rest = S.map.objs.filter(x => x.t === 'whirlpool' && !x.gone && x !== o && x.l === o.l).sort((a, b) => a.id - b.id);
      return rest.length ? rest[0] : null;
    }
    return null;
  };
  const gateOpen = (S, o) => !S.moons || H.Moons.is(S, o.moon) || H.Moons.is(S, 'convergence');

  const openFor = (S, o, pid) => {
    const def = H.OBJ[o.t];
    if (def.gate) return o.t === 'sealgate' ? S.players[pid].seals.includes(o.color) : (o.done || []).includes(pid);
    return !!def.pass && o.owner === pid;
  };

  const questText = q => {
    if (q.kind === 'art') return 'Принести: ' + H.ARTIFACTS[q.art].name;
    if (q.kind === 'rank') return 'Принести: ' + H.ART_RANKS[q.rank][0] + ' предмет' + (q.slot ? ' (' + H.ART_SLOTS.find(x => x[0] === q.slot)[1].toLowerCase() + ')' : '');
    if (q.kind === 'res') return 'Принести: ' + Object.entries(q.res).map(([k, v]) => v + ' ' + names()[k].toLowerCase()).join(', ');
    if (q.kind === 'army') return 'Привести: ' + H.UNITS[q.unit].name + ', ' + q.count;
    if (q.kind === 'kill') return 'Разбить отряд, что стоит неподалёку';
    return 'Победить вражеских героев: ' + q.count;
  };
  const artRef = (hero, id) => {
    for (const [slot, x] of Object.entries(hero.arts)) if (x === id) return { slot };
    const i = hero.bag.indexOf(id);
    return i >= 0 ? { bag: i } : null;
  };
  const rankRef = (hero, q) => {
    const fits = id => !!id && !!H.ARTIFACTS[id] && H.ARTIFACTS[id].rank === q.rank && (!q.slot || H.ARTIFACTS[id].slot === q.slot);
    const i = hero.bag.findIndex(fits);
    if (i >= 0) return { bag: i };
    const worn = Object.entries(hero.arts).find(([, id]) => fits(id));
    return worn ? { slot: worn[0] } : null;
  };
  const questReady = (S, hero, q) => {
    if (q.kind === 'art') return !!artRef(hero, q.art);
    if (q.kind === 'rank') return !!rankRef(hero, q);
    if (q.kind === 'res') return H.Town.afford(resOf(S, hero), q.res);
    if (q.kind === 'army') {
      const n = hero.army.reduce((t, s) => t + (s && s.unit === q.unit ? s.count : 0), 0), other = hero.army.some(s => s && s.unit !== q.unit);
      return other ? n >= q.count : n > q.count;
    }
    if (q.kind === 'kill') {
      const t = objAt(S, q.obj);
      return !t || !!t.gone;
    }
    return (S.players[hero.owner].kills || 0) >= q.count;
  };
  const questPay = (S, hero, q) => {
    if (q.kind === 'art' || q.kind === 'rank') {
      const ref = q.kind === 'art' ? artRef(hero, q.art) : rankRef(hero, q);
      if (ref.slot) hero.arts[ref.slot] = null;
      else hero.bag.splice(ref.bag, 1);
    } else if (q.kind === 'res') for (const [k, v] of Object.entries(q.res)) resOf(S, hero)[k] -= v;
    else if (q.kind === 'army') {
      let left = q.count;
      hero.army.forEach((s, i) => {
        if (!s || s.unit !== q.unit || !left) return;
        const n = Math.min(left, s.count);
        left -= n;
        hero.army[i] = s.count > n ? Object.assign({}, s, { count: s.count - n }) : null;
      });
    }
  };
  const rewardText = r => [r.gold ? r.gold + ' золота' : '', r.xp ? r.xp + ' опыта' : '', r.res ? stringOfRes(r.res).replace(/\+/g, '') : '', r.art ? H.ARTIFACTS[r.art].name : ''].filter(Boolean).join(', ');
  const giveReward = (S, hero, r, ev) => {
    if (r.gold) resOf(S, hero).gold += r.gold;
    if (r.res) addRes(S, hero, r.res);
    if (r.xp) H.Hero.addXp(hero, r.xp);
    if (r.art && H.Hero.giveArt(hero, r.art)) ev.push({ t: 'artifact', hero: hero.id, art: r.art });
    if (r.gold || r.xp || r.res) ev.push({ t: 'gain', hero: hero.id, res: Object.assign(r.gold ? { gold: r.gold } : {}, r.res || {}), xp: r.xp || 0 });
  };

  const vaultGuards = o => {
    const T = H.OBJ[o.t], rows = o.left || T.guard.map(([unit, n]) => ({ unit, count: Math.max(1, Math.round(n * VAULT_SCALE[o.tier || 0])) }));
    const k = rows.length >= 3 ? 1 : rows.length === 2 ? 2 : 4, out = [];
    for (const row of rows) {
      const n = Math.min(k, row.count);
      for (let i = 0; i < n; i++) out.push({ unit: row.unit, count: Math.floor(row.count / n) + (i < row.count % n ? 1 : 0) });
    }
    return out;
  };
  const vaultPrize = o => {
    const T = H.OBJ[o.t], k = VAULT_SCALE[o.tier || 0];
    return { gold: Math.round(T.gold * k / 50) * 50, res: Object.fromEntries(Object.entries(T.res).map(([id, v]) => [id, Math.round(v * k)])), rank: T.arts[o.tier || 0], unit: T.unit ? [T.unit[0], Math.round(T.unit[1] * k)] : null };
  };
  const vaultValue = o => {
    const p = vaultPrize(o), price = Object.assign({ gold: 1 }, H.TOWN.value);
    return p.gold + Object.entries(p.res).reduce((t, [k, v]) => t + v * price[k], 0) + (p.rank ? ART_PRICE[p.rank] : 0) + (p.unit ? p.unit[1] * H.UNITS[p.unit[0]].cost : 0);
  };
  const vaultWon = (S, hero, o, ev) => {
    const p = vaultPrize(o);
    o.looted = true;
    o.left = null;
    S.ver++;
    giveReward(S, hero, { gold: p.gold, res: p.res }, ev);
    if (p.rank) {
      const art = rollArt(S, p.rank);
      if (H.Hero.giveArt(hero, art)) ev.push({ t: 'artifact', hero: hero.id, art });
    }
    if (p.unit) {
      const slot = H.Hero.slotFor(hero.army, p.unit[0]);
      if (slot >= 0) {
        H.Hero.addTo(hero.army, slot, { unit: p.unit[0], count: p.unit[1] });
        ev.push({ t: 'joined', hero: hero.id, unit: p.unit[0], count: p.unit[1], price: 0 });
      }
    }
  };
  const vaultLost = (o, B, from) => {
    const left = new Map();
    for (const s of B.stacks.slice(from)) if (s.side === 1 && s.count > 0 && !s.summoned) left.set(s.unit, (left.get(s.unit) || 0) + s.count);
    o.left = [...left].map(([unit, count]) => ({ unit, count }));
  };
  const mercOffer = (S, hero, o, ev) => {
    const u = H.UNITS[o.unit], n = Math.max(1, Math.round((o.start || o.count) * u.hireAfter)), cost = n * u.cost, slot = H.Hero.slotFor(hero.army, o.unit), res = resOf(S, hero);
    if (S.pending || !u.hireAfter || slot < 0 || res.gold < cost) return;
    S.pending = { kind: 'choice', site: 'merc', hero: hero.id, obj: null, unit: o.unit, count: n, cost, title: 'Наёмники', lines: ['Выжившие просятся к победителю: ' + n + ' за ' + cost + ' золота.'], options: [['hire', 'Нанять'], ['leave', 'Отказать']], ai: res.gold > cost * 3 ? 'hire' : 'leave' };
    ev.push({ t: 'pending', kind: 'choice' });
  };

  const growthOf = o => H.UNITS[H.OBJ[o.t].unit].growth;
  const dockOf = (S, o) => {
    const M = S.map, [ec, er] = MD().entry(o), g = H.Adv.grid(S, o.l);
    if (o.dock) return o.dock;
    for (let rad = 1; rad <= 4; rad++) {
      for (let dr = -rad; dr <= rad; dr++) {
        for (let dc = -rad; dc <= rad; dc++) {
          const c = ec + dc, r = er + dr;
          if (Math.max(Math.abs(dc), Math.abs(dr)) !== rad || !MD().inside(M, c, r) || !MD().isWater(M, o.l, c, r) || g.block[MD().idx(M, c, r)] || g.entry[MD().idx(M, c, r)]) continue;
          o.dock = [c, r];
          return o.dock;
        }
      }
    }
    return null;
  };
  const dockFree = (S, o) => {
    const at = dockOf(S, o);
    return !!at && !H.Adv.heroAt(S, o.l, at[0], at[1]) && !S.map.objs.some(x => x.t === 'boat' && !x.gone && x.l === o.l && x.c === at[0] && x.r === at[1]);
  };
  const buildBoat = (S, o, pid) => {
    const res = S.players[pid].res;
    if (!H.Town.afford(res, MP.boat) || !dockFree(S, o)) return false;
    for (const [k, v] of Object.entries(MP.boat)) res[k] -= v;
    const [c, r] = dockOf(S, o);
    MD().add(S.map, { t: 'boat', c, r, l: o.l, owner: pid });
    S.ver++;
    return true;
  };

  const heartLook = (M, m) => {
    const dx = M.heart.c - m.c, dy = M.heart.r - m.r, d = Math.max(Math.abs(dx), Math.abs(dy));
    return { sector: Math.round(Math.atan2(dy, dx) / (Math.PI / 4)), far: d <= H.HEART.close ? 0 : d <= H.HEART.mid ? 1 : 2 };
  };
  const sectorOf = (x, y) => Math.round(Math.atan2(y, x) / (Math.PI / 4));
  const heartArea = (S, pid) => {
    const M = S.map, marks = S.players[pid].menhirs;
    if (!M.heart || !marks.length) return null;
    const box = marks.length >= H.HEART.need && S.heartBox, fine = S.heroes.some(h => h.alive && h.owner === pid && H.Hero.gear(h).compass), half = (fine ? H.HEART.fine : H.HEART.box) >> 1, out = [];
    const same = (a, b) => (((a - b) % 8) + 8) % 8 === 0;
    for (let r = 0; r < M.h; r++) {
      for (let c = 0; c < M.w; c++) {
        if (!MD().groundCost(M, M.heart.l, c, r)) continue;
        if (box && (Math.abs(c - (M.heart.c + (fine ? 0 : S.heartBox[0]))) > half || Math.abs(r - (M.heart.r + (fine ? 0 : S.heartBox[1]))) > half)) continue;
        let fits = true;
        for (const m of marks) {
          const dx = c - m.c, dy = r - m.r, d = Math.max(Math.abs(dx), Math.abs(dy)), look = heartLook(M, m);
          if (!(dx || dy) || !same(sectorOf(dx, dy), look.sector) || (d <= H.HEART.close ? 0 : d <= H.HEART.mid ? 1 : 2) !== look.far) fits = false;
        }
        if (fits) out.push([c, r]);
      }
    }
    return out;
  };
  const digBlocked = (S, hero) => {
    const M = S.map, g = H.Adv.grid(S, hero.l, hero.owner), i = MD().idx(M, hero.c, hero.r);
    return !!hero.boat || !MD().groundCost(M, hero.l, hero.c, hero.r) || !!g.entry[i] || M.objs.some(o => o.t === 'digspot' && o.l === hero.l && o.c === hero.c && o.r === hero.r);
  };
  const dig = (S, hero) => {
    const ev = [], M = S.map, full = H.Adv.daySteps(S, hero);
    if (digBlocked(S, hero)) {
      note(ev, 'Здесь копать нельзя', BAD);
      return ev;
    }
    if (hero.steps + 1e-9 < full) {
      note(ev, 'На раскопки нужен целый день', BAD);
      return ev;
    }
    hero.steps = 0;
    S.ver++;
    if (M.heart && !M.heart.taken && M.heart.l === hero.l && M.heart.c === hero.c && M.heart.r === hero.r) {
      M.heart.taken = true;
      hero.heart = true;
      ev.push({ t: 'heartFound', hero: hero.id });
    } else {
      MD().add(M, { t: 'digspot', c: hero.c, r: hero.r, l: hero.l, owner: -1 });
      note(ev, 'Только земля и корни', BAD);
    }
    return ev;
  };
  const dropHeart = (S, hero, to) => {
    if (!hero.heart) return;
    hero.heart = false;
    if (to) {
      to.heart = true;
      return;
    }
    MD().add(S.map, { t: 'heartstone', c: hero.c, r: hero.r, l: hero.l, owner: -1 });
    S.ver++;
  };

  const FORGE_ROW = (S, hero) => {
    const out = [];
    hero.army.forEach((s, i) => {
      if (!s) return;
      for (const f of Object.values(H.FACTIONS)) {
        for (const row of f.units) {
          const at = row.indexOf(s.unit);
          if (at > 0) out.push({ i, to: row[at === 1 ? 2 : 1], cost: Math.ceil(s.count * H.UNITS[s.unit].cost * FORGE_SHARE) });
        }
      }
    });
    return out;
  };

  H.OBJ_VISIT = {
    scroll(S, hero, o, ev) {
      if (!o.spell) o.spell = randomSpell(S, 1 + Math.floor(H.roll(S) * 3));
      if (H.Hero.learn(hero, o.spell) || hero.spells.includes(o.spell)) {
        H.Adv.remove(S, o);
        ev.push({ t: 'learned', hero: hero.id, spells: [o.spell] });
      } else if (hero.bag.length < H.HERO.maxBag) {
        hero.bag.push('scroll-' + o.spell);
        H.Adv.remove(S, o);
        ev.push({ t: 'scroll', hero: hero.id, spell: o.spell });
      } else ev.push({ t: 'bagfull', hero: hero.id });
    },
    shrine(S, hero, o, ev) {
      const t = H.OBJ[o.t];
      if (!o.spell) o.spell = randomSpell(S, t.circle);
      S.ver++;
      if (hero.spells.includes(o.spell)) ev.push({ t: 'shrine', hero: hero.id, spell: o.spell, known: true });
      else if (H.Hero.learn(hero, o.spell)) ev.push({ t: 'learned', hero: hero.id, spells: [o.spell] });
      else ev.push({ t: 'shrine', hero: hero.id, spell: o.spell, known: false });
    },
    artifact(S, hero, o, ev) {
      if (!H.Hero.giveArt(hero, o.art)) {
        ev.push({ t: 'bagfull', hero: hero.id });
        return;
      }
      H.Adv.remove(S, o);
      ev.push({ t: 'artifact', hero: hero.id, art: o.art });
    },
    mine(S, hero, o, ev) {
      if (o.owner === hero.owner) return;
      if (!H.OBJ[o.t].res && !o.res) o.res = RARE[Math.floor(H.roll(S) * RARE.length)];
      flagIt(S, hero, o, ev);
    },
    pile(S, hero, o, ev) {
      const t = H.OBJ[o.t], n = (o.amount || span(S, t.amount)) + (H.Hero.hasPerk(hero, 'treasure') && t.res !== 'gold' ? 1 : 0);
      S.players[hero.owner].res[t.res] += n;
      H.Adv.remove(S, o);
      ev.push({ t: 'gain', hero: hero.id, res: { [t.res]: n } });
    },
    campfire(S, hero, o, ev) {
      const t = H.OBJ[o.t], gold = span(S, t.gold), kind = RARE[Math.floor(H.roll(S) * RARE.length)], n = span(S, t.res);
      const res = S.players[hero.owner].res;
      res.gold += gold;
      res[kind] += n;
      H.Adv.remove(S, o);
      ev.push({ t: 'gain', hero: hero.id, res: { gold, [kind]: n } });
    },
    chest(S, hero, o, ev) {
      const offer = H.OBJ.chest.offers[o.offer != null ? o.offer : Math.floor(H.roll(S) * H.OBJ.chest.offers.length)];
      S.pending = { kind: 'chest', hero: hero.id, obj: o.id, gold: Math.round(offer[0] * (H.Hero.hasPerk(hero, 'treasure') ? H.HERO.treasureGold : 1)), xp: offer[1] };
      ev.push({ t: 'pending', kind: 'chest' });
    },
    loot(S, hero, o, ev) {
      const list = H.OBJ[o.t].loot, pick = list[o.pick != null ? o.pick : Math.floor(H.roll(S) * list.length)];
      if (pick.art) {
        const art = o.art || rollArt(S, pick.art);
        if (!H.Hero.giveArt(hero, art)) {
          o.art = art;
          ev.push({ t: 'bagfull', hero: hero.id });
          return;
        }
        ev.push({ t: 'artifact', hero: hero.id, art });
      } else giveReward(S, hero, pick, ev);
      H.Adv.remove(S, o);
    },
    weekly(S, hero, o, ev) {
      const give = H.OBJ[o.t].give;
      if (o.week === weekOf(S)) {
        note(ev, 'На этой неделе здесь уже были', BAD);
        return;
      }
      o.week = weekOf(S);
      S.ver++;
      if (give.gold || give.res) giveReward(S, hero, { gold: give.gold, res: give.res }, ev);
      if (give.pick) {
        const [k, n] = give.pick[Math.floor(H.roll(S) * give.pick.length)];
        giveReward(S, hero, { res: { [k]: n } }, ev);
      }
      if (give.fresh) for (const [k, v] of Object.entries(give.fresh)) hero.fresh[k] = Math.max(hero.fresh[k], v);
      if (give.mana) {
        hero.mana = Math.max(hero.mana, H.Hero.maxMana(hero));
        note(ev, 'Мана восстановлена', '#a0e0ff');
      }
      if (give.steps) {
        hero.week.steps += give.steps;
        hero.steps += give.steps;
        note(ev, '+' + give.steps + ' шага в день до конца недели', '#a0e0ff');
      }
    },
    growth(S, hero, o, ev) {
      const gain = H.OBJ[o.t].gain;
      if (!once(o, hero.id)) {
        note(ev, 'Этот герой здесь уже был', BAD);
        return;
      }
      S.ver++;
      if (gain.xp) ev.push({ t: 'gain', hero: hero.id, res: {}, xp: H.Hero.addXp(hero, gain.xp) });
      for (const k of ['atk', 'def', 'power', 'wis']) {
        if (!gain[k]) continue;
        hero[k] += gain[k];
        note(ev, H.OBJ[o.t].about.split(',')[0], '#a0e0ff');
      }
    },
    knowledge(S, hero, o, ev) {
      if (seen(o, hero.id)) {
        note(ev, 'Этот герой здесь уже был', BAD);
        return;
      }
      const price = H.Sites.treePrice(hero), rich = resOf(S, hero).gold >= price;
      ask(S, hero, o, 'knowledge', 'Древо познания', ['Плоды дают новый уровень. Цена ' + price + ' золота.'], [['pay', 'Заплатить', !rich], ['leave', 'Уйти']], rich && resOf(S, hero).gold > price * 2 ? 'pay' : 'leave', { price }, ev);
    },
    witchhut(S, hero, o, ev) {
      if (!o.skill) {
        const ids = Object.keys(H.SKILLS);
        o.skill = ids[Math.floor(H.roll(S) * ids.length)];
      }
      if (seen(o, hero.id) || H.Hero.rank(hero, o.skill) || Object.keys(hero.skills).length >= H.HERO.maxSkills) {
        note(ev, 'Ведун молчит: ' + H.SKILLS[o.skill].name + ' этому герою не передать', BAD);
        return;
      }
      once(o, hero.id);
      hero.skills[o.skill] = 1;
      S.ver++;
      note(ev, 'Новый навык: ' + H.SKILLS[o.skill].name, '#a0e0ff');
    },
    arena(S, hero, o, ev) {
      if (seen(o, hero.id)) {
        note(ev, 'Этот герой здесь уже был', BAD);
        return;
      }
      ask(S, hero, o, 'arena', 'Арена', ['Выберите, что тренировать.'], [['atk', '+2 Натиска'], ['def', '+2 Стойкости'], ['leave', 'Уйти']], H.CLASSES[hero.cls].mage ? 'def' : 'atk', null, ev);
    },
    weekaltar(S, hero, o, ev) {
      const m = H.Moons.current(S);
      if (!m || !m.school) {
        note(ev, 'Алтарь молчит', BAD);
        return;
      }
      hero.week.altar = m.school;
      S.ver++;
      note(ev, 'Школа ' + H.SCHOOLS[m.school] + ' на ступень выше до конца недели', '#a0e0ff');
    },
    library(S, hero, o, ev) {
      if (hero.level < 10) {
        note(ev, 'Библиотекарь пускает героев с 10 уровня', BAD);
        return;
      }
      const fresh = Object.values(H.SPELLS).filter(sp => sp.circle <= 2 && sp.school !== 'road').filter(sp => H.Hero.learn(hero, sp.id)).map(sp => sp.id);
      S.ver++;
      if (fresh.length) ev.push({ t: 'learned', hero: hero.id, spells: fresh });
      else note(ev, 'Всё это герой уже знает');
    },
    blessing(S, hero, o, ev) {
      const def = H.OBJ[o.t];
      for (const [k, v] of Object.entries(def.fresh || {})) hero.fresh[k] = Math.max(hero.fresh[k], v);
      for (const [k, v] of Object.entries(def.week || {})) hero.week[k] = Math.max(hero.week[k], v);
      S.ver++;
      note(ev, def.about, '#a0e0ff');
    },
    graveyard(S, hero, o, ev) {
      if (o.dug) {
        note(ev, 'Здесь уже копали', BAD);
        return;
      }
      ask(S, hero, o, 'graveyard', 'Погост', ['Можно раскопать могилу: вещь найдётся, но войско это запомнит.'], [['dig', 'Раскопать'], ['leave', 'Уйти']], H.Hero.morale(hero) >= 1 ? 'dig' : 'leave', null, ev);
    },
    portal(S, hero, o, ev) {
      const to = dest(S, o);
      if (!to) {
        note(ev, 'Отсюда никуда не попасть', BAD);
        return;
      }
      jump(S, hero, to, ev);
    },
    moongate(S, hero, o, ev) {
      if (!gateOpen(S, o)) {
        const m = H.Moons.byId[o.moon];
        note(ev, 'Врата закрыты до недели ' + m.of, BAD);
        return;
      }
      const to = dest(S, o);
      if (to) jump(S, hero, to, ev);
    },
    shipyard(S, hero, o, ev) {
      flagIt(S, hero, o, ev);
      const ready = dockFree(S, o), rich = H.Town.afford(resOf(S, hero), MP.boat);
      ask(S, hero, o, 'shipyard', 'Верфь', [ready ? 'Лодка стоит ' + MP.boat.gold + ' золота и ' + MP.boat.wood + ' древесины.' : 'У причала уже стоит лодка.'], [['build', 'Построить', !ready || !rich], ['leave', 'Уйти']], ready && rich && resOf(S, hero).gold > MP.boat.gold * 4 ? 'build' : 'leave', null, ev);
    },
    boat(S, hero, o, ev) {
      if (hero.boat) return;
      hero.boat = o.id;
      o.gone = true;
      if (hero.faction !== 'tide') hero.steps = 0;
      S.ver++;
      ev.push({ t: 'boarded', hero: hero.id });
    },
    whirlpool(S, hero, o, ev) {
      const to = dest(S, o), tide = !hero.boat && hero.faction === 'tide';
      if (!to || (!hero.boat && !tide)) return;
      if (tide) {
        jump(S, hero, to, ev);
        return;
      }
      const big = hero.army.map((s, i) => (s ? i : -1)).filter(i => i >= 0).sort((a, b) => hero.army[b].count - hero.army[a].count)[0];
      if (big != null && hero.army[big].count > 1) {
        const n = Math.max(1, Math.round(hero.army[big].count * MP.whirlLoss));
        hero.army[big] = Object.assign({}, hero.army[big], { count: hero.army[big].count - n });
        note(ev, 'Водоворот забрал: ' + H.UNITS[hero.army[big].unit].name + ', ' + n, BAD);
      }
      jump(S, hero, to, ev);
    },
    lookout(S, hero, o, ev) {
      const [c, r] = MD().entry(o);
      once(o, hero.owner);
      H.Adv.reveal(S, hero.owner, o.l, c, r, H.OBJ[o.t].radius);
      S.ver++;
      note(ev, 'С башни видно далеко', '#a0e0ff');
    },
    observatory(S, hero, o, ev) {
      if (flagIt(S, hero, o, ev)) {
        const [c, r] = MD().entry(o);
        H.Adv.reveal(S, hero.owner, o.l, c, r, H.OBJ[o.t].sight);
        note(ev, 'Обсерватория: календарь видно на ' + OBSERVE_WEEKS + ' недель', '#a0e0ff');
      }
    },
    cartographer(S, hero, o, ev) {
      const res = resOf(S, hero), rows = [['surface', 'Поверхность', S.map.levels > 0], ['under', 'Подлунье', S.map.levels > 1], ['waters', 'Воды', true]];
      ask(S, hero, o, 'cartographer', 'Картограф', ['Карта поверхности ' + MAP_PRICE.surface + ', Подлунья ' + MAP_PRICE.under + ', вод ' + MAP_PRICE.waters + ' золота.'], [...rows.map(([id, label, has]) => [id, label, !has || res.gold < MAP_PRICE[id]]), ['leave', 'Уйти']], res.gold > 6000 ? 'surface' : 'leave', null, ev);
    },
    marketplace(S, hero, o, ev) {
      const res = resOf(S, hero), rows = ['salt', 'amber', 'sulfur', 'moonsilver'].map(k => {
        const cost = Math.round(H.TOWN.value[k] * H.TOWN.buy[0]) * 5;
        return [k, '5: ' + names()[k], res.gold < cost];
      });
      const low = ['salt', 'amber', 'sulfur', 'moonsilver'].reduce((a, b) => (res[b] < res[a] ? b : a));
      ask(S, hero, o, 'marketplace', 'Рынок', ['Продать 10 дерева и 10 руды за золото или купить 5 редких ресурсов.'], [['sell', 'Продать', res.wood < 10 || res.ore < 10], ...rows, ['leave', 'Уйти']], res.gold > 5000 + Math.round(H.TOWN.value[low] * H.TOWN.buy[0]) * 5 ? low : 'leave', null, ev);
    },
    fair(S, hero, o, ev) {
      if (o.week !== weekOf(S)) {
        o.week = weekOf(S);
        o.art = rollArt(S, H.roll(S) < 0.7 ? 'plain' : 'rare');
        o.sold = false;
      }
      const a = H.ARTIFACTS[o.art], price = artPrice(o.art);
      ask(S, hero, o, 'fair', 'Ярмарка', o.sold ? ['Товар этой недели продан.'] : [a.name + ': ' + a.about, 'Цена ' + price + ' золота.'], [['buy', 'Купить', o.sold || resOf(S, hero).gold < price], ['leave', 'Уйти']], !o.sold && resOf(S, hero).gold > price * 2 ? 'buy' : 'leave', null, ev);
    },
    blackmarket(S, hero, o, ev) {
      if (!o.arts) o.arts = [rollArt(S, 'plain'), rollArt(S, 'rare'), rollArt(S, 'relic')];
      const res = resOf(S, hero), rows = o.arts.map((id, i) => [i, id]).filter(r => r[1]);
      const cost = id => Math.round(artPrice(id) * BLACK_PRICE), buy = rows.filter(r => res.gold > cost(r[1]) * 2).pop();
      ask(S, hero, o, 'blackmarket', 'Чёрный рынок', rows.length ? rows.map(r => H.ARTIFACTS[r[1]].name + ': ' + cost(r[1]) + ' золота') : ['Прилавок пуст.'], [...rows.map(r => ['a' + r[0], H.ARTIFACTS[r[1]].name, res.gold < cost(r[1])]), ['leave', 'Уйти']], buy ? 'a' + buy[0] : 'leave', null, ev);
    },
    inn(S, hero, o, ev) {
      if (!o.tavern || o.tavernWeek !== weekOf(S)) {
        H.Town.rollInn(S, o);
        o.tavernWeek = weekOf(S);
      }
      const block = H.Town.hireBlockFor(S, o, hero.owner), hired = o.tavern.map(id => (id ? H.HEROES.find(x => x.id === id) : null));
      const count = S.heroes.filter(h => h.alive && h.owner === hero.owner).length;
      ask(S, hero, o, 'inn', 'Придорожная таверна', [H.Town.rumor(S), 'Герой стоит ' + H.TOWN.heroPrice + ' золота.'], [...hired.map((r, i) => (r ? ['h' + i, r.name, !!block] : null)).filter(Boolean), ['leave', 'Уйти']], !block && count < 5 && hired[0] && resOf(S, hero).gold > H.TOWN.heroPrice * 2 ? 'h0' : 'leave', null, ev);
    },
    dwelling(S, hero, o, ev) {
      const def = H.OBJ[o.t], u = H.UNITS[def.unit];
      if (def.flag) flagIt(S, hero, o, ev);
      const cost = H.Town.price(def.unit), can = Math.min(o.pool, H.Town.most(resOf(S, hero), cost)), slot = H.Hero.slotFor(hero.army, def.unit);
      ask(S, hero, o, 'dwelling', def.name, [u.name + ': свободно ' + o.pool + ', цена ' + u.cost + ' золота' + (u.rare ? ' и редкий ресурс' : ''), slot < 0 ? 'В войске нет места' : ''].filter(Boolean), [['all', 'Нанять ' + can, can < 1 || slot < 0], ['leave', 'Уйти']], can >= 1 && slot >= 0 ? 'all' : 'leave', null, ev);
    },
    changeforge(S, hero, o, ev) {
      const res = resOf(S, hero), rows = FORGE_ROW(S, hero);
      if (!rows.length) {
        note(ev, 'Кузне нечего перековать: нужен улучшенный отряд');
        return;
      }
      ask(S, hero, o, 'changeforge', 'Кузня перемен', ['Перевести отряд в другую ветвь:'], [...rows.slice(0, 4).map((x, i) => ['f' + i, H.UNITS[x.to].name + ' ' + x.cost, res.gold < x.cost]), ['leave', 'Уйти']], res.gold > 8000 && res.gold >= rows[0].cost ? 'f0' : 'leave', null, ev);
    },
    outpost(S, hero, o, ev, from) {
      if (o.owner !== hero.owner) {
        if (o.garrison.some(Boolean)) {
          S.pending = { kind: 'town', hero: hero.id, obj: o.id, from: from || [hero.c, hero.r] };
          ev.push({ t: 'pending', kind: 'town' });
          return;
        }
        flagIt(S, hero, o, ev);
      }
      ask(S, hero, o, 'outpost', 'Застава', ['Гарнизон: ' + (o.garrison.filter(Boolean).map(s => H.UNITS[s.unit].name + ' ' + s.count).join(', ') || 'пусто')], [['leave1', 'Оставить отряд', hero.army.filter(Boolean).length < 2], ['take', 'Забрать всех', !o.garrison.some(Boolean)], ['leave', 'Уйти']], 'leave', null, ev);
    },
    prison(S, hero, o, ev) {
      const rec = H.HEROES.find(x => x.id === o.hid), count = S.heroes.filter(h => h.alive && h.owner === hero.owner).length;
      if (!rec) {
        H.Adv.remove(S, o);
        return;
      }
      ask(S, hero, o, 'prison', 'Острог', ['В остроге сидит ' + rec.name + ', ' + H.CLASSES[rec.cls].name.toLowerCase() + ', уровень ' + (o.level || 5) + '.', 'Его можно вывести даром.'], [['free', 'Вывести', count >= H.TOWN.maxHeroes], ['leave', 'Уйти']], count < H.TOWN.maxHeroes ? 'free' : 'leave', null, ev);
    },
    sealer(S, hero, o, ev) {
      const list = S.players[hero.owner].seals, c = H.SEAL_COLORS[o.color];
      if (!list.includes(o.color)) {
        list.push(o.color);
        S.ver++;
      }
      note(ev, c[0] + ' печать: такие заставы теперь пропускают', '#a0e0ff');
    },
    sealgate(S, hero, o, ev, from) {
      note(ev, 'Застава не пускает: нужна ' + H.SEAL_COLORS[o.color][0].toLowerCase() + ' печать', BAD);
      backTo(S, hero, from);
    },
    quest(S, hero, o, ev) {
      if ((o.done || []).includes(hero.owner)) {
        note(ev, 'Проситель уже получил своё');
        return;
      }
      const ready = questReady(S, hero, o.quest);
      ask(S, hero, o, 'quest', 'Хижина просителя', [questText(o.quest), 'Награда: ' + rewardText(o.reward)], [['do', 'Отдать', !ready], ['leave', 'Уйти']], ready ? 'do' : 'leave', null, ev);
    },
    hamlet(S, hero, o, ev) {
      if (o.ward != null && !H.Adv.allied(S, o.ward, hero.owner) && o.ward !== hero.owner) {
        note(ev, H.OBJ[o.t].name + ' сгорело', BAD);
        H.Adv.remove(S, o);
        return;
      }
      if ((o.done || []).includes(hero.owner)) {
        note(ev, 'Здесь уже всё взяли');
        return;
      }
      ask(S, hero, o, 'hamlet', H.OBJ[o.t].name, ['Десяток дворов и колодец. Золото спрятано плохо, и никто не помешает его забрать.'], [['take', 'Забрать ' + (o.gold || 1000) + ' золота'], ['leave', 'Пройти мимо']], 'leave', null, ev);
    },
    witchring(S, hero, o, ev) {
      if (hero.faction !== 'thicket') {
        ev.push({ t: 'read', title: H.OBJ[o.t].name, text: H.OBJ[o.t].about });
        return;
      }
      flagIt(S, hero, o, ev);
      const why = ringWhy(S, hero), list = why ? [] : ringTargets(S, hero, o);
      if (why || !list.length) {
        note(ev, why || 'Кругу пока некуда вести: нужен ещё один свой круг или кольцо в городе');
        return;
      }
      ask(S, hero, o, 'ring', H.OBJ[o.t].name, ['Куда вести? Переход стоит ' + ringCost(S, hero) + ' шагов, раз в день.'], [...list.map(t => ['to' + t.id, ringName(S, t)]), ['stay', 'Остаться']], 'stay', null, ev);
    },
    questgate(S, hero, o, ev, from) {
      const ready = questReady(S, hero, o.quest);
      ask(S, hero, o, 'questgate', 'Ворота задания', [questText(o.quest)], [['do', 'Выполнить', !ready], ['leave', 'Назад']], ready ? 'do' : 'leave', { from: from || null }, ev);
    },
    barrowstone(S, hero, o, ev, from) {
      const p = S.players[hero.owner], plan = stonePlan(S, hero);
      if (hero.faction !== 'barrows') {
        ev.push({ t: 'read', title: H.OBJ[o.t].name, text: H.OBJ[o.t].about });
        return;
      }
      if (!p.shades.length) {
        note(ev, 'Камень молчит: павших без города у вас нет');
        return;
      }
      if ((o.week || {})[hero.owner] === S.day - ((S.day - 1) % 7)) {
        note(ev, 'На этой неделе камень уже отвечал');
        return;
      }
      if (!plan.rows.length) {
        note(ev, 'Не хватает золота или места в войске');
        return;
      }
      ask(S, hero, o, 'barrowstone', H.OBJ[o.t].name, [...plan.rows.map(r => H.UNITS[r.unit].name + ': ' + r.n), 'Цена: ' + plan.gold + ' золота'], [['raise', 'Поднять'], ['leave', 'Уйти']], 'raise', { from: from || null }, ev);
    },
    lore(S, hero, o, ev) {
      ev.push({ t: 'read', title: H.OBJ[o.t].name, text: o.text || H.OBJ[o.t].about });
    },
    vault(S, hero, o, ev, from) {
      if (o.looted) {
        note(ev, H.OBJ[o.t].name + ': пусто');
        return;
      }
      S.pending = { kind: 'vault', hero: hero.id, obj: o.id, from: from || [hero.c, hero.r] };
      ev.push({ t: 'pending', kind: 'vault' });
    },
    ruin(S, hero, o, ev) {
      flagIt(S, hero, o, ev);
    },
    menhir(S, hero, o, ev) {
      const marks = S.players[hero.owner].menhirs, M = S.map;
      if (!M.heart) {
        ev.push({ t: 'read', title: 'Менгир', text: 'Камень молчит: Сердца на этой карте нет.' });
        return;
      }
      if (!marks.some(m => m.id === o.id)) {
        marks.push({ id: o.id, c: o.c, r: o.r });
        S.ver++;
      }
      ev.push({ t: 'menhir', count: marks.length });
    },
    heartstone(S, hero, o, ev) {
      hero.heart = true;
      H.Adv.remove(S, o);
      ev.push({ t: 'heartFound', hero: hero.id });
    }
  };

  const stonePlan = (S, hero) => {
    const p = S.players[hero.owner], rows = [];
    let room = H.TOWN.barrow.stoneLimit, gold = p.res.gold, total = 0;
    const army = hero.army.slice();
    for (const e of p.shades.slice().sort((a, b) => H.UNITS[b.unit].cost - H.UNITS[a.unit].cost)) {
      const each = H.Town.raisePrice(S, hero.owner, e.unit), value = H.UNITS[e.unit].cost, slot = H.Hero.slotFor(army, e.unit), n = slot < 0 ? 0 : Math.min(e.count, Math.floor(room / value), Math.floor(gold / each));
      if (n < 1) continue;
      army[slot] = army[slot] || { unit: e.unit, count: 0 };
      room -= n * value;
      gold -= n * each;
      total += n * each;
      rows.push({ unit: e.unit, n });
    }
    return { rows, gold: total };
  };
  H.SITE_PICK = {
    barrowstone(S, hero, o, choice, ev) {
      if (choice !== 'raise') return;
      const p = S.players[hero.owner], plan = stonePlan(S, hero);
      o.week = Object.assign({}, o.week, { [hero.owner]: S.day - ((S.day - 1) % 7) });
      p.res.gold -= plan.gold;
      for (const r of plan.rows) {
        H.Hero.addTo(hero.army, H.Hero.slotFor(hero.army, r.unit), { unit: r.unit, count: r.n, stars: 0, vet: 0 });
        const e = p.shades.find(x => x.unit === r.unit);
        e.count -= r.n;
        p.risen = (p.risen || 0) + r.n;
        ev.push({ t: 'joined', hero: hero.id, unit: r.unit, count: r.n, price: 0 });
      }
      p.shades = p.shades.filter(x => x.count > 0);
      S.ver++;
    },
    knowledge(S, hero, o, choice, ev, p) {
      if (choice !== 'pay') return;
      once(o, hero.id);
      resOf(S, hero).gold -= p.price;
      if (hero.level < H.HERO.maxLevel) hero.xp = Math.max(hero.xp, H.XP_TABLE[hero.level + 1]);
      S.ver++;
    },
    arena(S, hero, o, choice) {
      if (choice !== 'atk' && choice !== 'def') return;
      once(o, hero.id);
      hero[choice] += 2;
      S.ver++;
    },
    graveyard(S, hero, o, choice, ev) {
      if (choice !== 'dig') return;
      o.dug = true;
      hero.week.morale -= 1;
      const art = rollArt(S, 'plain');
      if (H.Hero.giveArt(hero, art)) ev.push({ t: 'artifact', hero: hero.id, art });
      S.ver++;
    },
    shipyard(S, hero, o, choice, ev) {
      if (choice === 'build' && buildBoat(S, o, hero.owner)) note(ev, 'Лодка у причала', '#a0e0ff');
    },
    cartographer(S, hero, o, choice, ev) {
      if (!MAP_PRICE[choice]) return;
      const M = S.map, seenAll = S.players[hero.owner].seen;
      resOf(S, hero).gold -= MAP_PRICE[choice];
      for (let l = 0; l < M.levels; l++) {
        for (let i = 0; i < M.w * M.h; i++) {
          const wet = H.TERRAIN[M.ter[l][i]].id === 'water';
          if (choice === 'waters' ? wet : (choice === 'surface' ? l === 0 && !wet : l === 1)) seenAll[l][i] = 1;
        }
      }
      S.ver++;
      note(ev, 'Карта куплена', '#a0e0ff');
    },
    marketplace(S, hero, o, choice, ev) {
      const res = resOf(S, hero);
      if (choice === 'sell') {
        res.wood -= 10;
        res.ore -= 10;
        const gold = Math.round(20 * H.TOWN.value.wood * H.TOWN.sell[0]);
        res.gold += gold;
        ev.push({ t: 'gain', hero: hero.id, res: { gold } });
      } else if (H.TOWN.value[choice]) {
        res.gold -= Math.round(H.TOWN.value[choice] * H.TOWN.buy[0]) * 5;
        res[choice] += 5;
        ev.push({ t: 'gain', hero: hero.id, res: { [choice]: 5 } });
      }
      S.ver++;
    },
    fair(S, hero, o, choice, ev) {
      if (choice !== 'buy' || o.sold) return;
      resOf(S, hero).gold -= artPrice(o.art);
      if (H.Hero.giveArt(hero, o.art)) ev.push({ t: 'artifact', hero: hero.id, art: o.art });
      o.sold = true;
      S.ver++;
    },
    blackmarket(S, hero, o, choice, ev) {
      if (choice[0] !== 'a') return;
      const i = +choice.slice(1), id = o.arts[i];
      resOf(S, hero).gold -= Math.round(artPrice(id) * BLACK_PRICE);
      if (H.Hero.giveArt(hero, id)) ev.push({ t: 'artifact', hero: hero.id, art: id });
      o.arts[i] = null;
      S.ver++;
    },
    inn(S, hero, o, choice, ev) {
      if (choice[0] !== 'h') return;
      ev.push(...H.Town.hireFor(S, o, hero.owner, +choice.slice(1)).ev);
    },
    dwelling(S, hero, o, choice, ev) {
      if (choice !== 'all') return;
      const def = H.OBJ[o.t], cost = H.Town.price(def.unit), n = Math.min(o.pool, H.Town.most(resOf(S, hero), cost)), slot = H.Hero.slotFor(hero.army, def.unit);
      if (n < 1 || slot < 0) return;
      for (const [k, v] of Object.entries(H.Town.times(cost, n))) resOf(S, hero)[k] -= v;
      o.pool -= n;
      H.Hero.addTo(hero.army, slot, { unit: def.unit, count: n });
      S.ver++;
      ev.push({ t: 'joined', hero: hero.id, unit: def.unit, count: n, price: cost.gold * n });
    },
    changeforge(S, hero, o, choice) {
      if (choice[0] !== 'f') return;
      const x = FORGE_ROW(S, hero)[+choice.slice(1)];
      if (!x) return;
      resOf(S, hero).gold -= x.cost;
      hero.army[x.i] = Object.assign({}, hero.army[x.i], { unit: x.to });
      S.ver++;
    },
    outpost(S, hero, o, choice) {
      if (choice === 'leave1') {
        const list = hero.army.map((s, i) => (s ? i : -1)).filter(i => i >= 0).sort((a, b) => hero.army[a].count * H.UNITS[hero.army[a].unit].cost - hero.army[b].count * H.UNITS[hero.army[b].unit].cost), i = list[0], to = H.Hero.slotFor(o.garrison, hero.army[i].unit);
        if (to >= 0) H.Hero.moveStack(hero.army, i, o.garrison, to, { keep: true });
      } else if (choice === 'take') {
        o.garrison.forEach((s, i) => {
          const to = s ? H.Hero.slotFor(hero.army, s.unit) : -1;
          if (to >= 0) H.Hero.moveStack(o.garrison, i, hero.army, to);
        });
      }
      S.ver++;
    },
    prison(S, hero, o, choice, ev) {
      if (choice !== 'free') return;
      const rec = H.HEROES.find(x => x.id === o.hid), at = H.Town.spot(S, o);
      if (!at) {
        note(ev, 'У ворот нет места', BAD);
        return;
      }
      const freed = H.Adv.addHero(S, { owner: hero.owner, hid: rec.id, name: rec.name, cls: rec.cls, faction: H.CLASSES[rec.cls].faction, c: at[0], r: at[1], l: o.l, army: rec.army.map(([unit, lo]) => ({ unit, count: lo })) });
      freed.xp = H.XP_TABLE[o.level || 5];
      H.Adv.remove(S, o);
      ev.push({ t: 'freed', hero: freed.id });
    },
    quest(S, hero, o, choice, ev) {
      if (choice !== 'do' || !questReady(S, hero, o.quest)) return;
      questPay(S, hero, o.quest);
      o.done = [...(o.done || []), hero.owner];
      giveReward(S, hero, o.reward, ev);
      S.ver++;
    },
    hamlet(S, hero, o, choice, ev) {
      if (choice !== 'take') return;
      const gold = o.gold || 1000;
      S.players[hero.owner].res.gold += gold;
      o.done = [...(o.done || []), hero.owner];
      ev.push({ t: 'gain', hero: hero.id, res: { gold }, xp: 0 });
      S.ver++;
    },
    ring(S, hero, o, choice, ev) {
      if (choice === 'stay') return;
      ringJump(S, hero, objAt(S, +choice.slice(2)), ev);
    },
    questgate(S, hero, o, choice, ev, p) {
      if (choice === 'do' && questReady(S, hero, o.quest)) {
        questPay(S, hero, o.quest);
        o.done = [...(o.done || []), hero.owner];
        S.ver++;
        note(ev, 'Ворота открыты', '#a0e0ff');
        return;
      }
      backTo(S, hero, p.from);
    },
    merc(S, hero, o, choice, ev, p) {
      if (choice !== 'hire') return;
      const slot = H.Hero.slotFor(hero.army, p.unit);
      if (slot < 0 || resOf(S, hero).gold < p.cost) return;
      resOf(S, hero).gold -= p.cost;
      H.Hero.addTo(hero.army, slot, { unit: p.unit, count: p.count });
      S.ver++;
      ev.push({ t: 'joined', hero: hero.id, unit: p.unit, count: p.count, price: p.cost });
    }
  };

  const fresh = (S, hero, o) => {
    const def = H.OBJ[o.t], res = resOf(S, hero);
    switch (def.kind) {
      case 'weekly': return o.week !== weekOf(S);
      case 'growth': case 'arena': return !seen(o, hero.id);
      case 'knowledge': return !seen(o, hero.id) && res.gold > H.Sites.treePrice(hero) * 2;
      case 'witchhut': return !seen(o, hero.id) && Object.keys(hero.skills).length < H.HERO.maxSkills && (!o.skill || !H.Hero.rank(hero, o.skill));
      case 'library': return hero.level >= 10 && Object.values(H.SPELLS).some(sp => sp.circle <= 2 && sp.school !== 'road' && !hero.spells.includes(sp.id));
      case 'weekaltar': { const m = H.Moons.current(S); return !!m && !!m.school && hero.week.altar !== m.school && !!H.Hero.rank(hero, m.school); }
      case 'blessing': return def.fresh ? Object.entries(def.fresh).some(([k, v]) => hero.fresh[k] < v) : Object.entries(def.week).some(([k, v]) => hero.week[k] < v);
      case 'graveyard': return !o.dug && H.Hero.morale(hero) >= 1;
      case 'lookout': return !seen(o, hero.owner);
      case 'observatory': case 'ruin': case 'outpost': return o.owner !== hero.owner;
      case 'cartographer': return res.gold > 6000 && S.players[hero.owner].seen[0].some(v => !v);
      case 'marketplace': return res.gold > 5000;
      case 'fair': return res.gold > 3000 && (o.week !== weekOf(S) || !o.sold);
      case 'blackmarket': return res.gold > 8000 && (!o.arts || o.arts.some(Boolean));
      case 'inn': return S.heroes.filter(h => h.alive && h.owner === hero.owner).length < 5 && res.gold > H.TOWN.heroPrice * 2;
      case 'changeforge': return res.gold > 8000 && hero.army.some(s => s && Object.values(H.FACTIONS).some(f => f.units.some(row => row.indexOf(s.unit) > 0)));
      case 'prison': return S.heroes.filter(h => h.alive && h.owner === hero.owner).length < H.TOWN.maxHeroes;
      case 'sealer': return !S.players[hero.owner].seals.includes(o.color);
      case 'menhir': return !!S.map.heart && !S.map.heart.taken && !S.players[hero.owner].menhirs.some(m => m.id === o.id);
      case 'heartstone': return true;
      case 'loot': return true;
      default: return false;
    }
  };

  const tip = (S, o, pid, hero) => {
    const def = H.OBJ[o.t], out = [def.name];
    if (def.flag) out.push(o.owner === pid ? 'ваш' : o.owner >= 0 ? 'чужой' : 'ничей');
    if (def.kind === 'dwelling') out.push(H.UNITS[def.unit].name + ': свободно ' + (o.pool || 0));
    if (def.kind === 'vault') {
      if (o.looted) out.push('разграблено');
      else out.push('Охрана: ' + Adv().strength(vaultGuards(o).reduce((t, s) => t + s.count, 0)).toLowerCase(), 'Ступень ' + ((o.tier || 0) + 1) + ' из 4');
      return out;
    }
    if (def.kind === 'moongate') out.push('Луна: ' + H.Moons.byId[o.moon].name + (gateOpen(S, o) ? ', открыты' : ', закрыты'));
    if (def.kind === 'sealer' || def.kind === 'sealgate') out.push('Печать: ' + H.SEAL_COLORS[o.color][0].toLowerCase());
    if (def.kind === 'quest' || def.kind === 'questgate') out.push(questText(o.quest));
    if (def.kind === 'quest') out.push('Награда: ' + rewardText(o.reward));
    if (def.kind === 'weekly' && o.week === weekOf(S)) out.push('на этой неделе уже брали');
    if (def.kind === 'lore' || def.kind === 'barrowstone') out.push(o.text || def.about);
    else if (def.about) out.push(def.about);
    if (hero && seen(o, hero.id)) out.push('этот герой уже был');
    return out;
  };
  const Adv = () => H.Adv;

  const init = S => {
    const pool = (S.players || []).length;
    for (const o of S.map.objs) {
      const def = H.OBJ[o.t];
      if (def.kind === 'dwelling') o.pool = o.pool != null ? o.pool : growthOf(o);
      if (def.kind === 'vault') o.tier = o.tier || 0;
      if (def.held && o.t !== 'town') o.garrison = Array.from({ length: 7 }, (_, i) => (o.garrison && o.garrison[i] ? { unit: o.garrison[i].unit, count: o.garrison[i].count, stars: 0, vet: 0 } : null));
    }
    if (S.map.heart && !S.heartBox) {
      const half = H.HEART.box >> 1, roll = () => Math.floor(H.roll(S) * (half * 2 + 1)) - half;
      S.heartBox = [roll(), roll()];
    }
    return pool;
  };

  const week = (S, ev) => {
    for (const o of S.map.objs) {
      if (o.gone) continue;
      const def = H.OBJ[o.t];
      if (def.kind === 'dwelling') o.pool = Math.min((o.pool || 0) + growthOf(o), growthOf(o) * MP.weeksStock);
      if (def.kind === 'ruin' && o.owner >= 0) {
        const res = S.players[o.owner].res;
        if (S.players[o.owner].faction === 'throne') res.moonsilver += 1;
        else res.gold += 250;
      }
    }
    for (const h of S.heroes) {
      if (h.alive) h.week = { morale: 0, luck: 0, steps: 0, altar: null };
    }
    return ev;
  };

  H.Sites = {
    ringCost, ringsOf, ringWhy, ringHere, ringTargets, ringName, ringJump,
    init, week, fresh, tip, openFor, dest, gateOpen, dig, heartArea, heartLook, dropHeart, buildBoat, dockFree, dockOf,
    questText, questReady, rewardText, vaultGuards, vaultPrize, vaultValue, vaultWon, vaultLost, digBlocked, mercOffer, rollArt, seen,
    treePrice: hero => 1000 + 300 * hero.level,
    calendarWeeks: (S, pid) => (S.map.objs.some(o => !o.gone && o.t === 'observatory' && o.owner === pid) || S.heroes.some(h => h.alive && h.owner === pid && H.Hero.gear(h).calendar) ? OBSERVE_WEEKS : 4)
  };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
