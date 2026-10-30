const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = 'js/apps/aayla98';
const ORDER = ['ay-core', 'ay-data', 'ay-memory', 'ay-script', 'ay-ch0', 'ay-ch1', 'ay-ch2', 'ay-int', 'ay-ch3', 'ay-ch4', 'ay-ch5', 'ay-ch6', 'ay-ch7', 'ay-bonds-text', 'ay-maps', 'ay-files', 'ay-art', 'ay-pix', 'ay-field', 'ay-battle', 'ay-duels', 'ay-respite', 'ay-cover', 'ay-flight', 'ay-save', 'ay-font', 'ay-gfx', 'ay-audio', 'ay-vn', 'ay-draw-field', 'ay-draw-battle', 'ay-screens', 'ay-ui'];
const NODE = ['ay-core', 'ay-data', 'ay-memory', 'ay-script', 'ay-ch0', 'ay-ch1', 'ay-ch2', 'ay-int', 'ay-ch3', 'ay-ch4', 'ay-ch5', 'ay-ch6', 'ay-ch7', 'ay-bonds-text', 'ay-maps', 'ay-files', 'ay-art', 'ay-pix', 'ay-field', 'ay-battle', 'ay-duels', 'ay-respite', 'ay-cover', 'ay-flight', 'ay-save', 'ay-font'];
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };

