const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const BASE_DIR = path.join(ROOT, 'js/apps/sammax');
const DIR = path.join(ROOT, 'js/apps/sammax106');
const BASE = ['sm-core', 'sm-paint', 'sm-font', 'sm-sprites', 'sm-sprites2', 'sm-icons', 'sm-bg', 'sm-bg2', 'sm-bg3', 'sm-engine', 'sm-render', 'sm-closeups', 'sm-drive', 'sm-audio', 'sm-ui'];
const SHARED = ['sammax102/sc-sprites', 'sammax103/mm-sprites', 'sammax104/al-sprites', 'sammax105/rt-sprites'];
const ORDER = ['bm-story', 'bm-sprites', 'bm-props', 'bm-icons', 'bm-bg', 'bm-bg2', 'bm-closeups', 'bm-games', 'bm-room-office', 'bm-room-street', 'bm-room-bosco', 'bm-room-sybil', 'bm-room-moon', 'bm-room-blister', 'bm-room-sanctum'];
let S;
for (const f of BASE) S = require(path.join(BASE_DIR, f + '.js'));
const baseThemes = new Set(Object.keys(S.THEMES));
const baseColors = new Map(Object.entries(S.COLORS));
for (const f of SHARED) S = require(path.join(ROOT, 'js/apps', f + '.js'));
const sharedIcons = new Map(Object.entries(S.ICONS));
const sharedCostumes = new Map(Object.entries(S.COSTUMES));
for (const f of ORDER) S = require(path.join(DIR, f + '.js'));
const E = S.EP106;
const REAL_NAMES = new RegExp(['Micro' + 'soft', 'Win' + 'dows'].join('|'));
const ITEMS = ['max', 'gun', 'uni', 'hanger', 'case', 'gastro', 'lead', 'spoon', 'hat', 'deed', 'cad', 'remote', 'key', 'mtal', 'saw', 'glove'];
const ENTRY = { office: [284, 162], street: [423, 146], bosco: [36, 172], sybil: [46, 168], moon: [118, 158], shop: [60, 172], blister: [56, 172], vest: [66, 172], sanctum: [78, 172] };
const FIGHTS = [
  null,
  { started: true, trap: 1, bound: true, hughIn: false, lander: '', cycle: 1 },
  { started: true, trap: 2, bound: false, hughIn: true, lander: 'up', cycle: 1 },
  { started: true, trap: 3, bound: true, hughIn: false, lander: 'up', cycle: 1 },
  { started: true, trap: 4, bound: false, hughIn: true, lander: 'down', cycle: 2 }
];

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function game(seed) {
  const g = new S.Game({ seed, ep: E });
  g.textSpeed = 6;
  E.startNewGame(g);
  return g;
}

function step(g, n) { for (let i = 0; i < n; i++) g.update(1 / 30); }

function idle(g, max) {
  let n = 0;
  while ((g.busy || (g.fade > 0.001 && !g.ended) || (g.drive && g.drive.anim)) && n < (max || 14000)) { g.update(1 / 30); n++; }
  step(g, 3);
  while (g.busy && n < (max || 14000)) { g.update(1 / 30); n++; }
  ok(n < (max || 14000), 'game became idle in ' + g.roomId + ' after: ' + g.log.slice(-2).join(' | '));
  ok(!g.log.some(l => l.startsWith('script error')), 'no script errors: ' + g.log.filter(l => l.startsWith('script error')).join(' | '));
  return n;
}

function act(g, verb, target, item) {
  idle(g);
  const r = g.perform(verb, target, item);
  ok(r, `perform ${verb} ${target} ${item || ''} in ${g.roomId} busy=${g.busy} dlg=${g.dialog && g.dialog.id} mode=${g.mode} hot=${g.hotspots().map(h => h.id).join(',')}`);
  idle(g, 60000);
}

function choose(g, id) {
  idle(g);
  ok(g.dialog, 'dialog open for ' + id + ' in ' + g.roomId + ' last: ' + g.log.slice(-1));
  ok(g.optionIds().includes(id), 'option ' + id + ' in ' + (g.dialog && g.dialog.id) + ': ' + (g.dialog ? g.optionIds().join(',') : ''));
  g.choose(id);
  idle(g, 60000);
}

function close(g) {
  for (let i = 0; i < 3 && g.dialog && g.optionIds().includes('bye'); i++) choose(g, 'bye');
  ok(!g.dialog, 'dialog closed in ' + g.roomId + ': ' + (g.dialog && g.dialog.id));
}

function talk(g, who, opts) {
  act(g, 'talk', who);
  for (const o of opts) choose(g, o);
  close(g);
}

function go(g, hot, room) {
  act(g, 'use', hot);
  ok(g.roomId === room, `went to ${room} via ${hot}, now in ${g.roomId}: ` + g.log.slice(-2).join(' | '));
}

const has = (g, id) => g.hotspots().some(h => h.id === id);

function hint(g, re, msg) {
  const h = E.maxHint(g);
  ok(typeof h === 'string' && h.length > 20 && re.test(h), 'hint of max ' + msg + ': ' + h);
}

function vhint(g, k, re, msg) {
  const h = E.VICE_HINT[k](g);
  ok(typeof h === 'string' && h.length > 20 && re.test(h), 'hint of the husk ' + msg + ': ' + h);
}

function fly(g, to) {
  act(g, 'use', 'desoto');
  ok(g.dialog && g.dialog.id === 'trip', 'the car asks where to go');
  choose(g, to === 'moon' ? 'moon' : 'earth');
  idle(g, 60000);
  ok(g.roomId === to && !g.closeup && !g.hideUI && g.mode === 'room', 'flew to ' + to + ', now in ' + g.roomId);
}

const EDGES = {
  office: { street: g => go(g, 'edoor', 'street') },
  street: { office: g => go(g, 'officedoor', 'office'), bosco: g => go(g, 'boscodoor', 'bosco'), sybil: g => go(g, 'sybildoor', 'sybil'), moon: g => fly(g, 'moon') },
  bosco: { street: g => go(g, 'exit', 'street') },
  sybil: { street: g => go(g, 'door', 'street') },
  moon: { street: g => fly(g, 'street'), shop: g => go(g, 'shopdoor', 'shop'), blister: g => go(g, 'blisterdoor', 'blister') },
  shop: { moon: g => go(g, 'exit', 'moon') },
  blister: { moon: g => go(g, 'exit', 'moon'), vest: g => go(g, 'lift', 'vest') },
  vest: { blister: g => go(g, 'lift', 'blister'), sanctum: g => go(g, 'door', 'sanctum') },
  sanctum: { vest: g => go(g, 'door', 'vest') }
};

function route(from, to) {
  const prev = { [from]: null };
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    if (cur === to) break;
    for (const next of Object.keys(EDGES[cur])) if (!(next in prev)) { prev[next] = cur; q.push(next); }
  }
  const out = [];
  for (let r = to; prev[r]; r = prev[r]) out.unshift(r);
  return out;
}

function travel(g, room) {
  idle(g);
  for (const next of route(g.roomId, room)) EDGES[g.roomId][next](g);
  ok(g.roomId === room, 'travelled to ' + room + ', now ' + g.roomId);
}

function reload(g) {
  idle(g);
  ok(g.canSave(), 'can save in ' + g.roomId);
  const state = JSON.parse(JSON.stringify(g.saveState()));
  const h = new S.Game({ seed: state.seed, ep: E });
  E.newGame(h);
  h.textSpeed = g.textSpeed;
  h.loadState(state);
  idle(h);
  ok(h.roomId === g.roomId && JSON.stringify(h.inv) === JSON.stringify(g.inv), 'reload keeps room and inventory');
  for (const [k, v] of Object.entries(g.f)) ok(JSON.stringify(h.f[k]) === JSON.stringify(v), 'reload keeps flag ' + k);
  for (const a of g.visibleActors()) ok(h.actors[a.id].room === a.room && h.actors[a.id].visible, 'reload keeps actor ' + a.id + ' in ' + g.roomId);
  for (const id of ['sam', 'max']) ok(h.actors[id].costume === g.actors[id].costume && Math.abs((h.actors[id].scale || 0) - (g.actors[id].scale || 0)) < 0.01, 'reload keeps the body of ' + id);
  ok(h.actors.max.v === g.actors.max.v && h.actors.bosco.hypno === g.actors.bosco.hypno && JSON.stringify(h.fx.tint) === JSON.stringify(g.fx.tint), 'reload keeps the missing parts of max and the bliss of the earth');
  return h;
}

function cell(g, d, i) {
  idle(g);
  const r = d.cellRect(i);
  d.pointer(r.x + 5, r.y + 5);
  ok(d.hover && d.hover.kind === 'cell' && d.hover.id === i, 'doom cell under the pointer: ' + i);
  d.click(r.x + 5, r.y + 5, 0);
  idle(g, 60000);
}

function button(g, d, id) {
  idle(g);
  const b = d.buttons().find(q => q.id === id);
  d.pointer(b.x + 4, b.y + 4);
  ok(d.hover && d.hover.kind === 'btn' && d.hover.id === id, 'doom button under the pointer: ' + id);
  d.click(b.x + 4, b.y + 4, 0);
  idle(g, 60000);
}

function doomLine(want) {
  const rec = (board, moves) => {
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      const c = board.slice();
      c[i] = 'x';
      const list = moves.concat([i]);
      if (E.doomWins(c, 'x')) { if (want === 'x') return list; continue; }
      if (c.every(v => v)) { if (want === 'draw') return list; continue; }
      c[E.doomAi(c)] = 'o';
      if (E.doomWins(c, 'o')) continue;
      if (c.every(v => v)) { if (want === 'draw') return list; continue; }
      const r = rec(c, list);
      if (r) return r;
    }
    return null;
  };
  return rec(['', '', '', '', '', '', '', '', ''], []);
}

