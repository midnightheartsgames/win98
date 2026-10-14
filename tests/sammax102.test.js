const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const BASE_DIR = path.join(ROOT, 'js/apps/sammax');
const DIR = path.join(ROOT, 'js/apps/sammax102');
const BASE = ['sm-core', 'sm-paint', 'sm-font', 'sm-sprites', 'sm-sprites2', 'sm-icons', 'sm-bg', 'sm-bg2', 'sm-bg3', 'sm-engine', 'sm-render', 'sm-closeups', 'sm-drive', 'sm-audio', 'sm-ui'];
const ORDER = ['sc-story', 'sc-sprites', 'sc-icons', 'sc-bg', 'sc-bg2', 'sc-closeups', 'sc-room-office', 'sc-room-street', 'sc-room-bosco', 'sc-room-sybil', 'sc-room-warp', 'sc-room-sitcom', 'sc-room-cooking', 'sc-room-idol', 'sc-room-quiz', 'sc-room-myra', 'sc-drive'];
let S;
for (const f of BASE) S = require(path.join(BASE_DIR, f + '.js'));
for (const f of ORDER) S = require(path.join(DIR, f + '.js'));
const E = S.EP102;

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function game(seed) {
  const g = new S.Game({ seed, ep: E });
  E.startNewGame(g);
  return g;
}

function step(g, n) { for (let i = 0; i < n; i++) g.update(1 / 30); }

function idle(g, max) {
  let n = 0;
  while ((g.busy || (g.fade > 0.001 && !g.ended) || (g.mode === 'drive' && g.drive && g.drive.kind === 'travel')) && n < (max || 8000)) { g.update(1 / 30); n++; }
  step(g, 3);
  ok(n < (max || 8000), 'game became idle in ' + g.roomId + ' after: ' + g.log.slice(-2).join(' | '));
  ok(!g.log.some(l => l.startsWith('script error')), 'no script errors: ' + g.log.filter(l => l.startsWith('script error')).join(' | '));
  return n;
}

function act(g, verb, target, item) {
  idle(g);
  const r = g.perform(verb, target, item);
  const a = typeof target === 'string' && g.actors[target];
  ok(r, `perform ${verb} ${target} ${item || ''} in ${g.roomId} busy=${g.busy} dlg=${g.dialog && g.dialog.id} actor=${a ? a.room + ':' + a.visible : '-'} hot=${g.hotspots().map(h => h.id).join(',')}`);
  idle(g);
}

function choose(g, id) {
  idle(g);
  ok(g.dialog, 'dialog open for ' + id + ' in ' + g.roomId + ' last: ' + g.log.slice(-1));
  ok(g.optionIds().includes(id), 'option ' + id + ' in ' + g.dialog.id + ': ' + g.optionIds().join(','));
  g.choose(id);
  idle(g);
}

function close(g) {
  if (g.dialog && g.optionIds().includes('bye')) choose(g, 'bye');
  ok(!g.dialog, 'dialog closed in ' + g.roomId);
}

function talk(g, who, opts) {
  act(g, 'talk', who);
  for (const o of opts) choose(g, o);
  close(g);
}

function go(g, hot, room) {
  act(g, 'use', hot);
  ok(g.roomId === room, `went to ${room} via ${hot}, now in ${g.roomId}`);
}

function mapTo(g, dest) {
  act(g, 'use', g.roomId === 'warp' ? 'exit' : 'desoto');
  ok(g.mode === 'map' && g.drive, 'map opened in ' + g.roomId);
  ok(g.drive.dests().some(([id]) => id === dest), 'destination on the map: ' + dest);
  g.drive.choose(dest);
  if (dest === 'rats') { ok(g.mode === 'drive' && g.drive.kind === 'rats', 'rat chase started'); return; }
  let n = 0;
  while (g.mode !== 'room' && n < 3000) { g.update(1 / 30); n++; }
  idle(g);
  ok(g.roomId === E.DEST[dest].room, 'arrived at ' + dest + ', now ' + g.roomId);
}

