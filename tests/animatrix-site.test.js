const fs = require('fs');
const path = require('path');
const assert = require('assert');

global.localStorage = {
  store: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
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
  appNotepad: {
    open: (title, content) => { lastNotepadDoc = { title, content }; }
  }
};

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/animatrix-data.js'));
eval(read('js/apps/animatrix-site.js'));
eval(read('js/apps/ie.js'));

const ie = window.appIE;
const site = window.animatrixSite;
const data = window.animatrixData;
const base = 'http://www.animatrix99.ru';
const page = p => site.renderSite(base + p);
const fresh = () => {
  localStorage.clear();
  site.encoding = 'win1251';
  site.transcription = 'polivanov';
  site.notice = null;
};
let passed = 0;
const test = (name, fn) => { fresh(); fn(); passed++; console.log('  ok -', name); };

test('IE routes animatrix99.ru by host, before broad keys, and lists it in directories', () => {
  assert.strictEqual(ie.identifyPageKey(base), 'animatrix');
  ['/catalog', '/tape?id=lain-98', '/fansub?scene=eva-ep26', '/articles?rubric=Показ', '/clubs?city=spb', '/swap', '/guestbook', '/polivanov?q=Shinji', '/article?id=diy-fansub-station-win98']
    .forEach(p => assert.strictEqual(ie.identifyPageKey(base + p), 'animatrix', p));
  assert.strictEqual(ie.identifyPageKey('http://www.digicharat.net'), 'digicharat');
  assert.strictEqual(ie.identifyPageKey('http://www.kinomania98.ru'), 'kinomania');
  assert.ok(ie.getPageTitle('animatrix').includes("АниМатрица '99"));
  const videoCat = ie.searchDirectory.find(c => c.title === 'Кино и видео');
  assert.ok(videoCat.sites.find(([url]) => url === base));
  assert.ok(window.retroSites.renderYandex('http://www.yandex.ru').includes(base));
  assert.ok(window.retroSites.renderYandex('http://www.yandex.ru/?q=аниме').includes(base));
  assert.ok(ie.performSearch('аниме').some(r => r.url === base));
  assert.ok(ie.renderRambler().includes(base));
  assert.ok(window.retroSites.getWebRingSites().some(s => s.url === base));
  assert.ok(read('index.html').indexOf('animatrix-data.js') < read('index.html').indexOf('animatrix-site.js'));
});

test('every route renders with its own title; legacy paths alias; unknown is a raw Apache 404', () => {
  const routes = {
    '/': 'home', '/catalog': 'catalog', '/tape?id=bebop-99': 'tape', '/fansub': 'fansub', '/articles': 'articles',
    '/article?id=mononoke-1999-cinema': 'article', '/clubs': 'clubs', '/swap': 'swap', '/guestbook': 'guestbook', '/polivanov': 'polivanov',
    '/chronicle': 'articles', '/world': 'clubs', '/club': 'swap', '/index.html': 'home', '/article/kenshin-tsuiokuhen-99': 'article'
  };
  Object.entries(routes).forEach(([p, view]) => {
    assert.strictEqual(site.parseRoute(base + p).page, view, p);
    const html = page(p);
    assert.ok(html.includes('class="amx-site"'), p);
    assert.ok(html.includes('АНИМАТРИЦА ’99'), p);
    assert.ok(!site.getPageTitle(base + p).includes('404'), p);
  });
  ['/studio', '/nope', '/tape/lain'].forEach(p => {
    const html = page(p);
    assert.ok(html.includes('Not Found') && html.includes('Apache/1.3.9'), p);
    assert.ok(!html.includes('amx-keys'), p);
  });
  assert.ok(page('/tape?id=missing').includes('Такой кассеты в фонде нет'));
  assert.ok(page('/article?id=missing').includes('Такой статьи нет'));
});

