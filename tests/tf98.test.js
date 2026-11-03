const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/tf98');
const SIM = ['tf-core', 'tf-data', 'tf-weapons', 'tf-build', 'tf-world', 'tf-nav', 'tf-maps-yard', 'tf-maps-arena', 'tf-maps-2fort', 'tf-game', 'tf-modes', 'tf-ai'];
for (const f of SIM) require(path.join(DIR, f + '.js'));
const T = globalThis.Tf98;
const R = T.RULES;

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const near = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, m + ': got ' + a + ', want ' + b + ' ±' + tol);
const VERBOSE = process.argv.includes('-v');
const log = (...a) => { if (VERBOSE) console.log(...a); };
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const MODULES = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/tf98/' + f);
const LOAD_ORDER = ['tf-core', 'tf-data', 'tf-weapons', 'tf-build', 'tf-world', 'tf-nav', 'tf-maps-yard', 'tf-maps-arena', 'tf-maps-2fort', 'tf-game', 'tf-modes', 'tf-ai', 'tf-audio', 'tf-render', 'tf-ui'].map(f => 'js/apps/tf98/' + f + '.js');
const OWN_FILES = [...MODULES, 'js/apps/tf98-app.js', 'css/apps/tf98.css', 'tf98.html', 'tools/tf98-shots.cjs', 'tools/tf98-bot.cjs', 'tests/tf98.test.js'];
const SHOWN_FILES = [...MODULES, 'js/apps/tf98-app.js', 'css/apps/tf98.css', 'tf98.html'];
const SOURCE_NAMES = /\b(Scout|Soldier|Pyro|Demoman|Heavy|Engineer|Medic|Sniper|Spy|Sandvich|Mann Co|Saxton|Redmond|Blutarch|Gray Mann|Eyelander|Targe|Bootlegger)\b/;

{
  ok(MODULES.length === LOAD_ORDER.length, 'every module is in the load order');
  for (const f of LOAD_ORDER) ok(fs.existsSync(path.join(ROOT, f)), 'module exists: ' + f);
  const scriptsIn = html => [...html.matchAll(/<script src="(js\/apps\/tf98\/[^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(scriptsIn(read('tf98.html')), LOAD_ORDER, 'tf98.html loads modules in order');
  checks++;
  const index = read('index.html');
  assert.deepEqual(scriptsIn(index), LOAD_ORDER, 'index.html loads modules in order');
  checks++;
  ok(index.indexOf('js/apps/tf98/tf-ui.js') < index.indexOf('js/apps/tf98-app.js'), 'the window wrapper loads after the game');
  ok(index.includes('href="css/apps/tf98.css"'), 'index.html links the stylesheet');
  ok(/\r\n/.test(index) && !/[^\r]\n/.test(index), 'index.html keeps CRLF');
  ok(!/\r/.test(read('tf98.html')), 'tf98.html stays LF');
}

{
  for (const f of OWN_FILES) {
    const src = read(f);
    ok(!/\/\*/.test(src), 'no block comments in ' + f);
    ok(!/^\s*\/\/(?!\s*#)/m.test(src) && !/[;{})]\s+\/\/\s/.test(src), 'no line comments in ' + f);
    ok(!/<!-{2}/.test(src), 'no markup comments in ' + f);
    ok(!/Micro[s]oft/.test(src.replace(/\/Micro[s]oft\/Edge\//g, '')), 'names follow the Microslop rule in ' + f);
    ok(!/Win[d]ows/.test(src), 'names follow the Win rule in ' + f);
  }
  for (const f of SHOWN_FILES) {
    const m = read(f).match(SOURCE_NAMES);
    ok(!m, 'no source names in ' + f + (m ? ': ' + m[0] : ''));
  }
  const code = MODULES.concat('js/apps/tf98-app.js').map(read).join('\n');
  ok(!/['"]F(9|10)['"]|keyCode\s*===?\s*12[01]/.test(code), 'the game does not take F9 and F10 from the bug reports');
  ok(!/Math\.random|Date\.now|new Date/.test(SIM.map(f => read('js/apps/tf98/' + f + '.js')).join('\n')), 'the simulation has no hidden randomness or clock');
}

{
  const manager = read('js/game-manager.js');
  ok(!/tf98Granted/.test(manager), 'no code grants the game');
  ok(!/purchased[^\n]*tf98|downloaded[^\n]*tf98|installed[^\n]*tf98/.test(manager), 'the game is not in the default lists');
}

{
  ok(T.hu(100) === 100 * 0.01905, 'one unit is 0.01905 m');
  const a = T.rng(7), b = T.rng(7), c = T.rng(8);
  const seqA = [a(), a(), a()], seqB = [b(), b(), b()];
  assert.deepEqual(seqA, seqB, 'one seed gives one sequence');
  checks++;
  ok(seqA.every(v => v >= 0 && v < 1), 'random values stay in 0..1');
  ok(c() !== seqA[0], 'another seed gives another sequence');
  ok(T.clamp(5, 0, 1) === 1 && T.clamp(-5, 0, 1) === 0, 'clamp holds both edges');

  const proj = T.M4.perspective(1.15, 1.5, 0.05, 60);
  const view = T.M4.lookAt(0, 1.6, 0, 0, 1.6, 1);
  const m = T.M4.mul(proj, view);
  const w = m[3] * 0 + m[7] * 1.6 + m[11] * 5 + m[15];
  const z = (m[2] * 0 + m[6] * 1.6 + m[10] * 5 + m[14]) / w;
  ok(w > 0 && z > -1 && z < 1, 'a point ahead of the camera lands inside the depth range');
  const bx = m[0] * 2 + m[4] * 1.6 + m[8] * 5 + m[12], by = m[1] * 2 + m[5] * 1.6 + m[9] * 5 + m[13];
  ok(Math.abs(bx / w) > 0 && Math.abs(by / w) < 1e-5, 'the eye level maps to the middle of the screen');
}

const SPEEDS = { runner: 400, diver: 240, welder: 300, miner: 280, strongman: 230, plumber: 300, vet: 320, hunter: 300, inspector: 320, knight: 300 };
const HEALTH = { runner: 125, diver: 200, welder: 175, miner: 175, strongman: 300, plumber: 125, vet: 150, hunter: 125, inspector: 125, knight: 175 };
const EAST = Math.PI / 2, NORTH = 0;

{
  ok(T.MERC_ORDER.length === 10, 'ten mercenaries');
  ok(T.MERC_ORDER.every(id => T.MERCS[id].id === id && T.MERCS[id].name), 'every mercenary has an id and a name');
  ok(T.TEAMS.hot.mark !== T.TEAMS.cold.mark && T.TEAMS.hot.color !== T.TEAMS.cold.color, 'sides differ by mark and by colour');
  for (const id of T.MERC_ORDER) {
    ok(T.MERCS[id].hp === HEALTH[id], 'health of ' + id);
    near(T.MERCS[id].speed, T.hu(SPEEDS[id]), 1e-9, 'speed of ' + id);
    ok(T.MERC_ORDER.filter(o => T.MERCS[o].key === T.MERCS[id].key).length === 1, 'one key per mercenary: ' + id);
  }
  ok(T.MERC_ORDER.filter(id => T.MERCS[id].double).length === 1 && T.MERCS.runner.double, 'only the courier jumps twice');
}

T.MAPS.lab = {
  name: 'Проверка',
  build(B) {
    const LAB = T.lab || {};
    B.ground(-200, -40, 200, 40, 0, LAB.holes || [], 'ground', { t: 8 });
    if (LAB.build) LAB.build(B);
    B.spawn('hot', 0, 0, EAST);
    B.spawn('cold', 0, 0, EAST);
    B.bounds(-200, -40, 200, 40);
    B.killY(-30);
  }
};

function lab(merc, build, holes, team) {
  T.lab = { build, holes };
  const g = new T.Game({ map: 'lab', visual: false, merc, team: team || 'hot' });
  return { g, p: g.player };
}

function place(p, x, y, z, yaw) {
  p.pos.x = x; p.pos.y = y; p.pos.z = z;
  p.prev.x = x; p.prev.y = y; p.prev.z = z;
  p.vel.x = p.vel.y = p.vel.z = 0;
  if (yaw !== undefined) p.yaw = yaw;
  p.onGround = false;
}

function hold(g, seconds, inp) {
  const n = Math.round(seconds * 60);
  for (let i = 0; i < n; i++) g.step(Object.assign(T.blankInput(), typeof inp === 'function' ? inp(i) : inp));
}

function holdUntil(g, seconds, inp, done) {
  const n = Math.round(seconds * 60);
  for (let i = 0; i < n && !done(); i++) g.step(Object.assign(T.blankInput(), inp));
  return done();
}

function settle(g, p, yaw) {
  hold(g, 0.2, { yaw: yaw === undefined ? p.yaw : yaw });
  ok(p.onGround, 'the body settles on the ground');
}

{
  for (const id of T.MERC_ORDER) {
    const { g, p } = lab(id);
    hold(g, 0.1, { yaw: EAST });
    hold(g, 1, { fwd: 1, yaw: EAST });
    const x0 = p.pos.x;
    hold(g, 2, { fwd: 1, yaw: EAST });
    near((p.pos.x - x0) / 2, T.hu(SPEEDS[id]), T.hu(SPEEDS[id]) * 0.01, 'walking speed of ' + id);

    const back = lab(id);
    hold(back.g, 0.1, { yaw: EAST });
    hold(back.g, 1, { fwd: -1, yaw: EAST });
    const b0 = back.p.pos.x;
    hold(back.g, 2, { fwd: -1, yaw: EAST });
    near((b0 - back.p.pos.x) / 2, T.hu(SPEEDS[id]) * R.backMul, T.hu(SPEEDS[id]) * 0.01, 'backward speed of ' + id);

    const duck = lab(id);
    hold(duck.g, 0.1, { yaw: EAST });
    hold(duck.g, 1, { fwd: 1, crouch: true, yaw: EAST });
    const c0 = duck.p.pos.x;
    hold(duck.g, 2, { fwd: 1, crouch: true, yaw: EAST });
    near((duck.p.pos.x - c0) / 2, T.hu(SPEEDS[id]) * R.crouchMul, T.hu(SPEEDS[id]) * 0.01, 'crouched speed of ' + id);

    const side = lab(id);
    hold(side.g, 0.1, { yaw: EAST });
    hold(side.g, 1, { fwd: 1, side: 1, yaw: EAST });
    const d0 = { x: side.p.pos.x, z: side.p.pos.z };
    hold(side.g, 2, { fwd: 1, side: 1, yaw: EAST });
    near(Math.hypot(side.p.pos.x - d0.x, side.p.pos.z - d0.z) / 2, T.hu(SPEEDS[id]), T.hu(SPEEDS[id]) * 0.01, 'diagonal speed of ' + id);
  }
}

{
  near(R.gravity, 15.24, 1e-9, 'gravity is 800 units');
  near(R.jumpHeight, 0.9525, 1e-9, 'jump height is 50 units');

  const jumpPeak = script => {
    const { g, p } = lab('diver');
    settle(g, p);
    let peak = 0, i = 0;
    const y0 = p.pos.y;
    while (i < 180) {
      g.step(Object.assign(T.blankInput(), { yaw: EAST }, script(i)));
      if (p.pos.y - y0 > peak) peak = p.pos.y - y0;
      i++;
    }
    return peak;
  };
  near(jumpPeak(i => ({ jump: i === 0 })), T.hu(50), T.hu(50) * 0.01, 'plain jump reaches 50 units');
  near(jumpPeak(i => ({ jump: i === 0, crouch: i >= 10 && i < 60 })), T.hu(72), T.hu(72) * 0.01, 'crouch jump reaches 72 units');

  const doublePeak = merc => {
    const { g, p } = lab(merc);
    settle(g, p);
    let peak = 0;
    const y0 = p.pos.y;
    const apex = Math.round(T.JUMP_V / R.gravity * 60);
    for (let i = 0; i < 240; i++) {
      g.step(Object.assign(T.blankInput(), { yaw: EAST, jump: i === 0 || i === apex }));
      if (p.pos.y - y0 > peak) peak = p.pos.y - y0;
    }
    return peak;
  };
  near(doublePeak('runner'), 1.905, 1.905 * 0.01, 'double jump reaches twice the height');
  near(doublePeak('diver'), T.hu(50), T.hu(50) * 0.01, 'others do not jump twice');

  const chain = lab('runner');
  settle(chain.g, chain.p);
  let top = 0;
  for (let i = 0; i < 240; i++) {
    chain.g.step(Object.assign(T.blankInput(), { yaw: EAST, jump: i % 8 < 2 }));
    if (chain.p.pos.y > top) top = chain.p.pos.y;
    if (i === 20) ok(chain.p.usedDouble, 'the second jump is used in the air');
  }
  ok(top < 2.0, 'there is no third jump: ' + top);

  const held = lab('diver');
  settle(held.g, held.p);
  let landings = 0;
  for (let i = 0; i < 300; i++) {
    held.g.step(Object.assign(T.blankInput(), { yaw: EAST, jump: true }));
    for (const ev of held.g.events) if (ev.type === 'land') landings++;
  }
  ok(landings === 1, 'holding the key does not repeat the jump: ' + landings);

  const buffered = lab('diver');
  settle(buffered.g, buffered.p);
  const air = Math.round(2 * T.JUMP_V / R.gravity * 60);
  let jumps = 0, was = true;
  for (let i = 0; i < air + 60; i++) {
    buffered.g.step(Object.assign(T.blankInput(), { yaw: EAST, jump: i === 0 || i === air - 3 }));
    if (was && !buffered.p.onGround) jumps++;
    was = buffered.p.onGround;
  }
  ok(jumps === 2, 'a press just before landing still jumps: ' + jumps);
}

{
  const climb = (merc, height, way) => {
    const { g, p } = lab(merc, B => B.box(4, 0, -6, 60, height, 6, 'block'));
    settle(g, p);
    place(p, 4 - p.r - 0.02, 0, 0, EAST);
    p.onGround = true;
    const apex = Math.round(T.JUMP_V / R.gravity * 60);
    for (let i = 0; i < 150; i++) {
      const inp = { fwd: 1, yaw: EAST };
      if (way !== 'walk') inp.jump = i === 0 || (way === 'double' && i === apex) || (way === 'doubleduck' && i === apex);
      if ((way === 'duck' && i >= 12) || (way === 'doubleduck' && i >= apex + 14)) inp.crouch = i < 110;
      g.step(Object.assign(T.blankInput(), inp));
    }
    return p.pos.x > 4 && Math.abs(p.pos.y - height) < 0.01;
  };
  const table = [
    ['diver', 0.3, 'walk', true], ['diver', 0.35, 'walk', true], ['diver', 0.5, 'walk', false],
    ['diver', 0.5, 'jump', true], ['diver', 0.9, 'jump', true], ['strongman', 0.9, 'jump', true], ['diver', 1.0, 'jump', false],
    ['diver', 1.0, 'duck', true], ['diver', 1.3, 'duck', true], ['strongman', 1.3, 'duck', true], ['diver', 1.45, 'duck', false],
    ['runner', 1.9, 'double', true], ['diver', 1.9, 'double', false], ['diver', 1.9, 'duck', false], ['runner', 2.3, 'doubleduck', true], ['runner', 2.5, 'doubleduck', false]
  ];
  for (const [merc, h, way, want] of table) ok(climb(merc, h, way) === want, merc + ' ' + way + ' onto ' + h + ' m must be ' + want);
}

{
  const fall = (height, merc, holes, build, script) => {
    const { g, p } = lab(merc || 'diver', build, holes);
    settle(g, p);
    place(p, 0, height, 0, EAST);
    let got = 0;
    for (let i = 0; i < 300; i++) {
      g.step(Object.assign(T.blankInput(), { yaw: EAST }, script ? script(p, i) : null));
      for (const ev of g.events) if (ev.type === 'hurt' && ev.cause === 'fall') got += ev.amount;
    }
    return { got, p };
  };
  ok(fall(4.9).got === 0, 'a fall of 4.9 m does no damage');
  const speedAt = h => Math.sqrt(2 * R.gravity * h) / T.HU;
  const pct = (h, hp) => hp * 0.05 * speedAt(h) / 300;
  near(fall(5.2).got, pct(5.2, 200), 1.2, 'just above the limit the damage follows the formula');
  near(fall(10).got, pct(10, 200), 1.2, 'ten metres follow the formula');
  near(fall(10, 'strongman').got, pct(10, 300), 1.8, 'the damage counts from full health');
  near(fall(20, 'runner').got, pct(20, 125), 1.2, 'the runner takes less in points from the same fall');

  const deadly = lab('runner');
  settle(deadly.g, deadly.p);
  deadly.p.hp = 5;
  place(deadly.p, 0, 12, 0, EAST);
  const seen = [];
  for (let i = 0; i < 180; i++) {
    deadly.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
    for (const ev of deadly.g.events) seen.push(ev.type);
  }
  ok(seen.includes('death') && seen.includes('spawn'), 'a deadly fall kills and sends back to the start');
  ok(deadly.p.hp === 125, 'the start gives full health');

  const POOL = B => B.water(-5, -5, 5, 5, -3, 0);
  const deep = fall(10, 'diver', [[-5, -5, 5, 5]], B => { B.floor(-5, -5, 5, 5, -3, 'plate', { t: 1 }); POOL(B); });
  ok(deep.got === 0, 'deep water stops the fall');
  const shallow = fall(10, 'diver', [[-5, -5, 5, 5]], B => { B.floor(-5, -5, 5, 5, -0.1, 'plate', { t: 1 }); B.water(-5, -5, 5, 5, -0.1, 0); });
  ok(shallow.got === 0, 'shallow water stops the fall too');
  const saved = fall(10, 'runner', null, null, (p, i) => ({ jump: p.pos.y < 1.2 && p.vel.y < 0 && !p.usedDouble }));
  ok(saved.got === 0, 'the second jump stops the fall');
  ok(fall(10, 'diver', null, null, (p, i) => ({ jump: p.pos.y < 1.2 && p.vel.y < 0 })).got > 0, 'the jump key does not save the others');
}

{
  const POOL = B => {
    B.floor(-20, -6, 20, 6, -3.25, 'plate', { t: 1 });
    B.water(-20, -6, 20, 6, -3.25, -0.25);
  };
  const HOLE = [[-20, -6, 20, 6]];
  for (const id of ['runner', 'diver', 'strongman']) {
    const { g, p } = lab(id, POOL, HOLE);
    place(p, -15, -1.5, 0, EAST);
    hold(g, 1.5, { yaw: EAST });
    ok(p.level >= 2, 'the body swims in deep water');
    hold(g, 1, { fwd: 1, yaw: EAST });
    const x0 = p.pos.x;
    hold(g, 1, { fwd: 1, yaw: EAST });
    near(p.pos.x - x0, T.hu(SPEEDS[id]) * R.waterMul, T.hu(SPEEDS[id]) * 0.02, 'swimming speed of ' + id);
  }

  const sw = lab('diver', POOL, HOLE);
  place(sw.p, 0, -1.5, 0, EAST);
  hold(sw.g, 4, { yaw: EAST });
  near(sw.p.pos.y, -0.25 - (R.eyeStand - 0.1), 0.08, 'the body floats with the eyes above water');
  hold(sw.g, 1, { yaw: EAST, crouch: true });
  ok(sw.p.pos.y < -2, 'the crouch key dives');
  ok(sw.p.level === 3, 'the head goes under');
  hold(sw.g, 1, { yaw: EAST, jump: true });
  ok(sw.p.pos.y > -2, 'the jump key rises');

  const air = lab('diver', POOL, HOLE);
  place(air.p, 0, -3.2, 0, EAST);
  let hurt = 0;
  for (let i = 0; i < 60 * (R.breath + 2.5); i++) {
    air.g.step(Object.assign(T.blankInput(), { yaw: EAST, crouch: true }));
    for (const ev of air.g.events) if (ev.type === 'hurt' && ev.cause === 'water') { hurt += ev.amount; if (i < 60 * (R.breath - 0.5)) assert.fail('no damage before the breath ends'); }
  }
  checks++;
  near(hurt, R.drown * 2.5, 1, 'after the breath the water takes 8 a second');
  hold(air.g, 3, { yaw: EAST, jump: true });
  hold(air.g, 3, { yaw: EAST });
  ok(air.p.breath > R.breath - 1, 'the breath comes back at the surface');

  const out = lab('diver', B => { POOL(B); }, HOLE);
  place(out.p, 19, -1.5, 0, EAST);
  hold(out.g, 2, { yaw: EAST });
  hold(out.g, 3, { fwd: 1, jump: true, yaw: EAST });
  ok(out.p.pos.x > 20 && out.p.pos.y === 0, 'the body leaves the water over a low edge: ' + out.p.pos.x + ',' + out.p.pos.y);
}

{
  const scene = B => {
    B.box(-3, 0, 6, 3, 8, 12, 'block');
    B.ladder(-1, 5.4, 1, 6, 0, 8, 'z+');
  };
  const { g, p } = lab('diver', scene);
  settle(g, p);
  place(p, 0, 0, 5, NORTH);
  p.onGround = true;
  hold(g, 0.5, { fwd: 1, yaw: NORTH });
  ok(p.climbing, 'walking into a ladder starts the climb');
  ok(p.pos.y > 0.5, 'W climbs');
  const y1 = p.pos.y;
  hold(g, 0.5, { yaw: NORTH });
  near(p.pos.y, y1, 1e-6, 'the body hangs on the ladder without keys');
  hold(g, 0.3, { fwd: -1, yaw: NORTH });
  ok(p.pos.y < y1, 'S goes down');
  ok(holdUntil(g, 4, { fwd: 1, yaw: NORTH }, () => p.onGround && p.pos.y > 7.9), 'the climb ends on top');
  ok(Math.abs(p.pos.y - 8) < 0.01 && p.pos.z > 6, 'the body stands on the top: ' + p.pos.y + ',' + p.pos.z);

  const off = lab('diver', scene);
  settle(off.g, off.p);
  place(off.p, 0, 0, 5, NORTH);
  off.p.onGround = true;
  hold(off.g, 1, { fwd: 1, yaw: NORTH });
  const yBefore = off.p.pos.y;
  hold(off.g, 0.1, { jump: true, yaw: NORTH });
  ok(!off.p.climbing && off.p.pos.z < 5.4, 'the jump key lets go of the ladder');
  hold(off.g, 2, { yaw: NORTH });
  ok(off.p.onGround && off.p.pos.y === 0 && yBefore > 0, 'after letting go the body falls');

  const down = lab('diver', scene);
  settle(down.g, down.p);
  place(down.p, 0, 0, 5, Math.PI);
  down.p.onGround = true;
  hold(down.g, 0.5, { fwd: 1, yaw: Math.PI });
  ok(!down.p.climbing && down.p.pos.y === 0, 'walking away from a ladder does not climb it');
}

{
  const scene = B => {
    B.wall(-20, 10, 20, 10, 5, 0.5, 'wall', { holes: [[10, 12.4, 0, 2.6], [20, 22.4, 0, 2.6], [30, 32.4, 0, 2.6]] });
    B.gate(-10, 10, -7.6, 10, 2.6, 'z+');
    B.door(0, 10, 2.4, 10, 2.6, 'hot');
    B.door(10, 10, 12.4, 10, 2.6, 'cold');
  };
  const pass = (team, x, z0, yaw) => {
    const { g, p } = lab('diver', scene, null, team);
    settle(g, p);
    place(p, x, 0, z0, yaw);
    p.onGround = true;
    hold(g, 3, { fwd: 1, yaw });
    return p.pos.z;
  };
  ok(pass('hot', -8.8, 7, NORTH) > 11, 'the gate lets through in its direction');
  ok(pass('hot', -8.8, 13, Math.PI) > 10.3, 'the gate holds in the other direction');
  ok(pass('cold', -8.8, 7, NORTH) > 11, 'the gate is the same for both sides');
  ok(pass('hot', 1.2, 7, NORTH) > 11, 'a door lets its own side through');
  ok(pass('cold', 1.2, 7, NORTH) < 9.9, 'a door holds the other side');
  ok(pass('cold', 11.2, 7, NORTH) > 11, 'the other door lets the other side through');
  ok(pass('hot', 11.2, 7, NORTH) < 9.9, 'the other door holds the first side');
  ok(pass('hot', -8.8 + 12, 7, NORTH) < 9.9, 'a plain wall holds everyone');
}

{
  const scene = B => {
    B.box(-6, 1.25, 4, 6, 1.55, 12, 'roof');
  };
  const { g, p } = lab('diver', scene);
  settle(g, p);
  place(p, 0, 0, 1, NORTH);
  p.onGround = true;
  hold(g, 2, { fwd: 1, yaw: NORTH });
  ok(p.pos.z < 4, 'a standing body does not fit under 1.25 m: ' + p.pos.z);
  hold(g, 4, { fwd: 1, crouch: true, yaw: NORTH });
  ok(p.pos.z > 6, 'a crouched body fits');
  hold(g, 0.5, { yaw: NORTH });
  ok(p.crouched && p.h < 1.25, 'the body cannot stand up under the roof');
  hold(g, 8, { fwd: -1, yaw: NORTH });
  ok(!p.crouched && p.h === R.standH, 'the body stands up once it is out');
  near(R.crouchH, 1.6 - T.hu(22), 1e-9, 'the crouched body is about 1.2 m');
}

{
  const hop = lab('runner');
  hold(hop.g, 0.1, { yaw: EAST });
  let max = 0;
  for (let i = 0; i < 600; i++) {
    hop.g.step(Object.assign(T.blankInput(), { fwd: 1, jump: i % 2 === 0, yaw: EAST }));
    max = Math.max(max, Math.hypot(hop.p.vel.x, hop.p.vel.z));
  }
  ok(max <= T.hu(400) * 1.01, 'repeated jumps do not add speed: ' + max);

  const strafe = lab('runner');
  hold(strafe.g, 0.1, { yaw: EAST });
  hold(strafe.g, 1, { fwd: 1, yaw: EAST });
  strafe.g.step(Object.assign(T.blankInput(), { fwd: 1, jump: true, yaw: EAST }));
  let top = 0, yaw = EAST;
  for (let i = 0; i < 40; i++) {
    yaw += 0.08;
    strafe.g.step(Object.assign(T.blankInput(), { side: 1, yaw }));
    top = Math.max(top, Math.hypot(strafe.p.vel.x, strafe.p.vel.z));
  }
  ok(top <= T.hu(400) * 1.01, 'turning in the air does not add speed: ' + top);

  const landed = lab('diver');
  settle(landed.g, landed.p);
  landed.p.pos.y = 0;
  landed.g.knock(landed.p, 20, 0, 0);
  const fast = Math.hypot(landed.p.vel.x, landed.p.vel.z);
  hold(landed.g, 0.5, { yaw: EAST });
  ok(fast === 20 && Math.hypot(landed.p.vel.x, landed.p.vel.z) < 5, 'the ground takes the extra speed away quickly');

  const pushed = lab('strongman');
  settle(pushed.g, pushed.p);
  pushed.g.knock(pushed.p, 0, 10, 0);
  ok(pushed.p.vel.y === 5, 'the strongman takes half of the push');
}

{
  const lanes = (a, b) => {
    const { g, p } = lab('diver');
    settle(g, p);
    const other = g.addHero('runner', b, false);
    other.fixed = true;
    other.pos.x = 5; other.pos.y = 0; other.pos.z = 0;
    other.prev.x = 5; other.prev.y = 0; other.prev.z = 0;
    p.team = a;
    hold(g, 2, { fwd: 1, yaw: EAST });
    return p.pos.x;
  };
  ok(lanes('hot', 'hot') > 6, 'own side walks through');
  ok(lanes('hot', 'cold') < 5, 'the other side holds the body');
}

{
  const y = T.MAPS.yard.spec;
  const g = new T.Game({ map: 'yard', visual: false, merc: 'runner', team: 'hot' });
  const p = g.player;
  ok(g.map.spawns.some(s => s.team === 'hot') && g.map.spawns.some(s => s.team === 'cold'), 'the yard has a start for both sides');
  ok(g.map.dummies.length === 20, 'ten stand-ins per side');
  ok(g.map.labels.length > 40, 'the yard is signed');
  ok(p.pos.y === 0, 'the start stands on the ground');

  const goTo = (merc, team, x, z, yaw) => {
    const n = new T.Game({ map: 'yard', visual: false, merc, team });
    place(n.player, x, n.world.spawnY(x, z, 1), z, yaw);
    n.player.onGround = true;
    return { g: n, p: n.player };
  };

  for (const [text, x, want, inp] of [
    ['door', -52.8, true, {}], ['narrow passage', -46.8, true, {}], ['main path', -39.5, true, {}],
    ['low passage standing', -31.8, false, {}], ['low passage crouched', -31.8, true, { crouch: true }],
    ['gate', -25.8, true, {}], ['own door', -19.8, true, {}], ['other door', -13.8, false, {}]
  ]) {
    const w = goTo('diver', 'hot', x, y.WALL_Z - 3, NORTH);
    hold(w.g, 8, Object.assign({ fwd: 1, yaw: NORTH }, inp));
    ok((w.p.pos.z > y.WALL_Z + 1) === want, 'yard passage ' + text + ' at z ' + w.p.pos.z);
  }

  const back = goTo('diver', 'hot', -25.8, y.WALL_Z + 3, Math.PI);
  hold(back.g, 3, { fwd: 1, yaw: Math.PI });
  ok(back.p.pos.z > y.WALL_Z, 'the yard gate holds on the way back');

  for (const [x, len] of y.PITS) {
    const speedToClear = len / (2 * T.JUMP_V / R.gravity);
    const clears = T.MERC_ORDER.filter(id => T.MERCS[id].speed + 0.8 > speedToClear);
    ok(clears.length > 0, 'somebody can clear the ' + len + ' m pit');
    const run = goTo('runner', 'hot', x - 5, (y.PIT_Z0 + y.PIT_Z1) / 2, EAST);
    let jumped = false;
    for (let i = 0; i < 180; i++) {
      const jump = !jumped && run.p.pos.x + run.p.r * 0.5 >= x - 0.1;
      if (jump) jumped = true;
      run.g.step(Object.assign(T.blankInput(), { fwd: 1, jump, yaw: EAST }));
      if (jumped && run.p.onGround && i > 0 && run.p.pos.x > x + len) break;
    }
    ok(run.p.pos.x > x + len && run.p.pos.y === 0, 'the runner clears the ' + len + ' m pit');
  }
  const shortRun = goTo('strongman', 'hot', -32 - 5, (y.PIT_Z0 + y.PIT_Z1) / 2, EAST);
  let done = false;
  for (let i = 0; i < 200; i++) {
    const jump = !done && shortRun.p.pos.x + shortRun.p.r * 0.5 >= -32.1;
    if (jump) done = true;
    shortRun.g.step(Object.assign(T.blankInput(), { fwd: 1, jump, yaw: EAST }));
  }
  ok(shortRun.p.pos.y < 0, 'the strongman does not clear the 4 m pit');

  for (const [x, h] of y.TOWERS) {
    const t = goTo('diver', 'hot', x + y.TOWER_W / 2, y.TOWER_Z1 + 2, Math.PI);
    ok(holdUntil(t.g, 2 + h * 0.5, { fwd: 1, yaw: Math.PI }, () => t.p.onGround && t.p.pos.y > h - 0.1), 'the ladder leads onto the ' + h + ' m tower');
    ok(t.p.pos.z < y.TOWER_Z1, 'the body stands on the ' + h + ' m tower');
  }

  const dive = goTo('diver', 'hot', 12.5, 3, Math.PI);
  place(dive.p, 12.5, 10, 3, Math.PI);
  dive.p.onGround = true;
  let hurt = 0;
  for (let i = 0; i < 300; i++) {
    dive.g.step(Object.assign(T.blankInput(), { fwd: i < 60 ? 1 : 0, yaw: Math.PI }));
    for (const ev of dive.g.events) if (ev.type === 'hurt') hurt += ev.amount;
  }
  ok(hurt === 0 && dive.p.pos.z < 2 && dive.p.level >= 1, 'the 10 m tower drops into water without damage');

  const ramp = goTo('diver', 'hot', 26, -15, EAST);
  place(ramp.p, 24, -1.5, -15, EAST);
  hold(ramp.g, 6, { fwd: 1, yaw: EAST });
  ok(ramp.p.pos.x > 30 && ramp.p.pos.y === 0, 'the pool ramp leads out of the water');

  const stairs = goTo('strongman', 'hot', 14, -28, EAST);
  hold(stairs.g, 6, { fwd: 1, yaw: EAST });
  near(stairs.p.pos.y, 3, 0.01, 'the stairs lead onto the platform');
  const slope = goTo('strongman', 'hot', 50, -28, -EAST);
  hold(slope.g, 3, { fwd: 1, yaw: -EAST });
  near(slope.p.pos.y, 3, 0.01, 'the 30 degree ramp leads onto the platform');
  ok(slope.p.onGround, 'the body keeps to the ground on a ramp');

  const rocketRoof = (x, height) => {
    const r = goTo('diver', 'hot', x, 29, NORTH);
    place(r.p, x, 0, 31, NORTH);
    r.p.onGround = true;
    for (let i = 0; i < 300; i++) {
      const landed = r.p.onGround && i > 5;
      r.g.step(Object.assign(T.blankInput(), { yaw: NORTH, pitch: -1.48, fwd: landed ? 0 : 1, jump: i === 0, fire: i === 0, crouch: i >= 1 && !landed }));
    }
    return Math.abs(r.p.pos.y - height) < 0.01;
  };
  ok(rocketRoof(-50, 4), 'a rocket jump lands on the 4 m roof');
  ok(rocketRoof(-40, 6), 'a rocket jump lands on the 6 m roof');
  ok(rocketRoof(-30, 7), 'a rocket jump lands on the 7 m roof');
  ok(!rocketRoof(-20, 10), 'a rocket jump does not reach the 10 m roof');
  const mineRoof = (x, height) => {
    const r = goTo('miner', 'hot', x, 31, NORTH);
    r.g.step(Object.assign(T.blankInput(), { yaw: NORTH, slot: 2 }));
    hold(r.g, 0.6, { yaw: NORTH, pitch: -1.48 });
    r.g.step(Object.assign(T.blankInput(), { yaw: NORTH, pitch: -1.48, fire: true }));
    r.g.step(Object.assign(T.blankInput(), { yaw: NORTH, pitch: -1.48 }));
    hold(r.g, 1, { yaw: NORTH, pitch: -1.48 });
    for (let i = 0; i < 300; i++) {
      const landed = r.p.onGround && i > 5;
      r.g.step(Object.assign(T.blankInput(), { yaw: NORTH, pitch: -1.48, fwd: landed ? 0 : 1, jump: i === 0, fire2: i === 0, crouch: i >= 1 && !landed }));
    }
    return Math.abs(r.p.pos.y - height) < 0.01;
  };
  ok(mineRoof(-10, 11.5), 'a mine jump lands on the 11.5 m roof');

  const line = y.FIRE_LINE;
  ok(g.map.targets.length === y.TARGETS.length, 'the range has a target for every distance');
  y.TARGETS.forEach((d, i) => near(g.map.targets[i].x - line.x, d, 1e-9, 'the target stands at ' + d + ' m'));
  const shooter = goTo('runner', 'hot', line.x, line.z, EAST);
  shooter.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 2 }));
  hold(shooter.g, 0.6, { yaw: EAST });
  const hits = [];
  for (let i = 0; i < 30; i++) {
    shooter.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: i === 0 }));
    for (const ev of shooter.g.events) if (ev.type === 'hit') hits.push(ev);
  }
  ok(hits.length === 1, 'one pistol shot from the line hits the first target');
  near(hits[0].amount, T.hitDamage(T.WEAPONS.pistol, 5 / T.HU, null), 0.5, 'the 5 m target takes the 5 m damage');
}

{
  const inputs = seed => {
    const rand = T.rng(seed);
    const g = new T.Game({ map: 'yard', visual: false, merc: 'runner', team: 'hot' });
    const b = g.map.bounds;
    let yaw = 0, pitch = 0, cur = T.blankInput();
    for (let i = 0; i < 60 * 60; i++) {
      if (i % 20 === 0) {
        cur = T.blankInput();
        cur.fwd = Math.floor(rand() * 3) - 1;
        cur.side = Math.floor(rand() * 3) - 1;
        cur.jump = rand() < 0.5;
        cur.crouch = rand() < 0.3;
        yaw += (rand() - 0.5) * 3;
        pitch = (rand() - 0.5) * 2;
        cur.fire = rand() < 0.5;
        cur.reload = rand() < 0.1;
        cur.slot = rand() < 0.2 ? 1 + Math.floor(rand() * 3) : 0;
        cur.next = rand() < 0.1 ? 1 : 0;
        cur.last = rand() < 0.1;
        cur.fire2 = rand() < 0.3;
        if (rand() < 0.1) g.setMerc(g.player, T.MERC_ORDER[Math.floor(rand() * 10)]);
      }
      cur.yaw = yaw; cur.pitch = pitch;
      g.step(cur);
      const q = g.player.pos;
      assert.ok(Number.isFinite(q.x) && Number.isFinite(q.y) && Number.isFinite(q.z), 'position stays a number');
      assert.ok(q.x >= b.x0 - 1 && q.x <= b.x1 + 1 && q.z >= b.z0 - 1 && q.z <= b.z1 + 1, 'the body stays in the yard at ' + q.x + ',' + q.z);
      assert.ok(q.y > -12.1, 'the body does not fall out');
    }
    return g.stateHash();
  };
  const a = inputs(5), b = inputs(5), c = inputs(6);
  ok(a === b, 'one seed and one input give one state');
  ok(a !== c, 'another input gives another state');
}

{
  const g = new T.Game({ map: 'yard', visual: true, merc: 'diver', team: 'hot' });
  ok(g.map.vis.boxes.length > 30 && g.map.vis.ramps.length >= 2 && g.map.vis.steps.length >= 1 && g.map.vis.water.length === 1, 'the yard has something to draw');
  const hot = g.player;
  g.setTeam(hot, 'cold');
  ok(hot.team === 'cold' && hot.pos.x > 0, 'changing side moves to that start');
  g.setMerc(hot, 'strongman');
  ok(hot.hp === 300 && hot.maxHp === 300, 'changing the mercenary gives their health');
}

{
  near(T.distanceFactor(0), 1.5, 1e-9, 'the distance factor starts at 150 %');
  near(T.distanceFactor(512), 1, 1e-9, 'the distance factor is 100 % at 512 units');
  near(T.distanceFactor(921.6), 0.528, 1e-9, 'the distance factor stops at 52.8 %');
  near(T.distanceFactor(4000), 0.528, 1e-9, 'the distance factor stays flat after 921.6 units');

  const table = [
    ['sawn', 10.5, 6, 3.168, 18, 8.1, 14.175],
    ['pistol', 22.5, 15, 7.92, 45, 20.25, 30.375],
    ['tube', 112.5, 90, 47.52, 270, 121.5, 151.875],
    ['shotgun', 9, 6, 3.168, 18, 8.1, 12.15],
    ['pump', 35, 35, 35, 105, 47.25, 47.25],
    ['gaff', 65, 65, 65, 195, 87.75, 87.75]
  ];
  for (const [id, close, mid, far, crit, miniFar, miniClose] of table) {
    const def = T.WEAPONS[id];
    near(T.hitDamage(def, 0, null), close, 1e-6, id + ' at point blank');
    near(T.hitDamage(def, 512, null), mid, 1e-6, id + ' at 512 units');
    near(T.hitDamage(def, 1024, null), far, 1e-6, id + ' at 1024 units');
    near(T.hitDamage(def, 0, 'crit'), crit, 1e-6, id + ' crit up close');
    near(T.hitDamage(def, 1024, 'crit'), crit, 1e-6, id + ' crit far away');
    near(T.hitDamage(def, 0, 'mini'), miniClose, 1e-6, id + ' mini-crit up close');
    near(T.hitDamage(def, 1024, 'mini'), miniFar, 1e-6, id + ' mini-crit far away');
  }
  near(T.hitDamage(T.WEAPONS.sawn, 0, null) * 10, 105, 1e-6, 'the sawn-off gives 105 up close');
  near(T.hitDamage(T.WEAPONS.sawn, 512, null) * 10, 60, 1e-6, 'the sawn-off gives 60 in the middle');
  near(T.hitDamage(T.WEAPONS.sawn, 1024, null) * 10, 32, 0.5, 'the sawn-off gives 32 far away');
  near(T.hitDamage(T.WEAPONS.shotgun, 0, null) * 10, 90, 1e-6, 'the shotgun gives 90 up close');

  const rules = { sawn: [6, 32, 0.625, [0.7, 0.5]], pistol: [12, 36, 0.15, [1.005]], tube: [4, 20, 0.8, [0.92, 0.8]], shotgun: [6, 32, 0.625, [1.005, 0.51]] };
  for (const id in rules) {
    const w = T.WEAPONS[id], [clip, reserve, interval, reload] = rules[id];
    ok(w.clip === clip && w.reserve === reserve && w.interval === interval, id + ' clip, reserve and interval');
    assert.deepEqual(w.reload, reload, id + ' reload times');
    checks++;
  }
  near(T.WEAPONS.tube.speed, T.hu(1100), 1e-9, 'the rocket flies 1100 units a second');
  near(T.WEAPONS.tube.radius, T.hu(146), 1e-9, 'the blast radius is 146 units');
  ok(T.WEAPONS.pump.interval === 0.5 && T.WEAPONS.gaff.interval === 0.8, 'melee intervals');

  for (const id in T.WEAPONS) {
    ok(T.KINDS[T.WEAPONS[id].kind], 'the kind of ' + id + ' exists');
    ok(T.WEAPONS[id].kind === 'passive' || T.WEAPONS[id].view.length > 0, id + ' can be seen in hand');
  }
  assert.deepEqual(T.MERCS.runner.slots, ['sawn', 'pistol', 'pump'], 'the courier kit');
  checks++;
  assert.deepEqual(T.MERCS.diver.slots, ['tube', 'shotgun', 'gaff'], 'the diver kit');
  checks++;
  ok(!read('js/apps/tf98/tf-weapons.js').match(/runner|diver|welder|strongman|plumber|hunter|inspector|knight/), 'weapons know nothing about mercenaries');
}

const armed = (merc, dist, opts = {}) => {
  const { g, p } = lab(merc, opts.build, null, 'hot');
  settle(g, p);
  place(p, 0, 0, 0, EAST);
  p.onGround = true;
  const dummy = dist === null ? null : g.addDummy(opts.foe || 'diver', opts.team || 'cold', dist, 0, opts.z || 0, 0);
  if (opts.slot) { g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: opts.slot })); hold(g, 0.6, { yaw: EAST }); }
  return { g, p, dummy };
};

