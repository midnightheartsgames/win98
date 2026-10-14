const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const BASE_DIR = path.join(ROOT, 'js/apps/sammax');
const DIR = path.join(ROOT, 'js/apps/sammax105');
const BASE = ['sm-core', 'sm-paint', 'sm-font', 'sm-sprites', 'sm-sprites2', 'sm-icons', 'sm-bg', 'sm-bg2', 'sm-bg3', 'sm-engine', 'sm-render', 'sm-closeups', 'sm-drive', 'sm-audio', 'sm-ui'];
const SHARED = ['sammax102/sc-sprites', 'sammax103/mm-sprites', 'sammax103/mm-icons', 'sammax104/al-sprites'];
const ORDER = ['rt-story', 'rt-sprites', 'rt-sprites2', 'rt-icons', 'rt-bg', 'rt-bg2', 'rt-closeups', 'rt-games', 'rt-room-office', 'rt-room-street', 'rt-room-bosco', 'rt-room-sybil', 'rt-room-leftys', 'rt-net'];
let S;
for (const f of BASE) S = require(path.join(BASE_DIR, f + '.js'));
const baseThemes = new Set(Object.keys(S.THEMES));
for (const f of SHARED) S = require(path.join(ROOT, 'js/apps', f + '.js'));
const sharedIcons = new Map(Object.entries(S.ICONS));
const sharedCostumes = new Map(Object.entries(S.COSTUMES));
for (const f of ORDER) S = require(path.join(DIR, f + '.js'));
const E = S.EP105;
const REAL_NAMES = new RegExp(['Micro' + 'soft', 'Win' + 'dows'].join('|'));
const ITEMS = ['max', 'gun', 'roach', 'glove', 'ratcannon', 'chip', 'goggles', 'binoc', 'hanky', 'coins', 'sword', 'slime', 'sword2', 'jack', 'paint'];
const PAIRS = [['office', 'office2'], ['street', 'street2'], ['bosco', 'bosco2'], ['sybil', 'sybil2'], ['leftys', 'control']];
const VR_ROOMS = ['office2', 'street2', 'bosco2', 'sybil2', 'control', 'roof2'];
const ENTRY = { office: [284, 162], office2: [284, 162], street: [423, 146], street2: [423, 146], roof2: [120, 172], bosco: [36, 172], bosco2: [36, 172], sybil: [40, 170], sybil2: [40, 170], leftys: [64, 164], control: [64, 164] };

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
  ok(n < (max || 14000), 'game became idle in ' + g.roomId + ' after: ' + g.log.slice(-2).join(' | '));
  ok(!g.log.some(l => l.startsWith('script error')), 'no script errors: ' + g.log.filter(l => l.startsWith('script error')).join(' | '));
  return n;
}

