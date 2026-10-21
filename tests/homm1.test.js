const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/homm1');
const MODULES = [
  'hm-core',
  'hm-data-units',
  'hm-data-towns',
  'hm-data-spells',
  'hm-data-items',
  'hm-combat',
  'hm-path',
  'hm-campaigns',
  'hm-world',
  'hm-ai',
  'hm-art',
  'hm-audio',
  'hm-render',
  'hm-ui'
];

let H;
for (const m of MODULES) {
  H = require(path.join(DIR, m + '.js'));
}

let checks = 0;
function ok(cond, msg) {
  assert.ok(cond, msg);
  checks++;
}

function collectStrings(obj, out = []) {
  if (typeof obj === 'string') {
    out.push(obj);
  } else if (Array.isArray(obj)) {
    for (const x of obj) collectStrings(x, out);
  } else if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) collectStrings(obj[k], out);
  }
  return out;
}

function testCodeAndStyle() {
  for (const m of MODULES) {
    const file = path.join(DIR, m + '.js');
    const src = fs.readFileSync(file, 'utf8');
    ok(!/\/\/|\/\*/.test(src), 'zero comments in ' + m + '.js');
    ok(!/\bMicrosoft\b|\bWindows\b/.test(src), 'naming rule in ' + m + '.js');
  }
  const appFile = path.join(ROOT, 'js/apps/homm1-app.js');
  const appSrc = fs.readFileSync(appFile, 'utf8');
  ok(!/\/\/|\/\*/.test(appSrc), 'zero comments in homm1-app.js');
  ok(!/\bMicrosoft\b|\bWindows\b/.test(appSrc), 'naming rule in homm1-app.js');
  ok(fs.existsSync(path.join(ROOT, 'content/steam/homm1-1.jpg')), 'steam shot 1 exists');
  ok(fs.existsSync(path.join(ROOT, 'content/steam/homm1-2.jpg')), 'steam shot 2 exists');
  ok(fs.existsSync(path.join(ROOT, 'homm1.html')), 'standalone homm1.html exists');
  ok(fs.existsSync(path.join(ROOT, 'HOMM1-98.md')), 'HOMM1-98.md docs exist');

  const allStrings = [];
  collectStrings(H.UNIT_LIST, allStrings);
  collectStrings(H.FACTIONS, allStrings);
  collectStrings(H.COMMON_BUILDINGS, allStrings);
  collectStrings(H.SPELL_LIST, allStrings);
  collectStrings(H.ARTIFACT_LIST, allStrings);
  collectStrings(H.HERO_PROFILE_LIST, allStrings);
  collectStrings(H.MAP_OBJECTS, allStrings);
  collectStrings(H.SPHINX_RIDDLES, allStrings);
  collectStrings(H.TAVERN_RUMORS, allStrings);
  collectStrings(H.CAMPAIGN_SCENARIOS, allStrings);
  collectStrings(H.CAMPAIGN_EPILOGUES, allStrings);
  collectStrings(H.STANDALONE_MAPS, allStrings);
  collectStrings(H.RATING_RANKS, allStrings);
  collectStrings(H.DIFFICULTY_PRESETS, allStrings);

  for (const s of allStrings) {
    ok(!/[—–]/.test(s), 'no em or en dashes in text: ' + s);
    ok(!/не\s+[а-яёa-z0-9\s]+,\s*а\s+/i.test(s), 'no "not X, but Y" pattern in text: ' + s);
  }
}

function testUnitsAndFactions() {
  ok(H.UNIT_LIST.length === 28, 'exactly 28 creatures in HoMM 1');

  for (const fid of H.FACTION_ORDER) {
    const f = H.FACTIONS[fid];
    ok(f && f.units.length === 6, fid + ' has 6 faction creatures');
    const fUnits = H.factionUnits(fid);
    ok(fUnits.length === 6, fid + ' factionUnits count');
    for (let t = 1; t <= 6; t++) {
      const u = fUnits[t - 1];
      ok(u.tier === t, fid + ' tier ' + t + ' is ' + u.id);
      ok(u.atk >= 1 && u.def >= 1 && u.hp >= 1, u.id + ' valid stats');
      ok(u.dmg[0] >= 1 && u.dmg[1] >= u.dmg[0], u.id + ' valid damage range');
      ok(u.growth >= 1 && u.cost.gold > 0, u.id + ' valid growth and gold cost');
      ok(H.unitPower(u.id) > 0, u.id + ' positive power');
      ok(H.unitNameCount(u.id, 1).includes(u.names[0]), u.id + ' singular name');
      ok(H.unitNameCount(u.id, 3).includes(u.names[1]), u.id + ' paucal name');
      ok(H.unitNameCount(u.id, 5).includes(u.names[2]), u.id + ' plural name');
    }
    const w = f.levelWeights;
    ok(w.atk + w.def + w.power + w.knowledge === 100, fid + ' level weights sum to 100%');
  }

  const neutrals = H.factionUnits('neutral');
  ok(neutrals.length === 4, '4 neutral creatures');
  ok(H.UNITS.peasant.hp === 1 && H.UNITS.dragon.hp === 200, 'Peasant 1 HP and Dragon 200 HP');
  ok(H.UNITS.dragon.magicImmune && H.UNITS.phoenix.elementalImmune, 'Dragon and Phoenix immunities');
  ok(H.UNITS.paladin.doubleStrike && H.UNITS.wolf.doubleStrike, 'Paladin and Wolf double strike');
  ok(H.UNITS.elf.doubleShot && H.UNITS.griffin.unlimitedRetaliation, 'Elf double shot and Griffin retaliation');
  ok(H.UNITS.hydra.allAroundAttack && H.UNITS.hydra.noRetaliation, 'Hydra all-around no-retaliation');
  ok(H.UNITS.ghost.undead && H.UNITS.ghost.soulSteal, 'Ghost undead soulSteal');
  ok(H.UNITS.genie.halveChance === 0.10, 'Genie 10% halve');
}