function ratChase(g) {
  let n = 0, shots = 0, trash = 0, holes = 0;
  while (g.mode === 'drive' && n < 40000) {
    n++;
    g.update(1 / 30);
    const d = g.drive;
    if (d && d.kind === 'rats') { trash = Math.max(trash, d.trash.length); holes = Math.max(holes, d.holes.length); }
    if (!d || d.kind !== 'rats' || d.paused || g.busy) continue;
    const danger = d.trash.filter(c => c.z < 14).map(c => c.lane);
    const lanes = [-1, 0, 1].filter(l => !danger.includes(l));
    if (danger.includes(d.lane) && lanes.length) d.lane = lanes.sort((a, b) => Math.abs(a - d.lane) - Math.abs(b - d.lane))[0];
    const r = d.rat;
    if (r.fall || r.z > 19 || Math.abs(r.x - r.lane) > 0.15) continue;
    const hole = d.holes.filter(h => h.z > r.z + 1.5 && h.z < r.z + 11).sort((a, b) => a.z - b.z)[0];
    if (!hole || hole.lane === r.lane) continue;
    const p = d.carScreen(r);
    const dir = hole.lane > r.lane ? 1 : -1;
    d.shoot(p.x + (dir > 0 ? -12 : 12) * p.s, p.y - 10 * p.s);
    shots++;
  }
  idle(g);
  ok(holes > 0 && trash > 0, 'the chase has manholes and thrown trash');
  ok(shots > 0, 'the bot pushed the rat car');
  ok(g.roomId === 'street' && g.f.chaseWon && g.has('cream'), 'rats caught, cream back, returned to the street');
}

function reload(g) {
  ok(g.canSave(), 'can save in ' + g.roomId);
  const state = JSON.parse(JSON.stringify(g.saveState()));
  const h = new S.Game({ seed: state.seed, ep: E });
  E.newGame(h);
  h.loadState(state);
  idle(h);
  ok(h.roomId === g.roomId && JSON.stringify(h.inv) === JSON.stringify(g.inv), 'reload keeps room and inventory');
  for (const [k, v] of Object.entries(g.f)) if (typeof v !== 'object') ok(h.f[k] === v, 'reload keeps flag ' + k);
  return h;
}

function sitcom(g, mistakes) {
  talk(g, 'director', ['plot', 'feather', 'sponsor']);
  talk(g, 'philo', ['who', 'improv']);
  if (mistakes) {
    act(g, 'talk', 'director');
    choose(g, 'go');
    ok(g.f.take && g.actors.philo.v === 'featherly', 'take started');
    ok(!g.canSave(), 'no saving during a take');
    act(g, 'use', 'table');
    ok(g.has('plate'), 'plate taken');
    act(g, 'use', 'cowpie', 'plate');
    ok(!g.f.take && !g.has('plate'), 'serving without a chef spoils the take');
    act(g, 'talk', 'director');
    choose(g, 'go');
    act(g, 'use', 'lamp');
    act(g, 'use', 'bessy', 'lampshade');
    ok(g.dialog && g.dialog.id === 'ident', 'identity dialog');
    ok(g.optionIds().join(',') === 'chef,lincoln,prince,cow', 'lampshade identities');
    choose(g, 'lincoln');
    ok(g.f.take && g.f.take.id === 'lincoln', 'featherly plays along with Lincoln');
    act(g, 'use', 'philo', 'max');
    ok(!g.f.take, 'early sponsor line spoils the take');
    act(g, 'talk', 'director');
    choose(g, 'go');
    act(g, 'use', 'bessy', 'cream');
    choose(g, 'uncle');
    act(g, 'talk', 'director');
    choose(g, 'again');
    ok(!g.f.take && g.actors.bessy.v === '', 'retake resets the cow');
    act(g, 'talk', 'director');
    choose(g, 'go');
    for (let i = 0; i < 60 * 30 && g.f.take; i++) g.update(1 / 30);
    idle(g);
    ok(!g.f.take, 'featherly notices an undisguised cow');
  }
  act(g, 'talk', 'director');
  choose(g, 'go');
  act(g, 'use', 'lamp');
  ok(g.has('lampshade'), 'lampshade taken');
  act(g, 'use', 'bessy', 'lampshade');
  choose(g, 'chef');
  ok(g.f.take.id === 'chef' && g.actors.bessy.v === 'lampshade', 'the cow is our chef');
  act(g, 'use', 'table');
  act(g, 'use', 'cowpie', 'plate');
  ok(g.dialog && g.dialog.id === 'moo', 'featherly asks what the chef said');
  if (mistakes) {
    choose(g, 'moo');
    ok(!g.f.take, 'saying moo spoils the take');
    act(g, 'talk', 'director');
    choose(g, 'go');
    act(g, 'use', 'lamp');
    act(g, 'use', 'bessy', 'lampshade');
    choose(g, 'chef');
    act(g, 'use', 'table');
    act(g, 'use', 'cowpie', 'plate');
  }
  choose(g, 'mgp');
  ok(g.f.take && g.f.take.answered, 'moo goo gai pan');
  if (mistakes) {
    act(g, 'talk', 'max');
    choose(g, 'sponsor');
  } else act(g, 'use', 'philo', 'max');
  ok(g.f.tapeDone && g.f.staff && g.has('vtape') && !g.f.take, 'episode wrapped, tape received');
  ok(!g.has('lampshade') && !g.has('plate'), 'props returned');
}

