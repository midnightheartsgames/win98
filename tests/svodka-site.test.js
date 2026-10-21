const fs = require('fs');
const path = require('path');
const assert = require('assert');

global.localStorage = {
  store: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

let lastNotepadDoc = null;
const vfsFiles = new Map();

global.window = {
  isOnline: true,
  addEventListener: () => {},
  webGif: (name) => `<span class="gif-${name}"></span>`,
  soundSys: { playClick: () => {}, playDing: () => {} },
  winManager: { windows: new Map(), openDialog: () => {}, createWindow: () => ({}) },
  vfs: {
    mkdir: () => {},
    writeFile: (folderArr, fileName, content) => {
      vfsFiles.set(folderArr.join('\\') + '\\' + fileName, content);
      return true;
    }
  },
  appNotepad: { open: (title, content) => { lastNotepadDoc = { title, content }; } }
};

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/svodka-data.js'));
eval(read('js/apps/svodka-site.js'));
eval(read('js/apps/ie.js'));
eval(read('js/apps/clippy-help.js'));
eval(read('js/apps/clippy-tips.js'));

const ie = window.appIE;
const site = window.svodkaSite;
const data = window.svodkaData;
const base = 'http://www.svodka99.ru';
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
const text = html => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

const routes = [
  base, base + '/lenta', base + '/lenta?cat=space', base + '/lenta?urgent=1', base + '/lenta?q=celeron',
  base + '/article?id=y2k-russia-ready', base + '/print?id=station-mir-2000',
  base + '/dossiers', base + '/dossiers?id=art-usr-courier', base + '/dossiers?box=factions',
  base + '/economy', base + '/economy?sum=1800&profile=student&tariff=day',
  base + '/editorial', base + '/y2k', base + '/telegraph', base + '/telegraph?rubric=mir', base + '/about'
];

test('IE routes svodka99.ru and lists it in catalogs, search, Yandex, WebRing and Clippy', () => {
  assert.strictEqual(ie.identifyPageKey(base), 'svodka');
  assert.strictEqual(ie.identifyPageKey(base + '/lenta'), 'svodka');
  assert.strictEqual(ie.identifyPageKey(base + '/dossiers?id=mmts9'), 'svodka');
  routes.forEach(r => assert.strictEqual(ie.identifyPageKey(r), 'svodka', r));
  const portals = ie.searchDirectory.find(c => c.title === 'Поиск и порталы');
  assert.ok(portals.sites.some(([u]) => u === base));
  assert.ok(ie.performSearch('сводка').some(r => r.url === base));
  assert.ok(ie.renderRambler().includes(base));
  assert.ok(window.retroSites.renderYandex('http://www.yandex.ru/?q=сводка').includes(base));
  assert.ok(window.retroSites.getWebRingSites().some(s => s.url === base));
  assert.strictEqual(window.clippyHelp.search('сводка')[0].entry.id, 'svodka-site');
  assert.ok(window.clippyTips.catalog['svodka-99']);
});

test('Every route renders inside the site shell, unknown paths give a raw Apache 404', () => {
  for (const r of routes) {
    const html = site.renderSite(r);
    if (r.includes('/print')) {
      assert.ok(html.includes('svd-print') && !html.includes('svd-nav'), 'print version has no site chrome');
    } else {
      assert.ok(html.includes('class="svd-site'), r);
      assert.ok(html.includes('svd-mast'), r);
    }
    assert.notStrictEqual(site.getPageTitle(r), '404 Not Found', r);
  }
  for (const bad of ['/news', '/article?id=nope', '/print?id=nope', '/cgi-bin/test.pl']) {
    const html = site.renderSite(base + bad);
    assert.ok(html.includes('Apache/1.3.9 Server at www.svodka99.ru'), bad);
    assert.ok(!html.includes('svd-nav'), bad);
    assert.strictEqual(site.getPageTitle(base + bad), '404 Not Found');
  }
  assert.ok(site.renderSite(base + '/index.html').includes('svd-front'));
});

test('Internal links all lead to existing pages', () => {
  const seen = new Set();
  for (const r of routes) {
    const html = site.renderSite(r);
    for (const m of html.matchAll(/data-url="([^"]+)"/g)) {
      const u = m[1].replace(/&amp;/g, '&');
      if (!u.startsWith(base) || seen.has(u)) continue;
      seen.add(u);
      assert.notStrictEqual(site.parseRoute(u).page, '404', u);
      assert.ok(!site.renderSite(u).includes('Apache/1.3.9'), u);
    }
  }
  assert.ok(seen.size > 40);
});

