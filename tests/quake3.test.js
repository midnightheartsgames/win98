const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js', 'apps', 'quake3');
const MAPS = ['q3dm1', 'q3dm2', 'q3dm3', 'q3tourney1', 'q3dm4', 'q3dm5', 'q3dm6', 'q3tourney2'];
const CORE = ['q3-core', 'q3-data', 'q3-world', 'q3-pmove', 'q3-game', 'q3-nav', 'q3-ai'];
const MAP_FILES = MAPS.map(m => 'q3-map-' + m);
const CLIENT = ['q3-tex', 'q3-light', 'q3-models', 'q3-render', 'q3-fx', 'q3-scene', 'q3-audio', 'q3-hud', 'q3-menu', 'q3-ui'];
const ALL = [...CORE, ...MAP_FILES, ...CLIENT];
for (const f of [...CORE, ...MAP_FILES, 'q3-tex', 'q3-light', 'q3-models', 'q3-menu']) require(path.join(DIR, f + '.js'));
const Q = globalThis.Quake3;
const WP = Q.WP;

let passed = 0;
const only = process.argv[2] || null;
function test(name, fn) {
  if (only && !name.includes(only)) return;
  const t0 = Date.now();
  fn();
  passed++;
  console.log(`  ok - ${name} (${Date.now() - t0} ms)`);
}

function newGame(map, o = {}) {
  return new Q.Game(Object.assign({ map, fraglimit: 0, timelimit: 0, seed: 7, warmup: 0, players: [{ human: true, name: 'Tester' }] }, o));
}
function idle(p) { return { forward: 0, right: 0, up: 0, yaw: p.ps.yaw, pitch: p.ps.pitch }; }
function run(g, sec, cmdFn) {
  const n = Math.round(sec / Q.TICK);
  for (let i = 0; i < n; i++) {
    const me = g.local;
    g.step(cmdFn ? cmdFn(g, i) : me ? idle(me) : null);
    if (g.events.length > 400) g.events.length = 0;
  }
}
function place(p, pos, yaw) {
  p.ps.origin = pos.slice();
  p.ps.velocity = [0, 0, 0];
  if (yaw !== undefined) p.ps.yaw = yaw;
}
function freeze(g) { for (const p of g.players) if (p.ai) p.ai.think = () => idle(p); }

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

console.log('--- Quake III Arena ---');

test('data: nine weapons with Quake III values, two tiers of four arenas', () => {
  const W = Q.WEAPONS;
  assert.equal(W.filter(Boolean).length, 9);
  assert.deepEqual(W.slice(1).map(w => w.name), ['Gauntlet', 'Machinegun', 'Shotgun', 'Grenade Launcher', 'Rocket Launcher', 'Lightning Gun', 'Railgun', 'Plasma Gun', 'BFG10K']);
  assert.equal(W[WP.MACHINEGUN].refire, 100); assert.equal(W[WP.MACHINEGUN].dmg, 7);
  assert.equal(W[WP.SHOTGUN].pellets, 11); assert.equal(W[WP.SHOTGUN].refire, 1000);
  assert.equal(W[WP.ROCKET].speed, 900); assert.equal(W[WP.ROCKET].radius, 120);
  assert.equal(W[WP.RAILGUN].dmg, 100); assert.equal(W[WP.RAILGUN].refire, 1500);
  assert.equal(W[WP.LIGHTNING].range, 768); assert.equal(W[WP.PLASMA].speed, 2000);
  assert.deepEqual(Q.TIERS.map(t => t.maps), [['q3dm1', 'q3dm2', 'q3dm3', 'q3tourney1'], ['q3dm4', 'q3dm5', 'q3dm6', 'q3tourney2']]);
  assert.deepEqual(Q.ARENAS.map(a => a.name), ['Arena Gate', 'House of Pain', 'Arena of Death', 'Power Station 0218', 'The Place of Many Deaths', 'The Forgotten Place', 'The Camping Grounds', 'The Proving Grounds']);
  for (const a of Q.ARENAS) {
    assert.ok(Q.MAPS[a.map] && Q.MAPS[a.map].name === a.name, a.map + ' defined');
    for (const b of a.bots) assert.ok(Q.BOTS[b], b + ' bot exists');
  }
  assert.equal(Q.arena('q3tourney1').bots[0], 'sarge');
  assert.equal(Q.arena('q3tourney2').bots[0], 'hunter');
  assert.equal(Q.SKILLS.length, 5);
  assert.ok(Object.keys(Q.BOTS).length >= 20);
});

