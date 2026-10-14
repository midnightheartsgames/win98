const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const SMX = ['sm-core', 'sm-paint', 'sm-font', 'sm-sprites', 'sm-sprites2', 'sm-icons', 'sm-bg', 'sm-bg2', 'sm-bg3', 'sm-engine', 'sm-render', 'sm-story', 'sm-room-office', 'sm-room-street', 'sm-room-bosco', 'sm-room-sybil', 'sm-room-home', 'sm-room-dream', 'sm-closeups', 'sm-drive', 'sm-audio', 'sm-ui'];
const PAGE_CORE = ['sm-core', 'sm-paint', 'sm-font', 'sm-sprites', 'sm-icons', 'sm-engine', 'sm-render', 'sm-audio'];
const ORDER = ['bt-palette', 'bt-font', 'bt-grey', 'bt-bg86', 'bt-bg31', 'bt-rig', 'bt-sprites86', 'bt-sprites31', 'bt-portraits', 'bt-icons', 'bt-game', 'bt-games', 'bt-closeups', 'bt-story', 'bt-audio', 'bt-music', 'bt-room-lab', 'bt-room-mall', 'bt-room-yard', 'bt-room-edna', 'bt-room-square', 'bt-room-town', 'bt-room-night', 'bt-ui'];
let S, B;
for (const f of SMX) S = require(path.join(ROOT, 'js/apps/sammax', f + '.js'));
for (const f of ORDER) B = require(path.join(ROOT, 'js/apps/bttf', f + '.js'));
const E = B.EP1;
const C = B.C;

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const md5 = a => crypto.createHash('md5').update(Buffer.from(a)).digest('hex');

function modeStep(g) {
  const d = g.drive;
  if (!d) return;
  if (d.kind === 'card' || d.kind === 'doc' || d.kind === 'cine') { if (d.t > 0.05) B.games.close(d, true); return; }
  if (d.kind === 'circuits') { if (g.want) { for (const k of g.want) d.press(k); g.want = null; } else B.games.close(d, null); return; }
  if (d.kind === 'fuel' && d.cur && d.cur.t > 0.2) {
    if (g.fuelSlips > 0 && d.cur.who === 'emmett') { g.fuelSlips--; d.hit((B.games.FUEL_ST.findIndex(s => s.id === d.cur.st) + 1) % 4); return; }
    if (d.cur.who === 'emmett') d.hit(B.games.FUEL_ST.findIndex(s => s.id === d.cur.st));
  }
}

function idle(g, max) {
  let n = 0;
  while ((g.busy || g.fade > 0.001 || g.mode !== 'room') && !g.ended && n < (max || 60000)) { modeStep(g); g.update(1 / 30); n++; }
  for (let i = 0; i < 3; i++) g.update(1 / 30);
  ok(n < (max || 60000), 'game settles in ' + g.roomId + ' ' + g.mode);
}

function act(g, verb, target, item) {
  idle(g);
  const done = g.perform(verb, target, item);
  ok(done, verb + ' ' + target + (item ? ' with ' + item : '') + ' starts in ' + g.roomId);
  idle(g);
}

function choose(g, ids) {
  idle(g);
  for (const id of ids) {
    ok(g.dialog && g.optionIds().includes(id), 'option ' + id + ' is offered in ' + (g.dialog && g.dialog.id));
    ok(g.choose(id), 'option ' + id + ' is chosen');
    idle(g);
  }
}

function talk(g, who, ids) {
  act(g, 'talk', who);
  ok(!!g.dialog, 'dialog with ' + who + ' opens');
  choose(g, ids);
}

function game(seed) {
  const g = new B.Game({ seed: seed || 1, ep: E });
  g.textSpeed = 6;
  E.startNewGame(g);
  idle(g);
  choose(g, ['heck', 'cool']);
  act(g, 'use', 'toolbox');
  ok(g.roomId === 'lab' && g.f.chapter === 1, 'prologue leads to the lab');
  return g;
}

function reload(g) {
  const s = JSON.parse(JSON.stringify(g.saveState()));
  const h = new B.Game({ seed: s.seed, ep: E });
  h.textSpeed = 6;
  E.newGame(h);
  h.loadState(s);
  h.fuelSlips = g.fuelSlips;
  idle(h);
  ok(h.roomId === g.roomId, 'reload keeps the room');
  ok(JSON.stringify(h.f) === JSON.stringify(g.f), 'reload keeps the flags');
  ok(JSON.stringify(h.inv) === JSON.stringify(g.inv), 'reload keeps the pockets');
  for (const [id, a] of Object.entries(g.actors)) ok(h.actors[id].room === a.room && h.actors[id].costume === a.costume, 'reload keeps ' + id);
  return h;
}

function noErrors(g, what) {
  const errs = g.log.filter(l => l.startsWith('script error'));
  ok(errs.length === 0, what + ': ' + errs.join(' | '));
}

const CHECKPOINTS = {};

