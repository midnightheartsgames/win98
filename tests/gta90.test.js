const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/gta90');
const ORDER = ['g90-core', 'g90-data', 'g90-ekb-center', 'g90-net', 'g90-city', 'g90-sites', 'g90-yards', 'g90-phys', 'g90-world', 'g90-tram', 'g90-ai', 'g90-ground', 'g90-bldg', 'g90-render', 'g90-audio', 'g90-story', 'g90-missions', 'g90-game', 'g90-ui'];
const LOGIC = ['g90-core', 'g90-data', 'g90-ekb-center', 'g90-net', 'g90-city', 'g90-sites', 'g90-yards', 'g90-phys', 'g90-world', 'g90-tram', 'g90-ai', 'g90-story', 'g90-missions', 'g90-game'];
let G;
for (const f of LOGIC) G = require(path.join(DIR, f + '.js'));

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();
const VERBOSE = process.argv.includes('-v');
const log = (...a) => { if (VERBOSE) console.log(...a); };
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const { GR, SEG } = G;
const STEP = 1 / 60;

for (const f of ORDER) {
  const src = read('js/apps/gta90/' + f + '.js');
  let compiled = true;
  try { new vm.Script(src, { filename: f }); } catch (e) { compiled = false; }
  ok(compiled, 'module compiles: ' + f);
}

const city = G.getCity();
const M = city.M, net = city.net;
const D0 = G.DISTRICTS[0];
ok(G.DISTRICTS.length === 1 && D0.id === 'center' && D0.name === 'Центральный', 'one district: the Central residential district');
ok(city.W === D0.size[0] && city.H === D0.size[1] && Math.abs(M - 9.3) < 1e-9, 'map uses the district size at 1:1 scale');
ok(city.W / M > 3550 && city.W / M < 3700 && city.H / M > 5000 && city.H / M < 5150, 'map covers about 3.6 x 5.1 km');
ok(city.buildings.length > 4000 && city.roads.length > 800 && city.areas.length > 1500, 'real city data: ' + city.buildings.length + ' buildings, ' + city.roads.length + ' streets');
const again = new G.City();
const sum = a => { let s = 0; for (let i = 0; i < a.length; i += 97) s = (s * 31 + a[i]) % 1000000007; return s; };
ok(again.buildings.length === city.buildings.length && sum(again.surf) === sum(city.surf) && again.props.length === city.props.length && again.yards.length === city.yards.length, 'city generation is deterministic');

const geo = city.fromGeo(56.83652, 60.60405);
const back = city.toGeo(geo[0], geo[1]);
ok(Math.abs(back[0] - 56.83652) < 1e-6 && Math.abs(back[1] - 60.60405) < 1e-6, 'geo frame round trip');
const plot = city.fromGeo(56.8378, 60.6045), lenin = city.fromGeo(56.8387, 60.6143);
ok(Math.abs(Math.hypot(lenin[0] - plot[0], lenin[1] - plot[1]) / M - 600) < 20, 'real distances: Plotinka to Lenina 600 m');

const names = new Set(city.roads.map(r => r.name));
for (const n of ['проспект Ленина', 'улица Малышева', 'улица 8 Марта', 'улица Вайнера', 'улица Луначарского', 'улица Челюскинцев', 'улица 9 Января', 'улица Толмачёва']) ok(names.has(n), 'street exists: ' + n);
for (const n of ['улица Бориса Ельцина', 'Царская улица', 'улица Николая Никонова']) ok(!names.has(n), 'no post-1991 street name: ' + n);
const bnames = new Set(city.buildings.map(b => b.name).filter(Boolean));
for (const n of ['Дом Советов', 'Цирк', 'Театр оперы и балета', 'Пассаж', 'Гостиница «Исеть»', 'Телебашня']) ok(bnames.has(n), 'landmark building: ' + n);
for (const n of ['Башня Исеть', 'Ельцин Центр', 'Высоцкий']) ok(![...bnames].some(b => b.includes(n)), 'no modern landmark: ' + n);
ok(city.buildings.every(b => b.kind === 'tvtower' || b.lv < 26), 'no skyscrapers built after 1991');
ok(city.buildings.find(b => b.kind === 'tvtower').lv >= 60, 'unfinished TV tower is the tallest structure');
ok(city.buildings.find(b => b.name === 'Пассаж').lv <= 4, 'Passage is the old low department store');
const styles = {};
for (const b of city.buildings) styles[b.style] = (styles[b.style] || 0) + 1;
ok(styles.w > 300 && styles.p > 100 && styles.k > 200 && styles.s > 200 && styles.o > 300 && styles.c > 20, 'building styles of every era: ' + JSON.stringify(styles));
ok(city.areas.some(a => a.kind === 'w' && a.rings[0].length > 40), 'City Pond and the Iset are water');
ok(city.areas.some(a => a.name === 'Центральный рынок'), 'Central Market square');
ok(city.areas.filter(a => a.kind === 'v').length > 150 && city.barriers.filter(b => b.kind === 'p').length > 400, 'private houses have vegetable gardens and plank fences');