test('each page has its own form, not one shared panel template', () => {
  const markers = {
    '/': ['amx-log', 'amx-tvguide', 'amx-week', 'amx-poll'],
    '/catalog': ['amx-notebook', 'amx-ledger', 'amx-prices'],
    '/tape?id=lain-98': ['amx-sticker', 'amx-counter-table', 'amx-queue', 'amx-mini-tv'],
    '/fansub': ['amx-listing', 'Index of /fansub/', 'amx-tv', 'amx-ssa', 'amx-steps'],
    '/articles': ['amx-archive'],
    '/article?id=matrix-vs-gits-lain-99': ['amx-paper', 'amx-facts', 'amx-comment'],
    '/clubs': ['amx-scheme', 'amx-spots', 'amx-city'],
    '/swap': ['amx-wall', 'amx-ad', 'amx-tabs'],
    '/guestbook': ['amx-gb-form', 'amx-gb-reply'],
    '/polivanov': ['amx-conv', 'amx-kana-table', 'amx-kana-diff']
  };
  const seen = new Map();
  Object.entries(markers).forEach(([p, list]) => {
    const html = page(p);
    list.forEach(m => assert.ok(html.includes(m), `${p} has ${m}`));
    list.forEach(m => seen.set(m, (seen.get(m) || 0) + 1));
  });
  ['amx-notebook', 'amx-wall', 'amx-paper', 'amx-listing', 'amx-kana-table', 'amx-sticker'].forEach(m => {
    const pages = Object.keys(markers).filter(p => page(p).includes(m + '"') || page(p).includes(m + ' '));
    assert.ok(pages.length <= 2, `${m} is page-specific (${pages.join(', ')})`);
  });
  ['animatrix-panel', 'THEME-CRAFT', 'WORLDBUILDING', 'Controlling Idea', 'The Lie', 'Ghost / Wound', 'change-positive', 'Управляющая идея', 'Сценарная мастерская']
    .forEach(bad => Object.keys(markers).forEach(p => assert.ok(!page(p).includes(bad), `${p} has no "${bad}"`)));
});

test('the header frame shows a per-page subtitle, channel number and timecode', () => {
  const home = page('/');
  assert.ok(home.includes('Добро пожаловать на узел'));
  assert.ok(home.includes('CH 01'));
  const fansub = page('/fansub');
  assert.ok(fansub.includes('CH 03') && fansub.includes('0:21:14'));
  const tape = page('/tape?id=kenshin-ova-99');
  assert.ok(tape.includes('CH 02'));
  assert.ok(tape.includes('К-04. Самурай Икс: Воспоминания'));
  assert.ok(tape.includes('amx-key amx-key-on'));
  const art = page('/article?id=bebop-wowow-complete-99');
  assert.ok(art.includes('CH 04') && art.includes('Роман «JetBlack» Ковалёв, 12.12.1999'));
});

test('facts: release dates and credits match the sources, invented quotes from real people are gone', () => {
  const all = JSON.stringify(data);
  const kenshin = data.tapes.find(t => t.id === 'kenshin-ova-99');
  assert.ok(kenshin.aired.includes('20.02, 21.04, 21.06 и 22.09.1999'));
  assert.ok(kenshin.made.includes('Studio Deen') && kenshin.made.includes('Кадзухиро Фурухаси') && kenshin.made.includes('Таку Ивасаки'));
  assert.ok(!/22 ноября|22\.11\.1999|ноябрьск\S* (релиз|OVA|«Самура)/.test(all));
  const tokyo = data.articles.find(a => a.id === 'tokyo-autumn-1999-report');
  assert.ok(JSON.stringify(tokyo).includes('Нориюки Абэ'));
  assert.ok(!all.includes('Наоясу'));
  assert.ok(JSON.stringify(tokyo).includes('с 16.10.1999') && JSON.stringify(tokyo).includes('с 20.10.1999') && JSON.stringify(tokyo).includes('с 29.11.1999'));
  const bebop = data.tapes.find(t => t.id === 'bebop-99');
  assert.ok(bebop.aired.includes('24.10.1998–24.04.1999'));
  const mononoke = data.tapes.find(t => t.id === 'mononoke-99');
  assert.ok(mononoke.aired.includes('29.10.1999') && mononoke.aired.includes('Нила Геймана'));
  assert.ok(data.tapes.find(t => t.id === 'lain-98').aired.includes('06.07–28.09.1998'));
  assert.ok(data.tapes.find(t => t.id === 'berserk-98').aired.includes('08.10.1997–01.04.1998'));
  assert.ok(data.tapes.find(t => t.id === 'utena-99').aired.includes('14.08.1999'));
  ['Newtype', 'Без купюр', 'катан', 'Джоэлу Силверу', 'новелл по миру', 'Грендайзер', 'ДК МАИ', 'v2.08', 'Эвери Ли', 'Дзюна Сэи']
    .forEach(bad => assert.ok(!all.includes(bad), `no "${bad}"`));
  assert.ok(data.articles.every(a => !/— (Хаяо Миядзаки|Синъитиро Ватанабэ)/.test(a.lead + a.body.join(' '))));
  assert.strictEqual(data.siteDay, '28.12.1999');
  assert.ok(data.articles.every(a => site.dateKey(a.date) <= site.dateKey(data.siteDay)));
  assert.ok(data.updates.every(u => site.dateKey(u[0]) <= site.dateKey(data.siteDay)));
});

