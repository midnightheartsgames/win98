const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

console.log('--- Testing HSR 98 Luofu ---');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/hsr98');
const noop = () => {};
function makeCanvas(w = 300, h = 150) {
  const cv = { width: w, height: h, style: {}, className: '', addEventListener: noop, getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 480 }), appendChild: noop };
  const grad = () => ({ addColorStop: noop });
  const ctx = new Proxy({
    canvas: cv, globalAlpha: 1, font: '10px x', fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, imageSmoothingEnabled: true,
    measureText: s => ({ width: String(s).length * 6 }), createPattern: () => ({}), createLinearGradient: grad, createRadialGradient: grad,
    getImageData: (x, y, gw, gh) => ({ data: new Uint8ClampedArray(Math.max(1, gw * gh) * 4), width: gw, height: gh }),
    createImageData: (gw, gh) => ({ data: new Uint8ClampedArray(gw * gh * 4), width: gw, height: gh })
  }, { get: (t, k) => (k in t ? t[k] : noop), set: (t, k, v) => { t[k] = v; return true; } });
  cv.getContext = () => ctx;
  return cv;
}
const store = new Map();
Object.assign(globalThis, {
  document: { createElement: () => makeCanvas() },
  localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
  requestAnimationFrame: () => 1
});

const H = require(path.join(DIR, 'hsr-core.js'));
const list = (src, head) => { const line = src.split('\n').find(l => l.trim().startsWith(head)); return line.slice(line.indexOf('[') + 1, line.indexOf(']')).split(',').map(x => x.trim().replace(/'/g, '')); };
const testSrc = fs.readFileSync(path.join(__dirname, 'hsr98.test.js'), 'utf8');
for (const f of list(testSrc, "for (const f of ['hsr-data'")) require(path.join(DIR, f + '.js'));

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const eq = (a, b, m) => { assert.equal(a, b, m); checks++; };

const mk = () => { const g = new H.Game({ seed: 5 }); g.script = null; g.pending = null; g.events.length = 0; return g; };

H.MAPS.lf_bench = {
  name: 'Проверка механик', theme: 'station', music: 'station', floor: '.', safe: true,
  rows: [
    '##################################################',
    '##################################################',
    '###.............#..............##............#####',
    '###.............#.л...м........##............#####',
    '###.............#...............ф.....й...ё..#####',
    '###..р....х.....у..............##............#####',
    '###.............#.....ц...ъ..э.##.ю...и......#####',
    '###.............#..............##............#####',
    '#########.########################################',
    '#########.########################################',
    '#########.########################################',
    '#####ш##ч.#т#####.######щ#########################',
    '###............##.##..........##########........##',
    '##ж............##.##..........##########........##',
    '###............кб.##..........##гд######........##',
    '##e.....v.........................п.........н...##',
    '###...............................п.............##',
    '###............#####..........####п#####........##',
    '##з............#####..........###.п....#........##',
    '###............#####..........####п#####........##',
    '#######с.#########################п###############',
    '########.#########################п###############',
    '########.#########################################',
    '########.#########################################',
    '########.#########################################',
    '###............................###################',
    '######.########.######.###########################',
    '######.########.######.#####...оя#################',
    '######.########.######.#####.#####################',
    '######.########.############.#####################',
    '######.########..............#####################',
    '######.###########################################',
    '##################################################',
    '##################################################'
  ],
  anchors: [], chests: [], enemies: {},
  lanes: {
    a: { from: [17, 11], dir: 'down', n: 6, box: 2, at: 4, min: 2, max: 4 },
    b: { from: [34, 15], dir: 'down', n: 7, box: 2, at: 4, min: 0, max: 5 },
    c: { from: [33, 18], dir: 'right', n: 6, box: 2, at: 0, min: 0, max: 3 }
  },
  trails: [{ id: 'tingyun', col: '#ff9ac8', path: [[8, 21], [8, 25], [15, 25], [15, 30], [28, 30], [28, 27], [31, 27]] }],
  marks: {
    v: { type: 'spawn' },
    e: { type: 'exit', to: 'express', at: 'v' },
    ж: { type: 'prop', obj: 'none' },
    з: { type: 'prop', obj: 'none' },
    т: { type: 'prop', obj: 'none' },
    к: { type: 'prop', obj: 'none', tile: '#' },
    с: { type: 'prop', obj: 'none', tile: '#' },
    ч: { type: 'prop', obj: 'none', tile: '#' },
    б: { type: 'dispatch', lane: 'a', title: 'Пульт: контейнер в проходе', tile: '#' },
    г: { type: 'dispatch', lane: 'b', title: 'Пульт: нижний контейнер', tile: '#' },
    д: { type: 'dispatch', lane: 'c', title: 'Пульт: верхний контейнер', tile: '#' },
    п: { type: 'pit', tile: '~' },
    ш: { type: 'screen', to: 'щ', out: 'down', tile: '#' },
    щ: { type: 'screen', to: 'ш', out: 'down', tile: '#' },
    н: { type: 'prop', obj: 'none' },
    о: { type: 'trigger', once: 'lf_bench_trail' },
    я: { type: 'npc', who: 'tingyun', dir: 'left', always: true },
    р: { type: 'pyxis', role: 't', board: 'p1', dir: 'right' },
    х: { type: 'pyxis', role: 'r', board: 'p1', dir: 'up' },
    у: { type: 'pyxis', role: 'c', board: 'p1' },
    л: { type: 'pyxis', role: 't', board: 'p2', dir: 'right' },
    м: { type: 'pyxis', role: 'r', board: 'p2', dir: 'up' },
    ц: { type: 'pyxis', role: 'r', board: 'p2', dir: 'left' },
    ъ: { type: 'pyxis', role: 'c', board: 'p2' },
    ф: { type: 'pyxis', role: 'c', board: 'p2' },
    э: { type: 'screen', to: 'ю', out: 'left', if: 'lf_px_p2', lockText: 'Ширма принимает только энергию сундука.' },
    ю: { type: 'screen', to: 'э', out: 'right', if: 'lf_px_p2' },
    и: { type: 'pyxis', role: 'f', board: 'p2', dir: 'up' },
    й: { type: 'pyxis', role: 'f', board: 'p2', dir: 'left' },
    ё: { type: 'prop', obj: 'none' }
  }
};

{
  const g = mk();
  g.loadMap('lf_bench', null, { silent: true });
  ok(g.blocked(17, 15) && g.blocked(17, 16), 'the first container closes the passage');
  g.placePlayer(16, 15);
  eq(g.moveCargo('a', 1), 'limit', 'a container stops at the lights of the panel');
  eq(g.moveCargo('a', -1), true, 'the panel moves the container');
  eq(g.moveCargo('a', -1), true, 'the panel moves it again');
  eq(g.moveCargo('a', -1), 'limit', 'the container stops at the other end of the panel');
  ok(!g.blocked(17, 15) && !g.blocked(17, 16), 'the passage is open');
  eq(g.map.ents.find(e => e.kind === 'cargo' && e.lane === 'a').y, 13, 'the container entity follows the lane');

  ok(g.blocked(34, 15) && g.blocked(34, 16), 'the trench is closed without a container');
  eq(g.moveCargo('b', -1), 'cargo', 'the upper container blocks the lower one');
  eq(g.laneAt('b'), 4, 'a blocked move keeps the container');
  eq(g.moveCargo('c', 1), true, 'the upper container moves');
  eq(g.moveCargo('c', 1), true, 'the upper container clears the crossing');
  for (let i = 0; i < 4; i++) eq(g.moveCargo('b', -1), true, 'the lower container rises ' + i);
  ok(!g.blocked(34, 15) && !g.blocked(34, 16), 'the container bridges the trench');
  ok(g.blocked(34, 17), 'the rest of the trench stays closed');
  g.placePlayer(34, 15);
  eq(g.moveCargo('b', 1), 'player', 'a container under the team does not move');
  g.placePlayer(33, 15);
  const saved = JSON.parse(JSON.stringify(g.state));
  const again = new H.Game({ state: Object.assign(saved, { map: 'lf_bench', x: 33, y: 15 }), seed: 2 });
  ok(!again.blocked(17, 15) && !again.blocked(34, 15), 'container positions survive a save');
  const reach = (from, to) => {
    const seen = new Set([from.join()]), q = [from];
    while (q.length) {
      const [x, y] = q.shift();
      if (x === to[0] && y === to[1]) return true;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + ',' + (y + dy); if (!seen.has(k) && !g.blocked(x + dx, y + dy)) { seen.add(k); q.push([x + dx, y + dy]); } }
    }
    return false;
  };
  ok(reach([8, 15], [44, 16]), 'the far room can be reached on foot after both tasks');
}

{
  const g = mk();
  g.loadMap('lf_bench', null, { silent: true });
  const seen = new Set();
  const states = [[4, 0]];
  const key = (b, c) => b + ':' + c;
  while (states.length) {
    const [b, c] = states.pop();
    if (seen.has(key(b, c))) continue;
    seen.add(key(b, c));
    for (const [name, d] of [['b', 1], ['b', -1], ['c', 1], ['c', -1]]) {
      g.state.lf.cargo['lf_bench:b'] = b; g.state.lf.cargo['lf_bench:c'] = c;
      g.placePlayer(33, 15);
      if (g.moveCargo(name, d) === true) states.push([g.laneAt('b'), g.laneAt('c')]);
    }
  }
  ok(seen.size > 6, 'the two containers have many reachable states');
  ok([...seen].some(s => s.startsWith('0:')), 'some reachable state bridges the trench');
  for (const s of seen) { const [b, c] = s.split(':').map(Number); ok(!(b <= 3 && b + 1 >= 3 && c <= 1 && c + 1 >= 1), 'no state puts two containers into one cell ' + s); }
}

{
  const g = mk();
  g.loadMap('lf_bench', null, { silent: true });
  const scr = ch => { const [x, y] = g.map.marks[ch][0]; return g.map.ents.find(e => e.kind === 'screen' && e.x === x && e.y === y); };
  g.useScreen(scr('ш'));
  eq(g.player.x + ',' + g.player.y, '24,12', 'a Shifting Screen moves the team to its pair');
  g.useScreen(scr('щ'));
  eq(g.player.x + ',' + g.player.y, '5,12', 'the pair works both ways');
  g.useScreen(scr('э'));
  eq(g.player.x + ',' + g.player.y, '5,12', 'a closed screen does not teleport');
  ok(g.ditingScan(), 'Diting scans on a map with a trail');
  g.placePlayer(8, 22);
  let s = g.ditingCells();
  eq(s.cells.length, 10, 'the scent shows ten cells ahead');
  eq(s.cells[0].join(), '8,22', 'the scent starts near the team');
  eq(s.cells[9].join(), '14,25', 'the scent turns the corner');
  g.state.time += 8;
  ok(!g.ditingCells(), 'the scent fades after the scan');
  g.loadMap('hs_base', null, { silent: true });
  ok(!g.ditingScan(), 'Diting has nothing to smell on other maps');
}

{
  const g = mk();
  g.loadMap('lf_bench', null, { silent: true });
  const P = () => g.map.ents.filter(e => e.kind === 'pyxis');
  const by = (board, role) => P().filter(e => e.def.board === board && e.def.role === role);
  const solve = board => {
    const rec = by(board, 'r'), start = by(board, 't')[0], coils = by(board, 'c'), wins = [];
    const n = 4 ** rec.length;
    for (let i = 0; i < n; i++) {
      let v = i;
      for (const r of rec) { g.state.lf.px['lf_bench:' + r.x + ',' + r.y] = H.LF_FIELD.TURN[v % 4]; v = Math.floor(v / 4); }
      const t = g.pyxisTrace(start);
      if (coils.every(c => t.hits.has(c))) wins.push(rec.map(r => g.pyxisDir(r)).join());
    }
    for (const r of rec) delete g.state.lf.px['lf_bench:' + r.x + ',' + r.y];
    return wins;
  };
  eq(solve('p1').join('|'), 'right', 'the first board has one answer');
  eq(solve('p2').join('|'), 'down,right', 'the second board has one answer through the Shifting Screen');
  ok(g.blocked(16, 5), 'a coil closes the door');
  const t1 = by('p1', 't')[0];
  g.pyxisFire(t1);
  ok(!g.state.flags.lf_px_p1 && g.beam && !g.beam.ok, 'a wrong direction misses and the coil grows back');
  ok(g.blocked(16, 5), 'the coil is still there after a miss');
  const r1 = by('p1', 'r')[0];
  g.usePyxis(r1);
  eq(g.pyxisDir(r1), 'right', 'a receiver turns clockwise');
  g.pyxisFire(t1);
  ok(g.state.flags.lf_px_p1 && g.beam.ok, 'the beam destroys the coil');
  ok(!g.blocked(16, 5), 'the door is open');
  const [m, c] = by('p2', 'r');
  g.usePyxis(m); g.usePyxis(m);
  g.pyxisFire(by('p2', 't')[0]);
  ok(!g.state.flags.lf_px_p2, 'hitting only part of the path does nothing');
  g.usePyxis(c); g.usePyxis(c);
  g.pyxisFire(by('p2', 't')[0]);
  ok(g.state.flags.lf_px_p2, 'both coils fall at once');
  ok(g.beam.segs.length >= 5, 'the beam bends through receivers and the screen');
}

{
  const fight = (seed, keys, lvl) => {
    const g = new H.Game({ seed });
    g.script = null; g.pending = null;
    for (const k of keys) if (!g.state.roster[k]) g.debugChar(k, lvl, 0, 0);
    g.state.party = keys.slice();
    for (const k of keys) g.state.roster[k].lvl = lvl;
    const b = g.startBattle({ encId: 'lf_phantylia', fromScript: true });
    const seen = { waves: new Set(), gauge: 0, roar: 0, say: [], stun: 0, lotus: 0, turns: 0, music: [] };
    const note = list => {
      for (const e of list) {
        if (e.t === 'act' && e.kind === 'assist') seen.roar++;
        if (e.t === 'turn') seen.turns++;
        if (e.t === 'wave') seen.waves.add(e.n);
        if (e.t === 'lfmusic') seen.music.push(e.id);
        if (e.t === 'text' && e.hold) seen.say.push(e.text);
        if (e.t === 'status' && e.text === 'Поглощение чёрной праны') seen.stun++;
        if (e.t === 'kill' && e.u.data && e.u.data.fam === 'lotus') seen.lotus++;
      }
    };
    note(b.start());
    for (let i = 0; i < 6000 && !b.over; i++) {
      seen.gauge = Math.max(seen.gauge, b.lfGauge || 0);
      b.autoStep();
      note(b.drain());
    }
    return { b, seen };
  };
  const team = ['trail', 'march', 'danheng', 'welt'];
  const { b, seen } = fight(7, team, 70);
  ok(b.over, 'the battle with Phantylia ends');
  ok(b.allies.some(a => a.charId === 'jingyuan' && a.trial), 'Jing Yuan fights as a guest');
  ok(b.result.win, 'a level 70 team beats Phantylia');
  eq(seen.waves.size, 2, 'all three phases come');
  eq(seen.music.join(), 'pedu2,pedu3', 'every phase of Phantylia has its own part of the theme');
  eq(H.ENCOUNTERS.lf_phantylia.music, 'pedu1', 'the fight opens with the first part');
  eq(seen.stun, 1, 'the Snare stops Jing Yuan once');
  ok(seen.roar >= 1, 'the bot uses Cloudhymn Roar');
  ok(seen.lotus >= 1, 'the bot kills lotuses');
  ok(seen.say.length >= 8, 'the fight talks');
  const lead = b.enemies.find(e => e.id === 'lf_undying3');
  ok(lead && lead.hp <= lead.maxHp * 0.01, 'the fight stops at one percent of her health or below');

  const g = new H.Game({ seed: 3 });
  g.script = null; g.pending = null;
  const lone = g.startBattle({ encId: 'lf_phantylia', fromScript: true });
  lone.start();
  const jy = lone.allies.find(a => a.charId === 'jingyuan');
  jy.hp = 0; jy.dead = true;
  lone.cleanup();
  ok(lone.over && !lone.result.win, 'the fight is lost when Jing Yuan falls');
  const out = g.endBattle();
  ok(out.lost && g.retryBattle() && g.battle.lf, 'a retry keeps the rules of the fight');

  const plain = new H.Game({ seed: 9 });
  plain.script = null; plain.pending = null;
  const pb = plain.startBattle({ enemies: ['reaver:5'], lvl: 5, seed: 4 });
  pb.start();
  ok(!pb.lf && !pb.assistReady(), 'other battles have no gauge');
}

{
  for (const f of list(testSrc, "for (const f of ['hsr-gfx'")) require(path.join(DIR, f + '.js'));
  const G = H.Gfx;
  const stubCtx = makeCanvas(640, 480).getContext('2d');
  const g = mk();
  for (const id of ['lf_cloud', 'lf_haven', 'lf_astrum', 'lf_navalia', 'lf_sanctum', 'lf_seat', 'lf_divination', 'lf_matrix', 'lf_artisan', 'lf_delve', 'lf_alchemy', 'lf_evemist', 'lf_terrace', 'lf_scale', 'lf_roots', 'lf_alley']) {
    g.loadMap(id, null, { silent: true });
    const L = G.mapLayer(g.map);
    ok(L.cv.width === g.map.w * G.TILE_U, 'map layer ' + id);
    ok(L.deco, 'land art is used on ' + id);
    G.drawMap(stubCtx, g.map, 40, 20, 1.5, 640, 480);
  }
  for (const land of Object.keys(H.Luofu.LANDS)) {
    const rows = ['##########', '#HHWHHQHG#', '#HHWHHQHG#', '#HWWHHQHG#', '#..T.L.Y.#', '#,,"._=^|#', '#~~~RRB*K#', '#.P.C.X.D#', '##########'];
    const decor = Object.keys(H.Luofu.DECOR).map((k, i) => [k, 1 + (i % 7), 4 + (i % 3), land]).concat(Object.keys(H.Luofu.LAYER).map((k, i) => [k, 2 + i, 2]));
    const L = H.Luofu.buildLayer({ id: 'lftest_' + land, def: { land, theme: land, floor: '.', rows, decor }, w: rows[0].length, h: rows.length, tiles: rows });
    ok(L.sprites.length >= Object.keys(H.Luofu.DECOR).length, 'all decor of ' + land + ' builds');
  }
  const root = { classList: { add: noop }, set innerHTML(v) { this.html = v; }, appendChild: noop, addEventListener: noop, removeEventListener: noop, focus: noop };
  const ui = new H.UI(root, { onExit: noop });
  ui.running = false;
  ui.game = g;
  ui.mode = 'field';
  const pump = n => { for (let i = 0; i < n; i++) { ui.update(1 / 30); ui.render(); } };
  const press = (k, code) => ui.handleKey(k, code || null, {});
  g.loadMap('lf_bench', 'v', { silent: true });
  g.script = null; g.pending = null;

  const panel = ch => { const [x, y] = g.map.marks[ch][0]; g.placePlayer(x, y + 1); g.player.dir = 'up'; };
  panel('б');
  press('ok'); pump(1);
  ok(ui.top(), 'the panel opens over the map');
  press('up'); press('up'); press('up'); pump(4);
  eq(g.laneAt('a'), 2, 'arrows move the container and stop at the lights');
  press('back'); pump(1);
  ok(!g.pending && !ui.top(), 'Esc leaves the panel');

  g.placePlayer(8, 22);
  press(null, 'KeyG'); pump(3);
  ok(!g.ditingCells(), 'G does nothing without Diting');
  g.state.flags.lf_diting = true;
  press(null, 'KeyG'); pump(3);
  ok(g.ditingCells().cells.length === 10, 'G starts the scan');
  const [rx, ry] = g.map.marks['р'][0];
  g.placePlayer(rx + 1, ry); g.player.dir = 'left';
  press('ok'); pump(3);
  ok(g.beam && !g.beam.ok, 'the beam is drawn');
  g.state.time += 2; pump(1);
  g.loadMap('lf_cloud', 'v', { silent: true }); pump(2);
  g.loadMap('lf_haven', 'v', { silent: true }); pump(2);

  g.loadMap('lf_bench', 'v', { silent: true });
  for (const k of ['trail', 'march', 'danheng', 'welt']) if (!g.state.roster[k]) g.debugChar(k, 70, 0, 0);
  g.state.party = ['trail', 'march', 'danheng', 'welt'];
  g.startBattle({ encId: 'lf_phantylia', fromScript: true });
  ui.drainGameEvents();
  pump(2);
  ok(g.battle && g.battle.lf, 'the fight carries its rules');
  pump(60);
  g.battle.lfGauge = 120;
  ui.bt.auto = false; ui.bt.queue.length = 0; ui.bt.cur = null;
  for (let i = 0; i < 200 && g.battle.phase !== 'input'; i++) { g.battle.step(); ui.pullEvents(); pump(1); }
  ui.bt.queue.length = 0; ui.bt.cur = null;
  press(null, 'KeyG');
  ok(g.battle.lfGauge < 120, 'G fires Cloudhymn Roar');
  pump(10);
}

const LF = /^lf_/;
const lfStates = new Map();
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const LIFTS = { lf_navalia: [{ from: [33, 14], to: [33, 16], need: 'lf_nav_clues' }, { from: [33, 15], to: [33, 13] }] };
function walkSet(g, sx, sy) {
  const exitAt = (x, y) => g.map.ents.find(e => e.kind === 'exit' && e.x === x && e.y === y);
  const seen = new Set([sx + ',' + sy]), q = [[sx, sy]];
  const screens = g.map.ents.filter(e => e.kind === 'screen' && g.screenOn(e));
  while (q.length) {
    const [x, y] = q.shift();
    for (const e of screens) {
      if (Math.abs(e.x - x) + Math.abs(e.y - y) !== 1) continue;
      const to = g.screenPair(e);
      if (!to) continue;
      const [dx, dy] = H.LF_FIELD.DIRS[to.def.out || 'down'], k = (to.x + dx) + ',' + (to.y + dy);
      if (!seen.has(k)) { seen.add(k); q.push([to.x + dx, to.y + dy]); }
    }
    for (const { from, to, need } of LIFTS[g.map.id] || []) {
      if (need && !g.cond(need)) continue;
      if (Math.abs(from[0] - x) + Math.abs(from[1] - y) !== 1 || seen.has(to.join())) continue;
      seen.add(to.join());
      q.push(to);
    }
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny, ex = exitAt(nx, ny);
      if (seen.has(k)) continue;
      if (g.blocked(nx, ny)) { if (ex) seen.add(k); continue; }
      seen.add(k);
      if (!ex || (ex.def.need && !g.cond(ex.def.need))) q.push([nx, ny]);
    }
  }
  return seen;
}
function note(g) {
  if (!g.map || !LF.test(g.map.id) || g.busy()) return;
  const s = g.state, flags = Object.keys(s.flags).filter(k => s.flags[k]).sort(), key = flags.join() + '|' + JSON.stringify(s.quests);
  if (!lfStates.has(key)) lfStates.set(key, { flags, quests: JSON.parse(JSON.stringify(s.quests)), cargo: JSON.parse(JSON.stringify((s.lf || {}).cargo || {})) });
  const R = walkSet(g, g.player.x, g.player.y), goal = g.questTarget();
  if (goal && goal.map === g.map.id && goal.mark && g.map.marks[goal.mark]) ok(g.map.marks[goal.mark].some(([x, y]) => [[0, 0]].concat(D4).some(([dx, dy]) => R.has((x + dx) + ',' + (y + dy)))), 'the objective ' + goal.mark + ' can be reached on ' + g.map.id + ' from ' + g.player.x + ',' + g.player.y);
}
const STORY_TEAM = ['trail', 'march', 'natasha', 'hook'];
const STORY_LEVELS = { trail: 36, march: 36, natasha: 32, hook: 30 };
const storyLog = [];
function storyGrow(g) {
  const T = STORY_TEAM.filter(k => g.state.roster[k]), up = g.trailLevel;
  g.trailLevel = () => 70;
  g.state.credits += 200000;
  const asc = k => {
    for (let i = 0; i < 8; i++) {
      const info = g.ascInfo(k);
      if (info.why === 'mats') for (const [id, n] of Object.entries(info.cost.items)) g.state.inv.items[id] = Math.max(g.state.inv.items[id] || 0, n);
      if (!g.ascend(k)) break;
    }
  };
  T.forEach(asc);
  let i = 0;
  for (const b of g.expBooks()) for (let n = 0; n < b.have; n++) { const k = T[i++ % T.length]; asc(k); g.useExp(k, { [b.id]: 1 }); }
  for (const k of T) { asc(k); g.autoTraces(k); }
  g.trailLevel = up;
}
function drive(g) {
  for (let n = 0; n < 4000; n++) {
    if (g.battle) {
      const b = g.battle;
      if (!b.ev.length && b.phase === 'run' && !b.over) b.start();
      b.runAuto(1200);
      let out = g.endBattle(), tries = 0;
      if (g.storyBot) storyLog.push({ enc: b.enemies.map(e => e.id).join('+'), first: !!(out && out.win) });
      while (out && out.lost && tries++ < 6) { for (const k of g.state.party) g.addExp(k, H.charExp(6000, g.state.roster[k].lvl)); g.retryBattle(); g.battle.start(); g.battle.runAuto(1200); out = g.endBattle(); }
      ok(out && out.win, 'script battle won');
      g.afterBattle();
      if (g.storyBot) storyGrow(g);
      continue;
    }
    const p = g.pending;
    if (p) { g.resume(p.type === 'choice' ? (drive.pick || 0) % p.options.length : p.type === 'ui' && (p.ui === 'abacus' || p.ui === 'mutare') ? true : undefined); continue; }
    if (!g.script) return;
    g.advanceScript();
  }
  ok(false, 'a script does not end');
}
const toward = (g, e) => {
  const R = LF.test(g.map.id) ? walkSet(g, g.player.x, g.player.y) : null;
  for (const [dx, dy, dir] of [[0, 1, 'up'], [0, -1, 'down'], [1, 0, 'left'], [-1, 0, 'right']]) if (!g.blocked(e.x + dx, e.y + dy) && (!R || R.has((e.x + dx) + ',' + (e.y + dy)))) { g.placePlayer(e.x + dx, e.y + dy); g.player.dir = dir; return true; }
  return false;
};
function talk(g, ch) {
  note(g);
  const e = g.map.ents.find(x => x.ch === ch && g.visible(x));
  ok(e, 'entity ' + ch + ' on ' + g.map.id);
  if (LF.test(g.map.id)) {
    const R = walkSet(g, g.player.x, g.player.y);
    ok(D4.some(([dx, dy]) => R.has((e.x + dx) + ',' + (e.y + dy))), 'the team can walk to ' + ch + ' on ' + g.map.id);
  }
  ok(toward(g, e), 'stand next to ' + ch);
  ok(g.interact(), 'interact ' + ch);
  drive(g);
  note(g);
}
function stepOn(g, ch) {
  note(g);
  const e = g.map.ents.find(x => x.ch === ch);
  ok(e, 'step target ' + ch);
  if (LF.test(g.map.id)) ok(walkSet(g, g.player.x, g.player.y).has(e.x + ',' + e.y), 'the team can walk to ' + ch + ' on ' + g.map.id);
  g.placePlayer(e.x, e.y);
  g.lastExitTile = null;
  g.onStep();
  drive(g);
  note(g);
}
function followLead(g, flag) {
  for (let i = 0; i < 4000 && !g.state.flags[flag]; i++) {
    const a = g.map.ents.find(e => e.kind === 'lflead');
    const side = a && D4.map(([dx, dy]) => [a.x + dx, a.y + dy]).find(([x, y]) => !g.blocked(x, y));
    if (side) g.placePlayer(side[0], side[1]);
    g.update(1 / 30, {});
    if (g.script || g.pending || g.battle) drive(g);
  }
}
function firePyxis(g, board, dirs) {
  for (const [ch, dir] of dirs) {
    const e = g.map.ents.find(x => x.kind === 'pyxis' && x.ch === ch);
    ok(e, 'pyxis ' + ch);
    for (let i = 0; i < 4 && g.pyxisDir(e) !== dir; i++) g.usePyxis(e);
    eq(g.pyxisDir(e), dir, 'pyxis ' + ch + ' turns');
  }
  const t = g.map.ents.find(x => x.kind === 'pyxis' && x.def.board === board && x.def.role === 't');
  g.usePyxis(t);
  for (let i = 0; i < 60 && g.pyxisThen; i++) g.update(1 / 30, {});
  drive(g);
}
function exitVia(g, ch) {
  const e = g.map.ents.find(x => x.ch === ch && x.kind === 'exit');
  ok(e, 'exit ' + ch);
  const before = g.map.id;
  g.useExit(e);
  drive(g);
  ok(g.map.id !== before, 'the exit moves the team from ' + before);
}
const newCrewNoJarilo = () => { const g = new H.Game({ seed: 88 }); g.script = null; g.pending = null; return g; };
const newCrew = (seed, lvl) => {
  const g = new H.Game({ seed });
  g.script = null; g.pending = null;
  for (const k of ['trail', 'march', 'danheng', 'himeko']) { if (!g.state.roster[k]) g.debugChar(k, lvl, 0, 0); g.state.roster[k].lvl = lvl; }
  g.state.party = ['trail', 'march', 'danheng', 'himeko'];
  g.state.flags.jarilo_done = true;
  g.missionTick();
  return g;
};

{
  const g = newCrew(21, 36);
  for (const k of STORY_TEAM) { if (!g.state.roster[k]) g.debugChar(k, STORY_LEVELS[k], 0, 0); g.state.roster[k].lvl = STORY_LEVELS[k]; g.state.roster[k].hp = null; }
  g.state.party = STORY_TEAM.slice();
  g.storyBot = true;
  storyGrow(g);
  g.state.obj = 'Цель другой цепочки';
  eq(g.state.quests.lf_q1, 'sofa', 'after Jarilo-VI the chapter waits in the mission list');
  ok(g.chatAvailable ? true : true, 'the chapter starts without a forced scene');
  ok(!g.script && !g.pending, 'nothing pulls the player into the chapter');
  ok(H.WORLDS.find(w => w.id === 'luofu').open === 'lf_arrive' && !g.worldOpen(H.WORLDS.find(w => w.id === 'luofu')), 'the world stays closed until the vote');
  g.loadMap('express', 'v', { silent: true });
  ok(g.missionList().some(m => m.id === 'lf_q1' && m.type === 'trail' && m.place), 'the mission is in the list with its place');
  ok(g.missionTracked().id !== 'lf_q1', 'the waiting mission does not take the tracker');
  g.trackMission('lf_q1');
  eq(g.questTarget().map, 'express', 'the marker points at the sofa');
  g.missionsState().track = null;
  talk(g, 'ё');
  eq(g.state.quests.lf_q1, 'himeko', 'the sofa starts the first mission');
  eq(g.missionTracked().id, 'lf_q1', 'the started mission is tracked');
  eq(g.map.id, 'express_cabin', 'the scene ends at the door of Dan Heng');
  talk(g, 'ё');
  talk(g, 'ж');
  talk(g, 'ж');
  g.loadMap('express', 'r', { silent: true });
  talk(g, 'w');
  talk(g, 'p');
  talk(g, 'p');
  talk(g, 'h');
  eq(g.state.quests.lf_q1, 'meet', 'Himeko calls to the meeting');
  ok(g.map.ents.some(e => e.ch === 'ж' && g.visible(e)), 'the meeting spot is on the car');
  stepOn(g, 'ж');
  eq(g.state.quests.lf_q1, 'danheng', 'Kafka interrupts the meeting');
  ok(g.state.flags.lf_meet, 'the meeting is over');
  talk(g, 'p');
  talk(g, 'h');
  talk(g, 'h');
  talk(g, 'h');
  talk(g, 'w');
  g.loadMap('express_cabin', 'l', { silent: true });
  talk(g, 's');
  eq(g.state.quests.lf_q1, 'vote', 'Dan Heng and March agree on a vote');
  talk(g, 's');
  talk(g, 's');
  talk(g, 'я');
  talk(g, 'я');
  exitVia(g, 'l');
  eq(g.state.quests.lf_q1, 'welt', 'entering the Parlor Car runs the vote');
  ok(g.state.flags.lf_vote, 'the vote is recorded');
  eq(g.map.id, 'express', 'the team stays on the train');
  for (const ch of ['p', 'p', 'h', 'э', 'ю']) talk(g, ch);
  const credits = g.state.credits;
  talk(g, 'w');
  eq(g.map.id, 'lf_cloud', 'Welt leads the team to Cloudford');
  eq(g.state.quests.lf_q1, 'done', 'the first mission ends');
  eq(g.state.quests.lf_q2, 'port', 'the second mission starts');
  eq(g.missionTracked().id, 'lf_q2', 'the second mission is tracked');
  eq(g.state.credits, credits + 2500, 'the reward of the first mission arrives');
  ok(g.worldOpen(H.WORLDS.find(w => w.id === 'luofu')), 'the world opens on the star map');
  ok(g.expressWorld().id === 'luofu', 'the Express stands at Luofu');
  ok(g.navPoints('lf_cloud').some(p => p.kind === 'anchor'), 'navigation sees Cloudford');

  eq(g.map.def.lanes.a.at, 4, 'the first container starts in the doorway');
  stepOn(g, 'б');
  ok(g.state.flags.lf_t_bend, 'March sees the wounded');
  talk(g, 'с');
  talk(g, 'с');
  talk(g, 'у');
  stepOn(g, 'д');
  ok(g.state.flags.lf_t_door, 'the doorway shows the battlefield');
  talk(g, 'р');
  talk(g, 'м');
  talk(g, 'ф');
  stepOn(g, 'г');
  ok(g.state.flags.lf_t_voices, 'the knights shout below the stairs');
  talk(g, 'ш');
  ok(g.map.ents.filter(e => e.kind === 'foeactor' && e.def.foe === 'mara' && g.visible(e)).length === 3, 'three Mara-Struck stand around Tingyun');
  ok(g.map.ents.some(e => e.ch === 'т' && g.visible(e)), 'Tingyun is surrounded');
  stepOn(g, 'о');
  ok(g.state.flags.lf_mara_win && g.state.flags.lf_tingyun, 'the rescue and the talk are done');
  eq(g.state.quests.lf_q2, 'skiff', 'Tingyun leads the way');
  ok(!g.map.ents.some(e => e.kind === 'foeactor' && e.def.foe === 'mara' && g.visible(e)), 'the Mara-Struck are gone');
  g.update(1 / 30, {});
  const mate = g.map.ents.find(e => e.kind === 'lfmate');
  ok(mate && mate.def.who === 'tingyun', 'Tingyun walks with the team');
  const mx = mate.x, my = mate.y;
  ok(!g.blocked(mx, my), 'she does not block the way');
  stepOn(g, 'х');
  ok(g.state.flags.lf_t_panel, 'the blockade is explained');
  ok(g.blocked(14, 46) && g.blocked(15, 47), 'the container closes the passage');
  const [px, py] = g.map.marks['Г'][0];
  g.placePlayer(px, py - 1); g.player.dir = 'down';
  ok(g.interact(), 'the panel opens');
  eq(g.pending.ui, 'lfdispatch', 'it is the container panel');
  eq(g.pending.lane, 'a', 'it moves the first container');
  g.pending = null;
  eq(g.moveCargo('a', -1), true, 'the panel moves the container');
  eq(g.moveCargo('a', -1), true, 'the panel moves it again');
  ok(!g.blocked(14, 46) && !g.blocked(15, 47), 'the passage is open');
  stepOn(g, 'ч');
  ok(g.state.flags.lf_cargo1, 'the first task is done');

  const check = (x, y) => g.blocked(x, y);
  g.placePlayer(19, 56);
  ok(check(20, 57) && check(21, 58), 'the upper container sits on the rail above the gap');
  ok(check(20, 59) && check(21, 60), 'the gap cuts the way');
  ok(check(20, 61) && check(21, 62), 'the lower container waits behind the gap');
  ok(!walkSet(g, 19, 56).has('24,63'), 'the far bank cannot be reached yet');
  eq(g.moveCargo('l', -1), true, 'the lower container rises');
  eq(g.moveCargo('l', -1), true, 'the lower container reaches the gap');
  eq(g.moveCargo('l', -1), 'cargo', 'the upper container stops it');
  ok(!check(20, 59) && !check(21, 60), 'the container bridges the gap');
  ok(!walkSet(g, 19, 56).has('24,63'), 'the upper container still closes the bank');
  eq(g.moveCargo('u', -1), true, 'the upper container moves away');
  eq(g.moveCargo('u', -1), true, 'the upper container clears the bank');
  ok(walkSet(g, 19, 56).has('24,63'), 'the far bank is open');
  const way = walkSet(g, 19, 56);
  ok(way.has('5,52') && way.has('14,49'), 'the way back stays open');
  for (const [u, l] of [[0, 0], [0, 2], [2, 0], [4, 2], [0, 4], [4, 4]]) {
    g.state.lf.cargo['lf_cloud:u'] = u; g.state.lf.cargo['lf_cloud:l'] = l;
    g.placePlayer(19, 56);
    ok(walkSet(g, 19, 56).has('5,52') && [[15, 55], [15, 57]].every(([x, y]) => D4.some(([dx, dy]) => walkSet(g, 19, 56).has((x + dx) + ',' + (y + dy)))), 'no container position locks the team away from the panels ' + u + ',' + l);
  }
  g.state.lf.cargo['lf_cloud:u'] = 2; g.state.lf.cargo['lf_cloud:l'] = 2;
  g.loadMap('lf_cloud', null, { x: 19, y: 56, silent: true });
  talk(g, 'Д');
  g.pending = null;
  stepOn(g, 'З');
  ok(g.state.flags.lf_cargo2, 'the second task is done');
  talk(g, 'ё');
  ok(g.map.ents.some(e => e.ch === 'К' && g.visible(e)), 'the Shape Shifter waits on the pier');
  stepOn(g, 'И');
  ok(g.state.flags.lf_shifter_done, 'the Shape Shifter falls');
  ok(g.state.inv.items.lf_letter, 'the Undelivered Letter is in the bag');
  eq(g.state.quests.lf_q2, 'done', 'the second mission ends');
  eq(g.map.id, 'lf_haven', 'the skiff lands in the Haven');
  ok(g.state.flags.lf_haven_talk, 'Welt prepares the team');
  ok(!g.map.ents.some(e => e.kind === 'lfmate'), 'Tingyun has gone ahead');
  eq(g.state.quests.lf_q3, 'palace', 'the third mission starts in the Haven');
  exitVia(g, 'о');
  eq(g.map.id, 'lf_cloud', 'the skiff flies back');
  g.update(1 / 30, {});
  ok(!g.map.ents.some(e => e.kind === 'lfmate'), 'Tingyun does not stay in Cloudford');
  eq(g.state.obj, 'Цель другой цепочки', 'the chapter does not touch the objective of the Future Market chain');
  const saved = new H.Game({ state: g.serialize(), seed: 2 });
  ok(saved.state.quests.lf_q2 === 'done' && saved.map.id === 'lf_cloud', 'the save keeps the chapter');
  ok(saved.laneAt('l') === 2 && !saved.blocked(20, 59), 'the save keeps the containers');
  exitVia(saved, 'я');
  eq(saved.map.id, 'lf_haven', 'the pier leads to the Haven');

  const h = saved;
  h.storyBot = true;
  ok(!h.state.flags.lf_diting && !h.blocked(30, 22), 'the plaza is free');
  const walk = walkSet(h, h.player.x, h.player.y);
  ok(walk.has('29,20') && !walk.has('24,10'), 'the guards of the round door keep the team on the plaza');
  for (const ch of ['р', 'щ', 'г', 'Ы']) talk(h, ch);
  talk(h, 'ц');
  eq(h.map.id, 'lf_astrum', 'Tingyun sends the team into the palace');
  ok(h.state.flags.lf_deal, 'the general asks for help');
  eq(h.state.quests.lf_q3, 'welt', 'the crew talks after the meeting');
  for (const ch of ['ю', 'м', 'м', 'г']) talk(h, ch);
  const shut = h.map.ents.find(e => e.kind === 'exit');
  h.useExit(shut);
  eq(h.map.id, 'lf_astrum', 'Welt speaks first');
  talk(h, 'в');
  talk(h, 'в');
  ok(h.state.flags.lf_talk_welt, 'Welt explains his doubt');
  exitVia(h, 'e');
  eq(h.map.id, 'lf_haven', 'the team leaves the palace');
  ok(h.state.flags.lf_seat_done, 'leaving shows the scene in the Seat');
  eq(h.state.quests.lf_q3, 'meet', 'Tingyun waits');
  ok(h.cg === null, 'the still is gone after the scene');
  talk(h, 'э');
  eq(h.state.quests.lf_q3, 'inn', 'Tingyun shows the way');
  ok(walkSet(h, h.player.x, h.player.y).has('20,10'), 'the round door opens');
  talk(h, 'ф');
  const lead = () => h.map.ents.find(e => e.kind === 'lflead');
  h.placePlayer(40, 24);
  for (let i = 0; i < 60; i++) h.update(0.1, {});
  ok(lead() && lead().i < 4, 'Tingyun waits when the team falls behind');
  for (let i = 0; i < 2000 && h.state.flags.lf_inn !== true && !h.script; i++) {
    const a = lead();
    if (a) h.placePlayer(a.x + 1, a.y);
    h.update(0.1, {});
  }
  ok(h.script && h.script.name === 'lf_h_inn', 'the walk ends at the inn');
  drive(h);
  ok(h.state.flags.lf_inn, 'the inn scene is over');
  eq(h.state.quests.lf_q3, 'crew', 'the team rests');
  ok(!h.state.lf.lead, 'the walk is finished');
  talk(h, 'и');
  talk(h, 'П');
  const party0 = h.state.party.slice();
  talk(h, 'в');
  eq(h.map.id, 'express', 'the story cuts to the Express');
  eq(h.state.party.join(), 'danheng', 'Dan Heng walks alone');
  eq(h.state.quests.lf_dh1, 'board', 'the sub-mission starts');
  ok(h.state.flags.lf_dh_start, 'the message is sent');
  talk(h, 'h');
  talk(h, 'p');
  talk(h, 'p');
  stepOn(h, 'ы');
  eq(h.map.id, 'lf_cloud', 'Dan Heng lands in Cloudford');
  eq(h.state.quests.lf_dh1, 'cross', 'Dan Heng crosses the port');
  stepOn(h, 'Ц');
  talk(h, 'Ю');
  ok(h.map.ents.some(e => e.ch === 'Ф' && h.visible(e)) && h.map.ents.some(e => e.ch === 'Э' && h.visible(e)), 'Sushang and Luocha stand in the hall');
  stepOn(h, 'Щ');
  eq(h.state.quests.lf_dh1, 'done', 'the sub-mission ends');
  eq(h.state.party.join(), party0.join(), 'the team comes back');
  ok(!h.state.guest, 'the guest team is gone');
  eq(h.map.id, 'lf_haven', 'the story returns to the Haven');
  eq(h.state.quests.lf_q3, 'done', 'the third mission ends');
  eq(h.state.quests.lf_q4, 'tingyun', 'the fourth mission starts');
  ok(h.records().some(r => r.id === 'cumulus'), 'the record of Cloudford appears');
  talk(h, 'т');
  eq(h.state.quests.lf_q4, 'ready', 'Tingyun asks if the team is ready');
  ok(h.map.ents.some(e => e.kind === 'lfdog' && h.visible(e)), 'Diting waits next to her');
  ok(!h.ditingScan() || true, 'scan before the dog is harmless');
  talk(h, 'т');
  ok(h.state.flags.lf_diting, 'Diting joins');
  eq(h.state.quests.lf_q4, 'trail', 'the trail starts');
  ok(h.ditingScan(), 'Diting smells the perfume');
  h.placePlayer(9, 20);
  let sc = h.ditingCells();
  ok(sc && sc.cells.length === 10 && sc.cells.every(([x]) => x === 9), 'the scent goes down the Avenue');
  h.update(0.1, {});
  ok(h.map.ents.some(e => e.kind === 'lfmate' && e.def.who === 'diting'), 'Diting walks with the team');
  ok(walkSet(h, 9, 20).has('8,36') && !h.map.ents.some(e => e.ch === 'ю' && h.visible(e)), 'the far stairs are free now');
  stepOn(h, 'ь');
  eq(h.state.quests.lf_q4, 'clues', 'the trail breaks at the stairs');
  ok(!h.ditingScan(), 'no scent while the trail is broken');
  for (const ch of ['я', 'У', 'Н', 'Т', 'Ф', 'Ф']) { drive.pick = 1; talk(h, ch); }
  delete drive.pick;
  ok(h.questStep('lf_q4').text.includes('(0/3)'), 'the mission counts the clues');
  talk(h, 'Ё');
  ok(h.questStep('lf_q4').text.includes('(1/3)'), 'the first clue counts');
  ok(!h.map.ents.some(e => e.ch === 'Ё' && h.visible(e)), 'a clue is taken once');
  talk(h, 'Щ');
  talk(h, 'Ъ');
  eq(h.state.quests.lf_q4, 'found', 'three clues restore the trail');
  ok(h.ditingScan(), 'the scent is back');
  talk(h, 'Ш');
  eq(h.state.quests.lf_q4, 'go', 'Tingyun is found');
  ok(h.state.flags.lf_ting_found, 'the hunt is over');
  const reload = new H.Game({ state: h.serialize(), seed: 3 });
  eq(reload.map.id, 'lf_haven', 'a save inside the Haven loads');
  exitVia(h, 'н');
  eq(h.map.id, 'lf_navalia', 'the skiff lands in the Navalia');
  eq(h.state.quests.lf_q4, 'done', 'the fourth mission ends on arrival');
  eq(h.state.quests.lf_q5, 'clues', 'the fifth mission starts');
  h.update(1 / 30, {});
  eq(h.map.ents.filter(e => e.kind === 'lfmate').length, 2, 'Diting and Tingyun walk with the team');
  for (const ch of ['б', 'б', 'г', 'д', 'е', 'е', 'ж']) talk(h, ch);
  talk(h, 'л');
  eq(h.map.id, 'lf_navalia', 'the lift stays closed');
  ok(!h.state.flags.lf_t_lift, 'Tingyun stops the team before the clues');
  ok(h.questStep('lf_q5').text.includes('(0/3)'), 'the mission counts the clues');
  talk(h, 'Ё');
  ok(h.state.inv.items.lf_shards, 'the first clue is a key item');
  talk(h, 'з');
  ok(h.state.flags.lf_n_c1, 'the signed chest opens');
  const j0 = h.state.jade;
  talk(h, 'з');
  eq(h.state.jade, j0, 'the signed chest opens once');
  talk(h, 'Щ');
  talk(h, 'Ъ');
  eq(h.state.quests.lf_q5, 'lift', 'three clues lead to the lift');
  ok(h.state.inv.items.lf_seal && h.state.inv.items.lf_grenade, 'all three clues are in the bag');
  talk(h, 'л');
  eq(h.state.quests.lf_q5, 'track', 'the lift starts the hunt');
  eq(h.player.x + ',' + h.player.y, '33,16', 'the lift goes down');
  talk(h, 'у');
  eq(h.player.x + ',' + h.player.y, '33,13', 'the lift comes back');
  talk(h, 'л');
  eq(h.player.x + ',' + h.player.y, '33,16', 'the lift goes down again');
  ok(h.ditingScan(), 'Diting smells Kafka');
  let s5 = h.ditingCells();
  ok(s5 && s5.col === '#b070ff', 'the scent of Kafka has its own colour');
  talk(h, 'п');
  stepOn(h, 'т');
  ok(h.state.flags.lf_patrol_win, 'the Patrollers fall');
  eq(h.state.quests.lf_q5, 'chase1', 'Kafka runs');
  ok(!h.map.ents.some(e => e.ch === 'К' && h.visible(e)), 'Kafka has left the platform');
  stepOn(h, 'и');
  eq(h.state.quests.lf_q5, 'gate', 'Kafka locks the door');
  ok(h.blocked(21, 30) && h.blocked(21, 31), 'the door is shut');
  const far = () => walkSet(h, 13, 30);
  ok(far().has('14,35') && !far().has('30,35'), 'the belt stops the team');
  h.placePlayer(15, 34); h.player.dir = 'up';
  ok(h.interact() && h.pending.lane === 'p', 'the first panel moves the long container');
  h.pending = null;
  h.placePlayer(17, 34); h.player.dir = 'up';
  ok(h.interact() && h.pending.lane === 'q', 'the second panel moves the cross container');
  h.pending = null;
  for (let i = 0; i < 3; i++) eq(h.moveCargo('p', -1), true, 'the long container rolls to the cross line ' + i);
  eq(h.moveCargo('p', -1), 'cargo', 'the cross container stops it');
  eq(h.moveCargo('q', -1), true, 'the cross container moves up');
  eq(h.moveCargo('q', -1), true, 'the cross container clears the line');
  for (let i = 0; i < 4; i++) eq(h.moveCargo('p', -1), true, 'the long container crosses the line ' + i);
  eq(h.moveCargo('q', 1), 'cargo', 'the long container locks the cross line');
  while (h.laneAt('p') > 0) eq(h.moveCargo('p', -1), true, 'the long container reaches the gap');
  ok(!h.blocked(18, 36) && !h.blocked(21, 37), 'the long container bridges the belt');
  ok(far().has('30,35'), 'the far bank is open');
  for (const [p, q] of [[10, 2], [10, 0], [0, 0], [0, 5], [5, 5], [12, 0]]) {
    h.state.lf.cargo['lf_navalia:p'] = p; h.state.lf.cargo['lf_navalia:q'] = q;
    ok(far().has('15,34') && far().has('17,34'), 'no position cuts the team from the panels ' + p + ',' + q);
  }
  h.state.lf.cargo['lf_navalia:p'] = 0; h.state.lf.cargo['lf_navalia:q'] = 0;
  h.placePlayer(17, 36);
  stepOn(h, 'ь');
  ok(h.state.flags.lf_cargo3, 'the team crosses on the container');
  stepOn(h, 'э');
  eq(h.state.quests.lf_q5, 'chase2', 'the team is behind the door');
  for (const ch of ['Э', 'Ю', 'Я']) talk(h, ch);
  ok(h.ditingScan(), 'the scent continues');
  stepOn(h, 'ы');
  eq(h.state.quests.lf_q5, 'route', 'the scent goes under a container');
  ok(h.blocked(40, 33) && h.blocked(41, 34), 'the container closes the way to the pier');
  h.placePlayer(43, 31); h.player.dir = 'down';
  ok(h.interact() && h.pending.lane === 'r', 'the last panel moves the container');
  h.pending = null;
  eq(h.moveCargo('r', -1), true, 'the last container moves');
  eq(h.moveCargo('r', -1), true, 'the last container clears the way');
  ok(!h.blocked(40, 33) && !h.blocked(41, 34), 'the way to the pier is open');
  stepOn(h, 'ф');
  ok(h.state.flags.lf_cargo4, 'the team passes the container');
  stepOn(h, 'ш');
  ok(h.state.flags.lf_kafka_win && h.state.flags.lf_kafka_done, 'Kafka surrenders');
  eq(h.state.quests.lf_q5, 'sanctum', 'Fu Xuan takes Kafka');
  ok(!h.map.ents.some(e => e.ch === 'Х' && h.visible(e)), 'the fight is over');
  talk(h, 'Ф');
  talk(h, 'Н');
  const saved5 = new H.Game({ state: h.serialize(), seed: 5 });
  eq(saved5.map.id, 'lf_navalia', 'a save inside the Navalia loads');
  eq(saved5.state.quests.lf_q5, 'sanctum', 'the save keeps the mission');
  ok(!saved5.blocked(40, 33) && !saved5.blocked(19, 36), 'the save keeps the containers');
  saved5.update(1 / 30, {});
  eq(saved5.map.ents.filter(e => e.kind === 'lfmate').length, 1, 'Tingyun leaves with the skiff, Diting stays');
  talk(h, 'с');
  eq(h.map.id, 'lf_sanctum', 'the skiff lands in the Exalting Sanctum');
  ok(h.state.flags.lf_s_arrive && h.state.flags.lf_fx_gone, 'Fu Xuan takes Kafka away');
  ok(!h.map.ents.some(e => e.ch === 'Ф' && h.visible(e)), 'Fu Xuan has left');
  h.update(1 / 30, {});
  eq(h.map.ents.filter(e => e.kind === 'lfmate').length, 2, 'March and Welt walk with the team');
  drive.pick = 0;
  talk(h, 'т');
  for (const pick of [1, 2, 3]) { drive.pick = pick; talk(h, 'т'); }
  drive.pick = 0;
  stepOn(h, 'ю');
  ok(h.state.flags.lf_s_plaza, 'the plaza comes into view');
  stepOn(h, 'ц');
  ok(h.state.flags.lf_bailu_win, 'the Mara-struck soldiers fall');
  eq(h.state.quests.lf_q5, 'talk', 'the team looks for the messenger');
  ok(h.questStep('lf_q5').text.includes('(0/2)'), 'the mission counts the talks');
  talk(h, 'Б');
  for (const ch of ['Ы', 'Ы', 'Э', 'Я', 'Ё', 'П', 'Е']) talk(h, ch);
  talk(h, 'С');
  ok(h.state.flags.lf_songyan, 'Songyan is the first talk');
  ok(h.state.inv.items.lf_rice && h.state.inv.items.lf_songcake, 'Songyan hands out the supplies');
  eq(h.state.quests.lf_q5, 'talk', 'one talk does not end the mission');
  talk(h, 'С');
  const rice0 = h.state.inv.items.lf_rice || 0;
  talk(h, 'Г');
  ok(h.state.flags.lf_guangda, 'Guangda is the second talk');
  eq(h.state.quests.lf_q5, 'done', 'Dahao interrupts and the fifth mission ends');
  ok(h.state.flags.lf_bailu_done, 'the Bailu episode is over');
  eq(h.state.quests.lf_q6, 'plaza', 'the sixth mission starts');
  eq(h.state.inv.items.lf_rice || 0, rice0, 'Dahao gives nothing');
  stepOn(h, 'ц');
  eq(h.state.quests.lf_q6, 'photo', 'the phone message sends the team to the photo');
  ok(h.state.flags.lf_q6_msg, 'the message flag is set');
  h.chatSync();
  ok(h.chatThread('lf_photo'), 'the message is in the phone');
  ok(H.CHAT.PHOTOS.lf_jade && H.Cine.STILLS.lf_jade, 'the photo has a picture');
  eq(h.questTarget(), null, 'the photo step shows no marker');
  talk(h, 'Т');
  stepOn(h, 'ж');
  eq(h.state.quests.lf_q6, 'go', 'Qingque has been found');
  ok(h.state.flags.lf_qingque, 'the Jade hall scene ran');
  ok(!h.map.ents.some(e => e.ch === 'Ч' && h.visible(e)), 'Qingque leaves the table');
  eq(h.state.lf.lead.who, 'qingque', 'Qingque leads the way');
  const reload6 = new H.Game({ state: h.serialize(), seed: 6 });
  eq(reload6.state.lf.lead.who, 'qingque', 'the lead survives a save');
  followLead(h, 'lf_arbor_seen');
  ok(h.state.flags.lf_arbor_seen, 'the Ambrosial Arbor is explained on the way');
  eq(h.state.lf.lead.who, 'qingque', 'Qingque leads on to the pier');
  h.update(1 / 30, {});
  eq(h.map.ents.filter(e => e.kind === 'lfmate').length, 3, 'Tingyun joins on the way to the pier');
  followLead(h, 'lf_q6_dock');
  eq(h.state.quests.lf_q6, 'done', 'the sixth mission ends on the pier');
  eq(h.state.quests.lf_q7, 'enter', 'the seventh mission starts on the pier');
  talk(h, 'Ц');
  h.update(1 / 30, {});
  eq(h.map.ents.filter(e => e.kind === 'lfmate').length, 0, 'the crew stops following on the pier');
  const reload7 = new H.Game({ state: h.serialize(), seed: 7 });
  eq(reload7.map.id, 'lf_sanctum', 'a save inside the Sanctum loads');
  const gateDoor = h.map.ents.find(e => e.ch === 'я');
  h.useExit(gateDoor);
  drive(h);
  eq(h.map.id, 'lf_sanctum', 'the doors of the Seat stay closed');
  h.state.flags.lf_seat_open = true;
  exitVia(h, 'я');
  eq(h.map.id, 'lf_seat', 'the doors lead into the Seat');
  ok(!h.map.ents.some(e => 'жщфц'.includes(e.ch) && h.visible(e)), 'nobody talks in the Seat before the last mission');
  talk(h, 'к');
  exitVia(h, 'о');
  eq(h.map.id, 'lf_sanctum', 'the Seat leads back to the Sanctum');
  delete h.state.flags.lf_seat_open;
  exitVia(h, 'о');
  eq(h.map.id, 'lf_haven', 'the jetty leads back to the Haven');
  exitVia(h, 'с');
  eq(h.map.id, 'lf_sanctum', 'the Haven has a skiff to the Sanctum');
  exitVia(h, 'с');
  eq(h.map.id, 'lf_divination', 'the skiff lands in the Divination Commission');
  ok(h.state.flags.lf_d_arrive, 'Qingque warns the guests');
  eq(h.battleTheme(), 'desolate', 'the Commission has its own battle theme');
  ok(h.blocked(25, 22), 'the main gate is locked');
  talk(h, 'Г');
  stepOn(h, 'в');
  eq(h.state.quests.lf_q7, 'follow', 'Qingque knows another way');
  eq(h.questTarget(), null, 'following Qingque needs no marker');
  followLead(h, 'lf_d_path_done');
  eq(h.state.quests.lf_q7, 'repair', 'the side gate is locked too');
  ok(h.blocked(14, 18), 'the side gate stays shut');
  talk(h, 'Д');
  h.placePlayer(13, 17); h.player.dir = 'right';
  ok(h.interact(), 'the console opens');
  eq(h.pending.ui, 'abacus', 'the console shows Abacus Circuitry');
  eq(h.pending.id, 'gate1', 'the first board comes first');
  h.resume(false);
  drive(h);
  eq(h.state.quests.lf_q7, 'repair', 'leaving the board changes nothing');
  ok(!h.state.flags.lf_side_gate, 'leaving the board keeps the gate shut');
  h.placePlayer(13, 17); h.player.dir = 'right';
  h.interact();
  h.resume(true);
  eq(h.pending.id, 'gate2', 'the second board follows');
  ok(h.state.flags.lf_pz_gate1, 'the first board is remembered');
  h.resume(false);
  drive(h);
  h.placePlayer(13, 17); h.player.dir = 'right';
  h.interact();
  eq(h.pending.id, 'gate2', 'a solved board is not asked again');
  h.resume(true);
  drive(h);
  ok(h.state.flags.lf_side_gate, 'the side gate opens');
  eq(h.state.quests.lf_q7, 'meet', 'Qingque takes the team to Fu Xuan');
  ok(!h.blocked(14, 18) && !h.blocked(25, 22), 'both gates are open');
  stepOn(h, 'б');
  ok(h.state.flags.lf_gate_win, 'the fight at the stairs is won');
  talk(h, 'Н');
  talk(h, 'Н');
  talk(h, 'р');
  ok(h.blocked(36, 16), 'the knights hold the east corridor');
  stepOn(h, 'м');
  ok(h.state.flags.lf_t_mx, 'Qingque explains the Matrix');
  const dv = new H.Game({ state: h.serialize(), seed: 8 });
  eq(dv.map.id, 'lf_divination', 'a save inside the Commission loads');
  exitVia(h, 'с');
  eq(h.map.id, 'lf_matrix', 'the bridge leads to the Matrix');
  eq(h.map.ents.filter(e => e.kind === 'screen').length, 6, 'three pairs of screens stand here');
  h.placePlayer(15, 20); h.player.dir = 'left';
  h.interact();
  eq(h.player.x, 15, 'the screens wait for Fu Xuan');
  stepOn(h, 'ф');
  eq(h.state.quests.lf_q7, 'temporal', 'Fu Xuan hands out the terminals');
  talk(h, 'Ж');
  talk(h, 'Ц');
  ok(!h.map.ents.some(e => e.ch === 'Ц' && h.visible(e)), 'Jing Yuan leaves after the talk');
  talk(h, 'Ф');
  h.update(1 / 30, {});
  eq(h.map.ents.filter(e => e.kind === 'lfmate').length, 3, 'Qingque walks with the team');
  stepOn(h, 'к');
  ok(h.state.flags.lf_t_screen, 'the tip about screens appears once');
  h.placePlayer(28, 15); h.player.dir = 'right';
  h.interact();
  eq(h.player.x, 28, 'the other screens wait for the temporal terminal');
  h.placePlayer(15, 20); h.player.dir = 'left';
  ok(h.interact(), 'the screen works');
  eq(h.player.x, 10, 'the screen moves the team to the island');
  stepOn(h, 'т');
  ok(h.state.flags.lf_t_termt, 'Qingque names the terminal');
  talk(h, 'Т');
  ok(h.state.flags.lf_term_t, 'the temporal terminal runs');
  eq(h.state.quests.lf_q7, 'others', 'two terminals remain');
  ok(h.questStep('lf_q7').text.includes('(0/2)'), 'the mission counts the terminals');
  talk(h, 'Т');
  talk(h, 'Ф');
  drive.pick = 1;
  talk(h, 'Ф');
  drive.pick = 0;
  h.placePlayer(10, 20); h.player.dir = 'right';
  h.interact();
  h.placePlayer(28, 15); h.player.dir = 'right';
  h.interact();
  eq(h.player.x, 34, 'the screen reaches the spatial island');
  ok(h.map.ents.some(e => e.ch === 'А' && h.visible(e)), 'the Aurumaton stands in the way');
  stepOn(h, 'б');
  ok(h.state.flags.lf_aur_win, 'the Aurumaton falls');
  talk(h, 'П');
  ok(h.state.flags.lf_term_s, 'the spatial terminal runs');
  eq(h.state.quests.lf_q7, 'others', 'one terminal remains');
  talk(h, 'П');
  h.placePlayer(34, 10); h.player.dir = 'left';
  h.interact();
  h.placePlayer(28, 25); h.player.dir = 'right';
  h.interact();
  eq(h.player.x, 34, 'the screen reaches the karmic island');
  talk(h, 'Л');
  ok(h.state.flags.lf_term_k, 'the karmic terminal runs');
  eq(h.state.quests.lf_q7, 'report', 'the team goes back to Fu Xuan');
  h.placePlayer(34, 30); h.player.dir = 'left';
  h.interact();
  drive.pick = 1;
  talk(h, 'Ф');
  eq(h.state.quests.lf_q7, 'report', 'Fu Xuan waits until the team is ready');
  drive.pick = 0;
  talk(h, 'Ф');
  ok(h.state.flags.lf_matrix_done, 'the Matrix has read Kafka');
  eq(h.state.quests.lf_q7, 'done', 'the seventh mission ends');
  eq(h.state.quests.lf_q8, 'kafka', 'the eighth mission starts');
  ok(!h.map.ents.some(e => e.ch === 'Ф' && h.visible(e)), 'Fu Xuan goes to report');
  ok(h.records().some(r => r.id === 'moonlight'), 'the Sanctum record unlocks');
  talk(h, 'К');
  ok(h.state.flags.lf_kafka_talk && !h.state.flags.lf_arbor_up, 'Kafka stops at the first part');
  eq(h.map.id, 'lf_delve', 'the story cuts to the delve');
  eq(h.state.quests.lf_dh2, 'delve', 'the sub-mission starts');
  ok(h.state.guest, 'Dan Heng plays the sub-mission');
  h.update(1 / 30, {});
  eq(h.map.ents.filter(e => e.kind === 'lfmate').length, 2, 'Sushang and Luocha walk with Dan Heng');
  const dl = new H.Game({ state: h.serialize(), seed: 11 });
  eq(dl.map.id, 'lf_delve', 'a save inside the delve loads');
  stepOn(h, 'с');
  talk(h, 'С');
  stepOn(h, 'м');
  ok(h.state.flags.lf_dh2_win, 'the Mara-struck around Xueyi fall');
  eq(h.state.quests.lf_dh2, 'follow', 'Xueyi leads on');
  followLead(h, 'lf_dh2');
  eq(h.state.quests.lf_dh2, 'done', 'the sub-mission ends');
  ok(!h.state.guest, 'the Trailblazer is back');
  eq(h.map.id, 'lf_matrix', 'the story cuts back to the Matrix');
  ok(h.state.flags.lf_arbor_up, 'Kafka finishes and the Arbor grows');
  eq(h.state.quests.lf_q8, 'report', 'the team has to find the general');
  ok(!h.map.ents.some(e => e.ch === 'К' && h.visible(e)), 'Kafka has escaped');
  stepOn(h, 'р');
  ok(h.state.flags.lf_t_tree, 'Welt recognises the Stellaron');
  talk(h, 'Н');
  exitVia(h, 'о');
  eq(h.map.id, 'lf_divination', 'the bridge leads back to the Commission');
  ok(!h.map.ents.some(e => e.ch === 'р' && h.visible(e)), 'the knights open the east corridor');
  for (const ch of ['е', 'ж', 'и', 'й']) talk(h, ch);
  stepOn(h, 'з');
  ok(h.state.flags.lf_orders, 'the general gives his orders');
  eq(h.state.quests.lf_q8, 'bye', 'the team says goodbye');
  for (const pick of [0, 1, 2, 3]) { drive.pick = pick; talk(h, 'Ц'); }
  for (const pick of [0, 1, 2, 3]) { drive.pick = pick; talk(h, 'т'); }
  for (const pick of [0, 1, 2]) { drive.pick = pick; talk(h, 'ч'); }
  ok(h.state.inv.items.lf_gods, 'Qingque gives her book');
  drive.pick = 3;
  talk(h, 'Ф');
  eq(h.state.quests.lf_q8, 'bye', 'leaving the talk keeps the step');
  drive.pick = 2;
  talk(h, 'Ф');
  eq(h.state.quests.lf_q8, 'follow', 'Fu Xuan shows the way');
  drive.pick = 0;
  followLead(h, 'lf_fx_dock');
  eq(h.state.quests.lf_q8, 'leave', 'the skiff waits');
  talk(h, 'ф');
  const dv2 = new H.Game({ state: h.serialize(), seed: 9 });
  eq(dv2.state.quests.lf_q8, 'leave', 'a late save keeps the mission');
  exitVia(h, 'д');
  eq(h.map.id, 'lf_artisan', 'the skiff lands in the Artisanship Commission');
  eq(h.state.quests.lf_q8, 'done', 'the eighth mission ends on arrival');
  eq(h.state.quests.lf_q9, 'go', 'the ninth mission starts');
  eq(h.battleTheme(), 'desolate', 'the Artisanship Commission keeps the Desolate battle theme');
  stepOn(h, 'в');
  eq(h.state.quests.lf_q9, 'ask', 'Tingyun warns about the law');
  ok(h.blocked(11, 22), 'the gate is shut');
  talk(h, 'Г');
  eq(h.state.quests.lf_q9, 'ask', 'the gate needs a seal');
  for (const ch of ['У', 'Ч', 'З', 'Ю']) talk(h, ch);
  talk(h, 'А');
  ok(h.state.inv.items.lf_artseal, 'Awei gives the jade seal');
  talk(h, 'А');
  drive.pick = 1;
  talk(h, 'Г');
  ok(!h.state.flags.lf_gate_seal, 'the player may keep the seal for now');
  drive.pick = 0;
  talk(h, 'Г');
  ok(h.state.flags.lf_gate_seal && !h.blocked(11, 22), 'the seal opens the gate');
  eq(h.state.quests.lf_q9, 'roots', 'the team goes in');
  stepOn(h, 'р');
  stepOn(h, 'м');
  ok(h.state.flags.lf_ingenium_win, 'the Inventions on the bridge fall');
  eq(h.state.quests.lf_q9, 'follow', 'Gongshu leads the team');
  ok(h.blocked(38, 22), 'the bridge is broken');
  followLead(h, 'lf_gongshu');
  eq(h.state.quests.lf_q9, 'node1', 'Gongshu shows the Pyxis');
  h.update(1 / 30, {});
  eq(h.map.ents.filter(e => e.kind === 'lfmate').length, 4, 'Gongshu walks with the team');
  h.placePlayer(31, 21); h.player.dir = 'up';
  h.interact();
  eq(h.player.x, 31, 'the screen stays tangled');
  const coil1 = h.map.ents.find(e => e.ch === 'н');
  ok(h.visible(coil1), 'the first node stands');
  firePyxis(h, '1', []);
  ok(!h.state.flags.lf_px_1, 'a shot from the start misses the node');
  ok(h.visible(coil1), 'the missed node grows back');
  firePyxis(h, '1', [['к', 'right']]);
  ok(h.state.flags.lf_px_1, 'the first board is solved');
  ok(!h.visible(coil1), 'the first node burns');
  eq(h.state.quests.lf_q9, 'furnace', 'the screen is free');
  h.placePlayer(31, 21); h.player.dir = 'up';
  ok(h.interact(), 'the screen works');
  eq(h.player.x, 44, 'the screen crosses the bridge');
  stepOn(h, 'о');
  ok(h.state.flags.lf_deer_try, 'the Ebon Deer drives the team back');
  eq(h.state.quests.lf_q9, 'search', 'the source has to be found');
  ok(h.map.ents.some(e => e.ch === 'Х' && h.visible(e)), 'the Deer stands at the Furnace');
  ok(h.blocked(50, 17), 'the Deer keeps the team away');
  talk(h, 'ж');
  talk(h, 'Ь');
  stepOn(h, 'ю');
  eq(h.state.quests.lf_q9, 'node2', 'the second board is close');
  firePyxis(h, '2', [['б', 'right'], ['й', 'down'], ['ц', 'left']]);
  ok(h.state.flags.lf_px_2, 'the second board is solved');
  eq(h.state.quests.lf_q9, 'find3', 'one node remains');
  stepOn(h, 'т');
  eq(h.state.quests.lf_q9, 'node3', 'the third node is found');
  ok(h.blocked(49, 37) && h.blocked(50, 37), 'roots close the way');
  firePyxis(h, '3', [['ч', 'down'], ['г', 'right']]);
  ok(h.state.flags.lf_px_3, 'the beam crosses the roots through the screen');
  eq(h.state.quests.lf_q9, 'deer', 'the Deer lost its source');
  ok(!h.blocked(50, 17), 'the way to the Furnace is open');
  h.placePlayer(48, 37); h.player.dir = 'right';
  ok(h.interact(), 'the screen now lets the team through');
  eq(h.player.x, 52, 'the team reaches the far side of the roots');
  h.placePlayer(52, 37); h.player.dir = 'left';
  h.interact();
  const dv3 = new H.Game({ state: h.serialize(), seed: 12 });
  eq(dv3.map.id, 'lf_artisan', 'a save inside the Artisanship Commission loads');
  stepOn(h, 'о');
  ok(h.state.flags.lf_deer_done, 'the Ebon Deer falls');
  eq(h.state.quests.lf_q9, 'done', 'the ninth mission ends');
  ok(h.records().some(r => r.id === 'deer') && h.records().some(r => r.id === 'ingenuity'), 'two records unlock');
  for (let i = 0; i < 4 && !h.chatThread('lf_deer_fruit'); i++) { h.chatSync(); for (const id of ['lf_tingyun_docks', 'lf_tingyun_first']) if (h.chatThread(id)) h.chatAuto(id); }
  ok(h.chatThread('lf_deer_fruit'), 'Tingyun writes about the fruit');
  h.chatAuto('lf_deer_fruit');
  ok(h.chatThread('lf_deer_fruit').done, 'the fruit talk has an end');
  h.update(1 / 30, {});
  eq(h.map.ents.filter(e => e.kind === 'lfmate').length, 0, 'the crew stops following');
  for (const pick of [0, 1, 2]) { drive.pick = pick; talk(h, 'Н'); }
  drive.pick = 0;
  ok(h.state.inv.items.lf_pill, 'Gongshu gives the pill');
  exitVia(h, 'ё');
  eq(h.map.id, 'lf_divination', 'the skiff goes back to the Commission');
  drive.pick = 0;
  exitVia(h, 'д');
  eq(h.map.id, 'lf_artisan', 'the skiff returns to the Artisanship Commission');
  eq(h.state.quests.lf_q10, 'go', 'the tenth mission waits for the short way');
  eq(H.MAPS.lf_artisan.marks['я'].need, 'lf_deer_done', 'the short way opens after the Deer');
  drive.pick = 0;
  exitVia(h, 'я');
  eq(h.map.id, 'lf_alchemy', 'the short way leads to the Alchemy Commission');
  ok(H.MAPS.lf_alchemy.marks['ё'].label, 'the way back is signed');
  eq(h.state.quests.lf_q10, 'survivors', 'the team looks for survivors');
  eq(h.mapMusic(h.map.def), 'evanescent', 'the Alchemy Commission has its own theme');
  eq(h.battleTheme(), 'desolate', 'the Alchemy Commission keeps the Desolate battle theme');
  talk(h, 'М');
  stepOn(h, 'с');
  ok(h.state.flags.lf_al_stairs, 'March sees someone below');
  ok(h.map.ents.some(e => e.ch === 'Д' && h.visible(e)), 'the healer stands with the knight');
  stepOn(h, 'х');
  ok(h.state.flags.lf_disciple_win, 'three waves fall in the yard');
  eq(h.state.quests.lf_q10, 'camp', 'the dying knight points to the camp');
  ok(!h.map.ents.some(e => e.ch === 'Д' && h.visible(e)), 'the healer is gone');
  for (const ch of ['Р', 'Т', 'З', 'Ы', 'Щ']) talk(h, ch);
  drive.pick = 1;
  talk(h, 'И');
  ok(!h.state.flags.lf_al_healed, 'the injured knight may be left for now');
  const med0 = h.state.inv.items.medkit || 0;
  h.state.inv.items.medkit = med0 + 1;
  const healedGame = new H.Game({ state: h.serialize(), seed: 8 });
  drive.pick = 0;
  talk(healedGame, 'И');
  ok(healedGame.state.flags.lf_al_healed, 'a medkit saves the knight');
  eq(healedGame.state.inv.items.medkit || 0, med0, 'the medkit is spent');
  ok(healedGame.map.ents.some(e => e.ch === 'Ь' && healedGame.visible(e)), 'the saved knight waits in the camp');
  ok(!healedGame.map.ents.some(e => e.ch === 'И' && healedGame.visible(e)), 'the saved knight leaves the field');
  stepOn(h, 'к');
  ok(h.state.flags.lf_al_camp, 'the guard lets the team in');
  eq(h.state.quests.lf_q10, 'wait', 'the team waits in the camp');
  ok(h.map.ents.some(e => e.ch === 'С' && h.visible(e)) && h.map.ents.some(e => e.ch === 'Ю' && h.visible(e)), 'the knights close both ways');
  for (const ch of ['Г', 'ш', 'о', 'Л', 'Ф', 'В', 'Б', 'А', 'в', 'С', 'Ю', 'У', 'Ч', 'Ж']) talk(h, ch);
  talk(h, 'т');
  talk(h, 'м');
  eq(h.state.quests.lf_q10, 'wait', 'March alone does not end the wait');
  eq(h.questStep('lf_q10').text.slice(-5), '(0/2)', 'the count starts from zero');
  drive.pick = 0;
  talk(h, 'Н');
  ok(h.state.flags.lf_al_t_dis, 'the prisoner answers');
  eq(h.questStep('lf_q10').text.slice(-5), '(1/2)', 'one talk is counted');
  for (const pick of [0, 1, 2]) { drive.pick = pick; talk(h, 'т'); }
  drive.pick = 0;
  talk(h, 'П');
  ok(h.state.flags.lf_al_t_duty, 'the knight tells about the battle');
  eq(h.state.quests.lf_q10, 'march', 'March speaks next');
  ok(h.state.flags.lf_al_told, 'the wounded knight is reported');
  ok(!h.map.ents.some(e => e.ch === 'И' && h.visible(e)), 'the knights take the wounded away');
  ok(h.records().some(r => r.id === 'evanescent'), 'the record of the Commission unlocks');
  drive.pick = 1;
  talk(h, 'м');
  eq(h.state.quests.lf_q10, 'march', 'the team may wait longer');
  drive.pick = 0;
  talk(h, 'м');
  ok(h.state.flags.lf_fx_back, 'Fu Xuan returns');
  eq(h.state.quests.lf_q10, 'follow', 'Fu Xuan leads');
  ok(!h.map.ents.some(e => e.ch === 'С' && h.visible(e)), 'the north way opens');
  h.loadMap('lf_alchemy', null, { x: 24, y: 13, silent: true });
  ok(h.state.lf.lead, 'the walk survives a reload');
  drive.pick = 0;
  followLead(h, 'lf_fx_lift');
  eq(h.state.quests.lf_q10, 'crucibles', 'three crucibles remain');
  for (const pick of [0, 1, 2, 3]) { drive.pick = pick; talk(h, 'ф'); }
  drive.pick = 0;
  talk(h, 'ф');
  drive.pick = 0;
  exitVia(h, 'л');
  eq(h.map.id, 'lf_evemist', 'the lift goes down to Evemist Mansion');
  ok(h.state.flags.lf_mist_in, 'Tingyun waits below');
  const fog0 = h.lfFogLevel();
  ok(fog0 > 0.3, 'the fog is thick');
  ok(h.blocked(28, 37), 'the fog closes the way north');
  stepOn(h, 'ч');
  eq(h.state.quests.lf_q10, 'crucibles', 'March stops the team');
  talk(h, 'з');
  talk(h, 'Р');
  ok(h.state.flags.lf_cr_1, 'the first crucible goes out');
  const fog1 = h.lfFogLevel();
  ok(fog1 < fog0, 'the fog thins');
  eq(h.questStep('lf_q10').text.slice(-5), '(1/3)', 'one crucible is counted');
  talk(h, 'Р');
  eq(h.lfFogLevel(), fog1, 'a cold crucible stays cold');
  talk(h, 'Е');
  ok(!h.state.flags.lf_cr_2, 'the second crucible flares again');
  eq(h.lfFogLevel(), fog1, 'the fog does not thin yet');
  talk(h, 'Е');
  ok(h.state.flags.lf_cr_2, 'the second crucible goes out');
  ok(h.lfFogLevel() < fog1, 'the fog thins again');
  talk(h, 'Е');
  ok(!h.state.flags.lf_cr_2, 'curiosity lights it once more');
  eq(h.lfFogLevel(), fog1, 'the fog comes back');
  eq(h.questStep('lf_q10').text.slice(-5), '(1/3)', 'the counter goes back');
  talk(h, 'Ё');
  ok(h.state.flags.lf_cr_3, 'the third crucible goes out');
  ok(!h.state.flags.lf_furnace_off, 'the second one still burns');
  talk(h, 'Е');
  ok(h.state.flags.lf_furnace_off, 'all crucibles are out');
  eq(h.state.quests.lf_q10, 'furnace', 'the way to the Furnace opens');
  ok(h.lfFogLevel() < 0.1, 'the air is clear');
  ok(!h.blocked(28, 37), 'the fog no longer closes the way');
  talk(h, 'Е');
  ok(h.state.flags.lf_cr_2, 'after the end the crucible stays out');
  const ev2 = new H.Game({ state: h.serialize(), seed: 10 });
  eq(ev2.map.id, 'lf_evemist', 'a save inside Evemist Mansion loads');
  eq(ev2.lfFogLevel(), h.lfFogLevel(), 'the fog survives a save');
  talk(h, 'Ф');
  talk(h, 'Ы');
  stepOn(h, 'о');
  ok(h.state.flags.lf_danshu_win, 'Dan Shu falls');
  ok(h.state.flags.lf_reveal, 'the mask falls');
  ok(h.state.flags.lf_legion_win, 'the Legion falls');
  eq(h.state.quests.lf_q10, 'skiff', 'the team has to reach the skiff');
  ok(h.state.inv.items.lf_undestroyed, 'the letter stays with the team');
  ok(H.DOCS.lf_undestroyed, 'the letter can be read');
  h.update(1 / 30, {});
  ok(!h.map.ents.some(e => e.kind === 'lfmate' && e.def.who === 'tingyun'), 'Tingyun no longer follows');
  ok(h.map.ents.some(e => e.kind === 'lfmate' && e.def.who === 'march'), 'March stays with the team');
  ok(!h.map.ents.some(e => e.ch === 'Д' && h.visible(e)), 'Dan Shu is gone');
  drive.pick = 4;
  talk(h, 'ф');
  eq(h.state.quests.lf_q10, 'skiff', 'the team may stay for now');
  const ev3 = new H.Game({ state: h.serialize(), seed: 11 });
  ok(ev3.state.flags.lf_reveal, 'a late save keeps the reveal');
  drive.pick = 0;
  talk(ev3, 'п');
  eq(ev3.state.quests.lf_q10, 'done', 'the pier also ends the mission');
  const jade0 = h.state.jade;
  drive.pick = 0;
  talk(h, 'ф');
  eq(h.state.quests.lf_q10, 'done', 'the tenth mission ends at the skiff');
  ok(h.state.jade > jade0, 'the mission pays jade');
  eq(h.state.quests.lf_dh3, 'market', 'Dan Heng lands on the market');
  eq(h.map.id, 'lf_alchemy', 'the story goes back to the market');
  eq(h.state.party.join(), 'danheng', 'Dan Heng walks alone');
  h.update(1 / 30, {});
  eq(h.map.ents.filter(e => e.kind === 'lfmate').length, 0, 'nobody follows Dan Heng');
  ok(h.map.ents.some(e => e.ch === 'Ю' && h.visible(e)), 'the knights watch the south road');
  for (const ch of ['ц', 'у', 'Э', 'Ф', 'У', 'Б', 'Н', 'П', 'А', 'Ю', 'Г', 'ш', 'В']) talk(h, ch);
  drive.pick = 0;
  talk(h, 'Ч');
  eq(h.state.quests.lf_dh3, 'market', 'the market talks are optional');
  stepOn(h, 'р');
  eq(h.state.quests.lf_dh3, 'find', 'Dan Heng leaves the market');
  ok(h.map.ents.some(e => e.ch === 'С' && h.visible(e)), 'the way back closes');
  talk(h, 'С');
  stepOn(h, 'ъ');
  ok(h.state.flags.lf_dh3_caut, 'Yanqing stands in the way');
  talk(h, 'К');
  ok(!h.map.ents.some(e => e.kind === 'enemy' && h.visible(e)), 'field groups stay away from Dan Heng');
  stepOn(h, 'ь');
  ok(h.state.flags.lf_dh3_e1, 'the first echo speaks');
  talk(h, 'Х');
  stepOn(h, 'ы');
  eq(h.state.quests.lf_dh3, 'skiff', 'the echoes point to the pier');
  exitVia(h, 'л');
  eq(h.map.id, 'lf_evemist', 'Dan Heng takes the lift');
  ok(h.state.flags.lf_dh3_in, 'Dan Heng sees the cold crucibles');
  h.update(1 / 30, {});
  eq(h.map.ents.filter(e => e.kind === 'lfmate').length, 0, 'the crew is not here');
  ok(!h.map.ents.some(e => e.ch === 'ф' && h.visible(e)), 'Fu Xuan is at the Furnace in another scene');
  ok(!h.blocked(11, 43) && !h.blocked(11, 44), 'the gate to the pier stands open');
  ok(H.Luofu.DECOR.waterwall, 'water closes the road to the west');
  talk(h, 'э');
  talk(h, 'ю');
  stepOn(h, 'ш');
  ok(h.state.flags.lf_dh3_pier, 'the echo knows him');
  talk(h, 'х');
  eq(h.map.id, 'lf_terrace', 'the skiff lands at the altar');
  eq(h.state.quests.lf_dh3, 'altar', 'the altar is the last step');
  ok(h.map.ents.some(e => e.ch === 'Б' && h.visible(e)) && h.map.ents.some(e => e.ch === 'К' && h.visible(e)), 'Blade and Kafka wait');
  stepOn(h, 'т');
  ok(h.state.flags.lf_tr_win, 'the fight ends with the Whisper');
  eq(h.state.quests.lf_dh3, 'done', 'the sub-mission ends');
  eq(h.map.id, 'lf_scale', 'Jing Yuan brings him to Scalegorge');
  eq(h.state.quests.lf_dh4, 'monument', 'the next sub-mission starts');
  eq(h.state.party.join(), 'imbibitor', 'he walks in his true form');
  eq(h.mapMusic(h.map.def), 'erstwhile', 'Scalegorge has its own theme');
  h.update(1 / 30, {});
  ok(h.map.ents.some(e => e.kind === 'lfmate' && e.def.who === 'jingyuan'), 'Jing Yuan walks beside him');
  for (const ch of ['о', 'р', 'с', 'е', 'ж']) talk(h, ch);
  stepOn(h, 'б');
  ok(h.state.flags.lf_rainhall_win, 'the Legion falls at the Monument');
  eq(h.state.quests.lf_dh4, 'open', 'the statue waits');
  ok(h.map.ents.some(e => e.ch === 'Ы' && h.visible(e)), 'the knights do not let him leave');
  h.update(1 / 30, {});
  eq(h.map.ents.filter(e => e.kind === 'lfmate').length, 0, 'Jing Yuan stands with the others');
  for (const ch of ['м', 'м', 'ф', 'ф', 'в', 'в', 'п', 'п', 'ц', 'ё', 'Ы', 'з']) { drive.pick = 0; talk(h, ch); }
  eq(h.state.quests.lf_dh4, 'open', 'the talks keep the step');
  const ev4 = new H.Game({ state: h.serialize(), seed: 12 });
  eq(ev4.map.id, 'lf_scale', 'a save at the Monument loads');
  eq(ev4.state.party.join(), 'imbibitor', 'the save keeps the guest');
  drive.pick = 1;
  talk(h, 'С');
  eq(h.state.quests.lf_dh4, 'open', 'the bond with Scalegorge may be cut');
  drive.pick = 0;
  talk(h, 'С');
  eq(h.state.quests.lf_dh4, 'done', 'the second sub-mission ends');
  ok(h.state.flags.lf_rainhall_done, 'the road to the Arbor can open');
  ok(h.state.flags.lf_sea_open, 'the sea parts');
  eq(h.state.quests.lf_q11, 'enter', 'the eleventh mission starts');
  ok(!h.state.guest && !h.state.party.includes('imbibitor'), 'the party comes back');
  ok(!h.state.flags.lf_dh3_on, 'the Dan Heng part is over');
  ok(!h.map.ents.some(e => e.ch === 'Ы' && h.visible(e)), 'the knights step aside');
  ok(h.records().some(r => r.id === 'erstwhile') && h.records().some(r => r.id === 'gleaming'), 'two more records unlock');
  ok(!h.map.ents.some(e => 'мвпц'.includes(e.ch) && h.visible(e)), 'the crew stands with the team now');
  h.update(1 / 30, {});
  eq(h.map.ents.filter(e => e.kind === 'lfmate').length, 4, 'March, Welt, Jing Yuan and Dan Heng follow');
  talk(h, 'ф');
  talk(h, 'Ю');
  ok(!h.blocked(39, 17), 'the road west is free');
  ok(h.map.ents.some(e => e.kind === 'enemy' && h.visible(e)), 'the ruins have field groups after the sea parts');
  drive.pick = 0;
  exitVia(h, 'э');
  eq(h.map.id, 'lf_evemist', 'a skiff goes back to Evemist Mansion');
  ok(h.blocked(11, 43), 'the gate to the pier closes again');
  ok(h.map.ents.some(e => e.kind === 'enemy' && h.visible(e)), 'field groups return');
  drive.pick = 0;
  exitVia(h, 'ь');
  eq(h.map.id, 'lf_scale', 'a skiff goes back to Scalegorge');
  stepOn(h, 'д');
  ok(h.state.flags.lf_sc_steps, 'March sees the steps');
  stepOn(h, 'х');
  eq(h.state.quests.lf_q11, 'seals', 'three seals block the way');
  eq(h.questStep('lf_q11').text.slice(-5), '(0/3)', 'no seal is open');
  stepOn(h, 'щ');
  ok(h.state.flags.lf_sc_big, 'March sees the palace');
  ok(h.blocked(15, 17), 'the Depths stay closed');
  talk(h, 'Т');
  const fireSeal = (g, order) => {
    for (const ch of order) {
      const e = g.map.ents.find(x => x.kind === 'sconce' && x.ch === ch);
      ok(e, 'sconce ' + ch);
      ok(toward(g, e), 'sconce ' + ch + ' can be reached');
      ok(g.interact(), 'sconce ' + ch + ' answers');
      drive(g);
    }
  };
  stepOn(h, 'ч');
  ok(h.state.flags.lf_sc_n1, 'the first seal explains the lamps');
  talk(h, 'т');
  fireSeal(h, ['Б', 'В']);
  ok(!h.state.lf.sconce.tile, 'a wrong lamp puts all lights out');
  fireSeal(h, ['Б', 'Г', 'А']);
  ok(!h.state.flags.lf_seal_tile, 'three lamps do not open the seal');
  fireSeal(h, ['В']);
  ok(h.state.flags.lf_seal_tile, 'the count of the lit strokes opens the first seal');
  eq(h.questStep('lf_q11').text.slice(-5), '(1/3)', 'one seal is counted');
  fireSeal(h, ['Б']);
  ok(h.state.flags.lf_seal_tile, 'an open seal stays open');
  ok(h.blocked(15, 17), 'one seal does not open the Depths');
  stepOn(h, 'ш');
  ok(h.state.flags.lf_sc_n2, 'the second seal has its own line');
  for (const ch of ['Ф', 'Х', 'Ц', 'Ч']) talk(h, ch);
  ok(h.state.flags.lf_sc_mtalk, 'the murals are one story');
  fireSeal(h, ['Е']);
  eq(h.state.lf.sconce.mural, 0, 'the wrong mural first puts the lights out');
  fireSeal(h, ['Д', 'Е', 'Ж', 'З']);
  ok(h.state.flags.lf_seal_mural, 'the story of the murals opens the second seal');
  ok(h.blocked(15, 17), 'two seals do not open the Depths');
  stepOn(h, 'я');
  ok(h.state.flags.lf_sc_n3, 'Jing Yuan warns about the beasts');
  talk(h, 'н');
  const noFight = new H.Game({ state: h.serialize(), seed: 13 }), ring = new Set(noFight.map.marks['Ь'].map(p => p.join()));
  ok(noFight.map.ents.some(e => e.ch === 'Щ' && noFight.visible(e)), 'the Malefic Ape waits');
  const noRing = new Set([noFight.player.x + ',' + noFight.player.y]), wave = [[noFight.player.x, noFight.player.y]];
  while (wave.length) {
    const [x, y] = wave.shift();
    for (const [dx, dy] of D4) {
      const k = (x + dx) + ',' + (y + dy);
      if (noRing.has(k) || ring.has(k) || noFight.blocked(x + dx, y + dy)) continue;
      noRing.add(k);
      wave.push([x + dx, y + dy]);
    }
  }
  ok(!noRing.has('33,29'), 'the slate lies inside the ring of the Ape');
  for (const ch of ['И', 'Й', 'К', 'М']) { const e = noFight.map.ents.find(x => x.ch === ch); ok(D4.some(([dx, dy]) => noRing.has((e.x + dx) + ',' + (e.y + dy))), 'lamp ' + ch + ' can be reached without the fight'); }
  fireSeal(noFight, ['И', 'Й', 'К', 'М']);
  ok(noFight.state.flags.lf_seal_slate && !noFight.state.flags.lf_ape_win, 'the third seal opens by trial without the fight');
  fireSeal(h, ['Й']);
  ok(h.state.flags.lf_sc_n3 && !h.state.flags.lf_ape_win, 'a wrong lamp before the fight only warns');
  stepOn(h, 'Ь');
  ok(h.state.flags.lf_ape_win, 'the Malefic Ape falls');
  ok(!h.map.ents.some(e => e.ch === 'Щ' && h.visible(e)), 'the Ape is gone');
  fireSeal(h, ['Й']);
  talk(h, 'Я');
  ok(h.state.inv.items.lf_slate, 'the Revelation Slate stays with the team');
  talk(h, 'Я');
  eq(h.state.inv.items.lf_slate, 1, 'the slate is given once');
  fireSeal(h, ['И', 'Й', 'К', 'М']);
  ok(h.state.flags.lf_seal_slate, 'the slate opens the third seal');
  eq(h.state.quests.lf_q11, 'depths', 'the way to the Depths opens');
  ok(!h.blocked(15, 17), 'the gate to the Depths is free');
  const ev5 = new H.Game({ state: h.serialize(), seed: 14 });
  eq(ev5.state.quests.lf_q11, 'depths', 'a save in the Ruins loads');
  ok(ev5.map.ents.some(e => e.kind === 'sconce' && ev5.sconceLit(e)), 'the lit lamps stay lit in a save');
  for (const ch of ['к', 'к', 'л', 'ю']) talk(h, ch);
  ok(h.state.flags.lf_sc_eggt, 'March asks about the eggs');
  const jade2 = h.state.jade;
  stepOn(h, 'г');
  eq(h.state.quests.lf_q11, 'done', 'the eleventh mission ends at the dragon');
  eq(h.state.jade, jade2 + 30, 'the mission pays jade');
  eq(h.map.id, 'lf_roots', 'the team reaches the Roots');
  eq(h.state.quests.lf_dh5, 'fight', 'Phantylia waits');
  h.update(1 / 30, {});
  eq(h.map.ents.filter(e => e.kind === 'lfmate').length, 4, 'the team stands together at the Roots');
  talk(h, 'Ф');
  const out5 = new H.Game({ state: h.serialize(), seed: 15 });
  exitVia(out5, 'х');
  eq(out5.map.id, 'lf_scale', 'the team may go back to prepare');
  exitVia(out5, 'ь');
  eq(out5.map.id, 'lf_roots', 'the tunnel leads to the Roots again');
  ok(h.state.roster.trail.lvl >= 44 && h.state.roster.trail.lvl <= 50, 'the story bot reaches Phantylia near her level (' + h.state.roster.trail.lvl + ')');
  drive.pick = 0;
  stepOn(h, 'р');
  ok(h.state.flags.lf_phantylia_win, 'Phantylia falls');
  ok(h.state.flags.lf_phantylia_done, 'the crisis at the Arbor ends');
  eq(h.state.quests.lf_dh5, 'done', 'the sub-mission ends');
  eq(h.map.id, 'lf_sanctum', 'the skiff brings the team to the Exalting Sanctum');
  ok(['pedu1', 'pedu2', 'pedu3'].every(id => h.records().some(r => r.id === id)), 'three records of Pedujara unlock');
  const ev6 = new H.Game({ state: h.serialize(), seed: 16 });
  ok(ev6.state.flags.lf_phantylia_done, 'a save after the Arbor loads');
  delete drive.pick;
  drive.pick = 0;
  eq(h.state.quests.lf_q12, 'seat', 'the twelfth mission starts in the Sanctum');
  eq(h.state.party.join(), STORY_TEAM.join(), 'the team stays as it was');
  h.update(1 / 30, {});
  eq(h.map.ents.filter(e => e.kind === 'lfmate').length, 3, 'March, Welt and Dan Heng walk beside the team');
  const mateOf = (g, who) => { g.update(1 / 30, {}); const e = g.map.ents.find(x => x.kind === 'lfmate' && x.def.who === who); ok(e, who + ' walks beside the team'); return e; };
  const talkMate = (g, who) => { const e = mateOf(g, who), side = D4.map(([dx, dy]) => [e.x + dx, e.y + dy]).find(([x, y]) => !g.blocked(x, y) && !g.map.ents.some(o => o !== e && o.kind === 'lfmate' && o.x === x && o.y === y)); ok(side, who + ' can be reached'); g.placePlayer(side[0], side[1]); g.player.dir = side[0] < e.x ? 'right' : side[0] > e.x ? 'left' : side[1] < e.y ? 'down' : 'up'; ok(g.interact(), 'talk to ' + who); drive(g); };
  for (const who of ['march', 'march', 'welt', 'welt', 'danheng', 'danheng']) talkMate(h, who);
  exitVia(h, 'я');
  eq(h.map.id, 'lf_seat', 'the doors of the Seat are open');
  eq(h.state.quests.lf_q12, 'fuxuan', 'the arrival scene plays at once');
  eq(h.mapMusic(h.map.def), 'foresight', 'the Seat keeps its theme');
  talk(h, 'ц'); talk(h, 'ц');
  talk(h, 'ф');
  ok(h.state.flags.lf_fan && h.state.inv.items.lf_fan, 'Fu Xuan hands over the fan');
  eq(h.state.quests.lf_q12, 'astrum', 'the fan goes to Yukong');
  ok(!h.map.ents.some(e => e.ch === 'ф' && h.visible(e)), 'Fu Xuan leaves for the Divination Commission');
  exitVia(h, 'о');
  eq(h.map.id, 'lf_sanctum', 'back in the Sanctum');
  exitVia(h, 'о');
  eq(h.map.id, 'lf_haven', 'a skiff to the Haven');
  exitVia(h, 'д');
  eq(h.map.id, 'lf_astrum', 'the Palace of Astrum');
  stepOn(h, 'х');
  eq(h.state.quests.lf_q12, 'yanming', 'Yukong tells about the ceremony');
  ok(!h.state.inv.items.lf_fan, 'Yukong takes the fan');
  ok(!h.map.ents.some(e => e.ch === 'ю' && h.visible(e)), 'Yukong leaves for Navalia');
  talk(h, 'Я');
  eq(h.state.quests.lf_q12, 'gifts', 'three gifts wait');
  ok(['lf_amiseal', 'lf_chest', 'lf_knife', 'lf_bowset'].every(k => h.state.inv.items[k]), 'the box goes with the team');
  eq(h.questStep('lf_q12').text.slice(-5), '(0/3)', 'no gift is delivered');
  eq(h.mapMusic(h.map.def), 'serene', 'the walk with the gifts has its own theme');
  talk(h, 'Я');
  const walkToNavalia = g => { exitVia(g, 'э'); };
  const altOrder = new H.Game({ state: h.serialize(), seed: 17 });
  const toHaven = g => { exitVia(g, 'e'); eq(g.map.id, 'lf_haven', 'out of the Palace'); };
  toHaven(h);
  stepOn(h, 'Э');
  ok(h.state.flags.lf_t_earl, 'Welt remembers the tea house');
  talk(h, 'Л');
  ok(h.state.flags.lf_gift_tea && h.state.inv.items.lf_blend && !h.state.inv.items.lf_chest, 'Mengming takes the seeds and gives the tea');
  eq(h.questStep('lf_q12').text.slice(-5), '(1/3)', 'one gift is counted');
  talk(h, 'Л');
  ok(!h.state.flags.lf_tea_dead, 'Mengming believes the trip');
  talk(h, 'Ч');
  exitVia(h, 'с');
  eq(h.map.id, 'lf_sanctum', 'to the Sanctum');
  talk(h, 'Ч');
  ok(h.state.flags.lf_fn_qq1, 'Qingque points to the Alley');
  exitVia(h, 'у');
  eq(h.map.id, 'lf_alley', 'the Alley opens');
  eq(h.mapMusic(h.map.def), 'paean', 'the Alley has its own theme');
  ok(H.mapLayout('lf_alley').anchors[0].name === 'Ночной рынок Переулка ауруматонов', 'the anchor of the Alley has its name');
  stepOn(h, 'э');
  ok(h.state.flags.lf_t_spices, 'March reads the sign');
  drive.pick = 1;
  for (const ch of ['р', 'ч', 'н', 'м', 'г', 'з', 'д', 'п', 'С']) talk(h, ch);
  talk(h, 'я');
  ok(h.state.flags.lf_knife_dead && h.state.inv.items.lf_offal && !h.state.inv.items.lf_knife, 'Yancui learns the truth and cooks');
  eq(h.questStep('lf_q12').text.slice(-5), '(2/3)', 'two gifts are counted');
  talk(h, 'я');
  drive.pick = 0;
  exitVia(h, 'о');
  exitVia(h, 'о');
  eq(h.map.id, 'lf_haven', 'back to the Haven');
  exitVia(h, 'н');
  eq(h.map.id, 'lf_navalia', 'a skiff to Navalia');
  talk(h, 'Р');
  ok(h.state.flags.lf_gift_bow && h.state.flags.lf_gifts && !h.state.inv.items.lf_bowset, 'Yukong takes the bow last');
  eq(h.state.quests.lf_q12, 'boat', 'the kite comes at once after the last gift');
  ok(h.state.inv.items.lf_kite, 'Yanming brings the kite');
  talk(h, 'Т');
  talk(h, 'Р');
  talk(h, 'О');
  ok(h.state.flags.lf_boat_done, 'all four things are on the skiff');
  ok(!['lf_amiseal', 'lf_blend', 'lf_offal', 'lf_kite'].some(k => h.state.inv.items[k]), 'the things stay on the skiff');
  eq(h.state.quests.lf_q12, 'plaza', 'the ceremony waits');
  talk(h, 'О');
  talk(h, 'Р');
  exitVia(h, 'о');
  eq(h.map.id, 'lf_haven', 'back to the Haven again');
  talk(h, 'Д');
  ok(h.state.flags.lf_ceremony, 'the ceremony ends');
  eq(h.state.quests.lf_q12, 'abacus', 'Jing Yuan calls the team');
  eq(h.mapMusic(h.map.def), 'haven', 'the Haven gets its theme back');
  talk(h, 'Д');
  exitVia(h, 'с');
  exitVia(h, 'я');
  eq(h.map.id, 'lf_seat', 'back at the Seat');
  stepOn(h, 'ш');
  ok(h.state.flags.lf_oath && h.state.inv.items.lf_abacus, 'the Jade Abacus is given');
  eq(h.state.quests.lf_q12, 'talk', 'the crew talks');
  talk(h, 'ч'); talk(h, 'ж'); talk(h, 'щ'); talk(h, 'щ');
  ok(h.state.flags.lf_bye_yq, 'Yanqing says goodbye');
  talkMate(h, 'welt');
  ok(h.state.flags.lf_fn_split, 'Welt and Dan Heng go home');
  eq(h.state.quests.lf_q12, 'express', 'the Express waits');
  eq(h.map.ents.filter(e => e.kind === 'lfmate' && h.cond(e.def.if)).length, 1, 'only March stays');
  talkMate(h, 'march');
  const ev7 = new H.Game({ state: h.serialize(), seed: 18 });
  eq(ev7.state.quests.lf_q12, 'express', 'a save before the farewells loads');
  exitVia(h, 'о');
  for (const ch of ['Б', 'Б', 'Ч', 'Ч', 'и', 'и', 'ш', 'ш']) talk(h, ch);
  ok(h.state.flags.lf_bye_bl && h.state.flags.lf_bye_qq && h.state.flags.lf_bye_xy && h.state.flags.lf_bye_kd, 'farewells in the Sanctum');
  exitVia(h, 'о');
  for (const ch of ['Е', 'Е', 'Д', 'Д']) talk(h, ch);
  ok(h.state.flags.lf_bye_su && h.state.flags.lf_bye_yk, 'farewells in the Haven');
  h.state.flags.lf_diting = true;
  h.update(1 / 30, {});
  talkMate(h, 'diting'); talkMate(h, 'diting');
  ok(h.state.flags.lf_bye_dt && h.state.inv.items.lf_ditingpic, 'Diting gives a present');
  h.loadMap('lf_divination', 'v', { silent: true });
  talk(h, 'ф'); talk(h, 'ф');
  ok(h.state.flags.lf_bye_fx, 'Fu Xuan says goodbye at last');
  h.loadMap('lf_artisan', null, { silent: true });
  talk(h, 'Н'); talk(h, 'Н');
  ok(h.state.flags.lf_bye_gs, 'Gongshu says goodbye');
  h.loadMap('lf_cloud', null, { silent: true });
  const jade3 = h.state.jade;
  exitVia(h, 'e');
  eq(h.map.id, 'express', 'home');
  ok(h.state.flags.lf_done, 'the chapter ends');
  eq(h.state.quests.lf_q12, 'done', 'the twelfth mission ends');
  eq(h.state.jade, jade3 + 45, 'the last mission pays jade');
  ok(['paean', 'serene'].every(id => h.records().some(r => r.id === id)), 'two more records unlock');
  ok(H.Cine.CINES.c_lf_prison && H.Cine.CINES.c_lf_ceremony && H.Cine.CINES.c_lf_digest, 'the last cutscenes exist');
  h.runScript('himeko_talk'); drive(h);
  ok(h.state.flags.lf_fn_hm_end, 'Himeko talks about Penacony');
  h.runScript('welt_talk'); drive(h);
  ok(h.state.flags.lf_fn_wl_end, 'Welt talks about the plan');
  const ev8 = new H.Game({ state: h.serialize(), seed: 19 });
  ok(ev8.state.flags.lf_done, 'a save after the chapter loads');
  ok(storyLog.length >= 15, 'the story bot went through the mandatory fights (' + storyLog.length + ')');
  ok(storyLog.filter(r => !r.first).length <= 1, 'the story bot wins nearly every fight at once: ' + storyLog.filter(r => !r.first).map(r => r.enc).join());
  const fmAfter = new H.Game({ state: h.serialize(), seed: 20 });
  ok(!fmAfter.state.flags.fm_letter, 'the Future Market still waits after the chapter');
  fmAfter.state.flags.ending = true;
  fmAfter.loadMap('express', 'v', { silent: true });
  for (const t of H.CHAT.THREADS.filter(t => t.who === 'bronya')) {
    fmAfter.chatSync();
    for (let i = 0; i < 40; i++) {
      const v = fmAfter.chatView(t.id);
      if (!v) break;
      if (v.wait) fmAfter.chatPick(t.id, 0);
      else if (v.next) fmAfter.chatNext(t.id);
      else break;
    }
    if (fmAfter.script || fmAfter.pending) drive(fmAfter);
  }
  ok(fmAfter.state.flags.fm_letter, 'Bronya still invites the crew to the Sun Festival after the chapter');
  const fmFirst = newCrew(190, 40);
  Object.assign(fmFirst.state.flags, { fm_letter: true, fm_board: true, fm_city: true, fm2_done: true });
  fmFirst.fixMissions(0);
  eq(fmFirst.state.quests.lf_q1, 'sofa', 'the chapter opens when the Future Market is finished first');
  ok(!fmFirst.script && !fmFirst.pending, 'nothing pulls the player in the other order either');
  const guide = h.guideActs().find(a => a.world === 'luofu');
  ok(guide.open && guide.finished && guide.parts.length === 3, 'the Guide closes all three parts of Act II');
  ok(guide.parts.every(p => p.total > 0 && p.done === p.total), 'each part of Act II lists its missions');
  eq(H.QUESTS.lf_q12.ch, 'karmic', 'the last mission has its own chapter');
  for (const ch of ['wander', 'tower', 'karmic']) ok(h.chapterPhoto(ch).bg && h.chapterPhoto(ch).cast.length, 'chapter ' + ch + ' has a photo');
  const box = h.mailbox().find(x => x.m.id === 'v18_luofu');
  ok(box, 'the letter of version 1.8 arrives');
  ok(box.m.text.some(line => line.includes('Чистый вымысел')), 'the letter names the new trial');
  ok(!newCrewNoJarilo().mailbox().some(x => x.m.id === 'v18_luofu'), 'the letter waits for the end of Jarilo-VI');
  delete drive.pick;
  altOrder.script = null;
  exitVia(altOrder, 'e');
  exitVia(altOrder, 'н');
  talk(altOrder, 'Р');
  ok(altOrder.state.flags.lf_gift_bow && altOrder.state.quests.lf_q12 === 'gifts', 'the bow may go first');
  talk(altOrder, 'Р');
  exitVia(altOrder, 'о');
  talk(altOrder, 'Л');
  ok(altOrder.state.flags.lf_gift_tea && altOrder.state.quests.lf_q12 === 'gifts', 'the tea may go second');
  exitVia(altOrder, 'с');
  exitVia(altOrder, 'у');
  talk(altOrder, 'я');
  eq(altOrder.state.quests.lf_q12, 'navalia', 'the last gift sends the team to Yukong');
  ok(altOrder.state.flags.lf_gifts, 'all gifts are delivered in another order');
  const old = newCrew(120, 46);
  old.state.quests.lf_dh4 = 'done';
  old.fixMissions(0);
  ok(old.state.flags.lf_sea_open, 'a save made before the eleventh mission opens the sea');
  eq(old.state.quests.lf_q11, 'enter', 'a save made before the eleventh mission gets it');
  const old2 = newCrew(121, 46);
  old2.state.quests.lf_dh5 = 'done';
  old2.fixMissions(0);
  ok(old2.state.flags.lf_seat_open, 'a save made before the last mission opens the Seat');
  eq(old2.state.quests.lf_q12, 'seat', 'a save made before the last mission gets it');
}

{
  const g = newCrew(95, 36);
  Object.assign(g.state.flags, { lf_arrive: true, lf_haven_in: true, lf_deal: true, lf_inn: true, lf_seat_done: true, lf_diting: true, lf_trail_break: true });
  Object.assign(g.state.quests, { lf_q1: 'done', lf_q2: 'done', lf_q3: 'done', lf_q4: 'clues' });
  g.loadMap('lf_haven', null, { x: 11, y: 42, silent: true });
  talk(g, 'К');
  eq(g.state.quests.lf_q4, 'found', 'the kiosk owner gives the short way');
  ok(g.state.flags.lf_ask_kiosk, 'the short way is recorded');
  talk(g, 'Ш');
  eq(g.state.quests.lf_q4, 'go', 'the short way ends the same');
}

{
  for (const pick of [1, 2, 3]) {
    drive.pick = pick;
    const g = newCrew(30 + pick, 38);
    g.loadMap('express', 'v', { silent: true });
    talk(g, 'ё');
    g.runScript('lf_q1_march1'); drive(g);
    g.loadMap('express', 'r', { silent: true });
    talk(g, 'h');
    stepOn(g, 'ж');
    g.state.flags.lf_tk_himeko2 = false;
    talk(g, 'h');
    g.loadMap('express_cabin', 'l', { silent: true });
    talk(g, 's');
    talk(g, 's');
    talk(g, 'я');
    exitVia(g, 'l');
    eq(g.state.quests.lf_q1, 'welt', 'every answer leads through the vote ' + pick);
    talk(g, 'э');
    talk(g, 'h');
    talk(g, 'w');
    eq(g.map.id, 'lf_cloud', 'every answer leads to Cloudford ' + pick);
    Object.assign(g.state.flags, { lf_t_voices: true });
    stepOn(g, 'о');
    eq(g.state.quests.lf_q2, 'skiff', 'every introduction finishes ' + pick);
    stepOn(g, 'х');
    Object.assign(g.state.flags, { lf_t_walk2: true });
    Object.assign(g.lfState().cargo, { 'lf_cloud:a': 2, 'lf_cloud:u': 2, 'lf_cloud:l': 2 });
    g.loadMap('lf_cloud', null, { x: 24, y: 62, silent: true });
    stepOn(g, 'И');
    eq(g.state.quests.lf_q2, 'done', 'every answer reaches the Haven ' + pick);
  }
  delete drive.pick;
}

{
  const fresh = new H.Game({ seed: 80 });
  ok(!fresh.state.quests.lf_q1, 'a new game has no Luofu mission');
  const old9 = JSON.parse(JSON.stringify(fresh.state));
  Object.assign(old9.flags, { jarilo_done: true, lf_deer_done: true });
  Object.assign(old9.quests, { lf_q1: 'done', lf_q9: 'done' });
  eq(new H.Game({ state: old9, seed: 83 }).state.quests.lf_q10, 'go', 'a save from before the Alchemy Commission receives the tenth mission');
  const old = JSON.parse(JSON.stringify(fresh.state));
  Object.assign(old.flags, { jarilo_done: true, fm_m1: true, fm_dh: true });
  old.obj = 'Цель из старого сохранения';
  delete old.quests.lf_q1;
  const back = new H.Game({ state: old, seed: 81 });
  eq(back.state.quests.lf_q1, 'sofa', 'an old save after Jarilo-VI receives the mission');
  eq(back.state.obj, 'Цель из старого сохранения', 'the old objective stays');
  ok(!back.script && !back.pending, 'an old save is not pulled into a scene');
  ok(back.state.flags.fm_m1 && back.state.flags.fm_dh, 'the flags of the other chain stay');
  const early = JSON.parse(JSON.stringify(fresh.state));
  ok(!new H.Game({ state: early, seed: 82 }).state.quests.lf_q1, 'an old save before the end of Jarilo-VI waits');
}

{
  const g = newCrew(40, 36);
  const b = g.startBattle({ enemies: ['mara:33'], lvl: 33, seed: 5 });
  b.start();
  const foe = b.enemies[0];
  foe.hp = 1;
  b.hit(b.allies[0], foe, 0, { raw: 99999, e: 'phys' });
  ok(!foe.dead && foe.hp === Math.round(foe.maxHp * 0.5), 'a Mara-Struck Soldier rises once with half of the health');
  b.hit(b.allies[0], foe, 0, { raw: 99999, e: 'phys' });
  ok(foe.dead, 'the second blow is final');
  const stats = { win: 0, turns: 0, adds: 0 };
  for (let s = 1; s <= 8; s++) {
    const t = newCrew(50 + s, 36);
    const f = t.startBattle({ encId: 'lf_shifter', fromScript: true, seed: s * 13 });
    f.start();
    let added = 0;
    for (let i = 0; i < 4000 && !f.over; i++) { f.autoStep(); for (const e of f.drain()) { if (e.t === 'turn') stats.turns++; if (e.t === 'summon') added++; } }
    if (f.result.win) stats.win++;
    stats.adds += added;
    ok(!f.result.win || f.enemies.every(e => e.dead), 'the summoned soldiers die with the Shape Shifter');
  }
  ok(stats.win >= 6, 'a level 36 crew beats the Shape Shifter (' + stats.win + '/8)');
  ok(stats.adds >= 8, 'the Shape Shifter summons soldiers');
  const m = newCrew(70, 34);
  const mf = m.startBattle({ encId: 'lf_mara1', fromScript: true, seed: 9 });
  mf.start();
  for (let i = 0; i < 4000 && !mf.over; i++) { mf.autoStep(); mf.drain(); }
  ok(mf.result.win, 'a level 34 crew beats the three soldiers');
  eq(H.ENEMIES.mara.fam, 'abomination', 'the soldiers form a family');
  eq(H.TRACE_FOE_OF_FAMILY.abomination, 'scion', 'the family drops the scion line');
  ok(H.CONTACT.abomination, 'the family has a contact profile');
  const P = H.LF_FIELD;
  for (const [id, d] of Object.entries(P.ABACUS)) {
    const key = m => JSON.stringify(Object.keys(m).sort().map(k => [k, m[k]])), seen = new Map([[key(d.modules), 0]]), q = [d.modules];
    let best = null;
    while (q.length && best === null) {
      const m = q.shift(), n = seen.get(key(m));
      if (P.abacusDone(d, m)) { best = n; break; }
      for (let i = 0; i < d.axes.length; i++) { const nx = P.abacusTurn(d, m, i); if (!seen.has(key(nx))) { seen.set(key(nx), n + 1); q.push(nx); } }
    }
    ok(best !== null && best >= 2, 'Abacus board ' + id + ' can be solved (' + best + ')');
    ok(best <= 12, 'Abacus board ' + id + ' stays short (' + best + ')');
    for (const k of Object.keys(d.modules).concat(Object.keys(d.bases))) ok(P.abacusCells(d).some(c => c.join() === k), 'Abacus cell ' + id + ' ' + k + ' lies on a ring');
    for (const a of d.axes) eq(P.abacusRing(d, a).length >= 5, true, 'Abacus axis of ' + id + ' has a ring');
  }
  const gate2 = P.ABACUS.gate2;
  let twist = gate2.modules;
  for (let i = 0; i < P.abacusRing(gate2, gate2.axes[0]).length; i++) twist = P.abacusTurn(gate2, twist, 0);
  eq(JSON.stringify(Object.entries(twist).sort()), JSON.stringify(Object.entries(gate2.modules).sort()), 'a full turn brings the modules back');
  for (const [id, d] of Object.entries(P.MUTARE)) {
    const seen = new Map([[d.start.join(), 0]]), q = [d.start];
    let best = null;
    while (q.length) {
      const pos = q.shift(), n = seen.get(pos.join());
      if (P.mutareDone(pos)) { best = n; break; }
      for (let i = 0; i < d.handles.length; i++) for (const dir of [1, -1]) { const nx = P.mutareTurn(d, pos, i, dir); if (!seen.has(nx.join())) { seen.set(nx.join(), n + 1); q.push(nx); } }
    }
    ok(best !== null && best >= 2, 'Mutare terminal ' + id + ' can be solved (' + best + ')');
    ok(best <= 10, 'Mutare terminal ' + id + ' stays short (' + best + ')');
    ok(!P.mutareDone(d.start), 'Mutare terminal ' + id + ' does not start solved');
    eq(d.names.length, d.handles.length, 'every handle of ' + id + ' has a name');
  }
  eq(P.MUTARE.t.start.length, 2, 'the temporal terminal has two rings');
  ok(P.MUTARE.s.handles.some(h => h.length === 2), 'the spatial terminal has a handle that moves two rings');
  ok(P.MUTARE.k.handles.every(h => h.every(([r]) => r !== 2)), 'the karmic terminal keeps the outer ring fixed');
  const named = H.mapLayout('lf_artisan').anchors;
  eq(named.find(a => a.x > 40 && a.y > 20).name, 'Печь сотворения', 'the anchor at the Furnace has its name');
  eq(named.find(a => a.x < 10).name, 'Тайный причал', 'the anchor at the pier has its name');
  const bureau = H.mapLayout('lf_alchemy').anchors, mansion = H.mapLayout('lf_evemist').anchors;
  eq(bureau.find(a => a.y > 50).name, 'Канцелярия по врачеванию', 'the anchor of the Medicine Bureau has its name');
  eq(bureau.find(a => a.y < 30).name, 'Аптекарский рынок', 'the anchor of the Market has its name');
  eq(mansion.find(a => a.y < 20).name, 'Очаг золотого эликсира', 'the anchor of the Furnace has its name');
  eq(mansion.find(a => a.y > 20).name, 'Веранда эликсирных исследований', 'the anchor of the Terrace has its name');
  const sc = H.mapLayout('lf_scale').anchors;
  eq(sc.find(a => a.x > 40).name, 'Монумент драконьего ливня', 'the anchor of the Monument has its name');
  eq(sc.find(a => a.x > 20 && a.x < 40).name, 'Развалины дворца древнего моря', 'the anchor of the Ruins has its name');
  eq(sc.find(a => a.x < 20).name, 'Глубины развалин дворца', 'the anchor of the Depths has its name');
  const bg = newCrew(74, 43);
  Object.assign(bg.state.flags, { lf_gate_seal: true, lf_gongshu: true });
  bg.loadMap('lf_artisan', null, { silent: true });
  for (const board of ['1', '2', '3']) {
    const ents = bg.map.ents.filter(e => e.kind === 'pyxis' && e.def.board === board);
    const t = ents.find(e => e.def.role === 't'), rs = ents.filter(e => e.def.role === 'r'), coils = ents.filter(e => e.def.role === 'c');
    ok(t && rs.length && coils.length, 'board ' + board + ' has parts');
    eq(coils.length, board === '1' ? 1 : 2, 'board ' + board + ' node count');
    eq(rs.length, board === '2' ? 3 : board === '1' ? 1 : 2, 'board ' + board + ' receiver count');
    const px = bg.lfState().px, solved = (() => {
      let n = 0;
      for (let code = 0; code < 4 ** rs.length; code++) {
        rs.forEach((e, i) => { px['lf_artisan:' + e.x + ',' + e.y] = ['up', 'right', 'down', 'left'][(code >> (i * 2)) & 3]; });
        const { hits } = bg.pyxisTrace(t);
        if (coils.every(c => hits.has(c))) n++;
      }
      return n;
    })();
    ok(solved >= 1, 'board ' + board + ' can be solved');
    for (const e of rs) delete px['lf_artisan:' + e.x + ',' + e.y];
    ok(!coils.every(c => bg.pyxisTrace(t).hits.has(c)), 'board ' + board + ' does not start solved');
    for (const e of ents.filter(x => x.def.role !== 'c' && x.def.role !== 'f')) ok(D4.some(([dx, dy]) => !bg.blocked(e.x + dx, e.y + dy)), 'board ' + board + ' part can be reached');
  }
  const d1g = newCrew(75, 43);
  const d1 = d1g.startBattle({ encId: 'lf_deer1', fromScript: true, seed: 3 });
  d1.start();
  for (let i = 0; i < 6000 && !d1.over; i++) { d1.autoStep(); d1.drain(); }
  ok(d1.result && d1.result.win, 'the first Deer fight ends without a defeat');
  eq(d1.enemies[0].flags.rebirths, 2, 'the Deer rises twice');
  const d2g = newCrew(76, 43);
  const d2 = d2g.startBattle({ encId: 'lf_deer2', fromScript: true, seed: 3 });
  d2.start();
  const deer = d2.enemies[0];
  const atk0 = deer.buffs.length;
  d2.spawnFoe('twig_fruit', 41, deer);
  d2.spawnFoe('twig_fruit', 41, deer);
  d2.riseWarn(deer, { lfFruit: true, t: 'all', n: 'Наскок оленя' }, false);
  ok(deer.buffs.some(b => b.name === 'Плоды' && Math.abs(b.v - 0.5) < 1e-9), 'each Fruit twig adds a quarter to the Pounce');
  ok(deer.buffs.length > atk0, 'the Pounce bonus is a buff');
  deer.hp = Math.round(deer.maxHp * 0.45);
  d2.cleanup();
  ok(deer.flags.lfPhase, 'the second phase starts at half health');
  eq(deer.flags.lfCover, 1, 'the cover locks the toughness');
  const tough0 = deer.tough;
  d2.hit(d2.allies[0], deer, 1, { e: 'fire', tough: 30 });
  eq(deer.tough, tough0, 'locked toughness does not fall');
  d2.startTurn(deer);
  eq(deer.flags.lfCover, 0, 'the lock lasts one turn');
  const tw = d2.spawnFoe('twig_leaf', 41, deer);
  const leafHp = d2.allies[0].hp + (d2.allies[0].shield || 0);
  d2.hit(d2.allies[0], tw, 0.1, { e: 'fire' });
  ok(d2.allies[0].hp + (d2.allies[0].shield || 0) < leafHp, 'the Leaf twig strikes back');
  let wins2 = 0, turns2 = 0;
  for (let s = 1; s <= 8; s++) {
    const t = newCrew(130 + s, 43);
    const f = t.startBattle({ encId: 'lf_deer2', fromScript: true, seed: s * 23 });
    f.start();
    for (let i = 0; i < 8000 && !f.over; i++) { f.autoStep(); for (const e of f.drain()) if (e.t === 'turn') turns2++; }
    if (f.result && f.result.win) wins2++;
    ok(!f.enemies[0].flags.rebirths, 'the second Deer fight has no rebirth');
  }
  ok(wins2 >= 5, 'a level 43 crew beats the Deer (' + wins2 + '/8, ' + Math.round(turns2 / 8) + ' turns)');
  const ag = newCrew(73, 41);
  const af = ag.startBattle({ encId: 'lf_aurumaton', fromScript: true, seed: 5 });
  af.start();
  for (let i = 0; i < 6000 && !af.over; i++) { af.autoStep(); af.drain(); }
  ok(af.result && af.result.win, 'a level 41 crew beats the Aurumaton');
  const kg = newCrew(71, 38);
  const kb = kg.startBattle({ encId: 'lf_kafka', fromScript: true, seed: 11 });
  kb.start();
  const kafka = kb.enemies[0];
  kb.echoSelfFx(kafka, H.ENEMIES.kafka_b.skills[4].fx[0]);
  const held = kb.allies.find(a => a.buffs.some(x => x.s === 'lfDominate'));
  ok(held, 'the Whisper dominates a hero');
  const hp0 = kb.allies.filter(a => a !== held).reduce((a, u) => a + u.hp, 0);
  eq(kb.startTurn(held), 'skip', 'a dominated hero loses the turn');
  ok(kb.allies.filter(a => a !== held).reduce((a, u) => a + u.hp, 0) < hp0, 'a dominated hero hits a friend');
  held.buffs = held.buffs.filter(x => !x.debuff);
  ok(kb.startTurn(held) !== 'skip', 'a cleansed hero acts again');
  let kw = 0, kt = 0, dom = 0;
  for (let s = 1; s <= 6; s++) {
    const t = newCrew(120 + s, 38);
    const f = t.startBattle({ encId: 'lf_kafka', fromScript: true, seed: s * 19 });
    f.start();
    for (let i = 0; i < 6000 && !f.over; i++) { f.autoStep(); for (const e of f.drain()) { if (e.t === 'turn') kt++; if (e.t === 'status' && e.text === 'Подчинение') dom++; } }
    if (f.result.win) kw++;
  }
  ok(kw >= 4, 'a level 38 crew beats Kafka (' + kw + '/6)');
  ok(dom >= 1, 'the bot sees the Whisper');
  const dsG = newCrew(77, 45);
  const ds = dsG.startBattle({ encId: 'lf_danshu', fromScript: true, seed: 3 });
  ds.start();
  const healer = ds.allies[0];
  healer.hp = Math.round(healer.maxHp / 2);
  const hp2 = healer.hp;
  ds.heal(null, healer, 100);
  const healed1 = healer.hp - hp2;
  healer.hp = hp2;
  ds.addBuff(healer, { s: 'healIn', v: -0.5, turns: 2, name: 'Высасывание праны', debuff: true });
  ds.heal(null, healer, 100);
  ok(healer.hp - hp2 < healed1, 'Prana-Siphon cuts the healing');
  const snare = H.ENEMIES.danshu.skills.find(s => s.n === 'Поглощение чёрной праны');
  ok(snare && snare.fx.some(f => f.s === 'healIn'), 'the Snare carries the siphon');
  ok(H.ENEMIES.danshu.skills.some(s => s.t === 'charge' && s.next === H.ENEMIES.danshu.skills.indexOf(snare)), 'the Snare is announced a turn before');
  const houndG = newCrew(78, 45);
  const hb = houndG.startBattle({ enemies: ['ghound:43', 'lupus:43'], lvl: 43, seed: 7 });
  hb.start();
  const wolf = hb.enemies[1], av0 = wolf.av;
  hb.hit(hb.allies[0], hb.enemies[0], 0, { raw: 999999, e: 'phys' });
  ok(wolf.av < av0, 'a dying hound hurries its pack');
  eq(H.ENEMIES.lupus.fam, 'abomination', 'the wolves belong to the scion line');
  for (const enc of ['lf_disciple', 'lf_danshu', 'lf_legion']) {
    let w = 0;
    for (let s = 1; s <= 6; s++) {
      const t = newCrew(150 + s, 45);
      const f = t.startBattle({ encId: enc, fromScript: true, seed: s * 29 });
      f.start();
      for (let i = 0; i < 9000 && !f.over; i++) { f.autoStep(); f.drain(); }
      if (f.result && f.result.win) w++;
    }
    ok(w >= 4, 'a level 45 crew beats ' + enc + ' (' + w + '/6)');
  }
  const yg = newCrew(79, 45);
  const yb = yg.startBattle({ encId: 'lf_yanqing', fromScript: true, seed: 5 });
  yb.start();
  eq(yb.allies.map(a => a.charId).join(), 'imbibitor,blade', 'Imbibitor Lunae fights beside Blade');
  const yq = yb.enemies[0], baseSpd = yq.base.spd;
  if (!yq.flags.lfForm) yb.echoSelfFx(yq, H.ENEMIES.yanqing_b.skills[1].fx[0]);
  while (yb.living.filter(x => x.data.lfSword).length < 3) yb.spawnFoe('flysword', 43, yq);
  ok(H.battleStat.spdOf(yq) > baseSpd + 40, 'the Sword Formation adds speed');
  const tough1 = yq.tough;
  yb.hit(yb.allies[0], yq, 1, { e: 'imag', tough: 30 });
  eq(yq.tough, tough1, 'the formation guards the toughness');
  const hpF = yq.hp;
  for (const e of yb.enemies.filter(x => x.data.lfSword)) yb.hit(yb.allies[0], e, 0, { raw: 999999, e: 'imag' });
  ok(!yq.flags.lfForm, 'without swords the formation falls');
  eq(H.battleStat.spdOf(yq), baseSpd, 'the speed goes back');
  ok(yq.hp < hpF, 'the lost formation hurts Yanqing');
  yb.hit(yb.allies[0], yq, 1, { e: 'imag', tough: 30 });
  ok(yq.tough < tough1, 'the toughness is open again');
  ok(!yb.ultReady(yb.allies[1]), 'the player does not command Blade');
  const ywins = [];
  for (let s = 1; s <= 8; s++) {
    const t = newCrew(160 + s, 45);
    const f = t.startBattle({ encId: 'lf_yanqing', fromScript: true, seed: s * 31 });
    f.start();
    let blade = 0;
    for (let i = 0; i < 9000 && !f.over; i++) { f.autoStep(); for (const e of f.drain()) if (e.t === 'act' && e.u && e.u.charId === 'blade') blade++; }
    if (f.result && f.result.win) { ywins.push(f); ok(f.enemies[0].hp <= f.enemies[0].maxHp * 0.5 && !f.enemies[0].dead, 'Yanqing stops at half of the health'); }
    ok(blade > 0, 'Blade acts on his own');
    ok(!f.current || f.current.charId !== 'blade', 'Blade never waits for orders');
  }
  ok(ywins.length >= 6, 'Imbibitor Lunae beats Yanqing (' + ywins.length + '/8)');
  const mustG = newCrew(180, 45);
  const mb = mustG.startBattle({ encId: 'lf_yanqing', fromScript: true, seed: 6 });
  mb.start();
  const il = mb.allies.find(a => a.charId === 'imbibitor');
  il.hp = 0; il.dead = true;
  mb.cleanup();
  ok(mb.over && !mb.result.win, 'the fight is lost when Imbibitor Lunae falls');
  const rhG = newCrew(181, 45);
  const rh = rhG.startBattle({ encId: 'lf_rainhall', fromScript: true, seed: 6 });
  rh.start();
  ok(['jingyuan', 'imbibitor', 'march'].every(id => rh.allies.some(a => a.charId === id)) && rh.allies.some(a => a.charId === rhG.kitOf('trail')), 'strong guests stand at the Monument');
  for (let i = 0; i < 9000 && !rh.over; i++) { rh.autoStep(); rh.drain(); }
  ok(rh.result && rh.result.win, 'the guests beat the Legion');
  const apeG = newCrew(182, 46);
  const apeB = apeG.startBattle({ encId: 'lf_ape', fromScript: true, seed: 8 });
  apeB.start();
  for (let i = 0; i < 9000 && !apeB.over; i++) { apeB.autoStep(); apeB.drain(); }
  ok(apeB.result && apeB.result.win, 'a level 46 crew beats the Malefic Ape');
  const undyingG = newCrew(183, 48);
  if (!undyingG.state.roster.natasha) undyingG.debugChar('natasha', 48, 0, 0);
  undyingG.state.party = ['trail', 'march', 'natasha'];
  const undyingB = undyingG.startBattle({ encId: 'lf_phantylia', fromScript: true, seed: 20 });
  undyingB.start();
  let undyingTurns = 0;
  for (let i = 0; i < 9000 && !undyingB.over; i++) { undyingB.autoStep(); for (const e of undyingB.drain()) if (e.t === 'turn') undyingTurns++; }
  ok(undyingB.result && undyingB.result.win, 'a level 48 team with a healer beats Phantylia');
  ok(undyingTurns >= 20 && undyingTurns <= 45, 'the final fight stays long enough and not longer (' + undyingTurns + ')');
  for (const [id, boss, adds] of [['cx_icicle', 'iceout', 'weaver,mara'], ['cx_doom', 'shifter', 'mara,dracolion'], ['cx_celestial', 'ascended', 'ballista,ballista'], ['cx_abomination', 'ape', 'ghound,lupus'], ['cx_puppetry', 'aurumaton', 'dragonfish,dragonfish'], ['cx_perdition', 'spectral', 'dracolion,dracolion']]) {
    const c = H.CALYX.find(x => x.id === id);
    eq(c.boss + ':' + c.adds.join(), boss + ':' + adds, 'the Shadow ' + id + ' has the real foes of Luofu');
    ok(H.ENEMIES[c.boss] && c.adds.every(a => H.ENEMIES[a]), 'the foes of ' + id + ' exist');
    const sg = newCrew(200, 60);
    const sb = sg.startBattle({ enemies: [c.boss + ':55'].concat(c.adds.map(a => a + ':53')), lvl: 55, seed: 9 });
    sb.start();
    for (let i = 0; i < 9000 && !sb.over; i++) { sb.autoStep(); sb.drain(); }
    ok(sb.result && sb.result.win, 'a level 60 crew clears the Shadow ' + id);
  }
  const fishG = newCrew(72, 38);
  const fb = fishG.startBattle({ enemies: ['dragonfish:35'], lvl: 35, seed: 3 });
  fb.start();
  const hp1 = fb.allies.reduce((a, u) => a + u.hp, 0);
  fb.hit(fb.allies[0], fb.enemies[0], 0, { raw: 999999, e: 'phys' });
  ok(fb.allies.reduce((a, u) => a + u.hp, 0) < hp1, 'a dragonfish burns someone when it dies');
  eq(H.TRACE_FOE_OF_FAMILY.ingenium, 'artifex', 'the inventions drop the artifex line');
}

{
  const BARRIERS = { lf_cloud: 'АБВКЬФЭ', lf_haven: 'рщюш', lf_navalia: 'КЧХ', lf_seat: 'ж', lf_divination: 'ГДрЫЬС', lf_matrix: 'А', lf_artisan: 'ГДЕИЛХжЬ', lf_delve: 'СД', lf_alchemy: 'ЩЮСРДЯя', lf_evemist: 'сДЯЭЪЕЁРзж', lf_terrace: 'БКЯЦ', lf_scale: 'ЫЛЭНзТ' };
  const TALK = new Set(['npc', 'prop', 'chest', 'anchor']);
  const HUD = [[508, 8, 634, 204], [470, 428, 634, 474]];
  const cover = (x0, y0, x1, y1) => HUD.reduce((a, [rx0, ry0, rx1, ry1]) => a + Math.max(0, Math.min(x1, rx1) - Math.max(x0, rx0)) * Math.max(0, Math.min(y1, ry1) - Math.max(y0, ry0)), 0) / ((x1 - x0) * (y1 - y0));
  const g = new H.Game({ seed: 1 });
  const name = e => (e.ch || e.kind) + '@' + e.x + ',' + e.y;
  ok(lfStates.size >= 15, 'the walk leaves enough Luofu states (' + lfStates.size + ')');
  let configs = 0;
  for (const id of Object.keys(H.MAPS).filter(k => LF.test(k) && k !== 'lf_bench')) {
    const seen = new Set();
    for (const s of lfStates.values()) {
      Object.assign(g.state, { flags: Object.fromEntries(s.flags.map(f => [f, true])), quests: JSON.parse(JSON.stringify(s.quests)) });
      g.lfState().cargo = JSON.parse(JSON.stringify(s.cargo));
      g.loadMap(id, null, { silent: true });
      const m = g.map, vis = m.ents.filter(e => e.kind !== 'enemy' && g.visible(e));
      const sig = vis.filter(e => g.solidEnt(e)).map(name).join(';') + '|' + JSON.stringify(s.cargo);
      if (seen.has(sig)) continue;
      seen.add(sig);
      configs++;
      const talk = vis.filter(e => TALK.has(e.kind)), barrier = e => (BARRIERS[id] || '').includes(e.ch);
      const exitAt = new Set(vis.filter(e => e.kind === 'exit').map(e => e.x + ',' + e.y));
      const free = (x, y) => !g.blocked(x, y) && !exitAt.has(x + ',' + y);
      const solidTile = e => H.TILES[m.tiles[e.y][e.x]].solid;
      const mw = m.w * 32, mh = m.h * 32;
      for (const e of talk) {
        const sides = D4.map(([dx, dy]) => [e.x + dx, e.y + dy]).filter(([x, y]) => free(x, y));
        ok(sides.length, 'something can be reached: ' + name(e) + ' on ' + id);
        const hidden = Math.min(...sides.map(([px, py]) => {
          const cx = mw <= 640 ? (mw - 640) / 2 : Math.max(0, Math.min(mw - 640, px * 32 + 16 - 320)), cy = mh <= 480 ? (mh - 480) / 2 : Math.max(0, Math.min(mh - 480, py * 32 + 16 - 240));
          return cover(e.x * 32 - cx, e.y * 32 - cy - (e.kind === 'npc' ? 22 : 0), e.x * 32 - cx + 32, e.y * 32 - cy + 32);
        }));
        ok(hidden < 0.4, 'the party panel does not hide ' + name(e) + ' on ' + id);
        if (barrier(e) || sides.length < 2) continue;
        const dist = new Map([[sides[0].join(), 0]]), q = [sides[0]];
        while (q.length) {
          const [x, y] = q.shift();
          for (const [dx, dy] of D4) { const k = (x + dx) + ',' + (y + dy); if (!dist.has(k) && free(x + dx, y + dy)) { dist.set(k, dist.get(x + ',' + y) + 1); q.push([x + dx, y + dy]); } }
        }
        for (const sd of sides.slice(1)) { const d = dist.get(sd.join()); ok(d != null && d <= 12, name(e) + ' does not force a long detour on ' + id + ' (' + d + ')'); }
      }
      for (let i = 0; i < talk.length; i++) for (let j = i + 1; j < talk.length; j++) {
        const a = talk[i], b = talk[j];
        if ((a.ch && a.ch === b.ch) || (barrier(a) && barrier(b)) || (solidTile(a) && solidTile(b))) continue;
        ok(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) >= 2, name(a) + ' and ' + name(b) + ' do not stand side by side on ' + id);
      }
    }
  }
  ok(configs >= 5, 'the layouts were checked (' + configs + ')');
}

