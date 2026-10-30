(function (H) {
  'use strict';
  H.UNITS = {
    militia: { name: 'Ополченцы', faction: 'league', tier: 1, atk: 2, def: 2, dmg: [1, 2], hp: 6, speed: 4, init: 10, growth: 18, cost: 29, shape: 'foot' },
    pikeman: { name: 'Пикинёры', faction: 'league', tier: 1, atk: 3, def: 2, dmg: [1, 2], hp: 7, speed: 4, init: 10, growth: 18, cost: 39, shape: 'foot' },
    shieldbearer: { name: 'Щитоносцы', faction: 'league', tier: 1, atk: 1, def: 4, dmg: [1, 2], hp: 7, speed: 4, init: 10, growth: 18, cost: 39, shape: 'foot' },
    crossbow: { name: 'Арбалетчики', faction: 'league', tier: 2, atk: 5, def: 4, dmg: [2, 4], hp: 10, speed: 4, init: 9, growth: 10, cost: 80, shots: 10, pierce: 0.3, shape: 'shooter' },
    heavycrossbow: { name: 'Тяжёлые арбалетчики', faction: 'league', tier: 2, atk: 6, def: 5, dmg: [2, 4], hp: 11, speed: 4, init: 9, growth: 10, cost: 108, shots: 10, pierce: 0.5, shape: 'shooter' },
    skirmisher: { name: 'Застрельщики', faction: 'league', tier: 2, atk: 6, def: 4, dmg: [2, 4], hp: 11, speed: 5, init: 10, growth: 10, cost: 108, shots: 10, pierce: 0.3, shape: 'shooter' },
    ringer: { name: 'Звонари', faction: 'league', tier: 3, atk: 7, def: 7, dmg: [4, 6], hp: 24, speed: 5, init: 10, growth: 7, cost: 150, bell: { range: 3, ready: 10, mul: 0.6 }, aura: { side: 'own', morale: 1 }, shape: 'foot' },
    alarmist: { name: 'Набатчики', faction: 'league', tier: 3, atk: 8, def: 8, dmg: [4, 6], hp: 26, speed: 5, init: 10, growth: 7, cost: 205, bell: { range: 3, ready: 10, mul: 0.6 }, aura: { side: 'own', morale: 1 }, shape: 'foot' },
    herald: { name: 'Благовестники', faction: 'league', tier: 3, atk: 7, def: 9, dmg: [4, 6], hp: 27, speed: 5, init: 11, growth: 7, cost: 205, bell: { range: 3, ready: 10, mul: 0.6 }, aura: { side: 'own', morale: 1 }, shape: 'foot' },
    plated: { name: 'Латники', faction: 'league', tier: 4, atk: 11, def: 14, dmg: [8, 12], hp: 55, speed: 5, init: 9, growth: 4, cost: 380, shape: 'heavy' },
    halberdier: { name: 'Алебардисты', faction: 'league', tier: 4, atk: 13, def: 14, dmg: [9, 13], hp: 56, speed: 5, init: 9, growth: 4, cost: 510, shape: 'heavy' },
    cityguard: { name: 'Гвардия ратуши', faction: 'league', tier: 4, atk: 11, def: 16, dmg: [8, 12], hp: 60, speed: 5, init: 9, growth: 4, cost: 510, shape: 'heavy' },
    aeronaut: { name: 'Аэронавты', faction: 'league', tier: 5, atk: 14, def: 9, dmg: [14, 20], hp: 78, speed: 7, init: 12, growth: 3, cost: 760, rare: { sulfur: 1 }, fly: true, shots: 6, shape: 'engine' },
    bomber: { name: 'Бомбардиры', faction: 'league', tier: 5, atk: 16, def: 9, dmg: [15, 21], hp: 80, speed: 7, init: 12, growth: 3, cost: 1030, rare: { sulfur: 1 }, fly: true, shots: 6, shape: 'engine' },
    spotter: { name: 'Дозорные', faction: 'league', tier: 5, atk: 15, def: 10, dmg: [14, 20], hp: 82, speed: 8, init: 13, growth: 3, cost: 1030, rare: { sulfur: 1 }, fly: true, shots: 6, shape: 'engine' },
    horseguard: { name: 'Конная гвардия', faction: 'league', tier: 6, atk: 20, def: 17, dmg: [24, 34], hp: 150, speed: 8, init: 11, growth: 2, cost: 1400, rare: { salt: 1 }, big: true, shape: 'rider' },
    palaceknight: { name: 'Рыцари Палаты', faction: 'league', tier: 6, atk: 22, def: 18, dmg: [25, 35], hp: 155, speed: 9, init: 11, growth: 2, cost: 1890, rare: { salt: 1 }, big: true, shape: 'rider' },
    cuirassier: { name: 'Кирасиры', faction: 'league', tier: 6, atk: 21, def: 19, dmg: [24, 34], hp: 158, speed: 8, init: 12, growth: 2, cost: 1890, rare: { salt: 1 }, big: true, shots: 1, shape: 'rider' },
    bombard: { name: 'Бомбарда', faction: 'league', tier: 7, atk: 26, def: 20, dmg: [50, 70], hp: 280, speed: 2, init: 10, growth: 1, cost: 3200, rare: { sulfur: 3 }, big: true, shots: 4, shape: 'engine' },
    mortar: { name: 'Мортира', faction: 'league', tier: 7, atk: 28, def: 21, dmg: [52, 70], hp: 290, speed: 2, init: 10, growth: 1, cost: 4300, rare: { sulfur: 3 }, big: true, shots: 4, shape: 'engine' },
    culverin: { name: 'Кулеврина', faction: 'league', tier: 7, atk: 30, def: 20, dmg: [50, 70], hp: 285, speed: 2, init: 11, growth: 1, cost: 4300, rare: { sulfur: 3 }, big: true, shots: 4, shape: 'engine' },
    shade: { name: 'Тени предков', faction: 'barrows', tier: 1, atk: 2, def: 1, dmg: [1, 3], hp: 6, speed: 6, init: 11, growth: 16, cost: 35, fly: true, spirit: true, chill: { atk: 1, max: 3 }, shape: 'spirit' },
    mourner: { name: 'Вопленицы', faction: 'barrows', tier: 1, atk: 3, def: 1, dmg: [1, 3], hp: 7, speed: 6, init: 11, growth: 16, cost: 47, fly: true, spirit: true, chill: { atk: 1, max: 3 }, shape: 'spirit' },
    dustguard: { name: 'Стражи праха', faction: 'barrows', tier: 1, atk: 1, def: 3, dmg: [1, 3], hp: 7, speed: 5, init: 11, growth: 16, cost: 47, spirit: true, chill: { atk: 1, max: 3 }, shape: 'spirit' },
    horsebow: { name: 'Конные лучники', faction: 'barrows', tier: 2, atk: 5, def: 4, dmg: [2, 4], hp: 12, speed: 6, init: 11, growth: 9, cost: 92, shots: 8, saddle: 0.7, shape: 'rider' },
    steppearcher: { name: 'Степные стрелки', faction: 'barrows', tier: 2, atk: 6, def: 4, dmg: [2, 4], hp: 13, speed: 6, init: 11, growth: 9, cost: 124, shots: 8, saddle: 1, shape: 'rider' },
    lasso: { name: 'Арканщики', faction: 'barrows', tier: 2, atk: 5, def: 5, dmg: [2, 4], hp: 14, speed: 6, init: 11, growth: 9, cost: 124, shots: 8, saddle: 0.7, shape: 'rider' },
    stonewoman: { name: 'Каменные бабы', faction: 'barrows', tier: 3, atk: 6, def: 10, dmg: [4, 7], hp: 32, speed: 4, init: 9, growth: 6, cost: 186, stone: true, aura: { side: 'enemy', morale: -1 }, shape: 'idol' },
    kinidol: { name: 'Идолы рода', faction: 'barrows', tier: 3, atk: 6, def: 12, dmg: [4, 7], hp: 34, speed: 4, init: 9, growth: 6, cost: 250, stone: true, aura: { side: 'enemy', morale: -1 }, shape: 'idol' },
    speakingstone: { name: 'Говорящие камни', faction: 'barrows', tier: 3, atk: 7, def: 11, dmg: [4, 7], hp: 35, speed: 4, init: 10, growth: 6, cost: 250, stone: true, aura: { side: 'enemy', morale: -1 }, shape: 'idol' },
    eaglespirit: { name: 'Духи беркутов', faction: 'barrows', tier: 4, atk: 12, def: 10, dmg: [9, 13], hp: 50, speed: 7, init: 12, growth: 5, cost: 355, fly: true, spirit: true, dive: { from: 4, bonus: 0.25 }, shape: 'bird' },
    stormeagle: { name: 'Беркуты бури', faction: 'barrows', tier: 4, atk: 14, def: 10, dmg: [9, 14], hp: 52, speed: 8, init: 12, growth: 5, cost: 480, fly: true, spirit: true, dive: { from: 4, bonus: 0.25 }, shape: 'bird' },
    soulcatcher: { name: 'Ловцы душ', faction: 'barrows', tier: 4, atk: 12, def: 12, dmg: [9, 13], hp: 55, speed: 7, init: 12, growth: 5, cost: 480, fly: true, spirit: true, dive: { from: 4, bonus: 0.25 }, shape: 'bird' },
    saltnoyon: { name: 'Засоленные нойоны', faction: 'barrows', tier: 5, atk: 15, def: 15, dmg: [15, 22], hp: 96, speed: 5, init: 10, growth: 3, cost: 890, rare: { salt: 1 }, shape: 'foot' },
    shamannoyon: { name: 'Нойоны-шаманы', faction: 'barrows', tier: 5, atk: 16, def: 16, dmg: [16, 22], hp: 100, speed: 5, init: 11, growth: 3, cost: 1200, rare: { salt: 1 }, shape: 'foot' },
    thousander: { name: 'Тысячники', faction: 'barrows', tier: 5, atk: 17, def: 16, dmg: [15, 23], hp: 102, speed: 5, init: 10, growth: 3, cost: 1200, rare: { salt: 1 }, shape: 'foot' },
    bonebull: { name: 'Костяные туры', faction: 'barrows', tier: 6, atk: 20, def: 16, dmg: [25, 36], hp: 160, speed: 7, init: 10, growth: 2, cost: 1480, rare: { salt: 2 }, big: true, shape: 'beast' },
    thunderbull: { name: 'Громовые туры', faction: 'barrows', tier: 6, atk: 22, def: 17, dmg: [26, 37], hp: 168, speed: 7, init: 11, growth: 2, cost: 2000, rare: { salt: 2 }, big: true, shape: 'beast' },
    greybull: { name: 'Седые туры', faction: 'barrows', tier: 6, atk: 21, def: 18, dmg: [25, 36], hp: 172, speed: 7, init: 10, growth: 2, cost: 2000, rare: { salt: 2 }, big: true, shape: 'beast' },
    stonekhan: { name: 'Каменный хан', faction: 'barrows', tier: 7, atk: 24, def: 28, dmg: [42, 60], hp: 290, speed: 6, init: 10, growth: 1, cost: 3700, rare: { salt: 3 }, big: true, stone: true, shape: 'idol' },
    kurgankhan: { name: 'Хан-курган', faction: 'barrows', tier: 7, atk: 25, def: 30, dmg: [42, 60], hp: 320, speed: 6, init: 10, growth: 1, cost: 5000, rare: { salt: 3 }, big: true, stone: true, shape: 'idol' },
    stormkhan: { name: 'Хан бурь', faction: 'barrows', tier: 7, atk: 26, def: 29, dmg: [43, 61], hp: 310, speed: 6, init: 11, growth: 1, cost: 5000, rare: { salt: 3 }, big: true, stone: true, shots: 3, shape: 'idol' },
    wolves: { name: 'Волки', faction: 'neutral', tier: 2, atk: 6, def: 3, dmg: [3, 5], hp: 14, speed: 6, init: 11, growth: 9, cost: 90, shape: 'beast' },
    forestgiant: { name: 'Лесной великан', faction: 'summon', tier: 6, atk: 20, def: 18, dmg: [30, 40], hp: 180, speed: 6, init: 9, growth: 2, cost: 1500, big: true, shape: 'heavy' }
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
    if (u.aura && u.aura.side === 'own') out.push(['Колокол', 'соседним своим +' + u.aura.morale + ' мораль']);
    if (u.aura && u.aura.side === 'enemy') out.push(['Немой взгляд', 'соседним врагам ' + u.aura.morale + ' мораль']);
    if (u.chill) out.push(['Холод могилы', 'цель −' + u.chill.atk + ' Натиск, до −' + u.chill.max]);
    if (u.saddle) out.push(['С седла', u.saddle >= 1 ? 'идут и стреляют без штрафа' : 'идут и стреляют с −' + Math.round((1 - u.saddle) * 100) + ' %']);
    if (u.dive) out.push(['Пикирование', '+' + Math.round(u.dive.bonus * 100) + ' % урона, если взлетели за ' + u.dive.from + ' клетки и дальше']);
    const f = H.FACTIONS && H.FACTIONS[u.faction];
    if (f && f.formation) out.push(['Строй', 'отряды Лиги рядом с целью бьют нападающего на ' + Math.round(f.formation * 100) + ' %']);
    if (f && f.lament) out.push(['Плач', 'гибель своего отряда даёт Курганам +' + f.lament.atk + ' Натиск, до +' + f.lament.max]);
    return out;
  };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
