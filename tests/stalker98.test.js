// S.T.A.L.K.E.R. 98 — logic, level, asset and story tests (Node, no browser/GPU).
const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '../js/apps/stalker98');
const S = require(path.join(DIR, 'st-math.js'));
for (const f of ['st-data', 'st-world', 'st-models', 'st-levels', 'st-game', 'st-ai', 'st-quests', 'st-audio']) require(path.join(DIR, f + '.js'));
const { ITEMS, MUTANTS, HUMANS, ANOMALIES } = S.DATA;
const Q = S.QUESTS;
let checks = 0; const ok = (c, m) => { assert.ok(c, m); checks++; };
const tick = (g, n, inp = {}) => { for (let i = 0; i < n; i++) { g.tick(typeof inp === 'function' ? inp(i) : inp); g.events.length = 0; } };
const place = (g, x, z, yaw = 0) => { const p = g.player; p.x = x; p.z = z; p.y = g.W.groundAt(x, z, 0.3); p.vx = p.vy = p.vz = 0; p.yaw = yaw; p.pitch = 0; p.ground = true; };
const aimAt = (g, a) => { const p = g.player, dx = a.x - p.x, dz = a.z - p.z; p.yaw = Math.atan2(dx, dz); p.pitch = Math.atan2(a.y + 1.2 - g.eye, Math.hypot(dx, dz)); };
const killGroup = (g, name) => { for (const a of g.group(name)) if (!a.dead) S.damageActor(g, a, 1e6, 'bullet', 'player', null, 0); };
// follow a dialogue by option index (only options whose conditions hold are counted), like the UI does
function talk(g, a, picks) {
  const id = a.wounded && !a.storyWound ? 'wounded' : a.dialog || 'generic';
  const DLG = Q.DIALOGS[id]; let node = DLG.start(g, a); const said = [];
  for (const k of picks) {
    const n = DLG.nodes[node]; if (!n || n.trade) break;
    said.push(typeof n.say === 'function' ? g.L(n.say(g, a)) : g.L(n.say));
    const opts = n.opts.filter(o => !o.if || o.if(g, a)); const o = opts[k]; if (!o) throw new Error(`dialog ${id}/${node}: no option ${k}`);
    if (o.do) o.do(g, a); node = o.go; if (node == null) break;
  }
  g.events.length = 0; return said;
}
const findOpt = (g, a, textRe) => { const DLG = Q.DIALOGS[a.dialog]; const n = DLG.nodes[DLG.start(g, a)]; const opts = n.opts.filter(o => !o.if || o.if(g, a)); return opts.findIndex(o => textRe.test(o.t.ru)); };

