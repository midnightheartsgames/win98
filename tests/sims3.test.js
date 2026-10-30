const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/sims3');
const LOGIC = ['s3-core', 's3-data', 's3-data-traits', 's3-data-careers', 's3-data-wishes', 's3-data-social', 's3-data-objects', 's3-world', 's3-sim', 's3-blueprints', 's3-families', 's3-town', 's3-actions', 's3-acts-home', 's3-acts-hobby', 's3-acts-town', 's3-social', 's3-autonomy', 's3-game', 's3-life', 's3-services', 's3-weather', 's3-save'];
const ORDER = LOGIC.concat(['s3-tex', 's3-geo', 's3-models', 's3-body', 's3-render', 's3-icons', 's3-stage', 's3-audio', 's3-ui', 's3-ui-hud', 's3-ui-panels', 's3-ui-build', 's3-ui-cas', 's3-ui-menu']);

const store = new Map();
globalThis.localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
let S;
for (const f of ORDER) S = require(path.join(DIR, f + '.js'));

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const VERBOSE = process.argv.includes('-v');
const t0 = Date.now();
function section(name, fn) { const s = Date.now(); fn(); if (VERBOSE) console.log(name + ': ' + (Date.now() - s) + ' ms'); }
const errors = [];
const origError = console.error;
console.error = (...a) => { errors.push(a.map(String).join(' ')); };

function runDays(game, days) { const steps = Math.round(days * 1440 / 0.5); for (let i = 0; i < steps; i++) game.step(0.5); }
function homeGame(key) {
  const game = new S.Game({ seed: 1999, debug: true });
  const hh = [...game.households.values()].find(h => h.key === key);
  game.playFamily(hh.id);
  return { game, hh };
}

section('data', () => {
  const icons = S.ICON_PATHS;
  for (const k of S.TRAIT_KEYS) {
    const t = S.TRAITS[k];
    ok(t.name && t.desc && S.TRAIT_CATS[t.cat], 'trait ' + k);
    for (const c of t.conflicts) ok(S.TRAITS[c] && S.TRAITS[c].conflicts.includes(k), 'conflict ' + k + '/' + c + ' is mutual');
  }
  ok(S.TRAIT_KEYS.length >= 50, 'many traits');
  for (const n of S.NEEDS) ok(icons[n.icon], 'need icon ' + n.k);
  for (const [k, m] of Object.entries(S.MOODLETS)) ok(icons[m.icon] && m.name && typeof m.v === 'number', 'moodlet ' + k);
  for (const [k, sk] of Object.entries(S.SKILLS)) ok(icons[sk.icon] && Object.keys(sk.unlock).length, 'skill ' + k);
  ok(S.SKILL_KEYS.length === 10, 'ten skills');
  for (const k of S.CAREER_KEYS) {
    const c = S.CAREERS[k];
    ok(icons[c.icon] && S.RH[c.place] && c.name && c.desc, 'career ' + k);
    ok(c.branchAt ? c.levels.length === c.branchAt - 1 && Object.values(c.branches).every(b => c.levels.length + b.levels.length === 10) : c.levels.length === 10, 'career has ten levels ' + k);
    const path = c.levels.concat(c.branchAt ? Object.values(c.branches)[0].levels : []);
    for (let i = 1; i < path.length; i++) ok(path[i].pay >= path[i - 1].pay, 'career pay grows ' + k + ' ' + i);
  }
  ok(S.CAREER_KEYS.length === 11, 'eleven careers');
  for (const [k, L] of Object.entries(S.LTW)) { ok(icons[L.icon] && L.name && L.desc, 'LTW ' + k); for (const t of L.traits) ok(S.TRAITS[t], 'LTW trait ' + k + ' ' + t); }
  for (const [k, w] of Object.entries(S.WISHES)) ok(icons[w.icon], 'wish icon ' + k);
  for (const [k, r] of Object.entries(S.REWARDS)) ok(icons[r.icon] && r.cost > 0, 'reward ' + k);
  for (const f of S.FOODS) ok(S.RECIPES[f], 'favourite food is a recipe ' + f);
  for (const [k, a] of Object.entries(S.ACTS)) if (a.icon) ok(icons[a.icon], 'action icon ' + k);
  for (const k of S.OBJECT_KEYS) {
    const d = S.OBJECTS[k];
    ok(S.FUNC_CATS[d.func], 'object category ' + k);
    if (!d.hidden) {
      ok(d.price > 0 || d.reward, 'object price ' + k);
      ok(d.pal && d.pal.length === 2 && d.col.length === 2, 'object palette ' + k);
      for (const r of d.rooms) ok(S.ROOM_CATS[r], 'object room ' + k + ' ' + r);
      for (const a of d.acts) ok(S.ACTS[a], 'object action ' + k + ' ' + a);
    }
    if (k === 'fire') continue;
    const g = new S.Geo(null);
    S.buildObject(g, { t: k, col: d.col, st: {}, id: 1, r: 0, upg: {}, use: {} }, d, {});
    ok(g.data.length > 0 && g.data.every(Number.isFinite), 'object model ' + k);
  }
  for (const f of S.FAMILIES) ok(f.desc && f.members.length && f.lot, 'family ' + f.key);
  ok(S.FAMILIES.length === 10, 'ten families');
});

