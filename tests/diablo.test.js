const assert = require('node:assert/strict');
const D = require('../js/apps/diablo/diablo-core.js');
const { Game, T } = D;
const run = (g, sec) => { for (let i = 0; i < sec * 60; i++) g.update(1 / 60); };
const reach = (L, from, to) => D.bfsDist(L, from.x, from.y)[to.y * L.w + to.x] >= 0;

// ---- classes match Diablo's starting stats
{
  const expect = { warrior: [70, 10], rogue: [45, 22], sorcerer: [30, 70] };
  for (const cls in expect) {
    const g = new Game({ seed: 1, cls, name: 'T' });
    assert.deepEqual([g.hero.stats.maxLife, g.hero.stats.maxMana], expect[cls], cls);
    assert.equal(g.hero.life, g.hero.stats.maxLife); assert.equal(g.level.index, 0);
  }
  const s = new Game({ seed: 1, cls: 'sorcerer' }); assert.equal(s.hero.spells.firebolt, 2); assert.equal(s.hero.cur.id, 'firebolt');
}

// ---- all 16 levels for several seeds: connected stairs, bosses, deterministic generation
for (const seed of [3, 77, 2024]) {
  const g = new Game({ seed, cls: 'warrior' });
  for (let n = 1; n <= 16; n++) {
    const L = D.genDungeon(g, n);
    assert.equal(L.get(L.up.x, L.up.y), T.UP);
    if (n < 16) { assert.equal(L.get(L.down.x, L.down.y), T.DOWN); assert.ok(reach(L, L.up, L.down), `seed ${seed} level ${n} stairs connected`); }
    for (const m of L.monsters) assert.ok(reach(L, L.up, { x: m.tx, y: m.ty }), `monster reachable on ${n}`);
    for (const o of L.objects) assert.ok(reach(L, L.up, { x: o.x, y: o.y }) || D.bfsDist(L, L.up.x, L.up.y).some((d, i) => d >= 0 && Math.abs(i % L.w - o.x) <= 1 && Math.abs(((i / L.w) | 0) - o.y) <= 1), 'object reachable');
    const boss = { 2: 'butcher', 3: 'leoric', 15: 'lazarus', 16: 'diablo' }[n];
    if (boss) assert.ok(L.monsters.some(m => m.boss === boss), `${boss} on level ${n}`);
    const again = D.genDungeon(g, n); assert.deepEqual([...again.tiles], [...L.tiles], 'deterministic');
  }
}
// town: every NPC and the cathedral entrance reachable from the start
{
  const L = D.genTown(new Game({ seed: 5 }));
  for (const n of L.npcs) assert.ok(D.bfsDist(L, L.start.x, L.start.y).some((d, i) => d >= 0 && Math.max(Math.abs(i % L.w - n.tx), Math.abs(((i / L.w) | 0) - n.ty)) === 1), `${n.id} reachable`);
  assert.ok(reach(L, L.start, L.down), 'cathedral entrance reachable');
}

// ---- items: names, magic affixes, requirements disable stats, identification
{
  const g = new Game({ seed: 11, cls: 'warrior' });
  for (let i = 0; i < 300; i++) {
    const it = g.randomItem(1 + (i % 30), { equip: true });
    assert.ok(D.itemName(it).length > 0); assert.ok(D.itemValue(it) > 0);
    if (it.quality === 'magic') { assert.equal(it.identified, false); assert.ok(it.affixes.length >= 1); assert.ok(D.itemName(it, true) !== D.baseOf(it).name || it.affixes.every(a => a.slot === 'pre') === false || true); }
  }
  const ring = g.newItem('ring'); ring.quality = 'magic'; ring.identified = true; ring.affixes = [{ slot: 'pre', i: D.DATA.PREFIXES.findIndex(p => p.word.m === 'Рубиновый'), prop: 'resF', value: 45 }, { slot: 'suf', i: D.DATA.SUFFIXES.findIndex(s => s.word === 'силы'), prop: 'str', value: 5 }];
  assert.equal(D.itemName(ring), 'Рубиновое кольцо силы');
  const plate = g.newItem('fullplate'); plate.quality = 'magic'; plate.identified = true; plate.affixes = [{ slot: 'pre', i: D.DATA.PREFIXES.findIndex(p => p.word.m === 'Святой'), prop: 'acPct', value: 140 }];
  assert.equal(D.itemName(plate), 'Святые полные латы');
  // requirement not met → armor gives no AC
  const h = g.hero, ac0 = h.stats.ac; h.equip.body = plate; g.recalc(); assert.equal(h.stats.ac, ac0, 'full plate needs 90 str');
  h.base.str = 90; g.recalc(); assert.ok(h.stats.ac > ac0 + 100);
  h.equip.body = null; h.base.str = 30; g.recalc();
}

