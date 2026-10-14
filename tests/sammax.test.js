const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/sammax');
const ORDER = ['sm-core', 'sm-paint', 'sm-font', 'sm-sprites', 'sm-sprites2', 'sm-icons', 'sm-bg', 'sm-bg2', 'sm-bg3', 'sm-engine', 'sm-render', 'sm-story', 'sm-room-office', 'sm-room-street', 'sm-room-bosco', 'sm-room-sybil', 'sm-room-home', 'sm-room-dream', 'sm-closeups', 'sm-drive', 'sm-audio', 'sm-ui'];
let S;
for (const f of ORDER) S = require(path.join(DIR, f + '.js'));

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const VERBOSE = process.argv.includes('-v');
const t0 = Date.now();
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function game(seed) {
  const g = new S.Game({ seed });
  S.startNewGame(g);
  return g;
}

function step(g, n) { for (let i = 0; i < n; i++) g.update(1 / 30); }

function idle(g, max) {
  let n = 0;
  while ((g.busy || (g.fade > 0.001 && !g.ended) || (g.mode === 'drive' && g.drive && g.drive.kind === 'travel')) && n < (max || 6000)) { g.update(1 / 30); n++; }
  step(g, 3);
  ok(n < (max || 6000), 'game became idle in ' + g.roomId + ' after: ' + g.log.slice(-2).join(' | '));
  ok(!g.log.some(l => l.startsWith('script error')), 'no script errors: ' + g.log.filter(l => l.startsWith('script error')).join(' | '));
  return n;
}

function act(g, verb, target, item) {
  idle(g);
  const r = g.perform(verb, target, item);
  const a = typeof target === 'string' && g.actors[target];
  ok(r, `perform ${verb} ${typeof target === 'string' ? target : JSON.stringify(target)} ${item || ''} in ${g.roomId} busy=${g.busy} dlg=${g.dialog && g.dialog.id} actor=${a ? a.room + ':' + a.visible : '-'} hot=${g.hotspots().map(h => h.id).join(',')}`);
  idle(g);
}

function choose(g, id) {
  idle(g);
  ok(g.dialog, 'dialog open for ' + id + ' in ' + g.roomId + ' last: ' + g.log.slice(-1));
  ok(g.optionIds().includes(id), 'option ' + id + ' in ' + g.dialog.id + ': ' + g.optionIds().join(','));
  g.choose(id);
  idle(g);
}

function talk(g, who, opts) {
  act(g, 'talk', who);
  for (const o of opts) choose(g, o);
  if (g.dialog && g.optionIds().includes('bye')) choose(g, 'bye');
  ok(!g.dialog, 'dialog closed after talking to ' + who);
}

function go(g, hot, room) {
  act(g, 'use', hot);
  ok(g.roomId === room, `went to ${room} via ${hot}, now in ${g.roomId}`);
}

function mapTo(g, dest) {
  act(g, 'use', 'desoto');
  ok(g.mode === 'map' && g.drive, 'map opened');
  g.drive.choose(dest);
  if (dest === 'patrol') { ok(g.mode === 'drive' && g.drive.kind === 'patrol', 'patrol started'); return; }
  let n = 0;
  while (g.mode !== 'room' && n < 2000) { g.update(1 / 30); n++; }
  idle(g);
  ok(g.roomId === (dest === 'home' ? 'homegate' : dest), 'arrived at ' + dest + ' got ' + g.roomId);
}

