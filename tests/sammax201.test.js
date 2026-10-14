const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const BASE_DIR = path.join(ROOT, 'js/apps/sammax');
const DIR = path.join(ROOT, 'js/apps/sammax201');
const BASE = ['sm-core', 'sm-paint', 'sm-font', 'sm-sprites', 'sm-sprites2', 'sm-icons', 'sm-bg', 'sm-bg2', 'sm-bg3', 'sm-engine', 'sm-render', 'sm-closeups', 'sm-drive', 'sm-audio', 'sm-ui'];
const SHARED = ['sammax102/sc-sprites', 'sammax103/mm-sprites', 'sammax104/al-sprites', 'sammax105/rt-sprites', 'sammax106/bm-sprites', 'sammax106/bm-props'];
const ORDER = ['is-story', 'is-sprites', 'is-props', 'is-icons', 'is-bg', 'is-bg2', 'is-closeups', 'is-games', 'is-room-office', 'is-room-street', 'is-room-stinky', 'is-room-bosco', 'is-room-garage', 'is-room-pole', 'is-room-workshop', 'is-room-santa', 'is-room-past'];
let S;
for (const f of BASE) S = require(path.join(BASE_DIR, f + '.js'));
const baseThemes = new Set(Object.keys(S.THEMES));
const baseColors = new Map(Object.entries(S.COLORS));
for (const f of SHARED) S = require(path.join(ROOT, 'js/apps', f + '.js'));
const sharedIcons = new Map(Object.entries(S.ICONS));
const sharedCostumes = new Map(Object.entries(S.COSTUMES));
const sharedColors = new Map(Object.entries(S.COLORS));
for (const f of ORDER) S = require(path.join(DIR, f + '.js'));
const E = S.EP201;
const REAL_NAMES = new RegExp(['Micro' + 'soft', 'Win' + 'dows'].join('|'));
const ITEMS = ['max', 'gun', 'key', 'betty', 'maze', 'tags', 'can', 'record', 'pest', 'death', 'war', 'famine', 'sock', 'snow', 'globe', 'mary', 'glove'];
const ENTRY = { office: [284, 162], street: [290, 146], stinky: [40, 172], stinkyx: [40, 172], bosco: [36, 172], garage: [40, 172], pole: [392, 156], workshop: [40, 170], santa: [150, 160], past: [280, 170] };

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
  while ((g.busy || (g.fade > 0.001 && !g.ended)) && n < (max || 20000)) { g.update(1 / 30); n++; }
  step(g, 3);
  while (g.busy && n < (max || 20000)) { g.update(1 / 30); n++; }
  ok(n < (max || 20000), 'game became idle in ' + g.roomId + ' after: ' + g.log.slice(-2).join(' | '));
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
  for (let i = 0; i < 4 && g.dialog && g.optionIds().includes('bye'); i++) choose(g, 'bye');
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

function fly(g, to) {
  act(g, 'use', 'desoto');
  ok(g.dialog && g.dialog.id === 'trip', 'the car asks where to go');
  choose(g, to);
  idle(g, 60000);
  ok(g.roomId === to && !g.closeup && !g.hideUI && g.mode === 'room', 'flew to ' + to + ', now in ' + g.roomId);
}

const EDGES = {
  office: { street: g => go(g, 'edoor', 'street') },
  street: { office: g => go(g, 'officedoor', 'office'), bosco: g => go(g, 'boscodoor', 'bosco'), stinky: g => go(g, 'stinkydoor', 'stinky'), garage: g => go(g, 'garagedoor', 'garage'), pole: g => fly(g, 'pole') },
  bosco: { street: g => go(g, 'exit', 'street') },
  stinky: { street: g => go(g, 'door', 'street') },
  garage: { street: g => go(g, 'door', 'street') },
  pole: { street: g => fly(g, 'street'), workshop: g => go(g, 'workshop', 'workshop'), santa: g => go(g, 'topiaryb', 'santa'), past: g => go(g, 'ppast', 'past'), stinkyx: g => go(g, 'ppresent', 'stinkyx') },
  workshop: { pole: g => go(g, 'door', 'pole') },
  santa: { pole: g => go(g, 'chimney', 'pole') },
  past: { pole: g => go(g, 'portal', 'pole') },
  stinkyx: { pole: g => go(g, 'portal', 'pole') }
};

function route(from, to, g) {
  const okEdge = (a, b) => !g || (b !== 'santa' || g.f.topiary) && (!['past', 'stinkyx'].includes(b) || g.f.demonOut);
  const prev = { [from]: null };
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    if (cur === to) break;
    for (const next of Object.keys(EDGES[cur])) if (!(next in prev) && okEdge(cur, next)) { prev[next] = cur; q.push(next); }
  }
  const out = [];
  for (let r = to; prev[r]; r = prev[r]) out.unshift(r);
  return out;
}

function travel(g, room) {
  idle(g);
  for (const next of route(g.roomId, room, g)) EDGES[g.roomId][next](g);
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
  return h;
}

function press(g, d, id) {
  const b = d.buttons().find(q => q.id === id);
  ok(b, 'button exists ' + id);
  d.pointer(b.x + 4, b.y + 4);
  ok(d.hover && d.hover.kind === 'btn' && d.hover.id === id, 'button under the pointer: ' + id);
  d.click(b.x + 4, b.y + 4, 0);
}

function untilRoom(g, max) {
  let n = 0;
  while ((g.mode !== 'room' || g.busy || g.fade > 0.001) && n++ < (max || 40000)) g.update(1 / 30);
  ok(g.mode === 'room' && !g.drive, 'back in the room after the board: ' + g.roomId);
  idle(g, 60000);
}

function playQuiz(g, mistake) {
  ok(g.mode === 'quiz21' && g.drive && g.drive.kind === 'quiz', 'quiz board opened');
  let d = g.drive;
  idle(g);
  if (mistake) {
    const s = E.quizSolve(0);
    const r0 = d.slot(0, s.sam), r1 = d.slot(1, s.abe);
    d.pointer(r0.x + 3, r0.y + 3); d.click(r0.x + 3, r0.y + 3);
    d.pointer(r1.x + 3, r1.y + 3); d.click(r1.x + 3, r1.y + 3);
    press(g, d, 'go');
    untilRoom(g);
    ok(!g.f.pestGot && g.has('max'), 'a wrong quiz round keeps the prize with stinky');
    ok(g.log.some(l => l.includes('Лишь повторил') || l.includes('лишь повторил') || l.includes('никто не угадал')), 'stinky explained who won the round');
    talk(g, 'stinky', []);
    act(g, 'talk', 'stinky');
    choose(g, 'quiz');
    idle(g);
    ok(g.mode === 'quiz21', 'the quiz can be played again');
    d = g.drive;
  }
  for (let q = 0; q < 3; q++) {
    idle(g);
    ok(d.qn === q, 'quiz question ' + q);
    const s = E.quizSolve(q);
    const h = d.hint();
    ok(h.includes(String.fromCharCode([1040, 1041, 1042, 1043][s.sam])), 'max names the answer about stinky');
    const r0 = d.slot(0, s.abe), r1 = d.slot(1, s.sam);
    d.pointer(r0.x + 3, r0.y + 3); d.click(r0.x + 3, r0.y + 3);
    d.pointer(r1.x + 3, r1.y + 3); d.click(r1.x + 3, r1.y + 3);
    ok(d.abe === s.abe && d.sam === s.sam, 'letters are chosen on the board');
    press(g, d, 'go');
    let n = 0;
    while (g.busy && n++ < 20000) g.update(1 / 30);
  }
  untilRoom(g);
  ok(g.f.pestGot && g.has('pest'), 'the quiz gives the horseman of pestilence');
}