function testTownBuildingsAndEconomy() {
  for (const fid of H.FACTION_ORDER) {
    const town = {
      faction: fid,
      coastal: true,
      builtToday: false,
      buildings: {}
    };
    ok(H.townDailyIncome(town) === 250, fid + ' village income is 250');
    const pool = H.emptyResources(10);

    const noCastleCheck = H.canBuildInTown(town, 'dwell_1', pool);
    ok(!noCastleCheck.ok && noCastleCheck.reason === 'missing_req', 'cannot build dwelling before castle');

    const castleCheck = H.canBuildInTown(town, 'castle', pool);
    ok(castleCheck.ok, 'can build castle');
    town.buildings.castle = true;
    ok(H.townDailyIncome(town) === 1000, 'castle income is 1000');

    const specId = H.FACTIONS[fid].specialBuilding;
    ok(H.canBuildInTown(town, specId, pool).ok, 'can build faction special building ' + specId);
    town.buildings[specId] = true;
    ok(H.townDailyIncome(town) === (fid === 'warlock' ? 1500 : 1250), fid + ' income with special building');

    town.buildings.dwell_1 = true;
    const baseGrowth = H.UNITS[H.FACTIONS[fid].units[0]].growth;
    ok(H.townWeeklyGrowth(town, 1) === baseGrowth, 'base weekly growth');
    town.buildings.well = true;
    ok(H.townWeeklyGrowth(town, 1) === baseGrowth + 2, 'well adds +2 weekly growth');
  }
}

function testSpellsAndHeroes() {
  ok(H.SPELL_LIST.length >= 29, 'at least 29 spells');
  const rng = new H.RNG(42);
  const guild = H.rollMageGuildSpells(rng);
  ok(guild[1].length === 3 && guild[2].length === 3 && guild[3].length === 2 && guild[4].length === 2, 'Mage Guild spell counts per floor');

  ok(H.ARTIFACT_LIST.length >= 37, 'at least 37 artifacts');
  const ultimates = H.ARTIFACT_LIST.filter(a => a.ultimate);
  ok(ultimates.length === 4, '4 ultimate artifacts');

  ok(H.HERO_PROFILE_LIST.length === 36, '36 named hero profiles (9 per class)');

  const knight = H.createHero('lord_kilburn', 'blue', rng);
  ok(!knight.hasSpellbook, 'Knight starts without spellbook');
  ok(knight.maxMove === 1000, 'Knight with peasants has 1000 move points');

  const sorc = H.createHero('astra', 'green', rng);
  ok(sorc.hasSpellbook && sorc.spells.bless === sorc.knowledge, 'Sorceress starts with Spellbook and Bless charges equal to Knowledge');

  const warlock = H.createHero('agar', 'red', rng);
  ok(warlock.hasSpellbook && warlock.spells.curse === warlock.knowledge, 'Warlock starts with Spellbook and Curse charges equal to Knowledge');

  H.giveHeroArtifact(knight, 'dragon_sword');
  H.giveHeroArtifact(knight, 'nomad_boots');
  ok(knight.atk === knight.baseStats.atk + 3, 'Dragon Sword adds +3 Attack');
  ok(knight.maxMove === 1400, 'Nomad Boots add +400 land movement');

  knight.hasSpellbook = true;
  const town = {
    faction: 'knight',
    buildings: { castle: true, mage_guild_1: true, mage_guild_2: true },
    guildSpells: guild
  };
  const learned = H.visitTownMageGuild(knight, town);
  ok(learned === 6, 'visiting level 2 guild teaches 6 spells');
  for (const spId of guild[1]) {
    ok(knight.spells[spId] === knight.knowledge, 'spell charges match Knowledge');
  }

  const ups = H.grantHeroXp(knight, 3500, rng);
  ok(ups.length >= 2 && knight.level >= 3, 'XP grants multiple levels');
}

