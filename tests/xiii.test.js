const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js', 'apps', 'xiii');
const SIM = ['x13-core', 'x13-data', 'x13-world', 'x13-nav', 'x13-props', 'x13-game', 'x13-ai'];
const LEVEL_FILES = fs.readdirSync(DIR).filter(f => /^x13-l\d\d-.*\.js$/.test(f)).sort().map(f => f.replace(/\.js$/, ''));
const CLIENT = ['x13-tex', 'x13-gl', 'x13-models', 'x13-render', 'x13-fx', 'x13-hud', 'x13-panels', 'x13-comic', 'x13-audio', 'x13-menu', 'x13-ui'];
for (const f of [...SIM, ...LEVEL_FILES, 'x13-tex', 'x13-gl', 'x13-models']) require(path.join(DIR, f + '.js'));
const X = globalThis.XIII;

let passed = 0;
const only = process.argv[2] || null;
function test(name, fn) {
  if (only && !name.includes(only)) return;
  const t0 = Date.now();
  fn();
  passed++;
  console.log(`  ok - ${name} (${Date.now() - t0} ms)`);
}

function newGame(level, o) { return new X.Game(Object.assign({ level, seed: 13, difficulty: 1 }, o || {})); }
function idle(g) { return { yaw: g.player.yaw, pitch: g.player.pitch }; }
function run(g, sec, fn) {
  const n = Math.round(sec / X.TICK);
  for (let i = 0; i < n; i++) {
    g.step(fn ? fn(g, i) : idle(g));
    if (g.events.length > 500) g.events.length = 0;
  }
}
function tp(g, pos, yaw) {
  const p = g.player;
  p.pos = pos.slice();
  if (p.pos[1] === null || p.pos[1] === undefined) p.pos[1] = g.world.groundY(pos[0], pos[2], 1e6);
  p.vel = [0, 0, 0]; p.onGround = true; p.ladder = null; p.rope = null; p.swim = false;
  if (yaw !== undefined) p.yaw = yaw;
}
function center(t) { return [(t.min[0] + t.max[0]) / 2, t.min[1] + 0.2, (t.min[2] + t.max[2]) / 2]; }
function zone(g, id) {
  const t = g.triggers.find(q => q.id === id);
  assert.ok(t, 'trigger ' + id);
  const c = center(t);
  c[1] = g.world.groundY(c[0], c[2], t.max[1]);
  if (c[1] < t.min[1] - 1) c[1] = t.min[1];
  tp(g, c);
  run(g, 0.1);
}
function kill(g, id) {
  const c = g.char(id);
  assert.ok(c, 'char ' + id);
  if (c.state === 'hidden') c.state = 'alive';
  if (c.state === 'alive' || c.state === 'hostage') g.damageChar(c, 9999, 'body', [0, 0, 1], 'player', 'm16', c.pos);
}
function killGroup(g, grp) { for (const c of g.chars) if (c.group === grp && (c.state === 'alive' || c.state === 'hidden')) { c.state = 'alive'; g.damageChar(c, 9999, 'body', [0, 0, 1], 'player', 'm16', c.pos); } }
function use(g, id) {
  const u = g.usables.find(q => q.id === id);
  assert.ok(u, 'usable ' + id);
  assert.ok(u.enabled, 'usable enabled ' + id);
  g.useUsable(u);
  run(g, 0.05);
}
function objDone(g, id) { const o = g.objectives.find(q => q.id === id); return !!(o && o.done); }
function pickAll(g, kinds) {
  for (const it of g.items) {
    if (it.taken || (kinds && !kinds.includes(it.kind))) continue;
    tp(g, [it.pos[0], it.pos[1] - 0.1, it.pos[2]]);
    run(g, 0.05);
  }
}

