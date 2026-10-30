const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Office Games 2: Open-space Range engine ---');

const context = { console };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/apps/officegames2/og2-range-engine.js'), 'utf8'), context);

const Engine = context.Og2RangeEngine;

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function target(type, layer, x, y, extra = {}) {
  return { id: Math.floor(Math.random() * 1e9), type, layer, alive: true, fade: 0, age: 0, dir: 1, x, y, vx: 0, vy: 0, baseY: y, phase: 0, r: 16, ...extra };
}

function quiet(engine) {
  engine.spawnTimer = 999;
  engine.entities = [];
  return engine;
}

let engine = quiet(new Engine({ random: seeded(3) }));
assert.equal(engine.ammo, 6);
assert.equal(engine.state, 'playing');
assert.equal(engine.roundTime, 60);

engine.entities.push(target('plane', 0, 300, 100));
let events = engine.shoot(300, 100);
assert.equal(events[0], 'hit');
assert.equal(engine.score, 10, 'near plane is worth ten points');
assert.equal(engine.ammo, 5);
assert.equal(engine.entities[0].alive, false);
assert.equal(engine.lastHit.points, 10);

engine = quiet(new Engine());
engine.entities.push(target('plane', 2, 300, 100));
engine.shoot(300, 100);
assert.equal(engine.score, 30, 'far target pays triple');

engine = quiet(new Engine());
engine.entities.push(target('pigeon', 2, 300, 100));
assert.deepEqual(Array.from(engine.shoot(300 + 12, 100)), ['miss'], 'far targets have a smaller hit area');
assert.equal(engine.streak, 0);
engine.entities.push(target('pigeon', 0, 300, 100));
assert.equal(engine.shoot(300 + 12, 100)[0], 'hit', 'near targets are bigger');

engine = quiet(new Engine());
const far = target('plane', 2, 300, 100, { id: 1 });
const near = target('pigeon', 0, 300, 100, { id: 2 });
engine.entities.push(far, near);
engine.shoot(300, 100);
assert.equal(near.alive, false, 'nearest layer is hit first');
assert.equal(far.alive, true);

engine = quiet(new Engine());
for (let i = 0; i < 3; i++) engine.entities.push(target('plane', 0, 100 + i * 100, 100));
engine.shoot(100, 100);
engine.shoot(200, 100);
engine.shoot(300, 100);
assert.equal(engine.streak, 3);
assert.equal(engine.multiplier, 2, 'three hits in a row raise the multiplier');
assert.equal(engine.score, 10 + 10 + 10);
engine.entities.push(target('plane', 0, 400, 100));
engine.shoot(400, 100);
assert.equal(engine.lastHit.points, 20, 'multiplier applies to the next hit');
engine.shoot(50, 300);
assert.equal(engine.streak, 0, 'a miss resets the streak');
assert.equal(engine.multiplier, 1);
engine.streak = 100;
assert.equal(engine.multiplier, 4, 'multiplier is capped');

engine = quiet(new Engine());
engine.score = 100;
const before = engine.timeLeft;
engine.entities.push(target('boss', 0, 300, 300, { r: 26 }));
events = engine.shoot(300, 300);
assert.equal(events[0], 'bossHit');
assert.equal(engine.score, 50, 'shooting the boss costs fifty points');
assert.equal(engine.timeLeft, before - 3);
assert.equal(engine.hits, 0);
engine.score = 10;
engine.entities.push(target('boss', 0, 300, 300, { r: 26 }));
engine.shoot(300, 300);
assert.equal(engine.score, 0, 'score never drops below zero');

engine = quiet(new Engine());
engine.entities.push(target('clock', 1, 300, 200));
const clockTime = engine.timeLeft;
events = engine.shoot(300, 200);
assert.equal(events[0], 'clock');
assert.equal(engine.timeLeft, clockTime + 4);
assert.equal(engine.score, 60);

engine = quiet(new Engine());
for (let i = 0; i < 6; i++) engine.shoot(5, 5);
assert.equal(engine.ammo, 0);
assert.equal(engine.shoot(5, 5)[0], 'empty', 'empty magazine starts reloading');
assert.ok(engine.reloading > 0);
assert.equal(engine.shoot(5, 5)[0], 'locked', 'cannot shoot while reloading');
events = [];
for (let i = 0; i < 70; i++) events = events.concat(engine.update(0.02));
assert.ok(events.includes('reloaded'));
assert.equal(engine.ammo, 6);
assert.equal(engine.reload(), false, 'full magazine does not reload');
engine.shoot(5, 5);
assert.equal(engine.reload(), true);
assert.equal(engine.reload(), false, 'reload cannot be restarted');

engine = new Engine({ random: seeded(11) });
const seen = new Set();
for (let i = 0; i < 4000; i++) {
  engine.update(0.05);
  engine.entities.forEach(e => seen.add(e.type));
  if (engine.state === 'over') engine.reset();
  assert.ok(engine.entities.length < 40, 'targets are removed after they leave');
}
['plane', 'pigeon', 'clock', 'boss'].forEach(type => assert.ok(seen.has(type), type + ' spawns'));

engine = quiet(new Engine());
engine.spawnTimer = 999;
engine.entities.push(target('plane', 0, 600, 100, { vx: 300, baseY: 100 }));
for (let i = 0; i < 40; i++) engine.update(0.05);
assert.equal(engine.entities.length, 0, 'plane leaving the screen disappears');

engine = quiet(new Engine());
const clock = target('clock', 0, 100, 340, { vy: 0, r: 16 });
engine.entities.push(clock);
let bounced = false;
for (let i = 0; i < 100; i++) {
  engine.update(0.016);
  if (clock.vy < -200) bounced = true;
  assert.ok(clock.y <= Engine.LAYER_FLOOR[0], 'clock stays above the floor');
}
assert.ok(bounced, 'clock bounces');

engine = quiet(new Engine());
engine.shoot(1, 1);
engine.entities.push(target('plane', 0, 300, 100));
engine.shoot(300, 100);
assert.equal(engine.accuracy, 50);

engine = quiet(new Engine());
engine.timeLeft = 0.1;
events = engine.update(0.2);
assert.ok(events.includes('timeUp'));
assert.equal(engine.state, 'over');
assert.equal(engine.shoot(1, 1).length, 0);
assert.equal(engine.update(0.1).length, 0);
engine.reset();
assert.equal(engine.state, 'playing');
assert.equal(engine.score, 0);
assert.equal(engine.ammo, 6);

console.log('Open-space Range engine tests passed');
