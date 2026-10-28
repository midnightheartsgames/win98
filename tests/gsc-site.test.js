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

let lastNotepad = null;
let lastSteam = null;
let lastCd = null;
let lastLaunch = null;
const dialogs = [];
const vfsFiles = new Map();
const installed = new Set();
const owned = new Set();

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

global.window = {
  isOnline: true,
  addEventListener: () => {},
  webGif: name => `<span class="gif-${name}"></span>`,
  getIcon: name => `<svg data-icon="${name}"></svg>`,
  soundSys: { playClick: () => {}, playDing: () => {}, playError: () => {} },
  winManager: {
    windows: new Map(),
    openDialog: opts => { dialogs.push(opts); },
    createWindow: () => ({})
  },
  vfs: {
    mkdir: () => {},
    writeFile: (folder, name, content) => { vfsFiles.set(folder.join('\\') + '\\' + name, content); return true; }
  },
  appNotepad: {
    openWithContent: (title, content) => { lastNotepad = { title, content }; },
    open: (filePath, title, content) => { lastNotepad = { title, content }; }
  }
};

eval(read('js/game-manager.js'));
window.gameManager.isInstalled = id => installed.has(id);
window.gameManager.isPurchased = id => owned.has(id);
window.gameManager.ownsOnSteam = id => owned.has(id);
window.gameManager.showInSteam = id => { lastSteam = id; };
window.gameManager.showOnCd = id => { lastCd = id; };

eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/gsc-data.js'));
eval(read('js/apps/gsc-site.js'));
eval(read('js/apps/ie.js'));
eval(read('js/apps/clippy-help.js'));
eval(read('js/apps/clippy-tips.js'));
eval(read('js/apps/outlook-mail.js'));

const ie = window.appIE;
const site = window.gscSite;
const data = window.GSC_DATA;
const base = 'http://www.gsc-game.com';
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

function parseElements(html) {
  const els = [];
  const tagRe = /<([a-zA-Z0-9]+)((?:\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*(?:="[^"]*")?)*)\s*\/?>/g;
  let m;
  while ((m = tagRe.exec(html))) {
    const attrs = {};
    const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:="([^"]*)")?/g;
    let a;
    while ((a = attrRe.exec(m[2]))) {
      attrs[a[1]] = a[2] === undefined ? '' : a[2].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    }
    const dataset = {};
    Object.keys(attrs).filter(k => k.startsWith('data-')).forEach(k => {
      dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = attrs[k];
    });
    const classList = (attrs.class || '').split(/\s+/).filter(Boolean);
    const listeners = {};
    els.push({
      tag: m[1].toLowerCase(),
      attrs,
      dataset,
      classList,
      value: attrs.value || '',
      checked: 'checked' in attrs,
      textContent: '',
      addEventListener(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); },
      fire(evt, extra = {}) { (listeners[evt] || []).forEach(fn => fn({ preventDefault() {}, key: 'Enter', ...extra })); }
    });
  }
  return els;
}

function matches(el, sel) {
  if (sel.startsWith('#')) return el.attrs.id === sel.slice(1);
  const input = sel.match(/^input\[name="([^"]+)"\]:checked$/);
  if (input) return el.tag === 'input' && el.attrs.name === input[1] && el.checked;
  const classAndAttr = sel.match(/^\.([-a-zA-Z0-9_]+)\[([-a-zA-Z0-9_]+)\]$/);
  if (classAndAttr) return el.classList.includes(classAndAttr[1]) && (classAndAttr[2] in el.attrs);
  const attrVal = sel.match(/^\[([-a-zA-Z0-9_]+)="([^"]+)"\]$/);
  if (attrVal) return el.attrs[attrVal[1]] === attrVal[2];
  const attrOnly = sel.match(/^\[([-a-zA-Z0-9_]+)\]$/);
  if (attrOnly) return attrOnly[1] in el.attrs;
  const classOnly = sel.match(/^\.([-a-zA-Z0-9_]+)$/);
  if (classOnly) return el.classList.includes(classOnly[1]);
  throw new Error('Unsupported selector ' + sel);
}

