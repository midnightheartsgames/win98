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
let clippyCalls = 0;
const vfsFiles = new Map();

global.window = {
  isOnline: true,
  addEventListener: () => {},
  webGif: name => `<span class="gif-${name}"></span>`,
  soundSys: { playClick: () => {}, playDing: () => {} },
  winManager: { windows: new Map(), openDialog: () => {}, createWindow: () => ({}) },
  vfs: {
    mkdir: () => {},
    writeFile: (folder, name, content) => { vfsFiles.set(folder.join('\\') + '\\' + name, content); return true; }
  },
  appNotepad: { open: (title, content) => { lastNotepadDoc = { title, content }; } },
  appClippy: { show: () => {}, onNavigateIE: () => { clippyCalls++; } }
};

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/pereplet-data.js'));
eval(read('js/apps/pereplet-site.js'));
eval(read('js/apps/ie.js'));

const ie = window.appIE;
const site = window.perepletSite;
const data = window.perepletData;
const base = 'http://www.pereplet99.ru';
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };
const camel = s => s.replace(/-([a-z])/g, (m, c) => c.toUpperCase());
const dayNum = d => { const [dd, mm, yy] = d.slice(0, 10).split('.').map(Number); return yy * 10000 + mm * 100 + dd; };

const routes = () => ['', '/shelf', '/chronicle', '/journals', '/net', '/bukinist', '/bukinist?kind=seek', '/guestbook', '/about']
  .concat(data.books.map(b => `/book?id=${b.id}`))
  .concat(data.articles.map(a => `/article?id=${a.id}`));

function env(url) {
  const state = { html: '', inputs: {}, checked: null, handler: null };
  const rootEl = {
    dataset: {},
    addEventListener(evt, fn) { if (evt === 'click') state.handler = fn; },
    querySelector(sel) {
      if (sel === 'input[name="pp-poll"]:checked') return state.checked ? { value: state.checked } : null;
      if (sel.startsWith('#')) {
        const id = sel.slice(1);
        if (!state.html.includes(`id="${id}"`)) return null;
        return {
          get value() { return state.inputs[id] || ''; },
          set value(v) { state.inputs[id] = v; }
        };
      }
      return null;
    },
    querySelectorAll() { return []; }
  };
  const container = {
    scrollTop: 0,
    querySelector(sel) { return sel === '.pp-site' ? rootEl : null; }
  };
  const mockIe = {
    currentUrl: url,
    renderPage(w, next) {
      this.currentUrl = next || this.currentUrl;
      state.html = site.renderSite(this.currentUrl);
      const m = state.html.match(/data-pp-path="([^"]*)"/);
      rootEl.dataset = { ppPath: m ? m[1] : '/' };
      state.handler = null;
      site.attachEvents({}, container, mockIe);
    }
  };
  mockIe.renderPage({}, url);
  return {
    state,
    get html() { return state.html; },
    set(id, v) { state.inputs[id] = v; },
    click(attr, value) {
      const needle = `data-pp-${attr}="${value}"`;
      assert.ok(state.html.includes(needle), `button ${needle} is on the page`);
      const dataset = { [camel(`pp-${attr}`)]: String(value) };
      state.handler({ target: { closest: () => ({ dataset }) } });
    }
  };
}

test('index.html loads pereplet-data.js before pereplet-site.js and links the stylesheet', () => {
  const html = read('index.html');
  assert.ok(html.includes('css/apps/pereplet-site.css'));
  const d = html.indexOf('js/apps/pereplet-data.js');
  const s = html.indexOf('js/apps/pereplet-site.js');
  assert.ok(d > 0 && s > d);
});

test('IE routes every pereplet99.ru address by host and lists the site in catalogs, search and the web ring', () => {
  routes().concat(['/workshop', '/news?x=1', '/guestbook#top']).forEach(p => {
    assert.strictEqual(ie.identifyPageKey(base + p), 'pereplet', p);
  });
  const cat = ie.searchDirectory.find(c => c.title === 'Книги, справки и юмор');
  assert.ok(cat && cat.sites.some(([u]) => u === base));
  ['пелевин', 'акунин', 'букер', 'шишкин', 'переплёт'].forEach(q => {
    assert.ok(ie.performSearch(q).some(r => r.url === base), q);
  });
  assert.ok(ie.renderRambler().includes(base));
  assert.ok(window.retroSites.getWebRingSites().some(s => s.url === base));
  assert.ok(window.retroSites.renderYandex('http://www.yandex.ru/?q=акунин').includes(base));
});

