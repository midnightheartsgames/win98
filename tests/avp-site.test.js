const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Testing Kaspersky Lab (AVP 3.0) Site (www.avp.ru) & SoftStore 98 Migration ---');

global.localStorage = {
  store: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

let pigSqueals = 0;
let chords = 0;
let errors = 0;
let lastNotepadDoc = null;
const vfsFiles = new Map();

global.Icons = new Proxy({}, { get: () => '<svg></svg>' });

let desktopTrojanPresent = true;

global.document = {
  querySelector(sel) {
    if (sel === '.desktop-icon[data-app="totally_not_a_virus"]') {
      return desktopTrojanPresent ? {
        remove() { desktopTrojanPresent = false; }
      } : null;
    }
    return null;
  }
};

global.window = {
  isOnline: true,
  Icons: global.Icons,
  getIcon: () => '<svg></svg>',
  webGif: (name) => `<span class="gif-${name}"></span>`,
  i18n: { t: (k) => k, getLang: () => 'ru' },
  addEventListener: () => {},
  removeEventListener: () => {},
  soundSys: {
    playClick: () => {},
    playDing: () => {},
    playChord: () => { chords++; },
    playError: () => { errors++; },
    playAvpPigSqueal: () => { pigSqueals++; }
  },
  dialogs: {
    alert: () => {},
    confirm: () => true
  },
  winManager: {
    windows: new Map(),
    openDialog: () => {},
    createWindow: () => ({})
  },
  vfs: {
    mkdir: () => {},
    WriteFile: (filePath, content) => {
      vfsFiles.set(filePath, content);
      return true;
    },
    writeFile: (folderArr, fileName, content) => {
      vfsFiles.set(folderArr.join('\\') + '\\' + fileName, content);
      return true;
    },
    Exists: (filePath) => vfsFiles.has(filePath),
    Delete: (filePath) => vfsFiles.delete(filePath)
  },
  appNotepad: {
    open: (title, content) => {
      lastNotepadDoc = { title, content };
    }
  },
  appAVP: {
    openCalled: 0,
    open() { this.openCalled++; },
    virusSignatures: [
      { name: 'Trojan.Win98.TotallyNotAVirus', pattern: 'totally_not_a_virus' }
    ]
  }
};

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

eval(read('js/game-manager.js'));
eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/avp-data.js'));
eval(read('js/apps/avp-site.js'));
eval(read('js/apps/ie.js'));
eval(read('js/apps/clippy-help.js'));
eval(read('js/apps/outlook-mail.js'));

const ie = window.appIE;
const site = window.avpSite;
const gm = window.gameManager;
let passed = 0;
const test = (name, fn) => {
  fn();
  passed++;
  console.log('  ok -', name);
};

function createMockContainer(initialUrl) {
  const state = {
    url: initialUrl,
    html: site.render(initialUrl),
    inputs: {},
    checked: {
      '#avp-flag-ring0': true,
      '#avp-flag-bios': true,
      '#avp-flag-macro': false,
      '#avp-flag-wsock': false,
      '#avp-flag-poly': false
    }
  };

  const elementsBySel = new Map();
  const listBySel = new Map();

  const makeEl = (key, attrs = {}) => {
    const listeners = {};
    return {
      get value() { return state.inputs[key] !== undefined ? state.inputs[key] : (attrs.value || ''); },
      set value(v) { state.inputs[key] = v; },
      get checked() { return state.checked[key] !== undefined ? state.checked[key] : Boolean(attrs.checked); },
      set checked(v) { state.checked[key] = Boolean(v); },
      get textContent() { return attrs.textContent || state.html; },
      set textContent(v) { attrs.textContent = v; },
      style: { display: 'none' },
      getAttribute(name) { return attrs[name] !== undefined ? attrs[name] : null; },
      addEventListener(evt, fn) { listeners[evt] = fn; },
      click() {
        if (listeners.click) listeners.click({ preventDefault: () => {} });
      },
      change() {
        if (listeners.change) listeners.change({ preventDefault: () => {} });
      }
    };
  };

  const registerList = (sel, items) => {
    listBySel.set(sel, items.map((attrs, idx) => makeEl(`${sel}:${idx}`, attrs)));
  };

  const container = {
    get innerHTML() { return state.html; },
    querySelector(sel) { return elementsBySel.get(sel) || null; },
    querySelectorAll(sel) { return listBySel.get(sel) || []; },
    el(sel) { return elementsBySel.get(sel); },
    list(sel) { return listBySel.get(sel) || []; },
    getUrl() { return state.url; },
    navigate(nextUrl) {
      state.url = nextUrl;
      state.html = site.render(nextUrl);
      rebuild();
    }
  };

  const rebuild = () => {
    elementsBySel.clear();
    listBySel.clear();

    const singleMap = {
      '#avp-next-banner-btn': {},
      '#avp-squeal-test-btn': {},
      '#avp-launch-app-btn': {},
      '#avp-hero-launch-btn': {},
      '#avp-store-launch-btn': {},
      '#avp-run-setup-btn': {},
      '#avp-hero-setup-btn': {},
      '#avp-store-setup-btn': {},
      '#avp-download-exe-btn': {},
      '#avp-hero-download-btn': {},
      '#avp-store-download-btn': {},
      '#avp-store-redownload-btn': {},
      '#avp-promo-input': { value: site.promoCode || '' },
      '#avp-apply-promo-btn': {},
      '#avp-order-promo-input': { value: site.promoCode || '' },
      '#avp-order-promo-btn': {},
      '#avp-store-save-keyinfo-btn': {},
      '#avp-autofill-card-btn': {},
      '#avp-pay-num': { value: '' },
      '#avp-pay-exp': { value: '' },
      '#avp-pay-cvv': { value: '' },
      '#avp-pay-name': { value: '' },
      '#avp-pay-error': {},
      '#avp-confirm-pay-btn': {},
      '#avp-poll-vote-btn': {},
      'input[name="avp_poll_opt"]:checked': { value: 'cih', checked: true },
      '#avp-enc-search-input': { value: site.encyclopediaQuery || '' },
      '#avp-enc-search-btn': {},
      '#avp-enc-filter-select': { value: site.encyclopediaFilter || 'all' },
      '#avp-export-virus-notepad-btn': { 'data-virus-id': site.activeEncyclopediaId },
      '#avp-save-virus-vfs-btn': { 'data-virus-id': site.activeEncyclopediaId },
      '#avp-lab-sample-select': { value: site.labState.sampleId },
      '#avp-flag-ring0': { checked: site.labState.ring0 },
      '#avp-flag-bios': { checked: site.labState.biosPort },
      '#avp-flag-macro': { checked: site.labState.normalDot },
      '#avp-flag-wsock': { checked: site.labState.wsockHook },
      '#avp-flag-poly': { checked: site.labState.polyXor },
      '#avp-run-emulation-btn': {},
      '#avp-export-lab-notepad-btn': {},
      '#avp-lab-terminal': { textContent: state.html },
      '#avp-webscan-run-btn': {},
      '#avp-webscan-cure-btn': {},
      '#avp-article-notepad-btn': { 'data-art-id': 'cih-anatomy' },
      '#avp-article-save-vfs-btn': { 'data-art-id': 'cih-anatomy' },
      '#avp-comment-author': { value: 'SysOp_Moscow' },
      '#avp-comment-text': { value: '' },
      '#avp-comment-submit-btn': { 'data-art-id': 'cih-anatomy' },
      '#avp-newthread-author': { value: 'Admin_2:5020' },
      '#avp-newthread-cat': { value: 'epidemics' },
      '#avp-newthread-title': { value: '' },
      '#avp-newthread-text': { value: '' },
      '#avp-newthread-submit-btn': {},
      '#avp-reply-author': { value: 'Point_777' },
      '#avp-reply-text': { value: '' },
      '#avp-reply-submit-btn': { 'data-thread-id': 'fido-cih-bios' }
    };

    Object.keys(singleMap).forEach((sel) => {
      elementsBySel.set(sel, makeEl(sel, singleMap[sel]));
    });

    registerList('.avp-enc-btn', [
      { 'data-enc': 'win1251' },
      { 'data-enc': 'koi8r' },
      { 'data-enc': 'translit' }
    ]);

    registerList('.avp-dl-avc-btn', window.avpData.avcPackages.map((p) => ({ 'data-avc-id': p.id })));
    registerList('.avp-select-virus-link', window.avpData.virusEncyclopedia.map((v) => ({ 'data-virus-id': v.id })));

    site.attachEvents(container, {}, state.url, (nextUrl) => container.navigate(nextUrl));
  };

  rebuild();
  return container;
}

test('IE routes www.avp.ru and lists Kaspersky Lab in Hardware & Security category, Search98, Rambler, Yandex, and WebRing', () => {
  assert.strictEqual(ie.identifyPageKey('http://www.avp.ru'), 'avp');
  assert.strictEqual(ie.identifyPageKey('http://www.avp.ru/store'), 'avp');
  assert.strictEqual(ie.identifyPageKey('http://www.avp98.ru/lab'), 'avp');
  assert.strictEqual(ie.identifyPageKey('http://www.kaspersky98.ru'), 'avp');
  assert.strictEqual(ie.identifyPageKey('http://www.antivirus98.com'), 'antivirus');
  assert.ok(ie.getPageTitle('avp').includes('Лаборатория Касперского'));

  const hwCat = ie.searchDirectory.find((c) => c.title === 'Железо и безопасность');
  assert.ok(hwCat, 'Железо и безопасность category exists');
  assert.ok(hwCat.sites.some((s) => s[0] === 'http://www.avp.ru'), 'www.avp.ru is in Железо и безопасность');

  const searchRes = ie.performSearch('касперский avp');
  assert.ok(searchRes.some((r) => r.url === 'http://www.avp.ru'), 'Search98 finds www.avp.ru');

  const ramblerHtml = ie.renderRambler();
  assert.ok(ramblerHtml.includes('http://www.avp.ru'), 'Rambler Top100 includes www.avp.ru');

  const yandexHtml = window.retroSites.renderYandex('http://www.yandex.ru/?q=касперский');
  assert.ok(yandexHtml.includes('http://www.avp.ru'), 'Yandex search finds www.avp.ru');

  const webringSites = window.retroSites.getWebRingSites();
  assert.ok(webringSites.some((s) => s.url === 'http://www.avp.ru'), 'WebRing includes www.avp.ru');
});

test('Purchase and download of AVP 3.0 are migrated out of SoftStore 98 onto www.avp.ru', () => {
  const softApps = ie.softStoreApps;
  assert.strictEqual(softApps.some((a) => a.id === 'avp'), false, 'AVP is removed from softStoreApps');
  assert.strictEqual(ie.getDetailItemData('avp'), null, 'AVP detail is removed from SoftStore');

  const softMainHtml = ie.renderSoftStore('http://www.softstore98.com');
  assert.ok(!softMainHtml.includes('data-soft-buy="avp"'), 'SoftStore main page does not sell AVP');
  assert.ok(softMainHtml.includes('http://www.avp.ru/store'), 'SoftStore sidebar links to AVP.ru');

  const softRedirectHtml = ie.renderSoftStore('http://www.softstore98.com/product?id=avp');
  assert.ok(softRedirectHtml.includes('http://www.avp.ru/store'), 'Old SoftStore product URL points to www.avp.ru/store');

  const avpGame = gm.catalog.avp;
  assert.ok(avpGame, 'avp exists in GameManager catalog');
  assert.strictEqual(avpGame.downloadUrl, 'http://www.avp.ru', 'AVP downloadUrl is http://www.avp.ru');
});

test('Promo code, credit card checkout, Setup_AVP.exe download, and .AVC signature updates work on www.avp.ru', () => {
  const c = createMockContainer('http://www.avp.ru/store');
  assert.ok(c.innerHTML.includes('$24.99'));

  c.el('#avp-promo-input').value = 'AVP1998';
  c.el('#avp-apply-promo-btn').click();
  assert.ok(c.innerHTML.includes('$19.99'), 'Discounted price $19.99 is shown');

  c.navigate('http://www.avp.ru/order');
  c.el('#avp-confirm-pay-btn').click();
  assert.strictEqual(gm.isPurchased('avp'), false, 'Invalid card is rejected');

  c.el('#avp-autofill-card-btn').click();
  assert.strictEqual(c.el('#avp-pay-num').value, '4276 3800 1998 2024');
  c.el('#avp-confirm-pay-btn').click();

  assert.strictEqual(gm.isPurchased('avp'), true, 'AVP 3.0 is purchased via www.avp.ru/order');
  assert.strictEqual(c.getUrl(), 'http://www.avp.ru/store?purchased=1', 'Redirects to store after payment');
  assert.ok(vfsFiles.has('C:\\My Documents\\AVP.KEY'), 'Saves license key file AVP.KEY');

  let downloadedId = null;
  const origStartDownload = gm.startDownload.bind(gm);
  gm.startDownload = (id) => { downloadedId = id; };
  c.el('#avp-store-download-btn').click();
  assert.strictEqual(downloadedId, 'avp', 'Clicking download starts Setup_AVP.exe download');
  gm.startDownload = origStartDownload;

  const avcBtns = c.list('.avp-dl-avc-btn');
  assert.ok(avcBtns.length >= 2);
  avcBtns[0].click();
  assert.ok(window.appAVP.virusSignatures.some((s) => s.name.includes('Win95.CIH.1003')), 'DAILY.AVC adds CIH signature to AppAVP');
  assert.ok(vfsFiles.has('C:\\My Documents\\Downloads\\DAILY.AVC'), 'Saves DAILY.AVC to Downloads');
});

test('Interactive CodeAnalyzer heuristics, Web-Inspector cure, VirusList encyclopedia, articles, and RU.ANTIVIRUS forum work', () => {
  const c = createMockContainer('http://www.avp.ru/lab');
  const prevSqueals = pigSqueals;
  c.el('#avp-run-emulation-btn').click();
  assert.ok(pigSqueals > prevSqueals, 'Triggers AVP pig squeal on critical heuristic detection');
  assert.ok(c.innerHTML.includes('Win95.CIH.1003'));

  desktopTrojanPresent = true;
  c.el('#avp-webscan-run-btn').click();
  assert.ok(c.innerHTML.includes('totally_not_a_virus.exe'), 'Web-Inspector detects desktop trojan');

  c.el('#avp-webscan-cure-btn').click();
  assert.strictEqual(desktopTrojanPresent, false, 'Web-Inspector removes desktop trojan');
  assert.ok(c.innerHTML.includes('УСПЕШНОЕ ЛЕЧЕНИЕ'));

  c.navigate('http://www.avp.ru/encyclopedia?id=Boot.OneHalf.3544');
  assert.ok(c.innerHTML.includes('Slovak Bomber'));
  c.el('#avp-export-virus-notepad-btn').click();
  assert.ok(lastNotepadDoc && lastNotepadDoc.content.includes('OneHalf'));

  c.navigate('http://www.avp.ru/article?id=cih-anatomy');
  c.el('#avp-comment-author').value = 'B21_Tester';
  c.el('#avp-comment-text').value = 'Проверил перемычку BIOS <script>alert(1)</script>';
  c.el('#avp-comment-submit-btn').click();
  assert.ok(c.innerHTML.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'Escapes HTML in article comments');
  assert.ok(c.innerHTML.includes('AVP_Duty_Analyst'), 'Adds Virus Lab analyst auto-reply');

  c.navigate('http://www.avp.ru/forum');
  c.el('#avp-newthread-author').value = 'SysOp_5020';
  c.el('#avp-newthread-title').value = 'Вопрос по упаковщику PKLite <b>test</b>';
  c.el('#avp-newthread-text').value = 'Распаковывает ли AVP 3.0 PKLite внутри ARJ?';
  c.el('#avp-newthread-submit-btn').click();
  assert.ok(c.getUrl().startsWith('http://www.avp.ru/thread?id=fido-user-'));
  assert.ok(c.innerHTML.includes('&lt;b&gt;test&lt;/b&gt;'), 'Escapes HTML in forum thread title');
  assert.ok(c.innerHTML.includes('Eugene_Kaspersky'), 'Eugene Kaspersky auto-replies in RU.ANTIVIRUS');
});

test('All routes obey Web 1.0 CSS rules, zero emojis, Microslop/Win naming, and zero comments policy', () => {
  const routes = [
    'http://www.avp.ru',
    'http://www.avp.ru/store',
    'http://www.avp.ru/order',
    'http://www.avp.ru/encyclopedia',
    'http://www.avp.ru/lab',
    'http://www.avp.ru/news',
    'http://www.avp.ru/article?id=cih-anatomy',
    'http://www.avp.ru/article?id=codeanalyzer-heuristics',
    'http://www.avp.ru/article?id=macro-and-happy99',
    'http://www.avp.ru/article?id=avc-architecture',
    'http://www.avp.ru/forum',
    'http://www.avp.ru/thread?id=fido-cih-bios',
    'http://www.avp.ru/about',
    'http://www.avp.ru/missing-route'
  ];

  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  routes.forEach((r) => {
    const html = site.render(r);
    assert.ok(!EMOJI.test(html), `No emoji allowed on ${r}`);
    assert.ok(!/\bMicrosoft\b/i.test(html), `No Microsoft word on ${r}`);
    assert.ok(!/\bWindows\b/i.test(html), `No Windows word on ${r}`);
  });

  const css = read('css/apps/avp-site.css');
  ['border-radius', 'box-shadow', 'rgba(', 'linear-gradient', 'radial-gradient', 'blur(', 'transition'].forEach((forbidden) => {
    assert.ok(!css.toLowerCase().includes(forbidden), `Forbidden CSS ${forbidden} in avp-site.css`);
  });

  ['css/apps/avp-site.css', 'js/apps/avp-data.js', 'js/apps/avp-site.js', 'tests/avp-site.test.js'].forEach((rel) => {
    const src = read(rel);
    assert.ok(!src.includes('/' + '*'), `Block comment found in ${rel}`);
    const lines = src.split('\n');
    lines.forEach((line, idx) => {
      assert.ok(!line.trim().startsWith('/' + '/'), `Line comment found in ${rel}:${idx + 1}`);
    });
  });
});

console.log(`\nALL ${passed} KASPERSKY LAB (AVP 3.0) TESTS PASSED!`);