function route(o) {
  let g = new B.Game({ seed: o.seed, ep: E });
  g.textSpeed = 6;
  g.fuelSlips = o.mistakes ? 2 : 0;
  E.startNewGame(g);
  const step = fn => { fn(); noErrors(g, 'route ' + o.name); if (o.reload && g.canSave()) g = reload(g); };
  const mark = id => { idle(g); if (o.marks && g.canSave()) CHECKPOINTS[id] = JSON.parse(JSON.stringify(g.saveState())); };
  idle(g);
  choose(g, o.film ? ['disint', 'built'] : ['where', 'works']);
  ok(!!g.f.dejaMarty === !!o.film, 'film lines give the deja vu line');
  if (o.mistakes) { act(g, 'look', 'van'); act(g, 'use', 'trails'); }
  act(g, 'use', 'toolbox');
  mark('lab');
  if (o.mistakes) { step(() => act(g, 'exit', 'door')); ok(g.roomId === 'lab', 'no yard before the notebook'); step(() => act(g, 'use', 'clothes')); ok(!g.f.dressed, 'no costume before the date'); }
  step(() => act(g, 'exit', 'back'));
  step(() => act(g, 'use', 'model'));
  step(() => act(g, 'exit', 'out'));
  step(() => act(g, 'use', 'box'));
  if (o.mistakes) { step(() => act(g, 'use', 'dials')); step(() => act(g, 'use', 'amp', 'guitar')); ok(!g.f.biffBlasted, 'George still protects Marty'); step(() => act(g, 'use', 'biff', 'guitar')); }
  else step(() => act(g, 'use', 'amp', 'guitar'));
  step(() => talk(g, 'george', ['fight', 'bye']));
  if (!g.f.ampMax) step(() => act(g, 'use', 'dials'));
  step(() => act(g, 'use', 'amp', 'guitar'));
  ok(g.f.biffBlasted, 'Biff is blasted');
  step(() => act(g, 'use', 'court'));
  step(() => act(g, 'use', 'can'));
  step(() => act(g, 'exit', 'door'));
  ok(g.roomId === 'yard' && g.f.chapter === 2, 'chapter 2 in the yard');
  mark('yard');
  step(() => act(g, 'use', 'car'));
  step(() => act(g, 'use', 'recorder'));
  step(() => act(g, 'use', 'shoe'));
  if (o.mistakes) { step(() => act(g, 'use', 'keypad')); step(() => act(g, 'use', 'switch')); g.want = '061319310400E'; step(() => act(g, 'use', 'keypad')); ok(g.roomId === 'car' && !g.f.arrived, 'no trip without a date'); step(() => act(g, 'use', 'switch')); }
  step(() => act(g, 'use', 'dog', 'shoe'));
  ok(g.roomId === 'street86', 'Einstein leads to Edna');
  mark('street');
  if (o.mistakes) { step(() => act(g, 'use', 'window', 'shoe')); ok(g.roomId === 'street86', 'Edna does not open before asking'); }
  step(() => talk(g, 'window', ['gift', 'bye']));
  step(() => act(g, 'use', 'buzzer', 'shoe'));
  ok(g.roomId === 'edna86' && !g.has('shoe'), 'Edna lets Marty in');
  if (o.mistakes) { step(() => act(g, 'use', 'papers')); ok(!g.f.dateKnown, 'Edna guards the papers'); step(() => act(g, 'use', 'valve')); step(() => act(g, 'use', 'papers')); ok(!g.f.dateKnown, 'no search without a year'); }
  for (let i = 0; i < 1500 && g.actors.ednaOld.room !== 'edna86'; i++) g.update(1 / 30);
  idle(g);
  step(() => talk(g, 'ednaOld', ['shoe', 'where', 'papers', 'bye']));
  step(() => act(g, 'use', 'binoc'));
  ok(g.f.year1931, 'binoculars give the year');
  for (let i = 0; i < 1200 && g.actors.ednaOld.room !== 'edna86'; i++) g.update(1 / 30);
  idle(g);
  for (const id of ['photos', 'photos']) step(() => act(g, 'look', id));
  step(() => act(g, 'use', 'valve'));
  ok(g.actors.ednaOld.room !== 'edna86', 'Edna goes to the kitchen');
  step(() => act(g, 'use', 'papers'));
  ok(g.f.dateKnown && g.has('paper') && g.roomId === 'yard', 'paper found and Marty thrown out');
  mark('prep');
  if (o.mistakes) { step(() => act(g, 'use', 'car')); if (!g.f.circuitsOn) step(() => act(g, 'use', 'switch')); g.want = '061319310400E'; step(() => act(g, 'use', 'keypad')); ok(!g.f.arrived, 'no trip in jeans'); step(() => act(g, 'exit', 'out')); }
  step(() => act(g, 'exit', 'garage'));
  step(() => act(g, 'use', 'clothes'));
  ok(g.f.dressed && g.actors.marty.costume === 'bt_marty31', 'Marty dresses for 1931');
  act(g, 'exit', 'door');
  choose(g, ['play', 'bye']);
  step(() => act(g, 'use', 'fusion', 'can'));
  step(() => act(g, 'use', 'car'));
  if (!g.f.circuitsOn) step(() => act(g, 'use', 'switch'));
  if (o.mistakes) for (const d of ['061419310400E', '110519550600E', '102120150400E', '139919310400E', '070419310400E']) { g.want = d; step(() => act(g, 'use', 'keypad')); ok(!g.f.arrived, 'wrong date ' + d + ' is refused'); }
  g.want = '06131931E';
  act(g, 'use', 'keypad');
  ok(g.f.arrived && g.roomId === 'square', 'arrival in 1931');
  choose(g, [o.film ? 'fan' : 'against', 'n' + (o.seed % 3), 'day']);
  ok(g.f.alias && E.alias(g) === ['Майкл Корлеоне', 'Гарри Каллахан', 'Сонни Крокетт'][o.seed % 3], 'alias chosen');
  mark('square');
  step(() => act(g, 'look', 'lawsign'));
  step(() => talk(g, 'jail', ['car', 'family', 'break', 'where', 'bye']));
  ok(g.has('number') && g.f.docCar, 'number from Doc');
  step(() => act(g, 'exit', 'kitchen'));
  ok(g.f.kidSeen && g.actors.kid.room === 'square', 'Kid bullies Artie and leaves');
  if (o.mistakes) step(() => act(g, 'use', 'phone'));
  step(() => act(g, 'use', 'phone', 'number'));
  ok(g.f.butler && !g.has('number'), 'butler answers');
  step(() => act(g, 'exit', 'out'));
  step(() => act(g, 'use', 'courthouse'));
  ok(g.f.emmettMet, 'Emmett met');
  step(() => talk(g, 'emmett', ['sci', 'drill', 'bye']));
  step(() => act(g, 'use', 'emmett', 'recorder'));
  ok(g.f.mutter, 'mutter recorded');
  step(() => talk(g, 'jail', ['tape', 'bye']));
  ok(g.f.hamilton, 'Doc solves it');
  step(() => talk(g, 'emmett', ['ham', 'need1', 'need2', 'tonight', 'bye']));
  ok(g.f.emmettHelps && g.has('subpoena') && g.actors.emmett.room === 'kitchen', 'Emmett helps');
  mark('quests');
  const hooch = () => {
    step(() => talk(g, 'edna', ['scoop', 'sss', 'meet', 'soup', 'help', 'bike', 'bye']));
    step(() => act(g, 'exit', 'kitchen'));
    ok(g.f.barrels, 'barrels delivered');
    if (o.mistakes) step(() => act(g, 'use', 'pipe'));
    g.run(function* () { yield g.walkTo('marty', 110, 440); }, { name: 'hide' });
    idle(g);
    for (let i = 0; i < 400 && !g.f.signal; i++) { g.update(1 / 30); if (g.busy) idle(g); }
    ok(g.f.signal, 'pipe signal seen');
    if (o.mistakes) { step(() => act(g, 'use', 'pipe')); ok(!g.f.hooch, 'Cue Ball guards the pipe'); talk(g, 'cueball', ['soup']); choose(g, ['s1']); act(g, 'use', 'pipe'); ok(!g.f.hooch && g.f.barrels, 'no wedge: barrels fall through'); for (let i = 0; i < 600 && g.vt.cooking > 0; i++) g.update(1 / 30); idle(g); }
    step(() => talk(g, 'emmett', ['door', 'bye']));
    ok(g.f.wedge, 'Emmett wedges the door');
    talk(g, 'cueball', ['barrel', 'soup']);
    choose(g, ['s' + (o.seed % 3)]);
    act(g, 'use', 'pipe', o.film ? 'recorder' : undefined);
    ok(g.f.hooch && g.f.ednaHooch, 'Edna takes the hooch');
    step(() => act(g, 'exit', 'out'));
    talk(g, 'edna', ['charity']);
    choose(g, o.mistakes ? ['sober', 'quiet', 'forget'] : ['forget']);
    ok(g.f.hoochSent, 'hooch sent to the Browns');
  };
  const subpoena = () => {
    step(() => talk(g, 'kid', ['shine', 'artie', 'hat', 'nuts', 'what']));
    ok(g.has('hat'), 'hat taken');
    step(() => act(g, 'use', 'einstein', 'hat'));
    ok(g.roomId === 'arthur', 'Einstein finds Artie');
    if (o.mistakes) step(() => act(g, 'use', 'window', 'recorder'));
    step(() => act(g, 'use', 'buzzer'));
    ok(g.f.arthurRefused, 'Artie refuses');
    step(() => act(g, 'exit', 'out'));
    act(g, 'talk', 'kid');
    ok(g.roomId === 'bandstand', 'chase to the bandstand');
    if (o.mistakes) act(g, 'talk', 'einstein');
    act(g, 'use', 'kid', 'recorder');
    act(g, 'talk', 'einstein');
    ok(g.roomId === 'square' && g.f.kidTaped, 'escape with the recording');
    step(() => act(g, 'exit', 'west'));
    step(() => act(g, 'use', 'window', 'recorder'));
    ok(g.f.arthurOut, 'Artie comes down');
    act(g, 'use', 'artie', 'subpoena');
    ok(g.f.served && g.f.hatBack, 'subpoena served');
  };
  if (o.subFirst) { subpoena(); ok(g.roomId === 'arthur', 'still in town after one task'); act(g, 'exit', 'out'); hooch(); }
  else { hooch(); subpoena(); }
  idle(g);
  ok(g.dialog && g.dialog.id === 'patent', 'patent question');
  ok(!!g.f.fuelClean === !o.mistakes, 'fuel clean flag');
  choose(g, [o.film ? 'soon' : 'truth']);
  ok(g.f.night && g.f.jailFailed && g.f.paperV === 2 && !g.has('drill'), 'jailbreak fails');
  mark('night');
  step(() => act(g, 'use', 'rocket'));
  step(() => act(g, 'use', 'bike', 'rocket'));
  ok(g.roomId === 'wagonb', 'on the wagon');
  act(g, 'exit', 'gowagonr'); act(g, 'use', 'box'); act(g, 'use', 'antenna'); act(g, 'exit', 'gowagonb');
  act(g, 'exit', 'gowagonl'); act(g, 'use', 'spare', 'iron');
  act(g, 'use', 'cab', 'antenna');
  ok(!g.has('keys'), 'keys out of reach without a distraction');
  act(g, 'exit', 'gowagonb');
  if (o.mistakes) { act(g, 'use', 'lock', 'iron'); act(g, 'use', 'lock'); }
  talk(g, 'window', ['distract', 'bye']);
  act(g, 'exit', 'gowagonl'); act(g, 'use', 'cab', 'antenna'); act(g, 'exit', 'gowagonb');
  act(g, 'use', 'lock', 'keys'); act(g, 'use', 'kidgun', 'hubcap'); act(g, 'use', 'gun'); act(g, 'use', 'chains', 'gun');
  talk(g, 'window', ['throttle']);
  idle(g);
  ok(g.ended && g.f.ending, 'episode ends: ' + o.name);
  noErrors(g, 'route ' + o.name);
  return g;
}

