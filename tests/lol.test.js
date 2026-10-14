const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '../js/apps/lol');
const L = require(path.join(DIR, 'lol-data.js'));
for (const f of ['lol-skins', 'lol-map', 'lol-core', 'lol-champs', 'lol-ai', 'lol-audio', 'lol-models', 'lol-art', 'lol-icons']) require(path.join(DIR, f + '.js'));
const { CHAMPS, CHAMP_ORDER, ITEMS, SPELLS, DT, MAP } = L.DATA;
let checks = 0; const ok = (c, m) => { assert.ok(c, m); checks++; };
const tick = (g, n) => { for (let i = 0; i < n; i++) { g.tick(); g.events.length = 0; } };
const secs = (g, s) => tick(g, Math.round(s / DT));
function sandbox(champ = 'jinx', opts = {}) {
  const g = new L.Game(Object.assign({ seed: 7, human: { champ, team: 0, role: 'mid' } }, opts));
  for (const c of g.champs) if (c.bot) { c.brain = { lane: null }; c.bot = false; c.k.noAutoAcquire = true; c.x = c.px = g.map.fountain[c.team][0]; c.y = c.py = g.map.fountain[c.team][1]; }
  g.nextWave = 1e9; for (const cp of g.camps) cp.respawnAt = 1e9;
  return g;
}
const place = (u, x, y) => { u.x = u.px = x; u.y = u.py = y; };
const enemyOf = (g, c, cid) => g.champs.find(e => e.team !== c.team && (cid ? e.cid === cid : e.cid !== 'teemo'));
function tank(g, u, hp = 1e5) { u.status = u.status.filter(x => x.tag !== 'tank'); g.buff(u, 'tank', 1e5, { hp }); g.recalc(u); u.hp = u.maxHp; return u.hp; }
function maxOut(g, c) { g.giveXp(c, 20000); c.ranks = [5, 5, 5, 3]; c.points = 0; if (c.cid === 'teemo') c.charges = 5; g.recalc(c); c.hp = c.maxHp; c.mp = c.maxMp; }

{
  ok(CHAMP_ORDER.length === 10 && CHAMP_ORDER.includes('lulu') && CHAMP_ORDER.includes('jinx'), '10 champions including Lulu and Jinx');
  for (const id of CHAMP_ORDER) {
    const c = CHAMPS[id], kit = L.KITS[id];
    ok(c.name && c.title.ru && c.title.en && c.lore.ru && c.lore.en && c.passive.name.ru && c.passive.desc.en, `${id} texts`);
    ok(kit && kit.cast.length === 4 && kit.ai.length === 4, `${id} kit`);
    ok(c.abilities.length === 4, `${id} has 4 abilities`);
    c.abilities.forEach((a, s) => {
      const n = s === 3 ? 3 : 5;
      ok(a.cost.length === n && a.cd.length === n && a.name.ru && a.name.en && a.desc.ru && a.desc.en, `${id} ${a.key} numbers/texts`);
      for (const lang of ['ru', 'en']) for (const m of a.desc[lang].matchAll(/\{(\w+)\}/g)) ok(a.v && a.v[m[1]] !== undefined, `${id} ${a.key} placeholder {${m[1]}}`);
    });
    ok(c.skill.length === 18 && c.skill.filter(s => s === 3).length === 3, `${id} skill order`);
    for (const b of c.build) ok(ITEMS[b], `${id} build item ${b}`);
    ok(c.roles.every(r => L.ROLE_ORDER.includes(r)), `${id} roles`);
  }
  for (const k in ITEMS) {
    const it = ITEMS[k]; ok(it.name.ru && it.name.en && it.cost > 0, `item ${k}`);
    let sum = 0; for (const f of it.from || []) { ok(ITEMS[f], `item ${k} component ${f}`); sum += ITEMS[f].cost; }
    if (it.from) ok(it.cost > sum, `item ${k} combine cost`);
  }
  ok(Object.keys(ITEMS).length >= 40, `lots of items (${Object.keys(ITEMS).length})`);
  for (const s of L.DATA.SPELL_ORDER) ok(SPELLS[s].name.ru && SPELLS[s].cd > 0, `spell ${s}`);
  const src = ['lol-core.js', 'lol-champs.js', 'lol-ui.js', 'lol-ai.js', 'lol-client.js'].map(f => fs.readFileSync(path.join(DIR, f), 'utf8')).join('\n');
  const names = new Set(); for (const m of src.matchAll(/(?:sfx|play)\('(\w+)'/g)) names.add(m[1]);
  for (const n of [...names]) if (n.endsWith('_')) names.delete(n);
  for (const s of L.DATA.SPELL_ORDER) names.add('spell_' + s);
  for (const id of CHAMP_ORDER) if (CHAMPS[id].ranged) names.add('shot_' + id);
  names.add('hit_melee');
  for (const n of names) { const m = L.SFX_MAP[n]; ok(m && L.SFX_RECIPES[m[0]], `sound ${n} has a recipe`); }
  for (const r in L.SFX_RECIPES) { const a = L.SFX_RECIPES[r](1); ok(a.length > 100 && a.every(Number.isFinite), `recipe ${r} renders`); }
}

{
  const m = new L.Map();
  ok(m.structs.length === 30, 'structures: 22 turrets, 6 inhibitors, 2 nexus');
  for (const s of m.structs) ok(m.walkable(s.p[0], s.p[1]), `${s.kind} ${s.team} ${s.lane} on walkable ground`);
  for (const c of m.camps) ok(m.walkable(c.p[0], c.p[1]), `camp ${c.key} walkable`);
  const N = m.n, seen = new Uint8Array(N * N), st = [m.idx(...m.fountain[0])]; seen[st[0]] = 1;
  while (st.length) { const a = st.pop(), ai = a % N, aj = (a / N) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const b = (aj + dy) * N + ai + dx; if (m.t[b] && !seen[b]) { seen[b] = 1; st.push(b); } } }
  let un = 0; for (let k = 0; k < N * N; k++) if (m.t[k] && !seen[k]) un++;
  ok(un === 0, `no unreachable pockets (${un})`);
  ok(seen[m.idx(...m.fountain[1])], 'red fountain reachable from blue fountain');
  for (const k in m.lanes) { const p = m.lanes[k], len = m.pathLength(p); let bad = 0; for (let s = 0; s < len; s += 100) { const q = m.pointAt(p, s); if (!m.walkable(q[0], q[1])) bad++; } ok(bad === 0, `lane ${k} walkable`); }
  let mism = 0; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (!!m.t[j * N + i] !== !!m.t[(N - 1 - j) * N + (N - 1 - i)]) mism++;
  ok(mism / (N * N) < 0.01, `map is (almost) point-symmetric (${mism})`);
  ok(m.brushCount >= 20, `brush regions (${m.brushCount})`);
  for (const c of m.camps) { const path = m.findPath(...m.fountain[0], ...c.p); const last = path[path.length - 1]; ok(Math.hypot(last[0] - c.p[0], last[1] - c.p[1]) < 150, `path to ${c.key}`); let px = m.fountain[0][0], py = m.fountain[0][1]; for (const q of path) { ok(m.clearLine(px, py, q[0], q[1], 0), `path to ${c.key} is clear`); [px, py] = q; } }
}