test('Official CBR rates match the Bank of Russia archive for 28 and 29 December 1999', () => {
  const rate = code => data.cbr.rows.find(r => r.code === code);
  assert.deepStrictEqual([rate('USD').today, rate('USD').next], ['26,9500', '27,0000']);
  assert.deepStrictEqual([rate('EUR').today, rate('EUR').next], ['27,3300', '27,3200']);
  assert.deepStrictEqual([rate('DEM').today, rate('DEM').next], ['13,9800', '13,9700']);
  assert.deepStrictEqual([rate('GBP').today, rate('UAH').today, rate('JPY').today], ['43,5800', '49,7700', '26,2700']);
  const econ = site.renderSite(base + '/economy');
  assert.ok(econ.includes('26,9500') && econ.includes('27,0000'));
  assert.strictEqual(data.prices[0].slice(1).join('|'), '6,20|20,65|26,95');
  assert.strictEqual(data.prices.find(p => p[0].includes('метро')).slice(1).join('|'), '2,00|3,00|4,00');
});

test('Facts: ministry name, Duma barrier and results, Mir crew, no invented statistics', () => {
  const all = routes.map(r => text(site.renderSite(r))).join(' ') + JSON.stringify(data);
  for (const banned of ['Госкомсвязь', 'Госкомсвязи', 'шестипроцентн', '318 км', 'Мосгортранс', '84%', '99,4%', 'ледяных часах', 'M9-IX', '3,2 млрд']) {
    assert.ok(!all.includes(banned), `banned fact: ${banned}`);
  }
  assert.ok(all.includes('пятипроцентный барьер'));
  assert.ok(all.includes('12 ноября 1999'));
  const duma = data.wire.find(w => w.id === 'w1710').text;
  for (const p of ['24,29%', '23,32%', '13,33%', '8,52%', '5,98%', '5,93%', '61,85%', '18 января 2000']) assert.ok(duma.includes(p), p);
  const mir = data.articles.find(a => a.id === 'station-mir-2000');
  assert.ok(JSON.stringify(mir).includes('28 августа 1999') && JSON.stringify(mir).includes('20 февраля 1986'));
  assert.ok(JSON.stringify(data.articles.find(a => a.id === 'books-cinema-end99')).includes('Михаил Бутов, «Свобода»'));
});

test('Site day, countdown and midnight table are consistent', () => {
  const now = Date.UTC(1999, 11, 28, 18, 45);
  const left = (Date.UTC(2000, 0, 1, 0, 0) - now) / 60000;
  assert.strictEqual(data.countdown, `${Math.floor(left / 1440)} дн. 0${Math.floor(left % 1440 / 60)} ч. ${left % 60} мин.`);
  assert.strictEqual(new Date(now).getUTCDay(), 2);
  assert.strictEqual(data.midnight.length, 11);
  data.midnight.forEach(([, msk], i) => assert.strictEqual(msk, `${String((15 + i) % 24).padStart(2, '0')}:00`));
  const first = (Date.UTC(1999, 11, 31, 15, 0) - now) / 60000;
  assert.ok(site.renderSite(base + '/y2k').includes(`${Math.floor(first / 1440)} дн. ${Math.floor(first % 1440 / 60)} ч. ${first % 60} мин.`));
  let start = 31 + 30 + 31 + 30 + 31 + 31 + 30 + 31 + 30 + 28;
  assert.strictEqual(data.issue, start);
});

test('Content cross-references are valid', () => {
  assert.strictEqual(data.wire.length, 12);
  assert.strictEqual(data.articles.length, 8);
  assert.strictEqual(data.cards.length, 18);
  data.wire.forEach(w => {
    assert.ok(site.article(w.article), w.id);
    assert.ok(site.card(w.card), w.id);
    assert.ok(site.rubric(w.cat), w.id);
  });
  data.articles.forEach(a => {
    assert.ok(site.rubric(a.cat), a.id);
    a.cards.forEach(c => assert.ok(site.card(c), `${a.id} -> ${c}`));
  });
  data.cards.forEach(c => {
    assert.ok(data.drawers.some(d => d.id === c.drawer), c.id);
    c.refs.forEach(r => assert.ok(site.article(r) || site.card(r), `${c.id} -> ${r}`));
    c.links.forEach(([u]) => assert.notStrictEqual(ie.identifyPageKey(u), 'search', u));
  });
});