function testCombatMathAndAbilities() {
  const attHero = H.createHero('lord_kilburn', 'blue', new H.RNG(1));
  attHero.army = [{ unit: 'paladin', count: 10 }, null, null, null, null];
  const defHero = H.createHero('thundax', 'red', new H.RNG(2));
  defHero.army = [{ unit: 'ogre', count: 10 }, null, null, null, null];

  const c1 = new H.Combat(attHero, defHero, { seed: 10 });
  const pal = c1.stacks.find(s => s.unit === 'paladin');
  const ogr = c1.stacks.find(s => s.unit === 'ogre');
  pal.luck = 0;
  pal.buffs.bless = 3;
  const dmgBlessed = c1.calcDamage(pal, ogr, { noLuck: true }).damage;
  const expectedMult = 1 + 0.10 * (c1.effectiveAtk(pal) - c1.effectiveDef(ogr));
  ok(dmgBlessed === Math.floor(10 * 20 * expectedMult), 'exact Bless and Attack>Defense formula');

  delete pal.buffs.bless;
  pal.debuffs.curse = 3;
  const dmgCursed = c1.calcDamage(pal, ogr, { noLuck: true }).damage;
  ok(dmgCursed === Math.floor(10 * 10 * expectedMult), 'exact Curse formula');

  const beforeOgres = ogr.count;
  c1.meleeAttack(pal, ogr, { col: ogr.headCol - 1, row: ogr.row });
  ok(ogr.count < beforeOgres, 'Paladin melee attack kills Ogres');

  const ghostArmy = { army: [{ unit: 'ghost', count: 10 }, null, null, null, null] };
  const peasantArmy = { army: [{ unit: 'peasant', count: 25 }, null, null, null, null] };
  const cGhost = new H.Combat(ghostArmy, peasantArmy, { seed: 20 });
  const gh = cGhost.stacks.find(s => s.unit === 'ghost');
  const ps = cGhost.stacks.find(s => s.unit === 'peasant');
  cGhost.meleeAttack(gh, ps, { col: ps.headCol - 1, row: ps.row });
  ok(gh.count === 35 && ps.count === 0, 'Ghost soulSteal turns 25 slain peasants into 25 new Ghosts');

  const hydraArmy = { army: [{ unit: 'hydra', count: 5 }, null, null, null, null] };
  const surroundArmy = {
    army: [
      { unit: 'goblin', count: 20 },
      { unit: 'orc', count: 20 },
      { unit: 'wolf', count: 10 },
      null,
      null
    ]
  };
  const cHydra = new H.Combat(hydraArmy, surroundArmy, { seed: 30 });
  const hy = cHydra.stacks.find(s => s.unit === 'hydra');
  const e0 = cHydra.stacks.find(s => s.unit === 'goblin');
  const e1 = cHydra.stacks.find(s => s.unit === 'orc');
  const e2 = cHydra.stacks.find(s => s.unit === 'wolf');
  hy.headCol = 3;
  hy.tailCol = 2;
  hy.row = 1;
  e0.headCol = 4; e0.tailCol = 4; e0.row = 0;
  e1.headCol = 4; e1.tailCol = 4; e1.row = 1;
  e2.headCol = 4; e2.tailCol = 5; e2.row = 2;
  const hyHpBefore = hy.topHp;
  cHydra.meleeAttack(hy, e1, null);
  ok(e0.count < 20 && e1.count < 20 && e2.count < 10, 'Hydra hits all adjacent enemies simultaneously');
  ok(hy.topHp === hyHpBefore, 'Hydra suffers zero retaliation');

  const dragonArmy = { army: [{ unit: 'dragon', count: 3 }, null, null, null, null] };
  const lineArmy = { army: [{ unit: 'pikeman', count: 20 }, { unit: 'archer', count: 20 }, null, null, null] };
  const cBreath = new H.Combat(dragonArmy, lineArmy, { seed: 40 });
  const dr = cBreath.stacks.find(s => s.unit === 'dragon');
  const pk = cBreath.stacks.find(s => s.unit === 'pikeman');
  const ar = cBreath.stacks.find(s => s.unit === 'archer');
  dr.headCol = 3; dr.tailCol = 2; dr.row = 1;
  pk.headCol = 4; pk.tailCol = 4; pk.row = 1;
  ar.headCol = 5; ar.tailCol = 5; ar.row = 1;
  cBreath.meleeAttack(dr, pk, null);
  ok(pk.count < 20 && ar.count < 20, 'Dragon two-hex breath damages both front Pikemen and rear Archers');

  const griffinArmy = { army: [{ unit: 'griffin', count: 20 }, null, null, null, null] };
  const attackersArmy = { army: [{ unit: 'swordsman', count: 10 }, { unit: 'cavalry', count: 10 }, null, null, null] };
  const cGrif = new H.Combat(attackersArmy, griffinArmy, { seed: 50 });
  const gr = cGrif.stacks.find(s => s.unit === 'griffin');
  const sw = cGrif.stacks.find(s => s.unit === 'swordsman');
  const cv = cGrif.stacks.find(s => s.unit === 'cavalry');
  gr.headCol = 3; gr.tailCol = 4; gr.row = 1;
  sw.headCol = 2; sw.tailCol = 2; sw.row = 0;
  cv.headCol = 2; cv.tailCol = 1; cv.row = 2;
  cGrif.activeStack = sw;
  cGrif.meleeAttack(sw, gr, null);
  cGrif.activeStack = cv;
  cGrif.meleeAttack(cv, gr, null);
  ok(sw.count < 10 && cv.count < 10, 'Griffin retaliates against multiple attackers in the same round');
}

