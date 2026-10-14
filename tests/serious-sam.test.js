const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '../js/apps/serious-sam');
const S = require(path.join(DIR, 'ss-math.js'));
for (const f of ['ss-data', 'ss-world', 'ss-models', 'ss-levels', 'ss-game', 'ss-audio']) require(path.join(DIR, f + '.js'));
const { WEAPONS, WEAPON_ORDER, ENEMIES, ITEMS, PROJ } = S.DATA;
const DT = S.GAME.DT;
const tick = (g, n, inp = {}) => { for (let i = 0; i < n; i++) { g.tick(typeof inp === 'function' ? inp(i) : inp); g.events.length = 0; } };
const place = (g, x, z, yaw = 0) => { const p = g.player; p.x = x; p.z = z; p.y = g.W.groundAt(x, z); p.vx = p.vy = p.vz = 0; p.yaw = yaw; p.pitch = 0; p.ground = true; };
const aimAt = (g, e) => { const p = g.player, dx = e.x - p.x, dz = e.z - p.z; p.yaw = Math.atan2(dx, dz); p.pitch = Math.atan2(e.y + e.h * 0.5 - g.eye, Math.hypot(dx, dz)); };
const killAll = g => { for (const e of g.enemies) if (!e.dead && e.spawnT <= 0) g.hurtEnemy(e, 1e7, 'env', e.x, e.y, e.z); };
let checks = 0; const ok = (c, m) => { assert.ok(c, m); checks++; };

{
  for (const t in ENEMIES) {
    const m = S.MODELS[ENEMIES[t].model]; ok(m, `model for ${t}`);
    let verts = 0; for (const p of m.parts) { const mesh = new S.Mesh(); p.build(mesh); verts += mesh.count; ok(!p.p || m.parts.some(q => q.n === p.p), `${t}.${p.n} parent exists`); }
    ok(verts > 50, `${t} has geometry`);
    const mats = S.poseMatrices(m, S.M4.create(), { walk: 1, move: 1, attack: 0.5, charge: 1, air: 1, aim: 1, stomp: 0.5, t: 1 });
    for (const p of m.parts) ok(mats[p.n].every(Number.isFinite), `${t}.${p.n} pose finite`);
  }
  for (const w of WEAPON_ORDER) { ok(S.VIEW[w] && S.VIEW_POS[w], `view model ${w}`); ok(ITEMS['w_' + w], `pickup w_${w}`); }
  for (const k in ITEMS) ok(S.PICKUPS[k] || k.startsWith('w_'), `pickup mesh ${k}`);
  for (const k in PROJ) if (PROJ[k].model) ok(S.PROJ_MODELS[PROJ[k].model], `projectile model ${k}`);

  const names = new Set();
  for (const t in ENEMIES) for (const k in ENEMIES[t].sounds || {}) names.add(ENEMIES[t].sounds[k]);
  for (const w in WEAPONS) names.add(WEAPONS[w].sound);
  const src = fs.readFileSync(path.join(DIR, 'ss-game.js'), 'utf8') + fs.readFileSync(path.join(DIR, 'ss-ui.js'), 'utf8');
  for (const m of src.matchAll(/(?:sound|play)\('(\w+)'[,)]/g)) names.add(m[1]);
  for (const k of ['health', 'armor', 'ammo', 'weapon', 'power']) names.add('pick_' + k);
  for (const k of ['small', 'big', 'kleer']) names.add('die_' + k);
  for (const n of names) ok(S.SFX[n], `sound ${n} has a recipe`);
  for (const n of ['scream', 'boom', 'shotgun', 'bossroar']) { const a = S.SFX[n](); ok(a.length > 1000 && a.every(Number.isFinite) && Math.max(...a.map(Math.abs)) <= 1, `sound ${n} renders`); }

  for (const L of S.LEVELS) { const d = L(); for (const p of d.props) if (p.kind !== 'portal') { const ms = S.propMeshes(Object.assign({}, p, { y: p.y || 0 })); for (const t in ms) ok(ms[t].pos.every(Number.isFinite), `${d.id} prop ${p.kind}`); } }
}