test('every route renders inside the binding with its own title; unknown paths give a raw Apache 404', () => {
  routes().forEach(p => {
    const html = site.renderSite(base + p);
    assert.ok(html.includes('class="pp-book"'), p);
    assert.ok(html.includes('pp-mast') && html.includes('pp-spine'), p);
    assert.ok(!site.getPageTitle(base + p).includes('404'), p);
    assert.ok(!EMOJI.test(html), `emoji on ${p}`);
  });
  assert.ok(site.renderSite(base + '/salon').includes('pp-ruled'));
  assert.ok(site.renderSite(base + '/books').includes('pp-shelf'));
  ['/workshop', '/book?id=nope', '/article?id=nope', '/forum'].forEach(p => {
    const nf = site.renderSite(base + p);
    assert.ok(nf.includes('Not Found') && nf.includes('Apache/1.3.9') && !nf.includes('pp-book'), p);
  });
});

test('each page has its own form', () => {
  const forms = {
    '': ['pp-toc-line', 'pp-titlepage'],
    '/shelf': ['pp-sp', 'pp-board', 'pp-list'],
    [`/book?id=${data.books[0].id}`]: ['pp-card', 'pp-card-hole', 'pp-where'],
    '/chronicle': ['pp-annal', 'pp-month'],
    [`/article?id=${data.articles[0].id}`]: ['pp-dropcap', 'pp-notes', 'pp-noteref'],
    '/journals': ['pp-bind', 'pp-bind-hit'],
    '/net': ['pp-win', 'pp-q', 'data-pp-modem'],
    '/bukinist': ['pp-ads', 'pp-ad'],
    '/guestbook': ['pp-gb-cover', 'pp-ruled'],
    '/about': ['pp-imprint', 'pp-imp-staff']
  };
  Object.entries(forms).forEach(([p, classes]) => {
    const html = site.renderSite(base + p);
    classes.forEach(c => assert.ok(html.includes(c), `${p} has ${c}`));
  });
});

