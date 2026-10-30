const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = 'js/apps/kirill98';
const ORDER = ['ki-core', 'ki-data', 'ki-places', 'ki-terrain', 'ki-flora', 'ki-detail', 'ki-weather', 'ki-edge', 'ki-body', 'ki-combat', 'ki-wounds', 'ki-missile', 'ki-senses', 'ki-move', 'ki-nav', 'ki-beasts', 'ki-ai', 'ki-econ', 'ki-caravan', 'ki-world', 'ki-elves', 'ki-guard', 'ki-villain', 'ki-save', 'ki-gl', 'ki-tex', 'ki-models', 'ki-trees', 'ki-anim', 'ki-render', 'ki-fx', 'ki-audio', 'ki-hud', 'ki-screens', 'ki-ui'];
const NODE = ['ki-core', 'ki-data', 'ki-places', 'ki-terrain', 'ki-flora', 'ki-detail', 'ki-weather', 'ki-edge', 'ki-body', 'ki-combat', 'ki-wounds', 'ki-missile', 'ki-senses', 'ki-move', 'ki-nav', 'ki-beasts', 'ki-ai', 'ki-econ', 'ki-caravan', 'ki-world', 'ki-elves', 'ki-guard', 'ki-villain', 'ki-save', 'ki-tex', 'ki-models', 'ki-trees', 'ki-anim', 'ki-audio', 'ki-screens'];
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const SPname = i => ['сосна', 'ель', 'берёза', 'дуб', 'ольха', 'липа'][Math.floor(i / 3)] + ' ' + ['молодая', 'взрослая', 'старая'][i % 3];
let checks = 0;
const pending = [];
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();

{
  const html = read('kirill98.html'), index = read('index.html');
  let last = -1, lastIndex = -1;
  for (const f of ORDER) {
    const tag = `${DIR}/${f}.js`;
    ok(fs.existsSync(path.join(ROOT, tag)), 'module ' + f);
    const i = html.indexOf(tag), j = index.indexOf(tag);
    ok(i > last, 'kirill98.html loads ' + f + ' in order');
    ok(j > lastIndex, 'index.html loads ' + f + ' in order');
    last = i;
    lastIndex = j;
  }
  ok(index.indexOf('js/apps/kirill98-app.js') > lastIndex, 'index.html loads the window wrapper after the modules');
  ok(index.includes('css/apps/kirill98.css') && html.includes('css/apps/kirill98.css'), 'stylesheet on both pages');
  ok(/"test:kirill98": "node tests\/kirill98\.test\.js"/.test(read('package.json')) && /node tests\/kirill98\.test\.js( |")/.test(read('package.json').split('"test":')[1].split('\n')[0]), 'npm scripts run this test');
}

{
  const game = [...ORDER.map(f => `${DIR}/${f}.js`), 'js/apps/kirill98-app.js', 'kirill98.html', 'css/apps/kirill98.css'];
  for (const f of [...game, 'tools/kirill98-shots.cjs', 'tools/kirill98-bot.cjs', 'tests/kirill98.test.js']) {
    const src = read(f);
    ok(!/\/\*/.test(src), 'no block comments in ' + f);
    ok(!/^\s*\/\/(?!\s*#)/m.test(src) && !/[;{})]\s+\/\/\s/.test(src), 'no line comments in ' + f);
    ok(!/<!-{2}/.test(src), 'no markup comments in ' + f);
    ok(!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(src), 'no control characters in ' + f);
  }
  const texts = game.map(read).join('\n');
  ok(!/Micro[s]oft|Win[d]ows/.test(texts), 'names follow the Microslop and Win rule');
}

for (const f of NODE) require(path.join(ROOT, DIR, f + '.js'));
const K = globalThis.Kirill98, P = K.Places, M = K.METRICS;

{
  ok(K.TITLE === 'Kirill The Game', 'title from the author answer B1');
  const a = K.rng(42), b = K.rng(42), c = K.rng(43);
  const sa = Array.from({ length: 64 }, () => a()), sb = Array.from({ length: 64 }, () => b()), sc = Array.from({ length: 64 }, () => c());
  ok(sa.every((v, i) => v === sb[i]), 'same seed gives the same numbers');
  ok(sa.some((v, i) => v !== sc[i]), 'another seed gives other numbers');
  ok(sa.every(v => v >= 0 && v < 1), 'numbers lie in [0, 1)');
  ok(M.eyeStand === 1.65 && M.eyeCrawl === 0.45 && M.walk === 1.6 && M.run === 4.5 && M.sprint === 6.5, 'body metrics follow plan 5.5');
  ok(M.jumpHeight === 0.9 && M.doorElf === 1.0 && M.doorWide === 1.4 && M.radiusChair === 0.5 && M.ladder === 11, 'space metrics follow plan 5.5');
  ok(K.MAP.size === 1536 && (K.MAP.samples - 1) * K.MAP.step === K.MAP.size, 'map 1536 m, 513 height samples every 3 m');
  const near = (v, w) => v.every((x, i) => Math.abs(x - w[i]) < 1e-9);
  ok(near(K.basis(0, 0).fwd, [0, 0, -1]) && near(K.basis(0, 0).right, [1, 0, 0]) && near(K.basis(0, 0).up, [0, 1, 0]), 'yaw 0 looks north, right hand points east');
  ok(near(K.basis(Math.PI / 2, 0).fwd, [1, 0, 0]) && near(K.basis(Math.PI / 2, 0).right, [0, 0, 1]), 'yaw 90 degrees looks east');
  const view = K.m4.lookAt([0, 1.65, 0], [0, 1.65, -10], [0, 1, 0]);
  const vp = K.m4.multiply(K.m4.perspective(Math.PI / 2, 4 / 3, 0.1, 1000), view);
  const ahead = K.m4.transform(vp, [0, 1.65, -10, 1]);
  ok(Math.abs(ahead[0] / ahead[3]) < 1e-6 && Math.abs(ahead[1] / ahead[3]) < 1e-6 && Math.abs(ahead[2] / ahead[3]) < 1, 'a point straight ahead lands in the screen centre');
  ok(K.m4.transform(vp, [5, 1.65, -10, 1])[0] > 0, 'a point to the east lands on the right half');
  ok(K.m4.transform(vp, [0, 1.65, 10, 1])[3] < 0, 'a point behind the camera has negative w');
  const noon = K.daylight(13.5), midnight = K.daylight(0), dawn = K.daylight(6.5), evening = K.daylight(20.6);
  ok(noon.sunDir[1] > 0.8 && noon.night === 0 && noon.fogFar === 900, 'sun high at 13:30, full daylight');
  ok(midnight.sunDir[1] < 0 && midnight.moonDir[1] > 0 && midnight.night === 1 && midnight.fogFar === 420, 'night at midnight: moon up, fog closer');
  ok(dawn.sunDir[0] > 0.9 && evening.sunDir[0] < -0.9, 'sun rises in the east and sets in the west');
  ok(K.daylight(12).sunDir[2] > 0, 'midday sun stands in the south');
  ok(dawn.dusk > 0.3 && noon.dusk === 0, 'warm light near sunrise only');
}

const T = K.Terrain.build();
const F = K.Flora.build(T);
const W = K.Move.world(T, F);

{
  const T2 = K.Terrain.build();
  let same = true;
  for (let i = 0; i < T.H.length; i += 97) if (T.H[i] !== T2.H[i]) { same = false; break; }
  ok(same, 'terrain is the same for the same seed');
  ok(T.H.every(Number.isFinite), 'no broken heights');
  for (const s of P.SPOTS) {
    const h = T.heightAt(s.node[0], s.node[1]);
    ok(Math.abs(h - s.h) <= 3, `${s.name}: height ${h.toFixed(1)} m, plan ${s.h} m`);
    ok(s.zones.includes(T.zoneAt(s.node[0], s.node[1])), `${s.name} lies in zone ${s.zones.join('/')}`);
  }
  ok(T.zoneAt(752, 760) === 3 && T.zoneAt(778, 760) === 2, 'the river parts the elf forest from the emperor lands');
  ok(T.zoneAt(840, 1325) === 1 && T.zoneAt(960, 105) === 4 && T.zoneAt(330, 700) === 3 && T.zoneAt(1230, 640) === 2, 'zones 1 to 4 as in the letter');
  const fordLevel = T.levelAt(T.fordS), fordBed = T.heightAt(760, 760);
  ok(fordLevel - fordBed <= 0.8 && fordLevel - fordBed > 0.4, 'the ford is knee deep');
  for (const z of [900, 1100, 1250, 1420]) {
    const x = T.riverX(z);
    ok(T.waterAt(x, z) - T.heightAt(x, z) > 1.25, 'the river is deep enough to swim at z ' + z);
  }
  ok(Math.abs(T.deckTop - T.heightAt(752, 1325)) <= M.step && Math.abs(T.deckTop - T.heightAt(790, 1325)) <= M.step, 'the bridge deck meets both banks within one step');
}

{
  const hairpinRange = 14;
  for (const r of P.ROADS) {
    const kind = P.KINDS[r.kind];
    ok(!!kind, 'known kind for ' + r.id);
    if (kind.deck || kind.wet) continue;
    const prof = T.profiles[r.id], line = prof.line, hair = prof.landings.map(l => l.s);
    const limit = kind.cart ? 12 : r.kind === 'goat' ? 30 : 20;
    let maxG = 0, maxHair = 0, maxCut = 0, prev = null, prevHair = null;
    for (let s = 0; s <= line.length; s += 1) {
      const p = K.Terrain.pointAt(line, s), h = T.heightAt(p.x, p.z);
      const inHair = hair.some(v => Math.abs(v - s) <= hairpinRange);
      if (inHair) {
        if (prevHair !== null) maxHair = Math.max(maxHair, Math.atan(Math.abs(h - prevHair)) * 180 / Math.PI);
        prevHair = h;
        prev = null;
        continue;
      }
      prevHair = null;
      maxCut = Math.max(maxCut, Math.abs(h - T.natural(p.x, p.z)));
      if (prev !== null) maxG = Math.max(maxG, Math.atan(Math.abs(h - prev)) * 180 / Math.PI);
      prev = h;
    }
    ok(maxG <= limit, `${r.name}: grade ${maxG.toFixed(1)} deg, limit ${limit}`);
    ok(maxHair <= 30, `${r.name}: hairpin turns stay walkable (${maxHair.toFixed(1)} deg)`);
    ok(maxCut <= 8, `${r.name}: cut or fill ${maxCut.toFixed(1)} m`);
  }
  ok(P.KINDS.tract.width === M.tract && P.KINDS.road.width === M.road && P.KINDS.trail.width === M.trail, 'road widths follow plan 5.5');
  ok(P.KINDS.road.width >= 2 * M.cart + 0.5, 'two carts pass each other on a road');
}

{
  const gates = Object.fromEntries(P.WALLS.flatMap(w => w.gates).map(g => [g.id, g.width]));
  ok(gates['palace-gate'] >= M.cart + 2 && gates['fort-gate'] >= M.cart + 2, 'carts fit through the palace and fort gates');
  ok(gates['palace-postern'] >= M.doorWide && gates['fort-postern'] >= M.doorWide, 'posterns are wide doors');
  ok(Object.values(gates).every(w => w >= M.doorWide), 'every gate lets a person through');
  const walls = W.boxes.filter(b => b.wall);
  for (const w of P.WALLS) {
    for (const g of w.gates) {
      const [x0, z0, x1, z1] = w.rect, along = g.side === 'n' || g.side === 's';
      const gx = along ? g.at : g.side === 'w' ? x0 + w.thick / 2 : x1 - w.thick / 2;
      const gz = along ? (g.side === 'n' ? z0 + w.thick / 2 : z1 - w.thick / 2) : g.at;
      const blocked = walls.some(b => b.wall === w.id && Math.abs(gx - b.x) < b.hw + 0.05 && Math.abs(gz - b.z) < b.hd + 0.05);
      ok(!blocked, `gate ${g.id} is open in the wall`);
    }
  }
  const solid = W.boxes.filter(b => !b.wall && !b.deck && !b.onDeck);
  for (const r of P.ROADS) {
    const kind = P.KINDS[r.kind], line = K.Terrain.polyline(r.pts);
    let hit = null;
    for (let s = 0; s <= line.length && !hit; s += 1) {
      const p = K.Terrain.pointAt(line, s), g = T.heightAt(p.x, p.z);
      for (const b of W.near(p.x, p.z, kind.width)) {
        if (b.wall || b.deck || b.onDeck || b.y1 < g + 0.4 || b.y0 > g + 2 || b.y1 < g + 0.8) continue;
        const dx = p.x - b.x, dz = p.z - b.z, u = dx * b.c + dz * b.s, v = -dx * b.s + dz * b.c;
        const du = Math.max(0, Math.abs(u) - b.hw), dv = Math.max(0, Math.abs(v) - b.hd);
        if (Math.hypot(du, dv) < kind.width / 2) { hit = b.id || b.kind; break; }
      }
    }
    ok(!hit, `${r.name} is free of buildings (${hit})`);
  }
  ok(solid.length > 80 && W.boxes.length > 120, 'the valley has its grey boxes');
}

const flat = (extra) => {
  const boxes = (extra || []).map(b => K.Move.resolveBox(b, { heightAt: () => 0, deckTop: 0 }));
  const terr = { heightAt: () => 0, normalAt: () => [0, 1, 0], waterAt: () => -Infinity, flowAt: () => [0, 0], SIZE: 200 };
  return {
    terrain: terr, boxes, ladders: [],
    near: () => boxes,
    groundAt: (x, z, reach) => {
      let g = 0;
      for (const b of boxes) {
        const dx = x - b.x, dz = z - b.z, u = dx * b.c + dz * b.s, v = -dx * b.s + dz * b.c;
        if (Math.abs(u) <= b.hw + 0.05 && Math.abs(v) <= b.hd + 0.05 && b.y1 > g && b.y1 <= reach) g = b.y1;
      }
      return g;
    }
  };
};
const run = (Wd, b, inp, seconds) => {
  for (let t = 0; t < seconds; t += 1 / 60) K.Move.step(b, Object.assign({ fwd: 0, side: 0, yaw: b.yaw }, typeof inp === 'function' ? inp(t) : inp), 1 / 60, Wd);
  return b;
};

{
  const Wf = flat();
  const b = K.Move.body(Wf, 100, 100, 0);
  let peak = 0;
  K.Move.step(b, { fwd: 0, side: 0, yaw: 0, jump: true }, 1 / 60, Wf);
  for (let i = 0; i < 90; i++) { K.Move.step(b, { fwd: 0, side: 0, yaw: 0 }, 1 / 60, Wf); peak = Math.max(peak, b.pos[1]); }
  ok(Math.abs(peak - M.jumpHeight) < 0.05, `jump reaches ${peak.toFixed(2)} m`);
  const r = K.Move.body(Wf, 100, 190, 0);
  run(Wf, r, { fwd: 1 }, 1.5);
  ok(Math.abs(r.speed - M.run) < 0.05, `run speed ${r.speed.toFixed(2)} m/s`);
  const z0 = r.pos[2];
  K.Move.step(r, { fwd: 1, side: 0, yaw: 0, jump: true }, 1 / 60, Wf);
  let steps = 0;
  while (!r.onGround && steps < 200) { K.Move.step(r, { fwd: 1, side: 0, yaw: 0 }, 1 / 60, Wf); steps++; }
  const len = z0 - r.pos[2];
  ok(len > 2.4 && len < 2.9, `running jump covers ${len.toFixed(2)} m`);
  const s = K.Move.body(Wf, 100, 190, 0);
  run(Wf, s, { fwd: 1, sprint: true }, 1.5);
  ok(Math.abs(s.speed - M.sprint) < 0.1 && s.stamina < 90, 'sprint is faster and spends stamina');
  let spent = 0;
  while (!s.tired && spent < 15) { K.Move.step(s, { fwd: 1, side: 0, yaw: 0, sprint: true }, 1 / 60, Wf); spent += 1 / 60; }
  run(Wf, s, { fwd: 1, sprint: true }, 0.5);
  ok(s.tired && spent > 7 && spent < 10 && Math.abs(s.speed - M.run) < 0.1, `after ${spent.toFixed(1)} s of sprint the hero is out of breath and runs`);
  run(Wf, s, { fwd: 1, sprint: true }, 2.5);
  ok(!s.tired && Math.abs(s.speed - M.sprint) < 0.1, 'rested a little, the hero can sprint again');
  const c = K.Move.body(Wf, 100, 190, 0);
  K.Move.step(c, { fwd: 0, side: 0, yaw: 0, crouch: true }, 1 / 60, Wf);
  run(Wf, c, { fwd: 1 }, 1.5);
  ok(c.crouch && Math.abs(c.speed - M.walk) < 0.05 && c.eye < 1.2, 'crouching walks slowly with the eyes low');
  const wk = K.Move.body(Wf, 100, 190, 0);
  K.Move.step(wk, { fwd: 0, side: 0, yaw: 0, walk: true }, 1 / 60, Wf);
  run(Wf, wk, { fwd: 1 }, 1.5);
  ok(Math.abs(wk.speed - M.walk) < 0.05, 'walking pace 1.6 m/s');
}

{
  const tryBox = (h, jumpAt) => {
    const Wb = flat([{ x: 100, z: 100, w: 8, d: 1, h, kind: 'stone' }]);
    const b = K.Move.body(Wb, 100, 106, 0);
    let jumped = false;
    for (let t = 0; t < 4; t += 1 / 60) {
      const jump = !jumped && b.pos[2] < 100.5 + jumpAt;
      if (jump) jumped = true;
      K.Move.step(b, { fwd: 1, side: 0, yaw: 0, jump }, 1 / 60, Wb);
    }
    return b.pos[2] < 99;
  };
  ok([1.0, 1.3, 1.6].some(d => tryBox(0.8, d)), 'a running jump clears an obstacle of 0.8 m');
  ok(![0.6, 0.9, 1.2, 1.5, 1.8].some(d => tryBox(1.3, d)), 'an obstacle of 1.3 m stops the hero');
  const stepUp = h => {
    const Wb = flat([{ x: 100, z: 95, w: 8, d: 10, h, kind: 'stone' }]);
    const b = K.Move.body(Wb, 100, 106, 0);
    run(Wb, b, { fwd: 1 }, 3);
    return b.pos[2] < 99;
  };
  ok(stepUp(0.3) && !stepUp(0.5), 'steps up to 0.35 m are climbed without a jump');
  const swimW = flat();
  swimW.terrain.waterAt = () => 2;
  const sw = K.Move.body(swimW, 100, 190, 0);
  run(swimW, sw, { fwd: 1 }, 3);
  ok(sw.swim && Math.abs(sw.speed - 1.2) < 0.05 && Math.abs(sw.pos[1] + sw.eye - 2.2) < 0.15, 'deep water: the hero swims at 1.2 m/s with the head above water');
  const wadeW = flat();
  wadeW.terrain.waterAt = () => 0.7;
  const wd = K.Move.body(wadeW, 100, 190, 0);
  run(wadeW, wd, { fwd: 1 }, 2);
  ok(!wd.swim && wd.wade > 0 && wd.speed < M.run * 0.85, 'knee deep water slows the hero down');
}

{
  for (const L of W.ladders) ok(L.y1 - L.y0 > 6, `ladder at ${L.x.toFixed(0)},${L.z.toFixed(0)} leads ${(L.y1 - L.y0).toFixed(1)} m up`);
  const L = W.ladders[0];
  const b = K.Move.body(W, L.x, L.z, Math.atan2(L.fx, -L.fz));
  K.Move.step(b, { fwd: 0, side: 0, yaw: b.yaw, use: true }, 1 / 60, W);
  ok(!!b.ladder, 'E takes the ladder');
  const need = (L.y1 - L.y0) / 1.4;
  run(W, b, { fwd: 1, yaw: b.yaw }, need + 0.5);
  ok(!b.ladder && Math.abs(b.pos[1] - L.y1) < 0.05, `climbed onto the palace wall at ${L.y1.toFixed(1)} m`);
  run(W, b, { fwd: 0, yaw: b.yaw }, 1);
  ok(Math.abs(b.pos[1] - L.y1) < 0.05, 'the wall top holds the hero');
}

{
  const tr = F.trees, SP = K.Flora.SPECIES;
  ok(F.zoneCount[3] >= 30000 && F.zoneCount[3] <= 40000, `elf forest holds ${F.zoneCount[3]} trees`);
  const others = F.zoneCount[1] + F.zoneCount[2] + F.zoneCount[4];
  ok(others >= 5000 && others <= 8000, `other zones hold ${others} trees`);
  ok(SP.length === 6 && K.Flora.VARIANTS === 18 && SP.map(s => s.name).join() === 'Сосна,Ель,Берёза,Дуб,Ольха,Липа', 'six species from plan 11.4, three growth variants each');
  const per = SP.map(() => 0);
  for (let i = 0; i < tr.count; i++) per[Math.floor(tr.V[i] / 3)]++;
  ok(per.every(n => n > 1500), 'every species grows in the valley: ' + per.join(' '));
  const F2 = K.Flora.build(K.Terrain.build());
  let same = F2.trees.count === tr.count;
  for (let i = 0; i < 300 && same; i++) same = F2.trees.X[i] === tr.X[i] && F2.trees.Z[i] === tr.Z[i] && F2.trees.V[i] === tr.V[i];
  ok(same, 'the same seed grows the same forest');
  let wet = 0, high = 0, steep = 0, close = 0;
  for (let i = 0; i < tr.count; i++) {
    const x = tr.X[i], z = tr.Z[i], g = T.heightAt(x, z);
    if (T.waterAt(x, z) > g) wet++;
    if (g > 185) high++;
    if (T.normalAt(x, z)[1] < 0.75) steep++;
    F.trunksNear(x, z, 1.7, j => { if (j !== i && Math.hypot(tr.X[j] - x, tr.Z[j] - z) < 1.7) close++; });
  }
  ok(!wet && !high && !steep, `no trees in water (${wet}), above 185 m (${high}) or on cliffs (${steep})`);
  ok(!close, 'trunks stand at least 1.7 m apart');
  for (const r of P.ROADS) {
    const line = K.Terrain.polyline(r.pts), half = P.KINDS[r.kind].width / 2;
    let hit = 0;
    for (let s = 0; s <= line.length; s += 1) {
      const p = K.Terrain.pointAt(line, s);
      F.trunksNear(p.x, p.z, half + 1.1, i => { if (Math.hypot(tr.X[i] - p.x, tr.Z[i] - p.z) < half + 1.1) hit++; });
    }
    ok(!hit, `${r.name} is free of trunks`);
  }
  let built = 0;
  for (const b of W.boxes) {
    if (b.id && b.id.startsWith('prop-')) continue;
    F.trunksNear(b.x, b.z, Math.hypot(b.hw, b.hd) + 2, i => {
      const dx = tr.X[i] - b.x, dz = tr.Z[i] - b.z, u = dx * b.c + dz * b.s, v = -dx * b.s + dz * b.c;
      if (Math.abs(u) < b.hw + 1.5 && Math.abs(v) < b.hd + 1.5) built++;
    });
  }
  ok(!built, 'no tree grows through a building');
  const rays = K.rng(5);
  let sum = 0, n = 0;
  for (const r of P.ROADS.filter(q => q.kind === 'trail' && q.id.startsWith('korni'))) {
    const line = K.Terrain.polyline(r.pts);
    for (let s = 20; s < line.length - 20 && n < 1000; s += 1) {
      const p = K.Terrain.pointAt(line, s);
      if (F.densityAt(p.x + 14, p.z) < 0.45 && F.densityAt(p.x - 14, p.z) < 0.45) continue;
      const a = rays() * Math.PI * 2;
      sum += F.sight(p.x, p.z, M.eyeStand, Math.sin(a), Math.cos(a), 80);
      n++;
    }
  }
  ok(n >= 600 && sum / n >= 15 && sum / n <= 30, `in the thicket the view ends at ${(sum / n).toFixed(1)} m on average (${n} rays)`);
  const U = F.under;
  let bushes = 0, onRoad = 0;
  for (let i = 0; i < U.count; i++) {
    if (U.KIND[i] === 1) bushes++;
    if (F.edgeAt(U.X[i], U.Z[i]) < 0.8) onRoad++;
  }
  ok(U.count > 25000 && bushes > 6000 && !onRoad, `undergrowth: ${U.count} plants, ${bushes} bushes, none on roads`);
}

{
  const R = 40, B = K.Flora.BAND;
  ok(K.Flora.fade(R - B - 1, R) === 1 && K.Flora.fade(R, R) === 0 && K.Flora.fade(R + 5, R) === 0, '3D up to R - 6 m, picture from R');
  let mono = true, step = 0;
  for (let d = 20; d < 60; d += 0.5) {
    const a = K.Flora.fade(d, R), b = K.Flora.fade(d + 0.5, R);
    if (b > a) mono = false;
    step = Math.max(step, a - b);
  }
  ok(mono && step <= 0.09, 'the picture dissolves into the model smoothly: at most ' + Math.round(step * 100) + ' % per half metre');
  const tr = F.trees, C = K.Flora.CELL, pad = C * 0.71 + 2, rnd = K.rng(11);
  let missing = 0;
  for (let k = 0; k < 300; k++) {
    const x = 200 + rnd() * 500, z = 420 + rnd() * 700;
    for (const radius of [25, 40, 60]) {
      const cx = Math.floor(x / C), cz = Math.floor(z / C), have = new Set();
      for (const c of F.nearCells((cx + 0.5) * C, (cz + 0.5) * C, radius + pad)) for (let q = tr.cells.start[c]; q < tr.cells.start[c + 1]; q++) have.add(tr.cells.list[q]);
      F.trunksNear(x, z, radius, i => { if (Math.hypot(tr.X[i] - x, tr.Z[i] - z) < radius && !have.has(i)) missing++; });
    }
  }
  ok(!missing, 'every tree closer than the radius is in the 3D list of the camera cell');
  let total = 0;
  for (let c = 0; c < tr.cells.start.length - 1; c++) total += tr.cells.start[c + 1] - tr.cells.start[c];
  ok(total === tr.count, 'each tree sits in exactly one 32 m cell');
  const models = K.Trees.models(), elder = K.Trees.elderModel();
  models.forEach((m, i) => ok(m.tris >= 60 && m.tris <= 450, `${SPname(i)}: ${m.tris} triangles`));
  ok(elder.tris <= 1200 && elder.height > 40, `Elder Oak: ${elder.tris} triangles, ${elder.height.toFixed(0)} m`);
  ok(models.length * K.Trees.FRAMES <= (K.Trees.ATLAS_W / K.Trees.FRAME_W) * (K.Trees.ATLAS_H / K.Trees.FRAME_H), 'all 144 pictures fit the atlas');
  ok(models.every(m => { const [w, h] = K.Trees.frameSize(m); return Math.abs(h - 2 * w) < 1e-9 && h >= m.height && w >= 2 * m.radius; }), 'every picture frame holds its whole tree at 1:2');
  const draws = models.length + 1 + 2 + 1;
  ok(draws <= 40, `the forest takes ${draws} draw calls`);
  const any = 1234, x0 = tr.X[any], z0 = tr.Z[any], b = K.Move.body(W, x0, z0 + 3, 0);
  for (let k = 0; k < 180; k++) K.Move.step(b, { fwd: 1, side: 0, yaw: Math.atan2(x0 - b.pos[0], -(z0 - b.pos[2])) }, 1 / 60, W);
  ok(Math.hypot(b.pos[0] - x0, b.pos[2] - z0) >= tr.RAD[any] + M.radiusBody - 0.02, 'a trunk stops the hero');
  ok(Math.hypot(b.pos[0] - F.elder.x, b.pos[2] - F.elder.z) > 0 && F.elder.r === 2, 'the Elder Oak trunk is 4 m wide');
}

{
  const key = p => p[0].toFixed(1) + ',' + p[1].toFixed(1);
  const nodes = new Map(), edges = new Map();
  const node = p => { const k = key(p); if (!nodes.has(k)) { nodes.set(k, p); edges.set(k, []); } return k; };
  for (const r of P.ROADS) {
    for (let i = 0; i < r.pts.length - 1; i++) {
      const a = node(r.pts[i]), b = node(r.pts[i + 1]), len = Math.hypot(r.pts[i + 1][0] - r.pts[i][0], r.pts[i + 1][1] - r.pts[i][1]);
      edges.get(a).push([b, len]);
      edges.get(b).push([a, len]);
    }
  }
  const route = (from, to) => {
    const s = key(from), e = key(to), dist = new Map([[s, 0]]), prev = new Map(), open = new Set([s]);
    while (open.size) {
      let u = null;
      for (const k of open) if (u === null || dist.get(k) < dist.get(u)) u = k;
      open.delete(u);
      if (u === e) break;
      for (const [v, w] of edges.get(u)) {
        const d = dist.get(u) + w;
        if (!dist.has(v) || d < dist.get(v)) { dist.set(v, d); prev.set(v, u); open.add(v); }
      }
    }
    if (!dist.has(e)) return null;
    const out = [];
    for (let k = e; k; k = prev.get(k)) out.unshift(nodes.get(k));
    return out;
  };
  const walk = pts => {
    const line = K.Terrain.polyline(pts), b = K.Move.body(W, pts[0][0], pts[0][1], 0);
    let t = 0, best = 0, mark = 0, markT = 0;
    while (t < 1800) {
      const n = K.Terrain.nearest(line, b.pos[0], b.pos[2]);
      best = Math.max(best, n.s);
      if (line.length - best < 1.5) return { t, stuck: false };
      const target = K.Terrain.pointAt(line, Math.min(line.length, n.s + 3));
      K.Move.step(b, { fwd: 1, side: 0, jump: b.onGround && b.speed < 1 && t > 0.5, yaw: Math.atan2(target.x - b.pos[0], -(target.z - b.pos[2])) }, 1 / 60, W);
      t += 1 / 60;
      if (t - markT > 4) {
        if (best - mark < 1) return { t, stuck: true, at: b.pos.map(v => v.toFixed(0)).join(',') };
        mark = best;
        markT = t;
      }
    }
    return { t, stuck: true };
  };
  const spot = id => Array.isArray(id) ? id : P.SPOTS.find(s => s.id === id).node;
  for (const r of P.ROUTES) {
    const pts = route(spot(r.from), spot(r.to));
    ok(!!pts, 'route exists: ' + (r.name || r.from + ' -> ' + r.to));
    const res = walk(pts);
    ok(!res.stuck, `${r.name || r.from + ' -> ' + r.to}: the bot does not get stuck (${res.at || ''})`);
    ok(Math.abs(res.t / r.time - 1) <= 0.2, `${r.name || r.from + ' -> ' + r.to}: ${res.t.toFixed(0)} s, plan ${r.time} s`);
  }
  for (const s of P.SPOTS.slice(1)) {
    const pts = route(P.SPOTS[0].node, s.node);
    ok(!!pts, 'road to ' + s.name);
    ok(!walk(pts).stuck, 'the bot reaches ' + s.name);
  }
}

{
  const marks = P.LANDMARKS.map(L => ({ x: L.at[0], z: L.at[1], y: T.heightAt(L.at[0], L.at[1]) + L.top }));
  const los = (ax, ay, az, m) => {
    const d = Math.hypot(m.x - ax, m.z - az), n = Math.ceil(d / 4);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (T.heightAt(ax + (m.x - ax) * t, az + (m.z - az) * t) > ay + (m.y - ay) * t) return false;
    }
    return true;
  };
  const blind = [];
  for (const r of P.ROADS) {
    const line = K.Terrain.polyline(r.pts);
    for (let s = 0; s <= line.length; s += 25) {
      const p = K.Terrain.pointAt(line, s), y = T.heightAt(p.x, p.z) + M.eyeStand;
      if (!marks.some(m => Math.hypot(m.x - p.x, m.z - p.z) <= K.daylight(12).fogFar && los(p.x, y, p.z, m))) blind.push(r.id + '@' + p.x.toFixed(0) + ',' + p.z.toFixed(0));
    }
  }
  ok(!blind.length, 'a landmark is visible from every road point: ' + blind.slice(0, 5).join(' '));
  ok(new Set(P.LANDMARKS.flatMap(L => L.lights.map(g => g.color.join()))).size >= 4, 'each side lights its landmark in its own colour');
}

const B = K.Body, A = K.Anim, Mo = K.Models, Sv = K.Save, Dt = K.Data, C0 = K.Combat;
const groundClear = (kit, frames, Tr) => {
  let min = Infinity, max = -Infinity, torso = Infinity;
  for (const [part, a, e, r] of B.capsules(kit, frames)) {
    let low = Infinity;
    for (let s = 0; s <= 4; s++) {
      const x = a[0] + (e[0] - a[0]) * s / 4, y = a[1] + (e[1] - a[1]) * s / 4, z = a[2] + (e[2] - a[2]) * s / 4;
      low = Math.min(low, y - r - Tr.heightAt(x, z));
    }
    min = Math.min(min, low);
    max = Math.max(max, low);
    if (part === 1 || part === 2) torso = Math.min(torso, low);
  }
  return { min, max, torso };
};

{
  for (const [id, S] of Object.entries(Dt.SIDES)) {
    ok(S.figures.every(f => typeof S.name[f] === 'string'), `${id}: a name for every figure`);
    ok(S.armor.every(([a]) => Dt.ITEMS[a] && Dt.ITEMS[a].kind === 'armor') && S.pros.every(([part, kind]) => Dt.ITEMS[Dt.PROS[part + '.' + kind]]), `${id}: armour and prostheses are known items`);
    ok(Dt.SACKS[id].every(([item, lo, hi]) => Dt.ITEMS[item] && lo <= hi), `${id}: sack goods are known items`);
    const ochre = c => c[0] > 0.55 && c[1] > 0.35 && c[1] < 0.8 * c[0] && c[2] < 0.45 * c[0];
    ok(![...S.main, ...S.accent].some(ochre), `${id}: no ochre clothes, ochre marks only what can be used (plan 5.5)`);
  }
  ok(Object.values(Dt.HELMS).every(h => Dt.ITEMS[h].kind === 'armor') && Object.values(Dt.PROS).every(p => Dt.ITEMS[p].kind === 'prosthesis'), 'helmets and prostheses map to items');
  ok(Dt.ITEMS.ironArm.name === 'Железная рука' && Dt.ITEMS.peg.name === 'Деревяшка' && Dt.ITEMS.helmClosed.name === 'Закрытый шлем', 'item names follow plan 6.3 and 6.7');
}

{
  ok(B.PARTS.length === 11 && B.PART_NAMES.join() === 'голова,грудь,живот,левое плечо,правое плечо,левое предплечье,правое предплечье,левое бедро,правое бедро,левая голень,правая голень', 'eleven body parts from plan 6.2');
  const kits = Object.values(B.HEROES).map(h => h.kit);
  const rnd = K.rng(77);
  let worst = 0;
  for (let k = 0; k < 200; k++) {
    const kit = kits[k % kits.length], fig = B.figure(kit), p = B.restPose();
    for (const key of B.POSE_KEYS) p[key] = (rnd() - 0.5) * 1.6;
    p.plant = rnd() < 0.5;
    const f = B.fk(fig, p, [rnd() * 100, rnd() * 10, rnd() * 100], rnd() * 6), g = B.framesFrom(B.particles(fig, f));
    for (let i = 0; i < 132; i++) worst = Math.max(worst, Math.abs(f[i] - g[i]));
  }
  ok(worst < 1e-3, `joint points give back the pose of every part (error ${worst.toExponential(1)})`);
  const rest = B.fk(B.figure(kits[0]), B.restPose(), [0, 0, 0], 0);
  let ident = true;
  for (let i = 0; i < 11; i++) for (let j = 0; j < 9; j++) if (Math.abs(rest[i * 12 + j] - (j % 4 === 0 ? 1 : 0)) > 1e-6) ident = false;
  ok(ident, 'in the rest pose every part keeps the axes of the body');
  const top = kit => { const f = B.fk(B.figure(kit), B.restPose(), [0, 0, 0], 0); return f[10] + B.figure(kit).sy * 0.31; };
  ok(Math.abs(top(B.HEROES['guard.m'].kit) - M.heightHuman) < 0.03 && Math.abs(top(B.HEROES['elf.m'].kit) - M.heightElf) < 0.04, `a guard stands ${top(B.HEROES['guard.m'].kit).toFixed(2)} m, an elf ${top(B.HEROES['elf.m'].kit).toFixed(2)} m (plan 5.5)`);
  ok(top(B.HEROES['guard.f'].kit) < top(B.HEROES['guard.m'].kit) - 0.05, 'women are shorter than men');
}

{
  const kit = B.HEROES['guard.m'].kit, fig = B.figure(kit), a = A.state();
  const mv = { speed: 0, onGround: true, crouch: false, swim: false, ladder: null, vel: [0, 0, 0], pos: [0, 0, 0] };
  const sample = (speed, crouch, n) => {
    mv.speed = speed;
    mv.crouch = crouch;
    for (let i = 0; i < 90; i++) A.update(a, mv, 1 / 60);
    const out = [];
    for (let i = 0; i < n; i++) {
      A.update(a, mv, 1 / 60);
      const f = B.fk(fig, A.pose(a, kit), [0, 0, 0], 0), q = B.particles(fig, f);
      let sole = Infinity;
      for (const part of [9, 10]) for (const z of [0.045, -0.17]) sole = Math.min(sole, f[part * 12 + 10] + f[part * 12 + 4] * -0.5 + f[part * 12 + 7] * z);
      out.push({ head: q[1], lead: q[13 * 3 + 2] - q[14 * 3 + 2], sole, lean: q[15 * 3 + 2], finite: Array.from(f).every(Number.isFinite) });
    }
    return out;
  };
  for (const [name, speed] of [['walk', M.walk], ['run', M.run], ['sprint', M.sprint]]) {
    const s = sample(speed, false, 90);
    ok(s.every(x => x.finite && Math.abs(x.sole) < 0.02), `${name}: feet stay on the ground`);
    ok(s.some(x => x.lead > 0.15) && s.some(x => x.lead < -0.15), `${name}: the legs take turns`);
  }
  const lean = speed => sample(speed, false, 30).reduce((m, x) => m + x.lean, 0) / 30;
  ok(lean(M.run) < lean(M.walk) - 0.03, 'a runner leans forward more than a walker');
  const cr = sample(0, true, 10);
  ok(cr.every(x => x.head > 1.05 && x.head < 1.25 && Math.abs(x.sole) < 0.02), `crouching brings the head down to ${cr[0].head.toFixed(2)} m (eyes at ${M.eyeCrouch} m)`);
  mv.crouch = false;
  mv.onGround = false;
  mv.vel = [0, 2, 0];
  for (let i = 0; i < 30; i++) A.update(a, mv, 1 / 60);
  const jp = A.pose(a, kit);
  ok(jp.lKnee > 0.6 && jp.rKnee > 0.4 && jp.plant < 0.1, 'in a jump the knees bend and the feet leave the ground');
  mv.onGround = true;
  for (const [id, h] of Object.entries(B.HEROES)) {
    const hands = A.firstPerson(a, h.kit, { eye: [0, 1.65, 0], yaw: 0, pitch: 0 }).frames;
    const inst = Mo.pack([{ kit: h.kit, frames: hands }], { parts: [3, 4, 5, 6] });
    const keys = Mo.look(h.kit).filter(([, p]) => p >= 3 && p <= 6).map(([k]) => k);
    ok(inst.n === keys.length && hands[5 * 12 + 11] < -0.2 && hands[6 * 12 + 11] < -0.2, `${h.name}: both arms are drawn in front of the eyes`);
    if (id === 'villain') ok(keys.includes('fore.iron'), 'the villain sees his iron left arm');
  }
}

{
  const pick = [];
  for (let z = 60; z < 1500 && pick.length < 100; z += 41) {
    for (let x = 60; x < 1500 && pick.length < 100; x += 53) {
      const n = T.normalAt(x, z), deg = Math.acos(n[1]) * 180 / Math.PI, g = T.heightAt(x, z);
      if (deg < 8 || deg > 30 || T.waterAt(x, z) > g - 2) continue;
      let busy = W.near(x, z, 4).length > 0;
      F.trunksNear(x, z, 3, () => { busy = true; });
      if (Math.hypot(x - F.elder.x, z - F.elder.z) < 12) busy = true;
      if (!busy) pick.push([x, z, deg]);
    }
  }
  ok(pick.length === 100, 'one hundred free slopes from 8 to 30 degrees across the valley');
  const rnd = K.rng(2024), sides = Object.keys(Dt.SIDES), t1 = Date.now();
  let sink = 0, hang = 0, loose = 0, late = 0, broken = 0, slow = 0, steps = 0, zones = new Set();
  for (const [i, [x, z]] of pick.entries()) {
    zones.add(T.zoneAt(x, z));
    const kit = B.kit(sides[i % 4], null, rnd), fig = B.figure(kit), a = A.state();
    const mv = { speed: [0, M.walk, M.run][i % 3], onGround: true, crouch: i % 7 === 0, swim: false, ladder: null, vel: [0, 0, 0], pos: [x, T.heightAt(x, z), z] };
    for (let k = 0; k < 40; k++) A.update(a, mv, 1 / 60);
    const yaw = rnd() * Math.PI * 2, f = B.fk(fig, A.pose(a, kit), mv.pos, yaw);
    const ang = rnd() * Math.PI * 2, push = [Math.sin(ang) * (1 + rnd() * 2), 0.2, -Math.cos(ang) * (1 + rnd() * 2)];
    const body = B.fall(kit, f, { id: i + 1, vel: [Math.sin(yaw) * mv.speed, 0, -Math.cos(yaw) * mv.speed], push });
    while (!body.frozen) { B.simulate(body, 1 / 60, W); steps++; }
    const c = groundClear(kit, body.frames, T);
    if (c.min < -0.05) sink++;
    if (c.torso > 0.08 || c.min > 0.04) hang++;
    if (c.max > 0.6) loose++;
    if (body.t >= 5) late++;
    if (body.still < 0.2) slow++;
    const fr = B.figure(kit);
    for (const [p, q, len] of fr.pairs) {
      const d = Math.hypot(body.pts[p * 3] - body.pts[q * 3], body.pts[p * 3 + 1] - body.pts[q * 3 + 1], body.pts[p * 3 + 2] - body.pts[q * 3 + 2]);
      if (Math.abs(d - len) > 0.015) { broken++; break; }
    }
  }
  ok(zones.size >= 3, 'the slopes lie in ' + zones.size + ' zones');
  ok(!sink, `no body sinks into the slope deeper than 5 cm (${sink})`);
  ok(!hang && !loose, `every body lies on the ground: torso touches it (${hang} hanging), no part sticks up over 60 cm (${loose})`);
  ok(!late && !slow, `every body comes to rest before the 5 s limit (${late} late, ${slow} still moving)`);
  ok(!broken, 'the parts keep their lengths after the fall');
  ok(steps / 100 / 60 < 2.6, `a fall takes ${(steps / 100 / 60).toFixed(2)} s on average`);
  console.log(`  100 falls simulated in ${Date.now() - t1} ms`);
}

{
  const kit = B.copyKit(B.HEROES['guard.m'].kit), x = 845, z = 1338;
  const body = B.settle(B.fall(kit, B.fk(B.figure(kit), B.restPose(), [x, T.heightAt(x, z), z], 0), { id: 5, push: [0, 0, 1.5] }), W);
  const c = [body.pts[24], body.pts[25], body.pts[26]], eye = [c[0], c[1] + 1.55, c[2] - 1.2];
  const dir = K.v3.norm(K.v3.sub(c, eye));
  ok(B.pick([body], eye, dir, 2.4) && B.pick([body], eye, dir, 2.4).body === body, 'looking down at a body at arm length picks it for the search');
  ok(!B.pick([body], eye, K.v3.scale(dir, -1), 2.4) && !B.pick([body], eye, dir, 0.5), 'looking away or from too far picks nothing');
  const many = [];
  for (let i = 0; i < 170; i++) many.push({ pts: Float64Array.from({ length: 78 }, (v, j) => j % 3 === 0 ? i * 3 : j % 3 === 2 ? 900 : 0) });
  const away = B.trim(many.slice(), [5000, 0, 900], () => false), near = B.trim(many.slice(), [250, 0, 900], () => false);
  ok(B.CAP === 160 && away.length === 10 && away[0] === many[0] && away[9] === many[9], 'over 160 bodies the oldest ones out of sight go first');
  ok(near.length === 10 && near.every(b => Math.abs(b.pts[0] - 250) > 150), 'bodies closer than 150 m to the hero stay');
  ok(!B.trim(many.slice(), [5000, 0, 900], () => true).length, 'bodies in sight stay');
}

{
  const rnd = K.rng(31);
  const kit = B.kit('villain', 'm', rnd);
  kit.head = 'nasal';
  kit.armor = ['mail', 'bracers'];
  kit.pros = { lFore: 'iron' };
  const body = B.fall(kit, B.fk(B.figure(kit), B.restPose(), [100, 0, 100], 0), { id: 9, sack: [{ id: 'silver', n: 7 }, { id: 'bandage', n: 1 }] });
  const items = B.belongings(body).map(it => it.id);
  ok(['helmNasal', 'mail', 'bracers', 'ironArm', 'silver', 'bandage'].every(id => items.includes(id)), 'the search shows helmet, armour, prosthesis and the sack');
  const bag = [{ id: 'silver', n: 2 }];
  ok(B.take(body, 'head', bag).id === 'helmNasal' && body.kit.head === null && !Mo.look(body.kit).some(([key]) => key.startsWith('hat.')), 'a taken helmet leaves the head of the body');
  ok(B.take(body, 'pros:lFore', bag).id === 'ironArm' && body.kit.cut.lFore && !Mo.look(body.kit).some(([key, part]) => part === 5), 'a taken iron arm leaves a stump');
  ok(!Mo.look(body.kit).some(([key, part]) => key === 'bracer' && part === 5) && Mo.look(body.kit).some(([key, part]) => key === 'bracer' && part === 6), 'the bracer stays on the living arm');
  B.take(body, 'sack:silver', bag);
  ok(bag.find(s => s.id === 'silver').n === 9 && !B.take(body, 'sack:silver', bag), 'silver joins the bag once');
  ok(B.title(body.kit) === 'Солдат Злого' && B.title(Object.assign(B.copyKit(B.HEROES.villain.kit), { hero: 'villain' })) === 'Злой', 'bodies are named after their side');
}

{
  const lib = Mo.library(), rnd = K.rng(4);
  ok(lib.data.every(Number.isFinite), `${Object.keys(lib.meshes).length} meshes, ${lib.verts} vertices, all numbers finite`);
  ok(Object.values(lib.meshes).every(m => m.count % 3 === 0 && m.count <= m.cls), 'every mesh fits its draw class');
  let missing = 0, lo = Infinity, hi = 0;
  const items = [];
  for (const side of Object.keys(Dt.SIDES).filter(s => s !== 'straw')) {
    for (const fig of Dt.SIDES[side].figures) {
      for (let i = 0; i < 40; i++) {
        const kit = B.kit(side, fig, rnd), look = Mo.look(kit);
        missing += look.filter(([key]) => !lib.meshes[key]).length;
        const tri = Mo.trisOf(kit);
        lo = Math.min(lo, tri);
        hi = Math.max(hi, tri);
        if (items.length < 150) items.push({ kit, frames: B.fk(B.figure(kit), B.restPose(), [i, 0, 0], 0) });
      }
      const heads = Mo.look(B.kit(side, fig, rnd)).filter(([, p]) => p === 0).map(([k]) => k);
      ok(heads[0] === 'head.' + Dt.SIDES[side].race + '.' + fig, `${Dt.SIDES[side].name[fig]}: head of the right figure`);
    }
  }
  ok(!missing, 'every look of every side has its meshes');
  ok(lo >= 900 && hi <= 1800, `a person takes ${lo}–${hi} triangles`);
  const straw = Mo.look(B.strawman(1, 850, 1350, 0, W).kit);
  ok(straw.length && straw.every(([k]) => k.startsWith('straw.') && lib.meshes[k]), 'a straw dummy is built from straw parts on a post');
  const gk = B.HEROES['guard.m'].kit, gf = B.fk(B.figure(gk), B.restPose(), [0, 0, 0], 0);
  const open = Mo.pack([{ kit: gk, frames: gf, parts: [6] }]), closed = Mo.pack([{ kit: gk, frames: gf, parts: [6], fist: [6] }]);
  ok(Object.keys(lib.meshes).filter(k => k.endsWith('.fist')).length === 5 && closed.data[16] === lib.meshes['fore.guard.fist'].base && open.data[16] === lib.meshes['fore.guard'].base, 'a hand that holds something is drawn as a fist');
  const ax = C0.fighter({ weapon: 'axe' });
  ax.aim = { eye: [0, 1.6, 0], yaw: 0, pitch: 0 };
  const rest = C0.pose(ax);
  ok(rest.edge[2] < -0.9 && rest.d[1] > 0.85, 'an axe at rest is held upright with the edge towards the enemy');
  ok(['knife', 'sickle', 'sword', 'axe', 'mace', 'spear', 'bardiche', 'shield'].every(id => lib.meshes['w.' + id]) && lib.meshes.stump && lib.meshes['stump.healed'], 'every weapon, the shield and both stumps have meshes');
  const elf = Mo.look(B.HEROES['elf.m'].kit).map(([k]) => k), guard = Mo.look(B.HEROES['guard.m'].kit).map(([k]) => k);
  ok(elf.includes('head.elf.m') && elf.includes('hat.hood') && guard.includes('hat.crest') && guard.includes('chest.guard.m'), 'elves wear hoods over long ears, guards crested helmets and kaftans');
  const packed = Mo.pack(items);
  ok(packed.n === items.reduce((s, it) => s + Mo.look(it.kit).length, 0) && packed.segs.reduce((s, g) => s + g.count, 0) === packed.n, `150 people make ${packed.n} part instances`);
  ok(packed.segs.length <= Mo.CLASSES.length, `150 bodies take ${packed.segs.length} draw calls`);
}

{
  const S = { seed: 7, day: 1, hour: 10, time: 0, nextId: 1000, version: 0, people: B.drill(W, 7), bodies: [], parts: [], items: [], blood: [], player: { mv: K.Move.body(W, 845, 1338, 0.52), pitch: 0.02, mode: 'first', kit: Object.assign(B.copyKit(B.HEROES.villain.kit), { hero: 'villain' }), bag: [], fight: K.Combat.fighter({ weapon: 'axe' }) } };
  const D = P.DRILL, rows = new Map();
  for (const p of S.people) rows.set(p.kit.side, (rows.get(p.kit.side) || 0) + 1);
  ok(D.rows.every(s => rows.get(s) >= 5) && S.people.length === D.rows.length * 5 + D.walkers.length + D.hoppers.length + D.slope.length + D.straw.length, 'the drill lines up all four sides and three straw dummies');
  const anims = S.people.map(() => A.state()), legs = S.people.map(() => new Set());
  for (let t = 0; t < 40; t += 1 / 60) {
    S.people.forEach((p, i) => { K.Move.step(p.mv, B.drive(p, 1 / 60), 1 / 60, W); A.update(anims[i], p.mv, 1 / 60); legs[i].add(p.leg); });
    B.separate([S.player.mv, ...S.people.map(p => p.mv)]);
    S.time += 1 / 60;
  }
  const route = S.people.filter(p => p.act.route), posts = S.people.filter(p => p.act.post);
  ok(route.every(p => legs[S.people.indexOf(p)].size === p.act.route.length), 'walkers, runners and the crouching dummy go round the whole loop');
  ok(posts.every(p => Math.hypot(p.mv.pos[0] - p.act.post[0], p.mv.pos[2] - p.act.post[1]) < 0.6), 'the line keeps its places');
  const victims = S.people.slice(0, 6);
  for (const [i, p] of victims.entries()) {
    const fr = B.fk(B.figure(p.kit), A.pose(anims[S.people.indexOf(p)], p.kit), p.mv.pos, p.mv.yaw);
    S.bodies.push(B.fall(p.kit, fr, { id: p.id, vel: p.mv.vel.slice(), push: [1.5, 0.2, -1], sack: p.sack, born: S.time + i }));
  }
  S.people = S.people.filter(p => !victims.includes(p));
  for (const b of S.bodies.slice(0, 4)) B.settle(b, W);
  for (let i = 0; i < 20; i++) for (const b of S.bodies) B.simulate(b, 1 / 60, W);
  B.take(S.bodies[0], 'sack:silver', S.player.bag);
  ok(S.bodies.some(b => !b.frozen) && S.bodies.some(b => b.frozen), 'the save holds lying and still falling bodies');
  const saved = JSON.stringify(Sv.pack(S, W)), back = Sv.unpack(JSON.parse(saved), W), again = JSON.stringify(Sv.pack(back, W));
  ok(Sv.hash(saved) === Sv.hash(again) && saved === again, `save, load, save: the same hash ${Sv.hash(saved)}`);
  const run = st => { for (let i = 0; i < 90; i++) { for (const p of st.people) K.Move.step(p.mv, B.drive(p, 1 / 60), 1 / 60, W); for (const b of st.bodies) B.simulate(b, 1 / 60, W); } return Sv.hash(Sv.pack(st, W)); };
  ok(run(Sv.unpack(JSON.parse(saved), W)) === run(Sv.unpack(JSON.parse(saved), W)), 'two loads of one save play on the same way');
  ok(back.bodies.every((b, i) => b.frozen === S.bodies[i].frozen && b.kit.side === S.bodies[i].kit.side) && back.player.bag.length === 1 && back.player.kit.hero === 'villain', 'bodies, bag and hero come back');
  const heavy = Object.assign({}, S, { bodies: [], people: S.people });
  const kit = B.kit('guard', 'm', K.rng(1));
  const proto = B.settle(B.fall(kit, B.fk(B.figure(kit), B.restPose(), [845, T.heightAt(845, 1338), 1338], 0), { id: 1 }), W);
  for (let i = 0; i < B.CAP; i++) heavy.bodies.push(Object.assign({}, proto, { id: i + 1, kit: B.kit(['elf', 'guard', 'villain', 'town'][i % 4], null, K.rng(i)), sack: [{ id: 'silver', n: i % 9 + 1 }] }));
  const kb = Sv.size(Sv.pack(heavy, W)) / 1024;
  ok(kb < 72, `a save with ${B.CAP} bodies and ${heavy.people.length} people weighs ${kb.toFixed(1)} KB`);
  const v1 = { v: 1, seed: 7, day: 2, hour: 9.5, time: 61.25, nextId: 1001, player: { mv: { pos: [845, 0.3, 1338], vel: [0, 0, 0], yaw: 0.52, onGround: true, crouch: false, walk: false, stamina: 100, tired: false, ladder: -1 }, pitch: 0.02, mode: 'first', kit: ['elf', 'm', 0, 'e6c2a3', 'long', '8c6138', 0, 'hood', '5c452b', '425c38', '80807a', [], {}, {}, 'elf.m'], bag: [{ id: 'silver', n: 3 }] }, people: [{ id: 3, kit: ['town', 'f', 2, 'd6ad8a', 'braid', '4d3826', 0, 'kerchief', 'dbd1b8', '4d5266', '80807a', [], {}, {}], mv: { pos: [850, 0.3, 1330], vel: [0, 0, 0], yaw: -2.27, onGround: true, crouch: false, walk: true, stamina: 100, tired: false, ladder: -1 }, act: { kind: 'stand', post: [850, 1330], face: -2.27 }, leg: 0, wait: 0, sack: [{ id: 'bread', n: 1 }] }], bodies: [{ id: 4, kit: ['villain', 'm', 1, 'c29978', 'bald', '29211a', 1, 'closed', '33302e', '523d2e', '545457', ['mail'], { rShin: 'iron' }, {}], sack: [], born: 40, frozen: true, at: [852.1, 0.42, 1331.5], pts: Buffer.from(new Int8Array(Array.from(proto.pts, (v, j) => Math.round((v - proto.pts[24 + j % 3]) * 100))).buffer).toString('base64') }] };
  const mig = Sv.unpack(v1, W), v2 = Sv.pack(mig, W);
  ok(v1.v === 1 && v2.v === Sv.VERSION && JSON.stringify(Sv.pack(Sv.unpack(v2, W), W)) === JSON.stringify(v2) && Array.isArray(v2.chairs), 'a save of format 1 (stage 3) moves to the current format and then saves back unchanged');
  ok(mig.player.kit.hero === 'elf.m' && mig.player.fight.weapon === 'sickle' && !mig.player.fight.shield && JSON.stringify(mig.player.kit.eyes) === '{}' && mig.bodies[0].kit.pros.rShin === 'iron', 'the old hero gets the sickle of his side and both eyes, old bodies keep their gear');
  ok(mig.people[0].fight.weapon === B.arm('town', 3).weapon && !mig.parts.length && !mig.items.length && !mig.blood.length && mig.player.bag[0].n === 3, 'old people get the weapon their side carries, the world has no blood yet');
  let threw = false;
  try { Sv.unpack(Object.assign({}, v1, { v: 99 }), W); } catch (e) { threw = /версия/.test(e.message); }
  ok(threw && Sv.VERSION >= 9, 'an unknown save version is refused');
}

const C = K.Combat, AI = K.AI, FW = flat();
const arena = (weapon, dist, o) => {
  const opt = o || {};
  const tk = B.kit(opt.side || 'guard', 'm', K.rng(3));
  tk.armor = opt.armor || [];
  tk.head = opt.head === undefined ? null : opt.head;
  tk.pros = {};
  const tgt = B.person(2, tk, 100 + (opt.dx || 0), 100 - dist, Math.PI + (opt.turn || 0), FW);
  tgt.sack = [];
  tgt.fight = C.fighter({ weapon: opt.foe || null, shield: !!opt.shield });
  tgt.anim = A.state();
  const hero = { kit: Object.assign(B.copyKit(B.HEROES['guard.m'].kit), { hero: 'guard.m' }), mv: K.Move.body(FW, 100, 100, 0), pitch: 0, mode: 'first', bag: [], fight: C.fighter({ weapon }), anim: A.state(), frames: new Float32Array(132) };
  const S = { seed: 7, day: 1, hour: 10, time: 0, nextId: 10, version: 0, people: [tgt], bodies: [], parts: [], items: [], blood: [], player: hero };
  const rnd = K.rng(9), pose = B.restPose(), log = [], aim = { yaw: 0, pitch: 0 };
  const tick = n => {
    for (let i = 0; i < (n || 1); i++) {
      hero.fight.aim = { eye: [hero.mv.pos[0], hero.mv.pos[1] + hero.mv.eye, hero.mv.pos[2]], yaw: aim.yaw, pitch: aim.pitch };
      A.update(hero.anim, hero.mv, 1 / 60);
      const r = AI.run(S, 1 / 60, FW, rnd, pose);
      for (const e of [...r.events, ...r.results]) log.push(Object.assign({ t: S.time }, e));
      S.time += 1 / 60;
    }
  };
  const at = (h, d) => { aim.pitch = Math.atan2(h - (hero.mv.eye - 0.22), d); };
  const look = pt => {
    const e = [hero.mv.pos[0], hero.mv.pos[1] + hero.mv.eye, hero.mv.pos[2]];
    aim.yaw = Math.atan2(pt[0] - e[0], -(pt[2] - e[2]));
    aim.pitch = Math.atan2(pt[1] - e[1], Math.hypot(pt[0] - e[0], pt[2] - e[2]));
  };
  const swing = (dir, hold) => {
    C.press(hero.fight);
    if (dir === 'thrust') { tick(3); C.release(hero.fight, hero.mv); return; }
    C.steer(hero.fight, Math.cos(dir * Math.PI / 4) * 100, Math.sin(dir * Math.PI / 4) * 100);
    tick(Math.round(hold * 60));
    C.release(hero.fight, hero.mv);
  };
  return { S, hero, tgt, tick, at, look, swing, log };
};
const eyeAt = p => {
  const fr = p.frames, fig = B.figure(p.kit), l = [0.032 * fig.sx, 0.19 * fig.sy, -0.095 * fig.sx];
  return [0, 1, 2].map(i => fr[9 + i] + fr[i] * l[0] + fr[3 + i] * l[1] + fr[6 + i] * l[2]);
};
const cutsOf = R => R.log.filter(e => e.kind === 'cut').map(e => e.parts.join('+'));

{
  const ids = Object.keys(Dt.WEAPONS), WP = Dt.WEAPONS;
  ok(ids.join() === 'knife,sickle,sword,axe,mace,spear,bardiche' && ids.every(id => Dt.ITEMS[id].kind === 'weapon'), 'seven weapons from plan 6.5');
  ok(ids.every(id => WP[id].reach === M.reach[id]), 'weapon lengths follow plan 5.5');
  ok(ids.every(id => WP[id].wind[0] < WP[id].wind[1] && WP[id].cost >= 5 && WP[id].cost <= 20 && WP[id].swing > 0 && WP[id].recover > 0), 'every weapon has a windup window, a swing, a recovery and a stamina cost of 5 to 20');
  ok(WP.knife.wind[1] < WP.sword.wind[1] && WP.sword.wind[1] < WP.axe.wind[1] && WP.axe.wind[1] < WP.bardiche.wind[1], 'the knife winds up fastest, the bardiche slowest');
  ok(WP.spear.hands === 2 && WP.bardiche.hands === 2 && ['knife', 'sickle', 'sword', 'axe', 'mace'].every(id => WP[id].hands === 1), 'spear and bardiche take two hands');
  ok(ids.filter(id => WP[id].eye).join() === 'knife,sword,spear', 'knife, sword and spear can put out an eye');
  ok(WP.sickle.cuts.join() === 'fore' && WP.sword.cuts.join() === 'fore,arm' && WP.axe.cuts.join() === 'fore,arm,shin,thigh' && WP.bardiche.cuts.join() === 'fore,arm,shin,thigh,neck', 'sickle cuts forearms, sword arms, axe arms and legs, bardiche also the neck');
  ok(!WP.knife.cuts.length && !WP.mace.cuts.length && !WP.spear.cuts.length, 'knife, mace and spear cut nothing off');
  ok(Object.values(Dt.LOADOUTS).every(list => Math.abs(list.reduce((m, [, , w]) => m + w, 0) - 1) < 1e-9), 'loadout shares add up to one');
  ok(Dt.LOADOUTS.elf.every(([w]) => w === 'sickle' || w === 'knife') && Dt.LOADOUTS.guard.some(([w]) => w === 'bardiche') && Dt.LOADOUTS.villain.some(([w]) => w === 'axe') && Dt.LOADOUTS.villain.some(([w]) => w === 'mace'), 'who carries what follows the table in plan 6.5');
  ok(B.HERO_GEAR['elf.m'][0] === 'sickle' && B.HERO_GEAR['guard.m'].join() === 'sword,true' && B.HERO_GEAR.villain[0] === 'axe', 'heroes start with a sickle, a sword and shield, an axe');
}

{
  const att = (weapon, o) => ({ fight: Object.assign(C.fighter({ weapon, exp: o.exp || 'soldier' }), { act: { kind: 'swing', power: 1 } }), mv: { tired: !!o.tired } });
  const def = o => {
    const kit = B.kit('guard', 'm', K.rng(5));
    kit.armor = o.armor || [];
    kit.head = o.head || null;
    kit.pros = {};
    return { kit, fight: C.fighter({ shield: !!o.shield }) };
  };
  const hit = (weapon, part, o) => {
    const opt = o || {}, kind = opt.kind || (Dt.WEAPONS[weapon].chop ? 'chop' : 'crush');
    return C.strike(att(weapon, opt), opt.straw || def(opt), { part, tag: opt.tag || null, onBlade: opt.onBlade !== false }, kind, opt.rnd || (() => 0.5));
  };
  const TABLE = [
    ['knife', 5, null, [], false],
    ['sickle', 5, null, [], true], ['sickle', 5, null, ['bracers'], false], ['sickle', 3, null, [], false], ['sickle', 9, null, [], false],
    ['sword', 6, null, [], true], ['sword', 6, null, ['bracers'], false], ['sword', 4, null, [], false], ['sword', 10, null, [], false],
    ['axe', 5, null, ['bracers'], true], ['axe', 4, null, [], true], ['axe', 9, null, ['greaves'], true], ['axe', 7, null, [], true], ['axe', 0, 'neck', [], false],
    ['mace', 5, null, [], false], ['spear', 5, null, [], false],
    ['bardiche', 0, 'neck', [], true], ['bardiche', 0, 'neck', ['collar'], true], ['bardiche', 8, null, ['greaves'], true], ['bardiche', 1, null, [], false]
  ];
  const wrong = TABLE.filter(([w, part, tag, armor, cut]) => (hit(w, part, { tag, armor }).cut !== null) !== cut);
  ok(!wrong.length, `outcome table: ${TABLE.length} full swings cut off exactly what plan 6.2 says ${wrong.map(r => r.slice(0, 2).join(':')).join(' ')}`);
  ok(hit('sword', 4, { rnd: () => 0.999 }).cut === 4 && hit('sword', 4, { rnd: () => 0 }).cut === null && hit('sword', 4, { exp: 'veteran' }).cut === 4, 'a soldier takes a whole arm with a sword only at the top of the ±10 % spread, a veteran always');
  ok(hit('sickle', 5, { armor: ['bracers'], rnd: () => 0.999 }).cut === null, 'bracers save a forearm from a sickle even at the strongest roll');
  const dmg = (w, part, o) => hit(w, part, o).damage, chest = dmg('sword', 1);
  ok(Math.abs(dmg('sword', 0) / chest - 1.5) < 1e-9 && Math.abs(dmg('sword', 2) / chest - 1) < 1e-9 && Math.abs(dmg('sword', 5) / chest - 0.6) < 1e-9, 'head ×1.5, belly ×1, limbs ×0.6 (plan 6.2)');
  ok(Math.abs(dmg('sword', 1, { armor: ['mail'] }) / chest - 0.7) < 1e-9 && Math.abs(dmg('sword', 2, { armor: ['plate'] }) / chest - 0.5) < 1e-9, 'mail ×0.7 and plate ×0.5 on chest and belly (plan 6.7)');
  ok(['crest', 'nasal', 'closed'].every(h => Math.abs(dmg('sword', 0, { head: h }) / dmg('sword', 0) - Dt.ARMOR.helm[h]) < 1e-9), 'helmets: ×0.7, ×0.6, ×0.5 to the head');
  ok(dmg('mace', 1, { armor: ['plate'] }) > 2.5 * dmg('sword', 1, { armor: ['plate'] }), `the mace dents plate: ${dmg('mace', 1, { armor: ['plate'] }).toFixed(1)} against ${dmg('sword', 1, { armor: ['plate'] }).toFixed(1)} from a sword`);
  ok(Math.abs(dmg('sword', 1, { tired: true }) / chest - 0.7) < 1e-9, 'a tired fighter hits 30 % weaker');
  const haft = hit('bardiche', 1, { onBlade: false });
  ok(haft.type === 'blunt' && haft.cut === null && haft.damage < dmg('bardiche', 1) * 0.5, 'the haft hits blunt and cuts nothing');
  ok(hit('mace', 0).stun === 2 && hit('mace', 1).stun === 0 && hit('sword', 0).stun === 0, 'a mace to the head stuns for 2 s');
  ok(hit('axe', 5, { shield: true }).cut === null && hit('axe', 3, { shield: true }).cut === null && hit('axe', 6, { shield: true }).cut === 6, 'the arm behind the shield is never cut off (plan 6.5)');
  const straw = B.strawman(70, 0, 0, 0, FW);
  ok(hit('sickle', 3, { straw }).cut === 3 && hit('knife', 5, { straw, kind: 'chop' }).cut === 5 && hit('sickle', 3, { straw }).damage === 0 && hit('bardiche', 0, { straw, tag: 'neck' }).cut === null, 'straw arms come off from any blade, straw takes no damage and keeps its head');
  ok(C.severs(B.kit('guard', 'm', K.rng(1)), 3).join() === '3,5' && C.severs(B.kit('guard', 'm', K.rng(1)), 10).join() === '10' && C.severs(B.kit('guard', 'm', K.rng(1)), 8).join() === '8,10', 'a cut at the shoulder or thigh takes the whole limb, at the forearm or shin only the lower part');
}

{
  const strikeAt = (w, d, dir, h, hold, o) => { const R = arena(w, d, o); R.tick(2); R.at(h, d); R.swing(dir, hold); R.tick(60); return R; };
  const neck = strikeAt('bardiche', 1.45, 0, 1.53, 0.7);
  ok(cutsOf(neck).join() === '0' && neck.S.bodies.length === 1 && neck.S.bodies[0].cause === 'head' && !neck.S.people.length, 'a level bardiche swing at the neck takes the head off, the body falls');
  const fore = strikeAt('sword', 1.0, 4, 1.2, 0.6, { foe: 'sword' });
  ok(cutsOf(fore).join() === '6' && fore.S.people.length === 1 && !fore.tgt.fight.weapon && fore.S.items.length === 1 && fore.S.items[0].item === 'sword', 'a sword swing from the left at the sword hand takes the right forearm, the sword falls');
  ok(cutsOf(strikeAt('sword', 1.0, 4, 0.95, 0.6)).join() === '6', 'the same swing at the belt takes a hanging forearm');
  ok(fore.log.some(e => e.kind === 'disarmed') && Mo.look(fore.tgt.kit).some(([k, part]) => k === 'stump' && part === 4), 'the man is disarmed and keeps a stump below the elbow');
  const arm = strikeAt('axe', 0.9, 4, 1.25, 0.6);
  ok(cutsOf(arm).join() === '4+6', 'an axe swing at the shoulder takes the whole arm');
  const leg = strikeAt('axe', 0.9, 7, 0.45, 0.6);
  ok(cutsOf(leg).join() === '9' && leg.log.some(e => e.kind === 'crippled') && leg.S.people.includes(leg.tgt) && leg.tgt.mv.crawl && leg.tgt.fight.bleed.heavy > 0, 'a low diagonal axe swing takes the left leg below the knee: the man drops and crawls, bleeding hard');
  const corpse = (w, dir, part) => {
    const R = arena(w, 2);
    R.S.people.length = 0;
    const kit = R.tgt.kit, body = B.settle(B.fall(kit, B.fk(B.figure(kit), B.restPose(), [100, 0, 98.8], Math.PI), { id: 5, push: [0, 0, -1.2] }), FW);
    R.S.bodies.push(body);
    const c = B.capsules(body.kit, body.frames).find(x => x[0] === part), mid = [0, 1, 2].map(i => (c[1][i] + c[2][i]) / 2);
    R.hero.mv.pos[0] = mid[0];
    R.hero.mv.pos[2] = mid[2] + 0.6;
    R.tick(2);
    R.look(mid);
    const before = B.anchorOf(body);
    R.swing(dir, 0.6);
    let woke = false;
    for (let i = 0; i < 150; i++) { R.tick(1); woke = woke || !body.frozen; }
    return { R, body, woke, before };
  };
  const chop = corpse('axe', 2, 9);
  ok(cutsOf(chop.R).join() === '9' && chop.body.kit.cut.lShin === 'fresh' && chop.R.S.parts.length === 1 && chop.R.log.some(e => e.kind === 'hit' && e.body), `an axe chopped down on the shin of a body takes it off (${cutsOf(chop.R).join()})`);
  ok(chop.woke && chop.body.frozen && Mo.look(chop.body.kit).some(([k]) => k === 'stump'), 'the body jerks under the blow, settles again and shows the stump');
  const kicked = corpse('sword', 2, 1), k0 = B.anchorOf(kicked.body);
  C.kick(kicked.R.hero.fight, kicked.R.hero.mv);
  for (let i = 0; i < 120; i++) kicked.R.tick(1);
  const k1 = B.anchorOf(kicked.body), moved = Math.hypot(k1[0] - k0[0], k1[2] - k0[2]);
  ok(kicked.R.log.some(e => e.kind === 'kick' && e.what === 'body') && moved > 0.2 && moved < 1.5 && kicked.body.frozen, `a kick drags a body ${moved.toFixed(2)} m`);
  ok(cutsOf(strikeAt('sickle', 0.7, 0, 1.0, 0.6)).join() === '5', 'a sickle swing at the belt takes the left forearm');
  ok(!cutsOf(strikeAt('sword', 1.0, 4, 0.95, 0.6, { armor: ['bracers'] })).length, 'bracers keep the forearm on');
  ok(!cutsOf(strikeAt('sickle', 0.7, 0, 1.0, 0.6, { foe: 'sword', shield: true })).length, 'the same sickle swing does not take the arm that holds a shield');
  for (let i = 0; i < 360 && !fore.S.parts.every(p => p.frozen); i++) fore.tick(1);
  const piece = fore.S.parts[0], low = groundClear(piece.kit, piece.frames, FW.terrain);
  ok(piece.frozen && piece.keep.join() === '6' && low.min > -0.05 && low.max < 0.12, `the forearm lies on the ground (lowest point ${low.min.toFixed(3)} m)`);
  ok(B.PIECE_CAP === 120 && B.ITEM_CAP === 120, 'up to 120 cut-off parts and 120 dropped things on the map (plan 6.8)');
  const stab = (w, d, o) => { const R = arena(w, d, o); R.tick(2); R.look(eyeAt(R.tgt)); R.swing('thrust'); R.tick(40); return R.tgt.kit.eyes || {}; };
  ok(stab('knife', 0.55).r && stab('sword', 0.95).r && stab('spear', 1.9).r, 'a short click thrusts into the crosshair: knife, sword and spear put out the eye');
  ok(!stab('knife', 0.55, { head: 'closed' }).r && stab('knife', 0.55, { head: 'crest' }).r, 'a closed helmet saves the eyes, an open one does not');
  const centre = (w, d, hold, o) => {
    const R = arena(w, d, o);
    R.tick(2);
    R.at(1.3, d);
    C.press(R.hero.fight);
    R.tick(Math.round(hold * 60));
    const aiming = C.pose(R.hero.fight).phase, centred = C.centred(R.hero.fight);
    C.release(R.hero.fight, R.hero.mv);
    const act = R.hero.fight.act;
    R.tick(40);
    return { R, aiming, centred, act, hit: R.log.find(e => e.kind === 'hit') };
  };
  const quick = centre('sword', 1.0, 0.05), held = centre('sword', 1.0, 0.55), spear = centre('spear', 1.9, 0.62);
  ok(held.centred && held.aiming === 'aim' && held.act.kind === 'thrust' && Math.abs(held.act.power - 1) < 1e-9 && quick.act.kind === 'thrust' && quick.act.power === 0.6, 'holding LMB without moving the mouse draws a sword back for a full-power thrust, a click thrusts at 0.6');
  ok(held.hit && quick.hit && held.hit.part === quick.hit.part && held.hit.damage > quick.hit.damage * 1.6, `the held thrust lands where the quick one does, ${held.hit ? held.hit.damage.toFixed(1) : '-'} against ${quick.hit ? quick.hit.damage.toFixed(1) : '-'}`);
  ok(spear.act.kind === 'thrust' && spear.act.power === 1 && spear.hit && spear.hit.type === 'stab', 'the spear draws back and thrusts the same way');
  const axe = centre('axe', 0.9, 0.5);
  ok(!axe.centred && axe.act.kind === 'swing', 'an axe has no point: without a mouse move it swings from the last side');
  const R2 = arena('sword', 1.0);
  R2.tick(2);
  C.press(R2.hero.fight);
  C.steer(R2.hero.fight, 40, 0);
  R2.tick(30);
  C.release(R2.hero.fight, R2.hero.mv);
  ok(R2.hero.fight.act.kind === 'swing' && R2.hero.fight.act.dir === 0, 'a mouse move during the windup turns the sword thrust into a swing from that side');
  ok(stab('knife', 0.55, { head: 'nasal' }).r && !stab('knife', 0.55, { head: 'nasal', dx: 0.4 }).r, 'a nasal helmet loses the eye only to a thrust straight in the face');
  const one = arena('knife', 0.55);
  one.tgt.kit.eyes = { r: true };
  one.tick(2);
  const face = Mo.pack([{ kit: one.tgt.kit, frames: one.tgt.frames }]).data[18];
  ok(Math.floor(face / 8) === 2 && face % 8 === one.tgt.kit.face, 'the lost right eye reaches the face shader');
}

{
  const defend = (o, when) => {
    const R = arena(o.weapon || 'sword', o.dist || 1.0, { foe: 'sword', shield: o.shield });
    R.tick(2);
    R.at(1.25, o.dist || 1.0);
    if (when === 'early') C.guard(R.tgt.fight, true, o.side);
    R.tick(10);
    C.press(R.hero.fight);
    C.steer(R.hero.fight, 100 * Math.cos((o.dir || 0) * Math.PI / 4), 100 * Math.sin((o.dir || 0) * Math.PI / 4));
    R.tick(Math.round((o.hold || 0.45) * 60));
    if (when === 'late') C.guard(R.tgt.fight, true, o.side);
    const s0 = R.hero.mv.stamina;
    C.release(R.hero.fight, R.hero.mv);
    const cost = s0 - R.hero.mv.stamina;
    let drop = 0, stun = 0;
    for (let i = 0; i < 40; i++) { const before = R.tgt.mv.stamina; R.tick(1); drop = Math.max(drop, before - R.tgt.mv.stamina); stun = Math.max(stun, R.hero.fight.stun); }
    return { R, cost, drop, stun, first: R.log.find(e => e.kind !== 'whoosh') };
  };
  const blk = defend({ side: 'left' }, 'early');
  ok(blk.first.kind === 'block' && defend({ side: 'right' }, 'early').first.kind === 'hit', 'a guard on the side the blow comes from stops it, a guard on the other side does not');
  ok(defend({ side: 'up', dir: 2 }, 'early').first.kind === 'block' && defend({ side: 'down', dir: 6 }, 'early').first.kind === 'block', 'guards up and down stop blows from above and below');
  const par = defend({ side: 'left' }, 'late');
  ok(par.first.kind === 'parry' && Math.abs(par.stun - C.PARRY_OPEN) < 1e-9 && blk.stun === 0, 'a guard raised in the last 0.15 s parries and leaves the attacker open for 0.6 s');
  ok(blk.cost === Dt.WEAPONS.sword.cost && Math.abs(blk.drop - 5) < 1e-6, 'a sword swing costs 11 stamina, a blocked blow costs the defender 5');
  const sh = defend({ side: 'right', shield: true }, 'early');
  ok(sh.first.kind === 'block' && sh.first.material === 'wood' && Math.abs(sh.drop - 7) < 1e-6, 'the shield stops a blow from any side for 7 stamina');
  const late = defend({ side: 'right', shield: true }, 'late');
  ok(late.first.kind === 'block' && late.stun === 0, 'a shield does not parry');
  const heavy = defend({ side: 'right', shield: true, weapon: 'axe', dist: 0.95, hold: 0.62 }, 'early'), light = defend({ side: 'right', shield: true, weapon: 'axe', dist: 0.95, hold: 0.27 }, 'early');
  ok(heavy.first.heavy && !heavy.R.tgt.fight.guard && Math.abs(heavy.drop - 10) < 1e-6 && !light.first.heavy && light.R.tgt.fight.guard, 'a full axe swing knocks the shield aside for 10 stamina, a quick one does not');
  const sf = C.fighter({ weapon: 'sword', shield: true });
  sf.aim = { eye: [0, 1.6, 0], yaw: 0, pitch: 0 };
  C.guard(sf, true, 'right');
  sf.guard.t = sf.guard.sw = 0.4;
  const d0 = C.shieldDisc(sf).c;
  C.steer(sf, -120, 0);
  const d1 = C.shieldDisc(sf).c, jump = Math.hypot(d1[0] - d0[0], d1[1] - d0[1], d1[2] - d0[2]);
  sf.guard.sw += 0.2;
  const d2 = C.shieldDisc(sf).c;
  ok(sf.guard.dir === 'left' && sf.guard.t === 0.4 && jump < 0.01 && d0[0] - d2[0] > 0.15, `a raised shield slides to the new side without dropping (${(jump * 100).toFixed(1)} cm jump, ${((d0[0] - d2[0]) * 100).toFixed(0)} cm across)`);
  const wf = C.fighter({ weapon: 'sword' });
  wf.aim = sf.aim;
  C.guard(wf, true, 'right');
  wf.guard.t = wf.guard.sw = 0.4;
  const g0 = C.pose(wf).tip;
  C.steer(wf, 0, 120);
  const g1 = C.pose(wf).tip;
  ok(wf.guard.dir === 'up' && wf.guard.t === 0 && Math.hypot(g1[0] - g0[0], g1[1] - g0[1], g1[2] - g0[2]) < 0.01, 'a weapon guard turns smoothly and the turn opens a new parry window');
  const kickAt = g => {
    const R = arena('sword', 1.0, { foe: 'sword', shield: g === 'shield' });
    R.tick(2);
    if (g) C.guard(R.tgt.fight, true, 'right');
    R.tick(10);
    const z0 = R.tgt.mv.pos[2], s0 = R.hero.mv.stamina;
    C.kick(R.hero.fight, R.hero.mv);
    const cost = s0 - R.hero.mv.stamina;
    let far = 0, stun = 0;
    for (let i = 0; i < 40; i++) { R.tick(1); far = Math.max(far, z0 - R.tgt.mv.pos[2]); stun = Math.max(stun, R.tgt.fight.stun); }
    return { R, cost, far, stun, ev: R.log.find(e => e.kind === 'kick') };
  };
  const k0 = kickAt(null), k1 = kickAt('guard'), k2 = kickAt('shield');
  ok(Math.abs(k0.far - C.KICK.push) < 0.05 && k0.cost === C.KICK.cost, `a kick shoves ${k0.far.toFixed(2)} m back for ${k0.cost} stamina`);
  ok(k1.ev.what === 'guard' && k1.stun > 0.2 && k2.ev.what === 'shield' && k2.stun > 0.45 && !k2.R.tgt.fight.guard, 'a kick breaks a guard and knocks a shield aside');
  ok(k0.R.tgt.fight.hostile === k0.R.hero && k0.R.tgt.fight.life === 100 - C.KICK.damage, 'a kicked man loses 4 life and turns on the kicker');
  const move = K.Move.body(FW, 100, 100, 0);
  run(FW, move, { fwd: -1 }, 1.5);
  ok(Math.abs(move.speed - M.run * 0.65) < 0.05, `stepping back is slower: ${move.speed.toFixed(2)} m/s`);
}

{
  const R = arena('axe', 0.9, { foe: 'sword' });
  R.tick(2);
  R.at(1.35, 0.9);
  R.swing(4, 0.6);
  R.tick(20);
  const straw = B.strawman(50, 103, 99, Math.PI, FW);
  straw.kit.cut = { lArm: 'fresh', lFore: 'fresh' };
  straw.regrow = { lArm: R.S.time + 12.5 };
  R.S.people.push(straw);
  R.S.blood.push({ x: 100.12, z: 99.3, r: 0.35, born: 0.5 }, { x: 100.4, z: 98.9, r: 0.08, born: 0.6, y: 0.02 });
  R.tick(1);
  ok(cutsOf(R).join() === '4+6' && R.S.parts.length === 1 && !R.S.parts[0].frozen && R.S.items.length === 1, 'the save test holds a falling arm and a dropped sword');
  const keep = st => JSON.stringify(Sv.pack(st, FW));
  const saved = keep(R.S), back = Sv.unpack(JSON.parse(saved), FW);
  ok(keep(back) === saved && JSON.parse(saved).v === Sv.VERSION, 'save, load, save with parts, weapons, blood, wounds and fighters gives the same text');
  const bs = back.people.find(p => p.id === 50), bt = back.people.find(p => p.id === 2);
  ok(back.parts[0].keep.join() === '4,6' && back.items[0].item === 'sword' && back.blood.length === R.S.blood.length && back.blood.some(b => b.x === 100.12 && b.r === 0.35) && back.blood.some(b => b.y === 0.02), 'cut-off parts, weapons and blood come back');
  ok(bs.fight.life === Infinity && Math.abs(bs.regrow.lArm - straw.regrow.lArm) < 0.01 && bs.kit.cut.lArm === 'fresh', 'a straw dummy comes back with its missing arm and the time it grows back');
  ok(bt.kit.cut.rArm === 'fresh' && bt.fight.weapon === null && bt.fight.exp === R.tgt.fight.exp && Math.abs(bt.fight.life - R.tgt.fight.life) < 0.01 && back.player.fight.weapon === 'axe', 'fighters come back with their wounds, life and weapons');
  for (let i = 0; i < 400 && !R.S.parts.every(p => p.frozen); i++) R.tick(1);
  const still = Sv.unpack(JSON.parse(keep(R.S)), FW), err = Math.max(...R.S.parts[0].pts.map((v, i) => Math.abs(v - still.parts[0].pts[i])));
  ok(R.S.parts[0].frozen && still.parts[0].frozen && err <= 0.006, `a still arm is stored in centimetres (error ${(err * 100).toFixed(2)} cm)`);
  const replay = st => { const rnd = K.rng(3), pose = B.restPose(); for (let i = 0; i < 120; i++) { AI.run(st, 1 / 60, FW, rnd, pose); st.time += 1 / 60; } return Sv.hash(Sv.pack(st, FW)); };
  ok(replay(Sv.unpack(JSON.parse(saved), FW)) === replay(Sv.unpack(JSON.parse(saved), FW)), 'two loads of one fight play on the same way');
  R.tick(60 * 13);
  ok(!straw.kit.cut.lArm && !straw.kit.cut.lFore && !straw.regrow.lArm, 'the straw arm grows back after its time');
}

{
  const R = arena('sickle', 1.0);
  R.S.people.length = 0;
  const straw = B.strawman(51, 100, 99.1, Math.PI, FW);
  R.S.people.push(straw);
  R.tick(2);
  R.at(1.42, 0.9);
  R.swing(0, 0.6);
  R.tick(30);
  const cut = cutsOf(R), part = cut.length ? B.PARTS[+cut[0].split('+')[0]] : null;
  ok(part && R.S.parts.length === 1 && R.S.parts[0].straw === straw.id && R.log.some(e => e.kind === 'hit' && e.material === 'straw') && straw.fight.life === Infinity, `a sickle swing takes off a straw arm (${cut.join()})`);
  ok(part && straw.regrow[part] - R.S.time > 19 && straw.regrow[part] - R.S.time <= 20, 'the dummy grows it back in 20 s');
  ok(!R.S.parts[0].blood && R.log.every(e => e.kind !== 'hit' || e.damage === 0), 'straw does not bleed and takes no damage');
  R.tick(60 * 20);
  ok(!Object.keys(straw.kit.cut).length && !R.S.parts.length, 'after 20 s the arm is back and the cut-off one is gone');
}

{
  const duel = (wa, wb, seed) => {
    const rnd = K.rng(seed);
    const mk = (id, [weapon, shield], x, yaw, side) => {
      const kit = B.kit(side, 'm', K.rng(seed * 7 + id));
      kit.armor = [];
      kit.head = null;
      kit.pros = {};
      const p = B.person(id, kit, x, 100, yaw, FW);
      p.sack = [];
      p.fight = C.fighter({ weapon, shield, exp: 'soldier' });
      return p;
    };
    const a = mk(1, wa, 97.8, Math.PI / 2, 'guard'), b = mk(2, wb, 102.2, -Math.PI / 2, 'villain');
    a.fight.hostile = b;
    b.fight.hostile = a;
    const S = { people: [a, b], bodies: [], parts: [], items: [], blood: [], nextId: 100, time: 0, player: null, version: 0 }, pose = B.restPose(), seen = new Set();
    while (S.time < 60) {
      const r = AI.run(S, 1 / 60, FW, rnd, pose);
      S.time += 1 / 60;
      for (const e of r.events) seen.add(e.kind);
      const down = r.results.find(x => x.kind === 'down' || x.kind === 'disarmed');
      if (down) return { t: S.time, winner: down.who === a ? 'b' : 'a', seen };
    }
    return { t: S.time, winner: null, seen };
  };
  const PAIRS = [[['sword', true], ['axe', false]], [['spear', false], ['sword', true]], [['bardiche', false], ['knife', false]], [['mace', false], ['sickle', false]]];
  const t1 = Date.now(), out = [];
  PAIRS.forEach((p, i) => { for (let s = 0; s < 3; s++) out.push(duel(p[0], p[1], 500 + i * 10 + s)); });
  const times = out.map(d => d.t).sort((x, y) => x - y), median = times[Math.floor(times.length / 2)], seen = new Set(out.flatMap(d => [...d.seen]));
  ok(out.every(d => d.winner), `all ${out.length} bot duels end with a winner (median ${median.toFixed(1)} s)`);
  ok(median >= 5 && median <= 25, 'bot duels last seconds, not a moment and not a minute');
  ok(['hit', 'block', 'whoosh'].every(k => seen.has(k)) && (seen.has('parry') || seen.has('kick')), `bots swing, hit and block (${[...seen].sort().join(' ')})`);
  console.log(`  ${out.length} bot duels in ${Date.now() - t1} ms`);
}

{
  const Wd = K.Wounds, base = () => { const k = B.copyKit(B.HEROES['guard.m'].kit); k.cut = {}; k.pros = {}; k.eyes = {}; return k; };
  const ARM = ['hand', 'fore', 'arm'], LEG = ['leg', 'shin', 'thigh'];
  const make = (la, ra, ll, rl, le, re, state) => {
    const k = base(), s = state || 'bandaged';
    if (la === 'fore') k.cut.lFore = s; if (la === 'arm') { k.cut.lArm = s; k.cut.lFore = s; }
    if (ra === 'fore') k.cut.rFore = s; if (ra === 'arm') { k.cut.rArm = s; k.cut.rFore = s; }
    if (ll === 'shin') k.cut.lShin = s; if (ll === 'thigh') { k.cut.lThigh = s; k.cut.lShin = s; }
    if (rl === 'shin') k.cut.rShin = s; if (rl === 'thigh') { k.cut.rThigh = s; k.cut.rShin = s; }
    if (le) k.eyes.l = true;
    if (re) k.eyes.r = true;
    return k;
  };
  let combos = 0, wrong = [];
  for (const la of ARM) for (const ra of ARM) for (const ll of LEG) for (const rl of LEG) for (const le of [false, true]) for (const re of [false, true]) {
    combos++;
    const c = Wd.caps(make(la, ra, ll, rl, le, re)), hands = [la, ra].filter(a => a === 'hand').length, legs = [ll, rl].filter(l => l === 'leg').length;
    const expect = {
      weapon: hands > 0, twoHanded: hands === 2, shield: hands === 2, bow: hands === 2, rope: hands === 2, carry: hands === 2, ladder: hands > 0,
      bindSelf: hands === 2 ? 3 : hands === 1 ? 6 : null, stand: legs === 2, crawl: legs === 2 ? 0 : legs === 0 ? 0.5 : 0.7,
      crutch: legs === 1 && hands > 0, chair: legs < 2, kick: legs === 2, blind: le && re
    };
    for (const [k, v] of Object.entries(expect)) if (c[k] !== v) wrong.push(`${la}/${ra}/${ll}/${rl}/${le}/${re}:${k}`);
    if (c.view.l !== (le ? 'dark' : 'ok') || c.view.r !== (re ? 'dark' : 'ok')) wrong.push('view');
  }
  ok(combos === 324 && !wrong.length, `table of abilities: all ${combos} combinations of lost arms, legs and eyes follow plan 6.2 ${wrong.slice(0, 4).join(' ')}`);
  ok(!Wd.caps(make('hand', 'hand', 'shin', 'leg', false, false, 'fresh')).crutch && !Wd.caps(make('hand', 'hand', 'shin', 'leg', false, false, 'fresh')).chair && Wd.caps(make('hand', 'hand', 'shin', 'leg', false, false, 'fresh')).crawl === 0.7, 'before the bandage a man without a leg can only crawl');
  let pcombos = 0, pwrong = [];
  const ARMP = ['iron', 'hook', 'carved', 'hinge'], LEGP = ['peg', 'willow', 'iron', 'hinge'], EYEP = ['patch', 'glass', 'resin', 'ruby'];
  for (const lp of [null, ...ARMP]) for (const rp of [null, ...ARMP]) for (const sl of [null, ...LEGP]) for (const sr of [null, ...LEGP]) for (const ep of EYEP) {
    pcombos++;
    const k = make(lp ? 'fore' : 'hand', rp ? 'fore' : 'hand', sl ? 'shin' : 'leg', sr ? 'shin' : 'leg', true, false);
    if (lp) { k.pros.lFore = lp; k.cut.lFore = 'healed'; }
    if (rp) { k.pros.rFore = rp; k.cut.rFore = 'healed'; }
    if (sl) { k.pros.lShin = sl; k.cut.lShin = 'healed'; }
    if (sr) { k.pros.rShin = sr; k.cut.rShin = 'healed'; }
    k.eyes.l = ep;
    const c = Wd.caps(k), holds = x => !x || x === 'iron' || x === 'hinge', legs = [sl, sr].map(x => Wd.LEGS[x || 'leg']);
    if (c.twoHanded !== (holds(lp) && holds(rp))) pwrong.push('two ' + lp + rp);
    if (c.weapon !== (holds(lp) || holds(rp))) pwrong.push('weapon ' + lp + rp);
    if (!c.stand || Math.abs(c.run - Math.min(...legs.map(l => l.run))) > 1e-9 || c.sprint !== legs.every(l => l.sprint)) pwrong.push('legs ' + sl + sr);
    if (c.swim !== !(lp === 'iron' || rp === 'iron' || sl === 'iron' || sr === 'iron')) pwrong.push('swim');
    if (c.view.l !== (ep === 'patch' ? 'dark' : ep)) pwrong.push('eye ' + ep);
    if ((lp === 'carved' || rp === 'carved') && c.weapon && !holds(lp === 'carved' ? rp : lp)) pwrong.push('carved');
  }
  ok(!pwrong.length, `with every prosthesis on every stump (${pcombos} combinations) the rules of plan 6.3 hold ${pwrong.slice(0, 4).join(' ')}`);
  const peg = make('hand', 'hand', 'shin', 'leg'); peg.pros.lShin = 'peg'; peg.cut.lShin = 'healed';
  ok(Wd.caps(peg).run === 3.2 && Wd.caps(peg).jump === 0.4 && !Wd.caps(peg).sprint && Wd.caps(peg).loud, 'a wooden leg runs 3.2 m/s, jumps 0.4 m, has no sprint and knocks loudly');
  const carved = make('fore', 'hand', 'leg', 'leg'); carved.pros.lFore = 'carved'; carved.cut.lFore = 'healed';
  const hook = make('fore', 'hand', 'leg', 'leg'); hook.pros.lFore = 'hook'; hook.cut.lFore = 'healed';
  ok(Wd.caps(carved).bow && !Wd.caps(carved).shield && Wd.caps(hook).shield && Wd.caps(hook).rope && !Wd.caps(hook).bow, 'a carved hand holds a bow, a hook holds a shield and a rope ladder');
  ok(Wd.handFor(make('hand', 'fore', 'leg', 'leg')) === 'l' && Wd.handFor(make('fore', 'fore', 'leg', 'leg')) === null, 'without the right hand the weapon goes to the left one');

  const lone = (kit, hp) => { const p = B.person(60, kit, 100, 100, 0, FW); p.fight = C.fighter({ weapon: 'sword' }); p.anim = A.state(); if (hp) p.fight.life = hp; return p; };
  const until = (S, test, max) => { let t = 0; while (t < max && !test()) { const ev = Wd.step(S, 1 / 60); S.time += 1 / 60; t += 1 / 60; S.ev = (S.ev || []).concat(ev); } return t; };
  const one = lone(make('hand', 'fore', 'leg', 'leg', false, false, 'fresh')), S1 = { people: [one], bodies: [], player: null, time: 0 };
  Wd.hurt(one, { cut: 6, part: 6, damage: 10, type: 'chop', material: 'flesh' });
  one.fight.hostile = { fight: {} };
  const t45 = until(S1, () => one.fight.down, 60);
  ok(one.fight.down === 'ko' && Math.abs(t45 - Wd.HEAVY) < 0.05 && S1.ev.some(e => e.kind === 'faint' && e.cause === 'blood') && S1.ev.filter(e => e.kind === 'drip').length > 50, `without a bandage a cut-off arm drops a man in ${t45.toFixed(2)} s and leaves a trail of blood`);
  const hero = { kit: make('hand', 'fore', 'leg', 'leg', false, false, 'fresh'), mv: K.Move.body(FW, 100, 100, 0), fight: C.fighter({ weapon: 'sword' }), bag: [] }, SH = { people: [], bodies: [], player: hero, time: 0 };
  Wd.hurt(hero, { cut: 6, part: 6, damage: 10, type: 'chop', material: 'flesh' });
  const th = until(SH, () => hero.fight.down, 60);
  ok(hero.fight.down === 'ko' && Math.abs(th - 45) < 0.05 && C.apply(SH, []).some(r => r.kind === 'defeat' && r.cause === 'ko'), `the hero without an arm and without a bandage falls unconscious after ${th.toFixed(2)} s (plan: 45 s)`);
  const two = lone(make('fore', 'fore', 'leg', 'leg', false, false, 'fresh')), S2 = { people: [two], bodies: [], player: null, time: 0 };
  Wd.hurt(two, { cut: 6, part: 6, damage: 10, type: 'chop', material: 'flesh' });
  two.fight.hostile = { fight: {} };
  const t30 = until(S2, () => two.fight.down, 60);
  ok(Math.abs(t30 - 30) < 0.1, `two fresh stumps bleed out faster: ${t30.toFixed(1)} s`);
  const stab = lone(base()), S3 = { people: [stab], bodies: [], player: null, time: 0 };
  Wd.hurt(stab, { cut: null, part: 2, damage: 10, type: 'stab', material: 'flesh' });
  Wd.hurt(stab, { cut: null, part: 4, damage: 5, type: 'chop', material: 'flesh' });
  stab.fight.hostile = { fight: {} };
  const life0 = stab.fight.life;
  until(S3, () => false, 70);
  ok(Math.abs(life0 - stab.fight.life - (0.6 * 60 + 0.25 * 40)) < 0.2 && !Wd.bleeding(stab.fight), `a stab in the belly bleeds 0.6 a second for 60 s, a cut 0.25 for 40 s: ${(life0 - stab.fight.life).toFixed(1)} lost`);
  const self = lone(make('hand', 'hand', 'shin', 'leg', false, false, 'fresh')), sack = [{ id: 'bandage', n: 2 }], S4 = { people: [self], bodies: [], player: null, time: 0 };
  self.sack = sack;
  Wd.hurt(self, { cut: 9, part: 9, damage: 5, type: 'chop', material: 'flesh' });
  self.fight.hostile = { fight: {} };
  const b2 = Wd.bind(self, self, sack), tb = until(S4, () => !self.fight.binding, 10);
  ok(b2.ok && b2.time === 3 && Math.abs(tb - 3) < 0.05 && self.kit.cut.lShin === 'bandaged' && !Wd.bleeding(self.fight) && sack[0].n === 1, 'with both hands a man bandages himself in 3 s, the stump is tied and one bandage is gone');
  const half = lone(make('hand', 'fore', 'leg', 'leg', false, false, 'fresh'));
  const b3 = Wd.bind(half, half, [{ id: 'bandage', n: 1 }]);
  const nh = lone(make('fore', 'arm', 'leg', 'leg'));
  ok(b3.ok && b3.time === 6 && Wd.bind(nh, nh, [{ id: 'bandage', n: 1 }]).why === 'hands' && Wd.bind(lone(base()), lone(base()), []).why === 'bandage', 'with one hand it takes 6 s, without hands a man cannot bandage himself');
  Wd.hurt(half, { cut: null, part: 1, damage: 5, type: 'chop', material: 'flesh' });
  ok(half.fight.binding === null, 'a blow during the bandaging breaks it off');
  const helper = lone(base()), hurtOne = lone(make('hand', 'hand', 'leg', 'leg'));
  hurtOne.mv.pos = [100.8, 0, 100];
  Wd.hurt(hurtOne, { cut: null, part: 1, damage: 5, type: 'stab', material: 'flesh' });
  ok(Wd.bind(helper, hurtOne, [{ id: 'bandage', n: 1 }]).time === Wd.BIND.other && !Wd.bind(lone(base()), Object.assign(lone(base()), { mv: K.Move.body(FW, 110, 110, 0) }), [{ id: 'bandage', n: 1 }]).ok, 'another man bandages in 2.5 s, from close by only');
  const npc = lone(make('hand', 'hand', 'shin', 'leg', false, false, 'fresh')), S5 = { people: [npc], bodies: [], player: null, time: 0 };
  npc.sack = [{ id: 'bandage', n: 1 }];
  Wd.hurt(npc, { cut: 9, part: 9, damage: 5, type: 'chop', material: 'flesh' });
  until(S5, () => npc.kit.cut.lShin === 'bandaged', 10);
  ok(npc.kit.cut.lShin === 'bandaged' && !npc.fight.down, 'out of a fight a wounded man with a bandage ties himself up');

  const R = arena('axe', 0.9);
  R.tgt.fight.life = 5;
  R.tick(2);
  R.at(1.25, 0.9);
  R.swing(0, 0.6);
  R.tick(10);
  const ko = R.S.bodies[0];
  ok(ko && ko.cause === 'ko' && ko.ko > 19, 'life spent: the man falls unconscious, not dead');
  for (let i = 0; i < 21 * 60; i++) R.tick(1);
  ok(ko.cause === 'dead' && R.log.some(e => e.kind === 'died'), 'nobody carried him out: after 20 s he is dead');
  const R2 = arena('axe', 0.9);
  R2.tgt.fight.life = 5;
  R2.tick(2);
  R2.at(1.25, 0.9);
  R2.swing(0, 0.6);
  R2.tick(10);
  const ko2 = R2.S.bodies[0];
  R2.hero.bag = [{ id: 'bandage', n: 1 }];
  R2.hero.mv.pos = [ko2.pts[24], 0, ko2.pts[26] + 0.6];
  const tied = Wd.bind(R2.hero, ko2, R2.hero.bag);
  for (let i = 0; i < 25 * 60; i++) R2.tick(1);
  ok(tied.ok && ko2.stable && ko2.cause === 'ko', 'a bandaged unconscious man stays alive');

  const legless = arena('axe', 0.9);
  legless.tick(2);
  legless.at(0.45, 0.9);
  legless.swing(7, 0.6);
  legless.tick(20);
  const crawler = legless.tgt, d0 = Math.hypot(crawler.mv.pos[0] - 100, crawler.mv.pos[2] - 100);
  for (let i = 0; i < 120; i++) legless.tick(1);
  const d1 = Math.hypot(crawler.mv.pos[0] - 100, crawler.mv.pos[2] - 100);
  ok(crawler.mv.crawl && d1 - d0 > 0.8 && d1 - d0 < 1.7 && crawler.fight.hostile === legless.hero, `a man without a leg crawls away from the one who cut it: ${(d1 - d0).toFixed(2)} m in 2 s`);

  const walk = (kit, inp, sec, aid) => { const mv = K.Move.body(FW, 100, 100, 0); mv.limit = Wd.caps(kit); mv.aid = aid || null; run(FW, mv, inp, sec); return mv; };
  const cr1 = walk(make('hand', 'hand', 'shin', 'leg'), { fwd: 1 }, 2), cr2 = walk(make('hand', 'hand', 'thigh', 'shin'), { fwd: 1 }, 2);
  ok(Math.abs(cr1.speed - 0.7) < 0.02 && Math.abs(cr2.speed - 0.5) < 0.02 && cr1.crawl && Math.abs(cr1.eye - M.eyeCrawl) < 0.02, `crawling on one leg ${cr1.speed.toFixed(2)} m/s, without both ${cr2.speed.toFixed(2)} m/s, eyes at 0.45 m`);
  const cu = walk(make('hand', 'hand', 'shin', 'leg'), { fwd: 1, sprint: true }, 2, 'crutch'), jumpCrutch = walk(make('hand', 'hand', 'shin', 'leg'), { fwd: 0, jump: true }, 0.2, 'crutch');
  ok(Math.abs(cu.speed - 1.6) < 0.02 && cu.crutchOn && jumpCrutch.onGround && jumpCrutch.pos[1] < 0.01, 'on a crutch 1.6 m/s even with Shift, no jump');
  const pg = walk(peg, { fwd: 1, sprint: true }, 2);
  ok(Math.abs(pg.speed - 3.2) < 0.02, `a wooden leg runs ${pg.speed.toFixed(2)} m/s and cannot sprint`);
  const noHands = { fwd: 0, side: 0, yaw: 0, use: true }, ladderMv = K.Move.body(W, P.LADDERS[0].x - Math.sin(P.LADDERS[0].yaw) * 0.4, P.LADDERS[0].z + Math.cos(P.LADDERS[0].yaw) * 0.4, P.LADDERS[0].yaw);
  ladderMv.limit = Wd.caps(make('arm', 'arm', 'leg', 'leg'));
  K.Move.step(ladderMv, noHands, 1 / 60, W);
  ok(!ladderMv.ladder, 'without hands there is no climbing a ladder');

  const slopeW = deg => { const g = Math.tan(deg * Math.PI / 180), hAt = (x, z) => -z * g; return { terrain: { heightAt: hAt, normalAt: () => [0, 1, 0], waterAt: () => -Infinity, flowAt: () => [0, 0], SIZE: 400 }, boxes: [], ladders: [], near: () => [], groundAt: hAt }; };
  const climb = deg => { const Ws = slopeW(deg), c = K.Move.chair(1, 100, 100, 0, Ws); for (let i = 0; i < 600; i++) K.Move.rollChair(c, { fwd: 1 }, 1 / 60, Ws); return 100 - c.pos[2]; };
  const flatC = K.Move.chair(1, 100, 100, 0, FW);
  for (let i = 0; i < 300; i++) K.Move.rollChair(flatC, { fwd: 1 }, 1 / 60, FW);
  const downC = K.Move.chair(2, 100, 100, Math.PI, slopeW(10));
  for (let i = 0; i < 600; i++) K.Move.rollChair(downC, {}, 1 / 60, slopeW(10));
  ok(Math.abs(flatC.speed - 3.5) < 0.05 && Math.abs(downC.speed - 9) < 0.01, `a wheelchair rolls 3.5 m/s on the flat and runs away to ${downC.speed.toFixed(1)} m/s downhill`);
  ok(climb(14) > 0.5 && climb(15) <= 0.01, `the chair climbs 14° (${climb(14).toFixed(1)} m in 10 s), not 15°`);
  const stepW = flat([{ x: 100, z: 97, w: 4, d: 1, h: 0.08 }]), sc = K.Move.chair(3, 100, 100, 0, stepW);
  for (let i = 0; i < 240; i++) K.Move.rollChair(sc, { fwd: 1 }, 1 / 60, stepW);
  ok(sc.pos[2] > 97.5 + M.radiusChair - 0.05, 'an 8 cm step stops the chair');
  const pc = K.Move.chair(4, 100, 100, 0, FW);
  for (let i = 0; i < 120; i++) K.Move.rollChair(pc, {}, 1 / 60, FW, { yaw: Math.PI / 2, speed: 1.6 });
  ok(Math.abs(pc.yaw - Math.PI / 2) < 1e-9 && Math.abs(pc.speed - 1.6) < 0.05 && pc.pos[0] > 102.5, 'someone pushing turns and rolls the chair at walking speed');

  const sv = arena('sword', 1.0);
  sv.S.chairs = [K.Move.chair(70, 103, 100, 1, FW)];
  sv.S.chairs[0].rider = 2;
  sv.hero.fight.hand = 'l';
  Wd.hurt(sv.tgt, { cut: null, part: 1, damage: 5, type: 'stab', material: 'flesh' });
  sv.tick(3);
  const pk = JSON.stringify(Sv.pack(sv.S, FW)), back5 = Sv.unpack(JSON.parse(pk), FW);
  ok(JSON.stringify(Sv.pack(back5, FW)) === pk && back5.chairs[0].rider === 2 && back5.player.fight.hand === 'l' && back5.people[0].fight.bleed.medium > 59 && back5.people[0].fight.bleed.at[1] === 'medium', 'save format 3 keeps wheelchairs, the weapon hand and the bleeding');
  const lf = C.fighter({ weapon: 'sword', hand: 'l' }), rf = C.fighter({ weapon: 'sword' });
  lf.aim = rf.aim = { eye: [0, 1.6, 0], yaw: 0, pitch: 0 };
  ok(C.pose(lf).grip[0] < -0.1 && C.pose(rf).grip[0] > 0.1 && C.shieldDisc(Object.assign(lf, { shield: true })).c[0] > 0, 'a left-handed fighter holds the sword on the left and the shield on the right');
}

{
  const Ms = K.Missile, Sn = K.Senses, Wd = K.Wounds, still = () => 0.999999;
  ok(['bow', 'crossbow', 'taxe', 'javelin'].every(id => Dt.LAUNCHERS[id] && Dt.MISSILES[Dt.LAUNCHERS[id].missile] && Dt.ITEMS[Dt.LAUNCHERS[id].item]), 'bow, crossbow, throwing axe and javelin, each with its missile and item');
  ok(Dt.LAUNCHERS.bow.draw === 1 && Dt.LAUNCHERS.bow.elf === 0.7 && Dt.LAUNCHERS.crossbow.reload === 3 && Dt.LAUNCHERS.taxe.draw === 0.5 && Dt.LAUNCHERS.bow.range === 40 && Dt.LAUNCHERS.crossbow.range === 60 && Dt.LAUNCHERS.taxe.range === 12 && Dt.LAUNCHERS.javelin.range === 25, 'draw, reload and aimed ranges follow plan 6.6');
  ok(Object.entries(Dt.RANGED).every(([side, list]) => list.every(([l, share, ammo]) => Dt.LAUNCHERS[l] && share > 0 && share <= 1 && Dt.ITEMS[ammo])) && Dt.RANGED.elf[0][0] === 'bow' && Dt.RANGED.guard[0][0] === 'crossbow' && Dt.RANGED.villain.some(([l]) => l === 'taxe'), 'bows for elves, crossbows for the guard, both and throwing axes for the villain (plan 3.3)');
  const shooter = (weapon, sack, x, z, yaw) => { const kit = B.copyKit(B.HEROES['elf.m'].kit); const p = B.person(80, kit, x, z, yaw || 0, FW); p.sack = sack; p.fight = C.fighter({ weapon, exp: 'veteran' }); p.anim = A.state(); return p; };
  const field = (people, player) => ({ seed: 1, day: 1, hour: 12, time: 0, nextId: 500, version: 0, people, bodies: [], parts: [], items: [], blood: [], missiles: [], stuck: [], chairs: [], player: player || null });
  const fly = (S, max) => { const ev = []; for (let i = 0; i < (max || 600) && (S.missiles.length || !ev.length); i++) { ev.push(...Ms.step(S, 1 / 60, FW, still)); S.time += 1 / 60; if (!S.missiles.length) break; } return ev; };
  const tgtAt = (x, z, o) => { const kit = B.kit('guard', 'm', K.rng(9)); kit.armor = (o && o.armor) || []; kit.head = o && o.head !== undefined ? o.head : null; kit.pros = {}; const p = B.person(81, kit, x, z, Math.PI, FW); p.sack = []; p.fight = C.fighter({ weapon: 'sword', shield: !!(o && o.shield) }); p.fight.aim = AI.idleAim(p); p.anim = A.state(); A.dress(p, p.anim, B.restPose()); return p; };
  const shootAt = (kind, from, tgt, point, power) => {
    const sh = shooter(null, [], from[0], from[1], 0), S = field([tgt]);
    sh.fight.aim = { eye: [from[0], 1.6, from[1]], yaw: 0, pitch: 0 };
    const v = Dt.MISSILES[kind].speed[0] + (Dt.MISSILES[kind].speed[1] - Dt.MISSILES[kind].speed[0]) * (power === undefined ? 1 : power), sol = AI.ballistic(sh.fight.aim.eye, point, v);
    sh.fight.aim.yaw = sol.yaw;
    sh.fight.aim.pitch = sol.pitch;
    Ms.launch(S, sh, kind, power === undefined ? 1 : power, still);
    return { S, ev: fly(S), sh };
  };
  const chestOf = p => { const c = B.capsules(p.kit, p.frames).find(q => q[0] === 1); return [0, 1, 2].map(i => (c[1][i] + c[2][i]) / 2); };
  const far = tgtAt(100, 70), shot30 = shootAt('arrow', [100, 100], far, chestOf(far));
  ok(shot30.ev.some(e => e.kind === 'hit' && (e.part === 1 || e.part === 2)) && shot30.S.stuck.length === 1 && shot30.S.stuck[0].host === 81, 'an arrow aimed over its drop at 30 m hits the chest and stays in it');
  const lob = shooter(null, [], 100, 100, 0), Sl = field([]);
  lob.fight.aim = { eye: [100, 1.6, 100], yaw: 0, pitch: 0 };
  Ms.launch(Sl, lob, 'arrow', 1, still);
  const lobEv = fly(Sl, 900), lobAt = Sl.stuck.length ? Sl.stuck[0].pos : null, drop = lobAt ? 100 - lobAt[2] : 0;
  ok(lobEv.some(e => e.kind === 'thud' && e.material === 'ground') && drop > 25 && drop < 45, `a level arrow falls by its own weight and lands ${drop.toFixed(1)} m away`);
  const eyeT = tgtAt(100, 90), eyeP = (() => { const fr = eyeT.frames, fig = B.figure(eyeT.kit), l = [0.032 * fig.sx, 0.19 * fig.sy, -0.095 * fig.sx]; return [0, 1, 2].map(i => fr[9 + i] + fr[i] * l[0] + fr[3 + i] * l[1] + fr[6 + i] * l[2]); })();
  const eyeShot = shootAt('arrow', [100, 100], eyeT, eyeP);
  const closedT = tgtAt(100, 90, { head: 'closed' }), closedShot = shootAt('arrow', [100, 100], closedT, eyeP);
  ok(eyeShot.ev.some(e => e.kind === 'eye') && eyeT.kit.eyes.r && !closedShot.ev.some(e => e.kind === 'eye') && !(closedT.kit.eyes || {}).r, 'an arrow at the face puts out an eye, a closed helmet keeps it');
  const plateA = tgtAt(100, 85, { armor: ['plate'] }), plateB = tgtAt(100, 85, { armor: ['plate'] });
  const arrowPlate = shootAt('arrow', [100, 100], plateA, chestOf(plateA)), boltPlate = shootAt('bolt', [100, 100], plateB, chestOf(plateB));
  const dmgOf = r => (r.ev.find(e => e.kind === 'hit') || { damage: 0 }).damage;
  ok(dmgOf(boltPlate) > 3 * dmgOf(arrowPlate) && dmgOf(boltPlate) > 25, `plate stops arrows (${dmgOf(arrowPlate).toFixed(1)}), a bolt goes through (${dmgOf(boltPlate).toFixed(1)})`);
  const kinds = new Set();
  for (let d = 3; d <= 10; d += 0.5) { const t1 = tgtAt(100, 100 - d), r = shootAt('taxe', [100, 100], t1, chestOf(t1), 0.8), h = r.ev.find(e => e.kind === 'hit'); if (h) kinds.add(h.type); }
  ok(kinds.has('chop') && kinds.has('crush'), `a spinning axe lands blade first or butt first depending on the distance (${[...kinds].join(', ')})`);
  const sh = tgtAt(100, 92, { shield: true });
  sh.fight.aim = { eye: [100, 1.6, 92], yaw: Math.PI, pitch: 0 };
  C.guard(sh.fight, true, 'right');
  sh.fight.guard.t = 1;
  const jv = shootAt('javelin', [100, 100], sh, chestOf(sh));
  ok(jv.ev.some(e => e.kind === 'block' && e.missile === 'javelin') && sh.fight.shieldLoad === 1 && jv.S.stuck.length === 1, 'a javelin caught by a raised shield sticks in it');
  const fresh = Object.assign({}, sh.fight, { guard: { dir: 'right', t: 0.15, sw: 1 }, shieldLoad: 0 }), heavy = Object.assign({}, sh.fight, { guard: { dir: 'right', t: 0.15, sw: 1 }, shieldLoad: 1 });
  const lift = f => C.shieldDisc(f).c[1];
  ok(lift(fresh) - lift(heavy) > 0.05, 'a shield with a javelin in it comes up three times slower');
  sh.mv = K.Move.body(FW, 100, 92, Math.PI);
  ok(Ms.pull(sh), 'E starts pulling the javelin out');
  for (let i = 0; i < 70; i++) { Ms.step(jv.S, 1 / 60, FW, still); jv.S.time += 1 / 60; }
  ok(!sh.fight.shieldLoad && jv.S.items.some(it => it.item === 'javelin') && !jv.S.stuck.length, 'after a second the javelin is out and lies on the ground');
  const xb = shooter(null, [{ id: 'crossbow', n: 1 }, { id: 'bolt', n: 2 }], 100, 100, 0), Sx = field([xb]);
  xb.fight.aim = { eye: [100, 1.6, 100], yaw: 0, pitch: 0.05 };
  ok(Ms.setMode(xb, 'crossbow') && xb.fight.loaded, 'a crossbow comes loaded');
  xb.fight.switching = 0;
  Ms.press(xb);
  Ms.release(xb, Sx, still);
  ok(!xb.fight.loaded && Sx.missiles.length === 1 && Ms.count(xb, 'bolt') === 2, 'it shoots once and stays empty');
  xb.fight.cool = 0;
  Ms.press(xb);
  ok(xb.fight.reload && xb.fight.reload.time === 3, 'pressing again starts a 3 s reload');
  for (let i = 0; i < 200; i++) { Ms.step(Sx, 1 / 60, FW, still); Sx.time += 1 / 60; }
  ok(xb.fight.loaded && Ms.count(xb, 'bolt') === 1, 'after 3 s it is loaded with the next bolt');
  const oneArm = shooter(null, [{ id: 'crossbow', n: 1 }, { id: 'bolt', n: 2 }], 100, 100, 0);
  oneArm.kit.cut = { lFore: 'bandaged' };
  oneArm.fight.loaded = false;
  Ms.setMode(oneArm, 'crossbow');
  ok(!Ms.reload(oneArm) && Ms.usable(oneArm, 'crossbow'), 'with one hand a crossbow can be held but not reloaded');
  ok(!Ms.usable(Object.assign(shooter(null, [{ id: 'bow', n: 1 }, { id: 'arrow', n: 3 }], 100, 100, 0), { kit: Object.assign(B.copyKit(B.HEROES['elf.m'].kit), { cut: { rFore: 'bandaged' } }) }), 'bow'), 'without a hand there is no bow');
  const man = tgtAt(100, 88), shotMan = shootAt('arrow', [100, 100], man, chestOf(man));
  man.fight.life = -10;
  shotMan.S.people = [man];
  C.apply(shotMan.S, []);
  const corpse = shotMan.S.bodies[0], loot = corpse ? B.belongings(corpse, shotMan.S).filter(x => x.group === 'Стрелы и метательное') : [];
  const bag = [];
  ok(corpse && loot.length === 1 && Ms.inBody(shotMan.S, corpse).length === 1 && B.take(corpse, loot[0].key, bag, shotMan.S) && bag[0].id === 'arrow' && !shotMan.S.stuck.length, 'the arrow stays in the body and can be taken back in the search');

  const watcher = tgtAt(100, 100), runner = tgtAt(100, 45);
  watcher.mv.yaw = 0;
  ok(Sn.sees(watcher, runner, FW, 12) && !Sn.sees(watcher, tgtAt(100, 35), FW, 12) && !Sn.sees(watcher, tgtAt(100, 70), FW, 0) && Sn.sees(watcher, tgtAt(100, 80), FW, 0), 'eyes reach 60 m by day and 25 m at night (plan 6.9)');
  ok(!Sn.sees(Object.assign({}, watcher, { mv: Object.assign({}, watcher.mv, { yaw: Math.PI }) }), runner, FW, 12), 'nobody sees behind his back');
  const bushW = Object.assign({}, FW, { flora: { bushAt: () => true, trunksNear: () => {}, trees: { X: [], Z: [], RAD: [] } } });
  const crouched = tgtAt(100, 93);
  crouched.mv.crouch = true;
  ok(!Sn.sees(watcher, crouched, bushW, 12) && Sn.sees(watcher, Object.assign(tgtAt(100, 95), { mv: Object.assign(K.Move.body(FW, 100, 95, 0), { crouch: true }) }), bushW, 12), 'crouched in undergrowth a man is seen only from 6 m');
  const trunkW = Object.assign({}, FW, { flora: { bushAt: () => false, trunksNear: (x, z, r, fn) => fn(0), trees: { X: [100], Z: [80], RAD: [0.4] } } });
  ok(!Sn.sees(watcher, tgtAt(100, 70), trunkW, 12) && Sn.sees(watcher, tgtAt(101.5, 70), trunkW, 12), 'a trunk on the line of sight hides a man');
  const walker = tgtAt(100, 100);
  walker.mv.speed = 4.5;
  const loud = Sn.loudness(walker);
  walker.mv.crouch = true;
  walker.mv.speed = 1.6;
  const quiet = Sn.loudness(walker);
  walker.mv.crouch = false;
  walker.mv.limit = Wd.caps(Object.assign(B.copyKit(B.HEROES['guard.m'].kit), { cut: { lShin: 'healed' }, pros: { lShin: 'peg' } }));
  walker.mv.speed = 1.6;
  ok(loud === 15 && quiet === 3 && Sn.loudness(walker) > 7 * 1.5, `running is heard from ${loud} m, crouching from ${quiet} m, a wooden leg ${Sn.loudness(walker).toFixed(1)} m away`);

  const armour = a => { const mv = K.Move.body(FW, 100, 100, 0); mv.limit = Wd.caps(Object.assign(B.copyKit(B.HEROES['guard.m'].kit), { armor: a })); run(FW, mv, { fwd: 0 }, 0.5); return mv; };
  ok(armour(['mail']).staminaMax === 90 && armour(['plate']).staminaMax === 75 && armour([]).staminaMax === 100, 'mail takes 10 % of the stamina, plate 25 % (plan 6.7)');
  const lake = { terrain: { heightAt: (x, z) => z < 95 ? -3 : 0, normalAt: () => [0, 1, 0], waterAt: () => 0, flowAt: () => [0, 0], SIZE: 400 }, boxes: [], ladders: [], near: () => [], groundAt: (x, z) => z < 95 ? -3 : 0 };
  const swimmer = K.Move.body(lake, 100, 96, 0), plated = K.Move.body(lake, 100, 96, 0);
  swimmer.limit = Wd.caps(B.copyKit(B.HEROES['guard.m'].kit));
  plated.limit = Wd.caps(Object.assign(B.copyKit(B.HEROES['guard.m'].kit), { armor: ['plate'] }));
  run(lake, swimmer, { fwd: 1 }, 2);
  run(lake, plated, { fwd: 1 }, 2);
  ok(swimmer.pos[2] < 94 && plated.pos[2] > 94.5, 'in plate a man does not go into deep water');
  ok(Wd.caps(Object.assign(B.copyKit(B.HEROES['guard.m'].kit), { head: 'closed' })).slit && !Wd.caps(B.copyKit(B.HEROES['guard.m'].kit)).slit, 'a closed helmet narrows the view to a slit');

  const archer = shooter('knife', [{ id: 'bow', n: 1 }, { id: 'arrow', n: 10 }], 100, 100, 0), foe = tgtAt(100, 80), Sa = field([archer, foe]);
  foe.fight.hostile = archer;
  archer.fight.hostile = foe;
  const pose5 = B.restPose(), aiEv = [];
  for (let i = 0; i < 240; i++) { const r = AI.run(Sa, 1 / 60, FW, still, pose5); aiEv.push(...r.events); Sa.time += 1 / 60; }
  ok(archer.fight.mode === 'bow' || Ms.count(archer, 'arrow') < 10, 'an archer takes up the bow against a man 20 m away');
  ok(Ms.count(archer, 'arrow') < 10 && aiEv.some(e => e.missile === 'arrow'), `and shoots: ${10 - Ms.count(archer, 'arrow')} arrows in 4 s`);
  const thrower = shooter('sword', [{ id: 'javelin', n: 2 }], 100, 100, 0), guardS = tgtAt(100, 88, { shield: true }), Sj = field([thrower, guardS]);
  thrower.kit = B.copyKit(B.HEROES['guard.m'].kit);
  thrower.fight.hostile = guardS;
  guardS.fight.hostile = thrower;
  let raised = false;
  for (let i = 0; i < 180; i++) { AI.run(Sj, 1 / 60, FW, still, pose5); Sj.time += 1 / 60; if (thrower.fight.draw && guardS.fight.guard) raised = true; }
  ok(raised, 'a shield bearer raises the shield when a javelin is drawn back at him');

  const keep4 = st => JSON.stringify(Sv.pack(st, FW));
  const Sv4 = shootAt('arrow', [100, 100], tgtAt(100, 80), [100, 1.3, 80]);
  Ms.launch(Sv4.S, Sv4.sh, 'javelin', 0.5, still);
  Sv4.S.player = Object.assign(Sv4.sh, { pitch: 0, mode: 'first', bag: [] });
  const saved4 = keep4(Sv4.S), back4 = Sv.unpack(JSON.parse(saved4), FW);
  ok(keep4(back4) === saved4 && back4.missiles.length === 1 && back4.stuck.length === 1 && JSON.parse(saved4).v === Sv.VERSION, 'the save keeps flying javelins and arrows stuck in people');
}

{
  const Nv = K.Nav, Wd = K.Wounds, Pl = K.Places;
  const world = (people, o) => Object.assign({ seed: 3, day: 1, hour: 12, time: 0, nextId: 7000, version: 0, people, bodies: [], parts: [], items: [], blood: [], missiles: [], stuck: [], chairs: [], player: null, squad: null, standing: { service: 0, respect: 0, loyalty: 0 } }, o || {});
  const tickW = (S, Wx, sec, stop) => {
    const rnd = K.rng(5), pose = B.restPose(), ev = [];
    for (let i = 0; i < sec * 60; i++) {
      if (S.player && S.player.anim) { S.player.fight.aim = AI.idleAim(S.player); A.update(S.player.anim, S.player.mv, 1 / 60); }
      const r = AI.run(S, 1 / 60, Wx, rnd, pose);
      ev.push(...r.events, ...r.results);
      S.time += 1 / 60;
      if (stop && stop(S, ev)) break;
    }
    return ev;
  };
  const mk = (id, side, x, z, yaw, Wx, act) => { const p = B.member(id, side, x, z, yaw || 0, Wx, act); p.anim = A.state(); return p; };
  const hero = (side, x, z, Wx) => ({ kit: Object.assign(B.copyKit(B.HEROES[side === 'guard' ? 'guard.m' : side === 'elf' ? 'elf.m' : 'villain'].kit), { hero: side === 'guard' ? 'guard.m' : side === 'elf' ? 'elf.m' : 'villain' }), mv: K.Move.body(Wx, x, z, 0), pitch: 0, mode: 'first', bag: [{ id: 'bandage', n: 3 }], fight: C.fighter({ weapon: 'sword' }), anim: A.state(), frames: new Float32Array(132), team: side });
  const plen = (a, pts) => { let s = 0, q = a; for (const r of pts) { s += Math.hypot(r[0] - q[0], r[1] - q[1]); q = r; } return s; };
  const clearWalk = (N, a, pts) => { let q = a; for (const r of pts) { const n = Math.ceil(Math.hypot(r[0] - q[0], r[1] - q[1]) / 0.25); for (let s = 0; s <= n; s++) if (Nv.blocked(N, q[0] + (r[0] - q[0]) * s / n, q[1] + (r[1] - q[1]) * s / n)) return false; q = r; } return true; };
  const dist2 = (p, x, z) => Math.hypot(p.mv.pos[0] - x, p.mv.pos[2] - z);

  ok(['elf', 'guard', 'villain', 'town'].every(s => Dt.NAMES[s] && Dt.NAMES[s].m.length >= 6) && !['Гаврила', 'Сенька', 'Фома', 'Прохор', 'Ерёма', 'Вяз', 'Сыч', 'Рябина', 'Ясень', 'Мох'].some(n => Object.values(Dt.NAMES).some(l => [...l.m, ...(l.f || [])].includes(n))), 'every side has its own names, none taken from the story characters');
  ok(Dt.ENEMIES.elf.includes('guard') && Dt.ENEMIES.guard.includes('villain') && Dt.ENEMIES.villain.includes('elf') && !Dt.ENEMIES.town.length, 'elves, the guard and the villain are at war, the town with nobody');
  ok(Dt.STANDING.elf.command === 30 && Dt.STANDING.elf.most === 4 && Dt.STANDING.guard.command === 14 && Dt.STANDING.villain.command === 0 && Dt.STANDING.guard.rescue === 10 && Dt.STANDING.elf.rescue === 60 && Dt.STANDING.villain.rescue === 60, 'commands and rescue thresholds follow plans 3.3, 6.4, 7.1 and 7.2');
  ok(Dt.COMMANDS.map(c => c.name).join() === 'За мной,Стоять здесь,Строй,Атаковать мою цель,Отход,Стрелять по готовности', 'the six squad commands of plan 6.9');
  ok(Object.keys(Pl.HEALERS).length === 4 && Pl.HEALERS.guard.name === 'лекарь Савва' && Pl.HEALERS.elf.name === 'травница Рябина' && Pl.HEALERS.villain.name === 'костоправ Фрол' && Pl.HEALERS.town.name === 'лекарь Аким', 'a healer for each side (plan 6.4)');
  ok(Object.values(Pl.HEALERS).concat(Object.values(Pl.PRISONS)).every(h => !Nv.blocked(Nv.of(W), h.at[0], h.at[1])), 'every healer and prison door can be walked to');

  const Wwall = flat([{ x: 100, z: 90, w: 30, d: 1, h: 3 }]), Nw = Nv.of(Wwall), around = Nv.find(Nw, [100, 100], [100, 80]);
  ok(around.ok && !Nv.line(Nw, [100, 100], [100, 80]) && plen([100, 100], around.pts) > 24 && clearWalk(Nw, [100, 100], around.pts), `a path goes round a 30 m wall: ${plen([100, 100], around.pts).toFixed(1)} m instead of 20`);
  const gapW = gap => flat([{ x: 100 - gap / 2 - 7.5, z: 90, w: 15, d: 1, h: 3 }, { x: 100 + gap / 2 + 7.5, z: 90, w: 15, d: 1, h: 3 }]);
  const g14 = Nv.find(Nv.of(gapW(1.4)), [100, 100], [100, 80]), g06 = Nv.find(Nv.of(gapW(0.6)), [100, 100], [100, 80]);
  ok(g14.ok && plen([100, 100], g14.pts) < 21 && g06.ok && plen([100, 100], g06.pts) > 30, `a 1.4 m gate lets a man through (${plen([100, 100], g14.pts).toFixed(1)} m), a 0.6 m slit does not (${plen([100, 100], g06.pts).toFixed(1)} m round the wall)`);
  const gateW = gapW(1.4), gm = mk(7101, 'guard', 100, 100, Math.PI, gateW, { kind: 'stand', post: [100, 80], face: Math.PI }), Sg = world([gm]);
  tickW(Sg, gateW, 30, () => dist2(gm, 100, 80) < 1);
  ok(dist2(gm, 100, 80) < 1 && !(Sg.stats && Sg.stats.stuck), `a man walks through the 1.4 m gate to his post in ${Sg.time.toFixed(1)} s`);
  const bushy = Object.assign(flat(), { flora: { bushAt: (x, z) => x > 95 && x < 105 && z > 90 && z < 110, trunksNear: () => {}, trees: { X: [], Z: [], RAD: [] }, elder: null } });
  const Nb = Nv.of(bushy), gp = Nv.find(Nb, [100, 120], [100, 80], { side: 'guard' }), ep = Nv.find(Nb, [100, 120], [100, 80], { side: 'elf' });
  ok(plen([100, 120], ep.pts) < 40.5 && plen([100, 120], gp.pts) > 41 && gp.pts.every(q => !bushy.flora.bushAt(q[0], q[1])), `an elf walks straight through the undergrowth (${plen([100, 120], ep.pts).toFixed(1)} m), a man goes round it (${plen([100, 120], gp.pts).toFixed(1)} m)`);

  const NW = Nv.of(W), far = Nv.route(NW, [845, 1338], [1146, 700], { side: 'guard' });
  ok(far.ok && far.road && plen([845, 1338], far.pts) < 1.15 * Math.hypot(1146 - 845, 700 - 1338), `from Mostovitsa to the palace gate by the roads: ${plen([845, 1338], far.pts).toFixed(0)} m`);
  const trailE = Nv.route(NW, [350, 712], [750, 760], { side: 'elf' }), trailG = Nv.route(NW, [350, 712], [750, 760], { side: 'guard' });
  const onTrail = r => r.pts.some(q => Math.hypot(q[0] - 420, q[1] - 692) < 1) && r.pts.some(q => Math.hypot(q[0] - 520, q[1] - 710) < 1);
  ok(onTrail(trailE) && !onTrail(trailG), 'the hidden elf trail from the Roots to the ford is open to elves only');
  ok(Nv.graph(NW).nodes.length > 60 && Nv.graph(NW).nodes.some(nd => nd.out.some(e => e.trail)), 'the road graph joins roads and trails at shared points');

  const Gf = Pl.GROUNDS.forest, march = [0, 1, 2, 3, 4].map(i => mk(7110 + i, 'guard', Gf.a[0] + (i - 2) * 1.5, Gf.a[1], Math.PI, W, { kind: 'stand', post: [Gf.a[0] + (i - 2) * 1.5, Gf.a[1] + 60], face: Math.PI }));
  const Sm = world(march);
  let trunksOnWay = 0;
  F.trunksNear(Gf.a[0], Gf.a[1] + 30, 30, t => { if (Math.abs(F.trees.X[t] - Gf.a[0]) < 5 && F.trees.Z[t] > Gf.a[1] && F.trees.Z[t] < Gf.a[1] + 60) trunksOnWay++; });
  tickW(Sm, W, 90, () => march.every(p => dist2(p, p.act.post[0], p.act.post[1]) < 3));
  ok(trunksOnWay > 15 && march.every(p => dist2(p, p.act.post[0], p.act.post[1]) < 3) && !(Sm.stats && Sm.stats.stuck), `five guards cross 60 m of thicket (${trunksOnWay} trunks on the way) in ${Sm.time.toFixed(1)} s without getting stuck`);

  const crawler = mk(7120, 'villain', 100, 100, 0, FW), chaser = hero('guard', 100, 93, FW);
  crawler.kit.cut = { lThigh: 'bandaged' };
  crawler.kit.pros = {};
  const Sc = world([crawler], { player: chaser }), cev = tickW(Sc, FW, 5);
  ok(dist2(crawler, 100, 93) > 9 && crawler.mv.crawl && cev.some(e => e.kind === 'call' && e.who === crawler), `without a leg a man crawls away (${(dist2(crawler, 100, 93) - 7).toFixed(1)} m in 5 s) and calls his own`);

  const armedFoe = () => { const f = mk(7131, 'villain', 100, 92, Math.PI, FW); f.fight = C.fighter({ weapon: 'axe' }); f.sack = []; return f; };
  const knifeMan = mk(7130, 'guard', 100, 100, 0, FW), fk = armedFoe();
  knifeMan.fight = C.fighter({ weapon: null });
  knifeMan.sack = [{ id: 'knife', n: 1 }];
  const Sk = world([knifeMan, fk]), kev = tickW(Sk, FW, 0.5);
  ok(knifeMan.fight.weapon === 'knife' && !knifeMan.sack.length && kev.some(e => e.kind === 'knife'), 'a man without his weapon takes the knife from his sack');
  const gives = mk(7132, 'guard', 100, 100, 0, FW), fs = armedFoe();
  gives.fight = C.fighter({ weapon: null });
  gives.sack = [];
  const Ss = world([gives, fs]), sev = tickW(Ss, FW, 1);
  ok(gives.state === 'surrender' && gives.mv.kneel && sev.some(e => e.kind === 'surrender') && fs.fight.hostile !== gives, 'without a weapon and a knife he kneels and surrenders, and the foe stops attacking him');
  A.update(gives.anim, gives.mv, 1);
  const kneelPose = A.pose(gives.anim, gives.kit);
  ok(kneelPose.lKnee > 1.4 && kneelPose.lSh > 2.4, 'a man who surrendered kneels with his hands up');

  const captor = mk(7140, 'guard', 1180, 640, 0, W), prisoner = mk(7141, 'villain', 1183, 643, 0, W);
  prisoner.state = 'surrender';
  prisoner.fight = C.fighter({ weapon: null });
  const Sp = world([captor, prisoner]), pev = tickW(Sp, W, 80, S => prisoner.state === 'jailed');
  ok(pev.some(e => e.kind === 'tied' && e.who === prisoner) && prisoner.state === 'jailed' && dist2(prisoner, Pl.PRISONS.guard.at[0], Pl.PRISONS.guard.at[1]) < 6, `a guard ties the man who surrendered and leads him to the guardhouse (${Sp.time.toFixed(0)} s)`);
  const freed = mk(7142, 'villain', 100, 100, 0, FW);
  freed.state = 'bound';
  AI.release(freed, world([freed]));
  ok(!freed.state && freed.witness && Math.hypot(freed.act.post[0] - Pl.HEALERS.villain.at[0], freed.act.post[1] - Pl.HEALERS.villain.at[1]) < 0.01, 'a man let go goes home to his side and remembers who let him go');

  const fallBody = (S, side, id, x, z) => { const q = mk(id, side, x, z, 0, FW); q.frames = null; A.dress(q, q.anim, B.restPose()); q.fight.life = -5; S.people.push(q); C.apply(S, []); return S.bodies[S.bodies.length - 1]; };
  const medic = mk(7150, 'guard', 100, 100, 0, FW);
  medic.sack = [{ id: 'bandage', n: 1 }];
  const Sa = world([medic]), hurtBody = fallBody(Sa, 'guard', 7151, 100, 110);
  ok(hurtBody.who && hurtBody.who.team === 'guard' && hurtBody.ko > 19, 'a fallen man keeps his side, name and debt in his body');
  const aev = tickW(Sa, FW, 12, S => hurtBody.stable);
  ok(hurtBody.stable && aev.some(e => e.kind === 'bound' && e.who === medic && e.to === hurtBody) && !medic.sack.length, `a free friend runs to the fallen and bandages him in ${Sa.time.toFixed(1)} s`);

  const carrier = mk(7160, 'elf', 395, 708, 0, W), Sh = world([carrier]);
  const ebody = (() => { const q = mk(7161, 'elf', 392, 712, 0, W); A.dress(q, q.anim, B.restPose()); q.fight.life = -5; Sh.people.push(q); C.apply(Sh, []); return Sh.bodies[0]; })();
  ebody.stable = true;
  ebody.frozen = true;
  const hev = tickW(Sh, W, 40, S => S.people.some(q => q.healed));
  const cured = Sh.people.find(q => q.healed);
  ok(cured && cured.id === 7161 && !Sh.bodies.length && hev.some(e => e.kind === 'healed' && e.by === carrier.id) && dist2(cured, Pl.HEALERS.elf.at[0], Pl.HEALERS.elf.at[1]) < 4, `when the fight is over a friend carries the bandaged man to the herbalist (${Sh.time.toFixed(0)} s)`);
  ok(cured && cured.team === 'elf' && cured.name === ebody.who.name && !Object.values(cured.kit.cut || {}).includes('fresh'), 'the healed man stands up at the healer with his own name');

  const downHero = (debt, standing) => {
    const P = hero('guard', 100, 100, FW), mate = mk(7170, 'guard', 100, 118, Math.PI, FW);
    mate.debt = debt;
    mate.sack = [{ id: 'bandage', n: 1 }];
    P.fight.life = -5;
    P.fight.bleed.heavy = 30;
    Wd.knockOut(P.fight);
    const S = world([mate], { player: P, standing: Object.assign({ service: 0, respect: 0, loyalty: 0 }, standing || {}) });
    return { S, P, mate };
  };
  const r1 = downHero(1), rev = tickW(r1.S, FW, 15, (S, ev) => ev.some(e => e.kind === 'rescued'));
  ok(rev.some(e => e.kind === 'rescued' && e.by === r1.mate) && r1.P.fight.stable, `a friend with a debt runs to the fallen hero and bandages him in ${r1.S.time.toFixed(1)} s`);
  const koLeft = r1.P.fight.ko;
  tickW(r1.S, FW, 1);
  ok(r1.P.fight.ko === koLeft, 'a bandaged hero does not bleed out while he waits');
  const out = AI.carryOut(r1.S, FW);
  ok(out.by === r1.mate && !r1.P.fight.down && r1.P.fight.life === 60 && r1.S.hour === 18 && Math.hypot(r1.P.mv.pos[0] - Pl.HEALERS.guard.at[0], r1.P.mv.pos[2] - Pl.HEALERS.guard.at[1]) < 2 && !r1.P.fight.weapon, 'he is carried to the infirmary: six hours later he wakes there without the weapon he held');
  const r0 = downHero(0), nev = tickW(r0.S, FW, 21);
  ok(!nev.some(e => e.kind === 'rescued') && nev.some(e => e.kind === 'unrescued' && e.who === r0.P), 'nobody owes him and his service is low: nobody comes');
  const rs = downHero(0, { service: 10 }), sev2 = tickW(rs.S, FW, 15, (S, ev) => ev.some(e => e.kind === 'rescued'));
  ok(sev2.some(e => e.kind === 'rescued'), 'with service 10 the guard carries him out anyway');

  const lifter = hero('guard', 100, 100, FW);
  lifter.mv.load = 'carry';
  run(FW, lifter.mv, { fwd: 1, sprint: true }, 2);
  const dragger = hero('guard', 100, 100, FW);
  dragger.mv.load = 'drag';
  run(FW, dragger.mv, { fwd: 1, sprint: true }, 2);
  ok(Math.abs(lifter.mv.speed - 2.2) < 0.05 && Math.abs(dragger.mv.speed - 0.8) < 0.05, 'with a man on the shoulder 2.2 m/s, dragging him 0.8 m/s (plan 6.4)');
  ok(Wd.caps(Object.assign(B.copyKit(B.HEROES['guard.m'].kit), { cut: { lFore: 'bandaged' } })).carry === false && Wd.caps(Object.assign(B.copyKit(B.HEROES['guard.m'].kit), { cut: { lFore: 'bandaged' } })).drag, 'without a hand he can only drag');
  const Sl = world([], { player: hero('guard', 100, 100, FW) }), lb = fallBody(Sl, 'guard', 7180, 101, 101);
  AI.lift(Sl, lb, Sl.player);
  Sl.player.carry = lb;
  Sl.player.mv.load = 'carry';
  tickW(Sl, FW, 0.2);
  const pelvis = [lb.frames[2 * 12 + 9], lb.frames[2 * 12 + 10], lb.frames[2 * 12 + 11]];
  ok(lb.carrier === 'player' && Math.hypot(pelvis[0] - 100, pelvis[2] - 100) < 0.4 && pelvis[1] > 1.3, 'the carried man lies across the shoulders');
  AI.putDown(Sl, lb);
  ok(!lb.carrier && !lb.frozen && !Sl.player.mv.load, 'G puts him down and he falls as a body again');

  const Sd = world([], { player: hero('guard', 100, 100, FW) }), hurtMate = mk(7190, 'guard', 100.8, 100, 0, FW);
  hurtMate.fight.bleed.medium = 40;
  hurtMate.sack = [];
  Sd.people.push(hurtMate);
  Wd.bind(Sd.player, hurtMate, Sd.player.bag);
  tickW(Sd, FW, 3);
  ok(hurtMate.debt === 1, 'bandaging a friend makes him owe the hero one');
  const Sdl = world([], { player: hero('guard', Pl.HEALERS.guard.at[0], Pl.HEALERS.guard.at[1] - 2, W) }), db = (() => { const q = mk(7191, 'guard', Pl.HEALERS.guard.at[0] + 1, Pl.HEALERS.guard.at[1] - 3, 0, W); A.dress(q, q.anim, B.restPose()); q.fight.life = -5; Sdl.people.push(q); C.apply(Sdl, []); return Sdl.bodies[0]; })();
  db.stable = true;
  AI.lift(Sdl, db, Sdl.player);
  const dev = [];
  ok(AI.healerNear(Sdl, Sdl.player.mv.pos, 'guard', 4) && AI.deliver(Sdl, db, W, 'player', dev) && Sdl.people.find(q => q.id === 7191).debt === 2, 'carrying a friend to the healer makes him owe two');

  const oneEye = mk(7200, 'guard', 100, 100, 0, FW), twoEyes = mk(7201, 'guard', 100, 100, 0, FW), mark = mk(7202, 'villain', 100, 90, 0, FW);
  oneEye.kit.eyes = { r: true };
  for (let i = 0; i < 90; i++) { AI.aimAt(oneEye, mark, 1 / 60); oneEye.mv.yaw = oneEye.fight.aim.yaw; AI.aimAt(twoEyes, mark, 1 / 60); twoEyes.mv.yaw = twoEyes.fight.aim.yaw; }
  ok(Math.abs(oneEye.mv.yaw - 0.25) < 0.02 && Math.abs(twoEyes.mv.yaw) < 0.02, 'a man without his right eye turns his good side to the foe');

  const squadOf = n => { const P = hero('guard', 100, 100, FW); const list = Array.from({ length: n }, (v, i) => { const q = mk(7210 + i, 'guard', 98 + i, 104, 0, FW); q.squad = 'player'; return q; }); return { P, list, S: world(list.slice(), { player: P, squad: { order: 'follow', fire: false, at: null, face: 0 } }) }; };
  const sq = squadOf(4);
  ok(!AI.canCommand(sq.S).ok && /14/.test(AI.canCommand(sq.S).why), 'a guard below the rank of ten-leader cannot command');
  sq.S.standing.service = 14;
  ok(AI.canCommand(sq.S).ok && AI.canCommand(sq.S).most === 10, 'a ten-leader commands up to ten');
  ok(AI.canCommand(Object.assign(world([], { player: hero('villain', 100, 100, FW) }), { people: [Object.assign(mk(7219, 'villain', 100, 104, 0, FW), { squad: 'player' })] })).ok, 'the villain commands from the start');
  AI.order(sq.S, 'follow');
  tickW(sq.S, FW, 6);
  ok(sq.list.every(q => { const s = AI.slotOf(q, sq.S); return Math.hypot(q.mv.pos[0] - s[0], q.mv.pos[2] - s[1]) < 1.5 && s[1] > 101; }), '«За мной»: the squad keeps behind the hero');
  AI.order(sq.S, 'line');
  tickW(sq.S, FW, 8);
  const slots = sq.list.map(q => AI.slotOf(q, sq.S));
  ok(sq.list.every((q, i) => Math.hypot(q.mv.pos[0] - slots[i][0], q.mv.pos[2] - slots[i][1]) < 0.8) && slots.every(s => Math.abs(s[1] - 97.5) < 0.01) && Math.abs(Math.atan2(Math.sin(sq.list[0].mv.yaw), Math.cos(sq.list[0].mv.yaw))) < 0.2, '«Строй»: one rank 1.3 m apart in front of the hero, facing his way');
  AI.order(sq.S, 'hold');
  const held = sq.list.map(q => [q.mv.pos[0], q.mv.pos[2]]);
  sq.P.mv.pos = [100, 0, 120];
  tickW(sq.S, FW, 4);
  ok(sq.list.every((q, i) => Math.hypot(q.mv.pos[0] - held[i][0], q.mv.pos[2] - held[i][1]) < 0.8), '«Стоять здесь»: they stay where they stood');
  const foe = mk(7230, 'villain', 100, 80, 0, FW);
  foe.fight = C.fighter({ weapon: 'axe' });
  sq.S.people.push(foe);
  ok(AI.order(sq.S, 'attack', foe).ok && sq.list.every(q => q.fight.hostile === foe), '«Атаковать мою цель»: everyone goes for the man under the crosshair');
  AI.order(sq.S, 'retreat');
  const d0 = sq.list.map(q => dist2(q, 100, 120));
  tickW(sq.S, FW, 2);
  ok(sq.list.every((q, i) => (q.brain.job.kind === 'retreat' || q.brain.retreated) && dist2(q, 100, 120) < d0[i] - 2), '«Отход»: they leave the fight and run back to the hero');
  const shooters = squadOf(1), sh0 = shooters.list[0], lurker = mk(7240, 'villain', 100, 80, 0, FW);
  sh0.sack = [{ id: 'crossbow', n: 1 }, { id: 'bolt', n: 10 }];
  sh0.mv.yaw = 0;
  shooters.S.people.push(lurker);
  shooters.S.standing.service = 14;
  AI.order(shooters.S, 'hold');
  tickW(shooters.S, FW, 1);
  const quiet = !sh0.fight.hostile;
  AI.order(shooters.S, 'fire');
  tickW(shooters.S, FW, 1);
  ok(quiet && sh0.fight.hostile === lurker && shooters.S.squad.fire, '«Стрелять по готовности»: without it the squad does not open fire on a foe 24 m away, with it they do');

  const gar = B.garrison(W, 500), posts = Pl.POSTS.length, walkers = Pl.PATROLS.reduce((s, r) => s + r.n, 0);
  ok(gar.length === posts + walkers && gar.every(q => q.team && q.name && q.debt === 0) && gar.filter(q => q.act.kind === 'walk').length === walkers, `${posts} posts and ${walkers} men on patrol, each with a side and a name`);
  ok(gar.every(q => !Nv.blocked(NW, q.mv.pos[0], q.mv.pos[2])), 'posts and patrols stand on walkable ground');

  const keep5 = st => JSON.stringify(Sv.pack(st, FW));
  const S5 = world([], { player: hero('guard', 100, 100, FW), squad: { order: 'line', fire: true, at: [100, 97.5], face: 0.5 }, standing: { service: 14, respect: 0, loyalty: 0 } });
  const led = mk(7250, 'villain', 101, 101, 0, FW), mate5 = mk(7251, 'guard', 99, 101, 0, FW);
  led.state = 'led';
  led.leader = 'player';
  led.captor = 'player';
  mate5.squad = 'player';
  mate5.debt = 3;
  S5.people.push(led, mate5);
  const b5 = fallBody(S5, 'guard', 7252, 102, 99);
  b5.who.nearHero = true;
  b5.carrier = 'player';
  const saved5 = keep5(S5), back5 = Sv.unpack(JSON.parse(saved5), FW);
  ok(keep5(back5) === saved5 && JSON.parse(saved5).v === Sv.VERSION && back5.squad.order === 'line' && back5.standing.service === 14 && back5.player.team === 'guard', 'save format 5 keeps the squad order and the standing');
  const bl = back5.people.find(q => q.id === 7250), bm = back5.people.find(q => q.id === 7251);
  ok(bl.state === 'led' && bl.leader === 'player' && bm.squad === 'player' && bm.debt === 3 && bm.name === mate5.name && back5.bodies[0].who.nearHero && back5.bodies[0].carrier === 'player', 'prisoners, debts, names and the carried man survive a save');
}

{
  const Bs = K.Beasts, SP = Bs.SPECIES, Wd = K.Wounds;
  const wild = (o) => Object.assign({ seed: 5, day: 1, hour: 23, time: 0, nextId: 20000, version: 0, people: [], bodies: [], parts: [], items: [], blood: [], missiles: [], stuck: [], chairs: [], player: null, beasts: [], carcasses: [] }, o || {});
  const quiet = S => { S.fauna = {}; for (const G of Bs.GROUPS) S.fauna[G.id] = { count: 0, max: 0, lost: 0, day: 999, active: false }; return S; };
  const spin = (S, Wx, sec, stop) => { const rnd = K.rng(11), pose = B.restPose(), ev = []; for (let i = 0; i < sec * 60; i++) { if (S.player && S.player.anim) { S.player.fight.aim = AI.idleAim(S.player); A.update(S.player.anim, S.player.mv, 1 / 60); } const r = AI.run(S, 1 / 60, Wx, rnd, pose); ev.push(...r.events, ...r.results); S.time += 1 / 60; if (stop && stop(S, ev)) break; } return ev; };
  const beast = (S, kind, x, z, yaw, o) => { const b = Bs.make(S.nextId++, kind, x, z, yaw || 0, o && o.W || FW, o); b.home = o && o.home || [x, z]; S.beasts.push(b); return b; };
  const walker = (x, z, yaw, Wx) => ({ kit: Object.assign(B.copyKit(B.HEROES['guard.m'].kit), { hero: 'guard.m' }), mv: K.Move.body(Wx || FW, x, z, yaw || 0), pitch: 0, mode: 'first', bag: [{ id: 'bandage', n: 2 }, { id: 'knife', n: 1 }], fight: C.fighter({ weapon: 'sword' }), anim: A.state(), frames: new Float32Array(132), team: 'guard' });
  const d2 = (a, x, z) => Math.hypot(a.mv.pos[0] - x, a.mv.pos[2] - z);

  const plan = ['wolf', 'bear', 'boar', 'deer', 'hare', 'fox', 'goat', 'dog', 'cow', 'pig', 'chicken', 'horse', 'ox', 'eagle', 'crow'];
  ok(plan.every(k => SP[k]) && Object.keys(SP).length === plan.length, 'every beast of plan 6.16 and no monsters');
  ok(Bs.PARTS.length === 13 && Bs.PARTS.join() === 'head,neck,chest,croup,tail,lfUp,lfLo,rfUp,rfLo,lhUp,lhLo,rhUp,rhLo', 'a beast body: head, neck, chest, croup, tail and four legs of two parts (plan 11.6)');
  ok(plan.every(k => SP[k].cut >= 25 && SP[k].cut <= 60) && SP.bear.cut === 60 && SP.hare.cut === 25 && SP.wolf.cut === 35, 'legs come off at 25–60 by the size of the beast');
  ok(plan.filter(k => SP[k].headCut).every(k => ['fox', 'hare', 'chicken', 'eagle', 'crow'].includes(k)), 'only small beasts lose their heads');
  ok(SP.wolf.yield[0].join() === 'wolfHide,1' && K.Data.ITEMS.wolfHide.cost === 15 && K.Data.ITEMS.bearHide.cost === 60 && K.Data.ITEMS.boarHide.cost === 20 && K.Data.ITEMS.deerHide.cost === 25 && K.Data.ITEMS.hareFur.cost === 5 && K.Data.ITEMS.foxFur.cost === 8 && K.Data.ITEMS.goatHide.cost === 12 && SP.bear.yield.some(y => y[0] === 'bearFat'), 'hides, meat and fat as plan 6.16 prices them');
  const zoneOf = G => T.zoneAt(G.at[0], G.at[1]), ZONES = { wolf: [3, 4], bear: [3, 4], boar: [3], deer: [3], hare: [1, 2], fox: [1, 2], goat: [4], eagle: [4], cow: [1, 2], pig: [1, 2], chicken: [1, 2], dog: [1, 2], horse: [1, 2], ox: [1, 2] };
  const wrong = Bs.GROUPS.filter(G => !ZONES[G.kind].includes(zoneOf(G)));
  ok(!wrong.length, 'every herd, pack and den lies in its zone (plan 5.3): ' + (wrong.map(G => G.id + ':' + zoneOf(G)).join(', ') || 'all'));
  ok(Bs.GROUPS.filter(G => !SP[G.kind].fly && !SP[G.kind].climb).every(G => !K.Nav.blocked(K.Nav.of(W), G.at[0], G.at[1])) && Bs.GROUPS.filter(G => SP[G.kind].climb).every(G => T.normalAt(G.at[0], G.at[1])[1] < 0.9 && T.waterAt(G.at[0], G.at[1]) < T.heightAt(G.at[0], G.at[1])), 'every den and pasture can be walked to, goats keep to the crags');
  ok(Bs.GROUPS.some(G => G.kind === 'bear' && zoneOf(G) === 3) && Bs.GROUPS.some(G => G.kind === 'bear' && zoneOf(G) === 4) && Bs.GROUPS.filter(G => G.kind === 'wolf').length >= 4 && Bs.GROUPS.filter(G => G.kind === 'boar').length === 2, 'a bear in the forest gully and one above the mines, four wolf dens, boars at the swamp and in the oak wood');
  const Sf = wild(), F0 = Bs.fauna(Sf);
  ok(Bs.GROUPS.every(G => F0[G.id].count >= G.n[0] && F0[G.id].count <= G.n[1]), 'each group starts with its number of beasts');
  F0['wolf-south'].count = 0;
  Sf.day = 7;
  Bs.regrow(Sf);
  ok(F0['wolf-south'].count === F0['wolf-south'].max, 'a pack that was wiped out grows back in 5–7 days');
  Sf.focus = [535, 0, 931];
  Bs.census(Sf, W);
  ok(Sf.beasts.filter(b => b.group === 'wolf-south').length === F0['wolf-south'].count && F0['wolf-south'].active, 'near the hero the pack appears at its den');
  Sf.focus = [1400, 0, 1400];
  Bs.census(Sf, W);
  ok(!Sf.beasts.some(b => b.group === 'wolf-south') && !F0['wolf-south'].active, 'far away it lives on as a number');

  const Sk = quiet(wild({ hour: 12 })), sk = {};
  for (const k of plan) sk[k] = beast(Sk, k, 100 + plan.indexOf(k) * 4, 100, 0);
  for (const b of Sk.beasts) { b.mv.speed = 0; A.beastUpdate(b.anim, b, 0.2); Bs.fk(b, A.beastPose(b.anim, SP[b.beast], b), FW); }
  const footY = b => Math.min(...(SP[b.beast].bird ? [10, 12] : [6, 8, 10, 12]).map(i => b.frames[i * 12 + 10] - (SP[b.beast].body[i < 9 ? 'fl' : 'hl']) * b.frames[i * 12 + 4]));
  ok(plan.filter(k => !SP[k].fly).every(k => Math.abs(footY(sk[k])) < 0.12), 'standing beasts touch the ground with their feet: ' + plan.filter(k => !SP[k].fly).map(k => k + ' ' + footY(sk[k]).toFixed(2)).filter(s => Math.abs(+s.split(' ')[1]) >= 0.12).join(', '));
  ok(plan.every(k => B.capsules(sk[k].kit, sk[k].frames).length >= 9), 'every beast has hit shapes for its parts');
  const wf = sk.wolf;
  for (const [sp, gait] of [[1.5, 'walk'], [3.6, 'trot'], [10, 'run']]) { wf.mv.speed = sp; for (let i = 0; i < 40; i++) A.beastUpdate(wf.anim, wf, 1 / 60); ok(wf.anim.gait === gait, `a wolf at ${sp} m/s goes at a ${gait}`); }
  const models = K.Models.library().meshes;
  ok(plan.every(k => Bs.PARTS.every(p => models['b.' + k + '.' + p])) && models['b.deer.head.f'], 'a mesh for every part of every beast, a hind without antlers');

  const Sm = quiet(wild({ hour: 12 })), axeman = walker(100, 100, 0), wolf = beast(Sm, 'wolf', 100, 98.5, Math.PI);
  Sm.player = axeman;
  A.beastUpdate(wolf.anim, wolf, 0.1);
  Bs.fk(wolf, A.beastPose(wolf.anim, SP.wolf, wolf), FW);
  const legCap = B.capsules(wolf.kit, wolf.frames).find(c => c[0] === 5), legAt = [0, 1, 2].map(i => (legCap[1][i] + legCap[2][i]) / 2);
  const att = { fight: { weapon: 'axe', act: { kind: 'swing', power: 1.1 }, exp: 'veteran', aim: { eye: [100, 1.6, 100] } }, mv: { pos: [100, 0, 100], tired: false } }, mev = [];
  Bs.struck(Sm, att, wolf, { part: 5, tag: 'leg', at: legAt, onBlade: true }, 'chop', mev, () => 0.9, axeman);
  ok(mev.some(e => e.kind === 'maim' && e.leg === 'lf') && Bs.legsLeft(wolf.kit) === 3 && Sm.carcasses.some(c => c.piece), 'an axe takes off a wolf leg and the leg lies on the ground');
  const before = d2(wolf, 100, 100);
  spin(Sm, FW, 4);
  ok(Sm.beasts.includes(wolf) && wolf.mv.lame && wolf.brain.state === 'flee' && d2(wolf, 100, 100) > before + 3, `a wolf without a leg limps away (${(d2(wolf, 100, 100) - before).toFixed(1)} m in 4 s)`);
  Bs.struck(Sm, att, wolf, { part: 11, tag: 'leg', at: wolf.mv.pos.slice(), onBlade: true }, 'chop', mev, () => 0.9, axeman);
  spin(Sm, FW, 0.2);
  ok(!Sm.beasts.includes(wolf) && Sm.carcasses.some(c => c.id === wolf.id && !c.piece), 'without two legs it falls and dies');
  const hare = beast(Sm, 'hare', 100, 92, 0);
  Bs.struck(Sm, Object.assign({}, att, { fight: Object.assign({}, att.fight, { weapon: 'sword' }) }), hare, { part: 1, tag: 'neck', at: hare.mv.pos.slice(), onBlade: true }, 'chop', mev, () => 0.9, axeman);
  spin(Sm, FW, 0.1);
  ok(mev.some(e => e.kind === 'maim' && e.head && e.beast === 'hare') && !Sm.beasts.includes(hare), 'a sword cuts off the head of a hare');

  const Sp = quiet(wild({ hour: 23 })), lone = walker(100, 100, 0);
  lone.fight.shield = true;
  Sp.player = lone;
  Sp.fauna.pk = { count: 4, max: 4, lost: 0, day: 1, active: true };
  const pack = [0, 1, 2, 3].map(i => beast(Sp, 'wolf', 100 + Math.cos(i * 1.6) * 14, 100 + Math.sin(i * 1.6) * 14, 0, { group: 'pk', leader: i === 0, home: [140, 140] }));
  const pev = spin(Sp, FW, 25, (S, ev) => ev.some(e => e.kind === 'hit' && e.to === lone));
  const bite = pev.find(e => e.kind === 'hit' && e.to === lone);
  ok(bite && bite.type === 'bite' && lone.fight.bleed.medium > 50, 'at night the pack goes for a lone man; a bite opens medium bleeding (plan 6.2)');
  pack[0].fight.life = -1;
  const fev = spin(Sp, FW, 6);
  ok(fev.some(e => e.kind === 'packFlees') && pack.slice(1).every(w => w.brain.state === 'flee'), 'losing its leader the pack runs');
  const Sp2 = quiet(wild({ hour: 23 })), lone2 = walker(100, 100, 0);
  Sp2.player = lone2;
  Sp2.fauna.pk = { count: 4, max: 4, lost: 0, day: 1, active: true };
  const pack2 = [0, 1, 2, 3].map(i => beast(Sp2, 'wolf', 100 + Math.cos(i * 1.6) * 14, 100 + Math.sin(i * 1.6) * 14, 0, { group: 'pk', leader: false, home: [140, 140] }));
  pack2[1].fight.life = -1;
  spin(Sp2, FW, 0.1);
  ok(!Sp2.beasts.some(w => w.brain.state === 'flee'), 'one dead wolf is not enough');
  pack2[2].fight.life = -1;
  spin(Sp2, FW, 3);
  ok(Sp2.fauna.pk.lost === 2 && Sp2.beasts.filter(w => w.beast === 'wolf').every(w => w.brain.state === 'flee'), 'two dead wolves and the pack leaves');
  const St = quiet(wild({ hour: 23 })), bearer = walker(100, 100, 0);
  bearer.fight.torch = true;
  St.player = bearer;
  St.fauna.pk = { count: 4, max: 4, lost: 0, day: 1, active: true };
  for (let i = 0; i < 4; i++) beast(St, 'wolf', 100 + Math.cos(i * 1.6) * 12, 100 + Math.sin(i * 1.6) * 12, 0, { group: 'pk', home: [140, 140] });
  let closest = Infinity;
  const tev = spin(St, FW, 30, S => { for (const w of S.beasts) closest = Math.min(closest, d2(w, 100, 100)); });
  ok(!tev.some(e => e.kind === 'hit' && e.to === bearer) && closest > Bs.TORCH - 0.5, `a torch keeps the wolves off: none came closer than ${closest.toFixed(1)} m in 30 s`);
  ok(K.Senses.range(FW, bearer, 23) === K.Senses.DAY, 'and at night a torch is seen from 60 m');
  const Sd = quiet(wild({ hour: 13 })), sleeper = beast(Sd, 'wolf', 100, 100, 0, { group: 'pk' });
  Sd.fauna.pk = { count: 1, max: 1, lost: 0, day: 1, active: true };
  spin(Sd, FW, 4);
  ok(sleeper.brain.state === 'sleep' && sleeper.anim.rest > 0.8, 'by day wolves sleep at the den');

  const Sh = quiet(wild({ hour: 12 })), hunter = walker(100, 100, 0), shy = beast(Sh, 'hare', 100, 92, 0);
  Sh.player = hunter;
  spin(Sh, FW, 3);
  ok(shy.brain.state === 'flee' && d2(shy, 100, 100) > 15, 'a hare runs from a man 8 m away');
  const Sb = quiet(wild({ hour: 12 })), intruder = walker(100, 100, 0), bear = beast(Sb, 'bear', 100, 112, Math.PI, { home: [100, 115] });
  Sb.player = intruder;
  const bev = spin(Sb, FW, 15, (S, ev) => ev.some(e => e.kind === 'hit' && e.to === intruder));
  ok(bev.some(e => e.kind === 'hit' && e.to === intruder && e.who === bear), 'a bear drives a man out of its raspberry patch');
  const tear = Bs.SPECIES.bear.attack, armK = Object.assign(B.copyKit(B.HEROES['guard.m'].kit), { cut: {} }), victim = { kit: armK, fight: C.fighter({ weapon: 'sword' }), mv: K.Move.body(FW, 100, 100, 0), anim: A.state() };
  A.dress(victim, victim.anim, B.restPose());
  victim.fight.aim = AI.idleAim(victim);
  const tev2 = [], Sx = quiet(wild());
  let torn = false;
  for (let i = 0; i < 40 && !torn; i++) { tev2.length = 0; Bs.strikeAt(Sx, bear, victim, Object.assign({}, tear, { parts: [5], power: 1.2 }), tev2, () => 0.1); torn = tev2.some(e => e.kind === 'cut'); }
  ok(torn, 'a bear paw can tear off a forearm');
  const Sbo = quiet(wild()), boar = beast(Sbo, 'boar', 100, 101, Math.PI, { leader: true }), knocked = walker(100, 100, 0);
  A.dress(knocked, knocked.anim, B.restPose());
  knocked.fight.aim = AI.idleAim(knocked);
  Bs.strikeAt(Sbo, boar, knocked, SP.boar.attack, [], () => 0.5);
  ok(knocked.fight.stun > 0.5 && knocked.mv.shove, 'a boar tusk knocks a man off his feet');

  const Sg = quiet(wild({ hour: 12 })), stray = walker(100, 100, 0), dog = beast(Sg, 'dog', 100, 112, Math.PI, { owner: 'town', home: [100, 112] });
  stray.team = 'villain';
  Sg.player = stray;
  const gev = spin(Sg, FW, 3);
  ok(gev.some(e => e.kind === 'bark' && e.who === dog) && !gev.some(e => e.kind === 'hit' && e.who === dog), 'a farm dog barks at a stranger by day and does not bite');
  const St2 = quiet(wild({ hour: 12 })), runner = walker(130, 130, 0), hound = beast(St2, 'dog', 100, 100, 0);
  for (let i = 0; i <= 12; i++) Wd.pool(St2, 100 + i * 2.5, 100 + i * 2.5, 0.05, i);
  runner.mv.pos = [131, 0, 131];
  St2.people.push(Object.assign(B.member(7300, 'elf', 131, 131, 0, FW), { anim: A.state() }));
  const prey = St2.people[0];
  Bs.follow(hound, prey);
  spin(St2, FW, 20, () => d2(hound, 131, 131) < 4);
  ok(d2(hound, 131, 131) < 4, 'a dog follows a blood trail to the wounded man');

  const Ss = quiet(wild()), skinner = walker(100, 100, 0), sb = beast(Ss, 'wolf', 101, 100, 0);
  sb.fight.life = -1;
  spin(Ss, FW, 0.1);
  const meat = Ss.carcasses.find(c => c.id === sb.id);
  ok(meat && Bs.canSkin(skinner, skinner.bag) && !Bs.canSkin(walker(0, 0), []), 'skinning needs a knife');
  const hide = Bs.skin(Ss, meat, skinner.bag);
  ok(hide && skinner.bag.some(s => s.id === 'wolfHide' && s.n === 1) && meat.skinned && Bs.skin(Ss, meat, skinner.bag) === null, 'a wolf gives its hide once');
  const Sc = quiet(wild()), owner = walker(100, 100, 0), cow = beast(Sc, 'cow', 101, 101, 0, { owner: 'town' });
  Sc.player = owner;
  Bs.struck(Sc, { fight: { weapon: 'axe', act: { power: 1 }, exp: 'soldier', aim: { eye: [100, 1.6, 100] } }, mv: { pos: owner.mv.pos } }, cow, { part: 2, at: cow.mv.pos.slice(), onBlade: true }, 'chop', [], () => 0.5, owner);
  cow.fight.life = -1;
  const cev = spin(Sc, FW, 0.1);
  ok(cev.some(e => e.kind === 'owner') && Sc.relations.town === -5, 'killing somebody\'s cow costs 5 with the people (plan 6.16)');
  const So = quiet(wild()), ox = beast(So, 'ox', 100, 100, 0);
  Bs.lead(ox, [100, 80]);
  let top = 0;
  spin(So, FW, 30, () => { top = Math.max(top, ox.mv.speed); return ox.brain.lead.done; });
  ok(ox.brain.lead.done && top <= SP.ox.speed[0] + 0.05 && d2(ox, 100, 80) < 2, `an ox led by the halter walks to the cart (${top.toFixed(2)} m/s): ready for caravans`);
  const Se = quiet(wild()), eagle = beast(Se, 'eagle', 100, 100, 0, { alt: 50 });
  eagle.groupR = 40;
  eagle.alt = 50;
  spin(Se, FW, 3);
  ok(eagle.mv.pos[1] > 40 && Math.abs(d2(eagle, 100, 100) - 40) < 2, 'an eagle circles high over its rock');
  const Sr = quiet(wild());
  Sr.carcasses.push(Bs.lay({ id: 777, beast: 'deer', kit: Bs.make(777, 'deer', 120, 120, 0, FW).kit, at: [120, 120], born: -100, yaw: 0 }, FW));
  Sr.focus = [0, 0, 0];
  spin(Sr, FW, 1.2);
  ok(Sr.beasts.filter(b => b.beast === 'crow').length === 3, 'crows circle over an old carcass');

  const ar = arena('axe', 1.2);
  ar.S.people = [];
  quiet(ar.S);
  ar.S.beasts = [];
  const target = beast(ar.S, 'pig', 100, 98.9, Math.PI / 2);
  A.beastUpdate(target.anim, target, 0.1);
  Bs.fk(target, A.beastPose(target.anim, SP.pig, target), FW);
  const bc = B.capsules(target.kit, target.frames).find(c => c[0] === 2);
  ar.look([0, 1, 2].map(i => (bc[1][i] + bc[2][i]) / 2));
  ar.swing(2, 0.45);
  ar.tick(40);
  const aev = ar.log;
  ok(aev.some(e => e.kind === 'hit' && e.to === target && e.prey), 'a swing hits a pig like it hits a man');
  const Sar = quiet(wild({ hour: 12 })), stag = beast(Sar, 'deer', 100, 80, 0);
  A.beastUpdate(stag.anim, stag, 0.1);
  Bs.fk(stag, A.beastPose(stag.anim, SP.deer, stag), FW);
  const bowman = { kit: B.copyKit(B.HEROES['elf.m'].kit), mv: K.Move.body(FW, 100, 100, 0), fight: C.fighter({}), bag: [], anim: A.state(), frames: new Float32Array(132) };
  const chestS = B.capsules(stag.kit, stag.frames).find(c => c[0] === 2), aimAt = [0, 1, 2].map(i => (chestS[1][i] + chestS[2][i]) / 2);
  bowman.fight.aim = { eye: [100, 1.6, 100], yaw: 0, pitch: 0 };
  const sol = AI.ballistic(bowman.fight.aim.eye, aimAt, Dt.MISSILES.arrow.speed[1]);
  bowman.fight.aim.yaw = sol.yaw;
  bowman.fight.aim.pitch = sol.pitch;
  Sar.people.push(Object.assign(bowman, { id: 7400 }));
  K.Missile.launch(Sar, bowman, 'arrow', 1, () => 0.999);
  const sev3 = [];
  for (let i = 0; i < 120 && Sar.missiles.length; i++) { sev3.push(...K.Missile.step(Sar, 1 / 60, FW, () => 0.999)); Sar.time += 1 / 60; }
  ok(sev3.some(e => e.kind === 'hit' && e.to === stag) && Sar.stuck.some(s => s.host === stag.id), 'an arrow hits a stag and stays in it');

  const S6 = quiet(wild()), w6 = beast(S6, 'wolf', 100, 100, 1, { group: 'wolf-south', leader: true });
  w6.kit.cut = { rh: 'lo' };
  w6.fight.bleed = 0.5;
  const dead6 = beast(S6, 'boar', 105, 100, 0);
  dead6.fight.life = -1;
  spin(S6, FW, 0.05);
  const lb = beast(S6, 'deer', 110, 100, 0), mev6 = [];
  Bs.struck(S6, att, lb, { part: 9, tag: 'leg', at: lb.mv.pos.slice(), onBlade: true }, 'chop', mev6, () => 0.95, null);
  S6.relations = { town: -5 };
  S6.player = Object.assign(walker(90, 90, 0), { team: 'guard' });
  const pk6 = JSON.stringify(Sv.pack(S6, FW)), back6 = Sv.unpack(JSON.parse(pk6), FW);
  ok(JSON.stringify(Sv.pack(back6, FW)) === pk6 && JSON.parse(pk6).v === Sv.VERSION, 'beasts in the save: save, load, save gives the same text');
  ok(back6.beasts.find(b => b.id === w6.id).kit.cut.rh === 'lo' && back6.beasts.find(b => b.id === w6.id).leader && back6.carcasses.some(c => c.id === dead6.id) && back6.carcasses.some(c => c.piece) && back6.relations.town === -5 && back6.fauna['wolf-south'], 'beasts keep their wounds, carcasses and severed legs stay, numbers and grudges are kept');
}

{
  const E = K.Econ, Pl = K.Places, Nv = K.Nav, Wd = K.Wounds;
  const town = Pl.town(T);
  const world = o => Object.assign({ seed: 9, day: 1, hour: 10, time: 0, nextId: 30000, version: 0, people: [], bodies: [], parts: [], items: [], blood: [], missiles: [], stuck: [], chairs: [], beasts: [], carcasses: [], fauna: Object.fromEntries(K.Beasts.GROUPS.map(G => [G.id, { count: 0, max: 0, lost: 0, day: 999, active: false }])), relations: {}, standing: { service: 0, respect: 0, loyalty: 0 } }, o || {});
  const hero = (x, z, side, o) => Object.assign({ kit: Object.assign(B.copyKit(B.HEROES[side === 'elf' ? 'elf.m' : side === 'villain' ? 'villain' : 'guard.m'].kit), { pros: {}, cut: {}, eyes: {} }), mv: K.Move.body(W, x, z, 0), pitch: 0, mode: 'first', bag: [], fight: C.fighter({ weapon: 'sword' }), anim: A.state(), frames: new Float32Array(132), team: side || 'guard' }, o || {});
  const silver = (P, n) => { P.bag = P.bag.filter(s => s.id !== 'silver'); if (n) P.bag.push({ id: 'silver', n }); };
  const run = (S, sec) => { const rnd = K.rng(5), pose = B.restPose(), ev = []; for (let i = 0; i < sec * 60; i++) { if (S.player) { S.player.fight.aim = AI.idleAim(S.player); A.update(S.player.anim, S.player.mv, 1 / 60); } ev.push(...AI.run(S, 1 / 60, W, rnd, pose).events); S.time += 1 / 60; } return ev; };

  const old = ['inn', 'doctor', 'sharnir', 'watch', 'belfry', 'mill'];
  const civ = Pl.BUILDINGS.filter(b => !b.korni && !b.palace && !b.fort && !b.wild && !/^tsarevo|camp$|^outpost/.test(b.id));
  ok(old.every(id => Pl.BUILDINGS.some(b => b.id === id)) && civ.filter(b => b.kind === 'house').length === 14 && civ.filter(b => b.kind === 'stall').length === 5 && civ.filter(b => b.kind === 'barn').length === 4, 'Мостовица keeps its places from stage 1 and gets a fifth stall for the hide buyer; four farms with barns and the mill');
  ok(!P.BOXES.some(b => old.includes(b.id) || b.landmark === 'belfry') && W.boxes.filter(b => b.hidden && !(b.id && b.id.startsWith('prop-'))).length === town.boxes.length && W.boxes.some(b => b.landmark === 'belfry' && b.hidden), 'the grey town boxes are gone, the buildings collide instead and the belfry stays a landmark');
  ok(Pl.BUILDINGS.filter(b => b.price).map(b => b.price).join() === '600,1100' && Pl.BUILDINGS.filter(b => b.open && Pl.inTown(b.x, b.z)).length === 6, 'two houses for sale at 600 and 1100 and six buildings with rooms inside');
  ok(civ.filter(b => b.kind !== 'barn' && b.kind !== 'mill' && b.kind !== 'stall' && b.kind !== 'belfry').every(b => Pl.inTown(b.x, b.z) || b.id.startsWith('farm-')) && !Pl.inTown(1064, 1360) && Pl.inTown(900, 1455), 'the town border holds the houses, the yard and the cemetery, the mill and farms lie outside');
  ok(town.parts.every(p => [p.x, p.z, p.y0 === undefined ? p.y : p.y0].every(Number.isFinite)) && town.parts.length > 400, `${town.parts.length} parts of walls, roofs, furniture, graves and carts`);
  const ramp = town.boxes.filter(b => b.building === 'doctor' && b.kind === 'plank' && b.y1 <= town.doors.doctor.floor + 0.001 && b.y1 > T.heightAt(...town.doors.doctor.at) - 0.01).map(b => b.y1).sort((a, b) => a - b);
  ok(ramp.length >= 2 && ramp.every((y, i) => i === 0 || y - ramp[i - 1] <= 0.041), 'the doctor has a ramp with risers of 4 cm for a wheelchair');
  ok(town.beds.filter(b => b.building === 'inn').length === 2 && town.beds.filter(b => b.id === 'home').length === 2 && town.chests.filter(c => c.id === 'home').length === 2 && town.fits.sharnir, 'the inn has two rooms, each house for sale a bed and a chest, Sharnir a fitting stand');
  const NW = Nv.of(W), square = [840, 1330];
  const rooms = Object.keys(town.rooms).filter(id => Pl.inTown(town.rooms[id].at[0], town.rooms[id].at[1])), reach = rooms.filter(id => { const r = Nv.find(NW, square, town.doors[id].inside); return r && r.ok; });
  ok(reach.length === rooms.length, 'a path leads from the square into every room: ' + reach.join(', '));
  const w0 = K.Move.body(W, town.doors.doctor.at[0], town.doors.doctor.at[1], town.doors.doctor.face);
  for (let i = 0; i < 160; i++) K.Move.step(w0, { fwd: 1, side: 0, yaw: town.doors.doctor.face }, 1 / 60, W);
  ok(Math.abs(w0.pos[1] - town.doors.doctor.floor) < 0.05 && K.Places.inTown(w0.pos[0], w0.pos[2]), 'walking through the doctor door ends on his floor');

  const folk = B.townsfolk(W, 600), roles = r => folk.filter(p => p.role === r);
  ok(roles('watch').length === 12 && roles('watch').every(p => p.team === 'watch' && p.kit.side === 'town' && p.fight.weapon), 'twelve armed men of the town watch');
  ok(Object.keys(E.SHOPS).filter(s => !['sharnir', 'yasen', 'ryabina'].includes(s)).every(s => roles('shop').some(p => p.shop === s)) && roles('doctor')[0].name === 'Аким' && roles('master')[0].kit.pros.lFore === 'hinge' && roles('inn').length === 1 && roles('digger').length === 1, 'a trader at each stall, Akim, Sharnir with his own hinge arm, the inn keeper and the gravedigger');
  ok(folk.filter(p => p.role !== 'watch').every(p => !p.fight.weapon), 'the town folk carry no weapons');

  const Se = world(), Pe = hero(840, 1330);
  Se.player = Pe;
  ok(E.price(Se, 'sword') === 60 && E.price(Se, 'plate') === 300 && E.price(Se, 'knife') === 8 && E.price(Se, 'bandage') === 4 && E.price(Se, 'hingeArm') === 400 && E.price(Se, 'crutch') === 15 && E.price(Se, 'wheelchair') === 140, 'base prices follow plans 6.3 and 6.12');
  E.setStock(Se, 'iron', 0.5);
  ok(E.price(Se, 'sword') === 120 && E.price(Se, 'hook') === 120 && E.price(Se, 'bread') === 2 && /×2,0/.test(E.stockNote(Se, 'iron')), 'iron runs short: price ×2 and the counter says why');
  E.setStock(Se, 'iron', 0.1);
  ok(E.state(Se).stock.iron === 0.4 && E.price(Se, 'sword') === 120, 'a stock stays between 0.4 and 1.6, the price never goes above ×2');
  E.setStock(Se, 'iron', 1.6);
  ok(E.price(Se, 'sword') === 42, 'a full store: the price falls only to ×0.7');
  E.setStock(Se, 'iron', 1);
  E.setStock(Se, 'medicine', 0.5);
  ok(E.doctor(Se, Pe).find(o => o.id === 'stop').price === 40, 'medicines short: the doctor charges more');
  E.setStock(Se, 'medicine', 1);
  Se.relations.town = 60;
  ok(E.price(Se, 'sword') === 54, 'the town likes you: 10 % off');
  Se.relations.town = 0;

  silver(Pe, 100);
  const b1 = E.buy(Se, Pe.bag, 'arms', 'sword');
  ok(b1.ok && b1.price === 60 && E.purse(Pe.bag) === 40 && Pe.bag.find(s => s.id === 'sword').n === 1, 'a purchase takes the silver once and puts the sword in the bag');
  const b2 = E.buy(Se, Pe.bag, 'arms', 'sword');
  ok(!b2.ok && E.purse(Pe.bag) === 40 && Pe.bag.find(s => s.id === 'sword').n === 1 && /серебра/.test(b2.why), 'with too little silver nothing changes hands');
  ok(!E.buy(Se, Pe.bag, 'arms', 'plate').ok && E.purse(Pe.bag) === 40, 'the armourer does not sell plate');
  const a3 = E.buy(Se, Pe.bag, 'arms', 'arrow');
  ok(a3.ok && a3.price === 1 && Pe.bag.find(s => s.id === 'arrow').n === 3, 'arrows go three for a silver');
  Pe.bag.push({ id: 'wolfHide', n: 1 }, { id: 'bearHide', n: 1 });
  const h1 = E.sell(Se, Pe.bag, 'hides', 'bearHide'), h2 = E.sell(Se, Pe.bag, 'arms', 'wolfHide'), h3 = E.sell(Se, Pe.bag, 'arms', 'sword');
  ok(h1.ok && h1.price === 60 && !h2.ok && h3.ok && h3.price === 30 && E.purse(Pe.bag) === 39 + 60 + 30, 'the hide buyer pays the full price of a bear hide, the armourer takes back a sword at half and no hides');
  ok(E.SHOPS.goods.sells.includes('crutch') && E.SHOPS.sharnir.sells.includes('wheelchair') && E.SHOPS.sharnir.sells.includes('crutch'), 'crutches and wheelchairs are for sale');
  silver(Pe, 200);
  ok(E.buy(Se, Pe.bag, 'goods', 'crutch').ok && E.buy(Se, Pe.bag, 'sharnir', 'wheelchair').ok && E.purse(Pe.bag) === 45, 'a crutch for 15 and a wheelchair for 140');
  Se.relations.town = -60;
  ok(!E.buy(Se, Pe.bag, 'goods', 'bread').ok && E.doctor(Se, Pe).every(o => !o.can), 'below −50 the shops and the doctor turn you away');
  Se.relations.town = 0;

  const Sd = world({ hour: 10 }), Pd = hero(816, 1366);
  Sd.player = Pd;
  silver(Pd, 200);
  Pd.kit.cut = { lFore: 'fresh' };
  Pd.fight.bleed = Wd.bleed();
  Pd.fight.bleed.heavy = 30;
  Pd.fight.life = 40;
  const t1 = E.treat(Sd, Pd, 'stop');
  ok(t1.ok && t1.price === 20 && !Wd.bleeding(Pd.fight) && E.purse(Pd.bag) === 180, 'Akim stops the blood for 20');
  const t2 = E.treat(Sd, Pd, 'stump');
  ok(t2.ok && t2.price === 40 && Pd.kit.cut.lFore === 'healed' && Sd.hour === 11, 'he heals the stump for 40 in an hour');
  const t3 = E.treat(Sd, Pd, 'wounds');
  ok(t3.ok && t3.price === 30 && Pd.fight.life === 100 && Sd.hour === 14, 'wounds: 10 an hour, three hours for 60 lost life');
  ok(!E.treat(Sd, Pd, 'stump').ok && E.purse(Pd.bag) === 110, 'nothing left to treat, nothing charged');

  const Sf = world(), Pf = hero(870, 1366);
  Sf.player = Pf;
  silver(Pf, 500);
  Pf.kit.cut = { lFore: 'bandaged', rShin: 'healed', rArm: 'healed' };
  Pf.kit.eyes = { l: true };
  ok(!E.fit(Sf, Pf, 'lFore', 'hook', 'buy').ok && E.purse(Pf.bag) === 500, 'a prosthesis goes only on a healed stump');
  ok(E.partOf(Pf.kit, 'rFore').why && !E.partOf(Pf.kit, 'rFore').free, 'an arm lost at the shoulder takes no forearm prosthesis');
  Pf.kit.cut.lFore = 'healed';
  const f1 = E.fit(Sf, Pf, 'lFore', 'hook', 'buy');
  ok(f1.ok && f1.price === 60 && Pf.kit.pros.lFore === 'hook' && E.purse(Pf.bag) === 440 && Sf.hour === 11, 'way one: buy a hook from Sharnir, fitted in an hour');
  const foe = B.member(31000, 'villain', 870, 1360, 0, W);
  foe.kit.pros = { rShin: 'iron' };
  foe.kit.cut = { rShin: 'healed' };
  const body = B.fall(foe.kit, B.fk(B.figure(foe.kit), B.restPose(), [870, 0, 1360], 0), { id: 31000, sack: [] });
  const took = B.take(body, 'pros:rShin', Pf.bag, Sf);
  const f2 = E.fit(Sf, Pf, 'rShin', 'ironLeg', 'own');
  ok(took && took.id === 'ironLeg' && f2.ok && f2.price === 55 && Pf.kit.pros.rShin === 'iron' && !Pf.bag.some(s => s.id === 'ironLeg'), 'way two: take an iron leg from a dead enemy, any master fits it for a quarter of its price');
  const Sg = world(), Pg = hero(870, 1366, 'villain');
  Sg.player = Pg;
  Pg.kit.cut = { rFore: 'healed' };
  ok(E.sideOffer(Sg, Pg, 'ironArm').price === 0 && !E.sideOffer(Sg, Pg, 'hingeArm'), 'the villain\'s men get iron for free from Molot');
  const f3 = E.grant(Sg, Pg, 'rFore', 'ironArm');
  ok(f3.ok && f3.price === 0 && Pg.kit.pros.rFore === 'iron', 'way three: the own side gives the prosthesis (a stub until the campaigns)');
  const Pe2 = hero(0, 0, 'elf'), Pgd = hero(0, 0, 'guard');
  const Sx = world();
  ok(!E.sideOffer(Sx, Pe2, 'carvedArm') && (Sx.standing.respect = 40, E.sideOffer(Sx, Pe2, 'carvedArm').price === 0) && !E.sideOffer(Sx, Pgd, 'hingeArm') && (Sx.standing.service = 6, !E.sideOffer(Sx, Pgd, 'hingeArm')) && (Pgd.bag.push({ id: 'gramota', n: 1 }), E.sideOffer(Sx, Pgd, 'hingeArm').price === 200), 'elves at respect 40 get carved arms free, a guard at service 6 pays half with the charter');
  const fe = E.fit(Sf, Pf, 'eye.l', 'glassEye', 'buy');
  ok(fe.ok && Pf.kit.eyes.l === 'glass' && Wd.caps(Pf.kit).view.l === 'glass', 'a glass eye gives back half the view');
  const opts = E.fitOptions(Sf, Pf, 'lFore', 'sharnir');
  ok(opts.length === 4 && opts.every(o => o.gives && o.lacks) && opts.find(o => o.id === 'hingeArm').how === 'buy' && !opts.find(o => o.id === 'carvedArm').how, 'the fitting list shows each arm with what it gives, what it lacks, and where to get it');

  const kitOf = (pros, cut) => ({ side: 'guard', fig: 'm', pros, cut, eyes: {}, armor: [], head: null });
  const caps = (part, kind) => Wd.caps(kitOf({ [part]: kind }, { [part]: 'healed' }));
  ok(!caps('lFore', 'hook').twoHanded && caps('lFore', 'hook').shield && caps('lFore', 'carved').bow && !caps('lFore', 'carved').shield && caps('lFore', 'iron').slow === 0.85 && !caps('lFore', 'iron').swim && caps('lFore', 'hinge').bow && caps('lFore', 'hinge').twoHanded, 'arms: the hook holds a shield, the carved arm draws a bow, iron is slower and sinks, the hinge arm does it all');
  ok(caps('lShin', 'peg').run === 3.2 && !caps('lShin', 'peg').sprint && Wd.LEGS.willow.jump === 1.1 && caps('lShin', 'willow').jump === M.jumpHeight && caps('lShin', 'iron').run === 4.2 && caps('lShin', 'iron').loud && caps('lShin', 'hinge').run === M.run && caps('lShin', 'hinge').sprint, 'legs follow plan 6.3');
  ok(['fore.hook', 'fore.carved', 'fore.hinge', 'fore.iron', 'shin.peg', 'shin.willow', 'shin.iron', 'shin.hinge'].every(k => K.Models.library().meshes[k]), 'a mesh for every arm and leg prosthesis');
  ok(C.cutThreshold(kitOf({ lFore: 'iron' }, { lFore: 'healed' }), 5) === Infinity && C.cutThreshold(kitOf({ lFore: 'hook' }, { lFore: 'healed' }), 5) === Infinity && C.cutThreshold(kitOf({ lFore: 'hinge' }, { lFore: 'healed' }), 5) === 30, 'iron cannot be hewn off, a strong chop knocks off the hinge arm');
  const mace = { fight: Object.assign(C.fighter({ weapon: 'mace' }), { act: { kind: 'swing', power: 1, t: 0.1 }, aim: { eye: [0, 1.6, 1], yaw: Math.PI, pitch: 0 } }), mv: {} };
  const willow = { kit: kitOf({ lShin: 'willow' }, { lShin: 'healed' }), fight: C.fighter({}) };
  const crushed = C.strike(mace, willow, { part: 9, tag: 'leg', at: [0, 0.3, 0], onBlade: true }, 'crush', () => 0.5);
  ok(crushed.cut === 9 && crushed.material === 'wood', 'a mace breaks the willow leg');
  const def = { kit: kitOf({ lFore: 'iron' }, { lFore: 'healed' }), fight: Object.assign(C.fighter({ weapon: 'sword' }), { aim: { eye: [0, 1.6, 0], yaw: 0, pitch: 0 }, guard: { dir: 'left', t: 0.5, sw: 0.5 } }), mv: { pos: [0, 0, 0] } };
  const att = { fight: Object.assign(C.fighter({ weapon: 'sword' }), { act: { kind: 'swing', dir: 'right', t: 0.1 }, aim: { eye: [0, 1.6, -1], yaw: Math.PI, pitch: 0 } }), mv: { pos: [0, 0, -1] } };
  ok(C.blockedBy(att, def) === 'shield', 'a raised iron arm stops a blade like a small shield');
  const Sh = world(), Ph = hero(840, 1330), shieldman = B.member(31010, 'villain', 840, 1329, Math.PI, W);
  Ph.kit.pros = { lFore: 'hook' };
  Ph.kit.cut = { lFore: 'healed' };
  Ph.fight.aim = { eye: [840, 1.65, 1330], yaw: 0, pitch: 0 };
  shieldman.fight.shield = true;
  shieldman.fight.guard = { dir: 'up', t: 1, sw: 1 };
  shieldman.fight.aim = { eye: [840, 1.65, 1329], yaw: Math.PI, pitch: 0 };
  const swing = { fight: Object.assign(C.fighter({ weapon: 'sword' }), { act: { kind: 'swing', dir: 'up' }, aim: Ph.fight.aim }), mv: Ph.mv };
  ok(C.blockedBy(swing, shieldman) === 'shield', 'a raised shield blocks');
  Sh.player = Ph;
  Sh.people.push(shieldman);
  const hk = C.hookShield(Sh, Ph);
  ok(hk && shieldman.fight.hooked === C.HOOKED && !shieldman.fight.guard && (shieldman.fight.guard = { dir: 'up', t: 1, sw: 1 }, C.blockedBy(swing, shieldman) === null), 'the hook pulls the enemy shield aside: for a moment it does not block');
  const kicker = hero(840, 1330, 'villain'), kicked = B.member(31020, 'guard', 840, 1329, Math.PI, W);
  kicker.kit.pros = { rShin: 'iron' };
  kicker.kit.cut = { rShin: 'healed' };
  kicker.fight.aim = { eye: [840, 1.65, 1330], yaw: 0, pitch: 0 };
  kicker.fight.act = { kind: 'kick', t: C.KICK.at - 0.001, done: false };
  const Sk = world({ player: kicker, people: [kicked] }), kev = C.step(Sk, 0.01, () => 0.5);
  ok(kev.some(e => e.kind === 'kick' && e.what === 'down') && kicked.fight.stun >= C.IRON_KICK.stun - 0.05, 'a kick with an iron leg knocks the enemy off his feet');

  const Sw = world(), Pw = hero(870, 1366);
  Pw.kit.cut = { lFore: 'healed' };
  Pw.bag.push({ id: 'hingeArm', n: 1 });
  ok(E.freeFor(Pw, 'hingeArm') === 'lFore' && E.selfFit(Pw, 'hingeArm', 'lFore') && Pw.kit.pros.lFore === 'hinge' && !Pw.bag.length, 'a knocked off prosthesis goes back on by hand');
  const cutPiece = B.sever({ kit: Pw.kit, frames: B.fk(B.figure(Pw.kit), B.restPose(), [870, 0, 1366], 0) }, [5], { id: 1, owner: 'player' });
  ok(cutPiece.item === 'hingeArm' && cutPiece.owner === 'player' && !cutPiece.blood && Pw.kit.cut.lFore === 'healed' && !Pw.kit.pros.lFore, 'a hewn hinge arm falls as a thing without blood and remembers whose it is');

  const Sl = world({ time: 10 }), Pl0 = hero(845, 1335), keeper = B.townsfolk(W, 600).find(p => p.shop === 'goods');
  const watch = B.townsfolk(W, 700).filter(p => p.role === 'watch');
  Sl.player = Pl0;
  Sl.people.push(keeper, ...watch);
  run(Sl, 0.5);
  ok(!AI.wanted(Sl, Pl0) && !watch.some(w => w.fight.hostile), 'a calm town: the watch stands at its posts');
  const off = AI.law(Sl, [{ kind: 'hit', who: Pl0, to: keeper, damage: 5 }]);
  ok(off.length === 1 && off[0].kind === 'offense' && AI.wanted(Sl, Pl0) && Sl.relations.town === -10, 'hitting a trader in town: the hero is wanted and the town thinks worse of him');
  ok(AI.law(Sl, [{ kind: 'hit', who: Pl0, to: keeper, damage: 5 }]).length === 0 && Sl.relations.town === -10, 'one fight, one blame within 20 s');
  run(Sl, 4);
  const chasers = watch.filter(w => w.fight.hostile === Pl0);
  ok(chasers.length >= 2, `the watch comes for him: ${chasers.length} of 12`);
  ok(!AI.law(Sl, [{ kind: 'hit', who: chasers[0], to: Pl0, damage: 5 }]).length, 'the watch hitting the wanted man is no crime');
  Pl0.mv = K.Move.body(W, 700, 1250, 0);
  run(Sl, 1);
  ok(!watch.some(w => w.fight.hostile === Pl0), 'outside the town the watch lets him go');
  Sl.time += AI.WANTED + 1;
  ok(!AI.wanted(Sl, Pl0), 'after a while the watch forgets');
  Sl.relations.town = -60;
  Pl0.mv = K.Move.body(W, 845, 1335, 0);
  ok(AI.wanted(Sl, Pl0), 'a foe of the town (below −50) is driven out whenever he comes in');
  const Sp = world(), elf = B.member(31100, 'elf', 840, 1335, Math.PI / 2, W), grd = B.member(31101, 'guard', 846, 1335, -Math.PI / 2, W);
  Sp.people.push(elf, grd);
  Sp.player = hero(600, 1500);
  run(Sp, 2);
  ok(!elf.fight.hostile && !grd.fight.hostile, 'an elf and a guard meet on the square and do not fight');
  const Sq = world(), elf2 = B.member(31102, 'elf', 860, 1180, Math.PI / 2, W), grd2 = B.member(31103, 'guard', 866, 1180, -Math.PI / 2, W);
  Sq.people.push(elf2, grd2);
  Sq.player = hero(600, 1500);
  run(Sq, 2);
  ok(elf2.fight.hostile === grd2 || grd2.fight.hostile === elf2, 'the same two out in the field fight at once');

  const Sr = world({ hour: 21 }), Pr = hero(840, 1290);
  Sr.player = Pr;
  silver(Pr, 50);
  const innBed = town.beds.find(b => b.building === 'inn');
  ok(!E.sleep(Sr, Pr, innBed).ok, 'no rent, no bed');
  const rent = E.rent(Sr, Pr.bag, town.beds);
  ok(rent.ok && rent.price === 6 && E.purse(Pr.bag) === 44 && !E.rent(Sr, Pr.bag, town.beds).ok, 'a room at the inn for 6, rented once');
  Pr.fight.life = 50;
  const slept = E.sleep(Sr, Pr, rent.bed);
  ok(slept.ok && slept.hours === 9 && Sr.hour === 6 && Sr.day === 2 && Pr.fight.life === 100, 'sleep lasts until six in the morning and restores the body');
  const foeNear = B.member(31200, 'villain', 842, 1290, 0, W);
  foeNear.fight.hostile = Pr;
  Sr.people.push(foeNear);
  ok(!E.wait(Sr, Pr, 2).ok && !E.sleep(Sr, Pr, rent.bed).ok, 'no rest with an enemy near');
  Sr.people.pop();
  const h0 = Sr.hour, waited = E.wait(Sr, Pr, 9);
  ok(waited.ok && waited.hours === 4 && Sr.hour === h0 + 4, 'waiting under the open sky lasts at most 4 hours');
  silver(Pr, 1200);
  const home = E.buyHome(Sr, Pr.bag, 'house-garden');
  ok(home.ok && E.purse(Pr.bag) === 100 && !E.buyHome(Sr, Pr.bag, 'house-bridge').ok && E.bedOf(Sr, town.beds.find(b => b.id === 'home' && b.building === 'house-garden')).ok && !E.bedOf(Sr, town.beds.find(b => b.id === 'home' && b.building === 'house-bridge')).ok, 'the garden house for 1100: its bed is yours, the other house is not');
  E.move(Pr.bag, E.chestOf(Sr, 'house-garden'), 'silver', 60);
  ok(E.purse(Pr.bag) === 40 && E.chestOf(Sr, 'house-garden')[0].n === 60, 'the chest keeps silver');
  silver(Pr, 40);
  const hired = E.hire(Sr, Pr.bag);
  const merc = B.member(31300, 'town', 840, 1300, 0, W);
  merc.merc = { since: Sr.day, paid: Sr.day };
  merc.team = 'guard';
  merc.squad = 'player';
  Sr.people.push(merc);
  ok(hired.ok && E.purse(Pr.bag) === 20, 'a mercenary costs 20 at once');
  Sr.day += 2;
  const paid = E.daily(Sr, Pr.bag);
  ok(paid.filter(e => e.kind === 'paid').length === 2 && E.purse(Pr.bag) === 4, 'and 8 a day');
  Sr.day += 1;
  const gone = E.daily(Sr, Pr.bag);
  ok(gone.length === 1 && gone[0].kind === 'left' && merc.merc.left && !E.mercs(Sr).length, 'unpaid, he leaves');

  const Sv7 = world({ time: 50 }), Pv7 = hero(845, 1335);
  Sv7.player = Pv7;
  Sv7.people.push(...B.townsfolk(W, 600));
  E.state(Sv7).homes.push('house-bridge');
  E.state(Sv7).chests['house-bridge'] = [{ id: 'silver', n: 12 }];
  E.setStock(Sv7, 'food', 0.6);
  AI.law(Sv7, [{ kind: 'hit', who: Pv7, to: Sv7.people[0] }]);
  Sv7.parts.push(Object.assign(B.sever({ kit: Object.assign(B.copyKit(B.HEROES['guard.m'].kit), { pros: { rFore: 'hinge' }, cut: { rFore: 'healed' } }), frames: B.fk(B.figure(B.HEROES['guard.m'].kit), B.restPose(), [845, 0, 1336], 0) }, [6], { id: 77, owner: 'player' }), { frozen: true }));
  const pk7 = JSON.stringify(Sv.pack(Sv7, W)), back7 = Sv.unpack(JSON.parse(pk7), W);
  ok(JSON.stringify(Sv.pack(back7, W)) === pk7 && JSON.parse(pk7).v === Sv.VERSION, 'save format 7 and later: save, load, save gives the same text');
  ok(back7.econ.homes[0] === 'house-bridge' && back7.econ.chests['house-bridge'][0].n === 12 && back7.econ.stock.food === 0.6 && AI.wanted(back7, back7.player) && back7.parts[0].owner === 'player' && back7.people.filter(p => p.role === 'watch').length === 12 && back7.people.find(p => p.role === 'master').name === 'Шарнир', 'the save keeps the house, the chest, the prices, the watch, the wanted mark and the dropped arm');
  const v6 = JSON.parse(pk7);
  v6.v = 6;
  delete v6.econ;
  delete v6.law;
  const m7 = Sv.unpack(v6, W);
  ok(!m7.econ && !m7.law && E.state(m7).homes.length === 0, 'a save of format 6 loads with no houses and nobody wanted');
}

{
  const Cv = K.Caravan, E = K.Econ, Bs = K.Beasts;
  const world = o => Object.assign({ seed: 10, day: 1, hour: 12, time: 0, nextId: 40000, version: 0, people: [], bodies: [], parts: [], items: [], blood: [], missiles: [], stuck: [], chairs: [], beasts: [], carcasses: [], relations: {}, standing: { service: 0, respect: 0, loyalty: 0 }, fauna: Object.fromEntries(Bs.GROUPS.map(G => [G.id, { count: 0, max: 0, lost: 0, day: 999, active: false }])) }, o || {});
  const hero = (x, z, side) => ({ kit: Object.assign(B.copyKit(B.HEROES[side === 'elf' ? 'elf.m' : side === 'villain' ? 'villain' : 'guard.m'].kit), { pros: {}, cut: {}, eyes: {} }), mv: K.Move.body(W, x, z, 0), pitch: 0, mode: 'first', bag: [], fight: C.fighter({ weapon: 'sword' }), anim: A.state(), frames: new Float32Array(132), team: side });
  const quietRoads = S => { Cv.state(S); for (const k of Object.keys(Cv.KINDS)) for (let d = 0; d < 60; d++) S.caravans.spawned[k + ':' + d] = true; return S; };
  const run = (S, sec) => { const rnd = K.rng(7), pose = B.restPose(), ev = []; for (let i = 0; i < sec * 60; i++) { if (S.player) { S.player.fight.aim = AI.idleAim(S.player); A.update(S.player.anim, S.player.mv, 1 / 60); } ev.push(...AI.run(S, 1 / 60, W, rnd, pose).events); S.time += 1 / 60; } return ev; };
  const routeAt = (kind, s) => K.Terrain.pointAt(Cv.routes()[kind].line, s);

  ok(Object.keys(Cv.KINDS).join() === 'trade,treasury,ore,bread' && Cv.KINDS.trade.every === 1 && Cv.KINDS.treasury.every === 7 && Cv.KINDS.ore.every === 2 && Cv.KINDS.bread.every === 2, 'four caravans of plan 6.10: trade daily, treasury every 7 days, ore and bread every 2 days');
  const R = Cv.routes();
  const ends = k => [R[k].line.pts[0], R[k].line.pts[R[k].line.pts.length - 1]].map(p => p.map(Math.round).join(','));
  ok(ends('trade').join() === '850,1536,850,1536' && Math.abs(R.trade.town - K.Terrain.nearest(R.trade.line, 840, 1325).s) < 1 && ends('treasury').join() === '840,1325,1146,700' && ends('ore').join() === '921,105,840,1325' && ends('bread').join() === '840,1325,921,105', 'routes: trade from the south through Мостовица to the palace and back, treasury Мостовица to the palace, ore from the fort to Мостовица along the Forest road, bread back');
  ok(Object.values(R).every(r => r.line.segs.every(g => g.len > 0.3)), 'routes follow the roads without gaps');

  const S30 = quietRoads(world({ hour: 6 })), rnd30 = K.rng(3);
  S30.caravans.spawned = {};
  Cv.init(S30, rnd30);
  const days = (S, n, rob) => { for (let t = 0; t < n * 24 * 80; t++) { S.hour += 1 / 80; if (S.hour >= 24) { S.hour -= 24; S.day++; } S.time += 1; Cv.run(S, 1, W, rnd30); if (rob) for (const c of S.caravans.list) if (c.kind === 'trade' && !c.passed && c.s > 60 && c.state === 'go') { c.carts.forEach(x => { x.bales = []; }); c.robbed = true; c.crew = c.crew.filter(m => m.role !== 'driver'); } } };
  days(S30, 30, false);
  const st = S30.caravans.stats, stock = E.state(S30).stock;
  ok(st.arrived.trade >= 28 && st.arrived.ore >= 14 && st.arrived.bread >= 14 && st.arrived.treasury >= 4 && !Object.keys(st.lost).length, `30 days without robbers: ${st.arrived.trade} trade, ${st.arrived.ore} ore, ${st.arrived.bread} bread, ${st.arrived.treasury} treasury caravans arrive, none lost`);
  ok(Object.values(stock).every(v => v > 0.8 && v < 1.2), 'the town stocks stay near normal: ' + JSON.stringify(stock));
  const Sr = quietRoads(world({ hour: 6 }));
  Sr.caravans.spawned = {};
  Cv.init(Sr, rnd30);
  days(Sr, 10, true);
  ok(Sr.caravans.stats.lost.trade >= 9 && E.state(Sr).stock.medicine <= 0.45 && E.price(Sr, 'bandage') === 8 && E.doctor(Sr, hero(0, 0, 'guard')).find(o => o.id === 'stop').price === 40, `10 days of robbed trade caravans: medicines fall to ${E.state(Sr).stock.medicine.toFixed(2)}, a bandage costs 8, stopping blood 40`);
  days(Sr, 14, false);
  ok(E.state(Sr).stock.medicine > 0.75, 'once the caravans get through again the stocks come back: medicines ' + E.state(Sr).stock.medicine.toFixed(2) + ' after 14 days');

  const Sn = quietRoads(world()), Pn = hero(0, 0, 'guard'), cn = Cv.make(Sn, 'trade', 1, 520, K.rng(5)), pn = routeAt('trade', 520);
  Sn.player = Pn;
  Pn.mv = K.Move.body(W, pn.x + pn.tz * 12, pn.z - pn.tx * 12, 0);
  run(Sn, 0.2);
  const crew0 = Cv.crewOf(Sn, cn), beasts0 = Cv.beastsOf(Sn, cn);
  ok(cn.live && crew0.length === cn.carts.length + crew0.filter(p => p.convoy.role === 'escort').length && crew0.filter(p => p.convoy.role === 'escort').length >= 2 && beasts0.length === cn.carts.length && crew0.filter(p => p.convoy.role === 'driver').every(p => !p.fight.weapon), 'near the hero the caravan comes alive: carts, oxen or horses, unarmed drivers and armed guards');
  ok(cn.carts.every(c => c.bales.length >= 6 && c.bales.length <= 10) && cn.carts.every(c => c.bales.every(g => Cv.GOODS[g].kg >= 15 && Cv.GOODS[g].kg <= 40)), 'each cart carries 6–10 bales of 15–40 kg');
  const guard = crew0.find(p => p.convoy.role === 'escort');
  guard.kit.cut = Object.assign({}, guard.kit.cut, { lFore: 'bandaged' });
  guard.fight.life = 47;
  beasts0[0].fight.life = beasts0[0].fight.max * 0.5;
  const bales0 = cn.carts.map(c => c.bales.join());
  Pn.mv = K.Move.body(W, pn.x + 400, pn.z, 0);
  run(Sn, 0.1);
  ok(!cn.live && !Sn.people.some(p => p.convoy) && !Sn.beasts.some(b => b.hitch) && cn.crew.length === crew0.length, 'far away it turns back into a point on the road graph');
  Pn.mv = K.Move.body(W, pn.x + pn.tz * 12, pn.z - pn.tx * 12, 0);
  run(Sn, 0.1);
  const crew1 = Cv.crewOf(Sn, cn), guard1 = crew1.find(p => p.id === guard.id);
  ok(cn.live && crew1.length === crew0.length && guard1 && guard1.kit.cut.lFore === 'bandaged' && Math.abs(guard1.fight.life - 47) < 1 && Math.abs(Cv.beastsOf(Sn, cn)[0].fight.life - beasts0[0].fight.max * 0.5) < 1 && cn.carts.map(c => c.bales.join()).join('|') === bales0.join('|'), 'coming back near: the same people with the same wounds, the same ox and the same load');

  const hearRuns = [];
  for (const s of [1150, 1300, 1450, 1600, 1750]) {
    const Sh = quietRoads(world()), lp = routeAt('ore', s), L = hero(lp.x, lp.z, 'villain'), ch = Cv.make(Sh, 'ore', 1, s - 120, K.rng(s));
    L.mv.yaw = Math.atan2(-lp.tx, lp.tz);
    Sh.player = L;
    let heard = -1, seen = -1;
    for (let i = 0; i < 160 * 60 && seen < 0; i++) {
      Sh.player.fight.aim = AI.idleAim(L);
      AI.run(Sh, 1 / 60, W, K.rng(1), B.restPose());
      Sh.time += 1 / 60;
      if (i % 15) continue;
      const lead = ch.carts[0].pos;
      if (!lead) continue;
      const d = Math.hypot(lead[0] - L.mv.pos[0], lead[2] - L.mv.pos[2]);
      if (heard < 0 && Cv.hears(Sh, L.mv.pos).length) heard = d;
      if (seen < 0 && (Cv.crewOf(Sh, ch).some(q => K.Senses.sees(L, q, W, Sh.hour)) || Cv.beastsOf(Sh, ch).some(b => K.Senses.sees(L, b, W, Sh.hour)))) seen = d;
    }
    hearRuns.push([Math.round(heard), Math.round(seen)]);
  }
  ok(hearRuns.every(([h, s]) => h > 0 && (s < 0 || h > s + 10)), 'on the Forest road the bells are heard before the caravan is seen (heard, seen): ' + JSON.stringify(hearRuns));

  const spot = Cv.sawnSpots().find(sp => K.Terrain.nearest(R.ore.line, sp.at[0], sp.at[1]).d < 6 && sp.s > 500), sOre = K.Terrain.nearest(R.ore.line, spot.at[0], spot.at[1]).s;
  ok(Cv.sawnSpots().length === 8 && Cv.sawnSpots().every(sp => T.zoneAt(sp.at[0], sp.at[1]) === 3 || T.zoneAt(sp.at[0], sp.at[1]) === 4), 'eight sawn trees with ochre marks stand along the Forest road');
  const Sb = quietRoads(world()), Pb = hero(spot.at[0] - spot.fall[0] * 1.2, spot.at[1] - spot.fall[1] * 1.2, 'elf'), cb = Cv.make(Sb, 'ore', 1, sOre - 30, K.rng(9));
  Sb.player = Pb;
  Pb.mv = K.Move.body(W, spot.at[0] - spot.fall[0] * 140, spot.at[1] - spot.fall[1] * 140, 0);
  ok(Cv.fell(Sb, spot.id) && !Cv.fell(Sb, spot.id), 'the hero fells the marked tree once');
  const evb = run(Sb, 3);
  ok(Sb.caravans.sawn[spot.id].state === 'down' && evb.some(e => e.kind === 'treefall') && W.dyn.some(b => b.log === spot.id), 'it falls across the road and blocks it');
  run(Sb, 25);
  ok(cb.state === 'blocked' && cb.live && Math.abs(K.Terrain.nearest(R.ore.line, spot.at[0], spot.at[1]).s - cb.s) < 10, 'the ore caravan stops in front of the log');
  const crewB = Cv.crewOf(Sb, cb);
  for (const q of crewB) if (q.convoy.role === 'escort') q.fight.life = -1; else q.state = 'surrender';
  run(Sb, 1);
  ok(cb.state === 'stopped' && cb.lost && Sb.caravans.stats.lost.ore === 1, 'with the guards down and the drivers on their knees the caravan is lost');
  Pb.mv = K.Move.body(W, cb.carts[0].pos[0] + 1.5, cb.carts[0].pos[2], 0);
  const n0 = cb.carts[0].bales.length, g0 = cb.carts[0].bales[0], t1 = Cv.take(Sb, Pb, cb, 0, g0);
  ok(t1.ok && cb.carts[0].bales.length === n0 - 1 && Cv.cargoKg(Pb.bag) === Cv.GOODS[g0].kg && cb.robbed && cb.seen.includes('player') && cb.seen.includes('elf'), 'a bale goes from the cart into the bag, the caravan knows who robbed it');
  const t2 = Cv.take(Sb, Pb, cb, 0, cb.carts[0].bales[0]);
  ok(!t2.ok && /Не унести/.test(t2.why) && Cv.cargoKg(Pb.bag) <= Cv.CARRY, 'the hero carries no more than 40 kg');
  const mate = B.member(41000, 'elf', Pb.mv.pos[0] + 2, Pb.mv.pos[2], 0, W);
  mate.squad = 'player';
  Sb.people.push(mate);
  const helpers = Cv.friendsCarry(Sb, Pb, cb, 0);
  ok(helpers.length === 1 && Cv.cargoKg(mate.sack) > 0 && Cv.cargoKg(mate.sack) <= Cv.CARRY, 'elves call their own to carry');
  ok(Cv.take(Sb, Pb, cb, 0, 'bells').ok && !cb.carts[0].bells && Pb.bag.some(s => s.id === 'bells'), 'the bells come off the harness as a trophy');
  const store = Cv.STORES.elf, carried = Cv.cargoKg(Pb.bag) / 1 + Cv.cargoKg(mate.sack);
  ok(Cv.deposit(Sb, Pb) === null, 'far from the store nothing is stored');
  Pb.mv = K.Move.body(W, store.at[0] + 1, store.at[1] + 1, 0);
  mate.mv = K.Move.body(W, store.at[0] + 3, store.at[1] + 1, 0);
  const dep = Cv.deposit(Sb, Pb), box = Sb.caravans.stores.elf;
  ok(dep && dep.n >= 2 && Object.values(box).reduce((a, b) => a + b, 0) === dep.n && Cv.cargoKg(Pb.bag) === 0 && Cv.cargoKg(mate.sack) === 0 && carried > 40, `from the log to the store: ${dep.n} bales in the Корни store`);

  const Sw = quietRoads(world()), Pw = hero(0, 0, 'elf'), cw = Cv.make(Sw, 'trade', 1, 400, K.rng(11)), pw = routeAt('trade', 400);
  Sw.player = Pw;
  Pw.mv = K.Move.body(W, pw.x + 8, pw.z, 0);
  run(Sw, 0.2);
  Cv.alarm(Sw, cw, Pw);
  for (const q of Cv.crewOf(Sw, cw)) if (q.convoy.role === 'escort') q.fight.life = -1;
  run(Sw, 12);
  const teller = Cv.crewOf(Sw, cw).find(q => q.tell);
  ok(cw.state === 'stopped' && teller && teller.convoy.role === 'driver', 'a driver who saw the robbers runs for help');
  teller.mv = K.Move.body(W, 842, 1322, 0);
  const wev = run(Sw, 0.2);
  ok(wev.some(e => e.kind === 'witness' && e.player) && Sw.relations.town === -15 && Sw.caravans.blame.some(b => b.owner === 'town' && b.sides.includes('elf')), 'he reaches Мостовица and names the robbers: the town turns against the hero and remembers the elves');
  ok(wev.some(e => e.kind === 'lost') || Sw.caravans.stats.lost.trade === 1, 'the lost trade caravan is counted and the bell rings in town');

  const Sl = quietRoads(world()), Pl = hero(0, 0, 'villain'), cl = Cv.make(Sl, 'bread', 1, Cv.routes().bread.line.length - 60, K.rng(13)), plp = routeAt('bread', Cv.routes().bread.line.length - 60);
  Sl.player = Pl;
  Pl.mv = K.Move.body(W, plp.x + 3, plp.z, 0);
  run(Sl, 0.2);
  for (const q of Cv.crewOf(Sl, cl)) q.fight.life = -1;
  run(Sl, 1);
  ok(cl.state === 'stopped', 'a caravan left without people stands');
  ok(Cv.lead(Sl, cl).ok && cl.state === 'led', 'the hero takes the harness');
  const gate = Cv.STORES.villain.cart;
  let steps = 0;
  for (; steps < 120 * 60 && !cl.done; steps++) {
    const lead = Cv.beastsOf(Sl, cl)[0];
    if (!lead) break;
    const dx = gate[0] - lead.mv.pos[0], dz = gate[1] - lead.mv.pos[2], d = Math.hypot(dx, dz);
    Pl.mv.pos = [lead.mv.pos[0] + dx / d * 4, Pl.mv.pos[1], lead.mv.pos[2] + dz / d * 4];
    Pl.fight.aim = AI.idleAim(Pl);
    AI.run(Sl, 1 / 60, W, K.rng(2), B.restPose());
    Sl.time += 1 / 60;
  }
  ok(cl.done && Sl.caravans.stores.villain && Object.values(Sl.caravans.stores.villain).reduce((a, b) => a + b, 0) > 6, `led at 1.4 m/s the whole caravan reaches the fort store in ${(steps / 60).toFixed(0)} s`);

  const Sc = quietRoads(world({ hour: 23 })), Pc = hero(0, 0, 'villain'), cc = Cv.make(Sc, 'bread', 1, 900, K.rng(15)), pc = routeAt('bread', 900);
  Sc.player = Pc;
  Pc.mv = K.Move.body(W, pc.x + 10, pc.z, 0);
  run(Sc, 2);
  const s0 = cc.s;
  run(Sc, 2);
  ok(cc.state === 'camp' && cc.s === s0 && Sc.fires.length === 1 && Cv.crewOf(Sc, cc).some(q => Bs.lit(q, Sc) || Math.hypot(q.mv.pos[0] - Sc.fires[0].at[0], q.mv.pos[2] - Sc.fires[0].at[2]) < 12), 'at night the caravan camps by a fire, and the fire keeps wolves off like a torch');

  const Sv8 = quietRoads(world({ time: 30 })), Pv8 = hero(0, 0, 'guard'), c8 = Cv.make(Sv8, 'treasury', 1, 300, K.rng(17)), p8 = routeAt('treasury', 300), cfar = Cv.make(Sv8, 'ore', 1, 600, K.rng(18));
  Sv8.player = Pv8;
  Pv8.mv = K.Move.body(W, p8.x + 10, p8.z, 0);
  run(Sv8, 0.2);
  Cv.fell(Sv8, Cv.sawnSpots()[2].id);
  Cv.take(Sv8, Pv8, c8, 0, 'bells');
  const pk8 = JSON.stringify(Sv.pack(Sv8, W)), back8 = Sv.unpack(JSON.parse(pk8), W);
  ok(JSON.stringify(Sv.pack(back8, W)) === pk8 && JSON.parse(pk8).v === Sv.VERSION, 'save format 8 and later: save, load, save gives the same text');
  const b8 = back8.caravans.list.find(c => c.id === c8.id);
  ok(b8 && b8.live && !b8.carts[0].bells && b8.carts[0].silver === c8.carts[0].silver && back8.people.filter(p => p.convoy && p.convoy.id === c8.id).length === 7 && back8.beasts.some(b => b.hitch && b.hitch.id === c8.id) && back8.caravans.list.find(c => c.id === cfar.id).crew.length === cfar.crew.length && back8.caravans.sawn[Cv.sawnSpots()[2].id].state === 'falling', 'the save keeps caravans near and far, their people, oxen, silver and bells, and the felled tree');
  const v7 = JSON.parse(pk8);
  v7.v = 7;
  delete v7.caravans;
  ok(!Sv.unpack(v7, W).caravans, 'a save of format 7 loads without caravans; the game starts the roads anew');
}

{
  const Wo = K.World, Cv = K.Caravan, Bs = K.Beasts;
  const world = o => Object.assign({ seed: 11, day: 1, hour: 12, time: 0, nextId: 50000, version: 0, people: [], bodies: [], parts: [], items: [], blood: [], missiles: [], stuck: [], chairs: [], beasts: [], carcasses: [], relations: {}, standing: { service: 0, respect: 0, loyalty: 0 }, fauna: Object.fromEntries(Bs.GROUPS.map(G => [G.id, { count: 0, max: 0, lost: 0, day: 999, active: false }])) }, o || {});
  const hero = (x, z, side) => ({ kit: Object.assign(B.copyKit(B.HEROES[side === 'elf' ? 'elf.m' : side === 'villain' ? 'villain' : 'guard.m'].kit), { pros: {}, cut: {}, eyes: {} }), mv: K.Move.body(W, x, z, 0), pitch: 0, mode: 'first', bag: [], fight: C.fighter({ weapon: 'sword' }), anim: A.state(), frames: new Float32Array(132), team: side });
  const run = (S, sec) => { const rnd = K.rng(7), pose = B.restPose(), ev = []; for (let i = 0; i < sec * 60; i++) { if (S.player) { S.player.fight.aim = AI.idleAim(S.player); A.update(S.player.anim, S.player.mv, 1 / 60); } ev.push(...AI.run(S, 1 / 60, W, rnd, pose).events); S.time += 1 / 60; } return ev; };
  const quiet = S => { Wo.state(S).planned = 999; return S; };

  ok(['korni', 'palace', 'outpost', 'tower', 'lesoseka', 'tsarevo', 'cutters', 'mines', 'fort'].every(id => Wo.POSTS[id]) && Wo.state(world()).sides.guard.men === 70 && Wo.state(world()).sides.elf.people === 44 && Wo.state(world()).sides.elf.fighters === 18 && Wo.state(world()).sides.villain.men === 34, 'sides start as in plan 6.11: 70 guards, 44 elves of whom 18 fight, 34 men of the villain');

  const sixty = seed => {
    const S = world({ day: 1, hour: 6 }), rnd = K.rng(seed * 31), out = { gone: null, outpost: null };
    Cv.init(S, rnd);
    Wo.state(S);
    for (let t = 0; t < 60 * 24 * 80; t += 4) {
      S.hour += 4 / 80;
      if (S.hour >= 24) { S.hour -= 24; S.day++; }
      S.time += 4;
      const ev = Cv.run(S, 4, W, rnd);
      ev.push(...Wo.run(S, 4, W, rnd));
      Wo.react(S, ev);
      const a = Wo.alive(S);
      for (const k of Object.keys(a)) if (!a[k] && !out.gone) out.gone = [k, S.day];
      if (!out.outpost && S.world.posts.outpost.side === 'villain') out.outpost = S.day;
    }
    return Object.assign(out, { assault: S.world.assault, korni: S.world.raidsOn.korni || 0, battles: S.world.stats.battles, S });
  };
  const runs = [1, 2, 3].map(sixty);
  ok(runs.every(r => !r.gone || r.gone[1] >= 20), 'in 60 days without the hero no side vanishes before day 20: ' + JSON.stringify(runs.map(r => r.gone)));
  ok(runs.every(r => r.assault && r.assault.day >= 25 && r.assault.day <= 45), 'the villain storms the palace between day 25 and 45: ' + runs.map(r => r.assault && r.assault.day).join(', '));
  ok(runs.every(r => r.korni >= 6 && r.korni <= 12), 'Корни suffer 6–12 raids: ' + runs.map(r => r.korni).join(', '));
  ok(runs.some(r => r.outpost && r.outpost >= 8 && r.outpost <= 10), 'on day 8 the villain\'s men go for the outpost and take it: ' + runs.map(r => r.outpost).join(', '));
  ok(runs.every(r => r.battles >= 8 && r.battles <= 40) && runs.every(r => r.S.world.reports.length > 30), 'the world fights and reports on its own: ' + runs.map(r => r.battles).join(', ') + ' battles');

  const Sb = world(), rb = K.rng(3);
  let strong = 0;
  for (let i = 0; i < 400; i++) { const a = { side: 'guard', n: 10, power: 10, at: [0, 0, 0] }, b = { side: 'villain', n: 5, power: 5, at: [0, 0, 0] }; const r = Wo.battle(Sb, a, b, rb, [], [0, 0]); if (r.win === a) strong++; if (r.lose === b && b.n > 5 - Math.ceil(5 / 3)) strong = -1e9; }
  ok(strong / 400 > 0.75, `the stronger side wins most fights (${(strong / 4).toFixed(0)} %), and a beaten group loses at least a third`);
  const Sr = world(), V = Wo.state(Sr).sides.villain;
  ok(Wo.readiness(Sr) < 60, 'the villain starts far from ready: ' + V.readiness + ' %');
  Object.assign(V, { ladders: 6, ram: 1, intel: 3, morale: 60, men: 60 });
  V.stock.iron = 140;
  ok(Wo.readiness(Sr) === 100, 'ladders and ram, iron, 60 men, three pieces of news and good spirits make 100 %');
  V.stock.iron = 70;
  ok(Wo.readiness(Sr) === 90, 'robbed ore caravans and less iron pull readiness down');

  const Sg = quiet(world()), Pg = hero(778, 700, 'elf');
  Sg.player = Pg;
  const g = Wo.launch(Sg, 'guard', 'patrol', [1146, 700], [778, 760], 4);
  run(Sg, 0.2);
  ok(!g.live && !Sg.people.some(p => p.march), 'a far patrol walks the road graph as a number');
  g.s = Wo.pathOf(W, g.from, g.to, 'guard').length - 120;
  run(Sg, 0.2);
  const crew = Sg.people.filter(p => p.march && p.march.id === g.id);
  ok(g.live && crew.length === 4 && crew.every(p => p.team === 'guard' && p.fight.weapon), 'within 250 m the patrol comes alive: four armed guards');
  crew[0].kit.cut = { rFore: 'bandaged' };
  crew[0].fight.life = 33;
  Pg.mv = K.Move.body(W, 300, 1200, 0);
  run(Sg, 0.2);
  ok(!g.live && g.crew.length === 4 && g.n === 4, 'far again: the same four go on as a number');
  Pg.mv = K.Move.body(W, 778, 700, 0);
  run(Sg, 0.2);
  const back = Sg.people.find(p => p.id === crew[0].id);
  ok(back && back.kit.cut.rFore === 'bandaged' && Math.abs(back.fight.life - 33) < 1, 'and come back near with their wounds');
  const s0 = g.s;
  run(Sg, 6);
  ok(g.s > s0 + 2 || Sg.people.some(p => p.march && p.march.id === g.id && p.fight.hostile === Pg), 'a live group marches on along its path or fights the hero it meets');

  const St = quiet(world()), Pt = hero(500, 1150, 'guard');
  St.player = Pt;
  Wo.state(St).traces.push({ id: 'tx', at: [560, 1180], day: 1, time: 0, dead: [['elf', 3], ['guard', 2]], fire: true, done: false });
  run(St, 0.1);
  ok(St.bodies.filter(b => b.who).length === 5 && St.bodies.some(b => b.who.team === 'elf') && St.bodies.some(b => b.who.team === 'guard') && (St.smokes || []).length === 1, 'on the way the hero finds what is left of a far fight: bodies of both sides and smoke over a fire');
  run(St, 40);
  ok(St.bodies.some(b => b.frozen) && (St.beasts || []).some(b => b.beast === 'crow'), 'the bodies settle and crows come down to them');

  const Sy = quiet(world({ time: 1000 })), Py = hero(840, 1330, 'guard');
  Sy.player = Py;
  const deadKit = K.Body.kit('town', 'm', K.rng(4)), fr = K.Body.fk(K.Body.figure(deadKit), K.Body.restPose(), [850, T.heightAt(850, 1335), 1335], 0);
  const corpse = K.Body.fall(deadKit, fr, { id: 51000, born: 100, sack: [] });
  corpse.frozen = true;
  Sy.bodies.push(corpse);
  Wo.state(Sy).buryT = 29.99;
  run(Sy, 0.1);
  ok(!Sy.bodies.includes(corpse) && Sy.world.buried === 1, 'Мостовица buries its dead: the gravedigger takes a body that has lain in town');

  const Sp = quiet(world()), Pp = hero(0, 0, 'elf');
  Sp.player = Pp;
  Cv.state(Sp);
  for (const k of Object.keys(Cv.KINDS)) for (let d = 0; d < 60; d++) Sp.caravans.spawned[k + ':' + d] = true;
  const cp = Cv.make(Sp, 'ore', 1, 1400, K.rng(21)), pp = K.Terrain.pointAt(Cv.routes().ore.line, 1400);
  Pp.mv = K.Move.body(W, pp.x + 3, pp.z, 0);
  run(Sp, 0.2);
  for (const q of Cv.crewOf(Sp, cp)) q.fight.life = -1;
  run(Sp, 1);
  Cv.lead(Sp, cp);
  const pev = run(Sp, 0.5), chasers = Sp.people.filter(p => p.march && p.fight.hostile === Pp);
  ok(pev.some(e => e.kind === 'pursuit') && chasers.length === 4 && chasers.every(p => p.team === 'villain'), 'a caravan led away is chased: four of its owner men come after the hero ' + JSON.stringify([cp.state, pev.filter(e => e.kind === 'pursuit').length, chasers.length, Sp.people.filter(p => p.march).length, Sp.people.filter(p => p.march).map(p => !!p.fight.hostile)]));

  const Sa = world({ day: 5, hour: 12 }), ra = K.rng(8);
  Cv.state(Sa);
  for (const k of Object.keys(Cv.KINDS)) for (let d = 0; d < 60; d++) Sa.caravans.spawned[k + ':' + d] = true;
  const ca = Cv.make(Sa, 'ore', 5, 1300, ra), Ea = Wo.state(Sa);
  Ea.planned = 999;
  const q0 = K.Terrain.pointAt(Cv.routes().ore.line, 1300);
  const ga = Wo.launch(Sa, 'elf', 'partisans', [q0.x + 4, q0.z], [q0.x, q0.z], 8, {});
  ga.prey = ca.id;
  const aev = [];
  for (let i = 0; i < 60 && !ca.lost; i++) { Sa.time += 1; aev.push(...Cv.run(Sa, 1, W, ra), ...Wo.run(Sa, 1, W, ra)); Wo.react(Sa, aev); }
  ok(ca.lost && ca.state === 'stopped' && ca.seen.includes('elf') && ca.carts.every(c => !c.bales.length) && Ea.sides.villain.anger.elf > 0 && Ea.sides.elf.stock.iron > 20, 'partisans ambush an ore caravan far from the hero: the load goes to the elves and the villain remembers who did it');

  const Sm = world(), Em = Wo.state(Sm);
  Sm.player = hero(0, 0, 'villain');
  Em.sides.villain.men = 120;
  ok(Wo.mercFactor(Sm, 'villain') === 1.5 && K.Econ.hirePrice(Sm) === 30, 'the brake on the strong: mercenaries cost the leading side half as much again');
  Sm.player.team = 'elf';
  Em.sides.elf.fighters = 1;
  ok(Wo.mercFactor(Sm, 'elf') === 0.7 && K.Econ.hirePrice(Sm) === 14, 'and the weakest side gets them cheaper');
  ok(Wo.nextTreasury(world({ day: 2, hour: 6 })) === 3 && Wo.nextTreasury(world({ day: 3, hour: 9 })) === 10, 'Пров knows the day of the next treasury caravan');
  ok(Wo.reportsFor(runs[0].S, 'elf', 120).every(r => r.side === 'elf' || r.side === 'all') && Wo.reportsFor(runs[0].S, 'elf', 120).some(r => /Корни|Засада|Лазутчики|Партизаны|эльф/.test(r.text)), 'reports go to the side they concern');

  const Sv9 = quiet(world({ time: 77 })), Pv9 = hero(778, 700, 'elf');
  Sv9.player = Pv9;
  const g9 = Wo.launch(Sv9, 'guard', 'patrol', [1146, 700], [778, 760], 4), g9far = Wo.launch(Sv9, 'villain', 'raid', [921, 105], [350, 712], 8, { target: 'korni', fire: true });
  g9.s = Wo.pathOf(W, g9.from, g9.to, 'guard').length - 100;
  run(Sv9, 0.2);
  Sv9.smokes = [{ at: [350, 12, 712], until: 5000, id: 'tq' }];
  const pk9 = JSON.stringify(Sv.pack(Sv9, W)), back9 = Sv.unpack(JSON.parse(pk9), W);
  ok(JSON.stringify(Sv.pack(back9, W)) === pk9 && JSON.parse(pk9).v === Sv.VERSION, 'save format 9 and later: save, load, save gives the same text');
  ok(back9.world.groups.length === 2 && back9.people.filter(p => p.march && p.march.id === g9.id).length === 4 && back9.world.groups.find(x => x.id === g9far.id).n === 8 && back9.world.sides.villain.men === Sv9.world.sides.villain.men && back9.smokes.length === 1, 'the save keeps the sides, groups near and far, their people and the smoke');
  const v8 = JSON.parse(pk9);
  v8.v = 8;
  delete v8.world;
  ok(!Sv.unpack(v8, W).world, 'a save of format 8 loads without the war; the game starts it anew');
}

{
  const Sv = K.Save, Wo = K.World, AI = K.AI, A = K.Anim, B = K.Body, C = K.Combat, Wn = K.Wounds, D = K.Data.DIFFICULTY;
  const ZONE = { elf: 3, guard: 2, villain: 4 };
  for (const side of ['elf', 'guard', 'villain']) {
    const heroes = Sv.SIDE_HEROES[side], hero = heroes[heroes.length - 1], fig = B.HEROES[hero].kit.fig;
    const look = side === 'villain' ? null : { face: 2, hair: K.Data.SIDES[side].styles[fig][1], hairColor: K.Data.SIDES[side].hair[2].slice() };
    const S = Sv.start(W, { side, hero, look, name: side === 'villain' ? 'Тестов' : null }), P = S.player, p0 = P.mv.pos.slice();
    ok(T.zoneAt(p0[0], p0[2]) === ZONE[side] && P.team === side && P.kit.hero === hero && S.hour === Sv.STARTS[side].hour && S.day === 1, `${side}: the game starts in zone ${ZONE[side]} at ${Sv.STARTS[side].hour}:00 as ${B.HEROES[hero].name}`);
    if (look) ok(P.kit.face === 2 && P.kit.hair === look.hair && P.kit.hairColor.every((v, i) => v === look.hairColor[i]) && P.look.face === 2, `${side}: the chosen face and hair go on the hero`);
    else ok(P.name === 'Тестов' && P.kit.pros.lFore === 'iron', 'the villain gets the name from the chronicle and keeps the iron left hand');
    ok(P.bag.some(s => s.id === 'silver') && P.bag.some(s => s.id === 'bandage') && P.fight.weapon === B.HERO_GEAR[hero][0] && S.caravans && S.world && S.people.some(q => q.role === 'shop'), `${side}: bag, weapon, roads, war and town are in place`);
    for (let i = 0; i < 60; i++) K.Move.step(P.mv, { fwd: 0, side: 0, yaw: P.mv.yaw }, 1 / 60, W);
    ok(Math.hypot(P.mv.pos[0] - p0[0], P.mv.pos[2] - p0[2]) < 0.05 && P.mv.onGround, `${side}: the start spot is free ground, not inside a house`);
  }

  const tS = Date.now(), Sd = Sv.start(W, { side: 'elf' }), rd = K.rng(12), pose = B.restPose(), sizes = [];
  const live = (S, sec, rnd) => { for (let i = 0; i < sec * 60; i++) { S.player.fight.aim = AI.idleAim(S.player); A.update(S.player.anim || (S.player.anim = A.state()), S.player.mv, 1 / 60); AI.run(S, 1 / 60, W, rnd, pose); S.time += 1 / 60; } };
  for (const day of [1, 10, 30]) {
    if (Sd.day < day) Wo.skip(Sd, W, (day - Sd.day) * 24, rd);
    live(Sd, 1, rd);
    const text = JSON.stringify(Sv.pack(Sd, W)), back = Sv.unpack(JSON.parse(text), W), again = JSON.stringify(Sv.pack(back, W));
    sizes.push([Sd.day, Sv.size(JSON.parse(text)) / 1024, Sv.hash(text)]);
    ok(text === again && Sv.hash(text) === Sv.hash(again), `day ${Sd.day}: save, load, save gives the same hash ${Sv.hash(text)}`);
    ok(Sv.size(JSON.parse(text)) <= 120 * 1024, `day ${Sd.day}: the save weighs ${(Sv.size(JSON.parse(text)) / 1024).toFixed(1)} KB, no more than 120 KB`);
  }
  const fork = () => { const S = Sv.unpack(JSON.parse(JSON.stringify(Sv.pack(Sd, W))), W); Wo.skip(S, W, 6, K.rng(99)); return Sv.hash(Sv.pack(S, W)); };
  ok(fork() === fork(), 'two loads of a day-30 save live the next six hours the same way');
  ok(Sd.people.length < 120 && Sd.world.reports.length > 30 && Sd.caravans.stats && Object.values(Sd.caravans.stats.arrived).reduce((a, b) => a + b, 0) > 20, `30 days pass with the world moving: ${Sd.people.length} people near, ${Sd.world.reports.length} reports (${((Date.now() - tS) / 1000).toFixed(1)} s)`);

  const Sk = Sv.start(W, { side: 'guard' }), before = Sk.people.length, cv0 = JSON.stringify(Sk.caravans.list.map(c => [c.id, Math.round(c.s)]));
  const evk = Wo.skip(Sk, W, 48, K.rng(4));
  ok(Sk.day === 3 && Math.abs(Sk.hour - Sv.STARTS.guard.hour) < 1e-6 && Sk.player && Sk.people.length <= before + 12 && JSON.stringify(Sk.caravans.list.map(c => [c.id, Math.round(c.s)])) !== cv0 && evk.length > 0, `two days skipped at the palace: clock moves, caravans move, nobody piles up by the hero (${before} → ${Sk.people.length})`);
  const Se = Sv.start(W, { side: 'elf' }), Sf = Sv.start(W, { side: 'elf' });
  K.Econ.wait(Se, Se.player, 4, { W, rnd: K.rng(3) });
  K.Econ.wait(Sf, Sf.player, 4);
  ok(Se.hour === Sf.hour && Se.world.reports.length >= Sf.world.reports.length && JSON.stringify(Se.caravans.list.map(c => c.s)) !== JSON.stringify(Sf.caravans.list.map(c => c.s)), 'waiting and sleeping with the world at hand move caravans and groups; the bare clock stays for old callers');

  const Sb = Sv.start(W, { side: 'guard' }), Pb = Sb.player;
  ok(Sv.blocked(Sb) === null, 'standing calmly at the barracks the hero may save');
  Pb.fight.bleed = Wn.bleed(); Pb.fight.bleed.heavy = 20;
  ok(/кровь/.test(Sv.blocked(Sb) || ''), 'no saving while bleeding: ' + Sv.blocked(Sb));
  Pb.fight.bleed = Wn.bleed();
  Pb.mv.swim = true;
  ok(/вод/.test(Sv.blocked(Sb) || ''), 'no saving in the water');
  Pb.mv.swim = false; Pb.mv.onGround = false;
  ok(/прыжк/.test(Sv.blocked(Sb) || ''), 'no saving in a jump');
  Pb.mv.onGround = true; Pb.fight.down = 'ko';
  ok(/сознан/.test(Sv.blocked(Sb) || ''), 'no saving without consciousness');
  Pb.fight.down = null;
  const foe = B.member(Sb.nextId++, 'villain', Pb.mv.pos[0] + 12, Pb.mv.pos[2], 0, W, null, 'm');
  foe.fight = C.fighter({ weapon: 'axe' }); foe.fight.hostile = Pb; Sb.people.push(foe);
  ok(/бою/.test(Sv.blocked(Sb) || ''), 'no saving while an enemy who knows of the hero stands within 25 m');
  foe.mv.pos[0] = Pb.mv.pos[0] + 30;
  ok(Sv.blocked(Sb) === null, 'at 30 m the hero may save again');

  const m = Sv.meta(Sd, T), rec = Sv.record('slot3', Sv.pack(Sd, W), m, 'data:image/jpeg;base64,AA', 5);
  ok(m.side === 'elf' && m.day === Sd.day && m.place && m.name === 'Эльф' && rec.size === Sv.size(rec.data) && rec.v === Sv.VERSION && rec.date === 5, 'a slot keeps the side, day of war, place, date, thumbnail and size');
  ok(Sv.autoSlot([]) === 'auto1' && Sv.autoSlot([{ id: 'auto1', date: 9 }]) === 'auto2' && Sv.autoSlot([{ id: 'auto1', date: 9 }, { id: 'auto2', date: 3 }, { id: 'auto3', date: 7 }]) === 'auto2', 'three autosaves go round: the oldest is written over');
  ok(Sv.SLOTS.length === 8 && Sv.AUTOS.length === 3 && Sv.QUICK === 'quick' && Sv.DB === 'kirill98' && Sv.STORE === 'saves', 'eight slots, quick save and three autosaves in IndexedDB kirill98, store saves');
  const clone = o => JSON.parse(JSON.stringify(o)), later = f => setImmediate(f);
  const fakeDB = () => {
    const stores = new Map();
    return {
      open() {
        const r = {};
        later(() => {
          r.result = {
            objectStoreNames: { contains: n => stores.has(n) },
            createObjectStore: n => stores.set(n, new Map()),
            transaction: n => { const s = stores.get(n), tx = {}, q = v => ({ result: v }); tx.objectStore = () => ({ getAll: () => q([...s.values()].map(clone)), get: id => q(s.has(id) ? clone(s.get(id)) : undefined), put: x => { s.set(x.id, clone(x)); return q(x.id); }, delete: id => { s.delete(id); return q(undefined); } }); later(() => tx.oncomplete()); return tx; },
            close() { }
          };
          if (!stores.size && r.onupgradeneeded) r.onupgradeneeded();
          r.onsuccess();
        });
        return r;
      }
    };
  };
  const slotData = Sv.pack(Sd, W), slotPos = Sd.player.mv.pos.slice();
  pending.push((async () => {
    const box = Sv.slots(fakeDB());
    await box.put(Sv.record('slot1', slotData, Sv.meta(Sd, T), null, 100));
    await box.put(Sv.record('quick', Sv.pack(Sk, W), Sv.meta(Sk, T), null, 200));
    const list = await box.list(), got = await box.get('slot1'), S2 = Sv.unpack(got.data, W);
    ok(list.length === 2 && list[0].id === 'quick' && !('data' in list[0]) && list[1].meta.side === 'elf', 'the slot list comes newest first and without the heavy world data');
    ok(Sv.hash(Sv.pack(S2, W)) === Sv.hash(slotData) && S2.player.mv.pos.every((v, i) => Math.abs(v - slotPos[i]) < 1e-3), 'a slot read back from IndexedDB continues from the same place');
    await box.remove('quick');
    ok((await box.list()).length === 1, 'a slot can be removed');
    let refused = false;
    try { await Sv.slots(null).list(); } catch (e) { refused = /IndexedDB/.test(e.message); }
    ok(refused, 'without IndexedDB the game says so instead of failing silently');
  })());

  const v9 = JSON.parse(JSON.stringify(Sv.pack(Sd, W)));
  v9.v = 9;
  delete v9.visited; delete v9.heard; delete v9.player.look; delete v9.player.name;
  const m9 = Sv.unpack(v9, W);
  ok(Array.isArray(m9.visited) && !m9.visited.length && Array.isArray(m9.heard) && !m9.player.look, 'a save of format 9 loads with empty visited places and heard caravans; the look comes from the hero');
  Sd.visited = ['korni', 'mostovica']; Sd.heard = [{ id: 'c1', kind: 'trade', at: [640.1234, 900.5], day: 3, hour: 9 }];
  const t10 = JSON.stringify(Sv.pack(Sd, W)), b10 = Sv.unpack(JSON.parse(t10), W);
  ok(JSON.stringify(Sv.pack(b10, W)) === t10 && b10.visited.join() === 'korni,mostovica' && b10.heard[0].at[0] === 640.123 && b10.player.look.face === Sd.player.look.face, 'save format 10: visited places, heard bells and the chosen look come back');

  const Sm = Sv.start(W, { side: 'elf' }), mo = P.SPOTS.find(s => s.id === 'mostovica'), ko = P.SPOTS.find(s => s.id === 'korni');
  Sm.hour = 12;
  const day = Wo.trip(Sm, W, mo.node, ko.node, 'elf');
  ok(day.length > 600 && day.length < 1600 && Math.abs(day.time - day.length / Wo.TRAVEL) < 1e-6 && Math.abs(day.hours - day.time / Wo.HOUR) < 1e-9 && day.pts.length > 3, `the map lays the way from Мостовица to Корни: ${Math.round(day.length)} m, ${Math.round(day.time)} s running (${day.hours.toFixed(1)} h)`);
  Sm.hour = 23;
  const night = Wo.trip(Sm, W, mo.node, ko.node, 'elf');
  ok(night.danger >= 1 && night.why.some(w => /волки/.test(w)) && day.danger <= night.danger, 'by night the forest road is dangerous: ' + night.why.join('; '));
  Sm.world.posts.outpost.side = 'villain';
  const out = Wo.trip(Sm, W, [1146, 700], [1240, 392], 'guard');
  ok(out.danger === 2 && out.why.some(w => /людей Злого/.test(w)) && out.word === 'очень опасно', 'the way to a post the enemy holds is very dangerous: ' + out.why.join('; '));

  ok(D.easy.heavy === 60 && D.normal.heavy === 45 && D.hard.heavy === 30 && D.easy.harm === 0.75 && D.hard.harm === 1.25 && D.easy.ko === 30 && D.normal.ko === 20 && D.hard.ko === 10, 'difficulty follows plan 8.16: bleeding 60/45/30 s, enemy damage ×0.75/×1/×1.25, rescue window 30/20/10 s');
  const cutOf = rules => { const h = { kit: B.copyKit(B.HEROES['guard.m'].kit), fight: C.fighter({ weapon: 'sword' }) }; h.kit.hero = 'guard.m'; if (rules) h.fight.rules = rules; Wn.hurt(h, { cut: 5, part: 5, damage: 10, type: 'chop', material: 'flesh' }); Wn.knockOut(h.fight); return [h.fight.bleed.heavy, h.fight.ko]; };
  ok(cutOf(D.hard).join() === '30,10' && cutOf(D.easy).join() === '60,30' && cutOf(null).join() === '45,20', 'a cut arm bleeds the time of the difficulty, and the faint lasts as long as the rescue window');
  const hitWith = rules => { const a = { kit: B.kit('villain', 'm', K.rng(2)), fight: C.fighter({ weapon: 'axe' }), mv: K.Move.body(W, 100, 100, 0) }, d = { kit: B.copyKit(B.HEROES['guard.m'].kit), fight: C.fighter({ weapon: 'sword' }), mv: K.Move.body(W, 100, 101, Math.PI) }; a.fight.act = { kind: 'swing', power: 1 }; if (rules) d.fight.rules = rules; return C.strike(a, d, { part: 1, onBlade: true, at: [100, 1, 101] }, 'chop', () => 0.5).damage; };
  ok(Math.abs(hitWith(D.hard) / hitWith(null) - 1.25) < 1e-9 && Math.abs(hitWith(D.easy) / hitWith(null) - 0.75) < 1e-9, 'enemy blows on the hero scale with the difficulty');

  const ui = read(`${DIR}/ki-ui.js`), scr = read(`${DIR}/ki-screens.js`), sv = read(`${DIR}/ki-save.js`), rn = read(`${DIR}/ki-render.js`);
  ok(/if \(!this\.opts\.shots\) this\.openTitle\(\)/.test(ui) && /'KeyM'/.test(ui) && /K\.Save\.slots\(globalThis\.indexedDB/.test(ui) && /kirill98_settings/.test(ui), 'the game opens on the title map, M opens the valley map, slots live in IndexedDB, settings in kirill98_settings');
  ok(['title(ui)', 'pond(ui)', 'muster(ui)', 'chronicle(ui)', 'slots(ui, mode)', 'settings(ui)', 'map(ui)'].every(f => scr.includes('    ' + f + ' {')) && ['ki-title', 'ki-pond', 'ki-muster', 'ki-chronicle', 'ki-slots', 'ki-settings', 'ki-map'].every(c => scr.includes(`'${c}`)), 'title map, pond, muster, chronicle, slots, settings and map are separate screens');
  ok(/Земли людей: здесь не воюют/.test(scr) && /side: null/.test(scr) && /ZONE_INFO\[ui\.T\.zoneAt\(x, z\)\]; if \(I && I\.side\) ui\.openStart/.test(scr), 'zone 1 on the title map is signed and cannot be chosen');
  ok(['512×384', '640×480', '800×600', 'Радиус 3D-деревьев', 'Дальность леса', '16-битный цвет', 'Предел тел', "'Звук'", "'Музыка'", 'Чувствительность', 'Инверсия мыши', 'Сложность', 'границу 3D-деревьев'].every(s => scr.includes(s)), 'the settings screen has every option of plan 8.16');
  ok(/Вас некому было вынести/.test(ui) && /Последний удар/.test(ui) && /ui\.openSlots\('load', 'fallen'\)/.test(scr) && /data-act="menu">Главное меню/.test(scr), 'the death screen says where and from what, and offers loading and the main menu');
  ok(/BAYER\[16\]/.test(rn) && /vec3\(31\.0, 63\.0, 31\.0\)/.test(rn) && /v\.dither \? this\.target\(w, h\)/.test(rn), '16-bit colour: 5-6-5 levels with a 4×4 ordered dither after the 3D picture');
  ok(/getAll/.test(sv) && /keyPath: 'id'/.test(sv) && /toDataURL\('image\/jpeg'/.test(ui) && /c\.width = 160;\r?\n\s+c\.height = 120;/.test(ui), 'each slot keeps a 160×120 thumbnail of the frame');
}

{
  const Sv = K.Save, Wo = K.World, L = K.Elves, AI = K.AI, A = K.Anim, B = K.Body, C = K.Combat, Nv = K.Nav, KO = P.KORNI, town = P.town(T);
  const korni = P.BUILDINGS.filter(b => b.korni);
  ok(korni.length === 12 && korni.filter(b => b.id.startsWith('izba')).length === 7 && korni.filter(b => b.lift).length === 3 && korni.some(b => b.id === 'ryabina') && korni.some(b => b.id === 'yasen') && L.HOUSES.length === 12, 'Корни: seven log houses, three houses on platforms, Рябина\'s hut and Ясень\'s workshop, 12 houses as in the war');
  ok(town.wells.length === 2 && town.beds.some(b => b.id === 'korni-hero') && town.chests.some(c => c.id === 'korni-hero') && town.fits.yasen && town.keepers.ryabina && town.keepers.yasen, 'two wells, the hero\'s bed and chest, Ясень\'s fitting stand, keepers for Рябина and Ясень');
  ok(korni.filter(b => b.lift).every(b => Math.abs(town.houses[b.id].floor - (T.heightAt(b.x, b.z) + b.lift)) < 1e-6), 'the platform houses stand on the platforms at 10–11 m');
  const NK = Nv.of(W), centre = [338, 712];
  const rooms = korni.filter(b => !b.lift).map(b => b.id), into = rooms.filter(id => { const r = Nv.find(NK, centre, town.doors[id].inside); return r && r.ok; });
  ok(into.length === rooms.length, 'a path leads from the middle of Корни into every house on the ground: ' + into.length + ' of ' + rooms.length);
  const plen = (a, pts) => { let s = 0, q = a; for (const r of pts) { s += Math.hypot(r[0] - q[0], r[1] - q[1]); q = r; } return s; };
  const crosses = (a, pts) => { let q = a; for (const r of pts) { if ((q[1] - 100) * (r[1] - 100) < 0) { const x = q[0] + (r[0] - q[0]) * (100 - q[1]) / (r[1] - q[1]); if (x > 95.7 && x < 104.3) return true; } q = r; } return false; };
  const Nt = Nv.of(flat([{ x: 100, z: 100, w: 8, d: 0.25, h: 3, kind: 'wood' }])), across = Nv.find(Nt, [100, 102], [100, 98]);
  ok(across.ok && plen([100, 102], across.pts) > 8 && !crosses([100, 102], across.pts), `a path does not slip through a log wall 0.25 m thick: ${plen([100, 102], across.pts).toFixed(1)} m round it`);

  const r0 = L.roster();
  ok(r0.length === 44 && r0.filter(r => r.fighter).length === 18 && ['Вяз', 'Ольха', 'Рябина', 'Ясень', 'Мох'].every(n => r0.some(r => r.name === n)) && new Set(r0.map(r => r.name)).size === 44, '44 residents by name, 18 can fight; Вяз, Ольха, Рябина, Ясень and Мох among them');

  const Sk = Sv.start(W, { side: 'elf' }), Pk = Sk.player, rk = K.rng(21), pose = B.restPose();
  Pk.anim = A.state(); Pk.frames = new Float32Array(132);
  const run = (S, sec, rnd) => { const ev = []; for (let i = 0; i < sec * 60; i++) { if (S.player) { S.player.fight.aim = AI.idleAim(S.player); A.update(S.player.anim, S.player.mv, 1 / 60); } ev.push(...AI.run(S, 1 / 60, W, rnd || rk, pose).events); S.time += 1 / 60; } return ev; };
  ok(T.zoneAt(Pk.mv.pos[0], Pk.mv.pos[2]) === 3 && P.town(T).houses['izba-hero'] && Math.hypot(Pk.mv.pos[0] - 365, Pk.mv.pos[2] - 735) < 5 && Sk.hour === 6 && L.introStep(Sk) === 'wake', 'the elf wakes at dawn inside his log house in Корни, the first 20 minutes begin');
  run(Sk, 1);
  const vil = Sk.people.filter(q => q.villager !== undefined), olha = vil.find(q => q.name === 'Ольха');
  ok(vil.length === 44 && Sk.village.live && Math.hypot(olha.act.post[0] - Pk.mv.pos[0], olha.act.post[1] - Pk.mv.pos[2]) < 5, 'near Корни all 44 residents come out by name, Ольха waits at the hero\'s door');

  const ev = [];
  ok(/Ольха/.test(L.talked(Sk, 'leader', ev)) && L.introStep(Sk) === 'bow', 'Ольха wakes the hero: a caravan goes along the forest road');
  run(Sk, 0.2);
  const straw = Sk.people.filter(q => q.introStraw === 'target');
  ok(straw.length === 3 && Sk.people.some(q => q.introStraw === 'dummy'), 'stumps for shooting: three straw targets and a straw dummy with arms that come off');
  const hits = n => { const list = []; for (let k = 0; k < n; k++) list.push({ kind: 'hit', who: Pk, to: straw[k % 3], missile: 'arrow', at: [0, 0, 0] }); L.post(Sk, list, W, rk); };
  hits(2);
  ok(L.introStep(Sk) === 'bow' && Sk.campaign.intro.hits === 2, 'two arrows in the straw are not yet enough');
  hits(1);
  L.post(Sk, [{ kind: 'cut', who: Pk, to: Sk.people.find(q => q.introStraw === 'dummy'), at: [0, 0, 0], parts: [3] }], W, rk);
  ok(L.introStep(Sk) === 'road' && olha.squad === 'player', 'three arrows and an arm cut off the dummy: Ольха goes with the hero to the road');
  const spot = K.Caravan.sawnSpots().slice().sort((a, b) => Math.hypot(a.at[0] - 642, a.at[1] - 715) - Math.hypot(b.at[0] - 642, b.at[1] - 715))[0];
  Pk.mv = K.Move.body(W, spot.at[0] + 4, spot.at[1], 0);
  run(Sk, 0.1);
  const cv = K.Caravan.byId(Sk, Sk.campaign.intro.caravan), cline = K.Caravan.routes().bread.line;
  const escorts = cv ? cv.crew.filter(m => m.role === 'escort').length + K.Caravan.crewOf(Sk, cv).filter(q => q.role === 'escort').length : 0;
  ok(L.introStep(Sk) === 'fell' && cv && escorts === 2 && K.Terrain.nearest(cline, spot.at[0], spot.at[1]).s - cv.s > 150, 'at the road the bells come from a bread caravan 170 m away with two mercenaries');
  L.post(Sk, [{ kind: 'treefall', spot: spot.id, at: [0, 0, 0] }], W, rk);
  ok(L.introStep(Sk) === 'ambush', 'the felled pine starts the ambush');
  cv.done = true;
  run(Sk, 0.1);
  ok(L.introStep(Sk) === 'carry', 'with the guards beaten the bales go to the store');
  Sk.caravans.stores.elf = { bread: 2 };
  run(Sk, 0.1);
  ok(L.introStep(Sk) === 'smoke' && Sk.campaign.intro.patrol.length === 4 && Sk.village.houses['izba-moh'].fire > 0 && vil.find(q => q.name === 'Мох').kit.cut.lFore === 'fresh', 'back home: smoke over Корни, a patrol of four set Мох\'s house on fire, Мох lost his arm');
  for (const id of Sk.campaign.intro.patrol) Sk.people.find(q => q.id === id).fight.down = 'dead';
  run(Sk, 0.1);
  ok(L.introStep(Sk) === 'fire', 'the patrol is beaten, the fire is still burning');
  L.pour(Sk, 'izba-moh', 5);
  run(Sk, 0.1);
  ok(L.introStep(Sk) === 'moh', 'the fire is out: now Мох bleeds');
  L.post(Sk, [{ kind: 'bound', who: Pk, to: vil.find(q => q.name === 'Мох') }], W, rk);
  run(Sk, 0.1);
  ok(L.introStep(Sk) === 'elders' && /Рябина/.test(L.talked(Sk, 'healer', [])) && /Ясень/.test(L.talked(Sk, 'carver', [])), 'Мох bandaged: Рябина and Ясень with the carved hands on the wall');
  run(Sk, 0.1);
  ok(L.introStep(Sk) === 'council' && /Вяз/.test(L.talked(Sk, 'elder', [])) && L.introStep(Sk) === 'free', 'the council at the oak, then free play');

  const Sf = Sv.start(W, { side: 'elf', intro: false }), rf = K.rng(8);
  Sf.player.mv = K.Move.body(W, 340, 700, 0);
  Sf.player.anim = A.state(); Sf.player.frames = new Float32Array(132);
  run(Sf, 0.5, rf);
  L.ignite(Sf, 'izba-6');
  const h6 = Sf.village.houses['izba-6'];
  run(Sf, 10, rf);
  ok(h6.fire > 0.4 && h6.hp < 100 && !h6.burnt && L.burning(Sf).includes('izba-6'), `a log house burns harder and loses strength: fire ${h6.fire.toFixed(2)}, ${h6.hp.toFixed(0)} of 100`);
  ok(L.flames(Sf).length >= 4 && Sf.smokes.some(s => s.id === 'h:izba-6') && L.burntKey(Sf) === '', 'a burning house shows flames and smoke, it is not burnt yet');
  const Sb = Sv.start(W, { side: 'elf', intro: false }), rb = K.rng(4);
  Sb.player.mv = K.Move.body(W, 200, 900, 0);
  Sb.player.anim = A.state(); Sb.player.frames = new Float32Array(132);
  L.state(Sb).houses['izba-olha'].fire = 1;
  const evb = []; for (let k = 0; k < 140; k++) { Sb.hour = 12; evb.push(...L.run(Sb, 1, W, rb)); }
  ok(L.state(Sb).houses['izba-olha'].burnt && evb.some(e => e.kind === 'houseBurnt') && Sb.world.sides.elf.houses === 11 && Sb.world.sides.elf.burnt === 1 && L.burntKey(Sb) === 'izba-olha', 'a house left burning burns down in about 90 s: the war counts 11 houses, the picture shows it charred');
  const n = L.call(Sf, [340, 0, 748]);
  run(Sf, 50, rf);
  ok(n >= 4 && h6.fire === 0 && !h6.burnt, `the call brings ${n} residents with buckets, the chain from the well puts the fire out`);

  const Sr = Sv.start(W, { side: 'elf', intro: false }), Pr = Sr.player;
  Sr.standing.respect = 0;
  Pr.bag.push({ id: 'meat', n: 6 }, { id: 'herbs', n: 4 }, { id: 'silver', n: 30 });
  const food0 = L.stockOf(Sr).food, d1 = L.deposit(Sr, Pr, 'meat');
  ok(d1.ok && d1.n === 6 && L.stockOf(Sr).food === food0 + 6 && Sr.standing.respect > 0 && !Pr.bag.some(s => s.id === 'meat'), `meat goes to the store: food +6, respect of the village +${d1.gain.toFixed(1)}`);
  L.deposit(Sr, Pr, 'silver', 30);
  ok(L.stockOf(Sr).silver === 50 && !L.deposit(Sr, Pr, 'knife').ok, 'silver goes into the common purse; a knife is not for the store');
  ok(L.take(Sr, Pr, 'stakes').ok && Pr.bag.some(s => s.id === 'stakes') && L.stockOf(Sr).wood === 58, 'stakes for a pit cost the store two logs of wood');
  const before = Sr.standing.respect;
  L.react(Sr, [{ kind: 'bound', who: Pr, to: { villager: 3 } }]);
  ok(Sr.standing.respect === before + 2, 'bandaging a resident raises the respect by 2');
  ok(!L.build(Sr, 'workshop').ok, 'the workshop needs iron and silver from the store first');
  Object.assign(L.stockOf(Sr), { wood: 200, iron: 30, cloth: 30, food: 100 });
  L.state(Sr).stock.silver = 400;
  ok(L.build(Sr, 'workshop').ok && L.build(Sr, 'abatis').ok && L.build(Sr, 'tower').ok && L.build(Sr, 'garden').ok && Sr.village.upgrades.workshop, 'with enough in the store the village builds the workshop, the abatis, the tower and the garden');
  const people0 = Sr.world.sides.elf.people;
  ok(L.build(Sr, 'house4').ok && Sr.world.sides.elf.people === people0 + 4 && Sr.village.people.length === 48, 'the fourth platform house brings four more residents');
  Pr.kit.cut = { lFore: 'healed' };
  Sr.standing.respect = 5;
  const carved = K.Econ.fitOptions(Sr, Pr, 'lFore', 'yasen').find(o => o.id === 'carvedArm');
  ok(carved && carved.how === 'side' && carved.price === 0, 'with Ясень\'s workshop built his carved hand is free even at low respect');
  Pr.bag = Pr.bag.filter(s => s.id !== 'bandage');
  ok(L.take(Sr, Pr, 'bandage').ok && L.take(Sr, Pr, 'tincture').ok, 'Рябина\'s garden gives bandages and tinctures for free');
  Object.assign(Sr.village.houses['izba-3'], { hp: 0, fire: 0, burnt: true });
  L.sync(Sr);
  const h0 = Sr.world.sides.elf.houses, rb2 = L.rebuild(Sr, 'izba-3');
  ok(rb2.ok && Sr.world.sides.elf.houses === h0 + 1 && !Sr.village.houses['izba-3'].burnt, 'a burnt house is rebuilt for 30 wood and 40 silver');
  ok(L.trapFactor(Sr) <= 0.75 && Sr.village.upgrades.abatis, 'the abatis makes a raid on Корни a quarter weaker');

  const St = Sv.start(W, { side: 'elf', intro: false }), Pt = St.player;
  Pt.mv = K.Move.body(W, 420, 692, Math.PI / 2);
  Pt.bag.push({ id: 'stakes', n: 1 }, { id: 'snare', n: 1 });
  const t1 = L.place(St, Pt, 'pit');
  Pt.mv.yaw = -Math.PI / 2;
  const t2 = L.place(St, Pt, 'snare');
  ok(t1.ok && t2.ok && St.village.traps.length === 2 && !L.place(St, Pt, 'pit').ok, 'the hero sets a pit with stakes and a snare; without stakes no third trap');
  const foe = B.member(St.nextId++, 'guard', t1.trap.at[0], t1.trap.at[1], 0, W), friend = B.member(St.nextId++, 'elf', t2.trap.at[0], t2.trap.at[1], 0, W);
  St.people.push(foe, friend);
  const evt = [];
  for (let k = 0; k < 3; k++) evt.push(...L.run(St, 0.05, W, K.rng(1)));
  ok(evt.some(e => e.kind === 'trap' && e.who === foe) && foe.mv.hold > 3 && foe.fight.life < 80 && K.Wounds.bleeding(foe.fight) && !evt.some(e => e.who === friend) && St.village.traps.find(t => t.id === t2.trap.id).armed, 'a guard falls into the pit: held 5 s, wounded and bleeding; an elf walks past the snare');

  const Sh = Sv.start(W, { side: 'elf', intro: false }), Ph = Sh.player, h = P.HERB_SPOTS[0];
  Ph.mv = K.Move.body(W, h[0], h[1], 0);
  const hi = L.herbAt(Sh, Ph.mv.pos);
  ok(hi === 0 && L.pick(Sh, Ph, hi) === 2 && L.herbAt(Sh, Ph.mv.pos) === -1, 'herbs by the trails give two bunches a day');
  const ca = P.CACHES.find(c => c.id === 'waterfall');
  Ph.mv = K.Move.body(W, ca.at[0], ca.at[1], 0);
  const got = L.openCache(Sh, Ph, L.cacheAt(Sh, Ph.mv.pos));
  ok(got && Ph.bag.some(s => s.id === 'willowLeg') && Ph.bag.some(s => s.id === 'resinEye') && !L.cacheAt(Sh, Ph.mv.pos) && P.CACHES.length === 2, 'the old carver\'s cache by the waterfall holds a willow leg and a resin eye, once');
  ok(!L.takePlans(Sh, Ph), 'there are no assault plans before day 10');
  Sh.day = 12;
  ok(L.takePlans(Sh, Ph) && Sh.campaign.plans === 'taken', 'from day 10 the plans lie in the cutters\' chest');
  Sh.world.sides.guard.anger.elf = 50;
  ok(L.deliverPlans(Sh, Ph) && Sh.world.sides.guard.anger.elf === 0 && Sh.campaign.plans === 'delivered', 'the plans dropped at the palace gate end the empire\'s anger at the elves');
  Object.assign(Sh.world.sides.villain, { ladders: 5, ram: 1 });
  Sh.world.sides.villain.stock.logs = 80;
  const burnt = L.burnStack(Sh);
  ok(burnt && burnt.ladders === 5 && Sh.world.sides.villain.ladders === 0 && !Sh.world.sides.villain.ram && Sh.world.sides.villain.stock.logs === 40 && Sh.campaign.burned === 12, 'ladders and ram burnt at the cutters\' camp: the villain\'s readiness falls');

  const Sm = Sv.start(W, { side: 'elf', intro: false });
  Sm.hour = 6.5;
  Sm.caravans.list.push(Object.assign(K.Caravan.make(Sm, 'ore', Sm.day, 10, K.rng(2))));
  const m = L.morning(Sm), tk = L.tasks(Sm);
  ok(m && m.lines.some(l => /рудный корован/.test(l)) && L.morning(Sm) === null && tk.some(t => t.kind === 'ambush') && tk.some(t => t.kind === 'raid') && tk.some(t => t.kind === 'herbs'), 'scouts report in the morning; the council offers an ambush, raids, herbs and hunting');

  const world = o => { const S = { seed: 9, day: 1, hour: 6, time: 0, nextId: 30000, version: 0, people: [], bodies: [], parts: [], items: [], blood: [], missiles: [], stuck: [], chairs: [], player: null, squad: null, standing: { service: 0, respect: 0, loyalty: 0 }, campaign: { side: 'elf' } }; Object.assign(S, o || {}); K.Caravan.init(S, K.rng(3)); Wo.state(S); S.T = T; L.state(S); return S; };
  const Se = world();
  ok(L.ending(Se).id === 'hold', 'whole houses and people: «Лес держится»');
  for (const id of L.HOUSES.slice(0, 6)) Se.village.houses[id].burnt = true;
  ok(L.ending(Se).id === 'burnt', 'half the houses burnt, people alive: «Корни сгорели, но люди живы»');
  Se.world.sides.elf.people = 9;
  ok(L.ending(Se).id === 'lost', 'few people left: «Корни потеряны»');
  const Sg = world({ day: 26 });
  Sg.campaign.grudge = 70;
  L.plan(Sg, K.rng(5));
  const fg = Sg.world.groups.find(g => g.final === 'fire');
  ok(fg && fg.n >= 25 && fg.fire && fg.dogs && fg.target === 'korni' && Sg.campaign.finales.fire && Sg.campaign.part === 3, `finale «Огонь»: when the empire's grudge is high the palace sends ${fg && fg.n} men with torches and dogs to Корни`);
  const Sd = world({ day: 26 });
  Sd.campaign.grudge = 70;
  Sd.campaign.plans = 'delivered';
  L.plan(Sd, K.rng(5));
  ok(!Sd.world.groups.some(g => g.final === 'fire'), 'with the plans delivered «Огонь» does not come');
  const Sl = world({ day: 27 });
  Sl.world.assault = { day: 26, n: 60, result: 'taken', ended: 27 };
  Sl.world.sides.villain.men = 50;
  L.plan(Sl, K.rng(5));
  ok(Sl.campaign.finales.logs && Sl.world.groups.some(g => g.final === 'logs' && g.target === 'korni' && g.fire), 'finale «Брёвна»: after the palace falls the villain\'s army comes to cut Корни');
  const Sw = world({ day: 25 });
  Object.assign(Sw.world.sides.villain, { ram: 1, ladders: 6, intel: 3, morale: 60, men: 62 });
  Sw.world.sides.villain.stock.iron = 150;
  Sw.hour = 6;
  Wo.plan(Sw, K.rng(3));
  const ga = Sw.world.groups.find(g => g.kind === 'assault');
  ok(ga && ga.via === 'forest', 'the army with the ram goes the long way by the forest road');
  const Sc = world({ day: 1 });
  for (let k = 0; k < 120 && !Sc.campaign.ending; k++) Wo.skip(Sc, W, 12, K.rng(11));
  ok(!!Sc.campaign.ending && L.ENDINGS[Sc.campaign.ending.id] && Sc.campaign.ending.day >= 25, `the campaign reaches its ending on its own: ${Sc.campaign.ending && Sc.campaign.ending.name}, day ${Sc.campaign.ending && Sc.campaign.ending.day}`);

  run(Sf, 0.1, rf);
  Sf.village.oak.push('Терн');
  Sf.village.traps.push({ id: 'trx', kind: 'pit', at: [420, 690], armed: true, by: 'player', day: 1 });
  const s11 = JSON.stringify(Sv.pack(Sf, W)), b11 = Sv.unpack(JSON.parse(s11), W);
  ok(JSON.stringify(Sv.pack(b11, W)) === s11 && JSON.parse(s11).v === Sv.VERSION && b11.village.live && b11.village.oak.includes('Терн') && b11.village.traps.length === 1 && b11.people.filter(q => q.villager !== undefined).length === 44 && b11.campaign.side === 'elf', 'save format 11: the village, its residents, traps, names on the oak and the campaign come back');
  ok(Sv.size(JSON.parse(s11)) <= 120 * 1024, `with all of Корни awake the save weighs ${(Sv.size(JSON.parse(s11)) / 1024).toFixed(1)} KB`);
  const v10 = JSON.parse(s11);
  v10.v = 10; delete v10.village; delete v10.campaign; delete v10.guard;
  const m10 = Sv.unpack(v10, W);
  ok(!m10.village && !m10.campaign, 'a save of format 10 loads; the village is made anew');

  const ui = read(`${DIR}/ki-ui.js`), scr = read(`${DIR}/ki-screens.js`);
  ok(/'KeyJ', 'KeyZ'/.test(ui) && /K\.Screens\.village\(this\)/.test(ui) && /K\.Elves\.place\(S, P/.test(ui) && ['council(ui', 'elfTalk(ui', 'store(ui', 'village(ui', 'ending(ui'].every(f => scr.includes('    ' + f)), 'J opens the village, Z sets a trap; council, resident talk, store, village and chronicle are screens of their own');
}

{
  const Sv = K.Save, Wo = K.World, Gd = K.Guard, E = K.Econ, PP = P.PALACE_PTS, Nv = K.Nav, town = P.town(T);
  const palace = P.BUILDINGS.filter(b => b.palace);
  ok(palace.length === 9 && ['barracks', 'infirmary', 'guardhouse', 'armory', 'treasury', 'throne', 'stables', 'kennel', 'gate-booth'].every(id => palace.some(b => b.id === id)) && P.BUILDINGS.filter(b => b.id.startsWith('tsarevo-')).length === 12 && P.BUILDINGS.some(b => b.id === 'outpost-hut'), 'the palace has barracks, infirmary, guardhouse, armory, treasury, throne hall, stables, kennel and the gate booth; Царёво has 12 houses, the outpost a hut');
  ok(town.beds.filter(b => b.building === 'barracks').length === 12 && town.beds.some(b => b.id === 'palace-hero') && town.beds.some(b => b.id === 'cell') && town.chests.some(c => c.id === 'trophies') && town.chests.some(c => c.id === 'palace-hero'), '12 beds in the barracks with the hero\'s own, a cell at the guardhouse, the trophy chest in the armory');
  const NP = Nv.of(W), yard = [1225, 705];
  const rooms = ['barracks', 'infirmary', 'guardhouse', 'armory', 'throne', 'kennel'], into = rooms.filter(id => { const r = Nv.find(NP, yard, town.doors[id].inside); return r && r.ok; });
  ok(into.length === rooms.length, 'a path leads from the yard into every open palace building: ' + into.length + ' of ' + rooms.length);
  const gate = Nv.find(NP, [1120, 700], yard);
  ok(gate && gate.ok, 'a path leads from the road through the palace gate into the yard');

  const r0 = Gd.roster();
  ok(r0.length === 29 && r0.filter(r => r.ten).length === 9 && ['commander', 'medic', 'veteran', 'emperor', 'quarter', 'kennel'].every(k => r0.some(r => r.role === k)) && Gd.TEN.join() === 'Гаврила,Сенька,Фома,Прохор,Ерёма,Тихон,Афоня,Кузьма,Лука', 'the palace roster: Строгов, Савва, Митрофан, the emperor, the quartermaster, the kennel master, the ten and 14 more guards');
  ok(Gd.RANKS.map(r => r.name + r.pay).join() === 'Рядовой12,Старший20,Десятник30,Сотник45' && Gd.rankOf(5.9).name === 'Рядовой' && Gd.rankOf(6).name === 'Старший' && Gd.rankOf(14).name === 'Десятник' && Gd.rankOf(26).name === 'Сотник', 'ranks at service 6, 14 and 26 with pay 12, 20, 30 and 45 a day');

  const fresh = () => { const S = Sv.start(W, { side: 'guard', intro: false }); S.campaign = { side: 'guard' }; return S; };
  const Si = Sv.start(W, { side: 'guard' });
  ok(Si.hour === 6.75 && Si.campaign.side === 'guard' && Gd.introStep(Si) === 'muster' && Math.hypot(Si.player.mv.pos[0] - town.doors.barracks.inside[0], Si.player.mv.pos[2] - town.doors.barracks.inside[1]) < 1 && /пятое место/.test(Gd.introGoal(Si)), 'the guard starts at 6:45 in the barracks; the first goal is the muster at the fifth place in the line');

  const ev = [], Sr = fresh();
  Gd.state(Sr);
  for (let i = 0; i < 6; i++) Gd.note(Sr, 1, 'проба', ev);
  ok(Sr.standing.service === 6 && ev.some(e => e.kind === 'rank' && e.up && e.rank === 'Старший') && Sr.guard.book.length === 6, 'service is written in the book; at 6 comes the rank of Старший');
  Gd.note(Sr, -1, 'проба', ev);
  ok(ev.some(e => e.kind === 'rank' && !e.up && e.rank === 'Рядовой'), 'falling below 6 takes the rank away');
  Gd.note(Sr, -15, 'проба', ev);
  ok(Sr.campaign.ending && Sr.campaign.ending.id === 'expelled' && ev.some(e => e.kind === 'ending'), 'at service −10 the hero is expelled: «Выгнан со службы»');

  const Sm = fresh(), Pm = Sm.player, rnd = K.rng(4), silver = Pl => (Pl.bag.find(s => s.id === 'silver') || { n: 0 }).n;
  Sm.day = 2; Sm.hour = 6.9;
  Pm.mv = K.Move.body(W, PP.line[PP.hero][0], PP.line[PP.hero][1], Math.PI);
  const s0 = silver(Pm), em = Gd.run(Sm, 1 / 60, W, rnd);
  const mu = em.find(e => e.kind === 'muster');
  ok(mu && mu.names.length === 9 && mu.pay === 12 && silver(Pm) === s0 + 12 && Sm.guard.order && Sm.guard.order.state === 'given' && !mu.late, 'muster at 7:00: the roll call of the ten, pay 12 silver, the order of the day');
  const Sl = fresh();
  Sl.day = 3; Sl.hour = 6.9;
  Gd.run(Sl, 1 / 60, W, rnd);
  Sl.hour = 7.61;
  const s1 = silver(Sl.player), el = Gd.run(Sl, 1 / 60, W, rnd);
  ok(el.some(e => e.kind === 'muster' && e.late && e.pay === 0) && silver(Sl.player) === s1 && Sl.standing.service === -1, 'late for the muster: service −1 and no pay that day');

  const post = kind => { const S = fresh(); S.day = 2; S.hour = 8; Gd.state(S).order = Gd.makeOrder(S, rnd, kind); return S; };
  const Sp = post('gate'), Op = Sp.guard.order;
  Sp.player.mv = K.Move.body(W, Op.at[0], Op.at[1], 0);
  Gd.run(Sp, 1, W, rnd);
  Sp.player.mv = K.Move.body(W, Op.at[0] - 40, Op.at[1], 0);
  for (let i = 0; i < 32; i++) Gd.run(Sp, 1, W, rnd);
  ok(Op.state === 'failed' && Sp.standing.service === -2, 'leaving the post for more than 30 s: service −2');
  const Sw = post('wall'), Ow = Sw.guard.order;
  Sw.player.mv = K.Move.body(W, Ow.at[0], Ow.at[1], 0);
  Gd.run(Sw, 1, W, rnd);
  Sw.hour = 19;
  Gd.run(Sw, 1, W, rnd);
  ok(Ow.state === 'done' && Sw.standing.service === 1, 'the post held till evening: service +1');
  const St = post('patrol'), Ot = St.guard.order;
  for (const q of Ot.pts) { St.player.mv = K.Move.body(W, q[0], q[1], 0); Gd.run(St, 1, W, rnd); }
  ok(Ot.state === 'done' && St.standing.service === 1 && Ot.pts.length >= 7 && ['ford', 'fields', 'outpost'].includes(Ot.route), 'the patrol walked through every checkpoint: service +1');
  const Sd = post('duty'), Od = Sd.guard.order;
  Sd.player.mv = K.Move.body(W, Od.at[0], Od.at[1], 0);
  for (let i = 0; i < 22; i++) Gd.run(Sd, 1, W, rnd);
  ok(Od.state === 'done' && Od.skip === 2, 'the stable duty is served and skips two hours');
  const Sx = post('treasury');
  Sx.day = 3;
  Gd.run(Sx, 1, W, rnd);
  ok(Sx.guard.order.state === 'failed' && Sx.standing.service === -1, 'an order not carried out by the next day: service −1');

  const Sk = fresh();
  Sk.day = 8;
  Wo.state(Sk);
  ok(Gd.pickOrder(Sk, rnd).kind === 'relief', 'day 8: the ten are sent to relieve the outpost');
  Sk.day = 10;
  ok(Gd.pickOrder(Sk, rnd).kind === 'escort', 'every seventh day from the third an escort of the treasury caravan');
  Sk.day = 11;
  Wo.launch(Sk, 'guard', 'punish', Wo.POSTS.palace.gate, Wo.POSTS.korni.at, 10, { target: 'korni', fire: true, dogs: true });
  ok(Gd.pickOrder(Sk, rnd).kind === 'raid', 'when the palace punishes Корни the ten march in the raid');

  const Sv1 = fresh();
  Sv1.day = 4;
  Wo.state(Sv1);
  Wo.launch(Sv1, 'villain', 'spy', Wo.POSTS.fort.at, Wo.POSTS.palace.at, 1, { target: 'palace' });
  Wo.launch(Sv1, 'villain', 'spy', Wo.POSTS.fort.at, Wo.POSTS.palace.at, 1, { target: 'palace' });
  const V = Gd.visitorsFor(Sv1, K.rng(8)), spies = V.list.filter(v => v.spy), honest = V.list.filter(v => !v.spy);
  ok(V.list.length >= 8 && spies.length === 2 && spies.every(v => v.signs.length >= 1) && honest.every(v => !v.signs.length && !v.fake && v.date === 4), `${V.list.length} visitors at the gate, two spies of Злой, each with a sign: ${spies.map(v => v.signs.join('+')).join(', ')}`);
  Gd.state(Sv1).visitors = V;
  const visitor = v => ({ visitor: Object.assign({}, v, { state: 'queue' }), act: null, mv: K.Move.body(W, PP.queue[0], PP.queue[1], 0) });
  const spy = visitor(spies[0]), spy2 = visitor(spies[1]), hon = visitor(honest[0]), hon2 = visitor(honest[1]);
  const sv0 = silver(Sv1.player), ev1 = [];
  ok(Gd.decide(Sv1, spy, 'hold', ev1) && spy.state === 'jailed' && silver(Sv1.player) === sv0 + 50 && Sv1.standing.service === 2 && V.spiesCaught === 1, 'a spy held at the gate: 50 silver reward and service +2');
  Gd.decide(Sv1, hon, 'hold', ev1);
  ok(Sv1.standing.service === 1 && Sv1.relations.town === -5 && V.wrong === 1, 'an honest man held: service −1, the town remembers');
  const intel = Sv1.world.sides.villain.intel || 0;
  Gd.decide(Sv1, spy2, 'pass', ev1);
  ok(Sv1.world.sides.villain.intel === Math.min(3, intel + 1) && V.spiesMissed === 1, 'a spy let through tells Злой about the palace');
  ok(Gd.decide(Sv1, hon2, 'turn', ev1) === 'Разворачивайся.' && Gd.decide(Sv1, hon2, 'pass', ev1) === null, 'a turned-back visitor leaves; a decided visitor cannot be decided again');

  const Sf = fresh();
  Sf.day = 5; Sf.hour = 16;
  Gd.lootNote(Sf, 'sword', 1);
  Sf.player.bag.push({ id: 'sword', n: 1 });
  Gd.state(Sf).trophies = { day: 5, rule: 'hand', taken: Sf.guard.loot, handed: false };
  ok(Gd.handIn(Sf, Sf.player) === 1 && !Sf.player.bag.some(s => s.id === 'sword') && Sf.standing.service === 1 && Gd.handIn(Sf, Sf.player) === null, '«Трофеи сдать»: taken things go to the armory by the list, service +1');
  const Se = fresh();
  Se.day = 5; Se.hour = 21;
  Gd.state(Se).trophies = { day: 5, rule: 'hand', taken: [['sword', 1]], handed: false };
  const ee = Gd.run(Se, 1, W, () => 0.1);
  ok(Se.standing.service === -2 && !Se.guard.trophies && ee.some(e => e.kind === 'penalty') && Se.guard.duty, 'trophies kept back are found out: service −2 and stable duty for tomorrow');
  const Sj = fresh();
  Sj.day = 6; Sj.hour = 12;
  Gd.note(Sj, -2, 'проба');
  Gd.note(Sj, -1, 'проба');
  Sj.hour = 21;
  const ej = Gd.run(Sj, 1, W, rnd);
  Sj.hour = 22.5;
  const ej2 = Gd.run(Sj, 1, W, rnd), cell = town.beds.find(b => b.id === 'cell');
  ok(ej.some(e => e.kind === 'jail') && ej2.some(e => e.kind === 'cell') && Math.hypot(Sj.player.mv.pos[0] - cell.at[0], Sj.player.mv.pos[2] - cell.at[1]) < 1, '−3 in a day: the night in the guardhouse cell');
  Sj.day = 7; Sj.hour = 6.2;
  ok(Gd.run(Sj, 1, W, rnd).some(e => e.kind === 'released') && !Sj.guard.jail, 'released from the cell in the morning');
  const Sg = fresh();
  Sg.day = 9; Sg.hour = 21;
  Sg.standing.service = 6;
  const eg = Gd.run(Sg, 1, W, rnd);
  ok(eg.some(e => e.kind === 'gramota') && Sg.player.bag.some(s => s.id === 'gramota') && E.sideOffer(Sg, Sg.player, 'hingeArm').price === 200, 'service 6: Савва gives the treasury charter, half a hinge arm at Шарнир\'s');
  const Pe = Sv.start(W, { side: 'elf', intro: false }).player;
  ok(E.doctor(Sg, Sg.player, 'savva').every(o => o.price === 0) && E.doctor(Sg, Pe, 'savva').every(o => !o.can), 'Савва treats the guard free and turns other sides away');

  const Sa = fresh();
  Sa.day = 12;
  Wo.state(Sa);
  const PA = Sa.player;
  ok(!Gd.useAdit(Sa, W, PA), 'the old adit is unknown at first');
  const con = K.Body.member(Sa.nextId++, 'villain', 1180, 600, 0, W);
  con.captor = 'player';
  const ea = [{ kind: 'jailed', who: con }];
  Gd.react(Sa, ea);
  PA.mv = K.Move.body(W, PP.adit.mouth[0], PP.adit.mouth[1], 0);
  ok(Sa.campaign.adit && ea.some(e => e.kind === 'say' && /штрек/.test(e.text)) && Gd.useAdit(Sa, W, PA) === 'fort' && Math.hypot(PA.mv.pos[0] - PP.adit.exit[0], PA.mv.pos[2] - PP.adit.exit[1]) < 1 && Gd.useAdit(Sa, W, PA) === 'mine', 'a convict jailed after day 10 tells of the adit from the mine into the fort cellar; it works both ways');

  const Sz = fresh();
  Sz.day = 20; Sz.hour = 12;
  const Ez = Wo.state(Sz);
  Object.assign(Ez.sides.villain, { ladders: 3, ram: 1, intel: 2 });
  Ez.assault = { day: 20, n: 8 };
  const ga = Wo.launch(Sz, 'villain', 'assault', Wo.POSTS.fort.at, Wo.POSTS.palace.gate, 8, { target: 'palace' });
  ga.live = true;
  ga.at = [PP.gate[0] - 20, 0, PP.gate[1]];
  const crew = [];
  for (let i = 0; i < 8; i++) { const q = K.Body.member(Sz.nextId++, 'villain', PP.gate[0] - 8 - (i % 3), PP.gate[1] - 2 + i * 0.6, 0, W); q.fight = K.Combat.fighter({ weapon: 'axe' }); q.march = { id: ga.id }; Sz.people.push(q); crew.push(q); }
  const ez = Gd.run(Sz, 1 / 60, W, rnd), Z = Sz.guard;
  ok(ez.some(e => e.kind === 'siege' && e.ladders === 3 && e.ram && e.lurkers === 2) && Z.ladders.length === 3 && W.dyn.some(b => b.id === 'palace-gate-door'), 'the assault at the walls: three ladders, a ram at the gate, two lurkers at the postern and the sluice; the gate is shut');
  for (let i = 0; i < 5 * 60; i++) Gd.run(Sz, 1 / 60, W, rnd);
  const hp = Z.gate.hp;
  ok(hp < 100 && Gd.brace(Sz) && Z.gate.hp === Math.min(100, hp + 10), `the ram beats the gate to ${hp.toFixed(0)}; bracing at the lever gives back 10`);
  const L0 = Z.ladders[0];
  for (const q of crew) q.mv = K.Move.body(W, L0.at[0], L0.at[1], 0);
  PA.mv = K.Move.body(W, L0.top[0], L0.top[1], 0);
  const life = crew[0].fight.life;
  ok(Gd.pushLadder(Sz, PA, []) === L0 && !L0.up && crew[0].fight.life === life - 30, 'a ladder pushed off the wall falls with the men climbing it');
  for (const q of Sz.people) if (q.team === 'villain') q.fight.down = true;
  const er = Gd.run(Sz, 1 / 60, W, rnd);
  ok(er.some(e => e.kind === 'assault' && e.result === 'repelled') && Ez.assault.result === 'repelled' && ga.state === 'done', 'when the attackers are down to a third the assault is beaten back');
  Gd.run(Sz, 1 / 60, W, rnd);
  ok(!Z.siege && !W.dyn.some(b => b.id === 'palace-gate-door'), 'after the siege the gate opens again');
  Sz.day = 21;
  Gd.daily(Sz, rnd);
  ok(Sz.campaign.ending && Sz.campaign.ending.id === 'stood' && Sz.campaign.ending.names.length === 9 && /по именам/.test(Sz.campaign.ending.text), 'the walls held: «Дворец устоял», the last roll call names the ten');
  const Sy = fresh();
  Sy.day = 30;
  const Ey = Wo.state(Sy);
  Ey.assault = { day: 29, n: 60, result: 'taken', ended: 30 };
  Gd.state(Sy).people.find(r => r.name === 'Фома').alive = false;
  Gd.daily(Sy, rnd);
  ok(Sy.campaign.ending.id === 'fell' && Sy.campaign.ending.fallen.includes('Фома') && Sy.campaign.ending.names.length === 8, 'the palace taken: «Дворец пал», the fallen are named');
  const Sq = fresh();
  Sq.day = 27;
  const Eq = Wo.state(Sq);
  Sq.campaign.adit = true;
  Eq.sides.villain.readiness = 30;
  Eq.sides.guard.men = 60;
  Gd.plan(Sq, rnd);
  const gf = Eq.groups.find(g => g.final === 'fort');
  ok(gf && gf.adit && gf.target === 'fort' && Sq.campaign.finales.fort && Sq.campaign.part === 3, 'with the adit known and the villain unready Строгов leads a raid into the fort: finale «Форт»');

  const Sn = Sv.start(W, { side: 'guard' }), Pn = Sn.player, rn = K.rng(6), en = [];
  const tick = sec => { const out = []; for (let i = 0; i < sec * 10; i++) { const e = Gd.run(Sn, 0.1, W, rn); Gd.post(Sn, e, W, rn); out.push(...e); Sn.time += 0.1; } return out; };
  tick(1);
  Pn.mv = K.Move.body(W, PP.line[PP.hero][0], PP.line[PP.hero][1], Math.PI);
  en.push(...tick(1));
  ok(Gd.introStep(Sn) === 'gate' && en.some(e => e.kind === 'muster' && /Строй выносит своих/.test(e.speech)), 'first muster: Строгов says the line about carrying your own; then the gate post');
  Pn.mv = K.Move.body(W, PP.gate[0] + 1, PP.gate[1], 0);
  en.push(...tick(8));
  const qs = Sn.guard.visitors;
  ok(en.some(e => e.kind === 'say' && e.who === 'Митрофан') && qs.list.length === 3 && qs.list.filter(v => v.spy).length === 1, 'Митрофан tells of the charter; three visitors, one of them a spy');
  for (let k = 0; k < 3; k++) { const q = Sn.people.find(x => x.visitor && x.visitor.state === 'queue'); if (q) { const e = []; Gd.decide(Sn, q, q.visitor.spy ? 'hold' : 'pass', e); Gd.post(Sn, e, W, rn); } tick(7); }
  ok(Gd.introStep(Sn) === 'drill' && Sn.people.some(q => q.drillStraw) && Sn.standing.service >= 4, 'the gate done with the spy caught: on to the drill with a straw dummy');
  const ui = read(`${DIR}/ki-ui.js`), scr = read(`${DIR}/ki-screens.js`);
  ok(['pass(ui', 'book(ui', 'guardTalk(ui', 'armory(ui', 'serviceEnd(ui'].every(f => scr.includes('    ' + f)) && /K\.Screens\.pass\(this, q\)/.test(ui) && /K\.Screens\.book\(this\)/.test(ui) && /K\.Screens\.doctor\(this, q, 'savva'\)/.test(ui) && /K\.Guard\.lootNote/.test(ui), 'the pass check, the order book, guard talk, the armory and the service chronicle are screens of their own; J opens the book');

  const Sb = Sv.start(W, { side: 'guard' });
  Sb.day = 3;
  Gd.run(Sb, 0.1, W, rnd);
  Gd.note(Sb, 2, 'проба');
  const s12 = JSON.stringify(Sv.pack(Sb, W)), b12 = Sv.unpack(JSON.parse(s12), W);
  ok(JSON.stringify(Sv.pack(b12, W)) === s12 && JSON.parse(s12).v === Sv.VERSION && b12.guard.book.length === 1 && b12.people.filter(q => q.guardman !== undefined).length === 29 && b12.campaign.intro.step === 'muster', 'save format 12: the palace roster, the order book and the intro come back');
  ok(Sv.size(JSON.parse(s12)) <= 120 * 1024, `with the palace awake the save weighs ${(Sv.size(JSON.parse(s12)) / 1024).toFixed(1)} KB`);
  const v11 = JSON.parse(s12);
  v11.v = 11;
  delete v11.guard;
  delete v11.army;
  const m11 = Sv.unpack(v11, W);
  ok(!m11.guard || !m11.guard.book.length, 'a save of format 11 loads; the palace service is made anew');
}

{
  const Sv = K.Save, Wo = K.World, Vi = K.Villain, FP = P.FORT_PTS, Nv = K.Nav, town = P.town(T), rnd = K.rng(11);
  const fort = P.BUILDINGS.filter(b => b.fort);
  ok(fort.length === 5 && ['fort-hall', 'forge', 'fort-barracks', 'surgeon', 'fort-store'].every(id => fort.some(b => b.id === id)) && P.BUILDINGS.some(b => b.id === 'mine-hut') && P.BUILDINGS.some(b => b.id === 'pass-hut'), 'the fort has its hall, Молот\'s forge, barracks, Фрол\'s room and the store; huts at the mines and on the pass');
  ok(town.chests.some(c => c.id === 'villain-treasury') && town.beds.some(b => b.id === 'villain-hero') && town.keepers['fort-hall'] && town.keepers.forge && town.keepers.surgeon, 'the hall keeps the treasury chest and the master\'s bed; Гусь, Молот and Фрол have their places');
  const NF = Nv.of(W), into = ['fort-hall', 'forge', 'fort-barracks', 'surgeon'].filter(id => { const r = Nv.find(NF, FP.yard, town.doors[id].inside); return r && r.ok; });
  ok(into.length === 4, 'a path leads from the fort yard into every fort building: ' + into.length + ' of 4');
  ok(W.boxes.some(b => b.dressed === 'basalt' && b.wall === 'fort') && W.boxes.some(b => b.dressed === 'keep') && W.boxes.some(b => b.dressed === 'mine') && W.boxes.some(b => b.dressed === 'cairn'), 'the fort walls, the keep, the mine mouth and the cairn on the pass are dressed, not grey boxes');
  ok(Wo.goatWay().length > 1200 && Math.hypot(Wo.goatWay().pts[0][0] - 921, Wo.goatWay().pts[0][1] - 105) < 1, `the goat path from the fort gate to the palace runs ${Math.round(Wo.goatWay().length)} m`);

  const r0 = Vi.roster(), army = r0.filter(r => r.army);
  ok(r0.length === 40 && army.length === 34 && ['scribe', 'scout', 'chief', 'spymaster', 'smith', 'surgeon'].every(k => r0.some(r => r.role === k)) && army[0].name === 'Хвощ' && army[0].look.cut.rFore, 'the fort: Гусь, Кривой, Пень, Сыч, Молот, Фрол and 34 men by name; Хвощ has a fresh stump');
  ok(r0.find(r => r.role === 'scout').look.eyes.l === 'ruby' && r0.find(r => r.role === 'chief').look.pros.lShin === 'iron' && r0.find(r => r.role === 'chief').look.pros.rShin === 'iron', 'Кривой has a ruby eye, Пень two iron legs');
  ok(['krivoy', 'pen', 'sych', 'garrison'].map(id => army.filter(r => r.squad === id).length).join() === '6,12,3,13', 'four squads: Кривой 6, Пень 12, Сыч 3, the garrison 13');

  const fresh = () => { const S = Sv.start(W, { side: 'villain', name: 'Проба', intro: false }); S.campaign = { side: 'villain' }; Vi.state(S); return S; };
  const Si = Sv.start(W, { side: 'villain', name: 'Проба' });
  ok(Si.hour === 22 && Si.player.name === 'Проба' && Vi.introStep(Si) === 'hall' && Math.hypot(Si.player.mv.pos[0] - town.doors['fort-hall'].inside[0], Si.player.mv.pos[2] - town.doors['fort-hall'].inside[1]) < 1 && /Гусь/.test(Vi.introGoal(Si)), 'the villain starts at night in the fort hall; Гусь waits to write the name');

  const Sl = fresh(), V = Wo.state(Sl).sides.villain, st0 = Vi.stats(Sl);
  ok(st0.men === 34 && st0.loyalty > 40 && st0.fear > 20 && Sl.standing.loyalty === st0.loyalty && V.morale === Math.round(Math.min(100, st0.loyalty + st0.fear * 0.5)), `the army: loyalty ${st0.loyalty} %, fear ${st0.fear} %; loyalty is the side standing and with fear it makes the spirit of the army`);
  const hv = Sl.army.people[Vi.KEY.length];
  Vi.note(Sl, hv, 10, -5, 'проба');
  ok(Sl.army.book.length === 1 && hv.loyalty === Math.min(100, 42 + 10), 'loyalty and fear change per man and are written in the chronicle');

  const Sp = fresh(), Vp = Wo.state(Sp).sides.villain, ev = [];
  Sp.day = 7;
  const s0 = Vp.stock.silver, l0 = Vi.loyalty(Sp);
  Vi.payday(Sp, ev);
  ok(Vp.stock.silver === s0 - 34 * Vi.PAY && Vi.loyalty(Sp) > l0 && ev.some(e => e.kind === 'pay' && e.paid === 34), 'every seventh day the pay comes from the treasury: loyalty grows');
  Sp.day = 14;
  Vi.holdPay(Sp);
  const l1 = Vi.loyalty(Sp), f1 = Vi.fear(Sp), s1 = Vp.stock.silver;
  Vi.payday(Sp, ev);
  ok(Vp.stock.silver === s1 && Vi.loyalty(Sp) < l1 && Vi.fear(Sp) > f1 && !Sp.army.pay.held, 'pay held back: silver kept, loyalty falls, fear grows');
  Sp.day = 21;
  Vp.stock.silver = 50;
  Vi.payday(Sp, ev);
  ok(Vp.stock.silver === 0 && ev.filter(e => e.kind === 'pay').pop().paid === 10, 'not enough silver: ten are paid, the rest lose loyalty');

  const Sd = fresh();
  for (const r of Vi.soldiers(Sd)) r.loyalty = 20;
  Sd.day = 5; Sd.hour = 23.2;
  const ed = [];
  Vi.nightly(Sd, W, () => 0.99, ed);
  const gone = ed.find(e => e.kind === 'desert');
  ok(gone && gone.names.length === 3 && Vi.soldiers(Sd).length === 31 && Wo.state(Sd).sides.villain.men === 31, 'loyalty below 30 %: at night 1–3 men leave the fort');
  const Sa = fresh(), Va = Wo.state(Sa).sides.villain, ea = [];
  Va.intel = 2; Va.stock.logs = 40;
  for (const k of Vi.ATTACKS) Vi.attackFar(Sa, k, rnd, ea);
  ok(ea.length === 5 && Sa.army.forge.burnt === (Sa.day || 1) + 2 && Va.intel === 1 && Va.stock.logs === 30 && Vi.soldiers(Sa).length === 33, 'elf attacks on the fort: the forge burnt, plans stolen, a sentry killed, prisoners freed, log carts spoiled');
  const raids = [0, 0];
  for (let i = 0; i < 24; i++) for (const c of [0, 1]) { const Sx = fresh(); Sx.army.cut = c ? 300 : 0; Sx.day = 5; Sx.hour = 23.5; const e = []; Vi.nightly(Sx, W, K.rng(i + 1), e); if (e.some(x => x.kind === 'elfAttack' || x.kind === 'say')) raids[c]++; }
  ok(raids[1] > raids[0], `the more the fort cuts the forest, the more often the elves come at night: ${raids[0]} of 24 nights without logging, ${raids[1]} with 300 logs cut`);

  const Sf = fresh(), Vf = Wo.state(Sf).sides.villain, i0 = Vi.KEY.length, hvf = Sf.army.people[i0];
  const iron0 = Vf.stock.iron, l2 = hvf.loyalty, arm = Vi.forgeArm(Sf, i0, []);
  ok(arm.ok && Vf.stock.iron === iron0 - Vi.IRON_ARM && hvf.pros.rFore === 'iron' && hvf.loyalty === Math.min(100, l2 + 18 + 2) && !Vi.stump(hvf), 'Молот forges an iron arm from the fort\'s iron: the man is loyal');
  Sf.army.forge.burnt = (Sf.day || 1) + 2;
  const r2 = Sf.army.people.find(r => r.army && r.look && r.look.cut && r.look.cut.lFore && !(r.pros && r.pros.lFore));
  ok(!r2 || !Vi.forgeArm(Sf, r2.i, []).ok, 'a burnt forge makes no arms');
  const w = Sf.army.people[i0 + 3];
  w.wound = { life: 40 };
  const sil = Vf.stock.silver, healed = Vi.heal(Sf, w.i);
  ok(healed.ok && Vf.stock.silver === sil - Vi.HEAL && w.wound.life === 100, 'Фрол treats the wounded for silver from the treasury');
  const pf = Sf.army.people[i0 + 4], lf = pf.loyalty, ff = pf.fear;
  Vi.punish(Sf, pf.i, 'flog', []);
  const pp = Sf.army.people[i0 + 5];
  Vi.punish(Sf, pp.i, 'pit', []);
  ok(pf.loyalty < lf && pf.fear > ff && pp.pit === (Sf.day || 1) + 1 && Vi.spotFor(Sf, pp).at[1] === FP.pit[1], 'flogging and the pit: fear grows fast, loyalty falls; the punished man sits in the pit');
  Sf.army.share = { silver: 40, squad: 'pen', men: [i0 + 6, i0 + 7] };
  const sharer = Sf.army.people[i0 + 6], ls = sharer.loyalty;
  ok(Vi.share(Sf, true, []) === 40 && sharer.loyalty > ls && !Sf.army.share, 'a share of the loot for the men who went: loyalty');
  Sf.army.share = { silver: 30, squad: 'pen', men: [i0 + 6] };
  const purse0 = K.Econ.purse(Sf.player.bag), ls2 = sharer.loyalty;
  ok(Vi.share(Sf, 'self', []) === -30 && K.Econ.purse(Sf.player.bag) === purse0 + 30 && sharer.loyalty < ls2, 'the villain can keep a share for himself; the men who went grumble');
  const chest0 = Wo.state(Sf).sides.villain.stock.silver, loy0 = Vi.loyalty(Sf);
  ok(Vi.takeChest(Sf, []) === Vi.TAKE && Wo.state(Sf).sides.villain.stock.silver === chest0 - Vi.TAKE && K.Econ.purse(Sf.player.bag) === purse0 + 30 + Vi.TAKE && Vi.loyalty(Sf) < loy0, `the villain takes ${Vi.TAKE} silver from the chest for himself, and the whole army's loyalty drops`);

  const Sb = fresh(), Vb = Wo.state(Sb).sides.villain;
  Vb.stock.logs = 100; Vb.stock.iron = 40;
  const ready0 = Wo.readiness(Sb);
  ok(Vi.build(Sb, 'ladder').ok && Vi.build(Sb, 'ram').ok && !Vi.build(Sb, 'ram').ok && Vb.ladders === 1 && Vb.ram === 1 && Vb.stock.logs === 20 && Wo.readiness(Sb) > ready0, `ladders and the ram from logs: readiness ${ready0} → ${Wo.readiness(Sb)} %`);

  const So = fresh();
  Vi.run(So, 0.1, W, rnd);
  const or = Vi.order(So, 'pen', 'raid', 'tsarevo', { W });
  const sq = Vi.squadOf(So, 'pen'), g = Wo.state(So).groups.find(x => x.id === sq.group);
  ok(or.ok && g && g.crew.length === 12 && g.crew.every(q => q.soldier !== undefined && q.name) && Vi.members(So, sq).every(r => r.away === g.id), 'an order from the war table: Пень\'s twelve march on Царёво by name');
  ok(!Vi.order(So, 'pen', 'raid', 'korni', { W }).ok && !Vi.order(So, 'sych', 'raid', 'palace', { W }).ok, 'a squad on the march takes no new order; a target must suit the order');
  for (let h = 0; h < 30 && sq.group; h++) K.Econ.pass(So, 1, { W, rnd });
  const rep = So.army.reports.find(x => x.squad === 'pen');
  ok(!sq.group && rep && rep.order === 'raid' && rep.back + rep.lost.length === 12 && Vi.members(So, sq).every(r => !r.away), `the report comes to the table: back ${rep && rep.back}, lost ${rep && rep.lost.length}, loot ${rep && JSON.stringify(rep.loot)}`);
  const Sr = fresh(), Vr = Wo.state(Sr).sides.villain;
  Vi.run(Sr, 0.1, W, rnd);
  Vi.order(Sr, 'garrison', 'recruit', 'mines', { W });
  for (let h = 0; h < 30 && Vi.squadOf(Sr, 'garrison').group; h++) K.Econ.pass(Sr, 1, { W, rnd });
  const rec = Sr.army.reports.find(x => x.order === 'recruit');
  ok(rec && rec.recruits >= 2 && Vi.soldiers(Sr).length === 34 + rec.recruits - rec.lost.length && Sr.army.people.slice(-rec.recruits).every(r => r.recruit && r.squad === 'garrison'), `recruiting at the mines brings ${rec && rec.recruits} men by name into the garrison`);
  const Sg = fresh();
  Vi.order(Sg, 'garrison', 'guard', 'mines', { W });
  ok(Vi.members(Sg, Vi.squadOf(Sg, 'garrison')).every(r => r.post === 'mines') && Wo.state(Sg).posts.mines.men >= 6, 'the garrison can stand guard at the mines');

  const Sz = fresh(), Ez = Wo.state(Sz), Vz = Ez.sides.villain;
  Object.assign(Vz, { ladders: 4, ram: 1, intel: 2 });
  Vi.run(Sz, 0.1, W, rnd);
  const az = Vi.startAssault(Sz, W, 'goat', []);
  const gz = Ez.groups.find(x => x.id === az.group.id);
  ok(az.ok && gz.via === 'goat' && gz.light && Ez.assault && Ez.assault.route === 'goat' && gz.crew.length >= 30 && gz.crew.some(q => q.name === 'Пень'), `the assault: the master leads ${gz.crew.length} men light by the goat path, Пень and Кривой with them`);
  ok(!Vi.startAssault(Sz, W, 'forest', []).ok, 'only one assault at a time');
  gz.live = true;
  gz.at = [P.PALACE_PTS.gate[0] - 20, 0, P.PALACE_PTS.gate[1]];
  for (const q of gz.crew) { q.mv = K.Move.body(W, 1130, 700, 0); q.march = { id: gz.id }; Sz.people.push(q); }
  gz.crew = [];
  Sz.player.mv = K.Move.body(W, 1110, 700, 0);
  K.Guard.run(Sz, 1 / 60, W, rnd);
  ok(Sz.guard.siege && Sz.guard.ladders.length === 2 && !Sz.guard.siege.ram, 'light by the goat path: two ladders and no ram at the walls');
  Sz.player.mv = K.Move.body(W, Sz.guard.ladders[0].at[0], Sz.guard.ladders[0].at[1], 0);
  ok(Vi.climb(Sz, W, Sz.player) && Sz.player.mv.pos[1] > 34, 'the master climbs a ladder onto the palace wall');
  Sz.player.mv = K.Move.body(W, FP.banner[0], FP.banner[1] + 8, 0);
  const eb = [];
  ok(Vi.banner(Sz, Sz.player, eb) && Ez.assault.result === 'taken', 'the banner on the White tower takes the palace');
  for (const r of Vi.soldiers(Sz)) { r.loyalty = 80; r.fear = 20; }
  Vi.run(Sz, 1 / 60, W, rnd);
  ok(Sz.campaign.ending && Sz.campaign.ending.id === 'loyal' && Sz.campaign.ending.names.length >= 30 && /Гусь вписывает/.test(Sz.campaign.ending.text), 'victory by loyalty: Гусь writes the names of those who went alongside');
  const Sy = fresh(), Ey = Wo.state(Sy);
  Object.assign(Ey.sides.villain, { ladders: 2, ram: 0, intel: 0 });
  Vi.run(Sy, 0.1, W, rnd);
  Vi.startAssault(Sy, W, 'forest', []);
  for (const r of Vi.soldiers(Sy)) { r.loyalty = 20; r.fear = 70; }
  Ey.assault.result = 'taken';
  Vi.run(Sy, 1 / 60, W, rnd);
  ok(Sy.campaign.ending.id === 'fear' && !Sy.campaign.ending.names.length && /Проба/.test(Sy.campaign.ending.text), 'victory by fear: the name stands alone in the chronicle');
  const Sx = fresh(), Ex = Wo.state(Sx);
  Vi.run(Sx, 0.1, W, rnd);
  Vi.startAssault(Sx, W, 'forest', []);
  for (const r of Vi.soldiers(Sx)) { r.loyalty = 30; r.fear = 60; }
  Sx.player.bag = [{ id: 'silver', n: 40 }];
  const near = K.Body.member(Sx.nextId++, 'villain', Sx.player.mv.pos[0] + 2, Sx.player.mv.pos[2], 0, W);
  near.soldier = Vi.KEY.length + 2;
  Sx.people.push(near);
  const ex = [{ kind: 'down', who: Sx.player }];
  Vi.react(Sx, ex);
  ok(Sx.campaign.ending && Sx.campaign.ending.id === 'abandoned' && Sx.player.bag[0].n === 20 && ex.some(e => e.kind === 'say'), 'the master falls in the assault with loyalty below 60 %: the fearful run, one robs him, the chronicle ends «Брошен у стен»');

  const Sn = Sv.start(W, { side: 'villain', name: 'Проба' }), en = [];
  ok(/Проба/.test(Vi.talked(Sn, 'scribe', en)) && Vi.introStep(Sn) === 'yard' && en.some(e => e.kind === 'skip' && e.to > 6), 'Гусь writes the name; the morning comes');
  ok(Vi.talked(Sn, 'soldier', [], { soldier: Vi.KEY.length }) === 'hvosh' && Vi.talked(Sn, 'soldier', [], { soldier: Vi.KEY.length + 1 }) === null, 'in the yard Хвощ, and only he, asks the master for an iron arm');
  ok(Vi.hvosh(Sn, false, []) && Sn.campaign.hvosh === 'refused' && Sn.army.people[Vi.KEY.length].fear > 40 && Vi.introStep(Sn) === 'drill', 'Хвощ refused the arm: fear grows, on to the drill');
  Vi.run(Sn, 0.1, W, rnd);
  Vi.post(Sn, [], W, rnd);
  ok(Sn.people.filter(q => q.drillStraw).length === 3 && Sn.people.filter(q => q.squad === 'player').length === 4, 'the drill: three straw dummies and four of Пень\'s men under the master\'s command');

  const Sh = Sv.start(W, { side: 'guard', villainName: 'Проба' });
  ok(Sh.villainName === 'Проба' && Wo.evil(Sh) === 'Злой по прозвищу Проба' && !Sh.player.name, 'the name chosen in the villain campaign shows in the others');

  const So2 = fresh();
  Vi.run(So2, 0.1, W, rnd);
  Vi.order(So2, 'krivoy', 'logging', 'cutters', { W });
  Vi.note(So2, 'all', 2, 1, 'проба');
  const s13 = JSON.stringify(Sv.pack(So2, W)), b13 = Sv.unpack(JSON.parse(s13), W);
  ok(JSON.stringify(Sv.pack(b13, W)) === s13 && JSON.parse(s13).v === 13 && b13.army.people.length === 40 && b13.army.squads.find(s => s.id === 'krivoy').group && b13.army.book.length === 1, 'save format 13: the army by name, squads on the march and the chronicle come back');
  ok(Sv.size(JSON.parse(s13)) <= 120 * 1024, `with the fort awake the save weighs ${(Sv.size(JSON.parse(s13)) / 1024).toFixed(1)} KB`);
  const v12 = JSON.parse(s13);
  v12.v = 12;
  delete v12.army;
  ok(!Sv.unpack(v12, W).army, 'a save of format 12 loads; the army is gathered anew');
  const ui = read(`${DIR}/ki-ui.js`), scr = read(`${DIR}/ki-screens.js`);
  ok(['warTable(ui', 'villainTalk(ui', 'villainEnd(ui'].every(f => scr.includes('    ' + f)) && /K\.Screens\.warTable\(this\)/.test(ui) && /K\.Screens\.doctor\(this, q, 'frol'\)/.test(ui) && /K\.Villain\.flames/.test(ui), 'the war table, fort talk and the chronicle of Гусь are screens of their own; J opens the table');
}

{
  const G = T.ground(), N = T.N, rnd = K.rng(77), gw = (x, z) => T.groundAt(x, z), top = (x, z) => Object.entries(gw(x, z)).sort((a, b) => b[1] - a[1])[0][0];
  ok(T.GROUND.length === 12 && G.M === 12 && K.Tex.GTILE.length === 12 && K.Tex.GBASE.length === 12, 'twelve ground materials: meadow, field, forest floor, dirt, gravel, cobble, rock, scree, snow, mud, sand, ploughland');
  let bad = 0;
  for (let n = 0; n < 4000; n++) { const k = Math.floor(rnd() * N * N); let s = 0; for (let q = 0; q < 12; q++) s += G.weights[k * 12 + q]; if (s !== 255) bad++; }
  ok(!bad, 'the material weights add up to one everywhere');
  const road = id => { const r = P.ROADS.find(x => x.id === id), a = r.pts[1], b = r.pts[2]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
  ok(top(480, 640) === 'forest' && top(170, 1060) === 'mud' && top(757, 880) === 'sand' && top(...road('tract')) === 'gravel' && top(...road('yard')) === 'cobble' && top(...road('forest')) === 'dirt' && top(...road('goat')) === 'scree', 'forest floor in the thicket, mud in the swamp, sand in the river, gravel on the tract, cobbles on the street, dirt on the forest road, stones on the goat path');
  let snow = null, rock = null;
  for (let k = 0; k < N * N && (!snow || !rock); k += 7) { const x = (k % N) * T.STEP, z = Math.floor(k / N) * T.STEP, ny = T.normalAt(x, z)[1]; if (!snow && T.H[k] > 230 && ny > 0.85) snow = [x, z]; if (!rock && ny < 0.6 && x > 50 && z > 50) rock = [x, z]; }
  ok(snow && gw(...snow).snow > 0.6 && rock && gw(...rock).rock > 0.6, 'snow on the high mountains, bare rock on steep slopes');
  const inn = P.BUILDINGS.find(b => b.id === 'izba-0') || P.BUILDINGS.find(b => b.id === 'tsarevo-0');
  ok(gw(inn.x + inn.w / 2 + 1.5, inn.z).dirt > 0.4, 'the ground around a house is trodden bare');
  let fieldHit = 0;
  for (let i = 0; i < 40; i++) { const x = 300 + i * 25, z = 1400; const w = gw(x, z); if (w.field + w.plough > 0.5 || w.dirt > 0.5 || w.gravel > 0.5 || w.cobble > 0.5 || w.sand > 0.5) fieldHit++; }
  ok(fieldHit >= 36, `the land of people in the south is fields and ploughland: ${fieldHit} of 40 points`);
  const rn = read(`${DIR}/ki-render.js`);
  ok(!/uGrid/.test(rn) && !/grain = hash\(floor\(vWorld/.test(rn) && /sampler2DArray uLayers/.test(rn) && /TEXTURE_MAX_ANISOTROPY_EXT/.test(rn) && /generateMipmap\(gl\.TEXTURE_2D_ARRAY\)/.test(rn), 'no grid lines and no square grain on the ground: textured materials with mip levels and anisotropic filtering');
  ok(/lines: 600,/.test(read(`${DIR}/ki-ui.js`)), 'the frame is 800×600 by default');
}

{
  const geo = T.roadGeometry(), cells = new Set(), STY = K.Terrain.ROAD_STYLE;
  let off = 0;
  for (let q = 0; q < geo.length; q += 9) { cells.add(Math.round(geo[q] / 2) + ':' + Math.round(geo[q + 2] / 2)); off = Math.max(off, Math.abs(geo[q + 1] - T.meshHeightAt(geo[q], geo[q + 2]) - 0.03)); }
  ok(off < 0.02, `the road ribbons lie on the ground mesh: the largest gap is ${(off * 100).toFixed(1)} cm`);
  let miss = 0, all = 0;
  for (const r of P.ROADS) {
    if (!STY[r.kind]) continue;
    const line = K.Terrain.polyline(r.pts);
    for (let s = 0; s <= line.length; s += 3) { const p = K.Terrain.pointAt(line, s), cx = Math.round(p.x / 2), cz = Math.round(p.z / 2); all++; let hit = false; for (let a = -1; a <= 1 && !hit; a++) for (let b = -1; b <= 1 && !hit; b++) hit = cells.has((cx + a) + ':' + (cz + b)); if (!hit) miss++; }
  }
  ok(!miss && all > 2000, `every point of every road is covered by its ribbon: ${all} points checked`);
  const tl = K.Terrain.polyline(P.ROADS.find(r => r.id === 'tract').pts), hf = P.KINDS.tract.width / 2;
  let dip = 0;
  for (let s = 60; s < tl.length - 60; s += 30) { const p = K.Terrain.pointAt(tl, s), e = hf + 0.7 + (T.DITCH.to - T.DITCH.from) / 2; dip += T.heightAt(p.x, p.z) - (T.heightAt(p.x - p.tz * e, p.z + p.tx * e) + T.heightAt(p.x + p.tz * e, p.z - p.tx * e)) / 2; }
  ok(dip > 0, 'the tract runs between two ditches');
  const S = P.signs(), roadD = (x, z) => Math.min(...P.ROADS.map(r => { const l = K.Terrain.polyline(r.pts); return K.Terrain.nearest(l, x, z).d - P.KINDS[r.kind].width / 2; }));
  ok(S.length >= 12 && S.every(s => s.arms.length >= 2 && s.arms.every(a => a.to && Math.abs(Math.hypot(a.dir[0], a.dir[1]) - 1) < 1e-6)), `${S.length} signposts at the forks, each names where its roads lead`);
  ok(S.every(s => roadD(s.post[0], s.post[1]) > 0.8) && P.milestones().every(m => roadD(m.at[0], m.at[1]) > 0.8) && P.milestones().length >= 4, 'signposts and verst posts stand beside the roads, not on them');
  ok(S.some(s => s.arms.some(a => a.to === 'Мостовица')) && S.some(s => s.arms.some(a => a.to === 'Ворота дворца')) && S.some(s => s.arms.some(a => a.to === 'Старый форт')), 'the signs point to Мостовица, the palace gate and the Old fort');
  const ui = read(`${DIR}/ki-ui.js`);
  ok(/kind: 'sign', sign: sg/.test(ui) && /signText\(sg\)/.test(ui) && /'↑', '↗', '→'/.test(ui), 'E at a signpost reads the directions with arrows as seen from where the hero looks');
}

{
  const D = K.Detail, at = D.sampler(T), ids = D.ID, cells = (x0, z0, n) => { const out = []; for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) out.push(...D.cell(T, Math.floor(x0 / D.CELL) + a, Math.floor(z0 / D.CELL) + b, at)); return out; };
  const meadow = cells(1180, 1040, 4), field = cells(400, 1420, 6), forest = cells(470, 630, 4), swamp = cells(150, 1040, 6), town = cells(800, 1300, 8), tract = [];
  ok(meadow.length > 600 && meadow.some(g => g.kind === ids.chamomile) && meadow.some(g => g.kind === ids.clover), `a meadow cell of 32×32 m holds ${meadow.length} tufts with clover and chamomile`);
  ok(field.some(g => g.kind === ids.rye) && field.some(g => g.kind === ids.poppy || g.kind === ids.cornflower), 'the southern fields have rye with poppies and cornflowers');
  ok(forest.some(g => g.kind === ids.blueberry) && forest.filter(g => g.kind === ids.grass).length < forest.length * 0.6, 'the forest floor has blueberry and little grass');
  ok(swamp.some(g => g.kind === ids.reed) && swamp.some(g => g.kind === ids.sedge), 'reeds and sedge grow in the swamp');
  const bad = town.concat(cells(1040, 940, 6)).filter(g => { const w = at(g.x, g.z).w; return w[3] + w[4] + w[5] + w[6] + w[8] > 0.3; });
  ok(!bad.length, 'no tufts on roads, streets, yards, rock or snow');
  const inHouse = town.filter(g => P.BUILDINGS.some(B => { const r = (B.rot || 0) * Math.PI / 180, dx = g.x - B.x, dz = g.z - B.z, u = dx * Math.cos(r) + dz * Math.sin(r), v = -dx * Math.sin(r) + dz * Math.cos(r); return Math.abs(u) < B.w / 2 && Math.abs(v) < B.d / 2; }));
  ok(!inHouse.length, 'no grass grows inside houses');
  const wet = cells(740, 860, 6).filter(g => T.waterAt(g.x, g.z) > g.y + 0.05);
  ok(wet.every(g => g.kind === ids.reed || g.kind === ids.sedge), 'only reeds and sedge stand in water');
  const eye = [735, 0, 735], many = D.ring(T, eye, 2, at), few = D.ring(T, eye, 1, at);
  ok(!D.ring(T, eye, 0, at).length && few.length < many.length * 0.6 && many.every(g => Math.hypot(g.x - eye[0], g.z - eye[2]) < D.LEVELS[2].radius + D.CELL * 2), `the grass setting: none, few (${few.length}) or many (${many.length}) tufts around the camera`);
  const scr = read(`${DIR}/ki-screens.js`), rn = read(`${DIR}/ki-render.js`);
  ok(/Трава и цветы/.test(scr) && /drawArraysInstanced\(gl\.TRIANGLES, 0, 12, G\.n\)/.test(rn) && /uWind\.xy \* uWind\.z \* gust/.test(rn), 'tufts are drawn by instances and sway in the wind; the settings screen has «Трава и цветы»');
}

{
  const D = K.Detail, L = D.props(T, F), count = k => L.filter(p => p.kind === k).length;
  ok(count('boulder') > 250 && count('stump') > 100 && count('log') > 30 && count('hay') > 40 && count('woodpile') > 10, `props of the valley: ${['boulder', 'stump', 'log', 'hay', 'woodpile'].map(k => k + ' ' + count(k)).join(', ')}`);
  const roadD = (x, z) => Math.min(...P.ROADS.map(r => K.Terrain.nearest(K.Terrain.polyline(r.pts), x, z).d - P.KINDS[r.kind].width / 2));
  ok(L.filter(p => p.kind !== 'woodpile').every(p => roadD(p.x, p.z) > p.size + 1.5), 'no boulder, stump, log or haystack lies on a road or a path');
  ok(L.every(p => T.waterAt(p.x, p.z) < T.heightAt(p.x, p.z) - 0.3) && L.every(p => p.kind === 'woodpile' || !P.WALLS.some(w => p.x > w.rect[0] - 2 && p.x < w.rect[2] + 2 && p.z > w.rect[1] - 2 && p.z < w.rect[3] + 2)), 'none stands in water; only the outpost woodpile stands inside a wall');
  const inside = L.filter(p => P.BUILDINGS.some(B => { const r = (B.rot || 0) * Math.PI / 180, dx = p.x - B.x, dz = p.z - B.z, u = dx * Math.cos(r) + dz * Math.sin(r), v = -dx * Math.sin(r) + dz * Math.cos(r); return Math.abs(u) < B.w / 2 && Math.abs(v) < B.d / 2; }));
  ok(!inside.length, 'none stands inside a house');
  const boxes = W.boxes.filter(b => b.id && b.id.startsWith('prop-'));
  ok(boxes.length === L.length && boxes.filter(b => b.id === 'prop-boulder').every(b => b.y1 - b.y0 > 0.5), 'every prop has a body: boulders are cover a man can stand behind');
  const big = L.filter(p => p.kind === 'boulder' && p.size > 1.4)[0], hero = K.Move.body(W, big.x - big.size * 2.2, big.z, 0);
  for (let i = 0; i < 180; i++) K.Move.step(hero.mv || hero, { fwd: 1, side: 0, yaw: Math.PI / 2, sprint: false }, 1 / 60, W);
  ok(Math.hypot((hero.mv || hero).pos[0] - big.x, (hero.mv || hero).pos[2] - big.z) > big.size * 0.5, 'a big boulder stops a man walking into it');
  const at = D.sampler(T), sm = (x0, z0, n) => { const out = []; for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) out.push(...D.small(T, Math.floor(x0 / D.CELL) + a, Math.floor(z0 / D.CELL) + b, at)); return out; };
  const forest = sm(470, 630, 5), scree = sm(600, 150, 5), road = sm(1040, 940, 4).filter(g => { const w = at(g.x, g.z).w; return w[3] + w[4] + w[5] > 0.35; });
  ok(forest.some(g => g.kind === D.SID.mushroom) && forest.some(g => g.kind === D.SID.branch) && scree.filter(g => g.kind === D.SID.stone || g.kind === D.SID.pebble).length > 40 && !road.length, 'mushrooms and branches in the forest, stones on the scree, nothing on the roads');
}

{
  const full = K.daylight(0, 1), fresh = K.daylight(0, 15), half = K.daylight(0, 8);
  ok(K.MOON === 28 && Math.abs(full.moonLit - 1) < 1e-9 && fresh.moonLit < 1e-9 && Math.abs(half.moonLit - 0.5) < 1e-9 && Math.abs(K.daylight(0, 29).moonLit - 1) < 1e-9, 'the moon turns full, half and new every 28 days of the campaign');
  ok(full.light[2] > fresh.light[2] * 2, 'moonlight at full moon is brighter than at new moon');
  const noon = K.daylight(12.5), dusk = K.daylight(20.4), night = K.daylight(1);
  ok(dusk.sunFog[0] > noon.sunFog[0] * 2 && night.sunFog[0] === 0 && dusk.sunFog[0] > dusk.sunFog[2], 'the haze towards the sun glows warm at dusk and is gone at night');
  ok(K.daylight(12, 3, 0.9).light[0] < K.daylight(12, 3, 0.1).light[0], 'a cloudy sky dims the sunlight');
  const rn = read(`${DIR}/ki-render.js`), tr = read(`${DIR}/ki-trees.js`);
  ok(/uniform float uCloud;/.test(rn) && /float hi = fbm/.test(rn) && /uniform float uMoon;/.test(rn) && /float star = step/.test(rn) && /vec3 mwN/.test(rn), 'the sky draws two cloud layers, the moon with its phase, twinkling stars and the Milky Way');
  ok((rn.match(/vec3 fogTint\(vec3 w\)/g) || []).length >= 8 && /fogTint/.test(tr) && /uFogSun, D\.sunFog/.test(rn), 'ground, roads, grass, props, houses, figures, trees and water fade into the sky colour on the side of the sun');
}

{
  const Wx = K.Weather, look = (d, h) => Wx.sample(7, d, h);
  ok(JSON.stringify(look(9, 14.5)) === JSON.stringify(look(9, 14.5)) && Wx.spell(7, 500) === Wx.spell(7, 500), 'the weather of a day and hour is the same every time');
  const count = {}, kinds = [];
  for (let n = 0; n < 8 * 400; n++) { const k = Wx.spell(7, n); kinds.push(k); count[k] = (count[k] || 0) + 1; }
  const share = k => (count[k] || 0) / kinds.length;
  ok(share(0) > 0.15 && share(4) > 0.02 && share(4) < 0.08 && share(3) + share(4) > 0.1 && share(3) + share(4) < 0.3, `weather over 400 days: clear ${(share(0) * 100).toFixed(0)} %, rain ${(share(3) * 100).toFixed(0)} %, storm ${(share(4) * 100).toFixed(0)} %`);
  ok(kinds.every((k, i) => !i || Math.abs(k - kinds[i - 1]) <= (kinds[i - 1] === 4 ? 2 : 1)), 'the weather changes one step at a time: clear, cloudy, overcast, rain, storm');
  ok(!kinds.some((k, i) => k === 4 && kinds.slice(Math.max(0, i - 3), i).includes(0)), 'a storm never comes within 9 hours of a clear sky');
  ok(kinds.slice(0, 8).every(k => k <= 1) && kinds.slice(8, 16).every(k => k <= 2) && [1, 2].every(d => [3, 6, 9, 12, 18, 23].every(h => look(d, h).rain === 0 && look(d, h).mist === 0)), 'the first two days of a campaign stay dry while the introductions run');
  let jump = 0, prev = look(2, 0);
  for (let m = 1; m < 24 * 60 * 20; m++) { const s = look(2 + Math.floor(m / 1440), (m % 1440) / 60); jump = Math.max(jump, Math.abs(s.cloud - prev.cloud), Math.abs(s.rain - prev.rain)); prev = s; }
  ok(jump < 0.05, `the weather changes smoothly: at most ${jump.toFixed(3)} per game minute`);
  const mists = [];
  for (let d = 3; d < 120; d++) if (look(d, 6).mist > 0.3) mists.push(d);
  ok(mists.length > 15 && mists.every(d => look(d, 12).mist === 0 && look(d, 1).mist === 0), `morning fog on ${mists.length} of 117 days, gone by noon`);
  const sv = Sv.start(W, { side: 'guard', intro: false });
  sv.day = 4;
  sv.hour = 17.3;
  const back = Sv.unpack(JSON.parse(JSON.stringify(Sv.pack(sv, W))), W);
  ok(JSON.stringify(Wx.at(back)) === JSON.stringify(Wx.at(sv)) && Wx.at(sv).name, 'weather comes back with the save: ' + Wx.at(sv).name);
  const force = k => Wx.sample(7, 3, 12, k), clear = force('clear'), rain = force('rain'), storm = force('storm'), fog = force('fog');
  const man = B.member(90001, 'guard', 735, 735, 0, W);
  man.fight = C.fighter({});
  const r0 = K.Senses.range(W, man, 12, clear), r1 = K.Senses.range(W, man, 12, rain), r2 = K.Senses.range(W, man, 12, storm);
  ok(r0 > r1 && r1 > r2 && r2 > r0 * 0.45, `sight in the open at noon: clear ${r0.toFixed(0)} m, rain ${r1.toFixed(0)} m, storm ${r2.toFixed(0)} m`);
  let lowest = { v: 1 }, highest = { v: 0 };
  for (let x = 40; x < T.SIZE; x += 64) for (let z = 40; z < T.SIZE; z += 64) { const v = Wx.lowAt(T, x, z); if (v < lowest.v) lowest = { v, x, z }; if (v > highest.v) highest = { v, x, z }; }
  const logSpot = K.Places.SPOTS.find(s => s.id === 'log');
  ok(Wx.lowAt(T, logSpot.at[0], logSpot.at[1]) === 1 && Wx.mistAt(T, fog, highest.x, highest.z) > Wx.mistAt(T, fog, lowest.x, lowest.z) * 2 && Wx.mistAt(T, clear, highest.x, highest.z) === 0, 'fog lies thicker by the water and in Сухой лог');
  const misty = man.mv.pos;
  man.mv.pos = [highest.x, T.heightAt(highest.x, highest.z), highest.z];
  ok(K.Senses.range(W, man, 12, fog) < r0 * 0.6, 'in thick fog by the river a man is seen at ' + K.Senses.range(W, man, 12, fog).toFixed(0) + ' m');
  man.mv.pos = misty;
  const ear = B.member(90002, 'elf', 748, 735, 0, W);
  man.mv.speed = 3;
  ok(K.Senses.hears(ear, man, clear) && !K.Senses.hears(ear, man, storm) && Wx.hearing(rain) < 1, 'rain and thunder drown out steps: a runner 13 m away is heard in clear weather, not in a storm');
  const inn = K.Places.BUILDINGS.find(b => b.id === 'inn');
  ok(Wx.douses(storm, [735, 0, 735]) && !Wx.douses(storm, [inn.x, 0, inn.z]) && !Wx.douses(rain, [735, 0, 735]) && !Wx.douses(clear, [735, 0, 735]), 'a downpour puts out a torch outdoors, not under a roof and not in light rain');
  const calm = Wx.arrow(clear), gale = Wx.arrow(storm);
  ok(calm.drop === 1 && gale.drop > 1.15 && Math.hypot(...gale.push) > Math.hypot(...calm.push) * 5, 'arrows fall lower and drift with a strong wind');
  const Sc = Sv.start(W, { side: 'guard', intro: false });
  Sc.hour = 12;
  Sc.caravans.list.push(K.Caravan.make(Sc, 'trade', Sc.day, 12, K.rng(2)));
  K.Caravan.run(Sc, 0.5, W, K.rng(4));
  const moving = Sc.caravans.list.filter(c => c.state === 'go').length;
  Sc.wxForce = 'storm';
  K.Caravan.run(Sc, 0.5, W, K.rng(4));
  ok(moving > 0 && Sc.caravans.list.every(c => c.state === 'camp' || c.done), 'caravans stop and camp in a thunderstorm');
  const D0 = K.daylight(12, 3, storm.cloud), Dn = Wx.apply(K.daylight(12, 3, clear.cloud), clear, 0, 0), Ds = Wx.apply(K.daylight(12, 3, storm.cloud), storm, 0, 0), Dm = Wx.apply(K.daylight(7, 3, fog.cloud), fog, 0.9, 0), Df = Wx.apply(K.daylight(12, 3, storm.cloud), storm, 0, 1);
  ok(Ds.fogFar < Dn.fogFar * 0.5 && Ds.light[0] < Dn.light[0] * 0.5 && Dm.fogFar < K.daylight(7).fogFar * 0.4 && Df.light[0] > Ds.light[0] + 0.3 && D0.fogFar > Ds.fogFar, 'storm and fog close the view and darken the light, lightning flashes it up');
  let bolts = 0, far = true;
  const seen = new Set();
  for (let s = 0; s < 600; s += 0.25) { const b = Wx.bolt(7, s, storm); if (b && !seen.has(b.id)) { seen.add(b.id); bolts++; far = far && b.dist >= 250 && b.dist <= 2450; } }
  ok(bolts > 40 && far && !Wx.bolt(7, 100, rain), `${bolts} lightning strikes in 10 minutes of storm, none in plain rain`);
  const rn = read(`${DIR}/ki-render.js`), ui = read(`${DIR}/ki-ui.js`), au = read(`${DIR}/ki-audio.js`), tr = read(`${DIR}/ki-trees.js`), scr = read(`${DIR}/ki-screens.js`), ms = read(`${DIR}/ki-missile.js`);
  ok(/const RAIN_VS/.test(rn) && /drawArraysInstanced\(gl\.TRIANGLES, 0, 6, R\.n\)/.test(rn) && /!WX\.sheltered/.test(rn) && /uSnow/.test(rn), 'rain streaks are drawn by instances around the camera, not under a roof, and turn into snow on the peaks');
  ok((rn.match(/vec3 wetten\(/g) || []).length === 3 && /c \+= uWetSky \* ripples/.test(rn) && /pool = smoothstep\(0\.3, 0\.85, uWet\)/.test(rn), 'wet ground and roads darken, puddles and water show rain rings');
  ok(/uniform vec4 uBolt/.test(rn) && /uCloudOff/.test(rn) && /uWind/.test(tr) && /uWind/.test(rn), 'lightning in the sky; one wind moves clouds, grass and trees');
  ok(/bolt\.dist \/ 340/.test(ui) && /'thunder'/.test(au) && /rain\(level\)/.test(au) && /Ливень залил факел/.test(ui) && /air\.drop/.test(ms), 'thunder comes after the flash by distance; rain sounds; the downpour puts out the torch; arrows feel the wind');
  ok(/check\('precip'/.test(scr) && /precip: true/.test(ui) && /edge\('F7'\)/.test(ui), 'a setting hides rain and snow; F7 cycles the weather for testing');
}

{
  const RV = K.Places.RIVER, len = T.river.length, lk = RV.lake, nearStep = s => T.steps.some(st => s >= st - 0.5 && s < st + 2.5);
  let dry = [], rise = 0, prevL = Infinity;
  for (let s = 0; s <= len; s += 1) {
    const p = K.Terrain.pointAt(T.river, s), L = T.levelAt(s);
    if (L > prevL + 1e-6) rise++;
    prevL = L;
    if (!nearStep(s) && !(T.waterAt(p.x, p.z) > T.heightAt(p.x, p.z) + 0.2)) dry.push(s);
  }
  const head = K.Terrain.pointAt(T.river, 0), tail = K.Terrain.pointAt(T.river, len);
  ok(!dry.length && !rise, `water stands in the river at every metre from the source lake to the map edge (${len.toFixed(0)} m${dry.length ? ', dry at ' + dry.slice(0, 5).join(', ') : ''}) and never flows uphill`);
  ok(Math.hypot(head.x - lk.at[0], head.z - lk.at[1]) <= lk.r + 1 && T.waterAt(lk.at[0], lk.at[1]) === T.lakeLevel && T.lakeLevel - T.heightAt(lk.at[0], lk.at[1]) > 2.5 && tail.z >= T.SIZE - 1, `the river starts at the mountain lake «${lk.name}» (${(T.lakeLevel - T.heightAt(lk.at[0], lk.at[1])).toFixed(1)} m deep) and leaves the map in the south`);
  const drops = T.steps.map(s => T.levelAt(s - 0.05) - T.levelAt(s + 0.05));
  ok(T.steps.length >= 12 && drops.every(d => d > 1 && d < 4.5), `the cascade falls from the lake in ${T.steps.length} steps of ${Math.min(...drops).toFixed(1)}–${Math.max(...drops).toFixed(1)} m`);
  const wm = T.waterMesh(), stride = T.WATER_LAYOUT.reduce((a, b) => a + b, 0), kinds = {};
  for (let q = 0; q < wm.length; q += stride) kinds[wm[q + 7]] = (kinds[wm[q + 7]] || 0) + 1;
  ok(kinds[0] > 1000 && kinds[1] === 144 && kinds[2] === 144 && kinds[3] === T.steps.length * 6, 'the water mesh holds the river, the lake, the swamp and a sheet of falling water at every step');
  const sp = s => wm.find((v, q) => q % stride === 3 && Math.abs(v - s) < 1.1 && wm[q + 4] === 0);
  const speedAt = s => { for (let q = 0; q < wm.length; q += stride) if (wm[q + 7] === 0 && Math.abs(wm[q + 3] - s) < 1.1) return wm[q + 8]; return 0; };
  ok(speedAt(T.steps[3] + 3) > speedAt(900) && speedAt(T.fordS) > speedAt(T.fordS + 120) && T.flowAt(760, 1000)[1] > 0, 'water runs south, faster in the mountains and over the ford');
  const cp = K.Terrain.pointAt(T.river, T.steps[4] + 3), nv = K.Nav.of(W);
  ok(T.cascadeAt(cp.x, cp.z) && K.Nav.blocked(nv, cp.x, cp.z) && !K.Nav.blocked(nv, 764, 760), 'paths go round the cascade pools, the ford stays open');
  const sw = K.Places.SWAMP, tus = [];
  for (let cx = Math.floor((sw.at[0] - 60) / K.Detail.CELL); cx < (sw.at[0] + 60) / K.Detail.CELL; cx++) for (let cz = Math.floor((sw.at[1] - 60) / K.Detail.CELL); cz < (sw.at[1] + 60) / K.Detail.CELL; cz++) tus.push(...K.Detail.small(T, cx, cz).filter(o => o.kind === K.Detail.SID.tussock));
  ok(tus.length > 40 && tus.every(o => T.waterAt(o.x, o.z) > o.y), `${tus.length} tussocks stand in the swamp water`);
  const rn = read(`${DIR}/ki-render.js`);
  ok(/float waves\(vec2 p, vec2 dir, float speed\)/.test(rn) && /uMoonDir/.test(rn.slice(rn.indexOf('const WATER_FS'))) && /if \(falls\)/.test(rn) && /if \(swamp\)/.test(rn) && /bank = smoothstep/.test(rn), 'the water shader flows along the river, shows depth, foam, falls, duckweed, sun glints and the moon path');
}

{
  const E = K.Edge, SZ = T.SIZE, lo = E.BORDER - 0.01, hi = SZ - E.BORDER + 0.01, left = [];
  const walkOut = (x, z, yaw, swim) => {
    const mv = K.Move.body(W, x, z, yaw);
    if (swim) mv.swim = true;
    for (let i = 0; i < 240; i++) K.Move.step(mv, { fwd: 1, side: 0, yaw, sprint: true, jump: i % 30 === 0 }, 1 / 60, W);
    return mv;
  };
  for (let q = 40; q < SZ - 40; q += 97) for (const [x, z, yaw] of [[q, 14, 0], [q, SZ - 14, Math.PI], [14, q, -Math.PI / 2], [SZ - 14, q, Math.PI / 2]]) {
    const mv = walkOut(x, z, yaw);
    if (mv.pos[0] < lo || mv.pos[0] > hi || mv.pos[2] < lo || mv.pos[2] > hi) left.push([x, z].join(','));
  }
  const rx = T.riverX(SZ - 13), swim = walkOut(rx, SZ - 13, Math.PI, true);
  ok(!left.length && swim.pos[2] <= hi && swim.edge, `nobody leaves the valley on foot along the edge or swimming down the river${left.length ? ': ' + left.slice(0, 4).join(' ') : ''}`);
  ok(E.reason(T, 700, 12) === E.REASONS.n && E.reason(T, 12, 800) === E.REASONS.w && E.reason(T, SZ - 12, 800) === E.REASONS.e && E.reason(T, rx, SZ - 12) === E.REASONS.river, 'the edge says why: mountains in the north, windfall in the west, hills in the east, the river in the south');
  let seam = 0;
  for (let q = 0; q <= SZ; q += 7) for (const [x, z, ox, oz] of [[q, 0, 0, -2], [q, SZ, 0, 2], [0, q, -2, 0], [SZ, q, 2, 0]]) seam = Math.max(seam, Math.abs(E.height(T, x + ox, z + oz) - T.meshHeightAt(Math.min(x, SZ - 0.01), Math.min(z, SZ - 0.01))));
  const north = E.height(T, 700, -1500), south = E.height(T, 1000, SZ + 1500), west = E.height(T, -1200, 700);
  ok(seam < 1.5 && north > 350 && south < 40 && west > 40 && west < 200, `land goes on past the edge without a step (${seam.toFixed(2)} m): a ridge of ${north.toFixed(0)} m in the north, hills of ${west.toFixed(0)} m in the west, fields of ${south.toFixed(0)} m in the south`);
  const m = E.mesh(T), tr = E.trees(T, F), wt = E.water(T);
  let inside = 0;
  for (let i = 0; i < tr.length; i += 8) if (tr[i] > 0 && tr[i] < SZ && tr[i + 2] > 0 && tr[i + 2] < SZ) inside++;
  ok(m.length / 7 < 150000 && tr.length / 8 > 20000 && !inside && wt[wt.length - 9] > SZ + 1500, `${(m.length / 21).toFixed(0)} triangles of land and ${tr.length / 8} far trees round the valley; the river runs on for 1.6 km`);
  const props = K.Detail.props(T, F).filter(p => p.windfall);
  ok(props.length > 150 && props.every(p => p.x < 30 && p.box), `${props.length} fallen trunks block the west edge`);
  const rn = read(`${DIR}/ki-render.js`), scr = read(`${DIR}/ki-screens.js`), ui = read(`${DIR}/ki-ui.js`);
  ok(/const OUTER_FS/.test(rn) && /float mtn = /.test(rn) && /K\.Edge\.mesh\(T\)/.test(rn) && /clip\('evenodd'\)/.test(scr) && /Дальше не пройти: /.test(ui), 'the outer land and far mountains are drawn, the map hatches the edge, the hint names the obstacle');
}

{
  const scr = read(`${DIR}/ki-screens.js`), ui = read(`${DIR}/ki-ui.js`), rn = read(`${DIR}/ki-render.js`), tr = read(`${DIR}/ki-trees.js`);
  const group = scr.slice(scr.indexOf('<legend>Детали мира</legend>'), scr.indexOf('</fieldset>', scr.indexOf('<legend>Детали мира</legend>')));
  ok(['grass', 'clutter', 'clouds', 'outer', 'precip'].every(k => group.includes(`'${k}'`)) && /clutter: true, clouds: true, outer: true/.test(ui), 'the settings group «Детали мира» holds grass, small clutter, clouds, the land past the edge and rain, all on by default');
  ok(/v\.clutter !== false/.test(rn) && /v\.clouds === false \? 0 : 1/.test(rn) && /v\.outer !== false\) \{ gl\.drawArrays/.test(rn) && /outer === false \? this\.inner/.test(tr), 'each world detail can be switched off in the renderer');
}

{
  const au = read(`${DIR}/ki-audio.js`), ui = read(`${DIR}/ki-ui.js`), css = read('css/apps/kirill98.css');
  const need = ['jingle', 'horn', 'bell', 'bila', 'gong', 'step', 'creak', 'tap', 'flesh', 'mail', 'wood', 'fire', 'caw', 'howl', 'roar', 'grunt', 'bark', 'chirp', 'cricket', 'clink', 'thunder', 'splash'];
  ok(need.every(k => au.includes(`kind === '${k}'`)) && /plate:/.test(au) && /iron:/.test(au) && ['water', 'stone', 'wood', 'snow'].every(s => au.includes(`s === '${s}'`)) && /o\.leg === 'peg'/.test(au) && /o\.leg === 'iron'/.test(au), 'every sound of section 9: bells and horn, footsteps on each ground with a peg leg or an iron foot, the wheelchair, blows on flesh, mail, plate, wood and iron, fire, crows, wolves, the bear, boars and dogs');
  const TH = K.Sound.THEMES, names = ['forest', 'palace', 'fort', 'town', 'alarm'];
  const bad = [];
  for (const n of names) for (const v of TH[n].voices) for (const x of K.Sound.parse(v.seq)) if (x.n !== '-' && (v.inst === 'drum' ? !/^[KTS]$/.test(x.n) : !(K.Sound.freqOf(x.n) > 20))) bad.push(n + ':' + x.n);
  const lens = names.map(n => K.Sound.lengthOf(TH[n]));
  ok(!bad.length && lens.every(l => l > 6 && l < 40) && TH.forest.voices[0].inst === 'pipe' && TH.palace.voices[0].inst === 'brass' && TH.fort.voices[0].inst === 'drum' && TH.town.voices[0].inst === 'fiddle', `zone themes: pipes in the forest, brass at the palace, drums at the fort, a fiddle in town, plus the alarm (${lens.map(l => l.toFixed(0)).join(', ')} s)`);
  const param = () => ({ value: 0, setValueAtTime() { }, exponentialRampToValueAtTime() { }, linearRampToValueAtTime() { }, setTargetAtTime() { } });
  const node = () => ({ connect() { }, disconnect() { }, start() { }, stop() { }, gain: param(), frequency: param(), Q: param(), pan: param(), type: '', buffer: null, loop: false });
  let made = 0;
  class FakeCtx { constructor() { this.state = 'running'; this.currentTime = 0; this.sampleRate = 8000; this.destination = node(); } createGain() { made++; return node(); } createOscillator() { made++; return node(); } createBiquadFilter() { return node(); } createBufferSource() { return node(); } createStereoPanner() { return node(); } createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; } resume() { } close() { } }
  const old = globalThis.AudioContext;
  globalThis.AudioContext = FakeCtx;
  const snd = new K.Sound();
  snd.wake();
  const ear = { eye: [0, 0, 0], right: [1, 0, 0] };
  for (const k of need.concat(['parry', 'plate', 'iron', 'whoosh', 'cut', 'kick', 'straw', 'chop'])) snd.play(k, { at: [3, 0, 4], ear, surface: 'stone', leg: 'iron', n: 2 });
  for (const s of ['soft', 'water', 'wood', 'snow']) snd.play('step', { at: [1, 0, 1], ear, surface: s, leg: 'peg' });
  const len = names.map(n => snd.music(n, 'villain'));
  snd.ambience({ wind: 1, forest: 1, market: 1 });
  snd.rain(1);
  const playing = snd.playing();
  snd.stopMusic(0.1);
  globalThis.AudioContext = old;
  ok(made > 300 && len.every(l => l > 6) && playing && Object.keys(snd.beds).length === 4, `every sound, theme and background bed plays on a stand-in WebAudio (${made} nodes)`);
  ok(/footsteps\(eye\)/.test(ui) && /wildlife\(eye, D\)/.test(ui) && /clocks\(eye\)/.test(ui) && /ambienceStep\(eye, D, wx\)/.test(ui) && /musicStep\(eye\)/.test(ui) && /'alarm', side/.test(ui) && /musicBus\.gain\.value = this\.sound\.musicVolume/.test(ui), 'the game plays footsteps, animals, bells by the hour, the background of forest, mountains and market, zone themes and the alarm in a fight; music has its own volume');
  ok(['elf', 'guard', 'villain', 'town'].every(s => css.includes(`.ki-side-${s} .ki-menu-plate`)) && /el\.classList\.add\('ki-side-' \+ this\.skin\(kind\)\)/.test(ui) && /TOWN_PANELS = new Set\(\['shop', 'doctor'/.test(ui), 'each side has its own frame material: bark and moss, plaster and red cloth, iron and soot, wood and brass; town counters wear the town frame');
  const rd = K.Screens.readme(), rl = rd.split('\r\n');
  ok(rd.includes('Кириллу, который джва года хотел такую игру.') && rl[0] === 'Kirill The Game' && /W A S D/.test(rd) && !/свободная камера|F2|F3 |F4 |манекен/.test(rd) && rl.every(l => l.length <= 80) && !/\n(?<!\r\n)/.test(rd.replace(/\r\n/g, '')) && !/Windows|Microsoft/.test(rd), 'README.TXT: title, the dedication to Kirill, controls without debug keys, lines up to 80 signs with CRLF');
}

{
  const app = read('js/apps/kirill98-app.js');
  ok(/globalThis\.appKirill98/.test(app) && /'app_kirill98'/.test(app), 'window wrapper and window id');
  ok(/onClose: \(\) => \{ if \(this\.ui\) this\.ui\.destroy\(\)/.test(app), 'closing the window releases the game');
  ok(/isActive: \(\) => wm\.isTopWindow\(id\)/.test(app), 'the game pauses when its window is not on top');
  const ui = read(`${DIR}/ki-ui.js`), gpu = read(`${DIR}/ki-gl.js`);
  ok(/removeEventListener\('keydown'/.test(ui) && /observer\.disconnect\(\)/.test(ui) && /cancelAnimationFrame/.test(ui) && /exitPointerLock/.test(ui), 'destroy removes listeners, observer, frame loop and mouse capture');
  ok(/WEBGL_lose_context/.test(gpu) && /Gpu\.live--/.test(gpu), 'destroy frees the WebGL context');
  ok(/e\.code/.test(ui) && !/e\.key === 'w'/.test(ui), 'keys are read by position, so a Russian layout works');
}

{
  const gm = read('js/game-manager.js'), start = gm.indexOf('      kirill98: {');
  ok(start > 0, 'Kirill The Game is in the game catalog');
  const entry = gm.slice(start, gm.indexOf('launch:', start) + 80);
  const str = k => { const m = new RegExp(k + ": '([^']*)'").exec(entry); return m ? m[1] : null; }, list = k => { const m = new RegExp(k + ': \\[([^\\]]*)\\]').exec(entry); return m ? m[1].split(',').map(s => s.trim().replace(/^'|'$/g, '')) : []; };
  ok(/steam: true/.test(entry) && str('title') === 'Kirill The Game' && str('subtitle') === '3Д-экшон по письму Кирилла' && str('developer') === 'Четыре Зоны Софт (2000) / Win 98 Edition', 'sold on Steam as Kirill The Game by Четыре Зоны Софт');
  ok(/price: 24,/.test(entry) && str('priceDisplay') === '$24.00' && str('targetExe') === 'KIRILL98.EXE' && str('folder') === 'KirillTheGame' && str('setupExe') === 'Setup_KirillTheGame.exe', 'costs $24.00, installs KIRILL98.EXE into KirillTheGame');
  const tags = list('tags'), shots = list('shots'), genre = str('genre');
  ok(genre === '3Д-экшон' && tags.length >= 3 && tags.length <= 5 && tags.every(x => x.length <= 24 && x !== genre) && shots.length === 2 && shots.every(x => x.length <= 32), `store page: genre ${genre}, tags ${tags.join(', ')}, shots ${shots.join(' / ')}`);
  ok(/джва года/.test(str('desc') || '') && /window\.appKirill98 && window\.appKirill98\.open\(\)/.test(entry), 'description from the letter and launch through the window wrapper');
  const shot = n => { const f = path.join(ROOT, `content/steam/kirill98-${n}.jpg`); if (!fs.existsSync(f)) return null; const b = fs.readFileSync(f); for (let i = 2; i < b.length;) { const m = b[i + 1], len = b.readUInt16BE(i + 2); if (m >= 0xc0 && m <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; i += 2 + len; } return null; };
  ok([1, 2].every(n => { const s = shot(n); return s && s[0] === 640 && s[1] === 480; }) && /  kirill98: \{/.test(read('tools/steam-shots-recipes.cjs')), 'two Steam screenshots 640×480 from the real game by the recipe');
  const load = gm.slice(gm.indexOf('loadState'), gm.indexOf('loadState') + 4000);
  ok(!/'kirill98'/.test(load) && !/kirill98Granted/.test(gm), 'not purchased, downloaded or installed by default, no grant flag');
  ok(/isInstalled\('kirill98'\)/.test(read('js/desktop.js')) && /isInstalled\('kirill98'\)\) \? `[\s\S]*?data-action="kirill98"/.test(read('js/taskbar.js')) && /gmInstalled\.includes\('kirill98'\)[\s\S]*?KIRILL98\.EXE[\s\S]*?README\.TXT/.test(read('js/filesystem.js')), 'desktop icon, Start menu item and C:\\Games\\KirillTheGame only when installed');
  const dlg = read('js/apps/dialogs.js'), ex = read('js/apps/explorer.js'), tb = read('js/taskbar.js');
  ok(['kirill98', 'kirillthegame', 'kirillgame'].every(c => dlg.includes(`cmd === '${c}'`)) && /showInSteam\(\\'kirill98\\'\)/.test(dlg) && /KIRILL98\.EXE[\s\S]{0,200}showInSteam\('kirill98'\)/.test(ex) && /case 'kirill98':[\s\S]{0,200}showInSteam\('kirill98'\)/.test(tb), 'Run, the .exe and the Start menu lead to Steam when the game is not installed');
  ok(/app_kirill98[\s\S]{0,80}kirill98\.exe/.test(read('js/apps/task-manager.js')) && (read('js/i18n.js').match(/'app\.kirill98': 'Kirill The Game'/g) || []).length === 4 && /game\('kirill98', \['kirill98_\*'\], \{ dbs: \['kirill98'\] \}\)/.test(read('js/apps/backup-catalog.js')) && /'kirill98': px\(/.test(read('js/icons.js')), 'task manager process, window name in both languages, backup of saves and settings, pixel icon');
  ok(/id === 'kirill98'[\s\S]{0,200}Screens\.readme\(\)/.test(gm), 'README.TXT of the installed game comes from the game itself');
}

Promise.all(pending).then(() => console.log(`kirill98: ${checks} checks passed in ${((Date.now() - t0) / 1000).toFixed(1)} s`), e => { console.error(e); process.exit(1); });