section('town', () => {
  const { world, lots } = S.buildTown(1999);
  ok(lots.length >= 35, 'lots');
  ok(!world.log.length, 'town generator log is clean: ' + world.log.slice(0, 3).join('; '));
  for (const lot of lots) {
    ok(world.walkable(lot.curb[0], lot.curb[1]) || world.nearestWalkable(lot.curb[0], lot.curb[1], 3), 'curb walkable ' + lot.key);
    if (lot.kind !== 'home' || !lot.bp) continue;
    ok(world.walkable(lot.frontDoor[0], lot.frontDoor[1]) && world.walkable(lot.doorIn[0], lot.doorIn[1]), 'front door walkable ' + lot.key);
    const fd = world.frontDoorOf(lot);
    ok(fd && fd.out[0] === lot.frontDoor[0] && fd.out[1] === lot.frontDoor[1], 'front door detected ' + lot.key);
    let unreachable = [];
    for (const ob of world.objectsInLot(lot.id)) {
      const d = S.OBJECTS[ob.t];
      if (d.hidden || !d.acts.length || d.place === 'ceiling') continue;
      let goals = S.frontTiles(world, ob).concat(S.adjTiles(world, ob));
      if (ob.layer === 'surf') for (let k = 0; k < 4; k++) { const nx = ob.x + S.DX[k], ny = ob.y + S.DY[k]; if (world.edgeOpen(ob.x, ob.y, nx, ny) && !world.layer.surf[world.idx(nx, ny)]) goals.push([nx, ny]); }
      const p = goals.length ? world.findPath(lot.curb[0], lot.curb[1], goals) : null;
      if (!p) unreachable.push(ob.t);
    }
    ok(!unreachable.length, 'every object reachable ' + lot.key + ' ' + unreachable.join(','));
  }
});

section('life', () => {
  const { game, hh } = homeGame('mitchell');
  const funds0 = hh.funds;
  const notes = [];
  game.hooks.notify = n => notes.push(n.text);
  runDays(game, 3);
  const ms = game.members(hh);
  ok(ms.every(s => !s.dead), 'nobody died in three days');
  ok(ms.every(s => S.NEED_KEYS.every(n => Number.isFinite(s.needs[n]))), 'needs are finite');
  const avg = ms.reduce((a, s) => a + S.NEED_KEYS.reduce((b, n) => b + s.needs[n], 0) / 6, 0) / ms.length;
  ok(avg > -40, 'family keeps needs up by itself: ' + avg.toFixed(1));
  ok(ms.some(s => Object.keys(s.skills).length), 'someone learns a skill');
  ok(ms.some(s => s.job && (s.job.days > 0 || s.job.lvl > 1)), 'adults go to work');
  ok(hh.funds !== funds0, 'money flows');
  ok(ms.some(s => s.lhTotal > 0 || s.wishes.length || s.offers.length), 'wishes and happiness');
  ok(notes.length > 0, 'notifications are produced');
  ok(game.t >= 480 + 3 * 1440 - 1, 'time advances');
  ok(!errors.length, 'no action errors: ' + errors.slice(0, 2).join(' | '));
});

section('save', () => {
  const { game, hh } = homeGame('goth');
  runDays(game, 0.5);
  const lot = game.lots[hh.lot];
  const objs = game.world.objectsInLot(lot.id).length;
  const walls = game.world.walls.filter(w => w && w.lot === lot.id).length;
  lot.roof = '#8a2a2a';
  const data = JSON.parse(JSON.stringify(game.serialize()));
  const g2 = S.Game.fromSave(data);
  const hh2 = g2.active();
  ok(hh2 && hh2.name === hh.name && hh2.funds === hh.funds, 'household restored');
  ok(g2.members(hh2).length === game.members(hh).length, 'members restored');
  ok(g2.world.objectsInLot(lot.id).length === objs, 'lot objects restored');
  ok(g2.world.walls.filter(w => w && w.lot === lot.id).length === walls, 'walls restored');
  ok(g2.lots[lot.id].roof === '#8a2a2a', 'roof colour restored');
  ok(g2.members(hh2).every(s => g2.world.walkable(Math.floor(s.x), Math.floor(s.y)) || s.dead), 'sims stand on walkable tiles');
  ok(Math.abs(g2.t - game.t) < 1, 'clock restored');
  runDays(g2, 0.5);
  ok(!errors.length, 'loaded game keeps running');
  const id = S.saveSlot(g2, null, null);
  ok(id && S.readSlots().length === 1 && S.readSlots()[0].name === 'Семья ' + hh.name, 'save slot written');
  S.deleteSlot(id);
  ok(S.readSlots().length === 0, 'save slot deleted');
});

