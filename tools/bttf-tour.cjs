const steps = [];
const e = code => steps.push(['eval', code]);
const shot = name => steps.push(['shot', name, '.btf-cv']);
const at = (x, y) => `P(${x}, ${y})`;
const THEMES = ['bt_title', 'bt_dream', 'bt_lab', 'bt_jukebox', 'bt_yard', 'bt_street86', 'bt_edna', 'bt_square', 'bt_kitchen', 'bt_chase', 'bt_lab31', 'bt_night', 'bt_wagon', 'bt_credits'];

e(`(() => {
  window.P = (x, y) => { const r = btui.cv.getBoundingClientRect(); return [r.left + (x + 0.5) / 640 * r.width, r.top + (y + 0.5) / 480 * r.height]; };
  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'E'];
  const T = window.T = { q: [], log: [], cool: 0, n: 0, walks: 0, acts: 0, failed: false };
  const ui = () => btui;
  T.player = g => g.actors[g.player];
  T.calm = g => !g.busy && g.fade <= 0.001 && g.mode === 'room' && !g.cutscene && !(T.player(g) && T.player(g).path);
  T.fail = msg => { T.log.push('FAIL ' + msg); T.failed = true; T.dead = true; T.q = []; };
  T.find = (g, id) => {
    const hits = [];
    for (let y = 4; y < 468; y += 4) for (let x = 2; x < 638; x += 4) { const p = g.pick(x, y); if (p && p.id === id) hits.push([x, y]); }
    if (!hits.length) return null;
    let sx = 0, sy = 0;
    for (const [x, y] of hits) { sx += x; sy += y; }
    sx /= hits.length; sy /= hits.length;
    let best = hits[0], bd = Infinity;
    for (const h of hits) { const d = (h[0] - sx) ** 2 + (h[1] - sy) ** 2; if (d < bd) { bd = d; best = h; } }
    return best;
  };
  T.worldX = (g, id) => {
    const h = g.hotspots().find(q => q.id === id);
    if (h && h.rect) return h.rect[0] + h.rect[2] / 2;
    if (h && h.poly) { let s = 0; for (let i = 0; i < h.poly.length; i += 2) s += h.poly[i]; return s / (h.poly.length / 2); }
    const a = g.actors[id];
    return a && a.room === g.roomId ? a.x : null;
  };
  T.toward = (g, wx) => {
    const m = T.player(g), sx = Math.round(Math.max(24, Math.min(616, wx - g.camX)));
    for (const dy of [0, -8, 8, -16, 16, -24, 24]) { const y = Math.round(m.y + dy); if (y > 4 && y < 466 && !g.pick(sx, y)) return [sx, y]; }
    return [sx, Math.round(m.y)];
  };
  T.drive = (g, d, a) => {
    if (d.kind === 'card' || d.kind === 'doc') { if (d.t > 1.4) { T.cool = 3; return P(320, 240); } return null; }
    if (d.kind === 'circuits') {
      if (!a || a.v !== 'date') return null;
      a.i = a.i || 0;
      const i = KEYS.indexOf(a.s[a.i++]);
      if (a.i >= a.s.length) T.q.shift();
      T.cool = 2;
      return P(440 + (i % 3) * 52 + 23, 300 + Math.floor(i / 3) * 40 + 17);
    }
    if (d.kind === 'fuel') {
      if (!d.cur || d.cur.who !== 'emmett' || d.cur.t < 0.5 || d.out > 0) return null;
      const s = BTTF.games.FUEL_ST.find(q => q.id === d.cur.st);
      T.cool = 2;
      return P(s.x + s.w / 2, s.y + s.h / 2);
    }
    return null;
  };
  T.next = () => {
    const g = btui.g;
    if (!g || btui.screen !== 'game' || btui.menu) return null;
    if (T.cool > 0) { T.cool--; return null; }
    const a = T.q[0];
    if (a && a.v === 'wait') {
      if (a.c(g)) { T.q.shift(); T.n = 0; return null; }
      if (++T.n > (a.max || 1500)) { T.fail('wait ' + a.c + ' in ' + g.roomId); return null; }
    }
    if (g.mode !== 'room' && g.drive) return T.drive(g, g.drive, a);
    if (a && a.v === 'wait') return null;
    if (g.dialog) {
      if (g.busy || !a || a.v !== 'opt') return null;
      const opts = g.dialogOptions(), i = opts.findIndex(o => o.id === a.id);
      if (i < 0) { T.fail('no option ' + a.id + ' in ' + g.dialog.id + ' [' + opts.map(o => o.id).join(',') + ']'); return null; }
      if (i >= 6) { T.fail('option ' + a.id + ' is row ' + (i + 1) + ' in ' + g.dialog.id); return null; }
      T.q.shift(); T.cool = 2; T.acts++;
      return P(170, g.dialogTop() + 10 + i * 18 + 9);
    }
    if (!a) return null;
    if (a.when && !a.when(g)) { T.q.shift(); return null; }
    if (!T.calm(g) || a.v === 'opt') return null;
    if (a.v === 'walk') {
      T.cool = 3;
      if (a.x - g.camX < 8 || a.x - g.camX > 632) return P(...T.toward(g, a.x));
      T.q.shift();
      return P(a.x - g.camX, a.y);
    }
    if (a.item && g.held !== a.item && g.invOpen) {
      if (g.pocketT < 0.98) return null;
      const i = g.inv.indexOf(a.item);
      if (i < 0) { T.fail('no item ' + a.item + ' in ' + g.inv.join(',')); return null; }
      T.cool = 2;
      return P(12 + i * 54 + 25, Math.round(g.pocketY) + 30);
    }
    if (g.invOpen) return [...P(320, 200), null];
    if (g.pocketT > 0.02) return null;
    const p = T.find(g, a.id);
    if (!p) {
      if (g.held) return [...P(320, 200), 'right'];
      const wx = T.worldX(g, a.id);
      if (wx == null || ++T.walks > 12) { T.fail('cannot reach ' + a.id + ' in ' + g.roomId); return null; }
      T.cool = 3;
      return P(...T.toward(g, wx));
    }
    if (a.item && g.held !== a.item) return [...P(320, 479), null];
    const v = g.primary(g.pick(p[0], p[1]));
    if (a.v !== 'look' && !a.item && v !== a.v) T.log.push('verb ' + a.id + ': ' + v + ' for ' + a.v);
    T.q.shift(); T.cool = 3; T.walks = 0; T.acts++;
    return a.v === 'look' ? [...P(p[0], p[1]), 'right'] : P(p[0], p[1]);
  };
  T.done = () => {
    const g = btui.g;
    if (T.failed || T.dead || btui.screen === 'credits' || btui.screen === 'title') return true;
    if (!g || T.q.length || T.cool > 0) return false;
    return g.ended || g.mode !== 'room' || (!g.busy && g.fade <= 0.001 && !(T.player(g) && T.player(g).path));
  };
  T.tick = () => new Promise(r => setTimeout(r, 40));
  T.report = () => {
    const g = btui.g, errs = g ? g.log.filter(l => l.startsWith('script error')) : [];
    const out = (g ? g.roomId + ' ch' + g.f.chapter + ' mode=' + g.mode + (g.drive ? '/' + g.drive.kind : '') + ' inv=' + g.inv.join(',') : 'screen=' + btui.screen) + ' acts=' + T.acts + (T.log.length ? ' LOG ' + T.log.join(' | ') : '') + (errs.length ? ' ERR ' + errs.join(' | ') : '');
    T.log = []; T.acts = 0;
    return out;
  };
  const W = (c, max) => ({ v: 'wait', c, max });
  const A = (id, item) => ({ v: 'act', id, item });
  const U = (id, item) => ({ v: 'use', id, item });
  const L = id => ({ v: 'look', id });
  const X = id => ({ v: 'exit', id });
  const K = id => ({ v: 'talk', id });
  const O = (...ids) => ids.map(id => ({ v: 'opt', id }));
  const cine = () => W(g => g.drive && g.drive.kind === 'cine' && g.drive.t > 0.8);
  const room = id => W(g => g.roomId === id && T.calm(g) && !g.dialog, 4000);
  T.SEG = {
    prologue: [W(g => g.dialog && !g.busy, 4000)],
    film: [...O('disint', 'built'), W(g => !g.dialog && T.calm(g)), U('toolbox'), cine()],
    lab: [room('lab')],
    model: [X('back'), U('model'), W(g => g.f.biffHasCourt && T.calm(g))],
    amp: [X('out'), U('box'), U('amp', 'guitar'), K('george'), ...O('fight', 'bye'), { v: 'use', id: 'dials', when: g => !g.f.ampMax }, U('amp', 'guitar'), W(g => g.f.biffBlasted && T.calm(g))],
    notebook: [U('court'), W(g => g.has('notebook') && T.calm(g), 4000), U('can'), X('door'), room('yard')],
    car: [U('car'), room('car'), U('recorder'), W(g => g.f.tapeHeard && T.calm(g), 4000), U('shoe')],
    skate: [U('dog', 'shoe'), cine()],
    street: [room('street86'), K('window'), ...O('gift', 'bye'), U('buzzer', 'shoe'), room('edna86')],
    edna: [W(g => g.actors.ednaOld.room === 'edna86' && T.calm(g), 3000), K('ednaOld'), ...O('shoe', 'where', 'papers', 'bye'), U('binoc'), W(g => g.drive && g.drive.kind === 'card' && g.drive.t > 0.6)],
    papers: [W(g => g.actors.ednaOld.room === 'edna86' && T.calm(g), 3000), L('photos'), L('photos'), U('valve'), W(g => g.actors.ednaOld.room !== 'edna86'), U('papers'), W(g => g.drive && g.drive.kind === 'doc' && g.drive.t > 0.6)],
    dress: [room('yard'), X('garage'), U('clothes'), W(g => g.f.dressed && T.calm(g)), X('door'), ...O('play', 'bye'), W(g => !g.dialog && T.calm(g)), U('fusion', 'can'), U('car'), { v: 'use', id: 'switch', when: g => !g.f.circuitsOn }, U('keypad'), W(g => g.drive && g.drive.kind === 'circuits'), { v: 'date', s: '061319' }],
    date: [{ v: 'date', s: '31E' }, cine()],
    arrival: [W(g => g.roomId === 'square' && g.dialog && !g.busy, 6000)],
    alias: [...O('fan', 'n1', 'day'), W(g => !g.dialog && T.calm(g)), L('lawsign'), K('jail'), ...O('car', 'family', 'break', 'where', 'bye'), W(g => !g.dialog && T.calm(g))],
    kitchen: [X('kitchen'), W(g => g.f.kidSeen && T.calm(g), 4000), U('phone', 'number'), W(g => g.f.butler && T.calm(g))],
    emmett: [X('out'), U('courthouse'), W(g => g.f.emmettMet && T.calm(g)), K('emmett'), ...O('sci', 'drill', 'bye'), U('emmett', 'recorder'), W(g => g.f.mutter && T.calm(g), 4000)],
    hamilton: [K('jail'), ...O('tape', 'bye'), K('emmett'), ...O('ham', 'need1', 'need2', 'tonight', 'bye'), W(g => g.f.emmettHelps && T.calm(g) && !g.dialog)],
    soup: [K('edna'), ...O('scoop', 'sss', 'meet', 'soup', 'help', 'bike', 'bye'), X('kitchen'), W(g => g.f.barrels && T.calm(g), 4000), { v: 'walk', x: 110, y: 440 }, W(g => g.f.signal && T.calm(g), 4000), K('emmett'), ...O('door', 'bye'), K('cueball'), ...O('barrel', 'soup', 's1'), U('pipe', 'recorder'), W(g => g.f.ednaHooch && T.calm(g), 4000)],
    charity: [X('out'), K('edna'), ...O('charity', 'forget'), W(g => g.f.hoochSent && T.calm(g) && !g.dialog)],
    hat: [K('kid'), ...O('shine', 'artie', 'hat', 'nuts', 'what'), W(g => g.has('hat') && T.calm(g) && !g.dialog), U('einstein', 'hat'), room('arthur'), U('buzzer'), W(g => g.f.arthurRefused && T.calm(g))],
    chase: [X('out'), K('kid'), W(g => g.drive && g.drive.kind === 'cine' && g.drive.t > 1.5, 4000)],
    bandstand: [room('bandstand'), U('kid', 'recorder'), W(g => g.f.kidTaped || T.calm(g)), K('einstein'), room('square')],
    artie: [X('west'), U('window', 'recorder'), W(g => g.f.arthurOut && T.calm(g), 4000), U('artie', 'subpoena'), W(g => g.drive && g.drive.kind === 'fuel' && g.drive.done >= 4, 6000)],
    patent: [W(g => g.dialog && g.dialog.id === 'patent' && !g.busy, 9000)],
    night: [...O('soon'), W(g => g.f.night && g.f.jailFailed && T.calm(g) && !g.dialog, 9000)],
    rocket: [U('rocket'), U('bike', 'rocket'), W(g => g.drive && g.drive.kind === 'cine' && g.drive.t > 1.2, 4000)],
    wagon: [room('wagonb'), X('gowagonr'), U('box'), U('antenna'), X('gowagonb'), X('gowagonl'), U('spare', 'iron'), U('cab', 'antenna'), W(g => T.calm(g) && !g.dialog)],
    keys: [X('gowagonb'), K('window'), ...O('distract', 'bye'), X('gowagonl'), U('cab', 'antenna'), W(g => g.has('keys') && T.calm(g))],
    doors: [X('gowagonb'), U('lock', 'keys'), U('kidgun', 'hubcap'), U('gun'), U('chains', 'gun'), K('window'), ...O('throttle'), W(g => g.drive && g.drive.kind === 'cine' && g.drive.t > 1, 6000)],
    finale: [W(g => g.drive && g.drive.kind === 'cine' && g.drive.i === g.drive.shots.length - 1 && g.drive.t > 1.5, 9000)],
    credits: [W(() => btui.screen === 'credits', 9000)]
  };
  T.load = id => { if (T.dead) return 'skipped ' + id; T.q = T.SEG[id].map(a => Object.assign({}, a)); T.failed = false; T.n = 0; T.walks = 0; return id + ': ' + T.q.length + ' actions'; };
  const step0 = btui.step.bind(btui);
  T.speed = 1;
  btui.step = dt => { for (let i = 0; i < T.speed; i++) step0(dt); };
  try { localStorage.removeItem('bttf_saves'); } catch (err) { return 'no storage'; }
  return 'canvas ' + btui.cv.style.width + ' x ' + btui.cv.style.height;
})()`);

