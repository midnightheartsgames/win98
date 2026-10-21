(function (H) {
  'use strict';

  const TOWN_NAMES = {
    knight: ['Айронфист', 'Хайкасл', 'Белый Холм', 'Стормгард', 'Оаквуд', 'Нортфолк'],
    barbarian: ['Краг-Рок', 'Волчий Курган', 'Кровавый Рог', 'Гримхейм', 'Степной Вал', 'Торгаш'],
    sorceress: ['Сильверлив', 'Лунный Ручей', 'Элария', 'Мистхейвен', 'Звёздный Луг', 'Изумрудный Бор'],
    warlock: ['Блэкстоун', 'Серный Пик', 'Ашар', 'Даркхолм', 'Лавовый Свод', 'Моргрим']
  };

  const ARCH_RIVALS = {
    knight: 'barbarian',
    barbarian: 'knight',
    sorceress: 'warlock',
    warlock: 'sorceress'
  };

  const ULTIMATE_BY_FACTION = {
    knight: 'ultimate_sword_dominion',
    barbarian: 'ultimate_cloak',
    sorceress: 'ultimate_book',
    warlock: 'ultimate_wand'
  };

  const CAMPAIGN_SCENARIOS = [
    {
      index: 0,
      id: 'claw',
      title: '1. Коготь',
      size: 36,
      players: 4,
      waterMode: 'none',
      biomes: ['grass', 'dirt'],
      winCondition: 'conquer_all',
      parDays: 21,
      intros: {
        knight: 'Врата привели дружину Морглина Айронфиста в пограничную долину Когтя. Чтобы закрепиться в Энроте, нужно поставить под охрану лесопилки и выбить соседей за хребет.',
        barbarian: 'Племена Слейера спустились с предгорий в долину Когтя. Здешние деревни полны хлеба и железа: самое время взять их с первого наскока.',
        sorceress: 'Королева Ламанда вывела лесной дозор к предгорьям Когтя. Чужаки уже рубят вековые рощи у перевала, и остановить их может только быстрый залп эльфийских луков.',
        warlock: 'Лорд Аламар основал первую цитадель у старого кратера долины Когтя. Разведчики доложили о трёх мелких вождях по ту сторону ущелья.'
      }
    },
    {
      index: 1,
      id: 'archipelago',
      title: '2. Архипелаг',
      size: 54,
      players: 4,
      waterMode: 'islands',
      biomes: ['grass', 'desert', 'water'],
      winCondition: 'conquer_all',
      parDays: 28,
      intros: {
        knight: 'Война перекинулась на Туманный Архипелаг. Заложите верфь в гавани, спустите парусники на воду и займите маяки раньше соперников.',
        barbarian: 'За проливом лежат богатые острова с золотыми приисками. Рубите сосны на ладьи и переправляйте волчьи стаи на чужие берега.',
        sorceress: 'Морские течения Архипелага знакомы кормчим Ламанды с детства. Наши парусники идут вдвое быстрее чужих, поэтому архипелаг станет нашей крепостью.',
        warlock: 'Между островами Архипелага покоятся затонувшие галеоны и древние святилища. Крылатые гаргульи и корабли принесут Аламару ключи от проливов.'
      }
    },
    {
      index: 2,
      id: 'wounded_land',
      title: '3. Око бури',
      size: 54,
      players: 4,
      waterMode: 'none',
      biomes: ['desert', 'dirt', 'snow'],
      winCondition: 'ultimate_artifact',
      parDays: 28,
      intros: {
        knight: 'В выжженной котловине Ока Бури сокрыта древняя реликвия королей. Обойдите каменные обелиски и откопайте клад раньше, чем до него доберутся лазутчики врага.',
        barbarian: 'Шаманы видели знак в песках: посреди пустыни зарыто сокровище древних великанов. Найдите все обелиски и выкопайте реликвию до прихода соперников.',
        sorceress: 'Под песками Ока Бури дремлет талисман первозданной силы. Обелиски укажут точное место раскопок тому, кто опередит чужие разъезды.',
        warlock: 'Древние хроники гласят, что в пустыне Ока Бури погребён артефакт невиданной мощи. Прочтите знаки всех обелисков и заберите его в сокровищницу Аламара.'
      }
    },
    {
      index: 3,
      id: 'gauntlet',
      title: '4. Судный перевал',
      size: 54,
      players: 2,
      duelArchRival: true,
      waterMode: 'none',
      biomes: ['lava', 'dirt', 'grass'],
      winCondition: 'conquer_all',
      parDays: 28,
      intros: {
        knight: 'На лавовых мостах Судного перевала путь преградил сам Лорд Слейер. Одолейте главного вождя варваров в поединке один на один.',
        barbarian: 'Лорд Айронфист заперся за каменными стенами Судного перевала. Сокрушите его латников в открытом бою один на один.',
        sorceress: 'Лорд Аламар стянул легионы подземелий к Судному перевалу. Настал день решающего поединка между лесным кругом и Чёрной башней.',
        warlock: 'Королева Ламанда перекрыла горные тропы Судного перевала. Выжгите её стрелков огнём и покончите с главной соперницей один на один.'
      }
    },
    {
      index: 4,
      id: 'king_of_the_hill',
      title: '5. Королевский тракт',
      size: 54,
      players: 4,
      centralCastle: true,
      waterMode: 'none',
      biomes: ['grass', 'swamp', 'dirt'],
      winCondition: 'conquer_all',
      parDays: 35,
      intros: {
        knight: 'В сердце перекрёстка стоит богатая цитадель древних наместников. Тот, кто займёт и удержит центральный замок, подчинит себе все четыре дороги.',
        barbarian: 'Четыре тракта сходятся к центральной твердыне. Захватите её раньше соседей, и золотые обозы потекут прямо в ваши шатры.',
        sorceress: 'На скрещении древних дорог возвышается белый замок. Установите над ним знамя Ламанды и отбросьте остальных претендентов.',
        warlock: 'Центральный замок на перекрёстке открывает прямой путь во все четыре долины. Возьмите его штурмом и превратите в главный оплот Аламара.'
      }
    },
    {
      index: 5,
      id: 'badlands',
      title: '6. Гиблые топи',
      size: 72,
      players: 4,
      hasTeleporters: true,
      waterMode: 'none',
      biomes: ['swamp', 'desert', 'lava'],
      winCondition: 'conquer_all',
      parDays: 42,
      intros: {
        knight: 'Дорога к внутренним землям лежит через Гиблые топи, где конница вязнет в трясине, а между островами мерцают каменные монолиты.',
        barbarian: 'Чужие кони тонут в Гиблых топях, зато наши воины шагают по болотной гати как по сухому камню. Используйте монолиты для внезапных ударов.',
        sorceress: 'Среди Гиблых топей спрятаны волшебные лампы джиннов и врата монолитов. Крылатые феи и фениксы проведут войско над бездорожьем.',
        warlock: 'В тумане Гиблых топей стоят древние курганы и порталы монолитов. Тот, кто овладеет сетью переходов, застанет вражеские столицы врасплох.'
      }
    },
    {
      index: 6,
      id: 'crossroads',
      title: '7. Врата стихий',
      size: 72,
      players: 4,
      waterMode: 'inland_sea',
      biomes: ['grass', 'snow', 'desert', 'lava', 'swamp', 'water'],
      winCondition: 'conquer_all',
      parDays: 49,
      intros: {
        knight: 'Шесть земель сошлись вокруг внутреннего моря Врат Стихий. Соберите полную казну кристаллов для Собора паладинов и готовьте флот к походу.',
        barbarian: 'От снежных перевалов до лавовых плато раскинулись Врата Стихий. Поднимите циклопов из пирамид и сокрушите последние рубежи обороны.',
        sorceress: 'Вокруг внутреннего моря Врат Стихий бьют источники всех четырёх кругов магии. Изучите высшие заклинания и призовите стаи фениксов.',
        warlock: 'Склоны Врат Стихий богаты чистой серой и кристаллами. Достройте четвёртый этаж Гильдии магов и выведите в небо чёрных драконов.'
      }
    },
    {
      index: 7,
      id: 'final_reckoning',
      title: '8. За корону Энрота',
      size: 72,
      players: 4,
      alliedRivals: true,
      waterMode: 'inland_sea',
      biomes: ['grass', 'lava', 'snow', 'desert', 'swamp', 'dirt'],
      winCondition: 'conquer_all',
      parDays: 56,
      intros: {
        knight: 'Страшась вашего возвышения, Слейер, Ламанда и Аламар заключили тройственный союз. Выдержите первый натиск и возьмите все три вражеские столицы.',
        barbarian: 'Айронфист, Ламанда и Аламар объединили свои войска против наших кланов. Разбейте их коалицию поодиночке и заберите корону Энрота.',
        sorceress: 'Три соперника сговорились выступить против Ламанды единым фронтом. Опередите их армии на переправах и принесите мир всему континенту.',
        warlock: 'В страхе перед мощью Чёрной башни три правителя объединили знамёна. Обратите их союз в пепел и провозгласите Аламара единовластным владыкой Энрота.'
      }
    }
  ];

  const CAMPAIGN_EPILOGUES = {
    knight: 'Знамёна соперников пали перед железным строем паладинов. Лорд Морглин Айронфист венчался короной Энрота, учредил свод законов и заложил династию, которой суждено править континентом долгие века.',
    barbarian: 'Ни каменные стены, ни чародейские башни не устояли перед натиском степных кланов. Лорд Слейер принял присягу всех четырёх земель и доказал, что корона принадлежит тому, чей меч крепче.',
    sorceress: 'Костры войны погасли от морских берегов до горных вершин. Королева Ламанда восстановила вырубленные рощи и утвердила над Энротом век мудрости и согласия.',
    warlock: 'Тронный зал столицы озарился багровым светом Чёрной башни. Лорд Аламар склонил всех правителей перед властью драконов и высших чар, став полновластным господином Энрота.'
  };

  const STANDALONE_MAPS = [
    {
      id: 'valley_of_lords',
      title: 'Долина Четырёх Лордов',
      size: 36,
      players: 4,
      waterMode: 'none',
      biomes: ['grass', 'dirt', 'desert', 'lava'],
      winCondition: 'conquer_all',
      desc: 'Компактная долина на четверых правителей с быстрыми стычками за центральные шахты.'
    },
    {
      id: 'twin_peaks',
      title: 'Два пика',
      size: 36,
      players: 2,
      waterMode: 'none',
      biomes: ['grass', 'snow'],
      winCondition: 'conquer_all',
      desc: 'Дуэльная карта для двух полководцев с двумя горными перевалами и золотым рудником посередине.'
    },
    {
      id: 'emerald_isles',
      title: 'Изумрудные острова',
      size: 54,
      players: 4,
      waterMode: 'islands',
      biomes: ['grass', 'desert', 'water'],
      winCondition: 'conquer_all',
      desc: 'Четыре крупных острова, морские торговые пути, маяки и затонувшие сокровища.'
    },
    {
      id: 'dragon_sands',
      title: 'Пески Дракона',
      size: 54,
      players: 4,
      waterMode: 'none',
      biomes: ['desert', 'lava', 'dirt'],
      winCondition: 'ultimate_artifact',
      desc: 'Жаркая пустыня с восемью обелисками, Сфинксом и зарытым Конечным Артефактом.'
    },
    {
      id: 'frozen_crown',
      title: 'Ледяная корона',
      size: 72,
      players: 4,
      hasTeleporters: true,
      waterMode: 'none',
      biomes: ['snow', 'grass', 'swamp'],
      winCondition: 'conquer_all',
      desc: 'Большая северная карта с сетью каменных монолитов и богатыми нейтральными замками.'
    },
    {
      id: 'wheel_of_fortune',
      title: 'Колесо Фортуны',
      size: 72,
      players: 4,
      centralCastle: true,
      waterMode: 'inland_sea',
      biomes: ['grass', 'dirt', 'snow', 'desert', 'swamp', 'lava'],
      winCondition: 'conquer_all',
      desc: 'Огромный континент со всеми шестью типами земель, внутренним морем и Городом Драконов.'
    }
  ];

  const RATING_RANKS = [
    { minScore: 0, unit: 'peasant', name: 'Крестьянин' },
    { minScore: 200, unit: 'goblin', name: 'Гоблин' },
    { minScore: 350, unit: 'sprite', name: 'Фея' },
    { minScore: 500, unit: 'archer', name: 'Лучник' },
    { minScore: 650, unit: 'dwarf', name: 'Гном' },
    { minScore: 800, unit: 'pikeman', name: 'Пикинёр' },
    { minScore: 950, unit: 'elf', name: 'Эльф' },
    { minScore: 1100, unit: 'griffin', name: 'Грифон' },
    { minScore: 1250, unit: 'swordsman', name: 'Мечник' },
    { minScore: 1400, unit: 'druid', name: 'Друид' },
    { minScore: 1550, unit: 'minotaur', name: 'Минотавр' },
    { minScore: 1700, unit: 'cavalry', name: 'Кавалерист' },
    { minScore: 1850, unit: 'unicorn', name: 'Единорог' },
    { minScore: 2000, unit: 'hydra', name: 'Гидра' },
    { minScore: 2200, unit: 'paladin', name: 'Паладин' },
    { minScore: 2400, unit: 'cyclops', name: 'Циклоп' },
    { minScore: 2650, unit: 'phoenix', name: 'Феникс' },
    { minScore: 2900, unit: 'dragon', name: 'Дракон' }
  ];

  function rankForScore(score) {
    let best = RATING_RANKS[0];
    for (const r of RATING_RANKS) {
      if (score >= r.minScore) best = r;
    }
    return best;
  }

  function carveLine(map, x0, y0, x1, y1, roadTile) {
    let cx = x0 | 0;
    let cy = y0 | 0;
    const tx = x1 | 0;
    const ty = y1 | 0;
    while (true) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (!H.inBounds(map, nx, ny)) continue;
          const idx = H.tileIndex(map, nx, ny);
          map.blocked[idx] = 0;
          if (map.tiles[idx] === 'water') {
            map.tiles[idx] = 'grass';
          }
        }
      }
      const centerIdx = H.tileIndex(map, cx, cy);
      if (roadTile) map.tiles[centerIdx] = roadTile;
      if (cx === tx && cy === ty) break;
      if (Math.abs(tx - cx) >= Math.abs(ty - cy)) {
        cx += tx > cx ? 1 : -1;
      } else {
        cy += ty > cy ? 1 : -1;
      }
    }
  }

  function clearPatch(map, cx, cy, radius, terrainOverride) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (!H.inBounds(map, x, y)) continue;
        const idx = H.tileIndex(map, x, y);
        map.blocked[idx] = 0;
        if (terrainOverride) {
          map.tiles[idx] = terrainOverride;
        } else if (map.tiles[idx] === 'water') {
          map.tiles[idx] = 'grass';
        }
      }
    }
  }

  function createTownRecord(id, name, faction, owner, x, y, hasCastle, coastal, rng) {
    const f = H.FACTIONS[faction] || H.FACTIONS.knight;
    const buildings = { dwell_1: true };
    if (hasCastle) {
      buildings.castle = true;
      buildings.tavern = true;
      buildings.dwell_2 = true;
    }
    const available = {
      1: H.UNITS[f.units[0]].growth,
      2: hasCastle ? H.UNITS[f.units[1]].growth : 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0
    };
    const garrison = new Array(H.ARMY_SLOTS).fill(null);
    if (!owner) {
      garrison[0] = { unit: f.units[0], count: rng.int(10, 18) };
      garrison[1] = { unit: f.units[1], count: rng.int(4, 8) };
    }
    return {
      id,
      name,
      faction,
      owner: owner || null,
      x,
      y,
      coastal: !!coastal,
      builtToday: false,
      buildings,
      available,
      garrison,
      guildSpells: H.rollMageGuildSpells(rng)
    };
  }

  function generateMap(spec, seed, humanFaction) {
    const s = spec || STANDALONE_MAPS[0];
    const rng = new H.RNG(seed || 2026);
    const w = s.size || 36;
    const h = s.size || 36;
    const N = w * h;
    const tiles = new Array(N).fill('grass');
    const blocked = new Uint8Array(N);

    const playerCount = s.players || 4;
    const mainFaction = humanFaction || 'knight';
    const factions = [mainFaction];
    if (s.duelArchRival) {
      factions.push(ARCH_RIVALS[mainFaction] || 'barbarian');
    } else {
      for (const f of H.FACTION_ORDER) {
        if (!factions.includes(f) && factions.length < playerCount) {
          factions.push(f);
        }
      }
    }

    const biomes = s.biomes && s.biomes.length ? s.biomes : ['grass', 'dirt', 'desert', 'lava'];
    const halfW = w >> 1;
    const halfH = h >> 1;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const q = (y >= halfH ? 2 : 0) + (x >= halfW ? 1 : 0);
        let t = biomes[q % biomes.length];
        if (t === 'water') t = 'grass';
        tiles[idx] = t;

        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
          blocked[idx] = 1;
        } else if (rng.chance(0.08)) {
          blocked[idx] = 1;
        }
      }
    }

    if (s.waterMode === 'islands' || s.waterMode === 'inland_sea') {
      const seaRadius = s.waterMode === 'islands' ? Math.floor(w * 0.16) : Math.floor(w * 0.12);
      for (let y = 2; y < h - 2; y++) {
        for (let x = 2; x < w - 2; x++) {
          const d = Math.hypot(x - halfW, y - halfH);
          if (d >= seaRadius * 0.45 && d <= seaRadius) {
            const idx = y * w + x;
            tiles[idx] = 'water';
            blocked[idx] = 0;
          }
        }
      }
    }

    const corners = [
      { x: 6, y: 6 },
      { x: w - 7, y: 6 },
      { x: 6, y: h - 7 },
      { x: w - 7, y: h - 7 }
    ];
    if (playerCount === 2) {
      corners[1] = { x: w - 7, y: h - 7 };
    }

    const towns = [];
    const mines = [];
    const objects = [];
    const boats = [];
    const obelisks = [];
    const usedCoords = new Set();
    const markUsed = (x, y, rad) => {
      const r = rad || 1;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          usedCoords.add((x + dx) + ':' + (y + dy));
        }
      }
    };
    const isFree = (x, y) => H.inBounds({ w, h }, x, y) && !usedCoords.has(x + ':' + y);

    const mapObj = {
      id: s.id || 'custom_map',
      title: s.title || 'Сценарий',
      w,
      h,
      tiles,
      blocked,
      towns,
      mines,
      objects,
      boats,
      obelisks,
      winCondition: s.winCondition || 'conquer_all',
      alliedRivals: !!s.alliedRivals,
      parDays: s.parDays || 30,
      ultimateArtifact: null
    };

    const centerX = halfW;
    const centerY = halfH;
    clearPatch(mapObj, centerX, centerY, 4, s.biomes && s.biomes.includes('desert') ? 'desert' : 'grass');

    for (let p = 0; p < playerCount; p++) {
      const c = corners[p];
      const color = H.PLAYER_COLORS[p].id;
      const fac = factions[p % factions.length];
      const nativeT = H.FACTIONS[fac].nativeTerrain;
      clearPatch(mapObj, c.x, c.y, 4, nativeT);

      const coastal = s.waterMode === 'islands' || s.waterMode === 'inland_sea';
      const startHasCastle = (p === 0) || !!s.alliedRivals;
      const tName = TOWN_NAMES[fac][0] || ('Город ' + (p + 1));
      const town = createTownRecord('town_p' + p, tName, fac, color, c.x, c.y, startHasCastle, coastal, rng);
      towns.push(town);
      markUsed(c.x, c.y, 2);

      carveLine(mapObj, c.x, c.y, centerX, centerY, 'road');
      if (p > 0) {
        carveLine(mapObj, corners[p - 1].x, corners[p - 1].y, c.x, c.y, 'road');
      }
    }

    if (s.centralCastle) {
      const nFac = factions[(playerCount + 1) % H.FACTION_ORDER.length] || 'knight';
      const cTown = createTownRecord('town_center', 'Королевский Бастион', nFac, null, centerX, centerY, true, false, rng);
      towns.push(cTown);
      markUsed(centerX, centerY, 2);
    }

    const neutralTownSpots = [
      { x: halfW, y: 7 },
      { x: halfW, y: h - 8 },
      { x: 7, y: halfH },
      { x: w - 8, y: halfH }
    ];
    for (let i = 0; i < neutralTownSpots.length; i++) {
      const sp = neutralTownSpots[i];
      if (!isFree(sp.x, sp.y)) continue;
      const fac = H.FACTION_ORDER[i % H.FACTION_ORDER.length];
      clearPatch(mapObj, sp.x, sp.y, 2, H.FACTIONS[fac].nativeTerrain);
      const tName = TOWN_NAMES[fac][1 + (i % 4)];
      const nt = createTownRecord('town_n' + i, tName, fac, null, sp.x, sp.y, false, false, rng);
      towns.push(nt);
      markUsed(sp.x, sp.y, 2);
      carveLine(mapObj, sp.x, sp.y, centerX, centerY, 'road');
    }

    const rareRes = ['mercury', 'sulfur', 'crystal', 'gems', 'gold'];
    for (let p = 0; p < playerCount; p++) {
      const c = corners[p];
      const sx = c.x < halfW ? 1 : -1;
      const sy = c.y < halfH ? 1 : -1;

      const woodPos = { x: c.x + sx * 4, y: c.y };
      const orePos = { x: c.x, y: c.y + sy * 4 };
      const rarePos = { x: c.x + sx * 6, y: c.y + sy * 5 };
      const goldPos = { x: c.x + sx * 8, y: c.y + sy * 3 };

      const addMine = (id, res, pos, guardTier) => {
        clearPatch(mapObj, pos.x, pos.y, 1);
        mines.push({ id, res, owner: null, x: pos.x, y: pos.y });
        carveLine(mapObj, c.x, c.y, pos.x, pos.y);
        if (guardTier > 0) {
          const gx = pos.x - sx;
          const gy = pos.y + sy;
          if (isFree(gx, gy)) {
            clearPatch(mapObj, gx, gy, 1);
            const unitPool = H.UNIT_LIST.filter(u => u.tier === guardTier);
            const u = rng.pick(unitPool);
            objects.push({
              id: 'guard_' + id,
              type: 'monster',
              x: gx,
              y: gy,
              unit: u.id,
              count: rng.int(u.growth * 2, u.growth * 3)
            });
            markUsed(gx, gy, 0);
          }
        }
        markUsed(pos.x, pos.y, 1);
      };

      addMine('mine_w_' + p, 'wood', woodPos, 0);
      addMine('mine_o_' + p, 'ore', orePos, 0);
      addMine('mine_r_' + p, rareRes[p % rareRes.length], rarePos, 2);
      addMine('mine_g_' + p, 'gold', goldPos, 3);

      const chestPos = { x: c.x + sx * 3, y: c.y + sy * 2 };
      if (isFree(chestPos.x, chestPos.y)) {
        clearPatch(mapObj, chestPos.x, chestPos.y, 1);
        objects.push({ id: 'chest_p' + p, type: 'chest', x: chestPos.x, y: chestPos.y, gold: 1500, xp: 1000 });
        markUsed(chestPos.x, chestPos.y, 1);
      }

      const firePos = { x: c.x + sx * 2, y: c.y + sy * 4 };
      if (isFree(firePos.x, firePos.y)) {
        clearPatch(mapObj, firePos.x, firePos.y, 1);
        objects.push({
          id: 'fire_p' + p,
          type: 'campfire',
          x: firePos.x,
          y: firePos.y,
          gold: 500,
          bonusRes: rareRes[(p + 1) % 4],
          bonusAmt: 5
        });
        markUsed(firePos.x, firePos.y, 1);
      }

      const pilePos = { x: c.x + sx * 5, y: c.y + sy * 1 };
      if (isFree(pilePos.x, pilePos.y)) {
        clearPatch(mapObj, pilePos.x, pilePos.y, 1);
        objects.push({
          id: 'pile_p' + p,
          type: 'resource_pile',
          x: pilePos.x,
          y: pilePos.y,
          res: p % 2 === 0 ? 'wood' : 'ore',
          amount: 8
        });
        markUsed(pilePos.x, pilePos.y, 1);
      }

      const campPos = { x: c.x + sx * 4, y: c.y + sy * 3 };
      if (isFree(campPos.x, campPos.y)) {
        clearPatch(mapObj, campPos.x, campPos.y, 1);
        const t1Pool = H.UNIT_LIST.filter(u => u.tier === 1);
        const u1 = rng.pick(t1Pool);
        objects.push({
          id: 'roam_p' + p,
          type: 'monster',
          x: campPos.x,
          y: campPos.y,
          unit: u1.id,
          count: rng.int(10, 18)
        });
        markUsed(campPos.x, campPos.y, 0);
      }
    }

    const obeliskCount = 4;
    const obeliskOffsets = [
      [-6, -6], [6, -6], [-6, 6], [6, 6]
    ];
    for (let i = 0; i < obeliskCount; i++) {
      const ox = H.clamp(centerX + obeliskOffsets[i][0], 4, w - 5);
      const oy = H.clamp(centerY + obeliskOffsets[i][1], 4, h - 5);
      clearPatch(mapObj, ox, oy, 1);
      const ob = { id: 'obelisk_' + i, type: 'obelisk', index: i, x: ox, y: oy };
      obelisks.push(ob);
      objects.push(ob);
      markUsed(ox, oy, 1);
      carveLine(mapObj, ox, oy, centerX, centerY);
    }

    const ultX = H.clamp(centerX + 2, 5, w - 6);
    const ultY = H.clamp(centerY - 2, 5, h - 6);
    clearPatch(mapObj, ultX, ultY, 1, 'desert');
    markUsed(ultX, ultY, 1);
    mapObj.ultimateArtifact = {
      x: ultX,
      y: ultY,
      id: ULTIMATE_BY_FACTION[mainFaction] || 'ultimate_sword_dominion',
      dug: false
    };

    const landmarkList = [
      { type: 'gazebo', dx: -4, dy: 0 },
      { type: 'fort', dx: 4, dy: 0 },
      { type: 'canyon', dx: 0, dy: -4 },
      { type: 'xanadu', dx: 0, dy: 4 },
      { type: 'windmill', dx: -8, dy: -2 },
      { type: 'water_wheel', dx: 8, dy: 2 },
      { type: 'shrine', dx: -5, dy: 3, spell: 'lightning_bolt' },
      { type: 'shrine', dx: 5, dy: -3, spell: 'haste' },
      { type: 'fountain', dx: -3, dy: -5 },
      { type: 'temple', dx: 3, dy: 5 },
      { type: 'oasis', dx: -7, dy: 4 },
      { type: 'watering_hole', dx: 7, dy: -4 },
      { type: 'watchtower', dx: -9, dy: 0 },
      { type: 'observatory', dx: 9, dy: 0 },
      { type: 'graveyard', dx: -10, dy: -5 },
      { type: 'daemon_cave', dx: 10, dy: 5 },
      { type: 'dragon_utopia', dx: -2, dy: -2 },
      { type: 'sphinx', dx: 2, dy: 2, riddleIdx: 0 },
      { type: 'signpost', dx: -1, dy: 1, text: 'Все дороги ведут к центральной твердыне Энрота.' }
    ];

    for (let i = 0; i < landmarkList.length; i++) {
      const lm = landmarkList[i];
      const lx = H.clamp(centerX + lm.dx, 4, w - 5);
      const ly = H.clamp(centerY + lm.dy, 4, h - 5);
      if (!isFree(lx, ly)) continue;
      clearPatch(mapObj, lx, ly, 1);
      const rec = { id: 'lm_' + lm.type + '_' + i, type: lm.type, x: lx, y: ly };
      if (lm.spell) rec.spell = lm.spell;
      if (lm.riddleIdx !== undefined) rec.riddleIdx = lm.riddleIdx;
      if (lm.text) rec.text = lm.text;
      objects.push(rec);
      markUsed(lx, ly, 1);
      carveLine(mapObj, lx, ly, centerX, centerY);
    }

    const freeArts = H.ARTIFACT_LIST.filter(a => !a.ultimate && !a.cursed);
    for (let i = 0; i < 4; i++) {
      const ax = H.clamp(centerX + (i % 2 === 0 ? -11 : 11), 4, w - 5);
      const ay = H.clamp(centerY + (i < 2 ? -8 : 8), 4, h - 5);
      if (!isFree(ax, ay)) continue;
      clearPatch(mapObj, ax, ay, 1);
      const art = rng.pick(freeArts);
      objects.push({
        id: 'art_map_' + i,
        type: 'artifact',
        x: ax,
        y: ay,
        artifactId: art.id
      });
      markUsed(ax, ay, 1);
      carveLine(mapObj, ax, ay, centerX, centerY);
    }

    if (s.hasTeleporters) {
      const tp1 = { x: 10, y: halfH };
      const tp2 = { x: w - 11, y: halfH };
      clearPatch(mapObj, tp1.x, tp1.y, 1);
      clearPatch(mapObj, tp2.x, tp2.y, 1);
      objects.push({ id: 'tp_a', type: 'teleporter', channel: 1, x: tp1.x, y: tp1.y });
      objects.push({ id: 'tp_b', type: 'teleporter', channel: 1, x: tp2.x, y: tp2.y });
      carveLine(mapObj, tp1.x, tp1.y, centerX, centerY);
      carveLine(mapObj, tp2.x, tp2.y, centerX, centerY);
    }

    if (s.waterMode === 'islands' || s.waterMode === 'inland_sea') {
      for (let i = 0; i < towns.length; i++) {
        const t = towns[i];
        const bx = H.clamp(t.x + (t.x < halfW ? 2 : -2), 2, w - 3);
        const by = H.clamp(t.y + (t.y < halfH ? 2 : -2), 2, h - 3);
        if (isFree(bx, by)) {
          mapObj.tiles[H.tileIndex(mapObj, bx, by)] = 'water';
          mapObj.blocked[H.tileIndex(mapObj, bx, by)] = 0;
          boats.push({ id: 'boat_' + i, x: bx, y: by, occupied: false });
          markUsed(bx, by, 0);
        }
      }
    }

    return mapObj;
  }

  Object.assign(H, {
    TOWN_NAMES,
    ARCH_RIVALS,
    ULTIMATE_BY_FACTION,
    CAMPAIGN_SCENARIOS,
    CAMPAIGN_EPILOGUES,
    STANDALONE_MAPS,
    RATING_RANKS,
    rankForScore,
    carveLine,
    clearPatch,
    createTownRecord,
    generateMap
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = H;
})(globalThis.HoMM1 = globalThis.HoMM1 || {});
