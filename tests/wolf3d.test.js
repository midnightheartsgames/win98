const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../js/apps/wolf3d');
const files = ['wl-data', 'wl-gfx', 'wl-level', 'wl-maps-e1', 'wl-maps-e2', 'wl-maps-e3', 'wl-maps-e4', 'wl-maps-e5', 'wl-maps-e6', 'wl-core', 'wl-bot', 'wl-render', 'wl-audio'];
for (const f of files) require(path.join(dir, f + '.js'));
const W = globalThis.Wolf3D, D = W.Data, G = W.Gfx;
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok - ' + name); };
const tics = (g, n, inp = {}) => { for (let i = 0; i < n; i++) g.tic(typeof inp === 'function' ? inp(i) : inp); };
const game = (ep, floor, skill = 2, seed = 5) => new W.Game({ maps: W.Maps, episode: ep, floor, skill, seed });
const mini = rows => [[{ id: 'test', par: 60, rows }]];
const place = (g, x, y, a = 0) => { g.px = x; g.py = y; g.angle = a; g.areaDirty = true; };

test('every texture, sprite frame, item, weapon frame and face exists', () => {
  const T = G.buildTextures();
  for (const n of D.TEXTURES) assert.ok(T[n] && T[n].light.length === 4096 && T[n].dark.length === 4096, n);
  const S = G.staticSprites();
  for (const k of Object.keys(D.DECOR).concat(Object.keys(D.PICKUPS))) assert.ok(S[k] && S[k].px.some(c => c), 'static ' + k);
  for (const k of ['needle', 'rocket', 'fire0', 'fire1', 'smoke0', 'boom2']) assert.ok(S[k], k);
  for (const [type, def] of Object.entries(D.ENEMIES)) {
    const spr = G.actorSprites(type);
    if (def.ghost) { for (let v = 0; v < 4; v++) assert.ok(spr[`w0_${v}`] && spr[`w1_${v}`], 'ghost ' + v); continue; }
    for (const [frame] of def.shoot) assert.ok(spr[frame], `${type} ${frame}`);
    for (const k of ['die1', 'die2', 'dead']) assert.ok(spr[k], `${type} ${k}`);
    if (def.rot) for (let r = 0; r < 8; r++) { assert.ok(spr['s' + r], `${type} s${r}`); for (let f = 0; f < 4; f++) assert.ok(spr[`w${f}_${r}`], `${type} w${f}_${r}`); }
    else for (let f = 0; f < 4; f++) assert.ok(spr['w' + f], `${type} w${f}`);
    if (!def.boss && !def.float && type !== 'dog') assert.ok(spr.pain1 && spr.pain2, type + ' pain');
  }
  const Wp = G.weaponSprites();
  for (const w of D.WEAPONS) { for (const [f] of w.frames) assert.ok(Wp[w.id][f], `${w.id} frame ${f}`); assert.ok(Wp[w.id][0] && Wp[w.id + '_icon'], w.id); }
  const F = G.faces();
  for (let l = 0; l < 7; l++) for (const k of [-1, 0, 1]) assert.ok(F[`f${l}_${k}`], `face ${l} ${k}`);
  for (const k of ['grin', 'dead', 'god0', 'god6', 'skill0', 'skill3']) assert.ok(F[k], k);
  const M = G.misc();
  for (let i = 1; i <= 6; i++) assert.ok(M['ep' + i], 'episode picture ' + i);
});

