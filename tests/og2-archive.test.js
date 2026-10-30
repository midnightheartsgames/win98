const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Office Games 2: Archive Smash engine ---');

const context = { console };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/apps/officegames2/og2-archive-engine.js'), 'utf8'), context);

const Engine = context.Og2ArchiveEngine;

function engineWith(random = () => 0.9) {
  return new Engine({ random });
}

function freeBall(engine, x, y, dx, dy) {
  engine.balls = [{ x, y, dx, dy, stuck: false }];
}

let engine = engineWith();
assert.equal(engine.lives, 3);
assert.equal(engine.level, 1);
assert.equal(engine.bricks.length, 40);
assert.ok(engine.hasStuckBall, 'ball waits on the paddle');
engine.setPaddleX(0);
assert.equal(engine.paddle.x, engine.paddle.w / 2, 'paddle is clamped to the left wall');
engine.setPaddleX(9999);
assert.equal(engine.paddle.x, engine.width - engine.paddle.w / 2, 'paddle is clamped to the right wall');
engine.setPaddleX(200);
assert.equal(engine.balls[0].x, 200, 'stuck ball follows the paddle');
assert.equal(engine.launch(), true);
assert.ok(!engine.hasStuckBall);
assert.ok(engine.balls[0].dy < 0, 'ball flies upwards');

engine = engineWith();
engine.bricks = [];
engine.bricks.push({ x: 10, y: 300, row: 0, hp: 1, maxHp: 1, alive: true });
engine.bricks.push({ x: 400, y: 100, row: 0, hp: 1, maxHp: 1, alive: true });
freeBall(engine, 3, 200, -1, 0);
let events = engine.update(0.02);
assert.ok(events.includes('wall'));
assert.ok(engine.balls[0].dx > 0, 'left wall reflects the ball');
freeBall(engine, 200, 3, 0, -1);
engine.update(0.02);
assert.ok(engine.balls[0].dy > 0, 'ceiling reflects the ball');

engine = engineWith();
engine.bricks = [
  { x: 100, y: 100, row: 1, hp: 1, maxHp: 1, alive: true },
  { x: 300, y: 60, row: 0, hp: 1, maxHp: 1, alive: true }
];
freeBall(engine, 122, 130, 0, -1);
let broke = false;
for (let i = 0; i < 20 && !broke; i++) broke = engine.update(0.016).includes('break');
assert.ok(broke, 'ball breaks a folder');
assert.equal(engine.bricks[0].alive, false);
assert.ok(engine.balls[0].dy > 0, 'ball bounces back down from the bottom of a folder');
assert.equal(engine.score, 10, 'one folder on level 1 is worth ten points');
assert.equal(engine.lastBroken, engine.bricks[0]);

engine = engineWith();
engine.bricks = [
  { x: 100, y: 100, row: 0, hp: 2, maxHp: 2, alive: true },
  { x: 300, y: 60, row: 0, hp: 1, maxHp: 1, alive: true }
];
freeBall(engine, 122, 130, 0, -1);
let rounds = 0;
let hitEvents = [];
while (engine.bricks[0].hp === 2 && rounds++ < 30) hitEvents = hitEvents.concat(engine.update(0.016));
assert.ok(hitEvents.includes('brick'));
assert.equal(engine.bricks[0].alive, true, 'reinforced folder survives the first hit');
assert.equal(engine.bricks[0].hp, 1);

engine = engineWith();
engine.bricks = [{ x: 300, y: 60, row: 0, hp: 1, maxHp: 1, alive: true }];
engine.paddle.x = 240;
freeBall(engine, 240, engine.paddle.y - 8, 0, 1);
engine.update(0.016);
assert.ok(engine.balls[0].dy < 0, 'paddle reflects the ball');
assert.ok(Math.abs(engine.balls[0].dx) < 0.05, 'centre hit goes straight up');
engine.paddle.x = 240;
freeBall(engine, 240 + 30, engine.paddle.y - 8, 0, 1);
engine.update(0.016);
assert.ok(engine.balls[0].dx > 0.3, 'hit on the right edge sends the ball right');