{
  for (let seed = 1; seed <= 6; seed++) {
    const g = new L.Game({ seed, human: { champ: CHAMP_ORDER[seed % 10], team: seed % 2, role: 'any' } });
    ok(g.champs.length === 10 && new Set(g.champs.map(c => c.cid)).size === 10, `seed ${seed}: 10 unique champions`);
    for (const t of [0, 1]) { const roles = g.champs.filter(c => c.team === t).map(c => c.role); ok(new Set(roles).size === 5, `seed ${seed}: team ${t} roles ${roles}`); }
    ok(g.player && !g.player.bot && g.player.team === seed % 2, 'human champion on the chosen side');
  }
  const g = new L.Game({ seed: 3, human: { champ: null } });
  ok(!g.player && g.champs.every(c => c.bot), 'spectator game: 10 bots');
  const jungler = g.champs.find(c => c.role === 'jungle'); ok(jungler.spells.includes('smite'), 'bot jungler takes smite');
}

{
  const g = sandbox('garen'), p = g.player;
  place(p, 1500, 9000); g.order(p, { type: 'move', x: 1500, y: 7600 });
  secs(g, 2); const moved = 9000 - p.y; ok(Math.abs(moved - p.st.ms * 2) < 60, `walks at move speed (${moved.toFixed(0)} vs ${p.st.ms * 2})`);
  secs(g, 4); ok(Math.hypot(p.x - 1500, p.y - 7600) < 60, 'reaches the destination');
  place(p, 1500, 6000); g.order(p, { type: 'move', x: 3800, y: 7900 }); secs(g, 20);
  ok(Math.hypot(p.x - 3800, p.y - 7900) < 120, `walks through the jungle (${p.x | 0},${p.y | 0})`);
  const e = enemyOf(g, p); place(e, 5000, 5000); e.shields = []; e.status = []; e.st.armor = 100; e.hp = 1000; const hp0 = e.hp;
  g.damage(p, e, 200, 'phys', {}); ok(Math.abs(hp0 - e.hp - 100) < 0.01, '100 armor halves physical damage');
  e.hitBy = {}; g.recalc(e);
  const g2 = sandbox('ashe'), a = g2.player, t = enemyOf(g2, a);
  place(a, 7000, 7000); place(t, 7400, 7000); tank(g2, t, 1e6);
  g2.updateVision(); g2.order(a, { type: 'attack', unit: t }); let hits = 0;
  for (let i = 0; i < 30 * 10; i++) { g2.tick(); for (const ev of g2.events) if (ev.type === 'dmg' && ev.tgt === t.id && ev.src === a.id) hits++; g2.events.length = 0; }
  ok(Math.abs(hits - a.st.as * 10) <= 2, `attacks per second (${hits} in 10 s at ${a.st.as.toFixed(2)})`);
  ok(g2.has(t, 'slow'), 'Ashe frost shot slows');
}

{
  const g = sandbox('jinx'), p = g.player;
  ok(g.inShop(p), 'starts in shop');
  ok(!g.buy(p, 'doranBlade') && p.gold === 0 && p.items[0].id === 'doranBlade', 'buy Doran\'s Blade with starting gold');
  ok(g.buy(p, 'longSword') === 'gold', 'not enough gold');
  ok(g.undoBuy(p) && p.gold === 475 && !p.items[0], 'undo purchase');
  p.gold = 5000;
  g.buy(p, 'ruby'); g.buy(p, 'longSword');
  const plan = g.buyPlan(p, 'phage'); ok(plan.price === ITEMS.phage.cost - ITEMS.ruby.cost - ITEMS.longSword.cost && plan.used.length === 2, 'recipe discount');
  const hpBefore = p.maxHp; g.buy(p, 'phage');
  ok(p.items.filter(Boolean).length === 1 && p.items.some(i => i && i.id === 'phage'), 'components consumed into Phage');
  ok(p.maxHp === hpBefore + 200 - 180, 'item stats applied');
  g.buy(p, 'boots'); ok(g.buy(p, 'boots') === 'boots', 'only one pair of boots'); ok(!g.buy(p, 'berserkers'), 'boots upgrade');
  const gold = p.gold, slot = p.items.findIndex(i => i && i.id === 'berserkers'); g.sell(p, slot); ok(p.gold === gold + Math.floor(ITEMS.berserkers.cost * 0.7), 'sell for 70%');
  g.buy(p, 'hpPot'); g.buy(p, 'hpPot'); ok(p.items.find(i => i && i.id === 'hpPot').n === 2, 'potions stack');
  place(p, 7000, 7000); ok(g.buy(p, 'dagger') === 'shop', 'cannot buy away from base');
  p.hp = 100; const pi = p.items.findIndex(i => i && i.id === 'hpPot'); g.useItem(p, pi); secs(g, 15); ok(p.hp > 230, `potion heals (${p.hp.toFixed(0)})`);
  place(p, 800, 13000); p.gold = 1e5; for (const id of ['infinityEdge', 'bloodthirster', 'phantomDancer', 'guardianAngel', 'trinity']) g.buy(p, id);
  ok(p.items.every(Boolean), 'full inventory'); ok(g.buy(p, 'rod') === 'full', 'inventory full error');
  ok(p.st.critMul === 2.5 && p.st.crit >= 0.6, 'Infinity Edge passive and crit stacking');
}

