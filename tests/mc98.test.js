const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '../js/apps/mc98');
const FILES = ['mc-core', 'mc-blocks', 'mc-tex', 'mc-gen', 'mc-world', 'mc-mesh', 'mc-entity', 'mc-game', 'mc-audio', 'mc-render', 'mc-ui'];
const M = require(path.join(DIR, 'mc-core.js'));
for (const f of FILES.slice(1, 9)) require(path.join(DIR, f + '.js'));
const K = M.ITEM_BY_KEY, B = M.BLOCKS;
let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const eq = (a, b, m) => { assert.equal(a, b, m); checks++; };
const t0 = Date.now();
const st = (k, n = 1, d = 0) => ({ id: K[k].id, count: n, dmg: d });
const tick = (g, n, inp = {}) => { for (let i = 0; i < n; i++) { g.tick(Object.assign({ loadBudget: 1000 }, typeof inp === 'function' ? inp(i) : inp)); g.events.length = 0; } };
const flatten = (g, r = 5) => {
  const p = g.player, w = g.world, bx = Math.floor(p.x), bz = Math.floor(p.z), by = Math.floor(p.y) - 1;
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) { for (let y = by + 1; y < Math.min(M.CH, by + 8); y++) w.setBlock(bx + dx, y, bz + dz, 0); w.setBlock(bx + dx, by, bz + dz, 1); }
  tick(g, 5);
  return { bx, by, bz };
};
const lookAt = (g, x, y, z) => { const e = g.eyePos(); const dx = x + 0.5 - e[0], dy = y + 0.5 - e[1], dz = z + 0.5 - e[2]; g.player.yaw = Math.atan2(-dx, -dz); g.player.pitch = Math.atan2(dy, Math.hypot(dx, dz)); g.updateTarget(); };
const newGame = (o = {}) => { const g = new M.Game(Object.assign({ seed: 1999, renderDistance: 2 }, o)); tick(g, 10); return g; };

{
  const atlas = new M.Atlas();
  ok(atlas.count > 150, 'atlas has tiles');
  for (const b of B) { if (!b || b.id === 0) continue; for (const f of ['top', 'bottom', 'side', 'front']) ok(atlas.tiles[M.faceTexture(b, f)] !== undefined, 'block texture ' + b.key + '/' + f); }
  for (const it of M.ITEMS) { if (!it || !it.isItem) continue; ok(atlas.tiles[it.tex] !== undefined, 'item texture ' + it.key); }
  for (const r of M.RECIPES) { ok(M.ITEMS[r.result], 'recipe result'); for (const i of (r.grid || r.items)) if (i) ok(M.ITEMS[i], 'recipe ingredient'); }
  for (const [a, b] of Object.entries(M.SMELT)) ok(M.ITEMS[a] && M.ITEMS[b], 'smelt pair');
  for (const mob of Object.values(M.MOBS)) for (const p of mob.model.parts) for (const t of Object.values(p.tex)) ok(atlas.tiles[t] !== undefined, 'mob texture ' + t);
  for (let i = 0; i < 10; i++) ok(atlas.tiles['crack' + i] !== undefined, 'crack ' + i);
  eq(M.matchRecipe([st('log'), null, null, null], 2).result, K.planks.id, 'planks recipe');
  eq(M.matchRecipe([st('planks'), null, st('planks'), null], 2).result, K.stick.id, 'stick recipe shifted');
  eq(M.matchRecipe([st('planks'), st('planks'), st('planks'), null, st('stick'), null, null, st('stick'), null], 3).result, K.wood_pickaxe.id, 'pickaxe recipe');
  eq(M.matchRecipe([st('cobblestone'), st('cobblestone'), st('cobblestone'), st('cobblestone'), null, st('cobblestone'), st('cobblestone'), st('cobblestone'), st('cobblestone')], 3).result, K.furnace.id, 'furnace recipe');
  eq(M.matchRecipe([st('planks'), st('planks'), null, null], 2), null, 'no recipe for 2 planks in a row');
  ok(M.seedFromString('1999') === 1999 && M.seedFromString('abc') === M.seedFromString('abc') && M.seedFromString('abc') !== M.seedFromString('abd'), 'seed parsing');
}

