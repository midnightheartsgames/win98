const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const BASE_DIR = path.join(ROOT, 'js/apps/sammax');
const DIR = path.join(ROOT, 'js/apps/sammax103');
const BASE = ['sm-core', 'sm-paint', 'sm-font', 'sm-sprites', 'sm-sprites2', 'sm-icons', 'sm-bg', 'sm-bg2', 'sm-bg3', 'sm-engine', 'sm-render', 'sm-closeups', 'sm-drive', 'sm-audio', 'sm-ui'];
const ORDER = ['mm-story', 'mm-sprites', 'mm-icons', 'mm-bg', 'mm-bg2', 'mm-closeups', 'mm-games', 'mm-room-office', 'mm-room-street', 'mm-room-bosco', 'mm-room-sybil', 'mm-room-playland', 'mm-room-casino', 'mm-room-backroom', 'mm-room-factory', 'mm-drive'];
let S;
for (const f of BASE) S = require(path.join(BASE_DIR, f + '.js'));
const baseIcons = new Map(Object.entries(S.ICONS));
const baseCostumes = new Map(Object.entries(S.COSTUMES));
const baseThemes = new Set(Object.keys(S.THEMES));
for (const f of ORDER) S = require(path.join(DIR, f + '.js'));
const E = S.EP103;

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
  while ((g.busy || (g.fade > 0.001 && !g.ended) || (g.mode === 'drive' && g.drive && g.drive.kind === 'travel')) && n < (max || 9000)) { g.update(1 / 30); n++; }
  step(g, 3);
  ok(n < (max || 9000), 'game became idle in ' + g.roomId + ' after: ' + g.log.slice(-2).join(' | '));
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
  ok(g.optionIds().includes(id), 'option ' + id + ' in ' + (g.dialog && g.dialog.id) + ': ' + (g.dialog ? g.optionIds().join(',') : ''));
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
  act(g, 'use', g.roomId === 'playland' ? 'exit' : 'desoto');
  ok(g.mode === 'map' && g.drive, 'map opened in ' + g.roomId);
  ok(g.drive.dests().some(([id]) => id === dest), 'destination on the map: ' + dest);
  g.drive.choose(dest);
  let n = 0;
  while (g.mode !== 'room' && n < 3000) { g.update(1 / 30); n++; }
  idle(g);
  ok(g.roomId === E.DEST[dest].room, 'arrived at ' + dest + ', now ' + g.roomId);
}

function street(g) {
  if (g.roomId === 'street') return;
  if (g.roomId === 'office') { go(g, 'edoor', 'street'); return; }
  if (g.roomId === 'bosco') { go(g, 'exit', 'street'); return; }
  if (g.roomId === 'sybil') { go(g, 'door', 'street'); return; }
  if (g.roomId === 'backroom') go(g, 'exit', 'casino');
  if (g.roomId === 'casino') go(g, 'exit', 'playland');
  mapTo(g, 'street');
}

function casino(g) {
  if (g.roomId === 'casino') return;
  if (g.roomId === 'backroom') { go(g, 'exit', 'casino'); return; }
  if (g.roomId !== 'playland') { street(g); mapTo(g, 'casino'); }
  go(g, 'casinodoor', 'casino');
}

function token(g) {
  if (g.has('token') || g.has('tokens')) return;
  if (g.roomId !== 'playland') { if (g.roomId === 'casino') go(g, 'exit', 'playland'); else { street(g); mapTo(g, 'casino'); } }
  if (!g.has('token')) { act(g, 'talk', 'lovey'); choose(g, 'token'); close(g); }
  ok(g.has('token'), 'lovey gave a token');
}

function whack(g, win) {
  ok(g.mode === 'arcade' && g.drive instanceof E.WhackRats, 'arcade started');
  const d = g.drive;
  let n = 0, hits = 0, mutes = 0;
  while (g.mode === 'arcade' && n < 4000) {
    n++;
    g.update(1 / 30);
    if (!win || g.drive !== d) continue;
    for (const r of d.rats) {
      if (r.hit || r.t < 0.2 || r.t > r.life - 0.2) continue;
      if (!r.sing) { mutes++; continue; }
      const h = [104, 160, 216][r.hole % 3], v = 78 + Math.floor(r.hole / 3) * 40;
      d.click(h, v - 8);
      hits++;
    }
  }
  idle(g);
  ok(g.mode === 'room', 'arcade closed');
  if (win) ok(g.has('magnet') && g.f.whackWon && hits >= 20 && mutes > 0, 'twenty singing rats, magnet won');
  else ok(!g.has('magnet'), 'idle player loses the arcade');
}

function poker(g, want) {
  ok(g.dialog && g.dialog.id === 'poker' && g.closeup && g.closeup.kind === 'poker', 'poker closeup and dialog');
  ok(!g.canSave(), 'no saving at the card table');
  const ids = g.optionIds();
  if (ids.includes('draw')) { choose(g, 'draw'); return 'draw'; }
  choose(g, 'askmax');
  ok(g.log.some(l => l.startsWith('max: У тебя на лбу')), 'max reads sam card');
  choose(g, want);
  return want;
}

