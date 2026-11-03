'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const L = require('./hsr-luofu-import.cjs');

const ROOT = path.join(__dirname, '..');
const EXTRACT = path.join(ROOT, 'content/hsr-pf/extract.json');
const VERSIONS = ['1.6', '2.0', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '3.0', '3.1', '3.2', '4.3'];
const TUTORIALS = ['Pure Fiction', 'Relentless Adversaries', 'Pure Fiction: Starward Mode'];
const NPCS = ['Youci', 'Yinshu', 'Mr. Xiyan'];
const MISSION = "Youci's Clever Decor";
const THREAD = ['Messages/Mr. Xiyan', '(Mr./Ms.) (Trailblazer), I recently...'];
const PAGES = [
  'Pure Fiction', 'Pure Fiction/Stages', 'Pure Fiction/Rewards', MISSION, THREAD[0], 'Spare Time Book Shop', 'Otherworldly Delights', 'Jade Feather', 'History Fictionologists', 'Map:Exalting Sanctum',
  ...VERSIONS.map(v => 'Pure Fiction/Stages/' + v), ...TUTORIALS.map(t => 'Tutorial/' + t), ...NPCS
];
const IMAGES = [
  'NPC Yinshu.png', 'NPC Youci.png', 'Shop Spare Time Book Shop.png', 'Location Context Game System Pure Fiction.png', 'Map Exalting Sanctum.png', 'Icon Map Pure Fiction.png',
  'Tutorial Pure Fiction 1.png', 'Tutorial Pure Fiction 2.png', 'Tutorial Relentless adversaries 1.png', 'Tutorial Relentless adversaries 2.png', 'Tutorial Battle Relentless Adversaries 1.png', 'Tutorial Battle Relentless Adversaries 2.png',
  'Deceitful Chaos.png', 'Tales of a Tethered Bird.png', "Youci's Clever Decor Feather.png"
];
const TERMS = [
  'Pure Fiction', 'Whimsicality', 'Cacophony', 'Grit Value', 'Grit Mechanics', 'Surging Grit', 'Concordant Truce', "Fate's Convergence", 'Binding Obligation', 'Fictional Ensemble', 'Eloquence', 'Shatter',
  'Team Lineup', 'Character Catalog', 'Preset Lineup', 'Clearance Lineup', 'Character Lineup', 'Enter Story', 'Character Details', 'Clear Target', 'Star Target', 'Equip Effect', 'Story Rewards', 'Falsehood Rewards',
  'Enemy Lineup', 'Rules', 'Tutorial', 'Node 1', 'Node 2', 'Score', 'Points', 'Total Score', 'Highest Score', 'Best Score', 'Current Score', 'Retreat', 'Restart', 'Exit Stage', 'Remaining Cycles', 'Current Progress',
  'Relentless Adversaries', 'Lordly Trashcan', 'Sequence Trotter', 'Furbo Journalist', 'Yinshu', 'Shopkeeping Kid', 'Youci', 'Mr. Xiyan', 'Bookshop Customer', 'Spare Time Book Shop', 'Priceless Jewels', 'Jokes Come True', 'Light Cone Manifest',
  'Starward Mode', 'Good Friend of Pirate', 'History Fictionologists', 'Mythus', 'Enigmata', 'Treasures Lightward', 'Interastral Peace Guide', 'Otherworldly Delights', 'New Pure Fiction activated', 'Pure Fiction Reward', 'Go to Pure Fiction', 'Return to Pure Fiction', 'Pure Fiction has been updated', "Limited-Time Clearance Medal of Pure Fiction"
];
const NO_TERM = ['Resounding Tide', 'Recommended Type', 'Story Stars'];
const UI = [
  'End challenge and return to Pure Fiction? Terminating the challenge will prevent points for this battle from being calculated.',
  'Complete the mission "Youci\'s Clever Decor" to unlock Pure Fiction',
  'Select buff effects and install them into the Cacophony',
  'Buffs available for this Cacophony phase',
  'Cacophony offers battle buffs. Choose one to use in battle.',
  'Go to Cacophony and equip suitable combat buffs for your team.',
  'Each period is updated with a unique Whimsicality, and there will be different stage effects during combat.',
  'Each period also provides a variety of Cacophony effects. Choose one before combat begins to provide a combat buff.',
  'Activate Grit Mechanics in battle to accumulate Grit Value and enter the Surging Grit phase after accumulating it to full.',
  'The highest Pure Fiction stage that you passed with 3-stars will be recorded. Whenever a new period starts, the recorded stage and all prior stages will be immediately unlocked according to your past performance. No more than the first 3 stages can be immediately unlocked in this way.',
  'Obtain a total of 6 stars from clearing Pure Fiction stages'
];
const STEP_RU = { 'Receive a message from Mr. Xiyan': 'Получите сообщение от господина Сияня' };
const EFFECT_RU = { 'When allies use an Ultimate to attack enemy targets, additionally inflicts 1 stack of Shatter to the target.': 'Когда союзник использует сверхспособность для атаки противника, цель дополнительно получает 1 ур. статуса Раскол.' };
const PLACEHOLDER = /#\d+\[[a-z0-9]+\]%?/gi;
const stripped = s => L.norm(s.replace(/<[^>]*>/g, '').replace(PLACEHOLDER, ' ').replace(/\d+(?:\.\d+)?%?/g, ' '));
const wait = ms => new Promise(r => setTimeout(r, ms));
const readPage = (cache, title) => { const f = L.pageFile(cache, title); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null; };
const docRu = s => L.ruText(s.replace(/\\n/g, '\u0001')).replace(/\s*\u0001\s*/g, '\n').trim();