const seg = (id, name, speed) => {
  e(`T.speed = ${speed || 4}; T.load(${JSON.stringify(id)})`);
  steps.push(['loop', 'T.done()', 'T.next()', 'T.tick()', 9000]);
  e('T.report()');
  if (name) shot(name);
};

steps.push(['sleep', 900]);
shot('01-title');
steps.push(['move', 'P(320, 300 + 26 * btui.titleItems().findIndex(i => i.id === "new") + 11)']);
steps.push(['sleep', 300]);
shot('02-title-hover');
steps.push(['click', 'P(320, 300 + 26 * btui.titleItems().findIndex(i => i.id === "new") + 11)']);
steps.push(['sleep', 1800]);
shot('03-prologue-camera');
seg('prologue', '04-prologue-doc', 3);
seg('film', '05-nightmare');
seg('lab', '06-lab');
e(`(() => {
  const g = btui.g, r = btui.r, img = btui.img.data;
  const t0 = performance.now();
  r.bgCache.clear();
  r.render(g);
  const first = performance.now() - t0;
  const t1 = performance.now();
  const cam = g.camX, time = g.time;
  for (let i = 0; i < 120; i++) { g.camX = (i * 4) % 480; g.time += 1 / 30; r.render(g); r.toRGBA(g, img); }
  g.camX = cam; g.time = time;
  return 'lab bg paint ' + first.toFixed(1) + ' ms, frame ' + ((performance.now() - t1) / 120).toFixed(2) + ' ms';
})()`);
steps.push(['move', 'T.find(btui.g, "clocks") ? P(...T.find(btui.g, "clocks")) : P(320, 200)']);
steps.push(['sleep', 300]);
shot('07-hover-label');
seg('model', '08-model');
seg('amp', '09-biff-blasted');
seg('notebook', '10-yard');
steps.push(['move', 'P(320, 479)']);
steps.push(['sleep', 700]);
shot('11-pockets');
steps.push(['move', 'P(320, 200)']);
seg('car', null);
seg('skate', '12-skate');
seg('street', '13-edna86');
seg('edna', '14-binoculars');
seg('papers', '15-newspaper');
seg('dress', '16-keypad');
seg('date', '17-highway');
seg('arrival', '18-interview');
seg('alias', '19-square');
e('btui.root.focus(); "canSave=" + btui.g.canSave()');
steps.push(['key', 'F5', 'F5', 116]);
steps.push(['sleep', 400]);
steps.push(['move', at(120, 74)]);
steps.push(['sleep', 300]);
shot('20-save');
steps.push(['click', at(120, 74)]);
steps.push(['sleep', 600]);
e('JSON.stringify(Object.keys(JSON.parse(localStorage.getItem("bttf_saves") || "{}"))) + " menu=" + !!btui.menu');
seg('kitchen', '21-kitchen');
seg('emmett', '22-emmett');
seg('hamilton', null);
seg('soup', '23-hooch');
seg('charity', null);
seg('hat', '24-arthur');
seg('chase', '25-chase');
seg('bandstand', null);
seg('artie', '26-fuel');
seg('patent', '27-patent');
seg('night', '28-night-square');
seg('rocket', '29-rocket');
seg('wagon', '30-wagon-left');
seg('keys', null);
seg('doors', '31-docfree');
seg('finale', '32-finale');
seg('credits', null, 6);
steps.push(['sleep', 1500]);
shot('33-credits');
e(`(async () => {
  const out = [];
  for (const id of ${JSON.stringify(THEMES)}) {
    btui.audio.music(id);
    await new Promise(r => setTimeout(r, 1500));
    const pos = btui.audio.position();
    out.push(id + (pos && pos.id === id && pos.t > 0.3 ? ' ok' : ' SILENT ' + (btui.audio.ctx ? btui.audio.ctx.state : 'no ctx')));
  }
  btui.audio.music(null);
  return out.join(' ');
})()`);
e('location.reload(); "reload"');
steps.push(['sleep', 4000]);
e(`(() => { window.P = (x, y) => { const r = btui.cv.getBoundingClientRect(); return [r.left + (x + 0.5) / 640 * r.width, r.top + (y + 0.5) / 480 * r.height]; }; return btui.titleItems().map(i => i.id).join(','); })()`);
shot('34-title-continue');
steps.push(['click', 'P(320, 300 + 26 * btui.titleItems().findIndex(i => i.id === "load") + 11)']);
steps.push(['sleep', 500]);
steps.push(['move', at(120, 110)]);
steps.push(['sleep', 300]);
shot('35-load');
steps.push(['click', at(120, 110)]);
steps.push(['sleep', 2000]);
e('btui.g ? btui.g.roomId + " dressed=" + btui.g.f.dressed + " alias=" + btui.g.f.alias + " inv=" + btui.g.inv.join(",") : "no game"');
shot('36-loaded');

module.exports = { page: 'bttf.html', ready: '!!window.btui', noHelpers: true, size: '1400,1200', steps };
