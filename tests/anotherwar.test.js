const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/anotherwar');
const DATA = path.join(ROOT, 'content/anotherwar');
const ORDER = ['aw-core', 'aw-rules', 'aw-data', 'aw-items', 'aw-walk', 'aw-script', 'aw-dialog', 'aw-actor', 'aw-combat', 'aw-ai', 'aw-world', 'aw-scripts', 'aw-specials', 'aw-texts', 'aw-notes', 'aw-dlg-town', 'aw-dlg-cafe', 'aw-dlg-prison', 'aw-dlg-graveyard', 'aw-dlg-shop', 'aw-dlg-forest', 'aw-assets', 'aw-gl', 'aw-audio', 'aw-ui', 'aw-ui-hud', 'aw-ui-dialog', 'aw-ui-inv', 'aw-ui-stat', 'aw-ui-menu', 'aw-game'];
const SIM = ORDER.slice(0, ORDER.indexOf('aw-dlg-forest') + 1);
const ACT1 = ['StoryRoom', 'A01_Rynek', 'A02_CafeRene', 'AKT1', 'A03_Lochy', 'A04_cmentarz', 'A05_Church', 'A06_Antyk', 'A07_Przedzamcze', 'A08_KryptaMala', 'A09_Katakumby', 'A11_Las', 'A12_LasNE', 'A12_LasNW', 'A12_LasSE', 'A12_LasSW', 'A_Death'];
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const BANNED = new RegExp(['Micro' + 'soft', 'Win' + 'dows'].join('|'));
let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const t0 = Date.now();

for (const m of SIM) require(path.join(DIR, m + '.js'));
const AW = globalThis.AW;
const loader = async rel => JSON.parse(fs.readFileSync(path.join(DATA, rel), 'utf8'));

const KNOWN = new Set(['W', 'WT', 'R', 'S', 'A', 'AA', 'AMB', 'SND', 'CAM', 'CAMINSTANT', 'F', 'L', 'SET', 'WM', 'O', 'CONT', 'RESUMEAI', 'RESUME', 'MAPON', 'MAPOFF', 'OPENBOX', 'WYJAZD', 'I2', 'I3', 'CURETEAM', 'PAUSEAI', 'DLG', 'LEV', 'OPEN', 'CREATE', 'DELETE', 'DROP', 'CASH', 'HEAL', 'HIT', 'GETNOTE', 'ADDNOTE', 'GETQUEST', 'QDONE', 'DIARY', 'DLGS', 'ADDEXP', 'KILL', 'TRADE', 'POPUP', 'FDIN', 'FDOUT', 'SHOW', 'HIDE', 'AI', 'SKILL', 'SHOWALLITEMS', 'HIDEALLITEMS', 'MSG', 'I', 'AC', 'GFX', 'CONTROL', 'MUSIC', 'SAYAS', 'TELEPORT', 'SOUNDON', 'DLGWND', 'SPEFFECT']);

function playCommands(src) { return src ? AW.splitCommands(src).map(AW.parseCommand) : []; }

function dialogTexts() {
  const out = [];
  for (const d of Object.values(AW.DLG)) {
    for (const nd of Object.values(d.n)) {
      if (typeof nd.t === 'string') out.push(nd.t);
      for (const a of nd.a || []) if (typeof a.t === 'string') out.push(a.t);
    }
  }
  return out;
}

{
  const D = AW.DLG;
  const fns = AW.Scripts.fns;
  ok(Object.keys(D).length === 32, 'all 32 dialogues of the act are written, got ' + Object.keys(D).length);
  const notesGranted = new Set();
  for (const [name, d] of Object.entries(D)) {
    ok(d.n.START, name + ' has START');
    const check = (where, src) => {
      for (const c of playCommands(src)) {
        ok(KNOWN.has(c.f), `${where}: command ${c.raw}`);
        if (c.f === 'F') ok(typeof fns[c.args[0]] === 'function', `${where}: script fn ${c.args[0]}`);
        if (c.f === 'DLGS') {
          const target = c.args[1] ? D[c.args[1].toLowerCase()] : d;
          ok(target && target.n[c.args[0]], `${where}: DLGS ${c.raw}`);
        }
        if (c.f === 'GETNOTE' || c.f === 'ADDNOTE') notesGranted.add(c.args[0]);
      }
    };
    for (const [id, nd] of Object.entries(d.n)) {
      check(name + '.' + id, nd.p);
      for (const a of nd.a || []) {
        ok(a.to === 'END' || d.n[a.to], `${name}.${id} answer leads to ${a.to}`);
        check(name + '.' + id + '>', a.p);
        for (const al of a.alt || []) {
          ok(al.to === 'END' || d.n[al.to], `${name}.${id} alternative leads to ${al.to}`);
          check(name + '.' + id + '>alt', al.p);
        }
      }
    }
  }
  const texts = dialogTexts();
  ok(texts.length > 800, 'dialogue lines: ' + texts.length);
  for (const s of texts) ok(!/[—–]| - /.test(s), 'no dashes in dialogue: ' + s.slice(0, 50));
  for (const s of texts) ok(!BANNED.test(s), 'naming rule: ' + s.slice(0, 40));
  for (const [id, n] of Object.entries(AW.NOTES)) {
    ok(n.title && n.text && n.text.length > 40, 'note ' + id + ' has a title and a text');
    ok(!/[—–]| - /.test(n.title + n.text), 'no dashes in note ' + id);
  }
  for (const id of notesGranted) ok(AW.NOTES[id], 'journal entry for granted note ' + id);
  for (const lv of ACT1) {
    const L = JSON.parse(fs.readFileSync(path.join(DATA, 'data/levels', lv + '.json'), 'utf8'));
    for (const o of [].concat(L.humans || [], L.areas || [])) for (const src of [o.dlg, o.desc]) {
      const s = String(src || '');
      if (s.startsWith('PLAY:')) for (const c of playCommands(s.slice(5))) {
        if (c.f === 'GETNOTE' || c.f === 'ADDNOTE') ok(AW.NOTES[c.args[0]], `journal entry for ${lv}.${o.id} note ${c.args[0]}`);
        ok(KNOWN.has(c.f), `${lv}.${o.id}: command ${c.raw}`);
      }
    }
  }
}