ok(B.PAL.PALETTE.length === 256 && B.PAL.DARKER.length === 256 && B.PAL.LIGHTER.length === 256, 'palette has 256 entries');
ok(C.black === 1 && C.white === 2 && C.clear === 0, 'palette keeps clear, black and white');
ok(B.PAL.CYCLE.length === 8 && B.PAL.CYCLE.every(i => B.PAL.EMISSIVE[i]), 'cycle colours glow');
ok(S.pal === S.PAL0, 'Sam & Max palette is the default');
assert.throws(() => S.makePalette('x', Object.fromEntries(Array.from({ length: 60 }, (_, i) => ['r' + i, ['#000000', '#111111', '#222222', '#333333', '#444444']]))), /needs/);
checks++;

const r = new B.Renderer({ ep: E });
ok(r.W === 640 && r.H === 480 && r.frame.w === 640 && r.frame.h === 480, 'BTTF frame is 640x480');

const PROBE = game(9);
for (const [id, room] of Object.entries(E.ROOMS)) {
  const g = PROBE;
  const w0 = room.walk[0] || [320, 400];
  g.setRoom(id, { x: w0[0] + 40, y: w0[1] + 40, dir: 's' });
  g.fade = 0; g.fadeTo = 0;
  r.render(g);
  ok(S.pal === S.PAL0, 'renderer restores the palette after ' + id);
  const bg = r.roomBg(g);
  ok(bg.w === room.w && bg.h === 480, 'background size of ' + id);
  let holes = 0;
  for (let i = 0; i < bg.px.length; i++) if (!bg.px[i]) holes++;
  ok(holes === 0, id + ' background is fully painted');
  for (const L of room.layers || []) {
    S.usePalette(B.PAL);
    const b = E.LAYERS[L.src || id][L.art || L.id](g);
    S.usePalette();
    ok(b && b.w > 0 && b.h > 0, 'layer ' + id + '.' + L.id + ' renders');
  }
  const entry = [w0[0] + 40, w0[1] + 40];
  for (const h of room.hot) {
    ok(h.name && (h.look || h.exit), id + '.' + h.id + ' has a name and a look');
    ok(g.hotArea(h) > 0, id + '.' + h.id + ' has an area');
    const w = typeof h.walk === 'function' ? h.walk(g) : h.walk;
    if (w && room.walk.length) {
      const p = g.findPath(entry[0], entry[1], w[0], w[1]);
      ok(p && p.length, id + '.' + h.id + ' can be reached');
      const last = p[p.length - 1];
      ok(Math.hypot(last[0] - w[0], last[1] - w[1]) < 8, id + '.' + h.id + ' walk point is on the floor');
    }
    const rc = h.rect;
    if (rc) {
      const all = room.hot.filter(o => o === h || !o.when);
      const own = all.filter(o => o.rect && o.rect[0] <= rc[0] + rc[2] / 2 && o.rect[0] + o.rect[2] > rc[0] + rc[2] / 2 && o.rect[1] <= rc[1] + rc[3] / 2 && o.rect[1] + o.rect[3] > rc[1] + rc[3] / 2);
      const smallest = own.sort((a, b) => a.rect[2] * a.rect[3] - b.rect[2] * b.rect[3])[0];
      ok(smallest === h, id + '.' + h.id + ' owns its centre');
    }
  }
}