async function fetchImages(cache) {
  const dir = path.join(cache, 'img');
  fs.mkdirSync(dir, { recursive: true });
  const titles = IMAGES.map(n => 'File:' + n).join('|');
  const pages = Object.values(JSON.parse(await L.get(L.IMAGE_API + encodeURIComponent(titles))).query.pages);
  for (const p of pages) {
    if (!p.imageinfo) { console.log('no image', p.title); continue; }
    const file = path.join(dir, p.title.slice(5).replace(/ /g, '_').replace(/'/g, ''));
    if (fs.existsSync(file)) continue;
    const url = p.imageinfo[0].url.split('/revision/')[0] + '/revision/latest/scale-to-width-down/640?cb=1';
    execFileSync('curl', ['-s', '-m', '90', '-L', '-A', L.UA, '-H', 'Accept: image/*', '-e', 'https://honkai-star-rail.fandom.com/', '-o', file, url]);
    console.log('fetched', p.title);
    await wait(120);
  }
}

async function fetchAll(cache) {
  fs.mkdirSync(path.join(cache, 'pages'), { recursive: true });
  fs.mkdirSync(path.join(cache, 'textmap'), { recursive: true });
  for (const t of PAGES) await L.fetchPage(cache, t);
  for (const f of L.TEXT_FILES) {
    const file = path.join(cache, 'textmap', f);
    if (fs.existsSync(file)) continue;
    fs.writeFileSync(file, await L.get(L.TEXTMAP + f));
    console.log('fetched', f);
  }
  await fetchImages(cache);
}

function makeParams(text) {
  const map = new Map();
  for (const [hash, en] of Object.entries(text.en)) {
    if (!text.ru[hash] || !en.includes('#') || !/#\d+\[/.test(en)) continue;
    const key = stripped(en);
    if (key && !map.has(key)) map.set(key, hash);
  }
  return map;
}

function fillParams(template, ru, en) {
  const tokens = [...template.replace(/<[^>]*>/g, '').matchAll(/#(\d+)\[[a-z0-9]+\]%?|\d+(?:\.\d+)?%?/gi)];
  const nums = [...en.matchAll(/\d+(?:\.\d+)?%?/g)].map(m => m[0]);
  if (tokens.length !== nums.length) return null;
  const vals = {};
  tokens.forEach((t, i) => { if (t[1]) vals[t[1]] = nums[i].replace('%', ''); });
  const out = ru.replace(/#(\d+)\[[a-z0-9]+\]/gi, (m, k) => (k in vals ? vals[k] : m));
  return /#\d/.test(out) ? null : out;
}

function effectPart(ctx, en) {
  if (EFFECT_RU[en]) return EFFECT_RU[en];
  const hit = L.lookup(ctx.ix, en);
  if (hit && !hit.fuzzy && !/#\d/.test(hit.ru)) return hit.ru;
  const key = stripped(en);
  const hash = ctx.params.get(key) || nearestParam(ctx, key);
  if (hash) {
    const filled = fillParams(ctx.ix.text.en[hash], L.ruText(ctx.ix.text.ru[hash]), en);
    if (filled) return filled;
  }
  return hit && !/#\d/.test(hit.ru) ? hit.ru : null;
}

function nearestParam(ctx, key) {
  let best = null, score = 0.78;
  for (const [cand, hash] of ctx.params) {
    if (Math.abs(cand.length - key.length) > key.length * 0.3) continue;
    const d = L.dice(key, cand);
    if (d > score) { score = d; best = hash; }
  }
  return best;
}

function effect(ctx, raw) {
  const en = L.clean(raw), out = { en };
  const ru = en.split(' / ').map(s => s.trim()).filter(Boolean).map(s => effectPart(ctx, s));
  if (ru.length && ru.every(Boolean)) out.ru = ru.join('\n');
  return out;
}

const rawField = (block, key) => { const m = new RegExp('^\\|' + key + '\\s*=[ \\t]*(.*)$', 'm').exec(block); return m ? m[1].trim() : ''; };

function readFoes(ctx, raw) {
  const out = [];
  for (const m of raw.matchAll(/([^,{]+)\{([^}]*)\}/g)) {
    const en = m[1].trim(), row = { en, ru: L.nameRu(ctx.ix, en) };
    for (const prop of m[2].split('$')) {
      const [k, v] = prop.split('=').map(s => s.trim());
      if (k === 'text') row.n = +v;
      else if (k === 'weakness') row.weak = v.split(';').map(s => s.trim());
    }
    out.push(row);
  }
  return out;
}

function readStage(ctx, n, block) {
  const nodes = [];
  for (let t = 1; t <= 3; t++) {
    if (!rawField(block, 't' + t + 'w1')) continue;
    const waves = [];
    for (let w = 1; rawField(block, 't' + t + 'w' + w); w++) waves.push({ max: +rawField(block, 't' + t + 'w' + w + 'max'), foes: readFoes(ctx, rawField(block, 't' + t + 'w' + w)) });
    nodes.push({ rec: rawField(block, 'rtype' + t).split(',').map(s => s.trim()).filter(Boolean), waves });
  }
  const note = rawField(block, 'enemynote');
  const stage = { n, lvl: +rawField(block, 'enemylv'), cycles: rawField(block, 'maxcycle').split('+').map(s => +s.trim()), targets: rawField(block, 'obj').split(';').map(s => s.trim()), nodes };
  if (note) stage.note = L.clean(note.replace(/<ref[^>]*>/g, ' ').replace(/<\/ref>/g, ' '));
  return stage;
}

function readWhim(ctx, block) {
  const named = (name, eff) => ({ name: { en: L.clean(name), ru: L.nameRu(ctx.ix, L.clean(name)) }, eff: effect(ctx, eff) });
  const whim = [];
  for (const suf of ['', '2', '3']) if (rawField(block, 'whim_name' + suf)) whim.push(named(rawField(block, 'whim_name' + suf), rawField(block, 'whim_eff' + suf)));
  const caco = [];
  for (let i = 1; rawField(block, 'caco_name' + i); i++) caco.push(named(rawField(block, 'caco_name' + i), rawField(block, 'caco_eff' + i)));
  return { whim, caco, time: [rawField(block, 'time_start'), rawField(block, 'time_end')] };
}

function readVersion(ctx, version, text) {
  const ruNames = {};
  for (const m of text.matchAll(/^\|(?:(\d+)_)?ru\s*=\s*(.+)$/gm)) ruNames[m[1] || '1'] = L.clean(m[2]);
  const parts = text.split(/^==([^=].*?)==\s*$/m), out = [];
  for (let i = 1, k = 1; i < parts.length; i += 2) {
    const title = parts[i].trim(), body = parts[i + 1];
    if (!/\{\{Whimsicality/.test(body)) continue;
    const at = body.indexOf('{{Whimsicality'), end = body.indexOf('\n}}', at);
    const season = Object.assign({ version, en: title, ru: ruNames[String(k)] || L.nameRu(ctx.ix, title) }, readWhim(ctx, body.slice(at, end)), { gen: rawField(body, 'whim_name2') ? 2 : 1, stages: [] });
    const stages = body.split(/^={3,4}\s*Stage\s*(\d+)\s*={3,4}\s*$/m);
    for (let s = 1; s < stages.length; s += 2) season.stages.push(readStage(ctx, +stages[s], stages[s + 1]));
    out.push(season);
    k++;
  }
  return out;
}

function readThread(ctx, cache) {
  const text = readPage(cache, THREAD[0]), sign = rawField(text, 'signature');
  const wanted = L.norm(L.clean(THREAD[1])), parts = text.split(/^===\s*(.*?)\s*===\s*$/m), rows = [];
  for (let i = 1; i < parts.length; i += 2) {
    if (L.norm(L.clean(parts[i])) !== wanted) continue;
    for (const line of parts[i + 1].split('\n')) {
      const depth = /^[:;]*/.exec(line)[0].length, rest = line.slice(depth).trim();
      const choice = /^\{Choice\}\s*(.*)$/.exec(rest), quest = /^\{Accepted Mission:\s*(.*)\}$/.exec(rest), say = /^'''(.+?):?'''\s*:?\s*(.*)$/.exec(rest);
      if (choice) rows.push(Object.assign({ t: 'choice', d: depth }, L.pair(ctx.ix, choice[1])));
      else if (quest) rows.push({ t: 'quest', en: quest[1] });
      else if (say) rows.push(Object.assign({ t: 'say', d: depth, who: L.clean(say[1]).replace(/:$/, '') }, L.pair(ctx.ix, say[2])));
    }
  }
  return { title: L.pair(ctx.ix, THREAD[1]), sign: L.pair(ctx.ix, sign), rows };
}

function readNpc(ctx, cache, title) {
  const text = readPage(cache, title), items = [], voice = [];
  L.dialogue(ctx.ix, cache, L.section(text, 'Dialogue'), items);
  L.dialogue(ctx.ix, cache, L.section(text, 'Voice Lines'), voice);
  return { en: title, ru: L.nameRu(ctx.ix, title), items, voice };
}

function findDoc(ctx, start) {
  const key = L.norm(start);
  for (const [hash, en] of Object.entries(ctx.ix.text.en)) if (ctx.ix.text.ru[hash] && L.norm(en).startsWith(key)) return docRu(ctx.ix.text.ru[hash]);
  return null;
}

function readRules(ctx) {
  const out = {};
  for (const [hash, en] of Object.entries(ctx.ix.text.en)) {
    if (!ctx.ix.text.ru[hash]) continue;
    if (en.startsWith('◆ Pure Fiction ◆')) out[/Grit/.test(en) ? 'gen2' : 'gen1'] = docRu(ctx.ix.text.ru[hash]);
    else if (en.startsWith('◆ New Content ◆') && /Starward Mode/.test(en) && /Pure Fiction/.test(en)) out.starward = docRu(ctx.ix.text.ru[hash]);
  }
  return out;
}

function readMarkers(cache) {
  const data = JSON.parse(readPage(cache, 'Map:Exalting Sanctum'));
  const keep = /Youci|Yinshu|Pure Fiction|Spare Time/;
  return { image: data.mapImage, bounds: data.mapBounds, markers: data.markers.filter(m => m.popup && keep.test(m.popup.title || '')).map(m => ({ t: m.popup.title, x: Math.round(m.position[0]), y: Math.round(m.position[1]) })) };
}

function extract(cache) {
  const text = L.loadText(cache), ix = L.makeIndex(text), ctx = { ix, params: makeParams(text) };
  const out = { source: 'fandom Honkai: Star Rail Wiki (api.php), Dimbreath/turnbasedgamedata TextMap' };
  const main = readPage(cache, 'Pure Fiction'), quote = /\{\{Description\|([\s\S]*?)\}\}/.exec(main);
  out.quote = L.pair(ix, quote[1].replace(/&mdash;/g, '—'));
  out.rules = readRules(ctx);
  out.terms = Object.fromEntries(TERMS.concat(NO_TERM).map(t => [t, L.nameRu(ix, t)]));
  out.ui = UI.map(s => L.pair(ix, s));
  out.tutorials = Object.fromEntries(TUTORIALS.map(t => [t, L.readTutorial(ix, cache, t)]));
  out.seasons = VERSIONS.flatMap(v => readVersion(ctx, v, readPage(cache, 'Pure Fiction/Stages/' + v)));
  out.mission = L.readMission(ix, cache, MISSION, 'adv', null);
  for (const s of out.mission.steps) if (!s.ru && STEP_RU[s.en]) s.ru = STEP_RU[s.en];
  out.thread = readThread(ctx, cache);
  out.npcs = Object.fromEntries(NPCS.map(n => [n, readNpc(ctx, cache, n)]));
  const feather = readPage(cache, 'Jade Feather'), lore = /\{\{Description\|([\s\S]*?)\}\}/.exec(feather);
  out.feather = { desc: L.pair(ix, rawField(feather, 'description')), lore: L.pair(ix, lore[1]) };
  const book = L.section(readPage(cache, 'Otherworldly Delights'), 'Text').split(/\n\s*\n/).map(s => L.clean(s)).filter(Boolean);
  out.book = { en: 'Otherworldly Delights', ru: L.nameRu(ix, 'Otherworldly Delights'), textEn: book, textRu: findDoc(ctx, book[0].slice(0, 80)) };
  out.shop = { desc: L.pair(ix, /\{\{Description\|([\s\S]*?)\}\}/.exec(readPage(cache, 'Spare Time Book Shop'))[1]), map: readMarkers(cache) };
  out.rewards = L.section(readPage(cache, 'Pure Fiction/Rewards'), 'Reward Rotation');
  return out;
}

function walkLines(items, fn) {
  for (const it of items) {
    if (it.msgs) { walkLines(it.msgs, fn); continue; }
    if (it.t === 'act' || it.t === 'ref' || !it.en) continue;
    fn(it);
  }
}

function check(ex, verbose) {
  let bad = 0;
  const say = m => { bad++; console.log(m); };
  const cover = (name, items, need) => {
    let all = 0, ok = 0;
    const miss = [];
    walkLines(items, it => { all++; if (it.ru) ok++; else miss.push(it.en); });
    console.log(`${(ok / Math.max(1, all) * 100).toFixed(1).padStart(5)}%  ${String(all).padStart(4)} lines  ${name}`);
    if (verbose) for (const l of miss) console.log('    ' + l.slice(0, 150));
    if (ok / Math.max(1, all) < need) say('coverage below ' + need * 100 + '%: ' + name);
  };
  for (const k of ['gen1', 'gen2', 'starward']) if (!ex.rules[k]) say('no rules text: ' + k);
  for (const [k, v] of Object.entries(ex.terms)) if (!v && !NO_TERM.includes(k)) say('no Russian term: ' + k);
  if (!ex.quote.ru) say('no Russian quote');
  for (const u of ex.ui) if (!u.ru) say('no Russian UI line: ' + u.en);
  for (const t of TUTORIALS) cover('tutorial ' + t, ex.tutorials[t].lines.map(l => Object.assign({ t: 'line' }, l)), 1);
  cover('mission', ex.mission.items, 0.95);
  cover('mission steps', ex.mission.steps.map(s => Object.assign({ t: 'step' }, s)), 1);
  cover('thread', ex.thread.rows.filter(r => r.t !== 'quest'), 1);
  if (!ex.thread.sign.ru) say('no Russian signature');
  for (const n of NPCS) cover('npc ' + n, ex.npcs[n].items.concat(ex.npcs[n].voice), 0.9);
  if (!ex.feather.lore.ru) say('no Russian feather text');
  if (!ex.book.ru || !ex.book.textRu) say('no Russian book');
  if (!ex.shop.desc.ru) say('no Russian shop text');
  if (ex.shop.map.markers.length < 3) say('shop markers are missing');
  let foes = 0, foesOk = 0;
  for (const s of ex.seasons) {
    const tag = s.version + ' ' + s.en;
    if (!s.ru) say('no Russian season: ' + tag);
    const effs = s.whim.concat(s.caco);
    const done = effs.filter(e => e.eff.ru && e.name.ru).length;
    console.log(`${String(done).padStart(3)}/${effs.length} effects  gen ${s.gen}  ${s.stages.length} stages  ${tag} = ${s.ru}`);
    if (s.stages.length !== 4) say('season is not 4 stages: ' + tag);
    if (s.caco.length !== 3) say('season is not 3 cacophonies: ' + tag);
    if (verbose) for (const e of effs) if (!e.eff.ru || !e.name.ru) console.log('    ' + e.name.en + ': ' + e.eff.en.slice(0, 140));
    for (const st of s.stages) for (const node of st.nodes) for (const w of node.waves) for (const f of w.foes) { foes++; if (f.ru) foesOk++; else if (verbose) console.log('    no enemy name: ' + f.en); }
    if (s.version === '1.6' && done !== effs.length) say('season of version 1.6 has effects without Russian: ' + tag);
  }
  console.log(`enemy names with Russian: ${foesOk}/${foes}`);
  if (foesOk / Math.max(1, foes) < 0.97) say('enemy name coverage is below 97%');
  console.log(bad ? bad + ' problems' : 'extract is complete');
  process.exitCode = bad ? 1 : 0;
}

function showItems(ex, items) {
  const pad = d => '  '.repeat(Math.max(0, (d || 1) - 1));
  for (const it of items) {
    if (it.t === 'step') console.log('\n## ' + (it.ru || it.en));
    else if (it.t === 'desc') console.log('[' + it.loc + '] ' + (it.ru || it.en));
    else if (it.t === 'act') console.log(pad(it.d) + '(' + it.en.replace(/^\(|\)$/g, '') + ')');
    else if (it.t === 'say') console.log(pad(it.d) + it.who + ': ' + (it.ru || '[EN] ' + it.en));
    else if (it.t === 'opt') console.log(pad(it.d) + '> ' + (it.ru || '[EN] ' + it.en));
    else if (it.t === 'msg') { console.log(pad(it.d) + 'Сообщения' + (it.title ? ' «' + it.title + '»' : '')); showItems(ex, it.msgs.map(m => Object.assign({ t: 'say', d: it.d }, m))); }
    else console.log(pad(it.d) + (it.ru || '[EN] ' + (it.en || '')));
  }
}

function showSeason(s) {
  console.log('# ' + (s.ru || s.en) + ' / ' + s.en + ' (' + s.version + ', поколение ' + s.gen + ')');
  for (const e of s.whim) console.log('Нелепость ' + (e.name.ru || e.name.en) + ': ' + (e.eff.ru || '[EN] ' + e.eff.en));
  for (const e of s.caco) console.log('Какофония ' + (e.name.ru || e.name.en) + ': ' + (e.eff.ru || '[EN] ' + e.eff.en));
  for (const st of s.stages) {
    console.log('\nЭтап ' + st.n + ', уровень ' + st.lvl + ', циклы ' + st.cycles.join(' + ') + (st.note ? ', ' + st.note : ''));
    st.nodes.forEach((node, i) => {
      console.log(' Узел ' + (i + 1) + ' [' + node.rec.join(', ') + ']');
      node.waves.forEach((w, j) => console.log('  Волна ' + (j + 1) + ' (' + w.max + '): ' + w.foes.map(f => (f.ru || f.en) + ' ×' + f.n + (f.weak ? ' {' + f.weak.join(', ') + '}' : '')).join(', ')));
    });
  }
}

function show(ex, topic) {
  if (topic === 'rules') { for (const [k, v] of Object.entries(ex.rules)) console.log('# ' + k + '\n' + v + '\n'); return; }
  if (topic === 'terms') { for (const [k, v] of Object.entries(ex.terms)) console.log(k + ' = ' + (v || '???')); return; }
  if (topic === 'ui') { for (const u of ex.ui) console.log(u.en + '\n  = ' + (u.ru || '???')); return; }
  if (topic === 'tutorial') { for (const t of Object.values(ex.tutorials)) { console.log('# ' + (t.ru || t.en)); for (const l of t.lines) console.log('- ' + (l.ru || '[EN] ' + l.en)); } return; }
  if (topic === 'mission') { console.log('# ' + (ex.mission.ru || ex.mission.en) + ', награда: ' + ex.mission.rewards); for (const s of ex.mission.steps) console.log('- ' + (s.ru || s.en)); showItems(ex, ex.mission.items); return; }
  if (topic === 'thread') { console.log('# ' + (ex.thread.title.ru || ex.thread.title.en) + '\nПодпись: ' + (ex.thread.sign.ru || ex.thread.sign.en)); for (const r of ex.thread.rows) console.log('  '.repeat(Math.max(0, (r.d || 1) - 1)) + (r.t === 'choice' ? '> ' : r.who ? r.who + ': ' : '{') + (r.ru || r.en) + (r.t === 'quest' ? '}' : '')); return; }
  if (topic === 'feather') { console.log((ex.feather.desc.ru || ex.feather.desc.en) + '\n' + (ex.feather.lore.ru || ex.feather.lore.en)); return; }
  if (topic === 'book') { console.log('# ' + ex.book.ru + '\n' + ex.book.textRu); return; }
  if (ex.npcs[topic]) { showItems(ex, ex.npcs[topic].voice); showItems(ex, ex.npcs[topic].items); return; }
  const season = ex.seasons.find(s => s.en === topic || s.ru === topic);
  if (season) { showSeason(season); return; }
  console.log('unknown topic: ' + topic + '\nrules, terms, ui, tutorial, mission, thread, feather, book, ' + NPCS.join(', ') + '\n' + ex.seasons.map(s => s.version + ' ' + s.ru).join('\n'));
  process.exitCode = 1;
}

async function main() {
  const a = process.argv.slice(2), cmd = a[0] || 'check';
  const cacheArg = a.find(x => x.startsWith('--cache='));
  const cache = cacheArg ? cacheArg.slice(8) : path.join(os.tmpdir(), 'hsr-pf');
  if (cmd === 'fetch') { await fetchAll(cache); return; }
  if (cmd === 'write') {
    fs.mkdirSync(path.dirname(EXTRACT), { recursive: true });
    fs.writeFileSync(EXTRACT, JSON.stringify(extract(cache)));
    console.log('wrote', path.relative(ROOT, EXTRACT), Math.round(fs.statSync(EXTRACT).size / 1024) + ' KB');
    return;
  }
  const ex = JSON.parse(fs.readFileSync(EXTRACT, 'utf8'));
  if (cmd === 'check') { check(ex, a.includes('--verbose')); return; }
  if (cmd === 'show') { show(ex, a.slice(1).filter(x => !x.startsWith('--')).join(' ')); return; }
  console.log('usage: node tools/hsr-pf-import.cjs fetch|write|check [--verbose]|show <topic> [--cache=dir]');
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
