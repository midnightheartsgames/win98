'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const EXTRACT = path.join(ROOT, 'content/hsr-luofu/extract.json');
const API = 'https://honkai-star-rail.fandom.com/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&redirects=1&format=json&titles=';
const IMAGE_API = 'https://honkai-star-rail.fandom.com/api.php?action=query&prop=imageinfo&iiprop=url%7Csize&format=json&titles=';
const TEXTMAP = 'https://gitlab.com/Dimbreath/turnbasedgamedata/-/raw/main/TextMap/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const TEXT_FILES = ['TextMapEN.json', 'TextMapRU_0.json', 'TextMapRU_1.json', 'TextMapMainEN.json', 'TextMapMainRU.json'];

const CHAPTERS = [
  { id: 'wander', en: 'Windswept Wanderlust', missions: [
    ['An Invitation Without Proffer'], ['Amidst the Mara-Struck'], ['Devising Stratagems', 'Scattered Memories of Hooded Past'], ['The Hound Chases the Fox'],
    ['Stars Spun, Prescience Sprung'], ['New Friends Bring New Joy'], ['Omniscient Inquiry of Arcana'], ['Wood Sprouts Anew, Fate Tilts Askew', 'Tranquil Amidst Turmoil'], ['Humming Antlers, Entwined Horns']
  ] },
  { id: 'tower', en: 'Topclouded Towerthrust', missions: [
    ['Desolate Depths of Despair', 'Dragon Mislay, Dreams Astray', 'Oblation Obtained, Order Ordained'], ['A Dragon Gallant, Its Ocean Distant', 'Demise of Immortality, Finale of Calamity']
  ] },
  { id: 'karmic', en: 'Karmic Clouds Faded, War Banners Folded', missions: [['Obsequies Performed, A Long Road Ahead']] }
];
const AREAS = ['Cloudford', 'Central Starskiff Haven', 'Palace of Astrum', 'Stargazer Navalia', 'Exalting Sanctum', 'Seat of Divine Foresight', 'Aurum Alley', 'Divination Commission (Location)', 'Artisanship Commission (Location)', 'Alchemy Commission (Location)', 'Dragonprayer Terrace', 'Scalegorge Waterscape', 'Roots of the Arbor', 'The Shackling Prison', 'Ambrosial Arbor'];
const MAPS = ['Cloudford Floor 1', 'Cloudford Floor 2', 'Central Starskiff Haven', 'Stargazer Navalia', 'Exalting Sanctum', 'Aurum Alley', 'Divination Commission Floor 1', 'Divination Commission Floor 2', 'Artisanship Commission', 'Alchemy Commission Floor 1', 'Alchemy Commission Floor 2', 'Scalegorge Waterscape'];
const TUTORIALS = ['Worksite Dispatch', 'Diting', 'Abacus Circuitry', 'Abacus Circuitry (II)', 'Abacus Circuitry (III)', 'Shifting Screen', 'Mutare Magnus', 'Luminflux Pyxis', 'Percipient Sconce'];
const MESSAGES = ['Tingyun', 'Dan Heng', 'The Astral Express Family', 'Trailblazer'];
const ENEMIES = ['Mara-Struck Soldier', 'Disciples of Sanctus Medicus: Shape Shifter', 'Disciples of Sanctus Medicus: Internal Alchemist', 'Disciples of Sanctus Medicus: Ballistarius', 'Cloud Knights Patroller', 'Aurumaton Gatekeeper', 'Entranced Ingenium: Obedient Dracolion', 'Entranced Ingenium: Illumination Dragonfish', 'Entranced Ingenium: Golden Cloud Toad', 'Abundance Sprite: Wooden Lupus', 'Abundance Sprite: Golden Hound', 'Abundance Sprite: Malefic Ape', 'Abundant Ebon Deer', 'Twig of Wintry Wind', 'Twig of Marple Leaf', 'Twig of Glorious Blooms', 'Twig of Lavish Fruits', 'The Ascended', 'Stellaron Hunter: Kafka', 'Cloud Knight Lieutenant: Yanqing', 'Flying Sword', 'Phantylia the Undying', 'Abundance Lotus (Phase 1)', 'Abundance Lotus (Phase 3)', 'Destruction Lotus (Phase 2)', 'Destruction Lotus (Phase 3)', 'Voidranger: Reaver', 'Voidranger: Eliminator', 'Voidranger: Trampler', 'Voidranger: Distorter', 'Baryon', 'Antibaryon', 'Windspawn', 'Thunderspawn', 'Imaginary Weaver'];
const NPCS = ['Diting', 'Master Gongshu', 'Yanming', 'Qingzu', 'Dan Shu', 'Phantylia', 'Mengming', 'Yancui', "Back'n", 'Forth', 'Xiaoyu', 'Jingzhai', 'Mingyue', 'Awei', 'Chengjie', 'Ziming', 'Yunche', 'Yuluo', 'Jingyan', 'Songyan', 'Guangda', 'Jinwen', 'Dahao', 'Mr. Xiyan', 'Qingyue', 'Pawnbroker Handian', 'Salesby', 'Yubie', 'Dan Feng'];
const IMAGES = [
  'Map Cloudford Floor 1.png', 'Map Cloudford Floor 2.png', 'Map Central Starskiff Haven.png', 'Map Palace of Astrum.png', 'Map Stargazer Navalia.png', 'Map Exalting Sanctum.png', 'Map Seat of Divine Foresight.png', 'Map Aurum Alley.png', 'Map Divination Commission Floor 1.png', 'Map Divination Commission Floor 2.png', 'Map Artisanship Commission.png', 'Map Alchemy Commission Floor 1.png', 'Map Alchemy Commission Floor 2.png', 'Map Scalegorge Waterscape.png',
  'Area Cloudford.png', 'Area Central Starskiff Haven.png', 'Area Stargazer Navalia.png', 'Area Exalting Sanctum.png', 'Area Aurum Alley.png', 'Area Divination Commission.png', 'Area Artisanship Commission.png', 'Area Alchemy Commission.png', 'Area Dragonprayer Terrace.png', 'Area Scalegorge Waterscape.png', 'Area Seat of Divine Foresight.png', 'Area Shackling Prison.png',
  'Tutorial Adventure Worksite Dispatch 1.png', 'Tutorial Adventure Worksite Dispatch 2.png', 'Tutorial Adventure Diting.png', 'Tutorial Adventure Abacus Circuitry.png', 'Tutorial Adventure Shifting Screen 1.png', 'Tutorial Adventure Shifting Screen 2.png', 'Tutorial Adventure Mutare Magnus.png', 'Tutorial Adventure Luminflux Pyxis 1.png', 'Tutorial Adventure Luminflux Pyxis 2.png', 'Tutorial Adventure Luminflux Pyxis 3.png', 'Tutorial Adventure Percipient Sconce 1.png', 'Tutorial Adventure Percipient Sconce 2.png'
];
const NAMES = [
  'The Xianzhou Luofu', 'The Shackling Prison', 'Jade Gate', 'Palace of Astrum', 'Seat of Divine Foresight', 'Petrichor Inn', 'Starwatcher Avenue', 'Starskiff Jetty', 'Earthrise Agora', 'Trove of Verdure', 'Trove of Verdure: South Wing', 'Cloudford: Skiff Boarding Area', 'Cloudford: Cargo Lane', 'Astral Cottage', 'Ship Nursery — The Budding', 'Ship Nursery — The Burgeoning', 'The Mooring',
  'Court of Tranquility', 'Synwood Pavilion', 'Spare Time Book Shop', 'Fortuna Augurstead', 'Conclave Hall', 'Matrix of Prescience Ultima', 'Spatial Terminal', 'Temporal Terminal', 'Karma Terminal', 'Arcane Moorage', 'Passage to the Finery Foundry', 'Creation Furnace', "Healer's Market", 'Medicine Bureau', 'Aureate Elixir Furnace', 'Elixir Research Terrace', 'Evemist Mansion', 'Dragonvista Rain Hall', 'Ancient Sea Palace Ruins', 'Palace Ruin Depths', 'Dragonprayer Terrace', 'Lunarescent Depths', 'Ambrosial Arbor', 'Aurum Alley Night Market', 'Spices Supreme', 'The Sleepless Earl',
  'Cloudford', 'Central Starskiff Haven', 'Stargazer Navalia', 'Exalting Sanctum', 'Aurum Alley', 'Divination Commission', 'Artisanship Commission', 'Alchemy Commission', 'Scalegorge Waterscape', 'Roots of the Arbor',
  'Worksite Dispatch', 'Diting', 'Abacus Circuitry', 'Shifting Screen', 'Mutare Magnus', 'Luminflux Pyxis', 'Ambrosial Arbor coil', 'Percipient Sconce', 'Starskiff', 'Revelation Slate', 'Celestial Jade', 'Cloudhymn Roar', 'Lightning-Lord', 'Hardy Leaf Sheath', 'Flamboyant Gore', "Black Prana's Snare", 'Prana-Siphoned', 'Spirit Whisper', 'Dominated', 'Sword Formation', 'Havoc', 'Kalpa Descend', 'Starfall, Mooncry', 'Arbor Apotheosis', 'Acchata: Forming Winds', 'Acchata: Roaring Thunder', 'Benefactor',
  'Sky-Faring Commission', 'Ten-Lords Commission', 'Realm-Keeping Commission', 'Cloud Knights', 'Disciples of Sanctus Medicus', 'Antimatter Legion', 'Stellaron Hunters', 'High-Cloud Quintet', 'Foxian', 'Vidyadhara', 'Amicassador', 'Master Diviner', 'Helm Master', 'Arbiter-General', 'High Elder', 'Imbibitor Lunae', 'Lord Ravager', 'Soul-soothing ceremony', 'Nanook', 'Elio', 'Mara',
  'Undelivered Letter', 'Undestroyed Letter', 'Weapon Shards', 'Shattered Jade Seal', 'Dud Grenade', 'Artisanship Commission Jade Seal', 'Longevity Pill of Cruelty', 'Protein Rice', 'Songlotus Cake', 'Fan With Plain Carp Print', "The Amicassador's Seal", 'Small Chest Sent to the Sleepless Earl', 'Kitchen Knife Sent to Spices Supreme', 'An Archery Set Gifted For Someone Unknown', 'New Tea "Tingyun\'s Blend"', 'Chili Oil Beef Offal Stew', 'Soul-Soothing Paper Kite', 'Jade Abacus of Allying Oath', 'Praise of High Morals', 'Sanctus Medicus Dharani'
];
const MANUAL = {
  'sky-faring commission': 'Комиссия по полётам',
  foxian: 'лисий народ',
  vidyadhara: 'видьядхара',
  amicassador: 'посланник',
  'master diviner': 'Верховная провидица',
  'helm master': 'рулевая',
  'arbiter-general': 'генерал-арбитр',
  'soul-soothing ceremony': 'церемония утешения',
  'evemist mansion': 'Затуманенная обитель',
  'lunarescent depths': 'Лунные глубины',
  'petrichor inn': 'гостиница «Петрикор»',
  'ambrosial arbor coil': 'узел Древа амброзии',
  mara: 'Мара',
  benefactor: 'благодетель',
  '(trailblazer)': 'Первопроходец',
  trailblazer: 'Первопроходец',
  'sanctus medicus dharani': 'Sanctus Medicus Dharani',
  'left cloud knight': 'Караульный Облачных Рыцарей',
  'right cloud knight': 'Караульный Облачных Рыцарей',
  woman: 'Женщина',
  '???': '???'
};

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA, Referer: 'https://honkai-star-rail.fandom.com/' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) { res.resume(); resolve(get(new URL(res.headers.location, url).href)); return; }
      if (res.statusCode !== 200) { reject(new Error(url + ' ' + res.statusCode)); res.resume(); return; }
      const out = [];
      res.on('data', d => out.push(d));
      res.on('end', () => resolve(Buffer.concat(out)));
    }).on('error', reject);
  });
}

