const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js', 'apps', 'hl2');
const CORE = ['h2-core', 'h2-data', 'h2-world', 'h2-phys', 'h2-fx', 'h2-game', 'h2-ai', 'h2-vehicle', 'h2-tex', 'h2-models', 'h2-render', 'h2-audio', 'h2-maps-util'];
const MAPS = fs.readdirSync(DIR).filter(f => /^h2-maps-c\d\d\.js$/.test(f)).map(f => f.slice(0, -3)).sort();
for (const f of [...CORE, ...MAPS, 'h2-ui']) require(path.join(DIR, f + '.js'));
const H = globalThis.Hl2;

let passed = 0;
const only = process.argv[2] || null;
function test(name, fn) {
  if (only && !name.includes(only)) return;
  const t0 = Date.now();
  fn();
  passed++;
  console.log(`  ok - ${name} (${Date.now() - t0} ms)`);
}

function newGame(map, o = {}) {
  const ch = H.CHAPTERS.findIndex(c => c.map === map);
  const carry = o.carry !== undefined ? o.carry : (ch >= 0 && H.CHAPTERS[ch].carry ? H.CHAPTERS[ch].carry() : null);
  const g = new H.Game(Object.assign({ map, skill: 1, carry }, o));
  g.events.length = 0;
  if (o.skipIntro) {
    for (const s of g.scripts) if (s.def.when === undefined || s.def.when === 'start') { s.fired = true; s.running = false; }
    g.player.frozen = false;
  }
  return g;
}

function run(g, sec, inp = {}) {
  const n = Math.round(sec / H.TICK);
  for (let i = 0; i < n; i++) {
    g.step(typeof inp === 'function' ? inp(g, i) : inp);
    if (g.events.length > 200) g.events.length = 0;
    if (g.pendingMap) return;
  }
}

function until(g, cond, maxSec, inp = {}, label = '') {
  const n = Math.round(maxSec / H.TICK);
  for (let i = 0; i < n; i++) {
    if (cond(g)) return true;
    g.step(typeof inp === 'function' ? inp(g, i) : inp);
    if (g.events.length > 200) g.events.length = 0;
  }
  if (cond(g)) return true;
  throw new Error(`timeout waiting for ${label || cond.toString().slice(0, 80)} on ${g.mapId} at t=${g.time.toFixed(1)} pos=${JSON.stringify(g.player.pos)} hp=${g.player.hp}`);
}

function tp(g, x, z, y) {
  const p = g.player;
  if (p.vehicle) g.exitVehicle(true);
  p.pos = { x, y: y !== undefined ? y : g.world.spawnY(x, z, null, 0.3), z };
  p.vel = { x: 0, y: 0, z: 0 };
  p.onGround = true;
}

function tpZone(g, id, y) {
  const z = g.world.zones[id];
  assert.ok(z, `zone ${id} exists on ${g.mapId}`);
  tp(g, (z.x1 + z.x2) / 2, (z.z1 + z.z2) / 2, y !== undefined ? y : (z.y1 > -1e6 ? z.y1 + 0.6 : undefined));
}

function scriptDone(g, id) {
  const s = g.scripts.find(x => x.id === id);
  assert.ok(s, `script ${id} exists on ${g.mapId}`);
  return s.fired && !s.running;
}

function killAll(g, filter = () => true) {
  for (const n of g.npcs) if (n.alive && n.team !== 'rebel' && n.team !== 'neutral' && filter(n)) g.killNpc(n, { type: 'bullet', attacker: g.player });
}

function reach(g, a, b, label) {
  const p = g.world.findPath(a, b, { max: 60000 });
  assert.ok(p, `nav path ${label} on ${g.mapId}`);
}

function aimAt(g, t) {
  const e = g.eye();
  const c = t.kind === 'npc' ? H.AI.chest(t) : t;
  const dx = c.x - e.x, dy = c.y - e.y, dz = c.z - e.z;
  g.player.yaw = Math.atan2(dx, dz);
  g.player.pitch = Math.atan2(dy, Math.hypot(dx, dz));
}

function visibleHostiles(g, range = 40) {
  const e = g.eye();
  return g.npcs.filter(n => n.alive && H.hostile('player', n.team) && !n.def.invulnerable && H.dist(n.pos, g.player.pos) < range && g.world.lineClear(e, H.AI.chest(n)))
    .sort((a, b) => H.dist(a.pos, g.player.pos) - H.dist(b.pos, g.player.pos));
}

function fight(g, maxSec, o = {}) {
  const n = Math.round(maxSec / H.TICK);
  let t = null;
  for (let i = 0; i < n; i++) {
    if (g.player.dead) throw new Error(`player died on ${g.mapId} at t=${g.time.toFixed(1)}`);
    if (!t || !t.alive || i % 30 === 0) t = visibleHostiles(g, o.range || 45).filter(o.filter || (() => true))[0] || null;
    if (!t) {
      const rest = g.npcs.filter(m => m.alive && H.hostile('player', m.team) && !m.def.invulnerable && (o.filter || (() => true))(m));
      if (!rest.length) { if (o.untilClear) return true; g.step({}); continue; }
      const m = rest[0];
      if (i % 60 === 0) { const a = H.yawTo(m.pos, g.player.pos); tp(g, m.pos.x + Math.sin(a) * 3, m.pos.z + Math.cos(a) * 3, m.def.flying ? undefined : m.pos.y + 0.05); }
      g.step({});
      continue;
    }
    aimAt(g, t);
    const w = H.WEAPONS[g.player.cur];
    const d = H.dist(t.pos, g.player.pos);
    const inp = { fire1: w && w.melee ? d < 2.2 && i % 2 === 0 : i % 2 === 0 };
    if (w && w.melee && d > 1.6) inp.fwd = 1;
    if (g.player.cur && g.player.clip[g.player.cur] === 0 && i % 20 === 0) inp.reload = true;
    g.step(inp);
    if (g.events.length > 200) g.events.length = 0;
  }
  return false;
}

function drive(g, pts, maxSec, o = {}) {
  const v = g.player.vehicle;
  assert.ok(v, 'player drives a vehicle on ' + g.mapId);
  let k = 0;
  const n = Math.round(maxSec / H.TICK);
  for (let i = 0; i < n && k < pts.length; i++) {
    const p = pts[k];
    const dx = p[0] - v.pos.x, dz = p[1] - v.pos.z;
    if (Math.hypot(dx, dz) < (o.radius || 4)) { k++; continue; }
    const ang = H.wrapAngle(Math.atan2(dx, dz) - v.yaw);
    const inp = { fwd: Math.abs(ang) > 1.2 ? 0.4 : 1, side: H.clamp(-ang * 2.5, -1, 1) };
    if (o.fire) { const tgt = o.fire(g); if (tgt) { aimAt(g, tgt); inp.fire1 = true; } }
    g.step(inp);
    if (g.events.length > 200) g.events.length = 0;
    if (g.player.dead) throw new Error('player died while driving on ' + g.mapId);
  }
  assert.equal(k, pts.length, `reached all ${pts.length} waypoints on ${g.mapId}, stuck at ${k} near ${JSON.stringify(v.pos)}`);
}