function commentFree(src) {
  let i = 0, q = null;
  const stack = [];
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (q) {
      if (c === '\\') { i += 2; continue; }
      if (q === '`' && c === '$' && n === '{') { stack.push('`'); q = null; i += 2; continue; }
      if (c === q) q = null;
      i++;
      continue;
    }
    if (c === '}' && stack.length && stack[stack.length - 1] === '`') { stack.pop(); q = '`'; i++; continue; }
    if (c === '{') stack.push('{');
    else if (c === '}') stack.pop();
    if (c === '"' || c === "'" || c === '`') { q = c; i++; continue; }
    if (c === '/' && (n === '/' || n === '*')) return i;
    if (c === '/') {
      let k = i - 1;
      while (k >= 0 && /\s/.test(src[k])) k--;
      if (k < 0 || '(,=:[!&|?{};'.includes(src[k]) || /return$/.test(src.slice(Math.max(0, k - 5), k + 1))) {
        let j = i + 1, cls = false;
        while (j < src.length && src[j] !== '\n') {
          if (src[j] === '\\') { j += 2; continue; }
          if (src[j] === '[') cls = true;
          else if (src[j] === ']') cls = false;
          else if (src[j] === '/' && !cls) break;
          j++;
        }
        i = j + 1;
        continue;
      }
    }
    i++;
  }
  return -1;
}

const WALK = {};

console.log('--- XIII ---');

test('data: levels in story order, weapons and characters are consistent', () => {
  const names = X.LEVELS.map(l => l.name);
  const want = ['Brighton Beach', 'Winslow Bank', 'FBI Headquarters', 'Major Jones', 'Emerald Base', "Carrington's Cell", 'Cable Car', 'Kellownee Lake', 'Kellownee Hideout', 'Plain Rock Penitentiary'];
  assert.deepEqual(names, want.slice(0, names.length));
  assert.ok(X.LEVELS.every((l, i) => l.n === i + 1));
  for (const k in X.CHARS) {
    const c = X.CHARS[k];
    assert.ok(c.look && c.look.coat && c.look.pants, k + ' look');
    if (c.weapon) assert.ok(X.WEAPONS[c.weapon], k + ' weapon');
    assert.ok(['player', 'ally', 'enemy', 'neutral', 'prisoner'].includes(c.team), k + ' team');
  }
  for (const w of X.WEAPON_ORDER) assert.ok(X.WEAPONS[w], w);
  assert.equal(X.WEAPONS.knife.silent, true);
  assert.equal(X.WEAPONS.silenced.silent, true);
  assert.ok(X.WEAPONS.sniper.zoom.length === 2);
});

test('movement: run speed, jump height, stairs and ledges', () => {
  X.addLevel({ id: 'testflat', n: 99, name: 'Test', build(B) { B.box(-50, -1, -50, 50, 0, 50, 'concrete'); B.stairs(4, -6, 6, -2, 0, 1.6, 'n', 'concrete'); B.box(4, 0, -9, 6, 1.6, -6, 'concrete'); B.box(-3, 0, -3, -2, 1.2, 3, 'concrete'); B.spawnPlayer(0, 0, 0, 0); B.bounds(-20, -20, 20, 20); } });
  const g = newGame('testflat');
  const p = g.player;
  run(g, 1.2, () => ({ fwd: 1, yaw: 0, pitch: 0 }));
  assert.ok(Math.abs(p.speed - 5) < 0.3, 'run speed ' + p.speed.toFixed(2));
  tp(g, [0, 0, 0], 0);
  run(g, 0.2);
  let top = 0;
  run(g, 1.2, (gg, i) => { top = Math.max(top, p.pos[1]); return { jump: i < 2, yaw: 0, pitch: 0 }; });
  assert.ok(top > 0.8 && top < 1.0, 'jump ' + top.toFixed(2));
  tp(g, [5, 0, -1], 0);
  run(g, 1.15, () => ({ fwd: 1, yaw: 0, pitch: 0 }));
  assert.ok(p.pos[1] > 1.55, 'climbed stairs ' + p.pos[1].toFixed(2));
  tp(g, [0, 0, 0], Math.PI / 2);
  run(g, 1.5, () => ({ fwd: 1, yaw: Math.PI / 2, pitch: 0 }));
  assert.ok(p.pos[0] > -2 + X.PLAYER_R - 0.05, 'wall blocks ' + p.pos[0].toFixed(2));
  X.LEVELS.splice(X.LEVELS.findIndex(l => l.id === 'testflat'), 1);
});

