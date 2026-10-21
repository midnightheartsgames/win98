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
let lastLaunch = null;
const vfsFiles = new Map();
const installed = new Set();
const owned = new Set();

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

['diablo/diablo-data', 'diablo2/d2-core', 'diablo2/d2-data-classes', 'diablo2/d2-data-items', 'diablo2/d2-data-world', 'diablo2/d2-items', 'ow98/ow-data'].forEach(f => require(path.join(root, 'js/apps', f + '.js')));

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
    open: (filePath, title, content) => { lastNotepad = { title, content }; }
  },
  Diablo2: globalThis.Diablo2
};

eval(read('js/game-manager.js'));
window.gameManager.isInstalled = id => installed.has(id);
window.gameManager.isPurchased = id => owned.has(id);
window.gameManager.ownsOnSteam = id => owned.has(id);
window.gameManager.showInSteam = id => { lastSteam = id; };

eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/blizzard-data.js'));
eval(read('js/apps/blizzard-site.js'));
eval(read('js/apps/ie.js'));
eval(read('js/apps/clippy-help.js'));
eval(read('js/apps/clippy-tips.js'));
eval(read('js/apps/outlook-mail.js'));

const ie = window.appIE;
const site = window.blizzardSite;
const data = window.BLIZZARD_DATA;
const D2 = globalThis.Diablo2;
const D1 = globalThis.Diablo98.DATA;
const OW = globalThis.Ow98;
const base = 'http://www.blizzard.com';
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
      env.els = parseElements(env.html);
      site.attachEvents(w, container, this.currentUrl);
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
  const routes = ['', '/news', '/games', '/warcraft', '/sanctuary', '/battlenet', '/support', '/studio', '/search', '/search?q=Warcraft', '/search?q=zzzz', '/news?id=nope', '/catalog', '/cube', '/about'];
  data.games.forEach(g => routes.push(`/game?id=${g.id}`));
  data.news.forEach(n => routes.push(`/news?id=${n.id}`));
  return routes.map(r => base + r);
};

test('IE routes every Blizzard URL to the site and lists Blizzard in search engines, WebRing, Clippy and Outlook', () => {
  allRoutes().forEach(u => assert.strictEqual(ie.identifyPageKey(u), 'blizzard', u));
  assert.ok(ie.getPageTitle('blizzard').includes('Blizzard Entertainment'));
  const gamesCat = ie.searchDirectory.find(c => c.title === 'Компьютерные игры');
  assert.ok(gamesCat.sites.some(([u]) => u === base));
  ['blizzard', 'diablo', 'warcraft'].forEach(q => assert.ok(ie.performSearch(q).some(r => r.url === base), q));
  assert.ok(window.retroSites.getWebRingSites().some(s => s.url === base));
  assert.ok(window.retroSites.renderYandex('http://www.yandex.ru/search?q=blizzard').includes(base));
  assert.ok(window.clippyHelp.search('blizzard diablo warcraft руны').some(h => h.entry.id === 'blizzard-site'));
  assert.ok(window.clippyTips.catalog['blizzard-bnet']);

  const person = window.OutlookMail.people.find(p => p.addr === 'support@blizzard.com');
  assert.ok(person);
  assert.strictEqual(person.topics.length, 3);
  const d2Reply = person.topics.find(t => t.id === 'diablo2').r;
  assert.ok(!/Jah|Ber\b|Хорадрический куб, положите/.test(d2Reply), 'Outlook does not promise content missing from Diablo II');
  assert.ok(d2Reply.includes('Тал + Тул + Орт + Амн'));
});

