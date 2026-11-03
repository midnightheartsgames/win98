const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = 'js/apps/heroes98';
const ORDER = ['he-core', 'he-data', 'he-units', 'he-factions', 'he-skills', 'he-heroes', 'he-artifacts', 'he-spells', 'he-moons', 'he-battle', 'he-battle-ai', 'he-map', 'he-path', 'he-objects', 'he-hero', 'he-town', 'he-contracts', 'he-adventure', 'he-ai', 'he-script', 'he-save', 'he-mapfile', 'he-maps', 'he-rmg', 'he-campaign', 'he-camp1', 'he-camp2', 'he-camp3', 'he-camp4', 'he-camp5', 'he-camp6', 'he-modes', 'he-font', 'he-art', 'he-files', 'he-audio', 'he-gfx', 'he-draw-battle', 'he-draw-map', 'he-draw-town', 'he-ui-battle', 'he-ui-map', 'he-ui-hero', 'he-ui-town', 'he-ui-menu', 'he-ui-campaign', 'he-ui-modes', 'he-editor', 'he-ui'];
const NODE = ['he-core', 'he-data', 'he-units', 'he-factions', 'he-skills', 'he-heroes', 'he-artifacts', 'he-spells', 'he-moons', 'he-battle', 'he-battle-ai', 'he-map', 'he-path', 'he-objects', 'he-hero', 'he-town', 'he-contracts', 'he-adventure', 'he-ai', 'he-script', 'he-save', 'he-mapfile', 'he-maps', 'he-rmg', 'he-campaign', 'he-camp1', 'he-camp2', 'he-camp3', 'he-camp4', 'he-camp5', 'he-camp6', 'he-modes', 'he-font', 'he-art', 'he-files', 'he-audio'];
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };

{
  const html = read('heroes98.html'), index = read('index.html');
  let last = -1, lastIndex = -1;
  for (const f of ORDER) {
    const tag = `${DIR}/${f}.js`;
    ok(fs.existsSync(path.join(ROOT, tag)), 'module ' + f);
    const i = html.indexOf(tag), j = index.indexOf(tag);
    ok(i > last, 'heroes98.html loads ' + f + ' in order');
    ok(j > lastIndex, 'index.html loads ' + f + ' in order');
    last = i;
    lastIndex = j;
  }
  ok(index.indexOf('js/apps/heroes98-app.js') > lastIndex, 'index.html loads the window wrapper after the modules');
  ok(index.includes('css/apps/heroes98.css') && html.includes('css/apps/heroes98.css'), 'stylesheet on both pages');
  const pkg = JSON.parse(read('package.json')).scripts;
  ok(pkg['test:heroes98'] === 'node tests/heroes98.test.js', 'npm run test:heroes98');
  ok(/(^| )node tests\/heroes98\.test\.js( |$)/.test(pkg.test), 'npm test runs this test');
}

{
  const game = [...ORDER.map(f => `${DIR}/${f}.js`), 'js/apps/heroes98-app.js', 'heroes98.html', 'css/apps/heroes98.css'];
  for (const f of [...game, 'tools/heroes98-shots.cjs', 'tools/heroes98-bot.cjs', 'tools/heroes98-maps.cjs', 'tests/heroes98.test.js']) {
    const src = read(f);
    ok(!/\/\*/.test(src), 'no block comments in ' + f);
    ok(!/^\s*\/\/(?!\s*#)/m.test(src) && !/[;{})]\s+\/\/\s/.test(src), 'no line comments in ' + f);
    ok(!/<!-{2}/.test(src), 'no markup comments in ' + f);
    ok(!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(src), 'no control characters in ' + f);
  }
  const code = game.map(read).join('\n');
  ok(!/Micro[s]oft|Win[d]ows/.test(code), 'names follow the Microslop and Win rule');
  ok(!/['"]F(9|10)['"]|keyCode\s*===?\s*12[01]/.test(code), 'the game does not take F9 and F10 from the bug reports');
}

{
  for (const f of ['js/game-manager.js', 'js/desktop.js', 'js/taskbar.js', 'js/filesystem.js', 'js/apps/dialogs.js', 'js/apps/explorer.js']) {
    ok(!read(f).includes('heroes98'), 'no catalog entry or shortcut before the Steam stage: ' + f);
  }
}

for (const f of NODE) require(path.join(ROOT, DIR, f + '.js'));
const H = globalThis.Heroes98;

{
  ok(H.TITLE === 'Heroes 98', 'title from the author answer B1');
  ok(H.W === 800 && H.H === 600, 'canvas 800x600');
  ok(H.TILE === 32 && H.W % H.TILE === 0, 'map tile 32 fits the screen width');
  ok(H.live && H.live.uis === 0 && H.live.loops === 0 && H.live.audio === 0, 'live counters start at zero');
  const a = H.rng(42), b = H.rng(42), c = H.rng(43);
  const sa = Array.from({ length: 64 }, () => a()), sb = Array.from({ length: 64 }, () => b()), sc = Array.from({ length: 64 }, () => c());
  ok(sa.every((v, i) => v === sb[i]), 'same seed gives the same numbers');
  ok(sa.some((v, i) => v !== sc[i]), 'another seed gives other numbers');
  ok(sa.every(v => v >= 0 && v < 1), 'numbers lie in [0, 1)');
  ok(H.clamp(5, 0, 3) === 3 && H.clamp(-1, 0, 3) === 0 && H.clamp(2, 0, 3) === 2, 'clamp');
}

{
  const f1 = H.fit(800, 600), f2 = H.fit(1610, 1230), f3 = H.fit(1200, 900), f4 = H.fit(400, 400);
  ok(f1.scale === 1 && f1.width === 800 && f1.height === 600 && f1.x === 0 && f1.y === 0, 'window of 800x600 shows the picture 1:1');
  ok(f2.scale === 2 && f2.width === 1600 && f2.height === 1200 && f2.x === 5 && f2.y === 15, 'large window gets a whole x2 and a centred frame');
  ok(f3.scale === 1 && f3.x === 200 && f3.y === 150, 'between x1 and x2 the scale stays whole');
  ok(f4.scale === 0.5 && f4.width === 400 && f4.height === 300 && f4.y === 50, 'small window shrinks the picture to fit');
  ok(H.fit(0, 0).scale === 0.25, 'zero-size window does not break the scale');
}

const BA = H.Battle, BT = H.BATTLE, AI = H.BattleAI;
const make = (a, b, extra) => BA.create(Object.assign({ seed: 7, obstacles: [], sides: [{ stacks: a }, { stacks: b }] }, extra || {}));
const kinds = (ev, kind) => ev.filter(e => e.t === 'hit' && e.kind === kind);

{
  const SLOW = ['bombard', 'mortar', 'culverin'];
  const inBand = (v, r) => v >= r[0] && v <= r[1];
  const power = u => u.hp * (u.dmg[0] + u.dmg[1]) / 2 * Math.pow(1.04, u.atk + u.def);
  for (const [fid, f] of Object.entries(H.FACTIONS)) {
    ok(f.units.length === 7 && f.units.every((row, i) => row.length === 3 && row.every(id => H.UNITS[id] && H.UNITS[id].faction === fid && H.UNITS[id].tier === i + 1)), fid + ' has seven tiers, each with a base and two branches');
    for (const [base, ...branches] of f.units) {
      const u = H.UNITS[base], band = H.TIERS[u.tier];
      ok(inBand(u.hp, band.hp) && u.dmg[0] >= band.dmg[0] && u.dmg[1] <= band.dmg[1] && u.dmg[0] <= u.dmg[1], base + ' health and damage inside the tier band');
      ok((SLOW.includes(base) || inBand(u.speed, band.speed)) && inBand(u.init, band.init) && inBand(u.growth, band.growth) && inBand(u.cost, band.cost), base + ' speed, initiative, growth and cost inside the tier band');
      ok(inBand(Object.values(u.rare || {}).reduce((t, v) => t + v, 0), band.rare), base + ' rare resources inside the tier band');
      for (const id of branches) {
        const x = H.UNITS[id], k = x.cost / u.cost, p = power(x) / power(u);
        const ranged = !!x.shots && !u.shots, unarmed = !x.shots && !!u.shots;
        ok(k >= 1.3 && k <= 1.4 && p >= (ranged ? 0.75 : 1.1) && p <= (unarmed ? 2 : 1.3), id + ' costs 30–40 % more than ' + base + ' and is 10–30 % stronger, gains a ranged attack or gives it up (' + k.toFixed(2) + ', ' + p.toFixed(2) + ')');
        ok(x.growth === u.growth && JSON.stringify(x.rare || {}) === JSON.stringify(u.rare || {}), id + ' keeps the growth and the rare price of ' + base);
      }
    }
  }
  const people = Object.values(H.UNITS).filter(u => u.faction !== 'neutral' && u.faction !== 'summon' && u.faction !== 'machine');
  ok(people.length === Object.values(H.FACTIONS).reduce((t, f) => t + f.units.flat().length, 0), 'every creature of a people stands in a tier row');
  for (const [id, u] of Object.entries(H.UNITS)) ok(!!H.Art.PALETTES[u.faction] && H.unitTraits(u).every(t => t.length === 2 && t[0] && t[1]), id + ' has a palette and lists its traits');
  for (const t of H.TRIALS) ok(t.sides.length === 2 && t.sides.every(s => s.stacks.length && s.stacks.length <= 7 && s.stacks.every(x => H.UNITS[x.unit] && x.count > 0)) && (t.player === 0 || t.player === 1), 'trial battle ' + t.name);
}

{
  const X = H.Hex;
  ok(X.near(5, 4).length === 6 && X.near(5, 5).length === 6, 'inner hexes have six neighbours');
  ok(X.near(5, 4).every(([c, r]) => X.dist(5, 4, c, r) === 1) && X.near(6, 5).every(([c, r]) => X.dist(6, 5, c, r) === 1), 'neighbours lie at distance 1 on even and odd rows');
  ok(X.dist(0, 0, 13, 9) === X.dist(13, 9, 0, 0) && X.dist(0, 0, 13, 0) === 13, 'distance is symmetric and straight along a row');
  ok(H.damageMult(5, 5) === 1 && Math.abs(H.damageMult(10, 5) - Math.pow(1.04, 5)) < 1e-12, 'damage multiplier is 1.04 per point');
  ok(H.damageMult(200, 0) === 3 && H.damageMult(0, 200) === 0.3, 'damage multiplier stays between 0.3 and 3');
}

{
  let obstacles = true, edges = true;
  for (let seed = 1; seed <= 200; seed++) {
    const B = BA.create({ seed, sides: H.TRIALS[0].sides });
    if (!(B.obstacles.length >= 2 && B.obstacles.length <= 6 && B.obstacles.every(([c]) => c >= 3 && c <= 10))) obstacles = false;
    if (!B.stacks.every(s => s.c === (s.side ? 13 : 0))) edges = false;
  }
  ok(obstacles, '2 to 6 obstacles, only in columns 3 to 10, for 200 seeds');
  ok(edges, 'stacks start on their own edge');
}

{
  const B = make([{ unit: 'eaglespirit', count: 5 }], [{ unit: 'stonewoman', count: 5 }]);
  const q = BA.queue(B, 70), fast = q.filter(x => x.id === 0).length;
  ok(Math.abs(fast / (q.length - fast) - 12 / 9) < 0.15, 'initiative 12 acts about 12/9 as often as initiative 9');
  ok(q[0].id === B.active && q.every((x, i) => !i || x.round >= q[i - 1].round), 'tape starts with the active stack and rounds only grow');
  ok(BA.queue(B, 12, BT.waitAt)[0].id !== B.active, 'tape preview for waiting moves the active stack back');
  const tie = make([{ unit: 'militia', count: 5 }], [{ unit: 'militia', count: 5 }], { ready: [100, 100] });
  ok(tie.stacks[tie.active].side === 1, 'on equal readiness and initiative the defender acts first');
  const W = make([{ unit: 'militia', count: 5 }], [{ unit: 'militia', count: 5, c: 13, r: 9 }], { ready: [100, 0] });
  BA.act(W, { type: 'wait' });
  ok(W.stacks[0].waited && W.active === 0 && W.tick === 5 && W.round === 1, 'waiting sets readiness to 50: the stack acts again 5 ticks later in the same round');
  assert.throws(() => BA.act(W, { type: 'wait' }), /already waited/);
  checks++;
  const D = make([{ unit: 'militia', count: 5 }], [{ unit: 'militia', count: 5, c: 13, r: 9 }], { ready: [100, 0] });
  const ev = BA.act(D, { type: 'defend' });
  ok(ev.some(e => e.t === 'defend') && D.active === 0 && D.tick === 7, 'defend sets readiness to 30: the stack acts again 7 ticks later');
  ok(!D.stacks[0].defending, 'defence ends when the stack starts its next turn');
  const foe = D.stacks[1], before = BA.forecast(D, foe, D.stacks[0], 'melee');
  D.stacks[0].defending = true;
  ok(BA.forecast(D, foe, D.stacks[0], 'melee').max < before.max, 'a defending stack takes less damage');
  D.stacks[0].defending = false;
}

{
  const B = make([{ unit: 'militia', count: 20, c: 5, r: 4 }, { unit: 'militia', count: 20, c: 5, r: 3 }], [{ unit: 'militia', count: 50, c: 6, r: 4 }], { ready: [100, 95, 0] });
  const e1 = BA.act(B, { type: 'attack', target: 2, c: 5, r: 4 });
  ok(kinds(e1, 'retal').length === 1, 'the target answers the first blow');
  ok(B.active === 1, 'the second attacker acts next');
  const e2 = BA.act(B, { type: 'attack', target: 2, c: 5, r: 3 });
  ok(kinds(e2, 'retal').length === 0, 'no second answer in the same round');
  ok(B.round === 2 && !B.stacks[2].retaliated && B.active === 2, 'a new round gives the answer back');
}

{
  let inside = true, insideRetal = true;
  for (let seed = 1; seed <= 300; seed++) {
    for (const count of [5, 40]) {
      const B = make([{ unit: 'militia', count, c: 5, r: 4 }], [{ unit: 'shade', count: 60, c: 6, r: 4 }], { seed, ready: [100, 0] });
      const f = BA.forecast(B, B.stacks[0], B.stacks[1], 'melee');
      const ev = BA.act(B, { type: 'attack', target: 1, c: 5, r: 4 });
      const hitE = kinds(ev, 'melee')[0], ret = kinds(ev, 'retal')[0];
      if (hitE.dmg < f.min || hitE.dmg > f.max) inside = false;
      if (ret && (ret.dmg < f.retal.min || ret.dmg > f.retal.max)) insideRetal = false;
    }
  }
  ok(inside, 'real damage stays inside the forecast for 600 blows');
  ok(insideRetal, 'real answer stays inside the forecast answer');
}

{
  const far = make([{ unit: 'crossbow', count: 20, c: 0, r: 4 }], [{ unit: 'militia', count: 50, c: 13, r: 4 }], { ready: [100, 0] });
  const near = make([{ unit: 'crossbow', count: 20, c: 4, r: 4 }], [{ unit: 'militia', count: 50, c: 9, r: 4 }], { ready: [100, 0] });
  const ff = BA.forecast(far, far.stacks[0], far.stacks[1], 'shot'), fn = BA.forecast(near, near.stacks[0], near.stacks[1], 'shot');
  ok(Math.abs(ff.max - fn.max / 2) <= 1, 'a shot farther than 7 hexes deals half damage');
  const ev = BA.act(near, { type: 'shoot', target: 1 });
  ok(near.stacks[0].shots === H.UNITS.crossbow.shots - 1 && kinds(ev, 'shot').length === 1 && kinds(ev, 'retal').length === 0, 'a shot spends one bolt and gets no answer');
  const lo = 3 * 20 * (1 - BT.spread);
  const pierce = make([{ unit: 'crossbow', count: 20, c: 4, r: 4 }], [{ unit: 'plated', count: 5, c: 9, r: 4 }], { ready: [100, 0] });
  ok(BA.forecast(pierce, pierce.stacks[0], pierce.stacks[1], 'shot').min === Math.floor(lo * H.damageMult(5, 14 * 0.7)), 'crossbow bolts ignore 30 % of Стойкость');
  const blocked = make([{ unit: 'crossbow', count: 20, c: 5, r: 4 }], [{ unit: 'militia', count: 50, c: 6, r: 4 }], { ready: [100, 0] });
  ok(!BA.canShoot(blocked, blocked.stacks[0]), 'a shooter next to an enemy cannot shoot');
  assert.throws(() => BA.act(blocked, { type: 'shoot', target: 1 }), /cannot shoot/);
  checks++;
  ok(BA.forecast(blocked, blocked.stacks[0], blocked.stacks[1], 'melee').min === Math.floor(lo * H.damageMult(5, 2) * BT.meleeShooter), 'a shooter in melee deals half damage');
}

{
  const B = make([{ unit: 'ringer', count: 10, c: 2, r: 4 }], [{ unit: 'militia', count: 30, c: 5, r: 4 }, { unit: 'militia', count: 30, c: 6, r: 6 }], { ready: [100, 50, 0] });
  assert.throws(() => BA.act(B, { type: 'bell', target: 2 }), /out of range/);
  checks++;
  const ev = BA.act(B, { type: 'bell', target: 1 });
  ok(kinds(ev, 'bell').length === 1 && kinds(ev, 'retal').length === 0, 'Звон hits a target 3 hexes away without an answer');
  ok(ev.some(e => e.t === 'ready' && e.id === 1 && e.value === 40), 'Звон takes 10 readiness from the target');
  const near = make([{ unit: 'ringer', count: 10, c: 5, r: 4 }], [{ unit: 'militia', count: 30, c: 6, r: 4 }], { ready: [100, 0] });
  assert.throws(() => BA.act(near, { type: 'bell', target: 1 }), /out of range/);
  checks++;
}

{
  const B = make([{ unit: 'militia', count: 50, c: 5, r: 4 }], [{ unit: 'shade', count: 40, c: 6, r: 4 }], { ready: [0, 100] });
  BA.act(B, { type: 'attack', target: 0, c: 6, r: 4 });
  ok(B.stacks[0].chill === 1 && BA.atkOf(B.stacks[0]) === 1, 'Холод могилы takes 1 Натиск');
  const C = make([{ unit: 'militia', count: 50, c: 5, r: 4 }], [{ unit: 'shade', count: 40, c: 6, r: 4 }], { ready: [0, 100] });
  C.stacks[0].chill = 3;
  BA.act(C, { type: 'attack', target: 0, c: 6, r: 4 });
  ok(C.stacks[0].chill === 3, 'Холод могилы stops at −3');
}

{
  const B = make([{ unit: 'horsebow', count: 20, c: 5, r: 4 }], [{ unit: 'militia', count: 50, c: 6, r: 4 }], { ready: [100, 0] });
  assert.throws(() => BA.act(B, { type: 'shoot', target: 1 }), /cannot shoot/);
  checks++;
  assert.throws(() => BA.act(B, { type: 'saddle', c: 5, r: 3, target: 1 }), /saddle/);
  checks++;
  const f = BA.forecast(B, B.stacks[0], B.stacks[1], 'saddle', { c: 2, r: 4 });
  ok(f.min === Math.floor(3 * 20 * (1 - BT.spread) * H.damageMult(5, 2) * 0.7), 'С седла shoots at −30 %');
  const ev = BA.act(B, { type: 'saddle', c: 2, r: 4, target: 1 });
  ok(B.stacks[0].c === 2 && B.stacks[0].shots === H.UNITS.horsebow.shots - 1 && kinds(ev, 'saddle').length === 1, 'С седла moves and shoots in one turn');
}

{
  const B = make([{ unit: 'eaglespirit', count: 10, c: 0, r: 4 }], [{ unit: 'militia', count: 50, c: 6, r: 4 }], { ready: [100, 0] });
  const s = B.stacks[0], t = B.stacks[1];
  const f4 = BA.forecast(B, s, t, 'melee', { c: 5, r: 4, flown: 5 }), f1 = BA.forecast(B, s, t, 'melee', { c: 5, r: 4, flown: 1 });
  ok(f4.min === Math.floor(Math.floor(f1.min / 1) * 1.25) || Math.abs(f4.min - f1.min * 1.25) <= 1, 'Пикирование adds 25 % after 4 hexes of flight');
  const reach = BA.reach(B, s);
  ok([...reach.values()].every(p => H.Hex.dist(0, 4, p.c, p.r) <= 7), 'flyers reach hexes within their speed');
}

{
  const B = make([{ unit: 'militia', count: 10, c: 5, r: 4 }, { unit: 'ringer', count: 5, c: 5, r: 5 }], [{ unit: 'stonewoman', count: 5, c: 6, r: 4 }]);
  ok(BA.moraleOf(B, B.stacks[0]) === 0, 'Колокол +1 and Немой взгляд −1 cancel out');
  B.stacks[1].c = 0;
  B.stacks[1].r = 9;
  ok(BA.moraleOf(B, B.stacks[0]) === -1, 'Немой взгляд gives −1 morale to an adjacent enemy');
  const mix = make([{ unit: 'militia', count: 10 }, { unit: 'shade', count: 10 }], [{ unit: 'militia', count: 10 }]);
  ok(mix.sides[0].mix === 1 && mix.sides[1].mix === 0, 'an army of two peoples gets −1 morale');
}

{
  const B = make([{ unit: 'militia', count: 30, c: 6, r: 4 }, { unit: 'crossbow', count: 10, c: 6, r: 5 }, { unit: 'ringer', count: 5, c: 5, r: 5 }], [{ unit: 'shade', count: 40, c: 7, r: 4 }, { unit: 'shade', count: 40, c: 6, r: 3 }], { ready: [0, 0, 0, 100, 99] });
  const e1 = BA.act(B, { type: 'attack', target: 0, c: 7, r: 4 });
  ok(kinds(e1, 'support').map(e => e.by).join() === '1,2', 'Строй: every Лига stack next to the target strikes the attacker');
  ok(kinds(e1, 'support').every(e => e.to === 3), 'support blows hit the attacker');
  const e2 = BA.act(B, { type: 'attack', target: 0, c: 6, r: 3 });
  ok(kinds(e2, 'support').length === 0, 'each stack supports once per round');
}

{
  const B = make([{ unit: 'militia', count: 50, c: 5, r: 4 }], [{ unit: 'shade', count: 1, c: 6, r: 4 }, { unit: 'horsebow', count: 10, c: 12, r: 8 }, { unit: 'stonewoman', count: 5, c: 12, r: 2 }], { ready: [100, 0, 0, 0] });
  const ev = BA.act(B, { type: 'attack', target: 1, c: 5, r: 4 });
  ok(ev.some(e => e.t === 'death' && e.id === 1), 'the lone shade dies');
  ok(B.stacks[2].lament === 1 && B.stacks[3].lament === 1 && BA.atkOf(B.stacks[2]) === 6, 'Плач: other Курганы stacks get +1 Натиск');
  const C = make([{ unit: 'militia', count: 50, c: 5, r: 4 }], [{ unit: 'shade', count: 1, c: 6, r: 4 }, { unit: 'horsebow', count: 10, c: 12, r: 8 }], { ready: [100, 0, 0] });
  C.stacks[2].lament = 3;
  BA.act(C, { type: 'attack', target: 1, c: 5, r: 4 });
  ok(C.stacks[2].lament === 3, 'Плач stops at +3');
}

{
  H.UNITS.testbig = { name: 'Проба', faction: 'league', tier: 4, atk: 5, def: 5, dmg: [8, 10], hp: 50, speed: 5, init: 10, growth: 4, cost: 300, big: true, shape: 'heavy' };
  const B = make([{ unit: 'testbig', count: 3 }], [{ unit: 'militia', count: 10, c: 13, r: 0 }], { ready: [100, 0] });
  const s = B.stacks[0];
  ok(s.c === 1 && BA.cells(s).length === 2 && BA.cells(s)[1][0] === 0, 'a big stack stands on two hexes with its tail behind');
  const occ = BA.occupancy(B);
  ok([...BA.reach(B, s).values()].every(p => BA.cellsAt(s, p.c, p.r).every(q => H.Hex.inside(q[0], q[1]) && (occ[H.Hex.idx(q[0], q[1])] === -1 || occ[H.Hex.idx(q[0], q[1])] === s.id))), 'a big stack only moves where both hexes are free');
  const t = B.stacks[1];
  s.c = 6;
  s.r = 4;
  t.c = 4;
  t.r = 4;
  ok(BA.touching(s, s.c, s.r, t) && H.Hex.dist(6, 4, 4, 4) === 2, 'an enemy next to the tail touches the big stack');
  delete H.UNITS.testbig;
}

{
  let surge = 0, panic = 0, lucky = 0;
  const N = 2000;
  for (let seed = 1; seed <= N; seed++) {
    const up = make([{ unit: 'militia', count: 10, c: 0, r: 0 }], [{ unit: 'militia', count: 10, c: 13, r: 9 }], { seed, ready: [100, 0] });
    up.sides[0].morale = 3;
    if (BA.act(up, { type: 'defend' }).some(e => e.t === 'morale' && e.good)) surge++;
    const down = BA.create({ seed, obstacles: [], ready: [100, 0], sides: [{ morale: -3, stacks: [{ unit: 'militia', count: 10, c: 0, r: 0 }] }, { stacks: [{ unit: 'militia', count: 10, c: 13, r: 9 }] }] });
    if (down.opening[0].t === 'morale' && !down.opening[0].good) panic++;
    const luck = BA.create({ seed, obstacles: [], ready: [100, 0], sides: [{ luck: 3, stacks: [{ unit: 'militia', count: 30, c: 5, r: 4 }] }, { stacks: [{ unit: 'militia', count: 30, c: 6, r: 4 }] }] });
    if (kinds(BA.act(luck, { type: 'attack', target: 1, c: 5, r: 4 }), 'melee')[0].luck > 0) lucky++;
  }
  ok(surge / N > 0.12 && surge / N < 0.18, 'morale +3 gives Порыв about 15 % of turns');
  ok(panic / N > 0.12 && panic / N < 0.18, 'morale −3 gives Смятение about 15 % of turns');
  ok(lucky / N > 0.12 && lucky / N < 0.18, 'luck +3 gives a lucky blow about 15 % of the time');
}

{
  const runAI = seed => {
    const B = BA.create({ seed, sides: H.TRIALS[0].sides });
    AI.play(B, 100);
    return B;
  };
  ok(JSON.stringify(runAI(5)) === JSON.stringify(runAI(5)), 'same seed, same battle');
  const B = BA.create({ seed: 9, sides: H.TRIALS[1].sides });
  for (let i = 0; i < 6; i++) BA.act(B, AI.choose(B));
  const copy = JSON.parse(JSON.stringify(B));
  AI.play(B, 100);
  AI.play(copy, 100);
  ok(JSON.stringify(B) === JSON.stringify(copy), 'a battle copied mid-way ends the same way');
  const r = BA.result(B), loser = 1 - B.winner;
  ok(B.winner >= 0 && BA.alive(B).every(s => s.side === B.winner), 'the winner is the only side left');
  ok(r.xp[B.winner] === r.lost[loser].reduce((t, l) => t + l.lost * H.UNITS[l.unit].hp, 0), 'experience is the health of killed enemies');
}

{
  let rounds = 0, n = 0, done = true;
  for (let i = 0; i < H.TRIALS.length; i++) {
    for (let seed = 1; seed <= 40; seed++) {
      const B = BA.create({ seed, sides: H.TRIALS[i].sides });
      AI.play(B, 100);
      if (B.winner < 0) done = false;
      rounds += B.round;
      n++;
    }
  }
  ok(done, 'the AI finishes every trial battle within 100 rounds, 200 battles');
  ok(rounds / n < 25, 'trial battles last on average less than 25 rounds (' + (rounds / n).toFixed(1) + ')');
}

{
  const F = H.Font, fonts = ['small', 'text', 'bold', 'title', 'big'];
  ok(fonts.every(f => F.DATA[f] && F.DATA[f].h > 0 && Object.keys(F.DATA[f].glyphs).length > 160), 'five pixel fonts with Latin and Cyrillic glyphs');
  const used = new Set();
  for (const f of ORDER) {
    const src = read(`${DIR}/${f}.js`);
    if (f === 'he-font') continue;
    for (const m of src.matchAll(/'((?:[^'\\n]|\.)*)'/g)) for (const ch of m[1]) if (ch >= ' ') used.add(ch);
  }
  const missing = [...used].filter(ch => !F.DATA.text.glyphs[ch]);
  ok(!missing.length, 'every character in game strings has a glyph: ' + missing.join(''));
  ok(F.measure('text', 'Лига') > 0 && F.wrap('text', 'Лига Семи Рек и Курганы степи', 60).length > 1, 'measure and wrap work');
}

{
  const A = H.Art, all = A.all(), ids = new Set(all.map(e => e.id));
  ok(ids.size === all.length, 'every picture id is unique (' + all.length + ')');
  ok(all.every(e => e.kind && e.name && Array.isArray(e.size) && e.size[0] > 0 && e.size[1] > 0), 'every picture has a kind, a name and a size');
  const units = Object.values(A.UNITS), byF = f => units.filter(u => u.faction === f);
  ok(['league', 'barrows', 'thicket', 'tide', 'forge', 'throne', 'stars', 'spore'].every(f => byF(f).length === 21), 'eight peoples have 21 creatures each');
  ok(byF('neutral').length === 23, '23 neutral creatures');
  ok(units.filter(u => !u.addon && u.faction !== 'neutral' && u.faction !== 'summon' && u.faction !== 'machine').length === 126, '126 creatures of the six release peoples');
  ok(units.every(u => u.look && A.PALETTES[u.faction] && (!u.branch || A.UNITS[u.base].tier === u.tier)), 'every creature has a look, a palette and a base of its tier');
  ok(A.creatures().every(e => e.size === A.FRAME[A.sizeOf(A.UNITS[e.unit])] && e.anchor), 'creature frame follows the size rule');
  for (const [id, u] of Object.entries(H.UNITS)) {
    const a = A.UNITS[id];
    ok(!!a && a.name === u.name && a.tier === u.tier && a.faction === u.faction && !!a.fly === !!u.fly && !!a.big === !!u.big && a.shoot === !!(u.shots || u.volley), 'battle unit ' + id + ' matches its picture entry');
  }
  ok(A.TOWNS.every(t => t.layers.length === A.TOWN_LAYERS.length && t.layers.every(l => l[1])), 'every town scene lists its building layers with names');
  ok(A.SPELLS.length === 78 && A.SPELLS.filter(s => s.school !== 'road').every(s => s.circle >= 1 && s.circle <= 5), '78 spell icons, circles 1 to 5');
  for (const [id, f] of Object.entries(A.FILES)) {
    const e = all.find(x => x.id === id);
    ok(!!e && fs.existsSync(path.join(ROOT, f.src)) && (!f.mask || fs.existsSync(path.join(ROOT, f.mask))), 'ready picture ' + id + ' is listed and on disk');
  }
}

const MD = H.MapData, Adv = H.Adv;
const plain = (w, h, heroAt, army, objs) => {
  const M = MD.create(w, h, ['meadow']);
  for (const o of objs || []) MD.add(M, Object.assign({ owner: -1, l: 0 }, o));
  return Adv.create(M, { seed: 5, moons: null, players: [{ name: 'Лига', color: 0, faction: 'league', human: true }], heroes: [{ owner: 0, name: 'Проба', cls: 'captain', faction: 'league', c: heroAt[0], r: heroAt[1], army: army || [{ unit: 'militia', count: 30 }] }] });
};
const walk = (S, c, r) => {
  const hero = S.heroes[0], p = Adv.path(S, hero, c, r), ev = [];
  for (const s of p.steps) ev.push(...Adv.step(S, hero, s.c, s.r).ev);
  return ev;
};

{
  ok(H.TERRAIN.length === 15 && H.TERRAIN.every(tr => H.Art.TERRAINS.some(a => a.id === 'terrain/' + tr.id)), '15 terrains, each with a picture entry');
  ok(['water', 'lava', 'rock', 'thicket'].every(id => H.TERRAIN[H.TERRAIN_INDEX[id]].cost === 0), 'water, lava, rock and thicket are impassable');
  ok(H.ROADS.slice(1).every(r => r.cost < 1), 'roads are cheaper than meadow');
  const S = plain(20, 10, [0, 0]), hero = S.heroes[0];
  const p = Adv.path(S, hero, 10, 0);
  ok(p.steps.length === 10 && p.steps.every(s => s.cost === 1), 'straight path over meadow costs 1 per step');
  const d = Adv.path(S, hero, 5, 5);
  ok(d.steps.length === 5 && Math.abs(d.steps.reduce((t, s) => t + s.cost, 0) - 5 * 1.41) < 1e-9, 'diagonal steps cost 1.41');
  const S2 = plain(20, 10, [0, 5]);
  MD.road(S2.map, 0, 1, [[0, 5], [0, 0], [19, 0], [19, 5]]);
  MD.paint(S2.map, 0, 'swamp', (c, r) => r >= 3 && c > 0 && c < 19);
  ok(Adv.path(S2, S2.heroes[0], 19, 5).steps.some(s => s.r === 0), 'path prefers the road around a swamp');
  const S3 = plain(10, 10, [0, 0]);
  MD.paint(S3.map, 0, 'rock', (c, r) => (c === 1 && r === 0) || (c === 0 && r === 1));
  ok(Adv.path(S3, S3.heroes[0], 1, 1) === null, 'no diagonal squeeze between two blocked corners');
  const S4 = plain(40, 3, [0, 1]), far = Adv.path(S4, S4.heroes[0], 30, 1);
  ok(far.steps.filter(s => s.day === 0).length === 18 && far.steps[18].day === 1, '18 meadow steps today, the rest tomorrow');
}

{
  H.UNITS.testslow = Object.assign({}, H.UNITS.militia, { name: 'Проба', speed: 3 });
  const fast = plain(5, 5, [0, 0], [{ unit: 'shade', count: 5 }, { unit: 'horsebow', count: 5 }]);
  const slow = plain(5, 5, [0, 0], [{ unit: 'militia', count: 5 }, { unit: 'testslow', count: 1 }]);
  ok(Adv.daySteps(fast, fast.heroes[0]) === 20, 'a fast army (all speed 6 and more) gets 20 steps');
  ok(Adv.daySteps(slow, slow.heroes[0]) === 16, 'a slow creature (speed 3) cuts steps to 16');
  delete H.UNITS.testslow;
}

{
  const S = plain(30, 30, [5, 5]), seen = S.players[0].seen[0], at = (c, r) => seen[r * 30 + c];
  ok(at(5, 5) && at(10, 5) && at(5, 0) && !at(11, 5) && !at(20, 20), 'start reveals a circle of radius 5');
  walk(S, 9, 5);
  ok(at(14, 5) && at(5, 5), 'walking reveals new cells and keeps old ones explored');
  const vis = Adv.visible(S, 0, 0);
  ok(!vis[5 * 30 + 3] && vis[5 * 30 + 9] && seen[5 * 30 + 3], 'explored cells out of sight are not visible');
}

{
  const S = plain(20, 10, [0, 0], null, [{ t: 'res-gold', c: 2, r: 0 }, { t: 'sawmill', c: 4, r: 3 }, { t: 'chest', c: 10, r: 0, offer: 0 }, { t: 'campfire', c: 0, r: 4 }]);
  const hero = S.heroes[0], res = S.players[0].res, gold0 = res.gold;
  walk(S, 2, 0);
  ok(res.gold - gold0 >= 500 && res.gold - gold0 <= 1000 && S.map.objs[0].gone, 'a gold pile gives 500–1000 gold and disappears');
  const ev = walk(S, 5, 4);
  ok(ev.some(e => e.t === 'capture') && S.map.objs[1].owner === 0, 'stepping on the mine entrance captures it');
  const wood = res.wood;
  Adv.endDay(S);
  ok(res.wood === wood + 2 && hero.steps === Adv.daySteps(S, hero), 'a new day brings mine income and fresh steps');
  walk(S, 10, 0);
  ok(S.pending && S.pending.kind === 'chest' && S.pending.gold === 1000 && S.pending.xp === 500, 'a chest offers gold or experience');
  Adv.resolve(S, 'xp');
  ok(hero.xp === 500 && !S.pending && S.map.objs[2].gone, 'choosing experience takes the chest');
  const g1 = res.gold;
  Adv.endDay(S);
  walk(S, 0, 4);
  ok(res.gold - g1 >= 400 && S.map.objs[3].gone, 'a campfire gives gold and a resource');
}

{
  const offers = new Set();
  let ring = true, price = true;
  for (let seed = 1; seed <= 60; seed++) {
    const S = plain(10, 10, [0, 0], [{ unit: 'militia', count: 100 }], [{ t: 'monster', c: 4, r: 0, unit: 'shade', count: 10, max: 30, mood: 'cautious' }]);
    S.rs = seed;
    const p = Adv.path(S, S.heroes[0], 4, 0);
    if (p.kind !== 'attack' || p.steps[p.steps.length - 1].c !== 3) ring = false;
    walk(S, 4, 0);
    offers.add(S.pending.offer);
    if (S.pending.offer === 'join' && S.pending.price !== 10 * H.UNITS.shade.cost) price = false;
  }
  ok(ring, 'attacking a stack stops in its guarded ring');
  ok(price, 'a stack of another people asks for its price');
  ok(offers.has('join') && offers.has('flee') && offers.size === 2, 'a cautious stack facing a 3× stronger army joins or flees');
  const hostile = plain(10, 10, [0, 0], [{ unit: 'militia', count: 100 }], [{ t: 'monster', c: 4, r: 0, unit: 'shade', count: 10, mood: 'hostile' }]);
  walk(hostile, 4, 0);
  ok(hostile.pending.offer === null, 'a hostile stack always fights');
  let joined = false;
  for (let seed = 1; seed <= 20 && !joined; seed++) {
    const friend = plain(10, 10, [0, 0], [{ unit: 'militia', count: 100 }], [{ t: 'monster', c: 4, r: 0, unit: 'militia', count: 20, mood: 'friendly' }]);
    friend.rs = seed;
    walk(friend, 4, 0);
    if (friend.pending.offer !== 'join') continue;
    ok(friend.pending.price === 0, 'a stack of the hero people joins for free');
    Adv.resolve(friend, 'accept');
    ok(friend.heroes[0].army[0].count === 120 && friend.map.objs[0].gone, 'joining merges into the same creature slot');
    joined = true;
  }
  ok(joined, 'a friendly stack of the same people joins at least once in 20 seeds');
  const back = plain(10, 10, [0, 0], [{ unit: 'militia', count: 10 }], [{ t: 'monster', c: 4, r: 0, unit: 'eaglespirit', count: 10, mood: 'fierce' }]);
  walk(back, 4, 0);
  const from = back.pending.from.join();
  Adv.resolve(back, 'retreat');
  ok([back.heroes[0].c, back.heroes[0].r].join() === from && !back.pending, 'retreat steps back out of the guarded ring');
}

{
  const S = plain(10, 10, [0, 0], [{ unit: 'militia', count: 80 }, { unit: 'crossbow', count: 20 }], [{ t: 'monster', c: 4, r: 0, unit: 'shade', count: 23, mood: 'hostile' }]);
  walk(S, 4, 0);
  const setup = Adv.battleSetup(S), foe = setup.sides[1].stacks;
  ok(foe.length >= 3 && foe.length <= 7 && foe.reduce((t, s) => t + s.count, 0) === 23, 'a neutral stack splits into 3–7 battle stacks with the same count');
  const B = H.Battle.create(setup);
  H.BattleAI.play(B, 100);
  const ev = Adv.battleDone(S, B), hero = S.heroes[0];
  ok(B.winner === 0 && ev.some(e => e.t === 'won') && S.map.objs[0].gone && hero.xp > 0, 'a won battle removes the stack and gives experience');
  ok((hero.army[0] ? hero.army[0].count : 0) === B.stacks[0].count && (hero.army[1] ? hero.army[1].count : 0) === B.stacks[1].count, 'losses carry back into the hero army');
  const L = plain(10, 10, [0, 0], [{ unit: 'militia', count: 5 }], [{ t: 'monster', c: 4, r: 0, unit: 'eaglespirit', count: 20, mood: 'hostile' }]);
  walk(L, 4, 0);
  const LB = H.Battle.create(Adv.battleSetup(L));
  H.BattleAI.play(LB, 100);
  Adv.battleDone(L, LB);
  ok(LB.winner === 1 && !L.heroes[0].alive && L.over && L.over.winner === -1 && L.over.why === 'lost', 'a lost battle kills the last hero and ends the game');
}

{
  const S = plain(10, 10, [0, 0], null, [{ t: 'monster', c: 8, r: 8, unit: 'shade', count: 20, max: 23, mood: 'hostile' }]);
  for (let i = 0; i < 7; i++) Adv.endDay(S);
  ok(S.day === 8 && S.map.objs[0].count === 22, 'a new week grows neutral stacks by 10 %');
  for (let i = 0; i < 7; i++) Adv.endDay(S);
  ok(S.map.objs[0].count === 23, 'growth stops at the stack maximum');
  ok(Adv.date(S).week === 3 && Adv.date(S).day === 1, 'date counts weeks and days');
}

{
  const T = H.Maps.trial(), M = T.map, used = new Map();
  let placed = true, apart = true;
  for (const o of M.objs) {
    for (const [c, r] of MD.cells(o)) {
      if (!MD.inside(M, c, r) || !MD.groundCost(M, o.l, c, r)) placed = false;
      const k = o.l + ':' + c + ',' + r;
      if (used.has(k)) apart = false;
      used.set(k, o.id);
    }
  }
  ok(M.w === 48 && M.h === 48 && M.levels === 2, 'trial map is 48×48 with two levels');
  ok(placed && apart, 'trial map objects stand on passable ground and do not overlap');
  const S = Adv.create(M, T.setup), hero = S.heroes[0];
  const lost = M.objs.filter(o => o.l === 0 && H.OBJ[o.t].kind !== 'decor').filter(o => { const e = MD.entry(o) || [o.c, o.r]; return !(e[0] === hero.c && e[1] === hero.r) && !Adv.path(S, hero, e[0], e[1]); });
  ok(!lost.length, 'every object on the surface can be reached: ' + lost.map(o => o.t).join());
  ok(M.objs.every(o => H.OBJ[o.t] && (o.t !== 'monster' || (H.UNITS[o.unit] && H.MAP.mood[o.mood]))), 'every object type and guard is known');
  ok(JSON.stringify(Adv.create(H.Maps.trial().map, T.setup)) === JSON.stringify(Adv.create(H.Maps.trial().map, T.setup)), 'the same map gives the same game state');
}

const TW = H.Town;
const townMap = (faction, built, more) => {
  const M = MD.create(30, 20, ['meadow']);
  MD.add(M, { t: 'town', c: 10, r: 5, owner: 0, faction, name: 'Проба', built: built || ['hall1', 'tavern', 'dwell1'] });
  for (const o of more || []) MD.add(M, Object.assign({ owner: 0, l: 0 }, o));
  const S = Adv.create(M, { seed: 11, moons: null, players: [{ name: 'Игрок', color: 0, faction, human: true }], heroes: [{ owner: 0, hid: 'renier', name: 'Ренье Даль', cls: 'captain', faction: 'league', c: 12, r: 7, army: [{ unit: 'militia', count: 10 }] }] });
  return { S, o: TW.list(S)[0], res: S.players[0].res, hero: S.heroes[0] };
};
const days = (S, n) => {
  for (let i = 0; i < n; i++) Adv.endDay(S);
};

{
  const A = H.Art, layers = A.TOWN_LAYERS.map(l => l[0]), RES = H.RESOURCES.map(r => r[0]);
  for (const [fid, f] of Object.entries(H.FACTIONS)) {
    const ids = f.buildings.filter(b => !b.step).map(b => b.id);
    ok(ids.length === new Set(ids).size && ids.length === layers.length && layers.every(id => f.building[id]), fid + ': one building for every town layer (' + ids.length + ')');
    ok(f.buildings.every(b => b.name && b.about && b.needs.every(n => f.building[n] && n !== b.id)), fid + ': every building has a name, a text and known needs');
    ok(f.buildings.every(b => Object.entries(b.cost).every(([k, v]) => RES.includes(k) && v > 0) && (b.id === 'hall1' || b.cost.gold > 0)), fid + ': prices use known resources and gold');
    const done = new Set();
    let grew = true;
    while (grew) {
      grew = false;
      for (const b of f.buildings) {
        if (!done.has(b.id) && b.needs.every(n => done.has(n))) {
          done.add(b.id);
          grew = true;
        }
      }
    }
    ok(done.size === f.buildings.length, fid + ': the tree has no loops and every building can be reached');
    const scene = A.TOWNS.find(t => t.faction === fid);
    ok([1, 2, 3, 4].every(i => f.building['special' + i].name === scene.layers.find(l => l[0] === 'special' + i)[1]), fid + ': special buildings match the town scene layers');
    ok([1, 2, 3, 4, 5, 6, 7].every(t => f.building['dwell' + t].dwelling === t && f.building['dwell' + t + 'u'].upgrade === t && f.building['dwell' + t + 'u'].needs.includes('dwell' + t)), fid + ': seven dwellings, each with its upgrade');
    ok(f.units.every((row, i) => row.every((id, k) => A.UNITS[id].tier === i + 1 && A.UNITS[id].base === row[0] && A.UNITS[id].branch === ['', 'a', 'b'][k])), fid + ': tier rows match the branches in the picture list');
    const heroes = H.HEROES.filter(x => !x.story && H.CLASSES[x.cls].faction === fid), classes = Object.keys(H.CLASSES).filter(c => H.CLASSES[c].faction === fid);
    ok(heroes.length === 8 && classes.length === 2 && classes.every(c => heroes.filter(x => x.cls === c).length === 4), fid + ': 8 heroes, 4 of each class');
    ok(classes.every(c => H.CLASSES[c].name === A.MAP_HEROES.find(m => m.id === 'mapero/' + c).name) && heroes.every(x => x.army.every(([u, lo, hi]) => H.UNITS[u].faction === fid && H.UNITS[u].tier <= 3 && lo >= 1 && lo <= hi)), fid + ': classes match the map figures, heroes start with tiers 1 to 3');
  }
  const names = H.HEROES.map(x => x.name), hid = H.HEROES.map(x => x.id);
  ok(new Set(names).size === names.length && new Set(hid).size === hid.length, 'hero names and ids do not repeat');
  ok(TW.RUMORS.length >= 8 && TW.RUMORS.every(s => s.length < 120), 'tavern rumors are short');
}

{
  const { S, o, res } = townMap('league');
  const gold = res.gold, wood = res.wood, ore = res.ore;
  const st = TW.state(S, o, 'dwell4');
  ok(st.s === 'needs' && st.needs.join() === 'dwell2,smith', 'a dwelling waits for the buildings it needs');
  ok(TW.build(S, o, 'dwell2').ok && res.gold === gold - 1000 && res.wood === wood - 5 && res.ore === ore - 5, 'building takes its price');
  ok(o.pool[1] === H.UNITS.crossbow.growth, 'a new dwelling gives the growth of the week at once');
  ok(!TW.build(S, o, 'market').ok && TW.state(S, o, 'market').s === 'today', 'one building per day');
  days(S, 1);
  ok(TW.build(S, o, 'market').ok, 'the next day the town builds again');
  res.gold = 100;
  days(S, 1);
  const money = TW.state(S, o, 'smith');
  ok(money.s === 'money' && money.miss.gold === 1000 - 600 && !money.miss.ore, 'missing resources are counted');
  ok(!TW.build(S, o, 'smith').ok && res.gold === 600, 'a building without money is not built');
}

{
  const { S, o, res, hero } = townMap('league');
  ok(!TW.build(S, o, 'dwell1u').ok && !o.built.includes('dwell1u'), 'an upgraded dwelling needs a branch');
  ok(TW.build(S, o, 'dwell1u', 'a').ok && o.branch[1] === 'a', 'the branch is chosen with the building');
  ok(TW.offers(o, 1).join() === 'militia,pikeman', 'the town recruits the base and its own branch');
  ok(!TW.recruit(S, o, 1, 'shieldbearer', 1).ok, 'the other branch cannot be recruited here');
  days(S, 1);
  ok(TW.state(S, o, 'dwell1u').s === 'built' && !TW.build(S, o, 'dwell1u', 'b').ok && o.branch[1] === 'a', 'the choice is for good');
  const total = TW.upgradeTotal(S, o, 1), gold = res.gold;
  ok(total.gold === 10 * (H.UNITS.pikeman.cost - H.UNITS.militia.cost), 'upgrading a stack costs the price difference');
  TW.upgradeAll(S, o, 1);
  ok(hero.army[0].unit === 'pikeman' && hero.army[0].count === 10 && res.gold === gold - total.gold, 'base creatures of the visiting hero become the town branch');
  const M = MD.create(30, 20, ['meadow']);
  MD.add(M, { t: 'town', c: 2, r: 2, owner: 0, faction: 'league', name: 'А', built: ['hall1', 'dwell1'] });
  MD.add(M, { t: 'town', c: 12, r: 2, owner: 0, faction: 'league', name: 'Б', built: ['hall1', 'dwell1'] });
  const S2 = Adv.create(M, { seed: 3, moons: null, players: [{ name: 'Игрок', color: 0, faction: 'league', human: true }], heroes: [] });
  const [a, b] = TW.list(S2);
  TW.build(S2, a, 'dwell1u', 'a');
  TW.build(S2, b, 'dwell1u', 'b');
  ok(TW.offers(a, 1)[1] === 'pikeman' && TW.offers(b, 1)[1] === 'shieldbearer', 'another town of the same people may choose the other branch');
}

{
  const { S, o } = townMap('league', ['hall1', 'tavern', 'dwell1', 'dwell2', 'dwell3', 'fort1', 'fort2']);
  ok(o.pool[0] === Math.round(18 * 1.25) && o.pool[2] === Math.round(7 * 1.25), 'a stone wall adds 25 % growth');
  days(S, 7);
  ok(o.pool[0] === 2 * Math.round(18 * 1.25), 'growth arrives on the first day of the week');
  days(S, 7);
  ok(o.pool[0] === 2 * Math.round(18 * 1.25), 'creatures pile up to two weeks of growth');
  const k = townMap('league', ['hall1', 'dwell1', 'dwell3', 'fort1', 'fort2', 'fort3', 'special2']).o;
  ok(k.pool[0] === 27 && k.pool[2] === Math.round(7 * 1.5) + 2, 'a fortress adds 50 % and the bell tower two ringers');
  const g = townMap('barrows', ['hall1', 'dwell1', 'dwell2', 'special3']).o;
  ok(g.pool[1] === H.UNITS.horsebow.growth + 3, 'the horse pasture adds three horse archers');
}

{
  const { S, o, res, hero } = townMap('league', ['hall1', 'tavern', 'dwell1', 'dwell2', 'dwell3']);
  res.gold = 1500;
  const plan = TW.recruitPlan(S, o);
  ok(plan.map(p => p.tier).join() === '3,2,1' && plan[0].n === 7 && plan[1].n === 5 && plan[2].n === 1, 'recruit all goes from the top tier down with the gold there is');
  TW.recruitAll(S, o);
  ok(res.gold === 1500 - 7 * H.UNITS.ringer.cost - 5 * H.UNITS.crossbow.cost - H.UNITS.militia.cost && o.pool.slice(0, 3).join() === [H.UNITS.militia.growth - 1, H.UNITS.crossbow.growth - 5, 0].join(), 'recruit all pays and takes from the pools');
  ok(hero.army[0].count === 11 && hero.army[1].unit === 'ringer' && hero.army[2].unit === 'crossbow', 'recruits join the visiting hero');
  res.gold = 99999;
  for (let i = 3; i < 7; i++) hero.army[i] = { unit: 'shade', count: 1 };
  ok(TW.recruit(S, o, 2, 'crossbow', 1).ok && hero.army[2].count === 6, 'a stack of the same creature takes more recruits');
  hero.army[1] = { unit: 'shade', count: 1 };
  hero.army[2] = { unit: 'shade', count: 1 };
  ok(!TW.recruit(S, o, 3, 'ringer', 0).ok && TW.canRecruit(S, o, 2, 'crossbow') > 0 && TW.recruit(S, o, 2, 'crossbow', 2).ok && o.garrison.some(s => s && s.unit === 'crossbow'), 'with a full hero army recruits stay in the garrison');
  const from = { side: 'garrison', slot: o.garrison.findIndex(Boolean) };
  ok(TW.move(S, o, from, { side: 'hero', slot: 1 }) && hero.army[1].unit === 'crossbow' && o.garrison[from.slot].unit === 'shade', 'moving onto another stack swaps them');
  const lone = townMap('league');
  lone.hero.c = 0;
  lone.hero.r = 0;
  lone.o.garrison[0] = { unit: 'militia', count: 3 };
  ok(!TW.visitor(lone.S, lone.o) && !TW.move(lone.S, lone.o, { side: 'garrison', slot: 0 }, { side: 'hero', slot: 0 }), 'without a visiting hero there is no hero row');
  const t = townMap('league');
  ok(!TW.move(t.S, t.o, { side: 'hero', slot: 0 }, { side: 'garrison', slot: 0 }) && t.hero.army[0].count === 10, 'the last stack never leaves the hero');
  t.o.garrison[3] = { unit: 'militia', count: 5 };
  ok(TW.move(t.S, t.o, { side: 'garrison', slot: 3 }, { side: 'hero', slot: 0 }) && t.hero.army[0].count === 15 && !t.o.garrison[3], 'moving onto the same creature merges the stacks');
}

{
  const { S, o, res } = townMap('league', ['hall1', 'market']);
  const q = TW.quote(S, 0, 'wood', 'gold');
  ok(q.k === 1 && q.give === 75 && q.get === 1 && q.max === res.wood * 75, 'one market sells wood for 75 gold');
  ok(TW.quote(S, 0, 'gold', 'salt').get === 1260 && TW.quote(S, 0, 'wood', 'wood') === null, 'buying salt costs 1260 gold, no trade of a resource for itself');
  const wood = res.wood, gold = res.gold, r = TW.trade(S, 0, 'wood', 'gold', 150);
  ok(r.ok && res.wood === wood - 2 && res.gold === gold + 150, 'a trade takes only what the received amount needs');
  ok(!TW.trade(S, 0, 'gold', 'sulfur', 1000).ok, 'a trade cannot take more than the player has');
  let fair = true, better = true;
  for (let k = 1; k <= 9; k++) {
    for (const [id] of H.RESOURCES.slice(1)) {
      const sell = Math.round(H.TOWN.value[id] * (H.TOWN.sell[0] + H.TOWN.sell[1] * k) * 100) / 100, buy = Math.round(H.TOWN.value[id] * (H.TOWN.buy[0] - H.TOWN.buy[1] * k) * 100) / 100;
      if (sell >= buy) fair = false;
      if (k > 1 && sell <= Math.round(H.TOWN.value[id] * (H.TOWN.sell[0] + H.TOWN.sell[1] * (k - 1)) * 100) / 100) better = false;
    }
  }
  ok(fair && better, 'buying always costs more than selling, and each market makes the rate better');
  const two = townMap('league', ['hall1', 'market'], [{ t: 'town', c: 20, r: 5, faction: 'league', name: 'Второй', built: ['hall1', 'market', 'hall2', 'special4'] }]);
  ok(TW.markets(two.S, 0) === 3 && TW.quote(two.S, 0, 'wood', 'gold').give === 105, 'every market and the trade chamber add a step');
  ok(TW.quote(townMap('league', ['hall1']).S, 0, 'wood', 'gold') === null, 'no market, no trade');
}

{
  const { S, o, res } = townMap('league');
  ok(o.tavern.length === 2 && H.CLASSES[H.HEROES.find(x => x.id === o.tavern[0]).cls].faction === 'league' && o.tavern.every(Boolean) && o.tavern[0] !== o.tavern[1], 'the tavern offers two heroes, the first of the town people');
  ok(!o.tavern.includes('renier'), 'a hero in play is not offered');
  const gold = res.gold, id = o.tavern[0], r = TW.hire(S, o, 0), hero = S.heroes[1];
  ok(r.ok && res.gold === gold - H.TOWN.heroPrice && hero.hid === id && hero.alive && hero.army.filter(Boolean).length === H.HEROES.find(x => x.id === id).army.length, 'hiring costs 2500 gold and brings the army of the hero');
  ok(Math.max(Math.abs(hero.c - 12), Math.abs(hero.r - 7)) === 1 && !o.tavern.includes(id), 'the new hero stands next to the busy gate and leaves the offers');
  res.gold = 99999;
  for (let i = 0; i < 6; i++) TW.hire(S, o, 1);
  ok(S.heroes.filter(h => h.alive).length === 8 && TW.hireBlock(S, o) && !TW.hire(S, o, 0).ok, 'no more than 8 heroes');
  days(S, 7);
  ok(o.tavern.every(x => !x || !S.heroes.some(h => h.alive && h.hid === x)), 'new offers each week skip heroes in play');
  ok(TW.rumor(S) && TW.RUMORS.includes(TW.rumor(S)), 'a rumor of the week');
}

{
  const inc = built => TW.income(townMap('league', built).S, 0);
  ok(inc(['hall1']).gold === 500 && inc(['hall1', 'tavern', 'hall2']).gold === 1000 && inc(['hall1', 'tavern', 'hall2', 'market', 'guild1', 'hall3']).gold === 2000 && inc(['hall1', 'tavern', 'hall2', 'market', 'guild1', 'hall3', 'fort1', 'fort2', 'hall4']).gold === 3500, 'town hall gives 500, 1000, 2000 and 3500 gold a day');
  ok(inc(['hall1', 'market', 'store']).salt === 1 && inc(['hall1', 'smith', 'special3']).sulfur === 1, 'the store and the powder yard bring a rare resource a day');
  const { S, res } = townMap('league', ['hall1', 'market', 'store']);
  const gold = res.gold, salt = res.salt;
  days(S, 1);
  ok(res.gold === gold + 500 && res.salt === salt + 1, 'town income arrives with the new day');
  const two = townMap('league', ['hall1', 'tavern', 'hall2', 'market', 'guild1', 'hall3', 'fort1', 'fort2', 'hall4'], [{ t: 'town', c: 20, r: 5, faction: 'league', name: 'Второй', built: ['hall1', 'tavern', 'hall2', 'market', 'guild1', 'hall3', 'fort1', 'fort2'] }]);
  const second = TW.list(two.S)[1];
  ok(TW.state(two.S, second, 'hall4').s === 'forbidden', 'one capital per player');
  two.S.map.forbid = ['special1'];
  ok(TW.state(two.S, second, 'special1').why === 'запрещено на этой карте' && TW.state(two.S, second, 'shipyard').s === 'forbidden' && TW.state(two.S, second, 'altar').s === 'forbidden', 'a map can forbid a building; the shipyard needs water and the altar the Heart');
}

{
  const free = townMap('league', ['hall1'], [{ t: 'town', c: 20, r: 5, owner: -1, faction: 'barrows', name: 'Ничей', built: ['hall1', 'dwell1'] }]);
  const ev = walk(free.S, 22, 7), town = TW.list(free.S, 0).find(x => x.name === 'Ничей');
  ok(town && ev.some(e => e.t === 'townTaken') && ev.some(e => e.t === 'town'), 'a town without a garrison falls to a step');
  ok(TW.offers(town, 1).join() === 'shade' && town.pool[0] === H.UNITS.shade.growth, 'the new owner gets the dwellings and their growth');
  const guarded = townMap('league', ['hall1'], [{ t: 'town', c: 20, r: 5, owner: -1, faction: 'barrows', name: 'Застава', built: ['hall1'], garrison: [{ unit: 'shade', count: 6 }] }]);
  guarded.hero.army[1] = { unit: 'plated', count: 20 };
  walk(guarded.S, 22, 7);
  const p = guarded.S.pending;
  ok(p && p.kind === 'town', 'a garrison stops the hero at the gate');
  const setup = Adv.battleSetup(guarded.S);
  ok(setup.sides[1].stacks.length === 1 && setup.sides[1].stacks[0].count === 6, 'the battle is against the garrison as it stands');
  const B = H.Battle.create(setup);
  H.BattleAI.play(B, 100);
  const after = Adv.battleDone(guarded.S, B), taken = TW.list(guarded.S, 0).find(x => x.name === 'Застава');
  ok(B.winner === 0 && taken && !taken.garrison.some(Boolean) && after.some(e => e.t === 'townTaken'), 'winning the battle takes the town');
  const back = townMap('league', ['hall1'], [{ t: 'town', c: 20, r: 5, owner: -1, faction: 'barrows', name: 'Застава', built: ['hall1'], garrison: [{ unit: 'eaglespirit', count: 9 }] }]);
  walk(back.S, 22, 7);
  Adv.resolve(back.S, 'retreat');
  ok(!back.S.pending && back.hero.r === 8, 'retreat steps back from the gate');
}

{
  const T = H.Maps.trial(), S = Adv.create(T.map, T.setup), [mine, other] = TW.list(S), hero = S.heroes[0];
  ok(mine.owner === 0 && mine.faction === 'league' && TW.visitor(S, mine) === hero, 'the trial map starts with the hero at the gate of his town');
  ok(other.owner === -1 && other.faction === 'barrows' && other.garrison.some(Boolean), 'a guarded town of the Курганы waits on the steppe');
  const res = S.players[0].res, plan = ['dwell3', 'market', 'smith', 'hall2', 'guild1', 'dwell1u', 'dwell4', 'store', 'fort2', 'dwell5', 'special2', 'dwell2u', 'dwell3u', 'guild2', 'hall3'];
  let built = 0;
  const start = Adv.armyValue(hero.army);
  for (const o of S.map.objs) if (o.t === 'sawmill' || o.t === 'oremine') o.owner = 0;
  TW.hire(S, mine, 0);
  for (let day = 1; day <= 21; day++) {
    if ((day - 1) % 7 === 0) TW.recruitAll(S, mine);
    const next = plan.find(id => TW.state(S, mine, id).s === 'ok');
    if (next && TW.build(S, mine, next, 'a').ok) built++;
    Adv.endDay(S);
  }
  ok(built >= 12 && mine.built.includes('dwell1u') && mine.branch[1] === 'a', 'three weeks on the trial map with the sawmill and the ore mine: twelve buildings and a chosen branch (' + built + ')');
  ok(S.heroes.filter(h => h.alive && h.owner === 0).length === 2 && Adv.armyValue(hero.army) >= 2 * start, 'two heroes and an army at least twice as strong after three weeks (' + start + ' to ' + Adv.armyValue(hero.army) + ')');
  ok(res.gold >= 0 && Object.values(res).every(v => v >= 0), 'resources never go below zero');
}

const HE = H.Hero;
const heroMap = (cls, more) => {
  const M = MD.create(30, 20, ['meadow']);
  const S = Adv.create(M, { seed: more && more.seed || 21, moons: null, players: [{ name: 'Игрок', color: 0, faction: H.CLASSES[cls].faction, human: true }], heroes: [Object.assign({ owner: 0, name: 'Проба', cls, faction: H.CLASSES[cls].faction, c: 5, r: 5, army: [{ unit: H.FACTIONS[H.CLASSES[cls].faction].units[0][0], count: 30 }] }, more || {})] });
  return { S, h: S.heroes[0] };
};
const fought = (a, b, hero, extra) => BA.create(Object.assign({ seed: 7, obstacles: [], ready: Array(a.length + b.length).fill(100), sides: [{ stacks: a, hero }, { stacks: b }] }, extra || {}));

{
  const A = H.Art, skills = Object.keys(H.SKILLS);
  ok(skills.length === 19 && skills.every(id => A.SKILL_ICONS.find(e => e.id === 'skill/' + id).name === H.SKILLS[id].name), '19 skills, each with its icon entry');
  ok(skills.every(id => H.SKILLS[id].ranks.length === 3 && H.SKILLS[id].vals.length === 3 && H.SKILLS[id].perks.length === 2), 'every skill has three ranks and two master tricks');
  ok(Object.keys(H.PERKS).length === 38 && Object.values(H.PERKS).every(p => A.SKILL_ICONS.find(e => e.id === 'perk/' + p.id).name === p.name && p.about), '38 master tricks with icon entries and texts');
  ok(Object.values(H.TALENTS).every(t => A.SKILL_ICONS.find(e => e.id === 'talent/' + t.id).name === t.name && t.about), 'every talent of the gifts has its icon entry');
  for (const [fid, f] of Object.entries(H.FACTIONS)) {
    ok(H.HERO.talentLevels.every(L => f.gift.talents[L].length === 2) && f.gift.high.needs.length === 2 && f.gift.high.needs.every(id => H.SKILLS[id]), fid + ': gift has two talents on levels 6, 12 and 18 and a high gift with two skills');
  }
  ok(Object.values(H.CLASSES).every(c => Object.values(c.stats).reduce((t, v) => t + v, 0) === 100 && Object.keys(c.cards).every(id => H.SKILLS[id])), 'class stat weights sum to 100, cards are known skills');
  ok(H.HEROES.every(x => x.spec && x.spec.name && x.spec.about && x.bio.length > 40 && Object.keys(x.skills).length >= 1 && Object.keys(x.skills).length <= 2 && Object.keys(x.skills).every(id => H.SKILLS[id]) && x.army.length >= 2), 'every hero has a speciality, start skills, an army and a biography');
  ok(H.HEROES.filter(x => H.CLASSES[x.cls].mage).every(x => Object.keys(x.skills).some(id => H.SKILLS[id].school && H.FACTIONS[H.CLASSES[x.cls].faction].schools.includes(id))), 'every mage starts with a school of the people');
  ok(H.HEROES.every(x => A.PORTRAITS.some(e => e.id === 'portrait/' + x.id && e.look)), 'every hero has a portrait entry');
  ok(H.HEROES.filter(x => x.spec.kind === 'skill').every(x => x.skills[x.spec.skill]), 'a hero with a skill speciality starts with that skill');
  ok(H.HEROES.filter(x => x.spec.kind === 'unit').every(x => H.FACTIONS[H.CLASSES[x.cls].faction].units.some(u => u[0] === x.spec.row)), 'a creature speciality points to a creature of the hero people');
  const arts = Object.values(H.ARTIFACTS).filter(a => !a.scroll), kinds = new Set(arts.map(a => a.slot));
  ok(arts.length === 117 && ['head', 'neck', 'shoulders', 'body', 'right', 'left', 'ring', 'legs', 'charm'].every(s => kinds.has(s)), '117 release artifacts on every kind of place');
  ok(arts.every(a => a.name && a.about && H.ART_RANKS[a.rank] && Object.keys(a.fx).length), 'every artifact has a name, a rank, a text and an effect');
  ok(new Set(arts.map(a => a.name)).size === arts.length, 'artifact names do not repeat');
  const X = H.XP_TABLE;
  ok(X.length === 31 && X[1] === 0 && X.every((v, i) => i < 2 || v > X[i - 1]), 'experience table for 30 levels grows');
  ok(HE.levelFor(0) === 1 && HE.levelFor(X[2] - 1) === 1 && HE.levelFor(X[2]) === 2 && HE.levelFor(X[30] * 10) === 30, 'level from experience, cap 30');
}

{
  const { S, h } = heroMap('captain');
  ok(h.atk === 2 && h.def === 2 && h.power === 1 && h.wis === 1 && h.mana === 10 && h.level === 1, 'a warrior starts with 2, 2, 1, 1');
  const mage = heroMap('magister').h;
  ok(mage.atk === 1 && mage.def === 1 && mage.power === 2 && mage.wis === 2 && mage.mana === 20, 'a mage starts with 1, 1, 2, 2');
  const named = heroMap('captain', { hid: 'adelina' }).h;
  ok(named.skills.leadership === 1 && named.skills.offense === 1 && HE.spec(named).name === 'Набат', 'a named hero starts with the skills and the speciality of the record');
  const counts = { atk: 0, def: 0, power: 0, wis: 0 }, cards = {};
  let pairs = true;
  for (let seed = 1; seed <= 2000; seed++) {
    const t = heroMap('captain', { seed });
    t.h.xp = H.XP_TABLE[2];
    const up = HE.nextUp(t.S, t.h);
    counts[up.stat]++;
    if (up.cards.length !== 2 || up.cards[0].skill === up.cards[1].skill || !up.cards.every(c => c.rank === 1)) pairs = false;
    for (const c of up.cards) cards[c.skill] = (cards[c.skill] || 0) + 1;
  }
  ok(pairs, 'every new level offers two different skills');
  ok(Math.abs(counts.atk / 2000 - 0.4) < 0.04 && Math.abs(counts.def / 2000 - 0.35) < 0.04 && Math.abs(counts.power / 2000 - 0.1) < 0.03 && Math.abs(counts.wis / 2000 - 0.15) < 0.03, 'stat growth follows the class weights: ' + JSON.stringify(counts));
  ok(cards.offense > cards.tactics && cards.tactics > cards.scouting && cards.scouting > cards.sorcery, 'cards follow the class weights');
  ok(H.CLASSES.magister.cards.yasna > H.CLASSES.captain.cards.yasna && H.CLASSES.shaman.cards.tlen > H.CLASSES.noyon.cards.tlen, 'mages are offered their schools more often than warriors');
  h.xp = H.XP_TABLE[2];
  const before = h.atk + h.def + h.power + h.wis, up = HE.nextUp(S, h);
  ok(h.level === 2 && h.atk + h.def + h.power + h.wis === before + 1 && HE.nextUp(S, h) === up && up.step === 'card', 'a new level raises one stat and waits for the card');
  ok(HE.levelPending(h), 'the choice cannot be put off');
  const c = up.cards[0];
  ok(HE.pickCard(h, 0) && h.skills[c.skill] === 1 && !h.up && !HE.levelPending(h), 'a card teaches the skill');
  const master = heroMap('captain', { skills: { offense: 2 } }).h;
  master.up = { level: 2, stat: 'atk', step: 'card', cards: [{ skill: 'offense', rank: 3 }, { skill: 'luck', rank: 1 }], perks: null, talents: null };
  HE.pickCard(master, 0);
  ok(master.up && master.up.step === 'perk' && master.up.perks.join() === 'finish,firstcharge', 'mastering a skill asks for one of two tricks');
  ok(HE.pickPerk(master, 1) && master.perks.join() === 'firstcharge' && !master.up, 'the trick is for good');
  const six = heroMap('captain', { skills: { offense: 3, defense: 3, tactics: 3, archery: 3, leadership: 3, luck: 3 } });
  six.h.xp = H.XP_TABLE[2];
  ok(HE.nextUp(six.S, six.h).step === 'done' && !HE.nextUp(six.S, six.h).cards.length, 'six mastered skills leave no cards');
  HE.closeUp(six.h);
  ok(!six.h.up, 'the window closes without a choice');
  const room = heroMap('captain', { skills: { offense: 1, defense: 2, tactics: 1, archery: 1, leadership: 1, luck: 1 } });
  room.h.xp = H.XP_TABLE[2];
  ok(HE.nextUp(room.S, room.h).cards.every(k => room.h.skills[k.skill] && k.rank === room.h.skills[k.skill] + 1), 'with six skills only their next ranks are offered');
}

{
  const t = heroMap('captain'), { S, h } = t;
  h.xp = H.XP_TABLE[6];
  while (h.level < 5) {
    HE.nextUp(S, h);
    HE.pickCard(h, 0);
    if (h.up) HE.pickPerk(h, 0);
  }
  const up = HE.nextUp(S, h);
  ok(up.level === 6 && up.talents.join() === 'league-1,league-2', 'level 6 offers the two talents of the gift');
  HE.pickCard(h, 0);
  if (h.up.step === 'perk') HE.pickPerk(h, 0);
  ok(h.up.step === 'talent', 'the talent is the second step of the window');
  ok(HE.pickTalent(h, 1) && h.talents.join() === 'league-2' && !h.up, 'the talent is for good');
  const foreign = heroMap('noyon'), other = foreign.h;
  other.xp = H.XP_TABLE[6];
  HE.autoUp(foreign.S, other);
  ok(other.level === 6 && other.talents.length === 1 && H.TALENTS[other.talents[0]].faction === 'barrows', 'a hero takes the gift of his own people');
  const hi = heroMap('captain', { skills: { leadership: 3 } }).h;
  let st = HE.highState(hi);
  ok(!st.open && st.missing.join() === 'Машины', 'the window names the skill the high gift still needs');
  hi.skills.machines = 3;
  ok(!HE.highState(hi).open && !HE.battleHero(hi).high, 'the high gift waits for level 24');
  hi.level = 24;
  ok(HE.highState(hi).open && HE.battleHero(hi).high === 'nabat', 'level 24 and two master skills open the high gift');
  const shaman = heroMap('shaman', { skills: { leadership: 3 } }).h;
  shaman.level = 24;
  ok(HE.highState(shaman).missing.join() === 'Тлень', 'the high gift of the Курганы needs a school skill');
  const full = heroMap('noyon');
  full.h.xp = H.XP_TABLE[30];
  HE.autoUp(full.S, full.h);
  ok(full.h.level === 30 && Object.keys(full.h.skills).length <= 6 && full.h.talents.length === 3 && !HE.levelPending(full.h), 'thirty levels: no more than six skills, three talents');
  ok(full.h.atk + full.h.def + full.h.power + full.h.wis === 6 + 29, 'one stat point per level');
  ok(Object.keys(full.h.skills).every(id => full.h.skills[id] >= 1 && full.h.skills[id] <= 3) && full.h.perks.every(id => full.h.skills[H.PERKS[id].skill] === 3), 'tricks only on mastered skills');
}

{
  const zero = () => [{ unit: 'plated', count: 10 }], foe = () => [{ unit: 'militia', count: 50 }];
  const base = fought(zero(), foe());
  const f0 = BA.forecast(base, base.stacks[0], base.stacks[1], 'melee');
  const strong = fought(zero(), foe(), { atk: 5, def: 3 });
  ok(BA.atkOf(strong.stacks[0]) === H.UNITS.plated.atk + 5 && BA.defOf(strong.stacks[0], 0) === H.UNITS.plated.def + 3, 'hero stats add to every stack');
  const f1 = BA.forecast(strong, strong.stacks[0], strong.stacks[1], 'melee');
  ok(f1.max > f0.max, 'a hero with Натиск hits harder');
  const off = fought(zero(), foe(), { melee: 0.15 }), f2 = BA.forecast(off, off.stacks[0], off.stacks[1], 'melee');
  ok(Math.abs(f2.max / f0.max - 1.15) < 0.01, 'Нападение adds to close damage: ' + f2.max + ' / ' + f0.max);
  const gd = fought(foe(), zero(), null), gd2 = BA.create({ seed: 7, obstacles: [], ready: Array(2).fill(100), sides: [{ stacks: foe() }, { stacks: zero(), hero: { guard: 0.15 } }] });
  ok(Math.abs(BA.forecast(gd2, gd2.stacks[0], gd2.stacks[1], 'melee').max / BA.forecast(gd, gd.stacks[0], gd.stacks[1], 'melee').max - 0.85) < 0.02, 'Оборона cuts close damage');
  const shooters = () => [{ unit: 'crossbow', count: 40 }];
  const sb = fought(shooters(), foe()), sh = fought(shooters(), foe(), { ranged: 0.15, shots: 2, aim: true });
  const far0 = BA.forecast(sb, sb.stacks[0], sb.stacks[1], 'shot'), far1 = BA.forecast(sh, sh.stacks[0], sh.stacks[1], 'shot');
  ok(Math.abs(far1.max / far0.max - 2 * 1.15) < 0.03, 'Стрельба adds damage and Меткость removes the range penalty: ' + far1.max + ' / ' + far0.max);
  ok(sh.stacks[0].shots === H.UNITS.crossbow.shots + 2 && sb.stacks[0].shots === H.UNITS.crossbow.shots, 'Запас adds shots');
  const rd = BA.create({ seed: 7, obstacles: [], ready: [10, 30], sides: [{ stacks: [{ unit: 'militia', count: 5 }], hero: { firstReady: 20, enemyReady: 20 } }, { stacks: [{ unit: 'militia', count: 5 }] }] });
  ok(rd.stacks[0].ready >= 30 && rd.stacks[1].ready >= 10 && rd.stacks[0].ready - rd.stacks[1].ready === 20, 'Первый натиск and Засада shift readiness in the first round');
  const st = fought(zero(), foe(), { stand: 0.2 });
  st.stacks[0].defending = true;
  ok(Math.abs(BA.defOf(st.stacks[0], 0) - H.UNITS.plated.def * 1.6) < 1e-9, 'Глухая оборона adds to defending');
  const rt = fought(foe(), [{ unit: 'plated', count: 10 }], null), rt2 = BA.create({ seed: 7, obstacles: [], ready: [100, 100], sides: [{ stacks: foe() }, { stacks: zero(), hero: { retal: 0.25 } }] });
  ok(BA.forecast(rt2, rt2.stacks[0], rt2.stacks[1], 'melee').retal.max > BA.forecast(rt, rt.stacks[0], rt.stacks[1], 'melee').retal.max, 'Ответ strengthens the answer');
  const fin = fought(zero(), foe(), { finish: 0.25 });
  const a0 = BA.forecast(fin, fin.stacks[0], fin.stacks[1], 'melee').max;
  fin.stacks[1].count = 20;
  ok(Math.abs(BA.forecast(fin, fin.stacks[0], fin.stacks[1], 'melee').max / a0 - 1.25) < 0.01, 'Добить adds damage to a stack below half health');
  const lucky = BA.create({ seed: 9, obstacles: [], sides: [{ stacks: [{ unit: 'militia', count: 200 }], luck: -3, hero: { fortune: true } }, { stacks: [{ unit: 'plated', count: 40 }] }] });
  const evs = [];
  while (lucky.winner < 0 && lucky.round < 40) evs.push(...BA.act(lucky, AI.choose(lucky)));
  ok(!evs.some(e => e.t === 'hit' && e.by === 0 && e.luck < 0), 'Везение: bad luck does not fire');
  const mixed = [{ unit: 'militia', count: 5 }, { unit: 'shade', count: 5 }], me = BA.create({ seed: 3, obstacles: [], sides: [{ stacks: mixed }, { stacks: foe() }] }), ban = BA.create({ seed: 3, obstacles: [], sides: [{ stacks: mixed, hero: { banner: true } }, { stacks: foe() }] });
  ok(me.sides[0].mix === 1 && ban.sides[0].mix === 0, 'Знамя removes the penalty for mixed peoples');
  const form = () => BA.create({ seed: 7, obstacles: [], ready: [0, 0, 0, 100], sides: [{ stacks: [{ unit: 'militia', count: 200, c: 5, r: 5 }, { unit: 'militia', count: 200, c: 4, r: 4 }, { unit: 'militia', count: 200, c: 4, r: 6 }], hero: { formation: 0.45 } }, { stacks: [{ unit: 'plated', count: 2, c: 6, r: 5 }] }] });
  const fm = form(), fz = BA.create({ seed: 7, obstacles: [], ready: [0, 0, 0, 100], sides: [{ stacks: [{ unit: 'militia', count: 200, c: 5, r: 5 }, { unit: 'militia', count: 200, c: 4, r: 4 }, { unit: 'militia', count: 200, c: 4, r: 6 }] }, { stacks: [{ unit: 'plated', count: 2, c: 6, r: 5 }] }] });
  ok(Math.abs(BA.forecast(fm, fm.stacks[1], fm.stacks[3], 'support').max / BA.forecast(fz, fz.stacks[1], fz.stacks[3], 'support').max - 1.5) < 0.02, 'Сомкнуть ряды raises the formation strike to 45 %');
  const near = BA.create({ seed: 7, obstacles: [], ready: [0, 0, 100], sides: [{ stacks: [{ unit: 'militia', count: 10, c: 1, r: 4 }, { unit: 'militia', count: 10, c: 1, r: 5 }], hero: { shieldWall: 0.15 } }, { stacks: [{ unit: 'crossbow', count: 10, c: 12, r: 4 }] }] });
  const lone = BA.create({ seed: 7, obstacles: [], ready: [0, 0, 100], sides: [{ stacks: [{ unit: 'militia', count: 10, c: 1, r: 4 }, { unit: 'militia', count: 10, c: 1, r: 8 }], hero: { shieldWall: 0.15 } }, { stacks: [{ unit: 'crossbow', count: 10, c: 12, r: 4 }] }] });
  ok(BA.forecast(near, near.stacks[2], near.stacks[0], 'shot').max < BA.forecast(lone, lone.stacks[2], lone.stacks[0], 'shot').max, 'Стена щитов cuts arrows at a stack with a neighbour');
  const gun = BA.create({ seed: 7, obstacles: [], ready: [100, 0], sides: [{ stacks: [{ unit: 'bombard', count: 2 }], hero: { gun: H.HERO.gun } }, { stacks: foe() }] }), plain0 = BA.create({ seed: 7, obstacles: [], ready: [100, 0], sides: [{ stacks: [{ unit: 'bombard', count: 2 }] }, { stacks: foe() }] });
  ok(gun.stacks[0].shots === H.UNITS.bombard.shots + 1 && Math.abs(BA.forecast(gun, gun.stacks[0], gun.stacks[1], 'shot').max / BA.forecast(plain0, plain0.stacks[0], plain0.stacks[1], 'shot').max - 1.2) < 0.01, 'Порох adds a shot and 20 % to bombards');
  const spec = fought([{ unit: 'ringer', count: 3 }, { unit: 'militia', count: 3 }], foe(), { unit: { units: ['ringer', 'alarmist', 'herald'], n: 2 } });
  ok(BA.atkOf(spec.stacks[0]) === H.UNITS.ringer.atk + 2 && BA.atkOf(spec.stacks[1]) === H.UNITS.militia.atk, 'a creature speciality helps only its creature');
  const star = fought([{ unit: 'militia', count: 3, stars: 2 }], foe());
  ok(BA.atkOf(star.stacks[0]) === H.UNITS.militia.atk + 2 && BA.defOf(star.stacks[0], 0) === H.UNITS.militia.def + 2, 'stars add Натиск and Стойкость');
  const plus = fought([{ unit: 'militia', count: 3 }], foe(), { init: 1 });
  ok(BA.initOf(plus.stacks[0]) === H.UNITS.militia.init + 1, 'the banner relic adds initiative');
}

{
  const lam = (hero) => BA.create({ seed: 5, obstacles: [], ready: [100, 0, 0], sides: [{ stacks: [{ unit: 'eaglespirit', count: 50, c: 8, r: 5 }] }, { stacks: [{ unit: 'shade', count: 1, c: 9, r: 5 }, { unit: 'horsebow', count: 5, c: 13, r: 0 }], hero }] });
  const hit = B => {
    const ev = BA.act(B, { type: 'attack', target: 1, c: 8, r: 5 });
    return ev;
  };
  const L = lam({ lamentReady: 10 }), rd = L.stacks[2].ready, lev = hit(L);
  ok(lev.some(e => e.t === 'lament') && L.stacks[2].ready >= rd + 10, 'Неутешные: the lament adds readiness');
  const top = lam({ lamentMax: 1 });
  top.stacks[2].lament = 3;
  hit(top);
  ok(top.stacks[2].lament === 4, 'Долгий плач lifts the lament cap to +4');
  const K = lam({ lastStrike: 0.5 }), kev = hit(K);
  ok(kev.some(e => e.t === 'hit' && e.kind === 'last' && e.by === 1 && e.to === 0 && e.dmg >= 1), 'Последний удар: a dying stack strikes its killer');
  const cry = BA.create({ seed: 5, obstacles: [], ready: [100, 0, 0], sides: [{ stacks: [{ unit: 'militia', count: 10 }, { unit: 'crossbow', count: 5 }], hero: { warcry: true } }, { stacks: [{ unit: 'militia', count: 5 }] }] });
  const r0 = cry.stacks[1].ready, act0 = cry.active;
  ok(BA.canOrder(cry, 'warcry'), 'Клич is ready');
  BA.act(cry, { type: 'order', order: 'warcry', target: 1 });
  ok(cry.stacks[1].ready === r0 + H.BATTLE.warcry && cry.active === act0 && !BA.canOrder(cry, 'warcry'), 'Клич gives +40 readiness, keeps the turn, once a battle');
  assert.throws(() => BA.act(cry, { type: 'order', order: 'warcry', target: 1 }));
  checks++;
  const nb = BA.create({ seed: 5, obstacles: [], ready: [100, 0, 0], sides: [{ stacks: [{ unit: 'militia', count: 10 }, { unit: 'crossbow', count: 5 }], hero: { high: 'nabat' } }, { stacks: [{ unit: 'militia', count: 5 }] }] });
  const m0 = BA.moraleOf(nb, nb.stacks[1]), r1 = nb.stacks[1].ready;
  BA.act(nb, { type: 'order', order: 'high' });
  ok(nb.stacks[1].ready === r1 + 40 && BA.moraleOf(nb, nb.stacks[1]) === m0 + 2 && !BA.canOrder(nb, 'high') && nb.sides[0].acted === nb.round, 'Великий набат: +40 readiness and +2 morale, once a battle');
  nb.round += 2;
  ok(BA.moraleOf(nb, nb.stacks[1]) === m0, 'the morale of the high gift lasts two rounds');
  const kr = BA.create({ seed: 5, obstacles: [], ready: [100, 0, 0], sides: [{ stacks: [{ unit: 'shade', count: 10 }, { unit: 'horsebow', count: 8 }], hero: { high: 'kurgan' } }, { stacks: [{ unit: 'militia', count: 5 }] }] });
  ok(!BA.canOrder(kr, 'high'), 'Великий курган needs a fallen stack');
  kr.stacks[1].count = 0;
  kr.stacks[1].hp = 0;
  kr.active = 0;
  const kv = BA.act(kr, { type: 'order', order: 'high' });
  ok(kr.stacks[1].count === 4 && kr.stacks[1].hp === H.UNITS.horsebow.hp && kv[0].order === 'kurgan', 'Великий курган raises the fallen stack with half its creatures');
  const dp = fought([{ unit: 'militia', count: 3 }, { unit: 'crossbow', count: 3 }], [{ unit: 'militia', count: 3 }], { tactics: 4 });
  BA.place(dp, 0, 3, 2);
  ok(dp.stacks[0].c === 3 && dp.stacks[0].r === 2, 'Тактика places a stack in its band');
  assert.throws(() => BA.place(dp, 0, 4, 2));
  assert.throws(() => BA.place(dp, 2, 12, 2));
  checks += 2;
  const noT = fought([{ unit: 'militia', count: 3 }], [{ unit: 'militia', count: 3 }]);
  assert.throws(() => BA.place(noT, 0, 1, 2));
  checks++;
  BA.act(dp, { type: 'defend' });
  assert.throws(() => BA.place(dp, 0, 2, 2));
  checks++;
  const auto = BA.create({ seed: 8, sides: [{ stacks: [{ unit: 'militia', count: 30 }, { unit: 'crossbow', count: 10 }], hero: { warcry: true, high: 'nabat', atk: 2, def: 2 } }, { stacks: [{ unit: 'shade', count: 30 }] }] });
  AI.play(auto, 100);
  ok(auto.winner >= 0 && auto.sides[0].used.warcry && auto.sides[0].used.high, 'the AI gives orders and finishes the battle');
}

{
  const { S, h } = heroMap('captain');
  ok(Adv.daySteps(S, h) === 18, 'no skills: 18 steps');
  h.skills.march = 3;
  ok(Adv.daySteps(S, h) === 23, 'Поход gives +30 %');
  h.arts.legs = 'couriers';
  ok(Adv.daySteps(S, h) === 25, 'boots add steps');
  h.perks.push('earlystart');
  ok(Adv.daySteps(S, h) === 29, 'Ранний выход on the first day of the week');
  S.day = 2;
  ok(Adv.daySteps(S, h) === 25, 'only on the first day');
  const ket = heroMap('noyon', { hid: 'ketebai' }), growth = HE.skillVal(ket.h, 'march');
  ket.h.level = 10;
  ok(growth < HE.skillVal(ket.h, 'march') && Math.abs(HE.skillVal(ket.h, 'march') - 0.1 * 1.5) < 1e-9, 'a skill speciality grows 5 % a level');
  const wind = heroMap('noyon');
  MD.paint(wind.S.map, 0, 'steppe', () => true);
  const w0 = Adv.daySteps(wind.S, wind.h);
  wind.h.talents.push('barrows-2');
  ok(Adv.daySteps(wind.S, wind.h) === w0 + 3, 'Ветер степи adds steps on the steppe');
  ok(HE.sight(S, h) === 5, 'sight 5');
  h.skills.scouting = 2;
  h.arts.shoulders = 'scoutcloak';
  ok(HE.sight(S, h) === 9, 'Разведка and a cloak add sight');
  const fm = heroMap('captain');
  MD.paint(fm.S.map, 0, 'forest', () => true);
  const p0 = Adv.path(fm.S, fm.h, 8, 5).steps[0].cost;
  fm.h.perks.push('trails');
  ok(p0 === 1.5 && Adv.path(fm.S, fm.h, 8, 5).steps[0].cost === 1.25, 'Тропы halve the terrain penalty');
}

{
  const t = heroMap('captain', { hid: 'mirabel' }), res = t.S.players[0].res;
  t.h.skills.treasury = 2;
  const g0 = res.gold;
  Adv.endDay(t.S);
  ok(res.gold === g0 + 500 + 350, 'Казна and a gold speciality pay every day');
  const iv = heroMap('magister', { hid: 'iveta' }), s0 = iv.S.players[0].res.sulfur;
  Adv.endDay(iv.S);
  ok(iv.S.players[0].res.sulfur === s0 + 1, 'a resource speciality brings a rare resource');
  const toll = townMap('league', ['hall1', 'tavern', 'hall2', 'market']);
  ok(!HE.income(toll.S, 0).gold, 'no toll without the talent');
  toll.hero.talents.push('league-2');
  ok(HE.income(toll.S, 0).gold === 50, 'Пошлина: 5 % of the town gold');
  const mil = townMap('league', ['hall1', 'dwell1', 'dwell3']);
  mil.hero.talents.push('league-6');
  ok(TW.growth(mil.S, mil.o, 1) === Math.round(18 * 1.25) && TW.growth(mil.S, mil.o, 3) === 7, 'Ополчение adds 25 % growth to tiers 1 and 2');
  const tr = townMap('league', ['hall1', 'market']);
  ok(TW.markets(tr.S, 0) === 1, 'one market');
  tr.hero.perks.push('trader');
  ok(TW.markets(tr.S, 0) === 2, 'Торговец: the rate is a step better');
  ok(!TW.markets(townMap('league', ['hall1']).S, 0), 'no market, no trade even with no trick');
  const col = heroMap('captain');
  col.h.perks.push('collector');
  let ev = [];
  for (let i = 0; i < 7; i++) ev = Adv.endDay(col.S);
  ok(ev.some(e => e.t === 'collect' && e.hero === 0), 'Сборщик asks the player for a rare resource at the start of the week');
  const a0 = col.S.players[0].res.amber;
  HE.collect(col.S, col.h, 'amber');
  ok(col.S.players[0].res.amber === a0 + 1, 'the chosen resource arrives');
  const ai = heroMap('captain');
  ai.S.players[0].human = false;
  ai.h.perks.push('collector');
  const sum = () => HE.RARE.reduce((n, k) => n + ai.S.players[0].res[k], 0), s1 = sum();
  for (let i = 0; i < 7; i++) Adv.endDay(ai.S);
  ok(sum() === s1 + 1, 'the AI collector takes the rarest resource by itself');
  const mana = heroMap('magister');
  mana.h.mana = 5;
  Adv.endDay(mana.S);
  ok(mana.h.mana === 6, 'mana +1 a day');
  mana.h.perks.push('memory');
  Adv.endDay(mana.S);
  ok(mana.h.mana === 9, 'Память: +2 mana more');
  const gld = townMap('league', ['hall1', 'guild1']);
  gld.hero.mana = 0;
  Adv.endDay(gld.S);
  ok(gld.hero.mana === HE.maxMana(gld.hero), 'a town with a guild restores mana');
  const lr = heroMap('captain', { skills: { learning: 3 } });
  ok(HE.addXp(lr.h, 100) === 130 && lr.h.xp === 130, 'Учёность adds experience');
  const pile = heroMap('captain');
  MD.add(pile.S.map, { t: 'res-wood', c: 6, r: 5, owner: -1, l: 0, amount: 5 });
  pile.h.perks.push('treasure');
  const w0 = pile.S.players[0].res.wood;
  walk(pile.S, 6, 5);
  ok(pile.S.players[0].res.wood === w0 + 6, 'Кладоискатель adds one to a resource pile');
  const ch = heroMap('captain');
  MD.add(ch.S.map, { t: 'chest', c: 6, r: 5, owner: -1, l: 0, offer: 0 });
  ch.h.perks.push('treasure');
  walk(ch.S, 6, 5);
  ok(ch.S.pending.gold === 1250, 'Кладоискатель adds 25 % to chest gold');
  const talk = heroMap('captain');
  talk.h.perks.push('parley');
  talk.h.army[0].count = 1000;
  MD.add(talk.S.map, { t: 'monster', c: 7, r: 5, owner: -1, l: 0, unit: 'shade', count: 10, mood: 'cautious' });
  let joins = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const q = heroMap('captain');
    q.S.rs = seed;
    q.h.perks.push('parley');
    q.h.army[0].count = 1000;
    MD.add(q.S.map, { t: 'monster', c: 7, r: 5, owner: -1, l: 0, unit: 'shade', count: 10, mood: 'cautious' });
    walk(q.S, 6, 5);
    if (q.S.pending.offer === 'join') {
      joins++;
      ok(q.S.pending.price === Math.round(10 * H.UNITS.shade.cost * 0.75), 'Переговоры: a quarter cheaper');
    }
  }
  ok(Math.abs(joins / 200 - 0.35 * 1.25) < 0.1, 'Переговоры: neutrals ask more often (' + joins + '/200)');
}

{
  const { S, h } = heroMap('captain', { army: [{ unit: 'militia', count: 100 }, { unit: 'crossbow', count: 40 }] });
  MD.add(S.map, { t: 'monster', c: 7, r: 5, owner: -1, l: 0, unit: 'shade', count: 6, mood: 'hostile' });
  walk(S, 6, 5);
  const setup = Adv.battleSetup(S);
  ok(setup.sides[0].hero.atk === 2 && setup.sides[0].morale === 0, 'a map battle carries the hero into the side');
  const B = BA.create(setup);
  AI.play(B, 100);
  ok(B.stacks[0].dealt || B.stacks[1].dealt, 'a stack that struck is marked');
  B.stacks[0].dealt = true;
  B.stacks[0].vet = 2;
  h.army[0].vet = 2;
  const res = BA.result(B);
  ok(res.stars[0].includes('militia'), 'the battle result names the stack that earned a star');
  const ev = Adv.battleDone(S, B);
  ok(h.army[0].stars === 1 && h.army[0].vet === 0 && ev.some(e => e.t === 'star' && e.unit === 'militia'), 'three battles with damage earn a star');
  const idle = HE.afterFight({ unit: 'militia', count: 5, stars: 1, vet: 1 }, { count: 5, dealt: false });
  ok(idle.stack.vet === 1 && idle.stack.stars === 1 && !idle.star, 'a battle without damage does not count');
  const top = HE.afterFight({ unit: 'militia', count: 5, stars: 3, vet: 2 }, { count: 5, dealt: true });
  ok(top.stack.stars === 3 && !top.star, 'no more than three stars');
  ok(HE.afterFight({ unit: 'militia', count: 5 }, { count: 0, dealt: true }).stack === null, 'a dead stack leaves the army');
}

{
  const army = () => [{ unit: 'militia', count: 10, stars: 2, vet: 1 }, null, { unit: 'crossbow', count: 4 }, null, null, null, null];
  const a = army();
  ok(HE.moveStack(a, 0, a, 1, { n: 4 }) && a[0].count === 6 && a[1].count === 4 && a[1].stars === 2, 'splitting keeps the stars on both parts');
  ok(HE.moveStack(a, 1, a, 0) && a[0].count === 10 && !a[1] && a[0].stars === 2, 'merging the parts back keeps the stars');
  const b = army();
  HE.addTo(b, 0, { unit: 'militia', count: 10 });
  ok(b[0].count === 20 && b[0].stars === 2, 'adding as many new creatures keeps the stars');
  HE.addTo(b, 0, { unit: 'militia', count: 21 });
  ok(b[0].count === 41 && b[0].stars === 1, 'adding more new creatures than there were takes one star');
  const c = army();
  ok(HE.moveStack(c, 0, c, 2) && c[0].unit === 'crossbow' && c[2].unit === 'militia', 'moving onto another creature swaps them');
  ok(!HE.moveStack(c, 2, c, 0, { n: 3 }), 'a part cannot swap with another creature');
  const one = [{ unit: 'militia', count: 3 }, null, null, null, null, null, null], other = Array(7).fill(null);
  ok(!HE.moveStack(one, 0, other, 0, { keep: true }) && one[0].count === 3, 'a hero keeps at least one stack');
  ok(HE.moveStack(one, 0, other, 0, { keep: true, n: 2 }) && one[0].count === 1 && other[0].count === 2, 'a hero may give away a part of the last stack');
  const h1 = { army: [{ unit: 'plated', count: 2 }, { unit: 'militia', count: 5 }, null, null, null, null, null] }, h2 = { army: Array(7).fill(null) };
  ok(HE.giveArmy(h1.army, h2.army) && h1.army.filter(Boolean).length === 1 && h1.army[1].count === 1 && h2.army.filter(Boolean).length === 2, 'giving the whole army leaves one creature of the weakest stack');
  ok(HE.disband({ army: army() }, 2) && !HE.disband({ army: [{ unit: 'militia', count: 1 }, null] }, 0), 'a stack can be disbanded, the last one cannot');
  const up = townMap('league');
  up.hero.army[0].stars = 2;
  up.hero.army[0].vet = 1;
  TW.build(up.S, up.o, 'dwell1u', 'a');
  TW.upgradeAll(up.S, up.o, 1);
  ok(up.hero.army[0].unit === 'pikeman' && up.hero.army[0].stars === 2 && up.hero.army[0].vet === 1, 'upgrading keeps the stars');
  const up2 = townMap('league');
  up2.hero.army[0].stars = 2;
  TW.recruit(up2.S, up2.o, 1, 'militia', 11);
  ok(up2.hero.army[0].count === 21 && up2.hero.army[0].stars === 1, 'recruits follow the star rule too');
}

{
  const { S, h } = heroMap('captain'), m = heroMap('captain');
  ok(HE.giveArt(h, 'bellcuirass') && h.arts.body === 'bellcuirass', 'a found artifact goes to its free place');
  ok(HE.stat(h, 'def') === h.def + 3 && HE.battleHero(h).def === h.def + 3, 'its bonus counts');
  ok(HE.giveArt(h, 'quilted') && h.bag.join() === 'quilted', 'a second one for the same place goes to the bag');
  ok(HE.moveArt(h, { bag: 0 }, h, { slot: 'body' }) && h.arts.body === 'quilted' && h.bag.join() === 'bellcuirass', 'equipping from the bag swaps');
  ok(!HE.moveArt(h, { bag: 0 }, h, { slot: 'head' }) && h.bag.length === 1, 'an artifact goes only to its place');
  ok(HE.giveArt(h, 'saltring') && HE.giveArt(h, 'millerring') && h.arts.ring1 === 'saltring' && h.arts.ring2 === 'millerring', 'two rings on two fingers');
  ok(HE.maxMana(h) === 15 && HE.luck(h) === 1, 'ring effects count');
  ok(HE.moveArt(h, { slot: 'ring1' }, h, { slot: 'ring2' }) && h.arts.ring1 === 'millerring', 'rings swap places');
  ok(HE.moveArt(h, { slot: 'body' }, h, { bag: 0 }) && h.arts.body === 'bellcuirass' && h.bag[0] === 'quilted', 'a worn item swaps with a bag item that fits its place');
  ok(!HE.moveArt(h, { slot: 'ring1' }, h, { bag: 0 }), 'a bag item that does not fit the place blocks the swap');
  ok(HE.moveArt(h, { slot: 'ring1' }, h, { bag: 1 }) && !h.arts.ring1 && h.bag.includes('millerring'), 'taking off to an empty bag cell');
  ok(HE.moveArt(h, { slot: 'ring2' }, m.h, { slot: 'ring1' }) && m.h.arts.ring1 === 'saltring', 'artifacts pass between heroes');
  ok(HE.giveArts(h, m.h) && !Object.values(h.arts).some(Boolean) && !h.bag.length, 'giving all artifacts empties the hero');
  const full = heroMap('captain').h;
  full.bag = Array(H.HERO.maxBag).fill('quilted');
  full.arts.body = 'quilted';
  ok(!HE.giveArt(full, 'quilted'), 'the bag holds 30');
  const site = heroMap('captain');
  MD.add(site.S.map, { t: 'artifact', c: 6, r: 5, owner: -1, l: 0, art: 'luckbone' });
  const ev = walk(site.S, 6, 5);
  ok(site.h.arts.charm === 'luckbone' && ev.some(e => e.t === 'artifact') && site.S.map.objs[0].gone, 'an artifact on the map is picked up by a step');
  const stuffed = heroMap('captain');
  stuffed.h.bag = Array(H.HERO.maxBag).fill('quilted');
  stuffed.h.arts.charm = 'saltcharm';
  MD.add(stuffed.S.map, { t: 'artifact', c: 6, r: 5, owner: -1, l: 0, art: 'luckbone' });
  const evs = walk(stuffed.S, 6, 5);
  ok(evs.some(e => e.t === 'bagfull') && !stuffed.S.map.objs[0].gone, 'a full bag leaves the artifact on the map');
}

{
  const t = heroMap('captain'), { S, h } = t;
  const two = Adv.addHero(S, { owner: 0, name: 'Второй', cls: 'captain', faction: 'league', c: 6, r: 5, army: [{ unit: 'militia', count: 5 }] });
  ok(HE.adjacent(h, two) && !HE.adjacent(h, h), 'two heroes side by side can meet');
  two.c = 9;
  ok(!HE.adjacent(h, two), 'not across the field');
  ok(HE.dismiss(S, two) && !two.alive, 'a hero can be dismissed');
  ok(!HE.dismiss(S, h) && h.alive, 'the last hero without a town stays');
  const town = townMap('league');
  ok(HE.dismiss(town.S, town.hero), 'with a town the last hero may leave');
  const back = new Set();
  for (let i = 0; i < 60; i++) {
    TW.week(town.S);
    town.o.tavern.forEach(x => back.add(x));
  }
  ok(back.has('renier'), 'a dismissed hero returns to the tavern');
}

const allSpells = Object.values(H.SPELLS).filter(s => s.school !== 'road').map(s => s.id);
const mage = over => Object.assign({ id: 0, name: 'Маг', atk: 0, def: 0, power: 10, mana: 900, spells: allSpells.slice(), ranks: {}, sorcery: 0, perks: [], specSpell: null }, over || {});
const arena = (over, extra) => {
  const a = [{ unit: 'militia', count: 50, c: 1, r: 2 }, { unit: 'crossbow', count: 20, c: 1, r: 6 }];
  const b = [{ unit: 'militia', count: 50, c: 6, r: 3 }, { unit: 'plated', count: 5, c: 6, r: 7 }, { unit: 'shade', count: 30, c: 9, r: 5 }];
  return BA.create(Object.assign({ seed: 7, obstacles: [], ready: [100, 0, 0, 0, 0], sides: [{ stacks: a, hero: mage(over) }, { stacks: b }] }, extra || {}));
};
const zap = (B, spell, more) => BA.act(B, Object.assign({ type: 'cast', spell }, more || {}));
const hits = (ev, id) => ev.filter(e => e.t === 'hit' && e.kind === 'spell' && (id == null || e.to === id));
const fresh = B => {
  B.sides[0].acted = 0;
  B.sides[0].used = {};
};
const passRound = B => {
  const start = B.round;
  for (let i = 0; i < 300 && B.winner < 0 && B.round === start; i++) BA.act(B, { type: 'defend' });
};

{
  const A = H.Art, list = Object.values(H.SPELLS);
  ok(list.length === 78 && list.filter(s => s.school === 'road').length === 8, '78 spells, 8 of them for the road');
  ok(list.every(s => {
    const e = A.SPELLS.find(x => x.id === 'spell/' + s.id);
    return e && e.name === s.name && e.school === s.school && e.circle === s.circle;
  }), 'every spell matches its icon entry: name, school and circle');
  const band = { 1: [4, 6], 2: [7, 10], 3: [11, 15], 4: [16, 20], 5: [22, 30] };
  ok(list.filter(s => s.school !== 'road').every(s => s.mana >= band[s.circle][0] && s.mana <= band[s.circle][1]), 'mana inside the band of the circle');
  ok(list.every(s => s.about && s.aim), 'every spell has a text and an aim');
  for (const school of Object.keys(H.SCHOOLS)) ok([1, 2, 3, 4, 5].every(c => list.filter(s => s.school === school && s.circle === c).length === 2), school + ': five circles of two spells');
  ok(Object.keys(H.SKILLS).filter(id => H.SKILLS[id].school).every(id => H.SCHOOLS[id] === H.SKILLS[id].name), 'schools are skills');
  ok(H.MOONS.length === 8 && H.MOONS.every(m => A.PICTURES.find(e => e.id === 'moon/' + m.icon).name === m.full), 'eight moons with icon entries');
  ok(Object.values(H.ARTIFACTS).filter(a => a.scroll).length === 42, 'scrolls of circles 1 to 3');
  ok(H.UNITS.wolves && H.UNITS.forestgiant && A.UNITS.forestgiant.name === H.UNITS.forestgiant.name, 'summoned creatures exist');
}

{
  let B = arena(), t = B.stacks[1], ev;
  t.count = 10;
  ev = zap(B, 'balm', { target: 1 });
  ok(t.count > 10 && t.borrowed === t.count - 10 && ev.some(e => e.t === 'heal') && ev.some(e => e.t === 'cast'), 'Лунный бальзам heals, the fallen stand until the end of the battle');
  ok(B.sides[0].hero.mana === 900 - 5 && B.active === 0, 'a spell takes mana and keeps the turn');
  B = arena();
  const f0 = BA.forecast(B, B.stacks[2], B.stacks[0], 'melee').max;
  zap(B, 'clearshield', { target: 0 });
  ok(BA.forecast(B, B.stacks[2], B.stacks[0], 'melee').max < f0, 'Ясный щит cuts close damage');
  B = arena();
  zap(B, 'blessing', { target: 0 });
  let fc = BA.forecast(B, B.stacks[0], B.stacks[2], 'melee');
  ok(fc.min === fc.max, 'Благословение: upper damage only');
  B = arena();
  B.stacks[0].fx.push({ spell: 'hex', atk: -2, until: 9, bad: true }, { spell: 'haste', initPct: 0.2, until: 9, bad: false });
  zap(B, 'cleanse', { target: 0 });
  ok(B.stacks[0].fx.length === 1 && B.stacks[0].fx[0].spell === 'haste', 'Очищение removes only harmful effects');
  B = arena();
  B.stacks[0].count = 30;
  B.stacks[1].fx.push({ spell: 'scare', morale: -1, fear: true, until: 9, bad: true });
  zap(B, 'dawn');
  ok(B.stacks[0].count > 30 && !BA.fxHas(B.stacks[1], 'fear'), 'Свет зари heals everyone and removes fear');
  B = arena();
  zap(B, 'mirrorarmor', { target: 0 });
  ok(BA.fxs(B.stacks[0], 'shotIn') === 0.3, 'Отражающий доспех cuts arrows');
  B = arena();
  zap(B, 'skyveil');
  ok(B.stacks.filter(s => s.side === 0).every(s => BA.fxs(s, 'allIn') === 0.15 && s.fx[0].until === B.round + 1), 'Небесный покров covers all own for 2 rounds');
  B = arena();
  ev = zap(B, 'banish', { target: 4 });
  const onSpirit = hits(ev, 4)[0].dmg;
  B = arena();
  ev = zap(B, 'banish', { target: 2 });
  ok(onSpirit > hits(ev, 2)[0].dmg * 1.5, 'Изгнание burns spirits twice as hard');
  B = arena();
  B.stacks[0].count = 20;
  zap(B, 'resurrect', { target: 0 });
  ok(B.stacks[0].count > 20 && B.stacks[0].borrowed > 0, 'Воскрешение raises until the end of the battle');
  B = arena({ ranks: { yasna: 3 } });
  B.stacks[0].count = 20;
  zap(B, 'resurrect', { target: 0 });
  ok(B.stacks[0].count > 20 && B.stacks[0].borrowed === 0, 'a master of Ясна raises for good');
  B = arena();
  const a0 = BA.atkOf(B.stacks[0]), m0 = BA.moraleOf(B, B.stacks[0]);
  zap(B, 'whitefull');
  ok(BA.atkOf(B.stacks[0]) === a0 + 2 && BA.moraleOf(B, B.stacks[0]) === m0 + 1, 'Белое полнолуние lifts Натиск and morale');
}

{
  let B = arena(), ev = zap(B, 'spark', { target: 2 });
  const spark = hits(ev, 2)[0].dmg;
  ok(spark > 0 && B.stacks[2].count < 50, 'Искра burns');
  B = arena();
  zap(B, 'rage', { target: 0 });
  ok(BA.fxs(B.stacks[0], 'dmgPct') === 0.2 && BA.fxs(B.stacks[0], 'defPct') === -0.1, 'Ярость: more damage, less Стойкость');
  B = arena();
  ev = zap(B, 'firearrow', { target: 2 });
  ok(hits(ev, 2)[0].dmg > spark, 'Огненная стрела is stronger than Искра');
  B = arena();
  ev = zap(B, 'hotwind', { c: 6, r: 3 });
  ok(hits(ev, 2).length === 1 && BA.areaCells('cone', 6, 3, 0).length === 3, 'Жаркий ветер: a cone of three cells');
  B = arena();
  B.stacks[1].c = 5;
  B.stacks[1].r = 3;
  ev = zap(B, 'fireball', { c: 6, r: 3 });
  ok(hits(ev, 2).length === 1 && hits(ev, 1).length === 1, 'Огненный шар burns own stacks too');
  B = arena();
  zap(B, 'firewall', { c: 5, r: 2 });
  ok(B.zones.length === 1 && B.zones[0].cells.length === 3 && B.zones[0].until === B.round + 1, 'Стена огня: three cells for two rounds');
  const fw = B.zones[0].dmg;
  ev = BA.act(B, { type: 'move', c: 4, r: 2 });
  ok(fw > 0, 'a fire wall has a strength');
  B = arena();
  zap(B, 'firewall', { c: 2, r: 2 });
  const burnt = BA.act(B, { type: 'move', c: 2, r: 2 });
  ok(burnt.some(e => e.t === 'hit' && e.kind === 'fire' && e.to === 0), 'a stack that walks into fire burns');
  B = arena();
  ev = zap(B, 'meteor');
  ok(hits(ev).length === 3 && hits(ev).every(e => e.to >= 2), 'Метеор: three strikes on enemy stacks');
  B = arena();
  zap(B, 'firemadness', { target: 2 });
  B.stacks[2].ready = 200;
  ev = BA.act(B, { type: 'defend' });
  ok(ev.some(e => e.t === 'wild' && e.id === 2) && !BA.fxHas(B.stacks[2], 'mad'), 'Огненное безумие: the stack strikes the nearest stack once');
  B = arena();
  B.stacks[1].c = 5;
  B.stacks[1].r = 4;
  ev = zap(B, 'starfall', { c: 6, r: 5 });
  ok(BA.areaCells('hex2', 6, 4, 0).length === 19 && hits(ev, 1).length === 1 && hits(ev, 2).length === 1 && hits(ev, 3).length === 1, 'Падение звезды: 19 cells, own too');
  B = arena();
  ev = zap(B, 'firerain');
  ok(hits(ev).length === 3 && hits(ev).every(e => e.to >= 2), 'Огненный дождь hits all enemies only');
}

{
  let B = arena(), ev;
  const i0 = BA.initOf(B.stacks[2]);
  zap(B, 'chill', { target: 2 });
  ok(BA.initOf(B.stacks[2]) === Math.round(i0 * 0.8), 'Холод: −20 % initiative');
  B = arena();
  B.stacks[2].ready = 50;
  ev = zap(B, 'splash', { target: 2 });
  ok(hits(ev, 2).length === 1 && B.stacks[2].ready === 40, 'Брызги: damage and −10 readiness');
  B = arena();
  ev = zap(B, 'icearrow', { target: 2 });
  ok(hits(ev, 2).length === 1 && BA.fxs(B.stacks[2], 'initPct') === -0.1, 'Ледяная стрела: damage and slowness');
  B = arena();
  ok(!BA.stackTargets(B, H.SPELLS.sleep, 0).includes(B.stacks[2]) === (BA.total(B.stacks[2]) > BA.spellAmount(B, B.sides[0].hero, H.SPELLS.sleep, H.SPELLS.sleep.limit)), 'Сон has a health limit');
  B.stacks[2].count = 10;
  zap(B, 'sleep', { target: 2 });
  B.stacks[2].ready = 200;
  ev = BA.act(B, { type: 'defend' });
  ok(ev.some(e => e.t === 'skip' && e.id === 2) && BA.fxHas(B.stacks[2], 'sleep'), 'a sleeping stack loses its turns');
  fresh(B);
  const sb = BA.create({ seed: 7, obstacles: [], ready: [100, 0], sides: [{ stacks: [{ unit: 'plated', count: 2, c: 5, r: 5 }], hero: mage() }, { stacks: [{ unit: 'militia', count: 10, c: 6, r: 5 }] }] });
  zap(sb, 'sleep', { target: 1 });
  const hitEv = BA.act(sb, { type: 'attack', target: 1, c: 5, r: 5 });
  ok(!hitEv.some(e => e.t === 'hit' && e.kind === 'retal') && !BA.fxHas(sb.stacks[1], 'sleep'), 'a blow wakes the sleeper and gets no answer');
  B = arena();
  ev = zap(B, 'icering', { c: 6, r: 4 });
  ok(hits(ev, 2).length === 1 && BA.areaCells('ring', 6, 4, 0).length === 6, 'Ледяное кольцо hits six cells around the point');
  const ring = arena();
  ok(!hits(zap(ring, 'icering', { c: 6, r: 3 }), 2).length, 'the middle of the ring stays safe');
  B = arena();
  zap(B, 'current', { target: 2, c: 8, r: 3 });
  ok(B.stacks[2].c === 8 && B.stacks[2].r === 3, 'Течение shifts a stack');
  assert.throws(() => zap(arena(), 'current', { target: 2, c: 11, r: 3 }));
  checks++;
  B = arena();
  zap(B, 'numb', { target: 2 });
  B.stacks[2].ready = 200;
  ev = BA.act(B, { type: 'defend' });
  ok(ev.some(e => e.t === 'skip' && e.id === 2) && !BA.fxHas(B.stacks[2], 'skip'), 'Оцепенение takes one turn');
  B = arena();
  zap(B, 'deepfog');
  ok(BA.fxs(B.stacks[1], 'shotIn') === 0.4, 'Туман глубин shields from arrows');
  B = arena();
  zap(B, 'icetomb', { target: 2 });
  ok(BA.reach(B, B.stacks[2]).size === 1 && BA.fxs(B.stacks[2], 'allIn') === 0.5, 'Ледяная гробница: no steps, half damage');
  B.stacks[2].ready = 200;
  ev = BA.act(B, { type: 'defend' });
  ok(ev.some(e => e.t === 'skip' && e.id === 2), 'a frozen stack loses its turn');
  B = arena();
  B.stacks[2].ready = 50;
  const i2 = BA.initOf(B.stacks[2]);
  zap(B, 'flood');
  ok(B.stacks[2].ready === 20 && BA.initOf(B.stacks[2]) === Math.round(i2 * 0.8), 'Потоп: −30 readiness and −20 % initiative');
  const stone = BA.create({ seed: 7, obstacles: [], ready: [100, 0], sides: [{ stacks: [{ unit: 'militia', count: 5 }], hero: mage() }, { stacks: [{ unit: 'stonewoman', count: 5 }] }] });
  ok(!BA.stackTargets(stone, H.SPELLS.chill, 0).length && BA.stackTargets(stone, H.SPELLS.spark, 0).length === 1, 'stone does not take Глубь');
}

{
  let B = arena(), ev;
  zap(B, 'thorns', { c: 2, r: 2 });
  ok(B.obstacles.some(p => p[0] === 2 && p[1] === 2) && BA.occupancy(B)[H.Hex.idx(2, 2)] === -2, 'Колючки grow on a free cell');
  ev = [];
  for (let i = 0; i < 300 && B.round === 1; i++) ev.push(...BA.act(B, { type: 'defend' }));
  ok(ev.some(e => e.t === 'hit' && e.kind === 'thorn' && e.to === 0), 'the bush wounds its neighbours');
  assert.throws(() => zap(arena(), 'thorns', { c: 1, r: 2 }));
  checks++;
  B = arena({ power: 0 });
  zap(B, 'poisonspit', { target: 2 });
  ok(BA.fxs(B.stacks[2], 'poison') === H.SPELLS.poisonspit.poison[0], 'Ядовитый плевок poisons');
  B.stacks[2].ready = 200;
  ev = BA.act(B, { type: 'defend' });
  ok(ev.some(e => e.t === 'hit' && e.kind === 'poison' && e.to === 2), 'poison bites at the start of the turn');
  ok(!BA.stackTargets(arena(), H.SPELLS.poisonspit, 0).some(t => t.unit === 'shade'), 'spirits do not take poison');
  B = arena();
  zap(B, 'roots', { target: 2 });
  ok(BA.reach(B, B.stacks[2]).size === 1 && !BA.fxHas(B.stacks[2], 'skip'), 'Корни hold the stack, it may still strike');
  B = arena();
  zap(B, 'stoneskin', { target: 0 });
  ok(Math.abs(BA.defOf(B.stacks[0], 0) - H.UNITS.militia.def * 1.3) < 1e-9, 'Каменная кожа +30 %');
  B = arena();
  ev = zap(B, 'packcall');
  const wolves = B.stacks[B.stacks.length - 1];
  ok(wolves.unit === 'wolves' && wolves.summoned && wolves.count === Math.round(3 + 10 * 1.5) && ev.some(e => e.t === 'summon'), 'Зов стаи calls wolves by Чары');
  ok(!BA.result(B).lost[0].some(l => l.unit === 'wolves'), 'summoned creatures are not counted as losses');
  B = arena();
  zap(B, 'stonewall', { c: 4, r: 4 });
  ok(B.temp.length === 3, 'Каменная стена: three obstacles in a row');
  B = arena();
  B.stacks[0].count = 40;
  const h0 = BA.hpOf(B.stacks[0]), t0 = BA.total(B.stacks[0]);
  zap(B, 'growth', { target: 0 });
  ok(BA.hpOf(B.stacks[0]) === Math.round(h0 * 1.2) && BA.total(B.stacks[0]) > t0, 'Рост: more health and healing');
  B = arena();
  zap(B, 'poisoncloud', { c: 6, r: 3 });
  ok(BA.fxs(B.stacks[2], 'poison') > 0 && !BA.fxs(B.stacks[0], 'poison'), 'Ядовитое облако poisons the seven cells');
  B = arena();
  zap(B, 'giantcall');
  ok(B.stacks[B.stacks.length - 1].unit === 'forestgiant' && B.stacks[B.stacks.length - 1].count === Math.max(1, Math.round(1 + 10 / 6)), 'Зов лесного великана calls a giant');
  B = arena();
  B.stacks[0].count = 25;
  zap(B, 'lifebloom');
  const before = B.stacks[0].count;
  passRound(B);
  ok(B.stacks[0].count > before, 'Цветение жизни heals every round');
}

{
  let B = arena(), ev;
  zap(B, 'shadow', { target: 0 });
  B.stacks[0].ready = 0;
  const shot = BA.create({ seed: 7, obstacles: [], ready: [100, 0], sides: [{ stacks: [{ unit: 'crossbow', count: 5 }], hero: mage() }, { stacks: [{ unit: 'militia', count: 5 }], hero: mage() }] });
  shot.stacks[1].fx.push({ spell: 'shadow', dodge: true, until: 99, bad: false });
  ev = BA.act(shot, { type: 'shoot', target: 1 });
  ok(ev.some(e => e.t === 'miss') && shot.stacks[1].count === 5 && !BA.fxHas(shot.stacks[1], 'dodge'), 'Тень: the next shot misses');
  B = arena();
  const m0 = BA.moraleOf(B, B.stacks[2]);
  zap(B, 'scare', { target: 2 });
  ok(BA.moraleOf(B, B.stacks[2]) === m0 - 1, 'Испуг: −1 morale');
  B = arena();
  zap(B, 'blind', { target: 2 });
  B.stacks[2].ready = 200;
  ev = BA.act(B, { type: 'defend' });
  ok(ev.some(e => e.t === 'skip' && e.id === 2), 'Ослепление: the stack does nothing');
  B = arena();
  ev = zap(B, 'phantom', { target: 0 });
  const ph = B.stacks[B.stacks.length - 1];
  ok(ph.phantom && ph.summoned && ph.count === 15 && ph.unit === 'militia', 'Морок-двойник: a copy of 30 %');
  fresh(B);
  zap(B, 'fireball', { c: ph.c, r: ph.r });
  ok(ph.count === 0, 'the copy dies from any damage');
  B = arena();
  zap(B, 'invis', { target: 0 });
  ok(!BA.stackTargets(arena(), H.SPELLS.spark, 0).includes(B.stacks[0]), 'an own stack is no spell target for the enemy side rule check');
  const hid = BA.create({ seed: 7, obstacles: [], ready: [100, 0], sides: [{ stacks: [{ unit: 'crossbow', count: 5 }], hero: mage() }, { stacks: [{ unit: 'militia', count: 5 }] }] });
  hid.stacks[1].fx.push({ spell: 'invis', hidden: true, until: 99, bad: false });
  assert.throws(() => BA.act(hid, { type: 'shoot', target: 1 }));
  checks++;
  ok(!BA.stackTargets(hid, H.SPELLS.spark, 0).length, 'a hidden stack cannot be shot or spelled');
  BA.act(B, { type: 'defend' });
  ok(!BA.fxHas(B.stacks[0], 'hidden'), 'hiding ends when the stack acts');
  B = arena();
  B.stacks[2].ready = 70;
  const d0 = BA.gap(B.stacks[2], B.stacks[2].c, B.stacks[2].r, B.stacks[0]);
  zap(B, 'fear', { target: 2 });
  ok(B.stacks[2].ready === 0 && BA.gap(B.stacks[2], B.stacks[2].c, B.stacks[2].r, B.stacks[0]) >= d0, 'Страх: the stack backs away and loses its readiness');
  B = arena();
  zap(B, 'swap', { target: 0, target2: 2 });
  ok(B.stacks[0].c === 6 && B.stacks[0].r === 3 && B.stacks[2].c === 1 && B.stacks[2].r === 2, 'Подмена swaps two stacks of any sides');
  B = arena();
  const mt = BA.moraleOf(B, B.stacks[3]);
  zap(B, 'terror');
  ok(BA.moraleOf(B, B.stacks[3]) === mt - 2, 'Ужас: all enemies −2 morale');
  B = arena();
  zap(B, 'nightmare', { target: 2 });
  B.stacks[2].ready = 200;
  ev = BA.act(B, { type: 'defend' });
  const blows = ev.filter(e => e.t === 'hit' && e.by === 2 && e.kind === 'melee');
  ok(ev.some(e => e.t === 'wild' && e.betray) && blows.every(e => B.stacks[e.to].side === 1), 'Кошмар: the stack strikes its own side once');
  B = arena();
  B.stacks[2].ready = 60;
  zap(B, 'eclipse');
  ok(B.stacks[2].ready === 20 && B.sides[1].noShoot === B.round + 1, 'Затмение: −40 readiness, no shots next round');
  const ec = BA.create({ seed: 7, obstacles: [], ready: [100, 0], sides: [{ stacks: [{ unit: 'militia', count: 5 }], hero: mage() }, { stacks: [{ unit: 'crossbow', count: 5 }] }] });
  zap(ec, 'eclipse');
  ok(!BA.canShoot(ec, ec.stacks[1]), 'an eclipsed archer cannot shoot');
}

{
  let B = arena(), ev;
  const a0 = BA.atkOf(B.stacks[2]);
  zap(B, 'hex', { target: 2 });
  ok(BA.atkOf(B.stacks[2]) === a0 - 2 && B.stacks[2].fx[0].until === B.round + 2, 'Порча: −2 Натиска for 3 rounds');
  B = arena({ power: 0 });
  ev = zap(B, 'decay', { target: 3 });
  ok(hits(ev, 3)[0].dmg === H.SPELLS.decay.dmg[0], 'Тлен ignores Стойкость');
  const arrow = arena({ power: 0 }), ae = zap(arrow, 'spark', { target: 3 });
  ok(hits(ae, 3)[0].dmg < H.SPELLS.spark.dmg[0], 'other spells are softened by Стойкость');
  B = arena();
  zap(B, 'weakness', { target: 2 });
  const fc = BA.forecast(B, B.stacks[2], B.stacks[0], 'melee');
  ok(fc.min === fc.max, 'Слабость: lower damage only');
  B = arena();
  const hp = BA.hpOf(B.stacks[2]);
  zap(B, 'rot', { target: 2 });
  ok(BA.hpOf(B.stacks[2]) === Math.round(hp * 0.9) && BA.fxHas(B.stacks[2], 'noHeal'), 'Гниль: less health and no healing');
  B = arena();
  B.stacks[1].count = 5;
  ev = zap(B, 'drain', { target: 2 });
  ok(hits(ev, 2).length === 1 && ev.some(e => e.t === 'heal' && e.id === 1), 'Высасывание heals the weakest own stack');
  B = arena();
  B.stacks[3].c = 6;
  B.stacks[3].r = 4;
  zap(B, 'kurgancurse', { target: 2 });
  fresh(B);
  const m3 = BA.moraleOf(B, B.stacks[3]);
  zap(B, 'spark', { target: 2 });
  ok(BA.moraleOf(B, B.stacks[3]) === m3 - 1, 'Проклятие кургана: neighbours lose morale when the stack loses creatures');
  B = arena();
  zap(B, 'plague', { c: 6, r: 3 });
  ok(BA.fxs(B.stacks[2], 'poison') > 0, 'Мор poisons the seven cells');
  B = arena();
  const f0 = BA.forecast(B, B.stacks[0], B.stacks[2], 'melee').max;
  zap(B, 'blackmark', { target: 2 });
  ok(Math.abs(BA.forecast(B, B.stacks[0], B.stacks[2], 'melee').max / f0 - 1.3) < 0.02, 'Чёрная метка: +30 % damage');
  B = arena();
  ev = zap(B, 'deathchill');
  ok(hits(ev, 2).length === 1 && !hits(ev, 4).length && ev.some(e => e.t === 'resist' && e.id === 4), 'Смертный холод spares spirits');
  B = arena({ power: 0 });
  ev = zap(B, 'harvest', { target: 3 });
  ok(hits(ev, 3)[0].dmg === H.SPELLS.harvest.dmg[0] && B.stacks[3].count === 5 - Math.floor(H.SPELLS.harvest.dmg[0] / 55), 'Жатва kills by a sum of health');
}

{
  let B = arena(), ev;
  const i0 = BA.initOf(B.stacks[0]);
  zap(B, 'haste', { target: 0 });
  ok(BA.initOf(B.stacks[0]) === Math.round(i0 * 1.2), 'Ускорение: +20 % initiative');
  B = arena();
  B.stacks[2].ready = 50;
  zap(B, 'glitch', { target: 2 });
  ok(B.stacks[2].ready === 30, 'Сбой: −20 readiness');
  B = arena();
  B.stacks[2].fx.push({ spell: 'measureshield', ward: 2, until: 9, bad: false });
  ok(!BA.stackTargets(B, H.SPELLS.spark, 0).includes(B.stacks[2]) && !BA.stackTargets(B, H.SPELLS.firearrow, 0).includes(B.stacks[2]) && BA.stackTargets(B, H.SPELLS.drain, 0).includes(B.stacks[2]), 'Щит меры stops circles 1 and 2 only');
  B = arena();
  zap(B, 'measureshield', { target: 0 });
  ok(B.stacks[0].fx[0].ward === 2, 'Щит меры goes on the stack');
  B = arena();
  zap(B, 'truestrike', { target: 0 });
  const fc = BA.forecast(B, B.stacks[0], B.stacks[2], 'melee');
  ok(fc.min === fc.max, 'Точный удар: upper damage');
  B.stacks[0].c = 5;
  B.stacks[0].r = 3;
  BA.act(B, { type: 'attack', target: 2, c: 5, r: 3 });
  ok(!BA.fxHas(B.stacks[0], 'sure'), 'only for the next blow');
  B = arena();
  B.stacks[2].fx.push({ spell: 'haste', initPct: 0.2, until: 9, bad: false }, { spell: 'hex', atk: -2, until: 9, bad: true });
  zap(B, 'dispel', { target: 2 });
  ok(!B.stacks[2].fx.length, 'Развеять removes all spells');
  B = arena();
  zap(B, 'repeat', { target: 1 });
  ok(B.stacks[1].ready === 50, 'Повтор: +50 readiness');
  B = arena();
  zap(B, 'masshaste');
  ok(B.stacks.filter(s => s.side === 0).every(s => BA.fxs(s, 'initPct') === 0.2), 'Общее ускорение for all own');
  B = arena();
  passRound(B);
  const s = B.stacks[2], was = s.was[0].count;
  s.count = 10;
  s.hp = 1;
  fresh(B);
  B.active = 0;
  zap(B, 'rewind', { target: 2 });
  ok(s.count === was, 'Поворот часов returns the count of the last round');
  B = arena();
  const r2 = B.stacks[2].ready;
  zap(B, 'timestop');
  ok(B.sides[1].stopTicks === 10 && BA.castBlock(B, 'timestop'), 'Остановка времени: 10 ticks, once a battle');
  BA.act(B, { type: 'defend' });
  ok(B.stacks[2].ready === r2 || B.tick >= 10, 'enemies gain no readiness while time stands');
  B = arena();
  zap(B, 'order');
  fresh(B);
  ok(BA.castBlock(B, 'spark') && BA.castBlock(B, 'drain') && !BA.castBlock(B, 'haste') && !BA.castBlock(B, 'firerain') && B.orderUntil === B.round + 2, 'Мир порядка silences circles 1–3 except Мера');
}

{
  let B = arena();
  zap(B, 'spark', { target: 2 });
  ok(BA.castBlock(B, 'spark') && B.sides[0].acted === B.round, 'one hero action a round');
  passRound(B);
  B.active = 0;
  ok(B.winner < 0 && !BA.castBlock(B, 'spark'), 'the next round the hero acts again');
  B = arena({ perks: ['quickword'] });
  zap(B, 'spark', { target: 2 });
  ok(!BA.castBlock(B, 'spark'), 'Быстрое слово: a second spell');
  zap(B, 'spark', { target: 2 });
  ok(BA.castBlock(B, 'spark') && B.sides[0].used.quick, 'only once a battle');
  B = arena({ mana: 3 });
  ok(BA.castBlock(B, 'spark') === 'Не хватает маны', 'no mana, no spell');
  B = arena({ spells: ['spark'] });
  ok(BA.castBlock(B, 'firerain') === 'Заклинание не изучено', 'only known spells');
  const cost = rank => BA.spellCost(arena(), mage({ ranks: { zhar: rank } }), H.SPELLS.fireball);
  ok(cost(0) === 14 && cost(1) === 14 && cost(2) === 13 && cost(3) === 12, 'school ranks cut mana by 0, 1 and 2');
  const power = (over, extra) => {
    const b = arena(over, extra);
    return BA.spellAmount(b, b.sides[0].hero, H.SPELLS.spark, H.SPELLS.spark.dmg);
  };
  ok(power() === H.SPELLS.spark.dmg[0] + 10 * H.SPELLS.spark.dmg[1] && Math.abs(power({ ranks: { zhar: 2 } }) / power() - 1.15) < 1e-9 && Math.abs(power({ ranks: { zhar: 3 } }) / power() - 1.3) < 1e-9, 'school ranks give +0, +15 and +30 %');
  ok(Math.abs(power({ sorcery: 0.2 }) / power() - 1.2) < 1e-9, 'Чародейство adds power');
  ok(Math.abs(power({ specSpell: { id: 'spark', scale: 0.2 } }) / power() - 1.2) < 1e-9, 'a spell speciality adds power');
  const rounds = p => BA.spellRounds(arena(), mage({ power: p }), H.SPELLS.haste);
  ok(rounds(0) === 2 && rounds(4) === 3 && rounds(8) === 4 && rounds(40) === 6, 'duration 2 + Чары / 4, no more than 6');
  const cold = arena({ perks: ['ice'] });
  ok(BA.spellRounds(cold, cold.sides[0].hero, H.SPELLS.roots) === 3, 'Лёд: control lasts a round longer');
  const fire = arena({ perks: ['blaze'], power: 10 });
  zap(fire, 'spark', { target: 2 });
  ok(fire.zones.length === 1, 'Пожар leaves burning ground');
  const rp = arena({ perks: ['reap'] });
  rp.stacks[1].count = 5;
  ok(zap(rp, 'decay', { target: 2 }).some(e => e.t === 'heal' && e.id === 1), 'Жатва (trick) heals with Тлень damage');
  const rd = arena({ perks: ['radiance'] });
  rd.stacks[1].count = 5;
  zap(rd, 'balm', { target: 1 });
  ok(BA.fxs(rd.stacks[1], 'morale') === 1, 'Сияние: healing adds morale');
  const ld = arena({ perks: ['lightdark'] });
  ld.stacks[0].fx.push({ spell: 'hex', atk: -2, until: 9, bad: true });
  zap(ld, 'clearshield', { target: 0 });
  ok(!ld.stacks[0].fx.some(e => e.bad), 'Свет сквозь тьму removes a curse');
  const cw = arena({ perks: ['coldwater'] });
  zap(cw, 'roots', { target: 2 });
  ok(BA.fxs(cw.stacks[2], 'defPct') === -0.1, 'Холодная вода weakens the held target');
  const fe = arena({ perks: ['fertility'] });
  zap(fe, 'packcall');
  ok(fe.stacks[fe.stacks.length - 1].count === Math.round(18 * 1.3), 'Плодородие: more summoned');
  const dd = arena({ perks: ['double'] });
  zap(dd, 'phantom', { target: 0 });
  ok(dd.stacks.filter(s => s.phantom).length === 2, 'Двойник: a second copy');
  const sd = arena({ perks: ['shade'] });
  ok(BA.spellCost(sd, sd.sides[0].hero, H.SPELLS.scare) === 4, 'Тень (trick): Морок is cheaper');
  const bl = arena({ perks: ['blight'] });
  bl.stacks[3].c = 6;
  bl.stacks[3].r = 4;
  zap(bl, 'hex', { target: 2 });
  ok(BA.fxs(bl.stacks[3], 'atk') === -1, 'Порча (trick): a curse spreads at half strength');
  const pr = arena({ perks: ['precision'] });
  pr.stacks[2].ready = 50;
  zap(pr, 'glitch', { target: 2 });
  ok(pr.stacks[2].ready === 20, 'Точность: time spells bite 10 harder');
  const ms = BA.create({ seed: 7, obstacles: [], ready: [100, 0], sides: [{ stacks: [{ unit: 'militia', count: 5 }], hero: mage({ power: 0 }) }, { stacks: [{ unit: 'plated', count: 5 }], hero: mage({ perks: ['measureshield'] }) }] });
  const plainM = BA.create({ seed: 7, obstacles: [], ready: [100, 0], sides: [{ stacks: [{ unit: 'militia', count: 5 }], hero: mage({ power: 0 }) }, { stacks: [{ unit: 'plated', count: 5 }] }] });
  ok(hits(zap(ms, 'spark', { target: 1 }))[0].dmg < hits(zap(plainM, 'spark', { target: 1 }))[0].dmg, 'Щит меры (trick) cuts spell damage');
  let echoed = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const e = arena({ perks: ['echo'] }, { seed });
    if (zap(e, 'spark', { target: 2 }).some(x => x.t === 'echo')) echoed++;
  }
  ok(echoed > 10 && echoed < 60, 'Отголосок: about 15 % of spells repeat (' + echoed + '/200)');
  const dead = arena({ power: 500 });
  zap(dead, 'firerain');
  ok(dead.winner === 0 && dead.active === -1, 'a spell can end the battle');
  const suicide = arena({ power: 500 });
  zap(suicide, 'starfall', { c: 1, r: 2 });
  ok(suicide.stacks[0].count === 0 && suicide.active !== 0, 'if the active stack burns, the turn passes on');
}

{
  const moon = id => ({ moon: { id, people: H.Moons.byId[id].people } });
  const w = arena({ power: 0 }, moon('white'));
  w.stacks[0].count = 20;
  const wev = zap(w, 'balm', { target: 0 }), nm = arena({ power: 0 });
  nm.stacks[0].count = 20;
  const nev = zap(nm, 'balm', { target: 0 });
  ok(wev.find(e => e.t === 'heal').n === Math.round(nev.find(e => e.t === 'heal').n * 1.25) && BA.spellCost(w, w.sides[0].hero, H.SPELLS.balm) === 4, 'Белая луна: healing +25 %, Ясна is a mana cheaper');
  const r = arena({ power: 0 }, moon('red'));
  ok(hits(zap(r, 'decay', { target: 2 }))[0].dmg === H.SPELLS.decay.dmg[0] && hits(zap(arena({ power: 0 }, moon('red')), 'spark', { target: 3 }))[0].dmg > hits(zap(arena({ power: 0 }), 'spark', { target: 3 }))[0].dmg, 'Алая луна: Жарь +20 %');
  const az = arena(null, moon('azure'));
  ok(BA.spellRounds(az, az.sides[0].hero, H.SPELLS.icetomb) === 3 && BA.spellRounds(arena(), mage(), H.SPELLS.icetomb) === 2 && BA.spellRounds(az, az.sides[0].hero, H.SPELLS.roots) === 2, 'Лазурная луна: only Глубь holds a round longer');
  const si = arena(null, moon('silver'));
  ok(BA.spellCost(si, si.sides[0].hero, H.SPELLS.scare) === 4, 'Серебряная луна: Морок is a mana cheaper');
  const co = arena({ ranks: { zhar: 1 } }, moon('convergence'));
  ok(BA.schoolRank(co, co.sides[0].hero, H.SPELLS.spark) === 2, 'Схождение: everyone casts a rank higher');
  const g = arena(null, moon('gold'));
  ok(BA.moraleOf(g, g.stacks[0]) === BA.moraleOf(arena(), arena().stacks[0]) + 1 && BA.moraleOf(g, g.stacks[4]) === BA.moraleOf(arena(), arena().stacks[4]), 'the moon lifts the morale of its people only');
  const M = MD.create(20, 10, ['meadow']);
  const S = Adv.create(M, { seed: 41, players: [{ name: 'Игрок', color: 0, faction: 'league', human: true }], heroes: [] });
  ok(S.moons.length === 8 && S.moons[7] === 'convergence' && new Set(S.moons).size === 8, 'a circle of 8 weeks with Схождение last');
  const orders = new Set();
  for (let seed = 1; seed <= 20; seed++) orders.add(Adv.create(MD.create(5, 5, ['meadow']), { seed, players: [], heroes: [] }).moons.join());
  ok(orders.size > 10, 'the order of moons follows the seed');
  ok(H.Moons.dateText(S).startsWith('Круг 1, неделя ') && H.Moons.dateText(S).endsWith('день 1'), 'date with the moon');
  S.day = 8;
  ok(H.Moons.current(S).id === S.moons[1], 'the next week brings the next moon');
  S.day = 57;
  ok(H.Moons.current(S).id === S.moons[0] && H.Moons.circle(S) === 2, 'after eight weeks the circle starts again');
  ok(H.Moons.ahead(S, 4).length === 4, 'the calendar looks four weeks ahead');
  const towned = () => {
    const t = townMap('league', ['hall1', 'dwell1', 'market']);
    return t;
  };
  const a = towned();
  a.S.moons = ['gold', 'green', 'black', 'silver', 'white', 'red', 'azure', 'convergence'];
  ok(TW.income(a.S, 0).gold === 550 && TW.markets(a.S, 0) === 2, 'Золотая луна: town income +10 %, market a step better');
  a.S.day = 8;
  ok(TW.growth(a.S, a.o, 1) === Math.round(18 * 1.1), 'Зелёная луна: growth +10 %');
  a.S.day = 15;
  ok(TW.growth(a.S, a.o, 1) === Math.round(18 * 0.9), 'Чёрная луна: town growth −10 %');
  a.S.day = 22;
  ok(HE.sight(a.S, a.hero) === 3, 'Серебряная луна: sight −2');
  const blk = plain(10, 10, [0, 0], null, [{ t: 'monster', c: 8, r: 8, unit: 'shade', count: 100, max: 900, mood: 'hostile' }]);
  blk.moons = ['white', 'black', 'red', 'azure', 'green', 'silver', 'gold', 'convergence'];
  for (let i = 0; i < 7; i++) Adv.endDay(blk);
  ok(blk.map.objs[0].count === 120, 'Чёрная луна: neutrals grow twice as fast');
  blk.moons = ['white', 'red', 'azure', 'green', 'silver', 'gold', 'black', 'convergence'];
  blk.day = 43;
  for (let i = 0; i < 7; i++) Adv.endDay(blk);
  ok(blk.map.objs[0].count === 150, 'Схождение: neutrals +25 %');
  const bt = plain(10, 10, [0, 0], [{ unit: 'militia', count: 100 }], [{ t: 'monster', c: 4, r: 0, unit: 'shade', count: 5, mood: 'hostile' }]);
  bt.moons = ['gold', 'white', 'red', 'azure', 'green', 'silver', 'black', 'convergence'];
  walk(bt, 4, 0);
  ok(Adv.battleSetup(bt).moon.id === 'gold', 'a map battle knows the moon');
}

{
  const { S, h } = heroMap('magister');
  ok(h.spells.join() === 'balm,haste' && !heroMap('captain').h.spells.length, 'a mage starts with two spells, a warrior with none');
  ok(heroMap('magister', { hid: 'kaspar' }).h.spells.includes('haste') && heroMap('shaman', { hid: 'saryg' }).h.spells.includes('chill'), 'a spell speciality is known from the start');
  ok(HE.canLearn(h, 'spark') && HE.canLearn(h, 'firearrow') && !HE.canLearn(h, 'fireball'), 'circles 1 and 2 for anyone, circle 3 needs the school');
  h.skills.zhar = 1;
  ok(HE.canLearn(h, 'fireball') && !HE.canLearn(h, 'meteor'), 'the first rank opens circle 3');
  h.skills.zhar = 2;
  ok(HE.canLearn(h, 'meteor') && !HE.canLearn(h, 'starfall'), 'the second rank opens circle 4');
  h.skills.zhar = 3;
  ok(HE.canLearn(h, 'starfall'), 'the master opens circle 5');
  const book = heroMap('captain').h;
  book.perks.push('bookworm');
  ok(HE.canLearn(book, 'fireball') && !HE.canLearn(book, 'meteor'), 'Книжник: a circle higher without the school');
  ok(HE.learn(h, 'spark') && !HE.learn(h, 'spark') && h.spells.includes('spark'), 'a spell is learned once');
  ok(!HE.canLearn(h, 'highview'), 'road spells are not learned');
  ok(!HE.roadSpells(heroMap('captain').h).length, 'no road spells at level 1');
  const lv = heroMap('captain').h;
  lv.level = 12;
  ok(HE.roadSpells(lv).join() === 'highview,moontrack,tailwind,callboat,waterwalk,return', 'road spells open with the level');
  const side = HE.battleHero(h);
  ok(side.power === HE.stat(h, 'power') && side.mana === h.mana && side.spells.includes('spark') && side.ranks.zhar === 3, 'the battle gets power, mana, spells and ranks');
  const fight = heroMap('magister', { army: [{ unit: 'militia', count: 100 }, { unit: 'crossbow', count: 30 }] });
  fight.h.mana = 20;
  fight.h.power = 6;
  MD.add(fight.S.map, { t: 'monster', c: 7, r: 5, owner: -1, l: 0, unit: 'shade', count: 40, mood: 'hostile' });
  walk(fight.S, 6, 5);
  const B = BA.create(Adv.battleSetup(fight.S));
  const used0 = B.sides[0].hero.mana;
  AI.play(B, 100);
  Adv.battleDone(fight.S, B);
  ok(fight.h.mana === B.sides[0].hero.mana && fight.h.mana <= used0, 'mana spent in battle stays spent');
  ok(S.heroes[0].mana === HE.maxMana(S.heroes[0]), 'mana starts full');
}

{
  const t = townMap('league', ['hall1', 'guild1', 'guild2', 'guild3', 'guild4', 'guild5']), { S, o } = t;
  const own = H.FACTIONS.league.schools;
  ok(H.TOWN.shelves.every((n, i) => o.guild[i + 1].length === n && new Set(o.guild[i + 1]).size === n && o.guild[i + 1].every(id => H.SPELLS[id].circle === i + 1)), 'guild shelves: 4, 3, 3, 2 and 1 spells of their circles');
  let half = true, top = true;
  for (let seed = 1; seed <= 100; seed++) {
    const M = MD.create(30, 20, ['meadow']);
    MD.add(M, { t: 'town', c: 10, r: 5, owner: 0, faction: 'barrows', name: 'П', built: ['hall1'] });
    const q = Adv.create(M, { seed, moons: null, players: [{ name: 'И', color: 0, faction: 'barrows', human: true }], heroes: [] }), g = TW.list(q)[0], sch = H.FACTIONS.barrows.schools;
    for (const c of [1, 2, 3]) if (g.guild[c].filter(id => sch.includes(H.SPELLS[id].school)).length * 2 < g.guild[c].length) half = false;
    for (const c of [4, 5]) if (!g.guild[c].every(id => sch.includes(H.SPELLS[id].school))) top = false;
  }
  ok(half, 'at least half of the shelves of circles 1–3 belong to the schools of the people');
  ok(top, 'circles 4 and 5 hold only the schools of the people');
  ok(own.length === 2, 'two schools for the people');
  const fresh0 = TW.teach(S, o), h = t.hero;
  ok(fresh0.length > 0 && fresh0.every(id => h.spells.includes(id)) && fresh0.every(id => H.SPELLS[id].circle <= 2), 'the visiting hero learns what he can: circles 1 and 2 without a school');
  ok(!TW.teach(S, o).length, 'nothing twice');
  const lig = townMap('barrows', ['hall1', 'guild1', 'special4']);
  ok(TW.shelf(lig.o, 1).length === 5 && ['tlen', 'glub'].includes(H.SPELLS[TW.shelf(lig.o, 1)[4]].school), 'Юрта шаманов adds a shelf of Тлень or Глубь');
  ok(TW.shelf(townMap('barrows', ['hall1', 'guild1']).o, 1).length === 4, 'without the yurt the shelf stays at four');
  const vis = townMap('league', ['hall1', 'guild1']);
  vis.hero.c = 12;
  vis.hero.r = 9;
  const ev = walk(vis.S, 12, 7);
  ok(ev.some(e => e.t === 'learned') && ev.some(e => e.t === 'town'), 'entering a town with a guild teaches');
  const bld = townMap('league', ['hall1']);
  const r = TW.build(bld.S, bld.o, 'guild1');
  ok(r.ev.some(e => e.t === 'learned'), 'a new guild teaches the hero at the gate');
}

{
  const q = heroMap('captain');
  MD.add(q.S.map, { t: 'shrine1', c: 6, r: 4, owner: -1, l: 0, spell: 'spark' });
  ok(MD.entry(q.S.map.objs[0]).join() === '6,5', 'a shrine has an entrance');
  const ev = walk(q.S, 6, 5);
  ok(q.h.spells.includes('spark') && ev.some(e => e.t === 'learned') && !q.S.map.objs[0].gone, 'a shrine teaches and stays');
  const q2 = heroMap('captain');
  MD.add(q2.S.map, { t: 'shrine3', c: 6, r: 4, owner: -1, l: 0, spell: 'fireball' });
  const e2 = walk(q2.S, 6, 5);
  ok(!q2.h.spells.includes('fireball') && e2.some(e => e.t === 'shrine' && !e.known), 'circle 3 needs a school');
  const q3 = heroMap('captain');
  MD.add(q3.S.map, { t: 'shrine2', c: 6, r: 4, owner: -1, l: 0 });
  walk(q3.S, 6, 5);
  ok(H.SPELLS[q3.S.map.objs[0].spell].circle === 2, 'a shrine without a set spell picks one of its circle');
  const q4 = heroMap('captain');
  MD.add(q4.S.map, { t: 'scroll', c: 6, r: 5, owner: -1, l: 0, spell: 'spark' });
  walk(q4.S, 6, 5);
  ok(q4.h.spells.includes('spark') && q4.S.map.objs[0].gone && !q4.h.bag.length, 'a scroll teaches a spell the hero can learn');
  const q5 = heroMap('captain');
  MD.add(q5.S.map, { t: 'scroll', c: 6, r: 5, owner: -1, l: 0, spell: 'fireball' });
  const e5 = walk(q5.S, 6, 5);
  ok(q5.h.bag.join() === 'scroll-fireball' && e5.some(e => e.t === 'scroll'), 'a scroll out of reach stays in the bag');
  ok(!HE.fits('scroll-fireball', 'head') && !HE.fits('scroll-fireball', 'charm'), 'a scroll goes on no place of the body');
  const reader = heroMap('magister', { skills: { zhar: 1 } }).h;
  HE.moveArt(q5.h, { bag: 0 }, reader, { bag: 0 });
  ok(HE.learnScrolls(reader).join() === 'fireball' && reader.spells.includes('fireball') && !reader.bag.length, 'another hero can read the scroll');
}

{
  const t = heroMap('magister'), { S, h } = t;
  h.level = 30;
  h.mana = 100;
  let r = HE.castRoad(S, h, 'highview');
  ok(r.ok && h.mana === 94 && S.players[0].seen[0][MD.idx(S.map, 14, 5)] === 1, 'Вид с высоты opens a circle of 10');
  ok(HE.castRoad(S, h, 'moontrack').ok && S.players[0].track === S.day, 'Лунный след for today');
  const st = h.steps;
  ok(HE.castRoad(S, h, 'tailwind').ok && h.steps === st + 5, 'Попутный ветер: +5 steps');
  r = HE.castRoad(S, h, 'callboat');
  ok(!r.ok && h.mana === 100 - 6 - 8 - 8, 'no boat to call, no mana spent');
  const low = heroMap('magister').h;
  ok(!HE.castRoad(heroMap('magister').S, low, 'highview').ok, 'a road spell waits for its level');
  const dry = heroMap('magister');
  dry.h.level = 30;
  dry.h.mana = 0;
  ok(HE.castRoad(dry.S, dry.h, 'highview').why === 'Не хватает маны', 'a road spell needs mana');
  const w = heroMap('magister');
  w.h.level = 30;
  w.h.mana = 100;
  MD.paint(w.S.map, 0, 'water', (c, r2) => c === 6);
  ok(!Adv.path(w.S, w.h, 6, 5), 'water stops a hero');
  HE.castRoad(w.S, w.h, 'waterwalk');
  ok(Adv.path(w.S, w.h, 6, 5).steps[0].cost === 1, 'Хождение по воде: water costs like a meadow');
  walk(w.S, 6, 5);
  const ev = Adv.endDay(w.S);
  ok(ev.some(e => e.t === 'landed') && w.h.c !== 6 && !Adv.path(w.S, w.h, 6, 5), 'the next day the hero stands on land again');
  const f = heroMap('magister');
  f.h.level = 30;
  f.h.mana = 100;
  MD.paint(f.S.map, 0, 'rock', (c, r2) => c === 6);
  HE.castRoad(f.S, f.h, 'flight');
  ok(Adv.path(f.S, f.h, 6, 5).steps[0].cost === 1, 'Полёт crosses rock');
  const home = townMap('league', ['hall1'], [{ t: 'town', c: 20, r: 5, faction: 'league', name: 'Второй', built: ['hall1'] }]);
  home.hero.level = 30;
  home.hero.mana = 100;
  home.hero.c = 25;
  home.hero.r = 15;
  ok(HE.castRoad(home.S, home.hero, 'return').ok && home.hero.c === 22 && home.hero.r === 7 && home.hero.steps === 0, 'Возвращение: to the nearest own town, the day ends');
  home.hero.steps = Adv.daySteps(home.S, home.hero);
  const first = TW.list(home.S, 0)[0].id;
  ok(HE.castRoad(home.S, home.hero, 'moongate', first).ok && home.hero.c === 12 && home.hero.r === 7, 'Лунные врата: to any own town');
  home.hero.steps = 1;
  ok(HE.castRoad(home.S, home.hero, 'moongate', first).why === 'Герой сегодня уже ходил', 'only if the hero has not walked today');
}

{
  let cast = 0, done = true;
  for (let seed = 1; seed <= 30; seed++) {
    const B = BA.create({ seed, moon: null, sides: [{ stacks: [{ unit: 'militia', count: 60 }, { unit: 'crossbow', count: 20 }, { unit: 'ringer', count: 6 }], hero: mage({ power: 6, mana: 60 }) }, { stacks: [{ unit: 'shade', count: 60 }, { unit: 'horsebow', count: 18 }, { unit: 'stonewoman', count: 5 }], hero: mage({ id: 1, power: 6, mana: 60 }) }] });
    while (B.winner < 0 && B.round <= 100) {
      for (const e of BA.act(B, AI.choose(B))) if (e.t === 'cast') cast++;
    }
    if (B.winner < 0) done = false;
  }
  ok(done, 'the AI finishes battles with mage heroes');
  ok(cast > 30, 'the AI casts spells (' + cast + ' in 30 battles)');
  const options = arena();
  options.stacks[0].count = 30;
  let valid = true;
  for (const id of allSpells) {
    const sp = H.SPELLS[id];
    if (sp.aim === 'push' || sp.aim === 'swap') continue;
    const opts = BA.castOptions(options, id);
    if (!opts.length || !opts.every(a => a.type === 'cast')) valid = false;
  }
  ok(valid, 'every spell offers a way to cast it on the field');
  ok(allSpells.every(id => BA.spellFacts(options, options.sides[0].hero, H.SPELLS[id])[0].startsWith('Мана')), 'every spell can describe itself');
}

const twoPlayers = (extra, more) => {
  const M = MD.create(30, 20, ['meadow']);
  for (const o of more || []) MD.add(M, Object.assign({ owner: -1, l: 0 }, o));
  return Adv.create(M, Object.assign({ seed: 5, moons: null, players: [{ name: 'Лига', color: 0, faction: 'league', human: true }, { name: 'Курганы', color: 1, faction: 'barrows', human: false }], heroes: [{ owner: 0, name: 'Мы', cls: 'captain', faction: 'league', c: 5, r: 5, army: [{ unit: 'plated', count: 20 }] }, { owner: 1, name: 'Они', cls: 'noyon', faction: 'barrows', c: 9, r: 5, army: [{ unit: 'shade', count: 5 }] }] }, extra || {}));
};
const autoFight = S => {
  const setup = Adv.battleSetup(S), B = BA.create(setup);
  AI.play(B, 100);
  return { setup, B, ev: Adv.battleDone(S, B) };
};

{
  const S = twoPlayers(), [me, foe] = S.heroes;
  const p = Adv.path(S, me, foe.c, foe.r);
  ok(p && p.kind === 'duel' && p.target === foe.id, 'a path to an enemy hero is a duel');
  const end = p.steps[p.steps.length - 1];
  ok(Math.max(Math.abs(end.c - foe.c), Math.abs(end.r - foe.r)) === 1, 'the duel path ends next to the enemy');
  for (const st of p.steps) Adv.step(S, me, st.c, st.r);
  ok(!S.pending, 'walking next to a hero starts nothing by itself');
  const here = Adv.path(S, me, foe.c, foe.r);
  ok(here.here && here.kind === 'duel', 'next to the enemy the path says here');
  Adv.engage(S, me, foe.id, 'duel');
  ok(S.pending && S.pending.kind === 'duel' && S.pending.enemy === foe.id, 'engaging opens the duel');
  Adv.resolve(S, 'retreat');
  ok(!S.pending && me.alive && foe.alive, 'a duel can be declined before the battle');
  Adv.engage(S, me, foe.id, 'duel');
  foe.arts.right = 'khanaxe';
  foe.bag.push('couriers');
  const r = autoFight(S);
  ok(r.setup.player === 0 && r.setup.sides[1].hero && r.setup.sides[1].hero.name === 'Они', 'the battle has heroes on both sides and the human attacks');
  ok(r.B.winner === 0 && !foe.alive && me.alive, 'the winner stays, the loser falls');
  ok(me.arts.right === 'khanaxe' && me.arts.legs === 'couriers' && r.ev.some(e => e.t === 'looted' && e.count === 2), 'the winner takes the artifacts of the fallen hero');
  ok(me.xp > 0 && r.ev.some(e => e.t === 'won' && e.hero === me.id), 'the winner gets experience');
  ok(S.players[1].out && S.over && S.over.winner === 0 && S.over.why === 'defeat', 'the last enemy hero without towns: the player is out and the game is won');
  const D = twoPlayers(), [mine, them] = D.heroes;
  them.army[0] = { unit: 'stonekhan', count: 8, stars: 0, vet: 0 };
  mine.c = them.c - 1;
  Adv.engage(D, them, mine.id, 'duel');
  const back = autoFight(D);
  ok(back.setup.player === 1, 'when the AI attacks, the human defends on the right');
  ok(back.B.winner === 0 && !mine.alive && them.alive && them.xp > 0, 'the attacking AI hero can win');
  ok(D.over && D.over.winner === 1 && D.players[0].out, 'the human without heroes and towns loses');
  const W = twoPlayers(), [wa, wb] = W.heroes;
  wa.army[0] = { unit: 'militia', count: 2, stars: 0, vet: 0 };
  wb.army[0] = { unit: 'stonekhan', count: 8, stars: 0, vet: 0 };
  wa.c = wb.c - 1;
  Adv.engage(W, wa, wb.id, 'duel');
  const lost = autoFight(W);
  ok(lost.B.winner === 1 && !wa.alive && wb.alive && lost.ev.some(e => e.t === 'won' && e.hero === wb.id) && wb.xp > 0, 'a defending hero who wins gets experience');
  const T = twoPlayers({}, [{ t: 'town', c: 14, r: 2, owner: 1, faction: 'barrows', name: 'Цель', built: ['hall1', 'tavern'] }]), [ta, tb] = T.heroes, town = TW.list(T)[0], gate = MD.entry(town);
  tb.c = gate[0];
  tb.r = gate[1];
  ta.c = gate[0] - 3;
  ta.r = gate[1] + 2;
  const tp = Adv.path(T, ta, town.c + 1, town.r);
  ok(tp && tp.kind === 'duel' && tp.target === tb.id, 'a town with a hero at the gate: the path leads to the hero first');
  town.garrison[0] = { unit: 'shade', count: 3 };
  tb.c = 25;
  tb.r = 15;
  const open = Adv.path(T, ta, town.c + 1, town.r);
  ok(open.kind === 'visit', 'with the gate free the path enters the town');
  for (const st of open.steps) Adv.step(T, ta, st.c, st.r);
  ok(T.pending && T.pending.kind === 'town', 'a garrison stops the hero');
  const siege = Adv.battleSetup(T);
  ok(siege.player === 0 && siege.sides[1].stacks.length === 1, 'the human storms the town');
  const hb = BA.create(siege);
  AI.play(hb, 100);
  Adv.battleDone(T, hb);
  ok(town.owner === 0 && !town.garrison.some(Boolean), 'the town changes hands');
  ok(!T.over, 'the enemy still has a hero, the game goes on');
  const F = H.Adv;
  let eb = 0, cap = BA.create({ seed: 3, sides: [{ stacks: [{ unit: 'militia', count: 1 }] }, { stacks: [{ unit: 'militia', count: 1 }] }] });
  eb = cap.winner;
  ok(eb === -1, 'a new battle has no winner');
}

{
  const S = twoPlayers();
  ok(S.turn === 0 && S.day === 1, 'the first player starts');
  let ev = Adv.endTurn(S);
  ok(S.turn === 1 && S.day === 1 && ev.some(e => e.t === 'turn' && e.player === 1), 'the turn passes without a new day');
  ev = Adv.endTurn(S);
  ok(S.turn === 0 && S.day === 2 && ev.some(e => e.t === 'day'), 'the day changes after the last player');
  S.pending = { kind: 'chest' };
  ok(Adv.endTurn(S).length === 0 && S.turn === 0, 'a turn cannot end during a decision');
  S.pending = null;
  S.players[1].out = true;
  Adv.endTurn(S);
  ok(S.turn === 0 && S.day === 3, 'a player who is out is skipped');
  const solo = plain(10, 10, [2, 2]);
  Adv.endTurn(solo);
  ok(solo.turn === 0 && solo.day === 2, 'one player: every turn is a day');
  ok(!solo.over, 'a map with one player is never won by itself');

  const L = twoPlayers({}, [{ t: 'town', c: 20, r: 3, owner: 0, faction: 'league', name: 'Дом', built: ['hall1'] }]), home = TW.list(L)[0];
  L.players[1].hadTown = true;
  L.heroes[0].c = 2;
  home.owner = 1;
  for (let i = 0; i < 6; i++) Adv.endDay(L);
  ok(!L.players[0].out && L.players[0].townless === 6, 'a player without towns counts the days');
  home.owner = 0;
  Adv.endDay(L);
  ok(L.players[0].townless === 0, 'taking a town resets the count');
  home.owner = 1;
  for (let i = 0; i < 7; i++) Adv.endDay(L);
  ok(L.players[0].out && !L.heroes[0].alive, 'seven days without a town: the player is out with the heroes');
  ok(L.over && L.over.winner === 1, 'the human who is out ends the game');
  const never = twoPlayers();
  for (let i = 0; i < 9; i++) Adv.endDay(never);
  ok(!never.players[0].out, 'a player who never had a town does not count the days');

  const G = goals => twoPlayers({ goals }, [{ t: 'town', c: 20, r: 3, owner: 1, faction: 'barrows', name: 'Цель', built: ['hall1'] }]);
  const gt = G({ win: [{ kind: 'town', town: 1, who: 0 }], lose: [{ kind: 'all' }] }), gtown = TW.list(gt)[0];
  ok(Adv.goalText(gt.map, gt.goals).win[0] === 'Взять город Цель', 'the goal is described with the town name');
  Adv.conclude(gt, []);
  ok(!gt.over, 'the goal is not reached yet');
  gtown.owner = 0;
  Adv.conclude(gt, []);
  ok(gt.over && gt.over.winner === 0 && gt.over.why === 'town', 'taking the town wins the map');
  const gg = G({ win: [{ kind: 'gold', n: 50000 }], lose: [{ kind: 'all' }] });
  gg.players[1].res.gold = 50000;
  Adv.conclude(gg, []);
  ok(gg.over && gg.over.winner === 1, 'a win goal without who works for every player');
  const gw = G({ win: [{ kind: 'gold', n: 50000, who: 0 }], lose: [{ kind: 'all' }] });
  gw.players[1].res.gold = 50000;
  Adv.conclude(gw, []);
  ok(!gw.over, 'a win goal with who works only for that player');
  const gd = G({ win: [{ kind: 'defeat' }], lose: [{ kind: 'all' }, { kind: 'day', day: 3 }] });
  ok(Adv.goalText(gd.map, gd.goals).lose[1] === 'Не успеть за 3 дня', 'the time limit is described');
  for (let i = 0; i < 3; i++) Adv.endDay(gd);
  ok(gd.players[0].out && gd.over && gd.over.winner === 1, 'time is up: the human loses');
  const gh = twoPlayers({ goals: { win: [{ kind: 'hero', hid: 'timar' }], lose: [{ kind: 'all' }, { kind: 'hero', hid: 'renier' }] } });
  gh.heroes[0].hid = 'renier';
  gh.heroes[1].hid = 'timar';
  gh.heroes[1].alive = false;
  gh.players[1].hadTown = true;
  Adv.conclude(gh, []);
  ok(gh.over && gh.over.winner === 0 && gh.over.why === 'hero', 'beating the named hero wins');
  ok(Adv.score(gh) > Adv.score(Object.assign({}, gh, { day: 200 })), 'an earlier win scores more');
  ok(Adv.score(Object.assign({}, gh, { difficulty: 'hard' })) > Adv.score(gh), 'a harder game scores more');

  ok(Object.keys(H.DIFFICULTY).join() === 'easy,normal,hard,impossible', 'four difficulty levels');
  const hard = twoPlayers({ difficulty: 'hard' }), easy = twoPlayers({ difficulty: 'easy' });
  ok(hard.players[0].res.gold === 7500 && hard.players[1].res.gold === H.MAP.start.gold, 'hard: less gold for the human only');
  ok(easy.players[0].res.gold === 15000 && easy.players[0].res.wood === Math.round(H.MAP.start.wood * 1.5), 'easy: other resources follow the same share');
  const inc = d => {
    const t = twoPlayers({ difficulty: d }, [{ t: 'goldmine', c: 20, r: 3, owner: 1 }]), before = t.players[1].res.gold;
    Adv.endDay(t);
    return t.players[1].res.gold - before;
  };
  ok(inc('normal') === 1000 && inc('impossible') === 1300 && inc('easy') === 800, 'AI income follows the difficulty');
  const gr = d => {
    const t = twoPlayers({ difficulty: d }, [{ t: 'town', c: 20, r: 3, owner: 1, faction: 'barrows', name: 'Рост', built: ['hall1', 'dwell1'] }]);
    return TW.growth(t, TW.list(t)[0], 1);
  };
  ok(gr('impossible') > gr('normal') && gr('normal') > gr('easy'), 'AI growth follows the difficulty');
}

{
  const side = (unit, count) => ({ stacks: [{ unit, count }] });
  const strong = AI.estimate([side('plated', 30), side('shade', 10)], null), weak = AI.estimate([side('shade', 10), side('plated', 30)], null);
  ok(strong.win && strong.lost[0] < 0.1 && strong.lost[1] === 1, 'a much stronger army wins with few losses');
  ok(!weak.win && weak.lost[0] === 1, 'a much weaker army loses');
  ok(JSON.stringify(strong) === JSON.stringify(AI.estimate([side('plated', 30), side('shade', 10)], null)), 'the estimate has no chance in it');
  ok(AI.estimate([{ stacks: [{ unit: 'crossbow', count: 20 }] }, side('militia', 10)], null).rounds >= 1, 'shooters are counted');
  const melee = AI.estimate([side('militia', 40), side('militia', 40)], null);
  ok(melee.lost[0] > 0.4 && melee.lost[1] > 0.4, 'equal armies both lose a lot');
  let err = 0, n = 0, wrong = 0;
  for (const [a, b] of [[['plated', 12], ['shade', 60]], [['militia', 60], ['horsebow', 12]], [['horseguard', 3], ['stonewoman', 12]], [['crossbow', 24], ['eaglespirit', 3]], [['ringer', 14], ['shade', 40]]]) {
    const est = AI.estimate([side(a[0], a[1]), side(b[0], b[1])], null);
    let wins = 0, lost = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const B = BA.create({ seed, sides: [side(a[0], a[1]), side(b[0], b[1])] });
      AI.play(B, 100);
      const s = B.stacks[0];
      if (B.winner === 0) wins++;
      lost += 1 - s.count / s.start;
    }
    err += Math.abs(est.lost[0] - lost / 30);
    if (est.win !== wins >= 15) wrong++;
    n++;
  }
  ok(err / n <= 0.2, 'the estimate stays close to full battles (' + (err / n).toFixed(2) + ')');
  ok(wrong <= 1, 'the estimate names the winner');
}

const allMaps = [['ford', ['league', 'barrows']], ['mesha', ['league', 'barrows', 'barrows', 'league']]];

{
  ok(H.Maps.LIST.filter(m => m.make).map(m => m.id + ' ' + m.size).join() === 'ford малая,chasha большая,mesha средняя', 'three hand-made maps: small, large and medium');
  for (const [id, lineup] of allMaps) {
    const rec = H.Maps.LIST.find(m => m.id === id), def = H.Maps.build(id, { seed: 3, slots: lineup.map((f, i) => ({ faction: f, human: !i })) }), M = def.map;
    ok(M.w === rec.w && M.h === rec.w && M.levels === 1 && rec.players === lineup.length && rec.about.length > 20, id + ': size, players and text');
    const used = new Map();
    let clean = true, ground = true;
    for (const o of M.objs) {
      for (const [c, r] of MD.cells(o)) {
        const k = c + ',' + r;
        if (!MD.inside(M, c, r) || used.has(k)) clean = false;
        used.set(k, o.t);
        if (H.OBJ[o.t].kind !== 'decor' && !MD.groundCost(M, 0, c, r)) ground = false;
      }
      const e = MD.entry(o);
      if (e && !MD.groundCost(M, 0, e[0], e[1])) ground = false;
    }
    ok(clean, id + ': objects do not overlap and stay on the map');
    ok(ground, id + ': objects and entries stand on walkable ground');
    const S = Adv.create(M, def.setup);
    const towns = TW.list(S).filter(o => o.owner >= 0);
    ok(towns.length === lineup.length && towns.every((t, i) => t.faction === lineup[i] && t.owner === i), id + ': every player has a town of the chosen people');
    ok(S.heroes.every((h, i) => h.owner === i && h.faction === lineup[i] && TW.visitor(S, towns[i]) === h), id + ': every hero starts at the gate of the town');
    ok(S.players.map(p => p.human).join() === lineup.map((f, i) => !i).join(), id + ': one human, the others are AI');
    for (const h of S.heroes) h.alive = false;
    S.heroes[0].alive = true;
    const F = H.AI.field(S, S.heroes[0], 1e9);
    let reach = true;
    const missed = [];
    for (const o of M.objs) {
      const k = H.OBJ[o.t].kind;
      if (k === 'decor') continue;
      let d = Infinity;
      if (o.t === 'monster') {
        for (const [dc, dr] of H.Path.DIRS) if (MD.inside(M, o.c + dc, o.r + dr)) d = Math.min(d, F.dist[MD.idx(M, o.c + dc, o.r + dr)]);
      } else {
        const e = MD.entry(o);
        d = F.dist[MD.idx(M, e[0], e[1])];
      }
      if (!isFinite(d)) {
        reach = false;
        missed.push(o.t + ' ' + o.c + ',' + o.r);
      }
    }
    ok(reach, id + ': every object can be reached: ' + missed.join('; '));
    const near = o => {
      const e = MD.entry(o);
      return F.dist[MD.idx(M, e[0], e[1])];
    };
    const own = S.map.objs.filter(o => o.t === 'sawmill' || o.t === 'oremine').map(near).sort((a, b) => a - b);
    ok(own[0] <= 18 && own[1] <= 18, id + ': sawmill and ore mine within a day and without a guard');
    ok(towns.slice(1).every(t => near(t) >= 100000), id + ': the way to another player goes through a guard');
    const day = towns.slice(1).map(t => (near(t) % 100000) / 18);
    ok(day.every(v => v >= 2.5), id + ': other players are at least 2.5 days away (' + day.map(v => v.toFixed(1)).join(', ') + ')');
    if (id === 'mesha') ok(Math.min(...day) >= 4, id + ': neighbours on the medium map are at least 4 days away');
  }
  const unused = H.Maps.build('mesha', { seed: 3, slots: [{ faction: 'league', human: true }, null, null, { faction: 'barrows' }] }), S2 = Adv.create(unused.map, unused.setup), free = TW.list(S2).filter(o => o.owner < 0);
  ok(S2.players.length === 2 && S2.players[1].color === 3, 'a free slot leaves out its player and keeps the colours');
  ok(free.length === 3 && free.every(t => t.garrison.some(Boolean)), 'towns of free slots stay neutral with a garrison');
  const again = H.Maps.build('ford', { seed: 3, slots: [{ faction: 'league' }, { faction: 'barrows' }] }), once = H.Maps.build('ford', { seed: 3, slots: [{ faction: 'league' }, { faction: 'barrows' }] });
  ok(JSON.stringify(again) === JSON.stringify(once), 'the same seed builds the same map');
  const same = H.Maps.build('ford', { seed: 11, slots: [{ faction: 'league' }, { faction: 'league' }] });
  ok(same.setup.heroes[0].hid !== same.setup.heroes[1].hid, 'two players of one people get different heroes');
  const picked = H.Maps.build('ford', { seed: 11, slots: [{ faction: 'barrows', hid: 'aisulu' }, { faction: 'league' }] });
  ok(picked.setup.heroes[0].hid === 'aisulu', 'a chosen hero is used');
  ok(H.FACTIONS.league.ai.every(id => H.FACTIONS.league.building[id]) && H.FACTIONS.barrows.ai.every(id => H.FACTIONS.barrows.building[id]), 'the AI building lists name real buildings');
}

{
  const play = (id, lineup, seed, days) => {
    const def = H.Maps.build(id, { seed, slots: lineup.map(f => (f ? { faction: f } : null)) }), S = Adv.create(def.map, def.setup);
    while (!S.over && S.day <= days) {
      H.AI.turn(S);
      Adv.endTurn(S);
    }
    return S;
  };
  const S = play('ford', ['league', 'barrows'], 21, 12);
  const towns = TW.list(S).filter(o => o.owner >= 0);
  ok(S.day >= 2, 'AI players play whole days');
  ok(towns.every(t => t.built.length > 5), 'the AI builds in its town');
  ok(S.map.objs.some(o => H.OBJ[o.t].kind === 'mine' && o.owner >= 0), 'the AI takes mines');
  ok(S.map.objs.some(o => o.gone), 'the AI picks up finds and beats guards');
  ok(S.heroes.length > 2, 'the AI hires heroes');
  ok(S.heroes.some(h => h.level > 1), 'AI heroes grow');
  ok(S.heroes.every(h => !h.alive || !HE.levelPending(h)), 'AI heroes spend their levels');
  ok(S.players.every(p => H.RESOURCES.every(([k]) => p.res[k] >= 0)), 'the AI never goes into debt');
  const a = play('ford', ['barrows', 'league'], 5, 10), b = play('ford', ['barrows', 'league'], 5, 10);
  ok(H.Save.hash(a) === H.Save.hash(b), 'AI turns repeat exactly for the same seed');
  let finished = 0, longest = 0;
  for (let seed = 40; seed < 46; seed++) {
    const g = play('ford', seed % 2 ? ['league', 'barrows'] : ['barrows', 'league'], seed, 150);
    if (g.over) finished++;
    longest = Math.max(longest, g.day);
  }
  ok(finished >= 5, 'AI against AI finishes the small map (' + finished + ' of 6, longest ' + longest + ' days)');
  const big = play('mesha', ['league', 'barrows', 'barrows', 'league'], 9, 20);
  ok(big.day > 20 || big.over, 'AI players play the medium map for twenty days');
  ok(big.players.some(p => p.res.gold !== H.MAP.start.gold), 'the economy moves on the medium map');

  const clash = twoPlayers(), [human, foe] = clash.heroes;
  human.army[0] = { unit: 'shade', count: 2, stars: 0, vet: 0 };
  foe.army[0] = { unit: 'stonekhan', count: 6, stars: 0, vet: 0 };
  clash.players[0].hadTown = true;
  clash.turn = 1;
  const T = H.AI.begin(clash, 1);
  let result = null;
  for (let i = 0; i < 400 && !result; i++) {
    const r = H.AI.step(clash, T);
    if (r.battle) result = r.battle;
    if (r.done) break;
  }
  ok(result && result.player === 1, 'the AI attacks a weak human hero and hands the battle to the human');
  const B = BA.create(result);
  AI.play(B, 100);
  Adv.battleDone(clash, B);
  ok(!human.alive && clash.over, 'after that battle the rules go on');
  const shy = twoPlayers(), [hm, hf] = shy.heroes;
  hm.army[0] = { unit: 'stonekhan', count: 6, stars: 0, vet: 0 };
  hf.army[0] = { unit: 'shade', count: 2, stars: 0, vet: 0 };
  shy.turn = 1;
  const TS = H.AI.begin(shy, 1);
  let attacked = false;
  for (let i = 0; i < 400; i++) {
    const r = H.AI.step(shy, TS);
    if (r.battle) attacked = true;
    if (r.done) break;
  }
  ok(!attacked, 'the AI does not throw a weak hero at a strong one');
  const towny = twoPlayers({}, [{ t: 'town', c: 20, r: 12, owner: 1, faction: 'barrows', name: 'Степь', built: ['hall1', 'tavern', 'dwell1', 'dwell2'] }]);
  towny.heroes[1].alive = false;
  towny.heroes[0].c = 2;
  towny.turn = 1;
  const tw = TW.list(towny)[0], gold = towny.players[1].res.gold;
  const TT = H.AI.begin(towny, 1);
  for (let i = 0; i < 400; i++) if (H.AI.step(towny, TT).done) break;
  ok(towny.heroes.some(h => h.alive && h.owner === 1), 'an AI player without heroes hires one');
  ok(towny.players[1].res.gold < gold, 'the AI spends gold');
  ok(tw.built.length > 4, 'the AI builds in its own town');
  ok(tw.today, 'and only one building a day');
}

{
  const S = plain(12, 12, [3, 3]);
  const bits = [1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1];
  ok(H.Save.unpackBits(H.Save.packBits(bits), bits.length).join() === bits.join(), 'fog packs into bits and back');
  const text = H.Save.pack(S), back = H.Save.unpack(text);
  ok(H.Save.hash(back) === H.Save.hash(S), 'save and load: the same hash');
  ok(!text.includes('[1,1,1'), 'the fog is stored as bits, not as a list');
  assert.throws(() => H.Save.unpack(JSON.stringify({ game: 'other', v: 1, S: {} })), /not a Heroes 98 save/);
  checks++;
  assert.throws(() => H.Save.unpack(JSON.stringify({ game: 'heroes98', v: 99, S: {} })), /newer version/);
  checks++;
  const old = JSON.parse(H.Save.pack(S));
  old.v = 0;
  delete old.S.turn;
  delete old.S.goals;
  delete old.S.difficulty;
  delete old.S.battle;
  delete old.S.mapName;
  delete old.S.debug;
  old.S.over = 'lose';
  for (const p of old.S.players) {
    delete p.out;
    delete p.townless;
    delete p.hadTown;
  }
  const moved = H.Save.unpack(JSON.stringify(old));
  ok(moved.turn === 0 && moved.difficulty === 'normal' && moved.goals.win[0].kind === 'defeat' && moved.over.why === 'lost' && moved.players[0].out === false, 'a save of the old version is carried over');
  Adv.endTurn(Object.assign(moved, { over: null }));
  ok(moved.day === 2, 'and the game goes on from it');
  ok(H.Save.SLOTS.filter(id => id[0] === 'm').length === 10 && H.Save.SLOTS.filter(id => id[0] === 'a').length === 3 && H.Save.SLOTS.includes('q'), '10 manual slots, 3 autosaves and a quick save');
  const days = [1, 2, 3, 4, 5, 6].map(d => H.Save.autoSlot({ day: d }));
  ok(days.join() === 'a1,a2,a3,a1,a2,a3', 'autosaves go round');
  ok(H.Save.slotName('q') === 'Быстрое сохранение' && H.Save.slotName('a2') === 'Автосохранение 2' && H.Save.slotName('m7') === 'Ячейка 7', 'slot names');

  const game = (seed, days) => {
    const def = H.Maps.build('mesha', { seed, slots: [{ faction: 'league' }, { faction: 'barrows' }, { faction: 'barrows' }, { faction: 'league' }] }), G = Adv.create(def.map, def.setup);
    while (!G.over && G.day <= days) {
      H.AI.turn(G);
      Adv.endTurn(G);
    }
    return G;
  };
  const G = game(14, 14), copy = H.Save.unpack(H.Save.pack(G));
  ok(H.Save.hash(copy) === H.Save.hash(G), 'a save in the middle of a game loads with the same hash');
  for (let i = 0; i < 12; i++) {
    for (const g of [G, copy]) {
      if (g.over) continue;
      H.AI.turn(g);
      Adv.endTurn(g);
    }
  }
  ok(H.Save.hash(copy) === H.Save.hash(G), 'and the game goes on exactly the same');
  const town = TW.list(G).find(o => o.owner === G.turn) || TW.list(G)[0];
  const inTown = H.Save.unpack(H.Save.pack(G));
  town.garrison[0] = { unit: 'militia', count: 3, stars: 0, vet: 0 };
  ok(H.Save.hash(inTown) !== H.Save.hash(G), 'the hash sees a change in a town');
  const fight = twoPlayers(), [fa, fb] = fight.heroes;
  fa.c = fb.c - 1;
  Adv.engage(fight, fa, fb.id, 'duel');
  const setup = Adv.battleSetup(fight), B = BA.create(setup);
  fight.battle = { B, name: setup.name, player: setup.player, seed: setup.seed };
  for (let i = 0; i < 3 && B.winner < 0; i++) BA.act(B, AI.choose(B));
  const inBattle = H.Save.unpack(H.Save.pack(fight));
  ok(H.Save.hash(inBattle) === H.Save.hash(fight), 'a save during a battle loads with the same hash');
  ok(inBattle.pending.kind === 'battle' && inBattle.battle.B.stacks.length === B.stacks.length, 'the battle is inside the save');
  while (B.winner < 0) BA.act(B, AI.choose(B));
  const twin = inBattle.battle.B;
  while (twin.winner < 0) BA.act(twin, AI.choose(twin));
  ok(JSON.stringify(twin) === JSON.stringify(B), 'the loaded battle goes on exactly the same');
  const ev = Adv.battleDone(inBattle, twin);
  ok(ev.length > 0 && !inBattle.pending && !inBattle.battle, 'the loaded battle ends on the map');
}

{
  const ids = Object.keys(H.THEMES);
  ok(['title', 'meadow', 'steppe', 'battle', 'victory', 'defeat'].every(id => ids.includes(id)), 'themes for the title, the map and the battle');
  let notes = true, voices = true;
  for (const th of Object.values(H.THEMES)) {
    if (!(th.step > 0) || !th.voices.length || !th.name) voices = false;
    const lengths = new Set();
    for (const v of th.voices) {
      const row = v.notes.split(' ');
      lengths.add(row.length);
      if (!(v.gain > 0 && v.gain <= 0.3 && v.len >= 1)) voices = false;
      for (const n of row) if (n !== '.' && n !== 'x' && !(H.noteFreq(n) > 20 && H.noteFreq(n) < 5000)) notes = false;
      if (v.wave === 'noise' && row.some(n => n !== '.' && n !== 'x')) notes = false;
    }
    if (lengths.size > 1) voices = false;
  }
  ok(notes, 'every note of every theme is a real note');
  ok(voices, 'every theme has voices of one length with safe volumes');
  ok(Math.abs(H.noteFreq('A4') - 440) < 1e-9 && Math.abs(H.noteFreq('A5') - 880) < 1e-9 && Math.abs(H.noteFreq('C4') - 261.63) < 0.01, 'note names give the right pitch');
  const src = read(DIR + '/he-audio.js');
  ok(src.includes('clearInterval') && src.includes('this.master.disconnect()'), 'the synth stops its timer and leaves the audio graph');
  ok(read(DIR + '/he-ui.js').includes('this.sound.destroy()'), 'closing the window stops the synth');
  ok(!/\.destination\b/.test(read(DIR + '/he-ui.js')), 'the sound goes only through the mixer bus of the context');
}

const fortSiege = (fort, extra) => BA.create(Object.assign({ seed: 9, siege: { fort, dmg: 40 }, obstacles: [], sides: [{ stacks: [{ unit: 'militia', count: 40 }, { unit: 'crossbow', count: 20 }, { unit: 'aeronaut', count: 3 }], hero: mage({ machines: 0, level: 5 }) }, { stacks: [{ unit: 'shade', count: 30 }, { unit: 'horsebow', count: 10 }] }] }, extra || {}));
const activate = (B, id) => {
  B.active = id;
};

{
  const T = H.SIEGE, one = fortSiege(1), two = fortSiege(2), three = fortSiege(3);
  ok(one.siege.towers === 0 && two.siege.towers === 2 && three.siege.towers === 3, 'palisade has no towers, a wall two, a fortress three with the keep');
  ok([one, two, three].every(B => B.siege.pieces.filter(p => !p.gate).length === 4 && B.siege.pieces.filter(p => p.gate).length === 1), 'four wall sections and a gate');
  ok(one.siege.pieces[0].hp === T.wall[1] && two.siege.pieces[0].hp === T.wall[2] && three.siege.pieces[0].hp === T.wall[3], 'walls grow stronger with the fortification');
  ok(!one.siege.moat && !two.siege.moat && three.siege.moat, 'only a fortress has a moat');
  const rows = [...two.siege.pieces.flatMap(p => p.rows), 0, 9].sort((a, b) => a - b);
  ok(rows.join() === '0,1,2,3,4,5,6,7,8,9', 'wall, gate and towers close the whole column');
  const a = two.stacks.find(s => s.side === 0 && s.unit === 'militia'), d = two.stacks.find(s => s.side === 1 && s.unit === 'shade');
  ok(two.stacks.filter(s => s.side === 1 && !H.UNITS[s.unit].machine).every(s => s.c > T.col), 'defenders stand behind the wall');
  ok(two.obstacles.every(([c]) => c < T.col - 1), 'obstacles stay out of the wall');
  const random = BA.create({ seed: 11, siege: { fort: 3, dmg: 10 }, sides: [{ stacks: [{ unit: 'militia', count: 5 }] }, { stacks: [{ unit: 'shade', count: 5 }] }] });
  ok(random.obstacles.every(([c]) => c <= T.col - 2), 'random obstacles leave the moat and the wall free');
  const o = BA.occupancy(two, a);
  ok(two.siege.pieces.every(p => p.rows.every(r => o[H.Hex.idx(T.col, r)] === -2)) && o[H.Hex.idx(T.col, 0)] === -2, 'for attackers the wall and the gate are closed');
  const inner = BA.occupancy(two, d);
  ok(inner[H.Hex.idx(T.col, 4)] === -1 && inner[H.Hex.idx(T.col, 5)] === -1, 'the gate opens for the defenders');
  ok(inner[H.Hex.idx(T.col, 2)] === -2, 'the wall holds for the defenders too');
  a.c = T.col - 1;
  a.r = 2;
  const noWay = [...BA.reach(two, a).values()].filter(p => p.c >= T.col);
  ok(noWay.length === 0, 'a walker cannot pass a whole wall');
  d.c = T.col + 1;
  d.r = 4;
  d.fly = false;
  ok(BA.spots(two, a, d).length === 0, 'nobody hits over the wall');
  const flyer = two.stacks.find(s => s.unit === 'aeronaut');
  flyer.c = T.col - 2;
  flyer.r = 4;
  ok([...BA.reach(two, flyer).values()].some(p => p.c > T.col), 'flyers fly over the wall');
  const piece = two.siege.pieces.findIndex(p => p.rows.includes(3));
  two.siege.pieces[piece].hp = 0;
  a.c = T.col - 1;
  a.r = 3;
  ok([...BA.reach(two, a).values()].some(p => p.c === T.col && p.r === 3), 'a breach lets walkers through');
  ok(!BA.wallAt(two, 3) && BA.wallAt(two, 2) && BA.wallAt(two, 0), 'the wall knows where it is broken');
  const moat = fortSiege(3), m = moat.stacks[0];
  moat.siege.pieces.forEach(q => { q.hp = 0; });
  m.c = T.col - 3;
  m.r = 3;
  moat.stacks[1].c = 2;
  moat.stacks[1].r = 9;
  const steps = BA.reach(moat, m);
  ok(steps.has(H.Hex.idx(T.col - 1, 3)) && !steps.has(H.Hex.idx(T.col, 3)), 'a stack entering the moat loses the rest of its move');
  const start = fortSiege(3), s0 = start.stacks[0];
  start.siege.pieces.forEach(q => { q.hp = 0; });
  s0.c = T.col - 1;
  s0.r = 3;
  ok(BA.reach(start, s0).has(H.Hex.idx(T.col, 3)), 'and leaves it on the next turn');
  const shots = fortSiege(2), bow = shots.stacks[1], back = shots.stacks[3];
  back.c = T.col + 1;
  back.r = 2;
  bow.c = 5;
  bow.r = 2;
  shots.stacks[0].c = 0;
  const wallShot = BA.forecast(shots, bow, back, 'shot');
  shots.siege.pieces.forEach(q => { q.hp = 0; });
  const openShot = BA.forecast(shots, bow, back, 'shot');
  ok(Math.abs(wallShot.max / openShot.max - T.throughWall) < 0.1, 'attackers shoot through a wall at half damage');
  const out = fortSiege(2), def = out.stacks[4], tgt = out.stacks[0];
  def.c = T.col + 1;
  def.r = 2;
  tgt.c = 5;
  tgt.r = 2;
  const defShot = BA.forecast(out, def, tgt, 'shot');
  out.siege.pieces.forEach(q => { q.hp = 0; });
  ok(BA.forecast(out, def, tgt, 'shot').max === defShot.max, 'defenders shoot out without a penalty');
  const lob = BA.create({ seed: 9, siege: { fort: 2, dmg: 0 }, obstacles: [], sides: [{ stacks: [{ unit: 'mortar', count: 2 }, { unit: 'bombard', count: 2 }] }, { stacks: [{ unit: 'plated', count: 10, c: 11, r: 2 }] }] });
  const [mortar, cannon, foe] = lob.stacks;
  mortar.c = 5;
  mortar.r = 2;
  cannon.c = 5;
  cannon.r = 7;
  const mor1 = BA.forecast(lob, mortar, foe, 'shot');
  lob.siege.pieces.forEach(q => { q.hp = 0; });
  ok(BA.forecast(lob, mortar, foe, 'shot').max === mor1.max, 'a lobbed shot ignores the wall');

  const fire = BA.create({ seed: 4, siege: { fort: 3, dmg: 50 }, obstacles: [], ready: [0, 100], sides: [{ stacks: [{ unit: 'plated', count: 20 }] }, { stacks: [{ unit: 'shade', count: 5 }] }] });
  fire.tick = 9;
  let tower = [];
  for (let i = 0; i < 40 && !tower.length; i++) tower = BA.act(fire, { type: 'defend' }).filter(e => e.t === 'hit' && e.kind === 'tower');
  ok(tower.length === 3 && tower.every(e => e.dmg === 50 && e.by === -1), 'in a fortress three towers fire at the start of a round');
  const open = BA.create({ seed: 4, siege: { fort: 1, dmg: 50 }, obstacles: [], sides: [{ stacks: [{ unit: 'plated', count: 20 }] }, { stacks: [{ unit: 'shade', count: 5 }] }] });
  let wood = 0;
  for (let i = 0; i < 40; i++) wood += BA.act(open, { type: 'defend' }).filter(e => e.kind === 'tower').length;
  ok(wood === 0, 'a palisade has no towers');

  const cat = fortSiege(2), kat = cat.stacks.find(s => s.unit === 'catapult');
  ok(kat && kat.side === 0 && kat.count === 1 && kat.c < 0, 'every attacking hero brings a catapult, off the field');
  ok(!BA.targets(cat, 1).includes(kat), 'nobody can target the catapult');
  ok(BA.occupancy(cat).every(v => v !== kat.id), 'the catapult takes no cell');
  assert.throws(() => {
    activate(cat, cat.stacks[3].id);
    BA.act(cat, { type: 'shoot', target: kat.id });
  }, /bad target/);
  checks++;
  activate(cat, kat.id);
  const hurled = BA.act(cat, { type: 'hurl', piece: 4 });
  ok(hurled.filter(e => e.t === 'wall').length === 1, 'the catapult hits once a turn');
  const hit = cat.siege.pieces.reduce((t, q) => t + q.max - q.hp, 0);
  ok(hit === 1, 'and takes one point off a section');
  const master = fortSiege(2, { sides: [{ stacks: [{ unit: 'militia', count: 40 }], hero: mage({ machines: 3 }) }, { stacks: [{ unit: 'shade', count: 30 }] }] }), mk = master.stacks.find(s => s.unit === 'catapult');
  activate(master, mk.id);
  const twice = BA.act(master, { type: 'hurl', piece: 1 });
  ok(twice.filter(e => e.t === 'wall').length === 2 && master.siege.pieces[1].hp === 0, 'a master of machines fires twice and does not miss');
  const noCat = make([{ unit: 'militia', count: 5 }], [{ unit: 'shade', count: 5 }]);
  ok(!noCat.stacks.some(s => s.unit === 'catapult') && !noCat.siege, 'a battle in the field has neither walls nor a catapult');
  const gateOnly = fortSiege(1), gk = gateOnly.stacks.find(s => s.unit === 'catapult');
  gateOnly.siege.pieces.forEach((q, i) => { if (i !== 4) q.hp = 0; });
  activate(gateOnly, gk.id);
  assert.throws(() => BA.act(gateOnly, { type: 'hurl', piece: 0 }), /nothing to hit/);
  checks++;
  let brokenGate = false;
  for (let i = 0; i < 20 && !brokenGate; i++) {
    const g2 = fortSiege(1, { seed: 30 + i }), k2 = g2.stacks.find(s => s.unit === 'catapult');
    activate(g2, k2.id);
    BA.act(g2, { type: 'hurl', piece: 4 });
    brokenGate = g2.siege.pieces[4].hp === 0;
  }
  ok(brokenGate, 'the catapult can break the gate');

  const auto = BA.create({ seed: 13, siege: { fort: 2, dmg: 60 }, sides: [{ stacks: [{ unit: 'plated', count: 40 }, { unit: 'militia', count: 80 }], hero: mage({ machines: 0, power: 2, mana: 0 }) }, { stacks: [{ unit: 'militia', count: 20 }, { unit: 'crossbow', count: 8 }] }] });
  let wallsHit = 0;
  while (auto.winner < 0 && auto.round <= 100) for (const e of BA.act(auto, AI.choose(auto))) if (e.t === 'wall') wallsHit++;
  ok(auto.winner === 0, 'the AI takes a walled town with a much stronger army (round ' + auto.round + ')');
  ok(wallsHit > 0, 'the AI uses the catapult');
  const hold = BA.create({ seed: 13, siege: { fort: 2, dmg: 10 }, obstacles: [], sides: [{ stacks: [{ unit: 'plated', count: 5 }] }, { stacks: [{ unit: 'plated', count: 5 }] }] });
  const hs = hold.stacks[1];
  activate(hold, hs.id);
  ok(AI.choose(hold).type === 'defend', 'defenders wait behind the wall');
  ok(AI.estimate([{ stacks: [{ unit: 'plated', count: 20 }] }, { stacks: [{ unit: 'plated', count: 20 }] }], null, { fort: 3, dmg: 80 }).lost[0] >= AI.estimate([{ stacks: [{ unit: 'plated', count: 20 }] }, { stacks: [{ unit: 'plated', count: 20 }] }], null).lost[0], 'the quick estimate knows that walls cost blood');
}

{
  ok(Object.keys(H.MACHINES).join() === 'ballista,tent,wagon', 'three machines are for sale');
  ok(Object.values(H.MACHINES).every(m => H.UNITS[m.unit].cost > 0 && H.UNITS[m.unit].machine && m.about), 'each with a price and a description');
  const kit = list => ({ stacks: [{ unit: 'crossbow', count: 20 }, { unit: 'militia', count: 30 }], machines: list, hero: mage({ machines: 0, level: 5 }) });
  const fight = (list, more) => BA.create(Object.assign({ seed: 8, obstacles: [], sides: [kit(list), { stacks: [{ unit: 'plated', count: 6 }] }] }, more || {}));
  const B = fight(['ballista', 'tent', 'wagon']), [bal, tent, wagon] = B.stacks.slice(3);
  ok(bal.unit === 'ballista' && tent.unit === 'tent' && wagon.unit === 'wagon', 'machines join the field after the armies');
  ok(B.stacks.filter(s => s.side === 0).every(s => BA.cells(s).every(p => p[0] <= 2)), 'machines stand at the rear of their side');
  const cells = new Set(B.stacks.flatMap(s => BA.cells(s).map(p => p.join())));
  ok(cells.size === B.stacks.flatMap(s => BA.cells(s)).length, 'machines do not overlap the army');
  ok(BA.queue(B, 30).some(q => q.id === bal.id) && !BA.queue(B, 30).some(q => q.id === wagon.id), 'a working machine is on the tape, the wagon is not');
  ok(BA.targets(B, 1).includes(bal), 'machines can be attacked');
  ok(!BA.result(B).lost[0].some(l => H.UNITS[l.unit].machine), 'machines are not counted as creatures');
  const shoot = fight(['ballista']), ba = shoot.stacks.find(s => s.unit === 'ballista'), foe = shoot.stacks.find(s => s.side === 1);
  activate(shoot, ba.id);
  const before = foe.count, ev = BA.act(shoot, { type: 'shoot', target: foe.id });
  ok(ev.filter(e => e.t === 'hit' && e.kind === 'shot').length === 1 && (foe.count < before || foe.hp < H.UNITS.plated.hp), 'the ballista shoots');
  ok(ba.shots > 0, 'it never runs out of bolts');
  foe.c = ba.c + 1;
  foe.r = ba.r;
  activate(shoot, ba.id);
  ok(BA.canShoot(shoot, ba), 'it shoots even with an enemy next to it');
  const pair = (hero, id) => BA.create({ seed: 8, obstacles: [], sides: [{ stacks: [{ unit: 'militia', count: 30 }], machines: [id], hero }, { stacks: [{ unit: 'plated', count: 60 }] }] });
  const low = pair(mage({ level: 1, machines: 0 }), 'ballista'), high = pair(mage({ level: 20, machines: 0 }), 'ballista'), crew = pair(mage({ level: 20, machines: 2 }), 'ballista'), found = pair(mage({ level: 20, machines: 0, machinePct: 0.5 }), 'ballista');
  const dmg = q => {
    const m = q.stacks.find(s => s.unit === 'ballista');
    return BA.forecast(q, m, q.stacks[1], 'shot', { c: m.c, r: m.r }).max;
  };
  ok(dmg(high) > dmg(low), 'the ballista grows with the hero');
  ok(dmg(crew) > dmg(high), 'second rank of Машины adds damage');
  ok(dmg(found) > dmg(high), 'the speciality Литейщик adds damage');
  const two = pair(mage({ level: 5, machines: 0, doubleshot: true }), 'ballista'), tm = two.stacks.find(s => s.unit === 'ballista');
  activate(two, tm.id);
  ok(BA.act(two, { type: 'shoot', target: 1 }).filter(e => e.kind === 'shot').length === 2, 'Двойной выстрел');
  const gun = pair(mage({ level: 5, machines: 0, gun: H.HERO.gun }), 'ballista'), gm = gun.stacks.find(s => s.unit === 'ballista');
  activate(gun, gm.id);
  ok(BA.act(gun, { type: 'shoot', target: 1 }).filter(e => e.kind === 'shot').length === 2, 'Порох gives the ballista a second shot');
  const sup = fight(['wagon']), bowman = sup.stacks[0], sh = bowman.shots;
  activate(sup, bowman.id);
  BA.act(sup, { type: 'shoot', target: sup.stacks[2].id });
  ok(bowman.shots === sh, 'with the wagon shooters keep their bolts');
  const none = fight([]), bow2 = none.stacks[0], sh2 = bow2.shots;
  activate(none, bow2.id);
  BA.act(none, { type: 'shoot', target: none.stacks[2].id });
  ok(bow2.shots === sh2 - 1, 'without it they spend them');
  const lost = fight(['wagon']), lw = lost.stacks.find(s => s.unit === 'wagon');
  BA.hurt(lw, 9999);
  ok(!BA.wagonOn(lost, 0), 'a broken wagon helps nobody');
  const heal = pair(mage({ level: 5, machines: 0 }), 'tent'), ht = heal.stacks.find(s => s.unit === 'tent'), hurtStack = heal.stacks[0];
  hurtStack.hp = 1;
  activate(heal, ht.id);
  ok(BA.tendList(heal, ht).includes(hurtStack), 'the tent sees a wounded stack');
  const he = BA.act(heal, { type: 'tend', target: hurtStack.id });
  ok(hurtStack.hp === H.UNITS.militia.hp && hurtStack.count === 30 && he.some(e => e.t === 'heal'), 'the tent treats the top creature only');
  const none2 = pair(mage({ level: 5, machines: 0 }), 'tent'), nt = none2.stacks.find(s => s.unit === 'tent');
  activate(none2, nt.id);
  assert.throws(() => BA.act(none2, { type: 'tend', target: 0 }), /nobody to tend/);
  checks++;
  const medic = BA.create({ seed: 8, obstacles: [], sides: [{ stacks: [{ unit: 'militia', count: 30 }, { unit: 'crossbow', count: 10 }], machines: ['tent'], hero: mage({ level: 5, machines: 0, fieldmedic: true }) }, { stacks: [{ unit: 'plated', count: 60 }] }] }), mt = medic.stacks.find(s => s.unit === 'tent');
  medic.stacks[0].hp = 1;
  medic.stacks[1].hp = 2;
  activate(medic, mt.id);
  ok(BA.act(medic, { type: 'tend', target: 0 }).filter(e => e.t === 'heal').length === 2, 'Полевой лекарь treats two stacks');
  const aiT = pair(mage({ level: 5, machines: 0, mana: 0 }), 'tent'), at = aiT.stacks.find(s => s.unit === 'tent');
  aiT.stacks[0].hp = 1;
  activate(aiT, at.id);
  ok(AI.choose(aiT).type === 'tend', 'the AI uses the tent');
  const aiB = pair(mage({ level: 5, machines: 0, mana: 0 }), 'ballista'), ab = aiB.stacks.find(s => s.unit === 'ballista');
  activate(aiB, ab.id);
  ok(AI.choose(aiB).type === 'shoot', 'the AI uses the ballista');
  const last = fight(['ballista']);
  last.sides[0].hero.mana = 0;
  for (const q of last.stacks) if (q.side === 0 && !H.UNITS[q.unit].machine) {
    q.count = 1;
    q.hp = 1;
  }
  let end = 0;
  while (last.winner < 0 && end++ < 2000) BA.act(last, AI.choose(last));
  ok(last.winner === 1, 'a side with only machines left loses');
  const mp = heroMap('captain'), hero = mp.h, mres = mp.S.players[0].res;
  ok(hero.machines.length === 0 && HE.battleSide(hero, [0]).machines.length === 0, 'a hero starts without machines');
  const gold = mres.gold;
  ok(HE.buyMachine(mp.S, hero, 'ballista') && mres.gold === gold - H.UNITS.ballista.cost && hero.machines[0] === 'ballista', 'a machine costs gold');
  ok(!HE.buyMachine(mp.S, hero, 'ballista'), 'only one of a kind');
  mres.gold = 0;
  ok(!HE.buyMachine(mp.S, hero, 'tent'), 'not without money');
  ok(HE.battleHero(hero).machines === 0, 'without the skill machines run by themselves');
  hero.skills.machines = 2;
  ok(HE.battleHero(hero).machines === 2, 'the skill rank goes into the battle');
}

{
  const rig = more => {
    const S = twoPlayers({}, [{ t: 'town', c: 15, r: 2, owner: 0, faction: 'league', name: 'Дом', built: ['hall1', 'tavern'] }, ...(more || [])]);
    return { S, me: S.heroes[0], foe: S.heroes[1], home: TW.list(S, 0)[0] };
  };
  const a = rig(), side = (a.me.c = a.foe.c - 1, Adv.engage(a.S, a.me, a.foe.id, 'duel'), Adv.battleSetup(a.S));
  ok(side.sides[0].canFlee && side.sides[0].ransomOk && side.sides[0].gold === a.S.players[0].res.gold, 'a hero with a tavern town may flee or pay');
  const B = BA.create(side), mine = B.stacks[0];
  BA.hurt(mine, 10);
  B.active = 0;
  ok(BA.ransomPrice(B, 0) === Math.ceil(mine.count * H.UNITS[mine.unit].cost / 2), 'a ransom is half the price of the army');
  const gold = a.S.players[0].res.gold, price = BA.ransomPrice(B, 0), count = mine.count;
  const fe = BA.act(B, { type: 'ransom' });
  ok(fe.some(e => e.t === 'fled' && e.kind === 'ransom') && B.winner === 1 && B.fled.kind === 'ransom', 'paying ends the battle');
  const done = Adv.battleDone(a.S, B);
  ok(a.S.players[0].res.gold === gold - price, 'the ransom is paid');
  ok(!a.me.alive && a.me.away && a.me.army[0].count === count && done.some(e => e.t === 'withdrew'), 'the hero leaves with the army');
  ok(a.foe.alive && a.foe.xp === 0 + a.foe.xp, 'the winner stays');
  ok(TW.backHeroes(a.S, a.home).length === 0, 'not in the tavern on the same day');
  ok(!a.S.over, 'the game goes on while the player has a town');
  Adv.endDay(a.S);
  ok(TW.backHeroes(a.S, a.home)[0] === a.me, 'a day later the hero waits in the nearest tavern');
  a.S.players[0].res.gold = 1;
  ok(TW.hireBack(a.S, a.home, a.me.id).why === 'Не хватает золота', 'hiring back costs the usual price');
  a.S.players[0].res.gold = 9000;
  const arts = (a.me.arts.right = 'eldersword', a.me.level = 6, 'eldersword');
  const r = TW.hireBack(a.S, a.home, a.me.id);
  ok(r.ok && a.me.alive && !a.me.away && a.S.players[0].res.gold === 9000 - H.TOWN.heroPrice, 'the hero is back for the usual price');
  ok(a.me.level === 6 && a.me.arts.right === arts && a.me.army[0].count === count, 'with the level, the things and the army');
  ok(TW.visitor(a.S, a.home) === a.me || Math.max(Math.abs(a.me.c - MD.entry(a.home)[0]), Math.abs(a.me.r - MD.entry(a.home)[1])) <= 2, 'standing at the gate');
  ok(a.S.returning.length === 0, 'and off the waiting list');

  const b = rig();
  b.me.c = b.foe.c - 1;
  b.me.army[0].count = 5;
  Adv.engage(b.S, b.me, b.foe.id, 'duel');
  const fs = Adv.battleSetup(b.S), FB = BA.create(fs);
  FB.active = 0;
  const left = b.me.arts.right = 'eldersword';
  BA.act(FB, { type: 'flee' });
  ok(FB.winner === 1 && FB.stacks.filter(s => s.side === 0).every(s => s.count === 0), 'fleeing leaves the army to die');
  const xpBefore = b.foe.xp;
  Adv.battleDone(b.S, FB);
  ok(b.foe.xp > xpBefore, 'the winner gets experience for the army left behind');
  ok(!b.me.army.some(Boolean) && b.me.arts.right === left && b.foe.arts.right !== left, 'the hero keeps the things, not the army');
  Adv.endDay(b.S);
  b.S.players[0].res.gold = 9000;
  ok(TW.hireBack(b.S, b.home, b.me.id).ok && b.me.army.some(Boolean), 'hired back with a fresh small army');
  ok(TW.hireBlock(b.S, b.home) === '', 'the tavern goes on working');

  const c = twoPlayers();
  c.heroes[0].c = c.heroes[1].c - 1;
  Adv.engage(c, c.heroes[0], c.heroes[1].id, 'duel');
  const nt = BA.create(Adv.battleSetup(c));
  nt.active = 0;
  ok(!BA.canRetreat(nt, 0, 'flee'), 'without a tavern there is nowhere to flee');
  assert.throws(() => BA.act(nt, { type: 'flee' }), /cannot retreat/);
  checks++;
  const m = rig([{ t: 'monster', c: 8, r: 12, unit: 'shade', count: 10, mood: 'fierce' }]);
  m.me.c = 8;
  m.me.r = 10;
  const mo = m.S.map.objs.find(x => x.t === 'monster');
  Adv.engage(m.S, m.me, mo.id);
  const ms = Adv.battleSetup(m.S);
  ok(ms.sides[0].canFlee && !ms.sides[0].ransomOk, 'neutrals take no ransom, but one can flee');
  const poor = rig();
  poor.me.c = poor.foe.c - 1;
  poor.S.players[0].res.gold = 0;
  Adv.engage(poor.S, poor.me, poor.foe.id, 'duel');
  const pb = BA.create(Adv.battleSetup(poor.S));
  pb.active = 0;
  ok(!BA.canRetreat(pb, 0, 'ransom') && BA.canRetreat(pb, 0, 'flee'), 'no gold, no ransom');

  const t = twoPlayers({}, [{ t: 'town', c: 15, r: 2, owner: 1, faction: 'league', name: 'Цель', built: ['hall1', 'tavern', 'fort1', 'fort2', 'special2', 'dwell1', 'dwell2', 'dwell3'], garrison: [{ unit: 'militia', count: 10 }] }]), town = TW.list(t, 1)[0], gate = MD.entry(town), [ta, tb] = t.heroes;
  tb.c = gate[0];
  tb.r = gate[1];
  ta.c = gate[0] - 1;
  ta.r = gate[1] + 2;
  const tp = Adv.path(t, ta, gate[0], gate[1]);
  ok(tp.kind === 'duel' && tp.target === tb.id, 'a hero at the gate is reached first');
  for (const st of tp.steps) Adv.step(t, ta, st.c, st.r);
  Adv.engage(t, ta, tb.id, 'duel');
  ok(t.pending.kind === 'town' && t.pending.obj === town.id, 'a hero at the gate means a siege of the town');
  const ss = Adv.battleSetup(t);
  ok(ss.siege && ss.siege.fort === 2, 'the fortification sets the siege');
  ok(ss.sides[1].stacks.length === 2 && ss.sides[1].front === 1 && ss.sides[1].hero.name === 'Они', 'the hero and the garrison fight together');
  ok(ss.sides[1].canFlee === undefined, 'a defender of a town does not flee');
  ok(ss.sides[1].morale === 1, 'the bell tower adds morale to defenders');
  const SB = BA.create(ss);
  const rows = SB.stacks.filter(q => q.side === 1 && !H.UNITS[q.unit].machine);
  ok(rows[0].c < rows[1].c && rows.every(q => q.c > H.SIEGE.col), 'the hero stands ahead of the garrison');
  AI.play(SB, 100);
  Adv.battleDone(t, SB);
  ok(town.owner === 0 && !tb.alive && !town.garrison.some(Boolean), 'winning takes the town and kills the hero');
  ok(t.over && t.over.winner === 0, 'the last hero and town: the game is won');
  const w = twoPlayers({}, [{ t: 'town', c: 15, r: 2, owner: 1, faction: 'barrows', name: 'Степь', built: ['hall1', 'fort1', 'special2'], garrison: [{ unit: 'shade', count: 300 }] }]), wt = TW.list(w, 1)[0], [wa] = w.heroes, wg = MD.entry(wt);
  wa.c = wg[0];
  wa.r = wg[1] + 1;
  wa.army[0] = { unit: 'crossbow', count: 30, stars: 0, vet: 0 };
  Adv.step(w, wa, wg[0], wg[1]);
  const ws = Adv.battleSetup(w);
  ok(ws.sides[1].stacks.every(q => q.guard === 3), 'the ancestor stone adds Стойкость to the garrison');
  const wb = BA.create(ws);
  ok(wb.stacks.find(q => q.side === 1).defPlus === 3, 'and the battle reads it');
  AI.play(wb, 100);
  Adv.battleDone(w, wb);
  ok(wt.owner === 1 && wt.garrison[0].count < 300 && !wa.alive, 'a lost siege keeps the town and hurts the garrison');
  const nw = twoPlayers({}, [{ t: 'town', c: 15, r: 2, owner: 1, faction: 'barrows', name: 'Голая', built: ['hall1'], garrison: [{ unit: 'shade', count: 3 }] }]), nt2 = TW.list(nw, 1)[0], ng = MD.entry(nt2);
  nw.heroes[0].c = ng[0];
  nw.heroes[0].r = ng[1] + 1;
  Adv.step(nw, nw.heroes[0], ng[0], ng[1]);
  ok(Adv.battleSetup(nw).siege === null, 'without a palisade the battle is in the field');
  const mk = twoPlayers();
  mk.heroes[0].c = mk.heroes[1].c - 1;
  mk.heroes[0].machines = ['ballista', 'tent'];
  Adv.engage(mk, mk.heroes[0], mk.heroes[1].id, 'duel');
  const mB = BA.create(Adv.battleSetup(mk)), mt = mB.stacks.find(q => q.unit === 'tent');
  mB.stacks.find(q => q.unit === 'ballista').count = 0;
  while (mB.winner < 0) BA.act(mB, AI.choose(mB));
  const mev = Adv.battleDone(mk, mB);
  ok(mk.heroes[0].machines.join() === (mt.count > 0 ? 'tent' : '') && mev.some(e => e.t === 'machineLost' && e.unit === 'ballista'), 'a broken machine is gone after the battle');
}

{
  const net = () => {
    const S = twoPlayers({}, [
      { t: 'town', c: 2, r: 2, owner: 0, faction: 'league', name: 'Станция', built: ['hall1', 'tavern', 'market', 'caravan'] },
      { t: 'town', c: 22, r: 12, owner: 0, faction: 'league', name: 'Дальний', built: ['hall1', 'tavern', 'dwell1', 'dwell2'] }
    ]);
    S.heroes[0].c = 5;
    S.heroes[0].r = 16;
    S.heroes[1].c = 28;
    S.heroes[1].r = 2;
    const [to, from] = TW.list(S, 0);
    return { S, to, from };
  };
  const { S, to, from } = net(), rows = TW.caravanRows(S, from);
  ok(rows.length === 2 && rows[0].unit === 'militia' && rows[0].n === from.pool[0], 'a caravan loads what the other town can hire');
  ok(TW.caravanSources(S, to).includes(from) && !TW.caravanSources(S, to).includes(to), 'it comes from another own town');
  const value = rows.reduce((t, r) => t + r.n * H.UNITS[r.unit].cost, 0), cost = TW.caravanCost(to, rows);
  ok(cost.gold === value + Math.ceil(value * H.TOWN.caravanFee * H.FACTIONS.league.caravanMul), 'the League pays half the fee');
  const barrowsTown = net();
  barrowsTown.to.faction = 'barrows';
  ok(TW.caravanCost(barrowsTown.to, rows).gold === value + Math.ceil(value * H.TOWN.caravanFee), 'others pay the whole fee');
  const pool = from.pool[0], gold = S.players[0].res.gold;
  const none = net();
  none.to.built = none.to.built.filter(id => id !== 'caravan');
  ok(TW.caravanWhy(none.S, none.from, none.to, rows) === 'В городе нет Обозной станции', 'a station is needed');
  ok(TW.sendCaravan(S, from, to, rows).ok, 'the caravan leaves');
  ok(S.players[0].res.gold === gold - cost.gold && from.pool[0] === 0, 'the creatures and the fee are paid at once');
  ok(TW.caravanRows(S, from).length === 0, 'the dwelling is empty');
  const v = S.caravans[0];
  ok(v.owner === 0 && v.to === to.id && v.stacks[0].unit === 'militia' && v.stacks[0].count === pool, 'the caravan carries the stacks');
  const start = [v.c, v.r], block = Adv.path(S, S.heroes[0], v.c, v.r);
  ok(block === null, 'own heroes do not attack their caravan');
  Adv.endDay(S);
  const moved = Math.hypot(v.c - start[0], v.r - start[1]);
  ok(moved > 8 && moved <= H.MAP.caravanSteps + 0.01, 'it walks about 14 steps a day (' + moved.toFixed(1) + ')');
  for (let i = 0; i < 6 && S.caravans.length; i++) Adv.endDay(S);
  ok(!S.caravans.length && to.garrison[0] && to.garrison[0].count === pool, 'it arrives into the garrison');
  const corridor = () => {
    const q = net();
    MD.paint(q.S.map, 0, 'rock', (c, r) => c === 12 && r !== 8);
    TW.sendCaravan(q.S, q.from, q.to, TW.caravanRows(q.S, q.from));
    return { ...q, v: q.S.caravans[0] };
  };
  const stop = corridor(), mh = stop.S.heroes[1];
  mh.c = 12;
  mh.r = 8;
  for (let i = 0; i < 3; i++) Adv.endDay(stop.S);
  ok(stop.v.c > 12 && stop.S.caravans.length === 1, 'a hero on the way stops the caravan (' + stop.v.c + ', ' + stop.v.r + ')');
  mh.c = 28;
  mh.r = 2;
  Adv.endDay(stop.S);
  ok(stop.v.c < 12 || !stop.S.caravans.length, 'when the way is free it goes on');
  const guard = corridor();
  MD.add(guard.S.map, { t: 'monster', c: 10, r: 8, owner: -1, l: 0, unit: 'wolves', count: 5, mood: 'hostile' });
  for (let i = 0; i < 3; i++) Adv.endDay(guard.S);
  ok(guard.v.c >= 12 && !Adv.grid(guard.S, 0).guard[MD.idx(guard.S.map, guard.v.c, guard.v.r)], 'a neutral guard stops the caravan before its ring (' + guard.v.c + ')');
  const gone = guard.S.map.objs.find(o => o.t === 'monster');
  Adv.remove(guard.S, gone);
  for (let i = 0; i < 2; i++) Adv.endDay(guard.S);
  ok(guard.v.c < 12 || !guard.S.caravans.length, 'and it goes on when the guard is gone');
  const shut = net();
  MD.paint(shut.S.map, 0, 'rock', (c, r) => c === 12 && r !== 8);
  MD.add(shut.S.map, { t: 'monster', c: 10, r: 8, owner: -1, l: 0, unit: 'wolves', count: 5, mood: 'hostile' });
  const shutRows = TW.caravanRows(shut.S, shut.from);
  ok(TW.caravanWhy(shut.S, shut.from, shut.to, shutRows) === 'Дорогу держит охрана' && !TW.sendCaravan(shut.S, shut.from, shut.to, shutRows).ok, 'no caravan leaves while a guard holds the only way');
  const roundabout = net();
  MD.add(roundabout.S.map, { t: 'monster', c: 12, r: 8, owner: -1, l: 0, unit: 'wolves', count: 5, mood: 'hostile' });
  const aroundRows = TW.caravanRows(roundabout.S, roundabout.from);
  ok(TW.sendCaravan(roundabout.S, roundabout.from, roundabout.to, aroundRows).ok, 'a guard that can be walked around does not stop a caravan');
  for (let i = 0; i < 8 && roundabout.S.caravans.length; i++) Adv.endDay(roundabout.S);
  ok(!roundabout.S.caravans.length, 'the caravan walks around the guard and arrives');
  const gateFree = net();
  TW.sendCaravan(gateFree.S, gateFree.from, gateFree.to, TW.caravanRows(gateFree.S, gateFree.from));
  const fg = MD.entry(gateFree.from), fv = gateFree.S.caravans[0];
  ok(fv.c !== fg[0] || fv.r !== fg[1], 'a caravan leaves the gate cell free');
  ok(TW.spot(gateFree.S, gateFree.from).join() === fg.join(), 'so a new hero still appears at the gate');
  const held = net();
  TW.sendCaravan(held.S, held.from, held.to, TW.caravanRows(held.S, held.from));
  const hv = held.S.caravans[0];
  held.to.owner = 1;
  Adv.endDay(held.S);
  ok(hv.to === held.from.id, 'if the target town falls the caravan turns to another own town');
  const raid = net();
  TW.sendCaravan(raid.S, raid.from, raid.to, TW.caravanRows(raid.S, raid.from));
  const rv = raid.S.caravans[0], thief = raid.S.heroes[1];
  raid.S.turn = 1;
  thief.c = rv.c + 2;
  thief.r = rv.r;
  thief.army[0] = { unit: 'plated', count: 30, stars: 0, vet: 0 };
  const rp = Adv.path(raid.S, thief, rv.c, rv.r);
  ok(rp.kind === 'caravan' && rp.target === rv.id, 'a stranger can attack the caravan');
  for (const st of rp.steps) Adv.step(raid.S, thief, st.c, st.r);
  Adv.engage(raid.S, thief, rv.id, 'caravan');
  ok(raid.S.pending.kind === 'caravan', 'the battle is asked for');
  const rs = Adv.battleSetup(raid.S);
  ok(rs.sides[1].stacks.length === 2 && !rs.sides[1].hero, 'a caravan fights without a hero');
  const rb = BA.create(rs);
  AI.play(rb, 100);
  const rev = Adv.battleDone(raid.S, rb);
  ok(!raid.S.caravans.length && rev.some(e => e.t === 'caravanTaken'), 'the caravan is gone');
  ok(thief.army.some(s => s && s.unit === 'militia'), 'the winner takes the creatures that have room');
  ok(Adv.caravanAt(raid.S, 0, rv.c, rv.r) === null, 'its cell is free');
  const walk = net();
  TW.sendCaravan(walk.S, walk.from, walk.to, TW.caravanRows(walk.S, walk.from));
  const wv = walk.S.caravans[0], wg = Adv.grid(walk.S, 0);
  ok(walk.S.heroes[0].c !== wv.c, 'the test hero stands elsewhere');
  walk.S.heroes[0].c = wv.c - 1;
  walk.S.heroes[0].r = wv.r;
  const before = Adv.step(walk.S, walk.S.heroes[0], wv.c, wv.r);
  ok(!before.ok && wg.block.length > 0, 'nobody walks through a caravan');
  ok(H.Save.hash(H.Save.unpack(H.Save.pack(walk.S))) === H.Save.hash(walk.S), 'caravans are in the save');
}

{
  const old = JSON.parse(H.Save.pack(twoPlayers()));
  old.v = 1;
  delete old.S.caravans;
  delete old.S.returning;
  delete old.S.nextCaravan;
  for (const h of old.S.heroes) delete h.machines;
  const moved = H.Save.unpack(JSON.stringify(old));
  ok(moved.caravans.length === 0 && moved.returning.length === 0 && moved.nextCaravan === 1 && moved.heroes.every(h => h.machines.length === 0), 'a save of the stage 7 version gets caravans and machines');
  Adv.endDay(moved);
  ok(moved.day === 2, 'and goes on');
  const fight = twoPlayers(), [fa, fb] = fight.heroes;
  fa.machines = ['ballista'];
  fa.c = fb.c - 1;
  Adv.engage(fight, fa, fb.id, 'duel');
  const setup = Adv.battleSetup(fight), B = BA.create(setup);
  fight.battle = { B, name: setup.name, player: setup.player, seed: setup.seed };
  const copy = H.Save.unpack(H.Save.pack(fight));
  ok(H.Save.hash(copy) === H.Save.hash(fight), 'a battle with machines saves with the same hash');
  const siege = BA.create({ seed: 6, siege: { fort: 3, dmg: 30 }, sides: [{ stacks: [{ unit: 'plated', count: 10 }] }, { stacks: [{ unit: 'shade', count: 10 }] }] });
  ok(JSON.stringify(JSON.parse(JSON.stringify(siege))) === JSON.stringify(siege), 'a siege is plain data');
}

{
  const play = (seed, days) => {
    const def = H.Maps.build('ford', { seed, slots: [{ faction: 'league' }, { faction: 'barrows' }] }), S = Adv.create(def.map, def.setup);
    let sieges = 0;
    const real = BA.create;
    BA.create = o => {
      if (o.siege) sieges++;
      return real(o);
    };
    while (!S.over && S.day <= days) {
      H.AI.turn(S);
      Adv.endTurn(S);
    }
    BA.create = real;
    return { S, sieges };
  };
  let total = 0;
  for (let seed = 60; seed < 64; seed++) total += play(seed, 80).sieges;
  ok(total > 0, 'the AI besieges towns (' + total + ' sieges in 4 games)');
  const c = twoPlayers({}, [
    { t: 'town', c: 2, r: 2, owner: 1, faction: 'barrows', name: 'Станция', built: ['hall1', 'tavern', 'market', 'caravan'] },
    { t: 'town', c: 22, r: 12, owner: 1, faction: 'barrows', name: 'Дальний', built: ['hall1', 'tavern', 'dwell1', 'dwell2'] }
  ]);
  c.heroes[0].c = 28;
  c.heroes[0].r = 18;
  c.heroes[1].c = 7;
  c.heroes[1].r = 6;
  c.turn = 1;
  const T = H.AI.begin(c, 1);
  for (let i = 0; i < 400; i++) if (H.AI.step(c, T).done) break;
  ok(c.caravans.length > 0, 'the AI sends caravans to the town near its main hero');
  const strong = twoPlayers();
  strong.heroes[0].army[0] = { unit: 'plated', count: 40, stars: 0, vet: 0 };
  strong.heroes[1].army[0] = { unit: 'militia', count: 2, stars: 0, vet: 0 };
  const BB = BA.create({ seed: 3, obstacles: [], sides: [Object.assign(HE.battleSide(strong.heroes[1], [0]), { canFlee: true, aiFlees: true, gold: 0 }), HE.battleSide(strong.heroes[0], [0])] });
  BB.round = 3;
  BB.active = 0;
  ok(AI.choose(BB).type === 'flee', 'an AI hero who is losing badly flees');
  BB.sides[0].aiFlees = false;
  ok(AI.choose(BB).type !== 'flee', 'a quick battle never flees for the human');
}

(async () => {
  const S = plain(10, 10, [3, 3]);
  const text = H.Save.pack(S), bytes = await H.Save.gzip(text);
  ok(bytes.length > 0 && bytes.length < text.length && bytes[0] === 0x1f && bytes[1] === 0x8b, 'saves are compressed with gzip');
  ok(await H.Save.gunzip(bytes) === text, 'and unpack back to the same text');
  const def = H.Maps.build('mesha', { seed: 8, slots: [{ faction: 'league', human: true }, { faction: 'barrows' }, { faction: 'barrows' }, { faction: 'league' }] }), G = Adv.create(def.map, def.setup);
  for (let i = 0; i < 20; i++) {
    if (!G.over && G.turn !== 0) H.AI.turn(G);
    Adv.endTurn(G);
  }
  const meta = await H.Save.write('m3', G, 'data:mini');
  ok(meta.id === 'm3' && meta.map === 'Соляная межа' && meta.day === G.day && meta.mini === 'data:mini' && meta.faction === 'league', 'the slot keeps the map, the day, the people and the picture');
  ok(H.Save.hash(await H.Save.read('m3')) === H.Save.hash(G), 'a slot gives back the same game');
  ok((await H.Save.read('m9')) === null, 'an empty slot gives nothing');
  const size = (await H.Save.gzip(H.Save.pack(G))).length;
  ok(size < H.Save.MAX_BYTES, 'a game on the medium map fits the slot (' + Math.round(size / 1024) + ' KB)');
  await H.Save.write('q', G);
  const list = await H.Save.list();
  ok(list.length === 2 && list[0].when >= list[1].when, 'the newest save comes first');
  ok((await H.Save.latest()).id === list[0].id, 'Continue takes the newest');
  await H.Save.remove('q');
  ok((await H.Save.list()).length === 1, 'a slot can be cleared');
  {
  const HE9 = H.Hero, TW9 = H.Town, BA9 = H.Battle, BAI9 = H.BattleAI;
  const site = (o, army, extra) => {
    const S = plain(24, 16, [3, 3], army || [{ unit: 'militia', count: 200 }], [Object.assign({ owner: -1, l: 0 }, o)]);
    S.players[0].res.gold = 50000;
    Object.assign(S.players[0].res, { wood: 50, ore: 50, salt: 20, amber: 20, sulfur: 20, moonsilver: 20 });
    Object.assign(S, extra || {});
    return { S, h: S.heroes[0], o: S.map.objs[0] };
  };
  const toEntry = (q) => {
    const e = MD.entry(q.o), p = Adv.path(q.S, q.h, e[0], e[1]), ev = [];
    for (const s of p.steps) ev.push(...Adv.step(q.S, q.h, s.c, s.r).ev);
    return ev;
  };
  const pick = (q, id) => Adv.resolve(q.S, id);

  for (const [id, def] of Object.entries(H.OBJ)) {
    ok(Array.isArray(def.foot) && def.foot[0] >= 1 && def.foot[1] >= 1 && def.name && def.kind, id + ' has a name, a kind and a footprint');
    if (def.kind === 'decor' || def.kind === 'monster') continue;
    ok(!!def.entry && def.entry[0] < def.foot[0] && def.entry[1] < def.foot[1], id + ' has an entrance inside its footprint');
    ok(typeof H.OBJ_VISIT[def.kind] === 'function' || def.kind === 'town', id + ' has a visit rule');
    const art = id.startsWith('dwell-') ? 'dwelling/' + def.unit : 'object/' + id;
    if (id !== 'artifact' && id !== 'town') ok(H.Art.all().some(e => e.id === art), id + ' has a picture entry ' + art);
    const look = H.Art.OBJECTS.find(e => e.id === 'object/' + id);
    if (look) ok(look.foot.join() === def.foot.join(), id + ' footprint matches the picture entry');
  }
  const neutrals = Object.entries(H.UNITS).filter(([, u]) => u.faction === 'neutral');
  ok(neutrals.length === 23, '23 neutrals in battle data');
  for (const [id, u] of neutrals) {
    const band = H.TIERS[u.tier];
    ok(u.hp >= band.hp[0] && u.hp <= band.hp[1] && u.cost >= band.cost[0] && u.cost <= band.cost[1] && u.speed >= band.speed[0] && u.speed <= band.speed[1], id + ' stays inside its tier band');
    ok(!!H.OBJ['dwell-' + id], id + ' has a dwelling on the map');
  }
  const bases = Object.values(H.FACTIONS).flatMap(f => f.units.map(r => r[0]));
  ok(bases.every(id => !!H.OBJ['dwell-' + id]), 'every base creature of a people has a dwelling on the map');

  const duel = (a, b, ext) => BA9.create(Object.assign({ seed: 11, obstacles: [], sides: [{ stacks: a }, { stacks: b }] }, ext || {}));
  const act = (B, a) => BA9.act(B, a);
  const hitBy = (ev, kind) => ev.filter(e => e.t === 'hit' && e.kind === kind);
  const beside = (B, s, t) => BA9.spots(B, s, t)[0];

  const bees = duel([{ unit: 'bees', count: 30, c: 5, r: 5 }], [{ unit: 'militia', count: 50, c: 6, r: 5 }], { ready: [100, 0] });
  ok(!hitBy(act(bees, { type: 'attack', target: 1, c: 5, r: 5 }), 'retal').length, 'неуловимые: the target does not answer');
  const bandit = BA9.create({ seed: 4, obstacles: [], ready: [10, 10], sides: [{ stacks: [{ unit: 'bandits', count: 10, c: 1, r: 1 }] }, { stacks: [{ unit: 'militia', count: 10, c: 12, r: 1 }] }] });
  ok(bandit.stacks[0].ready > bandit.stacks[1].ready || bandit.active === 0, 'Разбойники: засада даёт готовность в первом раунде');
  const packAlone = duel([{ unit: 'wolves', count: 10, c: 5, r: 5 }], [{ unit: 'plated', count: 5, c: 6, r: 5 }], { ready: [100, 0] });
  const packTwo = duel([{ unit: 'wolves', count: 10, c: 5, r: 5 }, { unit: 'wolves', count: 10, c: 6, r: 4 }], [{ unit: 'plated', count: 5, c: 6, r: 5 }], { ready: [100, 0, 0] });
  const alone = BA9.forecast(packAlone, packAlone.stacks[0], packAlone.stacks[1], 'melee'), two = BA9.forecast(packTwo, packTwo.stacks[0], packTwo.stacks[2], 'melee');
  ok(two.max > alone.max, 'Стая: a neighbouring wolf stack adds damage');
  const boar = duel([{ unit: 'boars', count: 10, c: 5, r: 5 }], [{ unit: 'plated', count: 5, c: 6, r: 5 }], { ready: [100, 0] });
  const first = BA9.forecast(boar, boar.stacks[0], boar.stacks[1], 'melee');
  boar.stacks[0].dealt = true;
  ok(first.max > BA9.forecast(boar, boar.stacks[0], boar.stacks[1], 'melee').max, 'Вепри: the first strike is stronger');
  const bear = duel([{ unit: 'bears', count: 10, c: 5, r: 5 }], [{ unit: 'plated', count: 20, c: 6, r: 5 }], { ready: [100, 0] });
  act(bear, { type: 'attack', target: 1, c: 5, r: 5 });
  ok(BA9.fxHas(bear.stacks[1], 'noMove') && BA9.reach(bear, bear.stacks[1]).size === 1, 'Объятие: the target cannot walk away');
  const scorp = duel([{ unit: 'scorpions', count: 10, c: 5, r: 5 }], [{ unit: 'plated', count: 20, c: 6, r: 5 }], { ready: [100, 0] });
  act(scorp, { type: 'attack', target: 1, c: 5, r: 5 });
  ok(BA9.fxs(scorp.stacks[1], 'poison') > 0, 'Яд: the sting leaves poison');
  const scorpShade = duel([{ unit: 'scorpions', count: 10, c: 5, r: 5 }], [{ unit: 'shade', count: 200, c: 6, r: 5 }], { ready: [100, 0] });
  act(scorpShade, { type: 'attack', target: 1, c: 5, r: 5 });
  ok(!BA9.fxs(scorpShade.stacks[1], 'poison'), 'spirits take no poison from a sting');
  const pir = (deck) => {
    const B = duel([{ unit: 'pirates', count: 10, c: 5, r: 5 }], [{ unit: 'plated', count: 20, c: 8, r: 5 }], { ready: [100, 0], deck });
    return BA9.forecast(B, B.stacks[0], B.stacks[1], 'melee', { c: 5, r: 5, flown: 0 }).max;
  };
  ok(pir(true) > pir(false), 'Пираты: +25 % on the water');
  const hunter = duel([{ unit: 'bountyhunters', count: 10, c: 2, r: 5 }, { unit: 'militia', count: 10, c: 2, r: 3 }], [{ unit: 'plated', count: 20, c: 9, r: 5 }], { ready: [100, 90, 0] });
  const before = BA9.forecast(hunter, hunter.stacks[1], hunter.stacks[2], 'melee', { c: 8, r: 5, flown: 0 }).max;
  act(hunter, { type: 'shoot', target: 2 });
  ok(BA9.forecast(hunter, hunter.stacks[1], hunter.stacks[2], 'melee', { c: 8, r: 5, flown: 0 }).max > before, 'Метка: others hit the marked target harder');
  const hermit = duel([{ unit: 'hermits', count: 10, c: 2, r: 5 }], [{ unit: 'plated', count: 20, c: 9, r: 5 }], { ready: [100, 0] });
  const charmEv = act(hermit, { type: 'charm', target: 1 });
  ok(charmEv.some(e => e.t === 'cast') && H.SPELLS[charmEv.find(e => e.t === 'cast').spell].circle === 2 && !BA9.canCharm(hermit.stacks[0]), 'Отшельники: one spell of the second circle per battle');
  const white = duel([{ unit: 'whitespirit', count: 10, c: 5, r: 5 }, { unit: 'militia', count: 10, c: 5, r: 4 }], [{ unit: 'plated', count: 2, c: 12, r: 5 }], { ready: [0, 0, 0] });
  white.stacks[1].hp = 1;
  const healed = [];
  for (const stop = white.round + 1; white.round < stop;) healed.push(...act(white, { type: 'defend' }));
  ok(white.stacks[1].hp > 1 || healed.some(e => e.t === 'heal' && e.id === 1), 'Белый дух heals its neighbours');
  const red = duel([{ unit: 'militia', count: 50, c: 5, r: 5 }], [{ unit: 'redspirit', count: 10, c: 6, r: 5 }], { ready: [100, 0] });
  ok(hitBy(act(red, { type: 'attack', target: 1, c: 5, r: 5 }), 'thorn').length === 1, 'Огненная кожа: a melee hit burns the attacker');
  const azure = duel([{ unit: 'azurespirit', count: 10, c: 5, r: 5 }], [{ unit: 'plated', count: 20, c: 6, r: 5 }], { ready: [100, 0] });
  const initBefore = BA9.initOf(azure.stacks[1]);
  act(azure, { type: 'attack', target: 1, c: 5, r: 5 });
  ok(BA9.initOf(azure.stacks[1]) < initBefore, 'Лазурный дух slows the target');
  const green = duel([{ unit: 'greenspirit', count: 10, c: 5, r: 5 }], [{ unit: 'plated', count: 1, c: 12, r: 5 }], { ready: [0, 0] });
  BA9.hurt(green.stacks[0], 100);
  const greenLeft = BA9.total(green.stacks[0]);
  for (const stop = green.round + 1; green.round < stop;) act(green, { type: 'defend' });
  ok(BA9.total(green.stacks[0]) > greenLeft, 'Зелёный дух restores itself');
  let misses = 0;
  for (let i = 0; i < 40; i++) {
    const B = BA9.create({ seed: 100 + i, obstacles: [], ready: [100, 0], sides: [{ stacks: [{ unit: 'militia', count: 10, c: 5, r: 5 }] }, { stacks: [{ unit: 'silverspirit', count: 5, c: 6, r: 5 }] }] });
    if (act(B, { type: 'attack', target: 1, c: 5, r: 5 }).some(e => e.t === 'miss' && e.blink)) misses++;
  }
  ok(misses >= 3 && misses <= 20, 'Мерцание: about a quarter of the hits miss (' + misses + '/40)');
  const gold = duel([{ unit: 'goldspirit', count: 5, c: 5, r: 5 }, { unit: 'militia', count: 10, c: 5, r: 4 }], [{ unit: 'plated', count: 1, c: 12, r: 5 }], { ready: [0, 0, 0] });
  const gr = gold.stacks[1];
  gr.ready = 0;
  const round2 = [];
  for (const stop = gold.round + 1; gold.round < stop && gold.winner < 0;) round2.push(...act(gold, { type: 'defend' }));
  ok(gr.ready >= 20 || round2.some(e => e.t === 'turn' && e.id === 1), 'Золотой дух gives neighbours readiness');
  const black = duel([{ unit: 'blackspirit', count: 10, c: 5, r: 5 }], [{ unit: 'militia', count: 100, c: 6, r: 5 }], { ready: [100, 0] });
  BA9.hurt(black.stacks[0], 300);
  const blackLeft = BA9.total(black.stacks[0]);
  black.stacks[1].retaliated = true;
  act(black, { type: 'attack', target: 1, c: 5, r: 5 });
  ok(BA9.total(black.stacks[0]) > blackLeft, 'Чёрный дух drinks from its damage');
  const serp = duel([{ unit: 'seaserpent', count: 5, c: 5, r: 5 }], [{ unit: 'plated', count: 20, c: 6, r: 5 }], { ready: [100, 0] });
  act(serp, { type: 'attack', target: 1, c: 5, r: 5 });
  ok(BA9.fxHas(serp.stacks[1], 'skip'), 'Обвить: the target loses a turn');
  const dream = duel([{ unit: 'moondream', count: 5, c: 5, r: 5 }], [{ unit: 'plated', count: 20, c: 6, r: 5 }], { ready: [100, 50] });
  ok(BA9.resists(dream.stacks[0], H.SPELLS.spark) && BA9.resists(dream.stacks[0], H.SPELLS.balm), 'Сны Восьмой луны: spells do not touch them');
  const lizard = duel([{ unit: 'ancientlizard', count: 1, c: 4, r: 4 }], [{ unit: 'plated', count: 2, c: 6, r: 4 }, { unit: 'militia', count: 30, c: 7, r: 4 }], { ready: [100, 0, 0] });
  ok(hitBy(act(lizard, { type: 'attack', target: 1, c: 5, r: 4 }), 'flame').length >= 1, 'Древний ящер: flame reaches behind the target');

  const deck = duel([{ unit: 'militia', count: 10 }, { unit: 'shade', count: 10 }], [{ unit: 'plated', count: 2 }], { deck: true, seed: 3 });
  ok(deck.deck && deck.obstacles.length === BT.rows * BT.deckGap.length, 'a water battle opens a gap across the field');
  ok(![...BA9.reach(deck, deck.stacks[0]).values()].some(p => p.c > BT.deckGap[1]), 'a walker cannot cross the gap');
  const flier = duel([{ unit: 'shade', count: 10, c: 5, r: 5 }], [{ unit: 'plated', count: 2, c: 8, r: 5 }], { deck: true, seed: 3 });
  ok([...BA9.reach(flier, flier.stacks[0]).values()].some(p => p.c > BT.deckGap[1]), 'a flier crosses the gap');
  const plank = duel([{ unit: 'militia', count: 30 }], [{ unit: 'militia', count: 30 }], { deck: true, seed: 8 });
  const plankEv = [];
  while (plank.round < BT.deckPlanks) plankEv.push(...act(plank, { type: 'defend' }));
  ok(plankEv.some(e => e.t === 'planks') && plank.obstacles.every(p => !BT.plankRows.includes(p[1])), 'planks open the gap from the third round');
  const sailors = duel([{ unit: 'militia', count: 30 }, { unit: 'crossbow', count: 5 }], [{ unit: 'militia', count: 30 }], { deck: true, seed: 8 });
  ok(BAI9.play(sailors, 60) >= 0, 'walkers finish a water battle over the planks');

  const hero9 = { mana: 50, spells: ['spark'], power: 4, ranks: { zhar: 1 }, perks: [], sorcery: 0, specSpell: null };
  const place9 = field => BA9.create({ seed: 5, obstacles: [], field, ready: [100, 0], sides: [{ hero: hero9, stacks: [{ unit: 'crossbow', count: 10, c: 2, r: 5 }] }, { stacks: [{ unit: 'plated', count: 5, c: 8, r: 5 }] }] });
  ok(BA9.schoolRank(place9('moonglade'), hero9, H.SPELLS.spark) === 2 && BA9.schoolRank(place9(null), hero9, H.SPELLS.spark) === 1, 'Лунная поляна: spells a rank higher');
  ok(!!BA9.castBlock(place9('moonless'), 'spark'), 'Пустошь без луны: no casting');
  ok(BA9.spellCost(place9('holyground'), hero9, H.SPELLS.firearrow) === BA9.spellCost(place9(null), hero9, H.SPELLS.firearrow) - 2, 'Святая земля: spells cost 2 mana less');
  const fogA = place9('foglow'), fogB = place9(null);
  ok(BA9.forecast(fogA, fogA.stacks[0], fogA.stacks[1], 'shot').max < BA9.forecast(fogB, fogB.stacks[0], fogB.stacks[1], 'shot').max, 'Туманная низина: shooters are weaker');
  const saltA = BA9.create({ seed: 5, obstacles: [], field: 'saltcrust', sides: [{ stacks: [{ unit: 'shade', count: 5, c: 2, r: 5 }] }, { stacks: [{ unit: 'militia', count: 5, c: 8, r: 5 }] }] });
  ok(BA9.moraleOf(saltA, saltA.stacks[0]) === 1 && BA9.moraleOf(saltA, saltA.stacks[1]) === 0, 'Солёная корка: morale for the steppe only');

  const loot = site({ t: 'wagon', c: 6, r: 3, pick: 1 });
  const g0 = loot.S.players[0].res.gold;
  toEntry(loot);
  ok(loot.S.players[0].res.gold === g0 + 750 && loot.o.gone, 'брошенная повозка pays and disappears');
  const way = site({ t: 'traveler', c: 6, r: 3 });
  const bagBefore = Object.values(way.h.arts).filter(Boolean).length + way.h.bag.length;
  toEntry(way);
  ok(Object.values(way.h.arts).filter(Boolean).length + way.h.bag.length === bagBefore + 1 && way.o.gone, 'вещи путника give an artifact');
  const shard = site({ t: 'moonshard', c: 6, r: 3, amount: 2 });
  const silver = shard.S.players[0].res.moonsilver;
  toEntry(shard);
  ok(shard.S.players[0].res.moonsilver === silver + 2, 'лунный осколок gives silver');
  const old = site({ t: 'oldmine', c: 6, r: 3 });
  toEntry(old);
  const oldRes = H.mineRes(old.o);
  ok(old.o.owner === 0 && !!oldRes, 'заброшенная шахта opens on a random resource');
  const oldBefore = old.S.players[0].res[oldRes];
  Adv.endDay(old.S);
  ok(old.S.players[0].res[oldRes] === oldBefore + H.MAP.mineIncome[oldRes], 'it brings income every day');

  const mill = site({ t: 'watermill', c: 6, r: 3 });
  const g1 = mill.S.players[0].res.gold;
  const millEv = toEntry(mill);
  ok(mill.S.players[0].res.gold === g1 + 1000 && !mill.o.gone && millEv.some(e => e.t === 'gain'), 'водяная мельница pays');
  const g2 = mill.S.players[0].res.gold;
  const millAgain = H.OBJ_VISIT.weekly;
  const again = [];
  millAgain(mill.S, mill.h, mill.o, again);
  ok(mill.S.players[0].res.gold === g2 && again.some(e => e.t === 'note'), 'only once a week');
  for (let i = 0; i < 7; i++) Adv.endDay(mill.S);
  const again2 = [];
  millAgain(mill.S, mill.h, mill.o, again2);
  ok(mill.S.players[0].res.gold > g2, 'and again the next week');
  const hive = site({ t: 'apiary', c: 6, r: 3 });
  toEntry(hive);
  ok(hive.h.fresh.morale === 1 && HE9.morale(hive.h) >= 1, 'пасека: morale until the next battle');
  const welly = site({ t: 'well', c: 6, r: 3 });
  welly.h.mana = 0;
  toEntry(welly);
  ok(welly.h.mana === HE9.maxMana(welly.h), 'колодец restores mana');
  const horse = site({ t: 'stable', c: 6, r: 3 });
  const full = Adv.daySteps(horse.S, horse.h);
  toEntry(horse);
  ok(Adv.daySteps(horse.S, horse.h) === full + 3, 'конюшня adds steps');
  for (let i = 0; i < 7; i++) Adv.endDay(horse.S);
  ok(Adv.daySteps(horse.S, horse.h) === full, 'until the end of the week');
  const grot = site({ t: 'crystalgrotto', c: 6, r: 3 });
  const gs = grot.S.players[0].res.moonsilver;
  toEntry(grot);
  ok(grot.S.players[0].res.moonsilver === gs + 1, 'кристальный грот gives silver');
  const wind = site({ t: 'windmill', c: 6, r: 3 });
  const windEv = toEntry(wind);
  ok(windEv.some(e => e.t === 'gain' && Object.keys(e.res).length === 1), 'ветряная мельница gives a resource');

  for (const [id, stat] of [['atkstone', 'atk'], ['ancestorshield', 'def'], ['charmspring', 'power'], ['sagescroll', 'wis']]) {
    const q = site({ t: id, c: 6, r: 3 }), v = q.h[stat];
    toEntry(q);
    ok(q.h[stat] === v + 1, id + ' raises ' + stat);
    H.OBJ_VISIT.growth(q.S, q.h, q.o, []);
    ok(q.h[stat] === v + 1, id + ' works once for a hero');
  }
  const camp = site({ t: 'camp', c: 6, r: 3 });
  toEntry(camp);
  ok(camp.h.xp >= 1000, 'учебный лагерь gives experience');
  const arena = site({ t: 'arena', c: 6, r: 3 });
  toEntry(arena);
  ok(arena.S.pending.kind === 'choice' && arena.S.pending.options.length === 3, 'арена asks what to train');
  const atk = arena.h.atk;
  pick(arena, 'atk');
  ok(arena.h.atk === atk + 2 && H.Sites.seen(arena.o, arena.h.id), 'арена adds 2 once');
  const tree = site({ t: 'knowledgetree', c: 6, r: 3 });
  toEntry(tree);
  const treeG = tree.S.players[0].res.gold;
  pick(tree, 'pay');
  ok(HE9.levelFor(tree.h.xp) === 2 && tree.S.players[0].res.gold < treeG, 'древо познания sells a level');
  const witch = site({ t: 'witchhut', c: 6, r: 3, skill: 'march' });
  toEntry(witch);
  ok(witch.h.skills.march === 1, 'хижина ведуна teaches a skill');
  const altar = site({ t: 'weekaltar', c: 6, r: 3 });
  altar.S.moons = H.Moons.MOONS.map(m => m.id);
  toEntry(altar);
  ok(altar.h.week.altar === 'yasna' && HE9.battleHero(altar.h).ranks.yasna === 1, 'алтарь недели raises the school of the moon');
  const lib = site({ t: 'library', c: 6, r: 3 });
  lib.h.spells = [];
  toEntry(lib);
  ok(!lib.h.spells.length, 'библиотека keeps out low levels');
  lib.h.level = 10;
  H.OBJ_VISIT.library(lib.S, lib.h, lib.o, []);
  ok(Object.values(H.SPELLS).filter(s => s.circle <= 2 && s.school !== 'road').every(s => lib.h.spells.includes(s.id)), 'and teaches every spell of circles 1 and 2 from level 10');
  const chap = site({ t: 'chapel', c: 6, r: 3 });
  toEntry(chap);
  ok(chap.h.fresh.morale === 1, 'часовня: morale before a battle');
  const spring = site({ t: 'luckspring', c: 6, r: 3 });
  toEntry(spring);
  ok(spring.h.fresh.luck === 1, 'родник удачи: luck before a battle');
  const idol = site({ t: 'idol', c: 6, r: 3 });
  toEntry(idol);
  ok(idol.h.week.luck === 2 && HE9.luck(idol.h) >= 2, 'идол: luck for the week');
  const grave = site({ t: 'graveyard', c: 6, r: 3 });
  toEntry(grave);
  const gravesBefore = Object.values(grave.h.arts).filter(Boolean).length + grave.h.bag.length;
  pick(grave, 'dig');
  ok(Object.values(grave.h.arts).filter(Boolean).length + grave.h.bag.length === gravesBefore + 1 && grave.h.week.morale === -1 && grave.o.dug, 'погост: an artifact and morale −1');

  const pair = plain(30, 16, [3, 3], [{ unit: 'militia', count: 20 }], [{ t: 'portal2', c: 6, r: 3, link: 2 }, { t: 'portal2', c: 20, r: 10, link: 1 }]);
  const pairQ = { S: pair, h: pair.heroes[0], o: pair.map.objs[0] };
  const tele = toEntry(pairQ);
  ok(pairQ.h.c === MD.entry(pair.map.objs[1])[0] && tele.some(e => e.t === 'teleport'), 'портал carries the hero to its pair');
  const gates = plain(30, 16, [3, 3], [{ unit: 'militia', count: 20 }], [{ t: 'moongate', c: 6, r: 3, moon: 'white' }, { t: 'moongate', c: 20, r: 10, moon: 'white' }]);
  gates.moons = ['red', 'white', 'azure', 'green', 'silver', 'gold', 'black', 'convergence'];
  const gateQ = { S: gates, h: gates.heroes[0], o: gates.map.objs[0] };
  const shut = toEntry(gateQ);
  ok(gateQ.h.c < 15 && shut.some(e => e.t === 'note'), 'лунные врата stay shut outside their moon');
  gates.moons = H.Moons.MOONS.map(m => m.id);
  ok(H.Sites.gateOpen(gates, gates.map.objs[0]), 'and open in the week of their moon');
  H.OBJ_VISIT.moongate(gates, gateQ.h, gates.map.objs[0], []);
  ok(gateQ.h.c >= 15, 'and carry the hero to the other gate');

  const wet = () => {
    const M = MD.create(20, 12, ['meadow']);
    MD.paint(M, 0, 'water', (c) => c >= 8 && c <= 12);
    MD.add(M, { t: 'boat', c: 8, r: 5, l: 0, owner: -1 });
    MD.add(M, { t: 'res-gold', c: 15, r: 5, l: 0, owner: -1, amount: 500 });
    const S = Adv.create(M, { seed: 5, moons: null, players: [{ name: 'Лига', color: 0, faction: 'league', human: true }], heroes: [{ owner: 0, name: 'Проба', cls: 'captain', faction: 'league', c: 6, r: 5, army: [{ unit: 'militia', count: 100 }] }] });
    return { S, h: S.heroes[0], o: S.map.objs[0], M };
  };
  const w = wet();
  ok(!Adv.path(w.S, w.h, 10, 5), 'a walker cannot go on water');
  const toBoat = Adv.path(w.S, w.h, 8, 5);
  ok(toBoat && toBoat.kind === 'visit', 'a boat can be boarded from the shore');
  for (const s of toBoat.steps) Adv.step(w.S, w.h, s.c, s.r);
  ok(!!w.h.boat && w.o.gone && w.h.steps === 0, 'boarding takes the rest of the day');
  Adv.endDay(w.S);
  ok(!!w.h.boat, 'the hero stays aboard overnight');
  const sail = Adv.path(w.S, w.h, 12, 5);
  ok(sail && sail.steps.every(s => s.c >= 8), 'the boat sails over water');
  for (const s of sail.steps) Adv.step(w.S, w.h, s.c, s.r);
  const land = Adv.path(w.S, w.h, 13, 5);
  Adv.step(w.S, w.h, land.steps[0].c, land.steps[0].r);
  ok(!w.h.boat && w.h.steps === 0 && !w.o.gone && w.o.c === 12 && w.o.r === 5, 'landing takes the rest of the day and leaves the boat at the shore');
  Adv.endDay(w.S);
  const reb = Adv.path(w.S, w.h, 12, 5);
  ok(reb && reb.kind === 'visit', 'the boat can be boarded again');
  const fleet = plain(24, 12, [3, 3], [{ unit: 'militia', count: 20 }], [{ t: 'shipyard', c: 6, r: 2 }]);
  MD.paint(fleet.map, 0, 'water', (c, r) => r >= 7);
  fleet.players[0].res.gold = 9000;
  fleet.players[0].res.wood = 20;
  const yardQ = { S: fleet, h: fleet.heroes[0], o: fleet.map.objs[0] };
  toEntry(yardQ);
  ok(yardQ.o.owner === 0 && fleet.pending.kind === 'choice', 'верфь takes a flag and offers a boat');
  pick(yardQ, 'build');
  const yBoat = fleet.map.objs.find(o => o.t === 'boat');
  ok(!!yBoat && MD.isWater(fleet.map, 0, yBoat.c, yBoat.r) && fleet.players[0].res.gold === 8000 && fleet.players[0].res.wood === 10, 'a boat costs 1000 gold and 10 wood and stands on water');
  ok(!H.Sites.dockFree(fleet, yardQ.o), 'one boat at a time at the dock');

  const pools = () => {
    const M = MD.create(24, 12, ['water']);
    MD.add(M, { t: 'boat', c: 2, r: 2, l: 0, owner: -1, gone: true });
    MD.add(M, { t: 'whirlpool', c: 5, r: 2, l: 0, owner: -1 });
    MD.add(M, { t: 'whirlpool', c: 18, r: 8, l: 0, owner: -1 });
    const S = Adv.create(M, { seed: 5, moons: null, players: [{ name: 'Лига', color: 0, faction: 'league', human: true }], heroes: [{ owner: 0, name: 'Проба', cls: 'captain', faction: 'league', c: 3, r: 3, army: [{ unit: 'militia', count: 100 }] }] });
    S.heroes[0].boat = 1;
    return { S, h: S.heroes[0], o: S.map.objs[1] };
  };
  const pool = pools();
  toEntry(pool);
  ok(pool.h.c >= 18 && pool.h.army[0].count === 90 && !!pool.h.boat, 'водоворот carries the boat and takes a tenth of the largest stack');
  const fordM = MD.create(10, 6, ['meadow']);
  MD.paint(fordM, 0, 'water', c => c === 5);
  MD.road(fordM, 0, 1, [[4, 3], [6, 3]]);
  ok(!MD.isWater(fordM, 0, 5, 3) && MD.isWater(fordM, 0, 5, 1), 'a road over water is a ford, not water');
  const seaMob = pools();
  MD.add(seaMob.S.map, { t: 'monster', c: 5, r: 8, l: 0, owner: -1, unit: 'pirates', count: 5, mood: 'hostile' });
  const seaP = Adv.path(seaMob.S, seaMob.h, 5, 8);
  for (const s of seaP.steps) Adv.step(seaMob.S, seaMob.h, s.c, s.r);
  const seaSetup = Adv.battleSetup(seaMob.S);
  ok(seaSetup.deck, 'a fight on a boat goes on two decks');
  const dry = site({ t: 'monster', c: 6, r: 3, unit: 'wolves', count: 3, mood: 'hostile' });
  const dryP = Adv.path(dry.S, dry.h, 6, 3);
  for (const s of dryP.steps) Adv.step(dry.S, dry.h, s.c, s.r);
  ok(!Adv.battleSetup(dry.S).deck, 'a fight on land does not');

  const tower = site({ t: 'watchtower', c: 12, r: 8 });
  toEntry(tower);
  ok(tower.S.players[0].seen[0][MD.idx(tower.S.map, 23, 8)] === 1, 'дозорная башня opens a wide circle');
  const obs = site({ t: 'observatory', c: 6, r: 3 });
  ok(H.Sites.calendarWeeks(obs.S, 0) === 4, 'the calendar shows 4 weeks');
  toEntry(obs);
  ok(obs.o.owner === 0 && H.Sites.calendarWeeks(obs.S, 0) === 8, 'обсерватория shows 8 weeks to its owner');
  const carto = site({ t: 'cartographer', c: 6, r: 3 });
  toEntry(carto);
  const paid = carto.S.players[0].res.gold;
  pick(carto, 'surface');
  ok(carto.S.players[0].seen[0].every(Boolean) && carto.S.players[0].res.gold === paid - 2000, 'картограф sells the surface');
  const mkt = site({ t: 'market', c: 6, r: 3 });
  toEntry(mkt);
  const ss = mkt.S.players[0].res.salt;
  pick(mkt, 'salt');
  ok(mkt.S.players[0].res.salt === ss + 5, 'рынок на карте sells a rare resource');
  const fair = site({ t: 'fair', c: 6, r: 3 });
  toEntry(fair);
  const fairG = fair.S.players[0].res.gold;
  pick(fair, 'buy');
  ok(fair.o.sold && fair.S.players[0].res.gold < fairG, 'ярмарка sells the artifact of the week');
  const blackM = site({ t: 'blackmarket', c: 6, r: 3 });
  toEntry(blackM);
  ok(blackM.o.arts.length === 3, 'чёрный рынок holds three artifacts');
  pick(blackM, 'a0');
  ok(blackM.o.arts[0] === null, 'and sells each one once');
  const innQ = site({ t: 'inn', c: 6, r: 3 });
  toEntry(innQ);
  ok(innQ.S.pending.lines[0].length > 5, 'придорожная таверна tells a rumor');
  pick(innQ, 'h0');
  ok(innQ.S.heroes.length === 2 && innQ.S.heroes[1].owner === 0, 'and hires heroes');
  const camp2 = site({ t: 'mercenarycamp', c: 6, r: 3 });
  toEntry(camp2);
  const pool0 = camp2.o.pool;
  pick(camp2, 'all');
  ok(camp2.h.army.some(s => s && s.unit === 'mercenaries' && s.count === pool0) && camp2.o.pool === 0 && camp2.o.owner === -1, 'наёмничий лагерь hires without a flag');
  for (let i = 0; i < 7; i++) Adv.endDay(camp2.S);
  ok(camp2.o.pool === H.UNITS.mercenaries.growth, 'and refills in a week');
  const dw = site({ t: 'dwell-wolves', c: 6, r: 3 });
  const dwellEv = toEntry(dw);
  ok(dw.o.owner === 0 && dwellEv.some(e => e.t === 'capture'), 'жилище takes a flag');
  pick(dw, 'all');
  ok(dw.h.army.some(s => s && s.unit === 'wolves' && s.count === H.UNITS.wolves.growth), 'and hires its creatures');
  for (let i = 0; i < 21; i++) Adv.endDay(dw.S);
  ok(dw.o.pool === H.UNITS.wolves.growth * 2, 'the pool keeps two weeks at most');
  const forge = site({ t: 'changeforge', c: 6, r: 3 }, [{ unit: 'pikeman', count: 10 }, { unit: 'militia', count: 5 }]);
  toEntry(forge);
  const forgeG = forge.S.players[0].res.gold;
  pick(forge, 'f0');
  ok(forge.h.army[0].unit === 'shieldbearer' && forge.S.players[0].res.gold < forgeG, 'кузня перемен moves a stack to the other branch');

  const post = site({ t: 'outpost', c: 6, r: 3, garrison: [{ unit: 'wolves', count: 3 }] }, [{ unit: 'plated', count: 40 }]);
  ok(post.o.garrison.length === 7, 'застава has seven slots');
  toEntry(post);
  ok(post.S.pending.kind === 'town', 'застава with a garrison starts a battle');
  const postSetup = Adv.battleSetup(post.S), postB = BA9.create(Object.assign({}, postSetup));
  BAI9.play(postB, 60);
  const postEv = Adv.battleDone(post.S, postB);
  ok(post.o.owner === 0 && !post.o.garrison.some(Boolean) && postEv.some(e => e.t === 'capture'), 'the winner takes the post');
  ok(!Adv.grid(post.S, 0, 0).entry[MD.idx(post.S.map, ...MD.entry(post.o))] && !!Adv.grid(post.S, 0, 1).entry[MD.idx(post.S.map, ...MD.entry(post.o))], 'the owner walks through his post');
  post.h.army[1] = { unit: 'wolves', count: 5, stars: 0, vet: 0 };
  H.OBJ_VISIT.outpost(post.S, post.h, post.o, []);
  pick(post, 'leave1');
  ok(post.o.garrison.some(s => s && s.unit === 'wolves'), 'the owner can leave a stack there');

  const pris = site({ t: 'prison', c: 6, r: 3, hid: 'yosta', level: 6 });
  toEntry(pris);
  pick(pris, 'free');
  ok(pris.S.heroes.length === 2 && pris.S.heroes[1].hid === 'yosta' && pris.S.heroes[1].owner === 0 && pris.o.gone && HE9.levelFor(pris.S.heroes[1].xp) === 6, 'острог gives a hero of its level');

  const seal = plain(24, 12, [3, 5], [{ unit: 'militia', count: 20 }], [{ t: 'sealer', c: 2, r: 8, color: 2 }, { t: 'sealgate', c: 10, r: 5, color: 2 }]);
  MD.paint(seal.map, 0, 'rock', (c, r) => c === 10 && r !== 5);
  ok(!Adv.path(seal, seal.heroes[0], 14, 5), 'застава печати holds the way without the seal');
  const shutEv = (() => {
    const p = Adv.path(seal, seal.heroes[0], 10, 5), ev = [];
    for (const s of p.steps) ev.push(...Adv.step(seal, seal.heroes[0], s.c, s.r).ev);
    return ev;
  })();
  ok(seal.heroes[0].c === 9 && shutEv.some(e => e.t === 'note'), 'the hero is turned back');
  seal.heroes[0].steps = 18;
  const toSealer = Adv.path(seal, seal.heroes[0], ...MD.entry(seal.map.objs[0]));
  for (const s of toSealer.steps) Adv.step(seal, seal.heroes[0], s.c, s.r);
  ok(seal.players[0].seals.includes(2), 'печатник gives the seal');
  ok(!!Adv.path(seal, seal.heroes[0], 14, 5), 'and the gate lets the hero through');

  const ask = site({ t: 'petitioner', c: 6, r: 3, quest: { kind: 'res', res: { wood: 5 } }, reward: { gold: 700, xp: 100 } });
  toEntry(ask);
  const askG = ask.S.players[0].res.gold, askW = ask.S.players[0].res.wood;
  pick(ask, 'do');
  ok(ask.S.players[0].res.gold === askG + 700 && ask.S.players[0].res.wood === askW - 5 && ask.o.done.includes(0), 'хижина просителя takes a resource and pays');
  const askArt = site({ t: 'petitioner', c: 6, r: 3, quest: { kind: 'art', art: 'luckbone' }, reward: { gold: 100 } });
  ok(!H.Sites.questReady(askArt.S, askArt.h, askArt.o.quest), 'no artifact, no deal');
  askArt.h.bag.push('luckbone');
  toEntry(askArt);
  pick(askArt, 'do');
  ok(!askArt.h.bag.includes('luckbone'), 'the artifact is given away');
  const askArmy = site({ t: 'petitioner', c: 6, r: 3, quest: { kind: 'army', unit: 'militia', count: 50 }, reward: { gold: 100 } }, [{ unit: 'militia', count: 50 }]);
  ok(!H.Sites.questReady(askArmy.S, askArmy.h, askArmy.o.quest), 'a hero keeps at least one creature');
  askArmy.h.army[1] = { unit: 'wolves', count: 1, stars: 0, vet: 0 };
  ok(H.Sites.questReady(askArmy.S, askArmy.h, askArmy.o.quest), 'creatures can be brought');
  const qGate = plain(24, 12, [3, 5], [{ unit: 'militia', count: 20 }], [{ t: 'questgate', c: 10, r: 5, quest: { kind: 'res', res: { wood: 5 } } }]);
  MD.paint(qGate.map, 0, 'rock', (c, r) => c === 10 && r !== 5);
  ok(!Adv.path(qGate, qGate.heroes[0], 14, 5), 'ворота задания hold the way');
  const qp = Adv.path(qGate, qGate.heroes[0], 10, 5);
  for (const s of qp.steps) Adv.step(qGate, qGate.heroes[0], s.c, s.r);
  Adv.resolve(qGate, 'do');
  ok(qGate.map.objs[0].done.includes(0) && !!Adv.path(qGate, qGate.heroes[0], 14, 5), 'and open after the task');
  const stone = site({ t: 'signstone', c: 6, r: 3, text: 'Тут был мельник' });
  ok(toEntry(stone).some(e => e.t === 'read' && e.text === 'Тут был мельник'), 'камень с надписью reads its text');

  const VAULTS = Object.entries(H.OBJ).filter(([, d]) => d.kind === 'vault');
  ok(VAULTS.length === 12, '12 kinds of treasury');
  for (const [id, d] of VAULTS) {
    ok(d.arts.length === 4 && d.guard.every(([u, n]) => H.UNITS[u] && n > 0), id + ': guards and four steps of reward');
    const low = H.Sites.vaultValue({ t: id, tier: 0 }), high = H.Sites.vaultValue({ t: id, tier: 3 }), a = H.Sites.vaultGuards({ t: id, tier: 0 }), b = H.Sites.vaultGuards({ t: id, tier: 3 }), sum = l => l.reduce((t, s) => t + s.count * H.UNITS[s.unit].cost, 0);
    ok(high > low && sum(b) > sum(a) && a.length <= 7 && b.length <= 7, id + ': a higher step is richer and better guarded');
  }
  const vq = site({ t: 'wolfden', c: 6, r: 3, tier: 0 }, [{ unit: 'plated', count: 80 }, { unit: 'crossbow', count: 60 }]);
  toEntry(vq);
  ok(vq.S.pending.kind === 'vault', 'сокровищница asks before a battle');
  const vqG = vq.S.players[0].res.gold, vSetup = Adv.battleSetup(vq.S), vB = BA9.create(Object.assign({}, vSetup));
  BAI9.play(vB, 60);
  Adv.battleDone(vq.S, vB);
  ok(vq.o.looted && vq.S.players[0].res.gold > vqG && vq.h.army.some(s => s && s.unit === 'wolves'), 'the winner takes gold and creatures');
  const emptyEv = [];
  H.OBJ_VISIT.vault(vq.S, vq.h, vq.o, emptyEv);
  ok(!vq.S.pending && emptyEv.some(e => e.t === 'note'), 'a looted treasury stays empty');
  const vl = site({ t: 'wolfden', c: 6, r: 3, tier: 0 }, [{ unit: 'militia', count: 3 }]);
  toEntry(vl);
  const vlS = Adv.battleSetup(vl.S), vlB = BA9.create(Object.assign({}, vlS));
  BAI9.play(vlB, 60);
  Adv.battleDone(vl.S, vlB);
  ok(!!vl.o.left && !vl.o.looted, 'a lost battle leaves the guards as they are');
  const vr = site({ t: 'wolfden', c: 6, r: 3 });
  toEntry(vr);
  Adv.resolve(vr.S, 'retreat');
  ok(!vr.S.pending && vr.h.c !== MD.entry(vr.o)[0], 'one can step back from a treasury');
  const merc = site({ t: 'monster', c: 6, r: 3, unit: 'mercenaries', count: 20, mood: 'hostile' }, [{ unit: 'plated', count: 80 }]);
  const mercP = Adv.path(merc.S, merc.h, 6, 3);
  for (const s of mercP.steps) Adv.step(merc.S, merc.h, s.c, s.r);
  if (merc.S.pending.kind === 'encounter') {
    const mS = Adv.battleSetup(merc.S), mB = BA9.create(Object.assign({}, mS));
    BAI9.play(mB, 60);
    const mEv = Adv.battleDone(merc.S, mB);
    ok(merc.S.pending && merc.S.pending.site === 'merc' && merc.S.pending.count === 4 && mEv.some(e => e.t === 'pending'), 'Наёмники offer service after a lost battle');
    Adv.resolve(merc.S, 'hire');
    ok(merc.h.army.some(s => s && s.unit === 'mercenaries' && s.count === 4), 'and join for gold');
  }
  const ruin = site({ t: 'whiteruin', c: 6, r: 3 });
  toEntry(ruin);
  const ruinG = ruin.S.players[0].res.gold;
  for (let i = 0; i < 7; i++) Adv.endDay(ruin.S);
  ok(ruin.o.owner === 0 && ruin.S.players[0].res.gold >= ruinG + 250, 'белая руина pays weekly');

  const heart = () => {
    const M = MD.create(60, 60, ['meadow']);
    M.heart = { l: 0, c: 40, r: 30 };
    for (const [c, r] of [[5, 5], [50, 5], [5, 50]]) MD.add(M, { t: 'menhir', c, r, l: 0, owner: -1 });
    MD.add(M, { t: 'town', c: 2, r: 20, owner: 0, l: 0, faction: 'league', name: 'Дом', built: ['hall1', 'hall2', 'hall3', 'tavern', 'market', 'guild1'] });
    const S = Adv.create(M, { seed: 5, moons: null, goals: { win: [{ kind: 'heart' }], lose: [{ kind: 'all' }] }, players: [{ name: 'Лига', color: 0, faction: 'league', human: true }, { name: 'Курганы', color: 1, faction: 'barrows' }], heroes: [{ owner: 0, name: 'Проба', cls: 'captain', faction: 'league', c: 8, r: 8, army: [{ unit: 'plated', count: 40 }] }, { owner: 1, name: 'Враг', cls: 'noyon', faction: 'barrows', c: 58, r: 58, army: [{ unit: 'shade', count: 5 }] }] });
    return { S, h: S.heroes[0], M };
  };
  const hq = heart();
  ok(H.Sites.heartArea(hq.S, 0) === null, 'no search area before the first menhir');
  const seeAt = (i) => {
    const o = hq.M.objs[i], ev = [];
    H.OBJ_VISIT.menhir(hq.S, hq.h, o, ev);
    return ev;
  };
  ok(seeAt(0).some(e => e.t === 'menhir' && e.count === 1), 'менгир is recorded');
  const area1 = H.Sites.heartArea(hq.S, 0);
  ok(area1.some(([c, r]) => c === 40 && r === 30) && area1.length > 25, 'one menhir gives a wide sector with the heart inside');
  seeAt(0);
  ok(hq.S.players[0].menhirs.length === 1, 'the same menhir does not count twice');
  seeAt(1);
  const area2 = H.Sites.heartArea(hq.S, 0);
  ok(area2.length < area1.length && area2.some(([c, r]) => c === 40 && r === 30), 'the second menhir narrows the search');
  seeAt(2);
  const area3 = H.Sites.heartArea(hq.S, 0);
  ok(area3.length <= 25 && area3.some(([c, r]) => c === 40 && r === 30), 'three menhirs narrow it to 5×5 (' + area3.length + ')');
  ok(area3.every(([c, r]) => Math.abs(c - 40) <= 4 && Math.abs(r - 30) <= 4), 'the square lies around the heart');
  const gearBack = H.Hero.gear;
  H.Hero.gear = h => (h === hq.h ? Object.assign({}, { compass: 1 }) : {});
  ok(H.Sites.heartArea(hq.S, 0).length <= 9, 'Лунный циркуль narrows it to 3×3');
  H.Hero.gear = gearBack;
  hq.h.c = 39;
  hq.h.r = 30;
  hq.h.steps = 3;
  ok(H.Sites.dig(hq.S, hq.h).some(e => e.t === 'note') && hq.h.steps === 3, 'digging needs a whole day');
  hq.h.steps = Adv.daySteps(hq.S, hq.h);
  H.Sites.dig(hq.S, hq.h);
  ok(hq.h.steps === 0 && hq.M.objs.some(o => o.t === 'digspot' && o.c === 39 && o.r === 30) && !hq.h.heart, 'an empty dig leaves a pit and takes the day');
  ok(!Adv.grid(hq.S, 0).block[MD.idx(hq.M, 39, 30)], 'a pit does not block the way');
  hq.h.steps = Adv.daySteps(hq.S, hq.h);
  ok(H.Sites.dig(hq.S, hq.h).some(e => e.t === 'note'), 'one cannot dig the same pit twice');
  hq.h.c = 40;
  hq.h.steps = Adv.daySteps(hq.S, hq.h);
  ok(H.Sites.dig(hq.S, hq.h).some(e => e.t === 'heartFound') && hq.h.heart && hq.M.heart.taken, 'the right cell gives the Heart');
  const home = hq.M.objs.find(o => o.t === 'town');
  ok(TW9.state(hq.S, home, 'altar').s === 'forbidden', 'no altar without the Heart in town');
  const homeEv = [];
  H.OBJ_VISIT.town(hq.S, hq.h, home, homeEv);
  ok(home.heart && !hq.h.heart && homeEv.some(e => e.t === 'heartHome'), 'the Heart stays in the town');
  ok(TW9.state(hq.S, home, 'altar').s !== 'forbidden', 'and the altar can be built');
  Object.assign(hq.S.players[0].res, { gold: 9000, moonsilver: 20 });
  home.today = false;
  const altarBuilt = TW9.build(hq.S, home, 'altar');
  const overEv = [];
  Adv.conclude(hq.S, overEv);
  ok(altarBuilt.ok && hq.S.over && hq.S.over.winner === 0 && hq.S.over.why === 'heart', 'the altar wins a game with the goal «Поднять Сердце»');
  ok(TW9.income(hq.S, 0).gold >= 3000 && Adv.altarMorale(hq.S, 0) === 1, 'Золотой колокол pays and gives morale');

  const carrier = heart();
  carrier.h.heart = true;
  const foe = carrier.S.heroes[1];
  H.Sites.dropHeart(carrier.S, carrier.h, foe);
  ok(foe.heart && !carrier.h.heart, 'the winner takes the Heart from a fallen hero');
  H.Sites.dropHeart(carrier.S, foe, null);
  ok(carrier.M.objs.some(o => o.t === 'heartstone' && o.c === foe.c), 'without a winner it stays on the ground');
  const stoneObj = carrier.M.objs.find(o => o.t === 'heartstone'), stoneEv = [];
  H.OBJ_VISIT.heartstone(carrier.S, carrier.h, stoneObj, stoneEv);
  ok(carrier.h.heart && stoneObj.gone, 'and can be picked up');

  const kurgan = (() => {
    const M = MD.create(30, 20, ['meadow']);
    MD.add(M, { t: 'town', c: 2, r: 2, owner: 0, l: 0, faction: 'barrows', name: 'Курган', built: ['hall1', 'tavern', 'altar'] });
    MD.add(M, { t: 'monster', c: 17, r: 10, l: 0, owner: -1, unit: 'plated', count: 60, mood: 'fierce' });
    return Adv.create(M, { seed: 5, moons: null, players: [{ name: 'Курганы', color: 0, faction: 'barrows', human: true }], heroes: [{ owner: 0, hid: 'timar', name: 'Тимар', cls: 'noyon', faction: 'barrows', c: 15, r: 10, army: [{ unit: 'shade', count: 2 }] }] });
  })();
  const fallen = kurgan.heroes[0], fallEv = [], rise = kurgan.map.objs[0], foeMob = kurgan.map.objs[1];
  const fallPath = Adv.path(kurgan, fallen, foeMob.c, foeMob.r);
  for (const s of fallPath.steps) Adv.step(kurgan, fallen, s.c, s.r);
  const fallB = BA9.create(Object.assign({}, Adv.battleSetup(kurgan)));
  BAI9.play(fallB, 60);
  Adv.battleDone(kurgan, fallB);
  ok(!fallen.alive && kurgan.returning.some(w => w.hero === fallen.id && w.kind === 'altar' && w.town === rise.id), 'Великий курган takes the fallen hero');
  for (let i = 0; i < 2; i++) fallEv.push(...Adv.endDay(kurgan));
  ok(!fallen.alive, 'the hero does not rise before the third day');
  ok(!TW9.backHeroes(kurgan, rise).includes(fallen), 'an altar hero is not for hire');
  fallEv.push(...Adv.endDay(kurgan));
  ok(fallen.alive && fallEv.some(e => e.t === 'risen') && fallen.army.some(Boolean), 'and rises at the altar on the third day');

  const under = (() => {
    const M = MD.create(20, 20, ['meadow', 'cave']);
    MD.add(M, { t: 'stairsdown', c: 5, r: 5, l: 0, owner: -1, link: 2 });
    MD.add(M, { t: 'stairsup', c: 10, r: 10, l: 1, owner: -1, link: 1 });
    const S = Adv.create(M, { seed: 5, moons: null, players: [{ name: 'Лига', color: 0, faction: 'league', human: true }], heroes: [{ owner: 0, name: 'Проба', cls: 'captain', faction: 'league', c: 2, r: 2, army: [{ unit: 'militia', count: 20 }] }] });
    return { S, h: S.heroes[0], o: M.objs[0] };
  })();
  const surface = HE9.sight(under.S, under.h);
  toEntry(under);
  ok(under.h.l === 1 && under.h.c === MD.entry(under.S.map.objs[1])[0], 'переход leads to the other level');
  ok(HE9.sight(under.S, under.h) === surface - H.MAP.underSight, 'the view is shorter in Подлунье');
  ok(under.S.players[0].seen[1].some(Boolean), 'the level opens around the hero');
  H.OBJ_VISIT.portal(under.S, under.h, under.S.map.objs[1], []);
  ok(under.h.l === 0, 'and back up');

  const backCaravan = (() => {
    const M = MD.create(40, 20, ['meadow']);
    MD.add(M, { t: 'town', c: 25, r: 8, owner: 0, l: 0, faction: 'league', name: 'Куда', built: ['hall1', 'market', 'caravan', 'tavern'] });
    MD.add(M, { t: 'dwell-wolves', c: 5, r: 5, owner: 0, l: 0 });
    return Adv.create(M, { seed: 5, moons: null, players: [{ name: 'Лига', color: 0, faction: 'league', human: true }], heroes: [{ owner: 0, name: 'Проба', cls: 'captain', faction: 'league', c: 2, r: 15, army: [{ unit: 'militia', count: 20 }] }] });
  })();
  backCaravan.players[0].res.gold = 20000;
  const cvTo = backCaravan.map.objs[0], cvFrom = backCaravan.map.objs[1];
  ok(TW9.caravanSources(backCaravan, cvTo).includes(cvFrom), 'an own dwelling on the map can send a caravan');
  const cvRows = TW9.caravanRows(backCaravan, cvFrom), cvSent = TW9.sendCaravan(backCaravan, cvFrom, cvTo, cvRows);
  ok(cvSent.ok && cvFrom.pool === 0 && backCaravan.caravans.length === 1, 'the caravan empties the dwelling');
  for (let i = 0; i < 4 && backCaravan.caravans.length; i++) Adv.endDay(backCaravan);
  ok(!backCaravan.caravans.length && cvTo.garrison.some(s => s && s.unit === 'wolves'), 'and arrives in the town');

  const jail = site({ t: 'prison', c: 6, r: 3, hid: 'yosta' });
  let jailed = false;
  for (let i = 0; i < 60; i++) {
    const inn = { t: 'inn' };
    TW9.rollInn(jail.S, inn);
    if (inn.tavern.includes('yosta')) jailed = true;
  }
  ok(!jailed, 'a hero in a prison does not sit in a tavern');

  const moved = H.Save.unpack(JSON.stringify({ game: 'heroes98', v: 2, S: (() => {
    const old = plain(10, 10, [2, 2]), raw = JSON.parse(H.Save.pack(old)).S;
    delete raw.map.over;
    for (const p of raw.players) {
      delete p.seals;
      delete p.menhirs;
      delete p.kills;
    }
    for (const h of raw.heroes) {
      delete h.boat;
      delete h.heart;
      delete h.fresh;
      delete h.week;
    }
    return raw;
  })() }));
  ok(moved.map.over[0].length === 100 && moved.players[0].seals.length === 0 && moved.heroes[0].fresh.morale === 0 && moved.heroes[0].week.steps === 0, 'a save of the stage 8 version gets fields, seals and hero marks');
}

{
  const lineup = ['league', 'barrows', 'barrows', 'league'];
  const def = H.Maps.build('chasha', { seed: 3, slots: lineup.map((f, i) => ({ faction: f, human: !i })) }), M = def.map, rec = H.Maps.LIST.find(m => m.id === 'chasha');
  ok(M.w === 112 && M.h === 112 && M.levels === 2 && rec.levels === 2 && rec.size === 'большая' && rec.players === 4, 'the large map has two levels and four players');
  const placed = new Set(M.objs.map(o => o.t)), missing = Object.keys(H.OBJ).filter(k => !placed.has(k) && k !== 'digspot' && k !== 'heartstone' && k !== 'hamlet' && k !== 'boundstone');
  ok(!missing.length, 'every kind of object stands on the large map: ' + missing.join(' '));
  const cells = new Set();
  let clean = true;
  for (const o of M.objs) {
    for (const [c, r] of MD.cells(o)) {
      const k = o.l + ':' + c + ':' + r;
      if (!MD.inside(M, c, r) || cells.has(k)) clean = false;
      cells.add(k);
    }
  }
  ok(clean, 'objects of the large map do not overlap');
  const waterKinds = new Set(['barrel', 'whirlpool', 'boat']);
  ok(M.objs.every(o => {
    const e = MD.entry(o);
    if (!e) return true;
    return waterKinds.has(o.t) ? MD.isWater(M, o.l, e[0], e[1]) : !!MD.groundCost(M, o.l, e[0], e[1]);
  }), 'land objects stand on land, boats and whirlpools on water');
  ok(M.objs.filter(o => o.link != null).every(o => {
    const to = M.objs.find(x => x.id === o.link);
    return !!to && (to.link === o.id || H.OBJ[to.t].kind === 'portal');
  }), 'every link leads to an existing object');
  ok(M.objs.filter(o => o.t === 'stairsdown').every(o => M.objs.find(x => x.id === o.link).t === 'stairsup' && M.objs.find(x => x.id === o.link).l === 1), 'the stairs lead down into Подлунье');
  ok(M.objs.filter(o => o.t === 'prison').every(o => !!o.hid) && !def.setup.heroes.some(h => M.objs.some(o => o.t === 'prison' && o.hid === h.hid)), 'prison heroes are free');
  const flood = H.AI.regions(M, 0);
  const S = Adv.create(M, def.setup), town = TW.list(S, 0)[0], gate = MD.entry(town), home = flood.id[MD.idx(M, gate[0], gate[1])];
  for (const o of M.objs) {
    const e = MD.entry(o);
    if (!e || o.l || waterKinds.has(o.t)) continue;
    const reg = flood.id[MD.idx(M, e[0], e[1])];
    ok(reg === home || M.objs.some(x => x.link != null && x.l === 0 && flood.id[MD.idx(M, ...MD.entry(M.objs.find(y => y.id === x.link)))] === reg) || M.objs.some(x => x.t === 'boat' && flood.links.get(flood.id[MD.idx(M, x.c, x.r)]) && flood.links.get(flood.id[MD.idx(M, x.c, x.r)]).has(reg)) || M.objs.some(x => x.t === 'moongate' && flood.id[MD.idx(M, ...MD.entry(x))] === reg), o.t + ' at ' + e.join() + ' can be reached by land, boat or portal');
  }
  for (let l = 0; l < M.levels; l++) {
    const g = Adv.grid(S, l);
    for (const o of M.objs) {
      if (o.l !== l || !MD.entry(o)) continue;
      const [ec, er] = MD.entry(o), wetDoor = MD.isWater(M, l, ec, er);
      ok(H.Path.DIRS.some(([dc, dr]) => {
        const c = ec + dc, r = er + dr;
        return MD.inside(M, c, r) && !g.block[MD.idx(M, c, r)] && (wetDoor ? MD.isWater(M, l, c, r) : !!MD.groundCost(M, l, c, r));
      }), o.t + ' at ' + ec + ',' + er + ' has a free cell at its entrance');
    }
  }
  const gateIslet = M.objs.filter(o => o.t === 'moongate' && o.moon === 'silver').map(o => flood.id[MD.idx(M, ...MD.entry(o))]);
  ok(gateIslet[0] !== gateIslet[1], 'a moon gate joins two separate pieces of land');
  ok(M.goals.win.some(g => g.kind === 'heart'), 'the map can be won by the Heart');
  ok(!!MD.groundCost(M, M.heart.l, M.heart.c, M.heart.r) && !M.objs.some(o => o.l === M.heart.l && MD.cells(o).some(([c, r]) => c === M.heart.c && r === M.heart.r)), 'the Heart lies on free ground');
  const fields = new Set(M.over[0].filter(Boolean));
  ok(fields.size === 5, 'all five special fields are painted');
  const again = H.Maps.build('chasha', { seed: 3, slots: lineup.map((f, i) => ({ faction: f, human: !i })) }), twice = H.Maps.build('chasha', { seed: 3, slots: lineup.map((f, i) => ({ faction: f, human: !i })) });
  ok(JSON.stringify(again) === JSON.stringify(twice), 'the large map builds the same every time');
  const G = Adv.create(H.Maps.build('chasha', { seed: 9, slots: lineup.map(f => ({ faction: f })) }).map, H.Maps.build('chasha', { seed: 9, slots: lineup.map(f => ({ faction: f })) }).setup);
  for (let i = 0; i < 40 && !G.over; i++) {
    H.AI.turn(G);
    Adv.endTurn(G);
  }
  ok(G.day >= 10, 'the AI plays the large map');
  ok(G.heroes.every(h => !h.alive || (h.boat ? MD.isWater(G.map, h.l, h.c, h.r) : !!MD.groundCost(G.map, h.l, h.c, h.r) || H.Hero.overGround(G, h, MD.terrainAt(G.map, h.l, h.c, h.r).id))), 'AI heroes stand on ground they may stand on');
  ok(G.players.every(p => H.RESOURCES.every(([k]) => p.res[k] >= 0)), 'the AI stays out of debt on the large map');
  const copy = H.Save.unpack(H.Save.pack(G));
  ok(H.Save.hash(copy) === H.Save.hash(G), 'the large map saves and loads to the same hash');
}

{
  const HE10 = H.Hero, BA10 = H.Battle, TW10 = H.Town;
  const arts = Object.values(H.ARTIFACTS).filter(a => !a.scroll), count = f => arts.filter(f).length;
  ok(count(a => a.rank === 'plain') === 40 && count(a => a.rank === 'rare' && !a.set) === 35 && count(a => a.rank === 'relic') === 20 && count(a => a.set) === 22, '40 plain, 35 rare, 20 relics and 22 set items');
  ok(arts.every(a => a.cost > 0 && a.cost % 100 === 0), 'every artifact has a price');
  const mean = rank => { const l = arts.filter(a => a.rank === rank && !a.set); return l.reduce((t, a) => t + a.cost, 0) / l.length; };
  ok(mean('plain') < mean('rare') && mean('rare') < mean('relic'), 'a higher rank costs more');
  const SETS = { throne: ['head', 'body', 'left', 'legs'], pilot: ['shoulders', 'legs', 'neck'], steppe: ['head', 'right', 'ring'], leshy: ['shoulders', 'charm', 'legs'], stars: ['neck', 'ring', 'ring'], forge: ['right', 'body', 'left'], guilds: ['ring', 'charm', 'neck'] };
  ok(Object.keys(H.ART_SETS).length === 7, 'seven sets of the release');
  for (const [id, slots] of Object.entries(SETS)) {
    const set = H.ART_SETS[id];
    ok(set.items.map(x => H.ARTIFACTS[x].slot).sort().join() === slots.slice().sort().join(), set.name + ': the places follow the plan');
    ok(Object.keys(set.two).length && Object.keys(set.full).length && set.twoAbout && set.fullAbout, set.name + ': both bonuses have effects and texts');
  }
  const USED = ['atk', 'def', 'power', 'wis', 'morale', 'luck', 'mana', 'steps', 'sight', 'manaDay', 'goldDay', 'woodDay', 'oreDay', 'saltDay', 'amberDay', 'sulfurDay', 'moonDay', 'shots', 'init', 'enemyReady', 'firstReady', 'melee', 'ranged', 'guard', 'retal', 'stand', 'finish', 'sorcery', 'manaCut', 'moonMana', 'spellIn', 'hpPct', 'speed', 'learning', 'tactics', 'regen', 'boatSteps', 'seaSight', 'water', 'water2', 'woodland', 'sandy', 'highfoot', 'compass', 'calendar', 'bestRate', 'parley', 'aim', 'fortune', 'banner', 'forge', 'thicket', 'recover'];
  const allFx = [...arts.flatMap(a => Object.keys(a.fx)), ...Object.values(H.ART_SETS).flatMap(s => [...Object.keys(s.two), ...Object.keys(s.full)])];
  ok(allFx.every(k => USED.includes(k)), 'artifacts use only known effects: ' + allFx.filter(k => !USED.includes(k)).join());
  ok(USED.every(k => allFx.includes(k)), 'every known effect is used');
  ok(arts.every(a => H.Art.all().some(e => e.id === 'artifact/' + a.id)), 'every artifact has an icon entry');

  const makeHero = (S, list) => {
    const h = S.heroes[0];
    for (const id of list) {
      const slot = H.ART_SLOTS.map(x => x[0]).find(x => HE10.fits(id, x) && !h.arts[x]);
      h.arts[slot] = id;
    }
    return h;
  };
  const world = (list, army) => {
    const S = plain(20, 12, [3, 3], army || [{ unit: 'militia', count: 50 }]);
    return { S, h: makeHero(S, list) };
  };
  const dressed = (list, army) => {
    const q = world(list);
    return { stacks: army, hero: HE10.battleHero(q.h), morale: HE10.morale(q.h), luck: HE10.luck(q.h) };
  };
  const face = (a, b, ex) => BA10.create(Object.assign({ seed: 9, obstacles: [], sides: [a, b] }, ex || {}));
  const melee = (list, f) => {
    const B = face(dressed(list, [{ unit: 'plated', count: 10, c: 5, r: 5 }]), { stacks: [{ unit: 'plated', count: 10, c: 6, r: 5 }] }, { ready: [100, 0] });
    return f(B);
  };
  const hitMax = B => BA10.forecast(B, B.stacks[0], B.stacks[1], 'melee', { c: 5, r: 5, flown: 0 }).max;

  const t1 = world(['thronehelm']), t2 = world(['thronehelm', 'thronecoat']), t4 = world(['thronehelm', 'thronecoat', 'throneshield', 'thronegreaves']);
  ok(HE10.stat(t1.h, 'def') === t1.h.def + 1, 'one set item gives only its own bonus');
  ok(HE10.stat(t2.h, 'def') === t2.h.def + 3 + 2, 'two items of a set add the small bonus');
  ok(HE10.gear(t4.h).spellIn === 0.2, 'all items add the full bonus');
  ok(!HE10.gear(t2.h).spellIn, 'not earlier');
  ok(HE10.setsOn(t4.h)[0].count === 4, 'the hero screen sees how many items are on');
  const baggy = world(['thronehelm']);
  baggy.h.bag.push('thronecoat');
  ok(HE10.stat(baggy.h, 'def') === baggy.h.def + 1, 'a bag item does not count for a set');
  const two = world(['starcircle', 'starcircle', 'starlens']);
  ok(!HE10.gear(two.h).calendar, 'two copies of a ring are one item of a set');

  const inc = world(['stewardcap', 'woodtoken', 'brinering', 'silverring']);
  const inR = HE10.income(inc.S, 0);
  ok(inR.gold === 900 && inR.wood === 1 && inR.salt === 1 && inR.moonsilver === 1, 'artifacts bring daily income');
  const guild = world(['guildsignet', 'guildseal']);
  ok(HE10.income(guild.S, 0).gold === 700, 'Казна гильдий: +500 for two items');
  const manaQ = world(['starlens', 'starcircle']);
  manaQ.h.mana = 0;
  HE10.newDay(manaQ.S, []);
  ok(manaQ.h.mana === H.HERO.manaDay + 3, 'Приборы звездочёта: +3 mana a day');
  ok(H.Sites.calendarWeeks(world(['starlens', 'starcircle', 'starset']).S, 0) === 8, 'and the full set shows 8 weeks');
  const ter = (list, id) => {
    const q = world(list), g = Adv.grid(q.S, 0, 0);
    MD.paint(q.S.map, 0, id, (c, r) => c === 5 && r === 5);
    return Adv.stepCost(q.S, q.h, g, 0, 5, 5);
  };
  ok(ter([], 'forest') === 1.5 && ter(['leshymoss', 'leshyroot'], 'forest') === 1 && ter(['leshymoss', 'leshyroot'], 'swamp') === 1, 'Лешачий наряд: forest and swamp cost 1');
  ok(ter([], 'sand') === 1.25 && ter(['sandrunners'], 'sand') === 1 && ter(['sandrunners'], 'ash') === 1, 'Степные чувяки: sand and ash cost 1');
  ok(ter([], 'highland') === 1.5 && ter(['climbers'], 'highland') === 1, 'Горные кошки: highland costs 1');
  ok(ter([], 'water') === 0 && ter(['tidecoat'], 'water') === 1.5 && ter(['pilotcloak', 'pilotboots'], 'water') === 1, 'walking on water at 1.5, with Снасть лоцмана at 1');
  const sea = world(['pilotcloak', 'pilotboots', 'pilotlens']), seaSteps = Adv.daySteps(sea.S, sea.h), seaSight = HE10.sight(sea.S, sea.h);
  sea.h.boat = 99;
  ok(Adv.daySteps(sea.S, sea.h) === seaSteps + 6 && HE10.sight(sea.S, sea.h) === seaSight + 4, 'Снасть лоцмана: the boat gets 6 steps and 4 of view');
  const xpQ = world(['sageknot']);
  ok(HE10.addXp(xpQ.h, 1000) === 1100, 'Узел мудреца: 10 % more experience');
  const talk = world(['tonguecharm']), plainTalk = world([]);
  MD.add(talk.S.map, { t: 'monster', c: 3, r: 5, owner: -1, l: 0, unit: 'wolves', count: 5, mood: 'friendly' });
  MD.add(plainTalk.S.map, { t: 'monster', c: 3, r: 5, owner: -1, l: 0, unit: 'wolves', count: 5, mood: 'friendly' });
  Adv.engage(talk.S, talk.h, talk.S.map.objs[0].id, 'attack');
  Adv.engage(plainTalk.S, plainTalk.h, plainTalk.S.map.objs[0].id, 'attack');
  ok(talk.S.pending.price < plainTalk.S.pending.price, 'Подвеска толмача: neutrals ask less');
  const rate = plain(20, 12, [3, 3], [{ unit: 'militia', count: 5 }], [{ t: 'town', c: 8, r: 8, owner: 0, l: 0, faction: 'league', name: 'Т', built: ['hall1', 'market'] }]);
  const k0 = TW10.markets(rate, 0);
  makeHero(rate, ['guildsignet', 'guildseal', 'guildchain']);
  ok(k0 === 1 && TW10.markets(rate, 0) === H.TOWN.maxMarket, 'Казна гильдий: the best market rate');
  const circ = world(['moonguide']);
  ok(!!HE10.gear(circ.h).compass, 'Лунный циркуль carries the narrow search');

  const base = melee([], hitMax);
  ok(melee(['sabrebreak'], hitMax) > base, 'Сабля пролома: stronger in melee');
  ok(melee(['kingmace'], hitMax) > melee(['sabrebreak'], hitMax), 'Булава порядка is stronger still');
  const asFoe = list => {
    const B = face({ stacks: [{ unit: 'plated', count: 10, c: 5, r: 5 }] }, dressed(list, [{ unit: 'plated', count: 10, c: 6, r: 5 }]), { ready: [100, 0] });
    return hitMax(B);
  };
  ok(asFoe(['saltmail']) < asFoe([]), 'Кольчуга в соли: less damage in melee');
  const retal = list => {
    const B = face({ stacks: [{ unit: 'plated', count: 10, c: 5, r: 5 }] }, dressed(list, [{ unit: 'plated', count: 10, c: 6, r: 5 }]), { ready: [100, 0] });
    return BA10.forecast(B, B.stacks[0], B.stacks[1], 'melee', { c: 5, r: 5, flown: 0 }).retal.max;
  };
  ok(retal(['thornbuckler']) > retal([]), 'Шипастый баклер: a stronger answer');
  const standFor = list => face({ stacks: [{ unit: 'plated', count: 10, c: 5, r: 5 }] }, dressed(list, [{ unit: 'plated', count: 10, c: 6, r: 5 }])).stacks[1].stand;
  ok(standFor(['pavise']) === standFor([]) + 0.1, 'Павеза: a firmer defence');
  const shot = list => {
    const B = face(dressed(list, [{ unit: 'crossbow', count: 10, c: 0, r: 5 }]), { stacks: [{ unit: 'plated', count: 10, c: 12, r: 5 }] }, { ready: [100, 0] });
    return { B, f: BA10.forecast(B, B.stacks[0], B.stacks[1], 'shot') };
  };
  ok(shot(['hawkcloak']).f.max > shot([]).f.max, 'Плащ ястреба: stronger shots');
  ok(shot(['longaim']).f.max > shot([]).f.max * 1.5, 'Прицельная рейка: no penalty at long range');
  ok(shot(['widowcannon']).B.stacks[0].shots === H.UNITS.crossbow.shots + 2, 'Ручница вдовы: more shots');
  const sp = list => {
    const B = face(dressed(list, [{ unit: 'plated', count: 10, c: 2, r: 5 }]), { stacks: [{ unit: 'plated', count: 10, c: 9, r: 5 }] }, { moon: { id: 'red', people: [] } });
    return { B, h: B.sides[0].hero };
  };
  const cost = (q, id) => BA10.spellCost(q.B, q.h, H.SPELLS[id]);
  ok(cost(sp(['moonamulet']), 'firearrow') === cost(sp([]), 'firearrow') - 1, 'Амулет полнолуния: spells cost 1 less');
  ok(cost(sp(['starlens', 'starcircle', 'starset']), 'firearrow') === cost(sp([]), 'firearrow') - 2, 'Приборы звездочёта: spells of the moon cost 2 less');
  ok(cost(sp(['starlens', 'starcircle', 'starset']), 'balm') === cost(sp([]), 'balm'), 'other schools cost the same');
  const q0 = sp([]), q1 = sp(['emberwand']);
  ok(BA10.spellAmount(q1.B, q1.h, H.SPELLS.spark, H.SPELLS.spark.dmg) > BA10.spellAmount(q0.B, q0.h, H.SPELLS.spark, H.SPELLS.spark.dmg), 'Угольный жезл: spells are stronger');
  const hurtBy = list => {
    const B = face({ stacks: [{ unit: 'plated', count: 10, c: 2, r: 5 }] }, dressed(list, [{ unit: 'plated', count: 10, c: 9, r: 5 }]));
    return BA10.spellDamage(B, q0.h, H.SPELLS.spark, B.stacks[1], 1000);
  };
  ok(hurtBy(['ashmantle']) < hurtBy([]), 'Пепельная мантия: less spell damage');
  ok(hurtBy(['thronehelm', 'thronecoat', 'throneshield', 'thronegreaves']) < hurtBy([]), 'Латы Белого престола: less spell damage');
  const heartQ = face(dressed(['heartplate'], [{ unit: 'plated', count: 10 }]), { stacks: [{ unit: 'plated', count: 10 }] });
  ok(BA10.hpOf(heartQ.stacks[0]) === Math.round(H.UNITS.plated.hp * 1.1) && heartQ.stacks[0].hp === BA10.hpOf(heartQ.stacks[0]), 'Панцирь старшего тура: more health');
  const winged = face(dressed(['skywing'], [{ unit: 'plated', count: 10, c: 2, r: 5 }]), { stacks: [{ unit: 'plated', count: 1, c: 12, r: 5 }] }, { ready: [100, 0] });
  ok(Math.max(...[...BA10.reach(winged, winged.stacks[0]).values()].map(p => p.steps)) === H.UNITS.plated.speed + 1, 'Крыло первой бури: speed +1');
  const ready = (list, foe) => {
    const B = BA10.create({ seed: 9, obstacles: [], ready: [10, 10], sides: [dressed(list, [{ unit: 'militia', count: 10, c: 1, r: 1 }]), dressed(foe || [], [{ unit: 'militia', count: 10, c: 12, r: 1 }])] });
    return B;
  };
  ok(ready(['readybell']).opening.filter(e => e.t === 'turn')[0].id === 0, 'Сигнальный колокол: own side moves first');
  ok(ready([], ['ancestorhorn']).opening.filter(e => e.t === 'turn')[0].id === 1, 'Рог предков: the enemy starts later');
  const luckQ = face(dressed(['fatebone'], [{ unit: 'militia', count: 10 }]), { stacks: [{ unit: 'militia', count: 10 }] });
  ok(luckQ.sides[0].hero.fortune, 'Кость судьбы: no bad luck');
  const mixed = dressed(['marchbanner'], [{ unit: 'militia', count: 10 }, { unit: 'shade', count: 10 }]), mixB = face(mixed, { stacks: [{ unit: 'militia', count: 10 }] }), noB = face(dressed([], [{ unit: 'militia', count: 10 }, { unit: 'shade', count: 10 }]), { stacks: [{ unit: 'militia', count: 10 }] });
  ok(mixB.sides[0].mix === 0 && noB.sides[0].mix === 1, 'Стяг всех родов: no penalty for mixed peoples');
  const tac = face(dressed(['warhorn'], [{ unit: 'militia', count: 10 }]), { stacks: [{ unit: 'militia', count: 10 }] });
  ok(tac.sides[0].hero.tactics >= 1, 'Походный рожок: a column of deployment');
  const bark = face(dressed(['livingbark'], [{ unit: 'plated', count: 10, c: 2, r: 5 }]), { stacks: [{ unit: 'militia', count: 1, c: 12, r: 5 }] }, { ready: [0, 0] });
  BA10.hurt(bark.stacks[0], 100);
  const barkLeft = BA10.total(bark.stacks[0]);
  for (const stop = bark.round + 1; bark.round < stop;) BA10.act(bark, { type: 'defend' });
  ok(BA10.total(bark.stacks[0]) > barkLeft, 'Живая кора: own stacks restore');
  const smith = face(dressed(['forgehammer', 'forgeapron', 'forgetongs'], [{ unit: 'plated', count: 10, c: 5, r: 5 }]), { stacks: [{ unit: 'militia', count: 300, c: 6, r: 5 }] }, { ready: [100, 0] });
  BA10.act(smith, { type: 'attack', target: 1, c: 5, r: 5 });
  const smithAfter = hitMax(smith);
  smith.stacks[0].forged = 0;
  ok(smithAfter > hitMax(smith), 'Кузнечная справа: each action adds damage');
  smith.stacks[0].forged = 0.05;
  smith.stacks[0].forged = 0.15;
  while (smith.active !== 0 && smith.winner < 0) BA10.act(smith, { type: 'defend' });
  BA10.act(smith, { type: 'attack', target: 1, c: 5, r: 5 });
  ok(smith.stacks[0].forged === 0.15, 'up to 15 %');
  const thick = face(dressed(['leshymoss', 'leshyroot', 'leshybark'], [{ unit: 'militia', count: 10 }]), { stacks: [{ unit: 'militia', count: 10 }] });
  ok(thick.obstacles.length === 1 && thick.temp.length === 1 && thick.temp[0].wound > 0, 'Лешачий наряд: a thicket at the start of a battle');

  const crown = plain(24, 12, [3, 3], [{ unit: 'plated', count: 40 }, { unit: 'militia', count: 40 }], [{ t: 'monster', c: 6, r: 3, unit: 'wolves', count: 20, mood: 'fierce' }]);
  const crownH = makeHero(crown, ['steppecrown', 'steppemace', 'steppering']);
  const crownP = Adv.path(crown, crownH, 6, 3);
  for (const s of crownP.steps) Adv.step(crown, crownH, s.c, s.r);
  const crownB = BA10.create(Object.assign({}, Adv.battleSetup(crown)));
  BA10.hurt(crownB.stacks[1], 40 * 6);
  crownB.stacks[1].hp = BA10.hpOf(crownB.stacks[1]);
  H.BattleAI.play(crownB, 60);
  const crownLeft = crownB.stacks[1].count;
  Adv.battleDone(crown, crownB);
  ok(crownB.winner === 0 && crownH.army[1].count >= crownLeft + Math.round((40 - crownLeft) * 0.25), 'Венец степей: a quarter of the fallen come back after a won battle');

  const shopT = plain(24, 12, [3, 3], [{ unit: 'militia', count: 5 }], [{ t: 'town', c: 8, r: 3, owner: 0, l: 0, faction: 'league', name: 'Палата', built: ['hall1', 'hall2', 'tavern', 'market', 'special4'] }]);
  shopT.players[0].res.gold = 40000;
  const palata = shopT.map.objs[0], stock = TW10.shop(shopT, palata);
  ok(stock.length === 3 && stock.every(id => H.ARTIFACTS[id] && !H.ARTIFACTS[id].scroll), 'Торговая палата sells three artifacts');
  ok(!TW10.buyArt(shopT, palata, 0).ok, 'only to a hero in town');
  [shopT.heroes[0].c, shopT.heroes[0].r] = MD.entry(palata);
  const artCost = H.ARTIFACTS[stock[0]].cost, artId = stock[0], g0 = shopT.players[0].res.gold;
  ok(TW10.buyArt(shopT, palata, 0).ok && shopT.players[0].res.gold === g0 - artCost && (Object.values(shopT.heroes[0].arts).includes(artId) || shopT.heroes[0].bag.includes(artId)), 'the hero gets the item for its price');
  ok(!TW10.buyArt(shopT, palata, 0).ok, 'an item is sold once');
  for (let i = 0; i < 7; i++) Adv.endDay(shopT);
  ok(TW10.shop(shopT, palata).every(Boolean), 'the stock is new every week');
  const noShop = plain(24, 12, [3, 3], [{ unit: 'militia', count: 5 }], [{ t: 'town', c: 8, r: 3, owner: 0, l: 0, faction: 'league', name: 'Т', built: ['hall1'] }]);
  ok(!TW10.shop(noShop, noShop.map.objs[0]).length, 'a town without the chamber sells nothing');
  const fairQ = plain(24, 12, [3, 3], [{ unit: 'militia', count: 5 }], [{ t: 'fair', c: 6, r: 3, l: 0, owner: -1 }]);
  fairQ.players[0].res.gold = 40000;
  H.OBJ_VISIT.fair(fairQ, fairQ.heroes[0], fairQ.map.objs[0], []);
  const fairCost = H.ARTIFACTS[fairQ.map.objs[0].art].cost;
  Adv.resolve(fairQ, 'buy');
  ok(fairQ.players[0].res.gold === 40000 - fairCost, 'Ярмарка sells at the price of the artifact');
  const wear = world([]);
  wear.h.arts.right = 'eldersword';
  wear.h.bag.push('moonblade', 'ashwand', 'scroll-spark');
  ok(HE10.wearBest(wear.h) && wear.h.arts.right === 'moonblade' && wear.h.bag.includes('eldersword') && wear.h.bag.includes('ashwand') && wear.h.bag.includes('scroll-spark'), 'the AI puts on the better item');
  const looted = world(['moonblade']), winner = world([]);
  ok(HE10.giveArts(looted.h, winner.h) && winner.h.arts.right === 'moonblade', 'a fallen hero leaves his artifacts to the winner');
  ok(arts.every(a => H.ART_SLOTS.some(([s]) => HE10.fits(a.id, s))), 'every artifact fits a place on the hero');
  const forgeAI = plain(24, 12, [3, 3], [{ unit: 'pikeman', count: 10 }, { unit: 'militia', count: 5 }], [{ t: 'changeforge', c: 6, r: 3, l: 0, owner: -1 }]);
  forgeAI.players[0].res.gold = 20000;
  forgeAI.players[0].human = false;
  H.AI.turn(forgeAI);
  ok(forgeAI.heroes[0].army.some(s => s && s.unit === 'shieldbearer'), 'a rich AI hero uses Кузня перемен');
  const hold = BA10.create({ seed: 2, obstacles: [], ready: [100, 0], sides: [{ stacks: [{ unit: 'plated', count: 5, c: 1, r: 5 }] }, { stacks: [{ unit: 'plated', count: 5, c: 12, r: 5 }] }] });
  let closer = null;
  for (let i = 0; i < 6 && hold.round <= 2; i++) {
    const a = H.BattleAI.choose(hold), s = hold.stacks[hold.active];
    if (a.type === 'move') closer = BA10.gap(s, a.c, a.r, hold.stacks[1 - s.id]);
    BA10.act(hold, a);
  }
  ok(closer === null || closer > H.UNITS.plated.speed + 1, 'the battle AI stops outside the reach of enemy walkers in the first rounds');
  const noWait = BA10.create({ seed: 2, obstacles: [], sides: [{ stacks: [{ unit: 'militia', count: 40 }] }, { stacks: [{ unit: 'militia', count: 40 }] }] });
  ok(H.BattleAI.play(noWait, 60) >= 0, 'two walking armies still meet and finish the battle');
}

{
  const MF = H.MapFile, SC = H.Script;
  const smallDoc = extra => {
    const doc = MF.blank(Object.assign({ w: 24, players: 2 }, extra || {}));
    MF.place(doc, 'town', 2, 2, 0, { owner: 0, faction: 'league', name: 'Свой', built: ['hall1', 'fort1', 'tavern', 'dwell1'] });
    MF.place(doc, 'town', 16, 2, 0, { owner: 1, faction: 'barrows', name: 'Чужой', built: ['hall1', 'fort1', 'tavern', 'dwell1'] });
    return doc;
  };
  const start = (doc, humanFirst) => {
    const def = H.Maps.play(doc, { seed: 4, slots: doc.players.map((p, i) => ({ faction: i ? 'barrows' : 'league', human: i === 0 && humanFirst !== false })) });
    return Adv.create(def.map, def.setup);
  };

  for (const rec of H.Maps.LIST.filter(r => r.make)) {
    const doc = H.MapFile.fromMade(rec, rec.make()), text = MF.write(doc), back = MF.read(text);
    ok(MF.write(back) === text, rec.id + ': save, open, the same map');
    ok(JSON.stringify(back.map.ter) === JSON.stringify(doc.map.ter) && JSON.stringify(back.map.road) === JSON.stringify(doc.map.road) && JSON.stringify(back.map.over) === JSON.stringify(doc.map.over) && JSON.stringify(back.map.objs) === JSON.stringify(doc.map.objs), rec.id + ': terrain, roads, fields and objects come back unchanged');
    const file = read('content/heroes98/maps/' + rec.id + '.h98m');
    ok(file === text, rec.id + ': the file in the game equals the map maker');
    ok(!MF.blocking(MF.check(MF.read(file))).length, rec.id + ': the file passes the map check');
    ok(file.length < 1024 * 1024, rec.id + ': the file is under 1 MB');
    const slots = rec.players === 2 ? [{ faction: 'league' }, { faction: 'barrows' }] : [{ faction: 'league' }, { faction: 'barrows' }, null, { faction: 'barrows' }];
    const a = H.Maps.play(MF.read(file), { seed: 7, slots }), b = H.Maps.build(rec.id, { seed: 7, slots });
    ok(JSON.stringify(a) === JSON.stringify(b), rec.id + ': a game from the file equals a game from the maker');
  }
  const huge = MF.blank({ w: 144, levels: 2, players: 8 });
  for (let i = 0; i < huge.map.ter[0].length; i++) huge.map.ter[0][i] = i % 14;
  ok(MF.write(huge).length < 1024 * 1024, 'a huge two-level map with busy terrain stays under 1 MB');
  ok(MF.write(MF.read(MF.write(huge))) === MF.write(huge), 'a huge map survives the round trip');
  for (const bad of ['nothing', '{"game":"other"}', JSON.stringify({ game: MF.GAME, v: MF.VERSION + 1 })]) {
    let threw = false;
    try {
      MF.read(bad);
    } catch (e) {
      threw = true;
    }
    ok(threw, 'a foreign or newer file is refused');
  }
  const cut = JSON.parse(MF.write(smallDoc()));
  cut.ter[0] = 'AAAA';
  let cutThrew = false;
  try {
    MF.read(JSON.stringify(cut));
  } catch (e) {
    cutThrew = true;
  }
  ok(cutThrew, 'a damaged terrain layer is refused');

  const issue = (doc, part) => MF.check(doc).some(x => x.text.includes(part));
  ok(!MF.blocking(MF.check(smallDoc())).length, 'a clean small map has no errors');
  const noStart = MF.blank({ w: 24, players: 2 });
  ok(issue(noStart, 'без старта'), 'the check finds a player without a start');
  const allAi = smallDoc();
  allAi.players.forEach(p => { p.who = 'ai'; });
  ok(issue(allAi, 'только ИИ'), 'the check finds a map with no place for a human');
  const crossed = smallDoc();
  MD.add(crossed.map, { t: 'goldmine', c: 3, r: 3, l: 0, owner: -1 });
  ok(issue(crossed, 'Следы пересекаются'), 'the check finds crossing footprints');
  const walled = smallDoc();
  MD.paint(walled.map, 0, 'rock', (c, r) => c === 10);
  const far = MF.place(walled, 'goldmine', 13, 12, 0).obj;
  MD.paint(walled.map, 0, 'rock', (c, r) => c >= 12 && r >= 11 && !(c >= far.c && c < far.c + 3 && r >= far.r && r < far.r + 2));
  MD.paint(walled.map, 0, 'rock', (c, r) => c >= 12 && r === 14);
  ok(issue(walled, 'не дойдёт до города'), 'the check finds a player who cannot reach an enemy town');
  ok(issue(walled, 'Недостижимо: Золотой прииск'), 'the check finds an object nobody can reach');
  const treasure = smallDoc();
  MF.place(treasure, 'artifact', 10, 10, 0, { art: 'moonblade' });
  ok(issue(treasure, 'Ценное без охраны'), 'the check finds a relic without a guard');
  MF.place(treasure, 'monster', 11, 11, 0, { unit: 'wolves', count: 5, max: 15, mood: 'hostile' });
  ok(!issue(treasure, 'Ценное без охраны'), 'a guard next to it clears the note');
  const broken = smallDoc();
  broken.events.push({ on: 'visit', tag: 'nowhere', go: 'missing' });
  broken.scenes = '@a\nflag ghost 0\ngate open ghost\nspawn monster nobody 5 hostile 1 1\ngive art nothing\nscene absent\nnonsense word\nif flag never\nend';
  for (const part of ['нет сцены @missing', 'нет метки nowhere', 'нет метки ghost', 'нет существа nobody', 'нет артефакта nothing', 'нет метки @absent', 'Неизвестная команда: nonsense', 'флаг never нигде не ставится']) ok(issue(broken, part), 'the check finds a broken event or scene: ' + part);
  const unlinked = smallDoc();
  MF.place(unlinked, 'portal2', 6, 8, 0);
  ok(issue(unlinked, 'нет второго конца'), 'the check finds a portal without a second end');
  const twoTags = smallDoc();
  twoTags.map.objs[0].tag = 'same';
  twoTags.map.objs[1].tag = 'same';
  ok(issue(twoTags, 'Метка повторяется'), 'the check finds a repeated tag');
  const noHeart = smallDoc();
  noHeart.goals.win = [{ kind: 'heart' }];
  ok(issue(noHeart, 'Сердце на карте не задано'), 'the check finds a Heart goal without a Heart');
  const offMap = smallDoc();
  MD.add(offMap.map, { t: 'mountain', c: 23, r: 23, l: 0, owner: -1 });
  ok(issue(offMap, 'за краем карты'), 'the check finds an object off the map');
  const dry = smallDoc();
  MD.add(dry.map, { t: 'boat', c: 10, r: 10, l: 0, owner: -1 });
  ok(issue(dry, 'стоит не на воде'), 'the check finds a boat on land');
  const sea = smallDoc();
  MD.paint(sea.map, 0, 'water', (c, r) => r >= 12);
  MD.paint(sea.map, 0, 'meadow', (c, r) => r >= 20);
  const island = MF.place(sea, 'goldmine', 10, 21, 0).obj;
  ok(issue(sea, 'Недостижимо: Золотой прииск'), 'an island without a boat cannot be reached');
  MF.place(sea, 'boat', 10, 12, 0);
  ok(!issue(sea, 'Недостижимо') && !!island, 'a boat at the shore opens the island');

  const edit = MF.blank({ w: 24 });
  ok(MF.whyNot(edit, 'town', 22, 22, 0, null) === 'Не помещается на карте', 'the editor refuses an object off the map');
  const first = MF.place(edit, 'town', 4, 4, 0, { faction: 'league', name: 'А', built: [] });
  ok(first.ok && MF.place(edit, 'goldmine', 5, 5, 0).why === 'Место занято другим объектом', 'the editor refuses crossing footprints');
  ok(MF.whyNot(edit, 'boat', 15, 15, 0, null) === 'Этот объект ставится только на воду', 'a boat goes only on water');
  MD.paint(edit.map, 0, 'rock', (c, r) => c === 12 && r === 12);
  ok(MF.whyNot(edit, 'goldmine', 11, 11, 0, null) === 'Здесь нельзя строить: вода или скалы', 'nothing is built on rocks');
  ok(!MF.whyNot(edit, 'town', 4, 4, 0, first.obj), 'an object may be moved over its own place');
  MF.brush(edit.map, 0, 'water', 18, 18, 3);
  ok(MD.terrainAt(edit.map, 0, 17, 17).id === 'water' && MD.terrainAt(edit.map, 0, 19, 19).id === 'water' && MD.terrainAt(edit.map, 0, 20, 19).id === 'meadow', 'a brush of 3 paints 3 by 3 cells');
  ok(MF.fill(edit.map, 0, 'sand', 18, 18) === 9 && MD.terrainAt(edit.map, 0, 18, 18).id === 'sand', 'the fill paints the connected area only');
  MF.river(edit.map, 0, 2, [[0, 0], [5, 0]]);
  ok(MD.riverAt(edit.map, 0, 3, 0) === 2 && MF.read(MF.write(edit)).map.river[0][3] === 2, 'a river is drawn by a line and kept in the file');
  MD.road(edit.map, 0, 1, [[0, 20], [6, 20]]);
  ok(MD.roadAt(edit.map, 0, 4, 20) === 1, 'a road is drawn by a line');
  MF.brushField(edit.map, 0, 'moonglade', 20, 4, 1);
  ok(MD.fieldAt(edit.map, 0, 20, 4) === 'moonglade', 'a special field is painted');
  const pA = MF.place(edit, 'portal2', 8, 16, 0).obj, pB = MF.place(edit, 'portal2', 14, 8, 0).obj;
  pA.link = pB.id;
  pB.link = pA.id;
  edit.players[0].town = first.obj.id;
  MF.removeObj(edit, pB);
  ok(pA.link === undefined, 'removing a portal clears the link to it');
  MF.removeObj(edit, first.obj);
  ok(edit.players[0].town === null, 'removing a start town clears the start');

  ok(!SC.parse('@a\nsay Привет\nend').errors.length, 'a simple scene parses');
  ok(SC.parse('say Вне метки').errors.length === 1, 'a line outside a label is an error');
  ok(SC.parse('@a\nchoice\n- Да\n').errors.length === 1, 'an open block is an error');
  ok(SC.parse('@a\n@a').errors.length === 1, 'a repeated label is an error');
  ok(SC.parse('@a\nelse').errors.length === 1, 'else without if is an error');
  ok(SC.parse('@a\nchoice\nend').errors.length === 1, 'a choice without answers is an error');
  for (const line of ['day 3 -> a', 'cell 4 5 1 -> a', 'visit mill -> a', 'defeat raid3 any -> a', 'capture t1 player 1 -> a', 'res gold 5000 repeat -> a', 'flag done -> a']) ok(SC.eventText(SC.parseEvent(line)) === line, 'an event line reads and writes back: ' + line);
  ok(SC.parseEvent('week 3 -> a').day === 15, 'week 3 starts on day 15');
  ok(!SC.parseEvent('someday -> a') && !SC.parseEvent('day x -> a') && !SC.parseEvent('day 3'), 'a bad event line is refused');
  const planText = '@n1_dawn\nshow adelina left captain\nshow bellman right\nbellman: Третий набат за ночь, капитан. Звонить ещё?\nadelina: Звони, пока весь Брод не проснётся.\ngoal add raids "Отбить три набега на сёла"\nend\nevent day 1 -> n1_dawn';
  const planned = SC.parse(planText);
  ok(!planned.errors.length && planned.events.length === 1 && planned.ops.filter(o => o.k === 'line').map(o => o.id).join() === 'n1_dawn.0,n1_dawn.1', 'the example from the plan parses, every line has its id');
  ok(SC.block('@a\nsay 1\n@b\nsay 2', 'a') === 'say 1' && SC.setBlock('@a\nsay 1\n@b\nsay 2', 'a', 'say 3') === '@a\nsay 3\n@b\nsay 2' && SC.dropBlock('@a\nsay 1\n@b\nsay 2', 'a') === '@b\nsay 2', 'the editor changes one scene and leaves the others');

  const talk = smallDoc();
  talk.events.push({ on: 'day', day: 1, go: 'hello' });
  talk.scenes = '@hello\nshow renier left "Капитан"\nrenier: Первая реплика.\nsay Вторая строка.\nchoice\n- Взять золото -> rich\n- Взять дерево\nend\ngive wood 7\nend\n@rich\ngive gold 777\nend';
  const SA = start(talk), before = SA.players[0].res.gold, wood = SA.players[0].res.wood, heroA = SA.heroes[0];
  const openEv = SC.opening(SA);
  ok(openEv.some(e => e.t === 'scene') && SA.scene.name === 'Капитан' && SA.scene.text === 'Первая реплика.' && SA.scene.shown[0].side === 'left', 'a day 1 event opens a scene with a speaker');
  ok(!Adv.step(SA, heroA, heroA.c + 1, heroA.r + 1).ok && !Adv.endTurn(SA).length, 'a scene stops moves and the end of the day');
  ok(H.AI.step(SA, H.AI.begin(SA, 1)).ev.length === 0 && !H.AI.step(SA, H.AI.begin(SA, 1)).done, 'the AI waits while a scene is shown');
  const copyA = H.Save.unpack(H.Save.pack(SA));
  ok(copyA.scene.text === 'Первая реплика.' && copyA.script.run.pc === SA.script.run.pc, 'a scene survives a save');
  SC.advance(SA);
  ok(SA.scene.text === 'Вторая строка.' && !SA.scene.name, 'say is a line without a speaker');
  SC.advance(SA);
  ok(SA.scene.choice.join() === 'Взять золото,Взять дерево', 'a choice waits for an answer');
  SC.advance(SA, 1);
  ok(!SA.scene && !SA.script.run && SA.players[0].res.wood === wood + 7 && SA.players[0].res.gold === before, 'an answer without a label goes on after the block');
  ok(SA.script.read.includes('hello.0') && SA.script.done.includes(0), 'read lines and done events are remembered');
  SC.poll(SA, []);
  ok(!SA.scene && SA.script.done.length === 1, 'an event fires once');
  const SA2 = start(talk);
  SC.opening(SA2);
  SC.advance(SA2);
  SC.advance(SA2);
  SC.advance(SA2, 0);
  ok(SA2.players[0].res.gold === before + 777 && SA2.players[0].res.wood === wood, 'an answer with a label jumps to that scene');
  const SA3 = start(talk, false);
  SC.opening(SA3);
  ok(!SA3.scene && !SA3.script.run && SA3.players[0].res.gold >= 777, 'without a human a scene runs through and takes the first answer');

  const trig = smallDoc();
  const pile = MF.place(trig, 'res-gold', 7, 5, 0, { tag: 'pile', amount: 100 }).obj;
  const mob = MF.place(trig, 'monster', 20, 20, 0, { unit: 'wolves', count: 1, max: 3, mood: 'hostile', tag: 'raid' }).obj;
  const mine = MF.place(trig, 'sawmill', 10, 16, 0, { tag: 'saw' }).obj;
  trig.events.push({ on: 'visit', tag: 'pile', go: 'v' }, { on: 'cell', c: 5, r: 5, l: 0, go: 'c' }, { on: 'defeat', tag: 'raid', go: 'd' }, { on: 'capture', tag: 'saw', go: 'x' }, { on: 'res', res: 'gold', n: 90000, go: 'r' }, { on: 'flag', flag: 'mark', go: 'f' }, { on: 'day', day: 3, go: 'y' });
  trig.scenes = '@v\nset seen_v\nend\n@c\nset seen_c\nend\n@d\nset seen_d\nend\n@x\nset seen_x\nend\n@r\nset seen_r\nset mark\nend\n@f\nset seen_f\nend\n@y\nset seen_y\nend';
  const ST = start(trig), hT = ST.heroes[0], fl = ST.script.flags;
  ok(hT.c === 4 && hT.r === 4, 'the hero starts at the gate of his town');
  Adv.step(ST, hT, 5, 5);
  ok(fl.seen_c && !fl.seen_v, 'stepping on a cell fires its event');
  Adv.step(ST, hT, 6, 5);
  Adv.step(ST, hT, 7, 5);
  ok(fl.seen_v, 'visiting a tagged object fires its event');
  Adv.obj(ST, mob.id).gone = true;
  Adv.conclude(ST, []);
  ok(fl.seen_d, 'a tagged squad that is gone fires the defeat event');
  ST.map.objs.find(o => o.id === mine.id).owner = 0;
  Adv.conclude(ST, []);
  ok(fl.seen_x, 'a captured object fires its event');
  ST.players[0].res.gold = 95000;
  Adv.conclude(ST, []);
  ok(fl.seen_r && fl.seen_f, 'a resource fires its event, and a flag set there fires the next one');
  ok(!fl.seen_y, 'a later day has not fired yet');
  ST.day = 3;
  Adv.conclude(ST, []);
  ok(fl.seen_y, 'the day event fires on its day');
  ok(!!pile, 'the pile was placed');

  const cmd = smallDoc();
  MF.place(cmd, 'goldmine', 8, 14, 0, { tag: 'mine' });
  MF.place(cmd, 'tree', 12, 12, 0, { tag: 'wall' });
  cmd.events.push({ on: 'day', day: 1, go: 'all' });
  cmd.scenes = '@all\ngive gold 1000\ntake wood 2\ngive art moonblade\ngive xp 500\ngive unit militia 9\ngive spell spark\nspawn monster wolves 7 fierce 14 14 0 born\nspawn obj res-wood 15 15\nspawn hero aisulu 1 18 18 0 enemy\nreveal all\nterrain water 20 20 2 2\nflag mine 1\ngate open wall\nmoon gold\ngoal add g1 Первая цель\ngoal add g2 Вторая цель\ngoal done g1\ngoal fail g2\ngoal lose day 40\nif day 5\ngive gold 1\nelse\ngive gold 2\nend\nif not flag nope\ngive gold 4\nend\nif res gold 1\ngive gold 8\nend\nif owns mine\ngive gold 16\nend\nif beaten wall\ngive gold 32\nend\nscene more\ngive gold 64\nend\n@more\ngive ore 3\nend';
  const SC1 = start(cmd, false), base = { gold: H.MAP.start.gold, wood: H.MAP.start.wood, ore: H.MAP.start.ore };
  SC.opening(SC1);
  const me = SC1.players[0], her = SC1.heroes[0];
  ok(me.res.gold === base.gold + 1000 + 2 + 4 + 8 + 32 + 64 && me.res.wood === base.wood - 2 && me.res.ore === base.ore + 3, 'give, take, if, else and scene work in order');
  ok(Object.values(her.arts).includes('moonblade') && her.xp === 500 && her.army.some(s => s && s.unit === 'militia' && s.count >= 9) && her.spells.includes('spark'), 'a hero gets an artifact, experience, creatures and a spell');
  const born = SC1.map.objs.find(o => o.tag === 'born');
  ok(born && born.count === 7 && born.max === 21 && born.mood === 'fierce' && SC1.map.objs.some(o => o.t === 'res-wood'), 'spawn places a squad and an object');
  ok(SC1.heroes.some(h => h.tag === 'enemy' && h.hid === 'aisulu' && h.owner === 1), 'spawn places a hero');
  ok(me.seen[0].every(Boolean), 'reveal opens the fog');
  ok(MD.terrainAt(SC1.map, 0, 21, 21).id === 'water' && MD.terrainAt(SC1.map, 0, 22, 21).id !== 'water', 'terrain changes a rectangle');
  ok(SC1.map.objs.find(o => o.tag === 'mine').owner === 1, 'flag sets the owner');
  ok(SC1.map.objs.find(o => o.tag === 'wall').gone === true, 'gate open takes a passage block away');
  ok(H.Moons.current(SC1).id === 'gold', 'moon changes the moon of the week');
  ok(SC1.script.goals.map(g => g.state).join() === 'done,fail' && SC1.goals.lose[1].day === 40, 'goals are added, closed and the lose rule changes');
  const finish = smallDoc();
  finish.events.push({ on: 'day', day: 2, go: 'w' });
  finish.scenes = '@w\nwin\nend';
  const SW = start(finish);
  Adv.endTurn(SW);
  Adv.endTurn(SW);
  ok(SW.over && SW.over.winner === 0 && SW.over.why === 'script', 'win ends the game for the player');
  finish.scenes = '@w\nlose\nend';
  const SL = start(finish);
  Adv.endTurn(SL);
  Adv.endTurn(SL);
  ok(SL.over && SL.over.winner === -1, 'lose ends the game');
  const flagWin = smallDoc();
  flagWin.goals.win = [{ kind: 'flag', flag: 'ok', text: 'Зажечь маяк' }];
  flagWin.events.push({ on: 'day', day: 1, go: 'a' });
  flagWin.scenes = '@a\nset ok\nend';
  const SF = start(flagWin);
  ok(Adv.goalText(SF.map, SF.goals).win[0] === 'Зажечь маяк', 'a flag goal shows its own text');
  SC.opening(SF);
  ok(SF.over && SF.over.why === 'flag', 'a flag can win the game');
  const loop = smallDoc();
  loop.events.push({ on: 'day', day: 1, go: 'a' });
  loop.scenes = '@a\nscene a\nend';
  const SLoop = start(loop, false), loopEv = SC.opening(SLoop);
  ok(loopEv.some(e => e.t === 'note') && !SLoop.script.run, 'an endless scene is stopped');
  const queued = smallDoc();
  queued.events.push({ on: 'day', day: 1, go: 'a' }, { on: 'day', day: 1, go: 'b' });
  queued.scenes = '@a\nsay Раз\nend\n@b\nsay Два\nend';
  const SQ = start(queued);
  SC.opening(SQ);
  ok(SQ.scene.text === 'Раз', 'the first of two events speaks first');
  SC.advance(SQ);
  ok(SQ.scene.text === 'Два', 'the second waits its turn');

  const hello = smallDoc();
  const noteMob = MF.place(hello, 'monster', 6, 6, 0, { unit: 'wolves', count: 1, max: 3, mood: 'hostile', msg: 'Они ждали вас.' }).obj;
  const noteSite = MF.place(hello, 'well', 6, 10, 0, { msg: 'Вода пахнет железом.' }).obj;
  const SM = start(hello), hM = SM.heroes[0];
  const evM = Adv.step(SM, hM, 5, 5).ev;
  ok(evM.some(e => e.t === 'read' && e.text === 'Они ждали вас.') && !Adv.obj(SM, noteMob.id).msg, 'a squad gives its message once');
  Adv.resolve(SM, 'retreat');
  hM.c = 6;
  hM.r = 9;
  const evS = Adv.step(SM, hM, 6, 10).ev;
  ok(evS.some(e => e.t === 'read' && e.text === 'Вода пахнет железом.') && !Adv.obj(SM, noteSite.id).msg, 'an object gives its message once');

  const three = MF.blank({ w: 24, players: 3 });
  MF.place(three, 'town', 2, 2, 0, { owner: 0, faction: 'league', name: 'А', built: ['hall1'] });
  MF.place(three, 'town', 16, 2, 0, { owner: 1, faction: 'barrows', name: 'Б', built: ['hall1'] });
  MF.place(three, 'town', 2, 16, 0, { owner: 2, faction: 'barrows', name: 'В', built: ['hall1'] });
  MF.place(three, 'sawmill', 16, 16, 0, { owner: 2 });
  three.events.push({ on: 'day', day: 1, go: 'g' });
  three.scenes = '@g\ngive gold 5 player 2\nend';
  const def3 = H.Maps.play(three, { seed: 2, slots: [{ faction: 'league', human: true }, null, { faction: 'barrows' }] }), S3 = Adv.create(def3.map, def3.setup);
  ok(S3.players.length === 2 && S3.players[1].color === 2, 'an empty slot drops out and colors stay');
  ok(def3.map.objs.find(o => o.name === 'В').owner === 1 && def3.map.objs.find(o => o.name === 'Б').owner === -1 && def3.map.objs.find(o => o.t === 'sawmill').owner === 1, 'owners follow the players that stay');
  const gold3 = S3.players[1].res.gold;
  SC.opening(S3);
  ok(S3.players[1].res.gold === gold3 + 5, 'a scene names a player by the number on the map');

  const beat = MF.blank({ w: 24, players: 1 });
  beat.heroes.push({ owner: 0, hid: 'renier', c: 2, r: 2, l: 0, army: [{ unit: 'militia', count: 50 }], arts: ['couriers'], skills: null, xp: 300, patrol: 4, tag: 'captain' });
  MF.place(beat, 'res-gold', 4, 4, 0);
  MF.place(beat, 'res-wood', 20, 20, 0);
  beat.goals = { win: [{ kind: 'flag', flag: 'never', text: 'Ждать' }], lose: [{ kind: 'all' }] };
  const SB = start(beat, false), hB = SB.heroes[0];
  ok(hB.hid === 'renier' && hB.tag === 'captain' && hB.xp === 300 && Object.values(hB.arts).includes('couriers') && hB.army[0].count === 50 && hB.patrol.rad === 4, 'a placed hero keeps template, tag, experience, things and army');
  for (let d = 0; d < 4; d++) {
    H.AI.turn(SB);
    Adv.endTurn(SB);
  }
  ok(SB.map.objs.find(o => o.t === 'res-gold').gone, 'an AI hero takes what lies on his beat');
  ok(!SB.map.objs.find(o => o.t === 'res-wood').gone, 'and does not leave his patrol radius');

  const ban = smallDoc();
  ban.map.objs[0].forbid = ['market'];
  const SBan = start(ban);
  ok(TW.state(SBan, SBan.map.objs[0], 'market').s === 'forbidden' && TW.state(SBan, SBan.map.objs[1], 'market').s !== 'forbidden', 'a town forbids a building for itself only');
  ban.map.objs[0].built = ['hall1', 'dwell1'];
  ban.map.objs[0].garrison = [{ unit: 'militia', count: 11 }];
  const SG = start(ban), townG = SG.map.objs[0];
  ok(townG.built.includes('dwell1') && !townG.built.includes('tavern') && townG.garrison[0].count === 11 && townG.name === 'Свой', 'a town keeps its buildings, garrison and name');

  const custom = MF.blank({ w: 48, players: 2 });
  MF.place(custom, 'town', 2, 2, 0, { owner: 0, faction: 'league', name: 'Свой', built: ['hall1', 'fort1', 'tavern', 'dwell1'] });
  MF.place(custom, 'town', 40, 40, 0, { owner: 1, faction: 'barrows', name: 'Чужой', built: ['hall1', 'fort1', 'tavern', 'dwell1'] });
  MF.place(custom, 'goldmine', 9, 14, 0);
  MF.place(custom, 'monster', 11, 16, 0, { unit: 'wolves', count: 4, max: 12, mood: 'hostile', tag: 'band' });
  custom.events.push({ on: 'day', day: 2, go: 'a' }, { on: 'defeat', tag: 'band', who: 'any', go: 'b' });
  custom.scenes = '@a\nspawn monster shade 3 hostile 12 8\nsay Идут.\nend\n@b\nreveal 12 16 6\nend';
  const SP = start(MF.read(MF.write(custom)), false);
  for (let t = 0; t < 40 && !SP.over; t++) {
    H.AI.turn(SP);
    Adv.endTurn(SP);
  }
  ok(!SP.scene && SP.day >= 2 && SP.script.done.includes(0) && SP.map.objs.some(o => o.unit === 'shade'), 'bots play a map from the editor with events');

  const old = JSON.parse(H.Save.pack(start(smallDoc())));
  old.v = 3;
  delete old.S.script;
  delete old.S.scene;
  delete old.S.map.river;
  const moved = H.Save.unpack(JSON.stringify(old));
  ok(moved.script.flags && moved.scene === null && moved.map.river[0].length === 24 * 24, 'a save of version 3 is carried over');
  await H.Save.maps.put({ id: 'own-1', name: 'Своя', w: 24, players: 2, when: 1, text: MF.write(smallDoc()) });
  const rows = await H.Save.maps.all();
  ok(rows.length === 1 && MF.read(rows[0].text).players.length === 2 && (await H.Save.maps.get('own-1')).name === 'Своя', 'own maps are stored apart from the saves');
  ok(!(await H.Save.list()).some(m => m.id === 'own-1'), 'and do not show up among the saves');
  await H.Save.maps.del('own-1');
  ok(!(await H.Save.maps.all()).length, 'an own map can be deleted');
  const ed = read(`${DIR}/he-editor.js`);
  for (const part of ['Новая...', 'Открыть...', 'Сохранить', 'Импорт...', 'Экспорт', 'Свойства...', 'Игроки...', 'Условия...', 'Проверить', 'Играть']) ok(ed.includes("'" + part + "'"), 'the editor menu has ' + part);
  ok(read('js/apps/heroes98-app.js').includes('openEditor'), 'the window wrapper opens the editor');
  ok(!read('js/game-manager.js').includes('heroes98'), 'the game is not in the catalog before the Steam stage');
}

{
  const R = H.Rmg, MF = H.MapFile, ids = Object.keys(R.TEMPLATES);
  ok(ids.join() === 'duel,ring,bowl,star,islands,under,eight', 'seven templates');
  const span = id => R.TEMPLATES[id].min + '-' + R.TEMPLATES[id].max;
  ok(span('duel') === '2-2' && span('ring') === '2-8' && span('bowl') === '2-6' && span('star') === '4-8' && span('islands') === '2-6' && span('under') === '2-4' && span('eight') === '8-8', 'player ranges follow the plan');
  ok(R.playersFor('eight', 48).length === 0 && R.playersFor('eight', 80).join() === '8' && R.sizesFor('ring', 8).join() === '80,112,144' && R.sizesFor('ring', 2).join() === '48,80,112,144', 'eight players need at least a medium map');
  const options = (id, w, k) => {
    const counts = R.playersFor(id, w), n = counts[k % counts.length], factions = ['league', 'barrows', 'random'];
    return { template: id, w, levels: k % 3 === 2 ? 2 : 1, water: R.TEMPLATES[id].sea ? 'many' : ['none', 'few', 'many'][k % 3], neutrals: Object.keys(R.STRENGTH)[k % 4], seed: 5000 + k * 7919, players: Array.from({ length: n }, (_, i) => ({ faction: factions[(i + k) % 3] })) };
  };
  const SWEEP = 200;
  for (const id of ids) {
    const w = R.sizesFor(id, R.TEMPLATES[id].max).includes(48) ? 48 : R.sizesFor(id, R.TEMPLATES[id].min)[0];
    let passed = 0, logged = true, valuesFair = true, stairsPaired = true, yards = true, clean = true;
    for (let k = 0; k < SWEEP; k++) {
      const o = options(id, w, k), r = R.make(o);
      if (!r.doc) continue;
      passed++;
      if (r.log.length !== r.tries - 1 || r.seed !== (o.seed >>> 0) + r.tries - 1) logged = false;
      if (R.verify(r.doc, r.meta).length) clean = false;
      const values = r.meta.starts.map(s => s.value), mean = values.reduce((t, v) => t + v, 0) / values.length;
      if (values.some(v => Math.abs(v - mean) > mean * 0.05)) valuesFair = false;
      const byId = new Map(r.doc.map.objs.map(x => [x.id, x]));
      for (const [a, b] of r.meta.stairs) if (byId.get(a).link !== b || byId.get(b).link !== a || byId.get(a).l === byId.get(b).l) stairsPaired = false;
      if (r.meta.sea && r.meta.starts.some(s => !byId.get(s.yard) || byId.get(s.yard).t !== 'shipyard')) yards = false;
    }
    ok(passed === SWEEP, id + ': ' + SWEEP + ' of ' + SWEEP + ' maps pass the check, got ' + passed);
    ok(clean, id + ': a finished map has nothing left in the check');
    ok(logged, id + ': a failed try moves to the next seed and is written to the log');
    ok(valuesFair, id + ': start zones are equal within 5 %');
    ok(stairsPaired, id + ': passages between levels are paired');
    ok(yards, id + ': on water maps every start zone has a shipyard');
  }
  const base = { template: 'ring', w: 48, levels: 1, water: 'none', neutrals: 'normal', seed: 4242, players: [{ faction: 'league' }, { faction: 'barrows' }] };
  const one = R.make(base), again = R.make(base), other = R.make(Object.assign({}, base, { seed: 4243 + 16 }));
  ok(MF.write(one.doc) === MF.write(again.doc), 'the same settings and seed give the same map');
  ok(MF.write(one.doc) !== MF.write(other.doc), 'another seed gives another map');
  ok(MF.write(MF.read(MF.write(one.doc))) === MF.write(one.doc), 'a random map survives the map file');
  const nope = R.make({ template: 'eight', w: 24, seed: 7, tries: 3, players: Array.from({ length: 8 }, () => ({ faction: 'league' })) });
  ok(!nope.doc && nope.log.length === 3 && nope.log.every(l => l.why.length > 3) && nope.log[2].seed === 9, 'an impossible map tries the next seeds, writes why and gives up');
  const water = (w, kind) => R.make(Object.assign({}, base, { w, water: kind, seed: 900 })).doc.map.ter[0].filter(v => v === H.TERRAIN_INDEX.water).length;
  ok(water(48, 'none') === 0, 'no water when the setting says none');
  ok(water(80, 'many') > water(80, 'few') && water(80, 'many') > 200, 'many water is more than few');
  const force = id => R.make(Object.assign({}, base, { template: id, water: 'none', seed: 77 })).meta.sea;
  ok(force('bowl') && force('islands') && !force('ring'), 'the sea templates always have a sea');
  const mobs = neutrals => R.make(Object.assign({}, base, { neutrals, seed: 321 })).doc.map.objs.filter(x => x.t === 'monster').reduce((t, x) => t + x.count * H.UNITS[x.unit].cost, 0);
  ok(mobs('weak') < mobs('normal') && mobs('normal') < mobs('strong') && mobs('strong') < mobs('fierce'), 'the neutrals setting scales the guards');
  const twoLevels = R.make(Object.assign({}, base, { levels: 2, seed: 88 }));
  ok(twoLevels.doc.map.levels === 2 && twoLevels.meta.stairs.length >= 2 && twoLevels.doc.map.objs.some(x => x.l === 1 && x.t === 'monster'), 'the Underworld setting adds a level with paired passages and guards');
  const under = R.make(Object.assign({}, base, { template: 'under', seed: 55 }));
  ok(under.doc.map.levels === 2 && under.meta.stairs.length === 2, 'the Underworld template always has two levels and one passage per player');
  const noWalk = doc => {
    const M = doc.map, seen = new Set(), [a, b] = doc.players.map(p => M.objs.find(x => x.id === p.town)), start = MD.entry(a), goal = MD.entry(b), stack = [start];
    seen.add(start[1] * M.w + start[0]);
    const taken = new Set();
    for (const x of M.objs) {
      if (x.l === 0 && H.OBJ[x.t].kind !== 'monster') {
        const e = MD.entry(x);
        for (const [c, r] of MD.cells(x)) if (!(e && e[0] === c && e[1] === r)) taken.add(r * M.w + c);
      }
    }
    while (stack.length) {
      const [c, r] = stack.pop();
      if (c === goal[0] && r === goal[1]) return false;
      for (const [dc, dr] of H.Path.DIRS) {
        const x = c + dc, y = r + dr;
        if (!MD.inside(M, x, y) || seen.has(y * M.w + x) || taken.has(y * M.w + x) || !MD.groundCost(M, 0, x, y)) continue;
        seen.add(y * M.w + x);
        stack.push([x, y]);
      }
    }
    return true;
  };
  ok(noWalk(under.doc), 'on the Underworld template the neighbours are not joined on the surface');
  const star = R.make({ template: 'star', w: 80, levels: 1, water: 'none', neutrals: 'normal', seed: 31, players: Array.from({ length: 4 }, (_, i) => ({ faction: i % 2 ? 'barrows' : 'league' })) });
  ok(star.doc && star.meta.starts.length === 4, 'the star template builds for four players');
  const isles = R.make(Object.assign({}, base, { template: 'islands', seed: 12 }));
  ok(noWalk(isles.doc), 'islands are not joined by land');
  ok(isles.doc.map.objs.filter(x => x.t === 'boat').length >= 2 && isles.doc.map.objs.filter(x => x.t === 'shipyard').every(y => MD.isWater(isles.doc.map, 0, y.dock[0], y.dock[1])), 'every island starts with a boat and a dock on water');
  const teams = R.make({ template: 'ring', w: 80, levels: 1, water: 'none', neutrals: 'normal', seed: 64, players: [{ faction: 'league', team: 0 }, { faction: 'league', team: 1 }, { faction: 'league', team: 0 }, { faction: 'league', team: 1 }] });
  const ring = teams.meta.starts.map(s => teams.doc.players[s.player].team), split = ring.filter((t, i) => t !== ring[(i + 1) % ring.length]).length;
  ok(split === 2 && teams.doc.players.every((p, i) => p.team === i % 2), 'allies stand next to each other');
  const chosen = R.make({ template: 'ring', w: 48, levels: 1, water: 'none', neutrals: 'normal', seed: 15, players: [{ faction: 'random' }, { faction: 'random' }] });
  ok(chosen.factions.every(f => H.FACTIONS[f]) && chosen.doc.players.every((p, i) => chosen.doc.map.objs.find(x => x.id === p.town).faction === chosen.factions[i]), 'random factions are resolved and towns follow them');
  const home = R.make(Object.assign({}, base, { seed: 20 })), first = home.doc.map.objs.find(x => x.id === home.doc.players[0].town);
  ok(MD.terrainAt(home.doc.map, 0, first.c + 2, first.r + 3).id === 'meadow' || MD.roadAt(home.doc.map, 0, first.c + 2, first.r + 3) > 0 || MD.terrainAt(home.doc.map, 0, first.c + 2, first.r + 3).id === 'forest', 'the League starts on its own ground');
  const near = o => Math.hypot(o.c - first.c - 2, o.r - first.r - 3);
  const mills = home.doc.map.objs.filter(x => (x.t === 'sawmill' || x.t === 'oremine') && near(x) <= 16);
  ok(mills.length >= 2, 'a sawmill and an ore mine stand within a day of the start town');
  const guarded = home.doc.map.objs.filter(x => x.t === 'goldmine' && near(x) <= 34).some(g => home.doc.map.objs.some(m => m.t === 'monster' && Math.max(Math.abs(m.c - MD.entry(g)[0]), Math.abs(m.r - MD.entry(g)[1])) <= 3));
  ok(guarded, 'the gold mine of the start zone has a guard');
  const playable = (r, lineup) => {
    const def = H.Maps.play(r.doc, { seed: r.seed, slots: lineup, difficulty: 'normal' });
    return Adv.create(def.map, def.setup);
  };
  const lineup = [{ faction: 'league' }, { faction: 'barrows' }];
  for (const id of ids) {
    const n = R.TEMPLATES[id].min, w = R.sizesFor(id, n)[0], players = Array.from({ length: n }, (_, i) => ({ faction: i % 2 ? 'barrows' : 'league' }));
    const r = R.make({ template: id, w, levels: 1, water: R.TEMPLATES[id].sea ? 'many' : 'none', neutrals: 'normal', seed: 2024, players }), S = playable(r, players);
    ok(S.players.length === n && S.heroes.length === n && S.heroes.every(h => h.alive && S.map.objs.some(o => o.t === 'town' && o.owner === h.owner)), id + ': the game starts with a town and a hero for everyone');
    for (let t = 0; t < n * 5 && !S.over; t++) {
      H.AI.turn(S);
      Adv.endTurn(S);
    }
    ok(S.day >= 5 || S.over, id + ': bots play the first days without errors');
    ok(!!H.Save.unpack(H.Save.pack(S)).map.ter.length, id + ': a game on a random map can be saved');
  }
  const finish = (id, seed, cap) => {
    const r = R.make({ template: id, w: 48, levels: 1, water: R.TEMPLATES[id].sea ? 'many' : 'none', neutrals: 'normal', seed, players: lineup }), S = playable(r, lineup);
    while (!S.over && S.day <= cap) {
      H.AI.turn(S);
      Adv.endTurn(S);
    }
    return S;
  };
  ok(!!finish('islands', 1000, 240).over, 'bots cross the sea and finish a game on the islands');
  ok(!!finish('under', 1001, 240).over, 'bots go through the Underworld and finish the game');

  const corner = MF.blank({ w: 12, players: 1 });
  MD.paint(corner.map, 0, 'rock', (c, r) => c >= 6 || r >= 6);
  MD.paint(corner.map, 0, 'meadow', (c, r) => c >= 6 && r >= 6);
  corner.heroes.push({ owner: 0, hid: 'renier', c: 2, r: 2, l: 0, army: [], arts: [], skills: null, xp: 0, patrol: 0, tag: '' });
  const behindCorner = MF.place(corner, 'res-gold', 8, 8, 0).obj;
  ok(MF.unreached(corner).includes(behindCorner), 'a cell touching only across a corner cannot be walked to');
  ok(H.TERRAIN[H.TERRAIN_INDEX.thicket].cost === 0 && H.Art.TERRAINS.some(a => a.id === 'terrain/thicket') && read(`${DIR}/he-draw-map.js`).includes('thicket:'), 'thicket blocks the way and is drawn');
  ok(read(`${DIR}/he-ui-menu.js`).includes('class RandomView') && !read(`${DIR}/he-ui-menu.js`).match(/LATER = \[[^\]]*'random'/), 'the random map screen is open from the title');
}

{
  const BA13 = H.Battle, Adv13 = H.Adv, C13 = H.Contracts, TW13 = H.Town, MD13 = H.MapData;
  const field = (left, right, o) => BA13.create(Object.assign({ seed: 5, obstacles: [], sides: [{ stacks: left }, { stacks: right }] }, o || {}));
  const hits = (ev, kind) => ev.filter(e => e.t === 'hit' && e.kind === kind);
  const order13 = ev => ev.filter(e => e.t === 'hit').map(e => e.kind);

  const pikes = field([{ unit: 'horseguard', count: 3, c: 2, r: 4 }], [{ unit: 'pikeman', count: 40, c: 6, r: 4 }], { ready: [100, 0] });
  const pikeSpot = BA13.spots(pikes, pikes.stacks[0], pikes.stacks[1]).filter(p => p.steps >= 3)[0];
  ok(BA13.forecast(pikes, pikes.stacks[0], pikes.stacks[1], 'melee', { c: pikeSpot.c, r: pikeSpot.r, flown: 0, run: pikeSpot.steps }).brace, 'Упор: the forecast warns about the pikes');
  const pikeEv = BA13.act(pikes, { type: 'attack', target: 1, c: pikeSpot.c, r: pikeSpot.r });
  ok(order13(pikeEv).join() === 'retal,melee', 'Упор: pikes answer before the blow after a run of 3 or more');
  const pikesNear = field([{ unit: 'horseguard', count: 3, c: 4, r: 4 }], [{ unit: 'pikeman', count: 40, c: 6, r: 4 }], { ready: [100, 0] });
  const nearSpot = BA13.spots(pikesNear, pikesNear.stacks[0], pikesNear.stacks[1]).filter(p => p.steps < 3)[0];
  ok(order13(BA13.act(pikesNear, { type: 'attack', target: 1, c: nearSpot.c, r: nearSpot.r })).join() === 'melee,retal', 'a short step gets the usual answer after the blow');
  const knights = field([{ unit: 'palaceknight', count: 3, c: 2, r: 4 }], [{ unit: 'pikeman', count: 40, c: 6, r: 4 }], { ready: [100, 0] });
  const knightSpot = BA13.spots(knights, knights.stacks[0], knights.stacks[1]).filter(p => p.steps >= 3)[0];
  ok(order13(BA13.act(knights, { type: 'attack', target: 1, c: knightSpot.c, r: knightSpot.r })).join() === 'melee,retal', 'Упор does not work on the Palace knights');

  const shotMax = (target, extra) => {
    const B = field([{ unit: 'crossbow', count: 20, c: 3, r: 4 }], [{ unit: target, count: 30, c: 8, r: 4 }, ...(extra || [])], { ready: [100, 0, 0] });
    return BA13.forecast(B, B.stacks[0], B.stacks[1], 'shot').max;
  };
  const plainShot = shotMax('militia');
  ok(Math.abs(shotMax('shieldbearer') / plainShot - 0.6) < 0.1, 'Щитоносцы take 40 % less from arrows (with their own stats counted)');
  ok(Math.abs(shotMax('militia', [{ unit: 'shieldbearer', count: 5, c: 8, r: 5 }]) / plainShot - 0.8) < 0.02, 'the neighbour of a shieldbearer takes 20 % less');
  const covered = field([{ unit: 'militia', count: 30, c: 3, r: 4 }], [{ unit: 'militia', count: 30, c: 8, r: 4 }, { unit: 'shieldbearer', count: 5, c: 8, r: 5 }], { ready: [100, 0, 0] });
  ok(BA13.forecast(covered, covered.stacks[0], covered.stacks[1], 'melee', { c: 7, r: 4 }).max === BA13.forecast(field([{ unit: 'militia', count: 30, c: 3, r: 4 }], [{ unit: 'militia', count: 30, c: 8, r: 4 }], { ready: [100, 0] }), { ...covered.stacks[0], id: 0 }, { ...covered.stacks[1], id: 1 }, 'melee', { c: 7, r: 4 }).max, 'shields do not help in close combat');

  const steady = field([{ unit: 'heavycrossbow', count: 10, c: 3, r: 4 }], [{ unit: 'militia', count: 5, c: 13, r: 9 }], { ready: [100, 0] });
  const stand = BA13.defOf(steady.stacks[0], 0);
  ok(stand === H.UNITS.heavycrossbow.def + 3, 'С упора: +3 Стойкости while standing');
  BA13.act(steady, { type: 'move', c: 5, r: 4 });
  ok(BA13.defOf(steady.stacks[0], 0) === H.UNITS.heavycrossbow.def, 'and none after walking');

  const skirm = field([{ unit: 'skirmisher', count: 10, c: 3, r: 4 }], [{ unit: 'militia', count: 30, c: 10, r: 4 }], { ready: [100, 0] });
  assert.throws(() => BA13.act(skirm, { type: 'saddle', c: 6, r: 4, target: 1 }), /saddle/);
  const skF = BA13.forecast(skirm, skirm.stacks[0], skirm.stacks[1], 'saddle', { c: 5, r: 4 }), skS = BA13.forecast(skirm, skirm.stacks[0], skirm.stacks[1], 'shot', { c: 5, r: 4 });
  ok(Math.abs(skF.max / skS.max - 0.75) < 0.03, 'Перебежка shoots at −25 %');
  ok(hits(BA13.act(skirm, { type: 'saddle', c: 5, r: 4, target: 1 }), 'saddle').length === 1 && skirm.stacks[0].c === 5, 'and moves up to 2 cells in the same turn');

  const alarm = field([{ unit: 'alarmist', count: 5, c: 2, r: 4 }, { unit: 'militia', count: 5, c: 2, r: 7 }], [{ unit: 'militia', count: 5, c: 13, r: 4 }], { ready: [100, 10, 0] });
  const was = alarm.stacks[1].ready;
  ok(BA13.canAlarm(alarm.stacks[0]), 'Набат is available once');
  const alarmEv = BA13.act(alarm, { type: 'alarm' });
  ok(alarmEv.some(e => e.t === 'alarm') && alarm.stacks[1].ready >= was + 20 && !BA13.canAlarm(alarm.stacks[0]), 'Набат: all others +20 readiness, then it is spent');
  alarm.active = 0;
  assert.throws(() => BA13.act(alarm, { type: 'alarm' }), /alarm/);

  const herald = field([{ unit: 'herald', count: 10, c: 3, r: 4 }, { unit: 'militia', count: 30, c: 3, r: 5 }], [{ unit: 'militia', count: 5, c: 13, r: 4 }], { ready: [0, 0, 0] });
  const pal = herald.stacks[1];
  pal.count = 20;
  pal.fx.push({ spell: 'fear', fear: true, until: 9, bad: true });
  herald.stacks[0].ready = 100;
  herald.active = -1;
  const healEv = [];
  const started = BA13.act(field([{ unit: 'militia', count: 1, c: 0, r: 0 }], [{ unit: 'militia', count: 1, c: 13, r: 9 }], { ready: [100, 0] }), { type: 'defend' });
  ok(Array.isArray(started) && healEv.length === 0, 'a plain turn needs no healer');
  const heralded = field([{ unit: 'militia', count: 30, c: 3, r: 5 }, { unit: 'herald', count: 10, c: 3, r: 4 }], [{ unit: 'militia', count: 5, c: 13, r: 4 }], { ready: [100, 0, 0] });
  heralded.stacks[0].count = 20;
  heralded.stacks[0].fx.push({ spell: 'fear', fear: true, until: 9, bad: true });
  let healed = null;
  for (let i = 0; i < 40 && !healed; i++) {
    const ev = BA13.act(heralded, { type: 'defend' });
    healed = ev.find(e => e.t === 'heal') || null;
  }
  ok(!!healed && heralded.stacks[0].count > 20 && heralded.stacks[0].borrowed > 0, 'Благовест heals neighbours at the start of its turn, and the raised stay only for the battle');
  ok(!heralded.stacks[0].fx.some(e => e.fear), 'Благовест removes fear');

  const pole = field([{ unit: 'halberdier', count: 5, c: 4, r: 4 }], [{ unit: 'militia', count: 30, c: 7, r: 4 }, { unit: 'militia', count: 20, c: 7, r: 5 }], { ready: [100, 0, 0] });
  const poleAt = BA13.poleSpots(pole, pole.stacks[0], pole.stacks[1])[0];
  ok(!!poleAt && BA13.gap(pole.stacks[0], poleAt.c, poleAt.r, pole.stacks[1]) === 2, 'a halberd has cells two away from the target');
  const poleEv = BA13.act(pole, { type: 'attack', target: 1, c: poleAt.c, r: poleAt.r });
  ok(hits(poleEv, 'pole').length === 1 && !hits(poleEv, 'retal').length && !hits(poleEv, 'support').length, 'Через клетку: no answer and no Строй');
  const poleWall = field([{ unit: 'halberdier', count: 5, c: 7, r: 4 }], [{ unit: 'militia', count: 30, c: 10, r: 2 }], { ready: [100, 0], siege: { fort: 2, dmg: 0 } });
  ok(!BA13.poleSpots(poleWall, poleWall.stacks[0], poleWall.stacks[1]).some(p => p.c === 8), 'a halberd does not strike across a standing wall');
  const notPole = field([{ unit: 'plated', count: 5, c: 4, r: 4 }], [{ unit: 'militia', count: 30, c: 6, r: 4 }], { ready: [100, 0] });
  assert.throws(() => BA13.act(notPole, { type: 'attack', target: 1, c: 4, r: 4 }), /attack/);

  const guardHit = unit => {
    const B = field([{ unit: 'militia', count: 30, c: 6, r: 4 }], [{ unit: 'militia', count: 10, c: 7, r: 4 }, { unit, count: 4, c: 7, r: 5 }], { ready: [0, 0, 0] });
    return BA13.forecast(B, B.stacks[2], B.stacks[0], 'support', { c: 7, r: 5 }).max;
  };
  const supportOf = unit => {
    const u = H.UNITS[unit], side = field([{ unit: 'militia', count: 30, c: 6, r: 4 }], [{ unit, count: 4, c: 7, r: 5 }], { ready: [0, 0] });
    return BA13.forecast(side, side.stacks[1], side.stacks[0], 'melee', { c: 7, r: 5 }).max * (u.formationOwn || H.FACTIONS.league.formation);
  };
  ok(Math.abs(guardHit('cityguard') - supportOf('cityguard')) <= 2, 'Гвардия ратуши: their Строй blow is 60 %');
  ok(Math.abs(guardHit('plated') - supportOf('plated')) <= 2, 'others hit with the usual 30 %');
  const stood = field([{ unit: 'cityguard', count: 4, c: 3, r: 4 }, { unit: 'plated', count: 4, c: 3, r: 7 }], [{ unit: 'militia', count: 5, c: 13, r: 4 }], { ready: [100, 90, 0] });
  stood.stacks[0].defending = true;
  stood.stacks[1].defending = true;
  ok(Math.abs(BA13.defOf(stood.stacks[0], 0) - H.UNITS.cityguard.def * 1.6) < 1e-6 && Math.abs(BA13.defOf(stood.stacks[1], 0) - H.UNITS.plated.def * 1.4) < 1e-6, 'Глухая оборона: «Оборона» gives +60 % instead of +40 %');

  const blast = (unit, cells) => field([{ unit, count: 4, c: 3, r: 4 }], cells.map(p => ({ unit: 'militia', count: 50, c: p[0], r: p[1] })), { ready: [100, 0, 0, 0] });
  const bomb = blast('bomber', [[8, 4], [8, 5], [13, 9]]);
  const bombBase = BA13.forecast(bomb, bomb.stacks[0], bomb.stacks[1], 'shot'), bombSide = BA13.forecast(bomb, bomb.stacks[0], bomb.stacks[2], 'splash', { c: 3, r: 4 });
  ok(Math.abs(bombSide.max / bombBase.max - H.UNITS.bomber.splash) < 0.03, 'Разрыв: a neighbour of the target takes the share of the blow');
  const bombEv = BA13.act(bomb, { type: 'shoot', target: 1 });
  ok(hits(bombEv, 'shot').length === 1 && hits(bombEv, 'splash').length === 1 && hits(bombEv, 'splash')[0].to === 2, 'Разрыв hits only the stacks next to the target');
  const friendly = field([{ unit: 'mortar', count: 2, c: 1, r: 4 }, { unit: 'militia', count: 20, c: 7, r: 4 }], [{ unit: 'militia', count: 20, c: 8, r: 4 }], { ready: [100, 0, 0] });
  ok(!hits(BA13.act(friendly, { type: 'shoot', target: 2 }), 'splash').length, 'the blast does not touch own stacks');

  const farOf = list => field([{ unit: 'crossbow', count: 10, c: 1, r: 4 }, ...list], [{ unit: 'militia', count: 50, c: 12, r: 4 }], { ready: new Array(list.length + 2).fill(0) });
  const noSpot = farOf([]), withSpot = farOf([{ unit: 'spotter', count: 2, c: 1, r: 7 }]);
  const farMax = B => BA13.forecast(B, B.stacks[0], B.stacks[B.stacks.length - 1], 'shot').max;
  ok(Math.abs(farMax(withSpot) / farMax(noSpot) - H.BATTLE.farSpotted / H.BATTLE.farMul) < 0.03, 'Дозор: own shooters lose half as much for range');
  const eyes = field([{ unit: 'culverin', count: 2, c: 1, r: 4 }], [{ unit: 'militia', count: 50, c: 12, r: 4 }, { unit: 'militia', count: 50, c: 13, r: 4 }, { unit: 'militia', count: 50, c: 6, r: 9 }], { ready: [100, 0, 0, 0] });
  ok(!BA13.farShot(eyes, eyes.stacks[0], 1, 4, eyes.stacks[1]), 'Прямая наводка: a culverin has no penalty at range');
  const lineEv = BA13.act(eyes, { type: 'shoot', target: 1 });
  ok(hits(lineEv, 'through').length === 1 && hits(lineEv, 'through')[0].to === 2, 'Насквозь: the shot passes to the stack behind the target and no other');

  const runMax = (unit, run) => {
    const B = field([{ unit, count: 3, c: 1, r: 4 }], [{ unit: 'militia', count: 60, c: 10, r: 4 }], { ready: [100, 0] });
    return BA13.forecast(B, B.stacks[0], B.stacks[1], 'melee', { c: 9, r: 4, flown: 0, run }).max;
  };
  ok(Math.abs(runMax('horseguard', 6) / runMax('horseguard', 0) - 1.3) < 0.02, 'Разгон: +5 % per cell for the horse guard');
  ok(Math.abs(runMax('palaceknight', 6) / runMax('palaceknight', 0) - 1.42) < 0.02, 'Разгон: +7 % per cell for the Palace knights');
  const charged = field([{ unit: 'horseguard', count: 3, c: 2, r: 4 }], [{ unit: 'militia', count: 60, c: 9, r: 4 }], { ready: [100, 0] });
  const chargeAt = BA13.spots(charged, charged.stacks[0], charged.stacks[1]).sort((a, b) => b.steps - a.steps)[0];
  const chargedEv = BA13.act(charged, { type: 'attack', target: 1, c: chargeAt.c, r: chargeAt.r });
  ok(hits(chargedEv, 'melee')[0].dmg > hits(BA13.act(Object.assign(field([{ unit: 'horseguard', count: 3, c: 7, r: 4 }], [{ unit: 'militia', count: 60, c: 9, r: 4 }], { ready: [100, 0] })), { type: 'attack', target: 1, c: 8, r: 4 }), 'melee')[0].dmg, 'the run really adds damage in the blow');

  const vol = field([{ unit: 'cuirassier', count: 4, c: 3, r: 4 }], [{ unit: 'plated', count: 5, c: 7, r: 4 }, { unit: 'plated', count: 5, c: 12, r: 8 }], { ready: [100, 0, 0] });
  ok(BA13.inVolley(vol, vol.stacks[0], vol.stacks[1]) && !BA13.inVolley(vol, vol.stacks[0], vol.stacks[2]), 'Залп reaches 4 cells');
  assert.throws(() => BA13.act(vol, { type: 'volley', target: 2 }), /volley/);
  const volEv = BA13.act(vol, { type: 'volley', target: 1 });
  ok(hits(volEv, 'volley').length === 1 && !hits(volEv, 'retal').length && !BA13.canVolley(vol, vol.stacks[0]), 'Залп has no answer and comes once a battle');
  ok(!H.UNITS.cuirassier.shots && !!H.UNITS.cuirassier.charge, 'cuirassiers are horsemen in melee: no shooter penalty, the charge stays');
  const volNear = field([{ unit: 'cuirassier', count: 4, c: 6, r: 4 }], [{ unit: 'plated', count: 5, c: 7, r: 4 }], { ready: [100, 0] });
  ok(!BA13.canVolley(volNear, volNear.stacks[0]), 'no volley with an enemy next to them');

  const lobbed = field([{ unit: 'mortar', count: 2, c: 1, r: 4 }], [{ unit: 'plated', count: 5, c: 10, r: 4 }], { ready: [100, 0], siege: { fort: 2, dmg: 0 } });
  const plain7 = field([{ unit: 'culverin', count: 2, c: 1, r: 4 }], [{ unit: 'plated', count: 5, c: 10, r: 4 }], { ready: [100, 0], siege: { fort: 2, dmg: 0 } });
  const open7 = field([{ unit: 'culverin', count: 2, c: 1, r: 4 }], [{ unit: 'plated', count: 5, c: 10, r: 4 }], { ready: [100, 0] });
  ok(H.UNITS.mortar.lob && Math.abs(BA13.forecast(plain7, plain7.stacks[0], plain7.stacks[1], 'shot').max / BA13.forecast(open7, open7.stacks[0], open7.stacks[1], 'shot').max - 0.5) < 0.02 && BA13.forecast(lobbed, lobbed.stacks[0], lobbed.stacks[1], 'shot').max > BA13.forecast(plain7, plain7.stacks[0], plain7.stacks[1], 'shot').max, 'a mortar lobs over the wall, a culverin hits it');
  ok(H.UNITS.bombard.speed === 2 && H.UNITS.bombard.splash === 0.5 && H.UNITS.mortar.splash === 0.6, 'guns keep the plan numbers: speed 2, blast 50 % and 60 %');

  for (let turn = 0; turn < 60; turn++) {
    const B = field([{ unit: 'alarmist', count: 6, c: 1, r: 2 }, { unit: 'halberdier', count: 4, c: 1, r: 5 }, { unit: 'cuirassier', count: 2, c: 2, r: 8 }, { unit: 'skirmisher', count: 10, c: 0, r: 0 }, { unit: 'bomber', count: 3, c: 0, r: 9 }], [{ unit: 'shade', count: 40, c: 12, r: 2 }, { unit: 'stonewoman', count: 8, c: 12, r: 5 }, { unit: 'horsebow', count: 12, c: 13, r: 8 }], { seed: 100 + turn });
    H.BattleAI.play(B, 100);
    ok(B.winner >= 0, 'the battle AI plays every League property to the end (seed ' + (100 + turn) + ')');
  }
  let alarmUsed = 0, poleUsed = 0, volleyUsed = 0;
  for (let i = 0; i < 20; i++) {
    const B = field([{ unit: 'alarmist', count: 6, c: 1, r: 2 }, { unit: 'halberdier', count: 4, c: 1, r: 5 }, { unit: 'cuirassier', count: 3, c: 2, r: 8 }], [{ unit: 'shade', count: 40, c: 12, r: 2 }, { unit: 'stonewoman', count: 8, c: 12, r: 5 }], { seed: 300 + i });
    while (B.winner < 0 && B.round <= 100) {
      const ev = BA13.act(B, H.BattleAI.choose(B));
      if (ev.some(e => e.t === 'alarm')) alarmUsed++;
      if (hits(ev, 'pole').length) poleUsed++;
      if (hits(ev, 'volley').length) volleyUsed++;
    }
  }
  ok(alarmUsed >= 10 && poleUsed >= 10, 'the AI really rings the alarm and strikes through a cell (' + alarmUsed + ', ' + poleUsed + ', volleys ' + volleyUsed + ')');

  const hero13 = H.Hero.init({ hid: null, cls: 'captain', faction: 'league', level: 1, xp: 0, c: 1, r: 1, l: 0, army: [{ unit: 'militia', count: 5 }, null, null, null, null, null, null] }, {});
  const noMoons = { players: [], day: 1, moons: null };
  const baseSight = H.Hero.sight(noMoons, hero13);
  hero13.army[1] = { unit: 'spotter', count: 1 };
  ok(H.Hero.sight(noMoons, hero13) === baseSight + 3, 'Сверху видно: Дозорные give the hero 3 more sight');

  for (const id of H.FACTIONS.league.units.flat()) {
    const [blow, shot, fall] = H.UNIT_SOUNDS.SOUND_OF[id] || [];
    ok(!!H.UNIT_SOUNDS.BLOWS[blow] && (!shot || !!H.UNIT_SOUNDS.SHOTS[shot]) && !!H.UNIT_SOUNDS.FALLS[fall] && (!!shot === !!(H.UNITS[id].shots || H.UNITS[id].volley) || H.UNITS[id].bell), id + ' has its own sounds');
  }
  for (const [id, u] of Object.entries(H.UNITS)) {
    const [blow, shot, fall] = H.UNIT_SOUNDS.soundOf(id);
    ok(!!H.UNIT_SOUNDS.BLOWS[blow] && (!shot || !!H.UNIT_SOUNDS.SHOTS[shot]) && !!H.UNIT_SOUNDS.FALLS[fall] && !!u, id + ' falls back to sounds of its shape');
  }
  ok(!!H.THEMES.town_league && H.THEMES.town_league.voices.every(v => v.notes.split(' ').every(n => n === '.' || H.noteFreq(n) > 0)), 'the League has its town theme');

  const dealMap = () => {
    const M = MD13.create(48, 48, ['meadow']);
    MD13.add(M, { t: 'town', c: 10, r: 10, owner: 0, faction: 'league', name: 'Контора', built: ['hall1', 'hall2', 'tavern', 'special1'] });
    MD13.add(M, { t: 'town', c: 40, r: 40, owner: 1, faction: 'barrows', name: 'Чужой', built: ['hall1'] });
    MD13.add(M, { t: 'monster', c: 18, r: 12, unit: 'wolves', count: 10, mood: 'hostile' });
    MD13.add(M, { t: 'monster', c: 6, r: 22, unit: 'bandits', count: 30, mood: 'fierce' });
    MD13.add(M, { t: 'monster', c: 45, r: 45, unit: 'stonegiant', count: 3, mood: 'fierce' });
    const S = Adv13.create(M, { seed: 11, moons: null, players: [{ name: 'Л', color: 0, faction: 'league', human: true }, { name: 'К', color: 1, faction: 'barrows', human: false }], heroes: [{ owner: 0, name: 'Л', cls: 'captain', faction: 'league', c: 16, r: 12, army: [{ unit: 'plated', count: 20 }] }, { owner: 1, name: 'К', cls: 'noyon', faction: 'barrows', c: 38, r: 38, army: [{ unit: 'shade', count: 5 }] }] });
    return { S, town: TW13.list(S, 0)[0], foe: TW13.list(S, 1)[0], me: S.heroes[0], them: S.heroes[1], mon: S.map.objs.filter(o => o.t === 'monster') };
  };

  const D1 = dealMap(), first = C13.board(D1.S, D1.town);
  ok(first.length === H.TOWN.contract.board && first[0].kind === 'hire' && first[1].kind === 'bounty' && first[2].kind === 'supply', 'the town hall posts three contracts: hire, bounty, supply');
  ok(C13.board(D1.S, D1.town) === undefined || C13.board(D1.S, D1.town).length === first.length, 'the board stays the same during the week');
  ok(!C13.desk(D1.foe) && !C13.board(D1.S, D1.foe).length, 'a town without the hall posts nothing');
  ok(first.every(d => d.obj == null || Math.hypot(C13.target(D1.S, d).c - D1.town.c, C13.target(D1.S, d).r - D1.town.r) <= H.TOWN.contract.radius), 'contract targets stand within 20 cells of the town');
  ok(first[0].obj !== first[1].obj, 'one stack is not named by two papers');
  ok(first.every(d => C13.describe(D1.S, d).lines.length && C13.describe(D1.S, d).reward), 'every paper has a text and a pay');
  const weekNow = H.Moons.weekOf(D1.S);
  D1.S.day = weekNow * 7 + 8;
  ok(C13.board(D1.S, D1.town).length === 3 && D1.town.boardWeek === H.Moons.weekOf(D1.S), 'new papers come with a new week');
  D1.S.day = 1;
  D1.town.boardWeek = null;

  const value13 = H.TOWN.value, top = H.TOWN.buy[0] - H.TOWN.buy[1] * H.TOWN.maxMarket, sellTop = H.TOWN.sell[0] + H.TOWN.sell[1] * H.TOWN.maxMarket;
  ok(H.TOWN.contract.supply > sellTop && H.TOWN.contract.supply < top && Object.keys(value13).length === 6, 'a supply pays above the market selling price and below its buying price, so it cannot be turned into endless gold');

  const D2 = dealMap();
  C13.board(D2.S, D2.town);
  D2.town.board = [{ kind: 'hire', town: D2.town.id, obj: D2.mon[0].id, unit: 'wolves', each: 90 }, { kind: 'bounty', town: D2.town.id, obj: D2.mon[1].id, unit: 'bandits', gold: 400, res: 'salt', n: 1 }, { kind: 'supply', town: D2.town.id, res: 'wood', n: 4, pay: 1500 }];
  ok(C13.take(D2.S, D2.town, 0).ok, 'a contract can be taken');
  ok(D2.S.players[0].deals.length === 1 && D2.S.players[0].deals[0].until === D2.S.day + H.TOWN.contract.term, 'it runs for its term');
  ok(D2.S.players[0].seen[0][MD13.idx(D2.S.map, D2.mon[0].c, D2.mon[0].r)] === 1, 'the target stack shows up on the map');
  ok(C13.board(D2.S, D2.town).length === 2, 'the paper leaves the board');
  D2.S.players[0].deals.push({ id: 90, kind: 'supply', town: D2.town.id, res: 'ore', n: 1, pay: 10, until: 99 }, { id: 91, kind: 'supply', town: D2.town.id, res: 'ore', n: 1, pay: 10, until: 99 });
  const full = C13.take(D2.S, D2.town, 0);
  ok(!full.ok && /3/.test(full.why), 'no more than three contracts run at once');
  C13.dropDeal(D2.S, 0, 90);
  C13.dropDeal(D2.S, 0, 91);
  ok(D2.S.players[0].deals.length === 1, 'a contract can be dropped');

  const wolves = D2.mon[0], gold0 = D2.S.players[0].res.gold, deal0 = D2.S.players[0].deals[0];
  D2.S.pending = null;
  D2.me.c = 16;
  D2.me.r = 12;
  ok(C13.hireDeal(D2.S, D2.me, wolves) === deal0, 'a League hero can use the hire contract');
  const asked = D2.me.faction;
  D2.me.faction = 'barrows';
  ok(!C13.hireDeal(D2.S, D2.me, wolves), 'another people cannot');
  D2.me.faction = asked;
  ok(C13.hirePrice(D2.me, deal0, wolves) === wolves.count * 90, 'the price follows the size of the stack');
  D2.me.talents.push('league-1');
  ok(C13.hirePrice(D2.me, deal0, wolves) === Math.round(wolves.count * 90 * 0.75), 'Вербовщик: 25 % cheaper');
  D2.me.talents = [];
  Adv13.engage(D2.S, D2.me, wolves.id, 'attack');
  ok(D2.S.pending.kind === 'encounter' && D2.S.pending.offer === 'join' && D2.S.pending.chance === 1 && D2.S.pending.deal === deal0.id, 'meeting the stack offers the deal for sure, whatever its mood');
  const price0 = D2.S.pending.price;
  Adv13.resolve(D2.S, 'accept');
  ok(wolves.gone && D2.me.army.some(s => s && s.unit === 'wolves' && s.count === 10), 'the stack joins the hero');
  ok(D2.S.players[0].res.gold === gold0 - price0 && !D2.S.players[0].deals.length && D2.S.players[0].dealsDone === 1, 'gold is paid and the contract is closed');

  const D3 = dealMap();
  D3.town.boardWeek = H.Moons.weekOf(D3.S);
  D3.town.boardOwner = 0;
  D3.town.board = [{ kind: 'bounty', town: D3.town.id, obj: D3.mon[0].id, unit: 'wolves', gold: 400, res: 'salt', n: 2 }];
  C13.take(D3.S, D3.town, 0);
  const g3 = D3.S.players[0].res.gold, s3 = D3.S.players[0].res.salt;
  const mon3 = D3.mon[0];
  D3.me.c = 17;
  D3.me.r = 11;
  Adv13.engage(D3.S, D3.me, mon3.id, 'attack');
  ok(D3.S.pending.deal == null, 'a bounty gives no offer to join');
  const setup3 = Adv13.battleSetup(D3.S), B3 = BA13.create(setup3);
  H.BattleAI.play(B3, 100);
  ok(B3.winner === 0, 'the hero beats the named stack');
  const ev3 = Adv13.battleDone(D3.S, B3);
  ok(ev3.some(e => e.t === 'dealDone') && D3.S.players[0].res.salt === s3 + 2 && D3.S.players[0].res.gold === g3 + 400 && !D3.S.players[0].deals.length, 'the bounty pays gold and the resource after the win');

  const D4 = dealMap();
  D4.town.boardWeek = H.Moons.weekOf(D4.S);
  D4.town.boardOwner = 0;
  D4.town.board = [{ kind: 'bounty', town: D4.town.id, obj: D4.mon[0].id, unit: 'wolves', gold: 400, res: 'salt', n: 2 }, { kind: 'bounty', town: D4.town.id, hero: D4.them.id, gold: 700, res: 'sulfur', n: 3 }, { kind: 'supply', town: D4.town.id, res: 'wood', n: 4, pay: 1500 }];
  C13.take(D4.S, D4.town, 2);
  C13.take(D4.S, D4.town, 1);
  C13.take(D4.S, D4.town, 0);
  ok(D4.S.players[0].deals.length === 3, 'three contracts at once');
  const dealSupply = D4.S.players[0].deals.find(d => d.kind === 'supply');
  ok(!C13.canDeliver(D4.S, D4.town, dealSupply), 'a supply needs a hero in the town');
  [D4.me.c, D4.me.r] = MD13.entry(D4.town);
  D4.S.players[0].res.wood = 3;
  ok(!C13.canDeliver(D4.S, D4.town, dealSupply) && !C13.deliver(D4.S, D4.town, dealSupply.id).ok, 'and the whole cargo');
  D4.S.players[0].res.wood = 5;
  const goldSup = D4.S.players[0].res.gold;
  ok(C13.deliver(D4.S, D4.town, dealSupply.id).ok && D4.S.players[0].res.wood === 1 && D4.S.players[0].res.gold === goldSup + 1500, 'delivery takes the cargo and pays');
  const foe4 = D4.them;
  foe4.c = 20;
  foe4.r = 20;
  D4.me.c = 19;
  D4.me.r = 20;
  D4.me.army[0].count = 60;
  Adv13.engage(D4.S, D4.me, foe4.id, 'duel');
  const B4 = BA13.create(Adv13.battleSetup(D4.S));
  H.BattleAI.play(B4, 100);
  const gold4 = D4.S.players[0].res.gold, ev4 = Adv13.battleDone(D4.S, B4);
  ok(ev4.some(e => e.t === 'dealDone' && e.kind === 'bounty') && D4.S.players[0].res.gold === gold4 + 700, 'the bounty on an enemy hero pays after beating him');

  const D5 = dealMap();
  D5.town.boardWeek = H.Moons.weekOf(D5.S);
  D5.town.boardOwner = 0;
  D5.town.board = [{ kind: 'bounty', town: D5.town.id, obj: D5.mon[0].id, unit: 'wolves', gold: 400, res: 'salt', n: 2 }, { kind: 'hire', town: D5.town.id, obj: D5.mon[1].id, unit: 'bandits', each: 36 }];
  C13.take(D5.S, D5.town, 1);
  C13.take(D5.S, D5.town, 0);
  const ev5 = [];
  D5.mon[0].gone = true;
  Adv13.conclude(D5.S, ev5);
  ok(ev5.some(e => e.t === 'dealLost' && e.kind === 'bounty') && D5.S.players[0].deals.length === 1, 'a contract ends when another hand removes its target');
  D5.S.day += H.TOWN.contract.term + 1;
  const ev5b = [];
  Adv13.conclude(D5.S, ev5b);
  ok(ev5b.some(e => e.t === 'dealLost' && e.late) && !D5.S.players[0].deals.length, 'a contract ends when its term runs out');
  const D6 = dealMap();
  D6.town.boardWeek = H.Moons.weekOf(D6.S);
  D6.town.boardOwner = 0;
  D6.town.board = [{ kind: 'supply', town: D6.town.id, res: 'wood', n: 4, pay: 1500 }];
  C13.take(D6.S, D6.town, 0);
  D6.town.owner = 1;
  const ev6 = [];
  Adv13.conclude(D6.S, ev6);
  ok(ev6.some(e => e.t === 'dealLost') && !D6.S.players[0].deals.length, 'a contract ends when its town is lost');
  D6.town.owner = 1;
  D6.town.boardWeek = H.Moons.weekOf(D6.S);
  D6.town.boardOwner = 0;
  ok(C13.board(D6.S, D6.town).every(d => d.town === D6.town.id) && D6.town.boardOwner === 1, 'a captured town posts papers for its new owner');

  const D7 = dealMap();
  C13.board(D7.S, D7.town);
  C13.take(D7.S, D7.town, 2);
  const Sv = H.Save, packed = Sv.unpack(Sv.pack(D7.S));
  ok(packed.players[0].deals.length === 1 && TW13.list(packed, 0)[0].board.length === 2 && packed.nextDeal === D7.S.nextDeal, 'contracts live in the save');
  ok(Sv.hash(packed) === Sv.hash(D7.S), 'the same hash after loading');
  const oldSave = JSON.parse(Sv.pack(D7.S));
  oldSave.v = 4;
  delete oldSave.S.nextDeal;
  for (const p of oldSave.S.players) {
    delete p.deals;
    delete p.dealsDone;
  }
  const migrated = Sv.unpack(JSON.stringify(oldSave));
  ok(migrated.nextDeal === 1 && migrated.players.every(p => Array.isArray(p.deals) && p.dealsDone === 0), 'an older save gets empty contract lists');

  const D8 = dealMap();
  D8.S.players[0].human = false;
  D8.me.army[0].count = 60;
  D8.S.players[0].res.gold = 30000;
  D8.S.turn = 0;
  const T8 = H.AI.begin(D8.S, 0);
  T8.main = D8.me;
  T8.threats = [];
  D8.town.boardWeek = H.Moons.weekOf(D8.S);
  D8.town.boardOwner = 0;
  D8.town.board = [{ kind: 'hire', town: D8.town.id, obj: D8.mon[0].id, unit: 'wolves', each: 90 }];
  H.AI.turn(D8.S);
  const stacks8 = D8.me.army.filter(Boolean).map(s => s.unit);
  ok(D8.S.players[0].dealsDone === 1 || D8.S.players[0].deals.length === 1, 'the AI takes a useful contract');
  let aiDeals = 0, aiGames = 0;
  for (let i = 0; i < 12 && !aiDeals; i++) {
    const def = H.Maps.build('ford', { seed: 500 + i, slots: [{ faction: 'league' }, { faction: 'barrows' }] }), S = Adv13.create(def.map, def.setup);
    TW13.list(S, 0)[0].built.push('hall2', 'tavern', 'special1');
    for (let t = 0; t < 120 && !S.over; t++) {
      H.AI.turn(S);
      Adv13.endTurn(S);
    }
    aiDeals += S.players[0].dealsDone;
    aiGames++;
  }
  ok(aiDeals > 0, 'the AI finishes contracts in real games (' + aiDeals + ' in ' + aiGames + ')');
  ok(stacks8.length >= 1, 'the AI army stays in order');
  ok(H.FACTIONS.league.building.special1.contracts && !H.FACTIONS.barrows.building.special1.contracts, 'only the League hall has the board');
  const D9 = dealMap();
  [D9.me.c, D9.me.r] = MD13.entry(D9.town);
  ok(H.Sites.digBlocked(D9.S, D9.me), 'nobody digs on a town gate');
  D9.me.c = 20;
  D9.me.r = 30;
  ok(!H.Sites.digBlocked(D9.S, D9.me), 'open ground can be dug');
  ok(/digBlocked\(S, h\)\) return null/.test(fs.readFileSync(path.join(ROOT, 'js/apps/heroes98/he-ai.js'), 'utf8')), 'the AI asks before digging, a refused dig cannot repeat forever');
  ok(!(H.Maps.trial().map || H.Maps.trial()).forbid || !(H.Maps.trial().map || H.Maps.trial()).forbid.includes('special1'), 'the trial map no longer forbids the town hall');
}

{
  const CP = H.Campaign, Sc = H.Script, MF14 = H.MapFile, Adv14 = H.Adv, TW14 = H.Town, MD14 = H.MapData;
  const camp1 = CP.get('nabat'), readMission = m => fs.readFileSync(path.join(ROOT, 'content/heroes98/maps', m.id + '.h98m'), 'utf8');
  ok(!!camp1 && camp1.missions.length === 5 && camp1.hero === 'adelina', 'the League campaign has five missions and its hero');
  const makers = require(path.join(ROOT, 'tools/heroes98-camp1-maps.cjs'))(H);
  camp1.missions.forEach((m, i) => {
    const text = readMission(m), file = MF14.read(text);
    ok(file.scenes === m.scenes, m.id + ': the file carries the scenes of the campaign module');
    ok(MF14.write(Object.assign(makers[m.id](), { scenes: m.scenes })) === text, m.id + ': the file is what its maker builds');
    CP.attach(m, text);
    ok(!MF14.blocking(MF14.check(m.doc)).length, m.id + ': no blocking problems (' + MF14.blocking(MF14.check(m.doc)).map(x => x.text).join('; ') + ')');
    ok(!Sc.parse(m.scenes).errors.length, m.id + ': scenes parse');
    ok(m.brief.length > 150 && m.goals.length >= 1 && m.lose && m.name && m.about, m.id + ': has a briefing, goals and a way to lose');
    ok(m.levelCap > (i ? camp1.missions[i - 1].levelCap : 1), m.id + ': the level cap grows');
    const kinds14 = m.bonuses.map(b => b.kind).sort().join();
    ok(kinds14 === 'art,res,unit', m.id + ': three bonuses, an artifact, creatures and resources');
    ok(m.bonuses.every(b => (b.kind === 'art' ? !!H.ARTIFACTS[b.id] : b.kind === 'unit' ? !!H.UNITS[b.unit] : Object.keys(b.res).every(k => H.RESOURCES.some(r => r[0] === k)))) && m.bonuses.every(b => CP.bonusText(b)), m.id + ': bonuses point at real things');
    const P = Sc.parse(m.scenes);
    for (const who of Sc.speakers(m.scenes)) ok(!!H.HEROES.find(x => x.id === who) || !!H.PEOPLE[who], m.id + ': the speaker ' + who + ' has a name');
    for (const who of Sc.speakers(m.scenes)) ok(H.Art.PORTRAITS.some(x => x.id === 'portrait/' + who), m.id + ': the speaker ' + who + ' has a portrait entry');
    for (const op of P.ops.filter(x => x.k === 'line')) ok(H.Font.wrap('text', op.text, 464).length <= 5, m.id + ': the line fits the text box: ' + op.text.slice(0, 30));
    const spawn14 = P.ops.filter(x => x.k === 'cmd' && x.cmd === 'spawn');
    for (const op of spawn14) {
      const at = op.a[0] === 'hero' ? 3 : 2, col = +op.a[at], row = +op.a[at + 1], cells = m.doc.map;
      ok(MD14.inside(cells, col, row) && MD14.groundCost(cells, 0, col, row) > 0 && !cells.objs.some(o => o.l === 0 && MD14.cells(o).some(([x, y]) => x === col && y === row)), m.id + ': spawn cell ' + col + ',' + row + ' is free ground');
    }
    const words = [m.brief, m.scenes].join(' ');
    ok(!/Microsoft|Windows|—/.test(words), m.id + ': no real names and no long dashes');
    ok(m.doc.heroes.some(h => h.hid === 'adelina' && h.owner === 0), m.id + ': Adelina starts it');
  });
  ok([...camp1.opening, ...camp1.ending, camp1.about].every(s => typeof s === 'string' && s.length > 20 && !/—/.test(s)), 'the campaign has an opening and an ending in plain words');
  ok(camp1.opening.length >= 3 && camp1.ending.length >= 3, 'an opening and an ending of several slides');
  ok(!!H.THEMES[camp1.theme] && !!H.THEMES.camp_map, 'the campaign and the campaign map have themes');
  ok(H.Art.all().some(e => e.id === 'picture/campaign1') && H.Art.all().some(e => e.id === 'picture/ending1') && H.Art.all().some(e => e.id === 'picture/campaignmap'), 'pictures of the opening, the ending and the map are on the list');

  CP.reset();
  ok(CP.isOpen('nabat') && !CP.isOpen('sol') && !CP.isOpen('schozhdenie') && CP.stateOf(CP.RING[1]).ready && CP.stateOf(CP.RING[2]).ready && CP.stateOf(CP.RING[3]).ready && CP.stateOf(CP.RING[4]).ready && CP.stateOf(CP.RING[7]).ready && !CP.isOpen('tysyacha') && !CP.stateOf(CP.RING[5]).ready, 'only the first campaign is open, the add-on stays closed, all six of the release are written');
  const run14 = CP.begin('nabat', 'easy');
  ok(run14.difficulty === 'easy' && CP.currentMission('nabat') === 0, 'a run keeps its difficulty and starts at mission one');
  const start14 = (index, bonus, seed) => {
    const def = CP.setup('nabat', index, { seed: seed || 11, bonus }), S = Adv14.create(def.map, def.setup);
    return { S, h: S.heroes.find(x => x.hid === 'adelina') };
  };
  const g14 = start14(0, 1), gold0 = H.MAP.start.gold * H.DIFFICULTY.easy.start;
  ok(g14.S.players[0].res.gold === gold0 + camp1.missions[0].bonuses[1].res.gold, 'the resource bonus lands');
  ok(g14.S.difficulty === 'easy' && g14.S.campaign.id === 'nabat' && g14.S.campaign.mission === 0, 'the game knows its campaign and difficulty');
  const u14 = start14(0, 0);
  ok(u14.h.army.some(s => s && s.unit === 'militia' && s.count === 30 + camp1.missions[0].bonuses[0].count), 'the creature bonus joins the army');
  const a14 = start14(0, 2);
  ok(Object.values(a14.h.arts).includes(camp1.missions[0].bonuses[2].id), 'the artifact bonus is worn');
  ok(a14.h.levelCap === camp1.missions[0].levelCap, 'the mission cap is set');
  a14.h.xp = H.XP_TABLE[12];
  H.Hero.autoUp(a14.S, a14.h);
  ok(a14.h.level === camp1.missions[0].levelCap && !H.Hero.levelPending(a14.h), 'no level above the mission cap');
  const mid14 = a14.h;
  mid14.skills.leadership = 2;
  mid14.perks.push('warcry');
  mid14.talents.push('league-1');
  mid14.spells.push('balm');
  mid14.army[0].count = 500;
  for (const id of ['saltring', 'quilted', 'millerring', 'luckbone']) H.Hero.giveArt(mid14, id);
  const owned14 = CP.artsOf(a14.S);
  ok(owned14.length === 5, 'the end screen lists the artifacts of the hero');
  a14.S.over = { winner: 0, why: 'script' };
  a14.S.campaign.flags.seen_it = 1;
  ok(CP.finish(a14.S, ['saltring', 'quilted', 'luckbone', 'millerring']) === 1, 'after mission one comes mission two');
  const saved14 = CP.runOf('nabat');
  ok(saved14.done.join() === '0' && saved14.hero.arts.length === 3, 'no more than three artifacts go along');
  ok(saved14.flags.seen_it === 1, 'campaign flags go along');
  const n14 = start14(1, 0);
  ok(n14.h.level === mid14.level && n14.h.skills.leadership === 2 && n14.h.perks.includes('warcry') && n14.h.talents.includes('league-1') && n14.h.spells.includes('balm'), 'level, skills, tricks, the gift and spells go along');
  ok(n14.h.army.every(s => !s || s.count < 100), 'the army stays behind');
  ok(Object.values(n14.h.arts).filter(Boolean).length + n14.h.bag.length === 3, 'the chosen artifacts arrive');
  ok(n14.h.levelCap === camp1.missions[1].levelCap, 'the next mission has its own cap');
  ok(n14.S.campaign.flags.seen_it === 1, 'and the flags are there');
  const packed14 = H.Save.unpack(H.Save.pack(n14.S));
  ok(packed14.campaign.id === 'nabat' && packed14.heroes.find(x => x.hid === 'adelina').levelCap === n14.h.levelCap, 'the campaign state lives in the save');
  for (let i = 1; i < 5; i++) {
    const r = CP.runOf('nabat');
    if (!r.done.includes(i)) r.done.push(i);
  }
  const last14 = start14(4, 0);
  last14.S.over = { winner: 0, why: 'script' };
  ok(CP.finish(last14.S, []) === null && CP.finished('nabat'), 'the last mission finishes the campaign');
  ok(CP.isOpen('sol') && !CP.isOpen('zapoved') && CP.stateOf(CP.RING[0]).finished, 'the next campaign opens after it');
  CP.reset();
  const lost14 = (() => {
    CP.begin('nabat', 'easy');
    const g = start14(0, 1);
    CP.reset();
    g.S.over = { winner: 0, why: 'script' };
    return CP.finish(g.S, []);
  })();
  ok(lost14 === 1 && CP.runOf('nabat').done.join() === '0', 'a save outlives cleared campaign progress');
  CP.reset();

  const blank14 = (scenes, extra) => {
    const M = MD14.create(48, 48, ['meadow']);
    const town = MD14.add(M, { t: 'town', c: 10, r: 10, owner: 0, faction: 'league', name: 'Т', tag: 'home', built: ['hall1', 'tavern', 'caravan'] });
    const far = MD14.add(M, { t: 'town', c: 30, r: 10, owner: 0, faction: 'league', name: 'Д', tag: 'away', built: ['hall1', 'caravan'] });
    const mon = MD14.add(M, { t: 'monster', c: 20, r: 30, owner: -1, unit: 'wolves', count: 5, max: 5, mood: 'hostile', tag: 'pack' });
    M.scenes = scenes;
    M.events = [];
    const S = Adv14.create(M, Object.assign({ seed: 3, moons: null, players: [{ name: 'Л', color: 0, faction: 'league', human: true }, { name: 'К', color: 1, faction: 'barrows', human: false }], heroes: [{ owner: 0, hid: 'adelina', name: 'А', cls: 'captain', faction: 'league', c: 12, r: 14, tag: 'me', army: [{ unit: 'plated', count: 10 }] }, { owner: 1, hid: 'timar', name: 'Т', cls: 'noyon', faction: 'barrows', c: 40, r: 40, tag: 'foe', army: [{ unit: 'shade', count: 5 }] }] }, extra || {}));
    return { S, town, far, mon, me: S.heroes[0], foe: S.heroes[1] };
  };
  const run = (B, ev) => {
    Adv14.conclude(B.S, ev || []);
    let guard = 0;
    while (B.S.scene && guard++ < 200) Sc.advance(B.S, 0);
  };

  const w = blank14('event day 1 -> a\n@a\ngoal add g1 "Текст цели" to pack foe\ngoal add g2 "Держать" stay home\ngoal add g3 "Позже"\ngoal point g3 away\ngoal done g1\nend\n');
  const evG = [];
  Adv14.conclude(w.S, evG);
  ok(w.S.script.goals[0].targets.join() === 'pack,foe' && w.S.script.goals[0].text === 'Текст цели', 'a goal keeps its text and its targets');
  ok(w.S.script.goals[1].hold === 'home' && w.S.script.goals[1].targets.join() === 'home', 'a goal can hold a town');
  ok(w.S.script.goals[2].targets.join() === 'away', 'targets can come later');
  ok(evG.filter(e => e.t === 'goal').length === 4 && evG.some(e => e.t === 'goal' && e.state === 'done'), 'goals tell the map when they change');

  const c14 = blank14('event day 1 -> a\n@a\ngoal lose town home\ngoal lose day 9\nend\n');
  Adv14.conclude(c14.S, []);
  ok(c14.S.goals.lose.length === 3, 'a lose goal is added to the old ones');
  const c15 = blank14('event day 1 -> a\n@a\ngoal lose town home\ngoal safe home\nend\n');
  Adv14.conclude(c15.S, []);
  ok(!c15.S.goals.lose.some(g => g.kind === 'town'), 'a town can stop being a reason to lose');

  const d14 = blank14('event day 1 -> a\n@a\ndeal hire pack for 5\ndeal supply ore 3 900 at away\ndeal bounty pack 500 salt 2\nend\n');
  Adv14.conclude(d14.S, []);
  const dl = d14.S.players[0].deals;
  ok(dl.length === 3 && dl[0].kind === 'hire' && dl[0].until === d14.S.day + 5 && dl[1].town === d14.far.id && dl[2].gold === 500, 'scenes can hand out contracts');
  ok(d14.S.players[0].seen[0][MD14.idx(d14.S.map, 20, 30)] === 1, 'and open their targets');

  const k14 = blank14('event day 1 -> a\n@a\naim player 1 home\nkeep kept_one\narmy foe wolves 7\narmy home militia 40\nspawn mirror 0.5 25 25 0 ghost\nset x\nend\n');
  k14.S.campaign = { id: 'nabat', mission: 0, hero: 'adelina', flags: {} };
  Adv14.conclude(k14.S, []);
  ok(k14.S.script.aims[1].join() === 'home', 'scenes can aim an enemy player');
  ok(k14.S.campaign.flags.kept_one === 1, 'scenes keep flags for later missions');
  ok(k14.foe.army.some(s => s && s.unit === 'wolves' && s.count === 7) && k14.town.garrison.some(s => s && s.unit === 'militia' && s.count === 40), 'scenes reinforce a hero and a garrison');
  const ghost = k14.S.map.objs.find(o => o.tag === 'ghost');
  ok(!!ghost && ghost.unit === 'plated' && ghost.count === 5, 'a mirror stack copies half of the strongest stack of the hero');

  const q14 = blank14('event built market -> b1\nevent heroes 2 -> b2\nevent caravan away -> b3\n@b1\nset built_market\nend\n@b2\nset two_heroes\nend\n@b3\nset wagon_in\nend\n');
  Adv14.conclude(q14.S, []);
  ok(!q14.S.script.flags.built_market && !q14.S.script.flags.two_heroes, 'new events wait for their moment');
  q14.town.built.push('market');
  Adv14.conclude(q14.S, []);
  ok(q14.S.script.flags.built_market === 1, 'an event fires when the building stands');
  Adv14.addHero(q14.S, { owner: 0, hid: 'renier', name: 'Р', cls: 'captain', faction: 'league', c: 14, r: 14, army: [{ unit: 'militia', count: 5 }] });
  Adv14.conclude(q14.S, []);
  ok(q14.S.script.flags.two_heroes === 1, 'an event fires on the second hero');
  q14.town.pool[0] = 5;
  q14.town.built.push('dwell1');
  q14.S.players[0].res.gold = 99999;
  ok(TW14.sendCaravan(q14.S, q14.town, q14.far, [{ tier: 1, unit: 'militia', n: 5 }]).ok, 'a caravan leaves');
  for (let i = 0; i < 8 && !q14.S.script.flags.wagon_in; i++) {
    q14.S.turn = 0;
    Adv14.endDay(q14.S);
    while (q14.S.scene) Sc.advance(q14.S, 0);
  }
  ok(q14.S.script.flags.wagon_in === 1, 'an event fires when the caravan arrives');

  const head = blank14('');
  head.town.built.push('dwell1');
  head.far.built.push('dwell1');
  head.town.pool[0] = 5;
  head.far.pool[0] = 5;
  head.S.players[0].res.gold = 99999;
  const here14 = head.S.heroes[0];
  here14.c = 2;
  here14.r = 40;
  ok(TW14.sendCaravan(head.S, head.town, head.far, [{ tier: 1, unit: 'militia', n: 5 }]).ok && TW14.sendCaravan(head.S, head.far, head.town, [{ tier: 1, unit: 'militia', n: 5 }]).ok, 'two caravans leave towards each other');
  for (let i = 0; i < 12 && head.S.caravans.length; i++) Adv14.endDay(head.S);
  ok(!head.S.caravans.length, 'caravans meeting head on go around each other');

  const r14 = blank14('event capture home -> back\n@back\nset retaken\nend\n');
  Adv14.conclude(r14.S, []);
  r14.town.owner = 1;
  Adv14.conclude(r14.S, []);
  ok(!r14.S.script.flags.retaken, 'losing a town does not fire a capture for the player');
  r14.town.owner = 0;
  Adv14.conclude(r14.S, []);
  ok(r14.S.script.flags.retaken === 1, 'taking it back does');

  const f14 = blank14('event defeat foe -> beat\n@beat\nset beaten_foe\nend\n');
  f14.foe.alive = false;
  f14.foe.away = true;
  Adv14.conclude(f14.S, []);
  ok(f14.S.script.flags.beaten_foe === 1, 'a hero who fled the field counts as beaten');
  const h14 = blank14('', { goals: { win: [{ kind: 'defeat' }], lose: [{ kind: 'all' }, { kind: 'hero', hid: 'adelina' }] } });
  h14.me.alive = false;
  h14.me.away = true;
  const ev14 = [];
  Adv14.conclude(h14.S, ev14);
  ok(!h14.S.over, 'a campaign hero who retreated is not lost yet');
  h14.me.away = false;
  Adv14.conclude(h14.S, ev14);
  ok(!!h14.S.over, 'a campaign hero who fell is');

  const s14 = blank14('@a\nif hero me\nset by_hero\nend\nif diff normal\nset normal_game\nend\nif kept no_flag\nset wrong\nend\nend\nevent visit home -> a\n');
  s14.me.c = 12;
  s14.me.r = 12;
  ok(Sc.check(s14.S.map.scenes, [], new Set(['home', 'me'])).length === 0, 'new conditions pass the scene check');
  Sc.on(s14.S, 'visit', { pid: 0, hero: s14.me.id, tag: 'home' }, []);
  ok(s14.S.script.flags.by_hero === 1 && s14.S.script.flags.normal_game === 1 && !s14.S.script.flags.wrong, 'conditions read the hero, the difficulty and kept flags');
  const bad14 = Sc.check('event built nothing -> a\nevent caravan nowhere -> a\n@a\ndeal hire nowhere\ndeal supply gem 1 1\nkeep x\narmy nowhere wolves 3\naim nowhere\ngoal point nope a\ngoal safe nowhere\nspawn dragon 1 1\nend\n', [], new Set());
  ok(bad14.length >= 8, 'the check finds broken new commands (' + bad14.length + ')');
  ok(Object.keys(H.Script.EVENT_KINDS).includes('caravan') && Sc.parseEvent('built market -> a').building === 'market' && Sc.parseEvent('heroes 2 -> a').n === 2 && Sc.eventText(Sc.parseEvent('heroes 2 -> a')) === 'heroes 2 -> a' && Sc.eventText(Sc.parseEvent('built market -> a')) === 'built market -> a', 'new events read and write back');

  const playAll = (index, seed) => {
    CP.reset();
    const r = CP.begin('nabat', 'easy');
    if (index) {
      const S0 = { rs: seed >>> 0, ver: 0 }, h0 = H.Hero.init({ hid: 'adelina', cls: 'captain', faction: 'league', level: 1, xp: H.XP_TABLE[[1, 4, 7, 10, 13][index]], army: [], c: 0, r: 0, l: 0 }, {});
      H.Hero.autoUp(S0, h0);
      r.hero = CP.carryOf(h0, []);
    }
    const def = CP.setup('nabat', index, { seed, bonus: 1 }), S = Adv14.create(def.map, def.setup);
    H.Script.opening(S);
    for (let g = 0; g < 400 && !S.over; g++) {
      while (S.scene) Sc.advance(S, 0);
      const T = H.AI.begin(S, S.turn);
      for (let i = 0; i < 40000 && !S.over; i++) {
        while (S.scene) Sc.advance(S, 0);
        const st = H.AI.step(S, T);
        if (st.battle) {
          const setup = st.battle === true ? Adv14.battleSetup(S) : st.battle, B = H.Battle.create(setup);
          H.BattleAI.play(B, 60);
          Adv14.battleDone(S, B);
        }
        if (st.done) break;
      }
      while (S.scene) Sc.advance(S, 0);
      if (!S.over) Adv14.endTurn(S);
    }
    return S;
  };
  for (let i = 0; i < 5; i++) {
    const S = playAll(i, 2000 + i);
    ok(!!S.over && S.over.winner === 0, camp1.missions[i].id + ': the AI in the human slot finishes the mission (' + S.day + ' days)');
    ok(S.script.goals.filter(g => !g.id.startsWith('kurgan')).every(g => g.state === 'done'), camp1.missions[i].id + ': the win closes its goals (' + S.script.goals.map(g => g.id + ':' + g.state).join(' ') + ')');
  }
  CP.reset();
}

{
  const BA15 = H.Battle, Adv15 = H.Adv, TW15 = H.Town, MD15 = H.MapData;
  const field = (left, right, o) => BA15.create(Object.assign({ seed: 5, obstacles: [], sides: [{ stacks: left }, { stacks: right }] }, o || {}));
  const hits = (ev, kind) => ev.filter(e => e.t === 'hit' && e.kind === kind);

  const wail = field([{ unit: 'mourner', count: 30, c: 5, r: 4 }], [{ unit: 'militia', count: 60, c: 6, r: 4 }, { unit: 'militia', count: 20, c: 6, r: 5 }, { unit: 'militia', count: 20, c: 12, r: 8 }], { ready: [100, 0, 0, 0] });
  BA15.act(wail, { type: 'attack', target: 1, c: 5, r: 4 });
  ok(wail.stacks[1].chill === 1 && wail.stacks[2].chill === 1 && wail.stacks[3].chill === 0, 'Вопленицы: neighbours of the target lose Натиск too');

  const guard = field([{ unit: 'plated', count: 40, c: 5, r: 4 }], [{ unit: 'dustguard', count: 3, c: 6, r: 4 }], { ready: [100, 0] });
  const gEv = BA15.act(guard, { type: 'attack', target: 1, c: 5, r: 4 });
  ok(guard.stacks[1].count === 1 && guard.stacks[1].hp === 1 && guard.stacks[1].stood && gEv.some(e => e.t === 'trait' && e.name === 'Стоят насмерть'), 'Стражи праха survive a deadly blow with one creature');
  BA15.hurt(guard.stacks[1], 50);
  ok(guard.stacks[1].count === 0, 'and only once');
  const fc15 = field([{ unit: 'plated', count: 40, c: 5, r: 4 }], [{ unit: 'dustguard', count: 3, c: 6, r: 4 }], { ready: [100, 0] });
  ok(BA15.forecast(fc15, fc15.stacks[0], fc15.stacks[1], 'melee', { c: 5, r: 4 }).kmax === 2, 'the forecast knows it');

  const rope = field([{ unit: 'lasso', count: 10, c: 2, r: 4 }], [{ unit: 'crossbow', count: 20, c: 6, r: 4 }, { unit: 'militia', count: 10, c: 12, r: 8 }], { ready: [100, 0, 0] });
  const was = rope.stacks[1].ready;
  ok(BA15.inDrag(rope, rope.stacks[0], rope.stacks[1]) && !BA15.inDrag(rope, rope.stacks[0], rope.stacks[2]), 'Аркан reaches 5 cells');
  const ropeEv = BA15.act(rope, { type: 'lasso', target: 1 });
  ok(rope.stacks[1].c === 4 && rope.stacks[1].r === 4 && ropeEv.some(e => e.t === 'ready' && e.id === 1 && e.value === Math.max(0, was - 15)) && ropeEv.some(e => e.t === 'trait' && e.name === 'Аркан'), 'Аркан pulls the target two cells closer');
  assert.throws(() => BA15.act(Object.assign(rope, { active: 0 }), { type: 'lasso', target: 2 }), /lasso/);
  rope.stacks[0].dragged = 3;
  ok(!BA15.canDrag(rope, rope.stacks[0]), 'three throws a battle');
  ok(H.UNITS.horsebow.shots === 10, 'horse archers shoot ten times, as the plan says');

  const idol = (near, unit) => {
    const B = field([{ unit: 'militia', count: 30, c: 3, r: 4 }], [{ unit: 'shade', count: 30, c: 4, r: 4 }, { unit, count: 4, c: near ? 4 : 12, r: near ? 5 : 8 }], { ready: [100, 0, 0] });
    return BA15.forecast(B, B.stacks[0], B.stacks[1], 'melee', { c: 3, r: 4 }).max;
  };
  ok(idol(true, 'kinidol') < idol(false, 'kinidol'), 'Идолы рода: a neighbour takes less damage');
  const leader = near => {
    const B = field([{ unit: 'shade', count: 30, c: 3, r: 4 }, { unit: 'thousander', count: 4, c: near ? 3 : 0, r: near ? 5 : 9 }], [{ unit: 'militia', count: 30, c: 4, r: 4 }], { ready: [100, 0, 0] });
    return BA15.forecast(B, B.stacks[0], B.stacks[2], 'melee', { c: 3, r: 4 }).max;
  };
  ok(leader(true) > leader(false), 'Тысячники: a neighbour hits harder');
  const rally = field([{ unit: 'thousander', count: 4, c: 3, r: 4 }, { unit: 'shade', count: 30, c: 3, r: 5 }], [{ unit: 'militia', count: 30, c: 12, r: 8 }], { ready: [100, 0, 0] });
  const r0 = rally.stacks[1].ready;
  BA15.act(rally, { type: 'move', c: 4, r: 4 });
  ok(rally.stacks[1].ready >= r0 + 10, 'Тысячники: their move gives neighbours readiness');

  const speak = field([{ unit: 'speakingstone', count: 5, c: 3, r: 4 }], [{ unit: 'militia', count: 30, c: 9, r: 4 }], { ready: [100, 0] });
  ok(BA15.canCharm(speak.stacks[0]), 'Говорящие камни can speak once');
  const speakEv = BA15.act(speak, { type: 'charm', target: 1 });
  ok(speakEv.some(e => e.t === 'fx' && e.spell === 'numb') && !BA15.canCharm(speak.stacks[0]), 'their word is the numbing spell, once a battle');
  const black = field([{ unit: 'shamannoyon', count: 3, c: 3, r: 4 }], [{ unit: 'militia', count: 30, c: 9, r: 4 }], { ready: [100, 0] });
  BA15.act(black, { type: 'charm', target: 1 });
  ok(black.stacks[1].fx.some(e => e.spell === 'blackmark'), 'Нойоны-шаманы cast Чёрная метка');

  const raid = field([{ unit: 'stormeagle', count: 6, c: 1, r: 4 }], [{ unit: 'militia', count: 30, c: 6, r: 4 }], { ready: [100, 0] });
  const spot = BA15.spots(raid, raid.stacks[0], raid.stacks[1])[0];
  const raidEv = BA15.act(raid, { type: 'attack', target: 1, c: spot.c, r: spot.r });
  ok(raid.stacks[0].c === 1 && raid.stacks[0].r === 4 && hits(raidEv, 'melee').length === 1 && !hits(raidEv, 'retal').length, 'Налёт: a blow, no answer and back to its cell');

  const soul = field([{ unit: 'soulcatcher', count: 10, c: 5, r: 4 }], [{ unit: 'militia', count: 30, c: 6, r: 4 }], { ready: [100, 0] });
  BA15.act(soul, { type: 'attack', target: 1, c: 5, r: 4 });
  const killed15 = 30 - soul.stacks[1].count;
  ok(killed15 > 0 && Math.abs(soul.stacks[0].souls - killed15 * BA15.hpOf(soul.stacks[1]) * 0.1) < 1e-6, 'Ловцы душ keep a tenth of the health they kill');
  soul.winner = 0;
  ok(BA15.result(soul).souls[0] === soul.stacks[0].souls && BA15.result(soul).souls[1] === 0, 'the result counts it by side');

  const curse = field([{ unit: 'saltnoyon', count: 3, c: 5, r: 4 }], [{ unit: 'militia', count: 60, c: 6, r: 4 }], { ready: [100, 0] }), cursedAt = curse.round;
  BA15.act(curse, { type: 'attack', target: 1, c: 5, r: 4 });
  ok(curse.stacks[1].fx.some(e => e.noHeal && e.until === cursedAt + 2), 'Проклятие кургана: no healing for three rounds');

  const ram = field([{ unit: 'bonebull', count: 2, c: 5, r: 4 }], [{ unit: 'militia', count: 60, c: 6, r: 4 }], { ready: [100, 0] });
  const ramEv = BA15.act(ram, { type: 'attack', target: 1, c: 5, r: 4 });
  ok(ram.stacks[1].c === 7 && ramEv.some(e => e.t === 'trait' && e.name === 'Таран'), 'Таран pushes the target one cell away');
  const wallRam = field([{ unit: 'bonebull', count: 2, c: 5, r: 4 }], [{ unit: 'militia', count: 60, c: 6, r: 4 }], { ready: [100, 0], obstacles: [[7, 4], [7, 3], [7, 5]] });
  BA15.act(wallRam, { type: 'attack', target: 1, c: 5, r: 4 });
  ok(wallRam.stacks[1].c === 6, 'nothing moves into an obstacle');
  const tram = field([{ unit: 'thunderbull', count: 2, c: 5, r: 4 }], [{ unit: 'militia', count: 60, c: 6, r: 4 }, { unit: 'militia', count: 60, c: 7, r: 4 }], { ready: [100, 0, 0] });
  const tramEv = BA15.act(tram, { type: 'attack', target: 1, c: 5, r: 4 });
  ok(hits(tramEv, 'trample').length === 1 && hits(tramEv, 'trample')[0].to === 2 && hits(tramEv, 'trample')[0].dmg < hits(tramEv, 'melee')[0].dmg, 'Топот hits the one behind the target for half');
  const lowHit = target => {
    const B = field([{ unit: 'greybull', count: 2, c: 5, r: 4 }], [{ unit: target, count: 20, c: 6, r: 4 }], { ready: [100, 0] }), plain = field([{ unit: 'bonebull', count: 2, c: 5, r: 4 }], [{ unit: target, count: 20, c: 6, r: 4 }], { ready: [100, 0] });
    return BA15.forecast(B, B.stacks[0], B.stacks[1], 'melee', { c: 5, r: 4 }).max / BA15.forecast(plain, plain.stacks[0], plain.stacks[1], 'melee', { c: 5, r: 4 }).max;
  };
  ok(lowHit('militia') > 1.4 && lowHit('plated') < 1.3, 'Седые туры crush tiers 1–3');

  const khan = field([{ unit: 'stonekhan', count: 2, c: 2, r: 4 }, { unit: 'shade', count: 30, c: 2, r: 8 }], [{ unit: 'militia', count: 10, c: 12, r: 8 }], { ready: [100, 0, 0] });
  khan.stacks[1].count = 20;
  khan.stacks[0].count = 1;
  ok(BA15.callList(khan, khan.stacks[0]).length === 1 && BA15.callList(khan, khan.stacks[0])[0] === khan.stacks[1], 'Зов рода calls into another stack with fallen');
  const callEv = BA15.act(khan, { type: 'call', target: 1 });
  ok(khan.stacks[1].count === 22 && khan.stacks[1].borrowed === 0 && callEv.some(e => e.t === 'heal'), 'it returns 20 % of the fallen for good');
  ok(!BA15.canCall(khan.stacks[0]), 'once a battle');
  const fear = near => {
    const B = field([{ unit: 'militia', count: 10, c: 3, r: 4 }, { unit: near ? 'kurgankhan' : 'stonekhan', count: 1, c: 3, r: 6 }], [{ unit: 'stonewoman', count: 5, c: 4, r: 4 }], { ready: [100, 0, 0] });
    return BA15.moraleOf(B, B.stacks[0]);
  };
  ok(fear(false) < 0 && fear(true) === 0, 'Хан-курган: morale of the side does not fall below zero');
  const storm = field([{ unit: 'stormkhan', count: 2, c: 1, r: 4 }], [{ unit: 'militia', count: 50, c: 8, r: 4 }, { unit: 'militia', count: 50, c: 8, r: 5 }, { unit: 'militia', count: 50, c: 12, r: 8 }], { ready: [100, 60, 60, 60] });
  const stormEv = BA15.act(storm, { type: 'shoot', target: 1 });
  ok(hits(stormEv, 'splash').length === 1 && hits(stormEv, 'splash')[0].to === 2 && storm.stacks[2].ready <= 60 + 10 * 2 - 20 + 100 && stormEv.filter(e => e.t === 'ready').length === 2, 'Хан бурь: the storm hits the neighbours and takes readiness');

  const hero15 = H.Hero.init({ hid: null, cls: 'noyon', faction: 'barrows', level: 1, xp: 0, c: 1, r: 1, l: 0, army: [{ unit: 'shade', count: 5 }, null, null, null, null, null, null] }, {});
  hero15.talents.push('barrows-4');
  ok(H.Hero.battleHero(hero15).saltWounds === 0.25, 'Соль на ранах reaches the battle');
  const saltDmg = wounds => {
    const B = field([{ unit: 'militia', count: 5, c: 1, r: 4 }], [{ unit: 'shade', count: 30, c: 8, r: 4 }], { ready: [100, 0] });
    B.sides[1].hero = { saltWounds: wounds, perks: [] };
    return BA15.spellDamage(B, { power: 2, ranks: {}, perks: [], sorcery: 0, specSpell: null }, H.SPELLS.spark, B.stacks[1], 100);
  };
  ok(saltDmg(0.25) < saltDmg(0) * 0.8, 'it cuts spells of Жарь and Ясна');

  for (let i = 0; i < 40; i++) {
    const B = field([{ unit: 'mourner', count: 40, c: 1, r: 1 }, { unit: 'lasso', count: 12, c: 0, r: 3 }, { unit: 'speakingstone', count: 8, c: 1, r: 5 }, { unit: 'stormeagle', count: 6, c: 1, r: 7 }, { unit: 'stormkhan', count: 1, c: 1, r: 9 }], [{ unit: 'pikeman', count: 40, c: 12, r: 1 }, { unit: 'heavycrossbow', count: 20, c: 13, r: 3 }, { unit: 'cityguard', count: 6, c: 12, r: 6 }, { unit: 'mortar', count: 1, c: 12, r: 8 }], { seed: 700 + i });
    H.BattleAI.play(B, 100);
    ok(B.winner >= 0, 'the battle AI plays every Barrows property to the end (seed ' + (700 + i) + ')');
  }
  let calls = 0, ropes = 0;
  for (let i = 0; i < 30; i++) {
    const B = field([{ unit: 'stonekhan', count: 2, c: 1, r: 2 }, { unit: 'shade', count: 40, c: 1, r: 6 }, { unit: 'lasso', count: 14, c: 0, r: 8 }], [{ unit: 'crossbow', count: 40, c: 4, r: 8 }, { unit: 'militia', count: 60, c: 12, r: 6 }], { seed: 800 + i });
    while (B.winner < 0 && B.round <= 100) {
      const a = H.BattleAI.choose(B);
      if (a.type === 'call') calls++;
      if (a.type === 'lasso') ropes++;
      BA15.act(B, a);
    }
  }
  ok(calls >= 2 && ropes >= 5, 'the AI calls the kin and throws the lasso (' + calls + ', ' + ropes + ')');

  const land = () => {
    const M = MD15.create(48, 48, ['steppe']);
    MD15.add(M, { t: 'town', c: 10, r: 10, owner: 0, faction: 'barrows', name: 'Курган', tag: 'home', built: ['hall1', 'hall2', 'tavern', 'special1'] });
    MD15.add(M, { t: 'town', c: 40, r: 40, owner: 0, faction: 'barrows', name: 'Дальний', built: ['hall1'] });
    MD15.add(M, { t: 'kurganstone', c: 30, r: 30, owner: -1 });
    MD15.add(M, { t: 'monster', c: 20, r: 30, owner: -1, unit: 'wolves', count: 12, max: 12, mood: 'hostile' });
    const S = Adv15.create(M, { seed: 3, moons: null, players: [{ name: 'К', color: 0, faction: 'barrows', human: true }, { name: 'Л', color: 1, faction: 'league', human: false }], heroes: [{ owner: 0, hid: 'aisulu', name: 'А', cls: 'shaman', faction: 'barrows', c: 19, r: 29, army: [{ unit: 'shade', count: 40 }, { unit: 'stonewoman', count: 6 }] }, { owner: 1, hid: 'renier', name: 'Р', cls: 'captain', faction: 'league', c: 2, r: 2, army: [{ unit: 'militia', count: 5 }] }] });
    return { S, home: S.map.objs.find(o => o.tag === 'home'), far: S.map.objs.find(o => o.name === 'Дальний'), stone: S.map.objs.find(o => o.t === 'kurganstone'), wolves: S.map.objs.find(o => o.t === 'monster'), me: S.heroes[0], p: S.players[0] };
  };
  const L1 = land();
  ok(TW15.barrowLevel(L1.home) === 1 && TW15.barrowLevel(L1.far) === 0 && TW15.barrowLimit(L1.S, L1.home) === 4000, 'the first step of the barrow lifts 4000 of value a week');
  L1.me.talents = [];
  const lostRow = [{ unit: 'shade', lost: 100, left: 0 }, { unit: 'stonewoman', lost: 10, left: 0 }, { unit: 'militia', lost: 50, left: 0 }];
  const ev15 = [];
  TW15.fallen(L1.S, 0, L1.me, L1.me, lostRow, 0, ev15);
  const inHome = L1.home.barrow.find(e => e.unit === 'shade').count;
  ok(inHome >= 40 && inHome <= 41 && !L1.home.barrow.some(e => e.unit === 'militia'), '40 % of fallen Barrows go to the barrow, other peoples do not');
  ok(ev15.some(e => e.t === 'barrow' && e.town === L1.home.id), 'the map hears about it');
  L1.me.talents.push('barrows-1');
  ok(TW15.barrowShare(L1.S, 0, L1.me) === 0.55, 'Тризна: 55 %');
  L1.home.built.push('altar');
  ok(TW15.barrowShare(L1.S, 0, L1.me) === 0.75, 'the altar of the Barrows: 75 %');
  L1.home.built.pop();
  const priceSh = TW15.raisePrice(L1.S, 0, 'stonewoman');
  L1.me.level = 1;
  ok(priceSh < H.UNITS.stonewoman.cost / 2 && priceSh >= Math.round(H.UNITS.stonewoman.cost / 2 * 0.97), 'Говорящая с предками: 2 % cheaper per level');
  L1.me.level = 30;
  ok(TW15.raisePrice(L1.S, 0, 'stonewoman') === Math.round(H.UNITS.stonewoman.cost / 2 * 0.6), 'down to 40 %');
  L1.me.level = 1;
  L1.me.talents.push('barrows-5');
  ok(TW15.barrowLimit(L1.S, L1.home) === 6000 && TW15.raisePrice(L1.S, 0, 'shade') < priceSh, 'Курганная рать: cheaper and a wider limit');
  L1.me.talents = [];
  L1.p.res.gold = 100000;
  const n0 = TW15.canRaise(L1.S, L1.home, 'shade');
  ok(n0 > 0 && TW15.raise(L1.S, L1.home, 'shade', 5).ok && L1.home.garrison.some(s => s && s.unit === 'shade' && s.count === 5), 'raised creatures stand in the garrison');
  ok(L1.home.raised === 5 * H.UNITS.shade.cost && L1.p.risen === 5, 'the week counts what was lifted');
  L1.home.raised = 3990;
  ok(TW15.canRaise(L1.S, L1.home, 'stonewoman') === 0, 'the weekly limit holds');
  ok(!TW15.raise(L1.S, L1.home, 'stonewoman', 1).ok, 'and refuses more');
  L1.S.day = 8;
  TW15.week(L1.S);
  ok(L1.home.raised === 0, 'a new week opens the limit');
  L1.p.res.gold = 0;
  ok(TW15.canRaise(L1.S, L1.home, 'stonewoman') === 0, 'raising costs gold');
  L1.p.res.gold = 100000;
  const before15 = L1.p.res.salt;
  ok(TW15.raiseAll(L1.S, L1.home).length >= 1 && L1.p.res.salt === before15, 'raising takes no rare resources');
  L1.p.res = Object.assign(L1.p.res, { gold: 50000, ore: 50, salt: 50, wood: 50 });
  L1.home.today = false;
  ok(TW15.build(L1.S, L1.home, 'barrow2', 'a').ok && TW15.barrowLevel(L1.home) === 2 && TW15.barrowLimit(L1.S, L1.home) === 8000, 'the second step lifts more');
  ok(H.FACTIONS.barrows.building.barrow3.needs.includes('barrow2') && !H.FACTIONS.league.building.barrow2, 'the third step stands on the second, only for the Barrows');

  const L2 = land();
  L2.home.built = L2.home.built.filter(id => id !== 'special1');
  const ev16 = [];
  TW15.fallen(L2.S, 0, L2.me, L2.me, [{ unit: 'stonewoman', lost: 25, left: 0 }], 0, ev16);
  ok(L2.p.shades.length === 1 && ev16.some(e => e.t === 'barrow' && e.town == null), 'without a barrow the fallen wander');
  L2.p.res = Object.assign(L2.p.res, { gold: 50000, ore: 50, wood: 50 });
  L2.home.today = false;
  const wander = L2.p.shades[0].count;
  ok(TW15.build(L2.S, L2.home, 'special1', 'a').ok && !L2.p.shades.length && L2.home.barrow[0].count === wander, 'the first barrow gathers them');
  const L3 = land();
  L3.home.built = L3.home.built.filter(id => id !== 'special1');
  L3.p.shades.push({ unit: 'stonewoman', count: 20 });
  L3.p.res.gold = 50000;
  [L3.me.c, L3.me.r] = MD15.entry(L3.stone);
  const stEv = [];
  H.OBJ_VISIT.barrowstone(L3.S, L3.me, L3.stone, stEv);
  ok(L3.S.pending && L3.S.pending.kind === 'choice' && L3.S.pending.site === 'barrowstone', 'the stone offers to raise the fallen');
  const stoneArmy = L3.me.army.find(s => s && s.unit === 'stonewoman').count;
  Adv15.resolve(L3.S, 'raise');
  const stoneNow = L3.me.army.find(s => s && s.unit === 'stonewoman').count, maxStone = Math.floor(H.TOWN.barrow.stoneLimit / H.UNITS.stonewoman.cost);
  ok(stoneNow === stoneArmy + maxStone && L3.p.shades[0].count === 20 - maxStone, 'the stone lifts up to its limit into the army');
  const stEv2 = [];
  H.OBJ_VISIT.barrowstone(L3.S, L3.me, L3.stone, stEv2);
  ok(!L3.S.pending && stEv2.some(e => e.t === 'note'), 'and answers once a week');
  L3.S.day = 8;
  H.OBJ_VISIT.barrowstone(L3.S, L3.me, L3.stone, []);
  ok(L3.S.pending && L3.S.pending.site === 'barrowstone', 'next week it answers again');
  L3.S.pending = null;
  const other = land();
  other.me.faction = 'league';
  const stEv3 = [];
  H.OBJ_VISIT.barrowstone(other.S, other.me, other.stone, stEv3);
  ok(!other.S.pending && stEv3.some(e => e.t === 'read'), 'for other peoples it is only a stone');

  const L4 = land();
  L4.me.army[0].count = 60;
  L4.wolves.count = 60;
  Adv15.engage(L4.S, L4.me, L4.wolves.id, 'attack');
  const setup15 = Adv15.battleSetup(L4.S), B15 = BA15.create(setup15);
  H.BattleAI.play(B15, 100);
  const lostInBattle = B15.stacks.filter(s => s.side === 0).reduce((t, s) => t + s.start - s.count, 0), done15 = Adv15.battleDone(L4.S, B15);
  ok(lostInBattle >= 5 && done15.some(e => e.t === 'barrow') && L4.home.barrow.length > 0, 'a real battle fills the barrow (' + lostInBattle + ' lost)');
  const L5 = land();
  L5.S.players[0].human = false;
  L5.home.barrow.push({ unit: 'stonewoman', count: 8 }, { unit: 'shade', count: 40 });
  L5.S.players[0].res.gold = 30000;
  const T5 = H.AI.begin(L5.S, 0);
  T5.main = L5.me;
  T5.threats = [];
  H.AI.turn(L5.S);
  ok(L5.S.players[0].risen > 0, 'the AI raises its fallen');
  ok(H.FACTIONS.barrows.ai.includes('special1') && H.FACTIONS.barrows.ai.includes('barrow2') && H.FACTIONS.barrows.ai.includes('barrow3'), 'the AI builds the barrow and its steps');
  const sv = land();
  sv.home.barrow.push({ unit: 'shade', count: 7 });
  sv.p.shades.push({ unit: 'stonewoman', count: 3 });
  const Sv = H.Save, back15 = Sv.unpack(Sv.pack(sv.S));
  ok(TW15.list(back15, 0)[0].barrow[0].count === 7 && back15.players[0].shades[0].count === 3 && Sv.hash(back15) === Sv.hash(sv.S), 'the barrow lives in the save');
  const old15 = JSON.parse(Sv.pack(sv.S));
  old15.v = 5;
  for (const p of old15.S.players) {
    delete p.shades;
    delete p.risen;
  }
  for (const o of old15.S.map.objs) {
    delete o.barrow;
    delete o.raised;
  }
  const mig15 = Sv.unpack(JSON.stringify(old15));
  ok(mig15.players.every(p => Array.isArray(p.shades) && p.risen === 0) && TW15.list(mig15, 0).every(o => Array.isArray(o.barrow) && o.raised === 0), 'an older save gets an empty barrow');

  for (const id of H.FACTIONS.barrows.units.flat()) {
    const [blow, shot, fall] = H.UNIT_SOUNDS.SOUND_OF[id] || [];
    ok(!!H.UNIT_SOUNDS.BLOWS[blow] && (!shot || !!H.UNIT_SOUNDS.SHOTS[shot]) && !!H.UNIT_SOUNDS.FALLS[fall] && !!shot === !!H.UNITS[id].shots, id + ' has its own sounds');
  }
  ok(!!H.THEMES.town_barrows && H.THEMES.town_barrows.voices.every(v => v.notes.split(' ').every(n => n === '.' || n === 'x' || H.noteFreq(n) > 0)), 'the Barrows have their town theme');
  for (const id of H.FACTIONS.barrows.units.flat()) ok(H.unitTraits(H.UNITS[id]).length >= 1, id + ' lists its traits');
}

{
  const CP = H.Campaign, Sc = H.Script, MF = H.MapFile, Adv = H.Adv, MD = H.MapData, TW = H.Town;
  const camp = CP.get('sol'), makers = require(path.join(ROOT, 'tools/heroes98-camp2-maps.cjs'))(H), mapText = m => fs.readFileSync(path.join(ROOT, 'content/heroes98/maps', m.id + '.h98m'), 'utf8');
  ok(!!camp && camp.missions.length === 5 && camp.hero === 'aisulu' && camp.faction === 'barrows' && camp.number === 2, 'the Barrows campaign has five missions, its hero and its people');
  ok(CP.get('nabat').faction === 'league', 'the first campaign names its people');
  camp.missions.forEach((m, i) => {
    const text = mapText(m), file = MF.read(text);
    ok(file.scenes === m.scenes, m.id + ': the file carries the scenes of the campaign module');
    ok(MF.write(Object.assign(makers[m.id](), { scenes: m.scenes })) === text, m.id + ': the file is what its maker builds');
    CP.attach(m, text);
    ok(!MF.blocking(MF.check(m.doc)).length, m.id + ': no blocking problems (' + MF.blocking(MF.check(m.doc)).map(x => x.text).join('; ') + ')');
    ok(!Sc.parse(m.scenes).errors.length, m.id + ': scenes parse');
    ok(m.brief.length > 150 && m.goals.length >= 1 && m.lose && m.name && m.about, m.id + ': has a briefing, goals and a way to lose');
    ok(m.levelCap > (i ? camp.missions[i - 1].levelCap : 1), m.id + ': the level cap grows');
    ok(m.bonuses.map(b => b.kind).sort().join() === 'art,res,unit', m.id + ': three bonuses, an artifact, creatures and resources');
    ok(m.bonuses.every(b => (b.kind === 'art' ? !!H.ARTIFACTS[b.id] : b.kind === 'unit' ? !!H.UNITS[b.unit] : Object.keys(b.res).every(k => H.RESOURCES.some(r => r[0] === k)))) && m.bonuses.every(b => CP.bonusText(b)), m.id + ': bonuses point at real things');
    const P = Sc.parse(m.scenes);
    for (const who of Sc.speakers(m.scenes)) ok(!!H.HEROES.find(x => x.id === who) || !!H.PEOPLE[who], m.id + ': the speaker ' + who + ' has a name');
    for (const who of Sc.speakers(m.scenes)) ok(H.Art.PORTRAITS.some(x => x.id === 'portrait/' + who), m.id + ': the speaker ' + who + ' has a portrait entry');
    for (const op of P.ops.filter(x => x.k === 'line')) ok(H.Font.wrap('text', op.text, 464).length <= 5, m.id + ': the line fits the text box: ' + op.text.slice(0, 30));
    for (const op of P.ops.filter(x => x.k === 'cmd' && x.cmd === 'spawn')) {
      const at = op.a[0] === 'hero' ? 3 : 2, col = +op.a[at], row = +op.a[at + 1], cells = m.doc.map;
      ok(MD.inside(cells, col, row) && MD.groundCost(cells, 0, col, row) > 0 && !cells.objs.some(o => o.l === 0 && MD.cells(o).some(([x, y]) => x === col && y === row)), m.id + ': spawn cell ' + col + ',' + row + ' is free ground');
    }
    ok(!/Microsoft|Windows|—/.test([m.brief, m.scenes].join(' ')), m.id + ': no real names and no long dashes');
    ok(m.doc.heroes.some(h => h.hid === 'aisulu' && h.owner === 0), m.id + ': Aisulu starts it');
    ok(!Sc.check(m.scenes, [], new Set([...m.doc.map.objs.map(o => o.tag), ...m.doc.heroes.map(h => h.tag)].filter(Boolean))).length, m.id + ': the scene check finds nothing');
  });
  ok([...camp.opening, ...camp.ending, camp.about].every(s => typeof s === 'string' && s.length > 20 && !/—/.test(s)), 'the campaign has an opening and an ending in plain words');
  ok(camp.opening.length >= 3 && camp.ending.length >= 3 && !!H.THEMES[camp.theme], 'an opening, an ending and a theme of its own');

  CP.reset();
  ok(!CP.isOpen('sol'), 'the second campaign waits for the first');
  const first = CP.begin('nabat', 'easy');
  first.flags = { letters_sent: 1, aisulu_led: 1 };
  ok(!CP.begin('sol', 'easy').flags.letters_sent, 'flags of an unfinished campaign stay there');
  first.finished = true;
  ok(CP.isOpen('sol') && CP.begin('sol', 'easy').flags.letters_sent === 1, 'a finished campaign opens the next one and hands over its flags');
  const lines16 = (index, flags) => {
    CP.reset();
    const r = CP.begin('sol', 'easy');
    r.flags = flags;
    if (index) r.hero = CP.carryOf(H.Hero.init({ hid: 'aisulu', cls: 'shaman', faction: 'barrows', level: 1, xp: 0, army: [], c: 0, r: 0, l: 0 }, {}), []);
    const def = CP.setup('sol', index, { seed: 5, bonus: 1 }), S = Adv.create(def.map, def.setup), said = [];
    Sc.opening(S);
    for (let g = 0; g < 300 && S.scene; g++) {
      said.push(S.scene.who);
      Sc.advance(S, 0);
    }
    return { S, said };
  };
  ok(lines16(0, { letters_sent: 1 }).said.includes('spirit') && !lines16(0, {}).said.includes('spirit'), 'the spirit with the letters of the first campaign comes back in the second');
  const stones16 = lines16(4, { promised_guilty: 1 }), coins16 = lines16(4, {});
  const heroOf16 = S => S.heroes.find(h => h.hid === 'aisulu');
  ok(heroOf16(stones16.S).army.some(s => s && s.unit === 'stonewoman' && s.count === 28) && !heroOf16(coins16.S).army.some(s => s && s.count === 28), 'the promise of mission 3 changes mission 5');
  ok(coins16.S.players[0].res.gold === stones16.S.players[0].res.gold + 3000, 'the other promise pays in gold');
  CP.reset();

  const blank16 = (scenes, extra) => {
    const M = MD.create(48, 48, ['meadow']), town = MD.add(M, { t: 'town', c: 10, r: 10, owner: 0, faction: 'barrows', name: 'Т', tag: 'home', built: ['hall1', 'fort1', 'special1'], garrison: [], barrow: [{ unit: 'shade', count: 6 }] });
    const khanTown = MD.add(M, { t: 'town', c: 30, r: 8, owner: 1, faction: 'barrows', name: 'Х', tag: 'kholm', built: ['hall1'], garrison: [] });
    const far = MD.add(M, { t: 'town', c: 36, r: 36, owner: 2, faction: 'league', name: 'Ф', tag: 'far', built: ['hall1'], garrison: [] });
    const made = extra ? extra(M) : {};
    M.scenes = scenes;
    M.events = [];
    const S = Adv.create(M, { seed: 3, moons: null, players: [{ name: 'Б', color: 0, faction: 'barrows', human: true, team: 0 }, { name: 'С', color: 1, faction: 'barrows', human: false, team: 0 }, { name: 'Л', color: 2, faction: 'league', human: false, team: 1 }], heroes: [{ owner: 0, hid: 'aisulu', name: 'А', cls: 'shaman', faction: 'barrows', c: 14, r: 16, tag: 'me', army: [{ unit: 'shade', count: 30 }] }, { owner: 1, hid: 'kaidar', name: 'К', cls: 'noyon', faction: 'barrows', c: 30, r: 16, tag: 'khan', army: [{ unit: 'stonekhan', count: 2 }] }, { owner: 2, hid: 'yosta', name: 'Й', cls: 'captain', faction: 'league', c: 36, r: 30, tag: 'foe', army: [{ unit: 'militia', count: 10 }] }] });
    return Object.assign({ S, town, khanTown, far, me: S.heroes[0], khan: S.heroes[1], foe: S.heroes[2] }, made);
  };
  const settle16 = S => {
    Adv.conclude(S, []);
    for (let g = 0; g < 300 && S.scene; g++) Sc.advance(S, 0);
  };
  const nextDay16 = S => {
    const day = S.day;
    for (let g = 0; g < 8 && S.day === day; g++) {
      Adv.endTurn(S);
      settle16(S);
    }
  };

  const r16 = blank16('event risen 3 -> up\n@up\nset rose\nend\n');
  settle16(r16.S);
  ok(!r16.S.script.flags.rose, 'no flag before anyone rises');
  r16.S.players[0].res.gold = 99999;
  ok(TW.raiseAll(r16.S, r16.town).length > 0 && r16.S.players[0].risen >= 3, 'the barrow of a map keeps its shades and raises them');
  settle16(r16.S);
  ok(r16.S.script.flags.rose === 1, 'the risen event fires');
  ok(Sc.parseEvent('risen 3 -> up').n === 3 && Sc.eventText(Sc.parseEvent('risen 3 -> up')) === 'risen 3 -> up' && Sc.eventText(Sc.parseEvent('done rod -> up')) === 'done rod -> up' && Sc.eventText(Sc.parseEvent('arrive run -> up')) === 'arrive run -> up', 'the new events read and write back');

  const v16 = blank16('event done v1 -> touched\n@touched\nset touched\nend\n', M => ({ hut: MD.add(M, { t: 'hamlet', c: 14, r: 20, owner: -1, tag: 'v1', gold: 1500 }) }));
  const gold16 = v16.S.players[0].res.gold, ev16 = [];
  H.OBJ_VISIT.hamlet(v16.S, v16.me, v16.hut, ev16);
  ok(v16.S.pending && v16.S.pending.site === 'hamlet' && v16.S.pending.ai === 'leave', 'a village asks, and the AI passes by');
  Adv.resolve(v16.S, 'leave');
  settle16(v16.S);
  ok(v16.S.players[0].res.gold === gold16 && !(v16.hut.done || []).length && !v16.S.script.flags.touched, 'passing by changes nothing');
  H.OBJ_VISIT.hamlet(v16.S, v16.me, v16.hut, ev16);
  Adv.resolve(v16.S, 'take');
  settle16(v16.S);
  ok(v16.S.players[0].res.gold === gold16 + 1500 && v16.hut.done.includes(0) && v16.S.script.flags.touched === 1, 'looting pays once and fires the done event');
  H.OBJ_VISIT.hamlet(v16.S, v16.me, v16.hut, ev16);
  ok(!v16.S.pending && ev16.some(e => e.t === 'note'), 'a looted village has nothing more');

  const w16 = blank16('event arrive run -> came\n@came\nset came\nend\n', M => ({ wagons: MD.add(M, { t: 'monster', c: 20, r: 24, owner: -1, unit: 'wolves', count: 5, max: 5, mood: 'fierce', tag: 'run', route: [[30, 24], [30, 28]], pace: 6 }) }));
  nextDay16(w16.S);
  ok(w16.wagons.c === 26 && w16.wagons.r === 24, 'the wagons walk their pace in a day');
  ok(!!w16.S.players[0].seen[0][24 * 48 + 26], 'the player sees the road they took');
  w16.me.c = 28;
  w16.me.r = 24;
  nextDay16(w16.S);
  ok(w16.wagons.c === 26, 'a hero in the way stops the wagons');
  w16.me.c = 14;
  w16.me.r = 16;
  nextDay16(w16.S);
  ok(w16.wagons.c === 30 && w16.wagons.r === 26, 'the wagons turn at a waypoint');
  ok(!w16.S.script.flags.came, 'not there yet');
  nextDay16(w16.S);
  ok(w16.wagons.routeDone && w16.S.script.flags.came === 1, 'the arrive event fires at the end of the road');
  const moon16 = camp.missions[3].doc, order16 = moon16.map.objs.find(o => o.tag === 'order');
  let at16 = [order16.c, order16.r], free16 = true, long16 = 0;
  for (const [tc, tr] of order16.route) {
    while (at16[0] !== tc || at16[1] !== tr) {
      at16 = [at16[0] + Math.sign(tc - at16[0]), at16[1] + Math.sign(tr - at16[1])];
      long16++;
      if (!(MD.groundCost(moon16.map, 0, at16[0], at16[1]) > 0) || moon16.map.objs.some(o => o !== order16 && MD.cells(o).some(([x, y]) => x === at16[0] && y === at16[1]))) free16 = false;
    }
  }
  ok(free16, 'nothing stands on the road of the white wagons');
  ok(long16 / order16.pace > 6 && long16 / order16.pace < 9, 'the wagons reach the sea in seven or eight days (' + (long16 / order16.pace).toFixed(1) + ')');

  const t16 = blank16('', M => ({ mill: MD.add(M, { t: 'sawmill', c: 24, r: 16, owner: 1 }) }));
  ok(Adv.allied(t16.S, 0, 1) && Adv.allied(t16.S, 1, 0) && !Adv.allied(t16.S, 0, 2) && !Adv.allied(t16.S, 0, 0) && !Adv.allied(t16.S, 0, -1), 'a team is a set of allies');
  const tev16 = [];
  H.OBJ_VISIT.town(t16.S, t16.me, t16.khanTown, tev16, null);
  ok(t16.khanTown.owner === 1 && !t16.S.pending && tev16.some(e => e.t === 'note'), 'the town of an ally is not taken');
  H.OBJ_VISIT[H.OBJ[t16.mill.t].kind](t16.S, t16.me, t16.mill, [], null);
  ok(t16.mill.owner === 1, 'the mine of an ally is not flagged');
  const allyT = H.AI.begin(t16.S, 0), keys16 = H.AI.candidates(t16.S, allyT, t16.me, 6).map(g => g.key);
  ok(!keys16.includes('h' + t16.khan.id) && !keys16.includes('o' + t16.khanTown.id) && !keys16.includes('o' + t16.mill.id), 'the AI does not walk at its allies');
  ok(!Adv.WIN.defeat.done(t16.S, t16.S.players[0]), 'an enemy still stands');
  t16.S.players[2].out = true;
  ok(Adv.WIN.defeat.done(t16.S, t16.S.players[0]), 'beating the enemies is enough, the allies stay');
  t16.S.players[2].out = false;
  ok(!!H.HEROES.find(x => x.id === 'kaidar').story, 'Kaidar is a story hero');
  for (let i = 0; i < 40; i++) {
    TW.rollInn(t16.S, t16.town);
    if (t16.town.tavern.includes('kaidar')) ok(false, 'a story hero sits in a tavern');
  }

  const b16 = blank16('', M => ({ pack: MD.add(M, { t: 'monster', c: 22, r: 24, owner: -1, unit: 'bandits', count: 3, max: 3, mood: 'hostile' }), gold: MD.add(M, { t: 'res-gold', c: 16, r: 17, owner: -1 }) }));
  b16.me.patrol = { c: b16.me.c, r: b16.me.r, l: 0, rad: 3 };
  const beat16 = H.AI.candidates(b16.S, H.AI.begin(b16.S, 0), b16.me, 6);
  ok(beat16.length > 0 && beat16.every(g => Math.max(Math.abs(g.c - b16.me.c), Math.abs(g.r - b16.me.r)) <= 4), 'a hero on a beat looks no further than the beat (' + beat16.map(g => g.key).join(' ') + ')');
  const p16 = blank16('event day 1 -> a\n@a\npatrol khan 4\npatrol me 0\nend\n');
  p16.me.patrol = { c: 0, r: 0, l: 0, rad: 1 };
  Sc.opening(p16.S);
  settle16(p16.S);
  ok(p16.khan.patrol && p16.khan.patrol.rad === 4 && p16.khan.patrol.c === p16.khan.c && !p16.me.patrol, 'the patrol command sets and clears a beat');
  ok(Sc.check('event day 1 -> a\n@a\npatrol nowhere 1\npatrol khan x\nend\n', [], new Set(['khan'])).length === 2, 'the check finds a broken patrol command');

  const c16 = blank16('event capture far -> mine\nevent capture far player 1 -> his\n@mine\nset mine\nend\n@his\nset his\nflag far 0\nend\n');
  settle16(c16.S);
  ok(!c16.S.script.flags.mine && !c16.S.script.flags.his, 'nothing is captured yet');
  c16.far.owner = 1;
  settle16(c16.S);
  ok(c16.S.script.flags.his === 1 && c16.far.owner === 0 && c16.S.script.flags.mine === 1, 'two capture events on one town both see their own owner');

  const saved16 = H.Save.unpack(H.Save.pack(w16.S)), wagon16 = saved16.map.objs.find(o => o.tag === 'run');
  ok(!!wagon16.route && wagon16.pace === 6 && wagon16.routeDone === true && saved16.players.map(p => p.team).join() === '0,0,1', 'the save keeps the road of the wagons and the teams');
  const cast16 = blank16('');
  cast16.S.campaign = { id: 'sol', mission: 0, hero: 'aisulu', flags: {} };
  cast16.S.map.scenes = '@a\nkulpash: Слово.\nend\n';
  for (let i = 0; i < 40; i++) {
    TW.rollInn(cast16.S, cast16.town);
    if (cast16.town.tavern.includes('kulpash')) ok(false, 'someone who speaks in the mission sits in a tavern');
  }
  const k16 = blank16('', M => ({}));
  k16.S.goals.lose.push({ kind: 'town', town: k16.town.id });
  k16.town.garrison = [{ unit: 'mourner', count: 40 }, null, null, null, null, null, null];
  const gate16 = MD.entry(k16.town);
  k16.me.c = gate16[0];
  k16.me.r = gate16[1];
  const kept16 = H.AI.begin(k16.S, 0);
  for (let i = 0; i < 200 && !k16.S.over; i++) {
    const st = H.AI.step(k16.S, kept16);
    if (st.battle) break;
    if (st.done) break;
  }
  ok(k16.me.army.some(s => s && s.unit === 'mourner'), 'the AI takes troops from a town it must keep when nothing threatens it');

  const playAll16 = (index, seed) => {
    CP.reset();
    const r = CP.begin('sol', 'easy');
    if (index) {
      const S0 = { rs: seed >>> 0, ver: 0 }, h0 = H.Hero.init({ hid: 'aisulu', cls: 'shaman', faction: 'barrows', level: 1, xp: H.XP_TABLE[camp.missions[index - 1].levelCap], army: [], c: 0, r: 0, l: 0 }, {});
      H.Hero.autoUp(S0, h0);
      r.hero = CP.carryOf(h0, []);
    }
    const def = CP.setup('sol', index, { seed, bonus: seed % 3 }), S = Adv.create(def.map, def.setup);
    Sc.opening(S);
    for (let g = 0; g < 400 && !S.over; g++) {
      while (S.scene) Sc.advance(S, 0);
      const T = H.AI.begin(S, S.turn);
      for (let i = 0; i < 40000 && !S.over; i++) {
        while (S.scene) Sc.advance(S, 0);
        const st = H.AI.step(S, T);
        if (st.battle) {
          const setup = st.battle === true ? Adv.battleSetup(S) : st.battle, B = H.Battle.create(setup);
          H.BattleAI.play(B, 60);
          Adv.battleDone(S, B);
        }
        if (st.done) break;
      }
      while (S.scene) Sc.advance(S, 0);
      if (!S.over) Adv.endTurn(S);
    }
    return S;
  };
  for (let i = 0; i < 5; i++) {
    const S = playAll16(i, [2000, 2001, 2002, 2003, 2003][i]);
    ok(!!S.over && S.over.winner === 0, camp.missions[i].id + ': the AI in the human slot finishes the mission (' + S.day + ' days)');
    ok(S.script.goals.filter(g => g.id !== 'spare' && !g.id.startsWith('mirror')).every(g => g.state === 'done'), camp.missions[i].id + ': the win closes its goals (' + S.script.goals.map(g => g.id + ':' + g.state).join(' ') + ')');
  }
  CP.reset();
}

{
  const BA17 = H.Battle, Adv17 = H.Adv, TW17 = H.Town, MD17 = H.MapData, HE17 = H.Hero;
  const field = (left, right, o) => BA17.create(Object.assign({ seed: 5, obstacles: [], sides: [{ stacks: left }, { stacks: right }] }, o || {}));
  const hits = (ev, kind) => ev.filter(e => e.t === 'hit' && e.kind === kind);
  const heroBits = more => Object.assign({ brush: 0, perks: [], spells: [], ranks: {}, mana: 0, power: 0, level: 1 }, more || {});
  const toRound = (B, n) => {
    for (let i = 0; i < 400 && B.round < n && B.winner < 0; i++) BA17.act(B, { type: 'defend' });
  };

  for (const id of H.FACTIONS.thicket.units.flat()) {
    const [blow, shot, fall] = H.UNIT_SOUNDS.SOUND_OF[id] || [];
    ok(!!H.UNIT_SOUNDS.BLOWS[blow] && (!shot || !!H.UNIT_SOUNDS.SHOTS[shot]) && !!H.UNIT_SOUNDS.FALLS[fall] && !!shot === !!H.UNITS[id].shots, id + ' has its own sounds');
    ok(H.unitTraits(H.UNITS[id]).length >= 1, id + ' lists its traits');
  }
  ok(!!H.THEMES.town_thicket && H.THEMES.town_thicket.voices.every(v => v.notes.split(' ').every(n => n === '.' || H.noteFreq(n) > 0)), 'the Thicket has its town theme');
  ok(!!H.HEROES.find(x => x.id === 'borovoy').story && !H.HEROES.find(x => x.id === 'vedana').story, 'Боровой is outside the eight, Ведана is one of them');

  const ring6 = [[3, 4], [1, 4], [2, 3], [1, 3], [2, 5], [1, 5]];
  const walk = field([{ unit: 'auka', count: 5, c: 2, r: 4 }], [{ unit: 'militia', count: 1, c: 13, r: 9 }], { obstacles: ring6, ready: [100, 0] });
  const out = [...BA17.reach(walk, walk.stacks[0]).values()].filter(p => p.steps);
  ok(out.length > 0 && out.every(p => !ring6.some(o => o[0] === p.c && o[1] === p.r)), 'Заросли: creatures of the Thicket walk through obstacles and do not stop on them');
  const stuck = field([{ unit: 'militia', count: 5, c: 2, r: 4 }], [{ unit: 'militia', count: 1, c: 13, r: 9 }], { obstacles: ring6, ready: [100, 0] });
  ok(![...BA17.reach(stuck, stuck.stacks[0]).values()].some(p => p.steps), 'other peoples stay behind them');
  const wall17 = BA17.create({ seed: 5, obstacles: [], ready: [100, 0], siege: { fort: 2, faction: 'league', dmg: 0 }, sides: [{ stacks: [{ unit: 'auka', count: 5, c: 8, r: 2 }] }, { stacks: [{ unit: 'militia', count: 1, c: 13, r: 9 }] }] });
  ok(![...BA17.reach(wall17, wall17.stacks[0]).values()].some(p => p.c > wall17.siege.col), 'stone walls still stop them');

  const auto = field([{ unit: 'auka', count: 5, c: 1, r: 4 }, { unit: 'kikimora', count: 2, c: 0, r: 7 }], [{ unit: 'militia', count: 4, c: 12, r: 4 }], { sides: [{ stacks: [{ unit: 'auka', count: 5, c: 1, r: 4 }, { unit: 'kikimora', count: 2, c: 0, r: 7 }], hero: heroBits({ brush: 3 }) }, { stacks: [{ unit: 'militia', count: 4, c: 12, r: 4 }] }] });
  const planted = auto.temp.filter(t => t.brush === 0);
  ok(planted.length === 3 && planted.every(t => t.c < BT.cols / 2) && auto.obstacles.length === 3, 'an AI hero plants all brush on his half at the start');
  const hand = BA17.create({ seed: 5, obstacles: [], ready: [100, 0], sides: [{ plantByHand: true, stacks: [{ unit: 'auka', count: 5, c: 1, r: 4 }], hero: heroBits({ brush: 2 }) }, { stacks: [{ unit: 'militia', count: 4, c: 12, r: 4 }] }] });
  ok(hand.sides[0].plantLeft === 2 && !hand.obstacles.length, 'a player plants by hand');
  ok(!BA17.plantOkay(hand, 0, 9, 4) && BA17.plantOkay(hand, 0, 4, 4) && !BA17.plantOkay(hand, 0, 1, 4), 'only free cells of his half');
  BA17.plant(hand, 0, 4, 4);
  ok(hand.sides[0].plantLeft === 1 && hand.obstacles.length === 1 && BA17.touchesBrush(hand, { unit: 'auka', c: 3, r: 4 }, 0), 'one planted, one left');
  BA17.act(hand, { type: 'defend' });
  ok(hand.sides[0].plantLeft === 0 && hand.temp.filter(t => t.brush === 0).length === 2, 'the first action plants the rest');
  assert.throws(() => BA17.plant(hand, 0, 5, 5), /plant/);
  const whisper = BA17.create({ seed: 5, obstacles: [], ready: [100, 0], sides: [{ plantByHand: true, stacks: [{ unit: 'auka', count: 5, c: 1, r: 4 }], hero: heroBits({ brush: 1, brushWhisper: true }) }, { stacks: [{ unit: 'militia', count: 4, c: 12, r: 4 }] }] });
  ok(BA17.plantOkay(whisper, 0, 9, 4), 'Шёпот листвы: the enemy half too');

  const vedana = heroMap('sage', { hid: 'vedana' }).h, plain = heroMap('huntsman', { hid: 'yarina' }).h, league = heroMap('captain', { hid: 'adelina' }).h;
  ok(HE17.battleHero(plain).brush === 2 && HE17.battleHero(league).brush === 0, 'a Thicket hero has 2 brush, others none');
  plain.skills.tactics = 2;
  ok(HE17.battleHero(plain).brush === 4, '+1 for every rank of Tactics (' + HE17.battleHero(plain).brush + ')');
  plain.talents.push('thicket-1');
  ok(HE17.battleHero(plain).brush === 5 && HE17.battleHero(plain).brushWhisper, 'Шёпот листвы gives one more');
  vedana.level = 12;
  ok(HE17.battleHero(vedana).brush === 4, 'Заговор: +1 for every 6 levels');

  const thorns = BA17.create({ seed: 5, obstacles: [], ready: [100, 0, 0], sides: [{ plantByHand: true, stacks: [{ unit: 'plated', count: 10, c: 3, r: 4 }], hero: heroBits({ brush: 1, brushThorn: 0.05 }) }, { stacks: [{ unit: 'plated', count: 10, c: 5, r: 4 }, { unit: 'plated', count: 10, c: 12, r: 8 }] }] });
  BA17.plant(thorns, 0, 4, 4);
  const near0 = BA17.total(thorns.stacks[1]), far0 = BA17.total(thorns.stacks[2]), own0 = BA17.total(thorns.stacks[0]);
  toRound(thorns, 2);
  ok(BA17.total(thorns.stacks[1]) === near0 - Math.ceil(near0 * 0.05) && BA17.total(thorns.stacks[2]) === far0 && BA17.total(thorns.stacks[0]) === own0, 'Колючие заросли: only enemies next to the brush bleed 5 %');
  const roots = BA17.create({ seed: 5, obstacles: [], ready: [0, 100], sides: [{ plantByHand: true, stacks: [{ unit: 'plated', count: 10, c: 3, r: 4 }], hero: heroBits({ brush: 1, brushRoots: 15 }) }, { stacks: [{ unit: 'plated', count: 10, c: 5, r: 4 }] }] });
  BA17.plant(roots, 0, 4, 4);
  roots.stacks[1].ready = 99;
  roots.active = 0;
  roots.stacks[0].ready = 100;
  const rootsEv = BA17.act(roots, { type: 'defend' });
  ok(rootsEv.some(e => e.t === 'trait' && e.name === 'Корни держат' && e.id === 1) && roots.stacks[1].rooted === roots.round, 'Корни держат: an enemy starting next to the brush loses readiness');
  const blood = BA17.create({ seed: 5, obstacles: [], ready: [100, 0], sides: [{ plantByHand: true, stacks: [{ unit: 'plated', count: 10, c: 3, r: 4 }], hero: heroBits({ brush: 1, brushBlood: 0.1 }) }, { stacks: [{ unit: 'militia', count: 2, c: 12, r: 8 }] }] });
  BA17.plant(blood, 0, 4, 4);
  BA17.hurt(blood.stacks[0], 100);
  const blood0 = BA17.total(blood.stacks[0]);
  toRound(blood, 2);
  ok(BA17.total(blood.stacks[0]) === blood0 + Math.round(10 * BA17.hpOf(blood.stacks[0]) * 0.1), 'Лесная кровь: heals next to the brush');

  const wake = BA17.create({ seed: 5, obstacles: [], ready: [100, 0], sides: [{ plantByHand: true, stacks: [{ unit: 'plated', count: 10, c: 1, r: 4 }], hero: heroBits({ brush: 2, high: 'forest', level: 24 }) }, { stacks: [{ unit: 'militia', count: 200, c: 12, r: 8 }] }] });
  BA17.plant(wake, 0, 5, 2);
  BA17.plant(wake, 0, 5, 6);
  ok(BA17.canOrder(wake, 'high'), 'Пробуждение леса is ready');
  const wakeEv = BA17.act(wake, { type: 'order', order: 'high' });
  const trees = wake.stacks.filter(s => s.unit === 'woodtree');
  ok(trees.length === 2 && trees.every(t => t.count === 7 && t.summoned && t.expire === 3) && !wake.obstacles.length && wakeEv.some(e => e.t === 'order' && e.order === 'forest'), 'the brush stands up as trees for 3 rounds');
  ok(!BA17.canOrder(wake, 'high'), 'once a battle');
  toRound(wake, 4);
  ok(trees.every(t => t.count === 0) && wake.temp.filter(t => t.brush === 0).length === 2 && wake.obstacles.length === 2, 'then the trees are brush again');

  const shotClose = field([{ unit: 'wisp', count: 5, c: 4, r: 4 }], [{ unit: 'militia', count: 5, c: 5, r: 4 }], { ready: [100, 0] });
  ok(BA17.canShoot(shotClose, shotClose.stacks[0]), 'Блуждающие огни shoot next to an enemy');
  const old17 = field([{ unit: 'elderwolf', count: 30, c: 4, r: 4 }], [{ unit: 'militia', count: 60, c: 5, r: 4 }], { ready: [100, 0] });
  ok(hits(BA17.act(old17, { type: 'attack', target: 1, c: 4, r: 4 }), 'melee').length === 2, 'Матёрые волколаки hit twice standing still');
  const run17 = field([{ unit: 'elderwolf', count: 30, c: 2, r: 4 }], [{ unit: 'militia', count: 60, c: 5, r: 4 }], { ready: [100, 0] });
  ok(hits(BA17.act(run17, { type: 'attack', target: 1, c: 4, r: 4 }), 'melee').length === 1, 'and once after a walk');
  const howl = field([{ unit: 'greyturn', count: 30, c: 4, r: 4 }, { unit: 'auka', count: 5, c: 1, r: 1 }], [{ unit: 'militia', count: 1, c: 5, r: 4 }, { unit: 'militia', count: 50, c: 12, r: 8 }], { ready: [100, 0, 0, 0] });
  const howlEv = BA17.act(howl, { type: 'attack', target: 2, c: 4, r: 4 });
  ok(howlEv.some(e => e.t === 'trait' && e.name === 'Вой') && BA17.moraleOf(howl, howl.stacks[1]) === 1, 'Вой: killing a stack gives morale');

  const wardB = field([{ unit: 'bereginya', count: 10, c: 2, r: 2 }, { unit: 'auka', count: 20, c: 4, r: 4 }], [{ unit: 'militia', count: 30, c: 5, r: 4 }], { ready: [100, 0, 0] });
  const noWard = BA17.forecast(wardB, wardB.stacks[2], wardB.stacks[1], 'melee', { c: 5, r: 4 }).max;
  ok(BA17.canWard(wardB.stacks[0]) && BA17.wardList(wardB, wardB.stacks[0]).length === 2, 'Оберег: any own stack');
  BA17.act(wardB, { type: 'ward', target: 1 });
  ok(BA17.forecast(wardB, wardB.stacks[2], wardB.stacks[1], 'melee', { c: 5, r: 4 }).max < noWard * 0.75, 'and it takes 30 % less damage');
  wardB.stacks[0].warded = 3;
  ok(!BA17.canWard(wardB.stacks[0]), 'three times a battle');
  const clean = field([{ unit: 'keeper', count: 10, c: 2, r: 2 }, { unit: 'auka', count: 20, c: 4, r: 4 }], [{ unit: 'militia', count: 30, c: 12, r: 4 }], { ready: [100, 0, 0] });
  clean.stacks[1].fx.push({ spell: 'hex', atk: -3, until: 9, bad: true });
  BA17.act(clean, { type: 'ward', target: 1 });
  ok(!clean.stacks[1].fx.some(e => e.bad), 'Хранительницы lift curses');
  const pull = field([{ unit: 'rusalka', count: 10, c: 2, r: 4 }], [{ unit: 'crossbow', count: 20, c: 5, r: 4 }], { ready: [100, 0] });
  ok(BA17.act(pull, { type: 'lasso', target: 1 }).some(e => e.t === 'trait' && e.name === 'Затянуть') && pull.stacks[1].c === 3, 'Русалки pull a target two cells');

  const mud = field([{ unit: 'kikimora', count: 10, c: 2, r: 4 }], [{ unit: 'plated', count: 30, c: 9, r: 4 }], { ready: [100, 0] });
  const init0 = BA17.initOf(mud.stacks[1]);
  BA17.act(mud, { type: 'shoot', target: 1 });
  ok(BA17.initOf(mud.stacks[1]) === Math.round(init0 * 0.7), 'Тина: −30 % initiative');
  const bog = field([{ unit: 'bogwitch', count: 10, c: 2, r: 4 }], [{ unit: 'plated', count: 30, c: 9, r: 4 }, { unit: 'shade', count: 30, c: 9, r: 7 }], { ready: [100, 0, 0] });
  BA17.act(bog, { type: 'shoot', target: 1 });
  ok(BA17.fxs(bog.stacks[1], 'poison') > 0, 'Болотницы poison');
  const snare = field([{ unit: 'spinner', count: 10, c: 2, r: 4 }], [{ unit: 'plated', count: 30, c: 9, r: 4 }], { ready: [100, 0] });
  BA17.act(snare, { type: 'shoot', target: 1 });
  ok(BA17.fxHas(snare.stacks[1], 'noMove'), 'Путы: the target stands still');
  BA17.act(Object.assign(snare, { active: 1 }), { type: 'defend' });
  ok(!BA17.fxHas(snare.stacks[1], 'noMove'), 'it lasts one turn');
  snare.active = 0;
  snare.stacks[0].ready = 100;
  BA17.act(snare, { type: 'shoot', target: 1 });
  ok(!BA17.fxHas(snare.stacks[1], 'noMove'), 'not again at once');

  const sing = field([{ unit: 'sirin', count: 5, c: 4, r: 4 }], [{ unit: 'militia', count: 100, c: 5, r: 4 }, { unit: 'militia', count: 20, c: 5, r: 5 }, { unit: 'militia', count: 20, c: 12, r: 8 }], { ready: [100, 50, 50, 50] });
  BA17.act(sing, { type: 'attack', target: 1, c: 4, r: 4 });
  ok(sing.stacks[2].ready === sing.stacks[3].ready - 15, 'Песнь: neighbours of the target lose readiness');
  const joy = field([{ unit: 'alkonost', count: 5, c: 2, r: 2 }, { unit: 'plated', count: 10, c: 2, r: 4 }, { unit: 'plated', count: 10, c: 9, r: 9 }], [{ unit: 'militia', count: 50, c: 13, r: 0 }], { ready: [99, 0, 0, 0] });
  BA17.hurt(joy.stacks[1], 200);
  BA17.hurt(joy.stacks[2], 200);
  const j0 = BA17.total(joy.stacks[1]), j1 = BA17.total(joy.stacks[2]);
  toRound(joy, 3);
  ok(BA17.total(joy.stacks[1]) > j0 && BA17.total(joy.stacks[2]) === j1, 'Радостная песнь: stacks within 2 cells heal');
  const cry = field([{ unit: 'gamayun', count: 5, c: 2, r: 2 }, { unit: 'plated', count: 10, c: 2, r: 4 }], [{ unit: 'militia', count: 50, c: 13, r: 0 }], { ready: [100, 10, 0] });
  const cry0 = cry.stacks[1].ready;
  BA17.act(cry, { type: 'cry', target: 1 });
  ok(cry.stacks[1].ready >= cry0 + 30 && cry.stacks[0].cried === 1 && BA17.cryList(cry, cry.stacks[0]).every(t => t !== cry.stacks[0]), 'Вещий крик: +30 readiness to another stack');

  const shove = field([{ unit: 'leshy', count: 3, c: 3, r: 4 }], [{ unit: 'militia', count: 200, c: 5, r: 4 }], { ready: [100, 0] });
  ok(BA17.act(shove, { type: 'attack', target: 1, c: 4, r: 4 }).some(e => e.t === 'trait' && e.name === 'Сбить с пути') && shove.stacks[1].c === 6, 'Лешие push the target a cell');
  const grip = field([{ unit: 'borovik', count: 3, c: 3, r: 4 }], [{ unit: 'militia', count: 200, c: 5, r: 4 }], { ready: [100, 0] });
  ok(BA17.act(grip, { type: 'attack', target: 1, c: 4, r: 4 }).some(e => e.t === 'trait' && e.name === 'Оплетение') && BA17.fxHas(grip.stacks[1], 'noMove'), 'Боровики hold it');
  const guard17 = BA17.create({ seed: 5, obstacles: [[4, 3], [4, 5]], ready: [100, 0, 0], sides: [{ stacks: [{ unit: 'militia', count: 50, c: 2, r: 4 }] }, { stacks: [{ unit: 'warden', count: 3, c: 4, r: 4 }, { unit: 'warden', count: 3, c: 12, r: 8 }] }] });
  ok(BA17.forecast(guard17, guard17.stacks[0], guard17.stacks[1], 'melee', { c: 2, r: 4 }).max < BA17.forecast(guard17, guard17.stacks[0], guard17.stacks[2], 'melee', { c: 2, r: 4 }).max, 'Сторож: obstacles nearby give Стойкость');
  const grow = field([{ unit: 'warden', count: 3, c: 3, r: 4 }], [{ unit: 'militia', count: 5, c: 13, r: 0 }], { ready: [100, 0] });
  ok(BA17.growOkay(grow, grow.stacks[0], 5, 4) && !BA17.growOkay(grow, grow.stacks[0], 9, 4), 'Лесовики plant within 2 cells');
  BA17.act(grow, { type: 'grow', c: 5, r: 4 });
  ok(grow.obstacles.length === 1 && grow.temp[0].brush === 0 && !BA17.canGrow(grow.stacks[0]), 'once a battle');

  const flame = field([{ unit: 'zmey', count: 2, c: 3, r: 4 }], [{ unit: 'militia', count: 200, c: 5, r: 4 }, { unit: 'militia', count: 50, c: 6, r: 4 }], { ready: [100, 0, 0] });
  ok(hits(BA17.act(flame, { type: 'attack', target: 1, c: 4, r: 4 }), 'flame').length === 1, 'Змей: flame on the cell behind');
  const three = field([{ unit: 'threeheaded', count: 2, c: 3, r: 4 }], [{ unit: 'militia', count: 200, c: 5, r: 4 }, { unit: 'militia', count: 50, c: 4, r: 3 }, { unit: 'militia', count: 50, c: 4, r: 5 }, { unit: 'militia', count: 50, c: 12, r: 9 }], { ready: [100, 0, 0, 0, 0] });
  const threeEv = BA17.act(three, { type: 'attack', target: 1, c: 4, r: 4 });
  ok(hits(threeEv, 'sweep').length === 2 && threeEv.filter(e => e.t === 'hit' && e.to === 4).length === 0, 'Трёхглавый змей hits two more neighbours');
  const fire = field([{ unit: 'firezmey', count: 2, c: 3, r: 4 }], [{ unit: 'militia', count: 500, c: 5, r: 4 }], { ready: [100, 0] });
  BA17.act(fire, { type: 'attack', target: 1, c: 4, r: 4 });
  ok(fire.zones.length === 1 && fire.zones[0].cells.length === 3 && fire.zones[0].until === 2, 'Огненный змей: grass burns on 3 cells for 2 rounds');
  fire.active = 0;
  fire.stacks[0].ready = 100;
  BA17.act(fire, { type: 'attack', target: 1, c: 4, r: 4 });
  ok(fire.zones.length === 1, 'one fire at a time');

  for (const row of H.FACTIONS.thicket.units) {
    for (const id of row) {
      const B = BA17.create({ seed: 9, sides: [{ stacks: [{ unit: id, count: 30 }, { unit: 'auka', count: 40 }], hero: heroBits({ brush: 3, brushThorn: 0.05, brushRoots: 15, brushBlood: 0.1, high: 'forest', level: 24 }) }, { stacks: [{ unit: 'militia', count: 100 }, { unit: 'crossbow', count: 30 }] }] });
      ok(H.BattleAI.play(B, 60) >= 0 || B.round > 60, id + ': the AI plays a whole battle');
    }
  }

  const berTown = townMap('thicket', ['hall1', 'fort1', 'special2', 'special3', 'dwell1']);
  const growth0 = TW17.growth(berTown.S, berTown.o, 1);
  ok(growth0 === H.UNITS.auka.growth + 4, 'Медовый двор: +4 ауки');
  ok(TW17.def(berTown.o, 'special3').income.gold === 250, 'Медовый двор: +250 gold');
  const sideTown = (() => {
    const M = MD17.create(30, 20, ['meadow']), t = MD17.add(M, { t: 'town', c: 10, r: 5, owner: 1, faction: 'thicket', name: 'П', built: ['hall1', 'fort1', 'special2'], garrison: [{ unit: 'auka', count: 20 }] });
    M.scenes = '';
    M.events = [];
    const S = Adv17.create(M, { seed: 3, moons: null, players: [{ name: 'Л', color: 0, faction: 'league', human: true }, { name: 'Ч', color: 1, faction: 'thicket', human: false }], heroes: [{ owner: 0, hid: 'adelina', name: 'А', cls: 'captain', faction: 'league', c: 2, r: 2, army: [{ unit: 'militia', count: 20 }] }] });
    S.pending = { kind: 'town', hero: 0, obj: t.id, from: [2, 2] };
    return Adv17.battleSetup(S);
  })();
  const far17 = sideTown.sides[1];
  ok(far17.luck === 1 && far17.stacks.every(x => x.hpPlus === 0.1), 'Священная берёза: +1 luck and +10 % health for the garrison');
  const b17 = BA17.create(sideTown);
  ok(BA17.hpOf(b17.stacks.find(s => s.side === 1)) === Math.round(H.UNITS.auka.hp * 1.1), 'and the health really grows');
  ok(TW17.def(berTown.o, 'special4') && H.FACTIONS.thicket.building.special4.guildPlus.join() === 'rostan,morok', 'Капище: more spells of the two schools');

  const ringMap = (() => {
    const M = MD17.create(48, 48, ['meadow']), a = MD17.add(M, { t: 'town', c: 4, r: 4, owner: 0, faction: 'thicket', name: 'Первый', built: ['hall1', 'special1'] }), b = MD17.add(M, { t: 'town', c: 36, r: 36, owner: 0, faction: 'thicket', name: 'Второй', built: ['hall1', 'special1'] }), c = MD17.add(M, { t: 'witchring', c: 30, r: 4, owner: -1 }), off = MD17.add(M, { t: 'town', c: 4, r: 36, owner: 0, faction: 'thicket', name: 'Без кольца', built: ['hall1'] });
    M.scenes = '';
    M.events = [];
    const e = MD17.entry(a), S = Adv17.create(M, { seed: 3, moons: null, players: [{ name: 'Ч', color: 0, faction: 'thicket', human: true }], heroes: [{ owner: 0, hid: 'yarina', name: 'Я', cls: 'huntsman', faction: 'thicket', c: e[0], r: e[1], army: [{ unit: 'auka', count: 30 }] }, { owner: 0, hid: 'adelina', name: 'А', cls: 'captain', faction: 'league', c: 20, r: 20, army: [{ unit: 'militia', count: 30 }] }] });
    return { S, a, b, c, off, h: S.heroes[0], stranger: S.heroes[1] };
  })();
  const Si = H.Sites, full17 = Adv17.daySteps(ringMap.S, ringMap.h);
  ok(Si.ringHere(ringMap.S, ringMap.h) === ringMap.a && Si.ringsOf(ringMap.S, 0).length === 2 && Si.ringTargets(ringMap.S, ringMap.h, ringMap.a)[0] === ringMap.b, 'towns with a ring are linked, a town without one is not');
  ok(Si.ringCost(ringMap.S, ringMap.h) === Math.ceil(full17 * 0.5) && !Si.ringWhy(ringMap.S, ringMap.h), 'a jump costs half of the day');
  ok(/Чащу/.test(Si.ringWhy(ringMap.S, ringMap.stranger)), 'other peoples cannot use it');
  const steps0 = ringMap.h.steps;
  ok(Si.ringJump(ringMap.S, ringMap.h, ringMap.b, []) && ringMap.h.c === MD17.entry(ringMap.b)[0] && ringMap.h.steps === steps0 - Si.ringCost(ringMap.S, ringMap.h), 'the jump moves the hero and takes the steps');
  ok(/уже водило/.test(Si.ringWhy(ringMap.S, ringMap.h)) && !Si.ringJump(ringMap.S, ringMap.h, ringMap.a, []), 'once a day');
  ringMap.h.talents.push('thicket-5');
  ok(Si.ringCost(ringMap.S, ringMap.h) === Math.ceil(Adv17.daySteps(ringMap.S, ringMap.h) * 0.25), 'Короткий путь: a quarter');
  const readEv = [];
  H.OBJ_VISIT.witchring(ringMap.S, ringMap.stranger, ringMap.c, readEv);
  ok(readEv.some(e => e.t === 'read') && ringMap.c.owner === -1 && !ringMap.S.pending, 'for other peoples the ring is a meadow');
  ringMap.h.ringDay = 0;
  ringMap.h.steps = 40;
  [ringMap.h.c, ringMap.h.r] = MD17.entry(ringMap.c);
  H.OBJ_VISIT.witchring(ringMap.S, ringMap.h, ringMap.c, []);
  ok(ringMap.c.owner === 0 && ringMap.S.pending && ringMap.S.pending.site === 'ring' && ringMap.S.pending.ai === 'stay' && ringMap.S.pending.options.length === 3, 'a Thicket hero flags the circle and may go');
  const toA = ringMap.S.pending.options.find(x => x[1] === 'Первый')[0];
  Adv17.resolve(ringMap.S, toA);
  ok(ringMap.h.c === MD17.entry(ringMap.a)[0] && ringMap.h.r === MD17.entry(ringMap.a)[1], 'the answer takes him there');

  const wood = (() => {
    const M = MD17.create(30, 20, ['forest']);
    MD17.paint(M, 0, 'swamp', (c, r) => r === 6);
    M.scenes = '';
    M.events = [];
    const S = Adv17.create(M, { seed: 3, moons: null, players: [{ name: 'Ч', color: 0, faction: 'thicket', human: true }], heroes: [{ owner: 0, hid: 'yarina', name: 'Я', cls: 'huntsman', faction: 'thicket', c: 5, r: 5, army: [{ unit: 'auka', count: 30 }] }, { owner: 0, hid: 'adelina', name: 'А', cls: 'captain', faction: 'league', c: 20, r: 5, army: [{ unit: 'militia', count: 30 }] }] });
    return { S, h: S.heroes[0], g: S.heroes[1] };
  })();
  const G17 = Adv17.grid(wood.S, 0, 0);
  ok(Adv17.stepCost(wood.S, wood.h, G17, 0, 5, 6) === 1 && Adv17.stepCost(wood.S, wood.h, G17, 0, 6, 5) === 1, 'forest and swamp do not slow Thicket heroes');
  ok(Adv17.stepCost(wood.S, wood.g, G17, 0, 20, 6) > 1 && Adv17.stepCost(wood.S, wood.g, G17, 0, 21, 5) > 1, 'other peoples are slowed');
  const beast0 = Adv17.daySteps(wood.S, wood.h);
  wood.h.talents.push('thicket-2');
  ok(Adv17.daySteps(wood.S, wood.h) === beast0 + 2, 'Тропа зверя: +2 steps in the forest');
  const tree = townMap('thicket', ['hall1', 'altar']), treeSteps = Adv17.daySteps(tree.S, tree.hero);
  ok(H.Town.worldTree(tree.S, 0), 'Мировое древо stands');
  tree.o.built = ['hall1'];
  ok(!H.Town.worldTree(tree.S, 0) && Adv17.daySteps(tree.S, tree.hero) === treeSteps - 2, 'it gives +2 steps');
  tree.o.built = ['hall1', 'altar'];
  const treeG = Adv17.grid(tree.S, 0, 0);
  MD17.paint(tree.S.map, 0, 'forest', (c, r) => c === 20);
  ok(Adv17.stepCost(tree.S, tree.hero, treeG, 0, 20, 10) === H.ROADS[1].cost, 'and the forest costs like a road');

  const setup17 = (() => {
    const M = MD17.create(30, 20, ['meadow']);
    M.scenes = '';
    M.events = [];
    const S = Adv17.create(M, { seed: 3, moons: null, players: [{ name: 'Ч', color: 0, faction: 'thicket', human: true }, { name: 'Л', color: 1, faction: 'thicket', human: false }], heroes: [{ owner: 0, hid: 'yarina', name: 'Я', cls: 'huntsman', faction: 'thicket', c: 5, r: 5, army: [{ unit: 'auka', count: 30 }] }, { owner: 1, hid: 'miroslav', name: 'М', cls: 'huntsman', faction: 'thicket', c: 6, r: 5, army: [{ unit: 'auka', count: 30 }] }] });
    S.pending = { kind: 'duel', hero: 0, enemy: 1, from: [5, 5] };
    return Adv17.battleSetup(S);
  })();
  ok(setup17.sides[0].plantByHand === true && setup17.sides[1].plantByHand === false, 'a human plants by hand, the AI at once');
  const bb17 = BA17.create(setup17);
  ok(bb17.sides[0].plantLeft === 2 && bb17.temp.filter(t => t.brush === 1).length === 2 && !bb17.temp.some(t => t.brush === 0), 'and the battle starts that way');

  ok(H.AI && typeof H.Sites.ringHere === 'function', 'the AI has the ring tools');
  const hop = (() => {
    const M = MD17.create(60, 20, ['meadow']), a = MD17.add(M, { t: 'town', c: 2, r: 6, owner: 0, faction: 'thicket', name: 'А', built: ['hall1', 'fort1', 'special1'] }), b = MD17.add(M, { t: 'town', c: 52, r: 6, owner: 0, faction: 'thicket', name: 'Б', built: ['hall1', 'fort1', 'special1'] }), far = MD17.add(M, { t: 'goldmine', c: 56, r: 14, owner: -1 });
    M.scenes = '';
    M.events = [];
    const e = MD17.entry(a), S = Adv17.create(M, { seed: 3, moons: null, players: [{ name: 'Ч', color: 0, faction: 'thicket', human: false }], heroes: [{ owner: 0, hid: 'yarina', name: 'Я', cls: 'huntsman', faction: 'thicket', c: e[0], r: e[1], army: [{ unit: 'werewolf', count: 60 }] }] });
    S.players[0].seen[0].fill(1);
    const T = H.AI.begin(S, 0);
    for (let i = 0; i < 400 && !S.heroes[0].ringDay; i++) if (H.AI.step(S, T).done) break;
    return { S, h: S.heroes[0], far };
  })();
  ok(hop.h.ringDay === 1 && hop.h.c > 30, 'the AI uses the rings for a far target');
}

{
  const CP = H.Campaign, Sc = H.Script, MF = H.MapFile, Adv18 = H.Adv, MD18 = H.MapData;
  const camp = CP.get('zapoved'), makers = require(path.join(ROOT, 'tools/heroes98-camp3-maps.cjs'))(H), mapText = m => fs.readFileSync(path.join(ROOT, 'content/heroes98/maps', m.id + '.h98m'), 'utf8');
  ok(!!camp && camp.missions.length === 5 && camp.hero === 'vedana' && camp.faction === 'thicket' && camp.number === 3, 'the Thicket campaign has five missions, its hero and its people');
  camp.missions.forEach((m, i) => {
    const text = mapText(m), file = MF.read(text);
    ok(file.scenes === m.scenes, m.id + ': the file carries the scenes of the campaign module');
    ok(MF.write(Object.assign(makers[m.id](), { scenes: m.scenes })) === text, m.id + ': the file is what its maker builds');
    CP.attach(m, text);
    ok(!MF.blocking(MF.check(m.doc)).length, m.id + ': no blocking problems (' + MF.blocking(MF.check(m.doc)).map(x => x.text).join('; ') + ')');
    ok(!Sc.parse(m.scenes).errors.length, m.id + ': scenes parse');
    ok(m.brief.length > 150 && m.goals.length >= 1 && m.lose && m.name && m.about, m.id + ': has a briefing, goals and a way to lose');
    ok(m.levelCap > (i ? camp.missions[i - 1].levelCap : 1), m.id + ': the level cap grows');
    ok(m.bonuses.map(b => b.kind).sort().join() === 'art,res,unit', m.id + ': three bonuses, an artifact, creatures and resources');
    ok(m.bonuses.every(b => (b.kind === 'art' ? !!H.ARTIFACTS[b.id] : b.kind === 'unit' ? !!H.UNITS[b.unit] : Object.keys(b.res).every(k => H.RESOURCES.some(r => r[0] === k)))) && m.bonuses.every(b => CP.bonusText(b)), m.id + ': bonuses point at real things');
    const P = Sc.parse(m.scenes);
    for (const who of Sc.speakers(m.scenes)) ok(!!H.HEROES.find(x => x.id === who) || !!H.PEOPLE[who], m.id + ': the speaker ' + who + ' has a name');
    for (const who of Sc.speakers(m.scenes)) ok(H.Art.PORTRAITS.some(x => x.id === 'portrait/' + who), m.id + ': the speaker ' + who + ' has a portrait entry');
    for (const op of P.ops.filter(x => x.k === 'line')) ok(H.Font.wrap('text', op.text, 464).length <= 5, m.id + ': the line fits the text box: ' + op.text.slice(0, 30));
    for (const op of P.ops.filter(x => x.k === 'cmd' && x.cmd === 'spawn')) {
      const at = op.a[0] === 'hero' ? 3 : 2, col = +op.a[at], row = +op.a[at + 1], cells = m.doc.map;
      ok(MD18.inside(cells, col, row) && MD18.groundCost(cells, 0, col, row) > 0 && !cells.objs.some(o => o.l === 0 && MD18.cells(o).some(([x, y]) => x === col && y === row)), m.id + ': spawn cell ' + col + ',' + row + ' is free ground');
    }
    ok(!/Microsoft|Windows|—/.test([m.brief, m.scenes].join(' ')), m.id + ': no real names and no long dashes');
    ok(m.doc.heroes.some(h => h.hid === 'vedana' && h.owner === 0), m.id + ': Ведана starts it');
    ok(!Sc.check(m.scenes, [], new Set([...m.doc.map.objs.map(o => o.tag), ...m.doc.heroes.map(h => h.tag)].filter(Boolean))).length, m.id + ': the scene check finds nothing');
  });
  ok([...camp.opening, ...camp.ending, camp.about].every(s => typeof s === 'string' && s.length > 20 && !/—/.test(s)), 'the campaign has an opening and an ending in plain words');
  ok(camp.opening.length >= 3 && camp.ending.length >= 3 && !!H.THEMES[camp.theme], 'an opening, an ending and a theme of its own');

  CP.reset();
  ok(!CP.isOpen('zapoved'), 'the third campaign waits for the second');
  const r1 = CP.begin('nabat', 'easy');
  r1.finished = true;
  const r2 = CP.begin('sol', 'easy');
  r2.flags = { spared_villages: 1 };
  r2.finished = true;
  ok(CP.isOpen('zapoved') && CP.begin('zapoved', 'easy').flags.spared_villages === 1, 'a finished campaign opens the next one and hands over its flags');
  const lines18 = (index, flags) => {
    CP.reset();
    const r = CP.begin('zapoved', 'easy');
    r.flags = flags;
    if (index) r.hero = CP.carryOf(H.Hero.init({ hid: 'vedana', cls: 'sage', faction: 'thicket', level: 1, xp: 0, army: [], c: 0, r: 0, l: 0 }, {}), []);
    const def = CP.setup('zapoved', index, { seed: 5, bonus: 1 }), S = Adv18.create(def.map, def.setup), said = [];
    Sc.opening(S);
    for (let g = 0; g < 300 && S.scene; g++) {
      said.push(S.scene.text);
      Sc.advance(S, 0);
    }
    return { S, said, hero: S.heroes.find(h => h.hid === 'vedana') };
  };
  ok(lines18(2, { spared_villages: 1 }).said.some(t => /не тронула ни одного/.test(t)) && !lines18(2, {}).said.some(t => /не тронула ни одного/.test(t)), 'Аделина remembers the villages of the second campaign');
  const snake = lines18(4, { snake_free: 1 }), noSnake = lines18(4, {});
  ok(snake.hero.army.some(s => s && s.unit === 'zmey') && !noSnake.hero.army.some(s => s && s.unit === 'zmey'), 'the Serpent of mission 4 comes back in mission 5');
  ok(lines18(4, { zap_paid: 1 }).hero.army.some(s => s && s.unit === 'crossbow'), 'the paid peace of mission 3 sends crossbows');
  const moneyA = lines18(4, { villages_kept: 1 }).S.players[0].res.gold, moneyB = lines18(4, {}).S.players[0].res.gold;
  ok(moneyA === moneyB + 4000, 'the kept villages of mission 2 send gold');
  CP.reset();

  const blank18 = (scenes, extra) => {
    const M = MD18.create(48, 48, ['meadow']), made = extra ? extra(M) : {};
    M.scenes = scenes;
    M.events = [];
    const S = Adv18.create(M, { seed: 3, moons: null, goals: { win: [{ kind: 'flag', flag: 'n_never', text: 'Дальше' }], lose: [] }, players: [{ name: 'Ч', color: 0, faction: 'thicket', human: true, team: 0 }, { name: 'Б', color: 1, faction: 'thicket', human: false, team: 0 }], heroes: [{ owner: 0, hid: 'vedana', name: 'В', cls: 'sage', faction: 'thicket', c: 14, r: 16, tag: 'me', army: [{ unit: 'auka', count: 30 }] }, { owner: 1, hid: 'borovoy', name: 'Б', cls: 'huntsman', faction: 'thicket', c: 30, r: 16, tag: 'foe', army: [{ unit: 'werewolf', count: 20 }] }] });
    return Object.assign({ S, me: S.heroes[0], foe: S.heroes[1] }, made);
  };
  const settle18 = S => {
    Adv18.conclude(S, []);
    for (let g = 0; g < 300 && S.scene; g++) Sc.advance(S, 0);
  };

  const ev18 = blank18('event army sirin 3 -> got\n@got\nif army sirin\nset got\nend\nend\n');
  settle18(ev18.S);
  ok(!ev18.S.script.flags.got, 'no sirins yet');
  ev18.me.army[1] = { unit: 'sirin', count: 2 };
  settle18(ev18.S);
  ok(!ev18.S.script.flags.got, 'two are not enough');
  ev18.me.army[1].count = 3;
  settle18(ev18.S);
  ok(ev18.S.script.flags.got === 1, 'the army event fires and the army condition reads it');
  ok(Sc.parseEvent('army sirin 3 -> up').unit === 'sirin' && Sc.parseEvent('army sirin 3 -> up').n === 3 && Sc.eventText(Sc.parseEvent('army sirin 3 -> up')) === 'army sirin 3 -> up', 'the army event reads and writes back');

  const tm = blank18('event day 1 -> a\n@a\nteam 1 1\nend\n');
  ok(Adv18.allied(tm.S, 0, 1), 'allies at first');
  Sc.opening(tm.S);
  settle18(tm.S);
  ok(!Adv18.allied(tm.S, 0, 1) && tm.S.players[1].team === 1, 'the team command breaks the alliance');
  ok(Sc.check('event day 1 -> a\n@a\nteam x 1\nend\n', [], new Set()).length === 1, 'the check finds a broken team command');

  const burn = blank18('event defeat v1 -> gone\n@gone\nset gone\nend\n', M => ({ hut: MD18.add(M, { t: 'hamlet', c: 40, r: 40, owner: -1, tag: 'v1', gold: 1200, ward: 0 }) }));
  H.OBJ_VISIT.hamlet(burn.S, burn.foe, burn.hut, []);
  ok(!burn.hut.gone && burn.S.pending && burn.S.pending.site === 'hamlet', 'an ally does not burn a guarded village');
  Adv18.resolve(burn.S, 'leave');
  burn.S.players[1].team = 1;
  H.OBJ_VISIT.hamlet(burn.S, burn.foe, burn.hut, []);
  settle18(burn.S);
  ok(burn.hut.gone && burn.S.script.flags.gone === 1, 'an enemy burns it and the defeat event fires');

  for (let seed = 1; seed < 30; seed++) {
    const B = H.Battle.create({ seed, ready: [100, 0], sides: [{ plantByHand: true, stacks: [{ unit: 'auka', count: 30, c: 1, r: 4 }], hero: { brush: 6, perks: [], spells: [], ranks: {}, mana: 0, power: 0, level: 1 } }, { stacks: [{ unit: 'militia', count: 30, c: 12, r: 4 }] }] });
    const a = H.BattleAI.choose(B);
    H.Battle.act(B, a);
    ok(B.sides[0].plantLeft === 0, 'the AI of a human slot plants before it chooses, so its move never lands on new brush (seed ' + seed + ')');
  }
  const stone18 = blank18('event done st -> ok\n@ok\nset ok\nend\n', M => ({ st: MD18.add(M, { t: 'boundstone', c: 40, r: 10, owner: -1, tag: 'st', quest: { kind: 'res', res: { amber: 2 } }, reward: { gold: 100 } }) }));
  stone18.S.players[0].res.amber = 2;
  H.OBJ_VISIT.quest(stone18.S, stone18.me, stone18.st, []);
  Adv18.resolve(stone18.S, 'do');
  settle18(stone18.S);
  ok(stone18.S.players[0].res.amber === 0 && stone18.S.script.flags.ok === 1, 'a boundary stone takes its tribute');

  const playAll18 = (index, seed) => {
    CP.reset();
    const r = CP.begin('zapoved', 'easy');
    if (index) {
      const S0 = { rs: seed >>> 0, ver: 0 }, h0 = H.Hero.init({ hid: 'vedana', cls: 'sage', faction: 'thicket', level: 1, xp: H.XP_TABLE[camp.missions[index - 1].levelCap], army: [], c: 0, r: 0, l: 0 }, {});
      H.Hero.autoUp(S0, h0);
      r.hero = CP.carryOf(h0, []);
    }
    const def = CP.setup('zapoved', index, { seed, bonus: seed % 3 }), S = Adv18.create(def.map, def.setup);
    Sc.opening(S);
    for (let g = 0; g < 400 && !S.over; g++) {
      while (S.scene) Sc.advance(S, 0);
      const T = H.AI.begin(S, S.turn);
      for (let i = 0; i < 40000 && !S.over; i++) {
        while (S.scene) Sc.advance(S, 0);
        const st = H.AI.step(S, T);
        if (st.battle) {
          const setup = st.battle === true ? Adv18.battleSetup(S) : st.battle, B = H.Battle.create(setup);
          H.BattleAI.play(B, 60);
          Adv18.battleDone(S, B);
        }
        if (st.done) break;
      }
      while (S.scene) Sc.advance(S, 0);
      if (!S.over) Adv18.endTurn(S);
    }
    return S;
  };
  for (let i = 0; i < 5; i++) {
    const S = playAll18(i, [2000, 2001, 2000, 2000, 2000][i]);
    ok(!!S.over && S.over.winner === 0, camp.missions[i].id + ': the AI in the human slot finishes the mission (' + S.day + ' days)');
    ok(S.script.goals.every(g => g.state !== 'open'), camp.missions[i].id + ': the win closes its goals (' + S.script.goals.map(g => g.id + ':' + g.state).join(' ') + ')');
  }
  CP.reset();
}

{
  const BA19 = H.Battle, Adv19 = H.Adv, TW19 = H.Town, MD19 = H.MapData, HE19 = H.Hero;
  const field = (left, right, o) => BA19.create(Object.assign({ seed: 5, obstacles: [], sides: [{ stacks: left }, { stacks: right }] }, o || {}));
  const hits = (ev, kind) => ev.filter(e => e.t === 'hit' && e.kind === kind);
  const heroBits = more => Object.assign({ perks: [], spells: [], ranks: {}, mana: 0, power: 0, level: 1 }, more || {});
  const peak = (B, s, t, kind) => BA19.forecast(B, s, t, kind).max;
  const near = (a, b, within) => Math.abs(a - b) <= within;
  const toRound = (B, n) => {
    for (let i = 0; i < 400 && B.round < n && B.winner < 0; i++) BA19.act(B, { type: 'defend' });
  };

  for (const id of H.FACTIONS.tide.units.flat()) {
    const [blow, shot, fall] = H.UNIT_SOUNDS.SOUND_OF[id] || [];
    ok(!!H.UNIT_SOUNDS.BLOWS[blow] && (!shot || !!H.UNIT_SOUNDS.SHOTS[shot]) && !!H.UNIT_SOUNDS.FALLS[fall] && !!shot === !!H.UNITS[id].shots, id + ' has its own sounds');
    ok(H.unitTraits(H.UNITS[id]).length >= 1, id + ' lists its traits');
  }
  ok(!!H.THEMES.town_tide && H.THEMES.town_tide.voices.every(v => v.notes.split(' ').every(n => n === '.' || n === 'x' || H.noteFreq(n) > 0)), 'the Tide has its town theme');
  ok(!!H.HEROES.find(x => x.id === 'merra').story && !H.HEROES.find(x => x.id === 'naera').story, 'Мерра is outside the eight, Наэра is one of them');
  ok(H.HEROES.filter(x => H.CLASSES[x.cls].faction === 'tide' && !x.story).length === 8, 'eight heroes of the Tide can be hired');

  const flow = (round, unit) => {
    const B = field([{ unit: unit || 'shellman', count: 100, c: 4, r: 4 }], [{ unit: 'plated', count: 100, c: 5, r: 4 }], { ready: [100, 0] });
    B.round = round;
    return peak(B, B.stacks[0], B.stacks[1], 'melee');
  };
  ok(near(flow(1) / flow(2), 1.25, 0.02), 'Прилив: +25 % damage on odd rounds');
  ok(flow(3) === flow(1) && flow(4) === flow(2), 'the phases keep turning');
  ok(flow(1, 'militia') === flow(2, 'militia'), 'other peoples do not feel the tide');
  const ebb = (round, def) => {
    const B = field([{ unit: 'militia', count: 100, c: 4, r: 4 }], [{ unit: def, count: 100, c: 5, r: 4 }], { ready: [100, 0] });
    B.round = round;
    return peak(B, B.stacks[0], B.stacks[1], 'melee');
  };
  ok(ebb(2, 'kraken') < ebb(1, 'kraken'), 'Отлив: +25 % defence on even rounds');
  ok(ebb(2, 'plated') === ebb(1, 'plated'), 'other peoples do not hide at ebb');
  const high = round => {
    const B = field([{ unit: 'shellman', count: 100, c: 4, r: 4 }], [{ unit: 'plated', count: 100, c: 5, r: 4 }], { ready: [100, 0], sides: [{ stacks: [{ unit: 'shellman', count: 100, c: 4, r: 4 }], hero: heroBits({ tideHigh: 0.35 }) }, { stacks: [{ unit: 'plated', count: 100, c: 5, r: 4 }] }] });
    B.round = round;
    return peak(B, B.stacks[0], B.stacks[1], 'melee');
  };
  ok(near(high(1) / high(2), 1.35, 0.02), 'Высокая вода: the tide gives +35 %');

  const salted = field([{ unit: 'shellman', count: 100, c: 4, r: 4 }], [{ unit: 'plated', count: 1000, c: 5, r: 4 }], { ready: [100, 0], sides: [{ stacks: [{ unit: 'shellman', count: 100, c: 4, r: 4 }], hero: heroBits({ saltBlood: true }) }, { stacks: [{ unit: 'plated', count: 1000, c: 5, r: 4 }] }] });
  const def0 = BA19.defOf(salted.stacks[1], 0);
  for (let i = 0; i < 6; i++) {
    salted.active = 0;
    salted.stacks[0].ready = 100;
    salted.stacks[1].retaliated = true;
    BA19.act(salted, { type: 'attack', target: 1, c: 4, r: 4 });
  }
  ok(salted.stacks[1].brine === H.HERO.tide.brineMax && BA19.defOf(salted.stacks[1], 0) === def0 - H.HERO.tide.brineMax, 'Солёная кровь: hits take a point of defence, down to −4');

  const shot = field([{ unit: 'harpooner', count: 10, c: 2, r: 4 }], [{ unit: 'plated', count: 30, c: 9, r: 4 }], { ready: [100, 0] });
  ok(BA19.act(shot, { type: 'shoot', target: 1 }).some(e => e.t === 'trait' && e.name === 'Гарпун') && shot.stacks[1].c === 8, 'Гарпунщики pull the target a cell');
  const whale = big => {
    const B = field([{ unit: 'whaler', count: 10, c: 2, r: 4 }], [{ unit: big, count: 30, c: 9, r: 4 }], { ready: [100, 0] });
    return peak(B, B.stacks[0], B.stacks[1], 'shot');
  };
  const vsBig = H.UNITS.whaler.vsBig, bigHit = whale('leshy');
  delete H.UNITS.whaler.vsBig;
  const plainHit = whale('leshy');
  H.UNITS.whaler.vsBig = vsBig;
  ok(near(bigHit / plainHit, 1.5, 0.02), 'Китобои: +50 % to big creatures');
  const net = field([{ unit: 'netter', count: 10, c: 2, r: 4 }], [{ unit: 'plated', count: 30, c: 9, r: 4 }], { ready: [100, 0] });
  ok(BA19.act(net, { type: 'shoot', target: 1 }).some(e => e.t === 'trait' && e.name === 'Сеть') && BA19.fxHas(net.stacks[1], 'noMove'), 'Сетеметатели: the target stands still');
  const claw = field([{ unit: 'claw', count: 20, c: 4, r: 4 }], [{ unit: 'plated', count: 30, c: 5, r: 4 }], { ready: [100, 0] });
  ok(BA19.act(claw, { type: 'attack', target: 1, c: 4, r: 4 }).some(e => e.t === 'trait' && e.name === 'Хватка'), 'Клешненосцы hold the target');
  const coat = () => {
    const B = field([{ unit: 'crossbow', count: 10, c: 2, r: 4 }], [{ unit: 'shellback', count: 30, c: 4, r: 4 }], { ready: [100, 0] });
    return peak(B, B.stacks[0], B.stacks[1], 'shot');
  };
  const shell = H.UNITS.shellback.shield, coated = coat();
  delete H.UNITS.shellback.shield;
  const bare = coat();
  H.UNITS.shellback.shield = shell;
  ok(near(coated / bare, 0.5, 0.05), 'Ракушечники take half from shots');
  const jelly = field([{ unit: 'jelly', count: 10, c: 4, r: 4 }], [{ unit: 'plated', count: 30, c: 5, r: 4 }], { ready: [100, 50] });
  BA19.act(jelly, { type: 'attack', target: 1, c: 4, r: 4 });
  ok(jelly.stacks[1].ready <= 40, 'Медузы take readiness');
  const dim = () => {
    const B = field([{ unit: 'militia', count: 100, c: 4, r: 4 }], [{ unit: 'deeplight', count: 10, c: 5, r: 4 }], { ready: [100, 0] });
    return peak(B, B.stacks[0], B.stacks[1], 'melee');
  };
  const dimmer = H.UNITS.deeplight.dimNear, dimmed = dim();
  delete H.UNITS.deeplight.dimNear;
  const clear = dim();
  H.UNITS.deeplight.dimNear = dimmer;
  ok(near(dimmed / clear, 0.8, 0.03), 'Огни глубин: −20 % damage from those beside them');
  const sting = field([{ unit: 'militia', count: 300, c: 4, r: 4 }], [{ unit: 'stinger', count: 30, c: 5, r: 4 }], { ready: [100, 0] });
  BA19.act(sting, { type: 'attack', target: 1, c: 4, r: 4 });
  ok(BA19.fxs(sting.stacks[0], 'poison') > 0, 'Жгучие медузы poison in answer');
  const spiritHit = field([{ unit: 'shade', count: 300, c: 4, r: 4 }], [{ unit: 'stinger', count: 30, c: 5, r: 4 }], { ready: [100, 0] });
  BA19.act(spiritHit, { type: 'attack', target: 1, c: 4, r: 4 });
  ok(!!H.UNITS.shade.spirit && BA19.fxs(spiritHit.stacks[0], 'poison') === 0, 'spirits take no venom');

  const fog = field([{ unit: 'seawitch', count: 10, c: 2, r: 4 }, { unit: 'shellman', count: 10, c: 3, r: 4 }, { unit: 'shellman', count: 10, c: 9, r: 0 }], [{ unit: 'crossbow', count: 30, c: 13, r: 4 }], { ready: [100, 0, 0, 0] });
  ok(BA19.canFog(fog.stacks[0]), 'Морские ведьмы can raise fog');
  BA19.act(fog, { type: 'fog' });
  ok(BA19.fxs(fog.stacks[1], 'shotIn') === 0.4 && BA19.fxs(fog.stacks[0], 'shotIn') === 0.4 && BA19.fxs(fog.stacks[2], 'shotIn') === 0, 'Туман: −40 % from shots within 2 cells');
  ok(!BA19.canFog(fog.stacks[0]), 'fog is raised once');
  const song = field([{ unit: 'abyssinger', count: 10, c: 2, r: 4 }], [{ unit: 'militia', count: 30, c: 4, r: 4 }, { unit: 'militia', count: 30, c: 12, r: 4 }], { ready: [100, 0, 0] });
  ok(BA19.moraleOf(song, song.stacks[1]) === BA19.moraleOf(song, song.stacks[2]) - 1, 'Певуньи бездны: −1 morale within 2 cells');
  const brine = field([{ unit: 'saltwitch', count: 10, c: 2, r: 4 }], [{ unit: 'plated', count: 90, c: 9, r: 4 }], { ready: [100, 0] });
  for (let i = 0; i < 4; i++) {
    brine.active = 0;
    brine.stacks[0].ready = 100;
    BA19.act(brine, { type: 'shoot', target: 1 });
  }
  ok(brine.stacks[1].brine === H.UNITS.saltwitch.brineShot.max, 'Солёные ведьмы take 2 defence a shot, down to −6');
  const ray = field([{ unit: 'rayrider', count: 3, c: 4, r: 4 }], [{ unit: 'plated', count: 30, c: 5, r: 4 }, { unit: 'plated', count: 30, c: 5, r: 3 }, { unit: 'plated', count: 30, c: 13, r: 9 }], { ready: [100, 0, 0, 0] });
  ok(hits(BA19.act(ray, { type: 'attack', target: 1, c: 4, r: 4 }), 'arc').length === 1, 'Наездники на скатах also hit a stack beside the target');
  const storm = field([{ unit: 'stormray', count: 3, c: 5, r: 4 }], [{ unit: 'plated', count: 30, c: 6, r: 4 }, { unit: 'plated', count: 30, c: 6, r: 3 }, { unit: 'plated', count: 30, c: 6, r: 5 }, { unit: 'plated', count: 30, c: 13, r: 9 }], { ready: [100, 0, 0, 0, 0] });
  ok(hits(BA19.act(storm, { type: 'attack', target: 1, c: 5, r: 4 }), 'arc').length === 2, 'Грозовые скаты hit two stacks beside the target');
  const night = field([{ unit: 'crossbow', count: 30, c: 2, r: 4 }], [{ unit: 'nightray', count: 3, c: 9, r: 4 }], { ready: [100, 0] });
  ok(BA19.veiled(night, night.stacks[1]), 'Ночные скаты cannot be shot while no enemy stands beside them');
  ok(H.BattleAI.choose(night).type !== 'shoot', 'the AI does not try');
  night.stacks[0].c = 8;
  ok(!BA19.veiled(night, night.stacks[1]), 'beside an enemy the veil falls');

  const tower = field([{ unit: 'turtlefort', count: 3, c: 4, r: 4 }], [{ unit: 'plated', count: 30, c: 5, r: 4 }], { ready: [100, 0] });
  ok(!BA19.canShoot(tower, tower.stacks[0]), 'Черепахи-крепости do not shoot point-blank');
  const crew = () => {
    const B = field([{ unit: 'turtlefort', count: 3, c: 4, r: 4 }], [{ unit: 'plated', count: 30, c: 5, r: 4 }], { ready: [100, 0] });
    return peak(B, B.stacks[0], B.stacks[1], 'melee');
  };
  const crewHit = crew();
  delete H.UNITS.turtlefort.fullHand;
  const plainCrew = crew();
  H.UNITS.turtlefort.fullHand = true;
  ok(near(plainCrew / crewHit, H.BATTLE.meleeShooter, 0.03), 'Команда на башне: no shooter penalty in melee');
  const stand0 = BA19.defOf(tower.stacks[0], 0);
  tower.stacks[0].defending = true;
  ok(BA19.defOf(tower.stacks[0], 0) === stand0 * (1 + H.UNITS.turtlefort.guardStand), 'and double defence when they stand');
  const ram = field([{ unit: 'turtleram', count: 3, c: 4, r: 4 }], [{ unit: 'militia', count: 200, c: 5, r: 4 }], { ready: [100, 0] });
  ok(BA19.act(ram, { type: 'attack', target: 1, c: 4, r: 4 }).some(e => e.t === 'trait') && ram.stacks[1].c === 7, 'Черепахи-тараны push the target two cells');
  const light = field([{ unit: 'turtlebeacon', count: 2, c: 2, r: 4 }, { unit: 'plated', count: 10, c: 3, r: 4 }, { unit: 'plated', count: 10, c: 12, r: 9 }], [{ unit: 'militia', count: 50, c: 13, r: 0 }], { ready: [100, 10, 0, 0] });
  ok(BA19.luckOf(light, light.stacks[1]) === BA19.luckOf(light, light.stacks[2]) + 1, 'Черепахи-маяки: +1 luck within 2 cells');
  BA19.hurt(light.stacks[1], 200);
  BA19.hurt(light.stacks[2], 200);
  const light1 = BA19.total(light.stacks[1]), light2 = BA19.total(light.stacks[2]);
  toRound(light, 3);
  ok(BA19.total(light.stacks[1]) > light1 && BA19.total(light.stacks[2]) === light2, 'and they heal the weakest stack beside them');

  const sweep = field([{ unit: 'kraken', count: 1, c: 5, r: 4 }], [{ unit: 'plated', count: 30, c: 6, r: 4 }, { unit: 'plated', count: 30, c: 5, r: 3 }, { unit: 'plated', count: 30, c: 4, r: 5 }], { ready: [100, 0, 0, 0] });
  ok(hits(BA19.act(sweep, { type: 'attack', target: 1, c: 5, r: 4 }), 'sweep').length === 2, 'Щупальца: the Kraken hits all stacks beside it');
  const dive = field([{ unit: 'kraken', count: 1, c: 1, r: 4 }], [{ unit: 'crossbow', count: 30, c: 12, r: 4 }], { ready: [100, 0] });
  ok(BA19.canDeep(dive.stacks[0]) && BA19.deepOkay(dive, dive.stacks[0], 11, 4) && !BA19.deepOkay(dive, dive.stacks[0], 12, 4), 'Уйти в глубь needs a free cell');
  BA19.act(dive, { type: 'deep', c: 11, r: 4 });
  ok(dive.stacks[0].c === 11 && BA19.fxHas(dive.stacks[0], 'hidden') && !BA19.canDeep(dive.stacks[0]), 'the Kraken surfaces anywhere, once, and cannot be shot this round');
  const hook = field([{ unit: 'ancientkraken', count: 1, c: 5, r: 4 }], [{ unit: 'plated', count: 30, c: 6, r: 4 }, { unit: 'plated', count: 30, c: 5, r: 2 }], { ready: [100, 0, 0] });
  const hookGap = BA19.gap(hook.stacks[0], hook.stacks[0].c, hook.stacks[0].r, hook.stacks[2]);
  const hookEv = BA19.act(hook, { type: 'attack', target: 1, c: 5, r: 4 });
  ok(hookEv.some(e => e.t === 'trait' && e.name === 'Притянуть') && BA19.gap(hook.stacks[0], hook.stacks[0].c, hook.stacks[0].r, hook.stacks[2]) < hookGap, 'Древний кракен pulls those two cells away closer');
  const eat = tier => {
    const B = field([{ unit: 'devourer', count: 1, c: 4, r: 4 }], [{ unit: tier === 1 ? 'militia' : 'plated', count: 30, c: 6, r: 4 }], { ready: [100, 0] });
    return peak(B, B.stacks[0], B.stacks[1], 'melee');
  };
  const low = H.UNITS.devourer.vsLow, ate = eat(1);
  delete H.UNITS.devourer.vsLow;
  const plainAte = eat(1);
  H.UNITS.devourer.vsLow = low;
  ok(near(ate / plainAte, 1.5, 0.02), 'Кракен-пожиратель: +50 % to creatures of tiers 1–3');

  const flood = BA19.create({ seed: 5, obstacles: [], ready: [100, 0, 0], sides: [{ stacks: [{ unit: 'shellman', count: 10, c: 1, r: 4 }], hero: heroBits({ flood: true }) }, { stacks: [{ unit: 'militia', count: 10, c: 12, r: 4 }, { unit: 'militia', count: 10, c: 12, r: 9 }] }] });
  ok(BA19.canOrder(flood, 'flood'), 'Затопить is ready');
  const init0 = BA19.initOf(flood.stacks[1]);
  BA19.act(flood, { type: 'order', order: 'flood', c: 12, r: 4 });
  ok(flood.shallow.cells.length === H.HERO.tide.floodCells, 'five cells turn shallow');
  ok(BA19.initOf(flood.stacks[1]) === Math.round(init0 * 0.7) && BA19.initOf(flood.stacks[2]) === init0, 'Мелководье: −30 % initiative on those cells only');
  ok(!BA19.canOrder(flood, 'flood'), 'once a battle');
  flood.stacks[1].c = 5;
  flood.stacks[1].r = 0;
  flood.active = 1;
  flood.stacks[1].ready = 100;
  BA19.act(flood, { type: 'move', c: 6, r: 0 });
  ok(BA19.initOf(flood.stacks[1]) === init0, 'leaving the cells lifts it');
  ok(JSON.parse(JSON.stringify(flood)).shallow.cells.length === 5, 'the shallows survive a save');
  const nine = BA19.create({ seed: 5, obstacles: [], ready: [100, 60, 60], sides: [{ stacks: [{ unit: 'shellman', count: 10, c: 1, r: 4 }], hero: heroBits({ high: 'wave' }) }, { stacks: [{ unit: 'militia', count: 10, c: 9, r: 4 }, { unit: 'militia', count: 10, c: 13, r: 2 }] }] });
  ok(BA19.canOrder(nine, 'high'), 'Девятый вал is ready');
  BA19.act(nine, { type: 'order', order: 'high' });
  ok(nine.stacks[1].c === 11 && nine.stacks[2].c === 13, 'Девятый вал pushes enemies two cells to their edge, the edge stops them');
  ok(nine.stacks[1].ready === 30 && nine.stacks[2].ready === 30, 'and takes 30 readiness');
  const calm = BA19.create({ seed: 5, obstacles: [], sides: [{ stacks: [{ unit: 'shellman', count: 10, c: 1, r: 4 }], hero: heroBits({ tideHeal: 0.1 }) }, { stacks: [{ unit: 'militia', count: 1, c: 13, r: 9 }] }] });
  BA19.hurt(calm.stacks[0], 30);
  const calm0 = BA19.total(calm.stacks[0]);
  toRound(calm, 2);
  ok(BA19.total(calm.stacks[0]) > calm0, 'Тихая вода: own stacks heal at ebb');
  const song9 = BA19.create({ seed: 5, obstacles: [], ready: [100, 0], sides: [{ stacks: [{ unit: 'shellman', count: 10, c: 1, r: 4 }], hero: heroBits({ spells: ['sleep'], ranks: { glub: 2 }, mana: 99, power: 5, level: 8, lullaby: 0.4 }) }, { stacks: [{ unit: 'plated', count: 10, c: 12, r: 4 }] }] });
  const sleepLimit = BA19.spellAmount(song9, song9.sides[0].hero, H.SPELLS.sleep, H.SPELLS.sleep.limit);
  song9.stacks[1].count = Math.ceil(sleepLimit * 1.2 / H.UNITS.plated.hp);
  song9.stacks[1].hp = H.UNITS.plated.hp;
  ok(BA19.stackTargets(song9, H.SPELLS.sleep, 0).includes(song9.stacks[1]), 'Колыбельная: Сон holds a target over its limit');
  song9.sides[0].hero.lullaby = 0;
  ok(!BA19.stackTargets(song9, H.SPELLS.sleep, 0).includes(song9.stacks[1]), 'without the skill that target stays awake');
  const dry = BA19.create({ seed: 5, obstacles: [], sides: [{ stacks: [{ unit: 'shellman', count: 10, c: 1, r: 4 }] }, { stacks: [{ unit: 'militia', count: 10, c: 12, r: 4 }] }] });
  const shore = BA19.create({ seed: 5, obstacles: [], shore: true, sides: [{ stacks: [{ unit: 'shellman', count: 10, c: 1, r: 4 }] }, { stacks: [{ unit: 'militia', count: 10, c: 12, r: 4 }] }] });
  ok(BA19.moraleOf(shore, shore.stacks[0]) === BA19.moraleOf(dry, dry.stacks[0]) + 1, 'Мелководье: +1 morale on a shore for the Tide');
  ok(BA19.moraleOf(shore, shore.stacks[1]) === BA19.moraleOf(dry, dry.stacks[1]), 'others do not get it');

  const wetMap = (cls, more, objs) => {
    const M = MD19.create(30, 20, ['meadow']);
    MD19.paint(M, 0, 'water', (c, r) => c >= 8 && c < 12);
    for (const o of objs || []) MD19.add(M, Object.assign({ l: 0 }, o));
    const faction = H.CLASSES[cls].faction;
    const S = Adv19.create(M, { seed: 21, moons: null, players: [{ name: 'Игрок', color: 0, faction, human: true }, { name: 'Чужой', color: 1, faction: 'league', human: false }], heroes: [Object.assign({ owner: 0, name: 'Проба', cls, faction, c: 7, r: 5, army: [{ unit: H.FACTIONS[faction].units[0][0], count: 30 }] }, more || {}), { owner: 1, name: 'Чужой', cls: 'captain', faction: 'league', c: 29, r: 0, army: [{ unit: 'militia', count: 5 }] }] });
    return { S, M, h: S.heroes[0] };
  };
  const costAt = (W, c, r) => Adv19.stepCost(W.S, W.h, Adv19.grid(W.S, 0, 0), 0, c, r);
  const tideWalk = wetMap('chief');
  ok(costAt(tideWalk, 8, 5) === HE19.ground(tideWalk.h, H.HERO.tide.water), 'Мелководье: a water cell costs a Tide hero 1,5 steps');
  ok(!!Adv19.path(tideWalk.S, tideWalk.h, 14, 5), 'a Tide hero walks across the water without a boat');
  const landWalk = wetMap('captain');
  ok(!costAt(landWalk, 8, 5) && !Adv19.path(landWalk.S, landWalk.h, 14, 5), 'other heroes need a boat');
  const current = wetMap('chief');
  current.h.talents.push('tide-1');
  ok(costAt(current, 8, 5) === HE19.ground(current.h, H.ROADS[1].cost), 'Течение: water costs as a road');
  const moonlit = wetMap('chief');
  const moonIs = H.Moons.is;
  H.Moons.is = (S, id) => id === 'azure';
  ok(costAt(moonlit, 8, 5) === HE19.ground(moonlit.h, H.ROADS[1].cost), 'Лазурная луна: water costs as a road for the Tide');
  H.Moons.is = moonIs;
  const cradled = wetMap('chief', null, [{ t: 'town', c: 2, r: 5, owner: 0, faction: 'tide', name: 'Колыбель', built: ['hall1', 'altar'] }]);
  ok(TW19.cradle(cradled.S, 0) && costAt(cradled, 8, 5) === HE19.ground(cradled.h, H.ROADS[1].cost), 'Колыбель: water costs as a road for the owner');
  const stay = wetMap('chief', { c: 9 });
  Adv19.endDay(stay.S);
  ok(stay.h.c === 9, 'a Tide hero stays on the water overnight');

  const boarded = wetMap('chief', null, [{ t: 'boat', c: 8, r: 5 }]);
  boarded.h.steps = 12;
  Adv19.step(boarded.S, boarded.h, 8, 5);
  ok(boarded.h.boat != null && boarded.h.steps > 0, 'a Tide hero keeps the steps when boarding');
  const landed = wetMap('chief', { c: 8, r: 5 }, [{ t: 'boat', c: 8, r: 5 }]);
  landed.h.boat = landed.M.objs.find(o => o.t === 'boat').id;
  landed.M.objs.find(o => o.t === 'boat').gone = true;
  landed.h.steps = 12;
  Adv19.step(landed.S, landed.h, 7, 5);
  ok(landed.h.boat == null && landed.h.steps > 0, 'and when landing');
  const landOther = wetMap('captain', { c: 8, r: 5 }, [{ t: 'boat', c: 8, r: 5 }]);
  landOther.h.boat = landOther.M.objs.find(o => o.t === 'boat').id;
  landOther.M.objs.find(o => o.t === 'boat').gone = true;
  landOther.h.steps = 12;
  Adv19.step(landOther.S, landOther.h, 7, 5);
  ok(landOther.h.steps === 0, 'others lose the day at the shore');

  const dock = wetMap('chief', null, [{ t: 'town', c: 2, r: 5, owner: 0, faction: 'tide', name: 'Гавань', built: ['hall1', 'special1'] }]);
  ok(TW19.harbor(dock.S, 0) && !TW19.harbor(dock.S, 1), 'Гавань belongs to its owner');
  const free19 = Adv19.daySteps(dock.S, dock.h);
  dock.h.boat = 99;
  ok(Adv19.daySteps(dock.S, dock.h) === free19 + H.HERO.tide.harbor, 'Гавань: +4 steps a day for boats');
  const noHarbor = wetMap('chief', { boat: 99 });
  noHarbor.h.boat = 99;
  ok(Adv19.daySteps(noHarbor.S, noHarbor.h) === free19, 'no harbour, no steps');

  const lamp = wetMap('chief', { c: 28, r: 18 }, [{ t: 'town', c: 2, r: 5, owner: 0, faction: 'tide', name: 'Маяк', built: ['hall1', 'fort1', 'special3'] }, { t: 'boat', c: 11, r: 19 }]);
  ok(TW19.beaconOf(lamp.M.objs.find(o => o.t === 'town')) === 12, 'Маяк gives 12 cells of sight');
  const lit = Adv19.visible(lamp.S, 0, 0);
  ok(!!lit[MD19.idx(lamp.M, 13, 5)], 'it sees 12 cells around the town');
  ok(!!lit[MD19.idx(lamp.M, 11, 19)] && !!lamp.S.players[0].seen[0][MD19.idx(lamp.M, 11, 19)], 'and every boat on the map');
  const dark = wetMap('chief', { c: 28, r: 18 }, [{ t: 'town', c: 2, r: 5, owner: 0, faction: 'tide', name: 'Темно', built: ['hall1'] }, { t: 'boat', c: 11, r: 19 }]);
  ok(!Adv19.visible(dark.S, 0, 0)[MD19.idx(dark.M, 11, 19)], 'without it boats hide in the fog');

  const ports = [{ t: 'town', c: 2, r: 5, owner: 0, faction: 'tide', name: 'Порт', water: true, built: ['hall1'] }, { t: 'town', c: 2, r: 12, owner: 0, faction: 'tide', name: 'Суша', built: ['hall1'] }];
  const weekGain = talent => {
    const W = wetMap('chief', null, ports.map(o => Object.assign({}, o, { built: o.built.slice() })));
    if (talent) W.h.talents.push('tide-6');
    W.S.day = 7;
    const r = W.S.players[0].res, a = r.amber, b = r.salt;
    Adv19.endDay(W.S);
    return [W.S.players[0].res.amber - a, W.S.players[0].res.salt - b];
  };
  const withTrade = weekGain(true), noTrade = weekGain(false);
  ok(withTrade[0] === noTrade[0] + 1 && withTrade[1] === noTrade[1] + 1, 'Морская торговля: +1 Соль и +1 Янтарь a week for each sea town');

  const onShore = wetMap('chief', { c: 7, r: 5 }, [{ t: 'monster', unit: 'militia', count: 2, c: 6, r: 5 }]);
  onShore.S.pending = { kind: 'encounter', hero: 0, obj: onShore.M.objs.find(o => o.t === 'monster').id, from: [7, 5] };
  ok(Adv19.battleSetup(onShore.S).shore === true, 'a fight beside the water is a fight on the shore');
  const inland = wetMap('chief', { c: 2, r: 5 }, [{ t: 'monster', unit: 'militia', count: 2, c: 1, r: 5 }]);
  inland.S.pending = { kind: 'encounter', hero: 0, obj: inland.M.objs.find(o => o.t === 'monster').id, from: [2, 5] };
  ok(Adv19.battleSetup(inland.S).shore === false, 'inland it is not');

  const isle = wetMap('chief', null, [{ t: 'chest', c: 12, r: 5 }]);
  isle.S.players[0].human = false;
  isle.h.steps = 40;
  H.AI.turn(isle.S);
  ok(isle.h.c > 8, 'the AI of the Tide crosses the water without a boat');
  const noBoat = wetMap('chief', null, [{ t: 'boat', c: 8, r: 3 }, { t: 'chest', c: 3, r: 5 }]);
  noBoat.S.players[0].human = false;
  noBoat.h.steps = 40;
  H.AI.turn(noBoat.S);
  ok(noBoat.h.boat == null, 'and does not bother with boats');

  const fogAI = field([{ unit: 'seawitch', count: 20, c: 1, r: 4 }, { unit: 'shellman', count: 40, c: 2, r: 4 }], [{ unit: 'crossbow', count: 60, c: 13, r: 2 }, { unit: 'crossbow', count: 60, c: 13, r: 6 }], { ready: [100, 0, 0, 0] });
  ok(H.BattleAI.choose(fogAI).type === 'fog', 'the AI raises fog against shooters');
  const floodAI = BA19.create({ seed: 5, obstacles: [], ready: [100, 0], sides: [{ stacks: [{ unit: 'shellman', count: 10, c: 1, r: 4 }], hero: heroBits({ flood: true }) }, { stacks: [{ unit: 'militia', count: 10, c: 12, r: 4 }] }] });
  ok(H.BattleAI.choose(floodAI).order === 'flood', 'the AI floods the enemy');
  const deepAI = field([{ unit: 'kraken', count: 1, c: 1, r: 4 }], [{ unit: 'crossbow', count: 300, c: 13, r: 4 }], { ready: [100, 0] });
  ok(H.BattleAI.choose(deepAI).type === 'deep', 'the AI dives at a shooter out of reach');
  for (let seed = 1; seed < 12; seed++) {
    const a = H.FACTIONS.tide.units.map(row => ({ unit: row[seed % 3], count: 6 + seed })), b = H.FACTIONS.league.units.map(row => ({ unit: row[seed % 3], count: 6 + seed }));
    const place = (list, c) => list.map((x, i) => Object.assign(x, { c, r: i + 1 }));
    const B = BA19.create({ seed, sides: [{ stacks: place(a, 1), hero: heroBits({ flood: true, high: 'wave', saltBlood: true, tideHeal: 0.1, tideHigh: 0.35 }) }, { stacks: place(b, 13) }] });
    H.BattleAI.play(B, 100);
    ok(B.winner >= 0 || B.round > 100, 'a Tide battle with every order ends (seed ' + seed + ')');
    JSON.parse(JSON.stringify(B));
  }
}

{
  const CP = H.Campaign, Sc = H.Script, MF = H.MapFile, Adv20 = H.Adv, MD20 = H.MapData;
  const camp = CP.get('chasha'), makers = require(path.join(ROOT, 'tools/heroes98-camp4-maps.cjs'))(H), mapText = m => fs.readFileSync(path.join(ROOT, 'content/heroes98/maps', m.id + '.h98m'), 'utf8');
  ok(!!camp && camp.missions.length === 5 && camp.hero === 'naera' && camp.faction === 'tide' && camp.number === 4, 'the Tide campaign has five missions, its hero and its people');
  camp.missions.forEach((m, i) => {
    const text = mapText(m), file = MF.read(text);
    ok(file.scenes === m.scenes, m.id + ': the file carries the scenes of the campaign module');
    ok(MF.write(Object.assign(makers[m.id](), { scenes: m.scenes })) === text, m.id + ': the file is what its maker builds');
    CP.attach(m, text);
    ok(!MF.blocking(MF.check(m.doc)).length, m.id + ': no blocking problems (' + MF.blocking(MF.check(m.doc)).map(x => x.text).join('; ') + ')');
    ok(!Sc.parse(m.scenes).errors.length, m.id + ': scenes parse');
    ok(m.brief.length > 150 && m.goals.length >= 1 && m.lose && m.name && m.about, m.id + ': has a briefing, goals and a way to lose');
    ok(m.levelCap > (i ? camp.missions[i - 1].levelCap : 1), m.id + ': the level cap grows');
    ok(m.bonuses.map(b => b.kind).sort().join() === 'art,res,unit', m.id + ': three bonuses, an artifact, creatures and resources');
    ok(m.bonuses.every(b => (b.kind === 'art' ? !!H.ARTIFACTS[b.id] : b.kind === 'unit' ? !!H.UNITS[b.unit] : Object.keys(b.res).every(k => H.RESOURCES.some(r => r[0] === k)))) && m.bonuses.every(b => CP.bonusText(b)), m.id + ': bonuses point at real things');
    const P = Sc.parse(m.scenes);
    for (const who of Sc.speakers(m.scenes)) ok(!!H.HEROES.find(x => x.id === who) || !!H.PEOPLE[who], m.id + ': the speaker ' + who + ' has a name');
    for (const who of Sc.speakers(m.scenes)) ok(H.Art.PORTRAITS.some(x => x.id === 'portrait/' + who), m.id + ': the speaker ' + who + ' has a portrait entry');
    for (const op of P.ops.filter(x => x.k === 'line')) ok(H.Font.wrap('text', op.text, 464).length <= 5, m.id + ': the line fits the text box: ' + op.text.slice(0, 30));
    for (const op of P.ops.filter(x => x.k === 'cmd' && x.cmd === 'spawn')) {
      const at = op.a[0] === 'hero' ? 3 : 2, col = +op.a[at], row = +op.a[at + 1], cells = m.doc.map;
      ok(MD20.inside(cells, col, row) && MD20.groundCost(cells, 0, col, row) > 0 && !cells.objs.some(o => o.l === 0 && MD20.cells(o).some(([x, y]) => x === col && y === row)), m.id + ': spawn cell ' + col + ',' + row + ' is free ground');
    }
    for (const op of P.ops.filter(x => x.k === 'cmd' && x.cmd === 'terrain')) {
      const [c0, r0, w, h] = op.a.slice(1, 5).map(Number), cells = [];
      for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) cells.push([c, r]);
      ok(cells.every(([c, r]) => MD20.isWater(m.doc.map, 0, c, r) && !m.doc.map.objs.some(o => o.l === 0 && MD20.cells(o).some(([x, y]) => x === c && y === r))), m.id + ': the tide changes only open water at ' + op.a.join(' '));
    }
    ok(!/Microsoft|Windows|—/.test([m.brief, m.scenes].join(' ')), m.id + ': no real names and no long dashes');
    ok(m.doc.heroes.some(h => h.hid === 'naera' && h.owner === 0), m.id + ': Наэра starts it');
    ok(!Sc.check(m.scenes, [], new Set([...m.doc.map.objs.map(o => o.tag), ...m.doc.heroes.map(h => h.tag)].filter(Boolean))).length, m.id + ': the scene check finds nothing');
  });
  ok([...camp.opening, ...camp.ending, camp.about].every(s => typeof s === 'string' && s.length > 20 && !/—/.test(s)), 'the campaign has an opening and an ending in plain words');
  ok(camp.opening.length >= 3 && camp.ending.length >= 3 && !!H.THEMES[camp.theme] && H.THEMES[camp.theme].voices.every(v => v.notes.split(' ').length === 32), 'an opening, an ending and a theme of its own');
  ok(!!H.HEROES.find(x => x.id === 'merra').story, 'Мерра never shows up in a tavern');

  CP.reset();
  ok(!CP.isOpen('chasha'), 'the fourth campaign waits for the third');
  for (const id of ['nabat', 'sol']) CP.begin(id, 'easy').finished = true;
  const r3 = CP.begin('zapoved', 'easy');
  r3.flags = { branch_given: 1, snake_free: 1 };
  r3.finished = true;
  ok(CP.isOpen('chasha') && CP.begin('chasha', 'easy').flags.snake_free === 1, 'a finished «Заповедь» opens «Чаша» and hands over its flags');
  const lines20 = (index, flags) => {
    CP.reset();
    const r = CP.begin('chasha', 'easy');
    r.flags = flags;
    if (index) r.hero = CP.carryOf(H.Hero.init({ hid: 'naera', cls: 'deeppriest', faction: 'tide', level: 1, xp: 0, army: [], c: 0, r: 0, l: 0 }, {}), []);
    const def = CP.setup('chasha', index, { seed: 5, bonus: 1 }), S = Adv20.create(def.map, def.setup), said = [];
    Sc.opening(S);
    for (let g = 0; g < 300 && S.scene; g++) {
      said.push(S.scene.text);
      Sc.advance(S, 0);
    }
    for (let g = 0; g < 300 && S.scene; g++) Sc.advance(S, 0);
    Adv20.conclude(S, []);
    for (let g = 0; g < 300 && S.scene; g++) Sc.advance(S, 0);
    return { S, said, hero: S.heroes.find(h => h.hid === 'naera') };
  };
  ok(lines20(0, { branch_given: 1 }).said.some(t => /ветку из Чащи/.test(t)) && !lines20(0, {}).said.some(t => /ветку из Чащи/.test(t)), 'Оола has heard of the branch taken from the Thicket');
  const refused = lines20(2, { pearl_refused: 1 }), paid = lines20(2, { pearl_paid: 1 }), plain = lines20(2, {});
  const harp = x => x.hero.army.filter(s => s && s.unit === 'harpooner').reduce((n, s) => n + s.count, 0);
  ok(harp(refused) === harp(plain) + 20 && !plain.S.map.objs.find(o => o.tag === 'dr3').gone, 'the refused tribute of mission 2 sends harpooners');
  ok(paid.S.map.objs.find(o => o.tag === 'dr3').gone && paid.S.script.goals.find(g => g.id === 'dr3').state === 'done', 'the paid tribute of mission 2 takes one dredge away');
  ok(lines20(2, { snake_free: 1 }).hero.army.some(s => s && s.unit === 'seaserpent'), 'the Serpent of «Заповедь» sends sea serpents');
  ok(lines20(4, { shell_found: 1 }).said.some(t => /раковина/.test(t)) && !lines20(4, {}).said.some(t => /раковина/.test(t)), 'the shell of mission 4 speaks in mission 5');
  CP.reset();

  const breath = (() => {
    CP.reset();
    CP.begin('chasha', 'easy');
    const def = CP.setup('chasha', 4, { seed: 7, bonus: 0 }), S = Adv20.create(def.map, def.setup);
    Sc.opening(S);
    while (S.scene) Sc.advance(S, 0);
    const at = (c, r) => MD20.terrainAt(S.map, 0, c, r).id, out = [];
    for (const day of [3, 6, 9]) {
      S.day = day;
      Adv20.conclude(S, []);
      while (S.scene) Sc.advance(S, 0);
      out.push(at(40, 56) + '/' + at(70, 35));
    }
    CP.reset();
    return out;
  })();
  ok(breath.join() === 'sand/rock,water/water,sand/rock', 'Чаша дышит: shoals and reefs rise at ebb and sink at flood (' + breath.join() + ')');

  const pool20 = (cls, boat) => {
    const M = MD20.create(48, 48, ['water']);
    MD20.paint(M, 0, 'meadow', (c, r) => c < 6);
    const a = MD20.add(M, { t: 'whirlpool', c: 20, r: 20, owner: -1, l: 0 }), b = MD20.add(M, { t: 'whirlpool', c: 30, r: 30, owner: -1, l: 0 });
    a.link = b.id;
    const S = Adv20.create(M, { seed: 3, moons: null, players: [{ name: 'Ч', color: 0, faction: H.CLASSES[cls].faction, human: true }, { name: 'Б', color: 1, faction: 'league', human: false }], heroes: [{ owner: 0, name: 'Проба', cls, faction: H.CLASSES[cls].faction, c: 21, r: 22, army: [{ unit: 'militia', count: 100 }] }, { owner: 1, name: 'Б', cls: 'captain', faction: 'league', c: 2, r: 2, army: [{ unit: 'militia', count: 5 }] }] });
    const h = S.heroes[0];
    if (boat) h.boat = 999;
    H.OBJ_VISIT.whirlpool(S, h, a, []);
    return h;
  };
  const tidePool = pool20('chief'), boatPool = pool20('captain', true), dryPool = pool20('captain');
  ok(tidePool.c === 31 && tidePool.r === 31 && tidePool.army[0].count === 100, 'a Tide hero passes a whirlpool without a boat and loses nothing');
  ok(boatPool.c === 31 && boatPool.army[0].count < 100, 'a boat still pays the whirlpool');
  ok(dryPool.c === 21, 'a hero without a boat cannot use it');

  const isle20 = factions => {
    const M = MD20.create(48, 48, ['water']);
    MD20.paint(M, 0, 'meadow', (c, r) => c < 10);
    MD20.paint(M, 0, 'meadow', (c, r) => c > 30 && r > 30);
    MD20.add(M, { t: 'chest', c: 40, r: 40, owner: -1, l: 0 });
    const d = { name: 'И', about: '', map: M, players: [{ who: 'human', factions, team: 0, town: null }], goals: { win: [], lose: [] }, heroes: [{ owner: 0, c: 4, r: 4, l: 0, army: [{ unit: 'militia', count: 5 }] }], events: [], scenes: '' };
    return MF.unreached(d).length;
  };
  ok(isle20(['tide']) === 0 && isle20(['league']) === 1, 'the map check knows that the Tide walks on water');

  const vault20 = (() => {
    const M = MD20.create(48, 48, ['meadow']), v = MD20.add(M, { t: 'sunkentemple', c: 30, r: 30, owner: -1, l: 0, tag: 'shell' });
    M.scenes = 'event defeat shell -> got\n@got\nset got\nend\n';
    M.events = [];
    const S = Adv20.create(M, { seed: 3, moons: null, goals: { win: [{ kind: 'flag', flag: 'n_never', text: 'Дальше' }], lose: [] }, players: [{ name: 'Ч', color: 0, faction: 'tide', human: true }, { name: 'Б', color: 1, faction: 'league', human: false }], heroes: [{ owner: 0, name: 'Проба', cls: 'chief', faction: 'tide', c: 2, r: 2, army: [{ unit: 'shellman', count: 5 }] }, { owner: 1, name: 'Б', cls: 'captain', faction: 'league', c: 46, r: 46, army: [{ unit: 'militia', count: 5 }] }] });
    Adv20.conclude(S, []);
    const before = !!S.script.flags.got;
    S.map.objs.find(o => o.tag === 'shell').looted = true;
    Adv20.conclude(S, []);
    while (S.scene) Sc.advance(S, 0);
    return { before, after: !!S.script.flags.got };
  })();
  ok(!vault20.before && vault20.after, 'a looted treasury counts as defeated for the scenes');

  const playAll20 = (index, seed) => {
    CP.reset();
    const r = CP.begin('chasha', 'easy');
    if (index) {
      const S0 = { rs: seed >>> 0, ver: 0 }, h0 = H.Hero.init({ hid: 'naera', cls: 'deeppriest', faction: 'tide', level: 1, xp: H.XP_TABLE[camp.missions[index - 1].levelCap], army: [], c: 0, r: 0, l: 0 }, {});
      H.Hero.autoUp(S0, h0);
      r.hero = CP.carryOf(h0, []);
    }
    const def = CP.setup('chasha', index, { seed, bonus: seed % 3 }), S = Adv20.create(def.map, def.setup);
    Sc.opening(S);
    for (let g = 0; g < 400 && !S.over; g++) {
      while (S.scene) Sc.advance(S, 0);
      const T = H.AI.begin(S, S.turn);
      for (let i = 0; i < 40000 && !S.over; i++) {
        while (S.scene) Sc.advance(S, 0);
        const st = H.AI.step(S, T);
        if (st.battle) {
          const setup = st.battle === true ? Adv20.battleSetup(S) : st.battle, B = H.Battle.create(setup);
          H.BattleAI.play(B, 60);
          Adv20.battleDone(S, B);
        }
        if (st.done) break;
      }
      while (S.scene) Sc.advance(S, 0);
      if (!S.over) Adv20.endTurn(S);
    }
    return S;
  };
  for (let i = 0; i < 5; i++) {
    const S = playAll20(i, 2000);
    ok(!!S.over && S.over.winner === 0, camp.missions[i].id + ': the AI in the human slot finishes the mission (' + S.day + ' days)');
    ok(S.script.goals.every(g => g.state !== 'open'), camp.missions[i].id + ': the win closes its goals (' + S.script.goals.map(g => g.id + ':' + g.state).join(' ') + ')');
  }
  CP.reset();
}

{
  const BA21 = H.Battle, Adv21 = H.Adv, TW21 = H.Town, MD21 = H.MapData, HE21 = H.Hero, F21 = H.HERO.forge;
  const field = (left, right, o) => BA21.create(Object.assign({ seed: 5, obstacles: [], sides: [{ stacks: left }, { stacks: right }] }, o || {}));
  const hits = (ev, kind) => ev.filter(e => e.t === 'hit' && e.kind === kind);
  const heroBits = more => Object.assign({ perks: [], spells: [], ranks: {}, mana: 0, power: 0, level: 1 }, more || {});
  const peak = (B, s, t, kind) => BA21.forecast(B, s, t, kind).max;
  const near = (a, b, within) => Math.abs(a - b) <= within;
  const again = (B, i) => {
    B.active = i;
    B.stacks[i].ready = 100;
  };

  for (const id of H.FACTIONS.forge.units.flat()) {
    const [blow, shot, fall] = H.UNIT_SOUNDS.SOUND_OF[id] || [];
    ok(!!H.UNIT_SOUNDS.BLOWS[blow] && (!shot || !!H.UNIT_SOUNDS.SHOTS[shot]) && !!H.UNIT_SOUNDS.FALLS[fall] && !!shot === !!H.UNITS[id].shots, id + ' has its own sounds');
    ok(H.unitTraits(H.UNITS[id]).length >= 1, id + ' lists its traits');
  }
  ok(!!H.THEMES.town_forge && H.THEMES.town_forge.voices.every(v => v.notes.split(' ').length === 32), 'the Forge has its town theme');
  ok(!!H.HEROES.find(x => x.id === 'garm').story && !H.HEROES.find(x => x.id === 'irga').story, 'Гарм Окалина is outside the eight, Ирга is one of them');
  ok(H.HEROES.filter(x => H.CLASSES[x.cls].faction === 'forge' && !x.story).length === 8, 'eight heroes of the Forge can be hired');

  const heat = field([{ unit: 'apprentice', count: 200, c: 4, r: 4 }], [{ unit: 'plated', count: 30, c: 5, r: 4 }], { ready: [100, 0] });
  const cold = peak(heat, heat.stacks[0], heat.stacks[1], 'melee');
  heat.stacks[0].heat = 1;
  ok(near(peak(heat, heat.stacks[0], heat.stacks[1], 'melee') / cold, 1 + F21.per, 0.03), 'a point of heat gives +10 % damage');
  heat.stacks[0].heat = 0;
  heat.stacks[1].retaliated = true;
  BA21.act(heat, { type: 'attack', target: 1, c: 4, r: 4 });
  ok(heat.stacks[0].heat === 1, 'Жар: an attack gives a point of heat');
  for (let i = 0; i < 4; i++) {
    again(heat, 0);
    heat.stacks[1].retaliated = true;
    BA21.act(heat, { type: 'attack', target: 1, c: 4, r: 4 });
  }
  ok(heat.stacks[0].heat === F21.cap, 'heat stops at 3');
  const tick = BA21.create({ seed: 5, obstacles: [], ready: [0, 100], sides: [{ stacks: [{ unit: 'apprentice', count: 50, c: 1, r: 4 }] }, { stacks: [{ unit: 'plated', count: 10, c: 13, r: 9 }] }] });
  tick.stacks[0].heat = 3;
  const t0 = BA21.total(tick.stacks[0]);
  for (let i = 0; i < 40 && tick.active !== 0; i++) BA21.act(tick, { type: 'defend' });
  ok(BA21.total(tick.stacks[0]) === t0 - Math.max(1, Math.floor(t0 * F21.burn)), 'overheated: −5 % health at the start of its turn');
  const cool = tick.stacks[0], c0 = BA21.total(cool);
  BA21.hurt(cool, 60);
  const c1 = BA21.total(cool);
  BA21.act(tick, { type: 'defend' });
  ok(cool.heat === 0 && BA21.total(cool) > c1, 'Оборона cools the stack and heals it');
  ok(c0 > 0, 'the cooled stack lives');
  const hold = BA21.create({ seed: 5, obstacles: [], ready: [100, 0], sides: [{ stacks: [{ unit: 'apprentice', count: 50, c: 4, r: 4 }], hero: heroBits({ heatHold: true, heatPer: F21.hot }) }, { stacks: [{ unit: 'plated', count: 100, c: 5, r: 4 }] }] });
  ok(BA21.heatCap(hold, hold.stacks[0]) === F21.hold, 'Выдержка: heat goes to 4');
  const hc = peak(hold, hold.stacks[0], hold.stacks[1], 'melee');
  hold.stacks[0].heat = 2;
  ok(near(peak(hold, hold.stacks[0], hold.stacks[1], 'melee') / hc, 1 + 2 * F21.hot, 0.04), 'Раскалённые клинки: +15 % a point');

  const spellOn = (unit, hero) => {
    const B = BA21.create({ seed: 5, obstacles: [], ready: [100, 0], sides: [{ stacks: [{ unit: 'militia', count: 10, c: 1, r: 4 }], hero: heroBits({ spells: ['fireball'], ranks: { zhar: 2 }, mana: 99, power: 5 }) }, { stacks: [{ unit, count: 50, c: 12, r: 4 }], hero }] });
    return BA21.spellDamage(B, B.sides[0].hero, H.SPELLS.fireball, B.stacks[1], 500);
  };
  ok(spellOn('salamander') === 0 && spellOn('apprentice') > 0, 'Саламандры: fire spells do nothing to them');
  ok(near(spellOn('apprentice', heroBits({ fireCut: F21.fireCut })) / spellOn('apprentice'), 1 - F21.fireCut, 0.02), 'Огнеупорность: 30 % less from fire');

  const ember = field([{ unit: 'apprentice', count: 60, c: 4, r: 4 }], [{ unit: 'militia', count: 100, c: 5, r: 4 }], { ready: [100, 0] });
  BA21.act(ember, { type: 'attack', target: 1, c: 4, r: 4 });
  ok(BA21.fxs(ember.stacks[1], 'ember') > 0, 'Искры: the target burns');
  const fireproof = field([{ unit: 'apprentice', count: 60, c: 4, r: 4 }], [{ unit: 'salamander', count: 30, c: 5, r: 4 }], { ready: [100, 0] });
  BA21.act(fireproof, { type: 'attack', target: 1, c: 4, r: 4 });
  ok(!BA21.fxs(fireproof.stacks[1], 'ember'), 'salamanders do not burn');
  const web = field([{ unit: 'obsidianspider', count: 20, c: 4, r: 4 }], [{ unit: 'plated', count: 30, c: 5, r: 4 }], { ready: [100, 0] });
  const init0 = BA21.initOf(web.stacks[1]);
  BA21.act(web, { type: 'attack', target: 1, c: 4, r: 4 });
  ok(BA21.initOf(web.stacks[1]) === Math.round(init0 * 0.7), 'Стеклянная паутина: −30 % initiative');
  const blades = field([{ unit: 'bladelizard', count: 20, c: 4, r: 4 }], [{ unit: 'plated', count: 10, c: 5, r: 4 }], { ready: [100, 0] });
  ok(hits(BA21.act(blades, { type: 'attack', target: 1, c: 4, r: 4 }), 'melee').length === 2, 'Ящеры-клинки strike twice');
  const skin = field([{ unit: 'militia', count: 100, c: 4, r: 4 }], [{ unit: 'firelizard', count: 30, c: 5, r: 4 }], { ready: [100, 0] });
  ok(hits(BA21.act(skin, { type: 'attack', target: 1, c: 4, r: 4 }), 'thorn').length === 1, 'Огненная кожа burns the attacker');
  const skin2 = field([{ unit: 'salamander', count: 30, c: 4, r: 4 }], [{ unit: 'firelizard', count: 30, c: 5, r: 4 }], { ready: [100, 0] });
  ok(!hits(BA21.act(skin2, { type: 'attack', target: 1, c: 4, r: 4 }), 'thorn').length, 'but not a salamander');
  const glass = field([{ unit: 'salamander', count: 30, c: 5, r: 4 }], [{ unit: 'obsidiangiant', count: 3, c: 6, r: 4 }], { ready: [100, 0] });
  ok(hits(BA21.act(glass, { type: 'attack', target: 1, c: 5, r: 4 }), 'thorn').length === 1, 'Обсидиан reflects even on a salamander');

  const temper = field([{ unit: 'temperer', count: 10, c: 1, r: 4 }, { unit: 'apprentice', count: 30, c: 2, r: 6 }], [{ unit: 'militia', count: 30, c: 13, r: 4 }], { ready: [100, 0, 0] });
  const def0 = BA21.defOf(temper.stacks[1], 0), shots0 = temper.stacks[0].shots;
  BA21.act(temper, { type: 'temper', target: 1 });
  ok(BA21.defOf(temper.stacks[1], 0) === def0 + 3 && temper.stacks[0].shots === shots0 - 1, 'Закалить: +3 Стойкости for a shot');
  ok(!BA21.temperList(temper, temper.stacks[0]).includes(temper.stacks[1]), 'a stack is tempered once');
  const burst = field([{ unit: 'overheated', count: 6, c: 5, r: 4 }, { unit: 'apprentice', count: 20, c: 1, r: 1 }], [{ unit: 'militia', count: 100, c: 6, r: 4 }, { unit: 'militia', count: 100, c: 5, r: 3 }], { ready: [100, 0, 0, 0] });
  ok(BA21.canBurst(burst, burst.stacks[0]), 'Перегретые can burst');
  const bev = BA21.act(burst, { type: 'burst' });
  ok(hits(bev, 'burst').length === 2 && burst.stacks[0].count === 0, 'Разрыв: they die and hit all neighbours');
  const geyser = field([{ unit: 'geyser', count: 4, c: 5, r: 4 }], [{ unit: 'plated', count: 30, c: 6, r: 4 }, { unit: 'plated', count: 30, c: 6, r: 3 }, { unit: 'plated', count: 30, c: 6, r: 5 }], { ready: [100, 0, 0, 0] });
  ok(hits(BA21.act(geyser, { type: 'attack', target: 1, c: 5, r: 4 }), 'arc').length === 2, 'Гейзеры scald the neighbours of the target');
  const sleepy = field([{ unit: 'sleepingvolcano', count: 1, c: 4, r: 4 }], [{ unit: 'plated', count: 100, c: 5, r: 4 }], { ready: [100, 0] });
  const s0 = peak(sleepy, sleepy.stacks[0], sleepy.stacks[1], 'melee');
  sleepy.stacks[0].rested = true;
  ok(near(peak(sleepy, sleepy.stacks[0], sleepy.stacks[1], 'melee') / s0, 2, 0.04), 'Спящий вулкан: after Оборона the next hit is doubled');
  BA21.act(sleepy, { type: 'defend' });
  ok(sleepy.stacks[0].rested === true, 'Оборона sets it');

  const slag = BA21.create({ seed: 5, obstacles: [], ready: [0, 100, 0], sides: [{ stacks: [{ unit: 'apprentice', count: 50, c: 4, r: 4 }], hero: heroBits({ slag: true }) }, { stacks: [{ unit: 'militia', count: 50, c: 5, r: 4 }, { unit: 'militia', count: 50, c: 12, r: 9 }] }] });
  slag.stacks[0].heat = 3;
  const n0 = BA21.total(slag.stacks[1]), far0 = BA21.total(slag.stacks[2]);
  for (let i = 0; i < 40 && slag.active !== 0; i++) BA21.act(slag, { type: 'defend' });
  ok(BA21.total(slag.stacks[1]) < n0 && BA21.total(slag.stacks[2]) === far0, 'Шлак: an overheated stack burns the enemies beside it');
  const smoke = BA21.create({ seed: 5, obstacles: [], sides: [{ stacks: [{ unit: 'apprentice', count: 10, c: 1, r: 4 }], hero: heroBits({ smoke: F21.smoke }) }, { stacks: [{ unit: 'crossbow', count: 10, c: 12, r: 4 }, { unit: 'militia', count: 10, c: 12, r: 6 }] }] });
  ok(BA21.fxs(smoke.stacks[1], 'dmgPct') === -F21.smoke && !BA21.fxs(smoke.stacks[2], 'dmgPct'), 'Серный дым: enemy shooters −20 % damage');
  const erupt = BA21.create({ seed: 5, obstacles: [], ready: [100, 0, 0], sides: [{ stacks: [{ unit: 'apprentice', count: 10, c: 1, r: 4 }], hero: heroBits({ high: 'erupt', level: 20 }) }, { stacks: [{ unit: 'plated', count: 50, c: 12, r: 4 }, { unit: 'salamander', count: 50, c: 12, r: 6 }] }] });
  const e1 = BA21.total(erupt.stacks[1]), e2 = BA21.total(erupt.stacks[2]);
  BA21.act(erupt, { type: 'order', order: 'high' });
  ok(BA21.total(erupt.stacks[1]) === e1 - 20 * F21.erupt && BA21.total(erupt.stacks[2]) === e2, 'Извержение: 20 × level of fire on every enemy, salamanders do not care');
  ok(erupt.stacks[0].heat === F21.cap && BA21.fxHas(erupt.stacks[0], 'noOverheat'), 'and the Forge gets 3 heat without overheating');
  const heart = BA21.create({ seed: 5, obstacles: [], sides: [{ stacks: [{ unit: 'apprentice', count: 10, c: 1, r: 4 }, { unit: 'militia', count: 10, c: 1, r: 6 }], hero: heroBits({ heatStart: true }) }, { stacks: [{ unit: 'militia', count: 10, c: 12, r: 4 }] }] });
  ok(heart.stacks[0].heat === 1 && !heart.stacks[1].heat, 'Сердце вулкана: the Forge starts with 1 heat');

  const lavaMap = cls => {
    const M = MD21.create(30, 20, ['meadow']);
    MD21.paint(M, 0, 'lava', (c, r) => c >= 8 && c < 10);
    MD21.paint(M, 0, 'ash', (c, r) => c >= 10 && c < 12);
    const S = Adv21.create(M, { seed: 21, moons: null, players: [{ name: 'Игрок', color: 0, faction: H.CLASSES[cls].faction, human: true }, { name: 'Чужой', color: 1, faction: 'league', human: false }], heroes: [{ owner: 0, name: 'Проба', cls, faction: H.CLASSES[cls].faction, c: 7, r: 5, army: [{ unit: 'militia', count: 5 }] }, { owner: 1, name: 'Чужой', cls: 'captain', faction: 'league', c: 29, r: 0, army: [{ unit: 'militia', count: 5 }] }] });
    const g = Adv21.grid(S, 0, 0);
    return { S, h: S.heroes[0], lava: Adv21.stepCost(S, S.heroes[0], g, 0, 8, 5), ash: Adv21.stepCost(S, S.heroes[0], g, 0, 10, 5) };
  };
  const forgeWalk = lavaMap('forgemaster'), leagueWalk = lavaMap('captain');
  ok(forgeWalk.lava === HE21.ground(forgeWalk.h, H.ROADS[1].cost) && forgeWalk.ash === HE21.ground(forgeWalk.h, H.ROADS[1].cost), 'Лавовые тропы: lava and ash cost a Forge hero a road');
  ok(!leagueWalk.lava && leagueWalk.ash > forgeWalk.ash, 'other heroes cannot cross lava');

  const smithy = (built, cls) => {
    const W = townMap('forge', ['hall1', 'tavern', 'dwell1', ...built]);
    if (cls) W.hero.cls = cls;
    return W;
  };
  const rf = smithy(['smith', 'special1']);
  const plains = Object.values(H.ARTIFACTS).filter(a => a.rank === 'plain' && !a.scroll && a.slot === 'head');
  rf.hero.bag = [plains[0].id, plains[1].id, 'quilted'];
  rf.res.gold = 5000;
  ok(TW21.canReforge(rf.o) && TW21.reforgePairs(rf.hero).length === 1, 'Великий горн finds the pair');
  const made = TW21.reforge(rf.S, rf.o, rf.hero, 0, 1);
  ok(!!made && H.ARTIFACTS[made].slot === 'head' && H.ARTIFACTS[made].rank === 'rare' && rf.hero.bag.length === 2 && rf.res.gold === 5000 - F21.reforge.plain, 'two plain helmets become one rare helmet for 1000 gold');
  const irga = smithy(['smith', 'special1']);
  irga.hero.hid = 'irga';
  ok(TW21.reforgeCost(irga.hero, 'plain') === F21.reforge.plain / 2, 'Кузнечиха: Ирга reforges at half price');
  const noFurnace = smithy(['smith']);
  noFurnace.hero.bag = [plains[0].id, plains[1].id];
  ok(!TW21.reforge(noFurnace.S, noFurnace.o, noFurnace.hero, 0, 1), 'no Great Forge, no reforging');
  const walls = smithy(['fort1', 'special2']);
  const sg = Adv21.siegeOf(walls.o, 2), plainWalls = Adv21.siegeOf(smithy(['fort1']).o, 2);
  ok(sg.wallMul === 2 && near(sg.dmg / plainWalls.dmg, 1.5, 0.05), 'Обсидиановые стены: walls twice as strong, towers +50 %');
  const found = smithy(['special3']);
  ok(TW21.machinePrice(found.S, 0, 'ballista') === Math.round(H.UNITS[H.MACHINES.ballista.unit].cost / 2) && TW21.machinePrice(smithy([]).S, 0, 'ballista') === H.UNITS[H.MACHINES.ballista.unit].cost, 'Литейная: machines half price');
  const ash = smithy(['guild1', 'special4']);
  ok([1, 2, 3, 4, 5].some(c => TW21.shelf(ash.o, c).length > ash.o.guild[c].length), 'Пепельный алтарь: one more spell on the guild shelves');
  ok(Object.values(H.FACTIONS.forge.building).filter(b => b.dwelling).every(b => (b.cost.ore || 0) >= 5), 'the Forge pays its dwellings in ore');

  const coolAI = field([{ unit: 'apprentice', count: 50, c: 1, r: 4 }], [{ unit: 'crossbow', count: 5, c: 13, r: 9 }], { ready: [100, 0] });
  coolAI.stacks[0].heat = 3;
  BA21.hurt(coolAI.stacks[0], 100);
  const burstAI = field([{ unit: 'overheated', count: 3, c: 5, r: 4 }], [{ unit: 'militia', count: 200, c: 6, r: 4 }, { unit: 'militia', count: 200, c: 5, r: 3 }, { unit: 'militia', count: 200, c: 5, r: 5 }], { ready: [100, 0, 0, 0] });
  ok(H.BattleAI.choose(burstAI).type === 'burst', 'the AI bursts among many enemies');
  const temperAI = field([{ unit: 'temperer', count: 10, c: 1, r: 4 }, { unit: 'slaggiant', count: 4, c: 7, r: 4 }], [{ unit: 'militia', count: 30, c: 8, r: 4 }], { ready: [100, 0, 0] });
  temperAI.stacks[0].shots = 6;
  ok(['temper', 'shoot'].includes(H.BattleAI.choose(temperAI).type), 'the AI either tempers or shoots');
  for (let seed = 1; seed < 12; seed++) {
    const a = H.FACTIONS.forge.units.map(row => ({ unit: row[seed % 3], count: 6 + seed })), b = H.FACTIONS.tide.units.map(row => ({ unit: row[seed % 3], count: 6 + seed }));
    const place = (list, c) => list.map((x, i) => Object.assign(x, { c, r: i + 1 }));
    const B = BA21.create({ seed, sides: [{ stacks: place(a, 1), hero: heroBits({ high: 'erupt', level: 12, slag: true, smoke: 0.2, heatHold: true, heatPer: 0.15, fireCut: 0.3, heatStart: true }) }, { stacks: place(b, 13) }] });
    H.BattleAI.play(B, 100);
    ok(B.winner >= 0 || B.round > 100, 'a Forge battle with every rule ends (seed ' + seed + ')');
    JSON.parse(JSON.stringify(B));
  }
}

{
  const CP = H.Campaign, Sc = H.Script, MF = H.MapFile, Adv22 = H.Adv, MD22 = H.MapData;
  const camp = CP.get('zhar'), makers = require(path.join(ROOT, 'tools/heroes98-camp5-maps.cjs'))(H), mapText = m => fs.readFileSync(path.join(ROOT, 'content/heroes98/maps', m.id + '.h98m'), 'utf8');
  ok(!!camp && camp.missions.length === 5 && camp.hero === 'irga' && camp.faction === 'forge' && camp.number === 5, 'the Forge campaign has five missions, its hero and its people');
  camp.missions.forEach((m, i) => {
    const text = mapText(m), file = MF.read(text);
    ok(file.scenes === m.scenes, m.id + ': the file carries the scenes of the campaign module');
    ok(MF.write(Object.assign(makers[m.id](), { scenes: m.scenes })) === text, m.id + ': the file is what its maker builds');
    CP.attach(m, text);
    ok(!MF.blocking(MF.check(m.doc)).length, m.id + ': no blocking problems (' + MF.blocking(MF.check(m.doc)).map(x => x.text).join('; ') + ')');
    ok(!Sc.parse(m.scenes).errors.length, m.id + ': scenes parse');
    ok(m.brief.length > 150 && m.goals.length >= 1 && m.lose && m.name && m.about, m.id + ': has a briefing, goals and a way to lose');
    ok(m.levelCap > (i ? camp.missions[i - 1].levelCap : 1), m.id + ': the level cap grows');
    ok(m.bonuses.map(b => b.kind).sort().join() === 'art,res,unit', m.id + ': three bonuses, an artifact, creatures and resources');
    ok(m.bonuses.every(b => (b.kind === 'art' ? !!H.ARTIFACTS[b.id] : b.kind === 'unit' ? !!H.UNITS[b.unit] : Object.keys(b.res).every(k => H.RESOURCES.some(r => r[0] === k)))) && m.bonuses.every(b => CP.bonusText(b)), m.id + ': bonuses point at real things');
    const P = Sc.parse(m.scenes);
    for (const who of Sc.speakers(m.scenes)) ok(!!H.HEROES.find(x => x.id === who) || !!H.PEOPLE[who], m.id + ': the speaker ' + who + ' has a name');
    for (const who of Sc.speakers(m.scenes)) ok(H.Art.PORTRAITS.some(x => x.id === 'portrait/' + who), m.id + ': the speaker ' + who + ' has a portrait entry');
    for (const op of P.ops.filter(x => x.k === 'line')) ok(H.Font.wrap('text', op.text, 464).length <= 5, m.id + ': the line fits the text box: ' + op.text.slice(0, 30));
    for (const op of P.ops.filter(x => x.k === 'cmd' && x.cmd === 'spawn')) {
      const at = op.a[0] === 'hero' ? 3 : 2, col = +op.a[at], row = +op.a[at + 1], cells = m.doc.map;
      ok(MD22.inside(cells, col, row) && MD22.groundCost(cells, 0, col, row) > 0 && !cells.objs.some(o => o.l === 0 && MD22.cells(o).some(([x, y]) => x === col && y === row)), m.id + ': spawn cell ' + col + ',' + row + ' is free ground');
    }
    for (const op of P.ops.filter(x => x.k === 'cmd' && x.cmd === 'terrain')) {
      const [c0, r0, w, h] = op.a.slice(1, 5).map(Number), cells = [];
      for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) cells.push([c, r]);
      ok(cells.every(([c, r]) => !m.doc.map.objs.some(o => o.l === 0 && MD22.cells(o).some(([x, y]) => x === c && y === r))), m.id + ': the lava covers no object at ' + op.a.join(' '));
    }
    ok(!/Microsoft|Windows|—/.test([m.brief, m.scenes].join(' ')), m.id + ': no real names and no long dashes');
    ok(m.doc.heroes.some(h => h.hid === 'irga' && h.owner === 0), m.id + ': Ирга starts it');
    ok(!Sc.check(m.scenes, [], new Set([...m.doc.map.objs.map(o => o.tag), ...m.doc.heroes.map(h => h.tag)].filter(Boolean))).length, m.id + ': the scene check finds nothing');
  });
  ok([...camp.opening, ...camp.ending, camp.about].every(s => typeof s === 'string' && s.length > 20 && !/—/.test(s)), 'the campaign has an opening and an ending in plain words');
  ok(camp.opening.length >= 3 && camp.ending.length >= 3 && !!H.THEMES[camp.theme] && H.THEMES[camp.theme].voices.every(v => v.notes.split(' ').length === 32), 'an opening, an ending and a theme of its own');
  ok(!!H.HEROES.find(x => x.id === 'garm').story, 'Гарм Окалина never shows up in a tavern');

  CP.reset();
  ok(!CP.isOpen('zhar'), 'the fifth campaign waits for the fourth');
  for (const id of ['nabat', 'sol', 'zapoved']) CP.begin(id, 'easy').finished = true;
  const r4 = CP.begin('chasha', 'easy');
  r4.flags = { heart_given: 1 };
  r4.finished = true;
  ok(CP.isOpen('zhar') && CP.begin('zhar', 'easy').flags.heart_given === 1, 'a finished «Чаша» opens «Жар» and hands over its flags');
  const lines22 = (index, flags) => {
    CP.reset();
    const r = CP.begin('zhar', 'easy');
    r.flags = flags;
    if (index) r.hero = CP.carryOf(H.Hero.init({ hid: 'irga', cls: 'forgemaster', faction: 'forge', level: 1, xp: 0, army: [], c: 0, r: 0, l: 0 }, {}), []);
    const def = CP.setup('zhar', index, { seed: 5, bonus: 1 }), S = Adv22.create(def.map, def.setup), said = [];
    Sc.opening(S);
    for (let g = 0; g < 300 && S.scene; g++) {
      said.push(S.scene.text);
      Sc.advance(S, 0);
    }
    return { S, said, hero: S.heroes.find(h => h.hid === 'irga') };
  };
  ok(lines22(0, { heart_given: 1 }).said.some(t => /кусок лунного сердца/.test(t)) && !lines22(0, {}).said.some(t => /кусок лунного сердца/.test(t)), 'Ильм has heard of the heart from «Чаша»');
  const casters = x => x.hero.army.filter(s => s && s.unit === 'caster').reduce((n, s) => n + s.count, 0);
  ok(casters(lines22(3, { judges_freed: 1 })) === casters(lines22(3, {})) + 6, 'the freed judges of mission 2 send casters to mission 4');
  ok(lines22(4, { judges_held: 1 }).S.players[0].res.gold === lines22(4, {}).S.players[0].res.gold + 5000, 'the held judges of mission 2 bring their ransom to mission 5');
  const apprentices = x => x.hero.army.filter(s => s && s.unit === 'apprentice').reduce((n, s) => n + s.count, 0);
  ok(apprentices(lines22(4, { guilds_sworn: 1 })) === apprentices(lines22(4, {})) + 30, 'the guilds sworn in time come to mission 5');
  CP.reset();

  const lava22 = (() => {
    CP.reset();
    CP.begin('zhar', 'easy');
    const def = CP.setup('zhar', 4, { seed: 7, bonus: 0 }), S = Adv22.create(def.map, def.setup);
    Sc.opening(S);
    while (S.scene) Sc.advance(S, 0);
    const before = MD22.terrainAt(S.map, 0, 41, 25).id;
    S.day = 8;
    Adv22.conclude(S, []);
    while (S.scene) Sc.advance(S, 0);
    CP.reset();
    return [before, MD22.terrainAt(S.map, 0, 41, 25).id];
  })();
  ok(lava22[0] !== 'lava' && lava22[1] === 'lava', 'Старый Горн pours lava on day 8 (' + lava22.join('/') + ')');

  const gone22 = (() => {
    CP.reset();
    CP.begin('zhar', 'easy');
    const def = CP.setup('zhar', 2, { seed: 7, bonus: 0 }), S = Adv22.create(def.map, def.setup);
    Sc.opening(S);
    while (S.scene) Sc.advance(S, 0);
    const convoy = S.map.objs.find(o => o.tag === 'convoy');
    const moving = convoy.route.length > 2 && convoy.pace > 0;
    convoy.routeDone = true;
    Adv22.conclude(S, []);
    while (S.scene) Sc.advance(S, 0);
    CP.reset();
    return { moving, over: S.over };
  })();
  ok(gone22.moving && !!gone22.over && gone22.over.winner < 0, 'the convoy that reaches the valley loses the mission');

  const quest22 = (() => {
    const M = MD22.create(48, 48, ['meadow']);
    const hut = MD22.add(M, { t: 'petitioner', c: 20, r: 20, l: 0, owner: -1, quest: { kind: 'rank', rank: 'rare', slot: 'head' }, reward: { gold: 100 } });
    const S = Adv22.create(M, { seed: 3, moons: null, players: [{ name: 'Ч', color: 0, faction: 'forge', human: true }, { name: 'Б', color: 1, faction: 'league', human: false }], heroes: [{ owner: 0, name: 'Проба', cls: 'forgemaster', faction: 'forge', c: 2, r: 2, army: [{ unit: 'apprentice', count: 5 }] }, { owner: 1, name: 'Б', cls: 'captain', faction: 'league', c: 46, r: 46, army: [{ unit: 'militia', count: 5 }] }] });
    const h = S.heroes[0], plain = Object.values(H.ARTIFACTS).find(a => a.slot === 'head' && a.rank === 'plain'), rare = Object.values(H.ARTIFACTS).find(a => a.slot === 'head' && a.rank === 'rare'), rareOther = Object.values(H.ARTIFACTS).find(a => a.slot !== 'head' && a.rank === 'rare' && !a.scroll);
    h.bag = [plain.id, rareOther.id];
    const early = H.Sites.questReady(S, h, hut.quest);
    h.bag.push(rare.id);
    const late = H.Sites.questReady(S, h, hut.quest);
    return { early, late, text: H.Sites.questText(hut.quest) };
  })();
  ok(!quest22.early && quest22.late && /редкий предмет/.test(quest22.text), 'a quest for a rare helmet waits for a rare helmet: ' + quest22.text);

  const lavaCheck = factions => {
    const M = MD22.create(48, 48, ['ash']);
    MD22.paint(M, 0, 'lava', (c, r) => c >= 20 && c < 23);
    MD22.add(M, { t: 'chest', c: 40, r: 40, owner: -1, l: 0 });
    const d = { name: 'Л', about: '', map: M, players: [{ who: 'human', factions, team: 0, town: null }], goals: { win: [], lose: [] }, heroes: [{ owner: 0, c: 4, r: 4, l: 0, army: [{ unit: 'militia', count: 5 }] }], events: [], scenes: '' };
    return MF.unreached(d).length;
  };
  ok(lavaCheck(['forge']) === 0 && lavaCheck(['league']) === 1, 'the map check knows that the Forge walks on lava');

  const playAll22 = (index, seed) => {
    CP.reset();
    const r = CP.begin('zhar', 'easy');
    if (index) {
      const S0 = { rs: seed >>> 0, ver: 0 }, h0 = H.Hero.init({ hid: 'irga', cls: 'forgemaster', faction: 'forge', level: 1, xp: H.XP_TABLE[camp.missions[index - 1].levelCap], army: [], c: 0, r: 0, l: 0 }, {});
      H.Hero.autoUp(S0, h0);
      r.hero = CP.carryOf(h0, []);
    }
    const def = CP.setup('zhar', index, { seed, bonus: seed % 3 }), S = Adv22.create(def.map, def.setup);
    Sc.opening(S);
    for (let g = 0; g < 400 && !S.over; g++) {
      while (S.scene) Sc.advance(S, 0);
      const T = H.AI.begin(S, S.turn);
      for (let i = 0; i < 40000 && !S.over; i++) {
        while (S.scene) Sc.advance(S, 0);
        const st = H.AI.step(S, T);
        if (st.battle) {
          const setup = st.battle === true ? Adv22.battleSetup(S) : st.battle, B = H.Battle.create(setup);
          H.BattleAI.play(B, 60);
          Adv22.battleDone(S, B);
        }
        if (st.done) break;
      }
      while (S.scene) Sc.advance(S, 0);
      if (!S.over) Adv22.endTurn(S);
    }
    return S;
  };
  for (let i = 0; i < 5; i++) {
    const S = playAll22(i, 2000);
    ok(!!S.over && S.over.winner === 0, camp.missions[i].id + ': the AI in the human slot finishes the mission (' + S.day + ' days)');
    ok(S.script.goals.every(g => g.state !== 'open'), camp.missions[i].id + ': the win closes its goals (' + S.script.goals.map(g => g.id + ':' + g.state).join(' ') + ')');
  }
  CP.reset();
}

{
  const BA23 = H.Battle, Adv23 = H.Adv, TW23 = H.Town, MD23 = H.MapData, HE23 = H.Hero, T23 = H.HERO.throne;
  const field = (left, right, o) => BA23.create(Object.assign({ seed: 5, obstacles: [], sides: [{ stacks: left }, { stacks: right }] }, o || {}));
  const hits = (ev, kind) => ev.filter(e => e.t === 'hit' && e.kind === kind);
  const heroBits = more => Object.assign({ perks: [], spells: [], ranks: {}, mana: 0, power: 0, level: 1 }, more || {});
  const crown = more => heroBits(Object.assign({ mirror: 1, mirrorShare: T23.share, mirrorRounds: T23.rounds, mirrorTier: T23.tier }, more || {}));
  const peak = (B, s, t, kind) => BA23.forecast(B, s, t, kind).max;
  const near = (a, b, within) => Math.abs(a - b) <= within;
  const without = (id, key, fn) => {
    const keep = H.UNITS[id][key];
    delete H.UNITS[id][key];
    try {
      return fn();
    } finally {
      H.UNITS[id][key] = keep;
    }
  };
  const toRound = (B, n) => {
    for (let i = 0; i < 400 && B.round < n && B.winner < 0; i++) BA23.act(B, { type: 'defend' });
  };

  for (const id of H.FACTIONS.throne.units.flat()) {
    const [blow, shot, fall] = H.UNIT_SOUNDS.SOUND_OF[id] || [];
    ok(!!H.UNIT_SOUNDS.BLOWS[blow] && (!shot || !!H.UNIT_SOUNDS.SHOTS[shot]) && !!H.UNIT_SOUNDS.FALLS[fall] && !!shot === !!H.UNITS[id].shots, id + ' has its own sounds');
    ok(H.unitTraits(H.UNITS[id]).some(t => t[0] === 'Отражения'), id + ' lists the reflections of its people');
  }
  ok(!!H.THEMES.town_throne && H.THEMES.town_throne.voices.every(v => v.notes.split(' ').length === 32), 'the Throne has its town theme');
  ok(!!H.HEROES.find(x => x.id === 'severin').story && !H.HEROES.find(x => x.id === 'valeria').story, 'Северин Ладар is outside the eight, Валерия is one of them');
  ok(H.HEROES.filter(x => H.CLASSES[x.cls].faction === 'throne' && !x.story).length === 8, 'eight heroes of the Throne can be hired');
  ok(H.HEROES.filter(x => H.CLASSES[x.cls].faction === 'throne').every(x => H.Art.PORTRAITS.some(p => p.id === 'portrait/' + x.id)), 'every hero of the Throne has a portrait');
  ok(!!H.Art.UNITS.moonking && H.UNITS.moonking.faction === 'summon', 'the Moon King is a summoned creature with its picture entry');

  const mirrorField = (hero, hand) => BA23.create({ seed: 5, obstacles: [], sides: [{ plantByHand: !!hand, stacks: [{ unit: 'legionary', count: 50, c: 1, r: 2 }, { unit: 'moonmaiden', count: 10, c: 1, r: 6 }, { unit: 'throneknight', count: 4, c: 1, r: 8 }], hero }, { stacks: [{ unit: 'militia', count: 50, c: 12, r: 4 }] }] });
  const mf = mirrorField(crown());
  const copies = mf.stacks.filter(s => s.reflection);
  ok(copies.length === 1 && copies[0].unit === 'moonmaiden' && copies[0].count === 3 && copies[0].phantom && copies[0].summoned, 'Отражения: the dearest stack up to tier 5 gets a reflection of 30 %');
  ok(BA23.gap(copies[0], copies[0].c, copies[0].r, mf.stacks[1]) === 1 && copies[0].ready === mf.stacks[1].ready, 'the reflection stands beside its stack and is as ready');
  copies[0].shots = 0;
  BA23.hurt(mf.stacks[0], 60);
  ok(!BA23.canMend(copies[0]) && BA23.canMend(mf.stacks[1]), 'a reflection of the maidens does not heal');
  BA23.hurt(copies[0], 1);
  ok(copies[0].count === 0, 'a reflection dies from any damage');
  const lasting = mirrorField(crown()), copy = lasting.stacks.find(s => s.reflection);
  toRound(lasting, 3);
  const alive3 = copy.count > 0;
  toRound(lasting, 4);
  ok(alive3 && copy.count === 0 && lasting.round === 4, 'a reflection holds 3 rounds and fades');
  ok(!lasting.obstacles.some(p => p[0] === copy.c && p[1] === copy.r), 'a faded reflection leaves no thicket behind');
  const two = mirrorField(crown({ mirror: 2 }));
  ok(two.stacks.filter(s => s.reflection).map(s => s.unit).sort().join() === 'legionary,moonmaiden', 'Двойное отражение: two stacks get reflections');
  const guard = mirrorField(crown({ mirrorTier: T23.guardTier, mirrorRounds: T23.guardRounds }));
  ok(guard.stacks.find(s => s.reflection).unit === 'throneknight' && guard.stacks.find(s => s.reflection).expire === 4, 'Лунная гвардия: tier 6 can be reflected, the reflection holds 4 rounds');
  const hand = mirrorField(crown(), true);
  ok(!hand.stacks.some(s => s.reflection) && hand.sides[0].mirrorLeft === 1, 'the player picks the reflection by hand');
  ok(!BA23.mirrorOkay(hand, 0, 2) && BA23.mirrorOkay(hand, 0, 0) && !BA23.mirrorOkay(hand, 0, 3), 'tier 6 and enemy stacks cannot be reflected');
  const hev = BA23.mirror(hand, 0, 0);
  ok(hev.some(e => e.t === 'summon') && hand.stacks.find(s => s.reflection).unit === 'legionary' && hand.sides[0].mirrorLeft === 0, 'the picked stack gets its reflection');
  const lazy = mirrorField(crown(), true);
  BA23.act(lazy, { type: 'defend' });
  ok(lazy.stacks.some(s => s.reflection && s.unit === 'moonmaiden'), 'a reflection the player did not pick is placed by the mirror itself');
  ok(!mirrorField(heroBits()).stacks.some(s => s.reflection), 'a hero of another people has no reflections');
  const valeria = HE23.init({ hid: 'valeria', cls: 'royalknight', faction: 'throne', level: 1, xp: H.XP_TABLE[12], army: [] }, {});
  HE23.autoUp({ rs: 5, ver: 0 }, valeria);
  const vb = HE23.battleHero(valeria);
  ok(valeria.level === 12 && near(vb.mirrorShare, T23.share + 4 * T23.heir, 1e-9) && vb.mirror === (valeria.talents.includes('throne-1') ? 2 : 1), 'Наследница: +5 % for every 3 levels');
  valeria.talents.push('throne-1', 'throne-5', 'throne-3', 'throne-4');
  const vt = HE23.battleHero(valeria);
  ok(vt.mirror === 2 && vt.mirrorRounds === T23.guardRounds && vt.mirrorTier === T23.guardTier && vt.coldLight === 1 && vt.spellBack === T23.spellBack, 'the gift of the Crown reaches the battle');

  const shooter = (unit, extra) => field([{ unit: 'moonarcher', count: 20, c: 1, r: 4 }], [{ unit, count: 40, c: 12, r: 4 }], Object.assign({ ready: [100, 0] }, extra || {}));
  const ghost = shooter('legionary');
  const ghostShot = peak(ghost, ghost.stacks[0], ghost.stacks[1], 'shot');
  ok(near(ghostShot / without('legionary', 'shield', () => peak(ghost, ghost.stacks[0], ghost.stacks[1], 'shot')), 0.5, 0.03), 'Призрачные щиты: legionaries take half damage from arrows');
  const banner = field([{ unit: 'standardbearer', count: 20, c: 3, r: 4 }, { unit: 'legionary', count: 20, c: 3, r: 5 }, { unit: 'legionary', count: 20, c: 1, r: 9 }], [{ unit: 'militia', count: 10, c: 12, r: 4 }]);
  ok(BA23.moraleOf(banner, banner.stacks[1]) === BA23.moraleOf(banner, banner.stacks[2]) + 1, 'Знамя: +1 morale to the neighbours');
  const glass = field([{ unit: 'militia', count: 100, c: 4, r: 4 }], [{ unit: 'mirrorlegion', count: 40, c: 5, r: 4 }], { ready: [100, 0] });
  ok(hits(BA23.act(glass, { type: 'attack', target: 1, c: 4, r: 4 }), 'thorn').length === 1, 'Зерцало: a melee hit comes back');
  const hidden = shooter('militia');
  hidden.stacks[1].fx.push({ trait: 'Невидимость', hidden: true, until: 9, bad: false });
  ok(BA23.sees(hidden, hidden.stacks[0], hidden.stacks[1]) && hits(BA23.act(hidden, { type: 'shoot', target: 1 }), 'shot').length === 1, 'Лунный глаз: moon archers shoot the unseen');
  const plain = field([{ unit: 'crossbow', count: 20, c: 1, r: 4 }], [{ unit: 'militia', count: 40, c: 12, r: 4 }], { ready: [100, 0] });
  plain.stacks[1].fx.push({ trait: 'Невидимость', hidden: true, until: 9, bad: false });
  ok(!BA23.sees(plain, plain.stacks[0], plain.stacks[1]), 'other shooters do not');
  const twice = field([{ unit: 'silverarcher', count: 20, c: 1, r: 4 }], [{ unit: 'plated', count: 40, c: 12, r: 4 }], { ready: [100, 0] });
  ok(hits(BA23.act(twice, { type: 'shoot', target: 1 }), 'shot').length === 2 && twice.stacks[0].shots === H.UNITS.silverarcher.shots - 2, 'Два колчана: two arrows, two shots spent');
  const hunter = field([{ unit: 'moonhunter', count: 20, c: 1, r: 4 }], [{ unit: 'plated', count: 40, c: 12, r: 4 }], { ready: [100, 50] });
  ok(BA23.act(hunter, { type: 'shoot', target: 1 }).some(e => e.t === 'ready' && e.id === 1 && e.value === 50 - H.UNITS.moonhunter.shotSap), 'Лунная стрела: the target loses 10 readiness');

  const spellAt = (unit, sp) => {
    const B = field([{ unit: 'militia', count: 10, c: 1, r: 4 }], [{ unit, count: 30, c: 12, r: 4 }]);
    return BA23.spellDamage(B, heroBits({ power: 5 }), H.SPELLS[sp], B.stacks[1], 400);
  };
  ok(near(spellAt('mirrorguard', 'spark') / without('mirrorguard', 'spellIn', () => spellAt('mirrorguard', 'spark')), 0.5, 0.02), 'Зеркальная грань: half damage from spells');
  const prism = field([{ unit: 'militia', count: 30, c: 5, r: 4 }, { unit: 'militia', count: 30, c: 5, r: 3 }], [{ unit: 'prismguard', count: 20, c: 6, r: 4 }], { ready: [100, 0, 0] });
  ok(hits(BA23.act(prism, { type: 'attack', target: 2, c: 5, r: 4 }), 'retal').length === 2, 'Грани: the answer hits a second enemy too');
  const step = field([{ unit: 'mirrorswap', count: 10, c: 1, r: 2 }, { unit: 'moonarcher', count: 10, c: 4, r: 6 }], [{ unit: 'militia', count: 30, c: 5, r: 6 }], { ready: [100, 0, 0] });
  BA23.act(step, { type: 'switch', target: 1 });
  ok(step.stacks[0].c === 4 && step.stacks[0].r === 6 && step.stacks[1].c === 1 && step.stacks[1].r === 2 && !BA23.canSwitch(step.stacks[0]), 'Зеркальный шаг: the guards swap with their own stack once');

  const maids = field([{ unit: 'moonmaiden', count: 10, c: 1, r: 4 }, { unit: 'legionary', count: 40, c: 2, r: 6 }], [{ unit: 'militia', count: 30, c: 13, r: 9 }], { ready: [100, 0, 0] });
  BA23.hurt(maids.stacks[1], 150);
  const hurt0 = BA23.total(maids.stacks[1]);
  BA23.act(maids, { type: 'mend', target: 1 });
  ok(BA23.total(maids.stacks[1]) === Math.min(40 * H.UNITS.legionary.hp, hurt0 + Math.round(10 * H.UNITS.moonmaiden.hp * H.UNITS.moonmaiden.mend.share)) && maids.stacks[0].mended === 1, 'Лунный свет: the maidens heal their stack');
  maids.stacks[0].mended = 3;
  ok(!BA23.canMend(maids.stacks[0]), 'three times a battle');
  const white = field([{ unit: 'whitemaiden', count: 10, c: 1, r: 4 }, { unit: 'legionary', count: 40, c: 2, r: 6 }], [{ unit: 'militia', count: 30, c: 13, r: 9 }], { ready: [100, 0, 0] });
  BA23.hurt(white.stacks[1], 140);
  BA23.act(white, { type: 'revive', target: 1 });
  ok(white.stacks[1].count === 40 && white.stacks[1].borrowed === 0 && !BA23.canRevive(white.stacks[0]), 'Белый свет: the fallen stand up for good, once a battle');
  ok(H.UNITS.silvermaiden.spellOnce === 'blind' && BA23.canCharm({ unit: 'silvermaiden', charmed: false }), 'Девы Серебряной луны cast Ослепление once');

  const wall = Array.from({ length: 10 }, (_, r) => [5, r]);
  const jump = field([{ unit: 'deerrider', count: 3, c: 4, r: 4 }], [{ unit: 'militia', count: 1, c: 13, r: 9 }], { obstacles: wall, ready: [100, 0] });
  ok([...BA23.reach(jump, jump.stacks[0]).values()].some(p => p.c > 5), 'Прыжок: deer riders leap over obstacles');
  const foot = field([{ unit: 'militia', count: 3, c: 4, r: 4 }], [{ unit: 'militia', count: 1, c: 13, r: 9 }], { obstacles: wall, ready: [100, 0] });
  ok(![...BA23.reach(foot, foot.stacks[0]).values()].some(p => p.c > 5), 'others stop at the wall');
  const run = steps => {
    const B = field([{ unit: 'silverrider', count: 3, c: 1, r: 4 }], [{ unit: 'plated', count: 50, c: 1 + steps + 1, r: 4 }], { ready: [100, 0] });
    return BA23.forecast(B, B.stacks[0], B.stacks[1], 'melee', { c: 1 + steps, r: 4, flown: 0, run: steps }).max;
  };
  ok(near(run(5) / run(0), 1 + 5 * H.UNITS.silverrider.charge, 0.02), 'Разгон: +4 % a cell for the silver riders');
  const darts = field([{ unit: 'deerhunter', count: 3, c: 1, r: 4 }], [{ unit: 'plated', count: 50, c: 12, r: 4 }], { ready: [100, 0] });
  ok(hits(BA23.act(darts, { type: 'shoot', target: 1 }), 'shot').length === 1 && darts.stacks[0].shots === H.UNITS.deerhunter.shots - 1, 'Олени-ловчие throw darts');

  const oath = field([{ unit: 'throneknight', count: 4, c: 4, r: 4 }], [{ unit: 'militia', count: 30, c: 12, r: 4 }]);
  ok(BA23.resists(oath.stacks[0], H.SPELLS.blind) && BA23.resists(oath.stacks[0], H.SPELLS.fear) && !BA23.resists(oath.stacks[0], H.SPELLS.balm), 'Клятва: Морок does not touch the knights');
  const panic = field([{ unit: 'throneknight', count: 4, c: 1, r: 4 }, { unit: 'legionary', count: 30, c: 1, r: 8 }], [{ unit: 'militia', count: 30, c: 13, r: 4 }], { ready: [100, 0, 0] });
  panic.sides[0].morale = -3;
  let lost = 0;
  for (let i = 0; i < 300 && panic.round < 12 && panic.winner < 0; i++) lost += BA23.act(panic, { type: 'defend' }).filter(e => e.t === 'morale' && !e.good && e.id === 0).length;
  ok(!lost, 'Клятва: the knights never lose a turn to fear');
  const cover = field([{ unit: 'militia', count: 100, c: 5, r: 4 }], [{ unit: 'legionary', count: 40, c: 6, r: 4 }, { unit: 'oathkeeper', count: 3, c: 6, r: 3 }], { ready: [100, 0, 0] });
  const cev = BA23.act(cover, { type: 'attack', target: 1, c: 5, r: 4 });
  const toKeeper = hits(cev, 'cover')[0], toLegion = hits(cev, 'melee')[0];
  ok(!!toKeeper && !!toLegion && toKeeper.dmg < toLegion.dmg && BA23.total(cover.stacks[1]) > 40 * H.UNITS.legionary.hp - 2 * toLegion.dmg, 'Хранители клятвы take half the blow on a neighbour on their own armour');
  const punish = field([{ unit: 'punisher', count: 3, c: 4, r: 4 }], [{ unit: 'plated', count: 50, c: 6, r: 4 }], { ready: [100, 0] });
  const p0 = peak(punish, punish.stacks[0], punish.stacks[1], 'melee');
  punish.stacks[1].fx.push({ spell: 'haste', initPct: 0.2, until: 9, bad: false });
  ok(near(peak(punish, punish.stacks[0], punish.stacks[1], 'melee') / p0, 1 + H.UNITS.punisher.punish, 0.02), 'Кара: +30 % on a stack under a spell');

  const beam = field([{ unit: 'shard', count: 2, c: 1, r: 4 }], [{ unit: 'militia', count: 40, c: 8, r: 4 }, { unit: 'militia', count: 40, c: 9, r: 4 }, { unit: 'militia', count: 40, c: 10, r: 4 }, { unit: 'militia', count: 40, c: 11, r: 4 }], { ready: [100, 0, 0, 0, 0] });
  const blast = BA23.blastTargets(beam, beam.stacks[0], beam.stacks[1]);
  ok(blast.length === 2 && blast.map(([t]) => t.id).join() === '2,3', 'Лунный луч: the beam takes two more stacks behind the target');
  ok(BA23.resists(beam.stacks[0], H.SPELLS.balm) && BA23.resists(beam.stacks[0], H.SPELLS.blind) && !BA23.resists(beam.stacks[0], H.SPELLS.spark), 'Осколок луны: Ясна and Морок do not touch it');
  const shine = field([{ unit: 'radiantshard', count: 2, c: 1, r: 4 }, { unit: 'legionary', count: 40, c: 4, r: 4 }], [{ unit: 'militia', count: 40, c: 8, r: 4 }], { ready: [100, 0, 0] });
  BA23.hurt(shine.stacks[1], 100);
  const sh0 = BA23.total(shine.stacks[1]);
  BA23.act(shine, { type: 'shoot', target: 2 });
  ok(BA23.total(shine.stacks[1]) > sh0, 'Сияние луча: the beam heals its own on the line');
  const dark = field([{ unit: 'darkshard', count: 2, c: 1, r: 4 }], [{ unit: 'plated', count: 40, c: 8, r: 4 }], { ready: [100, 60] });
  ok(BA23.act(dark, { type: 'shoot', target: 1 }).some(e => e.t === 'ready' && e.id === 1 && e.value === 60 - H.UNITS.darkshard.blastReady), 'Тёмный луч: the target loses 25 readiness');

  const kings = BA23.create({ seed: 5, obstacles: [], ready: [100, 0], sides: [{ stacks: [{ unit: 'legionary', count: 10, c: 1, r: 2 }], hero: heroBits({ high: 'kings', level: 24 }) }, { stacks: [{ unit: 'militia', count: 50, c: 12, r: 4 }] }] });
  BA23.act(kings, { type: 'order', order: 'high' });
  const king = kings.stacks.find(s => s.unit === 'moonking');
  ok(!!king && king.count === 24 / T23.kingPer && king.summoned && king.expire === 3, 'Возвращение царей: a Moon King for every 6 levels, for 3 rounds');
  ok(!BA23.canOrder(kings, 'high'), 'once a battle');
  const light = BA23.create({ seed: 5, obstacles: [], sides: [{ stacks: [{ unit: 'legionary', count: 10, c: 1, r: 2 }], hero: heroBits({ power: 6, coldLight: 1 }) }, { stacks: [{ unit: 'militia', count: 50, c: 12, r: 4 }] }] });
  ok(BA23.spellRounds(light, light.sides[0].hero, H.SPELLS.mirrorarmor) === BA23.spellRounds(light, heroBits({ power: 6 }), H.SPELLS.mirrorarmor) + 1 && BA23.spellRounds(light, light.sides[0].hero, H.SPELLS.haste) === BA23.spellRounds(light, heroBits({ power: 6 }), H.SPELLS.haste), 'Холодный свет: Ясна holds a round longer');
  const back = BA23.create({ seed: 5, obstacles: [], ready: [0, 100], sides: [{ stacks: [{ unit: 'legionary', count: 40, c: 1, r: 2 }], hero: heroBits({ spellBack: T23.spellBack }) }, { stacks: [{ unit: 'militia', count: 50, c: 12, r: 4 }], hero: heroBits({ spells: ['spark'], ranks: { zhar: 1 }, mana: 99, power: 10 }) }] });
  const bev = BA23.act(back, { type: 'cast', spell: 'spark', target: 0 });
  ok(hits(bev, 'mirror').length === 1 && hits(bev, 'mirror')[0].to === 1, 'Зеркальный щит: part of the spell comes back to the caster side');

  const roadWalk = (cls, built) => {
    const M = MD23.create(30, 20, ['meadow']);
    MD23.road(M, 0, 3, [[2, 5], [20, 5]]);
    MD23.add(M, { t: 'town', c: 10, r: 12, owner: 0, faction: 'throne', name: 'Проба', built });
    const S = Adv23.create(M, { seed: 23, moons: null, players: [{ name: 'Игрок', color: 0, faction: 'throne', human: true }], heroes: [{ owner: 0, name: 'Проба', cls, faction: H.CLASSES[cls].faction, c: 4, r: 5, army: [{ unit: 'militia', count: 5 }] }] });
    return Adv23.stepCost(S, S.heroes[0], Adv23.grid(S, 0, 0), 0, 5, 5);
  };
  ok(roadWalk('royalknight', ['hall1']) === T23.road && roadWalk('captain', ['hall1']) === H.ROADS[3].cost, 'Наследство: a moon road costs a Throne hero 0.4, others 0.6');
  ok(roadWalk('captain', ['hall1', 'altar']) === T23.kingRoad && roadWalk('royalknight', ['hall1', 'altar']) === T23.kingRoad, 'Престол царей: 0.3 for every hero of the player');
  const ruins = heroMap('royalknight');
  MD23.add(ruins.S.map, { t: 'whiteruin', c: 12, r: 12, l: 0, owner: 0 });
  ok(!HE23.income(ruins.S, 0).moonsilver, 'without the talent a ruin gives nothing a day');
  ruins.h.talents.push('throne-2');
  ok(HE23.income(ruins.S, 0).moonsilver === 1, 'Наследник руин: +1 Лунное серебро a day a ruin');
  const silver0 = ruins.S.players[0].res.moonsilver;
  H.Sites.week(ruins.S, []);
  ok(ruins.S.players[0].res.moonsilver === silver0 + 1, 'a ruin gives the Throne Лунное серебро every week');
  ok(HE23.growthPct(ruins.S, 0, 5) === 0, 'growth of tier 5 stays without the talent');
  ruins.h.talents.push('throne-6');
  ok(HE23.growthPct(ruins.S, 0, 5) === T23.guardGrowth && HE23.growthPct(ruins.S, 0, 7) === T23.guardGrowth && HE23.growthPct(ruins.S, 0, 4) === 0, 'Белая гвардия: tiers 5–7 grow 15 % faster');

  const court = built => {
    const W = townMap('throne', ['hall1', 'tavern', 'dwell1', ...built]);
    W.hero.cls = 'royalknight';
    W.hero.faction = 'throne';
    return W;
  };
  const seat = townMap('throne', ['hall1', 'tavern', 'dwell1', 'hall2', 'special1'], [{ t: 'town', c: 20, r: 12, faction: 'throne', name: 'Второй', built: ['hall1', 'tavern', 'hall2'] }]);
  const second = TW23.list(seat.S).find(o => o !== seat.o);
  ok(TW23.state(seat.S, second, 'special1').why === T23.seat && TW23.state(seat.S, seat.o, 'special1').s === 'built', 'Белый престол: only in one town of the player');
  const hall = court(['guild1', 'special2']), bare = court([]);
  ok(near(Adv23.heroSide(hall.S, hall.hero, [0]).hero.mirrorShare - Adv23.heroSide(bare.S, bare.hero, [0]).hero.mirrorShare, T23.hall, 1e-9), 'Зеркальная зала: reflections +10 %');
  const stable = court(['dwell5', 'special3']), noStable = court(['dwell5']);
  ok(TW23.growth(stable.S, stable.o, 5) === TW23.growth(noStable.S, noStable.o, 5) + 2, 'Конюшня оленей: +2 riders a week');
  const temple = court(['guild1', 'special4']);
  ok([1, 2, 3, 4, 5].some(c => TW23.shelf(temple.o, c).length > temple.o.guild[c].length), 'Белый храм: one more spell on the guild shelves');
  const altar = court(['altar']);
  altar.hero.army[0] = { unit: 'legionary', count: 10, stars: 0, vet: 0 };
  altar.hero.army[1] = { unit: 'militia', count: 10, stars: 0, vet: 0 };
  const AB = BA23.create({ seed: 5, obstacles: [], sides: [Adv23.heroSide(altar.S, altar.hero, [0, 1]), { stacks: [{ unit: 'militia', count: 10, c: 12, r: 4 }] }] });
  const plainSide = court([]);
  plainSide.hero.army[0] = { unit: 'legionary', count: 10, stars: 0, vet: 0 };
  plainSide.hero.army[1] = { unit: 'militia', count: 10, stars: 0, vet: 0 };
  const PB = BA23.create({ seed: 5, obstacles: [], sides: [Adv23.heroSide(plainSide.S, plainSide.hero, [0, 1]), { stacks: [{ unit: 'militia', count: 10, c: 12, r: 4 }] }] });
  const legA = AB.stacks.find(s => s.unit === 'legionary' && !s.summoned), legP = PB.stacks.find(s => s.unit === 'legionary' && !s.summoned), milA = AB.stacks.find(s => s.unit === 'militia' && s.side === 0), milP = PB.stacks.find(s => s.unit === 'militia' && s.side === 0);
  ok(legA.atkPlus === legP.atkPlus + T23.edge && legA.defPlus === legP.defPlus + T23.edge && milA.atkPlus === milP.atkPlus, 'Престол царей: Throne creatures +1 Натиск and +1 Стойкость');
  ok(Object.values(H.FACTIONS.throne.building).filter(b => b.dwelling && b.dwelling >= 5).every(b => (b.cost.moonsilver || 0) >= 4), 'the Throne pays its high dwellings in Лунное серебро');
  ok(H.FACTIONS.throne.ai.every(id => H.FACTIONS.throne.building[id]), 'the AI building list of the Throne names real buildings');

  const mendAI = field([{ unit: 'moonmaiden', count: 10, c: 1, r: 4 }, { unit: 'throneknight', count: 3, c: 3, r: 6 }], [{ unit: 'militia', count: 5, c: 13, r: 9 }], { ready: [100, 0, 0] });
  mendAI.stacks[0].shots = 0;
  BA23.hurt(mendAI.stacks[1], 300);
  ok(H.BattleAI.choose(mendAI).type === 'mend', 'the AI heals with the maidens when a dear stack is hurt');
  const switchAI = field([{ unit: 'mirrorswap', count: 10, c: 1, r: 2 }, { unit: 'moonarcher', count: 10, c: 4, r: 6 }], [{ unit: 'militia', count: 30, c: 5, r: 6 }], { ready: [100, 0, 0] });
  ok(['switch', 'move', 'attack'].includes(H.BattleAI.choose(switchAI).type), 'the AI may free a pinned shooter with Зеркальный шаг');
  for (let seed = 1; seed < 12; seed++) {
    const a = H.FACTIONS.throne.units.map(row => ({ unit: row[seed % 3], count: 6 + seed })), b = H.FACTIONS.forge.units.map(row => ({ unit: row[seed % 3], count: 6 + seed }));
    const place = (list, c) => list.map((x, i) => Object.assign(x, { c, r: i + 1 }));
    const B = BA23.create({ seed, sides: [{ stacks: place(a, 1), hero: crown({ high: 'kings', level: 24, mirror: 2, mirrorTier: 6, mirrorRounds: 4, coldLight: 1, spellBack: 0.2, kings: 1 }) }, { stacks: place(b, 13), hero: heroBits({ spells: ['spark', 'blind'], ranks: { zhar: 1, morok: 1 }, mana: 60, power: 6 }) }] });
    H.BattleAI.play(B, 100);
    ok(B.winner >= 0 || B.round > 100, 'a Throne battle with every rule ends (seed ' + seed + ')');
    JSON.parse(JSON.stringify(B));
  }
}

{
  const CP = H.Campaign, Sc = H.Script, MF = H.MapFile, Adv24 = H.Adv, MD24 = H.MapData;
  const camp = CP.get('tysyacha'), makers = require(path.join(ROOT, 'tools/heroes98-camp6-maps.cjs'))(H), mapText = m => fs.readFileSync(path.join(ROOT, 'content/heroes98/maps', m.id + '.h98m'), 'utf8');
  ok(!!camp && camp.missions.length === 5 && camp.hero === 'valeria' && camp.faction === 'throne' && camp.number === 6, 'the Throne campaign has five missions, its hero and its people');
  const freeCell = (doc, c, r, l) => MD24.inside(doc.map, c, r) && MD24.groundCost(doc.map, l, c, r) > 0 && !doc.map.objs.some(o => o.l === l && MD24.cells(o).some(([x, y]) => x === c && y === r)) && !doc.heroes.some(h => h.c === c && h.r === r && (h.l || 0) === l);
  camp.missions.forEach((m, i) => {
    const text = mapText(m), file = MF.read(text);
    ok(file.scenes === m.scenes, m.id + ': the file carries the scenes of the campaign module');
    ok(MF.write(Object.assign(makers[m.id](), { scenes: m.scenes })) === text, m.id + ': the file is what its maker builds');
    CP.attach(m, text);
    ok(!MF.blocking(MF.check(m.doc)).length, m.id + ': no blocking problems (' + MF.blocking(MF.check(m.doc)).map(x => x.text).join('; ') + ')');
    ok(!Sc.parse(m.scenes).errors.length, m.id + ': scenes parse');
    ok(m.brief.length > 150 && m.goals.length >= 1 && m.lose && m.name && m.about, m.id + ': has a briefing, goals and a way to lose');
    ok(m.levelCap > (i ? camp.missions[i - 1].levelCap : 1), m.id + ': the level cap grows');
    ok(m.bonuses.map(b => b.kind).sort().join() === 'art,res,unit', m.id + ': three bonuses, an artifact, creatures and resources');
    ok(m.bonuses.every(b => (b.kind === 'art' ? !!H.ARTIFACTS[b.id] : b.kind === 'unit' ? !!H.UNITS[b.unit] : Object.keys(b.res).every(k => H.RESOURCES.some(r => r[0] === k)))) && m.bonuses.every(b => CP.bonusText(b)), m.id + ': bonuses point at real things');
    const P = Sc.parse(m.scenes);
    for (const who of Sc.speakers(m.scenes)) ok(!!H.HEROES.find(x => x.id === who) || !!H.PEOPLE[who], m.id + ': the speaker ' + who + ' has a name');
    for (const who of Sc.speakers(m.scenes)) ok(H.Art.PORTRAITS.some(x => x.id === 'portrait/' + who), m.id + ': the speaker ' + who + ' has a portrait entry');
    for (const op of P.ops.filter(x => x.k === 'line')) ok(H.Font.wrap('text', op.text, 464).length <= 5, m.id + ': the line fits the text box: ' + op.text.slice(0, 30));
    for (const op of P.ops.filter(x => x.k === 'cmd' && (x.cmd === 'spawn' || x.cmd === 'recall' || x.cmd === 'move'))) {
      const at = op.cmd === 'recall' ? 1 : op.cmd === 'move' ? 1 : op.a[0] === 'hero' ? 3 : 2, col = +op.a[at], row = +op.a[at + 1], lvl = +(op.a[at + 2] || 0);
      ok(freeCell(m.doc, col, row, lvl), m.id + ': ' + op.cmd + ' cell ' + col + ',' + row + ',' + lvl + ' is free ground');
    }
    ok(!/Microsoft|Windows|—/.test([m.brief, m.scenes].join(' ')), m.id + ': no real names and no long dashes');
    ok(m.doc.heroes.some(h => h.hid === 'valeria' && h.owner === 0), m.id + ': Валерия starts it');
    ok(!Sc.check(m.scenes, [], new Set([...m.doc.map.objs.map(o => o.tag), ...m.doc.heroes.map(h => h.tag)].filter(Boolean))).length, m.id + ': the scene check finds nothing');
  });
  ok([...camp.opening, ...camp.ending, camp.about].every(s => typeof s === 'string' && s.length > 20 && !/—/.test(s)), 'the campaign has an opening and an ending in plain words');
  ok(camp.opening.length >= 3 && camp.ending.length >= 3 && !!H.THEMES[camp.theme] && H.THEMES[camp.theme].voices.every(v => v.notes.split(' ').length === 32), 'an opening, an ending and a theme of its own');
  ok(!!H.THEMES.finale && H.THEMES.finale.voices.every(v => v.notes.split(' ').length === 32), 'the first morning has its own music');
  ok(!!H.HEROES.find(x => x.id === 'severin').story, 'Северин Ладар never shows up in a tavern');
  ok(Sc.check('@x\nrecall nobody 1 1 0 t\nroad 7 1 1 1 1\nend', [], new Set()).length === 2, 'the scene check knows recall and road');
  ok(Sc.check('@x\nrecall adelina 1 1 0 t\nroad 0 1 1 2 2\nend', [], new Set()).length === 0, 'a good recall and a good road pass the check');

  const pages = camp.epilogue({}), full = camp.epilogue({ spared_villages: 1, zap_paid: 1, crown_back: 1, kaidar_host: 1, promised_guilty: 1, branch_back: 1, snake_alive: 1, villages_kept: 1, merra_spared: 1, pearl_refused: 1, guilds_sworn: 1, judges_freed: 1, throne_taken: 1 });
  ok(pages.map(p => p.faction).join() === 'league,barrows,thicket,tide,forge,throne' && pages.every(p => H.Art.all().some(e => e.id === p.pic)), 'six lands get a page of the first morning with a picture entry');
  ok([...pages, ...full].every(p => p.title && p.text && H.Font.wrap('text', p.text, 640).length <= 5 && !/—/.test(p.text)), 'every epilogue page fits the slide');
  ok(pages.every((p, i) => p.text !== full[i].text), 'what the player did changes every page of the morning');
  const ui = fs.readFileSync(path.join(ROOT, 'js/apps/heroes98/he-ui-campaign.js'), 'utf8'), menu = fs.readFileSync(path.join(ROOT, 'js/apps/heroes98/he-ui-menu.js'), 'utf8');
  ok(ui.includes('class CreditsView') && ui.includes('this.camp.epilogue') && menu.includes('new H.CreditsView'), 'the end of the last campaign shows the morning and the credits, the title opens the same credits');

  CP.reset();
  ok(!CP.isOpen('tysyacha'), 'the last campaign waits for the others');
  const done = (id, flags, hero) => {
    const r = CP.begin(id, 'easy');
    r.done = [0, 1, 2, 3, 4];
    r.flags = flags || {};
    r.finished = true;
    if (hero) r.hero = hero;
    return r;
  };
  const carried = (hid, level, arts) => {
    const rec = H.HEROES.find(x => x.id === hid), h = H.Hero.init({ hid, cls: rec.cls, faction: H.CLASSES[rec.cls].faction, level: 1, xp: H.XP_TABLE[level], army: [], c: 0, r: 0, l: 0 }, {});
    H.Hero.autoUp({ rs: 5, ver: 0 }, h);
    return CP.carryOf(h, arts);
  };
  done('nabat', { aisulu_led: 1 }, carried('adelina', 17, ['bellcuirass']));
  done('sol', { kaidar_host: 1 });
  done('zapoved', { snake_alive: 1 });
  done('chasha', { merra_spared: 1 });
  ok(!CP.isOpen('tysyacha'), 'still closed after four campaigns');
  done('zhar', { link_flawed: 1 });
  const flags24 = CP.begin('tysyacha', 'easy').flags;
  ok(CP.isOpen('tysyacha') && flags24.aisulu_led && flags24.kaidar_host && flags24.snake_alive && flags24.merra_spared && flags24.link_flawed, '«Жар» opens «Тысячелетие», and the flags of all five campaigns come along');
  const allies = CP.alliesOf('tysyacha');
  ok(allies.adelina && allies.adelina.level === 17 && !allies.aisulu, 'the heroes of finished campaigns come with what they carried out of them');
  const play24 = (index, extra) => {
    const def = CP.setup('tysyacha', index, { seed: 5, bonus: 0 }), S = Adv24.create(def.map, def.setup), said = [];
    Sc.opening(S);
    const flush = () => {
      for (let g = 0; g < 400 && S.scene; g++) {
        said.push(S.scene.text);
        Sc.advance(S, extra && extra.answer || 0);
      }
    };
    flush();
    return { S, said, flush, hero: hid => S.heroes.find(h => h.alive && h.hid === hid) };
  };
  const m3 = play24(2);
  ok(!!m3.hero('aisulu') && m3.hero('aisulu').owner === 0 && m3.S.script.goals.find(g => g.id === 'ais').state === 'done', 'Айсулу led to the barrow in «Набат» comes to the union a week early');
  ok(m3.hero('aisulu').army.some(s => s && s.unit === 'bonebull'), 'the host of Кайдар-хан comes with Айсулу');
  const hut = m3.S.map.objs.find(o => o.tag === 'adel');
  hut.done = [0];
  Sc.poll(m3.S, []);
  m3.flush();
  const adel = m3.hero('adelina');
  ok(!!adel && adel.owner === 0 && adel.level === 17 && (Object.values(adel.arts).includes('bellcuirass') || adel.bag.includes('bellcuirass')), 'Аделина joins after her task with her level and her things from «Набат»');
  ok(m3.said.some(t => /Мальс|плохо считал/.test(t)), 'Мальс answers for his maps');
  const m4 = play24(3);
  ok(m4.hero('vedana').army.some(s => s && s.unit === 'zmey') && m4.hero('aisulu').level === 15, 'Змей flies with Ведана, and a hero without a finished campaign comes at level 15');
  const roadBefore = MD24.roadAt(m4.S.map, 0, 56, 22);
  m4.S.map.objs.find(o => o.tag === 'r1').owner = 0;
  Sc.poll(m4.S, []);
  m4.flush();
  ok(roadBefore === 3 && MD24.roadAt(m4.S.map, 0, 56, 22) === 0 && MD24.roadAt(m4.S.map, 0, 56, 56) === 3 && m4.S.campaign.flags.crown_back, 'a taken ruin cuts its own moon road, and Айсулу takes the Salt Crown home');
  const m5 = play24(4);
  ok(m5.S.heroes.filter(h => h.alive && h.owner === 0).length === 6 && m5.hero('naera').army.some(s => s && s.unit === 'rayrider'), 'all five come to the Night, Мерра sends rays to her sister');
  ok(!m5.S.players[1].hadTown, 'the Order holds no town in the last mission, so losing it never removes the regent');
  m5.S.script.flags.s1 = m5.S.script.flags.s2 = m5.S.script.flags.s3 = 1;
  m5.S.script.flags.v5_open = 1;
  Sc.poll(m5.S, []);
  m5.flush();
  ok(m5.S.map.objs.find(o => o.tag === 'ward').gone && m5.S.script.goals.some(g => g.id === 'regent'), 'when the moon sleeps the guard of the Middle leaves and the regent becomes the goal');
  const finale = answer => {
    const x = play24(4, { answer });
    x.S.heroes.find(h => h.hid === 'severin').alive = false;
    Sc.poll(x.S, []);
    x.flush();
    return x;
  };
  const take = finale(0), leave = finale(1);
  ok(take.S.over && take.S.over.winner === 0 && take.S.campaign.flags.throne_taken && !take.S.campaign.flags.throne_left, 'Валерия may take the White Throne');
  ok(leave.S.campaign.flags.throne_left && !leave.S.campaign.flags.throne_taken, 'or leave it empty');
  ok(take.said.some(t => /лопается/.test(t)), 'the flawed link of Ирга breaks the chain');
  CP.reset();
  done('nabat');
  done('sol');
  done('zapoved');
  done('chasha');
  done('zhar');
  CP.begin('tysyacha', 'easy');
  const plain = play24(4);
  plain.S.heroes.find(h => h.hid === 'severin').alive = false;
  Sc.poll(plain.S, []);
  plain.flush();
  ok(plain.said.some(t => /бьёт молотом/.test(t)) && plain.hero('adelina').level === 15, 'without the flawed link Ирга breaks the chain by hand, and allies without a carried hero come at level 15');
  CP.reset();

  const playAll24 = (index, seed) => {
    CP.reset();
    const r = CP.begin('tysyacha', 'easy');
    if (index) {
      const S0 = { rs: seed >>> 0, ver: 0 }, h0 = H.Hero.init({ hid: 'valeria', cls: 'royalknight', faction: 'throne', level: 1, xp: H.XP_TABLE[camp.missions[index - 1].levelCap], army: [], c: 0, r: 0, l: 0 }, {});
      H.Hero.autoUp(S0, h0);
      r.hero = CP.carryOf(h0, []);
    }
    const def = CP.setup('tysyacha', index, { seed, bonus: seed % 3 }), S = Adv24.create(def.map, def.setup);
    Sc.opening(S);
    for (let g = 0; g < 400 && !S.over; g++) {
      while (S.scene) Sc.advance(S, 0);
      const T = H.AI.begin(S, S.turn);
      for (let i = 0; i < 40000 && !S.over; i++) {
        while (S.scene) Sc.advance(S, 0);
        const st = H.AI.step(S, T);
        if (st.battle) {
          const setup = st.battle === true ? Adv24.battleSetup(S) : st.battle, B = H.Battle.create(setup);
          H.BattleAI.play(B, 60);
          Adv24.battleDone(S, B);
        }
        if (st.done) break;
      }
      while (S.scene) Sc.advance(S, 0);
      if (!S.over) Adv24.endTurn(S);
    }
    return S;
  };
  for (let i = 0; i < 5; i++) {
    const S = playAll24(i, 2000);
    ok(!!S.over && S.over.winner === 0, camp.missions[i].id + ': the AI in the human slot finishes the mission (' + S.day + ' days)');
    ok(S.script.goals.every(g => g.state !== 'open'), camp.missions[i].id + ': the win closes its goals (' + S.script.goals.map(g => g.id + ':' + g.state).join(' ') + ')');
  }
  CP.reset();
}
{
  const MF = H.MapFile, MD25 = H.MapData, Adv25 = H.Adv, Sc = H.Script, D = H.Duel, F25 = H.Fame;
  const fileOf = id => read('content/heroes98/maps/' + id + '.h98m');
  for (const rec of H.Maps.LIST) if (!rec.make) rec.doc = MF.read(fileOf(rec.id));
  const RELEASE = ['ford', 'salt', 'seven', 'crown', 'chasha', 'horn', 'ruins', 'border', 'conv', 'dark', 'isles', 'seals', 'three', 'union'];
  ok(RELEASE.every(id => H.Maps.LIST.some(m => m.id === id)) && H.Maps.LIST.length === RELEASE.length + 1 && H.Maps.LIST.some(m => m.id === 'mesha'), 'fourteen scenarios of the release and the old Соляная межа are in the list');
  const SIZE = { 'малая': 48, 'средняя': 80, 'большая': 112, 'огромная': 144 };
  const scenarios = require(path.join(ROOT, 'tools/heroes98-scen-maps.cjs'))(H);
  for (const f of ['tools/heroes98-scen-maps.cjs', `${DIR}/he-modes.js`, `${DIR}/he-ui-modes.js`]) {
    const src = read(f);
    ok(!/\/\*/.test(src) && !/^\s*\/\/(?!\s*#)/m.test(src) && !/[;{})]\s+\/\/\s/.test(src), 'no comments in ' + f);
  }
  const plays = {};
  for (const rec of H.Maps.LIST.filter(m => !m.make)) {
    const text = fileOf(rec.id), doc = MF.read(text), M = doc.map;
    ok(MF.write(doc) === text, rec.id + ': the file opens and saves the same');
    ok(MF.write(scenarios[rec.id]()) === text, rec.id + ': the file is what its maker builds');
    ok(!MF.blocking(MF.check(doc)).length, rec.id + ': no blocking problems');
    ok(doc.name === rec.name && doc.about === rec.about && rec.about.length > 60 && !/Microsoft|Windows|—/.test(rec.about), rec.id + ': the name and the text come from the list');
    ok(M.w === rec.w && M.h === rec.w && SIZE[rec.size] === rec.w && doc.players.length === rec.players && M.levels === (rec.levels || 1), rec.id + ': size, levels and players match the list');
    ok(text.length < 1024 * 1024, rec.id + ': the file is under 1 MB');
    ok(doc.players.every(p => M.objs.some(o => o.id === p.town && o.t === 'town')), rec.id + ': every player starts in a town');
    ok(!Sc.parse(doc.scenes).errors.length && !Sc.check(doc.scenes, [], new Set(M.objs.map(o => o.tag).filter(Boolean))).length, rec.id + ': the scenes parse and pass the check');
    const lineup = doc.players.map((p, i) => ({ faction: ['league', 'barrows', 'thicket', 'tide', 'forge', 'throne'][i % 6], human: !i }));
    const def = H.Maps.build(rec.id, { seed: 7, slots: lineup }), S = Adv25.create(def.map, def.setup);
    ok(S.players.length === rec.players && S.heroes.filter(h => h.alive).length >= rec.players, rec.id + ': a game starts with every player and a hero each');
    plays[rec.id] = { doc, S, M };
  }
  const count = (M, t) => M.objs.filter(o => o.t === t).length;

  {
    const { M } = plays.salt, town = M.objs.find(o => o.t === 'town' && o.name === 'Соляной Торг'), works = M.objs.filter(o => o.t === 'saltworks');
    let flats = 0;
    for (let i = 0; i < M.w * M.h; i++) if (M.ter[0][i] === H.TERRAIN_INDEX.saltflat) flats++;
    ok(!!town && town.owner < 0, 'Соляной путь: Соляной Торг stands in the middle and belongs to nobody');
    ok(works.length >= 2 && works.every(o => M.objs.some(g => g.t === 'monster' && Math.max(Math.abs(g.c - MD25.entry(o)[0]), Math.abs(g.r - MD25.entry(o)[1])) <= 1)), 'Соляной путь: salt works on the road, each with a guard at the door');
    ok(flats > 60, 'Соляной путь: salt flats along the road (' + flats + ')');
  }
  {
    const { M } = plays.seven;
    let river = 0;
    for (let i = 0; i < M.w * M.h; i++) if (M.river[0][i]) river++;
    ok(count(M, 'moongate') === 7 && count(M, 'shipyard') >= 7, 'Семь рек: seven moon gates and a shipyard for every town');
    ok(river > 7 * 25, 'Семь рек: seven rivers run to the sea (' + river + ' cells)');
  }
  {
    const { doc, M } = plays.crown, h = M.heart;
    ok(!!h && MD25.groundCost(M, h.l, h.c, h.r) > 0 && count(M, 'menhir') === 8, 'Кольцо Венца: the Heart lies on land and eight menhirs point to it');
    ok(doc.goals.win.some(g => g.kind === 'heart') && doc.goals.win.some(g => g.kind === 'defeat'), 'Кольцо Венца: win by the Heart or by force');
    const pool = [];
    for (let r = h.r - 6; r <= h.r + 6; r++) for (let c = h.c - 6; c <= h.c + 6; c++) if (MD25.inside(M, c, r) && MD25.isWater(M, 0, c, r)) pool.push(1);
    ok(pool.length > 10, 'Кольцо Венца: the Heart is on an island in the sea');
  }
  {
    const { doc, S } = plays.horn, M = S.map, lava = () => M.ter[0].filter(t => t === H.TERRAIN_INDEX.lava).length, ash = M.ter[0].slice();
    const core = lava();
    ok(core > 10 && count(M, 'giantforge') >= 1, 'Старый Горн: a lava crater and the Giants Forge');
    ok(Sc.parse(doc.scenes).events.filter(e => e.on === 'day').map(e => e.day).join() === '50,57,106,113,162,169,218,225', 'Старый Горн: the volcano wakes in every Convergence week and calms a week later');
    S.day = 50;
    Sc.poll(S, []);
    for (let g = 0; g < 50 && S.scene; g++) Sc.advance(S, 0);
    const hot = lava();
    S.day = 57;
    Sc.poll(S, []);
    for (let g = 0; g < 50 && S.scene; g++) Sc.advance(S, 0);
    ok(hot > core + 80 && lava() === core && M.ter[0].every((t, i) => t === ash[i]), 'Старый Горн: lava floods the valleys for a week and the old ground comes back (' + core + ', ' + hot + ')');
  }
  {
    const { M } = plays.ruins;
    ok(M.road[0].every(k => k === 0 || k === 3), 'Белые руины: every road is a moon road');
    ok(count(M, 'whiteruin') >= 4 && count(M, 'thronetreasury') >= 1, 'Белые руины: four white ruins and the Throne Treasury');
  }
  {
    const { M, S } = plays.border, gangs = M.objs.filter(o => o.t === 'monster' && o.route);
    ok(count(M, 'mercenarycamp') >= 4 && gangs.length === 4 && gangs.every(o => o.unit === 'bandits'), 'Порубежье: four mercenary camps and four bandit gangs');
    ok(gangs.every(o => o.route.every((p, i) => i === 0 || Math.max(Math.abs(p[0] - o.route[i - 1][0]), Math.abs(p[1] - o.route[i - 1][1])) <= 1) && o.route.every(p => MD25.groundCost(M, 0, p[0], p[1]) > 0)), 'Порубежье: the gangs walk cell by cell over open ground');
    const before = gangs.map(o => o.c + ',' + o.r).join();
    Adv25.endTurn(S);
    for (let k = 0; k < S.players.length; k++) Adv25.endTurn(S);
    ok(S.map.objs.filter(o => o.t === 'monster' && o.route).map(o => o.c + ',' + o.r).join() !== before, 'Порубежье: the gangs move every day');
  }
  {
    const { doc, M } = plays.conv;
    ok(!!M.heart && count(M, 'menhir') === 6, 'Схождение: the Heart in the middle and a menhir in every land');
    ok(doc.goals.win[0].kind === 'heart' && doc.goals.lose.some(g => g.kind === 'day' && g.day === 112), 'Схождение: raise the Heart before the end of the second circle');
  }
  {
    const { M } = plays.dark, vaults = Object.keys(H.OBJ).filter(k => H.OBJ[k].kind === 'vault'), here = new Set(M.objs.map(o => o.t));
    ok(M.levels === 2 && vaults.filter(k => !here.has(k)).length <= 1, 'Тьма: two levels and every treasury of the world (' + vaults.filter(k => !here.has(k)).join(' ') + ')');
    ok(count(M, 'stairsdown') >= 4 && M.objs.filter(o => o.l === 1 && o.t !== 'monster' && H.OBJ[o.t].kind !== 'decor').length > 100, 'Тьма: stairs down and a full Underworld');
  }
  {
    const { M } = plays.isles, rec = H.Maps.LIST.find(m => m.id === 'isles');
    ok(rec.hotseat && count(M, 'shipyard') >= 2, 'Остров на остров: made for two at one PC, a shipyard on each island');
  }
  {
    const { S, M } = plays.seals, gates = M.objs.filter(o => o.t === 'sealgate');
    ok(gates.length === 4 && gates.every(g => M.objs.some(o => o.t === 'sealer' && o.color === g.color)) && new Set(gates.map(g => g.color)).size === 4, 'Печати: four seal gates, each with its own sealer');
    ok(count(M, 'petitioner') >= 4, 'Печати: petitioner huts in the free lands');
    const g0 = gates[0];
    ok(!H.Sites.openFor(S, g0, 0), 'Печати: a gate does not open without the seal');
    S.players[0].seals.push(g0.color);
    ok(H.Sites.openFor(S, g0, 0), 'Печати: the seal opens it');
    for (const g of gates) {
      const c = g.c, r = g.r, open = H.Path.DIRS.filter(([x, y]) => MD25.groundCost(M, 0, c + x, r + y) > 0).length;
      ok(open <= 6, 'Печати: the pass at a gate is narrow, nobody walks around it (' + open + ')');
    }
  }
  {
    const { S } = plays.three, M = S.map, homes = [0, 1].map(i => M.objs.find(o => o.tag === 'home' + i));
    ok(homes.every(Boolean), 'Три дня: both towns carry a tag for the Horde');
    for (let k = 0; k < 400 && S.day < 26; k++) {
      for (let g = 0; g < 50 && S.scene; g++) Sc.advance(S, 0);
      Adv25.endTurn(S);
    }
    const hordes = [0, 1].map(i => M.objs.find(o => o.tag === 'horde' + i && o.t === 'monster'));
    ok(hordes.every(o => o && o.unit === 'mercenaries' && o.mood === 'fierce'), 'Три дня: the Horde came out on the third week');
    ok(hordes.every((o, i) => Math.max(Math.abs(o.c - MD25.entry(homes[i])[0]), Math.abs(o.r - MD25.entry(homes[i])[1])) <= 3), 'Три дня: in three days the Horde stands at each gate (' + hordes.map(o => o.c + ',' + o.r).join(' ') + ')');
  }
  {
    const { doc, S } = plays.union, teams = doc.players.map(p => p.team);
    ok(teams.filter(t => t === teams[0]).length === 2 && new Set(teams).size === 2, 'Союз: two alliances of two');
    ok(S.players.every(p => S.players.filter(q => Adv25.allied(S, p.id, q.id)).length === 1), 'Союз: everybody has exactly one ally');
  }

  {
    const heroOf = (id, owner, c, r, unit) => {
      const rec = H.HEROES.find(x => x.id === id);
      return { owner, hid: id, name: rec.name, cls: rec.cls, faction: H.CLASSES[rec.cls].faction, c, r, army: [{ unit, count: 20 }] };
    };
    const M = MD25.create(40, 40, ['meadow']);
    M.scenes = '';
    M.events = [];
    const S = Adv25.create(M, { seed: 3, moons: null, goals: { win: [{ kind: 'flag', flag: 'n_never', text: 'Дальше' }], lose: [] }, players: [{ name: 'А', color: 0, faction: 'league', human: true, team: 1 }, { name: 'Б', color: 1, faction: 'barrows', human: true, team: 1 }, { name: 'В', color: 2, faction: 'league', human: false, team: 2 }, { name: 'Г', color: 3, faction: 'tide', human: false, team: 2 }], heroes: [heroOf('renier', 0, 4, 4, 'militia'), heroOf('timar', 1, 34, 34, 'shade'), heroOf('ortwin', 2, 4, 34, 'militia'), heroOf('luar', 3, 34, 4, 'shellman')] });
    const seen = (pid, c, r) => S.players[pid].seen[0][MD25.idx(M, c, r)] === 1;
    ok(seen(0, 34, 34) && seen(1, 4, 4), 'allies at one PC see what the other one has explored');
    ok(!seen(2, 34, 4) && !seen(3, 4, 34), 'AI allies explore by themselves');
    ok(Adv25.visible(S, 0, 0)[MD25.idx(M, 34, 34)] === 1 && !Adv25.visible(S, 2, 0, true)[MD25.idx(M, 34, 4)], 'a human sees through the eyes of allies, the AI only through its own');
    const p = Adv25.path(S, S.heroes[0], 34, 34);
    ok(!!p && p.kind === 'meet' && p.target === 1, 'a click on an allied hero leads to a meeting');
    ok(!Adv25.engage(S, S.heroes[0], 1, 'meet').length && !S.pending, 'a meeting starts no battle');
    S.heroes[1].c = 5;
    S.heroes[1].r = 5;
    S.heroes[2].c = 6;
    S.heroes[2].r = 5;
    const fight = Adv25.engage(S, S.heroes[1], 2, 'duel');
    ok(fight.some(e => e.t === 'pending') && S.pending.kind === 'duel', 'an allied human can still attack an enemy');
    const setup = Adv25.battleSetup(S);
    ok(setup.humans.join() === '0' && setup.colors.join() === '1,2', 'a battle knows which sides humans lead and their colours');
    S.players[2].human = true;
    S.pending = { kind: 'duel', hero: 1, enemy: 2, from: [5, 5] };
    ok(Adv25.battleSetup(S).humans.join() === '0,1', 'two humans at one PC lead both sides of a battle');
  }
  {
    const def = H.Maps.play(H.Maps.docOf(H.Maps.LIST.find(m => m.id === 'ford')), { seed: 4, slots: [{ faction: 'league', human: true, team: 3 }, { faction: 'barrows', human: true, team: 4 }] });
    ok(def.setup.players.map(p => p.team).join() === '3,4' && def.setup.players.every(p => p.human), 'the setup screen gives teams and two humans to the game');
  }
  {
    const src = read(`${DIR}/he-ui-map.js`), ui = read(`${DIR}/he-ui-modes.js`), menu = read(`${DIR}/he-ui-menu.js`), battle = read(`${DIR}/he-ui-battle.js`), hero = read(`${DIR}/he-ui-hero.js`);
    ok(/hotSeat\(\)/.test(src) && /takeSeat\(pid\)/.test(src) && /new H\.PassView/.test(src) && /goalOf\[this\.pid\]/.test(src), 'the map hands the turn over with a pass screen and keeps each player\'s plans');
    ok(/class PassView/.test(ui) && /'Ходит ' \+ H\.PLAYER_NAMES/.test(ui) && /'Начать ход'/.test(ui), 'the pass screen names the player and starts the turn');
    ok(/this\.humans\.includes\(s\.side\)/.test(battle) && /this\.deployed/.test(battle) && /doneLabel/.test(battle), 'a battle switches between two humans and deploys both');
    ok(/allied: true/.test(src) && /this\.allied/.test(hero) && /locked\(h\)/.test(hero), 'allies meet to swap troops, an AI ally gives none of its own');
    ok(/'Союз'/.test(menu) && /nextWho/.test(menu) && /oneTeam/.test(menu) && /sharedTeams/.test(menu) && /MAP_PLAYERS/.test(menu), 'the setup screen has alliances, several humans and map filters');
    ok(/new H\.DuelView/.test(menu) && /new H\.FameView/.test(menu) && !/Появится позже/.test(menu), 'the title opens the duel and the Hall of Fame');
    ok(/H\.Fame\.add/.test(menu) && /F7\/F8/.test(menu) && /Место в Зале славы/.test(menu), 'a won game goes to the Hall of Fame unless debug keys were used');
    ok(/class DuelView/.test(ui) && /class FameView/.test(ui) && /D\.battle\(/.test(ui), 'the duel and the Hall of Fame screens');
  }
  {
    ok(D.HEROES.length === 12 && new Set(D.HEROES.map(d => d.hid)).size === 12, 'twelve duel heroes');
    const by = {};
    for (const d of D.HEROES) by[D.factionOf(d)] = (by[D.factionOf(d)] || 0) + 1;
    ok(Object.keys(by).length === 6 && Object.values(by).every(n => n === 2), 'two duel heroes for each people of the release');
    for (const d of D.HEROES) {
      const h = D.heroOf(d), mage = H.CLASSES[h.cls].mage;
      ok(h.level === D.LEVEL && h.army.length === 7 && h.army.every(s => s && s.count > 0) && Object.values(h.arts).filter(Boolean).length === 5 && h.spells.length >= (mage ? 15 : 5), d.hid + ': level 20, seven stacks, five items and spells');
      ok(d.scale > 0.4 && d.scale < 1.8 && h.army.every((s, i) => H.FACTIONS[D.factionOf(d)].units[i].includes(s.unit)), d.hid + ': the army follows its people and branch');
    }
    const one = D.battle(D.HEROES[0], D.HEROES[3], { seed: 9, field: 'moonglade', moon: 'gold' });
    ok(one.B.field === 'moonglade' && one.B.moon.id === 'gold' && one.B.sides.every(sd => sd.hero && sd.hero.level === 20), 'a duel battle takes its field and moon');
    H.BattleAI.play(one.B, 100);
    ok(one.B.winner >= 0 && one.B.round < 60, 'a duel ends in a few dozen rounds (' + one.B.round + ')');
    ok(JSON.stringify(D.battle(D.HEROES[0], D.HEROES[3], { seed: 9 }).B.sides) === JSON.stringify(D.battle(D.HEROES[0], D.HEROES[3], { seed: 9 }).B.sides), 'duel heroes are built the same every time');
  }
  {
    ok(F25.RANKS.length === 12 && F25.RANKS[0][1] === 'Ополченец' && F25.RANKS[11][1] === 'Лунный царь' && F25.RANKS.every((r, i) => !i || r[0] > F25.RANKS[i - 1][0]), 'twelve ranks from Ополченец to Лунный царь');
    ok(F25.rankOf(0) === 'Ополченец' && F25.rankOf(5000) === 'Лунный царь', 'a score gives a rank');
    F25.clear();
    const row25 = score => ({ score, days: 30, map: 'Брод у мельницы', faction: 'league', difficulty: 'normal', rank: F25.rankOf(score) });
    const places = [300, 900, 100, 1200, 50, 700, 800, 400, 600, 500, 200, 1000].map(score => F25.add(row25(score)));
    const rows = F25.list();
    ok(rows.length === 10 && rows.every((r, i) => !i || r.score <= rows[i - 1].score) && rows[0].score === 1200 && rows[9].score === 200, 'the Hall of Fame keeps the ten best wins in order');
    ok(places[3] === 1 && places[11] === 2 && F25.add(row25(10)) === 0, 'the best win goes first, a weak one does not get in');
    const S = plays.salt.S;
    S.day = 30;
    const row = F25.entryOf(S, 0);
    ok(row.score === Adv25.score(S) && row.rank === F25.rankOf(row.score) && row.map === S.mapName && row.days === 30, 'a Hall of Fame row comes from the game');
    F25.clear();
    ok(!F25.list().length, 'the Hall of Fame can be cleared');
  }
  {
    const src = read('tools/heroes98-bot.cjs');
    ok(/duelmode\(\)/.test(src) && RELEASE.filter(id => id !== 'ford' && id !== 'chasha').every(id => new RegExp('\\b' + id + ': \\[').test(src)), 'the bot knows the duel heroes and every new scenario');
    ok(/march: 2/.test(read(`${DIR}/he-script.js`)) && Sc.check('@a\nmarch horde home x\nend\n', [], new Set()).length === 1 && Sc.check('@a\nterrain lava 1 1 2 2 0 sky\nend\n', [], new Set()).length === 1, 'the scene check knows march and the terrain filter');
  }
}
console.log('heroes98: ' + checks + ' checks passed');
})().catch(e => {
  console.error(e);
  process.exit(1);
});