function browse(url) {
  const env = { url, html: '', els: [] };
  const container = {
    querySelector: sel => env.els.find(el => matches(el, sel)) || null,
    querySelectorAll: sel => env.els.filter(el => matches(el, sel))
  };
  const mockIe = {
    currentUrl: url,
    renderPage(w, next) {
      this.currentUrl = next || this.currentUrl;
      env.url = this.currentUrl;
      env.html = site.renderSite(this.currentUrl);
      env.els = parseElements(env.html);
      site.attachEvents(w, container, mockIe);
    },
    navigate(w, next) { this.renderPage(w, next); }
  };
  mockIe.renderPage({ id: 'app_ie' }, url);
  env.ie = mockIe;
  env.find = (sel, key, val) => {
    const list = container.querySelectorAll(sel);
    const el = key ? list.find(e => e.dataset[key] === val) : list[0];
    assert.ok(el, `element ${sel} ${key || ''}=${val || ''} on ${env.url}`);
    return el;
  };
  env.click = (sel, key, val) => env.find(sel, key, val).fire('click');
  return env;
}

const allRoutes = () => {
  const routes = ['', '/games', '/devlog/', '/pda', '/stalkers', '/studio', '/search', '/search?q=Скат-3', '/search?q=zzzz'];
  data.games.forEach(g => routes.push(`/game?id=${g.id}`));
  data.news.forEach(n => routes.push(`/article?id=${n.id}`));
  data.devlogs.forEach(d => routes.push(`/devlog/${d.fileName}`, `/devlog?id=${d.id}`));
  data.anomalies.forEach(a => routes.push(`/pda?anomaly=${a.id}`));
  return routes.map(r => base + r);
};

test('IE routes every GSC URL to the site and lists GSC in WebSeeker, Yandex, WebRing, Clippy and Outlook', () => {
  allRoutes().forEach(u => assert.strictEqual(ie.identifyPageKey(u), 'gsc', u));
  assert.ok(ie.getPageTitle('gsc').includes('GSC Game World'));

  const gamesCat = ie.searchDirectory.find(c => c.title === 'Компьютерные игры');
  assert.ok(gamesCat.sites.some(([u]) => u === base));
  assert.ok(ie.performSearch('сталкер').some(r => r.url === base));
  assert.ok(ie.performSearch('gsc').some(r => r.url === base));
  assert.ok(window.retroSites.getWebRingSites().some(s => s.url === base));
  assert.ok(window.retroSites.renderYandex('http://www.yandex.ru/search?q=gsc').includes(base));

  const helpHits = window.clippyHelp.search('сталкер gsc затон');
  assert.ok(helpHits.some(h => h.entry.id === 'gsc-site'));
  assert.ok(window.clippyTips.catalog['gsc-zone']);

  const gscPerson = window.OutlookMail.people.find(p => p.addr === 'zone@gsc-game.com');
  assert.ok(gscPerson);
  assert.strictEqual(gscPerson.topics.length, 3);
});

test('Every page parses to its own view and chrome pages share the header, navigation and footer', () => {
  const views = {
    [base]: 'home', [base + '/games']: 'games', [base + '/game?id=cop98']: 'game',
    [base + '/article?id=news-cop98-fairway']: 'article', [base + '/devlog/']: 'devlog-index',
    [base + '/devlog/GSC_Zaton_SoftwareRenderer.txt']: 'devlog-file', [base + '/devlog?id=devlog-text-crt-engine']: 'devlog-file',
    [base + '/pda?anomaly=psi']: 'pda', [base + '/stalkers']: 'stalkers', [base + '/studio']: 'studio', [base + '/search?q=Ной']: 'search'
  };
  Object.entries(views).forEach(([u, view]) => assert.strictEqual(site.parseRoute(u).view, view, u));
  assert.strictEqual(site.activeAnomalyId, 'psi');
  site.parseRoute(base + '/pda?anomaly=nope');
  assert.strictEqual(site.activeAnomalyId, 'psi');

  ['', '/games', '/pda', '/stalkers', '/studio', '/search'].forEach(r => {
    const html = site.renderSite(base + r);
    assert.ok(html.includes('aria-label="GSC Game World"'), `header on ${r}`);
    assert.ok(html.includes('class="gsc-counter"'), `counter on ${r}`);
    assert.ok(html.includes('gsc-plate-on') || r === '/search', `active plate on ${r}`);
  });
  ['/devlog/', '/devlog/GSC_XRay98_ALife_Notes.txt'].forEach(r => {
    assert.ok(!site.renderSite(base + r).includes('gsc-plate'), `raw server page ${r}`);
  });
});

