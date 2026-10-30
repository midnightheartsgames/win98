const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Office Games 2: Chair Rally engine ---');

const context = { console };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/apps/officegames2/og2-rally-engine.js'), 'utf8'), context);

const Engine = context.Og2RallyEngine;

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function clean(level = 1) {
  const engine = new Engine({ random: seeded(8) });
  engine.startLevel(level);
  engine.objects = [];
  engine.sections = [];
  return engine;
}

function drive(engine, seconds, input) {
  let events = [];
  for (let t = 0; t < seconds; t += 1 / 60) events = events.concat(engine.update(1 / 60, input));
  return events;
}

for (let level = 1; level <= 6; level++) {
  const engine = new Engine({ random: seeded(level * 5 + 2) });
  engine.startLevel(level);
  assert.equal(engine.length, 1200 + level * 250);
  assert.ok(engine.objects.length > 20, 'track has obstacles');
  engine.objects.forEach(o => {
    assert.ok(o.z >= 90 && o.z < engine.length - 50, 'objects keep clear of the start and the finish');
    assert.ok(Math.abs(o.x) < 1.6);
  });
  assert.ok(engine.sections.length > 3);
  engine.sections.forEach(s => {
    assert.ok(Math.abs(s.curve) > 0.3 && Math.abs(s.curve) < 1.5);
    assert.ok(s.start >= 220, 'first bend is far from the start');
  });
  const doubles = engine.objects.filter(o => o.type === 'box');
  doubles.forEach(a => {
    doubles.filter(b => b !== a && b.z === a.z).forEach(b => {
      assert.ok(Math.abs(a.x - b.x) > 1.2 - 0.001 && Math.abs(a.x - b.x) < 1.3, 'paired boxes leave a gap');
    });
  });
}
const harder = new Engine({ random: seeded(3) });
harder.startLevel(6);
const easier = new Engine({ random: seeded(3) });
easier.startLevel(1);
assert.ok(harder.length > easier.length);

let engine = clean();
assert.equal(engine.speed, 0);
drive(engine, 1, { push: true });
assert.ok(engine.speed > 5 && engine.speed < 14, 'pushing speeds the chair up: ' + engine.speed);
drive(engine, 20, { push: true });
assert.ok(engine.speed > 23 && engine.speed <= 30.001, 'speed settles near the limit');
const cruising = engine.speed;
drive(engine, 1, {});
assert.ok(engine.speed < cruising, 'chair slows down without pushing');
drive(engine, 1, { brake: true });
assert.ok(engine.speed < cruising - 20, 'brake slows quickly');
drive(engine, 3, { brake: true });
assert.equal(engine.speed, 0, 'speed never drops below zero');

engine = clean();
drive(engine, 3, { push: true });
const centre = engine.x;
drive(engine, 0.5, { push: true, right: true });
assert.ok(engine.x > centre + 0.2, 'steering right moves the chair right');
drive(engine, 1.5, { push: true, left: true });
assert.ok(engine.x < centre, 'steering left moves it back');
drive(engine, 5, { push: true, right: true });
assert.ok(engine.x <= 1.2 + 0.001, 'walls hold the chair on the road');
assert.ok(engine.speed <= 14, 'scraping the wall limits speed');

engine = clean();
engine.sections = [{ start: 0, end: 400, curve: 1 }];
drive(engine, 8, { push: true });
assert.ok(engine.x < -0.4, 'a right bend throws the chair to the outside, the left: ' + engine.x);
assert.ok(Math.abs(engine.curveAt(200) - 1) < 0.01);
assert.equal(engine.curveAt(500), 0);
assert.ok(engine.curveAt(10) < engine.curveAt(200), 'bends ease in');