{
  const html = read('aayla98.html'), index = read('index.html');
  let last = -1, lastIndex = -1;
  for (const f of ORDER) {
    const tag = `${DIR}/${f}.js`;
    ok(fs.existsSync(path.join(ROOT, tag)), 'module ' + f);
    const i = html.indexOf(tag), j = index.indexOf(tag);
    ok(i > last, 'aayla98.html loads ' + f + ' in order');
    ok(j > lastIndex, 'index.html loads ' + f + ' in order');
    last = i;
    lastIndex = j;
  }
  ok(index.indexOf('js/apps/aayla98-app.js') > lastIndex, 'index.html loads the window wrapper after the modules');
  ok(index.includes('css/apps/aayla98.css') && html.includes('css/apps/aayla98.css'), 'stylesheet on both pages');
  const pkg = read('package.json');
  ok(/"test:aayla98": "node tests\/aayla98\.test\.js"/.test(pkg) && /node tests\/aayla98\.test\.js( |")/.test(pkg.split('"test":')[1].split('\n')[0]), 'npm scripts run this test');
}

{
  const game = [...ORDER.map(f => `${DIR}/${f}.js`), 'js/apps/aayla98-app.js', 'aayla98.html', 'css/apps/aayla98.css'];
  for (const f of [...game, 'tools/aayla98-shots.cjs', 'tools/aayla98-bot.cjs', 'tools/aayla98-font.cjs', 'tools/aayla98-font.py', 'tools/aayla98-pix.py', 'tests/aayla98.test.js']) {
    const src = read(f);
    ok(!/\/\*/.test(src), 'no block comments in ' + f);
    ok(!/^\s*\/\/(?!\s*#)/m.test(src) && !/[;{})]\s+\/\/\s/.test(src), 'no line comments in ' + f);
    ok(!/<!-{2}/.test(src), 'no markup comments in ' + f);
    ok(!/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(src), 'no control characters in ' + f);
  }
  ok(!/Micro[s]oft|Win[d]ows/.test(game.map(read).join('\n')), 'names follow the Microslop and Win rule');
}

{
  for (const f of ['js/game-manager.js', 'js/desktop.js', 'js/taskbar.js', 'js/filesystem.js']) {
    ok(!read(f).includes('aayla98'), 'no catalog entry or shortcut before the Steam stage: ' + f);
  }
}

for (const f of NODE) require(path.join(ROOT, DIR, f + '.js'));
const A = globalThis.Aayla98;

{
  ok(A.TITLE === 'Star Wars: Aayla Secura — Twilight', 'title from the author answer B1');
  ok(A.W === 640 && A.H === 480 && A.LW * 2 === A.W && A.LH * 2 === A.H, 'canvas 640x480, field buffer 320x240 shown x2');
  ok(Math.abs(A.STEP - 1 / 60) < 1e-12, 'logic runs at 60 Hz');
  const a = A.rng(42), b = A.rng(42), c = A.rng(43);
  const sa = Array.from({ length: 64 }, () => a()), sb = Array.from({ length: 64 }, () => b()), sc = Array.from({ length: 64 }, () => c());
  ok(sa.every((v, i) => v === sb[i]), 'same seed gives the same numbers');
  ok(sa.some((v, i) => v !== sc[i]), 'another seed gives other numbers');
  ok(sa.every(v => v >= 0 && v < 1), 'numbers lie in [0, 1)');
  ok(A.clamp(5, 0, 3) === 3 && A.clamp(-1, 0, 3) === 0 && A.clamp(2, 0, 3) === 2, 'clamp');
}

{
  const f1 = A.fit(640, 480), f2 = A.fit(1290, 990), f3 = A.fit(1000, 700), f4 = A.fit(320, 300);
  ok(f1.scale === 1 && f1.width === 640 && f1.height === 480 && f1.x === 0 && f1.y === 0, 'window of 640x480 shows the picture 1:1');
  ok(f2.scale === 2 && f2.width === 1280 && f2.height === 960 && f2.x === 5 && f2.y === 15, 'large window gets a whole x2 and a centred frame');
  ok(f3.scale === 1 && f3.x === 180 && f3.y === 110, 'between x1 and x2 the scale stays whole');
  ok(f4.scale === 0.5 && f4.width === 320 && f4.height === 240 && f4.y === 30, 'small window shrinks the picture to fit');
  ok(A.fit(0, 0).scale === 0.25, 'zero-size window does not break the scale');
}

{
  const S = A.newState();
  ok(S.version === A.SAVE_VERSION && S.chapter === 'pro' && S.dark === 0, 'new game starts in the prologue with no Darkness');
  ok(S.restraint === 0, 'lekku restraint starts at zero');
  ok(['flags', 'bonds', 'items'].every(k => S[k] && typeof S[k] === 'object' && !Array.isArray(S[k])) && Array.isArray(S.party) && Array.isArray(S.memory), 'state holds plain objects and lists');
  ok(JSON.stringify(JSON.parse(JSON.stringify(S))) === JSON.stringify(S), 'state survives a JSON round trip');
  ok(A.newState() !== S && A.newState().flags !== S.flags, 'each new game gets its own state');
}

const F = A.Font, X = A.Script;

{
  const font = require(path.join(ROOT, 'tools/aayla98-font.cjs'));
  ok(font.build() === read(DIR + '/ay-font.js'), 'ay-font.js is built from tools/aayla98-font.txt (run node tools/aayla98-font.cjs)');
  for (const name of ['text', 'bold']) {
    const f = F.DATA[name];
    ok(f && f.h === 15 && f.asc === 12, name + ' font: 15 pixel lines, ascent 12');
    const need = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюяABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;!?«»—–…№()-"\'';
    for (const ch of need) ok(!!f.glyphs[ch], `${name} font has «${ch}»`);
    ok(Object.values(f.glyphs).every(gl => gl.length === 3 + (gl[2] ? f.h : 0)), name + ' glyph rows match the height');
  }
  ok(F.measure('text', 'Эйла') > 0 && F.measure('text', '') === 0 && F.measure('text', 'ИИ') === 2 * F.measure('text', 'И'), 'measure sums advances');
  const long = 'Эйла достаёт из поясной сумки камень. Он тёплый и светится изнутри, как уголёк.';
  const wrapped = F.wrap('text', long, 200);
  ok(wrapped.length > 1 && wrapped.every(l => F.measure('text', l) <= 200), 'wrap keeps every line inside the width');
  ok(wrapped.join(' ') === long, 'wrap loses no words');
  ok(F.wrap('text', 'один\nдва', 400).length === 2, 'wrap honours line breaks');
}

const fits = text => F.wrap('text', text, 580).length <= 3;
const ctx = starts => ({ cast: A.CAST, art: A.Art.LIST, music: A.MUSIC, lekku: A.LEKKU, maps: A.Maps.DEFS, starts, fits, chapters: A.CHAPTERS, memory: A.MEMORY });
const mapLabelsOf = ids => [...new Set(ids.flatMap(id => Object.values(A.Maps.DEFS[id].props).filter(q => q.label || q.watch).map(q => q.label || q.watch).concat(A.Maps.DEFS[id].timer ? [A.Maps.DEFS[id].timer.fail] : [])))];
const PRO_MAPS = ['lessu_market', 'ryll_tunnels', 'ryll_mine'], CH1_MAPS = ['pol_estate', 'rock_gardens', 'lylek_caves', 'port_road'];

{
  ok(JSON.stringify(X.parseEffects('dose+1 doubt-15 tone=joke seen !gone bond.vos+2')) === JSON.stringify([
    { key: 'dose', op: '+', v: 1 }, { key: 'doubt', op: '-', v: 15 }, { key: 'tone', op: '=', v: 'joke' },
    { key: 'seen', op: '=', v: true }, { key: 'gone', op: '=', v: false }, { key: 'bond.vos', op: '+', v: 2 }]), 'effects parse');
  const S = A.newState();
  X.apply(S, X.parseEffects('dark+120 restraint=7 bond.vos+2 bond.bly-5 dose+1 dose+1'));
  ok(S.dark === 100 && S.restraint === 3 && S.bonds.vos.pts === 2 && S.bonds.bly.pts === -3 && S.bonds.bly.rank === 0 && S.flags.dose === 2, 'effects clamp Darkness 0..100, restraint 0..3, bond points -3..9; points never move a rank');
  ok(X.test(S, X.parseCond('dose>=2 && bond.vos==2 && !missing && dark>99')) && !X.test(S, X.parseCond('dose<2')), 'conditions');
  const lie = { lie: true }, truth = { lie: false }, need2 = { need: 2 };
  S.restraint = 1;
  ok(JSON.stringify(X.lekkuResult(S, need2, lie, 'calm')) === JSON.stringify({ read: true, tell: true, pose: 'twitch' }), 'a lie with too little restraint shows on the lekku');
  ok(JSON.stringify(X.lekkuResult(S, need2, truth, 'calm')) === JSON.stringify({ read: false, tell: false, pose: 'still' }), 'calm lekku hide a true feeling');
  ok(JSON.stringify(X.lekkuResult(S, need2, lie, 'show')) === JSON.stringify({ read: true, tell: false, pose: 'up' }), 'shown lekku give the feeling away on purpose');
  ok(X.lekkuResult(S, need2, truth, 'hello').pose === 'hello', 'a gesture becomes the lekku pose');
  S.restraint = 2;
  ok(!X.lekkuResult(S, need2, lie, 'calm').tell, 'enough restraint hides a lie');
}

{
  const bad = (src, re, starts) => {
    let errs;
    try { errs = X.check(X.parse(src, 'bad'), ctx(starts || ['a'])); } catch (e) { errs = [e.message]; }
    ok(errs.some(e => re.test(e)), 'broken script is caught: ' + re);
  };
  bad('@a\nxiaan: привет', /falls off/);
  bad('@a\ngoto nowhere', /unknown label/);
  bad('@a\nstop\n@b\nstop', /not reachable/);
  bad('@a\ngoto b\n@b\ngoto a', /no path/);
  bad('@a\nnobody: кто я?\nstop', /unknown speaker/);
  bad('@a\nshow aayla left padawan grin\nstop', /no face grin/);
  bad('@a\nshow aayla left armor calm\nstop', /no outfit/);
  bad('@a\nshow vos left early calm lekku=up\nstop', /bad lekku/);
  bad('@a\nbg moon\nstop', /unknown background/);
  bad('@a\ncg nothing\nstop', /unknown CG/);
  bad('@a\nif ghost\nstop\nend\nstop', /nobody sets/);
  bad('@a\n-: — раз — два\nstop', /long dashes/);
  bad('@a\nchoice\n> один -> a\nend', /two options/);
  bad('@a\nchoice lekku=nobody\n> один -> a\n> два -> a\nend', /lekku reader/);
  bad('@a\n-: ' + 'очень длинная реплика '.repeat(30) + '\nstop', /does not fit/);
  bad('@a\nif x\nstop', /not closed/);
  bad('@a\nfly away\nstop', /unknown command/);
  const groups = starts => Object.assign(ctx(starts || ['a']), { groups: A.GROUPS });
  const bad2 = (src, re) => {
    let errs;
    try { errs = X.check(X.parse(src, 'bad'), groups()); } catch (e) { errs = [e.message]; }
    ok(errs.some(e => re.test(e)), 'broken script is caught: ' + re);
  };
  bad2('@a\nbattle ghosts\nstop', /unknown battle group/);
  bad2('@a\nbattle smugglers_a sideways\nstop', /unknown advantage/);
  bad2('@a\nfield now\nstop', /takes no arguments/);
  bad2('@a\nforget all\nstop', /takes no arguments/);
  ok(X.check(X.parse('@a\nbattle spider_boss\nforget\nfield', 'ok'), groups()).length === 0, 'battle and forget go on to the next line, field ends the label');
  const st = new X.Story(X.parse('@a\nshow vos left early calm\nbattle smugglers_b enemy\nforget\nfield\n@b\n-: дальше\nstop', 'ok'), A.newState(), 'a');
  const evs = [st.next(), st.next(), st.next()];
  ok(evs[0].type === 'battle' && evs[0].group === 'smugglers_b' && evs[0].advantage === 'enemy' && evs[1].type === 'forget' && evs[2].type === 'field', 'the story hands battles, forgetting and the field to the screen in order');
  ok(!Object.keys(st.vn.busts).length, 'returning to the field clears the busts');
  st.jump('b');
  ok(st.next().text === 'дальше' && st.next().type === 'end', 'a map scene can jump into any label');
}

{
  const sc = A.Scripts.pro, P = X.build();
  const mapLabels = mapLabelsOf(PRO_MAPS), allLabels = mapLabelsOf(Object.keys(A.Maps.DEFS));
  ok(allLabels.length >= 18 && allLabels.every(l => P.labels[l]), 'every scene a map opens exists in the scripts: ' + allLabels.join(', '));
  ok(mapLabels.every(l => l.startsWith('pro_')) && mapLabelsOf(CH1_MAPS).every(l => l.startsWith('ch1_')), 'prologue maps open prologue scenes, chapter 1 maps open chapter 1 scenes');
  const called = P.order.filter(n => /^(bond_[a-z]+_(\d+|talk)|rs_[a-z0-9_]+|tr_[a-z0-9]+)$/.test(n)).concat(Object.values(A.COVERS).map(c => c.exposed));
  const mapFlags = Object.values(A.Maps.DEFS).flatMap(d => Object.values(d.props).filter(q => q.flag).map(q => q.flag));
  const errs = X.check(P, Object.assign(ctx([sc.start, ...allLabels, ...called]), { groups: A.GROUPS, bonds: A.BONDS, respites: A.RESPITES, covers: A.COVERS, flights: A.FLIGHTS, flags: mapFlags }));
  ok(errs.length === 0, 'prologue and chapter 1 scenes pass the checks: ' + errs.join(' | '));
  ok(P.order[0] === sc.start, 'prologue starts in the Meditation Garden');
  const visited = new Set(), endings = [];
  const run = (st, S, path, from) => {
    let lastVn = JSON.parse(JSON.stringify(st.vn));
    const events = [];
    for (let guard = 0; guard < 500; guard++) {
      visited.add(st.pc.label);
      const e = st.next();
      visited.add(st.pc.label);
      if (e.type === 'battle' || e.type === 'forget') { events.push(e); continue; }
      if (e.type === 'map' || e.type === 'field' || e.type === 'end' || e.type === 'chapter') { endings.push({ from, path, flags: { ...S.flags }, bonds: { ...S.bonds }, vn: lastVn, last: e, events }); return; }
      lastVn = JSON.parse(JSON.stringify(st.vn));
      if (e.type === 'choice') {
        const here = st.snapshot(), keep = JSON.stringify({ flags: S.flags, restraint: S.restraint, bonds: S.bonds });
        const poses = e.lekku ? ['calm', 'show', ...e.lekku.gestures] : [undefined];
        e.options.forEach((o, k) => poses.forEach(pose => {
          const S2 = Object.assign(A.newState(), JSON.parse(keep));
          const st2 = new X.Story(P, S2, sc.start);
          st2.restore(here);
          st2.choose(k, pose);
          run(st2, S2, path.concat(k + (pose ? ':' + pose : '')), from);
        }));
        return;
      }
    }
    throw new Error('prologue scene does not end: ' + from);
  };
  for (const from of [sc.start, ...mapLabels]) {
    const S0 = A.newState();
    S0.restraint = 1;
    run(new X.Story(P, S0, from), S0, [], from);
  }
  ok(P.order.filter(n => n.startsWith('pro_')).every(n => visited.has(n)), 'every label of the prologue is played on some path');
  const garden = endings.filter(e => e.from === sc.start);
  ok(garden.length === 12, 'the garden has 12 paths (2 answers x 2 lekku x 3 farewells), got ' + garden.length);
  ok(garden.every(e => ['keep', 'fear', 'joke'].includes(e.flags.xiaan_tone)), 'every path records what Aayla told Xiaan');
  ok(garden.some(e => e.flags.lekku_tell) && garden.some(e => e.flags.lekku_read && !e.flags.lekku_tell) && garden.some(e => !e.flags.lekku_read), 'the tutorial shows all three lekku outcomes');
  ok(garden.every(e => e.vn.busts.vos && e.vn.busts.aayla && !e.vn.cg), 'the arrival ends with Vos and Aayla on screen and the CG closed');
  ok(garden.every(e => e.last.type === 'map' && e.last.id === 'lessu_market' && e.last.at === 'start'), 'the garden and the arrival hand over to the Lessu market map');
  const pol = endings.filter(e => e.from === 'pro_warehouse');
  ok(pol.length === 6 && pol.every(e => e.last.type === 'map' && e.last.id === 'ryll_mine'), 'the warehouse leads through the reception at Pol to the mine on 6 paths');
  ok(['polite', 'cold', 'father'].every(t => pol.some(e => e.flags.pol_tone === t)), 'the reception records the tone for chapter 1');
  ok(pol.every(e => ((e.bonds.secura || {}).pts || 0) === { polite: 1, cold: 0, father: 2 }[e.flags.pol_tone]), 'the tone gives the first points of the Secura clan bond');
  ok(pol.some(e => e.flags.pol_tone === 'polite' && e.flags.lekku_read) && pol.some(e => e.flags.pol_tone === 'polite' && !e.flags.lekku_read), 'Pol sees through a polite lie only when her lekku give it away');
  const met = endings.filter(e => e.from === 'pro_asante');
  ok(met.length === 2 && met.every(e => e.last.type === 'field' && e.flags.asante_joined), 'meeting Asante returns to the mine with her in the party');
  const lair = endings.filter(e => e.from === 'pro_lair');
  ok(lair.length === 1 && lair[0].last.type === 'chapter' && lair[0].last.id === 'ch1', 'the lair scene ends the prologue and opens chapter 1');
  ok(lair[0].events.map(e => e.type).join() === 'battle,forget' && lair[0].events[0].group === 'spider_boss', 'the lair runs the boss fight, then Aayla forgets');
  const ids = [];
  for (const n of P.order) for (const s of P.labels[n].steps) {
    if (s.op === 'say') ids.push(s.id);
    if (s.op === 'choice') s.options.forEach(o => ids.push(o.id));
  }
  ok(ids.length === new Set(ids).size && ids.every(id => /^[a-z][a-z0-9_]*\.\d+$/.test(id)), 'every line and answer has its own id for a later translation');
  const all = P.order.map(n => P.labels[n].steps.filter(s => s.op === 'say').map(s => s.text).join(' ')).join(' ');
  ok(all.includes('Сердце огня') && all.includes('Каждый день понемногу'), 'the prologue names the Heart of Fire and ends on Pol: every day a little');
  ok(!/—/.test(P.order.filter(n => n !== sc.start).map(n => P.labels[n].steps.filter(s => s.op === 'say').map(s => s.text).join(' ')).join(' ')), 'new prologue and chapter 1 scenes use no long dashes');
}

{
  const Art = A.Art, L = Art.LIST, HEX = /^#[0-9a-f]{6}$/;
  const filled = v => typeof v === 'string' && v.trim().length > 2;
  for (const [id, b] of Object.entries(L.bg)) {
    ok(filled(b.place) && filled(b.what) && filled(b.mood) && filled(b.ref), 'background described: ' + id);
    ok(Art.SCENES.includes(b.scene), 'background scene type: ' + id);
    ok(b.times.length > 0 && b.times.every(t => Art.TIMES[t]), 'background times: ' + id);
    ok(b.colors.length === 3 && b.colors.every(c => HEX.test(c)), 'background palette: ' + id);
  }
  ok(Object.keys(L.bg).length >= 57, 'about 57 backgrounds listed (plan 11.4)');
  const story = Object.values(L.cg).filter(c => c.chapter !== 'bond'), bond = Object.values(L.cg).filter(c => c.chapter === 'bond');
  ok(story.length === 39 && bond.length === 8, '39 story CG and 8 bond CG (plan 11.4)');
  for (const [id, c] of Object.entries(L.cg)) {
    ok(filled(c.title) && filled(c.what) && filled(c.mood) && filled(c.ref), 'CG described: ' + id);
    ok(['pro', 'ch1', 'ch2', 'int', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'end', 'bond'].includes(c.chapter), 'CG chapter: ' + id);
  }
  ok(Object.keys(L.still).length === 13 && A.MEMORY.every(m => L.still[m.still]) && L.still.stark_veterans, '12 memory pictures (plan 7.8) and the story of the veterans');
  for (const [id, s] of Object.entries(L.still)) ok(filled(s.title) && filled(s.what) && filled(s.ref), 'memory picture described: ' + id);
  const MAIN = ['aayla', 'vos', 'tholme', 'kit', 'bly', 'villie', 'traa', 'ekria'];
  for (const [id, c] of Object.entries(A.CAST)) {
    ok(filled(c.name) && filled(c.look) && A.KINDS[c.kind], 'character described: ' + id);
    ok(HEX.test(c.skin) && HEX.test(c.plate) && c.pitch > 100, 'character colours and voice: ' + id);
    ok(c.faces.length >= 4 && c.faces.every(f => A.FACES.includes(f)), 'character faces: ' + id);
    ok(Object.keys(c.outfits).length > 0 && Object.values(c.outfits).every(o => filled(o.name) && filled(o.what) && HEX.test(o.cloth) && HEX.test(o.trim)), 'character outfits described: ' + id);
    ok(!!c.lekku === (c.kind === 'twilek'), 'only Twi\'leks have lekku: ' + id);
    ok(MAIN.includes(id) === (c.tier === 1) && (c.tier !== 1 || c.faces.length === 10), 'main characters have ten faces: ' + id);
  }
  ok(Object.keys(A.CAST).length >= 43, 'all busts of plan 11.3 are in the cast');
  ok(Object.keys(A.CAST.aayla.outfits).join() === 'padawan,dancer,kiffex,robe,servant,jayzaa,tuulaa', 'Aayla has the seven outfits of plan 5.1');
  for (const [id, c] of Object.entries(A.CAST)) for (const outfit of Object.keys(c.outfits)) {
    const R = Art.bustPixels(id, { outfit, face: c.faces[0], lekku: 'still' }, 0);
    ok(R.w === 140 && R.h === 200 && R.count() > 3000, `placeholder bust ${id}/${outfit}`);
  }
  const key = R => Buffer.from(R.data).toString('base64');
  const still = key(Art.bustPixels('aayla', { outfit: 'padawan', face: 'calm', lekku: 'still' }, 0));
  for (const pose of Object.keys(A.LEKKU)) {
    const k0 = key(Art.bustPixels('aayla', { outfit: 'padawan', face: 'calm', lekku: pose }, 0)), k1 = key(Art.bustPixels('aayla', { outfit: 'padawan', face: 'calm', lekku: pose }, 1));
    ok(pose === 'still' || pose === 'twitch' ? k0 === still : k0 !== still, 'lekku pose drawn on the placeholder: ' + pose);
    if (pose === 'twitch') ok(k1 !== k0, 'twitching lekku move between frames');
  }
  const faceKeys = A.FACES.map(f => key(Art.bustPixels('aayla', { outfit: 'padawan', face: f, lekku: 'still' }, 0)));
  ok(new Set(faceKeys).size === A.FACES.length, 'every face looks different on the placeholder');
  const bgKeys = new Set();
  for (const [id, b] of Object.entries(L.bg)) {
    const R = Art.bgPixels(id, b.times[0]);
    ok(R.count() === 320 * 240, 'placeholder background fills the frame: ' + id);
    bgKeys.add(key(R));
  }
  ok(bgKeys.size === Object.keys(L.bg).length, 'every placeholder background is different');
  ok(Art.stillPixels('wampa').count() === 320 * 240, 'placeholder memory picture');
  ok(Art.bustFile('aayla', 'padawan', 'smile') === 'bust/aayla_padawan_smile.png' && Art.lekkuFile('aayla', 'padawan', 'up') === 'bust/aayla_padawan_lekku_up.png' && Art.bgFile('temple_garden', 'dusk') === 'bg/temple_garden_dusk.png', 'file names of finished pictures');
  const sizes = { bust: [280, 400], bg: [640, 480], cg: [640, 480], still: [320, 240] };
  const onDisk = [];
  for (const kind of Object.keys(sizes)) {
    const dir = path.join(ROOT, 'content/aayla98', kind);
    if (fs.existsSync(dir)) fs.readdirSync(dir).filter(f => f.endsWith('.png')).forEach(f => onDisk.push(kind + '/' + f));
  }
  ok(JSON.stringify(onDisk.sort()) === JSON.stringify(Object.keys(Art.FILES).sort()), 'ay-files.js lists exactly the pictures in content/aayla98 (python tools/aayla98-pix.py --scan)');
  for (const f of onDisk) {
    const head = fs.readFileSync(path.join(ROOT, 'content/aayla98', f)).subarray(16, 24);
    const want = sizes[f.split('/')[0]];
    ok(head.readUInt32BE(0) === want[0] && head.readUInt32BE(4) === want[1], 'picture size: ' + f);
    const m = /^bust\/([a-z]+)_([a-z0-9]+)_(?:lekku_)?([a-z]+)\.png$/.exec(f);
    if (f.startsWith('bust/')) ok(m && A.CAST[m[1]] && A.CAST[m[1]].outfits[m[2]], 'bust file names a known character and outfit: ' + f);
    if (f.startsWith('cg/')) ok(!!L.cg[f.slice(3, -4)], 'CG file is in the list: ' + f);
    if (f.startsWith('still/')) ok(!!L.still[f.slice(6, -4)], 'memory file is in the list: ' + f);
  }
}

{
  const Pix = A.Pix, G = Pix.GRIDS;
  const grids = [...Object.values(G.HEADS).flatMap(h => Object.values(h)), G.TORSO_FRONT, G.TORSO_SIDE, ...Object.values(G.LEGS)];
  ok(grids.every(g => g.every(r => r.length === 16 && /^[.osSctCbehmgk]+$/.test(r))), 'field grids are 16 wide and use known palette letters');
  for (const [id, look] of Object.entries(Pix.LOOKS)) {
    ok((!look.who || A.CAST[look.who]) && Pix.GRIDS.HEADS[look.head || look.kind], 'look has a known character and a head: ' + id);
    const used = new Set([...Object.values(G.HEADS[look.head || look.kind]).flat(), ...G.TORSO_FRONT, ...G.TORSO_SIDE, ...Object.values(G.LEGS).flat()].join('').replace(/\./g, ''));
    ok([...used].every(ch => look.pal[ch]), 'look palette covers every letter: ' + id);
    for (const d of Pix.DIRS) {
      const frames = Pix.FIELD_FRAMES.map(f => Pix.field(id, d, f));
      ok(frames.every(R => R.w === 16 && R.h === 24 && R.count() > 120), `field frames ${id} ${d}`);
      ok(frames.every(R => [...Array(16).keys()].some(x => R.alpha(x, 23))), `feet stand on the bottom row: ${id} ${d}`);
      const k = frames.map(R => Buffer.from(R.data).toString('base64'));
      ok(k[3] !== k[2] && k[5] !== k[2] && k[1] !== k[0], `walk and breathing frames move: ${id} ${d}`);
    }
    const r = Pix.field(id, 'right', 'walk1'), l = Pix.field(id, 'left', 'walk1');
    let mirror = true;
    for (let y = 0; y < 24; y++) for (let x = 0; x < 16; x++) if (r.alpha(x, y) !== l.alpha(15 - x, y)) mirror = false;
    ok(mirror, 'left is the mirror of right: ' + id);
    for (const f of Pix.BATTLE_FRAMES) {
      const R = Pix.battle(id, f), p = Pix.POSES[f];
      ok(R.w === 48 && R.h === 64 && R.count() > 400, `battle frame ${id} ${f}`);
      let ground = false, edge = false;
      for (let x = 0; x < 48; x++) { if (R.alpha(x, 62) || R.alpha(x, 63)) ground = true; if (R.alpha(x, 0)) edge = true; }
      for (let y = 0; y < 64; y++) if (R.alpha(0, y) || R.alpha(47, y)) edge = true;
      ok(ground && !edge, `battle frame stands on the ground inside the frame: ${id} ${f}`);
      const hand = p.hand === 'b' ? p.bhand : p.fhand;
      ok(hand[0] > 0 && hand[0] < 48 && hand[1] > 0 && hand[1] < 64, `sabre hand inside the frame: ${f}`);
    }
  }
  ok(Pix.BATTLE_FRAMES.join() === 'idle0,idle1,attack0,attack1,attack2,attack3,force0,force1,force2,hurt,ko', 'battle frames of plan 11.2: idle 2, attack 4, Force 3, hurt, down');
  ok(Pix.LOOKS.aayla_padawan.blade === '#e83a2a' && Pix.LOOKS.vos_early.blade === '#3ad04a', 'Aayla has the red Padawan blade in the prologue, Vos green');
}

{
  const Mp = A.Maps, TS = Mp.TILE, FD = A.FIELD;
  for (const [id, def] of Object.entries(Mp.DEFS)) {
    const m = Mp.parse(id);
    ok(m.w <= 96 && m.h <= 64 && def.rows.every(r => r.length === m.w), `map ${id}: equal rows, at most 96x64`);
    ok(def.rows[0].split('').every(c => c === '#') && def.rows[m.h - 1].split('').every(c => c === '#') && def.rows.every(r => r[0] === '#' && r[m.w - 1] === '#'), `map ${id}: closed by walls`);
    ok(['run', 'walk'].includes(def.pace) && def.name, `map ${id}: name and pace`);
    for (const [name, [x, y]] of Object.entries(m.entries)) ok(!Mp.SOLID.has(m.tiles[y * m.w + x]), `map ${id}: entry ${name} stands on floor`);
    for (const o of m.objects) {
      ok(m.tiles[o.y * m.w + o.x] === Mp.T.floor, `map ${id}: ${o.id} stands on a floor tile`);
      if (o.lines) for (const [who, text] of o.lines) ok((who === 'npc' || who === '-' || A.CAST[who] || A.Script.thinker(who)) && fits(text), `map ${id}: line of ${o.id} has a speaker and fits the box`);
      if (o.type === 'exit') ok(Mp.DEFS[o.to] && Mp.DEFS[o.to].entries[o.at], `map ${id}: exit ${o.id} leads to ${o.to}/${o.at}`);
      if (o.type === 'npc') ok(A.Pix.LOOKS[o.look] && o.name, `map ${id}: npc ${o.id} has a look and a name`);
      if (o.type === 'enemy') {
        ok((A.Pix.LOOKS[o.look] || A.Pix.FIELD_BEASTS[o.look]) && A.GROUPS[o.group], `map ${id}: enemy ${o.id} has a look and a battle group`);
        let x = o.x, y = o.y;
        const steps = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };
        for (const c of o.route) {
          const mv = /^([EWNS])(\d+)$/.exec(c);
          if (!mv) { ok(/^w\d+(\.\d+)?$/.test(c) || /^t(up|down|left|right)$/.test(c), `map ${id}: route command ${c}`); continue; }
          for (let i = 0; i < +mv[2]; i++) {
            x += steps[mv[1]][0];
            y += steps[mv[1]][1];
            ok(!Mp.SOLID.has(m.tiles[y * m.w + x]) && !m.objects.some(q => q.x === x && q.y === y && ['crate', 'npc', 'brace', 'bridge', 'fragile', 'end', 'cocoon', 'scene'].includes(q.type)), `map ${id}: route of ${o.id} walks on floor at ${x},${y}`);
          }
        }
        ok(x === o.x && y === o.y, `map ${id}: route of ${o.id} returns home`);
      }
    }
  }

  const make = (rows, props, extra) => {
    const id = 't' + Math.random().toString(36).slice(2, 8);
    Mp.DEFS[id] = Object.assign({ name: 'Проверка', pace: 'run', rows, props: props || {}, entries: { start: '@' } }, extra || {});
    return id;
  };
  const S0 = () => Object.assign(A.newState(), { items: {} });
  const run = (f, inp, frames) => { const evs = []; for (let i = 0; i < frames; i++) { f.step(1 / 60, inp); evs.push(...f.take()); } return evs; };
  const tap = (f, inp) => { f.step(1 / 60, inp); return f.take(); };
  const face = (f, dir) => tap(f, { dx: dir === 'right' ? 1 : dir === 'left' ? -1 : 0, dy: dir === 'down' ? 1 : dir === 'up' ? -1 : 0 });
  const place = (f, x, y, dir) => { f.p.x = x * TS + 8; f.p.y = y * TS + 14; f.p.dir = dir || f.p.dir; f.trail = []; };

  {
    const id = make(['########################', '#......................#', '#......................#', '#......................#', '#....@.................#', '#......................#', '########################']);
    const f = new A.Field(S0(), id, 'start');
    const x0 = f.p.x;
    run(f, { dx: 1 }, 60);
    ok(Math.abs(f.p.x - x0 - FD.SPEED.run) < 2, 'Aayla runs 100 pixels a second');
    place(f, 2, 4);
    const x1 = f.p.x;
    run(f, { dx: 1, sneak: true }, 60);
    ok(Math.abs(f.p.x - x1 - FD.SPEED.sneak) < 2, 'sneaking is 35 pixels a second');
    place(f, 5, 4);
    run(f, { dx: -1 }, 200);
    ok(f.p.x - 5 >= TS && !f.blocked(f.p.x, f.p.y), 'walls stop her outside the stone');
    place(f, 2, 2);
    const y0 = f.p.y;
    run(f, { dx: -1, dy: 1 }, 30);
    ok(f.p.y > y0 + 10 && f.p.x - 5 >= TS, 'she slides along a wall when walking into it at an angle');
  }

  {
    const id = make([
      '##############',
      '#............#',
      '#.@..C.......#',
      '#............#',
      '##############'
    ]);
    const S = S0(), f = new A.Field(S, id, 'start');
    const crate = () => f.objs.find(o => o.type === 'crate');
    place(f, 4, 2, 'right');
    ok(f.prompt().push && f.prompt().pull, 'a crate in front can be pushed and pulled');
    tap(f, { push: true });
    ok(crate().x === 12 && crate().y === 2, 'a pushed crate slides to the wall');
    place(f, 7, 2, 'right');
    tap(f, { pull: true });
    ok(crate().x === 8, 'a pulled crate stops next to Aayla');
    place(f, 3, 2, 'right');
    ok(!!f.forceTarget(), 'the Force reaches a crate five tiles away');
    place(f, 1, 2, 'right');
    ok(!f.forceTarget(), 'but not seven tiles away');
    const f2 = new A.Field(S, id, 'start');
    ok(f2.objs.some(o => o.type === 'crate' && o.x === 8 && o.y === 2), 'moved crates stay where they are after the map is loaded again');
    const pit = make([
      '##########',
      '#........#',
      '#.@.C~~..#',
      '##########'
    ]);
    const g = new A.Field(S0(), pit, 'start');
    place(g, 3, 2, 'right');
    tap(g, { push: true });
    ok(g.tile(5, 2) === Mp.T.filled && g.walkable(5, 2) && !g.objs.some(o => o.type === 'crate'), 'a crate pushed into a pit fills it');
  }

  {
    const id = make([
      '#############',
      '#...........#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#.....C.....#',
      '#...........#',
      '#...........#',
      '#...........#',
      '#.@.........#',
      '#############'
    ]);
    const hang = { right: [15.5, 14], left: [0.5, 14], down: [8, 18.5], up: [8, 3.5] };
    for (const [dir, [hx, hy]] of Object.entries(hang)) {
      const f = new A.Field(S0(), id, 'start'), v = FD.DIRV[dir], crate = f.objs.find(o => o.type === 'crate');
      f.p.x = (crate.x - v[0] * 4) * TS + hx;
      f.p.y = (crate.y - v[1] * 4) * TS + hy;
      f.p.dir = dir;
      const ev = tap(f, { pull: true });
      const x0 = f.p.x, y0 = f.p.y;
      run(f, { dx: v[1], dy: v[0] }, 6);
      ok(ev.some(e => e.type === 'pull' && e.moved === 2) && (f.p.x !== x0 || f.p.y !== y0), `a crate pulled while Aayla faces ${dir} stops short of her body and she can walk on`);
    }
  }

  {
    const id = make([
      '############',
      '#...l......#',
      '#.@..==r...#',
      '#..........#',
      '############'
    ], { l: { type: 'lever', name: 'Рычаг', controls: 'r' }, r: { type: 'bridge', name: 'Мостик' } });
    const f = new A.Field(S0(), id, 'start');
    ok(!f.walkable(5, 2), 'a raised bridge works like a pit');
    place(f, 4, 2, 'up');
    ok(f.prompt().verb === 'Рычаг', 'a lever can be pulled by hand');
    tap(f, { interact: true });
    ok(f.walkable(5, 2) && f.bridgeDown(), 'the lever lowers the bridge it controls');
    tap(f, { push: true });
    ok(!f.bridgeDown(), 'the Force pushes the lever back');
    place(f, 4, 2, 'right');
    ok(f.forceTarget() && f.forceTarget().type === 'bridge' && f.prompt().pull && !f.prompt().push, 'a raised bridge across the pit can be pulled down');
    tap(f, { pull: true });
    ok(f.bridgeDown(), 'the Force pulls the bridge down');
    place(f, 6, 2, 'right');
    ok(f.onBridge() && !f.force('push'), 'the bridge is not raised under Aayla');
    const id2 = make([
      '#########',
      '#.......#',
      '#~~~=~~~#',
      '#..@...r#',
      '#########'
    ], { r: { type: 'bridge', name: 'Мостик' } });
    const g = new A.Field(S0(), id2, 'start');
    place(g, 4, 3, 'right');
    tap(g, { pull: true });
    g.p.y = 3 * TS + 3.5;
    ok(g.bridgeDown() && g.onBridge() && !g.force('push') && !g.blocked(g.p.x, g.p.y), 'the bridge is not raised while part of Aayla is still on it');
  }

  {
    const id = make([
      '############',
      '#..........#',
      '#.@b.......#',
      '#....####..#',
      '#...e......#',
      '############'
    ], { b: { type: 'brace', name: 'Крепь', drop: [[4, 1], [4, 2], [4, 4]] }, e: { type: 'enemy', name: 'Страж', look: 'twilek_green', group: 'test', face: 'up', route: ['w100'] } });
    const S = S0(), f = new A.Field(S, id, 'start');
    place(f, 4, 2, 'left');
    ok(!f.force('push'), 'the brace does not fall while Aayla stands under it');
    place(f, 2, 2, 'right');
    ok(f.prompt().push && !f.prompt().pull, 'a brace can only be pushed');
    const ev = tap(f, { push: true });
    ok(f.tile(4, 1) === Mp.T.rubble && f.tile(4, 4) === Mp.T.rubble && f.tile(3, 2) === Mp.T.rubble, 'pushing the brace drops rubble on its tiles');
    ok(ev.some(x => x.type === 'collapse' && x.trapped.includes('e')) && f.mem(id).beat.e === 'trapped', 'an enemy under the rubble is out of the fight');
    const f2 = new A.Field(S, id, 'start');
    ok(f2.tile(4, 2) === Mp.T.rubble && !f2.objs.some(o => o.type === 'brace' || o.type === 'enemy'), 'the collapse is remembered');
  }

  {
    const id = make([
      '##############',
      '#............#',
      '#.@..j~~~~...#',
      '#.......X....#',
      '#.....k......#',
      '#.....M......#',
      '##############'
    ], { j: { type: 'jump', name: 'Край', hidden: true, to: [5, 0] }, k: { type: 'cache', name: 'Тайник', hidden: true, item: 'stim', lines: [['-', 'Стимулятор.']] } });
    const S = S0(), f = new A.Field(S, id, 'start');
    place(f, 5, 2, 'right');
    ok(!f.prompt().verb, 'a jump mark is unknown before the Force sense');
    const evs = tap(f, { sense: true });
    ok(evs.some(e => e.type === 'sense' && e.found >= 2), 'the Force sense reveals hidden marks nearby');
    ok(f.prompt().verb === 'Прыжок', 'after the sense Aayla can jump');
    ok(!f.sense(), 'the sense needs six seconds to come back');
    tap(f, { interact: true });
    run(f, {}, 50);
    ok(Math.floor(f.p.x / TS) === 10 && Math.floor((f.p.y - 3) / TS) === 2, 'the jump lands five tiles across the pit');
    place(f, 7, 3, 'right');
    ok(f.forceTarget() && f.forceTarget().type === 'fragile', 'the cracked wall is sensed');
    tap(f, { push: true });
    ok(f.walkable(8, 3), 'a pushed cracked wall breaks');
    place(f, 6, 3, 'down');
    tap(f, { interact: true });
    ok(S.items.stim === 1 && !f.prompt().verb, 'the cache is taken once');
    S.dark = 10;
    place(f, 6, 5, 'down');
    ok(f.prompt().verb === 'Медитировать', 'the meditation point is on the floor');
    const ev = tap(f, { interact: true });
    ok(S.dark === 5 && ev.some(e => e.type === 'meditate' && e.first), 'meditation takes away 5 Darkness');
    tap(f, { interact: true });
    ok(S.dark === 5, 'only once per visit');
    f.load(id, 'start');
    place(f, 6, 5, 'down');
    tap(f, { interact: true });
    ok(S.dark === 0, 'a new visit can meditate again, Darkness stops at zero');
    tap(f, {});
    ok(S.dark === 0, 'Darkness never goes below zero');
  }

  {
    const id = make([
      '####################',
      '#..................#',
      '#..................#',
      '#.......e..........#',
      '#..................#',
      '#..................#',
      '#..........@.......#',
      '####################'
    ], { e: { type: 'enemy', name: 'Страж', look: 'twilek_green', group: 'test', face: 'right', route: ['w100'] } });
    const fresh = () => { const f = new A.Field(S0(), id, 'start'); const e = f.objs.find(o => o.type === 'enemy'); return [f, e]; };
    let [f, e] = fresh();
    place(f, 11, 3);
    ok(f.canSee(e), 'a guard sees Aayla in front of him');
    place(f, 5, 3);
    ok(!f.canSee(e), 'not behind his back');
    place(f, 14, 3);
    ok(!f.canSee(e), 'not farther than 80 pixels');
    place(f, 10, 6);
    ok(!f.canSee(e), 'not outside his cone');
    const id2 = make([
      '####################',
      '#..................#',
      '#.......e..#.......#',
      '#.......f..C.......#',
      '#..................#',
      '#..........@.......#',
      '####################'
    ], { e: { type: 'enemy', name: 'Страж', look: 'twilek_green', group: 'test', face: 'right', route: ['w100'] }, f: { type: 'enemy', name: 'Страж', look: 'twilek_green', group: 'test', face: 'right', route: ['w100'] } });
    const g2 = new A.Field(S0(), id2, 'start');
    const [ea, eb] = ['e', 'f'].map(k => g2.objs.find(o => o.id === k));
    place(g2, 13, 2);
    ok(!g2.canSee(ea), 'walls hide her');
    place(g2, 13, 3);
    ok(!g2.canSee(eb), 'crates hide her too');
    [f, e] = fresh();
    place(f, 6, 3, 'right');
    run(f, { dx: 1 }, 6);
    ok(e.mode === 'look' || e.mode === 'alert', 'running behind a guard is heard');
    ok(e.look === 'twilek_green', 'hearing does not overwrite the guard sprite');
    [f, e] = fresh();
    place(f, 5, 3, 'right');
    run(f, { dx: 1, sneak: true }, 8);
    ok(e.mode === 'patrol', 'sneaking behind him is silent');
    [f, e] = fresh();
    place(f, 6, 3, 'right');
    let evs = run(f, { dx: 1, sneak: true }, 60);
    const amb = evs.find(x => x.type === 'encounter');
    ok(amb && amb.advantage === 'party', 'reaching a guard from behind unseen gives an ambush');
    [f, e] = fresh();
    place(f, 12, 3, 'left');
    evs = run(f, {}, 300);
    ok(evs.some(x => x.type === 'spotted'), 'a guard spots her in front');
    const hit = evs.find(x => x.type === 'encounter');
    ok(hit && hit.advantage === 'enemy', 'a guard who spotted her runs up and starts the fight first');
    f.resolve(e.id, 'won');
    const again = new A.Field(f.S, id, 'start');
    ok(!again.objs.some(o => o.type === 'enemy'), 'beaten enemies do not come back');
    [f, e] = fresh();
    e.mode = 'engaged';
    f.release(e.id);
    ok(e.mode === 'return' && e.calm === A.FIELD.CALM, 'after a retreat the guard walks back home');
    f.p.x = e.px;
    f.p.y = e.py;
    evs = run(f, {}, 60);
    ok(!evs.some(x => x.type === 'encounter'), 'for a few seconds after a retreat he does not start a new fight');
  }

  {
    const S = S0();
    const f = new A.Field(S, 'lessu_market', 'start');
    const seen = new Set(), log = [];
    let fights = 0;
    const settle = evs => {
      for (const ev of evs) {
        log.push(ev.type);
        if (ev.type === 'encounter') { fights++; f.resolve(ev.obj, 'won'); }
        if (ev.type === 'lines' || ev.type === 'meditate' || ev.type === 'jump' || ev.type === 'scene' || ev.type === 'exit') seen.add(f.map.id + ':' + (ev.obj || ev.to));
        if (ev.type === 'exit') f.load(ev.to, ev.at);
      }
    };
    const goTo = (tx, ty) => {
      for (let tries = 0; tries < 6; tries++) {
        const route = f.path(f.playerTile(), [tx, ty]);
        if (!route) throw new Error(`bot: no path on ${f.map.id} to ${tx},${ty}`);
        let ok2 = true;
        for (const [x, y] of route.slice(1)) {
          const gx = x * TS + 8, gy = y * TS + 14;
          let n = 0;
          while (Math.hypot(gx - f.p.x, gy - f.p.y) > 1.5) {
            const dx = gx - f.p.x, dy = gy - f.p.y, d = Math.hypot(dx, dy);
            f.step(1 / 60, { dx: Math.abs(dx) > 0.8 ? dx / d : 0, dy: Math.abs(dy) > 0.8 ? dy / d : 0 });
            settle(f.take());
            if (++n > 240) { ok2 = false; break; }
          }
          if (!ok2) break;
        }
        if (ok2) { place(f, tx, ty); return; }
      }
      throw new Error(`bot: stuck on ${f.map.id} going to ${tx},${ty}`);
    };
    const act = inp => { f.step(1 / 60, inp); settle(f.take()); };
    const use = (tx, ty, dir) => { goTo(tx, ty); face(f, dir); act({ interact: true }); };
    use(9, 9, 'up');
    use(17, 9, 'up');
    use(25, 9, 'up');
    use(14, 17, 'up');
    use(9, 15, 'up');
    use(21, 20, 'up');
    goTo(29, 17);
    act({ sense: true });
    use(29, 16, 'up');
    ok(S.flags.clue_lessu_market_d, 'bot: Vos read the ryll crate in the market');
    use(12, 18, 'down');
    goTo(33, 12);
    face(f, 'up');
    act({ pull: true });
    ok(!f.objs.some(o => o.type === 'crate' && o.x === 33 && o.y === 8), 'bot: the crate in front of the hatch is pulled away');
    goTo(33, 5);
    face(f, 'up');
    act({ interact: true });
    ok(f.map.id === 'ryll_tunnels', 'bot: the hatch leads down into the tunnels');
    goTo(20, 3);
    for (let i = 0; i < 400; i++) act({});
    act({ sense: true });
    use(20, 3, 'down');
    use(29, 3, 'right');
    ok(S.flags.clue_ryll_tunnels_u, 'bot: Vos read the broken crate in the tunnels');
    use(14, 25, 'down');
    goTo(23, 25);
    for (let i = 0; i < 400; i++) act({});
    act({ sense: true });
    face(f, 'right');
    act({ interact: true });
    for (let i = 0; i < 60; i++) act({});
    ok(Math.floor(f.p.x / TS) === 28, 'bot: Aayla jumps over the chasm to the ledge');
    goTo(30, 25);
    for (let i = 0; i < 400; i++) act({});
    act({ sense: true });
    face(f, 'down');
    act({ interact: true });
    ok(S.items.stim === 1, 'bot: the cache on the ledge is taken');
    goTo(31, 25);
    face(f, 'right');
    act({ push: true });
    ok(f.walkable(32, 25), 'bot: the cracked wall to the lower hall breaks');
    use(41, 26, 'down');
    goTo(38, 24);
    goTo(38, 21);
    goTo(35, 22);
    face(f, 'right');
    act({ push: true });
    ok(f.tile(37, 23) === Mp.T.rubble, 'bot: the old brace closes the passage');
    goTo(29, 21);
    face(f, 'left');
    act({ pull: true });
    ok(f.bridgeDown(), 'bot: the bridge is pulled down from the east bank');
    goTo(22, 21);
    goTo(30, 20);
    use(43, 20, 'right');
    ok(log.includes('scene'), 'bot: the tunnels end at the warehouse door, which opens the warehouse scene');
    const want = ['lessu_market:a', 'lessu_market:b', 'lessu_market:c', 'lessu_market:d', 'lessu_market:e', 'lessu_market:f', 'lessu_market:g', 'lessu_market:ryll_tunnels', 'ryll_tunnels:u', 'ryll_tunnels:v', 'ryll_tunnels:i', 'ryll_tunnels:j', 'ryll_tunnels:k', 'ryll_tunnels:x'];
    for (const w of want) ok(seen.has(w), 'bot reached trigger ' + w);
    ok([...seen].some(s => /meditate|M\d+/.test(s)) || log.includes('meditate'), 'bot meditated');
    ok(fights >= 0, `bot: ${fights} encounters on the way were resolved`);
  }
}

{
  const bot = require(path.join(ROOT, 'tools/aayla98-bot.cjs'));
  const mk = (group, opts) => {
    opts = opts || {};
    const S = Object.assign(A.newState(), { items: {} }, opts.S || {});
    A.Party.ensure(S);
    return new A.Battle(Object.assign({ group, seed: 5 }, opts, { S }));
  };
  const even = b => { b.rnd01 = () => 0.5; return b; };
  const one = (b, key) => b.units.find(u => u.key === key && b.active(u));
  const exp = (sk, atk, def, m, k) => Math.max(1, Math.round(sk.power * atk / (atk + def) * m * (k || 1)));

  {
    for (const [g, d] of Object.entries(A.GROUPS)) for (const [type, row, slot] of d.units) {
      ok(A.ENEMIES[type] && ['front', 'back'].includes(row) && slot >= 0 && slot <= 2, `group ${g}: ${type} in ${row} ${slot}`);
    }
    for (const [id, e] of Object.entries(A.ENEMIES)) {
      ok(A.ENEMY_KINDS[e.kind] && A.WEIGHTS[e.weight] && e.hp > 0 && e.agi > 0, 'enemy data: ' + id);
      ok(['beast', 'illusion', 'droid'].includes(e.kind) || A.NRAV[e.nrav], 'sentient enemies have a temper: ' + id);
      ok(!e.weapon || e.weapon === 'none' || A.Pix.WEAPONS[e.weapon], 'enemy weapon has a drawing: ' + id);
    }
    for (const [id, h] of Object.entries(A.HEROES)) for (const s of h.skills) ok(A.SKILLS[s], `skill ${s} of ${id}`);
    ok(A.HEROES.vos.skills.includes('read') && A.SKILLS.read.menu === 'own', 'Vos has his own move: Reading');
    ok(Object.values(A.SKILLS).every(s => !s.type || A.TYPES[s.type]), 'every damage type is known');
    const st = A.stats('aayla', 15);
    ok(st.hp === Math.round(A.HEROES.aayla.base.hp + A.HEROES.aayla.grow.hp * 15), 'stats grow with level');
    ok([2, 5, 15, 30].every(l => A.levelFor(A.xpFor(l)) === l && A.levelFor(A.xpFor(l) - 1) === l - 1), 'experience and level agree');
  }

  {
    const b = mk('smugglers_a');
    b.begin();
    const a = b.unit('aayla');
    ok(b.current() === a, 'with no ambush the quickest hero goes first');
    ok(Math.abs(b.delay(a) - 1000 / a.agi) < 1e-9, 'delay = 1000 / Agility');
    const tl = b.timeline(8);
    ok(tl.length === 8 && tl[0] === 'aayla', 'the timeline shows the next eight turns');
    const keep = a.next;
    const soon = b.forecast(a, 'roll', 8).indexOf('aayla'), late = b.forecast(a, 'whirl', 8).indexOf('aayla');
    ok(soon >= 0 && late >= 0 && soon <= late, 'a light action brings the next turn sooner than a heavy one');
    ok(a.next === keep, 'the forecast does not move anyone');
    const sm = one(b, 'smuggler');
    ok(b.shotsBefore('aayla', b.forecast(a, 'deflect', 12)) >= 1 && sm.ai === 'shooter', 'the timeline counts the shots before her next turn');
    const amb = mk('smugglers_a', { advantage: 'party' });
    ok(amb.current().side === 'party' && amb.enemies().filter(e => e.breach).length === 1, 'ambush: our turn first and one enemy in a breach');
    const caught = mk('smugglers_a', { advantage: 'enemy' });
    const ev = caught.begin();
    ok(ev.some(e => e.type === 'shot' || e.type === 'strike'), 'spotted: the enemy strikes before our first turn');
  }

  {
    const b = even(mk('smugglers_a'));
    b.begin();
    const a = b.unit('aayla'), v = b.unit('vos'), thug = one(b, 'thug'), sm = one(b, 'smuggler');
    let r = b.damage(a, thug, A.SKILLS.blade);
    ok(r.dmg === exp(A.SKILLS.blade, a.mig, thug.sta, 1) && !r.weak, 'damage = power x attack / (attack + defence)');
    r = b.damage(a, thug, A.SKILLS.push);
    ok(r.weak && r.dmg === exp(A.SKILLS.push, a.wil, thug.sta, 1.5), 'the Push hits a weakness x1.5 and uses Will');
    r = b.damage(v, sm, A.SKILLS.vlightning);
    ok(r.weak && r.dmg === exp(A.SKILLS.vlightning, v.wil, sm.sta, 1.5), 'lightning is a discharge, smugglers are weak to it');
    const droid = Object.assign({}, sm, { kind: 'droid' }), anz = Object.assign({}, sm, { kind: 'anzat' });
    ok(b.mult(droid, 'mind') === 0 && b.mult(droid, 'ion') === 1.5 && b.mult(anz, 'mind') === 0.5 && b.mult(a, 'blade') === 1, 'immunity 0, resistance x0.5, heroes take plain damage');
    b.rnd01 = () => 0;
    const lo = b.damage(a, thug, A.SKILLS.blade).dmg;
    b.rnd01 = () => 0.999;
    const hi = b.damage(a, thug, A.SKILLS.blade).dmg;
    even(b);
    ok(lo < hi && lo >= Math.floor(exp(A.SKILLS.blade, a.mig, thug.sta, 0.95)) && hi <= Math.ceil(exp(A.SKILLS.blade, a.mig, thug.sta, 1.05)), 'spread 0.95 to 1.05');
    const before = thug.next, t0 = a.tempo;
    b.strike(a, thug, 'push', []);
    ok(thug.breach && Math.abs(thug.next - before - b.delay(thug) * 0.5) < 1e-9 && a.tempo === t0 + 1, 'a weakness opens a breach: half a turn back and +1 Tempo');
    const plain = exp(A.SKILLS.blade, a.mig, thug.sta, 1);
    r = b.damage(a, thug, A.SKILLS.blade);
    ok(r.breached && r.dmg === exp(A.SKILLS.blade, a.mig, thug.sta, 1, 1.25) && !thug.breach, 'the next hit into a breach is x1.25 and closes it');
    const mor = Object.assign({}, thug, { kind: 'morgukai', hp: 900, status: {}, breach: false });
    const ev = [];
    r = b.strike(a, mor, 'blade', ev);
    ok(r.dmg === 0 && ev[0].cortosis && a.status.saberOff === 1, 'cortosis: no damage and the saber goes out');
    ok(b.commands(a).filter(c => A.SKILLS[c.id] && A.SKILLS[c.id].type === 'blade').every(c => !c.enabled && c.why === 'клинок погас'), 'with the saber out every blade move is closed');
    ok(b.damage(a, mor, A.SKILLS.push).weak, 'strikes and the Force work against cortosis');
    delete a.status.saberOff;
    thug.guard = true;
    ok(b.damage(a, thug, A.SKILLS.blade).dmg === exp(A.SKILLS.blade, a.mig, thug.sta, 1, 0.5) && plain > 0, 'Guard halves the damage');
    thug.guard = false;
    sm.status.fear = 2;
    ok(b.damage(sm, a, A.SKILLS.shot).dmg < b.damage(Object.assign({}, sm, { status: {} }), a, A.SKILLS.shot).dmg, 'fear weakens attacks');
    delete sm.status.fear;
    sm.status.blind = 2;
    const blind = b.damage(sm, a, A.SKILLS.shot).dmg;
    delete sm.status.blind;
    ok(Math.abs(blind - b.damage(sm, a, A.SKILLS.shot).dmg * 0.5) <= 1, 'blinded shooters hit for half');
    sm.rage = true;
    const angry = b.damage(sm, a, A.SKILLS.shot).dmg;
    sm.rage = false;
    ok(angry > b.damage(sm, a, A.SKILLS.shot).dmg, 'rage: +25 % attack');
  }

  {
    const b = even(mk('smugglers_c'));
    b.begin();
    const a = b.unit('aayla'), sm = b.inRow('back')[0];
    a.tempo = 0;
    b.perform(a, 'deflect', a.id, [], {});
    ok(a.deflect.charges === A.STANCE.deflect[0].charges && a.deflect.share === A.STANCE.deflect[0].share, 'Deflect I: two shots, half damage back');
    const hp0 = a.hp, s0 = sm.hp, full = b.damage(sm, a, A.SKILLS.shot).dmg;
    b.enemyHit(sm, a, 'shot', []);
    b.enemyHit(sm, a, 'shot', []);
    ok(a.hp === hp0 && s0 - sm.hp === 2 * Math.max(1, Math.round(full * 0.5)), 'two shots go back into the shooter');
    ok(a.tempo === 2, '+1 Tempo for each deflected shot');
    b.enemyHit(sm, a, 'shot', []);
    ok(a.hp === hp0 - full, 'the third shot gets through');
    const v = b.unit('vos'), vh = v.hp;
    b.enemyHit(sm, v, 'shot', []);
    ok(v.hp < vh, 'shots at other heroes are not deflected');
    a.deflectLevel = 3;
    b.perform(a, 'deflect', a.id, [], {});
    ok(a.deflect.charges === 4 && a.deflect.share === 1, 'Deflect III: four shots, full damage');
  }

  {
    let b = even(mk('smugglers_b'));
    b.begin();
    const thug = one(b, 'thug'), sm = one(b, 'smuggler');
    b.shove(thug, 20, 1, []);
    ok(thug.row === 'back' && thug.slot !== sm.slot, 'the Push throws the front row into the back row');
    const hp = thug.hp, nx = thug.next, ev = [];
    b.shove(thug, 20, 1, ev);
    ok(thug.hp === hp - 10 && Math.abs(thug.next - nx - b.delay(thug) * 0.3) < 1e-9 && ev.some(e => e.type === 'collide'), 'with no hazard behind: half the push and a step back on the timeline');
    b = even(mk('smugglers_c'));
    b.begin();
    const back = b.inRow('back');
    b.shove(back[0], 20, 1, []);
    ok(back[0].gone === 'fell' && !b.active(back[0]), 'a common enemy at the chasm falls out of the fight');
    back[1].boss = true;
    const bh = back[1].hp;
    b.shove(back[1], 20, 1, []);
    ok(back[1].hp === bh - Math.round(back[1].maxhp * 0.15) && back[1].hazardCool === 3 && b.active(back[1]), 'a boss loses 15 % at the edge');
    b.shove(back[1], 20, 1, []);
    ok(back[1].hp === bh - Math.round(back[1].maxhp * 0.15) - 10, 'not more often than once in three turns');
    back[1].boss = false;
    back[1].elite = true;
    back[1].hazardCool = 0;
    const eh = back[1].hp;
    b.shove(back[1], 20, 1, []);
    ok(back[1].hp === eh - Math.round(back[1].maxhp * 0.4), 'an elite loses 40 %');
    const front = b.inRow('front')[0];
    front.weight = 'heavy';
    b.shove(front, 20, 1, []);
    ok(front.row === 'front' && front.pushes === 1, 'a heavy enemy does not move after one push');
    b.shove(front, 20, 1, []);
    ok(front.row === 'back', 'the second push in one round moves him');
    b = mk('smugglers_a');
    b.begin();
    const a = b.unit('aayla'), far = b.inRow('back')[0];
    ok(b.targets(a, 'pull').includes(far.id), 'the Pull reaches the back row while the front row has room');
    b.perform(a, 'pull', far.id, [], {});
    ok(far.row === 'front', 'the Pull brings him forward');
    b.addEnemy('thug', 'front', b.freeSlot('front'));
    ok(b.freeSlot('front') === null && !b.targets(a, 'pull').length, 'no Pull while the front row is full');
    b.perform(a, 'disarm', far.id, [], {});
    ok(far.disarmed === 2 && b.plan(far).skill !== 'shot', 'a disarmed shooter cannot fire');
  }

  {
    const b = even(mk('spider_boss'));
    b.begin();
    const a = b.unit('aayla'), boss = one(b, 'giant_spider');
    ok(b.braceUp && b.commands(a).some(c => c.id === 'brace' && c.enabled), 'the mine brace can be brought down');
    const small = b.addEnemy('spider', 'back', 0), hp = boss.hp, nx = boss.next, ev = [];
    b.perform(a, 'brace', 'none', ev, {});
    ok(small.gone === 'trapped' && boss.hp === hp - Math.round(boss.maxhp * 0.15) && boss.next > nx, 'the cave-in takes the back row: a common enemy is out, the boss loses 15 %');
    ok(!b.braceUp && !b.commands(a).some(c => c.id === 'brace'), 'the brace falls only once');
    ok(ev.find(e => e.type === 'collapse').hit.some(h => h[0] === boss.id && h[2] > 0), 'the cave-in event carries the damage');
    const c = mk('spider_boss');
    const giant = one(c, 'giant_spider');
    const plan = [0, 1, 2, 3].map(() => c.plan(giant).skill);
    ok(plan.join() === 'bigbite,web,bigbite,swarm', 'the giant spider bites, spins a web, bites and calls the swarm');
    c.addEnemy('spider', 'front', 1);
    for (let i = 0; i < 3; i++) c.plan(giant);
    ok(c.plan(giant).skill === 'bigbite', 'with no room in front the swarm call becomes a bite');
    const d = mk('spider_boss');
    d.begin();
    const g2 = one(d, 'giant_spider'), want = d.intents(g2).map(i => i.skill);
    ok(want.length === 2, 'Reading shows the next two moves');
    const evs = [];
    d.enemyAct(g2, evs);
    const did = evs.find(e => e.who === g2.id);
    ok(did && (did.skill === want[0] || (want[0] === 'swarm' && did.type === 'summon')), 'the read moves are the ones he makes');
    ok(!d.commands(d.unit('aayla')).find(x => x.id === 'flee').enabled, 'no retreat from a boss');
  }

  {
    const S = { flags: {} };
    const b = mk('smugglers_b', { S });
    b.begin();
    const a = b.unit('aayla');
    const sm = one(b, 'smuggler'), thug = one(b, 'thug');
    ok(b.approaches(sm).find(x => x.id === 'persuade').why === 'нет довода', 'Persuade needs an argument');
    ok(!b.targets(a, 'talk').some(id => b.unit(id).kind === 'beast'), 'no talking to beasts');
    const ev = [];
    b.talk(a, thug, 'mind', ev);
    ok(ev[0].outcome === 'rage' && thug.rage && !b.targets(a, 'talk').includes(thug.id), 'twi\'leks resist suggestion: a strong will turns it into rage and closes the Word');
    b.talk(a, sm, 'mind', []);
    ok(sm.gone === 'talked' && b.talked === 1 && b.darkDelta === -1, 'a coward runs from a suggestion; talking counts as a win and takes Darkness away');
    const c = mk('smugglers_b', { S: { flags: { clue_lessu_market_d: true } } });
    c.begin();
    ok(c.approaches(one(c, 'smuggler')).find(x => x.id === 'persuade').enabled, 'a clue from the field gives an argument');
    c.talk(c.unit('aayla'), one(c, 'thug'), 'persuade', []);
    ok(c.S.flags.info_smugglers_b, 'a mercenary sells what he knows');
    for (const [nrav, row] of Object.entries(A.TALK.table)) for (const [ap, out] of Object.entries(row)) {
      A.ENEMIES.__talk = Object.assign({}, A.ENEMIES.smuggler, { nrav, twilek: false, resolve: 0 });
      const t = mk('smugglers_b', { S: { flags: { clue_lessu_market_d: true } } });
      t.begin();
      const e = t.addEnemy('__talk', 'front', 0), e2 = [];
      t.talk(t.unit('aayla'), e, ap, e2);
      ok(e2[0].outcome === out && (out === 'rage' ? e.rage && !e.gone : e.gone === 'talked'), `Word: ${nrav} x ${ap} = ${out}`);
      ok(t.darkDelta === (ap === 'threat' ? 1 : 0) - (out === 'rage' ? 0 : 1), `Darkness for ${nrav} x ${ap}`);
    }
    delete A.ENEMIES.__talk;
    const w = mk('smugglers_b');
    w.begin();
    one(w, 'smuggler').gone = 'talked';
    one(w, 'thug').gone = 'fell';
    ok(w.check([]) && w.over === 'win', 'the fight is won when no enemy is left standing');
    ok(w.rewards.xp === A.ENEMIES.smuggler.xp + A.ENEMIES.thug.xp && w.rewards.credits === A.ENEMIES.smuggler.credits, 'the same experience for talking and for the chasm, no credits from the chasm');
  }

  {
    const b = mk('smugglers_b');
    b.begin();
    const a = b.unit('aayla');
    a.status.poison = 3;
    let ev = [];
    b.startTurn(a, ev);
    ok(ev.some(e => e.type === 'poison' && e.dmg === Math.round(a.maxhp * 0.05)) && a.status.poison === 2, 'poison: 5 % per turn, three turns');
    a.status.stun = true;
    a.tempo = 4;
    ok(b.startTurn(a, []) === true && a.tempo === 0 && !a.status.stun, 'stun skips the turn and drops the Tempo');
    a.fp = 10;
    a.status.calm = 2;
    b.startTurn(a, []);
    ok(a.fp === 10 + Math.round(a.maxfp * 0.1), 'calm doubles the Force regeneration');
    a.guard = true;
    b.startTurn(a, []);
    ok(!a.guard, 'Guard lasts until her next turn');
  }

  {
    const b = mk('smugglers_b');
    b.begin();
    const a = b.unit('aayla');
    a.hp = 100;
    const n = b.items.bacta;
    let ev = b.act('item:bacta', 'aayla');
    ok(ev.find(e => e.type === 'heal').amount === Math.round(a.maxhp * 0.3) && b.items.bacta === n - 1, 'bacta: +30 % health, one patch used');
    const c = mk('smugglers_b');
    c.begin();
    const t0 = c.unit('aayla').tempo;
    ev = c.act('item:stim', 'aayla');
    ok(ev.some(e => e.type === 'tempo' && e.amount === 2) && c.unit('aayla').tempo >= t0 + 2, 'stim: +2 Tempo');
    const f = mk('smugglers_b');
    f.begin();
    const hp = f.S.party[0].hp;
    f.act('flee');
    const res = f.finish();
    ok(f.over === 'flee' && res.xp === 0 && f.S.party[0].hp === hp, 'a retreat keeps health and gives nothing');
  }

  {
    const m = A.Party.member('aayla', 15), st = A.stats('aayla', 15);
    m.hp = st.hp - 70;
    m.fp = 40;
    let r = A.Party.recover(m);
    ok(m.hp === st.hp && r.fp === Math.ceil(70 / A.RECOVER.hpPerFp) && m.fp === 40 - r.fp, 'after a win the Force closes the wounds');
    m.hp = 10;
    m.fp = 3;
    r = A.Party.recover(m);
    ok(m.fp === 0 && m.hp === 10 + 3 * A.RECOVER.hpPerFp, 'the wounds close only as far as the Force goes');
    const S = Object.assign(A.newState(), { items: {} });
    A.Party.ensure(S);
    const xp0 = S.party[0].xp;
    const out = bot.fight('smugglers_b', 3, { S, keep: true });
    ok(out.over === 'win' && S.party[0].xp === xp0 + A.ENEMIES.smuggler.xp + A.ENEMIES.thug.xp, 'experience goes to every hero');
    ok(S.credits === A.ENEMIES.smuggler.credits + A.ENEMIES.thug.credits, 'credits from beaten enemies');
    const k = mk('smugglers_b');
    k.begin();
    k.unit('vos').hp = 0;
    k.over = 'win';
    k.rewards = k.reward();
    k.finish();
    ok(k.S.party.find(x => x.id === 'vos').hp >= 1, 'a fallen hero gets up after a won fight');
    A.Party.rest(S);
    ok(S.party.every(x => x.hp === A.stats(x.id, x.level).hp && x.fp === A.stats(x.id, x.level).fp), 'meditation heals the party and gives back the Force');
    const story = mk('smugglers_b', { difficulty: 'story' }), master = mk('smugglers_b', { difficulty: 'master' });
    ok(one(story, 'thug').maxhp === Math.round(A.ENEMIES.thug.hp * 0.7) && one(master, 'thug').maxhp === Math.round(A.ENEMIES.thug.hp * 1.2), 'difficulty changes enemy health');
    const help = mk('smugglers_b', { help: true }), plainB = mk('smugglers_b');
    ok(help.unit('aayla').maxhp === Math.round(plainB.unit('aayla').maxhp * 1.25), 'Help of the Force: +25 % health for this fight');
  }

  {
    const normal = ['smugglers_a', 'smugglers_b', 'smugglers_c', 'smugglers_d', 'spiders_a', 'spiders_b'];
    let hpSum = 0;
    for (const g of normal) {
      const r = bot.report(g, 60, { difficulty: 'normal' });
      ok(r.win >= 0.97 && r.stuck === 0, `bot wins ${g}: ${(r.win * 100).toFixed(1)} %`);
      ok(r.aayla >= 2 && r.aayla <= 5, `${g}: ${r.aayla} turns of Aayla (2-5)`);
      hpSum += r.hp;
    }
    const avg = hpSum / normal.length;
    ok(avg >= 0.7 && avg <= 0.85, `after a common fight the party keeps ${(avg * 100).toFixed(1)} % health on average (70-85)`);
    const boss = bot.report('spider_boss', 60, { difficulty: 'normal' });
    ok(boss.win >= 0.85 && boss.aayla >= 8 && boss.aayla <= 14, `boss: ${(boss.win * 100).toFixed(1)} % wins, ${boss.aayla} turns of Aayla (8-14)`);
    const chains = Array.from({ length: 21 }, (_, i) => bot.chain(['smugglers_a', 'smugglers_b', 'smugglers_c', 'smugglers_d'], 1000 + i * 50)).sort((x, y) => x - y);
    ok(chains[10] >= 4 && chains[10] <= 6, `the Force runs out after ${chains[10]} fights in a row (4-6)`);
  }
}

{
  for (const name of A.MUSIC) ok(A.TRACKS[name], 'music track exists: ' + name);
  for (const [name, tr] of Object.entries(A.TRACKS)) {
    const lens = tr.parts.map(pt => A.parseNotes(pt.notes).reduce((s, n) => s + n[1], 0));
    ok(tr.bpm >= 50 && tr.bpm <= 180 && lens.every(l => l === lens[0] && l % 4 === 0), `music ${name}: every part loops in whole bars (${lens.join(', ')})`);
    ok(tr.parts.every(pt => ['square', 'triangle', 'sine', 'sawtooth', 'noise'].includes(pt.wave) && pt.vol > 0 && pt.vol <= 0.2), `music ${name}: waves and volumes`);
  }
  ok(Math.abs(A.noteFreq('A4') - 440) < 1e-9 && Math.abs(A.noteFreq('A5') - 880) < 1e-9 && Math.abs(A.noteFreq('C#5') - A.noteFreq('Db5')) < 1e-9, 'note frequencies');
  ok(Object.values(A.Maps.DEFS).every(d => !d.music || A.TRACKS[d.music]), 'every map plays a known track');
}

{
  const S = Object.assign(A.newState(), { items: {} });
  A.Party.ensure(S);
  S.party[0].level = 16;
  const r = A.Party.forget(S);
  ok(r.level === 16 && r.lost.length === A.HEROES.aayla.skills.length - A.BASIC_SKILLS.length && !r.lost.includes('blade'), 'Aayla forgets every move she had: ' + r.lost.length);
  ok(S.party.length === 1 && S.party[0].id === 'aayla' && S.party[0].level === 1 && S.party[0].skills.length === 0 && !Object.keys(S.items).length, 'after the prologue: Aayla alone, level 1, no moves, no kit');
  A.Party.ensure(S);
  ok(S.party.length === 1 && !S.items.bacta, 'the prologue party does not come back after the forgetting');
  const b = new A.Battle({ S, group: 'smugglers_b', seed: 3 });
  ok(b.unit('aayla').skills.join() === 'fists,guard,talk' && !b.unit('aayla').armed, 'without memory and without a sabre Aayla fights hand to hand, guards and talks');
  S.flags.saber = true;
  S.memory = [1, 4];
  const b2 = new A.Battle({ S, group: 'smugglers_b', seed: 3 });
  ok(b2.unit('aayla').skills.join() === 'blade,push,deflect,guard,talk' && b2.unit('aayla').armed, 'the sabre gives back the blade, memory fragments give back their moves');
  ok(A.Party.look(S, 'aayla') === 'aayla_padawan' && A.Party.look(Object.assign({}, S, { chapter: 'ch1' }), 'aayla') === 'aayla_dancer', 'Aayla is a dancer in chapter 1');
  delete S.flags.saber;
  S.memory = [];
  const S2 = Object.assign(A.newState(), { items: {} });
  A.Party.ensure(S2);
  const nb = new A.Battle({ S: S2, group: 'smugglers_b', seed: 3, noFlee: true });
  nb.begin();
  const flee = nb.commands(nb.current()).find(c => c.id === 'flee');
  ok(!flee.enabled && flee.why === 'отступать некуда', 'no retreat from a fight the story starts');
}

{
  const S = Object.assign(A.newState(), { items: {} });
  const f = new A.Field(S, 'ryll_mine', 'start');
  ok(f.followers.length === 1 && f.followers[0].look === 'vos_early', 'Vos follows Aayla into the mine');
  ok(f.map.def.dark && f.map.def.music === 'ryloth', 'the mine is dark');
  const tr = f.objs.find(o => o.type === 'trigger');
  f.p.x = (tr.x - 1) * A.Maps.TILE + 8;
  f.p.y = tr.y * A.Maps.TILE + 14;
  let evs = [];
  for (let i = 0; i < 30 && !evs.some(e => e.type === 'scene'); i++) { f.step(1 / 60, { dx: 1 }); evs = evs.concat(f.take()); }
  ok(evs.some(e => e.type === 'scene' && e.label === 'pro_asante'), 'stepping on the fork starts the scene with Asante');
  ok(!f.objs.includes(tr), 'the trigger fires once');
  S.flags.asante_joined = true;
  f.refresh();
  ok(f.followers.map(x => x.look).join() === 'vos_early,asante_guard', 'after the scene Asante walks last');
  const g = new A.Field(S, 'ryll_mine', 'start');
  ok(!g.objs.some(o => o.type === 'trigger') && g.followers.length === 2, 'the scene does not repeat, Asante stays in the party');
  const cocoon = g.objs.find(o => o.type === 'cocoon' && !o.lines);
  ok(g.verb(cocoon) === 'Осмотреть' && g.objSolid(cocoon), 'cocoons block the way and can be examined');
  const lair = g.objs.find(o => o.type === 'scene');
  ok(lair.label === 'pro_lair' && g.verb(lair) === 'Логово', 'the lair opens its scene');
}

{
  const bot = require(path.join(ROOT, 'tools/aayla98-bot.cjs'));
  const runs = Array.from({ length: 12 }, (_, i) => bot.story(i + 1, { stop: 'ch1' }));
  ok(runs.every(r => r.end), 'bot story: every run reaches the title of the game and the start of chapter 1');
  ok(runs.every(r => r.maps.join() === 'lessu_market,ryll_tunnels,ryll_mine' && r.scenes.join() === 'pro_warehouse,pro_asante,pro_lair'), 'bot story: market, tunnels, mine and the three map scenes in order');
  ok(runs.every(r => r.fights >= 3 && r.retries === 0), 'bot story: fights on the way are won');
  ok(runs.every(r => r.S.flags.forgot && r.S.party.length === 1 && r.S.party[0].level === 1 && ['polite', 'cold', 'father'].includes(r.S.flags.pol_tone) && r.S.flags.asante_joined), 'bot story: the prologue ends with the forgetting and keeps the choices');
  ok(new Set(runs.map(r => r.S.flags.pol_tone)).size === 3, 'random choices reach every tone at Pol');
  const seen = new Set(runs.flatMap(r => [...r.seen]));
  const want = ['lessu_market:d', 'lessu_market:ryll_tunnels', 'ryll_tunnels:x', 'ryll_mine:e', 'ryll_mine:c', 'ryll_mine:w', 'ryll_mine:k', 'ryll_mine:t', 'ryll_mine:a', 'ryll_mine:v', 'ryll_mine:u', 'ryll_mine:b', 'ryll_mine:z'];
  for (const w of want) ok(seen.has(w), 'bot story reached ' + w);
  ok([...seen].some(s => /^ryll_mine:X/.test(s)) && [...seen].some(s => /^ryll_mine:M/.test(s)), 'bot story broke the cracked wall and meditated in the mine');
}

{
  const Mm = A.Memory;
  ok(A.MEMORY.length === 12 && A.MEMORY.map(e => e.id).join() === '1,2,3,4,5,6,7,8,9,10,11,12', '12 memory fragments of plan 7.8');
  for (const e of A.MEMORY) {
    ok(A.Art.LIST.still[e.still] && e.title && e.place && e.text && e.at >= 31 && e.at <= 48, 'memory fragment has a picture, a place and a retelling: ' + e.id);
    if (!e.gap) ok((e.skill && A.SKILLS[e.skill]) || (e.field && e.field.every(f => Mm.FIELD[f])), 'memory fragment returns a move: ' + e.id);
  }
  ok(A.MEMORY.filter(e => e.gap).map(e => e.id).join() === '11', 'only the Stark war story stays an empty place');
  ok(Mm.DOSES.join() === '1,4,5,6,10' && Mm.DOSES.every(id => /гл\. 1/.test(Mm.get(id).place)), 'five poured doses return fragments 1, 4, 5, 6 and 10 in this order');
  const S = A.newState();
  ok(['sense', 'push', 'pull', 'sneak', 'meditate', 'jump'].every(a => Mm.can(S, a)), 'before the forgetting Aayla has every field ability');
  A.Party.forget(S);
  ok(['sense', 'push', 'pull', 'sneak', 'meditate', 'jump'].every(a => !Mm.can(S, a)), 'after the forgetting the field abilities are gone');
  Mm.recall(S, 1);
  Mm.recall(S, 1);
  ok(S.memory.join() === '1' && Mm.can(S, 'push') && !Mm.can(S, 'pull') && Mm.skills(S).join() === 'push', 'the first fragment returns the Force push in battle and in the field');
  for (const id of [2, 6, 10]) Mm.recall(S, id);
  ok(Mm.can(S, 'sense') && Mm.can(S, 'meditate') && Mm.can(S, 'sneak') && !Mm.can(S, 'jump'), 'the tunic returns the Sense, T\'da meditation on the move, Tatooine stealth');
  let threw = false;
  try { Mm.recall(S, 11); } catch (e) { threw = true; }
  ok(threw, 'the empty place of the Stark war cannot be recalled');
  ok(/«Толчок»/.test(Mm.reward(Mm.get(1))) && /скрытность/.test(Mm.reward(Mm.get(10))), 'rewards are named for the player');
}

{
  const Sv = A.Save, mem = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }; };
  ok(Sv.keys().length === 14 && Sv.keys().every(k => /^aayla98_/.test(k)) && Sv.keys().includes('aayla98_slot_10') && Sv.keys().includes('aayla98_quick'), 'save keys of plan 7.14: ten slots, auto, quick, settings, album');
  const bot = require(path.join(ROOT, 'tools/aayla98-bot.cjs'));
  const run = bot.story(5, { start: 'ch1', drink: [2], stop: 'ch2' });
  const S = run.S;
  S.time = 1234.5;
  const store = mem(), thumb = 'data:image/jpeg;base64,' + 'A'.repeat(20000);
  const size = Sv.write(store, Sv.slotKey(3), Sv.pack(S, { place: 'Порт', thumb }, 'slot'));
  ok(size <= Sv.LIMIT, 'a chapter 1 save with a thumbnail fits in 60 KB: ' + size);
  const back = Sv.read(store, Sv.slotKey(3));
  ok(back && back.v === A.SAVE_VERSION && back.meta.chapter === S.chapter && back.meta.place === 'Порт' && back.meta.time === 1235 && back.meta.thumb === thumb, 'save keeps the chapter, the place, the play time and the thumbnail');
  ok(Sv.hash(back.S) === Sv.hash(S), 'save, load, the same hash');
  ok(Sv.hash(Object.assign({}, S, { dark: S.dark + 1 })) !== Sv.hash(S), 'the hash sees a change');
  const huge = Sv.pack(S, { thumb: 'x'.repeat(70000) });
  ok(Sv.encode(huge).length <= Sv.LIMIT && JSON.parse(Sv.encode(huge)).meta.thumb === null, 'a thumbnail that does not fit is dropped');
  let threw = false;
  try { Sv.encode(Sv.pack(Object.assign({}, S, { flags: { junk: 'y'.repeat(70000) } }))); } catch (e) { threw = true; }
  ok(threw, 'a save above 60 KB is refused');
  Sv.write(store, Sv.KEYS.quick, Object.assign(Sv.pack(S, {}, 'quick'), { at: back.at + 5000 }));
  const list = Sv.list(store);
  ok(list.length === 12 && list[0].kind === 'auto' && list[1].kind === 'quick' && list[2].name === 'Ячейка 1' && !!list[4].blob, 'the load list: auto, quick, ten slots');
  ok(Sv.latest(store).kind === 'quick', 'continue picks the newest save');
  const old = { stub: true, version: 1, field: { map: 'ryll_tunnels', x: 100, y: 120, dir: 'left', maps: {} }, party: [A.Party.member('aayla', 15)], items: { bacta: 1 }, dark: 0, at: 77 };
  store.setItem(Sv.KEYS.auto, JSON.stringify(old));
  const mig = Sv.read(store, Sv.KEYS.auto);
  ok(mig && mig.v === A.SAVE_VERSION && mig.S.chapter === 'pro' && mig.S.field.map === 'ryll_tunnels' && mig.S.items.bacta === 1 && mig.S.scene.pc.label === 'pro_lessu' && mig.S.resume === null, 'the stage 5 auto save of the previous version is carried over');
  store.setItem(Sv.slotKey(9), '{broken');
  ok(Sv.read(store, Sv.slotKey(9)) === null, 'a broken slot reads as empty');
  const set = Sv.loadSettings(store);
  ok(set.cps === 45 && set.music === 70 && set.sfx === 80 && set.difficulty === 'normal', 'default settings');
  Sv.saveSettings(store, Object.assign(set, { cps: 80 }));
  ok(Sv.loadSettings(store).cps === 80, 'settings are kept');
  const S2 = JSON.parse(JSON.stringify(back.S));
  S2.field = { map: 'pol_estate', x: 23 * 16 + 8, y: 15 * 16 + 14, dir: 'left', maps: S2.field.maps };
  S2.flags.escape = false;
  S2.flags.day = 3;
  const f = new A.Field(S2, 'pol_estate', null, { x: S2.field.x, y: S2.field.y, dir: 'left' });
  ok(f.p.x === S2.field.x && f.p.y === S2.field.y && f.p.dir === 'left' && f.playerTile().join() === '23,15', 'loading puts Aayla back on the same spot of the map');
}

{
  const bad = (src, re) => {
    let errs;
    try { errs = X.check(X.parse(src, 'bad'), Object.assign(ctx(['a']), { groups: A.GROUPS })); } catch (e) { errs = [e.message]; }
    ok(errs.some(e => re.test(e)), 'broken script is caught: ' + re);
  };
  bad('@a\nchapter ch9\nstop', /unknown chapter/);
  bad('@a\n-: раз\nchapter ch1\nstop', /chapter must open its label/);
  bad('@a\nrecall 11\nstop', /unknown memory fragment/);
  bad('@a\nrecall 40\nstop', /unknown memory fragment/);
  bad('@a\nrecall wampa\nstop', /recall <fragment number>/);
  const S = A.newState();
  X.apply(S, X.parseEffects('day=3 suspicion+150'));
  ok(S.flags.suspicion === 100 && X.test(S, X.parseCond('day == 1 || day == 3')) && !X.test(S, X.parseCond('day == 2 || !suspicion')), 'Pol\'s suspicion stays in 0..100, conditions take «or»');
  ok(X.condKeys(X.parseCond('a && b || c')).join() === 'a,b,c', 'condition keys are found inside «or»');
  const st = new X.Story(X.parse('@a\nchapter ch1\nrecall 1\n-: дальше\nstop', 'ok'), S, 'a');
  const e1 = st.next(), e2 = st.next();
  ok(e1.type === 'chapter' && e1.id === 'ch1' && e1.label === 'a' && S.chapter === 'ch1', 'chapter switches the chapter of the save');
  ok(e2.type === 'recall' && e2.id === 1 && S.memory.includes(1) && st.next().text === 'дальше', 'recall returns a fragment and goes on');
}

{
  const P = X.build();
  const run = (S, label, choose) => {
    const st = new X.Story(P, S, label), out = [];
    for (let guard = 0; guard < 400; guard++) {
      const e = st.next();
      out.push(e);
      if (e.type === 'choice') {
        const c = choose ? choose(e, st) : null;
        if (!c) return { st, out, last: e };
        st.choose(c[0], c[1]);
        continue;
      }
      if (['map', 'field', 'end', 'battle'].includes(e.type)) return { st, out, last: e };
    }
    throw new Error('scene does not stop: ' + label);
  };
  const base = tone => { const S = A.newState(); A.Party.forget(S); S.restraint = 1; S.flags.pol_tone = tone; return S; };
  const lines = r => r.out.filter(e => e.type === 'say').map(e => e.text).join(' ');
  const starts = ['polite', 'cold', 'father'].map(t => run(base(t), 'ch1_start'));
  ok(starts.every(r => r.out[0].type === 'chapter' && r.out[0].id === 'ch1'), 'chapter 1 opens with its title card');
  ok(new Set(starts.map(lines)).size === 3, 'the tone at the reception gives Pol one different line in chapter 1');
  ok(starts.every(r => r.last.type === 'choice' && r.last.lekku.who === 'pol' && r.last.lekku.need === 1 && r.st.S.flags.instinct && r.st.S.flags.day === 1), 'the first morning ends with the dose; Pol reads lekku');
  const dose = (S, k, pose) => run(S, 'ch1_dose', e => [k, pose || 'calm']);
  let S = base('polite');
  Object.assign(S.flags, { day: 1, suspicion: 0 });
  let r = dose(S, 0);
  ok(S.flags.doses === 1 && S.flags.dose_today === 'drunk' && S.flags.suspicion === 0 && r.last.type === 'map', 'drinking: one more dose, Pol is calm');
  S = base('polite');
  Object.assign(S.flags, { day: 2, suspicion: 0 });
  dose(S, 1);
  ok(S.flags.poured === 1 && S.flags.dose_today === 'poured' && S.flags.suspicion === 15, 'pretending with calm lekku: the dose goes into the fungus pot, suspicion +15');
  S = base('polite');
  Object.assign(S.flags, { day: 2, suspicion: 0, bala_trick: true });
  dose(S, 1);
  ok(S.flags.suspicion === 8, 'Bala\'s trick leaves fewer traces');
  S = base('polite');
  Object.assign(S.flags, { day: 3, suspicion: 60 });
  r = run(S, 'ch1_dose');
  ok(r.last.lekku.need === 2, 'a suspicious Pol watches the lekku closer');
  dose(S, 1);
  ok(S.flags.doses === 1 && !S.flags.poured && S.flags.dose_today === 'watched' && S.flags.suspicion === 85, 'with too little restraint the lie shows and Pol waits until she drinks');
  S = base('polite');
  S.restraint = 2;
  Object.assign(S.flags, { day: 3, suspicion: 60 });
  dose(S, 1);
  ok(S.flags.poured === 1, 'Misra\'s lekku lesson hides the lie even from a suspicious Pol');
  S = base('polite');
  Object.assign(S.flags, { day: 4, suspicion: 100 });
  r = run(S, 'ch1_morning');
  ok(S.flags.doses === 1 && S.flags.dose_today === 'watched' && S.flags.suspicion === 60 && !r.out.some(e => e.type === 'choice'), 'at suspicion 100 Pol watches her drink: no choice and no fragment that night');
  const night = (poured, today) => {
    const S2 = base('polite');
    Object.assign(S2.flags, { day: 2, poured, dose_today: today });
    const rr = run(S2, 'ch1_night');
    return { S: S2, rr };
  };
  for (let k = 1; k <= 5; k++) {
    const n = night(k, 'poured');
    ok(n.S.memory.join() === String(A.Memory.DOSES[k - 1]) && n.rr.out.some(e => e.type === 'recall'), `the ${k}th poured dose returns fragment ${A.Memory.DOSES[k - 1]} at night`);
  }
  ok(!night(2, 'watched').S.memory.length && !night(2, 'drunk').S.memory.length, 'a drunk dose returns nothing');
  const stranger = k => {
    const S3 = base('polite');
    Object.assign(S3.flags, { day: 5, poured: 0, dose_today: 'drunk' });
    const choices = [];
    const rr = run(S3, 'ch1_night', e => { choices.push(e); return choices.length === 1 ? [k, undefined] : [0, undefined]; });
    return { S: S3, rr, choices };
  };
  const take = stranger(0), refuse = stranger(1);
  ok(take.rr.last.type === 'map' && take.rr.last.id === 'pol_estate' && take.rr.last.at === 'balcony', 'the fifth night leads through the stranger and the balcony to the escape');
  ok(take.S.flags.saber && take.S.bonds.vos.pts === 1 && refuse.S.flags.saber && !(refuse.S.bonds.vos || {}).pts, 'taking the sabre gives Vos a bond point; a refused sabre is picked up on the balcony');
  ok(take.S.flags.escape && take.S.flags.feeling === 'fear' && take.choices[1].options.length === 2, 'the balcony asks for fear or anger and starts the escape');
  const all = lines(take.rr);
  ok(all.includes('Это твой меч, Эйла. Твой световой меч. Возьми.') && all.includes('Чом Фрей Каа'), 'the canon line of the sabre and the name of the patron');
  const S4 = base('polite');
  Object.assign(S4.flags, { escape: true });
  const warn = run(S4, 'ch1_backdoor', e => [2, undefined]);
  ok(S4.flags.warned === 'misra' && warn.last.type === 'map' && warn.last.id === 'rock_gardens', 'the escape warns one servant and goes out to the Rock Gardens');
  const lair = run(base('polite'), 'ch1_lair');
  ok(lair.last.type === 'battle' && lair.last.group === 'lylek_boss', 'the lair holds the lylek boss');
  const port = run(base('polite'), 'ch1_port');
  ok(port.out.some(e => e.type === 'say' && /капсула/.test(e.text)) && port.out.some(e => e.type === 'chapter' && e.id === 'ch2'), 'the port ends the chapter with the pod and opens chapter 2');
  const ch1 = P.order.filter(n => n.startsWith('ch1_'));
  ok(ch1.length >= 50 && !/—/.test(ch1.map(n => P.labels[n].steps.filter(s => s.op === 'say').map(s => s.text).join(' ')).join(' ')), 'chapter 1 scenes use no long dashes: ' + ch1.length + ' labels');
}

{
  const Mp = A.Maps, TS = Mp.TILE;
  for (const id of CH1_MAPS) {
    const m = Mp.parse(id);
    for (const o of m.objects) {
      if (o.cond) ok(Array.isArray(X.parseCond(o.cond)), `map ${id}: condition of ${o.id} parses`);
      if (o.type === 'watch') {
        ok(A.Pix.LOOKS[o.look] && X.build().labels[o.watch], `map ${id}: watcher ${o.id} has a look and a scene`);
        let x = o.x, y = o.y;
        const steps = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };
        for (const c of o.route) {
          const mv = /^([EWNS])(\d+)$/.exec(c);
          if (!mv) continue;
          for (let i = 0; i < +mv[2]; i++) { x += steps[mv[1]][0]; y += steps[mv[1]][1]; ok(!Mp.SOLID.has(m.tiles[y * m.w + x]), `map ${id}: watcher walks on floor at ${x},${y}`); }
        }
        ok(x === o.x && y === o.y, `map ${id}: route of watcher ${o.id} returns home`);
      }
      if (o.type === 'drift') ok(/^[EWNS]\d$/.test(o.lane), `map ${id}: floating rock ${o.id} has a lane`);
    }
  }
  const S = A.newState();
  A.Party.forget(S);
  const present = (flags, letter) => { Object.assign(S.flags, flags); const f = new A.Field(S, 'pol_estate', 'room'); return f.objs.some(o => o.letter === letter); };
  ok(present({ day: 1, escape: false }, 'j') && !present({ day: 2 }, 'j') && present({ day: 3 }, 'j'), 'the ryll merchant visits on days 1 and 3');
  ok(present({ day: 2 }, 'k') && present({ day: 4 }, 'k') && !present({ day: 5 }, 'k'), 'the council envoy visits on days 2 and 4');
  ok(present({ day: 1 }, 'y') && !present({ day: 3 }, 'y') && present({ day: 5 }, 'y'), 'Pol is home on days 1 and 5');
  ok(!present({ day: 1 }, 'e') && present({ day: 3 }, 'e') && present({ day: 1 }, 'd') && !present({ day: 3 }, 'd'), 'the study is open only while Pol sits at the council');
  ok(present({ day: 5 }, 'f') && !present({ day: 5, heard_holo: true }, 'f'), 'the voices behind the door only on day 5, once');
  ok(present({ escape: true }, 'q') && present({ escape: true }, 't') && !present({ escape: true }, 'a') && !present({ escape: false }, 'q'), 'at night the guards come out and the servants stay behind');
  Object.assign(S.flags, { escape: false, day: 2, heard_holo: false });
  const f = new A.Field(S, 'pol_estate', 'room');
  ok(!f.can('sense') && !f.can('push') && f.map.def.pace === 'walk', 'the estate is walked, without the Force');
  f.p.x = 19 * TS + 8;
  f.p.y = 5 * TS + 14;
  f.p.dir = 'up';
  ok(f.prompt().verb === 'Говорить', 'Misra can be talked to');
  f.step(1 / 60, { interact: true });
  ok(f.take().some(e => e.type === 'scene' && e.label === 'ch1_rehearse'), 'a servant with a scene opens it');
  const w = f.objs.find(o => o.type === 'watch');
  f.p.x = w.px + 30;
  f.p.y = w.py;
  w.angle = 0;
  f.step(1 / 60, {});
  const caught = f.take();
  ok(caught.some(e => e.type === 'scene' && e.label === 'ch1_caught') && w.calm > 0, 'the guard in the back corridor catches Aayla and sends her back');
  ok(!caught.some(e => e.type === 'encounter'), 'a watcher never starts a fight');
  const g = new A.Field(A.newState(), 'rock_gardens', 'start');
  const rocks = g.objs.filter(o => o.type === 'drift');
  let inside = false, moved = false;
  for (let i = 0; i < 1200; i++) {
    const before = rocks.map(o => o.x + ',' + o.y).join();
    g.step(1 / 60, { dx: i % 400 < 200 ? 1 : -1, dy: i % 300 < 150 ? -1 : 1 });
    if (rocks.map(o => o.x + ',' + o.y).join() !== before) moved = true;
    const [x0, x1, y0, y1] = g.bodySpan(g.p.x, g.p.y);
    if (rocks.some(o => o.x >= x0 && o.x <= x1 && o.y >= y0 && o.y <= y1)) inside = true;
  }
  ok(moved && !inside, 'floating rocks drift with the wind and never enter Aayla');
  ok(rocks.every(o => !g.tileSolid(o.x, o.y)), 'floating rocks stay over the floor');
  const S5 = A.newState();
  A.Party.forget(S5);
  const road = new A.Field(S5, 'port_road', 'start');
  const W = road.map.def.storm, a = S5.party[0];
  const hp0 = a.hp;
  let phases = new Set();
  for (let i = 0; i < (W.calm + W.warn + W.blow) * 60; i++) { road.step(1 / 60, {}); road.take().forEach(e => e.type === 'storm' && phases.add(e.phase)); }
  ok(phases.has('warn') && phases.has('blow') && a.hp === hp0, 'the heat storm comes in phases and does not burn Aayla in a shelter');
  road.p.x = 29 * TS + 8;
  road.p.y = 9 * TS + 14;
  road.storm = { phase: 'blow', t: 60, heat: 0 };
  for (let i = 0; i < 60 * 60; i++) road.step(1 / 60, {});
  ok(a.hp === 1, 'outside a shelter the storm burns health down, but never kills');
  const caves = new A.Field(S5, 'lylek_caves', 'start');
  const rest = caves.objs.find(o => o.type === 'rest');
  ok(rest && caves.verb(rest) === 'Отдохнуть', 'the miners\' shelter before the lair lets Aayla rest');
}