test('combat: headshot kills, knockout from behind, hostage stops enemy fire', () => {
  const g = newGame('brighton');
  const h = g.char('h2');
  g.give({ weapon: 'beretta', clip: 15, res: 30, select: 'beretta' });
  run(g, 0.5);
  const hb = g.hitboxes(h);
  const eye = [hb.head[0], hb.head[1], hb.head[2] + 4];
  tp(g, [eye[0], eye[1] - X.EYE, eye[2]], 0);
  g.player.pitch = 0;
  g.player.bloom = 0;
  g.traceShot(g.eyePos(), X.vnorm(X.vsub(hb.head, g.eyePos())), X.WEAPONS.beretta, 'beretta', null, true);
  assert.equal(h.state, 'dead');
  assert.ok(g.events.some(e => e.t === 'death' && e.head), 'headshot event for comic panels');
  const h3 = g.char('h3');
  h3.ai.alert = 0;
  g.damageChar(h3, 60, 'body', X.fwd(h3.yaw, 0), 'player', 'object', h3.pos);
  assert.equal(h3.state, 'ko');
  assert.ok(g.stats.ko === 1 && g.stats.headshots === 1);
});

test('stealth: guard notices a running player in front, not a crouched one behind', () => {
  const g = newGame('brighton');
  const h = g.char('h3');
  tp(g, [h.pos[0], h.pos[1], h.pos[2] + 6], Math.PI);
  run(g, 1.5, () => ({ fwd: 0.01, yaw: Math.PI, pitch: 0 }));
  assert.equal(h.ai.alert, 2, 'spotted in front');
  const g2 = newGame('brighton');
  const h2 = g2.char('h3');
  const f = X.fwd(h2.yaw, 0);
  tp(g2, [h2.pos[0] - f[0] * 3, h2.pos[1], h2.pos[2] - f[2] * 3]);
  g2.player.crouched = true;
  run(g2, 1.5, () => ({ crouch: true, yaw: 0, pitch: 0 }));
  assert.ok(h2.ai.alert < 2, 'not spotted from behind');
});

test('checkpoint: snapshot restores dead enemies, inventory and objectives', () => {
  const g = newGame('brighton');
  kill(g, 'h1');
  g.give({ weapon: 'beretta', clip: 11, res: 20 });
  g.checkpoint('t');
  const g2 = newGame('brighton', { snapshot: g.saved });
  assert.equal(g2.char('h1').state, 'dead');
  assert.equal(g2.player.clip.beretta, 11);
  assert.deepEqual(g2.objectives.map(o => o.id), g.objectives.map(o => o.id));
  assert.ok(g2.flags['!dead:h1'], 'fired triggers stay fired');
});

WALK.brighton = g => {
  assert.ok(objDone(g, 'escape') === false);
  run(g, 1);
  kill(g, 'h1');
  const drop = g.items.find(i => i.dropped && i.kind === 'weapon');
  assert.ok(drop, 'h1 drops a pistol');
  tp(g, drop.pos);
  run(g, 0.1);
  assert.ok(objDone(g, 'weapon'), 'weapon objective');
  zone(g, 'beachExit');
  assert.ok(objDone(g, 'escape'));
  zone(g, 'plaza');
  assert.ok(g.chars.filter(c => c.group === 'street').every(c => c.state === 'alive'), 'street group spawned');
  killGroup(g, 'street');
  use(g, 'phone');
};

