(function (H) {
  'use strict';

  const AI_BUILD_PRIORITY = [
    'castle',
    'dwell_1',
    'dwell_2',
    'tavern',
    'dwell_3',
    'well',
    'mage_guild_1',
    'dwell_4',
    'statue',
    'dungeon',
    'dwell_5',
    'mage_guild_2',
    'dwell_6',
    'mage_guild_3',
    'mage_guild_4',
    'thieves_guild',
    'shipyard'
  ];

  function mergeGarrisonIntoHero(world, town, hero) {
    if (!town || !hero || hero.owner !== town.owner) return;
    for (let i = 0; i < H.ARMY_SLOTS; i++) {
      const g = town.garrison[i];
      if (!g || g.count <= 0) continue;
      if (H.addStackToArmy(hero.army, g.unit, g.count)) {
        town.garrison[i] = null;
      }
    }
    world.recalcHeroMaxMove(hero);
  }

  function manageAITowns(world, player) {
    const towns = world.getPlayerTowns(player.id);
    if (!towns.length) return;

    for (const town of towns) {
      if (!town.builtToday) {
        for (const bId of AI_BUILD_PRIORITY) {
          const check = H.canBuildInTown(town, bId, player.resources);
          if (check.ok) {
            world.buildInTown(town.id, bId);
            break;
          }
        }
      }

      const myHeroes = world.getPlayerHeroes(player.id);
      const desiredHeroes = Math.min(3, Math.max(1, towns.length));
      if (myHeroes.length < desiredHeroes && town.buildings.tavern && player.resources.gold >= 3000 && !world.getHeroAt(town.x, town.y)) {
        world.hireHeroInTown(town.id, 0);
      }

      const visiting = world.getHeroAt(town.x, town.y);
      if (visiting && visiting.owner === player.id) {
        if (!visiting.hasSpellbook && H.townMageGuildLevel(town) >= 1 && player.resources.gold >= H.SPELLBOOK_COST) {
          world.buySpellbookInTown(town.id, visiting.id);
        }
        mergeGarrisonIntoHero(world, town, visiting);
      }

      for (let tier = 6; tier >= 1; tier--) {
        const avail = town.available[tier] || 0;
        if (avail <= 0) continue;
        const f = H.FACTIONS[town.faction];
        const dw = f && f.dwellings['dwell_' + tier];
        if (!dw || !town.buildings[dw.id]) continue;
        const uDef = H.UNITS[dw.unit];
        if (!uDef) continue;

        let canBuy = avail;
        while (canBuy > 0 && !H.canAfford(player.resources, H.scaleCost(uDef.cost, canBuy))) {
          canBuy--;
        }
        if (canBuy > 0) {
          world.recruitInTown(town.id, tier, canBuy, !!(visiting && visiting.owner === player.id));
        }
      }

      if (visiting && visiting.owner === player.id) {
        mergeGarrisonIntoHero(world, town, visiting);
      }
    }
  }

  function estimateObjectGuardPower(world, x, y) {
    const guard = H.findGuardMonsterAtOrAdjacent(world, null, x, y);
    if (!guard) return 0;
    return H.unitPower(guard.unit) * guard.count;
  }

  function estimateTownDefensePower(world, town) {
    let pwr = H.armyTotalPower(town.garrison);
    const defHero = world.getHeroAt(town.x, town.y);
    if (defHero && defHero.owner === town.owner) {
      pwr = Math.max(pwr, H.armyTotalPower(defHero.army));
    }
    if (town.buildings && town.buildings.castle) {
      pwr = Math.round(pwr * 1.25) + 150;
    }
    return pwr;
  }

  function pickBestTargetForHero(world, hero) {
    const player = world.getPlayer(hero.owner);
    if (!player) return null;
    const heroPower = Math.max(50, H.armyTotalPower(hero.army));
    const field = H.computeDistanceField(world, hero);
    const distArr = field.dist;
    const map = world.map;

    if (
      map.winCondition === 'ultimate_artifact' &&
      map.ultimateArtifact &&
      !map.ultimateArtifact.dug &&
      player.obelisksVisited.length >= (map.obelisks ? map.obelisks.length : 4)
    ) {
      const ux = map.ultimateArtifact.x;
      const uy = map.ultimateArtifact.y;
      if (hero.x === ux && hero.y === uy) {
        return { x: ux, y: uy, action: 'dig', score: 1e9 };
      }
      const d = distArr[H.tileIndex(map, ux, uy)];
      if (d > 0) {
        return { x: ux, y: uy, score: 500000 - d };
      }
    }

    const candidates = [];

    for (const t of map.towns) {
      if (t.owner === hero.owner) {
        if (heroPower < 400 && (t.available[2] > 0 || t.available[3] > 0 || countGarrison(t) > 0)) {
          const d = distArr[H.tileIndex(map, t.x, t.y)];
          if (d > 0 && d <= 1500) {
            candidates.push({ x: t.x, y: t.y, score: 1800 - d });
          }
        }
        continue;
      }
      if (world.arePlayersAllied(hero.owner, t.owner)) continue;
      const d = distArr[H.tileIndex(map, t.x, t.y)];
      if (d <= 0) continue;
      const defPwr = estimateTownDefensePower(world, t);
      if (heroPower >= defPwr * 1.05 || defPwr === 0) {
        const baseVal = t.owner === null ? 6500 : 9500;
        candidates.push({ x: t.x, y: t.y, score: baseVal - d * 1.5 });
      }
    }

    for (const enemyHero of world.heroes) {
      if (enemyHero.owner === hero.owner || world.arePlayersAllied(hero.owner, enemyHero.owner)) continue;
      const d = distArr[H.tileIndex(map, enemyHero.x, enemyHero.y)];
      if (d <= 0) continue;
      const ePwr = H.armyTotalPower(enemyHero.army);
      if (heroPower >= ePwr * 1.15) {
        candidates.push({ x: enemyHero.x, y: enemyHero.y, score: 7500 - d * 1.6 });
      }
    }

    for (const m of map.mines || []) {
      if (m.owner === hero.owner || world.arePlayersAllied(hero.owner, m.owner)) continue;
      const d = distArr[H.tileIndex(map, m.x, m.y)];
      if (d <= 0) continue;
      const gPwr = estimateObjectGuardPower(world, m.x, m.y);
      if (heroPower >= gPwr * 1.15) {
        const val = m.res === 'gold' ? 5200 : 3800;
        candidates.push({ x: m.x, y: m.y, score: val - d * 1.3 });
      }
    }

    for (const o of map.objects || []) {
      if (o.removed) continue;
      const d = distArr[H.tileIndex(map, o.x, o.y)];
      if (d <= 0) continue;
      const gPwr = estimateObjectGuardPower(world, o.x, o.y);
      if (gPwr > 0 && heroPower < gPwr * 1.15) continue;

      let val = 0;
      let choice = null;
      switch (o.type) {
        case 'chest':
          val = 3400;
          choice = hero.level < 4 ? 'xp' : 'gold';
          break;
        case 'campfire':
        case 'resource_pile':
          val = 3100;
          break;
        case 'artifact':
          if ((hero.artifacts || []).length < H.ARTIFACT_SLOTS) val = 4200;
          break;
        case 'obelisk':
          if (!player.obelisksVisited.includes(o.index || 0)) {
            val = map.winCondition === 'ultimate_artifact' ? 8000 : 2800;
          }
          break;
        case 'gazebo':
        case 'fort':
        case 'canyon':
        case 'xanadu':
          if (!hero.visited[o.id]) val = 3500;
          break;
        case 'windmill':
        case 'water_wheel':
          if (o.visitedWeek !== world.totalWeeks()) val = 2600;
          break;
        case 'shrine':
          if (hero.hasSpellbook && !hero.spells[o.spell]) val = 3000;
          break;
        case 'watchtower':
        case 'observatory':
          if (!hero.visited[o.id]) {
            hero.visited[o.id] = true;
            val = 2200;
          }
          break;
        case 'monster': {
          const mPwr = H.unitPower(o.unit) * o.count;
          if (heroPower >= mPwr * 1.25) val = 2400;
          break;
        }
        default:
          break;
      }

      if (val > 0) {
        candidates.push({ x: o.x, y: o.y, choice, score: val - d * 1.2 });
      }
    }

    if (!candidates.length) return null;
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  function countGarrison(town) {
    return H.countArmyStacks(town.garrison);
  }

  function stepAIHero(world, hero) {
    let safety = 0;
    while (hero.move >= 75 && !world.gameOver && world.heroes.includes(hero) && safety < 16) {
      safety++;
      const target = pickBestTargetForHero(world, hero);
      if (!target) break;
      if (target.action === 'dig') {
        if (hero.move >= hero.maxMove) {
          world.digAtCurrentTile(hero);
        }
        break;
      }
      const path = H.findPath(world, hero, target.x, target.y);
      if (!path.reachable || !path.steps.length) break;
      const moveRes = world.moveHeroAlongPath(hero, path.steps, target.choice);
      if (!moveRes.ok || moveRes.stepsTaken === 0) break;
    }
  }

  function runAITurnForPlayer(world, playerId) {
    const player = world.getPlayer(playerId);
    if (!player || player.eliminated || world.gameOver) return;

    manageAITowns(world, player);

    const heroes = world.getPlayerHeroes(playerId).slice();
    for (const h of heroes) {
      if (world.gameOver) break;
      if (!world.heroes.includes(h)) continue;
      stepAIHero(world, h);
    }

    manageAITowns(world, player);
  }

  function runAllAITurnsUntilHuman(world) {
    let steps = 0;
    while (!world.gameOver && steps < 16) {
      const cur = world.getPlayer(world.currentPlayer);
      if (!cur || cur.isHuman) break;
      runAITurnForPlayer(world, cur.id);
      if (world.gameOver) break;
      world.endTurn();
      steps++;
    }
  }

  function simulateFullGameWithBots(world, maxDays) {
    const limit = maxDays || 120;
    while (!world.gameOver && world.totalDays <= limit) {
      const cur = world.getPlayer(world.currentPlayer);
      if (cur && !cur.eliminated) {
        runAITurnForPlayer(world, cur.id);
      }
      if (world.gameOver) break;
      world.endTurn();
    }
    return {
      gameOver: world.gameOver,
      winner: world.winner,
      winReason: world.winReason,
      totalDays: world.totalDays
    };
  }

  Object.assign(H, {
    AI_BUILD_PRIORITY,
    manageAITowns,
    pickBestTargetForHero,
    stepAIHero,
    runAITurnForPlayer,
    runAllAITurnsUntilHuman,
    simulateFullGameWithBots
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = H;
})(globalThis.HoMM1 = globalThis.HoMM1 || {});