test('Game pages match the Steam catalog and the game code', () => {
  assert.deepStrictEqual(data.games.map(g => g.id), ['diablo', 'diablo2', 'ow98']);
  data.games.forEach(g => {
    const cat = window.gameManager.catalog[g.id];
    assert.ok(cat && cat.steam, `steam entry ${g.id}`);
    assert.strictEqual(g.title, cat.title);
    assert.strictEqual(g.exe, `C:\\Games\\${cat.folder}\\${cat.targetExe}`, `exe ${g.id}`);
    assert.strictEqual(g.size, cat.fileSize, `size ${g.id}`);
    assert.strictEqual(site.getGameState(g.id).priceDisplay, cat.priceDisplay);
    assert.ok(fs.existsSync(path.join(root, `content/steam/${g.id}-1.jpg`)));
    assert.ok(fs.existsSync(path.join(root, `content/steam/${g.id}-2.jpg`)));
  });

  const d1 = data.games.find(g => g.id === 'diablo');
  Object.values(D1.CLASSES).forEach(c => {
    const row = d1.classes.find(r => r.name === c.name);
    assert.ok(row, `Diablo class ${c.name}`);
    const life = c.life(c.base, 1);
    const mana = c.mana(c.base, 1);
    assert.strictEqual(row.stats, `Сила ${c.base.str}, Магия ${c.base.mag}, Ловкость ${c.base.dex}, Живучесть ${c.base.vit}. Здоровье ${life}, мана ${mana}.`, c.name);
  });
  assert.ok(JSON.stringify(d1).includes('1666'));
  assert.strictEqual(D1.BOSSES.diablo.hp[0], 1666);

  const d2 = data.games.find(g => g.id === 'diablo2');
  D2.CLASS_ORDER.forEach(id => {
    const c = D2.CLASSES[id];
    const row = d2.classes.find(r => r.id === id);
    assert.ok(row, `Diablo II class ${id}`);
    assert.strictEqual(row.name, c.name);
    assert.strictEqual(row.stats, `Сила ${c.str}, Ловкость ${c.dex}, Живучесть ${c.vit}, Энергия ${c.ene}`);
    assert.strictEqual(row.skill, c.trees.join(', '));
  });
  const d2Text = JSON.stringify(d2);
  D2.QUESTS.forEach(q => assert.ok(JSON.stringify(data).includes(`«${q.name}»`), `quest ${q.name}`));
  ['Кровавый Ворон', 'Раканишу', 'Графиня', 'Кузнец', 'Костяной Пепел', 'Андариэль', 'Питспаун Фаулдог', 'Древоголов Лесокулак'].forEach(b => assert.ok(d2Text.includes(b), b));
  assert.ok(d2Text.includes('Забытая башня (2 подвала)') && d2Text.includes('Катакомбы (2 уровня)'));

  const ow = data.games.find(g => g.id === 'ow98');
  const roles = { offense: 'Нападение', defense: 'Защита', tank: 'Танки', support: 'Поддержка' };
  OW.HERO_ORDER.forEach(id => {
    const h = OW.HEROES[id];
    const row = ow.classes.find(r => r.name === roles[h.role]);
    const display = h.name.replace('MCCREE', 'McCree').replace('SOLDIER: 76', 'Soldier: 76');
    assert.ok(row.stats.toLowerCase().includes(display.toLowerCase()), `${id} in ${row.name}`);
    const ult = h.kit.find(a => a.key === 'Q');
    assert.ok(row.skill.includes(`«${ult.name}»`), `${id} ultimate`);
  });
});

test('Home shows dated news with rubric filter, Steam shelf, gateway status and a radio poll', () => {
  global.localStorage.clear();
  site.newsFilter = 'all';
  site.pollNotice = '';
  const env = browse(base);
  assert.strictEqual(env.count('.blz-news-card'), data.news.length);
  assert.ok(env.html.includes('WARCRAFT: Хроники Азерота'));
  data.studio.gateways.forEach(g => assert.ok(env.html.includes(g.users.toLocaleString('ru-RU'))));

  env.click('[data-news-filter]', 'newsFilter', 'warcraft');
  assert.strictEqual(env.count('.blz-news-card'), 2);
  env.click('[data-news-filter]', 'newsFilter', 'ow98');
  assert.strictEqual(env.count('.blz-news-card'), 1);
  env.click('[data-news-filter]', 'newsFilter', 'all');

  env.click('#blz-poll-vote');
  assert.ok(env.html.includes('Сначала выберите вариант ответа.'));
  const radio = env.els.find(e => e.attrs.name === 'blz-poll' && e.attrs.value === 'warcraft_wait');
  radio.checked = true;
  env.click('#blz-poll-vote');
  assert.strictEqual(JSON.parse(global.localStorage.getItem('blizzard98_poll_v1')).voted, 'warcraft_wait');
  assert.ok(env.html.includes('(ваш выбор)'));
  assert.ok(!env.html.includes('id="blz-poll-vote"'));
});