test('S.T.A.L.K.E.R. games match the catalog: two in Steam, the 3D one as an Igromania CD demo', () => {
  const expectedIds = ['stalker', 'stalker98', 'cop98'];
  assert.deepStrictEqual(data.games.map(g => g.id), expectedIds);
  assert.strictEqual(data.games.find(g => g.id === 'stalker98').demo, 'stalker98_demo');

  data.games.forEach(g => {
    const entry = site.getGameCatalogEntry(g.id);
    const gmId = g.demo || g.id;
    const cat = window.gameManager.catalog[gmId];
    assert.strictEqual(entry.gmId, gmId, `gmId ${g.id}`);
    assert.strictEqual(Boolean(cat.steam), !g.demo, `steam ${g.id}`);
    assert.strictEqual(Boolean(cat.cdDemo), Boolean(g.demo), `cdDemo ${g.id}`);
    assert.strictEqual(entry.title, cat.title, `title ${g.id}`);
    assert.strictEqual(entry.priceDisplay, cat.priceDisplay, `price ${g.id}`);
    assert.strictEqual(entry.exe, cat.targetExe, `exe ${g.id}`);
    assert.strictEqual(entry.fileSize, cat.fileSize, `fileSize ${g.id}`);
    assert.strictEqual(g.sysreq.length, 5, `sysreq ${g.id}`);
    assert.ok(g.pick && g.finale && g.needs3d && g.sector, `matrix fields ${g.id}`);
    const shot = n => g.demo ? `content/igromania/demos/${gmId}-${n}.jpg` : `content/steam/${g.id}-${n}.jpg`;
    assert.ok(fs.existsSync(path.join(root, shot(1))), `shot 1 ${g.id}`);
    assert.ok(fs.existsSync(path.join(root, shot(2))), `shot 2 ${g.id}`);
  });

  const stalkerText = JSON.stringify(data.games.find(g => g.id === 'stalker'));
  ['STALKER.EXE', '14.2 MB', '$29.99', 'номера 26', 'Кузнецову', 'X-18', 'X-16'].forEach(fact => {
    assert.ok(stalkerText.includes(fact), `stalker fact: ${fact}`);
  });

  const stalker98Text = JSON.stringify(data.games.find(g => g.id === 'stalker98'));
  ['XR98.EXE', '22.6 MB', 'stalker98demo.exe', '3000 RU', 'Медузы', 'КПК Копателя', 'Петрухи'].forEach(fact => {
    assert.ok(stalker98Text.includes(fact), `stalker98 fact: ${fact}`);
  });

  const cop98Text = JSON.stringify(data.games.find(g => g.id === 'cop98'));
  ['ZATON.EXE', '9.8 MB', '$36.99', 'Дегтярёв', 'Скат-2', 'Скат-3', 'Скат-5', 'Ной', 'Велес'].forEach(fact => {
    assert.ok(cop98Text.includes(fact), `cop98 fact: ${fact}`);
  });

  assert.deepStrictEqual(site.downloadTimes('22.6 MB (3D Accelerated Edition)')[2], ['Модем 33 600', '1 ч 58 мин']);
  assert.deepStrictEqual(site.downloadTimes('9.8 MB')[4], ['ISDN 64 Кбит/с', '27 мин']);
});

