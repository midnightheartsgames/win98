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
let lastWizard = null;
let steamClientOpened = 0;
const vfsFiles = new Map();
const installed = new Set();
const owned = new Set();
const downloaded = new Set();

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
    open: (fileName, content, filePath) => { lastNotepad = { title: fileName, content, filePath }; }
  },
  appSteam: { open: () => { steamClientOpened++; }, downloads: new Map() }
};

eval(read('js/game-manager.js'));
['isInstalled', 'ownsOnSteam', 'isDownloaded', 'showInSteam', 'openSetupWizard'].forEach(m => assert.strictEqual(typeof window.gameManager[m], 'function', `gameManager.${m}`));
assert.strictEqual(typeof window.gameManager.catalog.hl2.launch, 'function');
window.gameManager.isInstalled = id => installed.has(id);
window.gameManager.ownsOnSteam = id => owned.has(id);
window.gameManager.isDownloaded = id => downloaded.has(id);
window.gameManager.showInSteam = id => { lastSteam = id; };
Object.keys(window.gameManager.catalog).forEach(id => { window.gameManager.catalog[id].launch = () => { lastLaunch = id; }; });
window.gameManager.openSetupWizard = id => { lastWizard = id; };

eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/steam-site.js'));
eval(read('js/apps/valve-data.js'));
eval(read('js/apps/valve-site.js'));
eval(read('js/apps/ie.js'));
eval(read('js/apps/clippy-help.js'));
eval(read('js/apps/clippy-tips.js'));
eval(read('js/apps/outlook-mail.js'));

const ie = window.appIE;
const site = window.valveSite;
const data = window.VALVE_DATA;
const gmCatalog = window.gameManager.catalog;
const base = 'http://www.valvesoftware.com';
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

const resetState = () => {
  installed.clear();
  owned.clear();
  downloaded.clear();
  window.appSteam.downloads.clear();
  lastSteam = null;
  lastLaunch = null;
  lastWizard = null;
  steamClientOpened = 0;
};

const allRoutes = () => {
  const routes = ['', '/games', '/news', '/news?cat=Steam', '/lab', '/company', '/letters', '/search', '/search?q=гравипушка', '/search?q=zzzznone'];
  data.projects.forEach(p => routes.push(`/game?id=${p.id}`));
  data.news.forEach(n => routes.push(`/article?id=${n.id}`));
  return routes.map(r => base + r);
};

const fakeContainer = html => {
  const els = [];
  const re = /<(a|button|select|form)\b([^>]*\bdata-vlv="([^"]+)"[^>]*)>/g;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[2];
    const dataset = { vlv: m[3] };
    attrs.replace(/data-(id|n|cat)="([^"]*)"/g, (_, k, v) => { dataset[k] = v; return ''; });
    els.push({ tagName: m[1].toUpperCase(), dataset, value: '', handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; } });
  }
  return {
    els,
    scrollTop: 0,
    innerHTML: '',
    querySelectorAll: sel => (sel === '[data-vlv]' ? els : []),
    querySelector: () => null
  };
};

test('IE routes every Valve URL to the site and other places still link to it', () => {
  allRoutes().forEach(u => assert.strictEqual(ie.identifyPageKey(u), 'valve', u));
  assert.ok(ie.searchDirectory.find(c => c.title === 'Компьютерные игры').sites.some(([u]) => u === base));
  assert.ok(ie.performSearch('valve').some(r => r.url === base));
  assert.ok(window.retroSites.getWebRingSites().some(s => s.url === base));
  assert.ok(window.retroSites.renderYandex('http://www.yandex.ru/search?q=valve').includes(base));
  assert.ok(window.steamSite.renderSite('http://www.steampowered.com').includes(base));
  assert.ok(window.clippyHelp.search('valve гравипушка киркланд').some(h => h.entry.id === 'valve-site'));
  assert.ok(window.clippyTips.catalog['valve-cabal']);
  const valvePerson = window.OutlookMail.people.find(p => p.addr === 'letters@valvesoftware.com');
  assert.ok(valvePerson);
  assert.strictEqual(valvePerson.topics.length, 3);
  assert.strictEqual(valvePerson.stages.length, 2);
  assert.ok(!/Стелли|Антонов|Бёрдвелл и|Лэйдлоу/.test(JSON.stringify(valvePerson)), 'Outlook replies use invented staff');
});