test('movement: jump height, run speed, step height and strafe jumping', () => {
  const g = newGame('q3dm1');
  const g2 = newGame('q3dm1');
  const p2 = g2.local;
  place(p2, [0, -700, 25], 0);
  run(g2, 0.3);
  const base = p2.ps.origin[2];
  let top = base;
  for (let i = 0; i < 80; i++) { g2.step({ forward: 0, right: 0, up: i < 2 ? 127 : 0, yaw: 0, pitch: 0 }); top = Math.max(top, p2.ps.origin[2]); }
  const h = top - base;
  assert.ok(h > 42 && h < 48, 'jump height ' + h.toFixed(1));
  const g3 = newGame('q3dm1');
  const p3 = g3.local;
  place(p3, [-560, -880, 25], Math.PI / 2);
  run(g3, 1.2, () => ({ forward: 127, right: 0, up: 0, yaw: Math.PI / 2, pitch: 0 }));
  const sp = Math.hypot(p3.ps.velocity[0], p3.ps.velocity[1]);
  assert.ok(sp > 310 && sp < 330, 'run speed ' + sp.toFixed(1));
  Q.MAPS.testflat = { id: 'testflat', name: 'Flat', build(B) { B.box(-16384, -16384, -32, 16384, 16384, 0, 'gfloor'); B.spawn(0, 0, 0, 0); } };
  const g4 = newGame('testflat', { noNav: true });
  const p4 = g4.local;
  place(p4, [0, 0, 25], 0);
  let maxSp = 0, yaw = 0;
  run(g4, 5, (gg, i) => {
    if (i < 60) return { forward: 127, right: 0, up: 0, yaw: 0, pitch: 0 };
    const onG = p4.ps.onGround;
    const v = p4.ps.velocity, s = Math.hypot(v[0], v[1]);
    const vel = Math.atan2(v[1], v[0]);
    const opt = Math.acos(Q.clamp((320 - 320 * Q.TICK) / Math.max(s, 1), -1, 1));
    yaw = vel + opt - Math.PI / 4;
    maxSp = Math.max(maxSp, s);
    return { forward: 127, right: -127, up: onG ? 127 : 0, yaw, pitch: 0 };
  });
  assert.ok(maxSp > 380, 'strafe jumping gains speed: ' + maxSp.toFixed(0));
  const w = Q.loadWorld('q3dm1');
  const trace = (a, b, mn, mx) => w.trace(a, b, mn, mx, Q.MASK_PLAYER);
  const ps = g.newPs();
  ps.origin = [-270, -512, 25];
  ps.yaw = Math.PI;
  for (let i = 0; i < 60; i++) Q.pmove(ps, { forward: 127, right: 0, up: 0 }, Q.TICK, trace, q => w.pointContents(q));
  assert.ok(ps.origin[2] > 25 + 40, 'climbed the pillar stairs: z=' + ps.origin[2].toFixed(1));
});

test('rocket jump boosts the shooter and deals half damage to self', () => {
  const g = newGame('q3dm1');
  const p = g.local;
  g.cheat('give all');
  p.health = 100; p.armor = 0;
  place(p, [0, -700, 25], 0);
  run(g, 0.2);
  p.weapon = WP.ROCKET; p.weaponTime = 0; p.pendingWeapon = 0;
  let maxVz = 0;
  run(g, 0.9, (gg, i) => {
    maxVz = Math.max(maxVz, p.ps.velocity[2]);
    return { forward: 0, right: 0, up: i === 0 ? 127 : 0, attack: i === 6, yaw: 0, pitch: 89 * Q.DEG };
  });
  assert.ok(maxVz > 400, 'rocket jump vertical speed ' + maxVz.toFixed(0));
  assert.ok(p.health >= 50 && p.health < 100, 'self damage halved: health ' + p.health);
});