test('Lenta filters by rubric, urgency and query from the URL and marks the linked dispatch', () => {
  assert.strictEqual(site.filterWire({ cat: 'space' }).length, 2);
  assert.ok(site.filterWire({ urgent: '1' }).every(w => w.urgent));
  assert.strictEqual(site.filterWire({ q: 'celeron' }).length, 1);
  const html = site.renderSite(base + '/lenta?id=w1748');
  assert.ok(html.includes('data-svd-current="1"'));
  assert.ok(site.renderSite(base + '/lenta?q=zzzz').includes('ДЕПЕШ НЕ НАЙДЕНО'));
  assert.strictEqual(site.lentaUrl({ cat: 'net', urgent: '1', q: 'модем' }), base + '/lenta?cat=net&urgent=1&q=%D0%BC%D0%BE%D0%B4%D0%B5%D0%BC');
});

test('Money calculator reads GET parameters and clamps bad input', () => {
  const r = site.calculate(site.calcInput({ sum: '2695', profile: 'sysadmin', tariff: 'night' }));
  assert.strictEqual(r.usd.toFixed(2), '100.00');
  assert.strictEqual(r.goods.find(g => g.name.includes('шампанское')).count, 39);
  assert.deepStrictEqual(site.calcInput({ sum: '-5', profile: 'hacker', tariff: 'x' }), { sum: 100, profile: 'family', tariff: 'night' });
  assert.strictEqual(site.calcInput({ sum: '99999999' }).sum, 500000);
  assert.strictEqual(site.calcInput({}).sum, 2695);
  const html = site.renderSite(base + '/economy?sum=1800&profile=student&tariff=day');
  assert.ok(html.includes('Ведомость на 1\u00a0800 руб.'));
  assert.ok(html.includes('value="day" selected'));
});

test('Proof desk strikes stamps in the draft and leaves the clean sample alone', () => {
  const slop = site.proofCheck(data.samples.slop);
  assert.ok(slop.hits.length >= 12, `hits ${slop.hits.length}`);
  assert.ok(slop.water >= 30);
  assert.ok(slop.verdict.startsWith('Канцелярит'));
  const clean = site.proofCheck(data.samples.clean);
  assert.strictEqual(clean.hits.length, 0, JSON.stringify(clean.hits));
  assert.strictEqual(site.proofCheck('Это заданный вопрос.').hits.length, 0);
  assert.strictEqual(site.proofCheck('Данный вопрос.').hits.length, 1);
  const marked = site.proofMarkup(site.proofCheck('<script>x</script> в преддверии праздника'));
  assert.ok(!marked.includes('<script>') && marked.includes('<del class="svd-stamp">в преддверии</del>'));
  site.proofText = data.samples.slop;
  site.proofChecked = true;
  const html = site.renderSite(base + '/editorial');
  assert.ok(html.includes('svd-stamp') && html.includes('Канцелярит'));
});

test('Telegrams are rewritten in telegraph style, escaped and filtered by rubric', () => {
  assert.strictEqual(site.toTelegram('Привет, Москва! Ждём 2000.'), 'ПРИВЕТ ЗПТ МОСКВА ТЧК ЖДЁМ 2000');
  assert.strictEqual(site.telegramWords('Привет, Москва! Ждём 2000.'), 6);
  assert.strictEqual(site.toTelegram('С 31.12.1999 правим AUTOEXEC.BAT, курс 27,30.'), 'С 31.12.1999 ПРАВИМ AUTOEXEC.BAT ЗПТ КУРС 27,30');
  assert.ok(site.telegramStrips('слово '.repeat(30)).every(s => s.length <= 40));
  site.addTelegram({ name: '<b>Виктор</b>', city: 'Екатеринбург', rubric: 'y2k', kind: 'urgent', text: 'На Урале мороз, серверы проверены <img src=x>' });
  const html = site.renderSite(base + '/telegraph?rubric=y2k');
  assert.ok(html.includes('&lt;b&gt;Виктор&lt;/b&gt;') && !html.includes('<img src=x>'));
  assert.ok(html.includes('НА УРАЛЕ МОРОЗ ЗПТ СЕРВЕРЫ ПРОВЕРЕНЫ'));
  assert.ok(!html.includes('КАЖДЫЙ ВЕЧЕР СМОТРИМ'));
  assert.ok(site.renderSite(base + '/telegraph?rubric=mir').includes('ЗВЁЗДОЧКА'));
  assert.strictEqual(site.addTelegram({ text: '   ' }), null);
});