test('News archive and press releases have their own URLs and export to Notepad', () => {
  const list = browse(base + '/news');
  data.news.forEach(n => assert.ok(list.html.includes(`/news?id=${n.id}`)));
  assert.ok(list.html.includes('mailto:support@blizzard.com'));

  const env = browse(base + '/news?id=diablo2-steam');
  assert.ok(env.html.includes('blz-press'));
  assert.ok(env.html.includes('САН-МАТЕО, Калифорния, 21 ноября 1998 г.'));
  assert.ok(env.html.includes('###'));
  env.click('.blz-btn-save-news[data-news-id]', 'newsId', 'diablo2-steam');
  assert.strictEqual(lastNotepad.title, 'BLIZZARD_DIABLO2_STEAM.TXT');
  assert.ok(lastNotepad.content.includes('DIABLO II В STEAM'));
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\BLIZZARD_DIABLO2_STEAM.TXT'));

  assert.ok(browse(base + '/news?id=nope').html.includes('Новость не найдена'));
});

test('Games shelf and game pages follow Steam store, owned and installed states', () => {
  installed.clear();
  owned.clear();
  const shelf = browse(base + '/games');
  assert.ok(shelf.html.includes('На подходе, в разработке'));
  assert.ok(shelf.html.includes('$47.99 в Steam'));
  const before = site.computeDownloadTime('980 MB');
  const modem = shelf.find('#blz-modem-select');
  modem.value = 'isdn';
  modem.fire('change');
  assert.strictEqual(site.selectedModem, 'isdn');
  assert.notStrictEqual(site.computeDownloadTime('980 MB'), before);
  site.selectedModem = '56k';

  window.gameManager.catalog.diablo2.launch = () => { lastLaunch = 'diablo2'; };
  let env = browse(base + '/game?id=diablo2');
  assert.ok(env.html.includes('blz-theme-diablo2'));
  assert.ok(env.html.includes('Купить в Steam ($47.99)'));
  assert.ok(env.html.includes('Лагерь разбойниц. [Увеличить]'));
  env.click('[data-shot-zoom]', 'shotZoom', 'diablo2-0');
  assert.ok(env.html.includes('[Уменьшить]'));
  env.click('[data-shot-zoom]', 'shotZoom', 'diablo2-0');
  assert.ok(!env.html.includes('[Уменьшить]'));
  ['about', 'heroes', 'world', 'people', 'keys', 'req'].forEach(s => {
    assert.ok(env.html.includes(`data-blz-jump="blz-sec-${s}"`) && env.html.includes(`id="blz-sec-${s}"`), s);
  });
  env.click('[data-blz-jump]', 'blzJump', 'blz-sec-req');

  env.click('.blz-btn-open-steam[data-game-id]', 'gameId', 'diablo2');
  assert.strictEqual(lastSteam, 'diablo2');
  owned.add('diablo2');
  env = browse(base + '/game?id=diablo2');
  assert.ok(env.html.includes('Скачать в Steam'));
  installed.add('diablo2');
  env = browse(base + '/game?id=diablo2');
  env.click('.blz-btn-launch-game[data-game-id]', 'gameId', 'diablo2');
  assert.strictEqual(lastLaunch, 'diablo2');
  env.click('.blz-btn-save-dossier[data-game-id]', 'gameId', 'diablo2');
  assert.ok(vfsFiles.get('My Computer\\C:\\My Documents\\DOSSIER_DIABLO2.TXT').includes('DIABLO II'));
  installed.clear();
  owned.clear();
});

