const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/forza');
const SIM = ['fz-core', 'fz-cars', 'fz-phys', 'fz-damage', 'fz-map', 'fz-events', 'fz-wear', 'fz-world', 'fz-city', 'fz-flora', 'fz-race', 'fz-traffic', 'fz-game'];
const ORDER = SIM.concat(['fz-tex', 'fz-models', 'fz-carmesh', 'fz-driver', 'fz-dents', 'fz-landmarks', 'fz-ads', 'fz-festival', 'fz-street', 'fz-airport', 'fz-market', 'fz-bisumuiza', 'fz-trees', 'fz-scene', 'fz-debris', 'fz-render', 'fz-hud', 'fz-audio', 'fz-menus', 'fz-photo', 'fz-ui']);

const store = new Map();
globalThis.localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
for (const f of SIM) require(path.join(DIR, f + '.js'));
const F = globalThis.Forza;

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const VERBOSE = process.argv.includes('-v');
const log = (...a) => { if (VERBOSE) console.log(...a); };
function section(name, fn) { const s = Date.now(); fn(); log(name + ': ' + (Date.now() - s) + ' ms'); }

const world = new F.World();
const CLASS_CAR = { D: 'vaz2105', C: 'golf2', B: 'celica', A: 'm5e39', S1: 'f355', S2: 'mclarenf1' };

function driveInput(game, race, st) {
  const v = game.veh, r = race.route;
  const pr = r.project(v.x, v.z, st.idx, 30);
  st.idx = pr.i;
  const tp = r.point(race.pProg + Math.max(7, v.speed * 0.5));
  const off = tp.line * 0.9;
  const tx = tp.x - tp.tz * off, tz = tp.z + tp.tx * off;
  const fx = Math.sin(v.yaw), fz = -Math.cos(v.yaw);
  const dx = tx - v.x, dz = tz - v.z;
  const ang = Math.atan2(dx * -fz + dz * fx, dx * fx + dz * fz);
  const mu = v.spec.grip * 0.92;
  const dec = Math.min(v.spec.grip * 1.05, v.spec.brake) * 9.81 * 0.82;
  let vt = 200;
  for (let k = 0; k < 60; k++) {
    const p = r.point(race.pProg + k * 4);
    const surf = F.surfGrip(p.surf, v.spec.off, false);
    const vc = Math.sqrt(mu * surf * 9.81 / Math.max(Math.abs(r.curv[p.i]) * 0.8, 1e-4));
    vt = Math.min(vt, Math.sqrt(vc * vc + 2 * dec * surf * k * 4));
  }
  return { thr: v.speed < vt - 1 ? 1 : v.speed < vt ? 0.4 : 0, brk: v.speed > vt + 2 ? Math.min(1, (v.speed - vt) / 6) : 0, steer: F.clamp(ang * 2.2, -1, 1), analog: true, hand: false };
}

function runEvent(id, carId, diff) {
  const profile = F.Profile.newProfile('bot');
  profile.cars[0].id = carId;
  profile.settings.diff = diff;
  profile.settings.traffic = 0;
  const game = new F.Game(world, { profile });
  const race = game.startEvent(id, { difficulty: diff, seed: 3 });
  const st = { idx: race.lastIdx };
  let t = 0, stuck = 0, resets = 0, best = -Infinity, bestT = 0;
  const events = [];
  while (t < 720 && race.state !== 'done') {
    game.step(1 / 60, race.state === 'grid' ? { thr: 0.6, brk: 0, steer: 0 } : driveInput(game, race, st));
    t += 1 / 60;
    if (race.pProg > best + 3) { best = race.pProg; bestT = t; }
    const lost = race.state === 'race' && t - bestT > 8;
    if (race.state === 'race' && game.veh.speed < 1.5) stuck += 1 / 60; else stuck = 0;
    if (stuck > 4 || lost) { game.resetCar(); stuck = 0; bestT = t; resets++; }
    for (const e of game.drain()) events.push(e.t);
  }
  return { game, race, resets, events };
}

section('cars', () => {
  const cars = F.Cars.CARS;
  ok(cars.length >= 28 && cars.length <= 34, 'about thirty cars: ' + cars.length);
  ok(new Set(cars.map(c => c.id)).size === cars.length, 'car ids are unique');
  const profile = F.Profile.newProfile('test');
  ok(profile.cars.length === 1 && profile.cars[0].id === 'vaz2105', 'the career starts with the Lada 2105');
  ok(profile.credits === 5000, 'starting credits');
  const lada = F.perfOf('vaz2105', {});
  ok(lada.cls === 'D' && lada.pi <= 320, 'Lada 2105 is a class D car');
  ok(lada.t100 > 14 && lada.t100 < 21, 'Lada 2105 reaches 100 km/h in about 17 s: ' + lada.t100.toFixed(1));
  ok(lada.vmax > 135 && lada.vmax < 155, 'Lada 2105 top speed about 145 km/h: ' + lada.vmax.toFixed(0));
  const f1 = F.perfOf('mclarenf1', {});
  ok(f1.t100 < 4.5 && f1.vmax > 350, 'McLaren F1 is a hypercar');
  let top = null;
  for (const c of cars) {
    const sp = F.Cars.spec(c.id, {});
    const pf = F.perfOf(c.id, {});
    ok(sp.mass > 500 && sp.mass < 3500 && sp.P > 10000 && Array.isArray(sp.ratios) && sp.ratios.length >= 3, 'spec sane ' + c.id);
    ok(pf.pi >= 100 && pf.pi <= 998 && F.classOf(pf.pi).c === pf.cls, 'PI and class ' + c.id);
    ok(pf.t100 > 2.5 && pf.t100 < 40 && pf.vmax > 100, 'performance sane ' + c.id);
    ok(typeof c.make === 'string' && typeof c.model === 'string' && c.year >= 1950 && c.year <= 2000, 'identity ' + c.id);
    ok(c.barn || c.price > 0, 'price ' + c.id);
    if (!top || pf.pi > top.pi) top = { id: c.id, pi: pf.pi };
  }
  ok(top.id === 'mclarenf1', 'McLaren F1 has the highest PI');
  for (const cls of ['D', 'C', 'B', 'A', 'S1']) ok(cars.filter(c => !c.barn && F.perfOf(c.id, {}).cls === cls).length >= 2, 'at least two cars for sale in class ' + cls);
  ok(cars.filter(c => c.barn).length === F.EV.BARNS.length, 'every barn find has a car');
  for (const b of F.EV.BARNS) ok(F.Cars.get(b.car) && F.Cars.get(b.car).barn, 'barn car exists ' + b.car);
  const full = {};
  for (const u of F.Cars.UPGRADES) full[u.id] = u.levels.length - 1;
  ok(F.perfOf('vaz2105', full).pi > lada.pi + 120, 'upgrades raise PI');
  ok(F.perfOf('vaz2105', { engine: 1 }).t100 < lada.t100, 'engine upgrade improves acceleration');
});

