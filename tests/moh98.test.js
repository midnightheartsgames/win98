const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '../js/apps/moh98');
const S = require(path.join(DIR, 'mh-math.js'));
for (const f of ['mh-data', 'mh-world', 'mh-models', 'mh-levels', 'mh-game', 'mh-ai', 'mh-audio']) require(path.join(DIR, f + '.js'));
const D = S.DATA;
let checks = 0; const ok = (c, m) => { assert.ok(c, m); checks++; };
const tick = (g, n, inp = {}) => { for (let i = 0; i < n; i++) { g.tick(typeof inp === 'function' ? inp(i) : inp); g.events.length = 0; } };
const place = (g, x, z, y = null) => { const p = g.player; p.x = x; p.z = z; p.y = y != null ? y : g.W.groundAt(x, z, 0.3); p.vx = p.vy = p.vz = 0; p.pitch = 0; p.ground = true; };
const kill = a => { if (!a.dead) S.damageActor(a.g || G, a, 1e6, 'bullet', 'player', null, 0, 'torso'); };
let G = null;
const newGame = (mi, o = {}) => { G = new S.Game(Object.assign({ mission: mi, skill: 1, seed: 99 }, o)); G.god = true; G.events.length = 0; return G; };
const obj = (g, id) => g.objectives.find(o => o.id === id);
const pickupAt = (g, id) => { const it = g.pickups.find(i => i.id === id); ok(it, `pickup ${id} exists`); place(g, it.x, it.z, it.y); tick(g, 3); ok(g.items[id], `picked up ${id}`); };
const plantAll = (g, target) => {
  for (const pl of g.plants.filter(q => q.target === target)) {
    place(g, pl.x, pl.z, pl.y + 0.05); tick(g, 2); ok(g.focus && g.focus.kind === 'plant', `focus on plant ${pl.id}`);
    tick(g, 1, { use: true }); tick(g, 130); ok(pl.planted, `planted ${pl.id}`);
  }
  place(g, g.def.spawns.start.x, g.def.spawns.start.z); tick(g, 60 * 11);
  ok(g.targetById(target).dead, `${target} destroyed`);
};
const reach = (g, zoneId, escort = []) => {
  const z = g.zone(zoneId), x = (z.x0 + z.x1) / 2, zz = (z.z0 + z.z1) / 2;
  for (const id of escort) { const a = g.actorById(id); a.x = x + 1; a.z = zz + 1; a.y = g.W.groundAt(a.x, a.z, 0.3); }
  place(g, x, zz); tick(g, 3);
};