test('catalog: 10 tapes, reels fit their carriers, filters follow the URL', () => {
  assert.strictEqual(data.tapes.length, 10);
  const cap = name => (/VideoCD/.test(name) ? 74 : /E-120/.test(name) ? 120 : 180);
  data.tapes.forEach(t => {
    assert.ok(t.reels.length > 0, t.id);
    t.reels.forEach(r => {
      const sum = r.parts.reduce((s, p) => s + p[1], 0);
      assert.ok(sum > 0 && sum <= cap(r.name), `${t.id} ${r.name}: ${sum} min`);
    });
    assert.ok(t.sample.length > 0 && t.pro.length === 2 && t.con.length === 2, t.id);
  });
  const lain = data.tapes.find(t => t.id === 'lain-98');
  assert.strictEqual(lain.reels.reduce((s, r) => s + r.parts.length, 0), 13);
  assert.strictEqual(data.tapes.find(t => t.id === 'bebop-99').reels.reduce((s, r) => s + r.parts.length, 0), 26);
  const shelf = page('/catalog?show=shelf');
  data.tapes.forEach(t => assert.strictEqual(shelf.includes(`tape?id=${t.id}"`), !t.holder, t.id));
  const out = page('/catalog?show=out');
  data.tapes.forEach(t => assert.strictEqual(out.includes(`tape?id=${t.id}"`), !!t.holder, t.id));
  const tape = page('/tape?id=lain-98');
  assert.ok(tape.includes('1:12:00') && tape.includes('Layer 13 «Ego»'));
});

test('tape queue: join, show in catalog, leave; empty nick is refused', () => {
  assert.strictEqual(site.joinQueue('berserk-98', '  '), false);
  assert.ok(site.joinQueue('berserk-98', 'Аска_Лэнгли_99'));
  const tapeHtml = page('/tape?id=berserk-98');
  assert.ok(tapeHtml.includes('Вы в очереди под ником <b>Аска_Лэнгли_99</b>, ваш номер 1'));
  assert.ok(tapeHtml.includes('data-amx-unqueue="berserk-98"'));
  assert.ok(page('/catalog?show=queue').includes('tape?id=berserk-98"'));
  assert.ok(site.leaveQueue('berserk-98'));
  assert.ok(!page('/catalog?show=queue').includes('tape?id=berserk-98"'));
  assert.ok(JSON.parse(localStorage.getItem(site.userKey)).queue);
});