function act(g, verb, target, item) {
  idle(g);
  const r = g.perform(verb, target, item);
  ok(r, `perform ${verb} ${target} ${item || ''} in ${g.roomId} busy=${g.busy} dlg=${g.dialog && g.dialog.id} mode=${g.mode} hot=${g.hotspots().map(h => h.id).join(',')}`);
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

const has = (g, id) => g.hotspots().some(h => h.id === id);

function hint(g, re, msg) {
  const h = E.maxHint(g);
  ok(typeof h === 'string' && h.length > 20 && re.test(h), 'hint of max ' + msg + ': ' + h);
}

const DOORS = { office: 'edoor', office2: 'edoor', bosco: 'exit', bosco2: 'exit', sybil: 'door', sybil2: 'door', leftys: 'door', control: 'door', roof2: 'down' };
const STREET_DOOR = { office: 'officedoor', office2: 'officedoor', bosco: 'boscodoor', bosco2: 'boscodoor', sybil: 'sybildoor', sybil2: 'sybildoor', leftys: 'leftydoor', control: 'pultdoor' };

function travel(g, room) {
  if (g.roomId === room) return;
  const street = g.f.vr ? 'street2' : 'street';
  if (g.roomId !== street) go(g, DOORS[g.roomId], street);
  if (room !== street) go(g, STREET_DOOR[room], room);
  ok(g.roomId === room, 'travelled to ' + room + ', now ' + g.roomId);
}

function goggles(g, room) {
  act(g, 'use', 'hud');
  ok(g.roomId === room, 'goggles switched the world to ' + room + ', now ' + g.roomId);
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
  return h;
}

function clickBank(g, bank, kind, id) {
  idle(g);
  for (let y = 0; y < 200; y += 2) for (let x = 0; x < 320; x += 2) {
    const h = bank.hit(x, y);
    if (!h || h.kind !== kind || h.id !== id) continue;
    bank.pointer(x, y);
    bank.click(x, y, 0);
    idle(g);
    return;
  }
  ok(false, 'bank control not found: ' + kind + ' ' + id);
}

function text(g, t, path) {
  for (const id of path) {
    let n = 0;
    while (t.typing() && n++ < 50) t.click(0, 0, 0);
    const opts = t.options();
    const i = opts.findIndex(o => o.id === id);
    ok(i >= 0, 'text option ' + id + ' among ' + opts.map(o => o.id).join(','));
    const r = t.optRect(i);
    t.pointer(r.x + 4, r.y + 4);
    ok(t.hover === i, 'text option hover ' + id);
    t.click(r.x + 4, r.y + 4, 0);
    g.update(1 / 30);
  }
}

function playthrough(seed, o) {
  o = o || {};
  const cp = g => (o.reload ? reload(g) : g);
  let g = game(seed);
  idle(g);
  ok(g.roomId === 'office' && g.dialog && g.dialog.id === 'commish', 'intro ends with the commissioner');
  for (const id of o.mistakes ? ['what', 'where', 'people', 'war'] : ['where']) choose(g, id);
  choose(g, 'bye');
  ok(g.f.caseOpen && !g.dialog, 'case opened');
  hint(g, /Сибил/, 'sends sam to sybil first');
  ok(!has(g, 'hud') && !g.has('goggles'), 'no goggles at the start');
  act(g, 'use', 'closet');
  for (const id of ['mrbear', 'preshead', 'leocloset', 'capgun', 'glove']) ok(has(g, id), 'closet keeps the evidence of earlier cases: ' + id);
  if (o.mistakes) {
    for (const id of ['mrbear', 'preshead', 'leocloset', 'capgun']) { act(g, 'look', id); act(g, 'use', id); }
    act(g, 'talk', 'leocloset');
    for (let i = 0; i < 5; i++) act(g, 'use', 'tv');
    ok(g.f.tvDone && g.f.knowSite && g.f.tvSeg === 5 && !g.closeup, 'tv programmes watched');
    for (let i = 0; i < 4; i++) act(g, 'use', 'machine');
    ok(g.f.machineDone, 'answering machine played');
    act(g, 'talk', 'hole');
    talk(g, 'max', ['hint', 'how', 'decree', 'case']);
    act(g, 'use', 'glove');
    ok(g.has('glove') && g.f.gloveTaken && !has(g, 'glove'), 'boxing glove of case 101 taken from the closet');
  }
  go(g, 'edoor', 'street');
  if (o.mistakes) {
    go(g, 'leftydoor', 'leftys');
    talk(g, 'bob', ['who', 'why', 'crisis', 'where', 'try']);
    ok(!g.has('chip') && g.f.copsNet && !g.f.copsMet, 'the clubs last goggles are on sybil');
    act(g, 'use', 'chippy', 'roach');
    ok(g.f.bugRec === 'chippy' && g.has('roach'), 'bug listened to chippy');
    act(g, 'look', 'roach');
    go(g, 'door', 'street');
  }
  go(g, 'sybildoor', 'sybil');
  ok(g.f.sybilSeen && g.actors.sybil.act === 'flail' && g.actors.sybil.v === 'vr', 'sybil flails in the goggles');
  hint(g, /перчатк/, 'suggests the glove');
  if (o.mistakes) {
    act(g, 'talk', 'sybil');
    act(g, 'use', 'sybil', 'glove');
    ok(g.f.gloveTried && !g.f.sybilFree, 'the glove cannot reach sybil');
    hint(g, /Джимми/, 'points to the cannon of jimmy');
    act(g, 'use', 'sybil', 'roach');
    ok(g.f.bugRec === 'sybilvr', 'bug listened to the beta tester');
  }
  g = cp(g);
  ok(g.actors.sybil.act === 'flail', 'sybil still flails after a reload');
  travel(g, 'bosco');
  ok(g.actors.jimmy.room === 'bosco' && g.actors.bosco.v === 'vr' && has(g, 'cannon'), 'jimmy sells a cannon at the store of bosco');
  talk(g, 'jimmy', o.mistakes ? ['what', 'price', 'why', 'hat', 'vr'] : ['what']);
  ok(g.f.jimmyMet, 'met jimmy');
  if (o.mistakes) {
    act(g, 'use', 'jimmy');
    ok(!g.has('ratcannon'), 'jimmy cannot be grabbed while he watches');
    act(g, 'use', 'bosco', 'ratcannon');
    act(g, 'use', 'cannon');
    ok(g.vt.reload > g.time && g.actors.jimmy.act === 'load', 'jimmy reloads the cannon');
    let n = 0;
    while (g.vt.reload && n++ < 600) g.update(1 / 30);
    idle(g);
    ok(!g.vt.reload && g.actors.jimmy.act === '', 'the reload window closes');
    act(g, 'use', 'jimmy');
    ok(!g.has('ratcannon'), 'too late to grab jimmy');
    talk(g, 'bosco', ['who', 'sell', 'pay', 'pass', 'behind']);
    ok(g.f.knowCold && g.f.knowBank && g.f.knowTattoo && !g.vt.turnT, 'the elf explains the price, the bank and the tattoo');
    act(g, 'use', 'bosco', 'glove');
  }
  act(g, 'use', 'cannon');
  ok(g.vt.reload > g.time, 'reload window');
  act(g, 'use', 'jimmy');
  ok(g.has('ratcannon') && g.f.cannonTaken && g.actors.jimmy.room === 'nowhere' && !has(g, 'cannon'), 'jimmy loaded into the cannon');
  hint(g, /Пали/, 'says to fire at sybil');
  if (!o.lateBinoc) {
    act(g, 'use', 'binoc');
    ok(g.has('binoc') && g.f.binocTaken, 'binoculars taken while bosco is in the goggles');
  }
  g = cp(g);
  travel(g, 'sybil');
  act(g, 'use', 'sybil', 'ratcannon');
  ok(g.f.sybilFree && !g.has('ratcannon') && g.dialog && g.dialog.id === 'sybil5', 'the rat cannon freed sybil');
  ok(g.actors.sybil.v === '' && g.actors.jimmy.room === 'nowhere', 'sybil lost the goggles, jimmy ran away');
  for (const id of o.mistakes ? ['what', 'who', 'pay', 'broken', 'level'] : ['who']) choose(g, id);
  close(g);
  ok(g.f.knowCops && has(g, 'goggles'), 'sybil names the club, broken goggles lie on the couch');
  hint(g, /Лефти|железк/, 'points to the club');
  if (o.mistakes) {
    act(g, 'use', 'goggles');
    ok(!g.has('goggles'), 'broken goggles stay on the couch');
    act(g, 'use', 'sybil', 'roach');
    ok(g.f.bugRec === 'sybil', 'bug listened to sybil');
  }
  g = cp(g);
  travel(g, 'leftys');
  for (const id of ['curt', 'bob', 'bluster', 'chippy']) ok(g.actors[id].room === 'leftys' && g.actors[id].v === '', 'club member present: ' + id);
  talk(g, 'curt', o.mistakes ? ['sybil', 'song', 'try'] : ['crisis', 'try']);
  ok(g.has('chip') && g.f.copsMet, 'chippy soldered a chip');
  hint(g, /микросхем/, 'says to fix the goggles');
  if (o.mistakes) { for (const id of ['curt', 'bob', 'bluster']) { act(g, 'look', id); act(g, 'use', id, 'roach'); } ok(g.f.bugRec === 'bluster', 'bug listened to the club'); }
  travel(g, 'office');
  ok(g.seen.jimmyBack, 'jimmy is back in his hole with goggles');
  if (o.mistakes) act(g, 'talk', 'hole');
  travel(g, 'sybil');
  act(g, 'use', 'goggles', 'chip');
  ok(g.roomId === 'sybil2' && g.f.vr && g.f.gogglesFixed && g.seen.vrIntro && !g.has('chip'), 'goggles fixed, welcome to reality 2.0');
  ok(!g.has('goggles') && has(g, 'hud'), 'in reality 2.0 the goggles are a button');
  hint(g, /Боско/, 'sends sam to bosco');
  ok(g.itemName('gun') === 'Лучемёт' && g.itemName('roach') === 'Программный жучок' && g.itemIcon('gun') === 'raygun5', 'items change their names in reality 2.0');
  if (o.mistakes) {
    for (let i = 0; i < 5; i++) act(g, 'talk', 'mouth');
    for (let i = 0; i < 3; i++) act(g, 'look', 'clock');
    act(g, 'talk', 'sybav');
    act(g, 'use', 'closet');
    ok(!g.f.coinCloset, 'the closet is locked for a thick dog');
    act(g, 'use', 'mouth', 'hanky');
  }
  g = cp(g);
  ok(g.roomId === 'sybil2' && g.f.vr, 'a reload keeps reality 2.0');
  goggles(g, 'sybil');
  ok(!g.f.vr && g.has('goggles'), 'goggles off');
  act(g, 'use', 'sam', 'goggles');
  ok(g.roomId === 'sybil2' && g.f.vr, 'goggles work from the inventory too');
  travel(g, 'street2');
  ok(g.actors.auntie.room === 'street2' && g.actors.wizard.room === 'street2', 'auntie biotic and the wizard are on the street');
  if (o.mistakes) {
    act(g, 'use', 'coins');
    ok(!g.f.coinAir, 'coins hang too high');
    act(g, 'use', 'jack');
    ok(!g.has('jack'), 'pop-ups guard the jack-in-the-box');
    act(g, 'use', 'billboard');
    ok(g.roomId === 'street2', 'the billboard is too high');
    act(g, 'use', 'desoto2');
    ok(g.dialog && g.dialog.id === 'netdrive', 'the tv advert gave an address to drive to');
    choose(g, 'bye');
    act(g, 'look', 'bankad');
    act(g, 'use', 'emailbox');
    talk(g, 'auntie', ['who', 'mail', 'armor']);
    act(g, 'use', 'auntie', 'coins');
  }
  travel(g, 'control');
  ok(g.f.controlSeen, 'control room seen');
  for (const id of ['curt', 'bob', 'bluster', 'chippy']) ok(g.actors[id].room === 'control' && g.actors[id].v === 'vr', 'program in its tube: ' + id);
  if (o.mistakes) {
    talk(g, 'screen', ['who', 'why', 'surge', 'boss', 'off']);
    for (const id of ['curt', 'bob', 'bluster', 'chippy']) { act(g, 'talk', id); act(g, 'look', id); }
    act(g, 'use', 'bluster');
    act(g, 'use', 'chippy', 'roach');
    ok(g.f.bugOn === '' && g.has('roach'), 'chippy has a button, not a slot');
  }
  act(g, 'use', 'curt', 'roach');
  ok(g.f.bugOn === 'curt' && !g.has('roach') && E.body(g) === 'flat' && g.actors.sam.costume === 'samflat' && g.actors.max.costume === 'maxflat', 'depth is down, sam and max are flat');
  g = cp(g);
  ok(g.actors.curt.act === 'sunk', 'the bug stays in the tube after a reload');
  if (o.mistakes) {
    act(g, 'talk', 'curt');
    act(g, 'use', 'bob');
    travel(g, 'street2');
    act(g, 'use', 'desoto2');
    ok(!g.dialog && g.mode === 'room', 'flat dogs do not drive');
  }
  travel(g, 'sybil2');
  act(g, 'use', 'closet');
  ok(g.f.coinCloset && g.has('coins') && E.coinCount(g) === 1 && g.actors.sam.visible, 'slid under the closet door for a coin');
  travel(g, 'control');
  act(g, 'use', 'curt');
  ok(g.f.bugOn === '' && g.has('roach') && E.body(g) === '' && g.actors.sam.costume === 'sam', 'bug taken back, depth restored');
  act(g, 'use', 'bob', 'roach');
  ok(E.body(g) === 'small' && g.actors.sam.scale < 0.5, 'height is down, sam and max are small');
  if (g.f.knowCold && g.f.elfMet) hint(g, /Сними очки/, 'explains the way into the office');
  travel(g, 'street2');
  act(g, 'use', 'officedoor');
  ok(g.roomId === 'street2', 'the step of the office is too high');
  if (o.mistakes) { act(g, 'use', 'desoto2'); act(g, 'use', 'desoto2', 'paint'); }
  goggles(g, 'street');
  ok(g.actors.sam.scale === null && !g.has('coins'), 'normal size and no coins in the real world');
  go(g, 'officedoor', 'office');
  goggles(g, 'office2');
  ok(g.f.holeSeen && E.body(g) === 'small', 'small inside the office 2.0');
  g = cp(g);
  if (!g.f.closetOpen) act(g, 'use', 'closet');
  for (let i = 0; i < 5; i++) ok(has(g, 'file' + i), 'the closet 2.0 keeps the cases as files: ' + i);
  if (o.mistakes) {
    for (let i = 0; i < 5; i++) { act(g, 'look', 'file' + i); act(g, 'use', 'file' + i); }
    act(g, 'talk', 'hole');
    act(g, 'use', 'hole', 'coins');
    talk(g, 'tv', ['who']);
  }
  act(g, 'use', 'hole');
  ok(g.f.coinHole && E.coinCount(g) === 2 && g.actors.sam.visible && g.actors.jimmy.room === 'nowhere', 'coin taken from the hole of jimmy');
  if (o.mistakes) { act(g, 'use', 'hole'); act(g, 'use', 'hole', 'coins'); }
  travel(g, 'control');
  act(g, 'use', 'bob');
  act(g, 'use', 'bluster', 'roach');
  ok(E.body(g) === 'light' && g.actors.sam.costume === 'samlight' && g.actors.max.costume === 'maxlight', 'gravity is down, sam and max bounce');
  act(g, 'use', 'chippy');
  ok(g.f.popOff, 'pop-ups and muzak switched off');
  travel(g, 'street2');
  ok(!has(g, 'popups'), 'no pop-ups on the street');
  act(g, 'use', 'jack');
  ok(g.has('jack') && g.f.jackTaken, 'jack-in-the-box taken');
  act(g, 'use', 'coins');
  ok(g.f.coinAir && E.coinCount(g) === 5 && Math.abs(g.actors.sam.y - 150) < 3, 'jumped for three coins');
  g = cp(g);
  talk(g, 'wizard', o.mistakes ? ['who', 'how', 'host', 'trick', 'trick2', 'out'] : ['trick']);
  ok(g.has('paint') && g.f.paintGot, 'rainbow paint kit from the wizard');
  travel(g, 'bosco2');
  ok(g.actors.elf.room === 'bosco2' && g.actors.elf.v === '', 'the elf stands behind the counter');
  talk(g, 'elf', o.mistakes ? ['who', 'sell', 'pay', 'pass', 'buy'] : ['sell', 'pay', 'pass', 'buy']);
  ok(g.has('sword') && g.f.swordBought && !g.has('coins') && g.f.elfMet && g.f.knowBank, 'wooden sword bought for five coins');
  hint(g, /меч/, 'says to knock bosco out with the sword');
  if (o.mistakes) { for (let i = 0; i < 5; i++) act(g, 'look', 'potions'); act(g, 'use', 'rack'); }
  const slime = () => {
    travel(g, 'bosco2');
    act(g, 'use', 'sludgie');
    ok(g.vt.slime && g.actors.slime.room === 'bosco2' && g.actors.slime.visible, 'slime spawned');
    if (o.mistakes) {
      act(g, 'use', 'sludgie');
      act(g, 'talk', 'slime');
      act(g, 'use', 'slime', 'glove');
      ok(g.dialog && g.dialog.id === 'battle5' && g.closeup && g.closeup.kind === 'battle5', 'battle screen');
      ok(!g.canSave(), 'no saving in a battle');
      for (const w of ['gun', 'max', 'roach', 'jack'].filter(id => g.has(id))) { choose(g, 'attack'); choose(g, 'w_' + w); ok(g.dialog, 'the battle goes on after ' + w); }
      choose(g, 'attack'); choose(g, 'back');
      choose(g, 'flee');
      ok(!g.dialog && !g.closeup && g.vt.slime, 'fled, the slime waits');
      if (g.has('glove')) {
        act(g, 'use', 'slime');
        choose(g, 'attack'); choose(g, 'w_glove');
        ok(!g.dialog && !g.closeup && !g.vt.slime && !g.has('slime'), 'the glove only scares the slime away');
        act(g, 'use', 'sludgie');
      }
    }
    act(g, 'use', 'slime', 'sword');
    choose(g, 'attack'); choose(g, 'w_sword');
    ok(g.has('slime') && g.f.slimeGot && !g.closeup && !g.dialog && !g.vt.slime, 'slime slime dropped');
    if (o.mistakes) {
      act(g, 'use', 'sludgie');
      act(g, 'use', 'slime', 'sword');
      choose(g, 'attack'); choose(g, 'w_sword');
      ok(g.seen.slimeKill === 2 && g.inv.filter(id => id === 'slime').length === 1, 'a second slime gives only experience');
    }
    travel(g, 'street2');
    act(g, 'use', o.mistakes ? 'sword2' : 'billboard');
    ok(g.roomId === 'roof2' && g.f.roofSeen, 'jumped onto the billboard');
    act(g, 'use', 'hud');
    ok(g.roomId === 'roof2' && g.f.vr, 'goggles stay on at the billboard');
    if (o.mistakes) { act(g, 'use', 'stuck'); act(g, 'use', 'stuck', 'glove'); act(g, 'use', 'stuck', 'max'); ok(!g.has('sword2'), 'the sword is stuck'); }
    act(g, 'use', 'stuck', 'slime');
    ok(g.has('sword2') && g.f.sword2Got && g.f.slimeOnSword && !g.has('slime') && !has(g, 'stuck'), 'slime greased the +2 sword');
    g = cp(g);
    go(g, 'down', 'street2');
  };
  const pay = () => {
    travel(g, 'bosco2');
    act(g, 'use', 'elf', 'sword');
    ok(g.f.boscoOut && g.actors.elf.v === 'bot', 'the sword knocked bosco out of reality 2.0');
    if (o.mistakes) { talk(g, 'elf', ['where', 'sell']); act(g, 'use', 'elf', 'sword'); }
    goggles(g, 'bosco');
    ok(g.actors.bosco.v === '', 'the real bosco lost his goggles');
    if (g.has('binoc')) { act(g, 'use', 'bosco', 'binoc'); ok(!g.f.passKnown, 'nothing to read from the front'); }
    if (o.lateBinoc) {
      act(g, 'use', 'binoc');
      ok(!g.has('binoc'), 'bosco guards his binoculars');
      act(g, 'talk', 'bosco'); choose(g, 'behind');
      ok(g.vt.turnT > 0 && g.actors.bosco.act === 'turn' && !g.dialog, 'bosco looks behind');
      act(g, 'use', 'binoc');
      ok(g.has('binoc'), 'binoculars taken behind his back');
      let n = 0;
      while (g.vt.turnT && n++ < 900) g.update(1 / 30);
      idle(g);
      ok(!g.vt.turnT && g.actors.bosco.act === '', 'bosco turns back');
    }
    act(g, 'talk', 'bosco');
    for (const id of o.mistakes ? ['back', 'sell'] : []) choose(g, id);
    choose(g, 'behind');
    ok(g.vt.turnT > 0 && g.actors.bosco.act === 'turn', 'bosco turned around');
    act(g, 'use', 'bosco', 'binoc');
    ok(g.f.passKnown, 'the password is tattooed on the back of his head');
    hint(g, g.f.car === E.PLATE ? /миллиард/ : /Де Сото|волшебник/, 'points to the bank');
    g = cp(g);
    goggles(g, 'bosco2');
    travel(g, 'street2');
    if (o.mistakes) {
      act(g, 'use', 'desoto2');
      ok(g.dialog && g.dialog.id === 'netdrive', 'the car asks for an address');
      choose(g, 'casino');
      choose(g, 'bank');
      idle(g, 30000);
      ok(g.roomId === 'street2' && g.mode === 'room' && g.f.fwSeen && !g.closeup && !g.hideUI, 'the firewall turned the unpainted car away');
      act(g, 'use', 'desoto2', 'paint');
      for (const id of ['c0', 'c1', 'c2']) choose(g, id);
      ok(g.f.car === 'кож' && !g.dialog, 'painted in the wrong colours');
      act(g, 'use', 'desoto2'); choose(g, 'bank');
      idle(g, 30000);
      ok(g.roomId === 'street2' && g.mode === 'room', 'turned away again');
      act(g, 'use', 'desoto2', 'paint');
      choose(g, 'c5'); choose(g, 'bye');
      ok(g.f.car === 'сож', 'painting can be interrupted');
    }
    act(g, 'use', 'desoto2', 'paint');
    ok(g.dialog && g.dialog.id === 'paint', 'paint dialog');
    for (const id of ['c5', 'c0', 'c6']) choose(g, id);
    ok(g.f.car === E.PLATE && !g.dialog, 'car painted like the licence plate');
    g = cp(g);
    act(g, 'use', 'desoto2'); choose(g, 'bank');
    idle(g, 30000);
    ok(g.mode === 'bank' && g.drive instanceof E.Bank && !g.closeup && !g.canSave(), 'the firewall let the car into the bank');
    const bank = g.drive;
    if (o.mistakes) {
      clickBank(g, bank, 'node', 'cas');
      ok(!bank.unlocked && (bank.state.m.cas || 0) === 500, 'no transfers before the account is unlocked');
      clickBank(g, bank, 'node', 'bosco');
      ok(bank.ask, 'password prompt');
      clickBank(g, bank, 'guess', '12345');
      ok(!bank.unlocked && !bank.ask, 'wrong password');
      clickBank(g, bank, 'btn', 'max');
      clickBank(g, bank, 'node', 'biv');
      ok(g.f.knowBiv, 'the locked account belongs to roy g. biv');
    }
    clickBank(g, bank, 'node', 'bosco');
    clickBank(g, bank, 'guess', E.PASSWORD);
    ok(bank.unlocked && g.f.bankUnlocked, 'account of bosco unlocked');
    if (o.mistakes) {
      clickBank(g, bank, 'node', 'cas');
      clickBank(g, bank, 'node', 'gran');
      ok((bank.state.m.biv || 0) === 500 && !g.f.paid, 'half a billion went to roy g. biv');
      ok(bank.hint().includes('Вернуть как было'), 'max suggests a reset');
      clickBank(g, bank, 'btn', 'reset');
      ok((bank.state.m.biv || 0) === 0 && bank.state.m.cas === 500, 'books uncooked');
      clickBank(g, bank, 'btn', 'exit');
      idle(g);
      ok(g.mode === 'room' && g.roomId === 'street2' && !g.f.paid, 'left the bank');
      act(g, 'use', 'desoto2'); choose(g, 'bank');
      idle(g, 30000);
      ok(g.mode === 'bank' && g.drive.unlocked, 'the account stays unlocked');
    }
    const b = g.drive;
    let n = 0;
    while (!g.f.paid && n++ < 30) {
      const path = E.bankSolve(b.state);
      ok(path && path.length > 0 && path.length <= 12, 'the bank puzzle has a solution');
      ok(b.hint().includes(E.bankSay(path[0])), 'max names the next account');
      clickBank(g, b, 'node', path[0]);
    }
    idle(g, 30000);
    ok(g.f.paid && g.mode === 'room' && g.roomId === 'street2' && !g.drive, 'a billion on the account of bosco');
    g = cp(g);
    travel(g, 'bosco2');
    goggles(g, 'bosco');
    ok(g.has('hanky') && g.f.coldGot && !g.dialog, 'bosco sneezed into a hanky');
    if (g.f.sword2Got) hint(g, /попрыгунчик|Чиппи|тётушк/i, 'prepares the fight with auntie');
    if (o.mistakes) { act(g, 'look', 'hanky'); talk(g, 'bosco', ['sell']); act(g, 'use', 'bosco', 'hanky'); }
    goggles(g, 'bosco2');
    ok(g.itemName('hanky') === 'Компьютерная простуда', 'the cold is digital in reality 2.0');
  };
  if (o.payFirst) { pay(); slime(); } else { slime(); pay(); }
  travel(g, 'street2');
  if (o.mistakes) {
    act(g, 'use', 'emailbox', 'hanky');
    ok(!g.f.infected && g.has('hanky'), 'auntie biotic checks the mail');
    act(g, 'use', 'auntie', 'jack');
    act(g, 'use', 'auntie', 'sword2');
    ok(g.dialog && g.dialog.id === 'battle5' && g.vt.battle.turn === 'defend', 'auntie strikes first');
    choose(g, 'defend'); choose(g, 'w_jack');
    ok(!g.dialog && !g.closeup && g.f.auntieLost && !g.f.auntieGone, 'without pop-ups the box is no shield');
  }
  travel(g, 'control');
  act(g, 'use', 'chippy');
  ok(!g.f.popOff, 'pop-ups are back');
  g = cp(g);
  travel(g, 'street2');
  act(g, 'use', 'auntie', 'sword2');
  choose(g, 'defend'); choose(g, 'w_jack');
  ok(g.dialog && g.vt.battle.turn === 'attack' && g.closeup.shield, 'pop-ups stopped the frying pan');
  if (o.mistakes) {
    choose(g, 'attack'); choose(g, 'w_sword');
    ok(g.vt.battle.turn === 'defend' && !g.f.auntieGone, 'the wooden sword does not get through the +1 armour');
    choose(g, 'defend'); choose(g, 'w_jack');
  }
  choose(g, 'attack'); choose(g, 'w_sword2');
  ok(g.f.auntieGone && !g.dialog && !g.closeup && g.actors.auntie.room === 'nowhere', 'auntie biotic defeated');
  hint(g, /почтовый ящик/, 'says to post the cold');
  g = cp(g);
  ok(g.actors.auntie.room === 'nowhere', 'auntie stays away after a reload');
  act(g, 'use', 'emailbox', 'hanky');
  idle(g, 30000);
  ok(g.f.infected && !g.has('hanky') && g.mode === 'text15' && g.drive instanceof E.Text15 && !g.closeup && !g.hideUI, 'the internet caught the cold, reality 1.5');
  const t = g.drive;
  if (o.mistakes) {
    text(g, t, ['max', 'look', 'internet', 'use']);
    text(g, t, ['take', 'respect']);
    ok(t.hole && t.at.respect === 'depths', 'respect fell into the hole');
    text(g, t, ['go', 'down', 'take', 'respect', 'go', 'up', 'go', 'nw', 'take', 'card', 'use', 'card', 'lake', 'go', 'se']);
    ok(t.at.respect === 'depths' && t.at.card === 'inv', 'the presence keeps the respect');
    text(g, t, ['go', 'east', 'take', 'bosco', 'go', 'west', 'go', 'down', 'use', 'bosco', 'presence', 'go', 'up']);
    ok(!t.sick, 'plain bosco does not disgust the presence');
    text(g, t, ['go', 'nw', 'use', 'bosco', 'lake', 'use', 'bosco', 'lake', 'go', 'se', 'max']);
    ok(t.sweet, 'nauseatingly cute bosco');
  } else text(g, t, ['take', 'respect', 'go', 'east', 'take', 'bosco', 'go', 'west', 'go', 'nw', 'use', 'bosco', 'lake', 'go', 'se']);
  text(g, t, ['go', 'down', 'use', 'bosco', 'presence', 'take', 'respect', 'go', 'up']);
  ok(t.sick && t.at.respect === 'inv' && t.room === 'west', 'respect taken from the presence');
  text(g, t, ['use', 'respect', 'internet']);
  ok(g.f.netFreed && t.over, 'respect for all living things returned to the internet');
  let n = 0;
  while (!g.ended && n++ < 60000) g.update(1 / 30);
  ok(!g.log.some(l => l.startsWith('script error')), 'finale without script errors: ' + g.log.filter(l => l.startsWith('script error')).join(' | '));
  ok(g.ended && g.roomId === 'office' && g.f.epilogue && g.f.exhibit && !g.f.vr && g.mode === 'room', 'the episode ends in the office');
  ok(g.log.some(l => l.includes('Рой Г. Бив')), 'the internet names roy g. biv');
  ok(g.f.closetOpen && has(g, 'mrbear') && has(g, 'preshead') && has(g, 'leocloset') && has(g, 'capgun'), 'the closet still holds four cases');
  ok(E.ROOMS.office.layers.find(l => l.id === 'exhibit').when(g) && !g.has('goggles'), 'the goggles of case 105 joined the closet');
  ok(!E.VITEMS.some(id => g.has(id)), 'virtual items stayed in reality 2.0');
  return g;
}

{
  const g = game(7);
  idle(g);
  g.dialog = null;
  g.killTasks();
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
    ok(room.hot[room.hot.length - 1] === E.HUD, 'goggles button installed in ' + id);
    for (const [aid, h] of Object.entries(room.actors || {})) {
      ok(g.actors[aid], 'actor exists ' + aid);
      ok(h.name && h.look !== undefined, 'actor hotspot described ' + id + '.' + aid);
    }
  }
  ok(Object.keys(ENTRY).length === Object.keys(E.ROOMS).length, 'every room has an entry point');
  for (const [real, virt] of PAIRS) {
    ok(E.PAIR[real] === virt && E.REAL[virt] === real, 'world pair ' + real);
    ok(JSON.stringify(E.ROOMS[real].walk) === JSON.stringify(E.ROOMS[virt].walk) && E.ROOMS[real].w === E.ROOMS[virt].w, 'both worlds share the floor plan: ' + real);
  }
  const STATES = [
    { closetOpen: false },
    { closetOpen: true, sybilSeen: true, sybilFree: true, cannonTaken: true, copsMet: true },
    { closetOpen: true, sybilFree: true, cannonTaken: true, gogglesFixed: true, binocTaken: true, boscoOut: true, coinAir: true, coinCloset: true, coinHole: true, swordBought: true, sword2Got: true, jackTaken: true, popOff: true, auntieGone: true, paintGot: true }
  ];
  for (const st of STATES) {
    Object.assign(g.f, st);
    for (const [id, [ex, ey]] of Object.entries(ENTRY)) {
      g.f.vr = VR_ROOMS.includes(id);
      g.setRoom(id);
      ok(g.walkable(ex, ey), 'entry point walkable ' + id);
      const spots = g.hotspots().map(h => [h.id, h.walk]).concat(Object.entries(E.ROOMS[id].actors || {}).map(([aid, h]) => [aid, h.walk]));
      for (const [hid, walk] of spots) {
        const w = typeof walk === 'function' ? walk(g) : walk;
        if (!w) continue;
        const p = g.findPath(ex, ey, w[0], w[1]);
        ok(p && p.length, 'hotspot reachable ' + id + '.' + hid);
        const end = p[p.length - 1];
        ok(Math.hypot(end[0] - w[0], end[1] - w[1]) < 8, 'walk point on the floor ' + id + '.' + hid + ' -> ' + end.map(Math.round).join(','));
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
        if (!g.f.gogglesFixed) { ok(!g.hotspots().includes(E.HUD), 'no goggles button before the goggles work: ' + id); continue; }
        const B = E.HUD_BOX;
        for (const [sx, sy] of [[B.x + 2, B.y + 2], [B.x + B.w - 3, B.y + B.h - 3], [B.x + B.w / 2, B.y + B.h / 2]]) {
          const hit = g.pick(sx, sy);
          ok(hit && hit.kind === 'hot' && hit.id === 'hud', `goggles button wins the click in ${id} at camera ${cam}: ` + (hit && hit.id));
        }
        ok(!g.pick(B.x - 6, B.y + 8) || g.pick(B.x - 6, B.y + 8).id !== 'hud', 'goggles button ends at its frame in ' + id);
      }
      g.camLock = null;
    }
  }
  ok(ITEMS.length === Object.keys(E.ITEMS).length && ITEMS.every(id => E.ITEMS[id]), 'item list is complete');
  for (const vr of [false, true]) {
    g.f.vr = vr;
    for (const [id, it] of Object.entries(E.ITEMS)) {
      ok(g.itemName(id) && it.look !== undefined, 'item described ' + id);
      const icon = g.itemIcon(id);
      ok(S.ICONS[icon], 'item icon ' + id + ': ' + icon);
      const ic = S.icon(icon);
      ok(ic.w <= 28 && ic.h <= 22 && ic.px.some(v => v), 'item icon renders ' + id);
    }
  }
  ok(E.VITEMS.every(id => E.ITEMS[id]) && E.RITEMS.every(id => E.ITEMS[id]), 'world lists name real items');
  for (const [id, fn] of Object.entries(S.ICONS)) { const b = fn(); ok(b && b.px.some(v => v), 'icon draws ' + id); }
  for (const [id, fn] of sharedIcons) ok(S.ICONS[id] === fn, 'episode 105 keeps the shared icon ' + id);
  for (const [id, cos] of sharedCostumes) ok(S.COSTUMES[id] === cos, 'episode 105 keeps the shared costume ' + id);
  const convs = Object.entries(E.TALK);
  g.f.vr = true;
  g.inv = ITEMS.slice();
  g.vt.battle = { foe: 'auntie', turn: 'defend' };
  for (const [id, conv] of convs) {
    const variants = typeof conv.options === 'function' ? [{}, { zone: 2 }, { stage: 'pick' }].map(data => conv.options(g, { id, data })) : [conv.options];
    for (const list of variants) {
      const ids = list.map(o => o.id);
      ok(new Set(ids).size === ids.length, 'unique option ids in ' + id);
      ok(list.length > 0 && (list.some(o => o.end) || list.some(o => o.id === 'back')), 'conversation can end ' + id);
      for (const o of list) ok(o.text && S.ICONS[o.icon], 'option has text and icon ' + id + '.' + o.id + ': ' + o.icon);
      ok(list.length <= 10, 'options fit the dialog bar ' + id);
    }
  }
  g.vt.battle = null;
  const POSES = [{ dir: 'e' }, { dir: 'w', walk: 0.25 }, { dir: 's', talk: 1 }, { dir: 'n', walk: 0.6 }, { v: 'vr' }, { v: 'vr', act: 'sunk', t: 1 }, { act: 'flail', v: 'vr', t: 0.4 }, { act: 'shock' }, { act: 'point' }, { act: 'rub' }, { act: 'give' }, { act: 'shrug' }, { act: 'sneeze' }, { act: 'turn' }, { act: 'bow' }, { act: 'peek', v: 'vr' }, { act: 'load', t: 0.3 }, { act: 'fire' }, { act: 'salute' }, { act: 'magic', t: 1 }, { act: 'swing' }, { act: 'block' }, { act: 'hit' }, { act: 'guard', t: 1 }, { act: 'fade', t: 0.5 }, { v: 'bot', t: 1 }, { v: 'sick' }, { v: 'crash', t: 1 }, { v: 'angry' }];
  for (const id of ['sybil5', 'bosco5', 'jimmy5', 'copcurt', 'copbob', 'copbluster', 'copchippy', 'internet', 'netwiz', 'auntie', 'elfav', 'sybav', 'slime5', 'samflat', 'maxflat', 'samlight', 'maxlight']) {
    ok(S.COSTUMES[id] && !sharedCostumes.has(id), 'episode costume ' + id);
    for (const pose of POSES) {
      const s = S.sprite(id, pose, 1);
      ok(s && s.buf.px.some(v => v), 'sprite renders ' + id + ' ' + JSON.stringify(pose));
    }
  }
  ok(S.sprite('samflat', { dir: 'e' }, 1).buf.w < S.sprite('samflat', { dir: 's' }, 1).buf.w / 2, 'flat sam is a sliver from the side');
  for (const who of ['sybil5', 'jimmy5', 'cops']) ok(S.art105.portrait(who).px.some(v => v), 'portrait ' + who);
  for (const who of ['internet', 'wizard', 'auntie', 'elfbot']) ok(S.art105.portrait2(who).px.some(v => v), 'portrait ' + who);
  for (const tape of Object.values(E.BUG_TAPES)) for (const [who, line] of tape) ok(g.actors[who] && line, 'bug tape speaker exists: ' + who);
  ok(E.PAINTS.length === 7 && new Set(E.PAINTS.map(p => p.id)).size === 7 && E.PLATE.split('').every(ch => E.PAINTS.some(p => p.id === ch)), 'seven paints, the plate uses three of them');
  ok(E.PAINTS.every(p => p.name[0].toLowerCase() === p.id && S.C[p.ramp]), 'every paint letter is the first letter of its colour');
  const start = E.bankInit();
  const best = E.bankSolve(start);
  ok(best && best.length >= 4 && best.length <= 8, 'bank puzzle takes several moves: ' + (best && best.join(',')));
  let st = start;
  for (const n of best) st = E.bankCook(st, n).state;
  ok(st.m.bosco === 1000 && !(st.m.biv > 0), 'the solution moves a billion to bosco');
  let greedy = start;
  for (const n of ['cas', 'gran']) greedy = E.bankCook(greedy, n).state;
  ok(greedy.m.biv === 500 && E.bankSolve(greedy) === null, 'money sent to roy g. biv is lost until the books are uncooked');
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
  ok(strings > 1000, 'found the game texts: ' + strings);
  ok(missing.size === 0, 'font covers every text character: ' + [...missing].slice(0, 10).join(', '));
}