function cook(g, dish) {
  act(g, 'talk', 'director');
  choose(g, 'go');
  ok(g.dialog && g.dialog.id === 'cook' && g.actors.sam.v === 'blind', 'cooking show on air, sam blindfolded');
  ok(!g.canSave(), 'no saving on air');
  choose(g, dish);
  for (let i = 0; i < 3; i++) choose(g, 'f' + (i % 3));
  choose(g, 'oven');
  ok(!g.f.cook && g.actors.sam.v === '', 'show finished');
}

function playthrough(seed, o) {
  o = o || {};
  const cp = g => (o.reload ? reload(g) : g);
  let g = game(seed);
  idle(g);
  ok(g.roomId === 'office' && g.dialog && g.dialog.id === 'commish', 'intro ends with the commissioner');
  choose(g, 'why'); choose(g, 'force'); choose(g, 'where'); choose(g, 'bye');
  ok(g.f.caseOpen && !g.dialog, 'case opened');
  for (let i = 0; i < 5; i++) act(g, 'use', 'tv');
  ok(g.f.tvDone && g.f.tvSeg === 5, 'myra segments watched');
  go(g, 'edoor', 'street');
  go(g, 'boscodoor', 'bosco');
  talk(g, 'bosco', ['who', 'sell', 'how', 'cream']);
  ok(g.f.knowMod, 'modulator known');
  act(g, 'use', 'bosco', 'coin');
  act(g, 'use', 'table');
  ok(g.roomId === 'bosco' && g.f.creamStolen && !g.has('cream'), 'rats stole the cream');
  ok(g.actors.ratcar.room === 'nowhere', 'rat car left the alley');
  g = cp(g);
  go(g, 'exit', 'street');
  mapTo(g, 'rats');
  ratChase(g);
  g = cp(g);
  go(g, 'sybildoor', 'sybil');
  talk(g, 'sybil', ['job', 'paper', 'scandal', 'alien', 'myra']);
  ok(g.f.knowScandal && g.f.knowGreen, 'sybil explained the scandal');
  go(g, 'door', 'street');
  mapTo(g, 'warp');
  act(g, 'use', 'door1');
  ok(g.roomId === 'warp', 'rope blocks the corridor');
  act(g, 'talk', 'director');
  choose(g, 'who');
  choose(g, 'audition');
  close(g);
  ok(g.f.auditionOn && g.f.metDirector, 'audition announced');
  if (o.mistakes) {
    act(g, 'use', 'director', 'cream');
    ok(!g.f.audRabid, 'cream on the director does nothing');
  }
  act(g, 'use', 'sam', 'cream');
  ok(g.f.audRabid && g.actors.sam.v === 'foam', 'rabid dog');
  act(g, 'use', 'max', 'launcher');
  ok(g.f.hired && g.actors.sam.v === '' && g.actors.director.room === 'sitcom', 'hired, director moved on');
  act(g, 'use', 'door2');
  ok(g.roomId === 'warp', 'other sets need staff status');
  go(g, 'door1', 'sitcom');
  sitcom(g, o.mistakes);
  g = cp(g);
  go(g, 'exit', 'warp');
  go(g, 'door3', 'idol');
  ok(g.f.idolSeen && g.actors.peepers.x < 100, 'peepers sang, stand has lyrics');
  talk(g, 'whizzer', ['vote', 'sad', 'food']);
  ok(g.f.knowBday && g.f.knowTomato, 'whizzer: birthday and tomatoes');
  talk(g, 'specs', ['judge', 'bday']);
  talk(g, 'director', ['rules', 'pit']);
  act(g, 'use', 'stand');
  ok(g.has('lyrics') && g.f.lyricsTaken, 'lyrics taken');
  if (o.mistakes) {
    act(g, 'use', 'mic');
    choose(g, 'a'); choose(g, 'b');
    ok(!g.f.contractWon && g.actors.sam.visible && g.actors.sam.x < 60, 'losing drops sam into the pit');
  }
  go(g, 'exit', 'warp');
  go(g, 'door4', 'quiz');
  act(g, 'use', 'slot', 'lyrics');
  ok(!g.f.cardsSwapped && g.has('lyrics'), 'cards are in hugh hands before a game');
  act(g, 'talk', 'hugh');
  choose(g, 'who'); choose(g, 'rules');
  choose(g, 'trick');
  choose(g, 'mindmax');
  choose(g, o.mistakes ? 'red' : 'green');
  choose(g, 'back');
  choose(g, 'photo');
  ok(g.has('photo') && g.f.photoColor === (o.mistakes ? 'red' : 'green'), 'photo with hugh');
  act(g, 'use', 'player');
  ok(g.dialog && g.dialog.id === 'quizq', 'impossible question');
  choose(g, 'a2');
  ok(g.f.quizLost && g.f.cardsIn && g.has('coin'), 'lost, consolation coin');
  act(g, 'use', 'slot');
  ok(!g.f.cardsSwapped, 'stealing the cards is pointless');
  act(g, 'use', 'slot', 'lyrics');
  ok(g.f.cardsSwapped && g.has('cards') && !g.has('lyrics'), 'cards swapped for lyrics');
  if (o.mistakes) {
    act(g, 'use', 'player');
    ok(g.dialog && g.dialog.id === 'quizlyric', 'lyric question');
    choose(g, 'yes');
    ok(!g.f.quizWon && g.has('coin'), 'wrong answer keeps the coin and loses');
    act(g, 'talk', 'hugh');
    choose(g, 'trick'); choose(g, 'blue'); choose(g, 'back');
    close(g);
    act(g, 'use', 'player');
    choose(g, 'yes');
  } else {
    act(g, 'use', 'player');
    choose(g, 'no');
  }
  ok(g.f.quizWon && g.has('stamps'), 'million in food stamps');
  g = cp(g);
  go(g, 'exit', 'warp');
  go(g, 'door2', 'cooking');
  talk(g, 'director', ['what', 'host']);
  cook(g, o.mistakes ? 'stew' : 'cake');
  if (o.mistakes) { ok(!g.has('cake'), 'stew is not a cake'); cook(g, 'cake'); }
  ok(g.has('cake') && g.f.cakeMade, 'cake cooked');
  go(g, 'exit', 'warp');
  go(g, 'door3', 'idol');
  act(g, 'use', 'whizzer', 'cake');
  ok(!g.f.whizzerGone && g.has('cake'), 'plain cake is not red enough');
  go(g, 'exit', 'warp');
  mapTo(g, 'street');
  go(g, 'boscodoor', 'bosco');
  act(g, 'use', 'bosco', 'stamps');
  ok(g.has('modulator') && g.f.modBought && !g.has('stamps'), 'modulator bought');
  act(g, 'use', 'condiments', 'cake');
  ok(g.has('kcake') && !g.has('cake'), 'cake frosted with ketchup');
  go(g, 'exit', 'street');
  act(g, 'use', 'paperbox', 'coin');
  ok(!g.has('paper') && g.has('coin'), 'no paper before the issue');
  go(g, 'sybildoor', 'sybil');
  act(g, 'use', 'sybil', 'photo');
  if (o.mistakes) {
    ok(!g.f.paperOut && g.has('photo'), 'a red man is no alien');
    go(g, 'door', 'street');
    mapTo(g, 'warp');
    go(g, 'door4', 'quiz');
    act(g, 'talk', 'hugh');
    choose(g, 'trick'); choose(g, 'green'); choose(g, 'back'); choose(g, 'photo');
    ok(g.f.photoColor === 'green', 'green photo');
    go(g, 'exit', 'warp');
    mapTo(g, 'street');
    go(g, 'sybildoor', 'sybil');
    act(g, 'use', 'sybil', 'photo');
  }
  ok(g.f.paperOut && !g.has('photo'), 'paper printed');
  g = cp(g);
  go(g, 'door', 'street');
  act(g, 'use', 'paperbox', 'coin');
  ok(g.has('paper') && !g.has('coin'), 'paper bought');
  mapTo(g, 'warp');
  go(g, 'door3', 'idol');
  act(g, 'use', 'whizzer', 'kcake');
  ok(g.f.whizzerGone && g.actors.whizzer.room === 'nowhere', 'time out for number two');
  if (o.mistakes) {
    act(g, 'use', 'mic');
    choose(g, 'c'); choose(g, 'c');
    ok(!g.f.contractWon, 'low voice loses even alone');
  }
  act(g, 'use', 'sam', 'modulator');
  ok(g.f.high, 'helium voice');
  act(g, 'use', 'mic');
  choose(g, 'b'); choose(g, 'a');
  ok(g.f.contractWon && g.has('contract') && !g.f.high, 'recording contract');
  g = cp(g);
  go(g, 'exit', 'warp');
  talk(g, 'myradoor', ['guest', 'bear']);
  ok(g.f.knowProofs, 'myra listed the proofs');
  act(g, 'use', 'hatch', 'photo');
  act(g, 'use', 'myradoor', 'vtape');
  act(g, 'use', 'hatch', 'contract');
  ok(g.f.proofTape && g.f.proofContract && !g.f.proofPaper && g.roomId === 'warp', 'two proofs shown');
  act(g, 'use', 'myradoor', 'paper');
  ok(g.roomId === 'myra' && g.f.showOn && g.f.frozen, 'on the show');
  ok(!g.canSave(), 'no saving on the show');
  act(g, 'use', 'bear');
  ok(g.count('sit') === 2, 'myra says sit');
  act(g, 'use', 'banjo');
  ok(!g.f.banjoOk, 'banjo needs an invitation');
  talk(g, 'myra', ['free', 'bear', 'idol']);
  ok(g.f.banjoOk, 'banjo offered');
  if (o.mistakes) {
    act(g, 'use', 'banjo');
    ok(!g.f.wet, 'normal voice leaves the glass intact');
    act(g, 'talk', 'myra');
    choose(g, 'photo');
    choose(g, 'bessy');
    ok(!g.ended && !g.f.wet && g.actors.myra.act === '', 'fainting on a dry desk changes nothing');
  }
  act(g, 'use', 'sam', 'modulator');
  act(g, 'use', 'banjo');
  ok(g.f.wet, 'glass shattered');
  act(g, 'talk', 'myra');
  choose(g, 'photo');
  choose(g, 'hugh');
  choose(g, 'featherly');
  ok(!g.ended, 'wrong guests move the mic elsewhere');
  choose(g, 'bessy');
  idle(g);
  ok(g.ended && g.f.bearFried && g.roomId === 'office', 'myra and the bear electrocuted, ending in the office');
  return g;
}

