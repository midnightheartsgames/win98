(function (H) {
  'use strict';

  function inBounds(map, x, y) {
    return x >= 0 && y >= 0 && x < map.w && y < map.h;
  }

  function tileIndex(map, x, y) {
    return y * map.w + x;
  }

  function terrainAt(map, x, y) {
    if (!inBounds(map, x, y)) return 'water';
    return map.tiles[tileIndex(map, x, y)] || 'grass';
  }

  function isBlockedTile(map, x, y) {
    if (!inBounds(map, x, y)) return true;
    return !!map.blocked[tileIndex(map, x, y)];
  }

  function findGuardMonsterAtOrAdjacent(world, heroOwner, x, y) {
    const map = world.map;
    if (!map || !map.objects) return null;
    const direct = map.objects.find(o => !o.removed && o.type === 'monster' && o.x === x && o.y === y);
    if (direct) return direct;
    for (const o of map.objects) {
      if (o.removed || o.type !== 'monster') continue;
      if (Math.abs(o.x - x) <= 1 && Math.abs(o.y - y) <= 1) return o;
    }
    return null;
  }

  function canEnterTile(world, hero, fromX, fromY, toX, toY, isFinalTarget) {
    const map = world.map;
    if (!inBounds(map, toX, toY)) return { ok: false };
    if (isBlockedTile(map, toX, toY)) return { ok: false };

    const toTerrain = terrainAt(map, toX, toY);
    const isWater = toTerrain === 'water';
    const inBoat = !!(hero && hero.inBoat);

    const otherHero = world.heroes ? world.heroes.find(h => h.id !== (hero && hero.id) && h.x === toX && h.y === toY) : null;
    if (otherHero) {
      if (!isFinalTarget) return { ok: false };
      if (otherHero.owner === (hero && hero.owner)) return { ok: true, action: 'meet_hero' };
      return { ok: true, action: 'attack_hero' };
    }

    const town = map.towns ? map.towns.find(t => t.x === toX && t.y === toY) : null;
    if (town) {
      if (inBoat) return { ok: false };
      if (town.owner !== (hero && hero.owner) && !isFinalTarget) return { ok: false };
      return { ok: true, action: 'enter_town' };
    }

    const boatAtTarget = map.boats ? map.boats.find(b => !b.occupied && b.x === toX && b.y === toY) : null;

    if (inBoat) {
      if (isWater) {
        if (boatAtTarget) return { ok: false };
        const obj = map.objects ? map.objects.find(o => !o.removed && o.x === toX && o.y === toY) : null;
        if (obj && !isFinalTarget && obj.type !== 'whirlpool') return { ok: false };
        return { ok: true, action: obj ? 'interact_sea' : 'sail' };
      }
      if (!isFinalTarget) return { ok: false };
      const blockingObj = map.objects ? map.objects.find(o => !o.removed && o.x === toX && o.y === toY) : null;
      if (blockingObj) return { ok: false };
      return { ok: true, action: 'disembark' };
    }

    if (isWater) {
      if (boatAtTarget && isFinalTarget) {
        return { ok: true, action: 'board_boat' };
      }
      return { ok: false };
    }

    const obj = map.objects ? map.objects.find(o => !o.removed && o.x === toX && o.y === toY) : null;
    if (obj) {
      if (obj.type === 'monster') {
        if (!isFinalTarget) return { ok: false };
        return { ok: true, action: 'fight_guard' };
      }
      if (!isFinalTarget && obj.type !== 'signpost' && obj.type !== 'teleporter') {
        return { ok: false };
      }
      return { ok: true, action: 'interact' };
    }

    const mine = map.mines ? map.mines.find(m => m.x === toX && m.y === toY) : null;
    if (mine && isFinalTarget) {
      const guard = findGuardMonsterAtOrAdjacent(world, hero && hero.owner, toX, toY);
      if (guard) return { ok: true, action: 'fight_guard' };
    }

    return { ok: true, action: 'walk' };
  }

  function stepCost(world, hero, fromX, fromY, toX, toY) {
    const map = world.map;
    const toTerrain = terrainAt(map, toX, toY);
    const diag = (fromX !== toX && fromY !== toY) ? 1.41 : 1.0;

    if (hero && hero.inBoat) {
      if (toTerrain !== 'water') {
        return Math.max(100, hero.move || 100);
      }
      return Math.floor(100 * diag);
    }

    if (toTerrain === 'water') {
      return Math.max(100, (hero && hero.move) || 100);
    }

    const tDef = H.TERRAINS[toTerrain] || H.TERRAINS.grass;
    let base = tDef.moveCost;
    if (tDef.rough && hero) {
      const f = H.FACTIONS[hero.faction];
      if (f && !f.roughPenalty) base = 100;
    }
    return Math.floor(base * diag);
  }

  function findPath(world, hero, targetX, targetY) {
    const map = world.map;
    if (!hero || !inBounds(map, targetX, targetY)) {
      return { reachable: false, steps: [], totalCost: 0, days: 0 };
    }
    if (hero.x === targetX && hero.y === targetY) {
      return { reachable: true, steps: [], totalCost: 0, days: 1 };
    }

    const N = map.w * map.h;
    const gScore = new Int32Array(N);
    const parent = new Int32Array(N);
    const closed = new Uint8Array(N);
    gScore.fill(1e9);
    parent.fill(-1);

    const startIdx = tileIndex(map, hero.x, hero.y);
    const goalIdx = tileIndex(map, targetX, targetY);
    gScore[startIdx] = 0;

    const open = [startIdx];
    const dirs = [
      [0, -1], [1, 0], [0, 1], [-1, 0],
      [1, -1], [1, 1], [-1, 1], [-1, -1]
    ];

    let found = false;
    while (open.length > 0) {
      let bestPos = 0;
      let bestF = 1e9;
      for (let i = 0; i < open.length; i++) {
        const idx = open[i];
        const cx = idx % map.w;
        const cy = (idx / map.w) | 0;
        const h = (Math.abs(cx - targetX) + Math.abs(cy - targetY)) * 75;
        const f = gScore[idx] + h;
        if (f < bestF) {
          bestF = f;
          bestPos = i;
        }
      }

      const curIdx = open[bestPos];
      open.splice(bestPos, 1);
      if (curIdx === goalIdx) {
        found = true;
        break;
      }
      if (closed[curIdx]) continue;
      closed[curIdx] = 1;

      const cx = curIdx % map.w;
      const cy = (curIdx / map.w) | 0;

      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (!inBounds(map, nx, ny)) continue;
        const nIdx = tileIndex(map, nx, ny);
        if (closed[nIdx]) continue;

        const isFinal = (nx === targetX && ny === targetY);
        const enter = canEnterTile(world, hero, cx, cy, nx, ny, isFinal);
        if (!enter.ok) continue;

        const c = stepCost(world, hero, cx, cy, nx, ny);
        const tentative = gScore[curIdx] + c;
        if (tentative < gScore[nIdx]) {
          gScore[nIdx] = tentative;
          parent[nIdx] = curIdx;
          if (!open.includes(nIdx)) open.push(nIdx);
        }
      }
    }

    if (!found) {
      return { reachable: false, steps: [], totalCost: 0, days: 0 };
    }

    const rawIdxs = [];
    let cur = goalIdx;
    while (cur !== -1 && cur !== startIdx) {
      rawIdxs.push(cur);
      cur = parent[cur];
    }
    rawIdxs.reverse();

    const steps = [];
    let remToday = hero.move || 0;
    const dailyMax = hero.maxMove || 1200;
    let day = 1;
    let prevX = hero.x;
    let prevY = hero.y;
    let totalCost = 0;

    for (let i = 0; i < rawIdxs.length; i++) {
      const idx = rawIdxs[i];
      const x = idx % map.w;
      const y = (idx / map.w) | 0;
      const isFinal = (i === rawIdxs.length - 1);
      const enter = canEnterTile(world, hero, prevX, prevY, x, y, isFinal);
      const c = stepCost(world, hero, prevX, prevY, x, y);
      if (remToday < c) {
        if (remToday <= 0 || day > 1) {
          day++;
          remToday = dailyMax;
        }
        if (remToday < c && day === 1) {
          day++;
          remToday = dailyMax;
        }
      }
      remToday = Math.max(0, remToday - c);
      totalCost += c;
      steps.push({ x, y, cost: c, totalCost, day, action: enter.action });
      prevX = x;
      prevY = y;
    }

    return {
      reachable: true,
      steps,
      totalCost,
      days: steps.length ? steps[steps.length - 1].day : 1
    };
  }

  function computeDistanceField(world, hero) {
    const map = world.map;
    const N = map.w * map.h;
    const dist = new Int32Array(N);
    const parent = new Int32Array(N);
    dist.fill(-1);
    parent.fill(-1);

    if (!hero || !inBounds(map, hero.x, hero.y)) return { dist, parent };
    const startIdx = tileIndex(map, hero.x, hero.y);
    dist[startIdx] = 0;

    const queue = [startIdx];
    const dirs = [
      [0, -1], [1, 0], [0, 1], [-1, 0],
      [1, -1], [1, 1], [-1, 1], [-1, -1]
    ];

    while (queue.length > 0) {
      let bestI = 0;
      let bestD = dist[queue[0]];
      for (let i = 1; i < queue.length; i++) {
        const d = dist[queue[i]];
        if (d < bestD) {
          bestD = d;
          bestI = i;
        }
      }
      const curIdx = queue[bestI];
      queue.splice(bestI, 1);
      const cx = curIdx % map.w;
      const cy = (curIdx / map.w) | 0;

      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (!inBounds(map, nx, ny)) continue;
        const nIdx = tileIndex(map, nx, ny);
        const enterPass = canEnterTile(world, hero, cx, cy, nx, ny, false);
        const enterGoal = canEnterTile(world, hero, cx, cy, nx, ny, true);
        if (!enterPass.ok && !enterGoal.ok) continue;

        const c = stepCost(world, hero, cx, cy, nx, ny);
        const nd = dist[curIdx] + c;
        if (dist[nIdx] < 0 || nd < dist[nIdx]) {
          dist[nIdx] = nd;
          parent[nIdx] = curIdx;
          if (enterPass.ok && !queue.includes(nIdx)) {
            queue.push(nIdx);
          }
        }
      }
    }

    return { dist, parent };
  }

  function validateMapReachability(map) {
    const N = map.w * map.h;
    const visited = new Uint8Array(N);
    if (!map.towns || map.towns.length === 0) return { ok: false, reason: 'no_towns' };

    const startTown = map.towns[0];
    const sIdx = tileIndex(map, startTown.x, startTown.y);
    visited[sIdx] = 1;
    const queue = [sIdx];
    const dirs = [
      [0, -1], [1, 0], [0, 1], [-1, 0],
      [1, -1], [1, 1], [-1, 1], [-1, -1]
    ];

    const teleporters = (map.objects || []).filter(o => o.type === 'teleporter');

    while (queue.length > 0) {
      const cur = queue.shift();
      const cx = cur % map.w;
      const cy = (cur / map.w) | 0;

      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (!inBounds(map, nx, ny)) continue;
        const nIdx = tileIndex(map, nx, ny);
        if (visited[nIdx] || isBlockedTile(map, nx, ny)) continue;
        visited[nIdx] = 1;
        queue.push(nIdx);
      }

      const tpHere = teleporters.find(t => t.x === cx && t.y === cy);
      if (tpHere) {
        for (const tpOther of teleporters) {
          if (tpOther.channel === tpHere.channel) {
            const oIdx = tileIndex(map, tpOther.x, tpOther.y);
            if (!visited[oIdx]) {
              visited[oIdx] = 1;
              queue.push(oIdx);
            }
          }
        }
      }
    }

    for (const t of map.towns) {
      if (!visited[tileIndex(map, t.x, t.y)]) {
        return { ok: false, reason: 'unreachable_town', target: t.name };
      }
    }
    for (const m of map.mines || []) {
      if (!visited[tileIndex(map, m.x, m.y)]) {
        return { ok: false, reason: 'unreachable_mine', target: m.res };
      }
    }
    for (const o of map.objects || []) {
      if (!visited[tileIndex(map, o.x, o.y)]) {
        return { ok: false, reason: 'unreachable_object', target: o.type };
      }
    }
    return { ok: true };
  }

  Object.assign(H, {
    inBounds,
    tileIndex,
    terrainAt,
    isBlockedTile,
    findGuardMonsterAtOrAdjacent,
    canEnterTile,
    stepCost,
    findPath,
    computeDistanceField,
    validateMapReachability
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = H;
})(globalThis.HoMM1 = globalThis.HoMM1 || {});