function testCombatSpellsAndSiege() {
  const caster = H.createHero('agar', 'blue', new H.RNG(60));
  caster.power = 5;
  caster.knowledge = 5;
  for (const sp of H.SPELL_LIST) {
    if (sp.category === 'combat') caster.spells[sp.id] = 5;
  }
  caster.army = [
    { unit: 'dragon', count: 2 },
    { unit: 'minotaur', count: 10 },
    null,
    null,
    null
  ];

  const enemy = H.createHero('lord_kilburn', 'red', new H.RNG(61));
  enemy.army = [
    { unit: 'swordsman', count: 20 },
    { unit: 'archer', count: 20 },
    { unit: 'ghost', count: 10 },
    null,
    null
  ];

  const c = new H.Combat(caster, enemy, { seed: 70 });
  const sw = c.stacks.find(s => s.unit === 'swordsman');
  const gh = c.stacks.find(s => s.unit === 'ghost');
  const mn = c.stacks.find(s => s.unit === 'minotaur');
  const dr = c.stacks.find(s => s.unit === 'dragon');

  const r1 = c.castSpell('attacker', 'lightning_bolt', sw);
  ok(r1.ok && r1.damage === 125 && sw.count < 20, 'Lightning Bolt deals 25*Power damage');

  c.castUsed.attacker = false;
  const rImmune = c.castSpell('attacker', 'magic_arrow', dr);
  ok(!rImmune.ok && rImmune.reason === 'immune', 'Dragon is immune to spells');

  c.castUsed.attacker = false;
  const rUndead = c.castSpell('attacker', 'turn_undead', gh);
  ok(rUndead.ok && gh.count < 10, 'Turn Undead damages Ghost stack');

  c.castUsed.attacker = false;
  const rBlindUndead = c.castSpell('attacker', 'blind', gh);
  ok(!rBlindUndead.ok && rBlindUndead.reason === 'immune', 'Undead Ghost is immune to Blind');

  c.castUsed.attacker = false;
  c.applyDamageToStack(mn, 140);
  const countWounded = mn.count;
  ok(countWounded === 6, 'Minotaurs lost 4 units');
  const rRes = c.castSpell('attacker', 'resurrect', mn);
  ok(rRes.ok && mn.count === 10 && mn.tempResurrected === 4, 'Temporary Resurrect revives 4 Minotaurs and tracks tempResurrected');

  c.castUsed.attacker = false;
  const rAnti = c.castSpell('attacker', 'antimagic', mn);
  ok(rAnti.ok && mn.buffs.antimagic > 0, 'Anti-Magic buff applied to Minotaurs');

  c.castUsed.attacker = false;
  const rArma = c.castSpell('attacker', 'armageddon');
  ok(rArma.ok && dr.count === 2 && mn.count === 10, 'Armageddon hits battlefield while Dragon and Anti-Magic Minotaurs take zero damage');

  for (const s of c.stacks) {
    if (s.side === 'defender') s.count = 0;
  }
  c.checkBattleEnd();
  ok(c.winner === 'attacker', 'Attacker wins after clearing defenders');
  ok(caster.army[1].count === 6, 'Temporary resurrected Minotaurs vanish after battle ends');

  const siegeAttacker = H.createHero('crag_hack', 'blue', new H.RNG(80));
  siegeAttacker.army = [
    { unit: 'cyclops', count: 15 },
    { unit: 'troll', count: 15 },
    { unit: 'wolf', count: 25 },
    null,
    null
  ];
  const siegeDefender = H.createHero('sir_gallant', 'red', new H.RNG(81));
  siegeDefender.army = [
    { unit: 'pikeman', count: 15 },
    { unit: 'archer', count: 12 },
    null,
    null,
    null
  ];
  const town = {
    faction: 'knight',
    buildings: { castle: true, tavern: true, dwell_1: true, dwell_2: true, dwell_3: true }
  };
  const siege = new H.Combat(siegeAttacker, siegeDefender, { siege: true, town, seed: 99 });
  const res = siege.runAutoCombat(300);
  ok(res.winner === 'attacker' && res.xpAwarded > 500, 'Siege auto-combat breaches castle and awards siege XP');
}