{
  const g = sandbox('annie'), p = g.player;
  ok(p.level === 1 && p.points === 1, 'level 1 with one skill point');
  ok(!g.canLevel(p, 3), 'no ultimate at level 1'); ok(g.levelAbility(p, 0), 'learn Q');
  g.giveXp(p, L.DATA.XP_TABLE[5]); ok(p.level === 6 && p.points === 5, `level 6 (${p.level})`);
  ok(g.canLevel(p, 3), 'ultimate at level 6'); g.levelAbility(p, 3); ok(!g.canLevel(p, 3), 'one ultimate rank at 6');
  g.levelAbility(p, 0); g.levelAbility(p, 0); ok(!g.canLevel(p, 0), 'basic rank capped by level');
  const gb = new L.Game({ seed: 5, human: { champ: 'annie' } }), bot = gb.champs.find(c => c.team === 1); gb.giveXp(bot, 20000); ok(bot.level === 18 && bot.ranks.reduce((a, b) => a + b) === 18 && bot.ranks[3] === 3, 'bots auto-level skills to 18');
}

for (const cid of CHAMP_ORDER) {
  const g = sandbox(cid), p = g.player, foe = enemyOf(g, p), ally = g.champs.find(c => c.team === p.team && c !== p);
  maxOut(g, p); place(p, 7000, 7600); place(foe, 7350, 7600); place(ally, 6900, 7650);
  tank(g, foe, 20000);
  const a = p.def.abilities;
  for (let s = 0; s < 4; s++) {
    if (a[s].target === 'passive') continue;
    p.mp = p.maxMp; p.cds = [0, 0, 0, 0]; p.hp = p.maxHp; tank(g, foe, 20000);
    const tgt = a[s].target === 'ally' ? { unit: ally, x: ally.x, y: ally.y } : a[s].target === 'unit' ? { unit: foe, x: foe.x, y: foe.y } : { unit: foe, x: foe.x, y: foe.y };
    const before = { fsh: g.shieldTotal(foe), hp: foe.hp, st: foe.status.length, sh: g.shieldTotal(ally) + g.shieldTotal(p), buffs: p.status.length + ally.status.length, units: g.units.length, pr: g.projectiles.length, mp: p.mp, rocket: p.k.rocket };
    g.rehash(); g.updateVision(); const err = g.cast(p, s, tgt);
    ok(!err, `${cid} ${a[s].key} casts (${err})`);
    let effect = false;
    for (let i = 0; i < 90 && !effect; i++) {
      g.tick();
      effect = foe.hp < before.hp - 1 || g.shieldTotal(foe) < before.fsh - 1 || foe.status.length > before.st || g.shieldTotal(ally) + g.shieldTotal(p) > before.sh + 1 || p.status.length + ally.status.length > before.buffs || g.units.length > before.units || g.projectiles.length > before.pr || p.k.rocket !== before.rocket;
      g.events.length = 0;
    }
    ok(effect, `${cid} ${a[s].key} has an effect`);
    if (p.k.channel) g.endChannel(p);
    for (let i = 0; i < 60 && (g.has(p, 'channel') || p.dash || g.has(p, 'untargetable')); i++) { g.tick(); g.events.length = 0; }
    ok(p.cds[s] > 0 || (cid === 'teemo' && s === 3) || a[s].target === 'toggle' || s === 0 && cid === 'jinx', `${cid} ${a[s].key} goes on cooldown`);
  }
  place(foe, p.x + 200, p.y); foe.dash = null; const fh = tank(g, foe, 20000) + g.shieldTotal(foe); g.rehash(); g.updateVision(); g.order(p, { type: 'attack', unit: foe }); secs(g, 3);
  ok(foe.hp + g.shieldTotal(foe) < fh, `${cid} basic attacks hit`);
}
{
  const g = sandbox('lulu'), p = g.player, foe = enemyOf(g, p); maxOut(g, p); place(p, 7000, 7600); place(foe, 7300, 7600);
  g.updateVision(); g.cast(p, 1, { unit: foe }); ok(g.has(foe, 'poly') && !g.canCast(foe) && !g.canAttack(foe), 'Whimsy polymorph silences and disarms');
  g.recalc(foe); ok(foe.st.ms < foe.def.stats.ms, 'polymorphed target is slow');
  const al = g.champs.find(c => c.team === 0 && c !== p); place(al, 7050, 7600); const hp0 = al.maxHp;
  p.cds[3] = 0; g.cast(p, 3, { unit: al }); tick(g, 2); ok(al.maxHp > hp0 + 500, 'Wild Growth adds health'); ok(g.has(foe, 'knockup'), 'Wild Growth knocks up nearby enemies');
  const j = sandbox('jinx'), jx = j.player, target = enemyOf(j, jx); maxOut(j, jx);
  const r0 = jx.st.range; j.cast(jx, 0, {}); j.recalc(jx); ok(jx.k.rocket && jx.st.range === r0 + 175, 'Fishbones range');
  const rocketDmg = (dist) => { const gg = sandbox('jinx'), c = gg.player, t = enemyOf(gg, c); maxOut(gg, c); const k = Math.SQRT1_2, tx = 2600 + dist * k, ty = 2600 + dist * k; place(c, 2600, 2600); place(t, tx, ty); t.shields = []; const h0 = tank(gg, t); gg.cast(c, 3, { x: t.x, y: t.y }); for (let i = 0; i < 30 * 8 && t.hp >= h0 - 1; i++) { t.x = t.px = tx; t.y = t.py = ty; gg.tick(); gg.events.length = 0; } return h0 - t.hp; };
  const near = rocketDmg(400), far = rocketDmg(8000);
  ok(near > 0 && far > near * 2, `rocket damage scales with distance (${near.toFixed(0)} → ${far.toFixed(0)})`);
  ok(target, 'jinx target');
  const gg = sandbox('garen'), gp = gg.player, gt = enemyOf(gg, gp); maxOut(gg, gp); place(gp, 7000, 7000); place(gt, 7200, 7000);
  gt.st.armor = 300; gt.hp = gt.maxHp * 0.3; gg.updateVision(); gg.cast(gp, 3, { unit: gt }); secs(gg, 1); ok(gt.dead, 'Demacian Justice executes a low target through armor');
  const tg = sandbox('teemo'), tp = tg.player, watcher = enemyOf(tg, tp); place(tp, 7000, 7000); place(watcher, 7900, 7000); tg.order(tp, { type: 'stop' });
  secs(tg, 2.5); tg.updateVision(); ok(!tp.vis[1], 'Teemo turns invisible when standing still');
  tg.spawnWard(watcher, 7300, 7000, true); tg.updateVision(); ok(tp.vis[1], 'vision ward reveals stealth');
  const an = sandbox('annie'), ap = an.player, af = enemyOf(an, ap); maxOut(an, ap); place(ap, 7000, 7000); place(af, 7300, 7000); tank(an, af);
  for (let i = 0; i < 3; i++) { ap.cds = [0, 0, 0, 0]; ap.mp = ap.maxMp; an.cast(ap, 2, {}); tick(an, 3); }
  ok(ap.k.stunReady === false && ap.k.pyro === 3, 'pyromania counts spells');
  ap.cds = [0, 0, 0, 0]; an.cast(ap, 2, {}); ok(ap.k.stunReady, 'stun ready after 4 spells'); ap.cds = [0, 0, 0, 0]; an.updateVision(); an.cast(ap, 0, { unit: af }); secs(an, 1); ok(an.has(af, 'stun'), 'Disintegrate stuns when ready');
  const yg = sandbox('masteryi'), yp = yg.player, yt = enemyOf(yg, yp); maxOut(yg, yp); place(yp, 7000, 7000); place(yt, 7400, 7000); const yh = tank(yg, yt);
  yg.updateVision(); yg.cast(yp, 0, { unit: yt }); tick(yg, 2); ok(!yg.targetable(yp, 1), 'Alpha Strike untargetable'); secs(yg, 1); ok(yt.hp < yh, 'Alpha Strike damages');
}