function X(c) { return c * 2 + 1; }
function E(c) { return c * 2; }

console.log('--- Half-Life 2 (2000 Edition) ---');

test('modules load and export the engine', () => {
  for (const k of ['Game', 'World', 'Phys', 'AI', 'Vehicle', 'Renderer', 'Batch', 'Models', 'Tex', 'UI', 'Audio98', 'CHAPTERS', 'MU']) assert.ok(H[k], k);
  assert.equal(H.CHAPTERS.length, 14);
});

test('every chapter map compiles, has a start inside open space and builds navigation', () => {
  for (const ch of H.CHAPTERS) {
    const def = H.maps[ch.map];
    if (!def) continue;
    const g = newGame(ch.map);
    const p = g.player.pos;
    assert.ok(!g.world.overlaps(p.x, p.y + 0.05, p.z, 0.3, 1.7, 0.3, null), `${ch.map} start is free`);
    assert.ok(g.world.nav.nodes.length > 200, `${ch.map} nav nodes`);
    for (const s of g.world.spawns) {
      if (s.kind === 'npc' && !s.group && !H.NPCS[s.type].flying && s.type !== 'barnacle' && s.y === undefined) {
        const y = g.world.spawnY(s.x, s.z, null, 0.2);
        assert.ok(!g.world.overlaps(s.x, y + 0.1, s.z, 0.25, 1.2, 0.25, null), `${ch.map} npc ${s.type} at ${s.x},${s.z} is not inside geometry`);
      }
    }
  }
});

test('physics: crates fall, stack and sleep; explosive barrels chain', () => {
  const g = newGame('c01', { skipIntro: true });
  const a = H.Phys.makeProp(g, 'crate', 90, 3, 20);
  const b = H.Phys.makeProp(g, 'crate', 90.1, 5, 20);
  run(g, 3);
  assert.ok(Math.abs(a.pos.y) < 0.05, 'bottom crate on ground');
  assert.ok(Math.abs(b.pos.y - 1) < 0.08, 'second crate stacked on the first');
  assert.ok(a.sleeping && b.sleeping, 'both sleep');
  const r1 = H.Phys.makeProp(g, 'barrel_red', 95, 0, 30);
  const r2 = H.Phys.makeProp(g, 'barrel_red', 97, 0, 30);
  H.Phys.damageProp(g, r1, 100, { type: 'bullet' });
  run(g, 1);
  assert.ok(r1.dead && r2.dead, 'second barrel ignited by the first');
});

test('player: walks, jumps, crouch-jumps, steps up stairs, takes fall damage', () => {
  const g = newGame('c01', { skipIntro: true });
  const p = g.player;
  tp(g, 80, 20);
  const x0 = p.pos.x;
  p.yaw = Math.PI / 2;
  run(g, 1, { fwd: 1 });
  assert.ok(p.pos.x - x0 > 4, 'walked east');
  run(g, 0.05, { jump: true });
  let maxY = 0;
  run(g, 1, g2 => { maxY = Math.max(maxY, g2.player.pos.y); return {}; });
  assert.ok(maxY > 0.8 && maxY < 1.3, 'jump height ' + maxY);
  tp(g, X(37), X(27) + 1.5);
  p.yaw = Math.PI;
  run(g, 3, { fwd: 1 });
  assert.ok(p.pos.y > 3.9, 'climbed apartment stairs to floor 2: ' + p.pos.y);
  tp(g, 105, 42, 12.5);
  p.suit = true;
  const hp = p.hp;
  run(g, 3);
  assert.ok(p.hp < hp, 'fall damage taken');
});

test('chapter 1 walkthrough: can, Barney, raid, rooftops, Alyx and the lab door', () => {
  const g = newGame('c01');
  until(g, () => !g.player.frozen && g.time > 2, 25, {}, 'intro unfreezes player');
  tpZone(g, 'cangate');
  run(g, 1);
  const can = g.props.find(q => q.tag === 'can');
  g.grab(can, 'use');
  const bin = g.world.zones.bin;
  tp(g, (bin.x1 + bin.x2) / 2 - 1.2, (bin.z1 + bin.z2) / 2);
  g.player.yaw = Math.PI / 2;
  g.player.pitch = -0.6;
  run(g, 0.5);
  g.dropHeld(true);
  can.pos.x = (bin.x1 + bin.x2) / 2; can.pos.z = (bin.z1 + bin.z2) / 2; can.pos.y = 1.2;
  until(g, () => g.flags.canDone, 5, {}, 'can in bin');
  until(g, () => g.doors.find(d => d.id === 'gate1').t > 0.9, 6, {}, 'gate opens');
  tpZone(g, 'corridor');
  until(g, () => g.doors.find(d => d.id === 'barneydoor').open, 5, {}, 'barney door');
  tpZone(g, 'room');
  until(g, () => g.doors.find(d => d.id === 'backdoor').open, 30, {}, 'back door');
  tpZone(g, 'plaza');
  run(g, 2);
  tpZone(g, 'aptin', 0);
  until(g, () => g.npcs.some(n => n.tag === 'raid' && n.alive), 12, {}, 'raid spawns');
  tpZone(g, 'floor2', 4);
  run(g, 1);
  tpZone(g, 'roofA', 4.2);
  until(g, () => g.npcs.some(n => n.tag === 'shooters' && n.alive), 3, {}, 'shooters');
  tpZone(g, 'roofB', 4.6);
  run(g, 1);
  tpZone(g, 'alley', 0);
  until(g, () => g.npcById('alyx'), 20, {}, 'alyx arrives');
  until(g, () => g.doors.find(d => d.id === 'labdoor').open, 30, {}, 'lab door');
  assert.ok(!g.player.dead, 'player survives the ambush');
  tpZone(g, 'lab', 0);
  until(g, () => g.pendingMap === 'c02', 3, {}, 'changelevel to c02');
});

