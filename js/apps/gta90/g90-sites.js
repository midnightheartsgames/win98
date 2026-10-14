(function (G) {
  'use strict';
  const { GR, SEG, RNG, inRing, ringBox, offsetLine, cumLen, pointAt } = G;

  const ZONES = [
    ['plotinka', 'Плотинка', 56.8370, 60.6045, 130],
    ['istsquare', 'Исторический сквер', 56.8350, 60.6040, 110],
    ['trud', 'Площадь Труда', 56.8386, 60.6075, 80],
    ['sq1905', 'Площадь 1905 года', 56.8375, 60.5965, 140],
    ['whitehouse', 'Октябрьская площадь', 56.8422, 60.5948, 190],
    ['dynamo', 'Динамо', 56.8458, 60.6008, 210],
    ['voznes', 'Вознесенская горка', 56.8447, 60.6105, 200],
    ['opera', 'Оперный театр', 56.8398, 60.6172, 150],
    ['lenina', 'Проспект Ленина', 56.8405, 60.6265, 230],
    ['vainera', 'Улица Вайнера', 56.8335, 60.5962, 190],
    ['market', 'Центральный рынок', 56.8304, 60.5888, 170],
    ['kommunarov', 'Площадь Коммунаров', 56.8362, 60.5832, 150],
    ['circus', 'Цирк', 56.8258, 60.6045, 190],
    ['tvtower', 'Телебашня', 56.8245, 60.6086, 110],
    ['melkovka', 'Мельковка', 56.8520, 60.6150, 360],
    ['vokzal', 'Привокзальный район', 56.8545, 60.6040, 250],
    ['zelroshcha', 'Парк «Зелёная роща»', 56.8203, 60.5885, 250],
    ['dvorets', 'Дворец спорта', 56.8165, 60.5920, 150],
    ['oborony', 'Площадь Обороны', 56.8227, 60.6295, 160],
    ['tkachey', 'Улица Ткачей', 56.8170, 60.6250, 300],
    ['pond', 'Городской пруд', 56.8448, 60.5965, 330]
  ];

  const PLACES = {
    ph_plotinka: ['Таксофон на Плотинке', [56.83652, 60.60405], 'walk'],
    ph_market: ['Таксофон у Центрального рынка', 'переулок Центральный Рынок×улица Сакко и Ванцетти', 'walk', [6, 8]],
    ph_circus: ['Таксофон у цирка', '#Цирк', 'walk'],
    ph_dynamo: ['Таксофон у «Динамо»', [56.84762, 60.59922], 'walk'],
    ph_opera: ['Таксофон у Оперного театра', '#Театр оперы и балета', 'walk'],
    ph_oborony: ['Таксофон на площади Обороны', [56.822713, 60.629451], 'walk'],
    ph_white: ['Таксофон на Октябрьской площади', [56.843099, 60.595387], 'walk'],
    ph_post: ['Таксофон у Главпочтамта', [56.839294, 60.608478], 'walk'],
    ph_voznes: ['Таксофон на Вознесенской горке', [56.84495, 60.61005], 'walk'],
    safe1: ['Коммуналка на Вайнера', 'улица Малышева×улица Вайнера', 'walk', [-26, -50]],
    safe2: ['Общежитие на Мельковке', 'улица Свердлова×Мельковская улица', 'walk', [30, 30]],
    safe3: ['Квартира на набережной', 'проспект Ленина×улица 8 Марта', 'walk', [40, -90]],
    hosp_1: ['ЦГКБ № 1', [56.824451, 60.629297], 'walk'],
    hosp_3: ['Городская больница № 3', [56.852100, 60.602938], 'walk'],
    hosp_2: ['Областная больница № 2', [56.840685, 60.599488], 'walk'],
    ovd_guvd: ['ГУВД облисполкома', [56.837538, 60.593272], 'walk'],
    ovd_lenin: ['Ленинский РОВД', [56.831979, 60.610045], 'walk'],
    ovd_rail: ['Железнодорожный РОВД', [56.854836, 60.601291], 'walk'],
    ovd_oct: ['Октябрьский РОВД', [56.827776, 60.627979], 'walk'],
    ovd_kirov: ['Кировский РОВД', [56.841226, 60.609116], 'walk'],
    taxi_stand: ['Стоянка такси у ЦУМа', 'улица Малышева×улица Вайнера', 'road', [24, 0]],
    passage: ['Пассаж', '#Пассаж', 'walk'],
    market: ['Центральный рынок', '@Центральный рынок', 'plaza'],
    market_gate: ['Ворота рынка', 'переулок Центральный Рынок×улица Сакко и Ванцетти', 'walk', [-10, 14]],
    hotel_iset: ['Гостиница «Исеть»', '#Гостиница «Исеть»', 'walk'],
    hotel_central: ['Гостиница «Центральная»', [56.835253, 60.610723], 'walk'],
    dynamo: ['Стадион «Динамо»', [56.84600, 60.60180], 'yard'],
    dynamo_lot: ['Стоянка у «Динамо»', [56.84640, 60.60270], 'yard'],
    kosmos: ['Кинотеатр «Космос»', [56.845394, 60.604947], 'walk'],
    whitehouse: ['Дом Советов', '#Дом Советов', 'yard'],
    drama: ['Театр драмы', '#Театр драмы', 'walk'],
    opera: ['Оперный театр', '#Театр оперы и балета', 'walk'],
    univ: ['Уральский университет', 'проспект Ленина×улица Тургенева', 'road', [-40, 0]],
    circus: ['Цирк', '#Цирк', 'walk'],
    tvtower: ['Стройка телебашни', '#Телебашня', 'walk'],
    post: ['Главпочтамт', [56.839294, 60.608478], 'walk'],
    sq1905: ['Площадь 1905 года', [56.837861, 60.596290], 'walk'],
    metro1905: ['Стройка метро «Площадь 1905 года»', [56.8364, 60.5994], 'walk'],
    metro_dynamo: ['Стройка метро «Динамо»', [56.8480, 60.6011], 'walk'],
    voznes: ['Ипатьевский пустырь', [56.844391, 60.608972], 'walk'],
    kharitonov: ['Харитоновский сад', [56.846225, 60.612845], 'walk'],
    plotinka: ['Плотинка', [56.836538, 60.604379], 'walk'],
    boat_start: ['Лодочная станция', [56.8395, 60.6020], 'water'],
    pond_pier: ['Пруд у «Динамо»', [56.8452, 60.5978], 'water'],
    pond_west: ['Пруд у Дома Советов', [56.8425, 60.5978], 'water'],
    dvorets: ['Дворец спорта', [56.8162, 60.5921], 'walk'],
    zelroshcha: ['Парк «Зелёная роща»', [56.8206, 60.5872], 'walk'],
    vokzal: ['Привокзальная улица', 'улица Челюскинцев×улица Свердлова', 'walk', [0, 26]],
    vokzal_road: ['Улица Челюскинцев у вокзала', 'улица Челюскинцев×улица Свердлова', 'road', [50, 0]],
    atp: ['Автобаза на Мельковке', 'улица Свердлова×Мельковская улица', 'yard', [60, 25]],
    warehouse: ['Склад на Мельковской', 'улица Свердлова×Мельковская улица', 'yard', [-55, 30]],
    exit_east: ['Выезд на Сибирский тракт', 'Восточная улица×улица Куйбышева', 'road', [-30, 0]],
    race_start: ['Старт на проспекте Ленина', 'проспект Ленина×улица 8 Марта', 'road', [-70, 0]],
    race1: ['Контрольная точка: Челюскинцев', 'улица 9 Января×улица Челюскинцев', 'road', [0, 0]],
    race2: ['Контрольная точка: Ленина у Восточной', 'проспект Ленина×Восточная улица', 'road', [-30, 0]],
    race3: ['Контрольная точка: Куйбышева', 'улица Куйбышева×улица Белинского', 'road', [-30, 0]],
    race4: ['Финиш на проспекте Ленина', 'проспект Ленина×улица 8 Марта', 'road', [-70, 0]],
    dacha: ['Частный дом на Чапаева', 'улица Декабристов×улица Белинского', 'yard', [-70, 90]],
    rat_start: ['Проспект Ленина у Плотинки', 'проспект Ленина×улица 8 Марта', 'road', [90, 0]],
    bank: ['Госбанк на Малышева', 'улица Малышева×улица 8 Марта', 'road', [60, 0]],
    gai_post: ['Пост ГАИ на Восточной', 'проспект Ленина×Восточная улица', 'road', [-45, 0]],
    shkola: ['Школа на Мамина-Сибиряка', [56.8456, 60.6182], 'walk'],
    lenina_e: ['Проспект Ленина у Восточной', 'проспект Ленина×Восточная улица', 'walk', [-40, 22]],
    kommunarov: ['Площадь Коммунаров', [56.8362, 60.5832], 'walk'],
    oborony: ['Площадь Обороны', [56.822713, 60.629451], 'walk'],
    tkachey_yard: ['Двор на Ткачей', [56.8180, 60.6235], 'yard'],
    melkovka_yard: ['Двор на Мельковке', 'улица Свердлова×Мельковская улица', 'yard', [-20, -40]]
  };

  const GARAGES = [
    ['g_center', 'deliver', 'ГАРАЖ', 56.8322, 60.5952],
    ['g_circus', 'deliver', 'АВТОСЕРВИС', 56.8250, 60.6008],
    ['g_inter', 'deliver', 'УРАЛ-ИНТЕР', 56.8430, 60.6060],
    ['spray_w', 'spray', 'ПОКРАСКА', 56.8342, 60.5872],
    ['spray_e', 'spray', 'ПОКРАСКА', 56.8362, 60.6272],
    ['spray_s', 'spray', 'ПОКРАСКА', 56.8222, 60.6148],
    ['bomb_n', 'bomb', 'МАСТЕРСКАЯ', 56.8502, 60.6098],
    ['bomb_s', 'bomb', 'МАСТЕРСКАЯ', 56.8198, 60.6040],
    ['crusher', 'crusher', 'УТИЛЬСЫРЬЁ', 56.8532, 60.6198],
    ['g_export', 'export', 'КОНТЕЙНЕРЫ', 56.8537, 60.6125]
  ];

  const MONUMENTS = [
    ['Ленин', 56.837861, 60.596290, 50, 15, true],
    ['Свердлов', 56.839815, 60.616415, 32, 11, false],
    ['Попов', 56.839578, 60.607769, 28, 10, true],
    ['Бажов', 56.838559, 60.603901, 24, 9, true],
    ['Малышев', 56.834212, 60.604319, 28, 10, false]
  ];

  const KIOSKS = [
    ['СОЮЗПЕЧАТЬ', '#3a7ac0', 56.8380, 60.5978], ['МОРОЖЕНОЕ', '#c04040', 56.8370, 60.6050], ['СОЮЗПЕЧАТЬ', '#3a7ac0', 56.8393, 60.6160],
    ['ТАБАК', '#806020', 56.8466, 60.6018], ['СОЮЗПЕЧАТЬ', '#3a7ac0', 56.8268, 60.6040], ['КВАС', '#c08020', 56.8360, 60.6015],
    ['СОКИ-ВОДЫ', '#40a060', 56.8412, 60.6248], ['СОЮЗПЕЧАТЬ', '#3a7ac0', 56.8340, 60.6105], ['ТЕАТРАЛЬНЫЕ КАССЫ', '#6a2a8a', 56.8386, 60.6120],
    ['ПИВО', '#c0a030', 56.8520, 60.6070], ['ЦВЕТЫ', '#c04080', 56.8448, 60.6045], ['ЛОТО', '#b02020', 56.8314, 60.6000]
  ];

  const CONSTRUCTION = [
    ['Строительство метро', 56.8364, 60.5994, 46, 26, 0.4],
    ['Строительство метро', 56.8480, 60.6011, 40, 24, 2.2]
  ];

  const SPOTS = {
    kazanka1: [56.8420, 60.6000, 1.9],
    kazanka2: [56.8466, 60.5962, 0.6],
    tank: [56.8550, 60.6080, 0]
  };

  const BADGES = [
    [56.8384, 60.6046], [56.8366, 60.5922], [56.8453, 60.6126], [56.8432, 60.5918], [56.8471, 60.6002], [56.8301, 60.5868], [56.8258, 60.6062], [56.8236, 60.6098],
    [56.8203, 60.5870], [56.8166, 60.5938], [56.8226, 60.6310], [56.8291, 60.6202], [56.8357, 60.6250], [56.8403, 60.6240], [56.8466, 60.6178], [56.8521, 60.6105],
    [56.8546, 60.6022], [56.8349, 60.5855], [56.8320, 60.6127], [56.8183, 60.6230]
  ];
  const FRENZIES = [[56.8526, 60.6158, 'f1'], [56.8197, 60.5895, 'f2'], [56.8248, 60.6068, 'f3'], [56.8455, 60.6020, 'f4'], [56.8340, 60.6265, 'f5'], [56.8180, 60.6250, 'f6']];
  const EXTRAS = [['life', 56.8436, 60.6110, 'l1'], ['life', 56.8172, 60.6185, 'l2'], ['mult', 56.8350, 60.5990, 'm1'], ['mult', 56.8495, 60.6070, 'm2'], ['w_rpg', 56.8249, 60.6090, null], ['armor', 56.8460, 60.6040, null]];

  function surfOk(city, x, y, list) { return list.includes(city.surfAt(x, y)); }

  function snapPlace(city, x, y, kind) {
    const M = city.M;
    if (kind === 'road') {
      const r = city.net.nearestLane(x, y, null, 60 * M, true) || city.net.nearestLane(x, y, null, 90 * M, false);
      return r ? [r.x, r.y, r.a] : null;
    }
    if (kind === 'water') return city.isWater(x, y) ? [x, y] : city.nearestPoint(x, y, (a, b) => city.isWater(a, b) && city.isWater(a + 30, b) && city.isWater(a - 30, b) && city.isWater(a, b + 30) && city.isWater(a, b - 30), 120 * M);
    const clear = (a, b, r) => { for (let k = 0; k < 8; k++) { const t = k * Math.PI / 4; if (city.buildingAt(a + Math.cos(t) * r, b + Math.sin(t) * r)) return false; } return true; };
    const base = kind === 'yard' ? (a, b) => surfOk(city, a, b, [GR.YARD, GR.DIRT, GR.PLAZA]) && city.drivable(a, b) && city.drivable(a + 22, b) && city.drivable(a - 22, b) && city.drivable(a, b + 22) && city.drivable(a, b - 22)
      : kind === 'plaza' ? (a, b) => surfOk(city, a, b, [GR.PLAZA, GR.YARD]) && city.walkable(a, b)
        : (a, b) => city.walkable(a, b) && surfOk(city, a, b, [GR.WALK, GR.PLAZA, GR.YARD, GR.GRASS, GR.DIRT]);
    const ok = (a, b) => base(a, b) && clear(a, b, (kind === 'yard' ? 3 : 1.6) * M);
    if (ok(x, y)) return [x, y];
    return city.nearestPoint(x, y, ok, 60 * M);
  }

  function fenceIndex(city) {
    const h = new G.SpatialHash(128), segs = [];
    for (const b of city.barriers) {
      const p = b.pts;
      for (let i = 0; i + 3 < p.length; i += 2) { h.insert(segs.length / 4, Math.min(p[i], p[i + 2]), Math.min(p[i + 1], p[i + 3]), Math.max(p[i], p[i + 2]), Math.max(p[i + 1], p[i + 3])); segs.push(p[i], p[i + 1], p[i + 2], p[i + 3]); }
    }
    const buf = [];
    return (x0, y0, x1, y1) => {
      const rx = x1 - x0, ry = y1 - y0;
      for (const k of h.query(Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1), buf)) {
        const ax = segs[k * 4], ay = segs[k * 4 + 1], sx = segs[k * 4 + 2] - ax, sy = segs[k * 4 + 3] - ay;
        const den = rx * sy - ry * sx;
        if (Math.abs(den) < 1e-9) continue;
        const t = ((ax - x0) * sy - (ay - y0) * sx) / den, u = ((ax - x0) * ry - (ay - y0) * rx) / den;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
      }
      return false;
    };
  }

  function garageSpot(city, x, y, fence) {
    const M = city.M;
    const W2 = 4.6 * M, D = 9 * M;
    const freeAt = (px, py) => !city.solidAt(px, py) && surfOk(city, px, py, [GR.YARD, GR.GRASS, GR.DIRT, GR.PLAZA]) && city.playAt(px, py);
    for (let r = 0; r <= 90 * M; r += 3 * M) {
      const n = Math.max(1, Math.round(r / (3 * M) * 6));
      for (let k = 0; k < n; k++) {
        const a = k / n * Math.PI * 2;
        const cx = x + Math.cos(a) * r, cy = y + Math.sin(a) * r;
        for (let dir = 0; dir < 4; dir++) {
          const ux = [0, 1, 0, -1][dir], uy = [-1, 0, 1, 0][dir];
          const px = -uy, py = ux;
          const pt = (u, v) => [cx + ux * u + px * v, cy + uy * u + py * v];
          let good = true;
          for (let u = 0; u <= D && good; u += 1.5 * M) for (let v = -W2; v <= W2; v += 1.5 * M) { const q = pt(u, v); if (!freeAt(q[0], q[1])) { good = false; break; } }
          if (!good) continue;
          for (let u = -14 * M; u < -0.5 * M && good; u += 1.2 * M) for (let v = -2.4 * M; v <= 2.4 * M; v += 1.2 * M) { const q = pt(u, v); if (!city.drivable(q[0], q[1])) { good = false; break; } }
          if (!good) continue;
          for (const v of [-2.6 * M, 0, 2.6 * M]) { const a = pt(-18 * M, v), b = pt(D, v); if (fence(a[0], a[1], b[0], b[1])) { good = false; break; } }
          if (!good) continue;
          return { cx, cy, ux, uy, px, py, pt };
        }
      }
    }
    return null;
  }

  const Sites = {
    ref(city, r) {
      if (Array.isArray(r)) return city.fromGeo(r[0], r[1]);
      if (r[0] === '#') { const b = city.buildings.find(q => q.name === r.slice(1)); return b ? [b.cx, b.cy] : null; }
      if (r[0] === '@') { const a = city.areas.find(q => q.name === r.slice(1)); return a ? [(a.bb[0] + a.bb[2]) / 2, (a.bb[1] + a.bb[3]) / 2] : null; }
      const net = city.net, M = city.M;
      const [a, b] = r.split('×');
      const ns = net.nodes.filter(n => { const names = new Set(n.arms.map(x => net.segs[x.seg].name)); return names.has(a) && names.has(b); });
      if (!ns.length) return null;
      const f = ns[0];
      const cl = ns.filter(n => Math.hypot(n.x - f.x, n.y - f.y) < 60 * M);
      return [cl.reduce((t, n) => t + n.x, 0) / cl.length, cl.reduce((t, n) => t + n.y, 0) / cl.length];
    },

    place(city) {
      const M = city.M;
      city.garages = {};
      city.doorSegs = [];
      const fence = fenceIndex(city);
      for (const [id, kind, label, la, lo] of GARAGES) {
        const [x, y] = city.fromGeo(la, lo);
        const s = garageSpot(city, x, y, fence);
        if (!s) continue;
        const W2 = 4.6 * M, D = 9 * M, B2 = 2.7 * M, BD = 6.8 * M;
        const ring = [s.pt(0, -W2), s.pt(D, -W2), s.pt(D, W2), s.pt(0, W2), s.pt(0, B2), s.pt(BD, B2), s.pt(BD, -B2), s.pt(0, -B2)];
        const flat = new Float32Array(ring.flat());
        if (G.ringArea(flat) < 0) { const rv = []; for (let i = ring.length - 1; i >= 0; i--) rv.push(ring[i][0], ring[i][1]); flat.set(rv); }
        const color = kind === 'spray' ? '#6a8aa8' : kind === 'bomb' ? '#8a6a5a' : kind === 'crusher' ? '#7a7a60' : kind === 'export' ? '#6a7a6a' : '#8a8a84';
        const b = city.addBuilding([flat], { lv: 2, style: 'g', roof: 'f', name: label, wall: color, kind: 'garage' });
        const bay = s.pt(BD / 2, 0);
        const front = s.pt(-4 * M, 0);
        const door = [s.pt(0, -B2), s.pt(0, B2)];
        const seg = { ax: door[0][0], ay: door[0][1], bx: door[1][0], by: door[1][1], closed: false };
        city.doorSegs.push(seg);
        const out = s.pt(-14 * M, 0);
        city.garages[id] = { id, kind, label, x: bay[0], y: bay[1], front: { x: front[0], y: front[1] }, apron: [front[0], front[1], out[0], out[1]], ux: s.ux, uy: s.uy, bid: b.id, door: seg, open: kind !== 'deliver' };
        b.garage = id;
        b.sign = label;
      }
      for (const [name, la, lo, w, h, crane] of CONSTRUCTION) {
        const [x, y] = city.fromGeo(la, lo);
        const hw = w / 2 * M, hh = h / 2 * M;
        const ring = new Float32Array([x - hw, y - hh, x + hw, y - hh, x + hw, y + hh, x - hw, y + hh, x - hw, y - hh]);
        city.barriers.push({ kind: 'f', pts: ring, site: true });
        city.areas.push({ kind: 'c', name, rings: [ring.slice(0, 8)], bb: [x - hw, y - hh, x + hw, y + hh] });
        city.fillRings(city.surf, city.cell, city.CW, city.CH, [ring.slice(0, 8)], GR.DIRT);
        city.sitesCranes = (city.sitesCranes || []).concat([[x + hw * 0.4, y - hh * 0.3, crane]]);
      }
    },

    apply(city) {
      const M = city.M;
      city.zones = ZONES.map(([key, name, la, lo, r]) => { const [x, y] = city.fromGeo(la, lo); return { key, name, x, y, r: r * M }; });
      const mk = (id, name, x, y, extra) => { city.places[id] = Object.assign({ id, name, x, y }, extra || {}); };
      for (const [id, [name, ref, kind, off]] of Object.entries(PLACES)) {
        const p0 = this.ref(city, ref);
        if (!p0) throw new Error('place ref ' + id);
        const x = p0[0] + (off ? off[0] * M : 0), y = p0[1] + (off ? off[1] * M : 0);
        const q = snapPlace(city, x, y, kind);
        if (!q) throw new Error('place ' + id);
        mk(id, name, q[0], q[1], q[2] != null ? { a: q[2], kind } : { kind });
      }
      for (const [id, g] of Object.entries(city.garages)) mk(id, g.label, g.x, g.y, { garage: true });
      city.spots = {};
      for (const [k, [la, lo, a]] of Object.entries(SPOTS)) {
        const [x, y] = city.fromGeo(la, lo);
        const water = k.startsWith('kazanka');
        const q = water ? snapPlace(city, x, y, 'water') : snapPlace(city, x, y, 'yard');
        if (!q) continue;
        city.spots[k] = { x: q[0], y: q[1], a };
        mk('spot_' + k, k, q[0], q[1]);
      }
      for (const k of Object.keys(city.places)) if (k.startsWith('ph_')) city.props.push({ type: 'phone', x: city.places[k].x, y: city.places[k].y, id: k });
      for (const [name, la, lo, h, s, bronze] of MONUMENTS) {
        const [x, y] = city.fromGeo(la, lo);
        city.props.push({ type: 'monument', name, x, y, h, s, bronze });
      }
      const fl = city.fromGeo(56.838313, 60.606981);
      city.props = city.props.filter(p => !(p.type === 'fountain' && Math.hypot(p.x - fl[0], p.y - fl[1]) < 30 * M));
      city.props.push({ type: 'fountain', x: fl[0], y: fl[1], r: 7 * M, name: 'Каменный цветок' });
      for (const [label, color, la, lo] of KIOSKS) {
        const [x, y] = city.fromGeo(la, lo);
        const q = snapPlace(city, x, y, 'walk');
        if (q) city.props.push({ type: 'kiosk', x: q[0], y: q[1], a: 0, label, color, w: 2.8 * M, d: 2.2 * M });
      }
      this.marketRows(city);
      for (const [x, y, a] of city.sitesCranes || []) city.props.push({ type: 'crane', x, y, a, h: 230 });
      const tv = city.buildings.find(b => b.kind === 'tvtower');
      if (tv) city.props.push({ type: 'crane', x: tv.cx + 40 * M, y: tv.cy + 18 * M, a: 3.6, h: 200 });
      city.fixedPickups = [];
      BADGES.forEach(([la, lo], k) => { const [x, y] = city.fromGeo(la, lo); city.fixedPickups.push({ type: 'badge', x, y, key: 'b' + (k + 1) }); });
      for (const [la, lo, key] of FRENZIES) { const [x, y] = city.fromGeo(la, lo); city.fixedPickups.push({ type: 'frenzy', x, y, key }); }
      for (const [type, la, lo, key] of EXTRAS) { const [x, y] = city.fromGeo(la, lo); city.fixedPickups.push({ type, x, y, key }); }
      this.parking(city);
      this.edgeBlocks(city);
      const aprons = Object.values(city.garages).map(g => g.apron);
      city.props = city.props.filter(p => p.type !== 'tree' || (!city.buildingAt(p.x, p.y) && !aprons.some(a => G.segDist(p.x, p.y, a[0], a[1], a[2], a[3]) < 4 * M)));
    },

    marketRows(city) {
      const M = city.M, area = city.areas.find(a => a.name === 'Центральный рынок');
      if (!area) return;
      const r = area.rings[0], rng = new RNG(77);
      const ux = 1, uy = 0, nx = 0, ny = 1;
      let cx = 0, cy = 0;
      for (let i = 0; i < r.length; i += 2) { cx += r[i]; cy += r[i + 1]; }
      cx /= r.length / 2; cy /= r.length / 2;
      let s0 = Infinity, s1 = -Infinity, t0 = Infinity, t1 = -Infinity;
      for (let i = 0; i < r.length; i += 2) { const dx = r[i] - cx, dy = r[i + 1] - cy, s = dx * ux + dy * uy, t = dx * nx + dy * ny; s0 = Math.min(s0, s); s1 = Math.max(s1, s); t0 = Math.min(t0, t); t1 = Math.max(t1, t); }
      const roofs = ['#3a6a8a', '#4a7a5a', '#3a6a8a', '#6a6a70'];
      const clear = (x, y) => city.walkable(x, y) && city.surfAt(x, y) !== GR.ROAD && inRing(x, y, r);
      let row = 0;
      for (let t = t0 + 8 * M; t < t1 - 6 * M; t += 10.5 * M, row++) {
        const roof = roofs[row % roofs.length];
        if (Math.abs(t - (t0 + t1) / 2) < 9 * M) continue;
        for (let s = s0 + 7 * M; s < s1 - 7 * M;) {
          const len = (10 + rng.next() * 6) * M;
          if (rng.chance(0.22)) { s += len; continue; }
          const e = Math.min(s + len, s1 - 7 * M);
          const mid = (s + e) / 2, L = e - s;
          const x = cx + ux * mid + nx * t, y = cy + uy * mid + ny * t;
          let ok = L > 5 * M;
          for (let k = -2; k <= 2 && ok; k++) for (const v of [-1.6, 1.6]) { const q = [x + ux * k * L / 4 + nx * v * M, y + uy * k * L / 4 + ny * v * M]; if (!clear(q[0], q[1])) { ok = false; break; } }
          if (ok) city.props.push({ type: 'stallrow', x, y, a: Math.atan2(uy, ux), w: L, d: 2.8 * M, color: roof, seed: rng.next() });
          s = e + (rng.chance(0.35) ? 7 : 3.5) * M;
        }
      }
    },

    parking(city) {
      const M = city.M, rng = new RNG(31);
      const net = city.net;
      const spots = [];
      const ok = (x, y) => city.drivable(x, y) && city.surfAt(x, y) === GR.YARD && city.playAt(x, y);
      for (const s of net.segs) {
        if (s.cls < 2 || !s.road) continue;
        for (const side of [1, -1]) {
          const off = offsetLine(s.pts, side * (s.w / 2 + (side > 0 ? s.sr : s.sl) + 3.5 * M));
          const cum = cumLen(off);
          const L = cum[cum.length - 1];
          for (let d = s.da + 10 * M; d < L - s.db - 10 * M; d += 7 * M) {
            if (rng.next() > 0.18) continue;
            const q = pointAt(off, cum, d);
            if (!ok(q[0], q[1]) || !ok(q[0] + Math.cos(q[2]) * 24, q[1] + Math.sin(q[2]) * 24) || !ok(q[0] - Math.cos(q[2]) * 24, q[1] - Math.sin(q[2]) * 24)) continue;
            if (spots.some(p => Math.abs(p.x - q[0]) < 50 && Math.abs(p.y - q[1]) < 50)) continue;
            spots.push({ x: q[0], y: q[1], a: q[2] + (rng.chance(0.5) ? Math.PI : 0) });
          }
        }
      }
      city.parking = spots;
    },

    edgeBlocks(city) {
      const M = city.M, net = city.net;
      for (const n of net.nodes) {
        if (n.arms.length !== 1) continue;
        const a = n.arms[0];
        let edge = false;
        for (const p of city.plays) { const cx = n.x - a.ux * 2 * M, cy = n.y - a.uy * 2 * M; if (!inRing(cx, cy, p)) edge = true; }
        if (!edge) {
          let best = Infinity;
          for (const p of city.plays) for (let i = 0, k = p.length - 2; i < p.length; k = i, i += 2) best = Math.min(best, G.segDist(n.x, n.y, p[k], p[k + 1], p[i], p[i + 1]));
          if (best > 6 * M) continue;
        }
        const ang = Math.atan2(a.uy, a.ux) + Math.PI / 2;
        const hw = a.hw;
        for (let v = -hw + 1.5 * M; v <= hw - 1.5 * M; v += 3.6 * M) city.props.push({ type: 'block', x: n.x + a.ux * 2 * M - a.uy * v, y: n.y + a.uy * 2 * M + a.ux * v, a: ang });
      }
    }
  };

  G.Sites = Sites;
  G.SITE_DATA = { ZONES, PLACES, GARAGES };
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(globalThis.Gta90 = globalThis.Gta90 || {});