for (const [id, p] of Object.entries(city.places)) {
  ok(city.inPlay(p.x, p.y), 'place inside the play area: ' + id);
  if (p.kind === 'road') ok(net.nearestLane(p.x, p.y, null, 25 * M, false), 'road place on a lane: ' + id);
  else if (p.kind === 'water') ok(city.isWater(p.x, p.y), 'water place: ' + id);
  else if (p.kind) ok(!city.buildingAt(p.x, p.y) && city.walkable(p.x, p.y), 'place not inside a building: ' + id);
}
const gl = Object.values(city.garages);
ok(gl.length === 10, 'ten garages');
for (const g of gl) {
  ok(!city.buildingAt(g.x, g.y) && city.drivable(g.front.x, g.front.y), 'garage bay open and front drivable: ' + g.id);
  ok(city.buildings[g.bid].kind === 'garage', 'garage building: ' + g.id);
}

ok(net.sccShare > 0.85, 'lane graph strongly connected: ' + net.sccShare.toFixed(3));
ok(net.lanes.filter(l => l.traffic && !l.next.length).length === 0, 'no dead-end traffic lanes');
ok(net.lights.length > 100, 'traffic lights at real signals: ' + net.lights.length);
const states = new Set();
for (let t = 0; t < 30; t += 0.5) states.add(net.lightState(0, 0, t));
ok(states.has(0) && states.has(1) && states.has(2), 'signal cycles green, amber, red');
ok(net.walkNodes.length > 1000 && net.walkEdges.filter(e => e.kind === 'cross').length > 300, 'sidewalk graph with crossings');
ok(city.trees.length > 1000 && city.props.filter(p => p.type === 'tree').length > 15000, 'green courtyards and boulevards');
ok(city.props.filter(p => p.type === 'stallrow').length > 40, 'market rows at the Central Market');
ok(city.props.filter(p => p.type === 'stop' && p.tram).length > 30, 'tram stops');

const yk = {};
for (const y of city.yards) yk[y.type] = (yk[y.type] || 0) + 1;
ok(yk.hockey >= 8 && yk.play >= 100 && yk.trash >= 100 && yk.bench >= 300 && yk.laundry >= 50 && yk.beat >= 50, 'Soviet courtyards: ' + JSON.stringify(yk));
ok(city.yards.every(y => !city.buildingAt(y.x, y.y) && city.inPlay(y.x, y.y)), 'yard items stand in yards');
ok(city.barriers.filter(b => b.kind === 'h').length === yk.hockey * 2, 'hockey boxes have boards');
const hb = city.barriers.find(b => b.kind === 'h');
ok(city.cross(hb.pts[0] - 20, hb.pts[1] - 20, hb.pts[2] + 20, hb.pts[3] + 20, SEG.FENCE) || city.collide(hb.pts[2], hb.pts[3], 6, SEG.FENCE).hit, 'hockey boards are solid');
ok(city.lawn && city.lawn.reduce((s, v) => s + v, 0) > 20000, 'lawn patches in yards');

const solidBuildings = city.buildings.filter(b => city.inPlay(b.cx, b.cy) && b.area > 200).slice(0, 400);
let precise = 0;
for (const b of solidBuildings) { const r = b.rings[0]; const mx = (r[0] + r[2]) / 2, my = (r[1] + r[3]) / 2; const ex = r[2] - r[0], ey = r[3] - r[1], el = Math.hypot(ex, ey) || 1; const ix = mx - ey / el * 4, iy = my + ex / el * 4, ox = mx + ey / el * 4, oy = my - ex / el * 4; const inside = G.inRings(ix, iy, b.rings) ? [ix, iy] : [ox, oy]; if (city.buildingAt(inside[0], inside[1]) && city.solidAt(inside[0], inside[1])) precise++; }
ok(precise === solidBuildings.length, 'points just inside walls count as buildings: ' + precise + '/' + solidBuildings.length);

