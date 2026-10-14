(function (FO) {
  'use strict';

  const TILE = 50;
  const COLS = 28;
  const ROWS = 30;
  const STRIDE = 29;
  const MAP_W = 1400;
  const MAP_H = 1500;
  const BLOCK_W = 1064;
  const ENTRANCES = 7;
  const TOWN_COUNT = 12;
  const DAY = 864000;
  const HOUR = 36000;
  const ALL_SPECIALS = 0x3F;
  const ENCOUNTER_ROLL = [5, 6, 8, 9];
  const TERRAIN = { MOUNTAIN: 1, CITY: 2 };
  const FOG = { SEEN: 1, VISITED: 2 };
  const LOAD = { SPECIAL: 0, DROP: 1, ENCOUNTER: 2 };
  const SKILL_SPEED = Math.fround(0.01);
  const GV = {
    VAULT_WATER: 10, VATS_BLOWN: 17, MASTER_BLOWN: 18, LOAD_MAP_INDEX: 32, MASTER_TIMER: 55, WORLD_TERRAIN: 65,
    WATER_CHIP: 101, VATS_TIMER: 147, REPUTATION: 155, VATS_DONE: 308, MASTER_DONE: 309
  };
  const MOVIE = { VATS: 3, MASTER: 4, WATER_OUT: 6, WATER_LOW: 11, WATER_LOWER: 12 };
  const WATER_SHOWN = { LOW: 2, LOWER: 4 };
  const BLAST_DELAY = 240;
  const BLAST_EXP = 10000;
  const BLAST_KARMA = { VATS: 5, MASTER: 10 };
  const WORLDMAP_MSG = { BLAST_EXP: 500 };
  const CHILDREN_MAP = 'CHILDRN1';
  const CHILDREN_CRATER = 'CHILDEAD';
  const BASE_CRATER = 'MBDEAD';
  const UNAGED_MAPS = [27, 42, 43];
  const AGE = { SHORT: 144, LONG: 336, HEAL_PER_3H: 14 };
  const REMAINS = { PID: 0x5000004, FID: 0x500000B, BAG: 0xD5, OLD_BAG: 0xD6, BAGGED: [0x1000031, 0xD5, 0xD6], KEEP: [0x1000032, 0x1000008] };
  const KILL = { ROBOT: 10, RAT: 7, MANTIS: 12 };

  const T = () => FO.EXE.worldmap;
  const tileOf = v => Math.floor(v / TILE);
  const cell = (table, x, y) => parseInt(table[tileOf(y) * COLS + tileOf(x)], 16);
  const rnd = (a, b) => FO.combatRand(a, b);
  const d6x3 = () => rnd(1, 6) + rnd(1, 6) + rnd(1, 6);

  FO.WM = { TILE, COLS, ROWS, STRIDE, ENTRANCES, TOWNS: TOWN_COUNT, MAP_W, MAP_H, DAY, LOAD, GV, FOG, TERRAIN };

  FO.newWorldMap = function () {
    const home = T().towns[0];
    const wm = { fog: new Uint8Array(STRIDE * 31), entrances: new Uint8Array(15 * ENTRANCES), known: 1, specials: 0, town: 0, entrance: 1, x: home[0] * TILE + 25, y: home[1] * TILE + 25 };
    wm.entrances[0] = 1;
    return wm;
  };

  FO.wmTerrain = (x, y) => cell(T().terrain, x, y);
  FO.wmRegion = (x, y) => cell(T().regions, x, y);
  FO.wmFrequency = (x, y) => cell(T().frequency, x, y);
  FO.wmTownAt = (x, y) => T().towns.findIndex(t => t[0] === tileOf(x) && t[1] === tileOf(y));
  FO.wmTownCenter = t => [T().towns[t][0] * TILE + 25, T().towns[t][1] * TILE + 25];

  FO.wmBlocked = function (x, y) {
    if (x >= BLOCK_W || y <= 0) return false;
    const runs = T().blocked[y] || [];
    for (let i = 0; i < runs.length; i += 2) {
      if (x < runs[i]) return false;
      if (x < runs[i + 1]) return true;
    }
    return false;
  };

  FO.newTrip = function (wm) {
    return { destX: wm.x, destY: wm.y, prevX: wm.x, prevY: wm.y, err: 0, count: 0, dx: 0, dy: 0, sx: 1, sy: 1, steps: 0, checkSteps: 60, stepTime: DAY / 60 };
  };

  FO.wmSpeed = function (trip, dude) {
    const outdoors = Math.min(FO.skillValue(dude, FO.SKILL.OUTDOORSMAN), 100);
    trip.checkSteps = Math.trunc(60 + outdoors * SKILL_SPEED * 60);
    const stepTime = Math.trunc(DAY / trip.checkSteps);
    trip.stepTime = Math.trunc(stepTime * Math.fround(1 - FO.perkRank(dude, FO.PERK.PATHFINDER) * 0.25));
  };

  FO.wmLine = function (trip, wm, x, y) {
    const dx = x - wm.x;
    const dy = y - wm.y;
    trip.destX = x;
    trip.destY = y;
    trip.prevX = wm.x;
    trip.prevY = wm.y;
    trip.err = 0;
    trip.count = 0;
    trip.sx = dx >= 0 ? 1 : -1;
    trip.sy = dy >= 0 ? 1 : -1;
    trip.dx = Math.abs(dx);
    trip.dy = Math.abs(dy);
  };

  FO.wmStep = function (trip, wm) {
    trip.prevX = wm.x;
    trip.prevY = wm.y;
    trip.count++;
    if (trip.dx > trip.dy) {
      if (trip.count > trip.dx) return false;
      trip.err += trip.dy;
      if (trip.err > trip.dx) {
        trip.err -= trip.dx;
        wm.y += trip.sy;
      }
      wm.x += trip.sx;
    } else {
      if (trip.count > trip.dy) return false;
      trip.err += trip.dx;
      if (trip.err > 0) {
        trip.err -= trip.dy;
        wm.x += trip.sx;
      }
      wm.y += trip.sy;
    }
    return true;
  };

  FO.wmMove = function (trip, wm) {
    const moved = FO.wmStep(trip, wm);
    if (!FO.wmBlocked(wm.x, wm.y)) return moved;
    wm.x = trip.prevX;
    wm.y = trip.prevY;
    return false;
  };

  FO.wmToTown = function (trip, wm, town) {
    let [x, y] = FO.wmTownCenter(town);
    let a = rnd(0, 16);
    x += rnd(0, 1) ? a : -a;
    a = rnd(0, 16);
    y += rnd(0, 1) ? a : -a;
    FO.wmLine(trip, wm, x, y);
  };

  FO.wmReveal = function (wm, scout) {
    const tx = tileOf(wm.x);
    const ty = tileOf(wm.y);
    const fog = wm.fog;
    const r = scout ? 2 : 1;
    fog[ty * STRIDE + tx] = FOG.VISITED;
    for (let y = ty - r; y <= ty + r && y < ROWS; y++) {
      if (y < 0) continue;
      for (let x = Math.max(0, tx - r); x <= tx + r && x < COLS; x++) {
        if (fog[y * STRIDE + x] !== FOG.VISITED) fog[y * STRIDE + x] = FOG.SEEN;
      }
    }
    const coast = T().coast[ty];
    if (coast >= 0 && tx <= coast) for (let x = coast; x >= 0; x--) fog[ty * STRIDE + x] = FOG.VISITED;
  };

  FO.wmFog = (wm, tx, ty) => wm.fog[ty * STRIDE + tx];

  FO.wmSync = function (wm, gvars, time) {
    const W = T();
    const e = wm.entrances;
    for (let t = 0; t < TOWN_COUNT; t++) {
      W.entranceGvars[t].forEach((g, k) => {
        const v = (gvars[g] | 0) & 0xFF;
        e[t * ENTRANCES + k] = v;
        if (v) e[t * ENTRANCES] = 1;
      });
      if ((gvars[W.townGvars[t]] | 0) !== 1) continue;
      const i = W.towns[t][1] * STRIDE + W.towns[t][0];
      if (!wm.fog[i]) wm.fog[i] = FOG.SEEN;
      wm.known |= 1 << t;
      e[t * ENTRANCES] = 1;
    }
    const later = Math.floor((time >>> 0) / DAY) > 0 ? 1 : 0;
    e[0] = 1;
    e[1] = e[2] = e[3] = later;
    const any = (from, to) => e.slice(from, to + 1).some(Boolean);
    if (gvars[GV.MASTER_BLOWN] || any(11 * ENTRANCES, 11 * ENTRANCES + 1)) e[12 * ENTRANCES] = 1;
    if (gvars[GV.VATS_BLOWN] || any(8 * ENTRANCES, 8 * ENTRANCES + 4)) e[13 * ENTRANCES] = 1;
    if (any(7 * ENTRANCES + 1, 7 * ENTRANCES + 4)) e[14 * ENTRANCES] = 1;
  };

  FO.wmKnown = (wm, t) => !!(wm.known & (1 << t));

  FO.wmTownName = function (play, wm, t) {
    if (t < 0) return play.text(1000 + FO.wmTerrain(wm.x, wm.y), 'WORLDMAP');
    const gvars = play.sc ? play.sc.gvars : [];
    if ((gvars[T().townGvars[t]] | 0) === 1 || FO.wmKnown(wm, t)) return FO.mapText(play.w, 500 + t);
    return play.text(1004, 'WORLDMAP');
  };

  FO.mapText = function (w, id) {
    const m = w.mapMsg && w.mapMsg.get(id);
    return m ? m.text : '';
  };

  FO.wmCrater = function (play, name) {
    const gv = play.sc.gvars;
    if (gv[GV.MASTER_BLOWN] && name === CHILDREN_MAP) return CHILDREN_CRATER;
    if (gv[GV.VATS_BLOWN] && T().craters.includes(name)) return BASE_CRATER;
    return name;
  };

  FO.wmRandomMap = function (wm) {
    const rows = FO.EXE.encounterMaps;
    const row = [rows.desert, rows.mountain, rows.city, rows.ocean][FO.wmTerrain(wm.x, wm.y)];
    const all = [0, 1, 2].map(i => row[i] || null);
    let pick = null;
    while (!pick) pick = all[rnd(0, 2)];
    return pick;
  };

  FO.wmEncounterRoll = function (wm) {
    const roll = d6x3();
    return FO.wmTownAt(wm.x, wm.y) === -1 && roll <= ENCOUNTER_ROLL[FO.wmFrequency(wm.x, wm.y)];
  };

  FO.wmSpecialRoll = function (wm, dude) {
    const luck = d6x3() + FO.statValue(dude, FO.STAT.LK) - 5 + 2 * FO.perkRank(dude, FO.PERK.EXPLORER);
    if (luck < 18 || wm.specials === ALL_SPECIALS) return -1;
    for (;;) {
      const r = rnd(1, 100);
      const i = T().specials.findIndex(([lo, hi], k) => r >= lo && r <= hi && !(wm.specials & (1 << k)));
      if (i < 0) continue;
      wm.specials |= 1 << i;
      return i;
    }
  };

  FO.healParty = function (play, hours) {
    const n = Math.trunc(hours / 3);
    if (!n) return;
    const w = play.w;
    for (const o of [w.dude, ...(w.party || [])]) {
      if (o && o.critter) FO.adjustHits(play, o, FO.statValue(o, FO.STAT.HEAL_RATE) * n);
    }
  };

  FO.wmArrive = function (play, mapIndex) {
    const w = play.w;
    const wm = w.wm;
    const town = mapIndex >= 0 && mapIndex < T().mapTown.length ? T().mapTown[mapIndex] : -1;
    if (town < 0 || town >= TOWN_COUNT || FO.wmTownAt(wm.x, wm.y) === town) return false;
    const sc = play.sc;
    const trip = FO.newTrip(wm);
    FO.wmToTown(trip, wm, town);
    FO.wmSpeed(trip, w.dude);
    let slow = 0;
    let done = false;
    while (!done) {
      const terrain = FO.wmTerrain(wm.x, wm.y);
      let time = true;
      if (terrain === TERRAIN.MOUNTAIN) {
        if (--slow <= 0) {
          done = !FO.wmStep(trip, wm);
          slow = 2;
        }
      } else if (terrain === TERRAIN.CITY) {
        done = !FO.wmStep(trip, wm);
        if (--slow <= 0 && !done) {
          done = !FO.wmStep(trip, wm);
          slow = 4;
          time = false;
        }
      } else {
        done = !FO.wmStep(trip, wm);
        slow = 0;
      }
      if (time && sc) sc.time += trip.stepTime;
      if (++trip.steps >= trip.checkSteps) {
        trip.steps = 0;
        FO.healParty(play, 24);
      }
    }
    return true;
  };

  FO.wmTimed = function (play) {
    const sc = play.sc;
    const gv = sc.gvars;
    if (!gv[GV.VAULT_WATER] && gv[GV.WATER_CHIP] !== 2) {
      play.playMovie(MOVIE.WATER_OUT);
      return { over: true };
    }
    const blast = (timer, movie, done, blown, other, karma, message) => {
      if (!gv[timer] || Math.floor(((sc.time - gv[timer]) >>> 0) / 10) <= BLAST_DELAY) return null;
      play.playMovie(movie);
      gv[done] = 2;
      const home = !!gv[other];
      FO.addExperience(play.w.dude, BLAST_EXP, () => play.levelUp());
      gv[GV.REPUTATION] = Math.max(-100, Math.min(100, (gv[GV.REPUTATION] | 0) + karma));
      if (message) play.say(play.text(WORLDMAP_MSG.BLAST_EXP, 'WORLDMAP'));
      gv[timer] = 0;
      gv[blown] = 1;
      return { home };
    };
    return blast(GV.VATS_TIMER, MOVIE.VATS, GV.VATS_DONE, GV.VATS_BLOWN, GV.MASTER_BLOWN, BLAST_KARMA.VATS, true) ||
      blast(GV.MASTER_TIMER, MOVIE.MASTER, GV.MASTER_DONE, GV.MASTER_BLOWN, GV.VATS_BLOWN, BLAST_KARMA.MASTER, false);
  };

  FO.midnight = function (play) {
    const sc = play.sc;
    const gv = sc.gvars;
    const w = play.w;
    if (w.map) {
      for (const list of w.map.byElev) {
        for (const o of list) {
          if (w.isDoor(o)) o.openFlags = (o.openFlags | 0) & ~FO.JAMMED;
          else if (w.itemType(o) === FO.ITEM.CONTAINER) o.dataFlags = (o.dataFlags | 0) & ~FO.JAMMED;
        }
      }
    }
    let movie = -1;
    if (gv[GV.WATER_CHIP] !== 2 && (gv[GV.VAULT_WATER] | 0) > 0) {
      gv[GV.VAULT_WATER]--;
      const water = gv[GV.VAULT_WATER];
      sc.waterShown = sc.waterShown | 0;
      if (!water) movie = MOVIE.WATER_OUT;
      else if (water <= 50 && !(sc.waterShown & WATER_SHOWN.LOWER)) {
        sc.waterShown |= WATER_SHOWN.LOWER;
        movie = MOVIE.WATER_LOWER;
      } else if (water <= 100 && !(sc.waterShown & WATER_SHOWN.LOW)) {
        sc.waterShown |= WATER_SHOWN.LOW;
        movie = MOVIE.WATER_LOW;
      }
    }
    if (movie >= 0 && w.movies.has(movie)) movie = -1;
    if (movie >= 0) play.playMovie(movie);
    if (movie === MOVIE.WATER_OUT) play.gameOver = true;
    FO.processRads(play);
    sc.scheduleMidnight();
    return movie >= 0;
  };

  FO.ageMap = function (play, state, hours) {
    if (!hours || UNAGED_MAPS.includes(state.index)) return;
    const w = play.w;
    const all = () => state.byElev.flat();
    for (const o of all()) {
      if (!w.isCritter(o) || o.dude || w.isDead(o) || FO.critterKillType(o) === KILL.ROBOT) continue;
      if ((o.critter.hp | 0) < FO.statValue(o, FO.STAT.MAX_HP)) FO.adjustHits(play, o, AGE.HEAL_PER_3H * Math.trunc(hours / 3));
    }
    const level = hours > AGE.LONG ? 2 : hours > AGE.SHORT ? 1 : 0;
    if (!level) return;
    const doomed = all().filter(o => {
      if (w.isCritter(o)) return !o.dude && w.isDead(o) && FO.critterKillType(o) !== KILL.ROBOT && !REMAINS.KEEP.includes(o.pid);
      if (level < 2) return false;
      return (FO.pidType(o.pid) === FO.PID.MISC && o.fid === REMAINS.FID) || o.pid === REMAINS.BAG;
    });
    for (const o of doomed) {
      if (w.isCritter(o)) {
        const bagged = REMAINS.BAGGED.includes(o.pid);
        if (!bagged) for (const e of (o.inventory || []).slice()) FO.dropItem({ w, p: play }, o, e.obj);
        const rest = play.sc.createObject(bagged ? REMAINS.BAG : REMAINS.PID, o.tile, o.elev);
        if (rest) {
          const r = rnd(0, 3);
          const kill = FO.critterKillType(o);
          rest.frame = o.flags & FO.FLAG.MULTIHEX ? r + 6 : kill === KILL.RAT || kill === KILL.MANTIS ? r : r + 3;
          if (bagged) for (const e of (o.inventory || []).slice()) FO.transfer(play, o, rest, e.obj, e.count);
        }
        play.sc.destroyObject(o);
      } else if (o.pid === REMAINS.BAG) {
        const old = play.sc.createObject(REMAINS.OLD_BAG, o.tile, o.elev);
        if (old) for (const e of (o.inventory || []).slice()) FO.transfer(play, o, old, e.obj, e.count);
        o.flags |= FO.FLAG.HIDDEN;
      } else {
        play.sc.destroyObject(o);
      }
    }
  };

  FO.wmMapHours = (state, time) => (state.savedAt === undefined ? 0 : Math.floor(((time - state.savedAt) >>> 0) / HOUR));
})(globalThis.FO = globalThis.FO || {});