engine = engineWith();
engine.bricks = [{ x: 300, y: 60, row: 0, hp: 1, maxHp: 1, alive: true }];
engine.paddle.x = 40;
freeBall(engine, 400, engine.height - 4, 0, 1);
events = [];
for (let i = 0; i < 10; i++) events = events.concat(engine.update(0.02));
assert.ok(events.includes('lifeLost'));
assert.equal(engine.lives, 2);
assert.ok(engine.hasStuckBall, 'a new ball is attached after losing one');
engine.lives = 1;
freeBall(engine, 400, engine.height - 4, 0, 1);
events = [];
for (let i = 0; i < 10; i++) events = events.concat(engine.update(0.02));
assert.ok(events.includes('gameOver'));
assert.equal(engine.state, 'over');
assert.equal(engine.update(0.02).length, 0);

engine = engineWith();
engine.bricks = [{ x: 100, y: 100, row: 0, hp: 1, maxHp: 1, alive: true }];
freeBall(engine, 122, 130, 0, -1);
events = [];
for (let i = 0; i < 20; i++) events = events.concat(engine.update(0.016));
assert.ok(events.includes('levelClear'));
assert.equal(engine.state, 'cleared');
assert.equal(engine.score, 10 + 100);
engine.nextLevel();
assert.equal(engine.level, 2);
assert.equal(engine.state, 'playing');
assert.ok(engine.bricks.length > 0);
assert.ok(engine.speed > new Engine().speed, 'ball is faster on the next level');

engine = engineWith();
engine.bonuses = [{ x: engine.paddle.x, y: engine.paddle.y - 5, type: 'wide' }];
freeBall(engine, 50, 200, 0, -1);
engine.bricks = [{ x: 300, y: 60, row: 0, hp: 1, maxHp: 1, alive: true }];
events = engine.update(0.016);
assert.ok(events.includes('bonus'));
assert.equal(engine.paddle.w, engine.wideWidth);
assert.ok(engine.wideTimer > 13);
for (let i = 0; i < 60; i++) {
  engine.balls = [{ x: 50, y: 200, dx: 0, dy: -1, stuck: false }];
  engine.update(0.25);
}
assert.equal(engine.paddle.w, engine.baseWidth, 'wide paddle expires');

engine = engineWith();
freeBall(engine, 200, 250, 0, -1);
engine.bonuses = [{ x: engine.paddle.x, y: engine.paddle.y, type: 'multi' }];
engine.update(0.016);
assert.equal(engine.balls.length, 3, 'multi bonus adds two balls');

engine = engineWith();
engine.bonuses = [{ x: engine.paddle.x, y: engine.paddle.y, type: 'life' }];
engine.update(0.016);
assert.equal(engine.lives, 4);

engine = engineWith();
freeBall(engine, 200, 250, 0, -1);
const normal = engine.speed;
engine.bonuses = [{ x: engine.paddle.x, y: engine.paddle.y, type: 'slow' }];
engine.update(0.016);
assert.ok(engine.speed < normal, 'slow bonus lowers the ball speed');

const droppy = new Engine({ random: () => 0.01 });
droppy.bricks = [
  { x: 100, y: 100, row: 0, hp: 1, maxHp: 1, alive: true },
  { x: 300, y: 60, row: 0, hp: 1, maxHp: 1, alive: true }
];
freeBall(droppy, 122, 130, 0, -1);
for (let i = 0; i < 20 && !droppy.bonuses.length; i++) droppy.update(0.016);
assert.equal(droppy.bonuses.length, 1, 'a broken folder can drop a bonus');

const clean = new Engine();
const fast = clean.speed;
clean.hits = 100;
assert.ok(clean.speed > fast);
clean.hits = 100000;
assert.ok(clean.speed <= 470);

Engine.LAYOUTS.forEach((rows, i) => {
  rows.forEach(row => assert.equal(row.length, 10, 'layout ' + i + ' has ten columns'));
});

console.log('Archive Smash engine tests passed');