{
  for (const look in S.LOOKS) {
    const m = S.humanModel(look); let verts = 0;
    for (const p of m.parts) { const mesh = new S.Mesh(); p.build(mesh); verts += mesh.count; ok(!p.p || m.parts.some(q => q.n === p.p), `${look}.${p.n} parent`); }
    ok(verts > 100, `look ${look} has geometry`);
    for (const a of [{ walk: 1, move: 1, hold: 'rifle', aim: 1 }, { hold: 'heavy' }, { surrender: 1 }, { throwing: 1, hold: 'rifle' }, { crouch: 1, hold: 'pistol', aim: 1 }, { sit: 1 }, { behind: true, hold: 'none' }, { papers: true }]) { const mats = S.poseMatrices(m, S.M4.create(), Object.assign({ t: 1 }, a)); for (const p of m.parts) ok(mats[p.n].every(Number.isFinite), `${look} pose finite`); }
  }
  for (const k of ['dog', 'tank']) { const m = S.MODELS[k]; let v = 0; for (const p of m.parts) { const mesh = new S.Mesh(); p.build(mesh); v += mesh.count; } ok(v > 50, `${k} geometry`); const mats = S.poseMatrices(m, S.M4.create(), { walk: 1, move: 1, turret: 1, elev: 0.1, attack: 1, t: 2 }); for (const p of m.parts) ok(mats[p.n].every(Number.isFinite), `${k} pose finite`); }
  for (const id in D.WEAPONS) { if (D.WEAPONS[id].npcOnly) continue; ok(S.GUNS[id] && S.VIEW_POS[id], `view setup ${id}`); ok(S.viewModel(id, 0x404040).count > 20, `view mesh ${id}`); }
  for (const id in D.PICKUPS) ok(S.pickupMesh(id).count > 0, `pickup mesh ${id}`);
  for (const k in S.TARGET_R) ok(S.targetMesh(k).count > 20 && S.targetMesh(k).pos.every(Number.isFinite), `target mesh ${k}`);
  const texSrc = fs.readFileSync(path.join(DIR, 'mh-tex.js'), 'utf8'), texNames = new Set([...texSrc.matchAll(/^    (\w+)\(c, x\)/gm)].map(m => m[1]));
  ok(texNames.size > 30, 'texture makers parsed');
  for (const id in S.LEVELS) {
    const def = S.LEVELS[id]();
    for (const b of def.boxes) if (b.render) { ok(texNames.has(b.tex) || b.glass, `${id}: texture ${b.tex}`); ok(texNames.has(b.top) || b.glass, `${id}: top texture ${b.top}`); }
    for (const d of def.doors) ok(texNames.has(d.tex), `${id}: door texture ${d.tex}`);
    for (const p of def.props) { const ms = S.propMeshes(p); ok(Object.keys(ms).length > 0, `${id}: prop ${p.kind}`); for (const t in ms) { ok(texNames.has(t), `${id}: prop texture ${t}`); ok(ms[t].pos.every(Number.isFinite), `${id}: prop ${p.kind} finite`); } ok(!ms.stone || ms.stone.col.some(c => c !== 1) || p.kind !== 'unknown', `${id}: prop kind ${p.kind} known`); }
    const out = {}; for (const t of def.trees.slice(0, 80)) S.treeMeshes(t, out); for (const k in out) ok(texNames.has(k), `${id}: tree texture ${k}`);
    for (const n of def.npcs) ok(D.HUMANS[n.tpl], `${id}: npc template ${n.tpl}`);
    for (const p of def.pickups) ok(D.PICKUPS[p.id] || D.WEAPONS[p.id], `${id}: pickup ${p.id}`);
    for (const n of def.npcs) if (n.path) ok(def.paths[n.path], `${id}: path ${n.path}`);
    for (const t of def.targets) ok(S.TARGET_R[t.kind], `${id}: target kind ${t.kind}`);
  }
  const unknown = []; for (const id in S.LEVELS) for (const p of S.LEVELS[id]().props) { const ms = S.propMeshes(p); if (ms.stone && ms.stone.count === 24 && ms.stone.col[0] === 1 && ms.stone.col[1] === 0) unknown.push(p.kind); }
  ok(unknown.length === 0, `no magenta placeholder props: ${unknown.join(',')}`);
  const names = new Set();
  for (const id in D.WEAPONS) if (D.WEAPONS[id].sound) names.add(D.WEAPONS[id].sound);
  const src = ['mh-game', 'mh-ai', 'mh-ui'].map(f => fs.readFileSync(path.join(DIR, f + '.js'), 'utf8')).join('\n');
  for (const m of src.matchAll(/s: '(\w+)'(?!\s*\+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/(?:A|audio)\.play\('(\w+)'(?!\s*\+)/g)) names.add(m[1]);
  for (const s of ['grass', 'dirt', 'hard', 'snow']) names.add('step_' + s);
  for (const v of [0, 1, 2]) names.add('bark_' + v);
  for (const k of ['reload_pistol', 'reload_rifle', 'reload_heavy']) names.add(k);
  for (const n of names) ok(S.SFX[n], `sound "${n}" has a recipe`);
  for (const k of ['ping', 'siren', 'bark_0', 'explosion', 'dog_bark']) { const a = S.SFX[k](); ok(a.length > 100 && a.every(Number.isFinite), `sound ${k} renders`); }
  for (const k in D.STR.en) ok(D.STR.ru[k] != null, `ru string ${k}`);
  for (const m of S.MISSIONS) { ok(S.LEVELS[m.level], `level for ${m.id}`); ok(m.brief.length >= 3 && m.objectives.some(o => o.type === 'reach'), `${m.id} brief and exit`); for (const w of m.kit.weapons) ok(D.WEAPONS[w], `${m.id} kit weapon ${w}`); }
}

{
  for (let mi = 0; mi < S.MISSIONS.length; mi++) {
    const g = newGame(mi), W = g.W, p = g.player, sp = g.def.spawns.start;
    for (const d of g.doors) if (d.locked && d.locked !== 'never') g.unlockDoor(d, true);
    const at = (x, z) => W.reachable(sp.x, sp.z, x, z);
    for (const o of g.objectives) if (o.type === 'reach') { const z = g.zone(o.zone); ok(at((z.x0 + z.x1) / 2, (z.z0 + z.z1) / 2), `${g.mission.id}: zone ${o.zone} reachable`); }
    for (const pl of g.plants) ok(at(pl.x, pl.z), `${g.mission.id}: plant ${pl.id} reachable`);
    for (const it of g.pickups) if (D.PICKUPS[it.id] && D.PICKUPS[it.id].quest) ok(at(it.x, it.z), `${g.mission.id}: ${it.id} reachable`);
    for (const a of g.actors) if (a.id) ok(at(a.x, a.z), `${g.mission.id}: actor ${a.id} reachable`);
    for (const a of g.actors) ok(Number.isFinite(a.y) && a.y > -20, `${g.mission.id}: actor ${a.tpl || a.kind} placed on ground`);
    let bad = 0; for (const a of g.actors) if (!a.hidden && a.kind === 'human' && !W.walkableAt(a.x, a.z) && a.beh !== 'sniper' && a.beh !== 'mg') bad++;
    ok(bad <= 2, `${g.mission.id}: actors stand on walkable cells (${bad})`);
    ok(!g.alarm && p.hp === 100, `${g.mission.id}: quiet start`);
    tick(g, 300);
    ok(!p.dead, `${g.mission.id}: survives first seconds`);
  }
}

{
  const g = newGame(0, { god: false }); g.god = false;
  const p = g.player, e = g.actors.find(a => a.tpl === 'rifleman' && a.helmet && !a.hidden);
  place(g, e.x, e.z - 6); p.yaw = 0; const eye = g.eye; p.pitch = Math.atan2(e.y + 1.67 - eye, 6);
  const f = g.forward(); g.bullet('player', p.x, eye, p.z, f, 30, false);
  ok(!e.helmet, 'headshot knocks the helmet off');
  ok(!e.dead && e.hp < e.maxHp, 'helmet saves from a light headshot');
  g.bullet('player', p.x, eye, p.z, f, 30, false);
  ok(e.dead && g.stats.headshots === 1, 'second headshot kills and counts');
  ok(g.stats.hits === 2 && g.stats.kills === 1, 'hits and kills counted');
  const shots0 = g.stats.shots; g.select('colt'); tick(g, 40); ok(g.cur === 'colt', 'weapon switch'); tick(g, 1, { fire: true }); ok(g.stats.shots === shots0 + 1 && g.mag.colt === 6, 'colt fires and uses a round');
  tick(g, 30); g.mag.colt = 0; tick(g, 1, { reload: true }); tick(g, 120); ok(g.mag.colt === 7, 'reload refills the magazine');
  const nades = g.ammo.grenade; tick(g, 1, { nade: true }); ok(g.ammo.grenade === nades - 1 && g.projs.length === 1, 'quick grenade throw'); tick(g, 60 * 4); ok(g.projs.length === 0, 'grenade exploded');
}

{
  const g = newGame(0);
  const k = g.actorById('kommandant'); kill(k); tick(g, 2);
  ok(g.pickups.some(i => i.id === 'key'), 'commandant drops the key');
  pickupAt(g, 'key'); ok(obj(g, 'key').state === 'done', 'M1 key objective');
  const cell = g.doorById('cellB'); ok(cell && cell.locked === 'key', 'agent cell is locked');
  const cx = (cell.a + cell.b) / 2; place(g, cell.c + 0.9, cx, g.actorById('agent').y); tick(g, 3); ok(!cell.locked, 'key unlocks the cell');
  tick(g, 60); ok(cell.open > 0.9, 'cell door opens');
  const ag = g.actorById('agent'); place(g, ag.x + 1.1, ag.z, ag.y); g.player.yaw = -Math.PI / 2; g.player.pitch = -0.2; tick(g, 2);
  ok(g.focus && g.focus.kind === 'free', 'focus on the agent'); tick(g, 1, { use: true }); tick(g, 2);
  ok(ag.freed && obj(g, 'agent').state === 'done', 'agent freed');
  place(g, -20, 10); tick(g, 60 * 6); ok(Math.hypot(ag.x - g.player.x, ag.z - g.player.z) < 8, 'agent follows the player out of the town hall');
  const radio = g.targetById('radio1'); g.damageTarget(radio, 100, true); tick(g, 2); ok(radio.dead && obj(g, 'radio').state === 'done', 'radio destroyed by gunfire');
  reach(g, 'truck', ['agent']);
  ok(g.done && obj(g, 'truck').state === 'done', 'M1 complete');
  const r = S.rateMission(g.stats, g.skill, g.objectives); ok(r.medals.includes('bronze') && r.rating >= 0 && r.rating <= 100, 'M1 rating and medal');
}

{
  const g = newGame(0);
  const ag = g.actorById('agent'); ag.freed = true; ag.beh = 'follow'; S.damageActor(g, ag, 1e6, 'bullet', { x: 0, z: 0 }, null, 0, 'torso'); tick(g, 3);
  ok(g.failed, 'M1 fails when the agent dies');
}

{
  const g = newGame(1);
  pickupAt(g, 'codebook'); ok(obj(g, 'codebook').state === 'done', 'M2 codebook');
  ok(g.charges === 2, 'M2 starts with two charges');
  plantAll(g, 'uboat'); ok(obj(g, 'sub').state === 'done', 'M2 sub destroyed');
  reach(g, 'boat'); ok(g.done, 'M2 complete');
}

{
  const g = newGame(2);
  ok(g.disguised && g.cur === 'papers', 'M3 starts undercover with papers out');
  const insp = g.actors.find(a => a.beh === 'inspector' && !a.hidden);
  place(g, insp.x, insp.z - 6); g.player.yaw = Math.atan2(insp.x - g.player.x, insp.z - g.player.z);
  tick(g, 60 * 6);
  ok(insp.ai.state === 'inspect' && insp.ai.asked, 'officer asks for papers');
  tick(g, 1, { use: true }); tick(g, 2);
  ok(insp.cleared && insp.ai.state === 'idle' && !g.alarm, 'papers accepted');
  plantAll(g, 'cells'); ok(obj(g, 'cells').state === 'done', 'M3 cells destroyed');
  ok(obj(g, 'stealth').state === 'active', 'demolition does not count as an alarm');
  reach(g, 'escape'); ok(g.done && obj(g, 'stealth').state === 'done', 'M3 complete in stealth');
  const r = S.rateMission(g.stats, g.skill, g.objectives); ok(r.medals.includes('shadow'), 'shadow medal for a silent mission');
}

{
  const g = newGame(2);
  const insp = g.actors.find(a => a.beh === 'inspector' && !a.hidden);
  place(g, insp.x, insp.z - 6); g.select('silenced'); tick(g, 60 * 14);
  ok(g.alarm && obj(g, 'stealth').state === 'failed', 'ignoring the papers check raises the alarm');
  ok(g.actors.some(a => a.group === 'reinf' && !a.hidden), 'alarm brings reinforcements');
}

{
  const g = newGame(3);
  for (const id of ['flak1', 'flak2']) { const t = g.targetById(id); for (let i = 0; i < 3; i++) g.blast(t.x + 1, t.y + 1, t.z, 5, 220, 'player'); ok(t.dead, `${id} destroyed by explosives`); }
  plantAll(g, 'flak3');
  ok(obj(g, 'flak').state === 'done', 'M4 flak objective');
  const tk = g.tanks[0]; ok(tk && !tk.dead, 'tiger exists');
  const hp0 = tk.hp; place(g, tk.x + 20, tk.z); g.bullet('player', g.player.x, g.eye, g.player.z, [-1, 0, 0], 50, false); ok(tk.hp === hp0, 'bullets do not hurt the tank');
  let n = 0; while (!tk.dead && n < 10) { g.projs.push({ kind: 'rocket', x: tk.x + 6, y: tk.y + 1.4, z: tk.z, vx: -42, vy: 0, vz: 0, t: 0, fuse: 4, owner: 'player', dmg: 210, radius: 5.5, straight: true }); tick(g, 30); n++; }
  ok(tk.dead && n <= 4, `bazooka kills the tank in ${n} rockets`);
  tick(g, 2); ok(obj(g, 'tiger').state === 'done', 'M4 tiger objective');
  pickupAt(g, 'maps'); reach(g, 'exit'); ok(g.done, 'M4 complete');
}

{
  const g = newGame(4);
  pickupAt(g, 'cellkey');
  for (const id of ['pow1', 'pow2', 'pow3', 'pow4']) {
    const a = g.actorById(id), d = g.doors.filter(q => q.tex === 'bars').sort((q, r) => Math.abs((q.a + q.b) / 2 - a.x) - Math.abs((r.a + r.b) / 2 - a.x))[0];
    place(g, (d.a + d.b) / 2, d.c - 1, a.y); tick(g, 60); ok(!d.locked && d.open > 0.9, `cell of ${id} opened`);
    g.freeActor(a); ok(a.freed, `${id} freed`);
  }
  tick(g, 2); ok(obj(g, 'pows').state === 'done', 'M5 prisoners objective');
  place(g, -40, 0); tick(g, 60 * 50);
  ok(g.actors.filter(a => a.tpl === 'pow').every(a => a.escaped), 'freed prisoners walk to the truck on their own');
  pickupAt(g, 'plans'); reach(g, 'truck'); ok(g.done, 'M5 complete');
}

{
  const g = newGame(5);
  const st = g.actorById('stahl'); ok(st.maxHp > 300, 'Stahl is tough');
  plantAll(g, 'fuel'); plantAll(g, 'v2');
  kill(st); tick(g, 2);
  ok(obj(g, 'stahl').state === 'done', 'M6 Stahl objective');
  reach(g, 'train'); ok(g.done, 'M6 complete');
}

{
  const g = newGame(0, { codes: { ARSENAL: true, BULLETPROOF: true } });
  ok(g.own.includes('springfield') && g.own.includes('bazooka') && g.ammo.rocket === D.AMMO.rocket.max, 'ARSENAL code');
  ok(g.god, 'BULLETPROOF code');
}

{
  const g = newGame(0); g.god = false;
  const e = g.actors.find(a => a.tpl === 'smg' && !a.hidden);
  S.damageActor(g, e, 10, 'bullet', 'player', [0, 0, 1], 0, 'arm');
  let tries = 0; while (e.ai.state !== 'surrender' && tries++ < 40) { e.hp = e.maxHp; e.weapon = 'mp40'; S.damageActor(g, e, 5, 'bullet', 'player', [0, 0, 1], 0, 'arm'); }
  ok(e.ai.state === 'surrender' && !e.weapon && g.pickups.some(i => i.dropped === e.uid), 'arm hit disarms and the soldier surrenders');
  kill(e); ok(g.stats.dishonor === 1, 'shooting a surrendered soldier is recorded');
  const r = S.rateMission(Object.assign({}, g.stats, { shots: 10, hits: 10 }), 2, g.objectives); ok(!r.medals.includes('dsc'), 'no DSC after killing a prisoner');
}

console.log(`moh98: ${checks} checks passed`);
