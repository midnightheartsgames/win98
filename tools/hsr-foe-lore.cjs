const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/hsr98');
const OUT = path.join(DIR, 'hsr-foe-lore.js');
const API = 'https://honkai-star-rail.fandom.com/ru/api.php';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const TITLE = {
  iceedge: 'Ледяное лезвие (1)',
  gepard_b: 'Гепард (Босс)',
  cocolia1: 'Коколия (Босс)',
  cocolia_echo: 'Коколия, Мать обмана',
  skaracabaz: 'Повелитель жуков «Разрушитель звёзд»: Скаракабаз (синтетический)',
  danshu: 'Вознёсшаяся',
  svarog_hand: 'Вспомогательный робот-манипулятор'
};

const ALIAS = { skaracabaz_e: 'skaracabaz', skaracabaz_e2: 'skaracabaz', phantylia_x: 'phantylia', trotter_big: 'trotter', ebon_r: 'ebon' };

const FIX = {
  doomsday: [['Ядро Зверя Судного дня — это двигатель', 'Ядром Зверя Судного дня служит двигатель']],
  skaracabaz: [['Первоначальная же форма — огромная', 'Первоначальная же форма: огромная']],
  bronya_b: [['Броня — юная преемница', 'Броня: юная преемница'], ['?» — раздумывала Броня.', '?» Так раздумывала Броня.']],
  lupus: [['Древесные волки — одни из', 'Древесные волки были одними из']],
  ghound: [['Золотые гончие — одни из', 'Золотые гончие были одними из']],
  ape: [['Могучие приматы — одни из', 'Могучие приматы были одними из']],
  cocolia_x: [['Прототип — хранительница', 'Прототип: хранительница']]
};

const OWN = {
  ks_toad: 'Гигантские жабы водятся на равнинах у Акселя. Весной они выходят на охоту и глотают добычу целиком: коз с окрестных ферм и зазевавшихся людей. Добычу в металлических доспехах они стараются не трогать. Гильдия авантюристов платит за каждую жабу, и задание «Гигантские жабы, пять штук» висит на доске постоянно.',
  ks_toad_blue: 'Синяя разновидность гигантской жабы. Она плюётся льдом, холод ей не страшен, а огонь и молния бьют по ней больнее.',
  ks_toad_gold: 'Золотая жаба крупнее и крепче обычных. Прыгает так тяжело, что задевает всех вокруг. Гильдия платит за неё отдельную премию.',
  ks_goblin: 'Гоблины живут в лесах у Акселя и нападают толпой. Поодиночке они слабы, поэтому бьют дубинами всей стаей.',
  ks_goblin_shaman: 'Шаман ходит со стаей гоблинов. Он бросает огоньки и бьёт в бубен, подгоняя собратьев в бой.',
  ks_doll: 'Маленькие куклы в маске Ванира. Они бродят по подземелью, хихикают и бросаются на чужаков, а потом взрываются.',
  ks_turret: 'Каменная турель со спины ранней модели Разрушителя. Стреляет камнями прицельно и залпом.',
  ks_spider: 'Мелкий каменный паук со спины ранней модели Разрушителя. Кусается и опутывает цель каменной сетью, которая сковывает движения.',
  ks_proto: 'Ранняя модель Разрушителя: каменный паук размером с дом с вечным кристаллом в груди. Он спал в нижнем зале подземелья, пока его не коснулась кукла Герты. Проснувшись, голем пошёл на Аксель и у южных ворот выпустил каменные турели и пауков. Сквозь его барьер урон проходит, только когда в отряде есть Аква.',
  ks_gator: 'Свирепые аллигаторы живут в камышах озера у Акселя. Когда вода в озере испортилась, очищать её пришлось из железной клетки, потому что аллигаторы нападают на любого у воды.',
  ks_gator_big: 'Самый крупный аллигатор озера и вожак стаи. Его хвост задевает всех вокруг.',
  ethereal: 'Эфириалы появляются в Кавернах, где всё пропитано эфиром. Иногда они выходят наружу через разрывы. Побеждённый эфириал тает и оставляет осколок эфира.',
  etherhound: 'Эфириал в облике гончей, быстрее и сильнее обычных. Его вой разносится по всей каверне.',
  mimic: 'Подражатели говорят голосами тех, кого человек потерял. Этот спустился к Белобогу и заговорил с Броней голосом Коколии. Он умеет звать из каверны других эфириалов.',
  timekiller: 'Рейнджер пустоты, который приходит в бои Валютных войн, когда партия открывается с условием «Убийца времени». Каждый его удар отнимает у отсчёта партии 7.',
  dunn: 'Данн отвечает за линии снабжения Запретной зоны Среброгривых Стражей: боеприпасы, логистику и энергию. До военной службы он играл на клавишных в рок-группе, но ушёл из неё, чтобы защищать Белобог от Фрагментума.'
};