{
  const g = sandbox('ryze'), p = g.player, e = enemyOf(g, p);
  place(p, 7000, 7000); place(e, 7300, 7000);
  p.spells = ['flash', 'ignite']; g.useSpell(p, 0, { x: 9000, y: 7000 }); ok(Math.abs(p.x - 7425) < 5, `flash distance (${p.x})`); ok(p.spellCds[0] > 200, 'flash cooldown');
  g.updateVision(); g.useSpell(p, 1, { unit: e }); const hp = e.hp; secs(g, 5); ok(hp - e.hp > 50 + 20 * p.level - 5, 'ignite burns');
  p.spells = ['heal', 'barrier']; p.spellCds = [0, 0]; p.hp = 100; g.useSpell(p, 0, {}); ok(p.hp > 190, 'heal'); g.useSpell(p, 1, {}); ok(g.shieldTotal(p) > 100, 'barrier shield');
  p.spells = ['exhaust', 'smite']; p.spellCds = [0, 0]; g.useSpell(p, 0, { unit: e }); ok(g.has(e, 'weak') && g.has(e, 'slow'), 'exhaust');
  ok(g.useSpell(p, 1, { unit: e }) === 'target', 'smite cannot target champions');
  g.spawnCamp(g.camps.find(c => c.def.key === 'b_wolves')); const wolf = g.units.find(u => u.mtype === 'wolf' && !u.dead); place(p, wolf.x + 200, wolf.y);
  g.updateVision(); const wh = wolf.hp; g.useSpell(p, 1, { unit: wolf }); ok(wh - wolf.hp >= 390, 'smite damages monsters');
  place(e, 5000, 5000); g.order(e, { type: 'move', x: 6000, y: 5000 }); g.cc(e, 'stun', 1, p); secs(g, 0.9); ok(Math.abs(e.x - 5000) < 5, 'stunned units do not move');
  const merc = sandbox('garen'), mp = merc.player; mp.gold = 5000; merc.buy(mp, 'mercs'); const s = merc.cc(mp, 'stun', 2, null); ok(Math.abs(s.t - 1.3) < 0.01, 'tenacity from Mercury\'s Treads');
}

