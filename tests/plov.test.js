const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/plov');
const ORDER = ['pl-core', 'pl-data', 'pl-sim', 'pl-ornament', 'pl-art', 'pl-icons', 'pl-scene', 'pl-audio', 'pl-ui', 'pl-ui-game', 'pl-ui-menu'];
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();

let P;
for (const f of ['pl-core', 'pl-data', 'pl-sim']) P = require(path.join(DIR, f + '.js'));
const { LEVELS, ITEMS, FOOD, TYPES, STATIONS, TABLES, UPGRADES, TUTORIAL, TEXT, TUNE, QUEUE } = P;

const TYPICAL = [{}, { boots: 1, pchak: 1 }, { boots: 1, pchak: 1, kazan: 1, saxaul: 1 }, { boots: 1, pchak: 1, kazan: 1, saxaul: 1, samovar: 1, radio: 1 }];
function typical(n) {
  if (n <= 4) return TYPICAL[n - 1];
  if (n <= 6) return { boots: 2, pchak: 1, kazan: 1, saxaul: 1, samovar: 1, radio: 1, kurpacha: 1, tandoor: 1 };
  return { boots: 2, pchak: 2, kazan: 2, saxaul: 1, samovar: 1, radio: 1, kurpacha: 1, tandoor: 1, sign: 1 };
}

{
  ok(LEVELS.length === 10, 'ten days');
  const allItems = new Set();
  let prevItems = new Set();
  LEVELS.forEach((L, i) => {
    ok(L.n === i + 1, 'day numbers are sequential');
    ok(L.title && L.story && L.news, 'day ' + L.n + ' has texts');
    const waveGroups = L.waves.reduce((s, w) => s + w[1], 0);
    ok(waveGroups === L.groups, `day ${L.n} waves sum ${waveGroups} equals groups ${L.groups}`);
    ok(L.items.every(it => ITEMS[it] && FOOD.includes(it)), 'day items exist');
    ok(L.tables.every(t => TABLES.some(x => x.id === t)), 'day tables exist');
    ok(Object.keys(L.mix).every(t => TYPES[t]), 'mix types exist');
    ok((L.special || []).every(s => TYPES[s.type]), 'special types exist');
    ok(L.target > 0 && L.target < L.expert, 'target below expert');
    ok(!!L.tutorial === (L.n === 1), 'tutorial only on day 1');
    for (const it of prevItems) ok(L.items.includes(it), `day ${L.n} keeps ${it}`);
    prevItems = new Set(L.items);
    L.items.forEach(it => allItems.add(it));
    for (const tip of L.tips || []) ok(TEXT.tips[tip.id], 'tip text ' + tip.id);
    ok(L.tables.some(t => TABLES.find(x => x.id === t).kind === 'topchan') || L.sizeMax <= 2, 'big groups have a topchan');
  });
  ok(FOOD.every(it => allItems.has(it)), 'every dish appears in some day');
  for (const s of TUTORIAL) ok(TEXT.tut[s.id], 'tutorial text ' + s.id);
  for (const u of UPGRADES) {
    ok(u.costs.length === u.levels.length && u.costs.length >= 1, 'upgrade levels ' + u.id);
    ok(u.costs.every((c, i) => i === 0 || c > u.costs[i - 1]), 'upgrade costs rise ' + u.id);
    ok(u.from >= 1 && u.from <= 10, 'upgrade unlock day ' + u.id);
  }
  for (const t of Object.keys(TYPES)) ok(TEXT.guests[t], 'guest note ' + t);
  const texts = [...Object.values(TEXT.tut), ...Object.values(TEXT.tips), ...Object.values(TEXT.guests), ...Object.values(TEXT.lines).flat(), ...LEVELS.map(L => L.story)];
  for (const s of texts) ok(!s.includes('—'), 'no em dash in game text: ' + s.slice(0, 40));
  const heroForms = /Хаято (сам|сама|готов|готова|успел|успела|сделал|сделала)\b|самому|самой/;
  for (const s of texts) ok(!heroForms.test(s), 'gender-neutral text about Hayato: ' + s.slice(0, 50));
}