function patrol(g) {
  const d = g.drive;
  let n = 0, shotBody = false;
  while (!g.f.gotCash && n < 20000) {
    n++;
    g.update(1 / 30);
    if (g.busy || d.paused) continue;
    const target = d.cars.filter(c => !c.pulled && c.z > 5 && c.z < 60).sort((a, b) => a.z - b.z)[0];
    if (!target) continue;
    if (d.lane !== target.lane) { d.lane = target.lane; continue; }
    if (Math.abs(d.x - target.lane) > 0.05) continue;
    if (target.z < 22 && !target.broken) {
      if (!shotBody) { shotBody = true; d.megaphone(); continue; }
      const r = d.lightRects(target)[0];
      d.shoot((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2);
      ok(target.broken, 'taillight broken by a shot: ' + JSON.stringify({ z: target.z, lane: target.lane, x: d.x, cars: d.cars.map(c => [c.z.toFixed(1), c.x.toFixed(2), c.broken]), log: g.log.slice(-2) }));
      continue;
    }
    if (target.broken && target.z < 22) d.megaphone();
  }
  idle(g);
  ok(g.f.gotCash && g.has('cash'), 'patrol produced cash');
  g.drive.selectTool('exit');
  let k = 0;
  while (g.mode !== 'room' && k < 3000) { g.update(1 / 30); k++; }
  idle(g);
  ok(g.roomId === 'street', 'back on the street after patrol');
}

function chase(g) {
  let n = 0, hits = 0, crates = 0;
  while (g.mode === 'drive' && n < 30000) {
    n++;
    g.update(1 / 30);
    const d = g.drive;
    if (!d || d.kind !== 'chase' || d.paused || g.busy) continue;
    crates = Math.max(crates, d.crates.length);
    const danger = d.crates.filter(c => c.z < 20).map(c => c.lane);
    const lanes = [-1, 0, 1].filter(l => !danger.includes(l));
    if (danger.includes(d.lane) && lanes.length) d.lane = lanes.sort((a, b) => Math.abs(a - d.lane) - Math.abs(b - d.lane))[0];
    const v = d.van;
    if (v.z < 15 && Math.abs(v.x - v.lane) < 0.05) {
      const p = d.carScreen(v);
      for (const [bit, sx] of [[1, -22], [2, 22]]) if (!(v.flat & bit)) { d.shoot(p.x + sx * p.s, p.y - 2); hits++; break; }
    }
  }
  idle(g);
  ok(crates > 0, 'the van throws crates');
  ok(g.roomId === 'homegate' && g.f.homeKnown && g.f.vanCrashed, 'chase ends at the home gate');
  return hits;
}

function inkTest(g, mistakes) {
  choose(g, 't1');
  for (let i = 0; i < 5; i++) {
    ok(g.dialog && g.dialog.id === 'ink', 'ink dialog card ' + i);
    ok(g.closeup && g.closeup.kind === 'inkblot', 'inkblot closeup ' + i);
    choose(g, mistakes && i === 2 ? 'none' : g.f.sym1);
  }
  if (mistakes) {
    ok(!g.f.test1 && !g.dialog && !g.closeup, 'wrong inkblot answer fails the test');
    act(g, 'talk', 'sybil');
    return inkTest(g, false);
  }
  ok(g.f.test1, 'inkblot test passed');
}

function assocTest(g, mistakes) {
  act(g, 'talk', 'sybil');
  choose(g, 't2');
  let guard = 0, erred = false;
  while (g.f.assoc && guard++ < 20) {
    ok(g.f.assocWaiting, 'sybil waits for an association');
    const a = g.f.assoc;
    const word = a.words[a.i];
    const trig = S.sybilTests.WORDS[g.f.sym2].includes(word);
    if (mistakes && !erred && !trig) { erred = true; act(g, 'use', 'sybil', 'glove'); continue; }
    if (trig) act(g, 'use', 'sybil', guard % 2 ? 'gun' : 'glove');
    else { act(g, 'talk', 'sybil'); choose(g, 'c0'); }
  }
  if (mistakes) { ok(!g.f.test2, 'violence on a neutral word fails'); return assocTest(g, false); }
  ok(g.f.test2, 'free association test passed');
}

function dreamTest(g, mistakes) {
  act(g, 'talk', 'sybil');
  choose(g, 't3');
  ok(g.roomId === 'dreamtest' && g.fx.dream, 'dream test room');
  const who = g.f.sym3 === 'mother' ? 'sybil' : 'max';
  const box = mistakes ? 'pizza' : g.f.sym3 === 'mother' ? 'wcake' : 'cake';
  let k = 0;
  while (S.sybilTests.WHO[g.f.dt.who] !== who && k++ < 8) act(g, 'use', 'dts');
  k = 0;
  while (S.sybilTests.BOX[g.f.dt.box] !== box && k++ < 8) act(g, 'use', 'box');
  ok(g.actors.dts.costume === who && g.actors.dts.solid === S.C.black, 'silhouette follows the choice');
  act(g, 'use', 'door');
  if (mistakes) { ok(g.roomId === 'sybil' && !g.f.test3 && g.has('form'), 'wrong dream fails'); return dreamTest(g, false); }
  ok(g.roomId === 'sybil' && g.f.test3, 'dream analysis passed');
  ok(g.has('formok') && !g.has('form'), 'form signed');
}

function reload(g) {
  ok(g.canSave(), 'can save in ' + g.roomId);
  const state = JSON.parse(JSON.stringify(g.saveState()));
  const h = new S.Game({ seed: state.seed });
  S.newGame(h);
  h.loadState(state);
  idle(h);
  ok(h.roomId === g.roomId && JSON.stringify(h.inv) === JSON.stringify(g.inv), 'reload keeps room and inventory');
  for (const [k, v] of Object.entries(g.f)) if (typeof v !== 'object') ok(h.f[k] === v, 'reload keeps flag ' + k);
  return h;
}

function playthrough(seed, o) {
  o = o || {};
  const cp = g => (o.reload ? reload(g) : g);
  let g = game(seed);
  idle(g);
  ok(g.roomId === 'office' && !g.f.phoneBack, 'intro done in the office');
  act(g, 'use', 'edoor');
  ok(g.roomId === 'office', 'cannot leave before the case');
  act(g, 'use', 'closet');
  act(g, 'use', 'cheesepile');
  ok(!g.has('swiss'), 'plain cheese is useless');
  act(g, 'use', 'cheesepile', 'gun');
  act(g, 'use', 'cheesepile');
  ok(g.has('swiss'), 'swiss cheese taken');
  act(g, 'use', 'hole', 'max');
  ok(!g.f.jimmyOut && !g.actors.jimmy.visible, 'jimmy stays in the hole');
  act(g, 'use', 'hole', 'swiss');
  ok(g.f.jimmyOut, 'jimmy lured out');
  g = cp(g);
  act(g, 'use', 'jimmy', 'max');
  ok(g.dialog && g.dialog.id === 'commish', 'commissioner on the phone');
  choose(g, 'who'); choose(g, 'force'); choose(g, 'bye');
  ok(g.f.caseOpen && g.f.phoneBack, 'case opened');
  act(g, 'use', 'glove'); act(g, 'use', 'ball'); act(g, 'use', 'rack');
  ok(g.has('glove') && g.has('ball') && g.has('hanger'), 'office items taken');
  go(g, 'edoor', 'street');
  talk(g, 'specs', ['who', 'brady', 'eyebo', 'glasses', 'stop']);
  ok(g.f.metSpecs && g.f.knowSpecsUp, 'talked to Specs');
  act(g, 'use', 'specs', 'glove');
  ok(!g.f.specsCured, 'cannot hit specs directly');
  g = cp(g);
  go(g, 'boscodoor', 'bosco');
  talk(g, 'bosco', ['sell', 'guard', 'tapes', 'whiz']);
  ok(g.f.knowLauncher && g.f.knowSecurity && g.f.knowPatrol, 'bosco briefed');
  act(g, 'use', 'stand');
  ok(g.has('tape'), 'eye-bo tape');
  act(g, 'use', 'table');
  ok(g.has('cheese'), 'took the cheese');
  act(g, 'use', 'exit');
  ok(g.roomId === 'bosco' && !g.has('cheese'), 'security stops cheese theft');
  act(g, 'use', 'wc', 'max');
  ok(g.f.maxInToilet && g.f.basketDown, 'max in toilet, basket down');
  act(g, 'use', 'exit');
  ok(g.roomId === 'bosco', 'cannot leave without max');
  act(g, 'use', 'table');
  act(g, 'use', 'basket', 'cheese');
  ok(g.f.cheeseInBasket, 'cheese planted');
  act(g, 'use', 'wc');
  ok(g.f.whizzerCured && !g.f.maxInToilet && g.actors.max.visible, 'whizzer cured by the security glove');
  ok(!g.has('cheese') && !g.f.cheeseInBasket, 'cheese back on the table');
  g = cp(g);
  go(g, 'exit', 'street');
  go(g, 'officedoor', 'office');
  act(g, 'use', 'tv');
  ok(!g.f.tvSeg, 'tv segments need the tape first');
  act(g, 'use', 'vcr', 'tape');
  ok(g.f.tapeWatched && g.f.knowHypno && !g.actors.sam.hypno, 'eye-bo watched');
  act(g, 'use', 'tv');
  ok(!g.f.tvSeg, 'tape blocks the tv');
  act(g, 'use', 'vcr');
  ok(g.has('tape'), 'tape ejected');
  for (let i = 0; i < 5; i++) act(g, 'use', 'tv');
  ok(g.f.tvDone, 'tv segments watched');
  go(g, 'edoor', 'street');
  act(g, 'use', 'spray');
  ok(g.has('spray'), 'spray can');
  act(g, 'use', 'oldgraffiti', 'spray');
  ok(g.f.graffitiRuined && g.actors.specs.x < 240, 'graffiti ruined, specs moved under the window');
  go(g, 'sybildoor', 'sybil');
  talk(g, 'peepers', ['doc', 'closet']);
  act(g, 'use', 'closet');
  ok(g.f.sybilFree && g.f.peepersRunning, 'sybil free, peepers runs');
  act(g, 'use', 'peepers', 'glove');
  ok(!g.f.peepersCured, 'cannot punch running peepers');
  talk(g, 'sybil', ['who', 'pp', 'cure']);
  ok(g.f.knowCure, 'cure known');
  g = cp(g);
  go(g, 'door', 'street');
  go(g, 'officedoor', 'office');
  act(g, 'use', 'window', 'ball');
  ok(g.f.specsCured && g.roomId === 'office' && !g.has('ball'), 'specs cured with a bowling ball');
  go(g, 'edoor', 'street');
  mapTo(g, 'patrol');
  patrol(g);
  g = cp(g);
  go(g, 'boscodoor', 'bosco');
  act(g, 'use', 'bosco', 'cash');
  ok(g.has('launcher') && !g.has('cash'), 'launcher bought');
  go(g, 'exit', 'street');
  go(g, 'sybildoor', 'sybil');
  act(g, 'use', 'peepers', 'launcher');
  ok(g.f.peepersGassed, 'peepers gassed');
  act(g, 'use', 'peepers', 'glove');
  ok(g.f.peepersCured && g.f.allCured, 'peepers cured, all cured');
  g = cp(g);
  act(g, 'use', 'door');
  ok(g.mode === 'drive' && g.drive && g.drive.kind === 'chase', 'van chase started on the street');
  const shots = chase(g);
  ok(shots >= 2, 'tires shot');
  act(g, 'use', 'slot', 'max');
  act(g, 'use', 'forms');
  ok(g.has('form'), 'form taken');
  act(g, 'use', 'slot', 'form');
  ok(!g.f.gateOpen && g.has('form'), 'unsigned form rejected');
  g = cp(g);
  mapTo(g, 'street');
  go(g, 'sybildoor', 'sybil');
  act(g, 'use', 'sybil', 'form');
  ok(g.f.testsExplained, 'tests explained');
  act(g, 'talk', 'sybil');
  inkTest(g, o.mistakes);
  assocTest(g, o.mistakes);
  dreamTest(g, o.mistakes);
  g = cp(g);
  go(g, 'door', 'street');
  mapTo(g, 'home');
  act(g, 'use', 'slot', 'formok');
  idle(g);
  ok(g.f.samHypno && g.roomId === 'street' && g.has('tapes') && !g.has('max') && g.actors.sam.hypno, 'sam hypnotized, max captured');
  g = cp(g);
  act(g, 'use', 'officedoor');
  ok(g.roomId === 'street', 'hypno sam refuses the office');
  act(g, 'use', 'desoto');
  ok(g.mode === 'room', 'hypno sam refuses the car');
  go(g, 'boscodoor', 'bosco');
  act(g, 'use', 'bosco', 'tapes');
  ok(g.f.tapesDelivered, 'tapes delivered');
  act(g, 'use', 'exit');
  ok(g.roomId === 'bosco' && g.has('tapes'), 'hypno loop brings new tapes');
  act(g, 'use', 'stand', 'tapes');
  act(g, 'use', 'table');
  act(g, 'use', 'exit');
  ok(g.roomId === 'dream' && g.fx.dream, 'knocked out into the dream');
  act(g, 'use', 'head');
  act(g, 'use', 'switch');
  act(g, 'use', 'antenna');
  act(g, 'use', 'closet');
  act(g, 'use', 'pump');
  act(g, 'use', 'jimmy', 'pump');
  act(g, 'use', 'sign');
  ok(!g.has('maxhead') && g.fx.flip === 0, 'the sign swings back');
  act(g, 'use', 'sign', 'gun');
  ok(g.has('maxhead'), 'caught max head');
  act(g, 'use', 'bmax', 'maxhead');
  idle(g);
  ok(g.roomId === 'bosco' && g.f.samCured && !g.f.samHypno && !g.fx.dream, 'woke up cured at Bosco');
  ok(!g.has('pump') && !g.has('antenna') && !g.has('maxhead'), 'dream items stay in the dream');
  g = cp(g);
  talk(g, 'bosco', ['hypno']);
  ok(g.f.knowBlocker, 'bosco tried a blocker');
  go(g, 'exit', 'street');
  mapTo(g, 'home');
  act(g, 'use', 'gate');
  ok(g.roomId === 'homegate', 'no studio without a helmet');
  mapTo(g, 'street');
  go(g, 'sybildoor', 'sybil');
  talk(g, 'sybil', ['shield']);
  ok(g.has('diagram'), 'diagram from sybil');
  go(g, 'door', 'street');
  go(g, 'boscodoor', 'bosco');
  act(g, 'use', 'bosco', 'hanger');
  ok(!g.has('helmet') && g.has('hanger'), 'hanger alone does nothing');
  act(g, 'use', 'bosco', 'diagram');
  act(g, 'use', 'bosco', 'hanger');
  ok(g.has('helmet'), 'helmet built');
  go(g, 'exit', 'street');
  g = cp(g);
  mapTo(g, 'home');
  act(g, 'use', 'gate');
  ok(g.roomId === 'studio' && g.f.finale && g.actors.sam.helmet, 'finale started with the helmet');
  talk(g, 'brady', ['give', 'out']);
  act(g, 'talk', 'specs');
  choose(g, 'attack'); choose(g, 'brady');
  ok(!g.f.bradyOut && !g.ended, 'loyalty lock');
  choose(g, 'become'); choose(g, 'brady');
  ok(!g.f.popBrady, 'brady resets from the booth');
  choose(g, 'dance');
  choose(g, 'worship'); choose(g, 'brady');
  ok(g.f.bradyOut, 'brady came out');
  if (o.mistakes) {
    choose(g, 'attack'); choose(g, 'me');
    ok(!g.dialog && !g.f.bradyOut, 'attacking sam resets the finale');
    act(g, 'talk', 'specs');
    choose(g, 'worship'); choose(g, 'brady');
    ok(g.f.bradyOut, 'brady came out again');
  }
  choose(g, 'become'); choose(g, 'brady');
  ok(g.f.popBrady, 'poppers became brady');
  choose(g, 'attack'); choose(g, 'brady');
  idle(g);
  ok(g.ended, 'game ended');
  ok(g.has('max') && g.actors.max.follow === 'sam', 'max back');
  return g;
}

{
  const g = game(7);
  for (const [id, room] of Object.entries(S.ROOMS)) {
    const b = new S.Buf(room.w, S.H, 0);
    room.paint(b, g);
    let zero = 0;
    for (let i = 0; i < b.px.length; i++) if (!b.px[i]) zero++;
    ok(zero === 0, 'room background fully painted: ' + id + ' (' + zero + ' holes)');
    for (const L of room.layers || []) {
      const art = S.LAYERS[L.src || id] && S.LAYERS[L.src || id][L.art || L.id];
      ok(typeof art === 'function', 'layer art exists ' + id + '.' + L.id);
      const spr = art(g);
      ok(spr && spr.w > 0 && spr.px.some(v => v), 'layer renders ' + id + '.' + L.id);
    }
    for (const h of room.hot || []) {
      ok(h.name, 'hotspot has a name ' + id + '.' + h.id);
      ok(h.look !== undefined, 'hotspot can be looked at ' + id + '.' + h.id);
      ok(h.poly || h.rect, 'hotspot has an area ' + id + '.' + h.id);
    }
    for (const [aid, h] of Object.entries(room.actors || {})) {
      ok(g.actors[aid], 'actor exists ' + aid);
      ok(h.name && h.look !== undefined, 'actor hotspot described ' + id + '.' + aid);
    }
  }
  const ENTRY = { office: [284, 162], street: [300, 150], bosco: [36, 172], sybil: [40, 170], homegate: [124, 182], studio: [44, 172], dream: [150, 168], dreamtest: [60, 172] };
  for (const [id, [ex, ey]] of Object.entries(ENTRY)) {
    g.setRoom(id);
    ok(g.walkable(ex, ey), 'entry point walkable ' + id);
    for (const h of S.ROOMS[id].hot || []) {
      const w = typeof h.walk === 'function' ? h.walk(g) : h.walk;
      if (!w) continue;
      const p = g.findPath(ex, ey, w[0], w[1]);
      ok(p && p.length, 'hotspot reachable ' + id + '.' + h.id);
      const end = p[p.length - 1];
      ok(Math.hypot(end[0] - w[0], end[1] - w[1]) < 8, 'walk point on the floor ' + id + '.' + h.id + ' -> ' + end.map(Math.round).join(','));
    }
  }
  for (const id of Object.keys(ENTRY).concat(Object.keys(ENTRY))) {
    if (id === 'office' && g.roomId === 'dreamtest') Object.assign(g.f, { closetOpen: true, phoneBack: true, basketDown: true, vanCrashed: true, dCloset: true, sybilFree: true, gateOpen: true, graffitiRuined: true });
    g.setRoom(id);
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
  for (const [id, it] of Object.entries(S.ITEMS)) {
    ok(it.name && it.look !== undefined, 'item described ' + id);
    ok(S.ICONS[it.icon || id], 'item icon ' + id);
    const ic = S.icon(id);
    ok(ic.w <= 28 && ic.h <= 22 && ic.px.some(v => v), 'item icon renders ' + id);
  }
  for (const [id, fn] of Object.entries(S.ICONS)) {
    const b = fn();
    ok(b && b.px.some(v => v), 'icon draws ' + id);
  }
  for (const [id, conv] of Object.entries(S.TALK)) {
    if (typeof conv.options === 'function') continue;
    const ids = conv.options.map(o => o.id);
    ok(new Set(ids).size === ids.length, 'unique option ids in ' + id);
    ok(conv.options.some(o => o.end), 'conversation can end ' + id);
    for (const o of conv.options) ok(o.text && S.ICONS[o.icon], 'option has text and icon ' + id + '.' + o.id);
  }
  for (const id of Object.keys(S.COSTUMES)) {
    for (const pose of [{ dir: 'e' }, { dir: 'w', walk: 0.25 }, { dir: 's', talk: 1 }, { dir: 'n' }, { dir: 's', hypno: true }, { act: 'ko', t: 1 }, { dir: 'e', helmet: true, act: 'shoot' }]) {
      const s = S.sprite(id, pose, 1);
      ok(s && s.buf.px.some(v => v), 'sprite renders ' + id + ' ' + JSON.stringify(pose));
    }
    const small = S.sprite(id, { dir: 's' }, 0.5);
    ok(small.buf.w < S.sprite(id, { dir: 's' }, 1).buf.w + 1, 'sprite scales ' + id);
  }
  for (const who of ['jimmy', 'bosco', 'sybil', 'brady', 'specs', 'whizzer', 'peepers', 'poppers', 'monkey', 'sam']) ok(S.art.portrait(who).px.some(v => v), 'portrait ' + who);
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js'));
  const missing = new Set();
  let strings = 0;
  for (const f of files) {
    const src = fs.readFileSync(path.join(DIR, f), 'utf8');
    const re = /'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
    let m;
    while ((m = re.exec(src))) {
      const s = (m[1] !== undefined ? m[1] : m[2]).replace(/\$\{[^}]*\}/g, '').replace(/\\u([0-9a-f]{4})/gi, (x, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\(.)/g, '$1');
      if (!/[а-яё]/i.test(s)) continue;
      strings++;
      for (const ch of s) if (ch !== '\n' && !S.font.has(ch)) missing.add(ch + ' in ' + f);
      for (const word of s.split(/\s+/)) ok(S.font.measure(word) < 190, 'word fits a speech line: ' + word);
    }
  }
  ok(strings > 600, 'found the game texts: ' + strings);
  ok(missing.size === 0, 'font covers every text character: ' + [...missing].slice(0, 10).join(', '));
}

{
  const R = new S.Renderer();
  const g = game(3);
  for (let i = 0; i < 300; i++) { g.update(1 / 30); if (i % 20 === 0) R.render(g); }
  g.skip();
  idle(g);
  ok(!g.busy && g.roomId === 'office', 'intro can be skipped');
  const out = new Uint8ClampedArray(320 * 200 * 4);
  R.toRGBA(g, out);
  ok(out.some((v, i) => i % 4 !== 3 && v > 0), 'frame converts to RGBA');
  for (const id of Object.keys(S.ROOMS)) {
    g.setRoom(id);
    g.fade = 0; g.fadeTo = 0;
    R.render(g);
    ok(R.frame.px.some(v => v > 2), 'room renders ' + id);
  }
  g.setRoom('office');
  g.closeup = { kind: 'tv', prog: 'eyebo', t0: 0 };
  R.render(g);
  for (const prog of ['news', 'specs', 'whizzer', 'peepers', 'brady', 'rerun']) { g.closeup = { kind: 'tv', prog, t0: 0 }; R.render(g); }
  g.closeup = { kind: 'inkblot', i: 2 };
  R.render(g);
  g.closeup = { kind: 'titlecard', t0: 0, lines: ['A', 'B', 'C'] };
  g.time = 5;
  R.render(g);
  g.closeup = null;
  const f = new S.Buf(320, 200);
  S.TITLE.draw(f, 1, 0, [true, false, true, true, false]);
  ok(S.TITLE.hit(40, 94) === 0 && S.TITLE.hit(40, 150) === 4 && S.TITLE.hit(300, 10) === -1, 'title menu hit test');
  g.verb = 'walk';
  g.cycleVerb(1);
  ok(g.verb === 'look', 'right click cycles verbs');
  g.click(S.INV.x + 4, S.INV.y + 4, 0);
  ok(g.invOpen, 'box opens the inventory');
  g.pointer(S.PANEL.x0 + 5, S.PANEL.y + 8);
  ok(g.hover && g.hover.kind === 'inv' && g.hover.id === g.inv[0], 'inventory hover');
  g.verb = 'use';
  g.click(S.PANEL.x0 + S.PANEL.cw + 5, S.PANEL.y + 8, 0);
  ok(g.held === g.inv[1] && !g.invOpen, 'picking an item holds it');
  g.click(10, 10, 2);
  ok(!g.held, 'right click drops the held item');
  const d = new S.Drive(g, 'patrol');
  g.mode = 'drive'; g.drive = d;
  for (let i = 0; i < 60; i++) g.update(1 / 30);
  R.render(g);
  d.key('ArrowLeft');
  ok(d.lane === -1, 'arrow keys change lanes');
  d.click(300, 72 + 25, 0);
  ok(d.tool === 'gun', 'tool buttons select tools');
  g.mode = 'room'; g.drive = null;
  const m = new S.MapScreen(g);
  g.mode = 'map'; g.drive = m;
  R.render(g);
  ok(m.hit(96, 118) === 'street' && m.hit(254, 150) === null, 'map shows only known places');
  g.mode = 'room'; g.drive = null;
}

{
  const g = game(11);
  idle(g);
  const give = ['max', 'gun', 'swiss', 'glove', 'ball', 'hanger', 'tape', 'spray', 'cash', 'launcher', 'form', 'diagram', 'helmet'];
  Object.assign(g.f, { caseOpen: true, phoneBack: true, knowHypno: true, tapeWatched: true });
  let actions = 0;
  for (const id of ['office', 'street', 'bosco', 'sybil', 'homegate']) {
    g.setRoom(id);
    const pos = { office: [150, 166], street: [300, 150], bosco: [100, 172], sybil: [100, 176], homegate: [80, 176] }[id];
    g.place('sam', id, pos[0], pos[1], 's');
    const targets = g.hotspots().map(h => h.id).concat(g.visibleActors().filter(a => g.actorHot(a) && a.id !== 'sam').map(a => a.id));
    for (const t of targets) {
      for (const v of ['look', 'use', 'talk', ...give]) {
        if (g.roomId !== id || g.mode !== 'room') { g.mode = 'room'; g.drive = null; g.closeup = null; g.setRoom(id); g.place('sam', id, pos[0], pos[1], 's'); }
        g.inv = give.slice();
        const verb = ['look', 'use', 'talk'].includes(v) ? v : 'use';
        const item = verb === v ? undefined : v;
        if (g.perform(verb, t, item)) actions++;
        let n = 0;
        while ((g.busy || g.dialog || g.fade > 0.001 || g.mode !== 'room') && n++ < 4000) {
          g.update(1 / 30);
          if (g.dialog && !g.busy) { if (g.optionIds().includes('bye')) g.choose('bye'); else g.endDialog(); }
          if (g.mode !== 'room' && !g.busy) { g.mode = 'room'; g.drive = null; }
        }
        ok(n < 4000, `fuzz ${verb} ${t} ${item || ''} in ${id} settles`);
      }
    }
  }
  ok(actions > 400, 'fuzz ran many actions: ' + actions);
  ok(!g.log.some(l => l.startsWith('script error')), 'fuzz without script errors');
}

{
  const combos = new Map();
  for (let seed = 1; seed < 400 && combos.size < 8; seed++) {
    const r = new S.RNG(seed);
    const key = (r.next() < 0.5 ? 'money' : 'fame') + '/' + (r.next() < 0.5 ? 'teeth' : 'hair') + '/' + (r.next() < 0.5 ? 'mother' : 'peers');
    if (!combos.has(key)) combos.set(key, seed);
  }
  ok(combos.size === 8, 'all symptom combinations exist');
  let first = true;
  for (const [key, seed] of combos) {
    const g = playthrough(seed, { mistakes: first, reload: first });
    ok([g.f.sym1, g.f.sym2, g.f.sym3].join('/') === key, 'symptoms follow the seed ' + key);
    first = false;
  }
}

{
  const SL = String.fromCharCode(47);
  const LINE = SL + SL, BLOCK = SL + '*';
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/sammax/' + f).concat(['js/apps/sammax-app.js', 'tests/sammax.test.js']);
  for (const f of files) {
    const src = read(f);
    ok(!src.includes(LINE) && !src.includes(BLOCK), f + ' has no comments');
  }
  ok(!read('css/apps/sammax.css').includes(BLOCK), 'css has no comments');
  ok(!read('sammax.html').includes('<!' + '--'), 'page has no comments');
  const html = read('index.html');
  const page = read('sammax.html');
  let lastA = -1, lastB = -1;
  for (const f of ORDER) {
    const needle = `js/apps/sammax/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'script order in index.html and sammax.html: ' + f);
    lastA = ia; lastB = ib;
  }
  ok(fs.readdirSync(DIR).filter(f => f.endsWith('.js')).length === ORDER.length, 'every module is loaded by the pages');
  ok(html.indexOf('js/apps/sammax-app.js') > lastA && html.includes('css/apps/sammax.css'), 'desktop loads the wrapper and styles');
  const gm = read('js/game-manager.js');
  const at = gm.indexOf('      sammax: {');
  const entry = gm.slice(at, at + 2000);
  ok(at > 0 && /steam: true/.test(entry) && /price: 21\.99/.test(entry) && /targetExe: 'SAMMAX\.EXE'/.test(entry) && /appSamMax/.test(entry), 'Steam catalog entry');
  ok(!/sammaxGranted/.test(gm), 'no grant flag');
  const loadState = gm.slice(gm.indexOf('loadState'), gm.indexOf('moveGamesToSteam(state)'));
  ok(!/'sammax'/.test(loadState), 'not preinstalled');
  const shell = {
    'js/desktop.js': ["isInstalled('sammax')", 'appSamMax'],
    'js/taskbar.js': ["isInstalled('sammax')", "case 'sammax'", "showInSteam('sammax')"],
    'js/apps/dialogs.js': ["cmd === 'sammax'", "showInSteam(\\'sammax\\')"],
    'js/apps/explorer.js': ["item.app === 'sammax'", 'SAMMAX.EXE'],
    'js/filesystem.js': ["gmInstalled.includes('sammax')", "'SAMMAX.EXE'"],
    'js/apps/task-manager.js': ["'app_sammax'", 'sammax.exe'],
    'js/icons.js': ["'sammax': `<svg"],
    'js/apps/clippy.js': ["id.startsWith('app_sammax')"],
    'js/apps/sammax-app.js': ["id = 'app_sammax'", 'S.UI(root']
  };
  for (const [f, needles] of Object.entries(shell)) {
    const src = read(f);
    for (const n of needles) ok(src.includes(n), `${f} contains ${n}`);
  }
  ok((read('js/i18n.js').match(/'app\.sammax': 'Sam & Max: Culture Shock'/g) || []).length === 4, 'i18n title in every language');
}

console.log(`sammax: ${checks} checks passed in ${Date.now() - t0} ms`);