const pageFile = (cache, title) => path.join(cache, 'pages', title.replace(/[^\w\-. ()]+/g, '_') + '.wiki');
const wait = ms => new Promise(r => setTimeout(r, ms));

const allPages = () => {
  const out = [];
  for (const c of CHAPTERS) { out.push(c.en); for (const m of c.missions) out.push(...m); }
  out.push(...AREAS, ...MAPS.map(m => 'Map:' + m), ...TUTORIALS.map(t => 'Tutorial/' + t), ...MESSAGES.map(m => 'Messages/' + m), ...ENEMIES, ...NPCS);
  return out;
};

async function fetchPage(cache, title) {
  const file = pageFile(cache, title);
  if (fs.existsSync(file)) return;
  const data = JSON.parse(await get(API + encodeURIComponent(title)));
  const page = Object.values(data.query.pages)[0];
  if (!page.revisions) { console.log('no page', title); return; }
  fs.writeFileSync(file, page.revisions[0].slots.main['*']);
  console.log('fetched', title);
  await wait(120);
}

async function fetchImages(cache) {
  const dir = path.join(cache, 'img');
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < IMAGES.length; i += 40) {
    const titles = IMAGES.slice(i, i + 40).map(n => 'File:' + n).join('|');
    const pages = Object.values(JSON.parse(await get(IMAGE_API + encodeURIComponent(titles))).query.pages);
    for (const p of pages) {
      if (!p.imageinfo) { console.log('no image', p.title); continue; }
      const file = path.join(dir, p.title.slice(5).replace(/ /g, '_'));
      if (fs.existsSync(file)) continue;
      const url = p.imageinfo[0].url.split('/revision/')[0] + '/revision/latest?cb=1';
      execFileSync('curl', ['-s', '-m', '90', '-L', '-A', UA, '-H', 'Accept: image/*', '-e', 'https://honkai-star-rail.fandom.com/', '-o', file, url]);
      console.log('fetched', p.title);
    }
  }
}