test('damage rules: armor absorbs two thirds, quad triples, splash knocks back', () => {
  const g = newGame('q3dm1', { players: [{ human: true, name: 'A' }, { bot: 'sarge', skill: 1 }] });
  freeze(g);
  const [a, b] = g.players;
  b.health = 100; b.armor = 100;
  g.damage(b, a, a, [1, 0, 0], b.ps.origin, 90, {}, 'rocket');
  assert.equal(b.armor, 100 - 60);
  assert.equal(b.health, 100 - 30);
  b.health = 100; b.armor = 0;
  a.powerups.quad = g.time + 30;
  place(a, [0, -700, 25], Math.PI / 2);
  place(b, [0, -600, 25], -Math.PI / 2);
  a.weapon = WP.RAILGUN; a.weapons[WP.RAILGUN] = true; a.ammo[WP.RAILGUN] = 5; a.weaponTime = 0;
  g.step({ forward: 0, right: 0, up: 0, attack: true, yaw: Math.PI / 2, pitch: 0 });
  assert.ok(!b.alive, 'quad railgun gibs');
  assert.equal(a.score, 1);
  assert.ok(g.events.some(e => e.t === 'obit' && /was railed by A/.test(e.text)));
});

test('weapons: every weapon fires its own way', () => {
  const g = newGame('q3dm6', { players: [{ human: true, name: 'A' }, { bot: 'klesk', skill: 1 }] });
  freeze(g);
  const [a, b] = g.players;
  g.cheat('give all');
  g.god = false;
  const kinds = {};
  for (let w = 1; w <= 9; w++) {
    place(a, [0, -400, 25], Math.PI / 2);
    place(b, [0, w === 1 ? -370 : -200, 25], -Math.PI / 2);
    b.health = 1000; b.armor = 0; b.alive = true;
    a.weapon = w; a.weaponTime = 0; a.pendingWeapon = 0; a.weaponState = 'ready';
    g.events.length = 0;
    const hp = b.health;
    run(g, 0.7, (gg, i) => ({ forward: 0, right: 0, up: 0, attack: i < 30, yaw: Math.PI / 2, pitch: 0 }));
    kinds[w] = hp - b.health;
    assert.ok(kinds[w] > 0, Q.WEAPONS[w].name + ' damaged the target (' + kinds[w] + ')');
  }
  assert.ok(kinds[WP.RAILGUN] >= 100, 'railgun 100');
  const g2 = newGame('q3dm6');
  const p = g2.local;
  g2.cheat('give all');
  place(p, [0, -400, 25], Math.PI / 2);
  p.weapon = WP.GRENADE; p.weaponTime = 0;
  g2.step({ forward: 0, right: 0, up: 0, attack: true, yaw: Math.PI / 2, pitch: -0.3 });
  assert.equal(g2.projectiles.length, 1);
  assert.equal(g2.projectiles[0].kind, 'grenade');
  run(g2, 3, () => ({ forward: 0, right: 0, up: 0, yaw: Math.PI / 2, pitch: 0 }));
  assert.ok(g2.events.some(e => e.t === 'explode' && e.kind === 'grenade'), 'grenade explodes by fuse');
  assert.equal(g2.projectiles.length, 0);
});

test('items: health and armor caps, decay, weapon ammo, powerups and alternating spawns', () => {
  const g = newGame('q3dm1');
  const p = g.local;
  const it = key => ({ key, def: Q.ITEMS[key], pos: [0, 0, 0] });
  p.health = 90;
  g.pickup(p, it('item_health'), false);
  assert.equal(p.health, 100);
  assert.equal(g.canGrab(p, it('item_health')), false);
  assert.equal(g.canGrab(p, it('item_health_small')), true);
  g.pickup(p, it('item_health_mega'), false);
  assert.equal(p.health, 200);
  run(g, 3.05);
  assert.equal(p.health, 197, 'mega health counts down');
  p.armor = 180;
  g.pickup(p, it('item_armor_body'), false);
  assert.equal(p.armor, 200);
  p.ammo[WP.ROCKET] = 3; p.weapons[WP.ROCKET] = false;
  g.pickup(p, it('weapon_rocketlauncher'), false);
  assert.equal(p.ammo[WP.ROCKET], 10);
  g.pickup(p, it('weapon_rocketlauncher'), false);
  assert.equal(p.ammo[WP.ROCKET], 11);
  g.pickup(p, it('item_quad'), false);
  const q1 = p.powerups.quad - g.time;
  g.pickup(p, it('item_quad'), false);
  assert.ok(Math.abs(p.powerups.quad - g.time - q1 - 30) < 1e-6, 'quad time adds up');
  const g2 = newGame('q3dm3');
  const alt = g2.items.find(i => i.alt);
  assert.ok(alt, 'q3dm3 has an alternating spawn');
  const first = alt.key;
  alt.active = false; alt.taken = true; alt.respawnAt = g2.time;
  run(g2, 0.1);
  assert.notEqual(alt.key, first, 'RL and PG alternate');
  const t1 = newGame('q3tourney1');
  const pw = t1.items.find(i => i.def.type === 'powerup');
  assert.ok(pw.alt && ['item_quad', 'item_regen'].includes(pw.key) && ['item_quad', 'item_regen'].includes(pw.alt));
  assert.ok(!pw.active && pw.respawnAt >= 30 && pw.respawnAt <= 60, 'powerups spawn after warmup delay');
});