test('chapter 2 walkthrough: suit, chargers, Barney, teleport accident', () => {
  const g = newGame('c02');
  run(g, 2);
  until(g, () => g.doors.find(d => d.id === 'labentry').open, 8, {}, 'lab entry opens');
  tpZone(g, 'lab', 0);
  run(g, 3);
  const suit = g.items.find(i => i.type === 'suit');
  tp(g, suit.pos.x, suit.pos.z);
  run(g, 0.2);
  assert.ok(g.player.suit, 'suit picked up');
  g.player.armor = 0;
  tp(g, X(26), X(1) + 1.2);
  g.player.yaw = Math.PI; g.player.pitch = -0.15;
  run(g, 3, { use: true });
  assert.ok(g.player.armor > 10, 'suit charger works: ' + g.player.armor);
  until(g, () => g.doors.find(d => d.id === 'teledoor').open, 40, {}, 'teleport room opens');
  tpZone(g, 'teleroom', 0);
  until(g, () => g.flags.alyxGone, 40, {}, 'alyx teleports');
  const pad = g.world.zones.pad;
  tp(g, (pad.x1 + pad.x2) / 2, (pad.z1 + pad.z2) / 2 + 0.8);
  until(g, () => g.pendingMap === 'c03', 30, {}, 'changelevel to c03');
});

test('chapter 3 walkthrough: crowbar, pistol, canal, seesaw counterweight, barnacles, manhacks', () => {
  const g = newGame('c03');
  until(g, () => g.items.some(i => i.type === 'weapon_crowbar' && i.settled), 10, {}, 'crowbar lands');
  const cb = g.items.find(i => i.type === 'weapon_crowbar');
  tp(g, cb.pos.x, cb.pos.z);
  run(g, 0.3);
  assert.ok(g.player.weapons.crowbar, 'crowbar picked up');
  until(g, () => g.npcs.some(n => n.tag === 'yardcops'), 8, {}, 'yard cops');
  fight(g, 20, { untilClear: true, filter: n => n.tag === 'yardcops' });
  assert.ok(g.tagDead('yardcops'), 'yard cops dead');
  const crate = g.props.find(q => q.type === 'crate' && q.contains === 'healthvial');
  const items0 = g.items.length;
  H.Phys.damageProp(g, crate, 50, { type: 'club' });
  assert.ok(g.items.length > items0, 'crate drops loot');
  tp(g, E(34), E(4), 2.6);
  run(g, 0.5);
  assert.ok(g.player.weapons.pistol, 'pistol from the warehouse mezzanine');
  tpZone(g, 'warehouse', 0);
  fight(g, 25, { untilClear: true, filter: n => n.tag === 'wcops' });
  tp(g, X(38), X(9));
  reach(g, g.player.pos, { x: X(55), y: -3.2, z: X(22) }, 'bank to canal south');
  until(g, () => g.npcs.some(n => n.tag === 'canalcops'), 3, {}, 'canal cops');
  g.god = true;
  killAll(g, n => n.tag === 'canalcops');
  const saw = g.surfaces.find(s => s.id === 'saw1');
  tp(g, saw.x, saw.z - 3.2, -3.2);
  g.player.yaw = 0;
  run(g, 3, { fwd: 1 });
  assert.ok(saw.angle < 0.1, 'without counterweight the far end drops: ' + saw.angle.toFixed(2));
  assert.ok(!g.world.zoneHas('ledge', g.player.pos), 'cannot reach the ledge without counterweight');
  tp(g, saw.x, saw.z - 6, -3.2);
  run(g, 3);
  const blocks = g.props.filter(q => q.type === 'cinder').slice(0, 5);
  blocks.forEach((q, i) => { q.pos = { x: saw.x - 0.6 + (i % 3) * 0.5, y: 0, z: saw.z - 2.9 + Math.floor(i / 3) * 0.45 }; q.vel = { x: 0, y: 0, z: 0 }; q.sleeping = false; });
  run(g, 4);
  assert.ok(saw.angle > 0.35, 'counterweight tips the plank back: ' + saw.angle.toFixed(2));
  tp(g, saw.x, saw.z - 3.3, H.Phys.surfaceY(saw, saw.x, saw.z - 3.3) + 0.02);
  g.player.yaw = 0;
  until(g, () => g.world.zoneHas('ledge', g.player.pos), 8, { fwd: 1 }, 'walk up the seesaw to the ledge');
  g.god = false;
  tpZone(g, 'tunnel', 0);
  tp(g, X(49), X(30) + 0.4);
  run(g, 1);
  assert.ok(g.player.grabbed, 'barnacle grabs the player');
  g.player.cur = 'pistol';
  g.player.clip.pistol = 18;
  const bar = g.player.grabbed;
  aimAt(g, { x: bar.pos.x, y: bar.pos.y - 0.3, z: bar.pos.z });
  for (let i = 0; i < 120 && bar.alive; i++) g.step({ fire1: i % 2 === 0 });
  assert.ok(!bar.alive && !g.player.grabbed, 'shooting the barnacle frees the player');
  tpZone(g, 'hackroom', 0);
  g.player.cur = 'crowbar';
  until(g, () => g.npcs.some(n => n.tag === 'hacks' && n.type === 'manhack'), 4, {}, 'manhacks released');
  g.god = true;
  g.player.weapons.smg = true; g.player.cur = 'smg'; g.player.clip.smg = 45; g.player.ammo.smg = 200;
  fight(g, 40, { untilClear: true, filter: n => n.tag === 'hacks' });
  until(g, () => g.doors.find(d => d.id === 'hidedoor').open, 10, {}, 'hideout door opens');
  tpZone(g, 'hideout', 0);
  run(g, 6);
  const cache = g.world.caches[0];
  tp(g, (cache.x1 + cache.x2) / 2, (cache.z1 + cache.z2) / 2);
  run(g, 0.2);
  assert.ok(g.stats.caches >= 1, 'lambda cache found in the hideout');
  tpZone(g, 'dock', 0);
  until(g, () => g.pendingMap === 'c04', 3, {}, 'changelevel to c04');
});