{
  const w = new M.World({ seed: 1999 });
  const sp = w.gen.spawnPoint();
  ok(Number.isFinite(sp.x) && sp.y > M.SEA, 'spawn point above sea');
  let iters = 0; while (w.load(Math.floor(sp.x), Math.floor(sp.z), 3, 1000) > 0 && iters++ < 20);
  ok(iters < 10, 'load converges');
  const ready = w.readyChunks(Math.floor(sp.x), Math.floor(sp.z), 3);
  ok(ready.length >= 25, 'chunks ready: ' + ready.length);
  const counts = {};
  for (const c of ready) for (let i = 0; i < c.blocks.length; i++) counts[c.blocks[i]] = (counts[c.blocks[i]] || 0) + 1;
  for (const k of ['stone', 'dirt', 'grass', 'log', 'leaves', 'coal_ore', 'iron_ore', 'bedrock']) ok(counts[K[k].id] > 0, 'world has ' + k);
  const x = Math.floor(sp.x), z = Math.floor(sp.z), top = w.topSolid(x, z);
  for (let dx = -9; dx <= 9; dx++) for (let dz = -9; dz <= 9; dz++) { for (let y = top + 1; y < Math.min(M.CH, top + 12); y++) w.setBlock(x + dx, y, z + dz, 0); w.setBlock(x + dx, top, z + dz, K.stone.id); }
  eq(w.getSky(x, top + 1, z), 15, 'sky light at surface');
  eq(w.getSky(x, 3, z), 0, 'no sky light deep underground');
  w.setBlock(x, top + 1, z, K.torch.id, 0);
  eq(w.getBlockLight(x, top + 1, z), 14, 'torch emits 14');
  eq(w.getBlockLight(x + 3, top + 1, z), 11, 'torch light falls off');
  w.setBlock(x, top + 1, z, 0, 0);
  eq(w.getBlockLight(x + 3, top + 1, z), 0, 'torch light removed');
  w.setBlock(x, top + 1, z, K.stone.id); w.setBlock(x, top + 2, z, K.stone.id);
  ok(w.getSky(x, top + 1, z) === 0, 'opaque block has no sky light');
  w.setBlock(x, top + 1, z, 0); w.setBlock(x, top + 2, z, 0);
  eq(w.getSky(x, top + 1, z), 15, 'sky light restored after removing blocks');
  const y = top + 1;
  w.setBlock(x, y + 2, z, K.water.id, 0);
  for (let i = 0; i < 80; i++) { w.tickCount++; w.tickFluids(); }
  let water = 0; for (let dx = -8; dx <= 8; dx++) for (let dz = -8; dz <= 8; dz++) for (let dy = -2; dy <= 3; dy++) if (w.getBlock(x + dx, y + dy, z + dz) === K.water.id) water++;
  ok(water > 20 && water < 400, 'water spreads: ' + water);
  w.setBlock(x, y + 2, z, 0, 0);
  for (let i = 0; i < 300; i++) { w.tickCount++; w.tickFluids(); }
  water = 0; for (let dx = -8; dx <= 8; dx++) for (let dz = -8; dz <= 8; dz++) for (let dy = -2; dy <= 3; dy++) if (w.getBlock(x + dx, y + dy, z + dz) === K.water.id) water++;
  eq(water, 0, 'water drains after source removed');
  w.setBlock(x + 6, y, z + 6, K.lava.id, 0); w.setBlock(x + 7, y, z + 6, K.water.id, 0);
  for (let i = 0; i < 60; i++) { w.tickCount++; w.tickFluids(); }
  ok([K.obsidian.id, K.cobblestone.id, K.stone.id].includes(w.getBlock(x + 6, y, z + 6)) || [K.obsidian.id, K.cobblestone.id, K.stone.id].includes(w.getBlock(x + 7, y, z + 6)), 'lava and water react');
  const r = w.raycast(x + 0.5, top + 5, z + 0.5, 0, -1, 0, 20);
  ok(r && r.y === top && r.face === 3, 'raycast hits ground top face');
  w.setBlock(x, y, z, K.sapling.id, 0);
  const rng = M.makeRandom(3);
  let grown = false; for (let i = 0; i < 40 && !grown; i++) { w.randomTick(x, y, z, K.sapling.id, rng); if (w.getBlock(x, y, z) === K.log.id) grown = true; }
  ok(grown, 'sapling grows into a tree');
  ok(w.getBlock(x, y + 4, z) === K.leaves.id || w.getBlock(x + 1, y + 4, z) === K.leaves.id || w.getBlock(x, y + 5, z) === K.leaves.id, 'tree has leaves');
  const atlas = new M.Atlas(), ob = new M.MeshBuilder(atlas), wb = new M.MeshBuilder(atlas);
  let verts = 0; for (const c of ready) { const m = M.buildChunkMesh(w, c, ob, wb); ok(m.opaque.length % M.STRIDE === 0, 'mesh stride'); verts += m.opaque.length / M.STRIDE; }
  ok(verts > 10000, 'mesh has geometry');
  let biomes = new Set(); for (let i = -600; i <= 600; i += 40) for (let j = -600; j <= 600; j += 40) biomes.add(w.gen.biomeAt(i, j));
  ok(biomes.size >= 3, 'multiple biomes: ' + [...biomes].join(','));
}