test('Warcraft page: map places, unit barracks with grumbling voice lines and build log export', () => {
  site.selectedUnitId = 'worker';
  site.unitClickCounts = {};
  site.lastUnitQuote = '';
  site.warcraftSide = 'both';
  const env = browse(base + '/warcraft');
  assert.ok(env.html.includes('В разработке. Выйдет в Steam для Win 98.'));
  assert.strictEqual(env.count('[data-wc-place]'), data.warcraft.places.length);
  env.click('[data-wc-place]', 'wcPlace', 'portal');
  assert.ok(env.html.includes('Врата из Дренора'));

  env.click('[data-wc-unit]', 'wcUnit', 'infantry');
  assert.ok(env.html.includes('Пехотинец'));
  for (let i = 0; i < 4; i++) env.click('#blz-btn-order-horde');
  assert.strictEqual(site.unitClickCounts.infantry, 4);
  assert.ok(env.html.includes('Бугай (раздражён)'));

  env.click('[data-wc-side]', 'wcSide', 'alliance');
  assert.strictEqual(env.count('#blz-btn-order-horde'), 0);
  assert.strictEqual(env.count('#blz-btn-order-alliance'), 1);
  site.warcraftSide = 'both';

  env.click('#blz-btn-save-warcraft');
  assert.strictEqual(lastNotepad.title, 'WARCRAFT_PREVIEW_98.TXT');
  assert.ok(lastNotepad.content.includes('WARCRAFT: ХРОНИКИ АЗЕРОТА'));
});

test('Horadric library reads runes and runewords from Diablo II and checks base type and order', () => {
  site.slottedRunes = [];
  site.forgeBase = 'sword';
  site.cainSteps = {};
  assert.strictEqual(site.runes().length, D2.RUNES.length);
  const words = site.runewords();
  assert.strictEqual(words.length, D2.RUNEWORDS.length);
  words.forEach(w => {
    const src = D2.RUNEWORDS.find(r => r.id === w.id);
    assert.deepStrictEqual(w.lines, D2.statLines(src.stats));
    assert.ok(w.note, `note for ${w.id}`);
  });
  assert.deepStrictEqual(Object.keys(data.sanctuary.notes).sort(), D2.RUNEWORDS.map(r => r.id).sort());
  const types = new Set(D2.RUNEWORDS.flatMap(r => r.types));
  types.forEach(t => assert.ok(data.sanctuary.baseTypes.some(b => b.id === t), `base type ${t}`));

  const env = browse(base + '/sanctuary');
  assert.strictEqual(env.count('[data-add-rune]'), 25);
  env.click('[data-add-rune]', 'addRune', 'tir');
  env.click('[data-add-rune]', 'addRune', 'el');
  assert.ok(env.html.includes('РУННОЕ СЛОВО СОБРАНО: «Сталь»'));
  const baseSel = env.find('#blz-forge-base');
  baseSel.value = 'body';
  baseSel.fire('change');
  assert.ok(env.html.includes('Эти руны дают «Сталь»'));
  env.click('#blz-forge-pop');
  assert.deepStrictEqual(site.slottedRunes, ['tir']);
  env.click('#blz-clear-runes');
  assert.deepStrictEqual(site.slottedRunes, []);

  env.click('[data-rw-preset]', 'rwPreset', 'spirit');
  assert.deepStrictEqual(site.slottedRunes, D2.RUNEWORDS.find(r => r.id === 'spirit').runes);
  assert.strictEqual(site.forgeBase, 'sword');
  assert.ok(env.html.includes('РУННОЕ СЛОВО СОБРАНО: «Дух»'));

  assert.ok(!env.html.includes('Тесак Мясника'));
  for (let i = 0; i < 3; i++) env.click('.blz-btn-cain-next[data-quest-id]', 'questId', 'd1-butcher');
  assert.ok(env.html.includes('Тесак Мясника'));
  assert.ok(env.html.includes('Все 3 свитка открыты'));
  assert.ok(D1.UNIQUES.some(u => u.name === 'Тесак Мясника'));

  env.click('#blz-btn-save-tome');
  assert.strictEqual(lastNotepad.title, 'BLIZZARD_RUNEWORDS.TXT');
  assert.ok(lastNotepad.content.includes('Дух [Тал + Тул + Орт + Амн]'));

  const clippy = read('js/apps/clippy.js');
  assert.ok(clippy.includes("slottedRunes = ['tal', 'thul', 'ort', 'amn']") && clippy.includes("forgeBase = 'sword'"));
});