test('Home view filters news, records poll votes and counts the visitor once', () => {
  global.localStorage.clear();
  site.newsCategory = 'all';
  site.hitCounted = false;
  const env = browse(base);

  assert.strictEqual(env.els.filter(e => matches(e, '[data-game-card]')).length, 3);
  assert.strictEqual(env.els.filter(e => matches(e, '.gsc-news-card')).length, 5);
  assert.ok(env.html.includes('content/steam/stalker-1.jpg'));
  assert.ok(env.html.includes('<marquee'));

  env.click('.btn-gsc-news-cat[data-cat]', 'cat', 'ЗОВ ПРИПЯТИ 98');
  assert.strictEqual(env.els.filter(e => matches(e, '.gsc-news-card')).length, 1);
  assert.ok(env.html.includes('Операция «Фарватер»'));
  assert.ok(env.html.includes('gsc-rubric-on" data-cat="ЗОВ ПРИПЯТИ 98"'));

  env.click('.btn-gsc-news-cat[data-cat]', 'cat', 'all');
  assert.strictEqual(env.els.filter(e => matches(e, '.gsc-news-card')).length, 5);

  env.click('#btn-gsc-poll-vote');
  assert.strictEqual(global.localStorage.getItem('win98_gsc_poll_v1'), 'cordon_3d');
  assert.ok(env.html.includes('Ваш голос:'));

  env.click('#btn-gsc-poll-reset');
  assert.strictEqual(global.localStorage.getItem('win98_gsc_poll_v1'), null);

  assert.strictEqual(global.localStorage.getItem('win98_gsc_hits_v1'), '1');
  assert.ok(env.html.includes('<span>4</span><span>1</span><span>8</span><span>7</span><span>4</span>'));
});

test('Press release page exports the article and links to newer and older releases', () => {
  const env = browse(base + '/article?id=news-cop98-fairway');
  assert.ok(env.html.includes('Для немедленной публикации'));
  assert.ok(env.html.includes('Пресс-релиз. Зов Припяти 98'));
  assert.ok(env.html.includes('/article?id=news-three-builds'));
  assert.ok(env.html.includes('/article?id=news-stalker98-cordon'));
  assert.ok(env.html.includes('btn-gsc-game-primary" data-game-id="cop98"'));

  env.click('.btn-gsc-article-notepad[data-article-id]', 'articleId', 'news-cop98-fairway');
  assert.strictEqual(lastNotepad.title, 'GSC_news-cop98-fairway.txt');
  assert.ok(lastNotepad.content.includes('ZATON.EXE'));
  assert.ok(lastNotepad.content.split('\r\n').every(l => l.length <= 76), 'release text wrapped at 76');

  env.click('.btn-gsc-article-save[data-article-id]', 'articleId', 'news-cop98-fairway');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\GSC_news-cop98-fairway.txt'));
});

test('Games matrix and game pages reflect Steam store, owned and installed states and launch installed games', () => {
  installed.clear();
  owned.clear();
  lastSteam = null;
  lastLaunch = null;

  const matrix = browse(base + '/games');
  assert.ok(matrix.html.includes('Да: 3dfx Voodoo, Riva TNT или Voodoo2'));
  assert.ok(matrix.html.includes(site.downloadTimes('9.8 MB')[2][1]));
  assert.ok(matrix.html.includes('не нужно, есть на CD «Игромании»'));
  data.games.forEach(g => assert.ok(matrix.html.includes(site.esc(g.pick)), `pick ${g.id}`));

  window.gameManager.catalog.cop98.launch = () => { lastLaunch = 'cop98'; };

  let env = browse(base + '/game?id=cop98');
  assert.ok(env.html.includes('Купить в Steam ($36.99)'));
  assert.ok(env.html.includes('content/steam/cop98-1.jpg'));
  assert.ok(env.html.includes('content/steam/cop98-2.jpg'));
  assert.ok(env.html.includes('S3 Virge 2 МБ'));
  assert.ok(env.html.includes('id="gsc-sec-sysreq"'));

  env.click('.btn-gsc-shot[data-shot]', 'shot', 'cop98-2');
  assert.ok(env.html.includes('width="640" height="480"'));
  env.click('.btn-gsc-shot[data-shot]', 'shot', '');
  assert.ok(!env.html.includes('width="640" height="480"'));

  env.click('.btn-gsc-game-primary[data-game-id]', 'gameId', 'cop98');
  assert.strictEqual(lastSteam, 'cop98');

  owned.add('cop98');
  env = browse(base + '/game?id=cop98');
  assert.ok(env.html.includes('Установить через Steam'));
  assert.ok(env.html.includes('Куплено в Steam, ещё не установлено'));

  installed.add('cop98');
  env = browse(base + '/game?id=cop98');
  assert.ok(env.html.includes('Запустить ZATON.EXE'));
  assert.ok(env.html.includes('Установлено: C:\\Games\\CoP98\\ZATON.EXE'));
  env.click('.btn-gsc-game-primary[data-game-id]', 'gameId', 'cop98');
  assert.strictEqual(lastLaunch, 'cop98');
  env.click('.btn-gsc-steam[data-game-id]', 'gameId', 'cop98');
  assert.strictEqual(lastSteam, 'cop98');

  env.click('.btn-gsc-dossier-save[data-game-id]', 'gameId', 'cop98');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\GSC_Dossier_cop98.txt'));
  assert.ok(vfsFiles.get('My Computer\\C:\\My Documents\\GSC_Dossier_cop98.txt').includes('СИСТЕМНЫЕ ТРЕБОВАНИЯ'));
  installed.clear();
  owned.clear();
});