test('death drops the weapon and powerup, respawn restores the start loadout', () => {
  const g = newGame('q3dm1', { players: [{ human: true, name: 'A' }, { bot: 'sarge', skill: 1 }] });
  freeze(g);
  const [a, b] = g.players;
  b.weapons[WP.ROCKET] = true; b.ammo[WP.ROCKET] = 10; b.weapon = WP.ROCKET;
  b.powerups.quad = g.time + 20;
  g.damage(b, a, a, null, b.ps.origin, 1000, {}, 'rocket');
  assert.ok(!b.alive);
  assert.ok(g.dropped.some(d => d.key === 'weapon_rocketlauncher'));
  assert.ok(g.dropped.some(d => d.key === 'item_quad' && d.remaining > 19));
  run(g, 3);
  assert.ok(b.alive, 'bot respawns');
  assert.equal(b.health, 125);
  assert.equal(b.weapon, WP.MACHINEGUN);
  assert.equal(b.ammo[WP.MACHINEGUN], 100);
});

test('rules: fraglimit, timelimit with sudden death, team play and mods', () => {
  const g = newGame('q3dm1', { fraglimit: 2, players: [{ human: true, name: 'A' }, { bot: 'sarge', skill: 1 }] });
  freeze(g);
  const [a, b] = g.players;
  g.damage(b, a, a, null, b.ps.origin, 1000, {}, 'railgun');
  for (let i = 0; i < 600 && !b.alive; i++) g.step(idle(a));
  assert.ok(b.alive);
  g.damage(b, a, a, null, b.ps.origin, 1000, {}, 'railgun');
  run(g, 2.5);
  assert.equal(g.state, 'intermission');
  assert.equal(g.winner(), a);
  const t = newGame('q3dm1', { timelimit: 1 / 60, players: [{ human: true, name: 'A' }, { bot: 'sarge', skill: 1 }] });
  freeze(t);
  run(t, 1.2);
  assert.ok(t.sudden, 'tied at timelimit goes to sudden death');
  t.damage(t.players[1], t.players[0], t.players[0], null, t.players[1].ps.origin, 1000, {}, 'railgun');
  run(t, 2.5);
  assert.equal(t.state, 'intermission');
  const tm = newGame('q3dm6', { gametype: 'team', players: [{ human: true, name: 'A', team: 'red' }, { bot: 'sarge', team: 'red' }, { bot: 'klesk', team: 'blue' }] });
  freeze(tm);
  const [ra, rb, bk] = tm.players;
  ra.health = 100;
  tm.damage(rb, ra, ra, [1, 0, 0], rb.ps.origin, 50, {}, 'rocket');
  assert.equal(rb.health, 125, 'no friendly fire');
  tm.damage(bk, ra, ra, null, bk.ps.origin, 1000, {}, 'railgun');
  assert.equal(tm.teamScores.red, 1);
  const ig = newGame('q3dm6', { mod: 'instagib', players: [{ human: true, name: 'A' }, { bot: 'sarge', skill: 1 }] });
  assert.ok(ig.players.every(p => p.weapons[WP.RAILGUN] && !p.weapons[WP.ROCKET]));
  assert.ok(ig.items.every(i => !i.active), 'instagib removes items');
  const ar = newGame('q3dm6', { mod: 'arsenal' });
  const me = ar.local;
  assert.ok([1, 2, 3, 4, 5, 6, 7, 8, 9].every(w => me.weapons[w]));
  const hp = me.health;
  ar.damage(me, me, me, [0, 0, 1], me.ps.origin, 80, { radius: true }, 'rocket_splash');
  assert.equal(me.health, hp, 'no self damage in Rocket Arena');
});