{
  const g = sandbox('jinx'), p = g.player;
  const outer = g.structs.find(s => s.team === 1 && s.kind === 'tower' && s.lane === 'mid' && s.tier === 'outer');
  const inner = g.structs.find(s => s.team === 1 && s.kind === 'tower' && s.lane === 'mid' && s.tier === 'inner');
  ok(g.isStructureVulnerable(outer) && !g.isStructureVulnerable(inner), 'outer turret vulnerable, inner protected');
  const ih = inner.hp; g.damage(p, inner, 500, 'phys', {}); ok(inner.hp === ih, 'protected turret takes no damage');
  g.killUnit(outer, p); ok(g.isStructureVulnerable(inner), 'inner vulnerable after the outer falls');
  ok(p.gold > 475, 'turret gold');
  place(p, inner.x + 400, inner.y); p.hp = p.maxHp; secs(g, 3); ok(p.hp < p.maxHp - 100, 'turret shoots champions');
  const w = sandbox('jinx'); w.nextWave = 1; secs(w, 1.2);
  const mins = w.units.filter(u => u.kind === 'minion');
  ok(mins.length === 36, `first wave: 6 minions per lane per team (${mins.length})`);
  w.nextWave = 1e9; w.waveN = 2; w.nextWave = w.time + 0.1; secs(w, 0.3); ok(w.units.filter(u => u.kind === 'minion' && u.mtype === 'siege').length === 6, 'third wave brings siege minions');
  secs(w, 40); const moved = w.units.filter(u => u.kind === 'minion' && !u.dead && u.team === 0 && u.lane === 'mid').map(m => w.map.project(w.map.lanePath('mid', 0), m.x, m.y).s);
  ok(moved.length && Math.max(...moved) > 3000, 'minions march down the lane');
  secs(w, 30); ok(w.units.some(u => u.kind === 'minion' && u.dead) || w.units.filter(u => u.kind === 'minion').length < 42, 'minion waves fight');
  const ig = sandbox('jinx'); const inh = ig.structs.find(s => s.kind === 'inhib' && s.team === 1 && s.lane === 'bot');
  ig.killUnit(inh, null); ig.nextWave = ig.time + 0.1; secs(ig, 0.3);
  ok(ig.units.some(u => u.kind === 'minion' && u.mtype === 'super' && u.team === 0 && u.lane === 'bot'), 'destroyed inhibitor spawns super minions');
  ig.nextWave = 1e9; secs(ig, 301); ok(!inh.dead, 'inhibitor respawns');
  const j = sandbox('masteryi'), jp = j.player; maxOut(j, jp);
  const camp = j.camps.find(c => c.def.key === 'b_blue'); j.spawnCamp(camp); const golem = camp.alive[0];
  place(jp, golem.x + 150, golem.y); j.updateVision(); j.order(jp, { type: 'attack', unit: golem }); secs(j, 25);
  ok(golem.dead && j.tagged(jp, 'blueBuff'), 'killing the blue sentinel grants the blue buff');
  const wolves = j.camps.find(c => c.def.key === 'b_wolves'); j.spawnCamp(wolves); const wolf = wolves.alive[0];
  place(jp, wolf.x + 200, wolf.y); j.damage(jp, wolf, 50, 'phys', {}); ok(wolf.aggro === jp && wolves.alive.every(m => m.aggro === jp), 'camp aggroes together');
  place(jp, 1000, 13000); j.order(jp, { type: 'stop' }); secs(j, 6); ok(!wolf.aggro && Math.hypot(wolf.x - wolf.home[0], wolf.y - wolf.home[1]) < 60, 'monster leashes home');
  secs(j, 4); ok(wolf.hp === wolf.maxHp, 'monster heals on reset');
  const r = sandbox('ashe'), rp = r.player; place(rp, 7000, 7000); ok(r.recall(rp), 'recall starts'); secs(r, 4); ok(r.has(rp, 'recall'), 'recalling');
  secs(r, 4.5); ok(Math.hypot(rp.x - r.map.fountain[0][0], rp.y - r.map.fountain[0][1]) < 400, 'recall arrives at the fountain');
  place(rp, 7000, 7000); r.recall(rp); secs(r, 1); r.damage(enemyOf(r, rp), rp, 10, 'phys', { attack: true }); ok(!r.has(rp, 'recall'), 'damage interrupts recall');
  rp.hp = 50; place(rp, ...r.map.fountain[0]); secs(r, 3); ok(rp.hp > rp.maxHp * 0.3, 'fountain heals');
  place(rp, ...r.map.fountain[1]); secs(r, 3); ok(rp.dead, 'enemy fountain kills');
  const k = sandbox('garen'), kp = k.player, vic = enemyOf(k, kp); place(kp, 7000, 7000); place(vic, 7100, 7000);
  const helper = k.champs.find(c => c.team === 0 && c !== kp); place(helper, 7000, 7100);
  const g0 = kp.gold, h0 = helper.gold; k.damage(helper, vic, 50, 'phys', {}); k.damage(kp, vic, 1e5, 'true', {});
  ok(vic.dead && kp.kills === 1 && vic.deaths === 1 && helper.assists === 1, 'kill and assist credited');
  ok(kp.gold - g0 >= 400 && helper.gold > h0, 'kill gold (with first blood) and assist gold');
  ok(vic.respawnT > 5, `respawn timer ${vic.respawnT}`); secs(k, vic.respawnT + 0.2); ok(!vic.dead && vic.hp === vic.maxHp, 'respawn at the fountain');
  kp.gold = 5000; place(kp, 800, 13000); k.buy(kp, 'guardianAngel'); place(kp, 7000, 7000); k.damage(vic, kp, 1e5, 'true', {}); ok(kp.dead && kp.respawnT === 4, 'guardian angel revive');
  secs(k, 4.3); ok(!kp.dead && Math.hypot(kp.x - 7000, kp.y - 7000) < 50, 'revived in place');
  const n = sandbox('jinx'); n.killUnit(n.structs.find(s => s.kind === 'nexus' && s.team === 1), n.player); ok(n.winner === 0, 'destroying the nexus wins');
}

{
  const g = sandbox('jinx'), p = g.player, e = enemyOf(g, p);
  place(p, 7000, 7000); place(e, 12000, 3000); g.updateVision(); ok(!e.vis[0], 'enemy in the fog is hidden');
  place(e, 7600, 7000); g.updateVision(); ok(e.vis[0], 'enemy in sight is visible');
  const m = g.map; let bx = 0, by = 0; for (let k = 0; k < m.n * m.n; k++) if (m.brushId[k]) { bx = (k % m.n + 0.5) * 100; by = ((k / m.n | 0) + 0.5) * 100; break; }
  place(e, bx, by); place(p, bx + 500, by); if (m.brushAt(p.x, p.y)) place(p, bx - 500, by);
  g.updateVision(); ok(!e.vis[0], 'enemy in brush is hidden');
  place(p, bx, by + 1); g.updateVision(); ok(e.vis[0], 'entering the brush reveals it');
}