S.usePalette(B.PAL);
for (const [id, it] of Object.entries(E.ITEMS)) {
  ok(it.name && it.look, 'item ' + id + ' has a name and a description');
  const ic = S.icon(it.icon);
  ok(ic && ic.w <= 48 && ic.h <= 40 && ic !== S.ICONS.q, 'icon of ' + id + ' renders');
  let filled = 0;
  for (const v of ic.px) if (v) filled++;
  ok(filled > 100, 'icon of ' + id + ' is drawn');
}
for (const id of ['marty', 'george', 'biff']) {
  const cos = S.COSTUMES['bt_' + id];
  ok(cos && cos.h >= 150, 'costume ' + id);
  for (const dir of ['s', 'n', 'e', 'w']) for (const walk of [-1, 0, 0.25, 0.5, 0.75]) for (const act of ['', 'reach', 'guitar', 'sit']) for (const talk of [0, 1]) {
    const spr = S.sprite('bt_' + id, { dir, walk, act, talk, blink: talk === 1 }, 1);
    ok(spr && spr.buf.w > 20 && spr.buf.h > 90 && spr.buf.h < 200, id + ' ' + dir + ' ' + walk + ' ' + act + ' renders');
  }
  for (const o of [{}, { talk: 1 }, { blink: 1 }, { face: 'smile' }, { face: 'worried' }, { face: 'angry' }]) {
    const pb = B.portrait(id, o);
    let filled = 0;
    for (const v of pb.px) if (v) filled++;
    ok(pb.w === B.PORTRAIT.w && pb.h === B.PORTRAIT.h && filled === pb.px.length, 'portrait ' + id + ' ' + JSON.stringify(o));
  }
  ok(B.portrait(id, { talk: 1 }) !== B.portrait(id, {}), 'portrait ' + id + ' talks');
}
for (const ch of 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюяABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?:;-()«»"/%+=*<>…→' + "'") ok(B.font.has(ch), 'font has ' + ch);
ok(B.font.LINE_H === 14 && B.font.measure('Марти') > 25, 'font metrics');
for (const k of ['arrow', 'use', 'talk', 'look', 'e', 'w', 'n', 's', 'wait']) {
  const c = B.cursor(k, false), c2 = B.cursor(k, true);
  ok(c.buf.w >= 7 && c.buf.h >= 7 && c2.buf !== c.buf, 'cursor ' + k);
}
S.usePalette();

for (const [id, conv] of Object.entries(E.TALK)) {
  const fake = { id, data: {} };
  const opts = typeof conv.options === 'function' ? conv.options(PROBE, fake) : conv.options;
  ok(typeof conv.options === 'function' || opts.some(o => o.end), 'conversation ' + id + ' can end');
  ok(new Set(opts.map(o => o.id)).size === opts.length, 'option ids of ' + id + ' are unique');
  const pk = conv.portrait || id;
  ok(E.PORTRAITS[pk] || PROBE.actors[pk], 'portrait or speaker for ' + id);
}

route({ name: 'hooch first', seed: 3, film: true, marks: true });
route({ name: 'subpoena first', seed: 4, subFirst: true });
route({ name: 'mistakes and reloads', seed: 5, mistakes: true, reload: true });

let fuzzed = 0;
for (const [mark, state] of Object.entries(CHECKPOINTS)) {
  const fresh = () => { const g = new B.Game({ seed: state.seed, ep: E }); g.textSpeed = 6; E.newGame(g); g.loadState(JSON.parse(JSON.stringify(state))); idle(g); return g; };
  const probe = fresh();
  const targets = probe.hotspots().map(h => h.id).concat(probe.visibleActors().filter(a => probe.actorHot(a)).map(a => a.id));
  for (const t of targets) for (const how of ['look', 'use', 'talk'].concat(probe.inv.map(i => 'item:' + i))) {
    const g = fresh();
    const item = how.startsWith('item:') ? how.slice(5) : undefined;
    if (!g.perform(item ? 'use' : how, t, item)) continue;
    for (let k = 0; k < 12; k++) {
      idle(g);
      if (!g.dialog || g.ended) break;
      const opts = g.dialogOptions();
      const end = opts.find(o => o.end && o.id !== 'throttle' && o.id !== 'what') || opts[0];
      g.choose(end.id);
    }
    idle(g);
    noErrors(g, 'fuzz ' + mark + ' ' + t + ' ' + how);
    fuzzed++;
  }
}
ok(fuzzed > 400 && Object.keys(CHECKPOINTS).length >= 7, 'fuzz covered ' + fuzzed + ' actions at ' + Object.keys(CHECKPOINTS).join(','));

{
  const g = game(4);
  act(g, 'exit', 'back');
  act(g, 'use', 'model');
  act(g, 'exit', 'out');
  act(g, 'use', 'box');
  act(g, 'use', 'dials');
  act(g, 'talk', 'george');
  ok(!g.optionIds().includes('fight'), 'George only steps back after Biff tried');
  g.choose('bye'); idle(g);
  act(g, 'use', 'amp', 'guitar');
  ok(g.f.biffTried && !g.f.biffBlasted, 'maxed amp without George stepping back does not blast Biff');
  talk(g, 'george', ['fight', 'bye']);
  act(g, 'use', 'amp', 'guitar');
  ok(g.f.biffBlasted, 'then it does');
}

{
  const g = game(5);
  g.setRoom('lab', { x: 400, y: 400, dir: 'e' });
  g.fade = 0; g.fadeTo = 0;
  idle(g);
  const h = E.ROOMS.lab.hot.find(x => x.id === 'clocks');
  const cx = h.rect[0] + h.rect[2] / 2 - g.camX, cy = h.rect[1] + h.rect[3] / 2;
  g.pointer(cx, cy);
  ok(g.hover && g.hover.id === 'clocks' && g.cursorKind() === 'use', 'usable hotspot shows the hand');
  ok(g.primary({ kind: 'hot', h: { look: 'x' } }) === 'look' && g.primary({ kind: 'hot', h: { look: 'x', exit: {} } }) === 'exit', 'main action follows the handlers');
  ok(g.hoverLabel() === 'Часы', 'label shows the name');
  g.click(cx, cy, 0);
  idle(g);
  ok(g.log.some(l => l.includes('Подводить их бесполезно')), 'left click performs the main action');
  const tb = E.ROOMS.lab.hot.find(x => x.id === 'table');
  const tx = tb.rect[0] + 16 - g.camX;
  g.click(tx, tb.rect[1] + 20, 2);
  idle(g);
  ok(g.log.some(l => l.includes('Полжизни')), 'right click looks');
  const cam0 = g.camX;
  g.camX = 480;
  g.pointer(1080 - g.camX, 200);
  ok(g.hover && g.hover.id === 'back' && g.cursorKind() === 'e', 'exit shows an arrow towards the exit');
  g.camX = cam0;
  const george = g.actors.george;
  g.pointer(george.x - g.camX, george.y - 100);
  ok(g.hover && g.hover.kind === 'actor' && g.cursorKind() === 'talk', 'people show the talk cursor');
  g.pointer(300, 478);
  ok(g.invOpen && g.pocketAuto, 'pockets slide out at the bottom edge');
  for (let i = 0; i < 20; i++) g.update(1 / 30);
  ok(g.pocketT > 0.99, 'pockets are out');
  const slotX = B.POCKET.x0 + 10, slotY = Math.round(g.pocketY) + 20;
  g.pointer(slotX, slotY);
  ok(g.hover && g.hover.kind === 'inv' && g.hover.id === 'photo', 'pocket slot hit');
  g.click(slotX, slotY, 0);
  ok(g.held === 'photo' && !g.invOpen, 'item taken in hand');
  g.pointer(george.x - g.camX, george.y - 100);
  ok(g.hoverLabel() === 'Фото Джорджа → Джордж', 'label shows item and target');
  g.click(george.x - g.camX, george.y - 100, 0);
  idle(g);
  ok(g.log.some(l => l.includes('увереннее')), 'item used on a person');
  g.pointer(300, 478);
  for (let i = 0; i < 20; i++) g.update(1 / 30);
  g.pointer(B.POCKET.btn[0].x + 10, Math.round(g.pocketY) + 20);
  ok(g.hover && g.hover.kind === 'btn' && g.hoverLabel() === 'Думай, Макфлай!', 'hint button');
  g.click(B.POCKET.btn[0].x + 10, Math.round(g.pocketY) + 20, 0);
  ok(g.ui.includes('hint'), 'hint button asks the UI');
  g.pointer(300, 100);
  ok(!g.invOpen, 'auto pockets hide when the pointer leaves');
  g.togglePockets();
  ok(g.invOpen && !g.pocketAuto, 'Tab opens pockets');
  g.pointer(300, 100);
  ok(g.invOpen, 'pockets opened by key stay');
  g.click(300, 100, 0);
  ok(!g.invOpen, 'click outside closes them');
  act(g, 'talk', 'george');
  for (let i = 0; i < 3; i++) g.update(1 / 30);
  const top = g.dialogTop();
  ok(g.dialogSlot(200, top + 14) === 0 && g.dialogSlot(200, top + 14 + B.PANEL.row) === 1, 'dialogue rows hit');
  ok(g.dialogSlot(40, top + 14) === -1, 'portrait is not an option');
  g.click(200, top + 14 + B.PANEL.row * (g.optionIds().indexOf('bye')), 0);
  idle(g);
  ok(!g.dialog, 'dialogue closed by clicking its last row');
  const m = g.actors.marty;
  g.click(100, 440, 0, true);
  ok(m.path && m.speedMul > 2, 'double click runs');
  idle(g);
  const back = E.ROOMS.lab.hot.find(x => x.id === 'back');
  g.camX = 480;
  g.click(back.rect[0] + 20 - g.camX, back.rect[1] + 50, 0, true);
  idle(g);
  ok(g.roomId === 'labback', 'double click on an exit leaves at once');
  noErrors(g, 'input');
}

{
  const sg = new S.Game({ seed: 3 });
  S.newGame(sg);
  sg.setRoom('office', { x: 150, y: 166, dir: 's' });
  sg.fade = 0; sg.fadeTo = 0;
  for (let i = 0; i < 10; i++) sg.update(1 / 30);
  sg.killTasks();
  for (const a of Object.values(sg.actors)) { a.blink = false; a.blinkT = 99; a.mouth = 0; }
  const sr = new S.Renderer();
  ok(sr.W === 320 && sr.H === 200, 'Sam & Max frame stays 320x200');
  const shot = () => { sr.render(sg); const a = new Uint8ClampedArray(320 * 200 * 4); sr.toRGBA(sg, a); return md5(a); };
  const before = shot();
  const g = game(6);
  for (let i = 0; i < 5; i++) { g.update(1 / 30); r.render(g); }
  ok(S.pal === S.PAL0, 'BTTF leaves the default palette');
  ok(shot() === before, 'Sam & Max frame is the same while BTTF runs');
  const bt = new Uint8ClampedArray(640 * 480 * 4);
  r.toRGBA(g, bt);
  const px = r.frame.px;
  let i = 0;
  while (i < px.length && px[i] !== C.plank[2]) i++;
  ok(i < px.length && bt[i * 4] === B.PAL.PALETTE[C.plank[2]][0] && bt[i * 4 + 2] === B.PAL.PALETTE[C.plank[2]][2], 'BTTF frame uses its own palette');
}

{
  const mem = new Map();
  let fail = false;
  global.localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { if (fail) throw new Error('quota'); mem.set(k, String(v)); }, removeItem: k => mem.delete(k) };
  const listeners = [];
  const ctx = { createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {} };
  const cv = { style: {}, getContext: () => ctx, getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 480 }), addEventListener: (e, f) => listeners.push(e), removeEventListener() {} };
  const root = { classList: { add() {} }, set innerHTML(v) {}, querySelector: () => cv, clientWidth: 1300, clientHeight: 990, focus() {}, addEventListener: (e, f) => listeners.push(e), removeEventListener() {} };
  const ui = new B.UI(root, { ep: E, noLoop: true, onExit: () => {} });
  ok(cv.style.width === '1280px' && cv.style.height === '960px', 'window scales by whole steps');
  root.clientWidth = 500; root.clientHeight = 400; ui.resize();
  ok(parseInt(cv.style.width, 10) === 500 && parseInt(cv.style.height, 10) === 375, 'small window scales down');
  ok(listeners.includes('mousedown') && listeners.includes('keydown') && listeners.includes('wheel'), 'input is bound');
  ok(ui.titleItems()[0].id === 'new', 'no continue without an autosave');
  ui.draw();
  ui.newGame();
  ui.g.textSpeed = 6;
  ok(ui.g.roomId === 'mall' && !ui.g.canSave(), 'new game starts with the prologue');
  const pump = (cond, n) => { for (let i = 0; i < (n || 4000) && !cond(); i++) { modeStep(ui.g); ui.step(1 / 30); } };
  pump(() => ui.g.dialog && !ui.g.busy);
  ui.draw();
  for (const id of ['heck', 'cool']) { ui.g.choose(id); pump(() => (ui.g.dialog && !ui.g.busy) || !ui.g.dialog); }
  pump(() => !ui.g.busy && ui.g.mode === 'room');
  ui.g.perform('use', 'toolbox');
  pump(() => ui.g.roomId === 'lab' && !ui.g.busy && ui.g.fade <= 0, 8000);
  for (let i = 0; i < 10; i++) ui.step(1 / 30);
  ui.draw();
  ok(ui.screen === 'game' && ui.g.roomId === 'lab', 'prologue leads to the lab');
  ok(ui.saveSlot('1'), 'save to slot 1');
  const saved = ui.saves()['1'];
  ok(saved && saved.thumb && saved.chapter === 'Распродажа' && saved.gameTime === '14 мая 1986', 'slot keeps thumbnail, chapter and game date');
  const tb = B.unpackThumb(saved.thumb);
  let painted = 0;
  for (const v of tb.px) if (v) painted++;
  ok(tb.w === 128 && tb.h === 96 && painted > 10000, 'thumbnail decodes');
  ok(saved.thumb.length < 24000, 'thumbnail stays small: ' + saved.thumb.length);
  ui.g.perform('exit', 'back');
  for (let i = 0; i < 300; i++) ui.step(1 / 30);
  ok(ui.g.roomId === 'labback', 'walked to the back room');
  ok(ui.saves().auto && ui.saves().auto.state.room === 'labback', 'autosave on room change');
  ok(ui.titleItems()[0].id === 'continue', 'continue appears with an autosave');
  ok(ui.loadSlot('1') && ui.g.roomId === 'lab', 'slot 1 loads');
  ui.openMenu('pause');
  ui.mx = 320; ui.my = ui.pauseRect().y + 60 + 26 * ui.pauseItems().findIndex(i => i.id === 'options') + 8;
  ui.down(0);
  ok(ui.menu && ui.menu.kind === 'options', 'pause menu opens settings');
  ui.mx = 470; ui.my = 120 + 30 * 3 + 8;
  ui.down(0);
  ok(ui.settings.tips === false, 'settings toggle');
  ui.down(2);
  ok(ui.menu && ui.menu.kind === 'pause', 'right click goes back');
  ui.draw();
  ui.menu = null;
  ui.openMenu('save');
  ui.draw();
  ui.mx = 100; ui.my = LISTY(0);
  ui.down(0);
  ok(ui.menu && ui.menu.kind === 'confirm', 'occupied slot asks before overwriting');
  ui.draw();
  ui.mx = 270; ui.my = 270;
  ui.down(0);
  ok(!ui.menu && ui.toast, 'overwrite confirmed');
  const all = ui.saves();
  all['3'] = { name: 'x', when: 'y', state: { room: 'nowhere', v: 1 } };
  localStorage.setItem(E.SAVE_KEY, JSON.stringify(all));
  ok(!ui.loadSlot('3') && /повреждено/.test(ui.toast.text), 'broken slot is refused');
  ui.openMenu('load');
  ui.draw();
  fail = true;
  ui.menu = null;
  ok(!ui.saveSlot('4') && /нет места/.test(ui.toast.text), 'full storage is reported');
  fail = false;
  ui.g.ui.push('hint');
  ui.step(1 / 30);
  ok(ui.menu && ui.menu.kind === 'hints', 'hint window opens');
  ui.draw();
  ui.mx = 400; ui.my = 390;
  ui.down(0);
  ok(ui.g.f.hints && Object.values(ui.g.f.hints)[0] === 1, 'one hint opened');
  ui.toTitle();
  ui.draw();
  ok(ui.screen === 'title', 'back to title');
  ui.destroy();
  function LISTY(i) { return 64 + i * 36 + 10; }
}