test('chapter 4 walkthrough: airboat, gate button, float ramp jump, gun, hunter-chopper', () => {
  const g = newGame('c04');
  run(g, 1);
  const boat = g.vehicles[0];
  tp(g, boat.pos.x - 2.5, boat.pos.z);
  g.player.yaw = Math.PI / 2;
  g.enterVehicle(boat);
  assert.equal(g.player.vehicle, boat);
  g.god = true;
  drive(g, [[X(16), X(3) + 1], [X(30), X(3) + 1], [X(38) + 1, X(7)], [X(38) + 1, X(12)]], 60);
  assert.ok(boat.pos.z < E(14) + 0.8, 'closed gate blocks the canal');
  g.exitVehicle(true);
  tp(g, X(43), X(13), 0.5);
  killAll(g, n => n.tag === 'hutguard');
  const btn = g.buttons.find(b => b.id === 'gatebtn');
  tp(g, X(44) - 0.5, X(14));
  aimAt(g, btn.pos);
  run(g, 0.1, { use: true });
  assert.ok(g.flags['btn:gatebtn'], 'gate button pressed');
  until(g, () => g.doors.find(d => d.id === 'cgate').t > 0.9, 15, {}, 'canal gate raised');
  tp(g, boat.pos.x - 1.5, boat.pos.z, 0);
  g.enterVehicle(boat);
  drive(g, [[X(38) + 1, X(19)], [X(35), X(22)]], 40);
  until(g, () => g.npcById('chopper'), 2, {}, 'chopper arrives');
  const ramp = g.surfaces.find(s => s.id === 'ramp1');
  const floats = g.props.filter(q => q.type === 'barrel_float');
  const cages = ramp.cages;
  floats.slice(0, 3).forEach((q, i) => { const c = cages[i % 2]; q.pos.x = (c[0] + c[2]) / 2; q.pos.z = (c[1] + c[3]) / 2 + (i > 1 ? 1.2 : -1.2); q.vel = { x: 0, y: 0, z: 0 }; });
  until(g, () => ramp.yEnd > 2.1, 12, {}, 'float ramp raised by three floats');
  drive(g, [[X(35), X(21) + 1], [X(35), X(33)]], 30, { radius: 2.5 });
  assert.ok(boat.pos.z > E(31), 'airboat jumped over the wall into canal C: ' + boat.pos.z.toFixed(1));
  drive(g, [[X(22), X(33)], [X(16), X(33)]], 40);
  until(g, () => boat.gun, 12, {}, 'vortigaunt mounts the gun');
  const chop = g.npcById('chopper');
  drive(g, [[X(18), X(38)], [X(30), X(41)], [X(44), X(41)], [X(30), X(43)], [X(20), X(40)], [X(30), X(41)], [X(44), X(41)], [X(30), X(43)], [X(20), X(40)]], 150, { radius: 5, fire: gm => (chop.alive && !chop.crashing ? chop : null) });
  until(g, () => !chop.alive || chop.crashing, 60, gm => { aimAt(gm, chop); return { fire1: true }; }, 'chopper destroyed');
  until(g, () => g.doors.find(d => d.id === 'damgate').open, 20, {}, 'dam gate opens');
  drive(g, [[X(58), X(41)], [X(62), X(41)]], 40, { radius: 2 });
  until(g, () => g.pendingMap === 'c05', 5, { fwd: 1 }, 'changelevel to c05');
});

test('chapter 5 walkthrough: lift, Eli, gravity gun lesson, Dog fetch, attack, tunnel', () => {
  const g = newGame('c05');
  run(g, 3);
  tpZone(g, 'liftzone', 0.5);
  until(g, () => g.doors.find(d => d.id === 'lift1').t > 0.98, 30, {}, 'lift reaches the bottom');
  run(g, 0.3);
  assert.ok(g.player.pos.y < -7.5, 'lift carried the player down: ' + g.player.pos.y.toFixed(2));
  tpZone(g, 'elilab', -8);
  until(g, () => g.doors.find(d => d.id === 'yarddoor').open, 40, {}, 'yard door opens');
  tpZone(g, 'yard', -8);
  until(g, () => g.player.weapons.gravgun, 60, {}, 'gravity gun given');
  const paint = g.props.find(q => q.tag === 'paint');
  tp(g, paint.pos.x - 2, paint.pos.z, -8);
  aimAt(g, { x: paint.pos.x, y: paint.pos.y + 0.2, z: paint.pos.z });
  until(g, () => g.player.held, 3, gm => ({ fire2: gm.time % 0.2 < 0.1 }), 'gravgun picks up the paint can');
  run(g, 0.3);
  g.player.pitch = 0.3;
  run(g, 0.1, { fire1: true });
  assert.ok(!g.player.held && paint.thrownBy === 'player', 'paint can thrown');
  until(g, () => g.npcById('dog') && g.npcById('dog').fetch, 20, {}, 'dog arrives to play');
  const ball = g.props.find(q => q.tag === 'ball');
  for (let k = 0; k < 2; k++) {
    until(g, () => g.npcById('dog').fetch && g.npcById('dog').fetch.state === 'wait' && !ball.frozen, 20, {}, 'dog waits for the ball ' + k);
    tp(g, X(26), X(8), -8);
    ball.pos = { x: X(26), y: -7.9, z: X(9) };
    ball.vel = { x: 0, y: 0, z: 0 };
    g.grab(ball, 'gravgun');
    g.player.yaw = 0.4; g.player.pitch = 0.2;
    run(g, 0.3);
    g.launchHeld(null);
    until(g, () => (g.flags.dogFetches || 0) > k, 25, {}, 'dog fetches the ball ' + k);
  }
  until(g, () => !g.npcById('dog').fetch, 30, {}, 'combine attack starts');
  tpZone(g, 'attack', -8);
  until(g, () => g.doors.find(d => d.id === 'tunneldoor').open, 30, {}, 'tunnel door opens');
  assert.ok(!g.npcById('eli') && !g.npcById('mossman'), 'Eli and Mossman were taken');
  g.player.cur = 'smg'; g.player.clip.smg = 45;
  tp(g, X(4), X(16), -8);
  fight(g, 60, { untilClear: true, filter: n => n.tag === 'tsol' });
  assert.ok(g.tagDead('tsol'), 'tunnel soldiers dead');
  tpZone(g, 'rh', -8);
  until(g, () => g.pendingMap === 'c06', 3, {}, 'changelevel to c06');
});