test('fansub: URL drives the preview, SSA is valid and pack files save to My Documents', () => {
  const html = page('/fansub?scene=eva-ep26&school=club99&color=cyan');
  assert.ok(html.includes('[Script Info]') && html.includes('[V4 Styles]') && html.includes('ScriptType: v4.00'));
  assert.ok(html.includes('Шинжи Икари'));
  assert.ok(html.includes('Style: Main,Arial Cyr,22,16776960'));
  assert.ok(html.includes('color:#00ffff'));
  const def = page('/fansub?scene=bogus&school=bogus&color=bogus');
  assert.ok(def.includes('Layer 01') && def.includes('Style: Main,Arial Cyr,22,65535'));
  data.scripts.forEach(s => {
    assert.ok(site.tape(s.tape), s.file);
    const doc = site.docFor('pack:' + s.file);
    assert.ok(doc && doc.file.endsWith('.SSA') && doc.text.includes('Dialogue:'), s.file);
    const times = doc.text.split('\r\n').filter(l => l.startsWith('Dialogue:') && l.includes(',Main,')).map(l => l.split(',').slice(1, 3).map(t => site.parseTc(t)));
    times.forEach(([a, b], i) => {
      assert.ok(b > a, `${s.file} line ${i}`);
      if (i) assert.ok(a >= times[i - 1][1], `${s.file} overlap ${i}`);
    });
  });
  const saved = site.saveDoc('pack:TSUIOKU1-4.ZIP');
  assert.strictEqual(saved.filename, 'TSUIOKU1-4.SSA');
  assert.ok(vfsFiles.get('My Computer\\C:\\My Documents\\TSUIOKU1-4.SSA').includes('Томоэ Юкисиро'));
  assert.strictEqual(lastNotepadDoc.title, 'TSUIOKU1-4.SSA');
  const scene = site.saveDoc('scene:bebop-session05:literal:white');
  assert.ok(scene.content.includes('Style: Main,Arial Cyr,22,16777215'));
});

test('tape card and article export to Notepad as 70-column text', () => {
  data.tapes.forEach(t => {
    const res = site.saveDoc('tape:' + t.id);
    assert.strictEqual(res.filename, t.file);
    res.content.split('\r\n').forEach(line => assert.ok(line.length <= 72, `${t.id}: ${line}`));
  });
  const art = site.saveDoc('article:matrix-vs-gits-lain-99');
  assert.ok(art.filename.endsWith('.TXT') && art.content.includes('Мамору Осии'));
  assert.ok(!art.content.includes('`'));
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\K04_TSUIOKUHEN.TXT'));
});

test('comments, guestbook and ads are stored and escaped', () => {
  assert.strictEqual(site.addComment('matrix-vs-gits-lain-99', 'КиберОтаку_99', '   '), false);
  assert.ok(site.addComment('matrix-vs-gits-lain-99', 'КиберОтаку_99', 'Колонны <b>совпадают</b>!'));
  const art = page('/article?id=matrix-vs-gits-lain-99');
  assert.ok(art.includes('КиберОтаку_99') && art.includes('Колонны &lt;b&gt;совпадают&lt;/b&gt;!'));
  assert.ok(art.includes('Отклики (2)'));
  assert.ok(site.addGuestbookEntry({ name: '<script>x</script>', from: 'Новосибирск', contact: 'javascript:alert(1)', fav: 'Триган', text: 'Ищу End of Evangelion!' }));
  const gb = page('/guestbook');
  assert.ok(gb.indexOf('&lt;script&gt;x&lt;/script&gt;') > -1 && gb.indexOf('&lt;script&gt;') < gb.indexOf('Otaku_Shinji</b>'));
  assert.ok(!gb.includes('data-url="javascript'));
  assert.ok(gb.includes('Любимое: Триган'));
  assert.strictEqual(site.addAd({ name: 'x', offer: '', tab: 'a' }), false);
  assert.ok(site.addAd({ name: 'Рэй_99', city: 'Тверь', offer: '«Сейлор Мун» <i>R</i>', want: 'Лэйн', tab: 'rei@tver.ru' }));
  const swap = page('/swap');
  assert.ok(swap.includes('«Сейлор Мун» &lt;i&gt;R&lt;/i&gt;') && swap.includes('rei@tver.ru'));
});