function playBox(g, loseFirst) {
  ok(g.mode === 'box21' && g.drive && g.drive.kind === 'box', 'the ring opened');
  const d = g.drive;
  let n = 0, lost = false;
  while (g.mode === 'box21' && n++ < 30000) {
    if (!d.over && d.pause <= 0) {
      if (loseFirst && !lost) { if ((g.seen.boxLost || 0) > 0) lost = true; }
      else if (d.st === 'wind' && d.me !== 'block') d.press('block');
      else if ((d.st === 'taunt' || d.st === 'stun') && d.me === 'guard') d.press('punch');
    }
    g.update(1 / 30);
  }
  ok(n < 30000, 'the boxing match ends');
  if (loseFirst) ok((g.seen.boxLost || 0) > 0, 'betty can lose a bout and the bout restarts');
  untilRoom(g);
  ok(g.f.warGot && g.has('war'), 'the ring gives the horseman of war');
}

function playRace(g, fail) {
  ok(g.mode === 'race21' && g.drive && g.drive.kind === 'race', 'the race opened');
  let d = g.drive;
  let n = 0;
  while (g.mode === 'race21' && n++ < 30000) {
    if (d.done) { ok(fail, 'a bot only runs out of time on purpose'); fail = false; press(g, d, 'again'); }
    else if (!fail) {
      let best = null, bd = Infinity;
      for (const t of d.dolls) if (t.alive) { const k = Math.hypot(t.x - d.car.x, t.y - d.car.y); if (k < bd) { bd = k; best = t; } }
      if (best) d.pointer(Math.round(best.x), Math.round(best.y));
    }
    g.update(1 / 30);
  }
  ok(n < 30000, 'the race ends');
  untilRoom(g);
  ok(g.f.deathGot && g.has('death'), 'the race gives the horseman of death');
}

function sing(g, mistake) {
  ok(g.dialog && g.dialog.id === 'song' && g.closeup && g.closeup.kind === 'song21', 'the song starts on the record player');
  if (mistake) {
    choose(g, 'o0');
    ok(!g.dialog && !g.closeup && !g.f.demonOut, 'a wrong line scratches the record');
    act(g, 'use', 'recplayer');
    ok(g.dialog && g.dialog.id === 'song', 'the song can be sung again');
  }
  for (const v of E.SONG) choose(g, 'o' + v.ok);
  idle(g, 60000);
  ok(g.f.demonOut && g.f.spirits && g.has('globe'), 'the song calls the demon and the spirits bring a globe');
}

function finale(g, misses) {
  ok(E.finale(g) && g.vt.finale && !g.canSave(), 'the finale runs and cannot be saved');
  const ft = () => g.vt.finale;
  const waitStation = st => {
    let n = 0;
    while (!(E.planeStation(ft()) === st && ft().phase - Math.floor(ft().phase / 2) * 2 < 0.7) && n++ < 5000) g.update(1 / 30);
    ok(n < 5000, 'the plane reaches station ' + st);
  };
  if (misses) {
    act(g, 'use', 'cannon', 'gun');
    ok(ft().ball === 'cannon', 'a cannon shot without the plane over the trampoline rolls back');
    waitStation(5);
    act(g, 'use', 'switch', 'gun');
    ok(!ft().moving, 'the switch stops the plane');
    act(g, 'use', 'switch', 'gun');
    ok(ft().moving, 'the switch starts the plane again');
  }
  waitStation(E.FINALE.TRAMP);
  act(g, 'use', 'switch', 'gun');
  ok(!ft().moving && E.planeStation(ft()) === E.FINALE.TRAMP, 'the plane stops over the trampoline');
  hint(g, /пушк/i, 'in the finale names the cannon');
  act(g, 'use', 'cannon', 'gun');
  ok(ft().ball === 'plane', 'the ball lands in the plane');
  act(g, 'use', 'switch', 'gun');
  ok(ft().moving, 'the plane flies again with the ball');
  hint(g, /Камбалобо/i, 'in the finale names the flounder pounder');
  waitStation(E.FINALE.POUND);
  act(g, 'use', 'switch', 'gun');
  ok(g.f.santaDown && !E.finale(g), 'the flounder pounder sends santa into the crate');
}