engine = clean();
engine.speed = 20;
engine.objects = [{ type: 'box', z: 30, x: 0, sway: 0, phase: 0, w: 0.24, hit: false }];
let events = drive(engine, 2, { push: true });
assert.ok(events.includes('crash'));
assert.ok(engine.speed < 14, 'collision cuts speed');
assert.ok(engine.objects[0].hit);
assert.ok(events.filter(e => e === 'crash').length === 1, 'an object hurts only once');

engine = clean();
engine.speed = 20;
engine.objects = [{ type: 'box', z: 30, x: 0.8, sway: 0, phase: 0, w: 0.24, hit: false }];
events = drive(engine, 2, { push: true });
assert.ok(!events.includes('crash'), 'passing beside an obstacle is safe');

engine = clean();
engine.speed = 20;
engine.objects = [{ type: 'cart', z: 30, x: 0, sway: 0.4, phase: 0, w: 0.3, hit: false }];
assert.ok(engine.objectX(engine.objects[0]) === 0, 'cart starts in the middle');
engine.clock = Math.PI / 2 / 1.3;
assert.ok(Math.abs(engine.objectX(engine.objects[0]) - 0.4) < 0.001, 'cart sways across the corridor');

engine = clean();
engine.speed = 20;
engine.objects = [{ type: 'puddle', z: 30, x: 0, sway: 0, phase: 0, w: 0.4, hit: false }];
events = drive(engine, 1.6, { push: true });
assert.ok(events.includes('puddle'));
assert.ok(engine.slip > 0, 'puddle makes the floor slippery');
engine = clean();
engine.speed = 20;
engine.slip = 1;
const slipX = engine.x;
drive(engine, 0.3, { push: true, right: true });
const slipMove = engine.x - slipX;
const grip = clean();
grip.speed = 20;
drive(grip, 0.3, { push: true, right: true });
assert.ok(grip.x > slipMove, 'wet floor reduces steering');

engine = clean();
engine.speed = 15;
engine.objects = [{ type: 'coffee', z: 20, x: 0, sway: 0, phase: 0, w: 0.22, hit: false }];
const timeBefore = engine.timeLeft;
events = drive(engine, 2, { push: true });
assert.ok(events.includes('coffee'));
assert.equal(engine.coffees, 1);
assert.ok(engine.turbo > 0, 'coffee gives a turbo boost');
drive(engine, 1.5, { push: true });
assert.ok(engine.speed > 30, 'turbo lifts the speed limit');
drive(engine, 8, { push: true });
assert.ok(engine.speed <= 30.5, 'turbo wears off');
assert.ok(engine.timeLeft < timeBefore + 1);

engine = clean();
engine.speed = 30;
const t0 = engine.timeLeft;
events = drive(engine, 20, { push: true });
assert.ok(events.includes('checkpoint'), 'checkpoint after four hundred metres');
assert.ok(engine.timeLeft > t0 - 20 + 10, 'checkpoint adds time');
assert.equal(engine.checkpoints, events.filter(e => e === 'checkpoint').length);

engine = clean();
engine.length = 300;
engine.speed = 30;
events = drive(engine, 20, { push: true });
assert.ok(events.includes('win'));
assert.equal(engine.state, 'won');
assert.ok(engine.score >= 500, 'finishing awards points');
const finished = engine.score;
assert.equal(engine.update(0.1, { push: true }).length, 0);
engine.nextLevel();
assert.equal(engine.level, 2);
assert.equal(engine.score, finished, 'score carries over');
assert.equal(engine.state, 'playing');
assert.equal(engine.z, 0);

engine = clean();
engine.timeLeft = 0.5;
events = drive(engine, 2, {});
assert.ok(events.includes('timeUp'));
assert.equal(engine.state, 'lost');
engine.restart();
assert.equal(engine.level, 1);
assert.equal(engine.score, 0);
assert.equal(engine.state, 'playing');

engine = clean();
const scoreBefore = engine.score;
engine.speed = 25;
drive(engine, 4, { push: true });
assert.ok(engine.score > scoreBefore, 'distance earns points');

console.log('Chair Rally engine tests passed');