{
  const g = game(7);
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
    for (const [aid, h] of Object.entries(room.actors || {})) {
      ok(g.actors[aid], 'actor exists ' + aid);
      ok(h.name && h.look !== undefined, 'actor hotspot described ' + id + '.' + aid);
    }
  }
  g.f.hired = true;
  const ENTRY = { office: [284, 162], street: [300, 150], bosco: [36, 172], sybil: [40, 170], warp: [40, 172], sitcom: [30, 172], cooking: [30, 172], idol: [30, 178], quiz: [30, 172] };
  for (const [id, [ex, ey]] of Object.entries(ENTRY)) {
    g.setRoom(id);
    ok(g.walkable(ex, ey), 'entry point walkable ' + id);
    for (const h of E.ROOMS[id].hot || []) {
      const w = typeof h.walk === 'function' ? h.walk(g) : h.walk;
      if (!w) continue;
      const p = g.findPath(ex, ey, w[0], w[1]);
      ok(p && p.length, 'hotspot reachable ' + id + '.' + h.id);
      const end = p[p.length - 1];
      ok(Math.hypot(end[0] - w[0], end[1] - w[1]) < 8, 'walk point on the floor ' + id + '.' + h.id + ' -> ' + end.map(Math.round).join(','));
    }
  }
  Object.assign(g.f, { closetOpen: true, wet: true, cardsIn: true });
  for (const id of Object.keys(E.ROOMS)) {
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
  for (const [id, it] of Object.entries(E.ITEMS)) {
    ok(it.name && it.look !== undefined, 'item described ' + id);
    const icon = typeof it.icon === 'function' ? it.icon(g) : it.icon;
    ok(S.ICONS[icon], 'item icon ' + id);
    const ic = S.icon(icon);
    ok(ic.w <= 28 && ic.h <= 22 && ic.px.some(v => v), 'item icon renders ' + id);
  }
  for (const c of ['', 'red', 'green', 'blue']) { g.f.photoColor = c; ok(S.ICONS[g.itemIcon('photo')], 'photo icon for colour ' + c); }
  for (const [id, fn] of Object.entries(S.ICONS)) { const b = fn(); ok(b && b.px.some(v => v), 'icon draws ' + id); }
  for (const [id, conv] of Object.entries(E.TALK)) {
    if (typeof conv.options === 'function') continue;
    const ids = conv.options.map(o => o.id);
    ok(new Set(ids).size === ids.length, 'unique option ids in ' + id);
    ok(conv.options.some(o => o.end), 'conversation can end ' + id);
    for (const o of conv.options) ok(o.text && S.ICONS[o.icon], 'option has text and icon ' + id + '.' + o.id);
  }
  for (const id of ['lord', 'skinrat', 'ratcar', 'director', 'philo', 'bessy', 'hugh', 'myra', 'bear', 'ratcarRear', 'manhole', 'trashcan']) {
    for (const pose of [{ dir: 'e' }, { dir: 'w', walk: 0.25 }, { dir: 's', talk: 1 }, { act: 'moo' }, { act: 'fried', t: 1 }, { act: 'faint' }, { v: 'green', act: 'magic' }, { v: 'featherly', act: 'pull' }, { v: 'lampshade' }]) {
      const s = S.sprite(id, pose, 1);
      ok(s && s.buf.px.some(v => v), 'sprite renders ' + id + ' ' + JSON.stringify(pose));
    }
  }
  for (const pose of [{ dir: 's', v: 'foam' }, { dir: 'e', v: 'foam' }, { dir: 's', v: 'blind' }]) ok(S.sprite('sam', pose, 1).buf.px.some(v => v), 'sam pose ' + JSON.stringify(pose));
  ok(S.sprite('max', { dir: 's', act: 'cry' }, 1).buf.px.some(v => v) && S.sprite('peepers', { dir: 's', act: 'sing' }, 1).buf.px.some(v => v), 'new shared poses');
  for (const who of ['myra', 'hugh', 'director', 'philo', 'featherly', 'bessy', 'lord', 'rat', 'bear']) ok(S.art102.portrait(who).px.some(v => v), 'portrait ' + who);
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
    }
  }
  ok(strings > 700, 'found the game texts: ' + strings);
  ok(missing.size === 0, 'font covers every text character: ' + [...missing].slice(0, 10).join(', '));
}