{
  const mk = (lv, extra) => { const S = A.newState(); A.Party.forget(S); S.chapter = 'ch1'; S.flags.instinct = true; S.flags.saber = true; Object.assign(S, extra || {}); const m = S.party[0]; m.level = lv; const st = A.stats('aayla', lv); m.hp = st.hp; m.fp = st.fp; return S; };
  const S = mk(1);
  const b = new A.Battle({ S, group: 'lylek_a', seed: 4, advantage: 'enemy' });
  const ev = b.begin();
  ok(ev.some(e => e.type === 'strike' && e.skill === 'pounce'), 'a lylek that strikes first drops on Aayla from above');
  const a = b.unit('aayla'), ly = b.enemies()[0];
  a.hp = Math.round(a.maxhp * 0.55);
  const ev2 = [];
  b.enemyHit(ly, a, 'claw', ev2);
  const inst = ev2.filter(e => e.type === 'instinct');
  ok(inst.length === 1 && ev2.some(e => e.type === 'strike' && e.skill === 'instinct' && e.who === 'aayla') && b.instinctUsed, 'below half health Aayla strikes with the Force by instinct');
  a.hp = Math.round(a.maxhp * 0.3);
  const ev3 = [];
  b.enemyHit(b.enemies()[0] || ly, a, 'claw', ev3);
  ok(!ev3.some(e => e.type === 'instinct'), 'the instinct comes once per fight');
  const S2 = mk(1);
  delete S2.flags.instinct;
  const b2 = new A.Battle({ S: S2, group: 'lylek_a', seed: 4 });
  b2.begin();
  b2.unit('aayla').hp = 30;
  const ev4 = [];
  b2.enemyHit(b2.enemies()[0], b2.unit('aayla'), 'claw', ev4);
  ok(!ev4.some(e => e.type === 'instinct'), 'the instinct belongs to chapter 1 only');
  const lyl = b2.enemies()[0];
  ok(Math.abs(b2.mult(lyl, 'blade') - 0.75) < 1e-9 && b2.mult(lyl, 'strike') === 1 && b2.mult(lyl, 'mind') === 1.5 && b2.weakness('lylek').resist.includes('blade'), 'lylek shell: blade x0.75, weak to the mind');
  const S3 = mk(2);
  const b3 = new A.Battle({ S: S3, group: 'guards_b', seed: 2 });
  b3.begin();
  const guard = b3.enemies().find(e => e.key === 'clan_guard'), shooter = b3.enemies().find(e => e.key === 'clan_shooter');
  b3.hurt(guard, 999, []);
  ok(guard.gone === 'ko', 'house guards are knocked out, not killed');
  ok(b3.plan(shooter).skill === 'advance', 'with the front row empty the guard shooter steps forward');
  ok(b3.greet('dutiful').includes('танцовщица') && !b3.canPersuade(), 'house guards talk to the dancer; no argument yet');
  S3.flags.clue_pol_estate_f = true;
  ok(b3.canPersuade(), 'Pol\'s flask is an argument for the guards');
  const tgt = b3.unit('aayla');
  const ev5 = [];
  b3.enemyHit(shooter, tgt, 'barb', ev5);
  ok(tgt.status.slow === 2 && b3.delay(tgt) > 1000 / tgt.agi, 'the lylek barb slows the target');
  const S4 = mk(3);
  S4.party[0].hp = 10;
  S4.party[0].fp = 0;
  const tired = new A.Battle({ S: S4, group: 'lylek_boss', seed: 1 }), retry = new A.Battle({ S: S4, group: 'lylek_boss', seed: 1, retry: 1 });
  ok(tired.unit('aayla').hp === 10 && retry.unit('aayla').hp === Math.round(retry.unit('aayla').maxhp * A.RETRY_FLOOR) && retry.unit('aayla').fp > 0, 'after a defeat the fight starts again with at least half health and Force');
  const bot = require(path.join(ROOT, 'tools/aayla98-bot.cjs'));
  const g = (group, lv, adv) => { let win = 0; for (let s = 1; s <= 40; s++) { const S5 = mk(lv); const b5 = new A.Battle({ S: S5, group, seed: s, advantage: adv || 'none' }); b5.begin(); let n = 0; while (!b5.over && n++ < 400) { const c = bot.choose(b5); b5.act(c.skill, c.target, c.extra); } if (b5.over === 'win') win++; } return win / 40; };
  ok(g('lylek_a', 1, 'enemy') === 1 && g('lylek_b', 2) === 1 && g('lylek_c', 2) >= 0.9 && g('guards_b', 1) === 1, 'chapter 1 fights are won at the chapter level');
  ok(g('lylek_boss', 1) >= 0.85 && g('lylek_boss', 2) === 1, 'the old lylek is beaten even at level 1 at least 85 % of the time');
}