test('every sound the game asks for has a recipe', () => {
  const audio = fs.readFileSync(path.join(dir, 'wl-audio.js'), 'utf8');
  const cases = new Set([...audio.matchAll(/case '(\w+)'/g)].map(m => m[1]));
  const voices = new Set([...audio.matchAll(/(v_\w+): \[/g)].map(m => m[1]));
  const names = new Set();
  for (const def of Object.values(D.ENEMIES)) { for (const k of ['alert', 'fireSnd']) if (def[k]) names.add(def[k]); (def.die || []).forEach(n => names.add(n)); }
  for (const p of Object.values(D.PICKUPS)) names.add(p.snd);
  for (const w of D.WEAPONS) names.add(w.snd);
  const src = fs.readFileSync(path.join(dir, 'wl-core.js'), 'utf8') + fs.readFileSync(path.join(dir, 'wl-ui.js'), 'utf8');
  for (const m of src.matchAll(/(?:snd|play)\('(\w+)'/g)) names.add(m[1]);
  for (const n of names) assert.ok(n.startsWith('v_') ? voices.has(n) : cases.has(n), 'sound ' + n);
  for (const [name, def] of Object.entries(W.MUSIC)) {
    const tr = W.buildTrack(def);
    const mel = def.mel.split('|');
    assert.equal(mel.length, def.prog.split(/\s+/).length, name + ' bars');
    mel.forEach((bar, i) => assert.equal(bar.trim().split(/\s+/).reduce((s, t) => s + +t.split('.')[1], 0), 16, `${name} bar ${i + 1}`));
    assert.ok(tr.ev.length > 40 && tr.ev.every(e => e.t >= 0 && e.t < tr.len), name);
  }
});

test('all six episodes have ten floors that parse on every skill', () => {
  assert.equal(W.Maps.length, 6);
  W.Maps.forEach((ep, e) => {
    assert.equal(ep.length, 10, 'episode ' + (e + 1));
    ep.forEach((def, f) => {
      const rows = W.Level.rowsOf(def);
      assert.ok(rows.every(r => r.length === rows[0].length), `E${e + 1}F${f + 1} row widths`);
      assert.ok(def.rows.split('\n').filter(l => l.length).every(l => l.length === rows[0].length), `E${e + 1}F${f + 1} raw widths`);
      for (let s = 0; s < 4; s++) { const L = W.Level.parse(def, s); assert.ok(L.start, `E${e + 1}F${f + 1} start`); }
      assert.ok(def.par > 0 && W.MUSIC[def.music] && /^#[0-9a-f]{6}$/i.test(def.ceil), `E${e + 1}F${f + 1} meta`);
    });
  });
});

const analyze = def => {
  const L = W.Level.parse(def, 3), { w, h } = L, issues = [];
  for (let x = 0; x < w; x++) for (const y of [0, h - 1]) if (!L.solid[y * w + x]) issues.push('border');
  for (let y = 0; y < h; y++) for (const x of [0, w - 1]) if (!L.solid[y * w + x]) issues.push('border');
  const reach = (keys, viaPush) => {
    const seen = new Uint8Array(w * h), q = [Math.floor(L.start.y) * w + Math.floor(L.start.x)];
    seen[q[0]] = 1;
    for (let i = 0; i < q.length; i++) {
      const k = q[i], x = k % w, y = (k / w) | 0;
      for (const [dx, dy] of W.Level.DIRS4) {
        const nx = x + dx, ny = y + dy, nk = ny * w + nx;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen[nk]) continue;
        if (L.solid[nk] && !(viaPush && L.push[nk])) continue;
        const di = L.doorAt[nk];
        if (di >= 0 && L.doors[di].lock && !keys[L.doors[di].lock - 1]) continue;
        const si = L.statAt[nk];
        if (si >= 0 && L.statics[si].block) continue;
        seen[nk] = 1; q.push(nk);
      }
    }
    return seen;
  };
  const dropsKey = def.boss && D.ENEMIES[def.boss].drop === 'key1';
  const keys = [false, false];
  let seen;
  for (let i = 0; i < 4; i++) {
    seen = reach(keys, false);
    for (const s of L.statics) if (seen[s.y * w + s.x] && (s.pick === 'key1' || s.pick === 'key2')) keys[s.pick === 'key1' ? 0 : 1] = true;
    if (dropsKey && L.actors.some(a => D.ENEMIES[a.type].boss && seen[a.y * w + a.x])) keys[0] = true;
  }
  const near = (s, type) => { for (let k = 0; k < w * h; k++) if (L.exitAt[k] === type) { const x = k % w, y = (k / w) | 0; if (W.Level.DIRS4.some(([dx, dy]) => s[(y + dy) * w + x + dx])) return true; } return false; };
  const all = reach([true, true], true);
  return { L, issues, seen, all, near, keys };
};

test('every floor is closed, solvable with its keys and has nothing out of reach', () => {
  W.Maps.forEach((ep, e) => ep.forEach((def, f) => {
    const id = `E${e + 1}F${f + 1}`, r = analyze(def), L = r.L;
    assert.deepEqual(r.issues, [], id + ' border');
    const hasExit = [...L.exitAt].includes(1), hasSecret = [...L.exitAt].includes(2);
    const bd = def.boss && D.ENEMIES[def.boss], deathcam = bd && (bd.deathcam || (bd.spawn && D.ENEMIES[bd.spawn].deathcam));
    if (deathcam) assert.ok(!hasExit || r.near(r.seen, 1), id);
    else { assert.ok(hasExit, id + ' exit'); assert.ok(r.near(r.seen, 1), id + ' exit reachable'); }
    assert.equal(hasSecret, D.EPISODES[e].secretFrom === f + 1, id + ' secret elevator on the right floor');
    if (hasSecret) assert.ok(r.near(r.all, 2), id + ' secret exit reachable');
    for (const s of L.statics) if (s.pick) assert.ok(r.all[s.y * L.w + s.x], `${id} ${s.pick} at ${s.x},${s.y}`);
    for (const a of L.actors) assert.ok(r.all[a.y * L.w + a.x], `${id} ${a.type} at ${a.x},${a.y}`);
    for (let k = 0; k < L.w * L.h; k++) if (L.push[k]) {
      const x = k % L.w, y = (k / L.w) | 0;
      assert.ok(W.Level.DIRS4.some(([dx, dy]) => r.all[(y - dy) * L.w + x - dx] && !L.solid[(y + dy) * L.w + x + dx] && L.doorAt[(y + dy) * L.w + x + dx] < 0), `${id} pushwall ${x},${y}`);
    }
    if (f === 8) assert.ok(L.actors.some(a => a.type === D.EPISODES[e].boss), id + ' boss');
    if (f < 8) assert.ok(L.totals.kills >= 8 && L.totals.treasures >= 3, id + ' content');
  }));
  const pac = W.Level.parse(W.Maps[2][9], 1);
  assert.equal(pac.actors.filter(a => a.type === 'ghost').length, 4);
  assert.ok(pac.totals.treasures > 200, 'pellets');
  const f1 = W.Level.parse(W.Maps[0][0], 1);
  assert.equal(D.TEXTURES[f1.wall[12 * f1.w + 27] - 1], 'portrait', 'the portrait on floor 1 slides');
  assert.ok(f1.push[12 * f1.w + 27]);
  assert.ok(f1.statics.some(s => s.pick === 'mg' && s.x === 29 && s.y === 12), 'machine gun behind the portrait');
  const f3 = W.Level.parse(W.Maps[0][2], 1);
  assert.ok(f3.statics.filter(s => s.pick === 'chalice' && s.y <= 3).length === 2, 'chalices in the secret room of floor 3');
  assert.ok(W.Level.parse(W.Maps[0][3], 3).actors.filter(a => a.type === 'dog').length >= 8, 'dogs on floor 4');
});

test('movement, collision and doors', () => {
  const g = new W.Game({ maps: mini(String.raw`
AAAAAAA
A.....A
AAA+AAA
A..>..A
AAAAAAA`), skill: 1, seed: 1 });
  place(g, 3.5, 3.5, 0);
  tics(g, 35, { fwd: 1 });
  assert.ok(g.px < 5.67 && g.px > 5.4, 'stops at the wall ' + g.px);
  place(g, 3.5, 3.5, -Math.PI / 2);
  tics(g, 35, { fwd: 1 });
  assert.ok(g.py > 3.2, 'closed door blocks');
  const door = g.level.doors[0];
  g.tic({ use: true }); g.tic({});
  assert.equal(door.state, 'opening');
  tics(g, 64);
  assert.equal(door.state, 'open');
  tics(g, 50, { fwd: 1 });
  assert.ok(g.py < 2, 'walks through the open door');
  tics(g, 400);
  assert.equal(door.state, 'closed', 'door closes by itself');
  const w = new W.Game({ maps: mini(String.raw`
AAAAA
A.>.A
AAAAA`), skill: 1 });
  place(w, 2.5, 1.5, 0);
  tics(w, 70, { fwd: 1 });
  const walk = w.px;
  place(w, 1.5, 1.5, 0);
  tics(w, 7, { fwd: 1, run: true });
  assert.ok(w.px - 1.5 > (7 / 70) * D.PLAYER.walk * 1.6, 'running is faster');
  assert.ok(walk < 3.67, 'walk collision');
});

test('locks, pushwalls, pickups and treasure', () => {
  const g = new W.Game({ maps: mini(String.raw`
AAAAAAAAA
A.......A
A.@...A!A
A.A...AXA
A.Ay.>A.A
AAAAAAAAA`), skill: 1 });
  const L = g.level;
  place(g, 7.5, 1.5, Math.PI / 2);
  g.tic({ use: true }); g.tic({});
  assert.equal(L.doors[0].state, 'closed', 'locked without key');
  place(g, 3.5, 4.5, 0); g.tic({});
  assert.ok(g.keys[0], 'gold key taken');
  place(g, 7.5, 1.5, Math.PI / 2);
  g.tic({ use: true }); g.tic({});
  assert.equal(L.doors[0].state, 'opening', 'opens with the key');
  place(g, 3.5, 2.5, Math.PI);
  g.tic({ use: true }); g.tic({});
  assert.ok(g.pushwall && g.secrets === 1, 'pushwall starts and counts as a secret');
  tics(g, 300);
  assert.ok(!g.pushwall && L.solid[2 * L.w + 1] && !L.solid[2 * L.w + 2], 'pushwall slides one tile when blocked behind');
  const h = new W.Game({ maps: mini(String.raw`
AAAAAAAAAAA
A>efatxrlpA
AAAAAAAAAAA`), skill: 1 });
  h.health = 50; h.ammo = 98;
  for (let x = 2; x <= 9; x++) { place(h, x + 0.5, 1.5); h.tic({}); }
  assert.equal(h.health, 100);
  assert.equal(h.ammo, 99);
  assert.equal(h.treasures, 4);
  assert.ok(h.lives === 4 && h.weapons[3] && h.weapon === 3, 'one-up and chain gun');
  assert.equal(h.score, 500 + 1000 + 5000);
  const full = h.level.statics.filter(s => s.active && s.pick).length;
  assert.equal(full, 0);
  const e = new W.Game({ maps: mini(String.raw`
AAAAA
A>.fA
AAAAA`), skill: 1 });
  place(e, 3.5, 1.5); e.tic({});
  assert.ok(e.level.statics[0].active, 'food is left when health is full');
});

test('weapons: fire rates, ammo and the knife', () => {
  const mk = () => { const g = new W.Game({ maps: mini(String.raw`
AAAAAAAAAAAAAAAA
A>.............A
AAAAAAAAAAAAAAAA`), skill: 1 }); g.ammo = 99; g.weapons = [true, true, true, true]; return g; };
  const shots = (g, w, n) => { g.weapon = w; const a0 = g.ammo; tics(g, n, { fire: true }); return a0 - g.ammo; };
  assert.equal(shots(mk(), 1, 70), 1, 'pistol fires once per press');
  const mg = shots(mk(), 2, 70), cg = shots(mk(), 3, 70);
  assert.ok(mg >= 5 && mg <= 7, 'machine gun ' + mg);
  assert.ok(cg >= 10 && cg <= 13, 'chain gun ' + cg);
  const g = mk(); g.ammo = 1; g.weapon = 1;
  tics(g, 40, i => ({ fire: i < 2 }));
  assert.equal(g.ammo, 0);
  assert.equal(g.weapon, 0, 'switches to the knife when empty');
  g.selectWeapon(2);
  assert.equal(g.weapon, 0, 'no gun without ammo');
});

test('enemies: sight, noise through open doors, sneak damage and death', () => {
  const rows = String.raw`
AAAAAAAAAAAAA
A...A...A...A
A.>.+.g.+.g.A
A...A...A...A
AAAAAAAAAAAAA`;
  const g = new W.Game({ maps: mini(rows), skill: 1, seed: 9 });
  const [near, far] = g.actors;
  g.weapon = 1; g.angle = Math.PI;
  tics(g, 10, i => ({ fire: i === 0 }));
  tics(g, 80);
  assert.ok(!near.attack && !far.attack, 'closed doors stop the noise');
  g.level.doors[0].state = 'open'; g.level.doors[0].pos = 1; g.areaDirty = true;
  tics(g, 30, i => ({ fire: i === 0 }));
  tics(g, 80);
  assert.ok(near.attack, 'gunfire wakes the room behind an open door');
  assert.ok(!far.attack, 'the next closed room stays asleep');
  const s = new W.Game({ maps: mini(rows), skill: 1, seed: 3 });
  const a = s.actors[0];
  const hp = a.hp;
  s.damageActor(a, 10);
  assert.equal(a.hp, hp - 20, 'an unaware enemy takes double damage');
  assert.ok(a.attack);
  s.damageActor(a, 10);
  assert.equal(a.hp, hp - 30);
  s.damageActor(a, 100);
  assert.equal(a.state, 'die');
  assert.equal(s.kills, 1);
  assert.equal(s.score, 100);
  tics(s, 60);
  assert.equal(a.state, 'dead');
  assert.ok(s.level.statics.some(st => st.pick === 'clip2' && st.dropped), 'guard drops a clip');
});

test('enemies hurt the player, the player dies and respawns with the old score', () => {
  const g = new W.Game({ maps: mini(String.raw`
AAAAAAAAA
A.>...s.A
AAAAAAAAA`), skill: 3, seed: 4 });
  g.score = 1234; g.oldScore = 1000;
  tics(g, 70 * 20);
  assert.ok(g.mode === 'dead', 'the SS kills a player who stands still: ' + g.mode + ' ' + g.health);
  assert.equal(g.respawn(), true);
  assert.equal(g.lives, 2);
  assert.equal(g.score, 1000);
  assert.ok(g.health === 100 && g.ammo === 8 && g.weapon === 1 && g.mode === 'play');
  g.lives = 0; g.mode = 'dead';
  assert.equal(g.respawn(), false);
  assert.equal(g.mode, 'gameover');
  const d = new W.Game({ maps: mini(String.raw`
AAAAAAA
A>..d.A
AAAAAAA`), skill: 3, seed: 2 });
  d.god = true;
  tics(d, 70 * 3);
  assert.ok(d.actors[0].attack && d.damageFlash >= 0, 'the dog attacks');
  assert.equal(d.health, 100, 'god mode');
  const b = new W.Game({ maps: mini(String.raw`
AAAAAAAA
A>....gA
AAAAAAAA`), skill: 0, seed: 1 });
  b.takeDamage(40, null);
  assert.equal(b.health, 90, 'the easiest skill quarters damage');
});

test('score, lives, cheats and floor order', () => {
  const g = game(0, 0, 1);
  g.givePoints(39999); assert.equal(g.lives, 3);
  g.givePoints(1); assert.equal(g.lives, 4, 'extra life at 40000');
  g.givePoints(40000); assert.equal(g.lives, 5);
  g.mli();
  assert.ok(g.health === 100 && g.ammo === 99 && g.keys[0] && g.keys[1] && g.weapons[3] && g.score === 0 && g.mliUsed);
  const order = (ep, floor, exitType) => { const x = game(ep, floor, 1); x.exitType = exitType; return x.nextFloor(); };
  assert.equal(order(0, 0, 1), 1);
  assert.equal(order(0, 0, 2), 9, 'secret elevator');
  assert.equal(order(0, 9, 1), 1, 'back from the secret floor');
  assert.equal(order(2, 9, 1), 7);
  assert.equal(order(0, 8, 1), -1, 'boss floor ends the episode');
  const s = game(0, 0, 1);
  s.kills = 5; s.time = 70 * 100;
  const st = s.levelStats();
  assert.equal(st.kills, Math.round(5 * 100 / s.level.totals.kills));
  assert.equal(st.time, 100);
  assert.equal(st.par, 90);
});

test('save and load restore the whole floor', () => {
  const g = game(0, 1, 2, 77);
  const bot = new W.Bot(g, {}); g.god = true;
  tics(g, 700, () => bot.input());
  const json = g.serialize();
  const h = W.Game.deserialize(json, W.Maps);
  assert.equal(h.serialize(), json, 'round trip');
  const inp = i => ({ fwd: i % 50 < 25 ? 1 : 0, turn: i % 90 < 10 ? 1 : 0, fire: i % 7 === 0 });
  tics(g, 300, inp); tics(h, 300, inp);
  assert.equal(h.serialize(), g.serialize(), 'both copies play out the same way');
});

test('the renderer draws every first floor and boss floor without holes', () => {
  const R = new W.Renderer();
  for (let e = 0; e < 6; e++) for (const f of [0, 8, 9]) {
    const g = game(e, f, 1);
    for (let k = 0; k < 4; k++) {
      g.angle = k * Math.PI / 2 + 0.3;
      R.fb.fill(0xff00ff00);
      R.drawBorder(); R.drawView(g); R.drawStatusBar(g, D.STR.ru);
      let holes = 0;
      for (const c of R.fb) if (c === 0xff00ff00) holes++;
      assert.equal(holes, 0, `E${e + 1}F${f + 1} view ${k}`);
    }
  }
  const g = game(0, 0, 1);
  const a = { type: 'guard', def: D.ENEMIES.guard, state: 'stand', x: 5, y: 5, dir: 0, anim: null };
  g.px = 7; g.py = 5;
  assert.equal(R.actorFrame(a, g), G.actorSprites('guard').s0, 'facing the player shows the front');
  g.px = 3; g.py = 5;
  assert.equal(R.actorFrame(a, g), G.actorSprites('guard').s4, 'from behind shows the back');
  R.setViewSize(4); assert.equal(R.vw, 64); R.setViewSize(25); assert.equal(R.vw, 320);
});

test('a bot finishes every floor and kills every boss', () => {
  W.Maps.forEach((ep, e) => ep.forEach((def, f) => {
    const g = game(e, f, 1, 11 + f);
    g.god = true;
    const bot = new W.Bot(g, { secret: false });
    let t = 0;
    while (t++ < 70 * 60 * 8 && ['play', 'exit', 'bosskill'].includes(g.mode)) {
      g.tic(bot.input());
      if (g.mode === 'bosskill') g.startDeathcam();
      while (g.mode === 'deathcam') g.tic({});
    }
    assert.ok(g.mode === 'exited' || g.mode === 'won', `E${e + 1}F${f + 1} ended in ${g.mode} at ${g.px.toFixed(1)},${g.py.toFixed(1)}`);
    if (f === 8) assert.ok(g.actors.some(a => a.def.boss && a.state === 'dead'), `E${e + 1} boss dead`);
  }));
});

test('texts follow the naming rules', () => {
  const all = files.concat(['wl-ui']).map(f => fs.readFileSync(path.join(dir, f + '.js'), 'utf8')).join('\n') + fs.readFileSync(path.join(__dirname, '../js/apps/wolf3d-app.js'), 'utf8');
  assert.ok(!/Microsoft|Windows/.test(all));
  for (const lang of ['ru', 'en']) for (const k of Object.keys(D.STR.ru)) assert.ok(D.STR[lang][k] !== undefined, `${lang}.${k}`);
});

console.log(`wolf3d: ${passed} tests passed`);
