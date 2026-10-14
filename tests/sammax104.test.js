const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const BASE_DIR = path.join(ROOT, 'js/apps/sammax');
const DIR = path.join(ROOT, 'js/apps/sammax104');
const BASE = ['sm-core', 'sm-paint', 'sm-font', 'sm-sprites', 'sm-sprites2', 'sm-icons', 'sm-bg', 'sm-bg2', 'sm-bg3', 'sm-engine', 'sm-render', 'sm-closeups', 'sm-drive', 'sm-audio', 'sm-ui'];
const SHARED = ['sammax102/sc-sprites', 'sammax102/sc-icons', 'sammax103/mm-sprites', 'sammax103/mm-icons'];
const ORDER = ['al-story', 'al-sprites', 'al-icons', 'al-bg', 'al-bg2', 'al-closeups', 'al-warsong', 'al-panels', 'al-room-office', 'al-room-street', 'al-room-bosco', 'al-room-sybil', 'al-room-lawn', 'al-room-oval', 'al-room-warroom', 'al-drive'];
let S;
for (const f of BASE) S = require(path.join(BASE_DIR, f + '.js'));
const baseThemes = new Set(Object.keys(S.THEMES));
for (const f of SHARED) S = require(path.join(ROOT, 'js/apps', f + '.js'));
const sharedIcons = new Map(Object.entries(S.ICONS));
const sharedCostumes = new Map(Object.entries(S.COSTUMES));
for (const f of ORDER) S = require(path.join(DIR, f + '.js'));
const E = S.EP104;
const { PLAYER_Z } = S.driveMath;
const REAL_NAMES = new RegExp(['Micro' + 'soft', 'Win' + 'dows'].join('|'));
const ITEMS = ['max', 'gun', 'roach', 'glove', 'poster', 'delivery', 'nofeed', 'flyer', 'ribbon', 'dater', 'serum', 'beacon', 'head'];

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
  while ((g.busy || (g.fade > 0.001 && !g.ended) || (g.mode === 'drive' && g.drive && g.drive.kind === 'travel')) && n < (max || 12000)) { g.update(1 / 30); n++; }
  step(g, 3);
  ok(n < (max || 12000), 'game became idle in ' + g.roomId + ' after: ' + g.log.slice(-2).join(' | '));
  ok(!g.log.some(l => l.startsWith('script error')), 'no script errors: ' + g.log.filter(l => l.startsWith('script error')).join(' | '));
  return n;
}

function act(g, verb, target, item) {
  idle(g);
  const r = g.perform(verb, target, item);
  const a = typeof target === 'string' && g.actors[target];
  ok(r, `perform ${verb} ${target} ${item || ''} in ${g.roomId} busy=${g.busy} dlg=${g.dialog && g.dialog.id} mode=${g.mode} actor=${a ? a.room + ':' + a.visible : '-'} hot=${g.hotspots().map(h => h.id).join(',')}`);
  idle(g);
}

