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
    },
    createFile: (folderArr, fileName, content) => {
      vfsFiles.set(folderArr.join('\\') + '\\' + fileName, content);
      return true;
    }
  },
  appNotepad: {
    open: (title, content) => {
      lastNotepadDoc = { title, content };
    },
    openWithContent: (title, content) => {
      lastNotepadDoc = { title, content };
    }
  }
};

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/geocities-site.js'));
eval(read('js/apps/ie.js'));

const ie = window.appIE;
const site = window.geocitiesSite;
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok -', name); };
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

test('GeoCitiesSite initializes 10 neighborhoods, 4 thematic axes, and 18 residents (17 full pages + dima_web)', () => {
  assert.ok(site, 'window.geocitiesSite must exist');
  assert.strictEqual(site.NEIGHBORHOODS.length, 10);
  assert.strictEqual(site.THEMATIC_AXES.length, 4);
  assert.strictEqual(site.getResidents(true).length, 18);
  assert.strictEqual(site.getResidents(false).length, 17);

  const layouts = new Set(site.getResidents(false).map(r => r.layout));
  assert.strictEqual(layouts.size, 17, 'All 17 full resident pages must have distinct layout classes');
});

test('InternetExplorer routes all GeoCities portal and resident URLs accurately', () => {
  assert.strictEqual(ie.identifyPageKey('http://www.geocities.com'), 'geocities');
  assert.strictEqual(ie.identifyPageKey('http://www.geocities.com/directory'), 'geocities');
  assert.strictEqual(ie.identifyPageKey('http://www.geocities.com/themes'), 'geocities');
  assert.strictEqual(ie.identifyPageKey('http://www.geocities.com/webring'), 'geocities');
  assert.strictEqual(ie.identifyPageKey('http://www.geocities.com/builder'), 'geocities');
  assert.strictEqual(ie.identifyPageKey('http://www.geocities.com/dima_web/'), 'dima_webmaster');

  for (const h of site.NEIGHBORHOODS) {
    assert.strictEqual(ie.identifyPageKey(`http://www.geocities.com/hood?id=${h.id}`), 'geocities');
  }
  for (const res of site.getResidents(false)) {
    assert.strictEqual(ie.identifyPageKey(res.url), 'geocities', `Expected ${res.url} to route to geocities`);
  }
});

test('Portal views (Home, 10 Neighborhoods, Directory, Themes Atlas, WebRing, Builder) render without emoji', () => {
  const portalUrls = [
    'http://www.geocities.com',
    'http://www.geocities.com/directory',
    'http://www.geocities.com/themes',
    'http://www.geocities.com/webring',
    'http://www.geocities.com/builder',
    ...site.NEIGHBORHOODS.map(h => `http://www.geocities.com/hood?id=${h.id}`)
  ];

  for (const url of portalUrls) {
    const html = ie.renderGeoCities(url);
    assert.ok(html.length > 500, `Expected substantial HTML for ${url}`);
    assert.strictEqual(EMOJI.test(html), false, `Portal URL ${url} must not contain raw emoji`);
  }
});

test('Every resident homepage renders its distinct layout, interactive widget states, arc passport, guestbook, and VFS/Notepad artifact', () => {
  for (const res of site.getResidents(false)) {
    const html0 = ie.renderGeoCities(res.url);
    assert.ok(html0.includes(`gc-res-${res.layout}`), `Resident ${res.slug} must render .gc-res-${res.layout}`);
    assert.ok(html0.includes(site.esc(res.ghostWound)), `Resident ${res.slug} must include Ghost/Wound`);
    assert.ok(html0.includes(site.esc(res.lie)), `Resident ${res.slug} must include Lie`);
    assert.ok(html0.includes(site.esc(res.truth)), `Resident ${res.slug} must include Truth`);
    assert.ok(html0.includes(site.esc(res.motif)), `Resident ${res.slug} must include Motif`);
    assert.strictEqual(EMOJI.test(html0), false, `Resident ${res.slug} must not contain raw emoji`);

    site.widgetState[res.slug] = 1;
    const html1 = ie.renderGeoCities(res.url);
    assert.notStrictEqual(html0, html1, `Resident ${res.slug} widget state change should update rendered output`);

    const saved = site.saveArtifactToVfs(res, true);
    assert.strictEqual(saved, res.artifactName);
    assert.ok(vfsFiles.has(`My Computer\\C:\\My Documents\\${res.artifactName}`));
    assert.ok(lastNotepadDoc && lastNotepadDoc.title === res.artifactName);

    const added = site.addGuestbookEntry(res.slug, 'Tester98', `Привет жителю ${res.slug}!`);
    assert.strictEqual(added, true);
    const htmlAfterGb = ie.renderGeoCities(res.url);
    assert.ok(htmlAfterGb.includes(`Привет жителю ${res.slug}!`));
  }
});