function playthrough(seed, o) {
  o = o || {};
  const cp = g => (o.reload ? reload(g) : g);
  let g = game(seed);
  for (let i = 0; i < 90; i++) g.update(1 / 30);
  ok(g.closeup && g.closeup.kind === 'titlecard21', 'title card first');
  idle(g, 30000);
  ok(g.roomId === 'office' && g.f.introDone && g.f.flintHole && !g.dialog, 'the intro ends in the office');
  hint(g, /робот/i, 'at the start');
  act(g, 'look', 'cooler');
  talk(g, 'flinthole', ['how', 'robot', 'case', 'hole']);
  ok(g.f.flintMet, 'flint was met');
  act(g, 'use', 'window');
  ok(!g.f.keyGot && g.has('max'), 'the robot watches the window');
  act(g, 'use', 'machine'); act(g, 'use', 'machine'); act(g, 'use', 'machine');
  ok(g.f.machineDone, 'the answering machine played three messages');
  act(g, 'use', 'tv');
  ok(!g.closeup, 'the tv closes after a programme');
  if (o.mistakes) { act(g, 'use', 'closet'); ok(g.f.closetOpen && has(g, 'mrbear') && has(g, 'jar') && has(g, 'leocloset') && has(g, 'preshead') && has(g, 'capgun') && has(g, 'mglove'), 'the closet shows six cases'); act(g, 'talk', 'leocloset'); }
  go(g, 'edoor', 'street');
  g = cp(g);
  hint(g, /глупцы/i, 'names the question for the robot');
  act(g, 'talk', 'robot');
  for (const opt of ['who', 'from', 'why', 'songs']) choose(g, opt);
  choose(g, 'ask');
  ok(g.dialog && g.dialog.id === 'robotq', 'the robot listens to questions');
  choose(g, 'math'); choose(g, 'love');
  if (o.mistakes) { choose(g, 'back'); ok(g.dialog.id === 'robot', 'back to the first menu'); choose(g, 'ask'); }
  choose(g, 'fools');
  ok(g.vt.robotThinks && !g.dialog, 'the robot is thinking');
  hint(g, /окно/i, 'sends sam to the window');
  act(g, 'use', 'robot');
  ok(!g.f.keyGot, 'the key is out of reach from the street');
  go(g, 'officedoor', 'office');
  act(g, 'use', 'window');
  ok(g.f.keyGot && g.f.robotDown && g.has('key'), 'the key stops the robot');
  go(g, 'edoor', 'street');
  ok(has(g, 'ring') && has(g, 'label') && g.actors.jimmy.room === 'street', 'the wreck holds the ring of jimmy');
  if (o.mistakes) { act(g, 'use', 'desoto'); ok(!g.f.poleSeen && g.roomId === 'street', 'no trip before the label'); }
  act(g, 'look', 'label');
  ok(g.f.labelRead, 'the label names santa');
  talk(g, 'jimmy', ['what', 'prize', 'fight']);
  fly(g, 'pole');
  ok(g.f.poleSeen, 'the north pole is reached');
  g = cp(g);
  talk(g, 'specs', ['why', 'santa', 'sleigh', 'snow']);
  if (o.mistakes) { act(g, 'use', 'stand'); ok(!g.has('snow'), 'no yellow snow without a reason'); }
  go(g, 'workshop', 'workshop');
  hint(g, /ёлк/i, 'names the toys');
  act(g, 'use', 'betty'); act(g, 'use', 'maze'); act(g, 'use', 'tags');
  ok(g.has('betty') && g.has('maze') && g.has('tags'), 'toys and tags taken');
  talk(g, 'elfr', ['who', 'santa', 'pc', 'crate', 'robot']);
  act(g, 'use', 'stairs');
  ok(g.f.santaShot && g.roomId === 'workshop', 'santa shoots through his door');
  act(g, 'look', 'crate'); act(g, 'look', 'redpc');
  act(g, 'talk', 'elfg');
  choose(g, 'who'); choose(g, 'job'); choose(g, 'try');
  if (o.mistakes) { choose(g, 'max'); choose(g, 'tax'); }
  choose(g, 'santa');
  close(g);
  ok(g.f.elfCried && g.has('can'), 'the intern cried into the can');
  act(g, 'use', 'greenpc');
  choose(g, 'log'); choose(g, 'wish');
  if (o.mistakes) { choose(g, 'send'); choose(g, 'to_bosco'); choose(g, 'g_bath'); ok(!g.f.giftBosco && !g.f.giftStinky, 'a wrong gift is refused'); }
  close(g);
  ok(g.f.logRead && g.f.wishRead, 'the log and the wish list were read');
  go(g, 'door', 'pole');
  act(g, 'use', 'topiary', 'can');
  ok(g.f.topiary && !g.has('can'), 'the topiary grew');
  go(g, 'topiaryb', 'santa');
  g = cp(g);
  act(g, 'look', 'podium'); act(g, 'use', 'record'); act(g, 'talk', 'santa');
  ok(g.f.ritualRead && g.has('record'), 'the ritual is known and the record taken');
  go(g, 'chimney', 'pole');
  act(g, 'use', 'betty', 'key');
  ok(g.f.bettyWound, 'the key winds betty');
  fly(g, 'street');
  hint(g, /ринг|Стинки|К\.О\.П\.С|Боско/i, 'names a horseman');
  if (o.mistakes) { g.f.bettyWound = false; act(g, 'use', 'ring', 'betty'); ok(g.mode === 'room' && !g.f.warGot, 'an unwound doll does not fight'); act(g, 'use', 'betty', 'key'); }
  act(g, 'use', 'ring', 'betty');
  playBox(g, !!o.mistakes);
  ok(E.ledgeHere(g) && g.actors.jimmy.room !== 'street', 'jimmy left the ring for the ledge');
  go(g, 'stinkydoor', 'stinky');
  talk(g, 'stinky', ['who', 'gramps', 'famous', 'feet', 'prize']);
  talk(g, 'sybil', ['date', 'job', 'quiz']);
  talk(g, 'lincoln', ['hi', 'quiz', 'gift']);
  talk(g, 'bug', ['hi', 'family', 'quiz']);
  ok(g.f.knowFeet, 'stinky complained about her feet');
  act(g, 'talk', 'stinky');
  choose(g, 'quiz');
  idle(g);
  playQuiz(g, !!o.mistakes);
  go(g, 'door', 'street');
  g = cp(g);
  go(g, 'garagedoor', 'garage');
  talk(g, 'curt', ['moon', 'tuning', 'trophy', 'game']);
  act(g, 'talk', 'bob');
  choose(g, 'play');
  idle(g);
  playRace(g, !!o.mistakes);
  go(g, 'door', 'street');
  go(g, 'boscodoor', 'bosco');
  talk(g, 'bosco', ['parcel', 'open', 'wish', 'gate', 'flint']);
  act(g, 'look', 'xray');
  ok(g.f.xray, 'the x-ray shows the horseman');
  talk(g, 'bosco', ['xray']);
  hint(g, /секундомер/i, 'names the stopwatch');
  go(g, 'exit', 'street');
  fly(g, 'pole');
  go(g, 'workshop', 'workshop');
  act(g, 'use', 'greenpc');
  choose(g, 'send'); choose(g, 'to_bosco'); choose(g, 'g_watch');
  choose(g, 'send'); choose(g, 'to_stinky'); choose(g, 'g_bath');
  if (o.extraGifts) { choose(g, 'send'); choose(g, 'to_lincoln'); choose(g, 'g_moai'); choose(g, 'send'); choose(g, 'to_sybil'); choose(g, 'g_quiet'); }
  close(g);
  ok(g.f.giftBosco && g.f.giftStinky, 'the stopwatch and the footbath were sent');
  if (o.earlyPole) {
    act(g, 'use', 'pole', 'pest'); act(g, 'use', 'pole', 'war');
    act(g, 'use', 'recplayer', 'record');
    ok(g.f.recordSet && !g.f.demonOut && !g.dialog, 'without four horsemen the record is only a song');
  }
  go(g, 'door', 'pole');
  fly(g, 'street');
  go(g, 'boscodoor', 'bosco');
  ok(g.f.famineGot && g.has('famine'), 'bosco gives away the decoy with famine');
  go(g, 'exit', 'street');
  go(g, 'stinkydoor', 'stinky');
  act(g, 'use', 'sock');
  ok(g.f.sockGot && g.has('sock'), 'the sock of stinky taken');
  go(g, 'door', 'street');
  fly(g, 'pole');
  go(g, 'topiaryb', 'santa');
  act(g, 'use', 'stuffer', 'sock');
  ok(g.f.coalGot, 'the stocking machine fills the sock with coal');
  if (o.mistakes) { act(g, 'use', 'stuffer', 'sock'); }
  go(g, 'chimney', 'pole');
  if (o.mistakes) { act(g, 'use', 'boiler', 'sock'); ok(!g.f.futureDone && g.has('sock'), 'the coal waits for the portals'); }
  go(g, 'workshop', 'workshop');
  g = cp(g);
  for (const id of E.HORSES) if (g.has(id)) act(g, 'use', 'pole', id);
  ok(E.placed(g) === 4, 'four horsemen around the pole');
  hint(g, /пластинк/i, 'names the record');
  if (g.f.recordSet) act(g, 'use', 'recplayer'); else act(g, 'use', 'recplayer', 'record');
  sing(g, !!o.mistakes);
  ok(g.actors.santa.room !== 'workshop' && g.actors.elfr.act === 'faint', 'santa ran after the demon and the red elf fainted');
  go(g, 'door', 'pole');
  ok(has(g, 'pfuture') && has(g, 'ppast') && has(g, 'ppresent') && g.actors.demon.room === 'pole', 'three portals and the demon outside');
  const order = o.order || 'fpa';
  for (const k of order) {
    if (k === 'f') {
      act(g, 'use', 'boiler', 'sock');
      ok(g.f.futureDone && !g.has('sock') && g.roomId === 'pole', 'the sleigh rescued the future pair');
    } else if (k === 'p') {
      go(g, 'ppresent', 'stinkyx');
      ok(g.f.presentSeen, 'the present was seen');
      talk(g, 'stinky', ['what', 'bday']);
      ok(g.log.some(l => l.includes('день рождения')), 'pedro came for the birthday');
      talk(g, 'bug', ['hi', 'army']);
      go(g, 'portal', 'pole');
      act(g, 'use', 'stand');
      ok(g.has('snow'), 'a yellow snowball taken');
      go(g, 'ppresent', 'stinkyx');
      act(g, 'use', 'bug', 'snow');
      ok(g.f.presentDone && g.f.roachesGone, 'the bug marched his family out');
      go(g, 'portal', 'pole');
      g = cp(g);
    } else {
      go(g, 'ppast', 'past');
      ok(g.f.pastSeen, 'the past was seen');
      talk(g, 'yjimmy', ['who', 'fight', 'thimble', 'mary']);
      if (o.mistakes) { act(g, 'use', 'tv'); ok(!g.f.maryGot && g.actors.mary.room !== 'past', 'mary watched her show and went home'); }
      act(g, 'use', 'hole', 'maze');
      ok(g.f.mazeSet, 'the maze stands at the hole');
      if (o.reload) g = cp(g);
      act(g, 'use', 'tv');
      ok(g.vt.maryIn, 'mary walked into the maze');
      act(g, 'use', 'maze');
      ok(g.f.maryGot && g.has('mary'), 'mary is in the box');
      go(g, 'portal', 'pole');
      travel(g, 'office');
      ok(E.ledgeHere(g), 'jimmy stands on the ledge');
      talk(g, 'window', ['why', 'ring', 'glove', 'down']);
      act(g, 'use', 'window', 'mary');
      ok(g.f.jimmyHappy && g.has('glove') && !g.has('mary'), 'jimmy got mary back and gave the glove');
      travel(g, 'past');
      act(g, 'use', 'yjimmy', 'glove');
      ok(g.f.pastDone && !g.has('glove'), 'young jimmy wins with the glove');
      go(g, 'portal', 'pole');
    }
  }
  ok(E.spiritsIn(g) === 3, 'three spirits in the globe');
  hint(g, /демон/i, 'names the demon');
  act(g, 'use', 'demon', 'globe');
  ok(g.f.santaEvil && !g.has('globe') && g.actors.demon.room !== 'pole', 'santa ate the demon');
  go(g, 'workshop', 'workshop');
  finale(g, !!o.mistakes);
  act(g, 'look', 'crate');
  idle(g, 80000);
  ok(g.ended, 'the episode ends');
  ok(g.f.shipped && g.f.exhibit && g.f.closetOpen && has(g, 'keyex') && has(g, 'jar') && has(g, 'mrbear'), 'the closet gets the wind-up key');
  ok(g.log.some(l => l.includes('САТАНЕ')), 'the misdelivery is explained');
  return g;
}

