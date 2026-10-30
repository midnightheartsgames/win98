const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Office Games 2: Five in a Line engine ---');

const context = { console };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/apps/officegames2/og2-five-engine.js'), 'utf8'), context);

const Engine = context.Og2FiveEngine;

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function blank(random = () => 0.5) {
  const engine = new Engine({ random });
  engine.board.forEach(row => row.fill(null));
  engine.upcoming = [
    { color: 0, wild: false },
    { color: 1, wild: false },
    { color: 2, wild: false }
  ];
  engine.score = 0;
  engine.state = 'playing';
  return engine;
}

function ball(engine, r, c, color, wild = false) {
  engine.board[r][c] = { color, wild };
}

function count(engine) {
  return engine.board.flat().filter(Boolean).length;
}

let engine = new Engine({ random: seeded(5) });
assert.equal(engine.size, 9);
assert.equal(count(engine), 5, 'game starts with five balls');
assert.equal(engine.upcoming.length, 3);
assert.equal(engine.state, 'playing');

engine = blank();
ball(engine, 4, 0, 3);
let route = engine.findPath({ r: 4, c: 0 }, { r: 4, c: 4 });
assert.equal(route.length, 5, 'shortest path along the row');
assert.deepEqual({ ...route[0] }, { r: 4, c: 0 });
assert.deepEqual({ ...route[4] }, { r: 4, c: 4 });
assert.equal(engine.findPath({ r: 4, c: 0 }, { r: 4, c: 0 }), null, 'cannot move to the same cell');
ball(engine, 0, 0, 1);
assert.equal(engine.findPath({ r: 4, c: 0 }, { r: 0, c: 0 }), null, 'cannot move onto a ball');
assert.equal(engine.findPath({ r: 5, c: 5 }, { r: 6, c: 6 }), null, 'empty cell has nothing to move');

engine = blank();
ball(engine, 0, 0, 3);
for (let c = 0; c < 9; c++) if (c !== 4) ball(engine, 1, c, 0);
ball(engine, 0, 1, 0);
assert.equal(engine.findPath({ r: 0, c: 0 }, { r: 8, c: 8 }), null, 'walled-in ball cannot move');
engine.board[1][8] = null;
engine.board[0][1] = null;
const detour = engine.findPath({ r: 0, c: 0 }, { r: 2, c: 0 });
assert.ok(detour && detour.length > 3, 'path goes around obstacles');
detour.forEach(cell => assert.ok(!engine.board[cell.r][cell.c] || (cell.r === 0 && cell.c === 0)));
assert.ok(engine.reachable({ r: 0, c: 0 }).length > 0);

engine = blank();
ball(engine, 2, 0, 3);
let result = engine.move({ r: 2, c: 0 }, { r: 8, c: 8 });
assert.equal(result.valid, true);
assert.equal(result.phases[0].kind, 'move');
assert.equal(result.phases[1].kind, 'spawn');
assert.equal(result.phases[1].balls.length, 3, 'three balls appear after a quiet move');
assert.equal(count(engine), 4);
assert.equal(engine.turns, 1);
assert.equal(engine.upcoming.length, 3);
assert.equal(engine.board[2][0], null);

engine = blank();
[0, 1, 2, 3].forEach(c => ball(engine, 5, c, 4));
ball(engine, 2, 4, 4);
result = engine.move({ r: 2, c: 4 }, { r: 5, c: 4 });
assert.equal(result.phases[1].kind, 'clear');
assert.equal(result.phases[1].cells.length, 5);
assert.equal(result.phases[1].gain, 50);
assert.equal(engine.score, 50);
assert.equal(count(engine), 0, 'line disappears');
assert.equal(result.phases.length, 2, 'no new balls after a cleared line');

engine = blank();
[0, 1, 2, 3, 4].forEach(c => ball(engine, 5, c, 4));
ball(engine, 2, 5, 4);
result = engine.move({ r: 2, c: 5 }, { r: 5, c: 5 });
assert.equal(result.phases[1].cells.length, 6);
assert.equal(result.phases[1].gain, 80, 'six balls score more than five');