function mobChase(g) {
  ok(g.mode === 'drive' && g.drive instanceof E.MobChase, 'mob chase started');
  const { PLAYER_Z } = S.driveMath;
  let n = 0, shots = 0, rams = 0;
  while (g.mode === 'drive' && n < 40000) {
    n++;
    g.update(1 / 30);
    const d = g.drive;
    if (!d || d.kind !== 'mob' || d.paused || g.busy) continue;
    if (d.mob.ramT > 0.39) rams++;
    for (const b of d.boards) {
      if (b.fall || b.z < PLAYER_Z + 0.5 || b.z > PLAYER_Z + 4.5 || d.mob.d > 0.38) continue;
      const r = d.boardScreen(b);
      d.shoot((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2);
      shots++;
    }
  }
  idle(g);
  ok(shots >= 2 && rams >= 0, 'the bot dropped billboards on the mob: ' + shots);
  ok(g.roomId === 'backroom' && g.f.chaseWon, 'chase won, back in the back room');
}

function reload(g) {
  ok(g.canSave(), 'can save in ' + g.roomId);
  const state = JSON.parse(JSON.stringify(g.saveState()));
  const h = new S.Game({ seed: state.seed, ep: E });
  E.newGame(h);
  h.loadState(state);
  idle(h);
  ok(h.roomId === g.roomId && JSON.stringify(h.inv) === JSON.stringify(g.inv), 'reload keeps room and inventory');
  for (const [k, v] of Object.entries(g.f)) if (typeof v !== 'object' && k !== 'mugOnDesk' && k !== 'kWait') ok(h.f[k] === v, 'reload keeps flag ' + k);
  return h;
}

function waitMug(g) {
  let n = 0;
  while (!g.f.mugOnDesk && n < 900) { g.update(1 / 30); n++; }
  ok(g.f.mugOnDesk, 'sybil put the mug down');
}

function playthrough(seed, o) {
  o = o || {};
  const cp = g => (o.reload ? reload(g) : g);
  let g = game(seed);
  idle(g);
  ok(g.roomId === 'office' && g.dialog && g.dialog.id === 'commish', 'intro ends with the commissioner');
  ok(g.f.aceInHole && g.f.cardsOnFloor, 'ace slid into the rat hole');
  choose(g, 'mole'); choose(g, 'code'); choose(g, 'bear'); choose(g, 'bomb'); choose(g, 'bye');
  ok(g.f.caseOpen && g.f.knowCode && !g.dialog, 'case opened');
  for (let i = 0; i < 5; i++) act(g, 'use', 'tv');
  ok(g.f.tvDone && g.f.tvSeg === 5, 'tv segments watched');
  act(g, 'use', 'closet');
  ok(g.f.closetOpen && g.hotspots().some(h => h.id === 'wig') && g.hotspots().some(h => h.id === 'mrbear'), 'closet shows the wig and mister bear');
  act(g, 'look', 'mrbear');
  act(g, 'use', 'mrbear');
  talk(g, 'hole', ['ace', 'job', 'mob']);
  ok(g.f.knowAce && !g.has('ace'), 'jimmy keeps the ace');
  go(g, 'edoor', 'street');
  mapTo(g, 'casino');
  ok(g.f.casinoSeen && g.has('token'), 'lovey greeted with a token');
  talk(g, 'lovey', ['who', 'mafia', 'ted', 'code', 'look']);
  if (o.mistakes) {
    act(g, 'use', 'whack');
    whack(g, false);
    token(g);
  }
  act(g, 'use', 'whack');
  whack(g, true);
  token(g);
  act(g, 'use', 'pit');
  g = cp(g);
  go(g, 'casinodoor', 'casino');
  talk(g, 'leonard', ['who', 'rules', 'code']);
  ok(g.f.metLeonard && g.f.pokerRules, 'leonard met');
  for (let round = 0; round < 6 && !g.f.pokerLost; round++) {
    token(g);
    casino(g);
    act(g, 'talk', 'leonard');
    choose(g, 'play');
    idle(g);
    poker(g, o.mistakes ? 'bet' : 'fold');
  }
  ok(g.f.pokerLost && g.f.knowTell, 'leonard always wins, sam noticed the glance');
  act(g, 'look', 'nose');
  ok(g.f.noseSeen, 'the nose is a mirror');
  act(g, 'talk', 'guard');
  for (const id of ['sesame', 'word', 'code', 'who']) choose(g, id);
  close(g);
  ok(g.f.guardMet && !g.f.passwordKnown, 'guard wants the password');
  token(g);
  casino(g);
  act(g, 'use', 'slot');
  ok(g.f.chucklesWhisper && g.actors.chuckles.room === 'backroom', 'chuckles whispered the password');
  token(g);
  street(g);
  go(g, 'officedoor', 'office');
  if (o.mistakes) { act(g, 'use', 'hole', 'gun'); ok(!g.has('ace'), 'shooting the hole gives nothing'); }
  act(g, 'use', 'hole', 'token');
  ok(g.has('ace') && g.f.aceGot, 'ace bought back from jimmy');
  g = cp(g);
  go(g, 'edoor', 'street');
  mapTo(g, 'casino');
  go(g, 'casinodoor', 'casino');
  act(g, 'use', 'nose', 'ace');
  ok(g.f.aceOnNose && !g.has('ace'), 'ace on the nose');
  token(g);
  casino(g);
  act(g, 'talk', 'leonard');
  choose(g, 'play');
  idle(g);
  poker(g, 'bet');
  ok(g.f.pokerWon && g.has('tokens'), 'ten million tokens');
  g = cp(g);
  street(g);
  go(g, 'boscodoor', 'bosco');
  act(g, 'use', 'bosco', 'tokens');
  ok(!g.f.bugBought, 'bosco sells only after the offer');
  talk(g, 'bosco', ['who', 'why', 'ads', 'sell', 'code', 'french']);
  ok(g.f.knowBug && g.f.knowADS, 'bug and anti delivery system known');
  act(g, 'talk', 'bosco');
  choose(g, 'buy');
  close(g);
  ok(g.f.bugBought && g.has('roach') && !g.has('tokens'), 'bug bought');
  act(g, 'look', 'roach');
  if (o.mistakes) { act(g, 'use', 'bosco', 'roach'); ok(g.has('roach') && g.f.bugRec === 'bosco', 'bug eavesdropped on bosco and came back'); }
  go(g, 'exit', 'street');
  mapTo(g, 'casino');
  go(g, 'casinodoor', 'casino');
  act(g, 'use', 'guard', 'roach');
  ok(g.f.bugPlaced && !g.has('roach'), 'bug hidden under the buffet');
  if (o.mistakes) {
    act(g, 'use', 'buffet');
    ok(!g.f.bugPlaced && g.has('roach'), 'bug recalled');
    act(g, 'use', 'buffet', 'roach');
    ok(g.f.bugPlaced, 'bug placed again');
  }
  if (!g.has('token') && !g.has('tokens')) { go(g, 'exit', 'playland'); token(g); go(g, 'casinodoor', 'casino'); }
  act(g, 'use', 'slot');
  ok(g.f.passwordKnown && g.has('roach'), 'bug heard the password');
  act(g, 'talk', 'guard');
  choose(g, 'pass');
  idle(g);
  ok(g.roomId === 'backroom' && g.f.backroom, 'in the back room');
  ok(g.dialog && g.dialog.id === 'chuckles', 'chuckles greets');
  choose(g, 'don'); choose(g, 'bears'); choose(g, 'myra'); choose(g, 'code'); choose(g, 'join');
  close(g);
  ok(g.f.joined && g.f.meatStolen && g.has('bearbox'), 'three assignments, bear box received');
  ok(g.actors.leonard.room === 'nowhere' && g.actors.cuddly.room === 'street', 'leonard gone, cuddly watches bosco');
  act(g, 'look', 'monitors');
  ok(g.f.sawCam && !g.closeup, 'monitors watched');
  g = cp(g);
  go(g, 'exit', 'casino');
  act(g, 'use', 'slot');
  ok(!g.f.meatDone, 'armless bandit');
  street(g);
  go(g, 'sybildoor', 'sybil');
  talk(g, 'sybil', ['job', 'trial', 'nerves', 'fake', 'cactus', 'code']);
  if (o.mistakes) { act(g, 'use', 'cactus', 'max'); ok(!g.f.webcamEaten, 'max waits for the murder'); }
  waitMug(g);
  act(g, 'use', 'mug');
  ok(g.has('mug') && g.f.mugTaken, 'mug taken');
  go(g, 'door', 'street');
  go(g, 'boscodoor', 'bosco');
  act(g, 'use', 'condiments', 'mug');
  ok(g.has('kmug'), 'ketchup mug');
  if (o.mistakes) {
    act(g, 'use', 'cafe', 'bearbox');
    ok(g.has('bearbox') && !g.f.boscoDone, 'bosco refuses the box');
    act(g, 'talk', 'bosco');
    choose(g, 'mafia');
    close(g);
    ok(g.vt.boscoWatching && g.actors.bosco.act === 'watch', 'bosco watches cuddly');
    act(g, 'use', 'cafe', 'bearbox');
    ok(g.has('bearbox') && !g.f.boscoDone, 'the anti delivery system throws the box out');
    act(g, 'use', 'camera', 'magnet');
    ok(g.f.cameraOut && !g.has('magnet'), 'camera thrown out with the magnet');
  } else {
    act(g, 'use', 'camera', 'magnet');
    ok(g.f.cameraOut, 'camera thrown out');
    act(g, 'use', 'cafe', 'bearbox');
    ok(!g.f.boscoDone && g.has('bearbox'), 'bosco sees the box');
    act(g, 'talk', 'bosco');
    choose(g, 'mafia');
    close(g);
  }
  act(g, 'use', 'cafe', 'bearbox');
  ok(g.f.boscoDone && !g.has('bearbox') && g.actors.cuddly.room === 'casino', 'bear delivered, cuddly back at the table');
  g = cp(g);
  go(g, 'exit', 'street');
  ok(g.actors.cuddly.room !== 'street', 'cuddly left the street');
  go(g, 'sybildoor', 'sybil');
  act(g, 'use', 'desk', 'kmug');
  ok(g.f.mugBack && !g.has('kmug'), 'ketchup mug back on the desk');
  if (o.mistakes) {
    let n = 0;
    while (g.f.mugBack && n < 2400) { g.update(1 / 30); n++; }
    idle(g);
    ok(!g.f.mugBack && !g.f.mugFilled && g.f.mugOnDesk, 'sybil drank the ketchup, mug empty again');
    act(g, 'use', 'mug', 'gun');
    ok(!g.f.sybilFaked, 'an empty mug is no murder');
    waitMug(g);
    act(g, 'use', 'mug');
    go(g, 'door', 'street');
    go(g, 'boscodoor', 'bosco');
    act(g, 'use', 'condiments', 'mug');
    go(g, 'exit', 'street');
    go(g, 'sybildoor', 'sybil');
    act(g, 'use', 'sybil', 'kmug');
    ok(g.f.mugBack, 'mug back again');
  }
  act(g, 'use', 'mug', 'gun');
  ok(g.f.sybilFaked && g.actors.sybil.act === 'dead', 'sybil faked her death');
  ok(!g.canSave() || g.roomId === 'sybil', 'still in the office of sybil');
  act(g, 'use', 'door');
  ok(g.roomId === 'sybil', 'max stops sam before the webcam is gone');
  act(g, 'use', 'cactus', 'max');
  ok(g.f.webcamEaten && g.f.sybilDone, 'max ate the webcam');
  g = cp(g);
  go(g, 'door', 'street');
  go(g, 'officedoor', 'office');
  ok(g.f.leonardHere && g.dialog && g.dialog.id === 'holdup', 'leonard holds us up in the office');
  choose(g, 'why'); choose(g, 'code'); choose(g, 'eat');
  choose(g, 'cap');
  ok(g.f.leonardCaught && g.has('capgun') && g.dialog && g.dialog.id === 'leonard2', 'max caught leonard');
  choose(g, 'where');
  choose(g, 'mama');
  ok(g.dialog && g.dialog.id === 'yomama', 'yo mama battle');
  if (o.mistakes) { choose(g, 's_fat'); choose(g, 'e_old'); ok(!g.f.leonardTalked, 'wrong punchline'); }
  for (const k of ['old', 'stingy', 'short', 'rude']) { choose(g, 's_' + k); choose(g, 'e_' + k); }
  idle(g);
  ok(g.f.leonardTalked && g.has('arm') && g.f.leonardCloset && g.actors.leonard.room === 'nowhere', 'leonard confessed and sits in the closet');
  ok(g.hotspots().some(h => h.id === 'leocloset'), 'leonard visible in the closet');
  g = cp(g);
  go(g, 'edoor', 'street');
  mapTo(g, 'casino');
  go(g, 'casinodoor', 'casino');
  act(g, 'use', 'slot', 'arm');
  ok(g.f.armBack && !g.has('arm'), 'arm back on the bandit');
  if (!g.has('token') && !g.has('tokens')) { go(g, 'exit', 'playland'); token(g); go(g, 'casinodoor', 'casino'); }
  act(g, 'use', 'slot');
  ok(g.f.meatDone, 'sandwich won from the bandit');
  g = cp(g);
  act(g, 'use', 'backdoor');
  idle(g);
  ok(g.f.inducted && g.actors.ted.v === '' && g.f.maxSandwich, 'the don is the mole, max took the sandwich');
  mobChase(g);
  act(g, 'use', 'sinister');
  ok(g.roomId === 'factory' && g.f.fac === 'hypno' && g.f.frozen, 'factory, fake hypnosis');
  ok(!g.canSave(), 'no saving in the factory');
  act(g, 'use', 'lever');
  ok(g.f.fac === 'hypno', 'lever blocked during the test');
  if (o.mistakes) { act(g, 'use', 'max', 'gun'); ok(g.f.fac === 'hypno', 'sam will not use the real gun'); }
  act(g, 'use', 'max', 'capgun');
  ok(g.f.fac === 'free' && g.actors.max.act === 'dead' && !g.f.frozen, 'max played dead');
  act(g, 'use', 'screwdriver');
  ok(g.has('screwdriver'), 'screwdriver');
  act(g, 'use', 'bandit', 'screwdriver');
  ok(g.f.boxOut, 'voice box out');
  act(g, 'use', 'bandit');
  ok(g.has('voicebox'), 'voice box taken');
  if (o.mistakes) { act(g, 'use', 'lever'); ok(g.f.fac === 'free', 'lever without a panicking don'); }
  act(g, 'use', 'hopper', 'voicebox');
  ok(g.f.bearReady && g.hotspots().some(h => h.id === 'dropbear'), 'fire bear fell off the belt');
  act(g, 'use', 'dropbear');
  ok(g.has('firebear'), 'fire bear taken');
  act(g, 'use', 'ted', 'firebear');
  ok(g.f.fac === 'panic', 'the don thinks he is on fire');
  act(g, 'use', 'lever');
  idle(g, 20000);
  ok(g.ended && g.roomId === 'office' && g.f.factoryGone, 'factory exploded, ending in the office');
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
  const ENTRY = { office: [284, 162], street: [300, 150], bosco: [36, 172], sybil: [40, 170], playland: [44, 172], casino: [30, 172], backroom: [34, 170], factory: [440, 176] };
  for (const [id, [ex, ey]] of Object.entries(ENTRY)) {
    g.setRoom(id);
    g.f.frozen = false;
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
  Object.assign(g.f, { closetOpen: true, bearReady: true, meatStolen: true, boxOut: true });
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
  for (const [id, fn] of Object.entries(S.ICONS)) { const b = fn(); ok(b && b.px.some(v => v), 'icon draws ' + id); }
  for (const [id, fn] of baseIcons) ok(S.ICONS[id] === fn, 'episode 103 keeps the shared icon ' + id);
  for (const [id, cos] of baseCostumes) ok(S.COSTUMES[id] === cos, 'episode 103 keeps the shared costume ' + id);
  const convs = Object.entries(E.TALK);
  for (const [id, conv] of convs) {
    if (typeof conv.options === 'function') continue;
    const ids = conv.options.map(o => o.id);
    ok(new Set(ids).size === ids.length, 'unique option ids in ' + id);
    ok(conv.options.some(o => o.end), 'conversation can end ' + id);
    for (const o of conv.options) ok(o.text && S.ICONS[o.icon], 'option has text and icon ' + id + '.' + o.id);
  }
  g.f.pokerRound = { leo: { r: 3, s: 'h' }, sam: { r: 7, s: 's' }, bets: true };
  g.dialog = { id: 'yomama', data: {} };
  for (const [id, conv] of convs) {
    if (typeof conv.options !== 'function') continue;
    for (const data of [{}, { start: 'fat' }, { hits: ['fat'] }]) {
      const d = { id, data };
      const list = conv.options(g, d);
      ok(list.length > 0, 'dynamic conversation has options ' + id);
      for (const o of list) ok(o.text && S.ICONS[o.icon], 'dynamic option has text and icon ' + id + '.' + o.id);
    }
  }
  g.dialog = null;
  const suspects = ['lovey', 'leonard', 'cuddly', 'guard', 'chuckles', 'banda', 'sybil', 'holdup', 'cuddlyout'];
  for (const id of suspects) ok(E.TALK[id].options && (typeof E.TALK[id].options === 'function' ? E.TALK[id].options(g, { data: {} }) : E.TALK[id].options).some(o => o.text === E.CODE), 'code phrase can be asked: ' + id);
  for (const id of ['mobster', 'ted', 'leonard', 'banda', 'witness', 'roach', 'hbear', 'mobcar']) {
    for (const pose of [{ dir: 'e' }, { dir: 'w', walk: 0.25 }, { dir: 's', talk: 1 }, { v: 'lovey', act: 'deal' }, { v: 'cuddly', act: 'read' }, { v: 'guard', act: 'block' }, { v: 'chuckles', act: 'whisper' }, { v: 'masked', act: 'gun' }, { act: 'hypno', t: 1 }, { act: 'panic', t: 1 }, { act: 'sucked' }, { act: 'unmask' }, { act: 'sit' }, { act: 'tied', v: 'r3' }, { act: 'closet' }, { act: 'aim' }, { act: 'watch' }, { act: 'up' }, { act: 'drink' }, { act: 'dead', v: 'ketchup' }, { act: 'jitter', t: 2 }, { act: 'salute' }, { act: 'spin', t: 1 }, { v: 'topless', frame: 1 }]) {
      const s = S.sprite(id, pose, 1);
      ok(s && s.buf.px.some(v => v), 'sprite renders ' + id + ' ' + JSON.stringify(pose));
    }
  }
  ok(S.sprite('max', { act: 'dead' }, 1).buf.px.some(v => v), 'max plays dead');
  for (const who of ['lovey', 'cuddly', 'guard', 'chuckles', 'ted', 'harry', 'leonard', 'banda', 'roach', 'hbear']) ok(S.art103.portrait(who).px.some(v => v), 'portrait ' + who);
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
  ok(strings > 900, 'found the game texts: ' + strings);
  ok(missing.size === 0, 'font covers every text character: ' + [...missing].slice(0, 10).join(', '));
}

{
  const R = new S.Renderer();
  const g = game(3);
  for (let i = 0; i < 90; i++) g.update(1 / 30);
  ok(g.closeup && g.closeup.kind === 'titlecard3' && g.fade < 0.5, 'title card is visible');
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
  for (const id of Object.keys(E.ROOMS)) {
    g.setRoom(id);
    g.fade = 0; g.fadeTo = 0;
    R.render(g);
    ok(R.frame.px.some(v => v > 2), 'room renders ' + id);
  }
  g.setRoom('office');
  for (const prog of ['ad', 'news', 'meatball', 'champ', 'rerun']) for (const t of [0.2, 3]) { g.closeup = { kind: 'tv3', prog, t0: g.time - t }; R.render(g); ok(R.frame.px.some(v => v > 2), 'tv programme ' + prog); }
  for (const cu of [{ kind: 'poker', leo: { r: 2, s: 'h' }, sam: { r: 9, s: 'c' }, glance: 0.1, reveal: true }, { kind: 'slot', meat: true }, { kind: 'slot', meat: false }, { kind: 'monitors', hi: 3 }, { kind: 'boom' }, { kind: 'titlecard3', lines: ['A', 'B', 'C'] }]) {
    for (const t of [0.3, 1.5, 3]) { g.closeup = Object.assign({ t0: g.time - t }, cu); R.render(g); ok(R.frame.px.some(v => v > 2), 'closeup ' + cu.kind + ' at ' + t); }
  }
  g.closeup = null;
  const f = new S.Buf(320, 200);
  E.TITLE.draw(f, 1, 0, [true, false, true, true, false]);
  ok(E.TITLE.hit(40, 100) === 0 && E.TITLE.hit(40, 156) === 4 && E.TITLE.hit(300, 10) === -1, 'title menu hit test');
  ok(E.CREDITS.length > 10 && E.SAVE_KEY === 'sammax103_saves' && E.SET_KEY === 'sammax103_settings' && E.TITLE_MUSIC === 'title3', 'episode descriptor');
  for (const th of ['title3', 'playland', 'casino', 'mob', 'bosco3', 'factory', 'mobchase', 'credits3']) ok(S.THEMES[th] && baseThemes.has(th), 'music theme ' + th);
  for (const r of Object.values(E.ROOMS)) ok(S.THEMES[typeof r.music === 'function' ? r.music(g) : r.music], 'room music exists ' + r.id);
  const m = new S.MapScreen(g);
  g.mode = 'map'; g.drive = m;
  R.render(g);
  ok(m.hit(96, 118) === 'street' && m.hit(236, 64) === null && m.hit(184, 118) === null, 'map shows only known places');
  g.f.caseOpen = true; g.f.inducted = true;
  ok(m.hit(236, 64) === 'casino' && m.hit(184, 118) === 'chase', 'map opens the casino and the chase');
  g.mode = 'room'; g.drive = null;
  const d = new E.MobChase(g);
  g.mode = 'drive'; g.drive = d;
  for (let i = 0; i < 240; i++) g.update(1 / 30);
  R.render(g);
  ok(d.boards.length > 0 && d.mob.d < 0.95, 'billboards appear, the mob closes in');
  ok(d.tool === 'gun', 'the chase starts with the gun selected');
  let clicked = null;
  for (let i = 0; i < 2400 && !clicked; i++) {
    g.update(1 / 30);
    const near = d.boards.find(b => !b.fall && b.z > S.driveMath.PLAYER_Z + 0.5 && b.z < S.driveMath.PLAYER_Z + 4.5);
    if (!near || g.busy) continue;
    const r = d.boardScreen(near);
    d.click((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, 0);
    clicked = near;
  }
  ok(clicked && clicked.fall > 0 && clicked.where === 'behind', 'a click on a billboard overhead drops it behind the car');
  idle(g);
  d.key('ArrowRight');
  ok(d.lane === 1, 'arrow keys change lanes');
  d.selectTool('exit');
  ok(g.mode === 'drive' && d.kind === 'mob', 'cannot leave the chase');
  const w = new E.WhackRats(g);
  g.mode = 'arcade'; g.drive = w;
  for (let i = 0; i < 60; i++) g.update(1 / 30);
  R.render(g);
  ok(w.rats.length > 0 && R.frame.px.some(v => v > 2), 'arcade renders rats');
  w.key('Escape');
  idle(g);
  ok(g.mode === 'room' && !g.drive, 'escape leaves the arcade');
}

{
  const g = game(11);
  idle(g);
  g.dialog = null;
  const give = ['max', 'gun', 'token', 'tokens', 'ace', 'magnet', 'roach', 'bearbox', 'mug', 'kmug', 'capgun', 'arm', 'screwdriver', 'voicebox', 'firebear'];
  Object.assign(g.f, { caseOpen: true, casinoSeen: true, backroom: true, joined: true, meatStolen: true, knowBug: true });
  let actions = 0;
  const POS = { office: [150, 166], street: [300, 150], bosco: [100, 172], sybil: [100, 176], playland: [220, 176], casino: [120, 176], backroom: [90, 176] };
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
        while ((g.busy || g.dialog || g.fade > 0.001 || g.mode !== 'room') && n++ < 6000) {
          g.update(1 / 30);
          if (g.dialog && !g.busy) { const ids = g.optionIds(); if (ids.includes('bye')) g.choose('bye'); else if (ids.includes('stop')) g.choose('stop'); else if (ids.length) g.choose(ids[ids.length - 1]); else g.endDialog(); }
          if (g.mode !== 'room' && !g.busy) { g.mode = 'room'; g.drive = null; }
        }
        ok(n < 6000, `fuzz ${verb} ${t} ${item || ''} in ${id} settles`);
        if (g.ended) g.ended = false;
      }
    }
  }
  ok(actions > 1000, 'fuzz ran many actions: ' + actions);
  ok(!g.log.some(l => l.startsWith('script error')), 'fuzz without script errors: ' + g.log.filter(l => l.startsWith('script error')).slice(0, 3).join(' | '));
}