async function fetchAll(cache) {
  fs.mkdirSync(path.join(cache, 'pages'), { recursive: true });
  fs.mkdirSync(path.join(cache, 'textmap'), { recursive: true });
  for (const t of allPages()) await fetchPage(cache, t);
  for (const f of TEXT_FILES) {
    const file = path.join(cache, 'textmap', f);
    if (fs.existsSync(file)) continue;
    fs.writeFileSync(file, await get(TEXTMAP + f));
    console.log('fetched', f);
  }
  await fetchImages(cache);
}

function loadText(cache) {
  const read = f => JSON.parse(fs.readFileSync(path.join(cache, 'textmap', f), 'utf8'));
  const en = Object.assign(read('TextMapEN.json'), read('TextMapMainEN.json'));
  const ru = Object.assign(read('TextMapRU_0.json'), read('TextMapRU_1.json'), read('TextMapMainRU.json'));
  return { en, ru };
}

const genderVariants = s => {
  if (!/\{[MF]#/.test(s)) return [s];
  const pick = keep => s.replace(/\{([MF])#([^}]*)\}/g, (_, g, v) => g === keep ? v : '');
  return [pick('M'), pick('F')];
};

const norm = s => s
  .replace(/<[^>]*>/g, '')
  .replace(/\{RUBY_B#[^}]*\}/g, '').replace(/\{RUBY_E#\}/g, '')
  .replace(/\{NICKNAME\}|\(trailblazer\)/gi, 'trailblazer')
  .replace(/\{[A-Z_]+#?[^}]*\}/g, '')
  .replace(/\\n/g, ' ')
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, '');

function ruText(s) {
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/\{RUBY_B#[^}]*\}/g, '').replace(/\{RUBY_E#\}/g, '')
    .replace(/\{NICKNAME\}/g, '{name}')
    .replace(/\{M#([^}]*)\}\{F#([^}]*)\}/g, '{$1|$2}')
    .replace(/\{F#([^}]*)\}\{M#([^}]*)\}/g, '{$2|$1}')
    .replace(/\{F#([^}]*)\}/g, '{|$1}')
    .replace(/\{M#([^}]*)\}/g, '{$1|}')
    .replace(/\{TEXTJOIN#\d+\}/g, '')
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/Химеко/g, 'Химико')
    .replace(/(^|[^А-Яа-яЁё])Янг/g, '$1Вельт')
    .trim();
}

const bigrams = s => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const b = s.slice(i, i + 2); m.set(b, (m.get(b) || 0) + 1); } return m; };
function dice(a, b) {
  const A = bigrams(a), B = bigrams(b);
  let same = 0;
  for (const [k, v] of A) same += Math.min(v, B.get(k) || 0);
  return 2 * same / Math.max(1, a.length + b.length - 2);
}

function makeIndex(text) {
  const exact = new Map(), heads = new Map(), tails = new Map();
  const add = (map, k, v) => { const l = map.get(k); if (l) l.push(v); else map.set(k, [v]); };
  for (const [hash, en] of Object.entries(text.en)) {
    if (!text.ru[hash]) continue;
    for (const v of genderVariants(en)) {
      const n = norm(v);
      if (!n) continue;
      add(exact, n, hash);
      if (n.length >= 24) { add(heads, n.slice(0, 16), [hash, n]); add(tails, n.slice(-16), [hash, n]); }
    }
  }
  return { exact, heads, tails, text };
}

function chooseRu(ix, hashes) {
  const count = new Map();
  for (const h of hashes) { const r = ruText(ix.text.ru[h]); if (r) count.set(r, (count.get(r) || 0) + 1); }
  let best = null, n = -1;
  for (const [r, c] of count) if (c > n) { best = r; n = c; }
  return { ru: best, alt: count.size };
}

function lookup(ix, en) {
  const n = norm(en);
  if (!n) return en.trim() ? { ru: en.trim() } : null;
  const hit = ix.exact.get(n);
  if (hit) return { ru: chooseRu(ix, hit).ru };
  if (n.length < 24) return null;
  let best = null, score = 0.86;
  for (const row of [ix.heads.get(n.slice(0, 16)) || [], ix.tails.get(n.slice(-16)) || []]) {
    for (const [hash, cand] of row) {
      if (Math.abs(cand.length - n.length) > n.length * 0.25) continue;
      const d = dice(n, cand);
      if (d > score) { score = d; best = hash; }
    }
  }
  return best ? { ru: ruText(ix.text.ru[best]), fuzzy: true } : null;
}

const hasCyr = s => /[А-Яа-яЁё]/.test(s);

function nameRu(ix, en) {
  const key = en.trim().toLowerCase();
  if (MANUAL[key]) return MANUAL[key];
  const hit = ix.exact.get(norm(en));
  if (!hit) return null;
  const seen = new Map();
  for (const h of hit) {
    const r = ruText(ix.text.ru[h]).replace(/[.:]+$/, '');
    if (r && r.length < 90 && hasCyr(r)) seen.set(r, (seen.get(r) || 0) + 1);
  }
  let best = null, n = -1;
  for (const [r, c] of seen) if (c > n) { best = r; n = c; }
  return best;
}

function closeTemplates(s) {
  let out = s, prev;
  do {
    prev = out;
    out = out
      .replace(/\{\{A\|[^{}]*\}\}\s*/g, '')
      .replace(/\{\{Color\|[^{}|]*\|(?:nobold=1\|)?([^{}|]*)(?:\|nobold=1)?\}\}/gi, '$1')
      .replace(/\{\{Rubi\|([^{}|]*)\|[^{}]*\}\}/g, '$1')
      .replace(/\{\{sic\|([^{}|]*)\}\}/gi, '$1')
      .replace(/\{\{w\|[^{}|]*\|([^{}|]*)\}\}/g, '$1')
      .replace(/\{\{w\|([^{}|]*)\}\}/g, '$1')
      .replace(/\{\{zh\|[^{}]*\}\}/g, '')
      .replace(/\{\{Enemy List\|([^{}|]*)(?:\|[^{}]*)?\}\}/g, (_, l) => l.split(';').map(x => x.trim()).filter(Boolean).map(x => x.replace(/\*(\d+)$/, ' x$1')).join(', '))
      .replace(/\{\{Enemy\|([^{}|]*)(?:\|[^{}]*?)?\}\}/g, (m, n) => { const c = /\bx=(\d+)/.exec(m), t = /\btext=([^|}]*)/.exec(m); return (t ? t[1] : n) + (c ? ' x' + c[1] : ''); })
      .replace(/\{\{Item List\|([^{}|]*)(?:\|[^{}]*)?\}\}/g, (_, l) => l.split(';').map(x => x.trim()).filter(Boolean).map(x => x.replace(/\*(\d+)$/, ' x$1')).join(', '))
      .replace(/\{\{Item\|([^{}|]*)(?:\|[^{}]*?)?\}\}/g, (m, n) => { const c = /\bx=(\d+)/.exec(m), t = /\btext=([^|}]*)/.exec(m); return (t ? t[1] : n) + (c ? ' x' + c[1] : ''); })
      .replace(/\{\{Mission\|([^{}|]*)(?:\|[^{}]*)?\}\}/g, '$1');
  } while (out !== prev);
  return out;
}

const unlink = s => s
  .replace(/\[\[(?:File|Image):[^\]]*\]\]/g, '')
  .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1')
  .replace(/\[\[([^\]]*)\]\]/g, '$1');

function clean(s) {
  return closeTemplates(unlink(s.replace(/<!--.*?-->/g, '').replace(/<ref[^>]*\/>/g, '').replace(/<ref[^>]*>.*?<\/ref>/g, '')))
    .replace(/'''?/g, '')
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&nbsp;/g, ' ').replace(/&colon;/g, ':').replace(/&amp;/g, '&').replace(/&times;/g, '×')
    .replace(/<br\s*\/?>/g, ' / ')
    .replace(/<\/?(?:small|nowiki)[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function pair(ix, en) {
  const clear = unlink(en);
  if (!/\{\{MC\|/.test(clear)) {
    const out = { en: clean(clear) }, hit = lookup(ix, out.en);
    if (hit) { out.ru = hit.ru; if (hit.fuzzy) out.fuzzy = true; }
    return out;
  }
  const form = key => clean(clear.replace(/\{\{MC\|([^{}]*)\}\}/g, (_, p) => {
    const r = new RegExp('(?:^|\\|)' + key + '=([^|]*)').exec(p);
    if (r) return r[1];
    return p.includes('=') ? '' : p.split('|')[key === 'm' ? 0 : 1] || '';
  }));
  const out = { en: form('m'), enF: form('f') };
  const a = lookup(ix, out.en), b = lookup(ix, out.enF);
  if (a) { out.ru = a.ru; if (a.fuzzy) out.fuzzy = true; }
  if (b && (!a || b.ru !== a.ru)) { if (a) out.ruF = b.ru; else out.ru = b.ru; }
  return out;
}

function stepPair(ix, en) {
  const count = /\s*\(\d+\/\d+\)\s*$/, tail = count.exec(en), row = pair(ix, en.replace(count, ''));
  if (tail) { row.en += ' ' + tail[0].trim(); if (row.ru) row.ru += ' ' + tail[0].trim(); }
  return row;
}

function section(text, title) {
  const re = new RegExp('^==\\s*' + title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*==\\s*$', 'm');
  const m = re.exec(text);
  if (!m) return '';
  const rest = text.slice(m.index + m[0].length), next = /^==[^=].*==\s*$/m.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}

const field = (text, key) => { const m = new RegExp('^\\|' + key + '\\s*=[ \\t]*(.*)$', 'm').exec(text); return m ? clean(m[1]) : ''; };
const otherRu = text => { const m = /^\|ru\s*=\s*(.+)$/m.exec(text); return m ? clean(m[1]) : null; };

function readTemplate(lines, start) {
  let depth = 0, out = '', i = start;
  for (; i < lines.length; i++) {
    out += (i > start ? '\n' : '') + lines[i];
    depth += (lines[i].match(/\{\{/g) || []).length - (lines[i].match(/\}\}/g) || []).length;
    if (depth <= 0) break;
  }
  return { text: out, end: i };
}

function dialogue(ix, cache, body, sink) {
  const lines = body.replace(/<!--[\s\S]*?-->/g, '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].replace(/\s+$/, '');
    if (!raw.trim()) continue;
    const head = /^(={3,})\s*(.*?)\s*\1$/.exec(raw);
    if (head) { sink.push(Object.assign({ t: 'step', lvl: head[1].length - 3 }, stepPair(ix, head[2]))); continue; }
    const pre = /^[:;*#]*/.exec(raw)[0], depth = pre.length, rest = raw.slice(depth).trim();
    if (/^\{\{(Dialogue Start|Dialogue End|Preview|Reflist)/.test(rest) || /^\|/.test(rest) || rest === '}}' || /^-{3,}$/.test(rest)) {
      if (/^\{\{Preview/.test(rest)) i = readTemplate(lines, i).end;
      continue;
    }
    if (/^\{\{Mission Description/.test(rest)) {
      const tpl = readTemplate(lines, i);
      i = tpl.end;
      const inner = closeTemplates(tpl.text).replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1').replace(/\[\[([^\]]*)\]\]/g, '$1');
      const loc = /location=([^|}]*)/.exec(inner);
      const text = inner.replace(/^\{\{Mission Description\s*\|?/, '').replace(/\}\}\s*$/, '').split('|').filter(p => !/^\s*(update|[Tt]+ype=.*|location=.*)\s*$/.test(p)).join('|');
      sink.push(Object.assign({ t: 'desc', loc: loc ? clean(loc[1]) : '' }, pair(ix, text)));
      continue;
    }
    if (/^\{\{Sequence Recap/.test(rest)) {
      const tpl = readTemplate(lines, i);
      i = tpl.end;
      const cut = /\|type=cutscene/.test(tpl.text);
      const inner = closeTemplates(tpl.text.replace(/\|type=cutscene/, '')).replace(/^[:;*#]*\{\{Sequence Recap\|/, '').replace(/\}\}\s*$/, '');
      const at = inner.indexOf('|');
      sink.push(Object.assign({ t: 'recap', n: inner.slice(0, at).trim(), cut }, pair(ix, inner.slice(at + 1))));
      continue;
    }
    if (/^\{\{Black Screen\|/.test(rest)) {
      sink.push(Object.assign({ t: 'black', d: depth }, pair(ix, rest.replace(/^\{\{Black Screen\|/, '').replace(/\}\}\s*$/, ''))));
      continue;
    }
    if (/^\{\{Messages/.test(rest)) {
      const tpl = readTemplate(lines, i);
      i = tpl.end;
      const msgs = [];
      for (const l of tpl.text.split('\n')) {
        const row = /^[:;*#]*\s*'''(?:\[\[[^\]|]*\|)?\[?\[?([^'\]]*?)\]?\]?:?'''\s*(.*)$/.exec(l);
        if (row && row[2].trim()) msgs.push(Object.assign({ who: clean(row[1]) }, pair(ix, row[2])));
      }
      sink.push({ t: 'msg', d: depth, msgs });
      continue;
    }
    const inc = /^\{\{Transclude\|([^|}]*)(?:\|([^|}]*))?/.exec(rest);
    if (inc) {
      sink.push(transclude(ix, cache, inc[1], inc[2], depth));
      continue;
    }
    const opt = /^\{\{DIcon(?:\|([^}]*))?\}\}\s*(.*)$/.exec(rest);
    if (opt) { sink.push(Object.assign({ t: 'opt', d: depth, icon: (opt[1] || '').trim() }, pair(ix, opt[2]))); continue; }
    if (pre.endsWith(';') || /^;/.test(pre)) { sink.push({ t: 'act', d: depth, en: clean(rest) }); continue; }
    const body2 = closeTemplatesKeepMc(rest);
    const who = /^'''(.+?):?'''\s*:?\s*(.*)$/.exec(body2);
    if (who && who[2].trim()) {
      const speaker = clean(who[1]).replace(/:$/, '');
      const item = Object.assign({ t: 'say', d: depth, who: speaker }, pair(ix, who[2]));
      sink.push(item);
      continue;
    }
    const plain = pair(ix, rest);
    if (!plain.ru && /^\(.*\)$/.test(plain.en)) sink.push({ t: 'act', d: depth, en: plain.en });
    else sink.push(Object.assign({ t: 'text', d: depth }, plain));
  }
}

const closeTemplatesKeepMc = s => s.replace(/\{\{A\|[^{}]*\}\}\s*/g, '');

function transclude(ix, cache, page, title, depth) {
  const file = pageFile(cache, page);
  if (!fs.existsSync(file)) return { t: 'ref', d: depth, page, title: title || '' };
  const text = fs.readFileSync(file, 'utf8');
  if (!title) return { t: 'ref', d: depth, page };
  const wanted = norm(clean(title));
  const parts = text.split(/^(={2,})\s*(.*?)\s*\1\s*$/m);
  for (let i = 2; i < parts.length; i += 3) {
    if (norm(clean(parts[i])) !== wanted) continue;
    const sink = [];
    const lines = parts[i + 1].split('\n').map(l => l.trim()).filter(Boolean);
    for (const l of lines) {
      const row = /^(?:\|\s*)?(?:[:;*#]*\s*)?'''(.+?):?'''\s*:?\s*(.*)$/.exec(l.replace(/\{\{A\|[^{}]*\}\}\s*/g, ''));
      if (row && row[2].trim()) sink.push(Object.assign({ who: clean(row[1]).replace(/:$/, '') }, pair(ix, row[2])));
    }
    return { t: 'msg', d: depth, title: clean(title), msgs: sink };
  }
  return { t: 'ref', d: depth, page, title: clean(title) };
}

function listSteps(ix, text) {
  const out = [];
  for (const line of section(text, 'Steps').split('\n')) {
    const m = /^([#*]+)\s*(.*)$/.exec(line.trim());
    if (!m || !m[2] || m[2].startsWith('<!--')) continue;
    const foes = /\{\{Enemy List\|[^{}]*\}\}/.exec(m[2]);
    const row = Object.assign({ lvl: m[1].length - 1 }, stepPair(ix, m[2].replace(/\{\{Enemy List\|[^{}]*\}\}/, '').trim()));
    if (foes) row.foes = clean(foes[0]);
    if (m[1].includes('*')) row.note = true;
    out.push(row);
  }
  return out;
}

function dialogueBody(text) {
  const body = section(text, 'Dialogue');
  if (body.trim()) return body;
  const trial = section(text, 'Trial Character'), at = trial.search(/^===/m);
  return at < 0 ? '' : trial.slice(at);
}

function readMission(ix, cache, title, chapter, parent) {
  const text = fs.readFileSync(pageFile(cache, title), 'utf8');
  const notes = section(text, 'Gameplay Notes').split('\n').map(l => clean(l.replace(/^[*#:]+\s*/, ''))).filter(Boolean);
  const items = [];
  dialogue(ix, cache, dialogueBody(text), items);
  const gallery = section(text, 'Gallery').split('\n').map(l => clean(l)).filter(l => l && !l.startsWith('<') && !l.startsWith('='));
  const summary = field(text, 'summary');
  const out = {
    en: title, ru: nameRu(ix, title) || otherRu(text), chapter, parent: parent || null, id: field(text, 'id'),
    world: field(text, 'world'), area: field(text, 'area'), start: field(text, 'startLocation'),
    characters: field(text, 'characters').split(';').map(s => s.trim()).filter(Boolean),
    rewards: field(text, 'rewards'), summary: pair(ix, summary), notes, steps: listSteps(ix, text), items, gallery
  };
  if (!summary || /^\|/.test(summary) || summary.startsWith('<!--')) delete out.summary;
  return out;
}

function readEnemy(ix, cache, title) {
  const file = pageFile(cache, title);
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, 'utf8');
  const skills = [];
  for (const m of text.matchAll(/^\|name(\d+)\s*=\s*(.+)$/gm)) {
    const n = m[1], name = clean(m[2]);
    const row = key => field(text, key + n);
    const skill = { en: name, ru: nameRu(ix, name), type: row('type'), desc: row('desc') };
    const ph = row('phase');
    if (ph) skill.phase = ph;
    if (row('danger')) skill.danger = true;
    skills.push(skill);
  }
  const desc = /\{\{Description\|([\s\S]*?)\}\}/.exec(text);
  const stat = key => field(text, key);
  return {
    en: title, ru: nameRu(ix, title) || otherRu(text), tier: stat('tier'), type: stat('type'), weak: stat('weakness'), tough: stat('tough'), hp: stat('hp'), spd: stat('spd'), ability: stat('ability'),
    desc: desc ? pair(ix, desc[1]) : null, notes: section(text, 'Gameplay Notes').split('\n').map(l => clean(l.replace(/^[*#:]+\s*/, ''))).filter(Boolean), skills
  };
}

function readArea(ix, cache, title) {
  const file = pageFile(cache, title);
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, 'utf8');
  const desc = /\{\{Description\|([\s\S]*?)\}\}/.exec(text);
  const items = [];
  dialogue(ix, cache, section(text, 'Investigations').replace(/\{\{Collapsible\|/g, '').replace(/\|See All\|collapsed = 1\}\}/g, ''), items);
  return { en: title, ru: otherRu(text), desc: desc ? pair(ix, desc[1]) : null, investigations: items };
}

function readMap(ix, cache, title) {
  const file = pageFile(cache, 'Map:' + title);
  if (!fs.existsSync(file)) return null;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const cats = Object.fromEntries((data.categories || []).map(c => [c.id, c.name]));
  const markers = (data.markers || []).map(m => {
    const pop = m.popup || {}, name = cats[m.categoryId] || m.categoryId, title2 = clean(pop.title || m.title || '');
    const row = { c: name, x: Math.round(m.position[0]), y: Math.round(m.position[1]), t: title2 };
    if (/Anchor|Exit|Shop|NPC|Puzzle/.test(name)) { const ru = nameRu(ix, title2); if (ru) row.ru = ru; }
    if (/Anchor|Exit/.test(name) && pop.description && !/^\{\{/.test(pop.description)) { const d = pair(ix, pop.description); row.desc = d.en; if (d.ru) row.descRu = d.ru; }
    return row;
  });
  return { image: data.mapImage, bounds: data.mapBounds, markers };
}

function readNpc(ix, cache, title) {
  const file = pageFile(cache, title);
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, 'utf8');
  const stat = key => field(text, key);
  const profile = section(text, 'Profile').split('\n').map(l => clean(l)).filter(Boolean).join(' ');
  const gallery = /<gallery>\s*\n([^|\n]+)/.exec(text);
  return { en: title, ru: nameRu(ix, title) || otherRu(text), image: gallery ? gallery[1].trim() : stat('image'), species: stat('species'), location: stat('location'), profile };
}

function readTutorial(ix, cache, title) {
  const file = pageFile(cache, 'Tutorial/' + title);
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, 'utf8');
  const lines = [];
  for (const m of text.matchAll(/^\|text\d*\s*=\s*(.+)$/gm)) lines.push(pair(ix, m[1]));
  return { en: title, ru: nameRu(ix, title), lines };
}

function extract(cache) {
  const ix = makeIndex(loadText(cache));
  const out = { source: 'fandom Honkai: Star Rail Wiki (api.php), Dimbreath/turnbasedgamedata TextMap', chapters: [], missions: {}, areas: {}, maps: {}, tutorials: {}, enemies: {}, npcs: {}, names: {}, speakers: {} };
  for (const c of CHAPTERS) {
    const chapter = { id: c.id, en: c.en, ru: nameRu(ix, c.en), missions: [] };
    for (const group of c.missions) {
      const [main, ...subs] = group;
      out.missions[main] = readMission(ix, cache, main, c.id, null);
      chapter.missions.push({ en: main, subs });
      for (const s of subs) out.missions[s] = readMission(ix, cache, s, c.id, main);
    }
    out.chapters.push(chapter);
  }
  for (const a of AREAS) { const r = readArea(ix, cache, a); if (r) out.areas[a] = r; }
  for (const m of MAPS) { const r = readMap(ix, cache, m); if (r) out.maps[m] = r; }
  for (const t of TUTORIALS) { const r = readTutorial(ix, cache, t); if (r) out.tutorials[t] = r; }
  for (const e of ENEMIES) { const r = readEnemy(ix, cache, e); if (r) out.enemies[e] = r; }
  for (const n of NPCS) { const r = readNpc(ix, cache, n); if (r) out.npcs[n] = r; }
  for (const n of NAMES) out.names[n] = nameRu(ix, n);
  const visit = list => {
    for (const it of list) {
      if (it.who && !(it.who in out.speakers)) out.speakers[it.who] = nameRu(ix, it.who);
      if (it.msgs) visit(it.msgs);
    }
  };
  for (const m of Object.values(out.missions)) visit(m.items);
  return out;
}

function coverage(list) {
  let all = 0, ok = 0;
  const miss = [];
  const walk = items => {
    for (const it of items) {
      if (it.msgs) { walk(it.msgs); continue; }
      if (it.t === 'act' || it.t === 'ref' || !it.en) continue;
      all++;
      if (it.ru) ok++;
      else miss.push(it.en);
    }
  };
  walk(list);
  return { all, ok, miss };
}

function check(ex, verbose) {
  let bad = 0, all = 0, ok = 0, fuzzy = 0;
  const say = m => { bad++; console.log(m); };
  const countFuzzy = items => { for (const it of items) { if (it.msgs) countFuzzy(it.msgs); else if (it.fuzzy) fuzzy++; } };
  for (const [name, m] of Object.entries(ex.missions)) {
    const c = coverage(m.items), s = coverage(m.steps.filter(x => !x.note).map(x => Object.assign({ t: 'step' }, x)));
    all += c.all; ok += c.ok;
    countFuzzy(m.items);
    console.log(`${(c.ok / Math.max(1, c.all) * 100).toFixed(1).padStart(5)}%  ${String(c.all).padStart(4)} lines  steps ${s.ok}/${s.all}  ${name} = ${m.ru || '???'}`);
    if (!m.ru) say('no Russian title: ' + name);
    if (!c.all) say('no dialogue: ' + name);
    if (verbose) for (const l of c.miss.concat(s.miss)) console.log('    ' + l.slice(0, 150));
  }
  const share = ok / Math.max(1, all);
  console.log(`lines with Russian: ${ok}/${all} = ${(share * 100).toFixed(1)}%, close match: ${fuzzy}`);
  if (share < 0.95) say('line coverage is below 95%');
  for (const [k, v] of Object.entries(ex.names)) if (!v) say('no Russian name: ' + k);
  for (const [k, v] of Object.entries(ex.speakers)) if (!v) say('no Russian speaker: ' + k);
  for (const c of ex.chapters) if (!c.ru) say('no Russian chapter: ' + c.en);
  for (const [k, e] of Object.entries(ex.enemies)) if (!e.ru) say('no Russian enemy: ' + k);
  for (const a of AREAS) if (!ex.areas[a]) say('no area page: ' + a);
  for (const m of MAPS) if (!ex.maps[m]) say('no map page: ' + m);
  for (const t of TUTORIALS) if (!ex.tutorials[t]) say('no tutorial page: ' + t);
  for (const e of ENEMIES) if (!ex.enemies[e]) say('no enemy page: ' + e);
  for (const n of NPCS) if (!ex.npcs[n]) say('no npc page: ' + n);
  console.log(bad ? bad + ' problems' : 'extract is complete');
  process.exitCode = bad ? 1 : 0;
}

function show(ex, query) {
  const name = Object.keys(ex.missions).find(k => k === query || ex.missions[k].ru === query);
  if (!name) { console.log('unknown mission: ' + query); process.exitCode = 1; return; }
  const m = ex.missions[name], pad = d => '  '.repeat(Math.max(0, d - 1));
  console.log('# ' + (m.ru || name) + ' / ' + name);
  for (const s of m.steps) console.log((s.note ? '    * ' : '- ') + (s.ru || s.en) + (s.foes ? ' [' + s.foes + ']' : ''));
  const walk = items => {
    for (const it of items) {
      if (it.t === 'step') console.log('\n## ' + (it.ru || it.en));
      else if (it.t === 'desc') console.log('[' + it.loc + '] ' + (it.ru || it.en));
      else if (it.t === 'recap') console.log('R' + it.n + (it.cut ? ' (кат-сцена)' : '') + ': ' + (it.ru || it.en));
      else if (it.t === 'act') console.log(pad(it.d) + '(' + it.en.replace(/^\(|\)$/g, '') + ')');
      else if (it.t === 'say') console.log(pad(it.d) + (ex.speakers[it.who] || it.who) + ': ' + (it.ru || '[EN] ' + it.en));
      else if (it.t === 'opt') console.log(pad(it.d) + '> ' + (it.ru || '[EN] ' + it.en));
      else if (it.t === 'msg') { console.log(pad(it.d) + 'Сообщения' + (it.title ? ' «' + it.title + '»' : '')); for (const r of it.msgs) console.log(pad(it.d) + '  ' + (ex.speakers[r.who] || r.who) + ': ' + (r.ru || '[EN] ' + r.en)); }
      else if (it.t === 'ref') console.log(pad(it.d) + '{' + it.page + '}');
      else console.log(pad(it.d || 0) + (it.ru || '[EN] ' + it.en));
    }
  };
  walk(m.items);
}

async function main() {
  const a = process.argv.slice(2), cmd = a[0] || 'check';
  const cacheArg = a.find(x => x.startsWith('--cache='));
  const cache = cacheArg ? cacheArg.slice(8) : path.join(os.tmpdir(), 'hsr-luofu');
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
  console.log('usage: node tools/hsr-luofu-import.cjs fetch|write|check [--verbose]|show <mission> [--cache=dir]');
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });

module.exports = { TEXTMAP, TEXT_FILES, UA, IMAGE_API, get, pageFile, fetchPage, loadText, makeIndex, lookup, nameRu, norm, ruText, dice, clean, pair, section, field, dialogue, readMission, readTutorial };
