(function (H) {
  'use strict';
  const MD = H.MapData, MF = H.MapFile;
  const TARGET_AREA = 560;
  const MIN_SHARED = 10;
  const MAX_TRIES = 16;
  const TAU = Math.PI * 2;
  const ORTHO = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const NATIVE = { league: 'meadow', barrows: 'steppe', thicket: 'forest', tide: 'sand', forge: 'ash', throne: 'highland', stars: 'palegrass', spore: 'fungal' };
  const WILD = ['meadow', 'steppe', 'palegrass', 'highland', 'saltflat', 'sand', 'ash'];
  const SECOND = { meadow: 'forest', steppe: 'saltflat', palegrass: 'forest', highland: 'steppe', saltflat: 'sand', sand: 'saltflat', ash: 'steppe', forest: 'swamp', fungal: 'cave', cave: 'fungal' };
  const RARE_MINE = { salt: 'saltworks', amber: 'ambermine', sulfur: 'sulfurspring', moonsilver: 'moonrift', ore: 'oremine' };
  const STRENGTH = { weak: ['Слабые', 0.6], normal: ['Обычные', 1], strong: ['Сильные', 1.5], fierce: ['Лютые', 2.2] };
  const WATER = { none: 'Нет', few: 'Мало', many: 'Много' };
  const PASS_VALUE = [800, 1500, 5000, 13000];
  const WANDER_VALUE = [300, 900, 3000, 8000];
  const BUDGET = [0, 22, 40, 75];
  const GUARD_RATIO = [0.12, 0.4, 0.7, 1];
  const GUARD_CHANCE = [0, 0.3, 0.6, 0.85];
  const MINE_WORTH = { gold: 7000, wood: 1800, ore: 1800, salt: 3500, amber: 3500, sulfur: 3500, moonsilver: 3500 };
  const SHRINE_WORTH = [0, 1000, 1800, 3000];
  const CHEST_WORTH = [1000, 1500, 2000];
  const START_OUTWARD = 0.3;
  const ROOMY_START = 300;
  const TIGHT_START = 220;
  const START_BUILT = ['hall1', 'fort1', 'tavern', 'dwell1', 'dwell2'];
  const TOWN_NAMES = {
    league: ['Мельничный Брод', 'Новый Причал', 'Заречье', 'Плотинный Двор', 'Колокольцы', 'Верхний Шлюз', 'Гильдейский Торг', 'Рыбная Слобода', 'Семь Мостов', 'Латный Посад', 'Старая Запруда', 'Белая Пристань'],
    barrows: ['Кара-Оба', 'Ак-Сай', 'Тас-Мола', 'Жел-Кудук', 'Сары-Кум', 'Кызыл-Тас', 'Жаман-Сай', 'Орта-Оба', 'Бес-Мола', 'Тогуз-Кудук', 'Улы-Оба', 'Ак-Мола'],
    thicket: ['Заповедный Двор', 'Берёзовый Кут', 'Омутня', 'Моховая Заимка', 'Ольховый Лог', 'Сосновая Падь', 'Полынный Яр', 'Кривая Топь', 'Лешачий Угол', 'Калинов Брод', 'Змеева Гать', 'Тихий Бор'],
    tide: ['Раковинная Лагуна', 'Жемчужная Отмель', 'Дом на Сваях', 'Коралловый Причал', 'Солёный Плёс', 'Тихий Риф', 'Белая Банка', 'Певчая Бухта', 'Чёрный Прибой', 'Лунная Мель', 'Морской Двор', 'Старая Волна'],
    forge: ['Цеховой Двор', 'Чёрная Литейная', 'Пепельный Склон', 'Серная Падь', 'Горновая Слобода', 'Окалинный Яр', 'Шлаковый Отвал', 'Тёплый Камень'],
    throne: ['Белый Двор', 'Лунная Арка', 'Мраморный Утёс', 'Серебряный Порог', 'Зеркальный Холм', 'Старая Колоннада', 'Царская Терраса', 'Белый Брод']
  };
  const SIGNS = [
    'Налево пойдёшь: шахта. Направо пойдёшь: тоже шахта, но с волками.',
    'Здесь был герой. Больше его нигде не было.',
    'Осторожно: нейтралы растут быстрее, чем вы думаете.',
    'Луны считают недели. Мы считаем убытки.',
    'До ближайшего трактира три дня и один медведь.',
    'Кто прочёл, тот уже потратил шаг.',
    'Не копать. Уже копали.',
    'Просьба не будить лешего до конца недели.'
  ];
  const WHERE = {
    bees: ['meadow', 'forest'], wolves: ['forest', 'steppe'], boars: ['forest'], bears: ['forest', 'highland'], mountaineagles: ['highland'],
    scorpions: ['saltflat', 'sand'], hermits: ['forest', 'highland'], whitespirit: ['palegrass'], redspirit: ['ash'], azurespirit: ['sand'], greenspirit: ['forest'],
    stonegiant: ['highland'], moondream: ['cave', 'fungal']
  };
  const WET_UNITS = ['pirates', 'seaserpent'];
  const TOP_UNITS = ['moondream', 'ancientlizard'];

  const P = (t, lo, hi, weight, more) => Object.assign({ t, lo, hi, weight }, more || {});
  const ONE = { once: true };
  const PIECES = [
    P('res-wood', 1, 2, 3), P('res-ore', 1, 2, 3), P('res-gold', 1, 3, 3), P('res-salt', 1, 3, 2), P('res-amber', 1, 3, 2), P('res-sulfur', 1, 3, 2), P('res-moonsilver', 2, 3, 2),
    P('moonshard', 2, 3, 1), P('campfire', 1, 2, 3), P('chest', 1, 3, 3), P('wagon', 1, 2, 1, ONE), P('traveler', 1, 3, 1, ONE), P('scroll', 1, 3, 2), P('artifact', 1, 3, 4),
    P('sawmill', 1, 1, 1, ONE), P('oremine', 1, 1, 1, ONE), P('saltworks', 1, 2, 1, ONE), P('ambermine', 1, 2, 1, ONE), P('sulfurspring', 1, 2, 1, ONE), P('goldmine', 1, 3, 2, ONE), P('oldmine', 2, 3, 1, ONE), P('moonrift', 3, 3, 1, ONE),
    P('windmill', 1, 2, 1, ONE), P('watermill', 1, 2, 1, ONE), P('apiary', 1, 2, 1, ONE), P('well', 1, 3, 1, ONE), P('stable', 1, 2, 1, ONE),
    P('atkstone', 2, 3, 1, ONE), P('ancestorshield', 2, 3, 1, ONE), P('charmspring', 2, 3, 1, ONE), P('sagescroll', 2, 3, 1, ONE), P('camp', 1, 2, 1, ONE), P('knowledgetree', 2, 3, 1, ONE), P('witchhut', 2, 3, 1, ONE), P('arena', 2, 3, 1, ONE),
    P('shrine1', 1, 1, 2, ONE), P('shrine2', 1, 2, 1, ONE), P('shrine3', 2, 3, 1, ONE), P('weekaltar', 2, 3, 1, ONE), P('library', 3, 3, 1, ONE),
    P('chapel', 1, 2, 1, ONE), P('luckspring', 1, 2, 1, ONE), P('idol', 1, 3, 1, ONE), P('graveyard', 2, 3, 1, ONE),
    P('watchtower', 1, 2, 1, ONE), P('observatory', 2, 3, 1, ONE), P('cartographer', 2, 3, 1, ONE), P('market', 1, 2, 1, ONE), P('fair', 2, 3, 1, ONE), P('blackmarket', 2, 3, 1, ONE), P('inn', 1, 3, 1, ONE), P('mercenarycamp', 1, 2, 1, ONE), P('changeforge', 2, 3, 1, ONE),
    P('prison', 2, 3, 1, ONE), P('petitioner', 1, 3, 1, ONE), P('whiteruin', 2, 3, 1, ONE),
    P('wreck', 1, 3, 1, { once: true, shore: true }), P('kurganstone', 1, 2, 1, { once: true, on: ['steppe', 'saltflat'] }), P('witchring', 1, 2, 1, { once: true, on: ['forest', 'meadow'] }),
    P('crystalgrotto', 2, 3, 2, { once: true, under: true }), P('fungalring', 2, 3, 1, { once: true, under: true }),
    P('wagonruin', 1, 2, 1, { once: true, tier: 0 }), P('wolfden', 1, 2, 1, { once: true, tier: 0 }), P('wildhive', 1, 2, 1, { once: true, tier: 0 }),
    P('trollcave', 2, 3, 1, { once: true, tier: 1 }), P('eaglenest', 2, 3, 1, { once: true, tier: 1 }), P('khancrypt', 2, 3, 1, { once: true, tier: 1 }), P('piratecove', 2, 3, 1, { once: true, tier: 1, shore: true }), P('moonmine', 2, 3, 1, { once: true, tier: 1, under: true }),
    P('sunkentemple', 3, 3, 1, { once: true, tier: 2, shore: true }), P('giantforge', 3, 3, 1, { once: true, tier: 2 }), P('ruinedobservatory', 3, 3, 1, { once: true, tier: 2 }), P('thronetreasury', 3, 3, 1, { once: true, tier: 3 })
  ];

  const fail = why => {
    throw { rmgFail: why };
  };
  const polar = (r, a) => ({ x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) });
  const pick = (list, rng) => list[Math.floor(rng() * list.length)];
  const shuffled = (list, rng) => {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };

  const addZone = (G, o) => {
    const z = Object.assign({ id: G.zones.length, l: 0, x: 0.5, y: 0.5, cls: 'side', tier: 1, player: -1, wedge: -1, proto: 'side', radius: 0, filler: false, sea: false, anchors: [] }, o);
    G.zones.push(z);
    return z;
  };
  const tie = (G, a, b) => G.links.push([a, b]);
  const rotate = (p, a) => {
    const dx = p.x - 0.5, dy = p.y - 0.5;
    return { x: 0.5 + dx * Math.cos(a) - dy * Math.sin(a), y: 0.5 + dx * Math.sin(a) + dy * Math.cos(a) };
  };
  const startZone = (G, i, p, wedge) => addZone(G, Object.assign({ cls: 'start', tier: 0, player: G.order[i], wedge, proto: 'start' }, p));

  const duelMap = G => {
    G.rules = { wedges: 2, a0: Math.PI * 0.75, crossWedge: true };
    const parts = [0, 1].map(k => {
      const turn = p => rotate(p, k * Math.PI);
      return {
        s: startZone(G, k, turn({ x: 0.18, y: 0.82 }), k),
        a: addZone(G, Object.assign({ wedge: k, proto: 'sideA', town: true }, turn({ x: 0.18, y: 0.38 }))),
        b: addZone(G, Object.assign({ wedge: k, proto: 'sideB' }, turn({ x: 0.62, y: 0.82 })))
      };
    });
    const center = addZone(G, { cls: 'center', tier: 3, proto: 'center', town: G.w >= 112 });
    for (const q of parts) {
      tie(G, q.s, q.a);
      tie(G, q.s, q.b);
      tie(G, q.a, center);
      tie(G, q.b, center);
    }
    tie(G, parts[0].a, parts[1].b);
    tie(G, parts[0].b, parts[1].a);
  };

  const ringMap = G => {
    const n = G.n, a0 = n === 4 ? Math.PI / 4 : n === 2 ? Math.PI * 0.75 : G.rng() * TAU;
    G.rules = { wedges: n, a0, crossWedge: true };
    const starts = [], sides = [];
    for (let i = 0; i < n; i++) {
      starts.push(startZone(G, i, polar(0.39, a0 + i * TAU / n), i));
      sides.push(addZone(G, Object.assign({ wedge: i, proto: 'side', town: G.w >= 80 || n <= 2 }, polar(0.4, a0 + (i + 0.5) * TAU / n))));
    }
    const center = addZone(G, { cls: 'center', tier: 3, proto: 'center', town: G.w >= 112 });
    for (let i = 0; i < n; i++) {
      tie(G, starts[i], sides[i]);
      tie(G, sides[i], starts[(i + 1) % n]);
      tie(G, sides[i], center);
    }
  };

  const starMap = G => {
    const n = G.n, a0 = n === 4 ? Math.PI / 4 : G.rng() * TAU;
    G.rules = { wedges: n, a0, crossWedge: false };
    const center = addZone(G, { cls: 'center', tier: 3, proto: 'center', town: G.w >= 80 });
    for (let i = 0; i < n; i++) tie(G, startZone(G, i, polar(0.4, a0 + i * TAU / n), i), center);
  };

  const bowlMap = G => {
    const n = G.n, a0 = n === 4 ? Math.PI / 4 : n === 2 ? Math.PI * 0.75 : G.rng() * TAU;
    G.rules = { wedges: n, a0, crossWedge: true, disc: 0.2, sea: true };
    addZone(G, { cls: 'sea', sea: true, tier: 1, proto: 'sea' });
    const starts = [], sides = [];
    for (let i = 0; i < n; i++) {
      starts.push(startZone(G, i, polar(0.38, a0 + i * TAU / n), i));
      sides.push(addZone(G, Object.assign({ wedge: i, proto: 'side', town: G.w >= 80 }, polar(0.38, a0 + (i + 0.5) * TAU / n))));
    }
    for (let i = 0; i < n; i++) {
      tie(G, starts[i], sides[i]);
      tie(G, sides[i], starts[(i + 1) % n]);
    }
    const count = G.w >= 80 ? 3 : 1, reach = count > 1 ? 0.1 : 0, radius = Math.max(5, G.w * 0.055);
    for (let i = 0; i < count; i++) addZone(G, Object.assign({ cls: 'islet', tier: 3, proto: 'islet', radius }, polar(reach, a0 + i * TAU / count)));
  };

  const islandsMap = G => {
    const n = G.n, a0 = n === 4 ? Math.PI / 4 : n === 2 ? Math.PI * 0.75 : G.rng() * TAU, w = G.w;
    G.rules = { wedges: n, a0, crossWedge: true, sea: true, islands: true };
    addZone(G, { cls: 'sea', sea: true, tier: 1, proto: 'sea' });
    const radius = H.clamp(0.32 * w * Math.sin(Math.PI / n) * 0.86, 7.5, 15);
    for (let i = 0; i < n; i++) startZone(G, i, Object.assign({ radius }, polar(0.32, a0 + i * TAU / n)), i);
    addZone(G, { cls: 'center', tier: 3, proto: 'center', radius: H.clamp(w * 0.1, 5, 12), town: w >= 112 });
    const side = H.clamp(w * 0.085, 5, 10), from = 0.32 * w * Math.sin(Math.PI / n) * 2;
    if (from >= radius * 2 + side) return;
    for (let i = 0; i < n; i++) addZone(G, Object.assign({ wedge: i, proto: 'side', radius: side }, polar(0.42, a0 + (i + 0.5) * TAU / n)));
  };

  const underMap = G => {
    const n = G.n, a0 = n === 4 ? Math.PI / 4 : n === 2 ? Math.PI * 0.75 : G.rng() * TAU;
    G.rules = { wedges: n, a0, crossWedge: false, underCross: true };
    G.hasUnder = true;
    const below = [];
    for (let i = 0; i < n; i++) {
      const s = startZone(G, i, polar(0.3, a0 + i * TAU / n), i);
      const u = addZone(G, Object.assign({ l: 1, wedge: i, tier: 2, proto: 'under' }, polar(0.32, a0 + i * TAU / n)));
      below.push(u);
      G.stairs.push([s, u]);
    }
    const center = addZone(G, { l: 1, cls: 'center', tier: 3, proto: 'undercenter' });
    below.forEach((u, i) => {
      if (n > 2) tie(G, u, below[(i + 1) % n]);
      tie(G, u, center);
    });
  };

  const eightMap = G => {
    const a0 = G.rng() * TAU;
    G.rules = { wedges: 4, a0: a0 + TAU / 16, crossWedge: true };
    const inner = [];
    for (let j = 0; j < 4; j++) inner.push(addZone(G, Object.assign({ wedge: j, proto: 'inner', tier: 2, town: true }, polar(0.23, a0 + (2 * j + 0.5) * TAU / 8))));
    for (let i = 0; i < 8; i++) tie(G, startZone(G, i, polar(0.42, a0 + i * TAU / 8), i >> 1), inner[i >> 1]);
    const center = addZone(G, { cls: 'center', tier: 3, proto: 'center', town: G.w >= 112 });
    for (let j = 0; j < 4; j++) {
      tie(G, inner[j], inner[(j + 1) % 4]);
      tie(G, inner[j], center);
    }
  };

  const TEMPLATES = {
    duel: { name: 'Дуэль', min: 2, max: 2, build: duelMap, about: 'Двое в противоположных углах. Два пути к сопернику и богатая середина.' },
    ring: { name: 'Кольцо', min: 2, max: 8, build: ringMap, about: 'Края кольцом вокруг середины. Сосед всегда через ничейную землю.' },
    bowl: { name: 'Чаша', min: 2, max: 6, build: bowlMap, sea: true, about: 'Море в середине, на его островах лучшие сокровища. По берегу ходят пешком.' },
    star: { name: 'Звезда', min: 4, max: 8, build: starMap, about: 'Все дороги ведут в общую сокровищницу, других путей к соседу нет.' },
    islands: { name: 'Острова', min: 2, max: 6, build: islandsMap, sea: true, about: 'У каждого свой остров и верфь. Без корабля никуда.' },
    under: { name: 'Подлунье', min: 2, max: 4, build: underMap, under: true, about: 'Наверху у каждого свой тупик. К соседу можно пройти только через Подлунье.' },
    eight: { name: 'Восемь', min: 8, max: 8, build: eightMap, about: 'Восемь краёв парами, у каждой пары общая земля, в середине главный приз.' }
  };

  const sizesFor = (id, n) => MF.SIZES.map(s => s[1]).filter(w => (n <= 4 && id !== 'eight' ? true : w >= 80));
  const playersFor = (id, w) => {
    const T = TEMPLATES[id], out = [];
    for (let n = T.min; n <= T.max; n++) if (sizesFor(id, n).includes(w)) out.push(n);
    return out;
  };

  const addUnder = G => {
    const R = G.rules, wedges = R.wedges, below = [];
    R.underCross = true;
    for (let i = 0; i < wedges; i++) {
      const host = G.zones.find(z => z.wedge === i && z.l === 0 && z.cls === 'side') || G.zones.find(z => z.wedge === i && z.l === 0 && z.cls === 'start');
      const u = addZone(G, { l: 1, wedge: i, tier: 2, proto: 'under', x: host.x, y: host.y });
      below.push(u);
      G.stairs.push([host, u]);
    }
    const center = addZone(G, { l: 1, cls: 'center', tier: 3, proto: 'undercenter' });
    below.forEach((u, i) => {
      if (wedges > 2) tie(G, u, below[(i + 1) % wedges]);
      tie(G, u, center);
    });
  };

  const addFillers = (G, l) => {
    const R = G.rules, w = G.w, own = G.zones.filter(z => z.l === l && !z.sea), share = l === 0 && R.disc ? 1 - Math.PI * R.disc * R.disc : 1, step = TAU / R.wedges;
    const isle = l === 0 && !!R.islands;
    const want = isle ? Math.round(w * w * 0.5 / (TARGET_AREA * 0.7)) : Math.round(w * w * share / TARGET_AREA);
    const perWedge = Math.floor((want - own.length) / R.wedges), spacing = 0.62 * Math.sqrt(TARGET_AREA) / w, lo = R.disc ? R.disc + 0.08 : 0.14;
    for (let k = 0; k < perWedge; k++) {
      let best = null;
      for (let t = 0; t < 36; t++) {
        const a = R.a0 + (G.rng() - 0.5) * step, r = lo + Math.sqrt(G.rng()) * (0.47 - lo), p = polar(r, a), radius = isle ? 5 + G.rng() * 4 : 0;
        let d = Infinity;
        for (let i = 0; i < R.wedges; i++) {
          const q = rotate(p, i * step);
          for (const z of G.zones) {
            if (z.l !== l || z.sea) continue;
            d = Math.min(d, Math.hypot(q.x - z.x, q.y - z.y) - (isle ? (z.radius + radius + 3) / w : 0));
          }
          if (i > 0) d = Math.min(d, Math.hypot(q.x - p.x, q.y - p.y) - (isle ? (radius * 2 + 3) / w : 0));
        }
        if (!best || d > best.d) best = { d, r, p, radius };
      }
      if (best.d < (isle ? 0 : spacing)) break;
      const tier = Math.min(3, (best.r > 0.3 ? 1 : best.r > 0.17 ? 2 : 3) + (l ? 1 : 0));
      for (let i = 0; i < R.wedges; i++) addZone(G, Object.assign({ l, wedge: i, tier, cls: 'filler', filler: true, proto: 'f' + l + '-' + k, radius: best.radius }, rotate(best.p, i * step)));
    }
  };

  const partition = (G, l) => {
    const w = G.w, rng = G.rng, zones = G.zones.filter(z => z.l === l), islands = zones.filter(z => z.radius > 0), open = zones.filter(z => !z.sea && !z.radius), sea = zones.find(z => z.sea);
    const zone = new Int32Array(w * w), amp = Math.min(3.5, w * 0.04), p = Array.from({ length: 6 }, () => rng() * TAU), disc = l === 0 && G.rules.disc ? G.rules.disc * w : 0;
    for (let r = 0; r < w; r++) {
      for (let c = 0; c < w; c++) {
        const x = c + amp * (Math.sin(c * 0.13 + p[0]) * Math.cos(r * 0.17 + p[1]) + 0.5 * Math.sin((c + r) * 0.31 + p[2]));
        const y = r + amp * (Math.sin(r * 0.13 + p[3]) * Math.cos(c * 0.17 + p[4]) + 0.5 * Math.sin((c - r) * 0.31 + p[5]));
        let best = -1;
        for (const z of islands) if (Math.hypot(x - z.x * w, y - z.y * w) <= z.radius) best = z.id;
        if (best < 0 && sea && (!open.length || (disc && Math.hypot(x - w / 2, y - w / 2) <= disc))) best = sea.id;
        if (best < 0 && open.length) {
          let dist = Infinity;
          for (const z of open) {
            const dx = x - z.x * w, dy = y - z.y * w, d = dx * dx + dy * dy;
            if (d < dist) {
              dist = d;
              best = z.id;
            }
          }
        }
        if (best < 0) best = sea ? sea.id : zones[0].id;
        zone[r * w + c] = best;
      }
    }
    return zone;
  };

  const neighbourPairs = (G, l) => {
    const w = G.w, zone = G.zone[l], border = new Uint8Array(w * w), shared = new Map();
    for (let r = 0; r < w; r++) {
      for (let c = 0; c < w; c++) {
        const i = r * w + c, z = zone[i];
        for (const [dc, dr] of H.Path.DIRS) {
          const x = c + dc, y = r + dr;
          if (x < 0 || y < 0 || x >= w || y >= w) continue;
          const o = zone[y * w + x];
          if (o === z) continue;
          border[i] = 1;
          if (dc && dr) continue;
          const key = Math.min(z, o) * 1000 + Math.max(z, o);
          shared.set(key, (shared.get(key) || 0) + 1);
        }
      }
    }
    G.border[l] = border;
    G.shared[l] = shared;
  };
  const touching = (G, a, b) => a.l === b.l && (G.shared[a.l].get(Math.min(a.id, b.id) * 1000 + Math.max(a.id, b.id)) || 0) >= MIN_SHARED;
  const mayJoin = (G, a, b) => (a.l === 1 && G.rules.underCross) || G.rules.crossWedge || a.wedge === b.wedge || a.wedge < 0 || b.wedge < 0;

  const planLinks = G => {
    const final = [], seen = new Set(), parent = G.zones.map(z => z.id);
    const root = i => (parent[i] === i ? i : (parent[i] = root(parent[i])));
    const add = (a, b) => {
      const key = Math.min(a.id, b.id) + ':' + Math.max(a.id, b.id);
      if (seen.has(key)) return;
      seen.add(key);
      final.push([a, b]);
      parent[root(a.id)] = root(b.id);
    };
    const land = G.zones.filter(z => !z.sea && !z.radius);
    for (const [a, b] of G.links) {
      if (touching(G, a, b)) {
        add(a, b);
        continue;
      }
      const prev = new Map([[a.id, null]]), queue = [a];
      while (queue.length && !prev.has(b.id)) {
        const u = queue.shift();
        for (const v of land) {
          if (prev.has(v.id) || !touching(G, u, v) || !mayJoin(G, u, v)) continue;
          if (v !== b && !v.filler) continue;
          prev.set(v.id, u);
          queue.push(v);
        }
      }
      if (!prev.has(b.id)) continue;
      for (let v = b; prev.get(v.id); v = prev.get(v.id)) add(prev.get(v.id), v);
    }
    const anchored = z => land.some(q => !q.filler && root(q.id) === root(z.id));
    for (let pass = 0; pass < land.length; pass++) {
      const lost = land.filter(z => z.filler && !anchored(z));
      if (!lost.length) break;
      for (const z of lost) {
        const near = land.filter(q => q !== z && touching(G, z, q) && anchored(q) && !(q.cls === 'start' && final.filter(x => x[0] === q || x[1] === q).length >= 3));
        const pal = near.sort((p, q) => Math.abs(p.tier - z.tier) - Math.abs(q.tier - z.tier))[0];
        if (!pal) continue;
        if (!mayJoin(G, z, pal)) z.wedge = pal.wedge;
        add(z, pal);
      }
    }
    for (const a of land) {
      for (const b of land) {
        if (a.id < b.id && a.filler && b.filler && touching(G, a, b) && mayJoin(G, a, b) && G.rng() < 0.25) add(a, b);
      }
    }
    return final;
  };

  const groundFor = (G, z) => {
    if (G.protoGround.has(z.proto + ':' + (z.cls === 'start' ? z.player : ''))) return G.protoGround.get(z.proto + ':' + (z.cls === 'start' ? z.player : ''));
    let id;
    if (z.cls === 'start') id = NATIVE[G.factions[z.player]] || 'meadow';
    else if (z.l === 1) id = G.rng() < 0.3 ? 'fungal' : 'cave';
    else if (z.cls === 'center') id = pick(['palegrass', 'saltflat', 'highland'], G.rng);
    else id = pick(WILD, G.rng);
    G.protoGround.set(z.proto + ':' + (z.cls === 'start' ? z.player : ''), id);
    return id;
  };
  const baseOf = (G, z) => {
    if (z.sea) return 'water';
    if (z.cls !== 'start' && z.l === 0 && z.wedge >= 0 && G.wedgeNative[z.wedge] && z.tier === 1 && G.protoNative.has(z.proto)) return G.wedgeNative[z.wedge];
    return groundFor(G, z);
  };

  const borderKind = (G, a, b) => {
    const key = Math.min(a.id, b.id) * 1000 + Math.max(a.id, b.id);
    if (G.kinds.has(key)) return G.kinds.get(key);
    let kind;
    if (a.sea || b.sea || a.radius || b.radius) kind = 'water';
    else if (a.l === 1) kind = 'rock';
    else if (G.water === 'many') kind = 'water';
    else if (G.water === 'few' && G.rng() < 0.15) kind = 'water';
    else kind = a.base === 'forest' || b.base === 'forest' || G.rng() < 0.3 ? 'thicket' : 'rock';
    G.kinds.set(key, kind);
    return kind;
  };

  const paintGround = G => {
    const w = G.w, M = G.M, I = H.TERRAIN_INDEX;
    for (const z of G.zones) z.base = baseOf(G, z);
    for (let l = 0; l < M.levels; l++) {
      const zone = G.zone[l], border = G.border[l], ter = M.ter[l], sea = G.sea[l];
      for (let r = 0; r < w; r++) {
        for (let c = 0; c < w; c++) {
          const i = r * w + c, z = G.zones[zone[i]];
          if (!border[i]) {
            ter[i] = I[z.base];
            if (z.sea) sea[i] = 1;
            continue;
          }
          let other = z;
          for (const [dc, dr] of H.Path.DIRS) {
            const x = c + dc, y = r + dr;
            if (x < 0 || y < 0 || x >= w || y >= w) continue;
            if (zone[y * w + x] !== z.id) {
              other = G.zones[zone[y * w + x]];
              break;
            }
          }
          const kind = z.sea ? 'water' : borderKind(G, z, other);
          ter[i] = I[kind];
          if (kind === 'water') sea[i] = 1;
        }
      }
    }
  };

  const cellsOfZones = G => {
    const w = G.w;
    for (const z of G.zones) {
      z.all = [];
      z.cx = 0;
      z.cy = 0;
    }
    for (let l = 0; l < G.M.levels; l++) {
      const zone = G.zone[l];
      for (let i = 0; i < w * w; i++) {
        const z = G.zones[zone[i]];
        z.all.push(i);
        z.cx += i % w;
        z.cy += (i / w) | 0;
      }
    }
    for (const z of G.zones) {
      z.cx /= Math.max(1, z.all.length);
      z.cy /= Math.max(1, z.all.length);
    }
  };

  const patches = G => {
    const w = G.w, M = G.M, I = H.TERRAIN_INDEX, rng = G.rng;
    const blob = (z, id, c0, r0, rad) => {
      const ter = M.ter[z.l], zone = G.zone[z.l], border = G.border[z.l];
      for (let r = Math.max(0, Math.floor(r0 - rad)); r <= Math.min(w - 1, r0 + rad); r++) {
        for (let c = Math.max(0, Math.floor(c0 - rad)); c <= Math.min(w - 1, c0 + rad); c++) {
          const i = r * w + c;
          if (zone[i] === z.id && !border[i] && Math.hypot(c - c0, r - r0) <= rad * (0.8 + 0.3 * rng())) ter[i] = I[id];
        }
      }
    };
    for (const z of G.zones) {
      if (z.sea || z.all.length < 60) continue;
      const count = Math.max(1, Math.round(z.all.length / 220)), inside = z.all.filter(i => !G.border[z.l][i]);
      for (let k = 0; k < count; k++) {
        const i = pick(inside, rng), c = i % w, r = (i / w) | 0, second = SECOND[z.base];
        if (second && Math.hypot(c - z.cx, r - z.cy) > 2) blob(z, second, c, r, z.cls === 'start' ? 2 : 2 + rng() * 2);
      }
      if (z.cls === 'start') continue;
      const far = inside.filter(i => Math.hypot(i % w - z.cx, ((i / w) | 0) - z.cy) > 5);
      if (!far.length) continue;
      const spot = pick(far, rng), c = spot % w, r = (spot / w) | 0;
      if (z.l === 1) blob(z, 'rock', c, r, 1 + rng());
      else if (G.water !== 'none' && rng() < 0.5) {
        blob(z, 'water', c, r, 2 + rng());
        if (G.water === 'few' && rng() < 0.5) MF.river(M, 0, 1 + Math.floor(rng() * 2), [[c, r], [Math.round(z.cx), Math.round(z.cy)]]);
      } else if (z.base === 'ash' && rng() < 0.5) blob(z, 'lava', c, r, 1 + rng());
    }
  };

  const fieldPatches = G => {
    const w = G.w, ids = H.FIELDS.filter(Boolean).map(f => f.id), rng = G.rng;
    for (const z of G.zones) {
      if (z.sea || z.tier < 2 || rng() > 0.45) continue;
      const inside = z.all.filter(i => !G.border[z.l][i]);
      if (!inside.length) continue;
      const at = pick(inside, rng), c0 = at % w, r0 = (at / w) | 0, v = H.FIELD_INDEX[pick(ids, rng)];
      for (let r = r0 - 2; r <= r0 + 2; r++) {
        for (let c = c0 - 2; c <= c0 + 2; c++) {
          if (c < 0 || r < 0 || c >= w || r >= w) continue;
          const i = r * w + c;
          if (G.zone[z.l][i] === z.id && !G.border[z.l][i] && Math.hypot(c - c0, r - r0) <= 2.3) G.M.over[z.l][i] = v;
        }
      }
    }
  };

  const tubeOf = (G, path, dx, dy, width, ok) => {
    const w = G.w, zone = G.zone[G.carving], tube = new Set();
    for (const i of path) {
      const c = i % w, r = (i / w) | 0;
      for (let k = -width; k <= width; k++) {
        const x = c + (dy ? k : 0), y = r + (dx ? k : 0);
        if (x < 0 || y < 0 || x >= w || y >= w || !ok(zone[y * w + x])) return null;
        tube.add(y * w + x);
      }
    }
    for (const t of tube) {
      const c = t % w, r = (t / w) | 0;
      for (const [nc, nr] of H.Path.DIRS) {
        const x = c + nc, y = r + nr;
        if (x >= 0 && y >= 0 && x < w && y < w && !ok(zone[y * w + x])) return null;
      }
    }
    return tube;
  };
  const sealed = (G, a, b, tube, q, from, to) => {
    const w = G.w, l = a.l, zone = G.zone[l], border = G.border[l], ter = G.M.ter[l], seen = new Set([from]), stack = [from], reach = 11;
    while (stack.length) {
      const i = stack.pop(), c = i % w, r = (i / w) | 0;
      if (i === to) return false;
      for (const [dc, dr] of H.Path.DIRS) {
        const x = c + dc, y = r + dr;
        if (x < 0 || y < 0 || x >= w || y >= w) continue;
        const n = y * w + x, far = Math.max(Math.abs(x - q.c), Math.abs(y - q.r));
        if (seen.has(n) || far <= 1 || far > reach) continue;
        if (!tube.has(n) && (border[n] || !H.TERRAIN[ter[n]].cost || (zone[n] !== a.id && zone[n] !== b.id))) continue;
        seen.add(n);
        stack.push(n);
      }
    }
    return true;
  };

  const carve = (G, a, b) => {
    const l = a.l, w = G.w, zone = G.zone[l], border = G.border[l], ter = G.M.ter[l], ok = q => q === a.id || q === b.id, mx = (a.cx + b.cx) / 2, my = (a.cy + b.cy) / 2;
    G.carving = l;
    const cand = [];
    for (const i of a.all) {
      if (!border[i]) continue;
      const c = i % w, r = (i / w) | 0;
      let touches = false, clean = true;
      for (let y = r - 2; y <= r + 2 && clean; y++) {
        for (let x = c - 2; x <= c + 2; x++) {
          if (x < 0 || y < 0 || x >= w || y >= w) {
            clean = false;
            break;
          }
          const q = zone[y * w + x];
          if (!ok(q)) {
            clean = false;
            break;
          }
          if (q === b.id) touches = true;
        }
      }
      if (clean && touches) cand.push({ i, c, r, d: Math.hypot(c - mx, r - my) + G.rng() * 2 });
    }
    cand.sort((p, q) => p.d - q.d);
    const vx = b.cx - a.cx, vy = b.cy - a.cy, axes = Math.abs(vx) >= Math.abs(vy) ? [[Math.sign(vx) || 1, 0], [0, Math.sign(vy) || 1]] : [[0, Math.sign(vy) || 1], [Math.sign(vx) || 1, 0]];
    const walk = (c, r, dx, dy, target) => {
      const out = [];
      for (let k = 1; k <= 12; k++) {
        const x = c + dx * k, y = r + dy * k;
        if (x < 1 || y < 1 || x >= w - 1 || y >= w - 1) return null;
        const i = y * w + x;
        if (!ok(zone[i])) return null;
        out.push(i);
        if (zone[i] === target && !border[i]) return G.main[l][i] ? out : null;
      }
      return null;
    };
    for (const q of cand.slice(0, 36)) {
      for (const [dx, dy] of axes) {
        const ahead = walk(q.c, q.r, dx, dy, b.id), back = walk(q.c, q.r, -dx, -dy, a.id);
        if (!ahead || !back) continue;
        const path = [...back.slice().reverse(), q.i, ...ahead];
        const tube = [1, 0].map(width => tubeOf(G, path, dx, dy, width, ok)).find(cells => cells && sealed(G, a, b, cells, q, path[0], path[path.length - 1]));
        if (!tube) continue;
        const kind = borderKind(G, a, b);
        for (const t of tube) {
          if (border[t] || !H.TERRAIN[ter[t]].cost) ter[t] = H.TERRAIN_INDEX[kind === 'water' ? 'sand' : G.zones[zone[t]].base];
          border[t] = 0;
          G.sea[l][t] = 0;
          G.keep[l][t] = 1;
        }
        return { a, b, path, mid: q.i };
      }
    }
    return null;
  };

  const linkUp = (G, passes) => {
    const land = G.zones.filter(z => !z.sea && !z.radius), parent = G.zones.map(z => z.id);
    const root = i => (parent[i] === i ? i : (parent[i] = root(parent[i])));
    const join = (a, b) => {
      parent[root(a.id)] = root(b.id);
    };
    for (const p of passes) join(p.a, p.b);
    for (const [a, b] of G.stairs) join(a, b);
    let changed = true;
    while (changed) {
      changed = false;
      for (const a of land) {
        for (const b of land) {
          if (a.id >= b.id || root(a.id) === root(b.id) || !touching(G, a, b) || !mayJoin(G, a, b) || (a.cls === 'start' && b.cls === 'start')) continue;
          const pass = carve(G, a, b);
          if (!pass) continue;
          passes.push(pass);
          join(a, b);
          changed = true;
        }
      }
    }
  };

  const openCell = (G, z, i) => G.zone[z.l][i] === z.id && !!G.main[z.l][i] && !G.border[z.l][i] && H.TERRAIN[G.M.ter[z.l][i]].cost > 0;
  const mainParts = G => {
    const w = G.w;
    for (let l = 0; l < G.M.levels; l++) G.main[l] = new Uint8Array(w * w);
    for (const z of G.zones) {
      if (z.sea) continue;
      const l = z.l, zone = G.zone[l], border = G.border[l], ter = G.M.ter[l], seen = new Set();
      let best = [];
      for (const start of z.all) {
        if (seen.has(start) || border[start] || !H.TERRAIN[ter[start]].cost) continue;
        const part = [start], stack = [start];
        seen.add(start);
        while (stack.length) {
          const i = stack.pop(), c = i % w, r = (i / w) | 0;
          for (const [dc, dr] of ORTHO) {
            const x = c + dc, y = r + dr;
            if (x < 0 || y < 0 || x >= w || y >= w) continue;
            const q = y * w + x;
            if (seen.has(q) || zone[q] !== z.id || border[q] || !H.TERRAIN[ter[q]].cost) continue;
            seen.add(q);
            part.push(q);
            stack.push(q);
          }
        }
        if (part.length > best.length) best = part;
      }
      for (const i of best) G.main[l][i] = 1;
      z.size = best.length;
    }
  };
  const fits = (G, z, t, c, r) => {
    const def = H.OBJ[t], [fw, fh] = def.foot, l = z.l, w = G.w, solid = G.solid[l], door = G.door[l], keep = G.keep[l], road = G.M.road[l];
    if (c < 0 || r < 0 || c + fw > w || r + fh > w) return false;
    for (let y = r - 1; y <= r + fh; y++) {
      for (let x = c - 1; x <= c + fw; x++) {
        if (x < 0 || y < 0 || x >= w || y >= w) continue;
        const i = y * w + x;
        if (solid[i]) return false;
        if (x < c || y < r || x >= c + fw || y >= r + fh) continue;
        if (!openCell(G, z, i) || road[i] || keep[i] || door[i]) return false;
      }
    }
    if (!def.entry) return true;
    const ec = c + def.entry[0], er = r + def.entry[1], front = (er + 1) * w + ec;
    if (er + 1 >= w) return false;
    if (!openCell(G, z, front) || solid[front] || G.zoc[l][er * w + ec] || G.zoc[l][front]) return false;
    return true;
  };

  const keepsWay = (G, z, t, c, r) => {
    const def = H.OBJ[t], [fw, fh] = def.foot, l = z.l, w = G.w, solid = G.solid[l], mob = G.mob[l], door = G.door[l], stamp = G.stamp[l], placed = [];
    const front = def.entry ? (r + def.entry[1] + 1) * w + c + def.entry[0] : -1, goals = front >= 0 ? [...z.anchors, front] : z.anchors;
    if (goals.length < 2 && !z.hub) return true;
    for (let y = r; y < r + fh; y++) {
      for (let x = c; x < c + fw; x++) {
        solid[y * w + x] = 1;
        placed.push(y * w + x);
      }
    }
    const id = ++G.stampId, from = z.hub ? z.hub[1] * w + z.hub[0] : goals[0], stack = [from];
    stamp[from] = id;
    while (stack.length) {
      const i = stack.pop(), x0 = i % w, y0 = (i / w) | 0;
      for (const [dc, dr] of ORTHO) {
        const x = x0 + dc, y = y0 + dr;
        if (x < 0 || y < 0 || x >= w || y >= w) continue;
        const q = y * w + x;
        if (stamp[q] === id || !openCell(G, z, q)) continue;
        if (solid[q] && !mob[q]) {
          if (door[q] > 0) stamp[q] = id;
          continue;
        }
        stamp[q] = id;
        stack.push(q);
      }
    }
    for (const i of placed) solid[i] = 0;
    return goals.every(i => stamp[i] === id);
  };

  const spawn = (G, z, t, c, r, extra) => {
    const l = z.l, w = G.w, def = H.OBJ[t], [fw, fh] = def.foot, o = MD.add(G.M, Object.assign({ t, c, r, l, owner: -1 }, extra || {}));
    for (let y = r; y < r + fh; y++) for (let x = c; x < c + fw; x++) G.solid[l][y * w + x] = 1;
    if (def.entry) {
      const ec = c + def.entry[0], er = r + def.entry[1];
      G.door[l][er * w + ec] = o.id;
      if (er + 1 < w) {
        G.door[l][(er + 1) * w + ec] = o.id;
        z.anchors.push((er + 1) * w + ec);
      }
    }
    G.home.set(o.id, z.id);
    return o;
  };

  const zocClean = (G, l, c, r, ward) => {
    const w = G.w, door = G.door[l], road = G.M.road[l], keep = G.keep[l];
    for (let y = r - 1; y <= r + 1; y++) {
      for (let x = c - 1; x <= c + 1; x++) {
        if (x < 0 || y < 0 || x >= w || y >= w) continue;
        const i = y * w + x;
        if (road[i] || keep[i] || (door[i] && !(ward && ward.includes(i)))) return false;
      }
    }
    return true;
  };
  const markZoc = (G, l, c, r) => {
    const w = G.w;
    for (let y = r - 1; y <= r + 1; y++) for (let x = c - 1; x <= c + 1; x++) if (x >= 0 && y >= 0 && x < w && y < w) G.zoc[l][y * w + x] = 1;
  };

  const guardPool = G => {
    if (G.pool) return G.pool;
    const ids = Object.values(H.UNITS).filter(u => u.faction === 'neutral').map(u => u.id);
    for (const f of Object.values(H.FACTIONS)) for (const row of f.units) if (H.UNITS[row[0]].tier <= 5) ids.push(row[0]);
    G.pool = ids.map(id => H.UNITS[id] && Object.assign({ id }, H.UNITS[id])).filter(Boolean);
    return G.pool;
  };
  const guardOf = (G, value, ground, tier, wet) => {
    const rng = G.rng, v = Math.max(120, value * G.power);
    if (wet) {
      const unit = v > 6000 ? 'seaserpent' : 'pirates';
      return { unit, count: Math.max(1, Math.round(v / H.UNITS[unit].cost)) };
    }
    const pool = guardPool(G).filter(u => !WET_UNITS.includes(u.id) && !(TOP_UNITS.includes(u.id) && tier < 3)), fit = pool.filter(u => v / u.cost >= 3 && v / u.cost <= 60);
    const liked = fit.filter(u => WHERE[u.id] && WHERE[u.id].includes(ground));
    const list = liked.length && rng() < 0.7 ? liked : fit.length ? fit : pool;
    const u = pick(list, rng);
    return { unit: u.id, count: Math.max(1, Math.round(v / u.cost)) };
  };
  const moodOf = (G, tier) => (tier === 3 ? 'fierce' : tier === 0 ? (G.rng() < 0.5 ? 'cautious' : 'hostile') : G.rng() < 0.15 ? 'friendly' : 'hostile');
  const monsterProps = (g, mood) => ({ unit: g.unit, count: g.count, max: g.count * 3, mood });

  const worthOf = o => {
    const def = H.OBJ[o.t];
    if (def.kind === 'pile') return (o.amount || (def.amount[0] + def.amount[1]) / 2) * (def.res === 'gold' ? 1 : H.TOWN.value[def.res]);
    if (def.kind === 'mine') return H.mineRes(o) ? MINE_WORTH[H.mineRes(o)] : 3000;
    if (def.kind === 'chest') return CHEST_WORTH[o.offer || 0];
    if (def.kind === 'campfire') return 1000;
    if (def.kind === 'artifact') return H.ARTIFACTS[o.art].cost;
    if (def.kind === 'scroll') return 1200;
    if (def.kind === 'shrine') return SHRINE_WORTH[def.circle];
    if (def.kind === 'dwelling') return H.UNITS[def.unit].growth * H.UNITS[def.unit].cost * 1.5;
    if (def.kind === 'vault') return H.Sites.vaultValue(o);
    return def.worth || 500;
  };

  const artsOf = rank => Object.values(H.ARTIFACTS).filter(a => a.rank === rank && !a.set && a.slot !== 'scroll' && !a.scroll);
  const spellsOf = circle => Object.values(H.SPELLS).filter(s => s.circle === circle && s.school !== 'road');
  const propsFor = (G, t, tier) => {
    const def = H.OBJ[t], rng = G.rng;
    if (def.kind === 'artifact') return { art: pick(artsOf(tier >= 3 ? 'relic' : tier === 2 ? 'rare' : 'plain'), rng).id };
    if (def.kind === 'chest') return { offer: Math.max(0, tier - 1) };
    if (def.kind === 'shrine') return { spell: pick(spellsOf(def.circle), rng).id };
    if (def.kind === 'prison') return { hid: null, level: 3 + tier * 2 };
    if (def.kind === 'quest') {
      const need = pick([{ kind: 'res', res: { wood: 6 + tier * 2 } }, { kind: 'res', res: { ore: 6 + tier * 2 } }, { kind: 'foes', count: 1 }], rng);
      return { quest: need, reward: { gold: 1500 + tier * 1000, xp: 500 + tier * 500 } };
    }
    return {};
  };
  const specFor = (G, t, tier, ground, more) => {
    const extra = Object.assign(propsFor(G, t, tier), more || {}), probe = Object.assign({ t }, extra), worth = worthOf(probe), def = H.OBJ[t];
    const spec = { t, extra, worth, near: null, guard: null };
    if (def.kind === 'vault') return spec;
    if (MF.valuable(probe) || G.rng() < GUARD_CHANCE[tier]) {
      const g = guardOf(G, Math.max(300, worth * GUARD_RATIO[tier]), ground, tier);
      spec.guard = monsterProps(g, moodOf(G, tier));
    }
    return spec;
  };

  const startKit = (G, faction, proto) => {
    const rng = G.rng, kit = [], ground = NATIVE[faction] || 'meadow', own = (H.FACTIONS[faction].rare || []).slice(0, 2), rest = ['amber', 'sulfur', 'salt'].filter(r => !own.includes(r));
    const rares = [...own, ...rest].slice(0, 2), near = [3, 13], mid = [6, 30];
    const put = (t, range, more, tier) => {
      const s = specFor(G, t, tier == null ? 0 : tier, ground, more);
      s.near = range;
      kit.push(s);
    };
    put('sawmill', near);
    put('oremine', near);
    put('goldmine', mid);
    for (const res of rares) put(RARE_MINE[res], mid);
    if (proto.weekly) put(proto.weekly, mid);
    if (proto.small) put(proto.small, mid);
    for (const t of ['res-wood', 'res-ore', 'res-gold', 'campfire']) put(t, near);
    kit.push(Object.assign(specFor(G, 'artifact', 1, ground, { art: proto.art }), { near: mid }));
    if (proto.shrine) kit.push(Object.assign(specFor(G, 'shrine1', 0, ground, { spell: proto.spell }), { near: mid }));
    return kit.sort((a, b) => H.OBJ[b.t].foot[0] * H.OBJ[b.t].foot[1] - H.OBJ[a.t].foot[0] * H.OBJ[a.t].foot[1]);
  };

  const kitFor = (G, z) => {
    if (G.kits.has(z.proto)) return G.kits.get(z.proto);
    const rng = G.rng, kit = [], ground = z.base, tier = Math.max(1, z.tier), shore = !!z.shore;
    let budget = z.all.length * BUDGET[tier] * (z.l ? 1.2 : 1);
    if (z.town) budget -= 12000;
    const cap = Math.max(2, Math.floor(z.all.length / 26)), used = new Set();
    const allowed = PIECES.filter(p => tier >= p.lo && tier <= p.hi && (!p.under || z.l === 1) && (!p.shore || shore) && (!p.on || p.on.includes(ground)));
    const rows = Object.entries(H.OBJ).filter(([t, d]) => d.kind === 'dwelling' && d.flag && H.UNITS[d.unit] && H.UNITS[d.unit].tier >= Math.max(1, tier * 2 - 1) && H.UNITS[d.unit].tier <= tier * 2 + 1);
    const total = () => allowed.reduce((t, p) => t + (p.once && used.has(p.t) ? 0 : p.weight), 0) + 2;
    for (let guard = 0; guard < 80 && budget > 0 && kit.length < cap; guard++) {
      let roll = rng() * total(), choice = null;
      for (const p of allowed) {
        if (p.once && used.has(p.t)) continue;
        roll -= p.weight;
        if (roll <= 0) {
          choice = p;
          break;
        }
      }
      if (!choice && rows.length) {
        const [t] = pick(rows, rng);
        if (used.has(t)) continue;
        used.add(t);
        const s = specFor(G, t, tier, ground);
        kit.push(s);
        budget -= s.worth;
        continue;
      }
      if (!choice) continue;
      used.add(choice.t);
      const s = specFor(G, choice.t, tier, ground, choice.tier != null ? { tier: choice.tier } : null);
      kit.push(s);
      budget -= s.worth;
    }
    kit.sort((a, b) => H.OBJ[b.t].foot[0] * H.OBJ[b.t].foot[1] - H.OBJ[a.t].foot[0] * H.OBJ[a.t].foot[1]);
    const wander = Math.max(1, Math.round(z.all.length / 320));
    for (let k = 0; k < wander; k++) kit.push({ t: 'monster', extra: monsterProps(guardOf(G, WANDER_VALUE[tier], ground, tier), moodOf(G, tier)), worth: 0, near: null, guard: null });
    const out = { kit, ground };
    G.kits.set(z.proto, out);
    return out;
  };

  const guardSpot = (G, z, t, c, r) => {
    const def = H.OBJ[t], w = G.w, ec = c + def.entry[0], er = r + def.entry[1], ward = [er * w + ec, (er + 1) * w + ec];
    for (const [dx, dy] of [[0, 1], [-1, 1], [1, 1], [-1, 2], [1, 2], [0, 2]]) {
      const x = ec + dx, y = er + dy;
      if (x < 0 || y < 0 || x >= w || y >= w) continue;
      const i = y * w + x;
      if (x >= c && x < c + def.foot[0] && y >= r && y < r + def.foot[1]) continue;
      if (!openCell(G, z, i) || G.solid[z.l][i] || G.M.road[z.l][i] || G.keep[z.l][i]) continue;
      if (G.door[z.l][i] && !ward.includes(i)) continue;
      if (zocClean(G, z.l, x, y, ward)) return [x, y];
    }
    return null;
  };

  const guardObject = (G, z, o, value) => {
    const spot = guardSpot(G, z, o.t, o.c, o.r);
    if (!spot) fail('нет места для охраны перехода');
    const m = MD.add(G.M, Object.assign({ t: 'monster', c: spot[0], r: spot[1], l: z.l, owner: -1 }, monsterProps(guardOf(G, value, z.base, z.tier), 'hostile')));
    G.solid[z.l][spot[1] * G.w + spot[0]] = 1;
    G.mob[z.l][spot[1] * G.w + spot[0]] = 1;
    G.home.set(m.id, z.id);
    markZoc(G, z.l, spot[0], spot[1]);
  };

  const zoneOrder = (G, z) => {
    if (!z.open) z.open = shuffled(z.all.filter(i => openCell(G, z, i)), G.rng);
    return z.open;
  };

  const placeSpec = (G, z, spec) => {
    const w = G.w, cells = zoneOrder(G, z), near = spec.near;
    for (const strict of near ? [true, false] : [false]) {
      for (const i of cells) {
        const c = i % w, r = (i / w) | 0;
        if (strict && z.hub) {
          const d = Math.hypot(c - z.hub[0], r - z.hub[1]);
          if (d < near[0] || d > near[1]) continue;
        }
        if (!fits(G, z, spec.t, c, r)) continue;
        if (spec.t === 'monster' && !zocClean(G, z.l, c, r, null)) continue;
        const spot = spec.guard ? guardSpot(G, z, spec.t, c, r) : null;
        if (spec.guard && !spot) continue;
        if (spec.t !== 'monster' && !keepsWay(G, z, spec.t, c, r)) continue;
        const o = spawn(G, z, spec.t, c, r, Object.assign({}, spec.extra));
        if (spec.t === 'monster') {
          markZoc(G, z.l, c, r);
          G.mob[z.l][r * w + c] = 1;
        }
        if (spot) {
          const m = MD.add(G.M, Object.assign({ t: 'monster', c: spot[0], r: spot[1], l: z.l, owner: -1 }, spec.guard));
          G.solid[z.l][spot[1] * w + spot[0]] = 1;
          G.mob[z.l][spot[1] * w + spot[0]] = 1;
          G.home.set(m.id, z.id);
          markZoc(G, z.l, spot[0], spot[1]);
        }
        return o;
      }
    }
    return null;
  };

  const placeNear = (G, z, t, extra, wantShore, guarded, aim) => {
    const w = G.w, [ax, ay] = aim || [z.cx, z.cy], list = zoneOrder(G, z).slice().sort((a, b) => Math.hypot(a % w - ax, ((a / w) | 0) - ay) - Math.hypot(b % w - ax, ((b / w) | 0) - ay));
    const def = H.OBJ[t];
    for (const i of list) {
      const c = (i % w) - (def.entry ? def.entry[0] : 0), r = ((i / w) | 0) - (def.entry ? def.entry[1] : 0);
      if (!fits(G, z, t, c, r)) continue;
      if (wantShore && !nearWater(G, z.l, c + def.entry[0], r + def.entry[1], 3)) continue;
      if (guarded && !guardSpot(G, z, t, c, r)) continue;
      if (!keepsWay(G, z, t, c, r)) continue;
      return spawn(G, z, t, c, r, extra);
    }
    return null;
  };

  const landBeside = (G, l, c, r) => {
    const w = G.w;
    return ORTHO.some(([dc, dr]) => {
      const x = c + dc, y = r + dr;
      return x >= 0 && y >= 0 && x < w && y < w && !G.solid[l][y * w + x] && H.TERRAIN[G.M.ter[l][y * w + x]].cost > 0 && !!G.main[l][y * w + x];
    });
  };
  const nearWater = (G, l, c, r, rad) => {
    const w = G.w;
    let best = null, dist = Infinity;
    for (let y = r - rad; y <= r + rad; y++) {
      for (let x = c - rad; x <= c + rad; x++) {
        if (x < 0 || y < 0 || x >= w || y >= w) continue;
        const i = y * w + x;
        if (!G.sea[l][i] || G.solid[l][i] || G.M.ter[l][i] !== H.TERRAIN_INDEX.water || !landBeside(G, l, x, y)) continue;
        const d = Math.hypot(x - c, y - r);
        if (d < dist) {
          dist = d;
          best = [x, y];
        }
      }
    }
    return best;
  };

  const roadTo = (G, z, from, to, kind) => {
    const w = G.w, l = z.l, road = G.M.road[l], solid = G.solid[l], keep = G.keep[l];
    if (from === to) return;
    const cost = i => {
      if (i === to || i === from) return 1;
      if (solid[i] || keep[i] || !openCell(G, z, i)) return 0;
      return road[i] ? 0.7 : 1;
    };
    const found = H.Path.find(w, w, from, new Set([to]), cost, () => false, 0.7);
    if (!found) return;
    for (const i of found.cells) road[i] = road[i] || kind;
    road[from] = road[from] || kind;
  };

  const garrisonFor = (faction, tier, power) => {
    const weeks = [0, 2, 3, 4][tier] * power, count = [0, 3, 4, 5][tier], units = H.FACTIONS[faction].units;
    return units.slice(0, count).map(row => ({ unit: row[0], count: Math.max(1, Math.round(H.UNITS[row[0]].growth * weeks)) }));
  };
  const TOWN_TIER_BUILT = { 1: ['market'], 2: ['market', 'dwell3'], 3: ['market', 'dwell3', 'dwell4'] };
  const townName = (G, faction) => {
    const list = TOWN_NAMES[faction] || [], n = G.named[faction] = (G.named[faction] || 0) + 1;
    return list[n - 1] || H.FACTIONS[faction].name + ', ' + n + '-й город';
  };

  const placeTown = (G, z, faction, owner) => {
    const props = { faction, owner, name: townName(G, faction), built: START_BUILT.slice() };
    if (owner < 0) {
      const t = Math.max(1, z.tier);
      props.built = [...START_BUILT, ...TOWN_TIER_BUILT[t]];
      props.garrison = garrisonFor(faction, t, G.power);
    }
    const out = owner >= 0 && !z.radius ? [z.cx + (z.cx - G.w / 2) * START_OUTWARD, z.cy + (z.cy - G.w / 2) * START_OUTWARD] : null;
    const o = placeNear(G, z, 'town', props, false, false, out);
    if (!o) fail('нет места для города в зоне ' + z.proto);
    z.townObj = o;
    z.hub = [o.c + 2, o.r + 3];
    return o;
  };

  const passGuards = (G, passes) => {
    const w = G.w;
    for (const p of passes) {
      const tier = Math.min(Math.max(p.a.tier, p.b.tier), p.a.cls === 'start' || p.b.cls === 'start' ? 2 : 3), c = p.mid % w, r = (p.mid / w) | 0, ground = p.a.base;
      const g = guardOf(G, PASS_VALUE[tier], ground, tier), m = MD.add(G.M, Object.assign({ t: 'monster', c, r, l: p.a.l, owner: -1 }, monsterProps(g, tier === 3 ? 'fierce' : 'hostile'), { max: g.count * 2 }));
      G.solid[p.a.l][p.mid] = 1;
      G.mob[p.a.l][p.mid] = 1;
      G.home.set(m.id, p.a.id);
      p.guard = m.id;
      markZoc(G, p.a.l, c, r);
    }
  };

  const hubOf = (G, z) => {
    if (z.hub) return z.hub;
    const w = G.w, list = zoneOrder(G, z).filter(i => !G.solid[z.l][i] && !G.keep[z.l][i]);
    if (!list.length) fail('пустая зона ' + z.proto);
    const at = list.reduce((a, b) => (Math.hypot(a % w - z.cx, ((a / w) | 0) - z.cy) <= Math.hypot(b % w - z.cx, ((b / w) | 0) - z.cy) ? a : b));
    z.hub = [at % w, (at / w) | 0];
    G.door[z.l][at] = -1;
    return z.hub;
  };

  const roadKind = tier => (tier >= 3 ? 3 : tier === 2 ? 2 : 1);
  const layRoads = (G, passes) => {
    const w = G.w;
    for (const p of passes) {
      const kind = roadKind(Math.max(p.a.tier, p.b.tier)), hubA = hubOf(G, p.a), hubB = hubOf(G, p.b), road = G.M.road[p.a.l];
      roadTo(G, p.a, hubA[1] * w + hubA[0], p.path[0], kind);
      roadTo(G, p.b, hubB[1] * w + hubB[0], p.path[p.path.length - 1], kind);
      for (const i of p.path) road[i] = road[i] || kind;
    }
    for (const z of G.zones) {
      if (!z.doors) continue;
      const hub = hubOf(G, z);
      for (const o of z.doors) {
        const e = MD.entry(o);
        roadTo(G, z, hub[1] * w + hub[0], (e[1] + 1) * w + e[0], 1);
      }
    }
  };

  const required = G => {
    const w = G.w, rng = G.rng;
    G.stairPairs = [];
    for (const [top, below] of G.stairs) {
      const a = placeNear(G, top, 'stairsdown', {}, false, true), b = placeNear(G, below, 'stairsup', {}, false, true);
      if (!a || !b) fail('нет места для перехода между уровнями');
      a.link = b.id;
      b.link = a.id;
      G.stairPairs.push([a.id, b.id]);
      guardObject(G, top, a, PASS_VALUE[Math.max(1, Math.min(top.tier, below.tier))]);
      guardObject(G, below, b, PASS_VALUE[below.tier]);
      (top.doors = top.doors || []).push(a);
      (below.doors = below.doors || []).push(b);
    }
    if (G.seaMap) {
      for (const z of G.zones) {
        if (z.cls !== 'start') continue;
        const y = placeNear(G, z, 'shipyard', {}, true);
        if (!y) fail('нет места для верфи');
        const e = MD.entry(y), dock = nearWater(G, z.l, e[0], e[1], 3);
        y.dock = dock;
        G.door[z.l][dock[1] * w + dock[0]] = y.id;
        z.yard = y;
        (z.doors = z.doors || []).push(y);
        if (!G.rules.islands) continue;
        const spot = shoreCell(G, z, dock);
        if (!spot) fail('нет места для лодки');
        const boat = MD.add(G.M, { t: 'boat', c: spot[0], r: spot[1], l: z.l, owner: -1 });
        G.solid[z.l][spot[1] * w + spot[0]] = 1;
        G.door[z.l][spot[1] * w + spot[0]] = boat.id;
        G.home.set(boat.id, z.id);
      }
    }
    if (G.w >= 80 && G.rules.crossWedge && G.rules.wedges >= 2) {
      const moon = pick(H.MOONS.slice(0, 7), rng).id, hosts = [];
      for (let i = 0; i < G.rules.wedges; i++) {
        const z = G.zones.find(q => q.wedge === i && q.l === 0 && q.tier >= 1 && !q.radius);
        if (z) hosts.push(z);
      }
      if (hosts.length >= 2) {
        G.gates = hosts.map(z => ({ z, moon }));
      }
    }
  };

  const shoreCell = (G, z, dock) => {
    const w = G.w, ter = G.M.ter[z.l];
    let best = null, dist = Infinity;
    for (const i of z.all.concat(G.zones.find(q => q.sea && q.l === z.l).all)) {
      if (!G.sea[z.l][i] || G.solid[z.l][i] || ter[i] !== H.TERRAIN_INDEX.water || G.door[z.l][i]) continue;
      const c = i % w, r = (i / w) | 0, d = Math.hypot(c - dock[0], r - dock[1]);
      if (d < 2 || d >= dist) continue;
      if (!ORTHO.some(([dc, dr]) => c + dc >= 0 && r + dr >= 0 && c + dc < w && r + dr < w && openCell(G, z, (r + dr) * w + c + dc) && !G.solid[z.l][(r + dr) * w + c + dc])) continue;
      dist = d;
      best = [c, r];
    }
    return best;
  };

  const seaContent = G => {
    if (!G.seaMap) return;
    const w = G.w, sea = G.zones.find(z => z.sea);
    const list = [];
    for (let i = 0; i < w * w; i++) if (G.sea[0][i] && G.M.ter[0][i] === H.TERRAIN_INDEX.water) list.push(i);
    const order = shuffled(list, G.rng), home = sea ? sea.id : -1;
    const free = (t, i) => {
      const [fw, fh] = H.OBJ[t].foot, c = i % w, r = (i / w) | 0;
      if (c + fw >= w || r + fh >= w || c < 1 || r < 1) return false;
      for (let y = r - 1; y <= r + fh; y++) {
        for (let x = c - 1; x <= c + fw; x++) {
          const q = y * w + x;
          if (G.solid[0][q] || G.door[0][q]) return false;
          if (x >= c && x < c + fw && y >= r && y < r + fh && (!G.sea[0][q] || G.M.ter[0][q] !== H.TERRAIN_INDEX.water)) return false;
        }
      }
      return true;
    };
    const put = (t, extra) => {
      for (const i of order) {
        if (!free(t, i)) continue;
        const o = MD.add(G.M, Object.assign({ t, c: i % w, r: (i / w) | 0, l: 0, owner: -1 }, extra || {})), [fw, fh] = H.OBJ[t].foot;
        for (let y = o.r; y < o.r + fh; y++) for (let x = o.c; x < o.c + fw; x++) G.solid[0][y * w + x] = 1;
        G.home.set(o.id, home);
        return o;
      }
      return null;
    };
    const barrels = Math.round(list.length / 120), pirates = Math.round(list.length / 260), pairs = list.length > 500 ? 2 : list.length > 220 ? 1 : 0;
    for (let k = 0; k < barrels; k++) put('barrel');
    for (let k = 0; k < pairs; k++) {
      const a = put('whirlpool'), b = a && put('whirlpool');
      if (a && b) {
        a.link = b.id;
        b.link = a.id;
      } else if (a) {
        G.M.objs = G.M.objs.filter(o => o !== a);
        G.home.delete(a.id);
      }
    }
    for (let k = 0; k < pirates; k++) {
      const g = guardOf(G, 2500, 'water', 2, true);
      const o = put('monster', monsterProps(g, 'hostile'));
      if (o) markZoc(G, 0, o.c, o.r);
    }
  };

  const fillZone = (G, z) => {
    const { kit } = kitFor(G, z);
    hubOf(G, z);
    for (const spec of kit) placeSpec(G, z, spec);
  };

  const fillStart = (G, z) => {
    const faction = G.factions[z.player], kit = startKit(G, faction, G.startProto);
    for (const spec of kit) {
      const o = placeSpec(G, z, spec);
      if (!o) fail('в стартовой зоне нет места: ' + H.OBJ[spec.t].name);
    }
  };

  const decorate = G => {
    const w = G.w, rng = G.rng, I = H.TERRAIN_INDEX;
    for (const z of G.zones) {
      if (z.sea) continue;
      const cells = zoneOrder(G, z), ter = G.M.ter[z.l], count = Math.round(z.all.length / 30);
      let left = count, mountains = z.all.length > 200 ? 1 : 0, sign = z.cls !== 'start' && rng() < 0.3 ? 1 : 0;
      for (const i of cells) {
        if (!left && !mountains && !sign) break;
        const c = i % w, r = (i / w) | 0, name = H.TERRAIN[ter[i]].id;
        if (sign && fits(G, z, 'signstone', c, r) && keepsWay(G, z, 'signstone', c, r)) {
          spawn(G, z, 'signstone', c, r, { text: pick(SIGNS, rng) });
          sign = 0;
          continue;
        }
        if (mountains && fits(G, z, 'mountain', c, r) && keepsWay(G, z, 'mountain', c, r)) {
          spawn(G, z, 'mountain', c, r);
          mountains = 0;
          continue;
        }
        if (!left) continue;
        const t = name === 'forest' || name === 'swamp' ? 'pine' : name === 'meadow' || name === 'palegrass' ? (rng() < 0.75 ? 'tree' : 'rock') : rng() < 0.7 ? 'rock' : 'pine';
        if (!fits(G, z, t, c, r) || !keepsWay(G, z, t, c, r)) continue;
        spawn(G, z, t, c, r);
        left--;
      }
    }
    for (let l = 0; l < G.M.levels; l++) {
      const ter = G.M.ter[l], keep = G.keep[l], solid = G.solid[l], rockCells = [];
      for (let i = 0; i < w * w; i++) if (ter[i] === I.rock && !keep[i]) rockCells.push(i);
      const wanted = Math.round(rockCells.length / (l ? 60 : 30));
      let made = 0;
      for (const i of shuffled(rockCells, rng)) {
        if (made >= wanted) break;
        const c = i % w, r = (i / w) | 0;
        if (c + 3 > w || r + 2 > w) continue;
        let room = true;
        for (let y = r; y < r + 2 && room; y++) for (let x = c; x < c + 3; x++) if (ter[y * w + x] !== I.rock || solid[y * w + x] || keep[y * w + x]) room = false;
        if (!room) continue;
        MD.add(G.M, { t: 'mountain', c, r, l, owner: -1 });
        for (let y = r; y < r + 2; y++) for (let x = c; x < c + 3; x++) solid[y * w + x] = 1;
        made++;
      }
    }
  };

  const shoreLine = G => {
    const w = G.w, ter = G.M.ter[0], I = H.TERRAIN_INDEX;
    if (!G.seaMap) return;
    const list = [];
    for (let i = 0; i < w * w; i++) {
      if (G.border[0][i] || G.keep[0][i] || !H.TERRAIN[ter[i]].cost) continue;
      const c = i % w, r = (i / w) | 0;
      for (const [dc, dr] of H.Path.DIRS) {
        const x = c + dc, y = r + dr;
        if (x >= 0 && y >= 0 && x < w && y < w && G.sea[0][y * w + x]) {
          list.push(i);
          G.zones[G.zone[0][i]].shore = true;
          break;
        }
      }
    }
    for (const i of list) ter[i] = I.sand;
  };

  const cull = (G, doc) => {
    const needed = o => o.t === 'town' || o.t === 'shipyard' || H.OBJ[o.t].kind === 'portal' || G.zones[G.home.get(o.id)] && G.zones[G.home.get(o.id)].cls === 'start';
    const lost = MF.unreached(doc);
    if (lost.some(needed)) return;
    const gone = new Set(lost);
    G.M.objs = G.M.objs.filter(o => !gone.has(o));
  };

  const generate = (o, seed) => {
    const w = o.w, rng = H.rng(seed), T = o.shape || TEMPLATES[o.template], levels = T.under ? 2 : o.levels === 2 ? 2 : 1, order = o.players.map((p, i) => i).sort((a, b) => (o.players[a].team == null ? a : o.players[a].team) - (o.players[b].team == null ? b : o.players[b].team) || a - b);
    const shift = Math.floor(rng() * order.length), rotated = order.map((p, i) => order[(i + shift) % order.length]);
    const G = {
      w, rng, n: o.players.length, order: rotated, zones: [], links: [], stairs: [], rules: null, hasUnder: false, water: T.sea ? 'many' : o.water || 'none', seaMap: !!T.sea || o.water === 'many',
      factions: o.factions, M: MD.create(w, w, levels === 2 ? ['meadow', 'rock'] : ['meadow']), power: STRENGTH[o.neutrals || 'normal'][1],
      zone: [], border: [], shared: [], sea: [], solid: [], door: [], zoc: [], keep: [], main: [], mob: [], stamp: [], stampId: 0, kinds: new Map(), protoGround: new Map(), protoNative: new Set(['side', 'sideA', 'sideB']), kits: new Map(), home: new Map(), named: {}, wedgeNative: {}, pool: null
    };
    T.build(G);
    if (levels === 2 && !G.hasUnder) addUnder(G);
    addFillers(G, 0);
    if (levels === 2) addFillers(G, 1);
    for (const z of G.zones) if (z.cls === 'start' && G.wedgeNative[z.wedge] == null) G.wedgeNative[z.wedge] = NATIVE[G.factions[z.player]] || 'meadow';
    for (let l = 0; l < levels; l++) {
      G.zone[l] = partition(G, l);
      neighbourPairs(G, l);
      for (const name of ['sea', 'solid', 'keep', 'zoc']) G[name][l] = new Uint8Array(w * w);
      G.door[l] = new Int32Array(w * w);
      G.stamp[l] = new Int32Array(w * w);
      G.mob[l] = new Uint8Array(w * w);
    }
    cellsOfZones(G);
    for (const z of G.zones) {
      if (z.cls === 'start' && z.all.length < (z.radius ? 110 : 150)) fail('стартовая зона слишком мала');
      if (!z.sea && z.all.length < 24) fail('зона слишком мала: ' + z.proto);
    }
    paintGround(G);
    shoreLine(G);
    patches(G);
    mainParts(G);
    const passes = planLinks(G).map(([a, b]) => carve(G, a, b)).filter(Boolean);
    linkUp(G, passes);
    for (const p of passes) {
      p.a.anchors.push(p.path[0]);
      p.b.anchors.push(p.path[p.path.length - 1]);
    }
    for (const z of G.zones) if (z.cls === 'start' && !z.radius && !G.seaMap && !passes.some(p => p.a === z || p.b === z) && !G.stairs.some(s => s[0] === z)) fail('из стартовой зоны нет прохода');
    passGuards(G, passes);
    for (const z of G.zones) z.open = null;
    const anyFaction = Object.keys(H.FACTIONS);
    for (const z of G.zones) {
      if (z.cls === 'start') placeTown(G, z, G.factions[z.player], z.player);
    }
    for (const z of G.zones) {
      if (z.cls === 'start' || !z.town) continue;
      const native = z.wedge >= 0 ? G.zones.find(q => q.cls === 'start' && q.wedge === z.wedge) : null;
      placeTown(G, z, native ? G.factions[native.player] : pick(anyFaction, rng), -1);
    }
    required(G);
    if (G.gates) {
      for (const { z, moon } of G.gates) {
        const gate = placeNear(G, z, 'moongate', { moon });
        if (gate) (z.doors = z.doors || []).push(gate);
      }
    }
    layRoads(G, passes);
    const room = Math.min(...G.zones.filter(z => z.cls === 'start').map(z => z.size));
    G.startProto = { weekly: pick(['windmill', 'watermill', 'apiary', 'stable'], rng), small: pick(['well', 'chapel', 'luckspring', 'idol'], rng), art: pick(artsOf('plain'), rng).id, spell: pick(spellsOf(1), rng).id };
    if (room < ROOMY_START) G.startProto.weekly = null;
    if (room < TIGHT_START) G.startProto.small = null;
    G.startProto.shrine = room >= TIGHT_START;
    for (const z of G.zones) if (z.cls === 'start') fillStart(G, z);
    fieldPatches(G);
    for (const z of G.zones) if (z.cls !== 'start' && !z.sea) fillZone(G, z);
    seaContent(G);
    decorate(G);
    const players = o.players.map((p, i) => ({ who: 'both', factions: null, team: p.team == null ? i : p.team, town: G.zones.find(z => z.cls === 'start' && z.player === i).townObj.id }));
    const doc = {
      name: T.name + ', ' + w + '×' + w, about: 'Случайная карта: ' + T.name + ', игроков ' + players.length + ', номер ' + seed + '. ' + T.about,
      map: G.M, players, goals: { win: [{ kind: 'defeat' }], lose: [{ kind: 'all' }] }, heroes: [], events: [], scenes: ''
    };
    cull(G, doc);
    const meta = {
      seed, template: o.template || T.name, zones: G.zones.length, passes: passes.length, sea: G.seaMap,
      areas: G.zones.map(z => ({ id: z.id, cls: z.cls, proto: z.proto, player: z.player, wedge: z.wedge, tier: z.tier, l: z.l, cx: z.cx, cy: z.cy, size: z.all ? z.all.length : 0, town: z.townObj ? z.townObj.id : null })),
      links: passes.map(p => ({ a: p.a.id, b: p.b.id, l: p.a.l, path: p.path, mid: p.mid, guard: p.guard })),
      stairs: G.stairPairs,
      starts: G.zones.filter(z => z.cls === 'start').map(z => ({ player: z.player, town: z.townObj.id, yard: z.yard ? z.yard.id : null, value: G.M.objs.filter(x => G.home.get(x.id) === z.id && x.t !== 'town' && x.t !== 'monster' && H.OBJ[x.t].kind !== 'decor' && H.OBJ[x.t].kind !== 'shipyard' && H.OBJ[x.t].kind !== 'boat' && H.OBJ[x.t].kind !== 'portal' && H.OBJ[x.t].kind !== 'lore').reduce((t, x) => t + worthOf(x), 0) }))
    };
    return { doc, meta };
  };

  const zocSplit = (doc, meta) => {
    const M = doc.map, w = M.w, size = w * w, block = Array.from({ length: M.levels }, () => new Uint8Array(size)), doors = new Map();
    for (const o of M.objs) {
      const def = H.OBJ[o.t];
      if (def.kind === 'monster') {
        for (let y = o.r - 1; y <= o.r + 1; y++) for (let x = o.c - 1; x <= o.c + 1; x++) if (MD.inside(M, x, y)) block[o.l][y * w + x] = 1;
        continue;
      }
      const e = MD.entry(o);
      for (const [x, y] of MD.cells(o)) if (!(e && e[0] === x && e[1] === y) && MD.inside(M, x, y)) block[o.l][y * w + x] = 1;
      if (e && def.kind === 'portal' && o.link != null) doors.set(o.l * size + e[1] * w + e[0], o);
    }
    const byId = new Map(M.objs.map(o => [o.id, o]));
    const flood = start => {
      const seen = Array.from({ length: M.levels }, () => new Uint8Array(size)), stack = [[start.l, MD.entry(start)[1] * w + MD.entry(start)[0]]];
      seen[stack[0][0]][stack[0][1]] = 1;
      while (stack.length) {
        const [l, i] = stack.pop(), c = i % w, r = (i / w) | 0, gate = doors.get(l * size + i);
        if (gate) {
          const to = byId.get(gate.link), e = to && MD.entry(to);
          if (e && !block[to.l][e[1] * w + e[0]] && !seen[to.l][e[1] * w + e[0]]) {
            seen[to.l][e[1] * w + e[0]] = 1;
            stack.push([to.l, e[1] * w + e[0]]);
          }
        }
        for (const [dc, dr] of H.Path.DIRS) {
          const x = c + dc, y = r + dr;
          if (x < 0 || y < 0 || x >= w || y >= w) continue;
          const q = y * w + x;
          if (seen[l][q] || block[l][q] || !MD.groundCost(M, l, x, y)) continue;
          if (dc && dr && (block[l][r * w + x] || !MD.groundCost(M, l, x, r)) && (block[l][y * w + c] || !MD.groundCost(M, l, c, y))) continue;
          seen[l][q] = 1;
          stack.push([l, q]);
        }
      }
      return seen;
    };
    const towns = meta.starts.map(s => byId.get(s.town));
    for (const t of towns) {
      const seen = flood(t);
      for (const q of towns) {
        if (q === t) continue;
        const e = MD.entry(q);
        if (seen[q.l][e[1] * w + e[0]]) return true;
      }
    }
    return false;
  };

  const verify = (doc, meta) => {
    const out = [], M = doc.map, w = M.w, list = MF.check(doc), byId = new Map(M.objs.map(o => [o.id, o]));
    for (const it of list) out.push(it.text);
    const values = meta.starts.map(s => s.value), mean = values.reduce((t, v) => t + v, 0) / values.length;
    if (values.some(v => Math.abs(v - mean) > mean * 0.05)) out.push('Ценность стартовых зон расходится больше чем на 5 %: ' + values.join(', '));
    for (const [a, b] of meta.stairs) {
      const x = byId.get(a), y = byId.get(b);
      if (!x || !y || x.link !== y.id || y.link !== x.id || x.l === y.l) out.push('Переход между уровнями без пары');
    }
    if (meta.sea) {
      for (const s of meta.starts) {
        const y = byId.get(s.yard);
        if (!y) out.push('Нет верфи в стартовой зоне игрока ' + (s.player + 1));
        else if (!y.dock || !MD.isWater(M, y.l, y.dock[0], y.dock[1])) out.push('У верфи нет причала');
      }
    }
    for (const s of meta.starts) {
      const t = byId.get(s.town), e = MD.entry(t);
      for (const m of M.objs) {
        if (m.t === 'monster' && m.l === t.l && Math.max(Math.abs(m.c - e[0]), Math.abs(m.r - e[1])) <= 1) out.push('Отряд стоит у ворот стартового города');
      }
    }
    if (zocSplit(doc, meta)) out.push('Между стартовыми городами есть путь без охраны');
    if (w !== M.h) out.push('Карта не квадратная');
    return out;
  };

  const resolveFactions = (o, rng) => {
    const all = Object.keys(H.FACTIONS);
    return o.players.map(p => (p.faction && p.faction !== 'random' ? p.faction : pick(all, rng)));
  };

  const make = o => {
    const base = (o.seed >>> 0) || 1, log = [], factions = resolveFactions(o, H.rng(base ^ 0x5bd1e995));
    for (let k = 0; k < (o.tries || MAX_TRIES); k++) {
      const seed = base + k;
      try {
        const made = generate(Object.assign({}, o, { factions }), seed), why = verify(made.doc, made.meta);
        if (!why.length) return { doc: made.doc, meta: made.meta, seed, tries: k + 1, log, factions };
        log.push({ seed, why: why[0] });
      } catch (e) {
        if (!e || !e.rmgFail) throw e;
        log.push({ seed, why: e.rmgFail });
      }
    }
    return { doc: null, meta: null, seed: base, tries: o.tries || MAX_TRIES, log, factions };
  };

  const startDays = (doc, meta) => {
    const M = doc.map, w = M.w, l = 0, block = new Uint8Array(w * w), byId = new Map(M.objs.map(o => [o.id, o])), out = [];
    for (const o of M.objs) {
      if (o.l !== l || H.OBJ[o.t].kind === 'monster') continue;
      const e = MD.entry(o);
      for (const [x, y] of MD.cells(o)) if (!(e && e[0] === x && e[1] === y) && MD.inside(M, x, y)) block[y * w + x] = 1;
    }
    const cost = i => (block[i] ? 0 : MD.groundCost(M, l, i % w, (i / w) | 0));
    const gates = meta.starts.map(s => MD.entry(byId.get(s.town)));
    for (let a = 0; a < gates.length; a++) {
      const goals = new Set(gates.filter((g, b) => b !== a).map(g => g[1] * w + g[0])), found = H.Path.find(w, w, gates[a][1] * w + gates[a][0], goals, cost, () => false, 0.6);
      if (found) out.push(found.cost / H.MAP.daySteps);
    }
    return out;
  };

  H.Rmg = { TEMPLATES, STRENGTH, WATER, sizesFor, playersFor, make, verify, worthOf, startDays, kit: { addZone, tie, startZone, polar, rotate, TAU } };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
