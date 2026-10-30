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
let lastCd = null;
let lastLaunch = null;
const vfsFiles = new Map();
const installed = new Set();

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

global.window = {
  isOnline: true,
  addEventListener: () => {},
  webGif: name => `<span class="gif-${name}"></span>`,
  getIcon: name => `<svg data-icon="${name}"></svg>`,
  soundSys: { playClick: () => {}, playDing: () => {}, playError: () => {} },
  winManager: { windows: new Map(), openDialog: () => {}, createWindow: () => ({}) },
  vfs: {
    mkdir: () => {},
    writeFile: (folder, name, content) => { vfsFiles.set(folder.join('\\') + '\\' + name, content); return true; }
  },
  appNotepad: {
    openWithContent: (title, content) => { lastNotepad = { title, content }; },
    open: (title, content) => { lastNotepad = { title, content }; }
  }
};

eval(read('js/game-manager.js'));
window.gameManager.isInstalled = id => installed.has(id);
window.gameManager.showOnCd = id => { lastCd = id; };

eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/sunsetvalley-data.js'));
eval(read('js/apps/sunsetvalley-site.js'));
eval(read('js/apps/ie.js'));
eval(read('js/apps/clippy-help.js'));
eval(read('js/apps/clippy-tips.js'));
eval(read('js/apps/outlook-mail.js'));

const ie = window.appIE;
const site = window.sunsetValleySite;
const data = window.SUNSETVALLEY_DATA;
const S3 = globalThis.Sims3;
const base = 'http://www.sunsetvalley98.com';
const town = site.getTownModel();
const NB = '\u00a0';
const money = n => '§' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const plain = html => html.replace(new RegExp(NB, 'g'), ' ');
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
      addEventListener(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); },
      fire(evt) { (listeners[evt] || []).forEach(fn => fn({ preventDefault() {} })); }
    });
  }
  return els;
}

function matches(el, sel) {
  if (sel.startsWith('#')) return el.attrs.id === sel.slice(1);
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
    scrollTop: 0,
    querySelector: sel => env.els.find(el => matches(el, sel)) || null,
    querySelectorAll: sel => env.els.filter(el => matches(el, sel))
  };
  const mockIe = {
    currentUrl: url,
    renderPage(w, next) {
      this.currentUrl = next || this.currentUrl;
      env.url = this.currentUrl;
      env.html = site.renderSite(this.currentUrl);
      env.text = plain(env.html);
      env.els = parseElements(env.html);
      site.attachEvents(w, container, this);
    },
    navigate(w, next) { this.renderPage(w, next); }
  };
  window.appIE = mockIe;
  mockIe.renderPage({ id: 'app_ie' }, url);
  env.find = (sel, key, val) => {
    const list = container.querySelectorAll(sel);
    const el = key ? list.find(e => e.dataset[key] === val) : list[0];
    assert.ok(el, `element ${sel} ${key || ''}=${val || ''} on ${env.url}`);
    return el;
  };
  env.click = (sel, key, val) => env.find(sel, key, val).fire('click');
  env.count = sel => env.els.filter(e => matches(e, sel)).length;
  return env;
}

const allRoutes = () => {
  const routes = ['', '/news', '/news?cat=guide', '/map', '/map?zone=sale', '/cadastre', '/census', '/cas', '/catalog', '/catalog?dept=materials', '/almanac', '/almanac?tab=skills', '/almanac?tab=cooking', '/almanac?tab=nature', '/maxis', '/letters', '/search', '/search?q=%D0%90%D0%BC%D0%B1%D1%80%D0%BE%D0%B7%D0%B8%D1%8F', '/search?q=zzzz'];
  data.news.forEach(a => routes.push(`/news?id=${a.id}`));
  return routes.map(r => base + r);
};