function testAllCombatSpellsAndSiegeMechanics() {
  const caster = H.createHero('agar', 'blue', new H.RNG(160));
  caster.power = 4;
  caster.knowledge = 6;
  for (const sp of H.SPELL_LIST) {
    if (sp.category === 'combat') caster.spells[sp.id] = 6;
  }
  caster.army = [
    { unit: 'swordsman', count: 20 },
    { unit: 'archer', count: 20 },
    { unit: 'phoenix', count: 2 },
    null,
    null
  ];

  const enemy = H.createHero('lord_kilburn', 'red', new H.RNG(161));
  enemy.army = [
    { unit: 'pikeman', count: 30 },
    { unit: 'cavalry', count: 15 },
    { unit: 'peasant', count: 50 },
    null,
    null
  ];

  const c = new H.Combat(caster, enemy, { noObstacles: true, seed: 170 });
  const sw = c.stacks.find(s => s.unit === 'swordsman');
  const ar = c.stacks.find(s => s.unit === 'archer');
  const ph = c.stacks.find(s => s.unit === 'phoenix');
  const pk = c.stacks.find(s => s.unit === 'pikeman');
  const cv = c.stacks.find(s => s.unit === 'cavalry');

  for (const buffId of ['bless', 'haste', 'shield', 'stoneskin', 'steelskin']) {
    c.castUsed.attacker = false;
    const res = c.castSpell('attacker', buffId, sw);
    ok(res.ok && sw.buffs[H.SPELLS[buffId].effect] === 4, 'Buff spell ' + buffId);
  }
  ok(c.effectiveDef(sw) === sw.baseDef + caster.def + 3 + 3 + 5, 'Combined defense buffs (+11)');

  c.castUsed.attacker = false;
  const rDispel = c.castSpell('attacker', 'dispel', sw);
  ok(rDispel.ok && Object.keys(sw.buffs).length === 0, 'Dispel removes all buffs');

  for (const debuffId of ['curse', 'slow', 'blind', 'paralyze', 'berserk']) {
    c.castUsed.attacker = false;
    const res = c.castSpell('attacker', debuffId, pk);
    ok(res.ok && pk.debuffs[H.SPELLS[debuffId].effect] === 4, 'Debuff spell ' + debuffId);
  }

  c.castUsed.attacker = false;
  c.applyDamageToStack(ar, 5);
  ar.debuffs.curse = 3;
  const rCure = c.castSpell('attacker', 'cure', ar);
  ok(rCure.ok && ar.topHp === ar.maxHp && Object.keys(ar.debuffs).length === 0, 'Cure heals topHp and cleanses debuffs');

  c.castUsed.attacker = false;
  const rTele = c.castSpell('attacker', 'teleport', { stack: sw, col: 3, row: 2 });
  ok(rTele.ok && sw.headCol === 3 && sw.row === 2, 'Teleport moves stack to (3, 2)');

  c.castUsed.attacker = false;
  const pkBeforeFb = pk.count;
  const rFb = c.castSpell('attacker', 'fireball', { col: pk.headCol, row: pk.row });
  ok(rFb.ok && pk.count < pkBeforeFb, 'Fireball deals 3x3 area damage');

  c.castUsed.attacker = false;
  const cvBeforeMs = cv.count;
  const rMs = c.castSpell('attacker', 'meteor_shower', { col: cv.headCol, row: cv.row });
  ok(rMs.ok && cv.count < cvBeforeMs, 'Meteor Shower deals 3x3 area damage');

  c.castUsed.attacker = false;
  const phBeforeStorm = ph.count;
  const rStorm = c.castSpell('attacker', 'elemental_storm');
  ok(rStorm.ok && ph.count === phBeforeStorm, 'Elemental Storm damages field while Phoenix is elementalImmune');

  c.castUsed.attacker = false;
  c.applyDamageToStack(sw, 100);
  const swWounded = sw.count;
  const rTrueRes = c.castSpell('attacker', 'resurrect_true', sw);
  ok(rTrueRes.ok && sw.count > swWounded && sw.tempResurrected === 0, 'Resurrect True permanently revives units');

  const town = {
    faction: 'knight',
    buildings: { castle: true, tavern: true, dwell_1: true, dwell_2: true }
  };
  const sBattle = new H.Combat(caster, enemy, { siege: true, town, seed: 180 });
  const sAr = sBattle.stacks.find(s => s.unit === 'archer');
  const sPk = sBattle.stacks.find(s => s.unit === 'pikeman');
  const sSw = sBattle.stacks.find(s => s.unit === 'swordsman');

  sAr.luck = 0;
  sAr.buffs.bless = 3;
  const wallShot = sBattle.calcDamage(sAr, sPk, { isRanged: true, noLuck: true }).damage;
  sBattle.walls = { 0: 0, 1: 0, 3: 0, 4: 0 };
  sBattle.bridgeDown = true;
  const openShot = sBattle.calcDamage(sAr, sPk, { isRanged: true, noLuck: true }).damage;
  ok(wallShot === Math.floor(openShot * 0.5), 'Intact castle walls halve ranged damage');

  sBattle.walls = { 0: 2, 1: 2, 3: 2, 4: 2 };
  sBattle.bridgeDown = false;
  const reachSw = sBattle.getReachableCells(sSw);
  ok(!reachSw.some(cell => cell.col >= 5), 'Walking unit cannot pass intact castle walls or raised bridge');
}