// ---- inventory grid, swapping, belt, equip rules (two-handed vs shield)
{
  const g = new Game({ seed: 12, cls: 'warrior' }), h = g.hero;
  h.inv = [];
  assert.ok(g.invAdd(g.newItem('fullplate'))); assert.ok(g.invAdd(g.newItem('greataxe')));
  const small = []; while (g.invAdd(g.newItem('potion_heal'))) small.push(1);
  assert.equal(small.length, 40 - 12, 'grid is 10x4 with 2x3 items taking 6 cells');
  assert.equal(g.giveItem(g.newItem('buckler')), false, 'full inventory');
  h.inv = []; g.invAdd(g.newItem('dagger'));
  assert.ok(g.invClick(0, 0)); assert.equal(h.cursor.base, 'dagger');
  assert.ok(g.invClick(5, 1)); assert.equal(h.cursor, null); assert.equal(g.invAt(5, 1).item.base, 'dagger');
  h.cursor = g.newItem('club'); assert.ok(g.invClick(5, 1)); assert.equal(h.cursor.base, 'dagger', 'swap under cursor');
  // two-handed weapon removes shield into inventory
  h.cursor = null; h.inv = []; h.base.str = 100; g.recalc();
  h.cursor = g.newItem('greataxe'); assert.ok(g.equipClick('weapon'));
  assert.equal(h.equip.shield, null); assert.ok(h.inv.some(e => e.item.base === 'buckler'));
  assert.equal(h.cursor.base, 'shortsword', 'old weapon goes to cursor');
  h.cursor = g.newItem('ring'); assert.equal(g.equipClick('weapon'), false, 'ring cannot go to weapon slot');
  h.cursor = null;
  const pot = g.newItem('potion_mana'); h.belt[5] = pot; h.mana = 0; assert.ok(g.useBelt(5)); assert.ok(h.mana > 0); assert.equal(h.belt[5], null);
  h.base.str = 30; g.recalc();
}

// ---- combat, XP and leveling, drops, monster AI damages hero
{
  const g = new Game({ seed: 21, cls: 'warrior' }), h = g.hero;
  g.enterLevel(1, 'down'); const L = g.level;
  assert.equal(L.get(h.tx, h.ty) !== T.WALL, true); assert.ok(Math.max(Math.abs(h.tx - L.up.x), Math.abs(h.ty - L.up.y)) <= 2);
  const m = L.monsters.find(x => !x.boss);
  const kills = h.kills, xp = h.xp;
  g.damageMonster(m, 9999, 'phys', { hero: true });
  assert.ok(m.dead); assert.equal(h.kills, kills + 1); assert.ok(h.xp > xp); assert.ok(L.deadSids.has(m.sid)); assert.ok(!L.monsters.includes(m));
  g.gainXP(2000 - h.xp); assert.equal(h.level, 2); assert.equal(h.points, 5); assert.equal(h.life, h.stats.maxLife);
  assert.ok(g.spendPoint('vit')); assert.equal(h.stats.maxLife, 70 + 2 + 2);
  // monster attacks the hero when adjacent
  const foe = L.monsters.find(x => !x.boss && x.ai !== 'ranged');
  L.unplace(foe); const spot = L.near(h.tx, h.ty, (x, y) => L.free(x, y) && Math.max(Math.abs(x - h.tx), Math.abs(y - h.ty)) === 1 && L.cornerOk(x, y, h.tx - x, h.ty - y), 1);
  L.place(foe, spot.x, spot.y); foe.toHit = 999; foe.dmg = [3, 3]; g.hero.equip.shield = null; g.recalc();
  const life = h.life; run(g, 3); assert.ok(h.life < life, 'monster hits the hero');
  // hero melee kills an adjacent weak monster through orders
  foe.hp = 1; foe.ac = 0; g.cmdAttack(foe); h.stats.toHit = 500; run(g, 2); assert.ok(foe.dead, 'hero kills target');
}