function waitSeat(g, seat) {
  idle(g);
  let n = 0;
  while ((!g.vt.red || g.vt.red.seat !== seat) && n++ < 3000) g.update(1 / 30);
  ok(g.vt.red && g.vt.red.seat === seat, 'red max moved to the ' + seat);
}

function playthrough(seed, o) {
  o = o || {};
  const cp = g => (o.reload ? reload(g) : g);
  let g = game(seed);
  idle(g);
  ok(g.roomId === 'office' && g.dialog && g.dialog.id === 'commish', 'intro ends with the commissioner');
  ok(g.log.some(l => l.includes('Рой Г. Бив')) && g.log.some(l => l.includes('Хью Блисс')), 'sam reads roy g. biv as the rainbow of hugh bliss');
  for (const id of o.mistakes ? ['what', 'hugh', 'moon', 'pres'] : ['moon']) choose(g, id);
  choose(g, 'bye');
  ok(g.f.caseOpen && !g.dialog, 'case opened');
  hint(g, /Де Сото/, 'sends sam to the car');
  act(g, 'use', 'closet');
  for (const id of ['mrbear', 'preshead', 'leocloset', 'capgun', 'glove']) ok(has(g, id), 'closet keeps the evidence of earlier cases: ' + id);
  ok(!has(g, 'jar'), 'the sixth exhibit is not in the closet yet');
  if (o.mistakes) {
    for (const id of ['mrbear', 'preshead', 'leocloset', 'capgun']) { act(g, 'look', id); act(g, 'use', id); }
    act(g, 'talk', 'leocloset');
    for (let i = 0; i < 4; i++) act(g, 'use', 'tv');
    ok(g.f.tvDone && g.f.tvSeg === 4 && !g.closeup, 'tv programmes watched');
    for (let i = 0; i < 4; i++) act(g, 'use', 'machine');
    ok(g.f.machineDone, 'answering machine played');
    act(g, 'talk', 'hole');
    act(g, 'look', 'lids');
    talk(g, 'max', ['hint', 'how', 'decree', 'case']);
    act(g, 'use', 'glove');
    ok(g.has('glove') && g.f.gloveTaken && !has(g, 'glove'), 'boxing glove of case 101 taken from the closet');
  }
  if (!o.lateHanger) {
    act(g, 'use', 'hanger');
    ok(g.has('hanger') && g.f.hangerTaken && !has(g, 'hanger'), 'coat hanger taken from the tv');
    if (o.mistakes) { act(g, 'use', 'tv'); ok(!g.closeup && g.f.tvSeg === 4, 'no antenna, no programme'); }
  }
  travel(g, 'street');
  ok(g.actors.jimmy.room === 'street' && has(g, 'meter') && !has(g, 'meter2'), 'jimmy sits on the bent meter');
  if (o.mistakes) {
    talk(g, 'jimmy', ['what', 'moon', 'debt', 'queen']);
    act(g, 'look', 'meter');
    act(g, 'use', 'meter');
    act(g, 'look', 'posters'); act(g, 'look', 'posters');
    act(g, 'look', 'hughstand');
    act(g, 'use', 'jimmy', 'uni');
    travel(g, 'sybil');
    talk(g, 'sybil', ['queen', 'job', 'rainbow']);
    for (const id of ['plaque', 'fox', 'hockey']) act(g, 'look', id);
    travel(g, 'bosco');
    talk(g, 'bosco', ['who', 'why', 'sell', 'late']);
    ok(g.f.knowQuake, 'momma bosco names the price of the earthquake maker');
    for (let i = 0; i < 5; i++) act(g, 'look', 'late');
    act(g, 'use', 'bosco', 'glove');
  }
  travel(g, 'moon');
  ok(g.f.moonSeen && g.actors.superball.room === 'moon', 'landed on the moon');
  hint(g, /Суперболл/, 'points at superball');
  go(g, 'blisterdoor', 'moon');
  talk(g, 'superball', o.mistakes ? ['in', 'level', 'you', 'test'] : ['test']);
  ok(g.has('uni') && g.f.uniGot && g.itemIcon('uni') === 'uniyel6', 'spectrum analysis gives a unicorn with a yellow horn');
  hint(g, /микроволновк/, 'says to heat the horn');
  if (o.mistakes) {
    act(g, 'use', 'superball', 'uni');
    ok(!g.f.blisterOpen, 'a yellow horn does not open the blister');
    talk(g, 'superball', ['red']);
    act(g, 'use', 'lander');
    act(g, 'look', 'nozzle');
    act(g, 'look', 'earth');
  }
  travel(g, 'shop');
  talk(g, 'harry', o.mistakes ? ['you', 'level', 'case', 'sell', 'hugh'] : ['case']);
  ok(g.f.knowCase, 'harry explains the indestructible case');
  if (o.mistakes) {
    act(g, 'look', 'poster'); act(g, 'look', 'poster');
    talk(g, 'harry', ['plan']);
    act(g, 'look', 'goggles');
    act(g, 'look', 'frame');
    act(g, 'use', 'harry', 'uni');
  }
  act(g, 'use', 'casestand');
  ok(g.has('case') && g.f.caseTaken, 'the display case is taken whole');
  if (o.mistakes) {
    act(g, 'use', 'exit');
    ok(g.roomId === 'shop' && !g.has('case') && !g.f.caseTaken && !g.vt.alarmT, 'the security frame returns the case');
    act(g, 'use', 'casestand');
    hint(g, /Отдай витрину мне/, 'offers to carry the case');
  }
  act(g, 'use', 'max', 'case');
  ok(g.f.caseInMax && !g.has('case'), 'max swallowed the display case');
  if (o.mistakes) { act(g, 'use', 'max', 'gastro'); }
  go(g, 'exit', 'moon');
  ok(g.seen.frameOk, 'the frame lets the president through');
  g = cp(g);
  travel(g, 'bosco');
  if (o.mistakes) { talk(g, 'bosco', ['micro']); act(g, 'use', 'micro'); act(g, 'use', 'micro', 'gun'); }
  act(g, 'use', 'micro', 'uni');
  ok(g.f.uniRed && g.itemIcon('uni') === 'unired6' && !g.vt.microT, 'the microwave turned the horn red');
  hint(g, /Суперболлу/, 'says to show the horn');
  travel(g, 'moon');
  act(g, 'use', 'superball', 'uni');
  ok(g.f.blisterOpen && g.actors.superball.x < 550, 'superball steps aside for a red horn');
  g = cp(g);
  go(g, 'blisterdoor', 'blister');
  ok(g.seen.blister, 'inside the blister of tranquility');
  for (const id of ['lincoln', 'curt', 'bob', 'bluster', 'chippy', 'philo', 'roach']) ok(g.actors[id].room === 'blister' && g.actorHot(g.actors[id]), 'prismatologist present: ' + id);
  hint(g, /Линкольн/, 'points at lincoln');
  if (o.mistakes) { act(g, 'use', 'payphone'); ok(!g.closeup && !g.dialog, 'nobody to call yet'); }
  talk(g, 'lincoln', o.mistakes ? ['why', 'tal', 'sad'] : ['sad']);
  ok(g.f.abeMet && g.f.knowLove && g.actors.lincoln.v === 'tal', 'lincoln misses sybil and wears the talisman');
  hint(g, /Позвони/, 'says to call sybil');
  if (o.mistakes) {
    act(g, 'use', 'payphone');
    ok(g.dialog && g.dialog.id === 'call' && g.closeup && g.closeup.kind === 'call6', 'split screen call');
    choose(g, 'order');
    ok(!g.dialog && !g.closeup && !g.f.gastroGot && g.seen.callFail === 1, 'sybil hangs up on an order');
    act(g, 'use', 'payphone');
    idle(g);
    const slotX = Math.max(S.BAR.x0, Math.floor((S.W - g.optionIds().length * S.BAR.cw) / 2)) + S.BAR.cw + 4;
    g.pointer(slotX, S.BAR.y + 8);
    ok(g.hover && g.hover.kind === 'opt' && g.hover.opt.id === g.optionIds()[1], 'pointer rests on the second call option');
    choose(g, 'relax');
    ok(g.vt.call.stage === 1 && g.dialog, 'the first decree calms her');
    ok(g.hover && g.hover.kind === 'opt' && g.hover.opt.id === g.optionIds()[g.hover.i] && g.hover.opt.id !== 'relax', 'a still pointer shows the option of the new stage');
    g.pointer(160, 100);
    choose(g, 'battle');
    ok(!g.dialog && !g.closeup && g.seen.callFail === 2, 'gettysburg is no compliment');
    act(g, 'use', 'payphone');
    choose(g, 'relax'); choose(g, 'fox');
    ok(g.vt.call.stage === 2, 'a stone cold fox');
    choose(g, 'bye');
    ok(!g.dialog && !g.closeup && !g.f.gastroGot, 'sam can hang up himself');
    travel(g, 'sybil');
    talk(g, 'sybil', ['abe', 'like']);
    travel(g, 'blister');
  }
  act(g, 'use', 'payphone');
  choose(g, 'relax'); choose(g, 'fox'); choose(g, 'hockey');
  ok(g.f.gastroGot && g.has('gastro') && !g.closeup && !g.dialog && g.actors.lincoln.v === '', 'sybil forgives lincoln, the gastrokinesis talisman changes hands');
  hint(g, /Наведи на меня/, 'asks for the talisman');
  if (o.mistakes) {
    act(g, 'use', 'payphone');
    talk(g, 'lincoln', ['how']);
    for (const id of ['curt', 'bob', 'bluster', 'chippy', 'philo', 'roach']) { act(g, 'look', id); act(g, 'use', id, 'uni'); }
    talk(g, 'philo', ['you', 'trick', 'sky']);
    act(g, 'talk', 'roach'); act(g, 'talk', 'roach');
    act(g, 'use', 'button');
    ok(g.vt.carX === 592, 'an empty lap of the coaster');
    talk(g, 'curt', ['why', 'game', 'tal']);
  }
  act(g, 'talk', 'bluster');
  choose(g, 'play');
  ok(g.mode === 'doom' && g.drive instanceof E.Doom && !g.canSave() && g.f.copsMet, 'tic tac doom started');
  const d = g.drive;
  if (o.mistakes) {
    for (const i of doomLine('x')) cell(g, d, i);
    ok(!g.f.leadGot && g.mode === 'doom' && d.board.every(v => !v) && g.seen.doomX === 1, 'a win of the player resets the board');
    for (const i of doomLine('draw')) cell(g, d, i);
    ok(!g.f.leadGot && d.board.every(v => !v) && g.seen.doomDraw === 1, 'a draw does not count');
    cell(g, d, 4); cell(g, d, 3);
    button(g, d, 'max');
    button(g, d, 'reset');
    ok(d.board.every(v => !v), 'a new game on request');
    button(g, d, 'exit');
    ok(g.mode === 'room' && !g.drive && g.roomId === 'blister' && !g.f.leadGot, 'left the game without the talisman');
    act(g, 'talk', 'chippy');
    choose(g, 'play');
  }
  const dm = g.drive;
  let turns = 0;
  while (!g.f.leadGot && turns++ < 9) {
    const line = E.doomSolve(dm.board);
    ok(line && line.length, 'the machine can still be made to win');
    ok(dm.hint().includes(E.DOOM_CELLS[line[0]]), 'max names the next cell');
    cell(g, dm, line[0]);
  }
  ok(g.f.leadGot && g.has('lead') && g.mode === 'room' && !g.drive && turns <= 5, 'the machine won for the first time, lead vision is the prize');
  g = cp(g);
  travel(g, 'moon');
  act(g, 'use', 'max', 'gastro');
  ok(g.f.caseBack && g.has('case') && !g.f.caseInMax, 'gastrokinesis returned the case');
  hint(g, /сопло/, 'points at the rocket nozzle');
  if (o.mistakes) {
    go(g, 'shopdoor', 'moon');
    act(g, 'use', 'max', 'case');
    ok(g.has('case'), 'max does not swallow it twice');
  }
  if (o.lateHanger) {
    act(g, 'use', 'nozzle', 'case');
    ok(g.f.caseUnder && !g.has('case') && has(g, 'caseunder'), 'the case lies under the nozzle');
    hint(g, /плечик/i, 'sends sam for the hanger');
    act(g, 'use', 'lander');
    travel(g, 'office');
    act(g, 'use', 'hanger');
    ok(g.has('hanger'), 'hanger taken late');
    travel(g, 'moon');
    act(g, 'use', 'lander', 'hanger');
    ok(g.f.landerOpen && g.f.keyGot && g.has('key') && g.f.caseBroken && !g.has('hanger'), 'max fired the engine, the case broke');
  } else if (o.keyFirst) {
    act(g, 'use', 'lander', 'hanger');
    ok(g.f.landerOpen && g.f.keyGot && g.has('key') && !g.f.caseBroken && !g.has('hanger') && g.actors.max.visible, 'the lander is open, the engine fired in vain');
    act(g, 'use', 'lander', 'key');
    ok(!g.f.caseBroken, 'nothing under the nozzle');
    act(g, 'use', 'nozzle', 'case');
    hint(g, /ключ/, 'says to use the key');
    act(g, 'use', 'caseunder', 'key');
    ok(g.f.caseBroken, 'the key fires the engine again');
  } else {
    act(g, 'use', 'nozzle', 'case');
    act(g, 'use', 'caseunder', 'hanger');
    ok(g.f.landerOpen && g.f.keyGot && g.f.caseBroken, 'hanger, engine, broken case');
  }
  ok(has(g, 'spoontal') && !g.vt.fireT, 'the talisman lies in the shards');
  hint(g, /Подбери/, 'says to pick the talisman up');
  act(g, 'use', 'spoontal');
  ok(g.has('spoon') && g.f.spoonGot && has(g, 'shards') && !has(g, 'spoontal'), 'spoon bending talisman taken');
  hint(g, /лифт/, 'sends sam to the rainbow lift');
  g = cp(g);
  if (o.earlyJimmy) {
    travel(g, 'street');
    act(g, 'use', 'meter', 'spoon');
    ok(g.f.jimmyFlown && g.actors.jimmy.room === 'nowhere', 'jimmy launched before the beam');
    travel(g, 'blister');
    talk(g, 'philo', ['hat']);
    ok(g.has('hat') && g.itemIcon('hat') === 'hatrat6', 'the hat with jimmy is taken early');
    if (g.f.closetOpen) { travel(g, 'office'); act(g, 'use', 'leocloset', 'gastro'); ok(g.has('deed'), 'the deed can be taken early'); }
  }
  travel(g, 'vest');
  ok(g.f.vestSeen, 'the vestibule');
  hint(g, /свинцов/, 'says to look through the lead');
  if (o.mistakes) {
    go(g, 'door', 'vest');
    act(g, 'use', 'door', 'spoon');
    ok(!g.f.doorOpen && !has(g, 'sconce'), 'the door is not a spoon');
  }
  act(g, 'use', 'door', 'lead');
  ok(g.f.doorSeen && has(g, 'sconce'), 'lead vision shows the bracket, the ball and the button');
  hint(g, /Согни/, 'says to bend the bracket');
  g = cp(g);
  ok(has(g, 'sconce'), 'the x-ray stays after a reload');
  act(g, 'use', 'sconce', 'spoon');
  ok(g.f.doorOpen && !has(g, 'sconce') && !g.vt.sconceT, 'the bowling ball pressed the button');
  hint(g, /Заходи/, 'says to go in');
  g = cp(g);
  go(g, 'door', 'sanctum');
  idle(g, 90000);
  ok(g.f.beam && g.f.maxSplit && E.husk(g) && E.blissed(g) && !g.hideUI && !g.closeup, 'hugh fired the beam and took max apart');
  ok(g.actors.max.costume === 'maxbliss6' && g.actors.max.v === 'rgb' && g.itemName('max') === 'Блаженный Макс' && g.itemIcon('max') === 'maxbliss6', 'max is a blissful husk');
  ok(['maxred', 'maxgreen', 'maxblue'].every(id => g.actors[id].room === 'nowhere') && !g.actors.max.scripted, 'the three vices ran away');
  hint(g, /Сэм, друг мой/, 'speaks softly');
  if (o.mistakes) {
    talk(g, 'hugh', ['why', 'max', 'past', 'color']);
    act(g, 'use', 'hugh', 'gun');
    act(g, 'use', 'hugh', 'mtal');
    talk(g, 'max', ['hint', 'how', 'decree', 'case']);
  }
  g = cp(g);
  ok(g.actors.max.costume === 'maxbliss6' && g.actors.hugh.room === 'sanctum', 'the husk survives a reload');
  const red = () => {
    travel(g, 'blister');
    ok(g.actors.maxred.room === 'blister' && g.seen.redSeen, 'red max rides the coaster');
    if (o.mistakes) {
      act(g, 'use', 'button');
      ok(!g.f.redDone && g.actors.sam.x < 520, 'red max shoots at anyone near the button');
      act(g, 'talk', 'maxred');
      waitSeat(g, 'car');
      act(g, 'use', 'button', 'gun');
      ok(!g.f.redDone && g.vt.carX === 592 && g.actors.maxred.x === 608, 'without the spork he just enjoys the ride');
    }
    act(g, 'use', g.f.sporkBent ? 'spork2' : 'spork', 'spoon');
    ok(g.f.sporkBent && has(g, 'spork2') && !has(g, 'spork'), 'the spork hangs over the track');
    vhint(g, 'r', /выстрели/, 'says to shoot the button');
    if (o.mistakes) {
      waitSeat(g, 'sign');
      act(g, 'use', 'button', 'gun');
      ok(!g.f.redDone, 'an empty car proves nothing');
    }
    waitSeat(g, 'car');
    const x = g.actors.sam.x;
    act(g, 'use', 'button', 'gun');
    ok(g.f.redDone && g.actors.maxred.room === 'nowhere' && !g.actors.maxred.upside && Math.abs(g.actors.sam.x - x) < 1, 'the spork knocked the hand off the car, sam shot from where he stood');
  };
  const green = () => {
    if (!g.f.jimmyFlown) {
      travel(g, 'street');
      if (o.mistakes) talk(g, 'jimmy', ['beam']);
      act(g, 'use', 'meter', 'spoon');
      ok(g.f.jimmyFlown && g.actors.jimmy.room === 'nowhere' && has(g, 'meter2') && !g.actors.max.scripted, 'the meter straightened and launched jimmy');
    }
    vhint(g, 'g', g.has('hat') ? /шляпу/ : /Фило/, 'talks about the hat');
    if (!g.has('hat')) {
      travel(g, 'blister');
      ok(has(g, 'hattable') && g.hotName(g.hotspots().find(h => h.id === 'hattable')) === 'Шляпа фокусника', 'jimmy landed in the hat of philo');
      if (o.mistakes) { act(g, 'talk', 'hattable'); act(g, 'use', 'hattable'); }
      talk(g, 'philo', ['hat']);
      ok(g.has('hat') && g.f.hatGot && g.itemIcon('hat') === 'hatrat6', 'philo gives away the hat with jimmy');
    }
    travel(g, 'bosco');
    ok(g.actors.maxgreen.room === 'bosco' && g.seen.greenSeen && g.actors.bosco.hypno, 'green max eats the store of a blissful bosco');
    if (o.mistakes) { act(g, 'talk', 'maxgreen'); act(g, 'use', 'maxgreen', 'gastro'); ok(!g.f.greenDone, 'gastrokinesis has nobody to command'); }
    act(g, 'use', 'maxgreen', 'hat');
    ok(g.f.greenFed && !g.f.greenDone && g.itemIcon('hat') === 'hat6' && g.itemName('hat') === 'Шляпа фокусника', 'green max swallowed jimmy');
    vhint(g, 'g', /ещё раз/, 'says to use the hat again');
    g = cp(g);
    act(g, 'use', o.mistakes ? 'max' : 'maxgreen', 'hat');
    ok(g.f.greenDone && g.actors.maxgreen.room === 'nowhere' && g.actors.jimmy.room === 'nowhere' && !g.actors.max.scripted, 'the hat returned jimmy and the stomach');
  };
  const blue = () => {
    travel(g, 'moon');
    ok(g.actors.maxblue.room === 'moon' && g.seen.blueSeen, 'blue max lies by the tower');
    if (o.mistakes) { act(g, 'use', 'maxblue'); act(g, 'talk', 'maxblue'); ok(!g.f.blueDone, 'sloth cannot be lifted'); }
    travel(g, 'bosco');
    ok(g.actors.bosco.hypno, 'bosco thinks he is hugh bliss');
    act(g, 'talk', 'bosco');
    ok(g.dialog && g.dialog.id === 'boscoB' && g.log.slice(-1)[0].includes('Хью Блисс'), 'the greeting of a hypnotised earth');
    choose(g, 'quake');
    close(g);
    ok(g.f.knowQuake, 'the price stays a hundred trillion');
    if (o.mistakes) {
      if (g.has('glove')) { act(g, 'use', 'bosco', 'glove'); ok(g.actors.bosco.hypno, 'the glove works for half a minute while the beam shines'); }
      talk(g, 'bosco', ['who', 'fear']);
    }
    if (!g.has('deed')) {
      vhint(g, 'b', /Леонард/, 'remembers the deed inside leonard');
      travel(g, 'office');
      if (!g.f.closetOpen) act(g, 'use', 'closet');
      if (o.mistakes) { act(g, 'talk', 'leocloset'); act(g, 'use', 'tv'); ok(!g.closeup, 'tv watched under the beam'); }
      act(g, 'use', 'leocloset', 'gastro');
      ok(g.has('deed') && g.f.deedGot, 'leonard returned the deed to the united states');
      if (o.mistakes) act(g, 'use', 'leocloset', 'gastro');
    }
    vhint(g, 'b', /Сибил/, 'sends sam to the queen');
    travel(g, 'sybil');
    ok(g.actors.sybil.hypno && g.seen.blissSybil, 'the queen breathes in rhythm');
    if (o.mistakes) { talk(g, 'sybil', ['who', 'job']); if (g.has('glove')) act(g, 'use', 'sybil', 'glove'); }
    if (o.mistakes) { act(g, 'talk', 'sybil'); choose(g, 'deed'); } else act(g, 'use', 'sybil', 'deed');
    ok(g.has('cad') && !g.has('deed') && g.f.cadGot && !g.dialog, 'canada bought the united states for a hundred trillion');
    vhint(g, 'b', /Отдай их Боско/, 'sends sam to pay');
    g = cp(g);
    travel(g, 'bosco');
    if (o.mistakes) { act(g, 'talk', 'bosco'); choose(g, 'pay'); } else act(g, 'use', 'bosco', 'cad');
    ok(g.has('remote') && !g.has('cad') && g.f.remoteGot && !g.dialog, 'earthquake maker bought');
    ok(g.hotName(g.hotspots().find(h => h.id === 'quake')) === 'Пустой колпак', 'the dome on the counter is empty');
    vhint(g, 'b', /Луну/, 'says to fly to the moon');
    travel(g, 'moon');
    if (o.mistakes) { act(g, 'use', 'tower', 'remote'); ok(!g.f.satDown, 'the satellite is for the sloth'); }
    act(g, 'use', 'maxblue', 'remote');
    ok(g.f.satDown && has(g, 'wreck') && g.actors.maxblue.act === 'flipped' && !g.actors.max.scripted, 'the satellite of bosco flipped blue max');
    vhint(g, 'b', /Хвост/, 'says to take the tail');
    hint(g, /Хвост/, 'max talks about the vice that lies in the room');
    g = cp(g);
    ok(g.actors.maxblue.act === 'flipped', 'blue max stays flipped after a reload');
    act(g, 'use', 'maxblue');
    ok(g.f.blueDone && g.actors.maxblue.room === 'nowhere', 'the tail is back');
  };
  const parts = { r: red, g: green, b: blue };
  const order = o.order || 'rgb';
  order.split('').forEach((k, i) => {
    parts[k]();
    ok(E.parts(g) === i + 1 && g.actors.max.v.length === 2 - i, 'max got a part back: ' + k);
    if (i < 2) ok(E.husk(g) && !g.f.maxWhole, 'still a husk');
  });
  ok(g.f.maxWhole && !E.husk(g) && g.actors.max.costume === 'max' && g.itemName('max') === 'Макс' && g.itemIcon('max') === 'max', 'max is whole and furious');
  hint(g, /Я целый/, 'shouts again');
  g = cp(g);
  ok(g.actors.max.costume === 'max', 'the whole max survives a reload');
  travel(g, 'vest');
  go(g, 'door', 'sanctum');
  idle(g, 90000);
  const ft = () => g.vt.fight;
  ok(ft() && ft().started && ft().trap === 1 && ft().bound && g.f.frozen && !g.canSave() && !g.hideUI, 'the rainbow wheel of death');
  ok(g.actors.hugh.v === 'germ' && g.actors.max.x === 240 && g.actors.max.follow === null, 'hugh is a colony of bacteria, max sits in the crystal');
  ok(!has(g, 'door') && has(g, 'lspoon') && has(g, 'wheel') && !has(g, 'cabinet'), 'a bound dog sees only his trap');
  hint(g, /левой/, 'points at the left spoon');
  const sx = g.actors.sam.x;
  g.click(20, 170, 0);
  step(g, 30);
  ok(Math.abs(g.actors.sam.x - sx) < 1, 'a bound dog does not walk');
  if (o.mistakes) { act(g, 'use', 'rspoon', 'spoon'); act(g, 'talk', 'hugh'); act(g, 'use', 'hugh', 'gun'); act(g, 'look', 'wheel'); act(g, 'use', 'wheel'); ok(!g.has('mtal') && ft().bound, 'the right spoon is empty'); }
  act(g, 'use', 'lspoon', 'spoon');
  ok(g.has('mtal'), 'the talisman of the magician fell out of the left spoon');
  hint(g, /поменяйся/, 'says to swap places');
  act(g, 'use', 'hugh', 'mtal');
  ok(!ft().bound && ft().hughIn && ft().trap === 1 && !g.f.frozen && g.actors.sam.scale === null && !g.actors.sam.upside, 'hugh rides the wheel');
  if (o.mistakes) { act(g, 'use', 'hugh', 'mtal'); ok(ft().hughIn, 'no swapping back'); talk(g, 'hugh', ['germ', 'taunt']); act(g, 'use', 'door'); ok(g.roomId === 'sanctum', 'sam does not leave max behind'); }
  act(g, 'talk', 'hugh'); choose(g, 'next');
  ok(ft().trap === 2 && ft().bound, 'separate your bliss');
  act(g, 'use', 'hugh', 'mtal');
  ok(!ft().bound && ft().hughIn && ft().trap === 2, 'hugh stands in the cabinet');
  if (o.mistakes) { act(g, 'use', 'cabinet', 'saw'); }
  act(g, 'use', 'cabinet');
  ok(g.has('saw'), 'the saw of the magician');
  if (o.mistakes) { act(g, 'use', 'cabinet', 'saw'); act(g, 'use', 'cabinet'); }
  hint(g, /следующий номер/, 'says to go on');
  act(g, 'talk', 'hugh'); choose(g, 'next');
  ok(ft().trap === 3 && ft().bound && ft().lander === 'up' && has(g, 'lander') && !has(g, 'crane'), 'ticket to oblivion, the lunar lander hangs overhead');
  act(g, 'use', 'hugh', 'mtal');
  ok(ft().trap === 4 && ft().bound && !g.vt.fireT, 'the engine burnt hugh, he came back in the water and put sam into the tank');
  act(g, 'use', 'hugh', 'mtal');
  ok(ft().trap === 4 && !ft().bound && ft().hughIn && g.actors.sam.x >= 356, 'hugh sits in the tank');
  hint(g, /ещё раз/, 'explains the second round');
  if (o.walkAway) {
    act(g, 'look', 'console');
    idle(g, 60000);
  } else { act(g, 'talk', 'hugh'); choose(g, 'next'); }
  ok(ft().cycle === 2 && ft().trap === 1 && ft().bound, 'the numbers start again');
  act(g, 'use', 'hugh', 'mtal');
  hint(g, /опору/, 'says to saw the support');
  act(g, 'use', 'crane', 'saw');
  ok(ft().lander === 'down' && has(g, 'fallen') && !has(g, 'crane') && !has(g, 'lander'), 'the lander fell with its nozzle under the tank');
  if (o.mistakes) { act(g, 'use', 'fallen', 'key'); ok(!g.f.boiled, 'no boiling an empty tank'); }
  hint(g, /дойди до бака/, 'says to reach the tank');
  act(g, 'talk', 'hugh'); choose(g, 'next');
  ok(ft().trap === 2 && ft().bound, 'the cabinet again');
  act(g, 'use', 'hugh', 'mtal');
  act(g, 'talk', 'hugh'); choose(g, 'next');
  ok(ft().trap === 4 && ft().bound, 'the third number is cancelled');
  act(g, 'use', 'hugh', 'mtal');
  ok(ft().hughIn && ft().trap === 4, 'hugh in the tank, the lander under it');
  hint(g, /ключ/, 'shouts about the key');
  const r = g.perform('use', 'fallen', 'key');
  ok(r, 'the key goes into the fallen lander');
  let n = 0;
  while (!g.ended && n++ < 90000) g.update(1 / 30);
  ok(!g.log.some(l => l.startsWith('script error')), 'finale without script errors: ' + g.log.filter(l => l.startsWith('script error')).join(' | '));
  ok(g.ended && g.roomId === 'office' && g.f.boiled && g.f.epilogue && g.f.exhibit && g.mode === 'room' && !g.closeup, 'the episode ends in the office');
  ok(!g.vt.fight && !g.f.frozen && g.actors.max.follow === 'sam' && g.actors.sam.scale === null && !E.blissed(g) && g.fx.tint === null, 'the fight and the bliss are over');
  ok(g.log.some(l => l.includes('Я Макс')) && g.log.some(l => l.includes('кипячения')), 'hugh was boiled and the world thought it was max');
  ok(g.f.closetOpen && has(g, 'mrbear') && has(g, 'preshead') && has(g, 'leocloset') && has(g, 'capgun') && has(g, 'jar'), 'the closet holds six cases');
  ok(E.ROOMS.office.layers.find(l => l.id === 'jar').when(g), 'the jar with hugh stands in the closet');
  return g;
}