test('Battle.net page: gateways, ping, channels and escaped player messages', () => {
  global.localStorage.clear();
  site.bnetChannel = 'Tristram-RUS-1';
  const env = browse(base + '/battlenet');
  const seedsIn = c => data.bnetPosts.filter(p => p.channel === c).length;
  assert.strictEqual(env.count('.blz-chat-line'), seedsIn('Tristram-RUS-1'));

  const gw = env.find('#blz-gateway-select');
  gw.value = 'uswest';
  gw.fire('change');
  assert.ok(env.html.includes('Расчётный пинг: <b>240 мс</b>'));
  site.selectedGatewayId = 'europe';

  env.find('#blz-bnet-nick').value = 'Thrall<script>';
  env.find('#blz-bnet-text').value = 'За Орду! <b>Лок-тар!</b>';
  env.click('#blz-bnet-send');
  assert.strictEqual(env.count('.blz-chat-line'), seedsIn('Tristram-RUS-1') + 1);
  assert.ok(env.html.includes('Thrall&lt;script&gt;'));
  assert.ok(env.html.includes('&lt;b&gt;Лок-тар!&lt;/b&gt;'));
  assert.ok(!env.html.includes('<script>'));

  env.click('[data-bnet-chan]', 'bnetChan', 'Azeroth-Tavern');
  assert.strictEqual(env.count('.blz-chat-line'), seedsIn('Azeroth-Tavern'));
  site.bnetChannel = 'Tristram-RUS-1';
});

test('Support, studio and site search', () => {
  const support = browse(base + '/support');
  data.support.forEach(s => assert.ok(support.html.includes(`data-blz-jump="blz-faq-${s.id}"`) && support.html.includes(`id="blz-faq-${s.id}"`)));
  assert.ok(support.html.includes('mailto:support@blizzard.com'));

  const studio = browse(base + '/studio');
  assert.ok(studio.html.includes('Blizzard North'));
  assert.ok(studio.html.includes('Warcraft: Orcs &amp; Humans'));

  const env = browse(base);
  env.find('#blz-site-search').value = 'Дух';
  env.click('#blz-site-search-btn');
  assert.ok(env.url.endsWith('/search?q=%D0%94%D1%83%D1%85'));
  assert.ok(env.html.includes('Дух (Тал + Тул + Орт + Амн)'));
  assert.ok(browse(base + '/search?q=Tracer').html.includes('Overwatch 98'));
  assert.ok(browse(base + '/search?q=zzzz').html.includes('Ничего не найдено'));
});

test('Web 1.0 rules: no invented game content, no emoji, Microslop and Win naming, no modern CSS, zero comments', () => {
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  allRoutes().forEach(u => {
    const html = site.renderSite(u);
    assert.ok(!EMOJI.test(html), `emoji on ${u}`);
    assert.ok(!/\bMicrosoft\b/i.test(html), `Microsoft on ${u}`);
    assert.ok(!/\bWindows\b/i.test(html), `Windows on ${u}`);
    assert.ok(!/undefined|NaN|\[object/.test(html), `bad value on ${u}`);
    assert.ok(!/Enigma|Загадка|Хорадрическ\w+ куб|коровий/.test(html), `content missing from the games on ${u}`);
  });

  const css = read('css/apps/blizzard-site.css');
  ['border-radius', 'box-shadow', 'text-shadow', 'rgba(', 'linear-gradient', 'radial-gradient', 'blur(', 'transition', 'animation', 'opacity'].forEach(p => {
    assert.ok(!css.includes(p), `forbidden ${p}`);
  });
  assert.ok(!/\/\*|\*\//.test(css), 'comments in css/apps/blizzard-site.css');
  ['js/apps/blizzard-data.js', 'js/apps/blizzard-site.js', 'tests/blizzard-site.test.js'].forEach(f => {
    assert.ok(!/\/\*|\*\/|^\s*\/\//m.test(read(f)), `comments in ${f}`);
  });

  const index = read('index.html');
  assert.ok(index.indexOf('js/apps/blizzard-data.js') > 0 && index.indexOf('js/apps/blizzard-data.js') < index.indexOf('js/apps/blizzard-site.js'));
});

console.log(`\nALL ${passed} BLIZZARD ENTERTAINMENT SITE TESTS PASSED`);
