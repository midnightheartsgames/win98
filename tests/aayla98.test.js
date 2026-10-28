const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = 'js/apps/aayla98';
const ORDER = ['ay-core', 'ay-data', 'ay-script', 'ay-ch0', 'ay-maps', 'ay-files', 'ay-art', 'ay-pix', 'ay-field', 'ay-battle', 'ay-font', 'ay-gfx', 'ay-audio', 'ay-vn', 'ay-draw-field', 'ay-draw-battle', 'ay-screens', 'ay-ui'];
const NODE = ['ay-core', 'ay-data', 'ay-script', 'ay-ch0', 'ay-maps', 'ay-files', 'ay-art', 'ay-pix', 'ay-field', 'ay-battle', 'ay-font'];
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
const ctx = starts => ({ cast: A.CAST, art: A.Art.LIST, music: A.MUSIC, lekku: A.LEKKU, maps: A.Maps.DEFS, starts, fits });

{
  ok(JSON.stringify(X.parseEffects('dose+1 doubt-15 tone=joke seen !gone bond.vos+2')) === JSON.stringify([
    { key: 'dose', op: '+', v: 1 }, { key: 'doubt', op: '-', v: 15 }, { key: 'tone', op: '=', v: 'joke' },
    { key: 'seen', op: '=', v: true }, { key: 'gone', op: '=', v: false }, { key: 'bond.vos', op: '+', v: 2 }]), 'effects parse');
  const S = A.newState();
  X.apply(S, X.parseEffects('dark+120 restraint=7 bond.vos+2 bond.bly-3 dose+1 dose+1'));
  ok(S.dark === 100 && S.restraint === 3 && S.bonds.vos === 2 && S.bonds.bly === 0 && S.flags.dose === 2, 'effects clamp Darkness 0..100, restraint 0..3, bonds at 0 and above');
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
  const sc = A.Scripts.pro, P = X.parse(sc.src, sc.file);
  const mapLabels = [...new Set(Object.values(A.Maps.DEFS).flatMap(d => Object.values(d.props).filter(q => q.label).map(q => q.label)))];
  ok(mapLabels.length >= 3 && mapLabels.every(l => P.labels[l]), 'every scene a map opens exists in the prologue: ' + mapLabels.join(', '));
  const errs = X.check(P, Object.assign(ctx([sc.start, ...mapLabels]), { groups: A.GROUPS }));
  ok(errs.length === 0, 'prologue scenes pass the checks: ' + errs.join(' | '));
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
      if (e.type === 'map' || e.type === 'field' || e.type === 'end') { endings.push({ from, path, flags: { ...S.flags }, bonds: { ...S.bonds }, vn: lastVn, last: e, events }); return; }
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
  ok(P.order.every(n => visited.has(n)), 'every label of the prologue is played on some path');
  const garden = endings.filter(e => e.from === sc.start);
  ok(garden.length === 12, 'the garden has 12 paths (2 answers x 2 lekku x 3 farewells), got ' + garden.length);
  ok(garden.every(e => ['keep', 'fear', 'joke'].includes(e.flags.xiaan_tone)), 'every path records what Aayla told Xiaan');
  ok(garden.some(e => e.flags.lekku_tell) && garden.some(e => e.flags.lekku_read && !e.flags.lekku_tell) && garden.some(e => !e.flags.lekku_read), 'the tutorial shows all three lekku outcomes');
  ok(garden.every(e => e.vn.busts.vos && e.vn.busts.aayla && !e.vn.cg), 'the arrival ends with Vos and Aayla on screen and the CG closed');
  ok(garden.every(e => e.last.type === 'map' && e.last.id === 'lessu_market' && e.last.at === 'start'), 'the garden and the arrival hand over to the Lessu market map');
  const pol = endings.filter(e => e.from === 'pro_warehouse');
  ok(pol.length === 6 && pol.every(e => e.last.type === 'map' && e.last.id === 'ryll_mine'), 'the warehouse leads through the reception at Pol to the mine on 6 paths');
  ok(['polite', 'cold', 'father'].every(t => pol.some(e => e.flags.pol_tone === t)), 'the reception records the tone for chapter 1');
  ok(pol.every(e => (e.bonds.secura || 0) === { polite: 1, cold: 0, father: 2 }[e.flags.pol_tone]), 'the tone gives the first points of the Secura clan bond');
  ok(pol.some(e => e.flags.pol_tone === 'polite' && e.flags.lekku_read) && pol.some(e => e.flags.pol_tone === 'polite' && !e.flags.lekku_read), 'Pol sees through a polite lie only when her lekku give it away');
  const met = endings.filter(e => e.from === 'pro_asante');
  ok(met.length === 2 && met.every(e => e.last.type === 'field' && e.flags.asante_joined), 'meeting Asante returns to the mine with her in the party');
  const lair = endings.filter(e => e.from === 'pro_lair');
  ok(lair.length === 1 && lair[0].last.type === 'end', 'the lair scene ends the prologue');
  ok(lair[0].events.map(e => e.type).join() === 'battle,forget' && lair[0].events[0].group === 'spider_boss', 'the lair runs the boss fight, then Aayla forgets');
  const ids = [];
  for (const n of P.order) for (const s of P.labels[n].steps) {
    if (s.op === 'say') ids.push(s.id);
    if (s.op === 'choice') s.options.forEach(o => ids.push(o.id));
  }
  ok(ids.length === new Set(ids).size && ids.every(id => /^[a-z][a-z0-9_]*\.\d+$/.test(id)), 'every line and answer has its own id for a later translation');
  const all = P.order.map(n => P.labels[n].steps.filter(s => s.op === 'say').map(s => s.text).join(' ')).join(' ');
  ok(all.includes('Сердце огня') && all.includes('Каждый день понемногу'), 'the prologue names the Heart of Fire and ends on Pol: every day a little');
  ok(!/—/.test(P.order.filter(n => n !== sc.start).map(n => P.labels[n].steps.filter(s => s.op === 'say').map(s => s.text).join(' ')).join(' ')), 'new prologue scenes use no long dashes');
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
  ok(Object.keys(L.still).length === 12, '12 memory pictures (plan 7.8)');
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
  ok(grids.every(g => g.every(r => r.length === 16 && /^[.osSctCbehm]+$/.test(r))), 'field grids are 16 wide and use known palette letters');
  for (const [id, look] of Object.entries(Pix.LOOKS)) {
    ok((!look.who || A.CAST[look.who]) && Pix.GRIDS.HEADS[look.kind], 'look has a known character and a head: ' + id);
    const used = new Set([...Object.values(G.HEADS[look.kind]).flat(), ...G.TORSO_FRONT, ...G.TORSO_SIDE, ...Object.values(G.LEGS).flat()].join('').replace(/\./g, ''));
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
      if (o.lines) for (const [who, text] of o.lines) ok((who === 'npc' || who === '-' || A.CAST[who]) && fits(text), `map ${id}: line of ${o.id} has a speaker and fits the box`);
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
      ok(e.kind === 'beast' || A.NRAV[e.nrav], 'sentient enemies have a temper: ' + id);
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
  ok(b.unit('aayla').skills.length === 0, 'a battle uses the moves she has, not the full list');
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
  const runs = Array.from({ length: 12 }, (_, i) => bot.story(i + 1));
  ok(runs.every(r => r.end), 'bot story: every run reaches the title of the game');
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

console.log(`aayla98: ${checks} checks passed`);
