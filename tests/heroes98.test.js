const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = 'js/apps/heroes98';
const ORDER = ['he-core', 'he-data', 'he-units', 'he-factions', 'he-skills', 'he-heroes', 'he-artifacts', 'he-spells', 'he-moons', 'he-battle', 'he-battle-ai', 'he-map', 'he-path', 'he-objects', 'he-hero', 'he-town', 'he-adventure', 'he-ai', 'he-save', 'he-maps', 'he-font', 'he-art', 'he-files', 'he-audio', 'he-gfx', 'he-draw-battle', 'he-draw-map', 'he-draw-town', 'he-ui-battle', 'he-ui-map', 'he-ui-hero', 'he-ui-town', 'he-ui-menu', 'he-ui'];
const NODE = ['he-core', 'he-data', 'he-units', 'he-factions', 'he-skills', 'he-heroes', 'he-artifacts', 'he-spells', 'he-moons', 'he-battle', 'he-battle-ai', 'he-map', 'he-path', 'he-objects', 'he-hero', 'he-town', 'he-adventure', 'he-ai', 'he-save', 'he-maps', 'he-font', 'he-art', 'he-files', 'he-audio'];
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
  for (const f of [...game, 'tools/heroes98-shots.cjs', 'tools/heroes98-bot.cjs', 'tests/heroes98.test.js']) {
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
        ok(k >= 1.3 && k <= 1.4 && p >= 1.1 && p <= 1.3, id + ' costs 30–40 % more than ' + base + ' and is 10–30 % stronger (' + k.toFixed(2) + ', ' + p.toFixed(2) + ')');
        ok(x.growth === u.growth && JSON.stringify(x.rare || {}) === JSON.stringify(u.rare || {}), id + ' keeps the growth and the rare price of ' + base);
      }
    }
  }
  const people = Object.values(H.UNITS).filter(u => u.faction !== 'neutral' && u.faction !== 'summon');
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
  ok(near.stacks[0].shots === 9 && kinds(ev, 'shot').length === 1 && kinds(ev, 'retal').length === 0, 'a shot spends one bolt and gets no answer');
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
  ok(B.stacks[0].c === 2 && B.stacks[0].shots === 7 && kinds(ev, 'saddle').length === 1, 'С седла moves and shoots in one turn');
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
  ok(units.filter(u => !u.addon && u.faction !== 'neutral' && u.faction !== 'summon').length === 126, '126 creatures of the six release peoples');
  ok(units.every(u => u.look && A.PALETTES[u.faction] && (!u.branch || A.UNITS[u.base].tier === u.tier)), 'every creature has a look, a palette and a base of its tier');
  ok(A.creatures().every(e => e.size === A.FRAME[A.sizeOf(A.UNITS[e.unit])] && e.anchor), 'creature frame follows the size rule');
  for (const [id, u] of Object.entries(H.UNITS)) {
    const a = A.UNITS[id];
    ok(!!a && a.name === u.name && a.tier === u.tier && a.faction === u.faction && !!a.fly === !!u.fly && !!a.big === !!u.big && a.shoot === !!u.shots, 'battle unit ' + id + ' matches its picture entry');
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
  ok(H.TERRAIN.length === 14 && H.TERRAIN.every(tr => H.Art.TERRAINS.some(a => a.id === 'terrain/' + tr.id)), '14 terrains, each with a picture entry');
  ok(['water', 'lava', 'rock'].every(id => H.TERRAIN[H.TERRAIN_INDEX[id]].cost === 0), 'water, lava and rock are impassable');
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
    const ids = f.buildings.map(b => b.id);
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
    ok(done.size === ids.length, fid + ': the tree has no loops and every building can be reached');
    const scene = A.TOWNS.find(t => t.faction === fid);
    ok([1, 2, 3, 4].every(i => f.building['special' + i].name === scene.layers.find(l => l[0] === 'special' + i)[1]), fid + ': special buildings match the town scene layers');
    ok([1, 2, 3, 4, 5, 6, 7].every(t => f.building['dwell' + t].dwelling === t && f.building['dwell' + t + 'u'].upgrade === t && f.building['dwell' + t + 'u'].needs.includes('dwell' + t)), fid + ': seven dwellings, each with its upgrade');
    ok(f.units.every((row, i) => row.every((id, k) => A.UNITS[id].tier === i + 1 && A.UNITS[id].base === row[0] && A.UNITS[id].branch === ['', 'a', 'b'][k])), fid + ': tier rows match the branches in the picture list');
    const heroes = H.HEROES.filter(x => H.CLASSES[x.cls].faction === fid), classes = Object.keys(H.CLASSES).filter(c => H.CLASSES[c].faction === fid);
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
  ok(res.gold === 1500 - 1050 - 400 - 29 && o.pool.slice(0, 3).join() === '17,5,0', 'recruit all pays and takes from the pools');
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
  ok(arts.length === 20 && ['head', 'neck', 'shoulders', 'body', 'right', 'left', 'ring', 'legs', 'charm'].every(s => kinds.has(s)), '20 trial artifacts on every kind of place');
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
  ok(H.Maps.LIST.map(m => m.size).join() === 'малая,средняя', 'two trial maps: small and medium');
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
  console.log('heroes98: ' + checks + ' checks passed');
})().catch(e => {
  console.error(e);
  process.exit(1);
});