{
  const g = new P.Game({ level: LEVELS[9], seed: 3 });
  const grid = g.grid;
  for (const s of g.stations) ok(grid.free(s.use.x, s.use.y), 'station use spot is walkable: ' + s.id);
  for (const t of g.tables) {
    ok(grid.free(t.use.x, t.use.y), 'table use spot is walkable: ' + t.id);
    for (const s of t.seats) {
      const p = grid.path(-10, 508, s.x, s.y + 14);
      ok(p.length > 0, 'seat reachable ' + t.id);
    }
  }
  for (const q of QUEUE) ok(grid.free(q.x, q.y), 'queue slot walkable');
  for (const s of g.stations) {
    const p = grid.path(g.hero.x, g.hero.y, s.use.x, s.use.y);
    const last = p[p.length - 1];
    ok(Math.hypot(last.x - s.use.x, last.y - s.use.y) < 1, 'hero reaches ' + s.id);
    let x = g.hero.x, y = g.hero.y;
    for (const pt of p) { ok(grid.los(x, y, pt.x, pt.y), 'path segment is clear to ' + s.id); x = pt.x; y = pt.y; }
  }
  const ids = new Set(STATIONS.map(s => s.id));
  ok(ids.size === STATIONS.length, 'unique station ids');
  for (let i = 0; i < STATIONS.length - 1; i++) ok(STATIONS[i].x + STATIONS[i].w <= STATIONS[i + 1].x, 'stations do not overlap: ' + STATIONS[i].id);
}

function run(g, sec) { const n = Math.round(sec * 60); for (let i = 0; i < n; i++) { g.update(1 / 60); g.drain(); } }
function doAct(g, id) {
  ok(g.click(id), 'queued ' + id);
  let n = 0;
  while ((g.hero.cur || g.hero.busy || g.hero.queue.length) && n < 1200) { g.update(1 / 60); n++; }
  return g.drain();
}