for (const map of MAPS) {
  test('map ' + map + ': geometry, spawns, items and bot navigation', () => {
    const w = Q.loadWorld(map);
    const def = Q.MAPS[map];
    assert.ok(w.faces.length > 200, 'faces ' + w.faces.length);
    assert.ok(w.spawns.length >= 6, 'spawns ' + w.spawns.length);
    assert.ok(def.levelshot && w.intermission, 'levelshot and intermission');
    for (const s of w.spawns) {
      assert.ok(!w.testBox(s.pos, Q.PLAYER_MINS, Q.PLAYER_MAXS), 'spawn clear ' + s.pos);
      for (const it of w.items) assert.ok(Q.vdist2(s.pos, it.pos) >= 50 || Math.abs(s.pos[2] - it.pos[2]) > 60, 'spawn ' + s.pos + ' not on ' + it.key);
    }
    for (const it of w.items) assert.ok(!w.trace(it.pos, it.pos, [-15, -15, -15], [15, 15, 15], Q.MASK_PLAYER).startSolid, it.key + ' not inside geometry at ' + it.pos);
    const nav = Q.getNav(w);
    for (const e of [...w.items, ...w.spawns]) {
      const n = nav.nearest(e.pos, 96);
      assert.ok(n >= 0 && nav.nodes[n].comp === nav.mainComp, (e.key || 'spawn') + ' reachable at ' + e.pos.map(Math.round));
    }
    for (const p of w.pads) assert.ok(!p.navBroken, 'jump pad lands somewhere');
    for (const t of w.teles) assert.ok(!t.navBroken, 'teleporter destination reachable');
    const weapons = new Set(w.items.filter(i => Q.ITEMS[i.key].type === 'weapon').map(i => i.key));
    assert.ok(weapons.size >= 3, 'weapons on map ' + weapons.size);
  });
}

test('every Quake III weapon can be found in the arenas', () => {
  const all = new Set();
  for (const m of MAPS) for (const it of Q.loadWorld(m).items) { all.add(it.key); if (it.alt) all.add(it.alt); }
  for (const k of ['weapon_shotgun', 'weapon_grenadelauncher', 'weapon_rocketlauncher', 'weapon_lightning', 'weapon_railgun', 'weapon_plasmagun']) assert.ok(all.has(k), k);
  for (const k of ['item_armor_body', 'item_armor_combat', 'item_health_mega', 'item_quad', 'item_regen', 'item_haste', 'holdable_teleporter']) assert.ok(all.has(k), k);
});

test('bots fight on every arena', () => {
  for (const m of MAPS) {
    const a = Q.arena(m);
    const g = new Q.Game({ map: m, fraglimit: 0, timelimit: 0, seed: 11, warmup: 0, players: a.bots.concat(['sarge']).map(b => ({ bot: b, skill: 4 })) });
    let frags = 0, picks = 0;
    for (let i = 0; i < 60 * 90; i++) {
      g.step(null);
      for (const e of g.events) { if (e.t === 'obit') frags++; if (e.t === 'pickup') picks++; }
      g.events.length = 0;
    }
    assert.ok(frags >= 2, m + ' frags ' + frags);
    assert.ok(picks >= 8, m + ' pickups ' + picks);
    const kills = g.players.reduce((s, p) => s + p.kills, 0);
    assert.ok(kills >= 1, m + ' kills ' + kills);
  }
});

test('a single player arena plays out to the fraglimit', () => {
  const g = new Q.Game({ map: 'q3tourney2', gametype: 'tourney', fraglimit: 5, timelimit: 0, seed: 3, warmup: 3, players: [{ bot: 'hunter', skill: 5 }, { bot: 'klesk', skill: 3 }] });
  assert.equal(g.state, 'warmup');
  let t = 0;
  while (g.state !== 'intermission' && t < 60 * 600) { g.step(null); g.events.length = 0; t++; }
  assert.equal(g.state, 'intermission', 'match ended');
  assert.ok(g.winner().score >= 5);
});