function loadGame() {
  const noop = () => { };
  const ctx = new Proxy({}, { get: (t, k) => (k === 'measureText' ? s => ({ width: String(s).length * 6 }) : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop: noop }) : k === 'createPattern' ? () => ({}) : noop), set: () => true });
  Object.assign(globalThis, {
    document: { createElement: () => ({ width: 1, height: 1, style: {}, getContext: () => ctx, addEventListener: noop, appendChild: noop }), querySelector: () => null, addEventListener: noop, removeEventListener: noop },
    localStorage: { getItem: () => null, setItem: noop, removeItem: noop }, requestAnimationFrame: () => 1, cancelAnimationFrame: noop
  });
  const page = fs.readFileSync(path.join(ROOT, 'hsr98.html'), 'utf8');
  const listed = [...page.matchAll(/js\/apps\/hsr98\/(hsr-[a-z0-9-]+)\.js/g)].map(m => m[1]);
  const H = require(path.join(DIR, 'hsr-core.js'));
  for (const f of listed.filter(x => x !== 'hsr-bug' && x !== 'hsr-ui-bug' && x !== 'hsr-foe-lore')) require(path.join(DIR, f + '.js'));
  return H;
}

const titleOf = (H, id) => TITLE[id] || H.ENEMIES[id].name;