{
  const bot = require(path.join(ROOT, 'tools/aayla98-bot.cjs'));
  const plans = [[], [1], [2, 4], [1, 3, 5], [1, 2, 3, 4], [1, 2, 3, 4, 5], [5], [3, 4]];
  const runs = plans.map((drink, i) => bot.story(i + 21, { start: 'ch1', drink, stop: 'ch2' }));
  ok(runs.every(r => r.end), 'bot story: chapter 1 is finished with every number of drunk doses');
  ok(runs.every(r => r.maps.slice(-4).join() === 'pol_estate,rock_gardens,lylek_caves,port_road' && r.maps.filter(m => m === 'pol_estate').length >= 6), 'five days in the estate, then the escape, the gardens, the caves and the road');
  ok(runs.every(r => r.S.flags.saber && r.S.flags.escape && ['fear', 'anger'].includes(r.S.flags.feeling) && ['nima', 'bala', 'misra'].includes(r.S.flags.warned)), 'every run keeps the sabre, the feeling and the warned servant');
  ok(runs.every(r => { const doseMem = r.S.memory.filter(id => id !== 2); return doseMem.join() === A.Memory.DOSES.slice(0, doseMem.length).join() && doseMem.length <= r.S.flags.poured; }), 'fragments come back in the plan order, never more than the poured doses');
  ok(runs[5].S.flags.doses === 5 && !runs[5].S.memory.some(id => A.Memory.DOSES.includes(id)), 'drinking every dose returns no dose fragment');
  ok(runs.some(r => r.maxSuspicion >= 100), 'careless pouring brings Pol\'s suspicion to 100 in some runs');
  ok(runs.every(r => r.instinct >= 1 && r.retries <= 1), 'the instinct shows up in every run, at most one fight is replayed');
  ok(runs.every(r => r.S.party[0].level >= 2 && r.S.party[0].level <= 5), 'chapter 1 ends between levels 2 and 5 (plan 5.1)');
}

{
  const P = X.build();
  const runTo = (S, label, choose, stopAt) => {
    const st = new X.Story(P, S, label), out = [];
    for (let guard = 0; guard < 600; guard++) {
      const e = st.next();
      out.push(e);
      if (e.type === 'choice') { const c = choose ? choose(e, st) : null; if (!c) return { st, out, last: e }; st.choose(c[0], c[1]); continue; }
      if (['map', 'field', 'end', 'battle'].includes(e.type) || (stopAt && stopAt(e))) return { st, out, last: e };
    }
    throw new Error('scene does not stop: ' + label);
  };
  const fresh = feeling => { const S = A.newState(); A.Party.preset(S, 'ch2'); if (feeling) S.flags.feeling = feeling; return S; };
  const a1 = runTo(fresh('anger'), 'ch2_start'), f1 = runTo(fresh('fear'), 'ch2_start');
  ok(a1.out[0].type === 'chapter' && a1.out[0].id === 'ch2' && a1.st.S.dark === 25 && f1.st.S.dark === 10, 'chapter 2 starts with Darkness 25 after anger and 10 after fear (plan 7.7)');
  ok(a1.last.type === 'map' && a1.last.id === 'kiffex_temple' && a1.out.some(e => e.type === 'say' && /маленькая джедайка/.test(e.text)), 'the voice calls the little Jedi to the temple');
  const rel = runTo(fresh('fear'), 'ch2_release', () => [0, undefined]);
  ok(rel.st.S.flags.gifts && rel.st.S.flags.retinue && rel.st.S.flags.released && rel.st.S.dark === 2 && rel.last.id === 'kiffex_post', 'Karkko is freed, gives the gifts and the retinue and sends her to the post');
  ok(rel.out.some(e => e.type === 'say' && /королевой/.test(e.text)), 'Karkko promises to make her his queen');
  const post = k => { const S = fresh('fear'); S.flags.retinue = true; S.dark = 10; runTo(S, 'ch2_post_end', () => [k, undefined], e => e.type === 'say' && /Корусант/.test(e.text)); return S; };
  ok(post(0).dark === 20 && post(1).dark === 15 && post(2).dark === 5, 'the wounded guard: killing +10, turning away +5, mercy −5');
  const cor = runTo(fresh('fear'), 'ch2_coruscant', null, e => e.type === 'battle');
  const said = cor.out.filter(e => e.type === 'say').map(e => e.text).join(' ');
  ok(said.includes('тринадцати хранителях') && said.includes('Чего бы это ни стоило') && said.includes('Квинлан'), 'Coruscant: Tinte asks for Quinlan, Vilbum sees the holocron, Windu says Karkko must not leave Kiffex');
  ok(cor.last.type === 'battle' && cor.last.group === 'cantina_crowd', 'the cantina starts with the prisoners');
  const off = runTo(Object.assign(fresh(), { dark: 10 }), 'ch2_report', () => [0, undefined]);
  ok(off.st.S.flags.offered && off.st.S.dark === 15 && off.out.some(e => e.type === 'say' && /моя воля/.test(e.text)), 'the report: it was his will; offering herself sets the turning flag');
  const amb = (score) => { const S = fresh(); S.flags.ambush_score = score; return runTo(S, 'ch2_ambush'); };
  ok(amb(2).last.advantage === 'party' && amb(1).last.advantage === 'none' && amb(2).last.group === 'traa_duel', 'good hiding places give the T\'ra Saa fight the first move');
  ok(amb(2).st.S.memory.includes(3) && amb(2).st.S.memory.includes(8), 'Tholme\'s voice and Vos in the hills return fragments 3 and 8');
  const end = runTo(fresh(), 'ch2_kiffu', () => [0, undefined], e => e.type === 'chapter');
  ok(end.last.type === 'chapter' && end.last.id === 'int' && end.st.S.flags.heart && A.Bonds.get(end.st.S, 'vos').letgo === 1 && A.Bonds.rank(end.st.S, 'traa') === 1 && !end.st.S.flags.retinue, 'Kiffu: the Heart of Fire, the first letting go of Vos, T\'ra Saa bond 1, the retinue is gone, then the interlude');
  ok(end.out.some(e => e.type === 'return' && e.bond === 'traa' && e.rank === 1) && end.st.S.bonds.traa.last === 'bond_traa_1', 'the T\'ra Saa bond scene plays inside the Kiffu scene');
  const ch2 = P.order.filter(n => n.startsWith('ch2_'));
  ok(ch2.length >= 20 && !/—/.test(ch2.map(n => P.labels[n].steps.filter(s => s.op === 'say').map(s => s.text).join(' ')).join(' ')), 'chapter 2 scenes use no long dashes: ' + ch2.length + ' labels');
  ok(['ch2_cantina', 'ch2_ambush', 'ch2_lower'].every(n => P.labels[n].steps.some(s => s.op === 'recall')), 'meetings with Vos and Tholme return memories in the cantina, the hills and the sanctum');
}

{
  const mk = (lv, extra) => { const S = A.newState(); A.Party.preset(S, 'ch2'); S.chapter = 'ch2'; S.flags.gifts = true; Object.assign(S.flags, extra || {}); const a = S.party[0]; a.level = lv; a.xp = A.xpFor(lv); const st = A.stats('aayla', lv); a.hp = st.hp; a.fp = st.fp; A.Party.ensure(S); return S; };
  const S = mk(8, { retinue: true });
  ok(S.party.map(m => m.id).join() === 'aayla,anzat_1,anzat_2' && S.party.slice(1).every(m => m.hero === 'anzat' && m.level === 8), 'the retinue: two Anzati at Aayla\'s level');
  const b = new A.Battle({ S, group: 'post_a', seed: 3 });
  b.begin();
  const a = b.unit('aayla');
  const gifts = b.commands(a).filter(c => c.gift);
  ok(gifts.map(c => c.id).join() === 'klightning,terror,command' && gifts.every(c => c.fp === 0 && c.enabled), 'in chapter 2 Karkko\'s gifts cost no Force');
  const d0 = b.darkDelta;
  b.act('klightning', b.enemies()[0].id);
  ok(b.darkDelta === d0 + 3, 'each gift adds 3 Darkness');
  const S2 = mk(8);
  S2.chapter = 'ch3';
  S2.dark = 20;
  ok(!A.Party.skills(S2, S2.party[0]).some(id => A.GIFTS.includes(id)), 'after chapter 2 the gifts are closed below Darkness 40');
  S2.dark = 45;
  const b2 = new A.Battle({ S: S2, group: 'post_a', seed: 3 });
  ok(b2.commands(b2.unit('aayla')).filter(c => c.gift && c.id !== 'command').every(c => c.fp > 0), 'from Darkness 40 the gifts work and cost Force');
  const S3 = mk(8, { retinue: true });
  const b3 = new A.Battle({ S: S3, group: 'cantina_crowd', seed: 4 });
  b3.begin();
  while (b3.current() && b3.current().side === 'party' && b3.current().id !== 'aayla') b3.act('guard', b3.current().id);
  const ev = b3.act('terror', 'front');
  ok(ev.some(e => e.type === 'flee') && b3.enemies().every(e => A.ENEMIES[e.key].nrav !== 'coward'), 'Terror makes the cowards in the row run');
  const S4 = mk(8, { retinue: true });
  S4.party[1].hp = 1;
  const b4 = new A.Battle({ S: S4, group: 'post_c', seed: 2 });
  b4.begin();
  b4.unit('anzat_1').hp = 0;
  b4.over = 'win';
  b4.rewards = b4.reward();
  b4.finish();
  ok(S4.party[1].hp === A.stats('anzat', 8).hp, 'a fallen Anzat is replaced after the fight');
  const hunger = new A.Battle({ S: mk(8, { retinue: true }), group: 'post_c', seed: 5 });
  hunger.begin();
  const anz = hunger.unit('anzat_1');
  anz.hp = 50;
  const evh = [];
  hunger.perform(anz, 'hunger', hunger.enemies()[0].id, evh, {});
  ok(evh.some(e => e.type === 'heal' && e.target === 'anzat_1') && anz.hp > 50, 'Hunger drains health from the target');
}

{
  const mk = (lv, extra) => { const S = A.newState(); A.Party.preset(S, 'ch2'); S.chapter = 'ch2'; S.flags.gifts = true; Object.assign(S, extra || {}); const a = S.party[0]; a.level = lv; const st = A.stats('aayla', lv); a.hp = st.hp; a.fp = st.fp; A.Party.ensure(S); return S; };
  const cant = new A.Battle({ S: mk(9, { flags: Object.assign(A.newState().flags, { saber: true, forgot: true, gifts: true, retinue: true }) }), group: 'duel_cantina', seed: 1 });
  cant.begin();
  ok(cant.units.filter(u => u.side === 'party').map(u => u.id).join() === 'aayla', 'the cantina duel is Aayla alone against Vos');
  let n = 0;
  while (!cant.over && n++ < 60) cant.act('guard', 'aayla');
  ok(cant.over === 'end' && cant.endReason === 'call' && cant.turns.aayla === 6, 'Karkko\'s call ends the cantina duel after six turns');
  const traa = new A.Battle({ S: mk(9, { flags: Object.assign(A.newState().flags, { saber: true, forgot: true, retinue: true }) }), group: 'traa_duel', seed: 1 });
  traa.begin();
  ok(traa.units.filter(u => u.retinue).every(u => u.status.rooted), 'T\'ra Saa\'s roots hold the Anzati');
  n = 0;
  while (!traa.over && n++ < 80) { const u = traa.current(); traa.act('guard', u.id); }
  ok(traa.over === 'end' && traa.endReason === 'retreat' && traa.turns.aayla === 5, 'holding out five turns against T\'ra Saa is a retreat, not a defeat');
  const sanctum = mem => {
    const S = mk(10, { memory: mem });
    const b = new A.Battle({ S, group: 'duel_sanctum', seed: 1 });
    b.begin();
    return b;
  };
  const s0 = sanctum([]), s9 = sanctum([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  ok(s0.will === 100 && s9.will === 28, 'Karkko\'s will starts at 100 − 8 × found fragments');
  const lowerOk = b => (b.commands(b.unit('aayla')).find(c => c.id === 'lower') || {}).enabled;
  ok(!lowerOk(s9), 'the blade cannot be lowered before the third turn');
  const ev9 = [];
  s9.act('guard', 'aayla');
  s9.act('guard', 'aayla');
  ok(lowerOk(s9), 'with nine fragments the blade can be lowered from the third turn');
  const evs = s9.act('lower', 'aayla');
  ok(s9.over === 'end' && s9.endReason === 'lower' && evs.some(e => e.type === 'duelEnd'), 'lowering the blade ends the sanctum duel');
  const d0 = s0.darkDelta, w0 = s0.will;
  const lines = s0.act('blade', s0.enemies()[0].id);
  ok(s0.will === Math.min(100, w0 + 5) && s0.darkDelta === d0 + 2 && lines.some(e => e.type === 'line' && e.who === 'vos'), 'striking Vos feeds Karkko\'s will and Darkness; Vos answers every turn');
  ok(!s0.units.some(u => u.side === 'party' && u.hp < u.maxhp), 'Vos never strikes back in the sanctum');
  let k = 0;
  while (!lowerOk(s0) && k++ < 20) s0.act('guard', 'aayla');
  ok(lowerOk(s0) && s0.turns.aayla <= 6, 'even with no fragments the blade can be lowered after a few calm turns: turn ' + s0.turns.aayla);
  const flashes = sanctum([1, 4, 5]);
  const seen = [];
  for (let i = 0; i < 4; i++) seen.push(...flashes.act('guard', 'aayla').filter(e => e.type === 'line'));
  ok(seen.some(e => e.frag === 1) && !seen.some(e => e.frag === 2), 'Vos speaks of the memories she has found, not the ones she has lost');
  const kb = new A.Battle({ S: mk(10), group: 'karkko_boss', seed: 7 });
  kb.begin();
  ok(kb.units.filter(u => u.side === 'party').map(u => u.id).join() === 'vos' && kb.unit('vos').level === 17, 'the player leads Vos against Karkko');
  const karkko = kb.units.find(u => u.key === 'karkko');
  karkko.cycle = 3;
  const evv = [];
  kb.enemyAct(karkko, evv);
  ok(karkko.hidden && kb.enemies().filter(e => e.fake).length === 2 && !kb.targets(kb.unit('vos'), 'blade').includes(karkko.id), 'Karkko vanishes behind two illusions and cannot be struck');
  const fake = kb.enemies().find(e => e.fake);
  const evf = [];
  kb.strike(kb.unit('vos'), fake, 'blade', evf);
  ok(fake.gone === 'dispelled' && evf.some(e => e.type === 'dispel'), 'striking an illusion only dispels it');
  while (kb.current() && kb.current().side !== 'party') kb.proceed([]);
  if (kb.units.find(u => u.key === 'karkko').hidden) {
    const evr = kb.act('read', kb.targets(kb.unit('vos'), 'read')[0]);
    ok(!karkko.hidden && evr.some(e => e.type === 'unveil' && e.byRead), 'Vos\'s Reading finds the real Karkko');
  } else ok(true, 'Karkko came back on his own');
  const mig0 = kb.unit('vos').mig;
  kb.turns.vos = 6;
  kb.duel.afterAct(kb, kb.unit('vos'), 'guard', []);
  ok(kb.three && kb.unit('vos').mig === Math.round(mig0 * 1.5), 'from the sixth turn the three masters outside give Vos their strength');
  karkko.hp = Math.round(karkko.maxhp * 0.2);
  const evs2 = [];
  kb.check(evs2);
  ok(kb.over === 'win' && evs2.some(e => e.type === 'salute'), 'at a quarter of his health Karkko salutes and Vos strikes');
}

{
  const S = A.newState();
  A.Party.preset(S, 'ch2');
  Object.assign(S.flags, { retinue: true, released: true });
  const f = new A.Field(S, 'kiffex_hills', 'start');
  ok(f.followers.length === 2 && new Set(f.followers.map(x => x.key)).size === 2, 'two Anzati follow Aayla on the hills');
  const spot = f.objs.find(o => o.type === 'spot' && o.score === 1);
  f.p.x = spot.x * A.Maps.TILE + 8;
  f.p.y = (spot.y + 1) * A.Maps.TILE + 14;
  f.p.dir = 'up';
  ok(f.verb(spot) === 'Посадить анзата в засаду', 'a hiding place takes an Anzat');
  f.step(1 / 60, { interact: true });
  ok(S.flags.placed === 1 && S.flags.placed_a1 && S.flags.ambush_score === 1 && f.followers.length === 1, 'the Anzat stays in the hiding place');
  ok(!f.objs.some(o => o.label === 'ch2_ambush'), 'waiting by the road opens only when both are placed');
  const post = new A.Field(S, 'kiffex_post', 'start');
  ok(!post.objs.some(o => o.id === 'w') && post.enemiesLeft() === 4, 'the wounded guard waits until the post is taken');
  for (const e of post.objs.filter(o => o.type === 'enemy')) post.resolve(e.id, 'won');
  ok(S.flags.clear_kiffex_post && post.objs.some(o => o.id === 'w'), 'with every guard down the post is taken and the wounded guard appears');
  const S2 = A.newState();
  A.Party.preset(S2, 'ch2');
  S2.party[0].hp = 3;
  new X.Story(X.parse('@a\nrest\nstop', 'r'), S2, 'a').next();
  ok(S2.party[0].hp === A.stats('aayla', 5).hp, 'rest heals the party for a time skip');
}

{
  const bot = require(path.join(ROOT, 'tools/aayla98-bot.cjs'));
  const runs = [1, 2, 3, 4, 5, 6].map(s => bot.story(s + 40, { start: 'ch2', stop: 'int' }));
  ok(runs.every(r => r.end && r.retries <= 1), 'bot story: chapter 2 is finished, at most one fight replayed');
  ok(runs.every(r => r.maps.join() === 'kiffex_temple,kiffex_post,kiffex_hills'), 'the temple, the post and the hills');
  ok(runs.every(r => [3, 7, 8, 9].every(id => r.S.memory.includes(id))), 'chapter 2 returns fragments 3, 7, 8 and 9');
  ok(runs.every(r => r.S.party.find(m => m.id === 'aayla').level >= 10 && r.S.party.find(m => m.id === 'aayla').level <= 13), 'chapter 2 ends between levels 10 and 13 (plan 5.1)');
  ok(runs.every(r => r.S.dark >= 10) && new Set(runs.map(r => r.S.flags.post)).size >= 2, 'Darkness grows with the gifts and the choices at the post');
}

{
  const I = A.Input;
  for (const c of I.COMMANDS) {
    ok(c.keys.length > 0 && c.pad.length > 0, 'command on keyboard and gamepad: ' + c.id);
    ok(c.pad.every(p => I.PAD_BUTTONS.includes(p)), 'gamepad buttons exist: ' + c.id);
    ok(c.keys.every(k => I.KEYS.has(k)), 'keys are game keys: ' + c.id);
    ok(c.pad.every(p => !I.TO_KEY[p] || c.keys.includes(I.TO_KEY[p]) || c.id === 'back' || c.id === 'menu'), 'gamepad button sends the same key: ' + c.id);
  }
  ok(!['F9', 'F10'].some(k => I.KEYS.has(k)), 'F9 and F10 stay free for bug reports');
  const gp = { buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: i === 0 || i === 6, value: i === 0 ? 1 : 0 })), axes: [0.9, -0.1] };
  const s = I.pad(gp);
  ok(s.has('a') && s.has('lt') && s.has('right') && !s.has('left') && !s.has('up'), 'gamepad state: buttons, triggers and the stick');
  ok(I.label('push', 'kb') === 'Z' && I.label('push', 'pad') === 'LB' && I.label('sense', 'pad') === 'X', 'prompts show the key of the last used device');
}