test('Every route renders its own page and titles follow the page', () => {
  assert.ok(site.renderSite(base).includes('vlv-log'));
  assert.ok(site.renderSite(base + '/games').includes('vlv-ledger'));
  assert.ok(site.renderSite(base + '/game?id=hl2').includes('vlv-buybox'));
  assert.ok(site.renderSite(base + '/news').includes('vlv-archive'));
  assert.ok(site.renderSite(base + '/article?id=hl2-release').includes('vlv-sprocket'));
  assert.ok(site.renderSite(base + '/lab').includes('vlv-crt'));
  assert.ok(site.renderSite(base + '/lab').includes('vlv-route'));
  assert.ok(site.renderSite(base + '/company').includes('vlv-history'));
  assert.ok(site.renderSite(base + '/letters').includes('valve-letter-text'));
  assert.strictEqual(site.getPageTitle(base + '/game?id=dota'), 'Dota 98 - Valve Software');
  assert.ok(site.getPageTitle(base + '/article?id=steam-open').startsWith('Steam открыт для всех'));
  assert.strictEqual(site.parseRoute(base + '/hl2').params.id, 'hl2');
  assert.strictEqual(site.parseRoute(base + '/jobs').page, 'company');
  assert.strictEqual(site.parseRoute(base + '/mail').page, 'letters');
});

test('Products match the game catalog: price, size and executable', () => {
  assert.deepStrictEqual(data.projects.map(p => p.id), ['half-life', 'hl2', 'steam', 'dota']);
  data.projects.forEach(p => {
    const g = gmCatalog[p.id];
    assert.ok(g, p.id);
    assert.strictEqual(p.exePath.split('\\').pop(), g.targetExe, p.id);
    if (g.price > 0) assert.strictEqual(p.priceText, g.priceDisplay, p.id);
    assert.ok(p.sizeText.startsWith(g.fileSize.split(' (')[0]), p.id);
    assert.ok(p.tables.length >= 1 && p.features.length >= 4 && p.about.length >= 2, p.id);
    p.shots.forEach(s => assert.ok(fs.existsSync(path.join(root, s.src)), s.src));
    if (g.shots) p.shots.forEach((s, i) => assert.strictEqual(s.caption, g.shots[i], p.id));
  });
  assert.ok(fs.existsSync(path.join(root, data.feature.shot)));
});

