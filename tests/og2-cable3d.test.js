const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Office Games 2: core and Patch Cord 3D engine ---');

const store = new Map();
const dialogs = [];
const context = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v))
  },
  console
};
context.window = context;
context.winManager = { openDialog: (opts) => dialogs.push(opts), windows: new Map() };
vm.createContext(context);

['og2-core.js', 'og2-cable3d-engine.js'].forEach(file => {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/apps/officegames2', file), 'utf8'), context);
});

const { Og2, Og2CableEngine } = context;

assert.equal(Og2.games.length, 8, 'disc lists eight games');
assert.equal(new Set(Og2.games.map(g => g.id)).size, 8, 'game ids are unique');
assert.equal(new Set(Og2.games.map(g => g.appId)).size, 8, 'app ids are unique');
assert.ok(Og2.isOg2App('og2_cable3d'));
assert.ok(!Og2.isOg2App('og_snake3d'));

Og2.openApp('og2_stack');
assert.equal(dialogs.length, 1, 'game whose module is not loaded shows a dialog');

assert.equal(Og2.bestScore('cable3d'), 0);
assert.equal(Og2.submitScore('cable3d', 120), true);
assert.equal(Og2.submitScore('cable3d', 80), false);
assert.equal(Og2.bestScore('cable3d'), 120);
assert.equal(store.get('office_games2_best_cable3d'), '120');

function sequence(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

const engine = new Og2CableEngine({ random: sequence([0.1, 0.5, 0.9, 0.3, 0.7]) });
assert.equal(engine.snake.length, 3);
assert.equal(engine.dir, 0);
assert.equal(engine.obstacles.length, 4);
assert.ok(engine.letter, 'a letter is on the floor');
engine.obstacles.forEach(cell => {
  const head = engine.snake[0];
  assert.ok(Math.abs(cell.x - head.x) + Math.abs(cell.z - head.z) >= 5, 'partitions keep their distance from the head');
});

const clear = new Og2CableEngine({ random: sequence([0.5]) });
clear.obstacles = [];
clear.letter = { x: 0, z: 0 };
const startHead = { ...clear.snake[0] };
let result = clear.step();
assert.equal(result.kind, 'move');
assert.deepEqual({ ...clear.snake[0] }, { x: startHead.x, z: startHead.z + 1 }, 'moves forward along +z');
assert.equal(clear.snake.length, 3);

clear.turn('right');
result = clear.step();
assert.equal(result.turned, 1);
assert.equal(clear.dir, 1);
assert.equal(clear.snake[0].x, startHead.x + 1, 'right turn heads along +x');
clear.turn('left');
clear.step();
assert.equal(clear.dir, 0, 'left turn returns to +z');

const feeder = new Og2CableEngine({ random: sequence([0.5]) });
feeder.obstacles = [];
const headBefore = { ...feeder.snake[0] };
feeder.letter = { x: headBefore.x, z: headBefore.z + 1 };
result = feeder.step();
assert.equal(result.kind, 'letter');
assert.equal(feeder.snake.length, 4, 'eating a letter grows the cable');
assert.equal(feeder.score, 10);
assert.equal(feeder.letters, 1);
assert.ok(feeder.letter, 'next letter is spawned');
assert.equal(feeder.prevSnake.length, 3, 'previous snapshot keeps the old length');

const coffee = new Og2CableEngine({ random: sequence([0.5]) });
coffee.obstacles = [];
const coffeeHead = coffee.snake[0];
coffee.letter = { x: 0, z: 0 };
coffee.coffee = { x: coffeeHead.x, z: coffeeHead.z + 1, ttl: 10 };
const normalTick = coffee.tickMs;
result = coffee.step();
assert.equal(result.kind, 'coffee');
assert.equal(coffee.score, 50);
assert.ok(coffee.tickMs > normalTick, 'coffee slows the game down');

const wall = new Og2CableEngine({ random: sequence([0.5]) });
wall.obstacles = [];
wall.letter = { x: 0, z: 0 };
let guard = 0;
while (wall.alive && guard++ < 50) wall.step();
assert.equal(wall.alive, false);
assert.equal(wall.lastCause, 'wall');
assert.equal(wall.step().kind, 'dead');

const partition = new Og2CableEngine({ random: sequence([0.5]) });
partition.obstacles = [{ x: partition.snake[0].x, z: partition.snake[0].z + 1 }];
partition.letter = { x: 0, z: 0 };
assert.equal(partition.step().kind, 'crash');
assert.equal(partition.lastCause, 'partition');

const tangle = new Og2CableEngine({ random: sequence([0.5]) });
tangle.obstacles = [];
tangle.letter = { x: 0, z: 0 };
tangle.snake = [
  { x: 5, z: 5 }, { x: 5, z: 4 }, { x: 6, z: 4 }, { x: 6, z: 5 }, { x: 6, z: 6 }, { x: 5, z: 6 }
];
tangle.dir = 0;
tangle.turn('right');
result = tangle.step();
assert.equal(result.kind, 'crash');
assert.equal(tangle.lastCause, 'self');

const chase = new Og2CableEngine({ random: sequence([0.5]) });
chase.obstacles = [];
chase.letter = { x: 0, z: 0 };
chase.snake = [{ x: 5, z: 5 }, { x: 4, z: 5 }, { x: 4, z: 6 }, { x: 5, z: 6 }];
chase.dir = 0;
assert.equal(chase.step().kind, 'move', 'moving into the vacated tail cell is allowed');

const queue = new Og2CableEngine();
assert.equal(queue.turn('left'), true);
assert.equal(queue.turn('right'), true);
assert.equal(queue.turn('left'), false, 'turn queue holds two commands');

const levels = new Og2CableEngine();
const slowest = levels.tickMs;
levels.letters = 25;
assert.equal(levels.level, 6);
assert.ok(levels.tickMs < slowest, 'speed rises with the level');
levels.letters = 4000;
assert.ok(levels.tickMs >= 95, 'speed has a floor');

const disc = fs.readFileSync(path.join(__dirname, '../js/filesystem.js'), 'utf8');
assert.ok(disc.includes("'office_games_2'"), 'filesystem knows the disc');

console.log('Office Games 2 core and Patch Cord 3D engine tests passed');