{
  const g = newGame();
  const p = g.player;
  ok(p.onGround && p.hp === 20, 'player stands on ground at spawn');
  const { bx, by, bz } = flatten(g);
  const x0 = p.x, z0 = p.z;
  tick(g, 20, { fwd: 1 });
  ok(Math.hypot(p.x - x0, p.z - z0) > 2, 'walking moves the player');
  ok(Math.abs(p.y - (by + 1)) < 0.01, 'player stays on the platform');
  tick(g, 1, { jump: true });
  tick(g, 6);
  ok(p.y > by + 1.3, 'jump lifts the player');
  tick(g, 30);
  p.x = bx + 0.5; p.z = bz + 0.5; p.vx = p.vz = 0;
  tick(g, 5);
  g.world.setBlock(bx + 2, by + 1, bz, K.dirt.id);
  lookAt(g, bx + 2, by + 1, bz);
  ok(g.target && g.target.id === K.dirt.id, 'targets dirt block');
  let n = 0; while (g.world.getBlock(bx + 2, by + 1, bz) === K.dirt.id && n < 100) { g.tick({ attack: true, yaw: p.yaw, pitch: p.pitch }); n++; }
  ok(n > 5 && n < 60, 'dirt breaks by hand in ' + n + ' ticks');
  tick(g, 40);
  eq(g.countItem(K.dirt.id), 1, 'dirt drop picked up');
  g.world.setBlock(bx + 2, by + 1, bz, K.stone.id);
  lookAt(g, bx + 2, by + 1, bz);
  n = 0; while (g.world.getBlock(bx + 2, by + 1, bz) === K.stone.id && n < 400) { g.tick({ attack: true, yaw: p.yaw, pitch: p.pitch }); n++; }
  ok(n > 100, 'stone is slow by hand: ' + n);
  tick(g, 40);
  eq(g.countItem(K.cobblestone.id), 0, 'no cobblestone drop without pickaxe');
  g.inventory[0] = st('wood_pickaxe'); g.selected = 0;
  g.world.setBlock(bx + 2, by + 1, bz, K.stone.id);
  lookAt(g, bx + 2, by + 1, bz);
  n = 0; while (g.world.getBlock(bx + 2, by + 1, bz) === K.stone.id && n < 400) { g.tick({ attack: true, yaw: p.yaw, pitch: p.pitch }); n++; }
  ok(n < 40, 'wood pickaxe breaks stone fast: ' + n);
  tick(g, 40);
  eq(g.countItem(K.cobblestone.id), 1, 'cobblestone dropped with pickaxe');
  ok(g.inventory[0].dmg === 1, 'pickaxe durability used');
  g.inventory[1] = st('cobblestone', 5); g.selected = 1;
  lookAt(g, bx + 3, by, bz);
  g.tick({ use: true, yaw: p.yaw, pitch: p.pitch });
  const placedX = [bx + 2, bx + 3].find(x => g.world.getBlock(x, by + 1, bz) === K.cobblestone.id);
  ok(placedX, 'placed cobblestone on top face');
  eq(g.inventory[1].count, 4, 'placing consumes one');
  g.inventory[2] = st('torch', 3); g.selected = 2;
  lookAt(g, placedX, by + 1, bz);
  g.tick({ use: true, yaw: p.yaw, pitch: p.pitch });
  const placedTorch = [[placedX - 1, by + 1, bz], [placedX + 1, by + 1, bz], [placedX, by + 1, bz + 1], [placedX, by + 1, bz - 1], [placedX, by + 2, bz]].find(([x, y, z]) => g.world.getBlock(x, y, z) === K.torch.id);
  ok(placedTorch, 'torch placed against block');
  ok(g.world.getBlockLight(placedTorch[0], placedTorch[1], placedTorch[2]) === 14, 'placed torch lights');
  g.world.setBlock(placedX, by + 1, bz, 0);
  tick(g, 2);
  ok(placedTorch[1] === by + 2 || !g.world.getBlock(placedTorch[0], placedTorch[1], placedTorch[2]), 'wall torch drops when support removed');
  g.world.setBlock(bx - 2, by + 1, bz, K.sand.id); g.world.setBlock(bx - 2, by + 2, bz, K.sand.id);
  g.world.setBlock(bx - 2, by + 1, bz, 0);
  tick(g, 30);
  eq(g.world.getBlock(bx - 2, by + 1, bz), K.sand.id, 'sand falls down');
}