WALK.bank = g => {
  use(g, 'clerkTalk');
  assert.equal(g.door('gate').target, 1, 'gate opens');
  zone(g, 'vault');
  use(g, 'box1313');
  assert.ok(g.player.gadgets.lockpick, 'lockpick from the box');
  run(g, 2);
  assert.ok(g.chars.filter(c => c.group === 'lobby').every(c => c.state !== 'hidden'), 'robbers storm the bank');
  for (const grp of ['lobby', 'vaultk', 'mezz']) killGroup(g, grp);
  const key = g.items.find(i => i.id === 'roofkey');
  tp(g, key.pos); run(g, 0.1);
  assert.ok(g.player.keys.includes('roofkey'));
  const d = g.door('roofdoor');
  tp(g, [15.3, 4.4, -18.9]);
  g.player.yaw = 0; g.player.pitch = 0.9;
  g.useDoor(d);
  assert.equal(d.target, 1, 'roof door opens with the key');
  zone(g, 'roof');
  killGroup(g, 'roof'); killGroup(g, 'east');
  const hook = g.items.find(i => i.id === 'hookitem');
  tp(g, hook.pos); run(g, 0.1);
  assert.ok(g.player.gadgets.hook, 'grappling hook');
  tp(g, [17.3, 7.6, -12], -Math.PI / 2);
  assert.ok(g.tryGrapple(), 'hook deployed');
  run(g, 4, () => ({ fwd: 1, yaw: -Math.PI / 2, pitch: 0 }));
  assert.ok(g.player.pos[1] > 11.5, 'climbed the rope ' + g.player.pos[1].toFixed(2));
  run(g, 0.2);
  assert.ok(objDone(g, 'neighbor'), 'on the east roof');
  tp(g, [39.3, 12, -19.2], -Math.PI / 2);
  run(g, 1.2, () => ({ fwd: 1, yaw: -Math.PI / 2, pitch: 0 }));
  assert.ok(g.player.ladder, 'on the fire escape ladder');
  run(g, 7, () => ({ fwd: 1, yaw: -Math.PI / 2, pitch: 0 }));
  assert.ok(g.player.pos[1] < 1, 'down in the alley ' + g.player.pos[1].toFixed(2));
  killGroup(g, 'alley');
  zone(g, 'alleyEnd');
};

WALK.fbi = g => {
  assert.equal(g.player.weapon, 'fists', 'weapons confiscated');
  const g1 = g.char('g1');
  const f = X.fwd(g1.yaw, 0);
  tp(g, [g1.pos[0] - f[0] * 0.9, g1.pos[1], g1.pos[2] - f[2] * 0.9], g1.yaw);
  assert.ok(g.tryHostage(), 'grab the guard from behind');
  run(g, 0.2);
  g.releaseHostage(true);
  assert.equal(g1.state, 'ko', 'knocked out, not killed');
  use(g, 'console');
  assert.ok(g.secCams.every(c => c.off), 'cameras off');
  const key = g.items.find(i => i.id === 'evkey');
  tp(g, key.pos); run(g, 0.1);
  const d = g.door('evidence');
  tp(g, [-11, 0, 2.6], Math.PI);
  g.player.pitch = -0.1;
  g.useDoor(d);
  assert.equal(d.target, 1, 'evidence room opens');
  pickAll(g, ['weapon', 'lockpick', 'gadget']);
  assert.ok(g.player.weapons.silenced && g.player.gadgets.hook, 'gear back');
  zone(g, 'garage');
  zone(g, 'exit');
};

WALK.jones = g => {
  zone(g, 'quay');
  killGroup(g, 'captors');
  const jo = g.char('jones');
  tp(g, [jo.pos[0] + 1.2, jo.pos[1], jo.pos[2]], Math.PI / 2);
  use(g, 'free');
  assert.equal(jo.ai.order.type, 'follow', 'Jones follows');
  run(g, 5);
  assert.ok(g.chars.filter(c => c.group === 'wave1').every(c => c.state !== 'hidden'), 'first wave');
  killGroup(g, 'wave1');
  for (const c of g.chars) if (c.team === 'enemy' && c.state === 'alive') kill(g, c.id);
  zone(g, 'pierStart');
  killGroup(g, 'wave2');
  run(g, 18, () => ({ yaw: 0, pitch: 0 }));
  assert.ok(X.hdist(jo.pos, g.player.pos) < 12, 'Jones kept up ' + X.hdist(jo.pos, g.player.pos).toFixed(1));
  zone(g, 'pierEnd');
  run(g, 41);
  assert.equal(jo.state, 'alive');
};

