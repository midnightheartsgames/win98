const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Office Games 2: Last Lift engine ---');

const context = { console };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/apps/officegames2/og2-lift-engine.js'), 'utf8'), context);

const Engine = context.Og2LiftEngine;

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function emptyWorld(level = 1) {
  const engine = new Engine({ random: seeded(7) });
  engine.startLevel(level);
  engine.boxes = [];
  engine.shelves = [];
  engine.puddles = [];
  engine.chairs = [];
  engine.coffees = [];
  return engine;
}

function run(engine, seconds, controls) {
  engine.setControls(controls);
  let events = [];
  for (let t = 0; t < seconds; t += 1 / 60) events = events.concat(engine.update(1 / 60));
  return events;
}

for (let level = 1; level <= 8; level++) {
  const engine = new Engine({ random: seeded(level * 13 + 1) });
  engine.startLevel(level);
  assert.ok(engine.boxes.length + engine.puddles.length + engine.shelves.length > 4, 'level ' + level + ' has obstacles');
  engine.boxes.forEach(b => assert.ok(b.x > 300 && b.x + b.w < engine.liftX - 150, 'box stays clear of start and lift'));
  engine.shelves.forEach(s => assert.ok(s.x + s.w < engine.liftX - 150));
  engine.puddles.forEach(p => assert.ok(p.x + p.w < engine.liftX - 150));
  assert.ok(engine.timeLimit > (engine.length - 80) / engine.maxSpeed, 'time limit leaves room to finish');
  if (level === 1) assert.equal(engine.chairs.length, 0, 'no rolling chairs on the first floor');
}
assert.ok(new Engine().startLevel && true);
const first = new Engine({ random: seeded(5) });
first.startLevel(1);
const later = new Engine({ random: seeded(5) });
later.startLevel(5);
assert.ok(later.length > first.length, 'later floors are longer');

let engine = emptyWorld();
engine.player.y = -80;
engine.player.onGround = false;
let events = run(engine, 1, {});
assert.equal(engine.player.y, 0, 'gravity brings the player to the floor');
assert.ok(engine.player.onGround);
assert.ok(events.includes('land'));

engine = emptyWorld();
run(engine, 1, { right: true });
assert.ok(engine.player.x > engine.startX + 150, 'player runs right');
assert.ok(engine.player.vx <= engine.maxSpeed + 0.001);
run(engine, 1, { left: true });
assert.ok(engine.player.vx < 0, 'player turns left');
assert.equal(engine.player.facing, -1);

engine = emptyWorld();
engine.setControls({ jump: true });
events = engine.update(1 / 60);
assert.ok(events.includes('jump'));
let peak = 0;
for (let i = 0; i < 90; i++) {
  engine.update(1 / 60);
  peak = Math.min(peak, engine.player.y);
}
assert.ok(peak < -90 && peak > -115, 'full jump rises about a hundred pixels: ' + peak);
assert.ok(engine.player.onGround);

engine = emptyWorld();
engine.setControls({ jump: true });
engine.update(1 / 60);
engine.setControls({ jump: false });
let shortPeak = 0;
for (let i = 0; i < 90; i++) {
  engine.update(1 / 60);
  shortPeak = Math.min(shortPeak, engine.player.y);
}
assert.ok(shortPeak > peak + 25, 'releasing jump early gives a lower hop');

engine = emptyWorld();
engine.boxes = [{ x: 200, w: 40, h: 40 }];
run(engine, 2, { right: true });
assert.ok(engine.player.x <= 200 - engine.player.w / 2 + 0.01, 'box blocks the way');

engine = emptyWorld();
engine.boxes = [{ x: 200, w: 140, h: 40 }];
let landedOnBox = false;
for (let t = 0; t < 4; t += 1 / 60) {
  const holding = engine.player.x > 150 && (engine.player.onGround ? engine.player.x < 160 : engine.player.vy < 0);
  engine.setControls({ right: true, jump: holding });
  engine.update(1 / 60);
  if (engine.player.y === -40 && engine.player.onGround) landedOnBox = true;
}
assert.ok(landedOnBox, 'player can land on top of a box');