test('Old v1 storage is migrated once and removed', () => {
  localStorage.store = {};
  localStorage.setItem('win98_svodka_poll_v1', JSON.stringify({ normal: 413, votedChoice: 'normal' }));
  localStorage.setItem('win98_svodka_comments_v1', JSON.stringify({
    'station-mir-2000': [{ author: 'Баллистик_99', date: 'x', text: 'Станция встретит XXI век!' }, data.comments['station-mir-2000'][0]],
    'unknown-id': [{ author: 'a', text: 'b' }]
  }));
  localStorage.setItem('win98_svodka_telegraph_v1', JSON.stringify([{ id: 'tg-user-1', name: 'Оля', city: 'Тверь', rubric: 'mir', text: 'Ура' }, { id: 'tg-1', name: 'seed', text: 'seed' }]));
  localStorage.setItem('win98_svodka_y2kcheck_v1', JSON.stringify({ bios: true, antivirus: true, junk: true }));
  const user = site.loadUser();
  assert.strictEqual(user.poll, 'normal');
  assert.deepStrictEqual(Object.keys(user.comments), ['station-mir-2000']);
  assert.strictEqual(user.comments['station-mir-2000'].length, 1);
  assert.strictEqual(user.telegrams.length, 1);
  assert.deepStrictEqual(user.checks, { bios: true, antivirus: true });
  for (const k of ['win98_svodka_poll_v1', 'win98_svodka_comments_v1', 'win98_svodka_telegraph_v1', 'win98_svodka_y2kcheck_v1']) {
    assert.strictEqual(localStorage.getItem(k), null, k);
  }
  assert.ok(localStorage.getItem('win98_svodka_user_v2'));
  assert.ok(site.renderSite(base + '/article?id=station-mir-2000').includes('Баллистик_99'));
  assert.strictEqual(site.pollCounts(site.loadUser()).normal, data.poll.seed.normal + 1);
});

test('Articles, cards, ledger and proof are saved to My Documents and opened in Notepad', () => {
  assert.strictEqual(site.saveDoc('article', 'y2k-russia-ready'), 'SVODKA_Y2K_RUSSIA_1999.TXT');
  assert.ok(vfsFiles.get('My Computer\\C:\\My Documents\\SVODKA_Y2K_RUSSIA_1999.TXT').includes('НОЧЬ ДВУХ НУЛЕЙ'));
  assert.strictEqual(site.saveDoc('card', 'art-usr-courier'), 'KARTOTEKA_ART_USR_COURIER.TXT');
  assert.ok(vfsFiles.get('My Computer\\C:\\My Documents\\KARTOTEKA_ART_USR_COURIER.TXT').includes('В-2'));
  assert.strictEqual(site.saveDoc('calc', null, { sum: '2695' }), 'BYUDZHET_DEKABR_1999.TXT');
  assert.ok(vfsFiles.get('My Computer\\C:\\My Documents\\BYUDZHET_DEKABR_1999.TXT').includes('В долларах: 100,00'));
  site.proofText = 'На сегодняшний день всё хорошо.';
  site.openDoc('proof');
  assert.strictEqual(lastNotepadDoc.title, 'PRAVKA_1999.TXT');
  assert.ok(lastNotepadDoc.content.includes('«На сегодняшний день» -> сегодня'));
  assert.strictEqual(site.saveDoc('article', 'nope'), null);
  data.articles.forEach(a => assert.ok(site.articleText(a).split('\r\n').length > 10));
});

test('Encoding links: KOI shows mojibake with a fix bar, LAT shows translit', () => {
  site.encoding = 'koi8';
  const koi = site.renderSite(base);
  assert.ok(koi.includes('svd-encbar') && !text(koi).includes('Первая полоса'));
  assert.ok(text(koi).includes('рЕТЧБС РПМПУБ'));
  site.encoding = 'translit';
  assert.ok(text(site.renderSite(base)).includes('Pervaya polosa'));
  site.encoding = 'win1251';
});