const shoot = (g, ticks, inp) => {
  const hits = [];
  for (let i = 0; i < ticks; i++) {
    g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: i === 0 }, typeof inp === 'function' ? inp(i) : inp));
    for (const ev of g.events) if (ev.type === 'hit') hits.push(Object.assign({ tick: i }, ev));
  }
  return hits;
};

{
  const close = armed('runner', 1.5);
  const hits = shoot(close.g, 3);
  ok(hits.length === 1, 'one shot of pellets gives one number');
  near(hits[0].amount, 10 * T.hitDamage(T.WEAPONS.sawn, close.g.distanceHu(close.p, close.dummy), null), 1e-6, 'all ten pellets land up close');
  ok(close.p.arms[0].clip === 5, 'the shot takes a shell');

  const far = armed('runner', 30);
  const spreadHits = shoot(far.g, 3);
  ok(spreadHits.length === 1 && spreadHits[0].amount < 10 * 3.2 && spreadHits[0].amount > 0, 'far away part of the pellets miss');

  const line = armed('runner', 40, { slot: 2 });
  const first = shoot(line.g, 3);
  ok(first.length === 1, 'the first pistol shot is exact');
  near(first[0].amount, T.hitDamage(T.WEAPONS.pistol, line.g.distanceHu(line.p, line.dummy), null), 1e-6, 'the pistol damage at 40 m');

  const rate = armed('runner', 5, { slot: 2 });
  let shots = 0;
  for (let i = 0; i < 90; i++) {
    rate.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
    for (const ev of rate.g.events) if (ev.type === 'shot') shots++;
  }
  ok(shots >= 9 && shots <= 11, 'the pistol fires every 0.15 s: ' + shots);

  const wall = armed('runner', 6, { slot: 2, build: B => B.box(3, 0, -4, 3.4, 4, 4, 'wall') });
  ok(shoot(wall.g, 3).length === 0, 'a wall stops a bullet');

  const friend = armed('runner', 5, { slot: 2, team: 'hot' });
  ok(shoot(friend.g, 3).length === 0, 'a bullet does not hurt your own side');
  const behind = armed('runner', 8, { slot: 2 });
  behind.g.addDummy('diver', 'hot', 4, 0, 0, 0);
  ok(shoot(behind.g, 3).length === 1, 'a bullet flies through your own side');

  const low = armed('runner', 3, { slot: 2, foe: 'runner' });
  low.dummy.hp = 10;
  const seen = [];
  for (let i = 0; i < 3; i++) {
    low.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: i === 0 }));
    for (const ev of low.g.events) seen.push(ev.type);
  }
  ok(seen.includes('broken') && low.dummy.hp === low.dummy.maxHp, 'a stand-in comes back at once');
}

{
  const swing = armed('diver', 1.5, { slot: 3 });
  const hits = shoot(swing.g, 40);
  ok(hits.length === 1, 'one swing hits once');
  ok(hits[0].tick >= 10 && hits[0].tick <= 13, 'the blow lands after 0.2 s: tick ' + hits[0].tick);
  near(hits[0].amount, 65, 1e-9, 'the gaff hits for 65');

  ok(shoot(armed('diver', 2.5, { slot: 3 }).g, 30).length === 0, 'melee does not reach 2.5 m');
  const away = armed('diver', -1.5, { slot: 3 });
  ok(shoot(away.g, 30).length === 0, 'melee does not hit behind');
  const blocked = armed('diver', 1.5, { slot: 3, build: B => B.box(0.6, 0, -2, 0.75, 4, 2, 'wall') });
  ok(shoot(blocked.g, 30).length === 0, 'melee does not hit through a wall');

  const fast = armed('runner', 1.5, { slot: 3 });
  const many = shoot(fast.g, 62, { fire: true });
  ok(many.length === 2 && many.every(h => h.amount === 35), 'the pump swings every 0.5 s for 35: ' + many.length);

  const crit = armed('runner', 1.5, { slot: 3 });
  crit.g.debugBoost(crit.p, 'crit');
  near(shoot(crit.g, 20)[0].amount, 105, 1e-9, 'a melee crit is three times the base');
  const mini = armed('diver', 1.5, { slot: 3 });
  mini.g.debugBoost(mini.p, 'mini');
  near(shoot(mini.g, 20)[0].amount, 87.75, 1e-9, 'a melee mini-crit is 1.35 times the base');
}

{
  const direct = armed('diver', 10);
  const hits = shoot(direct.g, 50);
  ok(hits.length === 1, 'a rocket hits once');
  const arrive = (10 - direct.dummy.r - 0.4) / T.WEAPONS.tube.speed * 60;
  ok(Math.abs(hits[0].tick - arrive) < 4, 'the rocket takes its time to fly: tick ' + hits[0].tick);
  near(hits[0].amount, T.hitDamage(T.WEAPONS.tube, direct.g.distanceHu(direct.p, direct.dummy), null), 1e-6, 'a direct hit has no blast falloff');
  ok(direct.g.proj.length === 0, 'the rocket is gone after the blast');

  const wallAt = B => B.box(10, 0, -4, 10.4, 5, 4, 'wall');
  const splash = armed('diver', 9.2, { build: wallAt, z: 1.5 });
  const splashHits = shoot(splash.g, 60);
  ok(splashHits.length === 1, 'the blast reaches a body next to the wall');
  const center = { x: 10 - R.blastBack, y: splash.g.eyeHeight(splash.p), z: 0 };
  const dist = Math.hypot(9.2 - center.x, 1.5 - center.z);
  const expected = T.hitDamage(T.WEAPONS.tube, splash.g.distanceHu(splash.p, splash.dummy), null) * (1 - 0.5 * dist / T.WEAPONS.tube.radius);
  near(splashHits[0].amount, expected, 2, 'the blast falls off to the edge');
  ok(splashHits[0].amount < T.hitDamage(T.WEAPONS.tube, splash.g.distanceHu(splash.p, splash.dummy), null), 'splash is weaker than a direct hit');

  ok(shoot(armed('diver', 9.2, { build: wallAt, z: 3.5 }).g, 60).length === 0, 'the blast stops at its radius');
  const cover = armed('diver', 8.5, { z: 1.5, build: B => { wallAt(B); B.box(9, 0, 0.9, 9.3, 5, 3, 'wall'); } });
  ok(shoot(cover.g, 60).length === 0, 'a wall shields from the blast');

  const ally = armed('diver', 10);
  ally.g.addDummy('diver', 'hot', 5, 0, 0, 0);
  const passed = shoot(ally.g, 50);
  ok(passed.length === 1 && passed[0].dst === ally.dummy.id, 'a rocket flies through your own side');

  const crit = armed('diver', 10);
  crit.g.debugBoost(crit.p, 'crit');
  near(shoot(crit.g, 50)[0].amount, 270, 1e-6, 'a direct rocket crit is 270');
  const mini = armed('diver', 40);
  mini.g.debugBoost(mini.p, 'mini');
  near(shoot(mini.g, 140)[0].amount, 121.5, 1e-6, 'a far rocket mini-crit has no falloff');
  const lateBoost = armed('diver', 40);
  lateBoost.g.debugBoost(lateBoost.p, 'crit');
  const flown = shoot(lateBoost.g, 140, i => { if (i === 20) { lateBoost.p.critT = 0; } return null; });
  near(flown[0].amount, 270, 1e-6, 'the crit is decided when the rocket leaves');
}

{
  const clip = armed('diver', null);
  for (let i = 0; i < 50; i++) clip.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, fire: i === 0 }));
  ok(clip.p.arms[0].clip === 3 && clip.p.arms[0].reserve === 20, 'a shot takes a rocket from the clip');
  clip.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, reload: true }));
  ok(clip.p.reloading, 'R starts the reload');
  hold(clip.g, 0.8, { yaw: 0, pitch: 0.3 });
  ok(clip.p.arms[0].clip === 3, 'the first rocket takes more than 0.8 s');
  hold(clip.g, 0.2, { yaw: 0, pitch: 0.3 });
  ok(clip.p.arms[0].clip === 4 && clip.p.arms[0].reserve === 19 && !clip.p.reloading, 'the clip is full after 0.92 s');

  const empty = armed('diver', null);
  let last = 0;
  for (let i = 0; i < 60 * 3.3; i++) {
    empty.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, fire: true }));
    if (empty.p.arms[0].clip === 0 && !last) last = i;
  }
  ok(last > 0 && empty.p.reloading, 'an empty clip reloads by itself');
  hold(empty.g, 0.92 + 0.8 * 3 + 0.1, { yaw: 0, pitch: 0.3 });
  ok(empty.p.arms[0].clip === 4 && empty.p.arms[0].reserve === 16, 'rockets come one by one until the clip is full');

  const cut = armed('diver', null);
  for (let i = 0; i < 100; i++) cut.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, fire: i === 0 || i === 60 }));
  cut.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, reload: true }));
  hold(cut.g, 0.3, { yaw: 0, pitch: 0.3 });
  ok(cut.p.reloading, 'the reload is running');
  cut.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, fire: true }));
  ok(!cut.p.reloading && cut.p.arms[0].clip === 1, 'firing interrupts a shell by shell reload');

  const whole = armed('runner', null, { slot: 2 });
  for (let i = 0; i < 20; i++) whole.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, fire: i === 0 }));
  whole.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, reload: true }));
  const before = whole.p.arms[1].clip;
  whole.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, fire: true }));
  ok(whole.p.arms[1].clip === before, 'a whole clip reload cannot be interrupted by firing');
  hold(whole.g, 1.02, { yaw: 0, pitch: 0.3 });
  ok(whole.p.arms[1].clip === 12 && whole.p.arms[1].reserve === 35, 'the pistol takes the whole clip at once');

  const dry = armed('diver', null);
  dry.p.arms[0].clip = 0;
  dry.p.arms[0].reserve = 0;
  const types = [];
  for (let i = 0; i < 5; i++) {
    dry.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, fire: true }));
    for (const ev of dry.g.events) types.push(ev.type);
  }
  ok(types.includes('dry') && !types.includes('shot'), 'without ammo the weapon clicks');

  const sw = armed('runner', 1.5);
  ok(sw.p.slot === 0, 'the first slot is in hand');
  sw.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 2 }));
  ok(sw.p.slot === 1 && sw.p.deployT > 0, 'a digit takes the weapon');
  ok(shoot(sw.g, 20, { fire: true }).length === 0, 'the weapon is not ready while it comes up');
  ok(shoot(sw.g, 30, { fire: true }).length > 0, 'the weapon fires after 0.5 s');
  sw.g.step(Object.assign(T.blankInput(), { yaw: EAST, last: true }));
  ok(sw.p.slot === 0, 'Q returns to the last weapon');
  sw.g.step(Object.assign(T.blankInput(), { yaw: EAST, next: 1 }));
  ok(sw.p.slot === 1, 'the wheel goes forward');
  sw.g.step(Object.assign(T.blankInput(), { yaw: EAST, next: -1 }));
  sw.g.step(Object.assign(T.blankInput(), { yaw: EAST, next: -1 }));
  ok(sw.p.slot === 2, 'the wheel wraps around');
  const r = armed('runner', null);
  for (let i = 0; i < 40; i++) r.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, fire: i === 0 }));
  r.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, reload: true }));
  ok(r.p.reloading, 'the sawn-off reloads');
  r.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, slot: 3 }));
  ok(!r.p.reloading && r.p.arms[0].clip === 5, 'switching stops the reload and keeps the clip');
  ok(T.MERC_ORDER.every(id => armed(id, null).p.arms.length > 0), 'every mercenary has a kit');
}

{
  const jump = (opts = {}) => {
    const { g, p } = lab(opts.merc || 'diver');
    settle(g, p);
    const yaw = opts.yaw === undefined ? EAST : opts.yaw;
    const x0 = p.pos.x;
    if (opts.run) hold(g, 0.5, { fwd: 1, yaw: EAST });
    const start = p.pos.x;
    let peak = 0, hurtBy = 0, landed = null;
    const hp0 = p.hp;
    for (let i = 0; i < 300 && landed === null; i++) {
      g.step(Object.assign(T.blankInput(), {
        yaw: i === 0 || !opts.run ? yaw : EAST,
        pitch: opts.pitch === undefined ? -1.48 : opts.pitch,
        jump: !opts.stand && i === 0,
        fire: i === 0,
        crouch: i >= 1 && !opts.stand,
        fwd: opts.run ? 1 : 0
      }));
      for (const ev of g.events) if (ev.type === 'hurt' && ev.cause === 'weapon') hurtBy += ev.amount;
      peak = Math.max(peak, p.pos.y);
      if (p.onGround && i > 8) landed = p.pos.x;
    }
    return { peak, self: hurtBy, len: landed - start, hp0, x0 };
  };
  const up = jump();
  ok(up.peak >= 6 && up.peak <= 7.3, 'a rocket jump reaches 6–7 m: ' + up.peak);
  ok(up.self >= 27 && up.self <= 46, 'a rocket jump costs 27–46: ' + up.self);

  const along = jump({ run: true, yaw: EAST + Math.PI, pitch: -1.1 });
  ok(along.len >= 15 && along.len <= 20, 'a running rocket jump goes 15–20 m: ' + along.len);

  const stand = jump({ stand: true });
  ok(stand.self > 46 && stand.self <= 89, 'a rocket at your own feet on the ground costs more: ' + stand.self);
  ok(stand.peak > 0.8 && stand.peak < up.peak, 'a rocket at your feet throws you up: ' + stand.peak);

  const push = (merc) => {
    const { g, p } = lab('diver');
    settle(g, p);
    place(p, 0, 0, 0, EAST);
    p.onGround = true;
    const foe = g.addHero(merc, 'cold', false);
    foe.pos.x = 5; foe.pos.y = 0; foe.pos.z = 0;
    foe.prev.x = 5; foe.prev.y = 0; foe.prev.z = 0;
    let top = 0, far = 0;
    for (let i = 0; i < 120; i++) {
      g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: i === 0 }));
      top = Math.max(top, foe.pos.y);
      far = Math.max(far, foe.pos.x);
    }
    return { top, far, hp: foe.hp, max: foe.maxHp };
  };
  const light = push('runner'), heavy = push('strongman');
  ok(light.top > 0.5 && light.far > 6, 'a direct rocket lifts and throws an enemy');
  ok(heavy.top < light.top && heavy.far < light.far, 'the strongman flies less');
  ok(light.hp < light.max, 'the enemy takes damage');

  const fatal = lab('diver');
  settle(fatal.g, fatal.p);
  fatal.p.hp = 10;
  const types = [];
  for (let i = 0; i < 30; i++) {
    fatal.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -1.48, fire: i === 0 }));
    for (const ev of fatal.g.events) types.push(ev.type);
  }
  ok(types.includes('death') && fatal.p.hp === fatal.p.maxHp, 'your own rocket can kill you, and you come back');

  const friend = lab('diver');
  settle(friend.g, friend.p);
  place(friend.p, 0, 0, 0, EAST);
  friend.p.onGround = true;
  const buddy = friend.g.addHero('runner', 'hot', false);
  buddy.pos.x = 0.5; buddy.pos.y = 0; buddy.pos.z = 1;
  for (let i = 0; i < 40; i++) friend.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -1.48, fire: i === 0 }));
  ok(buddy.hp === buddy.maxHp && buddy.pos.y === 0 && buddy.vel.x === 0, 'a blast does not touch your own side');
}

{
  const table = [
    ['carousel', 13.5, 9, 4.752, 27, 12.15, 18.225],
    ['smg', 12, 8, 4.224, 24, 10.8, 16.2],
    ['drench', 12, 10, 5.28, 30, 13.5, 16.2],
    ['plunger', 144, 120, 63.36, 360, 162, 194.4],
    ['lobber', 100, 100, 100, 300, 135, 135],
    ['hammer', 65, 65, 65, 195, 87.75, 87.75],
    ['pick', 65, 65, 65, 195, 87.75, 87.75],
    ['fists', 65, 65, 65, 195, 87.75, 87.75],
    ['hacksaw', 65, 65, 65, 195, 87.75, 87.75],
    ['pchak', 65, 65, 65, 195, 87.75, 87.75]
  ];
  for (const [id, close, mid, far, crit, miniFar, miniClose] of table) {
    const def = T.WEAPONS[id];
    near(T.hitDamage(def, 0, null), close, 1e-6, id + ' at point blank');
    near(T.hitDamage(def, 512, null), mid, 1e-6, id + ' at 512 units');
    near(T.hitDamage(def, 1024, null), far, 1e-6, id + ' at 1024 units');
    near(T.hitDamage(def, 0, 'crit'), crit, 1e-6, id + ' crit');
    near(T.hitDamage(def, 1024, 'mini'), miniFar, 1e-6, id + ' mini-crit far');
    near(T.hitDamage(def, 0, 'mini'), miniClose, 1e-6, id + ' mini-crit close');
  }
  const torch = T.WEAPONS.torch;
  near(T.flameDamage(torch, 0, 1, null), 13, 1e-9, 'a flame deals 13 up close');
  near(T.flameDamage(torch, 1, 1, null), 6.5, 1e-9, 'a flame deals 6.5 at the edge');
  near(T.flameDamage(torch, 0, 0.5, null), 6.5, 1e-9, 'a fresh flame deals half');
  near(T.flameDamage(torch, 0, 1, 'crit'), 19.5, 1e-9, 'a flame crit at full ramp');
  near(T.flameDamage(torch, 0, 0.5, 'crit'), 9.75, 1e-9, 'a flame crit at the start');
  near(T.flameDamage(torch, 0, 1, 'mini'), 8.775, 1e-9, 'a flame mini-crit at full ramp');
  near(T.flameDamage(torch, 0, 0.5, 'mini'), 4.3875, 1e-9, 'a flame mini-crit at the start');
  const rifle = T.WEAPONS.rifle;
  near(T.rifleDamage(rifle, 0, false, null), 50, 1e-9, 'the rifle body shot without charge');
  near(T.rifleDamage(rifle, 1, false, null), 150, 1e-9, 'the rifle body shot at full charge');
  near(T.rifleDamage(rifle, 0, true, null), 150, 1e-9, 'the rifle head shot without charge');
  near(T.rifleDamage(rifle, 1, true, null), 450, 1e-9, 'the rifle head shot at full charge');
  near(T.rifleDamage(rifle, 0, false, 'mini'), 67.5, 1e-9, 'the rifle mini-crit without charge');
  near(T.rifleDamage(rifle, 1, false, 'mini'), 202.5, 1e-9, 'the rifle mini-crit at full charge');

  const rules = {
    lobber: [4, 16, 0.6, [1.24, 0.6]], plunger: [8, 24, 0.6, [1.09, 0.67]], drench: [40, 150, 0.105, [1.305]], smg: [25, 75, 0.105, [1.1]]
  };
  for (const id in rules) {
    const w = T.WEAPONS[id], [clip, reserve, interval, reload] = rules[id];
    ok(w.clip === clip && w.reserve === reserve && w.interval === interval, id + ' clip, reserve and interval');
    assert.deepEqual(w.reload, reload, id + ' reload times');
    checks++;
  }
  ok(torch.reserve === 200 && torch.blastCost === 20 && torch.blastCd === 0.75 && torch.ammoRate === 12.5, 'the torch ammo and blast');
  ok(T.WEAPONS.carousel.reserve === 200 && T.WEAPONS.carousel.interval === 0.105 && T.WEAPONS.carousel.spinUp === 0.75 && T.WEAPONS.carousel.spinDown === 1.15, 'the carousel timing');
  ok(rifle.reserve === 25 && rifle.interval === 1.5 && rifle.chargeTime === 3, 'the rifle timing');
  ok(T.WEAPONS.sandwich.eatTime === 4.25 && T.WEAPONS.sandwich.heal === 300 && T.WEAPONS.sandwich.cooldown === 30, 'the sandwich numbers');
  near(T.WEAPONS.hose.range, T.hu(450), 1e-9, 'the beam starts at 450 units');
  near(T.WEAPONS.hose.breakAt, T.hu(540), 1e-9, 'the beam breaks at 540 units');
  near(T.WEAPONS.lobber.speed, T.hu(1216), 1e-9, 'the grenade flies 1216 units a second');
  near(T.WEAPONS.plunger.speed, T.hu(805), 1e-9, 'the mine leaves at 805 units a second');
  near(T.WEAPONS.drench.speed, T.hu(990), 1e-9, 'the syringe flies 990 units a second');

  const kits = {
    runner: ['sawn', 'pistol', 'pump'], diver: ['tube', 'shotgun', 'gaff'], welder: ['torch', 'shotgun', 'hammer'], miner: ['lobber', 'plunger', 'pick'],
    strongman: ['carousel', 'sandwich', 'fists'], vet: ['drench', 'hose', 'hacksaw'], hunter: ['rifle', 'smg', 'pchak']
  };
  for (const id in kits) {
    assert.deepEqual(T.MERCS[id].slots, kits[id], 'the kit of ' + id);
    checks++;
    for (const w of kits[id]) ok(T.WEAPONS[w] && T.KINDS[T.WEAPONS[w].kind], 'the weapon exists: ' + w);
  }
  const fire = armed('welder', null);
  ok(fire.p.arms[1].def.reload[0] === 1.035 && T.WEAPONS.shotgun.reload[0] === 1.005, 'a kit can change a weapon for one mercenary without touching the library');
  ok(!read('js/apps/tf98/tf-weapons.js').match(/runner|diver|welder|strongman|plumber|hunter|inspector|knight/), 'weapons still know nothing about mercenaries');
}

