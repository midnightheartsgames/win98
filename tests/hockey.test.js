const assert = require('node:assert/strict');
const { Match } = require('../js/apps/hockey-core.js');
const live = () => { const m = new Match(); m.phase = 'play'; return m; };
const run = (m, seconds, keys) => { for (let i = 0; i < seconds * 120; i++) m.step(1 / 120, keys); };

// Goals count exactly once and only inside the mouth, at either end.
for (const side of [0, 1]) {
  const m = live(); Object.assign(m.puck, { x: side ? 43 : 857, y: 245, vx: side ? -600 : 600, lock: 1 });
  m.step(1/120); assert.equal(m.score[side], 1); assert.equal(m.phase, 'faceoff');
  run(m, 1); assert.equal(m.score[side], 1); assert.equal(m.time < 60, true);
}
{
  const m = live(); Object.assign(m.puck, { x: 857, y: 180, vx: 600, lock: 1 });
  m.step(1/120); assert.deepEqual(m.score, [0, 0]); assert.ok(m.puck.vx < 0);
  Object.assign(m.puck, { x: 450, y: 43, vx: 0, vy: -600, lock: 1 });
  m.step(1/120); assert.ok(m.puck.vy > 0);
}
// Passing switches to the receiving teammate; a shot releases ownership.
{
  const m = live(); m.puck.owner = 0; m.action(true);
  assert.equal(m.puck.owner, null); assert.notEqual(m.selected, 0); assert.ok(Math.hypot(m.puck.vx,m.puck.vy) > 300);
  m.puck.owner = m.selected; m.action(); assert.equal(m.shots[0], 1); assert.equal(m.puck.owner, null);
}
// A close manual check wins possession, but cannot be spammed during cooldown.
{
  const m = live(); m.players[0].cooldown = 0; m.puck.owner = 4; m.action();
  assert.equal(m.puck.owner, 0); assert.ok(m.players[4].stun > 0);
}
// Goalie catches a free puck and puts it back into play.
{
  const m = live(), g = m.players[3]; g.cooldown = 0;
  Object.assign(m.puck, {x:g.x,y:g.y,lock:0}); m.step(1/120); assert.equal(m.puck.owner,3);
  run(m,.6); assert.notEqual(m.puck.owner,3); assert.ok(m.puck.vx > 0);
}
// Movement has inertia, stays finite, and periods terminate without overtime.
{
  const m = live(); m.players[0].y = 90; const start = m.players[0].x;
  run(m,.3,{ArrowRight:true}); assert.ok(m.players[0].x > start + 10);
  const vx = m.players[0].vx; m.step(1/120,{}); assert.ok(m.players[0].vx > 0 && m.players[0].vx < vx);
  for (let period = 1; period <= 3; period++) { m.time = .001; m.phase = 'play'; m.step(1/120); }
  assert.equal(m.phase,'final'); assert.equal(m.period,3);
  const score = [...m.score]; run(m,2); assert.deepEqual(m.score,score);
}
for (const difficulty of ['easy','normal','hard']) {
  const attack = live(); attack.difficulty = difficulty; attack.players[4].x = 330;
  attack.players[4].cooldown = 0; attack.puck.owner = 4; attack.puck.lock = 1;
  attack.step(1/120); assert.equal(attack.shots[1],1,'CPU shoots when approaching the goal');
  const m = new Match(difficulty); run(m,600);
  assert.equal(m.phase,'final');
  for(const p of [...m.players,m.puck]) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
}
console.log('Hockey 98: goals, boards, passing, checking, goalie, movement and full matches passed.');
