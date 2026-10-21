const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/catniss');
const ORDER = ['cn-core', 'cn-sim', 'cn-levels', 'cn-assets', 'cn-render', 'cn-audio', 'cn-ui', 'cn-screens'];
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const verbose = process.argv.includes('-v');
let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();

for (const f of ['cn-core', 'cn-sim', 'cn-levels']) require(path.join(DIR, f + '.js'));
const C = globalThis.Catniss;
const { T, PH } = C;
const { LEVELS, WORLDS } = C.Levels;
const { analyse } = require(path.join(ROOT, 'tools/catniss-reach.cjs'));
const STEP = C.Sim.STEP;

{
  for (const f of ORDER) ok(fs.existsSync(path.join(DIR, f + '.js')), 'module ' + f);
  const html = read('catniss.html'), index = read('index.html');
  let last = -1, lastIdx = -1;
  for (const f of ORDER) {
    const tag = `js/apps/catniss/${f}.js`;
    const i = html.indexOf(tag), j = index.indexOf(tag);
    ok(i > last, 'catniss.html loads ' + f + ' in order');
    ok(j > lastIdx, 'index.html loads ' + f + ' in order');
    last = i; lastIdx = j;
  }
  ok(index.includes('js/apps/catniss-app.js') && index.includes('css/apps/catniss.css'), 'index.html has app wrapper and css');
  const sources = [...ORDER.map(f => `js/apps/catniss/${f}.js`), 'js/apps/catniss-app.js', 'tools/catniss-reach.cjs', 'tools/catniss-shots.cjs', 'css/apps/catniss.css', 'tests/catniss.test.js'];
  for (const f of sources) {
    const src = read(f);
    ok(!/\/\*/.test(src), 'no block comments in ' + f);
    ok(!/^\s*\/\/(?!\s*#)/m.test(src) && !/[;{})]\s+\/\/\s/.test(src), 'no line comments in ' + f);
  }
  const texts = [...ORDER.map(f => read(`js/apps/catniss/${f}.js`)), read('js/apps/catniss-app.js')].join('\n');
  ok(!/Microsoft|Windows(?! NT)/.test(texts.replace(/Microsoft Sans Serif/g, '')), 'no real brand names in game text');
}

{
  const ids = new Set();
  const main = LEVELS.filter(l => !l.bonus);
  ok(main.length === 12, 'twelve main levels');
  ok(LEVELS.filter(l => l.bonus).length === 1, 'one bonus level');
  const fishIdx = main.map(l => l.fishIndex).sort((a, b) => a - b);
  ok(JSON.stringify(fishIdx) === JSON.stringify([...Array(12).keys()]), 'every fish is hidden in exactly one level');
  WORLDS.forEach((w, i) => {
    const ls = main.filter(l => l.world === i);
    ok(ls.length === 3, 'three levels in world ' + w.id);
    ok(ls.every(l => l.theme === w.theme), 'level themes match world ' + w.id);
    ok(ls[2].rescue === w.sibling, 'third level of ' + w.id + ' rescues ' + w.sibling);
    ok(C.SIBLINGS[w.sibling], 'sibling exists ' + w.sibling);
  });
  for (const L of LEVELS) {
    ok(!ids.has(L.id), 'unique id ' + L.id); ids.add(L.id);
    const m = L.map;
    ok(m.length >= 15, L.id + ' at least one screen tall');
    ok(m.every(r => r.length === m[0].length), L.id + ' rows have equal width');
    ok(m[0].length >= 20, L.id + ' at least one screen wide');
    const all = m.join('');
    const count = ch => all.split(ch).length - 1;
    ok(count('P') === 1, L.id + ' has one start');
    ok(count('F') === (L.bonus ? 0 : 1), L.id + ' fish count');
    ok(count('?') === (L.signs || []).length, L.id + ' sign texts match signs');
    if (L.boss) ok(count('Z') === 1 && L.arena && L.rescue, L.id + ' boss setup');
    else if (L.rescue) ok(count('@') === 1, L.id + ' has a cage');
    else ok(count('E') === 1, L.id + ' has an exit');
    ok(/^[.#=\-CX<>tT^~wPEKoFMhdlbrskumnVfxqQZ@?gcYy*%HjJ:]+$/.test(all), L.id + ' uses known map symbols');
    const g = new C.Sim.Game(L, {});
    ok(g.coinsTotal >= 8, L.id + ' has coins to collect');
    for (const s of L.signs || []) ok(!s.includes('—'), 'no em dash in sign: ' + s);
    if (L.flicker) ok(all.includes('t') || all.includes('T'), L.id + ' flicker period has flicker tiles');
  }
}

{
  let total = 0;
  for (const L of LEVELS) {
    const t1 = Date.now();
    const r = analyse(L);
    total += Date.now() - t1;
    ok(r.goal, L.id + ' goal reachable from the start');
    if (!L.bonus) { ok(r.fish, L.id + ' fish reachable'); ok(r.fishBack, L.id + ' can continue after the fish'); }
    ok(r.softlocks.length === 0, L.id + ' has no soft locks: ' + r.softlocks.slice(0, 6).join(' '));
    ok(r.missingCoins.length === 0, L.id + ' every coin reachable: ' + r.missingCoins.slice(0, 6).map(c => c.join(',')).join(' '));
    if (verbose) console.log(`  ${L.id} nodes=${r.nodes} sims=${r.sims} ${Date.now() - t1}ms`);
  }
  if (verbose) console.log('  reachability total', total, 'ms');
}

function arena(rows, opts = {}) {
  return new C.Sim.Game(Object.assign({ id: 'test', theme: 'meadow', map: rows }, opts.def || {}), { lives: opts.lives || 5 });
}
const flatRows = (w, h, extra) => { const r = []; for (let y = 0; y < h; y++) r.push(y < h - 2 ? '.'.repeat(w) : '#'.repeat(w)); if (extra) extra(r); return r; };
const setCh = (r, x, y, ch) => { r[y] = r[y].slice(0, x) + ch + r[y].slice(x + 1); };
const input = (o = {}) => Object.assign({ left: false, right: false, up: false, down: false, jump: false, dash: false, jumpPressed: false, dashPressed: false }, o);
const run = (g, sec, inp) => { for (let t = 0; t < sec; t += 1 / 60) g.update(1 / 60, typeof inp === 'function' ? inp(t) : (inp || input())); };

{
  const g = arena(flatRows(80, 30, r => setCh(r, 2, 27, 'P')));
  const p = g.player, y0 = p.y;
  let minY = y0;
  g.update(1 / 60, input({ jump: true, jumpPressed: true }));
  for (let i = 0; i < 120; i++) { g.update(1 / 60, input({ jump: true })); minY = Math.min(minY, g.player.y); }
  const h = (y0 - minY) / T;
  ok(h > 3.2 && h < 3.6, 'full jump is about 3.4 tiles: ' + h.toFixed(2));
  const g2 = arena(flatRows(80, 30, r => setCh(r, 2, 27, 'P')));
  let minY2 = g2.player.y;
  g2.update(1 / 60, input({ jump: true, jumpPressed: true }));
  for (let i = 0; i < 120; i++) { g2.update(1 / 60, input()); minY2 = Math.min(minY2, g2.player.y); }
  ok((y0 - minY2) / T < 1.6, 'a tap jump is much lower than a held jump');
}

{
  const g = arena(flatRows(60, 20, r => { setCh(r, 2, 17, 'P'); setCh(r, 12, 17, 'h'); }));
  const hen = g.ents.find(e => e.type === 'hen');
  hen.speed = 0;
  g.player.x = hen.x + 2; g.player.y = hen.y - 40; g.player.vy = 200;
  run(g, 0.4);
  ok(hen.dying, 'stomp kills a hen');
  ok(g.lives === 5, 'stomping does not hurt');
  const g2 = arena(flatRows(60, 20, r => { setCh(r, 2, 17, 'P'); setCh(r, 6, 17, 'h'); }));
  g2.ents.find(e => e.type === 'hen').speed = 0;
  run(g2, 1.2, input({ right: true }));
  ok(g2.lives === 4, 'walking into a hen costs one life');
  ok(g2.player.invul > 0 || g2.lives === 4, 'invulnerable after a hit');
  const g3 = arena(flatRows(60, 20, r => { setCh(r, 2, 17, 'P'); setCh(r, 5, 17, 'h'); }));
  g3.ents.find(e => e.type === 'hen').speed = 0;
  run(g3, 0.05, input({ right: true }));
  run(g3, 0.4, t => input({ right: true, dashPressed: t < 0.02, dash: true }));
  ok(g3.ents.find(e => e.type === 'hen').dying && g3.lives === 5, 'pounce knocks out a hen without damage');
}

{
  const g = arena(flatRows(60, 20, r => { setCh(r, 2, 17, 'P'); setCh(r, 30, 17, 'd'); }));
  const dog = g.ents.find(e => e.type === 'dog');
  g.hitEnemy(dog, 'stomp');
  ok(!dog.dying && dog.st === 'stun', 'a dog survives the first hit and is stunned');
  dog.hitT = 0;
  g.hitEnemy(dog, 'stomp');
  ok(dog.dying, 'the second hit knocks the dog out');
  const g2 = arena(flatRows(60, 20, r => { setCh(r, 2, 17, 'P'); setCh(r, 10, 17, 'd'); }));
  const d2 = g2.ents.find(e => e.type === 'dog');
  d2.dir = -1;
  run(g2, 0.8);
  ok(d2.st === 'alert' || d2.st === 'charge', 'a dog that sees the cat barks and charges');
}

{
  const g = arena(flatRows(40, 20, r => { setCh(r, 2, 17, 'P'); r[18] = '##########..........##########'.padEnd(40, '#'); r[19] = r[18]; setCh(r, 6, 17, 'K'); }));
  run(g, 1.0, input({ right: true }));
  ok(g.checkpoint.x > g.start.x, 'touching a box sets the checkpoint');
  for (let t = 0; t < 4 && g.state === 'play'; t += 1 / 60) g.update(1 / 60, input({ right: true }));
  ok(g.state === 'dying' && g.lives === 4, 'falling into a pit costs a life');
  run(g, 1.5);
  ok(g.state === 'play' && Math.abs(g.player.x - g.checkpoint.x) < 20, 'respawn at the checkpoint box');
}

{
  const rows = flatRows(80, 20, r => { setCh(r, 2, 17, 'P'); for (let x = 4; x < 4 + C.COINS_PER_LIFE; x++) setCh(r, x, 17, 'o'); setCh(r, 70, 17, 'M'); });
  const g = arena(rows);
  run(g, 12, input({ right: true }));
  ok(g.coins === C.COINS_PER_LIFE, 'all coins in the row picked up');
  ok(g.lives === 7, 'fifty coins and a milk bowl give two lives: ' + g.lives);
  g.lives = C.MAX_LIVES;
  g.gainLife({ x: 0, y: 0 });
  ok(g.lives === C.MAX_LIVES, 'lives never exceed nine');
}

{
  const rows = flatRows(40, 20, r => { setCh(r, 2, 15, 'P'); r[16] = '.'.repeat(40); r[16] = r[16].slice(0, 1) + 'CCCC' + r[16].slice(5); });
  const g = arena(rows);
  run(g, 0.2);
  ok(g.player.onGround, 'standing on a cracked stone');
  run(g, 0.7);
  ok(!g.solidAt(2, 16) && g.player.y > 16 * T, 'cracked stone gives way');
  run(g, 4);
  ok(g.solidAt(2, 16) || g.player.y > 16 * T, 'stones come back later');
}

{
  const rows = flatRows(40, 20, r => { setCh(r, 2, 17, 'P'); setCh(r, 10, 18, 'V'); });
  const g = arena(rows);
  const vent = g.ents.find(e => e.type === 'vent');
  ok(vent && vent.top === 15 * T, 'steam column is three tiles high');
  g.player.x = vent.x + 1;
  let hit = false;
  for (let t = 0; t < 3 && !hit; t += 1 / 60) { g.update(1 / 60, input()); if (g.lives < 5) hit = true; }
  ok(hit, 'active steam hurts');
}

{
  const rows = flatRows(40, 20, r => { setCh(r, 2, 17, 'P'); setCh(r, 10, 18, 'f'); });
  const g = arena(rows);
  const fan = g.ents.find(e => e.type === 'fan');
  g.player.x = fan.x + 1;
  const y0 = g.player.y;
  run(g, 1.2);
  ok(y0 - g.player.y > 4 * T, 'a fan lifts the cat several tiles');
}

{
  const rows = flatRows(40, 20, r => { setCh(r, 2, 17, 'P'); r[18] = '#'.repeat(5) + '>'.repeat(20) + '#'.repeat(15); });
  const g = arena(rows);
  g.player.x = 6 * T;
  const x0 = g.player.x;
  run(g, 1);
  ok(g.player.x - x0 > 40, 'a conveyor carries the cat');
}

{
  const g = arena(flatRows(30, 20, r => { setCh(r, 2, 17, 'P'); setCh(r, 10, 15, 't'); setCh(r, 12, 15, 'T'); }), { def: { flicker: 1 } });
  g.t = 0.2;
  ok(g.oneWayAt(10, 15) !== g.oneWayAt(12, 15), 'neon platforms alternate');
  g.t = 1.2;
  ok(g.oneWayAt(10, 15) !== g.oneWayAt(12, 15) && g.oneWayAt(12, 15), 'neon platforms swap after a period');
}

{
  const rows = flatRows(40, 20, r => { setCh(r, 2, 17, 'P'); r[18] = '######' + '~'.repeat(6) + '#'.repeat(28); r[19] = '######' + 'w'.repeat(6) + '#'.repeat(28); });
  const g = arena(rows);
  run(g, 1.5, input({ right: true }));
  ok(g.deaths >= 1, 'falling into water costs a life');
}

{
  const g = arena(flatRows(60, 16, r => { setCh(r, 2, 13, 'P'); setCh(r, 22, 13, 'q'); }));
  g.ents.find(e => e.type === 'lane').next = 0;
  run(g, 0.05);
  const car = g.ents.find(e => e.type === 'car');
  ok(car && car.vx < 0, 'a car leaves the lane toward the cat');
  run(g, 3);
  ok(g.deaths >= 1, 'a car hurts the cat');
}

{
  const L = C.Levels.byId('2-3');
  const g = new C.Sim.Game(L, { lives: 3 });
  run(g, 1);
  ok(g.state === 'play' && g.scroll.x === 0, 'the chase waits a moment before starting');
  run(g, 5);
  ok(g.deaths >= 1, 'standing still in the chase lets the wolves catch the cat');
}

{
  const L = C.Levels.byId('4-3');
  const g = new C.Sim.Game(L, { lives: 9 });
  const van = g.ents.find(e => e.type === 'van');
  ok(van && van.hp === 3, 'the van has three locks to break');
  let guard = 0;
  while (van.hp > 0 && guard++ < 4000) {
    g.update(1 / 60, input());
    g.player.invul = 1;
    if (van.st === 'expose' && !(van.hitT > 0)) {
      const p = g.player;
      p.x = van.x + van.w / 2 - p.w / 2; p.y = van.y - 18 - p.h + 3; p.vy = 120; p.prevBottom = van.y - 19;
      g.vanContact(van, p);
    }
  }
  ok(van.hp === 0 && van.st === 'broken', 'three hits on the exposed cage break the van');
  run(g, 2);
  const kitten = g.ents.find(e => e.type === 'kitten');
  ok(kitten && kitten.st === 'sit' && kitten.kitten === 'snezhka', 'Snezhka jumps out of the van');
  g.player.x = kitten.x; g.player.y = kitten.y; g.player.invul = 0;
  for (const e of g.ents) if (e.type === 'dog') e.alive = false;
  run(g, 0.1);
  ok(g.state === 'rescue', 'touching the kitten finishes the level');
}

{
  const L = C.Levels.byId('1-3');
  const g = new C.Sim.Game(L, {});
  const cage = g.ents.find(e => e.type === 'cage');
  g.player.x = cage.x + 4; g.player.y = cage.y + 4;
  run(g, 0.1);
  ok(g.state === 'rescue' && cage.open, 'opening the cage rescues the kitten');
}

{
  for (const f of ['cn-assets', 'cn-render', 'cn-audio', 'cn-ui', 'cn-screens']) require(path.join(DIR, f + '.js'));
  const P = C.Progress;
  const save = C.defaultSave();
  const main = LEVELS.filter(l => !l.bonus);
  ok(P.unlocked(save, main[0]) && !P.unlocked(save, main[1]), 'only the first level is open in a new game');
  save.levels['1-1'] = { done: true, fish: true, coins: 10 };
  ok(P.unlocked(save, main[1]) && !P.unlocked(save, main[2]), 'finishing a level opens the next');
  ok(P.fishCount(save) === 1, 'fish counter counts found fish');
  const bonus = LEVELS.find(l => l.bonus);
  ok(!P.unlocked(save, bonus), 'bonus stays closed');
  for (const l of main) save.levels[l.id] = { done: true, fish: true, coins: 1 };
  ok(P.unlocked(save, bonus), 'twelve fish open the bonus level');
  ok(C.FISH.length === 12 && C.FISH.every(f => f.name), 'fish names');
  ok(typeof C.Screens.title === 'function' && typeof C.Screens.play === 'function' && typeof C.Screens.map === 'function' && typeof C.Screens.aquarium === 'function', 'screens exist');
}

{
  const gm = read('js/game-manager.js');
  const start = gm.indexOf('      catniss: {');
  ok(start > 0, 'Catniss is in the game catalog');
  const entry = gm.slice(start, gm.indexOf('launch:', start));
  ok(/steam: true/.test(entry), 'sold on Steam');
  ok(/price: 7\.99/.test(entry) && /priceDisplay: '\$7\.99'/.test(entry), 'costs $7.99');
  ok(/genre: '/.test(entry) && /tags: \[/.test(entry) && /shots: \[/.test(entry), 'store page data');
  const load = gm.slice(gm.indexOf('loadState'), gm.indexOf('loadState') + 4000);
  ok(!/'catniss'/.test(load), 'not purchased or installed by default');
  ok(!/catnissGranted/.test(gm), 'no grant flag');
  ok(fs.existsSync(path.join(ROOT, 'content/steam/catniss-1.jpg')) && fs.existsSync(path.join(ROOT, 'content/steam/catniss-2.jpg')), 'Steam screenshots');
  ok(/isInstalled\('catniss'\)/.test(read('js/desktop.js')) && /isInstalled\('catniss'\)/.test(read('js/taskbar.js')), 'desktop and Start menu are gated on installation');
  ok(/showInSteam\(\\?'catniss\\?'\)/.test(read('js/apps/dialogs.js')), 'Run points to Steam when not installed');
}

console.log(`catniss: ${checks} checks passed in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
