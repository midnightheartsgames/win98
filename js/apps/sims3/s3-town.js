(function (S) {
  'use strict';
  const { World, TER, OBJECTS, BLUEPRINTS, parseList, RNG, DX, DY, WALLPAPERS, footprint } = S;
  const TW = 160, TH = 160;
  const ROAD_W = 6;
  const HROADS = [{ y: 24, name: 'Северная улица', x0: 0, x1: 125 }, { y: 56, name: 'Центральный проспект', x0: 0, x1: 159, bridge: 126 }, { y: 88, name: 'Садовая улица', x0: 0, x1: 125 }, { y: 120, name: 'Южная улица', x0: 0, x1: 125 }];
  const VROADS = [{ x: 24, name: 'Кленовая аллея', y0: 0, y1: 125 }, { x: 56, name: 'Липовая улица', y0: 0, y1: 125 }, { x: 88, name: 'Ратушная улица', y0: 0, y1: 125 }, { x: 120, name: 'Береговая дорога', y0: 0, y1: 135 }];

  const RH = {
    cityhall: { name: 'Ратуша', size: [9, 8], icon: 'c_political', desc: 'Сердце городской власти. Здесь работают политики и проводят экскурсии.' },
    business: { name: 'Бизнес-центр «Сансет»', size: [8, 8], icon: 'c_business', desc: 'Стеклянная башня, где заключают сделки. Здесь начинается бизнес-карьера.' },
    police: { name: 'Полицейский участок', size: [9, 8], icon: 'c_law', desc: 'Здесь служат полицейские, агенты и криминалисты.' },
    hospital: { name: 'Больница', size: [10, 8], icon: 'c_medical', desc: 'Городская больница. Здесь лечат, рожают и делают медицинскую карьеру.' },
    science: { name: 'Научный центр Ландграаба', size: [12, 10], icon: 'c_science', desc: 'Лаборатории, опыты и странные запахи. Здесь покупают самоцветы и металлы.' },
    military: { name: 'Военная база «Форт Старч»', size: [14, 10], icon: 'c_military', desc: 'Военная база. Отсюда улетают в космос.' },
    stadium: { name: 'Стадион «Ламы»', size: [18, 16], icon: 'c_sports', desc: 'Домашний стадион команды «Ламы». Можно посмотреть матч или стать звездой спорта.' },
    theater: { name: 'Театр «Сансет»', size: [9, 9], icon: 'c_music', desc: 'Спектакли, концерты и музыкальная карьера.' },
    bistro: { name: 'Бистро «Корсика»', size: [8, 7], icon: 'c_culinary', desc: 'Лучшая кухня в городе. Можно поужинать или устроиться поваром.' },
    grocery: { name: 'Супермаркет «Корзинка»', size: [9, 8], icon: 'c_grocery', desc: 'Продукты, семена и рыба. Сюда можно продать урожай и улов.' },
    bookstore: { name: 'Книжный магазин «Страница»', size: [8, 7], icon: 'c_book', desc: 'Книги для навыков, романы и сказки. Здесь покупают рукописи.' },
    spa: { name: 'Спа-салон «Лотос»', size: [8, 7], icon: 'c_spa', desc: 'Массаж, ванны и полное расслабление.' },
    newspaper: { name: 'Редакция «Вестник»', size: [8, 8], icon: 'c_journalism', desc: 'Городская газета. Здесь работают журналисты.' },
    school: { name: 'Школа Сансет Вэлли', size: [16, 8], icon: 'm_book', desc: 'Сюда ходят дети и подростки. Уроки с 8 утра.' },
    warehouse: { name: 'Старый склад', size: [9, 8], icon: 'c_criminal', desc: 'Заброшенный склад у дороги. Говорят, ночью здесь кипит работа.' }
  };
  for (const k of Object.keys(RH)) {
    OBJECTS['rh_' + k] = { key: 'rh_' + k, name: RH[k].name, price: 0, size: RH[k].size, func: 'misc', rooms: [], place: 'floor', block: true, acts: ['rh'], env: 0, col: ['#c8c0b0', '#8a8a90'], hidden: true, rabbit: k };
  }

  const L = (key, name, x, y, w, h, front, kind, o) => Object.assign({ key, name, x, y, w, h, front, kind }, o || {});
  const LOT_DEFS = [
    L('landgraab', 'Особняк на холме', 2, 2, 22, 22, 'S', 'home', { bp: 'mansion', family: 'landgraab' }),
    L('graveyard', 'Кладбище «Тихий приют»', 30, 2, 26, 22, 'S', 'venue', { venue: 'graveyard', icon: 'm_grave', desc: 'Старое кладбище со склепом и прудом. Ночью здесь бродят призраки.' }),
    L('science', RH.science.name, 62, 2, 26, 22, 'S', 'rabbit', { rh: 'science' }),
    L('military', RH.military.name, 94, 2, 26, 22, 'S', 'rabbit', { rh: 'military' }),
    L('goth', 'Особняк Готов', 2, 30, 22, 24, 'E', 'home', { bp: 'manor', family: 'goth' }),
    L('hogan', 'Дом у липовой аллеи', 30, 30, 13, 26, 'W', 'home', { bp: 'ranch', family: 'hogan' }),
    L('frost', 'Дом с зелёными ставнями', 43, 30, 13, 26, 'E', 'home', { bp: 'ranch', family: 'frost', ext: 'siding_yellow', roof: '#3a6a4a' }),
    L('park', 'Центральный парк', 62, 30, 26, 26, 'S', 'venue', { venue: 'park', icon: 'm_leaf', desc: 'Фонтан с памятником основателю, пруд, шахматы и гриль. Лучшее место для прогулки.' }),
    L('cityhall', RH.cityhall.name, 94, 30, 13, 13, 'W', 'rabbit', { rh: 'cityhall' }),
    L('business', RH.business.name, 107, 30, 13, 13, 'E', 'rabbit', { rh: 'business' }),
    L('police', RH.police.name, 94, 43, 13, 13, 'W', 'rabbit', { rh: 'police' }),
    L('hospital', RH.hospital.name, 107, 43, 13, 13, 'E', 'rabbit', { rh: 'hospital' }),
    L('beach', 'Городской пляж', 126, 30, 12, 26, 'W', 'venue', { venue: 'beach', icon: 'm_sun', desc: 'Песок, гриль и рыбалка в море.' }),
    L('scott', 'Уютный коттедж', 2, 62, 22, 13, 'N', 'home', { bp: 'cottage', family: 'scott' }),
    L('sale_cottage', 'Коттедж на Садовой', 2, 75, 22, 13, 'S', 'home', { bp: 'cottage', sale: true, ext: 'siding_blue', roof: '#7a4a3a' }),
    L('theater', RH.theater.name, 30, 62, 13, 13, 'W', 'rabbit', { rh: 'theater' }),
    L('bistro', RH.bistro.name, 43, 62, 13, 13, 'E', 'rabbit', { rh: 'bistro' }),
    L('bookstore', RH.bookstore.name, 30, 75, 13, 13, 'W', 'rabbit', { rh: 'bookstore' }),
    L('spa', RH.spa.name, 43, 75, 13, 13, 'E', 'rabbit', { rh: 'spa' }),
    L('grocery', RH.grocery.name, 62, 62, 13, 13, 'W', 'rabbit', { rh: 'grocery' }),
    L('newspaper', RH.newspaper.name, 75, 62, 13, 13, 'E', 'rabbit', { rh: 'newspaper' }),
    L('gym', 'Спортзал «Сила»', 62, 75, 13, 13, 'W', 'venue', { venue: 'gym', bp: 'gym', icon: 'sk_athletic', desc: 'Беговые дорожки, тренажёры и душ.' }),
    L('library', 'Городская библиотека', 75, 75, 13, 13, 'E', 'venue', { venue: 'library', bp: 'library', icon: 'm_book', desc: 'Тишина, книги, шахматы и компьютеры.' }),
    L('school', RH.school.name, 94, 62, 26, 13, 'N', 'rabbit', { rh: 'school' }),
    L('warehouse', RH.warehouse.name, 94, 75, 13, 13, 'S', 'rabbit', { rh: 'warehouse' }),
    L('sale_starter', 'Маленький дом у дороги', 107, 75, 13, 13, 'S', 'home', { bp: 'starter', sale: true }),
    L('pier', 'Рыбацкий пирс', 126, 62, 14, 26, 'W', 'venue', { venue: 'pier', icon: 'm_fish', desc: 'Деревянный пирс в море. Здесь клюёт лучшая морская рыба.' }),
    L('aldridge', 'Дом с огородом', 2, 94, 22, 13, 'N', 'home', { bp: 'cottage', family: 'aldridge', ext: 'brick', roof: '#5a3a2a' }),
    L('empty_1', 'Пустой участок на Южной', 2, 107, 22, 13, 'S', 'home', { empty: true, sale: true }),
    L('mitchell', 'Дом Митчеллов', 30, 94, 26, 13, 'N', 'home', { bp: 'ranch', family: 'mitchell', ext: 'siding', roof: '#6a3a2a' }),
    L('sale_ranch', 'Одноэтажный дом', 30, 107, 26, 13, 'S', 'home', { bp: 'ranch', sale: true, ext: 'stucco', roof: '#4a5a6a' }),
    L('parker', 'Кирпичный дом', 62, 94, 26, 13, 'N', 'home', { bp: 'suburban', family: 'parker' }),
    L('king', 'Дом с флюгером', 62, 107, 26, 13, 'S', 'home', { bp: 'suburban', family: 'king', ext: 'siding_blue', roof: '#3a3a4a' }),
    L('stadium', RH.stadium.name, 94, 94, 26, 26, 'W', 'rabbit', { rh: 'stadium' }),
    L('sale_family', 'Семейный дом с садом', 2, 126, 22, 22, 'N', 'home', { bp: 'family', sale: true }),
    L('empty_2', 'Узкий участок', 30, 126, 13, 22, 'N', 'home', { empty: true, sale: true }),
    L('sale_town', 'Таунхаус у моря', 43, 126, 13, 22, 'N', 'home', { bp: 'townhouse', sale: true }),
    L('alto', 'Вилла Альто', 62, 126, 26, 22, 'N', 'home', { bp: 'villa', family: 'alto' }),
    L('lighthouse', 'Маяк Сансет Вэлли', 114, 136, 16, 16, 'N', 'venue', { venue: 'lighthouse', icon: 'm_star', desc: 'Старый маяк на краю города. Тихое место для рыбалки на закате.' })
  ];

  function eastShore(y) { return 132 + Math.round(Math.sin(y * 0.13) * 1.4 + Math.sin(y * 0.047 + 1) * 1.1); }
  function southShore(x) { return 152 + Math.round(Math.sin(x * 0.11) * 1.2 + Math.sin(x * 0.037 + 2) * 0.8); }
  function isSea(x, y) { return x >= eastShore(y) || y >= southShore(x); }

  function lotMapper(lot, bw, bd) {
    const f = lot.front;
    const map = (x, y) => {
      if (f === 'S') return [lot.x + x, lot.y + y];
      if (f === 'N') return [lot.x + bw - 1 - x, lot.y + bd - 1 - y];
      if (f === 'E') return [lot.x + y, lot.y + bw - 1 - x];
      return [lot.x + bd - 1 - y, lot.y + x];
    };
    const dir = r => f === 'S' ? r : f === 'N' ? (r + 2) % 4 : f === 'E' ? (r + 3) % 4 : (r + 1) % 4;
    const edge = (o, x, y) => {
      const A = o === 'h' ? [x, y - 1] : [x - 1, y];
      const B = [x, y];
      const a = map(A[0], A[1]), b = map(B[0], B[1]);
      if (a[0] === b[0]) return { o: 'h', x: a[0], y: Math.max(a[1], b[1]), flip: a[1] > b[1] };
      return { o: 'v', x: Math.max(a[0], b[0]), y: a[1], flip: a[0] > b[0] };
    };
    const rect = (x, y, w, h) => {
      const a = map(x, y), b = map(x + w - 1, y + h - 1);
      return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(a[0] - b[0]) + 1, Math.abs(a[1] - b[1]) + 1];
    };
    return { map, dir, edge, rect, bw, bd };
  }

  function placeMapped(world, M, type, x, y, r, props, log) {
    const def = OBJECTS[type];
    if (!def) { if (log) log.push('unknown ' + type); return null; }
    const f = footprint(def, r);
    let mx = 1e9, my = 1e9;
    for (let j = 0; j < f[1]; j++) for (let i = 0; i < f[0]; i++) {
      const p = M.map(x + i, y + j);
      mx = Math.min(mx, p[0]); my = Math.min(my, p[1]);
    }
    const wr = M.dir(r);
    const chk = world.canPlace(type, mx, my, wr, { lv: (props && props.lv) || 0 });
    if (!chk.ok) { if (log) log.push(type + ' ' + x + ',' + y + ' ' + chk.reason); return null; }
    return world.placeObject(type, mx, my, wr, props);
  }

  const TALL = new Set(['fridge', 'fridge_lux', 'bookshelf', 'bookshelf_lux', 'shower', 'dresser', 'clock_grand', 'treadmill', 'plant_big', 'lamp_floor']);

  function inRects(rects, x, y) {
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3]) return i;
    }
    return -1;
  }

  function buildStorey(world, lot, M, bp, spec, lv, ext, opt, log) {
    const cellRoom = (x, y) => inRects(spec.rooms, x, y);
    const decks = spec.decks || [];
    const onDeck = (x, y) => inRects(decks, x, y) >= 0;
    for (const r of spec.rooms.concat(decks)) {
      for (let y = r[1]; y < r[1] + r[3]; y++) for (let x = r[0]; x < r[0] + r[2]; x++) {
        const p = M.map(x, y);
        world.setFloor(p[0], p[1], r[4], lv);
      }
    }
    const paintOf = id => id >= 0 ? spec.rooms[id][5] : ext;
    for (let y = -1; y <= bp.d; y++) for (let x = -1; x <= bp.w; x++) {
      const a = cellRoom(x, y);
      const right = cellRoom(x + 1, y), down = cellRoom(x, y + 1);
      if (x + 1 <= bp.w && a !== right && (a >= 0 || right >= 0)) {
        const e = M.edge('v', x + 1, y);
        const pa = paintOf(a), pb = paintOf(right);
        world.addWall(e.o, e.x, e.y, { a: e.flip ? pb : pa, b: e.flip ? pa : pb, lot: lot.id, lv });
      }
      if (y + 1 <= bp.d && a !== down && (a >= 0 || down >= 0)) {
        const e = M.edge('h', x, y + 1);
        const pa = paintOf(a), pb = paintOf(down);
        world.addWall(e.o, e.x, e.y, { a: e.flip ? pb : pa, b: e.flip ? pa : pb, lot: lot.id, lv });
      }
      const open = (px, py) => !onDeck(px, py) && cellRoom(px, py) < 0;
      if (onDeck(x, y)) {
        if (open(x + 1, y)) { const e = M.edge('v', x + 1, y); world.addWall(e.o, e.x, e.y, { lot: lot.id, lv, fence: true }); }
        if (open(x, y + 1)) { const e = M.edge('h', x, y + 1); world.addWall(e.o, e.x, e.y, { lot: lot.id, lv, fence: true }); }
        if (open(x - 1, y)) { const e = M.edge('v', x, y); world.addWall(e.o, e.x, e.y, { lot: lot.id, lv, fence: true }); }
        if (open(x, y - 1)) { const e = M.edge('h', x, y); world.addWall(e.o, e.x, e.y, { lot: lot.id, lv, fence: true }); }
      }
    }
    for (const p of parseList(spec.doors)) {
      const e = M.edge(p[0], +p[1], +p[2]);
      const w = world.getWall(e.o, e.x, e.y, lv);
      if (!w) { log.push('door without wall ' + p.join(' ')); continue; }
      w.door = p[3];
    }
    for (const p of parseList(spec.stairs)) {
      const ob = placeMapped(world, M, p[0], +p[1], +p[2], +p[3], { lot: lot.id, lv: lv - 1 }, log);
      if (ob) for (const [tx, ty] of world.tilesOf(ob)) world.setFloor(tx, ty, null, lv);
    }
    const list = parseList(spec.objs).concat(parseList(spec.yard));
    const floorFirst = list.filter(p => { const d = OBJECTS[p[0]]; return d && d.place !== 'surface' && d.place !== 'wall'; });
    const later = list.filter(p => { const d = OBJECTS[p[0]]; return d && (d.place === 'surface' || d.place === 'wall'); });
    if (opt.furnish !== false) {
      for (const p of floorFirst.concat(later)) placeMapped(world, M, p[0], +p[1], +p[2], +p[3], { lot: lot.id, lv }, log);
    } else {
      for (const p of floorFirst.concat(later)) {
        const d = OBJECTS[p[0]];
        if (d.rooms.includes('outdoor') || d.func === 'decor' && d.place !== 'wall') placeMapped(world, M, p[0], +p[1], +p[2], +p[3], { lot: lot.id, lv }, log);
      }
    }
    for (let y = 0; y <= bp.d; y++) for (let x = 0; x <= bp.w; x++) {
      for (const o of ['h', 'v']) {
        const inA = o === 'h' ? cellRoom(x, y - 1) : cellRoom(x - 1, y);
        const inB = cellRoom(x, y);
        if ((inA >= 0) === (inB >= 0)) continue;
        const along = o === 'h' ? x : y;
        if (along % 2 !== 1) continue;
        const e = M.edge(o, x, y);
        const w = world.getWall(e.o, e.x, e.y, lv);
        if (!w || w.door) continue;
        const inside = inA >= 0 ? (o === 'h' ? [x, y - 1] : [x - 1, y]) : [x, y];
        const ip = M.map(inside[0], inside[1]);
        const ob = world.objAt(ip[0], ip[1], 'occ', lv);
        if (ob && TALL.has(ob.t)) continue;
        const nearDoor = [-1, 1].some(dd => {
          const e2 = o === 'h' ? M.edge('h', x + dd, y) : M.edge('v', x, y + dd);
          const w2 = world.getWall(e2.o, e2.x, e2.y, lv);
          return w2 && w2.door;
        });
        if (nearDoor) continue;
        let slotted = false;
        for (const [key2] of world.wallSlots) {
          const [lvPart, rest] = key2.split(':');
          const [sx, sy] = rest.split(',').map(Number);
          if (+lvPart === lv && sx === ip[0] && sy === ip[1]) slotted = true;
        }
        if (slotted) continue;
        w.win = opt.win || (bp.public ? 'win_tall' : (bp.value > 50000 ? 'win_tall' : 'win_cross'));
      }
    }
    for (let i = 0; i < spec.rooms.length; i++) {
      const r = spec.rooms[i];
      const n = Math.max(1, Math.round(r[2] * r[3] / 20));
      const spots = [];
      if (n === 1) spots.push([r[0] + Math.floor((r[2] - 1) / 2), r[1] + Math.floor((r[3] - 1) / 2)]);
      else if (r[2] >= r[3]) for (let k = 0; k < n; k++) spots.push([r[0] + Math.floor((k + 0.5) * r[2] / n), r[1] + Math.floor((r[3] - 1) / 2)]);
      else for (let k = 0; k < n; k++) spots.push([r[0] + Math.floor((r[2] - 1) / 2), r[1] + Math.floor((k + 0.5) * r[3] / n)]);
      for (const s of spots) {
        const p = M.map(s[0], s[1]);
        const below = world.objAt(p[0], p[1], 'occ', lv);
        if (!world.objAt(p[0], p[1], 'ceil', lv) && !(below && OBJECTS[below.t].stairs)) world.placeObject('lamp_ceiling', p[0], p[1], 0, { lot: lot.id, lv });
      }
    }
  }

  function applyBlueprint(world, lot, key, opt) {
    opt = opt || {};
    const bp = BLUEPRINTS[key];
    const vertical = lot.front === 'E' || lot.front === 'W';
    const lw = vertical ? lot.h : lot.w, ld = vertical ? lot.w : lot.h;
    if (lw !== bp.w || ld !== bp.d) throw new Error('blueprint ' + key + ' does not fit lot ' + lot.key + ' ' + lw + 'x' + ld);
    const M = lotMapper(lot, bp.w, bp.d);
    const ext = opt.ext || bp.ext;
    const log = opt.log || [];
    buildStorey(world, lot, M, bp, bp, 0, ext, opt, log);
    if (bp.up) buildStorey(world, lot, M, bp, bp.up, 1, ext, opt, log);
    const fx = bp.front[0], fy = bp.front[1];
    for (let y = fy; y < bp.d; y++) {
      const p = M.map(fx, y);
      if (!world.objAt(p[0], p[1])) world.setFloor(p[0], p[1], 'stone_patio');
    }
    const doorOut = M.map(fx, fy);
    const doorIn = M.map(fx, fy - 1);
    lot.frontDoor = doorOut;
    lot.doorIn = doorIn;
    lot.bpRooms = bp.rooms.map(r => M.rect(r[0], r[1], r[2], r[3]));
    lot.roof = opt.roof || bp.roof;
    const minX = Math.min(...bp.rooms.map(r => r[0])), minY = Math.min(...bp.rooms.map(r => r[1]));
    const maxX = Math.max(...bp.rooms.map(r => r[0] + r[2])), maxY = Math.max(...bp.rooms.map(r => r[1] + r[3]));
    lot.houseRect = M.rect(minX, minY, maxX - minX, maxY - minY);
    return { M, log };
  }

  function addPool(world, lot, pw, ph) {
    const hr = lot.houseRect || [lot.x, lot.y, 0, 0];
    const hx = hr[0] + hr[2] / 2, hy = hr[1] + hr[3] / 2;
    const door = lot.frontDoor;
    let best = null, bs = -1e9;
    for (let y = lot.y + 1; y + ph <= lot.y + lot.h - 1; y++) for (let x = lot.x + 1; x + pw <= lot.x + lot.w - 1; x++) {
      let ok = true;
      const clear = new Set();
      for (let yy = y - 1; yy <= y + ph && ok; yy++) for (let xx = x - 1; xx <= x + pw && ok; xx++) {
        const i = world.idx(xx, yy);
        const t = world.terrain[i];
        if (world.floor[i] || world.layer.rug[i] || world.lot[i] !== lot.id) ok = false;
        else if (t !== TER.grass && t !== TER.grass2 && t !== TER.flowers && t !== TER.dirt) ok = false;
        else if (world.getWall('h', xx, yy) || world.getWall('v', xx, yy) || world.getWall('h', xx, yy + 1) || world.getWall('v', xx + 1, yy)) ok = false;
        else if (door && Math.abs(xx - door[0]) <= 1 && Math.abs(yy - door[1]) <= 1) ok = false;
        else for (const id of [world.layer.occ[i], world.layer.ground[i]]) {
          if (!id) continue;
          const ob = world.objects.get(id), d = ob && OBJECTS[ob.t];
          if (!d || d.func !== 'decor' || d.lotItem || d.place !== 'floor') ok = false; else clear.add(id);
        }
      }
      if (!ok) continue;
      const d = Math.hypot(x + pw / 2 - hx, y + ph / 2 - hy);
      const s = -Math.abs(d - (Math.max(hr[2], hr[3]) / 2 + 3)) - clear.size * 2;
      if (s > bs) { bs = s; best = [x, y, clear]; }
    }
    if (!best) return false;
    for (const id of best[2]) world.removeObject(id);
    for (let y = best[1]; y < best[1] + ph; y++) for (let x = best[0]; x < best[0] + pw; x++) world.terrain[world.idx(x, y)] = TER.pool;
    lot.pool = [best[0], best[1], pw, ph];
    const cx = best[0] + (pw - 1) / 2, cy = best[1] + (ph - 1) / 2;
    let ladder = null, ld = 1e9;
    for (let y = best[1]; y < best[1] + ph; y++) for (let x = best[0]; x < best[0] + pw; x++) {
      for (let k = 0; k < 4; k++) {
        const lx = x + DX[k], ly = y + DY[k];
        if (world.isPool(lx, ly) || !world.walkable(lx, ly)) continue;
        const d = Math.hypot(lx - hx, ly - hy) + Math.abs(x - cx) * 0.3 + Math.abs(y - cy) * 0.3;
        if (d < ld) { ld = d; ladder = [x, y, (k + 2) % 4]; }
      }
    }
    if (ladder) world.placeObject('pool_ladder', ladder[0], ladder[1], ladder[2], { lot: lot.id });
    return true;
  }

  function lotFrontCells(lot) {
    const out = [];
    if (lot.front === 'S') for (let x = lot.x; x < lot.x + lot.w; x++) out.push([x, lot.y + lot.h - 1]);
    if (lot.front === 'N') for (let x = lot.x; x < lot.x + lot.w; x++) out.push([x, lot.y]);
    if (lot.front === 'E') for (let y = lot.y; y < lot.y + lot.h; y++) out.push([lot.x + lot.w - 1, y]);
    if (lot.front === 'W') for (let y = lot.y; y < lot.y + lot.h; y++) out.push([lot.x, y]);
    return out;
  }

  function addLotItems(world, lot, pathCell, rng) {
    const fdir = { N: 0, E: 1, S: 2, W: 3 }[lot.front];
    const cells = lotFrontCells(lot);
    let px = pathCell ? pathCell[0] : cells[cells.length >> 1][0], py = pathCell ? pathCell[1] : cells[cells.length >> 1][1];
    const side = [-DY[fdir], DX[fdir]];
    const tryPlace = (type, off) => {
      for (let k = 0; k < 6; k++) {
        const x = px + side[0] * (off + Math.sign(off) * k), y = py + side[1] * (off + Math.sign(off) * k);
        if (world.lotAt(x, y) !== lot.id) continue;
        if (world.canPlace(type, x, y, fdir).ok && !world.floorAt(x, y)) return world.placeObject(type, x, y, fdir, { lot: lot.id });
      }
      return null;
    };
    tryPlace('mailbox', -1);
    tryPlace('trash_can', 2);
  }

  function placeRabbit(world, lot, rng) {
    const vertical = lot.front === 'E' || lot.front === 'W';
    const lw = vertical ? lot.h : lot.w, ld = vertical ? lot.w : lot.h;
    const def = OBJECTS['rh_' + lot.rh];
    const bw = def.size[0], bd = def.size[1];
    const M = lotMapper(lot, lw, ld);
    const bx = Math.floor((lw - bw) / 2);
    let by = ld - bd - 3;
    if (by < 1) by = Math.max(0, ld - bd - 2);
    for (let y = by + bd; y < ld; y++) for (let x = 0; x < lw; x++) {
      const p = M.map(x, y);
      world.terrain[world.idx(p[0], p[1])] = TER.plaza;
    }
    const ob = placeMapped(world, M, 'rh_' + lot.rh, bx, by, 2, { lot: lot.id, rh: lot.rh }, null);
    const ent = M.map(bx + Math.floor(bw / 2), by + bd);
    lot.entrance = ent;
    lot.building = ob ? ob.id : 0;
    const deco = [['tree_oak', 0, 0], ['tree_oak', lw - 1, 0], ['bench_park', 1, ld - 2, 2], ['bench_park', lw - 3, ld - 2, 2], ['flowerbed', bx - 1, by + bd], ['flowerbed', bx + bw, by + bd], ['streetlamp', 0, ld - 1], ['streetlamp', lw - 1, ld - 1], ['trash_can', bx + bw + 1, ld - 1]];
    for (const d of deco) {
      if (d[1] < 0 || d[2] < 0 || d[1] >= lw || d[2] >= ld) continue;
      placeMapped(world, M, d[0], d[1], d[2], d[3] === undefined ? 2 : d[3], { lot: lot.id }, null);
    }
    for (let y = 0; y < by; y++) for (let x = 0; x < lw; x += 3) {
      if (rng.chance(0.35)) placeMapped(world, M, rng.pick(['tree_oak', 'tree_maple', 'bush']), x, y, 0, { lot: lot.id }, null);
    }
  }

  function venuePark(world, lot, rng) {
    const X = lot.x, Y = lot.y, W = lot.w, Hh = lot.h;
    const cx = X + 12, cy = Y + 12;
    for (let y = Y; y < Y + Hh; y++) for (let x = X; x < X + W; x++) {
      const onCross = Math.abs(x - cx - 0.5) < 1.2 || Math.abs(y - cy - 0.5) < 1.2;
      const ring = Math.abs(Math.hypot(x - cx - 0.5, y - cy - 0.5) - 5) < 0.8;
      if (onCross || ring) world.terrain[world.idx(x, y)] = TER.path;
    }
    for (let y = Y + 17; y < Y + 23; y++) for (let x = X + 16; x < X + 23; x++) {
      const dx = (x - (X + 19.2)) / 3.4, dy = (y - (Y + 19.8)) / 2.9;
      if (dx * dx + dy * dy < 1) world.terrain[world.idx(x, y)] = TER.pond;
    }
    const P = (t, x, y, r, props) => { if (world.canPlace(t, X + x, Y + y, r || 0).ok) return world.placeObject(t, X + x, Y + y, r || 0, Object.assign({ lot: lot.id }, props || {})); return null; };
    P('fountain', 11, 11, 2);
    P('bench_park', 8, 15, 0); P('bench_park', 15, 8, 2); P('bench_park', 8, 8, 2); P('bench_park', 15, 15, 0);
    P('chess', 3, 3, 2); P('chess', 18, 3, 2);
    P('park_grill', 3, 9, 1); P('picnic_table', 4, 10, 2); P('park_grill', 20, 10, 3); P('picnic_table', 18, 10, 2);
    P('climber', 3, 16, 2); P('swingset', 6, 19, 2);
    P('drink_fountain', 14, 5, 3);
    P('trash_can', 10, 4, 2); P('trash_can', 16, 19, 2);
    for (const [x, y] of [[10, 10], [14, 10], [10, 14], [14, 14], [12, 2], [12, 22], [2, 12], [22, 12]]) P('streetlamp', x, y, 0);
    const rr = S.BLUEPRINTS.restroom;
    const sub = { id: lot.id, key: lot.key + '_wc', x: X + 1, y: Y + 20, w: rr.w, h: rr.d, front: 'S' };
    applyBlueprint(world, sub, 'restroom', { furnish: true });
    lot.extraDoors = [sub.frontDoor];
    for (let i = 0; i < 70; i++) {
      const x = rng.int(0, W - 1), y = rng.int(0, Hh - 1);
      if (world.terrain[world.idx(X + x, Y + y)] !== TER.grass && world.terrain[world.idx(X + x, Y + y)] !== TER.grass2) continue;
      if (Math.hypot(x - 12, y - 12) < 7) continue;
      const t = rng.chance(0.2) ? 'flowerbed' : rng.chance(0.3) ? 'bush' : rng.pick(['tree_oak', 'tree_maple', 'tree_oak']);
      P(t, x, y, 0);
    }
    for (let i = 0; i < 20; i++) {
      const x = rng.int(15, 24), y = rng.int(15, 24);
      if (world.terrain[world.idx(X + x, Y + y)] === TER.grass) world.terrain[world.idx(X + x, Y + y)] = TER.flowers;
    }
  }

  function venueBeach(world, lot, rng) {
    const X = lot.x, Y = lot.y;
    const P = (t, x, y, r) => world.canPlace(t, X + x, Y + y, r || 0).ok ? world.placeObject(t, X + x, Y + y, r || 0, { lot: lot.id }) : null;
    P('lifeguard', 2, 11, 1);
    P('park_grill', 0, 4, 1); P('picnic_table', 1, 5, 1);
    P('park_grill', 0, 19, 1); P('picnic_table', 1, 20, 1);
    P('shower', 0, 15, 1);
    P('bench_park', 3, 2, 1); P('bench_park', 3, 23, 1);
    P('trash_can', 0, 9, 1); P('drink_fountain', 0, 13, 1);
    for (const [x, y] of [[1, 1], [2, 8], [1, 16], [2, 24], [4, 18]]) P('tree_palm', x, y, 0);
  }

  function venueGraveyard(world, lot, rng) {
    const X = lot.x, Y = lot.y, W = lot.w, Hh = lot.h;
    for (let y = Y; y < Y + Hh; y++) for (let x = X; x < X + W; x++) {
      const i = world.idx(x, y);
      if (rng.chance(0.4)) world.terrain[i] = TER.grass2;
      if (x === X + 13 || x === X + 12) world.terrain[i] = TER.path;
    }
    for (let y = Y + 14; y < Y + 19; y++) for (let x = X + 2; x < X + 8; x++) {
      const dx = (x - (X + 4.8)) / 3, dy = (y - (Y + 16.4)) / 2.4;
      if (dx * dx + dy * dy < 1) world.terrain[world.idx(x, y)] = TER.pond;
    }
    const P = (t, x, y, r, props) => world.canPlace(t, X + x, Y + y, r || 0).ok ? world.placeObject(t, X + x, Y + y, r || 0, Object.assign({ lot: lot.id }, props || {})) : null;
    P('mausoleum', 17, 2, 2);
    const names = ['Агата Уинслоу', 'Джедедайя Хоук', 'Мэйбл Кроули', 'Эзра Пибоди', 'Клара Бейн', 'Сайлас Гримм', 'Оливия Штерн', 'Бартоломью Грин', 'Хэтти Лоу', 'Амброз Финч', 'Миртл Кэш', 'Эдгар Вейл'];
    let n = 0;
    for (let y = 3; y <= 11; y += 3) for (let x = 2; x <= 10; x += 2) P('tombstone', x, y, 2, { st: { name: names[n++ % names.length], year: 1850 + rng.int(0, 140) } });
    for (let y = 13; y <= 19; y += 3) for (let x = 15; x <= 23; x += 2) P('tombstone', x, y, 2, { st: { name: names[n++ % names.length], year: 1850 + rng.int(0, 140) } });
    P('bench_park', 9, 16, 1); P('streetlamp', 12, 8, 0); P('streetlamp', 13, 18, 0);
    for (const [x, y] of [[0, 0], [25, 0], [0, 21], [25, 21], [8, 13], [22, 8], [1, 11]]) P(rng.chance(0.5) ? 'tree_pine' : 'tree_maple', x, y, 0);
  }

  function venuePier(world, lot, rng) {
    const X = lot.x, Y = lot.y;
    for (let y = Y + 10; y < Y + 14; y++) for (let x = X; x < X + lot.w; x++) {
      if (isSea(x, y) || x >= X + 4) world.terrain[world.idx(x, y)] = TER.bridge;
    }
    const P = (t, x, y, r) => world.canPlace(t, X + x, Y + y, r || 0).ok ? world.placeObject(t, X + x, Y + y, r || 0, { lot: lot.id }) : null;
    P('bench_park', 8, 10, 2); P('bench_park', 11, 13, 0);
    P('streetlamp', 7, 13, 0); P('streetlamp', 13, 10, 0);
    P('trash_can', 1, 9, 1);
    P('boat', 9, 5, 0); P('boat', 12, 17, 1);
    for (const [x, y] of [[1, 2], [2, 22], [0, 16]]) P('tree_palm', x, y, 0);
  }

  function venueLighthouse(world, lot, rng) {
    const X = lot.x, Y = lot.y;
    const P = (t, x, y, r) => world.canPlace(t, X + x, Y + y, r || 0).ok ? world.placeObject(t, X + x, Y + y, r || 0, { lot: lot.id }) : null;
    for (let y = Y; y < Y + lot.h; y++) for (let x = X + 6; x < X + 9; x++) if (!isSea(x, y)) world.terrain[world.idx(x, y)] = TER.path;
    P('lighthouse', 10, 10, 0);
    P('bench_park', 5, 8, 1); P('bench_park', 9, 6, 2);
    P('streetlamp', 9, 2, 0);
    for (const [x, y] of [[13, 4], [2, 12], [14, 8], [4, 3], [12, 14]]) P('rock', x, y, 0);
    for (const [x, y] of [[1, 1], [3, 6], [13, 1]]) P('tree_pine', x, y, 0);
  }

  function buildTown(seed) {
    const rng = new RNG(seed || 1999);
    const world = new World(TW, TH);
    const log = [];
    for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
      const i = world.idx(x, y);
      if (isSea(x, y)) world.terrain[i] = TER.sea;
      else world.terrain[i] = S.hash2(x >> 1, y >> 1, 7) < 0.3 ? TER.grass2 : TER.grass;
    }
    const dist = new Int16Array(TW * TH).fill(99);
    const q = [];
    for (let i = 0; i < TW * TH; i++) if (world.terrain[i] === TER.sea) { dist[i] = 0; q.push(i); }
    for (let h = 0; h < q.length; h++) {
      const c = q[h], x = c % TW, y = (c / TW) | 0;
      for (let k = 0; k < 4; k++) {
        const nx = x + DX[k], ny = y + DY[k];
        if (!world.inb(nx, ny)) continue;
        const ni = ny * TW + nx;
        if (dist[ni] <= dist[c] + 1) continue;
        dist[ni] = dist[c] + 1;
        if (dist[ni] < 6) q.push(ni);
      }
    }
    for (let i = 0; i < TW * TH; i++) if (world.terrain[i] !== TER.sea && dist[i] <= 4 + ((S.hash2(i % TW, (i / TW) | 0, 3) * 2) | 0)) world.terrain[i] = TER.sand;
    const paintRoad = (x, y, dir, lane, edge) => {
      if (!world.inb(x, y)) return;
      const i = world.idx(x, y);
      if (edge) {
        if (world.terrain[i] === TER.road || world.terrain[i] === TER.bridge && world.road[i]) return;
        world.terrain[i] = world.terrain[i] === TER.sea || world.terrain[i] === TER.bridge ? TER.bridge : TER.walk;
        return;
      }
      const prev = world.road[i];
      const onWater = world.terrain[i] === TER.sea || world.terrain[i] === TER.bridge;
      world.terrain[i] = onWater ? TER.bridge : TER.road;
      if (prev && (prev & 3) !== dir) world.road[i] = 3;
      else world.road[i] = dir | (lane << 2);
    };
    for (const r of HROADS) for (let x = r.x0; x <= r.x1; x++) for (let k = 0; k < ROAD_W; k++) paintRoad(x, r.y + k, 1, k - 1, k === 0 || k === ROAD_W - 1);
    for (const r of VROADS) for (let y = r.y0; y <= r.y1; y++) for (let k = 0; k < ROAD_W; k++) paintRoad(r.x + k, y, 2, k - 1, k === 0 || k === ROAD_W - 1);
    const lots = [];
    for (const d of LOT_DEFS) {
      const lot = Object.assign({ id: lots.length, hh: null, value: 0, price: 0 }, JSON.parse(JSON.stringify(d)));
      lots.push(lot);
      for (let y = lot.y; y < lot.y + lot.h; y++) for (let x = lot.x; x < lot.x + lot.w; x++) {
        if (!world.inb(x, y)) continue;
        const i = world.idx(x, y);
        world.lot[i] = lot.id;
        if (world.terrain[i] === TER.walk || world.terrain[i] === TER.road) log.push('lot on road ' + lot.key + ' ' + x + ',' + y);
      }
      const fd = { N: 0, E: 1, S: 2, W: 3 }[lot.front];
      const cells = lotFrontCells(lot);
      const mid = cells[cells.length >> 1];
      lot.curb = [mid[0] + DX[fd], mid[1] + DY[fd]];
      const road = HROADS.concat(VROADS).find(r => r.y !== undefined ? lot.curb[1] >= r.y && lot.curb[1] < r.y + ROAD_W : lot.curb[0] >= r.x && lot.curb[0] < r.x + ROAD_W);
      lot.street = road ? road.name : 'Береговая дорога';
      lot.number = road ? (road.y !== undefined ? Math.round(lot.curb[0] / 3) + 1 : Math.round(lot.curb[1] / 3) + 1) : 1;
      lot.address = lot.street + ', ' + lot.number;
      lot.lane = road ? (road.y !== undefined ? [lot.curb[0], lot.curb[1] + (fd === 0 ? -2 : 2)] : [lot.curb[0] + (fd === 3 ? -2 : 2), lot.curb[1]]) : lot.curb.slice();
    }
    world.lots = lots;
    world.lotByKey = {};
    for (const lot of lots) world.lotByKey[lot.key] = lot;
    for (const lot of lots) {
      if (lot.kind === 'home' && lot.bp) {
        const res = applyBlueprint(world, lot, lot.bp, { ext: lot.ext, roof: lot.roof, log });
        addLotItems(world, lot, lot.frontDoor ? res.M.map(BLUEPRINTS[lot.bp].front[0], BLUEPRINTS[lot.bp].d - 1) : null, rng);
        if (lot.key === 'landgraab' || lot.key === 'alto') addPool(world, lot, lot.key === 'alto' ? 5 : 4, 3);
      } else if (lot.kind === 'home') {
        addLotItems(world, lot, null, rng);
        lot.frontDoor = null;
      } else if (lot.kind === 'rabbit') {
        placeRabbit(world, lot, rng);
      } else if (lot.venue === 'gym' || lot.venue === 'library') {
        applyBlueprint(world, lot, lot.bp, { log });
        lot.entrance = lot.frontDoor;
      } else if (lot.venue === 'park') venuePark(world, lot, rng);
      else if (lot.venue === 'beach') venueBeach(world, lot, rng);
      else if (lot.venue === 'graveyard') venueGraveyard(world, lot, rng);
      else if (lot.venue === 'pier') venuePier(world, lot, rng);
      else if (lot.venue === 'lighthouse') venueLighthouse(world, lot, rng);
      if (!lot.entrance) lot.entrance = lot.frontDoor || [lot.x + (lot.w >> 1), lot.y + (lot.h >> 1)];
    }
    for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
      const i = world.idx(x, y);
      if (world.lot[i] >= 0) continue;
      const t = world.terrain[i];
      if (t === TER.walk) {
        if ((x * 7 + y * 13) % 11 === 0) {
          let nearRoad = false;
          for (let k = 0; k < 4; k++) { const nx = x + DX[k], ny = y + DY[k]; if (world.inb(nx, ny) && world.terrain[world.idx(nx, ny)] === TER.road) nearRoad = true; }
          if (nearRoad && !world.layer.ground[i]) world.placeObject('streetlamp', x, y, 0, { lot: -1 });
        }
        continue;
      }
      if (t !== TER.grass && t !== TER.grass2 && t !== TER.sand) continue;
      let nearWalk = false;
      for (let k = 0; k < 4; k++) { const nx = x + DX[k], ny = y + DY[k]; if (world.inb(nx, ny) && world.terrain[world.idx(nx, ny)] === TER.walk) nearWalk = true; }
      const edge = x < 2 || y < 2 || (x > 94 && x < 120 && y > 126);
      let p = edge ? 0.45 : nearWalk ? 0.12 : 0.1;
      if (t === TER.sand) p = 0.04;
      if (rng.chance(p) && world.canPlace('tree_oak', x, y, 0).ok) {
        const type = t === TER.sand ? 'tree_palm' : y > 126 && x > 90 ? rng.pick(['tree_pine', 'tree_pine', 'tree_oak']) : rng.pick(['tree_oak', 'tree_maple', 'tree_pine', 'tree_oak', 'bush']);
        world.placeObject(type, x, y, rng.int(0, 3), { lot: -1 });
      }
    }
    for (let k = 0; k < 6; k++) {
      const x = 140 + rng.int(-4, 12), y = 90 + rng.int(-60, 50);
      if (world.inb(x, y) && world.terrain[world.idx(x, y)] === TER.sea && world.canPlace('boat', x, y, 0).ok) world.placeObject('boat', x, y, rng.int(0, 3), { lot: -1 });
    }
    world.computeRooms();
    for (const lot of lots) {
      let objVal = 0, walls = 0, floors = 0;
      for (const ob of world.objects.values()) if (ob.lot === lot.id && !OBJECTS[ob.t].hidden) objVal += OBJECTS[ob.t].price;
      for (const w of world.walls) if (w && w.lot === lot.id) walls++;
      for (let y = lot.y; y < lot.y + lot.h; y++) for (let x = lot.x; x < lot.x + lot.w; x++) if (world.floor[world.idx(x, y)]) floors++;
      lot.land = lot.w * lot.h * 6;
      let pools = 0;
      for (let y = lot.y; y < lot.y + lot.h; y++) for (let x = lot.x; x < lot.x + lot.w; x++) if (world.terrain[world.idx(x, y)] === TER.pool) pools++;
      lot.value = Math.round((lot.land + objVal + walls * 30 + floors * 8 + pools * 40) / 100) * 100;
      lot.price = lot.value;
    }
    world.spawns = [];
    for (const key of ['park', 'beach', 'graveyard', 'lighthouse', 'pier', 'military', 'science']) {
      const lot = world.lotByKey[key];
      for (let k = 0; k < 40 && world.spawns.filter(s => s.lot === lot.id).length < 5; k++) {
        const x = lot.x + rng.int(0, lot.w - 1), y = lot.y + rng.int(0, lot.h - 1);
        if (world.walkable(x, y) && !world.layer.ground[world.idx(x, y)] && !world.indoor(x, y)) world.spawns.push({ x, y, lot: lot.id });
      }
    }
    for (let k = 0; k < 400 && world.spawns.length < 44; k++) {
      const x = rng.int(0, TW - 1), y = rng.int(0, TH - 1);
      const i = world.idx(x, y);
      if (world.lot[i] < 0 && (world.terrain[i] === TER.grass || world.terrain[i] === TER.grass2 || world.terrain[i] === TER.sand) && world.walkable(x, y)) world.spawns.push({ x, y, lot: -1 });
    }
    world.waterKind = (x, y) => {
      const t = world.ter(x, y);
      if (t === TER.sea) return 'sea';
      if (t !== TER.pond) return null;
      const l = world.lots[world.lotAt(x, y)];
      return l && l.key === 'graveyard' ? 'grave' : l && l.key === 'science' ? 'pond' : 'pond';
    };
    world.log = log;
    return { world, lots, rng };
  }

  Object.assign(S, { buildTown, RH, LOT_DEFS, HROADS, VROADS, ROAD_W, TOWN_W: TW, TOWN_H: TH, isSea, lotMapper, applyBlueprint, placeMapped });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