WALK.emerald = g => {
  const p = g.player;
  tp(g, [0, 20, 44], Math.PI);
  g.player.crouched = true;
  run(g, 3.2, () => ({ fwd: 1, crouch: true, yaw: 0, pitch: 0 }));
  assert.ok(p.pos[2] < 38.6, 'crawled through the culvert ' + p.pos[2].toFixed(2));
  run(g, 0.2, () => ({ crouch: true, yaw: 0, pitch: 0 }));
  assert.ok(objDone(g, 'enter'), 'inside the base');
  zone(g, 'gen');
  use(g, 'power');
  assert.ok(g.searchlights.every(s => !s.light.on), 'searchlights off');
  zone(g, 'hq');
  kill(g, 'off');
  const card = g.items.find(i => i.id === 'keycard');
  tp(g, [card.pos[0], 20, -42.2]); run(g, 0.1);
  if (!g.player.keys.includes('keycard')) { tp(g, card.pos); run(g, 0.1); }
  assert.ok(g.player.keys.includes('keycard'), 'keycard');
  killGroup(g, 'reserve');
  zone(g, 'bunker');
  use(g, 'bunkerDoor');
};

WALK.cell = g => {
  const key = g.items.find(i => i.id === 'cellkey');
  kill(g, 'warden');
  tp(g, key.pos); run(g, 0.1);
  assert.ok(g.player.keys.includes('cells'), 'cell keys');
  zone(g, 'downstairs');
  tp(g, [2, -5, -50], 0);
  g.player.pitch = -0.2;
  g.useDoor(g.door('cn5'));
  run(g, 0.3);
  const c = g.char('carrington');
  assert.equal(c.ai.order.type, 'follow', 'general follows');
  run(g, 4);
  assert.ok(g.alarmOn, 'alarm after the escape');
  killGroup(g, 'response');
  for (const e of g.chars) if (e.team === 'enemy' && e.state === 'alive') kill(g, e.id);
  zone(g, 'tunnel');
  killGroup(g, 'tunnel');
  tp(g, [-66, -5, -50], Math.PI / 2);
  run(g, 30);
  assert.ok(X.hdist(c.pos, [-67, 0, -50]) < 3.2, 'general on the lift ' + c.pos.map(v => v.toFixed(1)).join(','));
  use(g, 'liftBtn');
  run(g, 9);
};