{
  const g = new P.Game({ level: LEVELS[4], seed: 11, noTips: true });
  const kz = g.st.kazan;
  kz.state = 'empty'; kz.portions = 0;
  doAct(g, 'kazan');
  ok(kz.state === 'fry', 'kazan starts frying');
  run(g, TUNE.kazan.fry + 0.1);
  ok(kz.state === 'needVeg', 'kazan wants carrots');
  const ev = doAct(g, 'kazan');
  ok(ev.some(e => e.t === 'nope' && e.text === TEXT.nope.needVeg), 'kazan refuses without carrots');
  doAct(g, 'prepVeg');
  ok(g.hero.hands.includes('veg'), 'carrots chopped');
  doAct(g, 'kazan');
  ok(kz.state === 'zirvak' && !g.hero.hands.includes('veg'), 'carrots go into the kazan');
  run(g, TUNE.kazan.zirvak + 0.1);
  ok(kz.state === 'needRice', 'zirvak done');
  doAct(g, 'kazan');
  ok(kz.state === 'steam', 'rice added');
  run(g, TUNE.kazan.steam + 0.1);
  ok(kz.state === 'ready' && kz.portions === TUNE.kazan.cap, 'plov ready with a full batch');
  doAct(g, 'kazan'); doAct(g, 'kazan');
  ok(g.hero.hands.filter(h => h === 'plov').length === 2, 'two lyagans in hands');
  const ev2 = doAct(g, 'kazan');
  ok(ev2.some(e => e.t === 'nope' && e.text === TEXT.nope.handsFull), 'third lyagan does not fit');
  doAct(g, 'pass0');
  ok(g.st.pass0.item === 'plov' && g.hero.hands.filter(Boolean).length === 1, 'plov put on the pass');
  doAct(g, 'bin');
  ok(!g.hero.hands.some(Boolean), 'bin takes the last plov');
  doAct(g, 'pass0');
  ok(g.hero.hands.includes('plov') && !g.st.pass0.item, 'plov taken back from the pass');

  const g2 = new P.Game({ level: LEVELS[4], seed: 12, noTips: true });
  const k2 = g2.st.kazan;
  k2.state = 'empty'; k2.portions = 0;
  doAct(g2, 'kazan');
  run(g2, TUNE.kazan.fry + TUNE.kazan.vegWindow + 0.3);
  ok(k2.state === 'burnt' && g2.stats.burnt === 1 && g2.money === -TUNE.burnKazan, 'ignored kazan burns with a penalty');
  doAct(g2, 'kazan');
  ok(k2.state === 'empty', 'burnt kazan is cleaned');

  const g3 = new P.Game({ level: LEVELS[5], seed: 13, noTips: true });
  doAct(g3, 'teaGreen');
  ok(g3.st.teaGreen.state === 'brew', 'tea brewing');
  run(g3, TUNE.tea.brew + 0.1);
  ok(g3.st.teaGreen.state === 'ready' && g3.st.teaGreen.count === TUNE.tea.pots, 'two pots of tea');
  doAct(g3, 'teaGreen'); doAct(g3, 'teaGreen');
  ok(g3.handCount('teaGreen') === 2 && g3.st.teaGreen.state === 'empty', 'both pots taken');
  g3.hero.hands = [null, null];
  doAct(g3, 'tandoor');
  ok(g3.st.tandoor.state === 'bake' && g3.st.tandoor.load.samsa === 2 && g3.st.tandoor.load.non === 2, 'tandoor bakes two samsa and two non');
  run(g3, TUNE.tandoor.bake + 0.1);
  ok(g3.st.tandoor.state === 'done', 'baked');
  doAct(g3, 'tandoor');
  ok(g3.st.stockSamsa.count === 2 && g3.st.stockNon.count === 2, 'pastry in the baskets');
  doAct(g3, 'stockNon');
  ok(g3.hero.hands.includes('non') && g3.st.stockNon.count === 1, 'non taken from the basket');
  doAct(g3, 'compote');
  ok(g3.hero.hands.includes('compote') && g3.st.compote.servings === TUNE.compote.servings - 1, 'compote poured');

  const g4 = new P.Game({ level: LEVELS[4], seed: 14, noTips: true });
  doAct(g4, 'tandoor');
  ok(g4.st.tandoor.load.samsa === 4 && !g4.st.stockNon, 'day 5 tandoor bakes four samsa');
  run(g4, TUNE.tandoor.bake + TUNE.tandoor.burnWindow + 0.3);
  ok(g4.st.tandoor.state === 'burnt' && g4.stats.burnt === 1, 'forgotten samsa burns');
}

{
  const g = new P.Game({ level: LEVELS[3], seed: 21, noTips: true });
  run(g, 3);
  while (!g.queue.length) run(g, 0.5);
  const grp = g.queue[0];
  grp.size = 3;
  const small = g.tables.find(t => t.kind === 'small');
  const top = g.tables.find(t => t.kind === 'topchan');
  ok(!g.seat(grp.id, small.id), 'three guests do not fit at a small table');
  top.dirty = true;
  ok(!g.seat(grp.id, top.id), 'dirty table blocks seating');
  top.dirty = false;
  grp.members.push(Object.assign({}, grp.members[0], { i: 2 }));
  while (grp.members.length > 3) grp.members.pop();
  ok(g.seat(grp.id, top.id), 'three guests sit on a topchan');
  ok(!g.queue.includes(grp) && grp.table === top && grp.state === 'toTable', 'group walks to the topchan');
}

{
  const g = new P.Game({ level: LEVELS[8], seed: 31, noTips: true });
  let criticFront = false;
  for (let i = 0; i < 60 * 200 && g.phase !== 'end'; i++) {
    g.update(1 / 60); g.drain();
    const c = g.queue.find(q => q.vip);
    if (c && g.queue[0] === c) criticFront = true;
    if (criticFront) break;
  }
  ok(criticFront, 'critic goes to the front of the line');
}