{
  const R = new S.Renderer();
  const g = game(3);
  for (let i = 0; i < 90; i++) g.update(1 / 30);
  ok(g.closeup && g.closeup.kind === 'titlecard5' && g.fade < 0.5, 'title card is visible');
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
    { sybilFree: true, cannonTaken: true, gogglesFixed: true, bugOn: 'curt', car: 'с-ф' },
    { boscoOut: true, binocTaken: true, coinAir: true, coinCloset: true, coinHole: true, sword2Got: true, slimeOnSword: true, jackTaken: true, popOff: true, auntieGone: true, infected: true, bugOn: 'bob', car: 'скф', epilogue: true, exhibit: true }
  ];
  for (const st of STATES) {
    Object.assign(g.f, st);
    for (const id of Object.keys(E.ROOMS)) {
      g.f.vr = VR_ROOMS.includes(id);
      g.setRoom(id);
      g.fade = 0; g.fadeTo = 0;
      for (const cam of [0, E.ROOMS[id].w - 320]) {
        g.camLock = cam;
        g.centerCam(true);
        g.pointer(300, 186);
        R.render(g);
        ok(R.frame.px.some(v => v > 2), 'room renders ' + id);
        if (g.f.gogglesFixed) ok(g.hover && g.hover.id === 'hud' && g.hoverLabel() === (g.f.vr ? 'Снять очки' : 'Надеть очки'), 'goggles button label in ' + id);
      }
      g.camLock = null;
    }
  }
  g.f.vr = false; g.f.bugOn = ''; g.f.epilogue = false; g.f.infected = false;
  g.setRoom('office');
  for (const prog of ['crisis', 'ad20', 'bank', 'auntie', 'rerun']) for (const t of [0.2, 3]) { g.closeup = { kind: 'tv5', prog, t0: g.time - t }; R.render(g); ok(R.frame.px.some(v => v > 2), 'tv programme ' + prog); }
  const shots = [
    { kind: 'titlecard5', lines: ['A', 'B', 'C'] },
    { kind: 'battle5', foe: 'slime' }, { kind: 'battle5', foe: 'slime', foeAct: 'hit', samAct: 'reach', fx: { kind: 'slash', dur: 9 } }, { kind: 'battle5', foe: 'slime', foeGone: true, loot: 1, lootText: '+1' },
    { kind: 'battle5', foe: 'auntie', fx: { kind: 'pan', dur: 9 }, samAct: 'ko', foeAct: 'swing' }, { kind: 'battle5', foe: 'auntie', shield: 1, fx: { kind: 'ray', dur: 9 } }, { kind: 'battle5', foe: 'auntie', foeAct: 'fade', fx: { kind: 'punch', dur: 9 } },
    { kind: 'firewall5', cars: [{ cols: ['к', 'ф', 'з'], plate: 'кфз', at: 0.1 }], own: { cols: ['-', '-', '-'], plate: 'скф', at: 0.2, ok: false }, scan: { ok: false, text: 'НЕТ' } },
    { kind: 'firewall5', cars: [], own: { cols: ['с', 'к', 'ф'], plate: 'скф', at: 0.2, ok: true }, scan: { ok: true, text: 'ДА' } },
    { kind: 'netdrive5', dur: 3, text: E.SITE, cols: ['с', 'к', 'ф'] }, { kind: 'crash5', dur: 3 }
  ];
  for (const cu of shots) {
    for (const t of [0.3, 1.5, 3.4]) {
      g.closeup = Object.assign({ t0: g.time - t }, cu);
      if (cu.fx) g.closeup.fx = Object.assign({ t0: g.time - 0.1 }, cu.fx);
      if (cu.scan) g.closeup.scan = Object.assign({ t0: g.time - 0.1 }, cu.scan);
      if (cu.shield) g.closeup.shield = g.time - 0.5;
      if (cu.loot) g.closeup.loot = g.time - 0.5;
      R.render(g);
      ok(R.frame.px.some(v => v > 2), 'closeup ' + cu.kind + ' ' + (cu.foe || '') + ' at ' + t);
    }
  }
  g.closeup = null;
  const f = new S.Buf(320, 200);
  E.TITLE.draw(f, 1, 0, [true, false, true, true, false]);
  ok(f.px.every(v => v), 'title screen fully painted');
  ok(E.TITLE.hit(40, 88) === 0 && E.TITLE.hit(40, 144) === 4 && E.TITLE.hit(300, 10) === -1, 'title menu hit test');
  ok(E.CREDITS.length > 10 && E.SAVE_KEY === 'sammax105_saves' && E.SET_KEY === 'sammax105_settings' && E.TITLE_MUSIC === 'title5' && E.CREDITS_MUSIC === 'credits5', 'episode descriptor');
  for (const th of ['title5', 'reality', 'muzak', 'control', 'tavern', 'cops', 'battle5', 'bank5', 'firewall', 'text15', 'credits5']) {
    const T = S.THEMES[th];
    ok(T && !baseThemes.has(th), 'music theme ' + th + ' belongs to the episode');
    ok(['swing', 'lounge', 'waltz', 'surf', 'creepy', 'fanfare', 'hypno', 'country', 'quiz', 'tango', 'tarantella', 'industrial', 'march'].includes(T.style), 'music style is known to the player: ' + th);
    const per = T.style === 'waltz' || T.style === 'tarantella' ? 6 : 8;
    ok(T.mel.split(/\s+/).filter(Boolean).length === T.prog.length * per, 'melody fills the whole progression: ' + th);
  }
  for (const popOff of [false, true]) { g.f.popOff = popOff; for (const r of Object.values(E.ROOMS)) ok(S.THEMES[typeof r.music === 'function' ? r.music(g) : r.music], 'room music exists ' + r.id); }
  const sfx = new Set();
  const audio = read('js/apps/sammax/sm-audio.js');
  for (const f2 of fs.readdirSync(DIR)) for (const m of fs.readFileSync(path.join(DIR, f2), 'utf8').matchAll(/sfx\('([a-z0-9]+)'\)/g)) sfx.add(m[1]);
  for (const id of sfx) ok(audio.includes("case '" + id + "':"), 'sound exists in the shared player: ' + id);
  g.f.vr = true; g.f.gogglesFixed = true; g.f.bankUnlocked = false; g.f.passKnown = false;
  g.setRoom('street2');
  const bank = new E.Bank(g);
  g.mode = 'bank'; g.drive = bank;
  let nodes = 0;
  for (const n of ['kit', 'biv', 'hol', 'cas', 'gran', 'trs', 'mob', 'bosco', 'lob']) for (let y = 0; y < 200 && nodes < 99; y += 2) { let found = false; for (let x = 0; x < 320; x += 2) { const h = bank.hit(x, y); if (h && h.kind === 'node' && h.id === n) { found = true; break; } } if (found) { nodes++; break; } }
  ok(nodes === 9, 'every account of the bank can be clicked: ' + nodes);
  bank.pointer(160, 100);
  R.render(g);
  ok(R.frame.px.every(v => v), 'bank screen fully painted');
  ok(bank.guesses().length === 4 && !bank.guesses().includes(E.PASSWORD), 'the password is not offered before it is read');
  g.f.passKnown = true;
  ok(bank.guesses()[0] === E.PASSWORD, 'the password is offered once it is known');
  bank.ask = true;
  R.render(g);
  ok(bank.key('Escape') && !bank.ask && g.mode === 'bank', 'escape closes the password prompt');
  ok(bank.key('Escape'), 'escape leaves the bank');
  idle(g);
  ok(g.mode === 'room' && g.roomId === 'street2' && !g.drive, 'back on the street after escape');
  const t = new E.Text15(g);
  g.mode = 'text15'; g.drive = t;
  for (let i = 0; i < 200; i++) g.update(1 / 30);
  R.render(g);
  ok(R.frame.px.some(v => v > 2) && !t.typing(), 'text adventure renders and finishes typing');
  ok(!t.key('Escape') && t.menu.kind === 'main', 'escape in the verb list is left to the game menu');
  t.key('1');
  ok(t.menu.kind === 'go', 'number keys pick a verb');
  t.key('Escape');
  ok(t.menu.kind === 'main', 'escape returns to the verbs');
  const things = ['internet', 'respect', 'hole', 'bosco', 'lake', 'card', 'presence'];
  for (const a of things) for (const b of things) t.use(a, b);
  ok(!t.over && !g.f.netFreed, 'nothing can be used before it is taken');
  for (const a of things) { t.take(a); t.look(a); }
  for (const d of ['east', 'west', 'nw', 'se', 'down', 'up']) t.go(d);
  ok(t.lines.length > 20 && t.lines.length <= 61, 'every command answers and the log stays short');
  const bot = new E.Text15(g);
  g.drive = bot;
  let turns = 0;
  const ACT = [
    [/ВЗЯТЬ!|Хватай УВАЖЕНИЕ/, b => b.cmd('take', 'respect')],
    [/Отдай УВАЖЕНИЕ/, b => b.cmd('use', 'respect', 'internet')],
    [/Неси его наверх/, b => b.cmd('go', 'up')],
    [/Бери УВАЖЕНИЕ/, b => b.cmd('take', 'respect')],
    [/Прыгай в ДЫРУ и бери/, b => { if (b.room !== 'west') b.cmd('go', b.room === 'east' ? 'west' : 'se'); else b.cmd('go', 'down'); }],
    [/Бери ЛАВКУ/, b => b.cmd('take', 'bosco')],
    [/Возьми её/, b => b.cmd('go', b.room === 'west' ? 'east' : b.room === 'depths' ? 'up' : 'se')],
    [/Окуни ЛАВКУ/, b => b.cmd('use', 'bosco', 'lake')],
    [/на северо-запад/, b => b.cmd('go', b.room === 'east' ? 'west' : b.room === 'depths' ? 'up' : 'nw')],
    [/Покажи Присутствию/, b => b.cmd('use', 'bosco', 'presence')],
    [/Прыгай в ДЫРУ на западном/, b => b.cmd('go', b.room === 'sybil' ? 'se' : b.room === 'east' ? 'west' : 'down')]
  ];
  while (!bot.over && turns++ < 40) {
    const hint = bot.hint();
    const rule = ACT.find(([re]) => re.test(hint));
    ok(rule, 'the hint of max is actionable: ' + hint);
    rule[1](bot);
  }
  ok(bot.over && turns <= 14, 'the hints of max finish reality 1.5 in ' + turns + ' moves');
  g.killTasks();
  g.mode = 'room'; g.drive = null;
}

