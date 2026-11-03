const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

console.log('--- Testing HSR 98 visits ---');

const ROOT = path.join(__dirname, '..');
const noop = () => {};
function makeCanvas(w = 300, h = 150) {
  const cv = { width: w, height: h, style: {}, className: '', addEventListener: noop, removeEventListener: noop, getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 480 }), toBlob: cb => cb(new Blob(['PNGDATA'])), toDataURL: () => 'data:image/jpeg;base64,AA' };
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

const store = new Map(), sockets = [];
class FakeSocket {
  constructor(url) { this.url = url; this.readyState = 0; this.sent = []; sockets.push(this); }
  send(text) { this.sent.push(JSON.parse(text)); }
  close() { this.readyState = 3; }
  open() { this.readyState = 1; this.onopen(); }
  hear(m) { this.onmessage({ data: JSON.stringify(m) }); }
  drop() { this.readyState = 3; this.onclose({ code: 1006 }); }
}
Object.assign(globalThis, {
  document: { createElement: () => makeCanvas() },
  localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
  requestAnimationFrame: () => 1,
  Image: class { constructor() { this.complete = false; } },
  addEventListener: noop,
  WebSocket: FakeSocket
});

const html = fs.readFileSync(path.join(ROOT, 'hsr98.html'), 'utf8');
require(path.join(ROOT, 'js', 'bugreport-core.js'));
require(path.join(ROOT, 'js', 'net98.js'));
for (const m of html.matchAll(/<script src="(js\/apps\/hsr98\/[^"]+)"><\/script>/g)) require(path.join(ROOT, m[1]));
const H = globalThis.Hsr98, Net = globalThis.Net98;

const root = { classList: { add: noop }, set innerHTML(v) { this.html = v; }, appendChild: noop, addEventListener: noop, removeEventListener: noop, focus: noop };
const ui = new H.UI(root, { onExit: noop });
ui.running = false;
const frame = (n = 1) => { for (let i = 0; i < n; i++) { ui.update(0.05); ui.render(); } };
const key = (code, extra) => { ui.keydown(Object.assign({ code, repeat: false, preventDefault: noop }, extra)); ui.held = ui.held.filter(k => k !== code); };
const drawn = [];
const realText = ui.text;
ui.text = function (str, ...rest) { drawn.push(String(str)); return realText.call(this, str, ...rest); };
const see = () => { drawn.length = 0; frame(); return drawn.join(' | '); };
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

const live = () => sockets[sockets.length - 1];
const sentOf = op => live().sent.filter(m => m.op === op);
const HOST = '711111111';
const friendRow = (uid, name, o) => Object.assign({ uid, name, gender: 'f', tl: 40, avatar: { k: 'kafka', o: null, lvl: 60, eid: 0 }, on: true, status: { c: 'express' }, ago: 0, fav: false, sign: 'Pink', show: [], merits: [], expr: true }, o);
const snapshot = o => Object.assign({ op: 'friends', list: [friendRow(HOST, 'Kaia')], in: [], out: [], blocks: [], recent: [], settings: { reqs: 'all', guests: 'friends' }, max: 100, favMax: 3 }, o);
const express = o => Object.assign({ flags: ['doom', 'ending', 'asta_met', 'not_a_real_flag'], party: ['trail', 'march'], roster: [['trail', 50, 0, null], ['march', 50, 0, null], ['kafka', 70, 2, null], ['clara', 44, 0, null], ['__proto__', 1, 1, null], ['nobody', 1, 1, null]], record: 'menu', lead: { k: 'kafka', o: null, lvl: 70, eid: 2 } }, o);
const visitMsg = o => Object.assign({ op: 'visit', uid: HOST, name: 'Kaia', gender: 'f', sign: 'Pink Lavender', on: false, express: express(), book: [], peers: [] }, o);