test('swap board: tearing tabs uses them up and persists', () => {
  const ad = data.ads[0];
  const left = ad.tabs - ad.torn;
  for (let i = 0; i < left; i += 1) assert.strictEqual(site.tearTab(ad.id), ad.tab);
  assert.strictEqual(site.tearTab(ad.id), null);
  const html = page('/swap');
  const block = html.slice(html.indexOf(ad.offer), html.indexOf(data.ads[1].offer));
  assert.strictEqual((block.match(/amx-tab-gone/g) || []).length, ad.tabs);
  assert.ok(!block.includes(`data-amx-tear="${ad.id}"`));
  assert.strictEqual(site.tearTab('nope'), null);
});

test('poll accepts one valid vote', () => {
  assert.strictEqual(site.votePoll('nope'), false);
  assert.ok(site.votePoll('bebop'));
  assert.strictEqual(site.votePoll('eva'), false);
  const html = page('/');
  assert.ok(html.includes('Вы уже проголосовали'));
  assert.ok(html.includes('Всего голосов: 696'));
});

test('names switch rewrites the whole site except the converter; encodings recode text', () => {
  site.transcription = 'slang99';
  const cat = page('/tape?id=eva-eoe-99');
  assert.ok(cat.includes('Шинжи Икари') && !cat.includes('Синдзи Икари'));
  assert.ok(page('/tape?id=kenshin-ova-99').includes('Кеншина Химуры'));
  const conv = page('/polivanov?q=Shinji+Ikari');
  assert.ok(conv.includes('<span class="amx-keep">Синдзи Икари</span>'));
  assert.ok(conv.includes('<span class="amx-keep">Шинджи Икари</span>'));
  assert.ok(conv.includes('(<span class="amx-keep">Синдзи, Кэнсин</span>)'));
  const poli = page('/polivanov');
  assert.ok(poli.includes('суси') && poli.includes('«Синдзи» или «Шинжи»'));
  assert.ok(page('/guestbook').includes('«Синдзи» и «Шинжи»'));
  assert.ok(page('/article?id=polivanov-vs-hepburn-ruanime-99').includes('«Синдзи» против «Шинжи»'));
  assert.ok(page('/fansub?scene=eva-ep26').includes('Main,Синдзи Икари'));
  site.transcription = 'polivanov';
  assert.ok(page('/tape?id=eva-eoe-99').includes('Синдзи Икари'));
  site.encoding = 'translit';
  const lat = page('/');
  assert.ok(lat.includes('Klubnyj fond') || lat.includes('Fond'));
  assert.ok(lat.includes('data-url="http://www.animatrix99.ru/catalog"'));
  site.encoding = 'koi8';
  assert.ok(!page('/').includes('Что нового'));
});

test('Polivanov converter follows the system and the fan slang', () => {
  const cases = [
    ['Shinji Ikari', 'Синдзи Икари', 'Шинджи Икари'],
    ['Himura Kenshin', 'Химура Кэнсин', 'Химура Кеншин'],
    ['Watanabe Shin\'ichirou', 'Ватанабэ Синъитиро', 'Ватанабе Шиничиро'],
    ['Miyazaki Hayao', 'Миядзаки Хаяо', 'Миязаки Хаяо'],
    ['Yoshitoshi ABe', 'Ёситоси Абэ', 'Йошитоши Абе'],
    ['Gunma', 'Гумма', 'Гунма'],
    ['Tokyo', 'Токио', 'Токио'],
    ['Kei', 'Кэй', 'Кей'],
    ['shoujo', 'сёдзё', 'шоджо'],
    ['matcha', 'маття', 'матча'],
    ['Hokkaido', 'Хоккайдо', 'Хоккайдо'],
    ['Ebichu', 'Эбитю', 'Эбичу']
  ];
  cases.forEach(([src, p, s]) => {
    assert.strictEqual(site.romajiToCyr(src, 'polivanov'), p, src);
    assert.strictEqual(site.romajiToCyr(src, 'slang'), s, src);
  });
  const html = page('/polivanov?q=Tsukino+Usagi');
  assert.ok(html.includes('Цукино Усаги'));
  assert.ok(/[a-z]/i.test(site.romajiToCyr('n')) === false);
});