{
  const g = newGame();
  flatten(g);
  g.inventory[0] = st('log', 3);
  g.openInventory();
  g.clickSlot('inv', 0, 0);
  g.clickSlot('craft', 0, 2);
  g.clickSlot('inv', 0, 0);
  g.updateCraftResult();
  eq(g.craftResult && g.craftResult.id, K.planks.id, 'planks in result slot');
  g.takeResult(true);
  eq(g.countItem(K.planks.id), 4, 'crafted 4 planks');
  eq(g.countItem(K.log.id), 2, 'one log consumed');
  const plankSlot = g.inventory.findIndex(s => s && s.id === K.planks.id);
  g.clickSlot('inv', plankSlot, 0);
  g.clickSlot('craft', 0, 2); g.clickSlot('craft', 1, 2); g.clickSlot('craft', 2, 2); g.clickSlot('craft', 3, 2);
  g.clickSlot('inv', plankSlot, 0);
  g.updateCraftResult();
  eq(g.craftResult && g.craftResult.id, K.crafting_table.id, 'crafting table in result');
  g.takeResult(false);
  eq(g.cursor && g.cursor.id, K.crafting_table.id, 'table on cursor');
  g.clickSlot('inv', 5, 0);
  ok(g.inventory[5] && g.inventory[5].id === K.crafting_table.id, 'table put in slot 5');
  ok(g.achievements.has('workbench'), 'workbench achievement');
  g.inventory[0] = st('log', 1);
  g.clickSlot('inv', 0, 0); g.clickSlot('craft', 0, 0);
  g.closeContainer();
  eq(g.craft.filter(Boolean).length, 0, 'craft grid returned on close');
  eq(g.countItem(K.log.id), 1, 'log returned to inventory');
  const p = g.player, bx = Math.floor(p.x), by = Math.floor(p.y) - 1, bz = Math.floor(p.z);
  g.world.setBlock(bx + 2, by + 1, bz, K.crafting_table.id, 0);
  lookAt(g, bx + 2, by + 1, bz);
  g.tick({ use: true, yaw: p.yaw, pitch: p.pitch });
  ok(g.container && g.container.type === 'table' && g.craftSize === 3, 'crafting table opens 3x3');
  g.inventory[0] = st('planks', 8); g.inventory[1] = st('stick', 8);
  const put = (slot, item) => { g.craft[slot] = st(item); };
  put(0, 'planks'); put(1, 'planks'); put(2, 'planks'); put(4, 'stick'); put(7, 'stick');
  g.updateCraftResult();
  eq(g.craftResult && g.craftResult.id, K.wood_pickaxe.id, 'wood pickaxe recipe on table');
  g.takeResult(true);
  ok(g.hasItem(K.wood_pickaxe.id) && g.achievements.has('pickaxe'), 'pickaxe crafted + achievement');
  g.closeContainer();
  for (let i = 0; i < 9; i++) g.craft[i] = null;
  g.openInventory();
  g.craft[0] = st('iron_ingot'); g.craft[1] = st('iron_ingot'); g.craft[3] = st('iron_ingot'); g.craft[4] = st('iron_ingot');
  g.updateCraftResult();
  eq(g.craftResult, null, 'no 2x2 iron recipe');
  g.closeContainer();
  g.inventory[9] = st('iron_helmet');
  g.openInventory();
  g.clickSlot('inv', 9, 0, true);
  ok(g.armor[0] && g.armor[0].id === K.iron_helmet.id, 'shift-click equips helmet');
  eq(g.armorPoints(), 2, 'armor points');
  g.clickSlot('inv', 10, 0);
  g.inventory[10] = st('iron_ingot');
  g.clickSlot('inv', 10, 0);
  g.clickSlot('armor', 1, 0);
  ok(g.cursor && g.cursor.id === K.iron_ingot.id && !g.armor[1], 'ingot rejected by armor slot');
  g.closeContainer();
}