function regionLabels(walk) {
  const lab = new Int32Array(walk.w * walk.h).fill(-1);
  let next = 0;
  for (let i = 0; i < lab.length; i++) {
    if (lab[i] >= 0 || !walk.walkableCell(i % walk.w, (i / walk.w) | 0)) continue;
    const stack = [i];
    lab[i] = next;
    while (stack.length) {
      const c = stack.pop(), cx = c % walk.w, cy = (c / walk.w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy, n = ny * walk.w + nx;
        if (nx < 0 || ny < 0 || nx >= walk.w || ny >= walk.h || lab[n] >= 0 || !walk.walkableCell(nx, ny)) continue;
        lab[n] = next;
        stack.push(n);
      }
    }
    next++;
  }
  return lab;
}

{
  const opened = new Set();
  const sources = fs.readdirSync(DIR).map(f => fs.readFileSync(path.join(DIR, f), 'utf8'));
  for (const lv of ACT1) sources.push(fs.readFileSync(path.join(DATA, 'data/levels', lv + '.json'), 'utf8'));
  for (const src of sources) {
    for (const m of src.matchAll(/OPEN:(\w+)/g)) opened.add('a' + m[1] + 'WM');
    for (const m of src.matchAll(/OpenDoor\((\w+),(\w+),/g)) opened.add(m[2]);
  }
  let doors = 0;
  for (const lv of ACT1) {
    const L = JSON.parse(fs.readFileSync(path.join(DATA, 'data/levels', lv + '.json'), 'utf8'));
    for (const wm of L.areas.filter(a => /WM$/.test(a.id) && opened.has(a.id))) {
      const closed = AW.WalkMap.fromLevel(L.map);
      const open = AW.WalkMap.fromLevel(L.map);
      open.fillPoly(wm.poly, 1);
      const before = regionLabels(closed), after = regionLabels(open);
      const changed = [];
      for (let i = 0; i < before.length; i++) if (before[i] < 0 && after[i] >= 0) changed.push(i);
      const joined = new Set();
      if (changed.length) for (let i = 0; i < before.length; i++) if (before[i] >= 0 && after[i] === after[changed[0]]) joined.add(before[i]);
      ok(joined.size >= 2, `${lv}.${wm.id}: the open door joins two walkable regions`);
      doors++;
    }
  }
  ok(doors === 4, 'every door the act opens is checked: ' + doors);
}

{
  for (const lv of ACT1) {
    const L = JSON.parse(fs.readFileSync(path.join(DATA, 'data/levels', lv + '.json'), 'utf8'));
    const areas = L.areas.map(a => new AW.Area(a)).filter(a => a.active && a.poly.length >= 3);
    const same = (a, b) => JSON.stringify(a.poly) === JSON.stringify(b.poly);
    const world = Object.assign(Object.create(AW.World.prototype), { actors: [], ground: [], areas });
    const pickArea = (x, y) => { const t = world.pick(x, y); return t && t.obj; };
    for (const a of areas) {
      if (!a.dlg && !a.desc) continue;
      if (areas.some(b => b !== a && same(a, b))) continue;
      const xs = a.poly.map(p => p[0]), ys = a.poly.map(p => p[1]);
      let reachable = false;
      for (let y = Math.min(...ys); y <= Math.max(...ys) && !reachable; y += 3) {
        for (let x = Math.min(...xs); x <= Math.max(...xs) && !reachable; x += 3) if (a.contains(x, y) && pickArea(x, y) === a) reachable = true;
      }
      ok(reachable, `${lv}.${a.id} can be pointed at with the cursor`);
    }
  }
}

function makeEnv(events) {
  return {
    sound() {}, voice() {}, stopVoice() {}, music() {}, message(t) { events.push('msg ' + t); }, float() {},
    popup(name, sec, cb) { events.push('popup ' + name); setImmediate(cb); }, fade() {},
    levelLoaded(d) { events.push('level ' + d.id); }, dialog() {}, dialogClosed() {}, trade() {}, tradeClosed() {},
    heroDied(c) { events.push('died ' + c); }, actEnd(n) { events.push('actEnd ' + n); }, control() {}, note(id) { events.push('note ' + id); },
    guiMode() {}, quest() {}, levelUp() {}
  };
}

async function newWorld(opts, events) {
  if (!AW.Data.ready) await AW.Data.init(loader);
  const W = new AW.World(makeEnv(events));
  W.onScriptError = (e, raw) => events.push('SCRIPT ERROR ' + raw + ' ' + e.message);
  W.onUnknownCommand = raw => events.push('UNKNOWN ' + raw);
  await W.newGame(Object.assign({ name: 'Зигмунт' }, opts));
  return W;
}

async function run(W, sec) {
  for (let t = 0; t < sec; t += 1 / 30) {
    if (W.pendingLevel) { const p = W.pendingLevel; W.pendingLevel = null; await W.changeLevel(p.id, p.opts); }
    W.update(1 / 30);
    await new Promise(r => setImmediate(r));
  }
}

async function waitFor(W, pred, sec, label) {
  for (let t = 0; t < sec; t += 0.25) {
    if (pred()) return;
    await run(W, 0.25);
  }
  assert.fail('timeout: ' + label + ' in ' + W.levelId);
}

const settled = W => W.controlState === 1 && W.hero.seq.idle() && !W.pendingLevel;

async function goLevel(W, id) {
  W.requestLevel(id);
  await waitFor(W, () => W.levelId === id && !W.pendingLevel, 20, 'load ' + id);
  await waitFor(W, () => settled(W), 120, 'control in ' + id);
}

function pick(d, want) {
  const list = d.node.answers.map(v => ({ v, an: v.i >= 0 ? d.node.def.a[v.i] : null }));
  if (want instanceof RegExp) return list.findIndex(x => x.an && want.test(x.v.text));
  const direct = list.findIndex(x => x.an && x.an.to === want);
  if (direct >= 0) return direct;
  return list.findIndex(x => x.an && (x.an.alt || []).some(a => a.to === want));
}

async function talk(W, name, target, plan) {
  const t = typeof target === 'string' ? (W.actor(target) || W.area(target)) : target;
  W.dialogNpc = t && t.kind === 'human' ? t : null;
  ok(W.openDialog(name, W.dialogNpc), 'dialogue opens: ' + name);
  const d = W.dialog;
  const route = [];
  for (let i = 0; i < 120 && !d.closed; i++) {
    route.push(d.node.id);
    if (plan[d.node.id] === undefined) break;
    const wants = [].concat(plan[d.node.id]);
    let k = -1;
    for (const w of wants) { k = pick(d, w); if (k >= 0) break; }
    ok(k >= 0, `${name}: ${d.node.id} offers ${wants.join('/')}`);
    d.choose(k);
    await run(W, 0.1);
  }
  if (!d.closed) d.close();
  await waitFor(W, () => settled(W) || W.pendingLevel || W.levelId === 'AKT1', 90, 'after ' + name);
  return route;
}

function clearFoes(W) {
  for (const a of W.actors.slice()) if (a.visible && !a.dead && a !== W.hero && W.hostile(W.hero, a)) W.killActor(a, W.hero);
}

async function playAct(cls, stats) {
  const events = [];
  const W = await newWorld({ cls, stats }, events);
  const note = id => W.hasNote(id);
  const has = n => W.teamHas(n);
  await waitFor(W, () => W.levelId === 'A01_Rynek' && settled(W), 400, 'arrival in Annet');
  ok(W.actor('Pierre').visible && W.hero.visible && !W.gfxObj('gCiezarowka').visible, cls + ': arrival with the driver, the truck animation is switched off');

  await goLevel(W, 'A02_CafeRene');
  const bogart = W.actor('Bogart');
  ok(bogart.visible && String(bogart.dlg).toLowerCase() === 'pierredole', cls + ': Pierre Dole waits in the café');
  await talk(W, 'pierredole', bogart, { START: 'PODCHODZI', PODCHODZI: 'KONTAKT', KONTAKT: 'STORY', STORY: 'STORY2', STORY2: 'STORY3', STORY3: 'STORY4', STORY4: 'STORY5', STORY5: 'STORY6', STORY6: 'STORY7', STORY7: 'SZKOPY', SZKOPY: 'END' });
  await waitFor(W, () => W.levelId === 'A03_Lochy' && settled(W), 200, 'dungeon');
  ok(W.hero.inv.all().every(it => it.name === 'kurtka'), cls + ': belongings taken away in the cell');

  if (cls === 'strongman') await talk(W, 'drzwi_podziemia', 'aDrzwi', { START: 'RYMPAL', RYMPAL: 'WYLAMAL', NIEWYLAMAL: 'START', WYLAMAL: 'END' });
  else if (cls === 'thief') { W.createItem(W.hero, 'cItem/wytrych'); await talk(W, 'drzwi_podziemia', 'aDrzwi', { START: 'WLAM', WLAM: 'WYTRYCH', WYTRYCH: 'END' }); }
  else await talk(W, 'drzwi_podziemia', 'aDrzwi', { START: 'NASLUCH', NASLUCH: 'OBERST', OBERST: 'END' });
  ok(W.flag('open_Drzwi'), cls + ': out of the cell');
  clearFoes(W);
  W.useTarget(W.area('aSkrzynka'));
  await run(W, 3);
  ok(has('whisky'), cls + ': belongings back from the crate');

  await talk(W, 'podsluchujekumpla', 'aDrzwitortured', { START: 'PATRZY', PATRZY: 'SLUCHAJ', SLUCHAJ: 'DALEJ', DALEJ: 'GDZIE', GDZIE: 'BADNAZI', BADNAZI: 'ALARM', ALARM: 'END' });
  ok(note('OMAPIE1') && has('klucz'), cls + ': interrogation overheard, key found');
  clearFoes(W);
  AW.Scripts.jdoor(W, false);
  await run(W, 1);
  await talk(W, 'johann', 'Johann', { START: 'STAN', STAN: 'POBUDKA', POBUDKA: 'REAKCJA', REAKCJA: 'NAME', NAME: 'COROBISZ', COROBISZ: 'WSZYSTKOJDNO', WSZYSTKOJDNO: 'STRZAL', STRZAL: 'STORY', STORY: 'STORY2', STORY2: 'WYDOSTAC', WYDOSTAC: 'POMOC', POMOC: 'END' });
  ok(W.inTeam('Johann') && note('KUMPEL') && W.questState('Papiery') === 'active', cls + ': Johann joins');
  await talk(W, 'johannekipa', 'Johann', { START: 'WYPROWADZ', WYPROWADZ: 'END' });
  await waitFor(W, () => W.levelId === 'A07_Przedzamcze' && settled(W), 60, 'castle forecourt');
  await talk(W, 'wartownik', 'Wartownik', { START: 'CZEGO', CZEGO: 'DO', DO: 'PRZESZLI', PRZESZLI: 'END' });
  ok(note('WARTAWARTA'), cls + ': the sentry lets them out');
  await goLevel(W, 'A01_Rynek');
  ok(W.actor('Alfred').visible && !W.actor('Tajniak').visible && !W.gfxObj('gCiezarowka').visible, cls + ': town after the escape');

  await talk(W, W.actor('Pierre').dlg, 'Pierre', { START: 'UCZYNNY', UCZYNNY: 'END' });
  await talk(W, W.area('aTruck').dlg, 'aTruck', { START: 'USZCZELKA', USZCZELKA: 'END' });
  await talk(W, W.actor('WiesniakDrap_635').dlg, 'WiesniakDrap_635', { START: 'ZAKLAD', ZAKLAD: 'END' });
  await talk(W, W.actor('Alfred').dlg, 'Alfred', { START: 'CZESCI', CZESCI: 'GADA', GADA: 'END' });
  ok(note('USZCZELKATRUE') && note('ALFREDZAKLAD') && note('NAWOZ'), cls + ': truck lead to Alfred');
  await talk(W, W.actor('Gracz1').dlg, 'Gracz1', { START: 'BONJOUR', BONJOUR: 'ZABYTKI', ZABYTKI: 'QUEST', QUEST: 'OCOCHODZI', OCOCHODZI: 'WZIAL', WZIAL: 'END' });
  ok(W.questState('Kule') === 'active', cls + ': veterans ask for their balls');

  await goLevel(W, 'A06_Antyk');
  await talk(W, 'antykwariusz', 'Antykwariusz', { START: 'KUPIC', KUPIC: 'BOOKSY', BOOKSY: 'NAWOZY', NAWOZY: 'END' });
  await talk(W, 'antykwariusz', 'Antykwariusz', { START: 'POGODA', POGODA: 'WESOLY', WESOLY: 'WESOLY2', WESOLY2: 'KUPIC', KUPIC: 'END' });
  ok(has('nawoz') && note('ANTYKKULE'), cls + ': fertiliser book and a suspect');
  if (cls === 'strongman') await talk(W, 'antykwariusz', 'Antykwariusz', { START: 'ZWINAL', ZWINAL: 'ZWINAL2', ZWINAL2: 'END' });
  else if (cls === 'thief') await talk(W, 'biurko', 'aBiurko', { START: 'BLISKO', BLISKO: 'JOHANN', JOHANN: 'J2', J2: 'MA', MA: 'END' });
  else {
    await talk(W, 'antykwariusz', 'Antykwariusz', { START: '1914', 1914: 'PRZEKONAL', PRZEKONAL: 'END' });
    await waitFor(W, () => !W.actor('Antykwariusz').visible, 30, 'bookseller leaves for the list');
    await talk(W, 'biurko', 'aBiurko', { START: 'MA', MA: 'END' });
    await waitFor(W, () => W.dialog && W.dialog.name === 'spis', 30, 'bookseller brings the list');
    W.dialog.choose(0);
    await run(W, 0.5);
  }
  ok(has('bocce') && note('KULEODZYSKANE'), cls + ': bocce balls recovered');

  await goLevel(W, 'A01_Rynek');
  await talk(W, W.actor('Alfred').dlg, 'Alfred', { START: 'NAWOZ', NAWOZ: 'USZCZELKA', USZCZELKA: 'END' });
  ok(has('uszczelka'), cls + ': gasket from Alfred');
  await talk(W, W.area('aTruck').dlg, 'aTruck', { START: 'JOHANN', JOHANN: 'JOHANNGUT', JOHANNGUT: 'DZIEKI', DZIEKI: 'END' });
  ok(note('NAPRAWIL') && !has('uszczelka'), cls + ': truck repaired');
  const skill = W.hero.skills.grenade || 0;
  await talk(W, W.actor('Gracz1').dlg, 'Gracz1', { MAQUESTA: 'WYKONAL', WYKONAL: 'ALEJA', ALEJA: 'GRAMY', GRAMY: 'GRAL', GRAL: 'END' });
  ok(note('KULKIRAZ') && (W.hero.skills.grenade || 0) === skill + 1, cls + ': veterans teach grenades');
  await talk(W, W.actor('Alfred').dlg, 'Alfred', { START: 'RUCH', RUCH: 'KLIENCI', KLIENCI: 'END' });
  await goLevel(W, 'A02_CafeRene');
  await talk(W, 'rene', 'Rene', { START: 'HAIL', HAIL: 'ZAMAWIA', ZAMAWIA: 'END' });
  await talk(W, 'rene', 'Rene', { START2: 'CO', CO: 'KONTAKT', KONTAKT: 'BOISIE', BOISIE: 'PAPIERY', PAPIERY: 'PROBLEM', PROBLEM: 'ZARAZ', ZARAZ: 'HAS', HAS: 'END' });
  ok(note('RENEOPOR') && note('RUCHOPORU'), cls + ': Rene sends them to the Resistance');
  await goLevel(W, 'A01_Rynek');
  await talk(W, W.actor('Alfred').dlg, 'Alfred', { START: 'HASLO', HASLO: 'H2', H2: 'H3', H3: 'END' });
  ok(note('GWIZD'), cls + ': the whistle and the password');

  await goLevel(W, 'A07_Przedzamcze');
  ok(W.area('aNacmentarz').active, cls + ': road to the forest open');
  for (const lv of ['A12_LasSE', 'A12_LasNE', 'A12_LasNW', 'A11_Las']) {
    await goLevel(W, lv);
    if (lv !== 'A11_Las') ok(W.actors.some(a => a.spawnZone && !a.dead), cls + ': patrols in ' + lv);
    clearFoes(W);
  }
  await talk(W, 'agentwlesie', 'aDomek', { START: 'FIU', FIU: 'HASLO', HASLO: 'CO', CO: 'PAPIER', PAPIER: 'PAPIER2', PAPIER2: 'PAPIER3', PAPIER3: 'TAK', TAK: 'END' });
  ok(note('BRON') && !W.actor('Partyzant').visible, cls + ': Roquefort wants the crate');

  await goLevel(W, 'A01_Rynek');
  await goLevel(W, 'A04_cmentarz');
  W.createItem(W.hero, 'cHealth/A_bandaz');
  await talk(W, W.actor('Grabarz2').dlg, 'Grabarz2', { START: 'LAZIC', LAZIC: 'GRABARZ', GRABARZ: 'STALO', STALO: 'STALO2', STALO2: 'STRIP', STRIP: 'BONDAGE', BONDAGE: 'UPADEK', UPADEK: 'UPADEK2', UPADEK2: 'UPADEK3', UPADEK3: 'UPADEK4', UPADEK4: 'WYGLAD', WYGLAD: 'END' });
  ok(note('SINIAKI') && note('UPADEK'), cls + ': the gravedigger saw a stranger at the well');
  await talk(W, 'studnia', 'aStudnia', { START: ['MIERZY', 'END'], MIERZY: 'START' });
  ok(note('CEMBROWINA'), cls + ': well measured');
  if (cls === 'thief') {
    await talk(W, 'studnia', 'aStudnia', { START: 'ZAGLADA', ZAGLADA: 'ZAGLADA2', ZAGLADA2: 'LANCUCH', LANCUCH: 'UTRZYMAL', UTRZYMAL: 'END' });
    await waitFor(W, () => W.levelId === 'A09_Katakumby' && settled(W), 30, 'down the well chain');
  } else {
    await goLevel(W, 'A05_Church');
    if (cls === 'strongman') {
      W.createItem(W.hero, 'cItem/deska');
      await talk(W, 'wylam', 'aWylam', { START: 'WYLAM', WYLAM: 'END' });
      W.deleteItem(W.hero, 'decha');
    } else {
      AW.Scripts.A05_Church.areas.aObrazglowny.left(W);
      ok(W.area('aKrzeslo').active, 'the painting points at the chair');
      await talk(W, 'krzeslo', 'aKrzeslo', { START: 'SIT', SIT: 'COMFY', COMFY: /на себя левую/, LEVERS: /от себя правую/, OPEN: 'END' });
      ok(note('PRZEJSCIEWKOSCIELE'), 'the chair opens the passage');
    }
    ok(W.area('aDokrypty').active, cls + ': stairs under the church');
    await goLevel(W, 'A09_Katakumby');
  }
  const agent = W.actors.find(a => a.script === 'TajniakZTajemnica');
  ok(agent && agent.visible, cls + ': the Gestapo agent is in the catacombs');
  clearFoes(W);
  ok(agent.dying && agent.dlg === 'agentkosciol', cls + ': the agent lives long enough to talk');
  await talk(W, 'agentkosciol', agent, { START: 'CLOSER', CLOSER: 'GDZIE', GDZIE: 'FRIEND', FRIEND: 'END' });
  ok(!agent.dying && W.area('aSkrytka').active, cls + ': the agent points at the stash');
  W.useTarget(W.area('aSkrytka'));
  await run(W, 3);
  ok(note('PIERMAP') && has('mapka'), cls + ': Pierre\'s map');

  if (cls !== 'thief') await goLevel(W, 'A05_Church');
  await goLevel(W, 'A04_cmentarz');
  await goLevel(W, 'A08_KryptaMala');
  W.useTarget(W.area('aMiejsce'));
  await run(W, 3);
  ok(has('skrzynia'), cls + ': supply crate from the crypt');
  await goLevel(W, 'A04_cmentarz');
  await goLevel(W, 'A01_Rynek');
  await goLevel(W, 'A07_Przedzamcze');
  for (const lv of ['A12_LasSE', 'A12_LasNE', 'A12_LasNW', 'A11_Las']) { await goLevel(W, lv); clearFoes(W); }
  await talk(W, 'agentwlesie', 'aDomek', { START: 'FIU', FIU: 'HASLO', HASLO: 'MA', MA: 'END' });
  ok(has('ausweis') && note('MAPAPIERY') && !has('skrzynia'), cls + ': papers for Johann');
  await talk(W, 'johannekipa', 'Johann', { START: 'PAPIERY', PAPIERY: 'END1', END1: 'END' });
  ok(W.questState('Papiery') === 'done', cls + ': papers quest done');

  await goLevel(W, 'A01_Rynek');
  await talk(W, W.actor('Pierre').dlg, 'Pierre', { WZIAL: 'GDZIE', GDZIE: 'END' });
  await run(W, 1);
  ok(events.includes('actEnd 1'), cls + ': the truck leaves for Yugoslavia');
  ok(W.flag('truckPaid') === undefined, cls + ': a free ride pays nothing');
  ok(!events.some(e => /SCRIPT ERROR|UNKNOWN/.test(e)), cls + ': no script errors: ' + events.filter(e => /SCRIPT ERROR|UNKNOWN/.test(e)).join(' | '));
  ok(W.hero.level >= 4, cls + ': the hero grows during the act, level ' + W.hero.level);
  return W;
}

async function deathAndSaves() {
  const events = [];
  const W = await newWorld({ cls: 'thief', startLevel: 'A03_Lochy' }, events);
  await waitFor(W, () => settled(W), 60, 'dungeon start');
  W.killActor(W.hero, null);
  await run(W, 3);
  ok(events.includes('died false'), 'death in the dungeon ends the game');

  const W2 = await newWorld({ cls: 'intel', startLevel: 'A12_LasSE' }, events);
  await waitFor(W2, () => settled(W2), 60, 'forest start');
  events.length = 0;
  W2.killActor(W2.hero, null);
  await run(W2, 3);
  ok(events.includes('died true'), 'death outside the dungeon can be continued');
  W2.continueAfterDeath();
  await waitFor(W2, () => W2.levelId === 'A02_CafeRene' && settled(W2), 200, 'back in the café');
  ok(!W2.hero.dead && W2.hero.visible && W2.hero.hp === Math.floor(W2.hero.hpMax / 2), 'Johann remembers how you survived');
  ok(events.includes('level A_Death'), 'the pub story plays');

  W2.addNote('GWIZD');
  W2.setFlag('Reneopor', 1);
  W2.createItem(W2.hero, 'cItem/bocce');
  const save = JSON.parse(JSON.stringify(W2.serialize()));
  const W3 = new AW.World(makeEnv([]));
  await W3.deserialize(save);
  await run(W3, 0.5);
  ok(W3.levelId === 'A02_CafeRene' && W3.hasNote('GWIZD') && W3.flag('Reneopor') === 1 && W3.teamHas('bocce'), 'save restores level, notes, flags and items');
  ok(W3.hero.cls === 'intel' && W3.hero.hpMax === W2.hero.hpMax, 'save restores the hero');

  const heavy = AW.Items.create('h.A_Ser', { noAffix: true });
  heavy.weight = 35;
  const old = JSON.parse(JSON.stringify(W2.serialize()));
  old.v = 1;
  old.hero.inv.pack.push({ item: heavy, x: 11, y: 2 });
  const W4 = new AW.World(makeEnv([]));
  await W4.deserialize(old);
  const cheese = W4.hero.inv.all().find(it => it.uid === heavy.uid);
  ok(cheese && cheese.weight >= 0.6 && cheese.weight <= 5.5, 'old saves get cheese weight from the fixed formula: ' + (cheese && cheese.weight));
  const kept = W4.hero.inv.all().find(it => it.name === 'bocce');
  const W5 = new AW.World(makeEnv([]));
  await W5.deserialize(JSON.parse(JSON.stringify(W4.serialize())));
  ok(W5.hero.inv.all().find(it => it.uid === heavy.uid).weight === cheese.weight && W5.hero.inv.all().find(it => it.name === 'bocce').weight === kept.weight, 'new saves keep rolled weights');
}

async function spawnRules() {
  const W = await newWorld({ cls: 'strongman', startLevel: 'A03_Lochy' }, []);
  await waitFor(W, () => settled(W), 60, 'dungeon start');
  const R = AW.Rules;
  for (const a of W.actors) {
    if (!a.tml || a === W.hero) continue;
    const min = R.hpBase(a.base.end, a.base.lck) + a.level * (Math.max(0, a.base.end - 7) + 1 + a.toroll);
    ok(a.hpMax >= min && a.hpMax <= min + 5 * a.level && a.hp === a.hpMax, a.id + ' HP follows the original formula: ' + a.hpMax);
  }
  ok(W.actor('Straznik1').skills.rifle === 1, 'the cell guard is trained with rifles');
  const j = W.actor('Johann');
  ok(j.hpMax < 60 && j.skills.pistol === 1 && j.skills.fist === 1 && j.ac() === R.acBase(j.stat('agi'), j.level), 'Johann: HP, skills and AC as in the original');
}

function rules() {
  const R = AW.Rules;
  ok(R.hpBase(8, 6) === 35 && R.hpBase(4, 6) === 19, 'HP = 4 x endurance + luck / 2');
  ok(R.acBase(7, 4) === 0, 'AC = agility - 9 + level / 2');
  ok(R.testStat(8, 0, 7) && !R.testStat(7, 0, 7), 'fixed stat test is strictly greater');
  const cls = R.CLASSES;
  ok(cls.strongman.skill === 'fist' && cls.thief.skill === 'melee' && cls.intel.skill === 'pistol', 'class weapon skills');
  const tml = { strongman: 'strongman', thief: 'thief', intel: 'inteligent' };
  for (const [id, key] of Object.entries(tml)) {
    const t = AW.Data.templates.humans[key];
    const b = cls[id].base;
    ok([b.str, b.agi, b.int, b.end, b.cha, b.spd, b.lck].join() === [t.strength, t.agility, t.inteligence, t.endurance, t.charisma, t.speed, t.luck].join(), cls[id].name + ' stats come from the original template');
  }
  ok(R.xpNext(1) < R.xpNext(2) && R.xpNext(2) < R.xpNext(5), 'XP thresholds grow');

  const E = AW.evalValue;
  ok(E('2+3*4', 0) === 14 && E('(2+3)*4', 0) === 20 && E('10-4/2', 0) === 8 && E('-3+5', 0) === 2, 'formulas follow operator precedence');
  ok(E('+2', 5) === 7 && E('A_TR', 9) === 0 && E('', 9) === 9 && E('2+*', 9) === 9 && E('1/0', 9) === 9, 'relative, unknown, empty and broken formulas');
  const weights = [], kufel = [], eggs = [];
  for (let i = 0; i < 400; i++) {
    weights.push(AW.Items.create('h.A_Ser').weight);
    kufel.push(E('K3()+1', 0));
    eggs.push(AW.Items.create('h.B_jajo', { noAffix: true }).weight);
  }
  ok(Math.min(...weights) >= 0.3 && Math.max(...weights) <= 5.5 && Math.max(...weights) - Math.min(...weights) > 3, 'cheese weighs 0.5 + random(50) / 10 kg: ' + Math.min(...weights) + '..' + Math.max(...weights));
  ok(Math.min(...kufel) === 2 && Math.max(...kufel) === 4, 'dice functions in formulas');
  ok(eggs.every(w => w === 0.35), 'egg weighs 0.1 + random(1) / 4 kg');
}

function integration() {
  const SL = String.fromCharCode(47);
  const LINE = SL + SL, BLOCK = SL + '*';
  const strip = s => s.replace(/https?:\/\/[^\s'"`]+/g, '');
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).map(f => 'js/apps/anotherwar/' + f).concat(['js/apps/anotherwar-app.js', 'tests/anotherwar.test.js', 'tools/anotherwar-shots.cjs']);
  for (const f of files) {
    const src = strip(read(f));
    ok(!src.includes(LINE) && !src.includes(BLOCK), f + ' has no comments');
    ok(!BANNED.test(src.replace(/[A-Z]:\/Program Files[^'"`]*/g, '')), f + ' follows the naming rule');
  }
  ok(!read('tools/anotherwar-assets.py').split('\n').some(l => /^\s*#|\s#\s/.test(l)), 'converter has no comments');
  ok(!read('css/apps/anotherwar.css').includes(BLOCK), 'css has no comments');
  ok(!read('anotherwar.html').includes('<!' + '--'), 'page has no comments');
  ok(fs.readdirSync(DIR).filter(f => f.endsWith('.js')).length === ORDER.length, 'every module is loaded by the pages');
  const gfx = JSON.parse(fs.readFileSync(path.join(DATA, 'data/gfx.json'), 'utf8'));
  const wear = Object.keys(gfx).filter(k => k.startsWith('gui/wear/'));
  ok(wear.length > 300 && wear.every(k => gfx[k].depth === 1 && fs.existsSync(path.join(DATA, 'gfx', k + '.z.webp'))), 'every doll layer has its depth map');
  for (const f of ORDER.filter(m => m.startsWith('aw-ui'))) ok(!/el\('div', 'aw-hit'/.test(read('js/apps/anotherwar/' + f + '.js')), f + ': click zones are positioned');
  const html = read('index.html');
  const page = read('anotherwar.html');
  let lastA = -1, lastB = -1;
  for (const f of ORDER) {
    const needle = `js/apps/anotherwar/${f}.js`;
    const ia = html.indexOf(needle), ib = page.indexOf(needle);
    ok(ia > lastA && ib > lastB, 'script order in index.html and anotherwar.html: ' + f);
    lastA = ia; lastB = ib;
  }
  ok(html.indexOf('js/apps/anotherwar-app.js') > lastA && html.includes('css/apps/anotherwar.css'), 'desktop loads the wrapper and styles');
  const gm = read('js/game-manager.js');
  const at = gm.indexOf('      anotherwar: {');
  const entry = gm.slice(at, at + 2600);
  ok(at > 0 && /steam: true/.test(entry) && /price: 20\.99/.test(entry) && /targetExe: 'AW\.EXE'/.test(entry) && /appAnotherWar/.test(entry), 'Steam catalog entry');
  ok(!/anotherwarGranted/.test(gm), 'no grant flag');
  const loadState = gm.slice(gm.indexOf('loadState'), gm.indexOf('moveGamesToSteam(state)'));
  ok(!/'anotherwar'/.test(loadState), 'not preinstalled');
  const shell = {
    'js/desktop.js': ["isInstalled('anotherwar')", 'appAnotherWar'],
    'js/taskbar.js': ["isInstalled('anotherwar')", "case 'anotherwar'", "showInSteam('anotherwar')"],
    'js/apps/dialogs.js': ["cmd === 'anotherwar'", "showInSteam(\\'anotherwar\\')"],
    'js/apps/explorer.js': ["item.app === 'anotherwar'", 'AW.EXE'],
    'js/filesystem.js': ["gmInstalled.includes('anotherwar')", "'AW.EXE'"],
    'js/apps/task-manager.js': ["'app_anotherwar'", 'aw.exe'],
    'js/icons.js': ["'anotherwar': `<svg"],
    'js/apps/clippy.js': ["id.startsWith('app_anotherwar')", "launchProgram('anotherwar', 'appAnotherWar')"],
    'js/apps/advanced-site.js': ["gm: 'anotherwar'"],
    'js/apps/steam.js': ["game: 'anotherwar'"],
    'js/apps/anotherwar-app.js': ["id = 'app_anotherwar'", 'AW.UI(root']
  };
  for (const [f, needles] of Object.entries(shell)) {
    const src = read(f);
    for (const n of needles) ok(src.includes(n), `${f} contains ${n}`);
  }
  ok((read('js/i18n.js').match(/'app\.anotherwar': 'Another War'/g) || []).length === 4, 'i18n titles');
  ok(read('tests/steam.test.js').includes("'anotherwar'"), 'steam test covers the game');
  ok(require('../tools/release.cjs').EXE_EXCLUDED.some(re => re.test('/content/Another War/game.exe')), 'original install is left out of the exe');
}

(async () => {
  await AW.Data.init(loader);
  rules();
  await spawnRules();
  const W = await playAct('strongman');
  await playAct('thief');
  await playAct('intel', { cha: 8 });
  ok(W.state.notes.length >= 20, 'journal grows during the act');
  await deathAndSaves();
  integration();
  console.log(`anotherwar: ${checks} checks passed in ${Date.now() - t0} ms`);
})().catch(e => { console.error(e); process.exit(1); });