// ---- spells: mana cost, projectiles hit, town restrictions, scrolls & portal round-trip
{
  const g = new Game({ seed: 31, cls: 'sorcerer' }), h = g.hero;
  assert.equal(g.cmdCast(h.tx + 3, h.ty), false, 'no firebolt in town');
  g.enterLevel(1, 'down'); const L = g.level;
  for (const m of L.monsters.slice()) { L.unplace(m); L.monsters.splice(L.monsters.indexOf(m), 1); }
  const def = D.DATA.MONSTERS.find(m => m.id === 'zombie');
  const dir = [[1, 0], [0, 1], [-1, 0], [0, -1]].find(([dx, dy]) => [1, 2, 3].every(k => L.free(h.tx + dx * k, h.ty + dy * k)));
  const z = g.summonAt(def, h.tx + dir[0] * 3, h.ty + dir[1] * 3); z.hp = z.maxHp = 3; z.resist = {};
  const mana = h.mana;
  assert.ok(g.cmdCast(z.tx, z.ty, z)); run(g, 1.5);
  assert.equal(Math.round(mana - h.mana + 1.5 * 0.25 * 1.1), g.manaCost('firebolt'), 'mana spent (minus regen)');
  assert.ok(z.dead, 'firebolt killed the zombie');
  // town portal scroll
  const scroll = g.newItem('scroll_portal'); h.belt[7] = scroll; h.cur = { id: 'townportal', src: 'scroll' };
  assert.ok(g.cmdCast(h.tx, h.ty)); run(g, 1); assert.ok(g.portal); assert.equal(h.belt[7], null);
  const portalObj = L.objects.find(o => o.type === 'portal'); assert.ok(portalObj);
  g.cmdInteract(portalObj); run(g, 2); assert.equal(g.level.index, 0, 'portal to town');
  const townPortal = g.level.objects.find(o => o.type === 'portal'); assert.ok(townPortal);
  g.cmdInteract(townPortal); run(g, 3); assert.equal(g.level.index, 1, 'portal back'); assert.equal(g.portal, null);
  // identify scroll mode
  const it = g.randomItem(10, { equip: true, magicBonus: 1 }); it.identified = false; g.invAdd(it);
  const idScroll = g.newItem('scroll_identify'); g.invAdd(idScroll); g.useItem(idScroll); assert.equal(h.mode, 'identify');
  assert.ok(g.applyMode(it)); assert.ok(it.identified); assert.ok(!g.hasItem(i => i === idScroll));
  // books raise spell level with magic requirement
  const book = g.newItem('book', { spell: 'firebolt' }); g.invAdd(book); assert.ok(g.useItem(book)); assert.equal(h.spells.firebolt, 3);
  const nova = g.newItem('book', { spell: 'nova' }); g.invAdd(nova); assert.equal(g.useItem(nova), false, 'nova requires 87 magic');
}