function choose(g, id) {
  idle(g);
  ok(g.dialog, 'dialog open for ' + id + ' in ' + g.roomId + ' last: ' + g.log.slice(-1));
  ok(g.optionIds().includes(id), 'option ' + id + ' in ' + (g.dialog && g.dialog.id) + ': ' + (g.dialog ? g.optionIds().join(',') : ''));
  g.choose(id);
  idle(g);
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

function mapTo(g, dest) {
  act(g, 'use', 'desoto');
  ok(g.mode === 'map' && g.drive, 'map opened in ' + g.roomId);
  ok(g.drive.dests().some(([id]) => id === dest), 'destination on the map: ' + dest);
  g.drive.choose(dest);
  if (!E.DEST[dest].room) return;
  let n = 0;
  while (g.mode !== 'room' && n < 3000) { g.update(1 / 30); n++; }
  idle(g);
  ok(g.roomId === E.DEST[dest].room, 'arrived at ' + dest + ', now ' + g.roomId);
}

const CITY = ['office', 'street', 'bosco', 'sybil'];

function toStreet(g) {
  if (g.roomId === 'office') go(g, 'edoor', 'street');
  else if (g.roomId === 'bosco') go(g, 'exit', 'street');
  else if (g.roomId === 'sybil') go(g, 'door', 'street');
}

function toLawn(g) {
  if (g.roomId === 'warroom') go(g, 'door', 'oval');
  if (g.roomId === 'oval') go(g, 'exit', 'lawn');
}

function travel(g, room) {
  if (g.roomId === room) return;
  if (CITY.includes(room)) {
    if (!CITY.includes(g.roomId)) { toLawn(g); mapTo(g, 'street'); } else toStreet(g);
    if (room !== 'street') go(g, room + 'door', room);
    return;
  }
  if (CITY.includes(g.roomId)) { toStreet(g); mapTo(g, 'lawn'); }
  if (room === 'lawn') { toLawn(g); return; }
  if (g.roomId === 'lawn') go(g, 'door', 'oval');
  if (room === 'warroom' && g.roomId === 'oval') go(g, 'wardoor', 'warroom');
  if (room === 'oval' && g.roomId === 'warroom') go(g, 'door', 'oval');
  ok(g.roomId === room, 'travelled to ' + room + ', now ' + g.roomId);
}

function panel(g, kind) {
  ok(g.mode === 'panel' && g.drive && g.drive.kind === kind, 'panel open: ' + kind + ' mode=' + g.mode);
  ok(!g.canSave(), 'no saving inside a panel');
  idle(g);
  return g.drive;
}

function press(g, d, value) {
  idle(g);
  for (let y = 0; y < 200; y += 2) for (let x = 0; x < 320; x += 2) {
    if (d.hit(x, y) !== value) continue;
    d.pointer(x, y);
    d.click(x, y, 0);
    idle(g);
    return;
  }
  ok(false, 'panel control not found: ' + value);
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
  ok(JSON.stringify(h.f.cards) === JSON.stringify(g.f.cards), 'reload keeps the cue cards');
  for (const a of g.visibleActors()) ok(h.actors[a.id].room === a.room && h.actors[a.id].visible, 'reload keeps actor ' + a.id + ' in ' + g.roomId);
  return h;
}

function ask(g, topic) {
  act(g, 'talk', 'lincoln');
  ok(g.dialog && g.dialog.id === 'debate', 'debate dialog');
  choose(g, 'issues');
  ok(g.dialog && g.dialog.id === 'issues', 'issues dialog');
  choose(g, topic);
  if (g.dialog) close(g);
}

function topCard(g, id) {
  if (g.has(id)) { act(g, 'use', 'cuestand', id); ok(!g.has(id) && g.f.cards[0] === id, 'sign placed on the stand: ' + id); return; }
  for (let i = 0; i < 6 && g.f.cards[0] !== id; i++) act(g, 'use', 'cuestand');
  ok(g.f.cards[0] === id, 'card on top: ' + id + ' of ' + g.f.cards.join(','));
}

function abeChase(g, throwIt) {
  ok(g.mode === 'drive' && g.drive instanceof E.LincolnChase, 'lincoln chase started');
  idle(g);
  const d0 = g.drive;
  if (!throwIt) {
    ok(d0.tool === 'steer' && d0.toolAt(300, 50) === null, 'no beacon button without the beacon');
    d0.shoot(160, 100); idle(g);
    d0.honk(); idle(g);
    d0.megaphone(); idle(g);
    ok(g.log.some(l => l.includes('ЛИНКОЛЬН КРУШИТЬ')), 'lincoln ignores the megaphone');
    d0.selectTool('exit');
    let k = 0;
    while (g.mode !== 'room' && k < 3000) { g.update(1 / 30); k++; }
    idle(g);
    ok(g.mode === 'room' && !g.f.beaconOn, 'left the chase without the beacon, back in ' + g.roomId);
    return;
  }
  ok(d0.tool === 'beacon' && d0.toolAt(300, 50) === 'beacon', 'beacon tool is selected');
  const far = d0.abeBox();
  d0.click((far.x0 + far.x1) / 2, (far.y0 + far.y1) / 2, 0);
  idle(g);
  ok(!g.f.beaconOn && g.has('beacon'), 'a throw from afar does not reach');
  d0.click(20, 190, 0);
  idle(g);
  ok(!g.f.beaconOn && g.has('beacon'), 'a miss keeps the beacon');
  let n = 0;
  while (g.mode === 'drive' && n < 40000) {
    n++;
    g.update(1 / 30);
    const d = g.drive;
    if (!d || d.kind !== 'abe' || d.paused || g.busy) continue;
    const danger = d.wrecks.filter(w => w.z < PLAYER_Z + 10 && w.z > PLAYER_Z - 1);
    const free = [-1, 0, 1].filter(l => !danger.some(w => Math.abs(w.x - l) < 0.75));
    if (free.length && !free.includes(d.lane)) {
      const to = free.sort((a, b) => Math.abs(a - d.lane) - Math.abs(b - d.lane))[0];
      d.steer(to > d.lane ? 1 : -1);
    }
    if (d.abe.z <= 17.5) {
      const b = d.abeBox();
      d.click((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, 0);
    }
  }
  idle(g);
  ok(n < 40000, 'the chase bot finished');
  ok(g.f.beaconOn && !g.has('beacon') && g.roomId === 'lawn', 'beacon thrown onto lincoln, back on the lawn');
}

function playthrough(seed, o) {
  o = o || {};
  const cp = g => (o.reload ? reload(g) : g);
  let g = game(seed);
  idle(g);
  ok(g.roomId === 'office' && g.dialog && g.dialog.id === 'commish', 'intro ends with the commissioner');
  for (const id of o.mistakes ? ['laws', 'guard', 'why', 'chair', 'where'] : ['where']) choose(g, id);
  choose(g, 'bye');
  ok(g.f.caseOpen && !g.dialog && g.f.closetOpen, 'case opened, max fed leonard in the closet');
  for (const id of ['mrbear', 'leocloset', 'capgun', 'glove']) ok(g.hotspots().some(h => h.id === id), 'closet keeps the evidence of earlier cases: ' + id);
  ok(!g.hotspots().some(h => h.id === 'preshead'), 'no head of the president yet');
  if (o.mistakes) {
    for (const id of ['mrbear', 'leocloset', 'capgun']) { act(g, 'look', id); act(g, 'use', id); }
    act(g, 'talk', 'leocloset');
    for (let i = 0; i < 5; i++) act(g, 'use', 'tv');
    ok(g.f.tvDone && g.f.knowHypno && g.f.tvSeg === 5, 'tv programmes watched');
    for (let i = 0; i < 4; i++) act(g, 'use', 'machine');
    ok(g.f.machineHeard, 'answering machine played');
    act(g, 'use', 'phone');
    ok(g.dialog && g.dialog.id === 'dial' && !g.optionIds().includes('wh'), 'white house number unknown yet');
    choose(g, 'pizza'); choose(g, 'commish');
    close(g);
    act(g, 'use', 'phone', 'roach');
    ok(!g.dialog, 'the bug has nobody to call yet');
  }
  act(g, 'use', 'glove');
  ok(g.has('glove') && g.f.gloveTaken, 'boxing glove of case 101 taken from the closet');
  go(g, 'edoor', 'street');
  if (o.mistakes) {
    talk(g, 'hugh', ['who', 'prism', 'book', 'free', 'pres']);
    act(g, 'use', 'delivery');
    ok(!g.has('delivery'), 'hugh guards his sign');
  }
  mapTo(g, 'lawn');
  ok(g.f.lawnSeen && g.actors.superball.room === 'lawn' && g.actors.superball.act === 'block', 'superball blocks the white house');
  act(g, 'use', 'door');
  ok(g.roomId === 'lawn' && g.dialog && g.dialog.id === 'superball', 'superball stops the visitors');
  for (const id of o.mistakes ? ['in', 'who', 'duty', 'boss', 'bite', 'trick'] : ['duty']) choose(g, id);
  close(g);
  ok(g.f.knowDuty, 'superball answers the service phone');
  act(g, 'look', 'payphone');
  ok(g.f.knowNumber, 'number of the booth read');
  if (o.mistakes) {
    talk(g, 'jimmy', ['what', 'lobby', 'sub', 'pres']);
    act(g, 'use', 'payphone');
    act(g, 'use', 'superball', 'roach');
    ok(g.f.bugRec === 'superball' && g.has('roach'), 'bug listened to superball');
    act(g, 'look', 'roach');
  }
  g = cp(g);
  travel(g, 'office');
  act(g, 'use', 'phone');
  choose(g, 'wh');
  ok(g.dialog && g.dialog.id === 'whcall', 'superball answered the call');
  if (o.mistakes) { choose(g, 'baby'); choose(g, 'zoo'); choose(g, 'forty'); if (g.f.knowPapa) choose(g, 'papa'); }
  choose(g, 'hold');
  ok(g.f.superHold && !g.dialog, 'superball waits on the line');
  if (o.mistakes) {
    act(g, 'use', 'phone');
    choose(g, 'wh');
    ok(!g.dialog && g.f.superHold, 'the line is busy now');
  }
  travel(g, 'lawn');
  ok(g.actors.superball.act === 'phone' && g.actors.superball.x > 400, 'superball stands in the booth');
  go(g, 'door', 'oval');
  ok(g.f.presMet && g.actors.pres.room === 'oval' && g.actors.chuckles.room === 'oval', 'met the president and chuckles');
  talk(g, 'pres', o.mistakes ? ['laws', 'hyp', 'guest', 'gun'] : ['hyp']);
  talk(g, 'chuckles', o.mistakes ? ['mob', 'job', 'leave', 'war', 'critter'] : ['leave']);
  ok(g.f.knowEscort, 'chuckles leaves only for war room intruders');
  act(g, 'use', 'pres', 'glove');
  ok(!g.f.puppetDown, 'no punch while chuckles watches');
  if (o.mistakes) {
    for (const id of ['calendar', 'ribbon', 'budget', 'dphone', 'globe']) act(g, 'use', id);
    ok(g.mode === 'room' && !g.has('ribbon'), 'the desk is off limits for now');
    act(g, 'use', 'pres', 'roach');
    ok(g.f.bugRec === 'pres', 'bug heard the jaw of the puppet');
  }
  act(g, 'use', 'wardoor');
  ok(g.roomId === 'lawn' && g.f.whizzerIn && g.actors.whizzer.room === 'oval', 'thrown out, whizzer arrived');
  g = cp(g);
  go(g, 'door', 'oval');
  if (o.mistakes) talk(g, 'whizzer', ['gov', 'bros', 'soda', 'why']);
  act(g, 'talk', 'pres');
  choose(g, 'ready');
  ok(g.dialog && g.dialog.id === 'interp1', 'interpreting starts');
  if (o.mistakes) {
    for (const id of ['honest', 'revolt', 'love', 'ball']) choose(g, id);
    choose(g, 'bye');
    ok(!g.dialog && !g.f.whizzerSoda, 'interpreting paused');
    act(g, 'talk', 'pres');
    choose(g, 'ready');
  }
  choose(g, 'drink');
  ok(g.f.whizzerSoda && g.f.globeOpen && g.dialog && g.dialog.id === 'interp2', 'whizzer drank the soda');
  if (o.mistakes) {
    choose(g, 'wc'); choose(g, 'bed'); choose(g, 'bye');
    ok(!g.dialog && !g.f.chucklesOut, 'honest translation changes nothing');
    g = cp(g);
    ok(g.actors.whizzer.act === 'dance', 'whizzer still dances after a reload');
    act(g, 'talk', 'pres');
    choose(g, 'ready');
    ok(g.dialog && g.dialog.id === 'interp2', 'interpreting resumes at the second question');
  }
  choose(g, 'war');
  ok(g.f.chucklesOut && g.actors.chuckles.room === 'nowhere' && g.actors.whizzer.room === 'nowhere', 'chuckles escorted whizzer out');
  if (o.mistakes) { talk(g, 'pres', ['alone']); act(g, 'use', 'wardoor'); ok(g.roomId === 'oval', 'war room stays locked'); }
  act(g, 'use', 'pres', 'glove');
  ok(g.f.puppetDown && g.f.election && g.actors.pres.v === 'headless', 'the president is a puppet, emergency election');
  ok(g.actors.superball.room === 'oval' && !g.closeup, 'superball guards the war room');
  act(g, 'look', 'headfloor');
  act(g, 'use', 'headfloor');
  ok(g.has('head') && g.f.headTaken, 'head of the president taken');
  if (o.mistakes) {
    talk(g, 'superball', ['move', 'hold', 'rest', 'war']);
    act(g, 'use', 'calendar');
    ok(g.mode === 'room', 'superball guards the calendar');
  }
  g = cp(g);
  go(g, 'exit', 'lawn');
  ok(g.actors.lincoln.room === 'lawn' && g.actors.chuckles.room === 'lawn' && g.actors.chuckles.scale === 0.5, 'lincoln on the stage with chuckles on his shoulder');
  ok(g.hotspots().some(h => h.id === 'cuestand') && g.hotspots().some(h => h.id === 'flyers'), 'stage, cue cards and flyers');
  act(g, 'talk', 'lincoln');
  ok(g.f.maxRuns && g.dialog && g.dialog.id === 'debate', 'max registered as a candidate');
  if (o.mistakes) { choose(g, 'max'); choose(g, 'cards'); }
  close(g);
  ok(E.poll(g).lin === 80 && E.poll(g).max === 5, 'poll starts at 80 to 5');
  if (o.mistakes) {
    ask(g, 'school');
    ok(!g.f.hitSchool, 'the first card is harmless');
    act(g, 'look', 'cuestand');
    act(g, 'look', 'poll');
  }
  const cards = () => {
    topCard(g, 'wrongs');
    ask(g, 'school');
    ok(g.f.hitSchool, 'two wrongs on religion and schools');
    if (o.mistakes) { ask(g, 'tax'); ok(!g.f.hitTax, 'wrong card for taxes'); ask(g, 'school'); }
    act(g, 'use', 'nofeed');
    ok(g.has('nofeed'), 'pond sign taken');
    topCard(g, 'nofeed');
    ask(g, 'poor');
    ok(g.f.hitPoor && E.poll(g).hits === 2, 'do not feed the hungry');
    travel(g, 'street');
    act(g, 'use', 'posters');
    ok(g.has('poster') && g.f.posterTaken, 'army poster taken');
    act(g, 'talk', 'hugh');
    choose(g, 'trick');
    idle(g);
    ok(!g.actors.hugh.visible, 'hugh vanished');
    act(g, 'use', 'delivery');
    ok(g.has('delivery') && g.f.deliveryTaken, 'delivery sign taken while hugh is gone');
    let n = 0;
    while (!g.actors.hugh.visible && n < 900) { g.update(1 / 30); n++; }
    idle(g);
    ok(g.actors.hugh.visible, 'hugh came back');
    travel(g, 'lawn');
    topCard(g, 'poster');
    ask(g, 'tax');
    ok(g.f.hitTax, 'give me all you got');
    topCard(g, 'delivery');
    ask(g, 'waste');
    ok(g.f.hitWaste, 'toxic waste with free home delivery');
  };
  const scandal = () => {
    travel(g, 'lawn');
    if (!g.f.elected) {
      ask(g, 'family');
      ok(g.f.knowFamily, 'family values speech heard');
      act(g, 'use', 'flyers');
      ok(g.has('flyer'), 'flyer taken');
      act(g, 'use', 'lincoln', 'roach');
      ok(g.f.bugRec === 'lincoln' && g.has('roach'), 'bug recorded the statement');
    }
    travel(g, 'sybil');
    if (o.mistakes) {
      talk(g, 'sybil', ['job', 'how', 'you', 'studio']);
      act(g, 'talk', 'sybil');
      choose(g, 'apply');
      ok(g.dialog && g.dialog.id === 'match', 'questionnaire');
      for (let i = 0; i < 3; i++) choose(g, g.optionIds()[0]);
      idle(g);
      ok(g.f.matched && !g.dialog, 'sam and max are a perfect match');
    }
    act(g, 'use', 'sybil', 'flyer');
    ok(g.f.sybilSmitten && g.f.sybilNumber && !g.has('flyer'), 'sybil fell for lincoln');
    travel(g, 'office');
    if (o.mistakes) {
      act(g, 'use', 'phone');
      choose(g, 'sybil');
      ok(!g.dialog && !g.f.scandal, 'sybil hangs up on sam');
      act(g, 'use', 'closetin', 'head');
      ok(g.f.headInCloset && !g.has('head') && g.hotspots().some(h => h.id === 'preshead'), 'head of the president put into the closet');
      act(g, 'look', 'preshead');
    }
    act(g, 'use', 'phone', 'roach');
    ok(g.dialog && g.dialog.id === 'bugcall', 'the bug calls sybil');
    if (o.mistakes) { choose(g, 'citizens'); choose(g, 'chains'); ok(g.dialog && !g.f.sybilCalled, 'wrong phrases confuse sybil'); }
    for (const id of ['iam', 'day', 'steps', 'now']) choose(g, id);
    idle(g);
    ok(g.f.scandal && g.f.sybilCalled && g.roomId === 'lawn' && !g.dialog, 'scandal on the steps of the white house');
    ok(g.actors.sybil.room === 'nowhere', 'sybil ran away');
  };
  if (o.scandalFirst) {
    scandal();
    ok(!g.f.elected && E.poll(g).lin === 70, 'scandal alone is not enough');
    g = cp(g);
    cards();
  } else {
    cards();
    ok(!g.f.elected && E.poll(g).lin === 40 && E.poll(g).max === 39, 'lincoln leads by one point');
    g = cp(g);
    scandal();
  }
  ok(g.f.elected && g.f.rampage && g.actors.lincoln.room === 'nowhere' && g.actors.chuckles.room === 'nowhere', 'max elected, lincoln rampages');
  ok(g.hotspots().some(h => h.id === 'steps') && !g.hotspots().some(h => h.id === 'flyers'), 'wrecked stage and footprints');
  g = cp(g);
  if (o.mistakes) {
    mapTo(g, 'chase');
    abeChase(g, false);
  }
  travel(g, 'oval');
  ok(g.seen.inaug && g.actors.max.follow === null && g.actors.max.y < 134, 'president max stands on the chair');
  for (const id of ['specs', 'peepers', 'whizzer']) ok(g.actors[id].room === 'oval', 'governor present: ' + id);
  talk(g, 'specs', o.mistakes ? ['rush', 'believe', 'war', 'how'] : ['war']);
  ok(g.f.knowPolite, 'the governors are too polite');
  act(g, 'use', 'ribbon');
  ok(g.has('ribbon') && g.f.ribbonTaken, 'ribbon taken');
  if (o.mistakes) {
    for (const id of ['specs', 'peepers', 'whizzer']) act(g, 'use', id, 'ribbon');
    ok(g.has('ribbon'), 'governors refuse the ribbon');
    for (const d of [12, 26, 1, 2, 8, 15, 22, 27, 4, 13]) {
      if (d !== g.f.today) {
        act(g, 'use', 'calendar');
        const c = panel(g, 'calendar');
        press(g, c, d);
        ok(g.f.today === d && g.mode === 'panel', 'the today note moved to ' + d);
        if (d % 2) { c.key('Escape'); idle(g); } else press(g, c, 0);
        ok(g.mode === 'room' && g.log.some(l => l.includes('на ' + d + ' апреля')), 'calendar closed on day ' + d);
      }
      act(g, 'talk', 'superball');
      choose(g, 'vac');
      close(g);
      ok(!g.f.superGone && g.actors.superball.room === 'oval', 'superball stays at his post on day ' + d);
    }
  }
  act(g, 'use', 'superball', 'ribbon');
  ok(g.dialog && g.dialog.id === 'sectitle', 'max picks a title');
  choose(g, g.optionIds()[seed % 3]);
  ok(g.f.superSec && g.f.secTitle && !g.has('ribbon') && g.actors.superball.v === 'sec', 'superball is a secretary now');
  g = cp(g);
  ok(g.actors.superball.v === 'sec', 'the ribbon survives a reload');
  act(g, 'use', 'calendar');
  const cal = panel(g, 'calendar');
  press(g, cal, 26);
  press(g, cal, 0);
  ok(g.f.today === 26 && g.mode === 'room', 'secretary day');
  act(g, 'talk', 'superball');
  choose(g, 'vac');
  idle(g);
  ok(g.f.superGone && g.actors.superball.room === 'nowhere' && !g.dialog, 'superball took the day off');
  act(g, 'use', 'wardoor');
  ok(g.roomId === 'oval', 'the war room needs a war');
  act(g, 'use', 'budget');
  const b0 = panel(g, 'budget');
  ok(b0.rows.length === 3, 'only famous historic sites at first');
  if (o.mistakes) {
    press(g, b0, 1);
    ok(g.f.budget === 'alamo' && g.mode === 'room', 'money for the alamo');
    act(g, 'use', 'budget');
    press(g, panel(g, 'budget'), 1);
    ok(g.f.budget === 'alamo', 'the same line twice');
  } else { b0.key('Escape'); idle(g); }
  travel(g, 'bosco');
  talk(g, 'bosco', o.mistakes ? ['who', 'why', 'dish', 'smell', 'sell', 'buy', 'have', 'rus'] : ['sell']);
  ok(g.f.knowSerum && !g.has('serum'), 'truth serum costs a hundred million');
  if (o.mistakes) { act(g, 'use', 'salesign'); ok(!g.has('beacon'), 'no reason to touch the blinking thing yet'); act(g, 'use', 'bosco', 'head'); }
  travel(g, 'sybil');
  ok(g.actors.sybil.v === '', 'sybil took the heart off');
  talk(g, 'sybil', o.mistakes ? ['job', 'abe', 'lend', 'money', 'how'] : ['how']);
  ok(g.f.tikiDated, 'the tiki is two thousand years old');
  travel(g, 'oval');
  act(g, 'use', 'budget');
  const b1 = panel(g, 'budget');
  ok(b1.rows.length === 4 && b1.rows[3].id === 'sybil', 'sybil is on the list');
  press(g, b1, 3);
  ok(g.f.sybilFunded && g.f.sybilGone && g.f.budget === 'sybil', 'sybil funded and gone on vacation');
  g = cp(g);
  travel(g, 'sybil');
  ok(g.actors.sybil.room === 'nowhere' && g.seen.sybilGone, 'sybil left the office');
  act(g, 'use', 'dater');
  ok(g.has('dater') && g.f.daterTaken, 'carbon dater borrowed');
  if (o.mistakes) { for (const id of ['tiki', 'fox', 'plant']) act(g, 'use', id, 'dater'); act(g, 'use', 'closet'); }
  travel(g, 'bosco');
  act(g, 'use', 'weenies', 'dater');
  ok(g.f.weeniesDated, 'cretaceous weenies');
  if (o.mistakes) { act(g, 'use', 'weenies', 'dater'); act(g, 'use', 'bosco', 'dater'); act(g, 'use', 'shelves', 'dater'); }
  travel(g, 'oval');
  act(g, 'use', 'budget');
  const b2 = panel(g, 'budget');
  ok(b2.rows.length === 5 && b2.rows[4].id === 'bosco', 'bosco is on the list');
  press(g, b2, 4);
  ok(g.f.boscoFunded && g.f.budget === 'bosco', 'bosco funded');
  travel(g, 'bosco');
  ok(g.has('serum') && g.f.serumGot, 'bosco handed over the truth serum');
  if (o.mistakes) talk(g, 'bosco', ['dish', 'have']);
  g = cp(g);
  travel(g, 'oval');
  if (o.mistakes) { act(g, 'use', 'specs', 'serum'); act(g, 'use', 'peepers', 'serum'); ok(g.has('serum') && !g.f.war, 'specs and peepers do not drink'); act(g, 'use', 'whizzer', 'roach'); ok(g.f.bugRec === 'whizzer2', 'whizzer drinks anything without bubbles'); }
  act(g, 'use', 'whizzer', 'serum');
  ok(g.f.war && !g.has('serum') && !g.closeup, 'the dakotas are at war, the war song was sung');
  for (const id of ['specs', 'peepers', 'whizzer']) ok(g.actors[id].room === 'nowhere', 'governor left for the war: ' + id);
  ok(E.WAR_LYRICS.every(l => g.log.some(x => x === l[2] + ': ' + l[3])), 'every line of the war song was shown');
  g = cp(g);
  go(g, 'wardoor', 'warroom');
  ok(g.seen.warroom && g.actors.max.room === 'warroom' && g.actors.max.follow === 'sam', 'president max follows into the war room');
  if (o.mistakes) {
    act(g, 'use', 'periscope');
    ok(!g.closeup && g.log.some(l => l.includes('труба на меня пялится')), 'periscope shows jimmy in the pond');
    for (let i = 0; i < 3; i++) act(g, 'look', 'manual');
    act(g, 'use', 'hotline');
    act(g, 'look', 'silo');
    ok(g.f.knowSilo, 'the monument is a missile');
    for (let i = 0; i < 3; i++) act(g, 'look', 'screens');
  }
  act(g, 'use', 'console');
  const tp = panel(g, 'target');
  ok(g.f.knowBeacon && tp.list[0].id === 'bosco', 'beacon camera shows the store of bosco');
  if (o.mistakes) {
    press(g, tp, 3);
    press(g, tp, 'fire');
    ok(g.mode === 'room' && !g.seen.launch, 'the kremlin beacon is dead');
    for (const [row, id] of [[1, 'antarctica'], [2, 'krypton'], [0, 'bosco']]) {
      act(g, 'use', 'console');
      const p = panel(g, 'target');
      if (row) press(g, p, row);
      ok(p.list[p.sel].id === id, 'target selected: ' + id);
      press(g, p, 'fire');
      idle(g, 20000);
      ok(g.mode === 'room' && !g.closeup && g.roomId === 'warroom', 'missile fired at ' + id);
    }
    ok(g.f.boscoShot && g.seen.launch === 3 && g.f.knowSilo, 'bosco shot the missile down');
  } else { press(g, tp, 'exit'); ok(g.mode === 'room', 'panel closed'); }
  g = cp(g);
  travel(g, 'bosco');
  if (o.mistakes) { ok(g.seen.boscoShot, 'bosco saw the missile'); talk(g, 'bosco', ['rocket']); }
  act(g, 'use', 'salesign');
  ok(g.has('beacon') && g.f.beaconTaken, 'beacon taken from behind the sale sign');
  if (o.mistakes) {
    act(g, 'use', 'bosco', 'beacon');
    travel(g, 'warroom');
    act(g, 'use', 'console');
    const p = panel(g, 'target');
    ok(p.list[0].id === 'pocket', 'the beacon is in the pocket');
    press(g, p, 'fire');
    ok(!g.ended && g.mode === 'room' && g.seen.launch === 3, 'no firing at the own pocket');
    toLawn(g);
  } else { travel(g, 'street'); }
  g = cp(g);
  mapTo(g, 'chase');
  abeChase(g, true);
  ok(!E.DEST.chase.when(g), 'the chase is over');
  g = cp(g);
  travel(g, 'warroom');
  act(g, 'use', 'console');
  const fin = panel(g, 'target');
  ok(fin.list[0].id === 'lincoln', 'the beacon rides on lincoln');
  fin.pointer(10, 10);
  press(g, fin, 'fire');
  idle(g, 30000);
  ok(g.ended && g.roomId === 'office' && g.f.lincolnDown && g.f.headInCloset && !g.has('head'), 'lincoln destroyed, the head of the president is in the closet');
  ok(g.log.some(l => l.startsWith('earpiece:')) && g.log.some(l => l.includes('Не раскисай, Америка')), 'earpiece error and the address of president max');
  ok(g.hotspots().some(h => h.id === 'preshead') && g.hotspots().some(h => h.id === 'mrbear') && g.hotspots().some(h => h.id === 'leocloset'), 'closet now holds four cases');
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
  const ENTRY = { office: [284, 162], street: [300, 150], bosco: [36, 172], sybil: [40, 170], lawn: [112, 146], oval: [40, 172], warroom: [52, 150] };
  ok(Object.keys(ENTRY).length === Object.keys(E.ROOMS).length, 'every room has an entry point');
  for (const election of [false, true]) {
    g.f.election = election;
    for (const [id, [ex, ey]] of Object.entries(ENTRY)) {
      g.setRoom(id);
      ok(g.walkable(ex, ey), 'entry point walkable ' + id);
      const spots = (E.ROOMS[id].hot || []).map(h => [h.id, h.walk]).concat(Object.entries(E.ROOMS[id].actors || {}).map(([aid, h]) => [aid, h.walk]));
      for (const [hid, walk] of spots) {
        const w = typeof walk === 'function' ? walk(g) : walk;
        if (!w) continue;
        const p = g.findPath(ex, ey, w[0], w[1]);
        ok(p && p.length, 'hotspot reachable ' + id + '.' + hid);
        const end = p[p.length - 1];
        ok(Math.hypot(end[0] - w[0], end[1] - w[1]) < 8, 'walk point on the floor ' + id + '.' + hid + ' -> ' + end.map(Math.round).join(','));
      }
    }
  }
  for (const [pos, room] of [[E.DEST.street.pos, 'street'], [E.DEST.lawn.pos, 'lawn']]) { g.setRoom(room); ok(g.walkable(pos.x, pos.y), 'map arrival point walkable ' + room); }
  const STATES = [
    { closetOpen: true, election: true, puppetDown: true, sybilGone: true },
    { closetOpen: true, election: true, puppetDown: true, rampage: true, elected: true, gloveTaken: true, headInCloset: true, headTaken: true, scandal: true, war: true }
  ];
  for (const st of STATES) {
    Object.assign(g.f, st);
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
  }
  ok(ITEMS.length === Object.keys(E.ITEMS).length && ITEMS.every(id => E.ITEMS[id]), 'item list is complete');
  for (const [id, it] of Object.entries(E.ITEMS)) {
    ok(it.name && it.look !== undefined, 'item described ' + id);
    const icon = typeof it.icon === 'function' ? it.icon(g) : it.icon;
    ok(S.ICONS[icon], 'item icon ' + id);
    const ic = S.icon(icon);
    ok(ic.w <= 28 && ic.h <= 22 && ic.px.some(v => v), 'item icon renders ' + id);
  }
  for (const [id, fn] of Object.entries(S.ICONS)) { const b = fn(); ok(b && b.px.some(v => v), 'icon draws ' + id); }
  for (const [id, fn] of sharedIcons) ok(S.ICONS[id] === fn, 'episode 104 keeps the shared icon ' + id);
  for (const [id, cos] of sharedCostumes) ok(S.COSTUMES[id] === cos, 'episode 104 keeps the shared costume ' + id);
  const convs = Object.entries(E.TALK);
  for (const [id, conv] of convs) {
    if (typeof conv.options === 'function') continue;
    const ids = conv.options.map(o => o.id);
    ok(new Set(ids).size === ids.length, 'unique option ids in ' + id);
    ok(conv.options.some(o => o.end), 'conversation can end ' + id);
    for (const o of conv.options) ok(o.text && S.ICONS[o.icon], 'option has text and icon ' + id + '.' + o.id);
  }
  for (const [id, conv] of convs) {
    if (typeof conv.options !== 'function') continue;
    for (const data of [{}, { step: 2 }, { picked: ['guns'] }]) {
      const d = { id, data };
      const list = conv.options(g, d);
      ok(list.length > 0 && list.some(o => o.end), 'dynamic conversation has options and an end ' + id);
      for (const o of list) ok(o.text && S.ICONS[o.icon], 'dynamic option has text and icon ' + id + '.' + o.id);
    }
  }
  const POSES = [{ dir: 'e' }, { dir: 'w', walk: 0.25 }, { dir: 's', talk: 1 }, { dir: 'n', walk: 0.6 }, { act: 'block' }, { act: 'phone' }, { act: 'report' }, { act: 'salute' }, { act: 'point' }, { act: 'dance', t: 0.3 }, { act: 'dance', t: 0.8 }, { v: 'sec' }, { act: 'grab' }, { act: 'remote' }, { act: 'sit', talk: 1 }, { act: 'wave', t: 1 }, { v: 'headless' }, { act: 'lapel' }, { act: 'read' }, { act: 'rage', t: 1 }, { dir: 'n', v: 'beacon' }, { v: 'bare' }, { act: 'up' }, { act: 'give' }, { act: 'shrug' }, { act: 'shock' }, { act: 'swoon', v: 'heart' }, { act: 'cry' }, { act: 'scan' }];
  for (const id of ['superball', 'agentc', 'puppet', 'lincoln', 'boscov', 'sybil4']) {
    ok(S.COSTUMES[id] && !sharedCostumes.has(id), 'episode costume ' + id);
    for (const pose of POSES) {
      const s = S.sprite(id, pose, 1);
      ok(s && s.buf.px.some(v => v), 'sprite renders ' + id + ' ' + JSON.stringify(pose));
    }
  }
  for (const pose of [{ dir: 'e', v: 'gov' }, { dir: 's', v: 'gov', act: 'dance', t: 1 }, { dir: 'w', v: 'gov', walk: 0.3 }]) for (const id of ['specs', 'whizzer', 'peepers']) ok(S.sprite(id, pose, 1).buf.px.some(v => v), 'governor sprite ' + id);
  ok(S.sprite('max', { dir: 'e', act: 'punch' }, 1).buf.px.some(v => v === S.C.red[3]), 'max punches with the red glove');
  for (const who of ['superball', 'agentc', 'pres', 'lincoln', 'boscov']) ok(S.art104.portrait(who).px.some(v => v), 'portrait ' + who);
  for (const hits of [0, 1, 2, 3, 4]) for (const scandal of [false, true]) {
    const h = { f: { scandal } };
    E.ISSUES.slice(0, hits).forEach(k => { h.f[k] = true; });
    const p = E.poll(h);
    ok(p.lin + p.max + p.none === 100 && p.none >= 0, 'poll adds up to a hundred');
    ok((p.lin < p.max) === (hits === 4 && scandal), 'max wins only with four blunders and the scandal');
  }
  for (const id of Object.keys(E.CARDS)) ok(id === 'life' || id === 'wrongs' || E.ITEMS[id], 'cue card is an item or a starting card: ' + id);
  for (const tape of Object.values(E.BUG_TAPES)) for (const [who, text] of tape) ok(g.actors[who] && text, 'bug tape speaker exists: ' + who);
  ok(E.SPEECH.length === 7 && ['iam', 'day', 'steps', 'now'].every(id => E.SPEECH.some(([k]) => k === id)), 'lincoln statement has the four date phrases');
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
      ok(!REAL_NAMES.test(s), 'project naming rule: ' + s);
    }
  }
  ok(strings > 1000, 'found the game texts: ' + strings);
  ok(missing.size === 0, 'font covers every text character: ' + [...missing].slice(0, 10).join(', '));
}