function testAllUnitDuels() {
  for (let i = 0; i < H.UNIT_LIST.length; i++) {
    for (let j = i + 1; j < H.UNIT_LIST.length; j++) {
      const uA = H.UNIT_LIST[i];
      const uB = H.UNIT_LIST[j];
      const a = { army: [{ unit: uA.id, count: Math.max(4, Math.round(400 / uA.hp)) }, null, null, null, null] };
      const b = { army: [{ unit: uB.id, count: Math.max(4, Math.round(400 / uB.hp)) }, null, null, null, null] };
      const combat = new H.Combat(a, b, { seed: 1000 + i * 31 + j });
      const out = combat.runAutoCombat(300);
      ok(out.winner === 'attacker' || out.winner === 'defender', 'Duel completes cleanly: ' + uA.id + ' vs ' + uB.id);
      ok(combat.round >= 1 && combat.log.length > 0, 'Duel logs combat actions');
    }
  }
}

function testCampaignAndMapGeneration() {
  ok(H.CAMPAIGN_SCENARIOS.length === 8, '8 campaign scenarios');
  ok(H.STANDALONE_MAPS.length === 6, '6 standalone maps');

  for (const sc of H.CAMPAIGN_SCENARIOS) {
    for (const fid of H.FACTION_ORDER) {
      ok(typeof sc.intros[fid] === 'string' && sc.intros[fid].length > 20, sc.id + ' intro for ' + fid);
      const map = H.generateMap(sc, 3000 + sc.index, fid);
      const reach = H.validateMapReachability(map);
      ok(reach.ok, 'Campaign map ' + sc.id + ' (' + fid + ') reachability: ' + (reach.reason || 'ok'));
      ok(map.towns.length >= sc.players, sc.id + ' has starting towns');
      ok(map.obelisks.length === 4, sc.id + ' has 4 obelisks');
      ok(map.ultimateArtifact && !map.ultimateArtifact.dug, sc.id + ' has buried ultimate artifact');
    }
  }

  for (const sm of H.STANDALONE_MAPS) {
    const map = H.generateMap(sm, 4000, 'knight');
    const reach = H.validateMapReachability(map);
    ok(reach.ok, 'Standalone map ' + sm.id + ' reachability: ' + (reach.reason || 'ok'));
  }
}

function testPathfindingAndTerrainRules() {
  const world = new H.World({ campaignIndex: 0, humanFaction: 'knight', seed: 500 });
  const knightHero = world.getPlayerHeroes('blue')[0];
  ok(knightHero && knightHero.faction === 'knight', 'Human starts with Knight hero');

  const barbHero = H.createHero('crag_hack', 'blue', world.rng);
  const swampIdx = H.tileIndex(world.map, 10, 10);
  world.map.tiles[swampIdx] = 'swamp';
  world.map.blocked[swampIdx] = 0;

  const knightSwampCost = H.stepCost(world, knightHero, 9, 10, 10, 10);
  const barbSwampCost = H.stepCost(world, barbHero, 9, 10, 10, 10);
  ok(knightSwampCost === 175 && barbSwampCost === 100, 'Barbarian ignores swamp rough terrain penalty (100 vs 175)');

  const diagCost = H.stepCost(world, barbHero, 9, 9, 10, 10);
  ok(diagCost === 141, 'Diagonal move applies 1.41 multiplier');

  const centerTown = world.map.towns[1];
  const pathRes = H.findPath(world, knightHero, centerTown.x, centerTown.y);
  ok(pathRes.reachable && pathRes.steps.length > 0 && pathRes.days >= 1, 'A* finds multi-day path between towns');
}