test('Custom user pages and classic sample page seeding remain fully functional', () => {
  site.seedClassicSampleInStorage('http://www.geocities.com/SiliconValley/Pico/1998/index.html');
  const stored = site.loadCustomPages();
  assert.ok(stored['SiliconValley/Pico/1998/index.html']);

  stored['Area51/my_custom_ufo_home.html'] = {
    neighborhood: 'Area51',
    title: 'My Custom UFO Lair 98',
    author: 'SkyWatcher98',
    bgStyle: 'space',
    content: 'Saw three lights over Izmailovo Park.'
  };
  site.saveCustomPages(stored);

  const customHtml = ie.renderGeoCities('http://www.geocities.com/Area51/my_custom_ufo_home.html');
  assert.ok(customHtml.includes('My Custom UFO Lair 98'));
  assert.ok(customHtml.includes('SkyWatcher98'));
  assert.ok(customHtml.includes('Saw three lights over Izmailovo Park.'));
});

test('Search98 and Yandex find GeoCities and its residents', () => {
  const s1 = ie.performSearch('geocities');
  assert.ok(s1.some(r => r.url === 'http://www.geocities.com'));

  const s2 = ie.performSearch('марьиванна фиалки');
  assert.ok(s2.some(r => r.url === 'http://www.geocities.com'));

  const yandexHtml = window.retroSites.renderYandex('http://www.yandex.ru/?q=' + encodeURIComponent('геоситис'));
  assert.ok(yandexHtml.includes('http://www.geocities.com'));
});

test('Index linking, Web 1.0 CSS rules, Microslop/Win naming, and strict zero-comments policy', () => {
  const indexHtml = read('index.html');
  assert.ok(indexHtml.includes('css/apps/geocities-site.css'));
  assert.ok(indexHtml.includes('js/apps/geocities-site.js'));

  const jsCode = read('js/apps/geocities-site.js');
  const cssCode = read('css/apps/geocities-site.css');

  for (const [rel, code] of [['js/apps/geocities-site.js', jsCode], ['css/apps/geocities-site.css', cssCode], ['tests/geocities-site.test.js', read('tests/geocities-site.test.js')]]) {
    code.split('\n').forEach((line, idx) => {
      const trimmed = line.trim();
      assert.ok(!trimmed.startsWith('//'), `Line comment in ${rel}:${idx + 1}`);
      assert.ok(!trimmed.startsWith('/*'), `Block comment in ${rel}:${idx + 1}`);
      assert.ok(!trimmed.startsWith('*'), `Asterisk comment in ${rel}:${idx + 1}`);
      assert.ok(!trimmed.startsWith('<!--'), `HTML comment in ${rel}:${idx + 1}`);
    });
  }
  assert.strictEqual(/border-radius|linear-gradient|radial-gradient|rgba\(|transition:/i.test(cssCode), false, 'geocities-site.css must follow Web 1.0 rules');
  assert.strictEqual(/\bMicrosoft\b/i.test(jsCode), false, 'geocities-site.js must use Microslop instead of Microsoft');
});

console.log(`\nALL ${passed} GEOCITIES 98 TESTS PASSED!`);