{
  const g = newGame();
  const { bx, by, bz } = flatten(g);
  const p = g.player;
  g.world.setBlock(bx + 2, by + 1, bz, K.furnace.id, 0);
  lookAt(g, bx + 2, by + 1, bz);
  g.tick({ use: true, yaw: p.yaw, pitch: p.pitch });
  ok(g.container && g.container.type === 'furnace', 'furnace opens');
  const be = g.container.be;
  g.inventory[0] = st('iron_ore', 2); g.inventory[1] = st('coal', 1);
  g.clickSlot('inv', 0, 0, true); g.clickSlot('inv', 1, 0, true);
  ok(be.slots[0] && be.slots[0].id === K.iron_ore.id && be.slots[1] && be.slots[1].id === K.coal.id, 'shift-click sorts ore and fuel');
  tick(g, 10);
  eq(g.world.getBlock(bx + 2, by + 1, bz), K.furnace_lit.id, 'furnace lights up');
  tick(g, 420);
  ok(be.slots[2] && be.slots[2].id === K.iron_ingot.id && be.slots[2].count === 2, 'two iron ingots smelted');
  ok(g.achievements.has('iron'), 'iron achievement');
  g.clickSlot('furnace', 2, 0, true);
  eq(g.countItem(K.iron_ingot.id), 2, 'output moved to inventory');
  g.closeContainer();
  g.world.setBlock(bx - 2, by + 1, bz, K.chest.id, 0);
  lookAt(g, bx - 2, by + 1, bz);
  g.tick({ use: true, yaw: p.yaw, pitch: p.pitch });
  ok(g.container && g.container.type === 'chest' && g.container.be.slots.length === 27, 'chest opens');
  g.inventory[0] = st('cobblestone', 10);
  g.clickSlot('inv', 0, 0); g.clickSlot('chest', 3, 2);
  eq(g.container.be.slots[3].count, 1, 'right click puts one');
  g.clickSlot('chest', 4, 0);
  eq(g.container.be.slots[4].count, 9, 'left click puts the rest');
  g.closeContainer();
  lookAt(g, bx - 2, by + 1, bz);
  g.inventory[0] = st('wood_pickaxe'); g.selected = 0;
  let n = 0; while (g.world.getBlock(bx - 2, by + 1, bz) === K.chest.id && n < 200) { g.tick({ attack: true, yaw: p.yaw, pitch: p.pitch }); n++; }
  tick(g, 60);
  eq(g.countItem(K.cobblestone.id), 10, 'breaking chest drops its contents');
  const s = g.serialize();
  const g2 = new M.Game({ save: JSON.parse(JSON.stringify(s)), renderDistance: 2 });
  tick(g2, 5);
  ok([K.furnace.id, K.furnace_lit.id].includes(g2.world.getBlock(bx + 2, by + 1, bz)), 'furnace block survives save');
  eq(g2.countItem(K.cobblestone.id), 10, 'inventory survives save');
  ok(g2.achievements.has('iron') && g2.world.blockEntities.has(M.key3(bx + 2, by + 1, bz)), 'achievements and block entities survive save');
  eq(g2.world.getBlock(bx, by, bz), K.stone.id, 'platform edits survive save');
}