{
  const SK = L.SKINS, { RARITY, SKINS, Collection } = SK;
  ok(SK.LIST.length === 40 && SK.unlockable().length === 30, `40 looks, 30 unlockable skins (${SK.LIST.length})`);
  for (const cid of CHAMP_ORDER) {
    const list = SKINS[cid];
    ok(list && list[0].key === 'classic' && list[0].rarity === 'base', `${cid} starts with the classic look`);
    ok(list.slice(1).map(s => s.rarity).sort().join() === 'common,epic,legendary', `${cid} has one skin of each rarity`);
    for (const s of list) {
      ok(s.name.ru && s.name.en && L.Art.SCENES[s.scene], `${cid}.${s.key} names and scene`);
      const look = L.Art.lookOf(cid + '.' + s.key);
      for (const k in look.P) ok(/^#[0-9a-f]{6}$/.test(look.P[k]) || (look.P[k] === null && k === 'cape'), `${cid}.${s.key} colour ${k}=${look.P[k]}`);
      if (s.fx && s.fx.aura) ok(['snow', 'stars', 'embers', 'sparks', 'sparkle'].includes(s.fx.aura), `${cid}.${s.key} aura`);
    }
    ok(new Set(list.map(s => s.name.ru)).size === list.length, `${cid} skin names are unique`);
  }
  ok(RARITY.common.weight > RARITY.epic.weight && RARITY.epic.weight > RARITY.legendary.weight, 'rarer skins drop less often');
  const n = Collection.normalize({ owned: ['jinx.mafia', 'jinx.mafia', 'jinx.classic', 'nobody.skin', 42], chests: new Array(150).fill({ champ: 'jinx' }).concat([{ champ: 'x' }]), selected: { jinx: 'jinx.mafia', ashe: 'ashe.queen', garen: 'jinx.mafia' }, opened: -3 });
  ok(n.owned.join() === 'jinx.mafia', `normalize keeps valid unique skins (${n.owned})`);
  ok(n.chests.length === SK.MAX_CHESTS && n.chests[0].champ === 'jinx', 'normalize caps the chest count');
  ok(n.selected.jinx === 'jinx.mafia' && !n.selected.ashe && !n.selected.garen && n.opened === 0, 'normalize keeps only owned selections');
  ok(new Collection(null).chests.length === 0 && new Collection('junk').owned.size === 0, 'broken saves start empty');
  const col = new Collection({});
  ok(col.lookFor('jinx') === 'jinx.classic' && !col.select('jinx.mafia') && col.select('jinx.classic'), 'only owned looks can be selected');
  ok(col.open() === null, 'no chest, nothing to open');
  const rng = L.RNG(5);
  for (let i = 0; i < 30; i++) col.addChest(CHAMP_ORDER[i % 10]);
  const got = [];
  for (let i = 0; i < 30; i++) { const s = col.open(rng); ok(s && s.def.rarity !== 'base' && !got.includes(s.id), `chest ${i + 1} gives a new skin (${s && s.id})`); got.push(s.id); }
  ok(col.complete() && col.ownedCount() === 30 && col.opened === 30, 'thirty chests unlock the whole collection');
  col.addChest(null); ok(col.open(rng) === null && col.chests.length === 1, 'a complete collection keeps the chest');
  ok(col.select('alistar.infernal') && col.lookFor('alistar') === 'alistar.infernal', 'select an owned skin');
  const round = new Collection(JSON.parse(JSON.stringify(col.toJSON())));
  ok(round.ownedCount() === 30 && round.lookFor('alistar') === 'alistar.infernal' && round.chests.length === 1, 'collection survives a save round trip');
  const biased = new Collection({}); biased.addChest('teemo');
  ok(biased.open(() => 0.1).cid === 'teemo', 'a chest earned with a champion can favour that champion');
  const tally = { common: 0, epic: 0, legendary: 0 }, r2 = L.RNG(11);
  for (let i = 0; i < 400; i++) { const c = new Collection({}); c.addChest(null); tally[c.open(r2).def.rarity]++; }
  ok(tally.common > tally.epic && tally.epic > tally.legendary && tally.legendary > 0, `drop rates follow rarity (${JSON.stringify(tally)})`);
  const r3 = L.RNG(3), looks = CHAMP_ORDER.map(cid => SK.randomLook(cid, r3));
  ok(looks.every((id, i) => SK.get(id) && SK.get(id).cid === CHAMP_ORDER[i]), 'bot looks belong to their champion');
}

{
  const bad = [];
  const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d., e+-]+\)|[a-z]+)$/i;
  const check = (what, v) => { if (typeof v === 'string' && !COLOR.test(v)) bad.push(`${what} ${v}`); };
  const noop = () => {};
  function makeCanvas(w = 300, h = 150) {
    const cv = { width: w, height: h, style: {}, addEventListener: noop, getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) };
    let fill = '#000', stroke = '#000';
    const grad = () => ({ addColorStop: (o, c) => check('gradient', c) });
    const ctx = {
      canvas: cv, lineWidth: 1, lineCap: 'butt', lineJoin: 'miter', globalAlpha: 1, globalCompositeOperation: 'source-over', font: '10px x', textAlign: 'left', textBaseline: 'alphabetic', imageSmoothingEnabled: true, filter: 'none',
      get fillStyle() { return fill; }, set fillStyle(v) { check('fill', v); fill = v; },
      get strokeStyle() { return stroke; }, set strokeStyle(v) { check('stroke', v); stroke = v; },
      save: noop, restore: noop, beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, quadraticCurveTo: noop, bezierCurveTo: noop, arc: noop, ellipse: noop, rect: noop, fill: noop, stroke: noop, clip: noop,
      fillRect: noop, strokeRect: noop, clearRect: noop, fillText: noop, strokeText: noop, translate: noop, rotate: noop, scale: noop, setLineDash: noop, drawImage: noop, putImageData: noop, setTransform: noop,
      getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }), measureText: s => ({ width: String(s).length * 6 }),
      createLinearGradient: grad, createRadialGradient: grad,
      getImageData: (x, y, gw, gh) => ({ data: new Uint8ClampedArray(Math.max(1, gw * gh) * 4), width: gw, height: gh }),
      createImageData: (gw, gh) => ({ data: new Uint8ClampedArray(gw * gh * 4), width: gw, height: gh })
    };
    cv.getContext = () => ctx;
    return cv;
  }
  const store = new Map();
  Object.assign(globalThis, {
    document: { createElement: () => makeCanvas(), addEventListener: noop },
    window: { addEventListener: noop },
    localStorage: { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k), clear: () => store.clear() },
    ResizeObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame: () => 1, cancelAnimationFrame: noop
  });
  for (const f of ['lol-gfx', 'lol-render', 'lol-ui', 'lol-client']) require(path.join(DIR, f + '.js'));
  const A = L.Art, I = L.Icons;
  for (const s of L.SKINS.LIST) {
    const set = A.sprites(s.id);
    ok(set.idle.length === 4 && set.walk.length === 6 && set.atk.length === 3 && set.cast.length === 2 && set.idle[0].length === 2, `${s.id} sprite frames`);
    A.pets(s.id); A.splash(s.id, 160, 90); A.splash(s.id, 60, 80, 'tall'); A.icon(s.id, 24);
  }
  A.sprites('jinx.classic', { rocket: true }); A.splash('jinx.classic', 200, 150, 'hub');
  ok(A.pets('annie.redriding').tibbers.frames.length === 4 && A.pets('lulu.wicked').pix.length === 2, 'Tibbers and Pix follow the skin');
  for (const id in ITEMS) ok(I.item(id, 32) && I.ITEMS_DRAWN[id], `item ${id} has its own icon`);
  for (const cid of CHAMP_ORDER) for (let s = 0; s < 4; s++) I.ability(cid, s, 44);
  for (const id of L.DATA.SPELL_ORDER) I.spell(id, 30);
  for (const b of ['blue', 'red', 'baron', 'dragon', 'regen', 'excited', 'highlander', 'whimsy', 'wildGrowth', 'desperate']) I.buff(b, 18);
  for (const b of ['ad', 'ap', 'armor', 'mr', 'asp', 'msFlat', 'crit', 'cdr']) I.stat(b, 12);
  I.chest(64, false); I.chest(64, true); I.rarity(12, '#ffb03a');
  ok(bad.length === 0, `every colour used by models, splashes and icons is valid (${bad.slice(0, 5).join('; ')})`);

  const err = { style: {}, textContent: '' }, canvas = makeCanvas(800, 600);
  const root = { classList: { add: noop }, set innerHTML(v) { void v; }, querySelector: s => s === 'canvas' ? canvas : err, addEventListener: noop, focus: noop, getBoundingClientRect: () => ({ width: 800, height: 600 }) };
  const ui = new L.UI(root, { lang: 'ru' });
  ui.steps.slice(0, -1).forEach(f => f()); ui.stepI = ui.steps.length;
  ui.A.terrain = { canvas: makeCanvas(10, 10), mini: makeCanvas(10, 10), scale: 0.15 };
  const frame = () => { ui.runJobs(1e9); ui.update(0.05); ui.draw(0.05); };
  frame(); ok(ui.screen === 'title', 'client hub draws');
  const key = code => ui.onKey({ code, key: code, preventDefault: noop, stopPropagation: noop, repeat: false }, true);
  key('F7'); frame();
  ok(ui.coll.chests.length === 1 && ui.overlay === 'chest' && ui.chest.phase === 'ready', 'F7 grants a chest and shows it');
  ok(JSON.parse(localStorage.getItem(L.SKINS.STORE_KEY)).chests.length === 1, 'the chest is saved');
  ui.clientClick({ id: 'chestOpen' }); frame(); ok(ui.chest.phase === 'opening', 'chest starts opening');
  for (let i = 0; i < 40; i++) frame();
  const got = ui.chest.got;
  ok(ui.chest.phase === 'reveal' && got && ui.coll.owns(got.id) && ui.coll.chests.length === 0, `chest reveals a new skin (${got && got.id})`);
  ui.clientClick({ id: 'chestEquip', data: got.id }); frame();
  ok(ui.coll.lookFor(got.cid) === got.id, 'the new skin can be equipped from the reveal');
  key('Escape'); ok(!ui.chest && ui.overlay !== 'chest', 'Esc closes the chest');
  ui.click({ id: 'collection' }); frame(); ok(ui.screen === 'collection', 'collection screen');
  for (const cid of CHAMP_ORDER) { ui.clientClick({ id: 'collChamp', data: cid }); for (const s of L.SKINS.SKINS[cid]) { ui.clientClick({ id: 'collSkin', data: cid + '.' + s.key }); frame(); } }
  key('Escape'); ok(ui.screen === 'title', 'Esc returns from the collection');
  ui.click({ id: 'play' }); ui.sel.champ = got.cid; frame(); ok(ui.screen === 'select', 'champion select');
  const locked = L.SKINS.unlockable().find(s => s.cid === got.cid && !ui.coll.owns(s.id));
  ui.clientClick({ id: 'skinPick', data: locked.id }); ok(ui.coll.lookFor(got.cid) === got.id && ui.toast, 'a locked skin cannot be picked');
  ui.clientClick({ id: 'skinPick', data: L.SKINS.baseId(got.cid) }); ok(ui.coll.lookFor(got.cid) === L.SKINS.baseId(got.cid), 'the classic look is always available');
  ui.clientClick({ id: 'skinPick', data: got.id }); frame();
  for (const s of [-1, 0, 1, 2, 3]) { ui.clientClick({ id: 'cabil', data: s }); frame(); }
  ui.click({ id: 'start' });
  ok(ui.screen === 'loading' && ui.player.skinId === got.id, 'the player enters the match in the chosen skin');
  ok(ui.g.champs.every(ch => L.SKINS.get(ch.skinId) && L.SKINS.get(ch.skinId).cid === ch.cid && ch.lookFx), 'every champion has a look');
  frame(); ui.loadT = 5; frame(); frame();
  ok(ui.screen === 'game' && !ui.jobs.length, 'loading finishes after the match art is built');
  const g = ui.g, p = ui.player;
  for (let i = 0; i < 30 * 45; i++) { g.tick(); ui.processEvents(g); }
  for (const ch of g.champs) { ch.x = ch.px = 7000 + (ch.id % 5) * 80; ch.y = ch.py = 7000 + ch.team * 150; }
  g.rehash(); g.updateVision(); ui.overlay = null;
  for (let i = 0; i < 30; i++) { g.tick(); ui.processEvents(g); frame(); }
  key('F7'); ok(ui.coll.chests.length === 1 && ui.overlay !== 'chest', 'F7 in a match only grants the chest');
  ui.overlay = 'shop'; ui.shopSel = 'trinity'; frame(); ui.shopSel = 'infinityEdge'; frame();
  ui.overlay = null; ui.showScore = true; frame(); ui.showScore = false;
  const foe = g.champs.find(ch => ch.team !== p.team); g.damage(p, foe, 1e6, 'true', {}); ui.processEvents(g); frame();
  ok(ui.killFeed.length && ui.killFeed[ui.killFeed.length - 1].victim === foe.skinId, 'kill feed shows skin portraits');
  g.killUnit(g.structs.find(s => s.kind === 'nexus' && s.team !== p.team), p); ui.processEvents(g);
  ok(ui.endReward && ui.endReward.chest && ui.coll.chests.length === 2, 'finishing a match awards a chest');
  for (let i = 0; i < 70; i++) frame();
  ok(ui.endShown, 'end screen');
  ui.clientClick({ id: 'openChest' }); ui.clientClick({ id: 'chestOpen' }); for (let i = 0; i < 40; i++) frame();
  ok(ui.chest.phase === 'reveal' && ui.coll.ownedCount() === 2, 'the match chest opens on the end screen');
  ui.clientClick({ id: 'chestNext' }); for (let i = 0; i < 40; i++) frame();
  ok(ui.coll.ownedCount() === 3 && ui.coll.chests.length === 0, 'the next chest opens from the reveal');
  ui.clientClick({ id: 'chestClose' }); ui.click({ id: 'continue' }); frame(); ok(ui.screen === 'title', 'back to the client');
  ui.click({ id: 'play' }); ui.click({ id: 'spectate' }); frame(); ui.loadT = 5; frame(); frame();
  const sg = ui.g; sg.killUnit(sg.structs.find(s => s.kind === 'nexus' && s.team === 1), null); ui.processEvents(sg);
  for (let i = 0; i < 70; i++) frame();
  ok(ui.endShown && !ui.endReward && ui.coll.chests.length === 0, 'spectating gives no chest');
  ok(bad.length === 0, `client screens use valid colours (${bad.slice(0, 5).join('; ')})`);
  ui.destroy();
}