section('household and building', () => {
  const game = new S.Game({ seed: 1999 });
  const rng = new S.RNG(7);
  const a = S.randomSim(rng, { gender: 'm', age: 'ya', last: 'Тестов' });
  const b = S.randomSim(rng, { gender: 'f', age: 'ya', last: 'Тестов' });
  const c = S.randomSim(rng, { gender: 'f', age: 'child', last: 'Тестов' });
  const hh = game.newHousehold('Тестов', [a.serialize(), b.serialize(), c.serialize()]);
  game.linkHousehold(hh, [[0, 1, 'spouse'], [0, 2, 'parent'], [1, 2, 'parent']]);
  game.playFamily(hh.id);
  const ms = game.members(hh);
  ok(ms.length === 3 && hh.funds === 21500, 'new household with starting funds');
  ok(game.rel(ms[0], ms[1]).flags.married, 'spouses are married');
  ok(ms[2].parents.includes(ms[0].id) && ms[2].parents.includes(ms[1].id), 'child has two parents');
  const empty = game.lotsForSale().find(l => !l.bp);
  const price = empty.price;
  ok(game.moveInto(hh, empty.id) === true && hh.funds === 21500 - price && empty.hh === hh.id, 'moved into an empty lot');
  const w = game.world;
  const x0 = empty.x + 3, y0 = empty.y + 3;
  for (let x = x0; x < x0 + 4; x++) { w.addWall('h', x, y0, { lot: empty.id }); w.addWall('h', x, y0 + 3, { lot: empty.id }); }
  for (let y = y0; y < y0 + 3; y++) { w.addWall('v', x0, y, { lot: empty.id }); w.addWall('v', x0 + 4, y, { lot: empty.id }); }
  w.computeRooms();
  const rid = w.roomAt(x0 + 1, y0 + 1);
  ok(rid > 0 && w.rooms[rid].tiles === 12, 'walls make a 4x3 room');
  ok(!w.frontDoorOf(empty), 'no door yet');
  const door = w.getWall('h', x0 + 1, y0 + 3);
  door.door = 'door_wood';
  const fd = w.frontDoorOf(empty);
  ok(fd && w.indoor(fd.inn[0], fd.inn[1]) && !w.indoor(fd.out[0], fd.out[1]), 'door becomes the front door');
  const inside = [x0 + 1, y0 + 1];
  ok(w.findPath(empty.curb[0], empty.curb[1], [inside]), 'room reachable through the door');
  ok(w.canPlace('bed_single', x0 + 1, y0, 0, { lot: empty.id }).ok, 'bed fits inside');
  ok(!w.canPlace('sofa_cheap', x0 + 3, y0, 0, { lot: empty.id }).ok, 'wall blocks a sofa across it');
  const bed = w.placeObject('bed_single', x0, y0 + 1, 0, { lot: empty.id });
  ok(w.objectsInLot(empty.id).includes(bed), 'bed placed');
  ok(w.canPlace('painting_cheap', x0 + 1, y0, 2, { lot: empty.id }).ok, 'painting hangs on the north wall');
  ok(!w.canPlace('painting_cheap', x0 + 1, y0 + 1, 2, { lot: empty.id }).ok, 'painting needs a wall');
  w.removeWall('h', x0 + 1, y0);
  w.computeRooms();
  ok(!w.indoor(x0 + 1, y0 + 1), 'opening a wall makes the room outdoor');
  ok(typeof S.lotValue === 'function' && S.lotValue(w, empty) > 0, 'lot value recalculated');
});