{
  const close = armed('welder', 2);
  const flames = shoot(close.g, 3, { fire: true });
  ok(flames.length > 0, 'the stream reaches 2 m');
  const first = flames[0].amount;
  const expectFirst = T.flameDamage(T.WEAPONS.torch, 1.5 / T.WEAPONS.torch.range, 0.5, null);
  near(first, expectFirst, 1.5, 'the first flame starts from half');
  const later = shoot(close.g, 60, { fire: true }).filter(h => h.weapon === 'torch');
  ok(later[later.length - 1].amount > first * 1.7, 'after 0.9 s the flame is twice as strong');
  ok(shoot(armed('welder', 8).g, 40, { fire: true }).length === 0, 'the stream does not reach 8 m');
  ok(shoot(armed('welder', 6).g, 40, { fire: true }).length > 0, 'the stream reaches 6 m');
  ok(shoot(armed('welder', 3, { build: B => B.box(1.5, 0, -3, 1.8, 4, 3, 'wall') }).g, 40, { fire: true }).length === 0, 'a wall stops the stream');

  const drain = armed('welder', null);
  for (let i = 0; i < 120; i++) drain.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  near(200 - drain.p.arms[0].reserve, 25, 1, 'the stream burns 12.5 a second');
  drain.p.arms[0].reserve = 0;
  const silent = [];
  for (let i = 0; i < 10; i++) { drain.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true })); silent.push(drain.p.flaming); }
  ok(!silent.some(Boolean), 'an empty tank gives no fire');

  const burn = armed('welder', 3);
  const dummy = burn.dummy;
  dummy.hp = dummy.maxHp = 1e6;
  hold(burn.g, 0.2, { yaw: EAST, fire: true });
  ok(dummy.burnT >= 3 - 0.3, 'fire sets a burn of at least 3 s: ' + dummy.burnT);
  hold(burn.g, 3, { yaw: EAST, fire: true });
  ok(dummy.burnT > 9, 'long contact stretches the burn to 10 s: ' + dummy.burnT);
  ok(dummy.burnT <= 10, 'the burn stops at 10 s');
  const ticking = armed('welder', 3);
  hold(ticking.g, 0.1, { yaw: EAST, fire: true });
  const burned = [];
  for (let i = 0; i < 120; i++) {
    ticking.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
    for (const ev of ticking.g.events) if (ev.type === 'hit' && ev.weapon === null) burned.push(ev.amount);
  }
  ok(burned.length === 4 && burned.every(v => v === 4), 'a burn takes 4 twice a second: ' + burned.length);
  hold(ticking.g, 2, { yaw: EAST });
  ok(ticking.dummy.burnT <= 0, 'the burn ends');

  const immune = armed('welder', 3, { foe: 'welder' });
  hold(immune.g, 0.3, { yaw: EAST, fire: true });
  ok(immune.dummy.burnT === 0, 'a welder does not burn');

  const wet = lab('diver');
  settle(wet.g, wet.p);
  wet.g.ignite(wet.p, wet.p, T.WEAPONS.torch);
  wet.p.level = 2;
  hold(wet.g, 0.05, { yaw: EAST });
  ok(wet.p.burnT === 0, 'deep water puts the fire out');
  const POOLED = B => { B.floor(-5, -5, 5, 5, -3, 'plate', { t: 1 }); B.water(-5, -5, 5, 5, -3, 0); };
  const dunk = lab('diver', POOLED, [[-5, -5, 5, 5]]);
  place(dunk.p, 0, -1.5, 0, EAST);
  dunk.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  dunk.g.ignite(dunk.p, dunk.p, T.WEAPONS.torch);
  ok(dunk.p.burnT === 0, 'nothing burns in deep water');

  const POOLS = B => { B.floor(10, -5, 20, 5, -3, 'plate', { t: 1 }); B.water(10, -5, 20, 5, -3, 0); B.water(-20, -5, -10, 5, 0, 0.3); };
  const POOL_HOLES = [[10, -5, 20, 5]];
  const hotSpot = (x, y) => {
    const s = lab('diver', POOLS, POOL_HOLES);
    settle(s.g, s.p);
    s.g.ignite(s.p, s.p, T.WEAPONS.torch);
    ok(s.p.burnT > 0, 'the body burns on dry ground');
    place(s.p, x, y, 0, EAST);
    hold(s.g, 0.1, { yaw: EAST });
    return s.p;
  };
  ok(hotSpot(15, -1.5).burnT === 0, 'a burning body falling into deep water goes out');
  const ankle = hotSpot(-15, 0);
  ok(ankle.level === 1 && ankle.burnT === 0, 'so does one stepping into shallow water');
  const wade = lab('diver', POOLS, POOL_HOLES);
  place(wade.p, -15, 0, 0, EAST);
  hold(wade.g, 0.1, { yaw: EAST });
  wade.g.ignite(wade.p, wade.p, T.WEAPONS.torch);
  ok(wade.p.burnT === 0, 'nothing catches fire standing in shallow water');

  const kits = B => { B.health(40, 0, 0.2); B.health(50, 0, 0.5); B.health(60, 0, 1); B.ammo(70, 0, 1); };
  const atKit = (x, hp, burning) => {
    const s = lab('diver', kits);
    settle(s.g, s.p);
    s.p.hp = hp;
    if (burning) s.g.ignite(s.p, s.p, T.WEAPONS.torch);
    place(s.p, x, 0, 0, EAST);
    s.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
    const item = s.g.pickups.find(p => p.x === x);
    return { p: s.p, used: item.readyAt > 0 };
  };
  for (const [x, size] of [[40, 0.2], [50, 0.5], [60, 1]]) {
    const hurt = atKit(x, 50, true);
    ok(hurt.used && hurt.p.burnT === 0, 'a health item of size ' + size + ' puts the fire out');
    near(hurt.p.hp, Math.min(200, 50 + 200 * size), 1e-6, 'and heals as usual');
    const whole = atKit(x, 200, true);
    ok(whole.used && whole.p.burnT === 0, 'a burning body at full health takes it too');
    ok(whole.p.hp === 200, 'and gets no extra health');
    ok(!atKit(x, 200, false).used, 'one not burning at full health leaves it');
    const over = atKit(x, 280, true);
    ok(over.used && over.p.hp > 270 && over.p.burnT === 0, 'overheal survives it: ' + over.p.hp);
  }
  const crate = atKit(70, 200, true);
  ok(crate.p.burnT > 0, 'an ammo crate does not put the fire out');

  const lunch = lab('strongman');
  settle(lunch.g, lunch.p);
  lunch.g.ignite(lunch.p, lunch.p, T.WEAPONS.torch);
  ok(lunch.g.takeItem(lunch.p, { kind: 'health', size: 0.5, sandwich: true, owner: lunch.p }) && lunch.p.burnT === 0, 'your own sandwich puts it out');
  const shared = lab('diver');
  settle(shared.g, shared.p);
  shared.g.ignite(shared.p, shared.p, T.WEAPONS.torch);
  ok(shared.g.takeItem(shared.p, { kind: 'health', size: 0.5, sandwich: true, owner: lunch.p }) && shared.p.burnT === 0, 'so does a friend\'s');
}

{
  const scene = lab('welder', null, null, 'hot');
  const pyro = scene.p, g = scene.g;
  settle(g, pyro);
  place(pyro, 0, 0, 0, EAST);
  pyro.onGround = true;
  const foe = g.addHero('diver', 'cold', false);
  foe.pos.x = 30; foe.pos.y = 0; foe.pos.z = 0;
  foe.yaw = -EAST;
  const rocket = g.launch(foe, T.WEAPONS.tube, null, T.WEAPONS.tube.speed);
  for (let i = 0; i < 300 && Math.hypot(rocket.x - pyro.pos.x, rocket.z - pyro.pos.z) > 4; i++) g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  const before = pyro.arms[0].reserve;
  g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  ok(pyro.arms[0].reserve === before - 20, 'a blast takes 20 from the tank');
  ok(rocket.team === 'hot' && rocket.owner === pyro && rocket.boost === 'mini', 'a blast turns the rocket and makes it a mini-crit');
  ok(rocket.vx > 0, 'the rocket flies where the welder looks');
  const cd = pyro.fireCd;
  ok(cd > 0.7, 'a blast has a delay of 0.75 s');
  const reloadedAt = pyro.arms[0].reserve;
  for (let i = 0; i < 20; i++) g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  ok(pyro.arms[0].reserve === reloadedAt, 'no second blast before the delay ends');

  const hit = armed('welder', 12);
  const foe2 = hit.g.addHero('diver', 'cold', false);
  foe2.pos.x = 40; foe2.pos.y = 0; foe2.pos.z = 5;
  foe2.yaw = -EAST;
  const r2 = hit.g.launch(foe2, T.WEAPONS.tube, null, T.WEAPONS.tube.speed);
  r2.x = 3; r2.y = 1.4; r2.z = 0; r2.vx = -T.WEAPONS.tube.speed; r2.vy = 0; r2.vz = 0;
  hit.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  const out = [];
  for (let i = 0; i < 60; i++) {
    hit.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
    for (const ev of hit.g.events) if (ev.type === 'hit' && ev.dst === hit.dummy.id) out.push(ev);
  }
  ok(out.length === 1 && out[0].boost === 'mini', 'the returned rocket hits as a mini-crit');
  near(out[0].amount, T.hitDamage(T.WEAPONS.tube, hit.g.distanceHu(hit.p, hit.dummy), 'mini'), 1e-6, 'its damage counts from the welder');

  const push = lab('welder');
  settle(push.g, push.p);
  place(push.p, 0, 0, 0, EAST);
  push.p.onGround = true;
  const body = push.g.addHero('runner', 'cold', false);
  body.pos.x = 2; body.pos.y = 0; body.pos.z = 0;
  push.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  ok(body.vel.x > 5 && body.vel.y > 2, 'a blast throws an enemy away and up');
  const hp0 = body.hp;
  ok(hp0 === body.maxHp, 'a blast does no damage');

  const friend = lab('welder');
  settle(friend.g, friend.p);
  place(friend.p, 0, 0, 0, EAST);
  friend.p.onGround = true;
  friend.p.hp = 100;
  const buddy = friend.g.addHero('runner', 'hot', false);
  buddy.pos.x = 2; buddy.pos.y = 0; buddy.pos.z = 0;
  friend.g.ignite(buddy, friend.p, T.WEAPONS.torch);
  friend.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  ok(buddy.burnT === 0, 'a blast puts out your own side');
  near(friend.p.hp, 120, 1e-6, 'putting out a friend gives 20 health');
  ok(buddy.vel.x === 0, 'a blast does not throw your own side');

  const needle = lab('welder');
  settle(needle.g, needle.p);
  place(needle.p, 0, 0, 0, EAST);
  needle.p.onGround = true;
  const shooter = needle.g.addHero('vet', 'cold', false);
  shooter.pos.x = 30; shooter.yaw = -EAST;
  const n = needle.g.launch(shooter, T.WEAPONS.drench, null, T.WEAPONS.drench.speed);
  n.x = 2; n.y = 1.4; n.z = 0; n.vx = -1; n.vy = 0; n.vz = 0;
  needle.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  ok(n.team === 'cold', 'a blast does not turn a syringe');
}

const mineOf = (merc = 'miner', opts = {}) => {
  const t = armed(merc, opts.dist === undefined ? null : opts.dist, Object.assign({ slot: 2 }, opts));
  return t;
};
const drop = (t, inp) => {
  for (let i = 0; i < 2; i++) t.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -1.48, fire: i === 0 }, inp));
};

{
  const g1 = armed('miner', 8);
  const direct = shoot(g1.g, 60, { pitch: -0.03 });
  ok(direct.length === 1, 'a grenade hits an enemy before it touches the ground');
  near(direct[0].amount, 100, 1e-6, 'a direct grenade deals 100 at any distance');

  const fuse = armed('miner', null);
  const events = [];
  for (let i = 0; i < 200; i++) {
    fuse.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -0.3, fire: i === 0 }));
    for (const ev of fuse.g.events) if (ev.type === 'boom') events.push(i);
  }
  ok(events.length === 1, 'a grenade blows up once');
  near(events[0] / 60, 2.3, 0.05, 'the fuse takes 2.3 s');

  const bouncy = armed('miner', null);
  bouncy.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -0.2, fire: true }));
  const shell = bouncy.g.proj[0];
  for (let i = 0; i < 40; i++) bouncy.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -0.2 }));
  ok(shell.bounced && !shell.dead, 'a grenade bounces off the ground without blowing up');
  const late = armed('miner', 5);
  const shell2 = (() => { late.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -0.2, fire: true })); return late.g.proj[0]; })();
  shell2.bounced = true;
  shell2.x = 3; shell2.y = 1; shell2.z = 0; shell2.vx = 8; shell2.vy = 0; shell2.vz = 0;
  const lateHits = [];
  for (let i = 0; i < 40; i++) {
    late.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -0.2 }));
    for (const ev of late.g.events) if (ev.type === 'boom' && i < 30) lateHits.push(ev);
  }
  ok(lateHits.length === 0 && shell2.vx < 0, 'after a bounce it rolls off an enemy instead of blowing up');

  const splash = armed('miner', 2, { z: 0 });
  splash.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -1.48, fire: true }));
  const got = [];
  for (let i = 0; i < 160; i++) {
    splash.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -1.48 }));
    for (const ev of splash.g.events) if (ev.type === 'hit' && ev.dst === splash.dummy.id) got.push(ev.amount);
  }
  ok(got.length === 1 && got[0] <= 60 && got[0] >= 30, 'the blast of a fuse deals up to 60: ' + got[0]);

  const selfG = lab('miner');
  settle(selfG.g, selfG.p);
  let selfHurt = 0;
  for (let i = 0; i < 200; i++) {
    selfG.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -1.48, fire: i === 0 }));
    for (const ev of selfG.g.events) if (ev.type === 'hurt' && ev.cause === 'weapon') selfHurt += ev.amount;
  }
  ok(selfHurt >= 38 && selfHurt <= 73, 'your own grenade costs 38–73: ' + selfHurt);
}

{
  const t = mineOf();
  ok(t.p.slot === 1, 'the mine launcher is in hand');
  t.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -1.2, fire: true }));
  ok(t.g.proj.length === 0 && t.p.chargeT > 0, 'holding the button charges and does not fire');
  t.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -1.2 }));
  ok(t.g.proj.length === 1 && t.p.arms[1].clip === 7, 'letting go fires one mine');
  const mine = t.g.proj[0];
  hold(t.g, 0.3, { yaw: EAST, pitch: -1.2 });
  ok(mine.stuck, 'a mine sticks to the floor');
  const boomsAt = () => { const out = []; return out; };
  boomsAt();
  mine.armT = 0.2;
  const early = [];
  t.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -1.2, fire2: true }));
  for (const ev of t.g.events) if (ev.type === 'boom') early.push(ev);
  ok(early.length === 0 && !mine.dead, 'a mine cannot be set off before 0.7 s');
  hold(t.g, 0.3, { yaw: EAST, pitch: -1.2 });
  const later = [];
  t.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -1.2, fire2: true }));
  for (const ev of t.g.events) if (ev.type === 'boom') later.push(ev);
  ok(later.length === 1, 'the right button sets off an armed mine');

  const far = (ticks) => {
    const a = mineOf();
    for (let i = 0; i <= ticks; i++) a.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: 0.2, fire: i < ticks }));
    const m = a.g.proj[0];
    for (let i = 0; i < 300 && !m.stuck; i++) a.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: 0.2 }));
    return m.x;
  };
  const near0 = far(1), far4 = far(239);
  ok(far4 > near0 * 2.5, 'a charged mine flies much farther: ' + near0 + ' and ' + far4);

  const auto = mineOf();
  let fired = -1;
  for (let i = 0; i < 260 && fired < 0; i++) {
    auto.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -1.2, fire: true }));
    if (auto.g.proj.length) fired = i;
  }
  near(fired / 60, 4, 0.05, 'after 4 s the mine leaves by itself');

  const many = mineOf();
  many.p.arms[1].clip = 9;
  many.p.arms[1].def = Object.assign({}, many.p.arms[1].def, { clip: 9, reload: [99, 99] });
  let booms = 0;
  for (let i = 0; i < 9; i++) {
    many.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -0.7, fire: true }));
    many.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -0.7 }));
    for (const ev of many.g.events) if (ev.type === 'boom') booms++;
    for (let j = 0; j < 40; j++) {
      many.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -0.7 }));
      for (const ev of many.g.events) if (ev.type === 'boom') booms++;
    }
  }
  ok(many.g.proj.filter(p => p.def.flight === 'mine').length === 8, 'no more than 8 mines at once');
  ok(booms === 1, 'the ninth sets off the oldest: ' + booms);

  const enemy = mineOf('miner', { dist: 4 });
  enemy.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: 0.1, fire: true }));
  enemy.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: 0.1 }));
  const flying = enemy.g.proj[0];
  flying.x = 3; flying.y = 1; flying.z = 0; flying.vx = 8; flying.vy = 0; flying.vz = 0;
  hold(enemy.g, 0.3, { yaw: EAST, pitch: 0.1 });
  ok(!flying.dead && flying.vx < 0, 'a mine bounces off an enemy');

  const doorScene = B => B.door(3, -3, 3, 3, 3, 'cold');
  const atDoor = armed('miner', null, { slot: 2, build: doorScene });
  atDoor.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: 0.05, fire: true }));
  atDoor.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: 0.05 }));
  const atm = atDoor.g.proj[0];
  hold(atDoor.g, 0.2, { yaw: EAST, pitch: 0.05 });
  ok(atm.vx < 0 || atm.x < 2.9, 'a mine does not stick to a door');

  const wallScene = B => B.box(3, 0, -3, 3.3, 4, 3, 'wall');
  const atWall = armed('miner', null, { slot: 2, build: wallScene });
  atWall.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: 0.05, fire: true }));
  atWall.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: 0.05 }));
  const onWall = atWall.g.proj[0];
  hold(atWall.g, 0.4, { yaw: EAST, pitch: 0.05 });
  ok(onWall.stuck && onWall.x < 3, 'a mine sticks to a wall');

  const dmgAt = (age) => {
    const a = mineOf('miner', { dist: 30 });
    a.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: -0.6, fire: true }));
    a.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: -0.6 }));
    const m = a.g.proj[0];
    hold(a.g, 0.5, { yaw: 0, pitch: -0.6 });
    m.x = 29; m.y = 0.1; m.z = 0;
    m.age = age;
    m.armT = 0;
    const out = [];
    a.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: -0.6, fire2: true }));
    for (const ev of a.g.events) if (ev.type === 'hit' && ev.dst === a.dummy.id) out.push(ev.amount);
    return out[0];
  };
  const young = dmgAt(1), old = dmgAt(6);
  ok(young < 70, 'a young mine falls off with distance: ' + young);
  ok(old > 90, 'a mine older than 5 s keeps its base damage: ' + old);

  const owner = mineOf();
  owner.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -1.2, fire: true }));
  owner.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -1.2 }));
  ok(owner.g.proj.length === 1, 'the mine is out');
  owner.g.respawn(owner.p);
  owner.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  ok(owner.g.proj.length === 0, 'mines disappear when the owner dies');

  const shootMine = armed('diver', null, { slot: 2 });
  const foe = shootMine.g.addHero('miner', 'cold', false);
  foe.pos.x = 40;
  foe.yaw = -EAST;
  const target = shootMine.g.launch(foe, T.WEAPONS.plunger, null, 1);
  target.x = 5; target.y = 1.4; target.z = 0; target.vx = 0; target.vy = 0; target.vz = 0; target.stuck = true;
  const pellets = [];
  for (let i = 0; i < 3; i++) {
    shootMine.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: i === 0 }));
    for (const ev of shootMine.g.events) pellets.push(ev.type);
  }
  ok(pellets.includes('fizzle') && shootMine.g.proj.length === 0, 'bullets destroy an enemy mine');

  const blastMine = lab('diver');
  settle(blastMine.g, blastMine.p);
  const foe2 = blastMine.g.addHero('miner', 'cold', false);
  foe2.pos.x = 40; foe2.yaw = -EAST;
  const mb = blastMine.g.launch(foe2, T.WEAPONS.plunger, null, 1);
  mb.x = 1; mb.y = 0.1; mb.z = 1; mb.vx = 0; mb.vy = 0; mb.vz = 0; mb.stuck = true;
  blastMine.g.blast(1, 0.1, 0, blastMine.p, T.WEAPONS.tube, null, null, false);
  ok(!mb.dead && !mb.stuck && mb.vz > 0, 'an enemy blast pushes a mine without setting it off');

  const peak = (merc) => {
    const m = lab(merc);
    settle(m.g, m.p);
    m.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 2 }));
    hold(m.g, 0.6, { yaw: EAST, pitch: -1.48 });
    m.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -1.48, fire: true }));
    m.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -1.48 }));
    hold(m.g, 1, { yaw: EAST, pitch: -1.48 });
    ok(m.g.proj.length === 1 && m.g.proj[0].stuck && m.g.proj[0].armT <= 0, 'the mine is armed under the feet');
    let top = 0, selfHurt = 0;
    for (let i = 0; i < 300; i++) {
      m.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -1.48, jump: i === 0, fire2: i === 0, crouch: i >= 1 && !(m.p.onGround && i > 8) }));
      top = Math.max(top, m.p.pos.y);
      for (const ev of m.g.events) if (ev.type === 'hurt' && ev.cause === 'weapon') selfHurt += ev.amount;
      if (m.p.onGround && i > 8) break;
    }
    return { top, selfHurt };
  };
  const jump = peak('miner');
  ok(jump.top >= 10 && jump.top <= 12.3, 'a mine jump reaches 10–12 m: ' + jump.top);
  ok(jump.selfHurt >= 45 && jump.selfHurt <= 114, 'a mine jump costs 45–114: ' + jump.selfHurt);
}

{
  const spin = armed('strongman', 5);
  const none = shoot(spin.g, 40, { fire: true });
  ok(none.length === 0, 'no bullets before the barrels spin up');
  ok(spin.p.spinUp > 0.6, 'the barrels are spinning');
  const firstHits = shoot(spin.g, 12, { fire: true });
  ok(firstHits.length > 0, 'bullets after 0.75 s');
  const amountStart = firstHits[0].amount;
  const expectFull = 4 * T.hitDamage(T.WEAPONS.carousel, spin.g.distanceHu(spin.p, spin.dummy), null);
  ok(amountStart < expectFull * 0.75, 'the first second is weak: ' + amountStart + ' of ' + expectFull);
  const lateHits = shoot(spin.g, 90, { fire: true });
  near(lateHits[lateHits.length - 1].amount, expectFull, expectFull * 0.27, 'after a second it hits at full strength');
  const a = spin.p.arms[0];
  ok(a.reserve < 200, 'firing takes ammo');
  const r0 = a.reserve;
  hold(spin.g, 1, { yaw: EAST, fire: true });
  near(r0 - a.reserve, 1 / 0.105, 1.5, 'it fires about every 0.105 s');

  const rev = armed('strongman', null);
  hold(rev.g, 1.5, { yaw: 0, pitch: 0.3, fire2: true });
  ok(rev.p.spinUp >= 0.75 && rev.p.arms[0].reserve === 200, 'the right button spins without firing');
  rev.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, fire2: true }));
  hold(rev.g, 0.2, { yaw: EAST, fwd: 1, fire2: true });
  hold(rev.g, 1, { yaw: EAST, fwd: 1, fire2: true });
  const x0 = rev.p.pos.x;
  hold(rev.g, 1, { yaw: EAST, fwd: 1, fire2: true });
  near(rev.p.pos.x - x0, T.hu(110), T.hu(110) * 0.02, 'a spinning strongman walks at 110 units');
  const y0 = rev.p.pos.y;
  hold(rev.g, 0.3, { yaw: EAST, fire2: true, jump: true });
  ok(rev.p.pos.y === y0, 'a spinning strongman cannot jump');
  hold(rev.g, 1, { yaw: EAST });
  ok(rev.p.spinUp > 0, 'the barrels are still spinning down after 1 s');
  ok(rev.p.speedCap < T.MERCS.strongman.speed, 'slow while the barrels spin down');
  hold(rev.g, 0.3, { yaw: EAST });
  ok(rev.p.spinUp === 0, 'the barrels stop after 1.15 s');
  hold(rev.g, 0.1, { yaw: EAST });
  ok(rev.p.speedCap === Infinity, 'the strongman walks freely again');

  const dryRun = armed('strongman', null);
  dryRun.p.arms[0].reserve = 0;
  const seen = [];
  for (let i = 0; i < 70; i++) {
    dryRun.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, fire: true }));
    for (const ev of dryRun.g.events) seen.push(ev.type);
  }
  ok(seen.includes('dry') && !seen.includes('shot'), 'without ammo the barrels only click');
}

{
  const eat = armed('strongman', null, { slot: 2 });
  const p = eat.p, a = p.arms[1];
  p.hp = 100;
  eat.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(p.eatT > 4 && a.cooldown === 0, 'eating starts');
  hold(eat.g, 0.2, { yaw: EAST, fwd: 1, jump: true });
  ok(p.frozen && Math.abs(p.pos.x) < 1e-6 && p.pos.y === 0, 'an eating strongman stands still');
  hold(eat.g, 4.1, { yaw: EAST, fwd: 0 });
  near(p.hp, 300, 1e-6, 'a meal heals up to full health');
  ok(!p.frozen && a.cooldown > 29, 'after the meal the sandwich needs 30 s');
  eat.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(p.eatT === 0, 'no second meal while it recharges');
  hold(eat.g, 30, { yaw: EAST });
  ok(a.cooldown === 0, 'it recharges in 30 s');

  const over = armed('strongman', null, { slot: 2 });
  over.p.hp = 290;
  over.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  hold(over.g, 4.5, { yaw: EAST });
  ok(over.p.hp === 300, 'a meal gives no overheal');
  const full = armed('strongman', null, { slot: 2 });
  full.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  hold(full.g, 4.5, { yaw: EAST });
  ok(full.p.arms[1].cooldown === 0, 'a meal at full health is not used up');

  const thrown = armed('strongman', null, { slot: 2 });
  thrown.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  ok(thrown.g.drops.length === 1 && thrown.p.arms[1].cooldown > 29, 'the right button throws it');
  hold(thrown.g, 1, { yaw: EAST });
  const item = thrown.g.drops[0];
  ok(!item.moving && item.y < 0.3 && item.x > 1, 'it lands ahead on the ground');
  hold(thrown.g, 0.5, { yaw: EAST });
  thrown.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: false }));
  thrown.p.arms[1].cooldown = 0;
  thrown.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  ok(thrown.g.drops.length === 1, 'only one sandwich on the ground');
  const heals = (merc, team) => {
    const t = armed('strongman', null, { slot: 2 });
    t.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
    hold(t.g, 1, { yaw: EAST });
    const other = t.g.addHero(merc, team, false);
    other.pos.x = t.g.drops[0].x; other.pos.y = 0; other.pos.z = t.g.drops[0].z;
    other.hp = 10;
    t.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
    return other;
  };
  const ally = heals('runner', 'hot');
  near(ally.hp, 10 + 125 * 0.5, 1e-6, 'a friend gets half of their health');
  const enemy = heals('runner', 'cold');
  near(enemy.hp, 10 + 125 * 0.5, 1e-6, 'an enemy can take it too');
  const mine = armed('strongman', null, { slot: 2 });
  mine.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  hold(mine.g, 1, { yaw: EAST });
  mine.p.hp = 100;
  mine.p.pos.x = mine.g.drops[0].x; mine.p.pos.z = mine.g.drops[0].z;
  mine.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  ok(mine.p.hp < 101 && mine.p.arms[1].cooldown === 0 && mine.g.drops.length === 0, 'your own sandwich recharges instead of healing');
  const gone = armed('strongman', null, { slot: 2 });
  gone.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  hold(gone.g, 31, { yaw: -EAST, fwd: 1 });
  ok(gone.g.drops.length === 0, 'it lies for 30 s');
  const under = lab('strongman', B => { B.floor(-5, -5, 5, 5, -2, 'plate', { t: 1 }); B.water(-5, -5, 5, 5, -2, 0); }, [[-5, -5, 5, 5]]);
  under.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 2 }));
  place(under.p, 0, -2, 0, EAST);
  hold(under.g, 1, { yaw: EAST, crouch: true });
  under.p.hp = 50;
  under.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(under.p.eatT === 0, 'no meal under water');
}

{
  const scene = () => {
    const t = armed('vet', 5, { slot: 2, team: 'hot', foe: 'runner' });
    t.dummy.hp = 50;
    return t;
  };
  const a = scene();
  a.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(a.p.patient === a.dummy, 'the beam takes the friend under the crosshair');
  hold(a.g, 1, { yaw: EAST, fire: true });
  near(a.dummy.hp, 50 + 72, 2, 'someone not hurt lately heals at 72 a second');
  a.dummy.hp = 40;
  a.g.damage(a.dummy, 1, {});
  const h0 = a.dummy.hp;
  hold(a.g, 1, { yaw: EAST, fire: true });
  near(a.dummy.hp - h0, 24, 1, 'someone hurt just now heals at 24 a second');
  const scale = scene();
  scale.g.t = 100;
  scale.dummy.lastHurt = 100 - 12.5;
  near(scale.g.healRate(scale.dummy), 48, 1e-6, 'the rate grows between 10 and 15 s');
  ok(!shoot(armed('vet', 10, { slot: 2, team: 'hot' }).g, 5, { fire: true }).length, 'the beam gives no damage numbers');
  const far = armed('vet', 10, { slot: 2, team: 'hot' });
  far.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(!far.p.patient, 'the beam does not start at 10 m');
  const cut = armed('vet', 8, { slot: 2, team: 'hot', foe: 'runner' });
  cut.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(cut.p.patient === cut.dummy, 'the beam starts at 8 m');
  cut.dummy.pos.x = 10;
  cut.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(cut.p.patient === cut.dummy, 'the beam holds at 10 m');
  cut.dummy.pos.x = 11;
  cut.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(!cut.p.patient, 'the beam breaks after 10.29 m');
  const enemy = armed('vet', 5, { slot: 2 });
  enemy.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(!enemy.p.patient, 'the beam does not take an enemy');
  const wall = armed('vet', 5, { slot: 2, team: 'hot', build: B => B.box(2, 0, -3, 2.3, 4, 3, 'wall') });
  wall.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(!wall.p.patient, 'the beam does not start through a wall');

  const over = armed('vet', 5, { slot: 2, team: 'hot', foe: 'runner' });
  hold(over.g, 2, { yaw: EAST, fire: true });
  near(over.dummy.hp, 185, 1, 'the beam fills up to 150 %');
  hold(over.g, 1, { yaw: EAST });
  ok(over.dummy.hp < 185 && over.dummy.hp > 125, 'the extra health runs out slowly');
  hold(over.g, 15, { yaw: EAST });
  ok(over.dummy.hp === 125, 'it is gone in 15 s');

  const build = armed('vet', 5, { slot: 2, team: 'hot', foe: 'runner' });
  build.dummy.hp = 40;
  hold(build.g, 1, { yaw: EAST, fire: true });
  near(build.p.arms[1].charge, 0.025, 0.001, 'a hurt patient builds 2.5 % a second');
  build.dummy.hp = 185;
  const c0 = build.p.arms[1].charge;
  hold(build.g, 1, { yaw: EAST, fire: true });
  near(build.p.arms[1].charge - c0, 0.0125, 0.001, 'a full patient builds half as fast');

  const uber = armed('vet', 5, { slot: 2, team: 'hot', foe: 'runner' });
  uber.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  ok(uber.p.uberT === 0, 'nothing happens below 100 %');
  uber.p.arms[1].charge = 1;
  hold(uber.g, 0.1, { yaw: EAST, fire: true });
  uber.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true, fire2: true }));
  near(uber.p.uberT, 8, 0.05, 'the right button pours out 8 s');
  uber.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(uber.dummy.uberT > 0, 'the patient is covered too');
  const hp0 = uber.p.hp, dh0 = uber.dummy.hp;
  uber.g.damage(uber.p, 100, {});
  uber.g.damage(uber.dummy, 100, {});
  ok(uber.p.hp === hp0 && uber.dummy.hp === dh0, 'nothing hurts under it');
  uber.g.knock(uber.p, 0, 5, 0);
  ok(uber.p.vel.y > 0, 'it does not stop a push');
  hold(uber.g, 8.2, { yaw: EAST });
  ok(uber.p.uberT === 0, 'it lasts 8 s');
  hold(uber.g, 1.2, { yaw: EAST });
  ok(uber.dummy.uberT === 0, 'the patient loses it as well');

  const burn = armed('vet', 5, { slot: 2, team: 'hot', foe: 'runner' });
  burn.dummy.hp = 40;
  burn.dummy.burnT = 9;
  burn.dummy.burnTick = 99;
  hold(burn.g, 1, { yaw: EAST, fire: true });
  near(burn.dummy.hp, 40 + 36, 1.5, 'a burn halves healing');

  const regen = armed('vet', null, { slot: 3 });
  regen.p.hp = 100;
  hold(regen.g, 1, { yaw: 0, pitch: 0.3 });
  near(regen.p.hp, 106, 0.2, 'the medic heals by herself at 6 a second when left alone');
  regen.g.damage(regen.p, 1, {});
  const r0 = regen.p.hp;
  hold(regen.g, 1, { yaw: 0, pitch: 0.3 });
  near(regen.p.hp - r0, 3.15, 0.2, 'after a hit it starts from 3 a second');
  const notVet = armed('diver', null);
  notVet.p.hp = 100;
  hold(notVet.g, 1, { yaw: 0, pitch: 0.3 });
  ok(notVet.p.hp === 100, 'nobody else heals by themselves');

  const needles = armed('vet', 10);
  const nHits = shoot(needles.g, 80, { pitch: 0.03 });
  ok(nHits.length === 1, 'a syringe flies to the target');
  ok(nHits[0].tick > 25, 'a syringe takes time to fly: ' + nHits[0].tick);
  const dropN = armed('vet', null);
  dropN.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  const nd = dropN.g.proj[0];
  const y0 = nd.y;
  hold(dropN.g, 0.5, { yaw: EAST });
  ok(nd.y < y0 - 0.3, 'a syringe falls on the way');
  const wallN = armed('vet', 6, { build: B => B.box(3, 0, -3, 3.3, 4, 3, 'wall') });
  ok(shoot(wallN.g, 60).length === 0 && wallN.g.proj.length === 0, 'a wall stops a syringe');
}

