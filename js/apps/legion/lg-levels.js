(function (L) {
  'use strict';

  const FACE_E = Math.PI / 2, FACE_W = -Math.PI / 2;

  L.mapSize = key => (/^medium/.test(key) ? 1536 : 1024);

  L.MAP_TERRAIN = {
    river2: { water: { level: 8, ford: 12 } },
    mediumriver1: { water: { level: 3, ford: 8 } },
    mediumcoastal1: { water: { level: 8, ford: 2 } },
    mediumcoastalnight: { water: { level: 8, ford: 2 } },
    bay: { water: { level: 8, ford: 1.5 } },
    beach: { water: { level: 9, ford: 1.5 } },
    canyon: { water: { level: -150, ford: 2 } },
    marshland: { marsh: { below: 10 } }
  };

  L.ERA_INFO = L.ORIGINAL_ERAS.map((e, i) => (i === 0 ? Object.assign({}, e, { intro: e.intro.slice(Math.max(0, e.intro.findIndex(t => /^Рим был основан/.test(t)))) }) : e));
  L.ERAS = L.ORIGINAL_ERAS.map(e => e.name + ', ' + e.years);

  const OLD_IDS = {
    defiant_farmers: 'peasants', aequi_raiders: 'aequi', subjugate_farmers: 'hernici', latin_revolt: 'latins', scout_the_etruscans: 'etruscan_scouts',
    sabine_ambush: 'sabines', volscian_chief: 'coriolanus', etruscans_at_caere: 'caere', gallic_scouts: 'gallic_scouts', men_in_black: 'men_in_black'
  };

  const FACTION_BY_ERA = ['latins', 'latins', 'gauls', 'samnites', 'samnites', 'samnites', 'gauls', 'carthage', 'carthage', 'macedon', 'cimbri', 'slaves', 'gauls', 'pompeians'];
  const FACTION_OF = {
    peasants: 'latins', sabines: 'sabines', etruscan_scouts: 'etruscans', aequi: 'aequi', hernici: 'hernici', coriolanus: 'volsci', caere: 'etruscans',
    men_in_black: 'latins', annoying_latins: 'latins', annexation_of_etruria: 'etruscans', etruscan_treachery: 'etruscans', etruscans: 'etruscans', gauls: 'gauls',
    heraclea: 'epirus', ausculum: 'epirus', malventum: 'epirus', magnesia: 'seleucids', ambush_at_cypsela: 'thracians', avignon: 'gauls', aginnum: 'helvetii',
    bibracte: 'helvetii', mulhouse: 'germans', sambre_river: 'belgae', tongres: 'belgae', nicopolis: 'pontus', zela: 'pontus', philippi: 'republicans'
  };

  const UNLOCKS = {
    peasants: ['velites', 'hastati'], sabines: ['westnobles'], aequi: ['auxilia'], caere: ['auxarchers'], crush_the_gauls: ['princeps'],
    annexation_of_etruria: ['auxcav'], the_final_battle: ['triarii'], malventum: ['elephant'], pydna: ['legionary'], end_of_the_dream: ['praetorian']
  };

  const TUNE = {
    peasants: { tutorial: true, ai: { signalAt: 9999, signalRange: 40, hunt: false, rally: false } },
    sabines: { sunset: true },
    coriolanus: { title: 'Кориолан', ai: { huntGeneral: true } },
    caere: { title: 'Этруски у Цере', terrain: { marsh: { below: 22 } } },
    men_in_black: { elite: { tag: 'black', squads: [0, 1, 2, 3, 4, 5], name: 'Воины в черном', color: 6, lvl: 2 }, objectives: [{ type: 'destroy', tag: 'black' }, { type: 'keepGeneral' }] },
    gallic_scouts: { escape: { edge: 'east', after: 260, threat: 70, walk: true }, escort: [0], ai: { huntGeneral: true } },
    messana: { lvl: -1 },
    ambush_at_cypsela: { lvl: -2, drop: [9, 13] },
    avignon: { lvl: -1, drop: [2, 10, 13] },
    aginnum: { lvl: -1, drop: [5, 10, 13, 16] },
    aquae_sextiate: { lvl: -2, drop: [9, 11] },
    bibracte: { losses: 300 },
    sambre_river: { lvl: -2, survive: 420, drop: [9, 11, 14, 17, 19] }
  };

  const MEDALS = {
    peasants: [700, 800], latin_expedition: [700, 950], sabines: [1500, 1650], etruscan_scouts: [1700, 1850], aequi: [1550, 1700],
    hernici: [2100, 2500], coriolanus: [2300, 3300], latins: [2150, 2450], caere: [2700, 3100], men_in_black: [3500, 3800],
    gallic_scouts: [2600, 2950], thirsty_gauls: [5900, 6850], crush_the_gauls: [3050, 3750], annoying_latins: [5500, 5900], campanian_allies: [5350, 5950],
    send_the_samnites_home: [3950, 4550], annexation_of_etruria: [3100, 3750], samnites_in_campania: [5550, 6450], claudine_forks: [8100, 8850], lautulae: [4500, 6100],
    etruscan_treachery: [7150, 7750], the_final_battle: [9500, 10750], etruscans: [9100, 10150], gauls: [8900, 10350], samnites: [3450, 4550],
    siege_of_arretium: [10550, 12750], vadimo_lake: [13450, 16150], occupation_of_gaul: [12450, 15500], heraclea: [11250, 12600], ausculum: [11200, 16350],
    malventum: [15850, 19750], messana: [7850, 9300], agrigentum: [9050, 10500], alalia: [11150, 13500], adys: [7400, 9300],
    bagradas: [11400, 17000], trebbia: [11050, 12750], cannae: [8700, 9650], dertosia: [12250, 13200], metaurus: [9700, 11150],
    zama: [13000, 15550], cynocephalae: [12700, 16150], magnesia: [15850, 21050], ambush_at_cypsela: [7700, 9750], pydna: [13800, 16450],
    avignon: [8900, 10150], the_giants_of_noreia: [9550, 10550], aginnum: [9500, 10300], arausio: [11250, 12700], aquae_sextiate: [7200, 8400],
    vercellae: [8650, 9900], mount_vesuvius: [6100, 6950], massacre_at_garganus: [4450, 5450], on_the_way_to_freedom: [11500, 13950], a_small_victory: [7500, 9900],
    end_of_the_dream: [9550, 10500], bibracte: [9900, 10950], mulhouse: [12550, 14450], sambre_river: [9700, 11050], tongres: [11750, 15400],
    siege_of_alesia: [14950, 17750], pharsalus: [9200, 10700], nicopolis: [13650, 17900], zela: [14550, 18050], ruspina: [11500, 12550],
    thapsus: [17400, 21400], munda: [15200, 18850], philippi: [18850, 24850]
  };

  const secondsOf = v => L.clamp(Math.round((120 + v * 2) / 10) * 10, 240, 720);
  const LOSS_SCALE = 3;

  const formOf = (key, form, doctrine) => {
    const type = L.UNITS[key].type;
    if (L.UNITS[key].leader) return 'balanced';
    if (form === 'column' || form === 'wedge') return 'attack';
    if (form === 'square') return 'defend';
    if (form === 'line' && (type === 'HeavyInf' || type === 'LightInf') && doctrine !== 'charge') return 'defend';
    return 'balanced';
  };

  const shortOf = objectives => {
    const o = objectives[0];
    switch (o.type) {
      case 'kill': return 'Убить ' + o.n + ' врагов.';
      case 'survive': return 'Продержаться ' + Math.round(o.sec / 60) + ' мин.';
      case 'killGeneral': return 'Вражеский полководец должен погибнуть.';
      case 'destroy': return 'Уничтожить отборную стражу.';
      default: return 'Обратить врага в бегство.';
    }
  };

  const objectivesOf = (s, t) => {
    if (t.objectives) return t.objectives;
    const out = [];
    if (s.flags & 1) out.push({ type: 'survive', sec: t.survive || secondsOf(s.time) });
    if (s.flags & 2) out.push({ type: 'kill', n: t.kill || s.kill });
    if (s.flags & 32) out.push({ type: 'killGeneral' });
    if (!out.length) out.push({ type: 'rout' });
    if (s.flags & 8) out.push({ type: 'losses', n: t.losses || Math.round(s.losses * LOSS_SCALE) });
    if (s.flags & 16) out.push({ type: 'keepGeneral' });
    if (s.flags & 64) out.push({ type: 'time', sec: t.time || secondsOf(s.time) });
    return out;
  };

  const buildLevel = (s, n) => {
    const id = OLD_IDS[s.id] || s.id;
    const t = TUNE[id] || {};
    const era = s.era - 1;
    const size = L.mapSize(s.map);
    const faction = FACTION_OF[id] || FACTION_BY_ERA[era];
    const color = L.FACTIONS[faction] ? L.FACTIONS[faction].color : 1;
    const stage = 1 + Math.floor((n - 1) / 7) + (t.lvl || 0);
    const drop = new Set(t.drop || []);
    const leaders = s.enemy.map((e, i) => (L.UNITS[e[0]].leader ? i : -1)).filter(i => i >= 0 && !drop.has(i));
    const enemy = [];
    s.enemy.forEach((e, i) => {
      if (drop.has(i)) return;
      const [key, x, z, doctrine, form, grade, , name] = e;
      const elite = t.elite && t.elite.squads.includes(i) ? t.elite : null;
      const leader = !!L.UNITS[key].leader;
      const spec = {
        key, x, z, face: FACE_W, doctrine, form: formOf(key, form, doctrine),
        level: L.clamp(stage + grade - 1 + (elite ? elite.lvl : 0) + (leader ? 1 : 0), 1, L.MAX_LEVEL),
        name: elite ? elite.name : name || L.UNITS[key].name
      };
      if (leader) spec.general = i === leaders[0];
      if (elite) Object.assign(spec, { elite: elite.tag, color: elite.color });
      if ((t.escort || []).includes(i)) spec.aiRole = 'escort';
      enemy.push(spec);
    });
    const objectives = objectivesOf(s, t);
    const lv = {
      id, n, src: s.src, era, ord: s.ord, title: t.title || s.title, map: s.map, faction, color,
      short: t.short || shortOf(objectives), briefing: s.briefing,
      cap: Math.min(16, t.cap || s.cap), reward: { glory: s.purse[0], denarii: s.purse[1] }, unlocks: UNLOCKS[id] || [],
      medals: t.medals || MEDALS[id] || null, par: t.par || null, objectives,
      playerZone: t.zone || (size > 1024 ? [360, 250, 660, 1250] : [250, 240, 430, 790]), playerFace: FACE_E,
      enemyZone: size > 1024 ? [900, 200, 1320, 1300] : [560, 200, 790, 800], enemyFace: FACE_W,
      enemy, ai: Object.assign({ signalAt: 50, huntGeneral: objectives.some(o => o.type === 'keepGeneral') }, t.ai || {})
    };
    if (t.tutorial) lv.tutorial = true;
    if (t.sunset) lv.sunset = objectives[0].sec || 420;
    if (s.map === 'mediumcoastalnight') lv.night = true;
    if (t.escape) lv.escape = t.escape;
    if (t.terrain) lv.terrain = t.terrain;
    return lv;
  };

  L.LEVELS = L.ORIGINAL_SCENARIOS.map((s, i) => buildLevel(s, i + 1));

  L.defaultMedals = lv => {
    let value = 0;
    for (const e of lv.enemy) {
      const def = L.UNITS[e.key];
      value += def.men * (def.cost / Math.max(1, def.men) * 2 + 4);
    }
    return [Math.round(value * 0.55 / 50) * 50, Math.round(value * 0.85 / 50) * 50];
  };
  for (const lv of L.LEVELS) if (!lv.medals) lv.medals = L.defaultMedals(lv);

  L.levelById = id => L.LEVELS.find(l => l.id === id);

  L.levelUnlocked = (p, lv) => lv.n === 1 || L.LEVELS.slice(0, lv.n - 1).every(o => p.progress[o.id] && p.progress[o.id].medal != null);

  L.buildEnemy = (lv, difficulty, seed) => {
    const diff = L.DIFFICULTY[difficulty == null ? 1 : difficulty];
    const rnd = L.rng(seed || L.hashString(lv.id));
    const specs = (lv.enemy || []).map((e, i) => L.makeEnemySpec(e, lv, diff, rnd, i));
    return specs;
  };

  L.makeEnemySpec = (e, lv, diff, rnd, i) => {
    const level = L.clamp((e.level || 1) + diff.enemyLevel, 1, L.MAX_LEVEL + 1);
    const sq = { id: null, key: e.key, name: e.name || L.UNITS[e.key].name, men: L.UNITS[e.key].men, level: 1, xp: 0, skills: {}, equip: {}, color: e.color != null ? e.color : lv.color };
    L.Army.autoSkills(sq, level, rnd);
    return Object.assign(sq, { x: e.x, z: e.z, face: e.face, form: e.form || 'balanced', doctrine: e.doctrine || 'advance', elite: e.elite || null, aiRole: e.aiRole || null, general: e.general == null ? null : !!e.general, uid: i });
  };

  L.QUICK_MAPS = ['plains1', 'plains2', 'farmland', 'snowy1', 'snowy2', 'river2', 'mediumplains1', 'mediumfarmlands', 'mediumarid1', 'mediumriver1', 'mediumcoastal1', 'mediumsnowy1'];
  L.QUICK_FACTIONS = {
    latins: { name: 'Латины', pool: ['tunicmilitia', 'shieldjav', 'westarchers', 'levyspear', 'westlc', 'westnobles', 'celtveterans'], general: 'legate', color: 1 },
    gauls: { name: 'Галлы', pool: ['celticwarriors', 'javelinmen', 'westarchers', 'fanatic', 'celtveterans', 'westlc', 'celtnobles'], general: 'gallicgeneral', color: 2 },
    etruscans: { name: 'Этруски', pool: ['levyspear', 'shieldjav', 'westarchers', 'javelinmen', 'westnobles', 'celtnobles', 'tunicmilitia'], general: 'legate', color: 4 },
    rome: { name: 'Мятежный легион', pool: ['hastati', 'princeps', 'triarii', 'velites', 'legionary', 'auxcav', 'westlc', 'auxarchers'], general: 'legate', color: 6 }
  };

  L.quickEnemy = (faction, budget, size, seed, level) => {
    const f = L.QUICK_FACTIONS[faction];
    const rnd = L.rng(seed);
    const list = [{ key: f.general }];
    let money = budget;
    let guard = 0;
    while (money > 60 && guard++ < 60 && list.length < 16) {
      const affordable = f.pool.filter(k => L.UNITS[k].cost <= money);
      if (!affordable.length) break;
      const k = rnd.pick(affordable);
      money -= L.UNITS[k].cost;
      list.push({ key: k });
    }
    const cx = size / 2;
    const face = 0;
    const lines = { front: [], main: [], back: [], wing: [] };
    for (const e of list.slice(1)) {
      const t = L.UNITS[e.key].type;
      if (t === 'Skirmisher') lines.front.push(e);
      else if (t === 'HeavyInf' || t === 'LightInf') lines.main.push(e);
      else if (t === 'Archer') lines.back.push(e);
      else lines.wing.push(e);
    }
    const zBase = size * 0.36;
    const out = [];
    const put = (arr, z, gap, doctrine) => {
      const w = arr.length * gap;
      arr.forEach((e, i) => out.push({ key: e.key, x: cx - w / 2 + gap * (i + 0.5), z, face, doctrine }));
    };
    put(lines.front, zBase + 40, 55, 'advance');
    put(lines.main, zBase, 48, rnd.chance(0.5) ? 'hold' : 'advance');
    put(lines.back, zBase - 40, 60, 'hold');
    lines.wing.forEach((e, i) => out.push({ key: e.key, x: cx + (i % 2 ? 1 : -1) * (lines.main.length * 24 + 50 + Math.floor(i / 2) * 40), z: zBase, face, doctrine: rnd.pick(['outflank', 'envelop', 'advance']) }));
    out.push({ key: f.general, x: cx, z: zBase - 80, face, doctrine: 'longhold', general: true });
    const lvl = { id: 'quick', color: f.color };
    return out.map((e, i) => L.makeEnemySpec(Object.assign({ level }, e), lvl, L.DIFFICULTY[1], rnd, i));
  };

})(globalThis.Legion = globalThis.Legion || {});