test('S.T.A.L.K.E.R. 98 is a demo on the Igromania CD: no price, no Steam, CD dialog or launch', () => {
  installed.clear();
  owned.clear();
  lastSteam = null;
  lastCd = null;
  lastLaunch = null;

  const all = JSON.stringify(data);
  assert.ok(!all.includes('$32.99'), 'no price for the demo');
  assert.ok(!all.includes('Все три игры продаются'), 'no claim that all three are sold in Steam');
  assert.ok(!site.buildArticlePlainText(data.news[0]).includes('Все три игры'), 'press release footer lists the demo apart');

  const home = browse(base);
  assert.ok(home.html.includes('content/igromania/demos/stalker98_demo-1.jpg'));
  assert.ok(home.html.includes('btn-gsc-game-primary" data-game-id="stalker98_demo"'));
  assert.ok(home.html.includes('Демоверсия на компакт-диске журнала «Игромания»: D:\\demo\\stalker98demo.exe'));

  const matrix = browse(base + '/games');
  assert.ok(matrix.html.includes('демоверсия, бесплатно на CD «Игромании»'));
  assert.ok(matrix.html.includes('Купить в Steam ($36.99)') && matrix.html.includes('Купить в Steam ($29.99)'));

  let env = browse(base + '/game?id=stalker98');
  assert.ok(env.html.includes('Демоверсия на диске «Игромании»'));
  assert.ok(!/Купить в Steam|Цена в Steam|клиент Steam|Сколько качать/.test(env.html), 'demo page has no Steam purchase');
  assert.ok(env.html.includes('content/igromania/demos/stalker98_demo-2.jpg'));
  env.click('.btn-gsc-game-primary[data-game-id]', 'gameId', 'stalker98_demo');
  assert.strictEqual(lastCd, 'stalker98_demo');
  assert.strictEqual(lastSteam, null);

  window.gameManager.catalog.stalker98_demo.launch = () => { lastLaunch = 'stalker98_demo'; };
  installed.add('stalker98_demo');
  env = browse(base + '/game?id=stalker98');
  assert.ok(env.html.includes('Запустить XR98.EXE'));
  assert.ok(!env.html.includes('btn-gsc-steam'));
  env.click('.btn-gsc-game-primary[data-game-id]', 'gameId', 'stalker98_demo');
  assert.strictEqual(lastLaunch, 'stalker98_demo');
  env.click('.btn-gsc-dossier-notepad[data-game-id]', 'gameId', 'stalker98');
  assert.ok(lastNotepad.content.includes('D:\\demo\\stalker98demo.exe') && !lastNotepad.content.includes('Цена в Steam'));
  installed.clear();
});