{
  const rifleAt = (dist, pitch) => armed('hunter', dist, { foe: 'strongman' });
  const plain = rifleAt(10);
  const unscoped = shoot(plain.g, 3);
  near(unscoped[0].amount, 50, 1e-6, 'the rifle deals 50 without the scope');
  const headNoScope = rifleAt(10);
  const headY = headNoScope.dummy.pos.y + 1.5;
  const eyeY = headNoScope.p.pos.y + R.eyeStand;
  const aimUp = Math.atan2(headY - eyeY, 10);
  near(shoot(headNoScope.g, 3, { pitch: aimUp })[0].amount, 50, 1e-6, 'a head shot needs the scope');

  const scoped = rifleAt(10);
  scoped.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  ok(scoped.p.scoped, 'the right button opens the scope');
  hold(scoped.g, 0.25, { yaw: EAST });
  ok(scoped.p.scopeCharge === 0, 'the charge waits 0.3 s');
  hold(scoped.g, 3.2, { yaw: EAST });
  near(scoped.p.scopeCharge, 1, 1e-6, 'the charge is full after 3.3 s');
  const body = shoot(scoped.g, 3, { pitch: -0.06 });
  near(body[0].amount, 150, 1e-6, 'a full body shot deals 150');
  ok(scoped.p.scopeCharge < 0.01, 'a shot empties the charge');
  ok(scoped.p.arms[0].reserve === 24, 'a shot takes one of 25');
  hold(scoped.g, 0.9, { yaw: EAST });
  ok(scoped.p.scopeCharge === 0, 'the charge waits 1 s after a shot');
  hold(scoped.g, 0.3, { yaw: EAST });
  ok(scoped.p.scopeCharge > 0, 'then it grows again');
  ok(shoot(scoped.g, 3, { fire: true }).length === 0 && scoped.p.arms[0].reserve === 24, 'the rifle fires every 1.5 s');

  const head = rifleAt(10);
  head.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: aimUp, fire2: true }));
  hold(head.g, 3.5, { yaw: EAST, pitch: aimUp });
  const hit = shoot(head.g, 3, { pitch: aimUp })[0];
  near(hit.amount, 450, 1e-6, 'a full head shot deals 450');
  ok(hit.boost === 'crit' && hit.head, 'a head shot is a crit');
  const quick = rifleAt(10);
  quick.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: aimUp, fire2: true }));
  hold(quick.g, 0.1, { yaw: EAST, pitch: aimUp });
  near(shoot(quick.g, 3, { pitch: aimUp })[0].amount, 50, 1e-6, 'no head shot before 0.2 s in the scope');
  const ready = rifleAt(10);
  ready.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: aimUp, fire2: true }));
  hold(ready.g, 0.25, { yaw: EAST, pitch: aimUp });
  near(shoot(ready.g, 3, { pitch: aimUp })[0].amount, 150, 1e-6, 'a head shot after 0.2 s deals 150');

  const walk = rifleAt(null);
  walk.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  hold(walk.g, 0.5, { yaw: EAST, fwd: 1 });
  const x0 = walk.p.pos.x;
  hold(walk.g, 1, { yaw: EAST, fwd: 1 });
  near(walk.p.pos.x - x0, T.hu(80), T.hu(80) * 0.02, 'the scope slows to 80 units');
  walk.g.step(Object.assign(T.blankInput(), { yaw: EAST, jump: true }));
  hold(walk.g, 0.1, { yaw: EAST });
  ok(!walk.p.scoped, 'a jump closes the scope');
  const air = rifleAt(null);
  air.g.step(Object.assign(T.blankInput(), { yaw: EAST, jump: true }));
  air.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  ok(!air.p.scoped, 'the scope does not open in the air');
  const off = rifleAt(null);
  off.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  off.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 2 }));
  ok(!off.p.scoped && off.p.speedCap === Infinity, 'changing the weapon closes the scope');

  const smg = armed('hunter', 40, { slot: 2 });
  const sf = shoot(smg.g, 3);
  ok(sf.length === 1, 'the first SMG shot is exact');
  near(sf[0].amount, T.hitDamage(T.WEAPONS.smg, smg.g.distanceHu(smg.p, smg.dummy), null), 1e-6, 'the SMG damage at 40 m');
  const fists = armed('strongman', 1.5, { slot: 3 });
  const left = shoot(fists.g, 20, { fire: false, fire2: true });
  ok(left.length === 1 && left[0].amount === 65, 'the right button swings the other fist');
}

{
  const scene = B => {
    B.health(3, 0, 0.2); B.health(6, 0, 0.5); B.health(9, 0, 1);
    B.ammo(3, 5, 0.2); B.ammo(6, 5, 0.5); B.ammo(9, 5, 1);
    B.locker(0, 10);
  };
  const on = (g, p, x, z) => { p.pos.x = x; p.pos.z = z; p.pos.y = 0; g.step(Object.assign(T.blankInput(), { yaw: EAST })); };
  const a = lab('diver', scene);
  settle(a.g, a.p);
  ok(a.g.pickups.length === 6, 'the pickups are on the map');
  a.p.hp = 20;
  on(a.g, a.p, 3, 0);
  near(a.p.hp, 60, 1e-6, 'a mug gives 20 %');
  on(a.g, a.p, 6, 0);
  near(a.p.hp, 160, 1e-6, 'a kettle gives 50 %');
  on(a.g, a.p, 9, 0);
  near(a.p.hp, 200, 1e-6, 'a samovar gives 100 % and no extra');
  ok(a.g.pickups[0].readyAt > a.g.t, 'a taken pickup is gone for a while');

  const full = lab('diver', scene);
  settle(full.g, full.p);
  on(full.g, full.p, 3, 0);
  ok(full.g.pickups[0].readyAt === 0, 'health stays when you are healthy');
  full.p.hp = 250;
  on(full.g, full.p, 9, 0);
  ok(full.p.hp <= 250 && full.g.pickups[2].readyAt === 0, 'health stays when you have extra');

  const again = lab('diver', scene);
  settle(again.g, again.p);
  again.p.hp = 50;
  on(again.g, again.p, 3, 0);
  on(again.g, again.p, 0, -20);
  hold(again.g, 9.8, { yaw: EAST });
  again.p.hp = 50;
  on(again.g, again.p, 3, 0);
  ok(again.p.hp === 50, 'it is not back before 10 s');
  on(again.g, again.p, 0, -20);
  hold(again.g, 0.3, { yaw: EAST });
  on(again.g, again.p, 3, 0);
  ok(again.p.hp > 50, 'it comes back after 10 s');

  const ammo = lab('diver', scene);
  settle(ammo.g, ammo.p);
  const tube = ammo.p.arms[0], gun = ammo.p.arms[1];
  tube.reserve = 0; gun.reserve = 0; tube.clip = 1;
  on(ammo.g, ammo.p, 3, 5);
  ok(tube.reserve === 4 && gun.reserve === Math.ceil(32 * 0.2), 'a crate gives 20 % of every weapon');
  ok(tube.clip === 1, 'a crate does not fill the clip');
  on(ammo.g, ammo.p, 6, 5);
  ok(tube.reserve === 14, 'two crates give 50 %');
  on(ammo.g, ammo.p, 9, 5);
  ok(tube.reserve === 20 && gun.reserve === 32, 'a stack gives everything');
  const noNeed = lab('diver', scene);
  settle(noNeed.g, noNeed.p);
  on(noNeed.g, noNeed.p, 3, 5);
  ok(noNeed.g.pickups[3].readyAt === 0, 'a crate stays when you are full');

  const locker = lab('strongman', scene);
  settle(locker.g, locker.p);
  locker.p.hp = 10;
  locker.p.arms[0].reserve = 1;
  locker.p.arms[1].cooldown = 20;
  locker.g.ignite(locker.p, locker.p, T.WEAPONS.torch);
  on(locker.g, locker.p, 0, 9);
  ok(locker.p.hp === 300 && locker.p.arms[0].reserve === 200 && locker.p.arms[1].cooldown === 0 && locker.p.burnT === 0, 'a locker gives everything and puts out the fire');
  locker.p.hp = 400;
  on(locker.g, locker.p, 0, 9);
  ok(locker.p.hp >= 399, 'a locker does not take extra health away');

  const mug = lab('strongman', scene);
  settle(mug.g, mug.p);
  mug.p.arms[1].cooldown = 25;
  on(mug.g, mug.p, 3, 0);
  ok(mug.p.arms[1].cooldown === 0 && mug.g.pickups[0].readyAt > 0, 'at full health a mug recharges the sandwich');

  const death = lab('diver');
  settle(death.g, death.p);
  place(death.p, 15, 0, 3, EAST);
  death.p.onGround = true;
  death.p.hp = 1;
  death.g.damage(death.p, 5, {});
  ok(death.g.drops.length === 1 && death.g.drops[0].kind === 'ammo' && death.g.drops[0].size === 0.5, 'the dead drop a half load of ammo');
  ok(death.g.drops[0].x === 15, 'it lies where they fell');
  death.p.arms[0].reserve = 0;
  death.p.pos.x = 15; death.p.pos.z = 3;
  death.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  ok(death.p.arms[0].reserve === 10 && death.g.drops.length === 0, 'anyone can pick it up');
  const stay = lab('diver');
  settle(stay.g, stay.p);
  stay.g.dropItem({ kind: 'ammo', size: 0.5, x: 20, y: 0, z: 0, life: 30 });
  hold(stay.g, 29, { yaw: EAST });
  ok(stay.g.drops.length === 1, 'a dropped pack lies for a while');
  hold(stay.g, 1.1, { yaw: EAST });
  ok(stay.g.drops.length === 0, 'it is gone after 30 s');

  const yard = new T.Game({ map: 'yard', visual: false, merc: 'diver', team: 'hot' });
  ok(yard.pickups.length === 6 && yard.map.lockers.length === 1, 'the yard has supplies and a locker');
  for (const p of yard.pickups) ok(p.y === 0, 'a pickup stands on the ground');
  const yardLocker = yard.map.lockers[0];
  yard.player.hp = 5;
  yard.player.pos.x = yardLocker.x - 1;
  yard.player.pos.z = yardLocker.z;
  yard.player.pos.y = 0;
  yard.step(Object.assign(T.blankInput(), { yaw: EAST }));
  ok(yard.player.hp === 200, 'the yard locker works');
}

const engineer = (opts = {}) => {
  const t = armed('plumber', opts.dist === undefined ? null : opts.dist, opts);
  return t;
};

const putUp = (t, pick, yaw = EAST, skipBuild = true) => {
  t.g.step(Object.assign(T.blankInput(), { yaw, slot: 4 }));
  hold(t.g, 0.6, { yaw });
  t.g.step(Object.assign(T.blankInput(), { yaw, pick }));
  t.g.step(Object.assign(T.blankInput(), { yaw, fire: true }));
  t.g.step(Object.assign(T.blankInput(), { yaw }));
  const b = t.g.buildings[t.g.buildings.length - 1];
  if (b && skipBuild) { b.buildLeft = 0; b.hp = b.maxHp; }
  return b;
};

const toLevel = (b, level) => {
  while (b.level < level) {
    const n = b.level + 1;
    b.level = n;
    b.maxHp = b.def.health[n - 1];
    b.hp = b.maxHp;
    if (b.def.ammo) b.ammo = b.def.ammo[n - 1];
    if (n === 3 && b.def.rockets) b.rockets = b.def.rockets;
  }
};

{
  const H = T.BUILDINGS.hydrant, Ti = T.BUILDINGS.titan, En = T.BUILDINGS.enter, Ex = T.BUILDINGS.exit;
  ok(H.cost === 130 && Ti.cost === 100 && En.cost === 50 && Ex.cost === 50, 'building costs');
  for (const k of T.BUILD_ORDER) assert.deepEqual(T.BUILDINGS[k].health, [150, 180, 216], 'building health of ' + k);
  checks += T.BUILD_ORDER.length;
  assert.deepEqual(H.interval, [0.225, 0.135, 0.135], 'hydrant intervals'); checks++;
  assert.deepEqual(H.ammo, [150, 200, 200], 'hydrant ammo'); checks++;
  ok(H.rockets === 20 && H.rocketEvery === 3.06, 'hydrant rockets');
  near(H.range, T.hu(1100), 1e-9, 'hydrant range');
  assert.deepEqual(Ti.heal, [10, 15, 20], 'titan healing'); checks++;
  assert.deepEqual(Ti.ammoShare, [0.2, 0.3, 0.4], 'titan ammo'); checks++;
  assert.deepEqual(Ti.metal, [40, 50, 60], 'titan metal'); checks++;
  assert.deepEqual(En.recharge, [10, 5, 3], 'pad recharge'); checks++;
  near(T.hydrantBullet(0), 19.49, 1e-9, 'a hydrant bullet up close');
  near(T.hydrantBullet(512), 16, 1e-9, 'a hydrant bullet at 512 units');
  near(T.hydrantBullet(1024), 16, 1e-9, 'a hydrant bullet does not fall off');

  const e = engineer();
  assert.deepEqual(T.MERCS.plumber.slots, ['shotgun', 'pistol', 'wrench', 'build', 'scrap'], 'the plumber kit');
  checks++;
  ok(e.p.metal === 200, 'the plumber starts with 200 metal');
  ok(e.p.arms[1].reserve === 200 && e.p.arms[1].def.reload[0] === 1.035 && T.WEAPONS.pistol.reserve === 36 && T.WEAPONS.pistol.reload[0] === 1.005, 'the plumber pistol carries 200 and reloads in 1.035 s without changing the library');
  ok(e.p.arms[0].def.reload[0] === 0.87, 'the plumber shotgun reloads first in 0.87 s');
  ok(!read('js/apps/tf98/tf-build.js').match(/\b(runner|diver|welder|miner|strongman|plumber|vet|hunter|inspector|knight)\b/), 'buildings do not name mercenaries');
}

{
  const t = engineer();
  const b = putUp(t, 1, EAST, false);
  ok(b && b.kind === 'hydrant', 'the first pick places a hydrant');
  ok(t.p.metal === 70, 'a hydrant costs 130');
  ok(t.p.arms[t.p.slot].def.wrench, 'after placing the wrench comes up');
  ok(!T.Build.ready(b) && b.hp < b.maxHp, 'a new building is not ready and not at full health');
  near(b.pos.x, 1.7, 0.05, 'it stands ahead of the plumber');
  hold(t.g, 9.8, { yaw: 0, pitch: 0.3 });
  ok(b.buildLeft > 0, 'a hydrant takes 10 s');
  hold(t.g, 0.3, { yaw: 0, pitch: 0.3 });
  ok(T.Build.ready(b), 'then it is ready');
  near(b.hp, 150, 0.5, 'and has full health');

  const fast = engineer();
  const fb = putUp(fast, 1, EAST, false);
  fast.p.pos.x = 0.4;
  hold(fast.g, 0.5, { yaw: EAST });
  const left0 = fb.buildLeft;
  for (let i = 0; i < 60 * 2; i++) fast.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(left0 - fb.buildLeft > 2.5, 'wrench hits speed up the building: ' + (left0 - fb.buildLeft));
  ok(fb.hits > 0 && fb.hits <= R.buildHitsMax, 'the speed-up has a limit');

  const twice = engineer();
  putUp(twice, 1);
  twice.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 4 }));
  hold(twice.g, 0.6, { yaw: 0 });
  const seen = [];
  twice.g.step(Object.assign(T.blankInput(), { yaw: 0, pick: 1 }));
  for (const ev of twice.g.events) seen.push(ev.type);
  ok(seen.includes('buildDenied') && !twice.p.ghost, 'no second hydrant');

  const poor = engineer();
  poor.p.metal = 40;
  poor.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 4 }));
  hold(poor.g, 0.6, { yaw: EAST });
  poor.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 3 }));
  ok(!poor.p.ghost, 'no building without metal');

  const inAir = engineer();
  inAir.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 4 }));
  hold(inAir.g, 0.6, { yaw: EAST });
  inAir.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 1 }));
  inAir.g.step(Object.assign(T.blankInput(), { yaw: EAST, jump: true }));
  inAir.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(inAir.g.buildings.length === 0 && inAir.p.ghost, 'no building from the air');

  const blocked = engineer({ build: B => B.box(1.2, 0, -2, 2.2, 3, 2, 'wall') });
  blocked.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 4 }));
  hold(blocked.g, 0.6, { yaw: EAST });
  blocked.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 1 }));
  blocked.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(blocked.g.buildings.length === 0, 'no building inside a wall');
  const zoned = engineer({ build: B => B.noBuild(0, -3, 4, 3) });
  zoned.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 4 }));
  hold(zoned.g, 0.6, { yaw: EAST });
  zoned.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 1 }));
  zoned.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(zoned.g.buildings.length === 0, 'no building where the map forbids it');
  const wet = engineer({ build: B => B.water(0, -4, 4, 4, -1, 0.5) });
  wet.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 4 }));
  hold(wet.g, 0.6, { yaw: EAST });
  wet.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 1 }));
  wet.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(wet.g.buildings.length === 0, 'no building in water');
  const cancel = engineer();
  cancel.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 4 }));
  hold(cancel.g, 0.6, { yaw: EAST });
  cancel.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 1 }));
  ok(cancel.p.ghost, 'the outline follows the plumber');
  cancel.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 3 }));
  ok(!cancel.p.ghost && cancel.p.metal === 200, 'changing the weapon cancels the outline for free');
  const turned = engineer();
  turned.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 4 }));
  hold(turned.g, 0.6, { yaw: EAST });
  turned.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 1 }));
  turned.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  turned.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  turned.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  near(turned.g.buildings[0].yaw, EAST + Math.PI / 2, 1e-9, 'the right button turns the outline');
}

const hydrantAt = (dist, opts = {}) => {
  const t = engineer(Object.assign({ foe: 'strongman' }, opts));
  t.p.pos.x = -1.7;
  const b = putUp(t, 1);
  b.aimYaw = EAST;
  b.yaw = EAST;
  const dummy = dist === null ? null : t.g.addDummy(opts.foe || 'strongman', opts.team || 'cold', b.pos.x + dist, 0, opts.z || 0, 0);
  if (dummy) dummy.hp = dummy.maxHp = 1e6;
  t.p.pos.x = -8;
  return Object.assign(t, { b, dummy });
};

const turretHits = (t, seconds) => {
  const hits = [];
  for (let i = 0; i < seconds * 60; i++) {
    t.g.step(Object.assign(T.blankInput(), { yaw: -EAST }));
    for (const ev of t.g.events) if (ev.type === 'hit' && ev.dst === (t.dummy && t.dummy.id)) hits.push(Object.assign({ tick: i }, ev));
  }
  return hits;
};

{
  const a = hydrantAt(10);
  const shots = turretHits(a, 2.25);
  ok(shots.length >= 9 && shots.length <= 11, 'level 1 fires every 0.225 s: ' + shots.length);
  near(shots[0].amount, T.hydrantBullet(a.g.distanceHu(a.b, a.dummy)), 0.5, 'its bullets deal 16–19');
  ok(a.b.ammo < 150, 'firing takes ammo');
  ok(turretHits(hydrantAt(20).g && hydrantAt(20), 1).length > 0, 'it reaches 20 m');
  ok(turretHits(hydrantAt(22), 1).length === 0, 'it does not reach 22 m');

  const two = hydrantAt(10);
  toLevel(two.b, 2);
  const shots2 = turretHits(two, 2.1);
  ok(shots2.length >= 14 && shots2.length <= 17, 'level 2 fires every 0.135 s: ' + shots2.length);

  const three = hydrantAt(10);
  toLevel(three.b, 3);
  const r0 = three.b.rockets;
  const booms = [];
  for (let i = 0; i < 60 * 3.2; i++) {
    three.g.step(Object.assign(T.blankInput(), { yaw: -EAST }));
    for (const ev of three.g.events) if (ev.type === 'turretRocket') booms.push(i);
  }
  ok(booms.length === 2, 'level 3 adds a rocket every 3.06 s: ' + booms.length);
  ok(three.b.rockets === r0 - 2, 'rockets are counted');
  ok(three.p.hp === three.p.maxHp, 'its rockets do not hurt the owner');

  const dry = hydrantAt(10);
  dry.b.ammo = 0;
  ok(turretHits(dry, 1).length === 0, 'an empty hydrant does not fire');

  const behind = hydrantAt(-6);
  behind.b.aimYaw = EAST;
  behind.b.yaw = EAST;
  const lateShots = turretHits(behind, 2);
  ok(lateShots.length > 0, 'it turns all the way round');
  ok(lateShots[0].tick > 40, 'turning takes time at level 1: tick ' + lateShots[0].tick);
  const quick = hydrantAt(-6);
  toLevel(quick.b, 3);
  quick.b.aimYaw = EAST;
  const quickShots = turretHits(quick, 2);
  ok(quickShots[0].tick < lateShots[0].tick, 'a higher level turns faster');

  const nearest = hydrantAt(12);
  const closer = nearest.g.addDummy('strongman', 'cold', nearest.b.pos.x + 6, 0, 0, 0);
  closer.hp = closer.maxHp = 1e6;
  nearest.g.step(Object.assign(T.blankInput(), { yaw: -EAST }));
  hold(nearest.g, 0.2, { yaw: -EAST });
  ok(nearest.b.target === closer, 'it picks the nearest enemy');

  const people = hydrantAt(12);
  const enemyHydrant = people.g.buildings[0];
  const other = { id: 'x' };
  const foeB = people.g.addHero('plumber', 'cold', false);
  foeB.fixed = true;
  foeB.pos.x = 40;
  const spy = people.dummy;
  people.dummy.hp = 1e6;
  const fakeTurret = { isBuilding: true, fixed: true, alive: true, kind: 'titan', def: T.BUILDINGS.titan, owner: foeB, team: 'cold', r: 0.5, h: 1.3, level: 1, upgrade: 0, hp: 150, maxHp: 150, ammo: 0, rockets: 0, sealed: false, sealHits: 0, wakeT: 0, busyT: 0, hits: 0, hitsT: 0, fireCd: 0, rocketCd: 0, think: 0, target: null, sweep: 0, sweepDir: 1, pulse: 0, charge: 0, waitT: 0, waiter: null, lastHurt: -Infinity, pos: { x: enemyHydrant.pos.x + 5, y: 0, z: 4 }, yaw: 0, aimYaw: 0, aimPitch: 0, buildLeft: 0, buildTotal: 1, redeploy: false };
  people.g.buildings.push(fakeTurret);
  people.g.refreshVictims();
  hold(people.g, 0.2, { yaw: -EAST });
  ok(enemyHydrant.target === spy, 'it shoots people before buildings');
  ok(!!other, 'a helper stays quiet');

  const cloak = hydrantAt(10);
  cloak.dummy.cloaked = true;
  ok(turretHits(cloak, 1).length === 0, 'it does not see a cloaked enemy');
  const mask = hydrantAt(10);
  mask.dummy.disguised = true;
  ok(turretHits(mask, 1).length === 0, 'it does not fire at a disguised enemy');
  const late = hydrantAt(10);
  hold(late.g, 0.5, { yaw: -EAST });
  ok(late.b.target === late.dummy, 'it has started firing');
  late.dummy.disguised = true;
  ok(turretHits(late, 1).length > 0, 'it keeps firing at someone who disguises under fire');

  const wall = hydrantAt(10, { build: B => B.box(5, 0, -3, 5.3, 4, 3, 'wall') });
  ok(turretHits(wall, 1).length === 0, 'a wall hides the target');
  const friend = hydrantAt(10, { team: 'hot' });
  ok(turretHits(friend, 1).length === 0, 'it does not fire at its own side');

  const shield = hydrantAt(10);
  shield.g.step(Object.assign(T.blankInput(), { yaw: -EAST }));
  const friendlyTitan = { isBuilding: true, fixed: true, alive: true, kind: 'titan', def: T.BUILDINGS.titan, owner: shield.p, team: 'hot', r: 0.5, h: 1.35, level: 1, upgrade: 0, hp: 150, maxHp: 150, ammo: 0, rockets: 0, sealed: false, sealHits: 0, wakeT: 0, busyT: 0, hits: 0, hitsT: 0, fireCd: 0, rocketCd: 0, think: 0, target: null, sweep: 0, sweepDir: 1, pulse: 0, charge: 0, waitT: 0, waiter: null, lastHurt: -Infinity, pos: { x: shield.b.pos.x + 4, y: 0, z: 0 }, yaw: 0, aimYaw: 0, aimPitch: 0, buildLeft: 0, buildTotal: 1, redeploy: false };
  shield.g.buildings.push(friendlyTitan);
  shield.g.refreshVictims();
  hold(shield.g, 0.2, { yaw: -EAST });
  ok(turretHits(shield, 1).length === 0, 'a building hides the target');

  const swim = hydrantAt(8, { build: B => {
    B.water(4, -6, 14, 6, -3, 0.4);
  } });
  swim.dummy.pos.y = -1.5;
  ok(turretHits(swim, 1).length === 0, 'it does not fire across a water surface');

  const seal = hydrantAt(10);
  seal.b.sealed = true;
  ok(turretHits(seal, 1).length === 0, 'a sealed hydrant does not fire');
  seal.p.pos.x = seal.b.pos.x - 1;
  seal.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 3 }));
  hold(seal.g, 0.6, { yaw: EAST });
  for (let i = 0; i < 49; i++) seal.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: i === 0 }));
  ok(seal.b.sealed && seal.b.sealHits === 1, 'one wrench hit is not enough to take off a seal');
  for (let i = 0; i < 49; i++) seal.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: i === 0 }));
  ok(!seal.b.sealed, 'two hits take off a seal');
  ok(seal.b.wakeT > 0 || T.Build.ready(seal.b), 'then the hydrant wakes up');

  const pushed = hydrantAt(null);
  const walker = pushed.g.addHero('runner', 'cold', false);
  walker.pos.x = pushed.b.pos.x + 5;
  walker.hp = walker.maxHp = 1e6;
  hold(pushed.g, 1, { yaw: -EAST });
  ok(walker.pos.x > pushed.b.pos.x + 5.2, 'bullets push a target away: ' + walker.pos.x);
  const big = hydrantAt(null);
  const heavy = big.g.addHero('strongman', 'cold', false);
  heavy.pos.x = big.b.pos.x + 5;
  heavy.hp = heavy.maxHp = 1e6;
  hold(big.g, 1, { yaw: -EAST });
  ok(heavy.pos.x - big.b.pos.x < walker.pos.x - pushed.b.pos.x, 'the strongman moves less');
}

{
  const job = () => {
    const t = engineer();
    t.p.pos.x = -1.7;
    const b = putUp(t, 1);
    t.p.pos.x = b.pos.x - 1;
    t.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 3 }));
    hold(t.g, 0.6, { yaw: EAST });
    return Object.assign(t, { b });
  };
  const hit = (t, inp) => {
    for (let i = 0; i < 49; i++) t.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: i === 0 }, inp));
  };

  const fix = job();
  fix.b.hp = 10;
  fix.p.metal = 200;
  hit(fix);
  near(fix.b.hp, 112, 1e-6, 'a hit repairs 102');
  ok(fix.p.metal === 166, 'a repair costs 34 metal');
  ok(fix.b.upgrade === 0, 'a hit that repairs does not also upgrade');
  const broke = job();
  broke.b.hp = 10;
  broke.p.metal = 3;
  hit(broke);
  near(broke.b.hp, 19, 1e-6, 'a repair goes as far as the metal does');
  ok(broke.p.metal === 0, 'all of it is spent');

  const up = job();
  hit(up);
  ok(up.b.upgrade === 25 && up.p.metal === 45, 'an upgrade hit takes 25 metal: ' + up.b.upgrade + ', ' + up.p.metal);
  up.p.metal = 200;
  up.g.setupPhase = true;
  hit(up);
  ok(up.b.upgrade === 75, 'during setup a hit counts double');
  up.g.setupPhase = false;
  up.b.upgrade = 190;
  up.p.metal = 100;
  hit(up);
  ok(up.b.level === 2 && up.b.upgrade === 0 && up.p.metal === 90, 'at 200 the hydrant goes to level 2 and only the rest is paid');
  near(up.b.hp, 180, 1e-6, 'level 2 has 180 health');
  ok(up.b.ammo === 200, 'level 2 has 200 bullets');
  ok(up.b.busyT > 0 && !T.Build.ready(up.b), 'it does not fire while it upgrades');
  up.b.upgrade = 190;
  up.p.metal = 100;
  hold(up.g, 1.7, { yaw: EAST });
  hit(up);
  ok(up.b.level === 3, 'level 3 comes the same way');
  near(up.b.hp, 216, 1e-6, 'level 3 has 216 health');
  ok(up.b.rockets === 20, 'level 3 has 20 rocket salvos');
  up.p.metal = 200;
  const m0 = up.p.metal;
  hold(up.g, 1.7, { yaw: EAST });
  hit(up);
  ok(up.b.level === 3 && up.p.metal === m0, 'nothing is spent on a full hydrant');

  const refill = job();
  refill.b.ammo = 100;
  refill.b.upgrade = 200 - 25;
  refill.b.upgrade = 0;
  refill.p.metal = 200;
  hit(refill);
  ok(refill.b.ammo === 140, 'a hit adds 40 bullets for 40 metal');
  ok(refill.b.upgrade === 25 && refill.p.metal === 200 - 25 - 40, 'the same hit also upgrades');
  const rockets = job();
  toLevel(rockets.b, 3);
  rockets.b.rockets = 10;
  rockets.p.metal = 100;
  hit(rockets);
  ok(rockets.b.rockets === 18 && rockets.p.metal === 84, 'a hit adds rockets for 16 metal');

  const friend = job();
  friend.b.owner = friend.g.addHero('plumber', 'hot', false);
  friend.b.hp = 10;
  hit(friend);
  ok(friend.b.hp > 10, 'any plumber of the side can repair');
  const foe = job();
  foe.b.team = 'cold';
  foe.g.refreshVictims();
  foe.b.hp = 100;
  const hurtHits = [];
  for (let i = 0; i < 49; i++) {
    foe.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: i === 0 }));
    for (const ev of foe.g.events) if (ev.type === 'hit') hurtHits.push(ev.amount);
  }
  ok(hurtHits[0] === 65, 'a wrench hurts an enemy building for 65');
}

{
  const titan = (lvl, merc) => {
    const t = engineer();
    t.p.pos.x = -1.7;
    const b = putUp(t, 2);
    toLevel(b, lvl);
    t.p.pos.x = b.pos.x - 1.5;
    return Object.assign(t, { b });
  };
  for (const [lvl, rate, share, metal] of [[1, 10, 0.2, 40], [2, 15, 0.3, 50], [3, 20, 0.4, 60]]) {
    const t = titan(lvl);
    t.p.hp = 50;
    t.p.arms[0].reserve = 0;
    t.p.metal = 0;
    hold(t.g, 1, { yaw: 0, pitch: 0.3 });
    near(t.p.hp, 50 + rate, 1, 'level ' + lvl + ' heals ' + rate + ' a second');
    near(t.p.arms[0].reserve, 32 * share, 1.1, 'level ' + lvl + ' gives ' + share * 100 + ' % ammo a second');
    t.p.arms[0].reserve = 0;
    hold(t.g, 4.1, { yaw: 0, pitch: 0.3 });
    ok(t.p.metal === metal, 'level ' + lvl + ' gives ' + metal + ' metal in 5 s: ' + t.p.metal);
  }
  const far = titan(1);
  far.p.hp = 50;
  far.p.pos.x = far.b.pos.x - 4;
  hold(far.g, 1, { yaw: 0, pitch: 0.3 });
  ok(far.p.hp === 50, 'nothing beyond 3 m');
  const blocked = (() => {
    const t = engineer({ build: B => B.box(0.7, 0, -3, 0.95, 4, 3, 'wall') });
    t.p.pos.x = 0;
    t.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3 }));
    return t;
  })();
  const b2 = (() => {
    const def = T.BUILDINGS.titan;
    const proto = titan(1);
    const copy = proto.b;
    copy.owner = blocked.p; copy.team = 'hot'; copy.pos = { x: 1.7, y: 0, z: 0 };
    blocked.g.buildings.push(copy);
    blocked.g.refreshVictims();
    return def;
  })();
  blocked.p.hp = 50;
  hold(blocked.g, 1, { yaw: 0, pitch: 0.3 });
  ok(blocked.p.hp === 50 && !!b2, 'a wall stops the titan');
  const many = titan(1);
  const other = many.g.addHero('runner', 'hot', false);
  other.pos.x = many.b.pos.x + 1.5;
  other.hp = 50;
  many.p.hp = 50;
  hold(many.g, 1, { yaw: 0, pitch: 0.3 });
  ok(many.p.hp > 50 && other.hp > 50, 'it serves several at once');
  const foe = titan(1);
  const enemy = foe.g.addHero('runner', 'cold', false);
  enemy.pos.x = foe.b.pos.x + 1.5;
  enemy.hp = 50;
  hold(foe.g, 1, { yaw: 0, pitch: 0.3 });
  ok(enemy.hp === 50, 'it does not serve the enemy');
  const sealedTitan = titan(1);
  sealedTitan.b.sealed = true;
  sealedTitan.p.hp = 50;
  hold(sealedTitan.g, 1, { yaw: 0, pitch: 0.3 });
  ok(sealedTitan.p.hp === 50, 'a sealed titan does nothing');
  const over = titan(1);
  over.p.hp = 125;
  hold(over.g, 1, { yaw: 0, pitch: 0.3 });
  ok(over.p.hp === 125, 'a titan gives no extra health');
}

