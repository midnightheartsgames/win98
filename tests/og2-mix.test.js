const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Office Games 2: Stationery Mix engine ---');

const context = { console };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/apps/officegames2/og2-mix-engine.js'), 'utf8'), context);

const Engine = context.Og2MixEngine;

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function patterned(seed = 1) {
  const engine = new Engine({ random: seeded(seed) });
  engine.board = [];
  for (let r = 0; r < engine.size; r++) {
    engine.board.push([]);
    for (let c = 0; c < engine.size; c++) engine.board[r].push({ type: (r * 2 + c) % 6, special: null });
  }
  engine.moves = 25;
  engine.score = 0;
  engine.target = 100000;
  engine.state = 'playing';
  assert.equal(engine.findGroups(engine.board).length, 0, 'pattern has no runs');
  return engine;
}

function put(engine, cells, type) {
  cells.forEach(([r, c]) => { engine.board[r][c] = { type, special: null }; });
}

for (let seed = 1; seed <= 40; seed++) {
  const engine = new Engine({ random: seeded(seed) });
  assert.equal(engine.findGroups(engine.board).length, 0, 'fresh board has no runs');
  assert.ok(engine.findMove(), 'fresh board has a move');
  engine.board.forEach(row => row.forEach(tile => {
    assert.ok(tile.type >= 0 && tile.type < 6);
    assert.equal(tile.special, null);
  }));
}

let engine = patterned();
const snapshot = JSON.stringify(engine.board);
let result = engine.trySwap(0, 0, 0, 1);
assert.equal(result.valid, false, 'swap without a match is rejected');
assert.equal(JSON.stringify(engine.board), snapshot, 'rejected swap restores the board');
assert.equal(engine.moves, 25, 'rejected swap costs nothing');
assert.equal(engine.trySwap(0, 0, 1, 1).valid, false, 'diagonal swap is rejected');
assert.equal(engine.trySwap(0, 0, 0, 3).valid, false, 'distant swap is rejected');

engine = patterned();
put(engine, [[0, 0], [0, 1], [1, 2]], 5);
result = engine.trySwap(0, 2, 1, 2);
assert.equal(result.valid, true);
assert.equal(engine.moves, 24);
let first = result.phases[0];
assert.equal(first.cleared.length, 3);
assert.equal(first.created.length, 0);
assert.equal(first.gain, 30);
assert.ok(engine.score >= 30);
assert.equal(first.cascade, 1);
engine.board.forEach(row => row.forEach(tile => assert.ok(tile && tile.type >= 0)));

engine = patterned();
put(engine, [[0, 0], [0, 1], [0, 3], [1, 2]], 5);
result = engine.trySwap(0, 2, 1, 2);
first = result.phases[0];
assert.equal(first.created.length, 1);
assert.equal(first.created[0].special, 'row', 'four in a row makes a row clearer');
assert.equal(first.created[0].r, 0);
assert.equal(first.created[0].c, 2, 'special appears where the player swapped');
assert.equal(first.cleared.length, 3);

engine = patterned();
put(engine, [[0, 5]], 2);
put(engine, [[0, 0], [0, 1], [0, 3], [0, 4], [1, 2]], 5);
result = engine.trySwap(0, 2, 1, 2);
first = result.phases[0];
assert.equal(first.created[0].special, 'color', 'five in a row makes a colour bomb');
assert.equal(first.cleared.length, 4);

engine = patterned();
put(engine, [[0, 0], [0, 1], [0, 3], [1, 2], [2, 2]], 5);
result = engine.trySwap(0, 2, 0, 3);
first = result.phases[0];
assert.equal(first.created.length, 1);
assert.equal(first.created[0].special, 'blast', 'L shape makes a blast');
assert.equal(first.cleared.length, 4);

engine = patterned();
put(engine, [[0, 0], [0, 1], [1, 2]], 5);
engine.board[0][1].special = 'row';
result = engine.trySwap(0, 2, 1, 2);
first = result.phases[0];
assert.equal(first.activated, 1);
assert.ok(first.cleared.length >= 8, 'row special clears the whole row');
assert.ok(first.cleared.filter(cell => cell.r === 0).length === 8);

engine = patterned();
put(engine, [[0, 0], [0, 1], [1, 2]], 5);
engine.board[0][0].special = 'col';
result = engine.trySwap(0, 2, 1, 2);
first = result.phases[0];
assert.ok(first.cleared.filter(cell => cell.c === 0).length === 8, 'column special clears the whole column');

