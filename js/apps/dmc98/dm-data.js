(function (S) {
  'use strict';
  const D = {};

  D.DIFF = [
    { id: 'human', name: 'Человек', desc: 'Для тех, кто впервые держит меч. Демоны бьют слабее и реже.', dmgIn: 0.55, hpMul: 0.8, aggr: 0.65, orbMul: 1 },
    { id: 'dh', name: 'Охотник на демонов', desc: 'Сложность, задуманная авторами.', dmgIn: 1, hpMul: 1, aggr: 1, orbMul: 1 },
    { id: 'sos', name: 'Сын Спарды', desc: 'Открывается после прохождения. Демоны сильнее, умнее и злее.', dmgIn: 1.45, hpMul: 1.35, aggr: 1.4, orbMul: 1.25, locked: true }
  ];

  D.RANKS = [
    { l: 'D', name: 'Deadly!', need: 0, decay: 5, mul: 1, col: '#9a9aa8' },
    { l: 'C', name: 'Carnage!', need: 110, decay: 8, mul: 1.2, col: '#6fa8ff' },
    { l: 'B', name: 'Brutal!', need: 260, decay: 12, mul: 1.4, col: '#6fe07a' },
    { l: 'A', name: 'Atomic!', need: 450, decay: 17, mul: 1.6, col: '#ffe04a' },
    { l: 'S', name: "Smokin'!", need: 700, decay: 23, mul: 1.8, col: '#ff9a3a' },
    { l: 'SS', name: "Smokin' Style!!", need: 1000, decay: 29, mul: 2.1, col: '#ff5a3a' },
    { l: 'SSS', name: "Smokin' Sick Style!!!", need: 1360, decay: 36, mul: 2.5, col: '#ff2a5a' }
  ];
  D.STYLE_MAX = 1760;

  D.GRADES = ['D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
  D.GRADE_SOULS = [150, 300, 500, 800, 1200, 1600, 2000];
  D.GRADE_ORBS = [0, 100, 300, 600, 1000, 1500, 2000];

  D.PLAYER = {
    hp: 100, r: 0.45, h: 1.8, run: 7.2, speedRun: 9.6, accel: 60, jump: 11.5, hike: 10, grav: 27, termVel: 30,
    stepJump: 11, rollSpeed: 10, snatch: 14, snatch2: 20, grab: 2.5, hellbound: 22, gripRange: 22,
    dtMin: 300, dtBar: 100, dtBars: 3, dtDrain: 38, dtRegen: 3.5, dtDmg: 1.5, dtGain: 7, dtGainHurt: 12,
    exAct: 0.13, maxAct: 0.045, revTap: 0.26, exMul: 1.6, iframesRoll: [0.03, 0.34]
  };

  const H = (t, dmg, o = {}) => Object.assign({ t, dmg, reach: 2.7, arc: 150, kb: 1.2, up: 0, stun: 0.32, juggle: 0, hstop: 0.05 }, o);
  D.MOVES = {
    a1: { dur: 0.36, open: 0.15, close: 0.62, lunge: 3.5, lungeT: 0.12, hits: [H(0.1, 10)], style: 16, arc: { tilt: 8, dir: -1, r: 2.1 }, sfx: 'swing' },
    a2: { dur: 0.36, open: 0.15, close: 0.62, lunge: 3.5, lungeT: 0.12, hits: [H(0.1, 10)], style: 16, arc: { tilt: -10, dir: 1, r: 2.1 }, sfx: 'swing' },
    a3: { dur: 0.42, open: 0.2, close: 0.68, lunge: 4, lungeT: 0.14, hits: [H(0.15, 13, { arc: 110, stun: 0.42 })], style: 20, arc: { tilt: 70, dir: -1, r: 2.2 }, sfx: 'swing2' },
    a4: { dur: 0.72, open: 0.5, lunge: 2, lungeT: 0.2, hits: [H(0.2, 17, { arc: 360, reach: 3, kb: 8, stun: 0.8, knock: true, hstop: 0.09 })], style: 34, arc: { tilt: 0, dir: -1, r: 2.6, full: true }, sfx: 'swing3', shake: 0.25 },
    b3: { dur: 0.72, open: 0.6, lunge: 1.5, lungeT: 0.6, hits: [0.08, 0.18, 0.28, 0.38, 0.48].map(t => H(t, 5, { arc: 70, reach: 2.9, stun: 0.25, kb: 0.4, hstop: 0.025 })), style: 8, arc: { thrust: true }, sfx: 'stab' },
    b4: { dur: 0.62, open: 0.45, lunge: 3, lungeT: 0.15, hits: [H(0.16, 20, { arc: 140, kb: 5, up: 6, stun: 0.9, knock: true, hstop: 0.08 })], style: 34, arc: { tilt: 60, dir: 1, r: 2.4, rise: true }, sfx: 'swing3', shake: 0.2 },
    streak: { dur: 0.64, open: 0.52, lunge: 17, lungeT: 0.32, lungeStop: 1.6, hits: [H(0.3, 18, { arc: 100, reach: 3, kb: 7, stun: 0.7, knock: true, hstop: 0.08 })], style: 40, arc: { tilt: 20, dir: -1, r: 2.4 }, sfx: 'swing3', ex: 2 },
    highroller: { dur: 0.56, open: 0.42, lunge: 1, lungeT: 0.1, hits: [H(0.14, 14, { arc: 120, up: 12.5, stun: 1, kb: 0.3, hstop: 0.07, launch: true })], style: 40, arc: { tilt: 80, dir: 1, r: 2.3, rise: true }, sfx: 'swing2', ex: 2, follow: 0.2 },
    shuffle: { dur: 0.78, open: 0.62, lunge: 15, lungeT: 0.2, lungeAt: 0.28, back: 0.24, hits: [H(0.42, 24, { arc: 150, reach: 3.1, kb: 9, stun: 0.9, knock: true, hstop: 0.1 })], style: 55, arc: { tilt: -15, dir: 1, r: 2.6 }, sfx: 'swing3', skill: 'shuffle', ex: 3 },
    air1: { dur: 0.3, open: 0.12, close: 0.55, air: true, hover: 0.25, hits: [H(0.08, 9, { juggle: 4, reach: 2.5 })], style: 15, arc: { tilt: 15, dir: -1, r: 2 }, sfx: 'swing' },
    air2: { dur: 0.3, open: 0.12, close: 0.55, air: true, hover: 0.25, hits: [H(0.08, 9, { juggle: 4, reach: 2.5 })], style: 15, arc: { tilt: -15, dir: 1, r: 2 }, sfx: 'swing' },
    air3: { dur: 0.5, open: 0.4, air: true, hover: 0.45, hits: [H(0.16, 15, { juggle: -14, reach: 2.6, stun: 0.8, knock: true, hstop: 0.08 })], style: 26, arc: { tilt: 75, dir: -1, r: 2.3 }, sfx: 'swing2' },
    roulette: { dur: 0.75, open: 0.62, air: true, hover: 1, rise: 4.5, hits: [0.08, 0.2, 0.32, 0.44, 0.56].map(t => H(t, 6, { arc: 360, reach: 2.6, juggle: 5, stun: 0.3, hstop: 0.02 })), style: 11, arc: { tilt: 0, dir: -1, r: 2.2, full: true }, sfx: 'swing2', skill: 'roulette' },
    split: { dur: 0.6, air: true, plunge: true, hits: [], style: 45, sfx: 'swing3', skill: 'split', ex: 3, land: { r: 3.2, dmg: 22, kb: 7, up: 5, stun: 0.8 } },
    calibur: { dur: 0.6, open: 0.48, air: true, hover: 1, lunge: 21, lungeT: 0.26, lungeStop: 1.4, hits: [H(0.2, 22, { arc: 120, reach: 3, kb: 9, stun: 0.9, knock: true, hstop: 0.09 })], style: 50, arc: { tilt: 5, dir: 1, r: 2.4 }, sfx: 'swing3', skill: 'calibur', ex: 3 }
  };
  D.COMBO_A = ['a1', 'a2', 'a3', 'a4'];
  D.AIR_COMBO = ['air1', 'air2', 'air3'];

  D.GUN = { dur: 0.3, shots: [0.02, 0.15], dmg: 3, stun: 0.12, juggle: 1.8, range: 30, style: 4, charge: [0.75, 1.45, 2.2], cdmg: [26, 48, 75], crad: [1.1, 1.9, 2.7], cstyle: [28, 44, 62] };
  D.BUSTER = { dur: 0.95, grab: 0.1, slam: 0.58, dmg: 95, heavy: 125, aoe: 3.2, aoeDmg: 30, style: 110, air: 0.8 };

  D.FOES = {
    scarecrow: { name: 'Страшила', model: 'scarecrow', hp: 110, r: 0.5, h: 1.9, heavy: 0, speed: 3.2, dmg: 8, orbs: 10, poise: 0, reach: 2.1, cd: [1.6, 3.2] },
    scarecrowLeg: { name: 'Страшила', model: 'scarecrowLeg', hp: 110, r: 0.5, h: 1.9, heavy: 0, speed: 3.4, dmg: 8, orbs: 10, poise: 0, reach: 2.2, cd: [1.4, 3] },
    mega: { name: 'Мега-страшила', model: 'mega', hp: 440, r: 1.15, h: 2.9, heavy: 2, speed: 2.4, dmg: 14, orbs: 45, poise: 26, reach: 3, cd: [1.8, 3.4] },
    frost: { name: 'Фрост', model: 'frost', hp: 300, r: 0.6, h: 2.2, heavy: 1, speed: 5.5, dmg: 12, orbs: 35, poise: 30, reach: 2.4, cd: [1.1, 2.4], cocoon: 0.3 },
    angelo: { name: 'Бьянко Анджело', model: 'angelo', hp: 360, r: 0.65, h: 2.3, heavy: 1, speed: 4, dmg: 12, orbs: 40, poise: 34, reach: 2.8, cd: [1.4, 2.8], shield: true },
    mephisto: { name: 'Мефисто', model: 'mephisto', hp: 190, cloak: 90, r: 0.6, h: 2.1, heavy: 0, speed: 4.6, dmg: 10, orbs: 30, poise: 0, reach: 2.4, cd: [1.4, 2.8], fly: 1.4 },
    assault: { name: 'Ассаулт', model: 'assault', hp: 260, r: 0.55, h: 1.8, heavy: 0, speed: 6.2, dmg: 11, orbs: 30, poise: 12, reach: 2.4, cd: [1, 2.2], block: 0.45 },
    gladius: { name: 'Гладиус', model: 'gladius', hp: 40, r: 0.4, h: 0.6, heavy: 0, speed: 9, dmg: 7, orbs: 3, poise: 0, reach: 1.2, cd: [1.2, 2.4], fly: 2.2, projectile: true }
  };

  D.BOSSES = {
    dante: { name: 'Данте', model: 'dante', hp: 3000, r: 0.5, h: 1.85, end: 0.36, souls: 0 },
    berial: { name: 'Бериал', model: 'berial', hp: 6200, r: 2.4, h: 6.4, souls: 1000 },
    bael: { name: 'Баэль', model: 'bael', hp: 7800, r: 2.8, h: 4.2, souls: 1000 },
    agnus: { name: 'Агнус', model: 'agnus', hp: 3, r: 0.5, h: 1.9, souls: 1000 },
    credo: { name: 'Анджело Кредо', model: 'credoAngelo', hp: 7400, r: 0.7, h: 2.5, souls: 1500 }
  };

  D.ITEMS = {
    vitalS: { name: 'Малая звезда жизни', desc: 'Восстанавливает 35 единиц здоровья.', base: 100, grow: 1.3, max: 30, key: '1' },
    vitalL: { name: 'Большая звезда жизни', desc: 'Полностью восстанавливает здоровье.', base: 500, grow: 1.3, max: 30, key: '2' },
    devilStar: { name: 'Звезда дьявола', desc: 'Полностью заполняет шкалу Devil Trigger.', base: 800, grow: 1.3, max: 30, key: '3', needDT: true },
    holyWater: { name: 'Святая вода', desc: 'Наносит 160 единиц урона всем демонам вокруг.', base: 2500, grow: 1.25, max: 30, key: '4' },
    goldOrb: { name: 'Золотая сфера', desc: 'Воскрешает на месте гибели с полным здоровьем.', base: 1800, grow: 1.4, max: 3 },
    blueOrb: { name: 'Синяя сфера', desc: 'Навсегда увеличивает здоровье на 10.', base: 1500, grow: 1.6, max: 4, perm: true },
    purpleOrb: { name: 'Фиолетовая сфера', desc: 'Навсегда добавляет деление шкалы Devil Trigger.', base: 2500, grow: 1.5, max: 3, perm: true, needDT: true }
  };

  D.SKILLS = {
    split: { name: 'Split', group: 'Красная королева', desc: 'В воздухе: захват + к врагу + меч. Удар сверху с ударной волной. Со зарядом Exceed — Double Down.', base: 900 },
    roulette: { name: 'Roulette Spin', group: 'Красная королева', desc: 'В воздухе: меч, меч, пауза, меч. Вращение с серией ударов и подъёмом.', base: 1100 },
    shuffle: { name: 'Shuffle', group: 'Красная королева', desc: 'Захват + от врага, затем к врагу + меч. Шаг назад и мощный выпад.', base: 1400 },
    calibur: { name: 'Calibur', group: 'Красная королева', desc: 'В воздухе: захват + от врага, затем к врагу + меч. Рывок сквозь воздух.', base: 2200, need: 'split' },
    maxAct: { name: 'MAX-Act', group: 'Красная королева', desc: 'Идеально точный Exceed в момент удара заряжает все три деления.', base: 2600 },
    charge2: { name: 'Charge Shot 2', group: 'Синяя роза', desc: 'Второй уровень заряженного выстрела.', base: 1000 },
    charge3: { name: 'Charge Shot 3', group: 'Синяя роза', desc: 'Третий уровень заряженного выстрела — взрыв по площади.', base: 2200, need: 'charge2' },
    snatch2: { name: 'Snatch 2', group: 'Рука дьявола', desc: 'Дальность Snatch и Hell Bound увеличена.', base: 900 },
    airHike: { name: 'Air Hike', group: 'Способности', desc: 'Второй прыжок в воздухе.', base: 2000 },
    speed: { name: 'Speed', group: 'Способности', desc: 'После трёх секунд бега Неро ускоряется.', base: 1100 }
  };
  D.SKILL_STEP = 250;

  D.CONTROLS = [
    ['W A S D / стрелки', 'Движение'],
    ['J / ЛКМ', 'Меч «Красная королева»'],
    ['K / ПКМ', 'Револьвер «Синяя роза» (удерживать — заряд)'],
    ['L / СКМ', 'Рука дьявола: Buster, Snatch, Hell Bound'],
    ['Пробел', 'Прыжок, Enemy Step у врага в воздухе'],
    ['Shift (держать)', 'Захват цели'],
    ['Захват + к врагу + J', 'Streak (в воздухе — Split)'],
    ['Захват + от врага + J', 'High Roller (держать J — прыжок следом)'],
    ['Захват + в сторону + Пробел', 'Перекат'],
    ['I', 'Exceed: газ рукоятки, нажать в момент удара — EX-Act'],
    ['O', 'Devil Trigger'],
    ['U', 'Насмешка'],
    ['Q / E, мышь', 'Поворот камеры, C — камера за спину'],
    ['1–4', 'Звёзды жизни, звезда дьявола, святая вода'],
    ['Tab', 'Задача миссии'],
    ['Esc', 'Пауза'],
    ['Enter', 'Пропустить сцену']
  ];

  D.TIPS = [
    'Меняйте приёмы: повтор одного и того же удара почти не поднимает оценку стиля.',
    'Exceed: нажмите I точно в момент попадания мечом — и деление заряда заполнится сразу.',
    'Большие враги и боссы не поддаются Snatch: вместо этого Неро сам притягивается к ним.',
    'Мефисто укрыт тьмой. Заряженный выстрел или Snatch срывает с него покров.',
    'Щит Бьянко Анджело держит удары спереди. Зайдите сбоку или сорвите щит рукой дьявола.',
    'Buster по оглушённому боссу наносит огромный урон.',
    'Статуя божества продаёт предметы за красные сферы и навыки за гордые души.',
    'Четыре осколка синей сферы складываются в целую — и здоровье растёт.',
    'Удерживайте J после High Roller, чтобы прыгнуть вслед за подброшенным врагом.',
    'Фросты не взлетают от High Roller. Хватайте их рукой дьявола.'
  ];

  S.DATA = D;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Dmc98 = globalThis.Dmc98 || {});