test('Clicks in the page: poll, comment, telegram, calculator and proof', () => {
  const makeEl = (dataset, extra = {}) => Object.assign({ dataset, closest() { return this; } }, extra);
  const inputs = {
    '#svd-c-text': { value: 'Отличный выпуск' }, '#svd-c-name': { value: 'Тестер' },
    '#svd-tg-text': { value: 'Привет из Перми.' }, '#svd-tg-name': { value: 'Пермяк' }, '#svd-tg-city': { value: 'Пермь' },
    '#svd-tg-contact': { value: '' }, '#svd-tg-rubric': { value: 'net' }, 'input[name="svd-tg-kind"]:checked': { value: 'urgent' },
    'input[name="svd-poll"]:checked': { value: 'glitch' },
    '#svd-calc-sum': { value: '5 000' }, '#svd-calc-profile': { value: 'student' }, '#svd-calc-tariff': { value: 'day' },
    '#svd-proof-text': { value: 'В рамках проверки' }
  };
  let handler = null;
  const navigated = [];
  let renders = 0;
  const rootEl = {
    dataset: { svdPath: '/telegraph' },
    querySelector: sel => inputs[sel] || null,
    addEventListener: (type, fn) => { if (type === 'click') handler = fn; }
  };
  const container = { scrollTop: 0, querySelector: sel => (sel === '.svd-site' ? rootEl : null) };
  const fakeIe = { currentUrl: base + '/telegraph', renderPage: () => { renders++; }, navigate: (w, u) => navigated.push(u) };
  site.attachEvents({}, container, fakeIe);
  handler({ target: makeEl({ svdPoll: '1' }) });
  assert.strictEqual(site.loadUser().poll, 'glitch');
  handler({ target: makeEl({ svdComment: 'ruble-27-recovery' }) });
  assert.ok(site.getComments('ruble-27-recovery').some(c => c.author === 'Тестер'));
  handler({ target: makeEl({ svdTg: '1' }) });
  const tg = site.getTelegrams()[0];
  assert.strictEqual(tg.name, 'Пермяк');
  assert.strictEqual(tg.kind, 'urgent');
  handler({ target: makeEl({ svdCalc: '1' }) });
  assert.strictEqual(navigated.pop(), base + '/economy?sum=5000&profile=student&tariff=day');
  handler({ target: makeEl({ svdProof: 'check' }) });
  assert.strictEqual(site.proofText, 'В рамках проверки');
  assert.strictEqual(site.proofCheck(site.proofText).hits.length, 1);
  assert.ok(renders >= 4);
  assert.ok(site.renderSite(base + '/telegraph').includes('Телеграмма принята.'));
});

test('Clippy and Outlook point only to existing svodka pages and current facts', () => {
  const clippy = read('js/apps/clippy.js');
  const block = clippy.slice(clippy.indexOf("'svodka': {"), clippy.indexOf("'zooportal': {"));
  const urls = [...block.matchAll(/navigateIE\('([^']+)'\)/g)].map(m => m[1]);
  assert.ok(urls.length >= 3);
  urls.forEach(u => assert.notStrictEqual(site.parseRoute(u).page, '404', u));
  assert.ok(!block.includes('Госкомсвязь'));
  const outlook = read('js/apps/outlook-mail.js');
  const mail = outlook.slice(outlook.indexOf("addr: 'editor@svodka99.ru'"), outlook.indexOf("addr: 'webmaster@carman99.ru'"));
  [...mail.matchAll(/http:\/{2}www\.svodka99\.ru[^\s,.)`'"]*/g)].forEach(m => assert.notStrictEqual(site.parseRoute(m[0]).page, '404', m[0]));
  assert.ok(!mail.includes('Госкомсвязи') && !mail.includes('8,1%'));
  assert.ok(read('js/apps/svodka-site.js').includes('mailto:editor@svodka99.ru'));
  assert.ok(read('index.html').indexOf('svodka-data.js') < read('index.html').indexOf('svodka-site.js'));
});

test('Naming rule, no emoji, Web 1.0 CSS and zero comments policy', () => {
  for (const r of routes) {
    const html = site.renderSite(r);
    assert.ok(!/Microsoft|MICROSOFT|Windows|WINDOWS/.test(text(html)), `Forbidden brand name on ${r}`);
    assert.ok(!EMOJI.test(html), `Forbidden emoji on ${r}`);
  }
  const css = read('css/apps/svodka-site.css');
  for (const bad of ['border-radius', 'rgba(', 'transition', 'display: flex', 'gradient', 'blur(', 'text-shadow', 'animation']) {
    assert.ok(!css.includes(bad), `CSS uses ${bad}`);
  }
  css.split('\n').forEach(line => {
    const sel = line.trim();
    if (sel.endsWith('{') && !sel.startsWith('@')) assert.ok(sel.startsWith('.svd-'), `Unscoped selector ${sel}`);
  });
  for (const rel of ['js/apps/svodka-data.js', 'js/apps/svodka-site.js', 'css/apps/svodka-site.css', 'tests/svodka-site.test.js']) {
    const src = read(rel);
    assert.ok(!src.includes('/' + '*'), `Block comment in ${rel}`);
    src.split('\n').forEach((line, idx) => {
      assert.ok(!line.trim().startsWith('//'), `Line comment in ${rel}:${idx + 1}`);
      assert.ok(!/[;{}]\s*\/\/\s/.test(line), `Trailing comment in ${rel}:${idx + 1}`);
    });
  }
});

console.log(`All ${passed} Svodka.ru '99 tests passed!`);