test('IE routes every Sunset Valley URL and the site is registered in search, WebRing, Clippy and Outlook', () => {
  allRoutes().concat([base + '/nothing-here']).forEach(u => assert.strictEqual(ie.identifyPageKey(u), 'sunsetvalley', u));
  assert.ok(ie.getPageTitle('sunsetvalley').includes('Сансет Вэлли'));
  const gamesCat = ie.searchDirectory.find(c => c.title === 'Компьютерные игры');
  assert.ok(gamesCat.sites.some(([u]) => u === base));
  ['sims', 'симс', 'maxis', 'сансет', 'амброзия'].forEach(q => assert.ok(ie.performSearch(q).some(r => r.url === base), q));
  assert.ok(window.retroSites.getWebRingSites().some(s => s.url === base));
  assert.ok(window.retroSites.renderYandex('http://www.yandex.ru/search?q=sims').includes(base));
  assert.ok(window.clippyHelp.search('sims сансет вэлли амброзия').some(h => h.entry.id === 'sunsetvalley-site'));
  assert.ok(window.clippyTips.catalog['sunsetvalley-sims']);

  const person = window.OutlookMail.people.find(p => p.addr === 'mayor@sunsetvalley98.com');
  assert.ok(person);
  assert.strictEqual(person.topics.length, 3);
  const replies = person.topics.map(t => t.r).join(' ');
  assert.ok(replies.includes('Кулинария 10'));
  assert.ok(replies.includes('24 жителя'));
  assert.ok(replies.includes(money(town.famByKey.landgraab.funds)));
  assert.ok(replies.includes(money(town.lotByKey.sale_starter.price)));
  assert.ok(!/Редвуд|Саммер Хилл|Плезант|рыбу-ангела|Монотонность/.test(replies));
});

test('Town model and site counts match the Sims 3 modules and the Igromania CD demo', () => {
  const cat = window.gameManager.catalog.sims3_demo;
  assert.ok(cat && cat.cdDemo && !cat.steam);
  assert.strictEqual(cat.setupExe, 'sims3demo.exe');
  assert.strictEqual(cat.targetExe, 'SIMS3.EXE');
  assert.ok(fs.existsSync(path.join(root, 'content/igromania/demos/sims3_demo-1.jpg')));
  assert.ok(fs.existsSync(path.join(root, 'content/igromania/demos/sims3_demo-2.jpg')));

  assert.strictEqual(Object.keys(S3.TRAITS).length, 56);
  assert.strictEqual(Object.keys(S3.LTW).length, 29);
  assert.strictEqual(Object.keys(S3.REWARDS).length, 16);
  assert.strictEqual(S3.FAMILIES.length, 10);
  assert.strictEqual(town.families.reduce((a, f) => a + f.sims.length, 0), 24);
  assert.strictEqual(Object.keys(S3.CAREERS).length, 11);
  assert.strictEqual(Object.keys(S3.PART_TIME).length, 3);
  assert.strictEqual(Object.values(S3.RECIPES).filter(r => !r.hidden).length, 22);
  assert.strictEqual(Object.keys(S3.FISH).length, 16);
  assert.strictEqual(Object.keys(S3.WALLPAPERS).length, 20);
  assert.strictEqual(Object.keys(S3.FLOORS).length, 15);
  assert.strictEqual(site.buyableObjects().length, 83);
  assert.ok(!site.buyableObjects().some(o => o.reward || !o.price));
  assert.strictEqual(town.lots.length, 39);
  const zones = {};
  town.lots.forEach(l => { zones[l.zone] = (zones[l.zone] || 0) + 1; });
  assert.deepStrictEqual(zones, { home: 10, sale: 5, empty: 2, rabbit: 15, venue: 7 });
  assert.ok(town.lotByKey.landgraab.poolTiles > 0 && town.lotByKey.alto.poolTiles > 0);
  assert.strictEqual(town.lotByKey.goth.poolTiles, 0);
});