for (const m of G.MISSION_LIST) {
  const errs = G.validateMission(m, city);
  ok(errs.length === 0, errs.join('; '));
  ok(G.CHAPTERS[m.chapter].phones[m.phone], 'mission phone belongs to its chapter ' + m.id);
  for (const a of m.after || []) ok(G.MISSIONS[a] && G.MISSIONS[a].chapter === m.chapter, 'after ref ' + m.id + ' -> ' + a);
  ok(m.reward > 0 && m.brief.length > 40, 'mission text ' + m.id);
}
ok(G.MISSION_LIST.length === 25, 'twenty-five story missions');
for (let c = 0; c < G.CHAPTERS.length; c++) {
  const ch = G.CHAPTERS[c];
  ok(G.MISSION_LIST.filter(m => m.chapter === c && m.finale).length === 1, 'one finale in chapter ' + c);
  ok(G.MISSION_LIST.some(m => m.chapter === c && m.finale && m.phone === ch.finalePhone), 'finale phone ' + c);
  for (const mid of ch.exportModels) ok(G.VEHICLES[mid], 'export model ' + mid);
  const total = G.MISSION_LIST.filter(m => m.chapter === c && !m.finale).reduce((s, m, k) => s + m.reward * (k + 1), 0);
  ok(total >= ch.target, 'chapter ' + c + ' target reachable by missions: ' + total + ' >= ' + ch.target);
}
const storyText = JSON.stringify([G.CHAPTERS, G.MISSION_LIST.map(m => [m.title, m.brief]), G.ENDING || '']);
for (const w of ['Горьк', 'Нижн', 'Канавин', 'Сормов', 'Автозавод', 'Волга-Интер']) ok(!storyText.includes(w), 'story moved to Sverdlovsk, no "' + w + '"');
for (const w of ['Свердловск', 'Плотинк', 'Екатеринбург']) ok(storyText.includes(w), 'story mentions ' + w);
for (const [id, v] of Object.entries(G.VEHICLES)) ok(v.L > v.W && v.max > 0 && v.hp > 0 && v.colors.length, 'vehicle ' + id);
ok(G.VEHICLES.ziu && G.VEHICLES.ziu.trolley, 'ZiU trolleybus in traffic');
for (const [id, f] of Object.entries(G.FRENZIES)) { ok(G.WEAPONS[f.weapon], 'frenzy weapon ' + id); ok(f.n > 0 && f.time > 0, 'frenzy numbers ' + id); }
ok(G.genderize('{понял|поняла}', true) === 'поняла' && G.genderize('{понял|поняла}', false) === 'понял', 'genderize');

const simWorld = (placeId, secs, seed) => {
  const w = new G.World(city, { seed, spawn: city.places[placeId] });
  w.player.invisible = true;
  w.god = true;
  let off = 0, samples = 0, inside = 0, maxTrams = 0;
  for (let k = 0; k < secs * 60; k++) {
    w.step(STEP, {});
    maxTrams = Math.max(maxTrams, w.trams.length);
    if (k % 30 === 0) for (const c of w.cars) {
      assert.ok(Number.isFinite(c.x) && Number.isFinite(c.y) && Number.isFinite(c.a), 'finite car');
      if (c.m.boat || c.parked || !c.driver || c.ai.mode !== 'traffic') continue;
      samples++;
      if (city.buildingAt(c.x, c.y)) inside++;
      const r = net.nearestLane(c.x, c.y, null, 8 * M, false);
      if (!r) off++;
    }
    if (k % 30 === 0) for (const p of w.peds) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), 'finite ped');
  }
  return { w, off, samples, inside, maxTrams };
};
for (const [pl, seed] of [['rat_start', 1], ['sq1905', 2], ['circus', 3], ['melkovka_yard', 4], ['vokzal', 5]]) {
  const r = simWorld(pl, 40, seed);
  ok(r.inside === 0, 'no traffic inside buildings at ' + pl);
  ok(r.samples > 100, 'traffic spawned at ' + pl + ' (' + r.samples + ')');
  ok(r.off / r.samples < 0.05, 'traffic stays on lanes at ' + pl + ': ' + (r.off / r.samples).toFixed(3));
  ok(r.w.peds.filter(p => !p.dead && !p.car).length > 15, 'pedestrians at ' + pl);
  ok(r.w.peds.every(p => p.car || p.dead || !city.buildingAt(p.x, p.y)), 'pedestrians outside buildings at ' + pl);
  if (pl === 'rat_start' || pl === 'sq1905') ok(r.maxTrams > 0, 'trams run near ' + pl);
  log('sim', pl, r.samples, (r.off / r.samples).toFixed(3), r.w.cars.length, r.w.peds.length, r.maxTrams);
}

{
  const w = new G.World(city, { seed: 21, spawn: city.places.rat_start, density: 0.6 });
  w.player.invisible = true; w.god = true;
  let frames = 0, moving = 0, served = 0;
  for (let k = 0; k < 60 * 90; k++) {
    w.step(STEP, {});
    for (const tr of w.trams) { frames++; if (tr.v > 5) moving++; if (tr.stopped >= 0) served++; }
  }
  ok(frames > 1000 && moving / frames > 0.55, 'trams keep moving: ' + (moving / Math.max(1, frames)).toFixed(2));
  ok(served > 0, 'trams stop at tram stops');
  const tr = w.trams.find(t => t.v > 40 && t.path.cum[t.path.cum.length - 1] - t.s > 120 * M);
  ok(tr, 'a running tram to test');
  if (tr) {
    w.player.x = tr.cars[0].x; w.player.y = tr.cars[0].y;
    const q = G.pointAt(tr.path.pts, tr.path.cum, tr.s + 70 * M);
    const victim = w.spawnCar('vaz2101', q[0], q[1], q[2], { parked: true, persist: true });
    for (let k = 0; k < 60 * 12; k++) w.step(STEP, {});
    ok(tr.v < 5 && victim.hp === victim.maxHp, 'tram brakes for a car left on the tracks');
  }
}

