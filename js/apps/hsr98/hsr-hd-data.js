(function (H) {
  'use strict';

  const TUN = {
    hz: 30, maxSteps: 3,
    startGold: 400, firstBreak: 40, earlyGold: 3, cleanBonus: 0.1, baseRegen: 0.01, plazaFull: 5, plazaWave: 0.02,
    hpPerStr: 20, regenBase: 0.25, regenPerStr: 0.05, armorPerAgi: 0.15, enBase: 50, enPerInt: 10, enRegenBase: 0.5, enRegenPerInt: 0.04,
    critC: 0.05, critD: 0.5, batMelee: 1.6, batRanged: 1.8, armorK: 20, mainStart: 22, mainGrow: 2.8,
    melee: 56, foeMelee: 44, shootFrom: 100, enHit: 3, enLossPct: 2, enKill: 5,
    weakMul: 1.2, resistMul: 0.8, toughNoWeak: 0.5, toughTech: 15,
    stunNormal: 1.5, stunElite: 2.5, stunBoss: 2, brokenVuln: 0.2, toughBack: 6, freezeExtra: 1, entangleSlow: 0.4, imprisonSlow: 0.3, breakDot: 0.3, breakDotT: 6,
    kQ: 1.6, kE: 1.2, kR: 2.5, kT: 1, hpDmgK: 0.06, defDmgK: 7, atkHealK: 4,
    abilLvl: [0.6, 0.7, 0.8, 0.9, 1], ultLvl: [0.7, 0.85, 1], ultAt: [6, 12, 18], turn: 3,
    voiceChance: 0.3, voiceGap: 8,
    foeHpK: 40, foeStrBase: 3, foeStrGrow: 1.1, foeAgiDiv: 4, foeAgiGrow: 0.4, foeIntBase: 4, foeIntGrow: 0.8,
    foeDmgK: 6, foeDmgGrow: 0.1, foeSpdBase: 60, foeSpdK: 1.6, foeBat: 1.8, foeHp: 1.42, foeDmg: 1, bossHp: 1.1, bossDmg: 0.4, eliteHp: 1, lateHp: 0.6, lateDmg: 0.58, lateFrom: 11,
    foeSkillCd: [6, 10], aggroR: 200, leash: 320, retarget: 1, aggroTurret: 80, aggroBase: 60, bossBaseMul: 2, bossGap: [4, 6],
    resFoe: 0.1, resBoss: 0.3,
    expNormal: [7, 2], expElite: [40, 8], expBoss: 600, expWave: [50, 8], expR: 600, expNext: [80, 46], raidExp: 0.1,
    goldNormal: [10, 2.5], goldElite: [50, 10], goldBoss: 500, goldShare: 0.5, goldSec: 1, goldWave: [80, 25], raidGold: 0.25, raidR: 480, pigGold: [150, 15],
    respawn: [4, 1.5], buyback: [50, 25], recallT: 4, recallCd: 45, reviveHp: 0.3,
    tRange: 230, tBat: 1.2, tDmg: [20, 4], tHp: [900, 60], tRestore: [200, 25], baseArmor: [6, 0.3],
    projSpd: 520, chaseLimit: 400, heroPathLimit: 2400, shopR: 400, sell: 0.6,
    spawnGroup: [2, 4], spawnGap: [2, 3], riftGlow: 2, pigSpd: 195, pigFlee: 3, bigPigHp: 20, bigPigLife: 25, bigPigStep: 20, bigPigKill: 400,
    holdChase: 120, alarmT: 1.5, aimFresh: 3, resumeAtk: 0.1, maxNums: 40, maxParticles: 300
  };

  const ARMOR0 = { none: 0, light: 1, medium: 2, heavy: 4, divine: 6 };
  const ATK_ARMOR = {
    weapon: { none: 1, light: 1.25, medium: 1, heavy: 0.7, divine: 0.5 },
    magic: { none: 1, light: 0.75, medium: 1, heavy: 1.25, divine: 0.5 },
    divine: { none: 1, light: 1, medium: 1, heavy: 1, divine: 1 }
  };
  const ATK_NAME = { weapon: 'оружие', magic: 'магия', divine: 'божественная' };
  const ARMOR_NAME = { none: 'без брони', light: 'лёгкая', medium: 'средняя', heavy: 'тяжёлая', divine: 'божественная' };
  const ATTR_NAME = { str: 'СИЛ', agi: 'ЛОВ', int: 'ИНТ' };
  const ATTR_COL = { str: '#ff8a6a', agi: '#86e39a', int: '#80c8ff' };

  const PATHS = ['destruction', 'hunt', 'erudition', 'harmony', 'nihility', 'preservation', 'abundance'];

  const DIFFS = {
    easy: { name: 'Тренировка', lvl: 0, hp: 0.9, dmg: 0.9, base: 3500, breakT: 42, respawn: 0.6, gold: 1.2 },
    normal: { name: 'Обычная', lvl: 0, hp: 1, dmg: 1, base: 3000, breakT: 30, respawn: 1, gold: 1 },
    hard: { name: 'Тяжёлая', lvl: 0, hp: 1.12, dmg: 1.08, base: 3000, breakT: 30, respawn: 1.25, gold: 0.9 }
  };

  const HEROES = {
    trail: { amp: .83, ampHard: .96, main: 'str', melee: true, range: 56, atk: 'weapon', armor: 'medium', role: 'Бьёт широкими дугами в гуще волны', order: ['q', 'e', 't', 'q', 'q', 'r'] },
    himeko: { amp: .96, ampHard: .85, main: 'int', melee: false, range: 210, atk: 'magic', armor: 'light', role: 'Огненные области по толпе', order: ['q', 't', 'e', 'q', 'q', 'r'] },
    seele: { amp: .97, ampHard: .93, main: 'agi', melee: true, range: 56, atk: 'weapon', armor: 'light', role: 'Рывками идёт от добивания к добиванию', order: ['q', 't', 'e', 'q', 'q', 'r'] },
    blade: { amp: .97, ampHard: .92, main: 'str', melee: true, range: 56, atk: 'weapon', armor: 'medium', role: 'Тратит своё НР ради ударов от макс. НР', order: ['q', 't', 'e', 'q', 't', 'r'] },
    clara: { amp: .31, ampHard: 1.03, main: 'str', melee: true, range: 56, atk: 'weapon', armor: 'heavy', role: 'Стоит под ударами, Сварог отвечает каждому', order: ['t', 'q', 'e', 't', 'q', 'r'] },
    danheng: { amp: 1, ampHard: 1.07, main: 'agi', melee: true, range: 88, atk: 'weapon', armor: 'light', role: 'Держит линию копьём и замедляет', order: ['q', 't', 'e', 'q', 'q', 'r'] },
    topaz: { amp: .45, ampHard: 1.16, main: 'agi', melee: false, range: 210, atk: 'weapon', armor: 'light', role: 'Стрелок, Счетовод бьёт должника', order: ['t', 'q', 'e', 't', 'q', 'r'] },
    herta: { amp: .97, ampHard: .99, main: 'int', melee: false, range: 210, atk: 'magic', armor: 'light', role: 'Кукла добивает полуживых по всей линии', order: ['q', 't', 'e', 'q', 't', 'r'] },
    jingyuan: { amp: 1.13, ampHard: .78, main: 'int', melee: true, range: 56, atk: 'weapon', armor: 'medium', role: 'Генерал с Повелителем молний', order: ['t', 'q', 'e', 't', 'q', 'r'] },
    bronya: { amp: 1.18, ampHard: 1.02, main: 'agi', melee: false, range: 210, atk: 'weapon', armor: 'medium', role: 'Приказ себе или турели, знамя на линии', order: ['q', 't', 'e', 'q', 't', 'r'] },
    asta: { amp: 1.25, ampHard: 1.01, main: 'int', melee: false, range: 210, atk: 'magic', armor: 'light', role: 'Рикошеты по толпе и скорость себе и турелям', order: ['q', 't', 'e', 'q', 't', 'r'] },
    ruanmei: { amp: 2.05, ampHard: .95, main: 'int', melee: false, range: 210, atk: 'magic', armor: 'light', role: 'Пробивает стойкость и замедляет', order: ['t', 'e', 'q', 't', 'e', 'r'] },
    kafka: { amp: 1.14, ampHard: .99, main: 'int', melee: false, range: 210, atk: 'weapon', armor: 'light', role: 'Шок и детонация периодического урона', order: ['t', 'e', 'q', 't', 'e', 'r'] },
    silverwolf: { amp: 1.32, ampHard: .98, main: 'agi', melee: false, range: 210, atk: 'weapon', armor: 'light', role: 'Баги, уязвимость и снятие брони', order: ['q', 't', 'e', 'q', 't', 'r'] },
    welt: { amp: 1.4, ampHard: 1.02, main: 'int', melee: false, range: 210, atk: 'magic', armor: 'medium', role: 'Гравитация: замедляет и стягивает врагов', order: ['q', 't', 'e', 'q', 't', 'r'] },
    march: { amp: 1.03, ampHard: .99, main: 'agi', melee: false, range: 210, atk: 'weapon', armor: 'medium', role: 'Щиты на себя, турели и базу', order: ['q', 't', 'e', 'q', 't', 'r'] },
    gepard: { amp: 2.1, ampHard: .97, main: 'str', melee: true, range: 56, atk: 'weapon', armor: 'heavy', role: 'Стена: щиты всем рядом и заморозка', order: ['q', 'e', 't', 'q', 'e', 'r'] },
    fuxuan: { amp: .85, ampHard: .97, main: 'str', melee: false, range: 210, atk: 'magic', armor: 'heavy', role: 'Матрица забирает урон с базы и турелей', order: ['q', 't', 'q', 't', 'e', 'r'] },
    natasha: { amp: 1.01, ampHard: .97, main: 'int', melee: false, range: 210, atk: 'weapon', armor: 'light', role: 'Лечит себя и базу, ослабляет облаком', order: ['q', 'e', 't', 'q', 'e', 'r'] },
    bailu: { amp: 2.38, ampHard: .8, main: 'int', melee: false, range: 120, atk: 'magic', armor: 'light', role: 'Отскоки лечения и защита от гибели', order: ['q', 't', 'e', 'q', 't', 'r'] },
    luocha: { amp: .54, ampHard: 1.05, main: 'int', melee: true, range: 56, atk: 'magic', armor: 'medium', role: 'Целитель в гуще, в его Зоне атаки лечат', order: ['q', 't', 'e', 'q', 't', 'r'] }
  };

  const FOES = {
    antibaryon: { main: 'agi', range: 0, atk: 'magic', armor: 'none', pack: 4 },
    baryon: { main: 'agi', range: 0, atk: 'magic', armor: 'none' },
    reaver: { main: 'str', range: 0, atk: 'weapon', armor: 'medium', nth: 4, nthSkill: 1 },
    eliminator: { main: 'agi', range: 190, atk: 'weapon', armor: 'light', skill: { i: 1, r: 64 } },
    distorter: { main: 'agi', range: 210, atk: 'magic', armor: 'light', lock: { i: 0, next: 1, t: 1.5 } },
    weaver: { main: 'int', range: 180, atk: 'magic', armor: 'none', skill: { i: 1, r: 64 } },
    trampler: { main: 'str', range: 0, atk: 'weapon', armor: 'heavy', stomp: { i: 0, r: 120, stun: 1, warn: 1 }, skill: { i: 1 } },
    soldier: { main: 'str', range: 72, atk: 'weapon', armor: 'medium', shield: { i: 1, v: 0.15, cd: 12 } },
    gunner: { main: 'agi', range: 200, atk: 'weapon', armor: 'light', skill: { i: 1, r: 48 } },
    hound: { main: 'agi', range: 0, atk: 'weapon', armor: 'light', nth: 3, nthSkill: 1 },
    beetle: { main: 'str', range: 0, atk: 'weapon', armor: 'heavy', shield: { i: 1, v: 0.2, cd: 10 } },
    spider: { main: 'agi', range: 0, atk: 'magic', armor: 'none', bomb: { i: 0, r: 72, warn: 1 } },
    vagrant: { main: 'str', range: 0, atk: 'weapon', armor: 'medium', skill: { i: 1, fx: { freeze: [0.2, 1] } } },
    shadewalker: { main: 'int', range: 170, atk: 'magic', armor: 'medium', zone: { i: 1, r: 120, warn: 1, fx: { freeze: [0.15, 1] } } },
    incinerator: { main: 'int', range: 170, atk: 'magic', armor: 'medium', skill: { i: 0, fx: { burn: [1, 6, 0.3] } } },
    frostspawn: { main: 'int', range: 0, atk: 'magic', armor: 'none', atkFx: { freeze: [0.15, 1] } },
    flamespawn: { main: 'int', range: 0, atk: 'magic', armor: 'none', atkFx: { burn: [0.4, 6, 0.3] } },
    svarog_hand: { main: 'str', range: 0, atk: 'weapon', armor: 'heavy', skill: { i: 1, fx: { root: [1, 1] } } },
    iceedge: { main: 'agi', range: 0, atk: 'weapon', armor: 'light' },
    cannoneer: { main: 'int', range: 260, atk: 'weapon', armor: 'heavy', near: { i: 2, r: 80 }, lock: { i: 0, next: 1, t: 1.5, at: 'point', r: 96 } },
    lieutenant: { main: 'str', range: 0, atk: 'weapon', armor: 'heavy', rally: { i: 0, r: 200, cd: 12, t: 6 }, stomp: { i: 2, r: 100, warn: 1 } },
    direwolf: { main: 'agi', range: 0, atk: 'weapon', armor: 'heavy', lock: { i: 2, next: 3, t: 1.5, dash: 160 }, stomp: { i: 1, r: 160, warn: 0.6, fx: { slow: [0.1, 4] } } },
    prowler: { main: 'str', range: 0, atk: 'magic', armor: 'heavy', atkFx: { freeze: [0.3, 1] }, stomp: { i: 1, r: 140, warn: 1 } },
    iceout: { main: 'int', range: 200, atk: 'magic', armor: 'medium', zone: { i: 1, r: 140, warn: 1.5, fx: { freeze: [0.4, 1] } } },
    doomsday: { main: 'str', range: 0, atk: 'divine', armor: 'divine', size: 96, bigHpK: 1.8 },
    bronya_b: { main: 'agi', range: 260, atk: 'divine', armor: 'divine', size: 96, hpK: 1.4, dmgK: 1.08 },
    gepard_b: { main: 'str', range: 0, atk: 'divine', armor: 'divine', size: 96, hpK: 0.85, dmgK: 1.04 },
    grizzly: { main: 'str', range: 0, atk: 'divine', armor: 'divine', size: 96, hpK: 0.85, dmgK: 0.7 },
    svarog_b: { main: 'str', range: 280, atk: 'divine', armor: 'divine', size: 96, hpK: 0.79, dmgK: 0.7 },
    cocolia_echo: { main: 'int', range: 240, atk: 'divine', armor: 'divine', size: 96, hpK: 1.6, dmgK: 0.82 },
    cocolia1: { main: 'int', range: 240, atk: 'divine', armor: 'divine', size: 96, hpK: 1.3, dmgK: 0.7 },
    cocolia2: { main: 'int', range: 240, atk: 'divine', armor: 'divine', size: 96, hpK: 0.79, dmgK: 0.7 },
    trotter: { main: 'agi', range: 0, atk: 'weapon', armor: 'light', pig: true },
    trotter_big: { main: 'agi', range: 0, atk: 'weapon', armor: 'light', pig: true }
  };

  const THREATS = {
    legion: {
      hpK: 1, dmgK: 1, name: 'Легион Антиматерии', normals: ['antibaryon', 'baryon', 'reaver', 'eliminator', 'distorter', 'weaver'], ranged: ['eliminator', 'distorter', 'weaver'],
      elites: ['trampler'], small: 'doomsday', big: 'doomsday', music: 'doomsday'
    },
    silvermane: {
      hpK: 1, dmgK: 1, name: 'Среброгривые стражи', normals: ['soldier', 'gunner'], ranged: ['gunner'],
      elites: ['cannoneer', 'lieutenant'], small: 'bronya_b', big: 'gepard_b', music: 'gepard'
    },
    automaton: {
      hpK: 1.2, dmgK: 1.15, name: 'Автоматоны', normals: ['hound', 'beetle', 'spider'], ranged: [],
      elites: ['direwolf'], small: 'grizzly', big: 'svarog_b', music: 'svarog'
    },
    winter: {
      hpK: 0.8, dmgK: 0.85, name: 'Вечная зима', normals: ['vagrant', 'shadewalker', 'incinerator', 'frostspawn', 'flamespawn'], ranged: ['shadewalker', 'incinerator'],
      elites: ['prowler', 'iceout'], small: 'cocolia_echo', big: 'cocolia1', music: 'cocolia'
    }
  };

  const FOE_THREAT = {};
  for (const [k, T] of Object.entries(THREATS)) for (const id of T.normals.concat(T.elites, [T.small, T.big])) FOE_THREAT[id] = k;
  Object.assign(FOE_THREAT, { cocolia2: 'winter', svarog_hand: 'automaton', iceedge: 'winter' });

  const ALL = ['n', 'w', 'e'];
  const WAVES = [
    { a: 6, rifts: ['n'], dur: 16 },
    { a: 8, rifts: ['n', 'w'], dur: 19 },
    { a: 10, pig: true, rifts: ['w', 'e'], dur: 22 },
    { a: 12, ea: 1, rifts: ALL, dur: 24 },
    { a: 8, ea: 3, rifts: ALL, dur: 24 },
    { a: 14, ranged: 0.6, rifts: ALL, dur: 27 },
    { a: 14, ea: 2, rifts: ALL, dur: 27 },
    { a: 16, pig: true, rifts: ALL, dur: 30 },
    { a: 16, ea: 3, rifts: ALL, dur: 30 },
    { a: 8, boss: 'small', rifts: ['n'], dur: 14 },
    { b: 10, rifts: ['n', 'e'], dur: 22 },
    { b: 12, eb: 1, rifts: ALL, dur: 24 },
    { b: 14, eb: 2, pig: true, rifts: ALL, dur: 27 },
    { a: 10, b: 10, ea: 1, rifts: ALL, dur: 30 },
    { b: 12, eb: 3, bigPig: true, rifts: ALL, dur: 30 },
    { b: 18, eb: 3, rifts: ALL, dur: 32 },
    { a: 12, b: 12, ea: 2, eb: 2, rifts: ALL, dur: 32 },
    { b: 20, eb: 4, pig: true, rifts: ALL, dur: 35 },
    { a: 16, b: 16, ea: 3, eb: 3, rifts: ALL, dur: 38 },
    { b: 10, boss: 'big', reinf: { every: 20, a: 2, b: 2 }, rifts: ['n'], dur: 14 }
  ];

  const SUPPLIES = {
    medkit: { price: 60, stack: 5, use: { hot: 0.35, t: 5 }, text: 'Лечит 35% НР за 5 с' },
    thermos: { price: 80, stack: 5, use: { energy: 0.25 }, text: '+25% энергии' },
    coffee: { price: 50, stack: 5, use: { mspd: 0.3, t: 10 }, text: 'Скорость передвижения +30% на 10 с' },
    soup: { price: 150, stack: 5, use: { base: 0.05, towers: 0.15 }, counter: true, text: 'У прилавка: база +5% НР, турели +15% НР' },
    spark: { price: 250, stack: 5, use: { energy: 0.6 }, text: '+60% энергии' },
    revive: { price: 700, stack: 1, passive: true, text: 'При гибели поднимает героя с 30% НР' }
  };

  const DEVICES = {
    grenade: { name: 'Граната Среброгривых', price: 350, charges: 3, aim: 'point', range: 220, text: '3 заряда на волну. Бросок до 220: 120% урона атаки по кругу 72, оглушение 1 с' },
    anchor: { name: 'Портативный якорь', price: 600, cd: 60, chan: 1.5, text: 'Перенос к своей турели или на площадь, канал 1,5 с, перезарядка 60 с' },
    garrison: { name: 'Щит Гарнизона', price: 700, cd: 45, text: 'Щит 25% макс. НР на 5 с, перезарядка 45 с' },
    rz_key: { price: 900, cd: 40, aim: 'target', range: 260, text: 'Взлом врага: снимает усиления и даёт −30% брони на 6 с, перезарядка 40 с' },
    probe: { price: 450, cd: 50, chan: 2, text: 'Канал 2 с у турели или базы: лечит её на 15% НР, перезарядка 50 с' },
    findie: { price: 500, passive: true, text: 'Золото за добивания +20%, свинка-копилка видна на мини-карте' },
    gold_watch: { price: 1200, passive: true, fullSell: true, text: '+60 золота в начале каждого перерыва; продаются за полную цену' }
  };

  const RELIC = {
    price: 400, up: [150, 250, 400, 600, 850], main: [3, 1],
    slot: { head: { k: 'hp', v: [60, 18] }, hands: { k: 'atkFlat', v: [6, 2] }, feet: { k: 'mspdPx', v: [8, 2] }, sphere: { k: 'elemDmg', v: [0.06, 0.02] }, rope: { k: 'enRegenP', v: [0.05, 0.015] } },
    body: { passerby: ['healP', 0.06], musketeer: ['atk', 0.06], knight: ['armor', 2], thief: ['breakEff', 0.08], firesmith: ['dmgE_fire', 0.06], glacial: ['dmgE_ice', 0.06], thunder: ['dmgE_elec', 0.06], eagle: ['dmgE_wind', 0.06], genius: ['dmgE_quant', 0.06], wastelander: ['dmgE_imag', 0.06], champion: ['dmgE_phys', 0.06] },
    two: { passerby: [['healP', 0.1]], musketeer: [['atk', 0.12]], knight: [['armorP', 0.15]], thief: [['breakEff', 0.16]], firesmith: [['dmgE_fire', 0.1]], glacial: [['dmgE_ice', 0.1]], thunder: [['dmgE_elec', 0.1]], eagle: [['dmgE_wind', 0.1]], genius: [['dmgE_quant', 0.1]], wastelander: [['dmgE_imag', 0.1]], champion: [['dmgE_phys', 0.1]], station: [['atk', 0.12]], vonwacq: [['enRegenP', 0.05]], salsotto: [['crit', 0.08]] },
    text2: {
      passerby: 'Исходящее лечение +10%', musketeer: 'Урон атаки +12%', knight: 'Броня +15%', thief: 'Эффект пробития +16%', firesmith: 'Огненный урон +10%', glacial: 'Ледяной урон +10%', thunder: 'Электрический урон +10%',
      eagle: 'Ветряной урон +10%', genius: 'Квантовый урон +10%', wastelander: 'Мнимый урон +10%', champion: 'Физический урон +10%',
      station: 'Урон атаки +12%; при прибавке к скорости атаки от 40% ещё +12%', vonwacq: 'Восстановление энергии +5%; при прибавке к скорости атаки от 40% в начале волны перезарядки короче на 40%', salsotto: 'Шанс крита +8%; при шансе крита от 50% урон Абсолютной техники и бонус-атак +15%'
    },
    text4: {
      passerby: 'В начале волны и после возрождения +100 энергии', musketeer: 'Скорость атаки +6%, урон Атаки +10%', knight: 'Щиты героя крепче на 20%', thief: 'Ещё +16% эффекта пробития, каждое пробитие даёт 3 энергии',
      firesmith: 'Урон Навыка +12%; после Абсолютной техники следующий огненный удар +12%', glacial: 'После Абсолютной техники крит. урон +25% на 6 с', thunder: 'После Навыка урон атаки +20% на 3 с',
      eagle: 'После Абсолютной техники перезарядки Навыка и Техники уменьшаются на четверть оставшегося', genius: 'Игнорирует 10% брони, ещё 10% у врагов со слабостью к квантовому',
      wastelander: 'Шанс крита +10% по ослабленным, крит. урон +20% по заточённым', champion: 'Удар или полученный удар: урон атаки +5% на 6 с, до 5 раз'
    },
    stat: { healP: 'Исходящее лечение', atk: 'Урон атаки', armor: 'Броня', breakEff: 'Эффект пробития', 'dmgE_fire': 'Огненный урон', 'dmgE_ice': 'Ледяной урон', 'dmgE_elec': 'Электрический урон', 'dmgE_wind': 'Ветряной урон', 'dmgE_quant': 'Квантовый урон', 'dmgE_imag': 'Мнимый урон', 'dmgE_phys': 'Физический урон', hp: 'НР', atkFlat: 'Урон атаки', mspdPx: 'Скорость передвижения', elemDmg: 'Урон стихии героя', enRegenP: 'Восстановление энергии' }
  };
  const CONE_PRICE = { 3: 500, 4: 1300, 5: 3000 };
  const CONE_LATER = ['weaver', 'lullaby', 'manastaff', 'adamantite', 'truth', 'thread', 'affection', 'cccletter', 'cccmagic'];

  const ROWS = [
    '############################################################',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~,.r..,~~~~~~~~~~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~,....,~~~~~~~~~~~~~~~~~~~~~~~~~~#',
    '#...,,,,,,,~~~~~~~~~~~~~~~~,,,,,,~~~~~~~~~~~~~~~~,,,,,,,...#',
    '#...,B,,,,,~~~~~~~~~~~~~~~~,,,,,,~~~~~~~~~~~~~~~~,,,,,B,...#',
    '#.r.,,,,,,,~~~~~~~~~~~~~~~~,,,,,,~~~~~~~~~~~~~~~~,,,,,,,.r.#',
    '#...,,,,,,,~~~~~~~~~~~~~~~~,B,,,,~~~~~~~~~~~~~~~~,,,,,,,...#',
    '#...,,,,,,,~~~~~~~~~~~~~~~~,,,,,,~~~~~~~~~~~~~~~~,,,,,,,...#',
    '#~~~,,,,,,~~~~~~~~~~~~~~~~~,,,,,,~~~~~~~~~~~~~~~~~,,,,,,~~~#',
    '#~~~,,,,,,~~~~~~~~~~~~~~~~~,,,,B,~~~~~~~~~~~~~~~~~,,,,,,~~~#',
    '#~~~,,,,,,~~~~~~~~~~~~~~~~~,,,,,,~~~~~~~~~~~~~~~~~,,,,,,~~~#',
    '#~~~,,,,,,~~~~~~~~~~~~~~~~~,,,,,,~~~~~~~~~~~~~~~~~,,,L,,~~~#',
    '#~~~,,L,,,~~~~~~~~~~~~~~~~~,,,,,,~~~~~~~~~~~~~~~~~,,,,,,~~~#',
    '#~~~,,,,,,~~~~~~~~~~~~~~~~~S,,,,S~~~~~~~~~~~~~~~~~,,,,,,~~~#',
    '#~~~,,,,,,~~~~~~~~~~~~~~~~~,,,,,,~~~~~~~~~~~~~~~~~||||||~~~#',
    '#~~~,,,,,,~~~~~~~~~~~~~~~~~,,,,,,~~~~~~~~~~~~~~~~~||||||~~~#',
    '#~~~,,,,,,~~~~~~~~~~~~~~~~~,,,,,,~~~~~~~~~~~~~~~~~||||||~~~#',
    '#~~~,,,,,,~~~~~~~~~~~~~~~~~,,L,,,~~~~~~~~~~~~~~~~~||||||~~~#',
    '#~~~,,,,B,~~~~~~~~~~~~~~~~~,,,,,,~~~~~~~~~~~~~~~~~,,,,,,~~~#',
    '#~~~,,,,,,~~~~~~~~~~~~~~~~~,,,,,,~~~~~~~~~~~~~~~~~,,,,,,~~~#',
    '#~~~,,,,,,~~~~~~~~:::::::::::t::::::::::::~~~~~~~~,B,,,,~~~#',
    '#~~~,,,,,,~~~~~~~~::::::::::::::::::::::::~~~~~~~~,,,,,,~~~#',
    '#~~~,,,,,,~~~~~~~~::::::::::::::::::::::::~~~~~~~~,,,,,,~~~#',
    '#~~~,,,,,,,,,,,,,,::::::::::::::::::::::::,,,,,,,,,,,,,,~~~#',
    '#~~~,,,,,,,,B,,,,,t:::L::::::::::::::L:::t,,,,,,,,,,,,,,~~~#',
    '#~~~,,,,,,,,,,,,,,::::::::::::::::::::::::,,,,,B,,,,,,,,~~~#',
    '#~~~,,,,,,,,,,,,,,::::::::::::::::::::::::,,,,,,,,,,,,,,~~~#',
    '#~~~~~~~~~~~~~~~~~::::::::::::::::::::::::~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~:::::S::::::::::::S:::::~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~:::::::::::v:::::::pp:::~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~::::::::::::::::::::::::~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~::::xxxxxxxxxxxxxx==::::~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~::::xxxxxxxxxxxxxx==::::~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~~~~~xxxxxxxxxxxxxx==~~~~~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~########################~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~########################~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#',
    '############################################################'
  ];
  const SWAP = { r: '.', t: 'X', x: 'X', p: 'C', v: ':' };
  const DECOR_OF = { B: 'crate', S: 'terminal', L: 'lamp' };

  let mapCache = null;
  function perron() {
    if (mapCache) return mapCache;
    const w = ROWS[0].length, h = ROWS.length, tiles = [], decor = [], rifts = [], turrets = [];
    let spawn = null, shop = null;
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        const ch = ROWS[y][x];
        if (ch === 'r') rifts.push([x, y]);
        if (ch === 't') turrets.push([x, y]);
        if (ch === 'v') spawn = [x, y];
        if (ch === 'p' && !shop) shop = [x, y];
        if (DECOR_OF[ch]) decor.push([DECOR_OF[ch], x, y]);
        row.push(SWAP[ch] || ch);
      }
      tiles.push(row);
    }
    decor.push(['express', 22, 31], ['table', shop[0], shop[1]]);
    const byX = rifts.slice().sort((a, b) => a[0] - b[0]);
    const def = { name: 'Перрон', theme: 'station', zone: 'supply', floor: '.', decor };
    mapCache = {
      id: 'hd_perron', def, w, h, tiles,
      rifts: { w: byX[0], n: byX[1], e: byX[2] },
      turrets: [turrets.find(t => t[1] === 20), turrets.find(t => t[0] < 29 && t[1] === 24), turrets.find(t => t[0] > 29 && t[1] === 24)],
      base: { x0: 22, y0: 31, x1: 36, y1: 34 }, spawn, shop: [shop[0] + 1, shop[1]],
      plaza: { x0: 18, y0: 20, x1: 42, y1: 33 }
    };
    return mapCache;
  }

  const RIFT_NAME = { n: 'Северный', w: 'Западный', e: 'Восточный' };

  const CWM = H.CW && H.CW.META;
  const ASC = {};
  for (let l = 1; l <= 30; l++) if (CWM && CWM.asc[l]) ASC[l] = CWM.asc[l];
  ASC[30] = { plate: 'Держит рубеж' };
  const META = {
    ascPer: 800, ascMax: 30, ascWin: { easy: 600, normal: 1200, hard: 2000 }, ascLoss: 0.5, asc: ASC,
    weekWave: 900, weekWin: 18000, weekMax: 18000, weekMs: 2 * 3600000, week: CWM ? CWM.week : [],
    trial: { jade: 20, asc: 200 }, fastBoss: 60, raidGold: 3000, hist: 20, recShow: 8
  };
  const TRIALS = Object.keys(HEROES).map(id => ({ id: 'hero_' + id, hero: id, kind: 'hero', name: 'Победа: ' + H.CHARS[id].name })).concat(
    Object.keys(DIFFS).map(d => ({ id: 'diff_' + d, diff: d, kind: 'diff', name: 'Победа: ' + DIFFS[d].name })),
    [
      { id: 'towers', kind: 'run', name: 'Победа без павших турелей' },
      { id: 'nodeath', kind: 'run', name: 'Победа без гибели героя' },
      { id: 'fastboss', kind: 'run', name: 'Бой с боссом короче 60 с' },
      { id: 'raid', kind: 'run', name: '3 000 золота с вылазок за партию' },
      { id: 'hard3', kind: 'run', name: 'Три звёзды на Тяжёлой' }
    ]);
  const SOLO_DATE = Date.UTC(2026, 9, 24, 12);
  const SOLO = [
    ['easy', 'silverwolf', 20, 1384, 3], ['easy', 'kafka', 20, 1422, 3], ['easy', 'seele', 20, 1501, 2], ['easy', 'march', 20, 1610, 2], ['easy', 'trail', 17, 1180, 0],
    ['normal', 'silverwolf', 20, 1532, 3], ['normal', 'topaz', 20, 1597, 2], ['normal', 'herta', 20, 1660, 2], ['normal', 'gepard', 20, 1789, 1], ['normal', 'silverwolf', 18, 1402, 0], ['normal', 'bronya', 15, 1131, 0],
    ['hard', 'silverwolf', 20, 1714, 2], ['hard', 'fuxuan', 20, 1902, 1], ['hard', 'silverwolf', 19, 1655, 0], ['hard', 'luocha', 16, 1347, 0], ['hard', 'seele', 12, 902, 0]
  ].map(([diff, hero, wave, time, stars]) => ({ name: 'Leveling_Solo', hero, diff, wave, time, stars, date: SOLO_DATE, solo: true }));

  H.HD = { TUN, ARMOR0, ATK_ARMOR, ATK_NAME, ARMOR_NAME, ATTR_NAME, ATTR_COL, PATHS, DIFFS, HEROES, FOES, THREATS, FOE_THREAT, WAVES, SUPPLIES, DEVICES, RELIC, CONE_PRICE, CONE_LATER, ROWS, RIFT_NAME, META, TRIALS, SOLO, perron, KITS: {}, FOE_AI: {} };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