section('pools', () => {
  const { game, hh } = homeGame('landgraab');
  const w = game.world;
  const lot = game.lots[hh.lot];
  const tiles = w.poolTiles(lot.id);
  ok(tiles.length >= 9 && w.poolTiles(w.lotByKey.alto.id).length >= 9, 'rich families have pools');
  ok(tiles.every(([x, y]) => !w.walkable(x, y) && w.isPool(x, y)), 'pool tiles are not walkable');
  ok(!w.canPlace('chair_cheap', tiles[0][0], tiles[0][1], 0, { lot: lot.id }).ok, 'nothing stands in a pool');
  const adult = game.members(hh).find(s => s.age === 'adult');
  for (const s of game.members(hh)) game.hardStop(s);
  ok(game.menuFor(adult, { kind: 'tile', tile: tiles[0] }).some(e => e.key === 'swim'), 'pool tile offers swimming');
  ok(!game.menuFor(adult, { kind: 'tile', tile: [lot.x, lot.y] }).some(e => e.key === 'swim'), 'grass does not offer swimming');
  ok(game.queue(adult, 'swim', tiles[0], { user: true }), 'swim queued');
  let wet = 0;
  for (let i = 0; i < 300; i++) { game.step(0.5); if (adult.swimZ && w.isPool(Math.floor(adult.x), Math.floor(adult.y))) wet++; }
  ok(wet > 40, 'sim swims inside the pool');
  ok(!adult.swimZ && w.walkable(Math.floor(adult.x), Math.floor(adult.y)), 'sim climbs out onto land');
  ok(adult.outfit !== 'swim' && adult.hasMood('refreshing_swim') && adult.stats.swimMin > 20, 'swim outfit, moodlet and skill time');
  const empty = game.lotsForSale().find(l => !l.bp);
  const x0 = empty.x + 4, y0 = empty.y + 4;
  for (let y = y0; y < y0 + 2; y++) for (let x = x0; x < x0 + 3; x++) w.terrain[w.idx(x, y)] = S.TER.pool;
  w.version++;
  ok(w.poolTiles(empty.id).length === 6, 'pool tile cache follows terrain edits');
  ok(S.lotValue(w, empty) >= empty.w * empty.h * 6 + 6 * S.BUILD_COSTS.pool - 100, 'pools add lot value');
});

function floorsHome(seed) {
  const game = new S.Game({ seed: 1999 });
  const rng = new S.RNG(seed || 5);
  const a = S.randomSim(rng, { gender: 'm', age: 'ya', last: 'Этажов' });
  const b = S.randomSim(rng, { gender: 'f', age: 'ya', last: 'Этажов' });
  const hh = game.newHousehold('Этажов', [a.serialize(), b.serialize()]);
  game.linkHousehold(hh, [[0, 1, 'spouse']]);
  game.playFamily(hh.id);
  const lot = game.lotsForSale().find(l => !l.bp);
  hh.funds = 99999;
  game.moveInto(hh, lot.id);
  const w = game.world;
  const x0 = lot.x + 3, y0 = lot.y + 2, RW = 8, RH = 6;
  for (const lv of [0, 1]) {
    for (let x = x0; x < x0 + RW; x++) { w.addWall('h', x, y0, { lot: lot.id, lv }); w.addWall('h', x, y0 + RH, { lot: lot.id, lv }); }
    for (let y = y0; y < y0 + RH; y++) { w.addWall('v', x0, y, { lot: lot.id, lv }); w.addWall('v', x0 + RW, y, { lot: lot.id, lv }); }
  }
  for (let y = y0; y < y0 + RH; y++) for (let x = x0; x < x0 + RW; x++) { w.setFloor(x, y, 'wood_light', 0); w.setFloor(x, y, 'carpet_beige', 1); }
  w.getWall('h', x0 + 2, y0 + RH, 0).door = 'door_wood';
  w.computeRooms();
  for (const s of game.members(hh)) game.hardStop(s);
  return { game, hh, lot, w, x0, y0, RW, RH };
}

function walkUp(game, sim, tile, steps) {
  game.hardStop(sim);
  game.queue(sim, 'go_here', tile, { user: true });
  let lvSeen = new Set();
  for (let i = 0; i < steps; i++) { game.step(0.5); lvSeen.add(sim.lv || 0); if ((sim.lv || 0) === tile[2] && Math.floor(sim.x) === tile[0] && Math.floor(sim.y) === tile[1] && !sim.queue.length) break; }
  return lvSeen;
}

