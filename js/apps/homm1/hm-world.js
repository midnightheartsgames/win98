(function (H) {
  'use strict';

  const DIFFICULTY_PRESETS = {
    easy: {
      id: 'easy',
      name: 'Лёгкая',
      ratingMult: 0.8,
      humanGold: 10000,
      humanWoodOre: 30,
      humanRare: 10,
      aiGold: 5000,
      aiWoodOre: 15,
      aiRare: 5,
      aiDailyBonusGold: 0
    },
    normal: {
      id: 'normal',
      name: 'Нормальная',
      ratingMult: 1.0,
      humanGold: 7500,
      humanWoodOre: 20,
      humanRare: 5,
      aiGold: 7500,
      aiWoodOre: 20,
      aiRare: 5,
      aiDailyBonusGold: 150
    },
    hard: {
      id: 'hard',
      name: 'Сложная',
      ratingMult: 1.2,
      humanGold: 5000,
      humanWoodOre: 15,
      humanRare: 2,
      aiGold: 10000,
      aiWoodOre: 25,
      aiRare: 10,
      aiDailyBonusGold: 350
    },
    expert: {
      id: 'expert',
      name: 'Эксперт',
      ratingMult: 1.4,
      humanGold: 2500,
      humanWoodOre: 10,
      humanRare: 0,
      aiGold: 15000,
      aiWoodOre: 30,
      aiRare: 15,
      aiDailyBonusGold: 600
    },
    impossible: {
      id: 'impossible',
      name: 'Невозможная',
      ratingMult: 1.6,
      humanGold: 0,
      humanWoodOre: 5,
      humanRare: 0,
      aiGold: 25000,
      aiWoodOre: 40,
      aiRare: 20,
      aiDailyBonusGold: 1000
    }
  };

  function countArmyStacks(army) {
    if (!army) return 0;
    let c = 0;
    for (const s of army) {
      if (s && s.count > 0) c++;
    }
    return c;
  }

  function armyTotalPower(army) {
    if (!army) return 0;
    let total = 0;
    for (const s of army) {
      if (!s || s.count <= 0) continue;
      total += H.unitPower(s.unit) * s.count;
    }
    return Math.round(total);
  }

  function addStackToArmy(army, unitId, count) {
    if (!army || count <= 0) return false;
    for (let i = 0; i < H.ARMY_SLOTS; i++) {
      if (army[i] && army[i].unit === unitId && army[i].count > 0) {
        army[i].count += count;
        return true;
      }
    }
    for (let i = 0; i < H.ARMY_SLOTS; i++) {
      if (!army[i] || army[i].count <= 0) {
        army[i] = { unit: unitId, count };
        return true;
      }
    }
    return false;
  }

  class World {
    constructor(opts) {
      const o = opts || {};
      this.seed = o.seed || 2026;
      this.rng = new H.RNG(this.seed);
      this.difficulty = DIFFICULTY_PRESETS[o.difficulty] ? o.difficulty : 'normal';
      this.humanFaction = o.humanFaction || 'knight';
      this.campaignIndex = o.campaignIndex !== undefined ? o.campaignIndex : null;
      this.interactiveCombat = !!o.interactiveCombat;
      this.interactivePrompts = !!o.interactivePrompts;

      let spec = o.spec || null;
      if (!spec && this.campaignIndex !== null && H.CAMPAIGN_SCENARIOS[this.campaignIndex]) {
        spec = H.CAMPAIGN_SCENARIOS[this.campaignIndex];
      }
      if (!spec && o.standaloneId) {
        spec = H.STANDALONE_MAPS.find(m => m.id === o.standaloneId) || H.STANDALONE_MAPS[0];
      }
      if (!spec) spec = H.STANDALONE_MAPS[0];

      this.specId = spec.id;
      this.map = o.map || H.generateMap(spec, this.seed, this.humanFaction);
      if (!this.map.dugTiles) this.map.dugTiles = {};

      this.day = 1;
      this.week = 1;
      this.month = 1;
      this.totalDays = 1;
      this.weekOfUnit = null;
      this.monthEvent = null;

      this.players = [];
      this.heroes = [];
      this.usedHeroIds = new Set();
      this.activeCombat = null;
      this.combatContext = null;
      this.pendingPrompt = null;
      this.log = [];

      this.winner = null;
      this.loser = null;
      this.gameOver = false;
      this.winReason = null;

      if (!o.skipInitPlayers) {
        this.initPlayersAndStartingState(spec);
      }
    }

    totalWeeks() {
      return (this.month - 1) * 4 + this.week;
    }

    initPlayersAndStartingState(spec) {
      const playerCount = (spec && spec.players) || 4;
      const diff = DIFFICULTY_PRESETS[this.difficulty] || DIFFICULTY_PRESETS.normal;
      const N = this.map.w * this.map.h;

      const playerTowns = this.map.towns.filter(t => t.owner !== null);

      for (let i = 0; i < playerCount; i++) {
        const col = H.PLAYER_COLORS[i];
        const town = playerTowns.find(t => t.owner === col.id);
        const faction = town ? town.faction : H.FACTION_ORDER[i % H.FACTION_ORDER.length];
        const isHuman = (i === 0);
        const res = H.emptyResources();
        if (isHuman) {
          res.gold = diff.humanGold;
          res.wood = diff.humanWoodOre;
          res.ore = diff.humanWoodOre;
          res.mercury = diff.humanRare;
          res.sulfur = diff.humanRare;
          res.crystal = diff.humanRare;
          res.gems = diff.humanRare;
        } else {
          res.gold = diff.aiGold;
          res.wood = diff.aiWoodOre;
          res.ore = diff.aiWoodOre;
          res.mercury = diff.aiRare;
          res.sulfur = diff.aiRare;
          res.crystal = diff.aiRare;
          res.gems = diff.aiRare;
        }

        const pObj = {
          id: col.id,
          name: col.name,
          faction,
          rulerName: H.FACTIONS[faction].rulerName,
          isHuman,
          eliminated: false,
          daysWithoutTown: 0,
          resources: res,
          fog: new Uint8Array(N),
          obelisksVisited: [],
          tavernHeroes: [],
          identifiedHeroesToday: false,
          viewOverlay: {
            mines: false,
            resources: false,
            artifacts: false,
            towns: false,
            heroes: false
          }
        };
        this.players.push(pObj);

        if (town) {
          const hero = this.spawnNextHeroForPlayer(pObj.id, town.faction, town.x, town.y);
          if (hero) {
            H.visitTownMageGuild(hero, town);
          }
          this.revealFog(pObj.id, town.x, town.y, 6);
        }
        this.refreshTavernForPlayer(pObj);
      }

      this.currentPlayerIdx = 0;
      this.currentPlayer = this.players[0].id;
      const firstHero = this.heroes.find(h => h.owner === this.currentPlayer);
      const firstTown = this.map.towns.find(t => t.owner === this.currentPlayer);
      this.selectedHeroId = firstHero ? firstHero.id : null;
      this.selectedTownId = firstTown ? firstTown.id : null;
    }

    getPlayer(playerId) {
      return this.players.find(p => p.id === playerId) || null;
    }

    getHero(heroId) {
      return this.heroes.find(h => h.id === heroId) || null;
    }

    getTown(townId) {
      return this.map.towns.find(t => t.id === townId) || null;
    }

    getTownAt(x, y) {
      return this.map.towns.find(t => t.x === x && t.y === y) || null;
    }

    getHeroAt(x, y, excludeHeroId) {
      return this.heroes.find(h => h.id !== excludeHeroId && h.x === x && h.y === y) || null;
    }

    getPlayerHeroes(playerId) {
      return this.heroes.filter(h => h.owner === playerId);
    }

    getPlayerTowns(playerId) {
      return this.map.towns.filter(t => t.owner === playerId);
    }

    getPlayerMines(playerId) {
      return (this.map.mines || []).filter(m => m.owner === playerId);
    }

    arePlayersAllied(playerA, playerB) {
      if (playerA === playerB) return true;
      if (this.map.alliedRivals) {
        const pA = this.getPlayer(playerA);
        const pB = this.getPlayer(playerB);
        if (pA && pB && !pA.isHuman && !pB.isHuman) return true;
      }
      return false;
    }

    pickAvailableHeroProfile(preferredFaction) {
      const preferred = H.HERO_PROFILE_LIST.filter(p => p.faction === preferredFaction && !this.usedHeroIds.has(p.id));
      if (preferred.length > 0) return this.rng.pick(preferred);
      const any = H.HERO_PROFILE_LIST.filter(p => !this.usedHeroIds.has(p.id));
      if (any.length > 0) return this.rng.pick(any);
      return this.rng.pick(H.HERO_PROFILE_LIST);
    }

    spawnNextHeroForPlayer(playerId, faction, x, y) {
      const prof = this.pickAvailableHeroProfile(faction);
      if (!prof) return null;
      this.usedHeroIds.add(prof.id);
      const hero = H.createHero(prof.id, playerId, this.rng);
      hero.x = x;
      hero.y = y;
      this.recalcHeroMaxMove(hero);
      hero.move = hero.maxMove;
      this.heroes.push(hero);
      const radius = 5 + (H.FACTIONS[hero.faction] ? H.FACTIONS[hero.faction].scoutBonus : 0);
      this.revealFog(playerId, x, y, radius);
      return hero;
    }

    refreshTavernForPlayer(player) {
      if (!player) return;
      player.tavernHeroes = [];
      const first = this.pickAvailableHeroProfile(player.faction);
      if (first) {
        this.usedHeroIds.add(first.id);
        player.tavernHeroes.push(H.createHero(first.id, player.id, this.rng));
      }
      const otherFactions = H.FACTION_ORDER.filter(f => f !== player.faction);
      const secondFaction = this.rng.pick(otherFactions) || player.faction;
      const second = this.pickAvailableHeroProfile(secondFaction);
      if (second) {
        this.usedHeroIds.add(second.id);
        player.tavernHeroes.push(H.createHero(second.id, player.id, this.rng));
      }
    }

    revealFog(playerId, cx, cy, radius) {
      const p = this.getPlayer(playerId);
      if (!p || !p.fog) return;
      const r = Math.max(1, radius | 0);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r + r) continue;
          const x = cx + dx;
          const y = cy + dy;
          if (!H.inBounds(this.map, x, y)) continue;
          p.fog[H.tileIndex(this.map, x, y)] = 1;
        }
      }
    }

    isTileVisible(playerId, x, y) {
      const p = this.getPlayer(playerId);
      if (!p || !H.inBounds(this.map, x, y)) return false;
      return !!p.fog[H.tileIndex(this.map, x, y)];
    }

    countPlayerLighthouses(playerId) {
      let c = 0;
      for (const o of this.map.objects || []) {
        if (!o.removed && o.type === 'lighthouse' && o.owner === playerId) c++;
      }
      return c;
    }

    recalcHeroMaxMove(hero) {
      if (!hero) return;
      H.recalcHeroStats(hero);
      if (hero.inBoat) {
        const f = H.FACTIONS[hero.faction] || H.FACTIONS.knight;
        const baseSea = Math.round(1500 * (f.seaBonus || 1.0));
        const lhBonus = this.countPlayerLighthouses(hero.owner) * 500;
        hero.maxMove = baseSea + (hero.moveSeaBonus || 0) + lhBonus;
      }
    }

    playerDailyIncome(playerId) {
      const income = H.emptyResources();
      for (const t of this.getPlayerTowns(playerId)) {
        income.gold += H.townDailyIncome(t);
      }
      for (const m of this.getPlayerMines(playerId)) {
        const rDef = H.RESOURCES[m.res];
        if (rDef) income[m.res] += rDef.daily;
      }
      for (const h of this.getPlayerHeroes(playerId)) {
        if (h.dailyGold) income.gold += h.dailyGold;
      }
      const p = this.getPlayer(playerId);
      if (p && !p.isHuman) {
        const diff = DIFFICULTY_PRESETS[this.difficulty] || DIFFICULTY_PRESETS.normal;
        income.gold += diff.aiDailyBonusGold;
      }
      return income;
    }

    buildInTown(townId, buildingId) {
      const town = this.getTown(townId);
      if (!town) return { ok: false, reason: 'no_town' };
      const player = this.getPlayer(town.owner);
      if (!player) return { ok: false, reason: 'no_owner' };
      const check = H.canBuildInTown(town, buildingId, player.resources);
      if (!check.ok) return check;

      H.spendResources(player.resources, check.def.cost);
      town.buildings[buildingId] = true;
      town.builtToday = true;

      if (check.def.tier) {
        const u = H.UNITS[check.def.unit];
        if (u) {
          town.available[check.def.tier] = (town.available[check.def.tier] || 0) + u.growth;
        }
      }

      if (check.def.guildLevel) {
        const visitingHero = this.getHeroAt(town.x, town.y);
        if (visitingHero && visitingHero.owner === town.owner) {
          H.visitTownMageGuild(visitingHero, town);
        }
      }

      this.log.push(`${player.name}: в городе ${town.name} возведена постройка «${check.def.name}».`);
      return { ok: true, building: check.def };
    }

    recruitInTown(townId, tier, count, toHero) {
      const town = this.getTown(townId);
      if (!town) return { ok: false, reason: 'no_town' };
      const player = this.getPlayer(town.owner);
      if (!player) return { ok: false, reason: 'no_owner' };
      const f = H.FACTIONS[town.faction];
      const dw = f && f.dwellings['dwell_' + tier];
      if (!dw || !town.buildings[dw.id]) return { ok: false, reason: 'no_dwelling' };

      const avail = town.available[tier] || 0;
      const n = Math.min(avail, count | 0);
      if (n <= 0) return { ok: false, reason: 'none_available' };

      const unitDef = H.UNITS[dw.unit];
      const totalCost = H.scaleCost(unitDef.cost, n);
      if (!H.canAfford(player.resources, totalCost)) {
        return { ok: false, reason: 'cannot_afford' };
      }

      const visitingHero = toHero ? this.getHeroAt(town.x, town.y) : null;
      const preferHero = !!(visitingHero && visitingHero.owner === town.owner);
      let placedIn = preferHero ? 'hero' : 'garrison';
      let added = addStackToArmy(preferHero ? visitingHero.army : town.garrison, unitDef.id, n);
      if (!added && preferHero) {
        added = addStackToArmy(town.garrison, unitDef.id, n);
        placedIn = 'garrison';
      } else if (!added && !preferHero && visitingHero && visitingHero.owner === town.owner) {
        added = addStackToArmy(visitingHero.army, unitDef.id, n);
        placedIn = 'hero';
      }
      if (!added) {
        return { ok: false, reason: 'army_full' };
      }

      H.spendResources(player.resources, totalCost);
      town.available[tier] -= n;
      if (visitingHero) this.recalcHeroMaxMove(visitingHero);
      return { ok: true, unit: unitDef.id, count: n, placedIn };
    }

    transferAllGarrisonToHero(townId) {
      const town = this.getTown(townId);
      if (!town) return { ok: false, reason: 'no_town' };
      const visitingHero = this.getHeroAt(town.x, town.y);
      if (!visitingHero || visitingHero.owner !== town.owner) {
        return { ok: false, reason: 'no_visiting_hero' };
      }
      let moved = 0;
      for (let i = 0; i < H.ARMY_SLOTS; i++) {
        const g = town.garrison[i];
        if (!g || g.count <= 0) continue;
        if (addStackToArmy(visitingHero.army, g.unit, g.count)) {
          town.garrison[i] = null;
          moved++;
        }
      }
      this.recalcHeroMaxMove(visitingHero);
      return { ok: moved > 0, moved };
    }

    hireHeroInTown(townId, tavernSlotIdx) {
      const town = this.getTown(townId);
      if (!town) return { ok: false, reason: 'no_town' };
      if (!town.buildings.tavern) return { ok: false, reason: 'no_tavern' };
      const player = this.getPlayer(town.owner);
      if (!player) return { ok: false, reason: 'no_owner' };
      if (this.getPlayerHeroes(player.id).length >= H.MAX_ACTIVE_HEROES) {
        return { ok: false, reason: 'max_heroes' };
      }
      if (this.getHeroAt(town.x, town.y)) {
        return { ok: false, reason: 'gate_occupied' };
      }
      if (player.resources.gold < H.HERO_HIRE_COST) {
        return { ok: false, reason: 'cannot_afford' };
      }
      const idx = tavernSlotIdx || 0;
      const hero = player.tavernHeroes[idx];
      if (!hero) return { ok: false, reason: 'no_hero_in_slot' };

      player.resources.gold -= H.HERO_HIRE_COST;
      hero.owner = player.id;
      hero.x = town.x;
      hero.y = town.y;
      this.recalcHeroMaxMove(hero);
      hero.move = hero.maxMove;
      H.visitTownMageGuild(hero, town);
      this.heroes.push(hero);

      const radius = 5 + (H.FACTIONS[hero.faction] ? H.FACTIONS[hero.faction].scoutBonus : 0);
      this.revealFog(player.id, town.x, town.y, radius);

      const replacementProf = this.pickAvailableHeroProfile(player.faction);
      if (replacementProf) {
        this.usedHeroIds.add(replacementProf.id);
        player.tavernHeroes[idx] = H.createHero(replacementProf.id, player.id, this.rng);
      } else {
        player.tavernHeroes.splice(idx, 1);
      }

      this.selectedHeroId = hero.id;
      return { ok: true, hero };
    }

    buySpellbookInTown(townId, heroId) {
      const town = this.getTown(townId);
      const hero = this.getHero(heroId) || (town ? this.getHeroAt(town.x, town.y) : null);
      if (!town || !hero) return { ok: false, reason: 'missing_target' };
      if (H.townMageGuildLevel(town) < 1) return { ok: false, reason: 'no_mage_guild' };
      if (hero.hasSpellbook) return { ok: false, reason: 'already_has_book' };
      const player = this.getPlayer(hero.owner);
      if (!player || player.resources.gold < H.SPELLBOOK_COST) {
        return { ok: false, reason: 'cannot_afford' };
      }
      player.resources.gold -= H.SPELLBOOK_COST;
      hero.hasSpellbook = true;
      H.visitTownMageGuild(hero, town);
      return { ok: true };
    }

    buildBoatInTown(townId) {
      const town = this.getTown(townId);
      if (!town || !town.buildings.shipyard) return { ok: false, reason: 'no_shipyard' };
      const player = this.getPlayer(town.owner);
      if (!player || !H.canAfford(player.resources, H.BOAT_COST)) {
        return { ok: false, reason: 'cannot_afford' };
      }
      let waterSpot = null;
      for (let dy = -3; dy <= 3 && !waterSpot; dy++) {
        for (let dx = -3; dx <= 3 && !waterSpot; dx++) {
          const nx = town.x + dx;
          const ny = town.y + dy;
          if (!H.inBounds(this.map, nx, ny)) continue;
          if (H.terrainAt(this.map, nx, ny) !== 'water') continue;
          const existing = (this.map.boats || []).find(b => b.x === nx && b.y === ny);
          if (!existing) waterSpot = { x: nx, y: ny };
        }
      }
      if (!waterSpot) return { ok: false, reason: 'no_water_spot' };

      H.spendResources(player.resources, H.BOAT_COST);
      const boat = {
        id: 'boat_built_' + (this.map.boats.length + 1),
        x: waterSpot.x,
        y: waterSpot.y,
        occupied: false
      };
      this.map.boats.push(boat);
      return { ok: true, boat };
    }

    swapArmySlots(holderA, slotA, holderB, slotB) {
      const armyA = holderA.army || holderA.garrison;
      const armyB = holderB.army || holderB.garrison;
      if (!armyA || !armyB) return { ok: false, reason: 'invalid_holder' };
      const sA = armyA[slotA];
      const sB = armyB[slotB];
      if (!sA && !sB) return { ok: false, reason: 'empty_slots' };

      if (sA && sB && sA.unit === sB.unit && !(holderA === holderB && slotA === slotB)) {
        if (holderA.army && countArmyStacks(armyA) <= 1) {
          if (sA.count <= 1) return { ok: false, reason: 'last_unit' };
          sB.count += sA.count - 1;
          sA.count = 1;
        } else {
          sB.count += sA.count;
          armyA[slotA] = null;
        }
      } else {
        if (holderA !== holderB && holderA.army && !sB && countArmyStacks(armyA) <= 1) {
          return { ok: false, reason: 'hero_needs_one_stack' };
        }
        armyA[slotA] = sB || null;
        armyB[slotB] = sA || null;
      }

      if (holderA.army) this.recalcHeroMaxMove(holderA);
      if (holderB.army) this.recalcHeroMaxMove(holderB);
      return { ok: true };
    }

    splitArmyStack(holderA, slotA, holderB, slotB, splitCount) {
      const armyA = holderA.army || holderA.garrison;
      const armyB = holderB.army || holderB.garrison;
      if (!armyA || !armyB) return { ok: false, reason: 'invalid_holder' };
      const sA = armyA[slotA];
      if (!sA || sA.count <= 1) return { ok: false, reason: 'cannot_split' };
      const n = H.clamp(splitCount | 0, 1, sA.count - 1);
      const sB = armyB[slotB];
      if (sB && sB.unit !== sA.unit) return { ok: false, reason: 'slot_occupied' };

      sA.count -= n;
      if (sB) {
        sB.count += n;
      } else {
        armyB[slotB] = { unit: sA.unit, count: n };
      }
      if (holderA.army) this.recalcHeroMaxMove(holderA);
      if (holderB.army) this.recalcHeroMaxMove(holderB);
      return { ok: true };
    }

    transferArtifactBetweenHeroes(fromHero, toHero, artIndex) {
      if (!fromHero || !toHero || !fromHero.artifacts) return { ok: false, reason: 'invalid_hero' };
      const artId = fromHero.artifacts[artIndex];
      if (!artId) return { ok: false, reason: 'no_artifact' };
      const artDef = H.ARTIFACTS[artId];
      if (artDef && artDef.cursed) return { ok: false, reason: 'cursed_artifact' };
      if ((toHero.artifacts || []).length >= H.ARTIFACT_SLOTS) {
        return { ok: false, reason: 'bag_full' };
      }
      fromHero.artifacts.splice(artIndex, 1);
      toHero.artifacts.push(artId);
      this.recalcHeroMaxMove(fromHero);
      this.recalcHeroMaxMove(toHero);
      return { ok: true, artifactId: artId };
    }

    getThievesGuildReport() {
      const report = [];
      for (const p of this.players) {
        if (p.eliminated) continue;
        const towns = this.getPlayerTowns(p.id);
        const castles = towns.filter(t => t.buildings && t.buildings.castle).length;
        const villages = towns.length - castles;
        const heroes = this.getPlayerHeroes(p.id);
        let bestHero = null;
        let bestPower = -1;
        for (const h of heroes) {
          const pwr = armyTotalPower(h.army);
          if (pwr > bestPower) {
            bestPower = pwr;
            bestHero = h;
          }
        }
        report.push({
          playerId: p.id,
          playerName: p.name,
          rulerName: p.rulerName,
          castles,
          villages,
          gold: p.resources.gold,
          woodOre: p.resources.wood + p.resources.ore,
          rareRes: p.resources.mercury + p.resources.sulfur + p.resources.crystal + p.resources.gems,
          obelisks: p.obelisksVisited.length,
          bestHeroName: bestHero ? bestHero.name : 'Нет',
          armyStrength: bestPower
        });
      }
      return report;
    }

    stepHeroTo(hero, nx, ny, isFinalTarget, choice) {
      if (!hero || hero.move <= 0) return { ok: false, reason: 'no_move' };
      const enter = H.canEnterTile(this, hero, hero.x, hero.y, nx, ny, !!isFinalTarget);
      if (!enter.ok) return { ok: false, reason: 'blocked' };

      const cost = H.stepCost(this, hero, hero.x, hero.y, nx, ny);
      hero.move = Math.max(0, hero.move - cost);

      const radius = 5 + (H.FACTIONS[hero.faction] ? H.FACTIONS[hero.faction].scoutBonus : 0);

      if (enter.action === 'board_boat') {
        const boat = this.map.boats.find(b => !b.occupied && b.x === nx && b.y === ny);
        if (boat) {
          boat.occupied = true;
          boat.heroId = hero.id;
        }
        hero.x = nx;
        hero.y = ny;
        hero.inBoat = true;
        hero.move = 0;
        this.recalcHeroMaxMove(hero);
        this.revealFog(hero.owner, nx, ny, radius);
        return { ok: true, event: 'board_boat', stop: true };
      }

      if (enter.action === 'disembark') {
        const boat = this.map.boats.find(b => b.heroId === hero.id || (b.x === hero.x && b.y === hero.y));
        if (boat) {
          boat.occupied = false;
          boat.heroId = null;
          boat.x = hero.x;
          boat.y = hero.y;
        }
        hero.x = nx;
        hero.y = ny;
        hero.inBoat = false;
        hero.move = 0;
        this.recalcHeroMaxMove(hero);
        this.revealFog(hero.owner, nx, ny, radius);
        return { ok: true, event: 'disembark', stop: true };
      }

      if (enter.action === 'meet_hero') {
        const other = this.getHeroAt(nx, ny, hero.id);
        return { ok: true, event: 'meet_hero', otherHero: other, stop: true };
      }

      if (enter.action === 'attack_hero') {
        const enemyHero = this.getHeroAt(nx, ny, hero.id);
        if (enemyHero && this.arePlayersAllied(hero.owner, enemyHero.owner)) {
          return { ok: true, event: 'meet_ally', otherHero: enemyHero, stop: true };
        }
        return this.initiateCombat({
          type: 'hero',
          attackerHero: hero,
          defenderHero: enemyHero,
          targetX: nx,
          targetY: ny
        });
      }

      if (enter.action === 'enter_town') {
        const town = this.getTownAt(nx, ny);
        if (!town) return { ok: false, reason: 'no_town' };
        if (town.owner === hero.owner || this.arePlayersAllied(hero.owner, town.owner)) {
          hero.x = nx;
          hero.y = ny;
          this.revealFog(hero.owner, nx, ny, radius);
          H.visitTownMageGuild(hero, town);
          return { ok: true, event: 'visit_town', town, stop: true };
        }
        const defendingHero = this.getHeroAt(nx, ny, hero.id);
        const hasGarrison = countArmyStacks(town.garrison) > 0;
        if (!defendingHero && !hasGarrison) {
          town.owner = hero.owner;
          hero.x = nx;
          hero.y = ny;
          this.revealFog(hero.owner, nx, ny, radius);
          H.visitTownMageGuild(hero, town);
          this.checkWinLoss();
          return { ok: true, event: 'capture_town', town, stop: true };
        }
        return this.initiateCombat({
          type: 'town',
          attackerHero: hero,
          defenderHero: defendingHero || null,
          town,
          targetX: nx,
          targetY: ny
        });
      }

      const mineAtTarget = (this.map.mines || []).find(m => m.x === nx && m.y === ny);
      const objAtTarget = (this.map.objects || []).find(o => !o.removed && o.x === nx && o.y === ny);
      const directMonster = objAtTarget && objAtTarget.type === 'monster' ? objAtTarget : null;
      const guard = directMonster || ((isFinalTarget && (mineAtTarget || objAtTarget)) ? H.findGuardMonsterAtOrAdjacent(this, hero.owner, nx, ny) : null);
      if (guard) {
        return this.initiateCombat({
          type: 'monster',
          attackerHero: hero,
          monsterObj: guard,
          targetX: nx,
          targetY: ny
        });
      }

      hero.x = nx;
      hero.y = ny;
      if (hero.inBoat) {
        const boat = this.map.boats.find(b => b.heroId === hero.id);
        if (boat) {
          boat.x = nx;
          boat.y = ny;
        }
      }
      this.revealFog(hero.owner, nx, ny, radius);

      if (mineAtTarget && mineAtTarget.owner !== hero.owner) {
        mineAtTarget.owner = hero.owner;
        this.log.push(`${this.getPlayer(hero.owner).name}: захвачена шахта (${H.RESOURCES[mineAtTarget.res].name}).`);
        return { ok: true, event: 'capture_mine', mine: mineAtTarget, stop: !!isFinalTarget };
      }

      const obj = (this.map.objects || []).find(o => !o.removed && o.x === nx && o.y === ny);
      if (obj) {
        const res = this.interactWithObject(hero, obj, choice);
        return Object.assign({ ok: true, stop: true }, res);
      }

      return { ok: true, event: 'step', stop: false };
    }

    moveHeroAlongPath(hero, pathSteps, choice) {
      if (!hero || !pathSteps || !pathSteps.length) return { ok: false, stepsTaken: 0, events: [] };
      const events = [];
      let stepsTaken = 0;
      for (let i = 0; i < pathSteps.length; i++) {
        if (hero.move <= 0) break;
        const st = pathSteps[i];
        const isFinal = (i === pathSteps.length - 1);
        const res = this.stepHeroTo(hero, st.x, st.y, isFinal, choice);
        if (!res.ok) break;
        stepsTaken++;
        events.push(res);
        if (res.stop || this.activeCombat || this.gameOver) break;
      }
      return { ok: stepsTaken > 0, stepsTaken, events, lastEvent: events[events.length - 1] || null };
    }

    interactWithObject(hero, obj, choice) {
      const player = this.getPlayer(hero.owner);
      if (!player || !obj || obj.removed) return { event: 'none' };
      const needsInteractiveChoice = choice === undefined && this.interactivePrompts && player.isHuman;

      switch (obj.type) {
        case 'chest': {
          if (needsInteractiveChoice) {
            return { event: 'prompt_choice', promptType: 'chest', obj };
          }
          const pick = choice || 'gold';
          obj.removed = true;
          if (pick === 'xp') {
            const xp = obj.xp || 1000;
            const lvlUps = H.grantHeroXp(hero, xp, this.rng);
            return { event: 'chest_xp', xp, levelUps: lvlUps };
          }
          const gold = obj.gold || 1500;
          player.resources.gold += gold;
          return { event: 'chest_gold', gold };
        }
        case 'campfire': {
          const gold = obj.gold || 500;
          const bRes = obj.bonusRes || 'wood';
          const bAmt = obj.bonusAmt || 5;
          player.resources.gold += gold;
          player.resources[bRes] = (player.resources[bRes] || 0) + bAmt;
          obj.removed = true;
          return { event: 'campfire', gold, bonusRes: bRes, bonusAmt: bAmt };
        }
        case 'resource_pile': {
          const r = obj.res || 'gold';
          const amt = obj.amount || (r === 'gold' ? 500 : 8);
          player.resources[r] = (player.resources[r] || 0) + amt;
          obj.removed = true;
          return { event: 'resource_pile', res: r, amount: amt };
        }
        case 'artifact': {
          const aId = obj.artifactId || 'thunder_mace';
          if (!H.giveHeroArtifact(hero, aId)) {
            return { event: 'artifact_bag_full', artifactId: aId };
          }
          this.recalcHeroMaxMove(hero);
          obj.removed = true;
          return { event: 'artifact_picked', artifactId: aId };
        }
        case 'windmill': {
          const w = this.totalWeeks();
          if (obj.visitedWeek === w) return { event: 'already_visited', objType: 'windmill' };
          obj.visitedWeek = w;
          const rare = this.rng.pick(['mercury', 'sulfur', 'crystal', 'gems']);
          player.resources[rare] += 2;
          return { event: 'windmill', res: rare, amount: 2 };
        }
        case 'water_wheel': {
          const w = this.totalWeeks();
          if (obj.visitedWeek === w) return { event: 'already_visited', objType: 'water_wheel' };
          obj.visitedWeek = w;
          const gold = w === 1 ? 500 : 1000;
          player.resources.gold += gold;
          return { event: 'water_wheel', gold };
        }
        case 'gazebo': {
          if (hero.visited[obj.id]) return { event: 'already_visited', objType: 'gazebo' };
          hero.visited[obj.id] = true;
          const lvlUps = H.grantHeroXp(hero, 1000, this.rng);
          return { event: 'gazebo', xp: 1000, levelUps: lvlUps };
        }
        case 'fort': {
          if (hero.visited[obj.id]) return { event: 'already_visited', objType: 'fort' };
          if (needsInteractiveChoice) {
            return { event: 'prompt_choice', promptType: 'fort', obj };
          }
          hero.visited[obj.id] = true;
          const stat = choice === 'def' ? 'def' : 'atk';
          hero.baseStats[stat] += 1;
          this.recalcHeroMaxMove(hero);
          return { event: 'fort', stat };
        }
        case 'canyon': {
          if (hero.visited[obj.id]) return { event: 'already_visited', objType: 'canyon' };
          if (needsInteractiveChoice) {
            return { event: 'prompt_choice', promptType: 'canyon', obj };
          }
          hero.visited[obj.id] = true;
          const stat = choice === 'knowledge' ? 'knowledge' : 'power';
          hero.baseStats[stat] += 1;
          this.recalcHeroMaxMove(hero);
          return { event: 'canyon', stat };
        }
        case 'xanadu': {
          if (hero.visited[obj.id]) return { event: 'already_visited', objType: 'xanadu' };
          hero.visited[obj.id] = true;
          hero.baseStats.atk += 1;
          hero.baseStats.def += 1;
          hero.baseStats.power += 1;
          hero.baseStats.knowledge += 1;
          this.recalcHeroMaxMove(hero);
          return { event: 'xanadu' };
        }
        case 'shrine': {
          const spId = obj.spell || 'lightning_bolt';
          const learned = H.learnAndReplenishSpell(hero, spId);
          return { event: 'shrine', spell: spId, learned };
        }
        case 'obelisk': {
          const idx = obj.index || 0;
          if (!player.obelisksVisited.includes(idx)) {
            player.obelisksVisited.push(idx);
          }
          return { event: 'obelisk', index: idx, totalVisited: player.obelisksVisited.length, totalObelisks: (this.map.obelisks || []).length || 4 };
        }
        case 'fountain': {
          if (hero.visited[obj.id]) return { event: 'already_visited', objType: 'fountain' };
          hero.visited[obj.id] = true;
          hero.tempLuck = (hero.tempLuck || 0) + 1;
          H.recalcHeroStats(hero);
          return { event: 'fountain' };
        }
        case 'temple': {
          if (hero.visited[obj.id]) return { event: 'already_visited', objType: 'temple' };
          hero.visited[obj.id] = true;
          hero.tempMorale = (hero.tempMorale || 0) + 2;
          H.recalcHeroStats(hero);
          return { event: 'temple' };
        }
        case 'oasis': {
          if (hero.visited[obj.id]) return { event: 'already_visited', objType: 'oasis' };
          hero.visited[obj.id] = true;
          hero.tempMorale = (hero.tempMorale || 0) + 1;
          hero.move += 800;
          H.recalcHeroStats(hero);
          return { event: 'oasis' };
        }
        case 'watering_hole': {
          if (hero.visited[obj.id]) return { event: 'already_visited', objType: 'watering_hole' };
          hero.visited[obj.id] = true;
          hero.tempMorale = (hero.tempMorale || 0) + 1;
          hero.move += 400;
          H.recalcHeroStats(hero);
          return { event: 'watering_hole' };
        }
        case 'watchtower': {
          this.revealFog(hero.owner, obj.x, obj.y, 10);
          return { event: 'watchtower' };
        }
        case 'observatory': {
          this.revealFog(hero.owner, obj.x, obj.y, 20);
          return { event: 'observatory' };
        }
        case 'lighthouse': {
          obj.owner = hero.owner;
          for (const h of this.getPlayerHeroes(hero.owner)) {
            this.recalcHeroMaxMove(h);
          }
          return { event: 'lighthouse' };
        }
        case 'graveyard': {
          if (obj.cleared) return { event: 'already_visited', objType: 'graveyard' };
          obj.cleared = true;
          player.resources.gold += 2000;
          const pool = H.ARTIFACT_LIST.filter(a => a.tier <= 2 && !a.cursed);
          const art = this.rng.pick(pool);
          if (art) H.giveHeroArtifact(hero, art.id);
          hero.tempMorale = (hero.tempMorale || 0) - 1;
          this.recalcHeroMaxMove(hero);
          return { event: 'graveyard', gold: 2000, artifactId: art ? art.id : null };
        }
        case 'shipwreck': {
          if (obj.cleared) return { event: 'already_visited', objType: 'shipwreck' };
          obj.cleared = true;
          player.resources.gold += 2500;
          const pool = H.ARTIFACT_LIST.filter(a => a.tier <= 3 && !a.cursed && !a.ultimate);
          const art = this.rng.pick(pool);
          if (art) H.giveHeroArtifact(hero, art.id);
          this.recalcHeroMaxMove(hero);
          return { event: 'shipwreck', gold: 2500, artifactId: art ? art.id : null };
        }
        case 'daemon_cave': {
          if (obj.cleared) return { event: 'already_visited', objType: 'daemon_cave' };
          if (needsInteractiveChoice) {
            return { event: 'prompt_choice', promptType: 'daemon_cave', obj };
          }
          obj.cleared = true;
          const outcome = choice || this.rng.pick(['xp', 'gold_art', 'gold']);
          if (outcome === 'xp') {
            const lvlUps = H.grantHeroXp(hero, 1000, this.rng);
            return { event: 'daemon_cave', sub: 'xp', xp: 1000, levelUps: lvlUps };
          }
          if (outcome === 'ransom') {
            if (player.resources.gold >= 2500) {
              player.resources.gold -= 2500;
              return { event: 'daemon_cave', sub: 'ransom_paid', gold: -2500 };
            }
            this.removeHero(hero, false);
            return { event: 'daemon_cave', sub: 'hero_slain' };
          }
          player.resources.gold += 2500;
          const pool = H.ARTIFACT_LIST.filter(a => a.tier <= 3 && !a.cursed && !a.ultimate);
          const art = this.rng.pick(pool);
          if (art) H.giveHeroArtifact(hero, art.id);
          this.recalcHeroMaxMove(hero);
          return { event: 'daemon_cave', sub: 'gold_art', gold: 2500, artifactId: art ? art.id : null };
        }
        case 'dragon_utopia': {
          if (obj.cleared) return { event: 'already_visited', objType: 'dragon_utopia' };
          return this.initiateCombat({
            type: 'utopia',
            attackerHero: hero,
            utopiaObj: obj,
            targetX: obj.x,
            targetY: obj.y
          });
        }
        case 'sphinx': {
          if (obj.cleared) return { event: 'already_visited', objType: 'sphinx' };
          if (needsInteractiveChoice) {
            return { event: 'prompt_choice', promptType: 'sphinx', obj };
          }
          const rIdx = (obj.riddleIdx || 0) % H.SPHINX_RIDDLES.length;
          const riddle = H.SPHINX_RIDDLES[rIdx];
          const ans = choice !== undefined ? choice : riddle.answer;
          if (ans === riddle.answer) {
            obj.cleared = true;
            player.resources.gold += 3000;
            const pool = H.ARTIFACT_LIST.filter(a => a.tier >= 2 && !a.ultimate && !a.cursed);
            const art = this.rng.pick(pool);
            if (art) H.giveHeroArtifact(hero, art.id);
            this.recalcHeroMaxMove(hero);
            return { event: 'sphinx_correct', gold: 3000, artifactId: art ? art.id : null };
          }
          this.removeHero(hero, false);
          return { event: 'sphinx_wrong' };
        }
        case 'teleporter': {
          const peers = (this.map.objects || []).filter(o => o.type === 'teleporter' && o.channel === obj.channel && o.id !== obj.id);
          const freePeer = peers.find(p => !this.getHeroAt(p.x, p.y, hero.id));
          if (freePeer) {
            hero.x = freePeer.x;
            hero.y = freePeer.y;
            const radius = 5 + (H.FACTIONS[hero.faction] ? H.FACTIONS[hero.faction].scoutBonus : 0);
            this.revealFog(hero.owner, hero.x, hero.y, radius);
            return { event: 'teleported', toX: hero.x, toY: hero.y };
          }
          return { event: 'teleporter_blocked' };
        }
        case 'signpost': {
          return { event: 'signpost', text: obj.text || 'Королевский тракт Энрота.' };
        }
        default:
          return { event: obj.type };
      }
    }

    initiateCombat(ctx) {
      const attackerHero = ctx.attackerHero;
      const defenderHero = ctx.defenderHero || null;
      let defenderArg = null;
      let siege = false;
      let town = ctx.town || null;

      if (ctx.type === 'monster' && ctx.monsterObj) {
        const m = ctx.monsterObj;
        defenderArg = { army: [{ unit: m.unit, count: m.count }, null, null, null, null] };
      } else if (ctx.type === 'utopia') {
        defenderArg = {
          army: [
            { unit: 'dragon', count: 3 },
            { unit: 'hydra', count: 5 },
            null,
            null,
            null
          ]
        };
      } else if (ctx.type === 'hero' && defenderHero) {
        defenderArg = defenderHero;
      } else if (ctx.type === 'town' && town) {
        siege = !!(town.buildings && town.buildings.castle);
        if (defenderHero && countArmyStacks(defenderHero.army) >= countArmyStacks(town.garrison)) {
          defenderArg = defenderHero;
        } else {
          defenderArg = { hero: defenderHero, army: town.garrison };
        }
      }

      const terrain = H.terrainAt(this.map, ctx.targetX, ctx.targetY);
      const combat = new H.Combat(attackerHero, defenderArg, {
        siege,
        town,
        terrain,
        seed: this.rng.int(1, 999999)
      });

      this.activeCombat = combat;
      this.combatContext = ctx;

      if (!this.interactiveCombat || !this.getPlayer(attackerHero.owner).isHuman) {
        combat.runAutoCombat();
        return this.finishActiveCombat();
      }

      return { ok: true, event: 'combat_started', combat, stop: true };
    }

    finishActiveCombat() {
      const combat = this.activeCombat;
      const ctx = this.combatContext;
      if (!combat || !ctx) return { ok: false, reason: 'no_active_combat' };

      const attacker = ctx.attackerHero;
      const defender = ctx.defenderHero;

      if (attacker) {
        attacker.visited = {};
        this.recalcHeroMaxMove(attacker);
      }
      if (defender) {
        defender.visited = {};
        this.recalcHeroMaxMove(defender);
      }

      const xpGained = combat.xpAwarded || 0;
      const levelUps = combat.levelUps || [];
      this.activeCombat = null;
      this.combatContext = null;

      if (combat.winner === 'attacker') {
        if (countArmyStacks(attacker.army) === 0) {
          const f = H.FACTIONS[attacker.faction] || H.FACTIONS.knight;
          attacker.army[0] = { unit: f.units[0], count: 1 };
        }
        this.recalcHeroMaxMove(attacker);
        const radius = 5 + (H.FACTIONS[attacker.faction] ? H.FACTIONS[attacker.faction].scoutBonus : 0);

        if (ctx.type === 'monster' && ctx.monsterObj) {
          ctx.monsterObj.removed = true;
          attacker.x = ctx.targetX;
          attacker.y = ctx.targetY;
          this.revealFog(attacker.owner, attacker.x, attacker.y, radius);
          const guardedMine = (this.map.mines || []).find(m => m.x === attacker.x && m.y === attacker.y);
          if (guardedMine && guardedMine.owner !== attacker.owner) {
            guardedMine.owner = attacker.owner;
            this.log.push(`${this.getPlayer(attacker.owner).name}: захвачена шахта (${H.RESOURCES[guardedMine.res].name}).`);
          }
        } else if (ctx.type === 'utopia' && ctx.utopiaObj) {
          ctx.utopiaObj.cleared = true;
          const p = this.getPlayer(attacker.owner);
          if (p) p.resources.gold += 20000;
          const tier3 = H.ARTIFACT_LIST.filter(a => a.tier === 3 && !a.ultimate && !a.cursed);
          const a1 = this.rng.pick(tier3);
          const a2 = this.rng.pick(tier3);
          if (a1) H.giveHeroArtifact(attacker, a1.id);
          if (a2 && a2.id !== (a1 && a1.id)) H.giveHeroArtifact(attacker, a2.id);
          this.recalcHeroMaxMove(attacker);
        } else if (ctx.type === 'hero' && defender) {
          this.removeHero(defender, !!(combat.outcome && (combat.outcome.includes('fled') || combat.outcome.includes('retreated') || combat.outcome.includes('surrendered'))));
          attacker.x = ctx.targetX;
          attacker.y = ctx.targetY;
          this.revealFog(attacker.owner, attacker.x, attacker.y, radius);
        } else if (ctx.type === 'town' && ctx.town) {
          if (defender) {
            this.removeHero(defender, false);
          }
          ctx.town.owner = attacker.owner;
          ctx.town.garrison = new Array(H.ARMY_SLOTS).fill(null);
          attacker.x = ctx.town.x;
          attacker.y = ctx.town.y;
          this.revealFog(attacker.owner, attacker.x, attacker.y, radius);
          H.visitTownMageGuild(attacker, ctx.town);
        }

        this.checkWinLoss();
        return {
          ok: true,
          event: 'combat_victory',
          winner: 'attacker',
          xpGained,
          levelUps,
          capturedArtifacts: combat.capturedArtifacts,
          stop: true
        };
      }

      const retreated = !!(combat.outcome && (combat.outcome.includes('fled') || combat.outcome.includes('retreated') || combat.outcome.includes('surrendered')));
      this.removeHero(attacker, retreated);
      this.checkWinLoss();
      return {
        ok: true,
        event: 'combat_defeat',
        winner: 'defender',
        outcome: combat.outcome,
        stop: true
      };
    }

    removeHero(hero, retreated) {
      if (!hero) return;
      const idx = this.heroes.indexOf(hero);
      if (idx >= 0) this.heroes.splice(idx, 1);
      if (hero.inBoat) {
        const boat = (this.map.boats || []).find(b => b.heroId === hero.id);
        if (boat) {
          boat.occupied = false;
          boat.heroId = null;
        }
      }
      if (retreated) {
        const p = this.getPlayer(hero.owner);
        if (p && p.tavernHeroes.length < 2) {
          const fresh = H.createHero(hero.id, p.id, this.rng);
          p.tavernHeroes.push(fresh);
        }
      } else {
        this.usedHeroIds.delete(hero.id);
      }
      if (this.selectedHeroId === hero.id) {
        const nextH = this.getPlayerHeroes(hero.owner)[0];
        this.selectedHeroId = nextH ? nextH.id : null;
      }
    }

    digAtCurrentTile(hero) {
      if (!hero) return { ok: false, reason: 'no_hero' };
      if (hero.inBoat) return { ok: false, reason: 'in_boat' };
      if (hero.move < hero.maxMove) return { ok: false, reason: 'already_moved' };

      const idx = H.tileIndex(this.map, hero.x, hero.y);
      if (this.map.dugTiles[idx]) return { ok: false, reason: 'already_dug' };

      hero.move = 0;
      this.map.dugTiles[idx] = true;

      const ult = this.map.ultimateArtifact;
      if (ult && !ult.dug && ult.x === hero.x && ult.y === hero.y) {
        if (!H.giveHeroArtifact(hero, ult.id)) {
          return { ok: false, reason: 'bag_full' };
        }
        ult.dug = true;
        this.recalcHeroMaxMove(hero);
        this.log.push(`${hero.name} откапывает Конечный Артефакт: ${H.ARTIFACTS[ult.id].name}!`);
        this.checkWinLoss();
        return { ok: true, found: true, artifactId: ult.id };
      }

      return { ok: true, found: false };
    }

    castAdventureSpell(hero, spellId, target) {
      if (!hero || !hero.hasSpellbook) return { ok: false, reason: 'no_spellbook' };
      const charges = (hero.spells && hero.spells[spellId]) || 0;
      if (charges <= 0) return { ok: false, reason: 'no_charges' };
      const spell = H.SPELLS[spellId];
      if (!spell || spell.category !== 'adventure') return { ok: false, reason: 'not_adventure_spell' };

      const player = this.getPlayer(hero.owner);
      if (!player) return { ok: false, reason: 'no_player' };

      if (spell.kind === 'view') {
        hero.spells[spellId]--;
        if (spell.viewType === 'all') {
          player.fog.fill(1);
          player.viewOverlay.mines = true;
          player.viewOverlay.resources = true;
          player.viewOverlay.artifacts = true;
          player.viewOverlay.towns = true;
          player.viewOverlay.heroes = true;
          player.identifiedHeroesToday = true;
        } else if (spell.viewType === 'identify_hero') {
          player.identifiedHeroesToday = true;
        } else if (player.viewOverlay[spell.viewType] !== undefined) {
          player.viewOverlay[spell.viewType] = true;
        }
        return { ok: true, spellId, viewType: spell.viewType };
      }

      if (spellId === 'summon_boat') {
        let adjWater = null;
        for (let dy = -1; dy <= 1 && !adjWater; dy++) {
          for (let dx = -1; dx <= 1 && !adjWater; dx++) {
            const nx = hero.x + dx;
            const ny = hero.y + dy;
            if (!H.inBounds(this.map, nx, ny)) continue;
            if (H.terrainAt(this.map, nx, ny) !== 'water') continue;
            const bHere = (this.map.boats || []).find(b => b.x === nx && b.y === ny);
            if (!bHere) adjWater = { x: nx, y: ny };
          }
        }
        if (!adjWater) return { ok: false, reason: 'no_adjacent_water' };

        hero.spells[spellId]--;
        const chance = Math.min(0.95, (spell.baseChance || 0.5) + (spell.bonusPerPower || 0.1) * hero.power);
        if (!this.rng.chance(chance)) {
          return { ok: true, spellId, success: false };
        }
        let freeBoat = (this.map.boats || []).find(b => !b.occupied);
        if (freeBoat) {
          freeBoat.x = adjWater.x;
          freeBoat.y = adjWater.y;
        } else {
          freeBoat = { id: 'boat_sum_' + (this.map.boats.length + 1), x: adjWater.x, y: adjWater.y, occupied: false };
          this.map.boats.push(freeBoat);
        }
        return { ok: true, spellId, success: true, boat: freeBoat };
      }

      if (spellId === 'town_gate') {
        if (hero.inBoat) return { ok: false, reason: 'in_boat' };
        const myTowns = this.getPlayerTowns(hero.owner).filter(t => !this.getHeroAt(t.x, t.y, hero.id));
        if (!myTowns.length) return { ok: false, reason: 'no_free_town' };
        let bestTown = myTowns[0];
        let bestD = Math.hypot(bestTown.x - hero.x, bestTown.y - hero.y);
        for (const t of myTowns) {
          const d = Math.hypot(t.x - hero.x, t.y - hero.y);
          if (d < bestD) {
            bestD = d;
            bestTown = t;
          }
        }
        hero.spells[spellId]--;
        hero.x = bestTown.x;
        hero.y = bestTown.y;
        hero.move = Math.max(0, hero.move - 200);
        const radius = 5 + (H.FACTIONS[hero.faction] ? H.FACTIONS[hero.faction].scoutBonus : 0);
        this.revealFog(hero.owner, hero.x, hero.y, radius);
        H.visitTownMageGuild(hero, bestTown);
        return { ok: true, spellId, town: bestTown };
      }

      if (spellId === 'dimension_door') {
        if (!target || !H.inBounds(this.map, target.x, target.y)) {
          return { ok: false, reason: 'invalid_target' };
        }
        const dist = Math.max(Math.abs(target.x - hero.x), Math.abs(target.y - hero.y));
        if (dist > (spell.range || 7)) return { ok: false, reason: 'out_of_range' };
        if (H.isBlockedTile(this.map, target.x, target.y)) return { ok: false, reason: 'blocked' };
        const terr = H.terrainAt(this.map, target.x, target.y);
        if ((terr === 'water') !== !!hero.inBoat) return { ok: false, reason: 'terrain_mismatch' };
        if (this.getHeroAt(target.x, target.y, hero.id)) return { ok: false, reason: 'occupied' };

        hero.spells[spellId]--;
        hero.x = target.x;
        hero.y = target.y;
        hero.move = Math.max(0, hero.move - 200);
        const radius = 5 + (H.FACTIONS[hero.faction] ? H.FACTIONS[hero.faction].scoutBonus : 0);
        this.revealFog(hero.owner, hero.x, hero.y, radius);
        return { ok: true, spellId, toX: target.x, toY: target.y };
      }

      return { ok: false, reason: 'unhandled_spell' };
    }

    endTurn() {
      if (this.gameOver) return { gameOver: true, winner: this.winner };

      let attempts = 0;
      do {
        this.currentPlayerIdx = (this.currentPlayerIdx + 1) % this.players.length;
        if (this.currentPlayerIdx === 0) {
          this.advanceDay();
        }
        attempts++;
      } while (this.players[this.currentPlayerIdx].eliminated && attempts <= this.players.length);

      this.currentPlayer = this.players[this.currentPlayerIdx].id;
      const curH = this.getPlayerHeroes(this.currentPlayer)[0];
      const curT = this.getPlayerTowns(this.currentPlayer)[0];
      this.selectedHeroId = curH ? curH.id : null;
      this.selectedTownId = curT ? curT.id : null;

      return {
        currentPlayer: this.currentPlayer,
        day: this.day,
        week: this.week,
        month: this.month,
        totalDays: this.totalDays,
        weekOfUnit: this.weekOfUnit
      };
    }

    advanceDay() {
      this.totalDays++;
      this.day++;
      let isNewWeek = false;
      let isNewMonth = false;
      if (this.day > H.DAYS_PER_WEEK) {
        this.day = 1;
        this.week++;
        isNewWeek = true;
        if (this.week > H.WEEKS_PER_MONTH) {
          this.week = 1;
          this.month++;
          isNewMonth = true;
        }
      }

      for (const t of this.map.towns) {
        t.builtToday = false;
      }

      for (const p of this.players) {
        if (p.eliminated) continue;
        p.identifiedHeroesToday = false;
        const inc = this.playerDailyIncome(p.id);
        H.addResources(p.resources, inc);

        const pTowns = this.getPlayerTowns(p.id);
        if (pTowns.length === 0) {
          p.daysWithoutTown++;
          if (p.daysWithoutTown >= H.MAX_DAYS_WITHOUT_TOWN) {
            this.eliminatePlayer(p.id, 'no_town_timeout');
            continue;
          }
        } else {
          p.daysWithoutTown = 0;
        }
      }

      for (const h of this.heroes) {
        this.recalcHeroMaxMove(h);
        h.move = h.maxMove;
        const townHere = this.getTownAt(h.x, h.y);
        if (townHere) {
          H.visitTownMageGuild(h, townHere);
        }
      }

      if (isNewWeek) {
        this.applyWeeklyGrowth(isNewMonth);
      }

      this.checkWinLoss();
    }

    applyWeeklyGrowth(isNewMonth) {
      const factionUnits = H.UNIT_LIST.filter(u => u.tier <= 4 && u.faction !== 'neutral');
      const bonusUnit = this.rng.pick(factionUnits);
      this.weekOfUnit = bonusUnit ? bonusUnit.id : null;

      for (const t of this.map.towns) {
        for (let tier = 1; tier <= 6; tier++) {
          let g = H.townWeeklyGrowth(t, tier);
          if (g > 0) {
            const f = H.FACTIONS[t.faction];
            const dwUnit = f && f.dwellings['dwell_' + tier] ? f.dwellings['dwell_' + tier].unit : null;
            if (dwUnit && dwUnit === this.weekOfUnit) {
              g += 5;
            }
            t.available[tier] = (t.available[tier] || 0) + g;
          }
        }
      }

      for (const p of this.players) {
        if (!p.eliminated) {
          this.refreshTavernForPlayer(p);
        }
      }

      if (isNewMonth && this.weekOfUnit) {
        this.monthEvent = { unit: this.weekOfUnit };
      } else {
        this.monthEvent = null;
      }
    }

    eliminatePlayer(playerId, reason) {
      const p = this.getPlayer(playerId);
      if (!p || p.eliminated) return;
      p.eliminated = true;
      for (const h of this.getPlayerHeroes(playerId)) {
        this.removeHero(h, false);
      }
      for (const m of this.getPlayerMines(playerId)) {
        m.owner = null;
      }
      this.log.push(`Игрок ${p.name} (${p.rulerName}) выбыл из борьбы.`);
      this.checkWinLoss();
    }

    checkWinLoss() {
      if (this.gameOver) return;

      for (const p of this.players) {
        if (p.eliminated) continue;
        const hasTowns = this.getPlayerTowns(p.id).length > 0;
        const hasHeroes = this.getPlayerHeroes(p.id).length > 0;
        if (!hasTowns && !hasHeroes) {
          p.eliminated = true;
        }
      }

      if (this.map.winCondition === 'ultimate_artifact' && this.map.ultimateArtifact && this.map.ultimateArtifact.dug) {
        const holder = this.heroes.find(h => (h.artifacts || []).includes(this.map.ultimateArtifact.id));
        if (holder) {
          this.gameOver = true;
          this.winner = holder.owner;
          this.winReason = 'ultimate_artifact';
          return;
        }
      }

      const human = this.players.find(p => p.isHuman);
      if (human && human.eliminated) {
        this.gameOver = true;
        const aliveEnemy = this.players.find(p => !p.eliminated);
        this.winner = aliveEnemy ? aliveEnemy.id : 'red';
        this.loser = human.id;
        this.winReason = 'human_eliminated';
        return;
      }

      const activePlayers = this.players.filter(p => !p.eliminated);
      if (activePlayers.length === 1) {
        this.gameOver = true;
        this.winner = activePlayers[0].id;
        this.winReason = 'conquer_all';
      }
    }

    calculateRating() {
      const diff = DIFFICULTY_PRESETS[this.difficulty] || DIFFICULTY_PRESETS.normal;
      const par = this.map.parDays || 30;
      const speedBonus = Math.max(200, 1500 - Math.max(0, this.totalDays - par) * 20);
      const townBonus = this.getPlayerTowns('blue').length * 100;
      const ultBonus = (this.map.ultimateArtifact && this.map.ultimateArtifact.dug) ? 300 : 0;
      const rawScore = speedBonus + townBonus + ultBonus;
      const finalScore = Math.round(rawScore * diff.ratingMult);
      const rank = H.rankForScore(finalScore);
      return {
        days: this.totalDays,
        difficulty: this.difficulty,
        difficultyName: diff.name,
        score: finalScore,
        rankUnit: rank.unit,
        rankName: rank.name
      };
    }

    serialize() {
      return JSON.stringify({
        seed: this.seed,
        rngState: this.rng.s,
        difficulty: this.difficulty,
        humanFaction: this.humanFaction,
        campaignIndex: this.campaignIndex,
        specId: this.specId,
        day: this.day,
        week: this.week,
        month: this.month,
        totalDays: this.totalDays,
        weekOfUnit: this.weekOfUnit,
        currentPlayerIdx: this.currentPlayerIdx,
        currentPlayer: this.currentPlayer,
        selectedHeroId: this.selectedHeroId,
        selectedTownId: this.selectedTownId,
        winner: this.winner,
        loser: this.loser,
        gameOver: this.gameOver,
        winReason: this.winReason,
        usedHeroIds: Array.from(this.usedHeroIds),
        map: {
          id: this.map.id,
          title: this.map.title,
          w: this.map.w,
          h: this.map.h,
          tiles: this.map.tiles,
          blocked: Array.from(this.map.blocked),
          towns: this.map.towns,
          mines: this.map.mines,
          objects: this.map.objects,
          boats: this.map.boats,
          obelisks: this.map.obelisks,
          winCondition: this.map.winCondition,
          alliedRivals: this.map.alliedRivals,
          parDays: this.map.parDays,
          ultimateArtifact: this.map.ultimateArtifact,
          dugTiles: this.map.dugTiles
        },
        players: this.players.map(p => Object.assign({}, p, { fog: Array.from(p.fog) })),
        heroes: this.heroes,
        log: this.log.slice(-50)
      });
    }

    static deserialize(jsonStr) {
      const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      const mapCopy = Object.assign({}, data.map, {
        blocked: new Uint8Array(data.map.blocked)
      });
      const w = new World({
        seed: data.seed,
        difficulty: data.difficulty,
        humanFaction: data.humanFaction,
        campaignIndex: data.campaignIndex,
        map: mapCopy,
        skipInitPlayers: true
      });
      w.rng.s = data.rngState || 1;
      w.specId = data.specId;
      w.day = data.day;
      w.week = data.week;
      w.month = data.month;
      w.totalDays = data.totalDays;
      w.weekOfUnit = data.weekOfUnit;
      w.currentPlayerIdx = data.currentPlayerIdx;
      w.currentPlayer = data.currentPlayer;
      w.selectedHeroId = data.selectedHeroId;
      w.selectedTownId = data.selectedTownId;
      w.winner = data.winner;
      w.loser = data.loser;
      w.gameOver = data.gameOver;
      w.winReason = data.winReason;
      w.usedHeroIds = new Set(data.usedHeroIds || []);
      w.players = data.players.map(p => Object.assign({}, p, { fog: new Uint8Array(p.fog) }));
      w.heroes = data.heroes || [];
      w.log = data.log || [];
      return w;
    }
  }

  Object.assign(H, {
    DIFFICULTY_PRESETS,
    countArmyStacks,
    armyTotalPower,
    addStackToArmy,
    World
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = H;
})(globalThis.HoMM1 = globalThis.HoMM1 || {});