{
  const R = new S.Renderer();
  const g = game(3);
  for (let i = 0; i < 400; i++) { g.update(1 / 30); if (i % 25 === 0) R.render(g); }
  g.skip();
  idle(g);
  ok(g.roomId === 'office' && g.dialog && g.dialog.id === 'commish', 'intro can be skipped to the call');
  const out = new Uint8ClampedArray(320 * 200 * 4);
  R.toRGBA(g, out);
  ok(out.some((v, i) => i % 4 !== 3 && v > 0), 'frame converts to RGBA');
  g.dialog = null;
  for (const id of Object.keys(E.ROOMS)) {
    g.setRoom(id);
    g.fade = 0; g.fadeTo = 0;
    R.render(g);
    ok(R.frame.px.some(v => v > 2), 'room renders ' + id);
  }
  g.setRoom('office');
  for (const prog of ['myra', 'rules', 'bear', 'glass', 'faint', 'rerun', 'sitcom']) for (const t of [0.2, 3]) { g.closeup = { kind: 'tv2', prog, t0: g.time - t }; R.render(g); ok(R.frame.px.some(v => v > 2), 'tv programme ' + prog); }
  g.closeup = { kind: 'paper', t0: 0 }; R.render(g);
  g.closeup = { kind: 'titlecard2', t0: 0, lines: ['A', 'B', 'C'] }; g.time = 5; R.render(g);
  g.closeup = null;
  const f = new S.Buf(320, 200);
  E.TITLE.draw(f, 1, 0, [true, false, true, true, false]);
  ok(E.TITLE.hit(40, 100) === 0 && E.TITLE.hit(40, 156) === 4 && E.TITLE.hit(300, 10) === -1, 'title menu hit test');
  ok(E.CREDITS.length > 10 && E.SAVE_KEY === 'sammax102_saves' && E.TITLE_MUSIC === 'title2', 'episode descriptor');
  for (const th of ['title2', 'warp', 'sitcom', 'cooking', 'idol', 'quiz', 'myra', 'rats', 'electro', 'credits2']) ok(S.THEMES[th], 'music theme ' + th);
  const m = new S.MapScreen(g);
  g.mode = 'map'; g.drive = m;
  R.render(g);
  ok(m.hit(96, 118) === 'street' && m.hit(236, 64) === null && m.hit(184, 118) === null, 'map shows only known places');
  g.f.caseOpen = true; g.f.creamStolen = true;
  ok(m.hit(236, 64) === 'warp' && m.hit(184, 118) === 'rats', 'map opens the studio and the chase');
  g.mode = 'room'; g.drive = null;
  const d = new E.RatChase(g);
  g.mode = 'drive'; g.drive = d;
  for (let i = 0; i < 200; i++) g.update(1 / 30);
  R.render(g);
  ok(d.holes.length > 0, 'manholes appear');
  d.key('ArrowRight');
  ok(d.lane === 1, 'arrow keys change lanes');
  g.mode = 'room'; g.drive = null;
}