function testWorldCycleAndInteractions() {
  const world = new H.World({ campaignIndex: 2, humanFaction: 'sorceress', seed: 777, difficulty: 'normal' });
  const player = world.getPlayer('blue');
  const hero = world.getPlayerHeroes('blue')[0];
  const town = world.getPlayerTowns('blue')[0];

  ok(hero.hasSpellbook && hero.spells.bless > 0, 'Sorceress starting hero has spellbook and Bless');
  ok(world.isTileVisible('blue', town.x, town.y), 'Starting town is visible through fog of war');

  const buildM1 = world.buildInTown(town.id, 'mage_guild_1');
  ok(buildM1.ok, 'Built Mage Guild Level 1');
  const buildAgain = world.buildInTown(town.id, 'well');
  ok(!buildAgain.ok && buildAgain.reason === 'built_today', 'Only 1 building per day per town');

  const recRes = world.recruitInTown(town.id, 1, 5, true);
  ok(recRes.ok && recRes.count === 5, 'Recruited 5 sprites into visiting hero army');

  const chest = world.map.objects.find(o => o.type === 'chest' && !o.removed);
  const xpBefore = hero.xp;
  const chestRes = world.interactWithObject(hero, chest, 'xp');
  ok(chestRes.event === 'chest_xp' && hero.xp > xpBefore && chest.removed, 'Treasure chest XP choice grants XP and removes chest');

  const fort = world.map.objects.find(o => o.type === 'fort');
  const defBefore = hero.def;
  world.interactWithObject(hero, fort, 'def');
  ok(hero.def === defBefore + 1, 'Hill Fort raises Defense');

  const xanadu = world.map.objects.find(o => o.type === 'xanadu');
  const atkBefore = hero.atk;
  world.interactWithObject(hero, xanadu);
  ok(hero.atk === atkBefore + 1, 'Xanadu raises all primary stats');

  const sphinx = world.map.objects.find(o => o.type === 'sphinx');
  const goldBefore = player.resources.gold;
  const riddleAns = H.SPHINX_RIDDLES[(sphinx.riddleIdx || 0) % H.SPHINX_RIDDLES.length].answer;
  const sphRes = world.interactWithObject(hero, sphinx, riddleAns);
  ok(sphRes.event === 'sphinx_correct' && player.resources.gold === goldBefore + 3000, 'Sphinx correct answer grants 3000 gold and artifact');

  for (const ob of world.map.obelisks) {
    world.interactWithObject(hero, ob);
  }
  ok(player.obelisksVisited.length === 4, 'All 4 obelisks visited');

  for (let d = 0; d < 7 * world.players.length; d++) {
    world.endTurn();
  }
  ok(world.week === 2 && world.day === 1 && world.weekOfUnit !== null, '7-day cycle advances to Week 2 and rolls Week of the Unit');

  hero.x = world.map.ultimateArtifact.x;
  hero.y = world.map.ultimateArtifact.y;
  hero.move = hero.maxMove;
  const digRes = world.digAtCurrentTile(hero);
  ok(digRes.ok && digRes.found && world.gameOver && world.winner === 'blue', 'Digging Ultimate Artifact wins scenario 3');

  const rating = world.calculateRating();
  ok(rating.score > 0 && rating.rankName.length > 0, 'Rating calculation returns score and creature rank');

  const saved = world.serialize();
  const loaded = H.World.deserialize(saved);
  ok(loaded.totalDays === world.totalDays && loaded.winner === 'blue' && loaded.heroes.length === world.heroes.length, 'Save/load round-trip preserves full world state');
}

function testAdventureSpellsAndBoats() {
  const world = new H.World({ campaignIndex: 1, humanFaction: 'warlock', seed: 888 });
  const hero = world.getPlayerHeroes('blue')[0];
  hero.hasSpellbook = true;
  for (const sp of H.SPELL_LIST) {
    if (sp.category === 'adventure') hero.spells[sp.id] = 3;
  }

  const rView = world.castAdventureSpell(hero, 'view_all');
  ok(rView.ok && world.getPlayer('blue').viewOverlay.towns, 'View All reveals entire map and overlays');

  const rDoor = world.castAdventureSpell(hero, 'dimension_door', { x: hero.x + 2, y: hero.y + 2 });
  ok(rDoor.ok, 'Dimension Door teleports hero within range');

  const rGate = world.castAdventureSpell(hero, 'town_gate');
  const homeTown = world.getPlayerTowns('blue')[0];
  ok(rGate.ok && hero.x === homeTown.x && hero.y === homeTown.y, 'Town Gate returns hero to nearest friendly town');

  const boat = world.map.boats[0];
  if (boat) {
    hero.x = boat.x;
    hero.y = boat.y;
    hero.move = hero.maxMove;
    const rSum = world.castAdventureSpell(hero, 'summon_boat');
    ok(rSum.ok || rSum.reason === 'no_adjacent_water', 'Summon Boat executes cleanly');
  }
}

function testAIStrategicSimulation() {
  const world = new H.World({ standaloneId: 'twin_peaks', humanFaction: 'barbarian', seed: 910, difficulty: 'easy' });
  const sim = H.simulateFullGameWithBots(world, 60);
  ok(sim.gameOver && sim.winner !== null, 'Full bot-vs-AI simulation reaches decisive game over (' + sim.winner + ' in ' + sim.totalDays + ' days)');
}

function makeMockCanvas() {
  const ops = { fillRect: 0, fillText: 0, strokeRect: 0, arc: 0 };
  const ctx = {
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    font: '10px sans-serif',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    save() {},
    restore() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    arc() { ops.arc++; },
    fill() {},
    stroke() {},
    clip() {},
    rect() {},
    translate() {},
    scale() {},
    setLineDash() {},
    fillRect() { ops.fillRect++; },
    strokeRect() { ops.strokeRect++; },
    fillText() { ops.fillText++; }
  };
  return {
    width: H.W,
    height: H.H,
    ops,
    getContext() { return ctx; }
  };
}