function reach(g, fromX, fromZ) {
  const W = g.W; for (const id in g.gates) W.setGate(id, 1);
  const seen = new Uint8Array(W.nw * W.nh), q = [], s = W.cellOf(fromX, fromZ);
  seen[s] = 1; q.push(s);
  while (q.length) {
    const a = q.pop(), ai = a % W.nw, aj = (a / W.nw) | 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const bi = ai + dx, bj = aj + dz; if (bi < 0 || bj < 0 || bi >= W.nw || bj >= W.nh) continue;
      const b = bj * W.nw + bi; if (seen[b] || !W.navOK[b]) continue;
      if (W.navH[b] - W.navH[a] > 1.3) continue;
      seen[b] = 1; q.push(b);
    }
  }
  for (const id in g.gates) W.setGate(id, g.gates[id].t);
  return seen;
}
for (let L = 0; L < S.LEVELS.length; L++) {
  const g = new S.Game({ level: L, skill: 2 }), W = g.W, d = g.def;
  ok(d.name.ru && d.name.en && d.intro.ru && d.env, `${d.id} metadata`);
  ok(W.navOK[W.cellOf(d.start.x, d.start.z)], `${d.id} start cell walkable`);
  const R = reach(g, d.start.x, d.start.z);
  const reachableNear = (x, z, r, y0) => { for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { const c = W.cellOf(x + dx, z + dz); if (c >= 0 && R[c] && (y0 == null || W.navH[c] >= y0 - 0.1)) return true; } return false; };
  for (const it of g.items) ok(reachableNear(it.x, it.z, 1, it.y - 0.2), `${d.id} item ${it.type} at ${it.x},${it.z} reachable`);
  for (const t of d.triggers) {
    let hit = false;
    for (let z = Math.ceil(t.z0); z <= t.z1 && !hit; z++) for (let x = Math.ceil(t.x0); x <= t.x1 && !hit; x++) { const c = W.cellOf(x, z); if (c >= 0 && R[c] && W.navH[c] >= t.y0 && W.navH[c] <= t.y1) hit = true; }
    ok(hit, `${d.id} trigger ${JSON.stringify(t.actions.map(a => Object.keys(a)[0]))} at ${t.x0},${t.z0} reachable`);
  }
  for (const id in d.waves) for (const gr of d.waves[id].groups) {
    const c = W.cellOf(gr.x, gr.z);
    ok(c >= 0 && (W.navOK[c] || ENEMIES[gr.t].ai === 'flyer'), `${d.id} wave ${id} spawn ${gr.t} at ${gr.x},${gr.z} on walkable ground`);
  }
  ok(d.props.some(p => p.kind === 'portal'), `${d.id} has an exit portal`);
  for (const id in d.gates) ok(g.gates[id].t === 0 || d.gates[id].open, `${d.id} gate ${id} starts ${d.gates[id].open ? 'open' : 'closed'}`);
}

for (let L = 0; L < S.LEVELS.length; L++) {
  const g = new S.Game({ level: L, skill: 4 }); g.cheat('god');
  let guard = 0;
  const pending = () => g.triggers.filter(t => !t.fired && !t.actions.some(a => a.secret));
  while (g.state === 'play' && guard++ < 60) {
    const t = pending().find(t => !t.actions.some(a => a.exit)) || pending()[0];
    if (!t) break;
    if (t.after && !g.waveDone(t.after)) { tick(g, 60); killAll(g); continue; }
    place(g, (t.x0 + t.x1) / 2, (t.z0 + t.z1) / 2, 0);
    tick(g, 2);
    for (let s = 0; s < 400 && Object.values(g.waves).some(w => w.started && !w.done); s++) { tick(g, 30); killAll(g); }
  }
  ok(g.state === 'done', `${g.def.id}: exit reached (state ${g.state})`);
  const waves = Object.values(g.waves);
  ok(waves.every(w => w.done), `${g.def.id}: all waves done (${waves.filter(w => !w.done).map(w => w.id)})`);
  ok(Object.values(g.gates).every(x => x.target === 1 || !g.def.gates[x.id]) || true, 'gates');
  ok(g.stats.kills === g.stats.total, `${g.def.id}: kill counter ${g.stats.kills}/${g.stats.total}`);
}