test('the contents page lists every book and article with rising page numbers, and folios match', () => {
  const toc = site.toc();
  for (let i = 1; i < toc.length; i++) assert.ok(toc[i].folio > toc[i - 1].folio);
  data.books.forEach(b => assert.ok(toc.some(e => e.key === `book:${b.id}`), b.id));
  data.articles.forEach(a => assert.ok(toc.some(e => e.key === `article:${a.id}`), a.id));
  const home = site.renderSite(base);
  assert.strictEqual((home.match(/class="pp-toc-line/g) || []).length, toc.length);
  const art = data.articles[0];
  const entry = toc.find(e => e.key === `article:${art.id}`);
  assert.ok(site.renderSite(`${base}/article?id=${art.id}`).includes(`— ${entry.folio} —`));
  const last = toc[toc.length - 1];
  assert.ok(site.renderSite(base + last.path).includes('титул &gt;'));
});

test('catalogue cards and articles export to Notepad and My Documents', () => {
  const b = data.books[0];
  const e = env(`${base}/book?id=${b.id}`);
  e.click('notepad', `book:${b.id}`);
  assert.strictEqual(lastNotepadDoc.title, b.file);
  assert.ok(lastNotepadDoc.content.includes(b.card.heading));
  e.click('save', `book:${b.id}`);
  assert.ok(vfsFiles.has(`My Computer\\C:\\My Documents\\${b.file}`));
  assert.ok(e.html.includes('сохранён'));
  const a = data.articles[0];
  const ea = env(`${base}/article?id=${a.id}`);
  ea.click('save', `article:${a.id}`);
  const text = vfsFiles.get(`My Computer\\C:\\My Documents\\${a.file}`);
  assert.ok(text.includes(a.title.toUpperCase()));
  assert.ok(!/\{\d+\}/.test(text));
  const files = data.books.map(x => x.file).concat(data.articles.map(x => x.file));
  assert.strictEqual(new Set(files).size, files.length);
  files.forEach(f => assert.ok(/^[A-Z0-9_]{1,24}\.TXT$/.test(f), f));
});

test('footnote markers match the notes of every article', () => {
  data.articles.forEach(a => {
    const marks = a.body.join(' ').match(/\{(\d+)\}/g) || [];
    const nums = marks.map(m => Number(m.slice(1, -1)));
    assert.deepStrictEqual(nums, nums.slice().sort((x, y) => x - y), a.id);
    assert.strictEqual(nums.length, (a.notes || []).length, a.id);
    nums.forEach((n, i) => assert.strictEqual(n, i + 1, a.id));
  });
});

test('poll, comments, guestbook and ads persist in one user key and escape HTML', () => {
  const home = env(base);
  home.click('poll', '1');
  assert.ok(home.html.includes('Отметьте'));
  home.state.checked = data.poll.options[1][0];
  home.click('poll', '1');
  assert.ok(home.html.includes('Ваш голос учтён'));
  assert.strictEqual(site.savePollVote(data.poll.options[0][0]), false);

  const a = data.articles[0];
  const ea = env(`${base}/article?id=${a.id}`);
  ea.set('pp-c-name', '<b>Тестер</b>');
  ea.set('pp-c-text', 'Отклик <script>x</script>');
  ea.click('comment', a.id);
  assert.ok(ea.html.includes('&lt;b&gt;Тестер&lt;/b&gt;'));
  assert.ok(!ea.html.includes('<script>x'));

  const gb = env(`${base}/guestbook`);
  gb.click('gb', '1');
  assert.ok(gb.html.includes('Пустую запись'));
  gb.set('pp-gb-name', 'Ирина');
  gb.set('pp-gb-from', 'Пермь');
  gb.set('pp-gb-text', 'Спасибо за подшивку!');
  gb.click('gb', '1');
  assert.ok(gb.html.includes('Спасибо за подшивку!'));
  assert.ok(gb.html.includes(`№ ${data.guestbookFirstNo + data.guestbook.length}.`));

  const ads = env(`${base}/bukinist`);
  ads.set('pp-ad-kind', 'seek');
  ads.set('pp-ad-text', 'Ищу Бутова');
  ads.set('pp-ad-city', 'Омск');
  ads.click('ad', '1');
  assert.ok(ads.html.includes('Ищу Бутова'));
  assert.ok(site.renderSite(`${base}/bukinist?kind=seek`).includes('Ищу Бутова'));
  assert.ok(!site.renderSite(`${base}/bukinist?kind=give`).includes('Ищу Бутова'));

  const saved = JSON.parse(localStorage.getItem(site.userKey));
  assert.strictEqual(saved.guestbook.length, 1);
  assert.strictEqual(saved.ads.length, 1);
  assert.strictEqual(saved.comments[a.id].length, 1);
  assert.strictEqual(saved.poll, data.poll.options[1][0]);
});

test('legacy v1 storage keeps only what the reader wrote and is removed', () => {
  localStorage.store = {};
  const a = data.articles[0];
  localStorage.setItem('win98_pereplet_guestbook_v1', JSON.stringify([
    { name: 'Мой ник', city: 'Омск', date: '19.12.1999 23:30', text: 'моя запись' },
    { name: 'Сергей Волков, аспирант РГГУ', city: 'Москва', date: '18.12.1999 23:15', text: 'старая витрина' }
  ]));
  localStorage.setItem('win98_pereplet_comments_v1', JSON.stringify({
    [a.id]: [{ author: 'Я', date: '19.12.1999 22:45', text: 'мой отклик' }, { author: 'Витрина', date: '15.12.1999 00:18', text: 'старое' }],
    'pelevin-generation-p-unknown': [{ author: 'Я', date: '19.12.1999 22:45', text: 'потерянный' }]
  }));
  localStorage.setItem('win98_pereplet_poll_v1', '{}');
  const user = site.loadUser();
  assert.deepStrictEqual(user.guestbook.map(g => g.text), ['моя запись']);
  assert.deepStrictEqual(Object.keys(user.comments), [a.id]);
  assert.strictEqual(user.comments[a.id][0].text, 'мой отклик');
  ['guestbook', 'comments', 'poll', 'bookvotes'].forEach(k => assert.strictEqual(localStorage.getItem(`win98_pereplet_${k}_v1`), null));
  assert.ok(localStorage.getItem(site.userKey));
});

test('modem queue recalculates for the chosen speed and binder issues open', () => {
  const net = env(`${base}/net`);
  const before = site.modemTime(data.netFiles[0].kb, 33600);
  assert.ok(net.html.includes(before));
  net.click('modem', '14400');
  assert.strictEqual(site.modemBps, 14400);
  assert.ok(net.html.includes(site.modemTime(data.netFiles[0].kb, 14400)));
  assert.strictEqual(site.setModem('9600'), 33600);
  assert.strictEqual(site.floppies(1423).disks, 1);
  assert.strictEqual(site.modemSeconds(39, 28800), Math.round(39 * 1024 / 2448));

  const j = data.journals.find(x => x.issues.length);
  const it = j.issues[0];
  const bind = env(`${base}/journals`);
  bind.click('issue', `${j.id}:${it.n[0]}`);
  assert.ok(bind.html.includes('pp-bind-on'));
  assert.ok(bind.html.includes(site.esc(it.what)));
  assert.strictEqual(site.pickIssue(`${j.id}:13`), false);
});

test('encoding switch recodes page text, Clippy button calls the assistant', () => {
  const e = env(`${base}/about`);
  e.click('enc', 'translit');
  assert.ok(e.html.includes('Vykhodnye dannye') || e.html.includes('Vyhodnye dannye') || e.html.includes('VYKhODNYE') || /Vykhodn/i.test(e.html));
  e.click('enc', 'win1251');
  e.click('clippy', '1');
  assert.strictEqual(clippyCalls, 1);
});

test('dates stay inside the issue and staff matches other sites of the OS', () => {
  const day = dayNum(data.siteDay);
  data.chronicle.forEach(c => assert.ok(dayNum(c.date) <= day, c.date));
  data.articles.forEach(a => assert.ok(dayNum(a.date) <= day, a.id));
  data.guestbook.forEach(g => assert.ok(dayNum(g.date) <= day, g.date));
  for (let i = 1; i < data.guestbook.length; i++) assert.ok(dayNum(data.guestbook[i].date) >= dayNum(data.guestbook[i - 1].date));
  for (let i = 1; i < data.chronicle.length; i++) assert.ok(dayNum(data.chronicle[i].date) >= dayNum(data.chronicle[i - 1].date));
  const names = data.staff.map(s => s.name);
  assert.ok(names.includes('Кира Долгова'), 'corrector Vereteno_SPb from krovatka');
  assert.ok(names.includes('Лев Николаевич Вяземский'), 'bukinist from geocities');
  assert.ok(read('js/apps/krovatka-site.js').includes('Кира Долгова'));
  assert.ok(read('js/apps/geocities-site.js').includes('Лев Николаевич Вяземский'));
  data.articles.forEach(a => assert.ok(data.staff.some(s => s.id === a.by), a.id));
  data.books.forEach(b => assert.ok(data.staff.some(s => s.id === b.reviewer), b.id));
});

test('facts match the December 1999 record and invented material from the old site stays out', () => {
  const all = JSON.stringify(data);
  const buker = data.articles.find(a => a.id === 'buker-99');
  const bukerText = buker.body.join(' ') + buker.notes.join(' ');
  ['Буйда', 'Васильева', 'Гиршович', 'Маканин', 'Платова', 'Бутов', 'Азадовск', 'Славникова', 'Седакова', 'Юрский', 'Песонен', 'Метрополь', '54', 'Бибихин'].forEach(w => assert.ok(bukerText.includes(w), w));
  assert.strictEqual(data.chronicle.find(c => c.text.includes('Метрополь')).date, '25.11.1999');
  assert.ok(site.book('svoboda').card.body[0].includes('№ 1, 2'));
  assert.ok(site.book('vzyatie-izmaila').card.body[0].includes('№ 10–12'));
  assert.ok(site.book('ohota-na-ovec').card.body[0].includes('Коваленина') && site.book('ohota-na-ovec').card.body[0].includes('Азбука, 1998'));
  assert.ok(site.book('generation-p').card.body.join(' ').includes('Вагриус, 1999'));
  assert.ok(site.book('fake-mirrors').card.body[0].includes('АСТ, 1999'));
  assert.ok(site.book('goluboe-salo').card.body[0].includes('Ad Marginem, 1999'));
  assert.deepStrictEqual(data.journals.find(j => j.id === 'znamya').issues.find(i => i.book === 'vzyatie-izmaila').n, [10, 11, 12]);
  assert.deepStrictEqual(data.journals.find(j => j.id === 'nm').issues[0].n, [1, 2]);
  assert.ok(data.chronicle.some(c => c.date === '30.09.1999' && c.text.includes('Грасс')));
  assert.ok(data.chronicle.some(c => c.date === '25.10.1999' && c.text.includes('Кутзее')));
  assert.ok(data.chronicle.some(c => c.date === '19.12.1999' && c.text.includes('Выборы')));
  assert.ok(all.includes('infoart.ru/magazine') && !all.includes('magazines.russ.ru'));
  ['Ковалевич', 'Мессия очищает диск', 'Кысь', 'Книга Одиночеств', 'Росмэн', 'Тенёта-Ринет\'99', 'Антибукер', 'Premise', 'The Lie', 'Курицын', 'Данилкин', 'Басинский', 'Парамонов', 'Кормильцев', 'Немзер', 'Асланян', 'Мастерская'].forEach(w => {
    assert.ok(!all.includes(w), `${w} must not come back`);
  });
  assert.ok(!all.includes('Амфора'), 'Frei and Murakami were not Amfora books in 1999');
});

test('source keeps Win98 web rules: no comments, emoji, rgba, radius or flex', () => {
  const js = read('js/apps/pereplet-site.js') + read('js/apps/pereplet-data.js');
  const css = read('css/apps/pereplet-site.css');
  assert.ok(!/\/\*|\*\/|^\s*\/\//m.test(js), 'no comments in js');
  assert.ok(!/\/\*/.test(css), 'no comments in css');
  assert.ok(!EMOJI.test(js), 'no emoji');
  assert.ok(!/rgba|border-radius|blur\(|display:\s*flex|display:\s*grid/.test(css));
  assert.ok(!/Microsoft|Windows/.test(js.replace(/'Microsoft Sans Serif'/g, '')));
});

console.log(`All ${passed} Pereplet '99 tests passed!`);