section('floors, stairs and elevator', () => {
  const { game, hh, lot, w, x0, y0, RW } = floorsHome();
  const [a, b] = game.members(hh);
  ok(w.indoor(x0 + 1, y0 + 1, 1) && w.roomAt(x0 + 1, y0 + 1, 1) !== w.roomAt(x0 + 1, y0 + 1, 0), 'each floor has its own rooms');
  ok(w.supported(x0 + RW + 1, y0 + 1, 1) && !w.supported(x0 + RW + 3, y0 + 1, 1), 'upper floor overhangs two tiles at most');
  ok(!w.supported(lot.x + lot.w - 1, lot.y + lot.h - 1, 1) || lot.w < 20, 'far yard has no support');
  ok(!w.findPath(x0 + 1, y0 + 1, [[x0 + 1, y0 + 1, 1]], { lv: 0 }), 'no way up without stairs');
  const sx = x0 + RW - 1, sy = y0 + 1;
  const s = w.stairInfo({ t: 'stairs_wood', x: sx, y: sy, r: 2, lv: 0 });
  w.setFloor(s.exit[0], s.exit[1], null, 1);
  ok(!w.stairsCheck('stairs_wood', sx, sy, 2, 0, lot.id).ok, 'stairs need a floor at the top exit');
  w.setFloor(s.exit[0], s.exit[1], 'carpet_beige', 1);
  ok(!w.stairsCheck('stairs_wood', sx, sy, 2, 3, lot.id).ok, 'no stairs above the top floor');
  const chk = w.stairsCheck('stairs_wood', sx, sy, 2, 0, lot.id);
  ok(chk.ok, 'stairs fit inside the house: ' + chk.reason);
  for (const [px, py] of s.tiles) w.setFloor(px, py, null, 1);
  const st = w.placeObject('stairs_wood', sx, sy, 2, { lot: lot.id, lv: 0 });
  ok(s.tiles.every(([px, py]) => w.objAt(px, py, 'occ', 1) === st), 'stairwell is reserved on the floor above');
  const path = w.findPath(x0 + 1, y0 + 1, [[x0 + 1, y0 + 1, 1]], { lv: 0 });
  ok(path && path[path.length - 1][2] === 1 && path.some(n => n[2] === 0), 'path climbs the stairs');
  ok(w.findPath(x0 + 1, y0 + 1, [[x0 + 2, y0 + 4]], { lv: 1 }), 'path goes back down');
  const seen = walkUp(game, a, [x0 + 1, y0 + 1, 1], 600);
  ok(a.lv === 1 && seen.has(0) && Math.floor(a.x) === x0 + 1 && Math.floor(a.y) === y0 + 1, 'sim walks upstairs');
  ok(!game.outdoors(a), 'upstairs room is indoors');
  const menu = game.menuFor(b, { kind: 'tile', tile: [x0 + 2, y0 + 2, 1] }).map(e => e.key);
  ok(menu.includes('go_here') && !menu.includes('plant_seed') && !menu.includes('swim'), 'upper floor tile offers walking only');
  game.queue(b, 'go_here', [x0 + 2, y0 + 2, 1], { user: true });
  for (let i = 0; i < 40; i++) game.step(0.5);
  w.removeObject(st.id);
  ok(!w.findPath(x0 + 1, y0 + 1, [[x0 + 1, y0 + 1, 1]], { lv: 0 }), 'removing the stairs cuts the way up');
  for (let i = 0; i < 80; i++) game.step(0.5);
  ok(!errors.length, 'no errors while stairs vanish under a walking sim: ' + errors.slice(0, 2).join(' | '));
  for (const [px, py] of s.tiles) w.setFloor(px, py, 'carpet_beige', 1);
  const ex = x0 + RW - 1, ey = y0;
  const ec = w.elevatorCheck('elevator', ex, ey, 2, 0, lot.id);
  ok(ec.ok && ec.top === 1, 'elevator reaches the second floor: ' + ec.reason);
  const el = w.placeObject('elevator', ex, ey, 2, { lot: lot.id, lv: 0, st: { top: ec.top } });
  ok(w.objAt(ex, ey, 'occ', 1) === el, 'elevator shaft runs through both floors');
  game.hardStop(a);
  a.lv = 1; a.x = x0 + 1.5; a.y = y0 + 1.5;
  const down = walkUp(game, a, [x0 + 3, y0 + 4, 0], 600);
  ok(a.lv === 0 && down.has(1), 'sim rides the elevator down');
  game.hardStop(b);
  b.lv = 0; b.x = x0 + 1.5; b.y = y0 + 1.5;
  const up = walkUp(game, b, [x0 + 4, y0 + 3, 1], 600);
  ok(b.lv === 1 && up.has(0), 'sim rides the elevator up');
  ok(!errors.length, 'no action errors on two floors: ' + errors.slice(0, 2).join(' | '));
});

section('mansion upstairs', () => {
  const { game, hh } = homeGame('landgraab');
  const w = game.world, lot = game.lots[hh.lot];
  const up = w.objectsInLot(lot.id, o => o.lv === 1);
  ok(up.some(o => o.t === 'telescope') && up.some(o => o.t === 'bookshelf_lux'), 'mansion has a furnished upper floor');
  ok(w.objectsInLot(lot.id, o => S.OBJECTS[o.t].stairs).length === 1, 'mansion has stairs');
  ok(w.walls.some(wl => wl && wl.lot === lot.id && wl.lv === 1 && wl.fence) && w.walls.some(wl => wl && wl.lot === lot.id && wl.lv === 1 && wl.door), 'terrace has railings and a door');
  const tel = up.find(o => o.t === 'telescope');
  ok(w.findPath(lot.curb[0], lot.curb[1], S.adjTiles(w, tel)), 'terrace reachable from the street');
  ok(!game.sheltered(tel.x, tel.y, 1) && game.sheltered(tel.x, tel.y, 0), 'terrace is open sky and roofs the hall below');
});