function match(seed, diff) {
  const g = new L.Game({ seed, diff, human: { champ: null } });
  while (g.winner < 0 && g.time < 50 * 60) { g.tick(); g.events.length = 0; }
  return g;
}
for (const [seed, diff] of [[11, 1], [12, 2], [13, 0]]) {
  const t0 = Date.now(), g = match(seed, diff);
  ok(g.winner >= 0, `seed ${seed} diff ${diff}: a team wins (${(g.time / 60).toFixed(1)} min, ${Date.now() - t0} ms)`);
  ok(g.time > 12 * 60, 'game is not trivially short');
  ok(g.teamStats[0].kills + g.teamStats[1].kills >= 8, `champions fight (${g.teamStats.map(t => t.kills)})`);
  ok(g.teamStats[g.winner].towers >= 5, 'winner destroyed turrets');
  for (const c of g.champs) {
    ok(c.level >= 8, `${c.cid} leveled (${c.level})`);
    ok(c.items.filter(Boolean).length >= 3, `${c.cid} shopped (${c.items.filter(Boolean).map(i => i.id)})`);
    if (c.role !== 'support') ok(c.cs >= 20, `${c.cid} (${c.role}) farmed (${c.cs})`);
  }
}
{
  const run = () => { const g = new L.Game({ seed: 99, diff: 1, human: { champ: null } }); secs(g, 240); return g.champs.map(c => [c.x | 0, c.y | 0, c.hp | 0, c.gold | 0].join()).join(';'); };
  ok(run() === run(), 'simulation is deterministic');
}