{
  const g = game(11);
  idle(g);
  g.dialog = null;
  const give = ['max', 'gun', 'launcher', 'cream', 'lampshade', 'plate', 'vtape', 'cake', 'kcake', 'lyrics', 'cards', 'coin', 'stamps', 'modulator', 'photo', 'paper', 'contract'];
  Object.assign(g.f, { caseOpen: true, hired: true, staff: true, idolSeen: true, metDirector: true, auditionOn: true });
  let actions = 0;
  const POS = { office: [150, 166], street: [300, 150], bosco: [100, 172], sybil: [100, 176], warp: [300, 170], sitcom: [80, 176], cooking: [150, 170], idol: [80, 180], quiz: [120, 170] };
  for (const id of Object.keys(POS)) {
    const reset = () => { g.mode = 'room'; g.drive = null; g.closeup = null; g.dialog = null; g.f.frozen = false; g.setRoom(id); g.place('sam', id, POS[id][0], POS[id][1], 's'); };
    reset();
    const targets = g.hotspots().map(h => h.id).concat(g.visibleActors().filter(a => g.actorHot(a) && a.id !== 'sam').map(a => a.id));
    for (const t of targets) {
      for (const v of ['look', 'use', 'talk', ...give]) {
        if (g.roomId !== id || g.mode !== 'room') reset();
        g.inv = give.slice();
        const verb = ['look', 'use', 'talk'].includes(v) ? v : 'use';
        const item = verb === v ? undefined : v;
        if (g.perform(verb, t, item)) actions++;
        let n = 0;
        while ((g.busy || g.dialog || g.fade > 0.001 || g.mode !== 'room') && n++ < 5000) {
          g.update(1 / 30);
          if (g.dialog && !g.busy) { const ids = g.optionIds(); if (ids.includes('bye')) g.choose('bye'); else if (ids.length && g.dialog.id !== 'cook' && g.dialog.id !== 'song') g.choose(ids[ids.length - 1]); else g.endDialog(); }
          if (g.mode !== 'room' && !g.busy) { g.mode = 'room'; g.drive = null; }
        }
        ok(n < 5000, `fuzz ${verb} ${t} ${item || ''} in ${id} settles`);
        if (g.ended) { g.ended = false; }
      }
    }
  }
  ok(actions > 900, 'fuzz ran many actions: ' + actions);
  ok(!g.log.some(l => l.startsWith('script error')), 'fuzz without script errors: ' + g.log.filter(l => l.startsWith('script error')).slice(0, 3).join(' | '));
}