{
  const pads = () => {
    const t = engineer();
    t.p.pos.x = -1.7;
    const enter = putUp(t, 3);
    t.p.pos.x = 8;
    t.p.pos.z = 8;
    const exit = (() => {
      t.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 4 }));
      hold(t.g, 0.6, { yaw: EAST });
      t.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 4 }));
      t.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
      t.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
      const b = t.g.buildings[t.g.buildings.length - 1];
      b.buildLeft = 0; b.hp = b.maxHp;
      return b;
    })();
    t.p.pos.x = -6; t.p.pos.z = 0;
    return Object.assign(t, { enter, exit });
  };
  const a = pads();
  ok(a.p.metal === 100, 'each pad costs 50');
  ok(a.exit.pos.z === 8, 'the exit stands elsewhere');
  a.p.pos.x = a.enter.pos.x; a.p.pos.z = a.enter.pos.z;
  a.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  ok(Math.abs(a.p.pos.z) < 1, 'standing on a pad takes a moment');
  const types = [];
  for (let i = 0; i < 40; i++) {
    a.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
    for (const ev of a.g.events) types.push(ev.type);
  }
  ok(types.includes('teleport'), 'the pad sends you off');
  near(a.p.pos.z, a.exit.pos.z, 0.2, 'you arrive at the exit');
  near(a.enter.charge, 10, 0.6, 'level 1 recharges in 10 s');

  const noExit = engineer();
  noExit.p.pos.x = -1.7;
  const lonely = putUp(noExit, 3);
  noExit.p.pos.x = lonely.pos.x; noExit.p.pos.z = lonely.pos.z;
  const none = [];
  for (let i = 0; i < 60; i++) {
    noExit.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
    for (const ev of noExit.g.events) none.push(ev.type);
  }
  ok(!none.includes('teleport'), 'no exit, no trip');

  const levels = pads();
  toLevel(levels.enter, 2); toLevel(levels.exit, 2);
  levels.p.pos.x = levels.enter.pos.x; levels.p.pos.z = levels.enter.pos.z;
  hold(levels.g, 0.7, { yaw: EAST });
  near(levels.enter.charge, 5, 0.6, 'level 2 recharges in 5 s');
  const lv3 = pads();
  toLevel(lv3.enter, 3); toLevel(lv3.exit, 3);
  lv3.p.pos.x = lv3.enter.pos.x; lv3.p.pos.z = lv3.enter.pos.z;
  hold(lv3.g, 0.7, { yaw: EAST });
  near(lv3.enter.charge, 3, 0.6, 'level 3 recharges in 3 s');

  const frag = pads();
  const camper = frag.g.addHero('runner', 'cold', false);
  camper.pos.x = frag.exit.pos.x; camper.pos.z = frag.exit.pos.z;
  frag.p.pos.x = frag.enter.pos.x; frag.p.pos.z = frag.enter.pos.z;
  const fragged = [];
  for (let i = 0; i < 40; i++) {
    frag.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
    for (const ev of frag.g.events) if (ev.type === 'death' && ev.hero === camper.id) fragged.push(ev);
  }
  ok(fragged.length === 1, 'an enemy on the exit dies');
  const pal = pads();
  const mate = pal.g.addHero('runner', 'hot', false);
  mate.pos.x = pal.exit.pos.x; mate.pos.z = pal.exit.pos.z;
  pal.p.pos.x = pal.enter.pos.x; pal.p.pos.z = pal.enter.pos.z;
  hold(pal.g, 0.7, { yaw: EAST });
  ok(mate.hp === mate.maxHp, 'a friend on the exit is safe');

  const enemyOn = pads();
  const stranger = enemyOn.g.addHero('runner', 'cold', false);
  stranger.pos.x = enemyOn.enter.pos.x; stranger.pos.z = enemyOn.enter.pos.z;
  hold(enemyOn.g, 1, { yaw: EAST });
  ok(Math.abs(stranger.pos.z) < 1, 'an enemy cannot use the pad');
  const spyOn = pads();
  const thief = spyOn.g.addHero('runner', 'cold', false);
  thief.mods.padThief = true;
  thief.pos.x = spyOn.enter.pos.x; thief.pos.z = spyOn.enter.pos.z;
  hold(spyOn.g, 1, { yaw: EAST });
  ok(Math.abs(thief.pos.z - spyOn.exit.pos.z) < 1, 'someone allowed by their kit can use it');
  const carrier = pads();
  carrier.p.flag = true;
  carrier.p.pos.x = carrier.enter.pos.x; carrier.p.pos.z = carrier.enter.pos.z;
  hold(carrier.g, 1, { yaw: EAST });
  ok(Math.abs(carrier.p.pos.z) < 1, 'nobody carries the valve through a pad');

  const shared = pads();
  shared.p.pos.x = shared.enter.pos.x - 1.2; shared.p.pos.z = shared.enter.pos.z;
  shared.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 3 }));
  hold(shared.g, 0.6, { yaw: EAST, pitch: -0.7 });
  shared.p.metal = 200;
  shared.enter.upgrade = 190;
  shared.exit.upgrade = 190;
  for (let i = 0; i < 49; i++) shared.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -0.7, fire: i === 0 }));
  ok(shared.enter.level === 2 && shared.exit.level === 2, 'upgrading one pad upgrades both');
  shared.g.damage(shared.exit, 1000, { by: null });
  ok(shared.enter.level === 1, 'when one pad is gone the other falls back to level 1');
  ok(!T.Build.own(shared.g, shared.p, 'exit'), 'the broken pad is gone');
  const fix = pads();
  fix.p.pos.x = fix.enter.pos.x - 1.2; fix.p.pos.z = fix.enter.pos.z;
  fix.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 3 }));
  hold(fix.g, 0.6, { yaw: EAST, pitch: -0.7 });
  fix.enter.hp = 10;
  fix.p.metal = 200;
  for (let i = 0; i < 49; i++) fix.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -0.7, fire: i === 0 }));
  near(fix.enter.hp, 110, 1e-6, 'a pad repairs 100 at a hit');
  ok(fix.p.metal === 180, 'a pad repair costs 20 metal');
}

{
  const base = () => {
    const t = engineer();
    t.p.pos.x = -1.7;
    const b = putUp(t, 1);
    t.p.pos.x = b.pos.x - 1;
    t.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 3 }));
    hold(t.g, 0.6, { yaw: EAST });
    return Object.assign(t, { b });
  };

  const c = base();
  c.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  ok(c.p.ghost && c.p.ghost.carried === c.b, 'the right button picks a building up');
  ok(c.g.buildings.length === 0, 'it leaves the ground');
  hold(c.g, 0.5, { yaw: EAST, fwd: 1 });
  const x0 = c.p.pos.x;
  hold(c.g, 1, { yaw: EAST, fwd: 1 });
  near(c.p.pos.x - x0, T.hu(300) * 0.9, T.hu(300) * 0.02, 'carrying slows to 90 %');
  const m0 = c.p.metal, clip = c.p.arms[0].clip;
  c.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 1 }));
  ok(c.p.slot === 2, 'no other weapon while carrying');
  ok(c.p.arms[0].clip === clip, 'no shots while carrying');
  c.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(c.g.buildings.length === 1 && !c.p.ghost, 'the left button sets it down');
  ok(c.p.metal === m0, 'moving costs nothing');
  ok(c.b.buildLeft > 0 && Math.abs(c.b.buildTotal - 5) < 1e-9, 'it deploys twice as fast');
  c.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  ok(c.p.speedCap === Infinity, 'the speed comes back');

  const kept = base();
  toLevel(kept.b, 3);
  kept.b.hp = 100;
  kept.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  kept.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(kept.b.level === 3 && kept.b.hp === 100, 'level and damage stay after a move');

  const sealed = base();
  sealed.b.sealed = true;
  sealed.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  ok(!sealed.p.ghost, 'a sealed building cannot be taken');
  const young = (() => {
    const t = engineer();
    t.p.pos.x = -1.7;
    const b = putUp(t, 1, EAST, false);
    t.p.pos.x = b.pos.x - 1;
    hold(t.g, 0.6, { yaw: EAST });
    t.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
    return t;
  })();
  ok(!young.p.ghost, 'a building under construction cannot be taken');

  const killed = base();
  killed.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  killed.p.hp = 1;
  killed.g.damage(killed.p, 5, {});
  ok(!killed.p.ghost && killed.g.buildings.length === 0, 'dying with a building destroys it');

  const dmg = base();
  dmg.b.team = 'cold';
  dmg.g.refreshVictims();
  dmg.p.pos.x = dmg.b.pos.x - 30;
  dmg.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 2 }));
  hold(dmg.g, 0.6, { yaw: EAST, pitch: -0.012 });
  const bullets = shoot(dmg.g, 3, { pitch: -0.012 });
  ok(bullets.length === 1, 'a bullet hits a building');
  near(bullets[0].amount, 15, 1e-6, 'distance does not change damage to a building');

  const wrecked = base();
  wrecked.g.damage(wrecked.b, 1000, { by: wrecked.p });
  ok(wrecked.g.buildings.length === 0 && !wrecked.b.alive, 'a building can be destroyed');
  ok(wrecked.g.drops.length === 1 && wrecked.g.drops[0].kind === 'metal' && wrecked.g.drops[0].metal === 65, 'a broken hydrant leaves 65 metal');
  wrecked.p.metal = 0;
  wrecked.p.pos.x = wrecked.g.drops[0].x; wrecked.p.pos.z = wrecked.g.drops[0].z;
  wrecked.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  ok(wrecked.p.metal === 65 && wrecked.g.drops.length === 0, 'a plumber picks it up');
  const nobody = lab('diver');
  settle(nobody.g, nobody.p);
  nobody.g.dropItem({ kind: 'metal', size: 0.5, metal: 65, x: 0, y: 0, z: 0, life: 30 });
  nobody.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  ok(nobody.g.drops.length === 1, 'nobody else needs metal');

  const scrap = base();
  scrap.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 5 }));
  hold(scrap.g, 0.6, { yaw: EAST });
  scrap.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 1 }));
  ok(scrap.g.buildings.length === 0 && scrap.g.drops.length === 0, 'the write-off removes a building and leaves nothing');

  const wall = base();
  const walker = wall.g.addHero('runner', 'cold', false);
  walker.pos.x = wall.b.pos.x;
  walker.pos.z = 0.2;
  wall.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  ok(Math.hypot(walker.pos.x - wall.b.pos.x, walker.pos.z - wall.b.pos.z) >= walker.r + wall.b.r - 0.01, 'an enemy cannot walk through a building');
  const open = base();
  const mate = open.g.addHero('runner', 'hot', false);
  mate.pos.x = open.b.pos.x;
  mate.pos.z = 0.1;
  open.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  ok(mate.pos.z === 0.1, 'your own side walks through');

  const mineOff = base();
  const foeMine = mineOff.g.addHero('miner', 'cold', false);
  foeMine.pos.x = 30;
  const shell = mineOff.g.launch(foeMine, T.WEAPONS.plunger, null, 1);
  shell.x = mineOff.b.pos.x - 1.5; shell.y = 0.6; shell.z = 0; shell.vx = 8; shell.vy = 0; shell.vz = 0;
  hold(mineOff.g, 0.3, { yaw: EAST });
  ok(!shell.stuck && shell.vx < 0, 'a mine bounces off a building');

  const ammo = engineer({ build: B => { B.ammo(3, 0, 0.2); B.ammo(6, 0, 0.5); B.ammo(9, 0, 1); B.locker(0, 8); } });
  const at = (x, z) => { ammo.p.pos.x = x; ammo.p.pos.z = z; ammo.g.step(Object.assign(T.blankInput(), { yaw: EAST })); };
  ammo.p.metal = 0;
  at(3, 0);
  ok(ammo.p.metal === 40, 'a crate gives 40 metal');
  ammo.p.metal = 0;
  at(6, 0);
  ok(ammo.p.metal === 100, 'two crates give 100 metal');
  ammo.p.metal = 0;
  at(9, 0);
  ok(ammo.p.metal === 200, 'a stack gives 200 metal');
  ammo.p.metal = 0;
  at(0, 7);
  ok(ammo.p.metal === 200, 'a locker fills the metal');
  ammo.p.metal = 0;
  ammo.g.dropItem({ kind: 'ammo', size: 0.5, x: 15, y: 0, z: 0, life: 30 });
  at(15, 0);
  ok(ammo.p.metal === 100, 'a dropped pack gives 100 metal');

  const change = base();
  change.g.setMerc(change.p, 'diver');
  ok(change.g.buildings.length === 0 && change.p.metal === 0, 'changing the mercenary takes the buildings away');
  const respawn = base();
  respawn.p.metal = 5;
  respawn.g.respawn(respawn.p);
  ok(respawn.g.buildings.length === 1 && respawn.p.metal === 200, 'buildings outlive their owner and the owner comes back with full metal');
}

{
  const inputs = seed => {
    const rand = T.rng(seed);
    const g = new T.Game({ map: 'yard', visual: false, merc: 'plumber', team: 'hot', seed });
    let yaw = 0, cur = T.blankInput();
    for (let i = 0; i < 60 * 40; i++) {
      if (i % 15 === 0) {
        cur = T.blankInput();
        cur.fwd = Math.floor(rand() * 3) - 1;
        cur.side = Math.floor(rand() * 3) - 1;
        cur.jump = rand() < 0.2;
        cur.fire = rand() < 0.5;
        cur.fire2 = rand() < 0.3;
        cur.slot = rand() < 0.3 ? 1 + Math.floor(rand() * 5) : 0;
        cur.pick = rand() < 0.4 ? 1 + Math.floor(rand() * 4) : 0;
        yaw += (rand() - 0.5) * 2;
      }
      cur.yaw = yaw;
      g.step(cur);
      const q = g.player.pos;
      assert.ok(Number.isFinite(q.x) && Number.isFinite(q.y) && Number.isFinite(q.z), 'position stays a number with buildings');
      for (const b of g.buildings) assert.ok(Number.isFinite(b.hp) && Number.isFinite(b.aimYaw), 'a building stays a number');
    }
    return g.stateHash();
  };
  const a = inputs(11), b = inputs(11);
  ok(a === b, 'buildings stay deterministic');
}

const spy = (dist, opts = {}) => armed('inspector', dist, opts);

{
  assert.deepEqual(T.MERCS.inspector.slots, ['revolver', 'seal', 'penknife', 'forms'], 'the inspector kit');
  checks++;
  const r = T.WEAPONS.revolver, k = T.WEAPONS.penknife;
  near(T.hitDamage(r, 0, null), 60, 1e-6, 'the revolver up close');
  near(T.hitDamage(r, 512, null), 40, 1e-6, 'the revolver in the middle');
  near(T.hitDamage(r, 1024, null), 21.12, 1e-6, 'the revolver far away');
  near(T.hitDamage(r, 0, 'crit'), 120, 1e-6, 'the revolver crit');
  near(T.hitDamage(r, 1024, 'mini'), 54, 1e-6, 'the revolver mini-crit far');
  near(T.hitDamage(r, 0, 'mini'), 81, 1e-6, 'the revolver mini-crit close');
  ok(r.clip === 6 && r.reserve === 24 && r.interval === 0.5 && r.reload[0] === 1.133, 'the revolver timing');
  near(T.hitDamage(k, 0, null), 40, 1e-6, 'the knife');
  near(T.hitDamage(k, 0, 'crit'), 120, 1e-6, 'the knife crit');
  near(T.hitDamage(k, 0, 'mini'), 54, 1e-6, 'the knife mini-crit');
  ok(k.interval === 0.8 && k.delay === 0 && k.backstabMul === 6, 'the knife timing');
  const line = spy(30);
  const shot = shoot(line.g, 3);
  ok(shot.length === 1, 'the first revolver shot is exact');
  const inspector = spy(null);
  ok(inspector.p.mods.padThief && inspector.p.mods.watch && inspector.p.mods.seesEnemies, 'the inspector gets his abilities from his kit');
}

const knifeAt = (dx, dz, targetYaw, opts = {}) => {
  const t = spy(null, Object.assign({ slot: 3 }, opts));
  const yaw = Math.atan2(dx, dz);
  const dummy = t.g.addDummy(opts.foe || 'diver', 'cold', dx, 0, dz, targetYaw);
  dummy.hp = dummy.maxHp = dummy.def.hp;
  t.g.step(Object.assign(T.blankInput(), { yaw }));
  return Object.assign(t, { dummy, yaw });
};

const stab = (t) => {
  const hits = [];
  for (let i = 0; i < 4; i++) {
    t.g.step(Object.assign(T.blankInput(), { yaw: t.yaw, fire: i === 0 }));
    for (const ev of t.g.events) if (ev.type === 'hit' && ev.dst === t.dummy.id) hits.push(Object.assign({ tick: i }, ev));
  }
  return hits;
};

{
  const back = knifeAt(1.5, 0, EAST);
  ok(back.p.stabReady, 'the knife rises when a back is in reach');
  const hits = stab(back);
  ok(hits.length === 1 && hits[0].tick === 0, 'the knife lands at once');
  near(hits[0].amount, 1200, 1e-6, 'a stab in the back deals six times the current health');
  ok(hits[0].boost === 'crit', 'it counts as a crit');

  const front = knifeAt(1.5, 0, -EAST);
  ok(!front.p.stabReady, 'the knife stays down in front of a face');
  near(stab(front)[0].amount, 40, 1e-6, 'from the front it deals 40');

  const side = knifeAt(1.5, 0, EAST + 1.4);
  ok(side.p.stabReady, 'anywhere in the rear half counts');
  ok(stab(side)[0].amount > 1000, 'a stab at an angle from behind still kills');
  const sideFront = knifeAt(1.5, 0, EAST + 1.8);
  ok(stab(sideFront)[0].amount === 40, 'just in front of the shoulder does not');

  const hp = knifeAt(1.5, 0, EAST, { foe: 'strongman' });
  hp.dummy.hp = 50;
  near(stab(hp)[0].amount, 300, 1e-6, 'it counts from the current health');

  const uber = knifeAt(1.5, 0, EAST);
  uber.dummy.uberT = 5;
  uber.g.step(Object.assign(T.blankInput(), { yaw: uber.yaw }));
  ok(!uber.p.stabReady, 'the knife stays down at a covered back');
  ok(stab(uber).length === 0, 'the cover blocks a stab');

  const far = knifeAt(2.5, 0, EAST);
  ok(!far.p.stabReady && stab(far).length === 0, 'the knife does not reach 2.5 m');

  const real = lab('inspector');
  settle(real.g, real.p);
  real.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 3 }));
  hold(real.g, 0.6, { yaw: EAST });
  place(real.p, 0, 0, 0, EAST);
  real.p.onGround = true;
  const victim = real.g.addHero('strongman', 'cold', false);
  victim.pos.x = 1.5;
  victim.yaw = EAST;
  const seen = [];
  for (let i = 0; i < 3; i++) {
    real.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: i === 0 }));
    for (const ev of real.g.events) seen.push(ev.type);
  }
  ok(seen.includes('backstab') && seen.includes('death'), 'a stab kills a full strongman');
  const wall = knifeAt(1.5, 0, EAST, { build: B => B.box(0.8, 0, -2, 0.95, 4, 2, 'wall') });
  ok(stab(wall).length === 0, 'no stab through a wall');
  const turret = (() => {
    const t = spy(null, { slot: 3 });
    const foe = t.g.addHero('plumber', 'cold', false);
    foe.fixed = true;
    foe.pos.x = 30;
    const b = { isBuilding: true, fixed: true, alive: true, kind: 'titan', def: T.BUILDINGS.titan, owner: foe, team: 'cold', r: 0.5, h: 1.3, level: 1, upgrade: 0, hp: 150, maxHp: 150, ammo: 0, rockets: 0, sealed: false, sealHits: 0, wakeT: 0, busyT: 0, hits: 0, hitsT: 0, fireCd: 0, rocketCd: 0, think: 0, target: null, sweep: 0, sweepDir: 1, pulse: 0, charge: 0, waitT: 0, waiter: null, lastHurt: -Infinity, pos: { x: 1.2, y: 0, z: 0 }, yaw: EAST, aimYaw: 0, aimPitch: 0, buildLeft: 0, buildTotal: 1, redeploy: false };
    t.g.buildings.push(b);
    t.g.refreshVictims();
    t.dummy = b;
    t.yaw = EAST;
    t.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
    return t;
  })();
  ok(!turret.p.stabReady, 'a building has no back');
  ok(stab(turret)[0].amount === 40, 'a knife hits a building for 40');
}

{
  const d = spy(null, { slot: 4 });
  d.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 2 }));
  ok(!d.p.disguise && d.p.disguiseT > 1.9, 'a disguise takes 2 s');
  hold(d.g, 1.9, { yaw: EAST });
  ok(!d.p.disguise, 'not ready before 2 s');
  hold(d.g, 0.2, { yaw: EAST });
  ok(d.p.disguise && d.p.disguise.merc === 'diver' && d.p.disguise.team === 'cold', 'the disguise is on and takes the enemy side by default');
  ok(d.p.disguised, 'it fools the enemy');
  d.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 5 }));
  ok(d.p.disguise.merc === 'diver' && d.p.disguiseT <= 0.5, 'a change takes 0.5 s');
  hold(d.g, 0.55, { yaw: EAST });
  ok(d.p.disguise.merc === 'strongman', 'the new disguise is on');
  d.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  ok(d.p.formTeam === 'hot', 'the right button changes the side in the folder');
  d.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  d.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 1 }));
  hold(d.g, 0.55, { yaw: EAST });
  ok(d.p.disguise.team === 'hot' && !d.p.disguised, 'wearing your own side fools nobody');
  const ten = spy(null, { slot: 4 });
  ten.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 10 }));
  hold(ten.g, 2.1, { yaw: EAST });
  ok(ten.p.disguise.merc === 'knight', 'the tenth pick is the knight');

  const slow = spy(null, { slot: 4 });
  slow.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 5 }));
  hold(slow.g, 2.1, { yaw: EAST });
  hold(slow.g, 0.5, { yaw: EAST, fwd: 1 });
  const x0 = slow.p.pos.x;
  hold(slow.g, 1, { yaw: EAST, fwd: 1 });
  near(slow.p.pos.x - x0, T.hu(230), T.hu(230) * 0.02, 'a disguise as the slow strongman walks at his speed');
  const fast = spy(null, { slot: 4 });
  fast.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 1 }));
  hold(fast.g, 2.1, { yaw: EAST });
  hold(fast.g, 0.5, { yaw: EAST, fwd: 1 });
  const x1 = fast.p.pos.x;
  hold(fast.g, 1, { yaw: EAST, fwd: 1 });
  near(fast.p.pos.x - x1, T.hu(320), T.hu(320) * 0.02, 'a disguise as the fast runner does not add speed');

  const shootOff = spy(10);
  shootOff.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, slot: 4 }));
  hold(shootOff.g, 0.6, { yaw: 0, pitch: 0.3 });
  shootOff.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, pick: 2 }));
  hold(shootOff.g, 2.1, { yaw: 0, pitch: 0.3 });
  shootOff.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, slot: 1 }));
  hold(shootOff.g, 0.6, { yaw: 0, pitch: 0.3 });
  ok(shootOff.p.disguise, 'changing the weapon keeps the disguise');
  shootOff.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(!shootOff.p.disguise && !shootOff.p.disguised, 'a shot takes it off');

  const knifeOff = knifeAt(1.5, 0, -EAST);
  knifeOff.p.disguise = { merc: 'diver', team: 'cold' };
  knifeOff.p.disguised = true;
  stab(knifeOff);
  ok(!knifeOff.p.disguise, 'a knife blow takes it off');

  const died = spy(null, { slot: 4 });
  died.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 1 }));
  hold(died.g, 2.1, { yaw: EAST });
  died.g.respawn(died.p);
  ok(!died.p.disguise, 'a new life has no disguise');
}

const hydrantFor = (opts = {}) => {
  const t = lab('plumber', opts.build, null, 'cold');
  settle(t.g, t.p);
  place(t.p, -1.7, 0, 0, EAST);
  t.p.onGround = true;
  const b = putUp(t, 1);
  b.aimYaw = EAST;
  t.p.pos.x = -30;
  return Object.assign(t, { b });
};

{
  const spyHero = (t, x) => {
    const h = t.g.addHero('inspector', 'hot', false);
    h.pos.x = x; h.pos.y = 0; h.pos.z = 0;
    h.prev.x = x; h.prev.y = 0; h.prev.z = 0;
    h.hp = h.maxHp = 1e6;
    return h;
  };
  const a = hydrantFor();
  const man = spyHero(a, a.b.pos.x + 8);
  man.disguise = { merc: 'diver', team: 'cold' };
  man.disguised = true;
  hold(a.g, 1, { yaw: -EAST });
  ok(man.hp === 1e6, 'a hydrant leaves a disguise alone');
  const own = hydrantFor();
  const open = spyHero(own, own.b.pos.x + 8);
  open.disguise = { merc: 'diver', team: 'hot' };
  open.disguised = false;
  hold(own.g, 1, { yaw: -EAST });
  ok(open.hp < 1e6, 'a disguise as your own side does not help');
  const hidden = hydrantFor();
  const ghost = spyHero(hidden, hidden.b.pos.x + 8);
  ghost.cloakState = 'on';
  ghost.cloaked = true;
  ghost.cloakT = 0;
  hold(hidden.g, 1, { yaw: -EAST });
  ok(ghost.hp === 1e6, 'a hydrant does not see the invisible');

  const titanFoe = lab('plumber', null, null, 'cold');
  settle(titanFoe.g, titanFoe.p);
  place(titanFoe.p, -1.7, 0, 0, EAST);
  titanFoe.p.onGround = true;
  const tb = putUp(titanFoe, 2);
  titanFoe.p.pos.x = -30;
  const guest = titanFoe.g.addHero('inspector', 'hot', false);
  guest.pos.x = tb.pos.x + 1.5;
  guest.hp = 50;
  guest.disguise = { merc: 'diver', team: 'cold' };
  guest.disguised = true;
  hold(titanFoe.g, 1, { yaw: -EAST });
  ok(guest.hp > 50, 'a titan serves a disguised enemy');

  const pads = lab('plumber', null, null, 'cold');
  settle(pads.g, pads.p);
  place(pads.p, -1.7, 0, 0, EAST);
  pads.p.onGround = true;
  const enter = putUp(pads, 3);
  place(pads.p, 10, 0, 10, EAST);
  pads.p.onGround = true;
  pads.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 4 }));
  hold(pads.g, 0.6, { yaw: EAST });
  pads.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 4 }));
  pads.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  pads.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  const exit = pads.g.buildings[1];
  exit.buildLeft = 0;
  exit.hp = exit.maxHp;
  pads.p.pos.x = -30;
  const user = pads.g.addHero('inspector', 'hot', false);
  user.pos.x = enter.pos.x; user.pos.z = enter.pos.z;
  hold(pads.g, 1, { yaw: EAST });
  near(user.pos.z, exit.pos.z, 0.5, 'the inspector can use enemy pads');
}

{
  const c = spy(null);
  c.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, fire2: true }));
  ok(c.p.cloakState === 'in' && c.p.cloaked, 'the right button starts the watch');
  hold(c.g, 0.95, { yaw: 0, pitch: 0.3 });
  ok(c.p.cloakState === 'in', 'fading out takes 1 s');
  hold(c.g, 0.1, { yaw: 0, pitch: 0.3 });
  ok(c.p.cloakState === 'on', 'then the inspector is gone');
  const clip = c.p.arms[0].clip;
  hold(c.g, 0.5, { yaw: 0, pitch: 0.3, fire: true });
  ok(c.p.arms[0].clip === clip, 'no shots while invisible');
  c.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3 }));
  c.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, fire2: true }));
  ok(c.p.cloakState === 'out' && !c.p.cloaked, 'the right button brings him back');
  hold(c.g, 1.9, { yaw: 0, pitch: 0.3, fire: true });
  ok(c.p.arms[0].clip === clip && c.p.cloakState === 'out', 'coming back takes 2 s without shots');
  hold(c.g, 0.15, { yaw: 0, pitch: 0.3, fire: true });
  ok(c.p.cloakState === 'off' && c.p.arms[0].clip === clip - 1, 'then he can shoot');

  const empty = spy(null);
  empty.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, fire2: true }));
  hold(empty.g, 9.9, { yaw: 0, pitch: 0.3 });
  ok(empty.p.cloaked, 'the watch holds nearly 10 s');
  hold(empty.g, 0.15, { yaw: 0, pitch: 0.3 });
  ok(!empty.p.cloaked && empty.p.cloakState === 'out' && empty.p.cloakMeter === 0, 'after 10 s the watch runs out');
  hold(empty.g, 2.1, { yaw: 0, pitch: 0.3 });
  const m0 = empty.p.cloakMeter;
  hold(empty.g, 15, { yaw: 0, pitch: 0.3 });
  near(empty.p.cloakMeter - m0, 0.5, 0.01, 'it recharges in 30 s');
  const no = spy(null);
  no.p.cloakMeter = 0.01;
  no.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, fire2: true }));
  ok(no.p.cloakState === 'off', 'an empty watch does not start');

  const hit = spy(null);
  hit.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, fire2: true }));
  hold(hit.g, 1.1, { yaw: 0, pitch: 0.3 });
  hit.g.damage(hit.p, 100, {});
  near(hit.p.hp, 125 - 80, 1e-6, 'the invisible take 20 % less');
  ok(hit.p.blinkT > 0, 'a hit makes him flicker');
  hold(hit.g, 0.3, { yaw: 0, pitch: 0.3 });
  ok(hit.p.blinkT === 0, 'the flicker passes');

  const bump = lab('inspector');
  settle(bump.g, bump.p);
  place(bump.p, 0, 0, 0, EAST);
  bump.p.onGround = true;
  const wallman = bump.g.addDummy('diver', 'cold', 1.5, 0, 0, 0);
  bump.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  hold(bump.g, 1.1, { yaw: EAST });
  ok(bump.p.blinkT === 0, 'no flicker in free space');
  let blinked = false;
  for (let i = 0; i < 60; i++) {
    bump.g.step(Object.assign(T.blankInput(), { yaw: EAST, fwd: 1 }));
    if (bump.p.blinkT > 0) blinked = true;
  }
  ok(blinked && !!wallman, 'bumping an enemy makes him flicker');

  const patient = armed('vet', 4, { slot: 2, team: 'hot', foe: 'inspector' });
  patient.dummy.cloaked = true;
  patient.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(!patient.p.patient, 'the beam does not take an invisible friend');

  const crates = spy(null, { build: B => { B.ammo(3, 0, 0.2); B.ammo(6, 0, 0.5); B.locker(0, 6); } });
  crates.p.cloakMeter = 0.2;
  crates.p.pos.x = 3;
  crates.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  near(crates.p.cloakMeter, 0.4, 0.001, 'a crate recharges the watch');
  crates.p.pos.x = 6;
  crates.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  near(crates.p.cloakMeter, 0.9, 0.003, 'two crates recharge more');
  crates.p.cloakMeter = 0.1;
  crates.p.pos.x = 0; crates.p.pos.z = 5;
  crates.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  ok(crates.p.cloakMeter === 1, 'a locker fills the watch');

  const fire = spy(null);
  fire.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, fire2: true }));
  hold(fire.g, 1.1, { yaw: 0, pitch: 0.3 });
  fire.g.ignite(fire.p, fire.p, T.WEAPONS.torch);
  const b0 = fire.p.burnT;
  hold(fire.g, 1, { yaw: 0, pitch: 0.3 });
  near(b0 - fire.p.burnT, 1.5, 0.05, 'a burn runs out faster on the invisible');

  const feed = lab('plumber');
  settle(feed.g, feed.p);
  place(feed.p, -1.7, 0, 0, EAST);
  feed.p.onGround = true;
  const fed = putUp(feed, 2);
  feed.p.pos.x = -30;
  const friendSpy = feed.g.addHero('inspector', 'hot', false);
  friendSpy.pos.x = fed.pos.x + 1.5;
  friendSpy.cloakState = 'on';
  friendSpy.cloaked = true;
  const before = friendSpy.cloakMeter = 0.5;
  hold(feed.g, 2, { yaw: EAST });
  near(friendSpy.cloakMeter, before, 0.01, 'a level 1 titan stops the drain');
}