section('two floor life', () => {
  const { game, hh, lot, w, x0, y0, RW } = floorsHome(9);
  const sx = x0 + RW - 1, sy = y0 + 1;
  const s = w.stairInfo({ t: 'stairs_wood', x: sx, y: sy, r: 2, lv: 0 });
  for (const [px, py] of s.tiles) w.setFloor(px, py, null, 1);
  w.placeObject('stairs_wood', sx, sy, 2, { lot: lot.id, lv: 0 });
  const place = (t, x, y, r, lv) => { const c = w.canPlace(t, x, y, r, { lot: lot.id, lv }); ok(c.ok, 'place ' + t + ' on floor ' + (lv + 1) + ': ' + c.reason); return c.ok ? w.placeObject(t, x, y, r, { lot: lot.id, lv }) : null; };
  place('fridge', x0, y0 + 1, 1, 0);
  place('stove', x0, y0 + 2, 1, 0);
  place('counter', x0, y0 + 3, 1, 0);
  place('toilet', x0 + 1, y0, 2, 1);
  place('shower', x0 + 2, y0, 2, 1);
  place('bed_double', x0 + 1, y0 + 3, 1, 1);
  w.computeRooms();
  for (const sim of game.members(hh)) sim.needs.energy = -30;
  let slept = 0;
  for (let i = 0; i < 2880; i++) { game.step(0.5); for (const sim of game.members(hh)) if (sim.sleeping && sim.lv === 1) slept++; }
  ok(slept > 100, 'sims go upstairs to sleep');
  ok(game.members(hh).every(sim => S.NEED_KEYS.every(n => Number.isFinite(sim.needs[n]))), 'needs stay finite');
  ok(!errors.length, 'no errors in a day on two floors: ' + errors.slice(0, 2).join(' | '));
  lot.roofPieces = [{ x: x0 - 3, y: y0, w: 2, h: 2, lv: 0, style: 'gable' }];
  hh.inv = [{ k: 'obj', t: 'chair_cheap', col: S.OBJECTS.chair_cheap.col.slice(), st: {}, value: 60 }];
  const data = JSON.parse(JSON.stringify(game.serialize()));
  const g2 = S.Game.fromSave(data);
  const w2 = g2.world;
  ok(w2.floorAt(x0 + 1, y0 + 1, 1) === 'carpet_beige' && !w2.hasFloor(s.tiles[0][0], s.tiles[0][1], 1), 'upper floor and stairwell restored');
  ok(w2.getWall('h', x0, y0, 1) && w2.indoor(x0 + 1, y0 + 1, 1), 'upper walls and rooms restored');
  ok([...w2.objects.values()].some(o => o.t === 'bed_double' && o.lv === 1) && [...w2.objects.values()].some(o => o.t === 'stairs_wood'), 'objects keep their floor');
  ok(w2.findPath(x0 + 1, y0 + 1, [[x0 + 1, y0 + 4, 1]], { lv: 0 }), 'loaded stairs connect floors');
  ok(g2.lots[lot.id].roofPieces.length === 1 && g2.active().inv.length === 1, 'roof pieces and family inventory restored');
  ok(g2.members(g2.active()).every(sim => w2.walkable(Math.floor(sim.x), Math.floor(sim.y), sim.lv || 0) || sim.hidden), 'sims load on walkable tiles of their floor');
});