{
  playthrough(5, { mistakes: true, reload: true });
  playthrough(9, {});
  playthrough(21, { reload: true });
}

{
  const SL = String.fromCharCode(47);
  const LINE = SL + SL, BLOCK = SL + '*';
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/sammax102/' + f).concat(['js/apps/sammax102-app.js', 'tests/sammax102.test.js']);
  for (const f of files) {
    const src = read(f);
    ok(!src.includes(LINE) && !src.includes(BLOCK), f + ' has no comments');
  }
  ok(!read('sammax102.html').includes('<!' + '--'), 'page has no comments');
  const html = read('index.html');
  const page = read('sammax102.html');
  let lastA = -1, lastB = -1;
  for (const f of BASE) {
    const needle = `js/apps/sammax/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'engine script order in index.html and sammax102.html: ' + f);
    lastA = ia; lastB = ib;
  }
  for (const f of ORDER) {
    const needle = `js/apps/sammax102/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'episode script order in index.html and sammax102.html: ' + f);
    lastA = ia; lastB = ib;
  }
  ok(fs.readdirSync(DIR).filter(f => f.endsWith('.js')).length === ORDER.length, 'every episode module is loaded by the pages');
  ok(html.indexOf('js/apps/sammax102-app.js') > lastA, 'desktop loads the wrapper');
  const gm = read('js/game-manager.js');
  const at = gm.indexOf('      sammax102: {');
  const entry = gm.slice(at, at + 2400);
  ok(at > 0 && /steam: true/.test(entry) && /price: 23\.99/.test(entry) && /targetExe: 'SAMMAX2\.EXE'/.test(entry) && /appSamMax102/.test(entry), 'Steam catalog entry');
  ok(!/sammax102Granted/.test(gm), 'no grant flag');
  const loadState = gm.slice(gm.indexOf('loadState'), gm.indexOf('moveGamesToSteam(state)'));
  ok(!/'sammax102'/.test(loadState), 'not preinstalled');
  const shell = {
    'js/desktop.js': ["isInstalled('sammax102')", 'appSamMax102'],
    'js/taskbar.js': ["isInstalled('sammax102')", "case 'sammax102'", "showInSteam('sammax102')"],
    'js/apps/dialogs.js': ["cmd === 'sammax102'", "showInSteam(\\'sammax102\\')"],
    'js/apps/explorer.js': ["item.app === 'sammax102'", 'SAMMAX2.EXE'],
    'js/filesystem.js': ["gmInstalled.includes('sammax102')", "'SAMMAX2.EXE'"],
    'js/apps/task-manager.js': ["'app_sammax102'", 'sammax2.exe'],
    'js/icons.js': ["'sammax102': `<svg"],
    'js/apps/clippy.js': ["id.startsWith('app_sammax102')", "launchProgram('sammax102', 'appSamMax102')"],
    'js/apps/steam.js': ["game: 'sammax102'"],
    'js/apps/advanced-site.js': ["id: 'sammax102'"],
    'js/apps/sammax102-app.js': ["id = 'app_sammax102'", 'ep: S.EP102']
  };
  for (const [f, needles] of Object.entries(shell)) {
    const src = read(f);
    for (const n of needles) ok(src.includes(n), `${f} contains ${n}`);
  }
  const clippy = read('js/apps/clippy.js');
  ok(clippy.indexOf("id.startsWith('app_sammax102')") < clippy.indexOf("id.startsWith('app_sammax')"), 'clippy checks episode 102 before episode 101');
  ok((read('js/i18n.js').match(/'app\.sammax102': 'Sam & Max: Situation: Comedy'/g) || []).length === 4, 'i18n title in every language');
  ok(read('package.json').includes('"test:sammax102": "node tests/sammax102.test.js"'), 'npm script');
}

console.log(`sammax102: ${checks} checks passed in ${Date.now() - t0} ms`);