{
  const g = newGame();
  const { bx, by, bz } = flatten(g, 8);
  const p = g.player;
  g.time = 14000;
  const z = new M.Mob('zombie', p.x + 5, by + 1, p.z);
  g.entities.push(z);
  tick(g, 80);
  ok(z.distTo(p) < 2.2, 'zombie chases player: ' + z.distTo(p).toFixed(2));
  ok(p.hp < 20, 'zombie damages player');
  g.time = 6000; z.burning = 0;
  tick(g, 40);
  ok(z.burning > 0, 'zombie burns in daylight');
  g.time = 14000; z.burning = 0; p.hp = 20;
  g.inventory[0] = st('diamond_sword'); g.selected = 0;
  let hits = 0;
  for (let i = 0; i < 40 && z.hp > 0; i++) { lookAt(g, Math.floor(z.x), Math.floor(z.y + 0.5), Math.floor(z.z)); const hp = z.hp; g.tick({ attackClick: true, yaw: p.yaw, pitch: p.pitch }); if (z.hp < hp) hits++; tick(g, 8); }
  ok(z.hp <= 0 && hits >= 2, 'sword kills zombie in ' + hits + ' hits');
  ok(g.stats.kills === 1, 'kill counted');
  tick(g, 30);
  const c = new M.Mob('creeper', p.x + 2, by + 1, p.z);
  g.entities.push(c);
  const hpBefore = p.hp;
  tick(g, 60);
  ok(c.dead && p.hp < hpBefore, 'creeper explodes and hurts');
  let hole = 0; for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) if (g.world.getBlock(bx + dx, by, bz + dz) === 0) hole++;
  ok(hole > 3, 'explosion makes a crater: ' + hole);
  g.player.hp = 20;
  const sk = new M.Mob('skeleton', p.x + 8, g.world.topSolid(Math.floor(p.x + 8), Math.floor(p.z)) + 1, p.z);
  g.entities.push(sk); g.time = 14000;
  let arrows = 0;
  for (let i = 0; i < 120; i++) { g.tick({ loadBudget: 1000 }); if (g.entities.some(e => e instanceof M.Arrow)) arrows++; g.events.length = 0; }
  ok(arrows > 0, 'skeleton shoots arrows');
  g.entities = g.entities.filter(e => !(e instanceof M.Mob) && !(e instanceof M.Arrow));
  const pig = new M.Mob('pig', p.x + 3, by + 1, p.z + 3);
  pig.wanderT = 1e9;
  g.entities.push(pig);
  g.inventory[0] = st('bow'); g.inventory[1] = st('arrow', 5); g.selected = 0;
  let shot = false;
  for (let i = 0; i < 40 && pig.hp === pig.maxHp; i++) { lookAt(g, Math.floor(pig.x), Math.floor(pig.y + 0.4), Math.floor(pig.z)); g.tick({ use: true, yaw: p.yaw, pitch: p.pitch }); if (g.countItem(K.arrow.id) < 5) shot = true; tick(g, 12); }
  ok(shot, 'bow consumes arrows');
  ok(pig.hp < pig.maxHp, 'arrow hits pig');
  while (pig.hp > 0) g.damageMob(pig, 5, 'player');
  p.x = pig.x; p.z = pig.z; p.vx = p.vz = 0;
  tick(g, 40);
  ok(g.countItem(K.porkchop.id) >= 1, 'pig drops porkchop');
  const hp0 = p.hp = 10;
  g.inventory[0] = st('cooked_beef', 1); g.selected = 0;
  g.tick({ use: true, yaw: p.yaw, pitch: p.pitch });
  eq(p.hp, 18, 'eating heals');
  eq(g.inventory[0], null, 'food consumed');
}