// ---------------------------------------------------------------- assets
{
  for (const look in S.LOOKS) {
    const m = S.humanModel(look); let verts = 0;
    for (const p of m.parts) { const mesh = new S.Mesh(); p.build(mesh); verts += mesh.count; ok(!p.p || m.parts.some(q => q.n === p.p), `${look}.${p.n} parent`); }
    ok(verts > 100, `human look ${look} has geometry`);
    for (const a of [{ walk: 1, move: 1, hold: 'rifle', aim: 1 }, { sit: 1, guitar: true, hold: 'none' }, { lie: 1 }, { hands: true }, { crouch: 1, hold: 'pistol', aim: 1 }]) { const mats = S.poseMatrices(m, S.M4.create(), Object.assign({ t: 1 }, a)); for (const p of m.parts) ok(mats[p.n].every(Number.isFinite), `${look} pose finite`); }
  }
  for (const t in MUTANTS) {
    const m = S.MODELS[MUTANTS[t].model]; ok(m, `model for ${t}`);
    let verts = 0; for (const p of m.parts) { const mesh = new S.Mesh(); p.build(mesh); verts += mesh.count; }
    ok(verts > 50, `${t} geometry`);
    const mats = S.poseMatrices(m, S.M4.create(), { walk: 1, move: 1, run: 1, attack: 1, leap: 1, t: 2 }); for (const p of m.parts) ok(mats[p.n].every(Number.isFinite), `${t} pose finite`);
  }
  for (const id in ITEMS) { const d = ITEMS[id]; const m = S.itemMesh(id); ok(m.count > 0 && m.pos.every(Number.isFinite), `item mesh ${id}`); if (d.kind === 'weapon' && d.view) { ok(S.GUNS[id] && S.VIEW_POS[id], `view model ${id}`); ok(S.viewModel(id, 0x404040).count > 20, `view mesh ${id}`); } }
  for (const id of ['knife', 'f1', 'rgd5', 'bolt', 'binoc']) ok(S.VIEW_POS[id] && S.viewModel(id, 0x404040).count > 0, `view ${id}`);
  for (const L of S.LEVEL_ORDER) {
    const d = S.LEVELS[L]();
    for (const p of d.props) { const ms = S.propMeshes(p); for (const t in ms) ok(ms[t].pos.every(Number.isFinite), `${L} prop ${p.kind}`); }
    const out = {}; for (const t of d.trees.slice(0, 60)) S.treeMeshes(t, out); for (const k in out) ok(out[k].pos.every(Number.isFinite), `${L} tree ${k}`);
  }
  // every sound referenced from code has a recipe
  const names = new Set();
  for (const id in ITEMS) if (ITEMS[id].sound) names.add(ITEMS[id].sound);
  for (const t in MUTANTS) for (const k of ['idle', 'alert', 'attack', 'hurt', 'die']) names.add(`m_${k}_${t}`);
  for (const t in ANOMALIES) { if (t !== 'acid') { names.add(`an_${t}`); names.add(`an_${t}_charge`); } }
  names.add('an_acid');
  const src = ['st-game', 'st-ai', 'st-ui', 'st-windows'].map(f => fs.readFileSync(path.join(DIR, f + '.js'), 'utf8')).join('\n');
  for (const m of src.matchAll(/s: '(\w+)'(?!\s*\+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/(?:A|audio)\.play\('(\w+)'(?!\s*\+)/g)) names.add(m[1]);
  for (const s of ['grass', 'dirt', 'hard']) names.add('step_' + s);
  for (const v of [0, 1, 2]) names.add('bark_' + v);
  for (const n of names) ok(S.SFX[n], `sound "${n}" has a recipe`);
  for (const n of ['ak', 'explosion', 'an_electro', 'm_alert_dog', 'geiger']) { const a = S.SFX[n](); ok(a.length > 50 && a.every(Number.isFinite) && Math.max(...a.map(Math.abs)) <= 1, `sound ${n} renders`); }
  for (const n in S.LOOPS) { const a = S.LOOPS[n](); ok(a.length > 1000 && a.every(Number.isFinite), `loop ${n}`); }
}

// ---------------------------------------------------------------- dialogues & quests are consistent
{
  for (const id in Q.DIALOGS) {
    const DLG = Q.DIALOGS[id];
    for (const nid in DLG.nodes) { const n = DLG.nodes[nid]; if (n.trade) continue; ok(n.say && n.opts && n.opts.length, `${id}/${nid} has text and options`); for (const o of n.opts) { ok(o.t && o.t.ru && o.t.en, `${id}/${nid} option text`); ok(o.go == null || DLG.nodes[o.go], `${id}/${nid} -> ${o.go} exists`); } }
  }
  for (const q in Q.QUESTS) { const d = Q.QUESTS[q]; ok(d.title.ru && d.title.en && d.stages.length, `quest ${q}`); for (const st of d.stages) ok(st.text.ru && st.text.en && st.target && S.LEVELS[st.target.level], `quest ${q} stage target`); }
  for (const L of S.LEVEL_ORDER) { const d = S.LEVELS[L](); for (const n of d.npcs) { if (n.dialog) ok(Q.DIALOGS[n.dialog], `${L} npc dialog ${n.dialog}`); if (n.trade) ok(Q.TRADERS[n.trade], `${L} trader ${n.trade}`); ok(HUMANS[n.tpl], `${L} npc template ${n.tpl}`); if (n.path) ok(d.paths[n.path], `${L} path ${n.path}`); } }
}

// ---------------------------------------------------------------- levels: everything reachable on foot from the start
function reach(W, x, z) {
  const seen = new Uint8Array(W.nw * W.nh), q = [], s = W.nearestOK(x, z, 4); if (s < 0) return seen;
  seen[s] = 1; q.push(s);
  while (q.length) {
    const a = q.pop(), ai = a % W.nw, aj = (a / W.nw) | 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const bi = ai + dx, bj = aj + dz; if (bi < 0 || bj < 0 || bi >= W.nw || bj >= W.nh) continue;
      const b = bj * W.nw + bi; if (seen[b] || !W.navOK[b]) continue;
      if (W.navH[b] - W.navH[a] > 1.2) continue;
      seen[b] = 1; q.push(b);
    }
  }
  return seen;
}
for (const L of S.LEVEL_ORDER) {
  const d = S.LEVELS[L](), W = new S.World(d);
  ok(d.name.ru && d.name.en && d.env && d.labels.length, `${L} metadata`);
  const sp = d.spawns.start || d.spawns.from_cordon, seen = reach(W, sp.x, sp.z);
  const at = (x, z, what, rad = 3) => { const c = W.nearestOK(x, z, rad); ok(c >= 0 && seen[c], `${L}: ${what} reachable (${x.toFixed(1)}, ${z.toFixed(1)})`); };
  for (const n of d.npcs) if (n.leash !== 0 && n.y == null) at(n.x, n.z, `npc ${n.id || n.tpl}`);
  for (const it of d.items) at(it.x, it.z, `item ${it.id}`);
  for (const s of d.stashes) if (s.y == null) at(s.x, s.z, `stash ${s.id}`);
  for (const a of d.arts) at(a.x, a.z, `artifact ${a.id}`, 4);
  for (const e of d.exits) at((e.x0 + e.x1) / 2, (e.z0 + e.z1) / 2 - (e.z1 > 150 ? 2 : -2), `exit ${e.id}`, 6);
  for (const k in d.spawns) at(d.spawns[k].x, d.spawns[k].z, `spawn ${k}`);
  // the railway embankment really separates the Cordon: only the road cut and the ravine lead north
  if (L === 'cordon') {
    for (const x of [-150, -60, 60, 150]) { const c = W.cellOf(x, 40); ok(!W.navOK[c] || W.navH[c] > 5, `embankment blocks at x=${x}`); }
    ok(W.findPath(-60, -100, -60, 120, 60000), 'path from south to north of the embankment exists');
    // quick check that the steep slope stops the player
    const g = new S.Game({ skill: 1, seed: 3 }); place(g, 60, 26, 0); tick(g, 300, { fwd: 1 }); ok(g.player.z < 36, `embankment slope cannot be climbed (z=${g.player.z.toFixed(1)})`);
  }
}

// ---------------------------------------------------------------- mechanics
{
  const g = new S.Game({ skill: 2, seed: 11 }); g.events.length = 0; const p = g.player;
  for (const a of g.actors) if (a.beh !== 'trader') a.hidden = true; // nobody interferes with the mechanics checks
  ok(g.slots.pistol && g.slots.knife && g.slots.suit && g.has('detector') && g.has('bolt'), 'starting kit');
  ok(g.eye > p.y + 1 && g.levelId === 'cordon', 'player in the bunker');
  // reload consumes boxes, fire uses the magazine
  const pm = g.weaponItem('pistol'); g.cur = 'pistol'; const before = g.ammoCount('9x18');
  pm.mag = 3; tick(g, 1, { reload: true }); tick(g, 120); ok(pm.mag === 8 && g.ammoCount('9x18') === before - 5, 'reload fills the magazine from boxes');
  tick(g, 1, { fire: true }); ok(pm.mag === 7, 'shot uses a round'); tick(g, 30, { fire: true }); ok(pm.mag === 7, 'semi-auto needs trigger release'); tick(g, 1, {}); tick(g, 1, { fire: true }); ok(pm.mag === 6, 'released trigger fires again');
  // worn weapons jam and are cleared with R
  pm.cond = 0.05; let jammed = false; for (let i = 0; i < 400 && !jammed; i++) { pm.mag = 8; tick(g, 1, { fire: i % 2 === 0 }); if (p.w.state === 'jam') jammed = true; }
  ok(jammed, 'worn pistol jams'); tick(g, 1, { reload: true }); tick(g, 150); ok(p.w.state === 'idle', 'jam cleared'); pm.cond = 0.8;
  // armour reduces bullet damage
  p.hp = 100; g.hurtPlayer(40, 'bullet', null); const jacketHp = p.hp;
  const suit = g.addItem({ id: 'military_suit', cond: 1 }); g.equip(suit.uid); p.hp = 100; g.hurtPlayer(40, 'bullet', null);
  ok(p.hp > jacketHp + 8, `military suit protects better (${jacketHp.toFixed(1)} vs ${p.hp.toFixed(1)})`);
  // bleeding and bandages
  p.hp = 100; p.bleed = 1.5; tick(g, 120); ok(p.hp < 99, 'bleeding drains health'); g.quickUse(2); ok(p.bleed === 0, 'bandage stops bleeding');
  // radiation zone and anti-rad
  place(g, 80, -112); p.rad = 0; tick(g, 600); ok(p.rad > 0.02 && p.radIn > 0, `radiation accumulates (${p.rad.toFixed(3)})`);
  g.give('antirad'); g.quickUse(3); ok(p.rad < 0.02, 'anti-rad removes radiation');
  // hunger
  p.food = 0.1; g.give('bread'); g.quickUse(4); ok(p.food > 0.4, 'eating restores satiety');
  // weight: overload disables sprint
  place(g, 0, -150, 0); for (let i = 0; i < 20; i++) g.give('military_suit', 1);
  tick(g, 30, { fwd: 1, sprint: true }); ok(!p.sprint && g.weight() > g.maxWeight(), 'overloaded player cannot sprint');
  for (const it of g.inv.filter(i => i.id === 'military_suit' && !g.isEquipped(i.uid))) g.removeItem(it.uid);
  tick(g, 30, { fwd: 1, sprint: true }); ok(p.sprint, `sprinting when not overloaded (w=${g.weight().toFixed(1)} st=${p.stamina.toFixed(0)} ex=${p.exhausted} dead=${p.dead} cr=${p.crouch})`);
  // artifacts on the belt
  const art = g.addItem({ id: 'nightstar' }); ok(g.equip(art.uid) && g.maxWeight() === 58, 'Night Star raises carry weight'); p.rad = 0; tick(g, 600); ok(p.rad > 0.001, 'artifact is radioactive'); g.unequip(art.uid);
  // anomalies: springboard hurts and throws; a bolt sets it off
  const an = g.anomalies.find(a => a.type === 'springboard'); ok(an, 'springboard exists');
  place(g, an.x, an.z); p.hp = 100; an.cd = 0; an.state = 'idle'; tick(g, 40); ok(p.hp < 90, `springboard hurts (${p.hp.toFixed(0)})`);
  an.cd = 0; an.state = 'idle'; place(g, an.x + 8, an.z); p.yaw = Math.atan2(an.x - p.x, an.z - p.z); p.pitch = -0.25; g.cur = 'bolt'; p.w.state = 'idle'; tick(g, 1, { fire: true }); let trig = false; for (let i = 0; i < 120; i++) { tick(g, 1); if (an.state !== 'idle') trig = true; } ok(trig, 'bolt triggers the anomaly');
  // electro damage scales with shock protection
  const el = g.anomalies.find(a => a.type === 'electro'); place(g, el.x, el.z); p.hp = 100; el.cd = 0; el.state = 'idle'; tick(g, 30); ok(p.hp < 100, 'electro discharge hurts');
  p.hp = 100; p.bleed = 0;
  // grenade kills a dog
  const dog = g.actors.find(a => a.kind === 'mutant' && a.type === 'dog' && !a.dead); dog.hidden = false; place(g, dog.x + 12, dog.z);
  g.give('f1'); g.projs.push({ kind: 'f1', x: dog.x, y: dog.y + 0.3, z: dog.z, vx: 0, vy: 0, vz: 0, t: 0, fuse: 0.05, owner: 'player', rot: 0 }); tick(g, 10); ok(dog.dead, 'grenade kills a blind dog');
  // loot the body: the trophy tail may be there; take everything
  const cnt = g.inv.length; g.lootAll(dog); ok(g.inv.length >= cnt && dog.inv.length === 0, 'body looted');
  // trade with Sidorovich
  const sid = g.actorById('sidorovich'), tr = Q.traderState(g, 'sidorovich');
  const m0 = g.money; g.money = 5000; ok(g.buy(tr, tr.stock.find(s => s.id === 'medkit')), 'bought a medkit'); ok(g.money === 5000 - g.buyPrice('medkit', null, tr), 'paid the price');
  const med = g.addItem({ id: 'medusa' }); const m1 = g.money; ok(g.sell(tr, med.uid) && g.money === m1 + g.sellPrice(med, tr), 'sold an artifact'); g.money = m0; void sid;
  // quest items cannot be sold or dropped
  const fd = g.addItem({ id: 'flash_nimble' }); ok(!g.dropItem(fd.uid) && g.sellPrice(fd, tr) === 0, 'quest item stays'); g.removeItem(fd.uid);
}

// ---------------------------------------------------------------- AI behaviour
{
  const g = new S.Game({ skill: 2, seed: 21 }); g.events.length = 0; const p = g.player;
  // ATP bandits notice the player in the open and shoot at him
  const boss = g.actorById('atp_boss'); place(g, 62, -106, Math.PI / 2); ok(g.player.y < 1.5, 'standing on the ground'); p.hp = 100; let shots = 0;
  for (let i = 0; i < 60 * 12; i++) { g.tick({}); shots += g.events.filter(e => e.t === 'npcfire').length; g.events.length = 0; if (p.hp < 40) p.hp = 100; }
  ok(shots > 5, `bandits open fire on the player (${shots} shots)`);
  ok(g.group('atp_bandits').filter(a => a.ai.state === 'combat').length >= 3, 'bandits engage together');
  void boss;
  // friendly loners do not attack; shooting one turns the village hostile
  const g2 = new S.Game({ skill: 2, seed: 22 }); g2.events.length = 0; const wolf = g2.actorById('wolf'), ro = g2.actors.find(a => a.tpl === 'rookie' && a.beh === 'camp');
  place(g2, ro.x + 3, ro.z); tick(g2, 120); ok(g2.attitudeOf(ro, 'player') > 0 && ro.ai.state !== 'combat', 'rookies are friendly');
  S.damageActor(g2, ro, 5, 'bullet', 'player', null, 0); tick(g2, 30); ok(g2.attitudeOf(ro, 'player') < 0, 'shot rookie turns hostile'); ok(g2.goodwill.stalker < 400, 'goodwill drops');
  void wolf;
  // dogs hunt the player and bite
  const g3 = new S.Game({ skill: 2, seed: 23 }); g3.events.length = 0; const dogs = g3.group('farm_dogs'); ok(dogs.length === 5, 'dog pack at the old farm');
  place(g3, dogs[0].x + 10, dogs[0].z); g3.player.hp = 100; tick(g3, 60 * 5); ok(dogs.some(d => d.ai.state === 'hunt') && g3.player.hp < 100, `dogs attack (hp ${g3.player.hp.toFixed(0)})`); ok(!g3.player.dead, 'a rookie survives the first seconds of a dog attack');
  ok(g3.player.bleed > 0 || g3.player.hp < 90, 'bites cause wounds');
  // wounded state: heavy damage can down a human who begs for a medkit
  const g4 = new S.Game({ skill: 2, seed: 24 }); g4.events.length = 0; let downed = 0;
  for (const a of g4.actors.filter(x => x.kind === 'human' && !x.essential && x.beh !== 'trader' && x.beh !== 'hostage')) { a.hp = a.maxHp * 0.3; for (let k = 0; k < 20 && !a.dead && !a.wounded; k++) S.damageActor(g4, a, 2, 'bullet', null, null, 0); if (a.wounded) downed++; }
  ok(downed > 2, `some humans fall wounded (${downed})`);
  const w = g4.actors.find(a => a.wounded && a.faction === 'stalker');
  if (w) { g4.give('medkit'); place(g4, w.x + 1, w.z); talk(g4, w, [0]); ok(!w.wounded && w.hp > 30, 'medkit saves a wounded stalker'); }
  // path finding routes around anomalies
  const W = g.W, an = g.anomalies.find(a => a.type === 'electro'), path = W.findPath(an.x - 10, an.z, an.x + 10, an.z, 20000);
  ok(path && path.every(pt => Math.hypot(pt[0] - an.x, pt[1] - an.z) > 1), 'A* avoids anomaly cores');
}

// ---------------------------------------------------------------- full story run (with a save/load in the middle)
{
  let g = new S.Game({ skill: 1, seed: 99 }); const evs = g.events.map(e => e.t); g.events.length = 0;
  ok(evs.includes('dialog'), 'Sidorovich greets the player at the start');
  const sid = () => g.actorById('sidorovich');
  talk(g, sid(), [0, 0, 0]); ok(Q.active(g, 'q_wolf') && g.flags.intro_done, 'intro dialogue gives the first task');
  // Wolf sends the team to the depot
  const wolf = g.actorById('wolf'); place(g, wolf.x + 1.5, wolf.z); talk(g, wolf, [0, 0]);
  ok(Q.done(g, 'q_wolf') && Q.active(g, 'q_nimble', 0) && g.has('obrez'), 'Wolf gives the sawn-off and the rescue task');
  ok(g.group('atp_team').every(a => a.beh === 'goto'), 'Petrukha\'s team heads out');
  // meet at the gates: the assault begins
  place(g, 30, -104, Math.PI / 2); tick(g, 10); ok(Q.active(g, 'q_nimble', 1) && g.group('atp_team').some(a => a.beh === 'assault'), 'assault on the depot starts');
  g.god = true; tick(g, 60 * 20); killGroup(g, 'atp_bandits'); tick(g, 5);
  ok(Q.active(g, 'q_nimble', 2), 'depot cleared -> talk to Nimble');
  const nimble = g.actorById('nimble'); place(g, 57, -86); talk(g, nimble, [0]);
  ok(g.has('flash_nimble') && Q.done(g, 'q_nimble') && Q.active(g, 'q_flash') && g.has('aks74u'), 'Nimble hands over the flash drive');
  // side quests in the Cordon
  const tolik = g.actorById('tolik'); g.give('medkit'); talk(g, tolik, [0]); ok(Q.done(g, 'q_tolik') && !tolik.wounded, 'Tolik healed');
  place(g, wolf.x + 1.5, wolf.z); talk(g, wolf, [findOpt(g, wolf, /дело/), 0]); ok(Q.active(g, 'q_dogs'), 'dogs task taken');
  killGroup(g, 'farm_dogs'); tick(g, 2); ok(Q.active(g, 'q_dogs', 1), 'dogs dead'); talk(g, wolf, [findOpt(g, wolf, /Собаки/), 0]); ok(Q.done(g, 'q_dogs'), 'dogs task done');
  // back to Sidorovich
  const m0 = g.money; talk(g, sid(), [0, 0]); ok(Q.done(g, 'q_flash') && g.money === m0 + 1500 && Q.active(g, 'q_garbage', 0) && Q.active(g, 'q_seriy', 0), 'Sidorovich pays and sends the player to Garbage');
  talk(g, sid(), [findOpt(g, sid(), /работа/), 0]); ok(Q.active(g, 'q_medusa'), 'Jellyfish task');
  const medusa = g.items.find(i => i.id === 'medusa'); place(g, medusa.x, medusa.z); g.pickUp(medusa); ok(Q.active(g, 'q_medusa', 1), 'Jellyfish found');
  talk(g, sid(), [findOpt(g, sid(), /Медуза/), 0]); ok(Q.done(g, 'q_medusa'), 'Jellyfish delivered');
  // save & reload mid-game
  const data = JSON.parse(JSON.stringify(g.serialize()));
  g = S.Game.deserialize(data); g.events.length = 0;
  ok(g.levelId === 'cordon' && Q.active(g, 'q_garbage', 0) && g.has('aks74u') && g.groupDead('atp_bandits'), 'state survives save/load');
  // bribe the bridge post and go north
  const kuz = g.actorById('kuznetsov'); g.money = Math.max(g.money, 600); place(g, 20, 25, 0); talk(g, kuz, [0]); ok(g.flags.bridge_paid, 'bribe paid');
  g.god = true; place(g, 22, 45, 0); tick(g, 60 * 5); ok(g.group('bridge_army').every(a => !a.hostile), 'paid soldiers stay calm');
  place(g, 18, 70); tick(g, 3); ok(Q.active(g, 'q_garbage', 1), 'past the embankment');
  // farmstead bandits for Fanatic
  const fan = g.actorById('fanatic'); talk(g, fan, [findOpt(g, fan, /помощь/), 0]); killGroup(g, 'farm_bandits'); tick(g, 2); ok(Q.active(g, 'q_farm', 1), 'farmstead cleared'); talk(g, fan, [findOpt(g, fan, /Хутор/), 0]); ok(Q.done(g, 'q_farm'), 'Fanatic pays');
  // travel to Garbage
  const ex = g.def.exits.find(e => e.id === 'to_garbage'); g.travel(ex); g.events.length = 0;
  ok(g.levelId === 'garbage' && g.levelStates.cordon && Q.done(g, 'q_garbage'), 'arrived at Garbage');
  place(g, 20, -100); tick(g, 3); ok(g.flags.hangar_attack && Q.active(g, 'q_seriy', 1) && g.group('hangar_attack').every(a => !a.hidden), 'bandits attack the hangar');
  tick(g, 60 * 15); killGroup(g, 'hangar_attack'); tick(g, 3); ok(Q.active(g, 'q_seriy', 2), 'attack repelled');
  const seriy = g.actorById('seriy'); ok(seriy && !seriy.dead, 'Seriy survived'); talk(g, seriy, [0, 0]); ok(Q.done(g, 'q_seriy') && Q.active(g, 'q_digger'), 'Seriy tells about Digger');
  // Fox, Bes
  place(g, -125, 115); tick(g, 3); ok(Q.active(g, 'q_fox') && g.group('fox_dogs').every(a => !a.hidden), 'Fox\'s dogs appear');
  killGroup(g, 'fox_dogs'); tick(g, 2); const fox = g.actorById('fox'); talk(g, fox, [0]); ok(Q.done(g, 'q_fox') && g.knownStashes.st_fox, 'Fox saved, stash revealed');
  place(g, -95, -50); tick(g, 3); ok(Q.active(g, 'q_bes'), 'Bes task'); killGroup(g, 'depot_bandits'); tick(g, 2); talk(g, g.actorById('bes'), [0]); ok(Q.done(g, 'q_bes') && g.knownStashes.st_wagon, 'Bes rescued');
  const st = g.stashes.find(s => s.id === 'st_wagon'); const n0 = g.inv.length; g.lootAll(st); ok(g.inv.length > n0, 'stash looted');
  // back and forth between levels keeps state
  g.travel(g.def.exits.find(e => e.id === 'to_cordon')); ok(g.levelId === 'cordon' && g.groupDead('atp_bandits') && g.actorById('nimble').beh !== 'hostage', 'Cordon remembers its state');
  g.travel(g.def.exits.find(e => e.id === 'to_garbage')); ok(g.levelId === 'garbage' && Q.done(g, 'q_seriy'), 'Garbage remembers its state');
  // Digger's PDA and the bloodsucker
  const bs = g.actors.find(a => a.type === 'bloodsucker'); place(g, 112, 118); tick(g, 60 * 6); ok(bs.ai.state === 'hunt', 'bloodsucker hunts');
  S.damageActor(g, bs, 1e6, 'bullet', 'player', null, 0); ok(bs.dead, 'bloodsucker killed');
  const pda = g.items.find(i => i.id === 'pda_digger'); ok(pda, 'Digger\'s PDA lies in the hangar'); place(g, pda.x, pda.z); g.pickUp(pda);
  ok(Q.done(g, 'q_digger') && Q.active(g, 'q_agroprom'), 'road to Agroprom');
  talk(g, seriy.dead ? g.actorById('seriy') : g.actorById('seriy'), [findOpt(g, g.actorById('seriy'), /КПК/), 0]); ok(g.flags.seriy_pda, 'Seriy reads the PDA');
  g.events.length = 0; g.travel(g.def.exits.find(e => e.id === 'to_agroprom'));
  ok(g.events.some(e => e.t === 'ending') && Q.done(g, 'q_agroprom'), 'ending reached');
  const mainDone = Object.keys(Q.QUESTS).filter(k => Q.QUESTS[k].main).every(k => Q.done(g, k));
  ok(mainDone, 'every main quest completed');
  ok(g.stats.rating > 300 && g.rank().at > 0, `rank grows (${g.stats.rating})`);
}

// ---------------------------------------------------------------- determinism
{
  const run = () => { const g = new S.Game({ skill: 2, seed: 5 }); g.events.length = 0; place(g, 40, -103, Math.PI / 2); tick(g, 600, i => ({ fwd: i % 90 < 45 ? 1 : 0, fire: i % 20 === 0 })); return [g.player.x, g.player.z, g.player.hp, g.actors.reduce((s, a) => s + a.hp, 0)].map(v => v.toFixed(4)).join(','); };
  ok(run() === run(), 'simulation is deterministic');
}

console.log(`stalker98: ${checks} checks passed`);