WALK.cable = g => {
  const c = g.char('carrington');
  const car = g.groups.find(q => q.id === 'car');
  for (const id of ['u1', 'u2', 'u3', 'u5', 'op']) kill(g, id);
  tp(g, [8.6, 59.2, 2.4], Math.PI / 2);
  use(g, 'power');
  killGroup(g, 'resp');
  run(g, 20);
  assert.ok(Math.abs(c.pos[0] - car.pos[0]) < 1.25 && Math.abs(c.pos[2] - car.pos[2]) < 2.1, 'general boarded ' + c.pos.map(v => v.toFixed(1)).join(','));
  tp(g, [car.pos[0] + 0.3, car.pos[1], car.pos[2] - 0.9], 0);
  run(g, 0.2);
  use(g, 'go');
  assert.ok(car.moving, 'car departs');
  run(g, 12);
  assert.equal(g.state, 'play', 'still riding ' + (g.failReason || ''));
  assert.ok(car.pos[2] < -60 && Math.abs(g.player.pos[2] - car.pos[2]) < 2.2, 'player rides with the car');
  run(g, 20);
  assert.equal(g.flags.leg, 'pylon', 'stopped at the pylon');
  assert.ok(Math.abs(c.pos[2] - car.pos[2]) < 2.2 && Math.abs(c.pos[1] - car.pos[1]) < 0.3, 'general still in the car');
  killGroup(g, 'boarders'); killGroup(g, 'crew');
  const v = g.vehicle('heli');
  assert.ok(v.active, 'helicopter launched');
  run(g, 3);
  g.damageVehicle(v, 5000, true);
  run(g, 0.2);
  assert.ok(objDone(g, 'heli'), 'helicopter down');
  tp(g, [0, 36.3, -148.45], 0);
  run(g, 0.1, () => ({ fwd: 1, yaw: 0, pitch: 0 }));
  assert.ok(g.player.ladder, 'on the pylon ladder ' + g.state + ' ' + (g.failReason || '') + ' ' + g.player.pos.map(q => q.toFixed(2)).join(','));
  run(g, 3.5, () => ({ fwd: 1, yaw: 0, pitch: 0.6 }));
  assert.ok(g.player.pos[1] > 39.5, 'climbed to the top platform ' + g.player.pos.map(q => q.toFixed(2)).join(','));
  use(g, 'brake');
  assert.ok(objDone(g, 'brake'), 'brake released');
  tp(g, [car.pos[0] + 0.3, car.pos[1], car.pos[2] - 0.9], 0);
  run(g, 0.2);
  use(g, 'go');
  assert.ok(car.moving, 'second leg');
  run(g, 34);
  assert.equal(g.flags.leg, 'lower', 'docked below');
  assert.ok(Math.abs(g.player.pos[1] - 4) < 0.5, 'player at the valley station');
  killGroup(g, 'lower');
  zone(g, 'lowerYard');
  killGroup(g, 'gateResp');
  run(g, 1);
  zone(g, 'gate');
};

WALK.lake = g => {
  const p = g.player;
  const boat = g.groups.find(q => q.id === 'boat');
  const b0 = boat.pos.slice(), y0 = boat.yaw;
  tp(g, [15, -1.3, -14], 0);
  run(g, 3, () => ({ fwd: 1, yaw: 0, pitch: 0 }));
  assert.ok(p.swim && p.pos[2] < -18, 'swimming north ' + p.pos.map(v => v.toFixed(2)).join(','));
  run(g, 1.2, () => ({ crouch: true, yaw: 0, pitch: 0 }));
  assert.ok(p.underwater, 'dived under');
  assert.ok(X.vdist(boat.pos, b0) > 10 && Math.abs(boat.yaw - y0) > 0.3, 'patrol boat circles the island');
  const sl = g.searchlights.find(s => s.id === 'boatLight');
  assert.ok(X.hdist(sl.pos, boat.pos) < 2, 'searchlight rides the boat');
  zone(g, 'north');
  for (const id of ['n1', 'n2']) kill(g, id);
  zone(g, 'cabinIn');
  assert.ok(objDone(g, 'cabin'), 'reached the cabin');
  const diary = g.items.find(i => i.id === 'diary');
  tp(g, [diary.pos[0], 1.9, diary.pos[2] + 0.6]); run(g, 0.1);
  if (!diary.taken) { tp(g, diary.pos); run(g, 0.1); }
  assert.ok(diary.taken && g.player.skills.includes('tough'), 'diary read, second wind learned');
  run(g, 3);
  assert.ok(g.groups.find(q => q.id === 'irish').moving, 'the Irishman is coming');
  killGroup(g, 'ambush');
  tp(g, [-66, 1.3, -108], 0);
  run(g, 26);
  assert.equal(g.char('ic1').grp, null, 'crew landed');
  killGroup(g, 'irishCrew');
  killGroup(g, 'mill');
  run(g, 10);
  assert.ok(g.flags.irishLeft, 'the Irishman left');
  zone(g, 'truck');
};

