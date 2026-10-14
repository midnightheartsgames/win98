const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '../js/apps/dmc98');
const S = require(path.join(DIR, 'dm-math.js'));
for (const f of ['dm-data', 'dm-world', 'dm-levels', 'dm-models', 'dm-props', 'dm-game', 'dm-player', 'dm-foes', 'dm-bosses', 'dm-objects', 'dm-story', 'dm-audio']) require(path.join(DIR, f + '.js'));
const D = S.DATA;
let checks = 0; const ok = (c, m) => { assert.ok(c, m); checks++; };
const SEED = +(process.env.DM_SEED || 7), VERBOSE = !!process.env.DM_VERBOSE;
const log = (...a) => { if (VERBOSE) console.log(...a); };

{
  const files = fs.readdirSync(DIR).map(f => path.join(DIR, f)).concat([path.join(__dirname, '../js/apps/dmc98-app.js'), path.join(__dirname, '../css/apps/dmc98.css')]);
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8').replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g, '""');
    ok(!/\/\*|\/\//.test(src), `no comments in ${path.basename(f)}`);
  }
}

{
  const texSrc = fs.readFileSync(path.join(DIR, 'dm-tex.js'), 'utf8');
  const texNames = new Set([...texSrc.matchAll(/^    (\w+)\(x\)/gm)].map(m => m[1]));
  ok(texNames.size > 50, 'textures parsed');
  for (const id in S.AREAS) {
    const def = S.area(id);
    ok(def.env && def.bounds, `${id}: env and bounds`);
    for (const b of def.boxes) if (b.render) { ok(texNames.has(b.top) || b.glass, `${id}: top texture ${b.top}`); ok(texNames.has(b.side) || b.glass, `${id}: side texture ${b.side}`); }
    for (const p of def.props) { ok(S.PROP_BUILD[p.kind], `${id}: prop ${p.kind}`); const ms = S.propMeshes(p); for (const t in ms) { ok(texNames.has(t), `${id}: prop texture ${t}`); ok(ms[t].pos.every(Number.isFinite), `${id}: prop ${p.kind} finite`); } }
    for (const b of def.breakables) ok(S.PROP_BUILD[b.kind], `${id}: breakable ${b.kind}`);
    for (const d of def.doors) if (d.to) { const [a, did] = d.to.split(':'); ok(S.AREAS[a], `${id}: door ${d.id} target area ${a}`); const td = S.area(a); ok(td.doors.some(q => q.id === did) || td.spawns[did], `${id}: door ${d.id} target ${d.to}`); }
    for (const f of def.fights) for (const w of f.waves) for (const s of w) ok(D.FOES[s.type], `${id}: foe ${s.type}`);
    for (const f of def.fights) if (f.introCut) for (const k in f.introCut) ok(S.CUTS[f.introCut[k]], `${id}: intro cut ${f.introCut[k]}`);
    for (const sp of def.special) if (sp.kind === 'boss') { ok(D.BOSSES[sp.id] && S.FOE_AI[sp.id], `${id}: boss ${sp.id}`); if (sp.cut) ok(S.CUTS[sp.cut], `${id}: boss cut ${sp.cut}`); }
    const W = new S.World(def);
    for (const d of def.doors) { const sx = d.x + Math.sin(d.face) * 2.4, sz = d.z + Math.cos(d.face) * 2.4; ok(isFinite(W.groundAt(sx, sz, 0.3, d.y + 1)), `${id}: floor in front of door ${d.id}`); }
    for (const k in def.spawns) { const s = def.spawns[k]; ok(isFinite(W.groundAt(s.x, s.z, 0.3, (s.y || 0) + 1)), `${id}: floor at spawn ${k}`); }
  }
  for (const m of S.MISSIONS) { for (const a of m.areas) ok(S.AREAS[a], `${m.id}: area ${a}`); ok(S.CUTS[m.intro], `${m.id}: intro cut`); ok(S.HOOKS[m.id] && S.HOOKS[m.id].bossDead, `${m.id}: bossDead hook`); }
  for (const id in S.CUTS) {
    const c = S.CUTS[id];
    for (const k in c.actors) { const md = c.actors[k][0]; ok(md.startsWith('obj:') || S.LOOKS[md] || ['scarecrow', 'scarecrowLeg', 'mega', 'frost', 'angelo', 'credoAngelo', 'assault', 'mephisto', 'gladius', 'berial', 'bael'].includes(md), `cut ${id}: actor model ${md}`); }
    for (const s of c.shots) { ok(s.d > 0 && s.cam && s.cam.length === 6, `cut ${id}: shot camera`); for (const k in s.do || {}) ok(c.actors[k], `cut ${id}: actor ${k}`); }
  }
}