{
  const R = new S.Renderer();
  const g = game(3);
  for (let i = 0; i < 90; i++) g.update(1 / 30);
  ok(g.closeup && g.closeup.kind === 'titlecard4' && g.fade < 0.5, 'title card is visible');
  R.render(g);
  ok(R.frame.px.some(v => v > 2), 'title card renders');
  for (let i = 0; i < 300; i++) { g.update(1 / 30); if (i % 25 === 0) R.render(g); }
  g.skip();
  idle(g);
  ok(g.roomId === 'office' && g.dialog && g.dialog.id === 'commish', 'intro can be skipped to the call');
  const out = new Uint8ClampedArray(320 * 200 * 4);
  R.toRGBA(g, out);
  ok(out.some((v, i) => i % 4 !== 3 && v > 0), 'frame converts to RGBA');
  g.dialog = null;
  for (const st of [{}, { caseOpen: true, closetOpen: true, election: true, puppetDown: true, maxRuns: true }, { rampage: true, elected: true, scandal: true, sybilGone: true, superSec: true, boscoFunded: true, globeOpen: true, headInCloset: true, gloveTaken: true, beaconTaken: true, posterTaken: true, war: true, lincolnDown: true }]) {
    Object.assign(g.f, st);
    for (const id of Object.keys(E.ROOMS)) {
      g.setRoom(id);
      g.fade = 0; g.fadeTo = 0;
      for (const cam of [0, E.ROOMS[id].w - 320]) {
        g.camLock = cam;
        g.centerCam(true);
        R.render(g);
        ok(R.frame.px.some(v => v > 2), 'room renders ' + id);
      }
    }
  }
  g.setRoom('office');
  for (const prog of ['laws', 'hugs', 'exam', 'interp', 'bears', 'adabe', 'admax', 'rampage', 'rerun', 'maxtv']) for (const t of [0.2, 3]) { g.closeup = { kind: 'tv4', prog, t0: g.time - t }; R.render(g); ok(R.frame.px.some(v => v > 2), 'tv programme ' + prog); }
  const shots = [{ kind: 'memorial' }, { kind: 'warsong' }, { kind: 'launch', n: 1 }, { kind: 'launch', n: 2 }, { kind: 'periscope' }, { kind: 'titlecard4', lines: ['A', 'B', 'C', 'D'] }];
  for (const target of ['antarctica', 'krypton', 'bosco', 'lincoln']) for (const phase of ['fly', 'hit', 'rubble']) shots.push({ kind: 'impact', target, phase });
  for (const cu of shots) {
    for (const t of [0.3, 1.5, 3.4]) {
      g.closeup = Object.assign({ t0: g.time - t }, cu);
      if (cu.phase && cu.phase !== 'fly') g.closeup.t1 = g.time - t / 2;
      R.render(g);
      ok(R.frame.px.some(v => v > 2), 'closeup ' + cu.kind + ' ' + (cu.target || '') + ' ' + (cu.phase || '') + ' at ' + t);
    }
  }
  g.closeup = null;
  const f = new S.Buf(320, 200);
  E.TITLE.draw(f, 1, 0, [true, false, true, true, false]);
  ok(f.px.every(v => v), 'title screen fully painted');
  ok(E.TITLE.hit(40, 100) === 0 && E.TITLE.hit(40, 156) === 4 && E.TITLE.hit(300, 10) === -1, 'title menu hit test');
  ok(E.CREDITS.length > 10 && E.SAVE_KEY === 'sammax104_saves' && E.SET_KEY === 'sammax104_settings' && E.TITLE_MUSIC === 'title4' && E.CREDITS_MUSIC === 'credits4', 'episode descriptor');
  for (const th of ['title4', 'lawn', 'oval', 'campaign', 'bosco4', 'warroom', 'warsong', 'abechase', 'credits4']) {
    ok(S.THEMES[th] && baseThemes.has(th), 'music theme ' + th);
    if (!S.THEMES[th].song) ok(S.THEMES[th].mel.split(/\s+/).filter(Boolean).length === S.THEMES[th].prog.length * 8, 'melody fills the whole progression: ' + th);
  }
  {
    const th = S.THEMES.warsong, fl = S.songOf(th);
    ok(th.bpm === 120 && fl.total === 81 * 16 && th.prog.length === 81, 'the war song runs 81 bars at 120 bpm');
    th.song.forEach((p, k) => {
      for (const v of ['lead', 'horn', 'bass', 'chords']) {
        if (!p[v]) continue;
        const bars = p[v].split('|').map(b => b.trim().split(/\s+/).filter(Boolean).reduce((n, tok) => n + (tok.includes(':') ? parseInt(tok.split(':')[1], 10) : 1), 0));
        ok(bars.reduce((a, b) => a + b, 0) === p.bars * 16, 'war song part ' + k + ' ' + v + ' fills its bars');
        ok(bars.length === 1 || bars.every(n => n === 16), 'war song part ' + k + ' ' + v + ' has whole bars');
      }
      if (p.comp) ok(p.comp.length === 16, 'comp pattern of part ' + k + ' is one bar');
      if (p.drum) for (const pat of Object.values(p.drum)) ok(pat.length === 16 && /^[x.]+$/.test(pat), 'drum pattern of part ' + k + ' is one bar');
    });
    for (const v of ['lead', 'horn', 'bass']) fl[v].forEach((n, i) => { if (n) ok(Number.isInteger(n.m) && n.m >= 24 && n.m <= 96 && n.len > 0, 'valid war song note ' + v + ' at step ' + i); });
    ok(fl.chord.length === fl.total && fl.chord.every(c => /^[A-G][b#]?(|m|7|m7|maj7|dim|6|m6|sus|aug)$/.test(c)), 'every step of the war song has a known chord');
    ok(fl.total * 0.125 < E.WAR_END, 'the scene outlasts the song');
    ok(E.WAR_LYRICS.every((l, i) => l[0] < l[1] && (i === 0 || l[0] >= E.WAR_LYRICS[i - 1][1] - 0.001) && l[1] <= E.WAR_END && (l[2] === 'superball' || l[2] === 'agents')), 'war song lyrics are ordered and inside the song');
    ok(E.WAR_LYRICS.every(l => [...l[3]].every(c => S.font.has(c)) && S.font.measure(l[3]) <= 300), 'war song lyrics fit one line of the pixel font');
    ok(E.WAR_SHOTS.length > 40 && E.WAR_SHOTS[0][0] === 0 && E.WAR_SHOTS.every((s, i) => i === 0 || s[0] > E.WAR_SHOTS[i - 1][0]), 'war song shots are ordered');
    g.setRoom('oval');
    let prev = null;
    E.WAR_SHOTS.forEach((s, i) => {
      const next = i + 1 < E.WAR_SHOTS.length ? E.WAR_SHOTS[i + 1][0] : E.WAR_END;
      for (const T of [s[0] + 0.01, (s[0] + next) / 2, next - 0.02]) {
        g.closeup = { kind: 'warsong', t0: 0, clock: T };
        R.frame.px.fill(0);
        R.render(g);
        ok(R.frame.px.every(v => v > 0), 'war song shot ' + i + ' paints the whole frame at ' + T.toFixed(2));
      }
      const sig = R.frame.px.join(',');
      ok(sig !== prev, 'war song shot ' + i + ' differs from the previous one');
      prev = sig;
    });
    g.closeup = null;
    const g2 = game(11);
    idle(g2);
    g2.events.length = 0;
    const task = g2.run(E.warSong(g2));
    ok(g2.closeup && g2.closeup.kind === 'warsong' && g2.events.some(e => e.t === 'music' && e.id === 'warsong'), 'the war song opens its scene and music');
    step(g2, 30);
    ok(Math.abs(g2.closeup.clock - 1) < 0.05, 'without audio the scene runs on game time');
    g2.musicPos = { id: 'warsong', t: 5 };
    step(g2, 1);
    ok(Math.abs(g2.closeup.clock - 5) < 0.001, 'the scene jumps to the audio position');
    step(g2, 30);
    ok(Math.abs(g2.closeup.clock - 6) < 0.05, 'a stalled audio clock leaves the scene on game time');
    g2.musicPos = { id: 'warsong', t: 5.5 };
    step(g2, 1);
    ok(Math.abs(g2.closeup.clock - 5.5) < 0.001, 'a moving audio clock pulls the scene back');
    g2.musicPos = { id: 'oval', t: 90 };
    step(g2, 1);
    ok(g2.closeup.clock < 6, 'another theme does not move the scene');
    step(g2, 60);
    g2.musicPos = { id: 'warsong', t: 5.6 };
    step(g2, 1);
    ok(g2.closeup.clock > 7, 'an audio clock far behind the game is ignored');
    g2.skipping = true;
    step(g2, 2);
    ok(task.dead, 'esc ends the war song');
  }
  for (const election of [false, true]) { g.f.election = election; g.f.rampage = false; for (const r of Object.values(E.ROOMS)) ok(S.THEMES[typeof r.music === 'function' ? r.music(g) : r.music], 'room music exists ' + r.id); }
  Object.assign(g.f, { caseOpen: false, rampage: false, beaconOn: false });
  g.setRoom('street');
  const m = new S.MapScreen(g);
  g.mode = 'map'; g.drive = m;
  R.render(g);
  ok(m.hit(96, 118) === 'street' && m.hit(236, 64) === null && m.hit(184, 118) === null, 'map shows only known places');
  g.f.caseOpen = true; g.f.rampage = true;
  ok(m.hit(236, 64) === 'lawn' && m.hit(184, 118) === 'chase', 'map opens washington and the chase');
  g.f.beaconOn = true;
  ok(m.hit(184, 118) === null, 'no chase after the beacon is on');
  g.f.beaconOn = false;
  g.mode = 'room'; g.drive = null;
  g.inv = ['max', 'gun', 'roach', 'beacon'];
  const d = new E.LincolnChase(g);
  g.mode = 'drive'; g.drive = d;
  for (let i = 0; i < 240; i++) g.update(1 / 30);
  R.render(g);
  ok(d.abe.z < 46 && R.frame.px.some(v => v > 2), 'lincoln gets closer and the chase renders');
  let kicked = 0;
  for (let i = 0; i < 600; i++) { g.update(1 / 30); kicked = Math.max(kicked, d.wrecks.length); if (i % 60 === 0) R.render(g); }
  ok(kicked > 0, 'lincoln kicks wrecks at the car');
  d.key('ArrowRight');
  ok(d.lane === 1, 'arrow keys change lanes');
  d.key('1');
  ok(d.tool === 'steer', 'number keys select tools');
  d.key('6');
  ok(d.tool === 'beacon', 'key 6 selects the beacon');
  d.pointer(300, 50);
  ok(d.hover === 'beacon', 'beacon button hover');
  R.render(g);
  d.selectTool('exit');
  ok(d.kind === 'travel' && d.wrecks.length === 0, 'the chase can be left');
  g.mode = 'room'; g.drive = null;
  g.killTasks();
  g.setRoom('oval');
  const cal = E.panels.calendar(g);
  R.render(g);
  ok(g.mode === 'panel' && R.frame.px.every(v => v), 'calendar panel renders');
  let days = 0;
  for (let dd = 1; dd <= 30; dd++) for (let y = 0; y < 200 && days < dd; y += 2) for (let x = 0; x < 320; x += 2) if (cal.hit(x, y) === dd) { days++; break; }
  ok(days === 30, 'every day of april can be clicked: ' + days);
  ok(Object.keys(E.HOLIDAYS).every(k => Number(k) >= 1 && Number(k) <= 30) && E.HOLIDAYS[26], 'holidays are in april');
  ok(g.drive.key('Escape') && g.mode === 'room' && !g.drive, 'escape closes the calendar');
  idle(g);
  g.f.tikiDated = false; g.f.weeniesDated = false;
  ok(E.budgetRows(g).length === 3, 'budget lists three sites');
  g.f.tikiDated = true; g.f.weeniesDated = true;
  const bud = E.panels.budget(g);
  bud.pointer(100, 70);
  R.render(g);
  ok(bud.rows.length === 5 && bud.hover === 0 && R.frame.px.every(v => v), 'budget panel renders five rows');
  bud.key('Escape');
  g.setRoom('warroom');
  for (const st of [{ beaconTaken: false, beaconOn: false }, { beaconTaken: true, beaconOn: false }, { beaconTaken: true, beaconOn: true }]) {
    Object.assign(g.f, st);
    const tp = E.panels.target(g);
    idle(g);
    ok(tp.list.length === 4 && tp.list[0].id === (st.beaconOn ? 'lincoln' : st.beaconTaken ? 'pocket' : 'bosco'), 'first beacon follows the story');
    for (let i = 0; i < tp.list.length; i++) {
      tp.key('ArrowDown');
      idle(g);
      for (let k = 0; k < 20; k++) g.update(1 / 30);
      R.render(g);
      ok(R.frame.px.every(v => v), 'target panel renders ' + tp.list[tp.sel].id);
    }
    ok(tp.sel === 0, 'arrow keys cycle through the targets');
    tp.key('Escape');
    ok(g.mode === 'room', 'escape closes the target panel');
  }
}

{
  const POS = { office: [150, 166], street: [300, 150], bosco: [100, 172], sybil: [100, 176], lawn: [300, 160], oval: [120, 176], warroom: [40, 150] };
  const STATES = [
    { caseOpen: true, closetOpen: true, lawnSeen: true, knowNumber: true, superHold: true, presMet: true, whizzerIn: true },
    { caseOpen: true, closetOpen: true, lawnSeen: true, presMet: true, whizzerIn: true, chucklesOut: true, puppetDown: true, election: true, maxRuns: true, sybilNumber: true, bugRec: 'lincoln' },
    { caseOpen: true, closetOpen: true, lawnSeen: true, presMet: true, whizzerIn: true, chucklesOut: true, puppetDown: true, election: true, maxRuns: true, elected: true, rampage: true, scandal: true, knowSerum: true, tikiDated: true, war: false, knowBeacon: true }
  ];
  let actions = 0;
  STATES.forEach((st, si) => {
    const g = game(11 + si);
    idle(g);
    g.dialog = null;
    g.killTasks();
    Object.assign(g.f, st);
    for (const id of Object.keys(POS)) {
      const reset = () => { g.mode = 'room'; g.drive = null; g.closeup = null; g.dialog = null; g.hideUI = false; g.setRoom(id); g.place('sam', id, POS[id][0], POS[id][1], 's'); g.fade = 0; g.fadeTo = 0; };
      reset();
      const targets = g.hotspots().map(h => h.id).concat(g.visibleActors().filter(a => g.actorHot(a) && a.id !== 'sam').map(a => a.id));
      for (const t of targets) {
        for (const v of ['look', 'use', 'talk', ...ITEMS]) {
          if (g.roomId !== id || g.mode !== 'room') reset();
          g.inv = ITEMS.slice();
          const verb = ['look', 'use', 'talk'].includes(v) ? v : 'use';
          const item = verb === v ? undefined : v;
          if (g.perform(verb, t, item)) actions++;
          let n = 0;
          while ((g.busy || g.dialog || g.fade > 0.001 || g.mode !== 'room') && n++ < 9000) {
            g.update(1 / 30);
            if (g.dialog && !g.busy) { const ids = g.optionIds(); if (ids.includes('bye')) g.choose('bye'); else if (ids.length) g.choose(ids[ids.length - 1]); else g.endDialog(); }
            if (g.mode !== 'room' && !g.busy) { g.mode = 'room'; g.drive = null; }
          }
          ok(n < 9000, `fuzz ${verb} ${t} ${item || ''} in ${id} state ${si} settles: ` + g.log.slice(-1));
          ok(!g.closeup && !g.hideUI, `fuzz ${verb} ${t} ${item || ''} in ${id} state ${si} leaves no closeup and shows the interface`);
          if (g.ended) g.ended = false;
        }
      }
    }
    ok(!g.log.some(l => l.startsWith('script error')), 'fuzz without script errors: ' + g.log.filter(l => l.startsWith('script error')).slice(0, 3).join(' | '));
  });
  ok(actions > 1500, 'fuzz ran many actions: ' + actions);
}

{
  playthrough(5, { mistakes: true, reload: true });
  playthrough(9, { scandalFirst: true });
  playthrough(22, { reload: true, scandalFirst: true });
}

{
  const SL = String.fromCharCode(47);
  const LINE = SL + SL, BLOCK = SL + '*';
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/sammax104/' + f).concat(['js/apps/sammax104-app.js', 'tests/sammax104.test.js', 'js/apps/sammax/sm-sprites.js', 'js/apps/sammax/sm-sprites2.js', 'js/apps/sammax/sm-audio.js', 'js/apps/sammax/sm-font.js', 'js/apps/sammax/sm-ui.js', 'js/apps/sammax103/mm-sprites.js', 'js/apps/sammax103/mm-room-office.js', 'tools/sammax104-tour.cjs']);
  for (const f of files) {
    const src = read(f);
    ok(!src.includes(LINE) && !src.includes(BLOCK), f + ' has no comments');
  }
  ok(!read('sammax104.html').includes('<!' + '--'), 'page has no comments');
  const html = read('index.html');
  const page = read('sammax104.html');
  let lastA = -1, lastB = -1;
  for (const f of BASE) {
    const needle = `js/apps/sammax/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'engine script order in index.html and sammax104.html: ' + f);
    lastA = ia; lastB = ib;
  }
  for (const f of SHARED) {
    const needle = `js/apps/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'shared art modules come before episode 104: ' + f);
    lastB = ib;
  }
  lastA = html.indexOf('js/apps/sammax103-app.js');
  for (const f of ORDER) {
    const needle = `js/apps/sammax104/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'episode script order in index.html and sammax104.html: ' + f);
    lastA = ia; lastB = ib;
  }
  ok(fs.readdirSync(DIR).filter(f => f.endsWith('.js')).length === ORDER.length, 'every episode module is loaded by the pages');
  ok(html.indexOf('js/apps/sammax104-app.js') > lastA, 'desktop loads the wrapper');
  ok(!page.includes('sammax/sm-room') && !page.includes('sammax103/mm-room') && !page.includes('sammax102/sc-room'), 'standalone page loads only the engine, shared art and episode 104');
  const gm = read('js/game-manager.js');
  const at = gm.indexOf('      sammax104: {');
  const entry = gm.slice(at, at + 2800);
  ok(at > 0 && /steam: true/.test(entry) && /price: 26\.49/.test(entry) && /targetExe: 'SAMMAX4\.EXE'/.test(entry) && /appSamMax104/.test(entry), 'Steam catalog entry');
  ok(/genre: '/.test(entry) && /tags: \[/.test(entry) && /shots: \[/.test(entry), 'Steam entry has genre, tags and screenshot captions');
  ok(!/sammax104Granted/.test(gm), 'no grant flag');
  const loadState = gm.slice(gm.indexOf('loadState'), gm.indexOf('moveGamesToSteam(state)'));
  ok(!/'sammax104'/.test(loadState), 'not preinstalled');
  ok(/id === 'sammax104'/.test(gm), 'readme for the installed game');
  for (const n of [1, 2]) ok(fs.existsSync(path.join(ROOT, 'content/steam/sammax104-' + n + '.jpg')), 'Steam screenshot ' + n);
  ok(read('tools/steam-shots-recipes.cjs').includes('sammax104'), 'Steam screenshot recipe');
  const shell = {
    'js/desktop.js': ["isInstalled('sammax104')", 'appSamMax104'],
    'js/taskbar.js': ["isInstalled('sammax104')", "case 'sammax104'", "showInSteam('sammax104')"],
    'js/apps/dialogs.js': ["cmd === 'sammax104'", "showInSteam(\\'sammax104\\')"],
    'js/apps/explorer.js': ["item.app === 'sammax104'", 'SAMMAX4.EXE'],
    'js/filesystem.js': ["gmInstalled.includes('sammax104')", "'SAMMAX4.EXE'"],
    'js/apps/task-manager.js': ["'app_sammax104'", 'sammax4.exe'],
    'js/icons.js': ["'sammax104': `<svg"],
    'js/apps/clippy.js': ["id.startsWith('app_sammax104')", "launchProgram('sammax104', 'appSamMax104')"],
    'js/apps/steam.js': ["game: 'sammax104'"],
    'js/apps/advanced-site.js': ["id: 'sammax104'"],
    'js/apps/sammax104-app.js': ["id = 'app_sammax104'", 'ep: S.EP104'],
    'tests/steam.test.js': ["'sammax104'"]
  };
  for (const [f, needles] of Object.entries(shell)) {
    const src = read(f);
    for (const n of needles) ok(src.includes(n), `${f} contains ${n}`);
  }
  const clippy = read('js/apps/clippy.js');
  ok(clippy.indexOf("id.startsWith('app_sammax104')") < clippy.indexOf("id.startsWith('app_sammax')"), 'clippy checks episode 104 before episode 101');
  ok((read('js/i18n.js').match(/'app\.sammax104': 'Sam & Max: Abe Lincoln Must Die!'/g) || []).length === 4, 'i18n title in every language');
  ok(read('package.json').includes('"test:sammax104": "node tests/sammax104.test.js"'), 'npm script');
  ok(read('package.json').includes('node tests/sammax104.test.js'), 'full test run includes episode 104');
}

console.log(`sammax104: ${checks} checks passed in ${Date.now() - t0} ms`);