{
  playthrough(5, { mistakes: true, reload: true });
  playthrough(9, {});
  playthrough(21, { reload: true });
}

{
  const bad = [];
  const FLOAT_MAX = 3.4028234663852886e38;
  const number = (v, what) => { if (typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > FLOAT_MAX) bad.push(what + ' ' + v); };
  const param = (name, limit) => {
    let value = 1;
    const check = (v, t) => {
      number(v, name);
      if (limit && Math.abs(v) > limit) bad.push(name + ' out of range ' + v);
      if (t !== undefined) { number(t, name + ' time'); if (t < 0) bad.push(name + ' time is negative'); }
    };
    const p = {
      setValueAtTime: check,
      linearRampToValueAtTime: check,
      exponentialRampToValueAtTime(v, t) { check(v, t); if (v === 0) bad.push(name + ' exponential ramp to zero'); },
      cancelScheduledValues() {}
    };
    Object.defineProperty(p, 'value', { get: () => value, set: v => { check(v); value = v; } });
    return p;
  };
  const node = extra => Object.assign({ connect() {}, disconnect() {}, start(t) { number(t, 'start time'); }, stop(t) { number(t, 'stop time'); } }, extra);
  class FakeAudioContext {
    constructor() { this.currentTime = 0; this.state = 'running'; this.sampleRate = 4000; this.destination = node({}); }
    createGain() { return node({ gain: param('gain') }); }
    createOscillator() { return node({ frequency: param('oscillator frequency', 22050), detune: param('detune') }); }
    createBiquadFilter() { return node({ frequency: param('filter frequency', 22050), Q: param('filter Q') }); }
    createBufferSource() { return node({ playbackRate: param('playback rate', 16) }); }
    createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; }
    createDynamicsCompressor() { return node({}); }
    resume() {}
    close() {}
  }
  const realTimeout = globalThis.setTimeout;
  globalThis.window = { AudioContext: FakeAudioContext };
  globalThis.setTimeout = fn => { fn(); return 0; };
  const audio = new S.Audio();
  ok(audio.init() && audio.ctx instanceof FakeAudioContext, 'audio starts on a fake context');
  for (const [id, th] of Object.entries(S.THEMES)) {
    audio.music(id);
    const loop = th.prog.length * 8 * (30 / th.bpm) * 1.2;
    const end = audio.ctx.currentTime + loop * 2 + 1;
    while (audio.ctx.currentTime < end) { audio.ctx.currentTime += 0.05; audio.update(); }
    ok(audio.theme === id && audio.step >= th.prog.length * 8, 'theme ' + id + ' played two full progressions');
    ok(bad.length === 0, 'theme ' + id + ' schedules only valid sound: ' + bad.slice(0, 3).join('; '));
    bad.length = 0;
  }
  const effects = [...new Set([...read('js/apps/sammax/sm-audio.js').matchAll(/case '(\w+)':/g)].map(m => m[1]))];
  ok(effects.length > 60, 'sound effects found: ' + effects.length);
  for (const id of effects.concat(['no-such-effect'])) {
    audio.sfx(id);
    ok(bad.length === 0, 'effect ' + id + ' schedules only valid sound: ' + bad.slice(0, 3).join('; '));
    bad.length = 0;
  }
  globalThis.setTimeout = realTimeout;
  delete globalThis.window;
}