const ahead = (f, lane, s, dist) => {
  let L = net.lanes[lane], ss = s + dist, guard = 0;
  while (ss > L.len && guard++ < 20) {
    if (!L.next.length) return G.pointAt(L.pts, L.cum, L.len);
    let b = L.next[0];
    for (const j of L.next) if (f[j] < f[b]) b = j;
    ss -= L.len;
    L = net.lanes[b];
  }
  return G.pointAt(L.pts, L.cum, Math.min(ss, L.len));
};
function steer(w, c, tx, ty, d, st) {
  const diff = G.wrapAngle(Math.atan2(ty - c.y, tx - c.x) - c.a);
  const sp = Math.hypot(c.vx, c.vy);
  const cap = Math.min(170, 60 + d * 0.5) * (Math.abs(diff) > 0.5 ? 0.6 : 1);
  const inp = st.back > 0
    ? { down: true, left: diff > 0, right: diff < 0 }
    : { up: Math.abs(diff) < 1.4 && sp < cap, down: Math.abs(diff) > 2.4 || sp > cap + 40, left: diff < -0.06, right: diff > 0.06 };
  if (st.back > 0) st.back -= STEP;
  if (sp < 10 && inp.up) { st.stuck += STEP; if (st.stuck > 0.8) { st.back = 0.7; st.stuck = 0; } } else st.stuck = 0;
  w.step(STEP, inp);
}
function laneBot(w, c, place, secs, radius) {
  const g = net.nearestLane(place.x, place.y, null, 90 * M, true) || net.nearestLane(place.x, place.y, null, 90 * M, false);
  const f = net.fieldTo(g.lane, g.s);
  const goal = { x: g.x, y: g.y };
  const st = { stuck: 0, back: 0 };
  for (let t = 0; t < secs; t += STEP) {
    const d = Math.hypot(c.x - goal.x, c.y - goal.y);
    if (d < radius) return t;
    let tx = goal.x, ty = goal.y;
    if (d > 20 * M) {
      const r = net.nearestLane(c.x, c.y, c.a, 20 * M, false);
      if (r && f[r.lane] < 1e8) { const q = ahead(f, r.lane, r.s, 9 * M + Math.hypot(c.vx, c.vy) * 0.45); tx = q[0]; ty = q[1]; }
    }
    steer(w, c, tx, ty, d, st);
    c.hp = Math.max(c.hp, c.maxHp * 0.5);
    if (w.player.car !== c) return -1;
  }
  return -1;
}
function directBot(w, c, goal, secs, radius) {
  const st = { stuck: 0, back: 0 };
  for (let t = 0; t < secs; t += STEP) {
    const d = Math.hypot(c.x - goal.x, c.y - goal.y);
    if (d < radius) return t;
    steer(w, c, goal.x, goal.y, d, st);
  }
  return -1;
}

{
  const w = new G.World(city, { seed: 11, spawn: city.places.rat_start, density: 0.3 });
  w.god = true;
  const start = city.places.rat_start;
  const c = w.spawnCar('gaz24', start.x, start.y, start.a || 0, { parked: true });
  w.enterCar(w.player, c);
  for (const [to, secs] of [['circus', 160], ['sq1905', 220]]) {
    const t = laneBot(w, c, city.places[to], secs, 15 * M);
    ok(t >= 0, 'driving bot follows the lanes to ' + to + ' (' + t.toFixed(1) + 's)');
    log('drive', to, t.toFixed(1), Math.round(c.hp));
    c.hp = c.maxHp;
  }
}

{
  const w = new G.World(city, { seed: 12, spawn: city.places.sq1905 });
  const p = w.player;
  p.weapons.pm = 20; p.cur = 'pm';
  const spot = city.nearestPoint(p.x + 60, p.y, (x, y) => city.walkable(x, y) && city.losClear(p.x, p.y, x, y), 300);
  const cop = w.spawnPed('cop', spot[0], spot[1], { state: 'walk' });
  w.rebuildGrid();
  w.fireWeapon(p, Math.atan2(cop.y - p.y, cop.x - p.x));
  for (let k = 0; k < 30; k++) w.step(STEP, {});
  ok(cop.hp < cop.maxHp, 'bullet hits a pedestrian');
  ok(w.wanted.level >= 1, 'shooting a cop raises the wanted level');
  w.setWanted(0);
  w.removePed(cop);
  for (const q of w.peds) if (q !== p && Math.hypot(q.x - p.x, q.y - p.y) < 40 * M) w.removePed(q);
  w.rebuildGrid();
  let rs = null;
  for (let k = 0; k < 16 && !rs; k++) { const a = k / 16 * Math.PI * 2, x = p.x + Math.cos(a) * 22 * M, y = p.y + Math.sin(a) * 22 * M; if (city.drivable(x, y) && city.losClear(p.x, p.y, x, y) && !city.cross(p.x, p.y, x, y, SEG.FENCE)) rs = [x, y]; }
  ok(rs, 'open ground for the rocket test');
  const car = w.spawnCar('vaz2106', p.x - (rs[0] - p.x) * 3, p.y - (rs[1] - p.y) * 3, 0, { parked: true });
  w.explodeCar(car);
  ok(car.dead, 'car explodes');
  const rocket = w.spawnCar('gaz24', rs[0], rs[1], 0, { parked: true });
  p.weapons.rpg = 2; p.cur = 'rpg'; p.cool = 0;
  w.fireWeapon(p, Math.atan2(rs[1] - p.y, rs[0] - p.x));
  for (let k = 0; k < 60; k++) w.step(STEP, {});
  ok(rocket.dead || rocket.burning, 'rocket destroys a car');
  w.setWanted(2);
  ok(w.wanted.level === 2, 'set wanted');
  w.setWanted(0);
  for (let k = 0; k < 60; k++) w.step(STEP, {});
  ok(w.cars.filter(c => c.ai.mode === 'police').length === 0, 'police called off at wanted 0');
}