test('chapter 6 walkthrough: car trap, sawblades, Grigori shotgun, blade trap, rooftops, cemetery', () => {
  const g = newGame('c06');
  run(g, 3);
  tpZone(g, 'courtyard', 0);
  until(g, () => g.npcs.some(n => n.tag === 'yardz'), 3, {}, 'courtyard zombies');
  const btn = g.buttons.find(b => b.id === 'cardrop');
  tp(g, btn.pos.x + 1.2, btn.pos.z);
  aimAt(g, btn.pos);
  run(g, 0.1, { use: true });
  until(g, () => g.flags.carCrashed, 5, {}, 'car trap drops');
  const saw = g.props.find(q => q.type === 'sawblade');
  const zed = g.npcs.find(n => n.alive && n.type === 'zombie');
  tp(g, zed.pos.x - 4, zed.pos.z);
  saw.pos = { x: g.player.pos.x + 1, y: 0.05, z: g.player.pos.z };
  g.player.cur = 'gravgun';
  g.grab(saw, 'gravgun');
  aimAt(g, zed);
  run(g, 0.25);
  aimAt(g, zed);
  g.launchHeld(null);
  until(g, () => !zed.alive, 2, {}, 'sawblade cuts a zombie');
  g.player.cur = 'smg'; g.player.clip.smg = 45; g.player.ammo.smg = 180;
  fight(g, 40, { untilClear: true, filter: n => n.tag === 'yardz' });
  tpZone(g, 'street', 0);
  until(g, () => g.npcById('grigori'), 5, {}, 'Grigori appears');
  fight(g, 40, { untilClear: true, filter: n => n.tag === 'streetz' });
  tpZone(g, 'grighouse', 0);
  until(g, () => g.items.some(i => i.type === 'weapon_shotgun' && i.settled), 15, {}, 'Grigori drops his shotgun');
  const sg = g.items.find(i => i.type === 'weapon_shotgun');
  tp(g, sg.pos.x, sg.pos.z);
  run(g, 0.2);
  assert.ok(g.player.weapons.shotgun, 'shotgun picked up');
  const bb = g.buttons.find(b => b.id === 'bladesbtn');
  tp(g, bb.pos.x, bb.pos.z + 1.2);
  aimAt(g, bb.pos);
  run(g, 0.1, { use: true });
  assert.ok(g.hazards.find(h => h.id === 'blades').on, 'blade trap switched on');
  const bz = g.npcs.find(n => n.alive && n.tag === 'trapz' && n.type === 'zombie');
  const hz = g.hazards.find(h => h.id === 'blades').box;
  bz.pos = { x: (hz.x1 + hz.x2) / 2, y: 0, z: (hz.z1 + hz.z2) / 2 };
  run(g, 0.5);
  assert.ok(!bz.alive, 'blade trap kills a zombie');
  g.god = true;
  killAll(g, n => n.tag === 'trapz' || n.tag === 'house');
  tpZone(g, 'roofs', 6.5);
  until(g, () => g.npcs.some(n => n.tag === 'roofz'), 3, {}, 'fast zombies on the roofs');
  fight(g, 30, { untilClear: true, filter: n => n.tag === 'roofz' });
  tpZone(g, 'cemetery', 0);
  until(g, () => g.npcs.some(n => n.tag === 'graveyard'), 3, {}, 'cemetery horde');
  g.player.cur = 'shotgun'; g.player.clip.shotgun = 6; g.player.ammo.buckshot = 30;
  fight(g, 60, { untilClear: true, filter: n => n.tag === 'graveyard' });
  until(g, () => g.doors.find(d => d.id === 'minegate').open, 50, {}, 'mine gate opens');
  g.god = false;
  tpZone(g, 'mine', 0);
  until(g, () => g.pendingMap === 'c07', 3, {}, 'changelevel to c07');
});

test('chapter 7 walkthrough: buggy, checkpoint field, ravine jump, antlion beach, RPG versus gunship', () => {
  const g = newGame('c07');
  run(g, 2);
  const car = g.vehicles[0];
  tp(g, car.pos.x - 2.5, car.pos.z);
  g.enterVehicle(car);
  g.god = true;
  drive(g, [[X(14), X(12) + 1]], 20, { radius: 3 });
  const field = g.doors.find(d => d.id === 'field1');
  run(g, 5, gm => ({ fwd: 1, side: H.clamp(-H.wrapAngle(Math.PI / 2 - car.yaw) * 2, -1, 1) }));
  assert.ok(car.pos.x < field.box.x1, 'forcefield blocks the buggy: ' + car.pos.x.toFixed(1));
  g.exitVehicle(true);
  killAll(g, n => n.tag === 'cp');
  const btn = g.buttons.find(b => b.id === 'fieldbtn');
  tp(g, btn.pos.x - 1.2, btn.pos.z);
  aimAt(g, btn.pos);
  run(g, 0.1, { use: true });
  until(g, () => !field.solid, 5, {}, 'field disabled');
  tp(g, car.pos.x - 2.5, car.pos.z);
  g.enterVehicle(car);
  drive(g, [[X(17), X(12) + 1]], 10, { radius: 3 });
  drive(g, [[X(33), X(12) + 1]], 20, { radius: 3 });
  assert.ok(car.pos.x > E(29), 'buggy jumped the collapsed bridge: ' + car.pos.x.toFixed(1));
  drive(g, [[X(44), X(12) + 1], [X(52), X(13)]], 30, { radius: 4 });
  until(g, () => g.npcs.some(n => n.type === 'antlion'), 12, gm => ({ fwd: 0.3, side: Math.sin(gm.time) }), 'antlions burrow out of the sand');
  drive(g, [[X(60), X(12) + 1], [X(68), X(13)]], 40, { radius: 4 });
  until(g, () => g.npcById('gunship'), 12, {}, 'gunship attacks the base');
  g.exitVehicle(true);
  const crate = g.chargers.find(c => c.type === 'rockets');
  tp(g, crate.pos.x + 1.4, crate.pos.z);
  aimAt(g, crate.pos);
  run(g, 4, { use: true });
  assert.ok(g.player.weapons.rpg && g.player.ammo.rocket >= 2, 'rockets from the ammo crate');
  const gs = g.npcById('gunship');
  g.switchTo('rpg');
  run(g, 0.6);
  for (let shots = 0; shots < 30 && gs.alive && !gs.crashing; shots++) {
    if (g.player.ammo.rocket < 1) { aimAt(g, crate.pos); run(g, 1.5, { use: true }); }
    for (let i = 0; i < 400 && g.projectiles.some(q => q.kind === 'rocket' && q.guided); i++) { aimAt(g, gs); g.step({}); }
    aimAt(g, gs);
    run(g, 0.1, { fire1: true });
    run(g, 0.2);
  }
  until(g, () => g.flags.gunshipDown, 30, gm => { aimAt(gm, gs); return {}; }, 'gunship destroyed');
  tpZone(g, 'exit');
  until(g, () => g.pendingMap === 'c08', 3, {}, 'changelevel to c08');
});