{
  const POS = { office: [150, 166], office2: [150, 166], street: [300, 150], street2: [300, 150], roof2: [120, 172], bosco: [130, 172], bosco2: [130, 172], sybil: [100, 176], sybil2: [100, 176], leftys: [120, 176], control: [120, 176] };
  const STATES = [
    { caseOpen: true, closetOpen: true, sybilSeen: true, car: '---', bugOn: '' },
    { caseOpen: true, closetOpen: true, sybilSeen: true, sybilFree: true, cannonTaken: true, knowCops: true, copsNet: true, copsMet: true, gogglesFixed: true, controlSeen: true, knowCold: true, knowBank: true, knowTattoo: true, car: '---', bugOn: 'curt' },
    { caseOpen: true, closetOpen: true, sybilFree: true, cannonTaken: true, gogglesFixed: true, controlSeen: true, knowCold: true, knowBank: true, knowTattoo: true, boscoOut: true, binocTaken: true, passKnown: true, coinAir: true, coinCloset: true, coinHole: true, swordBought: true, sword2Got: true, jackTaken: true, paintGot: true, paid: true, coldGot: true, auntieGone: true, car: 'скф', bugOn: 'bluster' }
  ];
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
        g.f = Object.assign({}, st, { vr: VR_ROOMS.includes(id) });
        g.vt = {};
        g.setRoom(id);
        g.place('sam', id, POS[id][0], POS[id][1], 's');
        g.actors.sam.visible = true;
        g.actors.max.scripted = false;
        g.fade = 0; g.fadeTo = 0;
      };
      reset();
      const targets = g.hotspots().map(h => h.id).concat(g.visibleActors().filter(a => g.actorHot(a) && a.id !== 'sam').map(a => a.id)).concat(id === 'bosco2' ? ['slime'] : []);
      for (const tg of targets) {
        for (const v of ['look', 'use', 'talk', ...ITEMS]) {
          if (g.roomId !== id || g.mode !== 'room' || g.f.vr !== VR_ROOMS.includes(id) || g.f.bugOn !== st.bugOn) reset();
          if (tg === 'slime' && !g.vt.slime) { g.vt.slime = true; g.setRoom(id); }
          g.inv = ITEMS.slice();
          const verb = ['look', 'use', 'talk'].includes(v) ? v : 'use';
          const item = verb === v ? undefined : v;
          if (g.perform(verb, tg, item)) actions++;
          let n = 0;
          while ((g.busy || g.dialog || g.fade > 0.001 || g.mode !== 'room') && n++ < 12000) {
            g.update(1 / 30);
            if (g.dialog && !g.busy) { const ids = g.optionIds(); if (ids.includes('bye')) g.choose('bye'); else if (ids.length) g.choose(ids[ids.length - 1]); else g.endDialog(); }
            if (g.mode !== 'room' && !g.busy) { g.mode = 'room'; g.drive = null; }
          }
          step(g, 2);
          ok(n < 12000, `fuzz ${verb} ${tg} ${item || ''} in ${id} state ${si} settles: ` + g.log.slice(-1));
          ok(!g.closeup && !g.hideUI, `fuzz ${verb} ${tg} ${item || ''} in ${id} state ${si} leaves no closeup and shows the interface`);
          ok(g.actors.sam.visible && g.actors.sam.act === '', `fuzz ${verb} ${tg} ${item || ''} in ${id} state ${si} leaves sam on the stage`);
          ok(!g.actors.max.scripted, `fuzz ${verb} ${tg} ${item || ''} in ${id} state ${si} lets max follow again`);
        }
      }
    }
    ok(!g.log.some(l => l.startsWith('script error')), 'fuzz without script errors: ' + g.log.filter(l => l.startsWith('script error')).slice(0, 3).join(' | '));
  });
  ok(actions > 3000, 'fuzz ran many actions: ' + actions);
}