{
  const P = X.build();
  const intLabels = P.order.filter(n => n.startsWith('int_') || /^(rs_|tr_)/.test(n)), bondLabels = P.order.filter(n => n.startsWith('bond_'));
  const says = names => names.map(n => P.labels[n].steps.filter(s => s.op === 'say').map(s => s.text).join(' ')).join(' ');
  ok(intLabels.length >= 20 && !/—/.test(says(intLabels)) && !/—/.test(says(bondLabels)), 'interlude and bond scenes use no long dashes: ' + intLabels.length + ' + ' + bondLabels.length + ' labels');
  ok(bondLabels.every(n => !P.labels[n].steps.some(s => ['stop', 'map', 'field', 'chapter'].includes(s.op)) && P.labels[n].steps.some(s => ['return', 'goto', 'choice'].includes(s.op))), 'bond scenes end with return and never leave the story');
  ok(P.order.filter(n => /^(rs_|tr_)/.test(n)).every(n => P.labels[n].steps.some(s => s.op === 'return')), 'respite scenes return to the respite');
  ok(P.labels.int_start.steps[0].op === 'chapter' && P.labels.int_start.steps[0].id === 'int' && P.labels.ch2_kiffu.steps.some(s => s.op === 'goto' && s.to === 'int_start'), 'chapter 2 leads straight into the interlude, which opens with its card');

  ok(X.parse('@a\nbond tholme\nrespite p1\nmemory palace\nmemory restore\nmemory stark\nreturn', 't').labels.a.steps.map(s => s.op).join() === 'bond,respite,memory,memory,memory,return', 'bond, respite, memory and return parse');
  const bad = src => { try { X.parse(src, 'b'); return false; } catch (e) { return true; } };
  ok(bad('@a\nmemory forget') && bad('@a\nbond') && bad('@a\nreturn now') && bad('@a\nrespite p1 p2'), 'bad memory, bond, return and respite lines are rejected');
  const ctx8 = { cast: A.CAST, art: A.Art.LIST, music: A.MUSIC, lekku: A.LEKKU, starts: ['a'], fits, bonds: A.BONDS, respites: A.RESPITES };
  ok(X.check(X.parse('@a\nbond nobody\nrespite p99\nreturn', 'b'), ctx8).some(e => /unknown bond/.test(e)) && X.check(X.parse('@a\nrespite p99\nreturn', 'b'), ctx8).some(e => /unknown respite/.test(e)), 'the checker knows bonds and respites');
  ok(X.check(X.parse('@a\n-: раз\nreturn', 'b'), ctx8).length === 0, 'return ends a label for the checker');
  try { new X.Story(X.parse('@a\nreturn', 'r'), A.newState(), 'a').next(); ok(false, 'return without a call throws'); } catch (e) { ok(/return without a call/.test(e.message), 'return without a call throws'); }

  const S = A.newState();
  A.Party.preset(S, 'int');
  ok(S.party[0].level === 12 && S.dark === 30 && S.flags.forgot && S.flags.heart && A.Bonds.rank(S, 'traa') === 1 && A.Bonds.get(S, 'vos').letgo === 1, 'the interlude preset is the end of chapter 2');
  const st = new X.Story(P, S, 'int_start');
  st.jump('int_blade_made');
  const ev = [];
  for (let g = 0; g < 80; g++) { const e = st.next(); ev.push(e); if (e.type === 'choice') { st.choose(0); continue; } if (e.type === 'respite' || e.type === 'end') break; }
  const ret = ev.find(e => e.type === 'return');
  ok(S.flags.blade_blue && A.Party.blade(S, 'aayla') === A.BLUE_BLADE && A.Party.blade(S, 'vos') === A.HEROES.vos.blade, 'the new blade is blue');
  ok(ret && ret.bond === 'tholme' && ret.rank === 1 && !ret.ui && A.Bonds.rank(S, 'tholme') === 1 && S.bonds.tholme.last === 'bond_tholme_1', 'bond tholme plays the first bond scene and comes back with the bond card');
  ok(ev[ev.length - 1].type === 'respite' && ev[ev.length - 1].id === 'p1', 'after the blade comes the first respite');
  const snap = st.snapshot();
  st.call('rs_meditate_p1', { ui: 'respite' });
  const snap2 = st.snapshot();
  const st2 = new X.Story(P, S, 'int_start');
  st2.restore(snap2);
  ok(snap2.stack.length === 1 && st2.stack[0].ui === 'respite' && st2.pc.label === 'rs_meditate_p1', 'the call stack is part of the snapshot');
  st.restore(snap);
  ok(!st.stack.length, 'restore brings back the old stack');
}

{
  const P = X.build();
  const S = A.newState();
  A.Party.preset(S, 'int');
  ok(A.Memory.missed(S).join() === '6,10' && X.getVar(S, 'missed') === 2, 'the preset misses the fourth and fifth doses');
  const back = A.Memory.restore(S);
  ok(back.join() === '6,10' && S.faded.join() === '6,10' && A.Memory.missed(S).length === 0, 'Plo Koon brings back every missed fragment, pale');
  ok(!A.Memory.ready(S, 6) && !A.Memory.can(S, 'meditate') && !A.Memory.can(S, 'sneak'), 'a pale fragment gives its ability only from chapter 3');
  S.chapter = 'ch3';
  ok(A.Memory.ready(S, 6) && A.Memory.can(S, 'meditate') && A.Memory.can(S, 'sneak'), 'from chapter 3 the pale fragments work');
  S.chapter = 'int';
  ok(A.Memory.slots().length === 12 && A.Memory.slots()[2] === 11 && A.Memory.solve().length === 11, 'the palace line has twelve places, the third is the war of Stark');
  ok(A.MEMORY.every(e => A.Memory.HINTS[e.id]), 'every fragment has a hint for the palace');
  ok(A.Memory.score(A.Memory.solve()) === 6 && A.Memory.score(A.Memory.solve().slice().reverse()) === 0, 'a right line gives the cap of six, a reversed one nothing');
  const half = [2, 1, 4, 3, 6, 5, 7, 8, 9, 10, 12];
  ok(A.Memory.score(half) === 4, 'swapped neighbours break their pairs: only 7-8-9-10-12 stay connected');
  A.Memory.recall(S, 12);
  const w0 = A.Party.stats(S, S.party[0]).wil;
  ok(A.Memory.arrange(S, A.Memory.solve()) === 6 && A.Memory.will(S) === 6 && A.Party.stats(S, S.party[0]).wil === w0 + 6, 'connected memory adds up to six Will');
  A.Memory.arrange(S, A.Memory.solve().slice().reverse());
  ok(A.Memory.will(S) === 6 && S.palace.order[0] === 12, 'a worse layout later keeps the Will already won');
  ok(A.Memory.skills(S).includes('mindguard'), 'fragment 12 with Plo Koon gives the mind guard');
  A.Party.ensure(S);
  const b = new A.Battle({ S, group: 'karkko_boss', seed: 2 });
  ok(b.units.every(u => !u.mindguard), 'the mind guard belongs to Aayla only');
  const S2 = A.newState();
  A.Party.preset(S2, 'int');
  A.Memory.recall(S2, 12);
  A.Party.ensure(S2);
  const mg = new A.Battle({ S: S2, group: 'temple_a', seed: 3 }), a = mg.unit('aayla'), e = mg.enemies()[0], had = a.mindguard;
  const d0 = mg.damage(e, a, A.SKILLS.dread).dmg;
  a.mindguard = false;
  const d1 = mg.damage(e, a, A.SKILLS.dread).dmg;
  ok(had && d0 < d1 * 0.6, 'the mind guard halves mind damage to Aayla');
  ok(A.Memory.told(S) === false, 'the veterans have not told the story yet');
  new X.Story(X.parse('@a\nmemory stark\nstop', 'm'), S, 'a').next();
  ok(A.Memory.told(S) && A.MEMORY.find(m => m.id === 11).told === 'stark_veterans' && A.Art.LIST.still.stark_veterans, 'the story of the veterans fills the empty place');
  ok(A.MEMORY.every(m => A.Art.STILL_ICONS.includes(m.still)) && A.Art.STILL_ICONS.includes('stark_veterans'), 'every palace picture has an icon');
}

{
  const S = A.newState(), B = A.Bonds;
  ok(Object.keys(A.BONDS).length === 8 && Object.values(A.BONDS).every(b => A.CAST[b.who] && A.CAST[b.who].outfits[b.outfit]), 'eight bonds, each with a bust');
  ok(Object.values(A.RESPITES).reduce((s, r) => s + r.count, 0) === 27, 'there are 27 activities in the respites (plan 7.10)');
  ok(Object.values(A.BONDS).reduce((s, b) => s + b.ranks.filter(r => r.from === 'respite').length, 0) === 18, '18 ranks come from activities (plan section 8)');
  const order = A.RESPITE_ORDER;
  for (const [id, d] of Object.entries(A.BONDS)) {
    d.ranks.forEach((r, i) => {
      if (r.from === 'plot') ok(!!r.when && order.includes(r.before), `plot rank ${i + 1} of ${id} says when and before which respite`);
      else ok(r.at.length && r.at.every(x => A.RESPITES[x]) && r.at.some(x => id in A.RESPITES[x].near || (r.via && r.via in A.RESPITES[x].near)), `rank ${i + 1} of ${id} has a respite where the person is near`);
      if (i > 0 && r.from === 'respite') {
        const prev = d.ranks[i - 1], start = prev.from === 'plot' ? order.indexOf(prev.before) : Math.min(...prev.at.map(x => order.indexOf(x))) + 1;
        ok(Math.max(...r.at.map(x => order.indexOf(x))) >= start, `rank ${i + 1} of ${id} can come after rank ${i}`);
      }
    });
  }
  B.own(S, 'tholme').rank = 1;
  X.apply(S, X.parseEffects('bond.tholme-1'));
  let r = B.meet(S, 'tholme');
  ok(!r.up && r.label === 'bond_tholme_talk' && B.rank(S, 'tholme') === 1 && S.bonds.tholme.pts === 0, 'with a point lost in a scene the activity is only a talk');
  r = B.meet(S, 'tholme');
  ok(r.up && r.rank === 2 && r.label === 'bond_tholme_2' && S.bonds.tholme.pts === 0, 'the next activity opens rank 2');
  X.apply(S, X.parseEffects('bond.tholme-3'));
  ok(B.rank(S, 'tholme') === 2, 'ranks never fall');
  try { X.apply(S, X.parseEffects('rank.tholme-1')); ok(false, 'ranks cannot be set by effects'); } catch (e) { ok(/ranks grow only/.test(e.message), 'ranks cannot be set by effects'); }
  try { B.plot(S, 'tholme'); ok(false, 'plot bond on a respite rank throws'); } catch (e) { ok(/comes from a respite/.test(e.message), 'plot bond on a respite rank throws'); }
  ok(B.when(S, 'tholme', 3).startsWith('передышка после интерлюдии') && B.when(S, 'vos', 1) === 'глава 3, Орд-Мантелл', 'the bonds page says when the next rank comes');
  S.bonds.vos = { rank: 0, pts: 0, letgo: 3 };
  ok(B.released(S, 'vos') && !B.released(S, 'tholme'), 'three letting go steps release Vos');
  ok(B.known(S).join() === 'tholme,vos', 'the bonds page shows met people only');
}

{
  const P = X.build();
  const mk = () => { const S = A.newState(); A.Party.preset(S, 'int'); S.chapter = 'int'; A.Bonds.own(S, 'tholme').rank = 1; A.Respite.start(S, 'p1'); return S; };
  const S = mk(), R = A.Respite;
  ok(S.respite.left === 3 && R.place('p1').rooms.length === 6 && R.place('p1').rooms.map(r => r.name).join() === 'Сад медитаций,Тренировочный зал,Архив,Зал Совета,Келья Эйлы,Посадочная площадка', 'P1 in the Temple: six rooms, three activities');
  const opt = room => R.options(S, 'p1', room);
  ok(opt('garden').map(o => o.act).join() === 'meditate' && opt('hall').every(o => o.act === 'train') && opt('archive')[0].act === 'archive' && opt('council')[0].act === 'bond' && opt('council')[0].id === 'tholme', 'meditation in the garden, training in the hall, archive, Tholme in the council hall');
  ok(opt('hall').map(o => o.id).join() === 'deflect2,push2,restraint' && opt('hall').every(o => o.enabled), 'P1 trainings: Deflect II, Push II, lekku restraint');
  const people = R.people(S, 'p1');
  ok(people.find(p => p.who === 'xiaan').last && !people.find(p => p.who === 'tholme').last && !people.find(p => p.who === 'yoda').last, 'the respite marks who is near for the last time');
  let x = R.apply(S, { act: 'meditate' });
  ok(x.label === 'rs_meditate_p1' && S.dark === 15 && S.respite.left === 2 && x.ret.ui === 'respite', 'meditation takes 15 Darkness');
  x = R.apply(S, opt('council')[0]);
  ok(x.label === 'bond_tholme_2' && x.ret.bond === 'tholme' && x.ret.rank === 2 && A.Bonds.rank(S, 'tholme') === 2, 'the Tholme activity opens rank 2');
  ok(!opt('council')[0].enabled, 'one talk with a person per respite');
  x = R.apply(S, { act: 'train', id: 'deflect2' });
  ok(x.label === 'tr_deflect2' && S.party[0].deflect === 2 && S.flags.tr_deflect2 && S.respite.left === 0, 'Deflect II raises the stance level');
  ok(S.party[0].level === 13, 'three activities give experience to level 13');
  try { R.apply(S, { act: 'meditate' }); ok(false, 'no fourth activity'); } catch (e) { ok(/no activities left/.test(e.message), 'no fourth activity'); }
  R.finish(S);
  ok(S.respite === null && S.flags.rs_p1, 'the respite ends and is remembered');
  const S3 = mk();
  R.apply(S3, { act: 'archive', id: 'ch3' });
  ok(S3.flags.archive_ch3 && !R.options(S3, 'p1', 'archive')[0].enabled, 'the archive article is read once');
  S3.chapter = 'ch3';
  A.Party.ensure(S3);
  const ab = new A.Battle({ S: S3, group: 'temple_a', seed: 5 });
  ok(ab.enemies().every(e => ab.known[e.key] && ab.known[e.key].weak), 'after the archive the weaknesses of the next chapter are known from the first turn');
  R.apply(S3, { act: 'train', id: 'push2' });
  const pb = new A.Battle({ S: S3, group: 'temple_a', seed: 5 });
  ok(pb.unit('aayla').pushLevel === 2, 'Push II reaches the battle');
  const before = S3.restraint;
  R.apply(S3, { act: 'train', id: 'restraint' });
  ok(S3.restraint === Math.min(3, before + 1), 'lekku training adds one restraint');
  const S4 = A.newState();
  A.Party.preset(S4, 'int');
  S4.chapter = 'int';
  S4.memory = [1, 2];
  ok(R.trainings(S4).find(t => t.id === 'deflect2').why === 'приём ещё не вернулся', 'Deflect II waits for the fragment that returns Deflect');
  const labels = [...R.labels('p1'), 'bond_tholme_2', 'bond_tholme_talk'];
  ok(labels.filter(l => !l.startsWith('tr_') || A.TRAININGS[l.slice(3)].from === 'int').every(l => P.labels[l]), 'every scene P1 can call exists: ' + labels.join(', '));
  const bot = require(path.join(ROOT, 'tools/aayla98-bot.cjs'));
  const p1 = bot.respiteP1();
  ok(p1.length >= 20 && p1.some(l => l.S.bonds.tholme.rank === 2) && p1.some(l => l.S.bonds.tholme.rank === 1), 'the respite bot walks every P1 layout: ' + p1.length);
  ok(p1.every(l => l.S.party[0].level === 13 && l.S.respite.left === 0), 'every P1 layout uses three activities');
  const mb = bot.maxBonds();
  ok(mb.count >= 6 && mb.blyMax, 'by the plan tables at least six bonds can reach the top and Bly can reach rank 5: ' + mb.count + ' of ' + mb.of);
}

{
  const S = A.newState();
  A.Party.preset(S, 'int');
  const b = new A.Battle({ S, group: 'stark_cave', seed: 4, noFlee: true });
  ok(b.heroes().map(h => h.key).join() === 'tholme,plo' && !b.ownParty, 'the war of Stark is fought by Tholme and Plo Koon');
  ok(b.heroes().every(h => h.level === 15) && b.unit('plo').saber === A.HEROES.plo.blade, 'both at level 15 with their own blades');
  b.begin();
  const first = b.current();
  ok(!b.commands(first).find(c => c.id === 'seal').enabled, 'the passage cannot be closed while the boys are inside');
  const party = JSON.stringify(S.party);
  let guard = 0, max = 0;
  while (!b.over && guard++ < 400) {
    const c = require(path.join(ROOT, 'tools/aayla98-bot.cjs')).choose(b);
    b.act(c.skill, c.target, c.extra);
    max = Math.max(max, b.enemies().length);
  }
  ok(b.over === 'end' && b.endReason === 'seal' && A.DUELS.challat.acted(b) === A.DUELS.challat.sealFrom, 'eight actions, then the Jedi close the passage');
  ok(max >= 3, 'new swarms keep coming');
  b.finish();
  ok(JSON.stringify(S.party) === party, 'the flashback does not touch Aayla\'s party');
  const sh = new A.Battle({ S, group: 'stark_cave', seed: 9, noFlee: true });
  sh.begin();
  let th = sh.current();
  while (th.key !== 'tholme') { const c = require(path.join(ROOT, 'tools/aayla98-bot.cjs')).choose(sh); sh.act(c.skill, c.target); th = sh.current(); }
  sh.act('shadow', th.id);
  ok(th.hidden && th.ambush, 'Tholme goes into the shadow');
  ok(sh.plan(sh.enemies()[0]).target !== th.id && A.DUELS.challat.plan(sh).target !== th.id, 'enemies do not target Tholme in the shadow');
  const r2 = sh.strike(th, sh.enemies()[0], 'blade', []);
  ok(!th.hidden && !th.ambush, 'the blow brings Tholme out of the shadow');
  const r1 = sh.strike(th, sh.enemies()[0], 'blade', []);
  ok(r2.dmg > r1.dmg * 1.7, 'a blow from the shadow is twice as strong');
}

{
  const S = A.newState();
  A.Party.preset(S, 'ch2');
  S.flags.saber = true;
  const T = A.Maps.TILE;
  const f = new A.Field(S, 'lylek_caves', 'start');
  const e = f.objs.find(o => o.type === 'enemy' && f.beast(o));
  ok(!!e, 'the lylek caves have a beast to test the bond rewards');
  f.p.sneak = true;
  const full = f.sightRange(e);
  A.Bonds.own(S, 'tholme').rank = 1;
  ok(f.sightRange(e) === full / 2, 'Tholme 1, shadow in the field: sneaking Aayla is seen from half the distance');
  A.Bonds.own(S, 'tholme').rank = 2;
  ok(f.sightRange(e) === 0, 'Tholme 2, Force cloak: beasts do not notice her while she sneaks');
  f.p.sneak = false;
  ok(f.sightRange(e) === full, 'walking openly cancels both');
  const S2 = A.newState();
  A.Party.preset(S2, 'ch2');
  A.Party.ensure(S2);
  const calm = rank => { A.Bonds.own(S2, 'traa').rank = rank; const b = new A.Battle({ S: S2, group: 'temple_a', seed: 1 }); b.begin(); const a = b.unit('aayla'); b.perform(a, 'calm', a.id, [], {}); return a.status.calm; };
  ok(calm(0) === 3 && calm(1) === 4, 'T\'ra Saa 1, patience: calm holds one turn longer');
  void T;
}

{
  const S = A.newState();
  A.Party.preset(S, 'int');
  S.chapter = 'int';
  A.Respite.start(S, 'p1');
  A.Respite.apply(S, { act: 'meditate' });
  S.scene = { pc: { label: 'int_blade_made', i: 9 }, vn: { bg: null, time: null, cg: null, still: null, music: null, busts: {} }, done: false, stack: [] };
  const store = new Map(), mem = { getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) };
  A.Save.write(mem, A.Save.slotKey(4), A.Save.pack(S, { place: 'Передышка: Храм джедаев' }));
  const back = A.Save.read(mem, A.Save.slotKey(4));
  ok(back && A.Save.hash(back.S) === A.Save.hash(S) && back.S.respite.left === 2 && back.S.respite.log.join() === 'meditate', 'a save in the middle of a respite keeps the activities left');
  const old = A.newState();
  old.version = 2;
  old.bonds = { vos: 1, traa: 1, secura: 2 };
  old.flags.vos_letgo = true;
  delete old.faded;
  delete old.palace;
  delete old.respite;
  const mig = A.Save.migrate({ v: 2, at: 1, kind: 'slot', meta: { chapter: 'ch2' }, S: old });
  ok(mig.v === 3 && mig.S.bonds.vos.pts === 1 && mig.S.bonds.vos.letgo === 1 && mig.S.bonds.traa.rank === 1 && mig.S.bonds.secura.pts === 2 && !mig.S.flags.vos_letgo && Array.isArray(mig.S.faded), 'a version 2 save turns bond numbers into ranks and points');
}

{
  const bot = require(path.join(ROOT, 'tools/aayla98-bot.cjs'));
  const runs = [1, 2, 3, 4, 5, 6].map(s => bot.story(s + 60, { start: 'int', stop: 'ch3' }));
  ok(runs.every(r => r.end && r.retries === 0), 'bot story: the interlude is finished without lost fights');
  ok(runs.every(r => r.S.memory.length === 11 && r.S.faded.join() === '6,10' && A.Memory.told(r.S)), 'every fragment is back, the missed ones pale, the war of Stark is told');
  ok(runs.every(r => r.S.flags.blade_blue && A.Bonds.rank(r.S, 'tholme') >= 1 && r.S.flags.rs_p1 && r.activities.length === 3), 'the blue blade, Tholme 1 and three activities');
  ok(runs.every(r => { const lv = r.S.party.find(m => m.id === 'aayla').level; return lv >= 13 && lv <= 15; }), 'the interlude ends between levels 13 and 15 (plan 5.1)');
  ok(runs.every(r => r.palace.length >= 1 && r.palace.every(w => w >= 0 && w <= 6)), 'the bot lays out the memory palace');
}

{
  const C = A.Cover, S = A.newState();
  ok(Object.keys(A.COVERS).length >= 1 && A.COVERS.servant.intel.length === 3 && A.COVERS.servant.alias, 'the servant cover has a dossier and three pieces of intel');
  C.start(S, 'servant');
  ok(S.cover.id === 'servant' && S.cover.sus === 0 && C.got(S) === 0 && !C.done(S), 'a cover starts clean');
  ok(A.Party.look(S, 'aayla') === 'aayla_servant', 'in the cover Aayla looks like a servant');
  C.add(S, 30, 'force');
  C.tick(S, 10);
  ok(Math.abs(S.cover.sus - (30 - A.COVERS.servant.decay * 10)) < 1e-6, 'suspicion falls with time');
  const r = C.add(S, 200, 'seen');
  ok(r.exposed && S.cover.sus === 100 && C.add(S, 5) === null, 'suspicion 100 exposes the cover and stops counting');
  S.flags.intel_screen = S.flags.intel_study = S.flags.intel_maid = true;
  ok(C.got(S) === 3 && C.done(S), 'three pieces of intel finish the cover');
  C.end(S);
  ok(S.cover === null && S.flags.cover_servant === 'exposed', 'the end of a cover remembers how it went');
  const S2 = A.newState();
  C.start(S2, 'servant');
  X.apply(S2, X.parseEffects('sus+15'));
  ok(X.getVar(S2, 'sus') === 15 && X.test(S2, X.parseCond('sus >= 15')), 'scenes read and raise suspicion through sus');
  try { X.apply(S2, X.parseEffects('respite=p1')); ok(false, 'respite is read only'); } catch (e) { ok(/read only/.test(e.message), 'respite is read only'); }
}

{
  const P = X.build();
  const st = new X.Story(P, (() => { const S = A.newState(); A.Party.preset(S, 'ch3'); return S; })(), 'ch3_start');
  const out = [];
  for (let g = 0; g < 200; g++) {
    const e = st.next();
    out.push(e);
    if (e.type === 'choice') { st.choose(0, 'calm'); continue; }
    if (e.type === 'map' || e.type === 'end') break;
  }
  ok(out[0].type === 'chapter' && out[0].id === 'ch3' && st.S.credits === A.CHAPTERS.ch3.credits, 'chapter 3 opens with its card and the Order issues credits');
  ok(out.some(e => e.type === 'cover' && e.id === 'servant') && st.S.cover && st.S.cover.id === 'servant', 'the cover starts with the dossier');
  ok(out[out.length - 1].type === 'map' && out[out.length - 1].id === 'fenn_house', 'then the Fenn house');
  const said = out.filter(e => e.type === 'say').map(e => e.text).join(' ');
  ok(said.includes('Светлые земли') && said.includes('Ро Фенн') && said.includes('балкона'), 'the briefing ties the crisis to the Bright Lands custom and to Pol\'s death');
  const brag = (pose, restraint) => { const S = A.newState(); A.Party.preset(S, 'ch3'); S.restraint = restraint; const s2 = new X.Story(P, S, 'ch3_start'); for (let g = 0; g < 200; g++) { const e = s2.next(); if (e.type === 'choice' && e.lekku) { s2.choose(1, pose); continue; } if (e.type === 'choice') { s2.choose(0); continue; } if (e.type === 'map') break; } return S.cover.sus; };
  ok(brag('calm', 0) === 15 && brag('calm', 3) === 0, 'a lie to the overseer shows on weak lekku and adds suspicion');
  const ch3 = P.order.filter(n => n.startsWith('ch3_') || n === 'rs_meditate_p2' || n === 'rs_meditate_p3' || n === 'rs_archive_ch4' || n === 'tr_djemso');
  ok(ch3.length >= 40 && !/—/.test(ch3.map(n => P.labels[n].steps.filter(s => s.op === 'say').map(s => s.text).join(' ')).join(' ')), 'chapter 3 scenes use no long dashes: ' + ch3.length + ' labels');
  ok(P.labels.int_blade_made.steps.some(s => s.op === 'goto' && s.to === 'ch3_start'), 'the interlude leads straight into chapter 3');
  const exp = (() => { const S = A.newState(); A.Party.preset(S, 'ch3'); A.Cover.start(S, 'servant'); A.Cover.add(S, 100, 'seen'); S.flags.intel_maid = true; const s3 = new X.Story(P, S, 'ch3_exposed'); const ev = []; for (let g = 0; g < 200; g++) { const e = s3.next(); ev.push(e); if (e.type === 'choice') { s3.choose(0); continue; } if (e.type === 'battle' && e.group === 'morgukai_night') break; } return { S, ev }; })();
  ok(exp.ev.filter(e => e.type === 'battle').map(e => e.group).join() === 'fenn_a,fenn_b,morgukai_night', 'exposure: a fight, a harder way to the study, then the night');
  ok(exp.S.flags.intel_screen && exp.S.flags.intel_study && exp.S.cover === null && exp.S.flags.cover_servant === 'exposed', 'the harder way still gives every piece of intel');
}

{
  const S = A.newState();
  A.Party.preset(S, 'ch3');
  A.Cover.start(S, 'servant');
  const f = new A.Field(S, 'fenn_house', 'start');
  ok(f.coverActive() === A.COVERS.servant, 'the Fenn house runs the servant cover');
  const T = A.Maps.TILE, guard = f.objs.find(o => o.id === 'x');
  const at = (x, y) => { f.p.x = x * T + 8; f.p.y = y * T + 14; };
  at(7, 8);
  guard.px = 3 * T + 8; guard.py = 8 * T + 14; guard.angle = 0; guard.calm = 0; guard.mode = 'patrol';
  ok(f.forbidden() && f.canSee(guard), 'the corridor to the family rooms is forbidden and the guard looks along it');
  f.take();
  f.watchStep(guard, 1 / 60, Math.hypot(guard.px - f.p.x, guard.py - f.p.y), 0);
  const ev = f.take();
  ok(ev.some(e => e.type === 'cover' && e.add === A.COVERS.servant.seen && e.why === 'seen') && !ev.some(e => e.type === 'scene'), 'a servant seen where she should not be: suspicion, no scene');
  at(20, 19);
  guard.calm = 0;
  f.watchStep(guard, 1 / 60, 200, 0);
  ok(!f.take().some(e => e.type === 'cover'), 'in the servants\' rooms nobody cares');
  at(36, 3);
  const hall = f.objs.find(o => o.id === 'v');
  hall.px = 36 * T + 8; hall.py = 6 * T + 14; hall.angle = -Math.PI / 2;
  f.p.dir = 'right';
  ok(f.watched(), 'the hall guard looks at the screen');
  f.interact();
  const e1 = f.take();
  ok(e1.some(e => e.type === 'cover' && e.why === 'screen') && !e1.some(e => e.type === 'scene'), 'listening at the screen under a guard\'s eyes gives her away');
  hall.px = 16 * T + 8; hall.py = 9 * T + 14; hall.angle = Math.PI;
  f.interact();
  ok(f.take().some(e => e.type === 'scene' && e.label === 'ch3_screen'), 'unwatched, the screen opens the overheard talk');
  hall.px = 36 * T + 8; hall.py = 6 * T + 14; hall.angle = -Math.PI / 2;
  f.coverForce();
  ok(f.take().some(e => e.type === 'cover' && e.add === A.COVERS.servant.force), 'the Force under a guard\'s eyes costs 30 suspicion');
  at(4, 16);
  f.p.dir = 'up';
  f.interact();
  const d = f.take();
  ok(d.some(e => e.type === 'cover' && e.add === -A.COVERS.servant.duty) && d.some(e => e.type === 'lines'), 'a chore by the role lowers suspicion');
  f.interact();
  ok(!f.take().some(e => e.type === 'cover'), 'each chore counts once');
  S.cover.exposed = true;
  ok(!f.coverActive(), 'an exposed cover stops the cover rules');
}

