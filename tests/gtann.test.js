const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/gtann');
const SIM = ['nn-core', 'nn-data', 'nn-avto', 'nn-map', 'nn-town', 'nn-sites', 'nn-street', 'nn-green', 'nn-phys', 'nn-debris', 'nn-weather', 'nn-world', 'nn-ai', 'nn-crowd', 'nn-metro', 'nn-park', 'nn-story', 'nn-cut', 'nn-missions', 'nn-act1', 'nn-act2', 'nn-act3', 'nn-game'];
const GFX = ['nn-tex', 'nn-geo', 'nn-props', 'nn-landmarks', 'nn-detail', 'nn-flora', 'nn-metrogfx', 'nn-models', 'nn-cars', 'nn-army', 'nn-anim', 'nn-shaders', 'nn-render', 'nn-guns', 'nn-parkgfx', 'nn-scene', 'nn-hud', 'nn-audio', 'nn-voice', 'nn-art', 'nn-menus', 'nn-debug', 'nn-photo', 'nn-ui'];
const ORDER = SIM.concat(GFX);

const store = new Map();
globalThis.localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
for (const f of ORDER) require(path.join(DIR, f + '.js'));
const N = globalThis.GtaNN;

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const VERBOSE = process.argv.includes('-v');
const log = (...a) => { if (VERBOSE) console.log(...a); };
function section(name, fn) { const s = Date.now(); fn(); log(name + ': ' + (Date.now() - s) + ' ms'); }

const city = N.getCity();
const GT = N.GT;

const inBuilding = (x, z) => {
  let hit = false;
  city.hash.query(x, z, x, z, b => { if (!b.circle && b.kind === 'building' && b.y1 > 2 && (b.poly ? N.pointInPoly(b.poly, x, z) : x > b.x0 + 0.2 && x < b.x1 - 0.2 && z > b.z0 + 0.2 && z < b.z1 - 0.2)) { hit = true; return true; } });
  return hit;
};

const fenceNear = (x, z, r) => {
  let hit = false;
  city.hash.query(x - r, z - r, x + r, z + r, b => { if (b.kind === 'fence' && (b.poly ? N.pointInPoly(b.poly, x, z) || N.circlePoly(x, z, r, b.poly) : x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r)) { hit = true; return true; } });
  return hit;
};

section('map', () => {
  const again = new N.City(2000);
  ok(again.buildings.length === city.buildings.length && again.props.length === city.props.length && again.g.every((v, i) => v === city.g[i]), 'generation is deterministic');
  ok(N.DISTRICTS.length >= 1 && N.DISTRICTS[0].id === 'avtozavod', 'the Avtozavodsky district data is registered');
  ok(city.buildings.length > 5000 && city.props.length > 30000 && city.edges.length > 600, 'the district is filled ' + city.buildings.length + ' buildings');
  const streets = new Set(city.edges.map(e => e.name));
  for (const n of ['проспект Ленина', 'Молодёжный проспект', 'проспект Октября', 'проспект Кирова', 'улица Лескова', 'Южное шоссе', 'Мончегорская улица', 'улица Монастырка', 'улица Краснодонцев', 'Мызинский мост']) ok(streets.has(n), 'real street ' + n);
  const lenina = city.edges.filter(e => e.name === 'проспект Ленина').reduce((a, e) => a + e.len, 0);
  ok(lenina > 5000, 'проспект Ленина is ' + Math.round(lenina) + ' m of carriageways');
  ok(city.water[0] && city.inWater(3000, 1800) && !city.inWater(0, 0) && city.bankL.length > 20 && city.bankR.length > 20, 'the Oka runs along the south-east');
  ok(city.gaz.length > 10 && city.zoneAt(2000, -1000) === 'Горьковский автозавод', 'the GAZ plant territory');
  for (const b of city.buildings) {
    if (b.removed) continue;
    ok(N.polyArea(b.poly) > 0 && b.h > 1 && b.h < 80 && isFinite(b.cx), 'building shape ' + b.id);
  }
  ok(city.buildings.every(b => b.removed || b.floors <= 25), 'no towers built after 2005');
  const styles = new Set(city.buildings.map(b => b.style));
  for (const st of ['panel5', 'brick5', 'panel9', 'stalin', 'soc', 'wood', 'garage', 'hall', 'school', 'kinder', 'hotel', 'club', 'dk', 'cinema', 'hospital', 'ovd']) ok(styles.has(st), 'building style ' + st);
  const need = ['hotel_door', 'hotel_save', 'hotel_spawn', 'kesha_door', 'kesha_garage', 'club_door', 'club_back', 'club_in', 'club_lyova', 'colonel', 'colonel_npc', 'pier', 'gunshop', 'market', 'market_stall', 'market_clothes', 'zarya', 'zarya_in', 'carlot', 'carlot_gate', 'carlot_target', 'convoy_start', 'chop', 'chop_gate', 'chop_ledger', 'tower_door', 'tower_roof', 'park_meet', 'park_cars', 'stadium', 'stadium_gate', 'stadium_vip', 'stadium_lot', 'port', 'port_crane', 'port_quay', 'port_gate', 'myza_bridge', 'respray_n', 'respray_s', 'hosp_n', 'hosp_s', 'ovd_n', 'ovd_s', 'flat', 'dk', 'gaz_gate', 'ferris'];
  for (const id of need) ok(city.places[id], 'place ' + id);
  for (const id of need) {
    const p = city.places[id];
    if (id === 'tower_roof' || id.startsWith('club_in') || id === 'club_lyova') continue;
    ok(city.inPlay(p.x, p.z), 'place inside the play area ' + id);
    ok(!inBuilding(p.x, p.z), 'place not inside a building ' + id);
    ok(city.ground(p.x, p.z) !== GT.WATER, 'place not in water ' + id);
  }
  ok(city.ground(city.places.colonel.x, city.places.colonel.z) === GT.FLOOR, 'the colonel waits on the landing stage deck');
  const amb = city.lanes.filter(l => l.ambient);
  const succ = l => l.out.map(c => city.conns[c]).filter(c => c.ambient).map(c => city.lanes[c.to]);
  const reach = (start, next) => { const seen = new Set([start.id]); const q = [start]; while (q.length) { const l = q.pop(); for (const m of next(l)) if (!seen.has(m.id)) { seen.add(m.id); q.push(m); } } return seen; };
  const rev = new Map();
  for (const l of amb) for (const m of succ(l)) { if (!rev.has(m.id)) rev.set(m.id, []); rev.get(m.id).push(l); }
  const A = reach(amb[0], succ), B = reach(amb[0], l => rev.get(l.id) || []);
  const scc = amb.filter(l => A.has(l.id) && B.has(l.id)).length;
  ok(amb.length > 800 && scc / amb.length > 0.98, 'ambient lane graph strongly connected ' + scc + '/' + amb.length);
  ok(amb.every(l => succ(l).length > 0), 'no ambient dead ends');
  ok(city.lanes.every(l => l.pts.length >= 4 && l.pts.every(isFinite) && l.len > 0), 'lanes are finite polylines');
  ok(city.nodes.filter(n => n.light).length >= 40, 'traffic lights at real signalled junctions');
  const narrowGaps = city.edges.filter(e => {
    const A = city.nodes[e.a], B = city.nodes[e.b];
    if (e.plant || A === B || A.ends.length !== 2 || B.ends.length !== 2) return false;
    const p = city.edges[A.ends.find(q => q.e !== e.id).e], q = city.edges[B.ends.find(q => q.e !== e.id).e];
    return !p.plant && !q.plant && p.oneway === e.oneway && q.oneway === e.oneway && Math.min(p.lanes, q.lanes) > e.lanes;
  });
  const oktStop = city.nearestEdge(470, -1866, e => e.name === 'проспект Октября', 10);
  ok(!narrowGaps.length && oktStop && oktStop.e.hw === 7, 'a stretch with a missing lane count keeps the width of the road around it (проспект Октября at the bus stop)');
  const inner = city.edges.filter(e => e.inner);
  ok(inner.length > 10 && inner.every(e => !e.swR && !e.swL && e.len < 25 && city.nodes[e.a].light && city.nodes[e.a].cluster === city.nodes[e.b].cluster), 'short links inside signalled junctions carry no sidewalks (' + inner.length + ')');
  const arms = city.nodes.flatMap(n => n.ends.map(en => ({ n, en, e: city.edges[en.e] })));
  const zebraArms = arms.filter(a => a.en.zebra);
  ok(zebraArms.length > 150 && zebraArms.length < 450 && zebraArms.every(a => !a.e.inner && !a.e.plant && (a.e.swR > 0 || a.e.swL > 0)), 'junction zebras follow mapped crossings, never inside a junction (' + zebraArms.length + ')');
  const kiselev = zebraArms.filter(a => a.n.x > 140 && a.n.x < 250 && a.n.z > -230 && a.n.z < -140);
  ok(kiselev.length > 0 && kiselev.length <= 12, 'площадь Киселёва has a few zebras, not one per ring node (' + kiselev.length + ')');
  const tlInner = city.tlights.filter(p => city.nodes[p.node].ends.some(en => city.edges[en.e].inner && Math.hypot(en.mx - p.x, en.mz - p.z) < 2.5));
  ok(!tlInner.length, 'no traffic light stands on a link inside a junction');
  ok(city.fills.length >= 3 && city.fills.every(f => { let x = 0, z = 0; for (let i = 0; i < f.length; i += 2) { x += f[i]; z += f[i + 1]; } return city.surfaceAt(x / (f.length / 2), z / (f.length / 2)) === 0; }), 'the core between linked signal nodes is paved');
  const pathHash = new N.SpatialHash(16);
  for (const l of city.foot.concat(city.surf)) for (let i = 2; i < l.pts.length; i += 2) { const ax = l.pts[i - 2], az = l.pts[i - 1], bx = l.pts[i], bz = l.pts[i + 1], w = l.w / 2; pathHash.insert({ ax, az, bx, bz, w, x0: Math.min(ax, bx) - w, z0: Math.min(az, bz) - w, x1: Math.max(ax, bx) + w, z1: Math.max(az, bz) + w }); }
  const treesOnPaths = city.props.filter(p => p.type === 'tree' && (city.surfaceAt(p.x, p.z) !== 3 || pathHash.query(p.x, p.z, p.x, p.z, it => N.segDist2(p.x, p.z, it.ax, it.az, it.bx, it.bz)[0] < (it.w + 0.3) * (it.w + 0.3))));
  ok(!treesOnPaths.length, 'no tree on a road, sidewalk, footpath or yard drive (' + treesOnPaths.length + ')');
  ok(city.nodes.every(n => !n.poly || n.poly.every(isFinite)), 'junction shapes are finite');
  const W = city.walk;
  const seen = new Set([0]);
  const q = [0];
  while (q.length) { const n = W.nodes[q.pop()]; for (const e of n.links) { const E = W.edges[e]; const o = E.a === n.id ? E.b : E.a; if (!seen.has(o)) { seen.add(o); q.push(o); } } }
  ok(W.nodes.length > 3000 && seen.size / W.nodes.length > 0.97, 'sidewalk graph connected');
  const P = city.places;
  const drivable = (x, z) => city.nearestLane(x, z, 80, () => true);
  for (const id of ['hotel_door', 'kesha_door', 'club_door', 'market', 'zarya', 'carlot_gate', 'chop_gate', 'stadium_gate', 'port_gate', 'respray_n', 'respray_s', 'myza_bridge', 'gunshop', 'convoy_start']) ok(drivable(P[id].x, P[id].z), 'road near ' + id);
  ok(!fenceNear(P.carlot_gate.x, P.carlot_gate.z, 1.5), 'the car lot gate is open');
  ok(!fenceNear(P.chop_gate.x, P.chop_gate.z, 1.5), 'the chop shop gate is open');
  const nn = (x, z) => city.nearestNode(x, z, n => n.deg > 1 && n.ends.some(e => !city.edges[e.e].plant && !city.edges[e.e].stub));
  ok(city.route(nn(P.hotel_door.x, P.hotel_door.z).id, nn(P.port_gate.x, P.port_gate.z).id, false), 'route from the hotel to the GAZ port');
  ok(city.route(nn(P.convoy_start.x, P.convoy_start.z).id, nn(P.myza_bridge.x, P.myza_bridge.z).id, false), 'route from the convoy start to the Myza bridge');
  ok(city.zoneAt(P.stadium.x, P.stadium.z) === 'Стадион «Торпедо»' && city.zoneAt(P.zarya.x, P.zarya.z) === 'ГСК «Заря»' && city.zoneAt(3000, 1800) === 'Ока' && city.zoneAt(P.carlot.x, P.carlot.z) === 'Площадка готовой продукции ГАЗ', 'zone names');
  ok(city.zoneList.every(z => !/^ЖК/.test(z.name)), 'no residential complexes from after 2005');
  ok(city.exits.length > 10, 'play area exits are blocked by road works');
  ok(city.stashes.length === 20 && city.jumps.length >= 2, 'stashes and jumps');
  for (const s of city.stashes) ok(!inBuilding(s.x, s.z) && city.ground(s.x, s.z) !== GT.WATER && city.inPlay(s.x, s.z), 'stash reachable ' + s.id);
  ok(city.teleports.filter(t => !t.gate).length === 2 && city.clubRoom, 'tower roof and club interior');
  const pier = P.pier;
  const q1 = N.placeAt(pier, 6, 0), q2 = N.placeAt(pier, -9, 0);
  ok(Math.hypot(q1[0] - pier.x, q1[1] - pier.z) > 5.9 && city.inWater(pier.x + (q1[0] - pier.x) * 3, pier.z + (q1[1] - pier.z) * 3) && !city.inWater(q2[0], q2[1]), 'mission offsets at the pier point to the river');
});

section('data', () => {
  ok(N.VEHICLE_IDS.length === 29, '29 vehicle types');
  const names = N.VEHICLE_IDS.map(id => N.VEHICLES[id].name).join(' ');
  for (const n of ['ВАЗ-2101', 'ВАЗ-2106', 'ВАЗ-2107', 'ВАЗ-2109', 'ВАЗ-2110', 'ВАЗ-2121', 'ГАЗ-24', 'ГАЗ-3110', 'ГАЗ-3102', 'Москвич', 'УАЗ', 'ГАЗель', 'BMW', 'Mercedes', 'Audi', 'Land Cruiser', 'Урал-4320', 'БТР-80', 'Т-72Б']) ok(names.includes(n), 'vehicle ' + n);
  for (const id of N.VEHICLE_IDS) {
    const v = N.VEHICLES[id];
    ok(v.shape.L > v.shape.W && v.vmax > (v.type === 'tank' ? 15 : 20) && v.acc > 0 && v.hp > 0 && v.colors.length && v.mass > 100, 'vehicle spec ' + id);
    for (const [lid, l] of Object.entries(v.liveries || {})) ok(l.c1 && (!l.cargo || N.VEHICLES[l.cargo]), 'livery ' + id + ' ' + lid);
  }
  for (const w of ['knuckles', 'knife', 'pm', 'shotgun', 'ak', 'svd', 'grenade', 'toz34', 'pkm', 'vss', 'rpg7', 'sks', 'kiparis', 'bizon', 'molotov', 'rsh12', 'izh38']) ok(N.WEAPONS[w], 'weapon ' + w);
  ok(N.WEAPON_IDS.length === 18, 'fists plus seventeen weapons');
  ok(N.WEAPON_IDS.every(id => N.SLOTS[N.WEAPONS[id].slot].includes(id)) && N.SLOTS.flat().length === N.WEAPON_IDS.length, 'every weapon sits in its slot');
  ok(N.WEAPON_IDS.every(id => { const W = N.WEAPONS[id]; return W.melee || W.throw || W.mz && W.kick && W.rk && W.rk.every(([u]) => u > 0 && u < 1) && W.reload > 0 && W.clip > 0; }), 'every gun has a muzzle, a kick and a reload timeline');
  ok(N.WEAPON_IDS.every(id => !N.WEAPONS[id].unlockWith || N.WEAPONS[N.WEAPONS[id].unlockWith]), 'unlock chains point at real weapons');
  for (const [k, mix] of Object.entries(N.TRAFFIC_MIX)) for (const [m] of mix) ok(N.VEHICLES[m], 'traffic model ' + k + ' ' + m);
  for (const [k, mix] of Object.entries(N.CIVIL_MIX)) for (const [m] of mix) ok(N.PED_KINDS[m], 'ped kind ' + k + ' ' + m);
});

const straight = (() => {
  let best = null;
  for (const l of city.lanes) {
    const e = city.edges[l.edge];
    if (e.plant || e.bridge || !l.ambient) continue;
    const p = l.pts;
    for (let i = 0; i + 3 < p.length; i += 2) {
      const d0 = Math.atan2(p[i + 3] - p[i + 1], p[i + 2] - p[i]);
      let L = 0, j = i;
      while (j + 3 < p.length && Math.abs(N.wrap(Math.atan2(p[j + 3] - p[j + 1], p[j + 2] - p[j]) - d0)) < 0.02) { L += Math.hypot(p[j + 2] - p[j], p[j + 3] - p[j + 1]); j += 2; }
      if (!best || L > best.L) best = { L, x: p[i], z: p[i + 1], yaw: N.yawOf(Math.cos(d0), Math.sin(d0)) };
    }
  }
  return best;
})();

const fenceRun = (() => {
  for (const f of city.fenceSegs) {
    if (f.tex !== 'concfence') continue;
    const L = Math.hypot(f.bx - f.ax, f.bz - f.az);
    if (L < 12) continue;
    const mx = (f.ax + f.bx) / 2, mz = (f.az + f.bz) / 2, nx = -(f.bz - f.az) / L, nz = (f.bx - f.ax) / L;
    for (const sg of [1, -1]) {
      let clear = true;
      for (let k = 2; k <= 18 && clear; k++) {
        const x = mx + nx * sg * k, z = mz + nz * sg * k;
        city.hash.query(x - 1.6, z - 1.6, x + 1.6, z + 1.6, b => { if (b.kind !== 'fence' && b.kind !== 'edge') { clear = false; return true; } });
        if (city.ground(x, z) === GT.WATER) clear = false;
      }
      if (clear) return { x: mx + nx * sg * 16, z: mz + nz * sg * 16, yaw: N.yawOf(-nx * sg, -nz * sg), mx, mz, nx: nx * sg, nz: nz * sg };
    }
  }
  return null;
})();

function drive(model, ctl, secs, start) {
  const w = new N.World(city, { seed: 3, settings: { ambient: false } });
  const s = start || straight;
  const v = w.spawnVehicle(model, s.x, s.z, s.yaw);
  w.seat(w.player, v, true);
  const out = [];
  for (let i = 0; i < secs * 60; i++) {
    const c = typeof ctl === 'function' ? ctl(i / 60, v) : ctl;
    w.step(1 / 60, { fwd: c.thr, steer: c.steer, hand: c.hand });
    w.ev.length = 0;
    out.push(v.spd);
  }
  return { v, out, w };
}

section('physics', () => {
  const r = drive('vaz2107', { thr: 1, steer: 0 }, 20);
  const t100 = r.out.findIndex(s => s > 27.8) / 60;
  const top = Math.max(...r.out) * 3.6;
  ok(t100 > 4 && t100 < 10, 'VAZ-2107 0-100 km/h in ' + t100.toFixed(1) + ' s');
  ok(top > 115 && top < 150, 'VAZ-2107 top speed ' + top.toFixed(0));
  const b = drive('bmw525', { thr: 1, steer: 0 }, 20);
  ok(Math.max(...b.out) > Math.max(...r.out) + 5, 'the BMW is faster than the Lada');
  const t = drive('gaz53', { thr: 1, steer: 0 }, 20);
  ok(Math.max(...t.out) < Math.max(...r.out), 'the truck is slower');
  const br = drive('vaz2107', tt => (tt < 8 ? { thr: 1, steer: 0 } : { thr: -1, steer: 0 }), 13);
  ok(Math.min(...br.out.slice(8 * 60).map(Math.abs)) < 0.8 && br.out.findIndex((v, i) => i > 8 * 60 && Math.abs(v) < 0.8) < 12.5 * 60, 'brakes stop the car');
  ok(br.v.spd < -1, 'holding the brake reverses');
  ok(straight && straight.L > 600, 'a long straight road for the physics tests ' + Math.round(straight.L) + ' m');
  ok(fenceRun, 'a concrete fence with a clear run-up');
  const wall = drive('vaz2107', { thr: 1, steer: 0 }, 10, fenceRun);
  ok((wall.v.x - fenceRun.mx) * fenceRun.nx + (wall.v.z - fenceRun.mz) * fenceRun.nz > 0 && wall.v.hp < wall.v.maxHp, 'a concrete fence stops the car and damages it');
  const hb = drive('vaz2107', tt => (tt < 5 ? { thr: 1, steer: 0 } : { thr: 1, steer: 1, hand: true }), 6.5);
  ok(Math.abs(hb.v.wz) > 0.4 || Math.abs(N.wrap(hb.v.yaw)) > 0.8, 'handbrake turn');
  for (const m of N.VEHICLE_IDS) {
    const d = drive(m, tt => ({ thr: 1, steer: Math.sin(tt) * 0.6 }), 6);
    ok(isFinite(d.v.x) && isFinite(d.v.z) && Math.max(...d.out) > 5, 'drives ' + m);
  }
});

section('vehicle physics', () => {
  const APRON = { x: 3000, z: 700 };
  let clear = true;
  city.hash.query(APRON.x - 70, APRON.z - 70, APRON.x + 70, APRON.z + 70, b => { if (b.kind !== 'edge') { clear = false; return true; } });
  ok(clear && city.ground(APRON.x, APRON.z) === GT.CONC && city.groundY(APRON.x, APRON.z) === 0, 'an open concrete apron for the handling tests');
  const world = () => new N.World(city, { seed: 3, settings: { ambient: false } });
  const sit = (w, model, x, z, yaw, o) => { const v = w.spawnVehicle(model, x, z, yaw, o); w.seat(w.player, v, true); return v; };
  const run = (w, n, inp, fn) => { for (let i = 0; i < n; i++) { w.step(1 / 60, typeof inp === 'function' ? inp(i / 60) : inp || {}); if (fn) fn(i / 60, w.ev); w.ev.length = 0; } };
  const H = N.Phys.handling(N.VEHICLES.vaz2107);
  ok(H.gearV.length === 5 && H.gearV.every((g, i) => i === 0 || g > H.gearV[i - 1]) && N.Phys.handling(N.VEHICLES.vaz2101).gearV.length === 4, 'gearboxes: five speeds in the «семёрка», four in the «копейка»');
  ok(N.VEHICLE_IDS.every(id => { const h = N.Phys.handling(N.VEHICLES[id]); return h.k > 0 && h.c > 0 && h.sag > 0 && h.h > 0 && h.hull.length === 8 && h.dmg > 0; }), 'every vehicle has springs, dampers, a hull and a damage factor');

  const wall = (model, speed) => {
    const w = world(), s = fenceRun, d = 2.6 + N.VEHICLES[model].hl;
    const v = sit(w, model, s.mx + s.nx * d, s.mz + s.nz * d, s.yaw);
    v.vx = Math.sin(s.yaw) * speed; v.vz = -Math.cos(s.yaw) * speed;
    run(w, 120);
    return v;
  };
  const slow = wall('vaz2107', 5.5), city60 = wall('vaz2107', 16.7), fast = wall('vaz2107', 30);
  ok(slow.hp === slow.maxHp, 'a 20 km/h bump into a fence does no damage');
  ok(city60.hp < city60.maxHp && city60.hp > city60.maxHp * 0.85 && !city60.burning, 'a 60 km/h hit costs the «семёрка» under 15 % (' + Math.round((1 - city60.hp / city60.maxHp) * 100) + ' %)');
  ok(fast.hp > fast.maxHp * 0.55 && fast.hp < city60.hp && !fast.burning && !fast.fire, 'a 108 km/h hit dents it hard but does not set it on fire (' + Math.round((1 - fast.hp / fast.maxHp) * 100) + ' %)');
  const oka = wall('oka', 30), volga = wall('volga3110', 30);
  ok(oka.hp / oka.maxHp < volga.hp / volga.maxHp, 'an «Ока» suffers more than a «Волга» in the same crash');

  const hw = world();
  const a = sit(hw, 'vaz2107', APRON.x - 8, APRON.z, Math.PI / 2), b = hw.spawnVehicle('vaz2107', APRON.x + 8, APRON.z + 0.3, -Math.PI / 2);
  hw.seat(hw.spawnPed('worker', b.x, b.z, 0), b, true);
  b.ai = null;
  a.vx = 13.9; b.vx = -13.9;
  let crashes = 0;
  run(hw, 90, {}, (t, ev) => { crashes += ev.filter(e => e.t === 'crash').length; });
  ok(crashes >= 1 && a.hp < a.maxHp && a.hp > a.maxHp * 0.7 && b.hp > b.maxHp * 0.7 && !a.burning && !b.burning, 'a head-on crash at 50 km/h each dents both cars, nothing burns');

  const fw = world(), burnCar = fw.spawnVehicle('vaz2106', APRON.x, APRON.z, 0), smokeCar = fw.spawnVehicle('vaz2106', APRON.x + 10, APRON.z, 0);
  burnCar.hp = burnCar.maxHp * 0.2;
  smokeCar.hp = smokeCar.maxHp * 0.5;
  run(fw, 1);
  ok(burnCar.burning && burnCar.fire === 0.5 && smokeCar.smoke > 0 && !smokeCar.burning, 'below a quarter of its health the engine burns, at half it only smokes');
  let boomAt = -1;
  run(fw, 9 * 60, {}, (t, ev) => { if (boomAt < 0 && ev.some(e => e.t === 'carboom')) boomAt = t; });
  ok(burnCar.dead && boomAt > 3 && boomAt < 8 && !smokeCar.burning, 'a burning engine blows the car up after a few seconds (' + boomAt.toFixed(1) + ' s)');

  const rw = world(), roof = sit(rw, 'vaz2107', APRON.x, APRON.z, 0);
  roof.roll = Math.PI; roof.y = 1.6;
  let fireAt = -1;
  run(rw, 4 * 60, {}, t => { if (fireAt < 0 && roof.burning) fireAt = t; });
  ok(roof.up < -0.9 && roof.hulls >= 2 && fireAt > 2 && fireAt < 3.5, 'a car left on its roof catches fire after a few seconds (' + fireAt.toFixed(1) + ' s)');
  const sw = world(), side = sit(sw, 'vaz2107', APRON.x, APRON.z, 0);
  side.roll = 1.5; side.y = 0.9;
  run(sw, 90);
  const lying = Math.abs(side.up) < 0.3 && !side.wheels;
  run(sw, 4 * 60, t => ({ steer: Math.sin(t * 6) > 0 ? 1 : -1 }));
  ok(lying && side.up > 0.95 && side.wheels === 4 && !side.burning, 'a car on its side is rocked back onto its wheels with the steering');

  const cw = world(), corner = sit(cw, 'vaz2107', APRON.x - 50, APRON.z, Math.PI / 2);
  run(cw, 150, () => ({ fwd: corner.spd < 15 ? 1 : 0.2 }));
  let squat = 0;
  run(cw, 60, { fwd: 0.4, steer: 1 });
  ok(corner.roll > 0.03 && corner.wz > 0.4, 'the body rolls to the outside of a right turn (' + (corner.roll * 57.3).toFixed(1) + '°)');
  const bw = world(), brk = sit(bw, 'volga3110', APRON.x - 60, APRON.z, Math.PI / 2);
  run(bw, 240, () => ({ fwd: brk.spd < 20 ? 1 : 0 }), () => { if (brk.gear === 1) squat = Math.max(squat, brk.pitch); });
  let dive = 0, front = 0;
  run(bw, 20, { fwd: -1 }, () => { dive = Math.min(dive, brk.pitch); front = Math.max(front, brk.susp[0]); });
  ok(squat > 0.005 && dive < -0.015 && front > 0.02, 'the nose lifts under power and dives under the brakes, the front springs compress');

  const gw = world(), gv = sit(gw, 'vaz2107', straight.x, straight.z, straight.yaw);
  let topGear = 0, rpmOk = true, shifts = 0, last = 1;
  run(gw, 14 * 60, { fwd: 1 }, () => { topGear = Math.max(topGear, gv.gear); if (gv.gear !== last) { shifts++; last = gv.gear; } if (!(gv.rpm > 0.15 && gv.rpm <= 1.05)) rpmOk = false; });
  ok(topGear >= 4 && shifts >= 3 && rpmOk, 'the gearbox shifts up through ' + topGear + ' gears, revs stay in range');

  const tw = world(), turn = sit(tw, 'vaz2107', APRON.x - 60, APRON.z, Math.PI / 2);
  run(tw, 300, () => ({ fwd: turn.spd < 20 ? 1 : 0 }));
  let yawSum = 0, prev = turn.yaw;
  run(tw, 132, { steer: 1, hand: true }, () => { yawSum += N.wrap(turn.yaw - prev); prev = turn.yaw; });
  ok(yawSum > 2.4, 'a handbrake turn at 72 km/h swings the car round (' + Math.round(yawSum * 57.3) + '°)');
  const dw = world(), dr = sit(dw, 'vaz2106', APRON.x - 60, APRON.z, Math.PI / 2);
  run(dw, 300, () => ({ fwd: dr.spd < 20 ? 1 : 0 }));
  let maxSlide = 0;
  const slideOf = v => Math.abs(Math.asin(N.clamp((v.vx * Math.cos(v.yaw) + v.vz * Math.sin(v.yaw)) / Math.max(1, Math.hypot(v.vx, v.vz)), -1, 1)));
  run(dw, 150, t => (t < 0.3 ? { fwd: 0.5, steer: 1, hand: true } : t < 1.1 ? { fwd: 1, steer: -0.7 } : { fwd: 1 }), () => { maxSlide = Math.max(maxSlide, slideOf(dr)); });
  ok(maxSlide > 0.25 && slideOf(dr) < 0.08 && dr.spd > 15, 'a handbrake flick slides the car (' + Math.round(maxSlide * 57.3) + '°), countersteer catches it without losing the speed');

  const jump = city.jumps.find(j => j.id === 'rails'), ramp = jump && city.ramps.find(r => Math.hypot(r.cx + r.fx * r.l / 2 - jump.x, r.cz + r.fz * r.l / 2 - jump.z) < 1);
  ok(ramp, 'the railway stunt ramp');
  const jw = world(), jv = sit(jw, 'vaz2109', ramp.cx - ramp.fx * 40, ramp.cz - ramp.fz * 40, Math.atan2(ramp.fx, -ramp.fz));
  jv.vx = ramp.fx * 23; jv.vz = ramp.fz * 23;
  let stunt = null, minUp = 1;
  run(jw, 4 * 60, { fwd: 1 }, (t, ev) => { minUp = Math.min(minUp, jv.up); const e = ev.find(q => q.t === 'jumpend'); if (e) stunt = e; });
  ok(stunt && stunt.ok && stunt.air > 0.9 && stunt.dist > 20 && minUp > 0.85 && jv.up > 0.95 && jv.hp === jv.maxHp, 'the railway jump at 83 km/h flies ' + (stunt ? stunt.dist.toFixed(0) + ' m in ' + stunt.air.toFixed(1) + ' s' : '-') + ' and lands on the wheels');
  const aw = world(), av = sit(aw, 'vaz2107', APRON.x, APRON.z, 0);
  av.y = 6; av.vy = 2;
  run(aw, 2);
  run(aw, 30, { steer: 1 });
  ok(av.air && av.wr < -1 && av.roll < -0.2, 'in the air the steering rolls the car');

  const kw = world();
  const kerb = (() => {
    for (const e of city.edges) {
      if (e.plant || !e.swR || e.rank < 1) continue;
      const p = N.plineAt(e.pts, e.cum, e.len / 2), nx = -p.dz, nz = p.dx, L = Math.hypot(nx, nz) || 1;
      const sx = p.x + nx / L * (e.hw + e.swR * 0.5), sz = p.z + nz / L * (e.hw + e.swR * 0.5);
      if (city.groundY(sx, sz) > 0.1 && city.groundY(p.x, p.z) === 0) return { x: p.x, z: p.z, yaw: N.yawOf(nx / L * 0.8 + p.dx * 0.6, nz / L * 0.8 + p.dz * 0.6) };
    }
    return null;
  })();
  ok(kerb, 'a kerb next to a road');
  const kv = sit(kw, 'vaz2107', kerb.x, kerb.z, kerb.yaw);
  kv.vx = Math.sin(kerb.yaw) * 15; kv.vz = -Math.cos(kerb.yaw) * 15;
  let climbed = false, kerbHit = 0;
  run(kw, 30, {}, () => { if (kv.susp.some(s => s > 0.05)) climbed = true; kerbHit = Math.max(kerbHit, kv.hitDv); });
  ok(climbed && kv.hp === kv.maxHp && kv.up > 0.95, 'hopping a kerb at 54 km/h works the springs (' + kerbHit.toFixed(1) + ' m/s), not the bodywork');

  const ow = world(), bv = sit(ow, 'vaz2107', APRON.x, APRON.z, 0);
  let spun = false;
  for (let i = 0; i < 120; i++) { ow.step(1 / 60, { fwd: 1, burn: true }); ow.ev.length = 0; spun = spun || bv.spin > 0; }
  ok(spun && Math.hypot(bv.x - APRON.x, bv.z - APRON.z) < 0.5 && bv.rpm > 0.8 && bv.brake, 'throttle and brake together light up the rear tyres on the spot');
  run(ow, 60, { fwd: 1 });
  ok(bv.spd > 5, 'letting the brake go launches the car');

  const lw = new N.World(city, { seed: 5, clock: 12 * 60 });
  let lean = 0;
  for (let i = 0; i < 25 * 60; i++) { lw.step(1 / 60, {}); lw.ev.length = 0; for (const v of lw.vehs) if (v.ai && v.ai.mode === 'lane' && v.spec.type !== 'bike') lean = Math.max(lean, Math.abs(v.roll)); }
  ok(lean > 0.015 && lean < 0.11, 'traffic cars lean in the turns (' + (lean * 57.3).toFixed(1) + '°)');
  const fx = new N.FX();
  fx.skid(0, 0, 0, 1, 0.04, 120);
  ok(fx.skids.length === 1 && Math.abs(fx.skids[0].l - 0.56) < 1e-6, 'skid marks are kept by the effects');
  for (let i = 0; i < 50; i++) fx.step(1);
  ok(fx.skids.length === 0, 'and fade away');
});

section('breakables', () => {
  const B = city.brks, by = k => B.filter(r => r.kind === k), D = N.Debris;
  const count = {};
  for (const r of B) count[r.kind] = (count[r.kind] || 0) + 1;
  ok(count.bench > 2000 && count.urn > 2300 && count.bin > 600 && count.fence > 30000 && count.picket > 5000 && count.rail > 500 && count.sign > 500 && count.crate > 150 && count.barrel > 50 && count.lamp > 4000 && count.trafficlight > 150, 'breakable street furniture on the map ' + JSON.stringify(count));
  ok(B.every(r => N.BREAK[r.kind] && r.p.brk === r && (r.col ? r.col.brk === r : r.base && r.base.stack.includes(r))), 'every breakable is tied to its prop and its collider');
  ok(!city.boxes.some(b => b.bp && !b.brk) && !city.circles.some(c => c.bp && !c.brk), 'no collider is left behind by a removed prop');
  const signs = new Set(by('sign').map(r => r.p.sign));
  ok(['main', 'yield', 'stop', 'cross', 'bus', 'noentry'].every(k => signs.has(k)), 'road signs: main road, give way, stop, crossing, bus stop, no entry');
  ok(city.fenceSegs.filter(f => f.tex === 'metalfence').every(f => f.panel) && by('fence').every(r => r.p.w > 0.35 && r.p.w < 3.8), 'metal fences are cut into panels up to 3.8 m');
  ok(!city.boxes.some(b => b.kind === 'fence' && (b.tex === 'concfence' || b.tex === 'metal') && b.brk), 'concrete and sheet metal fences stay solid');
  for (const k of ['bin', 'crate', 'barrel', 'sign', 'rail', 'picket']) ok(by(k).every(r => !inBuilding(r.x, r.z) && city.surfaceAt(r.x, r.z) !== 0), k + ' stands off the roads and out of the buildings');
  ok(by('rail').every(r => city.surfaceAt(r.x, r.z) === 1), 'pedestrian railings stand on the sidewalk');
  ok(by('crate').some(r => r.base) && city.binSites.length > 250, 'stacked fruit crates and ' + city.binSites.length + ' bin sites');
  for (const k of Object.keys(N.BREAK)) {
    const r = by(k)[0], sh = D.shapeOf(N.BREAK[k].whole(r.p));
    ok(sh.m > 3 && sh.pts.length >= 24 && sh.Ib.every(isFinite) && sh.Ib[0] > 0 && sh.Ib[4] > 0 && sh.Ib[8] > 0, k + ': mass ' + sh.m.toFixed(0) + ' kg, inertia and contact points');
  }

  const world = () => { const w = new N.World(city, { seed: 3, settings: { ambient: false } }); for (const v of w.vehs.slice()) w.removeVehicle(v); return w; };
  const clear = (rec, fx, fz, len, half) => {
    for (let t = 1; t <= len; t++) {
      const x = rec.x - fx * t, z = rec.z - fz * t;
      let hit = city.ground(x, z) === GT.WATER;
      city.hash.query(x - half, z - half, x + half, z + half, it => { if (it === rec.col || it.kind === 'edge') return; if (it.circle ? Math.hypot(it.x - x, it.z - z) < it.r + half : it.poly ? N.pointInPoly(it.poly, x, z) || N.circlePoly(x, z, half, it.poly) : true) { hit = true; return true; } });
      if (hit) return false;
    }
    return true;
  };
  const pick = (kind, axis, filter) => {
    for (const r of B) {
      if (r.kind !== kind || !r.col || r.base || (filter && !filter(r))) continue;
      for (const flip of [0, Math.PI]) {
        const a = r.rot + (axis === 'x' ? 0 : -Math.PI / 2) + flip, fx = Math.cos(a), fz = Math.sin(a);
        if (clear(r, fx, fz, 18, 1.3) && clear(r, -fx, -fz, 12, 1.3)) return { r, fx, fz };
      }
    }
    return null;
  };
  const tilt = b => Math.acos(N.clamp(b.R[4], -1, 1));
  const lowest = b => { let m = 99; const P = b.sh.pts, R = b.R; for (let i = 0; i < P.length; i += 3) { const px = b.x + R[0] * P[i] + R[1] * P[i + 1] + R[2] * P[i + 2], py = b.y + R[3] * P[i] + R[4] * P[i + 1] + R[5] * P[i + 2], pz = b.z + R[6] * P[i] + R[7] * P[i + 1] + R[8] * P[i + 2]; m = Math.min(m, py - city.groundY(px, pz)); } return m; };
  const ram = (kind, axis, speed, filter, secs) => {
    const pk = pick(kind, axis, filter);
    const { r, fx, fz } = pk, w = world();
    const v = w.spawnVehicle('vaz2107', r.x - fx * (8 + N.VEHICLES.vaz2107.hl), r.z - fz * (8 + N.VEHICLES.vaz2107.hl), Math.atan2(fx, -fz));
    w.seat(w.player, v, true);
    const res = { r, fx, fz, w, v, hit: -1, after: null, ev: {} };
    for (let i = 0; i < (secs || 6) * 60; i++) {
      if (res.hit < 0) { v.vx = fx * speed; v.vz = fz * speed; }
      w.step(1 / 60, {});
      for (const e of w.ev) res.ev[e.t] = (res.ev[e.t] || 0) + 1;
      w.ev.length = 0;
      if (res.hit < 0 && w.broken.has(r)) res.hit = i;
      if (res.hit >= 0 && i === res.hit + 20) res.after = Math.hypot(v.vx, v.vz);
    }
    res.bodies = w.broken.has(r) ? w.broken.get(r).bodies : [];
    res.sane = w.debris.every(b => isFinite(b.x + b.y + b.z + b.vx + b.wx) && lowest(b) > -0.05);
    return res;
  };

  const softBench = ram('bench', 'z', 4), hardBench = ram('bench', 'z', 14);
  ok(softBench.bodies.length === 1 && tilt(softBench.bodies[0]) > 0.6 && softBench.sane, 'a 14 km/h nudge knocks the bench over in one piece');
  ok(hardBench.bodies.length === 4 && hardBench.bodies.every(b => b.part >= 0) && hardBench.ev.pbreak >= 2 && hardBench.after > 10 && hardBench.sane, 'at 50 km/h the bench breaks into seat, back and legs; the car keeps ' + (hardBench.after || 0).toFixed(1) + ' m/s');
  ok(hardBench.bodies.every(b => b.sleep), 'the pieces come to rest');
  const pole = ram('lamp', 'x', 15, r => !r.p.park && !r.p.median), b0 = pole.bodies[0];
  const along = b0 ? (b0.x - pole.r.x) * pole.fx + (b0.z - pole.r.z) * pole.fz : 0;
  ok(pole.hit >= 0 && b0 && tilt(b0) > 1.2 && along > 2 && pole.sane && pole.after > 9, 'a lamp post hit at 54 km/h tips over the way the car went and lies on the ground (' + along.toFixed(1) + ' m ahead)');
  ok(pole.ev.pbreak === 1 && !pole.v.burning && pole.v.hp > pole.v.maxHp * 0.9, 'the car loses a little speed and no health');
  const slowPole = ram('lamp', 'x', 3.5, r => !r.p.park && !r.p.median, 2);
  ok(slowPole.hit < 0 && slowPole.w.debris.length === 0, 'at walking pace the lamp post stops the car');
  const fence = ram('fence', 'z', 12), push = ram('fence', 'z', 2, null, 2);
  ok(fence.hit >= 0 && fence.bodies.length === 1 && tilt(fence.bodies[0]) > 1 && fence.sane, 'a fence panel is torn out and lands flat');
  ok(push.hit < 0, 'a slow push does not tear the fence out');
  const sign = ram('sign', 'z', 12);
  ok(sign.hit >= 0 && tilt(sign.bodies[0]) > 1.2 && sign.sane, 'a road sign is knocked down');
  const flySign = ram('sign', 'z', 14, null, 2), fb = flySign.bodies[0];
  const flew = fb ? Math.hypot(fb.x - flySign.r.x, fb.z - flySign.r.z) : 0;
  ok(flySign.hit >= 0 && fb.flown && flew > 8 && flySign.sane, 'a sign hit at 50 km/h snaps off and flies away (' + flew.toFixed(1) + ' m)');
  ok(fb.dents && fb.dents.length && fb.dents[0].d > 0.05 && fb.dents.every(q => q.d <= 0.22 && q.r <= 0.8), 'its pole is dented where the bumper struck');
  const nudge = ram('sign', 'z', 2.7, null, 3), nb = nudge.bodies[0];
  ok(nudge.hit >= 0 && nb && !nb.flown && Math.hypot(nb.x - nudge.r.x, nb.z - nudge.r.z) < 3, 'a slow nudge only bends a sign over at its foot');
  const flyLamp = ram('trafficlight', 'z', 14, null, 2), fl = flyLamp.bodies[0];
  ok(flyLamp.hit < 0 || fl && fl.flown && Math.hypot(fl.x - flyLamp.r.x, fl.z - flyLamp.r.z) > 3, 'a traffic light pole hit fast is thrown, not just tipped');
  const quiet = world(), qs = pick('sign', 'z');
  quiet.spawnPed('militia', qs.r.x + 6, qs.r.z, 0);
  quiet.buildGrid();
  const qv = quiet.spawnVehicle('vaz2107', qs.r.x - qs.fx * 3, qs.r.z - qs.fz * 3, Math.atan2(qs.fx, -qs.fz));
  quiet.seat(quiet.player, qv, true);
  quiet.dislodge(qs.r, { by: quiet.player, car: qv, u: 12, dir: [qs.fx, qs.fz] });
  ok(quiet.broken.has(qs.r) && quiet.wanted.level === 0, 'knocking down street furniture in front of the militia is not a crime');
  const plate = new N.MB(64);
  plate.box(-0.5, 0, -0.05, 0.5, 1, 0.05, { layer: 0 });
  const dm = N.Props.dentMesh(plate, [{ x: 0, y: 0.5, z: -0.05, dx: 0, dy: 0, dz: 1, r: 0.4, d: 0.12 }]);
  let deep = 0, far = true;
  for (let i = 0; i < dm.nv; i++) {
    const x = dm.f[i * 8], y = dm.f[i * 8 + 1], z = dm.f[i * 8 + 2];
    if (Math.hypot(x, y - 0.5) < 0.1) deep = Math.max(deep, z);
    if (Math.hypot(x, y - 0.5, z + 0.05) > 0.45 && Math.abs(Math.abs(z) - 0.05) > 1e-4 && Math.abs(z) > 0.0501) far = false;
  }
  ok(dm.nv > plate.nv * 3 && deep > 0.12 && far, 'a dent pushes the struck face in and leaves the rest of the mesh alone');

  const apron = (kind, extra) => {
    const w = world(), x = 3000, z = 700, p = Object.assign({ type: kind, x, z, rot: 0.3, fruit: '#c8281e' }, extra || {});
    const rec = { id: -1, kind, p, x, z, rot: 0.3, col: null, hp: N.BREAK[kind].hp || 0 };
    w.player.x = x - 20; w.player.z = z;
    w.dislodge(rec, {});
    for (let i = 0; i < 60; i++) w.step(1 / 60, {});
    return { w, rec, x, z };
  };
  const drive = (a, speed, n) => {
    const v = a.w.spawnVehicle('vaz2107', a.x - 9, a.z, Math.PI / 2);
    a.w.seat(a.w.player, v, true);
    for (let i = 0; i < n; i++) { if (Math.abs(v.x - a.x) > v.spec.hl + 0.9) { v.vx = speed; v.vz = 0; } a.w.step(1 / 60, {}); a.w.ev.length = 0; }
    return v;
  };
  const settled = apron('bin');
  ok(settled.w.debris.length === 1 && settled.w.debris[0].sleep && Math.abs(lowest(settled.w.debris[0])) < 0.03, 'a loose container settles on its wheels and sleeps');
  drive(settled, 4, 240);
  const bin = settled.w.debris[0];
  ok(Math.hypot(bin.x - settled.x, bin.z - settled.z) > 1.5 && bin.R[4] > 0.9 && settled.w.debris.length === 1, 'a slow car shoves the container along, it stays upright');
  const bags = apron('bin');
  drive(bags, 14, 240);
  ok(bags.w.debris.length === 3 && bags.w.debris.every(b => lowest(b) > -0.05), 'at 50 km/h the rubbish bags fly out of the container');
  const urn = apron('urn');
  drive(urn, 16, 300);
  ok(urn.w.debris.length === 8 && urn.w.debris.every(b => b.mesh === 'box'), 'a concrete urn smashes into eight chunks');

  const shot = apron('crate');
  const pl = shot.w.player;
  pl.x = shot.x - 6; pl.z = shot.z; pl.y = 0;
  shot.w.giveWeapon(pl, 'pm', 60);
  pl.weapon = 'pm';
  for (let k = 0; k < 3; k++) {
    const m = shot.w.muzzle(pl), b = shot.w.debris[0], dx = b.x - m.x, dy = b.y - m.y, dz = b.z - m.z, L = Math.hypot(dx, dy, dz);
    shot.w.fire(pl, 'pm', m.x, m.y, m.z, dx / L, dy / L, dz / L, 0.0005);
    for (let i = 0; i < 10; i++) shot.w.step(1 / 60, {});
  }
  ok(shot.w.debris.length === 5 && shot.w.debris.every(b => Math.hypot(b.x - shot.x, b.z - shot.z) < 6), 'pistol shots split a fruit crate into planks');
  const kick = apron('crate');
  const kp = kick.w.player;
  kp.x = kick.x - 3; kp.z = kick.z; kp.y = 0;
  for (let i = 0; i < 90; i++) { kick.w.step(1 / 60, { fwd: 1, sprint: true, camYaw: Math.PI / 2 }); kick.w.ev.length = 0; }
  ok(Math.hypot(kick.w.debris[0].x - kick.x, kick.w.debris[0].z - kick.z) > 1.5, 'running into a crate kicks it along');

  const bw = world(), lamp = B.find(r => r.kind === 'lamp' && !r.p.park && !r.p.median);
  bw.player.x = lamp.x + 40; bw.player.z = lamp.z;
  bw.explode(lamp.x + 30, D.yOf(city, lamp) + 0.5, lamp.z, 7.5, 240, null, 'grenade');
  ok(!bw.broken.has(lamp), 'a grenade 30 m away leaves the lamp post standing');
  bw.explode(lamp.x + 2, D.yOf(city, lamp) + 0.5, lamp.z, 7.5, 240, null, 'grenade');
  for (let i = 0; i < 240; i++) { bw.step(1 / 60, {}); bw.ev.length = 0; }
  const lb = bw.broken.get(lamp);
  ok(lb && lb.bodies.length === 1 && tilt(lb.bodies[0]) > 1.2, 'a grenade at its foot brings the lamp post down');
  const rayHit = N.Phys.rayStatic(city, lamp.x - 3, 1, lamp.z, 1, 0, 0, 6, bw, false);
  ok(!(rayHit && rayHit.it === lamp.col), 'bullets pass where the post stood');
  bw.player.x = lamp.x + 400;
  for (let i = 0; i < 26 * 60; i++) { bw.step(1 / 60, {}); bw.ev.length = 0; }
  const back = N.Phys.rayStatic(city, lamp.x - 3, 1, lamp.z, 1, 0, 0, 6, bw, false);
  ok(!bw.broken.has(lamp) && bw.debris.length === 0 && back && back.it === lamp.col && bw.brkVer > 1, 'when the player is far away the street is put back');

  const sw = world(), sb = B.find(r => r.kind === 'bench');
  sw.dislodge(sb, {});
  const ui = { game: { world: sw, city }, city, el: { focus() {} }, audio: { on: false }, resetCam() {} };
  new N.Debug(ui).act('street');
  ok(sw.broken.size === 0 && sw.debris.length === 0, 'F7: restore everything that was broken');
});

section('traffic', () => {
  const w = new N.World(city, { seed: 5, clock: 12 * 60 });
  w.cam = { x: w.player.x, z: w.player.z, yaw: 0 };
  let moving = 0, left = 0, right = 0, wrong = 0;
  for (let i = 0; i < 60 * 60; i++) {
    w.step(1 / 60, {}); w.ev.length = 0;
    if (i % 15 === 0) for (const v of w.vehs) {
      if (!v.ai || v.ai.mode !== 'lane' || !v.ind) continue;
      if (v.ind === -1) left++; else if (v.ind === 1) right++;
      const c = w.city.conns[v.ai.conn >= 0 ? v.ai.conn : v.ai.next];
      if (!c || (v.ind === -1 ? 'L' : 'R') !== c.turn) wrong++;
    }
  }
  ok(left > 0 && right > 0 && wrong === 0, 'traffic signals its left and right turns ' + left + '/' + right);
  for (const v of w.vehs) { ok(isFinite(v.x) && isFinite(v.z), 'vehicle position finite'); if (v.ai && v.ai.mode === 'lane' && v.ai.v > 2) moving++; }
  const cop = w.spawnVehicle('vaz2107', w.player.x, w.player.z, 0, { livery: 'militia' }), army = w.spawnVehicle('uaz469', w.player.x, w.player.z, 0, { livery: 'army' }), civ = w.spawnVehicle('vaz2107', w.player.x, w.player.z, 0);
  ok(cop.plateCls === 'militia' && N.PLATES.militia.includes(cop.plate) && army.plateCls === 'army' && N.PLATES.army.includes(army.plate) && civ.plateCls === 'civil' && N.PLATES.civil.includes(civ.plate), 'militia cars carry blue plates, the army black ones');
  for (const v of [cop, army, civ]) w.removeVehicle(v);
  for (const p of w.peds) ok(isFinite(p.x) && isFinite(p.z), 'ped position finite');
  ok(w.vehs.filter(v => v.ai && v.ai.ambient).length >= 12, 'traffic spawned');
  ok(moving >= 6, 'traffic moves ' + moving);
  ok(w.peds.length > 12, 'pedestrians spawned');
  ok(w.vehs.some(v => v.parkedSpot >= 0), 'parked cars');
});

section('pedestrians', () => {
  const W = city.walk, P = city.places;
  const kinds = {};
  for (const e of W.edges) kinds[e.k] = (kinds[e.k] || 0) + e.len;
  ok(kinds.s > 250000 && kinds.p > 300000 && kinds.c > 5000 && kinds.d > 10000, 'the walk network covers sidewalks, crossings, footpaths, yard drives and door paths (' + Object.entries(kinds).map(([k, v]) => k + ' ' + Math.round(v / 1000) + ' km').join(', ') + ')');
  const doors = W.nodes.filter(n => n.door);
  ok(doors.length > 2000 && doors.every(n => n.links.length === 1 && W.edges[n.links[0]].k === 'd' && isFinite(n.yaw)), 'podezd doors join the network by a door path (' + doors.length + ')');
  ok(W.edges.every(e => e.a !== e.b && isFinite(e.len) && e.len > 0 && W.nodes[e.a].links.includes(e.id) && W.nodes[e.b].links.includes(e.id)), 'walk edges are consistent');
  const sig = W.edges.filter(e => e.sig);
  ok(sig.length > 60 && sig.every(e => e.k === 'c' && city.nodes[e.sig.n].light && (e.sig.g === 0 || e.sig.g === 1)), 'crossings at signalled junctions know their light group (' + sig.length + ')');
  const onCarriageway = (x, z) => {
    let hit = false;
    city.roadHash.query(x, z, x, z, it => { if (it.t === 0 && !it.e.plant && N.segDist2(x, z, it.ax, it.az, it.bx, it.bz)[0] < (it.e.hw - 0.5) * (it.e.hw - 0.5)) { hit = true; return true; } });
    return hit;
  };
  const onRoad = W.nodes.filter(n => n.k === 'p' && onCarriageway(n.x, n.z)).length;
  ok(onRoad / W.nodes.filter(n => n.k === 'p').length < 0.01, 'footpath nodes stay off the carriageway (' + onRoad + ')');
  const blockedSample = W.edges.filter(e => e.k === 'p').slice(0, 4000).filter(e => !city.walkOk(e)).length;
  ok(blockedSample < 600, 'most footpath edges are walkable (' + blockedSample + ' of 4000 blocked)');
  const inside = W.edges.filter(e => e.k === 'p' && e.ok !== false).slice(0, 4000).filter(e => inBuilding(e.mx, e.mz)).length;
  ok(inside === 0, 'walkable path edges do not run through buildings');
  ok(N.crowdHour('work', 7.5) > 3 * N.crowdHour('work', 11) && N.crowdHour('street', 3) < 0.1 && N.crowdHour('shop', 12) > 5 * N.crowdHour('shop', 2), 'day profiles: shift change at GAZ, empty streets at night, shops by day');
  ok(city.footfall(P.market.x, P.market.z, 12) > 3 * city.footfall(P.market.x, P.market.z, 3) && city.footfall(P.gaz_gate.x, P.gaz_gate.z, 7.5) > 1.5 * city.footfall(P.gaz_gate.x, P.gaz_gate.z, 11), 'footfall follows the hour at the market and the GAZ gate');
  const run = (place, hour, peds, secs, rain) => {
    const p0 = P[place];
    const w = new N.World(city, { seed: 7, clock: hour * 60, spawn: { x: p0.x, z: p0.z }, settings: { peds, traffic: 1 } });
    w.clockRate = 0;
    if (rain) w.setWeather('rain', 'instant', true);
    const seen = new Set(w.peds.map(p => p.id)), born = [];
    for (let i = 0; i < secs * 60; i++) {
      const pl = w.player;
      w.cam = { x: pl.x, z: pl.z, yaw: pl.yaw };
      w.step(1 / 60, {});
      w.ev.length = 0;
      for (const p of w.peds) if (!seen.has(p.id)) { seen.add(p.id); if (w.t > 1) born.push({ p, d: Math.hypot(p.x - pl.x, p.z - pl.z), vis: N.AI.visible(w, p.x, p.z), door: !!(p.ai && p.ai.mode === 'walk' && W.edges[p.ai.edge] && W.edges[p.ai.edge].k === 'd') }); }
    }
    return { w, born };
  };
  const noon = run('hotel_spawn', 13, 1, 30), night = run('hotel_spawn', 3, 1, 30), dense = run('hotel_spawn', 13, 1.5, 30), thin = run('hotel_spawn', 13, 0.2, 30);
  const live = r => r.w.passers.live;
  ok(live(noon) >= 25 && live(noon) <= N.CROWD.cap + 15, 'the street near the hotel is busy at noon (' + live(noon) + ' within ' + N.CROWD.near + ' m)');
  ok(live(dense) >= live(noon) * 1.3 && live(thin) <= live(noon) * 0.35, 'the density setting scales the crowd (' + live(thin) + ' / ' + live(noon) + ' / ' + live(dense) + ')');
  ok(live(night) <= live(noon) * 0.2, 'few people out at 3 a.m. (' + live(night) + ')');
  const rainy = run('hotel_spawn', 13, 1, 20, true);
  ok(live(rainy) < live(noon) * 0.75, 'rain thins the crowd (' + live(rainy) + ')');
  const market = run('market', 12, 1, 25), gaz = run('gaz_gate', 7.5, 1, 25), gazLate = run('gaz_gate', 11, 1, 25);
  ok(market.w.passers.target > noon.w.passers.target && gaz.w.passers.target > gazLate.w.passers.target * 1.3, 'crowds gather at the market and at the GAZ gate at shift change (' + market.w.passers.target + ', ' + gaz.w.passers.target + ' vs ' + gazLate.w.passers.target + ')');
  const all = [noon, dense, market, gaz];
  const popIn = all.flatMap(r => r.born).filter(b => b.d < N.CROWD.ringVis && b.vis && !b.door && !b.p.persistent && !b.p.fromCar);
  ok(popIn.length <= 1, 'no one pops into view near the player except from a podezd door (' + popIn.length + ')');
  ok(all.flatMap(r => r.born).every(b => b.d >= 8), 'nobody appears right next to the player');
  for (const r of all) for (const p of r.w.peds) {
    if (p.isPlayer || p.veh || p.dead || p.persistent) continue;
    ok(!inBuilding(p.x, p.z) && city.ground(p.x, p.z) !== GT.WATER, 'passer-by in the open ' + p.id);
  }
  const modes = {};
  for (const r of all) for (const p of r.w.peds) if (p.ai) modes[p.ai.mode] = (modes[p.ai.mode] || 0) + 1;
  ok(modes.walk > 40 && modes.bench > 2 && modes.chat > 2 && (modes.wait || 0) + (modes.area || 0) > 2, 'people walk, sit on benches, chat and wait (' + JSON.stringify(modes) + ')');
  const sitters = all.flatMap(r => r.w.peds.filter(p => p.ai && p.ai.mode === 'bench'));
  ok(sitters.every(p => p.bench && Math.hypot(p.x - p.bench.x, p.z - p.bench.z) < 0.05 && Math.hypot(p.bench.x - p.ai.spot.x, p.bench.z - p.ai.spot.z) < 1.2), 'bench sitters stay on their bench');
  const pairs = all.flatMap(r => r.w.peds.filter(p => p.ai && p.ai.mode === 'walk' && p.ai.lead && !p.ai.lead.removed));
  ok(pairs.length > 3 && pairs.filter(p => Math.hypot(p.x - p.ai.lead.x, p.z - p.ai.lead.z) < 3).length >= pairs.length * 0.8, 'companions walk side by side (' + pairs.length + ')');
  const chats = all.flatMap(r => r.w.peds.filter(p => p.ai && p.ai.mode === 'chat'));
  ok(chats.every(p => p.ai.g.members.length >= 2 && p.ai.g.members.length <= 3) && chats.some(p => p.anim.talk === 1), 'chat groups of two or three take turns to talk');
  const wn = market.w, sitter = wn.peds.find(p => p.ai && p.ai.mode === 'bench') || noon.w.peds.find(p => p.ai && p.ai.mode === 'bench');
  const ww = sitter && (wn.peds.includes(sitter) ? wn : noon.w);
  if (ww) {
    const talker = ww.peds.find(p => p.ai && p.ai.mode === 'chat');
    ww.alarm(sitter.x + 3, sitter.z, 40, null);
    if (talker && Math.hypot(talker.x - sitter.x, talker.z - sitter.z) < 37) ok(talker.ai.mode === 'flee', 'a gunshot breaks up the chat');
    for (let i = 0; i < 10; i++) { ww.step(1 / 60, {}); ww.ev.length = 0; }
    ok(!sitter.bench && sitter.ai.mode === 'flee', 'a gunshot gets bench sitters up and running');
  }
  const cross = sig.sort((a, b) => Math.hypot(a.mx - P.dk.x, a.mz - P.dk.z) - Math.hypot(b.mx - P.dk.x, b.mz - P.dk.z))[0];
  const cw = new N.World(city, { seed: 3, clock: 13 * 60, spawn: { x: cross.mx, z: cross.mz }, settings: { peds: 1.5 } });
  cw.clockRate = 0;
  let onRed = 0, onGreen = 0, waited = 0;
  for (let i = 0; i < 60 * 80; i++) {
    cw.step(1 / 60, {});
    cw.ev.length = 0;
    if (i % 20) continue;
    for (const p of cw.peds) {
      if (!p.ai || p.ai.mode !== 'walk') continue;
      if (p.ai.wait !== undefined) waited++;
      const e = W.edges[p.ai.edge];
      if (!e || !e.sig || p.ai.wait !== undefined || Math.hypot(p.vx, p.vz) < 0.5) continue;
      const A = W.nodes[e.a], B = W.nodes[e.b], [d2, t] = N.segDist2(p.x, p.z, A.x, A.z, B.x, B.z);
      if (d2 > 4 || t < 0.25 || t > 0.75) continue;
      if (city.lightState(city.nodes[e.sig.n], cw.t, e.sig.g) === 'r') onRed++; else onGreen++;
    }
  }
  ok(waited > 0 && onRed > 0 && onGreen === 0, 'pedestrians wait at the kerb and cross only while the cars have red (' + waited + ' waits, ' + onRed + '/' + onGreen + ')');
  const tw = noon.w, old = tw.peds.filter(p => !p.isPlayer && !p.persistent).map(p => p.id);
  const far = P.market;
  tw.player.x = far.x; tw.player.z = far.z; tw.player.y = city.groundY(far.x, far.z);
  for (let i = 0; i < 30; i++) { tw.cam = { x: tw.player.x, z: tw.player.z, yaw: tw.player.yaw + Math.PI }; tw.step(1 / 60, {}); tw.ev.length = 0; }
  ok(tw.passers.live >= tw.passers.target * 0.8 && tw.peds.filter(p => old.includes(p.id)).length < old.length * 0.2, 'after a teleport the old crowd goes and the new street fills at once (' + tw.passers.live + '/' + tw.passers.target + ')');
  const yw = new N.World(city, { seed: 7, clock: 17 * 60, spawn: { x: -1180, z: -730 } });
  yw.clockRate = 0;
  const home = new Set(), out = new Set();
  for (let i = 0; i < 60 * 60; i++) {
    yw.cam = { x: yw.player.x, z: yw.player.z, yaw: yw.player.yaw };
    yw.step(1 / 60, {});
    yw.ev.length = 0;
    if (i % 30) continue;
    for (const p of yw.peds) {
      if (p.ai && p.ai.home) home.add(p.id);
      const e = p.ai && p.ai.mode === 'walk' && W.edges[p.ai.edge];
      if (e && e.k === 'd' && !p.ai.home) out.add(p.id);
    }
  }
  ok(home.size > 0 && out.size > 0, 'in the yards people come out of podezds and go home into them (' + out.size + ' out, ' + home.size + ' in)');
});

section('combat and wanted', () => {
  const w = new N.World(city, { seed: 9, settings: { ambient: false } });
  const pl = w.player;
  w.giveWeapon(pl, 'pm', 40);
  pl.weapon = 'pm';
  const cop = w.spawnPed('militia', pl.x + 6, pl.z, 0);
  const vic = w.spawnPed('worker', pl.x, pl.z - 5, 0);
  pl.yaw = 0;
  w.buildGrid();
  w.handleWeapon(pl, 1 / 60, { fire: true, firePressed: true, aimO: [pl.x, pl.y + 1.4, pl.z], aimD: [0, 0, -1] }, false);
  ok(vic.hp < vic.maxHp, 'the pistol hits');
  ok(w.wanted.level >= 1, 'gunfire next to a cop gives a wanted level');
  w.damagePed(cop, 999, pl, 'bullet');
  ok(w.wanted.level >= 2, 'killing a cop raises the level');
  w.addPickup('bribe', pl.x, pl.z);
  const lvl = w.wanted.level;
  w.stepPickups(1 / 60);
  ok(w.wanted.level === lvl - 1, 'a bribe removes one beacon');
  const v = w.spawnVehicle('volga3110', pl.x + 3, pl.z, 0);
  w.explode(v.x, v.y + 0.5, v.z, 7, 240, pl, 'grenade');
  for (let i = 0; i < 120; i++) { w.step(1 / 60, {}); w.ev.length = 0; }
  ok(v.dead, 'a grenade blows up a car');
  w.setWanted(3);
  for (let i = 0; i < 60 * 60; i++) { w.step(1 / 60, {}); w.ev.length = 0; if (w.wanted.level === 0) break; }
  ok(w.wanted.level < 3, 'the wanted level fades out of sight');
  const k = w.spawnPed('gopnik', pl.x + 1, pl.z, 0);
  pl.weapon = 'fists';
  pl.yaw = N.yawOf(1, 0);
  w.buildGrid();
  for (let i = 0; i < 6; i++) { pl.fireT = 0; w.melee(pl, N.WEAPONS.fists); }
  ok(k.hp < k.maxHp, 'fists hurt');
});

function makeBot(g) {
  const w = g.world, pl = w.player;
  const frames = (n, inp) => { for (let i = 0; i < n; i++) { w.cam = { x: pl.x, z: pl.z, yaw: pl.yaw }; g.step(1 / 60, inp || {}); w.ev.length = 0; } };
  const putAt = (x, z, veh) => {
    if (veh) {
      if (pl.veh !== veh) { if (pl.veh) w.exitVehicle(pl); if (veh.driver && veh.driver !== pl) { const d = veh.driver; w.unseat(d); d.x = veh.x + 3; d.z = veh.z; } w.seat(pl, veh, true); veh.ai = null; }
      veh.x = x; veh.z = z; veh.y = city.groundY(x, z); veh.vx = veh.vz = veh.wz = 0; veh.air = false;
      pl.x = x; pl.z = z;
    } else {
      if (pl.veh) w.exitVehicle(pl);
      pl.x = x; pl.z = z; pl.y = city.groundY(x, z); pl.vx = pl.vz = 0; pl.deck = null;
    }
  };
  const solve = run => {
    const s = run.cur;
    if (!s) return;
    if (g.cut) { g.endCut(); return; }
    if (s.type === 'goto') {
      const tg = run.targetOf(s);
      let veh = null;
      if (s.veh && s.veh !== 'none' && s.veh !== 'any') veh = run.ents[s.veh];
      if (s.veh === 'any') veh = pl.veh || w.spawnVehicle('vaz2106', pl.x + 3, pl.z, 0);
      if (s.with) { const q = run.ents[s.with]; if (veh && q && q.veh !== veh) { if (q.veh) w.unseat(q); w.seat(q, veh, false); } }
      putAt(tg.x, tg.z, veh);
      if (s.y !== undefined) pl.y = s.y;
    } else if (s.type === 'enter') { const v = run.ents[s.tag]; putAt(v.x, v.z, v); }
    else if (s.type === 'kill') { const tags = typeof s.tags === 'function' ? s.tags(run) : s.tags; for (const t of tags) { const e = run.ents[t]; if (e && !e.dead) w.damagePed(e, 9999, pl, 'bullet'); } }
    else if (s.type === 'destroy') { for (const t of s.tags) { const e = run.ents[t]; if (e && !e.dead) w.damageVehicle(e, 99999, pl, true); } }
    else if (s.type === 'collect') { const k = run.ents[s.tag]; if (k) putAt(k.x, k.z, null); }
    else if (s.type === 'lose') w.setWanted(0);
    else if ((s.type === 'fn' || s.type === 'tail') && s.bot) s.bot(run);
    else if (s.type === 'tail') { const v = run.ents[s.tag]; if (v && v.ai && v.ai.path) { const e = v.ai.path[v.ai.path.length - 1]; v.x = e.x; v.z = e.z; v.ai.arrived = true; } }
    else if (s.type === 'choice') { const o = s.options[run.botChoice || 0]; const p = city.places[o.at]; putAt(p.x, p.z, null); }
  };
  const until = pred => {
    let guard = 0, lastI = -1, stuck = 0;
    while (g.mission && guard++ < 6000) {
      const run = g.mission;
      if (pred(run)) return run;
      if (run.i !== lastI) { lastI = run.i; stuck = 0; } else stuck++;
      if (stuck % 30 === 0) solve(run);
      frames(10);
    }
    return null;
  };
  const play = (id, choice) => {
    if (!g.mission) g.startMission(id);
    const run = g.mission;
    if (!run || run.def.id !== id) return null;
    run.botChoice = choice || 0;
    let guard = 0, lastI = -1, stuck = 0;
    while (g.mission === run && guard++ < 6000) {
      if (run.i !== lastI) { lastI = run.i; stuck = 0; } else stuck++;
      if (stuck % 30 === 0) solve(run);
      frames(10);
    }
    return run;
  };
  return { frames, putAt, play, until };
}

section('dispatch', () => {
  ok(N.DISPATCH.slice(1).every(D => D.max > 0 && D.units.length && D.units.every(u => u.w > 0 && u.n >= 1 && N.VEHICLES[u.model] && N.VEHICLES[u.model].liveries && N.VEHICLES[u.model].liveries[u.livery] && N.PED_KINDS[u.crew] && N.PED_KINDS[u.crew].cop)), 'every wanted level calls known cop units');
  const share = (lvl, f) => { const D = N.DISPATCH[lvl], t = D.units.reduce((a, u) => a + u.w, 0); return D.units.filter(f).reduce((a, u) => a + u.w, 0) / t; };
  ok(share(1, u => u.livery === 'old') > 0.1 && share(1, u => u.livery === 'old') < 0.2 && share(1, u => u.livery === 'dps') === 0 && share(2, u => u.livery === 'dps') > 0.25, '1★ patrol cars with a few old yellow ones, 2★ adds the traffic police');
  ok(share(4, u => u.crew === 'omon') > 0.55 && share(5, u => u.crew === 'omon') >= 0.35 && share(5, u => u.crew === 'fsb') >= 0.35 && share(6, u => u.crew === 'militia') === 0, 'OMON from 4★ and still at 5★, no patrol cars at 6★');
  ok(!N.DISPATCH[2].heli && N.DISPATCH[3].heli && N.DISPATCH[3].roadblock === 'militia' && N.DISPATCH[4].roadblock === 'omon', 'the helicopter and the roadblocks join at 3★, OMON posts at 4★');
  const dw = new N.World(city, { seed: 5, settings: { ambient: false } });
  dw.setWanted(4);
  const seen = {};
  let total = 0;
  for (let i = 0; i < 600; i++) {
    N.AI.dispatch(dw);
    for (const v of dw.vehs) if (v.copUnit && !v.counted) { v.counted = true; seen[v.livery] = (seen[v.livery] || 0) + 1; total++; v.ai = null; }
  }
  ok(total >= 20 && seen.omon / total > 0.25 && seen.omon / total < 0.7, '4★ dispatch sends OMON about half the time (' + (seen.omon || 0) + ' of ' + total + ')');
  let cnt = 0;
  for (const v of dw.vehs) if (v.copUnit && v.livery === 'omon') cnt = Math.max(cnt, (v.pass.length + (v.driver ? 1 : 0)));
  ok(cnt >= 6, 'an OMON bus carries a squad');
  const uw = new N.World(city, { seed: 7, settings: { ambient: false } });
  const up = uw.player, fx = Math.sin(straight.yaw), fz = -Math.cos(straight.yaw);
  Object.assign(up, { x: straight.x + fx * 60, z: straight.z + fz * 60, y: city.groundY(straight.x + fx * 60, straight.z + fz * 60) });
  uw.setWanted(4);
  const az = uw.spawnVehicle('avtozak', straight.x + fx * 15, straight.z + fz * 15, straight.yaw, { livery: 'omon' });
  az.copUnit = true; az.copCar = true; az.siren = true;
  for (let i = 0; i < 8; i++) uw.seat(uw.spawnPed('omon', az.x, az.z, az.yaw), az, i === 0);
  az.ai = { mode: 'pursue', target: up, aggressive: true };
  let stopD = -1, opened = 0;
  for (let i = 0; i < 60 * 14; i++) {
    uw.step(1 / 60, {});
    if (az.ai && az.ai.mode === 'unload' && stopD < 0) stopD = Math.hypot(az.x - up.x, az.z - up.z);
    opened = Math.max(opened, az.rearDoor || 0);
    uw.ev.length = 0;
  }
  const squad = uw.peds.filter(p => p.type === 'omon' && !p.veh && !p.dead);
  ok(stopD > 14 && stopD < 34, 'the prisoner van stops ' + stopD.toFixed(1) + ' m short of the player');
  ok(opened > 0.9 && squad.length >= 6 && az.driver && az.driver.type === 'omon', 'the rear door opens and the squad gets out, the driver stays (' + squad.length + ' on foot)');
  const spread = Math.max(...squad.map(p => Math.hypot(p.x - squad[0].x, p.z - squad[0].z)));
  ok(spread > 4 && squad.every(p => p.ai && p.ai.mode === 'cop' && p.ai.post), 'the squad spreads out to positions');
  const rw = new N.World(city, { seed: 11, settings: { ambient: false } });
  const rp = rw.player, rcar = rw.spawnVehicle('vaz2109', straight.x, straight.z, straight.yaw);
  rw.seat(rp, rcar, true);
  rcar.vx = Math.sin(straight.yaw) * 20; rcar.vz = -Math.cos(straight.yaw) * 20; rcar.spd = 20;
  rw.setWanted(4);
  rw.cam = { x: rp.x, z: rp.z, yaw: straight.yaw + Math.PI };
  for (let k = 0; k < 20 && !rw.roadblocks.length; k++) N.AI.roadblock(rw, 'omon');
  const rb = rw.roadblocks[0];
  ok(rb && rb.peds.length === 4 && rb.peds.every(p => p.type === 'omon') && rb.vehs.some(v => v.model === 'avtozak' || v.model === 'paz'), 'from 4★ OMON hold the roadblocks with a prisoner van or a bus');
  const grid = m => { let n = 0; for (let i = 0; i < m.mb.nv; i++) if (m.mb.u8[i * 32 + 24] === 196 && m.mb.u8[i * 32 + 29] === N.KIND.TRIM) n++; return n; };
  ok(grid(N.Models.car('paz', 'omon', 0)) - grid(N.Models.car('paz', null, 0)) >= 200, 'the OMON bus has grilles over the windows');
  const hw = new N.World(city, { seed: 13, settings: { ambient: false } });
  const hp = hw.player;
  Object.assign(hp, { x: straight.x, z: straight.z, y: city.groundY(straight.x, straight.z) });
  hw.setWanted(3);
  for (let i = 0; i < 12; i++) N.AI.dispatch(hw);
  const hpHp = hp.hp;
  for (let i = 0; i < 60 * 8; i++) { hw.step(1 / 60, {}); hw.ev.length = 0; }
  ok(hw.heli && hw.heli.type === 'mi2' && hp.hp === hpHp, 'a militia Mi-2 watches from 3★ without shooting');
  hw.setWanted(4);
  for (let i = 0; i < 40 && !hw.drop; i++) N.AI.dispatch(hw);
  ok(hw.drop && hw.drop.type === 'mi8' && Math.hypot(hw.drop.tx - hp.x, hw.drop.tz - hp.z) < 34, 'at 4★ a Mi-8 flies in to drop OMON near the player');
  let roped = 0, maxRope = 0;
  for (let i = 0; i < 60 * 40 && hw.drop; i++) {
    hw.step(1 / 60, {});
    hw.ev.length = 0;
    maxRope = Math.max(maxRope, hw.peds.filter(p => p.rope).length);
    roped = Math.max(roped, hw.peds.filter(p => p.type === 'omon' && !p.rope && p.ai && p.ai.post).length);
    if (hp.hp < 50) hp.hp = 100;
  }
  ok(N.Cars.heli('mi8').door.every((v, i) => Math.abs(v - N.AI.MI8_DOOR[i]) < 1e-6) && maxRope >= 1 && roped >= 4 && !hw.drop, 'four OMON slide down the rope, take positions, the helicopter leaves');
});

section('army vehicles', () => {
  const bad = mb => { for (let i = 0; i < mb.nv; i++) for (const k of [0, 1, 2, 4, 5]) if (!isFinite(mb.f[i * 8 + k])) return true; for (let i = 0; i < mb.ni; i++) if (mb.idx[i] >= mb.nv) return true; return false; };
  const total = m => m.mb.nv + (m.turret ? m.turret.mb.nv + m.gun.mb.nv : 0);
  for (const id of ['btr80', 't72']) {
    const ms = [0, 1, 2].map(l => N.Models.car(id, 'army', l));
    ok(ms.every(m => m.armor && !m.doors && !bad(m.mb) && !bad(m.turret.mb) && !bad(m.gun.mb) && m.gun.len > 2), id + ': hull, turret and gun meshes');
    ok(ms.every((m, l) => total(m) <= [4500, 2200, 1100][l]) && total(ms[0]) > total(ms[1]) && total(ms[1]) > total(ms[2]), id + ' detail levels ' + ms.map(total).join('/'));
    ok(ms[0].lamps.some(a => a.k === 'head' && a.n[2] < 0) && ms[0].lamps.some(a => a.k === 'tail' && a.n[2] > 0), id + ': head and tail lamps');
  }
  const t = N.Models.car('t72', 'army', 0), b = N.Models.car('btr80', 'army', 0), u = N.Models.car('ural4320', 'army', 0);
  ok(t.wheels.filter(w => !w.kind).length === 12 && t.wheels.every(w => !w.kind || t.wheelKinds[w.kind]) && t.wheels.filter(w => w.kind === 'sprocket').every(w => w.z > 2), 'T-72B: six road wheels a side, the drive sprocket at the rear');
  ok(b.wheels.length === 8 && b.wheels.filter(w => w.front).length === 4 && new Set(b.wheels.map(w => w.z.toFixed(2))).size === 4, 'BTR-80: eight wheels on four axles, the front two steer');
  const uz = [...new Set(u.wheels.map(w => +w.z.toFixed(3)))].sort((x, y) => x - y);
  ok(u.wheels.length === 6 && uz.length === 3 && Math.abs(uz[2] - uz[1] - 1.4) < 1e-6 && Math.abs((uz[1] + uz[2]) / 2 - uz[0] - 4.225) < 1e-6, 'Ural-4320: a 6x6 with the rear bogie 1.4 m apart');
  ok(N.cabin(N.VEHICLES.t72).armor && N.cabin(N.VEHICLES.btr80).hatch && !N.Cars.inside('t72', 'army', 0), 'armour has a hatch, no cabin interior');

  const yawOff = d => Math.abs(N.wrap(d.v.yaw - straight.yaw));
  const spin = drive('t72', { thr: 0, steer: 1 }, 3);
  ok(yawOff(spin) > 1 && Math.hypot(spin.v.x - straight.x, spin.v.z - straight.z) < 0.6, 'the tank turns on the spot');
  const run = drive('t72', { thr: 1, steer: 0 }, 25);
  const top = Math.max(...run.out) * 3.6;
  ok(top > 50 && top < 66, 'T-72B top speed ' + top.toFixed(0) + ' km/h');
  let side = 0, bumped = false;
  const turn = drive('t72', (tt, v) => { bumped = bumped || v.hitDv > 2; if (tt > 8.6 && !bumped) side = Math.max(side, Math.abs(v.vx * Math.cos(v.yaw) + v.vz * Math.sin(v.yaw))); return { thr: 1, steer: tt > 8 ? 1 : 0 }; }, 9.4);
  ok(side > 0 && side < 0.4 && yawOff(turn) > 0.45, 'tracks do not slide sideways in a turn (' + side.toFixed(2) + ' m/s before any contact)');

  const w = new N.World(city, { seed: 17, settings: { ambient: false } }), pl = w.player;
  const s = straight, at = (d, l) => [s.x + Math.sin(s.yaw) * d + Math.cos(s.yaw) * (l || 0), s.z - Math.cos(s.yaw) * d + Math.sin(s.yaw) * (l || 0)];
  const steps = (n, inp) => { for (let i = 0; i < n; i++) { w.step(1 / 60, inp || {}); w.ev.length = 0; } };
  const tank = w.spawnVehicle('t72', s.x, s.z, s.yaw, { livery: 'army' });
  w.damageVehicle(tank, 500, pl);
  ok(tank.hp === tank.maxHp, 'bullets do not hurt the tank');
  w.damageVehicle(tank, 1000, pl, true);
  ok(tank.hp === tank.maxHp - 600 && !tank.burning, 'explosions do, through the armour');
  tank.hp = tank.maxHp;
  const p0 = at(-9);
  pl.x = p0[0]; pl.z = p0[1]; pl.y = city.groundY(pl.x, pl.z); pl.yaw = s.yaw;
  w.giveWeapon(pl, 'ak', 90);
  pl.weapon = 'ak';
  w.buildGrid();
  for (let i = 0; i < 20; i++) { pl.fireT = 0; w.handleWeapon(pl, 1 / 60, { fire: true, firePressed: true, aimO: [pl.x, pl.y + 1.4, pl.z], aimD: [Math.sin(s.yaw), -0.05, -Math.cos(s.yaw)] }, false); }
  ok(tank.hp === tank.maxHp && w.stats.shots >= 15, 'a full burst of the AK leaves the tank untouched');
  const btr = w.spawnVehicle('btr80', ...at(0, 12), s.yaw, { livery: 'army' });
  w.damageVehicle(btr, 100, pl);
  ok(btr.hp > btr.maxHp - 20 && btr.hp < btr.maxHp, 'the BTR shrugs off rifle bullets');
  w.removeVehicle(btr);
  w.setWanted(0);

  const crew = w.spawnPed('soldier', tank.x + 3, tank.z, 0);
  w.seat(crew, tank, true);
  const p1 = at(0, 3.2);
  pl.x = p1[0]; pl.z = p1[1]; pl.y = city.groundY(pl.x, pl.z);
  ok(w.tryEnter(pl) && pl.enter.v === tank, 'the player goes for the tank');
  let tIn = 0;
  for (; tIn < 300 && pl.veh !== tank; tIn++) steps(1);
  ok(pl.veh === tank && tank.driver === pl && crew.veh !== tank && tIn < 240, 'climbs up and drops through the hatch, the crew is thrown out (' + (tIn / 60).toFixed(1) + ' s)');
  ok(!w.ev.some(e => e.t === 'door'), 'no car doors on a tank');
  const target = at(45, 1.5);
  const car = w.spawnVehicle('volga3110', target[0], target[1], s.yaw + 1.2);
  const eye = [tank.x, tank.y + 4, tank.z], dir = [car.x - eye[0], car.y + 0.8 - eye[1], car.z - eye[2]], dl = Math.hypot(...dir);
  const aimInp = { aimO: eye, aimD: dir.map(q => q / dl) };
  const hull0 = tank.yaw;
  steps(150, aimInp);
  const want = N.wrap(N.yawOf(car.x - tank.x, car.z - tank.z) - tank.yaw);
  ok(Math.abs(N.wrap(tank.turretYaw - want)) < 0.05 && Math.abs(N.wrap(tank.yaw - hull0)) < 0.01, 'the turret follows the mouse, the hull stays');
  ok(w.fireTurret(pl, tank, false) && w.projs.some(q => q.type === 'shell') && tank.reloadT > 5.9 && !w.fireTurret(pl, tank, false), 'the cannon fires one shell, then reloads for six seconds');
  let boom = null;
  for (let i = 0; i < 120 && !boom; i++) { w.step(1 / 60, aimInp); boom = w.ev.find(e => e.t === 'explosion' && e.kind === 'shell'); w.ev.length = 0; }
  ok(boom && Math.hypot(boom.x - car.x, boom.z - car.z) < 4 && (car.burning || car.dead || car.hp < car.maxHp * 0.3), 'the shell flies to the target and wrecks the car');
  ok(w.fireTurret(pl, tank, true) && w.ev.some(e => e.t === 'shot' && e.w === 'pkt'), 'the coaxial machine gun fires while the cannon reloads');
  w.ev.length = 0;
  steps(6 * 60, aimInp);
  ok(tank.reloadT === 0 && w.fireTurret(pl, tank, false), 'loaded again after six seconds');
  w.projs.length = 0;
  w.removeVehicle(car);

  tank.yaw = s.yaw; tank.turretYaw = 0;
  const pos = at(0);
  Object.assign(tank, { x: pos[0], z: pos[1], vx: 0, vz: 0, wz: 0 });
  const ahead = at(40);
  const lada = w.spawnVehicle('vaz2107', ahead[0], ahead[1], s.yaw + Math.PI / 2);
  let hit = false;
  for (let i = 0; i < 12 * 60 && !hit; i++) { w.step(1 / 60, { fwd: 1 }); w.ev.length = 0; hit = lada.burning || lada.dead; }
  ok(hit && tank.hp === tank.maxHp, 'the tank runs a car over at speed and it blows up');
  w.setWanted(0);
  for (let i = 0; i < 60; i++) { w.step(1 / 60, { fwd: -1 }); w.ev.length = 0; }
  for (let i = 0; i < 4 * 60 && Math.abs(tank.spd) > 0.5; i++) { w.step(1 / 60, {}); w.ev.length = 0; }
  w.setWanted(1);
  const dp = w.doorPos(tank, -1), cop = w.spawnPed('militia', dp.x, dp.z, 0);
  cop.ai = { mode: 'cop' };
  let busted = false;
  for (let i = 0; i < 180 && !busted; i++) { w.step(1 / 60, {}); busted = w.busted || w.ev.some(e => e.t === 'busted'); w.ev.length = 0; }
  ok(!busted && pl.veh === tank && Math.hypot(cop.x - tank.x, cop.z - tank.z) > 4, 'a patrolman cannot pull the player out of a tank and backs off');
  w.removePed(cop);
  w.setWanted(0);
  w.step(1 / 60, { enter: true });
  w.ev.length = 0;
  ok(pl.exit && pl.exit.ph === 'hatch' && !pl.veh, 'leaving through the hatch');
  steps(90);
  ok(!pl.exit && !pl.veh && Math.abs(pl.y - city.groundY(pl.x, pl.z)) < 0.3 && Math.hypot(pl.x - tank.x, pl.z - tank.z) > N.VEHICLES.t72.hw, 'climbs down beside the hull');
});

section('six stars', () => {
  const D6 = N.DISPATCH[6];
  ok(D6.heli === 'mi24' && N.DISPATCH[3].heli === 'mi2' && D6.units.some(u => u.model === 't72' && u.cap === 1) && D6.units.some(u => u.model === 'btr80' && u.cap === 2) && D6.units.some(u => u.model === 'ural4320' && u.crew === 'soldier' && u.n === 8), '6★: Ural trucks full of soldiers, up to two BTRs, one tank, the Mi-24');
  const src = fs.readFileSync(path.join(DIR, 'nn-audio.js'), 'utf8');
  ok(Object.values(N.VEH_GUNS).every(G => src.includes("case '" + G.sound + "'")) && src.includes('updateMachines'), 'vehicle guns have their own sounds, armour and helicopters their engine loops');
  const s = straight, at = (d, l) => [s.x + Math.sin(s.yaw) * d + Math.cos(s.yaw) * (l || 0), s.z - Math.cos(s.yaw) * d + Math.sin(s.yaw) * (l || 0)];
  const world = seed => { const w = new N.World(city, { seed, settings: { ambient: false } }), pl = w.player, q = at(0); Object.assign(pl, { x: q[0], z: q[1], y: city.groundY(q[0], q[1]) }); w.god = true; w.setWanted(6); return w; };
  const run = (w, secs, fn) => { for (let i = 0; i < secs * 60; i++) { w.step(1 / 60, {}); for (const e of w.ev) fn(e); w.ev.length = 0; } };
  const crewed = (w, model, d, n) => { const q = at(d); const v = w.spawnVehicle(model, q[0], q[1], s.yaw + Math.PI, { livery: 'army' }); for (let i = 0; i < n; i++) w.seat(w.spawnPed('soldier', v.x, v.z, 0), v, i === 0); v.copUnit = true; v.copCar = true; return v; };

  const dw = world(23);
  const seen = {};
  let tanks = 0, btrs = 0;
  for (let i = 0; i < 600; i++) {
    N.AI.dispatch(dw);
    for (const v of dw.vehs) if (v.copUnit && !v.counted) { v.counted = true; seen[v.model] = (seen[v.model] || 0) + 1; if (!v.spec.turret) v.ai = null; }
    tanks = Math.max(tanks, dw.vehs.filter(v => v.model === 't72').length);
    btrs = Math.max(btrs, dw.vehs.filter(v => v.model === 'btr80').length);
  }
  ok(seen.t72 === 1 && seen.btr80 >= 1 && tanks === 1 && btrs <= 2 && seen.ural4320 >= 1 && dw.vehs.filter(v => v.spec.turret).every(v => v.ai && v.ai.mode === 'armor' && !v.driver.isPlayer), '6★ dispatch: never more than one tank and two BTRs, both under the armour AI (' + JSON.stringify(seen) + ')');

  const bw = world(29), btr = crewed(bw, 'btr80', 140, 3);
  btr.ai = { mode: 'armor', target: bw.player };
  let kpvt = 0;
  run(bw, 22, e => { if (e.t === 'shot' && e.w === 'kpvt') kpvt++; });
  const bd = Math.hypot(btr.x - bw.player.x, btr.z - bw.player.z);
  ok(bd > 38 && bd < 85 && Math.abs(btr.spd) < 1 && kpvt > 10, 'the BTR closes in, keeps 40–80 m (' + bd.toFixed(0) + ' m) and fires the КПВТ in bursts (' + kpvt + ' rounds)');

  const tw = world(31), tank = crewed(tw, 't72', 70, 3), q = at(35);
  tank.ai = { mode: 'armor', target: tw.player };
  const bus = tw.spawnVehicle('paz', q[0], q[1], s.yaw + Math.PI / 2);
  let shells = 0;
  run(tw, 5, e => { if (e.t === 'shot' && e.w === 'cannon125') shells++; });
  ok(shells === 0 && tank.ai.seeT === 0, 'no line of sight past the bus, the tank holds its fire');
  tw.removeVehicle(bus);
  let boom = null;
  run(tw, 6, e => { if (e.t === 'shot' && e.w === 'cannon125') shells++; if (e.t === 'explosion' && e.kind === 'shell' && !boom) boom = e; });
  ok(shells >= 1 && boom && Math.hypot(boom.x - tw.player.x, boom.z - tw.player.z) < 12, 'with the bus gone it lays the gun and fires at the player');

  const uw = world(37), ural = crewed(uw, 'ural4320', 40, 8);
  ural.ai = { mode: 'pursue', target: uw.player, aggressive: true };
  run(uw, 14, () => {});
  const troops = uw.peds.filter(p => p.type === 'soldier' && !p.veh && !p.dead);
  ok(troops.length >= 6 && troops.every(p => p.ai && p.ai.mode === 'cop') && ural.driver && ural.driver.type === 'soldier', 'the Ural stops and its soldiers jump off the back (' + troops.length + ')');

  const hw = world(41);
  hw.setWanted(3);
  for (let i = 0; i < 12 && !hw.heli; i++) N.AI.dispatch(hw);
  ok(hw.heli && hw.heli.type === 'mi2', '3★: the militia Mi-2');
  hw.setWanted(6);
  hw.dropCool = 1e9;
  for (let i = 0; i < 40 * 60 && !(hw.heli && hw.heli.type === 'mi24'); i++) { if (i % 15 === 0) N.AI.dispatch(hw); hw.step(1 / 60, {}); hw.ev.length = 0; for (const v of hw.vehs.slice()) hw.removeVehicle(v); }
  ok(hw.heli && hw.heli.type === 'mi24' && hw.heli.hp === N.HELIS.mi24.hp, 'at 6★ the Mi-2 flies off and a Mi-24 takes over');
  let gun = 0, rockets = 0;
  run(hw, 45, e => { if (e.t === 'shot' && e.p && e.p.heli) { if (e.w === 'yakb') gun++; if (e.w === 'rpg7') rockets++; } });
  ok(gun > 10 && rockets >= 4, 'the Mi-24 makes gun runs with the ЯкБ and rocket salvoes (' + gun + ' rounds, ' + rockets + ' rockets)');
  const h = hw.heli, hp = hw.player, o = [h.x + 12, h.y - 6, h.z + 5];
  const hdx = h.x - o[0], hdy = h.y - o[1], hdz = h.z - o[2], hl = Math.hypot(hdx, hdy, hdz);
  const ray = hw.raycast(o[0], o[1], o[2], hdx / hl, hdy / hl, hdz / hl, 400, hp);
  ok(ray && ray.kind === 'heli' && ray.heli === h, 'shots can hit the helicopter');
  hw.fire(hp, 'ak', o[0], o[1], o[2], hdx / hl, hdy / hl, hdz / hl, 0);
  ok(h.hp < h.maxHp && h.hp > h.maxHp - 20, 'rifle bullets barely scratch the armoured Mi-24');
  hw.ev.length = 0;
  for (let k = 0; k < 4 && !h.down; k++) hw.explode(h.x, h.y - 1, h.z, 8.5, 320, hp, 'rocket');
  ok(h.down && hw.wanted.level === 6, 'rockets bring it down');
  let crash = null;
  run(hw, 15, e => { if (e.t === 'helicrash') crash = e; });
  ok(crash && crash.type === 'mi24' && !hw.heli && hw.stats.carsDestroyed >= 1, 'it falls, spins and blows up on the ground');
});

section('missions', () => {
  ok(N.MISSIONS.length === 10, 'ten story missions');
  const ids = new Set(N.MISSIONS.map(m => m.id));
  const speakers = new Set();
  for (const m of N.MISSIONS) {
    for (const r of m.requires) ok(ids.has(r), 'requires ' + m.id + ' -> ' + r);
    ok(!m.marker || city.places[m.marker], 'marker ' + m.id);
    ok(m.reward > 0 && m.title.length > 3 && m.steps.length >= 3, 'mission data ' + m.id);
    ok(!m.giver || N.GIVER[m.giver], 'giver ' + m.id);
    const cps = m.steps.filter(s => s.type === 'cp');
    ok(cps.length >= 1 && cps.every(s => typeof s.place === 'function' && s.id && s.name), 'checkpoints with a restore function and a name in ' + m.id);
    ok(new Set(m.steps.filter(s => s.id).map(s => s.id)).size === m.steps.filter(s => s.id).length, 'unique step ids in ' + m.id);
    ok(m.steps.some(s => s.type === 'cut'), 'cutscenes in ' + m.id);
    for (const s of m.steps) {
      const lists = [];
      if (s.type === 'talk' || s.type === 'say') lists.push(typeof s.lines === 'function' ? [] : s.lines);
      if (s.type === 'cut' && Array.isArray(s.shots)) for (const sh of s.shots) { ok(sh.cam, 'every shot has a camera in ' + m.id); if (Array.isArray(sh.lines)) lists.push(sh.lines); }
      for (const ls of lists) for (const l of ls) {
        speakers.add(l[0]);
        ok(typeof l[1] === 'string' && l[1].length > 1 && !/["']/.test(l[1]) && !/\s$/.test(l[1]), 'clean line text in ' + m.id + ': ' + l[1]);
        ok(N.CHARS[l[0]] || N.VOICES[l[0]], 'known speaker with a voice in ' + m.id + ': ' + l[0]);
      }
    }
  }
  ok(N.MISSIONS.filter(m => m.finale).length === 1, 'one finale');
  ok(['tyoma', 'kesha', 'colonel', 'lyova', 'larisa', 'hromoy', 'borzyh', 'sonny', 'gena', 'vadik'].every(k => speakers.has(k) && N.CHARS[k].voice && N.CHARS[k].col), 'every main character speaks, has a voice profile and a subtitle colour');
  for (const choice of [0, 1]) {
    store.clear();
    const g = new N.Game(city, { seed: 11 + choice, headless: true });
    const bot = makeBot(g);
    bot.frames(20);
    ok(g.mission && g.mission.def.id === 'm1', 'a new game starts the first mission');
    for (const m of N.MISSIONS) {
      if (m.id !== 'm1') ok(g.available().some(a => a.id === m.id), 'mission available ' + m.id);
      const run = bot.play(m.id, choice);
      ok(run && run.done, 'bot completes ' + m.id + (run && run.failed ? ' (' + run.failed + ')' : ''));
      ok(!g.failInfo && !g.cut && !g.world.truce && !g.world.player.puppet, 'nothing left over after ' + m.id);
      log(choice, m.id, g.state.money);
    }
    ok(g.flags.ledger === (choice ? 'kesha' : 'lyova'), 'the ledger choice is stored');
    ok(g.flags.chapter1 && g.state.props.club, 'the chapter ends and the club is yours');
    ok(g.state.money > 70000, 'mission rewards paid ' + g.state.money);
    ok(g.world.player.weapons.ak && g.world.player.weapons.svd && g.world.player.weapons.shotgun, 'weapons from contacts');
    ok(g.state.outfit === 'leather', 'Larisa dressed Tyoma in leather');
  }
  store.clear();
  const g = new N.Game(city, { seed: 21, headless: true });
  const bot = makeBot(g);
  bot.frames(20);
  const run = g.mission;
  g.endCut();
  bot.frames(5);
  g.world.damagePed(run.get('kesha'), 999, g.world.player, 'bullet');
  bot.frames(5);
  ok(run.failed && !g.mission && !g.state.done.m1 && g.failInfo && g.failInfo.run === run, 'killing Kesha fails the first mission');
  ok(g.available().length === 0 && !g.markers().some(m => m.type === 'mission'), 'no mission markers before the first mission is done');
});

section('mission checkpoints', () => {
  store.clear();
  const g = new N.Game(city, { seed: 31, headless: true, god: true });
  const bot = makeBot(g), w = g.world;
  bot.frames(20);
  let cpCount = 0;
  for (const m of N.MISSIONS) {
    const cps = m.steps.map((s, i) => (s.type === 'cp' ? i : -1)).filter(i => i >= 0);
    for (const ci of cps) {
      if (!g.mission) g.startMission(m.id);
      const reached = bot.until(r => r.cp && r.cp.i === ci && r.i > ci);
      ok(reached, m.id + ': the bot reaches checkpoint «' + m.steps[ci].name + '»');
      if (!reached) break;
      const snapW = JSON.stringify(reached.cp.snap.weapons), money = g.state.money;
      reached.fail('проверка');
      ok(g.failInfo && !g.mission && g.failInfo.cp === reached.cp, m.id + ': a failure keeps the checkpoint');
      bot.frames(140);
      ok(g.failReq && g.failInfo && !g.mission && g.available().length === 0, m.id + ': the failure menu is requested after the failure message, no other mission can start meanwhile');
      g.retry('cp');
      const r2 = g.mission;
      ok(r2 && r2.def === m && r2.i > ci && r2.cp && r2.cp.id === m.steps[ci].id && !r2.failed && !g.failInfo, m.id + ': retry from «' + m.steps[ci].name + '» resumes after the checkpoint');
      ok(JSON.stringify(w.player.weapons) === snapW && g.state.money === money && w.player.hp === w.player.maxHp && w.wanted.level === 0, m.id + ': retry restores weapons, money and health of the checkpoint');
      ok(!reached.ents || Object.values(reached.ents).every(e => !e.kind || e.removed), m.id + ': the failed run leaves nothing in the world');
      bot.frames(30);
      ok(g.mission === r2 && !r2.failed, m.id + ': the restored checkpoint holds');
      cpCount++;
    }
    if (g.mission) {
      g.mission.fail('рестарт');
      bot.frames(140);
      const start = g.failInfo.start;
      g.retry('start');
      ok(g.mission && g.mission.def === m && !g.mission.cp && g.mission.i <= m.steps.findIndex(s => s.type === 'cut') && JSON.stringify(w.player.weapons) === JSON.stringify(start.weapons), m.id + ': restart begins the mission again from its start with the weapons Tyoma had then');
      const r3 = bot.play(m.id, 0);
      ok(r3 && r3.done, m.id + ': the restarted mission can be finished');
    }
  }
  ok(cpCount === N.MISSIONS.reduce((n, m) => n + m.steps.filter(s => s.type === 'cp').length, 0) && cpCount >= 19, 'every checkpoint of every mission was retried (' + cpCount + ')');
});

section('mission failure menu', () => {
  store.clear();
  const st = Object.assign(N.Game.newState(), { done: { m1: true, m2: true }, money: 5000 });
  const g = new N.Game(city, { seed: 41, headless: true, state: st });
  const bot = makeBot(g), w = g.world, pl = w.player;
  const p = city.places.colonel;
  bot.putAt(p.x, p.z, null);
  g.startMission('m3');
  const run = bot.until(r => r.cp && r.cp.id === 'zarya' && r.i > r.cp.i);
  ok(run && pl.weapons.pm, 'm3 reaches the garages with a pistol');
  const money = g.state.money, ammo = pl.weapons.pm.ammo + pl.weapons.pm.clip;
  w.damagePed(pl, 999, null, 'bullet');
  bot.frames(30);
  ok(g.death && g.failInfo && g.failInfo.death === 'wasted' && !g.mission, 'death fails the mission and keeps the menu data');
  bot.frames(60 * 4);
  ok(g.failReq && g.death && g.fade && g.fade.wait, 'after «ПОТРАЧЕНО» the screen stays black for the menu, no hospital yet');
  ok(Math.hypot(pl.x - run.get('colonel').x, pl.z - run.get('colonel').z) < 400 && g.state.money === money, 'no respawn and no fee while the menu is open');
  g.retry('cp');
  ok(g.mission && !pl.dead && pl.hp === pl.maxHp && pl.weapons.pm && pl.weapons.pm.ammo + pl.weapons.pm.clip >= Math.min(ammo, 40) && g.state.money === money && !g.death, 'retry after death: alive, armed, no hospital bill');
  bot.frames(60 * 2);
  ok(!g.fade || !g.fade.wait, 'the screen fades back in');
  w.setWanted(3);
  g.mission.fail('проверка');
  bot.frames(140);
  ok(g.failReq, 'a plain failure asks after a short message');
  const hosp = N.HOSPITALS.map(id => city.places[id]);
  g.leaveFailed();
  ok(!g.mission && !g.failInfo && g.available().some(a => a.id === 'm3'), 'leaving the mission returns to free roam and the marker comes back');
  ok(!hosp.some(h => Math.hypot(pl.x - h.x, pl.z - h.z) < 3), 'leaving after a plain failure keeps Tyoma where he is');
  g.startMission('m3');
  bot.until(r => r.cp && r.cp.id === 'zarya' && r.i > r.cp.i);
  const before = g.state.money;
  w.damagePed(pl, 999, null, 'bullet');
  bot.frames(60 * 4);
  ok(g.failReq, 'second death: menu again');
  g.leaveFailed();
  bot.frames(90);
  ok(!pl.dead && hosp.some(h => Math.hypot(pl.x - h.x, pl.z - h.z) < 3) && g.state.money < before && !pl.weapons.pm, 'continue after death: hospital, bill and no weapons');
  g.startMission('m3');
  bot.until(r => r.cp && r.cp.id === 'zarya' && r.i > r.cp.i);
  w.busted = true;
  w.emit({ t: 'busted' });
  bot.frames(60 * 4);
  ok(g.failInfo && g.failInfo.death === 'busted' && g.failReq, 'an arrest during a mission opens the same menu');
  g.retry('start');
  ok(g.mission && g.mission.def.id === 'm3' && !g.mission.cp && !w.busted && !pl.anim.handsUp, 'restart after an arrest goes back to the colonel');
});

section('cutscenes and voice', () => {
  store.clear();
  const g = new N.Game(city, { seed: 51, headless: true });
  const w = g.world, pl = w.player, bot = makeBot(g);
  bot.frames(20);
  ok(g.cut && g.cut.shots.length >= 10 && w.frozen && w.truce, 'the first mission opens with a long staged cutscene');
  let shots = 0, bad = 0;
  const c = g.cut;
  for (let i = 0; i < 60 * 240 && g.cut === c; i++) {
    const cam = c.camera();
    if (cam && c.t < 0.02) { shots++; if (![...cam.from, ...cam.to].every(Number.isFinite) || Math.hypot(cam.from[0] - cam.to[0], cam.from[1] - cam.to[1], cam.from[2] - cam.to[2]) < 0.3) bad++; }
    bot.frames(1);
  }
  ok(!g.cut && shots >= 10 && bad === 0, 'every shot of the intro has a finite camera aimed away from itself (' + shots + ' shots)');
  ok(!w.frozen && !w.truce && !pl.puppet && g.mission.get('car') && g.mission.get('mask1') && !g.mission.get('mask1').hidden, 'the intro hands over to play with the gunmen visible');
  store.clear();
  const g2 = new N.Game(city, { seed: 52, headless: true });
  const b2 = makeBot(g2);
  b2.frames(20);
  g2.endCut();
  b2.frames(3);
  ok(!g2.cut && g2.mission.get('mask1') && !g2.mission.get('mask1').hidden && !g2.mission.get('van') && g2.mission.get('kesha').ai.mode === 'follow', 'skipping the intro applies all of its staging');
  store.clear();
  const st = Object.assign(N.Game.newState(), { done: { m1: true, m2: true } });
  const g3 = new N.Game(city, { seed: 53, headless: true, state: st });
  const b3 = makeBot(g3);
  const p = city.places.colonel;
  b3.putAt(p.x, p.z, null);
  g3.startMission('m3');
  b3.until(r => r.cur && r.cur.type === 'goto' && r.cur.at === 'zarya');
  b3.until(r => !!g3.cut);
  g3.endCut();
  const col = g3.mission.get('colonel');
  ok(col && !col.veh && !g3.world.player.veh, 'skipping a cutscene still gets the colonel and Tyoma out of the car');
  const voice = { said: [], h: null, speak(sub) { this.said.push(sub.who); this.h = { done: false }; return this.h; }, stop() { if (this.h) this.h.done = true; }, alive(h) { return !!h; } };
  store.clear();
  const g4 = new N.Game(city, { seed: 54, headless: true, voice });
  const s1 = g4.say('kesha', 'Тёма, главное — молчи.');
  for (let i = 0; i < 60 * 5; i++) g4.stepSubs(1 / 60);
  ok(voice.said[0] === 'kesha' && !s1.done && g4.speaking() && s1.el > N.lineDur(s1.text), 'a voiced line waits for the voice to finish');
  voice.h.done = true;
  g4.stepSubs(1 / 60);
  ok(s1.done && !g4.speaking(), 'the line ends when the voice ends');
  const s2 = g4.say('', 'Куда смотришь, баран?!', { prio: 0 });
  g4.stepSubs(1 / 60);
  const s3 = g4.say('tyoma', 'Восемь лет молчал.');
  ok(!g4.subs.includes(s2) && g4.subs[0] === s3, 'a story line pushes a street bark out');
  g4.stepSubs(1 / 60);
  ok(s3.started && s3.h, 'the story line starts speaking');
  g4.hushVoice();
  ok(!s3.started && !s3.h, 'pausing stops the voice and restarts the line later');
  const quiet = new N.Game(city, { seed: 55, headless: true });
  const s4 = quiet.say('tyoma', 'Восемь лет молчал. Потерплю.');
  for (let i = 0; i < Math.ceil(N.lineDur(s4.text) * 60) + 2; i++) quiet.stepSubs(1 / 60);
  ok(s4.done, 'without a voice the line lasts its reading time');
  ok(N.cutOpts('point>kesha ~phone').g === 'point' && N.cutOpts('point>kesha ~phone').to === 'kesha' && N.cutOpts('point>kesha ~phone').via === 'phone', 'line options parse gesture, target and channel');
  ok(N.voiceText('Держи СВД и ПМ, «эфки» — с ГАЗа.') === 'Держи эс-вэ-дэ и пэ-эм, эфки, с газа.', 'voice text spells out abbreviations and drops quotes');
  const ped = w.spawnPed('worker', pl.x + 2, pl.z, 0);
  const piv = N.Models.ped(ped.look).piv;
  let finite = true;
  for (const k of N.GESTURES) {
    for (const t of [0.05, 0.4, 2.5]) {
      ped.anim.gest = { k, t, d: 0 };
      const r = N.pedRig(ped, w.t + t, N.pedRoot(ped), piv);
      if (!r.G.every(m => m.every(Number.isFinite))) finite = false;
    }
  }
  ok(finite && N.GESTURES.length >= 20, 'every staging gesture poses the rig without NaN (' + N.GESTURES.length + ')');
  const masked = N.Models.ped(Object.assign(N.makeLook('bandit', N.rng(3)), { hat: 'mask' }));
  ok(masked.mb.nv > 0 && masked.bones.length === masked.mb.nv, 'balaclava model for the pier gunmen');
});

section('side jobs', () => {
  store.clear();
  const g = new N.Game(city, { seed: 31, headless: true, state: Object.assign(N.Game.newState(), { done: { m1: true } }) });
  const w = g.world, pl = w.player;
  const bot = makeBot(g);
  const taxi = w.spawnVehicle('volga3110', pl.x + 4, pl.z, 0, { livery: 'taxi' });
  bot.putAt(taxi.x, taxi.z, taxi);
  for (let k = 0; k < 2; k++) {
    g.msg.help = null;
    w.emit({ t: 'enter', v: taxi });
    g.step(1 / 60, {});
    ok(g.msg.help && g.msg.help.text === N.HELP.taxi && g.msg.help.t <= (k ? 5 : 8), 'the taxi job hint shows in the corner on entry ' + (k + 1));
  }
  g.step(1 / 60, { side: true });
  ok(g.side && g.side.kind === 'taxi', 'T starts the taxi job');
  g.msg.help = null;
  w.emit({ t: 'enter', v: taxi });
  g.step(1 / 60, {});
  ok(!g.msg.help, 'no job hint while the job runs');
  let fares = 0;
  for (let k = 0; k < 400 && g.state.taxi.fares < 10 && g.side; k++) {
    const job = g.side;
    if (job.state === 'find' && job.fare) { const nl = city.nearestLane(job.fare.x, job.fare.z, 60, () => true); bot.putAt(nl ? nl.x : job.fare.x + 3, nl ? nl.z : job.fare.z, taxi); }
    else if (job.state === 'drive') bot.putAt(job.dest.x, job.dest.z, taxi);
    bot.frames(30);
  }
  ok(g.state.taxi.fares >= 10, 'ten fares delivered');
  ok(g.flags.taxiBoost && g.state.money > 5000, 'taxi bonus paid');
  if (g.side) g.side.end('test');
  const cop = w.spawnVehicle('vaz2107', pl.x + 4, pl.z, 0, { livery: 'militia' });
  bot.putAt(cop.x, cop.z, cop);
  g.step(1 / 60, { side: true });
  ok(g.side && g.side.kind === 'police', 'T starts the militia job');
  for (let lvl = 0; lvl < 3 && g.side; lvl++) {
    for (const t of g.side.targets) { if (t.driver) w.damagePed(t.driver, 9999, pl, 'bullet'); for (const q of t.pass) w.damagePed(q, 9999, pl, 'bullet'); }
    bot.frames(20);
    for (const p of w.peds) if (p.fromCar !== undefined && !p.dead) w.damagePed(p, 9999, pl, 'bullet');
    bot.frames(20);
  }
  ok(g.state.police.level >= 2, 'militia levels cleared ' + g.state.police.level);
  ok(w.wanted.level === 0, 'criminals do not count as crimes');
});

section('game systems', () => {
  store.clear();
  const g = new N.Game(city, { seed: 41, headless: true, state: Object.assign(N.Game.newState(), { done: { m1: true, m2: true, m3: true }, money: 50000, unlocked: ['knuckles', 'knife', 'pm'] }) });
  const w = g.world, pl = w.player;
  const bot = makeBot(g);
  g.openShop('guns');
  const pm = g.shop.items.findIndex(i => i.id === 'pm');
  ok(pm >= 0 && g.buy(pm) && pl.weapons.pm && g.state.money === 50000 - N.WEAPONS.pm.price, 'buy a PM in «Охотник»');
  const armor = g.shop.items.findIndex(i => i.id === 'armor');
  ok(g.buy(armor) && pl.armor === 100, 'buy armour');
  g.closeShop();
  g.openShop('clothes');
  const suit = g.shop.items.findIndex(i => i.id === 'raspberry');
  w.setWanted(2);
  ok(g.buy(suit) && g.state.outfit === 'raspberry' && w.wanted.level === 0, 'new clothes clear the wanted level');
  g.closeShop();
  const car = w.spawnVehicle('vaz2106', pl.x + 3, pl.z, 0);
  bot.putAt(city.places.respray_s.x, city.places.respray_s.z, car);
  car.hp = 200;
  w.setWanted(3);
  const money = g.state.money;
  bot.frames(150);
  ok(w.wanted.level === 0 && car.hp === car.maxHp && g.state.money === money - 500, 'respray repairs the car and clears the wanted level');
  const st = city.stashes[0];
  bot.putAt(st.x, st.z, null);
  bot.frames(5);
  ok(g.state.stashes.includes(st.id), 'a stash is collected');
  g.state.stashes = city.stashes.slice(0, 4).map(s => s.id);
  const s5 = city.stashes[4];
  bot.putAt(s5.x, s5.z, null);
  bot.frames(5);
  ok(w.pickups.some(k => k.reward && k.weapon === 'pm'), 'five stashes put a pistol in the hotel');
  g.cheat('BABKI');
  ok(g.state.money > 250000, 'cheat BABKI');
  ok(g.save(2, 'save_hotel'), 'save the game');
  const loaded = N.Game.load(2);
  ok(loaded && loaded.money === g.state.money && loaded.outfit === 'raspberry' && loaded.weapons.pm && loaded.stashes.length === g.state.stashes.length, 'save round trip');
  const g2 = new N.Game(city, { seed: 3, state: loaded, headless: true });
  ok(g2.world.player.weapons.pm && g2.state.done.m3 && !g2.mission, 'loaded game has weapons and progress');
  ok(N.Game.slots().filter(s => s.s).length === 1, 'save slots');
  store.set(N.SAVE_PREFIX + 3, JSON.stringify({ v: 99 }));
  ok(N.Game.load(3) === null, 'foreign save format ignored');
  pl.hp = 1;
  pl.armor = 0;
  w.damagePed(pl, 50, null, 'bullet');
  bot.frames(4 * 60);
  const near = ids => Math.min(...ids.map(id => Math.hypot(pl.x - city.places[id].x, pl.z - city.places[id].z)));
  ok(!pl.dead && pl.hp === 100 && Object.keys(pl.weapons).length === 1, 'wasted: respawn without weapons');
  ok(near(N.HOSPITALS) < 2, 'hospital position');
  w.busted = false;
  w.emit({ t: 'busted' });
  bot.frames(4 * 60);
  ok(near(N.MILITIA) < 2, 'busted: released from an OVD');
  const tp = city.places.tower_door;
  bot.putAt(tp.x, tp.z, null);
  bot.frames(90);
  ok(pl.y > 30, 'the tower door leads to the roof');
});

section('weather', () => {
  ok(N.WEATHER_IDS.join() === 'clear,cloudy,rain,fog', 'four kinds of weather');
  for (const id of N.WEATHER_IDS) ok(N.WEATHER[id].name && N.WEATHER[id].dur[0] > 60 && N.WEATHER[id].dur[1] > N.WEATHER[id].dur[0], 'weather preset ' + id);
  const wx = new N.Weather(11, 'clear');
  ok(wx.rain === 0 && wx.wet === 0 && wx.grip === 1 && wx.sight === 1 && wx.crowd === 1, 'a clear day starts dry');
  wx.set('rain', 'fast', true);
  for (let i = 0; i < 6 * 60; i++) wx.step(1 / 60, 13, true);
  ok(wx.cloud > 0.95 && wx.rain > 0.3 && wx.wet > 0.1, 'rain arrives within seconds when forced');
  for (let i = 0; i < 60 * 60; i++) wx.step(1 / 60, 13, true);
  ok(wx.wet > 0.95 && wx.puddle > 0.5, 'a minute of rain floods the roads');
  ok(wx.grip < 0.85 && wx.sight < 0.85 && wx.crowd < 0.6, 'rain: less grip, worse sight, fewer people');
  wx.set('clear', 'fast', true);
  let bow = 0;
  for (let i = 0; i < 90 * 60; i++) { wx.step(1 / 60, 18, true); bow = Math.max(bow, wx.rainbow); }
  ok(wx.rain < 0.01 && wx.wet > 0.4 && wx.puddle > 0.4, 'the streets stay wet after the rain');
  ok(bow > 0.9, 'a rainbow after the rain');
  for (let i = 0; i < 600; i++) wx.step(1, 13, true);
  ok(wx.wet === 0 && wx.puddle < 0.1 && wx.rainbow < 0.01, 'the sun dries the streets');
  const fog = new N.Weather(12, 'fog');
  ok(fog.fog === 1 && fog.sight < 0.55 && fog.rain === 0, 'fog hides people');
  const locked = new N.Weather(14, 'clear');
  locked.set('fog', 'fast', true);
  for (let i = 0; i < 3600; i++) locked.step(1, 12, true);
  ok(locked.kind === 'fog', 'locked weather stays');
  const ev = [];
  const nat = new N.Weather(13, 'clear', e => ev.push(e));
  const seen = new Set();
  let flash = 0;
  for (let i = 0; i < 6 * 3600; i++) {
    nat.step(1, (i / 60) % 24, true);
    seen.add(nat.kind);
    flash = Math.max(flash, nat.flash);
    for (const k of ['cloud', 'dark', 'rain', 'fog', 'wet', 'puddle', 'rainbow']) if (!(nat[k] >= 0 && nat[k] <= 1)) throw new Error('weather value out of range ' + k + ' ' + nat[k]);
  }
  ok(seen.size === 4, 'the weather cycles through every kind: ' + [...seen].join(', '));
  ok(ev.some(e => e.t === 'weather' && e.natural), 'weather changes are announced for the radio');
  ok(ev.some(e => e.t === 'thunder' && e.delay > 1 && e.delay < 13), 'storms bring thunder');
  const sev = [];
  const st = new N.Weather(15, 'rain', e => sev.push(e));
  st.set('rain', 'instant', true);
  for (let i = 0; i < 120 * 60; i++) { st.step(1 / 60, 21, false); flash = Math.max(flash, st.flash); }
  ok(sev.filter(e => e.t === 'thunder').length >= 3 && flash > 0.3, 'a two-minute storm flashes ' + sev.length + ' times');
  ok(Number.isFinite(nat.windX) && Number.isFinite(nat.windZ), 'wind vector');
  const w = new N.World(city, { seed: 5, settings: { ambient: false } });
  ok(w.weather === 'clear' && w.wx.grip === 1, 'a new world starts clear');
  w.setWeather('rain', 'instant');
  ok(w.weather === 'rain' && w.wx.wet === 1 && w.wx.rain > 0.3, 'instant rain');
  const brake = kind => {
    const bw = new N.World(city, { seed: 3, settings: { ambient: false } });
    if (kind) bw.setWeather(kind, 'instant', true);
    const v = bw.spawnVehicle('vaz2107', straight.x, straight.z, straight.yaw);
    bw.seat(bw.player, v, true);
    for (let i = 0; i < 8 * 60 && v.spd < 22; i++) { bw.step(1 / 60, { fwd: 1, steer: 0 }); bw.ev.length = 0; }
    const x0 = v.x, z0 = v.z;
    for (let i = 0; i < 8 * 60 && v.spd > 0.5; i++) { bw.step(1 / 60, { fwd: -1, steer: 0 }); bw.ev.length = 0; }
    return Math.hypot(v.x - x0, v.z - z0);
  };
  const dry = brake(null), wet = brake('rain');
  ok(wet > dry * 1.1, 'a wet road lengthens the braking distance ' + dry.toFixed(1) + ' -> ' + wet.toFixed(1) + ' m');
  const sight = kind => {
    const sw = new N.World(city, { seed: 9, settings: { ambient: false } });
    if (kind) sw.setWeather(kind, 'instant', true);
    const pl = sw.player;
    const fx = Math.sin(straight.yaw), fz = -Math.cos(straight.yaw);
    pl.x = straight.x; pl.z = straight.z; pl.y = city.groundY(pl.x, pl.z);
    sw.spawnPed('militia', pl.x + fx * 40, pl.z + fz * 40, straight.yaw + Math.PI);
    sw.setWanted(1);
    for (let i = 0; i < 90; i++) { sw.step(1 / 60, {}); sw.ev.length = 0; }
    return sw.wanted.unseen;
  };
  ok(sight(null) === 0 && sight('fog') > 0, 'a militiaman 40 m away sees the player in clear weather but not in fog');
  const g = new N.Game(city, { seed: 8, headless: true, state: Object.assign(N.Game.newState(), { done: { m1: true } }) });
  g.cheat('POGODA');
  ok(g.world.weather === 'cloudy', 'cheat POGODA switches the weather');
  ok(N.FORECAST && N.WEATHER_IDS.every(id => N.FORECAST[id].length >= 2), 'radio forecasts for every weather');
});

section('debug menu', () => {
  store.clear();
  const g = new N.Game(city, { seed: 21, headless: true, state: Object.assign(N.Game.newState(), { done: { m1: true } }) });
  const w = g.world, pl = w.player;
  const ui = { game: g, city, el: { focus() {} }, audio: { on: false }, resets: 0, resetCam() { this.resets++; } };
  const dbg = new N.Debug(ui);
  const act = (a, v) => { dbg.act(a, v === undefined ? undefined : String(v)); w.ev.length = 0; };
  ok(N.Debug.GUNS.every(([id]) => N.WEAPONS[id]) && N.Debug.SPOTS.every(([id]) => city.places[id]), 'F7 lists real weapons and places');
  act('gun', 'svd');
  ok(pl.weapons.svd && pl.weapon === 'svd' && pl.weapons.svd.clip + pl.weapons.svd.ammo >= 50, 'F7: sniper rifle with ammo');
  act('guns');
  ok(['knife', 'pm', 'shotgun', 'ak', 'svd', 'grenade'].every(id => pl.weapons[id]) && pl.weapon === 'ak', 'F7: the whole arsenal');
  act('money', 100000);
  ok(g.state.money === 100000, 'F7: money');
  act('money', 0);
  ok(g.state.money === 0, 'F7: money reset');
  w.clock = 13 * 60;
  act('crowd');
  ok(w.passers && w.passers.live > 10 && w.passers.live >= w.passers.target * 0.8, 'F7 «Прохожие» fills the street at once (' + (w.passers && w.passers.live) + ')');
  act('god');
  w.damagePed(pl, 500, null, 'bullet');
  ok(w.god && !pl.dead && pl.hp === 100, 'F7: god mode ignores bullets');
  act('god');
  ok(!w.god, 'F7: god mode off');
  {
    const h = city.places.hotel_door;
    g.teleportTo(h.x, h.z);
    const run = () => {
      const x0 = pl.x, z0 = pl.z;
      for (let i = 0; i < 60; i++) { g.step(1 / 60, { fwd: 1, sprint: true, camYaw: pl.yaw }); w.ev.length = 0; }
      return Math.hypot(pl.x - x0, pl.z - z0);
    };
    for (let i = 0; i < 30; i++) { g.step(1 / 60, {}); w.ev.length = 0; }
    g.teleportTo(h.x, h.z);
    const plain = run();
    g.teleportTo(h.x, h.z);
    act('run');
    const fast = run();
    act('run');
    ok(fast > plain * 1.8 && !w.superRun, 'F7: super run covers more ground ' + plain.toFixed(1) + ' -> ' + fast.toFixed(1) + ' m');
    const jump = () => {
      g.teleportTo(h.x, h.z);
      for (let i = 0; i < 20; i++) { g.step(1 / 60, {}); w.ev.length = 0; }
      const y0 = pl.y;
      let top = y0;
      g.step(1 / 60, { jump: true }); w.ev.length = 0;
      for (let i = 0; i < 300 && !pl.onGround; i++) { g.step(1 / 60, {}); w.ev.length = 0; top = Math.max(top, pl.y); }
      return top - y0;
    };
    const low = jump();
    act('jump');
    pl.hp = 100;
    const high = jump();
    ok(w.superJump && high > 8 && high > low * 5 && pl.hp === 100 && !pl.dead, 'F7: super jump goes ' + high.toFixed(1) + ' m up and the landing does not hurt');
    act('jump');
    g.teleportTo(h.x, h.z);
    act('fly');
    const y0 = pl.y;
    for (let i = 0; i < 60; i++) { g.step(1 / 60, { rise: true }); w.ev.length = 0; }
    ok(w.fly && pl.y > y0 + 6 && !pl.onGround, 'F7: flight goes up with Space');
    const wall = city.buildings.find(b => Math.hypot(b.cx - h.x, b.cz - h.z) < 400 && b.h > 8 && inBuilding(b.cx, b.cz));
    pl.x = wall.cx - 30; pl.z = wall.cz; pl.y = city.groundY(pl.x, pl.z) + 2;
    let through = false;
    for (let i = 0; i < 240 && pl.x < wall.cx + 1; i++) { g.step(1 / 60, { fwd: 1, camYaw: Math.PI / 2 }); w.ev.length = 0; through = through || inBuilding(pl.x, pl.z); }
    ok(through && pl.x >= wall.cx, 'F7: flight passes through walls');
    pl.x = h.x; pl.z = h.z; pl.y = city.groundY(h.x, h.z) + 30;
    act('fly');
    pl.hp = 100;
    for (let i = 0; i < 600 && !pl.onGround; i++) { g.step(1 / 60, {}); w.ev.length = 0; }
    ok(!w.fly && pl.onGround && pl.hp === 100 && !pl.safeFall, 'F7: turning flight off drops the player safely');
    for (let i = 0; i < 20; i++) { g.step(1 / 60, {}); w.ev.length = 0; }
  }
  act('wanted', 6);
  ok(w.wanted.level === 6, 'F7: six beacons');
  act('wanted', -1);
  ok(w.wanted.level === 5, 'F7: minus one beacon');
  act('wanted', 0);
  ok(w.wanted.level === 0, 'F7: wanted level cleared');
  act('wanted', 1);
  ok(w.wanted.level === 1, 'F7: plus one beacon');
  act('wanted', 0);
  act('wx', 'fog');
  ok(w.weather === 'fog' && w.wx.lock, 'F7: fog stays until switched off');
  act('wx', 'auto');
  ok(!w.wx.lock, 'F7: the weather changes by itself again');
  dbg.act('bolt');
  ok(w.wx.strike && w.ev.some(e => e.t === 'thunder'), 'F7: lightning with thunder');
  w.ev.length = 0;
  act('hour', 21.5);
  ok(Math.round(w.clock) === 1290, 'F7: time of day');
  act('clock');
  const c0 = w.clock;
  for (let i = 0; i < 60; i++) { g.step(1 / 60, {}); w.ev.length = 0; }
  ok(w.clockRate === 0 && w.clock === c0, 'F7: the clock stops');
  act('clock');
  ok(w.clockRate === 1, 'F7: the clock runs again');
  pl.hp = 20; pl.armor = 0;
  act('heal');
  ok(pl.hp === pl.maxHp && pl.armor === pl.maxArmor, 'F7: heal and armour');
  for (const [id] of N.Debug.SPOTS) {
    act('tp', id);
    const p = city.places[id];
    if (p.y !== undefined) { ok(pl.y > p.y - 1, 'F7: teleport onto ' + id); continue; }
    ok(Math.hypot(pl.x - p.x, pl.z - p.z) < 25 && !inBuilding(pl.x, pl.z) && city.ground(pl.x, pl.z) !== GT.WATER, 'F7: teleport to ' + id);
    for (let i = 0; i < 3; i++) { g.step(1 / 60, {}); w.ev.length = 0; }
    ok(!g.shop && !g.saveReq && !g.mission, 'F7: arriving does not trigger a marker at ' + id);
  }
  ok(ui.resets === N.Debug.SPOTS.length, 'the camera follows every teleport');
  const car = w.spawnVehicle('vaz2106', pl.x + 3, pl.z, 0);
  w.seat(pl, car, true);
  const m = city.places.market;
  g.teleportTo(m.x + 40, m.z + 25);
  const lane = city.nearestLane(car.x, car.z, 1.5, () => true);
  ok(pl.veh === car && lane && Math.hypot(car.x - m.x, car.z - m.z) < 200, 'teleport with the car lands on a road');
  car.hp = 40; car.burning = true; car.fire = 1;
  act('fix');
  ok(car.hp === car.maxHp && !car.burning && !car.fire, 'F7: the car is repaired');
  w.exitVehicle(pl);
  g.teleportTo(3000, 1800);
  ok(!city.inWater(pl.x, pl.z) && city.inPlay(pl.x, pl.z), 'a teleport into the Oka lands on the bank');
  ok(dbg.goal() === null, 'no mission, no goal');
  g.startMission('m2');
  for (let i = 0; i < 1200 && !g.blips().length; i++) { if (g.cut) g.endCut(); g.step(1 / 60, {}); w.ev.length = 0; }
  const goal = dbg.goal();
  act('goal');
  ok(goal && Math.hypot(pl.x - goal.x, pl.z - goal.z) < 30, 'F7: teleport to the mission goal');
  if (g.mission) g.mission.fail('test');
  if (g.cut) g.endCut();
  act('car', 'btr80');
  ok(dbg.car.model === 'btr80' && dbg.car.livery === 'army', 'F7 transport: picking the BTR selects the army paint');
  act('car', 'vaz2107');
  ok(dbg.car.livery === '', 'F7 transport: a car without that livery starts plain');
  act('liv', 'dps');
  const n0 = w.vehs.length;
  act('spawn');
  const put = w.vehs[w.vehs.length - 1];
  ok(w.vehs.length === n0 + 1 && put.model === 'vaz2107' && put.livery === 'dps' && put.persistent && !put.driver && Math.hypot(put.x - pl.x, put.z - pl.z) < 9, 'F7 transport: a traffic police Lada is put next to the player');
  act('car', 't72');
  act('drive');
  const tk = pl.veh;
  ok(tk && tk.model === 't72' && tk.livery === 'army' && tk.driver === pl && !dbg.open, 'F7 transport: the player sits in a new T-72B and the menu closes');
  act('unspawn');
  ok(!w.vehs.includes(put) && w.vehs.includes(tk), 'F7 transport: the put cars are cleared, the one the player drives stays');
  ok(N.VEHICLE_IDS.every(id => N.VEHICLES[id].type === 'car' || N.VEHICLES[id].type === 'bike' || N.VEHICLES[id].type === 'truck' || N.VEHICLES[id].type === 'bus' || N.VEHICLES[id].type === 'tank' || N.VEHICLES[id].type === 'apc'), 'every vehicle type has an F7 group');
});

const atlasMeasure = (t, font) => [...t].length * +/(\d+)px/.exec(font)[1] * 0.75;
const atlasLayout = () => N.atlasLayout(N.atlasItems(city, N.EXTRA_SIGNS.concat(city.metroLine ? city.metroLine.signs : [])), atlasMeasure, 2048);

section('sign atlas', () => {
  const L = atlasLayout(), map = N.atlasMap(L), g = L.gut;
  ok(L.H <= 4096 && L.used <= L.H && L.cells.every(c => c.x >= g && c.y >= g && c.x + c.w <= L.W - g && c.y + c.h <= L.H - g), 'every atlas cell lies inside the ' + L.W + '×' + L.H + ' canvas (used ' + L.used + ' px)');
  const rows = [...L.cells].sort((a, b) => a.y - b.y);
  let overlap = false;
  for (let i = 0; i < rows.length && !overlap; i++) for (let j = i + 1; j < rows.length && rows[j].y < rows[i].y + rows[i].h + 2 * g; j++) {
    const a = rows[i], b = rows[j];
    if (a.x < b.x + b.w + 2 * g && b.x < a.x + a.w + 2 * g && a.y < b.y + b.h + 2 * g && b.y < a.y + a.h + 2 * g) overlap = true;
  }
  ok(!overlap, 'atlas cells keep their gutters (' + L.cells.length + ' cells)');
  const all = city.signs.concat(N.EXTRA_SIGNS);
  ok(all.every(s => map[s.style + '|' + s.text]) && Object.keys(N.PLATES).every(c => N.PLATES[c].every((t, i) => map['plate|' + c + '|' + i])) && map.checker && map.cross && map['text|ТАКСИ'] && map['text|МИЛИЦИЯ'], 'every sign, plate and car lettering has a cell');
  ok(all.every(s => { const A = map[s.style + '|' + s.text]; return !A[5] || A[4] <= s.w / s.h * 1.01; }), 'plate signs never squeeze their lettering');
  const K = N.KIND;
  const faceOk = (mb, nx, nz, kind) => {
    const rx = nz, rz = -nx, vs = [];
    for (let i = 0; i < mb.nv; i++) if (mb.u8[i * 32 + 29] === kind) vs.push(i);
    if (!vs.length || vs.length % 4) return false;
    for (let q = 0; q < vs.length; q += 4) {
      const P = k => [mb.f[vs[q + k] * 8], mb.f[vs[q + k] * 8 + 1], mb.f[vs[q + k] * 8 + 2], mb.f[vs[q + k] * 8 + 4], mb.f[vs[q + k] * 8 + 5]];
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const a = P(i), b = P(j), side = (a[0] - b[0]) * rx + (a[2] - b[2]) * rz;
        if (Math.abs(a[1] - b[1]) < 1e-4 && Math.abs(a[3] - b[3]) > 1e-6 && Math.sign(a[3] - b[3]) !== Math.sign(side)) return false;
        if (Math.abs(a[1] - b[1]) > 1e-4 && Math.sign(b[4] - a[4]) !== Math.sign(a[1] - b[1])) return false;
      }
    }
    return true;
  };
  let bad = 0, stretched = 0;
  for (const s of city.signs) {
    const A = map[s.style + '|' + s.text], mb = new N.MB(32);
    N.signFace(mb, s.x, s.y, s.z, s.nx, s.nz, s.w, s.h, A, K.SIGN, null);
    if (!faceOk(mb, s.nx, s.nz, K.SIGN)) bad++;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (let i = 0; i < mb.nv; i++) {
      const o = i * 8, along = mb.f[o] * s.nz - mb.f[o + 2] * s.nx;
      x0 = Math.min(x0, along); x1 = Math.max(x1, along); y0 = Math.min(y0, mb.f[o + 1]); y1 = Math.max(y1, mb.f[o + 1]);
      u0 = Math.min(u0, mb.f[o + 4]); u1 = Math.max(u1, mb.f[o + 4]); v0 = Math.min(v0, mb.f[o + 5]); v1 = Math.max(v1, mb.f[o + 5]);
    }
    if (!A[5] && Math.abs((x1 - x0) / (y1 - y0) - A[4]) > 0.02 * A[4]) stretched++;
    if (x1 - x0 > s.w + 1e-3 || y1 - y0 > s.h + 1e-3) stretched++;
  }
  ok(bad === 0, 'every wall, post and roof sign reads left to right from the front (' + bad + ' mirrored)');
  ok(stretched === 0, 'free lettering keeps its proportions inside the sign box (' + stretched + ' distorted)');
  const atlas = { map };
  for (const [type, p] of [['busstop', {}], ['kiosk', { text: N.KIOSKS[0] }], ['gaipost', {}]]) {
    const mb = new N.MB(256);
    N.Props.M[type](mb, p, atlas);
    ok(faceOk(mb, 0, -1, K.SIGN), 'the ' + type + ' sign reads left to right from its front');
  }
  const stops = city.props.filter(p => p.type === 'busstop');
  ok(stops.length > 20 && stops.every(p => { const ne = city.nearestEdge(p.x, p.z, e => !e.plant, 40); return ne && (ne.x - p.x) * Math.sin(p.rot) - (ne.z - p.z) * Math.cos(p.rot) > 0; }), 'bus stops face their road (' + stops.length + ')');
  const boards = city.props.filter(p => p.type === 'billboard');
  ok(boards.length > 20 && boards.every(p => {
    const fx = Math.sin(p.rot), fz = -Math.cos(p.rot);
    const s = city.signs.find(q => q.style === 'billboard' && q.text === p.text && Math.hypot(q.x - p.x, q.z - p.z) < 0.5);
    const d = (s.x + s.nx * 0.05 - p.x) * fx + (s.z + s.nz * 0.05 - p.z) * fz;
    return s && s.nx * fx + s.nz * fz > 0.999 && d > -0.05 && d < 0;
  }), 'billboard posters face the road in front of the frame (' + boards.length + ')');
});

section('graphics data', () => {
  const map = N.atlasMap(atlasLayout());
  N.ATLAS_MAP = map;
  const geo = new N.CityGeo(city, { map }).build();
  const bad = mb => { for (let i = 0; i < mb.nv; i++) { const o = i * 8; for (const k of [0, 1, 2, 4, 5]) if (!isFinite(mb.f[o + k])) return true; } for (let i = 0; i < mb.ni; i++) if (mb.idx[i] >= mb.nv) return true; return false; };
  let tris = 0, decals = 0;
  for (const c of geo.chunks) {
    ok(!bad(c.mb), 'chunk buffers valid ' + c.ix + ',' + c.iz);
    tris += c.mb.ni / 3;
    if (c.decal) { ok(!bad(c.decal), 'decal buffers valid ' + c.ix + ',' + c.iz); decals += c.decal.ni / 3; }
  }
  ok(!bad(geo.backdrop) && !bad(geo.interior), 'backdrop and club buffers valid');
  ok(tris > 300000 && tris < 4500000, 'static triangles ' + Math.round(tris));
  ok(decals > 50000, 'road and ground decals ' + Math.round(decals));
  const layers = new Set();
  for (const c of geo.chunks) for (let i = 0; i < c.mb.nv; i += 7) layers.add(c.mb.u8[i * 32 + 28]);
  ok([...layers].every(l => l < N.TEX_NAMES.length), 'texture layers exist');
  ok(geo.lamps.length > 500 && geo.tlights.length > 20 && [...geo.brkVerts.keys()].filter(p => p.type === 'lamp').length > 500, 'street lamps and traffic lights');
  const lmChunks = [city.dkB, city.mirB, city.uniB, city.radiusB].map(b => geo.chunkOf(b.cx, b.cz));
  ok(lmChunks.every(c => c.mb.nv > 2000 && c.y1 > 15), 'landmark models are built into their chunks');
  let gridOk = true;
  for (const fh of [2.6, 2.8, 3.3, 6]) for (let H = 1.5; H < 60; H += 0.37) {
    const g = N.floorGrid(H, fh);
    if (Math.abs(g.floors * g.fh - g.cut - H) > 1e-9 || (g.cut === 0 ? g.fh < fh * 0.8 || g.fh > fh * 1.25 : g.fh !== fh || g.cut < 0 || g.cut >= fh) || (H > fh * 1.6 && g.cut !== 0)) gridOk = false;
  }
  ok(gridOk, 'floor grid: whole floors stretched by at most 25 %, a cut only on one-storey sheds');
  const scratch = Object.create(geo);
  let cur = null, tops = 0, topBad = 0, baseBad = 0;
  scratch.chunkAt = () => cur;
  scratch.grow = () => {};
  const frac = v => Math.abs(v - Math.round(v));
  for (const b of city.buildings) {
    if (b.removed || b.lm || b.y0 || b.roof === 'saw') continue;
    const st = N.STYLE[b.style];
    if (!st || b.style === 'stands' || b.style === 'frame' || b.style === 'tank') continue;
    cur = { mb: new N.MB(256) };
    N.CityGeo.prototype.building.call(scratch, b);
    const mb = cur.mb, lay = N.TEX[st.wall];
    for (let i = 0; i < mb.nv; i++) {
      if (mb.u8[i * 32 + 28] !== lay) continue;
      const y = mb.f[i * 8 + 1], v = mb.f[i * 8 + 5];
      if (Math.abs(y - b.h) < 1e-4) { tops++; if (frac(v) > 1e-3) topBad++; }
      else if ((Math.abs(y - 0.6) < 1e-4 || Math.abs(y - st.fh - 0.6) < 1e-4) && N.floorGrid(b.h - y, st.fh).cut === 0 && frac(v) > 1e-3) baseBad++;
    }
  }
  ok(tops > 20000 && topBad === 0, 'every facade ends with a whole floor under the roof (' + tops + ' wall corners, ' + topBad + ' cut)');
  ok(baseBad === 0, 'every facade starts with a whole floor above the plinth or the shops (' + baseBad + ' cut)');
  let gridWalls = 0, gridBad = 0;
  for (const b of city.buildings) {
    if (b.removed || b.lm || b.y0 || !b.res) continue;
    const st = N.STYLE[b.style];
    if (!st) continue;
    for (const e of N.Landmarks.kit.edges(b.poly)) {
      if (e.L < 6) continue;
      const g = geo.facadeGrid(b, st, e);
      gridWalls++;
      if (Math.abs(g.base + g.floors * g.fh - b.h) > 1e-6 || g.base !== g.yb) gridBad++;
    }
  }
  ok(gridWalls > 5000 && gridBad === 0, 'balconies and air conditioners follow the same floor lines as the windows (' + gridWalls + ' walls)');
  let boxN = 0, boxOut = 0, boxNear = 0, boxRoofs = 0, boxless = 0;
  for (const b of city.buildings) {
    if (b.removed || b.lm || b.y0 || !(N.STYLE[b.style] || {}).roofBox || b.h <= 20) continue;
    const spots = geo.roofBoxSpots(b);
    boxRoofs++;
    if (!spots.length) boxless++;
    spots.forEach((q, i) => {
      boxN++;
      const r = geo.orect(q.cx, q.cz, q.ux, q.uz, q.hl, q.hw);
      for (let k = 0; k < r.length; k += 2) if (!N.pointInPoly(b.poly, r[k], r[k + 1])) { boxOut++; break; }
      if (spots.some((o, j) => j !== i && Math.hypot(o.cx - q.cx, o.cz - q.cz) < 6)) boxNear++;
    });
  }
  ok(boxN > boxRoofs && boxOut === 0 && boxNear === 0, 'roof machine rooms stand inside their roofs, one per stairwell (' + boxN + ' on ' + boxRoofs + ' tower blocks)');
  ok(boxless < boxRoofs * 0.05, 'nearly every tower block has a way onto its roof (' + boxless + ' without)');
  const det = new N.Detail(geo);
  let antRoofs = 0, antBad = 0;
  for (const b of city.buildings) {
    if (b.removed || b.lm || b.y0 || b.roof === 'gable' || b.roof === 'hip' || b.roofShape || !['k', 'p', 't', 's', 'c'].includes(b.kind) || !N.STYLE[b.style]) continue;
    if (antRoofs > 400) break;
    const mb = new N.MB(256);
    det.antennas(mb, b);
    if (!mb.nv) continue;
    antRoofs++;
    let lo = Infinity;
    for (let i = 0; i < mb.nv; i++) lo = Math.min(lo, mb.f[i * 8 + 1]);
    if (Math.abs(lo - b.h) > 1e-4) antBad++;
  }
  ok(antRoofs > 100 && antBad === 0, 'roof antennas stand on the roof slab, not on the parapet (' + antRoofs + ' roofs)');
  const doorsAll = city.props.filter(p => p.type === 'podezd' && p.b !== undefined && !city.buildings[p.b].removed);
  let snapped = 0, stairB = 0, stairCols = 0;
  for (const d of doorsAll) {
    const b = city.buildings[d.b], st = N.STYLE[b.style], K = N.BUILD_KIND[b.kind];
    if (!K || !K.mw) continue;
    for (const e of N.Landmarks.kit.edges(b.poly)) {
      const v = (d.x - e.ax) * e.nx + (d.z - e.az) * e.nz, s2 = (d.x - e.ax) * e.ux + (d.z - e.az) * e.uz;
      if (Math.abs(v) > 0.05 || s2 < 0 || s2 > e.L || e.L < K.mw * 0.7) continue;
      const mods = Math.max(1, Math.round(e.L / K.mw)), us = e.L / mods;
      if (Math.abs((s2 / us) % 1 - 0.5) < 0.02) snapped++;
    }
  }
  ok(snapped > doorsAll.length * 0.9, 'entrance doors sit in the middle of a facade module (' + snapped + ' of ' + doorsAll.length + ')');
  for (const b of city.buildings) {
    if (b.removed || !['panel5', 'brick5', 'panel9', 'panel9b', 'panel16', 'panel16b'].includes(b.style) || b.y0) continue;
    const ds = geo.doorsOf(b);
    if (!ds.length) continue;
    let n = 0;
    for (const e of N.Landmarks.kit.edges(b.poly)) { if (e.L < 6) continue; n += det.stairMods(e, geo.facadeGrid(b, N.STYLE[b.style], e), ds).size; }
    if (n) { stairB++; stairCols += n; }
  }
  ok(stairB > 800 && stairCols > 3000, 'panel and brick houses show stairwell windows above their entrances (' + stairCols + ' stairwells on ' + stairB + ' houses)');
  const paths = city.doorPaths || [];
  ok(paths.length > doorsAll.length * 0.95 && paths.every(q => Math.hypot(q.bx - q.ax, q.bz - q.az) <= 19 && !inBuilding((q.ax + q.bx) / 2, (q.az + q.bz) / 2)), 'a path leads out of every entrance that opens onto the yard (' + paths.length + ' of ' + doorsAll.length + ')');
  const yardProps = city.props.filter(p => (p.type === 'bench' || p.type === 'urn') && !p.stop);
  ok(yardProps.length > 1000 && yardProps.every(p => !inBuilding(p.x, p.z) && city.surfaceAt(p.x, p.z) === 3), 'benches and litter bins by the entrances, outside walls and roads (' + yardProps.length + ')');
  let dTris = 0, dChunks = 0, dMax = 0;
  const dLayers = new Set();
  for (const c of geo.chunks) {
    if (!c.blds) continue;
    const mb = det.chunk(c);
    if (!mb) continue;
    ok(!bad(mb), 'detail buffers valid ' + c.ix + ',' + c.iz);
    dTris += mb.ni / 3; dChunks++; dMax = Math.max(dMax, mb.nv);
    for (let i = 0; i < mb.nv; i += 5) dLayers.add(mb.u8[i * 32 + 28]);
  }
  ok(dChunks > 300 && dTris > 200000 && dMax < 120000, 'near detail: balconies, pipes, antennas (' + dChunks + ' chunks, ' + Math.round(dTris) + ' tris, max ' + dMax + ' verts)');
  ok(['concrete', 'railing', 'glazedbalc', 'balcpanel', 'metal', 'cloth', 'white'].every(n => dLayers.has(N.TEX[n])), 'houses get slabs, railings, glazed loggias, laundry, dishes and antennas');
  const CAR_LOD0_VERTS = 3500;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = a => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };
  const trisOf = (mb, keepGlass) => {
    const out = [];
    for (let i = 0; i < mb.ni; i += 3) {
      const k = [mb.idx[i], mb.idx[i + 1], mb.idx[i + 2]];
      if (!keepGlass && mb.u8[k[0] * 32 + 29] === N.KIND.GLASS) continue;
      out.push(k.map(j => [mb.f[j * 8], mb.f[j * 8 + 1], mb.f[j * 8 + 2]]));
    }
    return out;
  };
  const inTri = (p, T) => {
    const v0 = sub(T[1], T[0]), v1 = sub(T[2], T[0]), v2 = sub(p, T[0]);
    const d00 = dot(v0, v0), d01 = dot(v0, v1), d11 = dot(v1, v1), d20 = dot(v2, v0), d21 = dot(v2, v1), den = d00 * d11 - d01 * d01;
    const b = (d11 * d20 - d01 * d21) / den, c = (d00 * d21 - d01 * d20) / den;
    return b > 0.01 && c > 0.01 && b + c < 0.99;
  };
  const paintOverGlass = m => {
    const glass = trisOf(m.gl, true).concat(...m.doors.map(d => trisOf(d.gl, true)));
    const body = trisOf(m.mb, false).concat(...m.doors.map(d => trisOf(d.mb, false)));
    for (const G of glass) {
      const n = unit(cross(sub(G[1], G[0]), sub(G[2], G[0])));
      for (const B of body) {
        const bn = unit(cross(sub(B[1], B[0]), sub(B[2], B[0])));
        if (!isFinite(bn[0]) || Math.abs(dot(bn, n)) < 0.999) continue;
        const c = [0, 1, 2].map(i => (B[0][i] + B[1][i] + B[2][i]) / 3);
        if (Math.abs(dot(sub(c, G[0]), n)) < 0.002 && inTri(c, G)) return true;
      }
    }
    return false;
  };
  const layerIn = (mb, layer) => { for (let i = 0; i < mb.nv; i++) if (mb.u8[i * 32 + 28] === layer) return true; return false; };
  for (const id of N.VEHICLE_IDS) {
    const m = N.Models.car(id, null), doorV = (m.doors || []).reduce((a, d) => a + d.mb.nv, 0);
    ok(!bad(m.mb) && m.wheels.length >= 2 && m.mb.nv + doorV <= CAR_LOD0_VERTS, 'car model ' + id + ' within the near-detail budget');
    for (const l of Object.keys(N.VEHICLES[id].liveries || {})) ok(!bad(N.Models.car(id, l).mb), 'livery model ' + id + ' ' + l);
    if (m.bike) {
      ok(m.lamps.some(a => a.k === 'head' && a.n[2] < 0 && a.p[1] > 0.8) && m.lamps.some(a => a.k === 'tail' && a.n[2] > 0), 'bike lamps at the head and the tail of ' + id);
      continue;
    }
    if (m.armor) continue;
    for (const l of [null].concat(Object.keys(N.VEHICLES[id].liveries || {}))) ok(!paintOverGlass(N.Models.car(id, l)), 'no opaque panel in the plane of the glass of ' + id + ' ' + (l || ''));
    const keys = new Set(m.lamps.map(a => a.k + (a.n[2] < 0 ? 'F' : 'R') + a.side));
    ok(['headF', 'indF', 'tailR', 'indR', 'revR'].every(k => keys.has(k + '-1') && keys.has(k + '1')), 'head, tail, reverse lamps and indicators on both sides of ' + id);
    ok(m.lamps.every(a => (a.side < 0) === (a.p[0] < 0) && Math.abs(a.p[2]) > N.VEHICLES[id].hl - 0.3), 'lamp anchors of ' + id + ' sit on their side at the ends of the car');
    ok(m.plates.length === 2 && m.plates.every(q => q.every(isFinite)), 'front and rear number plates of ' + id);
    ok(N.VEHICLES[id].type === 'bus' ? layerIn(m.mb, N.TEX.mirror) : m.doors.every(d => layerIn(d.mb, N.TEX.mirror)), 'mirrors ride on the doors of ' + id + ' (the bus has them on its body)');
  }
  const m7 = N.Models.car('vaz2107', null), M0 = N.M3.euler(0, 0, 0, 0, 0, 0);
  const head = m7.lamps.find(a => a.k === 'head'), tail = m7.lamps.find(a => a.k === 'tail');
  ok(N.lampGlow(M0, head, [0, 1, -12]).k > 0.9 && N.lampGlow(M0, head, [0, 1, 12]).k === 0 && N.lampGlow(M0, tail, [0, 1, 12]).k > 0.9 && N.lampGlow(M0, tail, [0, 1, -12]).k === 0, 'a lamp glows only toward the side it faces');
  ok(N.lampGlow(M0, head, [9, 0.6, head.p[2]]).k < 0.05, 'no head lamp glare straight from the side');
  const K = N.KIND, m6 = N.Models.car('vaz2106', null), m9 = N.Models.car('vaz2109', null);
  const byKind = (mb, kind) => { const out = []; for (let i = 0; i < mb.nv; i++) if (mb.u8[i * 32 + 29] === kind) out.push(i); return out; };
  ok(byKind(m6.mb, K.CHROME).length > 20 && byKind(m9.mb, K.TRIM).length > 100 && byKind(m9.mb, K.CHROME).length < byKind(m6.mb, K.CHROME).length / 4 && m6.doors.every(d => byKind(d.mb, K.CHROME).length > 0) && m9.doors.every(d => byKind(d.mb, K.TRIM).length > 0), 'chrome bumpers, trims and mirrors on the classics, black plastic on the Samara');
  const low = [], high = [];
  for (let i = 0; i < m6.mb.nv; i++) { const y = m6.mb.f[i * 8 + 1], g = m6.mb.u8[i * 32 + 31]; if (m6.mb.u8[i * 32 + 29] === K.PAINT) (y < 0.4 ? low : y > 1.2 ? high : []).push(g); }
  ok(low.length && high.length && Math.min(...low) > 150 && Math.max(...high) === 0, 'grime is baked low on the body, never on the roof');
  const dyn = new N.Dyn(20000);
  dyn.add(m6.mb, N.M3.euler(0, 0, 0, 0, 0, 0), [200, 30, 30], null, null, null, 1, [0.8, 0.5, 0.3]);
  const p0 = byKind(m6.mb, K.PAINT)[0], lens = [];
  for (let i = 0; i < dyn.nv; i++) if (dyn.u8[i * 32 + 29] === K.LENS) lens.push(i);
  ok(dyn.u8[p0 * 32 + 30] === 204 && dyn.u8[p0 * 32 + 31] === (m6.mb.u8[p0 * 32 + 31] * 0.5 | 0) && lens.length > 20, 'per-car gloss and dirt reach the vertices, unlit lamps become lenses');
  dyn.reset();
  dyn.add(m6.gl, N.M3.euler(0, 0, 0, 0, 0, 0), null, null, null, null, 1, [0.8, 0.5, 0.6]);
  ok(dyn.u8[30] === 153, 'glass tint per car');
  const car = (o) => Object.assign({ id: 7, dead: false, livery: null, spec: N.VEHICLES.vaz2107 }, o);
  ok(N.carLook(car({ dead: true }))[0] === 0 && N.carLook(car({ spec: N.VEHICLES.volga3102, livery: 'fsb' }))[2] === 0.75 && N.carLook(car({ spec: N.VEHICLES.merc600 }))[2] > 0.4, 'burnt, FSB tint, dark glass of the Mercedes');
  const avg = (spec, k) => { let s = 0; for (let id = 0; id < 60; id++) s += N.carLook(car({ id, spec }))[k]; return s / 60; };
  ok(avg(N.VEHICLES.vaz2101, 0) < avg(N.VEHICLES.vaz2110, 0) - 0.15 && avg(N.VEHICLES.vaz2101, 1) > avg(N.VEHICLES.vaz2110, 1), 'old cars are duller and dirtier than new ones');
  const fleet = [30, 5, 20, 2, 70, 9].map((d, i) => [d, { id: i, lights: true, dead: false }]).sort((a, b) => b[0] - a[0]);
  const own = fleet.find(q => q[0] === 70)[1];
  const spots = N.spotCars(fleet, own, 3);
  ok(spots.size === 4 && spots.has(own) && [2, 5, 9].every(d => spots.has(fleet.find(q => q[0] === d)[1])) && N.spotCars(fleet, own, 0).size === 1, 'headlight cones: own car and the three nearest');
  const rr = Object.create(N.Renderer.prototype);
  rr.plBuf = new Float32Array(64); rr.pcBuf = new Float32Array(48); rr.pdBuf = new Float32Array(64);
  const nl = rr.packLights([{ x: 1, y: 2, z: 3, r: 9, c: [1, 1, 1], d: [0, -1, 0], cos: 0.9 }, { x: 0, y: 0, z: 0, r: 5, c: [1, 0, 0] }]);
  ok(nl === 2 && rr.pdBuf[3] === Math.fround(0.9) && rr.pdBuf[1] === -1 && rr.pdBuf[7] === -2 && N.MAX_LIGHTS === 16, 'spot and point lights pack into the light arrays');
  const plateMesh = N.Models.plate('plate|militia|0');
  ok(plateMesh && plateMesh.nv === 4 && N.Models.plate('plate|nothing|0') === null, 'plate quads come from the atlas');
  const LOD_VERTS = [3500, 1200, 600];
  const REAL = {
    vaz2101: [4.07, 1.611, 1.44, 2.424, 1.349, 1.305, 0.292], vaz2106: [4.17, 1.611, 1.44, 2.424, 1.349, 1.305, 0.292], vaz2107: [4.15, 1.62, 1.44, 2.424, 1.349, 1.305, 0.292],
    vaz2109: [4.0, 1.65, 1.4, 2.46, 1.4, 1.37, 0.28], vaz21099: [4.2, 1.65, 1.4, 2.46, 1.4, 1.37, 0.28], vaz2110: [4.265, 1.68, 1.42, 2.49, 1.4, 1.37, 0.29],
    niva: [3.74, 1.68, 1.64, 2.2, 1.43, 1.4, 0.343], oka: [3.2, 1.42, 1.4, 2.18, 1.21, 1.2, 0.26], zaz968: [3.765, 1.57, 1.4, 2.16, 1.22, 1.2, 0.3],
    m412: [4.25, 1.55, 1.48, 2.4, 1.27, 1.27, 0.305], m2141: [4.35, 1.69, 1.4, 2.58, 1.44, 1.42, 0.31],
    volga24: [4.735, 1.8, 1.49, 2.8, 1.46, 1.42, 0.321], volga3110: [4.88, 1.8, 1.49, 2.8, 1.46, 1.42, 0.321], volga3102: [4.96, 1.82, 1.49, 2.8, 1.496, 1.446, 0.324],
    uaz469: [4.025, 1.785, 2.05, 2.38, 1.442, 1.442, 0.384], uaz452: [4.36, 1.94, 2.03, 2.3, 1.453, 1.442, 0.372], gazel: [5.47, 2.075, 2.2, 2.9, 1.7, 1.56, 0.342],
    gaz53: [6.395, 2.38, 2.22, 3.7, 1.63, 1.69, 0.465, 2.0], paz: [6.925, 2.5, 2.94, 3.6, 1.94, 1.69, 0.465],
    bmw525: [4.72, 1.751, 1.412, 2.761, 1.47, 1.495, 0.324], merc600: [5.113, 1.886, 1.484, 3.04, 1.602, 1.574, 0.344], audi80: [4.393, 1.695, 1.397, 2.546, 1.41, 1.43, 0.3],
    lc80: [4.82, 1.93, 1.86, 2.85, 1.595, 1.6, 0.395, 1.8], avtozak: [6.66, 2.45, 3.0, 3.77, 1.63, 1.69, 0.47, 2.16], ural4320: [7.37, 2.5, 2.87, 4.225, 2.0, 2.0, 0.57, 2.36]
  };
  const bodyVerts = m => m.mb.nv + m.doors.reduce((a, d) => a + d.mb.nv, 0);
  for (const id of Object.keys(REAL)) {
    ok(N.Cars.has(id), 'new body builder for ' + id);
    const spec = N.VEHICLES[id], cab = N.cabin(spec), M = N.Cars.data(id);
    const ms = [0, 1, 2].map(l => N.Models.car(id, null, l));
    ms.forEach((m, l) => ok(!bad(m.mb) && !bad(m.gl) && m.doors.every(d => !bad(d.mb) && !bad(d.gl)) && bodyVerts(m) <= LOD_VERTS[l] && m.wheel && m.wheel.nv > 0, id + ' LOD' + l + ' within ' + LOD_VERTS[l] + ' vertices (' + bodyVerts(m) + ')'));
    ok(bodyVerts(ms[0]) > bodyVerts(ms[1]) && bodyVerts(ms[1]) > bodyVerts(ms[2]) && ms[0].wheel.nv > ms[2].wheel.nv, id + ' detail drops with distance');
    let x0 = 0, y1 = 0, z0 = 0, z1 = 0;
    for (const mb of [ms[0].mb].concat(ms[0].doors.map(d => d.mb))) for (let i = 0; i < mb.nv; i++) {
      const k = mb.u8[i * 32 + 29];
      if (k !== N.KIND.PAINT && k !== N.KIND.CHROME && k !== N.KIND.TRIM) continue;
      x0 = Math.max(x0, Math.abs(mb.f[i * 8])); y1 = Math.max(y1, mb.f[i * 8 + 1]); z0 = Math.min(z0, mb.f[i * 8 + 2]); z1 = Math.max(z1, mb.f[i * 8 + 2]);
    }
    const R = REAL[id];
    ok(Math.abs(z1 - z0 - R[0]) < 0.03 && Math.abs(y1 - R[2]) < 0.02, id + ' is ' + R[0] + ' m long and ' + R[2] + ' m tall like the real car (' + (z1 - z0).toFixed(3) + ' x ' + y1.toFixed(3) + ')');
    const side = N.Cars.section(id, 1.0);
    ok(Math.abs(side[2][0] * 2 - (R[7] || R[1])) < 0.01 && x0 < R[1] / 2 + 0.2, id + ' body width ' + (R[7] || R[1]) + ' m, mirrors within reach');
    const w = ms[0].wheels;
    const wf = w.filter(q => q.front), wr = w.filter(q => !q.front), dual = N.Cars.data(id).dual, tandem = N.Cars.data(id).tandem;
    const rearX = wr.map(q => Math.abs(q.x)), rearMid = dual ? (Math.min(...rearX) + Math.max(...rearX)) / 2 : rearX[0], rearZ = tandem ? (wr[0].z + wr[1].z) / 2 : wr[0].z;
    ok(wf.length === 2 && wr.length === (dual || tandem ? 4 : 2) && Math.abs(rearZ - wf[0].z - R[3]) < 1e-6 && Math.abs(wf[0].z - (spec.shape.ax - spec.shape.L / 2)) < 1e-6 && Math.abs(Math.abs(wf[0].x) * 2 - R[4]) < 1e-6 && Math.abs(rearMid * 2 - R[5]) < 1e-6 && w.every(q => Math.abs(q.r - R[6]) < 1e-6) && Math.abs(spec.shape.wb - R[3]) < 0.01 && Math.abs(spec.shape.wr - R[6]) < 1e-6, id + ' wheels at the real axles and track (wheelbase ' + R[3] + ' m' + (dual ? ', dual rear wheels' : '') + ')');
    let inside = 0;
    for (const mb of [ms[0].mb].concat(ms[0].doors.map(d => d.mb))) for (let i = 0; i < mb.nv; i++) {
      const x = Math.abs(mb.f[i * 8]), y = mb.f[i * 8 + 1], z = mb.f[i * 8 + 2];
      for (const q of w) if (x > Math.abs(q.x) - 0.075 && x < Math.abs(q.x) + 0.075 && Math.hypot(y - q.y, z - q.z) < q.r - 0.005) inside++;
    }
    ok(inside === 0, id + ' wheel arches clear the tyres');
    const gl = trisOf(ms[0].gl, true).map(t => unit(cross(sub(t[1], t[0]), sub(t[2], t[0]))));
    ok(gl.some(n => n[2] < -0.3 && Math.abs(n[1]) > 0.1) && gl.some(n => n[2] > 0.3) && gl.concat(...ms[0].doors.map(d => trisOf(d.gl, true).map(t => unit(cross(sub(t[1], t[0]), sub(t[2], t[0])))))).some(n => Math.abs(n[0]) > 0.85) && ms[0].doors.every(d => d.gl.nv > 0), id + ' windshield, back window, side and door glass');
    const dz = [Infinity, -Infinity];
    for (const d of ms[0].doors) for (let i = 0; i < d.mb.nv; i++) { if (d.mb.u8[i * 32 + 29] !== N.KIND.PAINT) continue; const z = d.mb.f[i * 8 + 2]; dz[0] = Math.min(dz[0], z); dz[1] = Math.max(dz[1], z); }
    ok(Math.abs(dz[0] - cab.door.z0) < 0.01 && Math.abs(dz[1] - cab.door.z1) < 0.01 && ms[0].doors.every(d => Math.abs(d.hz - cab.door.z0) < 1e-6 && Math.abs(Math.abs(d.hx) - side[2][0]) < 0.01), id + ' door panels match the cabin doors the people use');
    ok(cab.z1 < cab.seat.z && cab.seat.z < cab.door.z1 && cab.wheel.z > cab.z1 && cab.seat.z > cab.door.z0, id + ' seat and steering wheel inside the new cabin');
    ok(Math.abs(spec.shape.L - R[0]) < 0.005 && Math.abs(spec.shape.W - R[1]) < 0.005 && Math.abs(spec.shape.H - R[2]) < 0.005, id + ' spec keeps the real outer size');
  }
  const izh = N.Models.car('izh', null, 0), icab = N.cabin(N.VEHICLES.izh);
  const bikeTotal = m => m.mb.nv + m.wheel.nv * m.wheels.length;
  ok(N.Models.car('izh', null, 2) === N.Models.car('izh', null, 1) && bikeTotal(N.Models.car('izh', null, 1)) < bikeTotal(izh) * 0.75 && bikeTotal(N.Models.car('ural', null, 1)) < bikeTotal(N.Models.car('ural', null, 0)) * 0.75 && N.VEHICLE_IDS.every(id => N.VEHICLES[id].type === 'bike' || N.Models.car(id, null, 2) !== N.Models.car(id, null, 0)), 'every car has three detail levels, the bikes two');
  ok(izh.bike && izh.wheel && izh.wheels.length === 2 && !izh.wheels.some(w => w.thin) && Math.abs(izh.wheels[1].z - izh.wheels[0].z - 1.44) < 1e-6 && izh.mb.nv < 1500, 'IZh Planeta-5: own spoked wheels on a 1.44 m wheelbase, under 1500 vertices');
  ok(icab.bars.z < icab.seat.z && icab.seat.z - icab.bars.z < 0.6 && icab.bars.y > icab.seat.y && icab.seat.z + 0.4 < 1.44 / 2 + 0.2, 'the rider sits behind the handlebar on the seat, the pillion behind him');
  let ix0 = 0, iy1 = 0;
  for (let i = 0; i < izh.mb.nv; i++) { ix0 = Math.max(ix0, Math.abs(izh.mb.f[i * 8])); iy1 = Math.max(iy1, izh.mb.f[i * 8 + 1]); }
  ok(ix0 < 0.815 / 2 + 0.01 && iy1 < 1.25 && iy1 > 1.0, 'the bike is 0.815 m wide over the handlebar');
  ok(!N.TEX_NAMES.some(n => n.startsWith('carfront') || n === 'carside'), 'the old painted car faces are gone');
  for (const id of ['vaz2107', 'volga3110', 'merc600']) {
    const m = N.Models.car(id, null, 0), q = N.Cars.data(id).moldings[0], y0 = q.y - q.h / 2, y1 = q.y + q.h / 2;
    let n = 0;
    for (const d of m.doors) for (let i = 0; i < d.mb.nv; i++) {
      const y = d.mb.f[i * 8 + 1];
      if (y >= y0 - 1e-3 && y <= y1 + 1e-3 && Math.abs(d.mb.i8[i * 32 + 12]) > 120 && d.mb.u8[i * 32 + 29] !== N.KIND.PAINT) n++;
    }
    ok(n >= 4, id + ': the side molding below the crease is drawn on the doors');
  }
  for (const id of N.VEHICLE_IDS) {
    if (N.VEHICLES[id].type === 'bike' || N.VEHICLES[id].shape.hatch) continue;
    const M = N.Cars.data(id), I = M.inside, m0 = N.Models.car(id, null, 0), ins = N.Cars.inside(id, null, 0), sh = N.VEHICLES[id].shape;
    ok(I && N.Cars.STEER_STYLES.includes(I.steer) && m0.steer === I.steer && m0.trims === I.seats.length, id + ': cabin data and steering wheel style');
    let gauges = 0, seat = 0, bad = 0, outside = 0;
    const sc = I.seats[0];
    for (let i = 0; i < ins.nv; i++) {
      const b = i * 32, x = ins.f[i * 8], y = ins.f[i * 8 + 1], z = ins.f[i * 8 + 2];
      if (ins.u8[b + 29] === N.LAMPKIND.DASH && ins.i8[b + 14] > 100) gauges++;
      if (ins.u8[b + 24] === sc[0] && ins.u8[b + 25] === sc[1] && ins.u8[b + 26] === sc[2]) seat++;
      for (const k of [0, 1, 2, 4, 5]) if (!isFinite(ins.f[i * 8 + k])) bad++;
      if (Math.abs(x) > sh.W / 2 + 0.01 || y < 0 || y > sh.H + 0.01 || Math.abs(z) > sh.L / 2) outside++;
    }
    ok(ins.nv < 1500 && gauges >= 4 && seat >= 48 && !bad && !outside, id + ': interior with gauges facing the driver and seats inside the body, ' + ins.nv + ' vertices');
    const w = N.cabin(N.VEHICLES[id]).wheel, topY = w.y + w.r * Math.cos(w.tilt), topA = w.z - w.r * Math.sin(w.tilt) - M.zOff;
    const yb = M.deck(M.ws[0]), yg = M.roof(M.ws[2]), ga = M.ws[0] + (M.ws[2] - M.ws[0]) * Math.min(1, Math.max(0, (topY - yb) / (yg - yb)));
    ok(topA > ga + 0.01, id + ': the steering wheel clears the windshield');
  }
  ok(!N.Cars.data('vaz2101').inside.rests && N.Cars.data('vaz2107').inside.rests && !N.Cars.data('volga24').inside.rests && N.Cars.data('volga3110').inside.rests && N.Cars.data('merc600').inside.rearRests, 'headrests where the real cars had them');
  ok(N.Cars.data('uaz469').inside.steer === 'three' && N.Cars.data('volga24').inside.steer === 'ring' && N.Cars.data('merc600').inside.steer === 'airbag' && N.Cars.data('vaz2110').inside.steer === 'samara', 'steering wheels: three spokes on the UAZ, the chrome horn ring of the Volga, the airbag of the S-class, the wide two spokes of the VAZ');
  ok(N.Cars.inside('vaz2107', null, 0) !== N.Cars.inside('vaz2107', null, 1) && N.Cars.inside('vaz2107', 'militia', 0) === N.Cars.inside('vaz2107', 'militia', 0), 'interior colour variants are cached per car');
  const uazIn = N.Cars.inside('uaz469', null, 0);
  let uazPaint = 0;
  for (let i = 0; i < uazIn.nv; i++) if (uazIn.u8[i * 32 + 29] === N.KIND.PAINT) uazPaint++;
  ok(uazPaint > 8, 'the UAZ dashboard is painted in the body colour');
  const lampKinds = m => { const c = {}; for (let i = 0; i < m.mb.nv; i++) { const k = m.mb.u8[i * 32 + 29]; c[k] = (c[k] || 0) + 1; } return c; };
  const fsb = N.Models.car('volga3102', 'fsb', 0), fk = lampKinds(fsb);
  let fsbX = -9;
  for (let i = 0; i < fsb.mb.nv; i++) if (fsb.mb.u8[i * 32 + 29] === N.LAMPKIND.BLUE) fsbX = Math.max(fsbX, fsb.mb.f[i * 8]);
  ok(fk[N.LAMPKIND.BLUE] > 20 && !fk[N.LAMPKIND.RED] && fsbX < -0.15 && fsb.beacon && fsb.beacon.blue, 'the FSB Volga carries one blue magnetic beacon over the driver');
  const amb = N.Models.car('uaz452', 'ambulance', 0), ak = lampKinds(amb), mil = N.Models.car('vaz2107', 'militia', 0), mk = lampKinds(mil);
  const dps = N.Models.car('vaz2107', 'dps', 0), dk = lampKinds(dps), old = N.Models.car('vaz2106', 'old', 0), ok2 = lampKinds(old);
  ok(ak[N.LAMPKIND.BLUE] > 20 && !ak[N.LAMPKIND.RED] && amb.beacon.blue && mk[N.LAMPKIND.BLUE] > 40 && !mk[N.LAMPKIND.RED] && mil.beacon.blue && dk[N.LAMPKIND.BLUE] && dk[N.LAMPKIND.RED] && !dps.beacon.blue && ok2[N.LAMPKIND.BLUE] && !ok2[N.LAMPKIND.RED], 'blue beacons on the ambulance, the patrol cars and the old yellow cars; the traffic police bar is blue and red');
  ok(N.VEHICLE_IDS.every(id => N.VEHICLES[id].colors.every(c => N.PAINT_NAME[c])) && N.METALLIC.has(N.PAINTS['Снежная королева']) && !N.METALLIC.has(N.PAINTS['Баклажан']), 'factory colours of the era have names, metallic paints are marked');
  const lookOf = c => N.carLook({ id: 5, spec: N.VEHICLES.vaz2110, color: c, livery: null });
  ok(lookOf(N.PAINTS['Кварц'])[0] > lookOf(N.PAINTS['Белый'])[0], 'metallic paint keeps more gloss');
  const liv = N.Models.car('vaz2107', 'militia', 0);
  const over = [];
  for (const id of N.VEHICLE_IDS) {
    if (N.VEHICLES[id].type === 'bike' || N.VEHICLES[id].shape.hatch) continue;
    for (const liv of Object.keys(N.VEHICLES[id].liveries || {})) for (const lod of [0, 1, 2]) {
      const m = N.Models.car(id, liv, lod), n = m.mb.nv + m.doors.reduce((a, d) => a + d.mb.nv, 0);
      if (n > [3500, 1200, 600][lod]) over.push(id + ':' + liv + ' L' + lod + ' ' + n);
    }
  }
  ok(!over.length, 'liveried service cars stay within the detail budgets ' + over.join(', '));
  ok(liv.doors.every(d => { for (let i = 0; i < d.mb.nv; i++) if (d.mb.u8[i * 32 + 29] === N.KIND.ATLAS) return true; return false; }) && liv.lamps.length === 10, 'militia lettering rides on the front doors');
  ok(N.PLATES.civil.every(t => /^[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2} 52$/.test(t)) && N.PLATES.militia.every(t => /^[АВЕКМНОРСТУХ]\d{4} 52$/.test(t)) && N.PLATES.army.every(t => /^\d{4}[АВЕКМНОРСТУХ]{2} \d{2}$/.test(t)), 'number plates in the 1993 civil, militia and army formats');
  for (const k of Object.keys(N.PED_KINDS)) { const pm = N.Models.ped(N.makeLook(k, N.rng(1))); ok(!bad(pm.mb) && pm.bones.length === pm.mb.nv, 'ped model ' + k); }
  for (const w of N.WEAPON_IDS) if (w !== 'fists') ok(N.Models.weapon(w).nv > 0, 'weapon model ' + w);
  const p = { id: 1, x: 0, y: 0, z: 0, yaw: 0.3, vx: 1, vz: -3, anim: { phase: 1, speed: 4, aim: 1, action: 'shoot', actionT: 0.1, shot: 0.02 }, weapon: 'ak', onGround: true, look: N.playerLook('zek') };
  const pm = N.Models.ped(p.look);
  const rig = N.pedRig(p, 1, N.pedRoot(p), pm.piv);
  ok(rig.G.length === 16 && rig.G.every(m => m.every(isFinite)) && rig.wpn && rig.wpn.every(isFinite), 'rig finite');
  const env = N.envFor(20 * 60, new N.Weather(5, 'rain'), 1, false);
  ok(env.night >= 0 && env.fog.every(isFinite) && env.sun.every(isFinite), 'environment palette');
  const W = k => new N.Weather(1, k);
  const day = N.envFor(13 * 60, W('clear'), 1, false), wetEnv = N.envFor(13 * 60, W('rain'), 1, false), fogEnv = N.envFor(8 * 60, W('fog'), 1, false), night = N.envFor(0, W('clear'), 1, false);
  for (const e of [day, wetEnv, fogEnv, night]) ok(['skyTop', 'skyHor', 'sunCol', 'sky', 'gnd', 'fog', 'glow', 'moon', 'hfog', 'fogSun', 'flash', 'bolt', 'wind'].every(k => e[k].every(isFinite)) && Object.values(e.post).every(v => Array.isArray(v) ? v.every(isFinite) : isFinite(v)), 'environment values are finite');
  ok(wetEnv.fogFar < day.fogFar * 0.7 && wetEnv.wet === 1 && wetEnv.rain > 0.3 && wetEnv.post.sat < day.post.sat, 'rain: shorter view, wet streets, greyer picture');
  ok(fogEnv.fogFar < 200 && fogEnv.hfog[0] > day.hfog[0] * 20 && fogEnv.beam > 0 && fogEnv.halo > 2, 'fog: dense ground fog, visible light beams');
  ok(night.stars > 0.5 && day.stars === 0 && night.night === 1 && night.glow[0] > 0, 'stars and city glow at night');
  ok(day.post.heat > 0.5 && wetEnv.post.heat === 0 && fogEnv.post.heat === 0, 'heat haze only on a clear day');
  ok(wetEnv.post.lens > 0 && day.post.lens === 0, 'raindrops on the lens only in rain');
  ok(day.cloud < wetEnv.cloud && wetEnv.dark > day.dark, 'rain clouds are thicker and darker');
  const storm = W('rain');
  storm.lightning(900);
  storm.step(1 / 60, 23, false);
  const se = N.envFor(23 * 60, storm, 1, false);
  ok(se.flash[3] > 0 && Math.abs(Math.hypot(se.flash[0], se.flash[1], se.flash[2]) - 1) < 1e-6 && se.bolt[2] > 0, 'lightning lights the scene and draws a bolt');
  const inside = N.envFor(12 * 60, storm, 1, true);
  ok(inside.interior && inside.rain === 0 && inside.flash[3] === 0 && inside.post.bloom > 0, 'interiors keep the weather out');
  const tab = N.surfaceTable();
  ok(tab.length === 1024 && N.TEX_NAMES.length <= 256, 'surface table fits the texture layers (' + N.TEX_NAMES.length + ')');
  ok(tab[N.TEX.asphalt * 4] === 255 && tab[N.TEX.grass * 4] === 0 && tab[N.TEX.grass * 4 + 3] < 40 && tab[N.TEX.water * 4 + 2] > 200, 'puddles on asphalt, not on grass');
  ok(Object.keys(N.SURFACE).every(k => N.TEX[k] !== undefined && N.SURFACE[k].length === 4), 'surface names match texture layers');
  const fx = new N.FX();
  fx.muzzle(0, 1, 0, [1, 0, 0], 'ak');
  fx.tracer([0, 1, 0], [60, 1, 0], 'ak', 0);
  fx.tracer([0, 1, 0], [20, 1, 0], 'shotgun', 3);
  fx.explosion(0, 0, 0, 6);
  ok(fx.shots.length === 1 && fx.tracers.length === 2 && fx.tracers[1].a8 < fx.tracers[0].a8 && fx.balls.length === 5 && fx.rings.length === 1 && fx.waves.length === 1, 'shot, tracers and an explosion');
  fx.step(0.12);
  ok(fx.shots.length === 0 && fx.tracers.length === 1 && fx.balls.length === 5, 'a muzzle flash is a blink, a tracer flies');
  fx.step(2);
  ok(fx.balls.length === 0 && fx.rings.length === 0 && fx.waves.length === 0 && fx.tracers.length === 0, 'effects expire');
  const q = new N.FxQuads(12);
  q.bill(0, 0, 0, 1, 1, N.FXT.STAR, 0, 0, [255, 255, 255, 255], [1, 0, 0], [0, 1, 0]);
  q.axis([0, 0, 0], [5, 0, 0], 0.1, 0.2, N.FXT.TRACER, 0, 0, [255, 255, 255, 255], [0, 2, 5]);
  q.flat(0, 0, 0, 2, N.FXT.RING, 0.5, 0, [255, 255, 255, 255]);
  ok(q.n === 12 && Array.from(q.f.subarray(0, 120)).every((v, i) => i % 10 === 9 || isFinite(v)), 'effect quads');
  const RENDER = read('js/apps/gtann/nn-render.js');
  const all = Object.values(N.GLSL).map(p => p.join('\n')).join('\n');
  for (const [name, prog] of Object.entries(N.GLSL)) {
    for (const src of prog) {
      ok(src.startsWith('#version 300 es\n') && /void main\(\)/.test(src), 'GLSL program ' + name);
      let depth = 0, low = 0;
      for (const ch of src) { if (ch === '{') depth++; else if (ch === '}') depth--; low = Math.min(low, depth); }
      ok(depth === 0 && low === 0 && src.split('(').length === src.split(')').length, 'GLSL brackets balanced ' + name);
    }
    ok(/precision highp float;/.test(prog[1]), 'GLSL precision ' + name);
  }
  const used = new Set((RENDER.match(/\bu\.u_[A-Za-z]+/g) || []).map(s => s.slice(2)));
  for (const n of used) ok(new RegExp('\\b' + n + '\\b').test(all), 'uniform ' + n + ' exists in a shader');
  ok(['ripples(', 'puddle(', 'bolt(', 'ssr(', 'rainLayers(', 'lens(', 'fireRamp(', 'tonemap(', 'fogAmt(', 'carEnv(', 'coneK('].every(k => all.includes(k)), 'shader features');
  const unDrawn = city.brks.filter(r => !geo.brkVerts.has(r.p));
  ok(!unDrawn.length, 'every breakable is drawn into its chunk (' + unDrawn.length + ' missing)');
  const brkKinds = new Map();
  for (const r of city.brks) { const k = [r.kind, r.p.sign, r.p.tone, r.p.park, r.p.median, r.base ? 1 : 0].join('|'); if (!brkKinds.has(k)) brkKinds.set(k, r); }
  let rebuilt = 0;
  for (const r of brkKinds.values()) {
    const rec = geo.brkVerts.get(r.p), mb = N.Props.rebuild(geo, r.p, rec.y);
    const a = new Uint8Array(mb.buf, 0, mb.nv * 32), b = new Uint8Array(rec.ch.mb.buf, rec.v0 * 32, (rec.v1 - rec.v0) * 32);
    if (mb.nv === rec.v1 - rec.v0 && a.every((v, i) => v === b[i])) rebuilt++;
  }
  ok(rebuilt === brkKinds.size, 'a repaired prop is rebuilt vertex for vertex (' + rebuilt + ' of ' + brkKinds.size + ' variants)');
  const fake = (r, part, boxes, mesh) => ({ rec: r, part, mesh, key: N.Debris.shapeKey(r.p, part), sh: N.Debris.shapeOf(boxes) });
  for (const r of brkKinds.values()) {
    const whole = N.Props.debris(geo, fake(r, -1, N.BREAK[r.kind].whole(r.p), 'whole'));
    ok(whole.ni > 0 && !bad(whole), 'debris mesh ' + r.kind + (r.p.sign ? ' ' + r.p.sign : ''));
    const pcs = N.Debris.piecesOf(r);
    if (!pcs) continue;
    const meshes = pcs.map((pc, k) => N.Props.debris(geo, fake(r, k, pc.boxes, pc.mesh)));
    ok(meshes.every(m => m.ni > 0 && !bad(m)), r.kind + ': every piece has a mesh');
    if (pcs[0].mesh === 'clip') ok(meshes.reduce((n, m) => n + m.ni, 0) === whole.ni, r.kind + ': the pieces share out every triangle of the whole');
  }
  let lit = 0;
  for (const r of brkKinds.values()) { const m = N.Props.debris(geo, fake(r, -1, N.BREAK[r.kind].whole(r.p), 'whole')); for (let i = 0; i < m.nv; i++) if (m.u8[i * 32 + 29] === N.KIND.NIGHT) lit++; }
  ok(lit === 0, 'a knocked down lamp does not glow');
  let wireNodes = 0, wireOpen = 0, wireMax = 0;
  for (const n of city.nodes) {
    const curb = (e, dir) => { const ids = dir > 0 ? e.lanesF : e.lanesB; return ids.length ? city.lanes[ids[ids.length - 1]] : null; };
    const inc = [], out = [];
    for (const en of n.ends) { const e = city.edges[en.e]; if (!e.trolley || e.bridge && e.len > 200) continue; for (const dir of [1, -1]) { const l = curb(e, dir); if (l && l.to === n.id && !inc.includes(l)) inc.push(l); if (l && l.from === n.id && !out.includes(l)) out.push(l); } }
    if (new Set(inc.concat(out).map(l => l.edge)).size < 2) continue;
    wireNodes++;
    const links = N.wireLinks(inc, out);
    wireMax = Math.max(wireMax, links.length);
    if (inc.some(a => !links.some(k => k[0] === a)) || out.some(b => !links.some(k => k[1] === b))) wireOpen++;
    for (const [a, b] of links) { const c = N.wireCurve(a, b), m = c.length; if (Math.hypot(c[0] - a.x1, c[1] - a.z1) > 1e-6 || Math.hypot(c[m - 2] - b.x0, c[m - 1] - b.z0) > 1e-6) wireOpen++; }
  }
  ok(wireNodes > 100 && wireOpen === 0 && wireMax <= 16, 'trolleybus wires end at the junction edge and continue through it on curves (' + wireNodes + ' nodes, ' + wireOpen + ' loose, max ' + wireMax + ' links)');
  let swaying = 0;
  for (const r of brkKinds.values()) {
    if (!N.Props.PANELS.includes(r.kind)) continue;
    const m = N.Props.rebuild(geo, r.p, geo.brkVerts.get(r.p).y);
    for (let i = 0; i < m.nv; i++) if (m.u8[i * 32 + 29] === N.KIND.LEAF || m.u8[i * 32 + 29] === N.KIND.FARLEAF) swaying++;
  }
  ok(swaying === 0, 'fences and railings are not bent by the wind like leaves');
  const fl = geo.flora, FOL = N.KIND.FOLIAGE;
  ok(fl && fl.count.lod > 60000 && fl.count.static > 2500 && fl.count.near > 4000, 'vegetation is split into far LOD, static and near-only plants ' + JSON.stringify(fl.count));
  let farV = 0, farWant = 0, oldLeaf = 0;
  for (const c of geo.chunks) {
    if (c.fmb) { ok(!bad(c.fmb), 'far vegetation buffers valid ' + c.ix + ',' + c.iz); farV += c.fmb.nv; }
    for (const p of c.flora || []) { const m = fl.farMesh(p); if (m) farWant += m.nv; }
    if (c.mb) for (let i = 0; i < c.mb.nv; i++) if (c.mb.u8[i * 32 + 28] === N.TEX.leaves_linden && c.mb.u8[i * 32 + 29] === N.KIND.LEAF) oldLeaf++;
  }
  ok(farV === farWant && farV > 500000, 'every tree, bush and reed clump has its far LOD in its chunk (' + farV + ' vertices)');
  ok(oldLeaf === 0, 'the old crossed-plane trees are gone from the static chunks');
  const meshCheck = (m, what, maxV) => {
    let fol = 0, sw = 0, base = 0, aoBad = 0;
    for (let i = 0; i < m.nv; i++) {
      const b = i * 32;
      if (m.u8[b + 27] < 60) aoBad++;
      if (m.u8[b + 29] === FOL) { fol++; if (m.u8[b + 30] > 0) sw++; }
      else if (m.f[i * 8 + 1] < 0.1 && m.u8[b + 30] === 0) base++;
    }
    ok(!bad(m) && m.nv <= maxV && fol > 0 && sw > fol * 0.5 && aoBad === 0, what + ': valid mesh, ' + m.nv + ' vertices, leaves sway, trunk stays');
    return base;
  };
  for (const kind of Object.keys(N.FLORA_SPEC)) for (let v = 0; v < 4; v++) {
    const p = { type: 'tree', kind, x: v * 0.37, z: 0, s: 1 };
    while (fl.variant(p, 4) !== v) p.z += 0.1;
    ok(meshCheck(fl.nearMesh(p), 'tree ' + kind + ' #' + v, 420) > 0, 'tree ' + kind + ' #' + v + ' stands on its trunk');
    const fm = fl.farMesh(p);
    let dark = 0;
    for (let i = 0; i < fm.nv; i++) if (fm.u8[i * 32 + 27] < 60) dark++;
    ok(fm.nv <= 24 && !dark, 'far ' + kind + ' is a handful of lit quads');
  }
  for (const kind of Object.keys(N.FLORA_BUSH)) { meshCheck(fl.nearMesh({ type: 'bush', kind, x: 1, z: 1, s: 1 }), 'bush ' + kind, 260); ok(fl.farMesh({ type: 'bush', kind, x: 1, z: 1 }).nv === 8, 'far bush ' + kind); }
  const hedgeM = fl.nearMesh({ type: 'hedge', w: 1.9, h: 1, d: 0.8 });
  ok(!bad(hedgeM) && hedgeM.nv === 20, 'a hedge segment is a leafy box');
  for (const type of ['reeds', 'lily', 'weeds', 'tires', 'tirebed', 'swan', 'stump', 'log', 'boulder', 'rubble']) {
    const p = city.props.find(q => q.type === type);
    const m = p && fl.nearMesh(p);
    ok(m && m.ni > 0 && !bad(m), 'mesh for ' + type);
  }
  const ch0 = geo.chunks.filter(c => c.flora).sort((a, b) => b.flora.length - a.flora.length)[0];
  const once = fl.near(ch0), job = fl.nearJob(ch0);
  let steps = 0;
  while (!fl.nearStep(job, -1)) steps++;
  ok(once && !bad(once) && job.mb.nv === once.nv && steps > 3, 'near vegetation of the busiest chunk builds in ' + (steps + 1) + ' slices to the same mesh (' + once.nv + ' vertices)');
  ok(Object.keys(N.FLORA_DETAIL).join() === Object.keys(N.CITY_DETAIL).join() && Object.keys(N.FLORA_DETAIL).every(k => !N.CITY_DETAIL[k].r || (N.FLORA_DETAIL[k].near <= N.CITY_DETAIL[k].r && N.FLORA_DETAIL[k].grass < N.FLORA_DETAIL[k].near)), 'vegetation radii follow «Детализация города»');
  const hd = city.places.hotel_door, gx = Math.floor(hd.x / fl.G), gz = Math.floor(hd.z / fl.G);
  let tufts = 0, tuftBad = 0, fadeBad = 0, tiles = 0, gms = 0;
  for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
    const t0 = Date.now(), m = fl.grass(gx + dx, gz + dz, 70);
    gms = Math.max(gms, Date.now() - t0);
    if (!m) continue;
    tiles++;
    ok(!bad(m), 'grass tile ' + dx + ',' + dz);
    for (let i = 0; i < m.nv; i += 4) {
      const b = i * 32, x = (m.f[i * 8] + m.f[i * 8 + 8]) / 2, z = (m.f[i * 8 + 2] + m.f[i * 8 + 10]) / 2;
      if (m.u8[b + 31] !== 35) fadeBad++;
      tufts++;
      if (city.surfaceAt(x, z) === 0 || inBuilding(x, z)) tuftBad++;
    }
  }
  ok(tiles > 10 && tufts > 3000 && fadeBad === 0, 'grass tufts round the hotel fade out at the grass radius (' + tufts + ' quads in ' + tiles + ' tiles)');
  ok(tuftBad < tufts * 0.002, 'grass does not grow on roads or inside houses (' + tuftBad + ')');
  ok(gms < 60, 'a grass tile builds quickly (' + gms + ' ms worst, cold)');
  const glsl = N.GLSL.world.join('\n');
  ok(/u_push\[4\]/.test(glsl) && /k - 19\.0/.test(glsl) && /bool fol = k == 19/.test(glsl), 'foliage sways, bends away from the player and cars, and fades by distance in the world shader');
});

const shore = (() => {
  const BL = city.bankL;
  for (let i = 0; i < BL.length / 2 - 1; i++) {
    const ax = BL[i * 2], az = BL[i * 2 + 1], bx = BL[i * 2 + 2], bz = BL[i * 2 + 3];
    const mx = (ax + bx) / 2, mz = (az + bz) / 2, L = Math.hypot(bx - ax, bz - az);
    if (L < 3 || !city.inPlay(mx, mz)) continue;
    let nx = -(bz - az) / L, nz = (bx - ax) / L;
    if (!city.inWater(mx + nx * 5, mz + nz * 5)) { nx = -nx; nz = -nz; }
    let busy = false;
    city.hash.query(mx - 14, mz - 14, mx + 14, mz + 14, () => { busy = true; return true; });
    if (busy || city.ground(mx - nx * 4, mz - nz * 4) === GT.WATER) continue;
    let deep = true;
    for (let d = 10; d <= 22; d += 3) { const q = city.waterAt(mx + nx * d, mz + nz * d); if (!q || q.level - q.bed < 2) deep = false; }
    if (deep) return { x: mx, z: mz, nx, nz, yaw: N.yawOf(nx, nz) };
  }
  return null;
})();

function waterGame(god) {
  const g = new N.Game(city, { settings: { ambient: false }, headless: true, state: Object.assign(N.Game.newState(), { done: { m1: true } }) });
  const w = g.world, pl = w.player;
  w.settings.ambient = false;
  for (const p of w.peds.slice()) if (p !== pl) w.removePed(p);
  w.god = !!god;
  return { g, w, pl };
}

section('district landmarks', () => {
  const near = (x, z, r, f) => city.props.filter(p => Math.hypot(p.x - x, p.z - z) < r && (!f || f(p)));
  const sign = (t, st) => city.signs.find(s => s.text === t && (!st || s.style === st));
  const dk = city.dkB, mir = city.mirB, um = city.uniB, rad = city.radiusB;
  ok(dk && dk.lm.type === 'dk' && dk.name === 'Дворец культуры ГАЗ' && dk.h > 15, 'ДК ГАЗ is a landmark model');
  ok(mir && mir.lm.type === 'mir' && mir.lm.galleries.length === 1 && mir.lm.galleries[0].us.length >= 8, 'кинотеатр «Мир» has its pier gallery');
  const mw = city.wall(mir, mir.lm.front), mg = city.wall(mir, mir.lm.galleries[0].i);
  const toSquare = (w, x, z) => { const dx = x - w.mx, dz = z - w.mz, d = Math.hypot(dx, dz); return (dx * w.nx + dz * w.nz) / d; };
  ok(toSquare(mw, 100, -117) > 0.95 && mw.nx * mg.nx + mw.nz * mg.nz > 0.99 && (mw.mx - mg.mx) * mw.nx + (mw.mz - mg.mz) * mw.nz > 4, 'the «Мир» portal and its gallery both face площадь Киселёва, the entrance block stands forward of the hall');
  const cin = city.places.cinema;
  ok(cin && !inBuilding(cin.x, cin.z) && Math.abs((cin.x - mw.mx) * mw.nx + (cin.z - mw.mz) * mw.nz - 7) < 0.2 && Math.abs((cin.x - mw.mx) * mw.ux + (cin.z - mw.mz) * mw.uz) < 0.2, 'the cinema place stands in front of the portal');
  const mStep = city.ramps.find(r => r.stair && Math.hypot(r.cx - mw.mx, r.cz - mw.mz) < 5);
  const door = city.at(mw, 0, 0.4);
  ok(mStep && Math.abs(city.groundY(door[0], door[1]) - 0.45) < 0.01 && Math.abs(city.groundY(mStep.cx - mStep.fx * 0.5, mStep.cz - mStep.fz * 0.5) - 0.13) < 0.06, 'three granite steps rise to the cinema doors');
  ok(near(cin.x, cin.z, 30, p => p.type === 'globelamp').length >= 2 && city.marks.length >= 8 && city.parking.some(q => Math.hypot(q.x - mg.mx, q.z - mg.mz) < 30), 'globe lamps, a marked car park and parked cars along the gallery');
  ok(um && um.lm.drum && um.lm.drum.r > 10 && um.lm.drum.r < 30, 'the универмаг drum is found on the rounded corner (r ' + (um && um.lm.drum ? um.lm.drum.r.toFixed(1) : '-') + ' m)');
  ok(rad && rad.lm.type === 'radius' && rad.lm.front.length >= 5, 'Радиусный дом faces Молодёжный проспект with its curved front');
  ok([dk, mir, um, rad].every(b => !city.props.some(p => p.type === 'podezd' && p.b === b.id)), 'public buildings have no podezd doors');
  const letters = city.signs.filter(s => s.style === 'boxletter').map(s => s.text).join('');
  ok(letters === 'УНИВЕРМАГ' || letters.split('').reverse().join('') === 'УНИВЕРМАГ', 'box letters spell УНИВЕРМАГ on the drum');
  const dr = um.lm.drum, lts = city.signs.filter(s => s.style === 'boxletter');
  ok(lts.length === 9 && lts.every(s => Math.abs(Math.hypot(s.x - dr.cx, s.z - dr.cz) - (dr.r - 0.25)) < 0.05 && Math.abs(s.y - s.h / 2 - 17.28) < 0.06), 'the УНИВЕРМАГ letters stand on the attic of the drum, not in the air');
  const umProps = near(dr.cx, dr.cz, dr.r + 30, p => ['kiosk', 'tent', 'globelamp'].includes(p.type));
  ok(umProps.filter(p => p.type === 'kiosk').length >= 4 && umProps.filter(p => p.type === 'globelamp').length >= 6 && umProps.every(p => city.surfaceAt(p.x, p.z) !== 0 && !inBuilding(p.x, p.z)), 'kiosks, stalls and globe lamps stand on the univermag square, off the carriageway');
  let paved = 0;
  for (let k = 0; k < 9; k++) { const a = dr.a0 + dr.span * k / 8, rr = dr.r + 3 + (k % 3) * 8, x = dr.cx + Math.cos(a) * rr, z = dr.cz + Math.sin(a) * rr; if (city.ground(x, z) === GT.PLAZA || city.surfaceAt(x, z) === 0) paved++; }
  ok(paved === 9, 'the square in front of the drum is paved up to 19 m out');
  ok(sign('ДВОРЕЦ КУЛЬТУРЫ АВТОЗАВОДА', 'relief') && sign('МИР', 'relief') && sign('КУЛЬТУРЫ И ОТДЫХА', 'paint') && sign('АВТОМОБИЛЬНЫЙ ЗАВОД', 'relief'), 'frieze and gate lettering');
  const cols = city.circles.filter(c => c.kind === 'column' && Math.hypot(c.x - dk.cx, c.z - dk.cz) < 60);
  ok(cols.length >= 8, 'the ДК portico columns are solid (' + cols.length + ')');
  const st = city.ramps.find(r => r.stair && Math.hypot(r.cx - dk.cx, r.cz - dk.cz) < 60);
  ok(st && Math.abs(city.groundY(st.cx + st.fx * st.l * 0.45, st.cz + st.fz * st.l * 0.45) - 0.9) < 0.2, 'the ДК stairs rise to the portico');
  const q = city.places.dk;
  ok(q && city.inPlay(q.x, q.z) && !inBuilding(q.x, q.z), 'the ДК place stands on the square');
  const k = city.kiselev;
  ok(k && k.beds.length >= 8 && city.ground(k.cx, k.cz) === GT.PLAZA, 'площадь Киселёва: radial beds around a paved hub');
  const spruces = near(k.cx, k.cz, 90, p => p.type === 'tree' && p.kind === 'spruce' && N.pointInPoly(k.poly, p.x, p.z));
  ok(spruces.length > 60 && spruces.every(p => !k.beds.every(b => !N.pointInPoly(b.poly, p.x, p.z))), 'blue spruces grow only in the beds (' + spruces.length + ')');
  ok(!city.foot.some(f => { for (let i = 0; i < f.pts.length; i += 2) if (N.pointInPoly(k.poly, f.pts[i], f.pts[i + 1])) return true; return false; }), 'old footpaths do not cross the square');
  const gate = city.parkGate;
  ok(gate && near(gate.x, gate.z, 2, p => p.type === 'parkgate').length === 1 && city.places.park_gate, 'the park gate arch stands on the park border');
  const pass = (x, z) => { let hit = false; city.hash.query(x - 0.6, z - 0.6, x + 0.6, z + 0.6, b => { if (b.kind === 'prop' && b.poly && N.circlePoly(x, z, 0.4, b.poly)) { hit = true; return true; } }); return hit; };
  const ux = -gate.nz, uz = gate.nx;
  ok(!pass(gate.x, gate.z) && !pass(gate.x + ux * 6.9, gate.z + uz * 6.9) && pass(gate.x + ux * 3.4, gate.z + uz * 3.4), 'people walk through the arches, not the pillars');
  ok(near(city.places.park_fountain.x, city.places.park_fountain.z, 15, p => p.type === 'fountain').length === 1, 'the park fountain');
  const cross = (ax, az, bx, bz, cx, cz, dx, dz) => { const d = (bx - ax) * (dz - cz) - (bz - az) * (dx - cx); if (Math.abs(d) < 1e-9) return false; const t = ((cx - ax) * (dz - cz) - (cz - az) * (dx - cx)) / d, s = ((cx - ax) * (bz - az) - (cz - az) * (bx - ax)) / d; return t >= 0 && t <= 1 && s >= 0 && s <= 1; };
  const archBlocked = [-12.3, -6.55, 0, 6.55, 12.3].some(u => {
    const ax = gate.x + ux * u + gate.nx * 2.5, az = gate.z + uz * u + gate.nz * 2.5, bx = gate.x + ux * u - gate.nx * 2.5, bz = gate.z + uz * u - gate.nz * 2.5;
    return city.fenceSegs.some(f => cross(ax, az, bx, bz, f.ax, f.az, f.bx, f.bz)) || pass(gate.x + ux * u, gate.z + uz * u);
  });
  ok(!archBlocked, 'no park fence runs across the arches of the gate');
  const gz = city.gazGate;
  ok(gz && near(gz.x, gz.z, 2, p => p.type === 'gazportal').length === 1 && city.signs.filter(s => s.style === 'gazlogo').length >= 3, 'the GAZ main gate with the deer emblem');
  const gateAt = (u, v) => [gz.x - gz.nz * u + gz.nx * v, gz.z + gz.nx * u + gz.nz * v];
  const gateBlocked = [];
  for (const u of [-7.7, 0, 7.7]) for (let v = 3; v > -gz.d - 4; v -= 0.5) { const [x, z] = gateAt(u, v); let hit = false; city.hash.query(x - 0.4, z - 0.4, x + 0.4, z + 0.4, it => { if (it.brk) return; if (it.circle ? Math.hypot(it.x - x, it.z - z) < it.r + 0.4 : it.poly ? N.pointInPoly(it.poly, x, z) || !!N.circlePoly(x, z, 0.4, it.poly) : x > it.x0 - 0.4 && x < it.x1 + 0.4 && z > it.z0 - 0.4 && z < it.z1 + 0.4) { hit = true; return true; } }); if (hit) gateBlocked.push(u + '/' + v); }
  ok(!gateBlocked.length, 'the GAZ gate passages are open all the way into the yard (' + gateBlocked.slice(0, 4).join(' ') + ')');
  const gateText = city.signs.filter(s => s.style === 'relief' && /АВТОМОБИЛЬНЫЙ|ОСНОВАН/.test(s.text) && Math.hypot(s.x - gz.x, s.z - gz.z) < gz.d + 2);
  ok(gateText.length === 3 && gateText.every(s => s.y - s.h / 2 >= 9.2 && s.y + s.h / 2 <= 11.6), 'the gate lettering sits on the lintel, not in the air under it');
  const crest = city.signs.filter(s => s.style === 'gazlogo' && Math.hypot(s.x - gz.x, s.z - gz.z) < gz.d + 2);
  ok(crest.length === 2 && crest.every(s => Math.abs(((s.x - gz.x) * gz.nx + (s.z - gz.z) * gz.nz) - (s.nx * gz.nx + s.nz * gz.nz > 0 ? 0.04 : -N.GAZ_CREST.d - 0.04)) < 0.01), 'the deer crest is mounted on its slab at the front of the attic');
  ok(city.signs.filter(s => s.style === 'mosaic').length === 2, 'two mosaic panels flank the gate square');
  const gp = city.places.gaz_gate, gy = city.places.gaz_yard;
  ok(!N.pointInPoly(city.gaz, gp.x, gp.z) || city.zoneAt(gp.x, gp.z) === 'Главная проходная ГАЗ', 'the gate place is on the town side');
  ok(!inBuilding(gp.x, gp.z) && !inBuilding(gy.x, gy.z), 'gate places are free');
  const gu = -gz.nz, gw = gz.nx, gpt = (u, v) => [gz.x + gu * u + gz.nx * v, gz.z + gw * u + gz.nz * v];
  let gateClear = true;
  for (let v = 4; v >= -gz.d - 4; v -= 0.5) for (const u of [-1.5, 0, 1.5, -7.7, 7.7]) { const q = gpt(u, v); if (inBuilding(q[0], q[1])) gateClear = false; }
  ok(gz.d > 12 && gateClear, 'the three passages of the GAZ gate lead through the заводоуправление into the yard (' + gz.d.toFixed(1) + ' m deep)');
  const wl = gpt(-15, -gz.d / 2), wr = gpt(15, -gz.d / 2);
  ok(city.gazWing && city.gazWing.lm.type === 'gazadmin' && inBuilding(wl[0], wl[1]) && inBuilding(wr[0], wr[1]) && gz.back > 5, 'the gate stands in the line of the заводоуправление and its wings close up to the pylons');
  const adm = city.buildings.find(b => b.lm && b.lm.type === 'gazadmin');
  ok(adm && adm.lm.tower && city.boxes.some(b => b.ref === adm.id && b.y1 > 40), 'заводоуправление with its tower');
  const lenins = city.props.filter(p => p.type === 'monument' && p.kind === 'lenin');
  ok(lenins.length >= 2, 'Lenin statues in front of the gate and the administration');
  const canopies = city.props.filter(p => p.type === 'canopy' || p.type === 'porch');
  ok(canopies.length >= 6 && canopies.every(p => { const fx = Math.sin(p.rot), fz = -Math.cos(p.rot); return !inBuilding(p.x + fx * 1.2, p.z + fz * 1.2) && inBuilding(p.x - fx * 0.8, p.z - fz * 0.8); }), 'entrance canopies and the hotel porch stick out of their walls (' + canopies.length + ')');
  const hb = city.hotelB, hw = city.wallToward(hb, 94, -262, 8), hd = city.at(hw, 0, 0.9);
  ok(Math.abs(city.groundY(hd[0], hd[1]) - 0.45) < 0.01 && near(hd[0], hd[1], 4, p => p.type === 'porch').length === 1, 'the hotel entrance has a porch with steps up to the doors');
  let hp = 0;
  for (let u = -20; u <= 20; u += 5) { const q = city.at(hw, u, 11.5); if (city.ground(q[0], q[1]) === GT.PLAZA || city.surfaceAt(q[0], q[1]) === 0) hp++; }
  ok(hp === 9, 'a paved drive runs along the hotel front');
  const fronts = city.buildings.filter(b => b.shopSegs);
  ok(fronts.length > 40 && fronts.every(b => b.shopSegs.every(s => s.s1 > s.s0 && s.name)), 'ground-floor shops on main streets (' + fronts.length + ' houses)');
  ok(city.spans.length > 80, 'trolleybus span wires (' + city.spans.length + ')');
  ok(city.tramPoles.length > 100 && city.tramPoles.every(p => city.circles.some(c => c.kind === 'pole' && Math.abs(c.x - p.x) < 0.01 && Math.abs(c.z - p.z) < 0.01)), 'tram catenary poles are solid (' + city.tramPoles.length + ')');
  ok(city.tramPoles.every(p => city.surfaceAt(p.x, p.z) !== 0), 'no catenary pole on a carriageway');
  ok(N.defaultSettings().city === 'high' && N.CITY_DETAIL.high.r > N.CITY_DETAIL.mid.r && N.CITY_DETAIL.low.r === 0, 'city detail presets');
});

section('vehicle drawing cost', () => {
  const same = (a, b) => { if (a.nv !== b.nv || a.ni !== b.ni) return false; for (let i = 0; i < a.nv * 32; i++) if (a.u8[i] !== b.u8[i]) return false; for (let i = 0; i < a.ni; i++) if (a.idx[i] !== b.idx[i]) return false; return true; };
  const M = N.M3.euler(0.1, -0.7, 0.05, 12, 0.3, -40), lamp = [2.6, 1.3, 3, 0.4, 0, 2.2, 2, 0, 1.6, 0.9];
  const cases = [['vaz2107', 'militia', [200, 30, 30], 1, [0.8, 0.5, 0.3]], ['merc600', null, [20, 20, 22], 0.6, [0.9, 0.3, 0.75]], ['t72', 'army', null, 1, null], ['gaz53', null, [40, 90, 40], 0.35, [0, 1, 0]]];
  let ok1 = true;
  for (const [id, liv, paint, dim, look] of cases) {
    const m = N.Models.car(id, liv, 0);
    for (const src of [m.mb, m.gl, m.wheel]) {
      const a = new N.Dyn(20000), b = new N.Dyn(20000);
      a.add(src, M, paint, null, null, lamp, dim, look);
      b.addRig(src, M, paint, null, null, lamp, dim, look);
      a.add(src, M, null, null, null, null, 1, null);
      b.addRig(src, M, null, null, null, null, 1, null);
      if (!same(a, b)) ok1 = false;
    }
  }
  ok(ok1, 'the fast vertex path writes exactly what the general one does');
  const wheels = N.VEHICLE_IDS.filter(id => N.VEHICLES[id].type !== 'bike').map(id => [0, 1, 2].map(l => N.Models.car(id, null, l)));
  ok(wheels.every(ms => ms[2].wheel.nv <= 60 && ms[1].wheel.nv <= 170 && ms[2].wheel.nv < ms[1].wheel.nv && ms[1].wheel.nv < ms[0].wheel.nv), 'far wheels under 60 vertices, middle ones under 170');
  ok(wheels.every(ms => ms[2].wheelsMb && ms[2].wheelsMb.nv === ms[2].wheels.reduce((a, w) => a + (w.kind ? ms[2].wheelKinds[w.kind] : ms[2].wheel).nv, 0) && !ms[1].wheelsMb && !ms[0].wheelsMb), 'far cars draw all their wheels as one baked mesh');
  const t2 = N.Models.car('t72', 'army', 2), xs = new Set();
  for (let i = 0; i < t2.wheelsMb.nv; i++) xs.add(Math.sign(t2.wheelsMb.f[i * 8]));
  ok(xs.has(1) && xs.has(-1) && t2.wheelsMb.nv < 1000, 'the far tank keeps road wheels on both sides in under 1000 vertices');
  ok(Object.keys(N.CAR_DETAIL).join() === 'high,mid,low' && N.defaultSettings().cars === 'high' && N.CAR_DETAIL.high.near === N.LOD_NEAR && N.CAR_DETAIL.high.mid === N.LOD_MID, 'car detail presets, high by default');
  const H = N.CAR_DETAIL.high, L = N.CAR_DETAIL.low;
  ok(N.carLod(20, false, H) === 0 && N.carLod(20, false, L) === 1 && N.carLod(40, false, L) === 2 && N.carLod(200, true, L) === 0 && !L.inside && L.cones < H.cones, 'low detail moves the detail steps closer but keeps the player car near');
  const ui = { settings: N.defaultSettings(), applied: 0, applySettings() { this.applied++; } };
  const menus = Object.create(N.Menus.prototype);
  menus.ui = ui;
  menus.refreshSettings = () => {};
  const item = menus.settingItems().find(it => it.label === 'Детализация машин');
  ok(item && item.note === 'высокая', 'the settings menu offers the car detail');
  item.fn();
  ok(ui.settings.cars === 'mid' && ui.applied === 1, 'it steps to medium');
  item.adj(-1);
  item.adj(-1);
  ok(ui.settings.cars === 'low', 'and wraps around to low');
  const pm = Object.create(N.Menus.prototype);
  const pui = { settings: N.defaultSettings(), applySettings() { }, audio: { on: false } };
  Object.assign(pm, { ui: pui, el: { querySelectorAll: () => [] }, active: 'pause', tab: 'settings', srow: -1, sel: 4, items: [{ id: 'resume' }, { id: 'map' }, { id: 'brief' }, { id: 'stats' }, { id: 'settings' }] });
  pm.sItems = pm.settingItems();
  const sfx0 = pui.settings.sfx;
  ok(!pm.settingsKey('ArrowDown') && pm.srow === -1, 'pause settings: ↑↓ still walk the tabs until the rows are entered');
  ok(pm.settingsKey('ArrowRight') && pm.srow === 0 && pui.settings.sfx === sfx0, '→ on the settings tab moves into the rows');
  pm.settingsKey('ArrowRight');
  ok(Math.abs(pui.settings.sfx - Math.min(1, sfx0 + 0.1)) < 1e-9, '→ on a row raises the value');
  const radio0 = pui.settings.radio;
  pm.settingsKey('ArrowDown'); pm.settingsKey('ArrowLeft');
  ok(pm.srow === 1 && Math.abs(pui.settings.radio - Math.max(0, radio0 - 0.1)) < 1e-9, '↓ picks the next row and ← lowers it');
  ok(pm.settingsKey('Escape') && pm.srow === -1, 'Esc returns to the tabs');
});

section('water', () => {
  ok(shore, 'a free stretch of the Oka bank');
  const at = d => city.waterAt(shore.x + shore.nx * d, shore.z + shore.nz * d);
  ok(at(0.5) && at(0.5).level === N.WATER_Y && at(0.5).bed > N.WATER_Y, 'the bank slope starts dry');
  ok(at(5).bed < N.WATER_Y && N.WATER_Y - at(5).bed < 1.2, 'five metres out the water is waist deep');
  ok(N.WATER_Y - at(12).bed > 2.5, 'twelve metres out the river is too deep to stand');
  for (const d of [1, 3, 5, 8]) ok(Math.abs(city.groundY(shore.x + shore.nx * d, shore.z + shore.nz * d) - at(d).bed) < 1e-6, 'the river bed is the ground at ' + d + ' m');
  const pond = city.land.find(l => l.k === 'w' && city.inPlay(l.box.x0, l.box.z0) && l.area > 3000);
  let pin = null;
  for (let k = 0; k < 400 && pond && !pin; k++) { const x = N.lerp(pond.box.x0, pond.box.x1, N.hash2(k, 1, 2)), z = N.lerp(pond.box.z0, pond.box.z1, N.hash2(k, 2, 3)); const q = city.waterAt(x, z); if (q && q.pond && q.d > 4) pin = q; }
  ok(pin && pin.level === 0 && pin.bed < -1.5, 'ponds have a surface at ground level and a bed below it');
  const run = (god, secs, input) => {
    const s = waterGame(god);
    const { g, w, pl } = s;
    pl.x = shore.x - shore.nx * 2; pl.z = shore.z - shore.nz * 2; pl.y = city.groundY(pl.x, pl.z);
    pl.yaw = shore.yaw;
    const log = { maxWade: 0, wadeSpeed: 9, swim: -1, under: -1, dead: -1, ev: new Set(), help: [], minY: 9, drown: false };
    for (let i = 0; i < secs * 60; i++) {
      g.step(1 / 60, input(i / 60, pl));
      for (const e of w.ev) log.ev.add(e.t);
      w.ev.length = 0;
      if (g.msg.help && !log.help.includes(g.msg.help.text)) log.help.push(g.msg.help.text);
      log.maxWade = Math.max(log.maxWade, pl.wade || 0);
      if (pl.wade > 0.6 && !pl.swim) log.wadeSpeed = Math.min(log.wadeSpeed, Math.hypot(pl.vx, pl.vz));
      if (pl.swim && log.swim < 0) log.swim = i / 60;
      if (pl.swim && pl.swim.under && log.under < 0) log.under = i / 60;
      if (pl.dead && log.dead < 0) log.dead = i / 60;
      if (g.death && g.death.drown) log.drown = true;
      if (pl.dead) log.minY = Math.min(log.minY, pl.y);
    }
    return Object.assign(s, { log });
  };
  const walkIn = run(false, 10, () => ({ fwd: 1, camYaw: shore.yaw }));
  const L = walkIn.log;
  ok(L.maxWade > 1 && L.wadeSpeed < 2.5, 'wading slows Tyoma down to ' + L.wadeSpeed.toFixed(2) + ' m/s');
  ok(L.swim > 0 && L.under > L.swim + 2.5 && L.dead > L.under, 'out of his depth he struggles ' + (L.under - L.swim).toFixed(1) + ' s, goes under and drowns');
  ok(walkIn.pl.anim.deathKind === 'drown' && L.drown, 'the death is a drowning');
  ok(['wade', 'drowning', 'gulp', 'wasted'].every(t => L.ev.has(t)), 'water events: wade, drowning, gulp, wasted');
  ok(L.help.includes(N.HELP.water) && L.help.includes(N.HELP.drown), 'help explains that Tyoma cannot swim');
  ok(L.minY < N.WATER_Y - 1.5, 'the body sinks');
  const god = run(true, 10, () => ({ fwd: 1, camYaw: shore.yaw }));
  ok(god.log.dead > 0 && god.pl.anim.deathKind === 'drown', 'god mode does not teach him to swim');
  const back = run(false, 10, (t, pl) => ({ fwd: pl.swim ? -1 : t < 3 ? 1 : 0, camYaw: shore.yaw }));
  ok(back.log.swim > 0 && !back.pl.dead && !back.pl.swim && back.pl.onGround, 'paddling back to the shallows saves him');
  const jumpy = waterGame();
  jumpy.pl.x = shore.x + shore.nx * 5.6; jumpy.pl.z = shore.z + shore.nz * 5.6; jumpy.pl.y = city.groundY(jumpy.pl.x, jumpy.pl.z);
  for (let i = 0; i < 10; i++) { jumpy.g.step(1 / 60, {}); jumpy.w.ev.length = 0; }
  jumpy.g.step(1 / 60, { jump: true });
  ok(jumpy.pl.wade > 0.4 && jumpy.pl.vy <= 0, 'no jumping in waist-deep water');
  const npc = waterGame();
  const q = npc.w.spawnPed('worker', shore.x - shore.nx * 1, shore.z - shore.nz * 1, shore.yaw);
  q.ai = { mode: 'goto', x: shore.x + shore.nx * 20, z: shore.z + shore.nz * 20, run: true };
  let maxDeep = 0;
  for (let i = 0; i < 600; i++) { npc.g.step(1 / 60, {}); npc.w.ev.length = 0; maxDeep = Math.max(maxDeep, q.deepAt || 0); }
  ok(!q.dead && maxDeep <= 0.8, 'pedestrians stop at the water edge (' + maxDeep.toFixed(2) + ' m)');
  const r = npc.w.spawnPed('worker', shore.x + shore.nx * 2, shore.z + shore.nz * 2, shore.yaw);
  npc.w.knockDown(r, 1.5, shore.nx * 14, shore.nz * 14, 3);
  let splash = false;
  for (let i = 0; i < 600 && !r.dead; i++) { npc.g.step(1 / 60, {}); for (const e of npc.w.ev) if (e.t === 'splash' && e.p === r) splash = true; npc.w.ev.length = 0; }
  ok(r.dead && r.anim.deathKind === 'drown' && splash, 'a pedestrian thrown into the river splashes in and drowns');
  const car = waterGame();
  const v = car.w.spawnVehicle('vaz2106', shore.x - shore.nx * 3, shore.z - shore.nz * 3, shore.yaw);
  car.w.seat(car.pl, v, true);
  let ejected = -1;
  for (let i = 0; i < 60 * 14 && !car.pl.dead; i++) { car.g.step(1 / 60, { fwd: i < 150 ? 1 : 0 }); car.w.ev.length = 0; if (ejected < 0 && !car.pl.veh) ejected = i / 60; }
  ok(v.sink > 0 && ejected > 0 && car.pl.dead && car.pl.anim.deathKind === 'drown', 'a car driven into the Oka sinks and the driver drowns');
  ok(v.y >= city.waterAt(v.x, v.z).bed - 1e-6, 'the wreck rests on the river bed');
  const gr = waterGame();
  gr.pl.x = shore.x; gr.pl.z = shore.z; gr.pl.y = city.groundY(shore.x, shore.z); gr.pl.yaw = shore.yaw;
  gr.w.giveWeapon(gr.pl, 'grenade', 2);
  const evs = [];
  gr.w.throwGrenade(gr.pl, { aimD: [shore.nx, 0.2, shore.nz] }, 1);
  for (let i = 0; i < 180; i++) { gr.g.step(1 / 60, {}); for (const e of gr.w.ev) evs.push(e.t); gr.w.ev.length = 0; }
  ok(evs.includes('splash') && evs.includes('explosion'), 'a grenade splashes into the river');
  for (let i = 0; i < 300 && walkIn.g.death; i++) { walkIn.g.step(1 / 60, {}); walkIn.w.ev.length = 0; }
  ok(!walkIn.pl.swim && !walkIn.pl.wade && !walkIn.pl.dead && /выловили/.test(walkIn.g.msg.help.text), 'respawn after drowning: dry, alive, "выловили из воды"');
});

function carGame() {
  const g = new N.Game(city, { settings: { ambient: false }, headless: true, state: Object.assign(N.Game.newState(), { done: { m1: true } }) });
  const w = g.world, pl = w.player;
  w.settings.ambient = false;
  for (const p of w.peds.slice()) if (p !== pl) w.removePed(p);
  for (const v of w.vehs.slice()) w.removeVehicle(v);
  pl.x = straight.x; pl.z = straight.z; pl.y = city.groundY(pl.x, pl.z); pl.yaw = straight.yaw;
  return { g, w, pl };
}

section('cars: lamps in play', () => {
  const { g, w, pl } = carGame();
  const v = w.spawnVehicle('vaz2107', pl.x, pl.z, pl.yaw);
  w.seat(pl, v, true);
  for (let i = 0; i < 30; i++) { g.step(1 / 60, { fwd: -1 }); w.ev.length = 0; }
  ok(v.rev && v.spd < -0.3, 'reverse lamps light when backing up');
  for (let i = 0; i < 90; i++) { g.step(1 / 60, { fwd: 1 }); w.ev.length = 0; }
  ok(!v.rev && v.spd > 0.5, 'reverse lamps go out when driving forward');
});

section('cars: doors, entering, carjacking', () => {
  for (const id of N.VEHICLE_IDS) {
    const cb = N.cabin(N.VEHICLES[id]);
    if (cb.bike) { ok(!cb.door && cb.bars, 'bike ' + id + ' has handlebars'); continue; }
    const L = N.VEHICLES[id].shape.L;
    ok(cb.door.z0 > -L / 2 && cb.door.z1 < L / 2 && cb.door.len > 0.4 && cb.seat.z > cb.door.z0 - 0.05 && cb.seat.z < cb.door.z1 + 0.3, 'the door of ' + id + ' opens beside the seat');
    const root = N.seatRoot(cb, 1.06);
    ok(root + (1.86 - 0.12) * 1.06 < cb.H + 0.05, 'a tall driver fits under the roof of ' + id);
  }
  const { g, w, pl } = carGame();
  const fx = Math.sin(pl.yaw), fz = -Math.cos(pl.yaw), rx = -fz, rz = fx;
  const car = w.spawnVehicle('vaz2106', pl.x + rx * 3.5, pl.z + rz * 3.5, pl.yaw);
  const ev = [];
  let maxDoor = 0, phases = new Set();
  ok(w.tryEnter(pl) && pl.enter && pl.enter.ph === 'go' && !pl.veh, 'F starts walking to the door');
  for (let i = 0; i < 360 && !pl.veh; i++) { g.step(1 / 60, {}); for (const e of w.ev) ev.push(e); w.ev.length = 0; maxDoor = Math.max(maxDoor, car.door[0], car.door[1]); if (pl.enter) phases.add(pl.enter.ph); }
  ok(pl.veh === car && car.driver === pl && !pl.enter, 'Tyoma is in the driver seat');
  ok(['go', 'open', 'in'].every(p => phases.has(p)) && maxDoor > 0.9, 'walk, open the door, get in');
  for (let i = 0; i < 60; i++) { g.step(1 / 60, {}); for (const e of w.ev) ev.push(e); w.ev.length = 0; }
  ok(car.door[0] === 0 && car.door[1] === 0, 'the door is closed behind him');
  ok(ev.filter(e => e.t === 'door' && e.open).length >= 1 && ev.filter(e => e.t === 'door' && !e.open).length >= 1 && ev.filter(e => e.t === 'enter').length === 1, 'door open and slam, one enter event');
  g.step(1 / 60, { enter: true });
  ok(pl.exit && !pl.veh && car.driver === null, 'F at a standstill climbs out');
  const xph = new Set();
  for (let i = 0; i < 180 && pl.exit; i++) { xph.add(pl.exit.ph); g.step(1 / 60, {}); w.ev.length = 0; }
  for (let i = 0; i < 40; i++) { g.step(1 / 60, {}); w.ev.length = 0; }
  const dp = w.doorPos(car, -1);
  ok(!pl.exit && ['open', 'out', 'close'].every(p => xph.has(p)) && Math.hypot(pl.x - dp.x, pl.z - dp.z) < 0.6 && car.door[0] === 0 && pl.anim.sit === 0, 'out of the door, standing, door shut');
  const right = carGame();
  const car2 = right.w.spawnVehicle('volga3110', right.pl.x + Math.cos(right.pl.yaw) * -3.5, right.pl.z + Math.sin(right.pl.yaw) * -3.5, right.pl.yaw);
  right.w.tryEnter(right.pl);
  const ph2 = new Set();
  for (let i = 0; i < 400 && !right.pl.veh; i++) { if (right.pl.enter) ph2.add(right.pl.enter.ph + right.pl.enter.side); right.g.step(1 / 60, {}); right.w.ev.length = 0; }
  ok(right.pl.veh === car2 && car2.driver === right.pl && ph2.has('slide1'), 'from the passenger door he slides over to the wheel');
  const jack = carGame();
  const car3 = jack.w.spawnVehicle('vaz2107', jack.pl.x + rx * 3.5, jack.pl.z + rz * 3.5, jack.pl.yaw);
  const d = jack.w.spawnPed('worker', car3.x, car3.z, car3.yaw);
  jack.w.seat(d, car3, true);
  const stolen = jack.w.stats.carsStolen;
  jack.w.tryEnter(jack.pl);
  let jacked = false, seen = new Set();
  for (let i = 0; i < 400 && !jack.pl.veh; i++) { if (jack.pl.enter) seen.add(jack.pl.enter.ph); jack.g.step(1 / 60, {}); for (const e of jack.w.ev) if (e.t === 'carjack') jacked = true; jack.w.ev.length = 0; }
  ok(seen.has('jack') && jacked && jack.pl.veh === car3 && d.veh === null && car3.driver === jack.pl && jack.w.stats.carsStolen === stolen + 1, 'carjack: the driver is pulled out, Tyoma takes the wheel');
  const lock = carGame();
  const car4 = lock.w.spawnVehicle('volga3102', lock.pl.x + rx * 3.5, lock.pl.z + rz * 3.5, lock.pl.yaw, { locked: true });
  lock.w.tryEnter(lock.pl);
  let msg = false, maxD = 0;
  for (let i = 0; i < 300 && lock.pl.enter; i++) { lock.g.step(1 / 60, {}); for (const e of lock.w.ev) if (e.t === 'msg') msg = true; lock.w.ev.length = 0; maxD = Math.max(maxD, car4.door[0], car4.door[1]); }
  ok(msg && !lock.pl.veh && maxD === 0, 'a locked car: he tries the handle, the door stays shut');
  const cancel = carGame();
  cancel.w.spawnVehicle('vaz2101', cancel.pl.x + rx * 3.8, cancel.pl.z + rz * 3.8, cancel.pl.yaw);
  cancel.w.tryEnter(cancel.pl);
  for (let i = 0; i < 30; i++) { cancel.g.step(1 / 60, { fwd: i > 20 ? 1 : 0, camYaw: cancel.pl.yaw }); cancel.w.ev.length = 0; }
  ok(!cancel.pl.enter && !cancel.pl.veh, 'walking away cancels getting in');
  const fast = drive('vaz2107', { thr: 1, steer: 0 }, 3);
  fast.w.step(1 / 60, { enter: true });
  ok(!fast.w.player.veh && !fast.w.player.exit && fast.w.player.state === 'down', 'jumping out at speed is a tumble, not a calm exit');
  const npcs = carGame();
  const car5 = npcs.w.spawnVehicle('vaz2107', npcs.pl.x + rx * 6, npcs.pl.z + rz * 6, npcs.pl.yaw, { livery: 'militia' });
  const cop = npcs.w.spawnPed('militia', car5.x + rx * 1.6, car5.z + rz * 1.6, car5.yaw);
  npcs.w.seat(cop, car5, true);
  ok(cop.anim.board && car5.doorT[0] + car5.doorT[1] === 1, 'a boarding pedestrian swings a door open');
  for (let i = 0; i < 90; i++) { npcs.g.step(1 / 60, {}); npcs.w.ev.length = 0; }
  ok(!cop.anim.board && car5.door[0] === 0 && car5.door[1] === 0, 'and it closes after him');
  N.AI.copsOut(npcs.w, car5);
  ok(cop.anim.alight && cop.holdT > 0 && !cop.veh, 'a cop climbs out instead of popping out');
  const x0 = cop.x, z0 = cop.z;
  npcs.g.step(1 / 60, {});
  ok(Math.hypot(cop.x - x0, cop.z - z0) < 0.05, 'and waits until he is out');
});

section('street reactions', () => {
  const tw = new N.World(city, { seed: 5, clock: 12 * 60 });
  tw.cam = { x: tw.player.x, z: tw.player.z, yaw: 0 };
  const prevWz = new Map(), jerk = [], lat = [];
  for (let i = 0; i < 40 * 60; i++) {
    tw.step(1 / 60, {}); tw.ev.length = 0;
    for (const v of tw.vehs) {
      if (!v.ai || v.ai.mode !== 'lane') { prevWz.delete(v); continue; }
      if (prevWz.has(v)) { jerk.push(Math.abs(v.wz - prevWz.get(v)) * 60); lat.push(Math.abs(v.wz * v.spd)); }
      prevWz.set(v, v.wz);
    }
  }
  jerk.sort((a, b) => a - b); lat.sort((a, b) => a - b);
  const p99 = a => a[Math.floor(a.length * 0.99)];
  ok(jerk.length > 20000 && p99(jerk) < 5, 'traffic eases into turns, yaw jerk p99 ' + p99(jerk).toFixed(2) + ' rad/s²');
  ok(p99(lat) < 6 && lat[lat.length - 1] < 15, 'traffic slows for corners, lateral p99 ' + p99(lat).toFixed(1) + ' m/s²');
  ok(tw.vehs.filter(v => v.ai && v.ai.mode === 'lane' && v.ai.v > 2).length >= 6, 'and keeps moving');

  const fx = Math.sin(straight.yaw), fz = -Math.cos(straight.yaw), rx = -fz, rz = fx;
  const hitRun = (speed, start) => {
    const { g, w, pl } = carGame();
    const car = w.spawnVehicle('vaz2107', pl.x, pl.z, pl.yaw);
    const ped = w.spawnPed('worker', car.x + fx * start + rx * 0.3, car.z + fz * start + rz * 0.3, pl.yaw + Math.PI);
    ped.ai = { mode: 'idle', mission: true };
    w.seat(pl, car, true);
    const r = { hit: null, top: 0, tumble: 0, ped, car, x0: ped.x, z0: ped.z };
    for (let i = 0; i < 360; i++) {
      const s = Math.hypot(car.vx, car.vz), before = s;
      g.step(1 / 60, { fwd: r.hit ? 0 : s < speed ? 1 : 0, hand: !!r.hit });
      const e = w.ev.find(q => q.t === 'runover' && !q.under);
      if (e && !r.hit) r.hit = { force: e.force, dv: before - Math.hypot(car.vx, car.vz), x: ped.x, z: ped.z };
      if (r.hit) { r.top = Math.max(r.top, ped.y - city.groundY(ped.x, ped.z)); if (ped.anim.tumble) r.tumble = Math.max(r.tumble, Math.abs(ped.anim.tumble.a)); }
      w.ev.length = 0;
    }
    if (r.hit) r.thrown = Math.hypot(ped.x - r.hit.x, ped.z - r.hit.z);
    return r;
  };
  const fast = hitRun(15, 50);
  ok(fast.hit && fast.hit.force > 12 && fast.ped.hp < 60, 'a car at 54 km/h knocks a pedestrian down hard (' + (fast.hit && fast.hit.force.toFixed(1)) + ' m/s)');
  ok(fast.top > 0.9 && fast.thrown > 8 && fast.tumble > 5, 'he rolls over the bonnet and flies ' + (fast.thrown || 0).toFixed(1) + ' m, ' + fast.top.toFixed(1) + ' m up');
  ok(fast.hit && fast.hit.dv > 0.4 && fast.hit.dv < 2.5, 'the car feels the hit but is not stopped (' + (fast.hit && fast.hit.dv.toFixed(2)) + ' m/s)');
  const slow = hitRun(5, 12);
  ok(slow.hit && slow.ped.state !== 'dead' && slow.ped.hp > 70 && slow.top < 0.6, 'a slow car only knocks a pedestrian over');
  const wall = carGame();
  const parked = wall.w.spawnVehicle('vaz2106', wall.pl.x + rx * 6, wall.pl.z + rz * 6, wall.pl.yaw);
  const walker = wall.w.spawnPed('worker', parked.x + rx * 4, parked.z + rz * 4, 0);
  walker.ai = { mode: 'goto', x: parked.x - rx * 4, z: parked.z - rz * 4, run: true };
  let bumped = false;
  for (let i = 0; i < 180; i++) { wall.g.step(1 / 60, {}); if (wall.w.ev.some(e => e.t === 'runover')) bumped = true; wall.w.ev.length = 0; }
  ok(!bumped && walker.hp === walker.maxHp && walker.state !== 'down', 'running into a parked car is not a hit-and-run');
  const lying = carGame();
  const roll = lying.w.spawnVehicle('vaz2107', lying.pl.x, lying.pl.z, lying.pl.yaw);
  lying.w.seat(lying.pl, roll, true);
  const body = lying.w.spawnPed('worker', roll.x + fx * 24 + rx * 0.4, roll.z + fz * 24 + rz * 0.4, 0);
  body.ai = { mode: 'idle', mission: true };
  lying.w.knockDown(body, 30, 0, 0);
  const bx = body.x, bz = body.z;
  let under = 0, lift = 0;
  for (let i = 0; i < 300; i++) { const s = Math.hypot(roll.vx, roll.vz); lying.g.step(1 / 60, { fwd: s < 9 ? 1 : 0 }); if (lying.w.ev.some(e => e.t === 'runover' && e.under)) under++; lift = Math.max(lift, roll.vy); lying.w.ev.length = 0; }
  ok(under >= 1 && body.hp < body.maxHp && Math.hypot(body.x - bx, body.z - bz) < 0.3 && lift > 0.2, 'a car rolls over a body lying in the road instead of shoving it');
  let dodged = 0, trials = 0;
  for (let s = 1; s <= 24; s++) {
    const { g, w, pl } = carGame();
    w.rng = N.rng(s * 31);
    const car = w.spawnVehicle('vaz2107', pl.x, pl.z, pl.yaw);
    w.seat(pl, car, true);
    const p = w.spawnPed('worker', car.x + fx * 45 + rx * 0.3, car.z + fz * 45 + rz * 0.3, s % 2 ? pl.yaw : pl.yaw + Math.PI);
    p.ai = { mode: 'idle' };
    let hit = false;
    for (let i = 0; i < 300; i++) { const sp = Math.hypot(car.vx, car.vz); g.step(1 / 60, { fwd: sp < 13 ? 1 : 0 }); if (w.ev.some(e => e.t === 'runover')) hit = true; w.ev.length = 0; }
    trials++;
    if (!hit) dodged++;
  }
  ok(dodged / trials > 0.4 && dodged / trials < 0.95, 'pedestrians jump out of the way of a speeding car, not always (' + dodged + '/' + trials + ')');

  const shot = carGame();
  const nl = city.nearestLane(shot.pl.x, shot.pl.z, 60, l => l.ambient);
  const ts = Math.min(nl.s, nl.lane.len - 1), tq = city.lanePoint(nl.lane, ts);
  const tc = shot.w.spawnVehicle('vaz2106', tq.x, tq.z, N.yawOf(tq.dx, tq.dz)), td = shot.w.spawnPed('worker', tq.x, tq.z, 0);
  shot.w.seat(td, tc, true);
  tc.ai = { mode: 'lane', lane: nl.lane.id, s: ts, conn: -1, cs: 0, v: 6, vmax: 12, next: -1, ambient: true };
  shot.pl.x = tc.x + rx * 10; shot.pl.z = tc.z + rz * 10; shot.pl.y = city.groundY(shot.pl.x, shot.pl.z);
  shot.w.giveWeapon(shot.pl, 'pm', 40); shot.pl.weapon = 'pm';
  shot.w.buildGrid();
  shot.w.handleWeapon(shot.pl, 1 / 60, { fire: true, firePressed: true, aimO: [shot.pl.x, shot.pl.y + 1.4, shot.pl.z], aimD: [0, 1, 0] }, false);
  const runs = q => q.ai && q.ai.mode === 'flee' || q.exit && q.exit.then && q.exit.then.mode === 'flee';
  ok(tc.ai && tc.ai.panic > 0 || td.veh !== tc && runs(td), 'a shot next to a car makes the driver floor it or run');
  const hitCar = carGame();
  const hc = hitCar.w.spawnVehicle('volga3110', hitCar.pl.x + fx * 12, hitCar.pl.z + fz * 12, hitCar.pl.yaw);
  const hd = hitCar.w.spawnPed('worker', hc.x, hc.z, hc.yaw);
  hitCar.w.seat(hd, hc, true);
  hc.ai = { mode: 'phys', t: 0 };
  N.AI.carShot(hitCar.w, hc, hitCar.pl);
  ok(hc.ai && hc.ai.panic > 0 || hd.veh !== hc, 'bullets in the bodywork panic the driver');
  const gangCar = hitCar.w.spawnVehicle('bmw525', hitCar.pl.x + fx * 24, hitCar.pl.z + fz * 24, hitCar.pl.yaw);
  const gd = hitCar.w.spawnPed('zarechny', gangCar.x, gangCar.z, gangCar.yaw);
  hitCar.w.seat(gd, gangCar, true);
  gangCar.ai = { mode: 'phys', t: 0 };
  N.AI.carShot(hitCar.w, gangCar, hitCar.pl);
  ok(!gd.veh && gd.ai.mode === 'attack' && gd.ai.target === hitCar.pl, 'gangsters get out and shoot back');

  const jackScene = (kind, ai) => {
    const s = carGame();
    const car = s.w.spawnVehicle('vaz2106', s.pl.x, s.pl.z, s.pl.yaw);
    s.w.seat(s.pl, car, true);
    const q = s.w.spawnPed(kind, car.x + rx * 6 + fx * 3, car.z + rz * 6 + fz * 3, 0);
    q.weapon = kind === 'militia' ? q.weapon : 'fists';
    q.ai = ai(s, car);
    const r = { s, car, q, pulled: false, busted: false, phases: new Set(), door: 0 };
    return r;
  };
  const play = (r, n, inp) => { for (let i = 0; i < n; i++) { r.s.g.step(1 / 60, inp ? inp(i) : {}); if (r.q.enter) r.phases.add(r.q.enter.ph); r.door = Math.max(r.door, r.car.door[0], r.car.door[1]); for (const e of r.s.w.ev) { if (e.t === 'pulled') r.pulled = true; if (e.t === 'busted') r.busted = true; } r.s.w.ev.length = 0; } return r; };
  const copJ = play(jackScene('militia', s => { s.w.setWanted(1); return { mode: 'cop' }; }), 600);
  ok(copJ.pulled && copJ.busted && !copJ.s.pl.veh && copJ.phases.has('open') && copJ.phases.has('jack') && copJ.door > 0.9, 'a patrolman walks round, opens the door and drags Tyoma out: busted');
  const thug = play(jackScene('gopnik', s => ({ mode: 'attack', target: s.pl, t: 0, rage: 30 })), 600);
  ok(thug.pulled && !thug.busted && !thug.s.pl.veh && thug.s.pl.hp < 100 && thug.q.ai.mode === 'attack', 'an angry gopnik pulls Tyoma out of the car and starts a fight');
  const owner = play(jackScene('worker', (s, car) => ({ mode: 'attack', target: s.pl, t: 0, rage: 30, owner: car })), 600);
  ok(owner.pulled && owner.car.driver === owner.q && owner.car.ai && (owner.car.ai.mode === 'rejoin' || owner.car.ai.mode === 'lane'), 'the robbed owner takes his car back and drives off');
  const away = jackScene('gopnik', s => ({ mode: 'attack', target: s.pl, t: 0, rage: 30 }));
  let started = false;
  play(away, 600, () => { if (away.q.enter && away.q.enter.ph === 'open') started = true; return { fwd: started ? 1 : 0 }; });
  ok(started && !away.pulled && away.s.pl.veh === away.car, 'flooring it while the door is opening shakes him off');

  const sl = city.nearestLane(straight.x, straight.z, 5, l => l.ambient), slane = sl.lane;
  const laneCar = (w, ds, model, kind, vmax) => {
    const q = city.lanePoint(slane, sl.s + ds);
    const c = w.spawnVehicle(model, q.x, q.z, N.yawOf(q.dx, q.dz)), dr = w.spawnPed(kind, q.x, q.z, 0);
    w.seat(dr, c, true);
    c.ai = { mode: 'lane', lane: slane.id, s: sl.s + ds, conn: -1, cs: 0, v: 0, vmax, next: -1, ambient: true };
    return [c, dr, q];
  };
  const rearEnd = (seed, kind) => {
    const w = new N.World(city, { seed, settings: { ambient: false } }), pl = w.player;
    const [c, dr] = laneCar(w, 40, 'vaz2107', kind, 2);
    for (let i = 0; i < 60; i++) { w.step(1 / 60, {}); w.ev.length = 0; }
    const pc = w.spawnVehicle('volga3110', c.x - Math.sin(c.yaw) * 14, c.z + Math.cos(c.yaw) * 14, c.yaw);
    w.seat(pl, pc, true);
    return { w, pl, c, dr, pc };
  };
  const moods = {};
  let exits = 0, animated = 0, fell = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const r = rearEnd(seed, seed % 3 ? 'worker' : 'muzhik');
    let anim = false, down = false;
    for (let i = 0; i < 10 * 60; i++) {
      const sp = Math.hypot(r.pc.vx, r.pc.vz);
      r.w.step(1 / 60, i < 150 ? { fwd: sp < 13 ? 1 : 0 } : { hand: true });
      r.w.ev.length = 0;
      if (r.dr.exit) anim = true;
      if (!r.dr.veh && r.dr.state === 'down') down = true;
    }
    const k = r.c.mood ? r.c.mood.kind : 'none';
    moods[k] = (moods[k] || 0) + 1;
    if (!r.dr.veh || anim) { exits++; if (anim) animated++; if (down) fell++; }
  }
  ok(!moods.none && Object.keys(moods).length >= 4, 'a rear-ended driver reacts in different ways ' + JSON.stringify(moods));
  ok(exits > 4 && exits < 22, 'only some drivers get out after a crash (' + exits + '/40)');
  ok(animated === exits && fell === 0, 'they open the door and climb out instead of popping out and falling');
  const once = rearEnd(3, 'worker');
  once.c.ai = { mode: 'phys', t: 0 };
  N.AI.crashReact(once.w, once.c, once.pc, 6);
  const first = once.c.mood && once.c.mood.kind;
  for (let i = 0; i < 10; i++) N.AI.crashReact(once.w, once.c, once.pc, 6);
  ok(first && once.c.mood.kind === first, 'one reaction per crash, not one per frame of contact');
  const ram = rearEnd(5, 'gopnik');
  for (let i = 0; i < 150; i++) { const sp = Math.hypot(ram.pc.vx, ram.pc.vz); ram.w.step(1 / 60, { fwd: sp < 13 ? 1 : 0 }); ram.w.ev.length = 0; }
  N.AI.mood(ram.w, ram.c, 'ram', ram.pc);
  let rams = 0, lastRam = -99, pulled = false;
  for (let i = 0; i < 30 * 60 && !pulled; i++) { ram.w.step(1 / 60, { hand: true }); if (ram.pc.hitBy === ram.c && ram.pc.hitDv > 1.5 && i - lastRam > 30) { rams++; lastRam = i; } if (ram.w.ev.some(e => e.t === 'pulled')) pulled = true; ram.w.ev.length = 0; }
  ok(rams >= 2 && pulled, 'an aggressive driver turns round, rams the car again and again, then drags Tyoma out (' + rams + ' rams)');
  const run = rearEnd(6, 'worker');
  for (let i = 0; i < 150; i++) { const sp = Math.hypot(run.pc.vx, run.pc.vz); run.w.step(1 / 60, { fwd: sp < 13 ? 1 : 0 }); run.w.ev.length = 0; }
  if (run.c.ai) run.c.ai.vmax = 12;
  N.AI.mood(run.w, run.c, 'flee', run.pc);
  for (let i = 0; i < 12 * 60; i++) { run.w.step(1 / 60, { hand: true }); run.w.ev.length = 0; }
  ok(run.dr.veh === run.c && Math.hypot(run.c.x - run.pc.x, run.c.z - run.pc.z) > 40, 'a scared driver drives away from Tyoma');
  const look = rearEnd(7, 'worker');
  for (let i = 0; i < 150; i++) { const sp = Math.hypot(look.pc.vx, look.pc.vz); look.w.step(1 / 60, { fwd: sp < 13 ? 1 : 0 }); look.w.ev.length = 0; }
  N.AI.mood(look.w, look.c, 'look', look.pc);
  let looked = false, out = false;
  for (let i = 0; i < 25 * 60; i++) { look.w.step(1 / 60, { hand: true }); look.w.ev.length = 0; if (!look.dr.veh) out = true; if (look.dr.ai && look.dr.ai.mode === 'inspect') looked = true; }
  ok(out && looked && look.dr.veh === look.c && look.c.ai, 'a calm driver gets out, looks at the dent and drives on');
  const detour = (seed, wall) => {
    const w = new N.World(city, { seed, settings: { ambient: false } }), pl = w.player;
    const [c] = laneCar(w, 20, 'vaz2107', 'worker', 12);
    c.ai.v = 8;
    const qb = city.lanePoint(slane, sl.s + 60);
    const pc = w.spawnVehicle('volga3110', qb.x, qb.z, N.yawOf(qb.dx, qb.dz) + 0.2);
    w.seat(pl, pc, true);
    if (wall) for (const k of [-1, 1, -2, 2]) w.spawnVehicle('paz', qb.x - qb.dz * 3.2 * k, qb.z + qb.dx * 3.2 * k, N.yawOf(qb.dx, qb.dz) + Math.PI / 2);
    const r = { waited: 0, passed: false, bumped: false, away: 0 };
    for (let i = 0; i < 70 * 60 && !r.passed; i++) {
      w.step(1 / 60, { hand: true });
      w.ev.length = 0;
      if (c.ai && c.ai.mode === 'phys') r.bumped = true;
      if (Math.abs(c.spd) < 0.2 && !(c.ai && c.ai.det)) r.waited += 1 / 60;
      const along = (c.x - pc.x) * qb.dx + (c.z - pc.z) * qb.dz;
      if (along > 8) r.passed = true;
      r.away = Math.max(r.away, -along);
    }
    return r;
  };
  const dt1 = detour(2, false);
  ok(dt1.passed && !dt1.bumped && dt1.waited > 7 && dt1.waited < 20, 'traffic waits about ten seconds behind a car left in the lane, then drives round it (' + dt1.waited.toFixed(1) + ' s)');
  const dt2 = detour(4, true);
  ok(!dt2.passed && dt2.away > 60, 'when the road is closed from kerb to kerb it turns round and leaves');
  const boom = carGame();
  const bc = boom.w.spawnVehicle('vaz2107', boom.pl.x, boom.pl.z, boom.pl.yaw);
  boom.w.seat(boom.pl, bc, true);
  boom.pl.armor = 100;
  boom.w.damageVehicle(bc, 1e6, null, true);
  for (let i = 0; i < 90; i++) { boom.g.step(1 / 60, {}); boom.w.ev.length = 0; }
  ok(bc.dead && boom.pl.dead && !boom.pl.veh, 'blowing up inside a car kills, armour or not');
  const god = carGame();
  const gc = god.w.spawnVehicle('vaz2107', god.pl.x, god.pl.z, god.pl.yaw);
  god.w.seat(god.pl, gc, true);
  god.w.god = true;
  god.w.blowUp(gc);
  ok(!god.pl.dead && !god.pl.veh, 'except in god mode');
});

section('weapons in hand', () => {
  const { g, w, pl } = carGame();
  w.giveWeapon(pl, 'ak', 90);
  pl.weapon = 'ak';
  pl.weapons.ak.clip = 3;
  const snd = [];
  g.step(1 / 60, { reload: true });
  for (let i = 0; i < 140; i++) { g.step(1 / 60, {}); for (const e of w.ev) if (e.t === 'rsnd') snd.push(e.k); w.ev.length = 0; }
  ok(snd.join(',') === 'magout,magin,rack' && pl.weapons.ak.clip === 30, 'AK reload: magazine out, in, bolt');
  w.giveWeapon(pl, 'shotgun', 20);
  pl.weapon = 'shotgun';
  pl.weapons.shotgun.clip = 1;
  snd.length = 0;
  g.step(1 / 60, { firePressed: true, fire: true });
  for (let i = 0; i < 70; i++) { g.step(1 / 60, {}); for (const e of w.ev) if (e.t === 'rsnd') snd.push(e.k); w.ev.length = 0; }
  ok(snd.length === 0, 'no pump after the last shell');
  pl.weapons.shotgun.clip = 2;
  g.step(1 / 60, { firePressed: true, fire: true });
  for (let i = 0; i < 70; i++) { g.step(1 / 60, {}); for (const e of w.ev) if (e.t === 'rsnd') snd.push(e.k); w.ev.length = 0; }
  ok(snd.join(',') === 'pump', 'shotgun pumps after a shot');
  pl.weapons.shotgun.clip = 0;
  snd.length = 0;
  g.step(1 / 60, { reload: true });
  for (let i = 0; i < 150; i++) { g.step(1 / 60, {}); for (const e of w.ev) if (e.t === 'rsnd') snd.push(e.k); w.ev.length = 0; }
  ok(snd.join(',') === 'shell,shell,shell,shell,pump', 'shotgun reload: four shells and a pump');
  w.settings.ambient = false;
  for (const q of w.peds.slice()) if (q !== pl && !q.persistent) w.removePed(q);
  const bad = w.spawnPed('bandit', pl.x + 8, pl.z, 0, { weapon: 'pm' });
  bad.ai = { mode: 'attack', target: pl, t: 0 };
  let reloaded = false;
  for (let i = 0; i < 900 && !reloaded; i++) { g.step(1 / 60, {}); w.ev.length = 0; if (bad.reloadT > 0) reloaded = true; pl.hp = 100; }
  ok(reloaded, 'gunmen reload between bursts');
});

section('new weapons', () => {
  const { g, w, pl } = carGame();
  const run = (n, inp) => { const out = []; for (let i = 0; i < n; i++) { g.step(1 / 60, i === 0 ? inp || {} : {}); out.push(...w.ev); w.ev.length = 0; } return out; };
  for (const id of ['rsh12', 'toz34', 'kiparis', 'bizon', 'sks', 'vss', 'pkm', 'rpg7']) {
    const W = N.WEAPONS[id];
    w.giveWeapon(pl, id, W.clip * 3);
    pl.weapon = id;
    pl.weapons[id].clip = W.rocket ? 0 : 1;
    pl.reloadT = 0;
    const snd = run(Math.ceil(W.reload * 60) + 20, { reload: true }).filter(e => e.t === 'rsnd').map(e => e.k);
    ok(snd.join(',') === W.rk.map(r => r[1]).join(',') && pl.weapons[id].clip === W.clip, id + ' reload: ' + snd.join(', '));
  }
  w.giveWeapon(pl, 'pm', 20);
  pl.weapon = 'pm';
  w.selectSlot(pl, 2);
  const second = pl.weapon;
  w.selectSlot(pl, 2);
  ok(second === 'rsh12' && pl.weapon === 'pm', 'one key switches between the Makarov and the RSh-12');
  ok(N.START_WEAPONS.every(id => g.state.unlocked.includes(id)), 'the TOZ-34 and the Molotov are sold from the start');
  g.unlock('ak');
  ok(['bizon', 'pkm'].every(id => g.state.unlocked.includes(id)) && !g.state.unlocked.includes('vss'), 'the AK opens the Bizon and the PKM, not the VSS');
  ok(['toz34', 'molotov', 'sks', 'kiparis'].every(id => city.pickups.some(k => k.type === 'weapon' && k.weapon === id)), 'new guns lie around the city');
  const arms = new Set();
  for (let i = 0; i < 6; i++) arms.add(w.spawnPed('bandit', pl.x + 30 + i, pl.z, 0).weapon);
  ok(arms.size >= 3 && [...arms].every(id => N.WEAPONS[id]), 'bandits carry different guns: ' + [...arms].join(', '));
  {
    const w2 = new N.World(city, { seed: 9, settings: { ambient: false } });
    const p2 = w2.player;
    w2.giveWeapon(p2, 'vss', 20);
    p2.weapon = 'vss';
    w2.spawnPed('militia', p2.x + 6, p2.z, 0);
    w2.buildGrid();
    w2.handleWeapon(p2, 1 / 60, { fire: true, firePressed: true, aimO: [p2.x, p2.y + 1.4, p2.z], aimD: [0, 0.3, -0.954] }, false);
    ok(w2.ev.some(e => e.t === 'shot') && w2.wanted.level === 0, 'the VSS fires without raising the alarm');
  }
  {
    const { w, pl } = carGame();
    const fx = Math.sin(pl.yaw), fz = -Math.cos(pl.yaw);
    const a = w.spawnPed('worker', pl.x + fx * 5, pl.z + fz * 5, 0), b = w.spawnPed('worker', pl.x + fx * 7, pl.z + fz * 7, 0);
    a.hp = a.maxHp = b.hp = b.maxHp = 400;
    w.buildGrid();
    w.fire(pl, 'rsh12', pl.x, pl.y + 1.2, pl.z, fx, 0, fz, 0);
    ok(a.hp < 400 && b.hp < 400, 'an RSh-12 bullet goes through one man into the next');
    a.hp = b.hp = 400;
    a.state = b.state = 'idle';
    w.fire(pl, 'pm', pl.x, pl.y + 1.2, pl.z, fx, 0, fz, 0);
    ok(a.hp < 400 && b.hp === 400, 'a Makarov bullet stops in the first man');
  }
  {
    const { w, pl } = carGame();
    const fx = Math.sin(pl.yaw), fz = -Math.cos(pl.yaw);
    w.giveWeapon(pl, 'rpg7', 2);
    pl.weapon = 'rpg7';
    const v = w.spawnVehicle('volga3110', pl.x + fx * 30, pl.z + fz * 30, pl.yaw);
    w.buildGrid();
    const o = [pl.x + fx * 0.6, pl.y + 1.45, pl.z + fz * 0.6], d = [v.x - o[0], v.y + 0.8 - o[1], v.z - o[2]], L = Math.hypot(d[0], d[1], d[2]);
    w.handleWeapon(pl, 1 / 60, { fire: true, firePressed: true, aimO: o, aimD: d.map(c => c / L) }, false);
    ok(w.projs.some(q => q.type === 'rocket') && pl.weapons.rpg7.clip === 0, 'the RPG-7 launches a rocket');
    const ev = [];
    for (let i = 0; i < 120 && !(v.dead || v.burning); i++) { w.step(1 / 60, {}); ev.push(...w.ev); w.ev.length = 0; }
    ok(ev.some(e => e.t === 'explosion' && e.kind === 'rocket') && (v.dead || v.burning), 'the rocket blows up the car');
    const near = w.spawnVehicle('vaz2106', pl.x + fx * 3, pl.z + fz * 3, pl.yaw + 1.5);
    w.buildGrid();
    w.giveWeapon(pl, 'rpg7', 1);
    pl.fireT = 0;
    const o2 = [pl.x, pl.y + 1.2, pl.z];
    w.fire(pl, 'rpg7', o2[0], o2[1], o2[2], fx, 0, fz, 0);
    ev.length = 0;
    for (let i = 0; i < 30; i++) { w.step(1 / 60, {}); ev.push(...w.ev); w.ev.length = 0; }
    ok(!ev.some(e => e.t === 'explosion' && e.kind === 'rocket') && !near.dead && !near.burning && !w.projs.length, 'a warhead does not arm at point-blank range');
  }
  {
    const { w, pl } = carGame();
    const fx = Math.sin(pl.yaw), fz = -Math.cos(pl.yaw), rx = -fz, rz = fx;
    const vic = w.spawnPed('worker', pl.x + fx * 8, pl.z + fz * 8, 0);
    const car = w.spawnVehicle('vaz2106', vic.x + rx * 2.2, vic.z + rz * 2.2, pl.yaw);
    const cop = w.spawnPed('militia', pl.x - fx * 10, pl.z - fz * 10, 0);
    w.buildGrid();
    w.molotov({ x: vic.x, z: vic.z, owner: pl }, vic.y);
    for (let i = 0; i < 60; i++) { w.step(1 / 60, {}); w.ev.length = 0; }
    ok(vic.burn > 0 || vic.dead, 'the Molotov sets a man on fire');
    ok(car.hp < car.maxHp * 0.25, 'the burning pool sets the car alight');
    ok(w.wanted.level >= 1, 'a Molotov is a crime');
    w.removePed(cop);
    w.setWanted(0);
    for (let i = 0; i < 60 * 10; i++) { w.step(1 / 60, {}); w.ev.length = 0; }
    ok(w.fires.length === 0, 'the fire burns out');
    const q = w.spawnPed('worker', pl.x - fx * 4, pl.z - fz * 4, 0);
    w.ignite(q, pl, 5);
    q.wade = 0.9;
    w.stepBurn(q, 0.1);
    ok(q.burn === 0 && w.ev.some(e => e.t === 'steam'), 'water puts out a burning man');
    w.ev.length = 0;
    w.giveWeapon(pl, 'molotov', 2);
    w.throwGrenade(pl, { aimD: [fx, 0.35, fz] }, 0.8, 'molotov');
    let lit = false;
    for (let i = 0; i < 300 && !lit; i++) { w.step(1 / 60, {}); lit = w.ev.some(e => e.t === 'molotov' || e.t === 'fizzle'); w.ev.length = 0; }
    ok(lit && w.fires.length === 1, 'a thrown Molotov breaks into flames');
  }
});

section('characters', () => {
  const finite = m => m.every(isFinite);
  const kinds = Object.keys(N.PED_KINDS);
  const looks = kinds.map((k, i) => N.makeLook(k, N.rng(10 + i))).concat(Object.values(N.CHARS).filter(c => c.look).map(c => c.look), Object.keys(N.OUTFITS).map(o => N.playerLook(o)));
  for (const look of looks) {
    const hi = N.Models.ped(look, 0), lo = N.Models.ped(look, 1);
    const f = N.faceOf(look);
    ok(hi.bones.length === hi.mb.nv && lo.bones.length === lo.mb.nv && Array.from(hi.bones).every(b => b < 16) && hi.mb.nv < 2000 && lo.mb.nv < hi.mb.nv * 0.7, 'ped model ' + look.topKind + ' ' + hi.mb.nv + '/' + lo.mb.nv + ' verts');
    ok(f >= 0 && f < N.FACE_COUNT, 'face ' + f);
    let face = 0;
    for (let i = 0; i < hi.mb.nv; i++) if (hi.mb.u8[i * 32 + 28] === N.TEX.face) face++;
    ok(face > 20, 'the face is painted on the head');
  }
  ok(N.FACE_COUNT === 16 && N.faceOf(N.playerLook('zek')) === 9, 'sixteen faces, Tyoma has his own');
  ok(N.Models.ped(N.playerLook('leather'), 0).mb.u8.some((v, i) => i % 32 === 28 && v === N.TEX.leather), 'the leather jacket is leather');
  ok(N.Models.ped(N.makeLook('muzhik', N.rng(3)), 0).mb.u8.some((v, i) => i % 32 === 28 && v === N.TEX.stripes), 'the telnyashka has stripes');
  for (const id of N.WEAPON_IDS) if (id !== 'fists') ok(N.Models.weapon(id).nv > 0 && N.Models.pickup({ type: 'weapon', weapon: id }).nv >= N.Models.weapon(id).nv, 'weapon and pickup ' + id);
  const has = (id, f) => N.Models.wparts(id).some(f);
  ok(['pm', 'ak', 'svd', 'kiparis', 'bizon', 'vss'].every(id => has(id, q => q.kind === 'mag')) && has('shotgun', q => q.name === 'pump') && has('toz34', q => q.name === 'brk') && has('rsh12', q => q.name === 'cyl') && has('pkm', q => q.name === 'cover') && has('rpg7', q => q.kind === 'mag') && N.Cars.STEER_STYLES.every(st => N.Cars.steer(st).nv > 0), 'magazines, the pump, the break-open barrels, the cylinder, the feed cover, the warhead, the steering wheels');
  for (const id of Object.keys(N.WGRIP)) {
    const G = N.WGRIP[id], RL = N.Anim.reloadOf(N.WEAPONS[id]);
    const named = n => n === 'pouch' || !!G[n];
    ok(N.Anim.hold(id) && G.tip && G.lh && RL && RL.lh.every(([, n]) => named(n)) && Object.keys(RL.part || {}).every(k => has(id, q => q.name === k)) && Object.values(G.moves || {}).every(k => has(id, q => q.name === k)) && (!RL.mag || has(id, q => q.kind === 'mag')), id + ': grip, support hand and a reload built from its own parts');
  }
  const look = N.playerLook('zek');
  const pm = N.Models.ped(look);
  const base = () => ({ id: 77, x: straight.x, y: city.groundY(straight.x, straight.z), z: straight.z, yaw: straight.yaw, vx: 0, vz: 0, onGround: true, look, weapon: 'fists', anim: { phase: 0, speed: 0, aim: 0 }, state: 'idle' });
  const rig = (p, t, o) => N.pedRig(p, t, N.pedRoot(p), pm.piv, o);
  const fin = r => r.G.every(finite) && (!r.wpn || finite(r.wpn)) && r.parts.every(q => finite(q.m));
  const states = {
    walk: p => { p.anim.speed = 1.4; p.vx = Math.sin(p.yaw) * 1.4; p.vz = -Math.cos(p.yaw) * 1.4; },
    run: p => { p.anim.speed = 4.3; p.vx = Math.sin(p.yaw) * 4.3; p.vz = -Math.cos(p.yaw) * 4.3; },
    back: p => { p.anim.speed = 2; p.vx = -Math.sin(p.yaw) * 2; p.vz = Math.cos(p.yaw) * 2; p.weapon = 'ak'; p.anim.aim = 1; },
    strafe: p => { p.anim.speed = 2; p.vx = Math.cos(p.yaw) * 2; p.vz = Math.sin(p.yaw) * 2; p.weapon = 'pm'; p.anim.aim = 1; },
    jump: p => { p.onGround = false; p.anim.jumpT = 0.4; p.vy = 2; },
    fall: p => { p.onGround = false; p.vy = -9; },
    land: p => { p.anim.land = 0.3; },
    punch: p => { p.anim.action = 'punch'; p.anim.actionT = 0.15; p.anim.combo = 1; },
    kick: p => { p.anim.action = 'punch'; p.anim.actionT = 0.15; p.anim.combo = 2; },
    stab: p => { p.weapon = 'knife'; p.anim.action = 'stab'; p.anim.actionT = 0.15; p.anim.combo = 0; },
    windup: p => { p.weapon = 'grenade'; p.anim.action = 'windup'; },
    throw: p => { p.weapon = 'grenade'; p.anim.action = 'throw'; p.anim.actionT = 0.2; },
    dance: p => { p.anim.dance = 1; },
    hands: p => { p.anim.handsUp = 1; },
    down: p => { p.state = 'down'; p.anim.fall = 1; },
    getup: p => { p.anim.getUp = 0.3; },
    dead: p => { p.dead = true; p.state = 'dead'; p.anim.fall = 1; },
    swim: p => { p.swim = { t: 1, under: false }; p.wl = 0; },
    under: p => { p.swim = { t: 3, under: true }; p.wl = 0; },
    wade: p => { p.wade = 0.7; p.wl = 0.7; p.anim.speed = 1; }
  };
  for (const [name, fn] of Object.entries(states)) {
    const p = base();
    fn(p);
    ok(fin(rig(p, 0.5)) && fin(rig(p, 0.55)), 'pose ' + name);
  }
  const apm = (m, q) => [m[0] * q[0] + m[1] * q[1] + m[2] * q[2] + m[9], m[3] * q[0] + m[4] * q[1] + m[5] * q[2] + m[10], m[6] * q[0] + m[7] * q[1] + m[8] * q[2] + m[11]];
  const gap = (a, m) => Math.hypot(a[0] - m[9], a[1] - m[10], a[2] - m[11]);
  const turned = (a, b) => Math.min(...[0, 1, 2].map(i => a[i] * b[i] + a[i + 3] * b[i + 3] + a[i + 6] * b[i + 6])) < 0.88;
  const partM = (r, wid, name) => { const q = N.Models.wparts(wid).find(o => o.name === name); const o = q && r.parts.find(x => x.mb === q.mb); return o ? o.m : null; };
  for (const wid of Object.keys(N.WGRIP)) {
    const W = N.WEAPONS[wid];
    for (const aim of [0, 1]) {
      const p = base();
      p.weapon = wid; p.anim.aim = aim; p.aimPitch = 0.2;
      const r = rig(p, 1);
      ok(r.wpn && fin(r), wid + (aim ? ' aimed' : ' held'));
      if (aim || W.two) {
        const H = N.Anim.hold(wid), fr = N.Anim.frame(H.R.y, H.R.x);
        const rh = gap(apm(r.wpn, fr.y.map(v => v * H.R.d)), r.G[N.PB.HANDR]), lh = gap(apm(r.wpn, N.WGRIP[wid].lh), r.G[N.PB.HANDL]);
        ok(rh < 0.02, wid + ' right hand on the grip (' + rh.toFixed(3) + ' m)');
        ok(lh < 0.14, wid + ' left hand on the weapon (' + lh.toFixed(3) + ' m)');
      }
      if (aim) {
        const w = new N.World(city, { seed: 4, settings: { ambient: false } });
        const q = Object.assign(w.player, { x: p.x, y: p.y, z: p.z, yaw: p.yaw, weapon: wid, aimPitch: 0.2 });
        q.anim.aim = 1;
        const m = w.muzzle(q), t = apm(r.wpn, N.WGRIP[wid].tip);
        const d = Math.hypot(m.x - t[0], m.y - t[1], m.z - t[2]);
        ok(d < 0.3, wid + ' shots leave the barrel (' + d.toFixed(2) + ' m)');
      }
    }
    for (const u of [0.05, 0.2, 0.4, 0.5, 0.6, 0.8, 0.95]) {
      const p = base();
      p.weapon = wid; p.reloadT = W.reload * (1 - u);
      const r = rig(p, 2 + u);
      ok(fin(r) && r.wpn, wid + ' reload at ' + u);
    }
  }
  const at = (wid, u, extra) => { const p = Object.assign(base(), { weapon: wid }, extra || {}); if (u !== null) p.reloadT = N.WEAPONS[wid].reload * (1 - u); return rig(p, 5 + (u || 0)); };
  ok(!partM(at('pm', 0.35), 'pm', 'mag') && partM(at('pm', 0.7), 'pm', 'mag'), 'the Makarov drops its magazine and gets a new one');
  ok(!partM(at('sks', null), 'sks', 'clip') && partM(at('sks', 0.5), 'sks', 'clip'), 'the SKS stripper clip only shows while loading');
  ok(!partM(at('rpg7', null, { weapons: { rpg7: { clip: 0, ammo: 2 } } }), 'rpg7', 'mag') && partM(at('rpg7', null, { weapons: { rpg7: { clip: 1, ammo: 1 } } }), 'rpg7', 'mag'), 'the RPG-7 shows its warhead only when loaded');
  for (const [wid, name, u] of [['toz34', 'brk', 0.4], ['rsh12', 'cyl', 0.4], ['pkm', 'cover', 0.4]]) {
    const r0 = at(wid, null), shut = !turned(r0.wpn, partM(r0, wid, name)), r1 = at(wid, u);
    ok(shut && turned(r1.wpn, partM(r1, wid, name)), wid + ' ' + name + ' swings open while reloading');
  }
  {
    const r = at('toz34', 0.5), q = N.Models.wparts('toz34').find(o => o.name === 'brk'), b = N.WGRIP.toz34.breech;
    const d = gap(apm(partM(r, 'toz34', 'brk'), [b[0] - q.at[0], b[1] - q.at[1], b[2] - q.at[2]]), r.G[N.PB.HANDL]);
    ok(d < 0.16, 'TOZ-34: the left hand loads the broken-open breech (' + d.toFixed(2) + ' m)');
  }
  const p = base();
  p.anim.speed = 1.4; p.vx = Math.sin(p.yaw) * 1.4; p.vz = -Math.cos(p.yaw) * 1.4;
  const fz = [];
  for (let k = 0; k < 8; k++) { p.anim.phase = k * Math.PI / 4; const r = rig(p, 3 + k * 0.1); const Lf = r.G[N.PB.FOOTL], Rf = r.G[N.PB.FOOTR]; fz.push((Lf[9] - Rf[9]) * Math.sin(p.yaw) - (Lf[11] - Rf[11]) * Math.cos(p.yaw)); }
  ok(Math.max(...fz) > 0.25 && Math.min(...fz) < -0.25, 'walking: the feet pass each other');
  const sp = s => { const w = new N.World(city, { seed: 2, settings: { ambient: false } }); const q = w.player; Object.assign(q, { x: straight.x, z: straight.z, y: city.groundY(straight.x, straight.z) }); q.wantVx = q.vx = Math.sin(straight.yaw) * s; q.wantVz = q.vz = -Math.cos(straight.yaw) * s; const a0 = q.anim.phase; for (let i = 0; i < 60; i++) { q.wantVx = Math.sin(straight.yaw) * s; q.wantVz = -Math.cos(straight.yaw) * s; w.stepPeds(1 / 60); } return (q.anim.phase - a0) / (Math.PI * 2); };
  const cw = sp(1.4), cr = sp(4.3);
  ok(cw > 0.8 && cw < 1.1 && cr > cw * 1.3 && cr < cw * 1.8, 'cadence: ' + cw.toFixed(2) + ' strides/s walking, ' + cr.toFixed(2) + ' running');
  const veh = { x: 0, y: 0, z: 0, yaw: 0, spec: N.VEHICLES.volga3110, pitch: 0, roll: 0, steer: 0.4, door: [0, 0] };
  const drv = Object.assign(base(), { veh });
  veh.driver = drv;
  const cab = N.cabin(veh.spec);
  const r = N.pedRig(drv, 4, N.M3.euler(0, 0, 0, cab.seat.x, N.seatRoot(cab, look.tall), cab.seat.z), pm.piv);
  const wheel = [cab.wheel.x, cab.wheel.y, cab.wheel.z];
  ok(fin(r) && !r.wpn && [N.PB.HANDL, N.PB.HANDR].every(b => Math.hypot(r.G[b][9] - wheel[0], r.G[b][10] - wheel[1], r.G[b][11] - wheel[2]) < 0.35), 'the driver holds the steering wheel');
  const sq = Object.assign(base(), { type: 'gopnik', ai: { mode: 'idle' } });
  let sqY = 9;
  for (let k = 0; k < 120; k++) { const rr = rig(sq, 10 + k / 20); sqY = rr.G[N.PB.PELVIS][10]; }
  ok(sqY < 0.7, 'idle gopniks squat');
});

section('metro', () => {
  const ML = city.metroLine, MT = N.METRO, OZ = MT.OZ, MP = MT.P, TR = MT.TR;
  ok(ML && ML.st.map(q => q.name).join('|') === 'Парк культуры|Кировская|Комсомольская|Автозаводская', 'four stations of the Avtozavodskaya line in order');
  for (let i = 1; i < ML.st.length; i++) {
    const a = ML.st[i - 1], b = ML.st[i], real = Math.hypot(b.real.x - a.real.x, b.real.z - a.real.z);
    ok(Math.abs(b.s - a.s - real) < 1 && real > 600 && real < 1600, 'stretch ' + a.name + ' — ' + b.name + ' follows the real distance ' + Math.round(real) + ' m');
  }
  ok(ML.st.every(q => city.inside(q.x) && city.inMetro(q.x, OZ) && !city.inClub(q.x, OZ)), 'the line lies in the interior space, away from the club');
  const open = q => Object.values(q.ends).filter(E => E.open).length;
  ok(open(ML.st[0]) === 2 && open(ML.st[1]) === 2 && open(ML.st[2]) === 1 && open(ML.st[3]) === 1, 'vestibules as in 2000: two at Парк культуры and Кировская, one open at Комсомольская, one at Автозаводская');
  ok(ML.st[2].ends[1] && !ML.st[2].ends[1].open && !ML.st[3].ends[-1], 'the second vestibule of Комсомольская is closed, Автозаводская has none at its south end');
  const pav = city.props.filter(p => p.type === 'metro');
  ok(ML.gates.length === pav.length && ML.gates.length >= 16, 'every street pavilion leads underground (' + ML.gates.length + ')');
  ML.gates.forEach((gt, i) => {
    const a = city.places['mg' + i], b = city.places['mgi' + i];
    ok(a && b && !city.inside(a.x) && city.inMetro(b.x, b.z) && b.y === MP.exitTop && city.teleports.some(t => t.a === 'mg' + i && t.b === 'mgi' + i && t.gate === 'metro'), 'pavilion ' + i + ' pairs with an exit stair of ' + ML.st[gt.st].name);
    ok(Math.abs(ML.floorY(b.x, b.z, b.y) - MP.exitTop) < 0.01 && /^ВЫХОД НА /.test(gt.sign), 'exit landing and sign ' + gt.sign);
    const op = city.outsidePos(b.x, b.z), st = ML.st[gt.st];
    ok(Math.hypot(op.x - st.real.x, op.z - st.real.z) < 160, 'the radar shows the exit near ' + st.name);
  });
  for (const q of ML.st) {
    ok(ML.floorY(q.x, OZ + 2, 1) === 0 && ML.floorY(q.x, OZ + MP.track, 0) === MP.bed, 'platform and track bed levels at ' + q.name);
    for (const E of Object.values(q.ends)) {
      const u = q.x + E.e * 45;
      const sy = ML.floorY(u, OZ, 3);
      ok(sy > 1.5 && sy < 3, 'stairs rise from the platform at ' + q.name);
      if (!E.open) continue;
      const vx = q.x + E.e * 70;
      ok(ML.floorY(vx, OZ, 5) === MP.top && ML.floorY(vx, OZ + MP.track, -1.25) === MP.bed, 'the vestibule floor sits over the running tunnel at ' + q.name);
      ok(E.exits.every((g, k) => k === 0 || g.v > E.exits[k - 1].v) && E.exits.every(g => Math.abs(g.v) + 1.6 <= E.W / 2), 'exit stairs fit the vestibule wall at ' + q.name);
    }
    ok(city.zoneAt(q.x, OZ) === 'Метро «' + q.name + '»' && Math.hypot(city.outsidePos(q.x, OZ).x - q.real.x, city.outsidePos(q.x, OZ).z - q.real.z) < 5, 'zone and radar position at ' + q.name);
  }
  ok(/^Перегон «Кировская» — «Комсомольская»$/.test(city.zoneAt((ML.st[1].x + ML.st[2].x) / 2, OZ + MP.track)), 'zone name between stations');
  ok(ML.signs.every(s => s.text && N.SIGN_STYLE[s.style]) && ML.signs.some(s => s.style === 'mname' && s.text === 'АВТОЗАВОДСКАЯ' && s.bg), 'metro signs use atlas styles');

  ok(ML.headway > 100 && ML.headway < 150 && TR.n === 6, 'six trains, a train every ' + Math.round(ML.headway) + ' s');
  const S = {};
  let overlap = 0, doorsMoving = 0, doorsOff = 0, served = new Map();
  for (let t = 0; t < ML.cycle; t += 0.5) {
    const pos = [];
    for (let k = 0; k < TR.n; k++) {
      const s = ML.state(t + k * ML.cycle / TR.n, S);
      const p = ML.legs[s.L].at(s.f - TR.span / 2, {});
      pos.push({ x: p.x, z: p.z });
      if (s.doors > 0 && s.v > 0.01) doorsMoving++;
      if (s.doors > 0.5) {
        const q = ML.st[s.seg.st];
        if (Math.abs(p.x - q.x) > 1 || Math.abs(Math.abs(p.z - OZ) - MP.track) > 0.01) doorsOff++;
        const key = s.seg.st + ':' + s.L;
        if (!served.has(key)) served.set(key, []);
        if (s.tau < 1) served.get(key).push(t);
      }
    }
    for (let a = 0; a < pos.length; a++) for (let b = a + 1; b < pos.length; b++) if (Math.abs(pos[a].z - pos[b].z) < 2 && Math.abs(pos[a].x - pos[b].x) < TR.span + 10) overlap++;
  }
  ok(overlap === 0, 'trains never run into each other (' + overlap + ' close samples)');
  ok(doorsMoving === 0 && doorsOff === 0, 'doors open only at a standstill along a platform');
  ok(served.size === 8, 'every platform is served in both directions (' + served.size + ' stops)');

  store.clear();
  const g = new N.Game(city, { seed: 77, headless: true, state: Object.assign(N.Game.newState(), { done: { m1: true }, money: 100, clock: 12 * 60 }) });
  const w = g.world, pl = w.player, M = w.metro;
  const ev = [];
  const step = (n, inp) => { for (let i = 0; i < n; i++) { g.step(1 / 60, typeof inp === 'function' ? inp(i) : inp || {}); for (const e of w.ev) ev.push(e); w.ev.length = 0; } };
  const walk = (x, z, max, tol) => { const in0 = city.inside(pl.x); for (let n = 0; n < (max || 1800); n++) { const d = Math.hypot(x - pl.x, z - pl.z); if (d < (tol || 0.6)) return true; step(1, { fwd: 1, camYaw: Math.atan2(x - pl.x, -(z - pl.z)) }); if (city.inside(pl.x) !== in0) return true; } return false; };
  const gi = ML.gates.findIndex(q => q.st === 1 && q.e < 0), gate = ML.gates[gi], st1 = ML.st[1];
  g.teleport('mg' + gi);
  step(3);
  g.cool.clear();
  const mk = g.markers().find(m => m.id === 'tele_metro' + gi + '_a');
  pl.x = mk.x; pl.z = mk.z;
  step(60);
  ok(city.inMetro(pl.x, pl.z) && Math.abs(pl.y - MP.exitTop) < 0.05, 'the pavilion door takes Тёма down to the exit landing');
  ok(M.peds.some(p => p.mm.role === 'pax') && M.peds.some(p => p.mm.role === 'mil'), 'the station fills with passengers and a militiaman at the turnstiles');
  const e = gate.e, lane = MT.LANES[2] + 0.475;
  ok(walk(gate.foot.x, gate.foot.z) && walk(st1.x + e * 63, OZ + lane) && walk(st1.x + e * 58, OZ + lane), 'walk down the exit stairs and through a turnstile');
  ok(g.state.money === 95 && M.player.paid && ev.some(q => q.t === 'mfare' && q.ok), 'the turnstile takes a 5 р. token');
  ok(walk(st1.x + e * 53, OZ) && walk(st1.x + e * 42, OZ) && walk(st1.x + e * 33, OZ) && Math.abs(pl.y) < 0.05, 'stairs lead down to the platform');
  let tr = null;
  for (let i = 0; i < 60 * 200 && !tr; i++) { step(1); tr = M.trains.find(q => q.stop === 1 && q.dir > 0 && q.doors > 0.95); }
  ok(!!tr, 'an eastbound train stops at Кировская');
  let door = null, bd = 1e9;
  for (const c of tr.cars) for (const du of TR.doors) { const x = c.x + c.ex * du, d = Math.abs(x - pl.x); if (d < bd) { bd = d; door = [x, c]; } }
  walk(door[0], OZ + 4.3, 900, 0.3);
  walk(door[0], door[1].z, 300, 0.3);
  step(2);
  ok(!!M.player.aboard && M.player.aboard.tr === tr, 'Тёма boards through an open door');
  const boarders = M.peds.filter(p => p.mm.goal === 'board' || p.mm.goal === 'ride' && p.mm.tr === tr).length;
  ok(boarders > 0, 'passengers ride the same train (' + boarders + ')');
  ok(M.act(pl) && pl.mseat, 'F sits down on a free seat');
  const x0 = pl.x;
  let left = false, rode = false, talks = 0;
  for (let i = 0; i < 60 * 150; i++) {
    step(1);
    if (tr.stop < 0) left = true;
    if (left && tr.stop === 2 && tr.doors > 0.95) { rode = true; break; }
  }
  talks = ev.filter(q => q.t === 'mtalk' && q.aboard).length;
  ok(left && rode && Math.abs(pl.x - x0) > 900 && M.player.aboard && M.player.aboard.tr === tr, 'the train carries him to Комсомольская (' + Math.round(Math.abs(pl.x - x0)) + ' m)');
  ok(talks >= 2 && ev.some(q => q.t === 'mtalk' && /Осторожно, двери закрываются! Следующая станция — «Комсомольская»/.test(q.text)), 'announcements inside the car');
  ok(pl.mseat && Math.abs(pl.y) < 0.01 && !pl.dead, 'he stays seated through the ride');
  step(1, { fwd: 1, camYaw: 0 });
  ok(!pl.mseat, 'moving stands him up');
  const st2 = ML.st[2], c2 = M.player.aboard.c, du2 = TR.doors.reduce((a, d) => (Math.abs(c2.x + c2.ex * d - pl.x) < Math.abs(c2.x + c2.ex * a - pl.x) ? d : a));
  walk(c2.x + c2.ex * du2, c2.z, 300, 0.3);
  ok(walk(c2.x + c2.ex * du2, OZ + Math.sign(c2.z - OZ) * 3.6, 300, 0.4) && !M.player.aboard && Math.abs(pl.y) < 0.05, 'he steps out onto the platform of Комсомольская');
  const E2 = st2.ends[-1], g2 = E2.exits[0];
  ok(walk(st2.x - 33, OZ) && walk(st2.x - 42, OZ) && walk(st2.x - 53, OZ) && walk(st2.x - (MP.cab - 1.5), OZ + MT.EXIT_V) && walk(st2.x - (MP.cab + 2.4), OZ + MT.EXIT_V) && walk(g2.foot.x, g2.foot.z), 'up the stairs and out through the exit passage');
  ok(g.state.money === 95, 'leaving costs nothing');
  walk(g2.x, g2.z, 900, 0.4);
  step(80);
  ok(!city.inside(pl.x) && Math.hypot(pl.x - g2.px, pl.z - g2.pz) < 6, 'the exit stair leads up to the pavilion of Комсомольская');
  step(30);
  ok(!M.peds.length && !M.player.paid, 'the metro empties behind him');

  store.clear();
  const g3 = new N.Game(city, { seed: 78, headless: true, state: Object.assign(N.Game.newState(), { done: { m1: true }, money: 3, clock: 13 * 60 }) });
  const w3 = g3.world, p3 = w3.player, M3 = w3.metro, st3 = ML.st[0], E3 = Object.values(st3.ends).find(E => E.open), e3 = E3.e;
  const s3 = (n, inp) => { for (let i = 0; i < n; i++) { g3.step(1 / 60, typeof inp === 'function' ? inp(i) : inp || {}); w3.ev.length = 0; } };
  Object.assign(p3, { x: st3.x + e3 * 66, z: OZ - 1.6, y: MP.top, vx: 0, vz: 0 });
  s3(30);
  for (let i = 0; i < 120; i++) s3(1, { fwd: 1, camYaw: N.yawOf(-e3, 0) });
  ok((p3.x - st3.x) * e3 > MP.turn && g3.state.money === 3 && !M3.player.paid, 'without 5 р. the turnstile stops him');
  ok(M3.peds.some(p => p.mm.role === 'mil' && !p.dead), 'a militiaman stands by the booth');
  Object.assign(p3, { x: st3.x + e3 * 66, z: OZ - 1.6, y: MP.top, vx: 0, vz: 0 });
  s3(2);
  for (let i = 0; i < 120 && (p3.x - st3.x) * e3 > MP.turn + 2.6; i++) s3(1, { fwd: 1, sprint: true, camYaw: N.yawOf(-e3, 0) });
  s3(1, { fwd: 1, sprint: true, camYaw: N.yawOf(-e3, 0), jump: true });
  for (let i = 0; i < 70; i++) s3(1, { fwd: 1, camYaw: N.yawOf(-e3, 0) });
  ok((p3.x - st3.x) * e3 < MP.turn && w3.wanted.level === 1, 'jumping the turnstile in front of the militia gives a wanted star');
  for (let i = 0; i < 60 * 12; i++) s3(1);
  ok(M3.peds.some(p => p.mm.role === 'mil' && p.ai.mode === 'cop') || w3.wanted.level === 0, 'the metro militia go after a fare dodger');
  ok(w3.heli === null || w3.heli === undefined || w3.heli.leave, 'no helicopter follows him underground');

  store.clear();
  const g4 = new N.Game(city, { seed: 79, headless: true, state: Object.assign(N.Game.newState(), { done: { m1: true }, money: 100, clock: 2 * 60 }) });
  const w4 = g4.world, p4 = w4.player;
  g4.teleport('mg0');
  w4.ev.length = 0;
  g4.step(1 / 60, {});
  g4.cool.clear();
  const m4 = g4.markers().find(m => m.id === 'tele_metro0_a');
  p4.x = m4.x; p4.z = m4.z;
  for (let i = 0; i < 60; i++) g4.step(1 / 60, {});
  ok(!city.inside(p4.x) && g4.msg.help && /закрыто/.test(g4.msg.help.text), 'the metro is closed at night (00:10–05:15)');
  w4.clock = 14 * 60;
  w4.setWanted(4);
  g4.cool.clear();
  for (let i = 0; i < 60; i++) g4.step(1 / 60, {});
  ok(!city.inside(p4.x) && /перекрыт/.test(g4.msg.help.text), 'four stars close the entrances');
  w4.setWanted(0);
  g4.cool.clear();
  for (let i = 0; i < 60; i++) g4.step(1 / 60, {});
  ok(city.inside(p4.x), 'by day without stars the door opens');

  const w5 = new N.World(city, { seed: 5, clock: 12 * 60, settings: { ambient: false } });
  const M5 = w5.metro;
  let victim = null, trn = null;
  for (let i = 0; i < 60 * 300 && !victim; i++) {
    w5.step(1 / 60, {});
    trn = M5.trains.find(q => q.v > 15 && q.track === 0 && q.x > ML.st[0].x + 200 && q.x < ML.st[1].x - 300);
    if (trn) { victim = w5.spawnPed('worker', trn.x + 140, ML.zE, 0); victim.y = MP.bed; victim.ai = { mode: 'idle' }; }
  }
  for (let i = 0; i < 60 * 12 && victim && !victim.dead; i++) w5.step(1 / 60, {});
  ok(victim && victim.dead, 'a train kills whoever stands on the track');
  ok(M5.trains.every(q => q.cars.every(c => Number.isFinite(c.x) && Number.isFinite(c.z))), 'train positions stay finite');

  store.clear();
  const g6 = new N.Game(city, { seed: 80, headless: true, state: Object.assign(N.Game.newState(), { done: { m1: true }, money: 100, clock: 10 * 60 }) });
  const w6 = g6.world, p6 = w6.player, M6 = w6.metro;
  let t6 = null;
  for (let i = 0; i < 60 * 300 && !t6; i++) { g6.step(1 / 60, {}); w6.ev.length = 0; t6 = M6.trains.find(q => q.stop === 0 && q.dir > 0 && q.doors > 0.95); }
  const c6 = t6.cars[1];
  g6.teleport('mpl_pk');
  Object.assign(p6, { x: c6.x, z: c6.z, y: 0, vx: 0, vz: 0 });
  g6.fade = null;
  for (let i = 0; i < 3; i++) { g6.step(1 / 60, {}); w6.ev.length = 0; }
  ok(M6.player.aboard && M6.player.aboard.tr === t6 && M6.eye() && Math.abs(M6.eye().y - 1.62 * (p6.look.tall || 1)) < 0.01, 'inside a car the camera goes to his eyes');
  const nx6 = M6.skipTime(t6), clock6 = w6.clock;
  ok(nx6 && nx6.st === 1 && nx6.d > 60 && nx6.d < 160, 'the next stop to skip to is Кировская in ' + Math.round(nx6.d) + ' s');
  ok(g6.metroSkip(), 'X starts the skip');
  for (let i = 0; i < 90; i++) { g6.step(1 / 60, {}); w6.ev.length = 0; }
  ok(M6.player.aboard && M6.player.aboard.tr === t6 && t6.stop === 1 && t6.doors > 0.9 && Math.abs(p6.x - ML.st[1].x) < 45 && !p6.dead, 'the skip brings the train with him to Кировская, doors open');
  ok(Math.abs(((w6.clock - clock6 + 1440) % 1440) - nx6.d) < 3, 'the clock moves on by the skipped ride');
  const sep6 = [];
  for (const a of M6.trains) for (const b of M6.trains) if (a !== b && a.track === b.track && a.track >= 0) sep6.push(Math.abs(a.x - b.x));
  ok(sep6.every(d => d > TR.span), 'trains keep their spacing after the skip');
  const cd6 = M6.player.aboard.c, dx6 = cd6.x + cd6.ex * 2.3, dz6 = cd6.z + cd6.ez * 2.3;
  for (let i = 0; i < 200 && Math.hypot(dx6 - p6.x, dz6 - p6.z) > 0.25; i++) { g6.step(1 / 60, { fwd: 1, camYaw: Math.atan2(dx6 - p6.x, -(dz6 - p6.z)) }); w6.ev.length = 0; }
  for (let i = 0; i < 200 && M6.player.aboard; i++) { g6.step(1 / 60, { fwd: 1, camYaw: N.yawOf(0, Math.sign(OZ - p6.z)) }); w6.ev.length = 0; }
  ok(!M6.player.aboard && !M6.eye(), 'off the car the camera goes back behind him');

  const map = N.atlasMap(atlasLayout());
  const G = N.MetroGeo.build({ city, atlas: { map } });
  let maxUV = 0;
  for (const sg of G.segs) for (let i = 0; i < sg.mb.nv; i++) maxUV = Math.max(maxUV, Math.abs(sg.mb.f[i * 8 + 4]), Math.abs(sg.mb.f[i * 8 + 5]));
  ok(maxUV < 200, 'texture coordinates stay small far from the origin (max ' + Math.round(maxUV) + ')');
  let plug = 0;
  for (const q of ML.st) for (const e of [-1, 1]) {
    const xp = q.x + e * (MP.end + 0.6);
    for (const sg of G.segs) {
      const m = sg.mb;
      if (xp < sg.x0 || xp > sg.x1) continue;
      for (let i = 0; i < m.ni; i += 3) {
        const v = [m.idx[i], m.idx[i + 1], m.idx[i + 2]].map(k => [m.f[k * 8], m.f[k * 8 + 1], m.f[k * 8 + 2]]);
        if (v.every(p => Math.abs(p[0] - xp) < 0.05) && v.some(p => p[1] < 0) && v.some(p => p[1] > 2) && v.some(p => Math.abs(p[2] - OZ) > 4.5 && Math.abs(p[2] - OZ) < 8.5)) plug++;
      }
    }
  }
  ok(plug === 0, 'tunnel portals are open (' + plug + ' triangles across them)');
  const bad = mb => { for (let i = 0; i < mb.nv; i++) { const o = i * 8; for (const k of [0, 1, 2, 4, 5]) if (!isFinite(mb.f[o + k])) return true; } for (let i = 0; i < mb.ni; i++) if (mb.idx[i] >= mb.nv) return true; return false; };
  const verts = G.segs.reduce((a, s) => a + s.mb.nv, 0);
  ok(G.segs.length > 20 && G.segs.every(s => !bad(s.mb) && s.x1 > s.x0), 'metro geometry buffers valid (' + G.segs.length + ' segments, ' + verts + ' vertices)');
  ok(verts < 160000 && G.clocks.length === 8 && G.exits.length === ML.gates.length && G.tlamps.length > 150, 'stations, clocks, exits and tunnel lamps');
  ok(ML.signs.every(s => map[s.style + '|' + s.text]), 'every metro sign is in the atlas');
  for (const cab of [0, 1]) {
    const m = N.MetroDraw.carMesh(cab);
    ok(!bad(m.body) && !bad(m.ins) && !bad(m.gl) && m.body.nv < 4000 && m.ins.nv < 4000, '81-71' + (cab ? '7 head' : '4 middle') + ' car mesh');
  }
  ok(N.MetroDraw.carMesh(1).lamps.filter(a => a.k === 'head').length === 4, 'the head car has four headlamps');
  const dq = new N.Dyn(64), pm = new N.MB(8);
  pm.quad([0, 0, 0, 0.001, 0, 0, 0.001, 0.001, 0, 0, 0.001, 0], [0, 0, 1], [0, 0, 1, 0, 1, 1, 0, 1], [255, 255, 255, 255], 0, 0);
  const wx = ML.st[1].x + 0.0004, org = [Math.round(ML.st[1].x), 0, OZ];
  dq.reset(org);
  dq.add(pm, N.M3.euler(0, 0, 0, wx, 1.2, OZ + 0.5), null);
  ok(Math.abs(dq.f[0] - (Math.fround(wx) - org[0])) < 1e-5 && Math.abs(dq.f[8] - dq.f[0] - 0.001) < 2e-5, 'dynamic geometry is written relative to the camera origin with sub-millimetre precision 22 km from the centre');
  const rb = N.rebaseMesh(Object.assign(new N.MB(8), {}), [0, 0, 0]);
  ok(rb.nv === 0, 'rebase of an empty mesh');
  const sh = N.GLSL;
  ok(['world', 'sprite', 'fx'].every(k => /uniform vec3 u_org;/.test(sh[k][0]) && /v_w = [^;]*\+ u_org/.test(sh[k][0])), 'world, sprite and fx shaders take positions relative to u_org');
  ok(/gl_Position = u_vp \* vec4\(p - u_eyeL, 1\.0\)/.test(sh.world[0]), 'world geometry is projected relative to the eye, so far-off signs do not z-fight with their plates');
});

section('vegetation', () => {
  const C = city.greenCount, props = t => city.props.filter(p => p.type === t);
  ok(city.bushes.length > 15000 && C.hedge > 400 && C.boulder > 1000 && C.reeds > 2000 && C.tires > 100 && C.tirebed > 1000 && C.stump > 300 && C.log > 100 && C.lily > 100 && C.swan > 50, 'bushes, hedges, boulders, reeds, painted tyres, flower beds, stumps, logs, lilies ' + JSON.stringify(C));
  ok(C.rowan > 500 && props('tree').some(p => p.kind === 'pollard') && C.ashmaple > 20 && C.willow > 50, 'rowans in front gardens, pollarded poplars on avenues, ash-leaved maples by garages, willows by ponds');
  const pathHash = new N.SpatialHash(16);
  for (const l of city.foot.concat(city.surf)) for (let i = 2; i < l.pts.length; i += 2) { const ax = l.pts[i - 2], az = l.pts[i - 1], bx = l.pts[i], bz = l.pts[i + 1], w = l.w / 2; pathHash.insert({ ax, az, bx, bz, w, x0: Math.min(ax, bx) - w, z0: Math.min(az, bz) - w, x1: Math.max(ax, bx) + w, z1: Math.max(az, bz) + w }); }
  const onPath = (x, z) => pathHash.query(x, z, x, z, it => N.segDist2(x, z, it.ax, it.az, it.bx, it.bz)[0] < (it.w + 0.3) * (it.w + 0.3));
  const places = Object.values(city.places).filter(p => isFinite(p.x));
  const nearPlace = (x, z) => places.some(p => Math.hypot(p.x - x, p.z - z) < 5);
  const soft = [GT.GRASS, GT.FOREST, GT.FIELD];
  const land = ['bush', 'hedge', 'weeds', 'tirebed', 'swan', 'stump', 'log', 'tires'];
  const badLand = [];
  let badPath = 0, badPlace = 0;
  for (const p of city.props) {
    if (!land.includes(p.type)) continue;
    const wet = p.type === 'bush' && p.kind === 'willowbush';
    if (city.surfaceAt(p.x, p.z) !== 3 || inBuilding(p.x, p.z) || (!wet && !soft.includes(city.ground(p.x, p.z)))) badLand.push(p.type);
    if (onPath(p.x, p.z)) badPath++;
    if (nearPlace(p.x, p.z)) badPlace++;
  }
  ok(!badLand.length, 'plants and garden things stand on soft ground, never on roads, sidewalks or inside houses (' + badLand.slice(0, 5) + ')');
  ok(!badPath && !badPlace, 'no plant blocks a footpath, a yard drive or a mission spot (' + badPath + ', ' + badPlace + ')');
  const rocks = props('boulder');
  const solid = (p, kind, poly) => { let hit = false; city.hash.query(p.x - 0.1, p.z - 0.1, p.x + 0.1, p.z + 0.1, it => { if (it.kind === kind && (poly ? N.pointInPoly(it.poly, p.x, p.z) : Math.hypot(it.x - p.x, it.z - p.z) < 0.05)) { hit = true; return true; } }); return hit; };
  ok(rocks.every(p => solid(p, 'rock')), 'every boulder is solid');
  ok(props('stump').every(p => solid(p, 'stump')) && props('log').every(p => solid(p, 'log', true)), 'stumps and fallen logs are solid');
  ok(rocks.filter(p => !p.paint).length > 300 && rocks.filter(p => p.paint).length > 200, 'painted and bare boulders');
  ok(props('reeds').every(p => { const wa = city.waterAt(p.x, p.z); return wa && wa.pond && Math.abs(p.y - wa.bed) < 1e-6 && wa.level - wa.bed < 1.3; }), 'reeds grow in the shallows of the ponds');
  ok(props('lily').every(p => { const wa = city.waterAt(p.x, p.z); return wa && wa.pond && p.y === wa.level; }), 'water lilies float on the ponds');
  const hedges = props('hedge');
  ok(hedges.every(p => hedges.some(q => q !== p && Math.hypot(q.x - p.x, q.z - p.z) < 2.2)), 'hedges come in runs, not lone boxes');
  let inHash = 0;
  for (const b of city.bushes) city.bushHash.query(b.x, b.z, b.x, b.z, it => { if (it === b) { inHash++; return true; } });
  ok(inHash === city.bushes.length, 'every bush is a soft zone in the bush index');
  ok('fp'.includes(city.luAt(city.places.ferris.x, city.places.ferris.z)) && city.luAt(-99999, 0) === '', 'land use lookup knows the park');
  ok(['yard', 'hedge', 'tires', 'boulders', 'forest', 'pond', 'riprap'].every(k => city.greenSpots[k]), 'F7 has a spot for every kind of greenery');

  const fresh = () => { const w = new N.World(city, { seed: 3, settings: { ambient: false } }); for (const v of w.vehs.slice()) w.removeVehicle(v); for (const q of w.peds.slice()) if (q !== w.player) w.removePed(q); return w; };
  const clearRun = (x, z, fx, fz, a, b, skip) => {
    for (let t = a; t <= b; t += 0.5) {
      const px = x + fx * t, pz = z + fz * t;
      if (city.ground(px, pz) === GT.WATER || city.surfaceAt(px, pz) === 0) return false;
      let hit = false;
      city.hash.query(px - 1.4, pz - 1.4, px + 1.4, pz + 1.4, it => { if (it === skip) return; if (it.kind === 'edge' || (it.circle ? Math.hypot(it.x - px, it.z - pz) < it.r + 1.4 : it.poly ? N.pointInPoly(it.poly, px, pz) || N.circlePoly(px, pz, 1.4, it.poly) : true)) { hit = true; return true; } });
      if (hit) return false;
    }
    return true;
  };
  const hd = city.places.hotel_door;
  let lane = null;
  for (const b of city.bushes) {
    if (b.hedge || b.r < 1 || Math.hypot(b.x - hd.x, b.z - hd.z) > 2500) continue;
    for (let k = 0; k < 8 && !lane; k++) {
      const a = k / 8 * Math.PI * 2, fx = Math.cos(a), fz = Math.sin(a);
      if (!clearRun(b.x, b.z, fx, fz, -18, 10)) continue;
      let others = 0;
      for (let t = -18; t <= 10; t += 1) city.bushHash.query(b.x + fx * t, b.z + fz * t, b.x + fx * t, b.z + fz * t, q => { if (q !== b && Math.hypot(q.x - b.x - fx * t, q.z - b.z - fz * t) < q.r + 1.2) others++; });
      if (!others) lane = { b, fx, fz };
    }
    if (lane) break;
  }
  ok(!!lane, 'a bush with a clear run-up for a car');
  const drive = through => {
    const w = fresh(), { b, fx, fz } = lane;
    const v = w.spawnVehicle('vaz2107', b.x - fx * 16, b.z - fz * 16, Math.atan2(fx, -fz));
    w.seat(w.player, v, true);
    const keep = city.bushHash;
    if (!through) city.bushHash = new N.SpatialHash(16);
    let rustle = 0;
    for (let i = 0; i < 40; i++) { v.vx = fx * 12; v.vz = fz * 12; w.step(1 / 60, {}); w.ev.length = 0; }
    for (let i = 0; i < 90; i++) { w.step(1 / 60, {}); for (const e of w.ev) if (e.t === 'rustle') rustle++; w.ev.length = 0; }
    city.bushHash = keep;
    return { sp: Math.hypot(v.vx, v.vz), rustle, hp: v.hp };
  };
  const open = drive(false), bush = drive(true);
  ok(bush.sp < open.sp - 0.8 && bush.rustle >= 1 && open.rustle === 0 && bush.hp === open.hp, 'a car ploughs through a bush: it slows (' + open.sp.toFixed(1) + ' -> ' + bush.sp.toFixed(1) + ' m/s), rustles and takes no damage');
  const hideOne = inside => {
    const w = fresh(), pl = w.player, b = lane.b;
    const cop = { x: b.x - lane.fx * 16, z: b.z - lane.fz * 16 };
    pl.x = inside ? b.x : b.x + lane.fx * 8; pl.z = inside ? b.z : b.z + lane.fz * 8; pl.y = city.groundY(pl.x, pl.z);
    const m = w.spawnPed('militia', cop.x, cop.z, Math.atan2(lane.fx, -lane.fz));
    m.ai = null;
    w.setWanted(1);
    let hidden = false;
    for (let i = 0; i < 90; i++) { m.x = cop.x; m.z = cop.z; m.wantVx = m.wantVz = 0; w.step(1 / 60, {}); hidden = hidden || w.hidden; w.ev.length = 0; }
    return { unseen: w.wanted.unseen, hidden };
  };
  const inBushP = hideOne(true), outP = hideOne(false);
  ok(inBushP.hidden && inBushP.unseen > 0 && !outP.hidden && outP.unseen === 0, 'standing still in a bush hides the player from a militiaman 16 m away; stepping out shows him again (' + inBushP.unseen + ', ' + outP.unseen + ')');
  const shoot = it => {
    const w = fresh(), pl = w.player, a = Math.atan2(lane.fz, lane.fx);
    pl.x = it.x - Math.cos(a) * 6; pl.z = it.z - Math.sin(a) * 6; pl.y = city.groundY(pl.x, pl.z);
    const hy = it.kind === 'rock' ? 0.35 : 1.2;
    w.fire(pl, 'pm', pl.x, hy, pl.z, Math.cos(a), 0, Math.sin(a), 0);
    const e = w.ev.find(q => q.t === 'spark');
    return e && e.mat;
  };
  const target = kind => city.circles.find(c => c.kind === kind && Math.hypot(c.x - hd.x, c.z - hd.z) < 3000 && clearRun(c.x, c.z, -lane.fx, -lane.fz, 1.5, 6, c));
  const rockCol = target('rock'), treeCol = target('tree');
  ok(rockCol && shoot(rockCol) === 'stone' && treeCol && shoot(treeCol) === 'wood', 'bullets chip stone off boulders and wood off trunks');
  store.clear();
  const g = new N.Game(city, { seed: 21, headless: true, state: Object.assign(N.Game.newState(), { done: { m1: true } }) });
  const ui = { game: g, city, el: { focus() {} }, audio: { on: false }, resetCam() {} };
  new N.Debug(ui).act('green', 'pond');
  const sp = city.greenSpots.pond;
  ok(Math.hypot(g.world.player.x - sp.x, g.world.player.z - sp.z) < 30, 'F7 «Природа» takes the player to the reeds');
});

section('park', () => {
  const D = city.parkData, PK = N.PARK, PL = city.places, W = D.wheel, A = D.attr.poly;
  const land = city.land.find(l => /Автозаводский парк культуры/.test(l.name));
  const inPark = (x, z) => N.pointInPoly(land.poly, x, z);
  const of = t => city.props.filter(p => p.type === t && inPark(p.x, p.z));
  ok(land && D.wheel && D.tir && D.dance && D.cinema && D.attr && D.foods.length === 3, 'park data: wheel, shooting gallery, dance floor, cinema, attractions area and three food stalls');
  const fountains = of('fountain');
  ok(fountains.length === 17 && fountains.filter(p => p.kind === 'cup').length === 15 && fountains.some(p => p.kind === 'tiers') && fountains.some(p => p.kind === 'pool'), 'seventeen fountains: the tiered one on the square, the long pool and fifteen cups');
  const gate = city.props.find(p => p.type === 'parkgate');
  ok(gate && Math.hypot(gate.x - PK.gate[0], gate.z - PK.gate[1]) < 12 && !fenceNear(gate.x, gate.z, 2), 'the main gate stands at the end of the alley and is open');
  const base = of('ferrisbase')[0];
  ok(base && Math.hypot(base.x - W.x, base.z - W.z) < 0.5 && N.pointInPoly(A, W.x, W.z), 'the Ferris wheel stands inside the attractions area');
  ok(['autodrom', 'swings', 'waltz', 'carousel', 'tir'].every(t => of(t).some(p => N.pointInPoly(A, p.x, p.z))), 'rides and the shooting gallery stand inside the attractions area');
  ok(city.zoneAt(W.x, W.z) === 'Городок аттракционов' && city.zoneAt(PK.square.x, PK.square.z) === 'Автозаводский парк', 'zone names of the park and the attractions area');
  const edge = (x, z) => { let d = Infinity; for (let i = 0; i < A.length; i += 2) { const j = (i + 2) % A.length; d = Math.min(d, N.segDist2(x, z, A[i], A[i + 1], A[j], A[j + 1])[0]); } return Math.sqrt(d); };
  const ring = city.boxes.filter(b => b.kind === 'fence' && edge((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2) < 0.5);
  ok(ring.length > 30 && !fenceNear(PK.attr.gate[0], PK.attr.gate[1], 1.5), 'the attractions area is fenced and its gate is open (' + ring.length + ' panels)');
  ok(city.fenceSegs.filter(f => f.tex === 'metalfence' && edge((f.ax + f.bx) / 2, (f.az + f.bz) / 2) < 0.5).every(f => f.panel), 'every fence panel of the attractions area has a collider');
  const cinema = city.buildings.find(b => b.lm && b.lm.type === 'rodina');
  ok(cinema && Math.hypot(cinema.cx - PK.cinema.x, cinema.cz - PK.cinema.z) < 3, 'the Rodina summer cinema stands at its place');
  const texts = new Set(city.signs.map(s => s.text));
  ok(['КИНОТЕАТР «РОДИНА»', 'ГОРОДОК АТТРАКЦИОНОВ', 'КОЛЕСО ОБОЗРЕНИЯ', 'ТИР', 'ШАУРМА', 'ПАРК', 'КУЛЬТУРЫ И ОТДЫХА'].every(t => texts.has(t)), 'park signs');
  const spots = ['park_square', 'park_fountain', 'park_alley', 'park_round', 'park_cinema', 'park_dance', 'park_side', 'park_attr', 'park_meet', 'park_cars', 'park_gate'];
  const markers = ['ferris', 'tir', 'food_square', 'food_attr', 'food_side'];
  for (const k of spots.concat(markers)) ok(PL[k] && !inBuilding(PL[k].x, PL[k].z) && !city.waterAt(PL[k].x, PL[k].z), 'park place ' + k + ' is on dry land');
  const inWheel = t => Math.abs((t.x - W.x) * W.nx + (t.z - W.z) * W.nz) < 4 && Math.abs((t.x - W.x) * W.ux + (t.z - W.z) * W.uz) < W.r + 2.5;
  ok(of('tree').every(t => !inWheel(t) && Math.hypot(t.x - D.dance.x, t.z - D.dance.z) > D.dance.r), 'no tree grows into the wheel or the dance floor');

  store.clear();
  const g = new N.Game(city, { seed: 51, headless: true, state: Object.assign(N.Game.newState(), { done: { m1: true }, money: 500 }) });
  const w = g.world, pl = w.player, pk = w.park, bot = makeBot(g), S = g.state.park;
  ok(pk && pk.tir && !g.mission, 'the world runs the park');
  for (const k of spots) {
    bot.putAt(PL[k].x, PL[k].z);
    bot.frames(20);
    ok(Math.hypot(pl.x - PL[k].x, pl.z - PL[k].z) < 0.5 && !g.shop && !pl.ride, 'the player can stand at ' + k);
  }
  const ms = g.markers(), icons = g.radarIcons();
  ok(['park_ride', 'park_tir', 'park_food_square', 'park_food_attr', 'park_food_side'].every(id => ms.some(m => m.id === id)), 'park markers');
  ok(['wheel', 'tir', 'food'].every(i => icons.some(r => r.icon === i)), 'park icons on the radar');

  bot.putAt(PL.ferris.x + 5, PL.ferris.z + 3);
  bot.frames(10);
  let money = g.state.money;
  bot.putAt(PL.ferris.x, PL.ferris.z);
  bot.frames(60);
  ok(pl.ride && g.state.money === money - W.ticket && S.rides === 1, 'the wheel marker sells a ticket and seats the player in a cabin');
  ok(!g.markers().some(m => m.id === 'park_ride'), 'no wheel marker while riding');
  const ground = city.groundY(W.x, W.z), cab = pk.cabin(pl.ride.i);
  ok(Math.abs(pl.x - cab.x) < 0.01 && Math.abs(pl.z - cab.z) < 0.01 && pl.y - ground < 3, 'the ride starts in the bottom cabin');
  pk.advance(((Math.PI - pk.cabin(pl.ride.i).ph) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2) * W.period);
  bot.frames(2);
  ok(pl.ride && pl.y - ground > W.hub + W.r - W.hang - 1.5, 'the cabin reaches the top ' + (pl.y - ground).toFixed(1) + ' m');
  const top = pl.ride.i;
  bot.frames(2, { enter: true });
  ok(pl.ride && pl.ride.i === top, 'the cabin door stays shut at the top');
  bot.frames(60 * 5);
  ok(pl.ride && Math.hypot(pl.x - pk.cabin(pl.ride.i).x, pl.z - pk.cabin(pl.ride.i).z) < 0.01, 'the player rides along with the cabin');
  const clock = w.clock;
  ok(g.metroSkip(), 'the skip key turns the wheel to the end of the lap');
  bot.frames(90);
  ok(!pl.ride && Math.hypot(pl.x - W.exit[0], pl.z - W.exit[1]) < 0.6 && Math.abs(pl.y - city.groundY(pl.x, pl.z)) < 0.3 && w.clock !== clock, 'after the lap the player steps out at the exit and the clock moves on');
  bot.putAt(PL.ferris.x + 6, PL.ferris.z + 4);
  bot.frames(10);
  money = g.state.money;
  bot.putAt(PL.ferris.x, PL.ferris.z);
  bot.frames(30);
  ok(pl.ride, 'the second ride starts');
  pk.advance(pk.rideLeft(pl) - 2);
  bot.frames(60 * 4);
  ok(!pl.ride && g.state.money === money - W.ticket && Math.hypot(pl.x - W.exit[0], pl.z - W.exit[1]) < 0.6, 'a full lap ends at the bottom by itself');
  g.state.money = 5;
  bot.putAt(PL.ferris.x + 6, PL.ferris.z + 4);
  bot.frames(10);
  bot.putAt(PL.ferris.x, PL.ferris.z);
  bot.frames(30);
  ok(!pl.ride && g.state.money === 5 && g.msg.help && /Билет/.test(g.msg.help.text), 'no ride without money for the ticket');
  g.state.money = 500;

  const F = PL.food_square;
  bot.putAt(F.x + 6, F.z + 4);
  bot.frames(10);
  const vendor = pk.staff.get('food_square');
  ok(vendor && !vendor.dead && vendor.fixed && Math.hypot(vendor.x - D.foods[0].vendor.x, vendor.z - D.foods[0].vendor.z) < 0.1, 'a vendor stands in the shawarma stall');
  pl.hp = 40;
  bot.putAt(F.x, F.z);
  bot.frames(2);
  ok(g.shop && g.shop.kind === 'food' && g.shop.stall === 'food_square' && g.shop.items.length === PK.menu.length, 'the stall marker opens the menu');
  money = g.state.money;
  ok(g.buy(0) && !g.shop && pl.eat && g.state.money === money - PK.menu[0].price, 'the player buys a shawarma and starts eating');
  bot.frames(Math.ceil(PK.menu[0].dur * 60) + 10);
  ok(!pl.eat && Math.abs(pl.hp - (40 + PK.menu[0].hp)) < 0.5 && S.eaten === 1, 'the shawarma restores health ' + pl.hp.toFixed(1));
  pl.hp = pl.maxHp;
  g.openShop('food', 'food_square');
  money = g.state.money;
  ok(!g.buy(0) && /сыт/.test(g.shop.msg) && g.state.money === money, 'no shawarma on a full stomach');
  ok(g.buy(2) && pl.eat && pl.eat.id === 'kvass', 'kvass is sold any time');
  bot.frames(5, { aim: true });
  ok(!pl.eat, 'taking aim interrupts the drink');
  w.setWanted(1);
  ok(!pk.open('food_square').ok && /ментами/.test(pk.open('food_square').why), 'the vendor shuts the window for a wanted player');
  w.setWanted(0);
  ok(pk.open('food_square').ok, 'the stall opens again');

  const T = pk.tir, TP = PK.tir, TD = D.tir;
  bot.putAt(PL.tir.x + 6, PL.tir.z + 5);
  bot.frames(10);
  ok(pk.staff.get('tir') && !pk.staff.get('tir').dead, 'the keeper stands behind the counter');
  w.giveWeapon(pl, 'pm', 30);
  pl.weapon = 'pm';
  const before = Object.keys(pl.weapons).sort().join(',');
  bot.putAt(PL.tir.x, PL.tir.z);
  bot.frames(2);
  ok(g.shop && g.shop.kind === 'tir' && g.shop.items[0].price === TP.price, 'the shooting gallery marker opens its counter');
  money = g.state.money;
  ok(g.buy(0), 'a round is bought');
  bot.frames(60);
  ok(pl.tir && T.on && pl.weapon === 'izh38' && Object.keys(pl.weapons).sort().join(',') === 'fists,izh38' && g.state.money === money - TP.price, 'the keeper hands over an IZh-38 for the round');
  ok(Math.hypot(pl.x - TD.stand.x, pl.z - TD.stand.z) < 0.05 && !g.markers().some(m => m.id === 'park_tir'), 'the player stands at the counter');
  const m = Math.hypot(T.bias[0], T.bias[1]);
  ok(m >= TP.bias[0] - 1e-9 && m <= TP.bias[1] + 1e-9, 'every rifle has a crooked sight');
  const shoot = (x, y, z, fix) => {
    const M = w.muzzle(pl);
    let dx = x - M.x, dy = y - M.y, dz = z - M.z;
    const L = Math.hypot(dx, dy, dz);
    dx /= L; dy /= L; dz /= L;
    const b = fix ? pk.biasFor(pl, 'izh38') : [0, 0, 0];
    dx -= b[0]; dy -= b[1]; dz -= b[2];
    const K = Math.hypot(dx, dy, dz);
    g.step(1 / 60, { fire: true, firePressed: true, aim: true, aimO: [M.x, M.y, M.z], aimD: [dx / K, dy / K, dz / K] });
    w.ev.length = 0;
    bot.frames(Math.ceil(N.WEAPONS.izh38.reload * 60) + 8);
    return M;
  };
  const aimAt = (q, fix) => { const [x, z] = pk.tirWorld(q.u, q.z); return shoot(x, q.y, z, fix); };
  const ducks = () => pk.tirTargets().filter(q => q.tg.kind === 'duck' && !q.tg.hit && Math.abs(q.u) < 2.4);
  const left = () => { const s = T.on && pl.weapons.izh38; return s ? s.clip + s.ammo : 0; };
  const shootDucks = () => { for (let k = 0; k < 60 && left() > 0; k++) { const q = ducks()[0]; if (q) aimAt(q, true); else bot.frames(20); } };
  T.bias = [0.1, 0];
  const f0 = T.figures[0];
  const M0 = aimAt(f0, false);
  ok(!f0.hit && T.hits === 0 && T.dents.length === 1, 'a dead-centre shot with the crooked sight misses and dents the back wall');
  const [mlx, mlz] = pk.tirLocal(M0.x, M0.z), lx = pk.tirLocal(T.dents[0][0], T.dents[0][2])[0];
  const across = k => { const ex = f0.u - mlx, ez = f0.z - mlz, ey = f0.y - M0.y, L = Math.hypot(ex, ey, ez); return mlx + (ex / L + k) / (ez / L) * (TP.wall - mlz); };
  ok(Math.abs(lx - across(0.1 / 6.7)) < 0.04 && Math.abs(lx - across(0)) > 0.08, 'the pellet goes off to the side by the sight error');
  aimAt(f0, true);
  ok(f0.hit && T.hits === 1, 'aiming off by the sight error hits');
  bot.frames(30);
  ok(f0.down > 0.9, 'the hit figure falls');
  const sl = pl.weapons.izh38;
  ok(sl.clip === 1 && sl.ammo === TP.shots - 3, 'the rifle is broken open and loaded after every shot');
  for (const q of T.figures.slice(1)) aimAt(q, true);
  shootDucks();
  bot.frames(90);
  ok(!pl.tir && !T.on, 'the round ends when the pellets run out');
  ok(S.tirRounds === 1 && S.tirBest === 9 && T.hits === 9, 'nine of ten hits counted ' + T.hits);
  ok(g.state.money === money - TP.price + PK.prizes[1][1], 'nine hits win the second prize');
  ok(Object.keys(pl.weapons).sort().join(',') === before && pl.weapon === 'pm', 'the player gets the own weapons back');
  ok(g.state.unlocked.includes('izh38'), 'the air rifle goes on sale in the gun shop');
  bot.frames(60 * 30);
  ok(T.figures.every(f => !f.hit && f.down === 0), 'the keeper puts the figures back up');
  bot.putAt(PL.tir.x + 6, PL.tir.z + 5);
  bot.frames(10);
  bot.putAt(PL.tir.x, PL.tir.z);
  bot.frames(2);
  money = g.state.money;
  g.buy(0);
  bot.frames(60);
  T.bias = [0, 0];
  for (const q of T.figures) aimAt(q, true);
  shootDucks();
  bot.frames(90);
  ok(T.hits === 10 && S.tirPerfect === 1 && g.state.money === money - TP.price + PK.firstPrize, 'ten of ten wins the main prize');
  bot.putAt(PL.tir.x + 6, PL.tir.z + 5);
  bot.frames(10);
  bot.putAt(PL.tir.x, PL.tir.z);
  bot.frames(2);
  g.buy(0);
  bot.frames(60);
  money = g.state.money;
  bot.frames(2, { enter: true });
  ok(!pl.tir && pl.weapon === 'pm' && g.state.money === money && S.tirRounds === 3, 'F leaves the counter early without a prize');
  bot.putAt(PL.park_square.x, PL.park_square.z);
  bot.frames(5);
  const vic = w.spawnPed('worker', pl.x + 4, pl.z, 0);
  w.buildGrid();
  w.giveWeapon(pl, 'izh38', 10);
  pl.weapon = 'izh38';
  pl.yaw = N.yawOf(1, 0);
  const hp = vic.hp;
  pl.fireT = 0;
  w.handleWeapon(pl, 1 / 60, { fire: true, firePressed: true, aimO: [pl.x, pl.y + 1.3, pl.z], aimD: [1, 0, 0] }, false);
  ok(vic.hp < hp && vic.hp > hp - 20 && w.wanted.level === 0, 'the air rifle only stings and makes no noise');

  w.setWeather('clear', 'instant', true);
  bot.putAt(PL.park_dance.x, PL.park_dance.z);
  w.clock = 21.5 * 60;
  w.settings.ambient = true;
  bot.frames(30);
  ok(pk.dancers.length >= 10 && pk.dancers.every(p => Math.hypot(p.x - D.dance.x, p.z - D.dance.z) < D.dance.r), 'evening dancers on the dance floor ' + pk.dancers.length);
  w.clock = 12 * 60;
  bot.frames(5);
  ok(pk.dancers.length === 0, 'no dancers at noon');
  w.settings.ambient = false;
  bot.putAt(PL.food_side.x + 300, PL.food_side.z + 300);
  bot.frames(5);
  ok(pk.staff.size === 0, 'staff far from the player is removed');
});

section('photo mode', () => {
  store.clear();
  const P = N.PHOTO;
  ok(new Set(P.VIEWS.map(v => v.id)).size === P.VIEWS.length && P.VIEWS.length === 12, 'twelve distinct views for the newspaper');
  const spots = N.photoSpots(city);
  ok(spots.length === P.VIEWS.length, 'every view is found on the map: ' + spots.map(s => s.id).join(', '));
  ok(spots.every(s => isFinite(s.x + s.y + s.z + s.r) && s.r > 2 && s.dmax > s.r * 2), 'view anchors are finite');
  const g = new N.Game(city, { seed: 33, headless: true, state: Object.assign(N.Game.newState(), { done: { m1: true } }) });
  const w = g.world, pl = w.player;
  const full = { x0: 0, y0: 0, x1: 1, y1: 1 };
  const camAt = (x, y, z, tx, ty, tz, mm) => {
    const B = N.photoBasis(Math.atan2(tx - x, -(tz - z)), Math.atan2(ty - y, Math.hypot(tx - x, tz - z)), 0);
    return { x, y, z, f: B.f, r: B.r, u: B.u, tanV: Math.tan(N.lensFov(mm) / 2), asp: 4 / 3 };
  };
  const shots = {};
  for (const s of spots) {
    const dirs = [];
    if (s.side) { const a = Math.atan2(s.side.z - s.z, s.side.x - s.x); for (const da of [0, 0.3, -0.3, 0.6, -0.6]) dirs.push(a + da); }
    for (let i = 0; i < 16; i++) dirs.push(i / 16 * Math.PI * 2);
    let found = null;
    for (const mm of [21, 35, 50, 85, 135]) {
      const d = 2 * s.r / (2 * Math.tan(N.lensFov(mm) / 2) * 4 / 3 * 0.8);
      if (d > s.dmax || found) continue;
      for (const a of dirs) {
        const x = s.x + Math.cos(a) * d, z = s.z + Math.sin(a) * d;
        if (found || !city.inPlay(x, z) || inBuilding(x, z) || city.ground(x, z) === GT.WATER) continue;
        for (const hy of [1.7, 8, 20]) {
          const y = city.groundY(x, z) + hy;
          if (N.photoSeen(city, w, camAt(x, y, z, s.x, s.y, s.z, mm), full).includes(s.id)) { found = { x, y, z, mm }; break; }
        }
      }
    }
    ok(found, s.name + ' can be photographed from the play area' + (found ? ' (' + found.mm + ' mm, ' + Math.round(Math.hypot(found.x - s.x, found.z - s.z)) + ' m)' : ''));
    shots[s.id] = found;
  }
  {
    const s = spots.find(q => q.id === 'lenin'), f = shots.lenin;
    const seen = c => N.photoSeen(city, w, c, full).includes('lenin');
    ok(seen(camAt(f.x, f.y, f.z, s.x, s.y, s.z, f.mm)), 'the monument counts when it fills the frame');
    ok(!seen(camAt(f.x, f.y, f.z, 2 * f.x - s.x, s.y, 2 * f.z - s.z, f.mm)), 'not when the camera looks away');
    ok(!N.photoSeen(city, w, camAt(f.x, f.y, f.z, s.x, s.y, s.z, f.mm), { x0: 0.46, y0: 0.46, x1: 0.54, y1: 0.54 }).includes('lenin'), 'not when the crop shows only a piece of it');
    const fx = s.x + (f.x - s.x) * 8, fz = s.z + (f.z - s.z) * 8;
    ok(!seen(camAt(fx, f.y, fz, s.x, s.y, s.z, 18)), 'not when it is a speck in the distance');
    const mx = (f.x + s.x) / 2, mz = (f.z + s.z) / 2, wall = { x0: mx - 0.6, z0: mz - 0.6, x1: mx + 0.6, z1: mz + 0.6, y0: 0, y1: 40, kind: 'test' };
    city.hash.insert(wall);
    ok(!seen(camAt(f.x, f.y, f.z, s.x, s.y, s.z, f.mm)), 'not when something stands between the camera and it');
    city.hash.remove(wall);
    const d = spots.find(q => q.id === 'dk');
    const bx = d.x - (d.side.x - d.x) * 3, bz = d.z - (d.side.z - d.z) * 3;
    ok(!N.photoSeen(city, w, camAt(bx, 12, bz, d.x, d.y, d.z, 21), full).includes('dk'), 'the back of the Palace of Culture does not count');
  }
  const h = city.places.hotel_door;
  g.teleportTo(h.x, h.z);
  for (let i = 0; i < 20; i++) { g.step(1 / 60, {}); w.ev.length = 0; }
  const settings = N.defaultSettings();
  const ui = { game: g, city, settings, state: 'play', debug: { open: false }, audio: { on: false }, keys: new Set(), pressed: new Set(), mouse: {}, el: { focus() {} }, renderer: { canvas: { width: 1280, height: 720 } }, camState: { x: pl.x - 4, y: pl.y + 2.4, z: pl.z + 0.5, tx: pl.x, ty: pl.y + 1.5, tz: pl.z, fov: 1.05 }, acc: 0.5, paused: null, pause(t) { this.paused = t; } };
  const ph = new N.Photo(ui);
  g.cut = { shots: [] };
  ok(!ph.open() && /не до снимков/.test(ph.blocked()), 'no camera during a cutscene');
  g.cut = null;
  ui.state = 'menu';
  ok(!ph.open(), 'no camera in the main menu');
  ui.state = 'play';
  ok(ph.open() && ph.on && g.flags.photoHelp && ph.note, 'F8 opens the camera, the first time with a hint about the newspaper');
  const cs = ui.camState, c0 = ph.camera();
  ok(Math.hypot(c0.x - cs.x, c0.y - cs.y, c0.z - cs.z) < 1e-9 && c0.photo && P.LENSES[ph.lens] === 21 && Math.abs(c0.fov - 1.05) < 0.05, 'the photo camera starts where the game camera was, with a 21 mm lens');
  const look = [c0.tx - c0.x, c0.ty - c0.y, c0.tz - c0.z], gv = [cs.tx - cs.x, cs.ty - cs.y, cs.tz - cs.z];
  const lL = Math.hypot(...look), gL = Math.hypot(...gv);
  ok(Math.hypot(look[0] / lL - gv[0] / gL, look[1] / lL - gv[1] / gL, look[2] / lL - gv[2] / gL) < 1e-6, 'and looks the same way');
  const wt = w.t, wc = w.clock;
  ph.c.pitch = 1.3;
  ph.keys.add('KeyW');
  ph.keys.add('ShiftLeft');
  for (let i = 0; i < 300; i++) ph.step(1 / 30);
  ph.keys.clear();
  const A = ph.anchor, c = ph.c;
  ok(Math.hypot(c.x - A.x, c.y - A.y, c.z - A.z) <= P.reach + 1e-6 && ph.edgeT > 0, 'the camera stays within ' + P.reach + ' m of Tyoma and says so');
  ok(w.t === wt && w.clock === wc, 'the world does not move while the camera is out');
  ph.act('reset');
  ph.keys.add('AltLeft');
  for (let i = 0; i < 300; i++) ph.step(1 / 30);
  ph.keys.clear();
  ok(c.y >= ph.floorAt(c.x, c.z, c.y) + 0.29, 'the camera does not sink into the ground');
  const hb = city.hotelB;
  c.x = h.x; c.z = h.z; c.y = city.groundY(h.x, h.z) + 3; c.yaw = Math.atan2(hb.cx - h.x, -(hb.cz - h.z)); c.pitch = 0;
  ph.keys.add('KeyW');
  for (let i = 0; i < 150; i++) ph.step(1 / 30);
  ph.keys.clear();
  ok(!inBuilding(c.x, c.z), 'the camera stops at the hotel wall instead of flying into it');
  ph.keys.add('KeyE');
  for (let i = 0; i < 120; i++) ph.step(1 / 30);
  ph.keys.clear();
  ok(Math.abs(c.roll - 0.524) < 1e-6 && Math.abs(Math.hypot(...ph.camera().up) - 1) < 1e-6, 'the horizon tilts up to 30 degrees');
  ph.act('reset');
  ok(c.roll === 0 && P.LENSES[ph.lens] === 21, 'R puts the camera back');
  ph.wheel(-1);
  ph.wheel(-1);
  ok(P.LENSES[ph.lens] === 28 && ph.camera().fov < c0.fov, 'the wheel changes the lens');
  ph.prefs.stop = P.STOPS.length - 1;
  ok(ph.params(1280, 720).dof === null, 'f/16 keeps everything sharp');
  ph.prefs.stop = 0;
  ph.prefs.focus = 3;
  const k28 = ph.params(1280, 720).dof.k;
  ph.lens = P.LENSES.length - 1;
  const k200 = ph.params(1280, 720).dof.k;
  ok(k28 > 0 && k200 > k28 * 40 && ph.params(2560, 1440).dof.max > ph.params(1280, 720).dof.max, 'blur grows with focal length, aperture and picture size');
  ph.prefs.focus = 0;
  ph.adjust('focus', 1);
  ok(ph.prefs.focus > 0, 'a step right from auto focus locks the distance');
  ph.adjust('focus', -40);
  ok(ph.prefs.focus === 0, 'and steps back to auto');
  ph.adjust('film', 1);
  ok(ph.prefs.film === P.FILMS[1].id && JSON.parse(store.get('gtann_settings')).photo.film === P.FILMS[1].id, 'the film choice is remembered');
  ok(ph.params(1280, 720).film.id === P.FILMS[1].id && ph.params(1280, 720).ev === 1, 'the renderer gets the film');
  ph.adjust('ev', 3);
  ok(Math.abs(ph.params(1280, 720).ev - 2) < 1e-9, 'plus one stop doubles the exposure');
  ph.adjust('flash', 1);
  const fl = ph.params(1280, 720).flash;
  ok(fl && Math.hypot(fl.x - c.x, fl.z - c.z) < 1e-9 && fl.r > 10, 'the flash is a light at the camera');
  ph.adjust('tyoma', 1);
  ok(ph.camera().hidePlayer, 'Tyoma can be left out of the picture');
  ph.adjust('tyoma', 1);
  for (const row of N.Photo.ROWS) ok(typeof ph.value(row[1]) === 'string' && ph.value(row[1]).length > 0, 'panel row ' + row[1] + ' shows ' + ph.value(row[1]));
  ph.key({ code: 'Escape', repeat: false }, true);
  ok(!ph.on && ui.acc === 0, 'Esc puts the camera away');
  const r43 = N.photoCrop(1280, 720, '43', 'none');
  ok(Math.abs(r43.w / r43.h - 4 / 3) < 1e-9 && Math.abs(r43.h - 720) < 1e-9 && Math.abs(r43.x - (1280 - r43.w) / 2) < 1e-9, '4:3 crop fills the height');
  const r0 = N.photoCrop(1280, 720, 'screen', 'none');
  ok(r0.x === 0 && r0.w === 1280 && r0.h === 720, 'no crop and no frame: the whole screen');
  for (const fr of P.FRAMES) for (const as of P.ASPECTS) {
    const r = N.photoCrop(1280, 720, as.id, fr.id), e = 1e-6;
    ok(r.fx >= -e && r.fy >= -e && r.fx + r.fw <= 1280 + e && r.fy + r.fh <= 720 + e && r.x >= r.fx - e && r.y >= r.fy - e && r.x + r.w <= r.fx + r.fw + e && r.y + r.h <= r.fy + r.fh + e, 'frame ' + fr.id + ' with ' + as.id + ' fits the screen');
  }
  ok(N.photoStamp(0, 23 * 60 + 5, false)[0] === '’00  7 12' && N.photoStamp(21, 23 * 60 + 5, true).join(' ') === '02.08.2000 23:05', 'date stamps of a camera and a camcorder');
  const AL = N.PhotoAlbum;
  AL.mem.clear();
  let res = null;
  for (let i = 0; i < P.roll; i++) res = AL.save('data:image/jpeg;base64,QUJD', { zone: 'Соцгород', views: [] });
  ok(res.ok && res.n === P.roll && AL.count() === P.roll && !res.kept, 'a roll holds ' + P.roll + ' frames, kept for the session without a desktop');
  const over = AL.save('data:image/jpeg;base64,QUJD', {});
  ok(!over.ok && /Плёнка кончилась/.test(over.err), 'one more frame does not fit');
  ok(AL.remove('Снимок_003.jpg') && AL.count() === P.roll - 1, 'deleting a frame frees it');
  res = AL.save('data:image/jpeg;base64,QUJD', {});
  ok(res.ok && res.file === 'Снимок_025.jpg' && AL.list()[0].meta.zone === 'Соцгород', 'numbers go on after the last frame, metadata stays');
  AL.mem.clear();
  const m0 = g.state.money;
  const fresh = g.photoTaken(['dk', 'dk', 'nope']);
  ok(fresh.join() === 'dk' && g.state.money === m0 + P.fee && g.msg.pager.some(p => /АВТОЗАВОДЕЦ/.test(p.text)) && w.stats.photos === 1, 'a new view sells once to the newspaper');
  ok(!g.photoTaken(['dk']).length && g.state.money === m0 + P.fee && w.stats.photos === 2, 'the same view again pays nothing');
  g.photoTaken(P.VIEWS.map(v => v.id));
  ok(g.state.views.length === P.VIEWS.length && g.state.money === m0 + P.fee * P.VIEWS.length + P.bonus && g.progress().views === P.VIEWS.length, 'all views pay the bonus');
  ok(g.snapshot().views.length === P.VIEWS.length && g.snapshot().stats.photos === 3, 'views and the photo count are saved');
  const day0 = g.state.day;
  w.clock = 1439.99;
  g.state.clock = w.clock;
  g.step(1 / 60, {});
  w.ev.length = 0;
  ok(g.state.day === day0 + 1 && w.clock < 1, 'midnight turns the date on the photos');
  ok(N.GLSL.dof && /u_dof/.test(N.GLSL.dof[1]) && /u_pf/.test(N.GLSL.comp[1]), 'depth of field and film shaders');
  ok(read('index.html').includes('nn-photo.js') && /F8/.test(read('js/apps/gtann/nn-menus.js')), 'photo mode is loaded and listed in the controls');
});

section('radio', () => {
  const R = N.RADIO, OFF = R.length;
  ok(R.length === 8 && ['id', 'freq', 'file'].every(k => new Set(R.map(r => r[k])).size === 8), 'eight stations with their own id, frequency and file');
  ok(R.map(r => r.name).join('|') === 'Максимум|Love Radio|Хит FM|Юмор FM|Динамит FM|Наше Радио|Пиратская Станция|Клуб FM', 'station names in dial order');
  for (const r of R) {
    const f = path.join(ROOT, N.RADIO_DIR, r.file + '.mp3');
    ok(fs.existsSync(f) && fs.statSync(f).size > r.len * 15500 && fs.statSync(f).size < r.len * 16500, 'broadcast file ' + r.file + ' matches its length at 128 kbit/s');
  }
  const t = 1.7e9;
  ok(R.every((r, i) => { const a = N.radioPos(i, t), b = N.radioPos(i, t + 5); return a >= 0 && a < r.len && (Math.abs(b - a - 5) < 1e-6 || b < 5); }), 'every station keeps broadcasting in real time');
  ok(new Set(R.map((r, i) => Math.round(N.radioPos(i, t)))).size === 8, 'stations are at different moments of their broadcast');
  ok(N.radioPos(0, t, 100) < 100, 'the decoded duration overrides the table length');
  const g = new N.Game(city, { seed: 41, headless: true, state: N.Game.newState() });
  const w = g.world, pl = w.player;
  const civil = w.spawnVehicle('vaz2106', pl.x + 4, pl.z, 0, {});
  const cop = w.spawnVehicle('vaz2107', pl.x + 8, pl.z, 0, { livery: 'militia' });
  const tank = w.spawnVehicle('t72', pl.x + 14, pl.z, 0, { livery: 'army' });
  ok(N.carStation(civil) === civil.id % (OFF + 1) && N.carStation(civil) === civil.radio, 'a civil car keeps the station its owner left on');
  ok(N.carStation(cop) === OFF && N.carStation(tank) === OFF, 'militia cars and armour have the radio off');
  const els = [];
  const param = () => ({ value: 0, setTargetAtTime(v) { this.value = v; }, cancelScheduledValues() { }, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.value = v; }, exponentialRampToValueAtTime(v) { this.value = v; } });
  const node = () => ({ gain: param(), frequency: param(), Q: param(), playbackRate: param(), connect() { }, disconnect() { }, start() { }, stop() { } });
  globalThis.window = { AudioContext: class { constructor() { this.currentTime = 0; this.sampleRate = 8000; this.destination = {}; } createGain() { return node(); } createBiquadFilter() { return node(); } createBufferSource() { return node(); } createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; } createMediaElementSource() { return node(); } close() { } } };
  globalThis.document = { createElement: () => { const el = { L: {}, paused: true, readyState: 0, duration: NaN, currentTime: 0, addEventListener(k, f) { (this.L[k] = this.L[k] || []).push(f); }, fire(k) { for (const f of this.L[k] || []) f(); }, play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; }, removeAttribute() { }, load() { } }; els.push(el); return el; } };
  try {
    const A = new N.Audio();
    A.init();
    A.setRadio(2, true, false);
    const e2 = A.feeds[2] && A.feeds[2].el;
    ok(e2 && e2.src === 'content/radio/VROCK.mp3' && els.length === 1, 'tuning in loads only the chosen station');
    ok(A.hissN && A.hissN.g.gain.value > 0, 'static while the station is still loading');
    e2.readyState = 1;
    e2.duration = R[2].len;
    e2.fire('loadedmetadata');
    ok(!e2.paused && Math.abs(e2.currentTime - N.radioPos(2, Date.now() / 1000, R[2].len)) < 1, 'joins the broadcast where it is now');
    e2.readyState = 4;
    e2.fire('playing');
    ok(A.feeds[2].g.gain.value === 1 && A.hissN.g.gain.value === 0 && A.radio.gain.value > 0, 'the music replaces the static');
    const full = A.radio.gain.value;
    A.setRadio(2, true, true);
    ok(A.radio.gain.value > 0 && A.radio.gain.value < full / 2, 'the radio ducks under speech');
    e2.fire('waiting');
    ok(A.hissN.g.gain.value > 0, 'buffering sounds like a weak signal');
    A.setRadio(5, true, false);
    ok(A.feeds[2].g.gain.value === 0 && A.feeds[5] && els.length === 2 && A.hissN.g.gain.value > 0, 'switching fades the old station and tunes the new one');
    A.setRadio(OFF, false, false);
    ok(A.radio.gain.value === 0 && A.feeds[5].g.gain.value === 0, 'leaving the car turns the radio off');
    A.setRadio(2, true, false);
    ok(els.length === 2 && A.feeds[2].g.gain.value === 1 && !e2.paused && A.hissN.g.gain.value === 0, 'coming back to a station that is still buffered plays it at once');
    A.destroy();
    ok(els.every(e => e.paused) && !A.on, 'closing the game stops every station');
  } finally {
    delete globalThis.window;
    delete globalThis.document;
  }
});

section('camera views', () => {
  const FP = N.CAM_FP, BUMPER = N.CAM_BUMPER;
  ok(N.CAM_FOOT.length === 5 && N.CAM_CAR.length === 6 && N.CAM_FOOT[FP] === 'от первого лица' && N.CAM_CAR[FP] === 'из салона' && N.CAM_CAR[BUMPER] === 'с бампера', 'camera lists: first person on foot, cabin and bumper in a car');
  store.clear();
  const { g, w, pl } = carGame();
  const ui = Object.create(N.UI.prototype);
  Object.assign(ui, { game: g, city, settings: {}, fx: { shake: 0 }, scene: null, t: 1, camFoot: 3, camCar: 1, fpFov: 1.15, sway: [0, 0], swayV: null, mouse: { r: false, l: false, dx: 0, dy: 0 }, photo: { on: false }, keys: new Set(), camYaw: pl.yaw, camPitch: 0.1, lastMouseT: -99 });
  ui.cycleCamera();
  ok(ui.camFoot === FP && ui.camMode === FP && ui.fpFoot() && g.msg.view.text === 'Камера: от первого лица' && N.loadSettings().camFoot === FP && N.loadSettings().camCar === undefined, 'C on foot switches to first person, says so and remembers it apart from the car view');
  ui.cycleCamera();
  ok(ui.camFoot === 0 && !ui.fpFoot(), 'the foot views wrap around after first person');
  ui.camFoot = FP;
  const tall = (pl.look && pl.look.tall) || 1, fwdOf = y => [Math.sin(y), -Math.cos(y)];
  const dirOf = c => { const d = [c.tx - c.x, c.ty - c.y, c.tz - c.z], l = Math.hypot(...d); return d.map(q => q / l); };
  let cam = ui.computeCamera(1 / 60);
  const f0 = fwdOf(ui.camYaw), d0 = dirOf(cam);
  ok(cam.fp && cam.headless && cam.near <= 0.06 && Math.abs(cam.y - pl.y - 1.716 * tall) < 0.06 && Math.hypot(cam.x - pl.x, cam.z - pl.z) < 0.2 && d0[0] * f0[0] + d0[2] * f0[1] > 0.95, 'first person camera sits at the eyes and looks where the mouse points');
  const yaw0 = pl.yaw;
  for (let i = 0; i < 40; i++) { g.step(1 / 60, { right: 1, camYaw: yaw0 + 1, face: true }); w.ev.length = 0; }
  const r1 = [Math.cos(yaw0 + 1), Math.sin(yaw0 + 1)], sp = Math.hypot(pl.vx, pl.vz);
  ok(Math.abs(N.wrap(pl.yaw - yaw0 - 1)) < 0.05 && sp > 2 && (pl.vx * r1[0] + pl.vz * r1[1]) / sp > 0.9, 'in first person the body faces the camera and D strafes');
  w.giveWeapon(pl, 'ak', 60);
  pl.weapon = 'ak';
  for (let i = 0; i < 30; i++) { g.step(1 / 60, { camYaw: pl.yaw, face: true }); w.ev.length = 0; }
  ok(pl.anim.aim > 0.95, 'a first person rifle is shouldered without the right button');
  pl.weapon = 'fists';
  for (let i = 0; i < 30; i++) { g.step(1 / 60, { camYaw: pl.yaw, face: true }); w.ev.length = 0; }
  ok(pl.anim.aim < 0.05, 'fists stay down in first person');

  const local = (v, c) => {
    const M = N.M3.euler((v.pitch || 0) + (v.bodyPitch || 0), -v.yaw, v.roll || 0, v.x, v.y, v.z), p = [c.x - M[9], c.y - M[10], c.z - M[11]];
    return [M[0] * p[0] + M[3] * p[1] + M[6] * p[2], M[1] * p[0] + M[4] * p[1] + M[7] * p[2], M[2] * p[0] + M[5] * p[1] + M[8] * p[2]];
  };
  const v = w.spawnVehicle('vaz2107', pl.x, pl.z, pl.yaw);
  w.seat(pl, v, true);
  ok(ui.camMode === 1 && ui.camFoot === FP, 'the car keeps its own view');
  ui.camCar = 3;
  ui.cycleCamera();
  ok(ui.camCar === FP && g.msg.view.text === 'Камера: из салона' && N.loadSettings().camCar === FP && N.loadSettings().camFoot === 0, 'C in a car goes to the cabin view');
  ui.camYaw = v.yaw;
  ui.camPitch = 0.1;
  cam = ui.computeCamera(1 / 60);
  const cab = N.cabin(v.spec), L = local(v, cam), fv = fwdOf(v.yaw), d1 = dirOf(cam);
  ok(cam.cabin && cam.headless && cam.up[1] > 0.9 && Math.abs(L[0] - cab.seat.x) < 0.15 && L[1] > cab.seat.y + 0.5 && L[1] < v.spec.shape.H - 0.05 && Math.abs(L[2] - cab.seat.z) < 0.35 && d1[0] * fv[0] + d1[2] * fv[1] > 0.95, 'cabin view: driver eyes under the roof, looking down the road');
  ui.camYaw = v.yaw + Math.PI / 2;
  const d2 = dirOf(ui.computeCamera(1 / 60)), rv = [Math.cos(v.yaw), Math.sin(v.yaw)];
  ok(d2[0] * rv[0] + d2[2] * rv[1] > 0.95, 'the driver can look out of the side window');
  ui.cycleCamera();
  ui.camYaw = v.yaw;
  cam = ui.computeCamera(1 / 60);
  const B = local(v, cam), d3 = dirOf(cam);
  ok(ui.camCar === BUMPER && cam.bumper && !cam.headless && B[2] < -v.spec.hl && B[1] > 0.4 && B[1] < 1.2 && Math.abs(B[0]) < 0.01 && d3[0] * fv[0] + d3[2] * fv[1] > 0.95, 'bumper view: low, ahead of the front bumper, looking forward');
  ui.camYaw = v.yaw + Math.PI;
  ok(local(v, ui.computeCamera(1 / 60))[2] > v.spec.hl, 'looking back moves the bumper camera to the rear');
  ui.cycleCamera();
  ok(ui.camCar === 0 && ui.computeCamera(1 / 60).fov > 0, 'the car views wrap around after the bumper');
  ui.camCar = FP;
  ui.swayV = { v, x: v.vx || 0, z: v.vz || 0 };
  for (let i = 0; i < 20; i++) { v.vx += fv[0] * 0.08; v.vz += fv[1] * 0.08; ui.headSway(v, 1 / 60); }
  ok(ui.sway[1] > 0.012, 'the head sinks back while the car accelerates');
  const tg = carGame(), t72 = tg.w.spawnVehicle('t72', tg.pl.x, tg.pl.z, tg.pl.yaw);
  tg.w.seat(tg.pl, t72, true);
  ui.game = tg.g;
  ui.camCar = 3;
  ui.cycleCamera();
  cam = ui.computeCamera(1 / 60);
  ok(tg.g.msg.view.text === 'Камера: из люка' && local(t72, cam)[1] > t72.spec.shape.H && !cam.headless, 'tank: the first person view is the commander head out of the hatch');
  ui.game = g;

  for (const id of N.VEHICLE_IDS) {
    if (N.VEHICLES[id].type === 'bike' || N.VEHICLES[id].shape.hatch) continue;
    const D = N.Cars.inside(id, null, 0).dials || [];
    ok(D.some(d => d.k === 'spd') && D.every(d => [d.x, d.y, d.z].every(isFinite) && (d.bar ? d.w > 0.1 : d.r > 0.02)), id + ': the dashboard has a live speedometer');
  }
  const car = w.spawnVehicle('volga24', pl.x - 30, pl.z, 0);
  car.spd = 0;
  ok(N.dialValue(car, 'spd') === 0 && N.dialValue(car, 'rpm') === 0 && N.dialValue(car, 'fix', 0.6) === 0, 'parked car: needles rest at zero');
  car.driver = pl;
  car.spd = car.spec.vmax;
  car.rpm = 0.9;
  const sv = N.dialValue(car, 'spd'), rv2 = N.dialValue(car, 'rpm');
  ok(sv > 0.6 && sv <= 1 && rv2 > 0.7 && rv2 <= 1 && N.dialValue(car, 'fix', 0.6) === 0.6, 'running car: speed and revs on the dials');
  car.driver = null;

  const look = N.playerLook('zek'), pm = N.Models.ped(look);
  const ped = (weapon, yaw) => ({ id: 88, x: straight.x, y: city.groundY(straight.x, straight.z), z: straight.z, yaw, vx: 0, vz: 0, onGround: true, look, weapon, weapons: { [weapon]: { ammo: 30, clip: 30 } }, aimPitch: 0, anim: { phase: 0, speed: 0, aim: 1 }, state: 'idle' });
  const inEye = (p, r) => {
    const e = N.pedEye(r.G, look), f = [Math.sin(p.yaw), -Math.cos(p.yaw)], s = [Math.cos(p.yaw), Math.sin(p.yaw)], d = [r.wpn[9] - e[0], r.wpn[10] - e[1], r.wpn[11] - e[2]];
    return { fwd: d[0] * f[0] + d[2] * f[1], right: d[0] * s[0] + d[2] * s[1], up: d[1] };
  };
  let t = 10;
  for (const [wid, fwd] of [['ak', [0.1, 0.3]], ['pm', [0.3, 0.5]], ['shotgun', [0.1, 0.3]]]) {
    const p = ped(wid, 0.7);
    for (let i = 0; i < 3; i++) N.pedRig(p, t += 0.016, N.pedRoot(p), pm.piv, { fp: 1 });
    const a = inEye(p, N.pedRig(p, t += 0.016, N.pedRoot(p), pm.piv, { fp: 1 }));
    ok(a.fwd > fwd[0] && a.fwd < fwd[1] && a.up < -0.04 && a.up > -0.2 && Math.abs(a.right) < 0.07, wid + ': aiming in first person brings the sights under the eye');
    const h = inEye(p, N.pedRig(p, t += 0.016, N.pedRoot(p), pm.piv, { fp: 0 }));
    ok(h.right > 0.06 && h.up < a.up && h.fwd > 0, wid + ': first person hip carry sits low on the right');
    const r = N.pedRig(p, t += 0.016, N.pedRoot(p), pm.piv, {});
    const e = N.pedEye(r.G, look), hd = r.G[N.PB.HEAD];
    ok(Math.abs(e[1] - p.y - 1.716) < 0.08 && Math.hypot(e[0] - hd[9], e[2] - hd[11]) > 0.05, wid + ': the eye point is in front of the head');
    const G = N.headless(r.G);
    ok(G[N.PB.HEAD].slice(0, 9).every(q => q === 0) && G[N.PB.HEAD][10] === hd[10] && G[N.PB.CHEST].every((q, i) => q === r.G[N.PB.CHEST][i]) && r.G[N.PB.HEAD][4] !== 0, wid + ': first person hides only the head');
  }

  const ap = (m, q) => [m[0] * q[0] + m[1] * q[1] + m[2] * q[2] + m[9], m[3] * q[0] + m[4] * q[1] + m[5] * q[2] + m[10], m[6] * q[0] + m[7] * q[1] + m[8] * q[2] + m[11]];
  for (const id of ['vaz2107', 'merc600', 'gazel', 'paz', 'oka']) {
    const gw = carGame(), cv = gw.w.spawnVehicle(id, gw.pl.x, gw.pl.z, gw.pl.yaw);
    gw.w.seat(gw.pl, cv, true);
    cv.steer = 0.2;
    const cb = N.cabin(cv.spec), ws = cb.wheel, tl = (gw.pl.look && gw.pl.look.tall) || 1, pp = N.Models.ped(gw.pl.look, 0);
    const CM = N.M3.euler((cv.pitch || 0) + (cv.bodyPitch || 0), -cv.yaw, cv.roll || 0, cv.x, cv.y, cv.z);
    const root = N.M3.mul(CM, N.M3.euler(0, 0, 0, cb.seat.x, N.seatRoot(cb, tl), cb.seat.z));
    let r;
    for (let i = 0; i < 12; i++) r = N.pedRig(gw.pl, 50 + i / 60, root, pp.piv, { sit: 1 });
    const WH = N.M3.mul(CM, N.M3.euler(-ws.tilt, 0, -cv.steer * 2.4, ws.x, ws.y, ws.z));
    const toDriver = (q => { const o = ap(WH, [0, 0, 0]); return [q[0] - o[0], q[1] - o[1], q[2] - o[2]]; })(ap(WH, [0, 0, 1]));
    for (const s of [-1, 1]) {
      const a = s < 0 ? Math.PI - 0.5 : 0.5, rim = ap(WH, [Math.cos(a) * ws.r, Math.sin(a) * ws.r, 0]), H = r.G[s < 0 ? N.PB.HANDL : N.PB.HANDR];
      const grip = ap(H, [-s * 0.034, -0.085, 0]), palm = [-s * H[0], -s * H[3], -s * H[6]];
      ok(Math.hypot(grip[0] - rim[0], grip[1] - rim[1], grip[2] - rim[2]) < 0.012 && palm[0] * toDriver[0] + palm[1] * toDriver[1] + palm[2] * toDriver[2] < -0.5, id + ': the ' + (s < 0 ? 'left' : 'right') + ' hand closes its fingers round the rim, palm to the wheel');
    }
  }
});

section('integration', () => {
  const LINE = String.fromCharCode(47, 47), BLOCK = String.fromCharCode(47, 42);
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/gtann/' + f).concat(['js/apps/gtann-app.js', 'tests/gtann.test.js', 'tools/gtann-shots.cjs']);
  for (const f of files) {
    const src = read(f);
    const noStrings = src.replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, '""');
    ok(!noStrings.includes(LINE) && !noStrings.includes(BLOCK), f + ' has no comments');
    ok(!/\/\/ |\/\*/.test(src.replace(/https?:\/\/[^\s'"`]+/g, '')), f + ' has no comments in shaders or templates');
  }
  ok(!read('css/apps/gtann.css').includes(BLOCK), 'css has no comments');
  ok(!read('gtann.html').includes('<!' + '--'), 'page has no comments');
  const html = read('index.html'), page = read('gtann.html');
  let lastA = -1, lastB = -1;
  for (const f of ORDER) {
    const needle = 'js/apps/gtann/' + f + '.js';
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'script order ' + f);
    lastA = ia; lastB = ib;
  }
  ok(fs.readdirSync(DIR).filter(f => f.endsWith('.js')).length === ORDER.length, 'every module is loaded');
  ok(html.indexOf('js/apps/gtann-app.js') > lastA && html.includes('css/apps/gtann.css'), 'desktop loads wrapper and styles');
  const gm = read('js/game-manager.js');
  const at = gm.indexOf('      gtann: {');
  const entry = gm.slice(at, at + 3200);
  ok(at > 0 && /steam: true/.test(entry) && /price: 41\.99/.test(entry) && /targetExe: 'GTANN\.EXE'/.test(entry) && /appGtaNN/.test(entry), 'Steam catalog entry');
  ok(!/gtannGranted/.test(gm), 'no grant flag');
  const loadState = gm.slice(gm.indexOf('loadState'), gm.indexOf('moveGamesToSteam(state)'));
  ok(!/'gtann'/.test(loadState), 'not preinstalled');
  const shell = {
    'js/desktop.js': ["isInstalled('gtann')", 'appGtaNN'],
    'js/taskbar.js': ["isInstalled('gtann')", "case 'gtann'", "showInSteam('gtann')"],
    'js/apps/dialogs.js': ["cmd === 'gtann'", "showInSteam(\\'gtann\\')"],
    'js/apps/explorer.js': ["item.app === 'gtann'", 'GTANN.EXE'],
    'js/filesystem.js': ["gmInstalled.includes('gtann')", "'GTANN.EXE'"],
    'js/apps/task-manager.js': ["'app_gtann'", 'gtann.exe'],
    'js/icons.js': ["'gtann': `<svg"],
    'js/apps/clippy.js': ["id.startsWith('app_gtann')", "launchProgram('gtann', 'appGtaNN')"],
    'js/apps/advanced-site.js': ["id: 'gtann'"],
    'js/apps/steam.js': ["game: 'gtann'"],
    'js/apps/gtann-app.js': ["id = 'app_gtann'", 'N.UI(root']
  };
  for (const [f, needles] of Object.entries(shell)) { const src = read(f); for (const n of needles) ok(src.includes(n), f + ' contains ' + n); }
  const i18n = read('js/i18n.js');
  ok((i18n.match(/'app\.gtann': 'GTA: Нижний Сити'/g) || []).length === 2 && (i18n.match(/'app\.gtann': 'GTA: Nizhny City'/g) || []).length === 2, 'i18n title in every language');
  ok(/"test:gtann": "node tests\/gtann\.test\.js"/.test(read('package.json')) && /node tests\/gtann\.test\.js"/.test(read('package.json')), 'npm scripts');
  ok(/'gtann'/.test(read('tests/steam.test.js')), 'Steam price test covers the game');
});

console.log('gtann: ' + checks + ' checks passed in ' + (Date.now() - t0) + ' ms');