{
  const calls = [];
  const ui = Object.create(S.UI.prototype);
  const broken = { sfx() { calls.push('sfx'); throw new Error('broken sound'); }, music() { calls.push('music'); }, update() { calls.push('update'); throw new Error('broken music'); } };
  const g = game(4);
  idle(g);
  g.sfx('door');
  const realError = console.error;
  const reported = [];
  console.error = e => reported.push(e);
  Object.assign(ui, { t: 0, g, screen: 'game', menu: null, paused: false, audio: broken, lastRoom: g.roomId, ep: E });
  ui.step(1 / 30);
  ui.step(1 / 30);
  console.error = realError;
  ok(calls.includes('sfx') && calls.filter(c => c === 'update').length === 2, 'the frame keeps stepping when sound throws');
  ok(g.events.length === 0 && reported.length === 1 && ui.soundFailed, 'a sound failure is reported once and its events are dropped');
}

{
  const SL = String.fromCharCode(47);
  const LINE = SL + SL, BLOCK = SL + '*';
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/sammax103/' + f).concat(['js/apps/sammax103-app.js', 'tests/sammax103.test.js', 'js/apps/sammax/sm-sprites.js', 'js/apps/sammax/sm-audio.js']);
  for (const f of files) {
    const src = read(f);
    ok(!src.includes(LINE) && !src.includes(BLOCK), f + ' has no comments');
  }
  ok(!read('sammax103.html').includes('<!' + '--'), 'page has no comments');
  const html = read('index.html');
  const page = read('sammax103.html');
  let lastA = -1, lastB = -1;
  for (const f of BASE) {
    const needle = `js/apps/sammax/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'engine script order in index.html and sammax103.html: ' + f);
    lastA = ia; lastB = ib;
  }
  for (const f of ORDER) {
    const needle = `js/apps/sammax103/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'episode script order in index.html and sammax103.html: ' + f);
    lastA = ia; lastB = ib;
  }
  ok(fs.readdirSync(DIR).filter(f => f.endsWith('.js')).length === ORDER.length, 'every episode module is loaded by the pages');
  ok(html.indexOf('js/apps/sammax103-app.js') > lastA, 'desktop loads the wrapper');
  ok(!page.includes('sammax102/') && !page.includes('sammax/sm-room'), 'standalone page loads only the engine and episode 103');
  const gm = read('js/game-manager.js');
  const at = gm.indexOf('      sammax103: {');
  const entry = gm.slice(at, at + 2600);
  ok(at > 0 && /steam: true/.test(entry) && /price: 25\.49/.test(entry) && /targetExe: 'SAMMAX3\.EXE'/.test(entry) && /appSamMax103/.test(entry), 'Steam catalog entry');
  ok(!/sammax103Granted/.test(gm), 'no grant flag');
  const loadState = gm.slice(gm.indexOf('loadState'), gm.indexOf('moveGamesToSteam(state)'));
  ok(!/'sammax103'/.test(loadState), 'not preinstalled');
  ok(/id === 'sammax103'/.test(gm), 'readme for the installed game');
  const shell = {
    'js/desktop.js': ["isInstalled('sammax103')", 'appSamMax103'],
    'js/taskbar.js': ["isInstalled('sammax103')", "case 'sammax103'", "showInSteam('sammax103')"],
    'js/apps/dialogs.js': ["cmd === 'sammax103'", "showInSteam(\\'sammax103\\')"],
    'js/apps/explorer.js': ["item.app === 'sammax103'", 'SAMMAX3.EXE'],
    'js/filesystem.js': ["gmInstalled.includes('sammax103')", "'SAMMAX3.EXE'"],
    'js/apps/task-manager.js': ["'app_sammax103'", 'sammax3.exe'],
    'js/icons.js': ["'sammax103': `<svg"],
    'js/apps/clippy.js': ["id.startsWith('app_sammax103')", "launchProgram('sammax103', 'appSamMax103')"],
    'js/apps/steam.js': ["game: 'sammax103'"],
    'js/apps/advanced-site.js': ["id: 'sammax103'"],
    'js/apps/sammax103-app.js': ["id = 'app_sammax103'", 'ep: S.EP103'],
    'tests/steam.test.js': ["'sammax103'"]
  };
  for (const [f, needles] of Object.entries(shell)) {
    const src = read(f);
    for (const n of needles) ok(src.includes(n), `${f} contains ${n}`);
  }
  const clippy = read('js/apps/clippy.js');
  ok(clippy.indexOf("id.startsWith('app_sammax103')") < clippy.indexOf("id.startsWith('app_sammax')"), 'clippy checks episode 103 before episode 101');
  ok((read('js/i18n.js').match(/'app\.sammax103': 'Sam & Max: The Mole, the Mob and the Meatball'/g) || []).length === 4, 'i18n title in every language');
  ok(read('package.json').includes('"test:sammax103": "node tests/sammax103.test.js"'), 'npm script');
  ok(read('package.json').includes('node tests/sammax103.test.js'), 'full test run includes episode 103');
}

console.log(`sammax103: ${checks} checks passed in ${Date.now() - t0} ms`);