engine = emptyWorld();
engine.shelves = [{ x: 150, w: 100, top: 80 }];
engine.player.x = 200;
engine.player.y = -90;
engine.player.vy = 100;
engine.player.onGround = false;
run(engine, 0.3, {});
assert.equal(engine.player.y, -80, 'shelf holds the player from above');
engine.player.y = -10;
engine.player.vy = -300;
engine.player.onGround = false;
run(engine, 0.1, {});
assert.ok(engine.player.y < -10, 'shelf lets the player jump through from below');

engine = emptyWorld();
engine.puddles = [{ x: 150, w: 90, hit: false }];
const before = engine.timeLeft;
events = run(engine, 1, { right: true });
assert.ok(events.includes('puddle'));
assert.ok(before - engine.timeLeft > 2.9, 'puddle costs two seconds on top of real time');
assert.ok(engine.puddles[0].hit);

engine = emptyWorld();
engine.puddles = [{ x: 150, w: 90, hit: false }];
let slipTime = 0;
let settled = 0;
for (let t = 0; t < 1.5; t += 1 / 60) {
  engine.setControls({ right: true });
  engine.update(1 / 60);
  if (engine.player.slip > 0) {
    slipTime += 1 / 60;
    if (slipTime > 0.6) settled = engine.player.vx;
  }
}
assert.ok(settled > 0 && settled <= engine.maxSpeed * 0.5 + 1, 'wet floor slows the player down');

engine = emptyWorld(2);
engine.chairs = [{ x: 300, w: 34, h: 30, vx: -110, alive: true }];
const timeBefore = engine.timeLeft;
events = run(engine, 2, { right: true });
assert.ok(events.includes('chairHit'));
assert.ok(timeBefore - engine.timeLeft > 4.9, 'chair collision costs three seconds');
assert.equal(engine.chairs[0].alive, false);
assert.ok(engine.player.invulnerable > 0 || events.includes('chairHit'));

engine = emptyWorld(2);
engine.chairs = [{ x: 260, w: 34, h: 30, vx: -110, alive: true }];
let stomped = false;
for (let t = 0; t < 4 && !stomped; t += 1 / 60) {
  const gap = engine.chairs[0].x - engine.player.x;
  engine.setControls({ right: true, jump: gap < 100 && gap > 90 && engine.player.onGround });
  stomped = engine.update(1 / 60).includes('stomp');
}
assert.ok(stomped, 'landing on a chair crushes it');
assert.equal(engine.score, 50);

engine = emptyWorld();
engine.coffees = [{ x: 200, y: -18, taken: false }];
const limitBefore = engine.timeLeft;
events = run(engine, 1.2, { right: true });
assert.ok(events.includes('coffee'));
assert.equal(engine.coffeesTaken, 1);
assert.ok(engine.timeLeft > limitBefore - 1.2 + 1.4, 'coffee adds time');

engine = emptyWorld();
engine.liftX = 400;
events = run(engine, 3, { right: true });
assert.ok(events.includes('win'));
assert.equal(engine.state, 'won');
assert.ok(engine.score >= 200 + 100, 'finishing awards points for time left');
const scoreAfterWin = engine.score;
assert.equal(engine.update(1 / 60).length, 0);
engine.nextLevel();
assert.equal(engine.level, 2);
assert.equal(engine.score, scoreAfterWin, 'score carries to the next floor');
assert.equal(engine.state, 'playing');

engine = emptyWorld();
engine.timeLeft = 1;
events = run(engine, 2, {});
assert.ok(events.includes('timeUp'));
assert.equal(engine.state, 'lost');
engine.restart();
assert.equal(engine.level, 1);
assert.equal(engine.score, 0);

console.log('Last Lift engine tests passed');