WALK.hideout = g => {
  const p = g.player;
  zone(g, 'back');
  tp(g, [-30, 29.94, -56], Math.PI / 2);
  use(g, 'power');
  run(g, 0.2);
  assert.ok(g.searchlights.every(s => !s.light.on), 'searchlights dark');
  for (const id of ['g1', 'g2', 'g4', 'p1', 'p2', 'sn']) kill(g, id);
  zone(g, 'inside');
  assert.ok(objDone(g, 'enter'), 'inside the lodge');
  const prot = g.items.find(i => i.id === 'protocol');
  tp(g, [prot.pos[0], 30, prot.pos[2] + 0.5]); run(g, 0.1);
  if (!prot.taken) { tp(g, prot.pos); run(g, 0.1); }
  assert.ok(prot.taken, 'protocol read');
  tp(g, [11.8, 30, -44.6], 0);
  use(g, 'book');
  run(g, 1);
  assert.equal(g.door('secret').target, 1, 'bookcase slid open');
  tp(g, [14, 30, -47], 0);
  run(g, 0.6, () => ({ fwd: 1, yaw: 0, pitch: 0 }));
  assert.ok(Math.abs(p.pos[2] + 50) < 1.9, 'walked onto the lift ' + p.pos.map(v => v.toFixed(2)).join(','));
  use(g, 'lift');
  run(g, 7);
  assert.ok(Math.abs(p.pos[1] - 18) < 0.3, 'rode down the shaft ' + p.pos[1].toFixed(2));
  assert.ok(g.flags.mineReached, 'mine reached');
  assert.ok(g.nav.path(p.pos, [-50, 18, -73]), 'path through the mine');
  for (const id of ['m1', 'm2', 'm3', 'm4']) kill(g, id);
  zone(g, 'cavern');
  const ir = g.char('irish');
  g.damageChar(ir, 560, 'body', [0, 0, 1], 'player', 'm16', ir.pos);
  run(g, 0.2);
  assert.ok(g.flags.aditCalled, 'reinforcements called');
  killGroup(g, 'adit');
  kill(g, 'irish');
  run(g, 7);
};

WALK.plainrock = g => {
  const p = g.player;
  assert.equal(p.weapon, 'fists', 'stripped to fists');
  assert.equal(g.door('cw12').target, 0, 'cell locked');
  run(g, 10);
  assert.ok(g.flags.blackout && g.door('cw12').target === 1, 'lightning opened the cells');
  kill(g, 'g2');
  const drop = g.items.find(i => i.dropped && i.kind === 'weapon' && !i.taken);
  assert.ok(drop, 'guard dropped a gun');
  tp(g, drop.pos); run(g, 0.2);
  assert.ok(objDone(g, 'weapon'), 'armed');
  for (const id of ['g1', 'g3', 'g4']) kill(g, id);
  assert.ok(g.nav.path(p.pos, [0, 10, -20]), 'cell block leads to the yard');
  zone(g, 'yardS');
  kill(g, 'cap');
  const key = g.items.find(i => i.kind === 'key' && i.key === 'armory');
  tp(g, key.pos); run(g, 0.2);
  assert.ok(p.keys.includes('armory'), 'armory key');
  for (const id of ['y1', 'y2', 'y3', 'a1', 'a2', 'a3']) kill(g, id);
  zone(g, 'lobby');
  assert.ok(objDone(g, 'admin'), 'reached the admin block');
  tp(g, [6.6, 10, -32.6], -Math.PI / 2);
  g.useDoor(g.door('armory'));
  run(g, 0.5);
  assert.equal(g.door('armory').target, 1, 'armory open');
  assert.ok(g.nav.path([0, 10, -34], [0, 18, -35]), 'stairwell reaches the roof');
  for (const id of ['a4', 'a5']) kill(g, id);
  zone(g, 'roof');
  kill(g, 'r1'); kill(g, 'r2'); kill(g, 'mongoose');
  run(g, 14);
  assert.ok(g.flags.rescueHere, 'Jones hovers over the pad');
  zone(g, 'rescue');
};

