(function (H) {
  'use strict';

  H.SKILLS = [
    { id: 'easy', name: 'Лёгкий', taken: 0.5, dealt: 1.25, ammo: 1.5 },
    { id: 'normal', name: 'Средний', taken: 1, dealt: 1, ammo: 1 },
    { id: 'hard', name: 'Тяжёлый', taken: 1.5, dealt: 0.85, ammo: 0.75 }
  ];

  H.WEAPONS = {
    crowbar: { slot: 0, order: 0, name: 'Монтировка', melee: true, dmg: 22, rate: 0.42, range: 1.9 },
    gravgun: { slot: 0, order: 1, name: 'Гравипушка', gravgun: true, rate: 0.5 },
    pistol: { slot: 1, order: 0, name: '9-мм пистолет', ammo: 'pistol', clip: 18, dmg: 9, rate: 0.14, spread: 0.012, reload: 1.3, kick: 0.012, sound: 'pistol' },
    magnum: { slot: 1, order: 1, name: 'Револьвер .357', ammo: '357', clip: 6, dmg: 70, rate: 0.75, spread: 0.002, reload: 3.0, kick: 0.09, sound: 'magnum' },
    smg: { slot: 2, order: 0, name: 'Пистолет-пулемёт', ammo: 'smg', clip: 45, dmg: 5, rate: 0.075, spread: 0.035, auto: true, reload: 1.5, kick: 0.006, alt: 'smggren', sound: 'smg' },
    ar2: { slot: 2, order: 1, name: 'Импульсная винтовка', ammo: 'ar2', clip: 30, dmg: 10, rate: 0.1, spread: 0.02, auto: true, reload: 1.6, kick: 0.01, alt: 'ar2ball', sound: 'ar2' },
    shotgun: { slot: 3, order: 0, name: 'Дробовик', ammo: 'buckshot', clip: 6, pellets: 7, dmg: 7, rate: 0.75, spread: 0.075, reloadShell: 0.45, kick: 0.07, sound: 'shotgun' },
    crossbow: { slot: 3, order: 1, name: 'Арбалет', ammo: 'bolt', clip: 1, dmg: 110, rate: 0.4, reload: 1.8, projectile: 'bolt', speed: 95, zoom: true, sound: 'crossbow' },
    grenade: { slot: 4, order: 0, name: 'Граната', ammo: 'grenade', throw: true, rate: 1.0 },
    rpg: { slot: 4, order: 1, name: 'Ракетница', ammo: 'rocket', clip: 1, rate: 1.4, projectile: 'rocket', speed: 22, sound: 'rpg' },
    bugbait: { slot: 5, order: 0, name: 'Феропод', bugbait: true, rate: 0.9 }
  };

  H.AMMO = {
    pistol: { max: 150, name: '9 мм' },
    '357': { max: 12, name: '.357' },
    smg: { max: 225, name: 'SMG' },
    smggren: { max: 3, name: 'Гранаты SMG' },
    ar2: { max: 60, name: 'Импульс' },
    ar2ball: { max: 3, name: 'Энергошары' },
    buckshot: { max: 30, name: 'Дробь' },
    bolt: { max: 10, name: 'Болты' },
    grenade: { max: 5, name: 'Гранаты' },
    rocket: { max: 3, name: 'Ракеты' }
  };

  H.ITEMS = {
    healthkit: { name: 'Аптечка', health: 25, size: 0.5 },
    healthvial: { name: 'Медикамент', health: 10, size: 0.3 },
    battery: { name: 'Батарея', armor: 15, size: 0.35 },
    suit: { name: 'Костюм H.E.V.', suit: true, size: 1.0 },
    ammo_pistol: { ammo: 'pistol', count: 20 },
    ammo_357: { ammo: '357', count: 6 },
    ammo_smg: { ammo: 'smg', count: 45 },
    ammo_smggren: { ammo: 'smggren', count: 1 },
    ammo_ar2: { ammo: 'ar2', count: 20 },
    ammo_ar2ball: { ammo: 'ar2ball', count: 1 },
    ammo_buckshot: { ammo: 'buckshot', count: 20 },
    ammo_bolt: { ammo: 'bolt', count: 6 },
    ammo_rocket: { ammo: 'rocket', count: 1 },
    ammo_grenade: { ammo: 'grenade', count: 1 },
    weapon_crowbar: { weapon: 'crowbar' },
    weapon_gravgun: { weapon: 'gravgun' },
    weapon_pistol: { weapon: 'pistol', ammo: 'pistol', count: 18 },
    weapon_magnum: { weapon: 'magnum', ammo: '357', count: 6 },
    weapon_smg: { weapon: 'smg', ammo: 'smg', count: 45 },
    weapon_ar2: { weapon: 'ar2', ammo: 'ar2', count: 30 },
    weapon_shotgun: { weapon: 'shotgun', ammo: 'buckshot', count: 12 },
    weapon_crossbow: { weapon: 'crossbow', ammo: 'bolt', count: 4 },
    weapon_rpg: { weapon: 'rpg', ammo: 'rocket', count: 3 },
    weapon_bugbait: { weapon: 'bugbait' }
  };

  H.PROPS = {
    can: { size: [0.07, 0.12, 0.07], mass: 0.4, mat: 'metal', model: 'can', usable: true },
    bottle: { size: [0.08, 0.15, 0.08], mass: 0.5, mat: 'glass', hp: 1, model: 'bottle', gibs: 'glass' },
    melon: { size: [0.2, 0.2, 0.2], mass: 4, mat: 'flesh', hp: 5, model: 'melon', gibs: 'melon' },
    paint: { size: [0.18, 0.22, 0.18], mass: 3, mat: 'metal', model: 'paint' },
    cinder: { size: [0.2, 0.2, 0.4], mass: 20, mat: 'concrete', model: 'cinder' },
    brick: { size: [0.12, 0.08, 0.22], mass: 3, mat: 'concrete', model: 'brick' },
    crate: { size: [0.5, 0.5, 0.5], mass: 28, mat: 'wood', hp: 18, model: 'crate', gibs: 'wood', density: 0.6 },
    crate_big: { size: [0.75, 0.75, 0.75], mass: 60, mat: 'wood', hp: 40, model: 'crate', gibs: 'wood', density: 0.6 },
    barrel: { size: [0.3, 0.45, 0.3], mass: 40, mat: 'metal', model: 'barrel' },
    barrel_red: { size: [0.3, 0.45, 0.3], mass: 36, mat: 'metal', hp: 18, model: 'barrel_red', explode: { dmg: 110, radius: 5.5 } },
    barrel_float: { size: [0.35, 0.5, 0.35], mass: 12, mat: 'plastic', model: 'barrel_float', density: 0.2 },
    propane: { size: [0.2, 0.35, 0.2], mass: 10, mat: 'metal', hp: 8, model: 'propane', explode: { dmg: 80, radius: 4.5 } },
    gascan: { size: [0.18, 0.2, 0.1], mass: 4, mat: 'metal', hp: 5, model: 'gascan', explode: { dmg: 60, radius: 3.5 } },
    radiator: { size: [0.55, 0.35, 0.1], mass: 35, mat: 'metal', model: 'radiator' },
    sawblade: { size: [0.42, 0.03, 0.42], mass: 18, mat: 'metal', model: 'sawblade', sharp: true },
    tire: { size: [0.38, 0.14, 0.38], mass: 16, mat: 'rubber', model: 'tire', density: 0.6 },
    pallet: { size: [0.6, 0.07, 0.5], mass: 14, mat: 'wood', model: 'pallet', density: 0.5 },
    plank: { size: [1.3, 0.05, 0.22], mass: 10, mat: 'wood', model: 'plank', density: 0.5 },
    cabinet: { size: [0.3, 0.65, 0.35], mass: 55, mat: 'metal', model: 'cabinet' },
    fridge: { size: [0.4, 0.9, 0.4], mass: 90, mat: 'metal', model: 'fridge' },
    tv: { size: [0.3, 0.25, 0.28], mass: 12, mat: 'plastic', hp: 6, model: 'tv', gibs: 'glass' },
    chair: { size: [0.25, 0.45, 0.25], mass: 7, mat: 'wood', hp: 10, model: 'chair', gibs: 'wood' },
    table: { size: [0.8, 0.38, 0.5], mass: 30, mat: 'wood', hp: 30, model: 'table', gibs: 'wood' },
    mattress: { size: [0.9, 0.1, 0.45], mass: 15, mat: 'cloth', model: 'mattress', density: 0.7 },
    bathtub: { size: [0.9, 0.3, 0.45], mass: 110, mat: 'metal', model: 'bathtub' },
    container: { size: [1.1, 0.6, 0.6], mass: 150, mat: 'metal', model: 'dumpster' },
    car: { size: [0.95, 0.7, 2.1], mass: 1300, mat: 'metal', model: 'car' },
    ball: { size: [0.22, 0.22, 0.22], mass: 6, mat: 'rubber', model: 'ball', bounce: 0.7 },
    lamarr: { size: [0.25, 0.15, 0.25], mass: 3, mat: 'flesh', model: 'lamarr' },
    combine_ball: { size: [0.2, 0.2, 0.2], mass: 5, mat: 'energy', model: 'energyball', float: true, bounce: 0.95 },
    turret_prop: { size: [0.35, 0.6, 0.35], mass: 40, mat: 'metal', model: 'turret' },
    pod: { size: [0.25, 0.15, 0.25], mass: 3, mat: 'flesh', model: 'pheropod' },
    body: { size: [0.3, 0.2, 0.85], mass: 70, mat: 'flesh', model: 'body' }
  };

  H.NPCS = {
    citizen: { hp: 40, team: 'neutral', speed: 3.2, height: 1.78, model: 'citizen', flee: true },
    rebel: { hp: 55, team: 'rebel', speed: 4.3, height: 1.78, model: 'rebel', weapon: 'npcsmg', squad: true },
    medic: { hp: 55, team: 'rebel', speed: 4.3, height: 1.78, model: 'medic', weapon: 'npcpistol', squad: true, medic: true },
    rebel_rpg: { hp: 55, team: 'rebel', speed: 4.3, height: 1.78, model: 'rebel', weapon: 'rpg_npc', squad: true },
    alyx: { hp: 100, team: 'rebel', speed: 5.4, height: 1.72, model: 'alyx', weapon: 'alyxgun', essential: true },
    barney: { hp: 100, team: 'rebel', speed: 4.8, height: 1.84, model: 'barney', weapon: 'npcsmg', essential: true },
    grigori: { hp: 100, team: 'rebel', speed: 3.4, height: 1.86, model: 'grigori', weapon: 'npcshotgun', essential: true },
    vort: { hp: 90, team: 'rebel', speed: 3.8, height: 1.85, model: 'vort', weapon: 'vortzap', essential: true },
    dog: { hp: 500, team: 'rebel', speed: 6, height: 2.8, radius: 0.8, model: 'dog', essential: true },
    kleiner: { hp: 100, team: 'neutral', speed: 3, height: 1.7, model: 'kleiner', essential: true },
    eli: { hp: 100, team: 'neutral', speed: 2, height: 1.78, model: 'eli', essential: true },
    mossman: { hp: 100, team: 'neutral', speed: 3.4, height: 1.74, model: 'mossman', essential: true },
    breen: { hp: 100, team: 'neutral', speed: 3.4, height: 1.8, model: 'breen', essential: true },
    gman: { hp: 100, team: 'neutral', speed: 2.6, height: 1.82, model: 'gman', essential: true, invulnerable: true },
    metrocop: { hp: 40, team: 'combine', speed: 4.2, height: 1.85, model: 'metrocop', weapon: 'baton', voice: 'radio', drop: 'ammo_pistol' },
    metrocop_pistol: { hp: 40, team: 'combine', speed: 4.2, height: 1.85, model: 'metrocop', weapon: 'npcpistol', voice: 'radio', drop: 'ammo_pistol', manhacks: 0 },
    soldier: { hp: 55, team: 'combine', speed: 4.6, height: 1.86, model: 'soldier', weapon: 'npcsmg', grenades: 1, voice: 'radio', drop: 'ammo_smg' },
    soldier_shotgun: { hp: 60, team: 'combine', speed: 4.6, height: 1.86, model: 'soldier', weapon: 'npcshotgun', grenades: 1, voice: 'radio', drop: 'ammo_buckshot' },
    elite: { hp: 80, team: 'combine', speed: 4.6, height: 1.9, model: 'elite', weapon: 'npcar2', grenades: 0, balls: 1, voice: 'radio', drop: 'ammo_ar2' },
    prisonguard: { hp: 55, team: 'combine', speed: 4.6, height: 1.86, model: 'prisonguard', weapon: 'npcar2', grenades: 1, voice: 'radio', drop: 'ammo_ar2' },
    manhack: { hp: 20, team: 'combine', speed: 8.5, height: 0.3, radius: 0.35, model: 'manhack', flying: true, touch: 7, grabbable: true },
    scanner: { hp: 30, team: 'combine', speed: 4, height: 0.5, radius: 0.4, model: 'scanner', flying: true, flash: true },
    headcrab: { hp: 10, team: 'zombie', speed: 2.6, height: 0.35, radius: 0.3, model: 'headcrab', leap: 5, bite: 5 },
    fastcrab: { hp: 10, team: 'zombie', speed: 5.5, height: 0.3, radius: 0.28, model: 'fastcrab', leap: 7, bite: 3 },
    poisoncrab: { hp: 35, team: 'zombie', speed: 2.4, height: 0.4, radius: 0.32, model: 'poisoncrab', leap: 4.5, poison: true },
    zombie: { hp: 50, team: 'zombie', speed: 1.5, height: 1.8, model: 'zombie', melee: 9, meleeRate: 1.5, crab: 'headcrab', throws: true },
    fastzombie: { hp: 50, team: 'zombie', speed: 7.2, height: 1.7, model: 'fastzombie', melee: 3, meleeRate: 0.35, leap: 9, crab: 'fastcrab' },
    poisonzombie: { hp: 170, team: 'zombie', speed: 1.1, height: 1.9, radius: 0.55, model: 'poisonzombie', melee: 18, meleeRate: 1.8, crab: 'poisoncrab', throwsCrabs: 3 },
    barnacle: { hp: 35, team: 'zombie', speed: 0, height: 0.6, model: 'barnacle', static: true },
    antlion: { hp: 30, team: 'antlion', speed: 7.5, height: 0.9, radius: 0.55, model: 'antlion', melee: 5, meleeRate: 0.7, hop: true },
    antlionguard: { hp: 520, team: 'antlion', speed: 9, height: 2.6, radius: 1.3, model: 'antlionguard', charge: 25, boss: true, noBullets: 0.25 },
    turret: { hp: 60, team: 'combine', speed: 0, height: 1.2, radius: 0.35, model: 'turret', weapon: 'turretgun', turret: true, noBullets: 0.1 },
    rollermine: { hp: 9999, team: 'combine', speed: 6.5, height: 0.6, radius: 0.32, model: 'rollermine', invulnerable: true, grabbable: true, shock: 10 },
    hunterchopper: { hp: 900, team: 'combine', speed: 14, height: 3, radius: 4, model: 'chopper', flying: true, boss: true, weapon: 'choppergun', onlyGun: true },
    gunship: { hp: 5, team: 'combine', speed: 12, height: 2.4, radius: 3.5, model: 'gunship', flying: true, boss: true, weapon: 'gunshipgun', rocketsOnly: true },
    strider: { hp: 7, team: 'combine', speed: 3.2, height: 11, radius: 2.2, model: 'strider', boss: true, weapon: 'stridergun', rocketsOnly: true, walker: true },
    apc: { hp: 4, team: 'combine', speed: 5, height: 2.8, radius: 2.2, model: 'apc', weapon: 'apcrocket', rocketsOnly: true },
    dropship: { hp: 9999, team: 'combine', speed: 18, height: 4, radius: 5, model: 'dropship', flying: true, invulnerable: true, scripted: true }
  };

  H.NPC_WEAPONS = {
    baton: { melee: 10, range: 1.8, rate: 1.2 },
    npcpistol: { dmg: 3, rate: 0.55, burst: 3, spread: 0.07, range: 30, sound: 'pistol' },
    npcsmg: { dmg: 3, rate: 0.09, burst: 6, pause: 1.1, spread: 0.08, range: 34, sound: 'smg' },
    npcar2: { dmg: 4, rate: 0.11, burst: 6, pause: 1.0, spread: 0.06, range: 40, sound: 'ar2' },
    npcshotgun: { dmg: 3, pellets: 6, rate: 1.1, burst: 1, spread: 0.1, range: 14, sound: 'shotgun' },
    alyxgun: { dmg: 4, rate: 0.12, burst: 5, pause: 0.7, spread: 0.05, range: 32, sound: 'pistol' },
    vortzap: { dmg: 30, rate: 2.4, burst: 1, spread: 0, range: 22, zap: true },
    rpg_npc: { rocket: true, rate: 4, range: 60 },
    turretgun: { dmg: 3, rate: 0.07, burst: 12, pause: 0.5, spread: 0.07, range: 30, sound: 'smg' },
    choppergun: { dmg: 3, rate: 0.05, burst: 25, pause: 2.2, spread: 0.05, range: 70, sound: 'ar2' },
    gunshipgun: { dmg: 4, rate: 0.07, burst: 18, pause: 2.5, spread: 0.06, range: 70, sound: 'ar2' },
    stridergun: { dmg: 5, rate: 0.12, burst: 10, pause: 2, spread: 0.05, range: 80, sound: 'ar2', cannon: true },
    apcrocket: { rocket: true, rate: 5, range: 60 }
  };

  H.TEAMS = {
    player: { combine: 1, zombie: 1, antlion: 1 },
    rebel: { combine: 1, zombie: 1, antlion: 1 },
    combine: { player: 1, rebel: 1, zombie: 1, antlion: 1, pet: 1 },
    zombie: { player: 1, rebel: 1, combine: 1, neutral: 1, antlion: 1, pet: 1 },
    antlion: { player: 1, rebel: 1, combine: 1, zombie: 1 },
    pet: { combine: 1, zombie: 1 },
    neutral: {}
  };
  H.hostile = (a, b) => !!(H.TEAMS[a] && H.TEAMS[a][b]);

  H.MATERIALS = {
    concrete: { step: 'concrete', impact: 'concrete' },
    metal: { step: 'metal', impact: 'metal' },
    wood: { step: 'wood', impact: 'wood' },
    dirt: { step: 'dirt', impact: 'dirt' },
    sand: { step: 'sand', impact: 'dirt' },
    grass: { step: 'dirt', impact: 'dirt' },
    tile: { step: 'tile', impact: 'concrete' },
    glass: { step: 'tile', impact: 'glass' },
    water: { step: 'water', impact: 'water' },
    flesh: { step: 'dirt', impact: 'flesh' },
    plastic: { step: 'wood', impact: 'wood' },
    rubber: { step: 'dirt', impact: 'wood' },
    cloth: { step: 'dirt', impact: 'wood' },
    energy: { step: 'metal', impact: 'metal' }
  };

  H.TEX_MAT = {
    asphalt: 'concrete', concrete: 'concrete', concrete_dark: 'concrete', sidewalk: 'concrete', cobble: 'concrete', brick: 'concrete', brick_yellow: 'concrete',
    plaster: 'concrete', plaster_blue: 'concrete', facade: 'concrete', facade2: 'concrete', roof: 'concrete', tile: 'tile', tile_lab: 'tile', rock: 'concrete',
    metal: 'metal', metal_rust: 'metal', combine: 'metal', combine_floor: 'metal', grate: 'metal', train: 'metal', container: 'metal', citadel: 'metal',
    wood: 'wood', wood_floor: 'wood', planks: 'wood', crate: 'wood', dirt: 'dirt', mud: 'dirt', grass: 'grass', sand: 'sand', sludge: 'water', water: 'water'
  };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hl2 = globalThis.Hl2 || {});