function clean(raw) {
  let s = raw;
  s = s.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '').replace(/<br\s*\/?>/gi, '\n');
  for (let i = 0; i < 4; i++) s = s.replace(/\{\{[^{}|]*\|([^{}]*)\}\}/g, (m, inner) => inner.split('|').pop());
  s = s.replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1').replace(/\[\[([^\]]*)\]\]/g, '$1');
  s = s.replace(/'''?/g, '').replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, '');
  return s.split('\n').map(l => l.trim()).filter(Boolean).join('\n');
}

function description(wiki) {
  const at = wiki.search(/==\s*Описание\s*==/);
  if (at < 0) return null;
  const body = wiki.slice(at).replace(/^==\s*Описание\s*==/, '');
  const next = body.search(/\n==[^=]/);
  const part = next >= 0 ? body.slice(0, next) : body;
  const tpl = part.indexOf('{{Описание|');
  if (tpl < 0) return clean(part) || null;
  let depth = 0, i = tpl;
  for (; i < part.length; i++) {
    if (part.startsWith('{{', i)) { depth++; i++; } else if (part.startsWith('}}', i)) { depth--; i++; if (!depth) break; }
  }
  return clean(firstParam(part.slice(tpl + '{{Описание|'.length, i - 1))) || null;
}

function firstParam(inner) {
  let depth = 0;
  for (let i = 0; i < inner.length; i++) {
    if (inner.startsWith('{{', i) || inner.startsWith('[[', i)) { depth++; i++; } else if (inner.startsWith('}}', i) || inner.startsWith(']]', i)) { depth--; i++; } else if (inner[i] === '|' && !depth) return inner.slice(0, i);
  }
  return inner;
}

function applyFix(id, text) {
  let t = text;
  for (const [from, to] of FIX[id] || []) {
    if (!t.includes(from)) throw new Error('FIX for ' + id + ' does not match: ' + from);
    t = t.replace(from, to);
  }
  return t;
}

async function fetchAll(H, cache) {
  const titles = [...new Set(Object.keys(H.ENEMIES).filter(id => !ALIAS[id] && !OWN[id]).map(id => titleOf(H, id)))];
  const out = {};
  for (let i = 0; i < titles.length; i += 40) {
    const chunk = titles.slice(i, i + 40);
    const url = API + '?' + new URLSearchParams({ action: 'query', prop: 'revisions', rvprop: 'content', rvslots: 'main', titles: chunk.join('|'), format: 'json', redirects: '1' });
    const d = await (await fetch(url, { headers: { 'User-Agent': UA } })).json();
    const norm = new Map((d.query.normalized || []).map(x => [x.to, x.from]));
    const red = new Map((d.query.redirects || []).map(x => [x.to, norm.get(x.from) || x.from]));
    for (const p of Object.values(d.query.pages)) {
      const from = red.get(p.title) || norm.get(p.title) || p.title;
      out[from] = p.revisions ? p.revisions[0].slots.main['*'] : null;
    }
  }
  fs.mkdirSync(cache, { recursive: true });
  fs.writeFileSync(path.join(cache, 'ru.json'), JSON.stringify(out));
  return out;
}

function build(H, pages) {
  const lore = {}, miss = [];
  for (const id of Object.keys(H.ENEMIES)) {
    if (ALIAS[id]) continue;
    if (OWN[id]) { lore[id] = OWN[id]; continue; }
    const wiki = pages[titleOf(H, id)];
    const text = wiki ? description(wiki) : null;
    if (text) lore[id] = applyFix(id, text); else miss.push(id);
  }
  return { lore, miss };
}

function write(lore) {
  const q = s => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/ /g, '\\u00a0') + "'";
  const body = Object.keys(lore).sort().map(id => '    ' + id + ': ' + q(lore[id])).join(',\n');
  const alias = Object.keys(ALIAS).sort().map(id => id + ': ' + q(ALIAS[id])).join(', ');
  const src = "(function (H) {\n  'use strict';\n  H.FOE_LORE = {\n" + body + "\n  };\n  H.FOE_LORE_ALIAS = { " + alias + " };\n  H.foeLore = id => H.FOE_LORE[H.FOE_LORE_ALIAS[id] || id] || null;\n\n  if (typeof module !== 'undefined') module.exports = H;\n})(globalThis.Hsr98 = globalThis.Hsr98 || {});\n";
  fs.writeFileSync(OUT, src);
}

(async () => {
  const a = process.argv.slice(2), cmd = a[0] || 'check';
  const cacheArg = a.find(x => x.startsWith('--cache='));
  const cache = cacheArg ? cacheArg.slice(8) : path.join(os.tmpdir(), 'hsr-foe-lore');
  const H = loadGame();
  const cached = () => JSON.parse(fs.readFileSync(path.join(cache, 'ru.json'), 'utf8'));
  if (cmd === 'fetch') { const p = await fetchAll(H, cache); console.log('pages ' + Object.keys(p).length + ' cached in ' + cache); return; }
  if (cmd === 'write') {
    const { lore, miss } = build(H, cached());
    write(lore);
    console.log('written ' + Object.keys(lore).length + ' texts to ' + path.relative(ROOT, OUT) + (miss.length ? '; without text: ' + miss.join(', ') : ''));
    return;
  }
  if (cmd === 'show') { const { lore } = build(H, cached()); const id = a[1]; console.log(lore[ALIAS[id] || id] || '(нет текста)'); return; }
  const { lore, miss } = build(H, cached());
  const dash = Object.keys(lore).filter(id => lore[id].includes('—'));
  const junk = Object.keys(lore).filter(id => /[{}[\]|=]|https?:/.test(lore[id]));
  console.log('enemies ' + Object.keys(H.ENEMIES).length + ', texts ' + Object.keys(lore).length + ', aliases ' + Object.keys(ALIAS).length);
  console.log('without text: ' + (miss.join(', ') || 'none'));
  console.log('with long dashes: ' + (dash.join(', ') || 'none'));
  console.log('with wiki markup left: ' + (junk.join(', ') || 'none'));
})();