{
  const w = new G.World(city, { seed: 14, spawn: city.places.market, density: 0.2 });
  w.god = true;
  const stall = city.props.find(q => q.type === 'stallrow');
  const a = stall.a, nx = -Math.sin(a), ny = Math.cos(a);
  const slow = w.spawnCar('vaz2106', stall.x + nx * (stall.d / 2 + 3 * M), stall.y + ny * (stall.d / 2 + 3 * M), Math.atan2(-ny, -nx), { parked: true });
  w.enterCar(w.player, slow);
  slow.vx = -nx * 60; slow.vy = -ny * 60;
  for (let k = 0; k < 40; k++) w.step(STEP, {});
  const lu = (slow.x - stall.x) * nx + (slow.y - stall.y) * ny;
  ok(!stall.down && lu > stall.d / 2, 'a slow car stops at a market stall');
  slow.x = stall.x + nx * (stall.d / 2 + 3 * M); slow.y = stall.y + ny * (stall.d / 2 + 3 * M);
  slow.vx = -nx * 260; slow.vy = -ny * 260;
  for (let k = 0; k < 30; k++) w.step(STEP, {});
  ok(stall.down, 'a fast car smashes through a market stall');
  stall.down = false;
}

{
  const game = new G.Game({ density: 0.5 });
  game.newGame(3);
  const w = game.world;
  const badges = w.pickups.filter(k => k.type === 'badge');
  ok(badges.length === 20 && new Set(badges.map(k => k.id)).size === 20, 'twenty collectible badges');
  for (const k of badges) ok(city.walkable(k.x, k.y) && !city.buildingAt(k.x, k.y), 'badge reachable on foot ' + k.id);
  const b = badges[0];
  w.player.x = b.x; w.player.y = b.y;
  for (let k = 0; k < 5; k++) game.update(STEP, {});
  ok(game.prog.badges === 1 && game.prog.taken.includes(b.id), 'badge collected and remembered');
  const road = city.places.race2;
  const c = w.spawnCar('gaz24', road.x, road.y, road.a || 0, { parked: true });
  w.enterCar(w.player, c);
  c.vx = Math.cos(c.a) * 300; c.vy = Math.sin(c.a) * 300;
  w.setWanted(3);
  w.roadblock();
  ok(w.cars.filter(k => k.roadblock).length >= 1, 'police roadblock placed ahead at wanted level 3');
}

{
  const game = new G.Game({ density: 0.3 });
  game.newGame(0);
  const w = game.world;
  w.god = true;
  for (const g of gl) g.open = true;
  game.updateGarages();
  const entered = [];
  w.handler = (type, e) => { if (type === 'garage') entered.push(e.g.id); };
  for (const g of gl) {
    const sx = g.front.x - g.ux * 9 * M, sy = g.front.y - g.uy * 9 * M;
    const start = city.drivable(sx, sy) ? [sx, sy] : city.nearestPoint(sx, sy, (x, y) => city.drivable(x, y) && !city.cross(x, y, g.front.x, g.front.y, SEG.BUILDING | SEG.FENCE), 25 * M);
    ok(start, 'space in front of garage ' + g.id);
    if (!start) continue;
    if (w.player.car) { w.player.car.driver = null; w.player.car = null; }
    const c = w.spawnCar('gaz24', start[0], start[1], Math.atan2(g.front.y - start[1], g.front.x - start[0]), { parked: true });
    w.enterCar(w.player, c);
    g.inside = false; g.busy = 0;
    const tf = directBot(w, c, g.front, 30, 2.5 * M);
    const tg = tf >= 0 ? directBot(w, c, { x: g.x, y: g.y }, 15, 1.5 * M) : -1;
    for (let k = 0; k < 40; k++) w.step(STEP, {});
    ok(entered.includes(g.id), 'a driver can physically enter garage ' + g.id + ' (front ' + tf.toFixed(1) + 's, bay ' + tg.toFixed(1) + 's)');
    w.removeCar(c);
  }
}