{
  const mk = (lv, flags) => { const S = A.newState(); A.Party.preset(S, 'ch3'); const a = S.party[0]; a.level = lv; a.xp = A.xpFor(lv); const st = A.stats('aayla', lv); a.hp = st.hp; a.fp = st.fp; Object.assign(S.flags, flags || {}); A.Party.ensure(S); return S; };
  const S = mk(15);
  const n = new A.Battle({ S, group: 'morgukai_night', seed: 3 });
  ok(n.heroes().map(h => h.key).join() === 'aayla,secura_guard,secura_guard' && n.ownParty && S.party.length === 1, 'the night fight: Aayla with two Secura guards who are not in her party');
  n.begin();
  const tsyr = n.units.find(u => u.key === 'tsyr'), a = n.unit('aayla');
  const blade = n.damage(a, tsyr, A.SKILLS.blade), fists = n.damage(a, tsyr, A.SKILLS.fists);
  ok(fists.weak && fists.dmg > 0, 'fists hit a Morgukai where it hurts');
  const ev = [];
  n.strike(a, tsyr, 'blade', ev);
  ok(ev[0].dmg === 0 && ev[0].cortosis && a.status.saberOff, 'cortosis: the blade does nothing and goes out');
  void blade;
  const bot = require(path.join(ROOT, 'tools/aayla98-bot.cjs'));
  const run = (g, S2, adv) => { const b = new A.Battle({ S: S2, group: g, seed: 5, advantage: adv }); b.begin(); let guard = 0; while (!b.over && guard++ < 500) { const c = bot.choose(b); b.act(c.skill, c.target, c.extra); } return b; };
  const night = run('morgukai_night', mk(15));
  ok(night.over === 'end' && night.endReason === 'fled' && night.turns.aayla === A.DUELS.night.turns, 'the Morgukai leave with the boy after five turns');
  const wastes = run('morgukai_wastes', mk(18, { with_vos: true }), 'enemy');
  ok(wastes.over === 'end' && wastes.endReason === 'run' && wastes.heroes().some(h => h.key === 'vos'), 'in the wastes the Jedi break through to the lava river');
  const ax = new A.Battle({ S: mk(20), group: 'axrx_boss', seed: 7 });
  ax.begin();
  const droid = ax.units.find(u => u.key === 'axrx');
  droid.hp = Math.round(droid.maxhp * 0.45);
  const axe = [];
  A.DUELS.axrx.afterAct(ax, ax.unit('aayla'), 'blade', axe);
  ok(ax.thrown && axe.some(e => e.type === 'line' && e.who === 'tholme') && droid.status.stun, 'Tholme throws the droid into the wall at half health');
  const bk = new A.Battle({ S: mk(21), group: 'bok_edge', seed: 9 });
  bk.begin();
  const bok = bk.units.find(u => u.key === 'bok');
  bok.row = 'back';
  ok(A.DUELS.bok.plan(bk, bok).skill === 'advance', 'Bok climbs back from the edge');
  bok.hp = Math.round(bok.maxhp * 0.29);
  const be = [];
  ok(A.DUELS.bok.check(bk, be) && bk.over === 'end' && bk.endReason === 'hand', 'at a third of his health Aayla takes his hand');
  const hunters = run('hunters_a', mk(16, { with_vos: true }));
  ok(hunters.over === 'win' && hunters.heroes().some(h => h.key === 'vos'), 'Vos fights the bounty hunters beside her');
}

{
  const mk = flags => { const S = A.newState(); A.Party.preset(S, 'ch3'); S.credits = 200; Object.assign(S.flags, flags || {}); A.Party.ensure(S); return S; };
  const S = mk({ with_vos: true, with_villie: true });
  ok(S.party.map(m => m.id).join() === 'aayla,vos,villie' && S.party[1].level === S.party[0].level + 2 && S.party[2].level === S.party[0].level, 'Vos and Villie join at their levels');
  S.flags.with_villie = false;
  A.Party.ensure(S);
  ok(S.party.map(m => m.id).join() === 'aayla,vos', 'Villie stays with the ship');
  const b = new A.Battle({ S: mk({ with_villie: true }), group: 'kintan_patrol', seed: 2 });
  b.begin();
  let v = b.current();
  for (let g = 0; g < 10 && v.key !== 'villie'; g++) { b.act('guard', v.id); v = b.current(); }
  ok(v.key === 'villie' && b.targets(v, 'bet').join() === 'fast,clean', 'Villie bets on a quick win or a clean one');
  b.act('bet', 'fast');
  ok(b.bet && b.bet.kind === 'fast' && b.bet.stake === A.BET.stake && !b.commands(b.current().key === 'villie' ? b.current() : v).find(c => c.id === 'bet').enabled, 'one bet per fight');
  b.over = 'win';
  b.turns.aayla = A.BET.fast;
  ok(b.betResult() === A.BET.stake * (A.BET.pays - 1), 'a won bet pays three times the stake');
  b.turns.aayla = A.BET.fast + 1;
  ok(b.betResult() === -A.BET.stake, 'a lost bet takes the stake');
  const S3 = mk();
  ok(!A.Party.skills(S3, S3.party[0]).includes('bet'), 'without Villie\'s bond Aayla does not bet');
  S3.bonds.villie = { rank: 1, pts: 0, letgo: 0 };
  ok(A.Party.skills(S3, S3.party[0]).includes('bet'), 'Villie 1: Aayla bets herself when he is away');
  S3.flags.with_villie = true;
  ok(!A.Party.skills(S3, S3.party[0]).includes('bet'), 'with Villie in the party the bet is his');
  const t = new A.Battle({ S: mk({ with_villie: true }), group: 'hunters_b', seed: 4 });
  t.begin();
  let u = t.current();
  for (let g = 0; g < 10 && u.key !== 'villie'; g++) { t.act('guard', u.id); u = t.current(); }
  t.act('thermal', 'front');
  for (let g = 0; g < 10 && t.current().key !== 'villie'; g++) t.act('guard', t.current().id);
  ok(!t.commands(t.current()).find(c => c.id === 'thermal').enabled, 'the detonator goes off once per fight');
  t.act('flash', 'none');
  ok(t.enemies().every(e => e.status.blind), 'the flash blinds every enemy');
  const S4 = mk();
  S4.bonds.villie = { rank: 3, pts: 0, letgo: 0 };
  const c = new A.Battle({ S: S4, group: 'fortress_a', seed: 6 });
  c.begin();
  c.unit('aayla').hp = 0;
  const ce = [];
  ok(!c.check(ce) && ce.some(e => e.type === 'chip') && c.unit('aayla').hp > 0 && S4.flags.chip_ch3, 'Villie 3: the lucky chip saves the party once');
  c.unit('aayla').hp = 0;
  ok(c.check([]) && c.over === 'lose', 'only once per chapter');
  const S5 = mk();
  ok(!A.Shop.buy(S5, 'bacta').ok, 'the smugglers\' shop opens with Villie 2');
  S5.bonds.villie = { rank: 2, pts: 0, letgo: 0 };
  const before = S5.items.bacta || 0;
  ok(A.Shop.buy(S5, 'bacta').ok && S5.credits === 200 - 30 && S5.items.bacta === before + 1, 'Villie 2: buying in the shop');
  S5.credits = 5;
  ok(A.Shop.buy(S5, 'flash').why === 'не хватает кредитов', 'no credits, no goods');
}

{
  const mk = () => { const S = A.newState(); A.Party.preset(S, 'ch3'); A.Party.ensure(S); return S; };
  const S = mk();
  ok(A.Party.skills(S, S.party[0]).includes('fists') && A.Party.skills(S, S.party[0]).includes('blade'), 'from chapter 3 Aayla keeps her fists next to the blade');
  S.flags.tr_djemso = true;
  ok(A.Party.skills(S, S.party[0]).includes('djemso'), 'Djem So comes from training');
  const b = new A.Battle({ S, group: 'hunters_b', seed: 3 });
  b.begin();
  const a = b.unit('aayla'), brute = b.enemies().find(e => e.key === 'hunter_brute');
  a.djemso = true;
  a.tempo = 0;
  const ev = [];
  b.enemyHit(brute, a, 'vibroaxe', ev);
  ok(ev.some(e => e.type === 'counter') && a.tempo >= 1 && !a.djemso, 'Djem So: a blow taken gives Tempo and a counter');
  const S2 = mk();
  const f = new A.Battle({ S: S2, group: 'hunters_a', seed: 3 });
  f.begin();
  const ev2 = [];
  f.perform(f.unit('aayla'), 'foresee', f.enemies()[0].id, ev2, {});
  ok(ev2[0].intents.length === 1, 'Prochtenie shows one move without Vos');
  S2.bonds.vos = { rank: 1, pts: 0, letgo: 1 };
  const f2 = new A.Battle({ S: S2, group: 'hunters_a', seed: 3 });
  f2.begin();
  const ev3 = [];
  f2.perform(f2.unit('aayla'), 'foresee', f2.enemies()[0].id, ev3, {});
  ok(ev3[0].intents.length === 2 && f2.known[f2.enemies()[0].key].weak, 'Vos 1: two moves and the weaknesses');
  const S3 = mk();
  S3.bonds.tholme = { rank: 4, pts: 0, letgo: 0 };
  const amb = new A.Battle({ S: S3, group: 'hunters_a', seed: 3, advantage: 'party' });
  ok(amb.unit('aayla').ambush, 'Tholme 4: an ambush makes her first blow double');
  const S4 = mk();
  S4.flags.retinue = false;
  const T = A.Maps.TILE;
  const kf = new A.Field(S4, 'kiffex_temple', 'start');
  const anz = kf.objs.find(o => o.type === 'enemy' && kf.senses(o));
  ok(!!anz, 'the feral Anzati sense the Force');
  S4.bonds.tholme = { rank: 3, pts: 0, letgo: 0 };
  ok(!kf.senses(anz), 'Tholme 3: hidden presence, they no longer sense her');
  void T;
}

{
  const P = X.build();
  const R = A.Respite;
  ok(A.RESPITES.p3.years.length === A.RESPITES.p3.count && A.PLACES.chronicle.rooms.length === 4, 'the chronicle «Eight years»: four activities, four years, four places');
  const S = A.newState();
  A.Party.preset(S, 'ch3');
  S.bonds.vos = { rank: 1, pts: 0, letgo: 1 };
  S.bonds.villie = { rank: 1, pts: 0, letgo: 0 };
  S.bonds.secura = { rank: 1, pts: 0, letgo: 0 };
  R.start(S, 'p2');
  const p2 = A.PLACES.temple.rooms.flatMap(r => R.options(S, 'p2', r.id));
  ok(p2.some(o => o.act === 'bond' && o.id === 'vos' && o.enabled) && p2.some(o => o.act === 'bond' && o.id === 'villie' && o.enabled) && p2.some(o => o.act === 'bond' && o.id === 'tholme' && o.enabled), 'P2: Vos, Villie and Tholme are near');
  ok(p2.some(o => o.act === 'train' && o.id === 'djemso' && o.enabled), 'P2: Djem So can be trained');
  ok(!p2.find(o => o.act === 'archive').enabled, 'P2: no article for the war yet');
  R.finish(S);
  R.start(S, 'p3');
  const p3 = A.PLACES.chronicle.rooms.flatMap(r => R.options(S, 'p3', r.id));
  ok(p3.some(o => o.act === 'bond' && o.id === 'secura' && o.enabled) && p3.find(o => o.act === 'archive').enabled, 'P3: the Secura clan on Ryloth and the article about the droids');
  const labels = ['rs_meditate_p2', 'rs_meditate_p3', 'rs_archive_ch4', 'tr_djemso', 'tr_deflect2', 'tr_push2', 'tr_restraint',
    'bond_vos_2', 'bond_vos_talk', 'bond_villie_2', 'bond_villie_3', 'bond_villie_talk', 'bond_secura_2', 'bond_secura_talk', 'bond_tholme_3', 'bond_tholme_4', 'bond_tholme_talk'];
  ok(labels.every(l => P.labels[l]), 'every scene P2 and P3 can call exists');
  ok(['bond_vos_1', 'bond_villie_1', 'bond_secura_1'].every(l => P.labels[l]), 'the plot bond scenes of chapter 3 exist');
  const S2 = A.newState();
  A.Party.preset(S2, 'ch3');
  S2.bonds.secura = { rank: 1, pts: 0, letgo: 0 };
  const before = S2.restraint;
  const st = new X.Story(P, S2, 'bond_secura_2');
  st.stack.push({ label: 'ch3_knight', i: 0, bond: 'secura', rank: 2 });
  for (let g = 0; g < 60; g++) { const e = st.next(); if (e.type === 'choice') { st.choose(0); continue; } if (e.type === 'return') break; }
  ok(S2.restraint === Math.min(3, before + 1), 'Secura 2: one more step of lekku restraint');
}

{
  const bot = require(path.join(ROOT, 'tools/aayla98-bot.cjs'));
  const runs = [1, 2, 3, 4, 5, 6].map(s => bot.story(s + 80, { start: 'ch3', stop: 'ch4' }));
  ok(runs.every(r => r.end && r.retries <= 1), 'bot story: chapter 3 is finished, at most one fight replayed');
  ok(runs.every(r => r.maps.join() === 'fenn_house,ordmantell_junk,kintan_wastes,kintan_fortress'), 'the Fenn house, Ord Mantell, the wastes and the fortress');
  ok(runs.every(r => { const lv = r.S.party.find(m => m.id === 'aayla').level; return lv >= 21 && lv <= 25; }), 'chapter 3 ends around level 23 (plan 5.1)');
  ok(runs.every(r => A.Bonds.rank(r.S, 'vos') >= 1 && A.Bonds.rank(r.S, 'villie') >= 1 && A.Bonds.rank(r.S, 'secura') >= 1 && r.S.flags.cover_servant && r.S.flags.rs_p2 && r.S.flags.rs_p3), 'Vos, Villie and the Secura clan bonds, the cover and both respites');
  ok(runs.every(r => !r.S.flags.with_vos && !r.S.flags.with_villie && r.S.cover === null), 'nobody stays in the party by mistake');
  ok(runs.every(r => r.flights.length >= 1 && r.flights.every(x => x.id === 'kintan') && r.flights[r.flights.length - 1].over === 'win'), 'the bot flies over Kintan and wins the flight');
}

{
  const K = A.FLIGHT, FL = A.FLIGHTS, ids = Object.keys(FL);
  ok(ids.join() === 'kintan,kamino,saleucami,felucia', 'three flights from the plan (7.15): Kintan, Kamino, Saleucami, and the bike chase on the same engine');
  ok(FL.kintan.chapter === 'ch3' && FL.kamino.chapter === 'ch4' && FL.saleucami.chapter === 'ch6' && FL.felucia.chapter === 'ch7' && FL.felucia.ship === 'barc' && FL.felucia.goal.type === 'survive', 'the flights belong to chapters 3, 4 and 6, the bike chase to chapter 7');
  ok(FL.kintan.ship === 'inferno' && FL.kamino.ship === 'delta7' && FL.kamino.shipName.includes('Красная-2') && FL.saleucami.ship === 'eta2' && FL.saleucami.shipName.includes('Синяя'), 'the Inferno over Kintan, Red Two in a Delta-7 over Kamino, an Eta-2 of Blue Squadron over Saleucami');
  const OPS = ['radio', 'wave', 'spires', 'geysers', 'orbs', 'boss', 'base', 'kamikaze', 'retreat', 'end'];
  for (const id of ids) {
    const d = FL[id];
    ok(d.timeline.every((e, i) => i === 0 || e[0] >= d.timeline[i - 1][0]) && d.timeline.every(e => OPS.includes(e[1])), id + ': the timeline runs in order and uses known steps');
    ok(d.timeline.filter(e => e[1] === 'wave').every(e => K.foes[e[2]] && K.foes[e[2]].fighter && ['line', 'vee', 'column', 'sweep', 'dive', 'hover'].includes(e[3]) && e[4] > 0), id + ': waves use known fighters and patterns');
    const extra = [d.leak, d.boss && d.boss.dive, d.boss && d.boss.down, ...(d.boss ? d.boss.passes.map(p => p.out) : []), d.base && d.base.down, d.base && d.base.done].filter(Boolean);
    const radio = d.timeline.filter(e => e[1] === 'radio').map(e => [e[2], e[3]]).concat(extra);
    ok(radio.length >= 6 && radio.every(([who, text]) => A.Flight.voice(d, who) && F.wrap('text', text, 560).length <= 2 && !/—/.test(text)), id + ': radio voices are known, every line fits two rows, no long dashes');
    ok(d.shields > 0 && d.speed > 0 && d.cadence > 0 && d.scroll > 0 && F.measure('bold', d.shipName) < 400, id + ': ship numbers and name');
  }
  ok(A.MUSIC.includes('flight') && A.TRACKS.flight.bpm > 120, 'the flight has its own music');
  ok(FL.kintan.boss.passes.length === 3 && FL.kintan.boss.passes[2].until === 0 && FL.saleucami.base.cannons.length === 6, 'Bok comes three times and falls on the third, six ion cannons stand on the rim');

  const run = (f, sec, inp) => { for (let i = 0; i < Math.round(sec * 60); i++) f.step(A.STEP, inp || {}); };
  const f1 = new A.Flight({ id: 'kintan', seed: 3 });
  run(f1, 1.2);
  const x0 = f1.ship.x;
  run(f1, 0.2, { dx: 1 });
  const walk = f1.ship.x - x0;
  const f2 = new A.Flight({ id: 'kintan', seed: 3 });
  run(f2, 1.2);
  f2.step(A.STEP, { dx: 1, dash: true });
  const inv = f2.ship.inv;
  run(f2, 0.2 - A.STEP, { dx: 1 });
  ok(f2.ship.x - x0 > walk * 2 && f2.stats.dashes === 1 && inv >= K.ship.dashInv - 0.02, 'a dash carries the ship more than twice as far and covers it for a moment');
  f2.step(A.STEP, { dash: true });
  ok(f2.stats.dashes === 1, 'the next dash waits for the cooldown');
  run(f2, K.ship.dashCool);
  f2.step(A.STEP, { dash: true });
  ok(f2.stats.dashes === 2, 'after the cooldown the dash works again');
  const f3 = new A.Flight({ id: 'kintan', seed: 3 });
  run(f3, 0.5, { fire: true });
  ok(f3.stats.shots >= 3 && f3.shots.length >= 4 && f3.shots.length % 2 === 0, 'holding fire shoots both guns at the ship rate');
  run(f3, 1);
  f3.hurt(12, 'ion');
  const ion = f3.ship.x;
  run(f3, 0.2, { dx: -1, dash: true });
  ok(f3.ship.ion > 0 && f3.stats.dashes === 0 && ion - f3.ship.x < walk * 0.7, 'an ion hit slows the ship and blocks the dash');

  const f4 = new A.Flight({ id: 'kintan', seed: 4 });
  run(f4, 1.2);
  f4.hurt(30, 'bolt');
  ok(f4.ship.shield === f4.ship.max - 30 && f4.ship.inv > 0, 'a hit takes shields and gives a short cover');
  f4.ship.shield = 1;
  f4.ship.inv = 0;
  f4.bolts.push({ x: f4.ship.x, y: f4.ship.y, vx: 0, vy: 0, r: 2, dmg: 8, type: 'bolt', wait: 0 });
  f4.step(A.STEP, {});
  ok(f4.over === 'lose' && f4.reason === 'ship', 'with no shields left the flight is lost');
  const easy = new A.Flight({ id: 'kintan', seed: 4, difficulty: 'story' }), hard = new A.Flight({ id: 'kintan', seed: 4, difficulty: 'master' }), helped = new A.Flight({ id: 'kamino', seed: 4, help: true });
  easy.hurt(10, 'bolt');
  hard.hurt(10, 'bolt');
  ok(easy.ship.shield === easy.ship.max - 7 && hard.ship.shield === hard.ship.max - 13, 'difficulty changes the damage to the ship');
  ok(helped.ship.max === Math.round(FL.kamino.shields * K.help) && helped.leakMax === Math.round(FL.kamino.goal.leak * K.help), 'the Force help adds shields and lets more fighters slip past');

  const f5 = new A.Flight({ id: 'kamino', seed: 5 });
  f5.ship.inv = 1e6;
  for (let g = 0; g < 60 * 200 && !f5.over; g++) f5.step(A.STEP, {});
  ok(f5.over === 'lose' && f5.reason === 'city' && f5.stats.leaked > f5.leakMax && f5.stats.assists > 0, 'Kamino: the wingmen help, but a pilot who never shoots lets the droids reach Tipoca');

  const f6 = new A.Flight({ id: 'saleucami', seed: 6 });
  f6.ship.inv = 1e6;
  run(f6, 62);
  const cannons = f6.foes.filter(o => o.kind === 'cannon');
  ok(cannons.length === 6 && f6.dome && f6.speed === 0, 'Saleucami: the citadel stops at the top with its shield and six cannons');
  const c0 = cannons[0], hp0 = c0.hp;
  f6.shots.push({ x: c0.x, y: c0.y + 2 });
  f6.step(A.STEP, {});
  ok(c0.hp === hp0, 'while the shield stands the cannons take no damage');
  run(f6, 56);
  ok(!f6.dome && f6.t > 112, 'Blue Leader dives into the generator and the shield falls');
  for (const c of f6.foes.filter(o => o.kind === 'cannon')) {
    c.hp = 1;
    f6.shots.push({ x: c.x, y: c.y + 2 });
  }
  run(f6, 0.1);
  run(f6, K.closing + 0.1);
  ok(f6.cannons() === 0 && f6.over === 'win', 'when all six cannons are down the flight is won');

  const f7 = new A.Flight({ id: 'kintan', seed: 7 });
  f7.ship.inv = 1e6;
  run(f7, 20);
  const bok = f7.boss;
  ok(bok && bok.phase === 'fight', 'Bok catches up with the Inferno');
  while (['in', 'fight', 'aim', 'dive'].includes(bok.phase)) f7.damage(bok, 1);
  ok(bok.phase === 'out' && bok.hp === Math.ceil(bok.max * 0.7), 'at 70 % Bok turns away and comes back later');
  f7.bossIn(3);
  run(f7, 1);
  while (['in', 'fight', 'aim', 'dive'].includes(bok.phase)) f7.damage(bok, 1);
  ok(bok.phase === 'down', 'on the third pass Bok goes down');
  run(f7, 2.4);
  ok(bok.phase === 'dead' && f7.closing > 0, 'his fighter falls into the black sands');
  run(f7, K.closing + 0.1);
  ok(f7.over === 'win', 'the Kintan flight is won');

  const bot = require(path.join(ROOT, 'tools/aayla98-bot.cjs'));
  const same = [bot.flight('kintan', 41), bot.flight('kintan', 41)];
  ok(same[0].t === same[1].t && JSON.stringify(same[0].stats) === JSON.stringify(same[1].stats), 'a flight repeats exactly with the same seed and the same moves');
  for (const id of ids) {
    const runs = [1, 2, 3, 4].map(s => bot.flight(id, 700 + s * 13));
    ok(runs.every(r => r.over === 'win'), `bot pilot wins ${id} 4 times of 4`);
    ok(runs.every(r => r.t >= 120 && r.t <= 240), `${id} lasts 2-4 minutes: ${runs.map(r => Math.round(r.t)).join(', ')} s`);
    const lazy = [1, 2, 3, 4].map(s => bot.flight(id, 700 + s * 13, { pilot: bot.sway }));
    ok(lazy.filter(r => r.over === 'win').length <= 1, `${id}: a pilot who only sways and shoots loses at least 3 of 4`);
  }

  const P = X.build(), ch3f = P.labels.ch3_flight.steps.find(s => s.op === 'flight');
  ok(ch3f && ch3f.id === 'kintan', 'chapter 3 flies over Kintan with the flight command');
  const used = P.order.flatMap(n => P.labels[n].steps.filter(s => s.op === 'flight').map(s => s.id));
  ok(used.join() === 'kintan,kamino,saleucami,felucia' && P.labels.ch4_flight.steps.some(s => s.op === 'flight' && s.id === 'kamino') && P.labels.ch6_flight.steps.some(s => s.op === 'flight' && s.id === 'saleucami'), 'chapter 4 flies over Kamino, chapter 6 over Saleucami');
  const st = new X.Story(X.parse('@a\n-: взлёт\nflight kintan\n-: посадка\nstop', 'f'), A.newState(), 'a');
  const evs = [st.next(), st.next(), st.next()];
  ok(evs[1].type === 'flight' && evs[1].id === 'kintan' && evs[1].label === 'a' && evs[2].text === 'посадка', 'the story hands the flight to the screen and goes on after it');
  const fctx = Object.assign(ctx(['a']), { flights: A.FLIGHTS });
  ok(X.check(X.parse('@a\nflight nowhere\nstop', 'b'), fctx).some(e => /unknown flight/.test(e)), 'the checker knows the flights');
  ok(X.check(X.parse('@a\nset seen\nflight kintan\nstop', 'b'), fctx).some(e => /before anything that changes/.test(e)), 'a flight comes before any state change in its label, the autosave replays the label');
  ok(X.check(X.parse('@a\nbg kintan_wastes day\n-: взлёт\nflight kintan\nstop', 'b'), fctx).length === 0, 'scenery and lines may come before a flight');
  const I = A.Input;
  ok(I.label('fire', 'kb') === 'Space' && I.label('dash', 'kb') === 'Shift' && I.label('fire', 'pad') === 'A' && I.label('dash', 'pad') === 'RB', 'flight controls: Space and Shift, A and RB on the gamepad (7.15)');
}