{
  const sealRun = (level) => {
    const t = lab('plumber', null, null, 'cold');
    settle(t.g, t.p);
    place(t.p, -1.7, 0, 0, EAST);
    t.p.onGround = true;
    const b = putUp(t, 1);
    toLevel(b, level);
    t.p.pos.x = -30;
    const s = t.g.addHero('inspector', 'hot', true);
    s.pos.x = b.pos.x - 1.2;
    s.yaw = EAST;
    s.disguise = { merc: 'plumber', team: 'cold' };
    s.disguised = true;
    t.g.player = s;
    return Object.assign(t, { b, s });
  };
  const useSeal = (t) => {
    const heroes = t.g.heroes;
    heroes.splice(heroes.indexOf(t.p), 1);
    t.g.refreshVictims();
    t.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 2 }));
    hold(t.g, 0.6, { yaw: EAST });
    t.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  };
  const s1 = sealRun(1);
  useSeal(s1);
  ok(s1.b.sealed, 'the left button seals an enemy building');
  ok(s1.b.target === null && !T.Build.ready(s1.b), 'a sealed building stops at once');
  let life = 0;
  while (s1.b.alive && life < 900) { s1.g.step(Object.assign(T.blankInput(), { yaw: EAST })); life++; }
  near(life / 60, 6, 0.1, 'a seal breaks a level 1 hydrant in 6 s');
  ok(s1.g.buildings.length === 0, 'the building is gone');
  const s2 = sealRun(2);
  useSeal(s2);
  life = 0;
  while (s2.b.alive && life < 900) { s2.g.step(Object.assign(T.blankInput(), { yaw: EAST })); life++; }
  near(life / 60, 7.2, 0.1, 'level 2 lasts 7.2 s');
  const s3 = sealRun(3);
  useSeal(s3);
  life = 0;
  while (s3.b.alive && life < 900) { s3.g.step(Object.assign(T.blankInput(), { yaw: EAST })); life++; }
  near(life / 60, 8.64, 0.1, 'level 3 lasts 8.64 s');

  const keep = sealRun(1);
  keep.s.disguise = { merc: 'plumber', team: 'cold' };
  keep.s.disguised = true;
  useSeal(keep);
  ok(keep.b.sealed && keep.s.disguise, 'a seal does not take off a disguise');
  const invisible = sealRun(1);
  invisible.s.cloakState = 'on';
  invisible.s.cloaked = true;
  useSeal(invisible);
  ok(!invisible.b.sealed, 'no seal while invisible');
  const far = sealRun(1);
  far.s.pos.x = far.b.pos.x - 4;
  useSeal(far);
  ok(!far.b.sealed, 'a seal needs to be close');

  const mine = lab('inspector');
  settle(mine.g, mine.p);
  place(mine.p, 0, 0, 0, EAST);
  mine.p.onGround = true;
  mine.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 2 }));
  hold(mine.g, 0.6, { yaw: EAST });
  ok(!mine.p.arms[1].clip, 'the seal has no ammo');
  mine.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(mine.g.buildings.length === 0, 'nothing happens without a building');
  mine.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  mine.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  ok(mine.p.cloakState === 'in', 'the watch works with the seal in hand');

  const pads = lab('plumber', null, null, 'cold');
  settle(pads.g, pads.p);
  place(pads.p, -1.7, 0, 0, EAST);
  pads.p.onGround = true;
  const enter = putUp(pads, 3);
  place(pads.p, 10, 0, 10, EAST);
  pads.p.onGround = true;
  pads.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 4 }));
  hold(pads.g, 0.6, { yaw: EAST });
  pads.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 4 }));
  pads.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  pads.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  const exit = pads.g.buildings[1];
  exit.buildLeft = 0;
  exit.hp = exit.maxHp;
  T.Build.seal(pads.g, Object.assign({}, pads.p, { team: 'hot', pos: { x: enter.pos.x - 1, y: 0, z: enter.pos.z }, yaw: EAST, pitch: -0.5, h: 1.6, duck: 0 }), T.WEAPONS.seal);
  ok(enter.sealed && exit.sealed, 'sealing one pad seals both');
  exit.sealed = true;
  pads.p.pos.x = enter.pos.x - 1.2; pads.p.pos.z = enter.pos.z;
  pads.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -0.7, slot: 3 }));
  hold(pads.g, 0.6, { yaw: EAST, pitch: -0.7 });
  for (let i = 0; i < 98; i++) pads.g.step(Object.assign(T.blankInput(), { yaw: EAST, pitch: -0.7, fire: i === 0 || i === 49 }));
  ok(!enter.sealed && !exit.sealed, 'taking one off frees both');
}

{
  const y = new T.Game({ map: 'yard', visual: false, merc: 'inspector', team: 'hot' });
  ok(y.map.patrols.length === 2, 'the yard has walking stand-ins');
  const walkers = y.heroes.filter(h => h.patrol);
  ok(walkers.length === 2 && walkers[0].team !== walkers[1].team, 'one per side');
  const w = walkers[0];
  const z0 = { x: w.pos.x, z: w.pos.z };
  for (let i = 0; i < 300; i++) y.step(Object.assign(T.blankInput(), { yaw: EAST }));
  ok(Math.hypot(w.pos.x - z0.x, w.pos.z - z0.z) > 5, 'a stand-in walks');
  ok(w.yaw !== 0 || w.vel.z !== 0, 'it faces where it walks');
  const yaw0 = w.patrol.at;
  for (let i = 0; i < 60 * 12; i++) y.step(Object.assign(T.blankInput(), { yaw: EAST }));
  ok(w.patrol.at !== yaw0 || w.pos.x !== 0, 'it follows its loop');
  y.damage(w, 1e6, {});
  ok(w.alive && w.hp === w.maxHp && Math.hypot(w.pos.x - w.patrol.points[0][0], w.pos.z - w.patrol.points[0][1]) < 0.01, 'a broken stand-in starts over');
  const bounds = y.map.bounds;
  ok(w.pos.x > bounds.x0 && w.pos.x < bounds.x1, 'it stays in the yard');

  const yard = new T.Game({ map: 'yard', visual: false, merc: 'inspector', team: 'hot' });
  ok(yard.buildings.length === 4, 'the yard has two buildings per side');
  ok(yard.buildings.every(b => T.Build.ready(b) && b.hp === b.maxHp), 'they stand ready');
  ok(yard.buildings.every(b => b.owner.fixed && b.owner.team === b.team), 'each has a stand-in owner of its side');
  const standby = yard.heroes.filter(h => h.fixed).map(h => h.hp);
  const turrets = yard.buildings.map(b => b.hp);
  for (let i = 0; i < 300; i++) yard.step(Object.assign(T.blankInput(), { yaw: EAST }));
  assert.deepEqual(yard.heroes.filter(h => h.fixed).map(h => h.hp), standby, 'the yard hydrants leave the stand-ins alone');
  checks++;
  assert.deepEqual(yard.buildings.map(b => b.hp), turrets, 'the yard hydrants leave each other alone');
  checks++;
  const coldHydrant = yard.buildings.find(b => b.kind === 'hydrant' && b.team === 'cold');
  const hotHydrant = yard.buildings.find(b => b.kind === 'hydrant' && b.team === 'hot');
  const p = yard.player;
  const shells = coldHydrant.ammo;
  p.pos.x = coldHydrant.pos.x - 8; p.pos.y = 0; p.pos.z = coldHydrant.pos.z;
  const hp0 = p.hp;
  for (let i = 0; i < 60; i++) yard.step(Object.assign(T.blankInput(), { yaw: EAST }));
  ok(p.hp < hp0 || p.pos.x !== coldHydrant.pos.x - 8, 'the enemy hydrant fires at a live body');
  ok(coldHydrant.ammo === shells, 'a yard hydrant does not run dry');
  p.hp = p.maxHp;
  p.pos.x = hotHydrant.pos.x - 6; p.pos.z = hotHydrant.pos.z;
  const near1 = p.hp;
  for (let i = 0; i < 30; i++) yard.step(Object.assign(T.blankInput(), { yaw: EAST }));
  ok(hotHydrant.target !== p && near1 > 0, 'your own hydrant does not fire at you');
  yard.damage(coldHydrant, 1e6, { by: p });
  ok(!coldHydrant.alive, 'a yard building can be broken');
  yard.player.pos.x = -50; yard.player.pos.z = -40;
  for (let i = 0; i < 60 * 9; i++) yard.step(Object.assign(T.blankInput(), { yaw: EAST }));
  ok(yard.buildings.length === 3, 'it stays broken for a while');
  for (let i = 0; i < 60 * 1.2; i++) yard.step(Object.assign(T.blankInput(), { yaw: EAST }));
  ok(yard.buildings.length === 4, 'it comes back after 10 s');
  ok(yard.heroes.filter(h => h.def.id === 'plumber' && h.fixed).length === 6, 'the owners do not multiply');

  const sealer = new T.Game({ map: 'yard', visual: false, merc: 'inspector', team: 'hot' });
  const target = sealer.buildings.find(b => b.kind === 'hydrant' && b.team === 'cold');
  const s = sealer.player;
  s.pos.x = target.pos.x + 1.2; s.pos.y = 0; s.pos.z = target.pos.z;
  s.disguise = { merc: 'plumber', team: 'cold' };
  s.disguised = true;
  sealer.step(Object.assign(T.blankInput(), { yaw: -EAST, slot: 2 }));
  for (let i = 0; i < 36; i++) sealer.step(Object.assign(T.blankInput(), { yaw: -EAST }));
  sealer.step(Object.assign(T.blankInput(), { yaw: -EAST, fire: true }));
  ok(target.sealed, 'the inspector can seal the yard hydrant');
  ok(s.hp === s.maxHp, 'a disguise walks up to it unharmed');
}

{
  ok(Object.keys(T.WEAPONS).length === 31, 'the library holds 31 items: ' + Object.keys(T.WEAPONS).length);
  for (const id in T.MERCS) {
    for (const w of (T.MERCS[id].slots || []).concat(T.MERCS[id].passive || [])) ok(T.WEAPONS[w], id + ' takes a real item: ' + w);
  }
  for (const [hp, over] of [[125, 185], [150, 225], [175, 260], [200, 300], [300, 450]]) ok(T.overFor(hp) === over, 'extra health limit for ' + hp);
  for (const id of T.MERC_ORDER) ok(T.overFor(T.MERCS[id].hp) === T.MERCS[id].over, 'the table agrees with the rule for ' + id);

  const k = armed('knight', null);
  assert.deepEqual(T.MERCS.knight.slots, ['sword'], 'the knight has only the sword');
  checks++;
  assert.deepEqual(T.MERCS.knight.passive, ['spurs', 'lid'], 'the knight wears boots and a lid');
  checks++;
  ok(k.p.hp === 175 && k.p.maxHp === 175, 'boots add 25 and the sword takes 25');
  ok(k.p.overHp === 260, 'the extra health limit follows');
  ok(k.p.arms.length === 1 && k.p.arms[0].def.id === 'sword', 'no ranged weapon');
  near(k.p.speed, T.hu(300), 1e-9, 'the knight walks at 300 units');
  ok(k.p.mods.resist.fire === 0.5 && k.p.mods.resist.blast === 0.7, 'the lid resists fire and blast');
  near(k.p.mods.charge.speed, T.hu(750), 1e-9, 'the charge runs at 750 units');
  ok(k.p.mods.charge.time === 1.5 && k.p.mods.charge.cool === 12, 'the charge timing');
  near(k.p.mods.charge.turn * k.p.mods.turnMul, 135 * Math.PI / 180, 1e-9, 'with boots the charge turns 135 degrees a second');

  const s = T.WEAPONS.sword;
  near(T.hitDamage(s, 0, null), 65, 1e-9, 'the sword deals 65');
  near(T.hitDamage(s, 0, 'crit'), 195, 1e-9, 'the sword crit');
  near(T.hitDamage(s, 0, 'mini'), 87.75, 1e-9, 'the sword mini-crit');
  near(s.range, T.hu(108), 1e-9, 'the sword reaches 50 % farther');
  ok(s.interval === 0.8 && s.delay === 0.2, 'the sword timing');
  const reach = armed('knight', 2.3);
  ok(shoot(reach.g, 20).length === 1, 'the sword reaches 2.3 m');
  ok(shoot(armed('knight', 3).g, 20).length === 0, 'the sword does not reach 3 m');
}

const charged = (dist, opts) => armed('knight', dist, opts);
const startRun = (t, yaw = EAST) => t.g.step(Object.assign(T.blankInput(), { yaw, fire2: true }));

{
  const run = charged(null);
  startRun(run);
  ok(run.p.charging, 'the right button starts the charge');
  const x0 = run.p.pos.x;
  hold(run.g, 1, { yaw: EAST });
  near(run.p.pos.x - x0, T.hu(750), T.hu(750) * 0.02, 'the charge runs at 14.29 m/s');
  hold(run.g, 0.48, { yaw: EAST });
  ok(run.p.charging, 'it nearly lasts 1.5 s');
  hold(run.g, 0.05, { yaw: EAST });
  ok(!run.p.charging && run.p.chargeMeter < 0.01, 'then it ends and empties the meter');
  hold(run.g, 0.2, { yaw: EAST });
  ok(Math.hypot(run.p.vel.x, run.p.vel.z) < T.hu(300) * 1.01, 'the speed drops back');
  startRun(run);
  ok(!run.p.charging, 'an empty meter does not charge');
  hold(run.g, 11.7, { yaw: EAST });
  ok(run.p.chargeMeter < 1, 'not ready before 12 s');
  hold(run.g, 0.2, { yaw: EAST });
  ok(run.p.chargeMeter === 1, 'ready after 12 s');

  const steer = charged(null);
  startRun(steer);
  hold(steer.g, 0.5, { yaw: EAST + 2 });
  near(steer.p.yaw, EAST + 135 * Math.PI / 180 * 0.5, 0.05, 'the mouse turns 135 degrees a second at most');
  const free = charged(null);
  free.g.step(Object.assign(T.blankInput(), { yaw: EAST + 2 }));
  ok(free.p.yaw === EAST + 2, 'outside the charge the mouse is free');

  const wall = charged(null, { build: B => B.box(6, 0, -6, 6.5, 4, 6, 'wall') });
  startRun(wall);
  hold(wall.g, 0.7, { yaw: EAST });
  ok(!wall.p.charging && wall.p.pos.x < 6, 'a wall ends the charge');

  const noJump = charged(null);
  startRun(noJump);
  hold(noJump.g, 0.3, { yaw: EAST, jump: true });
  ok(noJump.p.onGround, 'no jump during a charge');

  const burn = charged(null);
  burn.g.ignite(burn.p, burn.p, T.WEAPONS.torch);
  ok(burn.p.burnT > 0, 'the knight burns');
  startRun(burn);
  ok(burn.p.burnT === 0, 'the charge puts the fire out');

  const wet = lab('knight', B => { B.floor(-5, -5, 5, 5, -3, 'plate', { t: 1 }); B.water(-5, -5, 5, 5, -3, 0); }, [[-5, -5, 5, 5]]);
  place(wet.p, 0, -1.5, 0, EAST);
  hold(wet.g, 0.2, { yaw: EAST });
  wet.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  ok(!wet.p.charging, 'no charge in deep water');
}

{
  const swingAt = (seconds, gap) => {
    const speed = T.hu(750);
    const t = charged(speed * seconds + 1.9);
    const d = t.dummy;
    const hits = [];
    startRun(t);
    const ticks = Math.round(seconds * 60);
    for (let i = 0; i < ticks + 30; i++) {
      t.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: i === ticks }));
      for (const ev of t.g.events) if (ev.type === 'hit' && ev.dst === d.id) hits.push(ev);
    }
    return hits;
  };
  const early = swingAt(0.2);
  ok(early.length === 1 && early[0].boost === null, 'a swing before 25 % has no bonus');
  near(early[0].amount, 65, 1e-9, 'it deals 65');
  const mid = swingAt(0.45);
  ok(mid.length === 1 && mid[0].boost === 'mini', 'a swing after 25 % is a mini-crit');
  near(mid[0].amount, 87.75, 1e-9, 'it deals 88');
  const late = swingAt(1);
  ok(late.length === 1 && late[0].boost === 'crit', 'a swing after 60 % is a crit');
  near(late[0].amount, 195, 1e-9, 'it deals 195');

  const stops = charged(null);
  startRun(stops);
  hold(stops.g, 0.3, { yaw: EAST });
  stops.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(!stops.p.charging && stops.p.chargeMeter < 0.01, 'a swing ends the charge');

  const grace = charged(null);
  startRun(grace);
  hold(grace.g, 1.52, { yaw: EAST });
  ok(!grace.p.charging && grace.p.chargeBoostT > 0 && grace.p.chargeBoostKind === 'crit', 'right after the end the crit still waits');
  hold(grace.g, 0.25, { yaw: EAST });
  ok(grace.p.chargeBoostT === 0, 'then it is gone');
  const quick = charged(null);
  startRun(quick);
  hold(quick.g, 0.1, { yaw: EAST });
  quick.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(quick.p.chargeBoostT === 0, 'a short charge leaves no bonus');
}

{
  const ram = charged(8);
  startRun(ram);
  const hits = [];
  for (let i = 0; i < 60; i++) {
    ram.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
    for (const ev of ram.g.events) if (ev.type === 'hit' && ev.dst === ram.dummy.id) hits.push(ev.amount);
  }
  ok(hits.length === 1, 'a charge rams once');
  near(hits[0], 50, 1e-9, 'a ram deals 50');
  ok(!ram.p.charging && ram.p.chargeMeter < 0.1, 'a ram ends the charge');
  const more = charged(8);
  more.p.notches = 3;
  startRun(more);
  const hits3 = [];
  for (let i = 0; i < 60; i++) {
    more.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
    for (const ev of more.g.events) if (ev.type === 'hit' && ev.dst === more.dummy.id) hits3.push(ev.amount);
  }
  near(hits3[0], 65, 1e-9, 'each notch adds 5 to a ram');
  const body = lab('knight');
  settle(body.g, body.p);
  place(body.p, 0, 0, 0, EAST);
  body.p.onGround = true;
  const foe = body.g.addHero('runner', 'cold', false);
  foe.pos.x = 6;
  body.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  hold(body.g, 0.6, { yaw: EAST });
  ok(foe.pos.x > 6.5, 'a ram throws the enemy');
  const mate = charged(5, { team: 'hot' });
  startRun(mate);
  hold(mate.g, 0.6, { yaw: EAST });
  ok(mate.p.charging && mate.p.pos.x > 5, 'a charge runs through your own side');
}

const kill = (t, target) => {
  target.hp = 1;
  for (let i = 0; i < 49; i++) t.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: i === 0 }));
};

{
  const n = charged(1.5);
  n.p.hp = 100;
  kill(n, n.dummy);
  ok(n.p.notches === 1, 'a sword kill cuts a notch');
  ok(n.p.maxHp === 190, 'a notch adds 15 to the limit');
  ok(n.p.overHp === 285, 'and to the extra health limit');
  near(n.p.hp, 115, 1e-9, 'and heals 15');
  near(n.p.speed, T.hu(324), 1e-9, 'one notch gives 324 units');
  kill(n, n.dummy);
  near(n.p.speed, T.hu(348), 1e-9, 'two notches give 348');
  kill(n, n.dummy);
  near(n.p.speed, T.hu(370), 1e-9, 'three notches hit the limit of 370');
  kill(n, n.dummy);
  near(n.p.speed, T.hu(370), 1e-9, 'four stay at 370');
  ok(n.p.notches === 4 && n.p.maxHp === 235, 'four notches give 235 health');
  n.p.hp = 100;
  kill(n, n.dummy);
  ok(n.p.notches === 4 && n.p.maxHp === 235, 'no fifth notch');
  near(n.p.hp, 115, 1e-9, 'a kill at the limit still heals 15');
  hold(n.g, 0.2, { yaw: EAST, fwd: 1 });
  n.g.respawn(n.p);
  ok(n.p.notches === 0 && n.p.maxHp === 175 && n.p.speed === T.hu(300), 'death takes the notches');
  ok(n.p.hp === 175, 'and the new life starts at normal health');

  const fill = charged(1.5);
  startRun(fill);
  hold(fill.g, 1.6, { yaw: EAST });
  place(fill.p, 0, 0, 0, EAST);
  fill.p.onGround = true;
  const m0 = fill.p.chargeMeter;
  kill(fill, fill.dummy);
  near(fill.p.chargeMeter - m0, 0.25 + 49 / 60 / 12, 0.01, 'a melee kill fills a quarter of the meter');

  const notSword = armed('diver', 1.5, { slot: 3 });
  notSword.dummy.hp = 1;
  for (let i = 0; i < 49; i++) notSword.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: i === 0 }));
  ok(notSword.p.notches === 0, 'another blade cuts no notch');

  const ranged = armed('diver', 3);
  ranged.dummy.hp = 1;
  shoot(ranged.g, 30);
  ok(ranged.p.chargeMeter === 1, 'a ranged kill changes nothing');

  const ramKill = charged(8);
  ramKill.dummy.hp = 1;
  startRun(ramKill);
  hold(ramKill.g, 1, { yaw: EAST });
  ok(ramKill.p.notches === 0, 'a ram kill cuts no notch');
  ok(ramKill.p.chargeMeter < 0.25, 'a ram kill fills nothing');

  const seen = charged(1.5);
  seen.dummy.hp = 1;
  const types = [];
  for (let i = 0; i < 20; i++) {
    seen.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: i === 0 }));
    for (const ev of seen.g.events) types.push(ev.type);
  }
  ok(types.includes('notch') && types.includes('broken'), 'the notch is announced');
}

{
  const blast = lab('welder');
  settle(blast.g, blast.p);
  place(blast.p, 0, 0, 0, EAST);
  blast.p.onGround = true;
  const k = blast.g.addHero('knight', 'cold', true);
  k.human = false;
  k.pos.x = 4;
  k.charging = true;
  k.chargeRun = 0.6;
  k.yaw = -EAST;
  blast.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  ok(!k.charging, 'a blast stops the charge');
  near(k.chargeMeter, 0.6, 0.02, 'the rest of the charge stays in the meter');
  ok(k.vel.x > 5, 'and throws the knight back');

  const resist = armed('knight', null);
  const foe = resist.g.addHero('diver', 'cold', false);
  foe.fixed = true;
  foe.pos.x = 40;
  const p = resist.p;
  resist.g.damage(p, 100, { by: foe, def: T.WEAPONS.tube, element: 'blast' });
  near(p.hp, 175 - 70, 1e-9, 'blast is reduced by 30 %');
  p.hp = 175;
  resist.g.damage(p, 10, { by: foe, def: T.WEAPONS.torch, element: 'fire' });
  near(p.hp, 170, 1e-9, 'fire is reduced by 50 %');
  p.hp = 175;
  resist.g.damage(p, 10, { by: foe, def: T.WEAPONS.pistol });
  near(p.hp, 165, 1e-9, 'bullets are not reduced');
  const burning = armed('knight', null);
  burning.g.ignite(burning.p, burning.p, T.WEAPONS.torch);
  burning.p.burnTick = 0.01;
  burning.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3 }));
  near(burning.p.hp, 173, 1e-6, 'a burn tick on the knight is halved');
  const rocket = armed('diver', 8, { foe: 'knight' });
  const seen = shoot(rocket.g, 40);
  ok(seen.length === 1, 'a rocket hits the knight stand-in');
  near(seen[0].amount, T.hitDamage(T.WEAPONS.tube, rocket.g.distanceHu(rocket.p, rocket.dummy), null) * 0.7, 1e-6, 'through the lid a rocket deals 30 % less');
  const torch = armed('welder', 2, { foe: 'knight' });
  const flame = shoot(torch.g, 2, { fire: true }).filter(h => h.weapon === 'torch');
  near(flame[0].amount, T.flameDamage(T.WEAPONS.torch, 1.5 / T.WEAPONS.torch.range, 0.5, null) * 0.5, 1.5, 'through the lid a flame deals half');
}

{
  T.MERCS.foreman = { id: 'foreman', name: 'Бригадир', role: 'support', key: '-', hp: 200, over: 300, speed: T.hu(240), slots: ['tube', 'hose', 'gaff'] };
  const foreman = armed('foreman', 8);
  ok(foreman.p.arms.length === 3, 'a new mercenary is one record in the table');
  ok(shoot(foreman.g, 40).length === 1, 'his rocket launcher works');
  const mate = armed('foreman', 5, { slot: 2, team: 'hot', foe: 'runner' });
  mate.dummy.hp = 50;
  hold(mate.g, 1, { yaw: EAST, fire: true });
  ok(mate.dummy.hp > 50, 'his hose heals');
  ok(mate.p.arms[1].charge > 0, 'and builds pressure');
  delete T.MERCS.foreman;

  T.MERCS.duelist = { id: 'duelist', name: 'Дуэлянт', role: 'attack', key: '-', hp: 150, over: 225, speed: T.hu(300), slots: ['revolver', 'sword'], passive: ['spurs', 'lid'] };
  const duelist = armed('duelist', null);
  ok(duelist.p.maxHp === 150, 'boots and sword balance out on any body');
  duelist.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, fire2: true }));
  ok(duelist.p.charging, 'the lid gives a charge to anyone');
  delete T.MERCS.duelist;

  T.MERCS.tinker = { id: 'tinker', name: 'Сторож склада', role: 'defense', key: '-', hp: 200, over: 300, speed: T.hu(230), slots: ['carousel', 'wrench', 'build', 'scrap'] };
  const tinker = armed('tinker', null);
  ok(tinker.p.metal === 200, 'metal comes with the tools');
  tinker.g.step(Object.assign(T.blankInput(), { yaw: EAST, slot: 3 }));
  hold(tinker.g, 0.6, { yaw: EAST });
  tinker.g.step(Object.assign(T.blankInput(), { yaw: EAST, pick: 1 }));
  tinker.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire: true }));
  ok(tinker.g.buildings.length === 1, 'any kit with the papers can build');
  delete T.MERCS.tinker;

  T.MERCS.shadow = { id: 'shadow', name: 'Тень', role: 'support', key: '-', hp: 125, over: 185, speed: T.hu(300), slots: ['smg', 'forms'], passive: ['watch'] };
  const shadow = armed('shadow', null);
  shadow.g.step(Object.assign(T.blankInput(), { yaw: 0, pitch: 0.3, fire2: true }));
  ok(shadow.p.cloakState === 'in', 'the watch works for anyone');
  delete T.MERCS.shadow;

  const shooters = ['sawn', 'pistol', 'pump', 'tube', 'shotgun', 'gaff', 'torch', 'hammer', 'lobber', 'plunger', 'pick', 'carousel', 'fists', 'wrench', 'drench', 'hacksaw', 'rifle', 'smg', 'pchak', 'revolver', 'penknife', 'sword'];
  const helpers = ['sandwich', 'build', 'scrap', 'hose', 'seal', 'forms'];
  const passives = ['watch', 'spurs', 'lid'];
  const pickFrom = (rand, list, n) => {
    const pool = list.slice(), out = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    return out;
  };
  const QUICK = process.argv.includes('--quick');
  const KITS = QUICK ? 4 : 10;
  for (let seed = 1; seed <= KITS; seed++) {
    const rand = T.rng(seed * 977);
    const slots = pickFrom(rand, shooters, 1 + Math.floor(rand() * 3)).concat(pickFrom(rand, helpers, Math.floor(rand() * 3)));
    const passive = pickFrom(rand, passives, Math.floor(rand() * 3));
    T.MERCS.random = { id: 'random', name: 'Случайный', role: 'attack', key: '-', hp: 150, over: 225, speed: T.hu(300), slots, passive };
    const g = new T.Game({ map: 'yard', visual: false, merc: 'random', team: seed % 2 ? 'hot' : 'cold', seed });
    const p = g.player;
    let yaw = rand() * 6, pitch = 0, cur = T.blankInput(), fired = 0;
    for (let i = 0; i < 60 * 60; i++) {
      if (i % 12 === 0) {
        cur = T.blankInput();
        cur.fwd = Math.floor(rand() * 3) - 1;
        cur.side = Math.floor(rand() * 3) - 1;
        cur.jump = rand() < 0.2;
        cur.crouch = rand() < 0.15;
        cur.fire = rand() < 0.6;
        cur.fire2 = rand() < 0.25;
        cur.reload = rand() < 0.1;
        cur.slot = rand() < 0.3 ? 1 + Math.floor(rand() * slots.length) : 0;
        cur.next = rand() < 0.1 ? 1 : 0;
        cur.last = rand() < 0.1;
        cur.pick = rand() < 0.3 ? 1 + Math.floor(rand() * 10) : 0;
        yaw += (rand() - 0.5) * 2;
        pitch = (rand() - 0.5) * 1.4;
      }
      cur.yaw = yaw;
      cur.pitch = pitch;
      g.step(cur);
      for (const ev of g.events) if (ev.type === 'shot' || (ev.type === 'hit' && ev.src === p.id)) fired++;
      if (p.flaming) fired++;
      assert.ok(Number.isFinite(p.pos.x) && Number.isFinite(p.pos.y) && Number.isFinite(p.pos.z) && Number.isFinite(p.hp), 'kit ' + slots + ' keeps numbers');
      for (const s of g.proj) assert.ok(Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.z), 'kit ' + slots + ' keeps its shells in numbers');
      for (const b of g.buildings) assert.ok(Number.isFinite(b.hp), 'kit ' + slots + ' keeps its buildings in numbers');
      assert.ok(p.pos.y > g.map.killY - 1, 'kit ' + slots + ' stays in the map');
    }
    ok(fired > 0, 'kit ' + slots + ' has something to fire with');
    log('kit', slots.join('+'), passive.join('+'), 'fired', fired);
  }
  delete T.MERCS.random;

  const fair = new T.Game({ map: 'yard', visual: false, merc: 'knight', team: 'hot', seed: 3 });
  const twin = new T.Game({ map: 'yard', visual: false, merc: 'knight', team: 'hot', seed: 3 });
  for (let i = 0; i < 600; i++) {
    const inp = Object.assign(T.blankInput(), { fwd: 1, yaw: EAST + i * 0.002, fire: i % 90 === 0, fire2: i % 200 === 0 });
    fair.step(Object.assign({}, inp));
    twin.step(Object.assign({}, inp));
  }
  ok(fair.stateHash() === twin.stateHash(), 'the knight stays deterministic');
}

{
  const crates = B => { B.ammo(3, 0, 0.2); B.ammo(6, 0, 0.5); B.ammo(9, 0, 1); B.locker(0, 8); };
  const standOn = (t, x, z = 0) => {
    t.p.pos.x = x; t.p.pos.z = z; t.p.pos.y = 0;
    t.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  };
  const tick = 1 / 60 / 12;
  for (const [x, part, name, at] of [[3, 1 / 8, 'a crate', 0], [6, 1 / 5, 'two crates', 1], [9, 1 / 3, 'a stack', 2]]) {
    const t = armed('knight', null, { build: crates });
    t.p.chargeMeter = 0;
    standOn(t, x);
    near(t.p.chargeMeter, part + tick, 1e-9, name + ' fill the charge by ' + part);
    ok(t.g.pickups[at].readyAt > t.g.t, name + ' are used up by the charge');
  }
  const stacked = armed('knight', null, { build: crates });
  stacked.p.chargeMeter = 0.9;
  standOn(stacked, 9);
  ok(stacked.p.chargeMeter === 1, 'the charge stops at full');
  const full = armed('knight', null, { build: crates });
  standOn(full, 3);
  ok(full.g.pickups[0].readyAt === 0, 'a crate stays when the charge is full');
  const running = armed('knight', null, { build: B => B.ammo(5, 0, 1) });
  running.g.step(Object.assign(T.blankInput(), { yaw: EAST, fire2: true }));
  hold(running.g, 0.5, { yaw: EAST });
  ok(running.p.pos.x > 5.5 && running.p.charging, 'the charge runs over the stack');
  ok(running.g.pickups[0].readyAt === 0, 'a charge in progress takes nothing from it');
  const pack = armed('knight', null);
  pack.p.chargeMeter = 0;
  pack.g.dropItem({ kind: 'ammo', size: 0.5, x: 0, y: 0, z: 0, life: 30 });
  pack.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  near(pack.p.chargeMeter, 1 / 5 + tick, 1e-9, 'a dropped pack counts as two crates');
  ok(pack.g.drops.length === 0, 'the pack is used up');
  const scrapMetal = armed('knight', null);
  scrapMetal.p.chargeMeter = 0;
  scrapMetal.g.dropItem({ kind: 'metal', size: 0.5, metal: 65, x: 0, y: 0, z: 0, life: 30 });
  scrapMetal.g.step(Object.assign(T.blankInput(), { yaw: EAST }));
  ok(scrapMetal.g.drops.length === 1 && scrapMetal.p.chargeMeter < 0.01, 'scrap metal does not fill the charge');

  const titan = lab('plumber', null, null, 'hot');
  settle(titan.g, titan.p);
  place(titan.p, -1.7, 0, 0, EAST);
  titan.p.onGround = true;
  const tb = putUp(titan, 2);
  toLevel(tb, 3);
  titan.p.pos.x = -30;
  const k = titan.g.addHero('knight', 'hot', false);
  k.pos.x = tb.pos.x + 1.5;
  k.chargeMeter = 0;
  k.hp = 50;
  hold(titan.g, 3, { yaw: EAST });
  ok(k.hp > 100, 'a titan heals the knight');
  near(k.chargeMeter, 3 / 12, 0.01, 'a titan adds nothing to the charge');

  const locker = armed('knight', null, { build: crates });
  locker.p.chargeMeter = 0.1;
  standOn(locker, 0, 7);
  ok(locker.p.chargeMeter === 1, 'a locker fills the charge');
  const time = armed('knight', null);
  time.p.chargeMeter = 0;
  hold(time.g, 6, { yaw: EAST });
  near(time.p.chargeMeter, 0.5, 0.01, 'the charge still fills by itself in 12 s');
  const other = armed('diver', null, { build: crates });
  other.p.chargeMeter = 0;
  standOn(other, 3);
  ok(other.g.pickups[0].readyAt === 0, 'a crate means nothing to a body without a lid and full ammo');
}