function solve(game, m) {
  const w = game.world, s = m.cur, P = w.player;
  const run = n => { for (let k = 0; k < n && m.state === 'run' && game.mode === 'play'; k++) game.update(STEP, {}); };
  const roomy = (a, b) => city.drivable(a, b) && [[3, 0], [-3, 0], [0, 3], [0, -3]].every(([u, v]) => city.drivable(a + u * M, b + v * M));
  const free = (x, y) => roomy(x, y) ? [x, y] : city.nearestPoint(x, y, roomy, 60 * M) || [x, y];
  const carAt = (x0, y0) => {
    const [x, y] = free(x0, y0);
    let c = P.car;
    if (!c || c.dead || c.m.boat) {
      if (P.car) { P.car.driver = null; P.car = null; }
      c = w.spawnCar('vaz2106', x, y, 0, { parked: true });
      w.enterCar(P, c);
    }
    c.x = x; c.y = y; c.vx = c.vy = 0;
    return c;
  };
  const onFoot = (x, y) => {
    if (P.car) { const c = P.car; c.driver = null; P.car = null; }
    P.x = x; P.y = y; P.vx = P.vy = 0;
  };
  switch (s.do) {
    case 'enter': { const c = m.refs[s.ref]; onFoot(c.x, c.y + c.m.W); if (c.driver && !c.driver.isPlayer) w.ejectPed(c.driver, c); w.enterCar(P, c); run(5); break; }
    case 'deliver': {
      const c = m.refs[s.ref];
      if (P.car !== c) { onFoot(c.x, c.y + 30); w.enterCar(P, c); }
      const g = city.garages[s.at];
      c.x = g.front.x; c.y = g.front.y; c.vx = c.vy = 0; run(2);
      c.x = g.x; c.y = g.y; c.vx = c.vy = 0; c.hp = Math.max(c.hp, c.maxHp * 0.9);
      run(20); break;
    }
    case 'goto': {
      const p = m.placeOf(s.at);
      const need = s.need || 'any';
      if (need === 'foot' || need === 'any') onFoot(p.x, p.y);
      else if (need === 'car') carAt(p.x, p.y);
      else {
        const c = need === 'boat' ? (P.car && P.car.m.boat ? P.car : Object.values(m.refs).find(e => e && e.kind === 'car' && e.m.boat)) : m.refs[need.slice(4)];
        if (P.car !== c) { onFoot(c.x, c.y); w.enterCar(P, c); }
        c.x = p.x; c.y = p.y; c.vx = c.vy = 0;
      }
      run(10); break;
    }
    case 'kill': for (const r of s.refs) { const e = m.refs[r]; if (e && !e.dead) w.killPed(e, P, 'bullet'); } run(10); break;
    case 'wreck': for (const r of s.refs) { const e = m.refs[r]; if (e && !e.dead && !e.removed) { e.lastHit = P; w.explodeCar(e); } } run(10); break;
    case 'damage': { const c = m.refs[s.ref]; c.hp = c.maxHp * s.below * 0.8; run(10); break; }
    case 'unseat': { const c = m.refs[s.ref]; if (c.driver) w.ejectPed(c.driver, c); run(10); break; }
    case 'pickup': { const k = m.refs[s.ref]; if (P.car && P.car.m.boat) { P.car.driver = null; P.car = null; } if (P.car) { P.car.x = k.x; P.car.y = k.y; P.car.vx = P.car.vy = 0; } else onFoot(k.x, k.y); run(10); break; }
    case 'board': {
      const q = m.refs[s.ref];
      const at = free(q.x + 4 * M, q.y);
      const c = carAt(at[0], at[1]);
      c.x = at[0]; c.y = at[1];
      run(400); break;
    }
    case 'drop': { const p = m.placeOf(s.at); const q = m.refs[s.ref]; const c = q.car; c.x = p.x; c.y = p.y; c.vx = c.vy = 0; run(30); break; }
    case 'lose': w.setWanted(0); run(5); break;
    case 'follow': {
      const c = m.refs[s.ref];
      const dest = c.ai.dest;
      c.x = dest.x + 20; c.y = dest.y; c.vx = c.vy = 0;
      carAt(dest.x + 150, dest.y);
      run(30); break;
    }
    case 'race': {
      for (let k = 0; k < m.cps.length && m.state === 'run'; k++) { const cp = m.cps[m.cp]; if (!cp) break; carAt(cp.x, cp.y); run(3); }
      break;
    }
    case 'crush': {
      const g = city.garages.crusher;
      for (let k = 0; k < s.n; k++) { const c = carAt(g.front.x, g.front.y); run(2); c.x = g.x; c.y = g.y; c.vx = c.vy = 0; run(90); }
      break;
    }
    case 'fares': {
      const c = carAt(P.x, P.y);
      if (!game.taxi) game.toggleTaxi();
      for (let k = 0; k < s.n && m.state === 'run'; k++) {
        run(200);
        const t = game.taxi;
        if (!t || !t.hail) { run(200); }
        const q = game.taxi && game.taxi.hail;
        if (!q) continue;
        const at = free(q.x + 3 * M, q.y);
        c.x = at[0]; c.y = at[1]; c.vx = c.vy = 0;
        run(300);
        if (game.taxi && game.taxi.dest) { c.x = game.taxi.dest.x; c.y = game.taxi.dest.y; c.vx = c.vy = 0; run(20); }
      }
      break;
    }
    case 'bombfit': {
      game.prog.score += 3000;
      const g = m.nearestGarage('bomb');
      const c = carAt(g.front.x, g.front.y); run(2);
      c.x = g.x; c.y = g.y; c.vx = c.vy = 0; run(150);
      break;
    }
    case 'countdown': run(Math.ceil(s.secs * 60) + 2); break;
    case 'wait': run(Math.ceil(s.secs * 60) + 2); break;
    default: run(10);
  }
}