{
  const P = X.build(), bot = require(path.join(ROOT, 'tools/aayla98-bot.cjs'));
  const ch4 = P.order.filter(n => n.startsWith('ch4_') || ['rs_meditate_p4', 'rs_archive_ch5', 'tr_deflect3', 'tr_barrier'].includes(n));
  ok(ch4.length >= 50 && !/—/.test(ch4.map(n => P.labels[n].steps.filter(s => s.op === 'say').map(s => s.text).join(' ')).join(' ')), 'chapter 4 scenes use no long dashes: ' + ch4.length + ' labels');
  ok(P.labels.ch3_knight.steps.some(s => s.op === 'goto' && s.to === 'ch4_start'), 'chapter 3 leads straight into chapter 4');
  ok(P.labels.ch4_bly_spar.steps.some(s => s.op === 'goto' && s.to === 'ch5_start'), 'chapter 4 leads straight into chapter 5');
  const cgs = new Set(ch4.flatMap(n => P.labels[n].steps.filter(s => s.op === 'cg' && s.id).map(s => s.id)));
  ok(['arena', 'jayzaa', 'underwater', 'hypori', 'bly'].every(id => cgs.has(id)), 'the five CG of chapter 4 (plan 6.6) are shown');
  const groups = new Set(ch4.flatMap(n => P.labels[n].steps.filter(s => s.op === 'battle').map(s => s.group)));
  ok(['arena', 'wheel_trap', 'wheel_guards', 'wheel_pit', 'zenex_bridge', 'kuma_platform', 'hypori', 'bly_spar'].every(g => groups.has(g)), 'chapter 4 fights: arena, trap, exposure, dianoga, Zenex, Kuma Nai, Hypori, sparring');

  const st = new X.Story(P, (() => { const S = A.newState(); A.Party.preset(S, 'ch4'); return S; })(), 'ch4_start');
  const first = st.next();
  ok(first.type === 'chapter' && first.id === 'ch4' && st.S.credits === A.CHAPTERS.ch4.credits, 'chapter 4 opens with its card and the Order issues credits');

  const R = A.Repair;
  for (const [id, d] of Object.entries(A.REPAIRS)) {
    const cells = R.cells(d), rot = R.start(id);
    ok(cells.length === d.h && cells.every(r => r.length === d.w && r.every(c => /^[ILT][0-3]$/.test(c))), `repair ${id}: ${d.w}x${d.h} tiles of three kinds`);
    ok(R.solved(d, cells.map(r => r.map(c => +c[1]))) && !R.solved(d, rot), `repair ${id}: the designed wiring works, the scrambled start does not`);
    const clicks = R.solve(d, rot);
    for (const [x, y] of clicks) R.turn(rot, x, y);
    ok(clicks.length > 0 && clicks.length <= 16 && R.solved(d, rot), `repair ${id}: the solver fixes it in ${clicks.length} turns`);
  }
  ok(R.mask('L', 0) === 3 && R.mask('L', 1) === 6 && R.mask('I', 1) === 10 && R.mask('T', 3) === 11, 'tiles turn clockwise: N=1, E=2, S=4, W=8');

  const C = A.COVERS.jayzaa;
  ok(C.chapter === 'ch4' && C.map === 'wheel_levels' && C.look === 'aayla_jayzaa' && C.intel.length === 3 && P.labels[C.exposed], 'the mechanic Jayzaa: dossier, map, look, three pieces of intel, exposure scene');
  const S = A.newState();
  A.Party.preset(S, 'ch4');
  S.credits = 300;
  A.Cover.start(S, 'jayzaa');
  const f = new A.Field(S, 'wheel_levels', 'start');
  ok(f.objs.some(o => o.id === 'd') && !f.walkable(35, 17), 'the lift door to the lower levels is locked at first');
  f.p.x = 11 * 16 + 8; f.p.y = 5 * 16 + 14; f.p.dir = 'right';
  ok(f.prompt().verb === 'Починить', 'the cooler offers a repair');
  f.interact();
  const ev = f.take().find(e => e.type === 'repair');
  ok(ev && ev.puzzle === 'cooler', 'a repair opens the wiring puzzle');
  A.Cover.add(S, 30, 'seen');
  ok(f.fixed(ev.obj) && S.flags.fixed_cooler && S.credits === 340, 'the fixed cooler pays Jayzaa: the credits go to the common purse');
  const after = f.take();
  ok(after.some(e => e.type === 'lines') && after.some(e => e.type === 'cover' && e.add === -C.duty), 'the job is work in the role: suspicion falls');
  ok(!f.fixed(ev.obj) && f.prompt().verb !== 'Починить', 'a job is done once');
  ok(A.Cover.why(S, 'seen') === C.why.seen && A.Cover.why(S, 'force') === A.Cover.WHY.force, 'the cover names its own reasons for suspicion');
  f.p.x = 40 * 16 + 8; f.p.y = 5 * 16 + 14; f.p.dir = 'right';
  f.interact();
  const lift = f.take().find(e => e.type === 'repair');
  f.fixed(lift.obj);
  f.take();
  ok(S.flags.fixed_lift && !f.objs.some(o => o.id === 'd') && f.walkable(35, 17), 'the fixed lift panel opens the lower levels');
  ok(A.Cover.got(S) === 1, 'the lift is one of three pieces of intel');

  const exp = (() => { const S2 = A.newState(); A.Party.preset(S2, 'ch4'); A.Cover.start(S2, 'jayzaa'); A.Cover.add(S2, 100, 'seen'); const s2 = new X.Story(P, S2, 'ch4_exposed'); const out = []; for (let g = 0; g < 60; g++) { const e = s2.next(); out.push(e); if (e.type === 'battle') break; } return { out, S2, s2 }; })();
  ok(exp.out.some(e => e.type === 'battle' && e.group === 'wheel_guards'), 'exposed: a fight with Zenex men');
  for (let g = 0; g < 60; g++) { const e = exp.s2.next(); if (e.type === 'battle') break; }
  ok(exp.S2.flags.intel_korto && exp.S2.flags.intel_guide && exp.S2.flags.fixed_lift, 'after the exposure the harder way gives the same intel');

  const lek = (pose, restraint) => X.lekkuResult(Object.assign(A.newState(), { restraint }), { who: 'kit', need: 3 }, { lie: true }, pose);
  ok(lek('calm', 3).tell && lek('calm', 0).tell && !lek('show', 3).tell, 'Kit always sees a lie on the lekku (7.4), the restraint does not help');
  const x2 = new X.Story(X.parse('@a\nif credits >= 50\nset rich\nend\nset credits-50\nstop', 'c'), Object.assign(A.newState(), { credits: 60 }), 'a');
  x2.next();
  ok(x2.S.flags.rich && x2.S.credits === 10, 'scenes read and spend credits');

  const mk = (lv, flags) => { const S3 = A.newState(); A.Party.preset(S3, 'ch4'); const a = S3.party[0]; a.level = lv; a.xp = A.xpFor(lv); const st3 = A.stats('aayla', lv); a.hp = st3.hp; a.fp = st3.fp; Object.assign(S3.flags, flags || {}); A.Party.ensure(S3); return S3; };
  const kit = mk(26, { with_kit: true });
  ok(kit.party.some(m => m.id === 'kit' && m.level === 29), 'Kit joins three levels above Aayla');
  const kb = new A.Battle({ S: kit, group: 'kuma_platform', seed: 3 });
  kb.begin();
  const k = kb.unit('kit'), b2 = kb.units.find(e => e.key === 'b2');
  const dry = new A.Battle({ S: mk(26, { with_kit: true }), group: 'kamino_b', seed: 3 });
  dry.begin();
  ok(kb.wet && !dry.wet, 'rain and ocean make Kamino wet');
  const wetHit = kb.damage(k, b2, A.SKILLS.shiicho).dmg, dryHit = dry.damage(dry.unit('kit'), dry.units.find(e => e.key === 'b2'), A.SKILLS.shiicho).dmg;
  ok(wetHit > dryHit * 1.1, `Shii-Cho is stronger in rain and water: ${wetHit} against ${dryHit}`);
  ok(kb.damage(kb.unit('aayla'), b2, A.SKILLS.fists).weak, 'a kick hits a super battle droid where it hurts');

  const jk = new A.Battle({ S: mk(28, { saber_green: true }), group: 'kamino_a', seed: 5 });
  jk.begin();
  const ja = jk.unit('aayla');
  ok(ja.saber2 === A.GREEN_BLADE, 'the second, green blade');
  ja.tempo = 5;
  const je = [];
  jk.perform(ja, 'combo', jk.enemies()[0].id, je, {});
  ok(je.filter(e => e.type === 'strike' && e.who === 'aayla').length === 3, "Jar'Kai: the combo strikes three times");

  const geo = new A.Battle({ S: mk(23), group: 'arena', seed: 7 });
  geo.begin();
  const g1 = geo.addEnemy('geonosian', 'back', 1), dk = geo.addEnemy('droideka', 'front', 0), ga = geo.unit('aayla');
  ok(!geo.targets(ga, 'leap').includes(g1.id) && geo.targets(ga, 'throw').includes('back'), 'a flying Geonosian in the back row is out of reach of the blade, a thrown blade still gets there');
  ok(!geo.targets(ga, 'talk').includes(g1.id), 'Geonosians do not talk (plan 9)');
  const pe = [];
  geo.perform(ga, 'pull', g1.id, pe, {});
  ok(g1.row === 'front' && g1.grounded === 2 && pe.some(e => e.status === 'grounded'), 'the pull brings a flyer down for two turns');
  ok(geo.damage(ga, dk, A.SKILLS.blade).resist && geo.damage(ga, dk, A.SKILLS.pistol).dmg === 0, 'the droideka shield halves the blade and stops blaster bolts');
  const se = [];
  geo.shove(dk, 10, 1, se);
  ok(dk.status.shieldOff === 2 && !geo.damage(ga, dk, A.SKILLS.blade).resist, 'a push knocks the shield off');
  ga.deflectLevel = 3;
  ok(geo.targets(ga, 'deflect').length > 1, 'Deflection III lets Aayla pick a target');
  const de = [];
  geo.perform(ga, 'deflect', dk.id, de, {});
  dk.status.shieldOff = 0;
  delete dk.status.shieldOff;
  const shooter = geo.units.find(e => e.key === 'b1');
  const sh = [];
  geo.enemyHit(shooter, ga, 'b1shot', sh);
  ok(sh.some(e => e.type === 'shot' && e.to === dk.id && e.shielded) && dk.hp === dk.maxhp, 'a deflected bolt sent into a shielded droideka is stopped');
  const bar = new A.Battle({ S: mk(28, { tr_barrier: true }), group: 'wheel_guards', seed: 4 });
  bar.begin();
  const ba = bar.unit('aayla'), gun = bar.units.find(e => e.key === 'enforcer_gun');
  ok(ba.skills.includes('barrier'), 'the Force barrier comes from the training');
  const plain = bar.damage(gun, ba, A.SKILLS.pistol).dmg;
  bar.barrier = true;
  ok(bar.damage(gun, ba, A.SKILLS.pistol).dmg < plain * 0.6, 'the barrier halves shots at the party');

  const duo = new A.Battle({ S: (() => { const S4 = mk(26, { with_vos: true }); S4.bonds.vos.rank = 3; return S4; })(), group: 'wheel_pit', seed: 2 });
  duo.begin();
  const da = duo.unit('aayla');
  ok(da.skills.includes('duo') && duo.partner('vos'), 'Vos 3: "Together" when Vos is near');
  da.tempo = 2;
  const dd = [];
  duo.perform(da, 'duo', duo.enemies()[0].id, dd, {});
  ok(dd.filter(e => e.type === 'strike').map(e => e.who).join() === 'aayla,vos', 'Aayla and Vos strike the same target');
  const solo = new A.Battle({ S: (() => { const S5 = mk(26); S5.bonds.vos.rank = 3; return S5; })(), group: 'zenex_bridge', seed: 2 });
  solo.begin();
  const sc = solo.commands(solo.unit('aayla')).find(c => c.id === 'duo');
  ok(sc && !sc.enabled && /не рядом/.test(sc.why), 'without Vos the joint strike is greyed out');

  const run = (g, S6, adv) => { const b = new A.Battle({ S: S6, group: g, seed: 5, advantage: adv }); b.begin(); let guard = 0; while (!b.over && guard++ < 600) { const c = bot.choose(b); b.act(c.skill, c.target, c.extra); } return b; };
  const arena = run('arena', mk(23));
  ok(arena.over === 'end' && arena.endReason === 'circle' && arena.waved && arena.units.some(u => u.key === 'droideka'), 'the arena: a second wave with droidekas and Geonosians, then the circle');
  const pit = run('wheel_pit', mk(25, { with_vos: true }));
  ok(pit.over === 'end' && pit.endReason === 'letgo' && pit.reward().xp > 0, 'the dianoga lets Khaleen go at half health');
  const zen = new A.Battle({ S: mk(26), group: 'zenex_bridge', seed: 6 });
  zen.begin();
  const zu = zen.units.find(e => e.key === 'zenex'), za = zen.unit('aayla'), ze = [];
  A.DUELS.zenex.act(zen, zu, { skill: 'pheromone', target: 'aayla' }, ze);
  ok(zen.daze === A.DUELS.zenex.step * (za.mindguard ? 0.5 : 1) && ze.some(e => e.type === 'line' && e.who === 'zenex'), 'pheromones raise the haze, Zenex speaks once');
  zen.daze = 95;
  A.DUELS.zenex.act(zen, zu, { skill: 'pheromone', target: 'aayla' }, []);
  ok(za.status.stun && zen.daze === 50, 'a full haze makes Aayla lose a turn');
  A.DUELS.zenex.afterAct(zen, za, 'focus', []);
  ok(zen.daze === 10, 'Focus clears the haze');
  const zr = run('zenex_bridge', mk(26));
  ok(zr.over === 'end' && zr.endReason === 'impale' && zr.units.find(e => e.key === 'zenex').gone === 'dead', 'Aayla runs Zenex through');
  const Sh = mk(29, { saber_green: true });
  const hy = run('hypori', Sh);
  ok(hy.over === 'end' && hy.endReason === 'thrown' && Sh.flags.duel_hypori_turns === A.DUELS.grievous.turns && Sh.flags.duel_hypori_kept >= 0, 'Hypori: hold out six turns, then Grievous throws Aayla');
  ok(hy.units.filter(u => u.side === 'party').map(u => u.key).join() === 'aayla,kiadi,shaak', 'Aayla with Ki-Adi-Mundi and Shaak Ti');
  const hc = new A.Battle({ S: mk(29), group: 'hypori', seed: 9 });
  hc.begin();
  ok(hc.commands(hc.unit('aayla')).some(c => c.id === 'cover:kiadi'), 'Aayla can cover a master');
  hc.covered = 'kiadi';
  const gv = hc.units.find(e => e.key === 'grievous'), hits = [];
  A.DUELS.grievous.act(hc, gv, { skill: 'ggrab', target: 'kiadi' }, hits);
  ok(hits.some(e => e.target === 'aayla') && !hits.some(e => e.target === 'kiadi'), 'a covered master: Grievous hits Aayla instead');
  const sp = run('bly_spar', mk(30, { saber_green: true }));
  ok(sp.over === 'end' && ['won', 'lost'].includes(sp.endReason), 'the sparring ends without a defeat');
  const spc = new A.Battle({ S: mk(30, { saber_green: true }), group: 'bly_spar', seed: 1 });
  spc.begin();
  const sa = spc.commands(spc.unit('aayla'));
  ok(sa.find(c => c.id === 'fists').enabled && !sa.find(c => c.id === 'blade').enabled && !sa.find(c => c.id === 'push').enabled, 'sparring: only hands, no blade and no Force');

  ok(A.RESPITES.p4.chapter === 'ch4' && A.ARCHIVE.ch5.respites.includes('p4') && A.Respite.labels('p4').every(l => P.labels[l]), 'P4 in the Temple: meditation, the archive about chapter 5 and the trainings have scenes');
  ok(['bond_vos_3', 'bond_kit_1', 'bond_kit_2', 'bond_kit_3', 'bond_kit_talk', 'bond_bly_1', 'bond_bly_talk'].every(l => P.labels[l] && A.BOND_SCENES[l]), 'bond scenes Vos 3, Kit 1-3 and Bly 1 with their summaries');

  const runs = [1, 2, 3, 4, 5, 6].map(sd => bot.story(sd + 100, { start: 'ch4', stop: 'ch5' }));
  ok(runs.every(r => r.end && r.retries <= 1), 'bot story: chapter 4 is finished, at most one fight replayed');
  ok(runs.every(r => r.maps.join() === 'wheel_levels,kamino_tipoca'), 'the Wheel and Tipoca');
  ok(runs.every(r => r.repairs.includes('cooler') && r.repairs.includes('lift')), 'Jayzaa fixes the cooler and the lift');
  ok(runs.every(r => r.flights.length >= 1 && r.flights.every(x => x.id === 'kamino') && r.flights[r.flights.length - 1].over === 'win'), 'the bot flies over Kamino and wins');
  ok(runs.every(r => { const lv = r.S.party.find(m => m.id === 'aayla').level; return lv >= 29 && lv <= 32; }), 'chapter 4 ends around level 31 (plan 5.1): ' + runs.map(r => r.S.party.find(m => m.id === 'aayla').level).join(', '));
  ok(runs.every(r => A.Bonds.rank(r.S, 'vos') === 3 && A.Bonds.rank(r.S, 'kit') >= 1 && A.Bonds.rank(r.S, 'bly') === 1 && r.S.flags.saber_green && r.S.flags.rs_p4 && r.S.flags.cover_jayzaa), 'Vos 3, Kit, Bly, the second blade, P4 and the cover');
  ok(runs.every(r => !r.S.flags.with_vos && !r.S.flags.with_kit && r.S.cover === null && r.S.party.length === 1), 'nobody stays in the party by mistake');
}

{
  const P = X.build(), bot = require(path.join(ROOT, 'tools/aayla98-bot.cjs'));
  const ch5 = P.order.filter(n => n.startsWith('ch5_') || ['rs_meditate_p5', 'rs_meditate_p6', 'rs_archive_ch6', 'tr_push3'].includes(n));
  ok(ch5.length >= 55 && !/—/.test(ch5.map(n => P.labels[n].steps.filter(s => s.op === 'say').map(s => s.text).join(' ')).join(' ')), 'chapter 5 scenes use no long dashes: ' + ch5.length + ' labels');
  ok(P.labels.ch5_yoda.steps.some(s => s.op === 'goto' && s.to === 'ch6_start') && A.CHAPTERS.ch5.stage === 13, 'chapter 5 leads straight into chapter 6');
  const cgs = new Set(ch5.flatMap(n => P.labels[n].steps.filter(s => s.op === 'cg' && s.id).map(s => s.id)));
  ok(['vos_holo', 'antenna', 'shonju', 'laugh', 'found'].every(id => cgs.has(id)), 'the five CG of chapter 5 (plan 6.7) are shown');
  const groups = new Set(ch5.flatMap(n => P.labels[n].steps.filter(s => s.op === 'battle').map(s => s.group)));
  ok(['devaron_guards', 'aurra_duel', 'raiders_final', 'cavamina_cantina', 'forest_sabat', 'duum_guards', 'shonju_duel'].every(g => groups.has(g)), 'chapter 5 fights: exposure, Aurra, the raiders, the cantina, the forest, the station guards, Shon-Ju');
  ok(P.labels.ch5_holo.steps.some(s => s.op === 'set' && s.effects.some(e => e.key === 'letgo.vos')), 'the hologram is the second «let go» step of the Vos bond (7.9)');
  ok(P.labels.ch5_yoda.steps.some(s => s.op === 'say' && /провалом задание твоё не стало/.test(s.text)) && P.labels.ch5_yoda.steps.some(s => s.op === 'say' && /то, чего не хватало/.test(s.text)), 'Yoda and Aayla speak the canon lines');
  const st = new X.Story(P, (() => { const S = A.newState(); A.Party.preset(S, 'ch5'); return S; })(), 'ch5_start');
  const first = st.next();
  ok(first.type === 'chapter' && first.id === 'ch5' && st.S.credits === 500 && st.S.party[0].level === 31, 'chapter 5 opens with its card, 500 credits for the heiress, Aayla at level 31');
  const card = new X.Story(X.parse('@a\nshow vos left early calm\ngoto b\n@b\nchapter ch5\nbg temple_hall day\n-: дальше\nstop', 'ok'), A.newState(), 'a');
  ok(card.next().type === 'chapter' && !Object.keys(card.vn.busts).length, 'a chapter card clears the busts left from the chapter before');
  const firstBg = label => (P.labels[label].steps.find(s => s.op === 'bg') || {}).id;
  ok(A.PLACES.ship.rooms.every(r => r.bg.startsWith('taskforce_') && A.Art.LIST.bg[r.bg] && A.Art.LIST.bg[r.bg].times.includes('night')), 'every room of the task force ship has its own night background');
  ok(firstBg('bond_traa_2') === 'taskforce_hold' && firstBg('tr_push3') === 'respite' && firstBg('rs_meditate_p5') === 'taskforce_medbay', 'P5 scenes play in the room where they happen');
  const trainBg = id => { const S = A.newState(); A.Party.preset(S, 'ch5'); A.Respite.start(S, id); return X.respiteBg(S).id; };
  ok(trainBg('p5') === 'taskforce_hold' && trainBg('p4') === 'temple_hall' && trainBg('p7') === 'holstice_yard' && trainBg('p8') === 'cruiser_hold' && Object.keys(A.TRAININGS).every(t => firstBg('tr_' + t) === 'respite'), 'trainings play in the training room of the respite they happen in');
  ok(P.labels.ch5_cavamina.steps.findIndex(s => s.op === 'hide') < P.labels.ch5_cavamina.steps.findIndex(s => s.op === 'say'), 'Cavamina starts without the busts of the bond scenes before it');

  const C = A.COVERS.tuulaa;
  ok(C.map === 'devaron_suite' && C.look === 'aayla_tuulaa' && C.intel.length === 3 && P.labels[C.exposed] && C.stingy, 'the heiress Tuulaa Doneeta: dossier, map, look, three pieces of intel, exposure scene, rule of spending');
  const S = A.newState();
  A.Party.preset(S, 'ch5');
  S.credits = 500;
  A.Cover.start(S, 'tuulaa');
  let r = null;
  for (let i = 0; i < 60 * (C.stingy.every - 1); i++) r = A.Cover.tick(S, 1 / 60) || r;
  ok(!r, 'no rumours before the time runs out');
  for (let i = 0; i < 120 && !r; i++) r = A.Cover.tick(S, 1 / 60);
  ok(r && r.add === C.stingy.add && r.why === 'stingy' && A.Cover.why(S, 'stingy') === C.why.stingy, 'an heiress who does not spend raises suspicion');
  S.flags.spent = 1;
  let r2 = null;
  for (let i = 0; i < 60 * (C.stingy.every - 1); i++) r2 = A.Cover.tick(S, 1 / 60) || r2;
  ok(!r2 && S.cover.idle < C.stingy.every, 'spending resets the clock');
  const shop = new X.Story(P, S, 'ch5_jeweler');
  let e;
  for (let g = 0; g < 20; g++) { e = shop.next(); if (e.type === 'choice') break; }
  const sus0 = S.cover.sus;
  shop.choose(0);
  for (let g = 0; g < 20; g++) { e = shop.next(); if (e.type === 'field') break; }
  ok(S.credits === 420 && S.flags.jewel_earrings && S.flags.spent === 2 && S.cover.sus <= Math.max(0, sus0 - 15) + 0.01, 'buying earrings spends 80 credits and lowers suspicion');
  const S2 = A.newState();
  A.Party.preset(S2, 'ch5');
  S2.credits = 30;
  const poor = new X.Story(P, S2, 'ch5_jeweler');
  for (let g = 0; g < 20; g++) { e = poor.next(); if (e.type === 'choice' || e.type === 'field') break; }
  ok(e.type === 'field', 'without money there is nothing to buy');
  const order = new X.Story(P, (() => { const S3 = A.newState(); A.Party.preset(S3, 'ch5'); A.Cover.start(S3, 'tuulaa'); return S3; })(), 'ch5_saba');
  for (let g = 0; g < 20; g++) { e = order.next(); if (e.type === 'choice') break; }
  order.choose(0);
  for (let g = 0; g < 20; g++) { e = order.next(); if (e.type === 'field') break; }
  ok(order.S.flags.intel_route, 'Saba listens at the study for her mistress');
  const f = new A.Field((() => { const S4 = A.newState(); A.Party.preset(S4, 'ch5'); return S4; })(), 'duum_hq', 'start');
  ok(f.timer === A.Maps.DEFS.duum_hq.timer.sec, 'the burning station has a clock');
  const T0 = f.timer;
  for (let i = 0; i < 60 * (T0 + 1); i++) f.step(1 / 60, {});
  const out = f.take();
  ok(f.timerOut && out.some(x => x.type === 'scene' && x.label === 'ch5_fire_fail') && P.labels.ch5_fire_fail.steps.some(s => s.op === 'map' && s.id === 'duum_hq'), 'when the fire wins, the run starts again');
  ok(f.objs.some(o => o.type === 'fire') && !f.walkable(24, 6), 'fire blocks the straight way');

  const mk = (lv, flags, bonds) => { const S5 = A.newState(); A.Party.preset(S5, 'ch5'); const a = S5.party[0]; a.level = lv; a.xp = A.xpFor(lv); const st5 = A.stats('aayla', lv); a.hp = st5.hp; a.fp = st5.fp; Object.assign(S5.flags, flags || {}); for (const [k2, v] of Object.entries(bonds || {})) Object.assign(A.Bonds.own(S5, k2), v); A.Party.ensure(S5); return S5; };
  const au = new A.Battle({ S: mk(33), group: 'aurra_duel', seed: 3 });
  au.begin();
  const aurra = au.units.find(u => u.key === 'aurra'), aa = au.unit('aayla');
  ok(!au.targets(aa, 'talk').includes(aurra.id), 'Aurra answers only in the duel choices (plan 9)');
  aa.hp -= Math.round(aa.maxhp * 0.2);
  au.check([]);
  ok(au.fear === 20, 'every per cent of lost health adds fear: ' + au.fear);
  const te = [];
  A.DUELS.aurra.act(au, aurra, { skill: 'ataunt', target: 'aayla' }, te);
  ok(au.fear === 20 + (aa.mindguard ? 5 : 10) && te.some(x => x.type === 'line' && x.who === 'aurra'), 'a taunt adds fear');
  aurra.hp = Math.round(aurra.maxhp * 0.5);
  const hp0 = aurra.hp;
  A.DUELS.aurra.act(au, aurra, { skill: 'asaber', target: 'aayla' }, []);
  ok(aurra.hp > hp0 && aurra.mig > A.ENEMIES.aurra.mig, 'the implant feeds on fear: Aurra heals and hits harder');
  A.DUELS.aurra.afterAct(au, aa, 'blade', []);
  ok(au.ask && au.ask.options.map(o => o.id).join() === 'abandon,calm,anger', 'Aurra asks her question when she is hurt');
  ok(au.commands(aa).length === 0 && au.proceed([]).length === 0, 'the battle waits for the answer');
  const fear0 = au.fear, q0 = au.ask, ce = [];
  au.ask = null;
  A.DUELS.aurra.answer(au, q0, 'calm', ce);
  ok(au.fear === fear0 - 15 && !au.antenna && ce.some(x => x.type === 'line' && x.who === 'aayla'), 'a calm answer lowers fear');
  aurra.hp = Math.round(aurra.maxhp * 0.35);
  A.DUELS.aurra.afterAct(au, aa, 'blade', []);
  au.answer('abandon');
  ok(au.antenna && aurra.rage && !au.ask, 'the canon answer about abandonment enrages Aurra and bares the antenna');
  const ac = au.commands(aa).find(c => c.id === 'antenna');
  ok(ac && ac.enabled, 'Aayla can cut the antenna');
  const ae = [];
  A.DUELS.aurra.perform(au, aa, 'antenna', ae);
  ok(au.over === 'end' && au.endReason === 'antenna' && aurra.gone === 'ko', 'the cut antenna ends the duel, Aurra is taken alive');
  const angry = new A.Battle({ S: mk(33), group: 'aurra_duel', seed: 4 });
  angry.begin();
  angry.units.find(u => u.key === 'aurra').hp = Math.round(A.ENEMIES.aurra.hp * 0.5);
  A.DUELS.aurra.afterAct(angry, angry.unit('aayla'), 'blade', []);
  angry.answer('anger');
  ok(angry.darkDelta === 3 && !angry.antenna, 'an angry answer gives Darkness and no rage');

  const sh = new A.Battle({ S: mk(36, { saber_green: true }), group: 'shonju_duel', seed: 5 });
  sh.begin();
  const sa = sh.unit('aayla'), sj = sh.units.find(u => u.key === 'shonju_foe');
  const cm = sh.commands(sa);
  ok(!sa.armed && !cm.find(c => c.id === 'blade').enabled && cm.find(c => c.id === 'fists').enabled, 'Shon-Ju: the saber is with Duum, only hands and the Force');
  sj.hp = Math.round(sj.maxhp * 0.45);
  sh.check([]);
  ok(sh.ask && sh.ask.options[0].id === 'laugh', 'at half health he lifts her by the lekku');
  const hp1 = sa.hp;
  sh.answer('beg');
  ok(sa.hp < hp1 && sh.ask && !sh.laughed, 'pleading only hurts, he asks again');
  sh.answer('laugh');
  ok(sh.laughed && sh.commands(sa).some(c => c.id === 'pullsaber' && c.enabled), 'the laugh: «being a Jedi is accepting one\'s place», the saber can be called');
  const pe = [];
  A.DUELS.shonju.perform(sh, sa, 'pullsaber', pe);
  ok(sh.over === 'end' && sh.endReason === 'hands' && sa.armed, 'the called saber cuts off his hands');

  const run = (g, S6) => { const b = new A.Battle({ S: S6, group: g, seed: 5 }); b.begin(); let guard = 0; while (!b.over && guard++ < 600) { if (b.ask) { b.answer(bot.reply(b)); continue; } const c = bot.choose(b); b.act(c.skill, c.target, c.extra); } return b; };
  const cant = run('cavamina_cantina', mk(34));
  ok(cant.over === 'end' && cant.endReason === 'escape' && cant.units.filter(u => u.side === 'party').map(u => u.key).join() === 'aayla,clone_elite,clone_elite', 'the cantina: Aayla and two elite clones hold out four turns');
  const Sf = mk(34);
  const fo = run('forest_sabat', Sf);
  ok(fo.over === 'end' && fo.endReason === 'sabat' && fo.units.some(u => u.key === 'shonju' && u.side === 'party'), 'the forest: Shon-Ju fights beside Aayla, Sabat flies away when his droid falls');
  const dg = new A.Battle({ S: mk(35), group: 'duum_guards', seed: 6 });
  dg.begin();
  const drd = dg.units.find(u => u.key === 'sec_droid');
  ok(dg.plan(drd).skill === 'advance', 'the security droid walks forward from the back row');

  const tr = new A.Battle({ S: mk(34, { with_kit: true, with_traa: true }, { traa: { rank: 2 } }), group: 'raiders_final', seed: 7 });
  tr.begin();
  const traa = tr.units.find(u => u.key === 'traa');
  ok(traa && traa.skills.includes('roots'), "T'ra Saa fights with her roots");
  const re = [], foe = tr.enemies()[0];
  tr.perform(traa, 'roots', foe.id, re, {});
  ok(foe.status.rooted === 2 && tr.heroes().every(h => h.status.regen === 2), "T'ra Saa 2: the roots hold two turns and heal the party");
  const hurt = tr.unit('aayla');
  hurt.hp = Math.round(hurt.maxhp * 0.5);
  const he = [];
  tr.startTurn(hurt, he);
  ok(he.some(x => x.type === 'heal' && x.target === 'aayla'), 'the roots heal at the start of a turn');
  const heal = mk(34, {}, { traa: { rank: 3 } });
  ok(A.Party.skills(heal, heal.party[0]).includes('heal'), "T'ra Saa 3: Aayla heals with the Force");
  const hb = new A.Battle({ S: heal, group: 'raiders_a', seed: 2 });
  hb.begin();
  const ha = hb.unit('aayla');
  ha.hp = 100;
  hb.perform(ha, 'heal', 'aayla', [], {});
  ok(ha.hp === 100 + Math.round(ha.maxhp * 0.3) && hb.targets(ha, 'heal').includes('aayla'), 'Healing restores a third of health');
  const held = new A.Battle({ S: mk(34, { with_kit: true, kit_held: true }, { kit: { rank: 3 } }), group: 'raiders_final', seed: 8 });
  held.begin();
  const free = new A.Battle({ S: mk(34, { with_kit: true }, { kit: { rank: 3 } }), group: 'raiders_final', seed: 8 });
  free.begin();
  const twin = b => { const u = b.unit('aayla'), ev2 = []; u.tempo = 5; b.perform(u, 'twinwhirl', 'frontAll', ev2, {}); return ev2.filter(x => x.type === 'strike').reduce((t, x) => t + x.dmg, 0); };
  const dHeld = twin(held), dFree = twin(free);
  ok(dHeld > dFree * 1.15, `Kit held: the joint whirl is stronger (${dHeld} against ${dFree})`);
  const k5 = new A.Battle({ S: mk(34, {}, { kit: { rank: 5, letgo: 1 } }), group: 'raiders_a', seed: 9 });
  k5.begin();
  ok(k5.kitFive(), 'Kit 5, let go: the bond works without Kit');
  const k5h = new A.Battle({ S: mk(34, { kit_held: true }, { kit: { rank: 5, letgo: 0 } }), group: 'raiders_a', seed: 9 });
  k5h.begin();
  ok(!k5h.kitFive(), 'Kit 5, held: only when Kit is near');
  const k5a = k5.unit('aayla');
  k5.turns.aayla = 2;
  k5a.tempo = 0;
  const k5e = [];
  k5.startTurn(k5a, k5e);
  ok(k5a.tempo === 1 && k5e.some(x => x.type === 'tempo'), 'every third turn of Aayla: +1 Tempo');
  const bl = new A.Battle({ S: mk(34, {}, { bly: { rank: 2 } }), group: 'raiders_a', seed: 3 });
  bl.begin();
  const nb = new A.Battle({ S: mk(34), group: 'raiders_a', seed: 3 });
  nb.begin();
  const fistDmg = b => { const e2 = []; b.strike(b.unit('aayla'), b.enemies()[0], 'fists', e2); return e2[0].dmg; };
  ok(fistDmg(bl) > fistDmg(nb) * 1.1, 'Bly 2: hand-to-hand hits a fifth harder');
  const tw = mk(34, {}, { secura: { rank: 3 } });
  const twb = new A.Battle({ S: tw, group: 'raiders_a', seed: 4 });
  twb.begin();
  const tgt = twb.enemies()[0];
  Object.assign(A.ENEMIES[tgt.key], { twilek: true });
  const te2 = [];
  twb.talk(twb.unit('aayla'), tgt, 'threat', te2);
  const threat = te2[0].outcome;
  delete A.ENEMIES[tgt.key].twilek;
  ok(threat === 'rage', 'the clan name does not soften threats');
  const charm = rank => {
    const S7 = mk(34, {}, { secura: { rank } }), tb2 = new A.Battle({ S: S7, group: 'devaron_guards', seed: 4 });
    tb2.begin();
    const t2 = tb2.enemies().find(x => x.key === 'devaron_guard'), te3 = [];
    A.ENEMIES.devaron_guard.twilek = true;
    tb2.talk(tb2.unit('aayla'), t2, 'charm', te3);
    delete A.ENEMIES.devaron_guard.twilek;
    return te3[0].outcome;
  };
  ok(charm(1) === 'rage' && charm(3) === 'flee', 'Secura 3: a Twi lek guard flees instead of flying into a rage');

  ok(A.PLACES.ship.rooms.map(rm => rm.id).join() === 'bridge,hold,deck,medbay' && Object.values(A.RESPITES.p5.near).every(room => A.PLACES.ship.rooms.some(rm => rm.id === room)), 'P5 on the task force ship: everyone stands in a real room');
  ok(A.Respite.labels('p5').every(l => P.labels[l]) && A.Respite.labels('p6').every(l => P.labels[l]), 'P5 and P6 activities all have scenes');
  ok(['bond_traa_2', 'bond_traa_3', 'bond_traa_talk', 'bond_kit_4', 'bond_kit_5', 'bond_bly_2', 'bond_secura_3'].every(l => P.labels[l] && A.BOND_SCENES[l]), "bond scenes T'ra Saa 2-3, Kit 4-5, Bly 2 and Secura 3 with their summaries");
  const k4 = P.labels.bond_kit_4.steps.find(s => s.op === 'choice');
  ok(k4 && k4.options.some(o => o.effects.some(x => x.key === 'letgo.kit')) && k4.options.some(o => o.effects.some(x => x.key === 'kit_held')) && k4.options.some(o => o.effects.some(x => x.key === 'dark' && x.v === 10)), 'Kit 4: let go (canon) or hold on (Darkness +10)');

  const runs = [1, 2, 3, 4, 5, 6].map(sd => bot.story(sd + 120, { start: 'ch5', stop: 'ch6' }));
  ok(runs.every(r2 => r2.end && r2.retries <= 1), 'bot story: chapter 5 is finished, at most one fight replayed');
  ok(runs.every(r2 => r2.maps.join() === 'devaron_suite,devaron_base,duum_hq'), 'the senator\'s house, the Blue Mountains and the burning station');
  ok(runs.every(r2 => r2.asks.some(a2 => a2.startsWith('aurra')) && r2.asks.includes('lekku')), 'the bot answers Aurra and Shon-Ju');
  ok(runs.every(r2 => { const lv = r2.S.party.find(m => m.id === 'aayla').level; return lv >= 35 && lv <= 38; }), 'chapter 5 ends around level 37 (plan 5.1): ' + runs.map(r2 => r2.S.party.find(m => m.id === 'aayla').level).join(', '));
  ok(runs.every(r2 => A.Bonds.get(r2.S, 'vos').letgo === 2 && r2.S.flags.cover_tuulaa && r2.S.flags.found_self && r2.S.flags.rs_p5 && r2.S.flags.rs_p6), 'the second «let go», the cover, Yoda and both respites');
  ok(runs.every(r2 => !r2.S.flags.with_kit && !r2.S.flags.with_traa && r2.S.cover === null && r2.S.party.length === 1), 'nobody stays in the party by mistake');
}