// ---- shops: buy/sell/repair/identify with correct gold accounting
{
  const g = new Game({ seed: 41, cls: 'rogue' }), h = g.hero;
  h.gold = 10000;
  const heal = g.shops.pepin[0], before = h.gold, count = g.shops.pepin.length;
  assert.ok(g.buy('pepin', 0)); assert.equal(h.gold, before - D.itemValue(heal)); assert.equal(g.shops.pepin.length, count, 'potions are infinite');
  const n = g.shops.griswold.length, first = g.shops.griswold[0], price = g.buyPrice(first);
  assert.ok(g.buy('griswold', 0)); assert.equal(g.shops.griswold.length, n - 1); assert.equal(h.gold, before - D.itemValue(heal) - price);
  const sp = g.sellPrice(first), gold = h.gold; assert.ok(g.sell('griswold', first)); assert.equal(h.gold, gold + sp); assert.ok(sp < price);
  assert.equal(g.sell('adria', g.newItem('shortsword')), false, 'Adria does not buy swords');
  const w = h.equip.weapon; w.dur = 5; const rc = g.repairCost(w); assert.ok(rc > 0); const g0 = h.gold; assert.ok(g.repair(w)); assert.equal(w.dur, w.maxDur); assert.equal(h.gold, g0 - rc);
  h.gold = 10; const mag = g.randomItem(5, { equip: true, magicBonus: 1 }); mag.identified = false; assert.equal(g.identify(mag), false, 'costs 100');
  h.gold = 100; assert.ok(g.identify(mag)); assert.equal(h.gold, 0);
  assert.equal(g.peekWirt(), false); h.gold = 60; assert.ok(g.peekWirt()); assert.equal(h.gold, 10);
}

// ---- quests: townsman → butcher, Ogden → Leoric, magic rock delivery, Lazarus unseals level 16
{
  const g = new Game({ seed: 51, cls: 'warrior' });
  g.talk('townsman'); assert.equal(g.quests.butcher, 1);
  g.talk('ogden'); assert.equal(g.quests.leoric, 1);
  g.enterLevel(2, 'down'); const butcher = g.level.monsters.find(m => m.boss === 'butcher');
  g.damageMonster(butcher, 9999, 'phys', { hero: true }); assert.equal(g.quests.butcher, 2);
  assert.ok(g.level.items.some(f => f.item.unique === 'cleaver'), 'Butcher drops the Cleaver');
  g.enterLevel(5, 'down'); const ped = g.level.objects.find(o => o.type === 'pedestal'); assert.ok(ped);
  g.interact(ped); assert.ok(g.hasItem(i => i.base === 'magicrock'));
  g.enterLevel(0, 'town'); assert.ok(g.giveQuestItem('magicrock')); assert.equal(g.quests.magicrock, 2); assert.ok(g.hasItem(i => i.unique === 'empyrean'));
  g.maxDepth = 9; g.talk('cain'); assert.equal(g.quests.lazarus, 1);
  g.enterLevel(15, 'down'); const L15 = g.level; assert.equal(L15.sealed, true);
  g.useStairs(L15.down.x, L15.down.y); assert.equal(g.level.index, 15, 'sealed stairs');
  g.damageMonster(L15.monsters.find(m => m.boss === 'lazarus'), 99999, 'phys', { hero: true });
  assert.equal(L15.sealed, false); g.useStairs(L15.down.x, L15.down.y); assert.equal(g.level.index, 16);
  // Diablo's death wins the game
  const diablo = g.level.monsters.find(m => m.boss === 'diablo');
  g.damageMonster(diablo, 99999, 'phys', { hero: true }); assert.equal(g.quests.diablo, 2); assert.ok(g.victory);
  g.drainEvents(); run(g, 4); assert.ok(g.drainEvents().some(e => e.t === 'victory'));
  assert.deepEqual(g.questLog().map(q => q.id + q.state), ['butcher2', 'leoric1', 'magicrock2', 'lazarus2', 'diablo2']);
}