{
  const g = new P.Game({ level: LEVELS[0], seed: 1 });
  ok(g.modal && g.modal.kind === 'tut', 'day 1 opens with the mentor');
  const bot = new P.Bot(g, {});
  let steps = 0;
  const seen = new Set();
  while (g.phase !== 'end' && steps < 60 * 400) {
    const s = g.tutStep();
    if (s) seen.add(s.id);
    bot.tick(1 / 60); g.update(1 / 60); g.drain(); steps++;
  }
  ok(g.phase === 'end', 'day 1 finishes');
  ok(!g.tut, 'tutorial completed');
  for (const id of ['hello', 'seat', 'order', 'serve', 'eat', 'clean', 'queue', 'kazan1', 'rice', 'steam']) ok(seen.has(id), 'tutorial step shown: ' + id);
}

{
  const g = new P.Game({ level: LEVELS[4], seed: 41, noTips: true });
  g.hero.x = g.st.kazan.use.x + 4; g.hero.y = g.st.kazan.use.y + 3;
  ok(g.focus() === 'kazan', 'keyboard focus picks the nearest station');
  const r = g.interact();
  ok(r && r.acted === 'kazan' && g.hero.busy, 'space acts on the focused station');
  for (let i = 0; i < 6; i++) g.click('prepVeg');
  ok(g.hero.queue.length === TUNE.queueMax, 'job queue holds five jobs');
  g.clearQueue();
  ok(g.hero.queue.length === 0, 'queue cleared');
  g.setMove(1, 0);
  const x0 = g.hero.x;
  run(g, 2);
  ok(g.hero.x > x0 + 10 || g.hero.busy, 'keyboard walking moves the chef');
}

{
  const results = [];
  for (const L of LEVELS) {
    const perfect = [], human = [];
    for (let s = 1; s <= 3; s++) {
      const a = P.simulate(L, { seed: 500 + s * 37, slow: 0 });
      ok(a.game.phase === 'end', `day ${L.n} ends (perfect bot, seed ${s})`);
      ok(Number.isFinite(a.result.money), 'money is a number');
      ok(a.game.stats.served + a.game.stats.lost === a.game.stats.groups, `day ${L.n}: every group is served or lost`);
      perfect.push(a.result.money);
      const b = P.simulate(L, { seed: 900 + s * 41, slow: 0.6, upgrades: typical(L.n) });
      ok(b.game.phase === 'end', `day ${L.n} ends (human-like bot)`);
      human.push(b.result.money);
    }
    const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
    results.push(`D${L.n} ${Math.round(avg(perfect))}/${Math.round(avg(human))}`);
    ok(Math.min(...perfect) >= L.target, `day ${L.n}: perfect bot always reaches the target (${Math.min(...perfect)} >= ${L.target})`);
    ok(avg(human) >= L.target, `day ${L.n}: human-like bot with upgrades reaches the target on average (${Math.round(avg(human))} >= ${L.target})`);
    ok(avg(perfect) <= L.expert * 1.6, `day ${L.n}: expert goal is not trivial`);
  }
  const a = P.simulate(LEVELS[6], { seed: 77 }), b = P.simulate(LEVELS[6], { seed: 77 });
  ok(a.result.money === b.result.money && a.frames === b.frames, 'simulation is deterministic');
  const g7 = new P.Game({ level: LEVELS[6], seed: 5 });
  ok(g7.schedule.some(e => e.second), 'day 7 has second orders');
  const g10 = new P.Game({ level: LEVELS[9], seed: 5 });
  ok(g10.schedule.filter(e => e.type === 'courier').length === 3, 'day 10 has three wedding couriers');
  const d10 = P.simulate(LEVELS[9], { seed: 5 });
  ok(d10.game.stats.served >= 10, 'day 10 bot serves most guests');
  if (process.argv.includes('-v')) console.log(results.join('  '));
}