{
  playthrough(5, { mistakes: true, reload: true, lateBinoc: true });
  playthrough(9, { payFirst: true });
  playthrough(22, { reload: true, payFirst: true, lateBinoc: true });
}

{
  const SL = String.fromCharCode(47);
  const LINE = SL + SL, BLOCK = SL + '*';
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/sammax105/' + f).concat(['js/apps/sammax105-app.js', 'tests/sammax105.test.js', 'tools/sammax105-tour.cjs']);
  for (const f of files) {
    const src = read(f);
    ok(!src.includes(LINE) && !src.includes(BLOCK), f + ' has no comments');
  }
  ok(!read('sammax105.html').includes('<!' + '--'), 'page has no comments');
  const html = read('index.html');
  const page = read('sammax105.html');
  let lastA = -1, lastB = -1;
  for (const f of BASE) {
    const needle = `js/apps/sammax/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'engine script order in index.html and sammax105.html: ' + f);
    lastA = ia; lastB = ib;
  }
  for (const f of SHARED) {
    const needle = `js/apps/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'shared art modules come before episode 105: ' + f);
    lastB = ib;
  }
  lastA = html.indexOf('js/apps/sammax104-app.js');
  ok(lastA > 0, 'episode 104 is loaded before episode 105');
  for (const f of ORDER) {
    const needle = `js/apps/sammax105/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'episode script order in index.html and sammax105.html: ' + f);
    lastA = ia; lastB = ib;
  }
  ok(fs.readdirSync(DIR).filter(f => f.endsWith('.js')).length === ORDER.length, 'every episode module is loaded by the pages');
  ok(html.indexOf('js/apps/sammax105-app.js') > lastA, 'desktop loads the wrapper');
  ok(!page.includes('sammax/sm-room') && !page.includes('mm-room') && !page.includes('sc-room') && !page.includes('al-room'), 'standalone page loads only the engine, shared art and episode 105');
  const gm = read('js/game-manager.js');
  const at = gm.indexOf('      sammax105: {');
  const entry = gm.slice(at, at + 2800);
  ok(at > 0 && /steam: true/.test(entry) && /price: 28\.49/.test(entry) && /targetExe: 'SAMMAX5\.EXE'/.test(entry) && /appSamMax105/.test(entry), 'Steam catalog entry');
  ok(/genre: '/.test(entry) && /tags: \[/.test(entry) && /shots: \[/.test(entry), 'Steam entry has genre, tags and screenshot captions');
  const tags = entry.match(/tags: \[([^\]]*)\]/);
  ok(tags && tags[1].split(',').length >= 3 && tags[1].split(',').length <= 5, 'Steam entry has three to five tags');
  ok(!/sammax105Granted/.test(gm), 'no grant flag');
  const loadState = gm.slice(gm.indexOf('loadState'), gm.indexOf('moveGamesToSteam(state)'));
  ok(!/'sammax105'/.test(loadState), 'not preinstalled');
  ok(/id === 'sammax105'/.test(gm), 'readme for the installed game');
  for (const n of [1, 2]) ok(fs.existsSync(path.join(ROOT, 'content/steam/sammax105-' + n + '.jpg')), 'Steam screenshot ' + n);
  ok(read('tools/steam-shots-recipes.cjs').includes('sammax105'), 'Steam screenshot recipe');
  const shell = {
    'js/desktop.js': ["isInstalled('sammax105')", 'appSamMax105'],
    'js/taskbar.js': ["isInstalled('sammax105')", "case 'sammax105'", "showInSteam('sammax105')"],
    'js/apps/dialogs.js': ["cmd === 'sammax105'", "showInSteam(\\'sammax105\\')"],
    'js/apps/explorer.js': ["item.app === 'sammax105'", 'SAMMAX5.EXE'],
    'js/filesystem.js': ["gmInstalled.includes('sammax105')", "'SAMMAX5.EXE'"],
    'js/apps/task-manager.js': ["'app_sammax105'", 'sammax5.exe'],
    'js/icons.js': ["'sammax105': `<svg"],
    'js/apps/clippy.js': ["id.startsWith('app_sammax105')", "launchProgram('sammax105', 'appSamMax105')"],
    'js/apps/steam.js': ["game: 'sammax105'"],
    'js/apps/advanced-site.js': ["id: 'sammax105'"],
    'js/apps/sammax105-app.js': ["id = 'app_sammax105'", 'ep: S.EP105'],
    'tests/steam.test.js': ["'sammax105'"]
  };
  for (const [f, needles] of Object.entries(shell)) {
    const src = read(f);
    for (const n of needles) ok(src.includes(n), `${f} contains ${n}`);
  }
  const clippy = read('js/apps/clippy.js');
  ok(clippy.indexOf("id.startsWith('app_sammax105')") < clippy.indexOf("id.startsWith('app_sammax')"), 'clippy checks episode 105 before episode 101');
  ok((read('js/i18n.js').match(/'app\.sammax105': 'Sam & Max: Reality 2\.0'/g) || []).length === 4, 'i18n title in every language');
  ok(read('package.json').includes('"test:sammax105": "node tests/sammax105.test.js"'), 'npm script');
  ok(read('package.json').includes('node tests/sammax105.test.js'), 'full test run includes episode 105');
}

console.log(`sammax105: ${checks} checks passed in ${Date.now() - t0} ms`);
