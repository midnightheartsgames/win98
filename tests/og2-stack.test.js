const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Office Games 2: Folder Stack engine ---');

const context = { console };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/apps/officegames2/og2-stack-engine.js'), 'utf8'), context);

const Engine = context.Og2StackEngine;

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function withPiece(type, extra = {}) {
  const engine = new Engine({ random: seeded(3) });
  engine.spawn(type);
  Object.assign(engine.piece, extra);
  return engine;
}

function shape(type, rotation) {
  return Engine.matrixFor(type, rotation).map(row => row.join('')).join('/');
}

for (let type = 0; type < 7; type++) {
  assert.equal(shape(type, 0), shape(type, 4), 'four rotations return to the start for piece ' + type);
  const cells = Engine.matrixFor(type, 1).flat().filter(Boolean).length;
  assert.equal(cells, 4, 'every piece has four cells');
}
assert.equal(shape(0, 1), '0010/0010/0010/0010', 'I piece stands upright after one turn');
assert.equal(shape(1, 1), shape(1, 0), 'O piece does not change');

let engine = new Engine({ random: seeded(1) });
assert.equal(engine.state, 'playing');
assert.equal(engine.board.length, 20);
assert.equal(engine.board[0].length, 10);
assert.equal(engine.upcoming(3).length, 3);
const seen = [];
const bagEngine = new Engine({ random: seeded(9) });
bagEngine.queue = [];
bagEngine.bag = [];
for (let i = 0; i < 14; i++) {
  bagEngine.fillQueue();
  seen.push(bagEngine.queue.shift());
}
assert.deepEqual(Array.from(seen.slice(0, 7)).sort(), [0, 1, 2, 3, 4, 5, 6], 'a bag contains every piece once');
assert.deepEqual(Array.from(seen.slice(7, 14)).sort(), [0, 1, 2, 3, 4, 5, 6]);

engine = withPiece(2);
const startX = engine.piece.x;
assert.equal(engine.move(-1), true);
assert.equal(engine.piece.x, startX - 1);
for (let i = 0; i < 12; i++) engine.move(-1);
assert.equal(engine.piece.x, 0, 'piece stops at the left wall');
assert.equal(engine.move(-1), false);
for (let i = 0; i < 12; i++) engine.move(1);
assert.ok(engine.cellsOf(engine.piece).every(c => c.c < 10), 'piece stops at the right wall');

engine = withPiece(0, { rotation: 1, x: -2, y: 5 });
assert.equal(engine.collides(engine.piece), false);
engine = withPiece(0, { rotation: 0, x: 0, y: 5 });
assert.equal(engine.rotate(1), true, 'rotation near the wall kicks away');
assert.ok(engine.cellsOf(engine.piece).every(c => c.c >= 0 && c.c < 10));

engine = withPiece(1);
const ghost = engine.ghostY();
assert.equal(ghost, 18, 'O piece rests on the floor');
const before = engine.score;
const events = engine.hardDrop();
assert.ok(events.includes('hardDrop'));
assert.ok(events.includes('lock'));
assert.equal(engine.score - before, 36, 'hard drop pays two points per row');
assert.ok(engine.board[19].some(Boolean), 'piece is written to the board');
assert.equal(engine.board[18].filter(Boolean).length, 2);

engine = withPiece(1);
const softBefore = engine.score;
assert.equal(engine.softDrop(), true);
assert.equal(engine.score - softBefore, 1);
assert.equal(engine.piece.y, 1);

engine = withPiece(1);
engine.piece.y = 0;
let clock = 0;
while (engine.piece.y === 0 && clock < 5) {
  engine.update(0.05);
  clock += 0.05;
}
assert.ok(clock >= engine.dropInterval - 0.06 && clock <= engine.dropInterval + 0.1, 'gravity moves the piece after the drop interval');