(async () => {
  ui.newGame();
  frame(10);
  const home = ui.game;
  home.script = null;
  home.pending = null;
  home.state.flags.express_intro = true;
  home.state.name = 'Finlay';
  home.addChar('clara', 30);
  home.state.credits = 1000;
  ui.screens = [];
  frame();

  {
    const names = H.netExpressFlags();
    assert.ok(names.includes('doom') && names.includes('ending') && names.includes('fm_letter') && names.includes('fm_board'), 'flags come from the cars, records, guests and photos');
    assert.ok(!names.some(f => /^[?$!]/.test(f)), 'no quest or item tokens');
    const data = home.netExpress();
    assert.ok(Array.isArray(data.flags) && data.party.length && data.roster.length);
    assert.ok(!data.flags.includes('express_intro') || names.includes('express_intro'), 'only listed flags travel');
    for (const id of Object.keys(H.CHARS)) home.state.roster[id] = home.state.roster[id] || { lvl: 80, exp: 0, eid: 6, cone: null, relics: {}, hp: null, energy: 0 };
    for (const f of names) home.state.flags[f] = true;
    const big = home.netExpress();
    assert.ok(JSON.stringify(big).length < 4096, 'the fullest Express still fits: ' + JSON.stringify(big).length);
    assert.ok(!big.roster.some(r => H.labOnly(r[0])), 'the secret heroes stay secret');
    for (const f of names) if (f !== 'express_intro') delete home.state.flags[f];
    for (const id of Object.keys(home.state.roster)) if (id !== 'trail' && id !== 'clara' && !home.state.party.includes(id)) delete home.state.roster[id];
    console.log('✓ what the Express publishes');
  }

  ui.writeSave('auto');
  Net.setConsent(true);
  live().open();
  live().hear({ op: 'me', uid: Net.uid(), table: null });
  live().hear(snapshot());
  frame(2);

  {
    const scr = ui.openFriends(0);
    assert.ok(see().includes('В гости'), 'the row has the button');
    scr.sel = 1;
    key('KeyG');
    assert.deepEqual(sentOf('visitEnter').pop().uid, HOST, 'G goes visiting');
    assert.ok(sentOf('visitEnter').pop().look, 'with the look of my leader');
    const n0 = sentOf('visitEnter').length;
    scr.sel = 0;
    key('KeyG');
    assert.equal(sentOf('visitEnter').length, n0, 'Leveling_Solo lets nobody in');
    scr.sel = 1;
    key('Enter');
    assert.ok(ui.top().friendMenu);
    const text = see();
    assert.ok(text.includes('В гости') && text.includes('Позвать к себе'));
    ui.top().sel = ui.top().items().findIndex(it => it.id === 'home');
    key('Enter');
    assert.deepEqual(sentOf('invite').pop(), { op: 'invite', uid: HOST, kind: 'visit' });
    assert.equal(ui.visitGo(friendRow('722222222', 'Old', { expr: false })), false, 'no Express yet');
    assert.ok(ui.toasts.some(t => t.text === 'Экспресс ещё не приехал'));
    live().hear({ op: 'visitNo', code: 'closed' });
    assert.ok(ui.toasts.some(t => t.text === 'Хозяин не принимает гостей'));
    live().hear({ op: 'visitNo', code: 'full' });
    assert.ok(ui.toasts.some(t => t.text === 'В вагоне уже три гостя'));
    assert.equal(ui.game, home, 'a refusal stays at home');
    ui.screens = [];
    console.log('✓ the way in');
  }

  const saveKey = Array.from(store.keys()).find(k => k.endsWith('auto') && k !== 'net98.account');
  assert.ok(saveKey, 'an autosave exists');
  const credits0 = home.state.credits;

  {
    const asked = home.state.flags.net_visited;
    assert.ok(!asked);
    ui.openFriends(0);
    live().hear(visitMsg());
    const g = ui.game;
    assert.notEqual(g, home, 'a temporary game');
    assert.equal(g.guest.uid, HOST);
    assert.equal(ui.homeGame, home);
    assert.equal(ui.screens.length, 0);
    assert.equal(g.map.id, 'express');
    assert.equal(g.state.name, 'Finlay', 'my name');
    assert.deepEqual(g.state.party, ['trail', 'march'], 'the party of the host');
    assert.equal(g.state.record, 'menu', 'the record of the host');
    assert.equal(g.mapMusic(g.map.def), 'menu');
    assert.ok(g.state.flags.doom && g.state.flags.ending && g.state.flags.asta_met);
    assert.ok(!g.state.flags.not_a_real_flag, 'unknown flags stay out');
    assert.ok(g.state.roster.kafka && g.state.roster.clara && !g.state.roster.nobody);
    assert.ok(!Object.prototype.hasOwnProperty.call(g.state.roster, '__proto__'), 'names are checked');
    assert.equal(g.state.credits, 500, 'the wallet of the host stays away');
    assert.ok(g.script || g.pending, 'the first visit has a note');
    frame(2);
    key('Enter');
    frame(2);
    key('Enter');
    frame(2);
    assert.ok(!g.busy());
    assert.ok(home.state.flags.net_visited, 'the note shows once');

    const savedDuring = store.get(saveKey);
    assert.equal(ui.writeSave('auto'), false, 'a visit never saves');
    g.events.push({ t: 'autosave' });
    frame();
    g.state.credits = 99999;
    assert.equal(store.get(saveKey), savedDuring, 'nothing reached the storage');
    assert.equal(JSON.stringify(ui.bugSave().state), JSON.stringify(home.serialize()), 'a report gets the real save');

    const jade = g.state.jade;
    key('F7');
    assert.equal(g.state.jade, jade, 'F7 is closed');
    key('F8');
    assert.equal(ui.screens.length, 0, 'F8 is closed');
    assert.deepEqual(ui.netStatusNow(), { c: 'visit' });

    const toastsOf = () => ui.toasts.map(t => t.text).join(' / ');
    const touch = (x, y, dir, shift) => { g.placePlayer(x, y); g.player.dir = dir; g.script = null; g.pending = null; ui.dlg = null; return g.interact({ shift }); };
    const ent = pred => { const e = g.map.ents.find(pred); assert.ok(e); return e; };
    const stand = (e, shift) => {
      const dirs = [[0, 1, 'up'], [0, -1, 'down'], [1, 0, 'left'], [-1, 0, 'right']];
      for (const [dx, dy, dir] of dirs) if (!g.blocked(e.x + dx, e.y + dy)) return touch(e.x + dx, e.y + dy, dir, shift);
      assert.fail('nowhere to stand near ' + e.x + ',' + e.y);
    };
    assert.ok(stand(ent(e => e.def && e.def.who === 'pompom')));
    assert.equal(g.pending.spk, 'pompom', 'Pom-Pom talks to the guest');
    assert.match(g.pending.text, /[Бб]илет|Пом-Пом/);
    assert.ok(stand(ent(e => e.def && e.def.who === 'himeko')));
    assert.equal(g.pending.spk, 'himeko');
    assert.ok(stand(ent(e => e.def && e.def.script === 'warp_terminal')));
    assert.ok(!g.busy());
    frame();
    assert.ok(toastsOf().includes('Терминал отвечает только хозяину'), 'terminals refuse');
    assert.ok(stand(ent(e => e.def && e.def.script === 'exp_synth')));
    assert.ok(!g.busy(), 'the synthesizer refuses');
    assert.ok(stand(ent(e => e.def && e.def.script === 'exp_phono')));
    frame();
    assert.ok(toastsOf().includes('чужая коллекция'), 'the record player refuses');
    assert.ok(stand(ent(e => e.kind === 'anchor')) === true);
    assert.ok(!g.pending, 'the anchor refuses');
    assert.ok(stand(ent(e => e.def && e.def.script === 'exp_guestbook')));
    assert.ok(g.script || g.pending, 'the guest book opens');
    g.script = null; g.pending = null; ui.dlg = null;

    g.loadMap('express_party', 'r');
    frame(2);
    assert.equal(g.map.id, 'express_party');
    assert.ok(ui.banner && ui.banner.text.includes('Вагон для вечеринок'), 'the car name still shows');
    assert.ok(stand(ent(e => e.def && e.def.shift === 'exp_lab_door'), true));
    frame();
    assert.ok(toastsOf().includes('Замок пускает только хозяина'), 'no way to the lab');
    const visitor = g.map.ents.find(e => e.def && e.def.visit);
    assert.ok(visitor, 'a guest of the host sits in the party car');
    assert.ok(stand(visitor));
    assert.equal(g.pending.type, 'say', 'and talks as usual');
    g.script = null; g.pending = null; ui.dlg = null;

    g.loadMap('express_cabin', 'l');
    assert.ok(stand(ent(e => e.def && e.def.script === 'exp_march_bed')));
    assert.ok(g.script || g.pending, 'allowed things can be looked at');
    g.script = null; g.pending = null; ui.dlg = null;
    assert.ok(stand(ent(e => e.def && e.def.script === 'exp_databank')));
    assert.ok(!g.busy(), 'the data bank refuses');
    g.loadMap('express', 'r');
    g.script = null; g.pending = null;
    frame();
    console.log('✓ the guest game: nothing saves, only the list of things works');

    assert.ok(see().includes('В гостях: Kaia'), 'the HUD says where I am');
    const onKeys = (code, want) => { const n = ui.screens.length; key(code); assert.equal(ui.screens.length, n, code + ' does nothing'); assert.equal(g.state.map, want); };
    onKeys('KeyM', 'express');
    onKeys('KeyF', 'express');
    onKeys('KeyE', 'express');
    onKeys('Digit1', 'express');
    key('Tab');
    assert.ok(ui.top().visitMenu, 'Tab opens the visit menu');
    key('Escape');
    assert.equal(ui.screens.length, 0);
    key('Escape');
    assert.ok(ui.top().visitMenu, 'Esc too');
    const text = see();
    assert.ok(text.includes('Вернуться на свой Экспресс') && text.includes('Профиль хозяина'));
    ui.top().sel = ui.top().rows().findIndex(r => r.id === 'host');
    key('Enter');
    assert.ok(ui.top().friendProfile, 'the profile of the host opens during a visit');
    assert.ok(see().includes('Kaia'));
    assert.deepEqual(sentOf('cardOf').pop(), { op: 'cardOf', uid: HOST });
    key('KeyG');
    assert.ok(ui.toasts.some(t => t.text === 'Сначала вернитесь на свой Экспресс'), 'a visit from a visit is refused');
    key('Escape');
    assert.equal(ui.screens.length, 0);

    g.placePlayer(19, 7);
    g.player.dir = 'right';
    assert.ok(ui.visitEchoShown(), 'the host is away: an echo stands there');
    assert.ok(see().includes('Kaia'));
    key('Enter');
    assert.equal(g.pending.type, 'say');
    assert.match(g.pending.text, /Pink Lavender/, 'the echo shows the signature');
    g.script = null; g.pending = null; ui.dlg = null;
    frame();

    const posBefore = sentOf('pos').length;
    Net.room.peers.set('733333333', { uid: '733333333', name: 'Mio', gender: 'f', look: { k: 'bronya', o: null, lvl: 1, eid: 0 }, host: false, m: null });
    live().hear({ op: 'peerIn', peer: { uid: '733333333', name: 'Mio', gender: 'f', look: { k: 'bronya', o: null, lvl: 1, eid: 0 }, host: false, m: null } });
    await pause(140);
    frame(4);
    assert.ok(sentOf('pos').length > posBefore, 'my place goes out');
    assert.equal(sentOf('pos').pop().m, 'express');
    assert.ok(!ui.toasts.some(t => t.text.startsWith('Гость в вашем')), 'a guest gets no host note');
    live().hear({ op: 'pos', uid: '733333333', m: 'express', x: 25, y: 7, d: 'left', w: false });
    frame();
    const mio = Net.room.peers.get('733333333');
    assert.equal(mio.fx, 25);
    assert.ok(see().includes('Mio'), 'another guest is seen');
    live().hear({ op: 'pos', uid: '733333333', m: 'express', x: 24, y: 7, d: 'left', w: false });
    frame();
    assert.ok(mio.fx < 25 && mio.fx > 24, 'and walks tile by tile');
    frame(10);
    assert.equal(mio.fx, 24);
    live().hear({ op: 'pos', uid: '733333333', m: 'express_cabin', x: 3, y: 9, d: 'left', w: false });
    assert.ok(!see().includes('Mio'), 'someone in another car is not drawn');
    live().hear({ op: 'pos', uid: '733333333', m: 'express', x: 20, y: 8, d: 'up', w: false });
    frame(3);
    g.placePlayer(20, 9);
    g.player.dir = 'up';
    frame();
    assert.ok(g.blocked(20, 8) === false, 'figures do not block');
    key('Enter');
    const peerMenu = ui.top();
    assert.ok(peerMenu.visitPeer, 'Space near a figure opens its menu');
    assert.ok(see().includes('В друзья') && !drawn.includes('Профиль'), 'a stranger can be added');
    peerMenu.sel = peerMenu.rows().findIndex(r => r.id === 'add');
    key('Enter');
    assert.deepEqual(sentOf('req').pop(), { op: 'req', uid: '733333333' });
    assert.equal(ui.screens.length, 0);

    key('KeyT');
    assert.ok(ui.top().visitPhrases, 'T opens the phrases');
    assert.ok(see().includes('Кофе Химико не пей'));
    key('Digit3');
    assert.deepEqual(sentOf('visitSay').pop(), { op: 'visitSay', id: 2 });
    assert.equal(ui.screens.length, 0);
    const sayN = sentOf('visitSay').length;
    key('KeyT');
    key('Digit1');
    assert.equal(sentOf('visitSay').length, sayN, 'not more often than once a second');
    live().hear({ op: 'visitSay', uid: Net.uid(), id: 2 });
    assert.equal(ui.visitMine.text, 'Пом!');
    assert.ok(see().includes('Пом!'), 'my own bubble');
    live().hear({ op: 'visitSay', uid: '733333333', id: 0 });
    assert.ok(see().includes('Привет!'), 'the bubble of another');
    live().hear({ op: 'visitSay', uid: '733333333', id: 99 });
    live().hear({ op: 'peerOut', uid: '733333333' });
    assert.ok(!Net.room.peers.has('733333333'), 'gone');
    console.log('✓ figures, marks of presence and phrases');

    live().hear({ op: 'book', uid: HOST, list: [{ at: Date.UTC(2026, 10, 1), uid: '744444444', name: 'Ann', text: 'Hello <b>there</b>' }, { at: Date.UTC(2026, 10, 1), uid: '755555555', name: 'Bob', id: 2 }] });
    const pages = g.bookPages('guests');
    assert.ok(pages[0].who.startsWith('Ann') && pages[0].text === 'Hello bthere/b', 'markup is cleaned: ' + pages[0].text);
    assert.equal(pages[1].text, H.NET.WISHES[2], 'a ready wish comes by its number');
    assert.ok(pages.length > 2 && pages.some(p => p.who === 'Герта'), 'the crew pages of the host follow');
    ui.openBook('guests', null);
    assert.ok(see().includes('оставить запись'), 'the book offers an entry');
    key('KeyR');
    const sign = ui.top();
    assert.ok(sign.visitSign);
    sign.sel = 1;
    key('Enter');
    assert.deepEqual(sentOf('bookSign').pop(), { op: 'bookSign', id: 1 });
    key('KeyR');
    const sign2 = ui.top();
    sign2.sel = sign2.rows().findIndex(r => r.id === 'own');
    key('Enter');
    const entry = ui.top();
    assert.ok(entry.textEntry);
    entry.submit();
    assert.equal(entry.note.ok, false, 'an empty entry is refused');
    entry.value = 'Привет от меня';
    entry.submit();
    assert.deepEqual(sentOf('bookSign').pop(), { op: 'bookSign', text: 'Привет от меня' });
    assert.ok(!ui.screens.some(s => s.visitSign || s.textEntry), 'back at the book');
    live().hear({ op: 'socialError', code: 'bookDay' });
    assert.ok(ui.toasts.some(t => t.text.includes('уже писали')));
    live().hear({ op: 'book', uid: HOST, list: [{ at: Date.UTC(2026, 10, 1), uid: Net.uid(), name: 'Finlay', text: 'Новая запись' }] });
    assert.ok(see().includes('«Новая запись»'), 'an open book follows the changes');
    ui.screens = [];
    g.pending = null;
    console.log('✓ the guest book of a visit');

    live().hear({ op: 'gift', id: 'g1', credits: 2000, from: 'Kaia' });
    frame(3);
    assert.equal(home.state.credits, credits0, 'a gift waits during the visit');
    assert.equal(sentOf('giftAck').length, 0);

    live().hear({ op: 'visitRecord', record: 'station' });
    assert.equal(g.state.record, 'station', 'the host changed the record');
    live().hear({ op: 'visitRecord', record: 'no_such_record' });
    assert.equal(g.state.record, null);

    const sock = live();
    sock.drop();
    assert.equal(Net.room, null);
    assert.ok(see().includes('Связь потеряна'), 'a lost link shows');
    assert.equal(g.guest.lead.k, 'kafka', 'the echo keeps its look without the link');
    assert.equal(ui.game, g, 'but the visit stays');
    assert.equal(ui.top(), undefined);
    Net.connect();
    live().open();
    live().hear({ op: 'me', uid: Net.uid(), table: null });
    assert.deepEqual(sentOf('visitEnter').pop().uid, HOST, 'the visit comes back by itself');
    live().hear(visitMsg());
    assert.equal(ui.game, g, 'in the same game');
    assert.ok(Net.room);
    live().drop();
    ui.visitLostT = 16;
    frame();
    assert.ok(ui.top().visitLost, 'a long silence offers the way home');
    key('ArrowDown');
    key('Enter');
    assert.equal(ui.game, g, 'one can wait');
    ui.visitLostT = 0;
    ui.visitLostAsked = false;
    ui.visitLostT = 16;
    frame();
    assert.ok(ui.top().visitLost);
    key('Enter');
    assert.equal(ui.game, home, 'home without the link');
    assert.equal(ui.homeGame, null);
    assert.equal(ui.screens.length, 0);
    assert.equal(ui.mode, 'field');
    assert.equal(store.get(saveKey), savedDuring, 'the save is the same to the byte');
    assert.equal(JSON.parse(store.get(saveKey)).state.credits, credits0, 'nothing of the visit came along');
    console.log('✓ the link and the way home');
  }

  {
    Net.connect();
    live().open();
    live().hear({ op: 'me', uid: Net.uid(), table: null });
    live().hear(snapshot());
    assert.equal(home.state.netGifts, undefined);
    live().hear({ op: 'gift', id: 'g2', credits: 2000, from: 'Kaia' });
    live().hear({ op: 'gift', id: 'g2', credits: 2000, from: 'Kaia' });
    const was = home.state.credits;
    frame();
    assert.equal(home.state.credits, was + 2000, 'a gift lands at home, once');
    assert.deepEqual(home.state.netGifts, ['g2']);
    assert.ok(ui.toasts.some(t => t.text === 'Гостинец от Kaia: 2 000 кредитов' || t.text.startsWith('Гостинец от Kaia')));
    assert.deepEqual(sentOf('giftAck'), [{ op: 'giftAck', id: 'g2' }], 'and is answered');
    assert.deepEqual(JSON.parse(store.get(saveKey)).state.netGifts, ['g2'], 'and saved before the answer');
    live().hear({ op: 'gift', id: 'g2', credits: 2000, from: 'Kaia' });
    frame();
    assert.equal(home.state.credits, was + 2000, 'a lost answer does not pay twice');
    assert.equal(sentOf('giftAck').length, 2, 'it is answered again');
    live().hear({ op: 'gift', id: 'g3', credits: 999999, from: 'Cheat' });
    frame();
    assert.equal(home.state.credits, was + 4000, 'the sum is capped on the client');
    live().hear({ op: 'gift', id: 'g4', credits: 'x', from: 'Bad' });
    frame();
    assert.equal(home.state.credits, was + 4000, 'nonsense pays nothing');
    home.script = { steps: ['|...'], pc: 0, labels: {} };
    live().hear({ op: 'gift', id: 'g5', credits: 2000, from: 'Kaia' });
    ui.visitHomeNotes();
    assert.equal(home.state.credits, was + 4000, 'a scene keeps it waiting');
    home.script = null;
    home.pending = null;
    ui.dlg = null;
    frame(3);
    assert.equal(home.state.credits, was + 6000);
    live().hear({ op: 'awayGuests', names: ['Kaia', 'Finlay'] });
    frame();
    assert.ok(ui.toasts.some(t => t.text === 'Пока вас не было, заходили: Kaia, Finlay'), 'visitors while away are named');
    console.log('✓ gifts');
  }

  {
    const g = ui.game;
    assert.ok(!g.guest);
    g.loadMap('express', 'a');
    g.script = null; g.pending = null; ui.dlg = null;
    frame();
    live().hear({ op: 'peerIn', peer: { uid: '744444444', name: 'Ann', gender: 'f', look: null, host: false, m: 'express', x: 18, y: 6, d: 'down', w: false } });
    assert.equal(Net.room.host, Net.uid(), 'the host has a room of guests');
    assert.ok(ui.toasts.some(t => t.text === 'Гость в вашем Экспрессе: Ann'), 'and a note');
    frame(2);
    assert.ok(see().includes('Ann'), 'the host sees the guest');
    assert.equal(ui.writeSave('auto'), true, 'the host saves as usual');
    assert.ok(!store.get(saveKey).includes('744444444'), 'guests stay out of the save');
    const posN = sentOf('pos').length;
    await pause(140);
    frame(4);
    assert.ok(sentOf('pos').length >= posN, 'the host tells where he stands');
    assert.equal(sentOf('pos').pop().m, 'express');
    g.placePlayer(18, 7);
    g.player.dir = 'up';
    frame();
    key('Enter');
    assert.ok(ui.top().visitPeer, 'the host can talk to a guest');
    key('Escape');
    key('KeyT');
    assert.ok(ui.top().visitPhrases, 'and say a phrase');
    key('Escape');
    live().hear({ op: 'book', uid: Net.uid(), list: [{ at: Date.UTC(2026, 10, 1), uid: '744444444', name: 'Ann', text: 'Запись' }, { at: Date.UTC(2026, 10, 2), uid: '755555555', name: 'Bob', id: 0 }] });
    assert.ok(g.bookPages('guests')[0].who.startsWith('Ann'), 'the host reads the book');
    ui.openBook('guests', null);
    assert.ok(see().includes('записи гостей'));
    key('KeyR');
    const list = ui.top();
    assert.ok(list.guestEntries);
    assert.ok(see().includes('«Запись»') && drawn.includes('Удалить'));
    key('Delete');
    assert.equal(sentOf('bookDel').length, 0, 'removing asks twice');
    key('Delete');
    assert.deepEqual(sentOf('bookDel').pop(), { op: 'bookDel', at: Date.UTC(2026, 10, 1), uid: '744444444' });
    key('KeyB');
    key('KeyB');
    assert.deepEqual(sentOf('block').pop(), { op: 'block', uid: '744444444' }, 'the guest can be blocked');
    key('Escape');
    ui.screens = [];
    g.pending = null;
    live().hear({ op: 'peerOut', uid: '744444444' });
    assert.equal(Net.room, null, 'the room closes with the last guest');
    frame();
    console.log('✓ the host side');
  }

  {
    const g = ui.game;
    live().hear({ op: 'invite', from: HOST, name: 'Kaia', avatar: null, gender: 'f', kind: 'visit' });
    assert.ok(ui.netNote && ui.netNote.inv.kind === 'visit');
    assert.ok(see().includes('Kaia зовёт в гости'), 'the note says what it is');
    ui.openFriends(0);
    assert.ok(see().includes('зовёт в гости'), 'the strip too');
    key('KeyY');
    assert.equal(sentOf('visitEnter').pop().uid, HOST, 'accepting goes there');
    live().hear(visitMsg());
    assert.ok(ui.game.guest);
    live().hear({ op: 'invite', from: '722222222', name: 'Mio', avatar: null, gender: 'f', kind: 'table', code: 'ABCD', diff: 'normal' });
    ui.game.script = null; ui.game.pending = null; ui.dlg = null;
    key('KeyY');
    assert.equal(ui.game, g, 'a table invite goes home first');
    assert.deepEqual(sentOf('tableJoin').pop(), { op: 'tableJoin', code: 'ABCD', name: g.state.name });
    assert.ok(sentOf('visitLeave').length >= 1);
    live().hear({ op: 'tableError', code: 'none' });
    ui.screens = [];
    console.log('✓ invitations');
  }

  {
    const g = ui.game;
    live().hear(visitMsg({ on: true, peers: [{ uid: HOST, name: 'Kaia', gender: 'f', host: true, look: { k: 'kafka', o: null, lvl: 70, eid: 2 }, m: 'express', x: 10, y: 7, d: 'down', w: false }] }));
    const guest = ui.game;
    assert.ok(guest.guest);
    guest.script = null; guest.pending = null; ui.dlg = null;
    frame(2);
    assert.equal(ui.visitEchoShown(), false, 'the host is home: no echo');
    live().hear({ op: 'pos', uid: HOST, m: null });
    assert.equal(ui.visitEchoShown(), true, 'the host walked away: the echo is back');
    live().hear({ op: 'visitEnd', why: 'closed' });
    assert.equal(ui.game, g);
    assert.ok(ui.toasts.some(t => t.text === 'Хозяин закрыл двери'), 'a block sends the guest home');
    live().hear(visitMsg());
    assert.ok(ui.game.guest);
    ui.game.script = null; ui.game.pending = null; ui.dlg = null;
    live().hear({ op: 'visitNo', code: 'notFriend' });
    assert.equal(ui.game, g, 'a refusal after a reconnect goes home');
    ui.mode = 'battle';
    const leaving = sentOf('visitLeave').length;
    live().hear(visitMsg());
    assert.equal(ui.game, g, 'no visit from a battle');
    assert.equal(sentOf('visitLeave').length, leaving + 1, 'the late answer leaves the room at once');
    ui.mode = 'field';
    live().hear(visitMsg());
    assert.ok(ui.game.guest);
    const destroyed = ui.game;
    ui.game.script = null; ui.game.pending = null;
    ui.audio.destroy = noop;
    ui.destroy();
    assert.notEqual(ui.game, destroyed, 'closing during a visit saves the real game');
    assert.notEqual(store.get(saveKey), undefined);
    assert.equal(JSON.parse(store.get(saveKey)).state.name, 'Finlay');
    assert.equal(JSON.parse(store.get(saveKey)).state.credits, g.state.credits);
    console.log('✓ the edges of a visit');
  }

  console.log('All HSR 98 visit tests passed');
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