function stubCtx() {
  const grad = { addColorStop() {} };
  const pat = { setTransform() {} };
  const base = {
    createLinearGradient: () => grad, createRadialGradient: () => grad, createPattern: () => pat,
    measureText: s => ({ width: String(s).length * 6 }), getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    setLineDash() {}, drawImage() {}, fillText() {}, strokeText() {}
  };
  return new Proxy(base, {
    get(t, k) { if (k in t) return t[k]; return typeof k === 'string' && /^[a-z]/.test(k) && !['fillStyle', 'strokeStyle', 'lineWidth', 'font', 'globalAlpha', 'textAlign', 'textBaseline', 'lineJoin', 'lineCap', 'imageSmoothingEnabled', 'filter'].includes(k) ? () => {} : t[k]; },
    set(t, k, v) { t[k] = v; return true; }
  });
}

function stubCanvas() {
  const ctx = stubCtx();
  return { width: 1, height: 1, style: {}, getContext: () => ctx, getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }), addEventListener() {}, removeEventListener() {} };
}

{
  const store = new Map();
  const errors = [];
  const sandbox = {
    console, Math, JSON, Map, Set, Array, Object, Number, String, Boolean, Date, Uint8Array, Uint8ClampedArray, Int32Array, Float32Array, Proxy, Symbol, Error, parseInt, parseFloat, isFinite,
    performance: { now: () => 0 },
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    document: { createElement: () => stubCanvas() },
    devicePixelRatio: 1
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  for (const f of ORDER) vm.runInContext(read('js/apps/plov/' + f + '.js'), sandbox, { filename: f + '.js' });
  const Q = sandbox.Plov;
  const QI = Q.Icons;
  for (const it of Q.FOOD.concat(['veg'])) ok(QI.FOOD_DRAW[it] && QI.FOOD_BASE[it] > 0, 'food icon ' + it);
  for (const it of ['plov', 'achichuk', 'samsa', 'non']) ok(QI.LEFTOVER_DRAW[it], 'leftover icon ' + it);
  for (const u of Q.UPGRADES) ok(QI.GOODS_DRAW[u.id], 'bazaar icon ' + u.id);
  for (const id of ['hand', 'coins', 'coin', 'broom', 'meat', 'rice', 'dough', 'knife', 'kapkir', 'notepad', 'cloth', 'guests', 'doira', 'footprints', 'table', 'flower', 'kazan', 'tandoor', 'pass', 'bin', 'check', 'star', 'lock', 'sweat', 'anger', 'sparkle', 'briefcase']) ok(QI.GLYPH_DRAW[id], 'glyph ' + id);
  for (const st of ['empty', 'fry', 'needVeg', 'zirvak', 'needRice', 'steam', 'ready', 'burnt']) ok(Q.Scene.KAZAN_STAGE[st] !== undefined, 'kazan board stage ' + st);
  const cv = stubCanvas();
  const root = {
    classList: { add() {} }, style: {}, tabIndex: 0, clientWidth: 1000, clientHeight: 750,
    set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html || ''; },
    querySelector: () => cv, addEventListener() {}, removeEventListener() {}, focus() {}
  };
  let exited = false;
  const ui = new Q.UI(root, { isActive: () => true, onExit: () => { exited = true; } });
  let ts = 0;
  const frames = n => { for (let i = 0; i < n; i++) { ts += 1000 / 60; try { ui.frame(ts); } catch (e) { errors.push(ui.screenName + ': ' + e.stack); break; } } };
  const clickBtn = text => { const b = ui.btns.find(x => x.text === text); ok(b, 'button ' + text + ' on ' + ui.screenName); b.action(); };
  frames(3);
  ok(ui.screenName === 'title', 'starts on the title screen');
  clickBtn('Настройки');
  frames(2);
  ok(!!ui.modal, 'settings open');
  clickBtn('Готово');
  clickBtn('Играть');
  frames(2);
  ok(ui.screenName === 'days', 'ledger opens');
  ui.save.wallet = 5000; ui.save.unlocked = 10;
  clickBtn('Базар: улучшения чайханы');
  frames(2);
  ok(ui.screenName === 'bazaar', 'bazaar opens');
  const buy = ui.btns.find(b => /^Купить/.test(b.text || ''));
  ok(buy && !buy.disabled, 'buy button ready');
  buy.action();
  ok(ui.save.up.boots === 1 && ui.save.wallet === 5000 - UPGRADES[0].costs[0], 'upgrade bought and paid');
  frames(2);
  ui.go('recipes', { back: 'days' });
  for (let i = 0; i < 6; i++) { frames(2); ui.screen.key({ key: 'ArrowRight' }); }
  ok(ui.screenName === 'recipes', 'recipes pages drawn');
  for (let d = 1; d <= 10; d++) {
    ui.go('play', { day: d });
    frames(3);
    ok(ui.screen.phase === 'intro', 'intro card for day ' + d);
    ui.screen.start();
    const s = ui.screen;
    const bot = new Q.Bot(s.game, {});
    for (let i = 0; i < 60 * 40; i++) {
      if (s.game.modal) { frames(1); s.game.ack(); }
      bot.tick(1 / 60);
      if (i % 3 === 0) {
        const tg = s.game.targets()[i % Math.max(1, s.game.targets().length)];
        if (tg) { ui.mx = tg.rect.x + tg.rect.w / 2; ui.my = tg.rect.y + tg.rect.h / 2; s.move(); }
      }
      frames(1);
      if (errors.length) break;
    }
    ok(!errors.length, 'day ' + d + ' plays without draw errors: ' + errors.join(' | '));
  }
  ui.go('play', { day: 4 });
  frames(2);
  ui.screen.start();
  frames(5);
  ui.keys.add('KeyD');
  frames(20);
  ui.keys.delete('KeyD');
  ui.screen.key({ key: ' ', code: 'Space' });
  ui.screen.key({ key: 'Tab', code: 'Tab' });
  ui.screen.key({ key: '1', code: 'Digit1' });
  ui.screen.pause();
  frames(2);
  ok(ui.modal && ui.screen.paused, 'pause menu');
  clickBtn('Продолжить');
  frames(2);
  ok(!ui.screen.paused, 'resumed');
  {
    ui.go('play', { day: 3 });
    frames(2);
    ui.screen.start();
    const s = ui.screen;
    for (let i = 0; i < 60 * 30 && !s.cards.length; i++) { if (s.game.modal) s.game.ack(); frames(1); }
    ok(s.cards.length > 0, 'waiting guests get a card at the gate');
    const c = s.cards[0];
    s.click(c.rect.x + c.rect.w / 2, c.rect.y + c.rect.h / 2, 0);
    ok(s.selected === c.group.id, 'clicking the card selects the group');
    const free = s.game.tables.find(tb => !tb.group && !tb.dirty && tb.cap >= c.group.size);
    s.click(free.x, free.y, 0);
    ok(free.group === c.group && s.selected === null, 'the selected group sits at the clicked table');
    ui.go('play', { day: 2 });
    frames(2);
    ui.screen.start();
    const s2 = ui.screen, g2 = s2.game, bot2 = new Q.Bot(g2, {});
    for (let n = 0; g2.phase !== 'end' && n < 60 * 400; n++) { if (g2.modal) g2.ack(); bot2.tick(1 / 60); g2.update(1 / 60); g2.drain(); s2.trackFates(); }
    const fates = Object.values(s2.fate);
    ok(g2.phase === 'end' && fates.filter(f => f === 'ok').length === g2.stats.served && fates.filter(f => f === 'lost').length === g2.stats.lost, 'guest beads match served and lost groups');
    ui.go('play', { day: 4 });
    frames(2);
    ui.screen.start();
    frames(5);
  }
  const g = ui.screen.game;
  g.phase = 'end';
  g.result = { money: 12000, stars: 2, passed: true, mid: 11000, stats: Object.assign({}, g.stats) };
  ui.screen.phase = 'done';
  ui.screen.doneT = 3;
  frames(2);
  ok(ui.screenName === 'results', 'results receipt');
  frames(300);
  ok(ui.btns.some(b => b.text === 'Следующий день'), 'next day button');
  ok(ui.save.days[4] && ui.save.days[4].stars === 2 && ui.save.wallet > 0, 'progress saved');
  ui.go('finale');
  frames(240);
  ok(ui.screenName === 'finale', 'finale plays');
  ui.go('title');
  frames(2);
  clickBtn('Выход');
  ok(exited, 'exit closes the window');
  ok(!errors.length, 'no UI errors: ' + errors.join(' | '));
  const saved = JSON.parse(store.get('plov98_save'));
  ok(saved.v === 1 && saved.up.boots === 1, 'save persisted to localStorage');
}