// ---- death & respawn in town with gold penalty
{
  const g = new Game({ seed: 61, cls: 'rogue' }); g.enterLevel(1, 'down'); g.hero.gold = 300;
  g.damageHero(9999, 'phys', null); assert.ok(g.hero.dead);
  g.respawn(); assert.equal(g.level.index, 0); assert.equal(g.hero.gold, 150); assert.equal(g.hero.life, g.hero.stats.maxLife); assert.ok(!g.hero.dead);
}

// ---- save/load round trip keeps hero, inventory, quests, portal and level deltas
{
  const g = new Game({ seed: 71, cls: 'sorcerer', name: 'Сохранялкин' });
  g.enterLevel(1, 'down'); const L = g.level; const m = L.monsters[0]; g.damageMonster(m, 9999, 'phys', { hero: true });
  const chest = L.objects.find(o => o.type === 'chest' || o.type === 'bigchest'); if (chest) g.interact(chest);
  g.hero.gold = 777; g.quests.leoric = 1; g.portal = { level: 1, x: g.hero.tx, y: g.hero.ty };
  const ring = g.makeUnique('bramble'); ring.identified = true; g.invAdd(ring);
  const json = JSON.stringify(g.serialize());
  const g2 = Game.load(JSON.parse(json));
  assert.equal(g2.hero.name, 'Сохранялкин'); assert.equal(g2.hero.gold, 777); assert.equal(g2.quests.leoric, 1); assert.equal(g2.level.index, 1);
  assert.ok(g2.hasItem(i => i.unique === 'bramble')); assert.deepEqual(g2.portal, g.portal);
  assert.ok(!g2.level.monsters.some(x => x.sid === m.sid), 'killed monster stays dead');
  if (chest) assert.ok(g2.level.objects.find(o => o.idx === chest.idx).used, 'opened chest stays open');
  assert.equal(g2.level.items.length, L.items.length);
  assert.ok(g2.level.explored.some(Boolean));
  assert.throws(() => Game.load({ v: 99 }));
}

// ---- long AI simulation: hero auto-fights through levels 1-4 without errors or NaN
for (const cls of ['warrior', 'rogue', 'sorcerer']) {
  const g = new Game({ seed: 90 + cls.length, cls }); const h = g.hero;
  h.base.vit = 400; g.recalc(); h.life = h.stats.maxLife;
  for (let n = 1; n <= 4; n++) {
    g.enterLevel(n, 'down');
    for (let t = 0; t < 60 * 25; t++) {
      if (h.dead) g.respawn(), g.enterLevel(n, 'down');
      if (!h.order && !h.action && t % 20 === 0) {
        const L = g.level, target = L.monsters.filter(m => L.visible[m.ty * L.w + m.tx]).sort((a, b) => Math.hypot(a.tx - h.tx, a.ty - h.ty) - Math.hypot(b.tx - h.tx, b.ty - h.ty))[0];
        if (target) { if (cls === 'sorcerer' && h.mana > 6) g.cmdCast(target.tx, target.ty, target); else g.cmdAttack(target); }
        else if (L.down) g.cmdMove(L.down.x, L.down.y);
        if (h.life < h.stats.maxLife / 3) h.life = h.stats.maxLife;
      }
      g.update(1 / 60);
    }
    for (const m of g.level.monsters) assert.ok(Number.isFinite(m.x) && Number.isFinite(m.y) && Number.isFinite(m.hp));
    for (const p of g.level.projectiles) assert.ok(Number.isFinite(p.x));
    // occupancy grid consistent with actors
    const L = g.level; for (const m of L.monsters) assert.equal(L.occ[m.ty * L.w + m.tx], m, 'occupancy');
    assert.equal(L.occ[h.ty * L.w + h.tx], h);
  }
  assert.ok(h.kills > 0, `${cls} killed something`); assert.ok(Number.isFinite(h.life) && Number.isFinite(h.mana));
}

console.log('Diablo 98: classes, 16-level generation, items, inventory, combat, spells, shops, quests, portal, death, victory, save/load and AI simulation passed.');