test('demos: the same seed and commands replay the same match', () => {
  const cmds = [];
  const mk = () => new Q.Game({ map: 'q3dm2', fraglimit: 0, seed: 1234, warmup: 1, players: [{ human: true, name: 'Rec', model: 'mynx' }, { bot: 'phobos', skill: 3 }, { bot: 'klesk', skill: 2 }] });
  const g1 = mk();
  for (let i = 0; i < 60 * 25; i++) {
    const c = { forward: i % 200 < 120 ? 127 : -64, right: (i % 90) < 45 ? 127 : -127, up: i % 70 === 0 ? 127 : 0, attack: i % 50 < 20, weapon: i === 400 ? 3 : 0, yaw: Q.quantAng(Math.sin(i / 70) * 2), pitch: Q.quantAng(Math.cos(i / 90) * 0.3) };
    cmds.push(c);
    g1.step(c);
    g1.events.length = 0;
  }
  const g2 = mk();
  for (const c of cmds) { g2.step(Object.assign({}, c)); g2.events.length = 0; }
  const snap = g => JSON.stringify(g.players.map(p => [p.ps.origin.map(v => v.toFixed(3)), p.health, p.armor, p.score, p.weapon, p.ammo]));
  assert.equal(snap(g2), snap(g1));
});

test('single player ladder: tiers and tournaments unlock in order', () => {
  const menu = Object.create(Q.Menu.prototype);
  menu.ui = { profile: { sp: {} } };
  assert.equal(menu.tierUnlocked(1), true);
  assert.equal(menu.tierUnlocked(2), false);
  assert.equal(menu.mapUnlocked('q3dm1'), true);
  assert.equal(menu.mapUnlocked('q3tourney1'), false);
  menu.ui.profile.sp = { q3dm1: 2, q3dm2: 3, q3dm3: 1 };
  assert.equal(menu.mapUnlocked('q3tourney1'), true);
  assert.equal(menu.mapUnlocked('q3dm4'), false);
  menu.ui.profile.sp.q3tourney1 = 2;
  assert.equal(menu.tierUnlocked(2), true);
  assert.equal(menu.mapUnlocked('q3dm6'), true);
  assert.equal(menu.mapUnlocked('q3tourney2'), false);
});

test('lighting, textures and models build without a browser', () => {
  const w = Q.loadWorld('q3tourney2');
  const b = new Q.Baker(w).run();
  assert.ok(b.W >= 256 && b.bytes.length === b.W * b.H * 4);
  let lit = 0;
  for (let i = 0; i < b.bytes.length; i += 4) if (b.bytes[i] + b.bytes[i + 1] + b.bytes[i + 2] > 60) lit++;
  assert.ok(lit > 1000, 'lightmap has light');
  const s = Q.sampleGrid(b.grid, [0, 0, 60], {});
  assert.ok(s.amb[0] > 0 && s.dir.length === 3);
  for (const k of ['gfloor', 'gwall', 'metal', 'lava', 'emblem', 'jumppad']) {
    const t = Q.genTexture(k);
    assert.ok(t.w >= 16 && t.d.length === t.w * t.h * 4, k);
  }
  for (const k of Object.keys(Q.BOTS)) {
    const ch = Q.getCharacter(Q.BOTS[k].look, null);
    const pose = [];
    Q.poseCharacter(ch, { pos: [0, 0, 0], yaw: 0, legYaw: 0, pitch: 0, t: 0, onGround: true, moveSpeed: 300, phase: 0.3 }, pose);
    assert.ok(pose.length >= 6 && pose.every(p => p.mesh && p.mesh.count > 0), k + ' model');
  }
  for (let w2 = 1; w2 <= 9; w2++) assert.ok(Q.weaponMesh(w2).count > 0);
  assert.ok(Q.emblemMesh().count > 100);
});