engine = patterned();
put(engine, [[0, 0], [0, 1], [1, 2]], 5);
engine.board[4][4].special = 'blast';
engine.board[4][4].type = 5;
engine.board[0][1].special = 'blast';
result = engine.trySwap(0, 2, 1, 2);
first = result.phases[0];
assert.ok(first.cleared.length >= 3 + 3, 'blast special clears neighbours');

engine = patterned();
engine.board[3][3] = { type: 1, special: 'color' };
const victim = engine.board[3][4].type;
const expected = engine.board.flat().filter(t => t.type === victim).length + 1;
result = engine.trySwap(3, 3, 3, 4);
assert.equal(result.valid, true);
assert.equal(result.bombSwap, true);
assert.equal(result.phases[0].cleared.length, expected, 'colour bomb removes every tile of the swapped colour');
assert.ok(result.phases[0].cleared.every(cell => cell.type === victim || cell.special === 'color'));

engine = patterned(4);
put(engine, [[7, 0], [7, 1], [6, 2]], 5);
result = engine.trySwap(7, 2, 6, 2);
result.phases.forEach(phase => {
  if (phase.shuffle) return;
  phase.falls.forEach(f => assert.ok(f.toR > f.fromR, 'tiles fall downwards'));
  phase.spawns.forEach(s => assert.ok(s.fromR < 0 || s.fromR < s.toR));
  phase.board.forEach(row => row.forEach(tile => assert.ok(tile)));
});
assert.equal(engine.findGroups(engine.board).length, 0, 'board is settled after resolving');
assert.ok(engine.findMove(), 'a move is always available afterwards');
const lastPhase = result.phases[result.phases.length - 1];
assert.equal(JSON.stringify(lastPhase.board), JSON.stringify(engine.board), 'last phase matches the engine board');

engine = patterned();
put(engine, [[0, 0], [0, 1], [1, 2]], 5);
engine.target = 10;
engine.moves = 10;
engine.trySwap(0, 2, 1, 2);
assert.equal(engine.state, 'levelClear');
assert.equal(engine.levelBonus, 9 * 50, 'unused moves become bonus points');
assert.equal(engine.trySwap(0, 0, 0, 1).valid, false, 'no moves after the level is cleared');
const scoreBefore = engine.score;
engine.nextLevel();
assert.equal(engine.level, 2);
assert.equal(engine.state, 'playing');
assert.equal(engine.moves, 25);
assert.equal(engine.score, scoreBefore, 'score carries over');
assert.ok(engine.target > 800);

engine = patterned();
put(engine, [[0, 0], [0, 1], [1, 2]], 5);
engine.moves = 1;
engine.target = 100000;
engine.trySwap(0, 2, 1, 2);
assert.equal(engine.state, 'over', 'running out of moves ends the game');
engine.restart();
assert.equal(engine.score, 0);
assert.equal(engine.level, 1);
assert.equal(engine.state, 'playing');

engine = patterned();
const reshuffled = engine.shuffleBoard();
assert.equal(reshuffled.shuffle, true);
assert.equal(engine.findGroups(engine.board).length, 0);
assert.ok(engine.findMove());
assert.equal(engine.board.flat().length, 64);

const hintEngine = new Engine({ random: seeded(9) });
const move = hintEngine.findMove();
const probe = hintEngine.trySwap(move.r1, move.c1, move.r2, move.c2);
assert.equal(probe.valid, true, 'hint always leads to a legal swap');

let cascades = 0;
for (let seed = 1; seed <= 30; seed++) {
  const run = new Engine({ random: seeded(seed * 3) });
  run.target = 1e9;
  run.moves = 200;
  for (let i = 0; i < 60 && run.state === 'playing'; i++) {
    const m = run.findMove();
    assert.ok(m, 'always a move');
    const r = run.trySwap(m.r1, m.c1, m.r2, m.c2);
    assert.ok(r.valid);
    cascades += r.phases.filter(p => p.cascade > 1).length;
    assert.equal(run.findGroups(run.board).length, 0);
    run.board.forEach(row => row.forEach(tile => assert.ok(tile)));
  }
}
assert.ok(cascades > 0, 'cascades happen during play');

console.log('Stationery Mix engine tests passed');