{
  const SL = String.fromCharCode(47);
  const LINE = SL + SL, BLOCK = SL + '*';
  const strip = s => s.replace(/https?:\/\/[^\s'"`]+/g, '');
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/plov/' + f).concat(['js/apps/plov-app.js', 'tests/plov.test.js', 'tools/plov-shots.cjs']);
  for (const f of files) {
    const src = strip(read(f));
    ok(!src.includes(LINE) && !src.includes(BLOCK), f + ' has no comments');
  }
  ok(!read('css/apps/plov.css').includes(BLOCK), 'css has no comments');
  ok(!read('plov.html').includes('<!' + '--'), 'page has no comments');
  const html = read('index.html');
  const page = read('plov.html');
  let lastA = -1, lastB = -1;
  for (const f of ORDER) {
    const needle = `js/apps/plov/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'script order in index.html and plov.html: ' + f);
    lastA = ia; lastB = ib;
  }
  ok(fs.readdirSync(DIR).filter(f => f.endsWith('.js')).length === ORDER.length, 'every module is loaded by the pages');
  ok(html.indexOf('js/apps/plov-app.js') > lastA && html.includes('css/apps/plov.css'), 'desktop loads the wrapper and styles');
  const gm = read('js/game-manager.js');
  const at = gm.indexOf('      plov: {');
  const entry = gm.slice(at, at + 2600);
  ok(at > 0 && /steam: true/.test(entry) && /price: 16\.99/.test(entry) && /targetExe: 'PLOV\.EXE'/.test(entry) && /appPlov/.test(entry), 'Steam catalog entry');
  ok(!/plovGranted/.test(gm), 'no grant flag');
  const loadState = gm.slice(gm.indexOf('loadState'), gm.indexOf('moveGamesToSteam(state)'));
  ok(!/'plov'/.test(loadState), 'not preinstalled');
  const shell = {
    'js/desktop.js': ["isInstalled('plov')", 'appPlov'],
    'js/taskbar.js': ["isInstalled('plov')", "case 'plov'", "showInSteam('plov')"],
    'js/apps/dialogs.js': ["cmd === 'plov'", "showInSteam(\\'plov\\')"],
    'js/apps/explorer.js': ["item.app === 'plov'", 'PLOV.EXE'],
    'js/filesystem.js': ["gmInstalled.includes('plov')", "'PLOV.EXE'"],
    'js/apps/task-manager.js': ["'app_plov'", 'plov.exe'],
    'js/icons.js': ["'plov': `<svg"],
    'js/apps/clippy.js': ["id.startsWith('app_plov')", "launchProgram('plov', 'appPlov')"],
    'js/apps/advanced-site.js': ["gm: 'plov'"],
    'js/apps/steam.js': ["game: 'plov'"],
    'js/apps/plov-app.js': ["id = 'app_plov'", 'P.UI(root']
  };
  for (const [f, needles] of Object.entries(shell)) {
    const src = read(f);
    for (const n of needles) ok(src.includes(n), `${f} contains ${n}`);
  }
  ok((read('js/i18n.js').match(/'app\.plov': 'Хаято, Где плов\?'/g) || []).length === 2, 'i18n title in Russian');
  ok((read('js/i18n.js').match(/'app\.plov': 'Hayato, Where Is the Plov\?'/g) || []).length === 2, 'i18n title in English');
  ok(read('tests/steam.test.js').includes("'plov'"), 'steam test covers the game');
}

console.log(`plov: ${checks} checks passed in ${Date.now() - t0} ms`);