test('chapter 8 walkthrough: sand spawns, thumper safety, antlion guard, bugbait army, outpost', () => {
  const g = newGame('c08');
  run(g, 3);
  tp(g, X(12), X(22));
  until(g, () => g.npcs.some(n => n.alive && n.type === 'antlion' && n.team === 'antlion'), 10, {}, 'antlions spawn from the sand');
  for (const n of g.npcs) if (n.type === 'antlion') g.killNpc(n, {});
  tp(g, X(10) + 3, X(13) + 3);
  const before = g.npcs.length;
  run(g, 6);
  assert.equal(g.npcs.filter(n => n.type === 'antlion' && n.alive).length, 0, 'thumper keeps the swarm away');
  assert.ok(g.npcs.length === before, 'no spawns near the thumper');
  g.god = true;
  tpZone(g, 'arena');
  until(g, () => g.npcById('guard'), 2, {}, 'guard emerges');
  const guard = g.npcById('guard');
  run(g, 1.5);
  const hp0 = guard.hp;
  g.player.cur = 'gravgun';
  for (let k = 0; k < 6 && guard.alive; k++) {
    const barrel = g.props.find(q => !q.dead && q.type === 'barrel_red');
    if (!barrel) break;
    const a = H.yawTo(guard.pos, g.player.pos);
    tp(g, guard.pos.x + Math.sin(a) * 6, guard.pos.z + Math.cos(a) * 6);
    barrel.pos = { x: g.player.pos.x, y: g.player.pos.y + 0.2, z: g.player.pos.z + 1.2 };
    barrel.vel = { x: 0, y: 0, z: 0 }; barrel.sleeping = false;
    g.grab(barrel, 'gravgun');
    aimAt(g, guard);
    run(g, 0.2);
    aimAt(g, guard);
    g.launchHeld(null);
    run(g, 1.2);
  }
  assert.ok(guard.hp < hp0 - 150, 'explosive barrels hurt the guard: ' + guard.hp.toFixed(0));
  if (guard.alive) g.damageNpc(guard, 1000, { type: 'crush', attacker: g.player });
  killAll(g, n => n.type === 'antlion');
  until(g, () => g.scripts.find(s => s.id === 'arena').fired && !g.scripts.find(s => s.id === 'arena').running, 15, {}, 'arena script finishes');
  tpZone(g, 'shack');
  until(g, () => g.player.weapons.bugbait, 10, {}, 'vortigaunt gives bugbait');
  tp(g, X(40), X(15));
  until(g, () => g.npcs.filter(n => n.alive && n.team === 'pet').length >= 3, 20, {}, 'pet antlions answer the bugbait');
  tpZone(g, 'outpostfield');
  tp(g, X(51), X(15));
  run(g, 1);
  const target = g.npcs.find(n => n.alive && n.tag === 'outpost' && n.type === 'soldier');
  g.switchTo('bugbait');
  run(g, 0.5);
  aimAt(g, target);
  g.player.pitch += 0.25;
  run(g, 0.1, { fire1: true });
  until(g, () => g.flags.baitThrown, 3, {}, 'bugbait thrown');
  assert.ok(g.npcs.some(n => n.alive && n.team === 'pet' && n.bait), 'swarm goes to the bait');
  g.switchTo('ar2'); g.player.clip.ar2 = 30; g.player.ammo.ar2 = 60;
  fight(g, 60, { untilClear: true, filter: n => n.tag === 'outpost' && n.type !== 'turret' });
  until(g, () => g.doors.find(d => d.id === 'npgate').open, 10, {}, 'Nova Prospekt gate opens');
  tpZone(g, 'np', 2);
  until(g, () => g.pendingMap === 'c09', 3, {}, 'changelevel to c09');
});

function useButton(g, id, dx = -1.2, dz = 0) {
  const btn = g.buttons.find(b => b.id === id);
  tp(g, btn.pos.x + dx, btn.pos.z + dz);
  aimAt(g, btn.pos);
  run(g, 0.1, { use: true });
  assert.ok(g.flags['btn:' + id], 'button ' + id + ' pressed');
}

function rocketDuel(g, target, crate, maxShots = 40) {
  g.switchTo('rpg');
  run(g, 0.6);
  let refilled = false;
  for (let shots = 0; shots < maxShots && target.alive && !target.crashing; shots++) {
    if (g.player.ammo.rocket < 1) {
      if (!refilled && crate) {
        const p0 = H.vcopy(g.player.pos);
        tp(g, crate.pos.x + 1.4, crate.pos.z);
        aimAt(g, crate.pos);
        run(g, 1.4, { use: true });
        assert.ok(g.player.ammo.rocket >= 1, 'rocket crate refills');
        refilled = true;
        tp(g, p0.x, p0.z);
      } else g.player.ammo.rocket = 3;
    }
    const c = H.AI.chest(target);
    if (!g.world.lineClear(g.eye(), c) || H.dist(target.pos, g.player.pos) > 30) {
      for (let k = 0; k < 16; k++) {
        const a = k * Math.PI / 8;
        const x = target.pos.x + Math.sin(a) * 18, z = target.pos.z + Math.cos(a) * 18;
        const node = g.world.navNode({ x, y: 0, z }, 3);
        if (!node) continue;
        const e = { x: node.x, y: node.y + 1.64, z: node.z };
        if (g.world.lineClear(e, c)) { tp(g, node.x, node.z, node.y); break; }
      }
    }
    for (let i = 0; i < 500 && g.projectiles.some(q => q.kind === 'rocket' && q.guided); i++) { aimAt(g, H.AI.chest(target)); g.step({}); }
    aimAt(g, H.AI.chest(target));
    run(g, 0.1, { fire1: true });
    run(g, 0.2);
  }
  assert.ok(!target.alive || target.crashing, target.type + ' destroyed by rockets');
}

test('chapter 9 walkthrough: prison yard with the swarm, gate, cell block turrets, Alyx', () => {
  const g = newGame('c09');
  run(g, 2);
  tp(g, X(5), X(14));
  until(g, () => g.npcs.filter(n => n.alive && n.team === 'pet').length >= 2, 12, {}, 'pet antlions from the yard sand');
  g.god = true;
  tpZone(g, 'yard');
  until(g, () => g.npcs.some(n => n.tag === 'yard'), 3, {}, 'yard defenders');
  killAll(g, n => n.tag === 'yard' || n.tag === 'yardturret');
  useButton(g, 'gatebtn');
  until(g, () => g.doors.find(d => d.id === 'maingate').t > 0.95, 20, {}, 'main gate opens');
  tpZone(g, 'block', 0);
  run(g, 1);
  const tur = g.npcs.find(n => n.tag === 'blockturret' && n.alive && n.pos.y < 1);
  tp(g, tur.pos.x + 2.5, tur.pos.z);
  g.switchTo('gravgun');
  run(g, 0.6);
  aimAt(g, { x: tur.pos.x, y: tur.pos.y + 0.8, z: tur.pos.z });
  run(g, 0.1, { fire1: true });
  assert.ok(tur.tipped, 'gravity gun punt tips a turret');
  until(g, () => !tur.alive, 4, {}, 'tipped turret dies');
  g.switchTo('ar2'); g.player.clip.ar2 = 30; g.player.ammo.ar2 = 60;
  fight(g, 60, { untilClear: true, filter: n => n.tag === 'block' });
  until(g, () => g.doors.find(d => d.id === 'ctrldoor').open, 10, {}, 'control room opens');
  const bow = g.items.find(i => i.type === 'weapon_crossbow');
  tp(g, bow.pos.x, bow.pos.z);
  run(g, 0.3);
  assert.ok(g.player.weapons.crossbow && g.stats.caches === 1, 'crossbow in the lambda cell');
  tpZone(g, 'ctrl', 0);
  until(g, () => g.pendingMap === 'c10', 15, {}, 'changelevel to c10');
});