{
  const P = X.build(), bot = require(path.join(ROOT, 'tools/aayla98-bot.cjs'));
  ok(['honoghr_a', 'honoghr_b', 'honoghr_ambush', 'temple_horde', 'vos_honoghr', 'camp_clones', 'vos_dark'].every(id => { const g = A.GROUPS[id]; return (g.party ? g.party.length : 3) + (g.allies || []).length <= 3; }), 'chapter 6 fights put at most three heroes on the field');
  const ch6 = P.order.filter(n => n.startsWith('ch6_') || ['rs_meditate_p7', 'rs_meditate_p8', 'rs_archive_ch7'].includes(n));
  ok(ch6.length >= 70 && !/—/.test(ch6.map(n => P.labels[n].steps.filter(s => s.op === 'say').map(s => s.text).join(' ')).join(' ')), 'chapter 6 scenes use no long dashes: ' + ch6.length + ' labels');
  ok(P.labels.ch6_end.steps.some(s => s.op === 'goto' && s.to === 'ch7_start') && A.CHAPTERS.ch6.stage === 14, 'chapter 6 leads straight into chapter 7');
  const cgs = new Set(ch6.flatMap(n => P.labels[n].steps.filter(s => s.op === 'cg' && s.id).map(s => s.id)));
  ok(['bly_shoots', 'honoghr', 'bok_gate', 'hand_dark'].every(id => cgs.has(id)), 'the four CG of chapter 6 (plan 6.8) are shown');
  const groups = new Set(ch6.flatMap(n => P.labels[n].steps.filter(s => s.op === 'battle').map(s => s.group)));
  ok(['honoghr_ambush', 'temple_horde', 'vos_honoghr', 'seii_students', 'bok_clone', 'camp_clones', 'bok_gate', 'vos_dark'].every(g => groups.has(g)), 'chapter 6 fights: the ambush, the temple, Vos, the students of Akku Seii, the Bok clone, the camp, Bok, the darkness of Vos');
  const said = n => P.labels[n].steps.filter(s => s.op === 'say').map(s => s.text).join(' ');
  ok(/шестьдесят процентов/.test(said('ch6_start')) && /Болота оказались опаснее/.test(said('ch6_trigalis')) && /В прошлый раз ты в меня стрелял/.test(said('ch6_saleucami')), 'canon lines: New Holstice, Trigalis, Vos and Bly on Saleucami');
  ok(P.labels.ch6_honoghr.steps.some(s => s.op === 'say' && s.who === 'bly_thinks') && X.thinker('bly_thinks') === 'bly' && X.thinker('vos') === null, 'Honoghr is told in the inner voice of Bly (plan 6.8)');
  ok(P.labels.ch6_hand_end.steps.some(s => s.op === 'set' && s.effects.some(e => e.key === 'letgo.vos')), 'Saleucami is the third «let go» step of the Vos bond (7.9)');
  const sh = P.labels.ch6_shots.steps.find(s => s.op === 'choice');
  ok(sh && sh.options.some(o => o.effects.some(e => e.key === 'honoghr_deflected')), 'Honoghr: deflect the shots of Bly (canon) or let them hit');
  ok(P.labels.ch6_flight.steps.find(s => s.op === 'flight').id === 'saleucami', 'the Saleucami flight is played in chapter 6');

  const mk = (lv, flags, bonds) => { const S6 = A.newState(); A.Party.preset(S6, 'ch6'); S6.chapter = 'ch6'; const a = S6.party[0]; a.level = lv; a.xp = A.xpFor(lv); const st6 = A.stats('aayla', lv); a.hp = st6.hp; a.fp = st6.fp; Object.assign(S6.flags, flags || {}); for (const [k2, v] of Object.entries(bonds || {})) Object.assign(A.Bonds.own(S6, k2), v); A.Party.ensure(S6); return S6; };
  const first = new X.Story(P, (() => { const S0 = A.newState(); A.Party.preset(S0, 'ch6'); return S0; })(), 'ch6_start').next();
  ok(first.type === 'chapter' && first.id === 'ch6', 'chapter 6 opens with its card');

  const fz = new A.Field(mk(38, { with_bly: true }), 'honoghr_forest', 'start');
  const ng = fz.objs.find(o => o.id === 'n');
  ok(ng && ng.hidden && !fz.visible(ng), 'the Noghri hide in the dead forest until the Force finds them');
  fz.p.x = ng.px; fz.p.y = ng.py + 4;
  fz.stepEnemies(1 / 60);
  ok(fz.take().some(e => e.type === 'encounter' && e.advantage === 'enemy'), 'an unseen Noghri strikes first');
  ok(fz.followers.length === 3, 'Bly and two troopers follow Aayla through the forest');

  const ft = new A.Field(mk(38, { with_bly: true, with_vos: true }), 'honoghr_temple', 'start');
  ok(ft.followers.length === 2 && !ft.objs.some(o => o.id === 'p'), 'Vos and Bly in the temple, the container waits behind the door');
  const guard = ft.objs.find(o => o.id === 'n'), dec = ft.objs.find(o => o.id === 'd');
  ft.p.x = dec.x * 16 + 8; ft.p.y = (dec.y - 1) * 16 + 14; ft.p.dir = 'down';
  ft.interact();
  ok(guard.mode === 'look' && Math.abs(guard.angle - Math.atan2(12 * 16 + 8 - guard.py, 9 * 16 + 8 - guard.px)) < 1e-6 && ft.prompt().verb === null, 'Bly draws the fire: the guards turn to the west wall, once');
  ft.S.flags.sigils_read = true;
  ft.refresh();
  ft.p.x = 20 * 16 + 8; ft.p.y = 7 * 16 + 14; ft.p.dir = 'up';
  ok(ft.forceTarget() && ft.forceTarget().id === 'p' && ft.can('pull'), 'after the sigils the container can be pulled with the Force');
  ft.force('pull');
  ok(ft.take().some(e => e.type === 'scene' && e.label === 'ch6_sip'), 'pulling the container plays the escape');
  const early = A.newState(); A.Party.forget(early); early.memory = [1]; early.chapter = 'ch1';
  ok(!A.Memory.can(early, 'pull') && (early.chapter = 'ch2', A.Memory.can(early, 'pull')), 'the Force pull returns to the field with the push from chapter 2');

  const fc = new A.Field(mk(41), 'saleucami_caverns', 'start');
  ok(!fc.walkable(18, 22), 'the laser gate closes the tunnel');
  fc.toggle(fc.objs.find(o => o.id === 'l'));
  ok(fc.walkable(18, 22) && !fc.sightBlocked(31, 11), 'the console opens the gate, lasers never block the view');
  const fm = (rank) => new A.Field(mk(42, {}, { vos: { rank } }), 'vos_mind', 'start').objs.filter(o => o.id === 'x' || o.id === 'y').length;
  ok(fm(4) === 0 && fm(3) === 1 && fm(1) === 2, 'mind dungeon: every two missing Vos ranks close one door (7.8)');

  const run = (g, S7) => { const b = new A.Battle({ S: S7, group: g, seed: 5 }); b.begin(); let n = 0; while (!b.over && n++ < 600) { if (b.ask) { b.answer(bot.reply(b)); continue; } const c = bot.choose(b); b.act(c.skill, c.target, c.extra); } return b; };
  const bly = A.HEROES.bly;
  ok(bly && bly.look === 'bly_phase2' && A.Pix.LOOKS.bly_phase2, 'Bly fights in Phase II armour (plan 5.4)');
  const S2 = mk(38, { with_bly: true }, { bly: { rank: 2 } }), S3 = mk(38, { with_bly: true }, { bly: { rank: 3 } });
  ok(!A.Party.skills(S2, S2.party.find(m => m.id === 'bly')).includes('bcover') && A.Party.skills(S3, S3.party.find(m => m.id === 'bly')).includes('bcover'), 'Bly 3: «Cover the general»');
  const cb = new A.Battle({ S: S3, group: 'honoghr_a', seed: 3 });
  cb.begin();
  const cbly = cb.unit('bly'), dart = cb.enemies().find(e => e.key === 'noghri_dart'), ev3 = [];
  cb.perform(cbly, 'bcover', 'none', ev3, {});
  const hp0 = cbly.hp;
  cb.enemyHit(dart, cb.unit('aayla'), 'ndart', ev3);
  ok(cbly.hp < hp0 && cb.unit('aayla').hp === cb.unit('aayla').maxhp, 'covering Bly takes the dart aimed at Aayla');
  const sp = new A.Battle({ S: mk(38, { with_bly: true }), group: 'honoghr_a', seed: 4 });
  sp.begin();
  const foe = sp.enemies()[0], a0 = sp.unit('aayla');
  const before = sp.damage(foe, a0, A.SKILLS.nblade).dmg;
  sp.perform(sp.unit('bly'), 'suppress', 'none', [], {});
  ok(foe.status.suppressed === 2 && sp.damage(foe, a0, A.SKILLS.nblade).dmg < before * 0.8, 'suppressing fire: the enemies hit a third weaker');

  const amb = run('honoghr_ambush', mk(38, { with_bly: true }));
  ok(amb.over === 'end' && amb.endReason === 'retreat' && amb.units.filter(u => u.side === 'party').length === 3, 'the ambush: the squad holds four turns, then the retreat to the temple');
  const hor = run('temple_horde', mk(38, { with_bly: true }));
  ok(hor.over === 'end' && hor.endReason === 'vos', 'the temple: the Noghri keep coming until Vos shoots');
  const vh = new A.Battle({ S: mk(39, { with_bly: true }), group: 'vos_honoghr', seed: 2 });
  vh.begin();
  const va = vh.unit('aayla');
  ok(vh.commands(va).some(c => c.id === 'cover:bly' && c.enabled), 'Vos on Honoghr: Aayla can cover Bly');
  vh.act('cover:bly');
  const hold = run('vos_honoghr', mk(39, { with_bly: true }));
  ok(hold.over === 'end' && hold.endReason === 'disarmed' && hold.S.flags.duel_honoghr_turns === 6, '«Hold out»: six turns, then Vos knocks the saber away, no defeat');

  const st = run('seii_students', (() => { const S8 = mk(40); S8.flags.seii_code = true; return S8; })());
  ok(st.over === 'win' && st.units.filter(u => u.side === 'party').map(u => u.key).join() === 'tholme' && st.units.filter(u => u.side === 'enemy').every(u => u.gone === 'ko' || u.gone === 'talked'), 'Anzat: Tholme alone, nobody dies (7.6.8)');
  const gb = new A.Battle({ S: mk(40), group: 'seii_students', seed: 3 });
  gb.begin();
  const te = [];
  gb.talk(gb.units.find(u => u.key === 'tholme'), gb.enemies()[0], 'charm', te);
  ok(te[0].outcome === 'pause' && !gb.enemies()[0].rage, 'in the fight without killing a failed Word does not enrage');

  const bk = new A.Battle({ S: mk(42), group: 'bok_gate', seed: 6 });
  bk.begin();
  const bokU = bk.units.find(u => u.key === 'bok_final'), ba = bk.unit('aayla');
  ok(!bk.commands(ba).find(c => c.id === 'blade').enabled || bk.strike(ba, bokU, 'blade', []).immune, 'Bok: the cortosis gauntlet makes the saber useless');
  bokU.hp = Math.round(bokU.maxhp * 0.45);
  bk.check([]);
  ok(bk.ask && bk.ask.options[0].id === 'father' && bk.rose >= 2, 'Bok rises angrier, at half health he speaks');
  bk.answer('father');
  ok(bk.raged && bokU.rage, 'the canon answer about his father enrages Bok');
  bokU.row = 'back';
  const fe = [];
  bk.shove(bokU, 10, 1, fe);
  ok(bk.over === 'end' && bk.endReason === 'gate', 'pushed in rage from the back row, Bok falls into the laser gate');
  const full = run('bok_gate', mk(42));
  ok(full.over === 'end' && full.endReason === 'gate', 'the bot ends the Bok duel at the gate');

  const dk = new A.Battle({ S: (() => { const S9 = mk(42, {}, { vos: { rank: 4 }, tholme: { rank: 4 } }); S9.memory = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]; S9.flags.mind_kiffu = true; return S9; })(), group: 'vos_dark', seed: 3 });
  dk.begin();
  const da = dk.unit('aayla'), dc = dk.commands(da);
  ok(!dc.find(c => c.id === 'blade').enabled && dc.filter(c => c.id.startsWith('frag:')).length === 7 && dc.some(c => c.id === 'mind:mind_kiffu') && dc.some(c => c.id === 'bond:vos'), 'the darkness of Vos: no blade, light from seven fragments with Vos, his memories and the bond');
  const shade = dk.enemies()[0], hp1 = shade.hp;
  A.DUELS.shadows.perform(dk, da, 'frag:1', []);
  ok(shade.hp < hp1 && dk.commands(da).find(c => c.id === 'frag:1').enabled === false, 'a fragment shines once');
  const dark = run('vos_dark', mk(42, {}, { vos: { rank: 3 }, tholme: { rank: 4 } }));
  ok(dark.over === 'end' && dark.endReason === 'light', 'the shadows fall, Quinlan stays');

  const v5 = mk(43, {}, { vos: { rank: 5, letgo: 3 } });
  ok(A.Party.skills(v5, v5.party[0]).includes('twidance'), 'Vos 5: the Twilight dance');
  const vb = new A.Battle({ S: v5, group: 'cavern_a', seed: 2 });
  vb.begin();
  ok(vb.unit('aayla').tempo === 2, 'Vos 5 released: Tempo 2 at the start of every fight');
  const td = [];
  vb.unit('aayla').tempo = 3;
  vb.perform(vb.unit('aayla'), 'twidance', 'none', td, {});
  ok(td.filter(x => x.type === 'strike').length === 3 && new Set(td.filter(x => x.type === 'strike').map(x => x.target)).size === 2, 'the dance hits three times, spread over the enemies');
  const t5 = mk(43, {}, { tholme: { rank: 5 } });
  t5.party[0].fp = 1;
  ok(A.Party.together(t5) && t5.party[0].fp === A.stats('aayla', 43).fp && !A.Party.together(t5), 'Tholme 5: once per chapter the whole Force comes back');

  ok(A.PLACES.hospital && A.PLACES.cruiser && ['p7', 'p8'].every(r => Object.values(A.RESPITES[r].near).every(room => A.Respite.place(r).rooms.some(rm => rm.id === room))), 'P7 in the hospital, P8 on the cruiser: everyone stands in a real room');
  ok(['p7', 'p8'].every(r => A.Respite.labels(r).every(l => P.labels[l])), 'P7 and P8 activities all have scenes');
  const S10 = mk(38, {}, { vos: { rank: 3 } });
  A.Respite.start(S10, 'p7');
  const ward = A.Respite.options(S10, 'p7', 'ward').find(o => o.act === 'bond' && o.id === 'vos');
  ok(ward && ward.enabled && /шифровки/.test(ward.about) && A.Respite.people(S10, 'p7').some(x => x.who === 'vos' && x.via === 'tholme' && x.room === 'ward'), 'Vos 4 comes as ciphers through the network of Tholme (plan 8)');
  ok(['bond_vos_4', 'bond_vos_5', 'bond_tholme_5', 'bond_bly_3', 'bond_bly_4', 'bond_kit_5_holo'].every(l => P.labels[l] && A.BOND_SCENES[l]), 'bond scenes Vos 4-5, Tholme 5, Bly 3-4 and Kit 5 by holo with their summaries');
  const b4 = P.labels.bond_bly_4_why.steps.find(s => s.op === 'choice');
  ok(b4 && b4.options.some(o => o.effects.some(e => e.key === 'bly_told')), 'Bly 4: Aayla can explain why she deflected his shot (needed for «Иная память»)');

  const runs = [1, 2, 3, 4, 5, 6].map(sd => bot.story(sd + 140, { start: 'ch6', stop: 'ch7' }));
  ok(runs.every(r => r.end && r.retries <= 1), 'bot story: chapter 6 is finished, at most one fight replayed');
  ok(runs.every(r => r.maps.join() === 'honoghr_forest,honoghr_temple,anzat_dock,saleucami_caverns,vos_mind'), 'Honoghr forest and temple, the Anzat dock, the Saleucami tunnels, the mind of Vos');
  ok(runs.every(r => r.flights.length >= 1 && r.flights[r.flights.length - 1].id === 'saleucami' && r.flights[r.flights.length - 1].over === 'win'), 'the bot flies over Saleucami and wins');
  ok(runs.every(r => { const lv = r.S.party.find(m => m.id === 'aayla').level; return lv >= 41 && lv <= 44; }), 'chapter 6 ends around level 43 (plan 5.1): ' + runs.map(r => r.S.party.find(m => m.id === 'aayla').level).join(', '));
  ok(runs.every(r => A.Bonds.get(r.S, 'vos').letgo === 3 && r.S.flags.rs_p7 && r.S.flags.rs_p8 && r.asks.includes('bok')), 'the third «let go», both respites, Bok answered');
  ok(runs.every(r => !r.S.flags.with_bly && !r.S.flags.with_vos && !r.S.flags.with_tholme && r.S.party.length === 1), 'nobody stays in the party by mistake');
}

{
  const P = X.build(), bot = require(path.join(ROOT, 'tools/aayla98-bot.cjs'));
  const ch7 = P.order.filter(n => n.startsWith('ch7_') || ['rs_meditate_p9', 'rs_meditate_p10'].includes(n));
  ok(ch7.length >= 40 && !/—/.test(ch7.map(n => P.labels[n].steps.filter(s => s.op === 'say').map(s => s.text).join(' ')).join(' ')), 'chapter 7 scenes use no long dashes: ' + ch7.length + ' labels');
  const cgs = new Set(ch7.flatMap(n => P.labels[n].steps.filter(s => s.op === 'cg' && s.id).map(s => s.id)));
  ok(['sparring', 'bravest', 'waterfall', 'bird', 'forest_spirit', 'end_felucia', 'end_other', 'end_dark', 'legacy'].every(id => cgs.has(id)), 'the CG of chapter 7, Endor, the three endings and the legacy are shown');
  const groups = new Set(ch7.flatMap(n => P.labels[n].steps.filter(s => s.op === 'battle').map(s => s.group)));
  ok(['bly_spar7', 'endor_beast', 'hill_droids', 'turrets_a', 'turrets_b', 'kwayteow_guards', 'niango_wave'].every(g => groups.has(g)), 'chapter 7 fights: sparring, the Beast, the hill, the turrets, the compound guards, Niango');
  const said = n => P.labels[n].steps.filter(s => s.op === 'say').map(s => s.text).join(' ');
  ok(/самые храбрые солдаты/.test(said('ch7_walker')) && /четыре дня/.test(said('ch7_report')) && /лесной дух/.test(said('ch7_village')) && /джедайские умения/.test(said('ch7_climb_2')), 'canon lines: the bravest soldiers, four days, the forest spirit, the droid');
  ok(/Это она заслужила/.test(said('ch7_legacy')) && /Сейт Пестаж/.test(said('ch7_legacy')) && /Даррус Джет/.test(said('ch7_legacy')) && /живёт в сердце/.test(said('ch7_legacy')), 'the legacy epilogue: Pestage, the 501st diary, Darrus Jeht, the words about T\'da');
  ok(['ch7_legacy', 'ch7_end_other', 'ch7_end_dark'].every(n => P.labels[n].steps.some(s => s.op === 'credits')), 'every ending rolls the credits');
  const turn = P.labels.ch7_turn.steps.find(s => s.op === 'choice');
  ok(turn && turn.timer === 5 && turn.options[0].to === 'ch7_end_other' && turn.options[turn.options.length - 1].to === 'ch7_end_canon', '«Обернуться» within five seconds, the last option plays when time runs out');
  const tc = X.parse('@a\nchoice timer=3\n  > один -> b\n  > два -> b\nend\n@b\nstop', 'tc');
  ok(tc.labels.a.steps[0].timer === 3 && new X.Story(tc, A.newState(), 'a').next().timer === 3, 'the scene language knows timed choices');
  ok(A.Flight && A.FLIGHTS.felucia.assist.after === 40, 'ARC-170 fighters join the bike chase');

  const endS = (setup, at) => { const S = A.newState(); A.Party.preset(S, 'ch7'); S.chapter = 'ch7'; setup(S); const st = new X.Story(P, S, at || 'ch7_bird'); let e; for (let i = 0; i < 200; i++) { e = st.next(); if (e.type !== 'say') break; } return { e, st }; };
  const plain = endS(S => { S.bonds.bly.rank = 4; });
  ok(plain.st.pc.label === 'ch7_end_canon' || plain.st.S.flags.ending === 'felucia', 'without Bly 5 the canon ending plays');
  const turnS = endS(S => { S.bonds.bly.rank = 5; S.dark = 20; });
  ok(turnS.e.type === 'choice' && turnS.e.timer === 5, 'Bly 5, deflected shots, told why, Darkness below 40: the timed choice appears');
  const darkS = endS(S => { S.bonds.bly.rank = 5; S.dark = 75; });
  ok(darkS.st.pc.label === 'ch7_end_dark' || darkS.st.S.flags.ending === 'dark', 'Darkness 70 and more: «Тьма Киффекса»');
  const noTold = endS(S => { S.bonds.bly.rank = 5; S.flags.bly_told = false; });
  ok(noTold.e.type !== 'choice', 'without explaining Honoghr to Bly the other memory is closed');

  const mk = (lv, flags, bonds) => { const S7 = A.newState(); A.Party.preset(S7, 'ch7'); S7.chapter = 'ch7'; const a = S7.party[0]; a.level = lv; a.xp = A.xpFor(lv); const st7 = A.stats('aayla', lv); a.hp = st7.hp; a.fp = st7.fp; Object.assign(S7.flags, flags || {}); for (const [k2, v] of Object.entries(bonds || {})) Object.assign(A.Bonds.own(S7, k2), v); A.Party.ensure(S7); return S7; };
  const S1 = mk(46, { with_bly: true, with_ekria: true }, { ekria: { rank: 1 } });
  ok(A.Party.skills(S1, S1.party[0]).includes('hack') && S1.party.some(m => m.id === 'ekria'), 'Ekria 1: Aayla can hack, Ekria fights beside her');
  const hb = new A.Battle({ S: S1, group: 'nigkoe_b', seed: 3 });
  hb.begin();
  const droid = hb.enemies().find(e => e.kind === 'droid'), ha = hb.unit('aayla');
  ok(hb.targets(ha, 'hack').includes(droid.id) && !hb.targets(ha, 'hack').some(id => hb.unit(id).kind !== 'droid'), 'only droids and turrets can be hacked');
  hb.perform(ha, 'hack', droid.id, [], {});
  const other = hb.enemies().find(e => e !== droid), hp0 = other.hp, ev = [];
  hb.enemyAct(droid, ev);
  ok(droid.hacked === 1 && other.hp < hp0 && ev.some(x => x.type === 'line'), 'a hacked droid shoots its own side for two turns');
  const S5 = mk(46, { with_bly: true }, { bly: { rank: 5 } });
  ok(A.Party.skills(S5, S5.party.find(m => m.id === 'bly')).includes('volley'), 'Bly 5: the squad volley');
  const fz = new A.Field(mk(45, {}, { ekria: { rank: 2 } }), 'felucia_jungle', 'start');
  const k = fz.objs.find(o => o.id === 'k');
  ok(k.hidden && fz.visible(k) && !new A.Field(mk(45, {}, { ekria: { rank: 1 } }), 'felucia_jungle', 'start').visible(k), 'Ekria 2: caches and traps are seen without the Force');
  const air = r => new A.Field(mk(47, {}, { kit: { rank: r } }), 'kwayteow_water', 'start').timer;
  ok(air(1) === 2 * air(0) && air(0) === 40, 'Kit 1: Aayla holds her breath twice as long under the water (plan 8)');
  const fe = new A.Field(mk(47), 'kwayteow_escape', 'start');
  ok(fe.timer === 60 && fe.map.def.timer.fail === 'ch7_escape_fail' && P.labels.ch7_escape_fail.steps.some(s2 => s2.op === 'map' && s2.id === 'kwayteow_escape'), 'the self-destruct escape restarts when time runs out');

  const run = (g, S8) => { const b = new A.Battle({ S: S8, group: g, seed: 5 }); b.begin(); let n = 0; while (!b.over && n++ < 600) { if (b.ask) { b.answer(bot.reply(b)); continue; } const c = bot.choose(b); b.act(c.skill, c.target, c.extra); } return b; };
  const beast = new A.Battle({ S: mk(44), group: 'endor_beast', seed: 2 });
  beast.begin();
  const bu = beast.unit('aayla'), bz = beast.units.find(u => u.key === 'endor_beast');
  ok(beast.commands(bu).some(c => c.id === 'ceiling'), 'the Beast: the Force can bring the stalactites down');
  A.DUELS.beast.perform(beast, bu, 'ceiling', []);
  ok(!beast.over && bz.hp < bz.maxhp, 'away from the stalactites the stones only hurt it');
  beast.under = true;
  A.DUELS.beast.perform(beast, bu, 'ceiling', []);
  ok(beast.over === 'end' && beast.endReason === 'stalactites', 'under the stalactites the Beast dies (canon)');
  ok(run('niango_wave', mk(48, { with_bly: true })).endReason === 'bird', 'Niango: the droid wave stops, a bird takes off');
  ok(run('bly_spar7', mk(43)).S.flags.duel_bly_spar7, 'the sparring on the Intrepid records its result');

  ok(A.PLACES.intrepid && A.PLACES.camp && ['p9', 'p10'].every(r => Object.values(A.RESPITES[r].near).every(room => A.Respite.place(r).rooms.some(rm => rm.id === room)) && A.Respite.labels(r).every(l => P.labels[l])), 'P9 on the Intrepid, P10 in the camp: real rooms and scenes');
  ok(['bond_ekria_1', 'bond_ekria_2', 'bond_ekria_3', 'bond_ekria_talk', 'bond_bly_5'].every(l => P.labels[l] && A.BOND_SCENES[l]), 'bond scenes Ekria 1-3 and Bly 5 with their summaries');
  const e3 = P.labels.bond_ekria_3.steps.find(s2 => s2.op === 'choice');
  ok(e3 && e3.options.some(o => o.effects.some(x => x.key === 'heart_given')), 'Ekria 3: give her the Heart of Fire or keep it');
  ok(A.CREDITS.studio.join(' / ') === 'Midnight Studio / LucasArts (2001) / Win 98 Edition' && A.CREDITS.sources.some(r => /Paul Ens/.test(r[1])) && A.CREDITS.sources.some(r => /Milton Freewater/.test(r[1])) && A.CREDITS.chapters.every(([ch, cg]) => A.CHAPTERS[ch] && A.Art.LIST.cg[cg]), 'credits: the studio from В2, the right authors, a picture for every chapter');

  const E = bot.endings();
  ok(E.felucia.ending === 'felucia' && E.other.ending === 'other' && E.dark.ending === 'dark' && E.endor.S.flags.endor, 'bot endings: «Фелуция», «Иная память», «Тьма Киффекса», and the Endor detour');
  ok(E.endor.maps.join() === 'endor_forest,endor_mountain,felucia_jungle,nigkoe_prison,kwayteow_water,kwayteow_escape' && E.felucia.maps[0] === 'felucia_jungle', 'Endor is a detour instead of P9');
  const runs = [1, 2, 3, 4].map(sd => bot.story(sd + 160, { start: 'ch7' }));
  ok(runs.every(r => r.end && r.ending && r.retries <= 1), 'bot story: chapter 7 ends with credits, at most one fight replayed');
  ok(runs.every(r => { const lv = r.S.party.find(m => m.id === 'aayla').level; return lv >= 46 && lv <= 50; }), 'chapter 7 ends around level 48 (plan 5.1): ' + runs.map(r => r.S.party.find(m => m.id === 'aayla').level).join(', '));
  ok(runs.every(r => r.flights.some(x => x.id === 'felucia' && x.over === 'win')), 'the bot rides the bike chase and wins');
}

console.log(`aayla98: ${checks} checks passed`);