engine = withPiece(1);
engine.piece.y = engine.ghostY();
assert.equal(engine.grounded, true);
engine.update(0.3);
assert.equal(engine.board[19].some(Boolean), false, 'lock delay keeps the piece alive');
engine.move(-1);
engine.update(0.3);
assert.equal(engine.board[19].some(Boolean), false, 'moving resets the lock delay');
const lockEvents = engine.update(0.3);
assert.ok(lockEvents.includes('lock'), 'piece locks after the delay');

function fillRows(engine, rows, gapColumns) {
  rows.forEach(r => {
    for (let c = 0; c < 10; c++) engine.board[r][c] = gapColumns.includes(c) ? 0 : 3;
  });
}

engine = withPiece(0, { rotation: 1 });
fillRows(engine, [16, 17, 18, 19], [7]);
engine.piece.x = 5;
engine.piece.y = 0;
let clearEvents = engine.hardDrop();
assert.ok(clearEvents.includes('clear'));
assert.equal(engine.lines, 4);
assert.equal(engine.clearInfo.rows.length, 4);
assert.equal(engine.clearInfo.snapshot.length, 20);
assert.ok(engine.score >= 800, 'four rows pay eight hundred times the level');
assert.equal(engine.board.flat().filter(Boolean).length, 0, 'cleared rows disappear');

[[1, 100], [2, 300], [3, 500]].forEach(([count, base]) => {
  const e = withPiece(0, { rotation: 1 });
  const rows = [19, 18, 17].slice(0, count);
  fillRows(e, rows, [7]);
  e.piece.x = 5;
  e.piece.y = 0;
  e.score = 0;
  const distanceScore = (e.ghostY() - e.piece.y) * 2;
  e.hardDrop();
  assert.equal(e.score, base + distanceScore, count + ' rows score ' + base);
});

engine = withPiece(0, { rotation: 1 });
fillRows(engine, [19], [7]);
engine.board[18][0] = 5;
engine.piece.x = 5;
engine.piece.y = 0;
engine.hardDrop();
assert.equal(engine.board[19][0], 5, 'rows above fall down');
assert.equal(engine.board[18][0], 0);

engine = new Engine({ random: seeded(4) });
engine.lines = 9;
engine.spawn(0);
engine.piece.rotation = 1;
fillRows(engine, [19], [7]);
engine.piece.x = 5;
engine.piece.y = 10;
const levelEvents = engine.hardDrop();
assert.ok(levelEvents.includes('levelUp'));
assert.equal(engine.level, 2);
assert.ok(engine.dropInterval < new Engine().dropInterval, 'pieces fall faster on a higher level');

engine = new Engine({ random: seeded(5) });
const firstType = engine.piece.type;
const queued = engine.upcoming(1)[0];
assert.equal(engine.swapHold(), true);
assert.equal(engine.hold, firstType);
assert.equal(engine.piece.type, queued, 'first hold takes the next piece');
assert.equal(engine.swapHold(), false, 'hold works once per piece');
engine.hardDrop();
assert.equal(engine.swapHold(), true);
assert.equal(engine.hold === firstType, false);
engine.hardDrop();
assert.equal(engine.swapHold(), true);

engine = new Engine({ random: seeded(6) });
for (let r = 0; r < 20; r++) for (let c = 0; c < 10; c++) engine.board[r][c] = c === 9 ? 0 : 2;
engine.piece.y = 0;
let overEvents = engine.hardDrop();
assert.ok(engine.state === 'over' || overEvents.includes('over'));
assert.equal(engine.update(1).length, 0);
assert.equal(engine.move(1), false);
assert.equal(engine.hardDrop().length, 0);

engine = new Engine({ random: seeded(7) });
let drops = 0;
while (engine.state === 'playing' && drops < 400) {
  engine.hardDrop();
  drops++;
}
assert.equal(engine.state, 'over', 'stacking without clearing ends the game');
assert.ok(drops > 5);

engine.restart();
assert.equal(engine.state, 'playing');
assert.equal(engine.score, 0);
assert.equal(engine.lines, 0);
assert.equal(engine.hold, null);

console.log('Folder Stack engine tests passed');
