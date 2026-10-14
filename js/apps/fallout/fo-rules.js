(function (FO) {
  'use strict';

  FO.STAT = {
    ST: 0, PE: 1, EN: 2, CH: 3, IN: 4, AG: 5, LK: 6,
    MAX_HP: 7, MAX_AP: 8, AC: 9, UNARMED_DMG: 10, MELEE_DMG: 11, CARRY: 12, SEQUENCE: 13, HEAL_RATE: 14,
    CRIT_CHANCE: 15, BETTER_CRITS: 16, DT: 17, DR: 24, RAD_RESIST: 31, POISON_RESIST: 32, AGE: 33, GENDER: 34,
    HP: 35, POISON: 36, RAD: 37
  };

  FO.SKILL = {
    SMALL_GUNS: 0, BIG_GUNS: 1, ENERGY: 2, UNARMED: 3, MELEE: 4, THROWING: 5, FIRST_AID: 6, DOCTOR: 7, SNEAK: 8,
    LOCKPICK: 9, STEAL: 10, TRAPS: 11, SCIENCE: 12, REPAIR: 13, SPEECH: 14, BARTER: 15, GAMBLING: 16, OUTDOORSMAN: 17
  };

  FO.TRAIT = {
    FAST_METABOLISM: 0, BRUISER: 1, SMALL_FRAME: 2, ONE_HANDER: 3, FINESSE: 4, KAMIKAZE: 5, HEAVY_HANDED: 6, FAST_SHOT: 7,
    BLOODY_MESS: 8, JINXED: 9, GOOD_NATURED: 10, CHEM_RELIANT: 11, CHEM_RESISTANT: 12, NIGHT_PERSON: 13, SKILLED: 14, GIFTED: 15
  };

  FO.PERK = {
    AWARENESS: 0, BONUS_HTH_ATTACKS: 1, BONUS_HTH_DAMAGE: 2, BONUS_MOVE: 3, BONUS_RANGED_DAMAGE: 4, BONUS_RATE_OF_FIRE: 5,
    EARLIER_SEQUENCE: 6, FASTER_HEALING: 7, MORE_CRITICALS: 8, NIGHT_VISION: 9, PRESENCE: 10, RAD_RESISTANCE: 11, TOUGHNESS: 12,
    STRONG_BACK: 13, SHARPSHOOTER: 14, SILENT_RUNNING: 15, SURVIVALIST: 16, MASTER_TRADER: 17, EDUCATED: 18, HEALER: 19,
    FORTUNE_FINDER: 20, BETTER_CRITICALS: 21, EMPATHY: 22, SLAYER: 23, SNIPER: 24, SILENT_DEATH: 25, ACTION_BOY: 26,
    MENTAL_BLOCK: 27, LIFEGIVER: 28, DODGER: 29, SNAKEATER: 30, MR_FIXIT: 31, MEDIC: 32, MASTER_THIEF: 33, SPEAKER: 34,
    HEAVE_HO: 35, FRIENDLY_FOE: 36, PICKPOCKET: 37, GHOST: 38, CULT_OF_PERSONALITY: 39, SCROUNGER: 40, EXPLORER: 41,
    FLOWER_CHILD: 42, PATHFINDER: 43, ANIMAL_FRIEND: 44, SCOUT: 45, MYSTERIOUS_STRANGER: 46, RANGER: 47, QUICK_POCKETS: 48,
    SMOOTH_TALKER: 49, SWIFT_LEARNER: 50, TAG: 51, MUTATE: 52
  };

  FO.PC_STAT = { SKILL_POINTS: 0, LEVEL: 1, EXP: 2, REPUTATION: 3, KARMA: 4 };
  FO.PC_FLAG = { SNEAK: 0, LEVEL: 3, ADDICTED: 4 };
  FO.ROLL = { CRIT_FAIL: 0, FAIL: 1, SUCCESS: 2, CRIT_SUCCESS: 3 };
  FO.MAX_LEVEL = 21;
  FO.SAVED_STATS = 35;
  FO.PERK_COUNT = 64;
  FO.TRAIT_COUNT = 16;
  FO.SKILL_COUNT = 18;
  FO.TAG_SLOTS = 4;
  FO.MAX_FREE_PERKS_OWNED = 7;

  const S = FO.STAT;
  const T = FO.TRAIT;
  const TICKS_PER_YEAR = 315360000;
  const DAY_TICKS = 864000;
  const SKILL_POINTS_CAP = 99;
  const SKILL_CAP = 200;

  FO.expForLevel = level => 1000 * level * (level - 1) / 2;

  FO.defaultDudeStats = function () {
    const base = FO.EXE.stats.slice(0, FO.SAVED_STATS).map(r => r[2]);
    return { base, bonus: new Array(FO.SAVED_STATS).fill(0), skills: new Array(FO.SKILL_COUNT).fill(0) };
  };

  FO.resetDude = function (d) {
    const pc = FO.EXE.pcStats;
    d.skillPoints = pc[FO.PC_STAT.SKILL_POINTS][2];
    d.level = pc[FO.PC_STAT.LEVEL][2];
    d.exp = pc[FO.PC_STAT.EXP][2];
    d.reputation = pc[FO.PC_STAT.REPUTATION][2];
    d.karma = pc[FO.PC_STAT.KARMA][2];
    d.stats = FO.defaultDudeStats();
    d.name = 'None';
    d.lastLevel = 1;
    d.charPoints = 5;
    d.freePerk = false;
    d.tags = [-1, -1, -1, -1];
    d.perks = {};
    d.traits = [-1, -1];
    FO.recalcDerived(d);
  };

  FO.applyGcd = function (d, gcd) {
    FO.resetDude(d);
    d.stats.base = gcd.base.slice(0, FO.SAVED_STATS);
    d.stats.bonus = gcd.bonus.slice(0, FO.SAVED_STATS);
    d.stats.skills = gcd.skills.slice(0, FO.SKILL_COUNT);
    d.stats.base[S.DR + FO.DMG.EMP] = 100;
    d.name = gcd.name;
    d.tags = gcd.tags.slice(0, FO.TAG_SLOTS);
    d.traits = gcd.traits.slice(0, 2);
    d.charPoints = gcd.points | 0;
    FO.recalcDerived(d);
    if (d.critter) d.critter.hp = FO.statValue(d, S.MAX_HP);
  };

  FO.loadPremade = async function (data, d, name) {
    FO.applyGcd(d, FO.readGcd(await data.get(name + '.GCD')));
  };

  FO.critterData = function (o) {
    if (o.dude) return o.stats || null;
    return o.proto || null;
  };

  FO.statBase = function (o, n) {
    const d = FO.critterData(o);
    return d && d.base && n >= 0 && n < FO.SAVED_STATS ? d.base[n] | 0 : 0;
  };

  FO.statBonus = function (o, n) {
    const d = FO.critterData(o);
    return d && d.bonus && n >= 0 && n < FO.SAVED_STATS ? d.bonus[n] | 0 : 0;
  };

  FO.baseStat = (o, n) => FO.statBase(o, n) + FO.statBonus(o, n);

  const hasTrait = (o, t) => !!(o.dude && o.traits && t >= 0 && o.traits.includes(t));
  const perk = (o, p) => (o.dude && o.perks ? o.perks[p] | 0 : 0);
  FO.hasTrait = hasTrait;
  FO.perkRank = perk;

  FO.isFemale = o => !!(o && o.critter && FO.statValue(o, FO.STAT.GENDER) === 1);

  FO.isNight = function () {
    const h = FO.hourOf ? FO.hourOf() : 1200;
    return h < 600 || h >= 1800;
  };

  FO.traitStatMod = function (o, n) {
    if (!o.dude) return 0;
    const gifted = hasTrait(o, T.GIFTED) ? 1 : 0;
    const night = hasTrait(o, T.NIGHT_PERSON) ? (FO.isNight() ? 1 : -1) : 0;
    switch (n) {
      case S.ST: return gifted + (hasTrait(o, T.BRUISER) ? 2 : 0);
      case S.PE: case S.IN: return gifted + night;
      case S.EN: case S.CH: case S.LK: return gifted;
      case S.AG: return gifted + (hasTrait(o, T.SMALL_FRAME) ? 1 : 0);
      case S.MAX_AP: return hasTrait(o, T.BRUISER) ? -2 : 0;
      case S.AC: return hasTrait(o, T.KAMIKAZE) ? -FO.statBase(o, S.AC) : 0;
      case S.MELEE_DMG: return hasTrait(o, T.HEAVY_HANDED) ? 4 : 0;
      case S.CARRY: return hasTrait(o, T.SMALL_FRAME) ? -10 * FO.statBase(o, S.ST) : 0;
      case S.SEQUENCE: return hasTrait(o, T.KAMIKAZE) ? 5 : 0;
      case S.HEAL_RATE: return hasTrait(o, T.FAST_METABOLISM) ? 2 : 0;
      case S.CRIT_CHANCE: return hasTrait(o, T.FINESSE) ? 10 : 0;
      case S.BETTER_CRITS: return hasTrait(o, T.HEAVY_HANDED) ? -30 : 0;
      case S.RAD_RESIST: case S.POISON_RESIST: return hasTrait(o, T.FAST_METABOLISM) ? -FO.statBase(o, n) : 0;
      default: return 0;
    }
  };

  FO.baseWithTraits = (o, n) => FO.statBase(o, n) + FO.traitStatMod(o, n);

  FO.statRange = n => {
    const r = FO.EXE.stats[n];
    return r ? [r[0], r[1]] : [0, 0];
  };

  FO.statValue = function (o, n) {
    if (!o || FO.pidType(o.pid) !== FO.PID.CRITTER) return 0;
    const c = o.critter || {};
    if (n === S.HP) return c.hp | 0;
    if (n === S.POISON) return c.poison | 0;
    if (n === S.RAD) return c.rad | 0;
    if (n < 0 || n >= FO.SAVED_STATS) return 0;
    let v = FO.baseWithTraits(o, n) + FO.statBonus(o, n);
    if (n === S.AC && FO.combatTurn) {
      const turn = FO.combatTurn();
      if (turn !== undefined && turn !== o) v += c.ap | 0;
    }
    if (n === S.PE && FO.DAM && (c.results & FO.DAM.BLIND)) v -= 5;
    if (n === S.AGE && FO.gameTime) v += Math.floor((FO.gameTime() >>> 0) / TICKS_PER_YEAR);
    const [min, max] = FO.statRange(n);
    return Math.max(min, Math.min(max, v));
  };

  FO.recalcDerived = function (o) {
    const d = FO.critterData(o);
    if (!d || !d.base) return;
    const st = FO.statValue(o, S.ST);
    const pe = FO.statValue(o, S.PE);
    const en = FO.statValue(o, S.EN);
    const ag = FO.statValue(o, S.AG);
    const lk = FO.statValue(o, S.LK);
    d.base[S.MAX_HP] = FO.baseWithTraits(o, S.ST) + 2 * FO.baseWithTraits(o, S.EN) + 15;
    d.base[S.MAX_AP] = Math.trunc(ag / 2) + 5;
    d.base[S.AC] = ag;
    d.base[S.MELEE_DMG] = Math.max(1, st - 5);
    d.base[S.CARRY] = 25 * st + 25;
    d.base[S.SEQUENCE] = 2 * pe;
    d.base[S.HEAL_RATE] = Math.max(1, Math.trunc(en / 3));
    d.base[S.CRIT_CHANCE] = lk;
    d.base[S.BETTER_CRITS] = 0;
    d.base[S.RAD_RESIST] = 2 * en;
    d.base[S.POISON_RESIST] = 5 * en;
  };

  FO.setBaseStat = function (o, n, value) {
    if (n < 0 || n >= FO.SAVED_STATS) return -5;
    if (n > S.LK && n < S.AGE) return -1;
    const v = value - FO.traitStatMod(o, n);
    const [min, max] = FO.statRange(n);
    if (v < min) return -2;
    if (v > max) return -3;
    const d = FO.critterData(o);
    if (!d || !d.base) return -5;
    d.base[n] = v;
    if (n <= S.LK) FO.recalcDerived(o);
    return 0;
  };

  FO.setBonusStat = function (o, n, value) {
    if (n < 0 || n >= FO.SAVED_STATS) return -5;
    const d = FO.critterData(o);
    if (!d || !d.bonus) return -5;
    d.bonus[n] = value;
    if (n <= S.LK) FO.recalcDerived(o);
    return 0;
  };

  FO.addBonusStat = (o, n, delta) => FO.setBonusStat(o, n, FO.statBonus(o, n) + delta);

  FO.perkAddEffect = function (o, p) {
    const row = FO.EXE.perks[p];
    if (!row) return;
    if (row[2] !== -1) FO.addBonusStat(o, row[2], row[3]);
    if (row[0] === -1) for (let i = 0; i <= S.LK; i++) FO.addBonusStat(o, i, row[6 + i]);
  };

  FO.perkRemoveEffect = function (o, p) {
    const row = FO.EXE.perks[p];
    if (!row) return;
    if (row[2] !== -1) FO.addBonusStat(o, row[2], -row[3]);
    if (row[0] === -1) for (let i = 0; i <= S.LK; i++) FO.addBonusStat(o, i, -row[6 + i]);
  };

  FO.perkCanAdd = function (o, p) {
    const row = FO.EXE.perks[p];
    if (!row || row[0] === -1) return false;
    if (perk(o, p) >= row[0]) return false;
    if ((o.level || 1) < row[1]) return false;
    if (row[4] !== -1 && FO.skillValue(o, row[4]) < row[5]) return false;
    for (let i = 0; i <= S.LK; i++) if (FO.statValue(o, i) < row[6 + i]) return false;
    return true;
  };

  FO.perkAdd = function (o, p) {
    if (p < 0 || p >= FO.PERK_COUNT || !FO.perkCanAdd(o, p)) return -1;
    o.perks = o.perks || {};
    o.perks[p] = perk(o, p) + 1;
    FO.perkAddEffect(o, p);
    return 0;
  };

  FO.perkSub = function (o, p) {
    if (p < 0 || p >= FO.PERK_COUNT || perk(o, p) < 1) return -1;
    o.perks[p] = perk(o, p) - 1;
    FO.perkRemoveEffect(o, p);
    return 0;
  };

  FO.perkList = function (o) {
    const out = [];
    for (let p = 0; p < FO.PERK_COUNT; p++) if (FO.perkCanAdd(o, p)) out.push(p);
    return out;
  };

  FO.ownedPerkCount = function (o, cap) {
    let n = 0;
    for (let p = 0; p < FO.PERK_COUNT && n < cap; p++) if (perk(o, p) > 0) n++;
    return n;
  };

  FO.equipped = function (o, flag) {
    const e = (o.inventory || []).find(x => x.obj.flags & flag);
    return e ? e.obj : null;
  };

  FO.armorOf = function (o) {
    const e = (o.inventory || []).find(x => x.obj.flags & FO.FLAG.WORN);
    return e ? e.obj : null;
  };

  FO.adjustArmor = function (o, oldArmor, newArmor) {
    if (!o || !o.dude) return;
    const pr = a => (a && a.proto ? a.proto : null);
    const was = pr(oldArmor);
    const now = pr(newArmor);
    const ac = p => (p ? p.ac | 0 : 0);
    FO.addBonusStat(o, S.AC, ac(now) - ac(was));
    for (let t = 0; t < 7; t++) {
      const dr = p => (p && p.dr ? p.dr[t] | 0 : 0);
      const dt = p => (p && p.dt ? p.dt[t] | 0 : 0);
      FO.addBonusStat(o, S.DR + t, dr(now) - dr(was));
      FO.addBonusStat(o, S.DT + t, dt(now) - dt(was));
    }
    if (was && was.perk >= 0) FO.perkRemoveEffect(o, was.perk);
    if (now && now.perk >= 0) FO.perkAddEffect(o, now.perk);
  };

  FO.primaries = function (o) {
    const s = [];
    for (let i = 0; i <= S.LK; i++) s.push(FO.statValue(o, i));
    return s;
  };

  FO.skillRow = n => FO.EXE.skills[n] || null;

  FO.skillPoints = function (o, n) {
    const d = FO.critterData(o);
    return d && d.skills ? d.skills[n] | 0 : 0;
  };

  FO.isTagged = (o, n) => !!(o.dude && o.tags && n >= 0 && o.tags.includes(n));

  FO.skillBase = function (o, n) {
    const r = FO.skillRow(n);
    if (!r) return 0;
    const [def, mult, s1, s2] = r;
    const a = FO.statValue(o, s1);
    return def + (s2 === -1 ? a * mult : Math.trunc((a + FO.statValue(o, s2)) * mult / 2));
  };

  FO.traitSkillMod = function (o, n) {
    if (!o.dude) return 0;
    let v = 0;
    if (hasTrait(o, T.GIFTED)) v -= 10;
    if (hasTrait(o, T.SKILLED)) v += 10;
    if (hasTrait(o, T.GOOD_NATURED)) {
      if (n < FO.SKILL.FIRST_AID) v -= 10;
      else if (n <= FO.SKILL.DOCTOR || n === FO.SKILL.SPEECH || n === FO.SKILL.BARTER) v += 15;
    }
    return v;
  };

  FO.skillValue = function (o, n) {
    const r = o ? FO.skillRow(n) : null;
    if (!r) return 0;
    const pts = FO.skillPoints(o, n);
    let v = FO.skillBase(o, n) + r[4] * pts;
    if (o.dude) {
      if (FO.isTagged(o, n)) v += r[4] * pts + 20;
      v += FO.traitSkillMod(o, n) + FO.perkSkillBonus(o, n) + FO.difficultySkillBonus(n);
    }
    return Math.min(SKILL_CAP, v);
  };

  FO.skillIncPoint = function (o, n) {
    if (!o.dude || !FO.skillRow(n)) return -5;
    if ((o.skillPoints | 0) <= 0) return -4;
    if (FO.skillValue(o, n) >= SKILL_CAP) return -3;
    o.skillPoints = (o.skillPoints | 0) - 1;
    o.stats.skills[n] = (o.stats.skills[n] | 0) + 1;
    return 0;
  };

  FO.skillDecPoint = function (o, n) {
    if (!o.dude || !FO.skillRow(n)) return -5;
    if ((o.stats.skills[n] | 0) <= 0) return -2;
    o.skillPoints = (o.skillPoints | 0) + 1;
    o.stats.skills[n] = (o.stats.skills[n] | 0) - 1;
    return 0;
  };

  FO.perkSkillBonus = function (o, n) {
    const P = FO.PERK;
    const K = FO.SKILL;
    const r = p => perk(o, p) > 0;
    switch (n) {
      case K.FIRST_AID: case K.DOCTOR: return r(P.MEDIC) ? 20 : 0;
      case K.SNEAK: return (r(P.GHOST) && FO.lightOf && FO.lightOf(o) <= 0xB333 ? 20 : 0) + (r(P.MASTER_THIEF) ? 10 : 0);
      case K.LOCKPICK: case K.STEAL: case K.TRAPS: return r(P.MASTER_THIEF) ? 10 : 0;
      case K.SCIENCE: case K.REPAIR: return r(P.MR_FIXIT) ? 20 : 0;
      case K.SPEECH: case K.BARTER: return r(P.SPEAKER) ? 20 : 0;
      default: return 0;
    }
  };

  FO.difficultySkillBonus = function (n) {
    if (n < FO.SKILL.FIRST_AID) return 0;
    const level = FO.gameDifficulty ? FO.gameDifficulty() : 1;
    return level === 0 ? 20 : level === 2 ? -10 : 0;
  };

  FO.pcFlag = (o, f) => !!((o.pcFlags | 0) & (1 << f));

  FO.setPcFlag = function (o, f, on) {
    if (on) o.pcFlags = (o.pcFlags | 0) | (1 << f);
    else o.pcFlags = (o.pcFlags | 0) & ~(1 << f);
  };

  FO.isSneaking = o => !!(o && o.dude && FO.pcFlag(o, FO.PC_FLAG.SNEAK));
  FO.isSneakWorking = o => FO.isSneaking(o) && !!o.sneakWorking;

  FO.canRun = function (o) {
    if (o.critter && FO.DAM && (o.critter.results & (FO.DAM.CRIP_LEG_LEFT | FO.DAM.CRIP_LEG_RIGHT))) return false;
    return !(FO.isSneaking(o) && !perk(o, FO.PERK.SILENT_RUNNING));
  };

  FO.addExperience = function (o, n, onLevel) {
    const gain = n + Math.trunc(n * 5 * perk(o, FO.PERK.SWIFT_LEARNER) / 100);
    o.exp = Math.max(0, (o.exp | 0) + gain);
    const before = o.level || 1;
    while ((o.level || 1) < FO.MAX_LEVEL && o.exp >= FO.expForLevel((o.level || 1) + 1)) {
      o.level = (o.level || 1) + 1;
      if (onLevel) onLevel();
      FO.setPcFlag(o, FO.PC_FLAG.LEVEL, true);
      const hp = Math.trunc(FO.baseWithTraits(o, S.EN) / 2) + 2 + 4 * perk(o, FO.PERK.LIFEGIVER);
      if (o.critter) o.critter.hp = Math.min((o.critter.hp | 0) + hp, FO.statValue(o, S.MAX_HP));
      FO.addBonusStat(o, S.MAX_HP, hp);
    }
    return (o.level || 1) - before;
  };

  FO.levelCheck = function (o) {
    const level = o.level || 1;
    const last = o.lastLevel || 1;
    if (level !== last && level <= FO.MAX_LEVEL) {
      for (let lv = last + 1; lv <= level; lv++) {
        let sp = (o.skillPoints | 0) + 2 * FO.baseWithTraits(o, S.IN) + 5 + 2 * perk(o, FO.PERK.EDUCATED);
        if (hasTrait(o, T.GIFTED)) sp = Math.max(0, sp - 5);
        o.skillPoints = Math.min(SKILL_POINTS_CAP, sp);
        if (FO.ownedPerkCount(o, FO.MAX_FREE_PERKS_OWNED) >= FO.MAX_FREE_PERKS_OWNED) continue;
        if (lv % (hasTrait(o, T.SKILLED) ? 4 : 3) === 0) o.freePerk = true;
      }
    }
    o.lastLevel = level;
  };

  FO.rollVs = function (chance, critChance, rnd) {
    const margin = chance - rnd(1, 100);
    const late = !FO.gameTime || Math.floor((FO.gameTime() >>> 0) / DAY_TICKS) >= 1;
    if (margin >= 0) return [late && rnd(1, 100) <= Math.trunc(margin / 10) + (critChance | 0) ? FO.ROLL.CRIT_SUCCESS : FO.ROLL.SUCCESS, margin];
    return [late && rnd(1, 100) <= Math.trunc(-margin / 10) ? FO.ROLL.CRIT_FAIL : FO.ROLL.FAIL, margin];
  };

  FO.statLevelText = function (v) {
    return 200 + Math.max(0, Math.min(9, v - 1));
  };
})(globalThis.FO = globalThis.FO || {});