{
  playthrough(5, { mistakes: true, reload: true, order: 'fpa' });
  playthrough(9, { order: 'apf', earlyPole: true });
  playthrough(22, { reload: true, order: 'paf', extraGifts: true });
}

{
  const g = game(7);
  idle(g, 30000);
  g.dialog = null;
  g.killTasks();
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
      ok(spr && spr.w > 0, 'layer renders ' + id + '.' + L.id);
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
    ok(room.dress201 && typeof room.onLoad === 'function', 'room is dressed on every visit: ' + id);
  }
  ok(Object.keys(ENTRY).length === Object.keys(E.ROOMS).length, 'every room has an entry point');
  for (const from of Object.keys(EDGES)) for (const to of Object.keys(EDGES)) ok(from === to || route(from, to).length > 0, 'rooms are connected: ' + from + ' to ' + to);
  const STATES = [
    { introDone: true },
    { introDone: true, robotDown: true, keyGot: true, labelRead: true, poleSeen: true, closetOpen: true },
    { introDone: true, robotDown: true, labelRead: true, poleSeen: true, bettyGot: true, mazeGot: true, tagsGot: true, elfCried: true, topiary: true, warGot: true, giftStinky: true, giftBosco: true },
    { introDone: true, robotDown: true, labelRead: true, poleSeen: true, topiary: true, warGot: true, pestGot: true, deathGot: true, famineGot: true, pestSet: true, deathSet: true, warSet: true, famineSet: true, recordSet: true, demonOut: true, spirits: true, giftStinky: true, sockGot: true, mazeSet: true },
    { introDone: true, robotDown: true, labelRead: true, poleSeen: true, topiary: true, warGot: true, demonOut: true, spirits: true, futureDone: true, presentDone: true, pastDone: true, jimmyHappy: true, roachesGone: true, santaEvil: true },
    { introDone: true, robotDown: true, labelRead: true, poleSeen: true, topiary: true, warGot: true, demonOut: true, spirits: true, futureDone: true, presentDone: true, pastDone: true, jimmyHappy: true, santaEvil: true, santaDown: true, closetOpen: true, exhibit: true }
  ];
  let spots = 0;
  for (const st of STATES) {
    for (const [id, entry] of Object.entries(ENTRY)) {
      let [ex, ey] = entry;
      g.f = Object.assign({}, st);
      g.vt = {};
      g.actors.max.follow = 'sam';
      g.setRoom(id);
      if (id === 'workshop' && E.finale(g)) { ex = 170; ey = 172; }
      ok(g.walkable(ex, ey), 'entry point walkable ' + id);
      const list = g.hotspots().map(h => [h.id, h.walk]).concat(Object.entries(E.ROOMS[id].actors || {}).filter(([aid]) => g.actors[aid].room === id).map(([aid, h]) => [aid, h.walk]));
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
  ok(spots > 300, 'walk points checked: ' + spots);
  g.f = { introDone: true };
  g.vt = {};
  g.setRoom('office');
  ok(ITEMS.length === Object.keys(E.ITEMS).length && ITEMS.every(id => E.ITEMS[id]), 'item list is complete');
  ok(ITEMS.length <= 20, 'the inventory fits the box of sam');
  for (const st of [{}, { bettyWound: true, coalGot: true, futureDone: true }, { futureDone: true, presentDone: true, pastDone: true }]) {
    g.f = Object.assign({ introDone: true }, st);
    for (const [id, it] of Object.entries(E.ITEMS)) {
      ok(g.itemName(id) && it.look !== undefined, 'item described ' + id);
      const icon = g.itemIcon(id);
      ok(S.ICONS[icon], 'item icon ' + id + ': ' + icon);
      const ic = S.icon(icon);
      ok(ic.w <= 28 && ic.h <= 22 && ic.px.some(v => v), 'item icon renders ' + id);
      ok(E.GENERIC.items[id] && E.GENERIC.items[id].length >= 2, 'item has its own refusals: ' + id);
    }
  }
  g.f = { introDone: true };
  for (const [id, fn] of Object.entries(S.ICONS)) { const b = fn(); ok(b && b.px.some(v => v), 'icon draws ' + id); }
  for (const [id, fn] of sharedIcons) ok(S.ICONS[id] === fn, 'episode 201 keeps the shared icon ' + id);
  for (const [id, cos] of sharedCostumes) ok(S.COSTUMES[id] === cos, 'episode 201 keeps the shared costume ' + id);
  for (const [id, c] of baseColors) ok(S.COLORS[id] === c, 'episode 201 keeps the speech colour of ' + id);
  for (const [id, c] of sharedColors) ok(S.COLORS[id] === c, 'episode 201 keeps the shared colour of ' + id);
  for (const id of Object.keys(S.ICONS)) ok(sharedIcons.has(id) || /21$/.test(id), 'own icons are marked with 21: ' + id);
  for (const id of Object.keys(S.COSTUMES)) ok(sharedCostumes.has(id) || /21$/.test(id), 'own costumes are marked with 21: ' + id);
  for (const id of Object.keys(S.CLOSEUPS)) ok(typeof S.CLOSEUPS[id] === 'function', 'closeup ' + id);
  for (const id of Object.keys(S.THEMES)) ok(baseThemes.has(id) || /21$/.test(id) || /\d$/.test(id), 'theme id is marked: ' + id);
  const variants = (id, conv) => {
    if (typeof conv.options !== 'function') return [conv.options];
    const out = [];
    for (const f of [{}, { elfCried: true }, { demonOut: true }]) {
      g.f = Object.assign({ introDone: true }, f);
      for (const room of ['street', 'pole', 'workshop']) {
        g.roomId = room;
        for (const st of [null, { stage: 0 }, { stage: 3 }]) {
          g.vt.song = st;
          for (const gs of [null, { stage: 'menu' }, { stage: 'to', to: null }, { stage: 'what', to: 'bosco' }]) {
            g.vt.gift = gs;
            g.vt.scare = !!st;
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
      ok(list.length > 0 && list.some(o => o.end || o.id === 'back'), 'conversation can end ' + id);
      ok(list[list.length - 1].end || list[list.length - 1].id === 'back', 'the last option leaves the conversation ' + id);
      for (const o of list) ok(o.text && S.ICONS[o.icon], 'option has text and icon ' + id + '.' + o.id + ': ' + o.icon);
      ok(list.length <= 10, 'options fit the dialog bar ' + id);
      const icons = list.filter(o => o.icon !== 'bye').map(o => o.icon);
      ok(id === 'robotq' || id === 'trip' || new Set(icons).size === icons.length, 'every option has its own icon in ' + id + ': ' + icons.join(','));
    }
  }
  g.vt = {};
  g.f = { introDone: true };
  g.setRoom('office');
  const POSES = [{ dir: 'e' }, { dir: 'w', walk: 0.25 }, { dir: 's', talk: 1 }, { dir: 'n', walk: 0.6 }, { v: 'red' }, { v: 'green', act: 'cry' }, { v: 'red', act: 'faint' }, { v: 'evil', act: 'shoot', t: 0.3 }, { act: 'eat' }, { act: 'up' }, { act: 'point' }, { act: 'shake', t: 0.4 }, { act: 'scared' }, { act: 'work', t: 1 }, { v: 'past' }, { v: 'present', act: 'point' }, { v: 'future', act: 'nod', t: 1 }, { act: 'phone' }, { act: 'host' }, { act: 'cheer' }, { act: 'shrug' }, { act: 'nag' }, { act: 'hug' }, { v: 'glove', act: 'punch' }, { act: 'swear' }, { act: 'sing', t: 0.5 }, { act: 'reach' }];
  for (const id of ['santa21', 'elf21', 'demon21', 'ghost21', 'stinky21', 'mary21', 'yjimmy21', 'timmy21', 'pedro21', 'fsam21', 'fmax21']) {
    ok(S.COSTUMES[id] && !sharedCostumes.has(id), 'episode costume ' + id);
    for (const pose of POSES) {
      const s = S.sprite(id, pose, 1);
      ok(s && s.buf.px.some(v => v), 'sprite renders ' + id + ' ' + JSON.stringify(pose));
    }
  }
  for (const id of Object.keys(g.actors)) ok(S.COSTUMES[g.actors[id].costume], 'actor has a costume: ' + id);
  const evil = S.sprite('santa21', { dir: 's', v: 'evil' }, 1), good = S.sprite('santa21', { dir: 's' }, 1);
  ok(evil.buf.px.some((v, i) => v !== good.buf.px[i]), 'possessed santa looks different');
  for (const who of ['santa', 'evil', 'elfr', 'elfg', 'demon', 'gpast', 'gpres', 'gfut', 'stinky', 'mary', 'yjimmy', 'timmy', 'pedro', 'bug', 'lincoln', 'cops', 'fsam', 'fmax']) ok(S.art201.portrait(who).px.some(v => v), 'portrait ' + who);
  for (let q = 0; q < E.QUESTIONS.length; q++) {
    const Q = E.QUESTIONS[q];
    ok(Q.a.length === 4 && Q.right !== 3 && Q.vain !== 3 && Q.right !== Q.vain, 'question ' + q + ' keeps the bug, the truth and the boast apart');
    ok(/я|мне|меня/i.test(Q.a[Q.vain]), 'the boast of question ' + q + ' is about stinky');
    const s = E.quizSolve(q);
    ok(E.quizJudge(q, s.abe, s.sam).winner === 'sam', 'the solution wins question ' + q);
    let wins = 0;
    for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) if (E.quizJudge(q, a, b).winner === 'sam') wins++;
    ok(wins === 1, 'only one way wins question ' + q + ': ' + wins);
    ok(E.quizJudge(q, s.sam, s.abe).winner === 'lincoln', 'lincoln wins when he takes the boast in question ' + q);
    ok(E.quizJudge(q, Q.right, s.sam).winner === null && E.quizJudge(q, Q.right, s.sam).letter === s.abe, 'a free letter is declared correct in question ' + q);
  }
  ok(E.SONG.length === 4 && E.SONG.every(v => v.opts.length === 4 && v.ok >= 0 && v.ok < 4), 'four verses with four endings');
  ok(new Set(E.SONG.map(v => v.ok)).size === 4, 'the right ending sits in a different place in every verse');
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
      ok(!/^(Беру|Кладу|Ставлю|Наливаю|Поливаю|Открываю|Жму|Включаю|Стреляю|Вставляю|Бросаю|Отдаю)[ ,.!]/.test(s), 'sam does not announce his action: ' + s);
    }
  }
  ok(strings > 900, 'found the game texts: ' + strings);
  ok(missing.size === 0, 'font covers every text character: ' + [...missing].slice(0, 10).join(', '));
}

{
  const R = new S.Renderer();
  const g = game(3);
  for (let i = 0; i < 90; i++) g.update(1 / 30);
  ok(g.closeup && g.closeup.kind === 'titlecard21' && g.fade < 0.5, 'title card is visible');
  R.render(g);
  ok(R.frame.px.every(v => v), 'title card renders');
  g.skip();
  idle(g, 30000);
  ok(g.roomId === 'office' && g.f.introDone, 'intro can be skipped');
  const out = new Uint8ClampedArray(320 * 200 * 4);
  R.toRGBA(g, out);
  ok(out.some((v, i) => i % 4 !== 3 && v > 0), 'frame converts to RGBA');
  g.dialog = null;
  g.killTasks();
  const STATES = [
    { introDone: true },
    { introDone: true, robotDown: true, labelRead: true, warGot: true, closetOpen: true, giftStinky: true },
    { introDone: true, robotDown: true, demonOut: true, spirits: true, topiary: true, pestSet: true, deathSet: true, warSet: true, famineSet: true, recordSet: true, mazeSet: true },
    { introDone: true, robotDown: true, demonOut: true, topiary: true, futureDone: true, presentDone: true, pastDone: true, jimmyHappy: true, roachesGone: true, jelly: true },
    { introDone: true, robotDown: true, demonOut: true, santaEvil: true },
    { introDone: true, robotDown: true, demonOut: true, santaEvil: true, santaDown: true, exhibit: true, closetOpen: true }
  ];
  let frames = 0;
  for (const st of STATES) {
    for (const id of Object.keys(E.ROOMS)) {
      g.f = Object.assign({}, st);
      g.vt = {};
      g.actors.max.follow = 'sam';
      g.setRoom(id);
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
    g.setRoom('past');
    ok(g.fx.tint && g.fx.tint[3] > 0, 'the past is tinted');
    g.setRoom('pole');
    ok(g.fx.tint === null, 'the pole keeps its own colours');
  }
  ok(frames > 300, 'rendered frames: ' + frames);
  g.f = { introDone: true };
  g.vt = { song: { stage: 2 } };
  g.setRoom('office');
  for (const prog of ['news', 'poppers', 'stinky', 'news2', 'rerun']) for (const t of [0.2, 3]) { g.closeup = { kind: 'tv21', prog, t0: g.time - t }; R.render(g); ok(R.frame.px.some(v => v > 2), 'tv programme ' + prog); }
  const shots = [{ kind: 'titlecard21', lines: ['A', 'B', 'C'] }, { kind: 'fly21', north: true }, { kind: 'fly21', north: false }, { kind: 'song21' }, { kind: 'future21', stage: 0 }, { kind: 'future21', stage: 1 }, { kind: 'deliver21' }];
  for (const cu of shots) for (const t of [0.3, 1.5, 3.4]) {
    g.closeup = Object.assign({ t0: g.time - t }, cu);
    R.render(g);
    ok(R.frame.px.every(v => v), 'closeup ' + cu.kind + ' paints the whole frame at ' + t);
  }
  g.closeup = null;
  const f = new S.Buf(320, 200);
  E.TITLE.draw(f, 1, 0, [true, false, true, true, false]);
  ok(f.px.every(v => v), 'title screen fully painted');
  ok(E.TITLE.hit(40, 88) === 0 && E.TITLE.hit(40, 144) === 4 && E.TITLE.hit(300, 10) === -1, 'title menu hit test');
  ok(E.CREDITS.length > 10 && E.SAVE_KEY === 'sammax201_saves' && E.SET_KEY === 'sammax201_settings' && E.TITLE_MUSIC === 'title21' && E.CREDITS_MUSIC === 'credits21', 'episode descriptor');
  for (const [line, size] of E.CREDITS) ok(S.font.measure(line) * (size >= 2 ? size : 1) < 316, 'credit line fits the screen: ' + line);
  const THEMES = ['title21', 'robot21', 'pole21', 'workshop21', 'santa21', 'diner21', 'garage21', 'ring21', 'quiz21', 'demon21', 'past21', 'future21', 'spirit21', 'finale21', 'credits21'];
  for (const th of THEMES) {
    const T = S.THEMES[th];
    ok(T && !baseThemes.has(th), 'music theme ' + th + ' belongs to the episode');
    ok(['swing', 'lounge', 'waltz', 'surf', 'creepy', 'fanfare', 'hypno', 'country', 'quiz', 'tango', 'tarantella', 'industrial', 'march'].includes(T.style), 'music style is known to the player: ' + th);
    const per = T.style === 'waltz' || T.style === 'tarantella' ? 6 : 8;
    ok(T.mel.split(/\s+/).filter(Boolean).length === T.prog.length * per, 'melody fills the whole progression: ' + th);
  }
  for (const st of [{}, { robotDown: true }, { demonOut: true }, { santaEvil: true }, { santaEvil: true, santaDown: true }]) {
    g.f = Object.assign({}, st);
    for (const r of Object.values(E.ROOMS)) ok(S.THEMES[typeof r.music === 'function' ? r.music(g) : r.music], 'room music exists ' + r.id);
  }
  const sfx = new Set();
  const audio = read('js/apps/sammax/sm-audio.js');
  for (const f2 of fs.readdirSync(DIR)) for (const m of fs.readFileSync(path.join(DIR, f2), 'utf8').matchAll(/sfx\('([a-z0-9]+)'\)/g)) sfx.add(m[1]);
  ok(sfx.size > 30, 'the episode is not silent: ' + sfx.size);
  for (const id of sfx) ok(audio.includes("case '" + id + "':"), 'sound exists in the shared player: ' + id);
  const music = new Set();
  for (const f2 of fs.readdirSync(DIR)) for (const m of fs.readFileSync(path.join(DIR, f2), 'utf8').matchAll(/music\('([a-z0-9]+)'\)/g)) music.add(m[1]);
  for (const id of music) ok(S.THEMES[id], 'music theme exists: ' + id);
  g.f = { introDone: true, robotDown: true };
  g.vt = {};
  g.setRoom('stinky');
  g.fade = 0; g.fadeTo = 0;
  const q = new E.Quiz(g);
  g.mode = 'quiz21'; g.drive = q;
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { const s = q.slot(r, i); const h = q.hit(s.x + 2, s.y + 2); ok(h && h.kind === (r ? 'sam' : 'abe') && h.id === i, 'quiz slot can be clicked ' + r + i); }
  ok(q.buttons().every(b => q.hit(b.x + 2, b.y + 2).id === b.id), 'quiz buttons can be clicked');
  q.pointer(160, 150);
  R.render(g);
  ok(R.frame.px.every(v => v), 'quiz screen fully painted');
  q.press('go');
  idle(g);
  ok(g.log.some(l => l.includes('Сначала шепните')), 'stinky asks for both letters first');
  ok(q.key('Escape'), 'escape leaves the quiz');
  idle(g);
  ok(g.mode === 'room' && !g.drive, 'back in the diner after escape');
  const b = new E.Box(g);
  g.mode = 'box21'; g.drive = b;
  R.render(g);
  ok(R.frame.px.every(v => v), 'ring screen fully painted');
  ok(b.buttons().every(x => b.hit(x.x + 2, x.y + 2).id === x.id), 'ring buttons can be clicked');
  for (const st of ['guard', 'wind', 'taunt', 'stun']) { b.st = st; ok(b.hint().length > 10, 'max explains the ring state ' + st); }
  b.pause = 0; b.st = 'taunt'; b.press('punch');
  ok(b.foeHp === 2, 'a punch into an open opponent lands');
  b.me = 'guard'; b.st = 'guard'; b.press('punch');
  ok(b.foeHp === 2, 'a punch into a guard does nothing');
  b.st = 'wind'; b.stT = 0.01; b.me = 'guard'; b.update(0.05);
  ok(b.hp === 2, 'an unblocked swing hits betty');
  b.st = 'wind'; b.stT = 0.01; b.pause = 0; b.me = 'block'; b.meT = 0.4; b.update(0.05);
  ok(b.st === 'stun', 'a blocked swing stuns the opponent');
  ok(b.key('Escape'), 'escape leaves the ring');
  idle(g);
  const rc = new E.Race(g);
  g.mode = 'race21'; g.drive = rc;
  rc.pointer(300, 30);
  for (let i = 0; i < 30; i++) g.update(1 / 30);
  R.render(g);
  ok(R.frame.px.every(v => v), 'race screen fully painted');
  ok(rc.car.x > 160 && rc.car.y < 150, 'the car turns towards the pointer');
  ok(rc.key('ArrowLeft') && rc.steer < 0, 'arrow keys steer');
  rc.left = 0.01;
  g.update(1 / 30);
  idle(g);
  ok(rc.done && rc.buttons().some(x => x.id === 'again'), 'the race can be repeated after the time is up');
  rc.press('again');
  ok(!rc.done && rc.left === E.RACE.TIME && rc.score === 0, 'a new heat starts clean');
  ok(rc.key('Escape'), 'escape leaves the race');
  idle(g);
  ok(g.mode === 'room', 'back in the room after the race');
}

{
  const POS = { office: [150, 166], street: [340, 150], stinky: [120, 176], stinkyx: [120, 176], bosco: [130, 172], garage: [160, 176], pole: [300, 170], workshop: [240, 176], santa: [150, 176], past: [150, 176] };
  const ONE = { introDone: true, closetOpen: true };
  const TWO = Object.assign({}, ONE, { robotDown: true, keyGot: true, labelRead: true, poleSeen: true, bettyGot: true, mazeGot: true, tagsGot: true });
  const THREE = Object.assign({}, TWO, { elfCried: true, topiary: true, ritualRead: true, recordGot: true, logRead: true, wishRead: true, bettyWound: true, warGot: true, pestGot: true, xray: true, giftStinky: true, giftBosco: true, knowFeet: true });
  const FOUR = Object.assign({}, THREE, { deathGot: true, famineGot: true, sockGot: true, coalGot: true, pestSet: true, deathSet: true, warSet: true, famineSet: true, recordSet: true, demonOut: true, spirits: true, presentSeen: true, pastSeen: true, mazeSet: true });
  const FIVE = Object.assign({}, FOUR, { futureDone: true, presentDone: true, pastDone: true, maryGot: true, jimmyHappy: true, roachesGone: true });
  const STATES = [ONE, TWO, THREE, FOUR, FIVE];
  let actions = 0;
  STATES.forEach((st, si) => {
    const g = game(11 + si);
    idle(g, 30000);
    g.dialog = null;
    g.killTasks();
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
          if (g.roomId !== id || g.mode !== 'room' || g.ended || JSON.stringify(g.f) !== JSON.stringify(st)) reset();
          g.inv = ITEMS.slice();
          const verb = ['look', 'use', 'talk'].includes(v) ? v : 'use';
          const item = verb === v ? undefined : v;
          if (g.perform(verb, tg, item)) actions++;
          let n = 0;
          while ((g.busy || g.dialog || g.fade > 0.001 || g.mode !== 'room') && !g.ended && n++ < 40000) {
            g.update(1 / 30);
            if (g.dialog && !g.busy) { const ids = g.optionIds(); if (ids.includes('bye')) g.choose('bye'); else if (ids.length) g.choose(ids[ids.length - 1]); else g.endDialog(); }
            if (g.mode !== 'room' && !g.busy && g.drive && g.drive.key) g.drive.key('Escape');
          }
          step(g, 2);
          ok(n < 40000, `fuzz ${verb} ${tg} ${item || ''} in ${id} state ${si} settles: ` + g.log.slice(-1));
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
  idle(g, 30000);
  g.dialog = null;
  g.killTasks();
  let moves = 0;
  const FIN = Object.assign({}, FIVE, { santaEvil: true });
  for (const base of [{ moving: true, ball: 'cannon' }, { moving: false, ball: 'cannon', phase: 6 }, { moving: false, ball: 'plane', phase: 2 }, { moving: true, ball: 'plane' }]) {
    const reset = () => {
      g.killTasks();
      g.closeup = null; g.dialog = null; g.hideUI = false; g.ended = false; g.mode = 'room'; g.drive = null;
      g.f = Object.assign({}, FIN);
      g.vt = {};
      g.actors.max.scripted = false;
      g.setRoom('workshop');
      g.vt.finale = Object.assign(E.FINALE.newFinale(), base);
      g.fade = 0; g.fadeTo = 0;
    };
    reset();
    const targets = g.hotspots().map(h => h.id).concat(['santa', 'max']);
    for (const tg of targets) {
      for (const v of ['look', 'use', 'talk', ...ITEMS]) {
        reset();
        g.inv = ITEMS.slice();
        const verb = ['look', 'use', 'talk'].includes(v) ? v : 'use';
        const item = verb === v ? undefined : v;
        if (g.perform(verb, tg, item)) moves++;
        let n = 0;
        while ((g.busy || g.dialog || g.fade > 0.001) && !g.ended && n++ < 80000) {
          g.update(1 / 30);
          if (g.dialog && !g.busy) { const ids = g.optionIds(); if (ids.includes('bye')) g.choose('bye'); else g.choose(ids[ids.length - 1]); }
        }
        step(g, 2);
        ok(n < 80000, `finale fuzz ${verb} ${tg} ${item || ''} settles: ` + g.log.slice(-1));
        ok(!g.closeup && !g.hideUI && g.actors.sam.visible && g.actors.sam.act === '' && !g.actors.max.scripted, `finale fuzz ${verb} ${tg} ${item || ''} leaves a playable stage`);
        if (!g.ended) ok(g.roomId === 'workshop' && (g.f.santaDown || E.finale(g)), `finale fuzz ${verb} ${tg} ${item || ''} keeps the fight in the workshop`);
      }
    }
    ok(!g.log.some(l => l.startsWith('script error')), 'finale fuzz without script errors: ' + g.log.filter(l => l.startsWith('script error')).slice(0, 3).join(' | '));
  }
  ok(moves > 300, 'finale fuzz ran many actions: ' + moves);
}

{
  const SL = String.fromCharCode(47);
  const LINE = SL + SL, BLOCK = SL + '*';
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/sammax201/' + f).concat(['js/apps/sammax201-app.js', 'tests/sammax201.test.js', 'tools/sammax201-tour.cjs']);
  for (const f of files) {
    const src = read(f);
    ok(!src.includes(LINE) && !src.includes(BLOCK), f + ' has no comments');
  }
  ok(!read('sammax201.html').includes('<!' + '--'), 'page has no comments');
  const html = read('index.html');
  const page = read('sammax201.html');
  let lastA = -1, lastB = -1;
  for (const f of BASE) {
    const needle = `js/apps/sammax/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'engine script order in index.html and sammax201.html: ' + f);
    lastA = ia; lastB = ib;
  }
  for (const f of SHARED) {
    const needle = `js/apps/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > -1 && ib > lastB, 'shared art modules are loaded: ' + f);
    lastB = ib;
  }
  lastA = html.indexOf('js/apps/sammax106-app.js');
  ok(lastA > 0, 'episode 106 is loaded before episode 201');
  for (const f of ORDER) {
    const needle = `js/apps/sammax201/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'episode script order in index.html and sammax201.html: ' + f);
    lastA = ia; lastB = ib;
  }
  ok(fs.readdirSync(DIR).filter(f => f.endsWith('.js')).length === ORDER.length, 'every episode module is loaded by the pages');
  ok(html.indexOf('js/apps/sammax201-app.js') > lastA, 'desktop loads the wrapper');
  ok(!page.includes('sammax/sm-room') && !page.includes('mm-room') && !page.includes('sc-room') && !page.includes('al-room') && !page.includes('rt-room') && !page.includes('bm-room') && !page.includes('bm-story'), 'standalone page loads only the engine, shared art and episode 201');
  ok(page.includes('window.smx21=ui') && page.includes('ep:SamMax.EP201'), 'standalone page exposes the game for the browser tour');
  const gm = read('js/game-manager.js');
  const at = gm.indexOf('      sammax201: {');
  const entry = gm.slice(at, at + 2800);
  ok(at > 0 && /steam: true/.test(entry) && /price: 30\.49/.test(entry) && /targetExe: 'SAMMAX21\.EXE'/.test(entry) && /appSamMax201/.test(entry), 'Steam catalog entry');
  ok((gm.match(/price: 30\.49/g) || []).length === 1, 'the Steam price is not shared with another game');
  ok(/genre: '/.test(entry) && /tags: \[/.test(entry) && /shots: \[/.test(entry), 'Steam entry has genre, tags and screenshot captions');
  const tags = entry.match(/tags: \[([^\]]*)\]/);
  ok(tags && tags[1].split(',').length >= 3 && tags[1].split(',').length <= 5, 'Steam entry has three to five tags');
  const caps = entry.match(/shots: \[([^\]]*)\]/);
  ok(caps && caps[1].split("',").length >= 2, 'Steam entry has at least two screenshot captions');
  ok(!REAL_NAMES.test(entry), 'Steam entry follows the naming rule');
  ok(!/sammax201Granted/.test(gm), 'no grant flag');
  const loadState = gm.slice(gm.indexOf('loadState'), gm.indexOf('moveGamesToSteam(state)'));
  ok(!/'sammax201'/.test(loadState), 'not preinstalled');
  ok(/id === 'sammax201'/.test(gm), 'readme for the installed game');
  for (const n of [1, 2]) ok(fs.existsSync(path.join(ROOT, 'content/steam/sammax201-' + n + '.jpg')), 'Steam screenshot ' + n);
  ok(read('tools/steam-shots-recipes.cjs').includes('sammax201'), 'Steam screenshot recipe');
  ok(read('tools/sammax-shots.cjs').includes('window.smx21'), 'the shared shot tool knows the page of episode 201');
  const shell = {
    'js/desktop.js': ["isInstalled('sammax201')", 'appSamMax201'],
    'js/taskbar.js': ["isInstalled('sammax201')", "case 'sammax201'", "showInSteam('sammax201')"],
    'js/apps/dialogs.js': ["cmd === 'sammax201'", "showInSteam(\\'sammax201\\')"],
    'js/apps/explorer.js': ["item.app === 'sammax201'", 'SAMMAX21.EXE'],
    'js/filesystem.js': ["gmInstalled.includes('sammax201')", "'SAMMAX21.EXE'"],
    'js/apps/task-manager.js': ["'app_sammax201'", 'sammax21.exe'],
    'js/icons.js': ["'sammax201': `<svg"],
    'js/apps/clippy.js': ["id.startsWith('app_sammax201')", "launchProgram('sammax201', 'appSamMax201')"],
    'js/apps/steam.js': ["game: 'sammax201'"],
    'js/apps/advanced-site.js': ["id: 'sammax201'"],
    'js/apps/sammax201-app.js': ["id = 'app_sammax201'", 'ep: S.EP201'],
    'tests/steam.test.js': ["'sammax201'"]
  };
  for (const [f, needles] of Object.entries(shell)) {
    const src = read(f);
    for (const n of needles) ok(src.includes(n), `${f} contains ${n}`);
  }
  const clippy = read('js/apps/clippy.js');
  ok(clippy.indexOf("id.startsWith('app_sammax201')") < clippy.indexOf("id.startsWith('app_sammax')"), 'clippy checks episode 201 before episode 101');
  ok((read('js/i18n.js').match(/'app\.sammax201': 'Sam & Max: Ice Station Santa'/g) || []).length === 4, 'i18n title in every language');
  ok(read('package.json').includes('"test:sammax201": "node tests/sammax201.test.js"'), 'npm script');
  ok((read('package.json').match(/node tests\/sammax201\.test\.js/g) || []).length === 2, 'full test run includes episode 201');
  ok(fs.existsSync(path.join(ROOT, 'SAM-MAX-201.md')), 'episode document');
}

console.log(`sammax201: ${checks} checks passed in ${Date.now() - t0} ms`);
