const assert = require('node:assert/strict');
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '../js/apps/dota');
const D = require(path.join(DIR, 'dota-data.js'));
for (const f of ['dota-map', 'dota-core', 'dota-heroes', 'dota-ai', 'dota-audio']) require(path.join(DIR, f + '.js'));
const { HEROES, HERO_ORDER, ITEMS, DT, MAP } = D.DATA;
let checks = 0; const ok = (c, m) => { assert.ok(c, m); checks++; };
const tick = (g, n) => { for (let i = 0; i < n; i++) { g.tick(); g.events.length = 0; } };
const secs = (g, s) => tick(g, Math.round(s / DT));
function sandbox(hero = 'techies', opts = {}) {
  const g = new D.Game(Object.assign({ seed: 7, human: { hero, team: 0 }, pregame: 0 }, opts));
  if (!opts.trees) for (const t of g.map.trees) if (!t.perm) t.alive = false;
  for (const h of g.heroes) if (h.bot) { h.bot = false; h.k.noAutoAttack = true; place(h, g.map.fountain[h.team][0] + (h.team ? -300 : 300), g.map.fountain[h.team][1] + (h.team ? 300 : -300)); }
  g.nextWave = 1e9; for (const c of g.camps) c.nextCheck = 1e9; g.roshanAt = 1e9; g.nextPowerRune = 1e9; g.nextBounty = 1e9;
  g.rehash(); g.updateVision();
  return g;
}
const place = (u, x, y) => { u.x = u.px = x; u.y = u.py = y; };
const refresh = (g) => { g.rehash(); g.updateVision(); };
const enemy = (g, h, hid) => g.heroes.find(e => e.team !== h.team && e.hid === hid) || g.heroes.find(e => e.team !== h.team);
const foes = (g, h) => g.heroes.filter(e => e.team !== h.team);
function maxOut(g, h) { g.giveXp(h, 1e6); for (let i = 0; i < 30; i++) for (const s of [3, 0, 1, 2]) g.levelAbility(h, s); g.recalc(h); h.hp = h.maxHp; h.mp = h.maxMp; return h; }
const mid = [6400, 6400];