{
  const g = game(7);
  idle(g);
  g.dialog = null;
  g.killTasks();
  g.actors.sam.act = ''; g.actors.sam.keepAct = false;
  g.f.caseOpen = true;
  for (const [id, room] of Object.entries(E.ROOMS)) {
    const b = new S.Buf(room.w, S.H, 0);
    room.paint(b, g);
    let zero = 0;
    for (let i = 0; i < b.px.length; i++) if (!b.px[i]) zero++;
    ok(zero === 0, 'room background fully painted: ' + id + ' (' + zero + ' holes)');
    for (const L of room.layers || []) {
      const art = E.LAYERS[L.src || id] && E.LAYERS[L.src || id][L.art || L.id];
      ok(typeof art === 'function', 'layer art exists ' + id + '.' + L.id);
      const spr = art(g);
      ok(spr && spr.w > 0 && spr.px.some(v => v), 'layer renders ' + id + '.' + L.id);
    }
    for (const h of room.hot || []) {
      ok(h.name, 'hotspot has a name ' + id + '.' + h.id);
      ok(h.look !== undefined, 'hotspot can be looked at ' + id + '.' + h.id);
      ok(h.poly || h.rect, 'hotspot has an area ' + id + '.' + h.id);
    }
    ok(new Set(room.hot.map(h => h.id)).size === room.hot.length, 'hotspot ids are unique in ' + id);
    for (const [aid, h] of Object.entries(room.actors || {})) {
      ok(g.actors[aid], 'actor exists ' + aid);
      ok(h.name && h.look !== undefined, 'actor hotspot described ' + id + '.' + aid);
    }
    ok(room.dress106 && typeof room.onLoad === 'function', 'room dresses max on every visit: ' + id);
  }
  ok(Object.keys(ENTRY).length === Object.keys(E.ROOMS).length, 'every room has an entry point');
  for (const from of Object.keys(EDGES)) for (const to of Object.keys(EDGES)) ok(from === to || route(from, to).length > 0, 'rooms are connected: ' + from + ' to ' + to);
  const STATES = [
    { caseOpen: true, closetOpen: false },
    { caseOpen: true, closetOpen: true, moonSeen: true, uniGot: true, uniRed: true, blisterOpen: true, abeMet: true, knowLove: true, caseTaken: true, caseUnder: true, landerOpen: true, keyGot: true },
    { caseOpen: true, closetOpen: true, moonSeen: true, uniGot: true, uniRed: true, blisterOpen: true, gastroGot: true, leadGot: true, caseTaken: true, caseUnder: true, caseBroken: true, doorSeen: true, hangerTaken: true },
    { caseOpen: true, closetOpen: true, moonSeen: true, blisterOpen: true, gastroGot: true, caseTaken: true, caseUnder: true, caseBroken: true, spoonGot: true, doorSeen: true, doorOpen: true, beam: true, maxSplit: true, jimmyFlown: true, sporkBent: true, satDown: true, hangerTaken: true, gloveTaken: true },
    { caseOpen: true, closetOpen: true, moonSeen: true, blisterOpen: true, gastroGot: true, caseTaken: true, caseUnder: true, caseBroken: true, spoonGot: true, doorSeen: true, doorOpen: true, beam: true, maxSplit: true, jimmyFlown: true, hatGot: true, redDone: true, greenDone: true, blueDone: true, maxWhole: true, remoteGot: true, satDown: true, exhibit: true }
  ];
  let spots = 0;
  for (const st of STATES) {
    for (const [id, [ex, ey]] of Object.entries(ENTRY)) {
      for (const fight of id === 'sanctum' && st.maxWhole ? FIGHTS : [null]) {
        g.f = Object.assign({}, st);
        g.vt = {};
        g.actors.max.follow = 'sam';
        g.setRoom(id);
        if (fight) { g.vt.fight = Object.assign({}, fight); E.sanctum.stage(g); }
        ok(g.walkable(ex, ey), 'entry point walkable ' + id);
        const list = g.hotspots().map(h => [h.id, h.walk]).concat(Object.entries(E.ROOMS[id].actors || {}).map(([aid, h]) => [aid, h.walk]));
        for (const [hid, walk] of list) {
          const w = typeof walk === 'function' ? walk(g) : walk;
          if (!w) continue;
          const p = g.findPath(ex, ey, w[0], w[1]);
          ok(p && p.length, 'hotspot reachable ' + id + '.' + hid);
          const end = p[p.length - 1];
          ok(Math.hypot(end[0] - w[0], end[1] - w[1]) < 8, 'walk point on the floor ' + id + '.' + hid + ' -> ' + end.map(Math.round).join(','));
          spots++;
        }
        for (const cam of [0, E.ROOMS[id].w - 320]) {
          g.camLock = cam;
          g.centerCam(true);
          for (const h of g.hotspots()) {
            const p = h.poly || S.rectPoly(h.rect);
            let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            for (let i = 0; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); }
            let own = 0, total = 0;
            for (let y = Math.ceil(y0); y <= y1; y += 2) for (let x = Math.ceil(x0); x <= x1; x += 2) {
              if (!S.inPoly(p, x, y)) continue;
              total++;
              if (g.hitHot(x, y) === h) own++;
            }
            ok(total > 0 && own / total > 0.5, `hotspot mostly clickable ${id}.${h.id} (${own}/${total})`);
          }
        }
        g.camLock = null;
      }
    }
  }
  ok(spots > 300, 'walk points checked: ' + spots);
  g.f = { caseOpen: true };
  g.vt = {};
  g.setRoom('office');
  ok(ITEMS.length === Object.keys(E.ITEMS).length && ITEMS.every(id => E.ITEMS[id]), 'item list is complete');
  ok(ITEMS.length <= 20, 'the inventory fits the box of sam');
  for (const st of [{}, { uniRed: true, greenFed: true, caseBack: true, beam: true, maxSplit: true }, { greenDone: true, greenFed: true, beam: true, maxSplit: true, maxWhole: true }]) {
    g.f = Object.assign({ caseOpen: true }, st);
    for (const [id, it] of Object.entries(E.ITEMS)) {
      ok(g.itemName(id) && it.look !== undefined, 'item described ' + id);
      const icon = g.itemIcon(id);
      ok(S.ICONS[icon], 'item icon ' + id + ': ' + icon);
      const ic = S.icon(icon);
      ok(ic.w <= 28 && ic.h <= 22 && ic.px.some(v => v), 'item icon renders ' + id);
      ok(E.GENERIC.items[id] && E.GENERIC.items[id].length >= 2, 'item has its own refusals: ' + id);
    }
  }
  g.f = { caseOpen: true };
  for (const [id, fn] of Object.entries(S.ICONS)) { const b = fn(); ok(b && b.px.some(v => v), 'icon draws ' + id); }
  for (const [id, fn] of sharedIcons) ok(S.ICONS[id] === fn, 'episode 106 keeps the shared icon ' + id);
  for (const [id, cos] of sharedCostumes) ok(S.COSTUMES[id] === cos, 'episode 106 keeps the shared costume ' + id);
  for (const [id, c] of baseColors) ok(S.COLORS[id] === c, 'episode 106 keeps the speech colour of ' + id);
  for (const id of Object.keys(S.ICONS)) ok(sharedIcons.has(id) || /6$/.test(id), 'own icons are marked with a six: ' + id);
  for (const id of Object.keys(S.COSTUMES)) ok(sharedCostumes.has(id) || /6$/.test(id), 'own costumes are marked with a six: ' + id);
  for (const id of Object.keys(S.CLOSEUPS)) ok(!/6$/.test(id) || typeof S.CLOSEUPS[id] === 'function', 'closeup ' + id);
  const variants = (id, conv) => {
    if (typeof conv.options !== 'function') return [conv.options];
    const out = [];
    const flags = [{}, { caseOpen: true, beam: true, maxSplit: true }, { caseOpen: true, beam: true, maxSplit: true, maxWhole: true, redDone: true, greenDone: true, blueDone: true }];
    for (const f of flags) {
      g.f = Object.assign({}, f);
      E.dress(g);
      for (const room of ['street', 'moon']) {
        g.roomId = room;
        for (const stage of [0, 1, 2]) {
          g.vt.call = { stage };
          for (const fight of FIGHTS.concat([{ started: true, trap: 0 }])) {
            g.vt.fight = fight;
            out.push(conv.options(g, { id, data: {} }).filter(o => !o.when || o.when(g)));
          }
        }
      }
    }
    return out;
  };
  g.inv = ITEMS.slice();
  for (const [id, conv] of Object.entries(E.TALK)) {
    for (const list of variants(id, conv)) {
      const ids = list.map(o => o.id);
      ok(new Set(ids).size === ids.length, 'unique option ids in ' + id);
      ok(list.length > 0 && list.some(o => o.end), 'conversation can end ' + id);
      ok(list[list.length - 1].end && (ids.includes('bye') || list.length === 1), 'the last option leaves the conversation ' + id);
      for (const o of list) ok(o.text && S.ICONS[o.icon], 'option has text and icon ' + id + '.' + o.id + ': ' + o.icon);
      ok(list.length <= 10, 'options fit the dialog bar ' + id);
    }
  }
  for (const conv of [E.TALK.commish, E.TALK.jimmy, E.TALK.bosco, E.TALK.boscoB, E.TALK.sybil, E.TALK.sybilB, E.TALK.superball, E.TALK.harry, E.TALK.abe, E.TALK.cops, E.TALK.philo, E.TALK.hugh]) ok(Array.isArray(conv.options) && conv.options.length <= 10, 'plain conversations fit the bar even with every topic open');
  g.vt = {};
  g.f = { caseOpen: true };
  g.roomId = 'office';
  g.setRoom('office');
  const POSES = [{ dir: 'e' }, { dir: 'w', walk: 0.25 }, { dir: 's', talk: 1 }, { dir: 'n', walk: 0.6 }, { v: 'red' }, { v: 'red', act: 'shoot', dir: 's' }, { v: 'green', act: 'eat', t: 0.3 }, { v: 'green', dir: 'n' }, { v: 'blue' }, { v: 'blue', act: 'flipped' }, { v: 'germ', t: 1 }, { v: 'germ', act: 'magic', t: 0.5 }, { v: 'tal' }, { v: 'rgb', t: 0.5 }, { v: 'b', walk: 0.4 }, { act: 'point' }, { act: 'give' }, { act: 'shrug' }, { act: 'gasp' }, { act: 'shock' }, { act: 'phone' }, { act: 'swoon' }, { act: 'sad' }, { act: 'sigh' }, { act: 'panic' }, { act: 'peek' }, { act: 'fly' }, { act: 'magic', t: 1 }, { act: 'block' }, { act: 'salute' }, { hypno: true, t: 1 }, { upside: true }];
  for (const id of ['maxbliss6', 'maxvice6', 'bosco6', 'sybil6', 'abehead6', 'harry6', 'superball6', 'jimmy6', 'hugh6']) {
    ok(S.COSTUMES[id] && !sharedCostumes.has(id), 'episode costume ' + id);
    for (const pose of POSES) {
      const s = S.sprite(id, pose, 1);
      ok(s && s.buf.px.some(v => v), 'sprite renders ' + id + ' ' + JSON.stringify(pose));
    }
  }
  for (const id of Object.keys(g.actors)) ok(S.COSTUMES[g.actors[id].costume], 'actor has a costume: ' + id);
  ok(S.sprite('maxvice6', { v: 'green', dir: 'e' }, 1).buf.w > S.sprite('max', { dir: 'e' }, 1).buf.w, 'green max is wider than max');
  ok(S.sprite('maxvice6', { v: 'blue' }, 1).buf.w > S.sprite('maxvice6', { v: 'blue' }, 1).buf.h, 'blue max lies down');
  const bliss = S.sprite('bosco6', { dir: 's', hypno: true, t: 1 }, 1), plain = S.sprite('bosco6', { dir: 's' }, 1);
  ok(bliss.buf.h > plain.buf.h, 'a halo over a blissful bosco');
  for (const who of ['hugh', 'superball', 'harry', 'abe', 'philo', 'momma', 'queen', 'leonard', 'cops', 'jimmy', 'green', 'maxbliss']) ok(S.art106.portrait(who).px.some(v => v), 'portrait ' + who);
  ok(E.UNI_FANS.length === 10 && E.UNI_FANS.every(id => id === 'cops' || id === 'lincoln' || g.actors[id]), 'ten opinions about the unicorn');
  const empty = ['', '', '', '', '', '', '', '', ''];
  const best = E.doomSolve(empty);
  ok(best && best.length === 4, 'the machine can be forced to win in four moves: ' + (best && best.join(',')));
  let board = empty.slice();
  for (const i of best) {
    board[i] = 'x';
    ok(!E.doomWins(board, 'x'), 'the losing line never wins by accident');
    board[E.doomAi(board)] = 'o';
  }
  ok(E.doomWins(board, 'o'), 'the solution ends with three noughts');
  ok(doomLine('x') && doomLine('draw'), 'the player can also win or draw');
  let forced = 0, free = 0;
  const walk = b => {
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue;
      const c = b.slice();
      c[i] = 'x';
      if (E.doomWins(c, 'x') || c.every(v => v)) continue;
      const mv = E.doomAi(c);
      const win = c.slice();
      win[mv] = 'o';
      if (E.doomWins(win, 'o')) {
        forced++;
        for (let k = 0; k < 9; k++) if (!c[k]) { const alt = c.slice(); alt[k] = 'o'; ok(E.doomWins(alt, 'o'), 'the machine wins only when every free cell wins'); }
        continue;
      }
      free++;
      if (!win.every(v => v)) walk(win);
    }
  };
  walk(empty);
  ok(forced > 0 && free > forced, 'the machine dodges victory whenever it can: ' + forced + ' forced, ' + free + ' dodged');
  ok(E.DOOM_CELLS.length === 9 && new Set(E.DOOM_CELLS).size === 9, 'nine names for nine cells');
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js'));
  const missing = new Set();
  let strings = 0;
  for (const f of files) {
    const src = fs.readFileSync(path.join(DIR, f), 'utf8');
    const re = /'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
    let m;
    while ((m = re.exec(src))) {
      const s = (m[1] !== undefined ? m[1] : m[2]).replace(/\$\{[^}]*\}/g, '').replace(/\\(.)/g, '$1');
      if (!/[а-яё]/i.test(s)) continue;
      strings++;
      for (const ch of s) if (ch !== '\n' && !S.font.has(ch)) missing.add(ch + ' in ' + f);
      for (const word of s.split(/\s+/)) ok(S.font.measure(word) < 190, 'word fits a speech line: ' + word);
      ok(!s.includes('—'), 'no em dash in text: ' + s);
      ok(!/(^|[\s,.])не [а-яё]+(?: [а-яё]+)?, а /i.test(s) && !/, а не /i.test(s), 'no "не X, а Y" or "X, а не Y" in: ' + s);
      ok(!/Это не [^.!?]+[.!?] Это /.test(s), 'no split "это не X. Это Y" in: ' + s);
      ok(!REAL_NAMES.test(s), 'project naming rule: ' + s);
    }
  }
  ok(strings > 900, 'found the game texts: ' + strings);
  ok(missing.size === 0, 'font covers every text character: ' + [...missing].slice(0, 10).join(', '));
}