engine = blank();
[1, 2, 3, 4].forEach(i => ball(engine, i, i, 2));
ball(engine, 0, 8, 2);
result = engine.move({ r: 0, c: 8 }, { r: 5, c: 5 });
assert.equal(result.phases[1].kind, 'clear', 'diagonal line counts');
assert.equal(result.phases[1].cells.length, 5);

engine = blank();
[1, 2, 3, 4].forEach(i => ball(engine, i, 8 - i, 2));
ball(engine, 8, 0, 2);
result = engine.move({ r: 8, c: 0 }, { r: 5, c: 3 });
assert.equal(result.phases[1].kind, 'clear', 'anti-diagonal line counts');

engine = blank();
[0, 1, 2].forEach(c => ball(engine, 6, c, 1));
ball(engine, 6, 3, 0, true);
ball(engine, 3, 4, 1);
result = engine.move({ r: 3, c: 4 }, { r: 6, c: 4 });
assert.equal(result.phases[1].kind, 'clear', 'a joker stands in for any colour');
assert.equal(result.phases[1].cells.length, 5);

engine = blank();
[0, 1, 2, 3].forEach(c => ball(engine, 6, c, 1));
ball(engine, 2, 7, 0, true);
result = engine.move({ r: 2, c: 7 }, { r: 6, c: 4 });
assert.equal(result.phases[1].kind, 'clear', 'a moving joker completes a line');

engine = blank();
[0, 1, 2, 3].forEach(c => ball(engine, 6, c, 1));
ball(engine, 2, 7, 5);
result = engine.move({ r: 2, c: 7 }, { r: 6, c: 4 });
assert.equal(result.phases[1].kind, 'spawn', 'different colour does not clear');

engine = blank();
[0, 1, 2, 3].forEach(c => ball(engine, 0, c, 0));
ball(engine, 8, 8, 5);
engine.upcoming = [{ color: 0, wild: false }, { color: 3, wild: false }, { color: 3, wild: false }];
let picks = 0;
engine.random = () => (picks++ === 0 ? 0 : 0.99);
result = engine.move({ r: 8, c: 8 }, { r: 7, c: 7 });
assert.deepEqual(Array.from(result.phases, p => p.kind), ['move', 'spawn', 'clear'], 'a spawned ball can complete a line');
assert.equal(result.phases[2].cells.length, 5);
assert.equal(engine.board[0][4], null);

engine = blank();
for (let r = 0; r < 9; r++) {
  for (let c = 0; c < 9; c++) {
    if (r === 8 && c === 8) continue;
    ball(engine, r, c, (r * 2 + c) % 6);
  }
}
assert.equal(engine.state, 'playing');
result = engine.move({ r: 8, c: 7 }, { r: 8, c: 8 });
assert.equal(result.valid, true);
assert.equal(engine.state, 'over', 'game ends when the board is full');
assert.equal(engine.emptyCells().length, 0);
assert.equal(engine.move({ r: 0, c: 0 }, { r: 0, c: 1 }).valid, false, 'no moves after game over');
const long = new Engine({ random: seeded(21) });
let played = 0;
for (let i = 0; i < 400 && long.state === 'playing'; i++) {
  const balls = [];
  long.board.forEach((row, r) => row.forEach((tile, c) => tile && balls.push({ r, c })));
  const empty = long.emptyCells();
  let done = false;
  for (let a = 0; a < balls.length && !done; a++) {
    for (let b = 0; b < empty.length && !done; b++) {
      if (long.findPath(balls[a], empty[b])) {
        const before = long.score;
        const res = long.move(balls[a], empty[b]);
        assert.ok(res.valid);
        assert.ok(long.score >= before);
        done = true;
        played++;
      }
    }
  }
  if (!done) break;
  assert.ok(count(long) <= 81);
}
assert.ok(played > 10, 'long game plays through');

const fresh = new Engine({ random: seeded(2) });
fresh.score = 500;
fresh.restart();
assert.equal(fresh.score, 0);
assert.equal(fresh.turns, 0);
assert.equal(count(fresh), 5);

console.log('Five in a Line engine tests passed');