test('Engineering notes are a server directory index with plain 76-column text files', () => {
  const index = browse(base + '/devlog/');
  assert.ok(index.html.includes('Index of /devlog'));
  assert.ok(index.html.includes('Apache/1.3.3 Server at www.gsc-game.com Port 80'));
  data.devlogs.forEach(doc => assert.ok(index.html.includes(`data-url="${base}/devlog/${doc.fileName}"`), doc.fileName));

  index.click('.btn-gsc-devlog-save[data-devlog-id]', 'devlogId', 'devlog-zaton-softrender');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\GSC_Zaton_SoftwareRenderer.txt'));
  index.click('.btn-gsc-devlog-notepad[data-devlog-id]', 'devlogId', 'devlog-xray98-alife');
  assert.strictEqual(lastNotepad.title, 'GSC_XRay98_ALife_Notes.txt');

  const file = browse(base + '/devlog/GSC_Zaton_SoftwareRenderer.txt');
  assert.ok(file.html.includes('data-active-devlog="devlog-zaton-softrender"'));
  assert.ok(file.html.includes('Велес'));
  const pre = file.html.split('<pre class="gsc-raw-text">')[1].split('</pre>')[0];
  assert.ok(pre.split('\n').every(l => l.replace(/&[a-z#0-9]+;/g, 'x').length <= 76), 'text file wrapped at 76');

  assert.ok(browse(base + '/devlog?id=devlog-text-crt-engine').html.includes('data-active-devlog="devlog-text-crt-engine"'));
});

test('PDA applet tests anomalies with M12 bolts and reveals progressive 3-step tactical guides', () => {
  site.activeAnomalyId = 'electra';
  site.activeDetectorId = 'otklik';
  site.boltTelemetry = null;
  site.guideProgress = {};

  const env = browse(base + '/pda');
  assert.ok(env.html.includes('Апплет PDA98.class запущен'));
  env.click('.btn-gsc-select-anomaly[data-anomaly-id]', 'anomalyId', 'tramplin');
  env.click('.btn-gsc-select-detector[data-detector-id]', 'detectorId', 'veles');
  env.click('#btn-gsc-throw-bolt');

  assert.ok(env.html.includes('Болт М12 вошёл в радиус'));
  assert.ok(env.html.includes('«Медуза»'));
  assert.ok(env.html.includes('Прибор «Велес»'));
  assert.ok(env.html.includes('gsc-pda-led-on'));

  env.click('.btn-gsc-select-detector[data-detector-id]', 'detectorId', 'bolt');
  assert.ok(!env.html.includes('gsc-pda-led-on'));
  env.click('#btn-gsc-throw-bolt');
  assert.ok(env.html.includes('Без детектора артефакты не видны'));

  assert.ok(!env.html.includes('Болотный Доктор раскроет'), 'step 2 spoiler hidden initially');
  assert.ok(!env.html.includes('расстрел энергоустановок'), 'step 3 spoiler hidden initially');
  assert.ok(!env.html.includes('ШАГ 1 ('), 'step prefix becomes a list label');
  env.click('.btn-gsc-guide-next[data-guide-id]', 'guideId', 'guide-true-ending');
  assert.ok(env.html.includes('Болотный Доктор раскроет'));
  assert.ok(!env.html.includes('расстрел энергоустановок'));
  env.click('.btn-gsc-guide-next[data-guide-id]', 'guideId', 'guide-true-ending');
  assert.ok(env.html.includes('расстрел энергоустановок'));
  assert.ok(env.html.includes('Все шаги открыты.'));

  env.click('.btn-gsc-guide-notepad[data-guide-id]', 'guideId', 'guide-true-ending');
  assert.ok(lastNotepad.content.includes('ШАГ 3'));
});

test('Radio receiver validates empty messages, escapes HTML, persists messages and tunes channels', () => {
  global.localStorage.clear();
  dialogs.length = 0;
  site.activeRadioChannel = 'all';

  const env = browse(base + '/stalkers');
  assert.strictEqual(env.els.filter(e => matches(e, '.gsc-radio-item')).length, 5);
  assert.ok(env.html.includes('СКАН: все частоты'));

  env.find('#gsc-radio-text').value = '   ';
  env.click('#btn-gsc-radio-send');
  assert.strictEqual(dialogs.length, 1);

  env.find('#gsc-radio-author').value = 'Дегтярёв<script>';
  env.find('#gsc-radio-channel').value = 'zaton';
  env.find('#gsc-radio-text').value = 'Бортовой самописец Скат-2 снят на Железном лесу! <b>Приём</b>';
  env.click('#btn-gsc-radio-send');

  assert.strictEqual(env.els.filter(e => matches(e, '.gsc-radio-item')).length, 6);
  assert.ok(env.html.includes('Дегтярёв&lt;script&gt;'));
  assert.ok(env.html.includes('&lt;b&gt;Приём&lt;/b&gt;'));
  assert.ok(!env.html.includes('<script>'));
  const saved = JSON.parse(global.localStorage.getItem('win98_gsc_radio_posts_v1'));
  assert.strictEqual(saved[0].channelLabel, 'Затон — сухогруз «Скадовск»');

  env.click('.btn-gsc-radio-filter[data-channel]', 'channel', 'cordon');
  assert.strictEqual(env.els.filter(e => matches(e, '.gsc-radio-item')).length, 2);
  assert.ok(env.html.includes('101.4 МГц &nbsp; Кордон'));
  assert.ok(env.html.includes('left:67%'));
  site.activeRadioChannel = 'all';
});

test('Site search is its own page reached from the header form and the quick tags', () => {
  const hits = site.performSiteSearch('скат-3');
  assert.ok(hits.some(h => h.url.includes('/game?id=cop98')));
  assert.ok(hits.some(h => h.url.includes('/article?id=news-cop98-fairway')));
  assert.ok(hits.some(h => h.url.includes('/pda')));
  assert.ok(site.performSiteSearch('программный рендерер').some(h => h.url.endsWith('/devlog/GSC_Zaton_SoftwareRenderer.txt')));
  assert.ok(site.performSiteSearch('3D Studio MAX').some(h => h.url.endsWith('/studio')));

  const env = browse(base);
  env.find('#gsc-search-input').value = 'Кардан';
  env.click('#btn-gsc-search');
  assert.ok(env.url.endsWith('/search?q=' + encodeURIComponent('Кардан')));
  assert.ok(env.html.includes('найдено документов:'));

  env.click('.gsc-quick-tag[data-gsc-q]', 'gscQ', 'Кузнецов');
  assert.strictEqual(site.searchQuery, 'Кузнецов');
  assert.ok(env.html.includes('<b>Кузнецов</b> найдено документов:'));

  env.click('#btn-gsc-search-clear');
  assert.strictEqual(site.searchQuery, '');
  assert.ok(env.url.endsWith('/search'));

  assert.ok(site.renderSite(base + '/search?q=qwertyzone').includes('ничего не найдено'));
  assert.ok(site.renderSite(base + '/studio').includes('id="gsc-search-input" class="gsc-input gsc-nav-input" size="12" value=""'));
});

test('Studio page lists history, departments, vacancies and the address with the studio mail link', () => {
  const env = browse(base + '/studio');
  data.studio.history.forEach(h => assert.ok(env.html.includes(`<td class="gsc-year" valign="top">${h.year}</td>`)));
  data.studio.vacancies.forEach(v => assert.ok(env.html.includes(site.esc(v.title))));
  assert.ok(env.html.includes('mailto:zone@gsc-game.com'));
  assert.ok(env.html.includes('бульвар Леси Украинки, 26'));
  assert.ok(env.html.includes('data-url="http://www.steampowered.com"'));

  dialogs.length = 0;
  env.click('#gsc-english');
  assert.strictEqual(dialogs.length, 1);
});

test('Web 1.0 rules: no emoji, Microslop and Win naming, no modern CSS, zero comments', () => {
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  allRoutes().forEach(u => {
    const html = site.renderSite(u);
    assert.ok(!EMOJI.test(html), `emoji on ${u}`);
    assert.ok(!/\bMicrosoft\b/i.test(html), `Microsoft on ${u}`);
    assert.ok(!/\bWindows\b/i.test(html), `Windows on ${u}`);
    assert.ok(!html.includes('undefined') && !html.includes('NaN'), `bad value on ${u}`);
  });

  const css = read('css/apps/gsc-site.css');
  ['border-radius', 'box-shadow', 'rgba(', 'linear-gradient', 'radial-gradient', 'blur(', 'transition', 'animation', 'opacity'].forEach(p => {
    assert.ok(!css.includes(p), `forbidden ${p}`);
  });
  assert.ok(!/\/\*|\*\//.test(css), 'comments in css/apps/gsc-site.css');

  ['js/apps/gsc-data.js', 'js/apps/gsc-site.js', 'tests/gsc-site.test.js'].forEach(f => {
    assert.ok(!/\/\*|\*\/|^\s*\/\//m.test(read(f)), `comments in ${f}`);
  });

  const index = read('index.html');
  assert.ok(index.indexOf('js/apps/gsc-data.js') > 0 && index.indexOf('js/apps/gsc-data.js') < index.indexOf('js/apps/gsc-site.js'));
});

console.log(`\nALL ${passed} GSC GAME WORLD SITE TESTS PASSED`);