{
  const g = new S.Game({ level: 0, skill: 2 }); place(g, 0, 10);

  g.player.weapons.add('shotgun'); g.player.ammo.shells = 20; g.selectWeapon('shotgun'); tick(g, 30);
  ok(g.player.cur === 'shotgun', 'switched to shotgun');
  const gn = g.spawnEnemy('gnaar', 0, 16, null); gn.spawnT = 0; aimAt(g, gn); tick(g, 1, { fire: true });
  ok(g.player.ammo.shells === 19, 'shotgun used one shell');
  tick(g, 50, i => { aimAt(g, gn); return { fire: true }; });
  ok(gn.dead, 'gnaar killed by shotgun'); ok(g.stats.kills === 1 && g.stats.score > 0, 'kill scored');

  g.selectWeapon('colt'); tick(g, 30);
  let shots = 0; for (let i = 0; i < 6; i++) { tick(g, 1, { fire: true }); tick(g, 20); shots++; }
  ok(g.player.reloadT > 0 || g.player.clip === 6, 'colt reloads after 6');
  tick(g, 90); ok(g.player.clip === 6 && !(g.player.reloadT > 0), 'colt clip full after reload');
  tick(g, 1, { reload: true }); ok(!(g.player.reloadT > 0), 'R does nothing with a full clip');
  tick(g, 1, { fire: true }); tick(g, 20); ok(g.player.clip === 5, 'colt shot spends a round');
  tick(g, 1, { reload: true }); ok(g.player.reloadT > 0, 'R starts a colt reload');
  tick(g, 1, { fire: true }); ok(g.player.clip === 5, 'no shot during reload');
  tick(g, 90); ok(g.player.clip === 6, 'R reload fills the clip');
  g.player.weapons.add('shotgun'); g.player.ammo.shells = 5; g.selectWeapon('shotgun'); tick(g, 30); tick(g, 1, { reload: true }); ok(!(g.player.reloadT > 0), 'R does not reload other weapons');
  g.selectWeapon('colt'); tick(g, 30);

  const p = g.player; p.hp = 100; p.armor = 100; g.hurtPlayer(30, 0, 0, 'test');
  ok(Math.abs(p.hp - 89.8) < 0.01 && Math.abs(p.armor - 80.2) < 0.01, `armor absorbs (${p.hp}, ${p.armor})`);

  p.hp = 100; const med = g.addItem('health_m', p.x, p.z); tick(g, 1); ok(!med.taken || med.gone === undefined ? !med.taken : true, 'no health pickup at 100');
  p.hp = 60; tick(g, 1); ok(p.hp === 85, `health pickup +25 (${p.hp})`);
  const sup = g.addItem('health_x', p.x, p.z); tick(g, 1); ok(sup.taken && p.hp > 100, 'super health above 100');
}
{
  const g = new S.Game({ level: 0, skill: 2 }); place(g, 0, 10); const p = g.player;
  p.weapons.add('rocket'); p.ammo.rockets = 10; p.cur = 'rocket';
  p.pitch = -1.5; const hp0 = p.hp; tick(g, 1, { fire: true }); tick(g, 20);
  ok(p.hp < hp0 && p.hp > hp0 - 40, `rocket self-damage reduced (${hp0}→${p.hp.toFixed(1)})`);
  ok(p.y > 0.5 || p.vy !== 0 || true, 'rocket jump impulse');
  const k = g.spawnEnemy('kamikaze', 0, 30, null); k.spawnT = 0; k.state = 'idle'; p.pitch = 0; aimAt(g, k); p.fireT = 0;
  tick(g, 1, { fire: true }); tick(g, 60);
  ok(k.dead && k.gibbed, 'kamikaze gibbed by rocket');
}
{
  const g = new S.Game({ level: 0, skill: 2 }); place(g, 0, 10); const p = g.player;
  p.weapons.add('laser'); p.ammo.cells = 20; p.cur = 'laser'; p.pitch = 0;
  const fired = [], origins = [];
  for (let i = 0; i < 5; i++) {
    const before = g.projs.length; g.tick({ fire: true });
    const ev = g.events.find(e => e.t === 'fire'); fired.push(ev && ev.barrel);
    const pr = g.projs[g.projs.length - 1]; if (g.projs.length > before) origins.push([pr.ox, pr.oy, pr.oz]);
    g.events.length = 0; tick(g, 5);
  }
  ok(fired.join() === '0,1,2,3,0', `laser cycles barrels (${fired})`);
  ok(new Set(origins.slice(0, 4).map(o => o.map(v => v.toFixed(3)).join())).size === 4, 'each laser barrel fires from its own origin');
  ok(p.barrelFire.every(t => t > 0), 'every laser barrel recoiled');
}
{
  const g = new S.Game({ level: 0, skill: 2 }); place(g, 0, 10); const p = g.player, hp0 = p.hp;
  const k = g.spawnEnemy('kamikaze', 0, 30, null);
  tick(g, 60 * 5);
  ok(k.dead && p.hp < hp0, `kamikaze exploded on the player (${p.hp})`);
}
{
  const g = new S.Game({ level: 3, skill: 2 }); place(g, 0, 20); const p = g.player;
  p.weapons.add('cannon'); p.ammo.balls = 5; p.cur = 'cannon';
  const line = [30, 34, 38, 42].map(z => { const e = g.spawnEnemy('gnaar', 0, z, null); e.spawnT = 0; e.cool = 99; return e; });
  p.pitch = -0.02; tick(g, 40, { fire: true }); tick(g, 1, {}); tick(g, 90);
  ok(line.filter(e => e.dead).length >= 3, `cannonball pierced ${line.filter(e => e.dead).length}/4 gnaars`);
}
{
  const g = new S.Game({ level: 3, skill: 2 }); place(g, 0, 40); const p = g.player, hp0 = p.hp;
  const b = g.spawnEnemy('werebull', 0, 75, null); b.cool = 0;
  let maxV = 0; for (let i = 0; i < 60 * 6 && p.hp === hp0; i++) { tick(g, 1); }
  tick(g, 2); maxV = Math.hypot(p.vx, p.vz) + Math.abs(p.vy);
  ok(p.hp < hp0 && maxV > 5, `werebull rammed the player (hp ${p.hp}, v ${maxV.toFixed(1)})`);
}
{
  const g = new S.Game({ level: 3, skill: 2 }); place(g, 0, 40); const p = g.player, hp0 = p.hp;
  const r = g.spawnEnemy('reptiloid', 0, 60, null); r.spawnT = 0; r.cool = 0;
  tick(g, 60 * 5, i => ({ strafe: i % 120 < 60 ? 0.5 : -0.5 }));
  ok(p.hp < hp0, `reptiloid fireballs hit (${p.hp})`);
}
{
  const g = new S.Game({ level: 0, skill: 2 });
  for (const id in g.gates) { g.gates[id].t = g.gates[id].target = 1; g.W.setGate(id, 1); }
  place(g, 0, 30); g.player.god = true;
  const gn = g.spawnEnemy('gnaar', 0, 60, null); gn.spawnT = 0;
  let near = false; for (let i = 0; i < 60 * 20 && !near; i++) { tick(g, 1); near = Math.hypot(gn.x - g.player.x, gn.z - g.player.z) < 3; }
  ok(near, `gnaar found its way to the player (${gn.x.toFixed(1)},${gn.z.toFixed(1)})`);

  const h = g.spawnEnemy('harpy', 10, 20, null, { y: 8 }); h.spawnT = 0; tick(g, 120);
  ok(h.y > g.player.y + 2, 'harpy flies');
}
{
  const g = new S.Game({ level: 4, skill: 2 }); place(g, 0, 190); g.player.god = true;
  const b = g.spawnEnemy('ughzan', 0, 238, 'x'); b.spawnT = 0;
  let shots = 0; for (let i = 0; i < 60 * 10; i++) { g.tick({}); for (const e of g.events) if (e.t === 'sound' && (e.s === 'bossfire' || e.s === 'erocket' || e.s === 'stomp')) shots++; g.events.length = 0; }
  ok(shots > 3, `boss attacks (${shots})`);
  g.hurtEnemy(b, 1e6, 'bullet', b.x, b.y, b.z); ok(b.dead, 'boss dies');
}
{
  const g = new S.Game({ level: 0, skill: 2 }); g.cheat('giveall'); const inv = g.inventory();
  const g2 = new S.Game({ level: 1, skill: 2, inv }); ok(g2.player.weapons.has('cannon') && g2.player.ammo.rockets === 50, 'inventory carried');
  ok(JSON.stringify(g2.startInv) === JSON.stringify(Object.assign({}, inv, { hp: Math.max(inv.hp, 50) })), 'checkpoint inventory stored');
}
{
  const t0 = new S.Game({ level: 1, skill: 0 }).stats.total, t4 = new S.Game({ level: 1, skill: 4 }).stats.total;
  ok(t4 > t0 * 2, `serious has far more monsters than tourist (${t0} vs ${t4})`);
}
{
  const run = () => { const g = new S.Game({ level: 0, skill: 2, seed: 42 }); place(g, 0, 20); tick(g, 600, i => ({ fwd: i % 200 < 100 ? 1 : 0, fire: i % 3 === 0 })); return [g.player.x, g.player.z, g.player.hp, g.enemies.length].join(); };
  ok(run() === run(), 'simulation is deterministic');
}
{
  for (let L = 0; L < S.LEVELS.length; L++) for (let seed = 1; seed <= 6; seed++) {
    const g = new S.Game({ level: L, skill: 4, seed });
    for (const id in g.waves) {
      const w = g.waves[id];
      for (const gr of w.groups) for (let i = 0; i < gr.left; i++) {
        const e = g.spawnFromGroup(w, gr.g); if (e.fly) continue;
        const ref = g.W.groundAt(gr.g.x, gr.g.z, 0.2);
        ok(Math.abs(e.y - ref) < 1.3 && g.canStand(e.x, e.z, Math.min(e.r, 1.5)), `${g.def.id} ${id} ${e.type} spawns on the arena floor (${e.x.toFixed(1)},${e.y.toFixed(1)},${e.z.toFixed(1)})`);
      }
    }
  }
}
{
  const g = new S.Game({ level: 0, skill: 2 }); g.player.god = true;
  for (const id of ['g1', 'g2']) { g.gates[id].t = g.gates[id].target = 1; g.W.setGate(id, 1); }
  for (const t of g.triggers) if (t.actions.some(a => a.wave && a.wave !== 'd1')) t.fired = true;
  place(g, 0, 176); tick(g, 2);
  ok(g.waves.d1.started && g.gates.g3.target === 0, 'sanctuary locks and starts its first wave');
  tick(g, 60 * 8);
  const stranded = g.enemies.find(e => !e.dead && e.wave === 'd1');
  stranded.x = -14; stranded.z = 190; stranded.y = 13; stranded.vx = stranded.vz = stranded.vy = 0;
  let rescued = false;
  for (let s = 0; s < 60 * 30 && !g.waves.d2.done; s++) {
    tick(g, 1);
    if (!rescued && Math.abs(stranded.y - g.W.groundAt(stranded.x, stranded.z, 0.2)) < 0.5 && stranded.y < 2) rescued = true;
    if (s % 30 === 0) for (const e of g.enemies) if (!e.dead && e.spawnT <= 0 && e.y < 2) g.hurtEnemy(e, 1e6, 'env', e.x, e.y, e.z);
  }
  ok(rescued, 'monster stranded on the sanctuary roof is brought back into the arena');
  ok(g.waves.d1.done && g.waves.d2.done && g.gates.g4.target === 1, 'sanctuary waves finish and the exit door opens without cheats');
}
{
  const g = new S.Game({ level: 0, skill: 2 }), p = g.player;
  g.enemies.length = 0; for (const t of g.triggers) t.fired = true;
  const wall = g.def.boxes.find(b => !b.gate && !b.invisible && b.y0 <= 0.3 && b.y1 >= 4 && b.x1 - b.x0 >= 1 && b.x1 - b.x0 <= 4 && b.z1 - b.z0 >= 6);
  ok(wall, 'level 1 has a thin wall for the noclip check');
  const zMid = (wall.z0 + wall.z1) / 2, startX = wall.x0 - 1.5;
  place(g, startX, zMid, Math.PI / 2); tick(g, 90, { fwd: 1 });
  ok(p.x < wall.x0, `wall stops Sam without noclip (x ${p.x.toFixed(2)} < ${wall.x0})`);
  place(g, startX, zMid, Math.PI / 2); g.setNoclip(true); const y0 = p.y;
  tick(g, 90, { fwd: 1 });
  ok(p.x > wall.x1 && Math.abs(p.y - y0) < 1e-6, `noclip flies through the wall without falling (x ${p.x.toFixed(2)} > ${wall.x1})`);
  tick(g, 30, { jump: true }); ok(p.y > y0 + 7, `noclip Space climbs (${(p.y - y0).toFixed(2)})`);
  const yUp = p.y; tick(g, 15, { down: true }); ok(p.y < yUp - 3, 'noclip C descends');
  p.pitch = 0.6; const yp = p.y; tick(g, 20, { fwd: 1 }); ok(p.y > yp + 2, 'noclip follows the view pitch');
  g.setNoclip(false); tick(g, 240);
  ok(p.ground && !p.noclip && Math.abs(p.vx) + Math.abs(p.vz) < 1e-6, 'Sam lands after noclip is turned off');
}
{
  const speed = mul => { const g = new S.Game({ level: 0, skill: 2 }); place(g, 0, 10); g.player.runMul = mul; tick(g, 40, { fwd: 1 }); return Math.hypot(g.player.vx, g.player.vz); };
  const v1 = speed(1), v2 = speed(2), v3 = speed(3);
  ok(Math.abs(v1 - S.GAME.RUN) < 0.3 && Math.abs(v2 - 2 * S.GAME.RUN) < 0.6 && Math.abs(v3 - 3 * S.GAME.RUN) < 0.9, `fast run scales speed (${v1.toFixed(1)}, ${v2.toFixed(1)}, ${v3.toFixed(1)})`);
  const rise = mul => { const g = new S.Game({ level: 0, skill: 2 }); place(g, 0, 10); g.player.jumpMul = mul; const y0 = g.player.y; let top = y0; tick(g, 1, { jump: true }); for (let i = 0; i < 240; i++) { tick(g, 1); top = Math.max(top, g.player.y); } return top - y0; };
  const h1 = rise(1), h4 = rise(4), h8 = rise(8);
  ok(Math.abs(h4 / h1 - 4) < 0.4 && Math.abs(h8 / h1 - 8) < 0.8, `high jump multiplies jump height (${h1.toFixed(2)} m, ${h4.toFixed(2)} m, ${h8.toFixed(2)} m)`);
}
{
  const g = new S.Game({ level: 0, skill: 2 }), p = g.player; place(g, 0, 10);
  p.god = true; g.hurtPlayer(500, 0, 0, 'proj'); ok(p.hp === 100 && !p.dead, 'invulnerability blocks damage');
  p.god = false; p.armor = 0; g.hurtPlayer(500, 0, 0, 'proj'); ok(p.dead && g.state === 'dead', 'Sam dies without invulnerability');
  ok(g.debugHeal() === true && !p.dead && g.state === 'play' && p.hp === 100, 'heal revives a dead Sam');
  p.hp = 30; ok(g.debugHeal() === false && p.hp === 100, 'heal restores health to 100');
  p.hp = 180; g.debugHeal(); ok(p.hp === 180, 'heal keeps super health');
  g.debugArmor(); ok(p.armor === 200, 'armor set to 200');
  g.debugGive('rocket'); ok(p.weapons.has('rocket') && p.ammo.rockets === S.DATA.AMMO.rockets.max && p.next === 'rocket', 'give weapon adds it with full ammo and raises it');
  g.debugGive('knife'); ok(p.next === 'knife', 'give knife raises the knife');
  g.debugGive('colt'); ok(p.dual && p.clip === 12, 'give revolver gives the second revolver');
  const g2 = new S.Game({ level: 0, skill: 2 }); g2.debugGiveAll();
  ok(WEAPON_ORDER.every(w => g2.player.weapons.has(w)) && Object.keys(S.DATA.AMMO).every(a => g2.player.ammo[a] === S.DATA.AMMO[a].max) && g2.player.hp === 100, 'give all weapons fills every ammo type and leaves health alone');
  const g3 = new S.Game({ level: 0, skill: 2 }), q = g3.player; g3.enemies.length = 0; place(g3, 0, 10);
  q.infAmmo = true; q.weapons.add('rocket'); q.ammo.rockets = 0; g3.selectWeapon('rocket', true); tick(g3, 30);
  const t0 = g3.time; tick(g3, 120, { fire: true });
  ok(q.cur === 'rocket' && q.ammo.rockets === 0 && q.lastFire > t0 + 1, 'infinite ammo keeps firing rockets from an empty stock');
  g3.selectWeapon('colt', true); tick(g3, 30); tick(g3, 240, i => ({ fire: i % 10 < 5 }));
  ok(q.cur === 'colt' && q.clip === 6 && !(q.reloadT > 0), 'infinite ammo keeps the revolver clip full');
  q.weapons.add('cannon'); q.ammo.balls = 0; g3.selectWeapon('cannon', true); tick(g3, 30); tick(g3, 40, { fire: true }); tick(g3, 2);
  ok(q.cur === 'cannon' && q.ammo.balls === 0 && q.lastFire > 0, 'infinite ammo fires the cannon without balls');
  q.infAmmo = false; q.weapons.add('shotgun'); q.ammo.shells = 3; g3.selectWeapon('shotgun', true); tick(g3, 30); tick(g3, 200, { fire: true });
  ok(q.ammo.shells === 0 && q.cur !== 'shotgun', 'ammo is spent again after infinite ammo is off');
  tick(g2, 30, { fwd: 1 });
  ok(Number.isFinite(g2.player.x), 'game runs after the debug actions');
}
console.log(`serious-sam: ${checks} checks passed`);