test('picture settings: brightness, gamma and contrast reach every shader', () => {
  require(path.join(DIR, 'q3-render.js'));
  require(path.join(DIR, 'q3-ui.js'));
  const D = Q.UI_DEFAULTS;
  assert.ok(D.gamma > 1 && D.contrast >= 1 && D.brightness >= 1, 'the default picture is lifted');
  const ui = Object.create(Q.UI.prototype);
  ui.o = Object.assign({}, D, { brightness: 1.5, gamma: 1.8, contrast: 1.3 });
  ui.audio = { setVolume() { }, setMusic() { } };
  ui.r = { setFilter() { } };
  ui.saveProfile = () => { };
  ui.applySettings();
  assert.deepEqual([ui.r.bright, ui.r.gamma, ui.r.contrast], [1.5, 1.8, 1.3]);
  const set = {};
  Q.Renderer.prototype.grading.call({ gl: { uniform1f: (k, v) => { set[k] = v; } }, gamma: 0, contrast: 1.3 }, { u: { uGamma: 'g', uContrast: 'c' } });
  assert.deepEqual(set, { g: 0.2, c: 1.3 }, 'gamma never reaches zero');
  const render = fs.readFileSync(path.join(DIR, 'q3-render.js'), 'utf8');
  assert.equal((render.match(/gl_FragColor = vec4\(grade\(/g) || []).length, 3, 'world, sky and models are graded');
  assert.ok(/uniform float uAdd;[^`]*\$\{GRADE\}[^`]*uGamma[^`]*uContrast/.test(render), 'sprites are graded');
  assert.equal((render.match(/this\.grading\(p\)/g) || []).length, 4, 'every pass sets the grading uniforms');
  const menu = fs.readFileSync(path.join(DIR, 'q3-menu.js'), 'utf8');
  for (const k of ['brightness', 'gamma', 'contrast']) assert.ok(menu.includes("rng('" + k + "'"), k + ' slider in SETUP > SYSTEM');
});

test('desktop wiring: Steam catalog, no preinstall, shell entry points, zero comments', () => {
  const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
  const html = read('index.html');
  for (const f of ALL) assert.ok(html.includes(`js/apps/quake3/${f}.js`), `index.html loads ${f}`);
  assert.ok(html.indexOf('js/apps/quake3-app.js') > html.indexOf('js/apps/quake3/q3-ui.js') && html.includes('css/apps/quake3.css'), 'index.html loads the wrapper and styles');
  const page = read('quake3.html');
  for (const f of ALL) assert.ok(page.includes(`js/apps/quake3/${f}.js`), `quake3.html loads ${f}`);
  const gm = read('js/game-manager.js');
  const at = gm.indexOf('      quake3: {');
  assert.ok(at > 0, 'catalog entry');
  const entry = gm.slice(at, at + 1600);
  assert.ok(/steam: true/.test(entry) && /price: 44\.99/.test(entry) && /targetExe: 'QUAKE3\.EXE'/.test(entry) && /appQuake3/.test(entry), 'sold on Steam');
  assert.ok(!/quake3Granted/.test(gm), 'no grant flag');
  const loadState = gm.slice(gm.indexOf('loadState'), gm.indexOf('moveGamesToSteam(state)'));
  assert.ok(!/'quake3'/.test(loadState), 'not preinstalled');
  const shell = {
    'js/desktop.js': ["isInstalled('quake3')", 'appQuake3'],
    'js/taskbar.js': ["isInstalled('quake3')", "case 'quake3'", "showInSteam('quake3')"],
    'js/apps/dialogs.js': ["cmd === 'quake3'", "showInSteam(\\'quake3\\')"],
    'js/apps/explorer.js': ["item.app === 'quake3'", 'QUAKE3.EXE', "showInSteam('quake3')"],
    'js/filesystem.js': ["gmInstalled.includes('quake3')", "'QUAKE3.EXE'", "'baseq3'"],
    'js/apps/task-manager.js': ["'app_quake3'", 'quake3.exe'],
    'js/icons.js': ["'quake3': `<svg"],
    'js/apps/steam.js': ["quake3: ['q3dm6'"],
    'js/apps/advanced-site.js': ["gm: 'quake3'"],
    'js/apps/clippy.js': ["id.startsWith('app_quake3')", "launchProgram('quake3', 'appQuake3')"],
    'js/apps/quake3-app.js': ["id = 'app_quake3'", 'Q.UI(root']
  };
  for (const [f, needles] of Object.entries(shell)) {
    const src = read(f);
    for (const n of needles) assert.ok(src.includes(n), `${f} contains ${n}`);
  }
  assert.equal((read('js/i18n.js').match(/'app\.quake3': 'Quake III Arena'/g) || []).length, 4, 'i18n title in every language');
  const files = [...ALL.map(f => path.join(DIR, f + '.js')), path.join(ROOT, 'js', 'apps', 'quake3-app.js'), __filename];
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    new vm.Script(src, { filename: f });
    const c = commentFree(src);
    assert.equal(c, -1, `${path.basename(f)} has a comment at ${c}: ${src.slice(Math.max(0, c - 20), c + 30)}`);
  }
  assert.ok(!read('css/apps/quake3.css').includes('/' + '*'), 'css has no comments');
  assert.ok(!page.includes('<!' + '--'), 'page has no comments');
});

console.log(`${passed} tests passed`);