test('Every number in the Vestnik, letters and services is taken from the game code', () => {
  const news = id => { const a = data.news.find(n => n.id === id); return [a.title, a.lead, ...a.body, ...(a.facts || [])].join(' '); };
  const fam = k => town.famByKey[k];
  const families = news('landgraab-vs-alto');
  ['landgraab', 'alto', 'goth'].forEach(k => assert.ok(families.includes(money(fam(k).funds)), k));
  assert.ok(families.includes(town.lotByKey.landgraab.address));
  assert.ok(families.includes(town.lotByKey.alto.address));
  assert.ok(families.includes(town.lotByKey.goth.address));
  const nick = fam('alto').sims.find(s => s.first === 'Ник');
  assert.strictEqual(nick.job.c, 'criminal');
  assert.ok(families.includes('к семи вечера') && S3.CAREERS.criminal.branches.evil.levels[nick.job.lvl - 6].start === 19);
  assert.strictEqual(fam('landgraab').sims.find(s => s.first === 'Джеффри').job.lvl, 9);
  assert.strictEqual(fam('landgraab').sims.find(s => s.first === 'Малкольм').ltw, 'ltw_rock');
  assert.strictEqual(fam('alto').sims.find(s => s.first === 'Холли').ltw, 'ltw_maestro');

  const market = news('real-estate-market');
  ['sale_starter', 'sale_town', 'sale_cottage', 'sale_ranch', 'sale_family', 'empty_1', 'empty_2'].forEach(k => {
    const l = town.lotByKey[k];
    assert.ok(market.includes(money(l.price)), k);
    assert.ok(market.includes(l.name), k);
  });
  assert.ok(market.includes('Садовой улице, ' + town.lotByKey.sale_starter.number) && town.lotByKey.sale_starter.street === 'Садовая улица');
  assert.strictEqual(town.lotByKey.sale_family.beds, 4);

  const ambrosia = news('ambrosia-secret');
  assert.deepStrictEqual(S3.RECIPES.ambrosia.ing.slice().sort(), ['deathfish', 'lifefruit']);
  assert.strictEqual(S3.RECIPES.ambrosia.lvl, 10);
  assert.strictEqual(S3.FISH.deathfish.lvl, 10);
  assert.deepStrictEqual(S3.FISH.deathfish.where, ['grave']);
  assert.ok(ambrosia.includes(money(S3.FISH.deathfish.value)));
  assert.strictEqual(S3.PLANTS.lifefruit.lvl, 7);
  assert.strictEqual(S3.PLANTS.lifefruit.days, 6);
  assert.strictEqual(S3.PLANTS.deathflower.lvl, 8);
  assert.ok(ambrosia.includes('с 20:00 до 6:00'));
  assert.ok(!/ангел|наживк|мудлет/i.test(JSON.stringify(data)));

  const careers = news('career-branches-1998');
  const top = (c, b) => S3.CAREERS[c].branches[b].levels[4];
  [['law', 'agent'], ['law', 'forensic'], ['criminal', 'evil'], ['criminal', 'thief'], ['military', 'officer'], ['military', 'astro'], ['music', 'rock'], ['music', 'symph']].forEach(([c, b]) => {
    assert.ok(careers.includes(money(top(c, b).pay)), c + ' ' + b);
  });

  const night = news('night-safety');
  assert.ok(night.includes(money(S3.OBJECTS.alarm_burglar.price)));
  assert.ok(night.includes(money(S3.OBJECTS.alarm_smoke.price)));
  const services = JSON.stringify(data.services);
  ['§60 за визит', '§40 за заказ', '§50 за каждую', '§260', '§500'].forEach(s => assert.ok(services.includes(s), s));

  const f7 = news('debug-f7-manual') + JSON.stringify(data.debug);
  const weather = [...read('js/apps/sims3/s3-weather.js').matchAll(/(clear|cloudy|rain|storm): \{ name: '([^']+)'/g)].map(m => m[2]);
  assert.strictEqual(weather.length, 4);
  weather.forEach(w => assert.ok(f7.includes(w) || f7.includes(w.toLowerCase().slice(0, 5)), w));
  const ui = read('js/apps/sims3/s3-ui.js');
  ["'F7'", "'KeyM'", "'F5'", "'Tab'", "'KeyV'", "'PageUp'"].forEach(k => assert.ok(ui.includes(k), k));

  const bylines = data.news.map(n => n.author).join(' ');
  const job = (f, first) => { const s = fam(f).sims.find(x => x.first === first); return S3.CAREERS[s.job.c].levels[s.job.lvl - 1].t.toLowerCase(); };
  assert.ok(bylines.includes('Кэти Уокер, ' + job('frost', 'Кэти')));
  assert.ok(bylines.includes('Пол Митчелл, ' + job('mitchell', 'Пол')));
  assert.ok(bylines.includes(job('parker', 'Лиза').replace(/^./, c => c.toUpperCase()) + ' Лиза Паркер'));
  assert.ok(!/Уилл Райт,|Джефф Браун,/.test(bylines));

  data.letters.forEach(l => {
    const lot = town.lotByKey[l.lot];
    assert.ok(lot && lot.familyObj, l.id);
    assert.ok(lot.familyObj.sims.some(s => `${s.first} ${s.last}` === l.from), l.from);
  });
  assert.ok(data.letters.find(l => l.lot === 'aldridge').a.includes('15%'));
  assert.ok(fam('aldridge').sims.find(s => s.first === 'Уолтер').traits.includes('frugal'));
  assert.ok(S3.LTW.ltw_author.desc.includes('15 книг'));
  assert.ok(!JSON.stringify(data).includes('Никаких счетов'));
});

test('Home: CD demo box when installed and not, town facts, day clock, news links and poll', () => {
  global.localStorage.clear();
  installed.clear();
  window.gameManager.catalog.sims3_demo.launch = () => { lastLaunch = 'sims3_demo'; };

  let env = browse(base);
  assert.ok(env.html.includes('D:\\demo\\sims3demo.exe'));
  assert.ok(!env.html.includes('Steam'));
  env.click('[data-sv-action]', 'svAction', 'cd-open');
  assert.strictEqual(lastCd, 'sims3_demo');
  assert.ok(env.text.includes('Ландграаб (§68 000)'));
  data.dayClock.forEach(([t]) => assert.ok(env.html.includes(t)));
  assert.strictEqual(env.els.filter(e => (e.attrs['data-url'] || '').includes('/news?id=')).length, 4);
  assert.strictEqual(env.count('.sv-sign'), 9);
  assert.ok(env.find('.sv-sign').classList.includes('is-here'));

  installed.add('sims3_demo');
  env = browse(base);
  assert.ok(env.html.includes('Запустить SIMS3.EXE'));
  env.click('[data-sv-action]', 'svAction', 'game-launch');
  assert.strictEqual(lastLaunch, 'sims3_demo');
  installed.clear();

  env = browse(base);
  env.click('[data-sv-vote]', 'svVote', 'coast');
  assert.strictEqual(JSON.parse(global.localStorage.getItem('win98_sunsetvalley_poll_v1')).picked, 'coast');
  assert.ok(env.html.includes('ваш голос'));
  env.click('[data-sv-action]', 'svAction', 'poll-reset');
  assert.ok(!env.html.includes('ваш голос'));
});

test('Vestnik: front page, rubric filter, article with facts box, prev/next and legacy links', () => {
  let env = browse(base + '/news');
  assert.strictEqual(env.els.filter(e => (e.attrs['data-url'] || '').includes('/news?id=')).length >= data.news.length, true);
  env = browse(base + '/news?cat=families');
  assert.ok(env.html.includes('Холм против Южной улицы'));
  assert.ok(!env.html.includes('Пульт F7'));
  env = browse(base + '/news?id=ambrosia-secret');
  assert.ok(env.html.includes('sv-aside'));
  assert.ok(env.html.includes('Холм против Южной улицы'));
  assert.ok(env.html.includes('Пять домов и два участка'));
  assert.ok(site.getPageTitle(base + '/news?id=ambrosia-secret').startsWith('Амброзия'));
  env = browse(base + '/?post=landgraab-vs-alto');
  assert.ok(env.html.includes('sv-article'));
  env = browse(base + '/?cat=guide');
  assert.ok(env.html.includes('Колонка полиции'));
  env = browse(base + '/news?id=nope');
  assert.ok(env.html.includes('Статья не найдена'));
});

test('Map: SVG plat map with all lots, deed card, lot plan with walls, zone filter and sale budget', () => {
  site.mapZone = 'all';
  site.budgetSimoleons = 20000;
  const env = browse(base + '/map?lot=sale_starter');
  assert.ok(env.count('[data-sv-lot]') >= 39 + 7);
  const lot = town.lotByKey.sale_starter;
  assert.ok(env.html.includes('Участок № ' + (lot.id + 1)));
  assert.ok(env.text.includes(money(lot.price)));
  assert.ok(env.html.includes('<line '));
  S3.HROADS.concat(S3.VROADS).forEach(r => assert.ok(env.html.includes(r.name), r.name));

  env.click('[data-sv-lot]', 'svLot', 'goth');
  assert.strictEqual(env.url, base + '/map?lot=goth');
  assert.ok(env.html.includes('Владельцы'));
  assert.ok(env.html.includes('Особняк Готов'));

  env.click('[data-sv-zone]', 'svZone', 'sale');
  assert.strictEqual(site.mapZone, 'sale');
  assert.ok(env.html.includes('<b>Дом продаётся (5)</b>'));

  env.find('#sv-budget-input').value = '150000';
  env.click('[data-sv-action]', 'svAction', 'calc-budget');
  assert.strictEqual(site.budgetSimoleons, 150000);
  assert.ok(!env.html.includes('sv-short">-'));
  site.mapZone = 'all';
  assert.strictEqual(browse(base + '/cadastre').url, base + '/cadastre');
});

test('Census: ledger of 10 households, household sheet, search form and loading a resident into the passport form', () => {
  site.selectedFamilyKey = 'goth';
  site.censusQuery = '';
  let env = browse(base + '/census');
  assert.strictEqual(env.count('[data-sv-family]'), 10);
  assert.ok(env.html.includes('Переписной лист: семья Гот'));
  env.find('#sv-census-input').value = 'Ландграаб';
  env.find('#sv-census-form').fire('submit');
  assert.strictEqual(env.count('[data-sv-family]'), 1);
  env.click('[data-sv-action]', 'svAction', 'census-clear');
  assert.strictEqual(env.count('[data-sv-family]'), 10);

  env.click('[data-sv-load-sim]', 'svLoadSim', 'goth:Гюнтер');
  assert.strictEqual(env.url, base + '/cas');
  assert.strictEqual(site.casLast, 'Гот');
  assert.ok(site.casTraits.includes('genius'));

  env = browse(base + '/census?family=goth');
  env.click('[data-sv-load-sim]', 'svLoadSim', 'goth:Мортимер');
  assert.strictEqual(site.casAge, 'child');
  assert.ok(env.html.includes('Отмечено 3 из 3'));
});

test('Passport form: 56 trait checkboxes, conflicts, age limits, life wish and Notepad export', () => {
  Object.assign(site, { casFirst: 'Тестовый', casLast: 'Житель', casAge: 'ya', casTraits: ['good'], casNotice: '' });
  const env = browse(base + '/cas');
  assert.strictEqual(env.count('[data-sv-trait]'), 56);

  env.click('[data-sv-trait]', 'svTrait', 'evil');
  assert.ok(!site.casTraits.includes('evil'));
  assert.ok(env.html.includes('несовместима с чертой'));

  ['genius', 'bookworm', 'natural_cook', 'angler'].forEach(t => env.click('[data-sv-trait]', 'svTrait', t));
  assert.strictEqual(site.casTraits.length, 5);
  env.click('[data-sv-trait]', 'svTrait', 'neat');
  assert.strictEqual(site.casTraits.length, 5);
  assert.ok(env.html.includes('не больше 5 черт'));
  assert.ok(env.html.includes('Кулинария +'));

  const firstWish = env.find('[data-sv-ltw]').dataset.svLtw;
  assert.strictEqual(firstWish, site.computeCasAnalysis().recommendations[0].key);
  env.click('[data-sv-ltw]', 'svLtw', firstWish);
  assert.strictEqual(site.casLtw, firstWish);

  env.click('[data-sv-action]', 'svAction', 'export-cas');
  assert.strictEqual(lastNotepad.title, 'SimPassport_Житель.txt');
  assert.ok(lastNotepad.content.includes('ФОРМА CAS-1'));
  assert.ok(lastNotepad.content.includes('Тестовый Житель'));
  assert.ok(lastNotepad.content.includes('+20 000'));
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\SimPassport_Житель.txt'));

  site.casAge = 'child';
  site.fitTraitsToAge();
  assert.strictEqual(site.casTraits.length, 3);
  assert.ok(site.casTraits.every(k => site.ageIndex(S3.TRAITS[k].age || 'child') <= site.ageIndex('child')));
  site.casAge = 'ya';
});

test('Trading house: 83 wares, item card with two Create-A-Style channels, room filter and sample book', () => {
  site.catalogRoom = 'all';
  let env = browse(base + '/catalog');
  assert.strictEqual(env.count('[data-sv-item]'), 83);
  env.click('[data-sv-item]', 'svItem', 'sofa_lux');
  assert.strictEqual(site.selectedItemKey, 'sofa_lux');
  assert.ok(env.html.includes('Диван «Бархат»'));
  env.click('[data-sv-swatch]', 'svSwatch', 'a:2');
  env.click('[data-sv-swatch]', 'svSwatch', 'b:1');
  assert.strictEqual(site.swatchA, 2);
  assert.strictEqual(site.swatchB, 1);
  assert.ok(env.html.includes(`fill="${S3.OBJECTS.sofa_lux.pal[0][2]}"`));

  env.click('[data-sv-dept]', 'svDept', 'beds');
  assert.strictEqual(env.count('[data-sv-item]'), site.buyableObjects().filter(o => o.func === 'beds').length);
  env.click('[data-sv-room]', 'svRoom', 'kids');
  assert.strictEqual(env.count('[data-sv-item]'), site.buyableObjects().filter(o => o.func === 'beds' && o.rooms.includes('kids')).length);
  site.catalogRoom = 'all';

  env = browse(base + '/catalog?dept=materials');
  Object.values(S3.WALLPAPERS).concat(Object.values(S3.FLOORS)).forEach(m => assert.ok(env.html.includes(m.name), m.name));
});

test('Reference book: four chapters, career ladders with both branches, skills, recipes and nature', () => {
  let env = browse(base + '/almanac?career=law');
  assert.strictEqual(env.count('[data-sv-career]'), 10);
  Object.values(S3.CAREERS.law.branches).forEach(b => b.levels.forEach(l => assert.ok(env.html.includes(l.t), l.t)));
  assert.ok(env.text.includes(money(S3.CAREERS.law.branches.agent.levels[4].pay) + '/ч'));
  data.services.forEach(s => assert.ok(env.html.includes(s.name)));

  env.click('[data-sv-almanac-tab]', 'svAlmanacTab', 'skills');
  Object.values(S3.SKILLS).forEach(s => assert.ok(env.html.includes(s.name)));
  env.click('[data-sv-almanac-tab]', 'svAlmanacTab', 'cooking');
  assert.ok(env.html.includes('Амброзия'));
  assert.ok(env.html.includes('Плод жизни'));
  env.click('[data-sv-almanac-tab]', 'svAlmanacTab', 'nature');
  assert.ok(env.html.includes('Рыба смерти'));
  assert.ok(env.html.includes('Радужная форель'));
  assert.ok(env.html.includes('20:00–6:00'));
  assert.strictEqual(browse(base + '/recipes').html.includes('class="is-on" data-sv-almanac-tab="cooking"'), true);
});

test('Maxis page, letters, guestbook escaping, search and the raw 404 page', () => {
  let env = browse(base + '/maxis');
  assert.ok(env.html.includes('content/igromania/demos/sims3_demo-1.jpg'));
  data.controls.forEach(([keys]) => keys.forEach(k => assert.ok(env.html.includes(`<span class="sv-key">${site.esc(k)}</span>`), k)));
  assert.ok(env.html.includes('Молодой'));

  global.localStorage.clear();
  env = browse(base + '/letters');
  assert.ok(env.html.includes('mailto:mayor@sunsetvalley98.com'));
  assert.ok(env.html.includes('Корнелия Гот'));
  env.find('#sv-gb-name').value = 'Белла<script>';
  env.find('#sv-gb-town').value = 'Южная улица';
  env.find('#sv-gb-text').value = 'Привет <b>Мир</b>';
  env.click('[data-sv-action]', 'svAction', 'gb-submit');
  assert.strictEqual(site.getGuestbookEntries().length, data.guestbookSeeds.length + 1);
  assert.ok(env.html.includes('Белла&lt;script&gt;'));
  assert.ok(!env.html.includes('<script>'));

  env = browse(base + '/search?q=%D0%90%D0%BC%D0%B1%D1%80%D0%BE%D0%B7%D0%B8%D1%8F');
  assert.ok(env.html.includes('/news?id=ambrosia-secret'));
  env.find('#sv-search-input').value = 'маяк';
  env.find('#sv-search-form').fire('submit');
  assert.ok(env.url.endsWith('/search?q=' + encodeURIComponent('маяк')));
  assert.ok(env.html.includes('/map?lot=lighthouse'));
  assert.ok(browse(base + '/search?q=zzzz').html.includes('Ничего не найдено'));

  env = browse(base + '/nothing-here');
  assert.ok(env.html.includes('Not Found'));
  assert.ok(!env.html.includes('sv-signs'));
});

test('Web 1.0 rules: no emoji, Microslop and Win naming, web-safe flat CSS, zero comments', () => {
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  const badMs = new RegExp('\\bMicro' + 'soft\\b', 'i');
  const badWin = new RegExp('\\bWin' + 'dows\\b', 'i');
  allRoutes().forEach(u => {
    const html = site.renderSite(u);
    assert.ok(!EMOJI.test(html), `emoji on ${u}`);
    assert.ok(!badMs.test(html), `forbidden vendor name on ${u}`);
    assert.ok(!badWin.test(html), `forbidden OS name on ${u}`);
    assert.ok(!/undefined|NaN|\[object/.test(html), `bad value on ${u}`);
  });

  const css = read('css/apps/sunsetvalley-site.css');
  ['border-radius', 'box-shadow', 'text-shadow', 'rgba(', 'gradient', 'blur(', 'transition', 'animation', 'opacity'].forEach(p => {
    assert.ok(!css.includes(p), `forbidden ${p}`);
  });
  const colors = css.match(/#[0-9a-fA-F]{6}\b/g) || [];
  colors.forEach(c => assert.ok(/^#([0369cf])\1([0369cf])\2([0369cf])\3$/i.test(c), `not web-safe ${c}`));
  assert.ok(!/\/\*|\*\//.test(css), 'comments in css');
  ['js/apps/sunsetvalley-data.js', 'js/apps/sunsetvalley-site.js', 'tests/sunsetvalley-site.test.js'].forEach(f => {
    assert.ok(!/\/\*|\*\/|^\s*\/\//m.test(read(f)), `comments in ${f}`);
  });

  const index = read('index.html');
  assert.ok(index.indexOf('js/apps/sunsetvalley-data.js') > 0 && index.indexOf('js/apps/sunsetvalley-data.js') < index.indexOf('js/apps/sunsetvalley-site.js'));
});

console.log(`\nALL ${passed} SUNSET VALLEY SITE TESTS PASSED`);