{
  const keys = ['nero', 'dante', 'credo', 'knight', 'kyrie', 'sanctus', 'agnus', 'agnusY', 'scarecrow', 'scarecrowLeg', 'mega', 'frost', 'angelo', 'credoAngelo', 'assault', 'mephisto', 'gladius', 'berial', 'bael'];
  const anims = Object.keys(S.HANIM).concat(['attack', 'spin', 'kick', 'roll', 'pounce', 'claw', 'claw2', 'block', 'spit', 'cocoon', 'swoop', 'swing', 'stomp', 'roar', 'cast', 'stun', 'dead', 'breath', 'tongue', 'jump', 'lure', 'burrow', 'rise', null]);
  for (const k of keys) {
    const m = S.model(k); let v = 0;
    for (const p of m.parts) { const mesh = new S.Mesh(); p.build(mesh); v += mesh.count; ok(mesh.pos.every(Number.isFinite), `${k}.${p.n} finite`); ok(!p.p || m.parts.some(q => q.n === p.p), `${k}.${p.n} parent`); }
    ok(v > 30, `${k} geometry`);
    for (const an of anims) for (const u of [0, 0.5, 1]) { const mats = S.poseMatrices(m, S.M4.create(), S.pose({ m, anim: an, animU: u, t: 1.3, moveK: 0.8, phase: 2, ground: true, combat: 2 })); for (const p of m.parts) ok(mats[p.n].every(Number.isFinite), `${k} ${an} pose finite`); }
    for (const ps in S.HPOSE) { const mats = S.poseMatrices(m, S.M4.create(), S.pose({ m, pose: ps, t: 1 })); ok(mats[m.parts[0].n].every(Number.isFinite), `${k} pose ${ps}`); }
  }
  for (const kind of ['divinity', 'evilLegacy', 'frag', 'grip', 'switch', 'switchOff', 'gyroMachine', 'gyro', 'socket', 'socketOn', 'cannon', 'die', 'bars', 'orb', 'orbGreen', 'orbWhite', 'orbBig', 'fireball', 'iceSpike', 'spear', 'bullet', 'cocoon', 'devil']) { const m = S.objectMesh(kind); ok(m.count > 3 && m.pos.every(Number.isFinite) && !(m.col[0] === 1 && m.col[1] === 0 && m.col[2] === 1), `object mesh ${kind}`); }
  const names = new Set();
  const src = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(DIR, f), 'utf8')).join('\n');
  for (const m of src.matchAll(/sfx\('(\w+)'/g)) names.add(m[1]);
  for (const m of src.matchAll(/sfx: '(\w+)'/g)) names.add(m[1]);
  for (const m of src.matchAll(/sfx: \[([^\]]+)\]/g)) for (const q of m[1].matchAll(/'(\w+)'/g)) names.add(q[1]);
  for (const m of src.matchAll(/audio\.play\('(\w+)'/g)) names.add(m[1]);
  names.delete('die_'); names.delete('charge');
  for (const n of ['charge1', 'charge2', 'charge3', 'die_scarecrow', 'die_frost', 'die_angelo', 'die_mephisto', 'die_assault', 'die_gladius']) names.add(n);
  for (const n of names) { ok(S.SFX[n], `sfx ${n} defined`); const a = S.SFX[n](); ok(a.length > 10 && a.every(Number.isFinite), `sfx ${n} finite`); }
  for (const f of ['dm-ui.js', 'dm-story.js', 'dm-game.js']) for (const m of fs.readFileSync(path.join(DIR, f), 'utf8').matchAll(/music', m: '(\w+)'|music: '(\w+)'/g)) { const th = m[1] || m[2]; ok(th === 'none' || S.THEMES[th], `music theme ${th}`); }
  for (const id in S.AREAS) { const mu = S.area(id).env.music; ok(S.THEMES[mu], `area music ${mu}`); }
}

const god = (o = {}) => Object.assign({ god: true, seed: SEED, diff: 1 }, o);
function newGame(mi, o = {}) { const g = new S.Game(Object.assign(god(), { mission: mi }, o)); return g; }
function tick(g, n, inp = {}) { for (let i = 0; i < n; i++) { g.tick(typeof inp === 'function' ? inp(i) : inp); g.events.length = 0; } }
function skipCuts(g, max = 600) { let n = 0; while (g.cut && n++ < max) { g.tick({ skip: true }); g.events.length = 0; } }
function place(g, x, z, y) { const p = g.player; p.x = x; p.z = z; const gy = g.W.groundAt(x, z, 0.3, y != null ? y + 1 : 60); p.y = y != null ? y : gy; p.vx = p.vy = p.vz = 0; p.ground = true; p.st = 'move'; p.special = null; p.move = null; p.zip = null; }
function dirInp(dx, dz) { const l = Math.hypot(dx, dz) || 1; return { mz: dz / l, mx: -dx / l, cam: 0 }; }
function run(g, sec, fn) { const n = Math.round(sec * 60); for (let i = 0; i < n; i++) { skipCuts(g); if (g.state === 'clear') return; const inp = fn(i) || {}; inp.cam = 0; g.tick(inp); g.events.length = 0; } }
function walkDoor(g, id) {
  const d = g.def.doors.find(q => q.id === id); ok(d, `door ${id} exists in ${g.areaId}`);
  const from = g.areaId;
  place(g, d.x + Math.sin(d.face) * 2.2, d.z + Math.cos(d.face) * 2.2, d.y);
  g.player.doorCool = 0;
  let went = false;
  for (let i = 0; i < 200 && !g.cut; i++) { g.tick(dirInp(-Math.sin(d.face), -Math.cos(d.face))); g.events.length = 0; if (g.transition) went = true; else if (went) break; }
  skipCuts(g);
  return went;
}

function aliveFoes(g) { return g.foes.filter(e => !e.dead && !e.spawnT && !e.hidden && e.type !== 'gladius'); }
function botCombat(g, sec, stopFn) {
  const p = g.player; let lastHp = new Map(), stuckT = 0, t = 0, k = 0;
  const n = Math.round(sec * 60);
  for (let i = 0; i < n; i++) {
    skipCuts(g);
    if (g.state === 'clear' || (stopFn && i > 40 && stopFn())) return t;
    t += 1 / 60; k++;
    const boss = g.boss && !g.boss.won && !g.boss.hidden ? g.boss : null;
    const list = aliveFoes(g);
    let tgt = boss || list.sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0];
    const inp = { cam: 0 };
    if (boss && boss.type === 'agnus') { agnusStep(g, inp, k); g.tick(inp); g.events.length = 0; continue; }
    if (boss && boss.lures && boss.lures.some(l => l.on) && k % 30 === 0) { const l = boss.lures.find(q => q.on); p.lock = l; inp.lock = true; inp.bring = true; g.tick(inp); g.events.length = 0; continue; }
    if (!tgt) { g.tick(inp); g.events.length = 0; continue; }
    const dx = tgt.x - p.x, dz = tgt.z - p.z, d = Math.hypot(dx, dz) - tgt.r;
    inp.lock = true;
    const canBust = tgt.busterable ? tgt.busterable(g, tgt) : true;
    if (d > 2.2) Object.assign(inp, dirInp(dx, dz), { lock: false });
    else if (canBust && k % 40 === 0 && (!tgt.boss || tgt.stunT > 0 || tgt.finish)) inp.bring = true;
    else if (k % 10 === 0) { inp.sword = true; inp.swordHeld = true; if (k % 120 === 0) inp.exceed = true; }
    if (k % 7 === 0 && d < 2.6) inp.exceed = (k % 21 === 0);
    const hp = tgt.hp; if (lastHp.get(tgt) === hp) stuckT += 1 / 60; else { stuckT = 0; lastHp.set(tgt, hp); }
    if (stuckT > 10 && !tgt.boss) { place(g, tgt.x - 1.5, tgt.z - 1.5, tgt.y); stuckT = 0; }
    if (stuckT > 10 && tgt.boss) { const a = Math.atan2(-tgt.x, -tgt.z); place(g, tgt.x + Math.sin(a) * (tgt.r + 1.2), tgt.z + Math.cos(a) * (tgt.r + 1.2)); stuckT = 0; }
    g.tick(inp); g.events.length = 0;
  }
  return t;
}
function agnusStep(g, inp, k) {
  const p = g.player;
  if (p.holding) { if (k % 20 === 0) inp.bring = true; return; }
  const gl = g.foes.find(f => f.type === 'gladius' && !f.dead && f.st !== 'held' && f.st !== 'pulled');
  if (gl && k % 25 === 0) { p.lock = gl; inp.lock = true; inp.bring = true; }
  else if (k % 60 === 0) inp.jump = true;
}
function clearFights(g, sec = 90) { const t = botCombat(g, sec, () => !g.fight && aliveFoes(g).length === 0); return t; }
function hellbound(g, grip, fromX, fromZ, fromY) {
  place(g, fromX, fromZ, fromY);
  g.player.face = Math.atan2(grip.x - fromX, grip.z - fromZ);
  tick(g, 1, { bring: true, cam: 0 });
  for (let i = 0; i < 200 && !(g.player.ground && g.player.st === 'move' && i > 20); i++) { g.tick({ cam: 0, mz: 0.1 }); g.events.length = 0; }
}

const report = {};
function mission1() {
  const g = newGame(0);
  ok(g.cut, 'M1 intro cutscene plays');
  const len = g.cut.c.shots.reduce((q, x) => q + x.d, 0); let n = 0;
  while (g.cut && n++ < 9000) { g.tick({}); g.events.length = 0; }
  ok(!g.cut && n > len * 60 * 0.9, 'M1 intro runs to the end');
  tick(g, 3);
  ok(g.boss && g.boss.type === 'dante', 'Dante fight begins after intro');
  const t = botCombat(g, 300);
  ok(g.state === 'clear' && g.result, `M1 cleared (${t.toFixed(0)} s)`);
  report.m1 = { t: t.toFixed(0), rank: D.GRADES[g.result.rank], orbs: g.stats.orbs, style: Math.round(g.stats.style) };
  return g.save;
}
function mission2(save) {
  const g = newGame(1, { save });
  skipCuts(g);
  ok(g.fight && g.fight.def.id === 'plaza1', 'plaza fight starts after intro');
  let t = clearFights(g); ok(!g.fight, `plaza cleared ${t.toFixed(0)}s`);
  ok(walkDoor(g, 'toStore') && g.areaId === 'store', 'plaza -> store');
  place(g, 0, 2); t = clearFights(g); ok(g.aState('store').fights.store1, `store cleared ${t.toFixed(0)}s`);
  place(g, -12, -16, 4.2); tick(g, 5); ok(g.save.took.frag_m2a, 'blue orb fragment in storehouse');
  ok(walkDoor(g, 'toCath') && g.areaId === 'cathedral', 'store -> cathedral');
  ok(!walkDoor(g, 'toTerrace'), 'terrace door locked before Evil Legacy');
  place(g, 0, 21.4, 0.9); tick(g, 5); skipCuts(g);
  ok(g.flags.evilLegacy, 'Evil Legacy obtained');
  t = clearFights(g); ok(g.aState('cathedral').fights.cath1, `cathedral fight cleared ${t.toFixed(0)}s`);
  ok(walkDoor(g, 'toTerrace') && g.areaId === 'terrace', 'cathedral -> terrace');
  const grips = g.objs.filter(o => o.kind === 'grip');
  hellbound(g, grips[0], 0, -9, 0);
  ok(g.player.z > 4 && g.player.y > 1, `Hell Bound crosses the chasm (z=${g.player.z.toFixed(1)})`);
  t = clearFights(g); ok(g.aState('terrace').fights.terrace1, 'terrace fight cleared');
  hellbound(g, grips[1], 0, 25, 1.5);
  ok(g.player.z > 30 && g.player.y > 5, `Hell Bound to the upper terrace (y=${g.player.y.toFixed(1)})`);
  ok(walkDoor(g, 'toPort') && g.areaId === 'port', 'terrace -> port');
  place(g, 0, -10); t = clearFights(g); ok(g.aState('port').fights.port1, `port cleared ${t.toFixed(0)}s`);
  ok(!walkDoor(g, 'toMine'), 'mine gate closed before switch');
  const sw = g.objs.find(o => o.kind === 'switch'); place(g, sw.x + 1.5, sw.z - 1.5); g.player.face = Math.atan2(sw.x - g.player.x, sw.z - g.player.z); tick(g, 30, i => ({ sword: i === 0, cam: 0 }));
  ok(g.flags.portGate, 'port switch lowers the gate');
  ok(walkDoor(g, 'toMine') && g.areaId === 'mine', 'port -> mine');
  place(g, 0, -10); tick(g, 3); skipCuts(g); tick(g, 2);
  ok(g.boss && g.boss.type === 'berial', 'Berial fight starts');
  t = botCombat(g, 400);
  ok(g.state === 'clear', `M2 cleared, Berial ${t.toFixed(0)}s`);
  report.m2 = { t: g.stats.time.toFixed(0), berial: t.toFixed(0), rank: D.GRADES[g.result.rank], orbs: g.stats.orbs, style: Math.round(g.stats.style) };
  return g.save;
}
function mission4(save) {
  const g = newGame(2, { save });
  skipCuts(g);
  let t = clearFights(g); ok(g.aState('library').fights.lib1, `library cleared ${t.toFixed(0)}s`);
  place(g, 4.3, 5, 3.1); tick(g, 2); place(g, 6, 5, 5.2); tick(g, 5); ok(g.save.took.frag_m4a, 'library fragment');
  ok(walkDoor(g, 'toHall') && g.areaId === 'grandhall', 'library -> grand hall');
  place(g, 0, 0); t = clearFights(g); ok(g.aState('grandhall').fights.hall1, `hall cleared ${t.toFixed(0)}s`);
  ok(!walkDoor(g, 'toCorr'), 'corridor gate closed');
  for (const sid of ['sockA', 'sockB']) {
    const m = g.objs.find(o => o.kind === 'gyroMachine'); place(g, m.x + 2, m.z); g.player.face = -Math.PI / 2; tick(g, 30, i => ({ bring: i === 0, cam: 0 }));
    const gy = g.objs.find(o => o.kind === 'gyro' && !o.dead); ok(gy, 'gyro blade spawned');
    const s = g.objs.find(o => o.kind === 'socket' && o.id === sid), dx = s.x - gy.x, dz = s.z - gy.z, l = Math.hypot(dx, dz);
    place(g, gy.x - dx / l * 1.6, gy.z - dz / l * 1.6); g.player.face = Math.atan2(dx, dz);
    tick(g, 240, i => ({ sword: i === 0, cam: 0 }));
    ok(s.filled, `${sid} filled by gyro blade`);
  }
  ok(g.flags.hallGate, 'hall gate opens');
  ok(walkDoor(g, 'toCorr') && g.areaId === 'corridor', 'hall -> corridor');
  place(g, 0, 28); t = clearFights(g); ok(g.aState('corridor').fights.corr1, 'corridor fight cleared');
  const c = g.objs.find(o => o.kind === 'cannon'); place(g, 0, c.z - 2.4); g.player.face = 0;
  log('cannon', c && c.hp, g.player.st, g.fight && g.fight.def.id, aliveFoes(g).length);
  for (let k = 0; k < 6 && !g.flags.cannonDown; k++) { place(g, 0, c.z - 2.4); g.player.face = 0; tick(g, 100, i => ({ sword: i % 25 === 0, cam: 0 })); }
  log('cannon after', c && c.hp, g.player.st, g.player.z);
  ok(g.flags.cannonDown, 'cannon destroyed');
  ok(walkDoor(g, 'toGrave') && g.areaId === 'graveyard', 'corridor -> graveyard');
  place(g, 0, -12); tick(g, 3); skipCuts(g); tick(g, 2);
  ok(g.boss && g.boss.type === 'bael', 'Bael fight starts');
  t = botCombat(g, 400);
  ok(g.state === 'clear', `M4 cleared, Bael ${t.toFixed(0)}s`);
  report.m4 = { t: g.stats.time.toFixed(0), bael: t.toFixed(0), rank: D.GRADES[g.result.rank], orbs: g.stats.orbs, style: Math.round(g.stats.style) };
  return g.save;
}
function mission6(save) {
  const g = newGame(3, { save });
  skipCuts(g);
  place(g, 0, 20); let t = clearFights(g); ok(g.aState('lab').fights.lab1, `lab1 cleared ${t.toFixed(0)}s`);
  place(g, 0, 44); t = clearFights(g); ok(g.aState('lab').fights.lab2, 'lab2 cleared');
  ok(walkDoor(g, 'toGame') && g.areaId === 'gameroom', 'lab -> game room');
  let rolls = 0;
  for (let i = 0; i < 40 && !g.flags.gameGate; i++) {
    const die = g.objs.find(o => o.kind === 'die');
    if (g.fight || aliveFoes(g).length) { clearFights(g); continue; }
    if (g.board.busy || g.player.st === 'board') { tick(g, 30); continue; }
    place(g, die.x * 0.8, die.z * 0.8); g.player.face = Math.atan2(die.x - g.player.x, die.z - g.player.z);
    tick(g, 1, { sword: true, cam: 0 }); rolls++;
    tick(g, 200, () => ({ cam: 0 }));
  }
  ok(g.flags.gameGate, `board game finished in ${rolls} rolls`);
  ok(walkDoor(g, 'toFalls') && g.areaId === 'falls', 'game room -> Foris Falls');
  place(g, 0, 12); t = clearFights(g); ok(g.aState('falls').fights.falls0, 'falls0 cleared');
  hellbound(g, g.objs.find(o => o.kind === 'grip'), 0, 29, 0);
  ok(g.player.z > 42, `Hell Bound across the broken bridge (z=${g.player.z.toFixed(1)})`);
  place(g, 0, 60); t = clearFights(g); ok(g.aState('falls').fights.falls1, 'falls1 cleared');
  ok(walkDoor(g, 'toCreation') && g.areaId === 'creation', 'falls -> Angel Creation');
  place(g, 0, -8); tick(g, 3); skipCuts(g); tick(g, 2);
  ok(g.boss && g.boss.type === 'agnus', 'Agnus fight starts');
  t = botCombat(g, 300);
  ok(g.state === 'clear' && g.save.dt, `M6 cleared, DT awakened, Agnus ${t.toFixed(0)}s`);
  report.m6 = { t: g.stats.time.toFixed(0), agnus: t.toFixed(0), rank: D.GRADES[g.result.rank], orbs: g.stats.orbs, style: Math.round(g.stats.style) };
  return g.save;
}
function mission8(save) {
  const g = newGame(4, { save });
  skipCuts(g);
  ok(g.save.dt, 'DT available in M8');
  place(g, 0, 4); let t = clearFights(g); ok(g.aState('forest').fights.forest1, `forest cleared ${t.toFixed(0)}s`);
  ok(walkDoor(g, 'toChurch') && g.areaId === 'church', 'forest -> church');
  place(g, 0, 4); t = clearFights(g); ok(g.aState('church').fights.church1, 'church cleared');
  place(g, -9, 1, 1.8); tick(g, 3); place(g, -10.5, 3, 3.9); tick(g, 3); place(g, -11.8, 7, 5.8); tick(g, 5); ok(g.save.took.frag_m8a, 'church wall fragment');
  ok(walkDoor(g, 'toWoods') && g.areaId === 'lostwoods', 'church -> Lost Woods');
  ok(walkDoor(g, 'wW') && g.areaId === 'lostwoods' && g.woods.step === 0, 'wrong path returns to the tablet');
  ok(walkDoor(g, 'wN') && g.woods.step === 1, 'forward');
  ok(walkDoor(g, 'wW') && g.woods.trapT, 'trap clearing');
  t = clearFights(g); place(g, 0, 2); tick(g, 5); ok(g.save.took.frag_m8b, 'trap fragment');
  ok(walkDoor(g, 'wN') && g.woods.step === 0, 'after trap back to start');
  for (const d of ['wN', 'wE']) ok(walkDoor(g, d) && g.areaId === 'lostwoods', `woods ${d}`);
  ok(walkDoor(g, 'wW') && g.areaId === 'bridge', 'Lost Woods solved -> bridge');
  place(g, 0, -8); tick(g, 3); skipCuts(g); tick(g, 2);
  ok(g.boss && g.boss.type === 'credo', 'Credo fight starts');
  g.player.dt = g.dtMax;
  t = botCombat(g, 400, () => { if (VERBOSE && (Math.round(g.t * 60) % 600 === 0 || (g.boss.y < -0.5 && g.boss.y > -3))) log('credo', g.boss.x.toFixed(1), g.boss.z.toFixed(1), Math.round(g.boss.hp), g.boss.st, g.boss.atk && g.boss.atk.name, g.boss.stunT.toFixed(1), g.boss.y.toFixed(1), Math.round(g.boss.guardDmg), g.player.st, g.player.y.toFixed(1)); return false; });
  ok(g.state === 'clear' && g.gameComplete, `M8 cleared, game complete, Credo ${t.toFixed(0)}s`);
  report.m8 = { t: g.stats.time.toFixed(0), credo: t.toFixed(0), rank: D.GRADES[g.result.rank], orbs: g.stats.orbs, style: Math.round(g.stats.style) };
  return g.save;
}

{
  const g = newGame(1, { noCuts: true });
  const p = g.player;
  tick(g, 60);
  const e = g.foes.find(f => !f.dead); ok(e, 'foes spawn in plaza');
  tick(g, 60);
  place(g, e.x, e.z - 2); p.face = 0;
  const hp0 = e.hp; tick(g, 20, i => ({ sword: i === 0, cam: 0 })); ok(e.hp < hp0 || e.dead, 'sword hits a scarecrow');
  p.exceed = 1; const hp1 = e.hp; place(g, e.x, e.z - 2); tick(g, 20, i => ({ sword: i === 0, cam: 0 })); ok(p.exceed < 1 && (e.hp < hp1 || e.dead), 'Exceed charge is spent on a hit');
  const combo = []; place(g, 30, 30); for (let i = 0; i < 100; i++) { g.tick({ sword: i % 12 === 0, cam: 0 }); g.events.length = 0; if (p.move && combo[combo.length - 1] !== p.move) combo.push(p.move); }
  ok(combo.slice(0, 4).join() === 'a1,a2,a3,a4', `combo A chains (${combo.join()})`);
  g.style.sp = 0; g.updateRank(); for (let i = 0; i < 12; i++) g.styleHit('a' + (i % 4 + 1), 40, false); ok(g.style.rank >= 2, 'varied attacks raise style');
  const r = g.style.rank; for (let i = 0; i < 12; i++) g.styleHit('a1', 5, false); ok(g.style.rank <= r + 1, 'repeating one move gives little');
  g.styleHurt(); ok(g.style.rank <= Math.max(0, r - 1), 'getting hit drops style');
  place(g, 0, -14); tick(g, 1, { jump: true, cam: 0 }); tick(g, 20); ok(!p.ground && p.y > 1.5, 'jump');
  tick(g, 90); ok(p.ground, 'landed');
  g.save.skills.airHike = true; tick(g, 1, { jump: true, cam: 0 }); tick(g, 25); const y1 = p.y; tick(g, 1, { jump: true, cam: 0 }); tick(g, 12); ok(p.y > y1, 'Air Hike second jump');
  tick(g, 120);
  ok(S.chargeLevel(g, 2.5) === 1, 'charge shot capped at level 1 without skills'); g.save.skills.charge2 = true; g.save.skills.charge3 = true; ok(S.chargeLevel(g, 2.5) === 3, 'charge shot level 3 with skills');
  const s0 = g.save.orbs; g.dropOrbs(p.x, p.y, p.z, 30); tick(g, 200); ok(g.save.orbs >= s0 + 25, 'red orbs are collected');
  g.save.items.vitalS = 1; p.hp = 20; ok(g.useItem('vitalS') && p.hp > 50, 'Vital Star heals');
}

{
  const g = newGame(1, { noCuts: true, god: false });
  const p = g.player; tick(g, 30);
  p.hp = 5; S.hurtPlayer(g, 100, null, {}); ok(g.state === 'dead', 'player can die');
  tick(g, 120); g.continueGame(); ok(g.state === 'play' && p.hp === g.maxHp && g.stats.deaths === 1, 'continue restores the checkpoint');
  g.save.items.goldOrb = 1; p.invul = 0; S.hurtPlayer(g, 500, null, {}); ok(g.state === 'play' && p.hp === g.maxHp && g.save.items.goldOrb === 0, 'Gold Orb revives');
}

{
  const g = newGame(1, { noCuts: true, god: false });
  ok(g.fight && g.fight.def.id === 'plaza1', 'scripted plaza fight starts');
  tick(g, 90); g.player.invul = 0; S.hurtPlayer(g, 1000, null, {}); tick(g, 120); g.continueGame(); tick(g, 5);
  ok(g.fight && g.fight.def.id === 'plaza1' && g.sealed, 'scripted fight restarts after Continue');
}

{
  for (const id in S.CUTS) {
    const area = { m1_intro: 'opera', m1_end: 'opera', m2_intro: 'plaza', mega_intro: 'store', evil_legacy: 'cathedral', berial_intro: 'mine', m2_end: 'mine', m4_intro: 'library', angelo_intro: 'grandhall', bael_intro: 'graveyard', m4_end: 'graveyard', m6_intro: 'lab', mephisto_intro: 'falls', agnus_intro: 'creation', m6_end: 'creation', assault_intro: 'forest', m8_intro: 'forest', credo_intro: 'bridge', m8_end: 'bridge', finale: 'bridge' }[id];
    ok(area, `cut ${id} has a known area`);
    const g = newGame(0, { noCuts: true }); g.enterArea(area, 'start');
    let ended = false; g.startCut(id, () => { ended = true; });
    let n = 0; while (g.cut && n++ < 5000) { S.updateCut(g, {}); for (const k in g.cut ? g.cut.actors : {}) { const a = g.cut.actors[k]; if (![a.x, a.y, a.z].every(Number.isFinite)) ok(false, `cut ${id} actor ${k} finite`); } }
    ok(ended, `cut ${id} completes`);
  }
}

const t0 = Date.now();
let save = mission1();
save = mission2(save);
save = mission4(save);
save = mission6(save);
save = mission8(save);
ok(save.frags >= 4 && save.souls > 0 && save.orbs > 0, `campaign economy: frags ${save.frags}, souls ${save.souls}, orbs ${save.orbs}`);
console.log(JSON.stringify(report));
console.log(`dmc98: ${checks} checks passed in ${((Date.now() - t0) / 1000).toFixed(1)}s (seed ${SEED})`);

{
  const root = path.join(__dirname, '..'), rd = f => fs.readFileSync(path.join(root, f), 'utf8');
  const gm = rd('js/game-manager.js');
  ok(/dmc98: \{\s*id: 'dmc98',\s*steam: true,/.test(gm), 'dmc98 is sold through Steam');
  ok(!/preGrantedLicenses = \[[^\]]*dmc98/.test(gm) && !/dmc98Granted/.test(gm), 'dmc98 is not pre-granted');
  const def = gm.slice(gm.indexOf('return {\n      purchased:'), gm.indexOf('steamMigrated: true'));
  ok(def.length > 0 && !def.includes('dmc98'), 'dmc98 is not in default purchased/installed lists');
  ok(/isInstalled\('dmc98'\)/.test(rd('js/desktop.js')) && /isInstalled\('dmc98'\)/.test(rd('js/taskbar.js')) && /includes\('dmc98'\)/.test(rd('js/filesystem.js')), 'desktop, Start menu and C:\Games are gated on installation');
  ok(/showInSteam\('dmc98'\)/.test(rd('js/apps/explorer.js')) && /showInSteam\('dmc98'\)/.test(rd('js/taskbar.js')), 'not-installed paths lead to Steam');
  const html = rd('index.html'); for (const f of fs.readdirSync(DIR)) ok(html.includes(`js/apps/dmc98/${f}`), `index.html loads ${f}`);
  ok(html.includes('css/apps/dmc98.css') && html.includes('js/apps/dmc98-app.js'), 'index.html loads css and app');
  console.log(`dmc98 integration: ${checks} checks total`);
}