{
  const R = new S.Renderer();
  const g = game(3);
  for (let i = 0; i < 90; i++) g.update(1 / 30);
  ok(g.closeup && g.closeup.kind === 'titlecard6' && g.fade < 0.5, 'title card is visible');
  R.render(g);
  ok(R.frame.px.every(v => v), 'title card renders');
  for (let i = 0; i < 300; i++) { g.update(1 / 30); if (i % 25 === 0) R.render(g); }
  g.skip();
  idle(g);
  ok(g.roomId === 'office' && g.dialog && g.dialog.id === 'commish', 'intro can be skipped to the call');
  const out = new Uint8ClampedArray(320 * 200 * 4);
  R.toRGBA(g, out);
  ok(out.some((v, i) => i % 4 !== 3 && v > 0), 'frame converts to RGBA');
  g.dialog = null;
  g.killTasks();
  g.actors.sam.act = ''; g.actors.sam.keepAct = false;
  const STATES = [
    { caseOpen: true, closetOpen: true },
    { caseOpen: true, closetOpen: true, blisterOpen: true, caseTaken: true, caseUnder: true, landerOpen: true, hangerTaken: true, doorSeen: true, gastroGot: true },
    { caseOpen: true, closetOpen: true, blisterOpen: true, caseTaken: true, caseUnder: true, caseBroken: true, spoonGot: true, doorSeen: true, doorOpen: true, beam: true, maxSplit: true, jimmyFlown: true, sporkBent: true, satDown: true },
    { caseOpen: true, closetOpen: true, blisterOpen: true, doorOpen: true, beam: true, maxSplit: true, maxWhole: true, redDone: true, greenDone: true, blueDone: true, jimmyFlown: true, hatGot: true, remoteGot: true, satDown: true, exhibit: true },
    { caseOpen: true, closetOpen: true, beam: true, maxSplit: true, maxWhole: true, boiled: true, epilogue: true, exhibit: true }
  ];
  let frames = 0;
  for (const st of STATES) {
    for (const id of Object.keys(E.ROOMS)) {
      for (const fight of id === 'sanctum' && st.maxWhole && !st.boiled ? FIGHTS : [null]) {
        g.f = Object.assign({}, st);
        g.vt = {};
        g.actors.max.follow = 'sam';
        g.setRoom(id);
        if (fight) { g.vt.fight = Object.assign({}, fight); E.sanctum.stage(g); }
        g.fade = 0; g.fadeTo = 0;
        for (const cam of [0, E.ROOMS[id].w - 320]) {
          g.camLock = cam;
          g.centerCam(true);
          g.pointer(300, 186);
          for (let k = 0; k < 3; k++) { g.time += 0.37; if (E.ROOMS[id].update) E.ROOMS[id].update(g, 0.03); R.render(g); frames++; }
          ok(R.frame.px.every(v => v), 'room renders every pixel ' + id);
        }
        g.killTasks();
        g.camLock = null;
      }
    }
    g.setRoom('office');
    ok(JSON.stringify(g.fx.tint) === JSON.stringify(st.beam && !st.boiled ? [255, 150, 230, 0.13] : null), 'the earth is tinted only while the beam shines');
    g.setRoom('moon');
    ok(g.fx.tint === null, 'the moon keeps its own colours');
  }
  ok(frames > 200, 'rendered frames: ' + frames);
  g.f = { caseOpen: true };
  g.vt = {};
  g.setRoom('office');
  for (const prog of ['hugh', 'news', 'shop', 'bliss', 'snow', 'rerun']) for (const t of [0.2, 3]) { g.closeup = { kind: 'tv6', prog, t0: g.time - t }; R.render(g); ok(R.frame.px.some(v => v > 2), 'tv programme ' + prog); }
  const shots = [
    { kind: 'titlecard6', lines: ['A', 'B', 'C'] },
    { kind: 'fly6', moon: true }, { kind: 'fly6', moon: false },
    { kind: 'call6', mood: '' }, { kind: 'call6', mood: 'angry' }, { kind: 'call6', mood: 'swoon' }, { kind: 'call6', mood: 'wait' },
    { kind: 'beam6', delay: 1 }, { kind: 'beam6', delay: 1, max: true },
    { kind: 'world6', who: 'hugh', faces: ['f:momma6', 'f:queen6', 'f:leonard6'] }, { kind: 'world6', who: 'max', faces: ['f:momma6', 'f:queen6', 'f:leonard6', 'f:superball6'] }, { kind: 'world6', who: 'max' }
  ];
  for (const husk of [false, true]) {
    g.f = husk ? { caseOpen: true, beam: true, maxSplit: true } : { caseOpen: true };
    E.dress(g);
    for (const cu of shots) {
      for (const t of [0.3, 1.5, 3.4]) {
        g.closeup = Object.assign({ t0: g.time - t }, cu);
        R.render(g);
        ok(R.frame.px.every(v => v), 'closeup ' + cu.kind + ' paints the whole frame at ' + t);
      }
    }
  }
  g.closeup = null;
  g.f = { caseOpen: true };
  E.dress(g);
  const f = new S.Buf(320, 200);
  E.TITLE.draw(f, 1, 0, [true, false, true, true, false]);
  ok(f.px.every(v => v), 'title screen fully painted');
  ok(E.TITLE.hit(40, 88) === 0 && E.TITLE.hit(40, 144) === 4 && E.TITLE.hit(300, 10) === -1, 'title menu hit test');
  ok(E.CREDITS.length > 10 && E.SAVE_KEY === 'sammax106_saves' && E.SET_KEY === 'sammax106_settings' && E.TITLE_MUSIC === 'title6' && E.CREDITS_MUSIC === 'credits6', 'episode descriptor');
  for (const [line, size] of E.CREDITS) ok(S.font.measure(line) * (size >= 2 ? size : 1) < 316, 'credit line fits the screen: ' + line);
  for (const th of ['title6', 'moon6', 'shop6', 'blister6', 'sanctum6', 'bliss6', 'show6', 'queen6', 'momma6', 'vice6', 'credits6']) {
    const T = S.THEMES[th];
    ok(T && !baseThemes.has(th), 'music theme ' + th + ' belongs to the episode');
    ok(['swing', 'lounge', 'waltz', 'surf', 'creepy', 'fanfare', 'hypno', 'country', 'quiz', 'tango', 'tarantella', 'industrial', 'march'].includes(T.style), 'music style is known to the player: ' + th);
    const per = T.style === 'waltz' || T.style === 'tarantella' ? 6 : 8;
    ok(T.mel.split(/\s+/).filter(Boolean).length === T.prog.length * per, 'melody fills the whole progression: ' + th);
  }
  for (const st of [{}, { beam: true }, { beam: true, maxWhole: true }, { beam: true, boiled: true }]) {
    g.f = Object.assign({}, st);
    for (const r of Object.values(E.ROOMS)) ok(S.THEMES[typeof r.music === 'function' ? r.music(g) : r.music], 'room music exists ' + r.id);
  }
  g.f = { beam: true };
  ok(E.ROOMS.street.music(g) === 'bliss6' && E.ROOMS.moon.music === 'moon6' && E.ROOMS.sanctum.music({ f: { maxWhole: true } }) === 'show6', 'the earth hums, the moon does not, the finale plays a tango');
  const sfx = new Set();
  const audio = read('js/apps/sammax/sm-audio.js');
  for (const f2 of fs.readdirSync(DIR)) for (const m of fs.readFileSync(path.join(DIR, f2), 'utf8').matchAll(/sfx\('([a-z0-9]+)'\)/g)) sfx.add(m[1]);
  ok(sfx.size > 30, 'the episode is not silent: ' + sfx.size);
  for (const id of sfx) ok(audio.includes("case '" + id + "':"), 'sound exists in the shared player: ' + id);
  const music = new Set();
  for (const f2 of fs.readdirSync(DIR)) for (const m of fs.readFileSync(path.join(DIR, f2), 'utf8').matchAll(/music\('([a-z0-9]+)'\)/g)) music.add(m[1]);
  for (const id of music) ok(S.THEMES[id], 'music theme exists: ' + id);
  g.f = { caseOpen: true, blisterOpen: true };
  g.vt = {};
  g.setRoom('blister');
  g.fade = 0; g.fadeTo = 0;
  const d = new E.Doom(g);
  g.mode = 'doom'; g.drive = d;
  let cells = 0;
  for (let i = 0; i < 9; i++) { const r = d.cellRect(i); const h = d.hit(r.x + 3, r.y + 3); if (h && h.kind === 'cell' && h.id === i) cells++; }
  ok(cells === 9 && d.buttons().length === 3 && d.buttons().every(b => d.hit(b.x + 2, b.y + 2).id === b.id), 'every cell and button of tic tac doom can be clicked');
  d.pointer(40, 40);
  R.render(g);
  ok(R.frame.px.every(v => v), 'tic tac doom screen fully painted');
  d.move(4);
  ok(d.anim && d.board[4] === 'x', 'the machine thinks after a move');
  d.click(40, 40, 0);
  ok(d.board.filter(v => v).length === 1, 'no second move while the machine thinks');
  for (let i = 0; i < 40; i++) { g.update(1 / 30); R.render(g); }
  ok(!d.anim && d.board[0] === 'o', 'the machine fills the first free cell');
  d.move(4);
  ok(d.board.filter(v => v).length === 2, 'a taken cell stays taken');
  ok(d.key('Escape'), 'escape leaves the game');
  idle(g);
  ok(g.mode === 'room' && !g.drive && g.roomId === 'blister' && !g.f.leadGot, 'back in the blister after escape');
  const bot = new E.Doom(g);
  g.mode = 'doom'; g.drive = bot;
  for (const start of [[], [4], [8, 7], [1]]) {
    bot.reset();
    let lost = false;
    for (const i of start) { if (bot.board[i]) continue; bot.board[i] = 'x'; bot.board[E.doomAi(bot.board)] = 'o'; }
    for (let turn = 0; turn < 6 && !lost; turn++) {
      const line = E.doomSolve(bot.board);
      if (!line) break;
      bot.board[line[0]] = 'x';
      const mv = E.doomAi(bot.board);
      bot.board[mv] = 'o';
      lost = E.doomWins(bot.board, 'o');
    }
    ok(lost || /Заново/.test(bot.hint()), 'max either finds a losing line or asks for a new game after ' + JSON.stringify(start));
  }
  g.mode = 'room'; g.drive = null;
  g.killTasks();
}