for (const l of X.LEVELS) {
  test(`level ${l.n} ${l.name}: builds, spawns on ground, key points reachable`, () => {
    const g = newGame(l.id);
    const p = g.player;
    assert.ok(g.nav.count > 100, 'nav nodes');
    const sup = g.world.support(p.pos[0], p.pos[2], 0.2, p.pos[1] + 0.3).y;
    assert.ok(Math.abs(sup - p.pos[1]) < 0.35, 'player on ground ' + sup + ' vs ' + p.pos[1]);
    assert.ok(!g.world.overlaps(p.pos[0], p.pos[2], 0.3, p.pos[1] + X.STEP, p.pos[1] + 1.7), 'player not in wall');
    const start = g.nav.nearest(p.pos);
    assert.ok(start >= 0, 'start on nav');
    const bad = [];
    for (const c of g.chars) {
      if (c.grp || c.state === 'dead' || c.pose) continue;
      if (g.world.overlaps(c.pos[0], c.pos[2], 0.25, c.pos[1] + X.STEP, c.pos[1] + 1.6)) bad.push(c.id + '@' + c.pos.map(v => v.toFixed(1)).join(','));
      const s = g.world.support(c.pos[0], c.pos[2], 0.2, c.pos[1] + 0.3).y;
      if (Math.abs(s - c.pos[1]) > 0.35 && !c.spawn.static) bad.push(c.id + ' floats ' + s.toFixed(2) + ' vs ' + c.pos[1].toFixed(2));
    }
    for (const it of g.items) {
      if (it.grp) continue;
      if (g.world.overlaps(it.pos[0], it.pos[2], 0.04, it.pos[1] + 0.02, it.pos[1] + 0.06)) bad.push('item ' + it.id + ' ' + it.kind + ' ' + it.pos.map(v => v.toFixed(1)));
    }
    assert.deepEqual(bad, [], 'spawns and items clear of geometry');
    const unreachable = [];
    for (const t of g.triggers) {
      if (t.noReach) continue;
      const c = center(t);
      const n = g.nav.nearest([c[0], g.world.groundY(c[0], c[2], t.max[1]), c[2]], 8);
      if (!g.nav.connected(start, n)) unreachable.push(t.id);
    }
    assert.deepEqual(unreachable, [], 'triggers reachable from start');
  });
  if (WALK[l.id]) test(`level ${l.n} ${l.name}: scripted walkthrough reaches the end`, () => {
    const g = newGame(l.id);
    g.god = true;
    WALK[l.id](g);
    assert.equal(g.state, 'complete', 'level finished, state ' + g.state + ' ' + (g.failReason || ''));
    assert.ok(g.allObjectivesDone(), 'objectives done: ' + g.objectives.filter(o => !o.done && !o.optional).map(o => o.id).join(','));
  });
}

test('ai: enemies fight back and allies follow', () => {
  const g = newGame('brighton');
  const h = g.char('h2');
  tp(g, [h.pos[0], h.pos[1], h.pos[2] + 8], Math.PI);
  const hp = g.player.health;
  run(g, 8, () => ({ yaw: Math.PI, pitch: 0 }));
  assert.equal(h.ai.alert, 2);
  assert.ok(g.player.health < hp, 'player took fire');
});

test('source: zero comments in every XIII file', () => {
  const files = [...SIM, ...LEVEL_FILES, ...CLIENT].map(f => path.join(DIR, f + '.js'));
  const extra = [path.join(ROOT, 'js', 'apps', 'xiii-app.js'), path.join(ROOT, 'css', 'apps', 'xiii.css')];
  for (const f of files.concat(extra.filter(e => fs.existsSync(e)))) {
    const src = fs.readFileSync(f, 'utf8');
    if (f.endsWith('.css')) { assert.ok(!src.includes('/*'), 'css comment in ' + f); continue; }
    const at = commentFree(src);
    assert.equal(at, -1, `comment in ${path.basename(f)} at ${at}: ${at >= 0 ? src.slice(at, at + 60) : ''}`);
  }
});

console.log(`${passed} tests passed`);