{
  ok(HERO_ORDER.length === 10 && HERO_ORDER.includes('techies') && HERO_ORDER.includes('enigma'), '10 heroes including Techies and Enigma');
  for (const id of HERO_ORDER) {
    const h = HEROES[id], kit = D.KITS[id];
    ok(h.name.ru && h.name.en && h.title.ru && h.lore.ru && h.lore.en && ['str', 'agi', 'int'].includes(h.attr), `${id} texts & attribute`);
    ok(kit && kit.cast.length >= 4, `${id} kit`);
    ok(h.abilities.length === 4 && h.abilities[3].ult, `${id} has 4 abilities with an ultimate`);
    h.abilities.forEach((a, s) => {
      const n = a.ult ? 3 : 4;
      ok(a.mana.length === n && a.cd.length === n && a.name.ru && a.name.en && a.desc.ru && a.desc.en, `${id} ${a.key} numbers/texts`);
      for (const k in a.v) ok(a.v[k].length === n, `${id} ${a.key}.${k} has ${n} levels`);
      for (const lang of ['ru', 'en']) for (const m of a.desc[lang].matchAll(/\{(\w+)\}/g)) ok(a.v[m[1]] !== undefined, `${id} ${a.key} placeholder {${m[1]}}`);
      if (a.tgt !== 'passive') ok(typeof kit.cast[s] === 'function', `${id} ${a.key} castable`);
    });
    ok(h.talents.length === 4 && h.talents.every(p => p.length === 2 && p.every(t => t.t.ru && t.t.en && (t.s || t.ab != null))), `${id} talents`);
    ok(h.skill.length === 19 && h.skill.filter(s => s === 3).length === 3 && h.skill.filter(s => s === 't').length === 4, `${id} skill build`);
    for (const s of [0, 1, 2]) ok(h.skill.filter(x => x === s).length === 4, `${id} skill build maxes slot ${s}`);
    for (const b of h.build) ok(ITEMS[b], `${id} build item ${b}`);
  }
  ok(HEROES.enigma.abilities.map(a => a.key).join() === 'malefice,demonic_conversion,midnight_pulse,black_hole', 'Enigma kit');
  for (const k in ITEMS) {
    const it = ITEMS[k]; ok(it.name.ru && it.name.en && it.cost >= 0 && it.cat, `item ${k}`);
    if (it.from) { let sum = 0; for (const f of it.from) { ok(ITEMS[f], `item ${k} component ${f}`); sum += ITEMS[f].cost; } ok(it.cost >= sum && it.recipe === it.cost - sum, `item ${k} recipe cost`); }
  }
  ok(Object.keys(ITEMS).length >= 80, `lots of items (${Object.keys(ITEMS).length})`);
  ok(Object.values(ITEMS).filter(i => i.secret).length >= 10, 'secret shop items');
  const src = ['dota-core.js', 'dota-heroes.js', 'dota-ui.js', 'dota-ai.js'].map(f => fs.readFileSync(path.join(DIR, f), 'utf8')).join('\n');
  const names = new Set(); for (const m of src.matchAll(/(?:sfx|play)\('(\w+)'/g)) names.add(m[1]);
  for (const id of HERO_ORDER) { names.add('hit_' + id); if (!HEROES[id].melee) names.add('shot_' + id); }
  for (const n of names) { const m = D.SFX_MAP[n]; ok(m && D.SFX_RECIPES[m[0]], `sound ${n} has a recipe`); }
  for (const r in D.SFX_RECIPES) { const a = D.SFX_RECIPES[r](1); ok(a.length > 100 && a.every(Number.isFinite), `recipe ${r} renders`); }
}

{
  const m = new D.Map();
  ok(m.trees.length > 2500, `forest (${m.trees.length} trees)`);
  for (const k in m.lanes) { const p = m.lanes[k]; let bad = 0; for (let i = 1; i < p.length; i++) for (let j = 0; j <= 30; j++) { const x = p[i - 1][0] + (p[i][0] - p[i - 1][0]) * j / 30, y = p[i - 1][1] + (p[i][1] - p[i - 1][1]) * j / 30; if (!m.walkable(x, y)) bad++; } ok(bad === 0, `${k} lane is walkable`); }
  const pts = [...m.camps.map(c => c.p), ...m.secret, m.roshan, ...m.powerRunes, ...m.bountyRunes, ...m.wardSpots[0], ...m.wardSpots[1]];
  for (let t = 0; t < 2; t++) for (const p of pts) { const path = m.findPath(m.fountain[t][0], m.fountain[t][1] + (t ? 300 : -300), p[0], p[1]); const e = path[path.length - 1]; ok(Math.hypot(e[0] - p[0], e[1] - p[1]) < 200, `team ${t} reaches ${p.map(Math.round)}`); }
  const R = m.structs.filter(s => s.team === 0), Dd = m.structs.filter(s => s.team === 1);
  ok(R.length === Dd.length && R.every((s, i) => Math.abs(s.p[0] + Dd[i].p[0] - MAP) < 1 && Math.abs(s.p[1] + Dd[i].p[1] - MAP) < 1), 'structures are point-symmetric');
  ok(m.structs.filter(s => s.kind === 'tower').length === 22 && m.structs.filter(s => s.kind === 'rax').length === 12, '11 towers and 6 barracks per side');
  ok(m.heightAt(6400, 6400) === 0 && m.heightAt(...m.fountain[0]) === 2 && m.heightAt(3000, 6000) === 1, 'height levels');
  const out = new Uint8Array(m.SN * m.SN); m.castVision(out, 6400, 6400, 1800);
  ok(!out[Math.floor(7400 / 128) * m.SN + Math.floor(5400 / 128)], 'the river cannot see up onto the forest level');
  const out2 = new Uint8Array(m.SN * m.SN); m.castVision(out2, 6400, 6400, 1800, true); ok(out2.reduce((a, b) => a + b, 0) > 500, 'flying vision ignores terrain');
  const t = m.trees.find(x => !x.perm); ok(!m.walkable(t.x, t.y), 'trees block movement');
}

{
  const g = sandbox('sniper'), p = g.player;
  ok(p && p.hid === 'sniper' && g.heroes.length === 10 && new Set(g.heroes.map(h => h.hid)).size === 10, 'all ten heroes in every match');
  ok(g.goldOf(p) === D.DATA.START_GOLD, 'starting gold');
  const hp0 = p.maxHp; g.buy(p, 'gauntlets'); g.recalc(p); ok(Math.abs(p.maxHp - hp0 - 60) < 0.01, 'strength grants 20 HP each');
  const as0 = p.st.as; g.buy(p, 'slippers'); g.recalc(p); ok(Math.abs(p.st.as - as0 - 3) < 0.01, 'agility grants attack speed');
  place(p, 6000, 6800); const c = g.spawnCreep('melee', 1, 'mid', 0); place(c, 6100, 6800); c.hp = 5; refresh(g);
  const gold0 = g.goldOf(p); g.order(p, { type: 'attack', target: c }); secs(g, 3);
  ok(c.dead && p.lh === 1 && g.goldOf(p) >= gold0 + 34, 'last hit grants gold');
  const own = g.spawnCreep('melee', 0, 'mid', 0); place(own, 6100, 6750); refresh(g);
  ok(!g.canAttack(p, own), 'cannot deny a healthy allied creep');
  own.hp = own.maxHp * 0.3; ok(g.canAttack(p, own), 'can deny an allied creep below 50%');
  own.hp = 5; g.order(p, { type: 'attack', target: own }); secs(g, 2); ok(own.dead && p.dn === 1, 'deny counted');
  const t2 = g.structs.find(s => s.kind === 'tower' && s.team === 1 && s.tier === 2 && s.lane === 'mid');
  ok(g.isInvuln(t2), 'tier 2 tower is protected while tier 1 stands');
  const t1 = g.structs.find(s => s.kind === 'tower' && s.team === 1 && s.tier === 1 && s.lane === 'mid');
  g.kill(t1, p); ok(!g.isInvuln(t2), 'tier 2 becomes vulnerable after tier 1 falls');
  ok(g.teamStats[0].towers === 1 && g.heroes.filter(h => h.team === 0).every(h => h.rgold >= 90), 'tower gold for the whole team');
  const anc = g.structs.find(s => s.kind === 'ancient' && s.team === 1); ok(g.isInvuln(anc), 'Ancient is protected by tier 4 towers');
  ok(g.glyph(1) && g.isInvuln(t2) && !g.glyph(1), 'glyph makes buildings invulnerable, then goes on cooldown');
  const g2 = sandbox('sniper'), q = g2.player; place(q, 6400, 6400); const hi = g2.spawnCreep('melee', 1, 'mid', 0); place(hi, 6400, 6900); refresh(g2);
  let miss = 0; for (let i = 0; i < 400; i++) { const hp = hi.hp; hi.hp = hi.maxHp; g2.attackLands(q, hi, { uphill: true }); if (hi.hp === hi.maxHp) miss++; void hp; }
  ok(miss > 60 && miss < 140, `uphill attacks miss ~25% (${miss}/400)`);
  const g3 = sandbox('lina'); g3.time = 301; ok(g3.isNight(), 'night after 5 minutes'); g3.time = 601; ok(!g3.isNight(), 'day again at 10 minutes');
  const g4 = sandbox('axe'), a = g4.player, e4 = enemy(g4, a); place(e4, 6400, 6500); place(a, 6300, 6500); refresh(g4);
  g4.giveGold(e4, 1000, false);
  const before = g4.goldOf(a); g4.kill(e4, a);
  ok(e4.dead && a.kills === 1 && g4.goldOf(a) > before + 200 && g4.firstBlood, 'hero kill bounty incl. first blood');
  ok(e4.respawnT > g4.time && g4.goldOf(e4) < 1600, 'respawn timer and unreliable gold loss');
  g4.giveGold(e4, 5000, true); ok(g4.buyback(e4) && !e4.dead && e4.buybackCd > g4.time, 'buyback');
}

{
  const g = sandbox('juggernaut', { trees: true }), p = g.player; g.giveGold(p, 20000, true);
  ok(g.buy(p, 'boots') && g.buy(p, 'blades_attack') && g.buy(p, 'chainmail'), 'buy components at the fountain');
  const gold = g.goldOf(p); ok(g.buy(p, 'phase_boots') && p.items.some(i => i && i.id === 'phase_boots') && !p.items.some(i => i && i.id === 'boots') && g.goldOf(p) === gold, 'components combine into Phase Boots for free recipe');
  ok(!g.buy(p, 'aghs_shard') || false, 'Aghanim\'s Shard locked before 15:00');
  ok(g.buy(p, 'demon_edge') && p.secretQueue.length === 1 && p.courier.state === 'secret', 'secret item queued for the courier');
  g.time = 200; for (let i = 0; i < 30 * 90 && p.secretQueue.length + p.courier.carry.length > 0 || i < 5; i++) { g.tick(); g.events.length = 0; if (p.items.some(x => x && x.id === 'demon_edge')) break; }
  ok(p.items.some(x => x && x.id === 'demon_edge'), 'flying courier delivered the secret shop item');
  place(p, 6000, 9000); refresh(g); g.buy(p, 'quelling_blade'); ok(p.stash.some(x => x && x.id === 'quelling_blade'), 'remote purchase goes to the stash');
  g.courierDeliver(p); secs(g, 60); ok(p.items.concat(p.backpack).some(x => x && x.id === 'quelling_blade'), 'courier brings stash items');
  const tree = g.map.nearestTree(p.x, p.y, 3000); place(p, tree.x + 150, tree.y); refresh(g);
  const slot = p.items.findIndex(x => x && x.id === 'quelling_blade');
  if (slot >= 0) { g.order(p, { type: 'item', slot, tree }); secs(g, 2); ok(!tree.alive && g.map.walkable(tree.x, tree.y), 'Quelling Blade cuts down a tree'); }
  g.time += 301; secs(g, 2); ok(tree.alive, 'trees regrow after 5 minutes');
  const g2 = sandbox('pudge', { trees: true }), q = g2.player; g2.buy(q, 'tango'); const tr = g2.map.nearestTree(q.x, q.y, 5000); place(q, tr.x + 120, tr.y); refresh(g2); q.hp = 200;
  g2.order(q, { type: 'item', slot: q.items.findIndex(x => x && x.id === 'tango'), tree: tr }); secs(g2, 4); ok(!tr.alive && q.status.some(s => s.tag === 'tango') && q.hp > 220, 'Tango eats a tree and regenerates');
  const g3 = sandbox('lion'), l = g3.player; place(l, 6400, 9000); refresh(g3);
  const tw = g3.structs.find(s => s.team === 0 && s.kind === 'tower' && s.lane === 'top' && s.tier === 1);
  g3.order(l, { type: 'item', slot: 'tp', x: tw.x, y: tw.y }); secs(g3, 3.3); ok(Math.hypot(l.x - tw.x, l.y - tw.y) < 700 && l.tp.charges === 0, 'Town Portal Scroll teleports to a tower');
  const g4 = sandbox('sven'), s = g4.player; g4.giveGold(s, 10000, true); g4.buy(s, 'bkb'); g4.buy(s, 'blink'); const lina = enemy(g4, s, 'lina'); maxOut(g4, lina);
  place(s, 6400, 6400); place(lina, 6700, 6400); refresh(g4);
  g4.order(s, { type: 'item', slot: s.items.findIndex(x => x && x.id === 'bkb') }); const hpB = s.hp; g4.dmg(lina, s, 500, 'mag'); ok(s.hp === hpB, 'BKB: spell immunity');
  g4.dmg(lina, s, 50, 'phys'); ok(!g4.useItem(s, s.items.findIndex(x => x && x.id === 'blink'), { x: 7000, y: 6400 }), 'Blink disabled after hero damage');
  const g5 = sandbox('juggernaut'), j = g5.player; g5.drops.push({ item: { id: 'aegis' }, x: j.x, y: j.y }); g5.order(j, { type: 'pickup', drop: g5.drops[0] }); secs(g5, 1);
  ok(j.items.some(x => x && x.id === 'aegis'), 'Aegis picked up');
  const dx = j.x; g5.kill(j, enemy(g5, j)); secs(g5, 5.5); ok(!j.dead && Math.abs(j.x - dx) < 100 && !j.items.some(x => x && x.id === 'aegis'), 'Aegis reincarnates on the spot');
  const g6 = sandbox('lina'), n = g6.player; g6.runes.push({ kind: 'dd', x: n.x + 100, y: n.y }); g6.order(n, { type: 'pickup', rune: g6.runes[0] }); secs(g6, 1);
  ok(n.status.some(x => x.rune === 'dd') && n.st.dmgBonus > 30, 'Double Damage rune');
  g6.runes.push({ kind: 'illusion', x: n.x + 60, y: n.y }); g6.pickupRune(n, g6.runes[0]); ok(g6.units.filter(u => u.illusion && !u.dead).length === 2, 'Illusion rune');
  const g7 = sandbox('sniper'), sn = g7.player; g7.giveXp(sn, 1e6); ok(g7.learnTalent(sn, 0, 0) && sn.talents[0] === 0 && !g7.learnTalent(sn, 0, 1), 'talent learned once per tier');
}

{
  const T = HEROES.techies, A = T.abilities, byKey = Object.fromEntries(A.concat(T.extra).map(a => [a.key, a]));
  ok(A.map(a => a.key).join() === 'land_mines,stasis_trap,suicide_squad,remote_mines' && T.extra.map(a => a.key).join() === 'focused_detonate,minefield_sign', 'release kit: Land Mines, Stasis Trap, Suicide Squad, Remote Mines + Focused Detonate, Minefield Sign');
  ok(byKey.land_mines.v.dmg.join() === '300,400,500,600' && byKey.land_mines.v.partial.join() === '150,200,250,300' && byKey.land_mines.mana.join() === '125,150,175,205' && byKey.land_mines.cd.join() === '25,20,15,10' && byKey.land_mines.range === 100 && byKey.land_mines.v.max[0] === 20 && byKey.land_mines.v.arm[0] === 1.75, 'Land Mines numbers');
  ok(byKey.stasis_trap.v.stun.join() === '3,4,5,6' && byKey.stasis_trap.v.trigger[0] === 200 && byKey.stasis_trap.v.radius[0] === 450 && byKey.stasis_trap.v.dur.join() === '270,300,330,360' && byKey.stasis_trap.mana.join() === '80,110,140,160' && byKey.stasis_trap.cd.join() === '20,16,13,10', 'Stasis Trap numbers');
  ok(byKey.suicide_squad.v.dmg.join() === '650,850,1150,1550' && byKey.suicide_squad.v.partial.join() === '350,400,450,500' && byKey.suicide_squad.cd.join() === '180,170,160,150', 'Suicide Squad numbers');
  ok(byKey.remote_mines.v.dmg.join() === '300,450,600' && byKey.remote_mines.v.radius.join() === '400,410,425' && byKey.remote_mines.v.dur[0] === 480 && byKey.remote_mines.v.vision[0] === 900 && byKey.remote_mines.mana.join() === '200,240,300' && byKey.remote_mines.cd[0] === 10, 'Remote Mines numbers');
  ok(byKey.focused_detonate.v.radius[0] === 700 && byKey.focused_detonate.cd[0] === 1 && byKey.minefield_sign.cd[0] === 120, 'Focused Detonate and Minefield Sign numbers');
  for (const ab of T.extra) for (const lang of ['ru', 'en']) for (const m of ab.desc[lang].matchAll(/\{(\w+)\}/g)) ok(ab.v[m[1]] !== undefined, `${ab.key} placeholder {${m[1]}}`);

  const g0 = sandbox('techies'), t0 = g0.player;
  ok(g0.rank(t0, 4) === 0 && g0.rank(t0, 5) === 1, 'Focused Detonate needs Remote Mines, Minefield Sign is always there');

  const g = sandbox('techies'), t = maxOut(g, g.player), [e, e2] = foes(g, t);
  place(t, 5000, 9500); place(e, 7500, 9500); place(e2, 7600, 9700); refresh(g);
  ok(g.rank(t, 4) === 1, 'Focused Detonate unlocked with Remote Mines');
  ok(g.order(t, { type: 'cast', slot: 0, x: 5060, y: 9500 }), 'Land Mines cast'); secs(g, 0.8);
  const land = g.units.find(u => u.kind === 'mine' && u.mineType === 'land'); ok(land && Math.hypot(land.x - t.x, land.y - t.y) <= 120, 'land mine planted within 100 of Techies');
  secs(g, 1.5); refresh(g); ok(g.isInvisible(land) && !land.vis[1], 'land mine is invisible');
  place(e, land.x + 350, land.y); place(e2, land.x + 170, land.y); e.hp = e.maxHp; e2.hp = e2.maxHp; refresh(g);
  const eh = e.hp, e2h = e2.hp; secs(g, 0.2);
  ok(land.dead, 'land mine explodes as soon as an enemy is within 200');
  const full = 600 * D.armorMul(e2.st.armor) * (1 - e2.st.mr), part = 300 * D.armorMul(e.st.armor) * (1 - e.st.mr);
  ok(Math.abs((e2h - e2.hp) - full) < 5 && Math.abs((eh - e.hp) - part) < 5, `composite full damage inside 200, partial out to 500 (${Math.round(e2h - e2.hp)}/${Math.round(eh - e.hp)})`);
  for (let i = 0; i < 23; i++) D.KITS.techies.landMine(g, t, 3000 + i * 40, 8000);
  ok(g.units.filter(u => u.kind === 'mine' && u.mineType === 'land' && !u.dead).length === 20, 'at most 20 land mines');
  const tw = g.structs.find(s => s.team === 1 && s.kind === 'tower' && s.tier === 1 && s.lane === 'bot');
  const lm = D.KITS.techies.landMine(g, t, tw.x - 200, tw.y); lm.armAt = 0; const thp = tw.hp; place(e, tw.x - 150, tw.y); refresh(g); secs(g, 0.2);
  ok(lm.dead && thp - tw.hp > 150, `land mines damage buildings (${Math.round(thp - tw.hp)})`);

  const g2 = sandbox('techies'), t2 = maxOut(g2, g2.player), [a, b2] = foes(g2, t2);
  place(t2, 5000, 9500); place(a, 7000, 9500); place(b2, 7100, 9600); refresh(g2);
  ok(g2.order(t2, { type: 'cast', slot: 1, x: 5100, y: 9500 }), 'Stasis Trap cast'); secs(g2, 0.8);
  const trap = g2.units.find(u => u.kind === 'mine' && u.mineType === 'stasis'); ok(trap && trap.expires - g2.time > 350, 'stasis trap lasts 360 s at level 4');
  secs(g2, 2.2); place(a, trap.x + 300, trap.y); place(b2, trap.x + 420, trap.y); refresh(g2); secs(g2, 1);
  ok(!trap.trig && !g2.isStunned(a), 'trap does not trigger at 300 (trigger radius 200)');
  place(a, trap.x + 150, trap.y); refresh(g2); secs(g2, 0.2); ok(trap.trig > 0 && trap.revealed && !g2.isStunned(a), 'enemy within 200 triggers the trap');
  secs(g2, 2); ok(trap.dead && g2.isStunned(a) && g2.isStunned(b2), 'after 2 s everyone within 450 is stunned');
  secs(g2, 5.5); ok(g2.isStunned(a), 'stun lasts 6 s at level 4');

  const g3 = sandbox('techies'), t3 = maxOut(g3, g3.player), v = foes(g3, t3)[0];
  place(t3, 5000, 9500); place(v, 5080, 9500); refresh(g3);
  const vhp = v.hp, kills = g3.teamStats[v.team].kills, vGold = g3.goldOf(v);
  ok(g3.order(t3, { type: 'cast', slot: 2, x: v.x, y: v.y }), 'Suicide Squad, Attack! cast'); secs(g3, 1.3);
  const sfull = 1550 * D.armorMul(v.st.armor) * (1 - v.st.mr);
  ok(t3.dead && Math.abs(vhp - Math.max(0, v.hp) - Math.min(vhp, sfull)) < 5, `Techies dies and deals composite damage (${Math.round(vhp - v.hp)})`);
  ok(Math.abs(t3.respawnT - t3.deathT - D.DATA.RESPAWN[t3.level - 1] * 0.5) < 0.01, 'respawn time halved');
  ok(g3.teamStats[v.team].kills === kills && g3.goldOf(v) <= vGold + (v.dead ? 1e9 : 0) && !g3.heroes.some(h => h.team !== t3.team && h.kills > 0), 'no kill credit or bounty for the enemy');

  const g4 = sandbox('techies'), t4 = maxOut(g4, g4.player), w = foes(g4, t4)[0];
  place(t4, 5000, 9500); place(w, 8000, 9500); refresh(g4);
  ok(g4.order(t4, { type: 'cast', slot: 3, x: 5400, y: 9500 }), 'Remote Mines cast'); secs(g4, 1.3);
  const rm = g4.units.find(u => u.kind === 'mine' && u.mineType === 'remote'); ok(rm && Math.abs(rm.expires - g4.time - 480) < 2, 'remote mine lasts 8 minutes');
  place(t4, 1500, 11000); place(w, rm.x + 700, rm.y); refresh(g4); secs(g4, 0.2);
  ok(w.vis[0], 'remote mine gives 900 vision');
  place(w, rm.x + 50, rm.y); refresh(g4); const whp = w.hp; secs(g4, 3);
  ok(!rm.dead && w.hp === whp, 'remote mines never trigger on their own');
  const tw4 = g4.structs.find(s => s.team === 1 && s.kind === 'tower' && s.tier === 1 && s.lane === 'bot'); const rm2 = D.KITS.techies.remoteMine(g4, t4, tw4.x - 120, tw4.y); const thp4 = tw4.hp;
  ok(g4.order(t4, { type: 'cast', slot: 4, x: rm.x, y: rm.y }), 'Focused Detonate from across the map'); secs(g4, 0.3);
  ok(rm.dead && Math.abs(whp - w.hp - 600 * (1 - w.st.mr)) < 5, `detonation deals magical damage (${Math.round(whp - w.hp)})`);
  t4.cds[4] = 0; g4.order(t4, { type: 'cast', slot: 4, x: rm2.x, y: rm2.y }); secs(g4, 0.3); ok(rm2.dead && tw4.hp === thp4, 'remote mines do not damage buildings');
  t4.items[5] = { id: 'aghs', charges: 0, cd: 0 }; g4.recalc(t4); ok(g4.abRange(t4, 3) === 700 && D.KITS.techies.remoteDamage(g4, t4) === 750, 'Aghanim\'s Scepter: 700 range, 450/600/750 damage');

  const g5 = sandbox('techies'), t5 = g5.player;
  g5.order(t5, { type: 'cast', slot: 5, x: t5.x + 50, y: t5.y }); secs(g5, 1); t5.cds[5] = 0; g5.order(t5, { type: 'cast', slot: 5, x: t5.x - 50, y: t5.y }); secs(g5, 1);
  ok(g5.units.filter(u => u.kind === 'sign' && !u.dead).length === 1 && t5.cds[5] > 100, 'only one Minefield Sign at a time, 120 s cooldown');
}

{
  const g = sandbox('enigma'), en = maxOut(g, g.player), [a, b] = foes(g, en);
  place(en, 6000, 9000); place(a, 6400, 9000); place(b, 6450, 9100); refresh(g);
  let stuns = 0; ok(g.order(en, { type: 'cast', slot: 0, target: a }), 'Malefice cast');
  for (let i = 0; i < 30 * 5; i++) { const was = g.isStunned(a); g.tick(); g.events.length = 0; if (!was && g.isStunned(a)) stuns++; }
  ok(stuns === 3, `Malefice stuns three times (${stuns})`);
  const c = g.spawnCreep('melee', 1, 'mid', 0); place(c, 6200, 8800); refresh(g);
  ok(g.order(en, { type: 'cast', slot: 1, target: c }), 'Demonic Conversion cast'); secs(g, 0.6);
  let eid = g.units.filter(u => u.kind === 'eidolon' && !u.dead); ok(c.dead && eid.length === 3, 'creep turns into 3 eidolons');
  const dummy = g.spawnCreep('siege', 1, 'mid', 1); place(dummy, 6300, 8700); dummy.hp = dummy.maxHp = 1e6; refresh(g);
  for (const e of eid) g.order(e, { type: 'attack', target: dummy });
  secs(g, 12); ok(g.units.filter(u => u.kind === 'eidolon' && !u.dead).length > 3, 'eidolons multiply after attacking');
  const g2 = sandbox('enigma', { trees: true }), E2 = maxOut(g2, g2.player), v = enemy(g2, E2, 'axe');
  const tree = g2.map.trees.find(t => !t.perm && t.alive && t.x > 4000 && t.x < 8000 && t.y > 8000);
  place(E2, tree.x - 500, tree.y); place(v, tree.x, tree.y + 100); refresh(g2);
  const vhp = v.hp; ok(g2.order(E2, { type: 'cast', slot: 2, x: tree.x, y: tree.y }), 'Midnight Pulse cast'); secs(g2, 3.2);
  ok(!tree.alive && v.hp < vhp - v.maxHp * 0.1, 'Midnight Pulse destroys trees and burns max health');
  const g3 = sandbox('enigma'), E3 = maxOut(g3, g3.player), [x1, x2] = foes(g3, E3);
  place(E3, 6000, 9000); place(x1, 6300, 9150); place(x2, 6450, 8900); refresh(g3);
  g3.addStatus(x1, { tag: 'bkb', t: 9, immune: true, buff: true });
  const d1 = Math.hypot(x1.x - 6250, x1.y - 9000), h1 = x1.hp, h2 = x2.hp;
  ok(g3.order(E3, { type: 'cast', slot: 3, x: 6250, y: 9000 }), 'Black Hole cast'); secs(g3, 1);
  ok(E3.channel && g3.isStunned(x1) && g3.isStunned(x2) && x1.atk === null, 'Black Hole disables everyone inside, even through BKB');
  secs(g3, 3.5); ok(Math.hypot(x1.x - 6250, x1.y - 9000) < d1 && x1.hp < h1 - 300 && x2.hp < h2 - 300 && !E3.channel, 'Black Hole pulls and damages for its duration');
  E3.cds[3] = 0; E3.mp = E3.maxMp; place(x1, 6300, 9000); x1.status = []; refresh(g3);
  g3.order(E3, { type: 'cast', slot: 3, x: 6250, y: 9000 }); secs(g3, 0.6); g3.stun(E3, 1, x1); secs(g3, 0.1); ok(!E3.channel && !g3.isStunned(x1), 'stunning Enigma breaks the Black Hole');
}

{
  const cases = {
    sven: [(g, h, e) => ({ slot: 0, target: e }), null, (g, h) => ({ slot: 2 }), (g, h) => ({ slot: 3 })],
    crystal_maiden: [(g, h, e) => ({ slot: 0, x: e.x, y: e.y }), (g, h, e) => ({ slot: 1, target: e }), null, (g, h) => ({ slot: 3 })],
    sniper: [(g, h, e) => ({ slot: 0, x: e.x, y: e.y }), null, null, (g, h, e) => ({ slot: 3, target: e })],
    axe: [(g, h) => ({ slot: 0 }), (g, h, e) => ({ slot: 1, target: e }), null, (g, h, e) => ({ slot: 3, target: e })],
    lina: [(g, h, e) => ({ slot: 0, x: e.x, y: e.y }), (g, h, e) => ({ slot: 1, x: e.x, y: e.y }), null, (g, h, e) => ({ slot: 3, target: e })],
    juggernaut: [(g, h) => ({ slot: 0 }), (g, h) => ({ slot: 1, x: h.x + 100, y: h.y }), null, (g, h, e) => ({ slot: 3, target: e })],
    pudge: [(g, h, e) => ({ slot: 0, x: e.x, y: e.y }), (g, h) => ({ slot: 1 }), null, (g, h, e) => ({ slot: 3, target: e })],
    lion: [(g, h, e) => ({ slot: 0, x: e.x, y: e.y }), (g, h, e) => ({ slot: 1, target: e }), (g, h, e) => ({ slot: 2, target: e }), (g, h, e) => ({ slot: 3, target: e })]
  };
  for (const hid in cases) cases[hid].forEach((mk, slot) => {
    if (!mk) return;
    const g = sandbox(hid), h = maxOut(g, g.player), e = enemy(g, h, hid === 'axe' ? 'crystal_maiden' : 'enigma');
    place(h, 6000, 9000); const near = ['pudge', 'axe', 'juggernaut'].includes(hid) && slot !== 0 ? 120 : 420; place(e, 6000 + near, 9000); refresh(g);
    if (hid === 'axe' && slot === 3) e.hp = 300;
    e.mp = e.maxMp; const hp0 = e.hp, mp0 = e.mp, st0 = e.status.length, self0 = h.status.length, n0 = g.units.length;
    const o = Object.assign({ type: 'cast' }, mk(g, h, e));
    ok(g.order(h, o), `${hid} ${HEROES[hid].abilities[slot].key} accepted`);
    secs(g, 2.6);
    ok(e.hp < hp0 || e.mp < mp0 || e.status.length > st0 || h.status.length > self0 || g.units.length > n0 || e.dead, `${hid} ${HEROES[hid].abilities[slot].key} has an effect`);
  });
  { const g = sandbox('juggernaut'), h = maxOut(g, g.player), e = enemy(g, h); place(h, 6000, 9000); place(e, 6100, 9000); refresh(g); let crit = 0; for (let i = 0; i < 300; i++) { const r = D.KITS.juggernaut.onAttack(g, h, e, 50); if (r && r.crit) crit++; } ok(crit > 70 && crit < 150, `Blade Dance crits ~35% (${crit}/300)`); }
  { const g = sandbox('axe'), h = maxOut(g, g.player), e = enemy(g, h, 'lina'); place(h, 6000, 9000); place(e, 6100, 9000); refresh(g); const hp0 = e.hp; for (let i = 0; i < 40; i++) { h.k.helixCd = 0; D.KITS.axe.onAttacked(g, h, e); } ok(e.hp < hp0, 'Counter Helix spins when attacked'); }
  { const g = sandbox('sven'), h = maxOut(g, g.player), [e, f] = foes(g, h); place(h, 6000, 9000); place(e, 6100, 9000); place(f, 6150, 9080); refresh(g); const hp0 = f.hp; g.attackLands(h, e, { trueStrike: true }); ok(f.hp < hp0, 'Great Cleave splashes damage'); }
  { const g = sandbox('crystal_maiden'), h = maxOut(g, g.player); secs(g, 0.2); const ally = g.heroes.find(x => x.team === h.team && x !== h); ok(ally.aura && ally.aura.mpr > 0 && h.aura.mpr > ally.aura.mpr, 'Arcane Aura is global'); }
  { const g = sandbox('pudge'), h = maxOut(g, g.player), e = enemy(g, h); place(h, 6000, 9000); place(e, 6100, 9000); refresh(g); const s0 = h.str; g.kill(e, h); g.recalc(h); ok(h.str > s0, 'Flesh Heap gains strength from nearby hero deaths'); }
  { const g = sandbox('lina'), h = maxOut(g, g.player), e = enemy(g, h); place(h, 6000, 9000); place(e, 6400, 9000); refresh(g); g.order(h, { type: 'cast', slot: 0, x: e.x, y: e.y }); secs(g, 0.6); ok(h.status.some(s => s.tag === 'fiery_soul'), 'Fiery Soul stacks on cast'); }
}

{
  const g = sandbox('crystal_maiden'), p = g.player; const camp = g.camps.find(c => c.def.type.startsWith('large')); g.time = 60; camp.nextCheck = 60; secs(g, 0.2);
  ok(camp.units.length >= 2, 'neutral camp spawns at 1:00');
  const n = camp.units[0]; place(p, n.x + 120, n.y); refresh(g); g.order(p, { type: 'attack', target: n }); secs(g, 2);
  ok(camp.units.some(u => u !== n && u.aggro === p), 'neutral camp aggroes together');
  g.roshanAt = g.time; secs(g, 0.1); ok(g.roshan && !g.roshan.dead, 'Roshan spawns');
  g.kill(g.roshan, p); ok(g.drops.some(d => d.item.id === 'aegis') && g.teamStats[p.team].roshans === 1 && g.roshanAt > g.time + 400, 'Roshan drops the Aegis and respawns 8–11 minutes later');
}

{
  const g = new D.Game({ seed: 3, human: {}, pregame: 1 }); for (const h of g.heroes) h.bot = false;
  secs(g, 2); const n0 = g.units.filter(u => u.kind === 'creep').length; ok(n0 === 24, `first waves: 4 creeps × 3 lanes × 2 teams (${n0})`);
  const rax = g.structs.find(s => s.kind === 'rax' && s.team === 1 && s.lane === 'bot' && s.raxType === 'melee');
  g.kill(rax, g.heroes[0]); g.nextWave = g.time; secs(g, 0.1);
  ok(g.units.some(u => u.kind === 'creep' && u.team === 0 && u.lane === 'bot' && u.creepType === 'melee_super'), 'destroyed barracks spawn super creeps for the enemy');
}

{
  const g = sandbox('techies', { cheats: true }), p = g.player;
  g.chat(p, '-lvlup 9'); ok(p.level === 10, '-lvlup'); g.chat(p, '-gold 1234'); ok(g.goldOf(p) >= 1834, '-gold');
  const g2 = sandbox('techies', { cheats: false }); g2.chat(g2.player, '-gold 5000'); ok(g2.goldOf(g2.player) === 600, 'cheats disabled without the lobby flag');
}

{
  const results = [];
  for (const [seed, diff] of [[11, 0], [5, 1], [23, 2]]) {
    const g = new D.Game({ seed, human: {}, diff, pregame: 5 });
    const casts = {}; let buys = 0, mines = 0, errs = 0; const origErr = console.error; console.error = () => { errs++; };
    for (let i = 0; i < 30 * 60 * 75 && g.winner < 0; i++) { g.tick(); for (const e of g.events) { if (e.type === 'cast') casts[e.key] = (casts[e.key] || 0) + 1; if (e.type === 'buy') buys++; } g.events.length = 0; }
    console.error = origErr;
    mines = (casts.land_mines || 0) + (casts.stasis_trap || 0) + (casts.remote_mines || 0);
    const min = g.time / 60;
    ok(errs === 0, `bot match ${seed}/${diff} runs without bot errors`);
    ok(g.winner === 0 || g.winner === 1, `bot match ${seed}/${diff} ends with a winner (${g.winner} at ${min.toFixed(1)} min)`);
    ok(min > 15 && min < 75, `bot match length is sane (${min.toFixed(1)} min)`);
    ok(buys > 60, `bots shop (${buys} purchases)`);
    ok(mines >= 5, `Techies bot plants mines (${mines})`);
    ok(Object.keys(casts).length >= 18, `bots use many abilities (${Object.keys(casts).length})`);
    ok(g.heroes.filter(h => !h.illusion).every(h => h.level >= 6), 'every bot reaches level 6+');
    ok(g.heroes.filter(h => !h.illusion).reduce((a, h) => a + h.lh, 0) > 300, 'bots farm creeps');
    results.push(g.winner);
  }
}

{
  for (const f of ['dota-cosmetics', 'dota-gfx', 'dota-icons', 'dota-render']) require(path.join(DIR, f + '.js'));
  const C = D.Cosmetics, G = D.GFX;
  ok(C.ITEMS.length === HERO_ORDER.length * 9 && new Set(C.ITEMS.map(i => i.id)).size === C.ITEMS.length, 'nine unique cosmetics per hero');
  for (const hid of HERO_ORDER) ok(C.SLOT_ORDER.every(sl => C.SLOTS[hid][sl].ru && C.SLOTS[hid][sl].en && C.itemsFor(hid, sl).length === 3), `${hid} has three cosmetics in every slot`);
  for (const it of C.ITEMS) ok(it.name.ru && it.name.en && C.RARITY[it.rarity] && G.hasStyle(it.hero, it.slot, it.style), `cosmetic ${it.id} has texts, rarity and art`);
  G.buildModels();
  for (const hid of HERO_ORDER) {
    const base = JSON.stringify(G.MODELS[G.heroModel(hid, {})].parts);
    ok(G.MODELS[hid].hid === hid && G.MODELS[hid].bust, `${hid} model has portrait framing`);
    for (const it of C.itemsFor(hid)) ok(JSON.stringify(G.MODELS[G.heroModel(hid, { [it.slot]: it.style })].parts) !== base, `${it.id} changes the model`);
  }
  ok(G.heroModel('sven', {}) === 'sven' && G.heroModel('sven', { weapon: 'frost' }) === 'sven#frost.default.default', 'look model ids');
  for (const id in ITEMS) ok(D.ItemArt.has(id), `item ${id} has a painted icon`);
  const src = ['dota-core.js', 'dota-heroes.js'].map(f => fs.readFileSync(path.join(DIR, f), 'utf8')).join('\n');
  for (const m of src.matchAll(/addStatus\([^{]*\{ tag: '(\w+)'([^}]*)/g)) if (/\bbuff:|debuff:/.test(m[2])) ok(D.Renderer.statusKey(m[1] === 'stun_' ? 'stun_12' : m[1]), `status ${m[1]} has an icon`);
  let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const col = C.fresh();
  ok(C.openChest(col, rnd) === null, 'nothing to open without chests');
  let mine = 0; const rar = {};
  for (let i = 0; i < 400; i++) { const it = C.rollItem(col, 'axe', rnd); if (it.hero === 'axe') mine++; rar[it.rarity] = (rar[it.rarity] || 0) + 1; }
  ok(mine > 240, `chests favour the hero they were earned with (${mine}/400)`);
  ok(rar.common > rar.rare && rar.rare > rar.mythical && rar.mythical > (rar.legendary || 0), `rarity weights (${JSON.stringify(rar)})`);
  ok(C.grantChest(col, 'axe', 'match') && col.chests.length === 1, 'match chest granted');
  const first = C.openChest(col, rnd);
  ok(first && C.owns(col, first.item.id) && col.chests.length === 0, 'opening a chest adds its item');
  const other = C.ITEMS.find(it => !C.owns(col, it.id));
  ok(!C.equip(col, other.id) && C.equip(col, first.item.id) && C.look(col, first.item.hero)[first.item.slot] === first.item.style, 'only owned items can be equipped');
  C.unequip(col, first.item.hero, first.item.slot); ok(!C.look(col, first.item.hero)[first.item.slot], 'unequip returns the default look');
  while (C.grantChest(col, 'lina', 'debug')) C.openChest(col, rnd);
  ok(col.owned.length === C.ITEMS.length && new Set(col.owned).size === C.ITEMS.length, 'chests never repeat an item');
  ok(!C.canGrant(col) && !C.grantChest(col, 'lina', 'match'), 'no chests once the collection is complete');
  const col2 = C.fresh(); for (let i = 0; i < C.ITEMS.length + 5; i++) C.grantChest(col2, 'sven', 'match');
  ok(col2.chests.length === C.ITEMS.length, 'pending chests never exceed the items left');
  const col3 = C.fresh(); C.grantChest(col3, 'sven', 'debug'); C.grantChest(col3, 'axe', 'match'); const r3 = C.openChest(col3, rnd, col3.chests.length - 1);
  ok(r3.chest.hero === 'axe' && col3.chests.length === 1 && col3.chests[0].hero === 'sven', 'the end screen opens the chest of that match');
  const back = C.normalize(JSON.parse(JSON.stringify(Object.assign(C.fresh(), { owned: ['sven.weapon.frost', 'bogus'], equipped: { sven: { weapon: 'sven.weapon.frost', head: 'sven.head.crown' } }, chests: [{ hero: 'sven', src: 'debug' }, { hero: 'nobody' }] }))));
  ok(back.owned.join() === 'sven.weapon.frost' && back.equipped.sven.weapon === 'sven.weapon.frost' && !back.equipped.sven.head && back.chests.length === 1, 'saved collection is validated on load');
  ok(Object.keys(C.randomLook('pudge', rnd)).every(sl => C.SLOT_ORDER.includes(sl)), 'bot looks use real slots');
  const ui = fs.readFileSync(path.join(DIR, 'dota-ui.js'), 'utf8');
  ok(ui.includes("code === 'F7'") && ui.includes("'debug'"), 'F7 grants a debug chest');
}

{
  const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  const idx = read('index.html');
  ok(['dota-data', 'dota-cosmetics', 'dota-map', 'dota-core', 'dota-heroes', 'dota-ai', 'dota-gfx', 'dota-icons', 'dota-render', 'dota-audio', 'dota-ui'].every(f => idx.includes(`js/apps/dota/${f}.js`)) && idx.includes('js/apps/dota-app.js') && idx.includes('css/apps/dota.css'), 'index.html loads the game');
  const html = read('dota.html'); ok(html.includes('Dota98.UI') && html.includes('dotaui') && html.includes('dota-cosmetics.js') && html.includes('dota-icons.js'), 'standalone dota.html');
  ok(/dota: \{\s*id: 'dota',\s*steam: true/.test(read('js/game-manager.js')), 'game manager entry sold through Steam');
  ok(read('js/icons.js').includes("'dota':"), 'icon');
  ok(read('js/i18n.js').split("'app.dota'").length - 1 === 4, 'i18n in every language');
  ok(read('js/desktop.js').includes("isInstalled('dota')") && read('js/taskbar.js').includes('data-action="dota"') && read('js/apps/dialogs.js').includes("cmd === 'dota'") && read('js/apps/explorer.js').includes("'DOTA.EXE'") && read('js/filesystem.js').includes("'DOTA.EXE'") && read('js/apps/task-manager.js').includes('dota.exe'), 'desktop, Start menu, Run, explorer, filesystem, task manager');
  ok(read('package.json').includes('test:dota'), 'npm script');
}

console.log(`Dota 98: ${checks} checks passed`);