{
  const POS = { office: [150, 166], street: [340, 150], bosco: [130, 172], sybil: [100, 176], moon: [300, 160], shop: [100, 176], blister: [330, 176], vest: [100, 176], sanctum: [120, 176] };
  const ONE = { caseOpen: true, closetOpen: true, moonSeen: true, uniGot: true };
  const TWO = Object.assign({}, ONE, { uniRed: true, blisterOpen: true, abeMet: true, knowLove: true, copsMet: true, caseTaken: true, caseInMax: true, vestSeen: true });
  const THREE = Object.assign({}, ONE, { uniRed: true, blisterOpen: true, abeMet: true, knowLove: true, gastroGot: true, leadGot: true, copsMet: true, caseTaken: true, caseUnder: true, landerOpen: true, keyGot: true, caseBroken: true, spoonGot: true, vestSeen: true, doorSeen: true, hangerTaken: true });
  const FOUR = Object.assign({}, THREE, { doorOpen: true, beam: true, maxSplit: true, knowQuake: true, jimmyFlown: true, greenFed: true, deedGot: true, satDown: true });
  const FIVE = Object.assign({}, FOUR, { hatGot: true, cadGot: true, remoteGot: true, redDone: true, greenDone: true, blueDone: true, maxWhole: true });
  const STATES = [ONE, TWO, THREE, FOUR, FIVE];
  let actions = 0;
  STATES.forEach((st, si) => {
    const g = game(11 + si);
    idle(g);
    g.dialog = null;
    g.killTasks();
    g.actors.sam.act = ''; g.actors.sam.keepAct = false;
    for (const id of Object.keys(POS)) {
      const reset = () => {
        g.killTasks();
        g.mode = 'room'; g.drive = null; g.closeup = null; g.dialog = null; g.hideUI = false; g.ended = false;
        g.f = Object.assign({}, st);
        g.vt = {};
        g.actors.max.follow = 'sam';
        g.actors.max.scripted = false;
        g.actors.max.visible = true;
        g.setRoom(id);
        g.place('sam', id, POS[id][0], POS[id][1], 's');
        g.actors.sam.visible = true;
        g.fade = 0; g.fadeTo = 0;
      };
      reset();
      const targets = g.hotspots().map(h => h.id).concat(g.visibleActors().filter(a => g.actorHot(a) && a.id !== 'sam').map(a => a.id));
      for (const tg of targets) {
        for (const v of ['look', 'use', 'talk', ...ITEMS]) {
          if (g.roomId !== id || g.mode !== 'room' || g.ended || JSON.stringify(g.f) !== JSON.stringify(st) || (id === 'sanctum' && g.vt.fight && g.vt.fight.started)) reset();
          g.inv = ITEMS.slice();
          const verb = ['look', 'use', 'talk'].includes(v) ? v : 'use';
          const item = verb === v ? undefined : v;
          if (g.perform(verb, tg, item)) actions++;
          let n = 0;
          while ((g.busy || g.dialog || g.fade > 0.001 || g.mode !== 'room') && !g.ended && n++ < 30000) {
            g.update(1 / 30);
            if (g.dialog && !g.busy) { const ids = g.optionIds(); if (ids.includes('bye')) g.choose('bye'); else if (ids.length) g.choose(ids[ids.length - 1]); else g.endDialog(); }
            if (g.mode !== 'room' && !g.busy) { g.mode = 'room'; g.drive = null; }
          }
          step(g, 2);
          ok(n < 30000, `fuzz ${verb} ${tg} ${item || ''} in ${id} state ${si} settles: ` + g.log.slice(-1));
          ok(!g.closeup && !g.hideUI, `fuzz ${verb} ${tg} ${item || ''} in ${id} state ${si} leaves no closeup and shows the interface`);
          ok(g.actors.sam.visible && g.actors.sam.act === '', `fuzz ${verb} ${tg} ${item || ''} in ${id} state ${si} leaves sam on the stage`);
          ok(!g.actors.max.scripted && g.actors.max.visible, `fuzz ${verb} ${tg} ${item || ''} in ${id} state ${si} lets max follow again`);
        }
      }
    }
    ok(!g.log.some(l => l.startsWith('script error')), 'fuzz without script errors: ' + g.log.filter(l => l.startsWith('script error')).slice(0, 3).join(' | '));
  });
  ok(actions > 3000, 'fuzz ran many actions: ' + actions);
  const g = game(31);
  idle(g);
  g.dialog = null;
  g.killTasks();
  g.actors.sam.act = ''; g.actors.sam.keepAct = false;
  let moves = 0;
  for (const base of FIGHTS.slice(1)) {
    const reset = () => {
      g.killTasks();
      g.closeup = null; g.dialog = null; g.hideUI = false; g.ended = false; g.mode = 'room'; g.drive = null;
      g.f = Object.assign({}, FIVE);
      g.vt = {};
      g.actors.max.scripted = false;
      g.setRoom('sanctum');
      g.vt.fight = Object.assign({}, base);
      E.sanctum.stage(g);
      g.fade = 0; g.fadeTo = 0;
    };
    reset();
    const targets = g.hotspots().map(h => h.id).concat(['hugh', 'max', 'sam']);
    for (const tg of targets) {
      for (const v of ['look', 'use', 'talk', ...ITEMS]) {
        reset();
        g.inv = ITEMS.slice();
        const verb = ['look', 'use', 'talk'].includes(v) ? v : 'use';
        const item = verb === v ? undefined : v;
        if (g.perform(verb, tg, item)) moves++;
        let n = 0;
        while ((g.busy || g.dialog || g.fade > 0.001) && !g.ended && n++ < 60000) {
          g.update(1 / 30);
          if (g.dialog && !g.busy) { const ids = g.optionIds(); if (ids.includes('bye')) g.choose('bye'); else g.choose(ids[ids.length - 1]); }
        }
        step(g, 2);
        ok(n < 60000, `finale fuzz ${verb} ${tg} ${item || ''} in trap ${base.trap} settles: ` + g.log.slice(-1));
        ok(!g.closeup && !g.hideUI && g.actors.sam.visible && g.actors.sam.act === '' && !g.actors.max.scripted, `finale fuzz ${verb} ${tg} ${item || ''} in trap ${base.trap} leaves a playable stage`);
        if (!g.ended) {
          const ft = g.vt.fight;
          ok(ft && ft.started && g.roomId === 'sanctum' && !!g.f.frozen === !!ft.bound, `finale fuzz ${verb} ${tg} ${item || ''} in trap ${base.trap} keeps the fight consistent`);
          ok(!ft.bound || g.has('mtal'), 'a bound dog always holds the way out');
        }
      }
    }
    ok(!g.log.some(l => l.startsWith('script error')), 'finale fuzz without script errors: ' + g.log.filter(l => l.startsWith('script error')).slice(0, 3).join(' | '));
  }
  ok(moves > 600, 'finale fuzz ran many actions: ' + moves);
}

