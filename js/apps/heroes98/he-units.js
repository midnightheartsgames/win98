(function (H) {
  'use strict';
  H.UNITS = {
    militia: { name: 'Ополченцы', faction: 'league', tier: 1, atk: 2, def: 2, dmg: [1, 2], hp: 6, speed: 4, init: 10, growth: 18, cost: 31, shape: 'foot' },
    pikeman: { name: 'Пикинёры', faction: 'league', tier: 1, atk: 3, def: 2, dmg: [1, 2], hp: 7, speed: 4, init: 10, growth: 18, cost: 41, brace: 3, shape: 'foot' },
    shieldbearer: { name: 'Щитоносцы', faction: 'league', tier: 1, atk: 1, def: 4, dmg: [1, 2], hp: 7, speed: 4, init: 10, growth: 18, cost: 41, shield: { self: 0.4, near: 0.2 }, shape: 'foot' },
    crossbow: { name: 'Арбалетчики', faction: 'league', tier: 2, atk: 5, def: 4, dmg: [2, 4], hp: 10, speed: 4, init: 9, growth: 11, cost: 83, shots: 8, pierce: 0.3, shape: 'shooter' },
    heavycrossbow: { name: 'Тяжёлые арбалетчики', faction: 'league', tier: 2, atk: 6, def: 5, dmg: [2, 4], hp: 11, speed: 4, init: 9, growth: 11, cost: 108, shots: 8, pierce: 0.5, steady: 3, shape: 'shooter' },
    skirmisher: { name: 'Застрельщики', faction: 'league', tier: 2, atk: 6, def: 4, dmg: [2, 4], hp: 11, speed: 5, init: 10, growth: 11, cost: 108, shots: 8, pierce: 0.3, saddle: 0.75, saddleSteps: 2, shape: 'shooter' },
    ringer: { name: 'Звонари', faction: 'league', tier: 3, atk: 7, def: 7, dmg: [4, 6], hp: 25, speed: 5, init: 10, growth: 7, cost: 150, bell: { range: 3, ready: 10, mul: 0.6 }, aura: { side: 'own', morale: 1 }, shape: 'foot' },
    alarmist: { name: 'Набатчики', faction: 'league', tier: 3, atk: 8, def: 8, dmg: [4, 6], hp: 26, speed: 5, init: 10, growth: 7, cost: 205, bell: { range: 3, ready: 10, mul: 0.6 }, aura: { side: 'own', morale: 1 }, alarm: 20, shape: 'foot' },
    herald: { name: 'Благовестники', faction: 'league', tier: 3, atk: 7, def: 9, dmg: [4, 6], hp: 27, speed: 5, init: 11, growth: 7, cost: 205, bell: { range: 3, ready: 10, mul: 0.6 }, aura: { side: 'own', morale: 1 }, soothe: 0.1, shape: 'foot' },
    plated: { name: 'Латники', faction: 'league', tier: 4, atk: 11, def: 14, dmg: [8, 12], hp: 55, speed: 5, init: 9, growth: 5, cost: 365, shape: 'heavy' },
    halberdier: { name: 'Алебардисты', faction: 'league', tier: 4, atk: 12, def: 14, dmg: [9, 13], hp: 54, speed: 5, init: 9, growth: 5, cost: 510, pole: true, shape: 'heavy' },
    cityguard: { name: 'Гвардия ратуши', faction: 'league', tier: 4, atk: 11, def: 18, dmg: [8, 12], hp: 60, speed: 5, init: 9, growth: 5, cost: 510, formationOwn: 0.6, guardStand: 0.6, shape: 'heavy' },
    aeronaut: { name: 'Аэронавты', faction: 'league', tier: 5, atk: 14, def: 9, dmg: [14, 20], hp: 78, speed: 7, init: 12, growth: 3, cost: 760, rare: { sulfur: 1 }, fly: true, shots: 6, shape: 'engine' },
    bomber: { name: 'Бомбардиры', faction: 'league', tier: 5, atk: 17, def: 9, dmg: [16, 22], hp: 80, speed: 7, init: 12, growth: 3, cost: 1030, rare: { sulfur: 1 }, fly: true, shots: 6, splash: 0.6, shape: 'engine' },
    spotter: { name: 'Дозорные', faction: 'league', tier: 5, atk: 15, def: 10, dmg: [14, 20], hp: 82, speed: 7, init: 12, growth: 3, cost: 1030, rare: { sulfur: 1 }, fly: true, shots: 6, spotter: true, scout: 3, shape: 'engine' },
    horseguard: { name: 'Конная гвардия', faction: 'league', tier: 6, atk: 20, def: 17, dmg: [24, 33], hp: 150, speed: 8, init: 11, growth: 2, cost: 1500, rare: { salt: 1 }, big: true, charge: 0.05, shape: 'rider' },
    palaceknight: { name: 'Рыцари Палаты', faction: 'league', tier: 6, atk: 22, def: 18, dmg: [24, 34], hp: 155, speed: 9, init: 11, growth: 2, cost: 2000, rare: { salt: 1 }, big: true, charge: 0.07, noBrace: true, shape: 'rider' },
    cuirassier: { name: 'Кирасиры', faction: 'league', tier: 6, atk: 21, def: 19, dmg: [24, 34], hp: 165, speed: 8, init: 12, growth: 2, cost: 2000, rare: { salt: 1 }, big: true, charge: 0.05, volley: { range: 4, mul: 1.5 }, shape: 'rider' },
    bombard: { name: 'Бомбарда', faction: 'league', tier: 7, atk: 26, def: 20, dmg: [48, 68], hp: 265, speed: 2, init: 10, growth: 1, cost: 3050, rare: { sulfur: 3 }, big: true, shots: 4, splash: 0.5, shape: 'engine' },
    mortar: { name: 'Мортира', faction: 'league', tier: 7, atk: 28, def: 21, dmg: [52, 70], hp: 290, speed: 2, init: 10, growth: 1, cost: 4200, rare: { sulfur: 3 }, big: true, shots: 4, lob: true, splash: 0.6, shape: 'engine' },
    culverin: { name: 'Кулеврина', faction: 'league', tier: 7, atk: 28, def: 20, dmg: [48, 68], hp: 285, speed: 2, init: 11, growth: 1, cost: 4200, rare: { sulfur: 3 }, big: true, shots: 4, aimed: true, line: { cells: 2, share: 0.5 }, shape: 'engine' },
    shade: { name: 'Тени предков', faction: 'barrows', tier: 1, atk: 2, def: 1, dmg: [1, 3], hp: 6, speed: 6, init: 11, growth: 16, cost: 38, fly: true, spirit: true, chill: { atk: 1, max: 3 }, shape: 'spirit' },
    mourner: { name: 'Вопленицы', faction: 'barrows', tier: 1, atk: 3, def: 1, dmg: [1, 3], hp: 7, speed: 6, init: 11, growth: 16, cost: 50, fly: true, spirit: true, chill: { atk: 1, max: 3 }, chillNear: true, shape: 'spirit' },
    dustguard: { name: 'Стражи праха', faction: 'barrows', tier: 1, atk: 1, def: 3, dmg: [1, 3], hp: 7, speed: 5, init: 11, growth: 16, cost: 50, spirit: true, chill: { atk: 1, max: 3 }, lastStand: true, shape: 'spirit' },
    horsebow: { name: 'Конные лучники', faction: 'barrows', tier: 2, atk: 5, def: 4, dmg: [2, 4], hp: 12, speed: 6, init: 11, growth: 9, cost: 100, shots: 10, saddle: 0.7, shape: 'rider' },
    steppearcher: { name: 'Степные стрелки', faction: 'barrows', tier: 2, atk: 6, def: 4, dmg: [2, 4], hp: 13, speed: 6, init: 11, growth: 9, cost: 134, shots: 10, saddle: 1, shape: 'rider' },
    lasso: { name: 'Арканщики', faction: 'barrows', tier: 2, atk: 5, def: 5, dmg: [2, 4], hp: 14, speed: 6, init: 11, growth: 9, cost: 134, shots: 10, saddle: 0.7, drag: { cells: 2, uses: 3, range: 5, ready: 15 }, shape: 'rider' },
    stonewoman: { name: 'Каменные бабы', faction: 'barrows', tier: 3, atk: 6, def: 10, dmg: [4, 7], hp: 32, speed: 4, init: 9, growth: 6, cost: 170, stone: true, aura: { side: 'enemy', morale: -1 }, shape: 'idol' },
    kinidol: { name: 'Идолы рода', faction: 'barrows', tier: 3, atk: 6, def: 12, dmg: [4, 7], hp: 34, speed: 4, init: 9, growth: 6, cost: 236, stone: true, aura: { side: 'enemy', morale: -1 }, guardNear: 2, shape: 'idol' },
    speakingstone: { name: 'Говорящие камни', faction: 'barrows', tier: 3, atk: 7, def: 11, dmg: [4, 7], hp: 35, speed: 4, init: 10, growth: 6, cost: 236, stone: true, aura: { side: 'enemy', morale: -1 }, spellOnce: 'numb', shape: 'idol' },
    eaglespirit: { name: 'Духи беркутов', faction: 'barrows', tier: 4, atk: 12, def: 10, dmg: [9, 13], hp: 51, speed: 7, init: 12, growth: 5, cost: 356, fly: true, spirit: true, dive: { from: 4, bonus: 0.25 }, shape: 'bird' },
    stormeagle: { name: 'Беркуты бури', faction: 'barrows', tier: 4, atk: 13, def: 9, dmg: [9, 13], hp: 57, speed: 7, init: 10, growth: 5, cost: 490, fly: true, spirit: true, dive: { from: 4, bonus: 0.25 }, raid: true, elusive: true, shape: 'bird' },
    soulcatcher: { name: 'Ловцы душ', faction: 'barrows', tier: 4, atk: 13, def: 13, dmg: [9, 13], hp: 54, speed: 8, init: 13, growth: 5, cost: 470, fly: true, spirit: true, dive: { from: 4, bonus: 0.25 }, soulTake: 0.1, shape: 'bird' },
    saltnoyon: { name: 'Засоленные нойоны', faction: 'barrows', tier: 5, atk: 15, def: 15, dmg: [15, 22], hp: 96, speed: 5, init: 10, growth: 3, cost: 890, rare: { salt: 1 }, curseHit: 3, shape: 'foot' },
    shamannoyon: { name: 'Нойоны-шаманы', faction: 'barrows', tier: 5, atk: 16, def: 16, dmg: [16, 22], hp: 100, speed: 5, init: 11, growth: 3, cost: 1160, rare: { salt: 1 }, curseHit: 3, spellOnce: 'blackmark', shape: 'foot' },
    thousander: { name: 'Тысячники', faction: 'barrows', tier: 5, atk: 17, def: 16, dmg: [15, 23], hp: 102, speed: 5, init: 10, growth: 3, cost: 1160, rare: { salt: 1 }, curseHit: 3, atkNear: 1, rallyMove: 10, shape: 'foot' },
    bonebull: { name: 'Костяные туры', faction: 'barrows', tier: 6, atk: 20, def: 16, dmg: [25, 36], hp: 166, speed: 7, init: 10, growth: 2, cost: 1420, rare: { salt: 2 }, big: true, ram: 1, shape: 'beast' },
    thunderbull: { name: 'Громовые туры', faction: 'barrows', tier: 6, atk: 22, def: 17, dmg: [26, 37], hp: 172, speed: 7, init: 11, growth: 2, cost: 1900, rare: { salt: 2 }, big: true, ram: 1, trample: { cells: 1, share: 0.5 }, shape: 'beast' },
    greybull: { name: 'Седые туры', faction: 'barrows', tier: 6, atk: 21, def: 18, dmg: [25, 36], hp: 176, speed: 7, init: 10, growth: 2, cost: 1900, rare: { salt: 2 }, big: true, ram: 1, vsLow: { tiers: 3, bonus: 0.5 }, shape: 'beast' },
    stonekhan: { name: 'Каменный хан', faction: 'barrows', tier: 7, atk: 24, def: 27, dmg: [42, 60], hp: 285, speed: 6, init: 10, growth: 1, cost: 3600, rare: { salt: 3 }, big: true, stone: true, kinCall: 0.2, shape: 'idol' },
    kurgankhan: { name: 'Хан-курган', faction: 'barrows', tier: 7, atk: 26, def: 29, dmg: [42, 60], hp: 315, speed: 6, init: 10, growth: 1, cost: 4700, rare: { salt: 3 }, big: true, stone: true, kinCall: 0.2, fearless: true, shape: 'idol' },
    stormkhan: { name: 'Хан бурь', faction: 'barrows', tier: 7, atk: 26, def: 26, dmg: [32, 46], hp: 285, speed: 6, init: 10, growth: 1, cost: 4900, rare: { salt: 3 }, big: true, stone: true, shots: 3, kinCall: 0.2, splash: 0.25, blastReady: 20, shape: 'idol' },
    auka: { name: 'Ауки', faction: 'thicket', tier: 1, atk: 2, def: 1, dmg: [1, 2], hp: 4, speed: 6, init: 12, growth: 20, cost: 36, elusive: true, shape: 'blob' },
    mocker: { name: 'Пересмешники', faction: 'thicket', tier: 1, atk: 2, def: 1, dmg: [1, 2], hp: 5, speed: 6, init: 12, growth: 20, cost: 48, elusive: true, sap: 15, shape: 'blob' },
    wisp: { name: 'Блуждающие огни', faction: 'thicket', tier: 1, atk: 2, def: 1, dmg: [1, 2], hp: 3, speed: 6, init: 12, growth: 20, cost: 48, fly: true, spirit: true, shots: 6, closeShot: true, shape: 'spirit' },
    werewolf: { name: 'Волколаки', faction: 'thicket', tier: 2, atk: 6, def: 3, dmg: [2, 4], hp: 14, speed: 6, init: 11, growth: 11, cost: 100, pack: 0.1, shape: 'beast' },
    elderwolf: { name: 'Матёрые волколаки', faction: 'thicket', tier: 2, atk: 7, def: 4, dmg: [2, 4], hp: 15, speed: 6, init: 11, growth: 11, cost: 135, pack: 0.1, twiceStill: true, shape: 'beast' },
    greyturn: { name: 'Серые оборотни', faction: 'thicket', tier: 2, atk: 7, def: 4, dmg: [2, 5], hp: 14, speed: 6, init: 11, growth: 11, cost: 135, pack: 0.1, howl: 1, shape: 'beast' },
    bereginya: { name: 'Берегини', faction: 'thicket', tier: 3, atk: 7, def: 7, dmg: [4, 6], hp: 29, speed: 5, init: 10, growth: 7, cost: 160, spirit: true, ward: { uses: 3, share: 0.3, rounds: 2 }, shape: 'spirit' },
    keeper: { name: 'Хранительницы', faction: 'thicket', tier: 3, atk: 7, def: 8, dmg: [4, 6], hp: 31, speed: 5, init: 10, growth: 7, cost: 215, spirit: true, ward: { uses: 3, share: 0.3, rounds: 2, cleanse: true }, shape: 'spirit' },
    rusalka: { name: 'Русалки', faction: 'thicket', tier: 3, atk: 9, def: 7, dmg: [4, 7], hp: 30, speed: 5, init: 11, growth: 7, cost: 215, spirit: true, drag: { name: 'Затянуть', cells: 2, uses: 3, range: 4, ready: 0 }, shape: 'spirit' },
    kikimora: { name: 'Кикиморы', faction: 'thicket', tier: 4, atk: 12, def: 10, dmg: [8, 12], hp: 48, speed: 5, init: 10, growth: 5, cost: 400, shots: 8, mud: { pct: 0.3, rounds: 2 }, shape: 'foot' },
    bogwitch: { name: 'Болотницы', faction: 'thicket', tier: 4, atk: 13, def: 10, dmg: [8, 13], hp: 52, speed: 5, init: 10, growth: 5, cost: 535, shots: 8, mud: { pct: 0.3, rounds: 2 }, mudVenom: { share: 0.2, rounds: 2 }, shape: 'foot' },
    spinner: { name: 'Пряхи', faction: 'thicket', tier: 4, atk: 12, def: 12, dmg: [8, 12], hp: 52, speed: 5, init: 11, growth: 5, cost: 535, shots: 8, snare: true, shape: 'foot' },
    sirin: { name: 'Сирины', faction: 'thicket', tier: 5, atk: 16, def: 14, dmg: [16, 22], hp: 86, speed: 8, init: 12, growth: 3, cost: 870, rare: { amber: 1 }, fly: true, song: 15, shape: 'bird' },
    alkonost: { name: 'Алконосты', faction: 'thicket', tier: 5, atk: 16, def: 15, dmg: [16, 22], hp: 96, speed: 8, init: 12, growth: 3, cost: 1150, rare: { amber: 1 }, fly: true, joy: { heal: 0.08, range: 2, morale: 1 }, shape: 'bird' },
    gamayun: { name: 'Гамаюны', faction: 'thicket', tier: 5, atk: 19, def: 14, dmg: [17, 24], hp: 90, speed: 8, init: 13, growth: 3, cost: 1150, rare: { amber: 1 }, fly: true, cry: { ready: 30, uses: 3 }, shape: 'bird' },
    leshy: { name: 'Лешие', faction: 'thicket', tier: 6, atk: 17, def: 16, dmg: [22, 31], hp: 136, speed: 6, init: 9, growth: 2, cost: 1500, rare: { amber: 2 }, big: true, regen: 0.15, ram: 1, ramName: 'Сбить с пути', shape: 'heavy' },
    borovik: { name: 'Боровики', faction: 'thicket', tier: 6, atk: 18, def: 18, dmg: [22, 31], hp: 150, speed: 6, init: 9, growth: 2, cost: 2000, rare: { amber: 2 }, big: true, regen: 0.15, grip: true, gripName: 'Оплетение', shape: 'heavy' },
    warden: { name: 'Лесовики-сторожа', faction: 'thicket', tier: 6, atk: 17, def: 18, dmg: [22, 31], hp: 150, speed: 6, init: 10, growth: 2, cost: 2000, rare: { amber: 2 }, big: true, regen: 0.15, brushGuard: 2, plantOnce: true, shape: 'heavy' },
    zmey: { name: 'Змей', faction: 'thicket', tier: 7, atk: 26, def: 25, dmg: [46, 62], hp: 300, speed: 8, init: 11, growth: 1, cost: 3800, rare: { amber: 3 }, big: true, fly: true, flame: { cells: 1, share: 0.6 }, shape: 'serpent' },
    threeheaded: { name: 'Трёхглавый змей', faction: 'thicket', tier: 7, atk: 28, def: 25, dmg: [46, 62], hp: 330, speed: 8, init: 11, growth: 1, cost: 5000, rare: { amber: 3 }, big: true, fly: true, sweep: { count: 3, share: 0.75 }, shape: 'serpent' },
    firezmey: { name: 'Огненный змей', faction: 'thicket', tier: 7, atk: 28, def: 25, dmg: [44, 60], hp: 325, speed: 8, init: 12, growth: 1, cost: 5000, rare: { amber: 3 }, big: true, fly: true, flame: { cells: 3, share: 0.6 }, burn: { rounds: 2, share: 0.1 }, shape: 'serpent' },
    shellman: { name: 'Панцирники', faction: 'tide', tier: 1, atk: 2, def: 3, dmg: [1, 2], hp: 7, speed: 4, init: 9, growth: 16, cost: 36, shape: 'foot' },
    claw: { name: 'Клешненосцы', faction: 'tide', tier: 1, atk: 3, def: 3, dmg: [1, 2], hp: 8, speed: 4, init: 9, growth: 16, cost: 48, grip: true, gripName: 'Хватка', shape: 'foot' },
    shellback: { name: 'Ракушечники', faction: 'tide', tier: 1, atk: 2, def: 4, dmg: [1, 2], hp: 8, speed: 4, init: 9, growth: 16, cost: 48, shield: { self: 0.5, near: 0 }, shape: 'foot' },
    harpooner: { name: 'Гарпунщики', faction: 'tide', tier: 2, atk: 5, def: 3, dmg: [2, 4], hp: 12, speed: 4, init: 9, growth: 10, cost: 90, shots: 6, harpoon: 1, shape: 'shooter' },
    whaler: { name: 'Китобои', faction: 'tide', tier: 2, atk: 6, def: 3, dmg: [2, 4], hp: 13, speed: 4, init: 9, growth: 10, cost: 120, shots: 6, harpoon: 1, vsBig: 0.5, shape: 'shooter' },
    netter: { name: 'Сетеметатели', faction: 'tide', tier: 2, atk: 6, def: 4, dmg: [2, 3], hp: 16, speed: 4, init: 9, growth: 10, cost: 120, shots: 6, net: true, shape: 'shooter' },
    jelly: { name: 'Медузы', faction: 'tide', tier: 3, atk: 7, def: 7, dmg: [4, 6], hp: 26, speed: 5, init: 10, growth: 7, cost: 160, fly: true, sap: 10, shape: 'blob' },
    deeplight: { name: 'Огни глубин', faction: 'tide', tier: 3, atk: 7, def: 8, dmg: [4, 6], hp: 28, speed: 5, init: 10, growth: 7, cost: 215, fly: true, sap: 10, dimNear: 0.2, shape: 'blob' },
    stinger: { name: 'Жгучие медузы', faction: 'tide', tier: 3, atk: 8, def: 7, dmg: [4, 7], hp: 26, speed: 5, init: 10, growth: 7, cost: 215, fly: true, sap: 10, retalVenom: { share: 0.25, rounds: 2 }, shape: 'blob' },
    seawitch: { name: 'Морские ведьмы', faction: 'tide', tier: 4, atk: 11, def: 10, dmg: [8, 12], hp: 48, speed: 5, init: 10, growth: 5, cost: 380, shots: 6, fog: { share: 0.4, range: 2, rounds: 2 }, shape: 'foot' },
    abyssinger: { name: 'Певуньи бездны', faction: 'tide', tier: 4, atk: 12, def: 10, dmg: [9, 13], hp: 50, speed: 5, init: 10, growth: 5, cost: 510, shots: 6, aura: { side: 'enemy', morale: -1, range: 2 }, shape: 'foot' },
    saltwitch: { name: 'Солёные ведьмы', faction: 'tide', tier: 4, atk: 12, def: 10, dmg: [9, 13], hp: 50, speed: 5, init: 10, growth: 5, cost: 510, shots: 6, brineShot: { n: 2, max: 6 }, shape: 'foot' },
    rayrider: { name: 'Наездники на скатах', faction: 'tide', tier: 5, atk: 15, def: 13, dmg: [14, 19], hp: 74, speed: 8, init: 12, growth: 3, cost: 860, rare: { amber: 1 }, fly: true, arc: { n: 1, share: 0.5 }, shape: 'bird' },
    stormray: { name: 'Грозовые скаты', faction: 'tide', tier: 5, atk: 16, def: 14, dmg: [14, 19], hp: 78, speed: 8, init: 12, growth: 3, cost: 1130, rare: { amber: 1 }, fly: true, arc: { n: 2, share: 0.5 }, shape: 'bird' },
    nightray: { name: 'Ночные скаты', faction: 'tide', tier: 5, atk: 17, def: 13, dmg: [15, 19], hp: 76, speed: 8, init: 13, growth: 3, cost: 1130, rare: { amber: 1 }, fly: true, veil: true, shape: 'bird' },
    turtlefort: { name: 'Черепахи-крепости', faction: 'tide', tier: 6, atk: 17, def: 18, dmg: [22, 26], hp: 130, speed: 6, init: 9, growth: 2, cost: 1500, rare: { salt: 1, amber: 1 }, big: true, shots: 8, fullHand: true, guardStand: 1, shape: 'beast' },
    turtleram: { name: 'Черепахи-тараны', faction: 'tide', tier: 6, atk: 20, def: 20, dmg: [27, 33], hp: 170, speed: 6, init: 9, growth: 2, cost: 2000, rare: { salt: 1, amber: 1 }, big: true, ram: 2, guardStand: 1, shape: 'beast' },
    turtlebeacon: { name: 'Черепахи-маяки', faction: 'tide', tier: 6, atk: 20, def: 20, dmg: [26, 31], hp: 175, speed: 6, init: 9, growth: 2, cost: 2000, rare: { salt: 1, amber: 1 }, big: true, guardStand: 1, beacon: { luck: 1, range: 2, heal: 0.1 }, shape: 'beast' },
    kraken: { name: 'Кракен', faction: 'tide', tier: 7, atk: 25, def: 23, dmg: [42, 58], hp: 280, speed: 6, init: 10, growth: 1, cost: 3800, rare: { salt: 2, amber: 1 }, big: true, sweep: { name: 'Щупальца', count: 6, share: 0.6 }, deep: true, shape: 'serpent' },
    ancientkraken: { name: 'Древний кракен', faction: 'tide', tier: 7, atk: 27, def: 25, dmg: [42, 58], hp: 305, speed: 6, init: 10, growth: 1, cost: 5000, rare: { salt: 2, amber: 1 }, big: true, sweep: { name: 'Щупальца', count: 6, share: 0.6 }, deep: true, pullNear: true, shape: 'serpent' },
    devourer: { name: 'Кракен-пожиратель', faction: 'tide', tier: 7, atk: 28, def: 24, dmg: [42, 60], hp: 300, speed: 6, init: 10, growth: 1, cost: 5000, rare: { salt: 2, amber: 1 }, big: true, sweep: { name: 'Щупальца', count: 6, share: 0.6 }, deep: true, vsLow: { tiers: 3, bonus: 0.5 }, shape: 'serpent' },
    apprentice: { name: 'Подмастерья', faction: 'forge', tier: 1, atk: 4, def: 1, dmg: [1, 2], hp: 6, speed: 5, init: 10, growth: 16, cost: 34, ember: { rounds: 1, share: 0.15 }, shape: 'foot' },
    hammerer: { name: 'Молотобойцы', faction: 'forge', tier: 1, atk: 4, def: 1, dmg: [1, 2], hp: 7, speed: 5, init: 10, growth: 16, cost: 45, ember: { rounds: 1, share: 0.15 }, sap: 20, sapName: 'Тяжёлый молот', shape: 'foot' },
    stoker: { name: 'Кочегары', faction: 'forge', tier: 1, atk: 3, def: 1, dmg: [1, 2], hp: 6, speed: 5, init: 10, growth: 16, cost: 45, ember: { rounds: 1, share: 0.15 }, shots: 6, shape: 'shooter' },
    salamander: { name: 'Саламандры', faction: 'forge', tier: 2, atk: 5, def: 4, dmg: [2, 5], hp: 15, speed: 6, init: 9, growth: 9, cost: 95, thorns: 0.1, fireproof: true, shape: 'beast' },
    firelizard: { name: 'Огневки', faction: 'forge', tier: 2, atk: 6, def: 4, dmg: [2, 5], hp: 17, speed: 6, init: 9, growth: 9, cost: 125, thorns: 0.2, fireproof: true, shape: 'beast' },
    bladelizard: { name: 'Ящеры-клинки', faction: 'forge', tier: 2, atk: 5, def: 5, dmg: [2, 5], hp: 16, speed: 6, init: 9, growth: 9, cost: 125, thorns: 0.1, fireproof: true, twice: true, shape: 'beast' },
    obsidianspider: { name: 'Обсидиановые пауки', faction: 'forge', tier: 3, atk: 7, def: 6, dmg: [4, 5], hp: 26, speed: 6, init: 11, growth: 7, cost: 150, web: { pct: 0.3, rounds: 2 }, shape: 'beast' },
    glassblower: { name: 'Стеклодувы', faction: 'forge', tier: 3, atk: 5, def: 5, dmg: [4, 5], hp: 22, speed: 6, init: 11, growth: 7, cost: 200, web: { pct: 0.3, rounds: 2 }, shots: 3, mud: { pct: 0.2, rounds: 1 }, mudName: 'Стеклянная паутина', shape: 'beast' },
    blackspider: { name: 'Чёрные пауки', faction: 'forge', tier: 3, atk: 8, def: 6, dmg: [4, 5], hp: 32, speed: 6, init: 11, growth: 7, cost: 200, web: { pct: 0.3, rounds: 2 }, venom: { share: 0.4, rounds: 3 }, shape: 'beast' },
    caster: { name: 'Литейщики', faction: 'forge', tier: 4, atk: 10, def: 8, dmg: [8, 11], hp: 46, speed: 5, init: 10, growth: 5, cost: 360, shots: 6, brineShot: { n: 2, max: 6 }, brineName: 'Окалина', shape: 'shooter' },
    mastercaster: { name: 'Мастера литья', faction: 'forge', tier: 4, atk: 11, def: 9, dmg: [8, 12], hp: 50, speed: 5, init: 10, growth: 5, cost: 480, shots: 6, brineShot: { n: 2, max: 6 }, brineName: 'Окалина', splash: 0.3, shape: 'shooter' },
    temperer: { name: 'Закальщики', faction: 'forge', tier: 4, atk: 11, def: 9, dmg: [8, 11], hp: 50, speed: 5, init: 10, growth: 5, cost: 480, shots: 6, brineShot: { n: 2, max: 6 }, brineName: 'Окалина', temper: 3, shape: 'shooter' },
    steamling: { name: 'Паровики', faction: 'forge', tier: 5, atk: 15, def: 12, dmg: [15, 21], hp: 82, speed: 8, init: 12, growth: 3, cost: 800, rare: { sulfur: 1 }, fly: true, spirit: true, sap: 15, sapName: 'Ошпарить', shape: 'blob' },
    geyser: { name: 'Гейзеры', faction: 'forge', tier: 5, atk: 16, def: 13, dmg: [15, 21], hp: 88, speed: 8, init: 12, growth: 3, cost: 1060, rare: { sulfur: 1 }, fly: true, spirit: true, sap: 15, sapName: 'Ошпарить', arc: { n: 6, share: 0.5 }, arcName: 'Кипяток', shape: 'blob' },
    overheated: { name: 'Перегретые', faction: 'forge', tier: 5, atk: 17, def: 12, dmg: [16, 21], hp: 86, speed: 8, init: 12, growth: 3, cost: 1060, rare: { sulfur: 1 }, fly: true, spirit: true, sap: 15, sapName: 'Ошпарить', burst: 3, shape: 'blob' },
    slaggiant: { name: 'Шлаковые великаны', faction: 'forge', tier: 6, atk: 20, def: 18, dmg: [26, 34], hp: 150, speed: 6, init: 9, growth: 2, cost: 1500, rare: { sulfur: 2 }, big: true, shape: 'heavy' },
    obsidiangiant: { name: 'Обсидиановые великаны', faction: 'forge', tier: 6, atk: 21, def: 21, dmg: [26, 34], hp: 160, speed: 6, init: 9, growth: 2, cost: 2000, rare: { sulfur: 2 }, big: true, thorns: 0.2, thornsName: 'Обсидиан', shape: 'heavy' },
    slagthrower: { name: 'Метатели шлака', faction: 'forge', tier: 6, atk: 20, def: 18, dmg: [24, 32], hp: 125, speed: 6, init: 9, growth: 2, cost: 2000, rare: { sulfur: 2 }, big: true, shots: 3, shape: 'heavy' },
    volcano: { name: 'Ходячий вулкан', faction: 'forge', tier: 7, atk: 26, def: 24, dmg: [40, 56], hp: 270, speed: 6, init: 10, growth: 1, cost: 3800, rare: { sulfur: 3 }, big: true, arc: { n: 6, share: 0.5 }, arcName: 'Удар вулкана', shots: 2, fullHand: true, shape: 'idol' },
    firemountain: { name: 'Огнедышащая гора', faction: 'forge', tier: 7, atk: 28, def: 25, dmg: [40, 56], hp: 290, speed: 6, init: 10, growth: 1, cost: 5000, rare: { sulfur: 3 }, big: true, arc: { n: 6, share: 0.5 }, arcName: 'Удар вулкана', shots: 4, fullHand: true, shape: 'idol' },
    sleepingvolcano: { name: 'Спящий вулкан', faction: 'forge', tier: 7, atk: 28, def: 26, dmg: [40, 58], hp: 290, speed: 6, init: 10, growth: 1, cost: 5000, rare: { sulfur: 3 }, big: true, arc: { n: 6, share: 0.5 }, arcName: 'Удар вулкана', shots: 2, fullHand: true, restHit: 1, shape: 'idol' },
    legionary: { name: 'Призрачные легионеры', faction: 'throne', tier: 1, atk: 4, def: 5, dmg: [1, 2], hp: 8, speed: 5, init: 10, growth: 14, cost: 41, spirit: true, shield: { self: 0.5, near: 0 }, shieldName: 'Призрачные щиты', shape: 'spirit' },
    standardbearer: { name: 'Знаменосцы', faction: 'throne', tier: 1, atk: 6, def: 6, dmg: [1, 2], hp: 9, speed: 5, init: 10, growth: 14, cost: 55, spirit: true, shield: { self: 0.5, near: 0 }, shieldName: 'Призрачные щиты', aura: { side: 'own', morale: 1 }, auraName: 'Знамя', shape: 'spirit' },
    mirrorlegion: { name: 'Зерцальные легионеры', faction: 'throne', tier: 1, atk: 4, def: 6, dmg: [1, 2], hp: 9, speed: 5, init: 10, growth: 14, cost: 55, spirit: true, shield: { self: 0.5, near: 0 }, shieldName: 'Призрачные щиты', thorns: 0.15, thornsName: 'Зерцало', shape: 'spirit' },
    moonarcher: { name: 'Лунные лучницы', faction: 'throne', tier: 2, atk: 6, def: 3, dmg: [2, 4], hp: 12, speed: 5, init: 11, growth: 9, cost: 103, shots: 10, trueSight: true, shape: 'shooter' },
    silverarcher: { name: 'Серебряные лучницы', faction: 'throne', tier: 2, atk: 6, def: 4, dmg: [2, 4], hp: 13, speed: 5, init: 11, growth: 9, cost: 138, shots: 10, trueSight: true, twiceShot: true, shape: 'shooter' },
    moonhunter: { name: 'Ловчие луны', faction: 'throne', tier: 2, atk: 7, def: 3, dmg: [2, 4], hp: 13, speed: 5, init: 11, growth: 9, cost: 138, shots: 10, trueSight: true, shotSap: 10, shape: 'shooter' },
    mirrorguard: { name: 'Зеркальные стражи', faction: 'throne', tier: 3, atk: 7, def: 10, dmg: [4, 7], hp: 35, speed: 5, init: 10, growth: 6, cost: 189, mech: true, spellIn: 0.5, shape: 'heavy' },
    prismguard: { name: 'Призматические стражи', faction: 'throne', tier: 3, atk: 9, def: 11, dmg: [4, 7], hp: 36, speed: 5, init: 10, growth: 6, cost: 253, mech: true, spellIn: 0.5, retalTwo: true, shape: 'heavy' },
    mirrorswap: { name: 'Стражи-зеркала', faction: 'throne', tier: 3, atk: 8, def: 12, dmg: [4, 7], hp: 36, speed: 5, init: 10, growth: 6, cost: 253, mech: true, spellIn: 0.5, swapOnce: true, shape: 'heavy' },
    moonmaiden: { name: 'Лунные девы', faction: 'throne', tier: 4, atk: 11, def: 11, dmg: [9, 13], hp: 52, speed: 5, init: 10, growth: 4, cost: 410, shots: 4, mend: { uses: 3, share: 0.15 }, shape: 'foot' },
    whitemaiden: { name: 'Девы Белой луны', faction: 'throne', tier: 4, atk: 12, def: 11, dmg: [9, 13], hp: 56, speed: 5, init: 10, growth: 4, cost: 550, shots: 4, mend: { uses: 3, share: 0.15 }, revive: 20, shape: 'foot' },
    silvermaiden: { name: 'Девы Серебряной луны', faction: 'throne', tier: 4, atk: 13, def: 12, dmg: [9, 13], hp: 58, speed: 5, init: 10, growth: 4, cost: 550, shots: 4, mend: { uses: 3, share: 0.15 }, spellOnce: 'blind', shape: 'foot' },
    deerrider: { name: 'Всадники на лунных оленях', faction: 'throne', tier: 5, atk: 14, def: 12, dmg: [14, 21], hp: 80, speed: 8, init: 12, growth: 3, cost: 780, rare: { moonsilver: 1 }, leap: true, shape: 'rider' },
    silverrider: { name: 'Серебряные всадники', faction: 'throne', tier: 5, atk: 16, def: 13, dmg: [14, 21], hp: 92, speed: 8, init: 12, growth: 3, cost: 1045, rare: { moonsilver: 1 }, leap: true, charge: 0.04, shape: 'rider' },
    deerhunter: { name: 'Олени-ловчие', faction: 'throne', tier: 5, atk: 13, def: 12, dmg: [14, 21], hp: 72, speed: 8, init: 12, growth: 3, cost: 1045, rare: { moonsilver: 1 }, leap: true, shots: 2, shape: 'rider' },
    throneknight: { name: 'Рыцари Престола', faction: 'throne', tier: 6, atk: 21, def: 20, dmg: [25, 34], hp: 160, speed: 7, init: 10, growth: 2, cost: 1600, rare: { moonsilver: 2 }, big: true, oath: true, shape: 'heavy' },
    oathkeeper: { name: 'Хранители клятвы', faction: 'throne', tier: 6, atk: 21, def: 23, dmg: [25, 34], hp: 180, speed: 7, init: 10, growth: 2, cost: 2150, rare: { moonsilver: 2 }, big: true, oath: true, cover: 0.5, shape: 'heavy' },
    punisher: { name: 'Каратели', faction: 'throne', tier: 6, atk: 23, def: 20, dmg: [26, 36], hp: 165, speed: 7, init: 10, growth: 2, cost: 2150, rare: { moonsilver: 2 }, big: true, oath: true, punish: 0.2, shape: 'heavy' },
    shard: { name: 'Живой осколок', faction: 'throne', tier: 7, atk: 26, def: 26, dmg: [40, 56], hp: 280, speed: 7, init: 11, growth: 1, cost: 3400, rare: { moonsilver: 4 }, big: true, mech: true, fly: true, shots: 4, line: { cells: 4, share: 1, max: 2 }, lineName: 'Лунный луч', moonproof: true, shape: 'idol' },
    radiantshard: { name: 'Сияющий осколок', faction: 'throne', tier: 7, atk: 27, def: 27, dmg: [40, 58], hp: 300, speed: 7, init: 11, growth: 1, cost: 4560, rare: { moonsilver: 4 }, big: true, mech: true, fly: true, shots: 4, line: { cells: 4, share: 1, max: 2 }, lineName: 'Лунный луч', moonproof: true, glow: 0.25, shape: 'idol' },
    darkshard: { name: 'Тёмный осколок', faction: 'throne', tier: 7, atk: 28, def: 26, dmg: [42, 58], hp: 295, speed: 7, init: 11, growth: 1, cost: 4560, rare: { moonsilver: 4 }, big: true, mech: true, fly: true, shots: 4, line: { cells: 4, share: 1, max: 2 }, lineName: 'Лунный луч', moonproof: true, blastReady: 25, blastName: 'Тёмный луч', shape: 'idol' },
    bees: { name: 'Дикие пчёлы', faction: 'neutral', tier: 1, atk: 3, def: 1, dmg: [1, 2], hp: 4, speed: 6, init: 12, growth: 18, cost: 30, fly: true, elusive: true, shape: 'blob' },
    bandits: { name: 'Разбойники', faction: 'neutral', tier: 1, atk: 3, def: 2, dmg: [1, 3], hp: 7, speed: 5, init: 11, growth: 16, cost: 36, ambush: 20, shape: 'foot' },
    wolves: { name: 'Волки', faction: 'neutral', tier: 2, atk: 6, def: 3, dmg: [3, 5], hp: 14, speed: 6, init: 11, growth: 9, cost: 90, pack: 0.1, shape: 'beast' },
    boars: { name: 'Вепри', faction: 'neutral', tier: 2, atk: 5, def: 5, dmg: [3, 5], hp: 16, speed: 5, init: 9, growth: 9, cost: 85, firstHit: 0.25, shape: 'beast' },
    mercenaries: { name: 'Наёмники', faction: 'neutral', tier: 2, atk: 6, def: 5, dmg: [3, 4], hp: 15, speed: 5, init: 10, growth: 10, cost: 85, hireAfter: 0.2, shape: 'foot' },
    bears: { name: 'Медведи', faction: 'neutral', tier: 3, atk: 8, def: 7, dmg: [5, 8], hp: 34, speed: 5, init: 9, growth: 7, cost: 175, grip: true, shape: 'beast' },
    mountaineagles: { name: 'Горные орлы', faction: 'neutral', tier: 3, atk: 9, def: 5, dmg: [5, 8], hp: 24, speed: 7, init: 12, growth: 7, cost: 190, fly: true, dive: { from: 4, bonus: 0.25 }, shape: 'bird' },
    scorpions: { name: 'Солончаковые скорпионы', faction: 'neutral', tier: 3, atk: 7, def: 9, dmg: [4, 7], hp: 28, speed: 5, init: 10, growth: 7, cost: 170, venom: { share: 0.25, rounds: 3 }, shape: 'beast' },
    pirates: { name: 'Пираты', faction: 'neutral', tier: 3, atk: 9, def: 6, dmg: [5, 8], hp: 26, speed: 5, init: 11, growth: 7, cost: 165, deckBonus: 0.25, shape: 'foot' },
    bountyhunters: { name: 'Охотники за головами', faction: 'neutral', tier: 4, atk: 12, def: 9, dmg: [8, 12], hp: 44, speed: 5, init: 10, growth: 5, cost: 420, shots: 8, mark: 0.2, shape: 'shooter' },
    hermits: { name: 'Отшельники', faction: 'neutral', tier: 4, atk: 10, def: 10, dmg: [8, 11], hp: 46, speed: 5, init: 10, growth: 5, cost: 400, shots: 4, charm: 2, shape: 'foot' },
    whitespirit: { name: 'Белый дух', faction: 'neutral', tier: 4, atk: 11, def: 11, dmg: [8, 12], hp: 48, speed: 6, init: 11, growth: 5, cost: 410, fly: true, spirit: true, healNear: 0.1, shape: 'spirit' },
    redspirit: { name: 'Алый дух', faction: 'neutral', tier: 4, atk: 13, def: 9, dmg: [9, 13], hp: 46, speed: 6, init: 11, growth: 5, cost: 400, fly: true, spirit: true, thorns: 0.2, shape: 'spirit' },
    azurespirit: { name: 'Лазурный дух', faction: 'neutral', tier: 4, atk: 11, def: 11, dmg: [8, 12], hp: 50, speed: 6, init: 11, growth: 5, cost: 400, fly: true, spirit: true, slow: { pct: 0.2, rounds: 2 }, shape: 'spirit' },
    greenspirit: { name: 'Зелёный дух', faction: 'neutral', tier: 4, atk: 10, def: 12, dmg: [8, 11], hp: 54, speed: 6, init: 10, growth: 5, cost: 400, fly: true, spirit: true, regen: 0.1, shape: 'spirit' },
    silverspirit: { name: 'Серебряный дух', faction: 'neutral', tier: 5, atk: 15, def: 13, dmg: [15, 20], hp: 80, speed: 7, init: 12, growth: 3, cost: 800, rare: { moonsilver: 1 }, fly: true, spirit: true, blink: 0.25, shape: 'spirit' },
    goldspirit: { name: 'Золотой дух', faction: 'neutral', tier: 5, atk: 14, def: 14, dmg: [14, 20], hp: 88, speed: 7, init: 12, growth: 3, cost: 800, rare: { amber: 1 }, fly: true, spirit: true, rally: 20, shape: 'spirit' },
    blackspirit: { name: 'Чёрный дух', faction: 'neutral', tier: 5, atk: 16, def: 12, dmg: [16, 22], hp: 78, speed: 7, init: 11, growth: 3, cost: 820, rare: { sulfur: 1 }, fly: true, spirit: true, drain: 0.3, shape: 'spirit' },
    seaserpent: { name: 'Морской змей', faction: 'neutral', tier: 5, atk: 16, def: 13, dmg: [16, 24], hp: 100, speed: 6, init: 10, growth: 3, cost: 850, rare: { salt: 1 }, big: true, coil: true, shape: 'serpent' },
    bridgetroll: { name: 'Мостовые тролли', faction: 'neutral', tier: 5, atk: 15, def: 15, dmg: [15, 22], hp: 105, speed: 5, init: 9, growth: 3, cost: 800, rare: { ore: 1 }, big: true, regen: 0.2, shape: 'heavy' },
    stonegiant: { name: 'Каменные великаны', faction: 'neutral', tier: 6, atk: 21, def: 19, dmg: [25, 36], hp: 170, speed: 6, init: 9, growth: 2, cost: 1500, rare: { ore: 2 }, big: true, shots: 4, shape: 'heavy' },
    moondream: { name: 'Сны Восьмой луны', faction: 'neutral', tier: 6, atk: 20, def: 16, dmg: [24, 34], hp: 130, speed: 8, init: 13, growth: 2, cost: 1450, rare: { moonsilver: 2 }, fly: true, spellproof: true, sap: 20, shape: 'spirit' },
    ancientlizard: { name: 'Древний ящер', faction: 'neutral', tier: 7, atk: 28, def: 24, dmg: [50, 70], hp: 320, speed: 9, init: 11, growth: 1, cost: 3900, rare: { moonsilver: 4 }, big: true, fly: true, flame: { cells: 3, share: 0.5 }, shape: 'serpent' },
    forestgiant: { name: 'Лесной великан', faction: 'summon', tier: 6, atk: 20, def: 18, dmg: [30, 40], hp: 180, speed: 6, init: 9, growth: 2, cost: 1500, big: true, shape: 'heavy' },
    woodtree: { name: 'Пробуждённое древо', faction: 'summon', tier: 4, atk: 10, def: 12, dmg: [8, 12], hp: 60, speed: 3, init: 8, growth: 0, cost: 300, shape: 'heavy' },
    moonking: { name: 'Лунный царь', faction: 'summon', tier: 7, atk: 30, def: 30, dmg: [50, 70], hp: 350, speed: 7, init: 12, growth: 0, cost: 4000, big: true, fly: true, oath: true, shape: 'idol' }
  };

  Object.assign(H.UNITS, {
    ballista: { name: 'Стреломёт', faction: 'machine', tier: 4, atk: 8, def: 6, dmg: [10, 18], hp: 180, speed: 0, init: 10, growth: 0, cost: 1500, shots: 1, machine: 'ballista', mech: true, shape: 'engine' },
    tent: { name: 'Лекарский шатёр', faction: 'machine', tier: 4, atk: 0, def: 2, dmg: [0, 0], hp: 120, speed: 0, init: 10, growth: 0, cost: 1000, machine: 'tent', mech: true, shape: 'engine' },
    wagon: { name: 'Повозка с припасами', faction: 'machine', tier: 4, atk: 0, def: 2, dmg: [0, 0], hp: 140, speed: 0, init: 1, growth: 0, cost: 800, machine: 'wagon', mech: true, passive: true, shape: 'engine' },
    catapult: { name: 'Катапульта', faction: 'machine', tier: 4, atk: 0, def: 0, dmg: [0, 0], hp: 1, speed: 0, init: 10, growth: 0, cost: 0, machine: 'catapult', mech: true, fixed: true, shape: 'engine' }
  });
  H.MACHINES = {
    ballista: { unit: 'ballista', about: 'Стреляет каждый раунд, сила растёт с уровнем героя' },
    tent: { unit: 'tent', about: 'Каждый раунд лечит верхнее существо своего отряда' },
    wagon: { unit: 'wagon', about: 'Пока цела, стрелки героя не тратят выстрелы' }
  };

  H.unitTraits = u => {
    const out = [];
    if (u.big) out.push(['Большой', 'занимает две клетки']);
    if (u.fly) out.push(['Летает', 'ход над отрядами и препятствиями']);
    if (u.shots) out.push(['Стреляет', u.shots + ' ' + H.plural(u.shots, 'выстрел', 'выстрела', 'выстрелов') + ' за бой']);
    if (u.spirit) out.push(['Дух', 'не берёт яд']);
    if (u.stone) out.push(['Камень', 'не берёт яд и Глубь']);
    if (u.pierce) out.push(['Тугой арбалет', 'не замечает ' + Math.round(u.pierce * 100) + ' % Стойкости цели']);
    if (u.bell) out.push(['Звон', 'бьёт цель в ' + u.bell.range + ' клетках без ответа, цель −' + u.bell.ready + ' готовности; не рядом с врагом']);
    if (u.aura && u.aura.side === 'own') out.push([u.auraName || 'Колокол', 'соседним своим +' + u.aura.morale + ' мораль']);
    if (u.machine) out.push(['Машина', u.fixed ? 'рушит стены, по ней не бьют' : u.passive ? 'не ходит, работает, пока цела' : 'не ходит, не отвечает на удар']);
    if (u.elusive) out.push(['Неуловимые', 'цель не отвечает']);
    if (u.ambush) out.push(['Засада', 'в начале боя +' + u.ambush + ' готовности']);
    if (u.pack) out.push(['Стая', '+' + Math.round(u.pack * 100) + ' % урона за каждый свой отряд рядом с целью']);
    if (u.firstHit) out.push(['Первый удар', 'первый удар в бою +' + Math.round(u.firstHit * 100) + ' %']);
    if (u.hireAfter) out.push(['Наёмники', 'после проигранного боя могут наняться к победителю']);
    if (u.grip) out.push([u.gripName || 'Объятие', 'цель не уходит 1 ход']);
    if (u.venom) out.push(['Яд', Math.round(u.venom.share * 100) + ' % урона удара ещё ' + u.venom.rounds + ' раунда']);
    if (u.deckBonus) out.push(['Абордаж', '+' + Math.round(u.deckBonus * 100) + ' % урона в бою на воде']);
    if (u.mark) out.push(['Метка', 'свои бьют цель с +' + Math.round(u.mark * 100) + ' % до конца раунда']);
    if (u.charm) out.push(['Чары', 'раз за бой случайное заклинание ' + u.charm + ' круга']);
    if (u.healNear) out.push(['Лечит', 'в начале раунда лечит соседних своих']);
    if (u.thorns) out.push([u.thornsName || 'Огненная кожа', Math.round(u.thorns * 100) + ' % урона вплотную возвращается бьющему' + (u.thornsName ? '' : ' огнём')]);
    if (u.fireproof) out.push(['Огнеупорные', 'огонь им не страшен']);
    if (u.ember) out.push(['Искры', 'удар поджигает цель: ещё ' + Math.round(u.ember.share * 100) + ' % урона огнём в начале её хода']);
    if (u.web) out.push(['Стеклянная паутина', 'удар: цель −' + Math.round(u.web.pct * 100) + ' % инициативы на ' + u.web.rounds + ' раунда']);
    if (u.twice) out.push(['Два клинка', 'бьют дважды']);
    if (u.temper) out.push(['Закалить', 'вместо выстрела: свой отряд +' + u.temper + ' Стойкости до конца боя']);
    if (u.burst) out.push(['Разрыв', 'гибнут со взрывом, все соседи получают ' + u.burst + '-кратный урон']);
    if (u.restHit) out.push(['Спит вполглаза', 'после «Обороны» следующий удар вдвое сильнее']);
    if (u.slow) out.push(['Стужа', 'удар −' + Math.round(u.slow.pct * 100) + ' % инициативы на ' + u.slow.rounds + ' раунда']);
    if (u.regen) out.push(['Восстановление', Math.round(u.regen * 100) + ' % здоровья в начале раунда']);
    if (u.blink) out.push(['Мерцание', Math.round(u.blink * 100) + ' % ударов без урона']);
    if (u.rally) out.push(['Сияние', 'соседним своим +' + u.rally + ' готовности в начале раунда']);
    if (u.drain) out.push(['Пьёт', 'лечится на ' + Math.round(u.drain * 100) + ' % нанесённого урона']);
    if (u.coil) out.push(['Обвить', 'цель не ходит 1 ход']);
    if (u.spellproof) out.push(['Сон луны', 'заклинания не действуют']);
    if (u.sap) out.push([u.sapName || 'Морок', 'удар снимает ' + u.sap + ' готовности']);
    if (u.flame) out.push(['Пламя', u.flame.cells + ' клетки за целью по ' + Math.round(u.flame.share * 100) + ' % урона']);
    if (u.lob) out.push(['Навесной выстрел', 'стены не мешают']);
    if (u.aura && u.aura.side === 'enemy') out.push([u.aura.range ? 'Песнь бездны' : 'Немой взгляд', (u.aura.range ? 'врагам в ' + u.aura.range + ' клетках ' : 'соседним врагам ') + u.aura.morale + ' мораль']);
    if (u.chill) out.push(['Холод могилы', 'цель −' + u.chill.atk + ' Натиск, до −' + u.chill.max]);
    if (u.saddle) out.push([u.saddleSteps ? 'Перебежка' : 'С седла', (u.saddleSteps ? 'до ' + u.saddleSteps + ' клеток и выстрел' : 'идут и стреляют') + (u.saddle >= 1 ? ' без штрафа' : ' с −' + Math.round((1 - u.saddle) * 100) + ' %')]);
    if (u.chillNear) out.push(['Плач по соседям', 'при ударе соседи цели тоже теряют Натиск']);
    if (u.lastStand) out.push(['Стоят насмерть', 'раз за бой переживают смертельный удар с одним существом']);
    if (u.drag) out.push([u.drag.name || 'Аркан', u.drag.uses + ' раза за бой тянут цель на ' + u.drag.cells + ' клетки к себе' + (u.drag.ready ? ', −' + u.drag.ready + ' готовности' : '') + '; до ' + u.drag.range + ' клеток']);
    if (u.guardNear) out.push(['Страж рода', 'соседним своим +' + u.guardNear + ' Стойкости']);
    if (u.spellOnce) out.push([H.SPELLS[u.spellOnce].name, 'раз за бой: ' + H.SPELLS[u.spellOnce].about]);
    if (u.raid) out.push(['Налёт', 'удар и возврат на свою клетку']);
    if (u.soulTake) out.push(['Ловцы душ', Math.round(u.soulTake * 100) + ' % здоровья убитых уходит тенями в курган']);
    if (u.curseHit) out.push(['Проклятие кургана', 'цель не лечится ' + u.curseHit + ' раунда']);
    if (u.atkNear) out.push(['Тысяча', 'соседним своим +' + u.atkNear + ' Натиск']);
    if (u.rallyMove) out.push(['За мной', 'когда ходят, соседи +' + u.rallyMove + ' готовности']);
    if (u.ram) out.push([u.ramName || 'Таран', 'толкают цель на клетку']);
    if (u.trample) out.push(['Топот', 'бьют и того, кто стоит за целью, ' + Math.round(u.trample.share * 100) + ' %']);
    if (u.vsLow) out.push(['Давят мелких', '+' + Math.round(u.vsLow.bonus * 100) + ' % урона по существам 1–' + u.vsLow.tiers + ' уровней']);
    if (u.kinCall) out.push(['Зов рода', 'раз за бой возвращают ' + Math.round(u.kinCall * 100) + ' % павших в другой свой отряд']);
    if (u.fearless) out.push(['Хан-курган', 'мораль своих не падает ниже нуля']);
    if (u.blastReady) out.push([u.blastName || 'Буран', 'задетые теряют ' + u.blastReady + ' готовности']);
    if (u.brace) out.push(['Упор', 'отвечают раньше удара, если враг шёл к ним ' + u.brace + ' клетки и больше']);
    if (u.noBrace) out.push(['Напролом', 'Упор на них не действует']);
    if (u.shield) out.push([u.shieldName || 'Щиты', '−' + Math.round(u.shield.self * 100) + ' % урона от стрел, соседний свой −' + Math.round(u.shield.near * 100) + ' %']);
    if (u.steady) out.push(['С упора', '+' + u.steady + ' Стойкости, если в этот ход не шли']);
    if (u.alarm) out.push(['Набат', 'раз за бой все свои +' + u.alarm + ' готовности']);
    if (u.soothe) out.push(['Благовест', 'в начале своего хода лечат соседних своих и снимают страх']);
    if (u.pole) out.push(['Через клетку', 'бьют цель на расстоянии 2, ответа нет']);
    if (u.formationOwn) out.push(['Гвардейский строй', 'их удар Строя ' + Math.round(u.formationOwn * 100) + ' %']);
    if (u.guardStand) out.push(['Глухая оборона', '«Оборона» даёт +' + Math.round(u.guardStand * 100) + ' %']);
    if (u.splash) out.push(['Разрыв', 'соседи цели получают ' + Math.round(u.splash * 100) + ' % урона']);
    if (u.spotter) out.push(['Дозор', 'свои стрелки теряют за дальность вдвое меньше']);
    if (u.scout) out.push(['Сверху видно', 'на карте герою +' + u.scout + ' обзора']);
    if (u.charge) out.push(['Разгон', '+' + Math.round(u.charge * 100) + ' % урона за клетку пути']);
    if (u.volley) out.push(['Залп', 'раз за бой выстрел на ' + u.volley.range + ' клетки; не рядом с врагом']);
    if (u.aimed) out.push(['Прямая наводка', 'без штрафа дальности']);
    if (u.line) out.push([u.lineName || 'Насквозь', u.line.max ? 'бьёт ещё до ' + u.line.max + ' отрядов в ' + u.line.cells + ' клетках за целью' : u.line.cells + ' клетки за целью по ' + Math.round(u.line.share * 100) + ' % урона']);
    if (u.dive) out.push(['Пикирование', '+' + Math.round(u.dive.bonus * 100) + ' % урона, если взлетели за ' + u.dive.from + ' клетки и дальше']);
    if (u.closeShot) out.push(['Огоньки', 'стреляют и вплотную к врагу']);
    if (u.fullHand) out.push(['Команда на башне', 'в ближнем бою бьют без штрафа стрелка']);
    if (u.twiceStill) out.push(['Матёрые', 'бьют дважды, если в этот ход не шли']);
    if (u.howl) out.push(['Вой', 'уничтожив отряд, дают своим +' + u.howl + ' мораль на 2 раунда']);
    if (u.ward) out.push(['Оберег', u.ward.uses + ' раза за бой: свой отряд получает на ' + Math.round(u.ward.share * 100) + ' % меньше урона ' + u.ward.rounds + ' раунда' + (u.ward.cleanse ? ', проклятия снимаются' : '')]);
    if (u.mud) out.push([u.mudName || 'Тина', 'выстрел: цель −' + Math.round(u.mud.pct * 100) + ' % инициативы на ' + u.mud.rounds + ' раунда']);
    if (u.mudVenom) out.push(['Болотный яд', 'выстрел: ещё ' + Math.round(u.mudVenom.share * 100) + ' % урона ' + u.mudVenom.rounds + ' раунда']);
    if (u.snare) out.push(['Путы', 'выстрел: цель не сходит с места 1 ход, не чаще раза в 2 раунда']);
    if (u.song) out.push(['Песнь', 'удар: враги рядом с целью −' + u.song + ' готовности']);
    if (u.joy) out.push(['Радостная песнь', 'в начале своего хода свои в ' + u.joy.range + ' клетках лечатся и получают +' + u.joy.morale + ' мораль']);
    if (u.cry) out.push(['Вещий крик', u.cry.uses + ' раза за бой: другой свой отряд +' + u.cry.ready + ' готовности']);
    if (u.brushGuard) out.push(['Сторож', '+' + u.brushGuard + ' Стойкости за каждое препятствие рядом']);
    if (u.plantOnce) out.push(['Поставить заросль', 'раз за бой ставят заросль в 2 клетках от себя']);
    if (u.sweep) out.push([u.sweep.name || 'Три головы', u.sweep.count >= 6 ? 'бьют всех соседних врагов, остальных по ' + Math.round(u.sweep.share * 100) + ' %' : 'бьют ещё до ' + (u.sweep.count - 1) + ' соседних врагов по ' + Math.round(u.sweep.share * 100) + ' %']);
    if (u.burn) out.push(['Горит трава', 'клетки под пламенем жгут всех ' + u.burn.rounds + ' раунда']);
    if (u.harpoon) out.push(['Гарпун', 'выстрел тянет цель на ' + u.harpoon + ' клетку к себе']);
    if (u.vsBig) out.push(['На большого зверя', '+' + Math.round(u.vsBig * 100) + ' % урона по большим']);
    if (u.net) out.push(['Сеть', 'выстрел: цель не ходит 1 ход, не чаще раза в 2 раунда']);
    if (u.dimNear) out.push(['Огни глубин', 'соседние враги −' + Math.round(u.dimNear * 100) + ' % урона']);
    if (u.retalVenom) out.push(['Жгучие нити', 'ответный удар отравляет']);
    if (u.fog) out.push(['Туман', 'раз за бой: свои в ' + u.fog.range + ' клетках получают на ' + Math.round(u.fog.share * 100) + ' % меньше урона от стрел ' + u.fog.rounds + ' раунда']);
    if (u.brineShot) out.push([u.brineName || 'Солёный выстрел', 'цель −' + u.brineShot.n + ' Стойкости, до −' + u.brineShot.max]);
    if (u.arc) out.push([u.arcName || 'Разряд', 'урон перескакивает на ' + u.arc.n + ' ' + H.plural(u.arc.n, 'соседа', 'соседей', 'соседей') + ' цели, ' + Math.round(u.arc.share * 100) + ' %']);
    if (u.veil) out.push(['Ночной полёт', 'по ним не стреляют, пока рядом с ними нет врага']);
    if (u.beacon) out.push(['Маяк', 'свои в ' + u.beacon.range + ' клетках +' + u.beacon.luck + ' удача, в начале раунда лечат соседа']);
    if (u.deep) out.push(['Уйти в глубь', 'раз за бой всплывают в любой свободной клетке, в этот раунд по ним не стреляют']);
    if (u.pullNear) out.push(['Притянуть', 'перед ударом тянут врагов в 2 клетках к себе']);
    if (u.mech && !u.machine) out.push(['Механизм', 'яд, Тлень и чары морали на них не действуют']);
    if (u.spellIn) out.push(['Зеркальная грань', 'получают на ' + Math.round(u.spellIn * 100) + ' % меньше урона от заклинаний']);
    if (u.trueSight) out.push(['Лунный глаз', 'видят невидимых и стреляют по ним']);
    if (u.twiceShot) out.push(['Два колчана', 'стреляют дважды']);
    if (u.shotSap) out.push(['Лунная стрела', 'выстрел снимает ' + u.shotSap + ' готовности']);
    if (u.retalTwo) out.push(['Грани', 'ответный удар бьёт ещё одного врага рядом']);
    if (u.swapOnce) out.push(['Зеркальный шаг', 'раз за бой меняются местами со своим отрядом']);
    if (u.mend) out.push(['Лунный свет', u.mend.uses + ' раза за бой лечат свой отряд на ' + Math.round(u.mend.share * 100) + ' % здоровья дев']);
    if (u.revive) out.push(['Белый свет', 'раз за бой поднимают павших своего отряда: ' + u.revive + ' здоровья за каждую деву']);
    if (u.leap) out.push(['Прыжок', 'перепрыгивают препятствия']);
    if (u.oath) out.push(['Клятва', 'не знают страха, Морок на них не действует']);
    if (u.cover) out.push(['Хранители', 'берут на себя ' + Math.round(u.cover * 100) + ' % урона по соседнему своему']);
    if (u.punish) out.push(['Кара', '+' + Math.round(u.punish * 100) + ' % урона по отрядам под заклинанием']);
    if (u.moonproof) out.push(['Осколок луны', 'Ясна и Морок на него не действуют']);
    if (u.glow) out.push(['Сияние луча', 'луч лечит своих на линии']);
    const f = H.FACTIONS && H.FACTIONS[u.faction];
    if (f && f.formation) out.push(['Строй', 'отряды Лиги рядом с целью бьют нападающего на ' + Math.round(f.formation * 100) + ' %']);
    if (f && f.lament) out.push(['Плач', 'гибель своего отряда даёт Курганам +' + f.lament.atk + ' Натиск, до +' + f.lament.max]);
    if (f && f.brush) out.push(['Заросли', 'ходят сквозь препятствия, но не встают на них']);
    if (f && f.heat) out.push(['Жар', 'каждое действие +1 Жар, до ' + H.HERO.forge.cap + '; очко Жара +' + Math.round(H.HERO.forge.per * 100) + ' % урона; с ' + H.HERO.forge.cap + ' очками отряд перегрет и теряет ' + Math.round(H.HERO.forge.burn * 100) + ' % здоровья в начале хода; «Оборона» остужает и лечит ' + Math.round(H.HERO.forge.cool * 100) + ' %']);
    if (f && f.mirror) out.push(['Отражения', 'в начале боя герой Престола ставит рядом с отрядом до ' + H.HERO.throne.tier + ' уровня его отражение: ' + Math.round(H.HERO.throne.share * 100) + ' % существ, гибнет от любого удара, держится ' + H.HERO.throne.rounds + ' раунда']);
    if (f && f.tide) out.push(['Прилив и отлив', 'нечётные раунды +' + Math.round(f.tide.up * 100) + ' % урона, чётные +' + Math.round(f.tide.def * 100) + ' % Стойкости']);
    return out;
  };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