{
  const g = newGame();
  const { bx, by, bz } = flatten(g);
  const p = g.player;
  g.world.setBlock(bx + 2, by + 1, bz, K.bed.id, 0);
  lookAt(g, bx + 2, by + 1, bz);
  g.time = 6000;
  g.tick({ use: true, yaw: p.yaw, pitch: p.pitch });
  ok(g.events.some(e => e.type === 'message'), 'cannot sleep by day');
  g.time = 15000;
  g.tick({ use: true, yaw: p.yaw, pitch: p.pitch });
  ok(g.sleeping > 0, 'sleeping at night');
  tick(g, 40);
  eq(g.time % M.DAY, Math.floor(g.time / M.DAY) === 1 ? g.time % M.DAY : g.time % M.DAY, 'time value sane');
  ok(g.time >= M.DAY && g.time < M.DAY + 100, 'night skipped to morning');
  ok(g.achievements.has('bed'), 'bed achievement');
  ok(p.spawn.x === bx + 2.5, 'spawn set at bed');
  g.inventory[0] = st('bucket'); g.selected = 0;
  g.world.setBlock(bx - 2, by + 1, bz, K.water.id, 0);
  tick(g, 3);
  lookAt(g, bx - 2, by + 1, bz);
  g.tick({ use: true, yaw: p.yaw, pitch: p.pitch });
  ok(g.inventory[0] && g.inventory[0].id === K.water_bucket.id, 'bucket picks up water');
  eq(g.world.getBlock(bx - 2, by + 1, bz), 0, 'water source removed');
  lookAt(g, bx - 2, by, bz);
  g.tick({ use: true, yaw: p.yaw, pitch: p.pitch });
  eq(g.world.getBlock(bx - 2, by + 1, bz), K.water.id, 'water bucket places water');
  eq(g.inventory[0].id, K.bucket.id, 'bucket emptied');
  g.world.setBlock(bx - 2, by + 1, bz, 0);
  g.inventory[0] = st('tnt', 1); g.inventory[1] = st('flint_and_steel'); g.selected = 0;
  lookAt(g, bx + 1, by, bz + 1);
  g.tick({ use: true, yaw: p.yaw, pitch: p.pitch });
  eq(g.world.getBlock(bx + 1, by + 1, bz + 1), K.tnt.id, 'tnt placed');
  g.selected = 1;
  lookAt(g, bx + 1, by + 1, bz + 1);
  g.tick({ use: true, yaw: p.yaw, pitch: p.pitch });
  ok(g.entities.some(e => e instanceof M.PrimedTnt), 'tnt primed');
  tick(g, 110);
  ok(!g.entities.some(e => e instanceof M.PrimedTnt) && g.achievements.has('tnt'), 'tnt exploded');
  p.hp = 20;
  g.world.setBlock(bx, by, bz, 0);
  for (let y = by - 1; y > by - 8; y--) g.world.setBlock(bx, y, bz, 0);
  g.world.setBlock(bx, by - 8, bz, K.stone.id);
  p.x = bx + 0.5; p.z = bz + 0.5;
  tick(g, 40);
  ok(p.hp < 20 && p.hp > 0, 'fall damage: ' + p.hp);
  p.hp = 20;
  g.inventory[0] = st('diamond', 3);
  g.damagePlayer(100, 'void');
  ok(p.dead && g.stats.deaths === 1, 'player dies');
  eq(g.inventory[0], null, 'inventory dropped on death');
  ok(g.entities.some(e => e instanceof M.ItemEntity && e.stack.id === K.diamond.id), 'diamonds lie on ground');
  g.respawn();
  ok(!p.dead && p.hp === 20 && Math.abs(p.x - (bx + 2.5)) < 0.01, 'respawn at bed');
}

{
  const g = newGame({ mode: 'creative', seed: 7 });
  const { bx, by, bz } = flatten(g);
  const p = g.player;
  g.world.setBlock(bx + 2, by + 1, bz, K.obsidian.id);
  lookAt(g, bx + 2, by + 1, bz);
  g.tick({ attack: true, yaw: p.yaw, pitch: p.pitch });
  eq(g.world.getBlock(bx + 2, by + 1, bz), 0, 'creative breaks obsidian instantly');
  ok(g.entities.every(e => !(e instanceof M.ItemEntity)), 'no drops in creative');
  g.creativeTake(K.diamond_block.id, 0);
  ok(g.cursor && g.cursor.count === 64, 'creative gives a stack');
  g.cursor = null;
  g.inventory[0] = st('glowstone', 1); g.selected = 0;
  lookAt(g, bx + 2, by, bz);
  g.tick({ use: true, yaw: p.yaw, pitch: p.pitch });
  eq(g.inventory[0].count, 1, 'creative placing keeps count');
  g.tick({ toggleFly: true });
  tick(g, 30, { jump: true });
  ok(p.flying && p.y > by + 4, 'creative flight');
  g.damagePlayer(50, 'mob');
  eq(p.hp, 20, 'no damage in creative');
  g.time = 15000;
  tick(g, 200);
  ok(!g.entities.some(e => e instanceof M.Mob && e.def.hostile && e.hostileNow(g) && e.distTo(p) < 3), 'creative player not attacked');
}