test('Game facts follow the game code, not the old site', () => {
  const hl2Src = read('js/apps/hl2/h2-data.js');
  const hl2 = JSON.stringify(data.projects.find(p => p.id === 'hl2')) + JSON.stringify(data.news);
  assert.ok(/barrel_red:[^\n]*mass: 36/.test(hl2Src) && /radiator:[^\n]*mass: 35/.test(hl2Src));
  assert.ok(hl2.includes('36 кг') && hl2.includes('260 кг') && hl2.includes('120'));
  ['65 кг', '55 кг', 'гаусс', 'турбо', '60°–110°', 'USP', 'SPAS'].forEach(bad => assert.ok(!hl2.includes(bad), `hl2 text has ${bad}`));

  const hl98 = JSON.stringify(data.projects.find(p => p.id === 'half-life')) + JSON.stringify(data.lab.atlas.filter(a => a.project === 'Half-Life 98'));
  const world = read('js/apps/half-life/world.js');
  data.lab.atlas.filter(a => a.project === 'Half-Life 98').forEach(a => a.rooms.forEach(r => assert.ok(world.includes(r), r)));
  ['crossfire', 'snark_pit', 'HEV', 'Glock', 'решётк'].forEach(bad => assert.ok(!hl98.includes(bad), `hl98 text has ${bad}`));
  assert.ok(hl98.includes('1,21 м') && hl98.includes('0,9'));

  const dotaSrc = read('js/apps/dota/dota-data.js');
  const dota = data.projects.find(p => p.id === 'dota');
  dota.tables[0].rows.forEach(([hero, , abilities]) => {
    assert.ok(dotaSrc.includes(`'${hero}'`), hero);
    abilities.replace(/ \([DF]\)/g, '').split(/, |; /).forEach(ab => assert.ok(dotaSrc.includes(ab.replace(/'/g, "\\'")), `${hero}: ${ab}`));
  });
  const dotaText = JSON.stringify(dota) + JSON.stringify(data.news) + JSON.stringify(data.cabal);
  ['-spawn', '-roshan', 'Garena', 'Proximity Mines', 'Storm Bolt', 'Пассивный'].forEach(bad => assert.ok(!dotaText.includes(bad), `dota text has ${bad}`));
  const core = read('js/apps/dota/dota-core.js');
  ['-gold', '-lvlup', '-refresh', '-wtf', '-unwtf', '-respawn', '-startgame', '-kill', '-win'].forEach(c => assert.ok(core.includes(`case '${c.slice(1)}'`), c));

  const steamSrc = read('js/apps/steam.js');
  data.steamSetup.lines.forEach(l => assert.ok(steamSrc.includes(`label: '${l.label}', kbps: ${l.kbps}`), l.label));
  data.steamSetup.mirrors.forEach(m => assert.ok(steamSrc.includes(`'${m.name}'`), m.name));
  ['WIN98SE', 'CYBER1998'].forEach(c => assert.ok(steamSrc.includes(`'${c}'`)));
  assert.ok(!data.news.some(n => /Гейб Ньюэлл|Майк Харрингтон|Кен Бёрдвелл|IceFrog/.test(n.author)), 'real people are not bylines');
});

test('Status box follows Steam rules for every state', () => {
  resetState();
  let html = site.renderSite(base + '/game?id=hl2');
  assert.ok(html.includes('Есть в магазине Steam') && html.includes('Открыть в Steam'));
  site.productAction('hl2');
  assert.strictEqual(lastSteam, 'hl2');
  owned.add('hl2');
  assert.ok(site.renderSite(base + '/game?id=hl2').includes('Загрузить в Steam'));
  window.appSteam.downloads.set('hl2', { doneKB: 64, totalKB: 100, paused: false });
  assert.ok(site.renderSite(base + '/game?id=hl2').includes('Загружается в Steam: 64%'));
  window.appSteam.downloads.set('hl2', { doneKB: 64, totalKB: 100, paused: true });
  assert.ok(site.renderSite(base + '/game?id=hl2').includes('64%, пауза'));
  window.appSteam.downloads.clear();
  installed.add('hl2');
  html = site.renderSite(base + '/game?id=hl2');
  assert.ok(html.includes('Запустить HL2.EXE') && html.includes('Страница игры в Steam'));
  site.productAction('hl2');
  assert.strictEqual(lastLaunch, 'hl2');
  assert.ok(site.renderSite(base).includes('Установлено<br><b>1 из 4</b>'));

  resetState();
  html = site.renderSite(base + '/game?id=steam');
  assert.ok(html.includes('Скачать на steampowered.com') && html.includes('Как установить Steam'));
  assert.ok(html.includes('3 мин 42 с'), 'SteamInstall on 56K takes about four minutes like steampowered.com says');
  downloaded.add('steam');
  site.productAction('steam');
  assert.strictEqual(lastWizard, 'steam');
  installed.add('steam');
  assert.ok(site.renderSite(base + '/game?id=steam').includes('Запустить Steam'));
  site.productAction('steam');
  assert.strictEqual(steamClientOpened, 1);
  resetState();
});

test('Home log, news filter, screenshots and poll', () => {
  global.localStorage.clear();
  site.newsFilter = 'all';
  const home = site.renderSite(base);
  assert.ok(home.includes('Half-Life 2 в продаже'));
  assert.ok(home.includes('20.11.2000'));
  site.setNewsFilter('Dota 98');
  let news = site.renderSite(base + '/news');
  assert.ok(news.includes('Dota 98: The Techies Update') && !news.includes('Шестнадцать залов'));
  site.setNewsFilter('nonsense');
  assert.strictEqual(site.newsFilter, 'all');
  news = site.renderSite(base + '/news');
  assert.ok(news.includes('Ноябрь 2000') && news.includes('Июль 2000'));

  site.votePoll('hl2');
  assert.ok(site.renderSite(base).includes('Ваш голос учтён'));
  site.votePoll('nope');
  assert.strictEqual(JSON.parse(localStorage.getItem(site.pollStorageKey)).extraVotes.hl2, 1);
  site.resetPoll();
  assert.ok(!site.renderSite(base).includes('Ваш голос учтён'));

  site.setShot('hl2', 1);
  assert.ok(site.renderSite(base + '/game?id=hl2').includes('<img src="content/steam/hl2-2.jpg" width="320"'));
  site.setShot('hl2', 0);
});

test('Test chamber uses the game damage rules and exports a protocol', () => {
  vfsFiles.clear();
  lastNotepad = null;
  site.setLabWeapon('grav_sawblade');
  site.setLabTarget('fast_zombie');
  let calc = site.computeBallistics();
  assert.strictEqual(calc.effectiveDamage, 120);
  assert.strictEqual(calc.hitsToKill, 1);

  site.setLabWeapon('pistol_hl2');
  site.setLabTarget('headcrab_hl2');
  assert.strictEqual(site.computeBallistics().hitsToKill, 2);

  site.setLabTarget('antlion_guard');
  calc = site.computeBallistics();
  assert.strictEqual(calc.effectiveDamage, 2);

  site.setLabTarget('strider');
  calc = site.computeBallistics();
  assert.ok(calc.immune && calc.hitsToKill === 0);
  assert.ok(site.renderSite(base + '/lab').includes('ИТОГ: этим не уничтожить'));

  site.setLabWeapon('rpg_laser');
  assert.strictEqual(site.computeBallistics().hitsToKill, 7);
  const rocketLab = site.renderSite(base + '/lab');
  assert.ok(rocketLab.includes('Страйдер (7 ракет)') && rocketLab.includes('1 ракета') && rocketLab.includes('2 ракеты'));
  site.setLabTarget('gunship');
  assert.strictEqual(site.computeBallistics().hitsToKill, 5);
  site.setLabWeapon('ar2_ball');
  assert.ok(site.computeBallistics().immune);

  site.setLabWeapon('super_gravgun');
  site.setLabTarget('combine_elite');
  assert.strictEqual(site.computeBallistics().hitsToKill, 1);

  site.setLabWeapon('pistol_hl1');
  site.setLabTarget('strider');
  calc = site.computeBallistics();
  assert.strictEqual(calc.target.game, 'Half-Life 98', 'targets follow the weapon game');
  site.setLabTarget('vortigaunt');
  assert.strictEqual(site.computeBallistics().hitsToKill, 6);
  const lab = site.renderSite(base + '/lab');
  assert.ok(!lab.includes('value="strider"'), 'HL2 targets hidden for HL98 weapons');

  site.exportLabReport();
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\VALVE_LAB_REPORT.TXT'));
  assert.strictEqual(lastNotepad.title, 'VALVE_LAB_REPORT.TXT');
  assert.ok(lastNotepad.content.includes('ПРОТОКОЛ ИСПЫТАНИЯ'));
  assert.deepStrictEqual(lastNotepad.filePath, ['My Computer', 'C:', 'My Documents']);

  site.setAtlasSector('hl1-sectorc');
  assert.ok(site.renderSite(base + '/lab').includes('SECTOR C / ARRIVAL'));
  site.exportAtlasGuide('hl1-sectorc');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\VALVE_ATLAS_SECTOR_C.TXT'));
  site.labWeaponId = 'grav_sawblade';
  site.labTargetId = 'fast_zombie';
});

test('Press releases, reader comments and letters', () => {
  global.localStorage.clear();
  vfsFiles.clear();
  site.exportArticleTxt('hl2-release');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\VALVE_PR_2000_11.TXT'));
  assert.ok(lastNotepad.content.includes('ПРЕСС-РЕЛИЗ PR-2000-11'));
  assert.ok(lastNotepad.content.split('\r\n').every(l => l.length <= 72), 'printout lines fit 72 columns');

  assert.strictEqual(site.submitComment('hl2-release', 'Gordon', '   '), false);
  assert.strictEqual(site.submitComment('hl2-release', 'Gordon<script>', 'Пила в Рейвенхолме работает!'), true);
  const art = site.renderSite(base + '/article?id=hl2-release');
  assert.ok(art.includes('Gordon&lt;script&gt;') && !art.includes('Gordon<script>'));
  assert.ok(art.includes('Отзывы читателей (1)'));

  assert.strictEqual(site.submitLetter('Илья', 'hl98', ''), false);
  assert.strictEqual(site.submitLetter('Илья', 'hl98', 'Как пройти вортигонта?'), true);
  const letters = site.renderSite(base + '/letters');
  assert.ok(letters.includes('Как пройти вортигонта?') && letters.includes('Отвечает Нил Барроу'));
  assert.ok(letters.indexOf('Как пройти вортигонта?') < letters.indexOf('Начала игру'));
});

test('Search finds products, releases, briefs and atlas sectors', () => {
  site.submitSearch('Рейвенхолм');
  let html = site.renderSite(base + '/search?q=' + encodeURIComponent('Рейвенхолм'));
  assert.ok(html.includes('Найдено страниц:') && html.includes('Half-Life 2'));
  assert.ok(html.includes('data-vlv="sectorGo"'));
  html = site.renderSite(base + '/search?q=' + encodeURIComponent('промокоды'));
  assert.ok(html.includes('Покупка по карте'));
  assert.ok(site.renderSite(base + '/search?q=no_such_lambda_token').includes('ничего не найдено'));
  ['гравипушка', 'Рейвенхолм', 'вортигонт', 'Techies', 'модем'].forEach(q => {
    assert.ok(!site.renderSite(base + '/search?q=' + encodeURIComponent(q)).includes('ничего не найдено'), q);
  });
});

test('Every data-vlv control is wired by attachEvents and runs without errors', () => {
  resetState();
  global.localStorage.clear();
  allRoutes().forEach(u => {
    const html = site.renderSite(u);
    const box = fakeContainer(html);
    site.attachEvents(null, box, null);
    box.els.forEach(el => {
      const type = el.tagName === 'SELECT' ? 'change' : (el.tagName === 'FORM' ? 'submit' : 'click');
      assert.ok(el.handlers[type], `${u} ${el.dataset.vlv}`);
      if (el.tagName === 'SELECT') el.value = el.dataset.vlv === 'weapon' ? 'grav_barrel' : 'zombie_hl2';
      el.handlers[type]({ preventDefault: () => {} });
    });
    site.currentUrl = u;
  });
  site.lastContainer = null;
  site.labWeaponId = 'grav_sawblade';
  site.labTargetId = 'fast_zombie';
  resetState();
});

test('Web 1.0 rules: no emoji, Microslop and Win naming, period CSS, zero comments', () => {
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  allRoutes().forEach(u => {
    const html = site.renderSite(u);
    assert.ok(!EMOJI.test(html), `emoji on ${u}`);
    assert.ok(!/\bMicrosoft\b/i.test(html), `Microsoft on ${u}`);
    assert.ok(!/\bWindows\b/i.test(html), `Windows on ${u}`);
    assert.ok(!html.includes('undefined') && !html.includes('NaN') && !html.includes('[object'), `bad value on ${u}`);
    assert.ok(!/onclick=/.test(html), `inline handler on ${u}`);
  });
  const css = read('css/apps/valve-site.css');
  ['border-radius', 'box-shadow', 'rgba(', 'linear-gradient', 'radial-gradient', 'blur(', 'transition', 'animation', 'opacity'].forEach(p => {
    assert.ok(!css.includes(p), `forbidden ${p}`);
  });
  assert.ok(!/\/\*|\*\//.test(css), 'comments in css/apps/valve-site.css');
  ['js/apps/valve-data.js', 'js/apps/valve-site.js', 'tests/valve-site.test.js'].forEach(f => {
    assert.ok(!/\/\*|\*\/|^\s*\/\//m.test(read(f)), `comments in ${f}`);
  });
  const index = read('index.html');
  assert.ok(index.indexOf('js/apps/valve-data.js') > 0 && index.indexOf('js/apps/valve-data.js') < index.indexOf('js/apps/valve-site.js'));
});

console.log(`\nALL ${passed} VALVE SOFTWARE SITE TESTS PASSED`);