const botBox = (name, build) => {
  T.MAPS[name] = { name: 'x', build };
  return T.buildMap(name, { visual: false });
};

const lone = (map, merc, level, x, z, y) => {
  const g = new T.Game({ map, visual: false, spectate: true, seed: 3, rules: { respawn: 5 } });
  const b = g.addBot(merc, 'hot', level);
  if (x !== undefined) {
    b.pos.x = b.prev.x = x;
    b.pos.y = b.prev.y = y || 0;
    b.pos.z = b.prev.z = z;
  }
  return { g, b };
};

const runFor = (g, seconds, each) => {
  for (let i = 0; i < seconds * 60; i++) {
    g.step(T.blankInput());
    if (each) each(i);
  }
};

const practice = (level, merc, foeMerc, dist) => {
  const g = new T.Game({ map: 'duelfield', visual: false, spectate: true, seed: 2, rules: { noRespawn: true } });
  const b = g.addBot(merc, 'hot', level);
  b.pos.x = b.prev.x = 0;
  b.yaw = EAST;
  const foe = g.addDummy(foeMerc || 'strongman', 'cold', dist, 0, 0, -EAST);
  foe.hp = foe.maxHp = 1e6;
  return { g, b, foe };
};

{
  const rows = { novice: [1, 0.25], worker: [0.5, 0.1], foreman: [0.3, 0.05], master: [0.2, 0.05] };
  for (const id in rows) ok(T.BOT_LEVELS[id].reaction === rows[id][0] && T.BOT_LEVELS[id].aimEvery === rows[id][1], 'level ' + id + ' keeps its timing');
  ok(T.BOT_ORDER.length === 4, 'four levels');
  ok(T.BOT_LEVELS.novice.err > T.BOT_LEVELS.worker.err && T.BOT_LEVELS.worker.err > T.BOT_LEVELS.foreman.err && T.BOT_LEVELS.foreman.err > T.BOT_LEVELS.master.err, 'each level aims better than the last');
  ok(T.BOT_LEVELS.novice.blast === 0 && T.BOT_LEVELS.worker.blast === 0.5 && T.BOT_LEVELS.foreman.blast === 0.9 && T.BOT_LEVELS.master.blast === 1, 'the airblast chances follow the table');
  ok(T.BOT_ROSTER.length === 12 && T.BOT_ROSTER.every(id => T.MERCS[id]), 'the roster fills a side');
  ok(!/Math\.random|Date\.now|new Date/.test(read('js/apps/tf98/tf-ai.js') + read('js/apps/tf98/tf-nav.js')), 'bots have no hidden randomness or clock');

  const m = T.buildMap('arena', { visual: false });
  const nav = new T.Nav(m);
  ok(nav.n > 2000, 'the arena grid has nodes: ' + nav.n);
  const tiers = new Set();
  for (let i = 0; i < nav.n; i++) tiers.add(Math.round(nav.y[i]));
  ok(tiers.has(0) && tiers.has(3), 'the grid has a ground level and an upper level');
  const hot = m.spawns.filter(s => s.team === 'hot'), cold = m.spawns.filter(s => s.team === 'cold');
  ok(hot.length >= 6 && cold.length >= 6, 'each side has a spread of spawn points');
  ok(m.spawns.every(s => s.y === 0), 'spawn points stand on the shower floor, not on its roof');
  ok(m.lockers.every(l => l.y === 0), 'the lockers stand on the shower floor');
  const from = nav.nearest(hot[0].x, hot[0].y, hot[0].z, 3);
  const to = nav.nearest(cold[0].x, cold[0].y, cold[0].z, 3);
  ok(from >= 0 && to >= 0, 'spawn points stand on the grid');
  ok(!nav.path(from, to, 'hot'), 'a side cannot walk into the enemy shower');
  ok(!nav.path(to, from, 'cold'), 'the same goes for the other side');
  const middle = nav.nearest(0, 0, 0, 3);
  ok(nav.y[middle] < 0.5, 'the middle of the lane is on the ground');
  const deck = nav.nearest(0, 3.4, 0, 3);
  ok(nav.y[deck] > 3, 'the deck above it is a level of its own');
  for (const team of ['hot', 'cold']) {
    const s = team === 'hot' ? hot[0] : cold[0];
    const a = nav.nearest(s.x, s.y, s.z, 3);
    ok(nav.path(a, middle, team), team + ' reaches the middle through its own door');
    ok(nav.path(a, deck, team), team + ' reaches the deck');
    for (const r of m.roam) ok(nav.path(a, nav.nearest(r.x, r.y, r.z, 3), team), team + ' reaches every roam point');
    for (const p of m.pickups) ok(nav.path(a, nav.nearest(p.x, p.y, p.z, 3), team), team + ' reaches every pickup');
  }
  const upper = m.roam.find(r => r.y > 3);
  const route = nav.path(from, nav.nearest(upper.x, upper.y, upper.z, 3), 'hot');
  ok(route && route.some(k => nav.y[k] > 0.5 && nav.y[k] < 3), 'the way up goes over the ramp');
  ok(nav.edgeFlag(from, from) === -1, 'a node has no edge to itself');

  const gm = botBox('gatebox', B => {
    B.ground(-20, -10, 20, 10, 0, [], 'ground', { t: 4 });
    B.wall(0, -10, 0, 10, 5, 0.5, 'wall', { holes: [[5, 7.4, 0, 2.6]] });
    B.gate(0, -5, 0, -2.6, 2.6, 'x+');
    B.spawn('hot', -10, 0, EAST);
    B.roam(10, 0);
    B.bounds(-20, -10, 20, 10);
  });
  const gn = new T.Nav(gm);
  const west = gn.nearest(-10, 0, 0, 3), east = gn.nearest(10, 0, 0, 3);
  ok(gn.path(west, east, 'hot'), 'a one-way gate lets through in its direction');
  ok(!gn.path(east, west, 'hot'), 'a one-way gate holds the other way');
  const walker = lone('gatebox', 'runner', 'worker');
  runFor(walker.g, 7);
  ok(walker.b.pos.x > 5, 'a bot walks through the gate: ' + walker.b.pos.x);
  ok(walker.g.aiStuck === 0, 'and does not get stuck in it');

  const ledges = B => {
    B.ground(-20, -10, 20, 10, 0, [], 'ground', { t: 4 });
    B.box(2, 0, -10, 20, 0.8, -1, 'block');
    B.box(2, 0, 1, 20, 1.2, 10, 'block');
    B.box(-20, 0, 4, -2, 3.5, 10, 'block');
    B.box(-20, 0, -10, -2, 6, -6, 'block');
    B.spawn('hot', -5, 0, EAST);
    B.bounds(-20, -10, 20, 10);
  };
  const ln = new T.Nav(botBox('ledgebox', ledges));
  const low = ln.nearest(0, 0, 0, 2), jump = ln.nearest(8, 0.8, -5, 2), high = ln.nearest(8, 1.2, 5, 2), top = ln.nearest(-10, 3.5, 7, 2), tall = ln.nearest(-10, 6, -8, 2);
  const flagsOn = p => p.slice(1).map((k, i) => ln.edgeFlag(p[i], k));
  ok(flagsOn(ln.path(low, jump, 'hot')).includes(T.Nav.F_JUMP), 'a low ledge takes a jump');
  ok(flagsOn(ln.path(low, high, 'hot')).includes(T.Nav.F_HIGH), 'a higher ledge takes a crouch jump');
  ok(!ln.path(low, top, 'hot'), 'a 3.5 m wall is not a path');
  ok(flagsOn(ln.path(top, low, 'hot')).includes(T.Nav.F_DROP), 'jumping down it is a path');
  ok(!ln.path(tall, low, 'hot'), 'a 6 m drop is not a path');
  for (const [z, y, what] of [[-5, 0.8, 'jump'], [5, 1.2, 'crouch jump']]) {
    botBox('ledgeroam', B => { ledges(B); B.roam(8, z, y); });
    const hopper = lone('ledgeroam', 'plumber', 'worker');
    runFor(hopper.g, 6);
    ok(hopper.b.pos.y > y - 0.05, 'a bot gets up with a ' + what + ': ' + hopper.b.pos.y);
    ok(!hopper.b.crouched, 'and stands up after the ' + what);
  }

  const pm = botBox('poolbox', B => {
    B.ground(-20, -8, -3, 8, 0, [], 'ground', { t: 4 });
    B.ground(3, -8, 20, 8, 0, [], 'ground', { t: 4 });
    B.ground(-3, -8, 3, 8, -2.4, [], 'ground', { t: 2 });
    B.water(-3, -8, 3, 8, -2.4, -0.3);
    B.wall(-20, -8, 20, -8, 4, 0.5, 'wall');
    B.wall(-20, 8, 20, 8, 4, 0.5, 'wall');
    B.spawn('hot', -10, 0, EAST);
    B.roam(10, 0);
    B.bounds(-20, -8, 20, 8);
    B.killY(-20);
  });
  const pn = new T.Nav(pm);
  const bank = pn.nearest(-10, 0, 0, 2), far = pn.nearest(10, 0, 0, 2);
  const swim = pn.path(bank, far, 'hot');
  ok(swim, 'the far bank is reachable over the water');
  const swimFlags = swim.slice(1).map((k, i) => pn.edgeFlag(swim[i], k));
  ok(swimFlags.includes(T.Nav.F_SWIM) && swimFlags.includes(T.Nav.F_OUT), 'the way goes by swimming and climbing out');
  const swimmer = lone('poolbox', 'runner', 'worker');
  let wetted = false;
  runFor(swimmer.g, 14, () => { if (swimmer.b.level >= 2) wetted = true; });
  ok(wetted, 'a bot gets in the water');
  ok(swimmer.b.pos.x > 5 && swimmer.b.pos.y > -0.1, 'a bot crosses the pool and climbs out: ' + swimmer.b.pos.x + ' ' + swimmer.b.pos.y);

  const dm = botBox('dangerbox', B => {
    B.ground(-30, -20, 30, 20, 0, [], 'ground', { t: 4 });
    B.box(-15, 0, -6, 15, 8, -1, 'block');
    B.spawn('hot', -25, -3, EAST);
    B.bounds(-30, -20, 30, 20);
  });
  const dn = new T.Nav(dm);
  const s0 = dn.nearest(-25, 0, -3, 2), s1 = dn.nearest(25, 0, -3, 2);
  const free = dn.path(s0, s1, 'hot');
  ok(free.every(k => dn.z[k] > -7), 'with no hydrant the short way goes north of the block');
  dn.setDanger('hot', [{ def: T.BUILDINGS.hydrant, pos: { x: 0, y: 0, z: 10 }, h: T.BUILDINGS.hydrant.h }]);
  const wary = dn.path(s0, s1, 'hot');
  ok(wary.some(k => dn.z[k] < -6), 'a known hydrant sends the way south');
  ok(dn.path(s0, s1, 'cold').every(k => dn.z[k] > -7), 'but only for the side that knows of it');
  dn.setDanger('hot', []);
  ok(dn.path(s0, s1, 'hot').every(k => dn.z[k] > -7), 'and the way returns when it is gone');
}

T.MAPS.duelfield = {
  name: 'Поле',
  build(B) {
    B.ground(-60, -30, 60, 30, 0, [], 'ground', { t: 8 });
    B.spawn('hot', -40, 0, EAST);
    B.spawn('cold', 40, 0, -EAST);
    B.roam(0, 0);
    B.bounds(-60, -30, 60, 30);
    B.killY(-30);
  }
};

const fight = (a, la, b, lb, dist, seed) => {
  const g = new T.Game({ map: 'duelfield', visual: false, spectate: true, seed, rules: { noRespawn: true } });
  const left = g.addBot(a, 'hot', la), right = g.addBot(b, 'cold', lb);
  left.pos.x = -dist / 2; right.pos.x = dist / 2;
  left.prev.x = left.pos.x; right.prev.x = right.pos.x;
  left.yaw = EAST; right.yaw = -EAST;
  for (let i = 0; i < 60 * 30; i++) {
    g.step(T.blankInput());
    if (!left.alive || !right.alive) break;
  }
  return { left, right, g };
};

{
  const shoots = fight('diver', 'worker', 'diver', 'worker', 15, 3);
  ok(!shoots.left.alive || !shoots.right.alive, 'two bots settle a duel');
  for (const merc of T.MERC_ORDER) {
    for (const dist of [5, 15, 30]) {
      const { g, foe } = practice('foreman', merc, 'strongman', dist);
      runFor(g, 20);
      ok(foe.hp < foe.maxHp, merc + ' hurts a target from ' + dist + ' m');
    }
  }
  if (!process.argv.includes('--quick')) {
    let wins = 0;
    const rounds = 30;
    for (let s = 1; s <= rounds; s++) {
      const r = fight('diver', 'master', 'diver', 'novice', 15, s * 13);
      if (r.left.alive && !r.right.alive) wins++;
    }
    ok(wins >= rounds * 0.7, 'a master beats a novice: ' + wins + ' of ' + rounds);
    let mid = 0;
    for (let s = 1; s <= rounds; s++) {
      const r = fight('runner', 'foreman', 'runner', 'novice', 10, s * 17);
      if (r.left.alive && !r.right.alive) mid++;
    }
    ok(mid >= rounds * 0.6, 'a foreman beats a novice: ' + mid + ' of ' + rounds);
    log('master wins', wins, 'foreman wins', mid);
  }

  const answer = level => {
    const { g, b } = practice(level, 'plumber', 'strongman', 8);
    for (let i = 0; i < 60 * 4; i++) {
      g.step(T.blankInput());
      if (g.events.some(ev => ev.type === 'shot' && ev.hero === b.id)) return i / 60;
    }
    return Infinity;
  };
  const times = T.BOT_ORDER.map(answer);
  ok(times[0] > times[1] && times[1] > times[2] && times[2] > times[3], 'each level answers faster than the last: ' + times.join(' '));
  ok(times[0] >= 1, 'a novice waits about a second: ' + times[0]);
  ok(times[3] >= 0.2, 'a master still waits their reaction time: ' + times[3]);

  const shots = level => {
    const { g, b, foe } = practice(level, 'plumber', 'runner', 14);
    foe.fixed = false;
    foe.patrol = { points: [[14, 18], [14, -18]], at: 0, y: 0 };
    let dealt = 0;
    runFor(g, 20, () => { for (const ev of g.events) if (ev.type === 'hit' && ev.src === b.id) dealt += ev.amount; });
    return dealt;
  };
  const dealtBy = T.BOT_ORDER.map(shots);
  ok(dealtBy[3] > dealtBy[0] * 1.5, 'a master hurts a runner more than a novice: ' + dealtBy.join(' '));
  log('damage to a runner by level', dealtBy.map(Math.round).join(' '));

  const hideSeek = new T.Game({ map: 'duelfield', visual: false, spectate: true, seed: 2, rules: { noRespawn: true } });
  const watcher = hideSeek.addBot('diver', 'hot', 'master');
  watcher.pos.x = watcher.prev.x = 0;
  watcher.yaw = EAST;
  const ghost = hideSeek.addDummy('inspector', 'cold', 6, 0, 0, 0);
  ghost.cloaked = true;
  ghost.cloakState = 'on';
  ghost.cloakMeter = 1e6;
  runFor(hideSeek, 1);
  ok(!watcher.ai.target, 'a bot does not see the invisible');
  ghost.blinkT = 1;
  runFor(hideSeek, 0.3);
  ok(watcher.ai.target === ghost, 'a flicker gives them away');

  const masked = new T.Game({ map: 'duelfield', visual: false, spectate: true, seed: 2, rules: { noRespawn: true } });
  const w2 = masked.addBot('diver', 'hot', 'master');
  w2.pos.x = w2.prev.x = 0;
  w2.yaw = EAST;
  const mask = masked.addDummy('inspector', 'cold', 6, 0, 0, 0);
  mask.disguise = { merc: 'diver', team: 'hot' };
  mask.disguised = true;
  runFor(masked, 1);
  ok(!w2.ai.target, 'a bot takes a disguise at face value');
  mask.disguise = null;
  mask.disguised = false;
  runFor(masked, 0.3);
  ok(w2.ai.target === mask, 'and shoots when it drops');

  botBox('wallbox', B => {
    B.ground(-30, -15, 30, 15, 0, [], 'ground', { t: 4 });
    B.wall(0, -15, 0, 15, 8, 1, 'wall');
    B.spawn('hot', -10, 0, EAST);
    B.spawn('cold', 10, 0, -EAST);
    B.bounds(-30, -15, 30, 15);
  });
  const wg = new T.Game({ map: 'wallbox', visual: false, spectate: true, seed: 2, rules: { noRespawn: true } });
  const wb = wg.addBot('diver', 'hot', 'master');
  wg.addDummy('strongman', 'cold', 10, 0, 0, 0);
  runFor(wg, 1);
  ok(!wb.ai.target, 'a wall hides a target');

  const ears = new T.Game({ map: 'wallbox', visual: false, spectate: true, seed: 2, rules: { noRespawn: true } });
  const listener = ears.addBot('diver', 'hot', 'master');
  const noisy = ears.addHero('runner', 'cold', false);
  noisy.pos.x = noisy.prev.x = 10;
  noisy.fireCd = 1;
  runFor(ears, 0.4);
  ok(listener.ai.lastSeen && listener.ai.lastSeen.x === 10 && !listener.ai.target, 'a shot behind a wall is heard, not seen');

  const lead = new T.Game({ map: 'duelfield', visual: false, spectate: true, seed: 2, rules: { noRespawn: true } });
  const shooter = lead.addBot('diver', 'hot', 'master');
  shooter.pos.x = shooter.prev.x = 0;
  shooter.yaw = EAST;
  const run = lead.addHero('runner', 'cold', false);
  run.pos.x = run.prev.x = 20;
  run.pos.z = run.prev.z = -20;
  run.hp = run.maxHp = 1e6;
  run.patrol = { points: [[20, 25], [20, -25]], at: 0, y: 0 };
  let ahead = 0, count = 0;
  runFor(lead, 3, () => {
    if (run.vel.z > 3 && shooter.ai.target === run && shooter.ai.want) {
      const direct = Math.atan2(run.pos.x - shooter.pos.x, run.pos.z - shooter.pos.z);
      ahead += Math.atan2(Math.sin(direct - shooter.ai.want.yaw), Math.cos(direct - shooter.ai.want.yaw));
      count++;
    }
  });
  ok(count > 0 && ahead / count > 0.1, 'a master leads a running target: ' + ahead / Math.max(count, 1));

  const lobbed = practice('master', 'miner', 'strongman', 22);
  let lobHigh = 0;
  runFor(lobbed.g, 3, () => { for (const p of lobbed.g.proj) if (p.owner === lobbed.b && p.def.flight === 'grenade' && p.y > lobHigh) lobHigh = p.y; });
  ok(lobHigh > 2.2, 'a grenade goes over the target in an arc: ' + lobHigh);
  ok(lobbed.foe.hp < lobbed.foe.maxHp, 'and comes down on it');

  const heads = level => {
    const { g, b } = practice(level, 'hunter', 'strongman', 30);
    let head = 0, hits = 0, pitch = 0, aims = 0;
    runFor(g, 18, () => {
      for (const ev of g.events) if (ev.type === 'hit' && ev.src === b.id) { hits++; if (ev.head) head++; }
      if (b.ai.want) { pitch += b.ai.want.pitch; aims++; }
    });
    return { head, hits, pitch: pitch / aims };
  };
  const sharp = heads('master'), plain = heads('worker');
  ok(sharp.head > 0, 'a master sniper takes the head: ' + JSON.stringify(sharp));
  ok(plain.hits > 0, 'a worker sniper still hits: ' + JSON.stringify(plain));
  ok(sharp.pitch > plain.pitch + 0.008, 'a master aims at the head, a worker at the body: ' + sharp.pitch + ' ' + plain.pitch);

  const reflects = level => {
    let turned = 0;
    for (let s = 0; s < 20; s++) {
      const g = new T.Game({ map: 'duelfield', visual: false, spectate: true, seed: s + 1, rules: { noRespawn: true } });
      const pyro = g.addBot('welder', 'hot', level);
      pyro.pos.x = pyro.prev.x = 0;
      pyro.yaw = EAST;
      const foe = g.addDummy('diver', 'cold', 8, 0, 0, -EAST);
      foe.hp = foe.maxHp = 1e6;
      g.step(T.blankInput());
      pyro.ai.swapT = 1e9;
      g.selectSlot(pyro, 0);
      pyro.deployT = 0;
      g.launch(foe, T.WEAPONS.tube, null, T.WEAPONS.tube.speed);
      for (let i = 0; i < 60; i++) {
        g.step(T.blankInput());
        if (g.events.some(ev => ev.type === 'reflect')) { turned++; break; }
      }
    }
    return turned;
  };
  ok(reflects('novice') === 0, 'a novice never turns a shell');
  ok(reflects('master') === 20, 'a master always does');
  const halfway = reflects('worker');
  ok(halfway >= 4 && halfway <= 16, 'a worker does about half the time: ' + halfway);

  const mines = practice('worker', 'miner', 'strongman', 8);
  mines.g.step(T.blankInput());
  mines.b.ai.swapT = 1e9;
  mines.g.selectSlot(mines.b, 1);
  let laid = 0;
  runFor(mines.g, 8, () => { for (const ev of mines.g.events) if (ev.type === 'shot' && ev.weapon === 'plunger') laid++; });
  ok(laid > 0, 'a bot lays mines');
  ok(mines.foe.hp < mines.foe.maxHp, 'and sets them off near the target');

  const knight = practice('worker', 'knight', 'strongman', 14);
  let rushed = false, crit = false;
  runFor(knight.g, 8, () => {
    for (const ev of knight.g.events) {
      if (ev.type === 'charge') rushed = true;
      if (ev.type === 'hit' && ev.src === knight.b.id && ev.boost) crit = true;
    }
  });
  ok(rushed, 'a knight bot rushes');
  ok(crit, 'and swings in the boosted window');
  const greenKnight = practice('novice', 'knight', 'strongman', 14);
  let greenRush = false;
  runFor(greenKnight.g, 8, () => { if (greenKnight.g.events.some(ev => ev.type === 'charge')) greenRush = true; });
  ok(!greenRush, 'a novice knight just walks');

  botBox('shelf', B => {
    B.ground(-30, -15, 30, 15, 0, [], 'ground', { t: 4 });
    B.box(-14, 0, -2, 14, 6, 2, 'block');
    B.spawn('hot', 0, -10, EAST);
    B.spawn('cold', 10, -10, -EAST);
    B.bounds(-30, -15, 30, 15);
  });
  const shelf = new T.Game({ map: 'shelf', visual: false, spectate: true, seed: 4, rules: { noRespawn: true } });
  const onShelf = shelf.addBot('plumber', 'hot', 'worker');
  onShelf.pos.x = onShelf.prev.x = -8;
  onShelf.pos.y = onShelf.prev.y = 6;
  onShelf.pos.z = onShelf.prev.z = 0;
  onShelf.yaw = EAST;
  const shelfFoe = shelf.addDummy('strongman', 'cold', 6, 6, 0, -EAST);
  shelfFoe.hp = shelfFoe.maxHp = 1e6;
  let lowest = 6;
  runFor(shelf, 12, () => { lowest = Math.min(lowest, onShelf.pos.y); });
  ok(lowest > 5.9, 'a bot strafing on a narrow shelf does not fall off: ' + lowest);
  ok(shelfFoe.hp < shelfFoe.maxHp, 'while it keeps shooting');

  const low = lone('arena', 'diver', 'worker', -24, 2);
  low.b.hp = 20;
  low.g.step(T.blankInput());
  const hurtAt = low.b.hp;
  for (let i = 0; i < 60 * 8 && low.b.hp <= hurtAt; i++) low.g.step(T.blankInput());
  ok(low.b.hp > hurtAt, 'a hurt bot goes to the nearest health: ' + low.b.hp);
  const dry = lone('arena', 'diver', 'worker', -24, 2);
  dry.b.arms[0].reserve = 0;
  dry.b.arms[0].clip = 0;
  for (let i = 0; i < 60 * 8 && dry.b.arms[0].reserve === 0; i++) dry.g.step(T.blankInput());
  ok(dry.b.arms[0].reserve > 0, 'an empty bot goes for ammo');

  const fortMap = botBox('hydrantbox', B => {
    B.ground(-40, -20, 40, 20, 0, [], 'ground', { t: 4 });
    B.spawn('hot', -15, 0, EAST);
    B.spawn('cold', 30, 0, -EAST);
    B.turret('hydrant', 'cold', 0, 0, -EAST, 'plumber');
    B.roam(-30, 0);
    B.bounds(-40, -20, 40, 20);
  });
  ok(fortMap.turrets.length === 1, 'the hydrant map has a hydrant');
  const fort = new T.Game({ map: 'hydrantbox', visual: false, spectate: true, seed: 5, rules: { respawn: 1 } });
  fort.addBot('diver', 'hot', 'worker');
  const gun = fort.buildings.find(k => k.kind === 'hydrant');
  ok(!!gun, 'the hydrant stands');
  let gunLow = gun.hp;
  runFor(fort, 2, () => { gunLow = Math.min(gunLow, gun.hp); });
  ok(fort.aiKnown.hot.includes(gun), 'a bot that sees a hydrant tells its side');
  ok(!!fort.nav.danger[1], 'the way there gets dearer');
  runFor(fort, 6, () => { gunLow = Math.min(gunLow, gun.hp); });
  ok(gunLow < gun.maxHp, 'a bot shoots a hydrant it sees');
  gun.alive = false;
  fort.step(T.blankInput());
  ok(!fort.aiKnown.hot.includes(gun) && !fort.nav.danger[1], 'a broken hydrant is forgotten');

  botBox('fallbox', B => {
    B.ground(-20, -10, 20, 10, 0, [], 'ground', { t: 4 });
    B.spawn('hot', -10, 0, EAST);
    B.bounds(-20, -10, 20, 10);
    B.killY(-20);
  });
  const faller = lone('fallbox', 'runner', 'novice');
  faller.g.rules.respawn = 2;
  faller.g.hurt(faller.b, 1e6, 'test');
  ok(!faller.b.alive && faller.b.respawnT === 2, 'a dead bot waits');
  const dropsMines = new T.Game({ map: 'fallbox', visual: false, spectate: true, seed: 1, rules: { respawn: 2 } });
  const widow = dropsMines.addBot('miner', 'hot', 'novice');
  dropsMines.launch(widow, T.WEAPONS.plunger, null, 5);
  ok(dropsMines.proj.length === 1, 'a mine is out');
  dropsMines.hurt(widow, 1e6, 'test');
  ok(dropsMines.proj.every(p => p.dead), 'the mines of a dead bot go with them');
  const pending = new T.Game({ map: 'fallbox', visual: false, spectate: true, seed: 1, rules: { respawn: 0.5 } });
  const again = pending.addBot('diver', 'hot', 'novice');
  pending.hurt(again, 1e6, 'test');
  runFor(pending, 0.25);
  ok(!again.alive, 'still waiting');
  runFor(pending, 0.3);
  ok(again.alive && again.hp === again.maxHp, 'then back on its feet');
  ok(!again.ai || !again.ai.target, 'with a clean head');
}

const arenaRun = (levels, seconds, seed) => {
  const g = new T.Game({ map: 'arena', visual: false, spectate: true, bots: { size: 12, levels }, seed, rules: { respawn: 5 } });
  const seen = new Map(), idle = new Map();
  let worstIdle = 0, top = 0, ground = 0;
  for (let i = 0; i < seconds * 60; i++) {
    g.step(T.blankInput());
    for (const h of g.heroes) assert.ok(Number.isFinite(h.pos.x) && Number.isFinite(h.pos.y) && Number.isFinite(h.pos.z) && Number.isFinite(h.yaw) && Number.isFinite(h.pitch), 'a bot stays in numbers');
    if (i % 60) continue;
    for (const h of g.heroes) {
      if (!h.alive) { seen.delete(h); idle.delete(h); continue; }
      if (h.pos.y > 3) top++;
      else if (h.pos.y < 0.2 && Math.abs(h.pos.x) < 33) ground++;
      const was = seen.get(h);
      if (was && Math.hypot(was.x - h.pos.x, was.z - h.pos.z) < 0.3 && !(h.ai && h.ai.target)) {
        idle.set(h, (idle.get(h) || 0) + 1);
        worstIdle = Math.max(worstIdle, idle.get(h));
      } else {
        idle.set(h, 0);
      }
      seen.set(h, { x: h.pos.x, z: h.pos.z });
    }
  }
  return { g, worstIdle, top, ground };
};

{
  const g0 = new T.Game({ map: 'arena', visual: false, spectate: true, bots: { size: 12, level: 'worker' }, seed: 1, rules: { respawn: 5 } });
  ok(g0.heroes.length === 24, 'twelve bots per side');
  ok(g0.heroes.filter(h => h.team === 'hot').length === 12, 'the sides are even');
  ok(!g0.player, 'a match can run with no human');
  ok(g0.heroes.every(h => h.pos.y === 0 && Math.abs(h.pos.x) > 34), 'everybody starts in a shower');
  const withPlayer = new T.Game({ map: 'arena', visual: false, merc: 'diver', team: 'cold', bots: { size: 12, level: 'worker' }, seed: 1, rules: { respawn: 5 } });
  ok(withPlayer.heroes.length === 24 && withPlayer.heroes.filter(h => h.team === 'cold').length === 12, 'the human takes a place on their side');
  ok(withPlayer.player === withPlayer.heroes[0] && withPlayer.player.human, 'and comes first');

  const deaths = new T.Game({ map: 'arena', visual: false, merc: 'diver', team: 'hot', bots: { size: 1, level: 'novice' }, seed: 1, rules: { respawn: 5 } });
  const p = deaths.player;
  deaths.damage(p, 1000, {});
  ok(!p.alive && p.respawnT === 5, 'with a delay the dead wait');
  deaths.step(T.blankInput());
  ok(!p.alive, 'still waiting');
  hold(deaths, 5, { yaw: 0 });
  ok(p.alive && p.hp === p.maxHp, 'then they come back');

  const killer = new T.Game({ map: 'arena', visual: false, merc: 'diver', team: 'hot', bots: { size: 1, level: 'novice' }, seed: 1, rules: { respawn: 5 } });
  const foe = killer.heroes.find(h => h.team === 'cold');
  killer.damage(foe, 1000, { by: killer.player });
  ok(killer.score.hot === 1, 'a kill scores for the killer side');
  ok(killer.events.some(ev => ev.type === 'kill' && ev.by === killer.player.id && ev.victim === foe.id), 'a kill is announced');
  killer.damage(killer.player, 1000, { by: killer.player });
  ok(killer.score.hot === 1, 'a suicide scores nothing');

  if (!process.argv.includes('--quick')) {
    for (const level of T.BOT_ORDER) {
      const { g, worstIdle, top, ground } = arenaRun({ hot: level, cold: level }, 60, 5);
      ok(g.score.hot + g.score.cold > 3, level + ' bots fight: ' + JSON.stringify(g.score));
      ok(worstIdle <= 8, level + ' bots do not stand idle: ' + worstIdle);
      ok(g.aiStuck < 40, level + ' bots rarely get stuck: ' + g.aiStuck);
      ok(top > 0 && ground > 0, level + ' bots use both levels: ' + top + ' ' + ground);
      log(level, JSON.stringify(g.score), 'stuck', g.aiStuck, 'idle', worstIdle, 'top', top, 'ground', ground);
    }
    const uneven = arenaRun({ hot: 'master', cold: 'novice' }, 45, 6).g.score;
    ok(uneven.hot > uneven.cold * 2, 'a side of masters beats a side of novices: ' + JSON.stringify(uneven));
    log('masters and novices', JSON.stringify(uneven));
    const again1 = arenaRun({ hot: 'foreman', cold: 'foreman' }, 20, 9).g.stateHash();
    const again2 = arenaRun({ hot: 'foreman', cold: 'foreman' }, 20, 9).g.stateHash();
    ok(again1 === again2, 'one seed gives one match');
    ok(arenaRun({ hot: 'foreman', cold: 'foreman' }, 20, 10).g.stateHash() !== again1, 'another seed gives another match');
  }

  const started = Date.now();
  const g = new T.Game({ map: 'arena', visual: false, spectate: true, bots: { size: 12, level: 'master' }, seed: 4, rules: { respawn: 5 } });
  log('arena with bots built in', Date.now() - started, 'ms');
  const t0 = process.hrtime.bigint();
  const steps = 60 * 20;
  for (let i = 0; i < steps; i++) g.step(T.blankInput());
  const ms = Number(process.hrtime.bigint() - t0) / 1e6 / steps;
  ok(ms < 8, 'twenty-four bots stay well inside the budget: ' + ms.toFixed(2));
  log('ms per step', ms.toFixed(2));
}