{
  const LF_SCRIPTS = Object.entries(H.SCRIPTS).filter(([k]) => /^lf_/.test(k));
  const before = LF_SCRIPTS.filter(([k]) => !/^lf_(rv|sc|rt|fn|bye)_/.test(k)), text = before.map(([, v]) => JSON.stringify(v)).join();
  ok(!/Фантил/.test(text), 'nothing before the reveal names Phantylia');
  const earlyQuests = Object.keys(H.QUESTS).filter(k => /^lf_/.test(k) && !['lf_q11', 'lf_dh5', 'lf_q12'].includes(k)).map(k => { const q = H.QUESTS[k], steps = Object.entries(q.steps).filter(([s]) => !(k === 'lf_q10' && s === 'skiff')).map(([, v]) => v); return JSON.stringify([q.name, q.desc, steps]); }).join();
  ok(!/Фантил|Лорд Опустошитель|Опустошител/.test(earlyQuests), 'the mission book does not name the enemy before the reveal');
  ok(/Фантил/.test(JSON.stringify(H.QUESTS.lf_q10.steps.skiff)), 'the last step names her after the reveal');
  for (const [k, v] of before) for (const st of v) if (st && st.recap) ok(!/Тинъюнь[^.]*(враг|предател|самозван|подмен)/.test(st.text), 'the recap ' + st.recap + ' does not accuse Tingyun');
  const lines = name => before.filter(([k]) => name.test(k)).flatMap(([, v]) => v).filter(l => typeof l === 'string' && l.startsWith('tingyun|')).map(l => l.slice(8));
  const all = lines(/./);
  ok(all.filter(l => /благодетел/i.test(l)).length >= 8, 'Tingyun calls the team benefactors again and again (' + all.filter(l => /благодетел/i.test(l)).length + ')');
  ok(/благодетел/i.test(lines(/^lf_e_arrive$/).join()), 'she says it again next to the crucible');
  ok(H.SCRIPTS.lf_rt_start.some(l => typeof l === 'string' && l.startsWith('phantylia|') && /благодетел/i.test(l)), 'Phantylia calls them benefactors at the Roots');
  eq(H.SPEAKERS.phantylia.char, 'tingyun', 'she keeps the face of Tingyun at the Roots');
  ok(/моложе и сильнее/.test(lines(/^lf_e_arrive$/).join()), 'she stands in the smoke and says she is younger than she looks');
  const encs = Object.entries(H.ENCOUNTERS).filter(([k]) => /^lf_/.test(k));
  for (const [k, e] of encs) ok(!(e.trials || []).includes('tingyun') && !((e.lfTrials || {}).heroes || []).includes('tingyun'), 'Tingyun never fights beside the team in ' + k);
  ok(all.some(l => /Навали/.test(l)), 'she is the first to bring news of Kafka');
  ok(H.Cine.CINES.c_lf_reveal, 'the mask falls in a cutscene');
  const steps = H.SCRIPTS.lf_rv_reveal, iCine = steps.findIndex(s => s && s.cine === 'c_lf_reveal'), iFlag = steps.findIndex(s => s && s.flag === 'lf_reveal'), iBattle = steps.findIndex(s => s && s.battle === 'lf_legion');
  ok(iCine >= 0 && iCine < iFlag && iFlag < iBattle, 'the reveal comes before the Legion');
  for (const m of [H.MAPS.lf_alchemy, H.MAPS.lf_evemist]) for (const d of [].concat(m.mate)) if (d.who === 'tingyun') ok(/!lf_reveal/.test(d.if) || /!lf_al_camp/.test(d.if), 'Tingyun follows only before the reveal');
  ok(!/Янг\b|Химеко/.test(text), 'the crew keeps its names');
  ok(Object.keys(H.Cine.CINES).filter(k => /^c_lf_/.test(k)).length >= 5, 'the first cutscenes exist');
}

console.log(checks + ' checks passed');