section('meshes', () => {
  for (const f of ['fz-tex', 'fz-models', 'fz-carmesh']) require(path.join(DIR, f + '.js'));
  const M = F.Models, S = F.STRIDE, MATS = new Set(Object.values(F.MAT));
  const BUDGET = { body: [3000, 1100, 250], glass: [500, 160], cabin: 320, lamp: 120, wheel: 400, farWheel: 100, brake: 80, cockpit: 4000, steer: 600 };
  const livLine = read('js/apps/forza/fz-menus.js').split('\n').find(l => l.includes('const LIVERIES'));
  const LIVERIES = [...livLine.matchAll(/\['(\w+)', '/g)].map(m => m[1]);
  ok(LIVERIES.length >= 12 && LIVERIES[0] === 'none' && LIVERIES.every(id => F.Tex.LIVERIES.includes(id)), 'paint shop liveries have skins: ' + LIVERIES.join(','));
  const SK = F.Tex.SKIN, RECTS = Object.keys(SK).filter(k => k !== 'size').map(k => SK[k]);
  ok(RECTS.every((r, i) => r[0] >= 0 && r[1] >= 0 && r[0] + r[2] <= SK.size && r[1] + r[3] <= SK.size && RECTS.every((q, j) => j === i || r[0] + r[2] <= q[0] || q[0] + q[2] <= r[0] || r[1] + r[3] <= q[1] || q[1] + q[3] <= r[1])), 'skin regions fit the texture without overlaps');
  const inSkin = (u, v) => RECTS.some(r => u * SK.size >= r[0] - 0.01 && u * SK.size <= r[0] + r[2] + 0.01 && v * SK.size >= r[1] - 0.01 && v * SK.size <= r[1] + r[3] + 0.01);
  const scan = batch => {
    const r = { t: 0, lo: [Infinity, Infinity, Infinity], hi: [-Infinity, -Infinity, -Infinity], bad: new Set(), faces: 0, flipped: 0, offSkin: 0 };
    const parts = batch.parts.map(p => [p.data, p.idx, p.nv, p.ni]);
    if (batch.n) parts.push([batch.u8.subarray(0, batch.n * S), batch.idx.subarray(0, batch.ni), batch.n, batch.ni]);
    for (const [data, idx, nv, ni] of parts) {
      const dv = new DataView(data.buffer, data.byteOffset, nv * S);
      const P = [], N = [];
      for (let i = 0; i < nv; i++) {
        const o = i * S;
        const p = [dv.getFloat32(o, true), dv.getFloat32(o + 4, true), dv.getFloat32(o + 8, true)];
        const n = [dv.getInt8(o + 20) / 127, dv.getInt8(o + 21) / 127, dv.getInt8(o + 22) / 127];
        const u = dv.getFloat32(o + 12, true), v = dv.getFloat32(o + 16, true);
        const nl = Math.hypot(n[0], n[1], n[2]);
        if (!p.every(Number.isFinite)) r.bad.add('position');
        if (!(u >= -1e-3 && u <= 1.001 && v >= -1e-3 && v <= 1.001)) r.bad.add('uv');
        if (!inSkin(u, v)) r.offSkin++;
        if (nl < 0.95 || nl > 1.06) r.bad.add('normal');
        if (!MATS.has(dv.getInt8(o + 23))) r.bad.add('material');
        for (let k = 0; k < 3; k++) { r.lo[k] = Math.min(r.lo[k], p[k]); r.hi[k] = Math.max(r.hi[k], p[k]); }
        P.push(p); N.push(n);
      }
      for (let k = 0; k < ni; k += 3) {
        const ia = idx[k], ib = idx[k + 1], ic = idx[k + 2];
        if (ia >= nv || ib >= nv || ic >= nv) { r.bad.add('index'); continue; }
        const A = P[ia], B = P[ib], Q = P[ic];
        const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = Q[0] - A[0], vy = Q[1] - A[1], vz = Q[2] - A[2];
        const gx = uy * vz - uz * vy, gy = uz * vx - ux * vz, gz = ux * vy - uy * vx;
        if (Math.hypot(gx, gy, gz) < 1e-8) continue;
        r.faces++;
        if (gx * (N[ia][0] + N[ib][0] + N[ic][0]) + gy * (N[ia][1] + N[ib][1] + N[ic][1]) + gz * (N[ia][2] + N[ib][2] + N[ic][2]) <= 0) r.flipped++;
      }
      r.t += ni / 3;
    }
    return r;
  };
  for (const car of F.Cars.CARS) {
    const sh = car.sh, W = sh.wid / 2, L = sh.len / 2;
    const problems = [];
    const tris = [0, 0, 0];
    {
      for (const wing of new Set([null, 'lip', 'high', sh.wing || null])) {
        for (const lod of [0, 1, 2]) {
        const built = M.buildCar(car, { wing, lod });
        const s = scan(built.batch);
        const tag = wing + '/lod' + lod + ' ';
        if (s.offSkin) problems.push(tag + 'texture coordinates outside the skin regions ' + s.offSkin);
        if ((lod === 0) !== !!built.skin) problems.push(tag + 'skin layout only on the near level of detail');
        if (wing === (sh.wing || null)) tris[lod] = s.t;
        if (s.bad.size) problems.push(tag + [...s.bad].join(','));
        const cut = built.cut, outer = cut ? (cut.b - cut.w) / 3 : s.t;
        if (outer < 100 || outer > BUDGET.body[lod]) problems.push(tag + 'triangles ' + outer);
        const ranged = cut && built.batch.parts.length === 0 && cut.w >= 0 && cut.w < cut.b && cut.b <= cut.c && cut.c < cut.g && cut.g === built.batch.ni && (cut.c - cut.b) / 3 <= BUDGET.cabin && (cut.g - cut.c) / 3 <= BUDGET.glass[lod];
        if ((lod < 2) !== !!cut || (cut && !ranged) || (lod === 0 && cut && !(cut.w > 0 && cut.c > cut.b)) || (lod === 1 && cut && (cut.w || cut.c !== cut.b))) problems.push(tag + 'wiper, body, cabin and glass ranges in the body batch');
        if (s.flipped) problems.push(tag + 'flipped faces ' + s.flipped);
        if ((lod < 2) !== !!built.glass || (lod === 0) !== !!built.cabin) problems.push(tag + 'glass or cabin batch missing');
        for (const [name, bt, cap] of [['glass', built.glass, BUDGET.glass[lod]], ['cabin', built.cabin, BUDGET.cabin]]) {
          if (!bt) continue;
          const g = scan(bt);
          if (g.bad.size || g.flipped || g.t < 20 || g.t > cap) problems.push(tag + name + ' ' + g.t + ' ' + [...g.bad].join(',') + (g.flipped ? ' flipped ' + g.flipped : ''));
          if (name === 'glass' && (Math.max(-g.lo[0], g.hi[0]) > W * (1 + Math.max(0, ...[].concat(sh.flare || 0))) + 0.01 || g.hi[1] > sh.hgt + 0.05 || g.lo[1] < sh.hood - 0.1)) problems.push(tag + 'glass outside the greenhouse');
          if (name === 'cabin' && (g.lo[0] < -W || g.hi[0] > W || g.hi[1] > sh.hgt - 0.02 || g.lo[1] < sh.clr)) problems.push(tag + 'cabin pokes through the body');
        }
        if (s.lo[0] < -W - 0.2 || s.hi[0] > W + 0.2 || s.hi[0] - s.lo[0] < sh.wid * 0.95) problems.push(tag + 'width');
        if (s.lo[2] < -L - 0.3 || s.hi[2] > L + 0.3 || s.hi[2] - s.lo[2] < sh.len * 0.97) problems.push(tag + 'length');
        if (s.lo[1] < 0.05 || s.hi[1] < sh.hgt - 0.05 || s.hi[1] > Math.max(sh.hgt, sh.deck) + 0.35) problems.push(tag + 'height');
        }
      }
    }
    ok(!problems.length, 'body meshes ' + car.id + (problems.length ? ': ' + problems.join('; ') : ''));
    ok(tris[0] > tris[1] && tris[1] > tris[2], 'levels of detail get cheaper ' + car.id + ': ' + tris.join('/'));
    const g = M.carGeo(car.id);
    const sk = g.skin, pxOk = (w, p, q) => { const o = sk.px(w, p, q); return o.every(Number.isFinite) && o[0] >= 0 && o[0] <= SK.size && o[1] >= 0 && o[1] <= SK.size; };
    const skinBad = [];
    if (!sk.gaps.length || !sk.gaps.every(pl => pl.length >= 2 && pl.every(p => pxOk('L', p[0], p[1]) && pxOk('R', p[0], p[1])))) skinBad.push('door gaps');
    if (!sk.seams.every(pl => pl.every(p => pxOk('T', p[0], p[1])))) skinBad.push('hood seams');
    if (!(sk.panel.w > 30 && sk.panel.h > 20 && (sk.hood ? sk.hood.len > 40 && sk.hood.w > 60 : !!sh.van) && sk.roof.f1 > sk.roof.f0)) skinBad.push('decal areas ' + [sk.panel.w, sk.panel.h].map(v => v.toFixed(0)).join('/'));
    if (!/^[A-Z]{2}-\d{3,4}$/.test(sk.plate) || !(sk.number >= 2 && sk.number <= 98) || !sk.badge.every(s => s && s.length <= 14)) skinBad.push('plate, number or badges ' + sk.plate + ' ' + sk.number + ' ' + sk.badge.join('/'));
    const fr = sk.frame('L', sk.panel.f, sk.panel.y), ft = sk.frame('T', sk.roof.f, 0);
    if (!(fr[0] > 0 && fr[3] > 0 && ft[1] > 0 && ft[2] < 0)) skinBad.push('decal frames');
    ok(!skinBad.length, 'skin layout ' + car.id + (skinBad.length ? ': ' + skinBad.join('; ') : ''));
    const wp = g.wiper, wr = wp && scan(wp.rest), wbl = wp && scan(wp.blade);
    const sweepOk = wp && wp.pivots.length === 2 && Math.abs(Math.hypot(...wp.up) - 1) < 1e-6 && wp.len > 0.25 && wp.sweep > 1.2 && [0, 0.5, 1].every(k => wp.pivots.every(p => {
      const a = wp.sweep * k, tip = [0, 1, 2].map(i => p[i] + ((i === 0 ? Math.cos(a) : 0) + Math.sin(a) * wp.up[i]) * wp.len);
      return Math.abs(tip[0]) < W && tip[1] < sh.hgt + 0.05 && tip[1] > p[1] - 0.01 && tip[2] < g.Z(sh.wt) + 0.1;
    }));
    ok(sweepOk && !wr.bad.size && !wbl.bad.size && !wr.flipped && !wbl.flipped && wbl.t <= 12, 'wipers sweep inside the windscreen ' + car.id);
    ok(g.lods.length === 3 && g.lods[0] === g.batch, 'three levels of detail cached ' + car.id);
    ok(g.cuts.length === 3 && g.cuts[0] === g.cut && g.cuts[1] && g.cuts[1].g > g.cuts[1].c && !g.cuts[2], 'glass ranges for the near levels of detail ' + car.id);
    ok(sh.van || [2, 3, 4, 5].includes(sh.doors), 'door count ' + car.id);
    if (sh.lights === 'popup' || sh.lights === 'hidden') {
      const s = scan(g.lamp.batch);
      ok(!s.bad.size && !s.flipped && s.t <= BUDGET.lamp && (sh.lights === 'hidden' ? !g.lamp.hinge : g.lamp.hinge.every(Number.isFinite) && g.lamp.shut < 0), 'hidden headlight mesh ' + car.id);
    } else ok(!g.lamp, 'no hidden headlight mesh ' + car.id);
    const front = g.wheels.filter(w => w.front), rear = g.wheels.filter(w => !w.front);
    const fl = Array.isArray(sh.flare) ? sh.flare : [sh.flare || 0, sh.flare || 0], ww = 0.2 + (sh.wid - 1.55) * 0.15;
    ok(front.length === 2 && rear.length === 2 && g.wheels.every(w => w.r === sh.wr && w.y === sh.wr && Math.abs(w.x) + ww / 2 <= W * (1 + fl[w.front ? 0 : 1]) + 1e-6), 'four wheels inside the fenders ' + car.id);
    ok(front.every(f => rear.every(b => Math.abs(b.z - f.z - sh.wb) < 1e-6)), 'wheelbase matches the spec ' + car.id);
    const [ex, ey, ez] = g.eye;
    ok(Math.abs(ex) < W && ey > sh.hood && ey < sh.hgt && ez > g.Z(sh.ws) && ez < g.Z(sh.rb), 'driver eye inside the cabin ' + car.id);
    const lamps = (list, z, reach = 0.1) => list.length >= 2 && list.every(p => p.every(Number.isFinite) && Math.abs(p[0]) < W && p[1] > g.yb && p[1] < sh.hgt && Math.abs(p[2] - z) < reach);
    ok(lamps(g.lightsF, -L, sh.lights === 'popup' ? 0.35 : 0.1) && lamps(g.lightsR, L) && lamps(g.lightsB, L), 'lamp anchors on the nose and tail ' + car.id);
    const mats = (bt, want) => {
      const found = new Set(), rgb = [255, 0];
      const parts = bt.parts.map(p => [p.data, p.nv]).concat(bt.n ? [[bt.u8.subarray(0, bt.n * S), bt.n]] : []);
      for (const [data, nv] of parts) for (let i = 0; i < nv; i++) {
        const o = i * S, mat = data[o + 23];
        found.add(mat);
        if (mat === F.MAT.PAINT) { rgb[0] = Math.min(rgb[0], data[o + 24]); rgb[1] = Math.max(rgb[1], data[o + 24]); }
      }
      return want.every(m => found.has(m)) && rgb;
    };
    const bodyMats = mats(g.batch, [F.MAT.REVERSE, F.MAT.TRIM]), cabinMats = mats(g.cabin, [F.MAT.INTERIOR]);
    ok(bodyMats && cabinMats && bodyMats[0] >= 110 && bodyMats[0] < 250 && bodyMats[1] === 255, 'materials and baked occlusion ' + car.id + ' ' + bodyMats);
    const wheelProblems = [];
    for (const tires of [0, 1, 2, 3, 4]) {
      for (const kind of ['sharp', 'blur', 'far']) {
        const s = scan(M.buildWheel(car, { tread: M.treadOf(car, tires), kind }));
        const tag = tires + '/' + kind + ' ';
        if (s.bad.size) wheelProblems.push(tag + [...s.bad].join(','));
        if (s.flipped) wheelProblems.push(tag + 'flipped faces ' + s.flipped);
        if (s.t > (kind === 'far' ? BUDGET.farWheel : BUDGET.wheel)) wheelProblems.push(tag + 'triangles ' + s.t);
        if (Math.abs(s.hi[1] - sh.wr) > 0.01 || s.hi[0] - s.lo[0] > ww + 0.04) wheelProblems.push(tag + 'size');
      }
    }
    for (const red of [false, true]) {
      const s = scan(M.buildBrake(car, red));
      if (s.bad.size || s.flipped || s.t > BUDGET.brake || s.hi[1] >= sh.wr * 0.75) wheelProblems.push('brake ' + red + ' ' + s.t);
    }
    ok(!wheelProblems.length, 'wheel meshes ' + car.id + (wheelProblems.length ? ': ' + wheelProblems.join('; ') : ''));
    ok(F.COCK[car.cock], 'cockpit style exists ' + car.id);
    const shell = scan(g.cockpit.batch), steer = scan(g.cockpit.wheel), gauge = scan(g.cockpit.gauge);
    ok(!shell.bad.size && !steer.bad.size && !gauge.bad.size, 'cockpit mesh data ' + car.id);
    ok(shell.t <= BUDGET.cockpit && steer.t <= BUDGET.steer && gauge.t === 2 && g.cockpit.wheelPos.every(Number.isFinite), 'cockpit triangle budget ' + car.id);
    const cp = g.cockpit, fc = cp.face, wc = cp.wheelPos, al = -cp.tilt, rho = cp.wheelR - cp.tube - 0.004;
    const nw = [0, Math.sin(al), Math.cos(al)], uw = [0, Math.cos(al), -Math.sin(al)];
    const dot3 = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
    let blocked = '';
    for (let k = 0; k < 24 && !blocked; k++) {
      const th = k / 24 * Math.PI * 2, cx = Math.cos(th) * fc.hw * 0.97, cy = Math.sin(th) * fc.hh * 0.97;
      const p = [0, 1, 2].map(i => fc.c[i] + fc.r[i] * cx + fc.u[i] * cy);
      const d = [0, 1, 2].map(i => p[i] - g.eye[i]);
      const s = dot3([0, 1, 2].map(i => wc[i] - g.eye[i]), nw) / dot3(d, nw);
      const q = [0, 1, 2].map(i => g.eye[i] + d[i] * s - wc[i]);
      const dx = q[0], du = dot3(q, uw);
      if (Math.hypot(dx, du) > rho) blocked = 'rim';
      else if (Math.abs(dx) < cp.pad + 0.004 && du < cp.pad * 0.8 + 0.004) blocked = 'hub';
      else for (const deg of cp.spokes) {
        const sa = deg * Math.PI / 180;
        if (dx * Math.cos(sa) + du * Math.sin(sa) > 0 && Math.abs(-dx * Math.sin(sa) + du * Math.cos(sa)) < 0.022) blocked = 'spoke ' + deg;
      }
    }
    ok(!blocked && fc.hw > 0.1 && fc.hh > 0.05, 'instrument dials visible through the steering wheel ' + car.id + ' ' + blocked + ' ' + fc.hw.toFixed(3) + 'x' + fc.hh.toFixed(3));
    const fe = (g.eye[2] + sh.len / 2) / sh.len;
    ok(g.eye[2] <= g.Z(sh.rt) - 0.15 && g.shape.topAt(fe) - g.eye[1] >= 0.08, 'driver head under the roof ' + car.id);
  }
});

section('driver', () => {
  require(path.join(DIR, 'fz-driver.js'));
  const D = F.Driver, S = F.STRIDE, MS = D.MS;
  const fOf = (g, z) => F.clamp((z + g.len / 2) / g.len, 0, 1);
  const posed = inst => {
    const r = inst.rig, f = new Float32Array(inst.data), i8 = new Int8Array(inst.data), P = [], N = [];
    for (let i = 0; i < r.nv; i++) { P.push([f[i * 7], f[i * 7 + 1], f[i * 7 + 2]]); N.push([i8[i * 28 + 20] / 127, i8[i * 28 + 21] / 127, i8[i * 28 + 22] / 127]); }
    return { P, N };
  };
  for (const body of ['m', 'f']) {
    const r = D.rig({ body }), headBones = new Set([D.B.neck, D.B.head]);
    ok(r.ni / 3 <= 3400 && r.head > 0 && r.head < r.ni && r.ni % 3 === 0 && r.head % 3 === 0, 'driver mesh budget and head range ' + body + ': ' + r.ni / 3 + ' tris');
    let mixed = 0;
    for (let k = 0; k < r.ni; k++) if (headBones.has(r.bones[r.idx[k]]) !== k >= r.head) mixed++;
    ok(!mixed && r.bones.length === r.nv && [...r.bones].every(b => b < D.BONES.length), 'only the neck and head are in the head range ' + body);
    ok(D.rig({ body }) === r, 'driver rigs are cached ' + body);
  }
  const tooBig = [];
  for (const [hair] of D.HAIRS) for (const body of ['m', 'f']) for (const cover of [null, 'cap', 'helmet']) for (const beard of ['none', 'full']) {
    const r = D.rig({ body, hair, cover, beard }), f = new Float32Array(r.rest);
    let bad = r.ni / 3 > 3400;
    for (let i = 0; i < r.nv && !bad; i++) for (let k = 0; k < 5; k++) if (!Number.isFinite(f[i * 7 + k])) bad = true;
    for (let i = 0; i < r.nv && !bad; i++) { const u = f[i * 7 + 3], v = f[i * 7 + 4]; if (!(u >= 0 && u <= 1 && v >= 0 && v <= 1)) bad = true; }
    if (bad) tooBig.push(body + ' ' + hair + ' ' + cover + ' ' + beard + ' ' + r.ni / 3);
  }
  ok(!tooBig.length, 'every hairstyle, cover and beard builds within 3400 triangles with valid data: ' + tooBig.slice(0, 4).join('; '));
  const L0 = D.normLook({ body: 'f', hair: 'nope', skin: 99, makeup: 'bold' });
  ok(L0.hair === 'bob' && L0.skin === 1 && L0.makeup === 'bold' && D.normLook(null).body === 'm', 'looks fall back to valid values');
  ok(D.SKINS.length === 8 && D.HAIR_COLS.length === 10 && D.HAIRS.length === 16 && D.FACES.m.length === 6 && D.FACES.f.length === 6, 'eight skin tones, ten hair colours, sixteen hairstyles, six faces per figure');
  ok(D.POOL.length === 32 && new Set(D.POOL.map(l => D.rigKey(l) + D.texKey(l))).size >= 28 && D.trafficLook(17) === D.trafficLook(17), 'traffic draws from a pool of 32 looks');
  ok(D.rivalLook('Вилкс').hair === 'slick' && D.rivalLook('Liene').body === 'f' && D.rigKey(D.rivalLook('Andris_BMW')) === D.rigKey(D.rivalLook('Andris_BMW')), 'rival looks come from their names');
  const tall = D.rig({ hair: 'curly' }), flat = D.rig({ hair: 'bald' });
  ok(tall.crown > flat.crown + 0.01 && D.seatOf(F.Models.carGeo('viper'), tall.fig, 'm', tall.crown).head[1] <= D.seatOf(F.Models.carGeo('viper'), flat.fig, 'm', flat.crown).head[1], 'tall hair lowers the head in low cars');
  ok(/bool skinM = m > 20\.5 && m < 21\.5;/.test(read('js/apps/forza/fz-render.js')) && F.MAT.SKIN === 21, 'skin has its own material');
  const REWARDS = /^(band(:[1-5])?|finale|stunts|drift|photo|barn:(p356|m300sl|gaz21|raf2203))$/;
  ok(D.ITEMS.length === 67 && new Set(D.ITEMS.map(x => x.id)).size === 67 && D.SLOTS.length === 9, '67 wardrobe items in nine slots and the festival band');
  const itemBad = D.ITEMS.filter(x => !(D.SLOTS.some(([sl]) => sl === x.slot) || x.slot === 'band') || !x.cols.length || !x.cols.every(c => /^#[0-9a-f]{6}$/i.test(c)) || !(x.band >= 0 && x.band <= 5) || (x.price === null ? !REWARDS.test(x.reward || '') : !(x.price >= 0 && !x.reward)));
  ok(!itemBad.length, 'every item has a slot, colours and a price or a reward: ' + itemBad.map(x => x.id).join(','));
  ok(D.STARTER.every(id => D.ITEM[id].price === 0) && D.ITEM.blazer.price === 45000 && D.ITEM.suit_vetra.band === 5 && D.ITEM.helmet_full.reward === 'finale', 'starter set is free, prices and conditions follow the plan');
  const nf = D.normFit({ top: ['suit_vetra', 0], outer: ['leather', 0], legs: ['jeans', 0], head: ['helmet_full', 0], eyes: ['drops', 0] });
  ok(nf.outer === null && nf.legs === null && nf.eyes === null && nf.feet.item.id === 'kedy' && D.normFit({ top: ['nope', 0] }).top.item.id === 'tee' && D.normFit({ top: ['tee', 99] }).top.ci === 0, 'overalls replace the top, jacket and trousers, a full helmet hides glasses, gaps fall back to the starter set');
  ok(D.normLook({ fit: { head: ['cap_horizon', 0] } }).cover === 'cap' && D.normLook({ fit: { head: ['helmet_open', 0] } }).cover === 'helmet' && D.normLook({}).cover === null, 'hats and helmets decide how the hair is built');
  let heavy = 0, heavyId = '';
  for (const x of D.ITEMS) for (const body of ['m', 'f']) {
    const fit = Object.assign({}, D.DEFAULT_FIT);
    if (x.slot !== 'band') fit[x.slot] = [x.id, x.cols.length - 1];
    const r = D.rig({ body, fit, hair: 'dreads', beard: body === 'm' ? 'full' : 'none' });
    if (r.ni / 3 > heavy) { heavy = r.ni / 3; heavyId = x.id; }
  }
  ok(heavy <= 3400, 'every item fits the triangle budget: ' + heavy + ' (' + heavyId + ')');
  const dressed = [
    { body: 'm', hair: 'curly', beard: 'full', fit: { head: ['helmet_full', 0], top: ['turtle', 0], outer: ['bomber', 0], neck: ['scarf', 0], wrist: ['steel', 0], hands: ['race_gloves', 0] } },
    { body: 'f', hair: 'bun', fit: { head: ['panama', 0], eyes: ['sport_zibens', 0], top: ['hoodie', 0], neck: ['phones', 0], legs: ['skirt', 0] } },
    { body: 'm', hair: 'long', fit: { head: ['helmet_open', 0], top: ['suit_horizon', 0], neck: ['amber', 0] } }
  ];
  const dressProblems = [];
  for (const car of F.Cars.CARS) {
    const g = F.Models.carGeo(car.id);
    for (const look of dressed) {
      const inst = D.make(look), r = inst.rig;
      D.pose(inst, g, 0.1, true);
      const { P } = posed(inst), headV = new Set();
      for (let k = r.head; k < r.ni; k++) headV.add(r.idx[k]);
      let near = 9, crown = -9;
      P.forEach((p, i) => {
        if (headV.has(i)) crown = Math.max(crown, p[1] - (g.shape.topAt(fOf(g, p[2])) - 0.03));
        else near = Math.min(near, Math.hypot(p[0] - g.eye[0], p[1] - g.eye[1], p[2] - g.eye[2]));
      });
      if (near < 0.12) dressProblems.push(car.id + ' ' + look.fit.top[0] + ' collar ' + near.toFixed(3));
      if (crown > 0) dressProblems.push(car.id + ' ' + (look.fit.head || ['-'])[0] + ' through the roof ' + crown.toFixed(3));
    }
  }
  ok(!dressProblems.length, 'hats, helmets and collars fit every car and stay out of the cockpit view: ' + dressProblems.slice(0, 5).join('; '));
  for (const body of ['m', 'f']) {
    const inst = D.make({ body, fit: { top: ['hoodie', 0], legs: ['cargo', 0], feet: ['boots', 0] } }), at = D.stand(inst, 3.7);
    const f = new Float32Array(inst.data);
    let lo = Infinity, hi = -Infinity, bad = 0;
    for (let i = 0; i < inst.rig.nv; i++) { const y = f[i * 7 + 1]; if (!Number.isFinite(y)) bad++; lo = Math.min(lo, y); hi = Math.max(hi, y); }
    ok(!bad && lo > -0.02 && lo < 0.04 && hi > (body === 'm' ? 1.72 : 1.6) && hi < 1.95 && at.head[1] > at.chest[1], 'the standing driver stands on the studio floor ' + body + ': ' + lo.toFixed(3) + '..' + hi.toFixed(3) + ' m');
  }
  {
    const prof = F.Profile.newProfile('wear');
    ok(prof.driver === null && prof.wardrobe.join() === 'tee,tank,jeans,kedy,band' && prof.outfits.length === 3, 'a new profile starts with the starter set and no saved look');
    const old = F.Profile.newProfile('old');
    delete old.wardrobe; delete old.outfits; delete old.driver; delete old.wardrobeSeen;
    F.Profile.saveProfile(old);
    const back = F.Profile.loadProfile();
    ok(back.wardrobe.includes('tee') && back.outfits.length === 3 && back.driver === null && Array.isArray(back.wardrobeSeen), 'old saves get a wardrobe on load');
    F.Profile.wipeProfile();
    const game = new F.Game(world, { profile: prof });
    game.setLook({ body: 'f', hair: 'long', skin: 3, fit: { top: ['blazer', 0] }, junk: 1 });
    ok(prof.driver.body === 'f' && prof.driver.hair === 'long' && prof.driver.skin === 3 && prof.driver.fit === undefined && prof.driver.junk === undefined, 'saving the appearance keeps only appearance fields');
    ok(!game.wearFit({ top: ['plaid', 0], legs: ['jeans', 0] }) && prof.driver.fit === undefined, 'items that are not in the wardrobe cannot be worn');
    game.grantWear(['plaid']);
    ok(game.wearFit({ top: ['plaid', 2], legs: ['jeans', 0], feet: ['kedy', 0], band: false }) && prof.driver.fit.top[1] === 2 && prof.driver.fit.band === false && prof.driver.hair === 'long', 'owned items are worn and saved with their colour');
    ok(D.playerLook(prof).fit.top[0] === 'plaid' && D.playerLook(prof).bandCol === prof.band && D.playerLook(prof).hair === 'long', 'the player look comes from the profile');
  }
  {
    const mn = read('js/apps/forza/fz-menus.js');
    ok(/const tabs = \['ГЛАВНАЯ', 'ФЕСТИВАЛЬ', 'МАШИНЫ', 'ВОДИТЕЛЬ', 'НАВЫКИ', 'НАСТРОЙКИ'\]/.test(mn) && /\[this\.homeTab, this\.festTab, this\.carsTab, this\.driverTab, this\.skillsTab, this\.settingsTab\]/.test(mn) && /sb\('Настройки', 'gear', \(\) => \{ this\.top\.tabIdx = 5;/.test(mn), 'the Horizon menu has the ВОДИТЕЛЬ tab between МАШИНЫ and НАВЫКИ');
    ok(/appearance\(\) \{/.test(mn) && /wardrobe\(\) \{/.test(mn) && /g\.setLook\(st\)/.test(mn) && /g\.wearFit\(fit\)/.test(mn) && /Отменить изменения\?/.test(mn), 'appearance and wardrobe screens save through the game and ask before dropping changes');
  }
  {
    const P = F.Profile;
    ok(P.cleanName('Jānis Bērziņš<>!') === 'Jānis Bērziņš' && P.cleanName('  Гонщик_01 ') === 'Гонщик_01 ' && P.cleanName('x'.repeat(30)).length === 16, 'names keep letters of any alphabet, digits, spaces and «_», up to 16 characters');
    ok(P.nameOk('Гонщик') && P.nameOk('Jānis_B') && !P.nameOk('a') && !P.nameOk('x<y') && !P.nameOk('ab  cd'), 'a name needs 2 to 16 allowed characters');
    const old = P.newProfile('Старый Гонщик'), fresh = P.newProfile('Новый');
    fresh.driver = { body: 'f', hair: 'bob' };
    ok(D.adopt(old) && old.driverNews === true && old.driver.fit.top[0] === 'tee' && D.rigKey(D.playerLook(old)) === D.rigKey(D.playerLook((() => { const o = P.newProfile('Старый Гонщик'); D.adopt(o); return o; })())), 'an old save gets a look from the player name, the starter set and a news banner');
    ok(!D.adopt(fresh) && fresh.driver.hair === 'bob' && !fresh.driverNews, 'a saved look is kept');
    const ui = read('js/apps/forza/fz-ui.js'), mn = read('js/apps/forza/fz-menus.js');
    ok(/newGame\(reg\) \{[\s\S]{0,200}F\.Profile\.newProfile\(reg && reg\.name\)/.test(ui) && /this\.push\(this\.register\(\)\)/.test(mn) && /ui\.newGame\(\{ name, look: lookOf\(\) \}\)/.test(mn) && /scr\.back = \(\) => this\.pop\(\);/.test(mn), 'a new game starts with the participant registration and Esc returns to the title without a profile');
    ok(/НОВОЕ НА ФЕСТИВАЛЕ: ВАШ ВОДИТЕЛЬ/.test(ui) && /p\.driverNews = false;/.test(ui), 'the news banner is shown once');
  }
  {
    const W = F.Wear, prof = F.Profile.newProfile('shop'), game = new F.Game(world, { profile: prof });
    prof.credits = 5000;
    ok(game.buyItem('cap_horizon') === 'ok' && prof.credits === 3500 && prof.wardrobe.includes('cap_horizon') && game.buyItem('cap_horizon') === 'owned' && prof.credits === 3500, 'an item is bought once for its price');
    ok(game.buyItem('cap_vetra') === 'locked' && game.buyItem('helmet_full') === 'reward' && game.buyItem('blazer') === 'locked', 'locked shelves and rewards cannot be bought');
    prof.band = 4;
    ok(game.buyItem('blazer') === 'poor' && prof.credits === 3500, 'an item needs enough credits');
    game.drain();
    prof.band = 3;
    game.save();
    let got = game.drain().filter(e => e.t === 'item').map(e => e.id);
    ok(got.includes('tee_band') && got.includes('helmet_open') && !got.includes('helmet_full'), 'wristbands give their rewards: ' + got.join(','));
    game.save();
    ok(!game.drain().some(e => e.t === 'item'), 'a reward is given once');
    prof.finale = true; prof.photoAll = true; prof.barns.push(F.EV.BARNS.find(b => b.car === 'p356').id);
    for (const st of F.EV.STUNTS) prof.stunts[st.id] = st.stars[2];
    game.save();
    got = game.drain().filter(e => e.t === 'item').map(e => e.id).sort();
    ok(got.join() === ['champ', 'drift_gloves', 'helmet_50s', 'helmet_full', 'photo_vest', 'suit_horizon'].sort().join(), 'the finale, barns, stunts, drift zones and the photo hunt give their items: ' + got.join(','));
    ok(game.wearFit({ top: ['tee_band', 3], legs: ['jeans', 0] }) && !game.wearFit({ top: ['tee_band', 4], legs: ['jeans', 0] }), 'wristband T-shirt colours open with the wristbands');
    const lv = F.Profile.newProfile('gift'), lg = new F.Game(world, { profile: lv });
    let gifts = 0;
    for (let i = 0; i < 12; i++) { lg.addXp(F.EV.xpForLevel(lv.level)); gifts += lg.drain().filter(e => e.t === 'item' && e.why === 'level').length; }
    ok(lv.level === 13 && gifts === 2 && lv.wardrobe.length === W.STARTER.length + 2 && lv.wardrobe.slice(W.STARTER.length).every(id => W.ITEM[id].price > 0 && W.ITEM[id].band <= lv.band), 'every fifth level gives a boutique item from the open shelves');
    let career = 0;
    for (const e of F.EV.EVENTS) if (e.id !== 'prologue') career += (e.id === 'finale' ? 100000 : F.EV.CLASS_PAY[e.cls] * (e.type === 'showcase' ? 1.5 : 1)) * 1.05;
    for (let l = 2; l <= 27; l++) career += F.EV.levelReward(l).cr;
    const shop = W.ITEMS.filter(x => x.price > 0).reduce((a, x) => a + x.price, 0), share = shop / career;
    ok(share >= 0.25 && share <= 0.38, 'the boutique costs about a third of the career income: CR ' + shop + ' of ' + Math.round(career) + ' (' + Math.round(share * 100) + '%)');
    const cheap = W.ITEMS.filter(x => x.price > 0 && x.band === 0 && x.price <= F.EV.CLASS_PAY.D / 2).length;
    ok(cheap >= 15, 'the first shelves offer ' + cheap + ' items for less than half a class D win');
    const mn = read('js/apps/forza/fz-menus.js');
    ok(/this\.confirm\('Бутик Horizon', `Купить «\$\{esc\(x\.name\)\}» за CR/.test(mn) && /Не хватает CR/.test(mn) && /saveOutfit\(k,/.test(mn) && !/boutique[\s\S]{0,4000}ui\.toast\(/.test(mn.slice(mn.indexOf('boutique(slot0)'), mn.indexOf('outfits() {'))), 'the boutique asks before buying and reports in the screen, not with HUD toasts');
  }
  {
    const names = F.RIVAL_NAMES, female = new Set(['Liene', 'Oksana_R', 'Ilze', 'Laura', 'Vika_Riga', 'Zane', 'Inese']);
    const missing = names.filter(n => !D.RIVAL_LOOKS[n]);
    ok(!missing.length && names.every(n => D.rivalLook(n).body === (female.has(n) ? 'f' : 'm')), 'every rival name has its own look: ' + missing.join(','));
    const plain = names.filter(n => Object.entries(D.rivalLook(n).fit).filter(([k, v]) => Array.isArray(v) && !(k === 'feet' && v[0] === 'sneakers') && !(k === 'legs' && v[0] === 'jeans')).length < 2);
    ok(!plain.length, 'every rival wears at least two items of their own: ' + plain.join(','));
    ok(new Set(names.map(n => D.rigKey(D.rivalLook(n)) + D.texKey(D.rivalLook(n)))).size === names.length, 'no two rivals look the same');
    const V = D.rivalLook('Вилкс');
    ok(V.hair === 'slick' && V.hairCol === 0 && V.fit.outer[0] === 'leather' && V.fit.eyes[0] === 'mirror' && V.fit.hands[0] === 'race_gloves', 'Вилкс wears a black leather jacket, mirrored glasses and racing gloves with dark slicked-back hair');
    ok(D.TAXI.every(l => l.fit.head && l.fit.head[0].startsWith('cap')) && [1, 2, 3, 40, 77].every(u => D.TAXI.includes(D.trafficLook(u, 'gaz24'))) && D.trafficLook(5, 'e30') === D.trafficLook(5, 'e30') && D.POOL.includes(D.trafficLook(5, 'e30')), 'Volga drivers in traffic are cab drivers in caps, other traffic comes from the pool of 32');
    ok(D.crowdLooks().length === 36 && D.crowdLooks().every(l => D.rig(l).ni / 3 <= 3400), 'the traffic and taxi looks are built on the loading screen within the budget');
    ok(/this\.driverQueue = F\.Driver\.crowdLooks\(\)/.test(read('js/apps/forza/fz-ui.js')) && /if \(t\.keep \|\| this\.frameNo - t\.seen < 1800\) continue;/.test(read('js/apps/forza/fz-render.js')), 'prebuilt crowd textures are kept');
  }
  {
    const geo = F.Models.carGeo('e30'), inst = D.make({ body: 'm' }), st = D.seatOf(geo, inst.rig.fig, 'm', inst.rig.crown);
    const headFwd = () => { const b = D.B.head * MS, m = inst.mats; return [m[b + 6], m[b + 7], m[b + 8]].map(v => -v); };
    D.pose(inst, geo, 0, false);
    const ahead = headFwd();
    inst.gaze = [st.head[0] - 3, st.head[1], st.head[2] - 1.2];
    D.pose(inst, geo, 0, false);
    const left = headFwd();
    inst.gaze = [st.head[0] + 0.5, st.head[1] - 2, st.head[2] + 3];
    D.pose(inst, geo, 0, false);
    const back = headFwd();
    inst.gaze = null;
    ok(ahead[2] < -0.9 && left[0] < -0.5 && back[0] > 0.3 && back[1] < 0, 'the photo mode gaze turns the head toward the camera within the neck range');
    const ph = read('js/apps/forza/fz-photo.js');
    ok(/list\(3, 'driver', 'Водитель', \[\['show', 'В машине'\], \['hide', 'Скрыт'\]\]\)/.test(ph) && /list\(3, 'gaze', 'Взгляд водителя', \[\['road', 'На дорогу'\], \['camera', 'В камеру'\]\]\)/.test(ph) && /if \(o\.driver === 'hide'\) st\.driver = null;/.test(ph), 'photo mode can hide the driver and make them look into the camera');
  }
  const sx = F.Models.cabinAt;
  let problems = [];
  for (const car of F.Cars.CARS) {
    const g = F.Models.carGeo(car.id), cab = sx(car);
    for (const body of ['m', 'f']) {
      const inst = D.make({ body, hair: body === 'f' ? 'long' : 'curly', beard: body === 'm' ? 'full' : 'none' }), r = inst.rig, st = D.seatOf(g, r.fig, r.body, r.crown);
      for (const steer of [-0.14, 0, 0.14]) {
        D.pose(inst, g, steer, true);
        const { P, N } = posed(inst), m = inst.mats;
        let grip = 0, near = 9, out = 0, crown = -9, flipped = 0;
        for (const hb of [D.B.handL, D.B.handR]) {
          const b = hb * MS, fist = [0, 1, 2].map(i => m[b + 9 + i] + m[b + 3 + i] * 0.07);
          const d = fist.map((v, i) => v - st.wc[i]), along = d[0] * st.Z[0] + d[1] * st.Z[1] + d[2] * st.Z[2];
          grip = Math.max(grip, Math.hypot(Math.hypot(d[0] - st.Z[0] * along, d[1] - st.Z[1] * along, d[2] - st.Z[2] * along) - st.R, along));
        }
        const headV = new Set(); for (let k = r.head; k < r.ni; k++) headV.add(r.idx[k]);
        const rimTop = st.wc[1] + st.R * st.Y[1] + 0.04;
        P.forEach((p, i) => {
          const top = headV.has(i) ? g.shape.topAt(fOf(g, p[2])) - 0.04 : Math.max(g.shape.topAt(fOf(g, p[2])), rimTop);
          if (headV.has(i)) crown = Math.max(crown, p[1] - top);
          else near = Math.min(near, Math.hypot(p[0] - g.eye[0], p[1] - g.eye[1], p[2] - g.eye[2]));
          if (Math.abs(p[0]) > g.W * 0.92 || p[1] < g.yb + 0.04 || p[1] > top) out++;
        });
        for (let k = 0; k < r.ni; k += 3) {
          const a = P[r.idx[k]], b = P[r.idx[k + 1]], c = P[r.idx[k + 2]];
          const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
          const gn = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
          if (Math.hypot(...gn) < 1e-7) continue;
          const vn = [0, 1, 2].map(j => N[r.idx[k]][j] + N[r.idx[k + 1]][j] + N[r.idx[k + 2]][j]);
          if (gn[0] * vn[0] + gn[1] * vn[1] + gn[2] * vn[2] < 0) flipped++;
        }
        if (grip > 0.02) problems.push(car.id + ' ' + body + ' ' + steer + ' hands ' + grip.toFixed(3) + ' m off the rim');
        if (near < 0.12) problems.push(car.id + ' ' + body + ' body ' + near.toFixed(3) + ' m from the cockpit eye');
        if (out) problems.push(car.id + ' ' + body + ' ' + out + ' vertices outside the cabin');
        if (crown > 0) problems.push(car.id + ' ' + body + ' head through the roof');
        if (flipped > r.ni / 3 * 0.01) problems.push(car.id + ' ' + body + ' ' + flipped + ' flipped faces');
      }
      if (cab.bz !== null && st.head[2] + 0.1 > cab.bz - 0.045) problems.push(car.id + ' ' + body + ' head behind the B-pillar');
    }
    ok(cab.eye[2] === g.eye[2] && cab.eye[1] === g.eye[1], 'cockpit eye comes from the cabin layout ' + car.id);
  }
  ok(!problems.length, 'drivers sit in all cars: ' + problems.slice(0, 6).join('; '));
  {
    const geo = F.Models.carGeo('e30'), inst = D.make({ body: 'm' }), st = D.seatOf(geo, inst.rig.fig, 'm', inst.rig.crown), m = inst.mats;
    const fist = hb => { const b = hb * MS; return [0, 1, 2].map(i => m[b + 9 + i] + m[b + 3 + i] * 0.07); };
    const off = p => { const d = p.map((v, i) => v - st.wc[i]), al = d[0] * st.Z[0] + d[1] * st.Z[1] + d[2] * st.Z[2]; return Math.hypot(Math.hypot(d[0] - st.Z[0] * al, d[1] - st.Z[1] * al, d[2] - st.Z[2] * al) - st.R, al); };
    let worst = 0, regrips = 0, lastHeld = [true, true];
    for (let i = 0; i <= 240; i++) {
      const steer = 0.5 * Math.sin(i / 240 * Math.PI * 2);
      D.animate(inst, 1 / 60, { steer, speed: 8 });
      D.pose(inst, geo, steer, true);
      inst.anim.hands.forEach((h, k) => { if (!h.held && lastHeld[k]) regrips++; lastHeld[k] = h.held; if (h.held) worst = Math.max(worst, off(fist(k ? D.B.handR : D.B.handL))); });
    }
    ok(regrips >= 4 && worst < 0.02 && inst.anim.hands.every(h => Math.abs(h.ang) <= 1.65), 'hands re-grip hand over hand on a full turn and stay on the rim: ' + regrips + ' re-grips, ' + worst.toFixed(3) + ' m');
    for (let i = 0; i < 60; i++) D.animate(inst, 1 / 60, { steer: 0, speed: 8 });
    D.cue(inst, 'shift');
    for (let i = 0; i < 11; i++) D.animate(inst, 1 / 60, { steer: 0, speed: 8 });
    D.pose(inst, geo, 0, true);
    const lever = off(fist(D.B.handR)), stay = off(fist(D.B.handL));
    for (let i = 0; i < 30; i++) D.animate(inst, 1 / 60, { steer: 0, speed: 8 });
    D.pose(inst, geo, 0, true);
    ok(lever > 0.15 && stay < 0.02 && off(fist(D.B.handR)) < 0.02, 'a manual gear change sends the right hand to the lever and back');
    D.cue(inst, 'horn');
    for (let i = 0; i < 13; i++) D.animate(inst, 1 / 60, { steer: 0, speed: 8 });
    D.pose(inst, geo, 0, true);
    const hub = fist(D.B.handR);
    ok(Math.hypot(...hub.map((v, i) => v - st.wc[i])) < 0.12, 'the horn puts the right hand on the hub');
    for (let i = 0; i < 90; i++) D.animate(inst, 1 / 60, { steer: 0, speed: 8, back: true });
    ok(inst.anim.yaw.x > 1.2 && inst.anim.twist.x > 0.25, 'looking back turns the head and shoulders');
    for (let i = 0; i < 120; i++) D.animate(inst, 1 / 60, { steer: 0.1, speed: 20, latG: 6, yawRate: 0.4 });
    ok(inst.anim.yaw.x > 0.2 && inst.anim.side.x < -0.03, 'in a right turn the head looks into the turn and the body leans out');
    D.cue(inst, 'hit', { power: 15, dx: 0, dz: 1 });
    let peak = 0;
    for (let i = 0; i < 30; i++) { D.animate(inst, 1 / 60, { steer: 0, speed: 0 }); peak = Math.max(peak, inst.anim.fwd.x); }
    ok(peak > 0.05, 'a frontal hit throws the body forward: ' + peak.toFixed(3));
    const ui = read('js/apps/forza/fz-ui.js');
    ok(/case 'shift': if \(!this\.settings\(\)\.auto\) D\.cue\(inst, 'shift'\)/.test(ui) && /this\.driverEvent\(e\);/.test(ui) && /this\.updateDrivers\(dt\);/.test(ui) && /case 'finish': if \(e\.pos === 1\) D\.cue\(inst, 'win'\)/.test(ui), 'game events reach the player driver');
  }
  const rnd = Math.random;
  Math.random = () => { throw new Error('random'); };
  try {
    const a = D.make(D.rivalLook('Liene')), b = D.make(D.rivalLook('Liene'));
    D.pose(a, F.Models.carGeo('e30'), 0.05, false); D.pose(b, F.Models.carGeo('e30'), 0.05, false);
    ok(Buffer.from(a.data).equals(Buffer.from(b.data)) && D.rivalLook('Liene').body === 'f' && D.rivalLook('Vilks').body === 'm', 'driver looks and poses are deterministic and use no random numbers');
  } finally { Math.random = rnd; }
  const ren = read('js/apps/forza/fz-render.js'), ui = read('js/apps/forza/fz-ui.js');
  ok(/if \(lod === 0 && car\.driver && !car\.inside && !\(car\.dmg && car\.dmg\.burnt\)\) this\.drawDriver\(car, geo, model, false, false\)/.test(ren), 'outside drivers only at LOD0, never in the own cockpit or a burnt car');
  ok(/this\.drawDriver\(car, m\.geo, model, car\.driverPart === 'body', true\)/.test(ren) && /car\.driverPart = this\.cabinDriverPart\(\)/.test(ui) && /return this\.keys\.back \|\| this\.pad\.back \|\| Math\.abs\(this\.look\.yaw\) > LOOK_HIDE_DRIVER \? null : 'body'/.test(ui), 'the cockpit hides the head and neck, look back hides the whole driver, the hood camera shows all');
  ok(/drawRange\(mesh, model, 0, headless \? inst\.rig\.head : inst\.rig\.ni\)/.test(ren), 'the head is cut by the index range');
  ok(/if \(main && cut && lod === 0 && !car\.inside && cut\.g > cut\.c\)/.test(ren) && /if \(uSpecK < 0\.5\) \{ c \*= 0\.55; a = max\(a, 0\.66\); \}/.test(ren), 'Retro 2000 draws LOD0 glass dark and see-through');
  ok(/driver: burnt \? null : this\.driverOf\(g\)/.test(ui) && /a\.drv \|\| \(a\.drv = F\.Driver\.make\(F\.Driver\.rivalLook\(a\.name\)\)\)/.test(ui) && /t\.drv = F\.Driver\.make\(F\.Driver\.trafficLook\(t\.uid, t\.id\)\)/.test(ui), 'player, rivals and traffic have drivers');
});

section('cluster', () => {
  require(path.join(DIR, 'fz-hud.js'));
  const K = F.Cluster, KINDS = new Set(['speed', 'rpm', 'boost', 'fuel', 'temp', 'oil', 'volt']);
  for (const car of F.Cars.CARS) {
    const sp = F.Cars.spec(car.id, {}), lay = K.layoutOf(car, sp), bad = [];
    const inBox = (x, y, rx, ry) => x - rx >= 0 && x + rx <= 512 && y - ry >= 0 && y + ry <= 256;
    if (!K.PALETTES[F.COCK[car.cock].face]) bad.push('palette');
    if (!lay.dials.some(d => d.k === 'speed' || d.k === 'rpm')) bad.push('no main dial');
    for (const d of lay.dials) {
      if (!KINDS.has(d.k)) bad.push('kind ' + d.k);
      if (!d.fan && !inBox(d.x, d.y, d.r + 5, d.r + 5)) bad.push('dial outside ' + d.k);
      const sc = K.scaleOf(d.k, sp, 'kmh');
      if (Math.abs(K.angleOf(d, sc.min, sc) - d.a0) > 1e-9 || Math.abs(K.angleOf(d, sc.max, sc) - d.a1) > 1e-9) bad.push('angles ' + d.k);
      if (d.k === 'rpm' && (Math.abs(sc.red - sp.red / 1000) > 1e-9 || sc.max < sc.red + 0.5)) bad.push('redline');
      if (d.k === 'speed' && sc.max < F.perf(sp).vmax) bad.push('speed scale');
    }
    const round = lay.dials.filter(d => !d.fan);
    const inset = (big, small) => {
      if (Math.hypot(small.x - big.x, small.y - big.y) + small.r + 5 > big.r * 0.97) return false;
      const ang = Math.atan2(small.x - big.x, big.y - small.y) * 180 / Math.PI;
      return ang < big.a0 || ang > big.a1;
    };
    for (let i = 0; i < round.length; i++) for (let j = i + 1; j < round.length; j++) {
      const p = round[i], q = round[j];
      if (Math.hypot(p.x - q.x, p.y - q.y) < p.r + q.r + 4 && !inset(p, q) && !inset(q, p)) bad.push('dials overlap ' + p.k + '/' + q.k);
    }
    const boxes = lay.lcd.map(l => [l.x - l.w / 2, l.y - l.h / 2, l.x + l.w / 2, l.y + l.h / 2]).concat(lay.lamps.map(l => [l.x - 9, l.y - 9, l.x + 9, l.y + 9]));
    for (const l of lay.lcd) if (!K.SLOTS[l.k] || !inBox(l.x, l.y, l.w / 2, l.h / 2)) bad.push('lcd ' + l.k);
    for (const l of lay.lamps) if (!K.LAMP[l.k] || !inBox(l.x, l.y, 9, 9)) bad.push('lamp ' + l.k);
    if (lay.lamps.length > 8) bad.push('too many lamps');
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const p = boxes[i], q = boxes[j];
      if (p[0] < q[2] && q[0] < p[2] && p[1] < q[3] && q[1] < p[3]) bad.push('overlap ' + i + '/' + j);
    }
    const base = K.LAYOUTS[car.sh.cluster] || K.LAYOUTS[F.COCK[car.cock].face];
    if (sp.turbo && base.boost && !lay.dials.some(d => d.k === 'boost')) bad.push('turbo without boost gauge');
    ok(!bad.length, 'instrument cluster layout ' + car.id + (bad.length ? ': ' + bad.join('; ') : ''));
  }
});

section('physics', () => {
  const brakeFrom100 = id => {
    const v = new F.Vehicle(F.Cars.spec(id, {}), {});
    v.place(0, 0, 0, F.NullWorld);
    let t = 0;
    while (v.speed < 27.78 && t < 60) { v.step(1 / 120, { thr: 1, brk: 0, steer: 0 }, F.NullWorld); t += 1 / 120; }
    const x0 = v.x, z0 = v.z;
    t = 0;
    while (v.speed > 0.3 && t < 20) { v.step(1 / 120, { thr: 0, brk: 1, steer: 0 }, F.NullWorld); t += 1 / 120; }
    return Math.hypot(v.x - x0, v.z - z0);
  };
  const lada = brakeFrom100('vaz2105'), ferrari = brakeFrom100('f355');
  ok(lada > 38 && lada < 62, 'Lada stops from 100 km/h in about 50 m: ' + lada.toFixed(1));
  ok(ferrari < lada, 'a sports car stops shorter than the Lada');
  const v = new F.Vehicle(F.Cars.spec('vaz2105', {}), {});
  v.place(0, 0, 0, F.NullWorld);
  let t = 0;
  while (v.speed < 16.7) { v.step(1 / 120, { thr: 1, brk: 0, steer: 0 }, F.NullWorld); t += 1 / 120; }
  const yaw0 = v.yaw;
  let maxLat = 0;
  for (let i = 0; i < 480; i++) { v.step(1 / 120, { thr: 0.35, brk: 0, steer: 1 }, F.NullWorld); maxLat = Math.max(maxLat, Math.abs(v.ayL)); }
  ok(Math.abs(v.yaw - yaw0) > 1, 'full lock turns the car');
  ok(maxLat / 9.81 > 0.5 && maxLat / 9.81 < 1.1, 'road car lateral grip under 1.1 g');
  ok(Math.abs(v.beta) < 0.4, 'stability assist keeps the Lada from spinning');
  const r = new F.Vehicle(F.Cars.spec('vaz2105', {}), {});
  r.place(0, 0, 0, F.NullWorld);
  for (let i = 0; i < 360; i++) r.step(1 / 120, { thr: 0, brk: 1, steer: 0 }, F.NullWorld);
  ok(r.gear < 0 && r.u < -0.5, 'holding the brake at a standstill reverses');
  const overProfile = (profile, kmh, dist) => {
    const flat = { wet: false, lastSurf: 0, ground(x, z) { this.lastSurf = 0; return profile(-z); }, colliders() { return []; }, waterDepth() { return 0; } };
    const car = new F.Vehicle(F.Cars.spec('f355', {}), {});
    car.place(0, 0, 0, flat);
    let gap = 0, air = 0, time = 0;
    while (-car.z < dist && time < 60) {
      car.step(1 / 120, { thr: car.speed * 3.6 < kmh ? 1 : 0, brk: 0, steer: 0 }, flat);
      time += 1 / 120;
      gap = Math.max(gap, car.y - profile(-car.z));
      if (car.air) air += 1 / 120;
    }
    return { gap, air };
  };
  const curb = overProfile(s => (s > 120 ? 0.15 : 0), 160, 200);
  ok(curb.air === 0 && curb.gap < 0.2, 'a 15 cm step at 160 km/h does not launch the car');
  const stairs = overProfile(s => Math.floor(s / 6) * 0.06, 160, 200);
  ok(stairs.air === 0 && stairs.gap < 0.1, 'a stepped road surface does not launch the car');
  const rough = overProfile(s => 0.03 * Math.sin(s * 1.3) + 0.02 * Math.sin(s * 3.1), 160, 200);
  ok(rough.air === 0 && rough.gap < 0.1, 'a bumpy road does not launch the car');
  const harsh = overProfile(s => Math.floor(s / 6) * 0.12, 160, 200);
  ok(harsh.gap < 0.35, 'even 12 cm steps only bounce the car: ' + harsh.gap.toFixed(2));
  const ramp = overProfile(s => (s > 150 && s < 159 ? 1.9 * (s - 150) / 9 : 0), 110, 260);
  ok(ramp.air > 0.8 && ramp.gap > 2, 'a stunt ramp still launches the car');
});

section('damage', () => {
  const T = F.DMG.TUNE, lada = F.Cars.get('vaz2105'), f355 = F.Cars.get('f355');
  const L = lada.sh.len / 2, W = lada.sh.wid / 2, zF = -L + (lada.sh.len - lada.sh.wb) * 0.47;
  {
    const d = new F.Damage(lada, { seed: 1 });
    ok(!d.hit(0, null, -L, 0, 1, T.v0 * 0.9, 1, 1) && !d.log.length, 'a bump below the threshold leaves no dent');
    const r = d.hit(0, null, -L, 0, 1, 18, 1, 1);
    ok(r && r.d > 0.15 && r.d < 0.26 && r.r > 0.5, 'an 18 m/s frontal hit dents the nose by about 20 cm: ' + (r && r.d.toFixed(3)));
    ok(d.part('bumperF') >= 1 && d.hp < 0.92 && d.hp > 0.6, 'the front bumper comes loose and the front engine is hurt: hp ' + d.hp.toFixed(2));
    const e = new F.Damage(f355, { seed: 1 });
    e.hit(0, null, -f355.sh.len / 2, 0, 1, 18, 1, 1);
    ok(e.hp === 1 && e.part('bumperF') >= 1, 'a mid-engined car keeps its engine after a frontal hit');
    e.hit(0, null, f355.sh.len / 2, 0, -1, 18, 1, 1);
    ok(e.hp < 0.92, 'a rear hit hurts the mid engine');
    const soft = new F.Damage(lada, { seed: 1 });
    soft.hit(0, null, -L, 0, 1, 18, 0.2, 1);
    ok(soft.log[0].d < r.d * 0.35, 'soft objects dent less than walls');
  }
  {
    const d = new F.Damage(lada, { seed: 2 });
    for (let i = 0; i < 3; i++) d.hit(0, null, -L, 0, 1, 20, 1, 1);
    const ev = d.drain();
    ok(d.part('bumperF') === 2 && ev.some(e => e.t === 'part' && e.part === 'bumperF' && e.state === 2), 'repeated hits tear the bumper off');
    ok(d.part('glassF') >= 1 && d.crack && d.crack.R > 0.3, 'the windscreen cracks');
    ok(d.part('headL') === 2 && d.part('headR') === 2 && d.part('tailL') === 0, 'both headlights break, the tail lamps stay');
    ok(d.zones()[0] > 0.5 && d.zones()[1] === 0 && d.severity() > 0.3, 'the front zone takes the damage');
    const w = new F.Damage(lada, { seed: 3 });
    w.hit(-W, 0.35, zF, 1, 0, 22, 1, 1);
    ok(w.flat[0] === 1 && w.mech.grip[0] < 0.6 && w.mech.rr[0] > 1 && Math.abs(w.mech.toe[0]) > 0.02 && w.mech.sag[0] > 0, 'a hard hit on the front wheel bends it and bursts the tyre: toe ' + w.mech.toe[0].toFixed(3));
    ok(w.drain().some(e => e.t === 'flat' && e.wheel === 0), 'a burst tyre is reported');
    const m = new F.Damage(lada, { seed: 3 });
    m.hit(-W, 0.35, zF + 0.6, 1, 0, 14, 1, 1);
    ok(!m.flat[0] && Math.abs(m.mech.toe[0]) > 0.005, 'a lighter hit only bends the wheel');
    const c = new F.Damage(lada, { mech: false, seed: 3 });
    c.hit(-W, 0.35, zF, 1, 0, 22, 1, 1);
    c.hp = 0.2;
    c.refreshMech();
    ok(c.flat[0] === 1 && c.mech.toe[0] === 0 && c.mech.grip[0] === 1 && c.mech.power === 1, 'cosmetic damage leaves the handling alone');
    const p = new F.Damage(lada, { seed: 4 });
    p.hp = 0.3;
    p.refreshMech();
    ok(p.mech.power < 0.75 && p.mech.power > 0.5, 'a badly damaged engine loses power: ' + p.mech.power.toFixed(2));
  }
  {
    const d = new F.Damage(lada, { seed: 5 });
    d.hp = T.fireHp * 0.5;
    const seen = [];
    for (let t = 0; t < T.fireT + 1; t += 0.1) { d.update(0.1, 0, 0); for (const e of d.drain()) seen.push(e.t); }
    ok(seen[0] === 'fire' && seen.includes('boom'), 'a dying engine catches fire and explodes: ' + seen.filter(t => t !== 'misfire').join(','));
    ok(d.burnt && d.mech.power === 0 && d.flat.every(f => f === 1) && d.part('hood') === 2 && d.part('glassF') === 2, 'the wreck burns out: no power, flat tyres, parts gone');
    ok(!d.hit(0, null, -L, 0, 1, 25, 1, 1), 'a burnt wreck takes no more dents');
    d.patch(0.3);
    ok(!d.burnt && d.hp === 1 && !d.log.length, 'the tow truck brings a burnt car back repaired');
    const f = new F.Damage(lada, { seed: 6 });
    f.hp = T.fixHp - 0.3;
    ok(f.fix() && f.hp === T.fixHp, 'a field fix patches the engine');
    f.hp = 0.04; f.update(0.1, 0, 0);
    ok(f.burning && !f.fix(), 'a burning engine cannot be patched');
  }
  {
    const d = new F.Damage(lada, { seed: 7 });
    const m0 = d.mark();
    d.hit(0, null, -L, 0, 1, 20, 1, 1);
    const m1 = d.mark(), st1 = Array.from(d.st);
    d.hit(0, null, -L, 0, 1, 20, 1, 1);
    d.hit(W, null, 0, -1, 0, 18, 1, 1);
    d.rewind(m1);
    ok(d.log.length === 1 && Array.from(d.st).join() === st1.join() && d.hp === m1.hp, 'rewinding restores the parts and the engine of that moment');
    d.rewind(m0);
    ok(!d.log.length && d.st.every(s => s === 0) && d.hp === 1 && d.flat.every(f => !f), 'rewinding past the first hit leaves a clean car');
  }
  {
    const wall = { k: 'box', x: 0, z: -40, hx: 20, hz: 1, c: 1, s: 0, y0: -5, y1: 10 };
    const walled = { wet: false, lastSurf: 0, ground() { this.lastSurf = 0; return 0; }, colliders() { return [wall]; }, waterDepth() { return 0; } };
    const v = new F.Vehicle(F.Cars.spec('vaz2105', {}), {});
    v.place(0, 0, 0, walled);
    v.dmg = new F.Damage(lada, { seed: 8 });
    let t = 0, before = null, dent = null;
    while (t < 6) {
      v.step(1 / 120, { thr: 1, brk: 0, steer: 0 }, walled);
      if (!before && v.z < -25) before = v.snap();
      for (const e of v.events) if (e.t === 'dent' && !dent) dent = e;
      t += 1 / 120;
    }
    ok(dent && dent.rec.z < -L + 0.3 && Math.abs(dent.rec.nz - 1) < 0.01 && v.dmg.part('bumperF') >= 1, 'driving into a wall dents the nose');
    v.restore(before);
    ok(!v.dmg.log.length && v.dmg.st.every(s => !s), 'the vehicle snapshot rewinds the damage');
    const run = dmg => {
      const c = new F.Vehicle(F.Cars.spec('vaz2105', {}), {});
      c.place(0, 0, 0, F.NullWorld);
      c.dmg = dmg;
      for (let i = 0; i < 120 * 6; i++) c.step(1 / 120, { thr: 1, brk: 0, steer: 0 }, F.NullWorld);
      return c;
    };
    const clean = run(null), sick = new F.Damage(lada, { seed: 9 });
    sick.hp = 0.3; sick.refreshMech();
    const slow = run(sick);
    ok(slow.speed < clean.speed * 0.9, 'a damaged engine accelerates slower: ' + (slow.speed * 3.6).toFixed(0) + ' vs ' + (clean.speed * 3.6).toFixed(0) + ' km/h');
    const bent = new F.Damage(lada, { seed: 10 });
    bent.toeRaw[0] = 0.2; bent.toeRaw[1] = 0.2; bent.refreshMech();
    const pull = run(bent);
    ok(Math.abs(pull.x) > 1 && Math.abs(clean.x) < 0.05, 'a bent front wheel pulls the car aside: ' + pull.x.toFixed(2) + ' m');
  }
  {
    store.clear();
    const game = new F.Game(world, { profile: F.Profile.newProfile('rewind') });
    game.settings.traffic = 0;
    const v = game.veh, h = F.MAP.HUB, road = world.nearestRoad(h.x + 600, h.z + 400, 400);
    v.place(road.x, road.z, Math.atan2(road.tx, -road.tz), world);
    const gas = { thr: 1, brk: 0, steer: 0 }, idle = { thr: 0, brk: 0, steer: 0 }, back = Object.assign({ rewind: true }, idle);
    for (let i = 0; i < 60 * 4; i++) game.step(1 / 60, gas);
    const moves = [];
    let px = v.x, pz = v.z;
    for (let i = 0; i < 60; i++) {
      game.step(1 / 60, back);
      moves.push(Math.hypot(v.x - px, v.z - pz)); px = v.x; pz = v.z;
    }
    const sorted = moves.slice().sort((a, b) => a - b), mid = sorted[30], top = sorted[59];
    ok(game.rewinding && mid > 0.05 && top < mid * 2.5 && Math.min(...moves) > mid * 0.2, 'rewinding moves the car every tick without jumps: ' + mid.toFixed(2) + '..' + top.toFixed(2) + ' m');
    game.step(1 / 60, idle);
    const rx = v.x, rz = v.z;
    game.step(1 / 60, back);
    ok(Math.hypot(v.x - rx, v.z - rz) < top * 1.5, 'a second rewind starts from where the car stands');
  }
  for (const id of ['vecriga', 'train']) {
    store.clear();
    const profile = F.Profile.newProfile('rewind');
    profile.settings.traffic = 0;
    const game = new F.Game(world, { profile });
    const race = game.startEvent(id, { difficulty: 1, seed: 3 }), st = { idx: race.lastIdx };
    let t = 0;
    while (t < 30 && (race.state !== 'race' || race.time < 6)) {
      game.step(1 / 60, race.state === 'grid' ? { thr: 0.6, brk: 0, steer: 0 } : driveInput(game, race, st));
      t += 1 / 60;
    }
    const cars = [game.veh, ...race.rivals, ...(race.special ? [race.special] : [])];
    const last = cars.map(c => [c.x, c.z]), moves = cars.map(() => []), times = [race.time];
    for (let i = 0; i < 60; i++) {
      game.step(1 / 60, { thr: 0, brk: 0, steer: 0, rewind: true });
      cars.forEach((c, j) => { moves[j].push(Math.hypot(c.x - last[j][0], c.z - last[j][1])); last[j] = [c.x, c.z]; });
      times.push(race.time);
    }
    const jumpy = moves.filter(m => { const s = m.slice().sort((a, b) => a - b); return s[30] > 0.05 && (s[59] > s[30] * 2.5 || s[0] < s[30] * 0.2); }).length;
    const back = times.every((x, i) => !i || (x <= times[i - 1] + 1e-9 && times[i - 1] - x < 0.05));
    ok(game.rewinding && jumpy === 0 && back, id + ': race rewind moves every car and the clock smoothly (' + cars.length + ' cars)');
  }
  {
    store.clear();
    const game = new F.Game(world, { profile: F.Profile.newProfile('damage') });
    const v = game.veh, d = v.dmg;
    ok(d && d.mechOn && game.settings.dmg === 'full', 'full damage is the default');
    game.settings.dmg = 'cosmetic'; game.applyDamageMode();
    ok(v.dmg === d && !d.mechOn, 'cosmetic damage switches the mechanics off');
    game.settings.dmg = 'off'; game.applyDamageMode();
    ok(v.dmg === null, 'damage can be switched off');
    game.settings.dmg = 'full'; game.applyDamageMode();
    ok(v.dmg && v.dmg.mechOn, 'and on again');
    const h = F.MAP.HUB, far = world.nearestRoad(h.x + 600, h.z + 400, 400);
    v.place(far.x, far.z, Math.atan2(far.tx, -far.tz), world);
    game.debugDamage('front'); game.debugDamage('left');
    game.drain();
    const cost = game.repairCost(), cr = game.profile.credits;
    ok(cost > 0 && game.buyRepair() && game.profile.credits === cr - cost && !v.dmg.damaged, 'a paid repair fixes the car: CR ' + cost);
    v.dmg.hp = 0.3; v.dmg.refreshMech();
    let fixed = false;
    for (let i = 0; i < 60 * 3.3; i++) { game.step(1 / 60, { thr: 0, brk: 0, steer: 0, fix: true }); if (game.drain().some(e => e.t === 'fixed')) fixed = true; }
    ok(fixed && v.dmg.hp >= T.fixHp, 'holding F at a standstill patches the engine');
    v.dmg.hp = T.fireHp * 0.5; v.dmg.refreshMech();
    const seen = new Set();
    for (let i = 0; i < 60 * (T.fireT + 4.5); i++) { game.step(1 / 60, { thr: 0, brk: 0, steer: 0 }); for (const e of game.drain()) seen.add(e.t); }
    ok(seen.has('fire') && seen.has('boom') && seen.has('recovered') && !v.dmg.burnt && v.dmg.hp === 1, 'a burnt car is towed and repaired: ' + [...seen].filter(t => /fire|boom|recovered/.test(t)).join(','));
    const idle = { thr: 0, brk: 0, steer: 0 };
    for (let i = 0; i < 60; i++) game.step(1 / 60, idle);
    v.dmg.hp = T.fireHp * 0.5; v.dmg.refreshMech();
    for (let i = 0; i < 60 * (T.fireT + 0.6); i++) game.step(1 / 60, idle);
    const boomed = v.dmg.burnt && game.wreckT > 0;
    for (let i = 0; i < 60 * 1.5; i++) game.step(1 / 60, Object.assign({ rewind: true }, idle));
    game.step(1 / 60, idle);
    ok(boomed && !v.dmg.burnt && v.dmg.burning && game.wreckT === 0, 'rewinding past the explosion brings the burning car back without the tow truck');
    game.resetCar();
    game.drain();
    ok(!v.dmg.burning && v.dmg.hp >= 0.3, 'the tow truck puts the fire out');
    game.debugDamage('front');
    game.drain();
    v.place(h.x, h.z, h.yaw, world);
    game.repairCool = 0;
    let free = null;
    for (let i = 0; i < 30; i++) { game.step(1 / 60, { thr: 0, brk: 0, steer: 0 }); for (const e of game.drain()) if (e.t === 'repaired') free = e; }
    ok(free && free.cost === 0 && free.outpost && !v.dmg.damaged, 'outposts repair for free');
    game.debugDamage('front');
    game.drain();
    const race = game.startEvent('vecriga', { difficulty: 1, seed: 3 });
    ok(!game.veh.dmg.damaged && race.rivals.every(a => a.dmg && !a.dmg.mechOn), 'events start with a fresh car and rivals take visual damage');
    const ai = race.rivals[0];
    game.carCrash(ai, { px: ai.x, pz: ai.z, nx: 1, nz: 0 }, 15);
    ok(ai.dmg.log.length === 1 && game.veh.dmg.log.length === 1, 'a collision dents both cars');
    game.abandonEvent();
    ok(game.veh.dmg.damaged, 'the free-roam damage comes back after the event');
  }
});

section('world', () => {
  ok(world.edges.length >= 300 && world.nodes.length >= 200, 'road network size');
  ok(world.buildings.length > 2000 && world.trees.length > 10000, 'city and forests are populated');
  ok(world.landmarks.length >= 20, 'Riga landmarks placed');
  const adj = new Map();
  for (const e of world.edges) {
    if (!adj.has(e.a)) adj.set(e.a, []);
    if (!adj.has(e.b)) adj.set(e.b, []);
    adj.get(e.a).push(e.b); adj.get(e.b).push(e.a);
  }
  const hub = F.MAP.HUB;
  const near = world.nearestRoad(hub.x, hub.z, 100);
  ok(near && near.d < 40, 'festival hub sits next to a road');
  const seen = new Set([near.e.a]);
  const queue = [near.e.a];
  while (queue.length) for (const n of adj.get(queue.shift()) || []) if (!seen.has(n)) { seen.add(n); queue.push(n); }
  ok(seen.size === adj.size, 'every road is reachable from the festival: ' + seen.size + '/' + adj.size);
  ok(!world.isWaterAt(hub.x, hub.z), 'hub is on land');
  for (const o of F.MAP.OUTPOSTS) {
    ok(!world.isWaterAt(o.x, o.z), 'outpost on land ' + o.id);
    const rd = world.nearestRoad(o.x, o.z, 100);
    ok(rd && rd.d < 45, 'outpost reachable by road ' + o.id);
  }
  for (const b of world.boards) ok(!world.isWaterAt(b.x, b.z), 'board on land ' + b.id);
  for (const b of world.barns) ok(!world.isWaterAt(b.x, b.z), 'barn on land ' + b.id);
  ok(world.boards.length === F.EV.BOARDS.length && world.barns.length === F.EV.BARNS.length, 'every board and barn is placed');
  let worstStep = 0, where = '';
  for (const e of world.edges) {
    for (let i = 0; i + 1 < e.pts.length; i++) {
      const a = e.pts[i], b = e.pts[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 0.01) continue;
      const tx = (b[0] - a[0]) / len, tz = (b[1] - a[1]) / len;
      for (const lat of [-0.8, 0.8]) {
        let prev = null;
        for (let s = 0; s <= len; s += 0.5) {
          const x = a[0] + tx * s - tz * lat, z = a[1] + tz * s + tx * lat;
          if (world.ramps.some(rp => Math.hypot(rp.x - x, rp.z - z) < 15)) { prev = null; continue; }
          const y = world.ground(x, z, e.y[i] + (e.y[i + 1] - e.y[i]) * s / len + 1.2);
          if (prev !== null && Math.abs(y - prev) > worstStep) { worstStep = Math.abs(y - prev); where = e.id + ' @' + Math.round(x) + ',' + Math.round(z); }
          prev = y;
        }
      }
    }
  }
  ok(worstStep < 0.15, 'driving lanes have no height steps over 15 cm: ' + worstStep.toFixed(2) + ' at edge ' + where);
});

section('landmarks', () => {
  for (const f of ['fz-landmarks', 'fz-ads', 'fz-festival', 'fz-street', 'fz-airport', 'fz-market', 'fz-bisumuiza', 'fz-trees']) require(path.join(DIR, f + '.js'));
  const L = F.Landmarks, A = L.regions, names = Object.keys(A), SZ = L.size, S = F.STRIDE;
  const fits = (r, i) => r[0] >= 0 && r[1] >= 0 && r[0] + r[2] <= SZ && r[1] + r[3] <= SZ && names.every((m, j) => j === i || A[m][0] >= r[0] + r[2] || A[m][0] + A[m][2] <= r[0] || A[m][1] >= r[1] + r[3] || A[m][1] + A[m][3] <= r[1]);
  ok(names.every((n, i) => fits(A[n], i)), 'landmark atlas regions fit without overlaps');
  const inAtlas = (u, v) => names.some(n => { const r = A[n]; return u * SZ >= r[0] - 0.01 && u * SZ <= r[0] + r[2] + 0.01 && v * SZ >= r[1] - 0.01 && v * SZ <= r[1] + r[3] + 0.01; });
  const rng = F.rng(3), heights = {}, problems = [];
  for (const type of new Set(F.MAP.LANDMARKS.map(l => l.type))) {
    const fn = F.Models.LM[type];
    if (!fn) { problems.push(type + ' has no model'); continue; }
    const b = new F.Batch(1024);
    b.uvw = L.WHITE;
    const h = fn(b, rng, {});
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity], base = [0, 0], bad = new Set();
    let flipped = 0;
    for (const p of b.finish()) {
      const dv = new DataView(p.data.buffer, p.data.byteOffset, p.nv * S), P = [], N = [];
      for (let i = 0; i < p.nv; i++) {
        const o = i * S, q = [dv.getFloat32(o, true), dv.getFloat32(o + 4, true), dv.getFloat32(o + 8, true)];
        const n = [dv.getInt8(o + 20) / 127, dv.getInt8(o + 21) / 127, dv.getInt8(o + 22) / 127], nl = Math.hypot(n[0], n[1], n[2]);
        if (!q.every(Number.isFinite)) bad.add('position');
        if (nl < 0.95 || nl > 1.06) bad.add('normal');
        if (!inAtlas(dv.getFloat32(o + 12, true), dv.getFloat32(o + 16, true))) bad.add('uv');
        for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], q[k]); hi[k] = Math.max(hi[k], q[k]); }
        if (q[1] < 6) { base[0] = Math.max(base[0], Math.abs(q[0])); base[1] = Math.max(base[1], Math.abs(q[2])); }
        P.push(q); N.push(n);
      }
      for (let k = 0; k < p.ni; k += 3) {
        const a = P[p.idx[k]], c = P[p.idx[k + 1]], d = P[p.idx[k + 2]];
        const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
        const g = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx], gl = Math.hypot(g[0], g[1], g[2]);
        if (gl < 1e-6) continue;
        const ns = [0, 1, 2].map(j => N[p.idx[k]][j] + N[p.idx[k + 1]][j] + N[p.idx[k + 2]][j]);
        if (g[0] * ns[0] + g[1] * ns[1] + g[2] * ns[2] <= 0) flipped++;
      }
    }
    const def = F.LMK[type] || { r: 10 }, m = 3;
    const inside = def.box ? base[0] <= def.box[0] / 2 + m && base[1] <= def.box[1] / 2 + m : Math.max(base[0], base[1]) <= def.r + m + 1.5;
    if (bad.size || flipped || !inside || lo[1] < -0.5 || hi[1] > h + 1) problems.push(type + ' ' + [...bad].join(',') + (flipped ? ' flipped ' + flipped : '') + (inside ? '' : ' outside its footprint') + ' height ' + hi[1].toFixed(1) + '/' + h);
    heights[type] = hi[1];
  }
  ok(!problems.length, 'landmark models are valid: ' + problems.join('; '));
  const has = t => world.landmarks.some(l => l.type === t);
  ok(['blackheads', 'roland', 'tvtower', 'dom', 'peter', 'freedom', 'terminal', 'dzintari', 'turtle', 'ltv'].every(has), 'reference landmarks are on the map');
  ok(heights.tvtower > 280 && heights.peter > 100 && heights.dom > 70 && heights.freedom > 38 && heights.freedom < 45 && heights.blackheads > 28 && heights.blackheads < 36, 'landmark heights follow the 2001 skyline');
  ok(world.landmarks.every(l => { const i = world.oi(l.x, l.z); return i >= 0 && world.occ[i] !== 2; }), 'no landmark stands in the water');
});

section('wrecks', () => {
  for (const f of ['fz-dents', 'fz-debris']) require(path.join(DIR, f + '.js'));
  const P = F.DMG.PART, S = F.STRIDE, M = F.Models;
  const problems = [];
  for (const car of F.Cars.CARS) {
    const sh = car.sh, wing = F.Cars.spec(car.id, {}).wing || null, g = M.carGeo(car.id, wing);
    for (let lod = 0; lod < 3; lod++) {
      const tags = g.tagLods[lod], has = p => tags.some(t => t === p);
      if (!tags || tags.length !== g.lods[lod].n) { problems.push(car.id + '/lod' + lod + ' tags'); continue; }
      const want = ['bumperF', 'bumperR', 'glassF'].concat(sh.ws > 0.12 ? ['hood'] : [], !(sh.suv || sh.van) && sh.rb < 0.9 ? ['trunk'] : [], lod < 2 ? ['mirrorL', 'mirrorR'] : [], wing && (lod < 2 || wing !== 'lip') ? ['wing'] : [], sh.lights !== 'hidden' && sh.lights !== 'popup' ? ['headL', 'headR'] : [], lod < 2 ? ['tailL', 'tailR'] : []);
      const miss = want.filter(n => !has(P[n]));
      if (miss.length) problems.push(car.id + '/lod' + lod + ' untagged ' + miss.join(','));
    }
    const d = new F.Damage(car, { wing, seed: 4 });
    const L = sh.len / 2, W = sh.wid / 2;
    for (const [x, z, nx, nz] of [[0, -L, 0, 1], [-W, 0, 1, 0], [0, L, 0, -1], [0, -L, 0, 1], [0, -L, 0, 1]]) d.hit(x, null, z, nx, nz, 19, 1, 1);
    d.anim.hood = 0.5;
    const inst = new F.Dents.Dented(g, 0), out = inst.compose(d), f = new Float32Array(out.buffer), i8 = new Int8Array(out.buffer);
    let bad = 0, crack = 0, lit = 0;
    const bump = [];
    for (let v = 0; v < inst.nv; v++) {
      for (let k = 0; k < 5; k++) if (!Number.isFinite(f[v * 7 + k])) bad++;
      const l = Math.hypot(i8[v * 28 + 20], i8[v * 28 + 21], i8[v * 28 + 22]) / 127;
      if (l < 0.9 || l > 1.1) bad++;
      const t = g.tagLods[0][v], m = i8[v * 28 + 23];
      if (t === P.glassF && m === F.MAT.CRACK) crack++;
      if ((t === P.headL || t === P.headR) && m === F.MAT.HEAD) lit++;
      if (t === P.bumperF) bump.push(f[v * 7], f[v * 7 + 1], f[v * 7 + 2]);
    }
    const collapsed = d.part('bumperF') === 2 && bump.every((q, k) => Math.abs(q - bump[k % 3]) < 1e-5);
    if (bad || (d.part('glassF') === 1 && !crack) || (d.part('headL') === 2 && d.part('headR') === 2 && lit) || !collapsed) problems.push(car.id + ' dents: bad ' + bad + ' crack ' + crack + ' lit ' + lit + ' collapsed ' + collapsed);
    const pb = inst.partBatch(d, P.bumperF);
    if (!pb || pb.batch.ni < 30 || pb.h[0] < W * 0.6) problems.push(car.id + ' torn bumper mesh');
  }
  ok(!problems.length, 'damage tags, dents, cracks, broken lamps and torn parts for every car: ' + problems.join('; '));
  const flat = { wet: false, lastSurf: 0, lastEdge: null, ground() { this.lastSurf = 3; return 0; }, colliders() { return []; }, isWaterAt() { return false; } };
  const deb = new F.Debris(flat, null);
  const prop = type => ({ type, x: 0, z: 0, y: 0, yaw: 0.3, mass: 60, smash: true, sign: 'main', theme: 'city', ad: 5, goods: 'fruit', len: 3 });
  const slow = deb.spawnProp(prop('bench'), { vx: 0, vz: -6, nx: 0, nz: 1 }, 1200), fast = deb.spawnProp(prop('bench'), { vx: 0, vz: -20, nx: 0, nz: 1 }, 1200);
  ok(slow.length === 1 && fast.length >= 2 && fast.every(b => b.look.meshes.every(m => m.batch.ni > 0)), 'a bench is knocked over whole at low speed and breaks apart at high speed: ' + fast.length + ' pieces');
  const lamp = deb.spawnProp(prop('lamp'), { vx: 0, vz: -15, nx: 0, nz: 1 }, 1200)[0];
  for (const t of ['fence', 'bin', 'stall', 'citylight', 'tlight', 'phone', 'parasol']) deb.spawnProp(prop(t), { vx: 3, vz: -14, nx: 0, nz: 1 }, 1200);
  ok(lamp.h[1] > 3 && Math.abs(lamp.w[0]) + Math.abs(lamp.w[2]) > 0.5 && deb.list.every(b => b.v[1] > 0), 'a lamp post topples, every piece is thrown up and away');
  for (let i = 0; i < 60 * 12; i++) deb.update(1 / 60, [], { x: 0, z: 0 });
  const M3 = new Float32Array(9);
  const up = F.DebrisKit.qmat(lamp.q, M3)[4];
  ok(deb.list.every(b => b.sleep && b.y > -0.05 && b.y < 2.5) && Math.abs(up) < 0.35, 'debris comes to rest on the ground and the lamp lies on its side: up ' + up.toFixed(2));
  ok(deb.list.every(b => Math.hypot(b.x, b.z) < 60), 'pieces land within 60 m of the crash');
  const wall = { k: 'box', x: 0, z: -6, hx: 30, hz: 0.5, c: 1, s: 0, y0: -2, y1: 8 };
  const walled = Object.assign({}, flat, { colliders: () => [wall] });
  const wd = new F.Debris(walled, null);
  wd.spawnProp(prop('bin'), { vx: 0, vz: -20, nx: 0, nz: 1 }, 1200);
  for (let i = 0; i < 60 * 5; i++) wd.update(1 / 60, [], { x: 0, z: 0 });
  ok(wd.list.every(b => b.z > -6), 'walls stop flying debris');
  const pushed = new F.Debris(flat, null), bin = pushed.spawnProp(prop('bin'), { vx: 0, vz: 0, nx: 0, nz: 1 }, 1200)[0];
  bin.v = [0, 0, 0]; bin.w = [0, 0, 0];
  for (let i = 0; i < 60; i++) pushed.update(1 / 60, [], { x: 0, z: 0 });
  const z0 = bin.z;
  for (let i = 0; i < 60; i++) pushed.update(1 / 60, [{ x: 0, y: 0, z: 3 - i * 0.2, yaw: 0, hl: 2, hw: 0.8, hgt: 1.4, vx: 0, vz: -12, m: 1200 }], { x: 0, z: 0 });
  ok(bin.z < z0 - 3, 'a passing car kicks debris lying on the road');
  ok(deb.drain().length === 0 && deb.list.length <= 72, 'the debris budget holds');
});

section('ads', () => {
  const A = F.Ads, R = A.regions, ids = Object.keys(R), SZ = A.size, S = F.STRIDE;
  ok(ids.length >= 50 && ids.every((id, i) => { const r = R[id]; return r[0] >= 0 && r[1] >= 0 && r[0] + r[2] <= SZ && r[1] + r[3] <= SZ && ids.every((m, j) => j === i || R[m][0] >= r[0] + r[2] || R[m][0] + R[m][2] <= r[0] || R[m][1] >= r[1] + r[3] || R[m][1] + R[m][3] <= r[1]); }), 'ad atlas: ' + ids.length + ' designs fit without overlaps');
  for (const [fmt, pools] of Object.entries(A.POOL)) for (const [th, list] of Object.entries(pools)) ok(list.length && list.every(id => R[id] && A.FMT_OF(id) === fmt), 'ad pool ' + fmt + '/' + th + ' uses ' + fmt + ' designs');
  const kinds = {};
  for (const a of world.ads) kinds[a.kind] = (kinds[a.kind] || 0) + 1;
  const want = { bill: [30, 90], tri: [4, 12], shelter: [25, 120], citylight: [60, 320], column: [20, 90], span: [8, 20], hoard: [40, 200], roof: [10, 30] };
  for (const [k, [lo, hi]] of Object.entries(want)) ok(kinds[k] >= lo && kinds[k] <= hi, 'ad sites ' + k + ': ' + kinds[k]);
  const bad = [];
  for (const a of world.ads) {
    if (a.kind === 'roof') continue;
    const onRoad = a.kind === 'span' ? false : !world.offRoad(a.x, a.z, a.kind === 'citylight' || a.kind === 'shelter' || a.kind === 'column' ? 0.2 : 1);
    if (onRoad || world.isWaterAt(a.x, a.z) || !Number.isFinite(a.y)) bad.push(a.kind + '@' + Math.round(a.x) + ',' + Math.round(a.z));
  }
  ok(!bad.length, 'ad sites stand off the carriageways and out of the water: ' + bad.slice(0, 6).join(' '));
  ok(world.ads.filter(a => a.kind === 'bill').every(a => { const d = world.districtAt(a.x, a.z); return !d || (d.style !== 'hansa' && d.style !== 'jugend'); }), 'no roadside billboards in the Old Town and the Art Nouveau centre');
  ok(world.ads.filter(a => a.kind !== 'citylight' && a.kind !== 'roof').every(a => a.cols.length > 0), 'every ad structure has a collider');
  const lights = world.props.filter(p => p.type === 'citylight');
  ok(lights.length === kinds.citylight && lights.every(p => p.smash && p.col_), 'city-light panels are smashable props');
  const flags = world.props.filter(p => p.banner);
  ok(flags.length > 150 && flags.every(p => p.type === 'lamp' && A.POOL.flag[p.banner.theme]), 'lamp posts on the festival roads, the Old Town and Jomas carry banners: ' + flags.length);
  ok(world.edges.filter(e => e.name === 'Межапарка проспект').some(e => flags.some(p => Math.hypot(p.x - e.pts[0][0], p.z - e.pts[0][1]) < 400)), 'festival banners lead along Mežaparka prospekts');
  const hz = world.ads.filter(a => a.kind === 'bill' && Math.hypot(a.x - F.MAP.HUB.x, a.z - F.MAP.HUB.z) < 2600);
  ok(hz.length >= 5, 'billboards within 2.6 km of the festival can point the way: ' + hz.length);
  const inAtlas = (u, v) => ids.some(n => { const r = R[n]; return u * SZ >= r[0] - 0.01 && u * SZ <= r[0] + r[2] + 0.01 && v * SZ >= r[1] - 0.01 && v * SZ <= r[1] + r[3] + 0.01; });
  const check = (name, b, textured) => {
    let flipped = 0, badN = 0, badUv = 0, badP = 0, mats = new Set();
    const parts = b.parts.map(p => [p.data, p.idx, p.nv, p.ni]);
    if (b.n) parts.push([b.u8.subarray(0, b.n * S), b.idx.subarray(0, b.ni), b.n, b.ni]);
    for (const [data, idx, nv, ni] of parts) {
      const dv = new DataView(data.buffer, data.byteOffset, nv * S), P = [], N = [];
      for (let i = 0; i < nv; i++) {
        const o = i * S, q = [dv.getFloat32(o, true), dv.getFloat32(o + 4, true), dv.getFloat32(o + 8, true)];
        const n = [dv.getInt8(o + 20) / 127, dv.getInt8(o + 21) / 127, dv.getInt8(o + 22) / 127], nl = Math.hypot(n[0], n[1], n[2]);
        const mat = dv.getInt8(o + 23);
        mats.add(mat);
        if (!q.every(Number.isFinite)) badP++;
        if (nl < 0.95 || nl > 1.06) badN++;
        if (textured && (mat === F.MAT.AD || mat === F.MAT.TRI) && !inAtlas(dv.getFloat32(o + 12, true), dv.getFloat32(o + 16, true))) badUv++;
        P.push(q); N.push(n);
      }
      for (let k = 0; k < ni; k += 3) {
        const a = P[idx[k]], c = P[idx[k + 1]], d = P[idx[k + 2]];
        const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
        const g = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
        if (Math.hypot(g[0], g[1], g[2]) < 1e-6) continue;
        const ns = [0, 1, 2].map(j => N[idx[k]][j] + N[idx[k + 1]][j] + N[idx[k + 2]][j]);
        if (g[0] * ns[0] + g[1] * ns[1] + g[2] * ns[2] <= 0) flipped++;
      }
    }
    ok(!flipped && !badN && !badUv && !badP, name + ' mesh is valid (flipped ' + flipped + ', normals ' + badN + ', uv ' + badUv + ')');
    return mats;
  };
  const mk = () => { const b = new F.Batch(1024); b.uvw = [0.2, 0.2]; return b; };
  for (const big of [false, true]) { const st = mk(), fb = mk(); const lamps = A.vboard(st, fb, { big }, ['cola', 'hz_l']); check('billboard ' + (big ? 'super' : 'unipole'), st); check('billboard faces ' + big, fb, true); ok(lamps.length === (big ? 8 : 4), 'billboard floodlights'); }
  const tri = A.trivision(['cola', 'fm', 'mobile']);
  ok(check('trivision', tri.batch, true).has(F.MAT.TRI) && tri.lamps.length === 3, 'trivision slats use the rotating material');
  for (const [name, fn] of [['shelter', (st, fb) => A.shelter(st, fb, 'cl_cola')], ['citylight', (st, fb) => A.citylight(st, fb, 'cl_fm', 'cl_hz')], ['column', (st, fb) => A.column(st, fb, ['p_opera', 'p_cirks', 'p_hz'])], ['span', (st, fb) => A.span(st, fb, { w: 20 }, 'b_hz')], ['hoarding', (st, fb) => A.hoarding(st, fb, 'h_cola', 'h_fm')], ['roof sign', (st, fb) => A.roofSign(st, fb, { w: 16 }, 'r_cola')], ['lamp banner', (st, fb) => { A.flagBrackets(st); A.flagPair(fb, 'f_hz'); }]]) {
    const st = mk(), fb = mk();
    fn(st, fb);
    check(name, st);
    check(name + ' faces', fb, true);
  }
  const src = read('js/apps/forza/fz-render.js');
  ok(/mat > 15\.5 && mat < 16\.5/.test(src) && /mat > 14\.5 && mat < 16\.5\) vEmis = uNight \* aCol\.a/.test(src), 'ads glow at night and trivision slats turn in the vertex shader');
});

section('festival', () => {
  const FS = F.MAP.FEST, H = F.MAP.HUB, pads = world.festPads;
  ok(pads && pads.list.length === FS.pads.length, 'festival pads are compiled');
  const onPad = (x, z) => pads.list.some(p => F.inPoly(x, z, p.poly));
  ok(onPad(H.x, H.z) && world.surfaceBiome(H.x, H.z) === F.S.PAVE, 'the festival spawn stands on a paved pad');
  const out = F.MAP.OUTPOSTS.find(o => o.id === 'hub');
  ok(Math.hypot(out.x - H.x, out.z - H.z) < 1 && Math.abs(F.wrap(out.yaw - H.yaw)) < 0.01, 'the hub outpost is the spawn');
  const area = F.MAP.PARKS.find(p => p.id === 'festival');
  ok(area.field && !area.plaza && world.surfaceBiome(1010, -1740) === F.S.GRASS, 'the festival field is grass between the pads');
  ok(world.surfaceBiome(870, -1720) === F.S.GRAVEL, 'the crowd pit is gravel');
  let dev = 0;
  for (let x = 780; x <= 1010; x += 10) for (let z = -1750; z <= -1600; z += 10) if (F.inPoly(x, z, area.poly)) dev = Math.max(dev, Math.abs(world.terrainH(x, z) - world.festY));
  ok(dev < 0.05, 'the festival ground is flattened: ' + dev.toFixed(3) + ' m');
  const hit = (x, z, r) => world.colliders(x - r, z - r, x + r, z + r).filter(c => {
    if (c.k === 'circ' || c.k === 'smash') return Math.hypot(x - c.x, z - c.z) < c.r + r;
    if (c.k === 'box') { const dx = x - c.x, dz = z - c.z; return Math.abs(dx * c.c + dz * c.s) < c.hx + r && Math.abs(-dx * c.s + dz * c.c) < c.hz + r; }
    if (c.k === 'seg') return F.segDist(x, z, c.x1, c.z1, c.x2, c.z2).d < c.r + r;
    if (c.k === 'poly') return F.inPoly(x, z, c.pts);
    return false;
  });
  ok(!hit(H.x, H.z, 3).length, 'nothing solid around the spawn');
  const lane = world.edges.find(e => e.name === 'Фестивальная');
  let blocked = 0;
  for (let s = 0; s <= lane.len; s += 2) { const p = world.edgePoint(lane, s); if (hit(p.x, p.z, lane.hw - 0.5).some(c => !c.src || c.src.type !== 'fflag')) blocked++; }
  ok(lane && blocked === 0, 'the festival boulevard stays clear from the entrance to the stage: ' + blocked);
  const pro = F.EV.get('prologue').via.slice(-1)[0];
  ok(!hit(pro[0], pro[1], 4).length && onPad(pro[0], pro[1]), 'the prologue finishes on the free boulevard');
  const crowds = [FS.pit].concat(FS.zones);
  ok(FS.zones.length >= 2 && world.festCols.filter(c => c.k === 'seg').length >= 3 + FS.zones.length * 4, 'crowd areas are fenced');
  ok(FS.showcase.length === 3 && FS.showcase.every(sc => F.Cars.get(sc.id)) && FS.booths.every(b => ['cola', 'fm', 'mobile', 'kafija'].includes(b.k)), 'showcase cars and sponsor booths');
  const festCars = world.parked.filter(p => p.lot === 'fest');
  ok(festCars.length >= 8 && festCars.every(p => F.Cars.get(p.id) && onPad(p.x, p.z)), 'the car park is filled: ' + festCars.length + ' cars');
  ok(world.props.filter(p => p.type === 'fflag').length === FS.flags.length * 2, 'feather flags line the boulevard');
  void crowds;
  const src = read('js/apps/forza/fz-festival.js');
  ok(/crowds\(\)/.test(src) && /paintScreen/.test(src) && /festLights/.test(src), 'festival crowds, screens and night lights are built');
  ok(/drawFestival\(g, env, cam\)/.test(read('js/apps/forza/fz-ui.js')) && /fireworks\(dt\)/.test(read('js/apps/forza/fz-ui.js')), 'the festival is drawn with showcase, parked cars, crowd, screens and fireworks');
});

function meshProblems(batches, S) {
  const bad = new Set();
  let flipped = 0;
  for (const b of batches) for (const p of b.finish()) {
    const dv = new DataView(p.data.buffer, p.data.byteOffset, p.nv * S), P = [], N = [];
    for (let i = 0; i < p.nv; i++) {
      const o = i * S, q = [dv.getFloat32(o, true), dv.getFloat32(o + 4, true), dv.getFloat32(o + 8, true)];
      const n = [dv.getInt8(o + 20) / 127, dv.getInt8(o + 21) / 127, dv.getInt8(o + 22) / 127], nl = Math.hypot(n[0], n[1], n[2]);
      if (!q.every(Number.isFinite) || !Number.isFinite(dv.getFloat32(o + 12, true))) bad.add('position');
      if (nl < 0.9 || nl > 1.08) bad.add('normal');
      P.push(q); N.push(n);
    }
    for (let k = 0; k < p.ni; k += 3) {
      const a = P[p.idx[k]], c = P[p.idx[k + 1]], d = P[p.idx[k + 2]];
      const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
      const g = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
      if (Math.hypot(g[0], g[1], g[2]) < 1e-6) continue;
      const ns = [0, 1, 2].map(j => N[p.idx[k]][j] + N[p.idx[k + 1]][j] + N[p.idx[k + 2]][j]);
      if (g[0] * ns[0] + g[1] * ns[1] + g[2] * ns[2] <= 0) flipped++;
    }
  }
  return [...bad].concat(flipped ? ['flipped ' + flipped] : []);
}

section('city', () => {
  const S = F.S, St = F.Street, City = F.City;
  const plazas = F.MAP.PARKS.filter(p => p.plaza);
  ok(plazas.every(pk => world.patches.some(p => p.kind === 'tiles' && p.plaza === pk.id)), 'every square is paved with tiles');
  const triArea = t => Math.abs((t[1][0] - t[0][0]) * (t[2][1] - t[0][1]) - (t[1][1] - t[0][1]) * (t[2][0] - t[0][0])) / 2;
  let worst = 0;
  for (const p of world.patches) if (p.poly) { const a = St.earcut(p.poly).reduce((s, t) => s + triArea(t), 0), A = F.polyArea(p.poly); worst = Math.max(worst, Math.abs(a - A) / A); }
  ok(worst < 0.01, 'squares, lots and the apron triangulate without holes: ' + (worst * 100).toFixed(2) + '%');
  const inner = pk => { const bb = F.polyBox(pk.poly); for (let k = 0; k < 60; k++) { const x = F.lerp(bb.x0, bb.x1, F.hash2(k, 1, 3)), z = F.lerp(bb.z0, bb.z1, F.hash2(k, 2, 3)); if (F.inPoly(x, z, pk.poly) && F.polyEdgeDist(x, z, pk.poly) > 2) return [x, z]; } return null; };
  ok(plazas.every(pk => { const q = inner(pk); return q && world.surfaceBiome(q[0], q[1]) === S.PAVE; }), 'squares drive as paving');
  const paths = world.patches.filter(p => p.kind === 'path');
  ok(paths.length >= 25 && paths.every(p => { const a = p.pts[0], nr = world.nearestRoad(a[0], a[1], 20); return nr && Math.abs(nr.d - nr.e.hw - (nr.e.k.side || 0)) < 1.2; }), 'park paths start at the pavement of a street: ' + paths.length);
  let onPath = 0;
  for (const p of paths) for (let i = 1; i + 1 < p.pts.length; i++) {
    const a = p.pts[i], c = p.pts[i + 1];
    for (const t of world.trees) if (Math.abs(t.x - a[0]) < 400 && Math.abs(t.z - a[1]) < 400 && F.segDist(t.x, t.z, a[0], a[1], c[0], c[1]).d < p.w / 2) onPath++;
  }
  ok(onPath === 0 && paths.every(p => world.surfaceBiome((p.pts[1][0] + p.pts[2][0]) / 2, (p.pts[1][1] + p.pts[2][1]) / 2) === S.GRAVEL), 'no tree grows on a park path and paths are gravel');
  ok(world.fountains.length >= 3 && world.fountains.every(f => world.cols.some(c => c.k === 'circ' && Math.hypot(c.x - f.x, c.z - f.z) < 0.1)), 'park hubs get a paved round square with a fountain');
  const walks = world.walkways.filter(wk => wk.door);
  ok(world.patches.filter(p => p.kind === 'walk').length > 400 && walks.length > 300 && walks.every(wk => { const q = wk.pts[1], nr = world.nearestRoad(q[0], q[1], 20); return nr && nr.d < nr.e.hw + (nr.e.k.side || 0) + 0.5; }), 'soviet blocks have walks along the facade and paths to the street: ' + walks.length);
  const yard = world.parked.filter(p => p.lot === 'yard');
  ok(world.lots.filter(l => l.id === 'yard').length >= 40 && yard.length > 150, 'soviet streets have parking pockets with parked cars: ' + yard.length);
  let close = 0;
  for (let i = 0; i < world.parked.length; i++) for (let j = i + 1; j < world.parked.length; j++) { const a = world.parked[i], b = world.parked[j]; if (Math.abs(a.x - b.x) < 3 && Math.abs(a.z - b.z) < 3 && Math.hypot(a.x - b.x, a.z - b.z) < 2.3) close++; }
  ok(world.parked.every(p => F.Cars.get(p.id) && world.offRoad(p.x, p.z, 0.8) && (p.lot === 'fest' || p.lot === 'taxi' || world.lotAt(p.x, p.z))) && close === 0, 'parked cars stand in their bays, off the road and apart');
  ok(world.parked.filter(p => p.lot !== 'fest').every(p => world.cols.some(c => c.src === p && c.k === 'box')), 'parked cars are solid');
  ok(world.parked.filter(p => p.lot !== 'fest').every(p => world.surfaceBiome(p.x, p.z) === S.ASPHALT), 'lots are asphalt');
  ok(world.markets.length >= 5 && world.markets.every(m => world.props.filter(p => (p.type === 'stall' || p.type === 'kiosk') && Math.hypot(p.x - m.x, p.z - m.z) < 20).length >= 12), 'every soviet district has a market square with stalls and kiosks');
  ok(world.structs.filter(g => g.type === 'garages').length >= 8 && world.structs.every(g => world.offRoad(g.x, g.z, 6) && world.cols.some(c => c.k === 'box' && Math.hypot(c.x - g.x, c.z - g.z) < 0.1)), 'garage rows stand off the roads and are solid');
  const stripes = world.paint.filter(p => p.w === 0.55);
  ok(world.crossings.length > 300 && stripes.length > world.crossings.length * 5 && stripes.every(p => world.onCarriageway((p.a[0] + p.b[0]) / 2, (p.a[1] + p.b[1]) / 2, p.y)), 'zebra crossings are painted on the carriageway: ' + world.crossings.length);
  const signs = world.props.filter(p => p.type === 'sign'), kinds = new Set(signs.map(p => p.sign));
  ok(['main', 'yield', 'stop', 'crossing', 'v50', 'bus'].every(k => kinds.has(k)) && signs.every(p => world.offRoad(p.x, p.z, 0.15)), 'road signs by the junction: main road, give way, stop, crossing, speed, bus stop');
  let mixed = 0, right = 0;
  for (const nd of world.nodes) {
    if (!nd.arms || nd.arms.length < 3) continue;
    const ranks = nd.arms.map(A => City.RANK[A.e.kind] || 1);
    if (Math.max(...ranks) === Math.min(...ranks)) continue;
    for (const A of nd.arms) if ((City.RANK[A.e.kind] || 1) < Math.max(...ranks)) { mixed++; const k = world.signFor(A, nd); if (k === 'yield' || k === 'stop') right++; }
  }
  ok(mixed > 50 && right === mixed, 'minor roads give way to major ones: ' + right + '/' + mixed);
  const tl = world.props.filter(p => p.type === 'tlight');
  ok(tl.length > 100 && tl.every(p => world.nodes.some(n => n.arms && n.arms.length >= 4 && Math.hypot(n.x - p.x, n.z - p.z) < n.r + 40)), 'traffic lights stand at big crossroads: ' + tl.length);
  ok(world.signposts.length >= 30 && world.signposts.every(s => s.lines.length >= 2 && s.lines.length <= 3 && s.lines.every(l => ['left', 'up', 'right'].includes(l[0]) && Object.values(City.LV).includes(l[1]))), 'direction boards name Latvian districts: ' + world.signposts.length);
  const kiosks = world.props.filter(p => p.type === 'kiosk');
  ok(kiosks.length > 60 && kiosks.every(p => St.KIOSK[p.kind]), 'kiosks have a trade: press, coffee, flowers, lottery, exchange, ice cream, hot dogs, tobacco');
  const A = St.A, ids = Object.keys(A);
  ok(ids.every((id, i) => A[id][0] >= 0 && A[id][1] >= 0 && A[id][0] + A[id][2] <= 1024 && A[id][1] + A[id][3] <= 1024 && ids.every((m, j) => j === i || A[m][0] >= A[id][0] + A[id][2] || A[m][0] + A[m][2] <= A[id][0] || A[m][1] >= A[id][1] + A[id][3] || A[m][1] + A[m][3] <= A[id][1])), 'street atlas regions fit without overlaps');
  const known = new Set(['lamp', 'blamp', 'fence', 'bin', 'bench', 'cabin', 'lifeguard', 'parasol', 'cafe', 'flowers', 'tires', 'citylight'].concat(Object.keys(F.Models.PROPS)));
  const types = [...new Set(world.props.map(p => p.type))];
  ok(types.every(t => known.has(t)), 'every prop type has a model: ' + types.filter(t => !known.has(t)).join(','));
  const problems = [];
  for (const t of types) {
    if (!F.Models.PROPS[t]) continue;
    const sample = world.props.find(p => p.type === t), b = new F.Batch(256), sb = new F.Batch(64);
    F.Models.buildProp(b, sample, F.rng(3), sb);
    const pr = meshProblems([b, sb], F.STRIDE);
    if (pr.length) problems.push(t + ' ' + pr.join(','));
  }
  ok(!problems.length, 'city prop models are valid: ' + problems.join('; '));
  const scene = read('js/apps/forza/fz-scene.js'), rend = read('js/apps/forza/fz-render.js'), ui = read('js/apps/forza/fz-ui.js');
  ok(/F\.Street\.decorate\(this\)/.test(scene) && /parkpath: \{ road/.test(rend) && /paint: \{ road/.test(rend) && /__street/.test(rend) && /drawParked\(env, cam, C\)/.test(ui), 'the scene builds pavements, lots, paint and street furniture; parked cars are drawn');
});

section('airport', () => {
  const S = F.S, air = world.air, AIR = F.MAP.AIR;
  ok(air && air.forecourt && world.surfaceBiome(-2000, 1622) === S.PAVE, 'the terminal has a tiled forecourt');
  ok(AIR.lots.every(L => world.surfaceBiome((L.x0 + L.x1) / 2, (L.z0 + L.z1) / 2) === S.ASPHALT) && world.parked.filter(p => p.lot === 'P1' || p.lot === 'P2').length >= 40, 'car parks P1 and P2 are filled: ' + world.parked.filter(p => p.lot === 'P1' || p.lot === 'P2').length);
  ok(world.parked.filter(p => p.lot === 'taxi').length >= 6 && world.parked.filter(p => p.lot === 'taxi').every(p => p.id === 'gaz24' || p.id === 'w124' || p.id === 'vaz2108'), 'a taxi rank waits at the terminal');
  ok(world.surfaceBiome(-2000, 1740) === S.ASPHALT && world.surfaceBiome(-2014, 1840) === S.ASPHALT, 'the apron and the link to the runway are concrete');
  ok(world.trees.filter(t => { const d = world.districtAt(t.x, t.z); return d && d.id === 'airport'; }).length < 40 && world.buildings.filter(b => b.style === 'airport').length === AIR.blocks.length, 'no random trees or office blocks on the airfield');
  const hit = (x, z, r) => world.colliders(x - r, z - r, x + r, z + r).filter(c => {
    if (c.k === 'circ' || c.k === 'smash') return Math.hypot(x - c.x, z - c.z) < c.r + r;
    if (c.k === 'box') { const dx = x - c.x, dz = z - c.z; return Math.abs(dx * c.c + dz * c.s) < c.hx + r && Math.abs(-dx * c.s + dz * c.c) < c.hz + r; }
    if (c.k === 'seg') return F.segDist(x, z, c.x1, c.z1, c.x2, c.z2).d < c.r + r;
    if (c.k === 'poly') return F.inPoly(x, z, c.pts);
    return false;
  });
  const rw = world.edges.find(e => e.rid === 'runway');
  let blocked = 0;
  for (let s = 0; s <= air.road.len; s += 2) { const p = world.edgePoint(air.road, s); if (hit(p.x, p.z, air.road.hw - 0.6).length) blocked++; }
  for (let s = 0; s <= rw.len; s += 4) { const p = world.edgePoint(rw, s); if (hit(p.x, p.z, rw.hw - 2).length) blocked++; }
  ok(blocked === 0, 'the airport road and the runway stay clear for the airport race');
  ok(air.planes.length === 5 && air.planes.every(pl => F.Airport.TYPES[pl.type] && hit(pl.x, pl.z, 0.5).length), 'five airliners stand on the apron and are solid');
  ok(air.fence.length > 100 && air.gates.length === 2 && air.gates.every(g => !air.fence.some(f => Math.hypot(f.x - g.x, f.z - g.z) < 6)), 'a smashable fence with two open gates guards the airside');
  ok(world.props.filter(p => p.type === 'afence').every(p => p.smash) && world.props.filter(p => p.type === 'flagpole' && Math.hypot(p.x + 2000, p.z - 1600) < 150).length === 5 && world.props.some(p => p.type === 'windsock'), 'fence panels break, flags fly at the terminal, a windsock by the runway');
  ok(air.lights.filter(l => l.kind === 'edge').length > 40 && air.lights.filter(l => l.kind === 'approach').length === 8 && air.lights.filter(l => l.kind === 'mast').length >= 12, 'runway edge, approach and floodlights');
  ok(air.totem && hit(air.totem.x, air.totem.z, 0.5).length, 'the airport sign greets the road');
  const pr = [];
  for (const pl of air.planes) { const b = new F.Batch(1024), sb = new F.Batch(64); F.Airport.plane(b, sb, pl); const p = meshProblems([b, sb], F.STRIDE); if (p.length) pr.push(pl.type + ' ' + p.join(',')); }
  for (const h of air.hangars) { const b = new F.Batch(1024), sb = new F.Batch(64); F.Airport.hangar(b, sb, h); const p = meshProblems([b, sb], F.STRIDE); if (p.length) pr.push('hangar ' + p.join(',')); }
  const dish = meshProblems([F.Airport.radarDish()], F.STRIDE);
  if (dish.length) pr.push('radar ' + dish.join(','));
  ok(!pr.length, 'plane, hangar and radar models are valid: ' + pr.join('; '));
  const ui = read('js/apps/forza/fz-ui.js');
  ok(/drawAirport\(env, cam\)/.test(ui) && /airLights/.test(ui), 'the radar turns and the airfield lights up at night and in fog');
});

section('zakusala', () => {
  const S = F.S, Z = F.MAP.ZAK, lm = world.landmarks.find(l => l.type === 'ltv');
  ok(lm && lm.name === 'Латвийское телевидение' && F.MAP.LANDMARKS.some(l => l.type === 'ltv'), 'the Latvian Television building stands on Zaķusala');
  const b = new F.Batch(4096);
  b.uvw = F.Landmarks.WHITE;
  const h = F.Models.LM.ltv(b, F.rng(3), {});
  let top = 0;
  for (const p of b.finish()) { const dv = new DataView(p.data.buffer, p.data.byteOffset, p.nv * F.STRIDE); for (let i = 0; i < p.nv; i++) top = Math.max(top, dv.getFloat32(i * F.STRIDE + 4, true)); }
  ok(top > 85 && top < 95 && h >= top - 1, 'the LTV tower rises about 89 m with its rooftop sign: ' + top.toFixed(1) + ' m');
  ok(world.cols.some(c => c.src === lm && c.k === 'box'), 'the LTV complex is solid');
  const c = Math.cos(lm.yaw), sn = Math.sin(lm.yaw), L = (x, z) => [lm.x + c * x - sn * z, lm.z + sn * x + c * z];
  const court = L(60, -36), walk = L(-60, -30), lot = L(-50, -41.4);
  ok(world.surfaceBiome(court[0], court[1]) === S.PAVE && world.surfaceBiome(walk[0], walk[1]) === S.PAVE && world.surfaceBiome(lot[0], lot[1]) === S.ASPHALT, 'LTV has a tiled forecourt, a walk along the facade and a staff car park');
  ok(world.parked.filter(p => p.lot === 'ltv').length >= 15 && world.props.filter(p => p.type === 'obvan' && Math.hypot(p.x - lm.x, p.z - lm.z) < 120).length === 2, 'staff cars and two outside broadcast vans at LTV');
  ok(world.ads.some(a => a.kind === 'shelter' && Math.hypot(a.x - lm.x, a.z - lm.z) < 150) && world.props.filter(p => p.type === 'flagpole' && Math.hypot(p.x - lm.x, p.z - lm.z) < 120).length === 3, 'a bus stop and flags at the LTV forecourt');
  const hit = (x, z, r) => world.colliders(x - r, z - r, x + r, z + r).filter(q => {
    if (q.k === 'circ' || q.k === 'smash') return Math.hypot(x - q.x, z - q.z) < q.r + r;
    if (q.k === 'box') { const dx = x - q.x, dz = z - q.z; return Math.abs(dx * q.c + dz * q.s) < q.hx + r && Math.abs(-dx * q.s + dz * q.c) < q.hz + r; }
    if (q.k === 'seg') return F.segDist(x, z, q.x1, q.z1, q.x2, q.z2).d < q.r + r;
    if (q.k === 'poly') return F.inPoly(x, z, q.pts);
    return false;
  });
  const loop = world.edges.filter(e => e.rid === 'tvloop'), lane = world.edges.find(e => e.name === 'Закюсалас'), emb = world.edges.find(e => e.name === 'Набережная Закюсалас');
  let blocked = 0;
  for (const e of loop.concat([lane, emb])) for (let s = 0; s <= e.len; s += 2) { const p = world.edgePoint(e, s); if (hit(p.x, p.z, e.hw - 0.6).length) blocked++; }
  ok(loop.length >= 2 && loop.every(e => !e.bridge) && blocked === 0, 'the ring road around the TV tower, the lane and the embankment stay clear');
  const T = Z.tower, jn = world.nodes[lane.b];
  ok(jn.arms && jn.arms.length === 3 && jn.arms.filter(A => A.e.rid === 'tvloop').length === 2 && world.crossings.some(q => q.A.e.rid === 'tvloop' && Math.hypot(q.x - jn.x, q.z - jn.z) < 25), 'the lane meets the ring road at a junction with zebra crossings');
  ok(Math.abs(Math.hypot(jn.x - T[0], jn.z - T[1]) - Z.loop) < 3 && loop.every(e => e.pts.every(p => Math.abs(Math.hypot(p[0] - T[0], p[1] - T[1]) - Z.loop) < 4)), 'the ring road circles the tower at ' + Z.loop + ' m');
  ok([0, 60, 120, 180, 240, 300].every(d => world.surfaceBiome(T[0] + Math.cos(d * Math.PI / 180) * Z.tv.ring[0], T[1] + Math.sin(d * Math.PI / 180) * Z.tv.ring[0]) === S.PAVE), 'a paved square rings the foot of the tower');
  ok(world.cols.some(q => q.k === 'circ' && q.src && q.src.type === 'tvtower'), 'the tower base stays solid');
  ok(world.parked.filter(p => p.lot === 'tv').length >= 12 && world.props.some(p => p.type === 'kiosk' && p.kind === 'biletes' && Math.hypot(p.x - T[0], p.z - T[1]) < 45), 'visitor parking and a ticket kiosk at the tower');
  const prom = world.patches.find(p => p.kind === 'tiles' && p.pts === Z.promenade);
  const shore = Z.promenade.filter(q => [6, 10, 14, 18].some(r => [0, 1, 2, 3, 4, 5, 6, 7].some(k => world.isWaterAt(q[0] + Math.cos(k * Math.PI / 4) * r, q[1] + Math.sin(k * Math.PI / 4) * r)))).length;
  ok(prom && shore >= Z.promenade.length * 0.8 && Z.promenade.every(q => !world.isWaterAt(q[0], q[1])), 'a paved promenade follows the river bank: ' + shore + '/' + Z.promenade.length);
  const rails = world.props.filter(p => p.type === 'qrail');
  ok(rails.length > 100 && rails.every(p => p.smash && !world.isWaterAt(p.x, p.z)), 'an iron railing guards the embankment and the promenade: ' + rails.length);
  ok(world.surfaceBiome(Z.terrace[0], Z.terrace[1]) === S.PAVE && world.props.some(p => p.type === 'bench' && Math.hypot(p.x - Z.terrace[0], p.z - Z.terrace[1]) < Z.terrace[2]), 'a viewing terrace with benches at the tip of the island');
  const alley = world.trees.filter(t => t.street && F.segDist(t.x, t.z, lane.pts[0][0], lane.pts[0][1], lane.pts[lane.pts.length - 1][0], lane.pts[lane.pts.length - 1][1]).d < 10);
  ok(alley.length >= 40, 'lindens line the lane to the tower: ' + alley.length);
  store.clear();
  const game = new F.Game(world, { profile: F.Profile.newProfile('zak') });
  const dz = game.stuntDefs.find(d => d.id === 'dz5'), end = dz && world.nearestRoad(dz.bx, dz.bz, 10);
  ok(dz && dz.route && end && end.e.rid === 'tvloop' && dz.len > 600, 'the Zaķusala drift zone ends on the ring road around the tower: ' + Math.round(dz ? dz.len : 0) + ' m');
});

section('lucavsala', () => {
  const S = F.S, LU = F.MAP.LUC, K = LU.park, G = LU.garden, luc = world.luc;
  const isl = F.MAP.ISLANDS.find(i => i.name === 'Луцавсала'), on = p => F.inPoly(p.x, p.z, isl.poly);
  const [ax, az] = K.dir, P = (u, d) => [K.gate[0] + ax * u + az * d, K.gate[1] + az * u - ax * d];
  const [ux, uz] = G.dir, Q = (s, t) => [G.gate[0] + ux * s - uz * t, G.gate[1] + uz * s + ux * t];
  const surf = q => world.surfaceBiome(q[0], q[1]), mid = (a, c) => [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
  const props = (type, q, r) => world.props.filter(p => p.type === type && Math.hypot(p.x - q[0], p.z - q[1]) < r);
  const nearWater = (q, r) => [0, 1, 2, 3, 4, 5, 6, 7].some(k => world.isWaterAt(q[0] + Math.cos(k * Math.PI / 4) * r, q[1] + Math.sin(k * Math.PI / 4) * r));
  const hit = (x, z, r) => world.colliders(x - r, z - r, x + r, z + r).filter(q => {
    if (q.k === 'circ' || q.k === 'smash') return Math.hypot(x - q.x, z - q.z) < q.r + r;
    if (q.k === 'box') { const dx = x - q.x, dz = z - q.z; return Math.abs(dx * q.c + dz * q.s) < q.hx + r && Math.abs(-dx * q.s + dz * q.c) < q.hz + r; }
    if (q.k === 'seg') return F.segDist(x, z, q.x1, q.z1, q.x2, q.z2).d < q.r + r;
    if (q.k === 'poly') return F.inPoly(x, z, q.pts);
    return false;
  });
  const lm = world.landmarks.find(l => l.type === 'lucav'), Mo = P(K.monument[0], K.monument[1]);
  ok(lm && lm.name === 'Памятник защитникам острова Луцавсала' && on(lm) && Math.hypot(Mo[0] - lm.x, Mo[1] - lm.z) < 1.5, 'the monument to the defenders of Lucavsala stands on the island');
  const b = new F.Batch(1024);
  b.uvw = F.Landmarks.WHITE;
  const h = F.Models.LM.lucav(b, F.rng(3), {});
  let top = 0, plaque = 0;
  const pr = F.Landmarks.regions.lucav_plq, SZ = F.Landmarks.size;
  for (const p of b.finish()) {
    const dv = new DataView(p.data.buffer, p.data.byteOffset, p.nv * F.STRIDE);
    for (let i = 0; i < p.nv; i++) {
      top = Math.max(top, dv.getFloat32(i * F.STRIDE + 4, true));
      const u = dv.getFloat32(i * F.STRIDE + 12, true) * SZ, v = dv.getFloat32(i * F.STRIDE + 16, true) * SZ;
      if (u >= pr[0] && u <= pr[0] + pr[2] && v >= pr[1] && v <= pr[1] + pr[3]) plaque++;
    }
  }
  ok(top > 6.4 && top < 7.4 && h >= top - 0.5 && plaque === 16, 'a six-metre granite pyramid with a cross and a plaque on each face: ' + top.toFixed(1) + ' m');
  ok(world.cols.some(c => c.src === lm && c.k === 'circ') && nearWater([lm.x, lm.z], 34) && !nearWater([lm.x, lm.z], 12), 'the monument is solid and stands on the river bank');
  ok([0, 90, 180, 270].every(d => surf([lm.x + Math.cos(d * Math.PI / 180) * 7.5, lm.z + Math.sin(d * Math.PI / 180) * 7.5]) === S.PAVE) && props('bench', Mo, 11).length >= 4 && props('plamp', Mo, 11).length >= 4, 'a round paved square with benches and lamps surrounds the monument');
  const plaza = F.MAP.PARKS.find(pk => pk.id === K.square), ap = K.approach.map(q => P(q[0], q[1]));
  ok(surf(mid(P(...K.link[0]), P(...K.link[1]))) === S.PAVE && surf(mid(ap[0], ap[1])) === S.PAVE && !world.trees.some(t => F.inPoly(t.x, t.z, plaza.poly)), 'a paved approach leads from the avenue over the square to the monument and no tree blocks it');
  const gate = world.props.find(p => p.type === 'pgate'), gp = P(0, K.plaza[3] + 0.5);
  ok(surf(P(0, 20)) === S.PAVE && gate && Math.hypot(gate.x - gp[0], gate.z - gp[1]) < 1 && !hit(gp[0], gp[1], 2.4).length && [-3.4, 3.4].every(u => hit(...P(u, K.plaza[3] + 0.5), 0.3).length), 'the park gate stands on the entrance plaza and a car passes between its posts');
  const parkCars = world.parked.filter(p => p.lot === 'lucpark');
  ok(K.lots.every(([u0, u1]) => surf(P((u0 + u1) / 2, 14)) === S.ASPHALT) && world.lots.filter(l => l.id === 'lucpark').length === 2 && parkCars.length >= 10, 'two car parks flank the park entrance: ' + parkCars.length + ' cars');
  const alleys = [K.spine, K.north, K.memorial, K.east].map(a => a.map(q => P(q[0], q[1])));
  ok(alleys.every(a => a.slice(1).every((q, i) => surf(mid(a[i], q)) === S.PAVE)), 'tiled alleys run from the gate to the hub, the beach, the monument and the rotunda');
  const H = P(K.hub[0], K.hub[1]), alleyTrees = world.trees.filter(t => t.street && t.kind === 'linden' && alleys.some(a => a.slice(1).some((q, i) => F.segDist(t.x, t.z, a[i][0], a[i][1], q[0], q[1]).d < 6)));
  ok(world.fountains.some(f => Math.hypot(f.x - H[0], f.z - H[1]) < 0.5) && props('bench', H, K.hub[2]).length >= 6 && alleyTrees.length >= 50, 'a fountain marks the hub and lindens line the alleys: ' + alleyTrees.length);
  const trails = world.patches.filter(p => p.kind === 'path' && p.pts && p.pts.some(q => Math.hypot(q[0] - H[0], q[1] - H[1]) < 260) && on({ x: p.pts[p.pts.length - 1][0], z: p.pts[p.pts.length - 1][1] }));
  const T = P(K.terrace[0], K.terrace[1]), shore = K.shore.slice(1, -1);
  ok(trails.filter(p => Math.hypot(p.pts[p.pts.length - 1][0] - T[0], p.pts[p.pts.length - 1][1] - T[1]) < K.terrace[2] + 1).length === 2 && shore.every(q => !world.isWaterAt(q[0], q[1]) && nearWater(q, 30)), 'gravel trails follow both banks from the avenue to the beach terrace');
  ok(surf(K.net) === S.SAND && surf(T) === S.PAVE && K.beach.every(q => !world.isWaterAt(q[0], q[1])) && props('cabin', K.net, 60).length === K.cabins[3] && props('lifeguard', K.guard, 2).length === 1 && props('vnet', K.net, 2).length === 1 && props('boat', K.net, 60).length === K.boats.length && props('parasol', K.net, 60).length >= 6 && props('cafe', T, 25).length === 1, 'the beach at the tip of the island has cabins, a lifeguard tower, a volleyball net, boats, parasols and a café');
  const Y = P(K.play[0], K.play[1]);
  ok(surf(Y) === S.SAND && ['swing', 'slide', 'sandbox'].every(t => props(t, Y, 8).length === 1), 'a playground stands in the park');
  const pc = P(K.pitch[0], K.pitch[1]), cc = P(K.court[0], K.court[1]), rt = P(K.rotunda[0], K.rotunda[1]);
  ok(props('goal', pc, K.pitch[2] + 3).length === 2 && !world.trees.some(t => Math.hypot(t.x - pc[0], t.z - pc[1]) < K.pitch[3]) && surf(cc) === S.ASPHALT && props('hoop', cc, K.court[2] + 2).length === 2, 'a football pitch with goals and a streetball court with hoops');
  ok(props('rotunda', rt, 1).length === 1 && hit(rt[0], rt[1], 0.5).length && nearWater(rt, 22) && K.tables.every(q => props('picnic', P(q[0], q[1]), 1).length === 1), 'a rotunda looks over the river and picnic tables stand in the glade');
  const ave = world.nearestRoad(K.gate[0], K.gate[1], 10).e;
  let blocked = 0;
  for (let s = 0; s <= ave.len; s += 2) { const p = world.edgePoint(ave, s); if (hit(p.x, p.z, ave.hw - 0.6).length) blocked++; }
  const ring = world.edges.filter(e => e.rid === 'lucring'), lanes = world.edges.filter(e => e.rid === 'lucgarden'), street = world.edges.find(e => e.name === G.street);
  for (const e of ring.concat(lanes)) for (let s = 1; s <= e.len - 1; s += 2) { const p = world.edgePoint(e, s); if (hit(p.x, p.z, e.hw - 0.5).length) blocked++; }
  ok(blocked === 0, 'the avenue, the ring road and the garden lanes stay clear');
  const ringLen = ring.reduce((a, e) => a + e.len, 0), hubNode = world.nodes[street.a];
  ok(ring.length >= 3 && ringLen > 1300 && ring.concat(lanes).every(e => e.surf === S.GRAVEL && !e.bridge && e.pts.every(q => !world.isWaterAt(q[0], q[1]))) && hubNode.arms.length === 4 && hubNode.arms.filter(A => A.e.rid === 'lucring').length === 2, 'a gravel ring road circles the south of the island from the end of the street: ' + Math.round(ringLen) + ' m');
  ok(Math.min(...ring.concat(lanes).map(e => e.id)) > Math.max(...world.edges.filter(e => e.rid === 'tvloop').map(e => e.id)) && street.id < ring[0].id && world.edges.filter(e => e.name === 'Островной мост').every(e => e.id < ring[0].id), 'the new roads are appended so saved road discoveries keep their ids');
  const huts = world.buildings.filter(bd => bd.garden);
  ok(luc.plots.length >= 85 && huts.length === luc.plots.length && huts.every(bd => on(bd) && bd.floors <= 2 && bd.w < 7 && world.offRoad(bd.x, bd.z, 6) && !nearWater([bd.x, bd.z], 6)), 'the garden colony has a hut on every plot: ' + luc.plots.length);
  const pickets = world.props.filter(p => p.type === 'picket'), cnt = t => world.props.filter(p => p.type === t && on(p)).length;
  ok(pickets.length > 1200 && pickets.every(p => p.smash && world.offRoad(p.x, p.z, 0.3) && !world.isWaterAt(p.x, p.z)) && cnt('beds') > 150 && cnt('ghouse') > 20 && cnt('shed') > 25 && cnt('barrel') > 15, 'plots have picket fences, vegetable beds, greenhouses, sheds and barrels: ' + pickets.length + ' fence sections');
  const apples = world.trees.filter(t => t.kind === 'apple' && on(t)), gardenCars = world.parked.filter(p => p.lot === 'garden');
  ok(apples.length > 200 && gardenCars.length >= 15 && luc.plots.filter(p => p.car).length >= 8, 'apple trees grow in the gardens and gardeners park on their plots: ' + apples.length + ' trees, ' + gardenCars.length + ' cars');
  ok(luc.houses.length >= 20 && luc.houses.every(id => world.buildings[id].style === 'wood' && Math.abs(world.nearestRoad(world.buildings[id].x, world.buildings[id].z, 40, e => e === street).d - 20) < 8), 'wooden houses line the street: ' + luc.houses.length);
  const sq = Q((G.square[0] + G.square[1]) / 2, (G.square[2] + G.square[3]) / 2), lot = Q((G.lot[0] + G.lot[1]) / 2, (G.lot[2] + G.lot[3]) / 2);
  ok(surf(sq) === S.PAVE && world.props.some(p => p.type === 'kiosk' && p.kind === 'seklas' && Math.hypot(p.x - sq[0], p.z - sq[1]) < 14) && props('pump', sq, 14).length === 1 && surf(lot) === S.ASPHALT, 'the colony gate has a paved square with a seed kiosk and a water pump, and a car park');
  const V = G.view, tw = F.MAP.ZAK.tower, seat = props('bench', V, V[2]);
  ok(surf(V) === S.PAVE && seat.length === 3 && seat.every(p => Math.cos(p.yaw - Math.atan2(tw[0] - V[0], -(tw[1] - V[1]))) > 0.99) && props('qrail', V, V[2] + 1).length >= 2 && nearWater(V, 14), 'a riverside terrace with benches faces the TV tower');
  ok(surf(G.landing) === S.SAND && props('boat', G.landing, 22).length === 2 && nearWater(G.landing, G.landing[3] + 12), 'a sandy boat landing lies on the south bank');
  const foot = world.patches.find(p => p.kind === 'path' && p.pts && Math.hypot(p.pts[p.pts.length - 1][0] - Q(0, -150)[0], p.pts[p.pts.length - 1][1] - Q(0, -150)[1]) < 6);
  ok(foot && world.nearestRoad(foot.pts[0][0], foot.pts[0][1], 20).e.name === 'Островной мост', 'a footpath links the garden lane with the avenue');
  ok(['xp19', 'xp20'].every(id => world.boards.some(bd => bd.id === id && on(bd))), 'two XP boards reward a trip to the park and to the south bank');
  ok(!world.trees.some(t => on(t) && world.patchSurf[world.oi(t.x, t.z)]) && !luc.props.some(q => world.isWaterAt(q[1], q[2]) || !world.offRoad(q[1], q[2], 0.2)), 'no tree grows through paving and nothing stands in the water or on a road');
});

section('market', () => {
  const S = F.S, St = F.Street, M = F.Market, T = F.MAP.TIRGUS, trg = world.trg, L = trg.L, lm = world.landmarks.find(l => l.type === 'market');
  const c = Math.cos(T.yaw), sn = Math.sin(T.yaw), loc = (x, z) => [c * (x - T.at[0]) + sn * (z - T.at[1]), -sn * (x - T.at[0]) + c * (z - T.at[1])];
  const surf = (u, v) => { const q = L(u, v); return world.surfaceBiome(q[0], q[1]); };
  const here = p => { const d = world.districtAt(p.x, p.z); return d && d.id === 'tirgus'; };
  const own = new Set(trg.props.map(q => q[0] + ':' + q[1] + ':' + q[2])), mine = type => world.props.filter(p => p.type === type && own.has(p.type + ':' + p.x + ':' + p.z));
  const hit = (x, z, r) => world.colliders(x - r, z - r, x + r, z + r).filter(q => {
    if (q.k === 'circ' || q.k === 'smash') return Math.hypot(x - q.x, z - q.z) < q.r + r;
    if (q.k === 'box') { const dx = x - q.x, dz = z - q.z; return Math.abs(dx * q.c + dz * q.s) < q.hx + r && Math.abs(-dx * q.s + dz * q.c) < q.hz + r; }
    if (q.k === 'seg') return F.segDist(x, z, q.x1, q.z1, q.x2, q.z2).d < q.r + r;
    if (q.k === 'poly') return F.inPoly(x, z, q.pts);
    return false;
  });
  const solidAt = (u, v, r = 0.5) => { const q = L(u, v); return hit(q[0], q[1], r).some(q2 => q2.k !== 'smash'); };
  ok(lm && lm.name === 'Центральный рынок' && here(lm) && trg.props.filter(q => !here({ x: q[1], z: q[2] })).length <= 4 && F.City.LV.tirgus === 'Centrāltirgus' && !F.MAP.PARKS.some(p => p.id === 'sq10'), 'the Central Market is a district of its own around the pavilions');
  const b = new F.Batch(4096);
  b.uvw = F.Landmarks.WHITE;
  const h = F.Models.LM.market(b, F.rng(3), {});
  let top = 0, gable = 0;
  const re = F.Landmarks.regions.mk_end, SZ = F.Landmarks.size;
  for (const p of b.finish()) {
    const dv = new DataView(p.data.buffer, p.data.byteOffset, p.nv * F.STRIDE);
    for (let i = 0; i < p.nv; i++) {
      top = Math.max(top, dv.getFloat32(i * F.STRIDE + 4, true));
      const u = dv.getFloat32(i * F.STRIDE + 12, true) * SZ, v = dv.getFloat32(i * F.STRIDE + 16, true) * SZ;
      if (u >= re[0] && u <= re[0] + re[2] && v >= re[1] && v <= re[1] + re[3]) gable++;
    }
  }
  ok(T.halls.v.length === 4 && top > T.halls.top + 4 && top < T.halls.top + 7 && h >= top - 0.5 && gable > 100, 'four vaulted pavilions and the Meat pavilion across them with glazed gables: ' + top.toFixed(1) + ' m to the flag');
  ok(solidAt(-20, 0) && solidAt(-20, -60) && solidAt(25.5, -30) && solidAt(50.5, 30) && solidAt(30, -30) && solidAt(46, 25) && !solidAt(38, -56) && !solidAt(38, 52) && !solidAt(25.5, -2) && !solidAt(50.5, -2), 'the pavilions are solid while the Meat pavilion stays open at both gables and both side doors');
  const lane = world.edges.filter(e => e.rid === 'tirgus'), stub = world.edges.filter(e => e.rid === 'autoosta');
  let blocked = 0, indoors = 0;
  for (const e of lane) for (let s = 1; s <= e.len - 1; s += 1.5) {
    const p = world.edgePoint(e, s), v = loc(p.x, p.z)[1];
    if (hit(p.x, p.z, e.hw - 0.4).some(q => q.k !== 'smash') || hit(p.x, p.z, 1.5).length) blocked++;
    if (v > T.meat.v[0] && v < T.meat.v[1]) indoors++;
  }
  ok(lane.length && lane.concat(stub).every(e => e.kind === 'yard' && e.surf === S.COBBLE && e.k.traffic === 0) && blocked === 0 && indoors > 60, 'a cobbled lane without traffic runs clear through the Meat pavilion: ' + indoors + ' samples indoors');
  const nodeAt = q => world.nodes.find(n => Math.hypot(n.x - q[0], n.z - q[1]) < 1), north = nodeAt([1083.6, 401.7]), south = nodeAt([896, 533.1]);
  ok(north && north.arms.length === 3 && north.arms.filter(A => A.e.name === 'Прагас').length === 2 && south && south.arms.length === 3 && south.arms.some(A => A.e.name === 'Маскавас') && south.arms.some(A => A.e.rid === 'autoosta'), 'Prāgas iela runs past the north gate and Maskavas iela reaches the south gate and the bus station');
  ok(Math.min(...lane.concat(stub).map(e => e.id)) > Math.max(...world.edges.filter(e => e.rid === 'lucring' || e.rid === 'lucgarden').map(e => e.id)), 'the market roads are appended so saved road discoveries keep their ids');
  const driven = (u, v) => { const q = L(u, v); world.ground(q[0], q[1], trg.y + 1); return world.lastSurf; };
  ok(surf(-62, 0) === S.PAVE && surf(18.5, 20) === S.PAVE && surf(100, -20) === S.ASPHALT && surf(86, -110) === S.ASPHALT && surf(-10, -114) === S.ASPHALT && surf(40, 115) === S.GRAVEL && driven(38, 0) === S.COBBLE && driven(38, -100) === S.COBBLE, 'a tiled promenade and alley, asphalt yards, a cobbled lane and a gravel run-off past the north gate');
  const stalls = mine('stall'), crates = mine('crates'), trade = new Set(mine('kiosk').map(p => p.kind));
  ok(stalls.length >= 100 && stalls.every(p => p.smash && St.GOODS[p.goods]) && crates.length >= 40 && crates.every(p => p.smash) && mine('cart').length >= 6, 'rows of stalls, crate piles and hand carts are there to be smashed: ' + stalls.length + ' stalls, ' + crates.length + ' piles');
  ok(['biletes', 'hotdog', 'tabaka', 'kafija', 'ziedi', 'valuta', 'loto', 'prese', 'saldejums'].every(k => trade.has(k)) && mine('plamp').length >= 8 && mine('flagpole').length === 3 && mine('hlamp').length === 6 && mine('slamp').length === T.sheds.length + T.bus.lamps.length &&mine('alamp').length >= 12, 'kiosks, promenade lamps, flags, hall lamps and yard masts furnish the market');
  ok(trg.props.every(q => !world.isWaterAt(q[1], q[2]) && (q[0] === 'crates' || q[0] === 'hlamp' || world.offRoad(q[1], q[2], 0.2))), 'only hall lamps and crates share the lane, nothing else stands on a road or in the water');
  const cars = world.parked.filter(p => p.lot === 'tirgus'), taxis = world.parked.filter(p => p.lot === 'taxi' && Math.hypot(p.x - lm.x, p.z - lm.z) < 200);
  ok(cars.length >= 40 && taxis.length === T.bus.taxi[3] && trg.buses.length === T.bus.bays.length - 1 + T.bus.spare.length && trg.trucks.length === T.trucks.length && trg.buses.concat(trg.trucks).every(v => hit(v.x, v.z, 0.3).some(q => q.k === 'box')), 'shoppers park in the yards, taxis wait at the bus station, coaches stand in their bays and lorries unload: ' + cars.length + ' cars');
  const onSolid = (u, v) => { const q = L(u, v); return trg.solids.some(s => (s.kind === 'deck' || s.kind === 'shed') && Math.abs((q[0] - s.x) * s.c + (q[1] - s.z) * s.s) <= s.hx + 0.01 && Math.abs(-(q[0] - s.x) * s.s + (q[1] - s.z) * s.c) <= s.hz + 0.01); };
  ok(trg.crowds.length >= 20 && trg.crowds.every(z => onSolid(z.box[0], z.box[1]) && onSolid(z.box[2], z.box[3]) && onSolid(z.box[0], z.box[3]) && onSolid(z.box[2], z.box[1])), 'people only stand on the trading decks, under the sheds and on the bus platform, out of reach of cars');
  const folk = M.people(world), heads = folk.reduce((a, g) => a + g.n, 0);
  ok(heads >= 140 && !meshProblems(folk.map(g => g.batch), F.STRIDE).length, 'shoppers, traders in aprons and passengers fill the market: ' + heads);
  const bd = world.boards.find(q => q.id === 'xp8'), spot = L(18.5, -2), mid = L(38, -2);
  let sight = 0;
  for (let k = 0.25; k < 1; k += 0.05) if (hit(F.lerp(spot[0], mid[0], k), F.lerp(spot[1], mid[1], k), 1).some(q => q.k !== 'smash')) sight++;
  ok(bd && Math.hypot(bd.x - spot[0], bd.z - spot[1]) < 0.5 && Math.cos(bd.yaw - F.yawOf(mid[0] - spot[0], mid[1] - spot[1])) > 0.99 && sight === 0, 'an XP board stands in the alley and shows through the side door of the Meat pavilion');
  store.clear();
  const game = new F.Game(world, { profile: F.Profile.newProfile('tirgus') });
  const trap = game.stuntDefs.find(d => d.id === 'st11'), sign = world.signs.find(s => s.id === 'st11'), at = sign && loc(sign.x, sign.z);
  ok(trap && Math.hypot(trap.x - mid[0], trap.z - mid[1]) < 1 && world.nearestRoad(trap.x, trap.z, 5).e.rid === 'tirgus' && at && at[0] > T.meat.u[0] && at[0] < T.meat.u[1] && at[1] > T.meat.decks[0][1] && at[1] < T.meat.decks[1][0], 'a speed trap waits in the middle of the Meat pavilion');
  const veh = new F.Vehicle(F.Cars.spec('vaz2105', {}), {}), from = L(38, -148), ahead = trg.D(0, 1);
  veh.place(from[0], from[1], F.yawOf(ahead[0], ahead[1]), world);
  let bumps = 0, speed = 0, last = -148;
  for (let t = 0; t < 40 && last < 60; t += 1 / 120) {
    const aim = L(38, last + Math.max(8, veh.speed * 0.6)), fx = Math.sin(veh.yaw), fz = -Math.cos(veh.yaw), dx = aim[0] - veh.x, dz = aim[1] - veh.z;
    veh.step(1 / 120, { thr: 1, brk: 0, steer: F.clamp(Math.atan2(dx * -fz + dz * fx, dx * fx + dz * fz) * 2.2, -1, 1), analog: true, hand: false }, world);
    for (const e of veh.events.splice(0)) if (e.t === 'hit' || e.t === 'smash') bumps++;
    const v = loc(veh.x, veh.z)[1];
    if (last < -2 && v >= -2) speed = veh.speed * 3.6;
    last = v;
  }
  ok(last >= 60 && bumps === 0 && speed >= F.EV.STUNTS.find(s => s.id === 'st11').stars[0],'a Zhiguli from a standing start at Maskavas iela drives straight through and earns the first star: ' + speed.toFixed(0) + ' km/h');
  const parts = {
    shed: (wb, mb, sb) => M.shed(wb, mb, sb, trg.sheds[0]), coach: (wb, mb) => M.coach(wb, mb, 1), zil: (wb, mb) => M.lorry(wb, mb, 'zil', 1), van: (wb, mb) => M.lorry(wb, mb, 'van', 0), kvass: (wb, mb) => M.lorry(wb, mb, 'kvass', 0),
    gate: (wb, mb) => M.arch(wb, mb, T.arch[2]), platform: (wb, mb) => M.busDeck(wb, mb, T.bus), sign: (wb, mb) => M.roofSign(wb, mb, 15), deck: (wb, mb, sb) => M.deck(wb, mb, sb, -12, -4, -50, -8, -1, ['fish', 'meat', 'dairy'], T.meat.deck)
  };
  const bad = [];
  for (const [name, fn] of Object.entries(parts)) {
    const bs = [new F.Batch(1024), new F.Batch(256), new F.Batch(64)];
    bs[1].uvw = M.WHITE_UV; bs[2].uvw = St.WHITE_UV;
    fn(...bs);
    const pr = meshProblems(bs, F.STRIDE);
    if (pr.length) bad.push(name + ' ' + pr.join(','));
  }
  ok(!bad.length, 'shed, coach, lorry, gate, platform and counter models are valid: ' + bad.join('; '));
  const A = M.A, ids = Object.keys(A);
  ok(ids.every((id, i) => A[id][0] >= 0 && A[id][1] >= 0 && A[id][0] + A[id][2] <= 1024 && A[id][1] + A[id][3] <= 512 && ids.every((m, j) => j === i || A[m][0] >= A[id][0] + A[id][2] || A[m][0] + A[m][2] <= A[id][0] || A[m][1] >= A[id][1] + A[id][3] || A[m][1] + A[m][3] <= A[id][1])), 'market atlas regions fit without overlaps');
  const term = world.buildings[trg.terminal], stores = T.stores.filter(q => world.buildings.some(bd2 => bd2.fac === 'brick5' && bd2.roof === 'gable' && Math.hypot(bd2.x - L(q[0], q[1])[0], bd2.z - L(q[0], q[1])[1]) < 1));
  ok(term && term.fac === 'glass' && stores.length === T.stores.length && trg.fence.slice(1).every((q, i) => hit((q[0] + trg.fence[i][0]) / 2, (q[1] + trg.fence[i][1]) / 2, 0.3).some(q2 => q2.k === 'seg')), 'the bus terminal, the red-brick warehouses and a concrete fence along the railway');
  const scene = read('js/apps/forza/fz-scene.js'), ui = read('js/apps/forza/fz-ui.js'), hud = read('js/apps/forza/fz-hud.js');
  ok(/F\.Market\.decorate\(this\)/.test(scene) && /drawMarket\(env, cam, C\)/.test(ui) && /'mkt'/.test(ui) && /trg\.roofs/.test(hud), 'the scene builds the market, its crowd is drawn and the map shows the pavilions');
  ok(trg.meat.length === 4 && F.inPoly(mid[0], mid[1], trg.meat) && !F.inPoly(spot[0], spot[1], trg.meat) && /dry\(x, z\)/.test(ui) && /dry\(cam\.x, cam\.z\)/.test(ui) && /!this\.market\.roof/.test(ui) && /market: this\.market\.near/.test(ui), 'rain and wheel spray stay outside the vault of the Meat pavilion and the market is heard nearby');
});

section('bisumuiza', () => {
  const S = F.S, B = F.MAP.BIS, Bis = F.Bis, bis = world.bis, tram = bis.tram, T = B.tram;
  const hit = (x, z, r) => world.colliders(x - r, z - r, x + r, z + r).filter(q => {
    if (q.k === 'circ' || q.k === 'smash') return Math.hypot(x - q.x, z - q.z) < q.r + r;
    if (q.k === 'box') { const dx = x - q.x, dz = z - q.z; return Math.abs(dx * q.c + dz * q.s) < q.hx + r && Math.abs(-dx * q.s + dz * q.c) < q.hz + r; }
    if (q.k === 'seg') return F.segDist(x, z, q.x1, q.z1, q.x2, q.z2).d < q.r + r;
    if (q.k === 'poly') return F.inPoly(x, z, q.pts);
    return false;
  });
  const solid = (q, r = 0.4) => hit(q[0], q[1], r).some(c => c.k !== 'smash');
  const surf = q => world.surfaceBiome(q[0], q[1]), far = (a, c) => Math.hypot(a[0] - c[0], a[1] - c[1]), at = p => [p.x, p.z];
  const lmOf = type => world.landmarks.find(l => l.type === type);
  const frame = type => { const lm = lmOf(type), c = Math.cos(lm.yaw), s = Math.sin(lm.yaw); return (u, v) => [lm.x + c * u - s * v, lm.z + s * u + c * v]; };
  const mine = p => B.rows.some(zn => F.inPoly(p.x, p.z, zn.poly)), byOwn = p => { const nr = world.nearestRoad(p.x, p.z, 40); return !!nr && nr.e.own; };
  const props = (type, q, r) => world.props.filter(p => p.type === type && far(at(p), q) < r);
  const nearWater = (q, r) => [0, 1, 2, 3, 4, 5, 6, 7].some(k => world.isWaterAt(q[0] + Math.cos(k * Math.PI / 4) * r, q[1] + Math.sin(k * Math.PI / 4) * r));
  const chain = (start, pick) => {
    const pts = [];
    let nd = start, prev = null;
    for (let g = 0; g < 60; g++) {
      const e = nd.edges.map(id => world.edges[id]).find(q => q !== prev && pick(q, nd));
      if (!e) break;
      const fwd = e.a === nd.id, n = e.pts.length;
      for (let k = pts.length ? 1 : 0; k < n; k++) pts.push(e.pts[fwd ? k : n - 1 - k]);
      nd = world.nodes[fwd ? e.b : e.a];
      prev = e;
    }
    return pts;
  };
  const drive = (car, pts, marks) => {
    const veh = new F.Vehicle(F.Cars.spec(car, {}), {}), s = [0], out = { lands: [], bumps: [], speed: {} };
    for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + far(pts[i], pts[i - 1]));
    const on = d => { let i = 1; while (i < pts.length - 1 && s[i] < d) i++; const t = F.clamp((d - s[i - 1]) / (s[i] - s[i - 1]), 0, 1); return [F.lerp(pts[i - 1][0], pts[i][0], t), F.lerp(pts[i - 1][1], pts[i][1], t)]; };
    veh.place(pts[0][0], pts[0][1], F.yawOf(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), world);
    let prog = 0;
    for (let t = 0; t < 60 && prog < s[s.length - 1] - 2; t += 1 / 120) {
      let best = 1e9;
      for (let d = Math.max(0, prog - 5); d < prog + 30; d += 0.5) { const q = on(d), dd = far(q, [veh.x, veh.z]); if (dd < best) { best = dd; prog = d; } }
      const aim = on(prog + Math.max(8, veh.speed * 0.6)), fx = Math.sin(veh.yaw), fz = -Math.cos(veh.yaw), dx = aim[0] - veh.x, dz = aim[1] - veh.z;
      veh.step(1 / 120, { thr: 1, brk: 0, steer: F.clamp(Math.atan2(dx * -fz + dz * fx, dx * fx + dz * fz) * 2.2, -1, 1), analog: true, hand: false }, world);
      for (const e of veh.events.splice(0)) { if (e.t === 'land') out.lands.push({ dist: e.dist, s: prog }); else if (e.t === 'hit' || e.t === 'smash') out.bumps.push(prog); }
      for (const [name, q] of marks || []) if (out.speed[name] === undefined && far([veh.x, veh.z], q) < 4) out.speed[name] = veh.speed * 3.6;
    }
    return out;
  };
  const model = (type, regions) => {
    const b = new F.Batch(4096), used = {}, SZ = F.Landmarks.size;
    b.uvw = F.Landmarks.WHITE;
    const h = F.Models.LM[type](b, F.rng(3), {});
    let top = 0;
    for (const p of b.finish()) {
      const dv = new DataView(p.data.buffer, p.data.byteOffset, p.nv * F.STRIDE);
      for (let i = 0; i < p.nv; i++) {
        top = Math.max(top, dv.getFloat32(i * F.STRIDE + 4, true));
        const u = dv.getFloat32(i * F.STRIDE + 12, true) * SZ, v = dv.getFloat32(i * F.STRIDE + 16, true) * SZ;
        for (const name of regions) { const r = F.Landmarks.regions[name]; if (u >= r[0] && u <= r[0] + r[2] && v >= r[1] && v <= r[1] + r[3]) used[name] = (used[name] || 0) + 1; }
      }
    }
    return { h, top, used };
  };
  const nameAt = (x, z) => { const d = world.districtAt(x, z); return d && d.name; };
  ok(nameAt(900, 2430) === 'Зиепниеккалнс' && nameAt(1100, 2650) === 'Зиепниеккалнс' && nameAt(1600, 2500) === 'Бишумуйжа' && nameAt(1792, 2587) === 'Бишумуйжа' && nameAt(2030, 2514) === 'Бишумуйжа' && ['ziepnieks', 'bauskas', 'csdd'].every(id => F.City.LV[id] === 'Ziepniekkalns') && ['bisumuiza', 'kometas', 'piens', 'muiza'].every(id => F.City.LV[id] === 'Bišumuiža'), 'the south bank of the Bieķengrāvis is Ziepniekkalns in the west and Bišumuiža in the east');
  const own = world.edges.filter(e => e.own), J = world.nodes.find(n => far(at(n), [1220, 2558]) < 1), west = world.nodes.find(n => far(at(n), [477, 2438]) < 1);
  const oldLast = Math.max(...world.edges.filter(e => e.rid === 'tirgus' || e.rid === 'autoosta').map(e => e.id));
  ok(own.length >= 30 && own.every(e => e.id > oldLast && !e.bridge && e.pts.every(q => !world.isWaterAt(q[0], q[1]))) && world.edges.filter(e => !e.own).every(e => e.id <= oldLast) && own.reduce((a, e) => a + e.len, 0) > 6000, 'the roads of the district are appended last, so saved road discoveries keep their ids: ' + own.length + ' sections');
  ok(world.nodes[19].arms.some(A => A.e.rid === 'bismuk') && J && J.arms.length === 4 && J.arms.filter(A => A.e.kind === 'ave').length === 2 && J.arms.filter(A => A.e.name === T.name).length === 2 && west && west.arms.length === 2 && west.arms.every(A => A.e.name === T.name) && west.arms.filter(A => A.e.own).length === 1, 'Mūkusalas iela continues along the water to a crossroads with Bauskas iela, which runs on from its old end');
  const guide = B.posts.map(sp => world.signposts.find(q => far(at(q), sp.at) < 14 && q.lines === sp.lines));
  ok(guide.every(q => q && q.id < 128 && world.offRoad(q.x, q.z, 0.8) && hit(q.x, q.z, 0.3).some(c => c.k === 'circ')) && guide[0].lines[0][1] === F.City.LV.muiza && guide.slice(0, 3).every(q => far(at(q), at(J)) < 90 && Math.cos(q.yaw - F.yawOf(J.x - q.x, J.z - q.z)) > 0.7), 'direction boards before the crossroads and at the start of the embankment name Bišumuiža, Ziepniekkalns, Torņakalns and the centre');
  const foreign = world.ads.filter(a => byOwn(a) && !bis.stops.some(st => far(at(a), at(st)) < 0.1)), tall = world.buildings.filter(bd => mine(bd) && bd.roof === 'flat' && bd.h > 15);
  const streetLamps = world.props.filter(p => p.type === 'lamp' && own.some(e => e.name === T.name && p.x > e.x0 - 9 && p.x < e.x1 + 9 && p.z > e.z0 - 9 && p.z < e.z1 + 9)).map(p => [p, world.nearestRoad(p.x, p.z, 9, e => e.own && e.name === T.name)]).filter(q => q[1] && Math.abs(q[1].tx) > 0.5);
  ok(!foreign.length && !tall.length && world.ads.filter(a => byOwn(a)).length === bis.stops.length && streetLamps.length >= 25 && streetLamps.every(([p, nr]) => p.z < nr.z), 'the city-wide generators leave the district alone: only tram stops carry posters, no roof is tall enough for a roof sign and the lamps of the tram street stand on its north side');
  const len = run => run.slice(1).reduce((a, p, i) => a + far(at(p), at(run[i])), 0), off = p => { const nr = world.nearestRoad(p.x, p.z, 12, e => e.name === T.name); return nr ? nr.d : 99; };
  const [south, loop, north] = tram.runs, bed = loop.filter(p => p.bed);
  ok(tram.runs.length === 3 && len(south) > 1850 && len(north) > 1850 && south.slice(2, -12).concat(north.slice(2, -12)).every(p => Math.abs(off(p) - T.gap) < 0.12 && !p.bed) && world.nearestRoad(south[0].x, south[0].z, 6).e.own === false && far(at(south[0]), T.from) < 8, 'a double tram track is laid in Bauskas iela from Vienības gatve to the loop: ' + Math.round(len(south)) + ' m');
  ok(far(at(loop[0]), at(south[south.length - 1])) < 0.1 && far(at(loop[loop.length - 1]), at(north[north.length - 1])) < 0.1 && bed.length > 60 && bed.every(p => !world.isWaterAt(p.x, p.z) && (world.occ[world.oi(p.x, p.z)] === 1 || far(at(p), tram.car) < 12) && Math.abs(p.y - world.terrainH(p.x, p.z)) < 0.3) && Math.max(...bed.map(p => far(at(p), T.loop))) < 78 && bed.filter(p => Math.abs(far(at(p), T.loop) - T.loop[2]) < 0.2).length > 20 && !world.trees.some(t => Math.abs(t.x - T.loop[0]) < 90 && Math.abs(t.z - T.loop[1]) < 90 && bed.some(p => far(at(p), at(t)) < 2)), 'both tracks leave the street for a balloon loop on its own bed where no tree grows');
  const poles = world.props.filter(p => p.type === 'tpole');
  ok(poles.length === tram.poles.length && poles.length >= 100 && poles.every(p => p.solid && world.offRoad(p.x, p.z, 0.5) && !world.isWaterAt(p.x, p.z) && hit(p.x, p.z, 0.2).some(c => c.k === 'circ')) && tram.spans.length >= 45 && tram.spans.every(sp => Math.abs(far([sp[0], sp[1]], [sp[2], sp[3]]) - 15.9) < 1.2) && poles.filter(p => p.arm > 2).length >= 8, 'solid catenary poles stand in pairs behind the pavements and carry bracket arms around the loop: ' + poles.length);
  const car = lmOf('tram10'), right = [Math.cos(car.yaw), Math.sin(car.yaw)], dock = [car.x + right[0] * 3.1, car.z + right[1] * 3.1];
  ok(car.name === 'Трамвай № 10' && far(at(car), tram.car) < 0.3 && Math.cos(car.yaw - F.yawOf(tram.dir[0], tram.dir[1])) > 0.999 && Math.min(...loop.map(p => far(at(p), at(car)))) < 0.6 && surf(dock) === S.PAVE && solid(at(car), 0.3) && !solid(dock, 0.5), 'tram 10 waits on the loop with its doors toward the paved platform');
  const term = bis.stops[0], inLoop = p => far(at(p), T.loop) < T.loop[2] - 2.4, kiosks = world.props.filter(p => p.type === 'kiosk' && inLoop(p));
  const stopSigns = world.props.filter(p => p.type === 'sign' && p.sign === 'tram');
  ok(term.end && far(at(term), dock) < 25 && bis.stops.length === T.stops.length + 1 && bis.stops.every(st => world.ads.some(a => a.kind === 'shelter' && far(at(a), at(st)) < 0.1 && a.cols.length === 1) && stopSigns.some(p => far(at(p), at(st)) < 40)) && bis.stops.slice(1).every(st => { const nr = world.nearestRoad(st.x, st.z, 12); return nr.e.name === T.name && nr.e.own && nr.d > nr.e.hw && nr.d < nr.e.hw + nr.e.k.side; }) && kiosks.length === T.end.kiosks.length && world.buildings.some(bd => inLoop(bd) && bd.fac === 'brick5' && bd.floors === 1) && bis.signs.some(sg => sg.id === 'galap' && far(at(sg), at(term)) < 50), 'the terminus has a shelter, a name board, kiosks and a dispatcher hut inside the loop, and three more stops line the street');
  const M = frame('bisumuiza'), manor = lmOf('bisumuiza'), court = M(B.manor.court[0], B.manor.court[1]), alley = world.edges.filter(e => e.rid === B.manor.alley);
  const mm = model('bisumuiza', ['bisu_wall', 'bisu_ped']);
  ok(manor.name === 'Усадьба Бишумуйжа' && mm.top > 10.4 && mm.top < 11.2 && mm.h >= mm.top && mm.used.bisu_ped === 6 && mm.used.bisu_wall > 60 && solid(M(0, 0)) && solid(M(14, 6)) && solid(M(0, -10)) && !solid(court, 2), 'the manor is a single-storey classicist house with a mezzanine and a portico on both long sides: ' + mm.top.toFixed(1) + ' m');
  const axis = q => Math.abs((q[0] - manor.x) * Math.cos(manor.yaw) + (q[1] - manor.z) * Math.sin(manor.yaw)), lindens = world.trees.filter(t => t.kind === 'linden' && t.street && alley.some(e => world.nearestRoad(t.x, t.z, 9, q => q === e)));
  let blocked = 0;
  for (const e of alley) for (let s = 1; s <= e.len - 1; s += 2) { const p = world.edgePoint(e, s); if (hit(p.x, p.z, e.hw - 0.3).length) blocked++; }
  ok(alley.length === 1 && alley[0].surf === S.GRAVEL && alley[0].len > 140 && alley[0].pts.every(q => axis(q) < 2.5) && world.nodes.some(n => far(at(n), court) < 1) && blocked === 0 && lindens.length >= 24 && lindens.filter(t => t.x < manor.x).length >= 12 && lindens.filter(t => t.x > manor.x).length >= 12, 'a straight linden alley leads from Bauskas iela along the axis of the house: ' + lindens.length + ' trees');
  const gate = world.nearestRoad(B.manor.gate[0], B.manor.gate[1], 3), piers = props('gpier', [gate.x, gate.z], 8);
  ok(surf(M(7, -31)) === S.GRAVEL && surf(M(0, -16)) === S.GRAVEL && piers.length === 2 && piers.every(p => p.solid && hit(p.x, p.z, 0.2).length) && !hit(gate.x, gate.z, 3.4).length && !world.trees.some(t => far(at(t), court) < 17 || far(at(t), M(0, 30)) < 18) && props('bench', court, 16).length === B.manor.seats.length && props('plamp', court, 16).length === B.manor.lamps.length, 'gate piers open onto the alley, a gravel court lies before the steps and the lawns stay open');
  const pond = F.MAP.LAKES.find(l => l.id === 'bisu_pond'), sheds = world.buildings.filter(bd => bd.style === 'wood' && bd.floors === 1 && far(at(bd), at(manor)) < 70 && bd.x < manor.x - 20);
  ok(pond && world.isWaterAt(1826, 2520) && !world.isWaterAt(manor.x, manor.z) && nearWater(M(15, 0), 20) && sheds.length >= 2 && world.edges.some(e => e.name === 'Парковый проезд' && e.surf === S.GRAVEL), 'the pond lies beside the house, the stables stand behind it and a back drive closes the loop');
  const D = frame('piens'), dairy = lmOf('piens'), Dy = B.dairy, dm = model('piens', ['piens_wall', 'piens_sign']);
  ok(dairy.name === 'Рижский молочный комбинат' && F.LMK.piens.soft && dm.top > Dy.stack[3] && dm.h >= dm.top && dm.used.piens_sign === 4 && dm.used.piens_wall > 100 && solid(D(0, -13)) && solid(D(Dy.stack[0], Dy.stack[1])) && solid(D(15, 12)) && Dy.silos.every(q => solid(D(q[0], q[1]))) && !solid(D(0, -40), 1) && !solid(D(40, 0), 1) && !solid(D(-2, 19), 1), 'the dairy is a long hall with a boiler house, a ' + Dy.stack[3] + ' m chimney and milk silos, solid part by part with an open yard');
  const gateD = D(Dy.gate[0], Dy.gate[1]), way = [D(Dy.gate[0], Dy.gate[1] + 3), D(8, -44.5), D(40, -44.5), D(40, 6.5), D(2, 6.5), D(0, 16.5)];
  let stuck = 0;
  for (let i = 0; i + 1 < way.length; i++) for (let k = 0; k <= 10; k++) { const q = [F.lerp(way[i][0], way[i + 1][0], k / 10), F.lerp(way[i][1], way[i + 1][1], k / 10)]; if (solid(q, 1.1) || surf(q) !== S.ASPHALT) stuck++; }
  const panels = bis.fence.filter(f => far(at(f), at(dairy)) < 140 && far(at(f), [B.csdd.c[0], B.csdd.c[1]]) > 300), board = world.boards.find(b => b.id === 'ftbis');
  ok(stuck === 0 && !hit(gateD[0], gateD[1], 3).length && panels.length >= 50 && panels.every(f => far(at(f), gateD) > Dy.gate[2] / 2) && props('gatepost', gateD, 8).length === 2 && board && far(at(board), D(0, 19)) < 0.5 && bis.signs.some(sg => sg.id === 'piens' && far(at(sg), gateD) < 14), 'a chain-link fence with an open gate fronts the street and the way round the hall to the fast-travel board is clear');
  const milk = world.parked.filter(p => p.lot === 'piens'), halls = world.buildings.filter(bd => bd.style === 'industry' && far(at(bd), at(dairy)) < 160 && far(at(bd), at(dairy)) > 40);
  ok(bis.trucks.length === Dy.trucks.length && bis.trucks.every(v => hit(v.x, v.z, 0.3).some(c => c.k === 'box')) && milk.length >= 5 && world.lots.some(l => l.id === 'piens') && halls.length >= 5, 'milk tankers stand at the dock, the staff parks by the fence and sheds fill the compound: ' + milk.length + ' cars');
  const C = B.csdd, cl = (a, c) => [C.c[0] + C.dir[0] * a - C.dir[1] * c, C.c[1] + C.dir[1] * a + C.dir[0] * c], cones = world.props.filter(p => p.type === 'cone'), lane = world.edges.find(e => e.name === 'Проезд ЦСДД');
  let shut = 0;
  for (let s = 1; s <= lane.len + 8; s += 1.5) { const p = world.edgeAt(lane, s); if (hit(p.x, p.z, 1.6).length) shut++; }
  ok(surf(cl(0, 8)) === S.ASPHALT && world.lots.some(l => l.id === 'csdd') && world.parked.filter(p => p.lot === 'csdd').length >= 5 && cones.length === C.slalom[2] + 6 && cones.every(p => p.smash && p.mass <= 5 && far(at(p), C.c) < 60 && surf(at(p)) === S.ASPHALT) && bis.signs.filter(sg => sg.id === 'csdd').length === 2 && world.buildings.filter(bd => far(at(bd), C.c) < 50).length === 2 && shut === 0 && F.inPoly(world.edgeAt(lane, lane.len + 6).x, world.edgeAt(lane, lane.len + 6).z, [cl(-C.hl, -C.hw), cl(C.hl, -C.hw), cl(C.hl, C.hw), cl(-C.hl, C.hw)]), 'the CSDD yard has an inspection hall, an office, parked cars and a slalom of cones, and its lane runs in through an open gate: ' + cones.length + ' cones');
  const towers = bis.towers.filter(t => !t.ghost), high = towers.filter(t => t.h > 30);
  let low = 99;
  for (let i = 0; i + 1 < bis.towers.length; i++) {
    const a = Bis.hooks(bis.towers[i]), c = Bis.hooks(bis.towers[i + 1]), sag = far(at(bis.towers[i]), at(bis.towers[i + 1])) * 0.035;
    if (bis.towers[i + 1].ghost) continue;
    for (let w = 1; w < a.length; w++) for (let k = 1; k < 8; k++) { const t = k / 8, x = F.lerp(a[w][0], c[w][0], t), z = F.lerp(a[w][2], c[w][2], t); low = Math.min(low, F.lerp(a[w][1], c[w][1], t) - sag * 4 * t * (1 - t) - Math.max(world.groundY(x, z), F.WATER_Y)); }
  }
  ok(towers.length === B.line.length - 1 && towers.every(t => !world.isWaterAt(t.x, t.z) && world.offRoad(t.x, t.z, 2) && Bis.hooks(t).length === 7 && hit(t.x, t.z, 7).filter(c => c.k === 'circ' && c.r < 0.5).length >= 4) && high.length === 2 && world.isWaterAt((high[0].x + high[1].x) / 2, (high[0].z + high[1].z) / 2) && low > 9, 'a 110 kV line on lattice towers crosses the channel between two tall towers and its wires hang clear of the ground: ' + low.toFixed(1) + ' m');
  const homes = world.buildings.filter(mine), count = st => homes.filter(bd => bd.style === st).length, yards = world.parked.filter(p => p.lot === 'bisyard');
  ok(count('khrush') >= 12 && count('wood') >= 70 && count('industry') >= 35 && world.lots.filter(l => l.id === 'bisyard').length >= 4 && yards.length >= 8 && world.walkways.filter(wk => wk.door && mine({ x: wk.pts[0][0], z: wk.pts[0][1] })).length >= 8, 'five-storey blocks with yards, wooden houses and factory halls line the streets: ' + count('khrush') + ' blocks, ' + count('wood') + ' houses, ' + count('industry') + ' halls');
  const conifer = world.trees.filter(t => (t.kind === 'pine' || t.kind === 'spruce') && F.inPoly(t.x, t.z, B.forest.poly)), belt = world.trees.filter(t => F.inPoly(t.x, t.z, B.edge.poly));
  const rows = world.trees.filter(t => world.nearestRoad(t.x, t.z, 8, e => e.rid === B.forest.rows.road) && F.inPoly(t.x, t.z, B.forest.poly)), bank = world.trees.filter(t => t.kind === 'linden' && world.nearestRoad(t.x, t.z, 14, e => e.rid === B.bank.road));
  const open = B.clear.every(c => c.pts.slice(1).every((q, i) => !world.trees.some(t => F.segDist(t.x, t.z, c.pts[i][0], c.pts[i][1], q[0], q[1]).d < c.hw - 1) && !world.buildings.some(bd => F.segDist(bd.x, bd.z, c.pts[i][0], c.pts[i][1], q[0], q[1]).d < c.hw - 1)));
  ok(conifer.length >= 200 && belt.length >= 150 && rows.length >= 30 && bank.filter(t => nearWater(at(t), 80)).length >= 35 && open, 'a pine forest with tree rows along the track, a tree belt at the map edge, lindens on the embankment and open run-offs at the corners of the rallycross: ' + conifer.length + ' conifers');
  store.clear();
  const game = new F.Game(world, { profile: F.Profile.newProfile('bisumuiza') }), def = id => game.stuntDefs.find(d => d.id === id), star = id => F.EV.STUNTS.find(s => s.id === id).stars;
  const edgesOf = d => { const set = new Set(); for (let i = 0; i < d.route.n; i += 2) { const nr = world.nearestRoad(d.route.x[i], d.route.z[i], 4); if (nr) set.add(nr.e.rid || nr.e.name); } return [...set].sort().join(); };
  const trap = def('stbis'), zone = def('szbis'), slide = def('dzbis'), ramp = world.ramps.find(r => r.id === 'dsbis');
  ok(trap && world.nearestRoad(trap.x, trap.z, 3).e.own && world.nearestRoad(trap.x, trap.z, 3).e.name === T.name && zone && edgesOf(zone) === 'bismuk' && zone.len > 500 && zone.len < 580 && slide && edgesOf(slide) === 'bisalley,bisforest' && slide.len > 280 && ramp && world.nearestRoad(ramp.x, ramp.z, 1).e.name === 'Малая Бауская' && Math.cos(ramp.yaw - Math.PI / 2) > 0.98 && ['stbis', 'szbis', 'dzbis'].every(id => world.signs.some(s => s.id === id)), 'a speed trap on the tram street, a speed zone on the embankment, a drift zone from the alley into the forest and a ramp on the river bank');
  const b1 = world.boards.find(b => b.id === 'xpbis1'), b2 = world.boards.find(b => b.id === 'xpbis2');
  ok(b1 && far(at(b1), M(0, 31)) < 12 && !solid(at(b1), 1) && b2 && !world.isWaterAt(b2.x, b2.z) && nearWater(at(b2), 30) && world.nearestRoad(b2.x, b2.z, 30).e.name === 'Малая Бауская', 'XP boards stand on the garden lawn of the manor and on the river bank');
  const bank2 = chain(world.nodes.find(n => far(at(n), [1310, 2490]) < 2), q => q.name === 'Малая Бауская'), runUp = bank2.findIndex(p => p[0] > 1335 && p[1] < 2446);
  const hop = drive('vaz2105', bank2.slice(runUp, -8)), first = hop.lands[0];
  ok(first && first.dist >= star('dsbis')[0] && hop.lands.length <= 2 && !hop.bumps.length, 'a Zhiguli takes the ramp from a standing start and earns the first star without hitting anything on the landing: ' + (first ? first.dist.toFixed(1) : 0) + ' m');
  const east = chain(J, (q, nd) => q.name === T.name && q.own && q.pts[q.a === nd.id ? q.pts.length - 1 : 0][0] > nd.x), sprint = drive('vaz2105', east.slice(0, 80), [['trap', [trap.x, trap.z]]]);
  ok(sprint.speed.trap >= star('stbis')[0] && !sprint.bumps.length, 'a Zhiguli from a standing start at the crossroads passes the speed trap above the first star: ' + (sprint.speed.trap || 0).toFixed(0) + ' km/h');
  const ev = F.EV.get('bisumuiza'), route = F.Route.fromVia(world, ev.via, true, ev.pref);
  let gravel = 0, overRamp = false;
  for (let i = 0; i < route.n; i++) { const nr = world.nearestRoad(route.x[i], route.z[i], 4); if (nr && nr.e.surf === S.GRAVEL) gravel++; if (far([route.x[i], route.z[i]], [ramp.x, ramp.z]) < 3) overRamp = true; }
  ok(ev.tier === 0 && ev.cls === 'D' && ev.type === 'dirt' && ev.laps === 2 && route.total > 1400 && route.total < 1650 && gravel / route.n > 0.5 && gravel / route.n < 0.75 && overRamp && edgesOf({ route }).includes('bisalley') && edgesOf({ route }).includes('bisforest'), 'the rallycross lap mixes tram street, river bank gravel with the ramp, the alley and the forest track: ' + Math.round(route.total) + ' m, ' + Math.round(gravel / route.n * 100) + '% gravel');
  const A = Bis.A, ids = Object.keys(A);
  ok(ids.every((id, i) => A[id][0] >= 0 && A[id][1] >= 0 && A[id][0] + A[id][2] <= 512 && A[id][1] + A[id][3] <= 256 && ids.every((m, j) => j === i || A[m][0] >= A[id][0] + A[id][2] || A[m][0] + A[m][2] <= A[id][0] || A[m][1] >= A[id][1] + A[id][3] || A[m][1] + A[m][3] <= A[id][1])) && F.Street.A.sign_tram, 'the district atlas regions fit without overlaps and the street atlas has a tram stop sign');
  const groups = {}, fake = { w: world, chunkAt: () => fake, g: (ch, key) => groups[key] || (groups[key] = new F.Batch(1024)), grow() {}, ribbon(ch, key, pts, ys) { fake.beds += pts.length - 1; fake.g(ch, key); } };
  fake.beds = 0;
  Bis.decorate(fake);
  const tri = key => groups[key] ? groups[key].parts.reduce((a, p) => a + p.ni, 0) / 3 + groups[key].ni / 3 : 0;
  ok(!meshProblems(Object.values(groups), F.STRIDE).length && tri('paint') > 4000 && fake.beds >= bed.length - 8 && tri('x_white') > 3000 && tri('white') > 10000 && tri('bis') >= (bis.signs.length + bis.trucks.length * 2) * 2, 'the scene gets rails in the asphalt, a sleeper bed on the loop, contact wires, lattice towers with cables, sign boards and tankers');
  const bad = [];
  for (const [type, p] of [['tpole', { arm: 2.9 }], ['tpole', { arm: 0 }], ['cone', {}], ['gpier', {}], ['rblock', {}], ['sign', { sign: 'tram' }]]) {
    const bs = [new F.Batch(256), new F.Batch(64)];
    bs[1].uvw = F.Street.WHITE_UV;
    F.Models.buildProp(bs[0], Object.assign({ type }, p), F.rng(1), bs[1]);
    if (bs[0].empty || meshProblems(bs, F.STRIDE).length) bad.push(type);
  }
  const scene = read('js/apps/forza/fz-scene.js'), ui = read('js/apps/forza/fz-ui.js'), hud = read('js/apps/forza/fz-hud.js');
  ok(!bad.length && /F\.Bis\.decorate\(this\)/.test(scene) && /'bis'\]/.test(ui) && /bis\.tram\.runs/.test(hud), 'pole, cone, gate pier, road block and tram stop sign models are valid, and the scene, the texture preload and the map know the district: ' + bad.join());
});

section('flora', () => {
  require(path.join(DIR, 'fz-scene.js'));
  const T = F.Trees, FL = F.FLORA, fl = world.flora, S = F.STRIDE;
  const by = t => fl.filter(f => f.type === t), bushes = by('bush'), rocks = by('rock'), boulders = rocks.filter(r => r.kind === 'boulder');
  const count = (list, key) => list.reduce((a, o) => { a[o[key]] = (a[o[key]] || 0) + 1; return a; }, {});
  const kinds = count(world.trees, 'kind'), bk = count(bushes, 'kind');
  ok(Object.keys(T.SP).length === 10 && Object.keys(T.SP).every(k => kinds[k] > 100), 'ten tree species grow in Riga: ' + JSON.stringify(kinds));
  ok(world.trees.every(t => !t.street || !['willow', 'poplar', 'maple', 'chestnut'].includes(t.kind)), 'planted avenues and alleys keep their species');
  ok(Object.keys(FL.BUSH).every(k => k === 'hedge' || bk[k] > 50), 'every kind of bush grows somewhere: ' + JSON.stringify(bk));
  const counts = { boulders: boulders.length, stones: rocks.length - boulders.length, logs: by('log').length, stumps: by('stump').length, piles: by('pile').length, hedges: by('hedge').length, bales: world.bales.length };
  ok(counts.boulders > 150 && counts.stones > 100 && counts.logs > 150 && counts.stumps > 300 && counts.piles >= 8 && counts.hedges > 1000 && counts.bales > 60, 'boulders, stones, fallen logs, stumps, log piles, hedges and hay bales: ' + JSON.stringify(counts));

  const free = (x, z) => { const i = world.oi(x, z), v = world.occ[i]; return i >= 0 && !world.patchSurf[i] && (v === 0 || v === 5 || v === 7); };
  ok(fl.every(f => free(f.x, f.z)) && world.bales.every(p => free(p.x, p.z)), 'flora stands only on free ground: never on roads, paving, water, buildings or landmarks');
  const solid = fl.filter(f => (f.type === 'rock' && f.kind === 'boulder') || f.type === 'stump' || f.type === 'log' || f.type === 'pile');
  const close = solid.filter(f => world.roadGap(f.x, f.z, 12) < (f.type === 'pile' ? 4.9 : 5.9));
  ok(!close.length && world.bales.every(p => world.roadGap(p.x, p.z, 12) >= 7.9), 'solid rocks, logs, stumps and bales keep 6 m off the carriageway: ' + close.length);
  ok(bushes.every(f => world.roadGap(f.x, f.z) >= 1.9) && by('hedge').every(f => world.roadGap(f.x, f.z) >= 1.9), 'bushes and hedges stay off the pavement');
  ok(fl.concat(world.bales).every(f => !(world.floraMask[world.oi(f.x, f.z)] & 9)), 'race corridors and the railway stay clear of bushes, rocks and logs');
  ok(fl.every(f => !world.isWaterAt(f.x, f.z)) && world.flora.filter(f => f.type === 'bush' && f.kind === 'willow').some(f => world.landShore[world.gi(f.x, f.z)] <= 2), 'willow shrubs line the banks, nothing grows in the water');

  ok(bushes.every(f => f.col && f.col.k === 'brush' && f.col.drag > 0.02 && f.col.drag < 0.12) && by('hedge').every(f => f.col && f.col.k === 'brush' && f.col.seg), 'bushes and hedges are soft');
  ok(boulders.every(f => f.col && f.col.k === 'circ') && rocks.filter(r => r.kind === 'stone').every(r => !r.col) && by('pile').every(f => f.col && f.col.k === 'box') && by('log').every(f => f.col && f.col.k === 'seg'), 'boulders, logs and piles are solid, pebbles are scenery');
  ok(world.bales.every(p => p.smash && p.col_ && p.col_.k === 'smash' && world.props.includes(p)) && F.DMG.HARD.bale[0] < 0.1 && F.DMG.HARD.rock[0] === 1, 'hay bales are smashable props, rocks are the hardest obstacle');

  const field = cols => ({ wet: false, lastSurf: 0, ground() { this.lastSurf = 0; return 0; }, colliders: () => cols, waterDepth: () => 0 });
  const runInto = c => {
    const car = new F.Vehicle(F.Cars.spec('vaz2105', {}), {});
    car.place(0, 0, 0, F.NullWorld);
    while (car.speed < 20) car.step(1 / 60, { thr: 1, brk: 0, steer: 0 }, F.NullWorld);
    Object.assign(c, { x: car.x, z: car.z - 12 });
    const w = field([c]), v0 = car.speed, z0 = car.z, ev = [];
    let min = v0;
    for (let i = 0; i < 90; i++) { car.step(1 / 60, { thr: 0, brk: 0, steer: 0 }, w); for (const e of car.events) ev.push(e.t); min = Math.min(min, car.speed); }
    return { v0, min, ev, past: car.z < c.z - 3, dz: z0 - car.z };
  };
  const bush = runInto({ k: 'brush', r: 1.1, drag: 0.06, y0: -1, y1: 3, src: { type: 'bush', kind: 'hazel' } });
  ok(bush.ev.filter(t => t === 'brush').length === 1 && !bush.ev.includes('hit') && bush.past && bush.min / bush.v0 > 0.86 && bush.min / bush.v0 < 0.97, 'a car bursts through a bush, loses a few km/h and keeps going: ' + (bush.min / bush.v0).toFixed(3));
  const rock = runInto({ k: 'circ', r: 1.2, y0: -1, y1: 2, src: { type: 'rock', kind: 'boulder' } });
  ok(rock.ev.includes('hit') && !rock.past && rock.min < rock.v0 * 0.5, 'a boulder stops the car');

  const rnd = F.rng(77), seen = new Set(), bad = [];
  for (let k = 0; k < 30000; k++) {
    const x = rnd.range(world.b.x0 + 50, world.b.x1 - 50), z = rnd.range(world.b.z0 + 50, world.b.z1 - 50), v = world.coverAt(x, z);
    if (!v) continue;
    const kind = T.COVER[(v >> 4) - 1], i = world.oi(x, z);
    seen.add(kind);
    if (!kind || world.isWaterAt(x, z) || world.patchSurf[i] || [3, 4, 8].includes(world.occ[i]) || world.roadGap(x, z, 12) < 0.3) bad.push(kind + '@' + Math.round(x) + ',' + Math.round(z));
    if (kind === 'reed' && ![[3, 0], [-3, 0], [0, 3], [0, -3]].some(d => world.isWaterAt(x + d[0], z + d[1]))) bad.push('reed@' + Math.round(x) + ',' + Math.round(z));
    if (kind === 'dune' && world.biome[world.gi(x, z)] !== 1) bad.push('dune@' + Math.round(x) + ',' + Math.round(z));
  }
  ok(!bad.length && T.COVER.every(k => seen.has(k)), 'ground cover: grass, flowers, lupins, ferns, berries, reeds at the water and marram on the dunes, never on roads or paving: ' + bad.slice(0, 5).join(' '));

  const fits = (A, size) => { const ids = Object.keys(A); return ids.every((id, i) => A[id][0] >= 0 && A[id][1] >= 0 && A[id][0] + A[id][2] <= size && A[id][1] + A[id][3] <= size && ids.every((m, j) => j === i || A[m][0] >= A[id][0] + A[id][2] || A[m][0] + A[m][2] <= A[id][0] || A[m][1] >= A[id][1] + A[id][3] || A[m][1] + A[m][3] <= A[id][1])); };
  ok(fits(T.R, T.size) && fits(T.RF, T.size), 'foliage and impostor atlas regions fit without overlaps');
  const inside = (A, u, v) => Object.values(A).some(r => u * T.size >= r[0] - 0.01 && u * T.size <= r[0] + r[2] + 0.01 && v * T.size >= r[1] - 0.01 && v * T.size <= r[1] + r[3] + 0.01);
  const scan = (b, A) => {
    const out = { tris: 0, bad: new Set(), hi: -Infinity, rad: 0, mats: new Set() };
    for (const p of b.finish()) {
      const dv = new DataView(p.data.buffer, p.data.byteOffset, p.nv * S);
      out.tris += p.ni / 3;
      for (let i = 0; i < p.nv; i++) {
        const o = i * S, q = [dv.getFloat32(o, true), dv.getFloat32(o + 4, true), dv.getFloat32(o + 8, true)], u = dv.getFloat32(o + 12, true), v = dv.getFloat32(o + 16, true);
        const n = [dv.getInt8(o + 20) / 127, dv.getInt8(o + 21) / 127, dv.getInt8(o + 22) / 127], nl = Math.hypot(n[0], n[1], n[2]);
        if (!q.every(Number.isFinite)) out.bad.add('position');
        if (nl < 0.9 || nl > 1.08) out.bad.add('normal');
        if (!inside(A, u, v)) out.bad.add('uv');
        out.mats.add(dv.getInt8(o + 23));
        out.hi = Math.max(out.hi, q[1]);
        out.rad = Math.max(out.rad, Math.hypot(q[0] - 100, q[2] - 50));
      }
    }
    return out;
  };
  const LEAFY = new Set([0, F.MAT.LEAF, F.MAT.BARK]), problems = [];
  for (const kind of Object.keys(T.SP)) {
    const sp = T.SP[kind], t = { x: 100, z: 50, y: 0, kind, s: 1 }, I = T.inst(t.x, t.z, 1, sp);
    const near = new F.Batch(512), far = new F.Batch(64);
    near.uvw = T.WHITE;
    T.treeNear(near, t);
    T.treeFar(far, t);
    const a = scan(near, T.R), b = scan(far, T.RF);
    if (a.bad.size || b.bad.size || [...a.mats].some(m => !LEAFY.has(m)) || a.tris > 260 || b.tris !== 6 || a.hi > I.H * 1.25 || a.hi < I.H * 0.75 || a.rad > I.Wd * 0.8 + 1) problems.push(kind + ' ' + [...a.bad, ...b.bad].join(',') + ' tris ' + a.tris + '/' + b.tris + ' top ' + a.hi.toFixed(1) + '/' + I.H.toFixed(1) + ' r ' + a.rad.toFixed(1));
  }
  for (const kind of Object.keys(T.BUSHES)) {
    const f = { x: 100, z: 50, y: 0, kind, h: 2.4, w: 2.2, yaw: 0.4, seed: 99 }, near = new F.Batch(256), far = new F.Batch(32);
    T.bushNear(near, f);
    T.bushFar(far, f);
    const a = scan(near, T.R), b = scan(far, T.RF);
    if (a.bad.size || b.bad.size || a.tris > 160 || b.tris !== 4 || a.hi > 3.6) problems.push(kind + ' ' + [...a.bad, ...b.bad].join(',') + ' tris ' + a.tris + ' top ' + a.hi.toFixed(1));
  }
  for (const type of ['rock', 'log', 'stump', 'pile', 'hedge']) {
    const f = fl.find(o => o.type === type && (type !== 'rock' || o.kind === 'boulder')), b = new F.Batch(256);
    T.decor(b, Object.assign({}, f, { x: 100, z: 50, y: world.terrainH(100, 50) }), world);
    const a = scan(b, T.R);
    if (a.bad.size || !a.tris || a.tris > 200) problems.push(type + ' ' + [...a.bad].join(',') + ' tris ' + a.tris);
  }
  for (const kind of T.COVER) {
    const b = new F.Batch(16);
    T.tuft(b, 100, 0, 50, kind, 1, [200, 220, 180]);
    const a = scan(b, T.R);
    if (a.bad.size || a.tris !== 4 || [...a.mats].some(m => m !== F.MAT.GRASS) || a.hi > 2.4) problems.push('tuft ' + kind + ' ' + [...a.bad].join(','));
  }
  ok(!problems.length, 'tree, bush, rock, log and grass meshes are valid and inside their budgets: ' + problems.join('; '));

  const sc = { w: world, groundCol: F.Scene.prototype.groundCol }, park = F.MAP.PARKS.find(p => p.id === 'park0'), c = F.polyBox(park.poly);
  const ix = Math.floor((c.x0 + c.x1) / 2 / F.TILES.grass), iz = Math.floor((c.z0 + c.z1) / 2 / F.TILES.grass);
  const g = F.Scene.prototype.grassTile.call(sc, ix, iz, 1), gs = scan(g, T.R);
  const g0 = F.Scene.prototype.grassTile.call(sc, ix, iz, 0.55);
  ok(gs.tris > 400 && !gs.bad.size && scan(g0, T.R).tris < gs.tris, 'a park tile grows a lawn of grass tufts and the medium setting thins it out: ' + gs.tris + ' triangles');
  const cell = { trees: world.trees.filter(t => Math.abs(t.x - 2950) < 60 && Math.abs(t.z + 1500) < 60), bushes: bushes.filter(f => Math.abs(f.x - 2950) < 60 && Math.abs(f.z + 1500) < 60), small: [] };
  const tt = scan(F.Scene.prototype.treeTile.call(sc, cell), T.R);
  ok(cell.trees.length > 10 && !tt.bad.size && tt.tris < cell.trees.length * 260 + cell.bushes.length * 160, 'a forest tile builds 3D trees: ' + cell.trees.length + ' trees, ' + tt.tris + ' triangles');

  ok(F.Profile.newProfile('flora').settings.flora === 2 && read('js/apps/forza/fz-menus.js').includes("'Растительность', 'flora'"), 'the vegetation detail setting defaults to high');
  ok(F.DebrisKit.WHOLE.has('bale') && F.DebrisKit.MAT_OF.bale === 'plastic', 'a smashed bale rolls away in one piece');
});

section('facades', () => {
  const GF = F.GFLOOR, ST = F.STYLES, blocks = world.buildings.filter(b => b.gy !== undefined);
  const regions = [];
  for (const st of ['hansa', 'jugend']) for (const u of Object.values(GF[st])) regions.push([u.x, u.y, u.w, GF.ROW]);
  for (const [x, y] of GF.awn) regions.push([x, y, 64, 96]);
  regions.push(GF.stone, [GF.dark[0] - 8, GF.dark[1] - 8, GF.dark[2] + 16, GF.dark[3] + 16]);
  for (const sg of GF.signs) regions.push([sg.x, sg.y, GF.SW, GF.SH]);
  const overlap = regions.some((a, i) => regions.some((b, j) => j > i && a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3]));
  ok(!overlap && regions.every(r => r[0] >= 0 && r[1] >= 0 && r[0] + r[2] <= GF.W && r[1] + r[3] <= GF.H) && GF.signs.filter(sg => sg.cafe).length >= 6 && GF.signs.filter(sg => !sg.cafe).length >= 20 && F.Tex.list().includes('gfloor'), 'the ground floor atlas packs storefronts, doors, gates, awnings and shop signs without overlaps');

  let buried = 0;
  for (const bd of blocks) {
    const n = bd.poly.length;
    bd.faces.forEach((f, i) => {
      if (f !== 's') return;
      const a = bd.poly[i], c = bd.poly[(i + 1) % n], L = Math.hypot(c[0] - a[0], c[1] - a[1]);
      let nx = (c[1] - a[1]) / L, nz = -(c[0] - a[0]) / L;
      if (((a[0] + c[0]) / 2 - bd.x) * nx + ((a[1] + c[1]) / 2 - bd.z) * nz < 0) { nx = -nx; nz = -nz; }
      for (let k = 0; k <= 6; k++) {
        const t = 0.04 + 0.92 * k / 6, y = world.ground(a[0] + (c[0] - a[0]) * t + nx * 0.7, a[1] + (c[1] - a[1]) * t + nz * 0.7, 1e4, false);
        if (y + (world.lastSurf === F.S.PAVE && !world.lastEdge ? 0.16 : 0) > bd.gy + 0.01) buried++;
      }
    });
  }
  const tall = blocks.filter(bd => { const st = ST[bd.style]; return Math.abs(bd.y + bd.h - (bd.gy + st.ground + (bd.floors - 1) * st.floorH + st.attic)) > 1e-6 || bd.gy < bd.y + 0.3 - 1e-9; });
  ok(blocks.length > 2500 && !buried && !tall.length, 'Old Town and Art Nouveau ground floors start at the pavement, not under it: ' + buried + ' buried samples, ' + tall.length + ' bad heights');

  let joined = 0, pairs = 0;
  for (let i = 0; i + 1 < world.buildings.length; i++) {
    const a = world.buildings[i], b = world.buildings[i + 1];
    if (a.gy === undefined || b.gy === undefined || a.corner || b.corner) continue;
    pairs++;
    if (Math.hypot(a.poly[1][0] - b.poly[0][0], a.poly[1][1] - b.poly[0][1]) < 0.01) joined++;
  }
  ok(joined > pairs * 0.6, 'row houses stand wall to wall along the street: ' + joined + ' of ' + pairs);

  let broken = 0, lies = 0;
  for (const bd of blocks) bd.faces.forEach((f, i) => {
    if (f !== 'p') return;
    const runs = bd.party && bd.party[i];
    if (!runs || runs[0][0] !== 0 || runs[runs.length - 1][1] !== 1 || runs.some((r, k) => k && r[0] !== runs[k - 1][1])) { broken++; return; }
    const a = bd.poly[i], c = bd.poly[(i + 1) % 4], L = Math.hypot(c[0] - a[0], c[1] - a[1]);
    let nx = (c[1] - a[1]) / L, nz = -(c[0] - a[0]) / L;
    if (((a[0] + c[0]) / 2 - bd.x) * nx + ((a[1] + c[1]) / 2 - bd.z) * nz < 0) { nx = -nx; nz = -nz; }
    for (const [t0, t1, top] of runs) {
      if (top < -1e8) continue;
      const t = (t0 + t1) / 2, x = a[0] + (c[0] - a[0]) * t + nx * 0.6, z = a[1] + (c[1] - a[1]) * t + nz * 0.6;
      if (!world.buildings.some(o => o !== bd && Math.abs(o.x - x) < 60 && Math.abs(o.z - z) < 60 && F.inPoly(x, z, o.poly) && Math.abs(o.y + o.h - top) < 0.06)) lies++;
    }
  });
  ok(!broken && !lies, 'a party wall is hidden only where a neighbour really stands against it: ' + broken + ' broken, ' + lies + ' false covers');

  const sc = new F.Scene(world, { lazy: true }), quads = [], faces = [], wq = sc.wallQuad, g0 = sc.g, gf = sc.groundFloor;
  sc.groundFloor = function (ch, bd, st, a, c, len) { faces.push({ len, laid: 0 }); return gf.apply(this, arguments); };
  sc.wallQuad = function (b, a, c, y0, y1, u0, u1, v0, v1) {
    if (b.gfloor && Math.min(u0, u1) * GF.W < 959) {
      const q = { w: Math.hypot(c[0] - a[0], c[1] - a[1]), h: y1 - y0, du: Math.abs(u1 - u0) * GF.W, dv: Math.abs(v1 - v0) * GF.H };
      quads.push(q);
      faces[faces.length - 1].laid += q.w;
    }
    return wq.apply(this, arguments);
  };
  sc.g = function (ch, key) { const b = g0.call(this, ch, key); if (key === 'gfloor') b.gfloor = true; return b; };
  sc.buildBuildings();
  const units = quads.filter(q => Math.abs(q.du - 26) > 0.01);
  const off = units.filter(q => { const sx = q.w / ((q.du + 1) / GF.M), sy = q.h / ((q.dv + 1) / GF.M); return sx < 0.84 || sx > 1.001 || sy < 0.99 || sy > 1.11; });
  const open = faces.filter(f => Math.abs(f.laid - f.len) > 1e-6);
  ok(units.length > 8000 && !off.length && faces.length > 3000 && !open.length, 'storefronts, doors and gates keep their real size and the ground floor covers every street front: ' + units.length + ' units, ' + off.length + ' stretched, ' + open.length + ' fronts with holes');
  const groups = [];
  for (const ch of sc.chunks) for (const k of ['gfloor', 'x_gfloor']) if (ch.groups[k]) groups.push(ch.groups[k]);
  ok(groups.length && !meshProblems(groups, F.STRIDE).length && !read('js/apps/forza/fz-scene.js').includes("'shops'"), 'ground floor, sign, awning and party wall meshes are valid: ' + meshProblems(groups, F.STRIDE).join());
});

section('junctions', () => {
  const laneOf = (x, z, y, except) => {
    for (const sg of world.segGrid.query(x - 1, z - 1, x + 1, z + 1, [], F.stamp())) {
      if (sg.e === except) continue;
      const dx = sg.bx - sg.ax, dz = sg.bz - sg.az, l2 = dx * dx + dz * dz;
      const t = l2 > 0 ? ((x - sg.ax) * dx + (z - sg.az) * dz) / l2 : 0;
      if ((t < 0 && sg.i === 0) || (t > 1 && sg.i === sg.e.pts.length - 2)) continue;
      const q = F.segDist(x, z, sg.ax, sg.az, sg.bx, sg.bz);
      if (q.d < sg.hw - 0.1 && Math.abs(sg.ay + (sg.by - sg.ay) * q.t - y) < 1.5) return sg.e;
    }
    return null;
  };
  let bands = 0, onLanes = 0, where = '';
  for (const e of world.edges) {
    if (!e.walks) continue;
    const band = e.bridge ? 0.6 : e.k.side;
    for (const lat of [-1, 1]) {
      for (const r of e.walks[lat]) {
        bands++;
        for (let s = Math.max(r.a.sIn, r.a.sOut); s <= Math.min(r.b.sIn, r.b.sOut); s += 1) {
          const p = world.edgeAt(e, s);
          for (const l of [e.hw + 0.1, e.hw + band / 2, e.hw + band - 0.1]) {
            const hit = laneOf(p.x + p.rx * l * lat, p.z + p.rz * l * lat, p.y, e);
            if (hit && !onLanes++) where = e.name + ' / ' + hit.name + ' @' + Math.round(p.x) + ',' + Math.round(p.z);
          }
        }
      }
    }
  }
  ok(bands > 400 && onLanes === 0, 'sidewalks and bridge parapets never lie on another road: ' + onLanes + ' points, first ' + where);
  let plain = 0, kerbs = 0;
  const odd = [];
  for (const nd of world.nodes) {
    if (nd.arms.length < 3) continue;
    for (const c of nd.corners) {
      let phi = c.B.ang - c.A.ang;
      if (phi <= 0) phi += Math.PI * 2;
      if (phi < Math.PI / 3 || phi > Math.PI * 2 / 3 || c.A.e.len < 40 || c.B.e.len < 40) continue;
      plain++;
      if (c.type === 'fillet' && !laneOf(c.x, c.z, c.y, null)) kerbs++;
      else odd.push(nd.id);
    }
  }
  ok(plain > 250 && kerbs === plain, 'every 60-120 degree junction corner gets a rounded kerb off the lanes: ' + kerbs + '/' + plain + ' ' + odd.slice(0, 5));
  let starts = 0, late = 0;
  for (const nd of world.nodes) {
    for (const c of nd.corners) {
      if (c.type !== 'fillet') continue;
      for (const [A, cut, lat] of [[c.A, c.a, c.A.lat], [c.B, c.b, -c.B.lat]]) {
        if (!A.e.walks || A.e.len < 60) continue;
        starts++;
        const s = A.end ? A.e.len - cut.sIn : cut.sIn;
        const covered = world.bandBlocked(A.e, lat, A.e.bridge ? 0.6 : A.e.k.side, A.end ? s - 0.1 : s + 0.1);
        if (!covered && !A.e.walks[lat].some(r => Math.abs((A.end ? Math.min(r.b.sIn, r.b.sOut) : Math.max(r.a.sIn, r.a.sOut)) - s) < 0.05)) late++;
      }
    }
  }
  ok(starts > 500 && late === 0, 'sidewalks meet the kerb return exactly: ' + late + ' of ' + starts + ' start elsewhere');
  const cs = (world.b.x1 - world.b.x0) / (world.nx - 1);
  let above = 0;
  for (const sg of world.segs) {
    if (sg.e.bridge && Math.max(sg.ay, sg.by) > 1.2) continue;
    const r = sg.hw + sg.side;
    const ix0 = Math.max(0, Math.floor((Math.min(sg.ax, sg.bx) - r - world.b.x0) / cs)), ix1 = Math.min(world.nx - 1, Math.ceil((Math.max(sg.ax, sg.bx) + r - world.b.x0) / cs));
    const iz0 = Math.max(0, Math.floor((Math.min(sg.az, sg.bz) - r - world.b.z0) / cs)), iz1 = Math.min(world.nz - 1, Math.ceil((Math.max(sg.az, sg.bz) + r - world.b.z0) / cs));
    for (let iz = iz0; iz <= iz1; iz++) {
      for (let ix = ix0; ix <= ix1; ix++) {
        const q = F.segDist(world.b.x0 + ix * cs, world.b.z0 + iz * cs, sg.ax, sg.az, sg.bx, sg.bz);
        if (q.d <= r && world.h[iz * world.nx + ix] > sg.ay + (sg.by - sg.ay) * q.t + 0.02) above++;
      }
    }
  }
  ok(above === 0, 'terrain never pokes through roads or sidewalks: ' + above + ' grid points');
});

section('bridges', () => {
  let samples = 0, open = 0, where = '';
  for (const e of world.edges) {
    if (!e.bridge) continue;
    for (const lat of [-1, 1]) {
      for (const r of e.walks[lat]) {
        for (let s = Math.max(r.a.sIn, r.a.sOut); s <= Math.min(r.b.sIn, r.b.sOut); s += 2) {
          const p = world.edgeAt(e, s), off = (e.hw + 0.5) * lat;
          const x = p.x + p.rx * off, z = p.z + p.rz * off, y = p.y + 0.3;
          samples++;
          const held = world.colliders(x - 1, z - 1, x + 1, z + 1).some(c => c.rail && y >= c.y0 && y <= c.y1 && F.segDist(x, z, c.x1, c.z1, c.x2, c.z2).d < c.r);
          if (!held && !open++) where = e.name + ' @' + Math.round(x) + ',' + Math.round(z) + ' y ' + p.y.toFixed(1);
        }
      }
    }
  }
  ok(samples > 200 && open === 0, 'bridge parapets are solid along their whole length, ramps included: ' + open + ' of ' + samples + ' points open, first ' + where);
  const lamps = world.props.filter(p => p.type === 'blamp');
  const outward = lamps.filter(p => !world.onCarriageway(p.x + Math.sin(p.yaw) * 0.9, p.z - Math.cos(p.yaw) * 0.9, p.y));
  ok(lamps.length > 20 && outward.length === 0, 'bridge lamps hang over the road: ' + outward.length + ' of ' + lamps.length + ' face away');
});

section('traffic', () => {
  const profile = F.Profile.newProfile('traffic');
  profile.settings.traffic = 1.5;
  const game = new F.Game(world, { profile });
  const T = game.traffic, dt = 1 / 60;
  let snaps = 0, jumps = 0, overlap = 0, pitchErr = 0, holds = 0, frames = 0;
  const turned = new Set(), minorStops = new Set();
  const slopeUnder = c => {
    const fx = Math.sin(c.yaw), fz = -Math.cos(c.yaw), h = c.L / 2;
    return Math.atan2(world.ground(c.x + fx * h, c.z + fz * h, c.y + 1.2, false) - world.ground(c.x - fx * h, c.z - fz * h, c.y + 1.2, false), 2 * h);
  };
  for (const [sx, sz] of [[985, 168], [1380, 0], [250, -1450]]) {
    T.clear();
    const nr = world.nearestRoad(sx, sz, 100);
    game.veh.place(nr.x, nr.z, 0, world);
    const prev = new Map();
    for (let i = 0; i < 60 * 30; i++) {
      game.veh.vx = game.veh.vz = 0;
      T.update(dt, game.veh);
      for (const c of T.cars) {
        if (c.state !== 'drive') continue;
        frames++;
        const p = prev.get(c.uid);
        if (p) {
          if (Math.abs(F.wrap(c.yaw - p.yaw)) > 0.08) snaps++;
          if (Math.hypot(c.x - p.x, c.z - p.z) > Math.max(c.v, p.v) * dt + 0.3) jumps++;
        }
        prev.set(c.uid, { yaw: c.yaw, x: c.x, z: c.z, v: c.v });
        pitchErr = Math.max(pitchErr, Math.abs(c.pitch - slopeUnder(c)));
        if (c.holding && c.v < 0.3) holds++;
        if (c.holding && c.v < 0.3 && c.plan.minor) minorStops.add(c.uid);
        if (c.seg === 'turn' && Math.abs(c.plan.th) > 1) turned.add(c.uid);
        for (const o of T.cars) if (o.uid > c.uid && o.state === 'drive' && Math.hypot(o.x - c.x, o.z - c.z) < 2.2 && Math.abs(o.y - c.y) < 2) overlap++;
      }
    }
  }
  ok(frames > 60000, 'traffic drives around the player: ' + frames + ' car frames');
  ok(snaps === 0, 'traffic heading never snaps between frames: ' + snaps);
  ok(jumps === 0, 'traffic never teleports: ' + jumps);
  ok(turned.size >= 8, 'traffic turns at junctions along curves: ' + turned.size);
  ok(holds > 0 && minorStops.size >= 3, 'traffic stops before junctions and gives way from side streets: ' + minorStops.size);
  ok(overlap < 30, 'traffic cars do not drive through each other: ' + overlap + ' frames');
  ok(pitchErr < 0.1, 'traffic body follows the road slope: ' + pitchErr.toFixed(3));
  let steep = null;
  for (const e of T.edges) for (let i = 1; i < e.pts.length; i++) {
    const g = (e.y[i] - e.y[i - 1]) / (e.s[i] - e.s[i - 1]);
    if (!steep || g > steep.g) steep = { e, g, s: (e.s[i] + e.s[i - 1]) / 2 };
  }
  T.clear();
  game.veh.place(steep.e.pts[0][0], steep.e.pts[0][1], 0, world);
  const car = T.spawn(steep.e.pts[0][0], steep.e.pts[0][1], 0, 1e5);
  Object.assign(car, { e: steep.e, dir: 1, t: steep.s, seg: 'edge', lane: 0, off: T.laneOff(steep.e, 0) });
  T.plan(car);
  const f = T.front(car);
  car.rx = f.x - f.tx * car.L; car.rz = f.z - f.tz * car.L; car.y = world.groundY(f.x, f.z);
  for (let i = 0; i < 10; i++) { T.follow(car, 0); T.pose(car, 0); }
  ok(steep.g > 0.15 && car.pitch > Math.atan(steep.g) * 0.8, 'a car on the steepest street tilts nose up: ' + car.pitch.toFixed(3) + ' for grade ' + steep.g.toFixed(3));
});

section('events', () => {
  const E = F.EV.EVENTS;
  ok(E.length === 30 && E[0].id === 'prologue' && F.EV.get('finale'), 'prologue, 28 festival events and the finale');
  ok(new Set(E.map(e => e.id)).size === E.length, 'event ids are unique');
  for (let tier = 0; tier <= 4; tier++) ok(E.filter(e => e.tier === tier).length >= 5, 'wristband ' + tier + ' has events');
  for (const type of ['road', 'street', 'dirt', 'cc', 'showcase']) ok(E.some(e => e.type === type), 'event type ' + type);
  const bands = F.EV.BANDS;
  for (let i = 1; i < bands.length; i++) ok(bands[i].need > bands[i - 1].need, 'wristband thresholds rise ' + i);
  for (let i = 1; i < bands.length; i++) {
    const avail = E.filter(e => e.tier >= 0 && e.tier < i && e.id !== 'finale').reduce((a, e) => a + (e.type === 'showcase' ? 5 : 3), 0);
    ok(avail >= bands[i].need * 1.2, 'wristband ' + i + ' reachable with room for losses');
  }
  for (const ev of E) {
    const r = F.Route.fromVia(world, ev.via, !!ev.closed, ev.pref || null);
    let reversals = 0;
    for (let i = 0; i < r.n; i++) {
      const a = r.idx(i - 1), b = r.idx(i + 1);
      if (r.tx[a] * r.tx[b] + r.tz[a] * r.tz[b] < -0.9) reversals++;
    }
    ok(reversals === 0, 'route has no U-turns ' + ev.id);
    const km = r.total * (ev.laps || 1) / 1000;
    ok(km > 1.2 && km < 20, 'route length ' + ev.id + ' ' + km.toFixed(2) + ' km');
    for (const v of ev.via) ok(world.nearestRoad(v[0], v[1], 60), 'via point on a road ' + ev.id);
    if (ev.type === 'showcase' && ev.id !== 'finale') ok(ev.rivalCar === 'train' || ev.rivalCar === 'plane', 'showcase has a special rival ' + ev.id);
  }
  for (let i = 1; i < F.DIFF.length; i++) ok(F.DIFF[i].grip > F.DIFF[i - 1].grip && F.DIFF[i].acc >= F.DIFF[i - 1].acc && F.DIFF[i].pay > F.DIFF[i - 1].pay, 'difficulty ladder ' + i);
});

section('races', () => {
  for (const ev of F.EV.EVENTS) {
    const car = ev.id === 'prologue' ? 'mclarenf1' : CLASS_CAR[ev.cls];
    const { game, race, resets, events } = runEvent(ev.id, car, 1);
    ok(race.state === 'done', 'the driver bot finishes ' + ev.id);
    ok(resets <= 6, 'no dead ends on ' + ev.id + ' (resets ' + resets + ')');
    ok(events.includes('finish'), 'finish event emitted ' + ev.id);
    if (ev.id !== 'prologue') ok(race.rivals.length + (race.special ? 1 : 0) >= 1, 'rivals on the grid ' + ev.id);
    const before = game.profile.credits;
    const res = game.finishEvent();
    ok(res && res.pos >= 1 && game.profile.credits >= before, 'rewards paid ' + ev.id);
    ok(game.profile.results[ev.id], 'result stored ' + ev.id);
    log(ev.id, race.time.toFixed(1), 'pos', res.pos, 'resets', resets);
  }
  const times = [0, 4].map(d => {
    const { race } = runEvent('vecriga', 'vaz2105', d);
    return Math.min(...race.rivals.filter(a => a.done).map(a => a.time).concat([1e9]));
  });
  ok(times[0] > times[1], 'rookie rivals are slower than unbeatable ones');
  {
    const profile = F.Profile.newProfile('grid');
    profile.settings.traffic = 0;
    const game = new F.Game(world, { profile });
    const race = game.startEvent('vecriga', { difficulty: 1, seed: 3 });
    const st = { idx: race.lastIdx }, grid = race.rivals.map(a => a.d);
    let t = 0, moved = 0, overlap = 0;
    while (race.state === 'grid') { game.step(1 / 60, { thr: 0.6, brk: 0, steer: 0 }); t += 1 / 60; }
    race.rivals.forEach((a, k) => { moved = Math.max(moved, Math.abs(a.d - grid[k])); });
    ok(moved < 0.01, 'rivals stay in their grid slots during the countdown: ' + moved.toFixed(3) + ' m');
    for (let i = 0; i < 60 * 60 && race.state !== 'done'; i++) {
      game.step(1 / 60, driveInput(game, race, st));
      if (i < 90) race.rivals.forEach((a, k) => { moved = Math.max(moved, Math.abs(a.d - grid[k])); });
      const R = race.rivals;
      for (let a = 0; a < R.length; a++) for (let b = a + 1; b < R.length; b++) if (Math.abs(R[a].progress() - R[b].progress()) < R[a].hl + R[b].hl && Math.abs(R[a].d - R[b].d) < 1.8) overlap++;
    }
    ok(moved < 0.5, 'rivals leave the grid in their own columns: ' + moved.toFixed(2) + ' m in the first 1.5 s');
    ok(overlap < 1000, 'rivals do not drive through each other: ' + overlap + ' frames');
  }
});

section('career', () => {
  store.clear();
  const game = new F.Game(world, { profile: F.Profile.newProfile('career') });
  const p = game.profile;
  ok(!game.eventLocked(F.EV.get('vecriga')) && game.eventLocked(F.EV.get('bikernieki')) && game.eventLocked(F.EV.get('finale')), 'yellow wristband opens only the first events');
  const zaz = F.Cars.get('zaz968');
  const uid = game.buyCar('zaz968');
  ok(uid && p.credits === 5000 - zaz.price && p.cars.length === 2, 'buy a car in the Autoshow');
  ok(!game.buyCar('mclarenf1'), 'cannot buy without credits');
  ok(!game.buyCar(F.EV.BARNS[0].car), 'barn finds are not for sale');
  ok(!game.sellCar(p.current), 'cannot sell the car you drive');
  const credits = p.credits;
  ok(game.sellCar(uid) > 0 && p.credits > credits && p.cars.length === 1, 'sell a car');
  p.credits = 100000;
  const pi0 = game.carPI();
  ok(game.buyPart(p.current, 'engine', 2) && game.carPI() > pi0 && p.credits < 100000, 'engine upgrade costs credits and raises PI');
  ok(game.buyPart(p.current, 'engine', 0) && game.carPI() === pi0, 'stock part refit');
  game.entry.dirt = 0.3;
  game.paintCar(p.current, '#e6146e', '#101010', 'stripes', true);
  ok(game.entry.c1 === '#e6146e' && game.entry.livery === 'stripes' && game.entry.metal === true && game.entry.dirt === 0, 'paint shop sets the finish and washes the car');
  const veh = game.veh, surf0 = veh.surf, speed0 = veh.speed, wet0 = world.wet;
  world.wet = false;
  veh.surf = F.S.DIRT; veh.speed = 20;
  for (let i = 0; i < 60; i++) game.soil(0.1);
  const dirty = game.entry.dirt;
  veh.surf = F.S.ASPHALT;
  for (let i = 0; i < 60; i++) game.soil(0.1);
  const dry = game.entry.dirt;
  veh.surf = F.S.WATER; veh.speed = 8;
  for (let i = 0; i < 60; i++) game.soil(0.1);
  ok(dirty > 0.05 && dry === dirty && game.entry.dirt < dirty * 0.2, 'dirt builds up off road and washes off in water: ' + [dirty, dry, game.entry.dirt].map(v => v.toFixed(3)).join('/'));
  veh.surf = surf0; veh.speed = speed0; world.wet = wet0; game.entry.dirt = 0;
  const lvl = p.level;
  game.addXp(20000);
  ok(p.level > lvl, 'XP levels up the driver');
  const gift = F.EV.levelReward(5).car;
  ok(!gift || p.level < 5 || p.cars.some(c => c.id === gift), 'level gift car delivered');
  p.sp = 10;
  const perk = F.EV.PERKS[0];
  ok(game.buyPerk(perk.id) && p.perks.includes(perk.id) && !game.buyPerk(perk.id), 'skill points buy a perk once');
  game.clock = 23.5;
  const skipped = game.skipTime(6.5);
  ok(Math.abs(skipped - 7) < 1e-9 && game.clock === 6.5 && p.clock === 6.5 && F.Profile.loadProfile().clock === 6.5, 'time skip runs forward through midnight and is saved');
  ok(game.skipTime(30.75) > 0 && game.clock === 6.75, 'time skip wraps the target clock');
  const rr = runEvent('kipsala', 'vaz2105', 1);
  const raceClock = rr.game.clock;
  ok(rr.game.skipTime(raceClock + 3) === 0 && rr.game.clock === raceClock, 'no time skip during an event');
  rr.game.profile.pts = F.EV.BANDS[1].need - 1;
  rr.game.profile.band = 0;
  const r = rr.game.finishEvent();
  ok(r.gained === 0 || rr.game.profile.band >= 1, 'points from a podium unlock the green wristband');
  game.save();
  const loaded = F.Profile.loadProfile();
  ok(loaded && loaded.credits === p.credits && loaded.cars.length === p.cars.length && loaded.level === p.level, 'profile saves and loads');
  store.set(F.Profile.SAVE_KEY, JSON.stringify({ v: 99 }));
  ok(F.Profile.loadProfile() === null, 'foreign save format is ignored');
});

section('weather', () => {
  const W = F.WEATHER;
  ok(Object.keys(W).join() === 'clear,overcast,downpour,storm,fog' && ['Ясно', 'Пасмурно', 'Ливень', 'Гроза', 'Туман'].every((n, i) => W[Object.keys(W)[i]].name === n), 'five weather states: clear, overcast, downpour, thunderstorm, fog');
  ok(F.weatherId('cloudy') === 'clear' && F.weatherId('rain') === 'downpour' && F.weatherId('storm') === 'storm' && F.weatherId('nonsense') === 'clear', 'old saves map to the new weather');
  for (const [id, w] of Object.entries(W)) ok(w.next.every(([n, p]) => W[n] && p > 0) && Math.abs(w.next.reduce((a, [, p]) => a + p, 0) - 1) < 1e-9 && w.dur[0] < w.dur[1], 'weather transitions from ' + id);
  store.clear();
  const profile = F.Profile.newProfile('weather');
  profile.settings.traffic = 0;
  const game = new F.Game(world, { profile });
  const seen = new Set([game.weather]), bolts = [];
  let wetMax = 0, jump = 0, prev = Object.assign({}, game.wx), flashes = 0;
  for (let i = 0; i < 10 * 60 * 300; i++) {
    game.advanceClock(0.1);
    game.updateWeather(0.1);
    const wx = game.wx;
    for (const k of ['cover', 'rain', 'storm', 'fog', 'mist']) jump = Math.max(jump, Math.abs(wx[k] - prev[k]));
    prev = Object.assign({}, wx);
    wetMax = Math.max(wetMax, game.wetK);
    if (wx.flash > 0.3) flashes++;
    for (const e of game.drain()) { if (e.t === 'weather') seen.add(e.w); if (e.t === 'lightning') bolts.push(game.wx.storm); }
  }
  ok(seen.size === 5, 'free roam cycles through every weather in five hours: ' + [...seen].join(','));
  ok(jump < 0.0045, 'weather blends smoothly between states: ' + jump.toFixed(4) + ' per 0.1 s');
  ok(wetMax > 0.95 && bolts.length > 3 && bolts.every(k => k >= 0.4) && flashes > 0, 'rain soaks the roads and storms throw lightning: ' + bolts.length);
  game.setWeather('downpour', true);
  ok(game.wx.rain === 1 && game.wetK === 1 && world.wet === 1, 'a downpour soaks the roads at once when set');
  const dry = F.surfGrip(F.S.ASPHALT, 0, 0), wet = F.surfGrip(F.S.ASPHALT, 0, 1), damp = F.surfGrip(F.S.ASPHALT, 0, 0.5);
  ok(Math.abs(wet / dry - 0.84) < 1e-9 && damp < dry && damp > wet && F.surfGrip(F.S.ASPHALT, 0, true) === wet, 'grip falls with road wetness: ' + [dry, damp, wet].map(v => v.toFixed(3)).join('/'));
  game.setWeather('clear', true);
  game.wetK = 1;
  for (let i = 0; i < 60 * 200; i++) game.updateWeather(1 / 60);
  ok(game.wetK === 0 && world.wet === 0, 'roads dry out after the rain');
  game.setWeather('fog', true);
  for (let i = 0; i < 60 * 120; i++) game.updateWeather(1 / 60);
  for (const f of ['fz-render', 'fz-ui']) require(path.join(DIR, f + '.js'));
  const fogEnv = F.skyEnv(9, game.wx, 900, game.wetK), clearEnv = F.skyEnv(9, 'clear', 900);
  ok(game.wx.mist === 1 && game.wx.rain === 0 && Math.abs(game.wetK - W.fog.damp) < 1e-9 && game.drain().every(e => e.t !== 'lightning'), 'fog leaves the roads damp, never soaked, and has no lightning');
  ok(fogEnv.mistD > 0.015 && 3 / fogEnv.mistD < 200 && fogEnv.fogFar < clearEnv.fogFar && clearEnv.mistD === 0 && fogEnv.sunCol[0] < clearEnv.sunCol[0] && fogEnv.amb[1] > clearEnv.amb[1] * 0.98, 'fog cuts visibility under 200 m and softens the sun: ' + Math.round(3 / fogEnv.mistD) + ' m');
  const morning = [], noon = [];
  for (let k = 0; k < 400; k++) {
    for (const [clock, out] of [[6, morning], [15, noon]]) {
      game.setWeather('clear', true);
      game.clock = clock;
      game.weatherT = 0;
      game.advanceClock(0.001);
      out.push(game.weather);
    }
  }
  const share = a => a.filter(w => w === 'fog').length / a.length;
  ok(share(morning) > share(noon) * 2.5 && share(noon) > 0, 'fog forms mostly at dawn: ' + share(morning).toFixed(2) + ' vs ' + share(noon).toFixed(2));
  game.setWeather('storm', true);
  game.save();
  ok(F.Profile.loadProfile().weather === 'storm', 'weather is saved');
  const race = game.startEvent('vecriga', { difficulty: 1, seed: 3 });
  ok(race && game.weather === 'clear' && game.wx.rain === 0 && world.wet === 0, 'events use their own weather');
  game.abandonEvent();
  ok(game.weather === 'storm' && game.wx.storm === 1 && world.wet === 1, 'free roam weather comes back after an event');
  game.setWeather('clear', true);
  const src = read('js/apps/forza/fz-render.js');
  ok(/RAYSRC_FS/.test(src) && /RADIAL_FS/.test(src) && /uRays/.test(src), 'sun rays post pass');
  ok(/float cloudAt\(vec2 uv\)/.test(src) && /lightT/.test(src) && /uFlash/.test(src) && /smoothstep\(0\.99955, 0\.9998, sd\)/.test(src), 'cloud layer with sun lighting, lightning flashes and a sun disc');
  ok(/uCloudSh/.test(src) && /ring \* 2\.2/.test(src), 'cloud shadows on the ground and rain ripples in puddles');
  ok(/uniform vec4 uMist/.test(src) && /\(1\.0 - exp\(-hk\)\) \/ hk/.test(src) && /uMistS/.test(src) && /mistUniform\(s\.u, env\)/.test(src), 'height fog in the world, sprite and sky shaders');
  ok(/blendFuncSeparate/.test(src) && !/gl\.blendFunc\(/.test(src), 'transparent passes keep the occlusion alpha for the rays');
  const ui = read('js/apps/forza/fz-ui.js');
  ok(/rainSprites/.test(ui) && /'rainsheet'/.test(ui) && /'splash'/.test(ui) && /addBolt/.test(ui) && /thunder\(e\.d\)/.test(ui), 'rain streaks, sheets, splashes, lightning bolts and thunder');
  ok(/autoLights\(\)/.test(ui) && /foghorn\(/.test(ui) && /fog: 'Видимость/.test(ui) && /fog: 'fog'/.test(read('js/apps/forza/fz-menus.js')) && /\.fz-w-fog/.test(read('css/apps/forza.css')), 'fog turns the headlights on, sounds a foghorn and has a menu icon');
});

section('audio', () => {
  require(path.join(DIR, 'fz-audio.js'));
  const param = v => ({ value: v, setTargetAtTime(x) { this.value = x; }, setValueAtTime(x) { this.value = x; }, exponentialRampToValueAtTime() { }, linearRampToValueAtTime() { } });
  const made = [];
  const node = kind => {
    const n = { kind, out: [], gain: param(1), frequency: param(0), Q: param(0), connect(to) { this.out.push(to); }, start() { }, stop() { } };
    made.push(n);
    return n;
  };
  const dest = node('dest');
  globalThis.AudioContext = class {
    constructor() { this.currentTime = 0; this.sampleRate = 8000; this.state = 'running'; this.destination = dest; }
    createGain() { return node('gain'); }
    createOscillator() { return node('osc'); }
    createBiquadFilter() { return node('filter'); }
    createBufferSource() { return node('src'); }
    createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) }; }
    close() { }
  };
  const a = new F.Audio();
  a.setVolumes({ master: 0.5, engine: 0.6, sfx: 0.3, ambient: 0.25, music: 1 });
  a.unlock();
  clearInterval(a.sched);
  ok(a.ok && a.master.gain.value === 0.5 && a.engBus.gain.value === 0.6 && a.sfx.gain.value === 0.3 && a.amb.gain.value === 0.25, 'volumes chosen before the first click reach every bus');
  ok([a.engBus, a.sfx, a.amb, a.music].every(b => b.out[0] === a.master) && a.master.out[0] === dest, 'engine, effects, ambient and radio buses feed the master');
  ok(a.rain.g.out[0] === a.amb && a.tire.g.out[0] === a.sfx && a.wind.g.out[0] === a.sfx, 'rain plays on the ambient bus, tyres and wind on the effects bus');
  a.setVolumes({ ambient: 0 });
  ok(a.amb.gain.value === 0 && a.sfx.gain.value === 0.3 && a.vol.engine === 0.6, 'the ambient slider changes only the ambient bus');
  a.setVolumes({ sfx: undefined, ambient: NaN, music: 0.4 });
  ok(a.vol.sfx === 0.3 && a.vol.ambient === 0 && a.music.gain.value === 0.4 * 0.45, 'missing volume values keep the current level');
  const through = fn => { const from = made.length; fn(); return made.slice(from).filter(n => n.kind === 'gain').map(n => n.out[0]); };
  ok(through(() => a.thunder(400)).every(o => o === a.amb) && through(() => a.foghorn(1200)).some(o => o === a.amb) && !through(() => a.foghorn(1200)).includes(a.sfx), 'thunder and the foghorn are ambient sounds');
  ok(through(() => a.play('hit', 4)).every(o => o === a.sfx), 'hits stay on the effects bus');
  a.update({ rpm: 3000, thr: 1, speed: 30, skid: 0.5, rough: 0, rain: 1, wet: 1 });
  ok(a.rain.g.gain.value > 0.1 && a.tire.g.gain.value > 0 && a.raining, 'rain is heard while driving');
  a.update({ rpm: 3000, thr: 0.4, speed: 12, skid: 0, rough: 0, rain: 1, wet: 1, roof: true, market: 1 });
  ok(a.crowd.g.out[0] === a.amb && a.crowd.g.gain.value > 0.01 && a.rain.fl.frequency.value === 1400, 'the market murmurs on the ambient bus and rain drums on the pavilion roof');
  a.update({ rpm: 3000, thr: 0.4, speed: 12, skid: 0, rough: 0, rain: 1, wet: 1 });
  ok(a.crowd.g.gain.value === 0 && a.rain.fl.frequency.value > 1400, 'the murmur stays at the market');
  a.update({ silent: true, rain: 1 });
  ok(a.rain.g.gain.value > 0.1 && a.tire.g.gain.value === 0 && a.eOut.gain.value === 0, 'a menu mutes the car but the rain keeps falling');
  ok(through(() => a.sample('ambient')).length === 0 && a.sample('ambient'), 'no test sound over real rain');
  a.update(null);
  ok(a.rain.g.gain.value === 0 && !a.raining, 'the title screen has no rain');
  ok(through(() => a.sample('ambient')).every(o => o === a.amb) && through(() => a.sample('ambient')).length === 1, 'the ambient slider plays a rain sample on its own bus');
  ok(through(() => a.sample('engine')).every(o => o === a.engBus) && through(() => a.sample('music')).every(o => o === a.music) && !a.sample('sfx') && !a.sample('vol'), 'engine and radio sliders play samples on their buses');
  a.destroy();
  delete globalThis.AudioContext;
  const def = F.Profile.defaultSettings();
  ok(def.sfx === 0.8 && def.ambient === 0.8 && def.vol === 0.8, 'effects and ambient volume have defaults');
  store.clear();
  const old = F.Profile.newProfile('old');
  delete old.settings.sfx;
  delete old.settings.ambient;
  F.Profile.saveProfile(old);
  const back = F.Profile.loadProfile().settings;
  ok(back.sfx === 0.8 && back.ambient === 0.8, 'old saves get the new volume settings');
  const menus = read('js/apps/forza/fz-menus.js'), ui = read('js/apps/forza/fz-ui.js'), css = read('css/apps/forza.css');
  ok(['vol', 'engine', 'sfx', 'ambient', 'music'].every(k => new RegExp("\\['[^']+', '" + k + "', 1(\\.2)?\\]").test(menus)) && /Окружение \(дождь, гроза, салют\)/.test(menus), 'five volume rows, one of them for ambient sound');
  ok(/volumeRow\(label, key, max, s\)/.test(menus) && /pointerdown/.test(menus) && /setPointerCapture/.test(menus) && /F\.clamp\(d > 0 \?/.test(menus), 'volume rows are sliders: drag with the mouse, step without wrap on the keys');
  ok(/\.fz-vol-knob/.test(css) && /\.fz-vol-fill/.test(css), 'slider styles');
  ok(/ambient: s\.ambient/.test(ui) && /sfx: s\.sfx/.test(ui) && /silent: true, rain: g\.wx\.rain/.test(ui) && /343, this\.audio\.amb\)/.test(ui), 'the UI passes all volumes, keeps rain in menus and sends fireworks to the ambient bus');
});

section('debug', () => {
  store.clear();
  const profile = F.Profile.newProfile('debug');
  profile.settings.traffic = 0;
  const game = new F.Game(world, { profile });
  const p = game.profile, cr = p.credits;
  game.grantCredits(100000);
  ok(p.credits === cr + 100000 && F.Profile.loadProfile().credits === p.credits, 'F7 gives credits and saves');
  const lv = p.level;
  game.grantXp(1000);
  ok(p.level === lv + 1 || p.xp >= 1000 - F.EV.xpForLevel(lv), 'F7 gives XP');
  const l2 = p.level;
  game.grantLevel();
  ok(p.level === l2 + 1 && p.xp === 0, 'F7 adds a whole level');
  const spots = game.teleportSpots();
  ok(spots.length > 60 && ['Аванпосты', 'Достопримечательности', 'События', 'Сараи'].every(gr => spots.some(s => s.group === gr)), 'teleport list: outposts, landmarks, events and barns: ' + spots.length);
  let far = 0, fails = [];
  for (const s of spots) {
    if (!game.teleport(s)) { fails.push(s.name); continue; }
    const v = game.veh;
    if (!s.exact && !world.nearestRoad(v.x, v.z, 2)) fails.push(s.name + ' off road');
    far = Math.max(far, Math.hypot(v.x - s.x, v.z - s.z));
  }
  ok(!fails.length && far < 400, 'every teleport spot puts the car on a road near the place: ' + fails.slice(0, 4).join(', '));
  ok(game.drain().some(e => e.t === 'teleport'), 'teleport tells the HUD');
  game.startEvent('vecriga', { difficulty: 1, seed: 3 });
  const vx = game.veh.x;
  ok(!game.teleport(spots[0]) && game.veh.x === vx, 'no teleport during an event');
  game.abandonEvent();
  const ui = read('js/apps/forza/fz-ui.js'), menus = read('js/apps/forza/fz-menus.js');
  ok(/e\.code === 'F7'/.test(ui) && /e\.preventDefault\(\);\n\s*e\.stopPropagation\(\);\n\s*if \(!e\.repeat\) this\.toggleDebug\(\);/.test(ui), 'F7 toggles the debug panel and never reaches the browser');
  ok(/debug\(\) \{/.test(menus) && /grantCredits/.test(menus) && /grantXp/.test(menus) && /grantLevel/.test(menus) && /setWeather\(id, true\)/.test(menus) && /g\.teleport\(s\)/.test(menus) && /К метке на карте/.test(menus), 'the debug panel has credits, XP, weather, time and teleport');
  ok(/\.fz-dbg-panel/.test(read('css/apps/forza.css')), 'debug panel styles');
});

section('photo', () => {
  require(path.join(DIR, 'fz-photo.js'));
  const P = F.Photo, M4 = F.M4;
  ok(Math.abs(P.fovOf(50) - 26.99) < 0.05 && Math.abs(P.focalOf(P.fovOf(35)) - 35) < 1e-6, 'focal length maps to the field of view of a 35 mm frame');
  const k = P.cocScale(50, 2.8, 5, 720), far = k * (4000 - 5) / 4000;
  ok(far > 3 && far < 8 && P.cocScale(50, 0, 5, 720) === 0 && P.cocScale(85, 1.4, 5, 720) > k * 4, 'background blur follows focal length and aperture: ' + far.toFixed(2) + ' px at 50 mm f/2.8');
  const [cx, cy, cw, ch] = P.cropOf(1280, 720, 4 / 3);
  ok(Math.abs(cw / ch - 4 / 3) < 1e-9 && cy === 0 && Math.abs(cx * 2 + cw - 1280) < 1e-9, 'a 4:3 frame is cut from the middle of a wide view');
  const uv = P.cropUv(16 / 9, 4 / 3);
  ok(Math.abs(uv[2] - uv[0] - 0.75) < 1e-9 && uv[1] === 0 && uv[3] === 1, 'the frame in texture coordinates matches the crop');
  const cs = P.captureSize(1280, 720, 4 / 3, 768, 2560);
  ok(cs.ow === 1024 && cs.oh === 768 && cs.rh === 768 && Math.abs(cs.rw / cs.rh - 16 / 9) < 0.01, 'a capture renders the whole view at a size where the crop is 1024x768');
  const wide = P.captureSize(1280, 720, 2.39, 1200, 2048);
  ok(wide.ow <= 2048 && wide.rw <= 2048 && wide.rh <= 2048 && Math.abs(wide.ow / wide.oh - 2.39) < 0.01, 'the capture size stays inside the GPU limit');
  const same = P.captureSize(1280, 720, 0, 0, 2560);
  ok(same.ow === 1280 && same.oh === 720 && same.rw === 1280, 'a screen-sized photo needs no extra render');
  ok(P.dateText(P.festDay({ results: {} })) === "'01 7 14" && P.festDay({ results: { a: 1, b: 1, c: 1 } }).d === 17 && P.dateLong(P.festDay({ results: {} })) === '14 июля 2001', 'the date imprint follows the festival calendar');
  ok(P.evText(0) === '0 EV' && P.evText(1 / 3) === '+⅓ EV' && P.evText(-4 / 3) === '−1⅓ EV' && P.evText(2) === '+2 EV', 'exposure readout in thirds of a stop');
  ok(Object.values(P.FILTERS).every(f => f.mat.length === 9 && f.off3.length === 3 && f.name) && [...P.FILTERS.none.mat].join() === '1,0,0,0,1,0,0,0,1', 'film looks are colour matrices, the plain one is the identity');
  ok(P.LOOK.every(key => key in P.lookDefaults()) && P.STOPS[0] === 0 && P.FOCALS[0] < 20 && P.FOCALS[P.FOCALS.length - 1] >= 200, 'saved look options have defaults, lenses go from wide to tele');

  const road = world.nearestRoad(700, -150, 300);
  const car = { x: road.x, y: world.groundY(road.x, road.z), z: road.z, yaw: Math.atan2(road.tx, -road.tz), len: 4.2, wid: 1.7, hgt: 1.4 };
  const pivot = [car.x, car.y + 1, car.z];
  const bd = world.buildings.filter(b => b.h > 8 && F.inPoly(b.x, b.z, b.poly)).sort((a, b) => Math.hypot(a.x - car.x, a.z - car.z) - Math.hypot(b.x - car.x, b.z - car.z))[0];
  const inBd = P.constrain(world, car, [bd.x, car.y + 3, bd.z], pivot);
  ok(!F.inPoly(inBd[0], inBd[2], bd.poly) || inBd[1] > bd.y + bd.h, 'the photo camera stops in front of a wall instead of entering a building');
  const away = P.constrain(world, car, [car.x + 300, car.y + 200, car.z], pivot);
  ok(Math.hypot(away[0] - car.x, away[2] - car.z) <= P.RANGE + 1e-6 && away[1] <= car.y + P.CEIL + 1e-6, 'the photo camera stays within ' + P.RANGE + ' m of the car');
  const under = P.constrain(world, car, [car.x + road.rx * 2, car.y - 20, car.z + road.rz * 2], pivot);
  ok(under[1] >= world.ground(under[0], under[2], under[1] + 1, false) + 0.29, 'the photo camera never goes under the ground');
  const inCar = P.constrain(world, car, [car.x, car.y + 0.6, car.z], pivot);
  const lu = (inCar[0] - car.x) * Math.sin(car.yaw) - (inCar[2] - car.z) * Math.cos(car.yaw), lv = (inCar[0] - car.x) * Math.cos(car.yaw) + (inCar[2] - car.z) * Math.sin(car.yaw);
  ok(Math.abs(lu) >= car.len / 2 + 0.24 || Math.abs(lv) >= car.wid / 2 + 0.24 || inCar[1] >= car.y + car.hgt + 0.19, 'the photo camera is pushed out of the car body');
  const mid = bd.y + bd.h / 2, rr = Math.max(...bd.poly.map(q => Math.hypot(q[0] - bd.x, q[1] - bd.z))) + 6;
  ok(P.rayHit(world, [bd.x - rr, mid, bd.z], [bd.x + rr, mid, bd.z]) < 1 && P.rayHit(world, [bd.x - rr, bd.y + bd.h + 30, bd.z], [bd.x + rr, bd.y + bd.h + 30, bd.z]) === 1, 'camera rays hit buildings and pass over them');
  ok(P.sight(world, [bd.x - rr, mid, bd.z], [bd.x + rr, mid, bd.z]) === 0, 'a building hides what stands behind it');

  const rng = F.rng(3);
  const scene = { landmarks: world.landmarks.map(l => { const b = new F.Batch(1024); b.uvw = F.Landmarks.WHITE; return { type: l.type, name: l.name, x: l.x, y: l.y, z: l.z, h: F.Models.LM[l.type](b, rng, {}) || 30, src: l }; }) };
  const list = P.targets(scene);
  ok(list.length === world.landmarks.filter(l => l.name).length && list.length >= 29 && new Set(list.map(t => t.key)).size === list.length && list.every(t => t.h > 1 && t.r > 0), 'every named landmark is a photo target: ' + list.length);
  const mon = list.find(t => t.key === 'freedom');
  let spot = null;
  for (let a = 0; a < Math.PI * 2 && !spot; a += Math.PI / 24) {
    for (const d of [30, 40, 55]) {
      const nr = world.nearestRoad(mon.x + Math.sin(a) * d, mon.z - Math.cos(a) * d, 4);
      if (!nr) continue;
      const dx = nr.x - mon.x, dz = nr.z - mon.z, l = Math.hypot(dx, dz);
      const gy = world.groundY(nr.x, nr.z), eye = [nr.x + dx / l * 10, gy + 1.7, nr.z + dz / l * 10];
      if (P.rayHit(world, [nr.x, gy + 1, nr.z], eye) < 1) continue;
      if (P.sight(world, eye, [mon.x, mon.y + mon.h * 0.6, mon.z], { x: mon.x, z: mon.z, r: mon.r + 3 }) < 0.9) continue;
      spot = { car: { x: nr.x, y: gy, z: nr.z, hgt: 1.4 }, eye };
      break;
    }
  }
  ok(!!spot, 'there is a street view of the Freedom Monument');
  const shot = (eye, look, fov = 60) => {
    const cam = { x: eye[0], y: eye[1], z: eye[2], fov };
    return { cam, vp: M4.mul(M4.persp(fov * Math.PI / 180, 4 / 3, 0.1, 4000), M4.lookAt(eye[0], eye[1], eye[2], look[0], look[1], look[2])) };
  };
  const view = shot(spot.eye, [(mon.x + spot.car.x) / 2, mon.y + 9, (mon.z + spot.car.z) / 2]);
  const hit = P.spotted(world, list, view.cam, view.vp, [0, 0, 1, 1], spot.car);
  ok(hit.car && hit.found.some(t => t.key === 'freedom'), 'the car in front of the Freedom Monument counts for the photo hunt');
  ok(!P.spotted(world, list, view.cam, view.vp, [0, 0, 1, 1], null).car, 'a photo with the car hidden does not count');
  const back = shot(spot.eye, [spot.eye[0] * 2 - mon.x, spot.eye[1], spot.eye[2] * 2 - mon.z]);
  ok(!P.spotted(world, list, back.cam, back.vp, [0, 0, 1, 1], spot.car).found.some(t => t.key === 'freedom'), 'a landmark behind the camera is not in the photo');
  const distant = shot([mon.x + 400, mon.y + 40, mon.z], [mon.x, mon.y + 20, mon.z], 12);
  ok(!P.spotted(world, list, distant.cam, distant.vp, [0, 0, 1, 1], { x: mon.x + 380, y: mon.y, z: mon.z, hgt: 1.4 }).found.some(t => t.key === 'freedom'), 'a landmark far away through a long lens does not count');
  const corner = shot(spot.eye, [(mon.x + spot.car.x) / 2, mon.y + 9, (mon.z + spot.car.z) / 2], 60);
  ok(!P.spotted(world, list, corner.cam, corner.vp, [0, 0, 0.12, 0.12], spot.car).found.length, 'a landmark outside the chosen frame format is not counted');

  store.clear();
  const profile = F.Profile.newProfile('photo');
  profile.settings.traffic = 0;
  const game = new F.Game(world, { profile });
  const total = pr => { let n = pr.xp; for (let l = 1; l < pr.level; l++) n += F.EV.xpForLevel(l); return n; };
  const cr0 = game.profile.credits, xp0 = total(game.profile);
  const prize = P.award(game, [mon], list.length);
  ok(prize && prize.xp === P.XP && prize.cr === P.CR && game.profile.credits >= cr0 + P.CR && game.profile.photoLm.includes('freedom') && total(game.profile) === xp0 + P.XP, 'the first photo of a landmark pays XP and credits');
  ok(P.award(game, [mon], list.length) === null, 'the same landmark pays only once');
  const cr1 = game.profile.credits, all = P.award(game, list, list.length);
  ok(all && all.bonus === P.ALL_CR && all.cr === P.CR * (list.length - 1) && game.profile.credits >= cr1 + all.cr + P.ALL_CR && game.profile.photoAll, 'photographing every landmark pays the bonus');
  ok(F.Profile.loadProfile().photoLm.length === list.length, 'the photo hunt is saved');
  const url = 'data:image/jpeg;base64,/9j/4AAQ';
  const s1 = P.store(game.profile, url, { place: 'Вецрига', x: 1, z: 2 }), s2 = P.store(game.profile, url, { place: 'Центр', x: 3, z: 4 });
  ok(s1.ok && s2.ok && s1.ph.file === 'RIGA_0001.JPG' && s2.ph.file === 'RIGA_0002.JPG' && P.photoList(game.profile).length === 2 && P.readPhoto(s2.ph) === url, 'photos are numbered and kept in the album');
  P.removePhoto(game.profile, s1.ph);
  ok(P.photoList(game.profile).length === 1 && P.readPhoto(s1.ph) === null && P.store(game.profile, url, {}).ph.file === 'RIGA_0003.JPG', 'deleting a photo keeps the numbering going');

  const ui = read('js/apps/forza/fz-ui.js'), menus = read('js/apps/forza/fz-menus.js'), rend = read('js/apps/forza/fz-render.js'), css = read('css/apps/forza.css');
  ok(/case 'KeyV': this\.openPhoto\(\)/.test(ui) && /if \(edge\(11\)\) this\.press\('KeyV'\)/.test(ui) && /this\.photo && !this\.photo\.busy\) \{ this\.photo\.render\(\)/.test(ui), 'V and the right stick open photo mode, the frame goes through it');
  ok((menus.match(/ui\.openPhoto\(\)/g) || []).length === 2 && /V — фоторежим/.test(menus), 'photo mode is in the Horizon menu and the race pause menu');
  ok(/WEBGL_depth_texture/.test(rend) && /DOF_FS/.test(rend) && /uniform mat3 uMat/.test(rend) && /this\.forcePost/.test(rend) && /this\.lodK/.test(rend), 'renderer: depth of field, colour matrix, grain and forced post chain');
  ok(/\.fz-photo \{/.test(css) && /\.fz-ph-panel \{/.test(css) && /\.fz-album \{/.test(css) && /\.fz-al-strip \{/.test(css), 'photo mode and album styles');
});

section('shadows', () => {
  const gl = new Proxy({}, { get: (o, k) => k === 'getParameter' ? () => 4096 : k === 'getExtension' ? () => null : typeof k === 'string' && /^[A-Z][A-Z0-9_]*$/.test(k) ? 1 : () => ({}) });
  const r = new F.Renderer({ getContext: () => gl, addEventListener() { } }, {});
  r.setGfx('ultra');
  r.scene = { chunks: [], landmarks: [] };
  r.textures.set('lmatlas', {});
  const S = r.shadowSize, sunAt = a => { const el = 0.35; return [Math.cos(el) * Math.sin(a), Math.sin(el), -Math.cos(el) * Math.cos(a)]; };
  const pass = (a, c) => { r.shadowPass({ sunUp: true, cover: 0, sunDir: sunAt(a), time: 0, wind: 0 }, c, [], null); return r.shadowVP; };
  const phase = (vp, x, y, z) => { const u = ((vp[0] * x + vp[4] * y + vp[8] * z + vp[12]) * 0.5 + 0.5) * S, v = ((vp[1] * x + vp[5] * y + vp[9] * z + vp[13]) * 0.5 + 0.5) * S; return [u, v]; };
  const wrapT = d => ((d % 1) + 1.5) % 1 - 0.5;
  const C = { x: 1500, y: 2, z: -830, eye: [1460, 3.5, -800], lodK: 1.4 };
  const pts = [];
  for (let k = 0; k < 40; k++) pts.push([C.x + Math.cos(k * 2.4) * (8 + k * 1.4), 1 + (k % 5), C.z + Math.sin(k * 2.4) * (8 + k * 1.4)]);
  const drift = (vpA, vpB) => Math.max(...pts.map(p => { const a = phase(vpA, ...p), b = phase(vpB, ...p); return Math.max(Math.abs(wrapT(a[0] - b[0])), Math.abs(wrapT(a[1] - b[1]))); }));
  const step = 0.15 / 60 * Math.PI / 180;
  const v0 = new Float32Array(pass(1.1, C));
  ok(r.shadowOn && r.lodEye === C.eye && r.lodK === 1.4, 'the shadow pass picks car LODs from the current camera');
  let turn = 0, v1 = v0;
  for (let i = 1; i <= 120; i++) { const cur = new Float32Array(pass(1.1 + step * i, C)); turn = Math.max(turn, drift(v1, cur)); v1 = cur; }
  ok(turn < 0.06, 'the moving sun keeps the shadow texel grid in place near the camera: ' + turn.toFixed(4) + ' texel per frame');
  const v2 = new Float32Array(pass(1.1 + step * 120, { x: C.x + 13.37, y: 2.4, z: C.z - 7.91 }));
  const move = drift(v1, v2);
  ok(move < 0.01, 'moving the camera does not slide the shadow texel grid: ' + move.toFixed(4) + ' texel');
  const src = read('js/apps/forza/fz-render.js');
  ok(/const SH_VS = ANIM \+/.test(src) && /const VS = ANIM \+/.test(src) && /animate\(aPos, floor\(aNrm\.w \* 127\.0 \+ 0\.5\), n\)/.test(src), 'leaves sway the same way in the shadow map and on screen');
  ok(/uShadowN \* \(N \* \(uShadowBias\.x \* sl \* uCaster\)\)/.test(src) && /uniform1f\(u\.uCaster, receiverOnly\(base\) \? 0 : 1\)/.test(src) && /if \(!mesh \|\| receiverOnly\(key\)\) continue;/.test(src), 'normal offset bias on casters, no offset on ground that never casts');
  ok((src.match(/shadowRow\(b/g) || []).length === 4 && /for \(const car of cars\) this\.drawCar\(car, env, 0\)/.test(src), 'filtered 4x4 shadow lookups, car shadows use the visible LOD');
  const UI = F.UI.prototype, wheel = (lx, lz, gy) => ({ lx, lz, gy });
  const flat = { x: 10, y: 5.02, z: 20, yaw: 0.3, pitch: 0, roll: 0, wheels: [wheel(1.3, -0.7, 5), wheel(1.3, 0.7, 5), wheel(-1.2, -0.7, 5), wheel(-1.2, 0.7, 5)] };
  const g0 = UI.groundUnder(flat, { x: 10.2, y: 5.02, z: 20.1 });
  ok(Math.abs(g0.y - 5) < 1e-9 && g0.lift === 0 && g0.sf === 0 && g0.sr === 0, 'the contact shadow lies on the ground under the wheels');
  const air = UI.groundUnder(flat, { x: 10, y: 7.4, z: 20 });
  ok(air.lift === 1 && Math.abs(air.y - 5) < 1e-9, 'the contact shadow stays on the ground and fades out in a jump');
  const hill = UI.groundUnder(Object.assign({}, flat, { wheels: [wheel(1.3, -0.7, 5.2), wheel(1.3, 0.7, 5.2), wheel(-1.2, -0.7, 4.8), wheel(-1.2, 0.7, 4.8)] }), { x: 10, y: 5.1, z: 20 });
  ok(Math.abs(hill.sf - 0.16) < 1e-9 && hill.sr === 0 && hill.lift === 0, 'the contact shadow tilts with the slope: ' + hill.sf.toFixed(3));
  const host = { game: { veh: { x: 4, y: 1, z: 6, yaw: 0.5 } }, prevPose: { x: 2, y: 1, z: 6, yaw: 0.3 }, acc: F.TICK * 0.25, renderPose: UI.renderPose };
  const torn = UI.toRendered.call(host, { x: 4, y: 1, z: 6, yaw: 0.5, vx: 30, player: true });
  ok(Math.abs(torn.x - 2.5) < 1e-9 && Math.abs(torn.yaw - 0.35) < 1e-9 && torn.vx === 30, 'torn parts of the player car start where the car is drawn');
  const parked = { carShown: () => false, scene: { parkedBy: new Map([[{ x0: 0, x1: 100, z0: 0, z1: 100 }, [{ id: 'vaz2105', x: 50, y: 0, z: 50, yaw: 0 }, { id: 'vaz2105', x: 95, y: 0, z: 95, yaw: 0 }]]]) } };
  const casters = UI.shadowCars.call(parked, { race: null, traffic: { cars: [] } }, { x: 40, z: 40 });
  ok(casters.length === 1 && casters[0].x === 50 && !casters[0].far, 'parked cars near the camera cast sun shadows');
});

section('camera', () => {
  const UI = F.UI.prototype, h = F.MAP.HUB;
  const profile = F.Profile.newProfile('cam');
  profile.settings.traffic = 0;
  const game = new F.Game(world, { profile });
  game.veh.place(h.x - 12, h.z + 14, 2.2, world);
  const v = game.veh, set = Object.assign(F.Profile.defaultSettings(), {});
  const viewEl = { setPointerCapture() { }, releasePointerCapture() { }, hasPointerCapture: () => false };
  const host = Object.assign(Object.create(UI), { game, world, mode: 'play', menuOpen: false, photo: null, keys: {}, pad: {}, camMode: 'chase', shake: 0, acc: 0, prevPose: null, camYaw: 0, camPos: null, camHit: 1, camZoom: 1, look: { yaw: 0, pitch: 0, vy: 0, vp: 0, idle: 0, drag: null }, view: viewEl, el: { classList: { add() { }, remove() { } } }, settings: () => set });
  const run = (n, dt = 1 / 60) => { let c; for (let i = 0; i < n; i++) c = host.camera(dt); return c; };
  const fwd = [Math.sin(v.yaw), -Math.cos(v.yaw)], right = [Math.cos(v.yaw), Math.sin(v.yaw)];
  const rel = c => [c.x - v.x, c.z - v.z];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const base = run(60), b0 = rel(base);
  ok(dot(b0, fwd) < -4 && Math.abs(dot(b0, right)) < 0.3, 'the chase camera sits behind the car with no mouse look');
  ok(set.mlook === 'hold' && set.msens === 1 && set.minv === false && set.mret === 'fast', 'mouse look is on by default, held button, normal speed, quick return');
  host.look.drag = 1;
  host.lookTurn(Math.PI / 2, 0);
  const side = rel(run(10));
  ok(dot(side, right) < -4 && Math.abs(dot(side, fwd)) < 1.2, 'turning the mouse to the right swings the chase camera to the left side of the car, looking across it');
  ok(Math.abs(Math.hypot(...side) - Math.hypot(...b0)) < 0.4, 'the orbit keeps the camera distance: ' + Math.hypot(...side).toFixed(2) + ' vs ' + Math.hypot(...b0).toFixed(2));
  host.lookTurn(Math.PI / 2, 0);
  const front = rel(run(10));
  ok(dot(front, fwd) > 4, 'half a turn shows the car from the front');
  host.lookTurn(2, 0);
  ok(host.look.yaw >= -Math.PI && host.look.yaw <= Math.PI, 'the third-person look yaw wraps around without limits');
  host.lookReset();
  host.lookTurn(0, -0.8);
  const high = run(10);
  ok(high.y > base.y + 2 && high.y - v.y < 9, 'dragging the mouse down lifts the camera over the car: ' + (high.y - v.y).toFixed(2) + ' m');
  host.lookTurn(0, 5);
  const low = run(10);
  ok(host.look.pitch === 0.42 && low.y >= world.groundY(low.x, low.z) + 0.6 - 1e-6, 'looking up lowers the camera but never under the ground');
  const o = UI.orbitOffset(0, 2, -6, 0.7, 0.3), r0 = Math.hypot(2, 6);
  ok(Math.abs(Math.hypot(...o) - r0) < 1e-9 && Math.abs(Math.atan2(o[1], Math.hypot(o[0], o[2])) - (Math.atan2(2, 6) - 0.3)) < 1e-9, 'the orbit turns the offset around the car and keeps its length');
  const top = UI.orbitOffset(0, 2, -6, 0, -3);
  ok(Math.abs(Math.atan2(top[1], Math.hypot(top[0], top[2])) - 1.35) < 1e-9, 'the orbit stops short of looking straight down');
  host.look.drag = null;
  host.lookReset();
  host.lookTurn(1.2, 0.3);
  host.look.drag = null;
  run(20);
  ok(host.look.yaw === 1.2 && host.look.pitch === 0.3, 'after the button is released the view stays put for half a second');
  run(180);
  ok(host.look.yaw === 0 && host.look.pitch === 0, 'then the camera returns behind the car');
  set.mret = 'slow';
  host.lookTurn(-1, 0);
  run(150);
  ok(host.look.yaw === -1, 'the slow return waits three seconds');
  set.mret = 'off';
  run(400);
  ok(host.look.yaw === -1, 'with the return switched off the view stays where it was left');
  host.look.drag = 3;
  set.mret = 'fast';
  run(200);
  ok(host.look.yaw === -1, 'a held button keeps the view');
  host.look.drag = null;
  host.camZoom = 1;
  host.lookReset();
  host.camPos = null;
  const near = Math.hypot(...rel(run(90)));
  host.lookZoom({ deltaY: 100, preventDefault() { } });
  for (let i = 0; i < 20; i++) host.lookZoom({ deltaY: 100, preventDefault() { } });
  const farD = Math.hypot(...rel(run(90)));
  ok(host.camZoom === 1.8 && farD > near * 1.5, 'the wheel moves the chase camera away, up to 1.8 times: ' + near.toFixed(1) + ' → ' + farD.toFixed(1) + ' m');
  host.camZoom = 1;
  host.camMode = 'cockpit';
  host.lookReset();
  const geo = F.Models.carGeo(v.spec.id, v.spec.wing);
  const ahead = host.camera(1 / 60);
  ok(dot([ahead.tx - ahead.x, ahead.tz - ahead.z], fwd) > 9, 'the cockpit view looks ahead with no mouse look');
  host.lookTurn(10, 10);
  ok(host.look.yaw === 2.35 && host.look.pitch === 0.6, 'the head turns up to 135° and looks up to 34° in the cockpit');
  host.lookTurn(-20, -20);
  ok(host.look.yaw === -2.35 && host.look.pitch === -0.7, 'and down to 40°');
  host.lookReset();
  host.lookTurn(-1.2, 0);
  host.look.drag = 1;
  const left = host.camera(1 / 60), dl = [left.tx - left.x, left.tz - left.z];
  ok(dot(dl, right) < -8 && dot(dl, fwd) > 2, 'moving the mouse left turns the head to the left window');
  ok(dot([left.x - ahead.x, left.z - ahead.z], right) < -0.05, 'the eye moves with the head, toward the side it turns to');
  ok(UI.headOffset(0, 0).every(c => Math.abs(c) < 1e-12), 'the eye is at the seat point when looking straight ahead');
  ok([[2.35, 0.6], [-2.35, -0.7], [1.6, 0], [0, -0.7]].every(([a, b]) => Math.hypot(...UI.headOffset(a, b)) < 0.2), 'the head moves the eye less than 20 cm at any angle');
  ok(UI.headOffset(2.3, 0)[0] > 0.12 && UI.headOffset(-2.3, 0)[0] < -0.12 && UI.headOffset(0, -0.7)[2] < -0.05, 'looking over a shoulder leans toward it, looking down moves the head forward');
  const y0 = 0.86 * 600 + 30 - 300;
  ok(UI.mirrorShift(0, 0, 60, 600, y0).every(c => Math.abs(c) < 1e-9), 'the rear-view mirror stays in place when looking ahead');
  const ms = UI.mirrorShift(0.4, 0, 60, 600, y0), mu = UI.mirrorShift(0, 0.3, 60, 600, y0);
  ok(ms[0] < -150 && Math.abs(ms[1]) < 40 && mu[1] < -100 && UI.mirrorShift(1.6, 0, 60, 600, y0) === null, 'the mirror slides against the head turn and is not drawn when looking away');
  ok(host.cabinDriverPart() === 'body', 'a glance to the side keeps the driver body in view');
  host.lookTurn(-0.8, 0);
  ok(host.cabinDriverPart() === null, 'looking back over the shoulder hides the driver body');
  host.keys.back = true;
  host.lookReset();
  host.lookTurn(1, 0.3);
  const back = host.camera(1 / 60), dbk = [back.tx - back.x, back.tz - back.z];
  ok(dot(dbk, fwd) < -9 && Math.abs(back.ty - back.y) < 0.2, 'the look-back key overrides the mouse look');
  host.keys.back = false;
  host.camMode = 'hood';
  host.lookTurn(10, 10);
  ok(host.look.yaw === 1.5 && host.look.pitch === 0.45 && host.cabinDriverPart() === 'all', 'the hood camera turns up to 86° and keeps the driver');
  host.look.drag = null;
  host.lookReset();
  host.camMode = 'chase';
  host.menuOpen = true;
  host.lookDown({ pointerId: 7, button: 0 });
  ok(host.look.drag === null, 'mouse look is off while a menu is open');
  host.menuOpen = false;
  set.mlook = 'off';
  host.lookDown({ pointerId: 7, button: 0 });
  ok(host.look.drag === null, 'mouse look can be switched off in the settings');
  set.mlook = 'hold';
  host.lookDown({ pointerId: 7, button: 1 });
  ok(host.look.drag === null, 'the middle button does not grab the view');
  host.lookDown({ pointerId: 7, button: 0 });
  host.lookMove({ pointerId: 7, movementX: 100, movementY: -50 });
  ok(host.look.drag === 7 && Math.abs(host.look.yaw - 0.45) < 1e-9 && Math.abs(host.look.pitch - 0.225) < 1e-9, 'a drag of 100 px turns the view by 26°');
  set.minv = true;
  set.msens = 2;
  host.lookMove({ pointerId: 7, movementX: 0, movementY: -10 });
  ok(Math.abs(host.look.pitch - (0.225 - 0.09)) < 1e-9, 'sensitivity and vertical inversion apply to the drag');
  host.lookMove({ pointerId: 8, movementX: 500, movementY: 0 });
  ok(Math.abs(host.look.yaw - 0.45) < 1e-9, 'another pointer does not turn the view');
  host.lookUp({ pointerId: 7 });
  ok(host.look.drag === null && host.look.idle === 0, 'releasing the button starts the return timer');
  const ui = read('js/apps/forza/fz-ui.js'), menus = read('js/apps/forza/fz-menus.js'), css = read('css/apps/forza.css');
  ok(['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture', 'dblclick', 'contextmenu', 'wheel'].every(n => ui.includes(`view.addEventListener('${n}'`)) && /this\.lookReset\(\);\n\s+this\.hud\.toast\(\{ chase:/.test(ui), 'the view listens to the mouse, switching the camera resets the look');
  ok(/\['Обзор мышью', 'mlook'/.test(menus) && /'msens'/.test(menus) && /'minv'/.test(menus) && /'mret'/.test(menus) && /<kbd>Мышь<\/kbd> обзор/.test(menus) && /\.fz-looking \.fz-view \{ cursor: none; \}/.test(css), 'mouse look settings, key help and a hidden cursor while looking');
});

section('integration', () => {
  const LINE = String.fromCharCode(47, 47), BLOCK = String.fromCharCode(47, 42);
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/forza/' + f).concat(['js/apps/forza-app.js', 'tests/forza.test.js']);
  for (const f of files) {
    const src = read(f);
    const noStrings = src.replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, '""');
    ok(!noStrings.includes(LINE) && !noStrings.includes(BLOCK), f + ' has no comments');
    ok(!/\/\/ |\/\*/.test(src.replace(/https?:\/\/[^\s'"`]+/g, '')), f + ' has no comments in shaders or templates');
  }
  ok(!read('css/apps/forza.css').includes(BLOCK), 'css has no comments');
  ok(!read('forza.html').includes('<!' + '--'), 'page has no comments');
  const html = read('index.html'), page = read('forza.html');
  let lastA = -1, lastB = -1;
  for (const f of ORDER) {
    const needle = 'js/apps/forza/' + f + '.js';
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'script order ' + f);
    lastA = ia; lastB = ib;
  }
  ok(fs.readdirSync(DIR).filter(f => f.endsWith('.js')).length === ORDER.length, 'every module is loaded');
  ok(html.indexOf('js/apps/forza-app.js') > lastA && html.includes('css/apps/forza.css'), 'desktop loads wrapper and styles');
  const gm = read('js/game-manager.js');
  const at = gm.indexOf('      forza: {');
  const entry = gm.slice(at, at + 3400);
  ok(at > 0 && /steam: true/.test(entry) && /price: 46\.99/.test(entry) && /targetExe: 'FORZA\.EXE'/.test(entry) && /appForza/.test(entry), 'Steam catalog entry');
  ok(!/forzaGranted/.test(gm), 'no grant flag');
  const loadState = gm.slice(gm.indexOf('loadState'), gm.indexOf('moveGamesToSteam(state)'));
  ok(!/'forza'/.test(loadState), 'not preinstalled');
  const shell = {
    'js/desktop.js': ["isInstalled('forza')", 'appForza'],
    'js/taskbar.js': ["isInstalled('forza')", "case 'forza'", "showInSteam('forza')"],
    'js/apps/dialogs.js': ["cmd === 'forza'", "showInSteam(\\'forza\\')"],
    'js/apps/explorer.js': ["item.app === 'forza'", 'FORZA.EXE'],
    'js/filesystem.js': ["gmInstalled.includes('forza')", "'FORZA.EXE'"],
    'js/apps/task-manager.js': ["'app_forza'", 'forza.exe'],
    'js/icons.js': ["'forza': `<svg"],
    'js/apps/clippy.js': ["id.startsWith('app_forza')", "launchProgram('forza', 'appForza')"],
    'js/apps/advanced-site.js': ["id: 'forza'"],
    'js/apps/steam.js': ["game: 'forza'"],
    'js/apps/forza-app.js': ["id = 'app_forza'", 'F.UI(root']
  };
  for (const [f, needles] of Object.entries(shell)) { const src = read(f); for (const n of needles) ok(src.includes(n), f + ' contains ' + n); }
  const i18n = read('js/i18n.js');
  ok((i18n.match(/'app\.forza': 'Forza Horizon: Рига'/g) || []).length === 2 && (i18n.match(/'app\.forza': 'Forza Horizon: Riga'/g) || []).length === 2, 'i18n title in every language');
  ok(/"test:forza": "node tests\/forza\.test\.js"/.test(read('package.json')), 'npm script');
  ok(/'forza'/.test(read('tests/steam.test.js')), 'Steam price test covers the game');
});

console.log('forza: ' + checks + ' checks passed in ' + (Date.now() - t0) + ' ms');