const STYLE = [/—/, /, а не /, /(^|[\s«])не [^,.!?]{1,40}, а /i, /Это не [^.!?]*[.!?] Это /];
for (const f of ORDER) {
  const src = read('js/apps/bttf/' + f + '.js');
  ok(!/\/\/|\/\*/.test(src.replace(/'[^'\n]*'/g, "''").replace(/https?:/g, '')), f + ' has no comments');
  ok(!/Micro[s]oft|Win[d]ows/.test(src), f + ' uses project names');
  const lits = src.match(/'[^'\n]*[А-Яа-яЁё][^'\n]*'/g) || [];
  for (const l of lits) {
    const s = l.slice(1, -1);
    for (const re of STYLE) ok(!re.test(s), f + ' style: ' + s);
    for (const ch of s) ok(B.font.has(ch) || ch === ' ', f + ' glyph ' + ch + ' in ' + s);
  }
}
for (const f of ['sm-core', 'sm-paint', 'sm-engine', 'sm-render', 'sm-audio']) {
  ok(!/\/\/ |\/\*/.test(read('js/apps/sammax/' + f + '.js').replace(/'[^'\n]*'/g, "''")), f + ' has no comments');
}

const page = read('bttf.html');
const srcs = [...page.matchAll(/src="js\/apps\/([^"]+)\.js"/g)].map(m => m[1]);
ok(JSON.stringify(srcs) === JSON.stringify(PAGE_CORE.map(f => 'sammax/' + f).concat(ORDER.map(f => 'bttf/' + f))), 'page loads scripts in test order');
ok(!/<!--/.test(page), 'page has no comments');
ok(/btf-cv/.test(read('css/apps/bttf.css')), 'stylesheet exists');
ok(/test:bttf/.test(read('package.json')), 'npm script exists');

console.log('bttf: ' + checks + ' checks passed in ' + (Date.now() - t0) + ' ms');