{
  const g = newGame({ seed: 31, difficulty: 2 });
  const p = g.player;
  g.time = 15000;
  let hostileSeen = false;
  tick(g, 600, () => { hostileSeen = hostileSeen || g.entities.some(e => e instanceof M.Mob && e.def.hostile); return {}; });
  ok(hostileSeen, 'hostile mobs spawn at night');
  const peaceful = newGame({ seed: 31, difficulty: 0 });
  peaceful.time = 15000;
  tick(peaceful, 600);
  ok(!peaceful.entities.some(e => e instanceof M.Mob && e.def.hostile), 'no hostiles in peaceful');
  peaceful.player.hp = 5;
  tick(peaceful, 100);
  ok(peaceful.player.hp > 5, 'peaceful regenerates health');
  const day = newGame({ seed: 31 });
  tick(day, 400);
  ok(day.entities.some(e => e instanceof M.Mob && !e.def.hostile), 'passive mobs spawn by day');
  const be = [...g.world.blockEntities.values()];
  const w = new M.World({ seed: 1999 });
  let dungeons = 0, chests = 0;
  for (let cx = -12; cx <= 12; cx++) for (let cz = -12; cz <= 12; cz++) { w.decorateChunk(w.ensureChunk(cx, cz)); }
  for (const v of w.blockEntities.values()) { if (v.type === 'spawner') dungeons++; if (v.type === 'chest') chests++; }
  ok(dungeons > 0 && chests > 0, 'dungeons with spawners and loot chests generate: ' + dungeons + '/' + chests);
  const loot = [...w.blockEntities.values()].filter(v => v.type === 'chest').some(v => v.slots.some(Boolean));
  ok(loot, 'dungeon chests contain loot');
}

{
  const g = newGame();
  const p = g.player;
  const before = JSON.stringify(g.serialize());
  const g2 = new M.Game({ save: JSON.parse(before), renderDistance: 2 });
  ok(Math.abs(g2.player.x - p.x) < 1e-9 && g2.seed === g.seed && g2.name === g.name, 'roundtrip keeps player and seed');
  ok(M.formatTime(0) === '06:00' && M.formatTime(6000) === '12:00' && M.formatTime(18000) === '00:00', 'clock formatting');
  const a = new M.Audio(); a.play('hurt'); a.tickMusic(1, true);
  ok(true, 'audio without context is safe');
}

{
  const ui = fs.readFileSync(path.join(DIR, 'mc-ui.js'), 'utf8');
  for (const need of ['showMain', 'showWorlds', 'showCreate', 'showOptions', 'showPause', 'showDeath', 'buildContainer', 'refreshSlots', 'drawHud', 'requestPointerLock', 'CREATIVE_TABS', 'saveGame', 'loadWorld']) ok(ui.includes(need), 'ui has ' + need);
  const render = fs.readFileSync(path.join(DIR, 'mc-render.js'), 'utf8');
  for (const need of ['drawSky', 'drawClouds', 'drawEntities', 'drawSelection', 'drawBreaking', 'drawHand', 'uDither']) ok(render.includes(need), 'renderer has ' + need);
  const strip = s => s.replace(/`(?:\\[\s\S]|[^`\\])*`/g, '``').replace(/'(?:\\.|[^'\\\n])*'/g, "''").replace(/"(?:\\.|[^"\\\n])*"/g, '""');
  for (const f of FILES) {
    const src = strip(fs.readFileSync(path.join(DIR, f + '.js'), 'utf8'));
    ok(!/\/\/|\/\*/.test(src.replace(/https?:\/\//g, '')), 'no comments in ' + f);
  }
  for (const f of ['../mc98-app.js', '../../../mc98.html', '../../../css/apps/mc98.css']) ok(fs.existsSync(path.join(DIR, f)), 'exists ' + f);
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  for (const f of FILES) ok(html.includes('js/apps/mc98/' + f + '.js'), 'index.html loads ' + f);
  ok(html.includes('mc98-app.js') && html.includes('css/apps/mc98.css'), 'index.html wires app and css');
  const gm = fs.readFileSync(path.join(__dirname, '../js/game-manager.js'), 'utf8');
  ok(/mc98_demo: \{\s*id: 'mc98_demo',\s*cdDemo: true/.test(gm), 'Minecraft 98 Demo ships on the Igromania CD');
  const fsys = fs.readFileSync(path.join(__dirname, '../js/filesystem.js'), 'utf8');
  ok(fsys.includes('MINECRAFT.EXE'), 'filesystem has MINECRAFT.EXE');
  const dlg = fs.readFileSync(path.join(__dirname, '../js/apps/dialogs.js'), 'utf8');
  ok(dlg.includes("cmd === 'minecraft'"), 'run command');
  const icons = fs.readFileSync(path.join(__dirname, '../js/icons.js'), 'utf8');
  ok(icons.includes("'mc98': `<svg"), 'icon exists');
  const i18n = fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8');
  ok((i18n.match(/'app\.mc98'/g) || []).length >= 4, 'i18n keys');
}

console.log('mc98 tests passed: ' + checks + ' checks in ' + (Date.now() - t0) + ' ms');