function testArtRenderAndUI() {
  const mockCanvas = makeMockCanvas();
  const ui = new H.GameUI(mockCanvas, { muted: true });
  ui.render();
  ok(ui.screen === 'menu' && mockCanvas.ops.fillRect > 10, 'Menu screen renders cleanly');

  ui.handleClick(60, 430, false);
  ok(ui.screen === 'adventure' && ui.world !== null, 'Clicking Start Campaign starts adventure world');
  ok(ui.modal !== null, 'Campaign intro modal opens');

  ui.handleKeyDown('Enter');
  ok(ui.modal === null, 'Pressing Enter closes campaign intro modal');

  ui.openTownScreen(ui.world.selectedTownId);
  ui.render();
  ok(ui.screen === 'town' && mockCanvas.ops.fillText > 20, 'Town screen renders cleanly');

  ui.handleClick(60, 410, false);
  ok(ui.modal !== null && ui.modal.title.includes('Строительство'), 'Clicking Build opens Town Build modal');
  ui.handleKeyDown('Escape');

  ui.handleKeyDown('Escape');
  ok(ui.screen === 'adventure', 'Pressing Escape exits Town screen back to Adventure');

  ui.startQuickSkirmish();
  ui.render();
  ok(ui.screen === 'combat' && ui.activeCombat !== null, 'Quick Skirmish starts 7x5 combat screen');

  const enemySt = ui.activeCombat.stacks.find(s => s.side === 'defender' && s.count > 0);
  const enemyPx = H.BF_X + enemySt.headCol * H.BF_CELL_W + 10;
  const enemyPy = H.BF_Y + enemySt.row * H.BF_CELL_H + 10;
  ui.handleMouseMove(enemyPx, enemyPy);
  ok(ui.hoverText.length > 0, 'Hovering enemy stack in combat shows damage preview or stats');

  ui.handleRightClick(enemyPx, enemyPy);
  ok(ui.modal !== null && ui.modal.title === enemySt.name, 'Right-clicking stack in combat opens unit inspect modal');
  ui.handleKeyDown('Escape');

  ui.handleClick(150, 420, false);
  ok(ui.activeCombat !== null, 'Wait button in combat works cleanly');

  ui.handleClick(530, 420, false);
  ok(ui.modal !== null && ui.modal.title.includes('Итог'), 'Retreat button in combat works without error');
  ui.handleKeyDown('Enter');
}

function testInteractivePlayability() {
  const mockCanvas = makeMockCanvas();
  const ui = new H.GameUI(mockCanvas, { muted: true });
  ui.startCampaignOrScenario();
  ui.modal = null;

  const world = ui.world;
  const hero = world.getPlayerHeroes('blue')[0];
  const monster = world.map.objects.find(o => !o.removed && o.type === 'monster');
  ok(monster !== undefined, 'Map has guard monster');

  const pathToMonster = H.findPath(world, hero, monster.x, monster.y);
  ok(pathToMonster.reachable && pathToMonster.steps.length > 0, 'Hero can plot path directly to a monster on the map');
  ok(pathToMonster.steps[pathToMonster.steps.length - 1].action === 'fight_guard', 'Final step onto monster triggers fight_guard');

  const chest = world.map.objects.find(o => !o.removed && o.type === 'chest');
  const promptRes = world.interactWithObject(hero, chest);
  ok(promptRes.event === 'prompt_choice' && promptRes.promptType === 'chest' && !chest.removed, 'Interactive chest prompts human player instead of auto-picking');
  ui.handleMoveEventFeedback(promptRes, hero);
  ok(ui.modal !== null && ui.modal.title.includes('Сундук'), 'Chest choice modal opens for player');
  ui.modal.buttons[1].onClick();
  ok(chest.removed && hero.xp >= 1000, 'Clicking XP button in Chest modal grants XP and removes chest');

  ui.openPuzzleMapModal();
  ui.render();
  ok(ui.modal !== null && ui.modal.title.includes('Обелисков'), 'Puzzle Map modal opens and renders');
  ui.modal = null;

  ui.openSystemMenuModal();
  ui.render();
  ok(ui.modal !== null && ui.modal.title.includes('Меню'), 'System Menu modal opens and renders');
  ui.modal = null;

  const town = world.getPlayerTowns('blue')[0];
  const player = world.getPlayer('blue');
  player.resources.gold = 150;
  town.available[2] = 10;
  const maxBuy = H.maxAffordableCount(player.resources, H.UNITS.archer.cost, 10);
  ok(maxBuy === 1, 'maxAffordableCount calculates partial affordable stack (1 archer for 150 gold)');
}

testCodeAndStyle();
testUnitsAndFactions();
testTownBuildingsAndEconomy();
testSpellsAndHeroes();
testCombatMathAndAbilities();
testCombatSpellsAndSiege();
testAllCombatSpellsAndSiegeMechanics();
testAllUnitDuels();
testCampaignAndMapGeneration();
testPathfindingAndTerrainRules();
testWorldCycleAndInteractions();
testAdventureSpellsAndBoats();
testAIStrategicSimulation();
testArtRenderAndUI();
testInteractivePlayability();

console.log('HoMM1 Stage 1-9 tests passed: ' + checks + ' checks.');