section('weather', () => {
  const { game, hh } = homeGame('mitchell');
  const w = game.world;
  const lot = game.lots[hh.lot];
  game.initWeather();
  const seen = new Set();
  for (let i = 0; i < 400; i++) { game.weather.until = game.t; game.weatherHour(); seen.add(game.weather.kind); }
  ok(S.WEATHER_KEYS.every(k => seen.has(k)), 'all four kinds of weather happen: ' + [...seen].join(','));
  ok(S.WEATHER_KEYS.every(k => S.ICON_PATHS[S.WEATHER[k].icon]), 'weather icons exist');
  const sim = game.members(hh).find(s => s.age === 'adult' && !s.has('loves_outdoors')) || game.members(hh)[0];
  game.hardStop(sim);
  let yard = null;
  for (let y = lot.y; y < lot.y + lot.h && !yard; y++) for (let x = lot.x; x < lot.x + lot.w; x++) if (w.walkable(x, y) && !game.sheltered(x, y, 0)) { yard = [x, y]; break; }
  sim.x = yard[0] + 0.5; sim.y = yard[1] + 0.5; sim.lv = 0;
  game.setWeather('clear', 3);
  ok(!game.isRaining() && game.outdoors(sim), 'clear sky over the yard');
  game.setWeather('rain', 3);
  ok(game.isRaining() && game.weather.until > game.t, 'rain starts');
  game.weatherTick(2);
  ok(sim.has('loves_outdoors') ? sim.hasMood('rain_joy') : sim.hasMood('soaked'), 'sim outside gets wet');
  lot.roofPieces = [{ x: yard[0], y: yard[1], w: 1, h: 1, lv: 0, style: 'flat' }];
  ok(game.sheltered(yard[0], yard[1], 0) && !game.outdoors(sim), 'roof piece shelters from rain');
  lot.roofPieces = [];
  const inside = game.members(hh).find(s => s !== sim && !s.isBaby && w.indoor(Math.floor(s.x), Math.floor(s.y), s.lv || 0));
  if (inside) { inside.removeMood('soaked'); game.weatherTick(2); ok(inside.hasMood('cozy_rain') || inside.hasMood('storm_scared'), 'sim at home feels cozy in the rain'); }
  ok(game.weatherPenalty(sim, { x: yard[0], y: yard[1], lv: 0 }) < 1, 'outdoor activities are less attractive in rain');
  const plant = w.placeObject('plant_garden', yard[0], yard[1], 0, { lot: lot.id, st: { water: 10, growth: 0.2, p: 'tomato' } });
  game.weather.until = game.t + 120;
  game.weatherHour();
  ok(plant.st.water === 100, 'rain waters the garden');
  w.removeObject(plant.id);
  game.setWeather('storm', 2);
  let spot = null;
  for (let i = 0; i < 20 && !spot; i++) spot = game.lightningStrike();
  ok(spot && !game.sheltered(spot[0], spot[1], 0), 'lightning hits an open spot');
  const data = JSON.parse(JSON.stringify(game.serialize()));
  ok(S.Game.fromSave(data).weather.kind === 'storm', 'weather is saved');
  ok(!errors.length, 'no weather errors: ' + errors.slice(0, 2).join(' | '));
});

section('family inventory', () => {
  const { game, hh } = homeGame('mitchell');
  const [a, b] = game.members(hh).filter(s => !s.isBaby);
  const fish = Object.keys(S.FISH)[0];
  a.inv.push({ k: 'fish', f: fish, w: 2, value: 15 });
  a.inv.push({ k: 'homework', p: 0 });
  const n0 = game.famInv(hh).length;
  ok(game.toFamily(a, a.inv.findIndex(i => i.k === 'fish')), 'sim gives a fish to the family');
  ok(game.famInv(hh).length === n0 + 1 && !a.inv.some(i => i.k === 'fish'), 'fish moved to the family inventory');
  ok(!game.toFamily(a, a.inv.findIndex(i => i.k === 'homework')), 'homework stays with its owner');
  ok(game.fromFamily(b, game.famInv(hh).findIndex(i => i.k === 'fish')) && b.inv.some(i => i.k === 'fish'), 'another sim takes it');
  game.famInv(hh).push({ k: 'obj', t: 'chair_cheap', col: S.OBJECTS.chair_cheap.col.slice(), st: {}, value: 100 });
  const funds = hh.funds;
  ok(game.sellFamilyItem(hh, game.famInv(hh).length - 1) === 70 && hh.funds === funds + 70, 'stored furniture sells for 70%');
  b.inv.push({ k: 'book', b: Object.keys(S.BOOKS)[0] });
  const nb = b.inv.filter(i => i.k !== 'homework').length;
  const before = game.famInv(hh).length;
  game.die(b, 'old');
  ok(game.famInv(hh).length === before + nb && !b.inv.length, 'belongings of the deceased go to the family');
});

section('ages and death', () => {
  const { game, hh } = homeGame('mitchell');
  const dialogs = [];
  game.hooks.dialog = (k, d) => dialogs.push(k);
  const kid = game.members(hh).find(s => s.age === 'child');
  game.ageUp(kid);
  ok(kid.age === 'teen', 'child grows into a teen');
  ok(dialogs.includes('trait') && dialogs.includes('ltw'), 'teen chooses a trait and a lifetime wish');
  const npc = [...game.sims.values()].find(s => s.hh !== hh.id && s.age === 'elder' && !s.dead);
  if (npc) {
    game.die(npc, 'old_age');
    runDays(game, 0.3);
    ok(npc.dead, 'elder can die');
    const tomb = [...game.world.objects.values()].find(o => o.t === 'tombstone' && o.st.sim === npc.id);
    ok(tomb && game.lots[tomb.lot].dirty, 'tombstone is placed and its lot is saved');
  }
});