{
  const m = T.buildMap('2fort', { visual: false });
  const nav = new T.Nav(m);
  const near0 = (a, b) => Math.abs(a - b) < 1e-6;
  const turned = s => m.solids.some(o => near0(o.x0, -s.x1) && near0(o.x1, -s.x0) && near0(o.y0, s.y0) && near0(o.y1, s.y1) && near0(o.z0, -s.z1) && near0(o.z1, -s.z0) && !!o.ramp === !!s.ramp);
  ok(m.solids.every(turned), 'one station is the other turned half a circle around the bridge');
  ok(m.flags.length === 2 && m.captures.length === 2, 'two valves and two distributors');
  const hotFlag = m.flags.find(f => f.team === 'hot'), coldFlag = m.flags.find(f => f.team === 'cold');
  ok(hotFlag.x > 55 && coldFlag.x < -55, 'the hot station stands on the right, the cold on the left, valves deep inside');
  const hotMain = m.spawns.find(s => s.team === 'hot' && s.y === 0), coldMain = m.spawns.find(s => s.team === 'cold' && s.y === 0);
  const hotSide = m.spawns.find(s => s.team === 'hot' && s.y > 3), coldSide = m.spawns.find(s => s.team === 'cold' && s.y > 3);
  ok(hotMain.z > 18 && hotSide.z < -14, 'the hot main shower lies south of the bridge line, its side shower north');
  ok(coldMain.z < -18 && coldSide.z > 14, 'the cold ones the other way round');
  ok(hotMain.x > 20 && hotMain.x < 36 && hotSide.x > 33 && hotSide.x < 44, 'both showers stand by the front of the station');
  ok(hotFlag.z < 0, 'the valve lies north of the bridge line, past the side shower');
  for (const team of ['hot', 'cold']) {
    ok(m.spawns.filter(s => s.team === team).length === 12, team + ' has twelve spawn points');
    const kinds = new Set(m.hints.filter(h => h.team === team).map(h => h.kind));
    for (const k of ['sentry', 'sniper', 'sticky', 'charge', 'ambush', 'jump', 'flank']) ok(kinds.has(k), team + ' has a hint for ' + k);
  }
  ok(m.lockers.length === 8, 'four lockers per station');
  for (let n = 1; n <= 19; n++) ok(m.labels.some(l => l.text.startsWith(n + '. ')), 'zone ' + n + ' has its number');
  const doors = m.solids.filter(s => s.only), gates = m.solids.filter(s => s.oneWay);
  ok(doors.length === 10, 'five team doors per station: ' + doors.length);
  ok(gates.length === 4, 'two glass doors per main shower: ' + gates.length);
  for (const s of doors.concat(gates)) ok(Math.max(s.x1 - s.x0, s.z1 - s.z0) >= 2.4 - 1e-6 && s.y1 - s.y0 >= 2.6 - 1e-6, 'a door keeps its size');

  const at = p => nav.nearest(p.x, p.y, p.z, 3);
  const pt = (x, y, z) => nav.nearest(x, y, z, 2);
  const a = { hot: at(hotMain), cold: at(coldMain) };
  const len = p => p.slice(1).reduce((sum, k, i) => sum + Math.hypot(nav.x[k] - nav.x[p[i]], nav.y[k] - nav.y[p[i]], nav.z[k] - nav.z[p[i]]), 0);
  const way = (from, to, team) => {
    const p = nav.path(from, to, team || 'hot');
    return p ? len(p) : Infinity;
  };
  ok(way(a.hot, a.cold, 'hot') === Infinity && way(a.cold, a.hot, 'cold') === Infinity, 'nobody walks into the other main shower');
  ok(way(a.cold, at(hotSide), 'cold') === Infinity, 'nor into the other side shower');
  for (const team of ['hot', 'cold']) {
    const start = a[team];
    for (const p of m.pickups) {
      const k = at(p);
      ok(way(start, k, team) < Infinity && Math.abs(nav.y[k] - p.y) < 0.5, team + ' reaches a pickup at ' + p.x + ' ' + p.y + ' ' + p.z);
    }
    for (const h of m.hints) ok(h.team !== team || way(start, at(h), team) < Infinity, team + ' reaches its hint ' + h.kind);
    for (const q of m.posts) ok(q.team !== team || way(start, at(q), team) < Infinity, team + ' reaches its post');
    for (const l of m.lockers) {
      const ownSide = team === 'hot' ? l.x > 0 : l.x < 0;
      ok((way(start, at(l), team) < Infinity) === ownSide, team + (ownSide ? ' reaches its locker' : ' stays out of the other locker room'));
    }
  }

  const lobbyHall = pt(30, 0, 0), courtyard = pt(42, 0, 22), sideRoom = pt(32, 0, 9), corridor = pt(40.3, 0, 5), upstairs = pt(31, 3.4, 9);
  const grateRoom = pt(30, 3.4, 1), ledge = pt(20, 3.4, 11), sewer = pt(17.2, -3.2, -2), basement = pt(63.5, -5, 15), desk = pt(62.5, -5, -5.8);
  ok(way(pt(22, 0, 7), lobbyHall) < 15 && way(pt(22, 0, -7), lobbyHall) < 15, 'both front doors lead into the same short lobby');
  ok(way(lobbyHall, sideRoom) < 12, 'to the right of it lies the side room');
  ok(way(lobbyHall, corridor) < 15, 'a narrow corridor leaves it');
  ok(way(pt(28.2, 0, -2.5), pt(28.5, -3, -18)) < 18, 'and to the left go the stairs down to the tunnels');
  ok(way(sideRoom, courtyard) < 20, 'the side room has a door to the yard');
  ok(way(corridor, courtyard) < 20, 'so does the corridor');
  ok(way(courtyard, pt(29, 0, 25)) < 20, 'the main shower opens on the yard');
  ok(way(pt(32, 0, 26), courtyard) < 15, 'through its own door');
  ok(way(courtyard, pt(29, 0, 25), 'cold') === Infinity, 'closed to the enemy');
  ok(way(upstairs, ledge) < 18, 'the upper hall leads to the bastion');
  ok(way(upstairs, grateRoom) < 12, 'to the grate');
  ok(way(grateRoom, lobbyHall) < 12, 'whose hole drops into the lobby');
  ok(way(upstairs, courtyard) < 22, 'and a ledge drops into the yard');
  ok(way(pt(29, 3.4, 20.5), upstairs) < 14, 'the main shower has its second door to the upper hall');
  const down = way(upstairs, basement);
  ok(down > 40 && down < 75, 'the spiral goes from the upper hall to the basement: ' + down);
  const ramp = nav.path(upstairs, basement, 'hot');
  ok(ramp.some(k => nav.x[k] > 43 && nav.y[k] < 3 && nav.y[k] > -1), 'and winds around in the shaft behind the corridor');
  const stairsWay = way(courtyard, basement);
  ok(stairsWay > 40 && stairsWay < 70, 'the long stairs go from the yard to the basement: ' + stairsWay);
  ok(way(basement, pt(82, -5, 19.5), 'hot') < 28 && way(pt(76.2, -5, 21), pt(82, -5, 19.5), 'cold') === Infinity, 'the basement has a supply room for its own side only');
  ok(way(basement, desk) < 40, 'and leads on to the control room');
  ok(way(pt(56.6, -5, 5), desk) < 18 && way(pt(73.7, -5, 5), pt(66.5, -5, -5.8)) < 18, 'by two long corridors, one each side');
  const lastTurns = [pt(56.6, -5, 5), pt(73.7, -5, 5)].map(from => nav.path(from, pt(64.5, -5, -7.5), 'hot'));
  ok(lastTurns.every(p => p.some(k => nav.z[k] < -4) && p.some(k => nav.z[k] > 3)), 'each with a turn before facing the desk');
  ok(way(pt(38, 3.4, -20), corridor) < 32, 'the side shower drops through a hole into the corridor');
  ok(way(pt(38, 3.4, -20), ledge) < 55, 'and has a door to the bastion');
  ok(way(corridor, pt(38, 3.4, -20)) > 80, 'nobody climbs back through the hole');
  for (const z of [-6, 6]) ok(way(pt(5, -6.4, z), sewer) < 40, 'a tunnel leads from the canal at ' + z);
  ok(way(sewer, lobbyHall) < 55, 'the tunnels come up in the lobby');
  ok(way(pt(5, -6.4, 6), pt(34, -3.2, -23)) < 65, 'past the recessed tunnel room');

  const home = f => nav.nearest(f.x, f.y - 0.9, f.z, 3);
  const hotZone = m.captures.find(c => c.team === 'hot');
  const carry = way(home(coldFlag), at(hotZone));
  ok(carry > 230 && carry < 290, 'the valve run: ' + carry);
  near(carry / T.MERCS.runner.speed, 34, 5, 'a courier carries it');
  ok(carry / T.MERCS.strongman.speed < 68, 'a strongman in about a minute');
  const attack = way(a.hot, home(coldFlag)), defend = way(a.hot, home(hotFlag));
  ok(attack > 170 && attack < 235, 'the attack is a long way: ' + attack);
  ok(defend > 70 && defend < 120, 'the defence a shorter one: ' + defend);
  ok(way(a.hot, pt(0, 0, 0)) < 85, 'the bridge is close to the main shower');

  const w = m.world;
  ok(w.clear(21, 4.8, 3, -21, 4.8, -3), 'one bastion sees the other through the windows');
  ok(w.clear(20, 4.8, 10, -20, 4.8, -10), 'and over the ledges');
  ok(!w.clear(21, 4.8, 3, -6, 1, 0) && !w.clear(21, 4.8, 3, -9, 1, 0), 'but the far bridge deck stays hidden under the roof');
  ok(!!w.raycast(2, 5, 2, 0, -1, 0, 3), 'the bridge roof stops a shot');
  ok(!w.raycast(0, 5, 0, 0, -1, 0, 4, false, true), 'a gap in it lets a shell through');
  ok(!w.raycast(30, 4.4, 1, 0, -1, 0, 2), 'bullets pass the grate');
  ok(!!w.raycast(30, 4.4, 1, 0, -1, 0, 2, false, true), 'shells stop on it');
  ok(w.clear(30, 4.4, 1, 30, 2.4, 1), 'and a blast goes through it');
  ok(!w.raycast(34, 5, -1, 0, -1, 0, 4, false, true), 'there is a hole down to the lobby');
  ok(w.waterTop(0, -5, 5) === -3.4, 'the canal is deep');
  ok(w.groundAt(0, 20, 10, 0) === 8 && w.groundAt(0, -20, 10, 0) === 8, 'rock closes the canal at both ends');

  const drop = new T.Game({ map: '2fort', visual: false, merc: 'runner', team: 'hot' });
  const diver = drop.player;
  place(diver, 0, 4, 8, EAST);
  hold(drop, 2, { yaw: EAST });
  ok(diver.hp === diver.maxHp && diver.level >= 2, 'a fall into the canal does not hurt');
  place(diver, 5, -4.6, -6, EAST);
  ok(holdUntil(drop, 8, { fwd: 1, yaw: EAST, jump: true }, () => diver.pos.x > 12 && diver.pos.y > -3.3), 'and a tunnel mouth leads out of it');

  const stepping = (team, x, y, z, yaw, done, seconds) => {
    const s = new T.Game({ map: '2fort', visual: false, merc: 'runner', team });
    place(s.player, x, y, z, yaw);
    s.player.onGround = true;
    return holdUntil(s, seconds || 3, { fwd: 1, yaw }, () => done(s.player));
  };
  ok(stepping('hot', 29.2, 0, -2.5, Math.PI, p => p.pos.y < -1), 'the tunnel stairs go down from the lobby');
  ok(stepping('hot', 40.3, 3.4, -15.8, Math.PI, p => p.pos.y < 0.5), 'the side shower hole drops a body');
  ok(stepping('hot', 28.2, 0, 34, Math.PI, p => p.pos.z < 31), 'the glass doors open from inside');
  ok(!stepping('hot', 28.2, 0, 30, 0, p => p.pos.z > 32.5), 'and not from outside');
  ok(stepping('hot', 36, 0, 22, -EAST, p => p.pos.x < 33), 'the main shower door lets its own side in');
  ok(!stepping('cold', 36, 0, 22, -EAST, p => p.pos.x < 33), 'and stops the enemy');
}

const ctf = (merc, team, opts = {}) => {
  const g = new T.Game(Object.assign({ map: '2fort', mode: 'ctf', visual: false, merc: merc || 'runner', team: team || 'hot', seed: 3, rules: { wave: 10 } }, opts));
  return { g, p: g.player, m: g.mode };
};

const toFlag = (p, f) => { place(p, f.x + 1, f.y - 0.9, f.z, 0); p.onGround = true; };
const spotOf = (g, team) => g.mode.zones[team];

{
  const C = T.CTF;
  ok(C.returnTime === 60 && C.limit === 3 && C.shift === 600 && C.lastShift === 120 && C.captureCrits === 10 && C.act === 10, 'the rules keep their numbers');

  let { g, p, m } = ctf();
  ok(m.phase === 'shift' && m.timer === C.shift, 'the shift starts with ten minutes');
  ok(m.flags.hot.state === 'home' && m.flags.cold.state === 'home', 'both valves lie at home');
  toFlag(p, m.flags.hot);
  hold(g, 0.1, { yaw: 0 });
  ok(m.flags.hot.state === 'home' && !p.flag, 'your own side does not move its valve');
  toFlag(p, m.flags.cold);
  hold(g, 0.1, { yaw: 0 });
  ok(m.flags.cold.state === 'carried' && p.flag === m.flags.cold && m.flags.cold.carrier === p, 'the enemy takes it by touch');

  hold(g, 0.1, { yaw: 0, drop: true });
  ok(m.flags.cold.state === 'dropped' && !p.flag, 'the L key drops it');
  ok(m.flags.cold.returnT > 59, 'the dropped valve starts its minute');
  hold(g, 0.2, { yaw: 0 });
  ok(m.flags.cold.state === 'dropped', 'the one who dropped it cannot grab it at once');
  hold(g, 1.5, { yaw: 0 });
  ok(m.flags.cold.state === 'carried', 'but can after a moment');

  ({ g, p, m } = ctf());
  toFlag(p, m.flags.cold);
  hold(g, 0.1, { yaw: 0 });
  g.damage(p, 1e6, {});
  ok(m.flags.cold.state === 'dropped' && !p.flag, 'death drops it');
  ok(!p.alive && p.respawnT >= 10 && p.respawnT <= 20, 'and the dead wait for the wave after next: ' + p.respawnT);
  const dropped = m.flags.cold;
  const y0 = dropped.y;
  ok(y0 < -3, 'it lies where the carrier fell');
  hold(g, 30, { yaw: 0 });
  ok(dropped.state === 'dropped' && dropped.returnT < 31 && dropped.returnT > 29, 'it waits');
  const thief = g.addHero('diver', 'hot', false);
  place(thief, dropped.x + 1, dropped.y, dropped.z, 0);
  thief.onGround = true;
  hold(g, 0.1, { yaw: 0 });
  ok(dropped.state === 'carried' && dropped.carrier === thief, 'another picks it up');
  g.damage(thief, 1e6, {});
  ok(dropped.state === 'dropped' && dropped.returnT > 59, 'and the timer starts over when it falls again');
  hold(g, 59, { yaw: 0 });
  ok(dropped.state === 'dropped', 'almost a minute');
  hold(g, 1.2, { yaw: 0 });
  ok(dropped.state === 'home' && dropped.x === dropped.home.x, 'then it goes home');

  ({ g, p, m } = ctf());
  toFlag(p, m.flags.cold);
  hold(g, 0.1, { yaw: 0 });
  const locker = g.map.lockers.find(l => l.x > 0 && l.y === 0);
  place(p, locker.x - 1, locker.y, locker.z, 0);
  p.onGround = true;
  hold(g, 0.1, { yaw: 0 });
  ok(m.flags.cold.state === 'dropped', 'stepping into your own locker drops it');

  ({ g, p, m } = ctf());
  toFlag(p, m.flags.cold);
  hold(g, 0.1, { yaw: 0 });
  place(p, 0, -20, 0, 0);
  hold(g, 0.1, { yaw: 0 });
  ok(m.flags.cold.state === 'home', 'a valve lost to a pit goes home at once');

  ({ g, p, m } = ctf('vet'));
  p.uberT = 5;
  toFlag(p, m.flags.cold);
  hold(g, 0.1, { yaw: 0 });
  ok(m.flags.cold.state === 'home', 'nobody under pressure takes the valve');
  p.uberT = 0;
  hold(g, 0.1, { yaw: 0 });
  ok(p.flag === m.flags.cold, 'the moment it ends they can');
  const hose = p.arms.findIndex(a => a.def.kind === 'beam');
  g.selectSlot(p, hose);
  p.deployT = 0;
  p.arms[hose].charge = 1;
  hold(g, 0.1, { yaw: 0, fire2: true });
  ok(p.uberT === 0, 'the carrier cannot start the pressure');
  const patient = ctf('vet');
  const medic = patient.p, carrier = patient.g.addHero('runner', 'hot', false);
  const pFlag = patient.m.flags.cold;
  toFlag(carrier, pFlag);
  patient.g.step(T.blankInput());
  ok(carrier.flag === pFlag, 'a friend has the valve');
  place(medic, carrier.pos.x, carrier.pos.y, carrier.pos.z + 3, Math.PI);
  medic.onGround = true;
  const beam = medic.arms.findIndex(a => a.def.kind === 'beam');
  patient.g.selectSlot(medic, beam);
  medic.deployT = 0;
  medic.uberT = 5;
  medic.patient = carrier;
  hold(patient.g, 0.2, { yaw: Math.PI, fire: true });
  ok(medic.patient === carrier && carrier.uberT === 0, 'and no pressure reaches them');

  ({ g, p, m } = ctf('inspector'));
  p.disguise = { merc: 'diver', team: 'cold' };
  p.disguised = true;
  toFlag(p, m.flags.cold);
  hold(g, 0.1, { yaw: 0 });
  ok(p.flag && !p.disguise && !p.disguised, 'an inspector drops the disguise taking it');
  g.toggleCloak(p);
  ok(!p.cloaked, 'and cannot vanish with it');
  g.startDisguise(p, 'diver', 'cold');
  ok(!p.disguiseTo, 'nor take a new disguise');
  ({ g, p, m } = ctf('inspector'));
  p.cloaked = true;
  p.cloakState = 'on';
  toFlag(p, m.flags.cold);
  hold(g, 0.1, { yaw: 0 });
  ok(!p.flag, 'an invisible inspector does not touch it');

  ({ g, p, m } = ctf());
  const friend = g.addHero('plumber', 'hot', false);
  const score = (team, hero) => {
    const foeFlag = m.flags[T.enemyOf(team)];
    if (foeFlag.state !== 'home') m.goHome(foeFlag, null);
    toFlag(hero, foeFlag);
    hold(g, 0.1, { yaw: hero.yaw });
    const z = spotOf(g, team);
    place(hero, z.x, z.y, z.z, 0);
    hero.onGround = true;
    hold(g, 0.1, { yaw: hero.yaw });
  };
  const thiefCold = g.addHero('diver', 'cold', false);
  toFlag(thiefCold, m.flags.hot);
  hold(g, 0.1, { yaw: 0 });
  ok(m.flags.hot.state === 'carried', 'the enemy has our valve');
  score('hot', p);
  ok(m.captures.hot === 1, 'a capture counts even with our own valve away');
  ok(m.flags.cold.state === 'home' && !p.flag, 'and sends the captured valve home');
  ok(m.flags.hot.state === 'carried', 'our valve stays where it is');
  ok(p.critT > 9.5 && friend.critT > 9.5, 'the whole side gets crits');
  ok(thiefCold.critT === 0, 'the other side does not');
  hold(g, 10.2, { yaw: 0 });
  ok(p.critT === 0, 'for ten seconds');
  m.goHome(m.flags.hot, null);
  thiefCold.flag = null;
  score('hot', p);
  ok(m.captures.hot === 2 && m.phase === 'shift', 'two is not enough');
  score('hot', p);
  ok(m.captures.hot === 3 && m.phase === 'act' && m.winner === 'hot', 'three wins the shift');
  ok(thiefCold.disarmed && !p.disarmed, 'the losers lose their arms');
  ok(p.critT > 9 , 'the winners keep crits');
  const cd = thiefCold.fireCd, shots = thiefCold.arms[0].clip;
  thiefCold.human = false;
  g.stepArms(thiefCold, Object.assign(T.blankInput(), { fire: true }), T.TICK);
  ok(thiefCold.arms[0].clip === shots && cd === thiefCold.fireCd, 'the disarmed cannot fire');
  hold(g, C.act + 0.1, { yaw: 0 });
  ok(m.phase === 'over', 'after the act the shift is over');

  ({ g, p, m } = ctf());
  g.addHero('diver', 'cold', false);
  g.addHero('plumber', 'hot', false);
  m.timer = 0.05;
  hold(g, 0.2, { yaw: 0 });
  ok(m.phase === 'last' && m.timer > 119, 'a tie with both valves home goes to the last shift');
  ok(g.rules.noRespawn, 'with no returns');
  g.damage(p, 1e6, {});
  hold(g, 30, { yaw: 0 });
  ok(!p.alive && m.phase === 'last', 'the dead stay dead');
  ({ g, p, m } = ctf());
  const coldOne = g.addHero('diver', 'cold', false);
  m.timer = 0.05;
  hold(g, 0.1, { yaw: 0 });
  ok(m.phase === 'last' && coldOne.alive, 'the last shift brings everybody back');
  hold(g, 120.1, { yaw: 0 });
  ok(m.phase === 'act' && m.winner === null, 'two minutes later it is a draw');
  ok(!p.disarmed && !coldOne.disarmed, 'and nobody loses their arms');
  ({ g, p, m } = ctf());
  const coldTwo = g.addHero('diver', 'cold', false);
  m.timer = 0.05;
  hold(g, 0.1, { yaw: 0 });
  g.damage(coldTwo, 1e6, {});
  hold(g, 0.1, { yaw: 0 });
  ok(m.phase === 'act' && m.winner === 'hot', 'a side wiped out in the last shift loses');
  ({ g, p, m } = ctf());
  g.addHero('diver', 'cold', false);
  m.timer = 0.05;
  hold(g, 0.1, { yaw: 0 });
  score('hot', p);
  ok(m.phase === 'act' && m.winner === 'hot', 'the first capture in the last shift wins');

  ({ g, p, m } = ctf());
  toFlag(p, m.flags.cold);
  hold(g, 0.1, { yaw: 0 });
  m.timer = 0.05;
  hold(g, 0.2, { yaw: 0 });
  ok(m.phase === 'overtime', 'time runs out with a valve on the move: overtime');
  ok(m.timer === 0, 'the clock stands');
  hold(g, 5, { yaw: 0 });
  ok(m.phase === 'overtime', 'it lasts as long as the valve is away');
  const z = spotOf(g, 'hot');
  place(p, z.x, z.y, z.z, 0);
  p.onGround = true;
  hold(g, 0.1, { yaw: 0 });
  ok(m.phase === 'act' && m.winner === 'hot' && m.captures.hot === 1, 'both home and a lead ends it');
  ({ g, p, m } = ctf());
  g.addHero('diver', 'cold', false);
  toFlag(p, m.flags.cold);
  hold(g, 0.1, { yaw: 0 });
  m.timer = 0.05;
  hold(g, 0.2, { yaw: 0 });
  hold(g, 0.1, { yaw: 0, drop: true });
  ok(m.phase === 'overtime' && m.flags.cold.state === 'dropped', 'a dropped valve keeps the overtime going');
  place(p, 0, 0, 0, 0);
  m.goHome(m.flags.cold, 'returned');
  hold(g, 0.1, { yaw: 0 });
  ok(m.phase === 'last', 'home with a tie goes on to the last shift');

  const said = ctf();
  const seen = [];
  const watch = () => { for (const ev of said.g.events) if (ev.type === 'flag') seen.push(ev.what); };
  toFlag(said.p, said.m.flags.cold);
  for (let i = 0; i < 6; i++) { said.g.step(T.blankInput()); watch(); }
  said.g.step(Object.assign(T.blankInput(), { drop: true }));
  watch();
  place(said.p, 0, 0, 0, 0);
  said.m.flags.cold.returnT = 0.01;
  for (let i = 0; i < 3; i++) { said.g.step(T.blankInput()); watch(); }
  ok(seen.join() === 'taken,dropped,returned', 'the dispatcher hears of it: ' + seen.join());

  const hash1 = ctf(), hash2 = ctf();
  for (const s of [hash1, hash2]) { toFlag(s.p, s.m.flags.cold); hold(s.g, 1, { yaw: 0 }); }
  ok(hash1.g.stateHash() === hash2.g.stateHash(), 'the state hash covers the mode');
  hold(hash2.g, 0.1, { yaw: 0, drop: true });
  hold(hash1.g, 0.1, { yaw: 0 });
  ok(hash1.g.stateHash() !== hash2.g.stateHash(), 'and tells a dropped valve from a carried one');
}

{
  const g = new T.Game({ map: '2fort', mode: 'ctf', visual: false, spectate: true, bots: { size: 12, level: 'worker' }, seed: 7, rules: { wave: 10 } });
  for (const team of ['hot', 'cold']) {
    const bots = g.heroes.filter(h => h.team === team);
    const count = r => bots.filter(h => h.role === r).length;
    ok(count('attack') === 5 && count('guard') === 3 && count('bridge') === 4, team + ' splits five for the valve, three guards, four on the bridge: ' + count('attack') + ' ' + count('guard') + ' ' + count('bridge'));
    ok(bots.some(h => h.role === 'attack' && h.merc === 'runner'), team + ' sends a courier for the valve');
    ok(bots.some(h => h.byTunnel) && bots.some(h => h.role === 'attack' && !h.byTunnel), team + ' sends attackers both ways');
    ok(bots.every(h => h.role !== 'guard' || !h.byTunnel), team + ' keeps guards home');
  }
  const human = new T.Game({ map: '2fort', mode: 'ctf', visual: false, merc: 'diver', team: 'cold', bots: { size: 12, level: 'worker' }, seed: 7, rules: { wave: 10 } });
  ok(human.heroes.length === 24 && !human.player.role, 'the human has no orders');

  const lone2fort = (merc, level) => {
    const s = new T.Game({ map: '2fort', mode: 'ctf', visual: false, spectate: true, seed: 5, rules: { wave: 10 } });
    const b = s.addBot(merc, 'hot', level);
    s.mode.start();
    return { g: s, b, m: s.mode };
  };
  const courier = lone2fort('runner', 'worker');
  courier.b.role = 'attack';
  courier.b.byTunnel = false;
  ok(courier.b.pos.x > 0, 'the courier starts at home');
  let took = -1, brought = -1;
  for (let i = 0; i < 60 * 100 && brought < 0; i++) {
    courier.g.step(T.blankInput());
    if (took < 0 && courier.b.flag) took = i / 60;
    if (courier.m.captures.hot === 1) brought = i / 60;
  }
  ok(took > 0 && took < 40, 'alone a courier reaches the valve in half a minute: ' + took);
  ok(brought > took && brought - took < 50, 'and brings it home: ' + (brought - took));
  log('courier took', took, 'brought', brought);

  const swimmer = lone2fort('runner', 'worker');
  swimmer.b.role = 'attack';
  swimmer.b.byTunnel = true;
  let wet = false, mouth = false;
  for (let i = 0; i < 60 * 30 && !mouth; i++) {
    swimmer.g.step(T.blankInput());
    if (swimmer.b.level >= 2) wet = true;
    mouth = swimmer.b.tunnelStep === 2;
  }
  ok(wet && mouth, 'the other attackers go by the canal and the tunnel');

  const guard = lone2fort('strongman', 'worker');
  guard.b.role = 'guard';
  runFor(guard.g, 32);
  const home = guard.m.flags.hot.home;
  ok(Math.hypot(guard.b.pos.x - home.x, guard.b.pos.z - home.z) < 18 && guard.b.pos.y < -4, 'a guard goes down to the control room');

  const holder = lone2fort('hunter', 'worker');
  holder.b.role = 'bridge';
  runFor(holder.g, 15);
  ok(Math.abs(holder.b.pos.x) < 22 && Math.abs(holder.b.pos.x) > 10 && holder.b.pos.y > -1, 'a bridge holder goes to the facade');

  const chase = lone2fort('runner', 'worker');
  chase.b.role = 'guard';
  const robber = chase.g.addHero('strongman', 'cold', false);
  robber.hp = robber.maxHp = 1e6;
  const hf = chase.m.flags.hot;
  toFlag(robber, hf);
  chase.g.step(T.blankInput());
  ok(robber.flag === hf, 'a robber has our valve');
  runFor(chase.g, 20);
  ok(Math.hypot(chase.b.pos.x - robber.pos.x, chase.b.pos.z - robber.pos.z) < 12 && chase.b.pos.y < -3, 'a guard runs at them');
  ok(robber.hp < robber.maxHp, 'and shoots');

  if (!process.argv.includes('--quick')) {
    const whole = new T.Game({ map: '2fort', mode: 'ctf', visual: false, spectate: true, bots: { size: 12, level: 'worker' }, seed: 11, rules: { wave: 10 } });
    let moved = 0, nums = true;
    for (let i = 0; i < 60 * 900 && whole.mode.phase !== 'over'; i++) {
      whole.step(T.blankInput());
      for (const ev of whole.events) if (ev.type === 'flag' && ev.what === 'taken') moved++;
      if (i % 30 === 0) for (const h of whole.heroes) if (!(Number.isFinite(h.pos.x) && Number.isFinite(h.pos.y) && Number.isFinite(h.pos.z))) nums = false;
    }
    ok(whole.mode.phase === 'over', 'a whole shift of bots reaches its end: ' + whole.mode.phase);
    ok(moved > 0, 'the valve moves: ' + moved);
    ok(nums, 'and everybody stays in numbers');
    ok(whole.aiStuck < 30, 'bots rarely get stuck: ' + whole.aiStuck);
    log('whole shift', whole.mode.winner, JSON.stringify(whole.mode.captures), 'taken', moved, 'time', Math.round(whole.t), 'frags', JSON.stringify(whole.score), 'stuck', whole.aiStuck);
    const twice = () => {
      const s = new T.Game({ map: '2fort', mode: 'ctf', visual: false, spectate: true, bots: { size: 12, level: 'foreman' }, seed: 12, rules: { wave: 10 } });
      runFor(s, 60);
      return s.stateHash();
    };
    ok(twice() === twice(), 'one seed gives one shift');
  }
  const t0 = process.hrtime.bigint();
  const timed = new T.Game({ map: '2fort', mode: 'ctf', visual: false, spectate: true, bots: { size: 12, level: 'master' }, seed: 4, rules: { wave: 10 } });
  const steps = 60 * 15;
  for (let i = 0; i < steps; i++) timed.step(T.blankInput());
  const ms = Number(process.hrtime.bigint() - t0) / 1e6 / steps;
  ok(ms < 8, 'the map keeps the bots inside the budget: ' + ms.toFixed(2));
  log('2fort ms per step', ms.toFixed(2));
}

{
  const waves = new T.Game({ map: 'arena', visual: false, merc: 'diver', team: 'hot', seed: 1, rules: { wave: 10 } });
  const p = waves.player;
  hold(waves, 3, { yaw: 0 });
  waves.damage(p, 1000, {});
  near(p.respawnT, 17, 0.05, 'dying at second three misses the wave at ten and waits for twenty');
  hold(waves, 8, { yaw: 0 });
  ok(!p.alive, 'the first wave goes without them');
  hold(waves, 9.1, { yaw: 0 });
  ok(p.alive, 'the next brings them back');
}

log('modules', MODULES.length);
console.log('tf98: ' + checks + ' checks passed');