test('chapter 10 walkthrough: Alyx hacks, turret defense waves, betrayal, teleport', () => {
  const g = newGame('c10');
  run(g, 3);
  const tur = g.npcs.find(n => n.tag === 'myturret');
  tp(g, tur.pos.x - 2, tur.pos.z);
  g.switchTo('gravgun');
  run(g, 0.6);
  g.grab(tur, 'gravgun', true);
  assert.ok(g.player.held && g.player.held.isNpc, 'friendly turret picked up');
  run(g, 0.5);
  g.dropHeld(true);
  run(g, 1);
  assert.ok(tur.alive && !tur.tipped, 'turret placed upright');
  tpZone(g, 'hall', 0);
  g.god = true;
  until(g, () => g.npcs.some(n => n.tag === 'waves' && n.alive), 40, {}, 'first wave');
  g.switchTo('ar2'); g.player.clip.ar2 = 30; g.player.ammo.ar2 = 60;
  for (let k = 0; k < 3; k++) {
    fight(g, 40, { untilClear: true, filter: n => n.tag === 'waves' });
    run(g, 2);
    if (k < 2) until(g, () => g.npcs.some(n => n.tag === 'waves' && n.alive) || g.doors.find(d => d.id === 'labdoor').open, 20, {}, 'next wave ' + k);
  }
  until(g, () => g.doors.find(d => d.id === 'labdoor').open, 30, {}, 'lab door hacked');
  tpZone(g, 'lab', 0);
  until(g, () => !g.npcById('eli') && !g.npcById('mossman'), 20, {}, 'Mossman takes Eli');
  const pad = g.world.zones.pad;
  tp(g, (pad.x1 + pad.x2) / 2 - 0.8, (pad.z1 + pad.z2) / 2);
  until(g, () => g.pendingMap === 'c11', 20, {}, 'changelevel to c11');
});

test('chapter 11 walkthrough: squad orders, street fight, building, strider, Barney and the RPG', () => {
  const g = newGame('c11');
  run(g, 10);
  assert.ok(!g.npcById('alyx'), 'Alyx leaves for Kleiner');
  const squad = g.npcs.filter(n => n.inSquad && n.alive);
  assert.equal(squad.length, 3, 'three rebels join the squad');
  tp(g, X(12), X(19));
  g.player.yaw = Math.PI / 2; g.player.pitch = -0.2;
  run(g, 0.1, { squad: true });
  assert.ok(squad.every(n => n.hold), 'squad sent to a point');
  run(g, 0.2);
  run(g, 0.1, { squad: true });
  assert.ok(squad.every(n => !n.hold), 'squad recalled');
  g.god = true;
  tpZone(g, 'streetA');
  until(g, () => g.npcs.some(n => n.tag === 'sA'), 3, {}, 'street soldiers');
  fight(g, 60, { untilClear: true, filter: n => n.tag === 'sA' });
  tpZone(g, 'building', 0);
  fight(g, 40, { untilClear: true, filter: n => n.tag === 'bldg' });
  tpZone(g, 'plaza');
  until(g, () => g.npcById('strider'), 3, {}, 'strider appears');
  tpZone(g, 'barney', 0);
  until(g, () => g.scripts.find(s => s.id === 'barney').fired, 3, {}, 'Barney meets');
  const rpg = g.items.find(i => i.type === 'weapon_rpg');
  tp(g, rpg.pos.x, rpg.pos.z);
  run(g, 0.3);
  assert.ok(g.player.weapons.rpg, 'RPG from Barney');
  const crate = g.chargers.find(c => c.type === 'rockets');
  rocketDuel(g, g.npcById('strider'), crate);
  tpZone(g, 'exit');
  until(g, () => g.pendingMap === 'c12', 20, {}, 'changelevel to c12');
});

test('chapter 12 walkthrough: two striders and a gunship with endless rockets', () => {
  const g = newGame('c12');
  g.god = true;
  until(g, () => g.npcs.filter(n => n.tag === 'striders').length === 2, 3, {}, 'striders spawn');
  const crate = g.chargers.find(c => c.type === 'rockets');
  for (const id of ['strider1', 'strider2']) {
    const st = g.npcById(id);
    tp(g, crate.pos.x + 1.4, crate.pos.z);
    rocketDuel(g, st, crate, 60);
  }
  until(g, () => g.npcById('gunship'), 10, {}, 'gunship arrives');
  tp(g, crate.pos.x + 1.4, crate.pos.z);
  rocketDuel(g, g.npcById('gunship'), crate, 40);
  until(g, () => g.doors.find(d => d.id === 'citadelgate').t > 0.95, 40, {}, 'Citadel gate opens');
  tpZone(g, 'exit', 0);
  until(g, () => g.pendingMap === 'c13', 3, {}, 'changelevel to c13');
});

test('chapter 13 walkthrough: confiscation field, supercharged gravity gun, lift', () => {
  const g = newGame('c13', { carry: H.CHAPTERS[11].carry() });
  run(g, 2);
  tpZone(g, 'confiscate', 0);
  run(g, 0.5);
  assert.deepEqual(Object.keys(g.player.weapons), ['gravgun'], 'only the gravity gun survives');
  assert.ok(g.player.superGG, 'gravity gun supercharged');
  tpZone(g, 'hall', 0);
  until(g, () => g.npcs.some(n => n.tag === 'h1' && n.alive), 3, {}, 'citadel soldiers');
  const sol = g.npcs.find(n => n.tag === 'h1' && n.alive && n.type === 'soldier');
  tp(g, sol.pos.x - 5, sol.pos.z);
  aimAt(g, sol);
  until(g, () => g.player.held, 3, gm => { aimAt(gm, sol.alive ? sol : gm.player.pos); return { fire2: true }; }, 'super gravity gun grabs a soldier');
  assert.ok(!sol.alive || !g.npcs.includes(sol), 'grabbed soldier is dead');
  g.player.pitch = 0;
  run(g, 0.1, { fire1: true });
  g.god = true;
  until(g, () => g.props.some(p => p.type === 'combine_ball'), 4, {}, 'energy ball dispensers work');
  for (let k = 0; k < 12 && !g.flags.hallClear; k++) {
    const targets = g.npcs.filter(n => n.alive && (n.tag === 'h1' || n.tag === 'h2'));
    if (!targets.length) { run(g, 2); continue; }
    const t = targets[0];
    const a = H.yawTo(t.pos, g.player.pos);
    tp(g, t.pos.x + Math.sin(a) * 4, t.pos.z + Math.cos(a) * 4, t.def.flying ? undefined : t.pos.y + 0.02);
    aimAt(g, t);
    run(g, 0.6, { fire1: true });
    run(g, 0.6);
  }
  until(g, () => g.flags.hallClear, 30, {}, 'hall cleared');
  tpZone(g, 'liftpad', 0.3);
  until(g, () => g.doors.find(d => d.id === 'lift').t > 0.98, 25, {}, 'lift rises');
  run(g, 0.3);
  assert.ok(g.player.pos.y > 15, 'lift carried the player: ' + g.player.pos.y.toFixed(1));
  tpZone(g, 'top', 16);
  until(g, () => g.pendingMap === 'c14', 3, {}, 'changelevel to c14');
});