{
  const root = path.join(__dirname, '..');
  const idx = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'lol.html'), 'utf8');
  for (const f of ['lol-data', 'lol-skins', 'lol-map', 'lol-core', 'lol-champs', 'lol-ai', 'lol-gfx', 'lol-models', 'lol-art', 'lol-icons', 'lol-render', 'lol-audio', 'lol-ui', 'lol-client']) ok(idx.includes(`js/apps/lol/${f}.js`) && html.includes(`js/apps/lol/${f}.js`), `index.html and lol.html load ${f}`);
  ok(idx.includes('js/apps/lol-app.js') && idx.includes('css/apps/lol.css'), 'index.html loads app + css');
  ok(fs.existsSync(path.join(root, 'lol.html')), 'standalone lol.html');
  const read = f => fs.readFileSync(path.join(root, f), 'utf8');
  ok(/lol: \{\s*id: 'lol',\s*steam: true/.test(read('js/game-manager.js')), 'game manager entry sold through Steam');
  ok(read('js/icons.js').includes("'lol':"), 'icon');
  ok((read('js/i18n.js').match(/'app\.lol'/g) || []).length === 4, 'i18n names');
  ok(read('js/desktop.js').includes("isInstalled('lol')") && read('js/taskbar.js').includes("data-action=\"lol\"") && read('js/apps/dialogs.js').includes("cmd === 'lol'") && read('js/apps/explorer.js').includes("'LOL.EXE'") && read('js/filesystem.js').includes("'LOL.EXE'") && read('js/apps/task-manager.js').includes('lol.exe'), 'desktop, Start menu, Run, explorer, filesystem, task manager');
}
console.log(`lol: ${checks} checks passed`);