test('legacy v1 storage migrates user posts only and removes old keys', () => {
  localStorage.setItem('win98_animatrix_guestbook_v1', JSON.stringify([
    { id: 'gb-user-1', name: 'Старый_Гость', city: 'Тула', contact: 'tula@mail.ru', text: 'Привет из девяносто девятого', date: '20.12.1999 10:00' },
    { id: 'gb-1', name: 'Otaku_Shinji', text: 'seed' }
  ]));
  localStorage.setItem('win98_animatrix_comments_v1', JSON.stringify({ 'matrix-vs-gits-lain-99': [{ author: 'Читатель', body: 'старый отклик' }], 'lain-protocol-y2k': [{ author: 'x', body: 'y' }] }));
  localStorage.setItem('win98_animatrix_poll_v1', JSON.stringify({ counts: {}, voted: 'lain' }));
  localStorage.setItem('win98_animatrix_tapevotes_v1', '{}');
  const user = site.loadUser();
  assert.strictEqual(user.guestbook.length, 1);
  assert.strictEqual(user.guestbook[0].name, 'Старый_Гость');
  assert.deepStrictEqual(Object.keys(user.comments), ['matrix-vs-gits-lain-99']);
  assert.strictEqual(user.poll, 'lain');
  Object.values(site.legacyKeys).forEach(k => assert.strictEqual(localStorage.getItem(k), null, k));
  assert.ok(page('/guestbook').includes('Старый_Гость'));
  localStorage.setItem(site.userKey, '{broken');
  assert.deepStrictEqual(site.loadUser().guestbook, []);
});

test('Clippy points only to working pages and the site exposes what it uses', () => {
  const clippy = read('js/apps/clippy.js');
  const block = clippy.slice(clippy.indexOf("'animatrix': {"), clippy.indexOf("'digicharat': {"));
  const urls = block.match(/http:\/{2}www\.animatrix99\.ru[^'"]*/g) || [];
  assert.ok(urls.length >= 3);
  urls.forEach(u => assert.ok(!page(u.slice(base.length)).includes('Not Found'), u));
  assert.ok(block.includes('transcription'));
  assert.ok(!block.includes('/studio'));
});

test('Web 1.0 CSS, no emoji, Microslop/Win naming and zero comments', () => {
  const css = read('css/apps/animatrix-site.css');
  ['border-radius', 'rgba(', 'transition', 'blur(', 'linear-gradient', 'radial-gradient', 'display: flex', 'display: grid', 'animation'].forEach(bad =>
    assert.ok(!css.includes(bad), `CSS has no ${bad}`));
  const js = read('js/apps/animatrix-site.js');
  const dataJs = read('js/apps/animatrix-data.js');
  const hex = (css + js + dataJs).match(/#[0-9a-fA-F]{6}\b/g) || [];
  hex.forEach(c => [1, 3, 5].forEach(i => assert.ok(['00', '33', '66', '99', 'cc', 'ff'].includes(c.slice(i, i + 2).toLowerCase()), `web-safe ${c}`)));
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  assert.ok(!emoji.test(js) && !emoji.test(dataJs));
  Object.keys({ '/': 1, '/catalog': 1, '/swap': 1, '/polivanov': 1 }).forEach(p => assert.ok(!emoji.test(page(p)), p));
  [js, dataJs, css].forEach((code, i) => {
    assert.ok(!code.includes('/*'), `block comment in file ${i}`);
    assert.ok(!code.includes('<!--'), `html comment in file ${i}`);
    assert.strictEqual(/^\s*\/\//m.test(code.replace(/https?:\/\/[^\s'"`]+/g, '')), false, `line comment in file ${i}`);
    assert.strictEqual(/\bMicrosoft\b/i.test(code), false);
    assert.strictEqual(/\bWindows\b/.test(code), false);
  });
});

console.log(`All ${passed} Animatrix '99 tests passed!`);