test('chapter 14 walkthrough: Breen, energy balls into the reactor, G-Man, credits', () => {
  const g = newGame('c14');
  g.god = true;
  run(g, 2);
  tpZone(g, 'chamber', 0);
  until(g, () => g.props.filter(p => p.type === 'combine_ball').length >= 3, 6, {}, 'dispensers fill');
  const core = g.world.models.find(m => m.kind === 'reactor');
  for (let k = 0; k < 6 && (g.flags.hits || 0) < 3; k++) {
    const ball = g.props.find(p => !p.dead && p.type === 'combine_ball' && !p.held);
    if (!ball) { run(g, 2.5); continue; }
    tp(g, core.x + 6, core.z);
    ball.pos = { x: core.x + 4.8, y: 1.2, z: core.z };
    ball.vel = { x: 0, y: 0, z: 0 };
    g.grab(ball, 'gravgun');
    run(g, 0.3);
    aimAt(g, { x: core.x, y: 4, z: core.z });
    g.launchHeld(null);
    run(g, 1);
  }
  assert.equal(g.flags.hits, 3, 'three energy balls hit the core');
  until(g, () => g.npcById('gman') && g.npcById('gman').alive, 20, {}, 'G-Man appears');
  assert.ok(g.player.frozen, 'player frozen in the void');
  until(g, () => g.flags.credits, 40, {}, 'credits roll');
});

function commentFree(src) {
  let i = 0, q = null;
  const stack = [];
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (q) {
      if (c === '\\') { i += 2; continue; }
      if (q === '`' && c === '$' && n === '{') { stack.push('`'); q = null; i += 2; continue; }
      if (c === q) q = null;
      i++;
      continue;
    }
    if (c === '}' && stack.length && stack[stack.length - 1] === '`') { stack.pop(); q = '`'; i++; continue; }
    if (c === '{') stack.push('{');
    else if (c === '}') stack.pop();
    if (c === '"' || c === "'" || c === '`') { q = c; i++; continue; }
    if (c === '/' && (n === '/' || n === '*')) return i;
    if (c === '/') {
      let k = i - 1;
      while (k >= 0 && /\s/.test(src[k])) k--;
      if (k < 0 || '(,=:[!&|?{};'.includes(src[k]) || /return$/.test(src.slice(Math.max(0, k - 5), k + 1))) {
        let j = i + 1, cls = false;
        while (j < src.length && src[j] !== '\n') {
          if (src[j] === '\\') { j += 2; continue; }
          if (src[j] === '[') cls = true;
          else if (src[j] === ']') cls = false;
          else if (src[j] === '/' && !cls) break;
          j++;
        }
        i = j + 1;
        continue;
      }
    }
    if (c === '<' && src.startsWith('<!--', i)) return i;
    i++;
  }
  return -1;
}

test('desktop wiring: Steam catalog, no preinstall, shell entry points, zero comments', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const f of [...CORE, ...MAPS, 'h2-ui']) assert.ok(html.includes(`js/apps/hl2/${f}.js`), `index.html loads ${f}`);
  assert.ok(html.includes('js/apps/hl2-app.js') && html.includes('css/apps/hl2.css'), 'index.html loads the wrapper and styles');
  const standalone = fs.readFileSync(path.join(ROOT, 'hl2.html'), 'utf8');
  for (const f of [...CORE, ...MAPS, 'h2-ui']) assert.ok(standalone.includes(`js/apps/hl2/${f}.js`), `hl2.html loads ${f}`);
  const gmSrc = fs.readFileSync(path.join(ROOT, 'js', 'game-manager.js'), 'utf8');
  const entry = gmSrc.slice(gmSrc.indexOf('      hl2: {'), gmSrc.indexOf('      hl2: {') + 1400);
  assert.ok(/steam: true/.test(entry) && /price: 49\.99/.test(entry) && /targetExe: 'HL2\.EXE'/.test(entry) && /appHl2/.test(entry), 'catalog entry sold on Steam');
  assert.ok(!/hl2Granted/.test(gmSrc), 'no grant flag');
  const loadState = gmSrc.slice(gmSrc.indexOf('loadState'), gmSrc.indexOf('moveGamesToSteam(state)'));
  assert.ok(!/'hl2'/.test(loadState), 'not in default lists');
  const shell = {
    'js/desktop.js': ["isInstalled('hl2')", 'appHl2'],
    'js/taskbar.js': ["isInstalled('hl2')", "case 'hl2'"],
    'js/apps/dialogs.js': ["cmd === 'hl2'", "showInSteam(\\'hl2\\')"],
    'js/apps/explorer.js': ["item.app === 'hl2'", 'HL2.EXE'],
    'js/filesystem.js': ["gmInstalled.includes('hl2')", "'HL2.EXE'"],
    'js/apps/task-manager.js': ["'app_hl2'", 'hl2.exe'],
    'js/icons.js': ["'hl2': `<svg"],
    'js/apps/hl2-app.js': ["id = 'app_hl2'", 'H.UI(root']
  };
  for (const [f, needles] of Object.entries(shell)) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const n of needles) assert.ok(src.includes(n), `${f} contains ${n}`);
  }
  const i18n = fs.readFileSync(path.join(ROOT, 'js', 'i18n.js'), 'utf8');
  assert.equal((i18n.match(/'app\.hl2': 'Half-Life 2'/g) || []).length, 4, 'i18n title in every language');
  const files = [...fs.readdirSync(DIR).map(f => path.join(DIR, f)), path.join(ROOT, 'js', 'apps', 'hl2-app.js'), path.join(ROOT, 'css', 'apps', 'hl2.css'), path.join(ROOT, 'hl2.html'), __filename];
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const at = f.endsWith('.css') ? src.indexOf('/*') : commentFree(src);
    assert.equal(at, -1, `${path.basename(f)} has a comment at ${at}: ${src.slice(Math.max(0, at - 20), at + 30)}`);
  }
});

test('save and restore round trip keeps player, props, doors and scripts', () => {
  const g = newGame('c01');
  until(g, () => !g.player.frozen && g.time > 2, 25, {}, 'intro');
  tpZone(g, 'plaza');
  g.flags.canDone = true;
  g.doorCmd('gate1', 'open');
  run(g, 3);
  const sv = JSON.parse(JSON.stringify(g.serialize()));
  const g2 = new H.Game({ map: 'c01', save: sv });
  assert.equal(g2.player.pos.x.toFixed(2), g.player.pos.x.toFixed(2));
  assert.equal(g2.flags.canDone, true);
  assert.equal(g2.doors.find(d => d.id === 'gate1').open, true);
  assert.equal(g2.npcs.filter(n => n.alive).length, g.npcs.filter(n => n.alive).length);
  assert.equal(g2.scripts.find(s => s.id === 'intro').fired, true);
  run(g2, 1);
});

console.log(`${passed} tests passed`);