function playChapter(game, n) {
  let guard = 0;
  while (game.mode === 'play' && guard++ < 40) {
    const ch = game.chapter;
    const w = game.world;
    w.god = true;
    let phone = null;
    for (const ph of Object.keys(ch.phones)) { const a = game.availableFor(ph); if (a && !a.finale) { phone = ph; break; } }
    if (!phone) for (const ph of Object.keys(ch.phones)) if (game.availableFor(ph)) { phone = ph; break; }
    if (!phone) {
      const missing = ch.target - (game.prog.score - game.prog.chapterStart);
      if (missing > 0) game.prog.score += missing;
      for (const ph of Object.keys(ch.phones)) if (game.availableFor(ph)) { phone = ph; break; }
    }
    ok(phone, 'a phone has a mission in chapter ' + n);
    for (const k of Object.keys(game.cooldown)) delete game.cooldown[k];
    const pl = city.places[phone];
    if (w.player.car) { w.player.car.driver = null; w.player.car = null; }
    w.player.x = pl.x; w.player.y = pl.y;
    for (let k = 0; k < 30 && !game.mission; k++) game.update(STEP, {});
    ok(game.mission, 'phone starts a mission at ' + phone);
    const m = game.mission;
    const id = m.def.id;
    let steps = 0;
    while (game.mission === m && m.state === 'run' && steps++ < 60) {
      const before = m.idx;
      solve(game, m);
      if (game.mission === m && m.idx === before && m.state === 'run') { for (let k = 0; k < 60; k++) game.update(STEP, {}); }
      if (game.mode !== 'play' && game.mode !== 'chapterEnd' && game.mode !== 'win') break;
    }
    ok(game.prog.done.includes(id), 'mission completed by the bot: ' + id + ' (step ' + (m.cur && m.cur.do) + ', state ' + m.state + ', reason ' + (m.reason || '') + ', mode ' + game.mode + ')');
    log('passed', id, game.prog.score, 'x' + game.prog.mult);
  }
}

{
  const game = new G.Game({ density: 0.6 });
  game.newGame(1);
  ok(game.world.player && game.mode === 'play', 'new game');
  ok(game.fem, 'female character flag');
  for (let n = 0; n < G.CHAPTERS.length; n++) {
    playChapter(game, n);
    const done = G.MISSION_LIST.filter(m => m.chapter === n).every(m => game.prog.done.includes(m.id));
    ok(done, 'all missions done in chapter ' + n);
    if (n < G.CHAPTERS.length - 1) {
      ok(game.mode === 'chapterEnd', 'chapter end ' + n + ' mode ' + game.mode);
      const saved = game.serialize();
      game.nextChapter();
      ok(game.prog.chapter === n + 1, 'next chapter');
      const g2 = new G.Game({ density: 0.6 });
      g2.load(saved);
      ok(g2.prog.score === saved.score, 'save/load keeps score');
    }
  }
  ok(game.mode === 'win', 'game won, mode ' + game.mode);
  ok(game.renamed, 'Sverdlovsk renamed back to Yekaterinburg');
  log('final score', game.prog.score, game.prog.stats);
}