{
  playthrough(5, { mistakes: true, reload: true, order: 'rgb', walkAway: true });
  playthrough(9, { order: 'bgr', keyFirst: true, earlyJimmy: true });
  playthrough(22, { reload: true, order: 'grb', lateHanger: true });
}

{
  const SL = String.fromCharCode(47);
  const LINE = SL + SL, BLOCK = SL + '*';
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/sammax106/' + f).concat(['js/apps/sammax106-app.js', 'tests/sammax106.test.js', 'tools/sammax106-tour.cjs']);
  for (const f of files) {
    const src = read(f);
    ok(!src.includes(LINE) && !src.includes(BLOCK), f + ' has no comments');
  }
  ok(!read('sammax106.html').includes('<!' + '--'), 'page has no comments');
  const html = read('index.html');
  const page = read('sammax106.html');
  let lastA = -1, lastB = -1;
  for (const f of BASE) {
    const needle = `js/apps/sammax/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'engine script order in index.html and sammax106.html: ' + f);
    lastA = ia; lastB = ib;
  }
  for (const f of SHARED) {
    const needle = `js/apps/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'shared art modules come before episode 106: ' + f);
    lastA = ia; lastB = ib;
  }
  lastA = html.indexOf('js/apps/sammax105-app.js');
  ok(lastA > 0, 'episode 105 is loaded before episode 106');
  for (const f of ORDER) {
    const needle = `js/apps/sammax106/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'episode script order in index.html and sammax106.html: ' + f);
    lastA = ia; lastB = ib;
  }
  ok(fs.readdirSync(DIR).filter(f => f.endsWith('.js')).length === ORDER.length, 'every episode module is loaded by the pages');
  ok(html.indexOf('js/apps/sammax106-app.js') > lastA, 'desktop loads the wrapper');
  ok(!page.includes('sammax/sm-room') && !page.includes('mm-room') && !page.includes('sc-room') && !page.includes('al-room') && !page.includes('rt-room') && !page.includes('rt-story'), 'standalone page loads only the engine, shared art and episode 106');
  ok(page.includes('window.smx6=ui') && page.includes('ep:SamMax.EP106'), 'standalone page exposes the game for the browser tour');
  const gm = read('js/game-manager.js');
  const at = gm.indexOf('      sammax106: {');
  const entry = gm.slice(at, at + 2800);
  ok(at > 0 && /steam: true/.test(entry) && /price: 29\.49/.test(entry) && /targetExe: 'SAMMAX6\.EXE'/.test(entry) && /appSamMax106/.test(entry), 'Steam catalog entry');
  ok((gm.match(/price: 29\.49/g) || []).length === 1, 'the Steam price is not shared with another game');
  ok(/genre: '/.test(entry) && /tags: \[/.test(entry) && /shots: \[/.test(entry), 'Steam entry has genre, tags and screenshot captions');
  const tags = entry.match(/tags: \[([^\]]*)\]/);
  ok(tags && tags[1].split(',').length >= 3 && tags[1].split(',').length <= 5, 'Steam entry has three to five tags');
  const caps = entry.match(/shots: \[([^\]]*)\]/);
  ok(caps && caps[1].split("',").length >= 2, 'Steam entry has at least two screenshot captions');
  ok(!REAL_NAMES.test(entry), 'Steam entry follows the naming rule');
  ok(!/sammax106Granted/.test(gm), 'no grant flag');
  const loadState = gm.slice(gm.indexOf('loadState'), gm.indexOf('moveGamesToSteam(state)'));
  ok(!/'sammax106'/.test(loadState), 'not preinstalled');
  ok(/id === 'sammax106'/.test(gm), 'readme for the installed game');
  for (const n of [1, 2]) ok(fs.existsSync(path.join(ROOT, 'content/steam/sammax106-' + n + '.jpg')), 'Steam screenshot ' + n);
  ok(read('tools/steam-shots-recipes.cjs').includes('sammax106'), 'Steam screenshot recipe');
  ok(read('tools/sammax-shots.cjs').includes('window.smx6'), 'the shared shot tool knows the page of episode 106');
  const shell = {
    'js/desktop.js': ["isInstalled('sammax106')", 'appSamMax106'],
    'js/taskbar.js': ["isInstalled('sammax106')", "case 'sammax106'", "showInSteam('sammax106')"],
    'js/apps/dialogs.js': ["cmd === 'sammax106'", "showInSteam(\\'sammax106\\')"],
    'js/apps/explorer.js': ["item.app === 'sammax106'", 'SAMMAX6.EXE'],
    'js/filesystem.js': ["gmInstalled.includes('sammax106')", "'SAMMAX6.EXE'"],
    'js/apps/task-manager.js': ["'app_sammax106'", 'sammax6.exe'],
    'js/icons.js': ["'sammax106': `<svg"],
    'js/apps/clippy.js': ["id.startsWith('app_sammax106')", "launchProgram('sammax106', 'appSamMax106')"],
    'js/apps/steam.js': ["game: 'sammax106'"],
    'js/apps/advanced-site.js': ["id: 'sammax106'"],
    'js/apps/sammax106-app.js': ["id = 'app_sammax106'", 'ep: S.EP106'],
    'tests/steam.test.js': ["'sammax106'"]
  };
  for (const [f, needles] of Object.entries(shell)) {
    const src = read(f);
    for (const n of needles) ok(src.includes(n), `${f} contains ${n}`);
  }
  const clippy = read('js/apps/clippy.js');
  ok(clippy.indexOf("id.startsWith('app_sammax106')") < clippy.indexOf("id.startsWith('app_sammax')"), 'clippy checks episode 106 before episode 101');
  ok((read('js/i18n.js').match(/'app\.sammax106': 'Sam & Max: Bright Side of the Moon'/g) || []).length === 4, 'i18n title in every language');
  ok(read('package.json').includes('"test:sammax106": "node tests/sammax106.test.js"'), 'npm script');
  ok((read('package.json').match(/node tests\/sammax106\.test\.js/g) || []).length === 2, 'full test run includes episode 106');
  ok(fs.existsSync(path.join(ROOT, 'SAM-MAX-106.md')), 'episode document');
}

console.log(`sammax106: ${checks} checks passed in ${Date.now() - t0} ms`);
