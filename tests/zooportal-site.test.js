const fs = require('fs');
const path = require('path');
const assert = require('assert');

global.localStorage = {
  store: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

let soundClicks = 0;
let soundDings = 0;
let lastNotepadDoc = null;
const vfsFiles = new Map();

global.window = {
  isOnline: true,
  addEventListener: () => {},
  webGif: (name) => `<span class="gif-${name}"></span>`,
  soundSys: {
    playClick: () => { soundClicks++; },
    playDing: () => { soundDings++; }
  },
  winManager: {
    windows: new Map(),
    openDialog: () => {},
    createWindow: () => ({})
  },
  vfs: {
    mkdir: () => {},
    writeFile: (folderArr, fileName, content) => {
      vfsFiles.set(folderArr.join('\\') + '\\' + fileName, content);
      return true;
    }
  },
  appNotepad: {
    open: (title, content) => {
      lastNotepadDoc = { title, content };
    }
  }
};

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/zooportal-site.js'));
eval(read('js/apps/ie.js'));

const ie = window.appIE;
const site = window.zooportalSite;
const base = 'http://www.zooportal98.ru';
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

test('IE identifies zooportal98.ru and lists it in Поиск и порталы', () => {
  assert.strictEqual(ie.identifyPageKey(base), 'zooportal');
  assert.strictEqual(ie.identifyPageKey('http://www.zooportal98.ru/atlas'), 'zooportal');
  assert.strictEqual(ie.identifyPageKey('http://www.zooportal98.ru/aquarium'), 'zooportal');
  assert.ok(ie.getPageTitle('zooportal').includes("ЗооПортал '98"));

  const portalsCat = ie.searchDirectory.find(c => c.title === 'Поиск и порталы');
  assert.ok(portalsCat, 'Поиск и порталы category must exist');
  const found = portalsCat.sites.find(([url]) => url === 'http://www.zooportal98.ru');
  assert.ok(found, 'zooportal98.ru must be listed in Поиск и порталы');
  assert.strictEqual(found[1], "ЗооПортал '98");
});

test('WebSeeker, Rambler Top100, Yandex and WebRing include ЗооПортал 98', () => {
  const results = ie.performSearch('животные');
  assert.ok(results.some(r => r.url === 'http://www.zooportal98.ru'));

  const resultsAquarium = ie.performSearch('аквариум');
  assert.ok(resultsAquarium.some(r => r.url === 'http://www.zooportal98.ru'));

  const ramblerHtml = ie.renderRambler();
  assert.ok(ramblerHtml.includes('http://www.zooportal98.ru'));

  const yandexHtml = window.retroSites.renderYandex('http://www.yandex.ru/?q=животные');
  assert.ok(yandexHtml.includes('http://www.zooportal98.ru'));

  const ringSites = window.retroSites.getWebRingSites();
  assert.ok(ringSites.some(s => s.url === 'http://www.zooportal98.ru'));
});

test('Home page renders 6 field stations, radar SVG, thematic axes, Kalitniki prices and poll', () => {
  assert.strictEqual(site.biomes.length, 6);
  const html = site.renderSite(base + '/?biome=baikal');
  assert.ok(html.includes('ЗООПОРТАЛ ’98'));
  assert.ok(html.includes('Озеро Байкал и Ушканьи острова'));
  assert.ok(html.includes('148.210 МГц'));
  assert.ok(html.includes('Птичий рынок'));
  assert.ok(html.includes('Ведущая идея (Premise)'));
  assert.ok(!EMOJI.test(html), 'No emoji allowed on Zooportal home page');

  const updatedPoll = site.savePollVote('aquarium');
  assert.strictEqual(updatedPoll.votedChoice, 'aquarium');
});

test('Atlas page renders 12 species with SVG illustrations, ethological Lie/Truth and VFS export', () => {
  assert.strictEqual(site.species.length, 12);
  const html = site.renderSite(base + '/atlas?cat=redbook&sp=baikal-nerpa');
  assert.ok(html.includes('Байкальская нерпа'));
  assert.ok(html.includes('Pusa sibirica'));
  assert.ok(html.includes('Народный миф (The Lie)'));
  assert.ok(html.includes('Биологическая истина (The Truth)'));
  assert.ok(!EMOJI.test(html), 'No emoji allowed on Zooportal atlas page');

  const savedFile = site.saveSpeciesToVfs('amur-tiger');
  assert.strictEqual(savedFile, 'ZOO_ATLAS_AMUR_TIGER_98.TXT');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\ZOO_ATLAS_AMUR_TIGER_98.TXT'));
});

test('Aquarium workbench detects incompatible species and exports passport to VFS', () => {
  site.aquaTankLiters = 100;
  site.aquaTempC = 24;
  site.aquaFilterMode = 'airlift';
  site.aquaSelectedFish = ['neon', 'corydoras', 'ampullaria'];
  const safeDiag = site.evaluateAquarium();
  assert.strictEqual(safeDiag.status, 'ok');

  site.aquaSelectedFish = ['barb', 'angelfish'];
  const conflictDiag = site.evaluateAquarium();
  assert.strictEqual(conflictDiag.status, 'danger');
  assert.ok(conflictDiag.dangers.some(d => d.includes('обкусывают длинные вуалевые плавники')));

  site.aquaSelectedFish = ['goldfish', 'angelfish'];
  const tempDiag = site.evaluateAquarium();
  assert.strictEqual(tempDiag.status, 'danger');
  assert.ok(tempDiag.dangers.some(d => d.includes('золотая рыбка')));

  const savedPassport = site.saveAquariumToVfs();
  assert.strictEqual(savedPassport, 'AQUARIUM_PASSPORT_98.TXT');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\AQUARIUM_PASSPORT_98.TXT'));

  site.rationPetType = 'dog';
  site.rationWeightKg = 25;
  site.rationActivity = 'active';
  const ration = site.calculatePetRation();
  assert.ok(ration.normText.includes('Говяжья обрезь'));
  assert.ok(ration.costMonth.includes('руб./месяц'));

  const html = site.renderSite(base + '/aquarium');
  assert.ok(!EMOJI.test(html), 'No emoji allowed on Zooportal aquarium page');
});

test('Expeditions and Article pages render 8 field reports and persist reader comments', () => {
  assert.strictEqual(site.articles.length, 8);
  const expHtml = site.renderSite(base + '/expeditions');
  assert.ok(expHtml.includes('Семь километров по следу Амбы'));
  assert.ok(!EMOJI.test(expHtml), 'No emoji allowed on Zooportal expeditions page');

  site.addArticleComment('terney-tiger-98', 'Следопыт_ДВ', 'В Тернейском районе этой зимой видели три перехода!');
  const artHtml = site.renderSite(base + '/article?id=terney-tiger-98');
  assert.ok(artHtml.includes('Следопыт_ДВ'));
  assert.ok(artHtml.includes('В Тернейском районе этой зимой видели три перехода!'));
  assert.ok(!EMOJI.test(artHtml), 'No emoji allowed on Zooportal article page');
});

test('VetClinic page renders 6 triage cases and builds Field Naturalist Diary for VFS export', () => {
  assert.strictEqual(site.vetCases.length, 6);
  site.activeVetCaseId = 'bird-fledgling';
  site.activeDiaryBiomeId = 'ussuri';
  site.activeDiaryArcId = 'change-positive';
  site.activeDiaryMotifId = 'tracks';

  const html = site.renderSite(base + '/vetclinic');
  assert.ok(html.includes('пушистый птенец вороны'));
  assert.ok(html.includes('СЛЁТОК'));
  assert.ok(!EMOJI.test(html), 'No emoji allowed on Zooportal vetclinic page');

  const savedDiary = site.saveDiaryToVfs();
  assert.strictEqual(savedDiary, 'FIELD_DIARY_1998.TXT');
  assert.ok(vfsFiles.has('My Computer\\C:\\My Documents\\FIELD_DIARY_1998.TXT'));
});

test('Club page renders 1998 Swap Board, escapes HTML in guestbook and generates zoologist auto-reply', () => {
  const beforeCount = site.getGuestbookEntries().length;
  site.addGuestbookEntry('Алёна_СПб', 'Санкт-Петербург', 'Стайка неонов', 'aqua', 'Подскажите параметры воды для неонов <script>alert(1)</script>');
  const afterEntries = site.getGuestbookEntries();
  assert.strictEqual(afterEntries.length, beforeCount + 1);
  assert.ok(afterEntries[0].reply.includes('Отвечает секция аквариумистов'));

  const html = site.renderSite(base + '/club');
  assert.ok(html.includes('Алёна_СПб'));
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!EMOJI.test(html), 'No emoji allowed on Zooportal club page');
});

test('Web 1.0 CSS, Microslop/Win naming and Zero Comments policy are strictly enforced', () => {
  const css = read('css/apps/zooportal-site.css');
  const js = read('js/apps/zooportal-site.js');

  for (const banned of ['border-radius', 'linear-gradient', 'radial-gradient', 'rgba(', 'blur(', 'transition:']) {
    assert.ok(!css.includes(banned), `CSS must not contain ${banned}`);
  }

  assert.ok(!/Microsoft|Windows/i.test(js), 'JS must use Microslop and Win instead of real brand names');
  assert.ok(!/Microsoft|Windows/i.test(css), 'CSS must not contain real brand names');
  assert.ok(!/\/\*/.test(css), 'CSS must contain zero comments');
  assert.ok(!/\/\*/.test(js), 'JS must contain zero block comments');
});

console.log(`All ${passed} Zooportal '98 tests passed!`);