{
  const game = new G.Game({ density: 0.6 });
  game.newGame(0);
  const w = game.world;
  w.player.hp = 1;
  w.pedDamage(w.player, 50, null, 'bullet');
  ok(game.mode === 'wasted', 'death -> wasted');
  for (let k = 0; k < 250; k++) game.update(STEP, {});
  ok(game.mode === 'play' && game.prog.lives === 3, 'respawn in hospital with one life less');
  ok(['hosp_1', 'hosp_2', 'hosp_3'].some(h => Math.hypot(city.places[h].x - w.player.x, city.places[h].y - w.player.y) < 40 * M), 'respawn at a Sverdlovsk hospital');
  w.setWanted(1);
  const cop = w.spawnPed('cop', w.player.x + 6, w.player.y, { state: 'chase' });
  cop.target = w.player;
  for (let k = 0; k < 120 && game.mode === 'play'; k++) game.update(STEP, {});
  ok(game.mode === 'busted', 'cop arrests the player on foot');
  for (let k = 0; k < 250; k++) game.update(STEP, {});
  ok(game.mode === 'play' && w.wanted.level === 0, 'released from the police station');
  game.prog.score = 5000;
  const spray = Object.values(city.garages).find(g => g.kind === 'spray');
  const c = w.spawnCar('vaz2106', spray.front.x, spray.front.y, 0, { parked: true });
  w.enterCar(w.player, c);
  w.setWanted(2);
  const col = c.color;
  c.x = spray.x; c.y = spray.y;
  for (let k = 0; k < 150; k++) game.update(STEP, {});
  ok(w.wanted.level === 0 && game.prog.score === 4000, 'spray shop clears the wanted level for 1000 roubles');
  ok(c.color !== col, 'spray shop changes colour');
  game.prog.lives = 0;
  w.exitCar(w.player);
  w.player.hp = 1;
  w.pedDamage(w.player, 50, null, 'bullet');
  for (let k = 0; k < 250; k++) game.update(STEP, {});
  ok(game.mode === 'gameover', 'game over with no lives');
  game.restartChapter();
  ok(game.mode === 'play' && game.prog.lives >= 3, 'restart chapter');
}

{
  const LINE = String.fromCharCode(47, 47), BLOCK = String.fromCharCode(47, 42);
  const OLD_CORP = 'Micro' + 'soft', OLD_OS = 'Win' + 'dows';
  const BRAND = new RegExp(OLD_CORP + '|' + OLD_OS), EDGE_DIR = 'Program Files (x86)/' + OLD_CORP + '/Edge';
  const files = ORDER.map(f => 'js/apps/gta90/' + f + '.js').concat(['js/apps/gta90-app.js', 'tests/gta90.test.js', 'tools/g90-import.cjs', 'tools/gta90-shots.cjs']);
  for (const f of files) {
    const src = read(f);
    const noStrings = src.replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, '""');
    ok(!noStrings.includes(LINE) && !noStrings.includes(BLOCK), f + ' has no comments');
    ok(!BRAND.test(src.split(EDGE_DIR).join('')), f + ' has no Microslop or Win brand names written the old way');
  }
  ok(!read('gta90.html').includes('<!' + '--'), 'page has no comments');
  const cfg = JSON.parse(read('tools/g90-center.json'));
  ok(cfg.id === 'center' && cfg.year === 1991 && cfg.infill, 'district config for the 1990 center');
  const page = read('gta90.html'), html = read('index.html');
  let last = -1, lastPage = -1;
  for (const f of ORDER) {
    const tag = 'js/apps/gta90/' + f + '.js';
    const i = html.indexOf(tag), j = page.indexOf(tag);
    ok(i > last, 'index.html loads ' + f + ' in order');
    ok(j > lastPage, 'gta90.html loads ' + f + ' in order');
    last = i; lastPage = j;
  }
  ok(html.indexOf('js/apps/gta90-app.js') > last, 'app wrapper after modules');
  const gm = read('js/game-manager.js');
  const entry = gm.slice(gm.indexOf('      gta90: {'), gm.indexOf('      dota: {'));
  ok(entry.includes("title: \"Grand Theft Auto: Екатеринбург '90\"") && entry.includes('steam: true') && entry.includes('Свердловск, 1990'), 'Steam catalog entry renamed');
  const tags = (entry.match(/tags: \[([^\]]*)\]/) || ['', ''])[1].split(',').filter(Boolean);
  const shots = (entry.match(/shots: \[([^\]]*)\]/) || ['', ''])[1].split("',").filter(Boolean);
  ok(tags.length >= 3 && tags.length <= 5 && shots.length >= 2 && /genre: '/.test(entry), 'catalog genre, tags and screenshot captions');
  ok(fs.existsSync(path.join(ROOT, 'content/steam/gta90-1.jpg')) && fs.existsSync(path.join(ROOT, 'content/steam/gta90-2.jpg')), 'Steam screenshots exist');
  for (const f of ['js/game-manager.js', 'js/desktop.js', 'js/taskbar.js', 'js/i18n.js', 'js/icons.js', 'js/apps/dialogs.js', 'js/apps/explorer.js', 'js/apps/clippy.js', 'js/apps/advanced-site.js', 'js/apps/gta90-app.js', 'js/filesystem.js', 'js/apps/steam.js']) {
    const src = read(f);
    ok(!/Нижний '90|Nizhny '90|НИЖНИЙ 90|Kolyan_NN|Gorky, autumn 1990/.test(src), f + ' no longer names the Gorky game');
  }
  ok((read('js/i18n.js').match(/'app\.gta90': "GTA: Екатеринбург '90"/g) || []).length === 2 && (read('js/i18n.js').match(/'app\.gta90': "GTA: Yekaterinburg '90"/g) || []).length === 2, 'i18n names in both languages');
  ok(/cmd === 'екатеринбург'/.test(read('js/apps/dialogs.js')), 'Run dialog alias');
}

console.log(`gta90: ${checks} checks passed in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