section('integration', () => {
  const LINE = String.fromCharCode(47, 47), BLOCK = String.fromCharCode(47, 42);
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/sims3/' + f).concat(['js/apps/sims3-app.js', 'tests/sims3.test.js']);
  for (const f of files) {
    const src = read(f);
    const noStrings = src.replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, '""');
    ok(!noStrings.includes(LINE) && !noStrings.includes(BLOCK), f + ' has no comments');
    ok(!/\/\/ |\/\*/.test(src.replace(/https?:\/\/[^\s'"`]+/g, '')), f + ' has no comments in templates');
  }
  ok(!read('css/apps/sims3.css').includes(BLOCK), 'css has no comments');
  ok(!read('sims3.html').includes('<!' + '--'), 'page has no comments');
  const html = read('index.html'), page = read('sims3.html');
  let lastA = -1, lastB = -1;
  for (const f of ORDER) {
    const needle = 'js/apps/sims3/' + f + '.js';
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'script order ' + f);
    lastA = ia; lastB = ib;
  }
  ok(fs.readdirSync(DIR).filter(f => f.endsWith('.js')).length === ORDER.length, 'every module is loaded');
  ok(html.indexOf('js/apps/sims3-app.js') > lastA && html.includes('css/apps/sims3.css'), 'desktop loads wrapper and styles');
  const G = S.UI.prototype;
  for (const f of fs.readdirSync(DIR).filter(f => f.startsWith('s3-ui'))) {
    const src = read('js/apps/sims3/' + f);
    for (const m of src.matchAll(/this\.([a-zA-Z_]\w*)\(/g)) ok(typeof G[m[1]] === 'function', f + ' calls existing UI method ' + m[1]);
    const CANVAS = ['fillRect', 'strokeRect', 'clearRect', 'fillText', 'strokeText', 'measureText', 'beginPath', 'roundRect', 'rect', 'fill', 'stroke', 'arc', 'moveTo', 'lineTo', 'save', 'restore', 'translate', 'scale', 'drawImage', 'getImageData', 'closePath', 'setLineDash', 'bezierCurveTo'];
    for (const m of src.matchAll(/\bg\.([a-zA-Z_]\w*)\(/g)) if (!CANVAS.includes(m[1])) ok(typeof S.Game.prototype[m[1]] === 'function', f + ' calls existing game method ' + m[1]);
    for (const m of src.matchAll(/this\.game\.([a-zA-Z_]\w*)\(/g)) ok(typeof S.Game.prototype[m[1]] === 'function', f + ' calls existing game method ' + m[1]);
    for (const m of src.matchAll(/\bS\.([A-Za-z_]\w*)/g)) ok(S[m[1]] !== undefined || m[1] === 'SIMS3_SEED', f + ' uses existing S.' + m[1]);
  }
  const gm = read('js/game-manager.js');
  const at = gm.indexOf('      sims3_demo: {');
  const entry = gm.slice(at, at + 3000);
  ok(at > 0 && /cdDemo: true/.test(entry) && !/steam: true/.test(entry) && /setupExe: 'sims3demo\.exe'/.test(entry) && /targetExe: 'SIMS3\.EXE'/.test(entry) && /appSims3/.test(entry), 'Igromania CD demo catalog entry');
  ok(/sims3: 'sims3_demo'/.test(gm), 'old saves move to the demo id');
  ok(/'sims3demo\.exe': \{[^}]*gameId: 'sims3_demo'/.test(read('js/filesystem.js')), 'installer in D:\\demo');
  ok(/gameId: 'sims3_demo'/.test(read('js/apps/igroman.js')), 'Igromania CD page');
  ok(!/sims3Granted/.test(gm), 'no grant flag');
  const loadState = gm.slice(gm.indexOf('loadState'), gm.indexOf('moveGamesToSteam(state)'));
  ok(!/'sims3(_demo)?'/.test(loadState), 'not preinstalled');
  ok(/isInstalled\('sims3_demo'\)/.test(read('js/desktop.js')), 'desktop icon only when installed');
  ok(/isInstalled\('sims3_demo'\)/.test(read('js/taskbar.js')) && /showOnCd\('sims3_demo'\)/.test(read('js/taskbar.js')), 'start menu points to the CD');
  ok(/showOnCd\('sims3_demo'\)/.test(read('js/apps/dialogs.js')), 'Run dialog points to the CD');
  ok(/showOnCd\('sims3_demo'\)/.test(read('js/apps/explorer.js')), 'explorer points to the CD');
  ok(/gmInstalled\.includes\('sims3_demo'\)/.test(read('js/filesystem.js')), 'C:\\Games folder only when installed');
  ok(/'sims3':/.test(read('js/icons.js')), 'shell icon');
  ok((read('js/i18n.js').match(/'app\.sims3'/g) || []).length === 4, 'window titles in every language table');
  ok(/app_sims3/.test(read('js/apps/task-manager.js')) && /app_sims3/.test(read('js/apps/clippy.js')), 'task manager and Clippy know the game');
  ok(!/Setup_Sims3/.test(read('js/apps/ie.js')), 'no web store sells the game');
});

console.error = origError;
console.log('The Sims 3: ' + checks + ' checks passed in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
