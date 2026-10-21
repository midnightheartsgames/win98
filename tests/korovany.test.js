const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/korovany');
const SIM = ['kv-core', 'kv-data', 'kv-world', 'kv-body', 'kv-game', 'kv-ai', 'kv-quests'];
const ORDER = [...SIM, 'kv-tex', 'kv-models', 'kv-render', 'kv-audio', 'kv-screens', 'kv-ui'];
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();

for (const f of SIM) require(path.join(DIR, f + '.js'));
const K = globalThis.Korovany;
const D = K.DATA;

{
  const html = read('korovany.html'), index = read('index.html');
  let last = -1, lastIdx = -1;
  for (const f of ORDER) {
    const tag = `js/apps/korovany/${f}.js`;
    const i = html.indexOf(tag), j = index.indexOf(tag);
    ok(i > last, 'korovany.html loads ' + f + ' in order');
    ok(j > lastIdx, 'index.html loads ' + f + ' in order');
    last = i; lastIdx = j;
  }
  ok(index.includes('js/apps/korovany-app.js') && index.includes('css/apps/korovany.css'), 'index.html has app wrapper and css');
  const sources = [...ORDER.map(f => `js/apps/korovany/${f}.js`), 'js/apps/korovany-app.js', 'css/apps/korovany.css', 'tests/korovany.test.js', 'tools/korovany-shots.cjs'];
  for (const f of sources) {
    const src = read(f);
    ok(!/\/\*/.test(src), 'no block comments in ' + f);
    ok(!/^\s*\/\/(?!\s*#)/m.test(src) && !/[;{})]\s+\/\/\s/.test(src), 'no line comments in ' + f);
  }
  const texts = [...ORDER.map(f => read(`js/apps/korovany/${f}.js`)), read('js/apps/korovany-app.js')].join('\n');
  ok(!/Microsoft|Windows(?! NT)/.test(texts.replace(/Microsoft Sans Serif/g, '')), 'no real brand names in game text');
  const gm = read('js/game-manager.js');
  ok(/korovany: \{\s*id: 'korovany',\s*steam: true/.test(gm), 'sold in Steam');
  for (const f of ['js/desktop.js', 'js/taskbar.js', 'js/filesystem.js', 'js/apps/dialogs.js', 'js/apps/explorer.js']) ok(read(f).includes("isInstalled('korovany')") || read(f).includes('gmInstalled.includes(\'korovany\')'), f + ' gates korovany on install');
  ok(!/korovanyGranted/.test(gm), 'no granted flag');
}

const W = new K.World(1998);
{
  const P = W.places;
  ok(W.zoneAt(P.town.x, P.town.z) === 'folk', 'town in the zone of people');
  ok(W.zoneAt(P.palace.x, P.palace.z) === 'emp', 'palace in the emperor zone');
  ok(W.zoneAt(P.village.x, P.village.z) === 'elf', 'village in the elf zone');
  ok(W.zoneAt(P.fort.x, P.fort.z) === 'evil', 'fort in the evil zone');
  ok(P.fort.h > 45 && P.fort.h > W.height(P.town.x, P.town.z) + 30, 'fort stands in the mountains');
  let elfTrees = 0;
  for (let i = 0; i < W.treeCount; i++) if (W.zoneAt(W.tx[i], W.tz[i]) === 'elf') elfTrees++;
  ok(elfTrees > 12000, 'dense forest in the elf zone: ' + elfTrees);
  ok(W.treeCount - elfTrees < elfTrees / 4, 'other zones are much sparser');
  const area = (z) => { let n = 0; for (let x = -590; x < 590; x += 10) for (let y = -590; y < 590; y += 10) if (W.zoneAt(x, y) === z) n++; return n; };
  for (const z of ['folk', 'emp', 'elf', 'evil']) ok(area(z) > 1500, 'zone ' + z + ' has area');
  for (const [a, b] of [['town', 'palace'], ['town', 'fort'], ['town', 'village'], ['palace', 'fort'], ['palace', 'village'], ['village', 'camp']]) {
    const r = W.roadRoute(a, b); ok(r && r.length > 5, 'road ' + a + ' to ' + b);
  }
  for (const id of ['throne', 'commander', 'gate_post', 'elder', 'wartable', 'villain', 'shop_pros', 'shop_healer', 'shop_inn', 'shop_forge', 'shop_recruit', 'shop_herbs', 'shop_carver', 'barracks_in', 'lookout']) {
    const s = W.spots[id]; ok(s, 'spot ' + id);
    const solid = W.nearColliders(s.x, s.z, 0.4, []).some(c => !c.roof && W.colTop(c, s.x, s.z) != null && c.t !== 'ramp' && W.colTop(c, s.x, s.z) > (s.y != null ? s.y : W.height(s.x, s.z)) + 0.7 && c.y0 < (s.y != null ? s.y : W.height(s.x, s.z)) + 1.6);
    ok(!solid, 'spot ' + id + ' is not inside a wall');
  }
  ok(W.burn.elf_tower && W.villageHouses.length >= 8, 'elf houses and tower burn');
  ok(Object.keys(W.burn).filter(k => k.startsWith('fort_tent')).length === 3, 'three fort supply tents');
  ok(W.gates.palace_gate && W.gates.fort_gate, 'two breakable gates');
  const path1 = W.findPath(P.town.x, P.town.z, W.spots.shop_pros.x, W.spots.shop_pros.z, 8000);
  ok(path1 && path1.complete, 'path into the prosthetist house');
  const pth = W.findPath(W.spots.gate_out.x, W.spots.gate_out.z, W.spots.throne.x, W.spots.throne.z + 3, 20000);
  ok(pth && pth.complete, 'path from the palace gate to the throne');
  const wallY = W.routes.wallY, w0 = W.routes.wall[0];
  ok(Math.abs(W.floorAt(w0[0], w0[1], wallY + 0.2, 0.65) - wallY) < 0.01, 'palace wall walkway is walkable');
  const ramp = W.colliders.find(c => c.t === 'ramp');
  ok(ramp, 'ramps exist');
}

function newGame(fac, seed) { return new K.Game({ faction: fac, world: W, seed: seed || 7, name: 'Тест' }); }
function steps(g, sec) { for (let i = 0; i < Math.round(sec * 60); i++) g.step(); }

{
  const g = newGame('elf');
  const p = g.player;
  ok(p.elf && p.equip.main === 'elfblade' && p.equip.ranged === 'bow', 'elf starts with blade and bow');
  ok(g.actors.length > 80, 'valley is populated: ' + g.actors.length);
  for (const k of ['commander', 'emperor', 'elder', 'villain', 'prosthetist', 'healer', 'recruiter', 'evilsmith']) ok(g.actors.some(a => a.kind === k), 'npc ' + k);
  ok(g.actors.filter(a => a.kind === 'cow').length >= 8, 'cows graze');
  ok(g.actors.some(a => a.kind === 'veteran' && Object.keys(a.pros).length), 'some veterans have prosthetics');
  const ev = newGame('evil');
  ok(!ev.actors.some(a => a.kind === 'villain' && !a.player), 'playing as Evil removes the NPC villain');
  ok(ev.player.pros.armL === 'ironarm' && ev.sees(ev.player, 'R'), 'Evil has an iron arm and sees with the crystal eye');
  ok(ev.army().length === 2, 'Evil starts with two soldiers');
  const t = Date.now(); steps(g, 30);
  ok(Date.now() - t < 9000, '30 s of valley sim runs fast: ' + (Date.now() - t) + ' ms');
}

{
  const g = newGame('elf'), p = g.player, B = K.Body;
  g.computePose(p);
  const caps = B.capsules(p, p.joints);
  ok(caps.length === 10, 'ten body capsules');
  const head = caps.find(c => c.part === 'head'), legs = caps.filter(c => c.part.startsWith('leg'));
  ok(head.a[1] > p.y + 1.4 && legs.every(c => Math.min(c.a[1], c.b[1]) < p.y + 0.6), 'head on top, legs below');
  const fx = Math.sin(p.yaw), fz = -Math.cos(p.yaw);
  const rx = Math.cos(p.yaw), rz = Math.sin(p.yaw);
  const ray = (y) => B.sweepHit(caps, [p.x + rx * 2 + fx * 0.05, y, p.z + rz * 2 + fz * 0.05], [p.x - rx * 2 + fx * 0.05, y, p.z - rz * 2 + fz * 0.05], 0.03);
  ok(ray(p.y + 1.7).cap.part === 'head', 'high blade hits the head');
  ok(ray(p.y + 0.3).cap.part.startsWith('leg'), 'low blade hits a leg');
  const wp = B.weaponPose('swing', 0.45, 0.75, 1), wh = B.weaponPose('swing', 0.45, 1.85, 1);
  ok(wp.hand[1] < wh.hand[1] && wp.dir[1] < 0, 'swing height follows the aim');
}

{
  const g = newGame('elf'), p = g.player;
  g.damagePart(p, null, 'armR', true, 80, { cut: 1.2, kind: 'swing' });
  ok(p.limbs.armR.state === 'lost' && p.limbs.armR.cut === 'lower', 'cut forearm is lost below the elbow');
  ok(p.bleed > 0 && g.pieces.length === 1, 'stump bleeds and the hand falls as a piece');
  ok(g.armUse(p, 'R') === 'none' && g.weaponOf(p).id === 'elfblade' && p.leftMain, 'weapon moves to the left hand');
  const swingL = (() => { p.atk = null; p.cd = 0; g.startMelee(p, g.weaponOf(p)); const d = p.atk.dur; p.atk = null; return d; })();
  ok(swingL > D.ITEMS.elfblade.time * 1.15, 'left hand swings slower');
  p.limbs.armL.state = 'lost'; p.limbs.armL.cut = 'upper';
  ok(g.weaponOf(p).id === 'kick', 'without arms you kick');
  p.limbs.armL.state = 'ok'; p.limbs.armL.cut = null;
  const hp0 = p.hp; steps(g, 5); ok(p.hp < hp0 - 3, 'bleeding drains health');
  ok(g.useBandage(p), 'bandage starts'); steps(g, 3);
  ok(p.bleed === 0 && p.stumps.every(s => s.bandaged), 'bandage stops the bleeding');
  const g2 = newGame('elf'), q = g2.player;
  g2.damagePart(q, null, 'legL', false, 90, { cut: 1.6, kind: 'chop' });
  ok(q.limbs.legL.state === 'lost' && g2.mobility(q).mode === 'crawl', 'without a leg you crawl');
  q.inv = q.inv.filter(s => s.id !== 'bandage' && s.id !== 'herbs' && s.id !== 'potion');
  q.x = -100; q.z = 300; q.y = W.groundAt(q.x, q.z); g2.updateCells();
  steps(g2, 120);
  ok(q.dead && q.cause === 'bleed', 'untreated stump kills: ' + q.cause);
  const g6 = newGame('elf'), m = g6.player;
  g6.damagePart(m, null, 'armL', false, 90, { cut: 1.6, kind: 'chop' });
  m.inv = m.inv.filter(s => s.id !== 'bandage' && s.id !== 'herbs' && s.id !== 'potion');
  const herb = g6.actors.find(a => a.kind === 'herbalist');
  m.x = herb.x + 8; m.z = herb.z; m.y = W.groundAt(m.x, m.z); g6.updateCells();
  steps(g6, 25);
  ok(!m.dead && m.bleed === 0, 'a friendly medic runs over and bandages you');
  const g3 = newGame('elf'), r = g3.player;
  g3.damagePart(r, null, 'legR', true, 90, { cut: 1.6, kind: 'chop' });
  g3.give(r, 'chair', 1); g3.give(r, 'pegleg', 1); g3.give(r, 'ironleg', 1);
  ok(g3.fitPros(r, 'pegleg', false) === 'bleeding', 'no prosthetic on a bleeding stump');
  r.stumps.forEach(s => s.bandaged = true); r.bleed = 0;
  ok(g3.fitPros(r, 'chair', false) === 'ok' && g3.mobility(r).mode === 'chair', 'wheelchair works without a leg');
  ok(g3.mobility(r).run > g3.mobility({ ...r, chair: false, limbs: r.limbs, pros: {}, skills: r.skills, hp: r.hp, maxHp: r.maxHp }).run, 'chair is faster than crawling');
  ok(g3.fitPros(r, 'pegleg', false) === 'ok' && g3.mobility(r).mode === 'walk' && g3.mobility(r).peg === 'R' && !g3.mobility(r).sprintOK, 'peg leg walks without sprint');
  ok(g3.fitPros(r, 'ironleg', false) === 'master', 'forged leg needs a master');
  r.gold = 100;
  ok(g3.serviceFit('pros', 'ironleg') === 'ok' && g3.mobility(r).sprintOK && g3.has(r, 'pegleg'), 'master fits the forged leg and returns the peg');
  const g4 = newGame('emp'), s = g4.player;
  s.eyes.L = 'lost';
  ok(!g4.sees(s, 'L') && g4.sees(s, 'R'), 'one eye lost');
  g4.give(s, 'glasseye', 1); g4.give(s, 'crystaleye', 1);
  ok(g4.fitPros(s, 'glasseye', false) === 'ok' && !g4.sees(s, 'L'), 'glass eye does not see');
  s.gold = 50;
  ok(g4.serviceFit('pros', 'crystaleye') === 'ok' && g4.sees(s, 'L'), 'crystal eye restores the half of the view');
  const g5 = newGame('elf'), v = g5.player;
  let heads = 0, eyes = 0;
  for (let i = 0; i < 200; i++) {
    const t = g5.spawn('guard', v.x + 30, v.z, {});
    t.equip.head = null;
    g5.damagePart(t, v, 'head', false, 60, { cut: 1.6, kind: 'chop' });
    if (t.limbs.head.state === 'lost') heads++;
    const u = g5.spawn('guard', v.x + 30, v.z, {}); u.equip.head = null;
    g5.damagePart(u, v, 'head', false, 12, { cut: 0.4, kind: 'thrust' });
    g5.damagePart(u, v, 'head', false, 12, { cut: 0.4, kind: 'thrust' });
    if (u.eyes.L === 'lost' || u.eyes.R === 'lost') eyes++;
  }
  ok(heads > 20 && heads < 140, 'heads can be cut off: ' + heads + '/200');
  ok(eyes > 10, 'thrusts put out eyes: ' + eyes + '/200');
}

{
  const g = newGame('elf');
  const res = { lost: 0, dead: 0 };
  const kinds = [['guard', 'blackguard'], ['spearman', 'veteran'], ['warden', 'blackguard'], ['guard', 'warden']];
  for (let n = 0; n < 8; n++) {
    const [ka, kb] = kinds[n % 4];
    const x = -150 + n * 12;
    const a = g.spawn(ka, x, 100, {}), b = g.spawn(kb, x + 4, 100, {});
    a.ai.mode = b.ai.mode = null;
    a.tags.add('duel'); b.tags.add('duel');
  }
  g.player.x = -200; g.player.z = 140;
  g.updateCells();
  steps(g, 90);
  const duel = g.actors.filter(a => a.tags.has('duel'));
  res.dead = duel.filter(a => a.dead).length;
  res.lost = duel.reduce((s, a) => s + Object.values(a.limbs).filter(l => l.state === 'lost').length, 0);
  ok(res.dead >= 5, 'npc duels end with deaths: ' + res.dead + '/16');
  ok(duel.filter(a => a.dead).every(a => a.rag && a.rag.nj === 16), 'corpses are ragdolls');
  ok(g.decals.length > 10, 'blood stays on the ground');
  const c = duel.find(a => a.dead);
  ok(g.lootList(c).length > 0, 'corpses can be searched');
}

{
  const g = newGame('elf'), p = g.player;
  K.AI.launchCaravan(g, 'supply', { tag: 'test' });
  const w = g.wagons.find(x => x.tag === 'test');
  ok(w && w.cows.length === 2 && g.byId.get(w.driver).wagonSeat === w.id && w.guards.length >= 2, 'caravan has cows, driver and guards');
  steps(g, 20);
  ok(w.idx > 1 && w.moving, 'caravan moves along the road');
  const repBefore = g.rep.emp;
  let robbed = null; g.emit = ((orig) => (type, d) => { if (type === 'rob') robbed = d; orig.call(g, type, d); })(g.emit);
  for (const id of w.guards) g.kill(g.byId.get(id), p, 'wound');
  const gold0 = p.gold;
  g.loot(w.cargo, 'gold');
  ok(robbed && robbed.fac === 'emp' && w.robbed, 'taking from the wagon robs the caravan');
  ok(p.gold > gold0 + 50, 'wages chest holds gold');
  ok(g.rep.emp < repBefore, 'robbing hurts the owner standing');
  g.loot(w.cargo, 'grain', 1);
  ok(g.has(p, 'grain'), 'goods can be taken');
  const pr = g.sellPrice('inn', 'grain');
  ok(g.sell('inn', 'grain') === 'ok' && pr > 5, 'inn buys grain');
}

{
  const g = newGame('emp'), p = g.player;
  p.gold = 2000;
  const price = g.buyPrice('pros', 'pegleg');
  ok(price < D.ITEMS.pegleg.price, 'guard treasury pays half of a prosthetic');
  ok(g.buy('pros', 'pegleg') === 'ok' && g.has(p, 'pegleg'), 'buying works');
  g.tryHaggle('smith');
  ok(['ok', 'fail'].includes(g.haggle.smith), 'haggling has an outcome');
  ok(g.tryHaggle('smith') === g.haggle.smith, 'one haggle per day');
  ok(g.buyHouse() === 'ok' && g.flags.house, 'a house in Развилки can be bought');
  ok(g.sleepAt({ kind: 'bed', bed: 'house' }) === 'ok', 'sleep in your own house');
  const e = newGame('elf');
  e.player.limbs.armL.state = 'broken'; e.player.hp = 40;
  ok(e.healCost('herbs') === 0, 'elves heal for free at the herbalist');
  ok(e.serviceHeal('herbs') === 'ok' && e.player.limbs.armL.state === 'ok' && e.player.hp === e.player.maxHp, 'healer mends broken limbs');
  const v = newGame('evil');
  v.player.gold = 120;
  ok(v.recruit() === 'ok' && v.recruit() === 'ok' && v.recruit() === 'gold', 'Evil recruits two soldiers for 120 gold');
  ok(v.army().length === 4, 'army grows');
  ok(v.buyPrice('forge', 'hook') === Math.round(D.ITEMS.hook.price * v.priceMod('forge') * 0.5), 'fort smithy forges hooks at half price');
}

{
  const g = newGame('emp');
  let arrest = 0;
  const orig = g.emit.bind(g); g.emit = (t, d) => { if (t === 'arrest') arrest++; orig(t, d); };
  K.Quests.breach(g, 'post'); K.Quests.breach(g, 'march');
  ok(g.reprimands === 2 && arrest === 0, 'two reprimands');
  ok(K.Quests.wage(g) === 'reprimand', 'no wages with reprimands');
  K.Quests.breach(g, 'rob');
  ok(arrest === 1, 'third reprimand means arrest');
  g.player.gold = 200;
  ok(K.Quests.resolveArrest(g, 'fine') === 'ok' && g.reprimands === 0 && g.player.gold === 50, 'fine clears reprimands');
  ok(K.Quests.wage(g) === 'ok' && K.Quests.wage(g) === 'paid', 'daily wage once a day');
}

{
  const g = newGame('elf'), p = g.player;
  p.limbs.armL.state = 'lost'; p.limbs.armL.cut = 'upper'; p.pros.armL = 'woodarm'; p.eyes.R = 'lost'; p.pros.eyeR = 'glasseye';
  p.gold = 777; g.flags.house = true;
  K.AI.launchCaravan(g, 'merchant');
  steps(g, 3);
  const data = JSON.parse(JSON.stringify(g.serialize()));
  const g2 = K.Game.deserialize(data, { world: new K.World(1998) });
  const q = g2.player;
  ok(q.limbs.armL.state === 'lost' && q.pros.armL === 'woodarm' && q.eyes.R === 'lost' && q.pros.eyeR === 'glasseye', 'save keeps injuries and prosthetics');
  ok(q.gold === 777 && g2.flags.house && g2.pf === 'elf', 'save keeps gold, house and side');
  ok(g2.actors.length === g.actors.length, 'save keeps every actor');
  ok(g2.wagons.length === g.wagons.length, 'save keeps caravans');
  steps(g2, 3);
  ok(!q.dead, 'restored game runs');
}

{
  const g = newGame('elf'), p = g.player;
  g.flags.seen = { town: true };
  ok(g.fastTravel('town') === 'ok' && Math.hypot(p.x - W.places.town.x, p.z - W.places.town.z) < 30, 'fast travel to a known place');
  ok(g.time > 8 * 60 + 5, 'travel takes time');
}

function killTagged(g, tag) { for (const a of g.actors) if (a.tags.has(tag) && !a.dead) g.kill(a, g.player, 'wound'); }
function advance(g, sec) { for (let i = 0; i < sec * 60; i++) { g.step(); if (g.player.dead) { g.player.dead = false; g.player.hp = g.player.maxHp; } g.player.hp = Math.max(g.player.hp, 60); g.player.bleed = 0; } }
function stepTo(g, i) { ok(g.quest.step === i && g.quest.state === 'offer', 'step ' + i + ' offered (' + g.quest.step + ' ' + g.quest.state + ')'); K.Quests.accept(g); }
function finish(g, name) {
  for (let k = 0; k < 30 && g.quest.state !== 'done'; k++) advance(g, 1);
  ok(g.quest.state === 'done' || g.quest.state === 'offer' || g.quest.state === 'finished', name + ' done (' + g.quest.state + ')');
  if (g.quest.state === 'done') K.Quests.complete(g);
}
function safe(g) { const p = g.player; p.hp = 1e6; p.maxHp = 1e6; }

{
  const g = newGame('elf'); safe(g);
  let ending = null; const o = g.emit.bind(g); g.emit = (t, d) => { if (t === 'ending') ending = d.fac; o(t, d); };
  stepTo(g, 0); advance(g, 3); ok(g.actors.some(a => a.tags.has('q_scouts')), 'scouts come'); killTagged(g, 'q_scouts'); finish(g, 'e1');
  stepTo(g, 1); const w = g.wagons.find(x => x.tag === 'q_caravan'); ok(w, 'quest caravan'); g.loot(w.cargo, 'gold'); finish(g, 'e2');
  stepTo(g, 2); advance(g, 1); killTagged(g, 'q_raid'); finish(g, 'e3');
  stepTo(g, 3); const ch = W.containers.find(c => c.id === 'barracks_chest'); g.loot(ch, 'rota'); finish(g, 'e4');
  stepTo(g, 4); advance(g, 1); killTagged(g, 'q_evilraid'); advance(g, 1); const s = g.wagons.find(x => x.tag === 'q_smuggle'); ok(s, 'smuggler caravan'); g.loot(s.cargo, s.cargo.items[0][0]); finish(g, 'e5');
  stepTo(g, 5); ok(g.actors.filter(a => a.tags.has('q_partisans')).length === 4, 'four partisans follow'); g.ignite('fort_tent0', g.player); g.ignite('fort_tent1', g.player); finish(g, 'e6');
  stepTo(g, 6); const v = g.actors.find(a => a.kind === 'villain'); ok(v.tags.has('q_final') && Math.hypot(v.x - W.places.village.x, v.z - W.places.village.z) < 300, 'Evil leads his army into the forest'); g.kill(v, g.player, 'wound'); finish(g, 'e7');
  ok(ending === 'elf' && g.quest.ended === 'elf', 'elf ending');
}

{
  const g = newGame('emp'); safe(g);
  let ending = null; const o = g.emit.bind(g); g.emit = (t, d) => { if (t === 'ending') ending = d.fac; o(t, d); };
  const p = g.player, S = W.spots;
  stepTo(g, 0); p.x = S.gate_post.x; p.z = S.gate_post.z; p.y = W.groundAt(p.x, p.z); g.updateCells();
  advance(g, 60);
  const spy = g.actors.find(a => a.tags.has('q_gatespy'));
  ok(spy && spy.disguised, 'spy in a hood comes to the gate');
  K.AI.reveal(g, spy, p); ok(spy.revealed && g.hostile(spy, p), 'pulling the hood reveals the spy');
  spy.arrested = true; g.emit('arrest', { id: spy.id, tags: [...spy.tags] });
  g.passTime(200, false); p.x = S.gate_post.x; p.z = S.gate_post.z;
  finish(g, 'g1'); ok(g.reprimands === 0, 'stood the post without reprimands');
  stepTo(g, 1); p.x = W.places.town.x; p.z = W.places.town.z; g.updateCells(); advance(g, 1);
  const w = g.wagons.find(x => x.tag === 'q_escort'); ok(w, 'escort caravan leaves'); ok(g.actors.some(a => a.tags.has('q_ambush')), 'elves wait in ambush');
  killTagged(g, 'q_ambush');
  for (const x of g.wagons.filter(x => x.group === w.group)) { K.AI.wagonSkip(g, x, 999); }
  p.x = w.x; p.z = w.z; g.updateCells(); finish(g, 'g2');
  stepTo(g, 2); const ts = g.actors.find(a => a.tags.has('q_townspy')); ok(ts && g.actors.filter(a => a.tags.has('q_decoy') && a.equip.head === 'hood').length >= 2, 'spy hides among hooded townsfolk');
  K.AI.reveal(g, ts, p); g.kill(ts, p, 'wound'); finish(g, 'g3');
  stepTo(g, 3); const c = g.actors.find(a => a.kind === 'commander'); ok(c.ai.squad, 'commander leads the raid'); for (const id of g.world.villageHouses.slice(0, 3)) g.ignite(id, p); advance(g, 2); p.x = S.commander.x; p.z = S.commander.z; g.updateCells(); finish(g, 'g4');
  stepTo(g, 4); ok(W.gates.palace_gate.closed, 'palace gate closes'); advance(g, 1); killTagged(g, 'q_assault'); finish(g, 'g5'); ok(!W.gates.palace_gate.closed, 'gate reopens');
  stepTo(g, 5); p.x = S.lookout.x; p.z = S.lookout.z; p.y = W.groundAt(p.x, p.z); g.updateCells(); advance(g, 14); p.x = S.commander.x; p.z = S.commander.z; g.updateCells(); finish(g, 'g6');
  stepTo(g, 6); ok(W.gates.fort_gate.closed, 'fort gate closes for the storm'); const v = g.actors.find(a => a.kind === 'villain'); g.kill(v, p, 'wound'); finish(g, 'g7');
  ok(ending === 'emp', 'guard ending');
}

{
  const g = newGame('evil'); safe(g);
  let ending = null; const o = g.emit.bind(g); g.emit = (t, d) => { if (t === 'ending') ending = d.fac; o(t, d); };
  const p = g.player;
  stepTo(g, 0); p.gold = 200; g.recruit(); g.recruit(); finish(g, 'v1');
  for (let k = 0; k < 7 && g.quest.state === 'offer' && g.quest.step === 1; k++) break;
  stepTo(g, 1); let n = 0; for (const w of g.wagons.filter(x => !x.robbed)) { if (n >= 2) break; g.loot(w.cargo, w.cargo.items[0][0]); n++; }
  if (n < 2) { K.AI.launchCaravan(g, 'merchant'); const w = g.wagons.find(x => !x.robbed); g.loot(w.cargo, w.cargo.items[0][0]); }
  finish(g, 'v2');
  stepTo(g, 2); advance(g, 1); killTagged(g, 'q_v3'); finish(g, 'v3');
  stepTo(g, 3); g.ignite('elf_tower', p); finish(g, 'v4');
  stepTo(g, 4); killTagged(g, 'q_v5'); finish(g, 'v5');
  stepTo(g, 5); ok(W.gates.palace_gate.closed && g.army().length >= 10, 'palace closes, army gathers: ' + g.army().length);
  for (const a of g.army()) { a.ai.order = 'palace'; }
  advance(g, 2);
  ok(g.army().some(a => a.ai.route), 'army marches by the roads');
  g.damageGate(W.gates.palace_gate, 9999, p);
  advance(g, 1);
  ok(g.quest.step === 6 && g.quest.state === 'active', 'broken gate opens the last goal');
  const emp = g.actors.find(a => a.kind === 'emperor'); g.kill(emp, p, 'wound');
  advance(g, 1);
  ok(g.quest.state === 'active', 'still need to carve the name');
  p.name = 'Ратмир'; g.flags.carved = true; g.emit('carve', { name: 'Ратмир' });
  advance(g, 1);
  ok(ending === 'evil' && g.quest.ended === 'evil', 'evil ending after carving the name');
}

{
  const g = newGame('elf');
  let raids = 0, caravans = 0, spies = 0;
  const o = g.emit.bind(g); g.emit = (t, d) => { if (t === 'squad') raids++; if (t === 'caravan') caravans++; if (t === 'spy') spies++; o(t, d); };
  g.passTime(3 * 1440, false);
  ok(caravans >= 6, 'caravans keep running: ' + caravans);
  ok(raids >= 2, 'raids keep coming: ' + raids);
  ok(spies >= 2, 'spies sneak around: ' + spies);
}

console.log('korovany: ' + checks + ' checks passed in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
